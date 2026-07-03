---
read_when:
    - Exécution ou dépannage des configurations de Gateway distantes
summary: Accès distant avec Gateway WS, des tunnels SSH et des tailnets
title: Accès distant
x-i18n:
    generated_at: "2026-07-03T23:31:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb6fd38698480f1dff93a6e4819082711e8e4395556a2fd85a8eb772ef6fbe31
    source_path: gateway/remote.md
    workflow: 16
---

Ce dépôt prend en charge l’accès distant au Gateway en gardant un seul Gateway (le maître) en cours d’exécution sur un hôte dédié (ordinateur de bureau/serveur) et en y connectant les clients.

- Pour **les opérateurs (vous / l’application macOS)** : le WebSocket LAN/Tailnet direct est le plus simple lorsque le Gateway est joignable ; le tunnel SSH est le repli universel.
- Pour **les nœuds (iOS/Android et futurs appareils)** : connectez-vous au **WebSocket** du Gateway (LAN/tailnet ou tunnel SSH selon les besoins).

## L’idée centrale

- Le WebSocket du Gateway se lie généralement au **loopback** sur le port configuré (18789 par défaut).
- Pour une utilisation distante, exposez-le via Tailscale Serve, une liaison LAN/Tailnet de confiance, ou transférez le port loopback via SSH.

## Configurations VPN et tailnet courantes

Considérez l’**hôte du Gateway** comme l’endroit où vit l’agent. Il possède les sessions, les profils d’authentification, les canaux et l’état. Votre ordinateur portable, votre ordinateur de bureau et vos nœuds se connectent à cet hôte.

### Gateway toujours actif dans votre tailnet

Exécutez le Gateway sur un hôte persistant (VPS ou serveur domestique) et atteignez-le via **Tailscale** ou SSH.

- **Meilleure expérience utilisateur :** conservez `gateway.bind: "loopback"` et utilisez **Tailscale Serve** pour l’interface de contrôle.
- **LAN/Tailnet de confiance :** liez le gateway à une interface privée et connectez-vous directement avec `gateway.remote.transport: "direct"`.
- **Repli :** conservez le loopback plus un tunnel SSH depuis toute machine qui a besoin d’accès.
- **Exemples :** [exe.dev](/fr/install/exe-dev) (VM facile) ou [Hetzner](/fr/install/hetzner) (VPS de production).

Idéal lorsque votre ordinateur portable se met souvent en veille, mais que vous voulez que l’agent reste toujours actif.

### L’ordinateur de bureau domestique exécute le Gateway

L’ordinateur portable n’exécute **pas** l’agent. Il se connecte à distance :

- Utilisez le mode distant de l’application macOS (Réglages → Général → OpenClaw s’exécute).
- L’application se connecte directement lorsque le gateway est joignable sur le LAN/Tailnet, ou ouvre et gère un tunnel SSH lorsque vous choisissez SSH.

Runbook : [accès distant macOS](/fr/platforms/mac/remote).

### L’ordinateur portable exécute le Gateway

Gardez le Gateway local, mais exposez-le de façon sûre :

- tunnel SSH vers l’ordinateur portable depuis d’autres machines, ou
- Tailscale Serve pour l’interface de contrôle, tout en gardant le Gateway uniquement sur loopback.

Guides : [Tailscale](/fr/gateway/tailscale) et [Vue d’ensemble Web](/fr/web).

## Flux de commande (ce qui s’exécute où)

Un seul service gateway possède l’état + les canaux. Les nœuds sont des périphériques.

Exemple de flux (Telegram → nœud) :

- Le message Telegram arrive au **Gateway**.
- Le Gateway exécute l’**agent** et décide s’il doit appeler un outil de nœud.
- Le Gateway appelle le **nœud** via le WebSocket du Gateway (RPC `node.*`).
- Le nœud renvoie le résultat ; le Gateway répond ensuite à Telegram.

Remarques :

- **Les nœuds n’exécutent pas le service gateway.** Un seul gateway doit s’exécuter par hôte, sauf si vous exécutez volontairement des profils isolés (voir [Gateways multiples](/fr/gateway/multiple-gateways)).
- Le « mode nœud » de l’application macOS est simplement un client nœud via le WebSocket du Gateway.

## Tunnel SSH (CLI + outils)

Créez un tunnel local vers le WS du Gateway distant :

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Une fois le tunnel actif :

- `openclaw health` et `openclaw status --deep` atteignent désormais le gateway distant via `ws://127.0.0.1:18789`.
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

Lorsque le gateway est uniquement sur loopback, gardez l’URL à `ws://127.0.0.1:18789` et ouvrez d’abord le tunnel SSH.
Dans le transport de tunnel SSH de l’application macOS, les noms d’hôte de gateway découverts appartiennent à
`gateway.remote.sshTarget` ; `gateway.remote.url` reste l’URL du tunnel local.
Si ces ports diffèrent, définissez `gateway.remote.remotePort` sur le port du gateway sur
l’hôte SSH.
La vérification de clé d’hôte est stricte par défaut. Les alias gérés peuvent utiliser explicitement
leur stratégie de confiance OpenSSH effective avec
`gateway.remote.sshHostKeyPolicy: "openssh"` ; examinez les paramètres SSH utilisateur et système
correspondants avant de l’activer.

Pour un gateway déjà joignable sur un LAN ou Tailnet de confiance, utilisez le mode direct :

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

La résolution des identifiants du Gateway suit un contrat partagé unique sur les chemins call/probe/status et la surveillance d’approbation d’exécution Discord. Node-host utilise le même contrat de base avec une exception en mode local (il ignore volontairement `gateway.remote.*`) :

- Les identifiants explicites (`--token`, `--password` ou l’outil `gatewayToken`) l’emportent toujours sur les chemins d’appel qui acceptent une authentification explicite.
- Sécurité de remplacement d’URL :
  - Les remplacements d’URL CLI (`--url`) ne réutilisent jamais les identifiants implicites de configuration/env.
  - Les remplacements d’URL env (`OPENCLAW_GATEWAY_URL`) peuvent utiliser uniquement les identifiants env (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valeurs par défaut du mode local :
  - token : `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (le repli distant ne s’applique que lorsque l’entrée du jeton d’authentification local n’est pas définie)
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (le repli distant ne s’applique que lorsque l’entrée du mot de passe d’authentification local n’est pas définie)
- Valeurs par défaut du mode distant :
  - token : `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exception du mode local Node-host : `gateway.remote.token` / `gateway.remote.password` sont ignorés.
- Les vérifications de jeton probe/status distantes sont strictes par défaut : elles utilisent uniquement `gateway.remote.token` (aucun repli vers le jeton local) lors du ciblage du mode distant.
- Les remplacements env du Gateway utilisent uniquement `OPENCLAW_GATEWAY_*`.

## Accès distant à l’interface de chat

WebChat n’utilise plus de port HTTP séparé. L’interface de chat SwiftUI se connecte directement au WebSocket du Gateway.

- Transférez `18789` via SSH (voir ci-dessus), puis connectez les clients à `ws://127.0.0.1:18789`.
- Pour le mode direct LAN/Tailnet, connectez les clients à l’URL privée `ws://` ou sécurisée `wss://` configurée.
- Sur macOS, préférez le mode distant de l’application, qui gère automatiquement le transport sélectionné.

## Mode distant de l’application macOS

L’application de barre de menus macOS peut piloter la même configuration de bout en bout (vérifications d’état distantes, WebChat et transfert Voice Wake).

Runbook : [accès distant macOS](/fr/platforms/mac/remote).

## Règles de sécurité (distant/VPN)

Version courte : **gardez le Gateway uniquement sur loopback**, sauf si vous êtes sûr d’avoir besoin d’une liaison.

- **Loopback + SSH/Tailscale Serve** est la valeur par défaut la plus sûre (aucune exposition publique).
- Le `ws://` en clair est accepté pour loopback, LAN, link-local, `.local`, `.ts.net` et les hôtes CGNAT Tailscale. Les hôtes distants publics doivent utiliser `wss://`.
- Les **liaisons non-loopback** (`lan`/`tailnet`/`custom`, ou `auto` lorsque loopback est indisponible) doivent utiliser l’authentification du gateway : jeton, mot de passe, ou proxy inverse conscient de l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sont des sources d’identifiants client. Ils ne configurent **pas** à eux seuls l’authentification serveur.
- Les chemins d’appel locaux peuvent utiliser `gateway.remote.*` comme repli uniquement lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est configuré explicitement via SecretRef et n’est pas résolu, la résolution échoue fermée (aucun masquage par repli distant).
- `gateway.remote.tlsFingerprint` épingle le certificat TLS distant lors de l’utilisation de `wss://`, y compris en mode direct macOS. Sans épingle configurée ou précédemment stockée, macOS n’épingle un certificat de première utilisation qu’après réussite de la confiance système normale ; les gateways auto-signés ou avec AC privée auxquels macOS ne fait pas déjà confiance nécessitent une empreinte explicite ou Remote over SSH.
- **Tailscale Serve** peut authentifier le trafic de l’interface de contrôle/WebSocket via des en-têtes d’identité
  lorsque `gateway.auth.allowTailscale: true` ; les points de terminaison d’API HTTP n’utilisent pas
  cette authentification par en-tête Tailscale et suivent plutôt le mode d’authentification HTTP normal
  du gateway. Ce flux sans jeton suppose que l’hôte du gateway est de confiance. Définissez-le sur
  `false` si vous voulez une authentification par secret partagé partout.
- L’authentification **trusted-proxy** attend par défaut des configurations de proxy conscient de l’identité non-loopback.
  Les proxys inverses loopback sur le même hôte nécessitent explicitement `gateway.auth.trustedProxy.allowLoopback = true`.
- Traitez le contrôle par navigateur comme un accès opérateur : tailnet uniquement + appairage de nœud volontaire.

Analyse approfondie : [Sécurité](/fr/gateway/security).

### macOS : tunnel SSH persistant via LaunchAgent

Pour les clients macOS qui se connectent à un gateway distant, la configuration persistante la plus simple utilise une entrée de configuration SSH `LocalForward` plus un LaunchAgent pour garder le tunnel actif entre les redémarrages et les plantages.

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

#### Étape 3 : configurer le jeton du gateway

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
Si vous avez un LaunchAgent `com.openclaw.ssh-tunnel` restant d’une ancienne configuration, déchargez-le et supprimez-le.
</Note>

#### Dépannage

Vérifier si le tunnel est en cours d’exécution :

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Redémarrer le tunnel :

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Arrêter le tunnel :

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrée de configuration              | Ce qu’elle fait                                             |
| ------------------------------------ | ----------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789` | Transfère le port local 18789 vers le port distant 18789    |
| `ssh -N`                             | SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                          | Redémarre automatiquement le tunnel s’il plante             |
| `RunAtLoad`                          | Démarre le tunnel lorsque le LaunchAgent se charge à la connexion |

## Associés

- [Tailscale](/fr/gateway/tailscale)
- [Authentification](/fr/gateway/authentication)
- [Configuration de gateway distant](/fr/gateway/remote-gateway-readme)
