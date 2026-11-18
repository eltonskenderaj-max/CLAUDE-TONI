<?php
// Configuration des formulaires du site AUSA (ausantibes.fr).
// Aucun mot de passe ici : l'envoi utilise la fonction mail() de l'hébergeur (Hostinger).
return [
    // Adresse qui reçoit les messages du site (contact, bénévolat, partenariat)
    'destinataire' => 'contact@ausantibes.fr',

    // Adresse qui reçoit les bulletins d'adhésion ('' = même adresse que ci-dessus)
    'destinataire_adhesions' => '',

    // Adresse d'expédition : boîte existante du domaine ausantibes.fr
    'expediteur' => 'contact@ausantibes.fr',

    // Envoyer à l'adhérent une copie de son bulletin
    'copie_adherent' => true,
];
