# Cartographie du site et recommandations Meta Ads

## 1. Positionnement synthétique

Anti-Phishing est un point de contrôle humain : un visiteur transmet un email, SMS, lien, document, capture ou texte suspect et reçoit par email un avis prudent — légitime, suspect ou probable phishing.

Promesse centrale : **obtenir un avis clair avant de cliquer, répondre, payer, ouvrir une pièce jointe ou transmettre des informations sensibles**.

À préserver dans tous les messages : l’avis n’est pas une certification ni une garantie de sécurité à 100 %.

## 2. Carte du site

| URL | Rôle | Intention utilisateur | CTA principal | Priorité acquisition |
|---|---|---|---|---|
| `/` | Page de conversion principale | Doute général sur un contenu | Envoyer la demande | Très haute |
| `/verifier-email` | Landing page email | Vérifier un email avant de répondre | Envoyer l’email suspect | Très haute |
| `/verifier-sms` | Landing page SMS | Faux colis, banque, administration ou paiement | Envoyer le SMS | Très haute |
| `/verifier-lien` | Landing page lien | Vérifier une URL sans la visiter | Coller le lien | Très haute |
| `/verifier-document` | Landing page fichier | Vérifier PDF, Word, email ou capture | Envoyer le document | Haute |
| `/apres-clic-lien-suspect` | Aide post-incident | L’utilisateur a déjà cliqué | Transmettre les éléments | Haute, mais acquisition distincte |
| `/pour-les-particuliers` | Page audience B2C | Chercher un second avis personnel | Faire vérifier un contenu | Moyenne |
| `/pour-les-entreprises` | Page audience B2B | Aider une équipe face à une fraude | Faire vérifier un contenu | Test séparé |
| `/pour-les-institutions` | Page partenaires / relais | Orienter des usagers ou agents | Partager / faire vérifier | Faible en acquisition directe |
| `/sitemap.xml` | Référencement | Découverte des pages publiques | — | SEO uniquement |
| `/robots.txt` | Référencement | Contrôle crawl | — | Technique uniquement |
| `/admin/*` | Opérations internes | Revue des demandes | — | Ne pas promouvoir |
| `/api/*` | Backend | Soumission, authentification et verdict | — | Ne pas promouvoir |

### Parcours principal

`Annonce Meta → landing spécialisée → formulaire → confirmation « Demande reçue » → revue opérateur → verdict par email`

### Contenu commun du formulaire

- email de réponse obligatoire ;
- URL(s), texte copié, fichier(s) et contexte ;
- jusqu’à 10 liens ;
- jusqu’à 5 fichiers ; 10 MB par fichier et 25 MB au total ;
- formats : images courantes, PDF, Word, `.eml`, `.msg` et texte ;
- avertissement : ne pas cliquer ni ouvrir la pièce jointe avant vérification.

## 3. Pages à utiliser pour Meta Ads

### Campagne 1 — Email suspect

- Landing : `/verifier-email`
- Audience : particuliers exposés aux emails de banque, livraison, impôts, assurance, compte ou facture ; retargeting des visiteurs du site.
- Angle : « Avant de répondre, faites examiner l’email complet. »
- Créatifs : capture floutée d’un email, zoom sur expéditeur / lien, format vertical 9:16 et carré 1:1.
- CTA : **En savoir plus** ou **Envoyer une demande** selon le placement.
- Événement cible : `submission_success`.

### Campagne 2 — SMS / faux colis

- Landing : `/verifier-sms`
- Audience : particuliers ; ciblage contextuel autour de livraison, banque et démarches administratives ; retargeting vidéo.
- Angle : « Un SMS urgent vous demande de payer ou de cliquer ? Vérifiez-le avant d’agir. »
- Créatifs : conversation SMS fictive et entièrement anonymisée ; ne pas reprendre de marque réelle sans autorisation.
- CTA : **Vérifier le SMS**.
- Événement cible : `submission_success`, avec segmentation `asset_type=sms`.

### Campagne 3 — Lien ou URL suspecte

- Landing : `/verifier-lien`
- Audience : utilisateurs cherchant une réponse immédiate avant connexion ou paiement ; retargeting des vues de landing.
- Angle : « Collez l’URL sans l’ouvrir. »
- Créatifs : champ URL, curseur arrêté avant le clic, message de prudence.
- CTA : **Vérifier le lien**.
- Événement cible : `submission_success`, avec segmentation `asset_type=url`.

### Campagne 4 — Pièce jointe / document

- Landing : `/verifier-document`
- Audience : particuliers et petites équipes ; campagne distincte si l’offre B2B est validée.
- Angle : « Faites examiner le document avant de l’ouvrir ou de le signer. »
- Créatifs : PDF ou pièce jointe fictive, noms et logos génériques, aucun fichier malveillant réel.
- CTA : **Faire vérifier le document**.
- Événement cible : `submission_success`, avec segmentation `asset_type=file`.

### Campagne 5 — Après un clic

- Landing : `/apres-clic-lien-suspect`
- Angle : premiers réflexes et orientation vers les canaux officiels, puis transmission des éléments.
- Usage recommandé : retargeting et contenus éducatifs ; ne pas présenter le service comme une intervention d’urgence ou une remédiation.
- CTA : **Voir les premiers réflexes** puis **Transmettre les éléments**.

### Campagne 6 — Entreprises

- Landing : `/pour-les-entreprises`
- Usage : test séparé, avec message et budget propres. Le site décrit un cas d’usage mais ne présente pas encore d’offre, tarif, SLA, intégration ou preuve client.
- Angle actuel utilisable : « Aidez vos équipes à décider avant le clic. »
- Limite : campagne de génération de demande probablement prématurée tant que l’offre B2B n’est pas explicitée.

## 4. Angles créatifs prioritaires

1. **Le doute avant l’action** — « Un message vous paraît étrange ? Faites vérifier avant de cliquer. »
2. **Le faux sentiment d’urgence** — « Prenez un second avis avant un paiement ou une connexion. »
3. **La simplicité** — « Pas de compte à créer : envoyez le contenu et votre email. »
4. **La prudence** — « Un avis humain compréhensible, sans promesse de certitude absolue. »
5. **Le lien non ouvert** — « Collez l’URL telle quelle, sans la visiter. »
6. **Le document inattendu** — « Ne l’ouvrez pas pour le vérifier : transmettez-le. »

Éviter les formulations qui affirment ou insinuent que la personne ciblée a été victime d’une fraude, qu’elle est vulnérable ou qu’un contenu est certainement malveillant. Préférer des formulations générales et hypothétiques : « Vous avez reçu un message qui vous paraît suspect ? »

## 5. Copies publicitaires prêtes à tester

### Variante A — généraliste

**Texte principal :** Un email, SMS, lien ou document vous paraît suspect ? Transmettez les éléments disponibles. Un opérateur vous répond par email avec un avis clair et prudent avant que vous ne cliquiez, répondiez ou payiez.

**Titre :** Un doute ? Faites vérifier avant d’agir.

**Description :** Pas de compte à créer.

### Variante B — lien

**Texte principal :** Vous pouvez vérifier un lien sans l’ouvrir. Copiez l’URL, ajoutez le contexte du message et recevez un avis humain par email.

**Titre :** Vérifiez un lien suspect sans cliquer.

### Variante C — SMS

**Texte principal :** Faux colis, demande urgente de paiement ou message qui imite une banque : transmettez le SMS et son contexte avant de répondre.

**Titre :** Ce SMS est-il une arnaque ?

### Variante D — document

**Texte principal :** Une pièce jointe inattendue vous demande de signer, payer ou vous connecter ? Envoyez-la telle quelle. Ne l’ouvrez pas pour la vérifier.

**Titre :** Vérifiez le document avant de l’ouvrir.

## 6. Mesure recommandée avant lancement

Le dépôt ne montre pas encore de pixel Meta, Conversions API ou instrumentation d’événements. À ajouter avant l’optimisation publicitaire :

- `page_view` : page visitée ;
- `cta_click` : clic vers le formulaire ;
- `form_start` : premier champ rempli ;
- `submission_attempt` : tentative d’envoi ;
- `submission_success` : demande effectivement acceptée par `/api/submissions` ;
- `submission_error` : erreur de validation ou d’envoi.

Conserver la source et le type de landing via des paramètres UTM et des métadonnées non sensibles, par exemple `utm_source=meta`, `utm_campaign=sms`, `landing=/verifier-sms`, `asset_type=sms`. Ne jamais envoyer à Meta le texte, l’URL, le nom de fichier, l’adresse email ou le contenu suspect soumis par l’utilisateur.

Conversion primaire : `submission_success`.

Conversions secondaires : `cta_click` et `form_start`, uniquement pour diagnostiquer le tunnel ou alimenter une phase d’apprentissage quand le volume de demandes est encore faible.

## 7. Pré-requis produit avant achat média

1. Ajouter une confirmation ou un lien visible vers la politique de confidentialité, la finalité du traitement et la durée de conservation des contenus soumis.
2. Afficher le délai indicatif de réponse et les limites du service ; aujourd’hui, le site confirme la réception mais ne promet pas de délai.
3. Ajouter un vrai footer légal : mentions légales, contact, confidentialité et conditions du service.
4. Prévoir une page de repli pour les urgences : fraude bancaire, compte compromis ou données déjà communiquées doivent renvoyer vers l’organisme officiel, la banque et les services compétents.
5. Instrumenter le succès sans collecter de données sensibles dans les paramètres, les événements ou les logs client.
6. Tester le formulaire sur mobile : les formats Meta renverront majoritairement vers un parcours mobile avec upload de captures.
7. Créer des visuels fictifs, floutés et non actionnables ; ne jamais utiliser un véritable lien de phishing dans une annonce ou une créa.

## 8. Ordre de lancement conseillé

1. `/verifier-lien`, `/verifier-sms` et `/verifier-email` : intention forte et proposition immédiatement compréhensible.
2. `/verifier-document` : lancement après validation de l’expérience d’upload mobile.
3. `/apres-clic-lien-suspect` : retargeting et contenu de confiance.
4. `/pour-les-entreprises` : seulement après définition de l’offre B2B, du délai, du modèle commercial et du parcours de contact.
5. `/pour-les-institutions` : plutôt partenariat, SEO et relais que conversion directe.

## 9. Résumé décisionnel

Le meilleur premier plan média est un ensemble de trois campagnes spécialisées — email, SMS et lien — chacune envoyant vers sa landing dédiée et optimisant sur `submission_success`. La page d’accueil sert de fallback et de retargeting. Les pages entreprises et institutions sont pertinentes pour le positionnement, mais ne sont pas encore assez instrumentées ni packagées pour être les premières destinations d’un budget Meta Ads.
