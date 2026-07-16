---
read_when:
    - Automazione tramite script o debug del browser dell’agente mediante l’API di controllo locale
    - Cerchi il riferimento alla CLI `openclaw browser`
    - Aggiunta di automazione personalizzata del browser con snapshot e riferimenti
summary: API di controllo del browser di OpenClaw, riferimento della CLI e azioni di scripting
title: API di controllo del browser
x-i18n:
    generated_at: "2026-07-16T15:07:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Per configurazione, impostazioni e risoluzione dei problemi, consultare [Browser](/it/tools/browser).
Questa pagina contiene il riferimento per l'API HTTP di controllo locale, la `openclaw browser`
CLI e i modelli di scripting (snapshot, riferimenti, attese, flussi di debug).

## API di controllo (facoltativa)

Solo per le integrazioni locali, il Gateway espone una piccola API HTTP sull'interfaccia di loopback.
Questo server autonomo è facoltativo: impostare la variabile d'ambiente
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` nell'ambiente del servizio Gateway
e riavviare il Gateway affinché gli endpoint HTTP diventino disponibili. Senza
questa variabile, il runtime di controllo del browser continua a funzionare tramite la CLI e
gli strumenti dell'agente, ma nulla resta in ascolto sulla porta di controllo di loopback.

- Stato/avvio/arresto: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Profili: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Schede: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Azioni: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Download: `POST /download`, `POST /wait/download`
- Autorizzazioni: `POST /permissions/grant`
- Debug: `GET /console`, `POST /pdf`
- Debug: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rete: `POST /response/body`
- Stato: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stato: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Impostazioni: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` è il formato aggregato usato internamente dalla CLI per i
sottocomandi `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
per lo scripting diretto, preferire le route specifiche per le singole schede indicate sopra.

Tutti gli endpoint accettano `?profile=<name>`. `POST /start?headless=true` richiede un
avvio headless una tantum per i profili locali gestiti senza modificare la configurazione
persistente del browser; i profili di sola connessione, CDP remoto e sessione esistente rifiutano
questa sostituzione perché OpenClaw non avvia tali processi del browser.

Per gli endpoint delle schede, `targetId` è il nome del campo di compatibilità. È preferibile passare
`suggestedTargetId` da `GET /tabs` o `POST /tabs/open`; sono accettati anche le etichette e gli handle `tabId`
come `t1`. Gli ID target CDP non elaborati e i relativi prefissi univoci
continuano a funzionare, ma sono handle diagnostici volatili.

Se è configurata l'autenticazione del Gateway tramite segreto condiviso, anche le route HTTP del browser richiedono l'autenticazione:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oppure autenticazione HTTP Basic con tale password

Note:

- Questa API autonoma del browser su loopback **non** utilizza le intestazioni di identità
  del proxy attendibile o di Tailscale Serve.
- Se `gateway.auth.mode` è `none` o `trusted-proxy`, queste route del browser su loopback
  non ereditano tali modalità basate sull'identità; mantenerle accessibili solo tramite loopback.

### Contratto degli errori di `/act`

`POST /act` utilizza una risposta di errore strutturata per gli errori di convalida a livello di route e
le violazioni dei criteri:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valori correnti di `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` è mancante o non riconosciuto.
- `ACT_INVALID_REQUEST` (HTTP 400): la normalizzazione o la convalida del payload dell'azione non è riuscita.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` è stato usato con un tipo di azione non supportato.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) è disabilitato dalla configurazione.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): il valore `targetId` di primo livello o aggregato è in conflitto con il target della richiesta.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): l'azione non è supportata per i profili con sessione esistente.

Altri errori di runtime possono comunque restituire `{ "error": "<message>" }` senza un
campo `code`.

### Requisito di Playwright

Alcune funzionalità (navigazione/azione/snapshot AI/snapshot dei ruoli, screenshot degli elementi,
PDF) richiedono Playwright. Se Playwright non è installato, tali endpoint restituiscono
un errore 501 chiaro.

Funzionalità che continuano a operare senza Playwright:

- Snapshot ARIA
- Snapshot di accessibilità in stile ruolo (`--interactive`, `--compact`,
  `--depth`, `--efficient`) quando è disponibile un WebSocket CDP per scheda. Questa è
  un'opzione di ripiego per l'ispezione e l'individuazione dei riferimenti; Playwright rimane il motore
  principale per le azioni.
- Screenshot della pagina per il browser `openclaw` gestito quando è disponibile un WebSocket
  CDP per scheda
- Screenshot della pagina per i profili `existing-session` / Chrome MCP
- Screenshot basati sui riferimenti `existing-session` (`--ref`) dall'output dello snapshot

Funzionalità che richiedono ancora Playwright:

- `navigate`
- `act`
- Snapshot AI che dipendono dal formato di snapshot AI nativo di Playwright
- Screenshot di elementi tramite selettore CSS (`--element`)
- Esportazione PDF completa del browser

Gli screenshot degli elementi rifiutano anche `--full-page`; la route restituisce `fullPage is
not supported for element screenshots`.

Se viene visualizzato `Playwright is not available in this gateway build`, nel
Gateway distribuito manca la dipendenza principale del runtime del browser. Reinstallare o aggiornare
OpenClaw, quindi riavviare il Gateway. Per Docker, installare anche i file binari del browser
Chromium come illustrato di seguito.

#### Installazione di Playwright in Docker

Se il Gateway viene eseguito in Docker, evitare `npx playwright` (conflitti con le sostituzioni npm).
Per le immagini personalizzate, integrare Chromium nell'immagine:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Per un'immagine esistente, eseguire invece l'installazione tramite la CLI inclusa:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Per rendere persistenti i download del browser, impostare `PLAYWRIGHT_BROWSERS_PATH` (ad esempio,
`/home/node/.cache/ms-playwright`) e assicurarsi che `/home/node` venga mantenuto tramite
`OPENCLAW_HOME_VOLUME` o un montaggio associato. OpenClaw rileva automaticamente Chromium
persistente su Linux. Consultare [Docker](/it/install/docker).

## Funzionamento (interno)

Un piccolo server di controllo su loopback accetta le richieste HTTP e si connette ai browser basati su Chromium tramite CDP. Le azioni avanzate (clic/digitazione/snapshot/PDF) passano attraverso Playwright al di sopra di CDP; quando Playwright non è disponibile, sono accessibili solo le operazioni che non lo richiedono. L'agente vede un'unica interfaccia stabile, mentre i browser e i profili locali/remoti possono essere sostituiti liberamente al di sotto di essa.

## Riferimento rapido della CLI

Tutti i comandi accettano `--browser-profile <name>` per selezionare un profilo specifico e `--json` per produrre un output leggibile dalla macchina.

<AccordionGroup>

<Accordion title="Operazioni di base: stato, schede, apertura/selezione/chiusura">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # aggiunge una verifica dello snapshot in tempo reale
openclaw browser start
openclaw browser start --headless # avvio headless una tantum del browser locale gestito
openclaw browser stop            # cancella anche l'emulazione per CDP remoto/di sola connessione
openclaw browser reset-profile   # sposta nel Cestino i dati del browser del profilo
openclaw browser tabs
openclaw browser tab             # scorciatoia per la scheda corrente
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Profili: elenco, creazione, eliminazione">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Ispezione: screenshot, snapshot, console, errori, richieste">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # oppure --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Azioni: navigazione, clic, digitazione, trascinamento, attesa, valutazione">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # oppure e12 per i riferimenti dei ruoli
openclaw browser click-coords 120 340        # coordinate della finestra
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Stato: cookie, archiviazione, modalità offline, intestazioni, geolocalizzazione, dispositivo">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear per rimuovere
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Note:

- Lo strumento `browser` rivolto all'agente espone `action=download` (`ref` e
  `path` obbligatori) e `action=waitfordownload` (`path` facoltativo). Entrambi restituiscono l'URL
  di download salvato, il nome file suggerito e il percorso locale protetto. L'intercettazione esplicita dei download
  è disponibile per i profili Playwright gestiti; i profili con sessione
  esistente restituiscono un errore di operazione non supportata.
- Preferire i caricamenti atomici tramite selettore: passare il trigger `--ref` insieme al caricamento, affinché OpenClaw lo predisponga ed esegua il clic in un'unica richiesta. `upload` con soli percorsi resta supportato quando si intende usare un trigger successivo. Usare `--input-ref` o `--element` per impostare direttamente un input file. `dialog` è una chiamata di predisposizione; eseguirla prima del clic o della pressione che attiva la finestra di dialogo. Se un'azione apre una finestra modale, la risposta dell'azione include `blockedByDialog` e `browserState.dialogs.pending`; passare tale `dialogId` per rispondere direttamente. Le finestre di dialogo gestite al di fuori di OpenClaw vengono visualizzate sotto `browserState.dialogs.recent`.
- `click`/`type`/ecc. richiedono un `ref` proveniente da `snapshot` (`12` numerico, riferimento di ruolo `e12` o riferimento ARIA utilizzabile `ax12`). I selettori CSS non sono intenzionalmente supportati per le azioni. Usare `click-coords` quando la posizione nel viewport visibile è l'unico obiettivo affidabile.
- I percorsi di download e traccia sono limitati alle directory temporanee radice di OpenClaw: `/tmp/openclaw{,/downloads}` (ripiego: `${os.tmpdir()}/openclaw/...`).
- `upload` accetta file dalla directory temporanea radice dei caricamenti di OpenClaw e
  dai contenuti multimediali in ingresso gestiti da OpenClaw. I contenuti multimediali in ingresso gestiti possono essere referenziati come
  `media://inbound/<id>`, come `media/inbound/<id>` relativo alla sandbox o tramite un percorso
  risolto all'interno della directory dei contenuti multimediali in ingresso gestiti. Riferimenti multimediali annidati,
  attraversamento di directory, collegamenti simbolici, collegamenti fisici e percorsi locali arbitrari vengono comunque rifiutati.
- `upload` può anche impostare direttamente gli input file tramite `--input-ref` o `--element`.

Gli ID e le etichette stabili delle schede sopravvivono alla sostituzione dei target grezzi di Chromium quando OpenClaw
può verificare la scheda sostitutiva, ad esempio una coppia univoca precedente/nuova per lo stesso URL oppure
una singola scheda precedente che diventa una singola nuova scheda dopo l'invio di un modulo. Le sostituzioni ambigue
con URL duplicati ricevono nuovi handle. Gli ID dei target grezzi restano
volatili; negli script preferire `suggestedTargetId` da `tabs`.

Panoramica delle opzioni degli snapshot:

- `--format ai` (predefinito con Playwright): snapshot IA con riferimenti numerici (`aria-ref="<n>"`).
- `--format aria`: albero di accessibilità con riferimenti `axN`. Quando Playwright è disponibile, OpenClaw associa i riferimenti con gli ID DOM del backend alla pagina attiva, affinché possano essere usati dalle azioni successive; in caso contrario, considerare l'output utilizzabile solo per l'ispezione.
- `--efficient` (oppure `--mode efficient`): configurazione preimpostata compatta dello snapshot dei ruoli. Impostare `browser.snapshotDefaults.mode: "efficient"` per renderla predefinita (consultare [Configurazione del Gateway](/it/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` impongono uno snapshot dei ruoli con riferimenti `ref=e12`. `--frame "<iframe>"` limita gli snapshot dei ruoli a un iframe.
- Con Playwright, `--labels` aggiunge uno screenshot con le etichette dei riferimenti sovrapposte
  (stampa `MEDIA:<path>`) e un array `annotations` con il riquadro di delimitazione
  di ciascun riferimento. Con `screenshot`, le etichette basate su Playwright funzionano con `--full-page`,
  `--ref` e `--element`; con `snapshot`, lo screenshot associato resta
  limitato al viewport. I profili con sessione esistente/chrome-mcp mostrano etichette sovrapposte negli
  screenshot della pagina, ma non restituiscono `annotations` né usano l'helper di proiezione
  a pagina intera/per riferimento/per elemento di Playwright. Senza Playwright o chrome-mcp,
  gli screenshot con etichette non sono disponibili.
- `--urls` aggiunge le destinazioni dei link rilevati agli snapshot IA.

## Snapshot e riferimenti

OpenClaw supporta due stili di "snapshot":

- **Snapshot IA (riferimenti numerici)**: `openclaw browser snapshot` (predefinito; `--format ai`)
  - Output: uno snapshot testuale che include riferimenti numerici.
  - Azioni: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, il riferimento viene risolto tramite `aria-ref` di Playwright.

- **Snapshot dei ruoli (riferimenti di ruolo come `e12`)**: `openclaw browser snapshot --interactive` (oppure `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: un elenco/albero basato sui ruoli con `[ref=e12]` (e `[nth=1]` facoltativo).
  - Azioni: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, il riferimento viene risolto tramite `getByRole(...)` (più `nth()` per i duplicati).
  - Aggiungere `--labels` per includere uno screenshot con etichette `e12` sovrapposte. Nei
    profili basati su Playwright, ciò restituisce anche i metadati del riquadro di delimitazione per ciascun riferimento
    (`annotations[]`).
  - Aggiungere `--urls` quando il testo del link è ambiguo e l'agente necessita di obiettivi
    di navigazione concreti.

- **Snapshot ARIA (riferimenti ARIA come `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: l'albero di accessibilità sotto forma di nodi strutturati.
  - Azioni: `openclaw browser click ax12` funziona quando il percorso dello snapshot può associare
    il riferimento tramite Playwright e gli ID DOM del backend di Chrome.
- Se Playwright non è disponibile, gli snapshot ARIA possono comunque essere utili per
  l'ispezione, ma i riferimenti potrebbero non essere utilizzabili per le azioni. Creare un nuovo snapshot con `--format ai`
  o `--interactive` quando sono necessari riferimenti utilizzabili per le azioni.
- Verifica Docker per il percorso di ripiego CDP grezzo: `pnpm test:docker:browser-cdp-snapshot`
  avvia Chromium con CDP, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli
  includano gli URL dei link, gli elementi cliccabili promossi dal cursore e i metadati degli iframe.

Comportamento dei riferimenti:

- I riferimenti **non sono stabili tra le navigazioni**; se qualcosa non riesce, eseguire nuovamente `snapshot` e usare un riferimento nuovo.
- `/act` restituisce il `targetId` grezzo corrente dopo una sostituzione attivata da un'azione
  quando può verificare la scheda sostitutiva. Continuare a usare ID ed etichette stabili delle schede per
  i comandi successivi.
- Se lo snapshot dei ruoli è stato acquisito con `--frame`, i riferimenti di ruolo sono limitati a tale iframe fino al successivo snapshot dei ruoli.
- I riferimenti `axN` sconosciuti o obsoleti falliscono immediatamente anziché ricorrere al
  selettore `aria-ref` di Playwright. In tal caso, eseguire un nuovo snapshot nella stessa scheda.

## Attese avanzate

È possibile attendere condizioni diverse dal semplice tempo/testo:

- Attesa dell'URL (glob supportati da Playwright):
  - `openclaw browser wait --url "**/dash"`
- Attesa dello stato di caricamento:
  - `openclaw browser wait --load networkidle`
  - Supportato nei profili `openclaw` gestiti e nei profili CDP grezzi/remoti. I profili che usano il driver `existing-session` (incluso il profilo `user` predefinito) rifiutano `networkidle`; in tali profili usare le attese `--url`, `--text`, un selettore oppure `--fn`.
- Attesa di un predicato JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Attesa che un selettore diventi visibile:
  - `openclaw browser wait "#main"`

Queste condizioni possono essere combinate:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flussi di lavoro per il debug

Quando un'azione non riesce (ad esempio "non visibile", "violazione della modalità rigorosa", "coperto"):

1. `openclaw browser snapshot --interactive`
2. Usare `click <ref>` / `type <ref>` (preferire i riferimenti di ruolo in modalità interattiva)
3. Se continua a non riuscire: `openclaw browser highlight <ref>` per vedere a cosa punta Playwright
4. Se la pagina si comporta in modo anomalo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Per un debug approfondito, registrare una traccia:
   - `openclaw browser trace start`
   - riprodurre il problema
   - `openclaw browser trace stop` (stampa `TRACE:<path>`)

## Output JSON

`--json` è destinato agli script e agli strumenti strutturati.

Esempi:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Gli snapshot dei ruoli in JSON includono `refs` e un piccolo blocco `stats` (righe/caratteri/riferimenti/interattivi), affinché gli strumenti possano valutare le dimensioni e la densità del payload.

## Opzioni di stato e ambiente

Sono utili per i flussi di lavoro che mirano a "far comportare il sito come X":

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Archiviazione: `storage local|session get|set|clear`
- Modalità offline: `set offline on|off`
- Intestazioni: `set headers --headers-json '{"X-Debug":"1"}'` (oppure la forma posizionale `set headers '{"X-Debug":"1"}'`)
- Autenticazione HTTP di base: `set credentials user pass` (oppure `--clear`)
- Geolocalizzazione: `set geo <lat> <lon> --origin "https://example.com"` (oppure `--clear`)
- Contenuti multimediali: `set media dark|light|no-preference|none`
- Fuso orario / impostazioni locali: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (configurazioni preimpostate dei dispositivi Playwright)
  - `set viewport 1280 720`

## Sicurezza e privacy

- Il profilo browser di openclaw può contenere sessioni autenticate; deve essere considerato sensibile.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  eseguono JavaScript arbitrario nel contesto della pagina. La prompt injection può
  influenzarne il comportamento. Disabilitarlo con `browser.evaluateEnabled=false` se non è necessario.
- `openclaw browser evaluate --fn` accetta il sorgente di una funzione, un'espressione o
  il corpo di un'istruzione. I corpi delle istruzioni vengono racchiusi in funzioni asincrone, quindi usare
  `return` per il valore da restituire. Usare `--timeout-ms <ms>` quando la
  funzione lato pagina potrebbe richiedere più tempo del timeout di valutazione predefinito.
- Per gli accessi e le note anti-bot (X/Twitter, ecc.), consultare [Accesso tramite browser + pubblicazione su X/Twitter](/it/tools/browser-login).
- Mantenere privato l'host del Gateway/Node (solo loopback o tailnet).
- Gli endpoint CDP remoti sono potenti; proteggerli e accedervi tramite tunnel.

Esempio di modalità rigorosa (blocca per impostazione predefinita le destinazioni private/interne):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // autorizzazione esatta facoltativa
    },
  },
}
```

## Argomenti correlati

- [Browser](/it/tools/browser) - panoramica, configurazione, profili, sicurezza
- [Accesso tramite browser](/it/tools/browser-login) - accesso ai siti
- [Risoluzione dei problemi del browser su Linux](/it/tools/browser-linux-troubleshooting)
- [Risoluzione dei problemi del browser su WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
