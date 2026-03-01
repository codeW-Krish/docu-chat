<?php
namespace App\Filters;

use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;
use Config\Services;
use Config\JWT;
use Firebase\JWT\JWT as JWTLib;
use Firebase\JWT\Key;

class JWTAuth implements FilterInterface
{
    public function before(RequestInterface $request, $arguments = null)
    {
        // Skip authorization for preflight queries
        if (strtoupper($request->getMethod()) === 'OPTIONS') {
            return;
        }

        // CORS is handled globally, so we just check auth here
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (empty($authHeader)) {
            $response = Services::response();
            return $response->setJSON([
                'status' => 'error',
                'message' => 'Authorization header required'
            ])->setStatusCode(401);
        }
        
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            
            try {
                $jwtConfig = new JWT();
                $decoded = JWTLib::decode($token, new Key($jwtConfig->key, $jwtConfig->algorithm));
                
                // Add user to request for use in controllers
                $request->user = $decoded;
                
            } catch (\Exception $e) {
                $response = Services::response();
                return $response->setJSON([
                    'status' => 'error',
                    'message' => 'Invalid or expired token'
                ])->setStatusCode(401);
            }
        } else {
            $response = Services::response();
            return $response->setJSON([
                'status' => 'error',
                'message' => 'Invalid authorization format'
            ])->setStatusCode(401);
        }
    }

    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null)
    {
        return $response;
    }
}
