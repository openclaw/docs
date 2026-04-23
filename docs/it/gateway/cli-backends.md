---
read_when:
    - Vuoi un fallback affidabile quando i provider API falliscono
    - Stai eseguendo Codex CLI o altre CLI AI locali e vuoi riutilizzarle
    - Vuoi capire il bridge MCP loopback per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback CLI AI locale con bridge degli strumenti MCP facoltativo'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-23T08:28:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 475923b36e4580d3e4e57014ff2e6b89e9eb52c11b0a0ab1fc8241655b07836e
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime di fallback)

OpenClaw può eseguire **CLI AI locali** come **fallback solo testo** quando i provider API non sono disponibili,
sono soggetti a rate limit o si comportano male temporaneamente. Si tratta intenzionalmente di una soluzione conservativa:

- **Gli strumenti OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  possono ricevere strumenti gateway tramite un bridge MCP loopback.
- **Streaming JSONL** per le CLI che lo supportano.
- **Le sessioni sono supportate** (così i turni di follow-up restano coerenti).
- **Le immagini possono essere inoltrate** se la CLI accetta percorsi immagine.

Questo è progettato come **rete di sicurezza** piuttosto che come percorso primario. Usalo quando
vuoi risposte testuali “sempre funzionanti” senza dipendere da API esterne.

Se vuoi un runtime harness completo con controlli di sessione ACP, attività in background,
associazione di thread/conversazioni e sessioni di coding esterne persistenti, usa invece
[ACP Agents](/it/tools/acp-agents). I backend CLI non sono ACP.

## Avvio rapido per principianti

Puoi usare Codex CLI **senza alcuna config** (il Plugin OpenAI incluso
registra un backend predefinito):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Se il tuo gateway viene eseguito sotto launchd/systemd e il PATH è minimo, aggiungi solo il
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

Questo è tutto. Nessuna chiave, nessuna config di autenticazione extra oltre a quella della CLI stessa.

Se usi un backend CLI incluso come **provider di messaggi primario** su un
host gateway, OpenClaw ora carica automaticamente il Plugin incluso proprietario quando la tua config
fa riferimento esplicito a quel backend in un riferimento modello o sotto
`agents.defaults.cliBackends`.

## Usarlo come fallback

Aggiungi un backend CLI al tuo elenco di fallback in modo che venga eseguito solo quando i modelli primari falliscono:

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
- Se il provider primario fallisce (autenticazione, rate limit, timeout), OpenClaw
  proverà successivamente il backend CLI.

## Panoramica della configurazione

Tutti i backend CLI si trovano sotto:

```
agents.defaults.cliBackends
```

Ogni voce è indicizzata da un **id provider** (ad esempio `codex-cli`, `my-cli`).
L'id provider diventa la parte sinistra del tuo riferimento modello:

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
          // Le CLI in stile Codex possono invece puntare a un file prompt:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
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
   Il backend incluso `claude-cli` mantiene vivo un processo Claude stdio per
   sessione OpenClaw e invia i turni di follow-up tramite stdin stream-json.
4. **Analizza l'output** (JSON o testo semplice) e restituisce il testo finale.
5. **Rende persistenti gli ID sessione** per backend, così i follow-up riutilizzano la stessa sessione CLI.

<Note>
Il backend incluso Anthropic `claude-cli` è di nuovo supportato. Lo staff Anthropic
ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw tratta
l'uso di `claude -p` come autorizzato per questa integrazione, salvo che Anthropic pubblichi
una nuova policy.
</Note>

Il backend incluso OpenAI `codex-cli` passa il prompt di sistema di OpenClaw tramite
l'override di config `model_instructions_file` di Codex (`-c
model_instructions_file="..."`). Codex non espone un flag in stile Claude
`--append-system-prompt`, quindi OpenClaw scrive il prompt assemblato in un
file temporaneo per ogni nuova sessione Codex CLI.

Il backend incluso Anthropic `claude-cli` riceve lo snapshot delle Skills OpenClaw
in due modi: il catalogo compatto delle Skills OpenClaw nel prompt di sistema aggiunto, e
un Plugin Claude Code temporaneo passato con `--plugin-dir`. Il Plugin contiene
solo le skill idonee per quell'agente/sessione, quindi il resolver di skill nativo di Claude Code
vede lo stesso insieme filtrato che OpenClaw altrimenti pubblicizzerebbe nel prompt.
Gli override di env/API key delle skill vengono comunque applicati da OpenClaw all'ambiente del processo figlio per l'esecuzione.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad esempio `--session-id`) oppure
  `sessionArgs` (segnaposto `{sessionId}`) quando l'ID deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando di ripresa** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` durante la ripresa) e facoltativamente `resumeOutput`
  (per riprese non JSON).
- `sessionMode`:
  - `always`: invia sempre un ID sessione (nuovo UUID se non ne è stato salvato nessuno).
  - `existing`: invia un ID sessione solo se ne era già stato salvato uno.
  - `none`: non invia mai un ID sessione.
- `claude-cli` usa come valori predefiniti `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` così i turni di follow-up riutilizzano il processo Claude attivo
  mentre è attivo. Lo stdio caldo è ora il valore predefinito, anche per config personalizzate
  che omettono i campi di trasporto. Se il Gateway si riavvia o il processo inattivo termina,
  OpenClaw riprende dall'ID sessione Claude memorizzato. Gli ID sessione memorizzati vengono verificati
  rispetto a una trascrizione di progetto esistente e leggibile prima della ripresa, così
  le associazioni fantasma vengono cancellate con `reason=transcript-missing`
  invece di avviare silenziosamente una nuova sessione Claude CLI con `--resume`.
- Le sessioni CLI memorizzate sono continuità gestita dal provider. Il reset giornaliero implicito
  non le interrompe; `/reset` e le policy esplicite `session.reset` sì.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni sulla stessa corsia.
- La maggior parte delle CLI serializza su una corsia provider.
- OpenClaw interrompe il riutilizzo delle sessioni CLI memorizzate quando cambia l'identità di autenticazione selezionata,
  inclusi un ID profilo auth cambiato, una API key statica, un token statico o l'identità
  dell'account OAuth quando la CLI ne espone una. La rotazione dei token OAuth di accesso e refresh
  non interrompe la sessione CLI memorizzata. Se una CLI non espone un ID account OAuth stabile,
  OpenClaw lascia che sia quella CLI a far rispettare i permessi di ripresa.

## Immagini (pass-through)

Se la tua CLI accetta percorsi immagine, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, quei
percorsi vengono passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge i
percorsi file al prompt (path injection), che è sufficiente per le CLI che caricano automaticamente
file locali da percorsi semplici.

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON e a estrarre testo + ID sessione.
- Per l'output JSON di Gemini CLI, OpenClaw legge il testo della risposta da `response` e
  l'uso da `stats` quando `usage` manca o è vuoto.
- `output: "jsonl"` analizza stream JSONL (ad esempio Codex CLI `--json`) ed estrae il messaggio finale dell'agente più gli identificatori di sessione
  quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità di input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Valori predefiniti (gestiti dal Plugin)

Il Plugin OpenAI incluso registra anche un valore predefinito per `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Il Plugin Google incluso registra anche un valore predefinito per `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prerequisito: la Gemini CLI locale deve essere installata e disponibile come
`gemini` nel `PATH` (`brew install gemini-cli` o
`npm install -g @google/gemini-cli`).

Note JSON di Gemini CLI:

- Il testo della risposta viene letto dal campo JSON `response`.
- L'uso ricade su `stats` quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in `cacheRead` di OpenClaw.
- Se `stats.input` manca, OpenClaw ricava i token di input da
  `stats.input_tokens - stats.cached`.

Esegui override solo se necessario (caso comune: percorso `command` assoluto).

## Valori predefiniti gestiti dal Plugin

I valori predefiniti del backend CLI fanno ora parte della surface del Plugin:

- I plugin li registrano con `api.registerCliBackend(...)`.
- Il `id` del backend diventa il prefisso provider nei riferimenti modello.
- La config utente in `agents.defaults.cliBackends.<id>` continua a sovrascrivere il valore predefinito del Plugin.
- La pulizia della config specifica del backend resta gestita dal Plugin tramite l'hook facoltativo
  `normalizeConfig`.

I plugin che hanno bisogno di piccoli shim di compatibilità prompt/messaggio possono dichiarare
trasformazioni testuali bidirezionali senza sostituire un provider o un backend CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` riscrive il prompt di sistema e il prompt utente passati alla CLI. `output`
riscrive i delta dell'assistente in streaming e il testo finale analizzato prima che OpenClaw gestisca
i propri marker di controllo e la consegna sul canale.

Per le CLI che emettono JSONL compatibile con lo stream-json di Claude Code, imposta
`jsonlDialect: "claude-stream-json"` nella config di quel backend.

## Overlay MCP bundle

I backend CLI **non** ricevono direttamente chiamate agli strumenti OpenClaw, ma un backend può
abilitare una overlay di config MCP generata con `bundleMcp: true`.

Comportamento attualmente incluso:

- `claude-cli`: file di config MCP strict generato
- `codex-cli`: override di config inline per `mcp_servers`
- `google-gemini-cli`: file di impostazioni di sistema Gemini generato

Quando bundle MCP è abilitato, OpenClaw:

- avvia un server MCP HTTP loopback che espone strumenti gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti alla sessione, all'account e al contesto del canale correnti
- carica i server bundle-MCP abilitati per il workspace corrente
- li unisce con qualsiasi forma di config/impostazioni MCP backend esistente
- riscrive la config di avvio usando la modalità di integrazione gestita dal backend dell'estensione proprietaria

Se non è abilitato alcun server MCP, OpenClaw inietta comunque una config strict quando un
backend abilita bundle MCP così che le esecuzioni in background restino isolate.

## Limitazioni

- **Nessuna chiamata diretta agli strumenti OpenClaw.** OpenClaw non inietta chiamate agli strumenti nel
  protocollo del backend CLI. I backend vedono gli strumenti gateway solo quando abilitano
  `bundleMcp: true`.
- **Lo streaming è specifico del backend.** Alcuni backend trasmettono JSONL; altri fanno buffering
  fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.
- **Le sessioni Codex CLI** riprendono tramite output testuale (senza JSONL), che è meno
  strutturato rispetto all'esecuzione iniziale con `--json`. Le sessioni OpenClaw continuano comunque a funzionare
  normalmente.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità di sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none` (Codex CLI attualmente non può riprendere con output JSON).
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi file).
