---
read_when:
    - Planification d’un vaste chantier de modernisation de l’application OpenClaw
    - Mise à jour des standards d’implémentation front-end pour les travaux sur l’application ou l’interface de contrôle
    - Transformer une revue globale de la qualité produit en travail d’ingénierie par phases
summary: Plan complet de modernisation de l’application avec mises à jour de la compétence de livraison frontend
title: Plan de modernisation des applications
x-i18n:
    generated_at: "2026-05-06T07:37:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c97bd9c76492b9e7beb0a2623f583a54b5461bebb848fa3ac7e4495322f6456
    source_path: reference/application-modernization-plan.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## Objectif

Faire évoluer l’application vers un produit plus propre, plus rapide et plus maintenable sans
casser les workflows actuels ni masquer les risques dans de larges refactorisations. Le travail doit
être livré sous forme de petites tranches vérifiables, avec une preuve pour chaque surface touchée.

## Principes

- Préserver l’architecture actuelle sauf si une frontière provoque manifestement du remaniement,
  un coût de performance ou des bugs visibles par l’utilisateur.
- Préférer le plus petit correctif juste pour chaque problème, puis répéter.
- Séparer les corrections requises des améliorations facultatives afin que les mainteneurs puissent intégrer un travail à forte
  valeur sans attendre des décisions subjectives.
- Garder le comportement exposé aux plugins documenté et rétrocompatible.
- Vérifier le comportement livré, les contrats de dépendances et les tests avant d’affirmer qu’une
  régression est corrigée.
- Améliorer d’abord le parcours utilisateur principal : intégration, auth, chat, configuration des fournisseurs,
  gestion des plugins et diagnostics.

## Phase 1 : audit de référence

Inventorier l’application actuelle avant de la modifier.

- Identifier les principaux workflows utilisateur et les surfaces de code qui les possèdent.
- Lister les affordances mortes, les paramètres dupliqués, les états d’erreur peu clairs et les chemins de rendu
  coûteux.
- Capturer les commandes de validation actuelles pour chaque surface.
- Marquer les problèmes comme requis, recommandés ou facultatifs.
- Documenter les bloqueurs connus qui nécessitent une revue du propriétaire, en particulier les changements d’API, de sécurité,
  de release et de contrat de plugin.

Définition de terminé :

- Une liste de problèmes avec des références de fichiers depuis la racine du dépôt.
- Chaque problème a une sévérité, une surface propriétaire, un impact utilisateur attendu et un chemin de
  validation proposé.
- Aucun élément de nettoyage spéculatif n’est mélangé aux corrections requises.

## Phase 2 : nettoyage produit et UX

Prioriser les workflows visibles et supprimer la confusion.

- Resserrer le texte d’intégration et les états vides autour de l’auth de modèle, du statut du Gateway
  et de la configuration des plugins.
- Supprimer ou désactiver les affordances mortes lorsqu’aucune action n’est possible.
- Garder les actions importantes visibles sur les largeurs responsive au lieu de les masquer
  derrière des hypothèses de mise en page fragiles.
- Consolider le langage de statut répété afin que les erreurs aient une seule source de vérité.
- Ajouter une divulgation progressive pour les paramètres avancés tout en gardant la configuration de base rapide.

Validation recommandée :

- Parcours heureux manuel pour la configuration au premier lancement et le démarrage d’un utilisateur existant.
- Tests ciblés pour toute logique de routage, de persistance de configuration ou de dérivation de statut.
- Captures d’écran du navigateur pour les surfaces responsive modifiées.

## Phase 3 : resserrement de l’architecture frontend

Améliorer la maintenabilité sans réécriture large.

- Déplacer les transformations d’état UI répétées dans des helpers typés étroits.
- Séparer les responsabilités de récupération de données, de persistance et de présentation.
- Préférer les hooks, stores et motifs de composants existants aux nouvelles abstractions.
- Diviser les composants surdimensionnés uniquement lorsque cela réduit le couplage ou clarifie les tests.
- Éviter d’introduire un état global large pour les interactions locales de panneau.

Garde-fous requis :

- Ne pas changer le comportement public comme effet secondaire d’un découpage de fichiers.
- Préserver le comportement d’accessibilité pour les menus, boîtes de dialogue, onglets et la navigation
  clavier.
- Vérifier que les états de chargement, vides, d’erreur et optimistes s’affichent toujours.

## Phase 4 : performance et fiabilité

Cibler la douleur mesurée plutôt qu’une optimisation théorique large.

- Mesurer les coûts du démarrage, des transitions de route, des grandes listes et des transcriptions de chat.
- Remplacer les données dérivées coûteuses et répétées par des sélecteurs mémorisés ou des
  helpers mis en cache lorsque le profilage en prouve la valeur.
- Réduire les analyses réseau ou système de fichiers évitables sur les chemins chauds.
- Garder un ordre déterministe pour les entrées de prompt, registre, fichier, plugin et réseau
  avant la construction de la charge utile du modèle.
- Ajouter des tests de régression légers pour les helpers chauds et les frontières de contrat.

Définition de terminé :

- Chaque changement de performance enregistre la référence de départ, l’impact attendu, l’impact réel et
  l’écart restant.
- Aucun correctif de performance n’est intégré uniquement à l’intuition lorsqu’une mesure peu coûteuse est disponible.

## Phase 5 : durcissement des types, contrats et tests

Renforcer la justesse aux points de frontière dont dépendent les utilisateurs et les auteurs de plugins.

- Remplacer les chaînes runtime lâches par des unions discriminées ou des listes de codes fermées.
- Valider les entrées externes avec les helpers de schéma existants ou zod.
- Ajouter des tests de contrat autour des manifestes de plugins, des catalogues de fournisseurs, des messages de protocole du Gateway
  et du comportement de migration de configuration.
- Garder les chemins de compatibilité dans les flux doctor ou repair plutôt que dans des
  migrations cachées au démarrage.
- Éviter le couplage de tests aux internes des plugins ; utiliser les façades SDK et les barrels
  documentés.

Validation recommandée :

- `pnpm check:changed`
- Tests ciblés pour chaque frontière modifiée.
- `pnpm build` lorsque les frontières paresseuses, le packaging ou les surfaces publiées changent.

## Phase 6 : documentation et préparation de release

Garder la documentation destinée aux utilisateurs alignée sur le comportement.

- Mettre à jour la documentation avec les changements de comportement, d’API, de configuration, d’intégration ou de plugin.
- Ajouter des entrées de changelog uniquement pour les changements visibles par l’utilisateur.
- Garder la terminologie des plugins destinée aux utilisateurs ; utiliser les noms de packages internes uniquement lorsque
  nécessaire pour les contributeurs.
- Confirmer que les instructions de release et d’installation correspondent toujours à la surface de commandes
  actuelle.

Définition de terminé :

- La documentation pertinente est mise à jour dans la même branche que les changements de comportement.
- Les vérifications de documentation générée ou de dérive d’API passent lorsqu’elles sont touchées.
- Le transfert nomme toute validation ignorée et la raison de cet évitement.

## Première tranche recommandée

Commencer par une passe ciblée sur la Control UI et l’intégration :

- Auditer la configuration au premier lancement, la disponibilité de l’auth fournisseur, le statut du Gateway et les surfaces de
  configuration des plugins.
- Supprimer les actions mortes et clarifier les états d’échec.
- Ajouter ou mettre à jour des tests ciblés pour la dérivation de statut et la persistance de configuration.
- Exécuter `pnpm check:changed`.

Cela donne une forte valeur utilisateur avec un risque architectural limité.

## Mise à jour de la skill frontend

Utilisez cette section pour mettre à jour le `SKILL.md` centré sur le frontend fourni avec la
tâche de modernisation. Si vous adoptez ce guide comme skill OpenClaw locale au dépôt,
créez d’abord `.agents/skills/openclaw-frontend/SKILL.md`, conservez le frontmatter
qui appartient à cette skill cible, puis ajoutez ou remplacez les directives du corps par
le contenu suivant.

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
