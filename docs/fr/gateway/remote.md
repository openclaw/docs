---
read_when:
    - Exécution ou dépannage de configurations gateway distantes
summary: Accès distant via tunnels SSH (Gateway WS) et tailnets
title: Accès distant
x-i18n:
    generated_at: "2026-04-25T13:48:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

Ce dépôt prend en charge le mode « distant via SSH » en maintenant une seule Gateway (la principale) sur un hôte dédié (poste de travail/serveur) et en y connectant les clients.

- Pour les **opérateurs (vous / l’app macOS)** : le tunnel SSH est la solution de repli universelle.
- Pour les **nœuds (iOS/Android et futurs appareils)** : connectez-vous à la **WebSocket** de la Gateway (LAN/tailnet ou tunnel SSH selon les besoins).

## L’idée de base

- La WebSocket Gateway se lie à **local loopback** sur le port configuré (par défaut 18789).
- Pour un usage distant, vous transférez ce port loopback via SSH (ou utilisez un tailnet/VPN et réduisez le besoin de tunnel).

## Configurations VPN/tailnet courantes (où vit l’agent)

Considérez l’**hôte Gateway** comme « l’endroit où vit l’agent ». Il possède les sessions, profils d’authentification, canaux et l’état.
Votre ordinateur portable/de bureau (et les nœuds) se connectent à cet hôte.

### 1) Gateway toujours active dans votre tailnet (VPS ou serveur domestique)

Exécutez la Gateway sur un hôte persistant et atteignez-la via **Tailscale** ou SSH.

- **Meilleure UX :** conservez `gateway.bind: "loopback"` et utilisez **Tailscale Serve** pour l’interface utilisateur de contrôle.
- **Repli :** conservez loopback + tunnel SSH depuis toute machine qui a besoin d’accès.
- **Exemples :** [exe.dev](/fr/install/exe-dev) (VM simple) ou [Hetzner](/fr/install/hetzner) (VPS de production).

C’est idéal lorsque votre ordinateur portable se met souvent en veille mais que vous voulez que l’agent reste toujours actif.

### 2) Le poste fixe à la maison exécute la Gateway, l’ordinateur portable sert de contrôle distant

L’ordinateur portable **n’exécute pas** l’agent. Il se connecte à distance :

- Utilisez le mode **Remote over SSH** de l’app macOS (Réglages → Général → « OpenClaw runs »).
- L’app ouvre et gère le tunnel, donc WebChat + les vérifications d’intégrité « fonctionnent simplement ».

Guide opérationnel : [accès distant macOS](/fr/platforms/mac/remote).

### 3) L’ordinateur portable exécute la Gateway, avec accès distant depuis d’autres machines

Gardez la Gateway en local mais exposez-la de façon sûre :

- tunnel SSH vers l’ordinateur portable depuis d’autres machines, ou
- utilisez Tailscale Serve pour l’interface utilisateur de contrôle et gardez la Gateway accessible uniquement en loopback.

Guide : [Tailscale](/fr/gateway/tailscale) et [vue d’ensemble Web](/fr/web).

## Flux de commande (ce qui s’exécute où)

Un seul service gateway possède l’état + les canaux. Les nœuds sont des périphériques.

Exemple de flux (Telegram → nœud) :

- Un message Telegram arrive à la **Gateway**.
- La Gateway exécute l’**agent** et décide si elle doit appeler un outil de nœud.
- La Gateway appelle le **nœud** via la WebSocket Gateway (`node.*` RPC).
- Le nœud renvoie le résultat ; la Gateway répond ensuite sur Telegram.

Remarques :

- **Les nœuds n’exécutent pas le service gateway.** Une seule gateway doit s’exécuter par hôte sauf si vous exécutez intentionnellement des profils isolés (voir [Passerelles multiples](/fr/gateway/multiple-gateways)).
- Le « mode nœud » de l’app macOS n’est qu’un client de nœud via la WebSocket Gateway.

## Tunnel SSH (CLI + outils)

Créez un tunnel local vers la WebSocket Gateway distante :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Avec le tunnel actif :

- `openclaw health` et `openclaw status --deep` atteignent désormais la gateway distante via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` et `openclaw gateway call` peuvent aussi cibler l’URL transférée via `--url` si nécessaire.

Remarque : remplacez `18789` par votre `gateway.port` configuré (ou `--port`/`OPENCLAW_GATEWAY_PORT`).
Remarque : lorsque vous passez `--url`, la CLI ne se replie pas sur les identifiants de configuration ou d’environnement.
Incluez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.

## Valeurs par défaut CLI distantes

Vous pouvez conserver une cible distante pour que les commandes CLI l’utilisent par défaut :

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

Lorsque la gateway est accessible uniquement en loopback, gardez l’URL sur `ws://127.0.0.1:18789` et ouvrez d’abord le tunnel SSH.

## Priorité des identifiants

La résolution des identifiants Gateway suit un contrat partagé unique sur les chemins call/probe/status et la surveillance de l’approbation d’exécution Discord. Node-host utilise le même contrat de base avec une exception en mode local (il ignore intentionnellement `gateway.remote.*`) :

- Les identifiants explicites (`--token`, `--password` ou l’outil `gatewayToken`) sont toujours prioritaires sur les chemins d’appel qui acceptent une authentification explicite.
- Sécurité des remplacements d’URL :
  - Les remplacements d’URL CLI (`--url`) ne réutilisent jamais les identifiants implicites de configuration/environnement.
  - Les remplacements d’URL d’environnement (`OPENCLAW_GATEWAY_URL`) peuvent utiliser uniquement les identifiants d’environnement (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valeurs par défaut en mode local :
  - jeton : `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (le repli distant ne s’applique que lorsque l’entrée de jeton d’authentification locale n’est pas définie)
  - mot de passe : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (le repli distant ne s’applique que lorsque l’entrée de mot de passe d’authentification locale n’est pas définie)
- Valeurs par défaut en mode distant :
  - jeton : `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - mot de passe : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exception Node-host en mode local : `gateway.remote.token` / `gateway.remote.password` sont ignorés.
- Les vérifications de jeton probe/status distantes sont strictes par défaut : elles utilisent uniquement `gateway.remote.token` (sans repli vers le jeton local) lorsqu’elles ciblent le mode distant.
- Les remplacements d’environnement Gateway utilisent uniquement `OPENCLAW_GATEWAY_*`.

## Interface de discussion via SSH

WebChat n’utilise plus de port HTTP séparé. L’interface de discussion SwiftUI se connecte directement à la WebSocket Gateway.

- Transférez `18789` via SSH (voir ci-dessus), puis connectez les clients à `ws://127.0.0.1:18789`.
- Sur macOS, préférez le mode « Remote over SSH » de l’app, qui gère automatiquement le tunnel.

## App macOS « Remote over SSH »

L’app de barre de menus macOS peut piloter la même configuration de bout en bout (vérifications d’état distantes, WebChat et transfert Voice Wake).

Guide opérationnel : [accès distant macOS](/fr/platforms/mac/remote).

## Règles de sécurité (distant/VPN)

Version courte : **gardez la Gateway accessible uniquement en loopback** sauf si vous êtes sûr d’avoir besoin d’un bind.

- **Loopback + SSH/Tailscale Serve** est l’option la plus sûre par défaut (aucune exposition publique).
- `ws://` en clair est limité à loopback par défaut. Pour les réseaux privés de confiance,
  définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` sur le processus client comme
  solution d’urgence. Il n’existe pas d’équivalent dans `openclaw.json` ; cela doit être défini dans
  l’environnement du processus pour le client qui établit la connexion WebSocket.
- Les **binds non-loopback** (`lan`/`tailnet`/`custom`, ou `auto` lorsque loopback est indisponible) doivent utiliser l’authentification gateway : jeton, mot de passe ou reverse proxy conscient de l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sont des sources d’identifiants côté client. Ils ne configurent **pas** l’authentification du serveur à eux seuls.
- Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` en repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fermé (aucun repli distant masquant).
- `gateway.remote.tlsFingerprint` épingle le certificat TLS distant lors de l’utilisation de `wss://`.
- **Tailscale Serve** peut authentifier le trafic de l’interface utilisateur de contrôle/WebSocket via des en-têtes d’identité lorsque `gateway.auth.allowTailscale: true` ; les points de terminaison d’API HTTP n’utilisent pas cette authentification par en-tête Tailscale et suivent à la place le mode normal d’authentification HTTP de la gateway. Ce flux sans jeton suppose que l’hôte gateway est de confiance. Définissez-le sur `false` si vous voulez une authentification par secret partagé partout.
- L’authentification **trusted-proxy** est réservée aux configurations de proxy conscient de l’identité non-loopback.
  Les reverse proxies loopback sur le même hôte ne satisfont pas `gateway.auth.mode: "trusted-proxy"`.
- Traitez le contrôle du navigateur comme un accès opérateur : tailnet uniquement + appairage délibéré des nœuds.

Analyse détaillée : [Sécurité](/fr/gateway/security).

### macOS : tunnel SSH persistant via LaunchAgent

Pour les clients macOS se connectant à une gateway distante, la configuration persistante la plus simple utilise une entrée SSH `LocalForward` plus un LaunchAgent pour maintenir le tunnel actif après les redémarrages et les plantages.

#### Étape 1 : ajouter la configuration SSH

Modifiez `~/.ssh/config` :

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Remplacez `<REMOTE_IP>` et `<REMOTE_USER>` par vos valeurs.

#### Étape 2 : copier la clé SSH (une seule fois)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Étape 3 : configurer le jeton gateway

Stockez le jeton dans la configuration afin qu’il persiste après les redémarrages :

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Étape 4 : créer le LaunchAgent

Enregistrez ceci sous `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` :

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

#### Étape 5 : charger le LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Le tunnel démarrera automatiquement à la connexion, redémarrera en cas de plantage et maintiendra le port transféré actif.

Remarque : si vous avez un ancien LaunchAgent `com.openclaw.ssh-tunnel` provenant d’une configuration plus ancienne, déchargez-le et supprimez-le.

#### Dépannage

Vérifiez si le tunnel est actif :

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Redémarrer le tunnel :

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Arrêter le tunnel :

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrée de configuration               | Ce qu’elle fait                                              |
| ------------------------------------- | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789`  | Transfère le port local 18789 vers le port distant 18789     |
| `ssh -N`                              | SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                           | Redémarre automatiquement le tunnel s’il plante              |
| `RunAtLoad`                           | Démarre le tunnel lorsque le LaunchAgent est chargé à la connexion |

## Voir aussi

- [Tailscale](/fr/gateway/tailscale)
- [Authentification](/fr/gateway/authentication)
- [Configuration de gateway distante](/fr/gateway/remote-gateway-readme)
