---
read_when:
    - Exécuter des scripts depuis le dépôt
    - Ajouter ou modifier des scripts sous `./scripts`
summary: 'Scripts du dépôt : objectif, portée et remarques de sécurité'
title: Scripts
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T07:14:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

Le répertoire `scripts/` contient des scripts d’assistance pour les flux de travail locaux et les tâches d’exploitation.
Utilisez-les lorsqu’une tâche est clairement liée à un script ; sinon préférez la CLI.

## Conventions

- Les scripts sont **facultatifs** sauf s’ils sont référencés dans la documentation ou les listes de contrôle de publication.
- Préférez les surfaces CLI lorsqu’elles existent (exemple : la surveillance de l’authentification utilise `openclaw models status --check`).
- Supposez que les scripts sont spécifiques à l’hôte ; lisez-les avant de les exécuter sur une nouvelle machine.

## Scripts de surveillance de l’authentification

La surveillance de l’authentification est couverte dans [Authentification](/fr/gateway/authentication). Les scripts sous `scripts/` sont des extras facultatifs pour les flux systemd/Termux sur téléphone.

## Assistant de lecture GitHub

Utilisez `scripts/gh-read` lorsque vous voulez que `gh` utilise un jeton d’installation GitHub App pour des appels de lecture limités au dépôt, tout en laissant le `gh` normal sur votre connexion personnelle pour les actions d’écriture.

Variables d’environnement requises :

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variables d’environnement facultatives :

- `OPENCLAW_GH_READ_INSTALLATION_ID` si vous voulez ignorer la recherche d’installation basée sur le dépôt
- `OPENCLAW_GH_READ_PERMISSIONS` comme remplacement séparé par des virgules pour le sous-ensemble d’autorisations de lecture à demander

Ordre de résolution du dépôt :

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Exemples :

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Lors de l’ajout de scripts

- Gardez les scripts ciblés et documentés.
- Ajoutez une courte entrée dans la documentation pertinente (ou créez-en une si elle manque).

## Voir aussi

- [Tests](/fr/help/testing)
- [Tests live](/fr/help/testing-live)
