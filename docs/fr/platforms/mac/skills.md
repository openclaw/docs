---
read_when:
    - Mise à jour de l’interface utilisateur des paramètres Skills macOS
    - Modification du verrouillage des Skills ou du comportement d’installation
summary: Interface des réglages Skills macOS et statut adossé au Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:44:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

L’app macOS expose les Skills OpenClaw via le Gateway ; il n’analyse pas les Skills localement.

## Source de données

- `skills.status` (Gateway) renvoie tous les Skills avec leur éligibilité et les exigences manquantes
  (y compris les blocages par liste d’autorisation pour les Skills groupés).
- Les exigences sont dérivées de `metadata.openclaw.requires` dans chaque `SKILL.md`.

## Actions d’installation

- `metadata.openclaw.install` définit les options d’installation (brew/node/go/uv).
- L’app appelle `skills.install` pour exécuter les programmes d’installation sur l’hôte Gateway.
- La stratégie `security.installPolicy`, contrôlée par l’opérateur, peut bloquer les installations de Skills
  adossées au Gateway avant l’exécution des métadonnées d’installation. Le blocage intégré du code dangereux
  au moment de l’installation ne fait pas partie du flux d’installation des Skills.
- Si chaque option d’installation est `download`, le Gateway expose tous les
  choix de téléchargement.
- Sinon, le Gateway choisit un programme d’installation préféré à l’aide des préférences
  d’installation actuelles et des binaires de l’hôte : Homebrew d’abord quand
  `skills.install.preferBrew` est activé et que `brew` existe, puis `uv`, puis le
  gestionnaire Node configuré depuis `skills.install.nodeManager`, puis les solutions
  de repli ultérieures comme `go` ou `download`.
- Les libellés d’installation Node reflètent le gestionnaire Node configuré, y compris `yarn`.

## Clés Env/API

- L’app stocke les clés dans `~/.openclaw/openclaw.json` sous `skills.entries.<skillKey>`.
- `skills.update` applique des correctifs à `enabled`, `apiKey` et `env`.

## Mode distant

- Les mises à jour d’installation et de configuration ont lieu sur l’hôte Gateway (et non sur le Mac local).

## Associés

- [Skills](/fr/tools/skills)
- [app macOS](/fr/platforms/macos)
