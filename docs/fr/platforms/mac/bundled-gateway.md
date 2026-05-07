---
read_when:
    - Empaquetage d’OpenClaw.app
    - Débogage du service launchd du Gateway macOS
    - Installation de la CLI Gateway pour macOS
summary: Environnement d’exécution Gateway sur macOS (service launchd externe)
title: Gateway sur macOS
x-i18n:
    generated_at: "2026-05-07T13:22:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app n’intègre plus Node/Bun ni le runtime Gateway. L’application macOS
attend une installation **externe** du CLI `openclaw`, ne lance pas le Gateway
comme processus enfant, et gère un service launchd par utilisateur pour garder le Gateway
en cours d’exécution (ou se rattache à un Gateway local existant si l’un est déjà en cours d’exécution).

## Installer le CLI (requis pour le mode local)

Node 24 est le runtime par défaut sur Mac. Node 22 LTS, actuellement `22.16+`, fonctionne toujours pour la compatibilité. Installez ensuite `openclaw` globalement :

```bash
npm install -g openclaw@<version>
```

Le bouton **Installer le CLI** de l’application macOS exécute le même flux d’installation globale que celui utilisé
en interne par l’application : il privilégie d’abord npm, puis pnpm, puis bun si c’est le seul
gestionnaire de paquets détecté. Node reste le runtime Gateway recommandé.

## Launchd (Gateway comme LaunchAgent)

Libellé :

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; l’ancien `com.openclaw.*` peut rester)

Emplacement du plist (par utilisateur) :

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestionnaire :

- L’application macOS gère l’installation/la mise à jour du LaunchAgent en mode local.
- Le CLI peut aussi l’installer : `openclaw gateway install`.

Comportement :

- « OpenClaw actif » active/désactive le LaunchAgent.
- Quitter l’application n’arrête **pas** le Gateway (launchd le maintient en vie).
- Si un Gateway est déjà en cours d’exécution sur le port configuré, l’application s’y rattache
  au lieu d’en démarrer un nouveau.

Journalisation :

- stdout/err de launchd : `/tmp/openclaw/openclaw-gateway.log`

## Compatibilité des versions

L’application macOS vérifie la version du Gateway par rapport à sa propre version. Si elles sont
incompatibles, mettez à jour le CLI global pour qu’il corresponde à la version de l’application.

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

## Associé

- [application macOS](/fr/platforms/macos)
- [runbook Gateway](/fr/gateway)
