---
read_when:
    - Vuoi un fallback affidabile quando i provider API non funzionano
    - Stai eseguendo CLI di IA locali e vuoi riutilizzarle
    - Vuoi comprendere il bridge local loopback MCP per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback alla CLI IA locale con bridge opzionale per strumenti MCP'
title: Backend della CLI
x-i18n:
    generated_at: "2026-07-12T07:01:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw può eseguire una CLI di IA locale come soluzione di ripiego solo testuale quando i provider API non sono disponibili, soggetti a limiti di frequenza o funzionano in modo anomalo. Il comportamento è intenzionalmente prudente:

- Gli strumenti di OpenClaw non vengono inseriti direttamente, ma un backend con `bundleMcp: true` può ricevere gli strumenti del Gateway tramite un bridge MCP su local loopback.
- Streaming JSONL per le CLI che lo supportano.
- Le sessioni sono supportate, quindi i turni successivi rimangono coerenti.
- Le immagini vengono trasmesse se la CLI accetta percorsi di immagini.

Usalo come rete di sicurezza per risposte testuali che "funzionano sempre", non come percorso principale. Per un runtime completo dell'harness con controlli delle sessioni ACP, attività in background, associazione a thread/conversazioni e sessioni esterne persistenti di programmazione, usa invece gli [agenti ACP](/it/tools/acp-agents); i backend CLI non sono ACP.

<Tip>
  Stai creando un nuovo Plugin di backend? Consulta [Plugin di backend CLI](/it/plugins/cli-backend-plugins). Questa pagina descrive come configurare e utilizzare un backend già registrato.
</Tip>

## Avvio rapido

Il Plugin Anthropic incluso registra un backend `claude-cli` predefinito, quindi funziona senza alcuna configurazione oltre ad avere Claude Code installato e con l'accesso effettuato:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` è l'ID agente predefinito quando non è configurato alcun elenco esplicito di agenti; in caso contrario, sostituiscilo con il tuo ID agente.

Se il Gateway viene eseguito tramite launchd/systemd con un `PATH` minimo, indica esplicitamente il percorso del binario:

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

Se usi un backend CLI incluso come provider principale dei messaggi su un host Gateway, OpenClaw carica automaticamente il Plugin incluso proprietario quando la configurazione fa riferimento a quel backend in un riferimento di modello o in `agents.defaults.cliBackends`.

## Utilizzo come soluzione di ripiego

Aggiungi il backend CLI all'elenco delle soluzioni di ripiego affinché venga eseguito solo quando i modelli principali non riescono:

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

Se usi `agents.defaults.models` come elenco di elementi consentiti, includi anche i modelli del tuo backend CLI. Quando il provider principale non riesce a funzionare (autenticazione, limiti di frequenza, timeout), OpenClaw prova successivamente il backend CLI.

## Configurazione

Tutti i backend CLI si trovano in `agents.defaults.cliBackends`, indicizzati per ID provider (ad esempio `claude-cli`, `my-cli`). L'ID provider diventa la parte sinistra del riferimento di modello: `<provider>/<model>`.

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
          // Flag dedicato per il file del prompt:
          // systemPromptFileArg: "--system-file",
          // In alternativa, flag di override della configurazione in stile Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Abilita solo se questo backend può reinizializzare le sessioni invalidate
          // dalla cronologia grezza e limitata della trascrizione OpenClaw prima della Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Funzionamento

1. Seleziona un backend in base al prefisso del provider (`claude-cli/...`).
2. Crea un prompt di sistema usando lo stesso prompt e lo stesso contesto dello spazio di lavoro di OpenClaw.
3. Esegue la CLI con un ID sessione (se supportato), affinché la cronologia rimanga coerente. Il backend `claude-cli` incluso mantiene attivo un processo stdio di Claude per ogni sessione OpenClaw e invia i turni successivi tramite stdin stream-json.
4. Analizza l'output (JSON o testo normale) e restituisce il testo finale.
5. Salva gli ID sessione per ciascun backend, affinché i turni successivi riutilizzino la stessa sessione CLI.

### Specifiche della CLI Claude

Il backend `claude-cli` incluso preferisce il risolutore nativo delle Skills di Claude Code. Quando l'istantanea corrente delle Skills contiene almeno una Skill selezionata con un percorso materializzato, OpenClaw passa un Plugin temporaneo di Claude Code tramite `--plugin-dir` e omette il catalogo duplicato delle Skills di OpenClaw dal prompt di sistema aggiunto. In assenza di una Skill del Plugin materializzata, OpenClaw mantiene il catalogo nel prompt come soluzione di ripiego. Gli override delle variabili di ambiente e delle chiavi API delle Skills continuano ad applicarsi all'ambiente del processo figlio per l'esecuzione.

La CLI Claude dispone di una propria modalità di autorizzazione non interattiva; OpenClaw la associa ai criteri di esecuzione esistenti anziché aggiungere una configurazione specifica per Claude. Per le sessioni live di Claude gestite da OpenClaw, i criteri di esecuzione effettivi sono vincolanti: la modalità YOLO (`tools.exec.security: "full"` e `tools.exec.ask: "off"`) avvia Claude con `--permission-mode bypassPermissions`, mentre criteri restrittivi lo avviano con `--permission-mode default`. Le impostazioni `agents.list[].tools.exec` specifiche per agente sostituiscono quelle globali di `tools.exec` per quell'agente. Gli argomenti grezzi del backend possono comunque includere `--permission-mode`, ma gli avvii live di Claude normalizzano tale flag affinché corrisponda ai criteri effettivi.

Il backend associa inoltre i livelli `/think` di OpenClaw al flag nativo `--effort` di Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, mentre `high`/`xhigh`/`max` vengono trasmessi direttamente. `adaptive` rimuove i flag `--effort` configurati e non fornisce alcuna sostituzione, quindi Claude Code determina il livello di impegno effettivo in base al proprio ambiente, alle proprie impostazioni e ai valori predefiniti del modello. Affinché `/think` influisca sulla CLI avviata, gli altri backend CLI richiedono che il Plugin proprietario dichiari un'associazione argv equivalente.

Prima che OpenClaw possa usare `claude-cli`, è necessario aver effettuato l'accesso a Claude Code sullo stesso host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Le installazioni Docker richiedono che Claude Code sia installato e che l'accesso sia stato effettuato nella home persistente del container, non soltanto sull'host; consulta [Backend CLI Claude in Docker](/it/install/docker#claude-cli-backend-in-docker).

Imposta `agents.defaults.cliBackends.claude-cli.command` solo quando il binario `claude` non è già presente in `PATH`.

## Sessioni

- Se la CLI supporta le sessioni, imposta `sessionArg` (ad esempio `--session-id`) oppure `sessionArgs` (segnaposto `{sessionId}`) quando l'ID deve essere inserito in più flag.
- Se la CLI usa un sottocomando di ripresa con flag diversi, imposta `resumeArgs` (sostituisce `args` durante la ripresa) e, facoltativamente, `resumeOutput` per riprese non JSON.
- `sessionMode`:
  - `always`: invia sempre un ID sessione (un nuovo UUID se non ne è memorizzato alcuno).
  - `existing`: invia un ID sessione solo se ne è già stato memorizzato uno.
  - `none`: non invia mai un ID sessione.
- Per impostazione predefinita, `claude-cli` usa `liveSession: "claude-stdio"`, `output: "jsonl"` e `input: "stdin"`, quindi i turni successivi riutilizzano il processo Claude live finché è attivo, anche con configurazioni personalizzate che omettono i campi di trasporto. Se il Gateway si riavvia o il processo inattivo termina, OpenClaw riprende dall'ID sessione Claude memorizzato. Prima della ripresa, gli ID sessione memorizzati vengono verificati rispetto a una trascrizione di progetto leggibile; una trascrizione mancante elimina l'associazione (registrata come `reason=transcript-missing`) anziché avviare silenziosamente una nuova sessione con `--resume`.
- Le sessioni live di Claude mantengono limiti circoscritti per l'output JSONL: per impostazione predefinita, 8 MiB e 20.000 righe JSONL grezze per turno. È possibile aumentarli per backend con `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` e `maxTurnLines`; OpenClaw limita tali impostazioni rispettivamente a 64 MiB e 100.000 righe.
- Le sessioni CLI memorizzate costituiscono una continuità di proprietà del provider. Il ripristino giornaliero implicito delle sessioni non le interrompe; `/reset` e i criteri espliciti `session.reset` continuano invece a farlo.
- Le nuove sessioni CLI normalmente vengono reinizializzate solo dal riepilogo della Compaction di OpenClaw e dalla parte successiva alla Compaction. Per recuperare sessioni brevi invalidate prima della Compaction, un backend può abilitare `reseedFromRawTranscriptWhenUncompacted: true`. La reinizializzazione dalla trascrizione grezza rimane limitata ed è consentita solo per invalidazioni sicure, come una trascrizione CLI mancante, una sequenza finale orfana di utilizzo degli strumenti, modifiche ai criteri dei messaggi, al prompt di sistema, alla directory di lavoro o a MCP, oppure un nuovo tentativo dovuto alla scadenza della sessione; le modifiche al profilo di autenticazione o all'epoca delle credenziali non reinizializzano mai la cronologia grezza della trascrizione.

Serializzazione: `serialize: true` mantiene ordinate le esecuzioni nella stessa corsia (la maggior parte delle CLI serializza su una singola corsia del provider). OpenClaw interrompe inoltre il riutilizzo della sessione CLI memorizzata quando cambia l'identità di autenticazione selezionata, compresi un ID del profilo di autenticazione, una chiave API statica, un token statico o l'identità dell'account OAuth modificati, quando la CLI ne espone una; la sola rotazione dei token OAuth di accesso o aggiornamento non interrompe la sessione. Se una CLI non dispone di un ID account OAuth stabile, OpenClaw lascia che sia la CLI stessa ad applicare le proprie autorizzazioni di ripresa.

## Preambolo di ripiego dalle sessioni claude-cli

Quando un tentativo `claude-cli` passa a un candidato non CLI in [`agents.defaults.model.fallbacks`](/it/concepts/model-failover), OpenClaw inizializza il tentativo successivo con un preambolo di contesto ricavato dalla trascrizione JSONL locale di Claude Code (in `~/.claude/projects/`, indicizzata per spazio di lavoro). Senza questa inizializzazione, il provider di ripiego parte senza contesto, poiché la trascrizione della sessione di OpenClaw è vuota per le esecuzioni `claude-cli`.

- Il preambolo preferisce il riepilogo `/compact` o il marcatore `compact_boundary` più recente, quindi aggiunge i turni più recenti successivi al limite fino a raggiungere un limite di caratteri. I turni precedenti al limite vengono eliminati perché sono già rappresentati dal riepilogo.
- I blocchi degli strumenti vengono raggruppati in indicazioni compatte `(tool call: name)` e `(tool result: …)` per rispettare il budget del prompt; un riepilogo troppo grande viene troncato e contrassegnato con `(truncated)`.
- I passaggi di ripiego da `claude-cli` a `claude-cli` con lo stesso provider si affidano al `--resume` di Claude e ignorano il preambolo.
- L'inizializzazione riutilizza la convalida esistente del percorso del file di sessione Claude, quindi non è possibile leggere percorsi arbitrari.

## Immagini

Se la tua CLI accetta percorsi di immagini, imposta `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scrive le immagini base64 in file temporanei. Se `imageArg` è impostato, tali percorsi vengono passati come argomenti della CLI; in caso contrario, OpenClaw aggiunge i percorsi dei file al prompt (inserimento del percorso), una modalità compatibile con le CLI che caricano automaticamente i file locali dai percorsi in testo normale.

## Input e output

- `output: "text"` (predefinito) considera stdout come risposta finale.
- `output: "json"` tenta di analizzare il JSON ed estrarre il testo insieme a un ID sessione.
- `output: "jsonl"` analizza un flusso JSONL ed estrae il messaggio finale dell'agente insieme agli identificatori di sessione, quando presenti.
- Per l'output JSON della CLI Gemini, OpenClaw legge il testo della risposta da `response` e l'utilizzo da `stats` quando `usage` è mancante o vuoto. La configurazione predefinita della CLI Gemini inclusa usa `stream-json`; i precedenti override `--output-format json` continuano a usare il parser JSON.

Modalità di input:

- `input: "arg"` (predefinita) passa il prompt come ultimo argomento della CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo ed è impostato `maxPromptArgChars`, viene invece utilizzato stdin.

## Valori predefiniti di proprietà del Plugin

I valori predefiniti dei backend CLI fanno parte della superficie del Plugin:

- I Plugin li registrano con `api.registerCliBackend(...)`.
- L'`id` del backend diventa il prefisso del provider nei riferimenti dei modelli.
- La configurazione utente in `agents.defaults.cliBackends.<id>` continua a sostituire il valore predefinito del Plugin.
- La pulizia della configurazione specifica del backend rimane di proprietà del Plugin tramite l'hook facoltativo `normalizeConfig`.

Anthropic è proprietaria di `claude-cli` e Google è proprietaria di `google-gemini-cli`. Le esecuzioni dell'agente OpenAI Codex usano l'harness app-server di Codex tramite `openai/*`; OpenClaw non registra più un backend `codex-cli` incluso.

Il Plugin Anthropic incluso registra per `claude-cli`:

| Chiave                | Valore                                                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

Il Plugin Google incluso viene registrato per `google-gemini-cli`:

| Chiave                    | Valore                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | uguale, con `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Prerequisito: la CLI Gemini locale deve essere installata e disponibile nel `PATH` come `gemini` (`brew install gemini-cli` oppure `npm install -g @google/gemini-cli`).

Note sull'output della CLI Gemini:

- Il parser `stream-json` predefinito legge gli eventi `message` dell'assistente, gli eventi degli strumenti, l'utilizzo nel `result` finale e gli eventi di errore irreversibile di Gemini.
- Se si sostituiscono gli argomenti di Gemini con `--output-format json`, OpenClaw normalizza nuovamente tale backend in `output: "json"` e legge il testo della risposta dal campo JSON `response`.
- In assenza di `usage`, o se è vuoto, per l'utilizzo viene usato `stats`; `stats.cached` viene normalizzato nel campo `cacheRead` di OpenClaw e, se `stats.input` è assente, i token di input vengono ricavati da `stats.input_tokens - stats.cached`.

Sostituire i valori predefiniti solo se necessario, più comunemente per specificare un percorso `command` assoluto.

## Sovrapposizioni di trasformazione del testo

I Plugin che richiedono piccoli adattamenti di compatibilità per prompt o messaggi possono dichiarare trasformazioni bidirezionali del testo senza sostituire un provider o un backend CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` riscrive il prompt di sistema e il prompt utente passati alla CLI. `output` riscrive il testo trasmesso in streaming dall'assistente e il testo finale analizzato prima che OpenClaw gestisca i propri marcatori di controllo e l'invio al canale; per le chiamate ai modelli basate su provider, ripristina inoltre i valori stringa all'interno degli argomenti strutturati delle chiamate agli strumenti dopo la riparazione dello stream e prima dell'esecuzione dello strumento. I frammenti JSON non elaborati del provider rimangono invariati; i componenti che li utilizzano devono servirsi del payload strutturato parziale, finale o del risultato.

Per le CLI che emettono eventi JSONL specifici del provider, impostare `jsonlDialect` nella configurazione del relativo backend: `claude-stream-json` per gli stream compatibili con Claude Code, `gemini-stream-json` per gli eventi `stream-json` della CLI Gemini.

## Titolarità della Compaction nativa

Alcuni backend CLI eseguono un agente che compatta autonomamente la propria trascrizione, quindi OpenClaw non deve eseguire su di essi il proprio riepilogo di sicurezza: farlo interferisce con la Compaction del backend e può causare l'interruzione definitiva del turno.

`claude-cli` non dispone di un endpoint dell'harness (Claude Code esegue internamente la Compaction), quindi dichiara `ownsNativeCompaction: true` e il percorso di Compaction di OpenClaw restituisce invariata la voce della sessione. Le sessioni con harness nativo, come Codex, continuano invece a essere instradate al rispettivo endpoint di Compaction dell'harness.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Dichiarare `ownsNativeCompaction` solo per un backend che gestisce realmente la Compaction: deve limitare in modo affidabile la propria trascrizione in prossimità della finestra di contesto e rendere persistente una sessione ripristinabile, ad esempio tramite `--resume` / `--session-id`; in caso contrario, una sessione rinviata può rimanere oltre il budget.

## Sovrapposizioni MCP incluse

I backend CLI non ricevono direttamente le chiamate agli strumenti di OpenClaw, ma un backend può scegliere di utilizzare una sovrapposizione di configurazione MCP generata tramite `bundleMcp: true`. Comportamento attualmente incluso:

- `claude-cli`: file di configurazione MCP rigoroso generato.
- `google-gemini-cli`: file delle impostazioni di sistema Gemini generato.

Quando MCP incluso è abilitato, OpenClaw:

- avvia un server MCP HTTP su local loopback che espone gli strumenti del Gateway al processo CLI, autenticato mediante un'autorizzazione di contesto specifica per l'esecuzione (`OPENCLAW_MCP_TOKEN`), attiva solo per il tentativo di esecuzione corrente;
- vincola l'accesso agli strumenti al contesto di sessione, account e canale selezionato dal Gateway, anziché considerare attendibili le intestazioni del processo figlio;
- carica i server MCP inclusi abilitati per l'area di lavoro corrente e li unisce all'eventuale struttura di configurazione o impostazioni MCP già esistente del backend;
- riscrive la configurazione di avvio usando la modalità di integrazione del backend definita dal Plugin proprietario.

Se non è abilitato alcun server MCP, OpenClaw inserisce comunque una configurazione rigorosa quando un backend sceglie di utilizzare MCP incluso, in modo che le esecuzioni in background rimangano isolate.

I runtime MCP inclusi con ambito di sessione vengono memorizzati nella cache per essere riutilizzati all'interno della sessione, quindi vengono terminati dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (valore predefinito: 10 minuti; impostare `0` per disabilitare). Le esecuzioni incorporate singole, come le verifiche di autenticazione, la generazione di slug e il recupero da Active Memory, richiedono la pulizia al termine dell'esecuzione affinché i processi figli stdio e gli stream HTTP/SSE trasmissibili non sopravvivano all'esecuzione.

## Limite della cronologia per la reinizializzazione

Quando una nuova sessione CLI viene inizializzata a partire da una precedente trascrizione di OpenClaw, ad esempio dopo un nuovo tentativo dovuto a `session_expired`, il blocco `<conversation_history>` sottoposto a rendering viene limitato per evitare che i prompt di reinizializzazione crescano in modo incontrollato. Il valore predefinito è 12.288 caratteri, circa 3.000 token.

I backend della CLI Claude adeguano invece questo limite alla finestra di contesto Claude risolta: le finestre di contesto più ampie ricevono una porzione maggiore della cronologia precedente, fino a un limite massimo fisso; gli altri backend CLI mantengono il valore predefinito prudenziale. Questo limite regola esclusivamente il blocco della cronologia precedente nel prompt di reinizializzazione; i limiti dell'output della sessione attiva vengono configurati separatamente in `reliability.outputLimits` (consultare [Sessioni](#sessions)).

## Limitazioni

- Nessuna chiamata diretta agli strumenti di OpenClaw: OpenClaw non inserisce chiamate agli strumenti nel protocollo del backend CLI. I backend vedono gli strumenti del Gateway solo quando scelgono di utilizzare `bundleMcp: true`.
- Lo streaming dipende dal backend: alcuni backend trasmettono JSONL in streaming, mentre altri accumulano i dati fino al termine.
- Gli output strutturati dipendono dal formato JSON della CLI stessa.

## Risoluzione dei problemi

| Sintomo                          | Soluzione                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------- |
| CLI non trovata                  | Impostare `command` su un percorso completo.                                      |
| Nome del modello errato          | Usare `modelAliases` per associare `provider/model` all'ID modello della CLI.      |
| Nessuna continuità della sessione | Assicurarsi che `sessionArg` sia impostato e che `sessionMode` non sia `none`.     |
| Immagini ignorate                | Impostare `imageArg` e verificare che la CLI supporti i percorsi dei file.         |

## Contenuti correlati

- [Manuale operativo del Gateway](/it/gateway)
- [Modelli locali](/it/gateway/local-models)
