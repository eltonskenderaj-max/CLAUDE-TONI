# Site AUSA — guide de mise en ligne et de mise à jour

Site statique (HTML/CSS/JS) + un petit script PHP pour les formulaires.
Aucune base de données, aucun cookie, aucun traceur. Fonctionne sur tout hébergement mutualisé avec PHP (IONOS, OVH, o2switch…).

## 1. Mise en ligne sur Hostinger (ausantibes.fr)

1. Dans hPanel Hostinger : **Sites web → ausantibes.fr → Gestionnaire de fichiers**.
2. Ouvrir le dossier **`public_html`**, supprimer la page par défaut de Hostinger (`default.php` / `index.php` s'il y en a une).
3. Envoyer **tout le contenu du dossier `ausa/`** (pas le dossier lui-même) dans `public_html` :
   `index.html`, les autres pages `.html`, `envoi.php`, `config.php`, `.htaccess`, les dossiers `assets/` et `actualites/`.
   Astuce : envoyer le zip puis utiliser « Extraire » dans le gestionnaire de fichiers.
4. Dans hPanel : **Sécurité → SSL** → activer le certificat gratuit pour ausantibes.fr (le site redirige ensuite automatiquement vers https://ausantibes.fr).
5. Vérifier que la boîte **contact@ausantibes.fr** existe (hPanel → E-mails). Les formulaires envoient leurs messages à cette adresse (réglage dans `config.php`).
6. **Tester** chaque formulaire (contact, bénévolat, bulletin d'adhésion) et regarder aussi dans les courriers indésirables.
   Si les messages n'arrivent pas, vérifier dans hPanel → E-mails que l'envoi par PHP (`mail()`) est autorisé.
7. Déclarer le site dans **Google Search Console** (propriété « Domaine » ausantibes.fr, validation par DNS dans hPanel), puis envoyer `https://ausantibes.fr/sitemap.xml`.
8. Créer une fiche **Google Business Profile** « AUSA — Union & Solidarité Antibes » (référencement local).

Passages encore à compléter : rechercher `class="todo"` dans les fichiers `.html` (il n'en reste quasiment plus).

## 2. Publier une actualité (sans développeur)

Tout se passe dans **`actualites/actualites.json`** (fichier texte, modifiable avec n'importe quel éditeur ou directement dans le gestionnaire de fichiers de l'hébergeur).

Copier ce bloc au début de la liste `"articles"` (garder la virgule entre deux blocs) :

```json
{
  "date": "2027-03-20",
  "titre": "Collecte de fournitures scolaires : merci aux bénévoles",
  "resume": "Une phrase ou deux qui résument l'actualité.",
  "texte": "Premier paragraphe.\n\nDeuxième paragraphe.",
  "categorie": "Solidarité",
  "portage": "soutien",
  "image": "assets/img/actus/collecte-2027.jpg",
  "image_alt": "Bénévoles préparant des colis",
  "publie": true
},
```

- `portage` : `ausa` (porté par l'AUSA), `collectif` (action collective) ou `soutien` (initiative d'un partenaire à laquelle nous contribuons). **Toujours renseigner honnêtement ce champ.**
- `categorie` : Éducation, Solidarité, Insertion, Vie locale, Vie de l'association (les filtres se créent automatiquement).
- `image` : déposer la photo (JPG, largeur ~1200 px, < 300 Ko) dans `assets/img/actus/`. Laisser `""` s'il n'y a pas de photo.
- `publie: false` pour préparer un brouillon invisible.
- Vérifier le fichier sur https://jsonlint.com avant d'enregistrer (une virgule oubliée bloque l'affichage).

## 3. Ajouter des photos à la galerie

Dans le même fichier, liste `"galerie"` :

```json
"galerie": [
  { "image": "assets/img/galerie/collecte-2027.jpg", "legende": "Collecte de fournitures scolaires, septembre 2027" }
]
```

**Droit à l'image** : n'utiliser que des photos pour lesquelles les personnes (ou parents pour les mineurs) ont donné leur accord. Privilégier les photos de dos, de mains, de groupes à distance quand l'accord n'est pas certain.

## 4. Remplacer les emplacements photo

Les blocs « Photo à venir » (`<div class="photo-slot">…`) peuvent recevoir une vraie image :

```html
<div class="photo-slot"><img src="assets/img/benevoles.jpg" alt="Description de la photo"></div>
```

## 5. Évolutions possibles plus tard

- **Dons en ligne** : HelloAsso (gratuit pour les associations) — il suffit d'ajouter un bouton/lien dans la section « Soutenir l'AUSA » de `nous-rejoindre.html`.
- **Administration plus confortable** : si la publication devient fréquente, migration possible vers un CMS (WordPress) en reprenant le même design.
- Si un outil de statistiques ou des contenus tiers (YouTube, Google Maps) sont ajoutés, mettre à jour `confidentialite.html` et prévoir un bandeau cookies.
