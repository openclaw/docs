---
read_when:
    - Mise à jour de l’interface des réglages Skills sous macOS
    - Modification du filtrage ou du comportement d’installation des Skills
summary: Interface des réglages des Skills sous macOS et état fourni par le Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T02:48:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

L’app macOS expose les Skills d’OpenClaw via le Gateway ; elle n’analyse pas les Skills localement.

## Source des données

- `skills.status` (Gateway) renvoie tous les Skills, ainsi que leur éligibilité et les prérequis manquants, y compris les blocages par liste d’autorisation pour les Skills intégrés.
- Les prérequis proviennent de `metadata.openclaw.requires` dans chaque fichier `SKILL.md`.

## Actions d’installation

- `metadata.openclaw.install` définit les options d’installation (brew/node/go/uv/download).
- L’app appelle `skills.install` pour exécuter les programmes d’installation sur l’hôte du Gateway.
- La stratégie `security.installPolicy` gérée par l’opérateur (`enabled`, `targets`, `exec`) peut bloquer les installations de Skills effectuées via le Gateway avant l’exécution des métadonnées du programme d’installation. L’analyse intégrée du code dangereux (utilisée pour les installations de Plugins) n’est pas intégrée au processus d’installation des Skills.
- Si toutes les options d’installation sont de type `download`, le Gateway expose tous les choix de téléchargement.
- Sinon, le Gateway sélectionne un programme d’installation privilégié en fonction des préférences d’installation actuelles (`skills.install.preferBrew`, `skills.install.nodeManager`) et des exécutables présents sur l’hôte : Homebrew en premier lorsque `preferBrew` est activé et que `brew` est présent, puis `uv`, puis le gestionnaire Node configuré, puis de nouveau Homebrew s’il est disponible (même sans `preferBrew`), puis `go`, et enfin `download`.
- Les libellés d’installation Node reflètent le gestionnaire Node configuré, notamment `yarn`.

## Variables d’environnement/clés d’API

- L’app stocke les clés dans `~/.openclaw/openclaw.json`, sous `skills.entries.<skillKey>`.
- `skills.update` met à jour `enabled`, `apiKey` et `env`.

## Mode distant

- Les mises à jour de l’installation et de la configuration s’effectuent sur l’hôte du Gateway, et non sur le Mac local.

## Pages connexes

- [Skills](/fr/tools/skills)
- [App macOS](/fr/platforms/macos)
