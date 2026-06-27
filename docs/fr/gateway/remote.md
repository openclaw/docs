---
read_when:
    - Exécuter ou dépanner des configurations de Gateway distant
summary: Accès distant avec Gateway WS, tunnels SSH et tailnets
title: Accès distant
x-i18n:
    generated_at: "2026-06-27T17:33:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5f885026fe76acb46f49955c6e485e08714a5cc5e90c165d20e25cea1acf864
    source_path: gateway/remote.md
    workflow: 16
---

Ce dépôt prend en charge l’accès distant au Gateway en conservant un seul Gateway (le maître) en cours d’exécution sur un hôte dédié (ordinateur de bureau/serveur) et en y connectant les clients.

- Pour les **opérateurs (vous / l’app macOS)** : le WebSocket LAN/Tailnet direct est le plus simple lorsque le Gateway est joignable ; le tunnel SSH est la solution de repli universelle.
- Pour les **nœuds (iOS/Android et futurs appareils)** : connectez-vous au **WebSocket** du Gateway (LAN/tailnet ou tunnel SSH selon les besoins).

## L’idée centrale

- Le WebSocket du Gateway se lie généralement au **loopback** sur votre port configuré (18789 par défaut).
- Pour une utilisation distante, exposez-le via Tailscale Serve ou une liaison LAN/Tailnet fiable, ou transférez le port loopback via SSH.

## Configurations VPN et tailnet courantes

Considérez l’**hôte du Gateway** comme l’endroit où vit l’agent. Il possède les sessions, les profils d’authentification, les canaux et l’état. Votre ordinateur portable, votre ordinateur de bureau et vos nœuds se connectent à cet hôte.

### Gateway toujours actif dans votre tailnet

Exécutez le Gateway sur un hôte persistant (VPS ou serveur domestique) et accédez-y via **Tailscale** ou SSH.

- **Meilleure UX :** conservez `gateway.bind: "loopback"` et utilisez **Tailscale Serve** pour l’interface de contrôle.
- **LAN/Tailnet fiable :** liez le Gateway à une interface privée et connectez-vous directement avec `gateway.remote.transport: "direct"`.
- **Solution de repli :** conservez le loopback avec un tunnel SSH depuis toute machine qui a besoin d’un accès.
- **Exemples :** [exe.dev](/fr/install/exe-dev) (VM simple) ou [Hetzner](/fr/install/hetzner) (VPS de production).

Idéal lorsque votre ordinateur portable se met souvent en veille, mais que vous voulez que l’agent reste toujours actif.

### Un ordinateur de bureau domestique exécute le Gateway

L’ordinateur portable n’exécute **pas** l’agent. Il se connecte à distance :

- Utilisez le mode distant de l’app macOS (Réglages → Général → OpenClaw s’exécute).
- L’app se connecte directement lorsque le Gateway est joignable sur le LAN/Tailnet, ou ouvre et gère un tunnel SSH lorsque vous choisissez SSH.

Procédure : [accès distant macOS](/fr/platforms/mac/remote).

### Un ordinateur portable exécute le Gateway

Gardez le Gateway local, mais exposez-le de manière sûre :

- tunnel SSH vers l’ordinateur portable depuis d’autres machines, ou
- Tailscale Serve pour l’interface de contrôle et Gateway limité au loopback.

Guides : [Tailscale](/fr/gateway/tailscale) et [vue d’ensemble Web](/fr/web).

## Flux de commandes (ce qui s’exécute où)

Un service Gateway unique possède l’état et les canaux. Les nœuds sont des périphériques.

Exemple de flux (Telegram → nœud) :

- Un message Telegram arrive au **Gateway**.
- Le Gateway exécute l’**agent** et décide s’il doit appeler un outil de nœud.
- Le Gateway appelle le **nœud** via le WebSocket du Gateway (`node.*` RPC).
- Le nœud renvoie le résultat ; le Gateway répond ensuite vers Telegram.

Notes :

- **Les nœuds n’exécutent pas le service Gateway.** Un seul Gateway doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Gateways multiples](/fr/gateway/multiple-gateways)).
- Le « mode nœud » de l’app macOS est simplement un client de nœud via le WebSocket du Gateway.

## Tunnel SSH (CLI + outils)

Créez un tunnel local vers le WS du Gateway distant :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Avec le tunnel actif :

- `openclaw health` et `openclaw status --deep` atteignent maintenant le Gateway distant via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` et `openclaw gateway call` peuvent aussi cibler l’URL transférée via `--url` lorsque nécessaire.

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

Lorsque le Gateway est limité au loopback, conservez l’URL à `ws://127.0.0.1:18789` et ouvrez d’abord le tunnel SSH.
Dans le transport par tunnel SSH de l’app macOS, les noms d’hôtes de Gateway découverts vont dans
`gateway.remote.sshTarget` ; `gateway.remote.url` reste l’URL du tunnel local.
Si ces ports diffèrent, définissez `gateway.remote.remotePort` sur le port du Gateway sur
l’hôte SSH.

Pour un Gateway déjà joignable sur un LAN ou un Tailnet fiable, utilisez le mode direct :

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      transport: "direct",
      url: "ws://192.168.0.202:18789",
      token: "your-token",
    },
  },
}
```

## Priorité des identifiants

La résolution des identifiants du Gateway suit un contrat partagé entre les chemins call/probe/status et la surveillance d’approbation d’exécution Discord. L’hôte de nœud utilise le même contrat de base avec une exception en mode local (il ignore intentionnellement `gateway.remote.*`) :

- Les identifiants explicites (`--token`, `--password` ou l’outil `gatewayToken`) l’emportent toujours sur les chemins d’appel qui acceptent une authentification explicite.
- Sécurité de remplacement de l’URL :
  - Les remplacements d’URL CLI (`--url`) ne réutilisent jamais les identifiants implicites de configuration/env.
  - Les remplacements d’URL env (`OPENCLAW_GATEWAY_URL`) peuvent utiliser uniquement les identifiants env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valeurs par défaut du mode local :
  - token : `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (la solution de repli distante ne s’applique que lorsque l’entrée de jeton d’authentification locale n’est pas définie)
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (la solution de repli distante ne s’applique que lorsque l’entrée de mot de passe d’authentification locale n’est pas définie)
- Valeurs par défaut du mode distant :
  - token : `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exception de l’hôte de nœud en mode local : `gateway.remote.token` / `gateway.remote.password` sont ignorés.
- Les vérifications de jeton probe/status distantes sont strictes par défaut : elles utilisent uniquement `gateway.remote.token` (sans repli sur le jeton local) lors du ciblage du mode distant.
- Les remplacements env du Gateway utilisent uniquement `OPENCLAW_GATEWAY_*`.

## Accès distant à l’interface de chat

WebChat n’utilise plus de port HTTP séparé. L’interface de chat SwiftUI se connecte directement au WebSocket du Gateway.

- Transférez `18789` via SSH (voir ci-dessus), puis connectez les clients à `ws://127.0.0.1:18789`.
- Pour le mode direct LAN/Tailnet, connectez les clients à l’URL privée `ws://` configurée ou à l’URL sécurisée `wss://`.
- Sur macOS, privilégiez le mode distant de l’app, qui gère automatiquement le transport sélectionné.

## Mode distant de l’app macOS

L’app de barre de menus macOS peut piloter la même configuration de bout en bout (vérifications d’état distantes, WebChat et transfert Voice Wake).

Procédure : [accès distant macOS](/fr/platforms/mac/remote).

## Règles de sécurité (distant/VPN)

Version courte : **gardez le Gateway limité au loopback** sauf si vous êtes sûr d’avoir besoin d’une liaison.

- **Loopback + SSH/Tailscale Serve** est la valeur par défaut la plus sûre (aucune exposition publique).
- Le `ws://` en clair est accepté pour le loopback, le LAN, le link-local, `.local`, `.ts.net` et les hôtes CGNAT Tailscale. Les hôtes distants publics doivent utiliser `wss://`.
- Les **liaisons hors loopback** (`lan`/`tailnet`/`custom`, ou `auto` lorsque le loopback est indisponible) doivent utiliser l’authentification du Gateway : jeton, mot de passe ou proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sont des sources d’identifiants client. Ils ne configurent **pas** l’authentification serveur à eux seuls.
- Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme solution de repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue en mode fermé (aucun repli distant ne masque l’erreur).
- `gateway.remote.tlsFingerprint` épingle le certificat TLS distant lors de l’utilisation de `wss://`, y compris en mode direct macOS. Sans épingle configurée ou précédemment stockée, macOS n’épingle un certificat à la première utilisation qu’après validation normale de la confiance système ; les Gateways autosignés ou à AC privée que macOS ne considère pas déjà comme fiables nécessitent une empreinte explicite ou le mode distant via SSH.
- **Tailscale Serve** peut authentifier le trafic de l’interface de contrôle/WebSocket via des en-têtes d’identité lorsque `gateway.auth.allowTailscale: true` ; les points de terminaison d’API HTTP n’utilisent pas cette authentification par en-tête Tailscale et suivent plutôt le mode d’authentification HTTP normal du Gateway. Ce flux sans jeton suppose que l’hôte du Gateway est fiable. Définissez-le sur `false` si vous voulez une authentification par secret partagé partout.
- L’authentification **trusted-proxy** attend par défaut des configurations de proxy sensible à l’identité hors loopback.
  Les proxys inverses loopback sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true`.
- Traitez le contrôle par navigateur comme un accès opérateur : tailnet uniquement + appairage délibéré des nœuds.

Pour approfondir : [Sécurité](/fr/gateway/security).

### macOS : tunnel SSH persistant via LaunchAgent

Pour les clients macOS qui se connectent à un Gateway distant, la configuration persistante la plus simple utilise une entrée de configuration SSH `LocalForward` ainsi qu’un LaunchAgent pour garder le tunnel actif entre les redémarrages et après les plantages.

#### Étape 1 : ajouter la configuration SSH

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

Stockez le jeton dans la configuration afin qu’il persiste entre les redémarrages :

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
Si vous avez encore un LaunchAgent `com.openclaw.ssh-tunnel` issu d’une ancienne configuration, déchargez-le et supprimez-le.
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

| Entrée de configuration              | Ce qu’elle fait                                             |
| ------------------------------------ | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Transfère le port local 18789 vers le port distant 18789    |
| `ssh -N`                             | SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                          | Redémarre automatiquement le tunnel s’il plante             |
| `RunAtLoad`                          | Démarre le tunnel lorsque le LaunchAgent se charge à la connexion |

## Connexe

- [Tailscale](/fr/gateway/tailscale)
- [Authentification](/fr/gateway/authentication)
- [Configuration du Gateway distant](/fr/gateway/remote-gateway-readme)
