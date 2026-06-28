---
read_when:
    - Emballer OpenClaw.app
    - Débogage du service launchd du Gateway macOS
    - Installation de la CLI Gateway pour macOS
summary: Exécution du Gateway sur macOS (service launchd externe)
title: Gateway sur macOS
x-i18n:
    generated_at: "2026-06-28T00:12:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app n’intègre plus Node/Bun ni le runtime Gateway. L’application macOS
s’attend à une installation **externe** de la CLI `openclaw`, ne lance pas le Gateway
comme processus enfant et gère un service launchd par utilisateur pour maintenir le Gateway
en cours d’exécution (ou se connecte à un Gateway local existant s’il est déjà en cours d’exécution).

## Installer la CLI (requis pour le mode local)

Node 24 est le runtime par défaut sur Mac. Node 22 LTS, actuellement `22.19+`, fonctionne encore pour la compatibilité. Installez ensuite `openclaw` globalement :

```bash
npm install -g openclaw@<version>
```

Le bouton **Installer la CLI** de l’application macOS exécute le même flux d’installation globale que l’application
utilise en interne : il privilégie d’abord npm, puis pnpm, puis bun si c’est le seul
gestionnaire de paquets détecté. Node reste le runtime Gateway recommandé.

## Launchd (Gateway comme LaunchAgent)

Libellé :

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; l’ancien `com.openclaw.*` peut subsister)

Emplacement du plist (par utilisateur) :

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestionnaire :

- L’application macOS gère l’installation/la mise à jour du LaunchAgent en mode local.
- La CLI peut aussi l’installer : `openclaw gateway install`.

Comportement :

- « OpenClaw Active » active/désactive le LaunchAgent.
- Quitter l’application n’arrête **pas** le Gateway (launchd le maintient en vie).
- Si un Gateway est déjà en cours d’exécution sur le port configuré, l’application s’y connecte
  au lieu d’en démarrer un nouveau.

Journalisation :

- stdout de launchd : `~/Library/Logs/openclaw/gateway.log` (les profils utilisent `gateway-<profile>.log`)
- stderr de launchd : supprimé

## Compatibilité des versions

L’application macOS compare la version du Gateway à sa propre version. Si elles sont
incompatibles, mettez à jour la CLI globale pour qu’elle corresponde à la version de l’application.

## Répertoire d’état sur macOS

Conservez l’état d’OpenClaw sur un disque local non synchronisé. Évitez iCloud Drive et les autres
dossiers synchronisés avec le cloud, car la latence de synchronisation et les verrous de fichiers peuvent affecter les sessions,
les identifiants et l’état du Gateway.

Définissez `OPENCLAW_STATE_DIR` sur un chemin local uniquement lorsque vous avez besoin d’un remplacement.
`openclaw doctor` avertit au sujet des chemins d’état courants synchronisés avec le cloud et recommande
de revenir à un stockage local. Consultez
[variables d’environnement](/fr/help/environment#path-related-env-vars) et
[Doctor](/fr/gateway/doctor).

## Déboguer la connectivité de l’application

Utilisez la CLI de débogage macOS depuis un checkout source pour exercer la même logique de
découverte et de handshake WebSocket Gateway que celle utilisée par l’application :

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` accepte `--url`, `--token`, `--timeout` et `--json`. `discover`
accepte `--timeout`, `--json` et `--include-local`. Comparez la sortie de découverte
avec `openclaw gateway discover --json` lorsque vous devez distinguer la découverte par la CLI
des problèmes de connexion côté application.

## Vérification rapide

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Puis :

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```

## Articles connexes

- [application macOS](/fr/platforms/macos)
- [runbook Gateway](/fr/gateway)
