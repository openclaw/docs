---
read_when:
    - Vuoi un fallback affidabile quando i provider API falliscono
    - Stai eseguendo Codex CLI o altre CLI AI locali e vuoi riutilizzarle
    - Vuoi capire il bridge MCP local loopback per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback CLI AI locale con bridge opzionale degli strumenti MCP'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-24T08:39:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime di fallback)

OpenClaw può eseguire **CLI AI locali** come **fallback solo testuale** quando i provider API non sono disponibili,
sono soggetti a rate limit o si comportano temporaneamente male. Questo approccio è intenzionalmente conservativo:

- **Gli strumenti OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  possono ricevere gli strumenti del gateway tramite un bridge MCP local loopback.
- **Streaming JSONL** per le CLI che lo supportano.
- **Le sessioni sono supportate** (quindi i turni successivi restano coerenti).
- **Le immagini possono essere passate** se la CLI accetta percorsi di immagini.

Questo è pensato come una **rete di sicurezza** più che come percorso principale. Usalo quando
vuoi risposte testuali “funziona sempre” senza dipendere da API esterne.

Se vuoi un runtime harness completo con controlli delle sessioni ACP, attività in background,
binding thread/conversazione e sessioni di coding esterne persistenti, usa invece
[Agenti ACP](/it/tools/acp-agents). I backend CLI non sono ACP.

## Avvio rapido semplice

Puoi usare Codex CLI **senza alcuna configurazione** (il Plugin OpenAI incluso
registra un backend predefinito):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Se il tuo gateway gira sotto launchd/systemd e il PATH è minimale, aggiungi solo il
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

Questo è tutto. Nessuna chiave, nessuna configurazione auth extra oltre a quella già usata dalla CLI stessa.

Se usi un backend CLI incluso come **provider di messaggi primario** su un
host gateway, OpenClaw ora carica automaticamente il Plugin incluso proprietario quando la tua configurazione
fa esplicito riferimento a quel backend in un model ref o sotto
`agents.defaults.cliBackends`.

## Usarlo come fallback

Aggiungi un backend CLI alla tua lista di fallback così verrà eseguito solo quando i modelli primari falliscono:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Note:

- Se usi `agents.defaults.models` (allowlist), devi includere lì anche i modelli del tuo backend CLI.
- Se il provider primario fallisce (auth, rate limit, timeout), OpenClaw proverà
  il backend CLI come passo successivo.

## Panoramica della configurazione

Tutti i backend CLI si trovano sotto:

```
agents.defaults.cliBackends
```

Ogni voce è indicizzata da un **ID provider** (ad esempio `codex-cli`, `my-cli`).
L'ID provider diventa la parte sinistra del tuo model ref:

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
          // Le CLI in stile Codex possono invece puntare a un file di prompt:
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
2. **Costruisce un prompt di sistema** usando lo stesso prompt OpenClaw + contesto del workspace.
3. **Esegue la CLI** con un ID sessione (se supportato) così la cronologia resta coerente.
   Il backend incluso `claude-cli` mantiene vivo un processo stdio Claude per ogni
   sessione OpenClaw e invia i turni successivi tramite stdin stream-json.
4. **Analizza l'output** (JSON o testo semplice) e restituisce il testo finale.
5. **Mantiene gli ID sessione** per backend, così i follow-up riutilizzano la stessa sessione CLI.

<Note>
Il backend Anthropic incluso `claude-cli` è di nuovo supportato. Il personale Anthropic
ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw tratta
l'uso di `claude -p` come approvato per questa integrazione, a meno che Anthropic non pubblichi
una nuova policy.
</Note>

Il backend OpenAI incluso `codex-cli` passa il prompt di sistema di OpenClaw tramite
l'override di configurazione `model_instructions_file` di Codex (`-c
model_instructions_file="..."`). Codex non espone un flag in stile Claude
`--append-system-prompt`, quindi OpenClaw scrive il prompt assemblato in un
file temporaneo per ogni nuova sessione Codex CLI.

Il backend Anthropic incluso `claude-cli` riceve lo snapshot Skills di OpenClaw
in due modi: il catalogo compatto Skills di OpenClaw nel prompt di sistema aggiunto, e
un Plugin temporaneo Claude Code passato con `--plugin-dir`. Il Plugin contiene
solo le Skills idonee per quell'agente/sessione, così il resolver nativo delle skill di Claude Code vede lo stesso insieme filtrato che OpenClaw altrimenti pubblicizzerebbe nel
prompt. Gli override di variabili d'ambiente/chiavi API delle skill vengono comunque applicati da OpenClaw all'ambiente del processo figlio per l'esecuzione.

Claude CLI ha anche una propria modalità di permessi non interattiva. OpenClaw la mappa
ai criteri exec esistenti invece di aggiungere configurazione specifica per Claude: quando il
criterio exec richiesto effettivo è YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`), OpenClaw aggiunge `--permission-mode bypassPermissions`.
Le impostazioni per agente `agents.list[].tools.exec` sovrascrivono `tools.exec` globale per
quell'agente. Per forzare una modalità Claude diversa, imposta argomenti raw espliciti del backend
come `--permission-mode default` o `--permission-mode acceptEdits` sotto
`agents.defaults.cliBackends.claude-cli.args` e i corrispondenti `resumeArgs`.

Prima che OpenClaw possa usare il backend incluso `claude-cli`, Claude Code stesso
deve essere già autenticato sullo stesso host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Usa `agents.defaults.cliBackends.claude-cli.command` solo quando il binario `claude`
non è già nel `PATH`.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad esempio `--session-id`) oppure
  `sessionArgs` (placeholder `{sessionId}`) quando l'ID deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando resume** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` durante la ripresa) e facoltativamente `resumeOutput`
  (per resume non JSON).
- `sessionMode`:
  - `always`: invia sempre un ID sessione (nuovo UUID se non ne è stato memorizzato nessuno).
  - `existing`: invia un ID sessione solo se in precedenza ne era stato memorizzato uno.
  - `none`: non invia mai un ID sessione.
- `claude-cli` usa come predefiniti `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` così i turni successivi riutilizzano il processo Claude live mentre
  è attivo. Lo stdio warm è ora il predefinito, anche per configurazioni personalizzate
  che omettono i campi di trasporto. Se il Gateway si riavvia o il processo inattivo
  termina, OpenClaw riprende dall'ID sessione Claude memorizzato. Gli ID sessione
  memorizzati vengono verificati rispetto a una trascrizione di progetto esistente e leggibile prima del
  resume, così i binding fantasma vengono cancellati con `reason=transcript-missing`
  invece di avviare silenziosamente una nuova sessione Claude CLI sotto `--resume`.
- Le sessioni CLI memorizzate sono continuità gestita dal provider. Il reset giornaliero implicito
  non le interrompe; `/reset` e i criteri espliciti `session.reset` invece sì.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni sulla stessa lane.
- La maggior parte delle CLI serializza su una lane provider.
- OpenClaw abbandona il riutilizzo della sessione CLI memorizzata quando cambia l'identità auth selezionata,
  incluso un ID profilo auth cambiato, una chiave API statica, un token statico o l'identità dell'account OAuth quando la CLI la espone. La rotazione del token di accesso e di refresh OAuth
  non interrompe la sessione CLI memorizzata. Se una CLI non espone un
  ID account OAuth stabile, OpenClaw lascia che sia quella CLI a imporre i permessi di resume.

## Immagini (pass-through)

Se la tua CLI accetta percorsi di immagini, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, questi
percorsi vengono passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge i
percorsi dei file al prompt (path injection), il che basta per le CLI che caricano automaticamente
i file locali da semplici percorsi.

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON ed estrarre testo + ID sessione.
- Per l'output JSON di Gemini CLI, OpenClaw legge il testo della risposta da `response` e
  l'utilizzo da `stats` quando `usage` è mancante o vuoto.
- `output: "jsonl"` analizza stream JSONL (per esempio Codex CLI `--json`) ed estrae il messaggio finale dell'agente più gli identificatori di sessione
  quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt via stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Valori predefiniti (gestiti dal Plugin)

Il Plugin OpenAI incluso registra anche un predefinito per `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Il Plugin Google incluso registra anche un predefinito per `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prerequisito: la Gemini CLI locale deve essere installata e disponibile come
`gemini` nel `PATH` (`brew install gemini-cli` oppure
`npm install -g @google/gemini-cli`).

Note sul JSON di Gemini CLI:

- Il testo della risposta viene letto dal campo JSON `response`.
- L'utilizzo ripiega su `stats` quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
- Se `stats.input` manca, OpenClaw deriva i token di input da
  `stats.input_tokens - stats.cached`.

Sovrascrivi solo se necessario (caso comune: percorso `command` assoluto).

## Valori predefiniti gestiti dal Plugin

I valori predefiniti dei backend CLI ora fanno parte della superficie del Plugin:

- I Plugin li registrano con `api.registerCliBackend(...)`.
- L'`id` del backend diventa il prefisso provider nei model ref.
- La configurazione utente in `agents.defaults.cliBackends.<id>` continua a sovrascrivere il default del Plugin.
- La pulizia della configurazione specifica del backend resta di proprietà del Plugin tramite l'hook facoltativo
  `normalizeConfig`.

I Plugin che hanno bisogno di piccoli shim di compatibilità di prompt/messaggi possono dichiarare
trasformazioni testuali bidirezionali senza sostituire un provider o backend CLI:

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
riscrive i delta in streaming dell'assistente e il testo finale analizzato prima che OpenClaw gestisca
i propri marcatori di controllo e la consegna al canale.

Per le CLI che emettono JSONL compatibile con lo stream-json di Claude Code, imposta
`jsonlDialect: "claude-stream-json"` nella configurazione di quel backend.

## Overlay MCP inclusi

I backend CLI **non** ricevono direttamente le chiamate degli strumenti OpenClaw, ma un backend può
scegliere di usare un overlay di configurazione MCP generato con `bundleMcp: true`.

Comportamento incluso attuale:

- `claude-cli`: file di configurazione MCP strict generato
- `codex-cli`: override di configurazione inline per `mcp_servers`; il server
  local loopback OpenClaw generato è contrassegnato con la modalità di approvazione strumenti per server di Codex
  così le chiamate MCP non possono bloccarsi su prompt di approvazione locali
- `google-gemini-cli`: file di impostazioni di sistema Gemini generato

Quando bundle MCP è abilitato, OpenClaw:

- avvia un server MCP HTTP local loopback che espone gli strumenti del gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti alla sessione corrente, all'account e al contesto del canale
- carica i server bundle-MCP abilitati per il workspace corrente
- li unisce con qualsiasi configurazione/forma di impostazioni MCP del backend già esistente
- riscrive la configurazione di avvio usando la modalità di integrazione gestita dal backend dell'estensione proprietaria

Se nessun server MCP è abilitato, OpenClaw inietta comunque una configurazione strict quando un
backend sceglie bundle MCP così le esecuzioni in background restano isolate.

## Limitazioni

- **Nessuna chiamata diretta agli strumenti OpenClaw.** OpenClaw non inietta chiamate di strumenti nel
  protocollo del backend CLI. I backend vedono gli strumenti del gateway solo quando scelgono
  `bundleMcp: true`.
- **Lo streaming è specifico del backend.** Alcuni backend fanno streaming JSONL; altri bufferizzano
  fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.
- **Le sessioni Codex CLI** riprendono tramite output testuale (non JSONL), che è meno
  strutturato rispetto all'esecuzione iniziale con `--json`. Le sessioni OpenClaw continuano comunque a funzionare normalmente.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità di sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none` (attualmente Codex CLI non può riprendere con output JSON).
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi di file).

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Modelli locali](/it/gateway/local-models)
