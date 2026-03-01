<?php
require 'vendor/autoload.php';

// Bootstrap CodeIgniter
define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);
chdir(__DIR__ . '/..');
$pathsConfig = 'app/Config/Paths.php';
require realpath($pathsConfig) ?: $pathsConfig;
$paths = new \Config\Paths();
$bootstrap = rtrim($paths->systemDirectory, '\\/ ') . DIRECTORY_SEPARATOR . 'bootstrap.php';
$app       = require realpath($bootstrap) ?: $bootstrap;

try {
    // Manually run the code from registerInit
    $email = \Config\Services::email();
    $email->setFrom(getenv('SMTP_USER'), 'AI DocuChat');
    $email->setTo('test@example.com');
    $email->setSubject('Test');
    $email->setMessage('Test');
    
    if (!$email->send()) {
        echo "Failed to send email:\n";
        echo $email->printDebugger();
    } else {
        echo "Email sent successfully.\n";
    }

} catch (\Throwable $e) {
    echo "Exception caught:\n";
    echo $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
