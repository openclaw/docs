---
read_when:
    - Exécution de scripts depuis le dépôt
    - Ajout ou modification de scripts dans ./scripts
summary: 'Scripts du dépôt : objectif, portée et consignes de sécurité'
title: Scripts
x-i18n:
    generated_at: "2026-07-12T15:25:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` contient des scripts auxiliaires pour les workflows locaux et les tâches d’exploitation. Utilisez-les lorsqu’une tâche est clairement liée à un script ; sinon, privilégiez la CLI.

## Conventions

- Les scripts sont **facultatifs**, sauf s’ils sont mentionnés dans la documentation ou les listes de contrôle de publication.
- Privilégiez les interfaces CLI lorsqu’elles existent (exemple : `openclaw models status --check`).
- Partez du principe que les scripts sont spécifiques à l’hôte ; lisez-les avant de les exécuter sur une nouvelle machine.

## Scripts de surveillance de l’authentification

L’authentification générale des modèles est traitée dans [Authentification](/fr/gateway/authentication). Les scripts ci-dessous constituent un système distinct et facultatif permettant de surveiller un **jeton d’abonnement à la CLI Claude Code** sur un hôte distant/sans interface graphique et de se réauthentifier depuis un téléphone :

- `scripts/setup-auth-system.sh` - configuration initiale : vérifie l’authentification actuelle, aide à générer un `claude setup-token` à longue durée de vie et affiche les étapes d’installation pour systemd/Termux.
- `scripts/claude-auth-status.sh [full|json|simple]` - vérifie l’état de l’authentification de Claude Code et d’OpenClaw.
- `scripts/auth-monitor.sh` - interroge périodiquement l’état et envoie une notification (via l’envoi OpenClaw et/ou ntfy.sh) lorsque le jeton approche de son expiration. Variables d’environnement : `WARN_HOURS` (valeur par défaut : `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Exécutez-le selon une planification à l’aide des fichiers `scripts/systemd/openclaw-auth-monitor.{service,timer}` fournis (toutes les 30 minutes).
- `scripts/mobile-reauth.sh` - réexécute `claude setup-token` et affiche les URL à ouvrir sur un téléphone, pour une utilisation via SSH depuis Termux.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` - scripts Termux:Widget qui se connectent à l’hôte via SSH, affichent une notification éphémère d’état et ouvrent la console/les instructions de réauthentification lorsque l’authentification a expiré.

## Utilitaire de lecture GitHub

Utilisez `scripts/gh-read` lorsque vous souhaitez que `gh` utilise un jeton d’installation d’application GitHub pour les appels en lecture limités au dépôt, tout en laissant le `gh` normal connecté à votre compte personnel pour les actions d’écriture.

Variables d’environnement requises :

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Variables d’environnement facultatives :

- `OPENCLAW_GH_READ_INSTALLATION_ID` lorsque vous souhaitez ignorer la recherche de l’installation basée sur le dépôt
- `OPENCLAW_GH_READ_PERMISSIONS` comme remplacement, séparé par des virgules, du sous-ensemble d’autorisations de lecture à demander

Ordre de résolution du dépôt :

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Exemples :

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Lors de l’ajout de scripts

- Veillez à ce que les scripts restent ciblés et documentés.
- Ajoutez une courte entrée dans la documentation pertinente (ou créez-en une si elle n’existe pas).

## Ressources connexes

- [Tests](/fr/help/testing)
- [Tests en conditions réelles](/fr/help/testing-live)
