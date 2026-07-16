---
read_when:
    - Empaquetage d’OpenClaw.app
    - Débogage du service launchd du Gateway sous macOS
    - Installation de la CLI du Gateway pour macOS
summary: Runtime du Gateway sur macOS (service launchd externe)
title: Gateway sur macOS
x-i18n:
    generated_at: "2026-07-16T13:30:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 30c1ae14d8f8eaab73d0e2b725292d7411c2c8b5e0e0c32ad13989c01340d054
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app n’inclut ni Node ni l’environnement d’exécution du Gateway. L’application macOS
nécessite une installation **externe** de la CLI `openclaw`, ne lance pas le Gateway en tant que
processus enfant et gère un service launchd par utilisateur afin de maintenir le Gateway
en cours d’exécution (ou se connecte à un Gateway local déjà en cours d’exécution).

## Configuration automatique

Sur un nouveau Mac, choisissez **This Mac** pendant l’intégration. L’application exécute son
script d’installation signé et inclus avant l’assistant du Gateway : il installe un
environnement d’exécution Node dans l’espace utilisateur et la CLI `openclaw` correspondante sous `~/.openclaw`,
puis installe et démarre le service launchd par utilisateur. Cette méthode ne nécessite ni
Terminal, ni Homebrew, ni accès administrateur.

L’application inclut uniquement le script d’installation, et non les composants Node ou Gateway ;
la configuration nécessite une connexion Internet pour télécharger l’environnement d’exécution et le paquet
OpenClaw correspondant.

## Récupération manuelle

Node 24.15+ est recommandé pour une installation manuelle ; Node 22.22.3+ fonctionne également. Installez
`openclaw` globalement :

```bash
npm install -g openclaw@<version>
```

Utilisez **Retry setup** après l’échec d’une configuration automatique. Si cela échoue encore,
installez manuellement la CLI avec la commande ci-dessus, puis choisissez **Check again**
pendant l’intégration.

## Launchd (Gateway en tant que LaunchAgent)

Libellé : `ai.openclaw.gateway` (profil par défaut), ou `ai.openclaw.<profile>`
pour un profil nommé.

Emplacement du fichier plist (par utilisateur) : `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
(ou `ai.openclaw.<profile>.plist`).

L’application macOS gère l’installation et la mise à jour du LaunchAgent pour le profil par défaut en
mode Local. La CLI peut également l’installer directement : `openclaw gateway install`
(les profils nommés sont sélectionnés au moyen de la variable d’environnement `OPENCLAW_PROFILE`).

Comportement :

- « OpenClaw Active » active ou désactive le LaunchAgent.
- Quitter l’application **n’arrête pas** le Gateway (launchd le maintient actif).
- Si un Gateway est déjà en cours d’exécution sur le port configuré, l’application s’y connecte
  au lieu d’en démarrer un nouveau.

Journalisation :

- Sortie standard de launchd : `~/Library/Logs/openclaw/gateway.log` (les profils utilisent
  `gateway-<profile>.log`)
- Sortie d’erreur de launchd : supprimée
- Si l’hôte entre dans une boucle avec des messages `EADDRINUSE` répétés ou des redémarrages rapides, recherchez
  des LaunchAgents `ai.openclaw.gateway` / `ai.openclaw.node` en double et consultez la
  solution de contournement du marqueur launchd dans
  [le dépannage du Gateway](/fr/gateway/troubleshooting#macos-launchd-supervisor-loop-with-duplicate-gatewaynode-launchagents).

## Compatibilité des versions

L’application macOS compare la version du Gateway à sa propre version. L’intégration
exécute automatiquement la configuration gérée lorsqu’une CLI existante est absente ou
incompatible. Utilisez **Retry setup** pour répéter l’installation, ou **Check again**
après avoir réparé une CLI externe.

## Répertoire d’état sous macOS

Conservez l’état d’OpenClaw sur un disque local non synchronisé. Évitez iCloud Drive et les autres
dossiers synchronisés dans le cloud ; la latence de synchronisation et les verrouillages de fichiers peuvent affecter les sessions,
les identifiants et l’état du Gateway.

Définissez `OPENCLAW_STATE_DIR` sur un chemin local uniquement lorsqu’une substitution est nécessaire.
`openclaw doctor` avertit de la présence de chemins d’état courants synchronisés dans le cloud et recommande
de revenir à un stockage local. Consultez
[les variables d’environnement](/fr/help/environment#path-related-env-vars) et
[Doctor](/fr/gateway/doctor).

## Débogage de la connectivité de l’application

Utilisez la CLI de débogage macOS depuis une copie de travail des sources pour tester la même
négociation WebSocket et la même logique de découverte du Gateway que celles utilisées par l’application :

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect` accepte `--url`, `--token`, `--timeout`, `--probe` et `--json`
(ainsi que les substitutions d’identité du client ; exécutez la commande avec `--help` pour obtenir la liste complète).
`discover` accepte `--timeout`, `--json` et `--include-local`. Comparez
la sortie de découverte avec `openclaw gateway discover --json` lorsque vous devez
distinguer les problèmes de découverte de la CLI des problèmes de connexion côté application.

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

- [Application macOS](/fr/platforms/macos)
- [Guide d’exploitation du Gateway](/fr/gateway)
