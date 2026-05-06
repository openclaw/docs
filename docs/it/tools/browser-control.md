---
read_when:
    - Creazione di script o debug del browser dell'agente tramite l'API di controllo locale
    - Cerchi il riferimento CLI `openclaw browser`
    - Aggiungere automazione del browser personalizzata con istantanee e riferimenti
summary: API di controllo del browser di OpenClaw, riferimento CLI e azioni di scripting
title: API di controllo del browser
x-i18n:
    generated_at: "2026-05-06T09:10:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5367561122448fa21037c9125581eb38b7f01413310e9f9ca5880942acfffa5d
    source_path: tools/browser-control.md
    workflow: 16
---

Per configurazione, configurazione avanzata e risoluzione dei problemi, consulta [Browser](/it/tools/browser).
Questa pagina è il riferimento per l'API HTTP di controllo locale, la CLI `openclaw browser`
e i modelli di scripting (snapshot, ref, attese, flussi di debug).

## API di controllo (opzionale)

Solo per integrazioni locali, il Gateway espone una piccola API HTTP di loopback:

- Stato/avvio/arresto: `GET /`, `POST /start`, `POST /stop`
- Schede: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Azioni: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Download: `POST /download`, `POST /wait/download`
- Autorizzazioni: `POST /permissions/grant`
- Debug: `GET /console`, `POST /pdf`
- Debug: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rete: `POST /response/body`
- Stato: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stato: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Impostazioni: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tutti gli endpoint accettano `?profile=<name>`. `POST /start?headless=true` richiede un
avvio headless monouso per i profili gestiti locali senza modificare la configurazione
persistente del browser; i profili attach-only, CDP remoti e sessioni esistenti rifiutano
questa sovrascrittura perché OpenClaw non avvia quei processi browser.

Se è configurata l'autenticazione del Gateway con segreto condiviso, anche le route HTTP del browser richiedono autenticazione:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oppure autenticazione HTTP Basic con quella password

Note:

- Questa API browser loopback autonoma **non** consuma gli header di identità di trusted-proxy o
  Tailscale Serve.
- Se `gateway.auth.mode` è `none` o `trusted-proxy`, queste route browser loopback
  non ereditano tali modalità che trasportano identità; mantienile solo su loopback.

### Contratto di errore di `/act`

`POST /act` usa una risposta di errore strutturata per la validazione a livello di route e
per gli errori di policy:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valori `code` correnti:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` mancante o non riconosciuto.
- `ACT_INVALID_REQUEST` (HTTP 400): normalizzazione o validazione del payload dell'azione non riuscita.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` è stato usato con un tipo di azione non supportato.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) è disabilitato dalla configurazione.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` di primo livello o in batch è in conflitto con il target della richiesta.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): l'azione non è supportata per profili di sessione esistente.

Altri errori di runtime possono comunque restituire `{ "error": "<message>" }` senza un
campo `code`.

### Requisito Playwright

Alcune funzionalità (navigate/act/snapshot AI/snapshot di ruolo, screenshot di elementi,
PDF) richiedono Playwright. Se Playwright non è installato, questi endpoint restituiscono
un errore 501 chiaro.

Cosa funziona comunque senza Playwright:

- Snapshot ARIA
- Snapshot di accessibilità in stile ruolo (`--interactive`, `--compact`,
  `--depth`, `--efficient`) quando è disponibile un WebSocket CDP per scheda. Questo è
  un fallback per ispezione e scoperta dei ref; Playwright resta il motore di azione
  principale.
- Screenshot di pagina per il browser gestito `openclaw` quando è disponibile un
  WebSocket CDP per scheda
- Screenshot di pagina per profili `existing-session` / Chrome MCP
- Screenshot basati su ref `existing-session` (`--ref`) dall'output dello snapshot

Cosa richiede ancora Playwright:

- `navigate`
- `act`
- Snapshot AI che dipendono dal formato snapshot AI nativo di Playwright
- Screenshot di elementi con selettore CSS (`--element`)
- esportazione PDF completa del browser

Gli screenshot di elementi rifiutano anche `--full-page`; la route restituisce `fullPage is
not supported for element screenshots`.

Se vedi `Playwright is not available in this gateway build`, nel Gateway pacchettizzato
manca la dipendenza runtime browser core. Reinstalla o aggiorna OpenClaw, quindi riavvia
il Gateway. Per Docker, installa anche i binari del browser Chromium come mostrato sotto.

#### Installazione di Playwright in Docker

Se il tuo Gateway viene eseguito in Docker, evita `npx playwright` (conflitti di override npm).
Usa invece la CLI inclusa:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Per rendere persistenti i download dei browser, imposta `PLAYWRIGHT_BROWSERS_PATH` (per esempio,
`/home/node/.cache/ms-playwright`) e assicurati che `/home/node` sia persistito tramite
`OPENCLAW_HOME_VOLUME` o un bind mount. Consulta [Docker](/it/install/docker).

## Come funziona (interno)

Un piccolo server di controllo loopback accetta richieste HTTP e si connette a browser basati su Chromium tramite CDP. Le azioni avanzate (click/digitazione/snapshot/PDF) passano attraverso Playwright sopra CDP; quando Playwright manca, sono disponibili solo le operazioni non Playwright. L'agente vede un'interfaccia stabile mentre browser e profili locali/remoti vengono scambiati liberamente sotto di essa.

## Riferimento rapido CLI

Tutti i comandi accettano `--browser-profile <name>` per puntare a un profilo specifico e `--json` per output leggibile dalla macchina.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Note:

- `upload` e `dialog` sono chiamate di **preparazione**; eseguile prima del click/pressione che attiva il selettore/dialogo.
- `click`/`type`/ecc. richiedono un `ref` da `snapshot` (numerico `12`, ref di ruolo `e12` o ref ARIA azionabile `ax12`). I selettori CSS non sono intenzionalmente supportati per le azioni. Usa `click-coords` quando la posizione visibile nel viewport è l'unico target affidabile.
- I percorsi di download, trace e upload sono vincolati alle radici temporanee di OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` può anche impostare direttamente input file tramite `--input-ref` o `--element`.

Gli ID e le etichette stabili delle schede sopravvivono alla sostituzione raw-target di Chromium quando OpenClaw
può dimostrare la scheda sostitutiva, ad esempio lo stesso URL o una singola vecchia scheda che diventa una
singola nuova scheda dopo l'invio di un modulo. Gli ID target raw restano comunque volatili; preferisci
`suggestedTargetId` da `tabs` negli script.

Panoramica rapida dei flag snapshot:

- `--format ai` (predefinito con Playwright): snapshot AI con ref numerici (`aria-ref="<n>"`).
- `--format aria`: albero di accessibilità con ref `axN`. Quando Playwright è disponibile, OpenClaw associa i ref con ID DOM backend alla pagina live così le azioni successive possono usarli; altrimenti considera l'output solo per ispezione.
- `--efficient` (o `--mode efficient`): preset snapshot di ruolo compatto. Imposta `browser.snapshotDefaults.mode: "efficient"` per renderlo predefinito (consulta [configurazione del Gateway](/it/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forzano uno snapshot di ruolo con ref `ref=e12`. `--frame "<iframe>"` limita gli snapshot di ruolo a un iframe.
- `--labels` aggiunge uno screenshot solo del viewport con etichette ref sovrapposte (stampa `MEDIA:<path>`).
- `--urls` aggiunge agli snapshot AI le destinazioni dei link scoperte.

## Snapshot e ref

OpenClaw supporta due stili di "snapshot":

- **Snapshot AI (ref numerici)**: `openclaw browser snapshot` (predefinito; `--format ai`)
  - Output: uno snapshot testuale che include ref numerici.
  - Azioni: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, il ref viene risolto tramite `aria-ref` di Playwright.

- **Snapshot di ruolo (ref di ruolo come `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: una lista/albero basata su ruoli con `[ref=e12]` (e `[nth=1]` opzionale).
  - Azioni: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, il ref viene risolto tramite `getByRole(...)` (più `nth()` per i duplicati).
  - Aggiungi `--labels` per includere uno screenshot del viewport con etichette `e12` sovrapposte.
  - Aggiungi `--urls` quando il testo del link è ambiguo e l'agente ha bisogno di target
    di navigazione concreti.

- **Snapshot ARIA (ref ARIA come `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: l'albero di accessibilità come nodi strutturati.
  - Azioni: `openclaw browser click ax12` funziona quando il percorso snapshot può associare
    il ref tramite Playwright e gli ID DOM backend di Chrome.
- Se Playwright non è disponibile, gli snapshot ARIA possono comunque essere utili per
  l'ispezione, ma i ref potrebbero non essere azionabili. Esegui di nuovo lo snapshot con `--format ai`
  o `--interactive` quando hai bisogno di ref per azioni.
- Prova Docker per il percorso fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  avvia Chromium con CDP, esegue `browser doctor --deep` e verifica che gli snapshot di ruolo
  includano URL dei link, elementi cliccabili promossi dal cursore e metadati iframe.

Comportamento dei ref:

- I ref **non sono stabili tra le navigazioni**; se qualcosa non riesce, riesegui `snapshot` e usa un ref nuovo.
- `/act` restituisce l'attuale `targetId` grezzo dopo una sostituzione attivata da un'azione
  quando può dimostrare la scheda sostitutiva. Continua a usare id/etichette di schede stabili per i
  comandi successivi.
- Se lo snapshot dei ruoli è stato acquisito con `--frame`, i ref dei ruoli hanno ambito limitato a quell'iframe fino allo snapshot dei ruoli successivo.
- I ref `axN` sconosciuti o obsoleti falliscono rapidamente invece di ricadere sul selettore
  `aria-ref` di Playwright. Esegui uno snapshot nuovo sulla stessa scheda quando
  succede.

## Funzionalità avanzate di attesa

Puoi attendere più che solo tempo/testo:

- Attendi l'URL (glob supportati da Playwright):
  - `openclaw browser wait --url "**/dash"`
- Attendi lo stato di caricamento:
  - `openclaw browser wait --load networkidle`
- Attendi un predicato JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Attendi che un selettore diventi visibile:
  - `openclaw browser wait "#main"`

Questi possono essere combinati:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flussi di lavoro di debug

Quando un'azione fallisce (ad es. "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (preferisci i ref dei ruoli in modalità interattiva)
3. Se fallisce ancora: `openclaw browser highlight <ref>` per vedere cosa sta puntando Playwright
4. Se la pagina si comporta in modo anomalo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Per un debug approfondito: registra una traccia:
   - `openclaw browser trace start`
   - riproduci il problema
   - `openclaw browser trace stop` (stampa `TRACE:<path>`)

## Output JSON

`--json` è pensato per scripting e strumenti strutturati.

Esempi:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Gli snapshot dei ruoli in JSON includono `refs` più un piccolo blocco `stats` (lines/chars/refs/interactive) così gli strumenti possono ragionare su dimensione e densità del payload.

## Controlli di stato e ambiente

Sono utili per flussi di lavoro del tipo "fai comportare il sito come X":

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (il legacy `set headers --json '{"X-Debug":"1"}'` resta supportato)
- Autenticazione HTTP basic: `set credentials user pass` (o `--clear`)
- Geolocalizzazione: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Media: `set media dark|light|no-preference|none`
- Fuso orario / impostazioni locali: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preset dispositivo Playwright)
  - `set viewport 1280 720`

## Sicurezza e privacy

- Il profilo browser di openclaw può contenere sessioni con accesso effettuato; trattalo come sensibile.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  eseguono JavaScript arbitrario nel contesto della pagina. La prompt injection può indirizzarlo.
  Disabilitalo con `browser.evaluateEnabled=false` se non ne hai bisogno.
- Per accessi e note anti-bot (X/Twitter, ecc.), vedi [Accesso browser + pubblicazione su X/Twitter](/it/tools/browser-login).
- Mantieni privato l'host Gateway/node (loopback o solo tailnet).
- Gli endpoint CDP remoti sono potenti; instradali tramite tunnel e proteggili.

Esempio di modalità strict (blocca destinazioni private/interne per impostazione predefinita):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Correlati

- [Browser](/it/tools/browser) - panoramica, configurazione, profili, sicurezza
- [Accesso browser](/it/tools/browser-login) - accesso ai siti
- [Risoluzione dei problemi del browser su Linux](/it/tools/browser-linux-troubleshooting)
- [Risoluzione dei problemi del browser WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
