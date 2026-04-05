---
read_when:
    - Vuoi un fallback affidabile quando i provider API falliscono
    - Stai eseguendo Claude CLI o altre CLI AI locali e vuoi riutilizzarle
    - Vuoi capire il bridge loopback MCP per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback locale della CLI AI con bridge opzionale dello strumento MCP'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-05T13:51:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 823f3aeea6be50e5aa15b587e0944e79e862cecb7045f9dd44c93c544024bce1
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime di fallback)

OpenClaw può eseguire **CLI AI locali** come **fallback solo testo** quando i provider API non sono disponibili,
sono soggetti a limitazione di frequenza o si comportano temporaneamente in modo anomalo. Si tratta intenzionalmente di un approccio conservativo:

- **Gli strumenti OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  (il valore predefinito di Claude CLI) possono ricevere gli strumenti del gateway tramite un bridge loopback MCP.
- **Streaming JSONL** (Claude CLI usa `--output-format stream-json` con
  `--include-partial-messages`; i prompt vengono inviati tramite stdin).
- **Le sessioni sono supportate** (quindi i turni successivi rimangono coerenti).
- **Le immagini possono essere inoltrate** se la CLI accetta percorsi di immagini.

Questo è progettato come **rete di sicurezza** piuttosto che come percorso principale. Usalo quando
vuoi risposte di testo “sempre funzionanti” senza dipendere da API esterne.

Se vuoi un runtime harness completo con controlli di sessione ACP, attività in background,
binding thread/conversazione e sessioni di coding esterne persistenti, usa invece
[Agenti ACP](/tools/acp-agents). I backend CLI non sono ACP.

## Guida rapida per principianti

Puoi usare Claude CLI **senza alcuna configurazione** (il plugin Anthropic incluso
registra un backend predefinito):

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

Anche Codex CLI funziona subito (tramite il plugin OpenAI incluso):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Se il tuo gateway viene eseguito sotto launchd/systemd e PATH è minimale, aggiungi solo il
percorso del comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Questo è tutto. Non servono chiavi né configurazione di autenticazione aggiuntiva oltre a quella della CLI stessa.

Se usi un backend CLI incluso come **provider di messaggi principale** su un
host gateway, OpenClaw ora carica automaticamente il plugin incluso proprietario quando la tua configurazione
fa esplicito riferimento a quel backend in un riferimento di modello o sotto
`agents.defaults.cliBackends`.

## Usarlo come fallback

Aggiungi un backend CLI al tuo elenco di fallback in modo che venga eseguito solo quando i modelli primari falliscono:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6", "claude-cli/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
        "claude-cli/claude-opus-4-6": {},
      },
    },
  },
}
```

Note:

- Se usi `agents.defaults.models` (allowlist), devi includere `claude-cli/...`.
- Se il provider primario fallisce (autenticazione, limiti di frequenza, timeout), OpenClaw
  proverà poi il backend CLI.
- Il backend Claude CLI incluso accetta ancora alias più brevi come
  `claude-cli/opus`, `claude-cli/opus-4.6` o `claude-cli/sonnet`, ma la documentazione
  e gli esempi di configurazione usano i riferimenti canonici `claude-cli/claude-*`.

## Panoramica della configurazione

Tutti i backend CLI si trovano in:

```
agents.defaults.cliBackends
```

Ogni voce è identificata da un **id provider** (ad esempio `claude-cli`, `my-cli`).
L'id provider diventa il lato sinistro del tuo riferimento di modello:

```
<provider>/<model>
```

### Esempio di configurazione

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

1. **Seleziona un backend** in base al prefisso del provider (`claude-cli/...`).
2. **Costruisce un prompt di sistema** usando lo stesso prompt OpenClaw + il contesto del workspace.
3. **Esegue la CLI** con un id sessione (se supportato) in modo che la cronologia resti coerente.
4. **Analizza l'output** (JSON o testo semplice) e restituisce il testo finale.
5. **Rende persistenti gli id sessione** per backend, in modo che i turni successivi riutilizzino la stessa sessione CLI.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad esempio `--session-id`) oppure
  `sessionArgs` (segnaposto `{sessionId}`) quando l'id deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando di ripresa** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` durante la ripresa) e facoltativamente `resumeOutput`
  (per riprese non JSON).
- `sessionMode`:
  - `always`: invia sempre un id sessione (nuovo UUID se non ne è stato memorizzato uno).
  - `existing`: invia un id sessione solo se ne era già stato memorizzato uno.
  - `none`: non invia mai un id sessione.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni sulla stessa corsia.
- La maggior parte delle CLI serializza su una corsia provider.
- `claude-cli` è più ristretto: le esecuzioni riprese vengono serializzate per id sessione Claude, e le nuove esecuzioni per percorso del workspace. Workspace indipendenti possono essere eseguiti in parallelo.
- OpenClaw interrompe il riutilizzo della sessione CLI memorizzata quando cambia lo stato di autenticazione del backend, inclusi nuovo login, rotazione del token o modifica di una credenziale del profilo di autenticazione.

## Immagini (inoltro diretto)

Se la tua CLI accetta percorsi di immagini, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, questi
percorsi vengono passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge i
percorsi dei file al prompt (iniezione del percorso), sufficiente per le CLI che caricano automaticamente
file locali da percorsi in chiaro (comportamento di Claude CLI).

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON ed estrarre testo + id sessione.
- Per l'output JSON di Gemini CLI, OpenClaw legge il testo della risposta da `response` e
  l'utilizzo da `stats` quando `usage` manca o è vuoto.
- `output: "jsonl"` analizza flussi JSONL (ad esempio Claude CLI `stream-json`
  e Codex CLI `--json`) ed estrae il messaggio finale dell'agente più gli identificatori
  di sessione quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità di input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Predefiniti (di proprietà del plugin)

Il plugin Anthropic incluso registra un backend predefinito per `claude-cli`:

- `command: "claude"`
- `args: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

Anche il plugin OpenAI incluso registra un backend predefinito per `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Anche il plugin Google incluso registra un backend predefinito per `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prerequisito: la CLI Gemini locale deve essere installata e disponibile come
`gemini` in `PATH` (`brew install gemini-cli` oppure
`npm install -g @google/gemini-cli`).

Note sul JSON di Gemini CLI:

- Il testo della risposta viene letto dal campo JSON `response`.
- L'utilizzo usa `stats` come fallback quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
- Se `stats.input` manca, OpenClaw ricava i token di input da
  `stats.input_tokens - stats.cached`.

Sovrascrivi solo se necessario (caso comune: percorso `command` assoluto).

## Predefiniti di proprietà del plugin

I predefiniti dei backend CLI ora fanno parte della superficie del plugin:

- I plugin li registrano con `api.registerCliBackend(...)`.
- L'`id` del backend diventa il prefisso provider nei riferimenti di modello.
- La configurazione utente in `agents.defaults.cliBackends.<id>` continua a sovrascrivere il predefinito del plugin.
- La pulizia della configurazione specifica del backend rimane di proprietà del plugin tramite l'hook facoltativo `normalizeConfig`.

## Overlay Bundle MCP

I backend CLI **non** ricevono direttamente le chiamate agli strumenti OpenClaw, ma un backend può
aderire a una configurazione overlay MCP generata con `bundleMcp: true`.

Comportamento incluso attuale:

- `claude-cli`: `bundleMcp: true` (predefinito)
- `codex-cli`: nessun overlay bundle MCP
- `google-gemini-cli`: nessun overlay bundle MCP

Quando bundle MCP è abilitato, OpenClaw:

- avvia un server HTTP MCP loopback che espone gli strumenti del gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti alla sessione corrente, all'account e al contesto del canale
- carica i server bundle-MCP abilitati per il workspace corrente
- li unisce con qualsiasi backend `--mcp-config` esistente
- riscrive gli argomenti CLI per passare `--strict-mcp-config --mcp-config <generated-file>`

Il flag `--strict-mcp-config` impedisce a Claude CLI di ereditare server MCP ambientali
a livello utente o globali. Se non è abilitato alcun server MCP, OpenClaw
inietta comunque una configurazione vuota rigorosa in modo che le esecuzioni in background restino isolate.

## Limitazioni

- **Nessuna chiamata diretta agli strumenti OpenClaw.** OpenClaw non inietta chiamate agli strumenti nel
  protocollo del backend CLI. Tuttavia, i backend con `bundleMcp: true` (il
  valore predefinito di Claude CLI) ricevono gli strumenti del gateway tramite un bridge loopback MCP,
  quindi Claude CLI può invocare gli strumenti OpenClaw tramite il proprio supporto MCP nativo.
- **Lo streaming è specifico del backend.** Claude CLI usa streaming JSONL
  (`stream-json` con `--include-partial-messages`); altri backend CLI possono
  ancora essere bufferizzati fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.
- **Le sessioni Codex CLI** riprendono tramite output di testo (nessun JSONL), che è meno
  strutturato rispetto all'esecuzione iniziale `--json`. Le sessioni OpenClaw continuano comunque a funzionare
  normalmente.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome del modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità di sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none` (attualmente Codex CLI non può riprendere con output JSON).
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi dei file).
