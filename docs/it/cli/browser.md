---
read_when:
    - Usi `openclaw browser` e vuoi esempi per attività comuni
    - Vuoi controllare un browser in esecuzione su un'altra macchina tramite un host Node
    - Vuoi collegarti al tuo Chrome locale con accesso già effettuato tramite Chrome MCP
summary: Riferimento CLI per `openclaw browser` (ciclo di vita, profili, schede, azioni, stato e debug)
title: Browser
x-i18n:
    generated_at: "2026-04-24T08:33:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b93ea053b7fc047fad79397e0298cc530673a64d5873d98be9f910df1ea2fde
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gestisci la superficie di controllo del browser di OpenClaw ed esegui azioni del browser (ciclo di vita, profili, schede, snapshot, screenshot, navigazione, input, emulazione dello stato e debug).

Correlati:

- Strumento Browser + API: [Strumento Browser](/it/tools/browser)

## Flag comuni

- `--url <gatewayWsUrl>`: URL WebSocket del Gateway (predefinito dalla configurazione).
- `--token <token>`: token del Gateway (se richiesto).
- `--timeout <ms>`: timeout della richiesta (ms).
- `--expect-final`: attende una risposta finale del Gateway.
- `--browser-profile <name>`: sceglie un profilo browser (predefinito dalla configurazione).
- `--json`: output leggibile dalla macchina (dove supportato).

## Avvio rapido (locale)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

## Risoluzione rapida dei problemi

Se `start` fallisce con `not reachable after start`, risolvi prima la prontezza CDP. Se `start` e `tabs` riescono ma `open` o `navigate` falliscono, il piano di controllo del browser è in salute e il problema di solito è il criterio SSRF di navigazione.

Sequenza minima:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Guida dettagliata: [Risoluzione dei problemi del Browser](/it/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## Ciclo di vita

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

Note:

- Per i profili `attachOnly` e CDP remoti, `openclaw browser stop` chiude la
  sessione di controllo attiva e cancella gli override temporanei di emulazione anche quando
  OpenClaw non ha avviato direttamente il processo del browser.
- Per i profili locali gestiti, `openclaw browser stop` arresta il processo del browser
  avviato.

## Se il comando manca

Se `openclaw browser` è un comando sconosciuto, controlla `plugins.allow` in
`~/.openclaw/openclaw.json`.

Quando `plugins.allow` è presente, il Plugin browser incluso deve essere elencato
esplicitamente:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true` non ripristina il sottocomando CLI quando la
allowlist dei plugin esclude `browser`.

Correlato: [Strumento Browser](/it/tools/browser#missing-browser-command-or-tool)

## Profili

I profili sono configurazioni di instradamento del browser con nome. In pratica:

- `openclaw`: avvia o collega un'istanza Chrome dedicata gestita da OpenClaw (directory dati utente isolata).
- `user`: controlla la tua sessione Chrome esistente con accesso già effettuato tramite Chrome DevTools MCP.
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
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai
openclaw browser focus <targetId>
openclaw browser close <targetId>
```

## Snapshot / screenshot / azioni

Snapshot:

```bash
openclaw browser snapshot
```

Screenshot:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
```

Note:

- `--full-page` è solo per acquisizioni di pagina; non può essere combinato con `--ref`
  o `--element`.
- I profili `existing-session` / `user` supportano screenshot di pagina e screenshot con `--ref`
  dall'output dello snapshot, ma non screenshot CSS `--element`.

Navigate/click/type (automazione UI basata su ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

Helper per file e finestre di dialogo:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

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

Usa il profilo `user` integrato oppure crea il tuo profilo `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Questo percorso è solo host. Per Docker, server headless, Browserless o altre configurazioni remote, usa invece un profilo CDP.

Limiti attuali di existing-session:

- le azioni guidate dallo snapshot usano ref, non selettori CSS
- `click` supporta solo il clic sinistro
- `type` non supporta `slowly=true`
- `press` non supporta `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ed `evaluate` rifiutano
  gli override di timeout per chiamata
- `select` supporta un solo valore
- `wait --load networkidle` non è supportato
- gli upload di file richiedono `--ref` / `--input-ref`, non supportano CSS
  `--element` e attualmente supportano un file alla volta
- gli hook delle finestre di dialogo non supportano `--timeout`
- gli screenshot supportano acquisizioni di pagina e `--ref`, ma non CSS `--element`
- `responsebody`, intercettazione dei download, esportazione PDF e azioni batch
  richiedono ancora un browser gestito o un profilo CDP raw

## Controllo remoto del browser (proxy host Node)

Se il Gateway è in esecuzione su una macchina diversa dal browser, esegui un **host Node** sulla macchina che ha Chrome/Brave/Edge/Chromium. Il Gateway farà da proxy per le azioni del browser verso quel node (non è richiesto un server separato di controllo del browser).

Usa `gateway.nodes.browser.mode` per controllare l'instradamento automatico e `gateway.nodes.browser.node` per fissare un node specifico se ce ne sono più di uno collegati.

Configurazione di sicurezza + remota: [Strumento Browser](/it/tools/browser), [Accesso remoto](/it/gateway/remote), [Tailscale](/it/gateway/tailscale), [Sicurezza](/it/gateway/security)

## Correlati

- [Riferimento CLI](/it/cli)
- [Browser](/it/tools/browser)
