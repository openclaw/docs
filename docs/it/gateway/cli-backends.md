---
read_when:
    - Vuoi un fallback affidabile quando i provider API falliscono
    - Stai eseguendo Codex CLI o altre CLI AI locali e vuoi riutilizzarle
    - Vuoi capire il bridge loopback MCP per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback CLI AI locale con bridge strumenti MCP opzionale'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-07T08:13:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: f061357f420455ad6ffaabe7fe28f1fb1b1769d73a4eb2e6f45c6eb3c2e36667
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime di fallback)

OpenClaw può eseguire **CLI AI locali** come **fallback solo testo** quando i provider API non sono disponibili,
sono soggetti a limitazione di frequenza o si comportano temporaneamente in modo anomalo. Si tratta intenzionalmente di un approccio conservativo:

- **Gli strumenti di OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  possono ricevere strumenti del gateway tramite un bridge MCP loopback.
- **Streaming JSONL** per le CLI che lo supportano.
- **Le sessioni sono supportate** (così i turni successivi restano coerenti).
- **Le immagini possono essere passate** se la CLI accetta percorsi di immagini.

Questo è progettato come **rete di sicurezza** piuttosto che come percorso primario. Usalo quando
vuoi risposte testuali che “funzionano sempre” senza dipendere da API esterne.

Se vuoi un runtime harness completo con controlli di sessione ACP, attività in background,
binding thread/conversazione e sessioni di coding esterne persistenti, usa invece
[ACP Agents](/it/tools/acp-agents). I backend CLI non sono ACP.

## Guida rapida per principianti

Puoi usare Codex CLI **senza alcuna configurazione** (il plugin OpenAI incluso
registra un backend predefinito):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Se il tuo gateway è eseguito sotto launchd/systemd e PATH è minimale, aggiungi solo il
percorso del comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Questo è tutto. Nessuna chiave, nessuna configurazione di autenticazione aggiuntiva oltre alla CLI stessa.

Se usi un backend CLI incluso come **provider di messaggi primario** su un
host gateway, OpenClaw ora carica automaticamente il plugin incluso proprietario quando la tua configurazione
fa esplicitamente riferimento a quel backend in un riferimento modello o in
`agents.defaults.cliBackends`.

## Usarlo come fallback

Aggiungi un backend CLI all'elenco dei fallback in modo che venga eseguito solo quando i modelli primari falliscono:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Note:

- Se usi `agents.defaults.models` (allowlist), devi includere anche lì i modelli del tuo backend CLI.
- Se il provider primario fallisce (autenticazione, limiti di frequenza, timeout), OpenClaw
  proverà quindi il backend CLI.

## Panoramica della configurazione

Tutti i backend CLI si trovano sotto:

```
agents.defaults.cliBackends
```

Ogni voce è indicizzata da un **ID provider** (ad esempio `codex-cli`, `my-cli`).
L'ID provider diventa la parte sinistra del riferimento modello:

```
<provider>/<model>
```

### Esempio di configurazione

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Come funziona

1. **Seleziona un backend** in base al prefisso del provider (`codex-cli/...`).
2. **Costruisce un prompt di sistema** usando lo stesso prompt + contesto workspace di OpenClaw.
3. **Esegue la CLI** con un ID sessione (se supportato) così la cronologia resta coerente.
4. **Analizza l'output** (JSON o testo semplice) e restituisce il testo finale.
5. **Mantiene gli ID sessione** per backend, così i turni successivi riutilizzano la stessa sessione CLI.

<Note>
Il backend Anthropic `claude-cli` incluso è di nuovo supportato. Il personale Anthropic
ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw considera
l'uso di `claude -p` autorizzato per questa integrazione, a meno che Anthropic non pubblichi
una nuova policy.
</Note>

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad esempio `--session-id`) oppure
  `sessionArgs` (segnaposto `{sessionId}`) quando l'ID deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando resume** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` durante la ripresa) e facoltativamente `resumeOutput`
  (per riprese non JSON).
- `sessionMode`:
  - `always`: invia sempre un ID sessione (nuovo UUID se non ne è archiviato nessuno).
  - `existing`: invia un ID sessione solo se in precedenza ne è stato archiviato uno.
  - `none`: non invia mai un ID sessione.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni sulla stessa corsia.
- La maggior parte delle CLI serializza su una corsia provider.
- OpenClaw interrompe il riutilizzo della sessione CLI archiviata quando cambia lo stato di autenticazione del backend, inclusi nuovo login, rotazione del token o modifica della credenziale del profilo di autenticazione.

## Immagini (pass-through)

Se la tua CLI accetta percorsi di immagini, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, questi
percorsi vengono passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge i
percorsi dei file al prompt (iniezione del percorso), sufficiente per le CLI che caricano automaticamente
file locali da semplici percorsi.

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON ed estrarre testo + ID sessione.
- Per l'output JSON di Gemini CLI, OpenClaw legge il testo della risposta da `response` e
  l'utilizzo da `stats` quando `usage` è mancante o vuoto.
- `output: "jsonl"` analizza stream JSONL (ad esempio Codex CLI `--json`) ed estrae il messaggio finale dell'agente più gli identificatori
  di sessione quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità di input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Predefiniti (di proprietà del plugin)

Il plugin OpenAI incluso registra anche un predefinito per `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Il plugin Google incluso registra anche un predefinito per `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prerequisito: la Gemini CLI locale deve essere installata e disponibile come
`gemini` in `PATH` (`brew install gemini-cli` oppure
`npm install -g @google/gemini-cli`).

Note sul JSON di Gemini CLI:

- Il testo della risposta viene letto dal campo JSON `response`.
- L'utilizzo usa `stats` come fallback quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in `cacheRead` di OpenClaw.
- Se `stats.input` è mancante, OpenClaw ricava i token di input da
  `stats.input_tokens - stats.cached`.

Sostituisci solo se necessario (caso comune: percorso `command` assoluto).

## Predefiniti di proprietà del plugin

I predefiniti dei backend CLI ora fanno parte della superficie del plugin:

- I plugin li registrano con `api.registerCliBackend(...)`.
- L'`id` del backend diventa il prefisso provider nei riferimenti modello.
- La configurazione utente in `agents.defaults.cliBackends.<id>` continua a sovrascrivere il predefinito del plugin.
- La pulizia della configurazione specifica del backend resta di proprietà del plugin tramite l'hook facoltativo
  `normalizeConfig`.

## Overlay bundle MCP

I backend CLI **non** ricevono direttamente le chiamate agli strumenti di OpenClaw, ma un backend può
abilitare un overlay di configurazione MCP generato con `bundleMcp: true`.

Comportamento incluso attuale:

- `codex-cli`: nessun overlay bundle MCP
- `google-gemini-cli`: nessun overlay bundle MCP

Quando bundle MCP è abilitato, OpenClaw:

- avvia un server MCP HTTP loopback che espone gli strumenti del gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti alla sessione, all'account e al contesto di canale correnti
- carica i server bundle-MCP abilitati per il workspace corrente
- li unisce con qualsiasi `--mcp-config` backend esistente
- riscrive gli argomenti CLI per passare `--strict-mcp-config --mcp-config <generated-file>`

Se non sono abilitati server MCP, OpenClaw inietta comunque una configurazione strict quando un
backend abilita bundle MCP, così le esecuzioni in background restano isolate.

## Limitazioni

- **Nessuna chiamata diretta agli strumenti di OpenClaw.** OpenClaw non inietta chiamate agli strumenti nel
  protocollo del backend CLI. I backend vedono gli strumenti del gateway solo quando abilitano
  `bundleMcp: true`.
- **Lo streaming è specifico del backend.** Alcuni backend trasmettono JSONL in streaming; altri accumulano
  fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.
- **Le sessioni di Codex CLI** riprendono tramite output testuale (non JSONL), che è meno
  strutturato rispetto all'esecuzione iniziale con `--json`. Le sessioni OpenClaw continuano comunque a funzionare
  normalmente.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità di sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none` (al momento Codex CLI non può riprendere con output JSON).
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi di file).
