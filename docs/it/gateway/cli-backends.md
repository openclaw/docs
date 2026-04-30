---
read_when:
    - Vuoi un fallback affidabile quando i provider API non funzionano
    - Stai eseguendo Codex CLI o altre CLI di IA locali e vuoi riutilizzarle
    - Vuoi comprendere il ponte di loopback MCP per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback CLI IA locale con bridge opzionale per strumenti MCP'
title: Backend della CLI
x-i18n:
    generated_at: "2026-04-30T08:49:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw può eseguire **CLI AI locali** come **fallback solo testo** quando i provider API sono non disponibili,
soggetti a rate limit o temporaneamente instabili. Questo è intenzionalmente conservativo:

- **Gli strumenti OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  possono ricevere gli strumenti del gateway tramite un bridge MCP loopback.
- **Streaming JSONL** per le CLI che lo supportano.
- **Le sessioni sono supportate** (quindi i turni successivi restano coerenti).
- **Le immagini possono essere inoltrate** se la CLI accetta percorsi immagine.

Questo è progettato come una **rete di sicurezza** più che come percorso principale. Usalo quando vuoi
risposte testuali che “funzionano sempre” senza dipendere da API esterne.

Se vuoi un runtime harness completo con controlli di sessione ACP, attività in background,
binding di thread/conversazione e sessioni di coding esterne persistenti, usa invece
[Agenti ACP](/it/tools/acp-agents). I backend CLI non sono ACP.

## Avvio rapido per principianti

Puoi usare Codex CLI **senza alcuna configurazione** (il Plugin OpenAI incluso
registra un backend predefinito):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Se il tuo gateway viene eseguito sotto launchd/systemd e PATH è minimo, aggiungi solo il
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

Tutto qui. Nessuna chiave, nessuna configurazione di autenticazione aggiuntiva oltre alla CLI stessa.

Se usi un backend CLI incluso come **provider di messaggi principale** su un
host gateway, OpenClaw ora carica automaticamente il Plugin incluso proprietario quando la tua configurazione
fa esplicito riferimento a quel backend in un riferimento modello o sotto
`agents.defaults.cliBackends`.

## Usarlo come fallback

Aggiungi un backend CLI alla tua lista di fallback in modo che venga eseguito solo quando i modelli principali falliscono:

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

- Se usi `agents.defaults.models` (allowlist), devi includere anche lì i modelli del tuo backend CLI.
- Se il provider principale fallisce (autenticazione, rate limit, timeout), OpenClaw proverà
  poi il backend CLI.

## Panoramica della configurazione

Tutti i backend CLI vivono sotto:

```
agents.defaults.cliBackends
```

Ogni voce usa come chiave un **ID provider** (per esempio `codex-cli`, `my-cli`).
L’ID provider diventa il lato sinistro del tuo riferimento modello:

```
<provider>/<model>
```

### Configurazione di esempio

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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
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

1. **Seleziona un backend** in base al prefisso provider (`codex-cli/...`).
2. **Costruisce un prompt di sistema** usando lo stesso prompt OpenClaw + contesto del workspace.
3. **Esegue la CLI** con un ID sessione (se supportato) in modo che la cronologia resti coerente.
   Il backend `claude-cli` incluso mantiene vivo un processo stdio Claude per ogni
   sessione OpenClaw e invia i turni successivi tramite stdin stream-json.
4. **Analizza l’output** (JSON o testo semplice) e restituisce il testo finale.
5. **Persiste gli ID sessione** per backend, così i follow-up riusano la stessa sessione CLI.

<Note>
Il backend Anthropic `claude-cli` incluso è di nuovo supportato. Il personale Anthropic
ci ha detto che l’uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw considera
l’uso di `claude -p` autorizzato per questa integrazione a meno che Anthropic pubblichi
una nuova policy.
</Note>

Il backend OpenAI `codex-cli` incluso passa il prompt di sistema di OpenClaw tramite
l’override di configurazione `model_instructions_file` di Codex (`-c
model_instructions_file="..."`). Codex non espone un flag in stile Claude
`--append-system-prompt`, quindi OpenClaw scrive il prompt assemblato in un
file temporaneo per ogni nuova sessione Codex CLI.

Il backend Anthropic `claude-cli` incluso riceve lo snapshot delle Skills OpenClaw
in due modi: il catalogo compatto delle Skills OpenClaw nel prompt di sistema aggiunto, e
un Plugin temporaneo Claude Code passato con `--plugin-dir`. Il Plugin contiene
solo le Skills idonee per quell’agente/sessione, quindi il risolutore di skill nativo di Claude Code
vede lo stesso insieme filtrato che OpenClaw altrimenti pubblicizzerebbe nel
prompt. Gli override env/API key delle skill vengono comunque applicati da OpenClaw
all’ambiente del processo figlio per l’esecuzione.

Claude CLI ha anche una propria modalità di permessi non interattiva. OpenClaw la mappa
alla policy exec esistente invece di aggiungere configurazione specifica per Claude: quando la
policy exec richiesta effettiva è YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`), OpenClaw aggiunge `--permission-mode bypassPermissions`.
Le impostazioni per agente `agents.list[].tools.exec` sovrascrivono `tools.exec` globale per
quell’agente. Per forzare una modalità Claude diversa, imposta argomenti backend raw espliciti
come `--permission-mode default` o `--permission-mode acceptEdits` sotto
`agents.defaults.cliBackends.claude-cli.args` e `resumeArgs` corrispondenti.

Prima che OpenClaw possa usare il backend `claude-cli` incluso, Claude Code stesso
deve già aver effettuato l’accesso sullo stesso host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Usa `agents.defaults.cliBackends.claude-cli.command` solo quando il binario `claude`
non è già in `PATH`.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (per esempio `--session-id`) oppure
  `sessionArgs` (placeholder `{sessionId}`) quando l’ID deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando di ripresa** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` durante la ripresa) e facoltativamente `resumeOutput`
  (per riprese non JSON).
- `sessionMode`:
  - `always`: invia sempre un ID sessione (nuovo UUID se nessuno è memorizzato).
  - `existing`: invia un ID sessione solo se ne era stato memorizzato uno prima.
  - `none`: non inviare mai un ID sessione.
- `claude-cli` usa come predefiniti `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` così i turni successivi riusano il processo Claude live mentre
  è attivo. Lo stdio warm è ora il valore predefinito, anche per configurazioni personalizzate
  che omettono i campi di trasporto. Se il Gateway si riavvia o il processo inattivo
  esce, OpenClaw riprende dall’ID sessione Claude memorizzato. Gli ID sessione
  memorizzati vengono verificati rispetto a una trascrizione di progetto leggibile esistente prima della
  ripresa, quindi i binding fantasma vengono rimossi con `reason=transcript-missing`
  invece di avviare silenziosamente una nuova sessione Claude CLI sotto `--resume`.
- Le sessioni CLI memorizzate sono continuità di proprietà del provider. Il reset implicito della sessione giornaliera
  non le interrompe; `/reset` e le policy esplicite `session.reset` lo fanno comunque.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni sulla stessa corsia.
- La maggior parte delle CLI serializza su una sola corsia provider.
- OpenClaw elimina il riuso della sessione CLI memorizzata quando l’identità di autenticazione selezionata cambia,
  incluso un ID profilo di autenticazione modificato, una chiave API statica, un token statico o l’identità
  account OAuth quando la CLI ne espone una. La rotazione dei token di accesso e refresh OAuth
  non interrompe la sessione CLI memorizzata. Se una CLI non espone un
  ID account OAuth stabile, OpenClaw lascia che quella CLI applichi i permessi di ripresa.

## Preambolo di fallback dalle sessioni claude-cli

Quando un tentativo `claude-cli` passa per errore a un candidato non CLI in
[`agents.defaults.model.fallbacks`](/it/concepts/model-failover), OpenClaw inizializza
il tentativo successivo con un preambolo di contesto raccolto dalla trascrizione JSONL locale
di Claude Code in `~/.claude/projects/`. Senza questo seed, il provider
di fallback partirebbe a freddo perché la trascrizione della sessione di OpenClaw è vuota
per le esecuzioni `claude-cli`.

- Il preambolo preferisce l’ultimo riepilogo `/compact` o marker `compact_boundary`,
  poi aggiunge i turni post-boundary più recenti fino a un budget di caratteri.
  I turni pre-boundary vengono scartati perché il riepilogo li rappresenta già.
- I blocchi strumento vengono coalesci in suggerimenti compatti `(tool call: name)` e
  `(tool result: …)` per mantenere onesto il budget del prompt. Il riepilogo viene
  etichettato `(truncated)` se supera il limite.
- I fallback da `claude-cli` a `claude-cli` dello stesso provider si affidano al
  `--resume` di Claude e saltano il preambolo.
- Il seed riusa la validazione esistente del percorso file di sessione Claude, quindi
  non è possibile leggere percorsi arbitrari.

## Immagini (inoltro)

Se la tua CLI accetta percorsi immagine, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, quei
percorsi vengono passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge i
percorsi dei file al prompt (iniezione di percorso), il che è sufficiente per le CLI che caricano automaticamente
file locali da percorsi semplici.

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON ed estrarre testo + ID sessione.
- Per l’output JSON di Gemini CLI, OpenClaw legge il testo della risposta da `response` e
  l’utilizzo da `stats` quando `usage` manca o è vuoto.
- `output: "jsonl"` analizza stream JSONL (per esempio Codex CLI `--json`) ed estrae il messaggio finale dell’agente più gli identificatori di sessione
  quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità di input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Predefiniti (di proprietà del Plugin)

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
`gemini` in `PATH` (`brew install gemini-cli` oppure
`npm install -g @google/gemini-cli`).

Note JSON di Gemini CLI:

- Il testo della risposta viene letto dal campo JSON `response`.
- L’utilizzo ripiega su `stats` quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in `cacheRead` OpenClaw.
- Se `stats.input` manca, OpenClaw deriva i token di input da
  `stats.input_tokens - stats.cached`.

Sovrascrivi solo se necessario (caso comune: percorso `command` assoluto).

## Predefiniti di proprietà del Plugin

I predefiniti dei backend CLI ora fanno parte della superficie del Plugin:

- I Plugin li registrano con `api.registerCliBackend(...)`.
- L’`id` del backend diventa il prefisso provider nei riferimenti modello.
- La configurazione utente in `agents.defaults.cliBackends.<id>` sovrascrive comunque il valore predefinito del Plugin.
- La pulizia della configurazione specifica del backend resta di proprietà del Plugin tramite l’hook opzionale
  `normalizeConfig`.

I Plugin che necessitano di piccoli shim di compatibilità per prompt/messaggi possono dichiarare
trasformazioni di testo bidirezionali senza sostituire un provider o un backend CLI:

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
i propri marcatori di controllo e la consegna al canale.

Per le CLI che emettono JSONL compatibile con Claude Code stream-json, imposta
`jsonlDialect: "claude-stream-json"` nella configurazione di quel backend.

## Overlay MCP in bundle

I backend CLI **non** ricevono direttamente le chiamate agli strumenti OpenClaw, ma un backend può
aderire a un overlay di configurazione MCP generato con `bundleMcp: true`.

Comportamento attualmente incluso:

- `claude-cli`: file di configurazione MCP strict generato
- `codex-cli`: override di configurazione inline per `mcp_servers`; il server
  loopback OpenClaw generato è contrassegnato con la modalità di approvazione strumenti per server di Codex
  così le chiamate MCP non possono bloccarsi sui prompt di approvazione locale
- `google-gemini-cli`: file di impostazioni di sistema Gemini generato

Quando MCP in bundle è abilitato, OpenClaw:

- avvia un server MCP HTTP loopback che espone gli strumenti del Gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti alla sessione, all'account e al contesto del canale correnti
- carica i server MCP in bundle abilitati per l'area di lavoro corrente
- li unisce a qualsiasi forma di configurazione/impostazioni MCP del backend esistente
- riscrive la configurazione di avvio usando la modalità di integrazione posseduta dal backend proveniente dall'estensione proprietaria

Se non è abilitato alcun server MCP, OpenClaw inietta comunque una configurazione strict quando un
backend aderisce a MCP in bundle, così le esecuzioni in background restano isolate.

I runtime MCP in bundle con ambito di sessione vengono memorizzati nella cache per il riutilizzo all'interno di una sessione, quindi
recuperati dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (predefinito 10
minuti; imposta `0` per disabilitare). Le esecuzioni incorporate una tantum come sonde di autenticazione,
generazione di slug e richieste di richiamo active-memory eseguono la pulizia alla fine dell'esecuzione, così i figli stdio
e gli stream Streamable HTTP/SSE non sopravvivono all'esecuzione.

## Limitazioni

- **Nessuna chiamata diretta agli strumenti OpenClaw.** OpenClaw non inietta chiamate agli strumenti nel
  protocollo del backend CLI. I backend vedono gli strumenti del Gateway solo quando aderiscono a
  `bundleMcp: true`.
- **Lo streaming è specifico del backend.** Alcuni backend trasmettono JSONL in streaming; altri bufferizzano
  fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.
- **Le sessioni Codex CLI** riprendono tramite output testuale (non JSONL), che è meno
  strutturato rispetto all'esecuzione iniziale con `--json`. Le sessioni OpenClaw funzionano comunque
  normalmente.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome del modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità della sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none` (Codex CLI attualmente non può riprendere con output JSON).
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi dei file).

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Modelli locali](/it/gateway/local-models)
