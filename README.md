# Anti-Phishing

## Introduction

Ce dépôt a pour objectif exclusif de contenir le code source du site **Anti-Phishing**.

Le service permet à un visiteur de nous transmettre un ou plusieurs éléments suspects — par exemple un email, un message, une capture d’écran, un document, un lien ou tout autre asset — afin d’obtenir un **avis sur leur légitimité**.

Le fonctionnement est volontairement simple :

1. Le visiteur soumet les éléments qu’il souhaite faire vérifier.
2. La demande est enregistrée et transmise pour analyse.
3. Un avis est rendu afin d’indiquer si le contenu semble **légitime**, **suspect** ou susceptible d’être une tentative de **phishing**.
4. Le visiteur reçoit le retour par **email**.

L’objectif du produit n’est pas de présenter une détection automatique comme une certitude, mais de fournir un point de contrôle simple et accessible lorsqu’un utilisateur a un doute avant de cliquer, répondre, payer, télécharger un fichier ou transmettre des informations sensibles.

> Ce dépôt est dédié au code du produit. La méthodologie d’analyse, les procédures internes et les éventuels outils opérationnels peuvent être documentés séparément.

## Méthodologie de développement

Le projet est conçu pour pouvoir être développé et maintenu **principalement par langage naturel, via des agents de code**.

L’objectif n’est pas de dépendre de la mémoire d’une conversation ou d’un agent particulier. Les décisions importantes, les contraintes du projet et les comportements attendus doivent être conservés dans le dépôt afin qu’un nouvel agent puisse reprendre le projet avec le minimum de contexte externe.

La méthodologie retenue repose sur les principes suivants :

- **Spec-Driven Development** : les fonctionnalités importantes doivent être décrites avant leur implémentation.
- **`AGENTS.md` comme constitution du projet** : les règles permanentes de développement sont versionnées avec le code.
- **Documentation des décisions d’architecture** : une décision durable doit pouvoir être comprise plus tard sans retrouver la conversation qui l’a produite.
- **Tests comme contrats exécutables** : les comportements critiques doivent être protégés par des tests.
- **Petites modifications traçables** : préférer des changements ciblés et faciles à relire aux refontes massives.
- **CI comme arbitre** : le lint, le typage, les tests et le build doivent pouvoir valider automatiquement qu’un changement reste sain.

### Source de vérité

La conversation avec un agent est temporaire. **Le dépôt est la source de vérité.**

Toute information nécessaire pour comprendre, maintenir ou modifier correctement le logiciel à long terme doit finir dans un élément versionné du projet : code, test, documentation, spécification ou décision d’architecture.

Une décision importante ne doit pas exister uniquement dans un prompt ou dans l’historique d’un chat.

### Workflow recommandé

Pour une fonctionnalité non triviale :

1. Décrire le besoin et le comportement attendu.
2. Créer ou mettre à jour une spécification.
3. Identifier les critères d’acceptation et les cas limites.
4. Produire un plan technique simple.
5. Implémenter par petites étapes.
6. Ajouter ou mettre à jour les tests nécessaires.
7. Vérifier le typage, le lint, les tests et le build.
8. Mettre à jour la documentation si le comportement ou l’architecture a changé.

L’agent doit privilégier la modification de l’existant plutôt que la duplication et préserver les abstractions déjà établies lorsqu’elles restent pertinentes.

### Structure documentaire cible

Le projet peut progressivement adopter une structure de ce type :

```text
anti-phishing/
├── AGENTS.md
├── README.md
├── docs/
│   ├── architecture.md
│   └── adr/
├── specs/
├── src/
├── tests/
└── .github/
    └── workflows/
```

Cette structure n’impose pas de créer immédiatement tous les fichiers ou dossiers : ils doivent apparaître lorsqu’ils deviennent utiles au projet.

### Maintenabilité

Le code de ce dépôt est destiné à être **relu, réinterprété et modifié en permanence par des humains et des agents**.

La lisibilité et la simplicité sont donc des contraintes produit à part entière. Une implémentation légèrement plus longue mais explicite, testable et facile à reprendre est préférable à une solution astucieuse mais opaque.

Les règles détaillées à destination des agents sont définies dans [`AGENTS.md`](./AGENTS.md).
