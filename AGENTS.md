# AGENTS.md

Ce fichier définit les règles permanentes que tout agent intervenant sur ce dépôt doit respecter.

Le projet est conçu pour être développé et maintenu largement par prompt. Un agent doit donc agir comme s’il reprenait un logiciel qu’il devra lui-même relire et modifier de nombreuses fois dans le futur.

## Principe fondamental

**Le code est relu en permanence.**

Chaque changement doit être écrit pour rester compréhensible lors des prochaines itérations, y compris lorsqu’un autre agent intervient sans disposer de l’historique de conversation qui a produit le code.

La propreté, la lisibilité, la cohérence et la maintenabilité ne sont pas optionnelles. Elles conditionnent directement la capacité du projet à continuer d’être développé par prompt sur le long terme.

Ne jamais sacrifier durablement la qualité du code pour gagner quelques minutes sur une implémentation.

## Le dépôt est la mémoire du projet

Ne jamais considérer la conversation en cours comme une source de vérité durable.

Toute information nécessaire à une future intervention doit être conservée dans le dépôt sous la forme appropriée :

- code explicite ;
- tests ;
- documentation ;
- spécification ;
- décision d’architecture ;
- commentaire uniquement lorsqu’il explique réellement quelque chose que le code ne peut pas exprimer seul.

Une décision structurante ne doit pas dépendre du souvenir d’un prompt précédent.

## Avant de modifier le code

Avant toute modification significative :

1. Lire ce fichier.
2. Lire le `README.md` et la documentation pertinente.
3. Examiner le code existant directement concerné.
4. Rechercher les abstractions, types, utilitaires et conventions déjà présents avant d’en créer de nouveaux.
5. Identifier les tests existants qui décrivent le comportement actuel.
6. Vérifier qu’une fonctionnalité équivalente ou proche n’existe pas déjà.

Ne pas réinventer une seconde implémentation lorsqu’une abstraction existante peut être proprement étendue.

## Spec-Driven Development

Pour toute fonctionnalité non triviale, commencer par clarifier le comportement attendu avant de produire une quantité importante de code.

Lorsque cela est pertinent, conserver une spécification versionnée dans `specs/` décrivant :

- le problème utilisateur ;
- le comportement attendu ;
- les entrées et sorties ;
- les cas limites ;
- les critères d’acceptation ;
- les contraintes de sécurité et de confidentialité ;
- les éléments explicitement hors périmètre.

Le code doit converger vers la spécification. Si l’implémentation révèle que la spécification était incorrecte ou incomplète, mettre également la spécification à jour.

## Changements petits et ciblés

Préférer les modifications minimales nécessaires pour atteindre l’objectif demandé.

Éviter :

- les refontes massives non demandées ;
- les changements de style sans rapport avec la tâche ;
- les nouvelles dépendances lorsqu’elles ne sont pas nécessaires ;
- les abstractions prématurées ;
- les couches supplémentaires qui n’apportent pas de valeur claire ;
- les duplications créées pour aller plus vite.

Une tâche fonctionnelle ne doit pas devenir implicitement une réécriture générale de l’application.

## Qualité du code

Écrire du code qu’un autre développeur peut comprendre sans explication orale.

Toujours privilégier :

- des noms explicites ;
- des fonctions courtes avec une responsabilité claire ;
- des types précis ;
- des flux de données faciles à suivre ;
- des interfaces simples ;
- un comportement déterministe lorsque possible ;
- une gestion explicite des erreurs ;
- une séparation claire entre logique métier et détails d’infrastructure ;
- la suppression du code mort.

Éviter les clever tricks, les raccourcis opaques et les optimisations prématurées.

Si une partie du code devient difficile à expliquer simplement, considérer cela comme un signal de dette technique.

## Cohérence

Respecter les conventions déjà établies dans le dépôt avant d’en introduire de nouvelles.

Lorsque plusieurs solutions sont possibles, préférer celle qui s’intègre le plus naturellement au code existant, sauf si l’existant présente un problème clair et documenté.

Ne pas mélanger plusieurs styles architecturaux ou plusieurs façons de résoudre le même problème sans raison forte.

## Tests

Les tests sont des contrats exécutables et constituent une partie essentielle de la mémoire du projet.

Pour toute modification de comportement :

- ajouter ou mettre à jour les tests pertinents ;
- couvrir au minimum le chemin nominal et les cas limites importants ;
- ajouter un test de régression lorsqu’un bug est corrigé ;
- ne pas supprimer ou affaiblir un test uniquement pour faire passer une implémentation incorrecte.

Un changement n’est pas terminé simplement parce qu’il semble fonctionner localement.

## Validation

Avant de considérer une tâche terminée, exécuter lorsque les commandes existent :

- vérification de types ;
- lint ;
- tests ;
- build ;
- tests d’intégration ou E2E pertinents.

Corriger les erreurs introduites par le changement.

Ne jamais prétendre qu’une validation a été effectuée si elle ne l’a pas réellement été.

## Sécurité et anti-phishing

Ce produit traite potentiellement des contenus suspects et des données envoyées par des utilisateurs.

La sécurité doit être considérée dès la conception :

- ne jamais faire confiance aux entrées utilisateur ;
- valider les formats, tailles et types de fichiers ;
- éviter toute exécution directe de contenu transmis ;
- ne jamais exposer de secrets dans le client, les logs ou le dépôt ;
- réduire au minimum les données personnelles stockées ;
- traiter les fichiers et URLs suspects comme hostiles par défaut ;
- éviter d’afficher du contenu non fiable sans échappement ou isolation appropriée ;
- documenter les choix de rétention et de suppression des données lorsqu’ils sont introduits.

Une fonctionnalité qui améliore l’ergonomie mais crée une faille évidente ne doit pas être livrée telle quelle.

## Documentation et décisions d’architecture

Mettre à jour la documentation lorsque le changement modifie :

- l’architecture ;
- le modèle de données ;
- une API publique ou interne importante ;
- le workflow de développement ;
- une contrainte opérationnelle ;
- un comportement produit significatif.

Pour une décision structurante ou difficile à inverser, créer un ADR dans `docs/adr/` lorsque ce dossier existe ou lorsqu’il devient pertinent.

Un ADR doit expliquer au minimum le contexte, la décision prise et ses principales conséquences.

## Dépendances

Avant d’ajouter une dépendance :

1. vérifier que le besoin ne peut pas être satisfait simplement avec l’existant ;
2. vérifier qu’elle est réellement nécessaire ;
3. éviter les bibliothèques abandonnées ou disproportionnées ;
4. limiter le nombre de dépendances responsables d’une fonction triviale.

Le coût de maintenance futur fait partie du coût d’une dépendance.

## Refactoring continu

Puisque le code est relu et modifié en permanence, profiter d’une modification pour nettoyer les problèmes directement adjacents uniquement lorsque cela reste local, sûr et améliore clairement la compréhension.

Ne pas laisser volontairement derrière soi :

- des noms devenus faux ;
- des branches impossibles ;
- des TODO vagues ;
- du code commenté ;
- des abstractions dupliquées ;
- des hacks temporaires sans explication.

Si un compromis temporaire est réellement nécessaire, le rendre explicite et expliquer pourquoi il existe.

## Définition de terminé

Une tâche peut être considérée comme terminée lorsque :

1. le comportement demandé est implémenté ;
2. l’implémentation reste simple et cohérente avec le projet ;
3. les tests pertinents existent et passent ;
4. le lint, le typage et le build passent lorsqu’ils sont disponibles ;
5. aucun code mort ou debug temporaire n’a été laissé ;
6. la documentation nécessaire a été mise à jour ;
7. un futur agent peut comprendre le changement depuis le dépôt seul.

## Règle finale

**Optimiser chaque changement non seulement pour qu’il fonctionne aujourd’hui, mais pour qu’il reste facile à comprendre, vérifier et modifier demain.**

Dans ce projet, un code difficile à reprendre est un code qui menace directement la capacité du produit à survivre sur le long terme.
