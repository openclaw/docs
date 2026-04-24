---
read_when:
    - Installare OpenClaw su Windows
    - Scegliere tra Windows nativo e WSL2
    - Cerchi lo stato dell'app companion per Windows
summary: 'Supporto Windows: percorsi di installazione nativi e WSL2, daemon e limitazioni attuali'
title: Windows
x-i18n:
    generated_at: "2026-04-24T08:51:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw supporta sia **Windows nativo** sia **WSL2**. WSL2 è il percorso più
stabile ed è consigliato per l'esperienza completa: la CLI, il Gateway e gli
strumenti vengono eseguiti dentro Linux con piena compatibilità. Windows nativo funziona per
l'uso di base di CLI e Gateway, con alcune limitazioni indicate più sotto.

Sono previste app companion native per Windows.

## WSL2 (consigliato)

- [Per iniziare](/it/start/getting-started) (da usare dentro WSL)
- [Installazione e aggiornamenti](/it/install/updating)
- Guida ufficiale WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Stato di Windows nativo

I flussi CLI nativi per Windows stanno migliorando, ma WSL2 resta il percorso consigliato.

Cosa funziona bene oggi su Windows nativo:

- installer del sito web tramite `install.ps1`
- uso locale della CLI come `openclaw --version`, `openclaw doctor` e `openclaw plugins list --json`
- smoke test incorporato di agente/provider locale come:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Limitazioni attuali:

- `openclaw onboard --non-interactive` si aspetta ancora un Gateway locale raggiungibile a meno che tu non passi `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` e `openclaw gateway install` provano prima con le Windows Scheduled Tasks
- se la creazione della Scheduled Task viene negata, OpenClaw usa come fallback un elemento di login per utente nella cartella Startup e avvia immediatamente il Gateway
- se `schtasks` stesso si blocca o smette di rispondere, OpenClaw ora interrompe rapidamente quel percorso e usa il fallback invece di restare bloccato per sempre
- le Scheduled Tasks restano comunque preferite quando disponibili perché forniscono uno stato del supervisor migliore

Se vuoi solo la CLI nativa, senza installare il servizio Gateway, usa uno di questi:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Se invece vuoi l'avvio gestito su Windows nativo:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Se la creazione della Scheduled Task è bloccata, la modalità di servizio fallback si avvia comunque automaticamente dopo il login tramite la cartella Startup dell'utente corrente.

## Gateway

- [Runbook del Gateway](/it/gateway)
- [Configurazione](/it/gateway/configuration)

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

## Auto-avvio del Gateway prima del login su Windows

Per configurazioni headless, assicurati che l'intera catena di avvio venga eseguita anche quando nessuno accede a Windows.

### 1) Mantieni attivi i servizi utente senza login

Dentro WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Installa il servizio utente del Gateway OpenClaw

Dentro WSL:

```bash
openclaw gateway install
```

### 3) Avvia WSL automaticamente all'avvio di Windows

In PowerShell come amministratore:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Sostituisci `Ubuntu` con il nome della tua distribuzione da:

```powershell
wsl --list --verbose
```

### Verifica della catena di avvio

Dopo un riavvio (prima del login a Windows), controlla da WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avanzato: esporre i servizi WSL sulla LAN (portproxy)

WSL ha una propria rete virtuale. Se un'altra macchina deve raggiungere un servizio
in esecuzione **dentro WSL** (SSH, un server TTS locale o il Gateway), devi
inoltrare una porta Windows verso l'IP WSL corrente. L'IP WSL cambia dopo i riavvii,
quindi potrebbe essere necessario aggiornare la regola di inoltro.

Esempio (PowerShell **come amministratore**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Consenti la porta tramite Windows Firewall (una sola volta):

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

- SSH da un'altra macchina punta all'**IP host Windows** (esempio: `ssh user@windows-host -p 2222`).
- I Node remoti devono puntare a un URL Gateway **raggiungibile** (non `127.0.0.1`); usa
  `openclaw status --all` per confermare.
- Usa `listenaddress=0.0.0.0` per accesso LAN; `127.0.0.1` lo mantiene solo locale.
- Se vuoi automatizzare questa operazione, registra una Scheduled Task che esegua il
  refresh al login.

## Installazione WSL2 passo dopo passo

### 1) Installa WSL2 + Ubuntu

Apri PowerShell (Admin):

```powershell
wsl --install
# Oppure scegli esplicitamente una distribuzione:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Riavvia se Windows lo richiede.

### 2) Abilita systemd (richiesto per l'installazione del Gateway)

Nel tuo terminale WSL:

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

Riapri Ubuntu, poi verifica:

```bash
systemctl --user status
```

### 3) Installa OpenClaw (dentro WSL)

Per una normale configurazione iniziale dentro WSL, segui il flusso Linux di Per iniziare:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Se stai sviluppando dal sorgente invece di fare il primo onboarding, usa il
ciclo di sviluppo dal sorgente descritto in [Setup](/it/start/setup):

```bash
pnpm install
# Solo al primo avvio (o dopo aver reimpostato config/workspace locali di OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

Guida completa: [Per iniziare](/it/start/getting-started)

## App companion Windows

Non abbiamo ancora un'app companion per Windows. I contributi sono benvenuti se vuoi
aiutare a realizzarla.

## Correlati

- [Panoramica installazione](/it/install)
- [Piattaforme](/it/platforms)
