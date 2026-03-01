<?php

namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\PdfModel;
use App\Models\PdfChunkModel;
use Config\Services;

class PdfController extends BaseController
{
    protected $pdfModel;
    protected $pdfChunkModel;
    
    public function __construct()
    {
        $this->pdfModel = new PdfModel();
        $this->pdfChunkModel = new PdfChunkModel();
        helper('text');
    }
    
    public function upload()
{
    // Prevent PHP fatal timeouts from AI processing delays
    set_time_limit(0);
    
    try {
     // Get user_id from JWT token (preferred) or fallback to form data
        if (isset($this->request->user->user_id)) {
            $user_id = $this->request->user->user_id;
        } else {
            $user_id = $this->request->getPost('user_id');
        }
        
        // Validate user_id exists
        if (empty($user_id)) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'User ID is required'
            ])->setStatusCode(400);
        }

        $pdfFile = $this->request->getFile('pdf_file');

        if (!$pdfFile || !$pdfFile->isValid()) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Invalid file upload'
            ])->setStatusCode(400);
        }

        // Check file type
        $allowedMimes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'text/plain',
            'text/csv',
            'application/csv',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
        ];

        if (!in_array($pdfFile->getClientMimeType(), $allowedMimes)) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Invalid file type. Allowed types: PDF, DOCX, PPTX, TXT, CSV'
            ])->setStatusCode(400);
        }

        // Check for duplicates using file hash
        $fileHash = hash_file('sha256', $pdfFile->getTempName());
        $existingPdf = $this->pdfModel
                            ->where('user_id', $user_id)
                            ->where('file_hash', $fileHash)
                            ->first();

        if ($existingPdf) {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'PDF already exists',
                'data' => [
                    'pdf_id' => $existingPdf->pdf_id,
                    'file_name' => $existingPdf->file_name
                ]
            ])->setStatusCode(400);
        }
        // Initialize Appwrite Client
            $client = new \Appwrite\Client();
            $client
                ->setEndpoint(getenv('APPWRITE_ENDPOINT'))
                ->setProject(getenv('APPWRITE_PROJECT_ID'))
                ->setKey(getenv('APPWRITE_API_KEY'))
                ->setTimeout(600); // Prevent 30s default timeout for large 12MB+ files

            $storage = new \Appwrite\Services\Storage($client);

        // Identify file to upload to Appwrite
        $inputFile = \Appwrite\InputFile::withPath(
            $pdfFile->getTempName(), 
            $pdfFile->getClientMimeType(),
            $pdfFile->getClientName()
        );
        
        $appwriteFileId = \Appwrite\ID::unique();
        $pdfId = $this->generateUuid(); // Internal Database UUID

        // Save PDF metadata to database first
        // Save PDF metadata to database
        $pdfData = [
            'pdf_id' => $this->generateUuid(), 
            'user_id' => $user_id,
            'file_name' => $pdfFile->getClientName(),
            'file_path' => $appwriteFileId, 
            'file_hash' => $fileHash,
            'file_size' => $pdfFile->getSize(),
            'processing_status' => 'pending',
            'page_count' => 0, 
            'uploaded_at' => date('Y-m-d H:i:s')
        ];

        if (!$this->pdfModel->insert($pdfData)) {
            // Rollback Appwrite upload if DB insert fails
            try {
                $storage->deleteFile(getenv('APPWRITE_STORAGE_BUCKET_ID'), $appwriteFileId);
            } catch (\Exception $rollbackEx) {}
            throw new \Exception('Failed to save PDF metadata to database');
        }

        // 1. Prepare JSON Response (Status: pending)
        $responseData = [
            'status' => 'success',
            'message' => 'PDF uploaded successfully. Processing started.',
            'data' => [
                'pdf_id' => $pdfData['pdf_id'],
                'file_name' => $pdfData['file_name'],
                'file_size' => $pdfData['file_size'],
                'processing_status' => 'pending'
            ]
        ];

        // 2. Early Response to avoid 100s fastcgi proxy timeout on 12MB uploads
        // MUST manually inject CORS headers because we bypass CodeIgniter's After-Filter
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        
        while (ob_get_level() > 0) {
            @ob_end_clean();
        }
        
        header("Connection: close");
        ignore_user_abort(true);
        ob_start();
        echo json_encode($responseData);
        $size = ob_get_length();
        header("Content-Length: $size");
        header('Content-Type: application/json');
        @ob_end_flush();
        @flush();
        
        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        }

        // 3. BACKGROUND TASKS
        try {
            // Step A: Upload to Appwrite Storage (this blocks the background thread for 10-20 seconds on 12MB files)
            $storage->createFile(
                getenv('APPWRITE_STORAGE_BUCKET_ID'),
                $appwriteFileId,
                $inputFile
            );

            // Step B: Trigger Python processing (this blocks for 60-150 seconds)
            $this->sendToPythonProcessor($pdfData['pdf_id'], $appwriteFileId, $user_id);
            // Update status to processing/completed
            $this->pdfModel->updateProcessingStatus($pdfData['pdf_id'], 'completed'); // Assume it completed if no error
        } catch (\Exception $bgEx) {
            log_message('error', 'Background Python processing error: ' . $bgEx->getMessage());
            $this->pdfModel->updateProcessingStatus($pdfData['pdf_id'], 'failed');
        }

        // Return gracefully for the background worker thread
        return;

    } catch (\Exception $e) {
        log_message('error', 'PDF upload error: ' . $e->getMessage());

        return $this->response->setJSON([
            'status' => 'error',
            'message' => 'Upload failed: ' . $e->getMessage()
        ])->setStatusCode(500);
    }
}

    
    public function getUserPdfs()
    {
        try {
            $userId = $this->request->user->user_id;
            $pdfs = $this->pdfModel->getUserPdfs($userId);
            
            return $this->response->setJSON([
                'status' => 'success',
                'data' => $pdfs
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Get PDFs error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to retrieve PDFs'
            ])->setStatusCode(500);
        }
    }
    
    public function getPdfChunks($pdfId)
    {
        try {
            $userId = $this->request->user->user_id;
            
            // Verify PDF belongs to user
            $pdf = $this->pdfModel->getPdfById($pdfId, $userId);
            if (!$pdf) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'PDF not found or access denied'
                ])->setStatusCode(404);
            }
            
            $chunks = $this->pdfChunkModel->getPdfChunks($pdfId);
            
            return $this->response->setJSON([
                'status' => 'success',
                'data' => [
                    'pdf' => $pdf,
                    'chunks' => $chunks
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Get PDF chunks error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to retrieve PDF chunks'
            ])->setStatusCode(500);
        }
    }
    
    public function deletePdf($pdfId)
    {
        try {
            $userId = $this->request->user->user_id;
            
            // Verify PDF belongs to user
            $pdf = $this->pdfModel->getPdfById($pdfId, $userId);
            if (!$pdf) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'PDF not found or access denied'
                ])->setStatusCode(404);
            }
            
            // Delete file from Appwrite storage
            try {
                $client = new \Appwrite\Client();
                $client
                    ->setEndpoint(getenv('APPWRITE_ENDPOINT'))
                    ->setProject(getenv('APPWRITE_PROJECT_ID'))
                    ->setKey(getenv('APPWRITE_API_KEY'));

                $storage = new \Appwrite\Services\Storage($client);
                $storage->deleteFile(getenv('APPWRITE_STORAGE_BUCKET_ID'), $pdf->file_path);
            } catch (\Exception $ex) {
                log_message('error', 'Failed to delete file from Appwrite: ' . $ex->getMessage());
                // Still proceed to delete from DB even if Appwrite deletion fails to avoid orphaned DB records
            }
            
            // Delete from database (cascade will handle chunks and embeddings)
            $this->pdfModel->delete($pdfId);
            
            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'PDF deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Delete PDF error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to delete PDF'
            ])->setStatusCode(500);
        }
    }
    
    public function getPdfStatus($pdfId)
    {
        try {
            $userId = $this->request->user->user_id;
            
            // Verify PDF belongs to user
            $pdf = $this->pdfModel->getPdfById($pdfId, $userId);
            if (!$pdf) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'PDF not found or access denied'
                ])->setStatusCode(404);
            }
            
            return $this->response->setJSON([
                'status' => 'success',
                'data' => [
                    'pdf_id' => $pdf->pdf_id,
                    'file_name' => $pdf->file_name,
                    'processing_status' => $pdf->processing_status,
                    'page_count' => $pdf->page_count,
                    'uploaded_at' => $pdf->uploaded_at
                ]
            ]);
            
        } catch (\Exception $e) {
            log_message('error', 'Get PDF status error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to get PDF status'
            ])->setStatusCode(500);
        }
    }

    public function viewPdf($pdfId)
    {
        try {
            // Get user_id from JWT token
            $userId = $this->request->user->user_id;

            // Verify PDF belongs to user
            $pdf = $this->pdfModel->getPdfById($pdfId, $userId);

            if (!$pdf) {
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'PDF not found or access denied'
                ])->setStatusCode(404);
            }

            // Initialize Appwrite Client to retrieve file
            $client = new \Appwrite\Client();
            $client
                ->setEndpoint(getenv('APPWRITE_ENDPOINT'))
                ->setProject(getenv('APPWRITE_PROJECT_ID'))
                ->setKey(getenv('APPWRITE_API_KEY'));

            $storage = new \Appwrite\Services\Storage($client);

            try {
                // Get the file for viewing
                $fileContents = $storage->getFileDownload(getenv('APPWRITE_STORAGE_BUCKET_ID'), $pdf->file_path);
                
                // Set headers for PDF display
                return $this->response
                    ->setHeader('Content-Type', 'application/pdf')
                    ->setHeader('Content-Disposition', 'inline; filename="' . $pdf->file_name . '"')
                    ->setBody($fileContents);
                    
            } catch (\Exception $ex) {
                log_message('error', 'Failed to download file from Appwrite: ' . $ex->getMessage());
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'PDF file could not be retrieved from storage'
                ])->setStatusCode(404);
            }

        } catch (\Exception $e) {
            log_message('error', 'View PDF error: ' . $e->getMessage());
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to view PDF'
            ])->setStatusCode(500);
        }
    }
    
    private function sendToPythonProcessor($pdfId, $pdfPath, $userId)
    {
        $pythonAPIClient = new \App\Libraries\PythonAPIClient();
        
        try {
            $result = $pythonAPIClient->processPdf($pdfId, $pdfPath, $userId);
            return $result;
        } catch (\Exception $e) {
            // Update PDF status to error
            $this->pdfModel->updateProcessingStatus($pdfId, 'error');
            throw new \Exception('Python processing failed: ' . $e->getMessage());
        }
    }
    
    private function generateUuid()
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff), mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000, mt_rand(0, 0xffff),
            mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    public function testPythonQuick(){
        $pythonServerUrl = getenv('PYTHON_SERVER_URL') ?: 'http://localhost:5000';
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $pythonServerUrl . '/health',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            return $this->response->setJSON([
                'status' => 'success', 
                'message' => 'Python server is reachable'
            ]);
        } else {
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Cannot connect to Python server'
            ]);
        }
    }
}
