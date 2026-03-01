<?php
use CodeIgniter\Router\RouteCollection;
use App\Controllers\Auth;
use App\Controllers\PdfController;
use App\Controllers\ChatController;
use App\Controllers\Home;

/**
 * @var RouteCollection $routes
 */

// Public routes
$routes->get('public/health', function() {
    return service('response')->setJSON(['status' => 'healthy', 'service' => 'PHP Backend']);
});

$routes->options('(:any)', function() {
    return service('response')->setStatusCode(204);
});

$routes->get('/', [Home::class, 'index']);
$routes->get('public/test-python-quick', [PdfController::class, 'testPythonQuick']);
$routes->get('public/test-db', [ChatController::class, 'testDatabase']);

/**
 * =========================================
 * AUTH ROUTES (public)
 * =========================================
 */
$routes->group('', ['filter' => 'cors'], static function($routes) {
    $routes->post('auth/register', [Auth::class, 'register']);
    $routes->post('auth/register-init', [Auth::class, 'registerInit']); // New
    $routes->post('auth/register-complete', [Auth::class, 'registerComplete']); // New
    $routes->post('auth/forgot-password', [Auth::class, 'forgotPassword']); // New
    $routes->post('auth/reset-password', [Auth::class, 'resetPassword']); // New
    $routes->post('auth/login', [Auth::class, 'login']);
    $routes->post('auth/refresh', [Auth::class, 'refresh']);
    $routes->post('auth/logout', [Auth::class, 'logout']); 
    $routes->post('auth/profile', [Auth::class, 'updateProfile']); // New
    $routes->get('auth/test-db', [Auth::class, 'testDb']);
});

/**
 * =========================================
 * PROTECTED API ROUTES (JWT required)
 * =========================================
 */
$routes->group('api', ['filter' => ['cors', 'jwtauth']], static function($routes) { // Add cors filter here too
    // PDF routes
    $routes->post('pdfs/upload', [PdfController::class, 'upload']);
    $routes->post('pdfs/upload-chunk', [PdfController::class, 'uploadChunk']);
    $routes->get('pdfs', [PdfController::class, 'getUserPdfs']);
    $routes->get('pdfs/(:segment)', [PdfController::class, 'getPdfStatus/$1']);
    $routes->get('pdfs/(:segment)/view', [PdfController::class, 'viewPdf/$1']);
    $routes->get('pdfs/(:segment)/chunks', [PdfController::class, 'getPdfChunks/$1']);
    $routes->delete('pdfs/(:segment)', [PdfController::class, 'deletePdf/$1']);

    // Chat routes
    $routes->get('chat/sessions', [ChatController::class, 'getSessions']);
    $routes->post('chat/sessions', [ChatController::class, 'createSession']);
    $routes->post('chat/send', [ChatController::class, 'sendMessage']);
    $routes->get('chat/sessions/(:segment)', [ChatController::class, 'getSession']);
    $routes->get('chat/sessions/(:segment)/messages', [ChatController::class, 'getSessionMessages']);
    $routes->post('chat/summary', [ChatController::class, 'generateSummary']);
    $routes->post('chat/sessions/(:segment)/pdfs', [ChatController::class, 'addPdfs']);
    $routes->delete('chat/sessions/(:segment)/pdfs/(:segment)', [ChatController::class, 'removePdf']);
    $routes->post('chat/message', [ChatController::class, 'sendMessage']);
    $routes->post('chat/message/stream', [ChatController::class, 'sendMessageStream']);
    $routes->get('chat/test-db', [ChatController::class, 'testDatabase']);

    // Dashboard routes
    $routes->get('dashboard/stats', [\App\Controllers\DashboardController::class, 'getStats']);
});
