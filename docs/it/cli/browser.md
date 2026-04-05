---
read_when:
    - Usi `openclaw browser` e vuoi esempi per le attività comuni
    - Vuoi controllare un browser in esecuzione su un'altra macchina tramite un host nodo
    - Vuoi collegarti al tuo Chrome locale già autenticato tramite Chrome MCP
summary: Riferimento CLI per `openclaw browser` (ciclo di vita, profili, schede, azioni, stato e debug)
title: browser
x-i18n:
    generated_at: "2026-04-05T13:47:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: c89a7483dd733863dd8ebd47a14fbb411808ad07daaed515c1270978de9157e7
    source_path: cli/browser.md
    workflow: 15
---

# `openclaw browser`

Gestisci la superficie di controllo del browser di OpenClaw ed esegui azioni del browser (ciclo di vita, profili, schede, snapshot, screenshot, navigazione, input, emulazione dello stato e debug).

Correlati:

- Strumento browser + API: [Strumento browser](/tools/browser)

## Flag comuni

- `--url <gatewayWsUrl>`: URL WebSocket del gateway (predefinito dalla configurazione).
- `--token <token>`: token del gateway (se richiesto).
- `--timeout <ms>`: timeout della richiesta (ms).
- `--expect-final`: attende una risposta finale del gateway.
- `--browser-profile <name>`: sceglie un profilo browser (predefinito dalla configurazione).
- `--json`: output leggibile da macchina (dove supportato).

## Avvio rapido (locale)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

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

Quando `plugins.allow` è presente, il plugin browser incluso deve essere elencato
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

Correlato: [Strumento browser](/tools/browser#missing-browser-command-or-tool)

## Profili

I profili sono configurazioni denominate di instradamento del browser. In pratica:

- `openclaw`: avvia o si collega a un'istanza Chrome dedicata gestita da OpenClaw (directory dati utente isolata).
- `user`: controlla la tua sessione Chrome esistente già autenticata tramite Chrome DevTools MCP.
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

- `--full-page` è per acquisizioni della pagina intera soltanto; non può essere combinato con `--ref`
  o `--element`.
- I profili `existing-session` / `user` supportano screenshot della pagina e screenshot con `--ref`
  dall'output dello snapshot, ma non screenshot CSS con `--element`.

Navigazione/click/digitazione (automazione UI basata su ref):

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

## Stato e storage

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

Usa il profilo `user` integrato oppure crea il tuo profilo `existing-session`:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

Questo percorso è solo host. Per Docker, server headless, Browserless o altre configurazioni remote, usa invece un profilo CDP.

Limiti attuali di existing-session:

- le azioni guidate da snapshot usano ref, non selettori CSS
- `click` supporta solo il clic sinistro
- `type` non supporta `slowly=true`
- `press` non supporta `delayMs`
- `hover`, `scrollintoview`, `drag`, `select`, `fill` ed `evaluate` rifiutano
  override di timeout per chiamata
- `select` supporta un solo valore
- `wait --load networkidle` non è supportato
- i caricamenti di file richiedono `--ref` / `--input-ref`, non supportano CSS
  `--element` e attualmente supportano un file alla volta
- gli hook delle finestre di dialogo non supportano `--timeout`
- gli screenshot supportano acquisizioni della pagina e `--ref`, ma non CSS `--element`
- `responsebody`, intercettazione dei download, esportazione PDF e azioni batch richiedono ancora
  un browser gestito o un profilo CDP raw

## Controllo remoto del browser (proxy host nodo)

Se il gateway è in esecuzione su una macchina diversa dal browser, esegui un **host nodo** sulla macchina che ha Chrome/Brave/Edge/Chromium. Il gateway inoltrerà le azioni del browser a quel nodo (non è richiesto un server di controllo browser separato).

Usa `gateway.nodes.browser.mode` per controllare l'instradamento automatico e `gateway.nodes.browser.node` per fissare un nodo specifico se ce ne sono più di uno collegati.

Sicurezza + configurazione remota: [Strumento browser](/tools/browser), [Accesso remoto](/gateway/remote), [Tailscale](/gateway/tailscale), [Sicurezza](/gateway/security)
