# Site AUSA — guide de mise en ligne et de mise à jour

Site statique (HTML/CSS/JS) + un petit script PHP pour les formulaires.
Aucune base de données, aucun cookie, aucun traceur. Fonctionne sur tout hébergement mutualisé avec PHP (IONOS, OVH, o2switch…).

## 1. Avant la mise en ligne (à faire une fois)

1. **Compléter les passages surlignés en jaune** (classe `todo`) : rechercher `class="todo"` dans les fichiers `.html`.
   Une fois le texte réel saisi, supprimer la balise `<span class="todo">…</span>` autour.
   Pages concernées : qui-sommes-nous, nos-actions, nos-projets, partenaires, nous-rejoindre, contact, mentions-legales, confidentialite.
2. **Nom de domaine** : remplacer `https://www.ausa-antibes.fr` (domaine provisoire) par le vrai domaine
   dans tous les `.html`, `sitemap.xml` et `robots.txt` (rechercher/remplacer).
3. **Formulaires** : sur le serveur, copier `config.exemple.php` en `config.php` et indiquer
   l'adresse qui reçoit les messages et une adresse d'expédition du domaine. `config.php` n'est jamais versionné.
4. **Réseaux sociaux** : dans le pied de page de chaque page, décommenter les liens Facebook/Instagram et mettre les bonnes adresses.
5. Envoyer **tout le contenu du dossier `ausa/`** à la racine de l'hébergement (FTP ou gestionnaire de fichiers).
6. Déclarer le site dans **Google Search Console** et créer une fiche **Google Business Profile** « AUSA — Antibes » (essentiel pour le référencement local).

## 2. Publier une actualité (sans développeur)

Tout se passe dans **`actualites/actualites.json`** (fichier texte, modifiable avec n'importe quel éditeur ou directement dans le gestionnaire de fichiers de l'hébergeur).

Copier ce bloc au début de la liste `"articles"` (garder la virgule entre deux blocs) :

```json
{
  "date": "2027-03-20",
  "titre": "Distribution solidaire du Ramadan : merci aux bénévoles",
  "resume": "Une phrase ou deux qui résument l'actualité.",
  "texte": "Premier paragraphe.\n\nDeuxième paragraphe.",
  "categorie": "Solidarité",
  "portage": "soutien",
  "image": "assets/img/actus/ramadan-2027.jpg",
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
