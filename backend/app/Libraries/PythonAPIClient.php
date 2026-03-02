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
    
    // We intentionally use a fire-and-forget async request here because 
    // huge PDFs take 10+ minutes to vectorize, which causes Nginx 504 timeouts.
    return $this->sendAsyncRequest($url, $postData);
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

    /**
     * Fire-and-forget request that intentionally times out after 200ms 
     * but leaves the Python server executing the payload in the background.
     */
    private function sendAsyncRequest($url, $data)
    {
        $ch = curl_init();
        
        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            // 200 milliseconds is enough time to send the payload but not to wait for the 10-minute response
            CURLOPT_TIMEOUT_MS => 200, 
            CURLOPT_NOSIGNAL => 1, // needed for sub-second timeouts in some PHP environments
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json'
            ]
        ];
        
        curl_setopt_array($ch, $options);
        
        // This will ALWAYS throw a boolean false / timeout exception, we explicitly ignore it.
        curl_exec($ch);
        curl_close($ch);
        
        return ['status' => 'success', 'message' => 'Async request dispatched'];
    }
}
