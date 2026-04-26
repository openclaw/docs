---
read_when:
    - Exécuter ou dépanner des configurations de gateway distant
summary: Accès à distance via des tunnels SSH (Gateway WS) et des tailnets
title: Accès à distance
x-i18n:
    generated_at: "2026-04-26T11:30:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 208f0e6a4dbb342df878ea99d70606327efdfd3df36b07dfa3e68aafcae98e5c
    source_path: gateway/remote.md
    workflow: 15
---

Ce dépôt prend en charge le mode « distant via SSH » en maintenant un seul Gateway (le maître) en fonctionnement sur un hôte dédié (desktop/serveur) et en y connectant les clients.

- Pour les **opérateurs (vous / l’app macOS)** : le tunneling SSH est la solution de repli universelle.
- Pour les **Node** (iOS/Android et futurs appareils) : connectez-vous au **WebSocket** du Gateway (LAN/tailnet ou tunnel SSH selon le besoin).

## L’idée de base

- Le WebSocket du Gateway se lie à **loopback** sur le port configuré (18789 par défaut).
- Pour un usage distant, vous transférez ce port loopback via SSH (ou vous utilisez un tailnet/VPN et vous tunnelisez moins).

## Configurations VPN/tailnet courantes (où vit l’agent)

Considérez l’**hôte Gateway** comme « l’endroit où vit l’agent ». C’est lui qui possède les sessions, les profils d’authentification, les canaux et l’état.
Votre laptop/desktop (et les Node) se connectent à cet hôte.

### 1) Gateway toujours actif dans votre tailnet (VPS ou serveur domestique)

Exécutez le Gateway sur un hôte persistant et accédez-y via **Tailscale** ou SSH.

- **Meilleure UX :** conservez `gateway.bind: "loopback"` et utilisez **Tailscale Serve** pour le Control UI.
- **Solution de repli :** conservez loopback + un tunnel SSH depuis toute machine qui a besoin d’un accès.
- **Exemples :** [exe.dev](/fr/install/exe-dev) (VM simple) ou [Hetzner](/fr/install/hetzner) (VPS de production).

C’est idéal lorsque votre laptop se met souvent en veille mais que vous voulez garder l’agent toujours actif.

### 2) Un desktop domestique exécute le Gateway, le laptop sert de contrôle distant

Le laptop n’exécute **pas** l’agent. Il se connecte à distance :

- Utilisez le mode **Remote over SSH** de l’app macOS (Réglages → Général → « OpenClaw runs »).
- L’app ouvre et gère le tunnel, de sorte que WebChat + les vérifications de santé « fonctionnent simplement ».

Procédure : [accès distant macOS](/fr/platforms/mac/remote).

### 3) Le laptop exécute le Gateway, accès distant depuis d’autres machines

Gardez le Gateway en local mais exposez-le en toute sécurité :

- Tunnel SSH vers le laptop depuis d’autres machines, ou
- Tailscale Serve pour le Control UI et Gateway limité à loopback.

Guide : [Tailscale](/fr/gateway/tailscale) et [vue d’ensemble du Web](/fr/web).

## Flux de commande (ce qui s’exécute où)

Un seul service gateway possède l’état + les canaux. Les Node sont des périphériques.

Exemple de flux (Telegram → node) :

- Un message Telegram arrive au **Gateway**.
- Le Gateway exécute l’**agent** et décide s’il doit appeler un outil node.
- Le Gateway appelle le **node** via le WebSocket du Gateway (`node.*` RPC).
- Le node renvoie le résultat ; le Gateway répond vers Telegram.

Remarques :

- **Les Node n’exécutent pas le service gateway.** Un seul gateway doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Plusieurs gateways](/fr/gateway/multiple-gateways)).
- Le « mode node » de l’app macOS n’est qu’un client node via le WebSocket du Gateway.

## Tunnel SSH (CLI + outils)

Créez un tunnel local vers le WS Gateway distant :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Une fois le tunnel actif :

- `openclaw health` et `openclaw status --deep` atteignent désormais le gateway distant via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` et `openclaw gateway call` peuvent aussi cibler l’URL transférée via `--url` si nécessaire.

Remarque : remplacez `18789` par votre `gateway.port` configuré (ou `--port`/`OPENCLAW_GATEWAY_PORT`).
Remarque : lorsque vous passez `--url`, la CLI ne revient pas à la config ni aux identifiants d’environnement.
Incluez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.

## Valeurs par défaut distantes de la CLI

Vous pouvez persister une cible distante afin que les commandes CLI l’utilisent par défaut :

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Lorsque le gateway est limité à loopback, conservez l’URL `ws://127.0.0.1:18789` et ouvrez d’abord le tunnel SSH.
Dans le transport par tunnel SSH de l’app macOS, les noms d’hôte gateway découverts appartiennent à
`gateway.remote.sshTarget` ; `gateway.remote.url` reste l’URL du tunnel local.

## Priorité des identifiants

La résolution des identifiants du Gateway suit un contrat partagé entre les chemins call/probe/status et la surveillance des approbations d’exécution Discord. Node-host utilise le même contrat de base avec une exception en mode local (il ignore intentionnellement `gateway.remote.*`) :

- Les identifiants explicites (`--token`, `--password` ou l’outil `gatewayToken`) l’emportent toujours sur les chemins d’appel qui acceptent une authentification explicite.
- Sécurité des substitutions d’URL :
  - Les substitutions d’URL CLI (`--url`) ne réutilisent jamais les identifiants implicites de config/env.
  - Les substitutions d’URL d’environnement (`OPENCLAW_GATEWAY_URL`) peuvent utiliser uniquement les identifiants d’environnement (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valeurs par défaut en mode local :
  - token : `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (le repli distant ne s’applique que lorsque l’entrée de token d’authentification local n’est pas définie)
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (le repli distant ne s’applique que lorsque l’entrée de mot de passe d’authentification locale n’est pas définie)
- Valeurs par défaut en mode distant :
  - token : `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exception Node-host en mode local : `gateway.remote.token` / `gateway.remote.password` sont ignorés.
- Les vérifications de token pour probe/status distants sont strictes par défaut : elles utilisent uniquement `gateway.remote.token` (sans repli vers le token local) lorsqu’elles ciblent le mode distant.
- Les substitutions d’environnement Gateway utilisent uniquement `OPENCLAW_GATEWAY_*`.

## Interface de chat via SSH

WebChat n’utilise plus de port HTTP séparé. L’interface de chat SwiftUI se connecte directement au WebSocket du Gateway.

- Transférez `18789` via SSH (voir ci-dessus), puis connectez les clients à `ws://127.0.0.1:18789`.
- Sur macOS, préférez le mode « Remote over SSH » de l’app, qui gère automatiquement le tunnel.

## App macOS « Remote over SSH »

L’app macOS dans la barre de menus peut piloter cette même configuration de bout en bout (vérifications d’état à distance, WebChat et transfert Voice Wake).

Procédure : [accès distant macOS](/fr/platforms/mac/remote).

## Règles de sécurité (distant/VPN)

Version courte : **gardez le Gateway limité à loopback** sauf si vous êtes sûr d’avoir besoin d’un bind.

- **Loopback + SSH/Tailscale Serve** est le réglage le plus sûr par défaut (pas d’exposition publique).
- Le `ws://` en clair est limité à loopback par défaut. Pour les réseaux privés de confiance,
  définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` sur le processus client comme
  solution de secours. Il n’existe pas d’équivalent `openclaw.json` ; cela doit être
  l’environnement du processus client qui établit la connexion WebSocket.
- Les **binds non loopback** (`lan`/`tailnet`/`custom`, ou `auto` lorsque loopback n’est pas disponible) doivent utiliser l’authentification gateway : token, mot de passe ou proxy inverse orienté identité avec `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sont des sources d’identifiants côté client. Ils ne configurent **pas** à eux seuls l’authentification du serveur.
- Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fermé (aucun repli distant pour masquer l’échec).
- `gateway.remote.tlsFingerprint` épingle le certificat TLS distant lors de l’utilisation de `wss://`.
- **Tailscale Serve** peut authentifier le trafic Control UI/WebSocket via des en-têtes d’identité
  lorsque `gateway.auth.allowTailscale: true` ; les points de terminaison d’API HTTP n’utilisent pas
  cette authentification par en-tête Tailscale et suivent à la place le mode
  d’authentification HTTP normal du gateway. Ce flux sans token suppose que l’hôte gateway est approuvé. Définissez cette option sur
  `false` si vous voulez une authentification par secret partagé partout.
- L’authentification **trusted-proxy** est réservée aux configurations de proxy orienté identité non loopback.
  Les proxies inverses loopback sur le même hôte ne satisfont pas `gateway.auth.mode: "trusted-proxy"`.
- Traitez le contrôle navigateur comme un accès opérateur : tailnet uniquement + appairage délibéré du node.

Analyse détaillée : [Sécurité](/fr/gateway/security).

### macOS : tunnel SSH persistant via LaunchAgent

Pour les clients macOS se connectant à un gateway distant, la configuration persistante la plus simple utilise une entrée SSH `LocalForward` plus un LaunchAgent pour garder le tunnel actif après les redémarrages et les plantages.

#### Étape 1 : ajouter la config SSH

Modifiez `~/.ssh/config` :

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Remplacez `<REMOTE_IP>` et `<REMOTE_USER>` par vos valeurs.

#### Étape 2 : copier la clé SSH (une seule fois)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Étape 3 : configurer le token gateway

Stockez le token dans la config afin qu’il persiste après les redémarrages :

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Étape 4 : créer le LaunchAgent

Enregistrez ceci sous `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Étape 5 : charger le LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Le tunnel démarrera automatiquement à la connexion, redémarrera après un plantage et gardera le port transféré actif.

Remarque : si vous avez un ancien LaunchAgent `com.openclaw.ssh-tunnel` provenant d’une ancienne configuration, déchargez-le et supprimez-le.

#### Dépannage

Vérifiez si le tunnel est en cours d’exécution :

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Redémarrez le tunnel :

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Arrêtez le tunnel :

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrée de config                        | Ce qu’elle fait                                              |
| --------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`    | Transfère le port local 18789 vers le port distant 18789     |
| `ssh -N`                                | SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                             | Redémarre automatiquement le tunnel s’il plante              |
| `RunAtLoad`                             | Démarre le tunnel quand le LaunchAgent se charge à la connexion |

## Lié

- [Tailscale](/fr/gateway/tailscale)
- [Authentification](/fr/gateway/authentication)
- [Configuration du gateway distant](/fr/gateway/remote-gateway-readme)
