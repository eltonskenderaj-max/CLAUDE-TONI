<?php
header('Content-Type: text/plain; charset=utf-8');

$host = 'smtp.ionos.fr';
$port = 587;
$user = 'contact@ahrpa.eu';
$pass = 'Monteverdi2023domaine$';
$from = 'contact@ahrpa.eu';
$to   = 'contact@ahrpa.eu';

$subject = "Test formulaire AHRPA";
$body    = "Ceci est un test depuis mailtest2.php\r\n";

echo "Connexion...\n";
$fp = @fsockopen("tcp://$host", $port, $errno, $errstr, 15);
if (!$fp) { echo "ECHEC connexion: $errno $errstr\n"; exit; }
echo "OK\n";

function smtp_read($fp) {
    $r = '';
    while ($line = fgets($fp, 512)) {
        $r .= $line;
        if (substr($line, 3, 1) === ' ') break;
    }
    return trim($r);
}
function smtp_cmd($fp, $cmd, $label='') {
    fwrite($fp, $cmd . "\r\n");
    $r = smtp_read($fp);
    echo ($label ?: $cmd) . " => $r\n";
    return $r;
}

echo "Greeting: " . smtp_read($fp) . "\n";
smtp_cmd($fp, "EHLO ahrpa.eu");
$r = smtp_cmd($fp, "STARTTLS");
if (strpos($r, '220') === false) { echo "STARTTLS ECHEC\n"; fclose($fp); exit; }

$ok = stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
echo "TLS: " . ($ok ? "OK" : "ECHEC") . "\n";

smtp_cmd($fp, "EHLO ahrpa.eu");
smtp_cmd($fp, "AUTH LOGIN");
smtp_cmd($fp, base64_encode($user), "USER");
$r = smtp_cmd($fp, base64_encode($pass), "PASS");
if (strpos($r, '235') === false) { echo "AUTH ECHEC\n"; fclose($fp); exit; }
echo "AUTH OK\n";

smtp_cmd($fp, "MAIL FROM:<$from>");
smtp_cmd($fp, "RCPT TO:<$to>");
smtp_cmd($fp, "DATA");

$msg  = "Date: " . date('r') . "\r\n";
$msg .= "From: AHRPA Contact <$from>\r\n";
$msg .= "To: $to\r\n";
$msg .= "Subject: $subject\r\n";
$msg .= "MIME-Version: 1.0\r\n";
$msg .= "Content-Type: text/plain; charset=UTF-8\r\n";
$msg .= "\r\n";
$msg .= $body;
$msg .= "\r\n.\r\n";

fwrite($fp, $msg);
$r = smtp_read($fp);
echo "DATA end => $r\n";

smtp_cmd($fp, "QUIT");
fclose($fp);

echo "\nRESULTAT: " . (strpos($r, '250') !== false ? "EMAIL ENVOYE !" : "ECHEC envoi") . "\n";
?>
