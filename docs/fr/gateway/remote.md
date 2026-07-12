---
read_when:
    - Exécution ou dépannage des configurations de Gateway distant
summary: Accès à distance à l’aide du WebSocket du Gateway, de tunnels SSH et de réseaux tailnet
title: Accès à distance
x-i18n:
    generated_at: "2026-07-12T15:22:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78daaad7bcb9f80072eaa2d6946bff9f28ba1ec4f95a68edb0d24cf7f9c3fec2
    source_path: gateway/remote.md
    workflow: 16
---

OpenClaw exécute un Gateway (le maître) sur un hôte et y connecte chaque client. Le Gateway gère les sessions, les profils d’authentification, les canaux et l’état ; tout le reste est un client.

- **Opérateurs** (vous ou l’application macOS) : une connexion WebSocket directe via le LAN/Tailnet est la solution la plus simple lorsque le Gateway est accessible ; la redirection SSH constitue la solution de repli universelle.
- **Nodes** (iOS/Android et autres appareils) : se connectent au **WebSocket** du Gateway (LAN/Tailnet ou tunnel SSH).

## Principe fondamental

Par défaut, le WebSocket du Gateway se lie à l’interface de **bouclage** sur le port `18789` (`gateway.port`). Pour une utilisation distante, exposez-le au moyen de Tailscale Serve ou d’une liaison LAN/Tailnet de confiance, ou transférez le port de bouclage via SSH.

## Options de topologie

| Configuration                             | Emplacement d’exécution du Gateway                                                                                    | Idéal pour                                                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway permanent dans votre Tailnet      | Hôte persistant (VPS ou serveur domestique), accessible via Tailscale ou SSH                                          | Les ordinateurs portables souvent en veille qui nécessitent un agent toujours actif. Consultez [exe.dev](/fr/install/exe-dev) (VM simple) ou [Hetzner](/fr/install/hetzner) (VPS de production). |
| Ordinateur de bureau domestique           | Ordinateur de bureau ; l’ordinateur portable se connecte à distance via le mode distant de l’application macOS (Settings → Connection → OpenClaw runs) | Maintenir l’agent sur du matériel qui reste sous tension. Procédure : [accès distant macOS](/fr/platforms/mac/remote). |
| Ordinateur portable                       | Ordinateur portable, exposé de façon sécurisée via un tunnel SSH ou Tailscale Serve (conservez `gateway.bind: "loopback"`) | Configurations sur une seule machine. Consultez [Tailscale](/fr/gateway/tailscale) et [Web](/fr/web). |

Pour les configurations avec Gateway permanent et sur ordinateur portable, conservez de préférence `gateway.bind: "loopback"` et utilisez **Tailscale Serve** pour l’interface de contrôle, ou une liaison LAN/Tailnet de confiance avec `gateway.remote.transport: "direct"`. Le tunnel SSH est la solution de repli qui fonctionne depuis n’importe quelle machine.

## Flux des commandes (où s’exécute chaque élément)

Un seul Gateway gère l’état et les canaux ; les Nodes sont des périphériques. Exemple (message Telegram acheminé vers un outil de Node) :

1. Le message Telegram arrive au **Gateway**.
2. Le Gateway exécute l’**agent**, qui décide s’il doit appeler un outil de Node.
3. Le Gateway appelle le **Node** via le WebSocket du Gateway (RPC `node.invoke`).
4. Le Node renvoie le résultat ; le Gateway répond sur Telegram.

Les Nodes n’exécutent pas le service Gateway. Un seul Gateway doit s’exécuter par hôte, sauf si vous exécutez intentionnellement des profils isolés (consultez [Plusieurs Gateways](/fr/gateway/multiple-gateways)). Le « mode Node » de l’application macOS est simplement un client Node connecté via le WebSocket du Gateway.

## Tunnel SSH (CLI + outils)

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Une fois le tunnel établi, `openclaw health` et `openclaw status --deep` accèdent au Gateway distant via `ws://127.0.0.1:18789`. `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` et `openclaw gateway call` peuvent également cibler une URL transférée au moyen de `--url`.

<Note>
Remplacez `18789` par la valeur configurée de `gateway.port` (ou `--port` / `OPENCLAW_GATEWAY_PORT`).
</Note>

<Warning>
`--url` ne réutilise jamais les identifiants provenant de la configuration ou de l’environnement. Transmettez explicitement `--token` ou `--password` ; sans eux, le client n’envoie aucun identifiant et la connexion échoue si le Gateway cible exige une authentification.
</Warning>

## Valeurs distantes par défaut de la CLI

Enregistrez une cible distante afin que les commandes de la CLI l’utilisent par défaut :

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

Lorsque le Gateway est limité à l’interface de bouclage, conservez l’URL `ws://127.0.0.1:18789` et ouvrez d’abord le tunnel SSH. Avec le transport par tunnel SSH de l’application macOS, le nom d’hôte du Gateway découvert se place dans `gateway.remote.sshTarget` (`user@host` ou `user@host:port`) ; `gateway.remote.url` reste l’URL locale du tunnel. Si le port distant diffère du port local, définissez `gateway.remote.remotePort`.

La vérification de la clé d’hôte est stricte par défaut (`gateway.remote.sshHostKeyPolicy: "strict"`). Définissez-la sur `"openssh"` pour la déléguer à votre configuration OpenSSH effective ; examinez vos paramètres SSH utilisateur et système avant de l’activer.

Pour un Gateway déjà accessible sur un LAN ou un Tailnet de confiance, utilisez le mode direct :

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

La résolution des identifiants du Gateway suit un contrat commun entre les chemins d’appel, de sondage et d’état, ainsi que la surveillance des approbations d’exécution de Discord. L’hôte du Node utilise le même contrat, avec une exception en mode local (il ignore `gateway.remote.*`).

- Les identifiants explicites (`--token`, `--password` ou le `gatewayToken` d’un outil) ont toujours priorité sur les chemins d’appel qui acceptent une authentification explicite.
- Sécurité des remplacements d’URL :
  - L’option `--url` de la CLI ne réutilise jamais les identifiants implicites de la configuration ou de l’environnement.
  - La variable d’environnement `OPENCLAW_GATEWAY_URL` ne peut utiliser que les identifiants de l’environnement (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valeurs par défaut du mode local :
  - jeton : `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (repli distant uniquement lorsque le jeton local n’est pas défini)
  - mot de passe : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (repli distant uniquement lorsque le mot de passe local n’est pas défini)
- Valeurs par défaut du mode distant :
  - jeton : `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - mot de passe : `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Exception du mode local de l’hôte du Node : `gateway.remote.token` / `gateway.remote.password` sont ignorés.
- Les vérifications de jeton des sondages et états distants sont strictes par défaut : elles utilisent uniquement `gateway.remote.token` (sans repli sur le jeton local) lorsqu’elles ciblent le mode distant.
- Les remplacements d’environnement du Gateway utilisent uniquement `OPENCLAW_GATEWAY_*`.

## Accès distant à l’interface de discussion

WebChat ne dispose pas d’un port HTTP distinct ; l’interface de discussion SwiftUI se connecte directement au WebSocket du Gateway.

- Transférez `18789` via SSH (voir ci-dessus), puis connectez les clients à `ws://127.0.0.1:18789`.
- Pour le mode direct via LAN/Tailnet, connectez les clients à l’URL privée `ws://` ou sécurisée `wss://` configurée.
- Sous macOS, le mode distant de l’application gère automatiquement le transport sélectionné.

## Mode distant de l’application macOS

L’application de barre des menus macOS gère la même configuration de bout en bout : vérifications de l’état distant, WebChat et transfert de Voice Wake. Procédure : [accès distant macOS](/fr/platforms/mac/remote).

## Règles de sécurité (accès distant/VPN)

Conservez le Gateway **limité à l’interface de bouclage**, sauf si vous êtes certain d’avoir besoin d’une liaison.

- **Bouclage + SSH/Tailscale Serve** est la configuration par défaut la plus sûre (aucune exposition publique).
- Le protocole non chiffré `ws://` est accepté pour les hôtes de bouclage, privés/LAN (RFC 1918), link-local, CGNAT, `.local` et `.ts.net`. Les hôtes publics distants doivent utiliser `wss://`.
- Les **liaisons hors bouclage** (`lan`/`tailnet`/`custom`, ou `auto` lorsque le bouclage n’est pas disponible) doivent utiliser l’authentification du Gateway : jeton, mot de passe ou proxy inverse sensible à l’identité avec `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` sont des sources d’identifiants client ; ils ne configurent pas à eux seuls l’authentification du serveur.
- Les chemins d’appel locaux ne peuvent utiliser `gateway.remote.*` comme solution de repli que lorsque `gateway.auth.*` n’est pas défini.
- Si `gateway.auth.token` / `gateway.auth.password` est explicitement configuré via SecretRef et ne peut pas être résolu, la résolution échoue de manière fermée (aucun repli distant ne masque l’échec).
- `gateway.remote.tlsFingerprint` épingle le certificat TLS distant pour `wss://`, y compris en mode direct sous macOS. Sans empreinte enregistrée, macOS ne l’épingle à la première utilisation qu’après validation normale par le système ; les Gateways autosignés ou utilisant une autorité de certification privée nécessitent une empreinte explicite ou le mode distant via SSH.
- **Tailscale Serve** peut authentifier le trafic de l’interface de contrôle/WebSocket au moyen d’en-têtes d’identité lorsque `gateway.auth.allowTailscale: true`. Les points de terminaison de l’API HTTP n’utilisent pas cette authentification par en-tête et suivent à la place le mode d’authentification HTTP normal du Gateway. Ce flux sans jeton suppose que l’hôte du Gateway est fiable ; définissez cette option sur `false` pour utiliser partout une authentification par secret partagé.
- L’authentification **par proxy de confiance** attend par défaut un proxy sensible à l’identité hors bouclage. Les proxys inverses de bouclage sur le même hôte nécessitent `gateway.auth.trustedProxy.allowLoopback = true` explicitement.
- Traitez le contrôle depuis le navigateur comme un accès opérateur : uniquement via le Tailnet, avec un appairage délibéré des Nodes.

Analyse approfondie : [Sécurité](/fr/gateway/security).

### macOS : tunnel SSH persistant via LaunchAgent

Pour les clients macOS, la configuration persistante la plus simple utilise une entrée SSH `LocalForward` et un LaunchAgent qui maintient le tunnel actif après les redémarrages et les pannes.

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

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Utilisez plutôt `gateway.remote.password` si le Gateway distant utilise une authentification par mot de passe. `OPENCLAW_GATEWAY_TOKEN` reste valide comme remplacement au niveau de l’environnement du shell, mais la configuration persistante du client distant repose sur `gateway.remote.token` / `gateway.remote.password`.

#### Étape 4 : créer le LaunchAgent

Enregistrez le fichier sous `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist` :

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

Le tunnel démarre automatiquement à l’ouverture de session, redémarre après une panne et maintient le port transféré actif.

<Note>
Si un LaunchAgent `com.openclaw.ssh-tunnel` provenant d’une ancienne configuration subsiste, déchargez-le et supprimez-le.
</Note>

#### Dépannage

```bash
# Vérifier si le tunnel est en cours d’exécution
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789

# Redémarrer le tunnel
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel

# Arrêter le tunnel
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrée de configuration                 | Fonction                                                               |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `LocalForward 18789 127.0.0.1:18789`    | Transfère le port local 18789 vers le port distant 18789               |
| `ssh -N`                                | Établit une connexion SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                             | Redémarre automatiquement le tunnel en cas de panne                    |
| `RunAtLoad`                             | Démarre le tunnel lorsque le LaunchAgent est chargé à l’ouverture de session |

## Pages connexes

- [Tailscale](/fr/gateway/tailscale)
- [Authentification](/fr/gateway/authentication)
- [Configuration d’un Gateway distant](/fr/gateway/remote-gateway-readme)
