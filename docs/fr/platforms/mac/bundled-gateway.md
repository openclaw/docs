---
read_when:
    - Empaquetage d’OpenClaw.app
    - Débogage du service launchd du Gateway macOS
    - Installation de la CLI Gateway pour macOS
summary: Environnement d’exécution du Gateway sur macOS (service launchd externe)
title: Gateway sur macOS
x-i18n:
    generated_at: "2026-05-06T07:31:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app n’intègre plus Node/Bun ni le runtime Gateway. L’application macOS
attend une installation **externe** de la CLI `openclaw`, ne lance pas le Gateway
comme processus enfant et gère un service launchd par utilisateur pour maintenir
le Gateway en cours d’exécution (ou se connecte à un Gateway local existant s’il
est déjà en cours d’exécution).

## Installer la CLI (requis pour le mode local)

Node 24 est le runtime par défaut sur Mac. Node 22 LTS, actuellement `22.14+`, fonctionne toujours pour la compatibilité. Installez ensuite `openclaw` globalement :

```bash
npm install -g openclaw@<version>
```

Le bouton **Installer la CLI** de l’application macOS exécute le même flux
d’installation globale que celui utilisé en interne par l’application : il
préfère d’abord npm, puis pnpm, puis bun si c’est le seul gestionnaire de paquets
détecté. Node reste le runtime Gateway recommandé.

## Launchd (Gateway comme LaunchAgent)

Libellé :

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; l’ancien `com.openclaw.*` peut subsister)

Emplacement du plist (par utilisateur) :

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestionnaire :

- L’application macOS prend en charge l’installation/la mise à jour du LaunchAgent en mode Local.
- La CLI peut aussi l’installer : `openclaw gateway install`.

Comportement :

- « OpenClaw actif » active/désactive le LaunchAgent.
- Quitter l’application n’arrête **pas** le Gateway (launchd le maintient actif).
- Si un Gateway est déjà en cours d’exécution sur le port configuré, l’application s’y connecte
  au lieu d’en démarrer un nouveau.

Journalisation :

- stdout/err de launchd : `/tmp/openclaw/openclaw-gateway.log`

## Compatibilité des versions

L’application macOS vérifie la version du Gateway par rapport à sa propre version. Si elles sont
incompatibles, mettez à jour la CLI globale pour qu’elle corresponde à la version de l’application.

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

## Voir aussi

- [application macOS](/fr/platforms/macos)
- [runbook Gateway](/fr/gateway)
