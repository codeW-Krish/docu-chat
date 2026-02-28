<?php
namespace App\Controllers;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;
use App\Models\UserModel;
use Config\JWT;
use Config\Services;
use Firebase\JWT\JWT as JWTLib;
use Firebase\JWT\Key;
use App\Models\UserRefreshTokenModel;

class Auth extends BaseController
{
    protected $jwt;
    protected $userModel;
    protected $refreshTokenModel;

    public function __construct()
    {
        $this->jwt = new JWT();
        $this->userModel = new UserModel();
        $this->refreshTokenModel = new UserRefreshTokenModel();
        helper('text');
    }

  

    public function register(){
        // $this->handleCors(); // Apply CORS headers

        $data = $this->request->getJSON(true);
        
        // Add debug logging
        log_message('debug', 'Registration attempt: ' . print_r($data, true));

        // Validation
        $validation = Services::validation();
        $validation->setRules([
            'email' => 'required|valid_email|is_unique[users.email]',
            'password' => 'required|min_length[8]',
            'name' => 'required'
        ]);
        // Ensure the request is JSON
        if (empty($this->request->getHeaderLine('Content-Type')) || strpos($this->request->getHeaderLine('Content-Type'), 'application/json') === false) {
            // Add CORS headers
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');
                
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Content-Type must be application/json'
            ])->setStatusCode(400);
        }

        if (!$validation->run($data)) {
            log_message('debug', 'Validation failed: ' . print_r($validation->getErrors(), true));
            // Add CORS headers
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');
                
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validation->getErrors()
            ])->setStatusCode(400);
        }

        // Create user
        $userData = [
            'user_id' => $this->generateUuid(),
            'email' => $data['email'],
            'password_hash' => password_hash($data['password'], PASSWORD_DEFAULT),
            'name' => $data['name']
        ];

        log_message('debug', 'Attempting to insert user: ' . print_r($userData, true));
        
        try {
            $result = $this->userModel->insert($userData);
            log_message('debug', 'User insert result: ' . $result);
        } catch (\Exception $e) {
            log_message('error', 'User insertion failed: ' . $e->getMessage());
            // Add CORS headers
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');
                
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ])->setStatusCode(500);
        }

        // Generate tokens
        $tokens = $this->generateTokens($userData['user_id']);

        log_message('debug', 'Registration successful for user: ' . $userData['email']);
        
        // Add CORS headers
        $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->setHeader('Access-Control-Allow-Credentials', 'true');

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'User registered successfully',
            'data' => [
                'tokens' => $tokens,
                'user' => [
                    'user_id' => $userData['user_id'],
                    'email' => $userData['email'],
                    'name' => $userData['name']
                ]
            ]
        ]);
    }

    public function login()
    {
        // $this->handleCors(); // Apply CORS headers

        $data = $this->request->getJSON(true);

        $user = $this->userModel->where('email', $data['email'])->first();

        if (!$user || !password_verify($data['password'], $user->password_hash)) {
            // Add CORS headers
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');
                
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Invalid email or password'
            ])->setStatusCode(401);
        }

        $tokens = $this->generateTokens($user->user_id);

        // Add CORS headers
        $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->setHeader('Access-Control-Allow-Credentials', 'true');

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Login successful',
            'data' => [
                'tokens' => $tokens,
                'user' => [
                    'user_id' => $user->user_id,
                    'email' => $user->email,
                    'name' => $user->name
                ]
            ]
        ]);
    }

    public function logout()
    {
        // $this->handleCors(); // Apply CORS headers

        $data = $this->request->getJSON(true);
        $refreshToken = $data['refresh_token'] ?? null;

        if (!$refreshToken) {
            // Add CORS headers
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');
                
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Refresh token required'
            ])->setStatusCode(400);
        }

        $this->refreshTokenModel->where('refresh_token', $refreshToken)->delete();

        // Add CORS headers
        $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->setHeader('Access-Control-Allow-Credentials', 'true');

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Logged out successfully'
        ]);
    }

    public function refresh()
    {
        // $this->handleCors(); // Apply CORS headers

        $data = $this->request->getJSON(true);
        $refreshToken = $data['refresh_token'] ?? null;

        if (!$refreshToken) {
   
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');
                
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Refresh token required'
            ])->setStatusCode(400);
        }

        try {
            $decoded = JWTLib::decode($refreshToken, new Key($this->jwt->key, $this->jwt->algorithm));
            $userId = $decoded->user_id;

            $stored = $this->refreshTokenModel
                ->where('user_id', $userId)
                ->where('refresh_token', $refreshToken)
                ->first();

            if (!$stored || strtotime($stored['expires_at']) < time()) {
                // Add CORS headers
                $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                    ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                    ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                    ->setHeader('Access-Control-Allow-Credentials', 'true');
                    
                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Refresh token invalid or expired'
                ])->setStatusCode(401);
            }

            $this->refreshTokenModel->delete($stored['token_id']);

            $tokens = $this->generateTokens($userId);

            // Add CORS headers
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'success',
                'data' => ['tokens' => $tokens]
            ]);

        } catch (\Exception $e) {
            // Add CORS headers
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');
                
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Invalid refresh token'
            ])->setStatusCode(401);
        }
    }

    private function generateTokens($userId)
    {
        $payload = [
            'user_id' => $userId,
            'iat' => time(),
            'exp' => time() + $this->jwt->expireTime
        ];

        $refreshPayload = [
            'user_id' => $userId,
            'iat' => time(),
            'exp' => time() + $this->jwt->refreshExpireTime
        ];

        $accessToken = JWTLib::encode($payload, $this->jwt->key, $this->jwt->algorithm);
        $refreshToken = JWTLib::encode($refreshPayload, $this->jwt->key, $this->jwt->algorithm);

        $this->refreshTokenModel->insert([
            'token_id' => $this->generateUuid(),
            'user_id' => $userId,
            'refresh_token' => $refreshToken,
            'user_agent' => $this->request->getUserAgent()->getAgentString(),
            'ip_address' => $this->request->getIPAddress(),
            'expires_at' => date('Y-m-d H:i:s', time() + $this->jwt->refreshExpireTime),
        ]);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'expires_in' => $this->jwt->expireTime
        ];
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
    // --------------------------------------------------------------------
    // STATELESS REGISTRATION FLOW
    // --------------------------------------------------------------------

    public function registerInit()
    {
        // $this->handleCors();

        $data = $this->request->getJSON(true);
        
        // 1. Validation
        $validation = Services::validation();
        $validation->setRules([
            'email' => 'required|valid_email|is_unique[users.email]',
            'password' => 'required|min_length[8]',
            'name' => 'required'
        ]);

        if (!$validation->run($data)) {
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $validation->getErrors()
            ])->setStatusCode(400);
        }

        // 2. Generate OTP
        $otp = (string) random_int(100000, 999999);
        
        // 3. Hash sensitive data
        $otpHash = password_hash($otp, PASSWORD_DEFAULT);
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

     
        $regPayload = [
            'type' => 'registration',
            'name' => $data['name'],
            'email' => $data['email'],
            'password_hash' => $passwordHash,
            'otp_hash' => $otpHash,
            'iat' => time(),
            'exp' => time() + (15 * 60) 
        ];

        $regToken = JWTLib::encode($regPayload, $this->jwt->key, $this->jwt->algorithm);

      
        if (!$this->sendEmail($data['email'], 'Verify your account', "Your verification code is: $otp")) {
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Failed to send verification email'
            ])->setStatusCode(500);
        }

         // Add CORS headers
         $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
         ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
         ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
         ->setHeader('Access-Control-Allow-Credentials', 'true');

        return $this->response->setJSON([
            'status' => 'success',
            'message' => 'Verification code sent',
            'data' => [
                'registration_token' => $regToken
            ]
        ]);
    }

    public function registerComplete()
    {
        // $this->handleCors();

        $data = $this->request->getJSON(true);
        $otp = $data['otp'] ?? '';
        $regToken = $data['registration_token'] ?? '';

        if (!$otp || !$regToken) {
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Missing OTP or token'
            ])->setStatusCode(400);
        }

        try {
            // 1. Verify JWT
            $decoded = JWTLib::decode($regToken, new Key($this->jwt->key, $this->jwt->algorithm));
            
            if ($decoded->type !== 'registration') {
                throw new \Exception('Invalid token type');
            }

            // 2. Verify OTP
            if (!password_verify($otp, $decoded->otp_hash)) {
                 // Add CORS headers
                $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');

                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Invalid verification code'
                ])->setStatusCode(400);
            }

            // 3. Create User (Double check email uniqueness just in case)
            if ($this->userModel->where('email', $decoded->email)->first()) {
                 // Add CORS headers
                 $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                 ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                 ->setHeader('Access-Control-Allow-Credentials', 'true');

                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Email already registered'
                ])->setStatusCode(400);
            }

            $userData = [
                'user_id' => $this->generateUuid(),
                'email' => $decoded->email,
                'password_hash' => $decoded->password_hash,
                'name' => $decoded->name
            ];

            $this->userModel->insert($userData);

            // 4. Generate Login Tokens
            $tokens = $this->generateTokens($userData['user_id']);

             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'Registration successful',
                'data' => [
                    'tokens' => $tokens,
                    'user' => [
                        'user_id' => $userData['user_id'],
                        'email' => $userData['email'],
                        'name' => $userData['name']
                    ]
                ]
            ]);

        } catch (\Exception $e) {
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Invalid or expired session'
            ])->setStatusCode(400);
        }
    }

    // --------------------------------------------------------------------
    // FORGOT / RESET PASSWORD FLOW
    // --------------------------------------------------------------------

    public function forgotPassword()
    {
        // $this->handleCors();

        $data = $this->request->getJSON(true);
        $email = $data['email'] ?? '';

        $user = $this->userModel->where('email', $email)->first();

        if (!$user) {
            // Don't reveal if user exists or not for security, but for now we will just return success
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'If your email is registered, you will receive a reset link.'
            ]);
        }

        // Generate Reset JWT (15 mins)
        $resetPayload = [
            'type' => 'password_reset',
            'user_id' => $user->user_id,
            'iat' => time(),
            'exp' => time() + (15 * 60)
        ];

        $resetToken = JWTLib::encode($resetPayload, $this->jwt->key, $this->jwt->algorithm);
        
        // Link to frontend reset page
        $resetLink = "http://localhost:3000/reset-password?token=" . $resetToken;

        if ($this->sendEmail($email, 'Reset your password', "Click here to reset your password: " . $resetLink)) {
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'Reset link sent'
            ]);
        }
        
         // Add CORS headers
         $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
         ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
         ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
         ->setHeader('Access-Control-Allow-Credentials', 'true');

        return $this->response->setJSON([
            'status' => 'error',
            'message' => 'Failed to send email'
        ])->setStatusCode(500);
    }

    public function resetPassword()
    {
        // $this->handleCors();

        $data = $this->request->getJSON(true);
        $token = $data['token'] ?? '';
        $newPassword = $data['password'] ?? '';

        if (!$token || strlen($newPassword) < 8) {
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Invalid request'
            ])->setStatusCode(400);
        }

        try {
            $decoded = JWTLib::decode($token, new Key($this->jwt->key, $this->jwt->algorithm));

            if ($decoded->type !== 'password_reset') {
                throw new \Exception('Invalid token type');
            }

            $userId = $decoded->user_id;

            // Update password
            $this->userModel->update($userId, [
                'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT)
            ]);

             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'Password updated successfully'
            ]);

        } catch (\Exception $e) {
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Invalid or expired token'
            ])->setStatusCode(400);
        }
    }

    private function sendEmail($to, $subject, $message)
    {
        $email = \Config\Services::email();
        $email->setFrom(getenv('SMTP_USER'), 'AI DocuChat');
        $email->setTo($to);
        $email->setSubject($subject);
        $email->setMessage($message);
        return $email->send();
    }

    // --------------------------------------------------------------------
    // PROFILE MANAGEMENT
    // --------------------------------------------------------------------

    public function updateProfile()
    {
        // $this->handleCors();

        $data = $this->request->getJSON(true);
        $authHeader = $this->request->getHeaderLine('Authorization');
        $token = null;

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        }

        if (!$token) {
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Unauthorized'
            ])->setStatusCode(401);
        }

        try {
            $decoded = JWTLib::decode($token, new Key($this->jwt->key, $this->jwt->algorithm));
            $userId = $decoded->user_id;

            // Validation
            $validation = Services::validation();
            $rules = [
                'name' => 'required|min_length[2]',
            ];

            // Only validate password if it's provided
            if (!empty($data['password'])) {
                $rules['password'] = 'min_length[8]';
            }

            $validation->setRules($rules);

            if (!$validation->run($data)) {
                 // Add CORS headers
                 $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                 ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                 ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                 ->setHeader('Access-Control-Allow-Credentials', 'true');

                return $this->response->setJSON([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validation->getErrors()
                ])->setStatusCode(400);
            }

            $updateData = [
                'name' => $data['name']
            ];

            if (!empty($data['password'])) {
                $updateData['password_hash'] = password_hash($data['password'], PASSWORD_DEFAULT);
            }

            $this->userModel->update($userId, $updateData);
            
            // Fetch updated user
            $updatedUser = $this->userModel->find($userId);

             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'Profile updated successfully',
                'data' => [
                    'user' => [
                        'user_id' => $updatedUser->user_id,
                        'email' => $updatedUser->email,
                        'name' => $updatedUser->name
                    ]
                ]
            ]);

        } catch (\Exception $e) {
             // Add CORS headers
             $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
             ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
             ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
             ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Invalid token or server error'
            ])->setStatusCode(401);
        }
    }

    // Test database connection
    public function testDb()
    {
        try {
            $db = \Config\Database::connect();
            $result = $db->query('SELECT version() as version')->getRow();
            
            // Test if we can insert a user
            $testData = [
                'user_id' => $this->generateUuid(),
                'email' => 'test@test.com',
                'password_hash' => password_hash('test', PASSWORD_DEFAULT),
                'name' => 'Test User'
            ];
            
            $db->table('users')->insert($testData);
            $insertId = $db->insertID();
            
            // Add CORS headers
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');

            return $this->response->setJSON([
                'status' => 'success',
                'message' => 'Database connection OK',
                'data' => [
                    'version' => $result->version,
                    'insert_id' => $insertId
                ]
            ]);
        } catch (\Exception $e) {
            // Add CORS headers
            $this->response->setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
                ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
                ->setHeader('Access-Control-Allow-Credentials', 'true');
                
            return $this->response->setJSON([
                'status' => 'error',
                'message' => 'Database error: ' . $e->getMessage()
            ])->setStatusCode(500);
        }
    }
}
