<?php
// Copier ce fichier en "config.php" sur le serveur, puis renseigner les adresses
// dès que le nom de domaine et la boîte e-mail de l'association existent.
// config.php n'est jamais publié sur GitHub (voir .gitignore).
return [
    // Adresse qui reçoit les messages du site (contact, bénévolat, partenariat)
    'destinataire' => 'contact@VOTRE-DOMAINE.fr',

    // Adresse qui reçoit les bulletins d'adhésion (laisser '' pour utiliser 'destinataire')
    'destinataire_adhesions' => '',

    // Adresse d'expédition : doit appartenir au domaine hébergé (sinon les mails partent en spam)
    'expediteur' => 'site@VOTRE-DOMAINE.fr',

    // Envoyer à l'adhérent une copie de son bulletin (true / false)
    'copie_adherent' => true,
];
