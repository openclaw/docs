---
read_when:
    - Installare OpenClaw su Windows
    - Scegliere tra Windows nativo e WSL2
    - Cercare lo stato dell'app companion per Windows
summary: 'Supporto Windows: percorsi di installazione nativi e WSL2, daemon e limitazioni attuali'
title: Windows
x-i18n:
    generated_at: "2026-04-05T13:59:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d9819206bdd65cf03519c1bc73ed0c7889b0ab842215ea94343262300adfd14
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw supporta sia **Windows nativo** sia **WSL2**. WSL2 è il percorso più
stabile ed è consigliato per l'esperienza completa: la CLI, il Gateway e gli
strumenti vengono eseguiti all'interno di Linux con piena compatibilità. Windows nativo funziona per
l'uso principale di CLI e Gateway, con alcune limitazioni indicate di seguito.

Le app companion native per Windows sono pianificate.

## WSL2 (consigliato)

- [Getting Started](/start/getting-started) (da usare all'interno di WSL)
- [Install & updates](/install/updating)
- Guida ufficiale a WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Stato di Windows nativo

I flussi della CLI nativa su Windows stanno migliorando, ma WSL2 resta ancora il percorso consigliato.

Cosa funziona bene oggi su Windows nativo:

- installer dal sito tramite `install.ps1`
- uso locale della CLI come `openclaw --version`, `openclaw doctor` e `openclaw plugins list --json`
- smoke test locali incorporati di agent/provider come:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Limitazioni attuali:

- `openclaw onboard --non-interactive` si aspetta ancora un gateway locale raggiungibile a meno che tu non passi `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` e `openclaw gateway install` provano prima con le Attività pianificate di Windows
- se la creazione dell'Attività pianificata viene negata, OpenClaw ricade su un elemento di avvio all'accesso nella cartella Startup per utente e avvia immediatamente il gateway
- se `schtasks` stesso si blocca o smette di rispondere, OpenClaw ora interrompe rapidamente quel percorso e ripiega invece di restare appeso per sempre
- le Attività pianificate restano preferite quando disponibili perché forniscono un migliore stato del supervisore

Se vuoi solo la CLI nativa, senza installazione del servizio gateway, usa uno di questi:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Se invece vuoi l'avvio gestito su Windows nativo:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Se la creazione dell'Attività pianificata è bloccata, la modalità di servizio fallback continua comunque ad avviarsi automaticamente dopo il login tramite la cartella Startup dell'utente corrente.

## Gateway

- [Gateway runbook](/gateway)
- [Configuration](/gateway/configuration)

## Installazione del servizio Gateway (CLI)

Dentro WSL2:

```
openclaw onboard --install-daemon
```

Oppure:

```
openclaw gateway install
```

Oppure:

```
openclaw configure
```

Seleziona **Gateway service** quando richiesto.

Riparazione/migrazione:

```
openclaw doctor
```

## Avvio automatico del Gateway prima del login a Windows

Per configurazioni headless, assicurati che l'intera catena di avvio venga eseguita anche quando nessuno accede a
Windows.

### 1) Mantieni i servizi utente in esecuzione senza login

Dentro WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Installa il servizio utente del gateway OpenClaw

Dentro WSL:

```bash
openclaw gateway install
```

### 3) Avvia automaticamente WSL all'avvio di Windows

In PowerShell come Amministratore:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Sostituisci `Ubuntu` con il nome della tua distribuzione da:

```powershell
wsl --list --verbose
```

### Verifica della catena di avvio

Dopo un riavvio (prima dell'accesso a Windows), controlla da WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avanzato: esporre servizi WSL sulla LAN (portproxy)

WSL ha una propria rete virtuale. Se un'altra macchina deve raggiungere un servizio
in esecuzione **all'interno di WSL** (SSH, un server TTS locale o il Gateway), devi
inoltrare una porta Windows verso l'IP WSL corrente. L'IP WSL cambia dopo i riavvii,
quindi potresti dover aggiornare la regola di inoltro.

Esempio (PowerShell **come Amministratore**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Consenti la porta nel firewall di Windows (una sola volta):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Aggiorna il portproxy dopo il riavvio di WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Note:

- SSH da un'altra macchina deve puntare all'**IP dell'host Windows** (ad esempio: `ssh user@windows-host -p 2222`).
- I nodi remoti devono puntare a un URL Gateway **raggiungibile** (non `127.0.0.1`); usa
  `openclaw status --all` per confermare.
- Usa `listenaddress=0.0.0.0` per accesso LAN; `127.0.0.1` lo mantiene solo locale.
- Se vuoi automatizzare questo passaggio, registra un'Attività pianificata per eseguire l'aggiornamento
  al login.

## Installazione WSL2 passo per passo

### 1) Installa WSL2 + Ubuntu

Apri PowerShell (Admin):

```powershell
wsl --install
# Oppure scegli esplicitamente una distribuzione:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Riavvia se Windows lo richiede.

### 2) Abilita systemd (richiesto per l'installazione del gateway)

Nel terminale WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Poi da PowerShell:

```powershell
wsl --shutdown
```

Riapri Ubuntu, quindi verifica:

```bash
systemctl --user status
```

### 3) Installa OpenClaw (dentro WSL)

Segui il flusso Linux Getting Started all'interno di WSL:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # installa automaticamente le dipendenze UI alla prima esecuzione
pnpm build
openclaw onboard
```

Guida completa: [Getting Started](/start/getting-started)

## App companion per Windows

Non abbiamo ancora un'app companion per Windows. I contributi sono benvenuti se vuoi
aiutare a realizzarla.
