---
read_when:
    - Exécution ou dépannage des configurations de Gateway distantes
summary: Accès distant avec des tunnels SSH (Gateway WS) et des tailnets
title: Accès distant
x-i18n:
    generated_at: "2026-05-06T07:24:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: c6272f4ee9fa52091d461cd70be05ccf01c209c3b26fe98a71752f6ea86ea448
    source_path: gateway/remote.md
    workflow: 16
---

Ce dépôt prend en charge le « distant via SSH » en gardant un seul Gateway (le maître) en cours d’exécution sur un hôte dédié (ordinateur de bureau/serveur) et en y connectant les clients.

- Pour les **opérateurs (vous / l’app macOS)** : le tunneling SSH est le recours universel.
- Pour les **nœuds (iOS/Android et futurs appareils)** : connectez-vous au **WebSocket** du Gateway (LAN/tailnet ou tunnel SSH selon les besoins).

## L’idée principale

- Le WebSocket du Gateway se lie au **loopback** sur votre port configuré (18789 par défaut).
- Pour un usage distant, transférez ce port de loopback via SSH (ou utilisez un tailnet/VPN et tunnelisez moins).

## Configurations VPN et tailnet courantes

Considérez l’**hôte Gateway** comme l’endroit où vit l’agent. Il possède les sessions, les profils d’authentification, les canaux et l’état. Votre ordinateur portable, votre ordinateur de bureau et les nœuds se connectent à cet hôte.

### Gateway toujours actif dans votre tailnet

Exécutez le Gateway sur un hôte persistant (VPS ou serveur domestique) et accédez-y via **Tailscale** ou SSH.

- **Meilleure expérience utilisateur :** gardez `gateway.bind: "loopback"` et utilisez **Tailscale Serve** pour l’interface de contrôle.
- **Solution de repli :** gardez le loopback plus un tunnel SSH depuis toute machine qui a besoin d’un accès.
- **Exemples :** [exe.dev](/fr/install/exe-dev) (VM facile) ou [Hetzner](/fr/install/hetzner) (VPS de production).

Idéal lorsque votre ordinateur portable se met souvent en veille, mais que vous voulez que l’agent reste toujours actif.

### L’ordinateur de bureau domestique exécute le Gateway

L’ordinateur portable n’exécute **pas** l’agent. Il se connecte à distance :

- Utilisez le mode **Distant via SSH** de l’app macOS (Réglages → Général → OpenClaw s’exécute).
- L’app ouvre et gère le tunnel, afin que WebChat et les contrôles de santé fonctionnent simplement.

Runbook : [accès distant macOS](/fr/platforms/mac/remote).

### L’ordinateur portable exécute le Gateway

Gardez le Gateway local, mais exposez-le en toute sécurité :

- Tunnel SSH vers l’ordinateur portable depuis d’autres machines, ou
- Tailscale Serve pour l’interface de contrôle, en gardant le Gateway uniquement en loopback.

Guides : [Tailscale](/fr/gateway/tailscale) et [Vue d’ensemble Web](/fr/web).

## Flux de commande (ce qui s’exécute où)

Un service Gateway possède l’état + les canaux. Les nœuds sont des périphériques.

Exemple de flux (Telegram → nœud) :

- Un message Telegram arrive au **Gateway**.
- Gateway exécute l’**agent** et décide s’il doit appeler un outil de nœud.
- Gateway appelle le **nœud** via le WebSocket du Gateway (RPC `node.*`).
- Le nœud renvoie le résultat ; Gateway répond à Telegram.

Notes :

- **Les nœuds n’exécutent pas le service Gateway.** Un seul Gateway doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Gateways multiples](/fr/gateway/multiple-gateways)).
- Le « mode nœud » de l’app macOS est simplement un client de nœud via le WebSocket du Gateway.

## Tunnel SSH (CLI + outils)

Créez un tunnel local vers le WS du Gateway distant :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Une fois le tunnel actif :

- `openclaw health` et `openclaw status --deep` atteignent maintenant le Gateway distant via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` et `openclaw gateway call` peuvent aussi cibler l’URL transférée via `--url` si nécessaire.

<Note>
Remplacez `18789` par votre `gateway.port` configuré (ou `--port` ou `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Lorsque vous passez `--url`, la CLI ne se rabat pas sur les identifiants de configuration ou d’environnement. Incluez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.
</Warning>

## Valeurs distantes par défaut de la CLI

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

Lorsque le Gateway est uniquement en loopback, gardez l’URL à `ws://127.0.0.1:18789` et ouvrez d’abord le tunnel SSH.
Dans le transport par tunnel SSH de l’app macOS, les noms d’hôte Gateway découverts vont dans
`gateway.remote.sshTarget` ; `gateway.remote.url` reste l’URL du tunnel local.

## Priorité des identifiants

La résolution des identifiants du Gateway suit un contrat partagé sur les chemins d’appel/probe/statut et la surveillance d’approbation d’exécution Discord. Node-host utilise le même contrat de base avec une exception en mode local (il ignore intentionnellement `gateway.remote.*`) :

- Les identifiants explicites (`--token`, `--password` ou l’outil `gatewayToken`) gagnent toujours sur les chemins d’appel qui acceptent une authentification explicite.
- Sécurité du remplacement d’URL :
  - Les remplacements d’URL CLI (`--url`) ne réutilisent jamais les identifiants implicites de config/env.
  - Les remplacements d’URL env (`OPENCLAW_GATEWAY_URL`) peuvent utiliser uniquement les identifiants env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valeurs par défaut du mode local :
  - token : `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (le repli distant s’applique uniquement lorsque l’entrée de jeton d’auth local n’est pas définie)
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (le repli distant s’applique uniquement lorsque l’entrée de mot de passe d’auth local n’est pas définie)
- Valeurs par défaut du mode distant :
  - token : `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exception du mode local de node-host : `gateway.remote.token` / `gateway.remote.password` sont ignorés.
- Les vérifications de jeton probe/statut distantes sont strictes par défaut : elles utilisent uniquement `gateway.remote.token` (pas de repli vers le jeton local) lors du ciblage du mode distant.
- Les remplacements d’environnement du Gateway utilisent uniquement `OPENCLAW_GATEWAY_*`.

## Interface de chat via SSH

WebChat n’utilise plus de port HTTP séparé. L’interface de chat SwiftUI se connecte directement au WebSocket du Gateway.

- Transférez `18789` via SSH (voir ci-dessus), puis connectez les clients à `ws://127.0.0.1:18789`.
- Sur macOS, préférez le mode « Distant via SSH » de l’app, qui gère automatiquement le tunnel.

## App macOS Distant via SSH

L’app de barre de menus macOS peut piloter la même configuration de bout en bout (contrôles de statut distants, WebChat et transfert Voice Wake).

Runbook : [accès distant macOS](/fr/platforms/mac/remote).

## Règles de sécurité (distant/VPN)

Version courte : **gardez le Gateway uniquement en loopback**, sauf si vous êtes sûr d’avoir besoin d’une liaison.

- **Loopback + SSH/Tailscale Serve** est la valeur par défaut la plus sûre (aucune exposition publique).
- Le `ws://` en clair est limité au loopback par défaut. Pour les réseaux privés de confiance,
  définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` sur le processus client comme
  mesure de dernier recours. Il n’existe pas d’équivalent `openclaw.json` ; cela doit être dans
  l’environnement du processus pour le client qui établit la connexion WebSocket.
- Les **liaisons hors loopback** (`lan`/`tailnet`/`custom`, ou `auto` lorsque le loopback n’est pas disponible) doivent utiliser l’authentification Gateway : jeton, mot de passe ou proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sont des sources d’identifiants client. Ils ne configurent **pas** à eux seuls l’authentification du serveur.
- Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue fermée (aucun repli distant ne masque l’échec).
- `gateway.remote.tlsFingerprint` épingle le certificat TLS distant lors de l’utilisation de `wss://`.
- **Tailscale Serve** peut authentifier le trafic de l’interface de contrôle/WebSocket via des en-têtes d’identité
  lorsque `gateway.auth.allowTailscale: true` ; les points de terminaison de l’API HTTP n’utilisent pas
  cette authentification par en-tête Tailscale et suivent plutôt le mode d’auth HTTP normal
  du Gateway. Ce flux sans jeton suppose que l’hôte Gateway est fiable. Définissez-le sur
  `false` si vous voulez une authentification par secret partagé partout.
- L’authentification **trusted-proxy** attend par défaut des configurations de proxy sensibles à l’identité hors loopback.
  Les proxys inverses loopback sur le même hôte nécessitent `gateway.auth.trustedProxy.allowLoopback = true` explicitement.
- Traitez le contrôle par navigateur comme un accès opérateur : uniquement tailnet + appairage de nœuds délibéré.

Approfondissement : [Sécurité](/fr/gateway/security).

### macOS : tunnel SSH persistant via LaunchAgent

Pour les clients macOS qui se connectent à un Gateway distant, la configuration persistante la plus simple utilise une entrée de config SSH `LocalForward` plus un LaunchAgent pour garder le tunnel actif entre les redémarrages et les plantages.

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

#### Étape 3 : configurer le jeton du Gateway

Stockez le jeton dans la config afin qu’il persiste entre les redémarrages :

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

Le tunnel démarrera automatiquement à la connexion, redémarrera en cas de plantage et gardera le port transféré actif.

<Note>
Si vous avez un LaunchAgent `com.openclaw.ssh-tunnel` restant d’une ancienne configuration, déchargez-le et supprimez-le.
</Note>

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

| Entrée de config                    | Ce qu’elle fait                                             |
| ----------------------------------- | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Transfère le port local 18789 vers le port distant 18789    |
| `ssh -N`                            | SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                         | Redémarre automatiquement le tunnel s’il plante             |
| `RunAtLoad`                         | Démarre le tunnel lorsque le LaunchAgent se charge à la connexion |

## Associé

- [Tailscale](/fr/gateway/tailscale)
- [Authentification](/fr/gateway/authentication)
- [Configuration d’un Gateway distant](/fr/gateway/remote-gateway-readme)
