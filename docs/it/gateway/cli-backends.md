---
read_when:
    - Vuoi un fallback affidabile quando i provider API falliscono
    - Stai eseguendo Codex CLI o altre CLI AI locali e vuoi riutilizzarle
    - Vuoi comprendere il bridge local loopback MCP per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback CLI AI locale con bridge di strumenti MCP opzionale'
title: Backend CLI
x-i18n:
    generated_at: "2026-04-16T19:30:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 381273532a8622bc4628000a6fb999712b12af08faade2b5f2b7ac4cc7d23efe
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backend CLI (runtime di fallback)

OpenClaw può eseguire **CLI AI locali** come **fallback solo testo** quando i provider API non sono disponibili,
soggetti a limitazioni di frequenza o temporaneamente malfunzionanti. Si tratta intenzionalmente di un approccio conservativo:

- **Gli strumenti di OpenClaw non vengono iniettati direttamente**, ma i backend con `bundleMcp: true`
  possono ricevere gli strumenti del gateway tramite un bridge MCP loopback.
- **Streaming JSONL** per le CLI che lo supportano.
- **Le sessioni sono supportate** (così i turni successivi restano coerenti).
- **Le immagini possono essere passate** se la CLI accetta percorsi di immagini.

Questo è progettato come una **rete di sicurezza** piuttosto che come percorso principale. Usalo quando
vuoi risposte testuali “sempre funzionanti” senza dipendere da API esterne.

Se vuoi un runtime harness completo con controlli di sessione ACP, attività in background,
binding thread/conversazione e sessioni di coding esterne persistenti, usa
[Agenti ACP](/it/tools/acp-agents) invece. I backend CLI non sono ACP.

## Guida rapida per principianti

Puoi usare Codex CLI **senza alcuna configurazione** (il Plugin OpenAI incluso
registra un backend predefinito):

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
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Questo è tutto. Nessuna chiave, nessuna configurazione di autenticazione aggiuntiva oltre alla CLI stessa.

Se usi un backend CLI incluso come **provider di messaggi principale** su un
host gateway, OpenClaw ora carica automaticamente il Plugin incluso proprietario quando la tua configurazione
fa riferimento esplicito a quel backend in un model ref o sotto
`agents.defaults.cliBackends`.

## Utilizzo come fallback

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
- Se il provider primario fallisce (autenticazione, limiti di frequenza, timeout), OpenClaw
  proverà quindi il backend CLI.

## Panoramica della configurazione

Tutti i backend CLI si trovano sotto:

```
agents.defaults.cliBackends
```

Ogni voce è indicizzata da un **id provider** (ad esempio `codex-cli`, `my-cli`).
L'id provider diventa la parte sinistra del tuo model ref:

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
2. **Costruisce un prompt di sistema** usando lo stesso prompt OpenClaw + contesto workspace.
3. **Esegue la CLI** con un id sessione (se supportato) in modo che la cronologia resti coerente.
4. **Analizza l'output** (JSON o testo semplice) e restituisce il testo finale.
5. **Rende persistenti gli id sessione** per backend, così i follow-up riutilizzano la stessa sessione CLI.

<Note>
Il backend Anthropic `claude-cli` incluso è di nuovo supportato. Lo staff Anthropic
ci ha detto che l'uso di Claude CLI in stile OpenClaw è di nuovo consentito, quindi OpenClaw considera
l'uso di `claude -p` approvato per questa integrazione, a meno che Anthropic non pubblichi
una nuova policy.
</Note>

Il backend OpenAI `codex-cli` incluso passa il prompt di sistema di OpenClaw tramite
l'override di configurazione `model_instructions_file` di Codex (`-c
model_instructions_file="..."`). Codex non espone un flag in stile Claude
`--append-system-prompt`, quindi OpenClaw scrive il prompt assemblato in un
file temporaneo per ogni nuova sessione Codex CLI.

Il backend Anthropic `claude-cli` incluso riceve lo snapshot delle Skills di OpenClaw
in due modi: il catalogo compatto delle Skills di OpenClaw nel prompt di sistema aggiunto, e
un Plugin temporaneo di Claude Code passato con `--plugin-dir`. Il Plugin contiene
solo le Skills idonee per quell'agente/sessione, così il resolver nativo delle skill di Claude Code
vede lo stesso insieme filtrato che OpenClaw altrimenti pubblicizzerebbe nel
prompt. Le sostituzioni delle variabili d'ambiente/API key delle skill vengono comunque applicate da OpenClaw all'ambiente del processo figlio per l'esecuzione.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad esempio `--session-id`) oppure
  `sessionArgs` (segnaposto `{sessionId}`) quando l'ID deve essere inserito
  in più flag.
- Se la CLI usa un **sottocomando di ripresa** con flag diversi, imposta
  `resumeArgs` (sostituisce `args` quando si riprende) e facoltativamente `resumeOutput`
  (per riprese non JSON).
- `sessionMode`:
  - `always`: invia sempre un id sessione (nuovo UUID se non ne è stato memorizzato nessuno).
  - `existing`: invia un id sessione solo se era già stato memorizzato in precedenza.
  - `none`: non inviare mai un id sessione.

Note sulla serializzazione:

- `serialize: true` mantiene ordinate le esecuzioni nella stessa corsia.
- La maggior parte delle CLI serializza su una corsia provider.
- OpenClaw scarta il riutilizzo della sessione CLI memorizzata quando cambia lo stato di autenticazione del backend, incluso un nuovo login, la rotazione del token o una credenziale del profilo di autenticazione modificata.

## Immagini (pass-through)

Se la tua CLI accetta percorsi di immagini, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scriverà le immagini base64 in file temporanei. Se `imageArg` è impostato, questi
percorsi vengono passati come argomenti CLI. Se `imageArg` manca, OpenClaw aggiunge
i percorsi dei file al prompt (iniezione di percorso), il che è sufficiente per le CLI che caricano automaticamente
file locali da semplici percorsi.

## Input / output

- `output: "json"` (predefinito) prova ad analizzare JSON ed estrarre testo + id sessione.
- Per l'output JSON di Gemini CLI, OpenClaw legge il testo della risposta da `response` e
  l'uso da `stats` quando `usage` è mancante o vuoto.
- `output: "jsonl"` analizza stream JSONL (ad esempio Codex CLI `--json`) ed estrae il messaggio finale dell'agente più gli identificatori
  di sessione quando presenti.
- `output: "text"` tratta stdout come risposta finale.

Modalità di input:

- `input: "arg"` (predefinito) passa il prompt come ultimo argomento CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene usato stdin.

## Valori predefiniti (posseduti dal Plugin)

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

Prerequisito: Gemini CLI locale deve essere installata e disponibile come
`gemini` su `PATH` (`brew install gemini-cli` oppure
`npm install -g @google/gemini-cli`).

Note sul JSON di Gemini CLI:

- Il testo della risposta viene letto dal campo JSON `response`.
- L'uso ricade su `stats` quando `usage` è assente o vuoto.
- `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
- Se `stats.input` è mancante, OpenClaw ricava i token di input da
  `stats.input_tokens - stats.cached`.

Sovrascrivi solo se necessario (caso comune: percorso `command` assoluto).

## Valori predefiniti posseduti dal Plugin

I valori predefiniti del backend CLI fanno ora parte della superficie del Plugin:

- I Plugin li registrano con `api.registerCliBackend(...)`.
- L'`id` del backend diventa il prefisso provider nei model ref.
- La configurazione utente in `agents.defaults.cliBackends.<id>` continua a sovrascrivere il valore predefinito del Plugin.
- La pulizia della configurazione specifica del backend resta posseduta dal Plugin tramite l'hook
  facoltativo `normalizeConfig`.

I Plugin che hanno bisogno di piccoli shim di compatibilità per prompt/messaggi possono dichiarare
trasformazioni di testo bidirezionali senza sostituire un provider o backend CLI:

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

Per le CLI che emettono JSONL compatibile con Claude Code stream-json, imposta
`jsonlDialect: "claude-stream-json"` nella configurazione di quel backend.

## Overlay bundle MCP

I backend CLI **non** ricevono direttamente chiamate agli strumenti di OpenClaw, ma un backend può
scegliere di usare un overlay di configurazione MCP generato con `bundleMcp: true`.

Comportamento incluso attuale:

- `claude-cli`: file di configurazione MCP strict generato
- `codex-cli`: override di configurazione inline per `mcp_servers`
- `google-gemini-cli`: file di impostazioni di sistema Gemini generato

Quando bundle MCP è abilitato, OpenClaw:

- avvia un server HTTP MCP loopback che espone gli strumenti del gateway al processo CLI
- autentica il bridge con un token per sessione (`OPENCLAW_MCP_TOKEN`)
- limita l'accesso agli strumenti al contesto corrente di sessione, account e canale
- carica i server bundle-MCP abilitati per il workspace corrente
- li unisce con qualsiasi forma esistente di configurazione/impostazioni MCP del backend
- riscrive la configurazione di avvio usando la modalità di integrazione posseduta dal backend dall'estensione proprietaria

Se non è abilitato alcun server MCP, OpenClaw inietta comunque una configurazione strict quando un
backend sceglie di usare bundle MCP, così le esecuzioni in background restano isolate.

## Limitazioni

- **Nessuna chiamata diretta agli strumenti di OpenClaw.** OpenClaw non inietta chiamate agli strumenti nel
  protocollo del backend CLI. I backend vedono gli strumenti del gateway solo quando scelgono
  `bundleMcp: true`.
- **Lo streaming è specifico del backend.** Alcuni backend trasmettono JSONL in streaming; altri accumulano
  fino all'uscita.
- **Gli output strutturati** dipendono dal formato JSON della CLI.
- **Le sessioni Codex CLI** riprendono tramite output testuale (nessun JSONL), che è meno
  strutturato dell'esecuzione iniziale `--json`. Le sessioni OpenClaw continuano comunque a funzionare
  normalmente.

## Risoluzione dei problemi

- **CLI non trovata**: imposta `command` su un percorso completo.
- **Nome del modello errato**: usa `modelAliases` per mappare `provider/model` → modello CLI.
- **Nessuna continuità di sessione**: assicurati che `sessionArg` sia impostato e che `sessionMode` non sia
  `none` (attualmente Codex CLI non può riprendere con output JSON).
- **Immagini ignorate**: imposta `imageArg` (e verifica che la CLI supporti i percorsi di file).
