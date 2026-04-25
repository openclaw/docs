---
read_when:
    - Planification d’une vaste phase de modernisation de l’application OpenClaw
    - Mise à jour des normes d’implémentation frontend pour le travail sur l’application ou l’interface utilisateur de contrôle
    - Transformer un examen global de la qualité du produit en travail d’ingénierie par phases
summary: Plan complet de modernisation d’application avec mises à jour des Skills de livraison frontend
title: Plan de modernisation des applications
x-i18n:
    generated_at: "2026-04-25T13:56:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667a133cb867bb1d4d09e097925704c8b77d20ca6117a62a4c60d29ab1097283
    source_path: reference/application-modernization-plan.md
    workflow: 15
---

# Plan de modernisation des applications

## Objectif

Faire évoluer l’application vers un produit plus propre, plus rapide et plus maintenable sans rompre les flux de travail actuels ni dissimuler les risques dans de vastes refactorisations. Le travail doit être livré en petites tranches révisables, avec des preuves pour chaque surface touchée.

## Principes

- Préserver l’architecture actuelle, sauf si une frontière provoque de façon démontrable de la friction, un coût de performance ou des bugs visibles pour l’utilisateur.
- Préférer le plus petit correctif correct pour chaque problème, puis répéter.
- Séparer les correctifs requis des améliorations facultatives afin que les mainteneurs puissent livrer un travail à forte valeur sans attendre des décisions subjectives.
- Conserver un comportement orienté Plugin documenté et rétrocompatible.
- Vérifier le comportement livré, les contrats de dépendance et les tests avant d’affirmer qu’une régression est corrigée.
- Améliorer d’abord le chemin utilisateur principal : onboarding, authentification, chat, configuration des fournisseurs, gestion des plugins et diagnostics.

## Phase 1 : Audit de référence

Inventorier l’application actuelle avant de la modifier.

- Identifier les principaux flux de travail utilisateur et les surfaces de code qui en sont responsables.
- Lister les affordances mortes, les paramètres dupliqués, les états d’erreur peu clairs et les chemins de rendu coûteux.
- Capturer les commandes de validation actuelles pour chaque surface.
- Marquer les problèmes comme requis, recommandés ou facultatifs.
- Documenter les blocages connus qui nécessitent une revue du responsable, en particulier pour les changements d’API, de sécurité, de publication et de contrat de Plugin.

Définition du terminé :

- Une seule liste de problèmes avec des références de fichiers à la racine du dépôt.
- Chaque problème comporte une gravité, une surface propriétaire, l’impact utilisateur attendu et un chemin de validation proposé.
- Aucun élément de nettoyage spéculatif n’est mélangé aux correctifs requis.

## Phase 2 : Nettoyage produit et UX

Prioriser les flux visibles et supprimer la confusion.

- Affiner les textes d’onboarding et les états vides autour de l’authentification des modèles, de l’état de la Gateway et de la configuration des plugins.
- Supprimer ou désactiver les affordances mortes lorsqu’aucune action n’est possible.
- Garder les actions importantes visibles sur les largeurs responsives au lieu de les cacher derrière des hypothèses de mise en page fragiles.
- Consolider le langage d’état répété afin que les erreurs aient une seule source de vérité.
- Ajouter une divulgation progressive pour les paramètres avancés tout en gardant une configuration de base rapide.

Validation recommandée :

- Parcours manuel du chemin nominal pour la configuration au premier lancement et le démarrage d’un utilisateur existant.
- Tests ciblés pour toute logique de routage, de persistance de configuration ou de dérivation d’état.
- Captures d’écran du navigateur pour les surfaces responsives modifiées.

## Phase 3 : Renforcement de l’architecture frontend

Améliorer la maintenabilité sans réécriture générale.

- Déplacer les transformations répétées d’état UI dans des helpers typés et étroits.
- Garder séparées les responsabilités de récupération des données, de persistance et de présentation.
- Préférer les hooks, stores et modèles de composants existants plutôt que de nouvelles abstractions.
- Scinder les composants surdimensionnés uniquement lorsque cela réduit le couplage ou clarifie les tests.
- Éviter d’introduire un état global étendu pour des interactions locales de panneau.

Garde-fous requis :

- Ne pas modifier le comportement public comme effet de bord d’un découpage de fichier.
- Préserver le comportement d’accessibilité pour les menus, boîtes de dialogue, onglets et la navigation au clavier.
- Vérifier que les états de chargement, vide, erreur et optimiste s’affichent toujours.

## Phase 4 : Performance et fiabilité

Cibler la douleur mesurée plutôt qu’une optimisation théorique générale.

- Mesurer les coûts du démarrage, des transitions de route, des grandes listes et des transcriptions de chat.
- Remplacer les données dérivées coûteuses répétées par des sélecteurs mémoïsés ou des helpers mis en cache lorsque le profilage prouve leur valeur.
- Réduire les scans réseau ou système de fichiers évitables sur les chemins critiques.
- Conserver un ordre déterministe pour les entrées de prompt, de registre, de fichiers, de plugins et de réseau avant la construction de la charge utile du modèle.
- Ajouter des tests de régression légers pour les helpers critiques et les frontières de contrat.

Définition du terminé :

- Chaque changement de performance enregistre la référence, l’impact attendu, l’impact réel et l’écart restant.
- Aucun correctif de performance n’est livré sur la seule intuition lorsqu’une mesure peu coûteuse est disponible.

## Phase 5 : Renforcement des types, contrats et tests

Renforcer la justesse aux points de frontière dont dépendent les utilisateurs et les auteurs de plugins.

- Remplacer les chaînes d’exécution vagues par des unions discriminées ou des listes de codes fermées.
- Valider les entrées externes avec les helpers de schéma existants ou zod.
- Ajouter des tests de contrat autour des manifestes de plugins, des catalogues de fournisseurs, des messages du protocole Gateway et du comportement de migration de configuration.
- Conserver les chemins de compatibilité dans les flux doctor ou de réparation au lieu de migrations cachées au démarrage.
- Éviter le couplage des tests uniquement aux internes des plugins ; utiliser les façades SDK et les barrels documentés.

Validation recommandée :

- `pnpm check:changed`
- Tests ciblés pour chaque frontière modifiée.
- `pnpm build` lorsque les frontières paresseuses, le packaging ou les surfaces publiées changent.

## Phase 6 : Documentation et préparation de la publication

Garder la documentation orientée utilisateur alignée sur le comportement.

- Mettre à jour la documentation avec les changements de comportement, d’API, de configuration, d’onboarding ou de Plugin.
- Ajouter des entrées de changelog uniquement pour les changements visibles par l’utilisateur.
- Conserver une terminologie Plugin orientée utilisateur ; n’utiliser les noms de packages internes que lorsque c’est nécessaire pour les contributeurs.
- Confirmer que les instructions de publication et d’installation correspondent toujours à la surface de commande actuelle.

Définition du terminé :

- La documentation pertinente est mise à jour dans la même branche que les changements de comportement.
- Les vérifications de dérive de documentation générée ou d’API passent lorsqu’elles sont touchées.
- La transmission nomme toute validation ignorée et pourquoi elle a été ignorée.

## Première tranche recommandée

Commencer par une passe ciblée sur l’interface utilisateur de contrôle et l’onboarding :

- Auditer les surfaces de configuration au premier lancement, de préparation de l’authentification du fournisseur, d’état de la Gateway et de configuration des plugins.
- Supprimer les actions mortes et clarifier les états d’échec.
- Ajouter ou mettre à jour des tests ciblés pour la dérivation d’état et la persistance de configuration.
- Exécuter `pnpm check:changed`.

Cela apporte une forte valeur utilisateur avec un risque architectural limité.

## Mise à jour de la skill frontend

Utilisez cette section pour mettre à jour le `SKILL.md` orienté frontend fourni avec la tâche de modernisation. Si vous adoptez cette directive comme une skill OpenClaw locale au dépôt, créez d’abord `.agents/skills/openclaw-frontend/SKILL.md`, conservez le frontmatter qui appartient à cette skill cible, puis ajoutez ou remplacez les directives du corps par le contenu suivant.

```markdown
# Normes de livraison frontend

Utilisez cette skill lors de l’implémentation ou de la revue d’un travail orienté utilisateur sur React, Next.js, une webview desktop ou une UI d’application.

## Règles de fonctionnement

- Partir du flux produit existant et des conventions du code.
- Préférer le plus petit correctif correct qui améliore le chemin utilisateur actuel.
- Séparer les correctifs requis des améliorations facultatives dans la transmission.
- Ne pas créer de pages marketing lorsque la demande concerne une surface de l’application.
- Garder les actions visibles et utilisables sur toutes les tailles de viewport prises en charge.
- Supprimer les affordances mortes au lieu de laisser des contrôles qui ne peuvent rien faire.
- Préserver les états de chargement, vide, erreur, succès et permission.
- Utiliser les composants, hooks, stores et icônes du design system existants avant d’ajouter de nouveaux primitives.

## Liste de contrôle d’implémentation

1. Identifier la tâche utilisateur principale et le composant ou la route qui en est responsable.
2. Lire les modèles de composants locaux avant de modifier.
3. Corriger la surface la plus étroite qui résout le problème.
4. Ajouter des contraintes responsives pour les contrôles à format fixe, les barres d’outils, les grilles et les compteurs afin que le texte et les états de survol ne puissent pas redimensionner la mise en page de manière inattendue.
5. Garder claires les responsabilités de chargement des données, de dérivation d’état et de rendu.
6. Ajouter des tests lorsque la logique, la persistance, le routage, les permissions ou les helpers partagés changent.
7. Vérifier le chemin nominal principal et le cas limite le plus pertinent.

## Portes de qualité visuelle

- Le texte doit tenir dans son conteneur sur mobile et desktop.
- Les barres d’outils peuvent se replier, mais les contrôles doivent rester accessibles.
- Les boutons doivent utiliser des icônes familières lorsque l’icône est plus claire que le texte.
- Les cartes doivent être utilisées pour les éléments répétés, les modales et les outils encadrés, pas pour chaque section de page.
- Éviter les palettes de couleurs monotones et les arrière-plans décoratifs qui rivalisent avec le contenu opérationnel.
- Les surfaces produit denses doivent optimiser le balayage visuel, la comparaison et l’usage répété.

## Format de transmission

Indiquer :

- Ce qui a changé.
- Quel comportement utilisateur a changé.
- La validation requise qui a réussi.
- Toute validation ignorée et la raison concrète.
- Le travail de suivi facultatif, clairement séparé des correctifs requis.
```
