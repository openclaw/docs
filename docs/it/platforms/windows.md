---
read_when:
    - Installazione di OpenClaw su Windows
    - Scegliere tra Windows Hub, Windows nativo e WSL2
    - Configurazione dell'app complementare per Windows o della modalità Node per Windows
summary: 'Supporto per Windows: Windows Hub, CLI e Gateway nativi, configurazione del Gateway in WSL2, modalità Node e risoluzione dei problemi'
title: Windows
x-i18n:
    generated_at: "2026-07-16T14:40:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f1a756d3af3898f211c27c34e16bbcc08f71e214ca1e0d5680c15a091ae1c2ca
    source_path: platforms/windows.md
    workflow: 16
---

OpenClaw include un'app complementare nativa **Windows Hub** oltre al supporto della CLI su Windows.
Usare Windows Hub per disporre di un'app desktop con configurazione, stato nell'area di notifica, chat, diagnostica di Command
Center e funzionalità del Node Windows. Usare il programma di installazione PowerShell
direttamente per la CLI/Gateway. Usare WSL2 per il runtime Gateway più
compatibile con Linux.

## Consigliato: Windows Hub

Windows Hub è l'app complementare WinUI nativa per Windows 10 20H2+ e
Windows 11. Si installa senza privilegi di amministratore e distribuisce programmi di installazione x64
e ARM64 firmati dalla propria pagina delle release.

Windows Hub viene pubblicato indipendentemente dalla CLI e dal Gateway di OpenClaw. Scaricare
il programma di installazione stabile più recente di Hub dalla
[pagina delle release di Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases/latest)
oppure direttamente tramite `releases/latest/download`:

- [OpenClawCompanion-Setup-x64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-x64.exe)
- [OpenClawCompanion-Setup-arm64.exe](https://github.com/openclaw/openclaw-windows-node/releases/latest/download/OpenClawCompanion-Setup-arm64.exe)

Se uno dei collegamenti precedenti restituisce un errore 404, visitare la [pagina delle release di Windows Hub](https://github.com/openclaw/openclaw-windows-node/releases)
e aprire la release stabile più recente di Windows Hub. Anche le normali release stabili di OpenClaw
includono una copia di una build di Windows Hub associata a una versione specifica e convalidata per la release; tale copia può essere meno recente
rispetto a una nuova release autonoma di Hub.

Dopo l'installazione, avviare **OpenClaw Companion** dal menu Start o dall'area
di notifica. Il programma di installazione aggiunge anche collegamenti per Gateway Setup, Chat, Settings,
Check for Updates e la disinstallazione.

### Contenuto di Windows Hub

- Stato nell'area di notifica e avvio all'accesso.
- Configurazione iniziale di un Gateway WSL locale gestito dall'app.
- Impostazioni di connessione per Gateway locali, remoti e tramite tunnel SSH.
- Finestra di chat nativa e accesso alla Control UI nel browser.
- Diagnostica di Command Center per sessioni, utilizzo, canali, Node, associazione
  e comandi di riparazione.
- Modalità Node Windows per canvas, schermo, fotocamera,
  notifiche, stato del dispositivo, conversazione e `system.run` controllato dall'agente.
- Modalità server MCP locale per client MCP come Claude Desktop, Claude Code
  e Cursor.

### Primo avvio

Al primo avvio, Windows Hub apre la configurazione se non è disponibile alcun
Gateway salvato utilizzabile. Il percorso più rapido è **Set up locally**, che predispone una
distribuzione WSL `OpenClawGateway` gestita dall'app, vi installa il Gateway e
associa l'app. Questa operazione non esporta né modifica la distribuzione Ubuntu esistente.

Scegliere **Advanced setup** oppure aprire la scheda Connections se è già disponibile un
Gateway. È possibile connettersi a:

- un Gateway locale su questo PC
- un Gateway WSL su questo PC
- un Gateway remoto tramite URL e token o codice di configurazione
- un Gateway raggiunto attraverso un tunnel SSH

Al termine della configurazione, l'icona nell'area di notifica diventa verde. Aprire **Command Center**
dall'area di notifica per verificare la connessione, l'associazione, lo stato del Node e l'integrità dei canali.

## Modalità Node Windows

Windows Hub può registrarsi come Node OpenClaw affinché l'agente possa utilizzare le funzionalità
native di Windows dichiarate attraverso il Gateway. Prima dell'esecuzione, i comandi del Node devono essere
dichiarati dal Node e consentiti dai criteri del Gateway; consultare
[Node](/it/nodes#command-policy) per il modello completo di autorizzazione e negazione.

Comandi comuni:

| Famiglia | Comandi                                                                             |
| ------ | ------------------------------------------------------------------------------------ |
| Canvas | `canvas.present`, `canvas.hide`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot` |
| Schermo | `screen.snapshot`; `screen.record` richiede un consenso esplicito                          |
| Fotocamera | `camera.list`; `camera.snap`, `camera.clip` richiedono un consenso esplicito                  |
| Sistema | `system.notify`, `system.run`, `system.run.prepare`, `system.which`                  |
| Dispositivo | `location.get`, `device.info`, `device.status`                                       |
| Conversazione   | `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`, `talk.speak`  |

La modalità Node richiede l'associazione al Gateway. Se l'app mostra una richiesta di associazione,
approvarla dall'host del Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Il Gateway inoltra soltanto i comandi dichiarati dal Node e consentiti dai
criteri del server. I comandi sensibili alla privacy, come `screen.record`, `camera.snap`
e `camera.clip`, richiedono un consenso `gateway.nodes.allowCommands` esplicito.

## Modalità MCP locale

Windows Hub può esporre lo stesso registro delle funzionalità native di Windows come server
MCP locale sull'interfaccia di loopback, consentendo ai client MCP locali di controllare le funzionalità di Windows
senza un Gateway OpenClaw in esecuzione.

Abilitarlo nelle Settings di Windows Hub, nella sezione developer/advanced. Una volta abilitato il server,
l'app mostra l'endpoint di loopback e il bearer token.

Matrice delle modalità:

| Modalità Node | Server MCP | Comportamento                           |
| --------- | ---------- | ---------------------------------- |
| disattivata       | disattivato        | App desktop riservata all'operatore          |
| attivata        | disattivato        | Node Windows connesso al Gateway     |
| disattivata       | attivato         | Solo server MCP locale              |
| attivata        | attivato         | Node Gateway e server MCP locale |

## CLI e Gateway nativi per Windows

Per l'uso principalmente da terminale, installare OpenClaw da PowerShell:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

Verificare:

```powershell
openclaw --version
openclaw doctor
openclaw gateway status --json
```

Quando disponibili, le attività pianificate di Windows gestiscono l'avvio. L'attività conserva
lo script leggibile `gateway.cmd` nella directory di stato di OpenClaw, ma lo avvia
attraverso un wrapper WScript `gateway.vbs` generato, evitando che il Gateway in background
apra una finestra della console visibile. Se la creazione dell'attività viene negata, OpenClaw
utilizza come soluzione alternativa un elemento di accesso per utente nella cartella Esecuzione automatica.

Installare il servizio Gateway:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Per utilizzare soltanto la CLI senza un servizio Gateway gestito:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

## Gateway WSL2

WSL2 rimane il runtime Gateway più compatibile con Linux su Windows. Windows
Hub può configurare automaticamente un Gateway WSL gestito dall'app oppure è possibile installarlo manualmente
nella propria distribuzione.

Configurazione manuale:

```powershell
wsl --install
# Oppure scegliere esplicitamente una distribuzione:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Abilitare systemd in WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Riavviare WSL da PowerShell:

```powershell
wsl --shutdown
```

Quindi installare OpenClaw in WSL seguendo la guida introduttiva di Linux:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw gateway status
```

## Avvio automatico del Gateway prima dell'accesso a Windows

Per le configurazioni WSL headless, assicurarsi che l'intera sequenza di avvio venga eseguita anche quando nessuno
accede a Windows.

In WSL:

```bash
sudo apt-get install -y dbus-x11
sudo loginctl enable-linger "$(whoami)"
openclaw gateway install
```

In PowerShell come amministratore:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec dbus-launch true" /sc onstart /ru "$env:USERNAME"
```

Sostituire `Ubuntu` con il nome della distribuzione ottenuto da:

```powershell
wsl --list --verbose
```

<Note>
Due modifiche rispetto alle procedure precedenti:

- **`dbus-launch true` anziché `/bin/true`**: su WSL >= 2.6.1.0 una
  regressione ([microsoft/WSL #13416](https://github.com/microsoft/WSL/issues/13416))
  termina la distribuzione per inattività 15-20 secondi dopo l'uscita dell'ultimo client, anche
  con la permanenza abilitata. `dbus-launch true` mantiene attivo un processo figlio di init
  come soluzione temporanea (discussione della community, [microsoft/WSL #9245](https://github.com/microsoft/WSL/discussions/9245)).
- **`/ru "$env:USERNAME"` anziché `/ru SYSTEM`**: le distribuzioni WSL per utente, ovvero la
  configurazione predefinita, non sono visibili all'account SYSTEM, quindi l'attività sembra
  essere eseguita, ma la distribuzione non si avvia mai. L'esecuzione con il proprio account evita
  questo problema; Windows richiede la password durante la creazione dell'attività.

</Note>

Dopo il riavvio, verificare da WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Esposizione dei servizi WSL sulla LAN

WSL dispone di una propria rete virtuale. Se un altro computer deve raggiungere un servizio
all'interno di WSL, inoltrare una porta di Windows all'indirizzo IP WSL corrente. L'indirizzo IP WSL può
cambiare dopo i riavvii, quindi aggiornare la regola di inoltro quando necessario.

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

- Per la connessione SSH da un altro computer si utilizza l'indirizzo IP dell'host Windows, ad esempio `ssh user@windows-host -p 2222`.
- I Node remoti devono puntare a un URL del Gateway raggiungibile, non a `127.0.0.1`.
- Usare `listenaddress=0.0.0.0` per l'accesso dalla LAN, `127.0.0.1` per l'accesso esclusivamente locale.

## Risoluzione dei problemi

### L'icona nell'area di notifica non viene visualizzata

Cercare `OpenClaw.Tray.WinUI.exe` in Task Manager. Se è in esecuzione, aprire l'area
delle icone nascoste e aggiungerla alle icone fisse. In caso contrario, avviare **OpenClaw Companion** dal
menu Start.

### La configurazione locale non riesce

Aprire il registro della configurazione da Windows Hub oppure esaminare:

```powershell
notepad "$env:LOCALAPPDATA\OpenClawTray\Logs\Setup\easy-setup-latest.txt"
```

Cause comuni: WSL disabilitato, virtualizzazione bloccata, stato WSL gestito dall'app
obsoleto oppure errore di rete durante l'installazione del pacchetto Gateway.

### L'app indica che è richiesta l'associazione

Approvare la richiesta dell'operatore o del Node dal Gateway:

```powershell
openclaw devices list
openclaw devices approve <requestId>
```

Se il dispositivo disponeva già di un token, riconnettersi dalla scheda Connections dopo
l'approvazione.

### La chat Web non riesce a raggiungere un Gateway remoto

La chat Web remota richiede HTTPS o localhost. Per i certificati autofirmati, considerare attendibile
il certificato in Windows oppure utilizzare un tunnel SSH verso un URL localhost.

### I comandi `screen.snapshot`, della fotocamera o audio non riescono

Verificare le autorizzazioni di Windows per fotocamera, microfono, acquisizione dello schermo e
notifiche. Le installazioni in pacchetto dichiarano le funzionalità protette, ma
Windows potrebbe comunque richiedere il consenso al primo utilizzo da parte di un comando.

### La connettività a Git o GitHub non funziona

Alcune reti bloccano o limitano HTTPS verso GitHub. Se `git clone` o
`gh auth login` non riesce, provare un'altra rete, una VPN oppure un proxy HTTP/HTTPS.

Per l'autenticazione `gh` basata su token nella sessione corrente:

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

Non eseguire mai il commit dei token né incollarli in issue o pull request.

## Argomenti correlati

- [Panoramica dell'installazione](/it/install)
- [Configurazione di Node.js](/it/install/node)
- [Node](/it/nodes)
- [Control UI](/it/web/control-ui)
- [Configurazione del Gateway](/it/gateway/configuration)
