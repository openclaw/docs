---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Configurazione del tunnel SSH per connettere OpenClaw.app a un Gateway remoto
title: Configurazione del Gateway remoto
x-i18n:
    generated_at: "2026-04-30T08:53:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: fccc75e672bf3295c335fc4d2f610e9cbb3f1882edd12ffb9d009120291bd2d9
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

> Questo contenuto è stato unito in [Accesso remoto](/it/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Consulta quella pagina per la guida attuale.

# Eseguire OpenClaw.app con un Gateway remoto

OpenClaw.app usa il tunneling SSH per connettersi a un gateway remoto. Questa guida mostra come configurarlo.

## Panoramica

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

## Configurazione rapida

### Passaggio 1: aggiungere la configurazione SSH

Modifica `~/.ssh/config` e aggiungi:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # e.g., 172.27.187.184
    User <REMOTE_USER>            # e.g., jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Sostituisci `<REMOTE_IP>` e `<REMOTE_USER>` con i tuoi valori.

### Passaggio 2: copiare la chiave SSH

Copia la tua chiave pubblica sulla macchina remota (inserisci la password una volta):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Passaggio 3: configurare l'autenticazione del Gateway remoto

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Usa invece `gateway.remote.password` se il tuo Gateway remoto usa l'autenticazione con password.
`OPENCLAW_GATEWAY_TOKEN` resta valido come override a livello di shell, ma la configurazione
duratura del client remoto è `gateway.remote.token` / `gateway.remote.password`.

### Passaggio 4: avviare il tunnel SSH

```bash
ssh -N remote-gateway &
```

### Passaggio 5: riavviare OpenClaw.app

```bash
# Quit OpenClaw.app (⌘Q), then reopen:
open /path/to/OpenClaw.app
```

L'app ora si connetterà al Gateway remoto tramite il tunnel SSH.

---

## Avvio automatico del tunnel all'accesso

Per avviare automaticamente il tunnel SSH quando accedi, crea un Launch Agent.

### Creare il file PLIST

Salvalo come `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

### Caricare il Launch Agent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Il tunnel ora:

- Si avvierà automaticamente quando accedi
- Si riavvierà in caso di arresto anomalo
- Continuerà a essere eseguito in background

Nota legacy: rimuovi eventuali LaunchAgent `com.openclaw.ssh-tunnel` residui, se presenti.

---

## Risoluzione dei problemi

**Verificare se il tunnel è in esecuzione:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**Riavviare il tunnel:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**Arrestare il tunnel:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Come funziona

| Componente                           | Cosa fa                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Inoltra la porta locale 18789 alla porta remota 18789        |
| `ssh -N`                             | SSH senza eseguire comandi remoti (solo inoltro di porte)    |
| `KeepAlive`                          | Riavvia automaticamente il tunnel in caso di arresto anomalo |
| `RunAtLoad`                          | Avvia il tunnel quando l'agent viene caricato                |

OpenClaw.app si connette a `ws://127.0.0.1:18789` sulla tua macchina client. Il tunnel SSH inoltra quella connessione alla porta 18789 sulla macchina remota in cui è in esecuzione il Gateway.

## Correlati

- [Accesso remoto](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)
