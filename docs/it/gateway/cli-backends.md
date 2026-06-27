---
read_when:
    - Vuoi un fallback affidabile quando i provider API non funzionano
    - Stai eseguendo CLI di IA locali e vuoi riutilizzarle
    - Vuoi comprendere il bridge loopback MCP per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback CLI AI locale con bridge opzionale per strumenti MCP'
title: Backend CLI
x-i18n:
    generated_at: "2026-06-27T17:30:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw può eseguire **CLI AI locali** come **fallback solo testo** quando i provider API sono non disponibili,
soggetti a rate limit o temporaneamente instabili. Questo è intenzionalmente conservativo:

- **Gli strumenti OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  possono ricevere strumenti del Gateway tramite un bridge MCP di loopback.
- **Streaming JSONL** per le CLI che lo supportano.
- **Le sessioni sono supportate** (così i turni successivi restano coerenti).
- **Le immagini possono essere passate attraverso** se la CLI accetta percorsi di immagini.

Questo è progettato come **rete di sicurezza** più che come percorso principale. Usalo quando
vuoi risposte testuali che "funzionano sempre" senza dipendere da API esterne.

Se vuoi un runtime harness completo con controlli di sessione ACP, attività in background,
associazione a thread/conversazione e sessioni di coding esterne persistenti, usa invece
[agenti ACP](/it/tools/acp-agents). I backend CLI non sono ACP.

<Tip>
  Stai creando un nuovo Plugin di backend? Usa
  [Plugin di backend CLI](/it/plugins/cli-backend-plugins). Questa pagina è per gli utenti
  che configurano e gestiscono un backend già registrato.
</Tip>

## Avvio rapido per principianti

Puoi usare Claude Code CLI **senza alcuna configurazione** (il Plugin Anthropic in bundle
registra un backend predefinito):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` è l'id agente predefinito quando non è configurato alcun elenco esplicito di agenti. Se
usi più agenti, sostituiscilo con l'id agente che vuoi eseguire.

Se il tuo gateway viene eseguito sotto launchd/systemd e PATH è minimo, aggiungi solo il
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

Tutto qui. Nessuna chiave, nessuna configurazione di autenticazione extra necessaria oltre alla CLI stessa.

Se usi un backend CLI in bundle come **provider di messaggi principale** su un
host gateway, OpenClaw ora carica automaticamente il Plugin in bundle proprietario quando la tua configurazione
fa riferimento esplicitamente a quel backend in un riferimento modello o sotto
`agents.defaults.cliBackends`.

## Uso come fallback

Aggiungi un backend CLI al tuo elenco di fallback così viene eseguito solo quando i modelli principali falliscono:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Note:

- Se usi `agents.defaults.models` (allowlist), devi includere anche lì i modelli del tuo backend CLI.
- Se il provider principale fallisce (autenticazione, rate limit, timeout), OpenClaw
  proverà poi il backend CLI.

## Panoramica della configurazione

Tutti i backend CLI si trovano sotto:

```
agents.defaults.cliBackends
```

Ogni voce è indicizzata da un **id provider** (ad es. `claude-cli`, `my-cli`).
L'id provider diventa la parte sinistra del tuo riferimento modello:

```
<provider>/<model>
```

### Configurazione di esempio

```json5
{
  agents: {
    defaults: {
      cliBackends: {
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
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Come funziona

1. **Seleziona un backend** in base al prefisso del provider (`claude-cli/...`).
2. **Costruisce un prompt di sistema** usando lo stesso prompt OpenClaw + contesto dello spazio di lavoro.
3. **Esegue la CLI** con un id sessione (se supportato) così la cronologia resta coerente.
   Il backend `claude-cli` in bundle mantiene attivo un processo Claude stdio per ogni
   sessione OpenClaw e invia i turni successivi su stdin stream-json.
4. **Analizza l'output** (JSON o testo semplice) e restituisce il testo finale.
5. **Persiste gli id sessione** per backend, così i turni successivi riutilizzano la stessa sessione CLI.

<Note>
Il backend Anthropic `claude-cli` in bundle è di nuovo supportato. Lo staff Anthropic
ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw considera
l'uso di `claude -p` approvato per questa integrazione salvo che Anthropic pubblichi
una nuova policy.
</Note>

Il backend Anthropic `claude-cli` in bundle preferisce il resolver di skill nativo di Claude Code
per le Skills di OpenClaw. Quando lo snapshot corrente delle skill include almeno
una skill selezionata con un percorso materializzato, OpenClaw passa un Plugin Claude
Code temporaneo con `--plugin-dir` e omette il catalogo duplicato delle Skills OpenClaw
dal prompt di sistema aggiunto. Se lo snapshot non ha nessuna skill Plugin materializzata,
OpenClaw mantiene il catalogo del prompt come fallback. Gli override di env/chiave API delle skill
vengono comunque applicati da OpenClaw all'ambiente del processo figlio per l'esecuzione.

Claude CLI ha anche una propria modalità di permessi non interattiva. OpenClaw la mappa
alla policy exec esistente invece di aggiungere una configurazione policy specifica per Claude.
Per le sessioni live Claude gestite da OpenClaw, la policy exec effettiva di OpenClaw è
autoritativa: YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`) avvia Claude con
`--permission-mode bypassPermissions`, mentre una policy exec effettiva restrittiva
avvia Claude con `--permission-mode default`. Le impostazioni per agente
`agents.list[].tools.exec` sovrascrivono `tools.exec` globale per quell'agente.
Gli argomenti grezzi del backend Claude possono ancora includere `--permission-mode`, ma gli avvii live
di Claude normalizzano quel flag per farlo corrispondere alla policy exec effettiva di OpenClaw.

Il backend Anthropic `claude-cli` in bundle mappa anche i livelli OpenClaw `/think`
al flag nativo `--effort` di Claude Code per i livelli non off. `minimal` e
`low` mappano a `low`, `adaptive` e `medium` mappano a `medium`, e `high`,
`xhigh` e `max` mappano direttamente. Gli altri backend CLI richiedono che il loro Plugin proprietario
dichiari un mapper argv equivalente prima che `/think` possa influenzare la CLI generata.

Prima che OpenClaw possa usare il backend `claude-cli` in bundle, Claude Code stesso
deve essere già autenticato sullo stesso host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Le installazioni Docker richiedono che Claude Code sia installato e autenticato nella home persistente
del container, non solo sull'host. Vedi
[Backend Claude CLI in Docker](/it/install/docker#claude-cli-backend-in-docker).

Usa `agents.defaults.cliBackends.claude-cli.command` solo quando il binario `claude`
non è già su `PATH`.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad es. `--session-id`) oppure
  `sessionArgs` (placeholder `{sessionId}`) quando l'ID deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando resume** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` durante il resume) e opzionalmente `resumeOutput`
  (per resume non JSON).
- `sessionMode`:
  - `always`: invia sempre un id sessione (nuovo UUID se nessuno è memorizzato).
  - `existing`: invia un id sessione solo se ne era stato memorizzato uno in precedenza.
  - `none`: non inviare mai un id sessione.
- `claude-cli` usa come predefiniti `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` così i turni successivi riutilizzano il processo Claude live mentre
  è attivo. Lo stdio caldo è ora il valore predefinito, anche per configurazioni personalizzate
  che omettono i campi di trasporto. Se il Gateway si riavvia o il processo inattivo
  termina, OpenClaw riprende dall'id sessione Claude memorizzato. Gli id sessione
  memorizzati vengono verificati rispetto a una trascrizione di progetto esistente e leggibile prima del
  resume, quindi i binding fantasma vengono eliminati con `reason=transcript-missing`
  invece di avviare silenziosamente una nuova sessione Claude CLI con `--resume`.
- Le sessioni live Claude mantengono guardrail limitati per l'output JSONL. I valori predefiniti consentono fino a
  8 MiB e 20.000 righe JSONL grezze per turno. I turni Claude intensivi di strumenti possono aumentarli
  per backend con
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  e `maxTurnLines`; OpenClaw limita queste impostazioni a 64 MiB e 100.000
  righe.
- Le sessioni CLI memorizzate sono continuità di proprietà del provider. Il reset giornaliero implicito della sessione
  non le interrompe; `/reset` e le policy esplicite `session.reset` lo fanno comunque.
- Le nuove sessioni CLI normalmente vengono reinizializzate solo dal riepilogo di Compaction di OpenClaw
  più la coda post-compaction. Per recuperare sessioni brevi che vengono invalidate
  prima della Compaction, un backend può aderire con
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw mantiene comunque limitata
  la reinizializzazione da trascrizione grezza e la limita a invalidazioni sicure come trascrizioni
  CLI mancanti, modifiche a prompt di sistema/MCP o retry per sessione scaduta; modifiche
  al profilo di autenticazione o all'epoca delle credenziali non reinizializzano mai la cronologia da trascrizione grezza.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni sulla stessa corsia.
- La maggior parte delle CLI serializza su una corsia provider.
- OpenClaw scarta il riutilizzo della sessione CLI memorizzata quando l'identità di autenticazione selezionata cambia,
  inclusi un id profilo di autenticazione modificato, chiave API statica, token statico o identità
  account OAuth quando la CLI ne espone una. La rotazione dei token di accesso e refresh OAuth
  non interrompe la sessione CLI memorizzata. Se una CLI non espone un
  id account OAuth stabile, OpenClaw lascia che quella CLI applichi i permessi di resume.

## Preludio di fallback dalle sessioni claude-cli

Quando un tentativo `claude-cli` passa a un candidato non CLI in
[`agents.defaults.model.fallbacks`](/it/concepts/model-failover), OpenClaw inizializza
il tentativo successivo con un preludio di contesto raccolto dalla trascrizione JSONL locale
di Claude Code in `~/.claude/projects/`. Senza questo seed, il provider di fallback
partirebbe a freddo perché la trascrizione della sessione propria di OpenClaw è vuota
per le esecuzioni `claude-cli`.

- Il preludio preferisce l'ultimo riepilogo `/compact` o marker `compact_boundary`,
  poi aggiunge i turni post-boundary più recenti fino a un budget di caratteri.
  I turni pre-boundary vengono scartati perché il riepilogo li rappresenta già.
- I blocchi degli strumenti vengono coalesciuti in indizi compatti `(tool call: name)` e
  `(tool result: …)` per mantenere onesto il budget del prompt. Il riepilogo viene
  etichettato `(truncated)` se supera il limite.
- I fallback dallo stesso provider `claude-cli` a `claude-cli` si affidano al
  `--resume` di Claude e saltano il preludio.
- Il seed riutilizza la convalida esistente del percorso del file sessione Claude, quindi
  non è possibile leggere percorsi arbitrari.

## Immagini (pass-through)

Se la tua CLI accetta percorsi di immagini, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, quei
percorsi vengono passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge i
percorsi dei file al prompt (path injection), cosa sufficiente per le CLI che caricano automaticamente
file locali da percorsi semplici.

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON ed estrarre testo + id sessione.
- Per l'output JSON di Gemini CLI, OpenClaw legge il testo della risposta da `response` e l'uso
  da `stats` quando `usage` manca o è vuoto. Il valore predefinito Gemini CLI in bundle
  usa `stream-json`, ma i vecchi override `--output-format json` usano ancora il
  parser JSON.
- `output: "jsonl"` analizza gli stream JSONL ed estrae il messaggio finale dell'agente più gli identificatori
  di sessione quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità di input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Valori predefiniti (di proprietà del Plugin)

I valori predefiniti dei backend CLI inclusi risiedono nel Plugin che li possiede. Per esempio,
Anthropic possiede `claude-cli` e Google possiede `google-gemini-cli`. Le esecuzioni degli agent OpenAI Codex
usano l'harness app-server di Codex tramite `openai/*`; OpenClaw non
registra più un backend `codex-cli` incluso.

Il Plugin Anthropic incluso registra un valore predefinito per `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Anche il Plugin Google incluso registra un valore predefinito per `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Prerequisito: la CLI locale di Gemini deve essere installata e disponibile come
`gemini` in `PATH` (`brew install gemini-cli` oppure
`npm install -g @google/gemini-cli`).

Note sull'output della CLI Gemini:

- Il parser `stream-json` predefinito legge eventi `message` dell'assistente, eventi degli strumenti,
  utilizzo finale di `result` ed eventi di errore fatale di Gemini.
- Se sovrascrivi gli argomenti Gemini con `--output-format json`, OpenClaw normalizza quel
  backend di nuovo a `output: "json"` e legge il testo della risposta dal campo JSON `response`.
- L'utilizzo ripiega su `stats` quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
- Se `stats.input` manca, OpenClaw deriva i token di input da
  `stats.input_tokens - stats.cached`.

Sovrascrivi solo se necessario (caso comune: percorso assoluto di `command`).

## Valori predefiniti di proprietà del Plugin

I valori predefiniti dei backend CLI fanno ora parte della superficie del Plugin:

- I Plugin li registrano con `api.registerCliBackend(...)`.
- L'`id` del backend diventa il prefisso del provider nei riferimenti ai modelli.
- La configurazione utente in `agents.defaults.cliBackends.<id>` sovrascrive comunque il valore predefinito del Plugin.
- La pulizia della configurazione specifica del backend resta di proprietà del Plugin tramite l'hook opzionale
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
i propri marker di controllo e la consegna al canale.

Per le CLI che emettono eventi JSONL specifici del provider, imposta `jsonlDialect` nella
configurazione di quel backend. I dialetti supportati sono `claude-stream-json` per stream compatibili con Claude
Code e `gemini-stream-json` per eventi Gemini CLI `stream-json`.

## Proprietà della Compaction nativa

Alcuni backend CLI eseguono un agent che compatta la **propria** trascrizione, quindi OpenClaw non deve
eseguire su di essi il proprio riepilogatore di salvaguardia: farlo entra in conflitto con la
Compaction del backend e può causare un errore bloccante del turno.

`claude-cli` non ha un endpoint harness: Claude Code compatta internamente, quindi dichiara
`ownsNativeCompaction: true`, e OpenClaw restituisce un no-op dal percorso di Compaction.
Le sessioni native-harness come Codex continuano invece a essere indirizzate al loro endpoint di Compaction dell'harness.

Poiché il backend possiede la Compaction, il vecchio ripiego di impostare
`contextTokens: 1_000_000` solo per impedire l'attivazione della salvaguardia di OpenClaw su una
sessione claude-cli **non è più necessario**: l'opt-out lo sostituisce.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Dichiara `ownsNativeCompaction` solo per un backend che possiede davvero la propria Compaction: deve
limitare in modo affidabile la propria trascrizione quando si avvicina alla finestra di contesto e persistere una
sessione ripristinabile (ad es. `--resume` / `--session-id`); altrimenti una sessione rinviata può
restare oltre il budget. Le sessioni `agentHarnessId` corrispondenti continuano a essere indirizzate all'endpoint dell'harness.

## Overlay MCP inclusi

I backend CLI **non** ricevono direttamente chiamate agli strumenti OpenClaw, ma un backend può
aderire a un overlay di configurazione MCP generato con `bundleMcp: true`.

Comportamento incluso attuale:

- `claude-cli`: file di configurazione MCP strict generato
- `google-gemini-cli`: file di impostazioni di sistema Gemini generato

Quando bundle MCP è abilitato, OpenClaw:

- avvia un server MCP HTTP in local loopback che espone gli strumenti Gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti alla sessione, all'account e al contesto di canale correnti
- carica i server bundle-MCP abilitati per il workspace corrente
- li unisce a qualunque forma di configurazione/impostazioni MCP del backend esistente
- riscrive la configurazione di avvio usando la modalità di integrazione di proprietà del backend dall'estensione proprietaria

Se non è abilitato alcun server MCP, OpenClaw inietta comunque una configurazione strict quando un
backend aderisce a bundle MCP, così le esecuzioni in background restano isolate.

I runtime MCP inclusi con ambito di sessione vengono memorizzati nella cache per il riuso all'interno di una sessione, poi
rimossi dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (predefinito 10
minuti; imposta `0` per disabilitare). Le esecuzioni embedded one-shot come probe di autenticazione,
generazione di slug e richiamo Active Memory richiedono la pulizia a fine esecuzione, così i processi figli stdio
e gli stream Streamable HTTP/SSE non sopravvivono all'esecuzione.

## Limite della cronologia di reseed

Quando una nuova sessione CLI viene inizializzata da una trascrizione OpenClaw precedente (per
esempio dopo un nuovo tentativo `session_expired`), il blocco renderizzato
`<conversation_history>` viene limitato per impedire ai prompt di reseed di
esplodere. Il valore predefinito è `12288` caratteri (circa 3000 token).

I backend Claude CLI usano automaticamente un limite più grande derivato dal tier di contesto
Claude risolto. Le esecuzioni Claude standard da 200K token mantengono una porzione di trascrizione più ampia,
e le esecuzioni Claude da 1M token ne mantengono una ancora più ampia, mentre gli altri backend CLI
mantengono il valore predefinito conservativo.

- Il limite governa solo il blocco di cronologia precedente del prompt di reseed. I limiti di
  output della sessione live sono regolati separatamente in `reliability.outputLimits`
  (vedi [Sessioni](#sessions)).

## Limitazioni

- **Nessuna chiamata diretta agli strumenti OpenClaw.** OpenClaw non inietta chiamate agli strumenti nel
  protocollo del backend CLI. I backend vedono gli strumenti Gateway solo quando aderiscono a
  `bundleMcp: true`.
- **Lo streaming è specifico del backend.** Alcuni backend trasmettono JSONL in streaming; altri accumulano
  fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità di sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none`.
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi dei file).

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Modelli locali](/it/gateway/local-models)
