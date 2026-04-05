---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Configurazione del tunnel SSH per OpenClaw.app che si connette a un gateway remoto
title: Configurazione del Gateway remoto
x-i18n:
    generated_at: "2026-04-05T13:52:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55467956a3473fa36709715f017369471428f7566132f7feb47581caa98b4600
    source_path: gateway/remote-gateway-readme.md
    workflow: 15
---

> Questo contenuto è stato unito in [Remote Access](/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Consulta quella pagina per la guida aggiornata.

# Esecuzione di OpenClaw.app con un Gateway remoto

OpenClaw.app usa il tunneling SSH per connettersi a un gateway remoto. Questa guida mostra come configurarlo.

## Panoramica

```mermaid
flowchart TB
    subgraph Client["Macchina client"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(porta locale)"]
        T["Tunnel SSH"]

        A --> B
        B --> T
    end
    subgraph Remote["Macchina remota"]
        direction TB
        C["Gateway WebSocket"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Configurazione rapida

### Passaggio 1: aggiungi la configurazione SSH

Modifica `~/.ssh/config` e aggiungi:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>          # ad esempio, 172.27.187.184
    User <REMOTE_USER>            # ad esempio, jefferson
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Sostituisci `<REMOTE_IP>` e `<REMOTE_USER>` con i tuoi valori.

### Passaggio 2: copia la chiave SSH

Copia la tua chiave pubblica sulla macchina remota (inserisci la password una sola volta):

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

### Passaggio 3: configura l'autenticazione del Gateway remoto

```bash
openclaw config set gateway.remote.token "<your-token>"
```

Usa invece `gateway.remote.password` se il tuo gateway remoto usa l'autenticazione con password.
`OPENCLAW_GATEWAY_TOKEN` è ancora valido come override a livello di shell, ma la
configurazione durevole del client remoto è `gateway.remote.token` / `gateway.remote.password`.

### Passaggio 4: avvia il tunnel SSH

```bash
ssh -N remote-gateway &
```

### Passaggio 5: riavvia OpenClaw.app

```bash
# Chiudi OpenClaw.app (⌘Q), poi riaprilo:
open /path/to/OpenClaw.app
```

L'app ora si connetterà al gateway remoto tramite il tunnel SSH.

---

## Avvio automatico del tunnel al login

Per fare in modo che il tunnel SSH si avvii automaticamente quando effettui l'accesso, crea un Launch Agent.

### Crea il file PLIST

Salva questo contenuto come `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

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

### Carica il Launch Agent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

Il tunnel ora:

- Si avvia automaticamente quando effettui l'accesso
- Si riavvia se si arresta in modo anomalo
- Continua a essere eseguito in background

Nota legacy: rimuovi eventuali LaunchAgent `com.openclaw.ssh-tunnel` residui, se presenti.

---

## Risoluzione dei problemi

**Controlla se il tunnel è in esecuzione:**

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

**Riavvia il tunnel:**

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

**Arresta il tunnel:**

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

---

## Come funziona

| Componente                           | Cosa fa                                                      |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Inoltra la porta locale 18789 alla porta remota 18789        |
| `ssh -N`                             | SSH senza eseguire comandi remoti (solo port forwarding)     |
| `KeepAlive`                          | Riavvia automaticamente il tunnel se si arresta in modo anomalo |
| `RunAtLoad`                          | Avvia il tunnel quando l'agente viene caricato               |

OpenClaw.app si connette a `ws://127.0.0.1:18789` sulla tua macchina client. Il tunnel SSH inoltra quella connessione alla porta 18789 sulla macchina remota in cui è in esecuzione il Gateway.
