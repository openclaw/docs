---
read_when:
    - Scripting o debug del browser dell'agente tramite l'API di controllo locale
    - Cerchi il riferimento CLI di `openclaw browser`
    - Aggiungere automazione del browser personalizzata con snapshot e riferimenti
summary: API di controllo del browser OpenClaw, riferimento CLI e azioni di scripting
title: API di controllo del browser
x-i18n:
    generated_at: "2026-06-27T18:18:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Per installazione, configurazione e risoluzione dei problemi, consulta [Browser](/it/tools/browser).
Questa pagina è il riferimento per l'API HTTP di controllo locale, la CLI `openclaw browser`
e i pattern di scripting (snapshot, ref, attese, flussi di debug).

## API di controllo (opzionale)

Solo per integrazioni locali, il Gateway espone una piccola API HTTP su local loopback.
Questo server autonomo è opt-in: imposta la variabile d'ambiente
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` nell'ambiente del servizio gateway
e riavvia il gateway prima che gli endpoint HTTP diventino disponibili. Senza
questa variabile, il runtime di controllo del browser continua a funzionare tramite la CLI e
gli strumenti dell'agente, ma nulla resta in ascolto sulla porta di controllo local loopback.

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
avvio headless una tantum per profili locali gestiti senza modificare la
configurazione persistente del browser; i profili attach-only, CDP remoti e con sessione esistente rifiutano
questa sovrascrittura perché OpenClaw non avvia quei processi del browser.

Per gli endpoint delle schede, `targetId` è il nome del campo di compatibilità. Preferisci passare
`suggestedTargetId` da `GET /tabs` o `POST /tabs/open`; sono accettati anche etichette e handle `tabId`
come `t1`. Gli ID target CDP grezzi e i prefissi univoci degli ID target grezzi
continuano a funzionare, ma sono handle diagnostici volatili.

Se è configurata l'autenticazione gateway con segreto condiviso, anche le route HTTP del browser richiedono autenticazione:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` o autenticazione HTTP Basic con quella password

Note:

- Questa API browser local loopback autonoma **non** consuma intestazioni di identità trusted-proxy o
  Tailscale Serve.
- Se `gateway.auth.mode` è `none` o `trusted-proxy`, queste route browser local loopback
  non ereditano tali modalità basate su identità; mantienile solo su local loopback.

### Contratto di errore di `/act`

`POST /act` usa una risposta di errore strutturata per la validazione a livello di route e
gli errori di policy:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valori correnti di `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` manca o non è riconosciuto.
- `ACT_INVALID_REQUEST` (HTTP 400): il payload dell'azione non ha superato la normalizzazione o la validazione.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` è stato usato con un tipo di azione non supportato.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (o `wait --fn`) è disabilitato dalla configurazione.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): il `targetId` di primo livello o in batch è in conflitto con il target della richiesta.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): l'azione non è supportata per i profili con sessione esistente.

Altri errori di runtime possono comunque restituire `{ "error": "<message>" }` senza un
campo `code`.

### Requisito Playwright

Alcune funzionalità (navigate/act/snapshot AI/snapshot dei ruoli, screenshot degli elementi,
PDF) richiedono Playwright. Se Playwright non è installato, questi endpoint restituiscono
un errore 501 chiaro.

Cosa funziona comunque senza Playwright:

- Snapshot ARIA
- Snapshot di accessibilità in stile ruolo (`--interactive`, `--compact`,
  `--depth`, `--efficient`) quando è disponibile un WebSocket CDP per scheda. Questo è
  un fallback per l'ispezione e la scoperta delle ref; Playwright resta il motore di azione principale.
- Screenshot di pagina per il browser `openclaw` gestito quando è disponibile un
  WebSocket CDP per scheda
- Screenshot di pagina per profili `existing-session` / Chrome MCP
- Screenshot basati su ref `existing-session` (`--ref`) dall'output di snapshot

Cosa richiede ancora Playwright:

- `navigate`
- `act`
- Snapshot AI che dipendono dal formato snapshot AI nativo di Playwright
- Screenshot di elementi con selettore CSS (`--element`)
- esportazione PDF completa del browser

Gli screenshot degli elementi rifiutano anche `--full-page`; la route restituisce `fullPage is
not supported for element screenshots`.

Se vedi `Playwright is not available in this gateway build`, al Gateway pacchettizzato
manca la dipendenza runtime core del browser. Reinstalla o aggiorna
OpenClaw, quindi riavvia il gateway. Per Docker, installa anche i binari del browser
Chromium come mostrato sotto.

#### Installazione Docker di Playwright

Se il tuo Gateway viene eseguito in Docker, evita `npx playwright` (conflitti con override npm).
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
`OPENCLAW_HOME_VOLUME` o un bind mount. OpenClaw rileva automaticamente il
Chromium persistito su Linux. Consulta [Docker](/it/install/docker).

## Come funziona (interno)

Un piccolo server di controllo local loopback accetta richieste HTTP e si connette a browser basati su Chromium tramite CDP. Le azioni avanzate (click/type/snapshot/PDF) passano attraverso Playwright sopra CDP; quando Playwright manca, sono disponibili solo le operazioni non Playwright. L'agente vede un'unica interfaccia stabile mentre browser e profili locali/remoti cambiano liberamente al di sotto.

## Riferimento rapido CLI

Tutti i comandi accettano `--browser-profile <name>` per indirizzare un profilo specifico, e `--json` per output leggibile da macchine.

<AccordionGroup>

<Accordion title="Basi: stato, schede, apri/metti a fuoco/chiudi">

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

<Accordion title="Ispezione: screenshot, snapshot, console, errori, richieste">

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

<Accordion title="Azioni: naviga, fai clic, digita, trascina, attendi, valuta">

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

<Accordion title="Stato: cookie, storage, offline, intestazioni, geolocalizzazione, dispositivo">

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

- `upload` e `dialog` sono chiamate di **preparazione**; eseguile prima del click/pressione che attiva il selettore/la finestra di dialogo. Se un'azione apre un modale, la risposta dell'azione include `blockedByDialog` e `browserState.dialogs.pending`; passa quel `dialogId` per rispondere direttamente. Le finestre di dialogo gestite fuori da OpenClaw appaiono sotto `browserState.dialogs.recent`.
- `click`/`type`/ecc. richiedono una `ref` da `snapshot` (numerica `12`, ref di ruolo `e12`, o ref ARIA azionabile `ax12`). I selettori CSS non sono intenzionalmente supportati per le azioni. Usa `click-coords` quando la posizione visibile nel viewport è l'unico target affidabile.
- I percorsi di download e trace sono vincolati alle radici temporanee di OpenClaw: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` accetta file dalla radice temporanea degli upload di OpenClaw e
  media in ingresso gestiti da OpenClaw. I media in ingresso gestiti possono essere referenziati come
  `media://inbound/<id>`, `media/inbound/<id>` relativo alla sandbox, o un percorso risolto
  all'interno della directory dei media in ingresso gestiti. Ref media annidate,
  traversal, symlink, hardlink e percorsi locali arbitrari sono comunque rifiutati.
- `upload` può anche impostare direttamente gli input file tramite `--input-ref` o `--element`.

Gli ID scheda stabili e le etichette sopravvivono alla sostituzione raw-target di Chromium quando OpenClaw
può dimostrare la scheda sostitutiva, ad esempio stesso URL o una singola vecchia scheda che diventa una
singola nuova scheda dopo l'invio di un modulo. Gli ID target grezzi sono comunque volatili; preferisci
`suggestedTargetId` da `tabs` negli script.

Panoramica rapida dei flag di snapshot:

- `--format ai` (predefinito con Playwright): snapshot AI con riferimenti numerici (`aria-ref="<n>"`).
- `--format aria`: albero di accessibilità con riferimenti `axN`. Quando Playwright è disponibile, OpenClaw associa i riferimenti alla pagina live con gli ID DOM del backend, così le azioni successive possono usarli; altrimenti considera l'output solo per l'ispezione.
- `--efficient` (o `--mode efficient`): preset compatto dello snapshot dei ruoli. Imposta `browser.snapshotDefaults.mode: "efficient"` per renderlo il predefinito (vedi [configurazione del Gateway](/it/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` forzano uno snapshot dei ruoli con riferimenti `ref=e12`. `--frame "<iframe>"` limita gli snapshot dei ruoli a un iframe.
- Con Playwright, `--labels` aggiunge uno screenshot con etichette dei riferimenti sovrapposte
  (stampa `MEDIA:<path>`) più un array `annotations` con il riquadro di delimitazione
  di ogni riferimento. Su `screenshot`, le etichette basate su Playwright funzionano con `--full-page`,
  `--ref` e `--element`; su `snapshot`, lo screenshot di accompagnamento resta
  solo viewport. I profili existing-session/chrome-mcp renderizzano le etichette sovrapposte sugli
  screenshot della pagina ma non restituiscono `annotations` né usano l'helper di proiezione
  full-page/ref/element di Playwright. Senza Playwright o chrome-mcp,
  gli screenshot etichettati non sono disponibili.
- `--urls` aggiunge le destinazioni dei link rilevati agli snapshot AI.

## Snapshot e riferimenti

OpenClaw supporta due stili di "snapshot":

- **Snapshot AI (riferimenti numerici)**: `openclaw browser snapshot` (predefinito; `--format ai`)
  - Output: uno snapshot testuale che include riferimenti numerici.
  - Azioni: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, il riferimento viene risolto tramite `aria-ref` di Playwright.

- **Snapshot dei ruoli (riferimenti di ruolo come `e12`)**: `openclaw browser snapshot --interactive` (o `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: un elenco/albero basato sui ruoli con `[ref=e12]` (e `[nth=1]` opzionale).
  - Azioni: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, il riferimento viene risolto tramite `getByRole(...)` (più `nth()` per i duplicati).
  - Aggiungi `--labels` per includere uno screenshot con etichette `e12` sovrapposte. Sui
    profili basati su Playwright questo restituisce anche metadati del riquadro di delimitazione
    per riferimento (`annotations[]`).
  - Aggiungi `--urls` quando il testo del link è ambiguo e l'agente ha bisogno di
    destinazioni di navigazione concrete.

- **Snapshot ARIA (riferimenti ARIA come `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: l'albero di accessibilità come nodi strutturati.
  - Azioni: `openclaw browser click ax12` funziona quando il percorso dello snapshot può associare
    il riferimento tramite Playwright e gli ID DOM del backend Chrome.
- Se Playwright non è disponibile, gli snapshot ARIA possono comunque essere utili per
  l'ispezione, ma i riferimenti potrebbero non essere utilizzabili per azioni. Esegui di nuovo lo snapshot con `--format ai`
  o `--interactive` quando hai bisogno di riferimenti azionabili.
- Prova Docker per il percorso di fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  avvia Chromium con CDP, esegue `browser doctor --deep` e verifica che gli snapshot dei ruoli
  includano URL dei link, elementi cliccabili promossi dal cursore e metadati iframe.

Comportamento dei riferimenti:

- I riferimenti **non sono stabili tra navigazioni**; se qualcosa fallisce, riesegui `snapshot` e usa un riferimento nuovo.
- `/act` restituisce l'attuale `targetId` grezzo dopo una sostituzione attivata da un'azione
  quando può provare la scheda sostitutiva. Continua a usare ID/etichette di schede stabili per
  i comandi successivi.
- Se lo snapshot dei ruoli è stato acquisito con `--frame`, i riferimenti di ruolo sono limitati a quell'iframe fino allo snapshot dei ruoli successivo.
- I riferimenti `axN` sconosciuti o obsoleti falliscono subito invece di ricadere nel selettore
  `aria-ref` di Playwright. Esegui uno snapshot nuovo sulla stessa scheda quando
  succede.

## Potenziamenti dell'attesa

Puoi attendere più di semplice tempo/testo:

- Attendi l'URL (glob supportati da Playwright):
  - `openclaw browser wait --url "**/dash"`
- Attendi lo stato di caricamento:
  - `openclaw browser wait --load networkidle`
  - Supportato sui profili gestiti `openclaw` e raw/remote CDP. I profili `user` ed `existing-session` rifiutano `networkidle`; lì usa attese `--url`, `--text`, un selettore o `--fn`.
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

## Flussi di debug

Quando un'azione fallisce (ad es. "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Usa `click <ref>` / `type <ref>` (preferisci i riferimenti di ruolo in modalità interattiva)
3. Se fallisce ancora: `openclaw browser highlight <ref>` per vedere cosa sta prendendo di mira Playwright
4. Se la pagina si comporta in modo anomalo:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Per un debug approfondito: registra una traccia:
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

## Stato e opzioni dell'ambiente

Sono utili per flussi "fai comportare il sito come X":

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

- Il profilo browser openclaw può contenere sessioni autenticate; trattalo come sensibile.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  eseguono JavaScript arbitrario nel contesto della pagina. La prompt injection può orientarlo.
  Disabilitalo con `browser.evaluateEnabled=false` se non ne hai bisogno.
- `openclaw browser evaluate --fn` accetta il sorgente di una funzione, un'espressione o
  il corpo di un'istruzione. I corpi delle istruzioni vengono racchiusi come funzioni async, quindi usa
  `return` per il valore che vuoi ottenere. Usa `--timeout-ms <ms>` quando la
  funzione lato pagina può richiedere più tempo del timeout evaluate predefinito.
- Per accessi e note anti-bot (X/Twitter, ecc.), vedi [Accesso browser + pubblicazione su X/Twitter](/it/tools/browser-login).
- Mantieni privato l'host Gateway/node (loopback o solo tailnet).
- Gli endpoint remote CDP sono potenti; crea tunnel e proteggili.

Esempio di strict-mode (blocca destinazioni private/interne per impostazione predefinita):

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
- [Risoluzione dei problemi Browser WSL2](/it/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
