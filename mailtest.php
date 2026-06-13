<?php
header('Content-Type: text/plain; charset=utf-8');

echo "=== DIAGNOSTIC MAIL IONOS ===\n\n";

// PHP version
echo "PHP version: " . phpversion() . "\n";

// mail() disponible ?
echo "mail() disponible: " . (function_exists('mail') ? 'OUI' : 'NON') . "\n";

// sendmail_path
echo "sendmail_path: " . ini_get('sendmail_path') . "\n";
echo "SMTP: " . ini_get('SMTP') . "\n";
echo "smtp_port: " . ini_get('smtp_port') . "\n";

echo "\n=== TEST ENVOI ===\n";

$to      = 'contact@ahrpa.eu';
$subject = 'Test diagnostic AHRPA';
$body    = 'Ceci est un test automatique depuis mailtest.php';
$headers = "From: contact@ahrpa.eu\r\nContent-Type: text/plain; charset=UTF-8\r\n";

$result = mail($to, $subject, $body, $headers, '-f contact@ahrpa.eu');

echo "Résultat mail(): " . ($result ? 'TRUE (envoyé)' : 'FALSE (échec)') . "\n";

// Dernière erreur PHP
$err = error_get_last();
if ($err) {
    echo "Dernière erreur PHP: " . $err['message'] . "\n";
}

echo "\nDone.\n";
