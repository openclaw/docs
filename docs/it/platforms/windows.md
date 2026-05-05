---
read_when:
    - Installazione di OpenClaw su Windows
    - Scegliere tra Windows nativo e WSL2
    - Verifica dello stato dell'app complementare per Windows
summary: 'Supporto Windows: percorsi di installazione nativi e WSL2, daemon e avvertenze attuali'
title: Windows
x-i18n:
    generated_at: "2026-05-05T06:17:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: adf885747e3a897cb4ee57f6494805468d38c4595c0ab7582b063153a1134d18
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw supporta sia **Windows nativo** sia **WSL2**. WSL2 è il percorso più
stabile ed è consigliato per l'esperienza completa: CLI, Gateway e
strumenti vengono eseguiti dentro Linux con piena compatibilità. Windows nativo funziona per
l'uso di base della CLI e del Gateway, con alcune limitazioni indicate sotto.

Le app companion native per Windows sono pianificate.

## WSL2 (consigliato)

- [Guida introduttiva](/it/start/getting-started) (da usare dentro WSL)
- [Installazione e aggiornamenti](/it/install/updating)
- Guida WSL2 ufficiale (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Stato di Windows nativo

I flussi della CLI su Windows nativo stanno migliorando, ma WSL2 resta il percorso consigliato.

Cosa funziona bene oggi su Windows nativo:

- installer dal sito web tramite `install.ps1`
- uso locale della CLI, ad esempio `openclaw --version`, `openclaw doctor` e `openclaw plugins list --json`
- smoke test incorporato per local-agent/provider, ad esempio:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Limitazioni attuali:

- `openclaw onboard --non-interactive` si aspetta ancora un gateway locale raggiungibile, a meno che tu non passi `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` e `openclaw gateway install` provano prima le Attività pianificate di Windows
- se la creazione dell'Attività pianificata viene negata, OpenClaw ripiega su un elemento di accesso per utente nella cartella Esecuzione automatica e avvia immediatamente il gateway
- se `schtasks` stesso si blocca o smette di rispondere, OpenClaw ora interrompe rapidamente quel percorso e ripiega invece di restare bloccato per sempre
- le Attività pianificate restano preferite quando disponibili, perché forniscono uno stato di supervisione migliore

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

Se la creazione dell'Attività pianificata è bloccata, la modalità servizio di fallback si avvia comunque automaticamente dopo l'accesso tramite la cartella Esecuzione automatica dell'utente corrente.

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

Seleziona **Servizio Gateway** quando richiesto.

Ripara/migra:

```
openclaw doctor
```

## Avvio automatico del Gateway prima dell'accesso a Windows

Per configurazioni headless, assicurati che l'intera catena di avvio venga eseguita anche quando nessuno accede a
Windows.

### 1) Mantieni in esecuzione i servizi utente senza accesso

Dentro WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Installa il servizio utente del gateway OpenClaw

Dentro WSL:

```bash
openclaw gateway install
```

### 3) Avvia WSL automaticamente all'avvio di Windows

In PowerShell come Amministratore:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Sostituisci `Ubuntu` con il nome della tua distro da:

```powershell
wsl --list --verbose
```

### Verifica la catena di avvio

Dopo un riavvio (prima dell'accesso a Windows), controlla da WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Avanzato: esporre i servizi WSL sulla LAN (portproxy)

WSL ha una propria rete virtuale. Se un'altra macchina deve raggiungere un servizio
in esecuzione **dentro WSL** (SSH, un server TTS locale o il Gateway), devi
inoltrare una porta Windows all'IP WSL corrente. L'IP WSL cambia dopo i riavvii,
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

- SSH da un'altra macchina punta all'**IP dell'host Windows** (esempio: `ssh user@windows-host -p 2222`).
- I nodi remoti devono puntare a un URL Gateway **raggiungibile** (non `127.0.0.1`); usa
  `openclaw status --all` per confermare.
- Usa `listenaddress=0.0.0.0` per l'accesso LAN; `127.0.0.1` lo mantiene solo locale.
- Se vuoi renderlo automatico, registra un'Attività pianificata per eseguire il passaggio
  di aggiornamento all'accesso.

## Installazione WSL2 passo passo

### 1) Installa WSL2 + Ubuntu

Apri PowerShell (Amministratore):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Riavvia se Windows lo richiede.

### 2) Abilita systemd (necessario per l'installazione del gateway)

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

Riapri Ubuntu, quindi verifica:

```bash
systemctl --user status
```

### 3) Installa OpenClaw (dentro WSL)

Per una normale configurazione iniziale dentro WSL, segui il flusso Linux della Guida introduttiva:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Se stai sviluppando dal sorgente invece di eseguire l'onboarding iniziale, usa il
loop di sviluppo dal sorgente da [Configurazione](/it/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Guida completa: [Guida introduttiva](/it/start/getting-started)

## App companion per Windows

Non abbiamo ancora un'app companion per Windows. I contributi sono benvenuti se vuoi
aiutare a realizzarla.

## Connettività Git e GitHub (contributori)

Alcune reti bloccano o limitano HTTPS verso GitHub. Se `git clone` fallisce con timeout
o reset della connessione, prova un'altra rete, una VPN o un proxy HTTP/HTTPS fornito dalla tua
organizzazione.

Se `gh auth login` fallisce durante il flusso dispositivo del browser (ad esempio per un timeout
nel raggiungere `github.com:443`), autenticati invece con un token di accesso personale:

1. Crea un token con almeno lo scope `repo` (PAT classico) o un accesso
   fine-grained equivalente.
2. In PowerShell per la sessione corrente:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. Se `gh auth status` avvisa della mancanza di `read:org`, crea un token che includa
   quello scope e riassegna la variabile:

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org` si applica solo quando ti sei autenticato tramite `gh auth login`
e hai credenziali salvate da aggiornare (non quando usi `GH_TOKEN`).

Non commettere mai token né incollarli in issue o pull request.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Piattaforme](/it/platforms)
