---
read_when:
    - Scripting o debug del browser dell'agente tramite l'API di controllo locale
    - Cerchi il riferimento CLI di `openclaw browser`
    - Aggiunta di automazione browser personalizzata con snapshot e ref
summary: API di controllo del browser OpenClaw, riferimento CLI e azioni di scripting
title: API di controllo del browser
x-i18n:
    generated_at: "2026-04-24T09:04:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

Per configurazione, impostazione e risoluzione dei problemi, vedi [Browser](/it/tools/browser).
Questa pagina è il riferimento per l'API HTTP di controllo locale, la CLI `openclaw browser`
e i pattern di scripting (snapshot, ref, wait, flussi di debug).

## API di controllo (facoltativa)

Per integrazioni solo locali, il Gateway espone una piccola API HTTP loopback:

- Stato/avvio/arresto: `GET /`, `POST /start`, `POST /stop`
- Schede: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Azioni: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Download: `POST /download`, `POST /wait/download`
- Debug: `GET /console`, `POST /pdf`
- Debug: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rete: `POST /response/body`
- Stato: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Stato: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Impostazioni: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Tutti gli endpoint accettano `?profile=<name>`.

Se è configurata l'autenticazione del gateway con segreto condiviso, anche le route HTTP del browser richiedono autenticazione:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` oppure autenticazione HTTP Basic con quella password

Note:

- Questa API browser loopback standalone **non** usa gli header di identità di trusted-proxy o Tailscale Serve.
- Se `gateway.auth.mode` è `none` o `trusted-proxy`, queste route browser loopback
  non ereditano quelle modalità basate su identità; mantienile solo loopback.

### Contratto di errore di `/act`

`POST /act` usa una risposta di errore strutturata per errori di convalida e
policy a livello di route:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valori `code` attuali:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` manca o non è riconosciuto.
- `ACT_INVALID_REQUEST` (HTTP 400): il payload dell'azione non ha superato normalizzazione o convalida.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` è stato usato con un tipo di azione non supportato.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) è disabilitato dalla configurazione.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` di primo livello o batch è in conflitto con il target della richiesta.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): l'azione non è supportata per profili existing-session.

Altri errori runtime possono ancora restituire `{ "error": "<message>" }` senza
un campo `code`.

### Requisito Playwright

Alcune funzionalità (navigate/act/AI snapshot/role snapshot, screenshot di elementi,
PDF) richiedono Playwright. Se Playwright non è installato, quegli endpoint restituiscono
un chiaro errore 501.

Cosa funziona ancora senza Playwright:

- Snapshot ARIA
- Screenshot della pagina per il browser `openclaw` gestito quando è disponibile un WebSocket CDP per scheda
- Screenshot della pagina per profili `existing-session` / Chrome MCP
- Screenshot basati su ref in `existing-session` (`--ref`) dall'output dello snapshot

Cosa richiede ancora Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- Screenshot di elementi con selettore CSS (`--element`)
- Esportazione PDF completa del browser

Gli screenshot degli elementi rifiutano anche `--full-page`; la route restituisce `fullPage is
not supported for element screenshots`.

Se vedi `Playwright is not available in this gateway build`, ripara le dipendenze runtime del plugin browser bundle in modo che `playwright-core` sia installato,
poi riavvia il gateway. Per installazioni pacchettizzate, esegui `openclaw doctor --fix`.
Per Docker, installa anche i binari del browser Chromium come mostrato sotto.

#### Installazione Docker di Playwright

Se il tuo Gateway gira in Docker, evita `npx playwright` (conflitti con override npm).
Usa invece la CLI bundle:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Per rendere persistenti i download del browser, imposta `PLAYWRIGHT_BROWSERS_PATH` (ad esempio,
`/home/node/.cache/ms-playwright`) e assicurati che `/home/node` sia persistente tramite
`OPENCLAW_HOME_VOLUME` o un bind mount. Vedi [Docker](/it/install/docker).

## Come funziona (internamente)

Un piccolo server di controllo loopback accetta richieste HTTP e si connette ai browser basati su Chromium tramite CDP. Le azioni avanzate (click/type/snapshot/PDF) passano attraverso Playwright sopra CDP; quando Playwright manca, sono disponibili solo le operazioni non-Playwright. L'agente vede un'unica interfaccia stabile mentre browser e profili locali/remoti possono cambiare liberamente sotto il cofano.

## Riferimento rapido CLI

Tutti i comandi accettano `--browser-profile <name>` per puntare a un profilo specifico, e `--json` per output leggibile dalla macchina.

<AccordionGroup>

<Accordion title="Base: stato, schede, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # cancella anche l'emulazione su attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # scorciatoia per la scheda corrente
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Ispezione: screenshot, snapshot, console, errori, richieste">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # oppure --ref e12
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Azioni: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # oppure e12 per role ref
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

<Accordion title="Stato: cookie, storage, offline, header, geo, device">

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

- `upload` e `dialog` sono chiamate di **arming**; eseguile prima del click/press che attiva il chooser/dialog.
- `click`/`type`/ecc. richiedono un `ref` da `snapshot` (`12` numerico oppure role ref `e12`). I selettori CSS sono intenzionalmente non supportati per le azioni.
- I percorsi di download, trace e upload sono vincolati alle root temporanee di OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` può anche impostare direttamente gli input file tramite `--input-ref` o `--element`.

Flag degli snapshot in breve:

- `--format ai` (predefinito con Playwright): AI snapshot con ref numerici (`aria-ref="<n>"`).
- `--format aria`: albero di accessibilità, senza ref; solo ispezione.
- `--efficient` (o `--mode efficient`): preset compatto per role snapshot. Imposta `browser.snapshotDefaults.mode: "efficient"` per renderlo il predefinito (vedi [Configurazione del Gateway](/it/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forzano un role snapshot con ref `ref=e12`. `--frame "<iframe>"` limita i role snapshot a un iframe.
- `--labels` aggiunge uno screenshot solo viewport con etichette ref sovrapposte (stampa `MEDIA:<path>`).

## Snapshot e ref

OpenClaw supporta due stili di “snapshot”:

- **AI snapshot (ref numerici)**: `openclaw browser snapshot` (predefinito; `--format ai`)
  - Output: uno snapshot testuale che include ref numerici.
  - Azioni: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, il ref viene risolto tramite `aria-ref` di Playwright.

- **Role snapshot (role ref come `e12`)**: `openclaw browser snapshot --interactive` (oppure `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: un elenco/albero basato sui ruoli con `[ref=e12]` (e facoltativamente `[nth=1]`).
  - Azioni: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, il ref viene risolto tramite `getByRole(...)` (più `nth()` per i duplicati).
  - Aggiungi `--labels` per includere uno screenshot viewport con etichette `e12` sovrapposte.

Comportamento dei ref:

- I ref **non sono stabili tra navigazioni**; se qualcosa fallisce, riesegui `snapshot` e usa un ref aggiornato.
- Se il role snapshot è stato acquisito con `--frame`, i role ref sono limitati a quell'iframe fino al successivo role snapshot.

## Potenziamenti di wait

Puoi attendere più cose oltre al semplice tempo/testo:

- Attendere un URL (glob supportati da Playwright):
  - `openclaw browser wait --url "**/dash"`
- Attendere uno stato di caricamento:
  - `openclaw browser wait --load networkidle`
- Attendere un predicato JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Attendere che un selettore diventi visibile:
  - `openclaw browser wait "#main"`

Questi possono essere combinati:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Flussi di debug

Quando un'azione fallisce (ad esempio “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (preferisci role ref in modalità interattiva)
3. Se fallisce ancora: `openclaw browser highlight <ref>` per vedere cosa sta targettando Playwright
4. Se la pagina si comporta in modo strano:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Per un debug approfondito: registra una trace:
   - `openclaw browser trace start`
   - riproduci il problema
   - `openclaw browser trace stop` (stampa `TRACE:<path>`)

## Output JSON

`--json` serve per scripting e tooling strutturato.

Esempi:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

I role snapshot in JSON includono `refs` più un piccolo blocco `stats` (righe/caratteri/ref/interattivo) così gli strumenti possono ragionare sulla dimensione e la densità del payload.

## Manopole di stato e ambiente

Queste sono utili per flussi di lavoro del tipo “fai comportare il sito come X”:

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (il legacy `set headers --json '{"X-Debug":"1"}'` continua a essere supportato)
- Auth HTTP basic: `set credentials user pass` (oppure `--clear`)
- Geolocalizzazione: `set geo <lat> <lon> --origin "https://example.com"` (oppure `--clear`)
- Media: `set media dark|light|no-preference|none`
- Fuso orario / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (preset Playwright per dispositivi)
  - `set viewport 1280 720`

## Sicurezza e privacy

- Il profilo browser openclaw può contenere sessioni con login attivo; trattalo come sensibile.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  eseguono JavaScript arbitrario nel contesto della pagina. Il prompt injection può
  orientare questo comportamento. Disabilitalo con `browser.evaluateEnabled=false` se non ti serve.
- Per login e note anti-bot (X/Twitter, ecc.), vedi [Login del browser + pubblicazione su X/Twitter](/it/tools/browser-login).
- Mantieni privato il Gateway/node host (solo loopback o solo tailnet).
- Gli endpoint CDP remoti sono potenti; usa tunnel e proteggili.

Esempio strict-mode (blocca per impostazione predefinita destinazioni private/interne):

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

- [Browser](/it/tools/browser) — panoramica, configurazione, profili, sicurezza
- [Login del browser](/it/tools/browser-login) — accesso ai siti
- [Risoluzione dei problemi del browser su Linux](/it/tools/browser-linux-troubleshooting)
- [Risoluzione dei problemi del browser su WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
