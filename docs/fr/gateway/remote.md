---
read_when:
    - Exécution ou dépannage de configurations de Gateway distantes
summary: Accès à distance avec des tunnels SSH (Gateway WS) et des tailnets
title: Accès à distance
x-i18n:
    generated_at: "2026-04-30T07:29:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 116ffba71801d3363eba293997ee4a5c8ad083a82298e57e68f678510263650a
    source_path: gateway/remote.md
    workflow: 16
---

Ce dépôt prend en charge le « distant via SSH » en gardant un seul Gateway (le maître) exécuté sur un hôte dédié (ordinateur de bureau/serveur) et en y connectant les clients.

- Pour les **opérateurs (vous / l’app macOS)** : le tunneling SSH est le repli universel.
- Pour les **nœuds (iOS/Android et futurs appareils)** : connectez-vous au **WebSocket** du Gateway (LAN/tailnet ou tunnel SSH selon les besoins).

## L’idée centrale

- Le WebSocket du Gateway se lie au **loopback** sur votre port configuré (18789 par défaut).
- Pour une utilisation distante, vous transférez ce port loopback via SSH (ou utilisez un tailnet/VPN et tunnelisez moins).

## Configurations VPN et tailnet courantes

Considérez l’**hôte du Gateway** comme l’endroit où vit l’agent. Il possède les sessions, les profils d’authentification, les canaux et l’état. Votre ordinateur portable, votre ordinateur de bureau et vos nœuds se connectent à cet hôte.

### Gateway toujours actif dans votre tailnet

Exécutez le Gateway sur un hôte persistant (VPS ou serveur domestique) et accédez-y via **Tailscale** ou SSH.

- **Meilleure UX :** gardez `gateway.bind: "loopback"` et utilisez **Tailscale Serve** pour l’interface de contrôle.
- **Repli :** gardez le loopback plus un tunnel SSH depuis toute machine ayant besoin d’un accès.
- **Exemples :** [exe.dev](/fr/install/exe-dev) (VM simple) ou [Hetzner](/fr/install/hetzner) (VPS de production).

Idéal lorsque votre ordinateur portable se met souvent en veille, mais que vous voulez que l’agent reste toujours actif.

### L’ordinateur de bureau domestique exécute le Gateway

L’ordinateur portable n’exécute **pas** l’agent. Il se connecte à distance :

- Utilisez le mode **Distant via SSH** de l’app macOS (Réglages → Général → OpenClaw s’exécute).
- L’app ouvre et gère le tunnel, donc WebChat et les vérifications de santé fonctionnent directement.

Runbook : [accès distant macOS](/fr/platforms/mac/remote).

### L’ordinateur portable exécute le Gateway

Gardez le Gateway local, mais exposez-le de façon sûre :

- Tunnel SSH vers l’ordinateur portable depuis d’autres machines, ou
- Tailscale Serve pour l’interface de contrôle et gardez le Gateway en loopback uniquement.

Guides : [Tailscale](/fr/gateway/tailscale) et [aperçu Web](/fr/web).

## Flux de commande (ce qui s’exécute où)

Un service Gateway unique possède l’état + les canaux. Les nœuds sont des périphériques.

Exemple de flux (Telegram → nœud) :

- Le message Telegram arrive au **Gateway**.
- Le Gateway exécute l’**agent** et décide s’il doit appeler un outil de nœud.
- Le Gateway appelle le **nœud** via le WebSocket du Gateway (RPC `node.*`).
- Le nœud renvoie le résultat ; le Gateway répond ensuite à Telegram.

Notes :

- **Les nœuds n’exécutent pas le service gateway.** Un seul gateway doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (voir [Plusieurs gateways](/fr/gateway/multiple-gateways)).
- Le « mode nœud » de l’app macOS est simplement un client de nœud via le WebSocket du Gateway.

## Tunnel SSH (CLI + outils)

Créez un tunnel local vers le WS du Gateway distant :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Une fois le tunnel actif :

- `openclaw health` et `openclaw status --deep` atteignent maintenant le gateway distant via `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` et `openclaw gateway call` peuvent aussi cibler l’URL transférée via `--url` si nécessaire.

<Note>
Remplacez `18789` par votre `gateway.port` configuré (ou `--port` ou `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
Lorsque vous passez `--url`, la CLI ne se replie pas sur les identifiants de configuration ou d’environnement. Incluez explicitement `--token` ou `--password`. L’absence d’identifiants explicites est une erreur.
</Warning>

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

Lorsque le gateway est en loopback uniquement, gardez l’URL à `ws://127.0.0.1:18789` et ouvrez d’abord le tunnel SSH.
Dans le transport par tunnel SSH de l’app macOS, les noms d’hôte de gateway découverts vont dans
`gateway.remote.sshTarget` ; `gateway.remote.url` reste l’URL du tunnel local.

## Priorité des identifiants

La résolution des identifiants du Gateway suit un contrat partagé dans les chemins call/probe/status et la surveillance d’approbation d’exécution Discord. Node-host utilise le même contrat de base avec une exception en mode local (il ignore intentionnellement `gateway.remote.*`) :

- Les identifiants explicites (`--token`, `--password` ou l’outil `gatewayToken`) l’emportent toujours sur les chemins d’appel qui acceptent l’authentification explicite.
- Sécurité des remplacements d’URL :
  - Les remplacements d’URL CLI (`--url`) ne réutilisent jamais les identifiants implicites de config/env.
  - Les remplacements d’URL d’environnement (`OPENCLAW_GATEWAY_URL`) peuvent utiliser uniquement les identifiants d’environnement (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valeurs par défaut en mode local :
  - token : `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (le repli distant s’applique uniquement lorsque l’entrée de token d’authentification locale n’est pas définie)
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (le repli distant s’applique uniquement lorsque l’entrée de mot de passe d’authentification locale n’est pas définie)
- Valeurs par défaut en mode distant :
  - token : `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exception en mode local de Node-host : `gateway.remote.token` / `gateway.remote.password` sont ignorés.
- Les vérifications de token probe/status distantes sont strictes par défaut : elles utilisent uniquement `gateway.remote.token` (aucun repli vers le token local) lorsqu’elles ciblent le mode distant.
- Les remplacements d’environnement du Gateway utilisent uniquement `OPENCLAW_GATEWAY_*`.

## Interface de chat via SSH

WebChat n’utilise plus de port HTTP séparé. L’interface de chat SwiftUI se connecte directement au WebSocket du Gateway.

- Transférez `18789` via SSH (voir ci-dessus), puis connectez les clients à `ws://127.0.0.1:18789`.
- Sur macOS, préférez le mode « Distant via SSH » de l’app, qui gère automatiquement le tunnel.

## Distant via SSH dans l’app macOS

L’app de barre de menu macOS peut piloter la même configuration de bout en bout (vérifications d’état distantes, WebChat et transfert Voice Wake).

Runbook : [accès distant macOS](/fr/platforms/mac/remote).

## Règles de sécurité (distant/VPN)

Version courte : **gardez le Gateway en loopback uniquement**, sauf si vous êtes sûr d’avoir besoin d’une liaison.

- **Loopback + SSH/Tailscale Serve** est la valeur par défaut la plus sûre (aucune exposition publique).
- Le `ws://` en clair est en loopback uniquement par défaut. Pour les réseaux privés de confiance,
  définissez `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` sur le processus client comme
  mesure d’urgence. Il n’existe pas d’équivalent `openclaw.json` ; cela doit être
  dans l’environnement du processus client qui établit la connexion WebSocket.
- Les **liaisons non-loopback** (`lan`/`tailnet`/`custom`, ou `auto` lorsque loopback est indisponible) doivent utiliser l’authentification gateway : token, mot de passe ou proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sont des sources d’identifiants client. Ils ne configurent **pas** l’authentification serveur à eux seuls.
- Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et non résolu, la résolution échoue de manière fermée (aucun repli distant masquant).
- `gateway.remote.tlsFingerprint` épingle le certificat TLS distant lors de l’utilisation de `wss://`.
- **Tailscale Serve** peut authentifier le trafic de l’interface de contrôle/WebSocket via des en-têtes d’identité lorsque `gateway.auth.allowTailscale: true` ; les points de terminaison d’API HTTP n’utilisent pas
  cette authentification par en-tête Tailscale et suivent plutôt le mode
  d’authentification HTTP normal du gateway. Ce flux sans token suppose que l’hôte du gateway est fiable. Définissez-le sur
  `false` si vous voulez une authentification par secret partagé partout.
- L’authentification **trusted-proxy** attend par défaut des configurations de proxy non-loopback sensibles à l’identité.
  Les proxies inverses loopback sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true`.
- Traitez le contrôle navigateur comme un accès opérateur : tailnet uniquement + appairage de nœud délibéré.

Présentation détaillée : [Sécurité](/fr/gateway/security).

### macOS : tunnel SSH persistant via LaunchAgent

Pour les clients macOS se connectant à un gateway distant, la configuration persistante la plus simple utilise une entrée de configuration SSH `LocalForward` plus un LaunchAgent pour garder le tunnel actif malgré les redémarrages et les plantages.

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

#### Étape 3 : configurer le token du gateway

Stockez le token dans la configuration afin qu’il persiste entre les redémarrages :

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

| Entrée de configuration              | Ce qu’elle fait                                             |
| ------------------------------------ | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Transfère le port local 18789 vers le port distant 18789    |
| `ssh -N`                             | SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                          | Redémarre automatiquement le tunnel s’il plante             |
| `RunAtLoad`                          | Démarre le tunnel lorsque le LaunchAgent se charge à la connexion |

## Connexe

- [Tailscale](/fr/gateway/tailscale)
- [Authentification](/fr/gateway/authentication)
- [Configuration du gateway distant](/fr/gateway/remote-gateway-readme)
