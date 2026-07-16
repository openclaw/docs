---
read_when:
    - Si usa `openclaw browser` e si desiderano esempi per le attività comuni
    - Si desidera controllare un browser in esecuzione su un'altra macchina tramite un host Node
    - Si desidera connettersi all'istanza locale di Chrome con accesso effettuato tramite Chrome MCP
summary: Riferimento CLI per `openclaw browser` (ciclo di vita, profili, schede, azioni, stato e debug)
title: Browser
x-i18n:
    generated_at: "2026-07-16T14:00:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Gestisce la superficie di controllo del browser di OpenClaw ed esegue azioni nel browser: ciclo di vita, profili, schede, snapshot, screenshot, navigazione, input, emulazione dello stato e debug.

Correlato: [Strumento browser](/it/tools/browser)

## Flag comuni

- `--url <gatewayWsUrl>`: URL WebSocket del Gateway (per impostazione predefinita usa la configurazione).
- `--token <token>`: token del Gateway (se richiesto).
- `--timeout <ms>`: timeout della richiesta in ms (valore predefinito: `30000`).
- `--expect-final`: attende una risposta finale del Gateway.
- `--browser-profile <name>`: seleziona un profilo browser (valore predefinito: `openclaw` o `browser.defaultProfile`).
- `--json`: output leggibile dalla macchina (dove supportato). È un'opzione a livello di browser, quindi
  va inserita prima del sottocomando per ottenere una forma non ambigua, ad esempio
  `openclaw browser --json status`. Anche il posizionamento finale, come
  `openclaw browser status --json`, funziona quando il comando figlio selezionato non
  definisce una propria opzione `--json`.

## Avvio rapido (locale)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Gli agenti possono eseguire lo stesso controllo di disponibilità con `browser({ action: "doctor" })`.

## Risoluzione rapida dei problemi

Se `start` non riesce e restituisce `not reachable after start`, verificare innanzitutto la disponibilità di CDP. Se `start` e `tabs` riescono, ma `open` o `navigate` non riesce, il piano di controllo del browser funziona correttamente e l'errore è in genere dovuto a un blocco dei criteri SSRF di navigazione.

Sequenza minima:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Indicazioni dettagliate: [Risoluzione dei problemi del browser](/it/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo di vita

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

- `doctor --deep` aggiunge una verifica tramite snapshot in tempo reale: utile quando il controllo di base della disponibilità CDP dà esito positivo, ma si desidera confermare che sia possibile esaminare la scheda corrente.
- Per un profilo locale gestito in esecuzione, `status` e `doctor` riportano la diagnostica
  grafica memorizzata nella cache da Chrome: classificazione hardware/software, renderer,
  backend, dispositivo/driver, dettagli sulle funzionalità e sullo stato di disattivazione e capacità
  video accelerate. `openclaw browser --json status` restituisce il payload strutturato completo.
  Lo stato passivo non avvia mai Chrome soltanto per raccogliere queste informazioni.
- `stop` chiude la sessione di controllo attiva e cancella le sostituzioni temporanee di emulazione anche per `attachOnly` e per i profili CDP remoti nei quali OpenClaw non ha avviato direttamente il processo del browser. Per i profili locali gestiti, `stop` arresta anche il processo del browser generato.
- `start --headless` si applica solo a quella richiesta di avvio e soltanto quando OpenClaw avvia un browser locale gestito. Non riscrive `browser.headless` né la configurazione del profilo e non ha effetto su un browser già in esecuzione.
- Sugli host Linux privi di `DISPLAY` o `WAYLAND_DISPLAY`, i profili locali gestiti vengono eseguiti automaticamente in modalità headless, a meno che `OPENCLAW_BROWSER_HEADLESS=0`, `browser.headless=false` o `browser.profiles.<name>.headless=false` non richieda esplicitamente un browser visibile.

## Se il comando non è disponibile

Se `openclaw browser` è un comando sconosciuto, controllare `plugins.allow` in `~/.openclaw/openclaw.json`. Quando è presente `plugins.allow`, elencare esplicitamente il Plugin browser incluso, a meno che la configurazione non contenga già un blocco `browser` di primo livello:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Anche un blocco `browser` di primo livello esplicito, ad esempio `browser.enabled=true` o `browser.profiles.<name>`, attiva il Plugin browser incluso in presenza di un elenco restrittivo dei Plugin consentiti.

Correlato: [Strumento browser](/it/tools/browser#missing-browser-command-or-tool)

## Profili

I profili sono configurazioni denominate di instradamento del browser:

- `openclaw` (valore predefinito): avvia o si collega a un'istanza Chrome dedicata gestita da OpenClaw (directory dei dati utente isolata).
- `user`: controlla la sessione Chrome esistente con accesso già effettuato tramite Chrome DevTools MCP.
- profili CDP personalizzati: puntano a un endpoint CDP locale o remoto.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Utilizzare un profilo specifico con `--browser-profile <name>` in qualsiasi sottocomando, ad esempio `openclaw browser --browser-profile work tabs`.

Su macOS, `system-profiles` elenca i profili reali di Chrome, Brave, Edge o Chromium disponibili sull'host. `import-profile` ne decrittografa i cookie dopo un'unica richiesta di consenso del Portachiavi macOS/Touch ID e li inserisce in un nuovo profilo gestito da OpenClaw. Importa soltanto i cookie; l'archiviazione locale e IndexedDB restano invariati. Alcune sessioni Google utilizzano credenziali di sessione associate al dispositivo (DBSC) e possono comunque richiedere una nuova autenticazione dopo l'importazione.

Quando l'app macOS utilizza un Gateway locale, può proporre una sola volta questa importazione e rendere il profilo importato isolato quello predefinito per la navigazione degli agenti. L'importazione richiede sempre un clic esplicito; un'importazione riuscita o il rifiuto della richiesta impediscono la visualizzazione di ulteriori richieste automatiche, mentre **Settings → General → Browser login** resta disponibile per effettuare nuovamente l'importazione.

L'importazione dei profili di sistema è abilitata per impostazione predefinita. Impostare `browser.allowSystemProfileImport=false` per disabilitare sia le importazioni dalla CLI sia quelle avviate dagli agenti. L'importazione è locale all'host e non può essere eseguita tramite il proxy del Node del browser.

## Schede

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` restituisce prima `suggestedTargetId`, quindi l'elemento stabile `tabId` (come `t1`), l'etichetta facoltativa e il valore `targetId` non elaborato. Passare nuovamente `suggestedTargetId` a `focus`, `close`, agli snapshot e alle azioni. Assegnare un'etichetta con `open --label`, `tab new --label` o `tab label`; sono accettati etichette, ID delle schede, ID di destinazione non elaborati e prefissi univoci degli ID di destinazione. Per compatibilità, il campo della richiesta è ancora denominato `targetId`, ma accetta qualsiasi riferimento di scheda tra questi.

Gli ID di destinazione non elaborati sono handle diagnostici temporanei, non memoria persistente dell'agente: quando Chromium sostituisce la destinazione non elaborata sottostante durante una navigazione o l'invio di un modulo, OpenClaw mantiene l'elemento stabile `tabId`/l'etichetta associato alla scheda sostitutiva quando può verificarne la corrispondenza. Preferire `suggestedTargetId`.

## Snapshot / screenshot / azioni

Snapshot:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

- `--full-page` è destinato esclusivamente alle acquisizioni della pagina; non può essere combinato con `--ref` o `--element`.
- I profili `existing-session` / `user` supportano gli screenshot della pagina e gli screenshot `--ref` dall'output dello snapshot, ma non gli screenshot CSS `--element`.
- `--labels` sovrappone allo screenshot i riferimenti dello snapshot corrente. Nei profili basati su Playwright funziona con `--full-page` (sovrapposizione sull'intera pagina), `--ref` (sovrapposizione ritagliata sull'elemento tramite riferimento ARIA) e `--element` (sovrapposizione ritagliata sull'elemento tramite selettore CSS); nelle modalità con ritaglio dell'elemento, le etichette vengono proiettate rispetto all'elemento. La risposta include inoltre un array `annotations` (omesso se vuoto) con il rettangolo di delimitazione di ciascun riferimento: `ref`, `number`, `role`, `name` facoltativo e `box: {x, y, width, height}` nello spazio delle coordinate dell'immagine acquisita (viewport / pagina intera / relativo all'elemento).
  I profili `existing-session` visualizzano una sovrapposizione chrome-mcp negli screenshot della pagina, ma non utilizzano l'helper di proiezione Playwright e non includono `annotations`; gli screenshot CSS `--element` non sono supportati. Senza Playwright o chrome-mcp, gli screenshot con etichette non sono disponibili.
- `snapshot --urls` aggiunge agli snapshot per l'IA le destinazioni dei collegamenti individuati, in modo che gli agenti possano selezionare destinazioni di navigazione dirette anziché dedurle soltanto dal testo dei collegamenti.

Navigazione/clic/digitazione (automazione dell'interfaccia basata su riferimenti):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` accetta il codice sorgente di una funzione, un'espressione o il corpo di un'istruzione. I corpi delle istruzioni vengono racchiusi in funzioni asincrone; utilizzare quindi `return` per il valore da restituire. Utilizzare `--timeout-ms` quando la funzione eseguita nella pagina può richiedere più tempo del timeout di valutazione predefinito. `browser.evaluateEnabled=false` (valore predefinito: `true`) disabilita sia `evaluate` sia `wait --fn`.

Le risposte delle azioni restituiscono il valore `targetId` non elaborato corrente dopo una sostituzione della pagina provocata dall'azione, quando OpenClaw può verificare la scheda sostitutiva. Gli script devono comunque memorizzare e passare `suggestedTargetId`/le etichette per i flussi di lavoro di lunga durata.

Helper per file e finestre di dialogo:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

I profili Chrome gestiti salvano i normali download attivati tramite clic nella directory dei download di OpenClaw (`/tmp/openclaw/downloads` per impostazione predefinita o la radice temporanea configurata). Utilizzare `waitfordownload` o `download` quando l'agente deve attendere un file specifico e restituirne il percorso; questi meccanismi di attesa espliciti acquisiscono il download successivo. I caricamenti accettano file dalla radice temporanea dei caricamenti di OpenClaw e dai contenuti multimediali in ingresso gestiti da OpenClaw, inclusi i riferimenti `media://inbound/<id>` e `media/inbound/<id>` relativi alla sandbox. I riferimenti multimediali nidificati, l'attraversamento delle directory e i percorsi locali arbitrari vengono rifiutati.

Quando un'azione apre una finestra di dialogo modale, la risposta dell'azione restituisce `blockedByDialog` con `browserState.dialogs.pending`; passare `--dialog-id` per rispondervi direttamente. Le finestre di dialogo gestite al di fuori di OpenClaw sono indicate in `browserState.dialogs.recent`.

## Stato e archiviazione

Viewport ed emulazione:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

Cookie + archiviazione:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## Debug

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome esistente tramite MCP

Usare il profilo `user` integrato oppure creare un profilo `existing-session` personalizzato:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Il percorso predefinito per le sessioni esistenti è la connessione automatica a Chrome MCP solo sull'host. Se il browser è già in esecuzione con un endpoint DevTools, passare `--cdp-url` affinché Chrome MCP si colleghi a tale endpoint. Per Docker, Browserless o altre configurazioni remote in cui la semantica di Chrome MCP non è necessaria, usare invece un profilo CDP.

Limiti attuali delle sessioni esistenti:

- Le azioni basate su snapshot usano riferimenti, non selettori CSS.
- `browser.actionTimeoutMs` imposta per impostazione predefinita a 60000 ms le richieste `act` supportate quando i chiamanti omettono `timeoutMs`; il valore `timeoutMs` specificato per la singola chiamata ha comunque la precedenza.
- `click` supporta solo il clic con il pulsante sinistro.
- `type` non supporta `slowly=true`.
- `press` non supporta `delayMs`.
- `hover`, `scrollintoview`, `drag`, `select` e `fill` rifiutano le sostituzioni del timeout per singola chiamata; `evaluate` accetta `--timeout-ms`.
- `select` supporta un solo valore.
- `wait --load networkidle` non è supportato (funziona con i profili gestiti e CDP non elaborati/remoti).
- I caricamenti di file richiedono `--ref` / `--input-ref`, non supportano `--element` CSS e supportano un solo file alla volta.
- Gli hook delle finestre di dialogo non supportano `--timeout`.
- Gli screenshot supportano le acquisizioni di pagina e `--ref`, ma non `--element` CSS.
- `responsebody`, l'intercettazione dei download, l'esportazione PDF e le azioni in batch richiedono ancora un browser gestito o un profilo CDP non elaborato.

## Controllo remoto del browser (proxy dell'host Node)

Se il Gateway viene eseguito su una macchina diversa da quella del browser, eseguire un **host Node** sulla macchina su cui è installato Chrome/Brave/Edge/Chromium. Il Gateway inoltra le azioni del browser a tale Node; non è necessario un server separato per il controllo del browser.

Usare `gateway.nodes.browser.mode` per controllare l'instradamento automatico e `gateway.nodes.browser.node` per vincolare uno specifico Node se ne sono connessi più di uno.

Sicurezza + configurazione remota: [Strumento browser](/it/tools/browser), [Accesso remoto](/it/gateway/remote), [Tailscale](/it/gateway/tailscale), [Sicurezza](/it/gateway/security)

## Contenuti correlati

- [Riferimento CLI](/it/cli)
- [Browser](/it/tools/browser)
