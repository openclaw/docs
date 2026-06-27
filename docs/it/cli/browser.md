---
read_when:
    - Usi `openclaw browser` e vuoi esempi per attività comuni
    - Vuoi controllare un browser in esecuzione su un'altra macchina tramite un host Node
    - Vuoi collegarti al tuo Chrome locale con accesso effettuato tramite Chrome MCP
summary: Riferimento CLI per `openclaw browser` (ciclo di vita, profili, schede, azioni, stato e debugging)
title: Browser
x-i18n:
    generated_at: "2026-06-27T17:18:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

Gestisci la superficie di controllo del browser di OpenClaw ed esegui azioni del browser (ciclo di vita, profili, schede, snapshot, screenshot, navigazione, input, emulazione dello stato e debug).

Correlato:

- Strumento browser + API: [Strumento browser](/it/tools/browser)

## Flag comuni

- `--url <gatewayWsUrl>`: URL WebSocket del Gateway (predefinito dalla configurazione).
- `--token <token>`: token del Gateway (se richiesto).
- `--timeout <ms>`: timeout della richiesta (ms).
- `--expect-final`: attendi una risposta finale del Gateway.
- `--browser-profile <name>`: scegli un profilo browser (predefinito dalla configurazione).
- `--json`: output leggibile da macchina (dove supportato).

## Avvio rapido (locale)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Gli agenti possono eseguire lo stesso controllo di prontezza con `browser({ action: "doctor" })`.

## Risoluzione rapida dei problemi

Se `start` fallisce con `not reachable after start`, risolvi prima la prontezza CDP. Se `start` e `tabs` riescono ma `open` o `navigate` falliscono, il piano di controllo del browser è integro e l'errore di solito riguarda la policy SSRF di navigazione.

Sequenza minima:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Guida dettagliata: [Risoluzione dei problemi del browser](/it/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

Note:

- `doctor --deep` aggiunge una sonda snapshot live. È utile quando la prontezza
  CDP di base è verde ma vuoi una prova che la scheda corrente possa essere ispezionata.
- Per i profili `attachOnly` e CDP remoti, `openclaw browser stop` chiude la
  sessione di controllo attiva e cancella gli override temporanei di emulazione anche quando
  OpenClaw non ha avviato direttamente il processo del browser.
- Per i profili gestiti locali, `openclaw browser stop` arresta il processo del browser
  avviato.
- `openclaw browser start --headless` si applica solo a quella richiesta di avvio e
  solo quando OpenClaw avvia un browser gestito locale. Non riscrive
  `browser.headless` o la configurazione del profilo, ed è un no-op per un browser
  già in esecuzione.
- Sugli host Linux senza `DISPLAY` o `WAYLAND_DISPLAY`, i profili gestiti locali
  vengono eseguiti automaticamente headless a meno che `OPENCLAW_BROWSER_HEADLESS=0`,
  `browser.headless=false` o `browser.profiles.<name>.headless=false`
  richiedano esplicitamente un browser visibile.

## Se il comando manca

Se `openclaw browser` è un comando sconosciuto, controlla `plugins.allow` in
`~/.openclaw/openclaw.json`.

Quando `plugins.allow` è presente, elenca esplicitamente il Plugin browser in bundle
a meno che la configurazione abbia già un blocco radice `browser`:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Un blocco radice `browser` esplicito, ad esempio `browser.enabled=true` o
`browser.profiles.<name>`, attiva anche il Plugin browser in bundle con una
allowlist restrittiva dei Plugin.

Correlato: [Strumento browser](/it/tools/browser#missing-browser-command-or-tool)

## Profili

I profili sono configurazioni denominate di routing del browser. In pratica:

- `openclaw`: avvia o si collega a un'istanza Chrome dedicata gestita da OpenClaw (directory dati utente isolata).
- `user`: controlla la tua sessione Chrome esistente con accesso effettuato tramite Chrome DevTools MCP.
- profili CDP personalizzati: puntano a un endpoint CDP locale o remoto.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

Usa un profilo specifico:

```bash
openclaw browser --browser-profile work tabs
```

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

`tabs` restituisce prima `suggestedTargetId`, poi il `tabId` stabile come `t1`,
l'etichetta facoltativa e il `targetId` grezzo. Gli agenti devono passare
`suggestedTargetId` di nuovo a `focus`, `close`, snapshot e azioni. Puoi
assegnare un'etichetta con `open --label`, `tab new --label` o `tab label`; etichette,
ID scheda, ID target grezzi e prefissi univoci di target-id sono tutti accettati.
Il campo della richiesta si chiama ancora `targetId` per compatibilità, ma accetta
questi riferimenti di scheda. Considera gli ID target grezzi come handle diagnostici, non come memoria
durevole dell'agente.
Quando Chromium sostituisce il target grezzo sottostante durante una navigazione o l'invio di un modulo,
OpenClaw mantiene il `tabId`/l'etichetta stabile collegato alla scheda sostitutiva
quando può dimostrare la corrispondenza. Gli ID target grezzi restano volatili; preferisci
`suggestedTargetId`.

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

Note:

- `--full-page` è solo per acquisizioni di pagina; non può essere combinato con `--ref`
  o `--element`.
- I profili `existing-session` / `user` supportano screenshot di pagina e screenshot `--ref`
  dall'output snapshot, ma non screenshot CSS `--element`.
- `--labels` sovrappone i riferimenti snapshot correnti allo screenshot. Sui
  profili basati su Playwright funziona con `--full-page` (sovrapposizione etichette su pagina intera),
  `--ref` (sovrapposizione etichette su clip elemento per riferimento ARIA) e `--element`
  (sovrapposizione etichette su clip elemento per selettore CSS); nelle modalità clip elemento, le etichette
  sono proiettate relativamente all'elemento. La risposta include anche un array
  `annotations` con il riquadro di delimitazione di ogni riferimento. Ogni elemento ha `ref`,
  `number`, `role`, `name` facoltativo e `box: {x, y, width, height}`;
  le coordinate sono nello spazio dell'immagine acquisita (viewport / pagina intera /
  relativo all'elemento). Il campo viene omesso quando è vuoto.
  I profili `existing-session` renderizzano un overlay chrome-mcp sugli screenshot di pagina
  ma non usano l'helper di proiezione Playwright e non includono
  `annotations`; gli screenshot CSS `--element` non sono supportati lì. Senza
  Playwright o chrome-mcp, gli screenshot etichettati non sono disponibili. Le versioni
  precedenti ignoravano `--full-page`, `--ref` e `--element` sugli screenshot Playwright
  etichettati e restituivano sempre un'acquisizione viewport; ora gli screenshot
  etichettati rispettano tali ambiti.
- `snapshot --urls` aggiunge le destinazioni dei link rilevati agli snapshot AI così
  gli agenti possono scegliere target di navigazione diretti invece di dedurli dal solo testo
  del link.

Naviga/clicca/digita (automazione UI basata su ref):

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

`evaluate --fn` accetta il sorgente di una funzione, un'espressione o il corpo di uno statement.
I corpi statement vengono incapsulati come funzioni async, quindi usa `return` per il valore
che vuoi ricevere. Usa `evaluate --timeout-ms <ms>` quando la funzione lato pagina può
richiedere più tempo del timeout evaluate predefinito.

Le risposte delle azioni restituiscono il `targetId` grezzo corrente dopo una sostituzione della pagina
innescata dall'azione quando OpenClaw può dimostrare la scheda sostitutiva. Gli script devono comunque
memorizzare e passare `suggestedTargetId`/etichette per workflow di lunga durata.

Helper per file + dialoghi:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

I profili Chrome gestiti salvano i download ordinari attivati da clic nella directory
download di OpenClaw (`/tmp/openclaw/downloads` per impostazione predefinita, o la radice temporanea
configurata). Usa `waitfordownload` o `download` quando l'agente deve attendere un
file specifico e restituirne il percorso; quei waiter espliciti possiedono il download successivo.
Gli upload accettano file dalla radice temporanea degli upload di OpenClaw e media inbound
gestiti da OpenClaw, inclusi riferimenti `media://inbound/<id>` e
`media/inbound/<id>` relativi alla sandbox. Riferimenti media annidati, traversal e percorsi
locali arbitrari restano rifiutati.
Quando un'azione apre un dialogo modale, la risposta dell'azione restituisce
`blockedByDialog` con `browserState.dialogs.pending`; passa `--dialog-id` per
rispondere direttamente. I dialoghi gestiti fuori da OpenClaw appaiono sotto
`browserState.dialogs.recent`.

## Stato e archiviazione

Viewport + emulazione:

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

Cookie + storage:

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

Usa il profilo `user` integrato, oppure crea il tuo profilo `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

Il percorso existing-session predefinito è la connessione automatica Chrome MCP solo host. Se il browser è già
in esecuzione con un endpoint DevTools, passa `--cdp-url` così Chrome MCP si collega invece a quell'endpoint.
Per Docker, Browserless o altre configurazioni remote in cui la semantica Chrome MCP non è necessaria, usa un
profilo CDP.

Limiti attuali di existing-session:

- le azioni basate su snapshot usano riferimenti, non selettori CSS
- `browser.actionTimeoutMs` imposta per impostazione predefinita le richieste `act` supportate a 60000 ms quando
  i chiamanti omettono `timeoutMs`; `timeoutMs` per chiamata ha comunque la precedenza.
- `click` è solo clic sinistro
- `type` non supporta `slowly=true`
- `press` non supporta `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ed `evaluate` rifiutano
  le sostituzioni del timeout per chiamata
- `select` supporta un solo valore
- `wait --load networkidle` non è supportato sui profili di sessione esistenti (funziona su CDP gestito e raw/remoto)
- i caricamenti di file richiedono `--ref` / `--input-ref`, non supportano
  `--element` CSS e attualmente supportano un file alla volta
- gli hook di dialogo non supportano `--timeout`
- gli screenshot supportano le acquisizioni della pagina e `--ref`, ma non `--element` CSS
- `responsebody`, l'intercettazione dei download, l'esportazione PDF e le azioni batch richiedono ancora
  un browser gestito o un profilo CDP raw

## Controllo remoto del browser (proxy host Node)

Se il Gateway viene eseguito su una macchina diversa dal browser, esegui un **host Node** sulla macchina che ha Chrome/Brave/Edge/Chromium. Il Gateway inoltrerà tramite proxy le azioni del browser a quel nodo (non è richiesto un server separato per il controllo del browser).

Usa `gateway.nodes.browser.mode` per controllare l'instradamento automatico e `gateway.nodes.browser.node` per fissare un nodo specifico se ne sono connessi più di uno.

Sicurezza + configurazione remota: [Strumento browser](/it/tools/browser), [Accesso remoto](/it/gateway/remote), [Tailscale](/it/gateway/tailscale), [Sicurezza](/it/gateway/security)

## Correlati

- [Riferimento CLI](/it/cli)
- [Browser](/it/tools/browser)
