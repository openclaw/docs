---
read_when:
    - Creazione di script o debug del browser dell'agente tramite l'API di controllo locale
    - Cerchi il riferimento della CLI `openclaw browser`
    - Aggiungere automazione del browser personalizzata con istantanee e riferimenti
summary: API di controllo del browser di OpenClaw, riferimento della CLI e azioni di scripting
title: API di controllo del browser
x-i18n:
    generated_at: "2026-05-11T20:36:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 317ac82cb9060ae1f9495a992dcbb25356ef23b98a5802cf0ed65d1720c2a57d
    source_path: tools/browser-control.md
    workflow: 16
---

Per configurazione, configurazione avanzata e risoluzione dei problemi, consulta [Browser](/it/tools/browser).
Questa pagina è il riferimento per l'API HTTP di controllo locale, la CLI `openclaw browser`
e i pattern di scripting (snapshot, riferimenti, attese, flussi di debug).

## API di controllo (opzionale)

Solo per integrazioni locali, il Gateway espone una piccola API HTTP su local loopback:

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
avvio headless una tantum per i profili locali gestiti senza modificare la
configurazione persistente del browser; i profili attach-only, CDP remoto e
existing-session rifiutano tale override perché OpenClaw non avvia quei processi
browser.

Se l'autenticazione del gateway con segreto condiviso è configurata, anche le rotte HTTP del browser richiedono l'autenticazione:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticazione HTTP Basic con quella password

Note:

- Questa API browser local loopback autonoma **non** consuma intestazioni di identità
  trusted-proxy o Tailscale Serve.
- Se `gateway.auth.mode` è `none` o `trusted-proxy`, queste rotte browser local loopback
  non ereditano quelle modalità con identità; mantienile solo su local loopback.

### Contratto di errore di `/act`

`POST /act` usa una risposta di errore strutturata per la validazione a livello di rotta e
per gli errori di policy:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valori `code` attuali:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` mancante o non riconosciuto.
- `ACT_INVALID_REQUEST` (HTTP 400): normalizzazione o validazione del payload dell'azione non riuscita.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` è stato usato con un tipo di azione non supportato.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) è disabilitato dalla configurazione.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` di livello superiore o in batch è in conflitto con il target della richiesta.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): azione non supportata per i profili existing-session.

Altri errori di runtime possono ancora restituire `{ "error": "<message>" }` senza un
campo `code`.

### Requisito Playwright

Alcune funzionalità (navigate/act/snapshot AI/snapshot dei ruoli, screenshot di elementi,
PDF) richiedono Playwright. Se Playwright non è installato, questi endpoint restituiscono
un chiaro errore 501.

Cosa funziona comunque senza Playwright:

- Snapshot ARIA
- Snapshot di accessibilità in stile ruolo (`--interactive`, `--compact`,
  `--depth`, `--efficient`) quando è disponibile un WebSocket CDP per scheda. Questo è
  un fallback per ispezione e scoperta dei riferimenti; Playwright rimane il motore
  principale per le azioni.
- Screenshot di pagina per il browser `openclaw` gestito quando è disponibile un
  WebSocket CDP per scheda
- Screenshot di pagina per profili `existing-session` / Chrome MCP
- Screenshot basati su riferimenti `existing-session` (`--ref`) dall'output dello snapshot

Cosa richiede ancora Playwright:

- `navigate`
- `act`
- Snapshot AI che dipendono dal formato snapshot AI nativo di Playwright
- Screenshot di elementi con selettore CSS (`--element`)
- esportazione PDF completa del browser

Gli screenshot di elementi rifiutano anche `--full-page`; la rotta restituisce `fullPage is
not supported for element screenshots`.

Se vedi `Playwright is not available in this gateway build`, nel Gateway confezionato
manca la dipendenza runtime core del browser. Reinstalla o aggiorna OpenClaw, quindi
riavvia il gateway. Per Docker, installa anche i binari del browser Chromium come
mostrato di seguito.

#### Installazione Playwright per Docker

Se il tuo Gateway gira in Docker, evita `npx playwright` (conflitti di override npm).
Per immagini personalizzate, integra Chromium nell'immagine:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Per un'immagine esistente, installa invece tramite la CLI inclusa:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Per rendere persistenti i download del browser, imposta `PLAYWRIGHT_BROWSERS_PATH` (per esempio,
`/home/node/.cache/ms-playwright`) e assicurati che `/home/node` sia persistito tramite
`OPENCLAW_HOME_VOLUME` o un bind mount. OpenClaw rileva automaticamente il Chromium
persistito su Linux. Consulta [Docker](/it/install/docker).

## Come funziona (interno)

Un piccolo server di controllo local loopback accetta richieste HTTP e si connette ai browser basati su Chromium tramite CDP. Le azioni avanzate (click/type/snapshot/PDF) passano attraverso Playwright sopra CDP; quando Playwright manca, sono disponibili solo operazioni non Playwright. L'agente vede un'unica interfaccia stabile mentre browser e profili locali/remoti vengono scambiati liberamente sotto il cofano.

## Riferimento rapido CLI

Tutti i comandi accettano `--browser-profile <name>` per scegliere come target un profilo specifico e `--json` per output leggibile da macchina.

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

- `upload` e `dialog` sono chiamate di **arming**; eseguile prima del click/pressione di tasto che attiva il selettore/file chooser o la finestra di dialogo.
- `click`/`type`/ecc. richiedono un `ref` da `snapshot` (numerico `12`, riferimento ruolo `e12` o riferimento ARIA azionabile `ax12`). I selettori CSS non sono intenzionalmente supportati per le azioni. Usa `click-coords` quando la posizione visibile nel viewport è l'unico target affidabile.
- I percorsi di download, trace e upload sono vincolati alle radici temporanee di OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` può anche impostare direttamente gli input file tramite `--input-ref` o `--element`.

ID e label stabili delle schede sopravvivono alla sostituzione del raw-target Chromium quando OpenClaw
può provare la scheda sostitutiva, per esempio stesso URL o una singola vecchia scheda che diventa una
singola nuova scheda dopo l'invio di un modulo. Gli ID raw target rimangono comunque volatili; negli script
preferisci `suggestedTargetId` da `tabs`.

Panoramica rapida dei flag snapshot:

- `--format ai` (predefinito con Playwright): snapshot AI con riferimenti numerici (`aria-ref="<n>"`).
- `--format aria`: albero di accessibilità con riferimenti `axN`. Quando Playwright è disponibile, OpenClaw associa i riferimenti con ID DOM backend alla pagina live, così le azioni successive possono usarli; altrimenti considera l'output solo per ispezione.
- `--efficient` (o `--mode efficient`): preset compatto per snapshot dei ruoli. Imposta `browser.snapshotDefaults.mode: "efficient"` per renderlo predefinito (vedi [Configurazione Gateway](/it/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forzano uno snapshot dei ruoli con riferimenti `ref=e12`. `--frame "<iframe>"` limita gli snapshot dei ruoli a un iframe.
- `--labels` aggiunge uno screenshot solo del viewport con label dei riferimenti sovrapposte (stampa `MEDIA:<path>`).
- `--urls` aggiunge agli snapshot AI le destinazioni dei link scoperte.

## Snapshot e riferimenti

OpenClaw supporta due stili di "snapshot":

- **Snapshot AI (riferimenti numerici)**: `openclaw browser snapshot` (predefinito; `--format ai`)
  - Output: uno snapshot testuale che include riferimenti numerici.
  - Azioni: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, il riferimento viene risolto tramite `aria-ref` di Playwright.

- **Snapshot dei ruoli (riferimenti ruolo come `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: un elenco/albero basato su ruoli con `[ref=e12]` (e `[nth=1]` opzionale).
  - Azioni: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, il riferimento viene risolto tramite `getByRole(...)` (più `nth()` per i duplicati).
  - Aggiungi `--labels` per includere uno screenshot del viewport con label `e12` sovrapposte.
  - Aggiungi `--urls` quando il testo del link è ambiguo e l'agente ha bisogno di target
    di navigazione concreti.

- **Snapshot ARIA (riferimenti ARIA come `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: l'albero di accessibilità come nodi strutturati.
  - Azioni: `openclaw browser click ax12` funziona quando il percorso dello snapshot può associare
    il riferimento tramite Playwright e gli ID DOM del backend Chrome.
- Se Playwright non è disponibile, gli snapshot ARIA possono comunque essere utili per
  l'ispezione, ma i riferimenti potrebbero non essere eseguibili. Esegui di nuovo lo snapshot con `--format ai`
  o `--interactive` quando ti servono riferimenti per le azioni.
- Prova Docker per il percorso di fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  avvia Chromium con CDP, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli
  includano URL dei link, elementi cliccabili promossi dal cursore e metadati iframe.

Comportamento dei riferimenti:

- I riferimenti **non sono stabili tra le navigazioni**; se qualcosa fallisce, esegui di nuovo `snapshot` e usa un riferimento nuovo.
- `/act` restituisce l'attuale `targetId` raw dopo una sostituzione attivata dall'azione
  quando può provare la scheda sostitutiva. Continua a usare ID/etichette di schede stabili per
  i comandi successivi.
- Se lo snapshot dei ruoli è stato acquisito con `--frame`, i riferimenti dei ruoli hanno ambito limitato a quell'iframe fino allo snapshot dei ruoli successivo.
- I riferimenti `axN` sconosciuti o obsoleti falliscono rapidamente invece di ricadere sul
  selettore `aria-ref` di Playwright. Esegui uno snapshot nuovo sulla stessa scheda quando
  accade.

## Funzioni avanzate di attesa

Puoi attendere più di solo tempo/testo:

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

Quando un'azione fallisce (ad es. "non visibile", "violazione della strict mode", "coperto"):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (preferisci i riferimenti di ruolo in modalità interattiva)
3. Se continua a fallire: `openclaw browser highlight <ref>` per vedere cosa sta puntando Playwright
4. Se la pagina si comporta in modo anomalo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Per debug approfondito: registra una traccia:
   - `openclaw browser trace start`
   - riproduci il problema
   - `openclaw browser trace stop` (stampa `TRACE:<path>`)

## Output JSON

`--json` è per scripting e strumenti strutturati.

Esempi:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Gli snapshot dei ruoli in JSON includono `refs` più un piccolo blocco `stats` (lines/chars/refs/interactive) così gli strumenti possono ragionare su dimensione e densità del payload.

## Controlli di stato e ambiente

Questi sono utili per flussi di lavoro "fai comportare il sito come X":

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (il legacy `set headers --json '{"X-Debug":"1"}'` resta supportato)
- Autenticazione HTTP basic: `set credentials user pass` (o `--clear`)
- Geolocalizzazione: `set geo <lat> <lon> --origin "https://example.com"` (o `--clear`)
- Media: `set media dark|light|no-preference|none`
- Fuso orario / locale: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (preset dispositivo Playwright)
  - `set viewport 1280 720`

## Sicurezza e privacy

- Il profilo del browser openclaw può contenere sessioni autenticate; trattalo come sensibile.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  eseguono JavaScript arbitrario nel contesto della pagina. La prompt injection può indirizzarlo.
  Disabilitalo con `browser.evaluateEnabled=false` se non ti serve.
- Per accessi e note anti-bot (X/Twitter, ecc.), consulta [Accesso browser + pubblicazione X/Twitter](/it/tools/browser-login).
- Mantieni privato l'host Gateway/node (local loopback o solo tailnet).
- Gli endpoint CDP remoti sono potenti; crea tunnel e proteggili.

Esempio di strict mode (blocca le destinazioni private/interne per impostazione predefinita):

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
