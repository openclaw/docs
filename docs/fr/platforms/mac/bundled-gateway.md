---
read_when:
    - Conditionnement d’OpenClaw.app
    - Débogage du service launchd du Gateway macOS
    - Installation de la CLI Gateway pour macOS
summary: Exécution du Gateway sur macOS (service launchd externe)
title: Gateway sur macOS
x-i18n:
    generated_at: "2026-07-04T06:31:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app n’intègre plus Node/Bun ni le runtime Gateway. L’application macOS
s’attend à une installation **externe** de la CLI `openclaw`, ne lance pas le
Gateway comme processus enfant, et gère un service launchd par utilisateur pour
maintenir le Gateway en cours d’exécution (ou se connecte à un Gateway local
existant si l’un d’eux est déjà en cours d’exécution).

## Configuration automatique

Sur un nouveau Mac, choisissez **Ce Mac** pendant l’intégration. L’application exécute son programme d’installation signé
et intégré avant l’assistant Gateway, installe un runtime Node en espace utilisateur
et la CLI `openclaw` correspondante sous `~/.openclaw`, puis installe et démarre le
service launchd par utilisateur. Ce parcours ne nécessite ni Terminal, ni Homebrew, ni
accès administrateur.

L’application intègre le script d’installation, mais pas la charge utile Node ou Gateway. La configuration
nécessite donc une connexion Internet pour télécharger le runtime et le paquet
OpenClaw correspondant.

## Récupération manuelle

Node 24 est recommandé pour une installation manuelle. Node 22 LTS, actuellement `22.19+`,
fonctionne également. Installez ensuite `openclaw` globalement :

```bash
npm install -g openclaw@<version>
```

Utilisez **Réessayer la configuration** après l’échec d’une configuration automatique. Si cela échoue encore, installez
la CLI manuellement avec la commande ci-dessus, puis choisissez **Vérifier à nouveau** pendant
l’intégration. Node reste le runtime Gateway recommandé.

## Launchd (Gateway comme LaunchAgent)

Libellé :

- `ai.openclaw.gateway` (ou `ai.openclaw.<profile>` ; l’ancien `com.openclaw.*` peut rester)

Emplacement du plist (par utilisateur) :

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (ou `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Gestionnaire :

- L’application macOS gère l’installation/la mise à jour du LaunchAgent en mode Local.
- La CLI peut aussi l’installer : `openclaw gateway install`.

Comportement :

- « OpenClaw actif » active/désactive le LaunchAgent.
- Quitter l’application n’arrête **pas** le Gateway (launchd le maintient en vie).
- Si un Gateway est déjà en cours d’exécution sur le port configuré, l’application s’y connecte
  au lieu d’en démarrer un nouveau.

Journalisation :

- stdout launchd : `~/Library/Logs/openclaw/gateway.log` (les profils utilisent `gateway-<profile>.log`)
- stderr launchd : supprimé

## Compatibilité des versions

L’application macOS vérifie la version du Gateway par rapport à sa propre version. L’intégration
exécute automatiquement la configuration gérée lorsqu’une CLI existante est absente ou
incompatible. Utilisez **Réessayer la configuration** pour relancer l’installation ou **Vérifier à nouveau**
après avoir réparé une CLI externe.

## Répertoire d’état sur macOS

Conservez l’état OpenClaw sur un disque local, non synchronisé. Évitez iCloud Drive et les autres
dossiers synchronisés avec le cloud, car la latence de synchronisation et les verrous de fichiers peuvent affecter les sessions,
les identifiants et l’état du Gateway.

Définissez `OPENCLAW_STATE_DIR` sur un chemin local uniquement lorsque vous avez besoin d’une substitution.
`openclaw doctor` avertit sur les chemins d’état courants synchronisés avec le cloud et recommande
de revenir à un stockage local. Consultez
[variables d’environnement](/fr/help/environment#path-related-env-vars) et
[Doctor](/fr/gateway/doctor).

## Déboguer la connectivité de l’application

Utilisez la CLI de débogage macOS depuis un checkout source pour exercer la même logique de
négociation WebSocket Gateway et de découverte que celle utilisée par l’application :

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` accepte `--url`, `--token`, `--timeout` et `--json`. `discover`
accepte `--timeout`, `--json` et `--include-local`. Comparez la sortie de découverte
avec `openclaw gateway discover --json` lorsque vous devez distinguer la découverte CLI
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

## Associés

- [application macOS](/fr/platforms/macos)
- [runbook Gateway](/fr/gateway)
