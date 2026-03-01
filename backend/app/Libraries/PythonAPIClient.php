<?php
namespace App\Libraries;

class PythonAPIClient
{
    protected $baseUrl;
    
    public function __construct()
    {
        $this->baseUrl = getenv('PYTHON_SERVER_URL') ?: 'http://localhost:5000';
    }
    
public function processPdf($pdfId, $pdfPath, $userId)
{
    $url = $this->baseUrl . '/process-pdf';
    
    $postData = [
        'pdf_id' => $pdfId,
        'pdf_path' => $pdfPath,
        'user_id' => $userId
    ];
    
    // Execute asynchronously (fire and forget) so Vercel does not timeout
    $this->sendAsyncRequest($url, $postData);
    
    // Return mock success immediately since processing happens in the background
    return ['status' => 'success', 'message' => 'Processing started asynchronously'];
}

private function sendAsyncRequest($url, $data)
{
    // Initialize cURL for a non-blocking request
    $ch = curl_init();
    $jsonData = json_encode($data);
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $jsonData,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($jsonData)
        ],
        CURLOPT_RETURNTRANSFER => true,
        // Set extremely short timeouts so curl disconnects immediately after sending
        // The Python server will continue processing the request even after PHP drops it
        CURLOPT_TIMEOUT_MS => 500,
        CURLOPT_NOSIGNAL => 1
    ]);
    
    curl_exec($ch);
    curl_close($ch);
}
    
    public function chat($question, $pdfIds, $userId, $sessionId = null)
    {
        $url = $this->baseUrl . '/chat';
        
        $postData = [
            'question' => $question,
            'pdf_ids' => $pdfIds,
            'user_id' => $userId,
            'session_id' => $sessionId
        ];
        
        return $this->sendRequest($url, $postData);
    }
    
    public function healthCheck()
    {
        $url = $this->baseUrl . '/health';
        return $this->sendRequest($url, [], false, 'GET');
    }
    
    private function sendRequest($url, $data, $isMultipart = false, $method = 'POST')
    {
        $ch = curl_init();
        
        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 300,
            CURLOPT_HTTPHEADER => []
        ];
        
        if ($method === 'POST') {
            $options[CURLOPT_POST] = true;
            if ($isMultipart) {
                $options[CURLOPT_POSTFIELDS] = $data;
                $options[CURLOPT_HTTPHEADER][] = 'Content-Type: multipart/form-data';
            } else {
                $options[CURLOPT_POSTFIELDS] = json_encode($data);
                $options[CURLOPT_HTTPHEADER][] = 'Content-Type: application/json';
            }
        }
        
        curl_setopt_array($ch, $options);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new \Exception("Python API error ($httpCode): $error");
        }
        
        return json_decode($response, true);
    }
}
