---
read_when:
    - Emballage de OpenClaw.app
    - Débogage du service launchd du Gateway macOS
    - Installation de la CLI Gateway pour macOS
summary: Exécution du Gateway sur macOS (service launchd externe)
title: Gateway sur macOS
x-i18n:
    generated_at: "2026-06-27T17:43:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76c55e3d24e5bc743233e11be4897f4f2a865c97f2e0d795a472caeb6d097d34
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app n’intègre plus Node/Bun ni le runtime Gateway. L’app macOS
attend une installation **externe** de la CLI `openclaw`, ne lance pas le Gateway
comme processus enfant et gère un service launchd propre à chaque utilisateur pour maintenir le Gateway
en cours d’exécution (ou se connecter à un Gateway local existant si l’un d’eux fonctionne déjà).

## Installer la CLI (requis pour le mode local)

Node 24 est le runtime par défaut sur Mac. Node 22 LTS, actuellement `22.19+`, fonctionne toujours pour la compatibilité. Installez ensuite `openclaw` globalement :

```bash
npm install -g openclaw@<version>
```

Le bouton **Installer la CLI** de l’app macOS exécute le même flux d’installation globale que celui
utilisé en interne par l’app : il privilégie d’abord npm, puis pnpm, puis bun si c’est le seul
gestionnaire de paquets détecté. Node reste le runtime Gateway recommandé.

## Launchd (Gateway en tant que LaunchAgent)

Libellé :

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; l’ancien `com.openclaw.*` peut subsister)

Emplacement du plist (par utilisateur) :

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestionnaire :

- L’app macOS gère l’installation/la mise à jour du LaunchAgent en mode local.
- La CLI peut aussi l’installer : `openclaw gateway install`.

Comportement :

- « OpenClaw actif » active/désactive le LaunchAgent.
- Quitter l’app n’arrête **pas** le Gateway (launchd le maintient actif).
- Si un Gateway fonctionne déjà sur le port configuré, l’app s’y connecte
  au lieu d’en démarrer un nouveau.

Journalisation :

- stdout launchd : `~/Library/Logs/openclaw/gateway.log` (les profils utilisent `gateway-<profile>.log`)
- stderr launchd : supprimé

## Compatibilité des versions

L’app macOS vérifie la version du Gateway par rapport à sa propre version. Si elles sont
incompatibles, mettez à jour la CLI globale pour qu’elle corresponde à la version de l’app.

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

## Connexe

- [app macOS](/fr/platforms/macos)
- [Runbook Gateway](/fr/gateway)
