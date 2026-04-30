---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Configuration du tunnel SSH pour connecter OpenClaw.app à un Gateway distant
title: Configuration du Gateway distant
x-i18n:
    generated_at: "2026-04-30T07:28:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: fccc75e672bf3295c335fc4d2f610e9cbb3f1882edd12ffb9d009120291bd2d9
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

> Ce contenu a été fusionné dans [Accès à distance](/fr/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Consultez cette page pour le guide actuel.

# Exécuter OpenClaw.app avec un Gateway distant

OpenClaw.app utilise un tunnel SSH pour se connecter à un Gateway distant. Ce guide vous montre comment le configurer.

## Vue d’ensemble

```mermaid
flowchart TB
    subgraph Client["Client Machine"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(local port)"]
        T["SSH Tunnel"]

        A --> B
        B --> T
    end
    subgraph Remote["Remote Machine"]
        direction TB
        C["Gateway WebSocket"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Configuration rapide

### Étape 1 : ajouter la configuration SSH

Modifiez `~/.ssh/config` et ajoutez :

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # e.g., 172.27.187.184
    User <REMOTE_USER>            # e.g., jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Remplacez `<REMOTE_IP>` et `<REMOTE_USER>` par vos valeurs.

### Étape 2 : copier la clé SSH

Copiez votre clé publique sur la machine distante (saisissez le mot de passe une fois) :

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Étape 3 : configurer l’authentification du Gateway distant

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Utilisez plutôt `gateway.remote.password` si votre Gateway distant utilise une authentification par mot de passe.
`OPENCLAW_GATEWAY_TOKEN` reste valide comme remplacement au niveau du shell, mais la configuration durable
du client distant est `gateway.remote.token` / `gateway.remote.password`.

### Étape 4 : démarrer le tunnel SSH

```bash
ssh -N remote-gateway &
```

### Étape 5 : redémarrer OpenClaw.app

```bash
# Quit OpenClaw.app (⌘Q), then reopen:
open /path/to/OpenClaw.app
```

L’application se connectera maintenant au Gateway distant via le tunnel SSH.

---

## Démarrage automatique du tunnel à la connexion

Pour que le tunnel SSH démarre automatiquement lorsque vous vous connectez, créez un Launch Agent.

### Créer le fichier PLIST

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

### Charger le Launch Agent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Le tunnel va maintenant :

- Démarrer automatiquement lorsque vous vous connectez
- Redémarrer s’il plante
- Continuer à s’exécuter en arrière-plan

Note héritée : supprimez tout LaunchAgent `com.openclaw.ssh-tunnel` restant, s’il est présent.

---

## Dépannage

**Vérifier si le tunnel est en cours d’exécution :**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**Redémarrer le tunnel :**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**Arrêter le tunnel :**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Fonctionnement

| Composant                            | Rôle                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Transfère le port local 18789 vers le port distant 18789     |
| `ssh -N`                             | SSH sans exécuter de commandes distantes (transfert de port uniquement) |
| `KeepAlive`                          | Redémarre automatiquement le tunnel s’il plante              |
| `RunAtLoad`                          | Démarre le tunnel lorsque l’agent se charge                  |

OpenClaw.app se connecte à `ws://127.0.0.1:18789` sur votre machine cliente. Le tunnel SSH transfère cette connexion vers le port 18789 sur la machine distante où le Gateway est en cours d’exécution.

## Connexe

- [Accès à distance](/fr/gateway/remote)
- [Tailscale](/fr/gateway/tailscale)
