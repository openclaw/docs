---
read_when:
    - Exécution de scripts depuis le dépôt
    - Ajout ou modification de scripts sous ./scripts
summary: 'Scripts du dépôt : objectif, périmètre et notes de sécurité'
title: Scripts
x-i18n:
    generated_at: "2026-05-06T07:26:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
---

Le répertoire `scripts/` contient des scripts d’aide pour les flux de travail locaux et les tâches d’exploitation.
Utilisez-les lorsqu’une tâche est clairement liée à un script ; sinon, privilégiez la CLI.

## Conventions

- Les scripts sont **facultatifs** sauf s’ils sont référencés dans la documentation ou les listes de vérification de release.
- Privilégiez les surfaces CLI lorsqu’elles existent (exemple : la surveillance de l’authentification utilise `openclaw models status --check`).
- Partez du principe que les scripts sont propres à l’hôte ; lisez-les avant de les exécuter sur une nouvelle machine.

## Scripts de surveillance de l’authentification

La surveillance de l’authentification est couverte dans [Authentification](/fr/gateway/authentication). Les scripts sous `scripts/` sont des compléments facultatifs pour les flux de travail systemd/Termux sur téléphone.

## Assistant de lecture GitHub

Utilisez `scripts/gh-read` lorsque vous voulez que `gh` utilise un jeton d’installation GitHub App pour les appels de lecture limités au dépôt, tout en laissant le `gh` normal sur votre connexion personnelle pour les actions d’écriture.

Variables d’environnement requises :

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variables d’environnement facultatives :

- `OPENCLAW_GH_READ_INSTALLATION_ID` lorsque vous voulez ignorer la recherche d’installation basée sur le dépôt
- `OPENCLAW_GH_READ_PERMISSIONS` comme substitution séparée par des virgules pour le sous-ensemble d’autorisations de lecture à demander

Ordre de résolution du dépôt :

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Exemples :

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Lors de l’ajout de scripts

- Gardez les scripts ciblés et documentés.
- Ajoutez une courte entrée dans la documentation pertinente (ou créez-en une si elle manque).

## Connexe

- [Tests](/fr/help/testing)
- [Tests en direct](/fr/help/testing-live)
