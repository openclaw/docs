---
read_when:
    - Vuoi un fallback affidabile quando i provider API non funzionano
    - Stai eseguendo Codex CLI o altre CLI di IA locali e vuoi riutilizzarle
    - Vuoi comprendere il bridge loopback MCP per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback CLI di IA locale con ponte strumenti MCP opzionale'
title: Backend CLI
x-i18n:
    generated_at: "2026-05-10T19:33:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw può eseguire **CLI AI locali** come **fallback solo testo** quando i provider API sono inattivi,
soggetti a rate limit o temporaneamente malfunzionanti. Questa scelta è intenzionalmente conservativa:

- **Gli strumenti OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  possono ricevere gli strumenti del gateway tramite un bridge MCP loopback.
- **Streaming JSONL** per le CLI che lo supportano.
- **Le sessioni sono supportate** (così i turni successivi rimangono coerenti).
- **Le immagini possono essere passate attraverso** se la CLI accetta percorsi di immagini.

È progettato come **rete di sicurezza** più che come percorso principale. Usalo quando
vuoi risposte testuali che "funzionano sempre" senza dipendere da API esterne.

Se vuoi un runtime harness completo con controlli di sessione ACP, attività in background,
binding di thread/conversazione e sessioni di coding esterne persistenti, usa invece
[Agenti ACP](/it/tools/acp-agents). I backend CLI non sono ACP.

<Tip>
  Stai creando un nuovo plugin backend? Usa
  [Plugin backend CLI](/it/plugins/cli-backend-plugins). Questa pagina è per gli utenti
  che configurano e gestiscono un backend già registrato.
</Tip>

## Avvio rapido per principianti

Puoi usare Codex CLI **senza alcuna configurazione** (il plugin OpenAI incluso
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

È tutto. Nessuna chiave, nessuna configurazione di autenticazione extra necessaria oltre alla CLI stessa.

Se usi un backend CLI incluso come **provider di messaggi primario** su un
host gateway, OpenClaw ora carica automaticamente il plugin incluso proprietario quando la tua configurazione
fa esplicitamente riferimento a quel backend in un riferimento modello o sotto
`agents.defaults.cliBackends`.

## Usarlo come fallback

Aggiungi un backend CLI al tuo elenco di fallback in modo che venga eseguito solo quando i modelli primari falliscono:

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
- Se il provider primario fallisce (autenticazione, rate limit, timeout), OpenClaw
  proverà poi il backend CLI.

## Panoramica della configurazione

Tutti i backend CLI si trovano sotto:

```
agents.defaults.cliBackends
```

Ogni voce è identificata da un **id provider** (ad es. `codex-cli`, `my-cli`).
L'id provider diventa il lato sinistro del tuo riferimento modello:

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

1. **Seleziona un backend** in base al prefisso del provider (`codex-cli/...`).
2. **Costruisce un prompt di sistema** usando lo stesso prompt OpenClaw + contesto del workspace.
3. **Esegue la CLI** con un id sessione (se supportato) in modo che la cronologia rimanga coerente.
   Il backend `claude-cli` incluso mantiene vivo un processo stdio Claude per ogni
   sessione OpenClaw e invia i turni successivi su stdin stream-json.
4. **Analizza l'output** (JSON o testo semplice) e restituisce il testo finale.
5. **Persiste gli id sessione** per backend, così i follow-up riutilizzano la stessa sessione CLI.

<Note>
Il backend Anthropic `claude-cli` incluso è di nuovo supportato. Lo staff Anthropic
ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw considera
l'uso di `claude -p` autorizzato per questa integrazione, a meno che Anthropic pubblichi
una nuova policy.
</Note>

Il backend OpenAI `codex-cli` incluso passa il prompt di sistema di OpenClaw tramite
l'override di configurazione `model_instructions_file` di Codex (`-c
model_instructions_file="..."`). Codex non espone un flag in stile Claude
`--append-system-prompt`, quindi OpenClaw scrive il prompt assemblato in un
file temporaneo per ogni nuova sessione Codex CLI.

Il backend Anthropic `claude-cli` incluso riceve lo snapshot delle Skills di OpenClaw
in due modi: il catalogo compatto delle skill OpenClaw nel prompt di sistema aggiunto e
un plugin temporaneo Claude Code passato con `--plugin-dir`. Il plugin contiene
solo le skill idonee per quell'agente/sessione, quindi il resolver nativo delle skill di Claude Code
vede lo stesso set filtrato che OpenClaw altrimenti pubblicizzerebbe nel
prompt. Gli override di env/API key delle skill vengono comunque applicati da OpenClaw
all'ambiente del processo figlio per l'esecuzione.

Claude CLI ha anche una propria modalità di permessi non interattiva. OpenClaw la mappa
alla policy exec esistente invece di aggiungere configurazione specifica per Claude: quando la
policy exec richiesta effettiva è YOLO (`tools.exec.security: "full"` e
`tools.exec.ask: "off"`), OpenClaw aggiunge `--permission-mode bypassPermissions`.
Le impostazioni per agente `agents.list[].tools.exec` sovrascrivono `tools.exec` globale per
quell'agente. Per forzare una modalità Claude diversa, imposta argomenti backend raw espliciti
come `--permission-mode default` o `--permission-mode acceptEdits` sotto
`agents.defaults.cliBackends.claude-cli.args` e `resumeArgs` corrispondenti.

Il backend Anthropic `claude-cli` incluso mappa anche i livelli `/think` di OpenClaw
al flag nativo `--effort` di Claude Code per i livelli diversi da off. `minimal` e
`low` mappano a `low`, `adaptive` e `medium` mappano a `medium`, e `high`,
`xhigh` e `max` mappano direttamente. Gli altri backend CLI hanno bisogno che il plugin proprietario
dichiari un mapper argv equivalente prima che `/think` possa influire sulla CLI avviata.

Prima che OpenClaw possa usare il backend `claude-cli` incluso, Claude Code stesso
deve essere già autenticato sullo stesso host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Usa `agents.defaults.cliBackends.claude-cli.command` solo quando il binario `claude`
non è già in `PATH`.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad es. `--session-id`) oppure
  `sessionArgs` (segnaposto `{sessionId}`) quando l'ID deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando resume** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` durante il resume) e facoltativamente `resumeOutput`
  (per resume non JSON).
- `sessionMode`:
  - `always`: invia sempre un id sessione (nuovo UUID se nessuno è memorizzato).
  - `existing`: invia un id sessione solo se ne era già stato memorizzato uno.
  - `none`: non inviare mai un id sessione.
- `claude-cli` usa per impostazione predefinita `liveSession: "claude-stdio"`, `output: "jsonl"`,
  e `input: "stdin"` così i turni successivi riutilizzano il processo Claude live mentre
  è attivo. Stdio caldo è ora il valore predefinito, anche per configurazioni personalizzate
  che omettono i campi di trasporto. Se il Gateway si riavvia o il processo inattivo
  termina, OpenClaw riprende dall'id sessione Claude memorizzato. Gli id sessione
  memorizzati vengono verificati rispetto a una trascrizione di progetto esistente e leggibile prima del
  resume, così i binding fantasma vengono cancellati con `reason=transcript-missing`
  invece di avviare silenziosamente una nuova sessione Claude CLI sotto `--resume`.
- Le sessioni live Claude mantengono guardrail limitati sull'output JSONL. I valori predefiniti consentono fino a
  8 MiB e 20.000 righe JSONL raw per turno. I turni Claude con molti strumenti possono aumentarli
  per backend con
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  e `maxTurnLines`; OpenClaw limita queste impostazioni a 64 MiB e 100.000
  righe.
- Le sessioni CLI memorizzate sono continuità di proprietà del provider. Il reset giornaliero
  implicito non le interrompe; `/reset` e le policy esplicite `session.reset` lo fanno comunque.
- Le nuove sessioni CLI normalmente riseminano solo dal riepilogo di compaction di OpenClaw
  più la coda post-compaction. Per recuperare sessioni brevi invalidate
  prima della compaction, un backend può optare con
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw mantiene comunque limitata la risemina da
  trascrizione raw e la limita a invalidazioni sicure come trascrizioni CLI mancanti,
  modifiche a prompt di sistema/MCP o retry per sessione scaduta; modifiche al profilo
  di autenticazione o all'epoca delle credenziali non riseminano mai la cronologia raw della trascrizione.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni nella stessa lane.
- La maggior parte delle CLI serializza su una lane provider.
- OpenClaw interrompe il riutilizzo delle sessioni CLI memorizzate quando l'identità di autenticazione selezionata cambia,
  incluso un id profilo di autenticazione cambiato, chiave API statica, token statico o identità
  account OAuth quando la CLI ne espone una. La rotazione dei token di accesso e refresh
  OAuth non interrompe la sessione CLI memorizzata. Se una CLI non espone un
  id account OAuth stabile, OpenClaw lascia che sia quella CLI a far rispettare i permessi di resume.

## Preludio di fallback dalle sessioni claude-cli

Quando un tentativo `claude-cli` passa per errore a un candidato non CLI in
[`agents.defaults.model.fallbacks`](/it/concepts/model-failover), OpenClaw inizializza
il tentativo successivo con un preludio di contesto raccolto dalla trascrizione JSONL locale
di Claude Code in `~/.claude/projects/`. Senza questo seed, il provider di fallback
partirebbe a freddo perché la trascrizione di sessione propria di OpenClaw è vuota
per le esecuzioni `claude-cli`.

- Il preludio preferisce l'ultimo riepilogo `/compact` o marker `compact_boundary`,
  poi aggiunge i turni post-boundary più recenti fino a un budget di caratteri.
  I turni pre-boundary vengono scartati perché il riepilogo li rappresenta già.
- I blocchi degli strumenti vengono coalesciti in suggerimenti compatti `(tool call: name)` e
  `(tool result: …)` per mantenere onesto il budget del prompt. Il riepilogo è
  etichettato `(truncated)` se supera il limite.
- I fallback da `claude-cli` a `claude-cli` dello stesso provider si affidano al `--resume`
  di Claude e saltano il preludio.
- Il seed riutilizza la validazione esistente del percorso del file di sessione Claude, quindi
  non è possibile leggere percorsi arbitrari.

## Immagini (pass-through)

Se la tua CLI accetta percorsi di immagini, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, quei
percorsi vengono passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge i
percorsi dei file al prompt (iniezione del percorso), il che è sufficiente per le CLI che caricano
automaticamente file locali da percorsi in testo semplice.

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON ed estrarre testo + id sessione.
- Per l'output JSON di Gemini CLI, OpenClaw legge il testo di risposta da `response` e
  l'utilizzo da `stats` quando `usage` manca o è vuoto.
- `output: "jsonl"` analizza stream JSONL (per esempio Codex CLI `--json`) ed estrae il messaggio finale dell'agente più gli identificatori
  di sessione quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità di input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Valori predefiniti (di proprietà del plugin)

Il plugin OpenAI incluso registra anche un valore predefinito per `codex-cli`:

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

Prerequisito: la CLI Gemini locale deve essere installata e disponibile come
`gemini` in `PATH` (`brew install gemini-cli` o
`npm install -g @google/gemini-cli`).

Note sul JSON della CLI Gemini:

- Il testo della risposta viene letto dal campo JSON `response`.
- L'utilizzo usa `stats` come fallback quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
- Se `stats.input` manca, OpenClaw deriva i token di input da
  `stats.input_tokens - stats.cached`.

Esegui override solo se necessario (caso comune: percorso assoluto di `command`).

## Valori predefiniti di proprietà del Plugin

I valori predefiniti del backend CLI ora fanno parte della superficie del Plugin:

- I Plugin li registrano con `api.registerCliBackend(...)`.
- L'`id` del backend diventa il prefisso del provider nei riferimenti ai modelli.
- La configurazione utente in `agents.defaults.cliBackends.<id>` continua a eseguire l'override del valore predefinito del Plugin.
- La pulizia della configurazione specifica del backend resta di proprietà del Plugin tramite l'hook opzionale
  `normalizeConfig`.

I Plugin che richiedono piccoli shim di compatibilità per prompt/messaggi possono dichiarare
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
riscrive i delta dell'assistente trasmessi in streaming e il testo finale analizzato prima che OpenClaw gestisca
i propri marcatori di controllo e la consegna al canale.

Per le CLI che emettono JSONL compatibile con Claude Code stream-json, imposta
`jsonlDialect: "claude-stream-json"` nella configurazione di quel backend.

## Overlay MCP del bundle

I backend CLI **non** ricevono direttamente chiamate agli strumenti OpenClaw, ma un backend può
aderire a un overlay di configurazione MCP generato con `bundleMcp: true`.

Comportamento incluso attuale:

- `claude-cli`: file di configurazione MCP rigoroso generato
- `codex-cli`: override di configurazione inline per `mcp_servers`; il server
  local loopback OpenClaw generato è contrassegnato con la modalità di approvazione degli strumenti per server di Codex
  così le chiamate MCP non possono bloccarsi sui prompt di approvazione locali
- `google-gemini-cli`: file di impostazioni di sistema Gemini generato

Quando il bundle MCP è abilitato, OpenClaw:

- avvia un server MCP HTTP local loopback che espone gli strumenti del gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti al contesto della sessione, dell'account e del canale correnti
- carica i server bundle-MCP abilitati per il workspace corrente
- li unisce con qualsiasi forma di configurazione/impostazioni MCP del backend esistente
- riscrive la configurazione di avvio usando la modalità di integrazione di proprietà del backend dall'estensione proprietaria

Se non sono abilitati server MCP, OpenClaw inietta comunque una configurazione rigorosa quando un
backend aderisce al bundle MCP, così le esecuzioni in background restano isolate.

I runtime MCP inclusi con ambito di sessione vengono memorizzati nella cache per il riutilizzo all'interno di una sessione, quindi
ripuliti dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (predefinito 10
minuti; imposta `0` per disabilitare). Le esecuzioni incorporate one-shot come sonde di autenticazione,
generazione di slug e richiamo di active-memory richiedono la pulizia alla fine dell'esecuzione, così i processi figli stdio
e gli stream HTTP/SSE Streamable non sopravvivono all'esecuzione.

## Limitazioni

- **Nessuna chiamata diretta agli strumenti OpenClaw.** OpenClaw non inietta chiamate agli strumenti nel
  protocollo del backend CLI. I backend vedono gli strumenti del gateway solo quando aderiscono a
  `bundleMcp: true`.
- **Lo streaming è specifico del backend.** Alcuni backend trasmettono JSONL in streaming; altri eseguono il buffering
  fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.
- **Le sessioni Codex CLI** riprendono tramite output di testo (non JSONL), che è meno
  strutturato rispetto all'esecuzione iniziale con `--json`. Le sessioni OpenClaw funzionano comunque
  normalmente.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome del modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità di sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none` (Codex CLI attualmente non può riprendere con output JSON).
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi dei file).

## Correlati

- [Runbook del Gateway](/it/gateway)
- [Modelli locali](/it/gateway/local-models)
