---
read_when:
    - Installazione di OpenClaw su Windows
    - Scegliere tra Windows Hub, Windows nativo e WSL2
    - Configurazione dell'app complementare per Windows o della modalità nodo Windows
summary: 'Supporto per Windows: Hub Windows, CLI e Gateway nativi, configurazione del Gateway WSL2, modalità Node e risoluzione dei problemi'
title: Windows
x-i18n:
    generated_at: "2026-06-27T17:46:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7c7bde33f27bce6c1136ccf688547ee82750d317a997c4a45b354c52ae1b690
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw include un'app companion nativa **Windows Hub** più il supporto CLI per Windows.
Usa Windows Hub quando vuoi un'app desktop con configurazione, stato nella tray, chat,
diagnostica del Centro comandi e funzionalità di nodo Windows. Usa l'installer PowerShell
quando vuoi direttamente la CLI/Gateway. Usa WSL2 quando vuoi il runtime Gateway
più compatibile con Linux.

## Consigliato: Windows Hub

Windows Hub è l'app companion nativa WinUI per Windows 10 20H2+ e Windows 11. Si installa senza privilegi di amministratore ed è pubblicata con installer
x64 e ARM64 firmati nelle release di OpenClaw.

Scarica l'ultimo installer stabile dalla [pagina delle release di OpenClaw](https://github.com/openclaw/openclaw/releases):

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-Setup-arm64.exe)
- [Checksum](https://github.com/openclaw/openclaw/releases/download/v2026.6.5/OpenClawCompanion-SHA256SUMS.txt)

Se un link di download sopra restituisce un 404, visita la [pagina delle release](https://github.com/openclaw/openclaw/releases) e cerca gli asset `OpenClawCompanion-Setup-*` nell'ultima release.

Dopo l'installazione, avvia **OpenClaw Companion** dal menu Start o dalla tray di sistema.
L'installer aggiunge anche scorciatoie per Configurazione Gateway, Chat, Impostazioni,
Verifica aggiornamenti e disinstallazione.

### Cosa include Windows Hub

- stato nella tray di sistema e avvio all'accesso
- configurazione al primo avvio per un Gateway WSL locale di proprietà dell'app
- impostazioni di connessione per Gateway locali, remoti e con tunnel SSH
- finestra chat nativa più accesso alla Control UI del browser
- diagnostica del Centro comandi per sessioni, utilizzo, canali, nodi, associazione e
  comandi di riparazione
- modalità nodo Windows per canvas controllato dall'agente, schermo, fotocamera, notifiche,
  stato del dispositivo, sintesi vocale, riconoscimento vocale e `system.run` controllato
- modalità server MCP locale per client MCP come Claude Desktop, Claude Code e
  Cursor

### Primo avvio

Al primo avvio, Windows Hub apre la configurazione quando non esiste un Gateway salvato utilizzabile.
Il percorso più rapido è **Configura localmente**, che crea una distro WSL
`OpenClawGateway` di proprietà dell'app, installa il Gateway al suo interno e associa l'app.
Questo non esporta né modifica la tua distro Ubuntu esistente.

Scegli **Configurazione avanzata** oppure apri la scheda Connessioni quando hai già un
Gateway. Puoi connetterti a:

- un Gateway locale su questo PC
- un Gateway WSL su questo PC
- un Gateway remoto tramite URL e token o codice di configurazione
- un Gateway raggiunto tramite tunnel SSH

Al termine della configurazione, l'icona nella tray diventa verde. Apri **Centro comandi** dalla
tray per confermare connessione, associazione, stato del nodo e salute del canale.

## Modalità nodo Windows

Windows Hub può registrarsi come nodo OpenClaw di prima classe. L'agente può quindi usare
le funzionalità native di Windows dichiarate tramite il Gateway.

I comandi comuni includono:

- `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`,
  `canvas.snapshot`
- `screen.snapshot` e, con consenso esplicito, `screen.record`
- `camera.list` e, con consenso esplicito, `camera.snap`, `camera.clip`
- `system.notify`, `system.run`, `system.run.prepare`, `system.which`
- `location.get`, `device.info`, `device.status`
- `stt.transcribe`, `tts.speak`

La modalità nodo richiede l'associazione al Gateway. Se l'app mostra una richiesta di associazione, approvala
dall'host Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
openclaw nodes status
```

Il Gateway inoltra solo i comandi dichiarati dal nodo e consentiti dalla policy del server.
I comandi sensibili per la privacy come `screen.record`, `camera.snap` e
`camera.clip` richiedono un consenso esplicito in `gateway.nodes.allowCommands`.

## Modalità MCP locale

Windows Hub può esporre lo stesso registro di funzionalità native di Windows come server MCP locale
su loopback. È utile quando vuoi che client MCP locali controllino
funzionalità Windows senza un Gateway OpenClaw in esecuzione.

Abilitalo nelle Impostazioni di Windows Hub nella sezione sviluppatore/avanzata. L'app
mostra l'endpoint loopback e il bearer token dopo l'abilitazione del server.

Matrice delle modalità:

| Modalità nodo | Server MCP | Comportamento                           |
| --------- | ---------- | ---------------------------------- |
| disattiva       | disattivo        | App desktop solo operatore          |
| attiva        | disattivo        | Nodo Windows connesso al Gateway     |
| disattiva       | attivo         | Solo server MCP locale              |
| attiva        | attivo         | Nodo Gateway più server MCP locale |

## CLI e Gateway nativi per Windows

Per un uso orientato al terminale, installa OpenClaw da PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verifica:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

I flussi CLI e Gateway nativi per Windows sono supportati e continuano a migliorare.
L'avvio gestito usa le Attività pianificate di Windows quando disponibili. L'attività mantiene lo
script leggibile `gateway.cmd` nella directory di stato di OpenClaw, ma lo avvia tramite
un wrapper WScript `gateway.vbs` generato, così il Gateway in background non apre
una finestra console visibile. Se la creazione dell'attività viene negata, OpenClaw ripiega su un
elemento di accesso nella cartella Esecuzione automatica per utente.

Per installare il servizio Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Se vuoi usare solo la CLI senza un servizio Gateway gestito:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 rimane il runtime Gateway più compatibile con Linux su Windows. Windows Hub
può configurare per te un Gateway WSL di proprietà dell'app, oppure puoi installarlo manualmente nella
tua distro.

Configurazione manuale:

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Abilita systemd dentro WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Riavvia WSL da PowerShell:

```powershell
wsl --shutdown
```

Poi installa OpenClaw dentro WSL con il quickstart Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Avvio automatico del Gateway prima dell'accesso a Windows

Per configurazioni WSL headless, assicurati che l'intera catena di avvio venga eseguita anche quando nessuno accede
a Windows.

Dentro WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

In PowerShell come amministratore:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Sostituisci `Ubuntu` con il nome della tua distro da:

```powershell
wsl --list --verbose
```

> **Nota:** Due modifiche rispetto alle ricette precedenti:
>
> - **`dbus-launch true` invece di `/bin/true`** — Su WSL ≥ 2.6.1.0 una regressione ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416)) fa sì che la distro venga terminata per inattività 15-20 secondi dopo l'uscita dell'ultimo client, anche con linger abilitato. `dbus-launch true` mantiene vivo un processo figlio di init come soluzione alternativa ([discussione della community, microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
> - **`/ru "$env:USERNAME"` invece di `/ru SYSTEM`** — Le distro WSL per utente (la configurazione predefinita) non sono visibili all'account SYSTEM; l'attività sembra eseguirsi, ma la distro non viene mai avviata. L'esecuzione con il tuo account evita questo problema. Windows chiederà la tua password quando l'attività viene creata.

Dopo il riavvio, verifica da WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Esporre servizi WSL sulla LAN

WSL ha una propria rete virtuale. Se un'altra macchina deve raggiungere un servizio dentro
WSL, inoltra una porta Windows all'IP WSL corrente. L'IP WSL può cambiare dopo
i riavvii, quindi aggiorna la regola di inoltro quando necessario.

Esempio in PowerShell come amministratore:

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort

New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Note:

- SSH da un'altra macchina usa come destinazione l'IP dell'host Windows, per esempio
  `ssh user@windows-host -p 2222`.
- I nodi remoti devono puntare a un URL Gateway raggiungibile, non a `127.0.0.1`.
- Usa `listenaddress=0.0.0.0` per l'accesso LAN. Usa `127.0.0.1` per l'accesso solo locale.

## Risoluzione dei problemi

### L'icona nella tray non appare

Controlla Gestione attività per `OpenClaw.Tray.WinUI.exe`. Se è in esecuzione, apri l'area
delle icone nascoste della tray e fissala. Se non è in esecuzione, avvia **OpenClaw
Companion** dal menu Start.

### La configurazione locale non riesce

Apri il log di configurazione da Windows Hub oppure controlla:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Le cause comuni sono WSL disabilitato, virtualizzazione bloccata, stato WSL di proprietà dell'app
obsoleto o un errore di rete durante l'installazione del pacchetto Gateway.

### L'app dice che è richiesta l'associazione

Approva la richiesta dell'operatore o del nodo dal Gateway:

```powershell
openclaw devices list
openclaw devices approve <request-id>
```

Se il dispositivo aveva già un token, riconnettiti dalla scheda Connessioni dopo
l'approvazione.

### La chat web non riesce a raggiungere un Gateway remoto

La chat web remota richiede HTTPS o localhost. Per certificati autofirmati, considera attendibile
il certificato in Windows oppure usa un tunnel SSH verso un URL localhost.

### `screen.snapshot`, fotocamera o comandi audio non riescono

Conferma le autorizzazioni Windows per fotocamera, microfono, acquisizione dello schermo e
notifiche. Le installazioni pacchettizzate dichiarano le funzionalità protette, ma Windows
potrebbe comunque mostrare una richiesta la prima volta che un comando le usa.

### La connettività Git o GitHub non riesce

Alcune reti bloccano o limitano HTTPS verso GitHub. Se `git clone` o `gh auth
login` non riesce, prova un'altra rete, una VPN o un proxy HTTP/HTTPS.

Per autenticazione `gh` basata su token nella sessione corrente:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Non commettere mai token né incollarli in issue o pull request.

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Configurazione di Node.js](/it/install/node)
- [Nodi](/it/nodes)
- [Control UI](/it/web/control-ui)
- [Configurazione Gateway](/it/gateway/configuration)
