---
read_when:
    - Si desidera un fallback affidabile quando i provider API non funzionano
    - Si eseguono CLI di IA locali e si desidera riutilizzarle
    - Si desidera comprendere il bridge di loopback MCP per l'accesso agli strumenti del backend CLI
summary: 'Backend CLI: fallback alla CLI IA locale con bridge opzionale per strumenti MCP'
title: Backend CLI
x-i18n:
    generated_at: "2026-07-16T14:19:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw può eseguire una CLI AI locale come soluzione di ripiego esclusivamente testuale quando i provider API non sono disponibili, sono soggetti a limitazione della frequenza o presentano malfunzionamenti. Il comportamento è intenzionalmente prudente:

- Gli strumenti OpenClaw non vengono inseriti direttamente, ma un backend con `bundleMcp: true` può ricevere gli strumenti del Gateway tramite un bridge MCP di loopback.
- Streaming JSONL per le CLI che lo supportano.
- Le sessioni sono supportate, quindi i turni successivi rimangono coerenti.
- Le immagini vengono trasmesse se la CLI accetta percorsi di immagini.

Usarlo come rete di sicurezza per risposte testuali che «funzionano sempre», non come percorso principale. Per un runtime harness completo con controlli delle sessioni ACP, attività in background, associazione a thread/conversazioni e sessioni di programmazione esterne persistenti, usare invece gli [agenti ACP](/it/tools/acp-agents); i backend CLI non sono ACP.

<Tip>
  Si sta creando un nuovo plugin backend? Consultare [Plugin backend CLI](/it/plugins/cli-backend-plugins). Questa pagina descrive come configurare e utilizzare un backend già registrato.
</Tip>

## Avvio rapido

Il plugin Anthropic incluso registra un backend `claude-cli` predefinito, quindi funziona senza configurazione aggiuntiva, purché Claude Code sia installato e autenticato:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` è l'ID agente predefinito quando non è configurato alcun elenco esplicito di agenti; in caso contrario, sostituirlo con il proprio ID agente.

Se il Gateway viene eseguito tramite launchd/systemd con un `PATH` minimale, indicare esplicitamente il percorso del binario:

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

Se si usa un backend CLI incluso come provider principale dei messaggi su un host Gateway, OpenClaw carica automaticamente il plugin incluso proprietario quando la configurazione fa riferimento a tale backend in un riferimento di modello o sotto `agents.defaults.cliBackends`.

## Utilizzo come soluzione di ripiego

Aggiungere il backend CLI all'elenco delle soluzioni di ripiego, affinché venga eseguito solo quando i modelli principali non riescono:

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

Se si usa `agents.defaults.models` come elenco consentito, includervi anche i modelli del backend CLI. Quando il provider principale non riesce, ad esempio per autenticazione, limiti di frequenza o timeout, OpenClaw prova successivamente il backend CLI.

## Configurazione

Tutti i backend CLI si trovano sotto `agents.defaults.cliBackends`, indicizzati per ID provider, ad esempio `claude-cli` e `my-cli`. L'ID provider diventa il lato sinistro del riferimento di modello: `<provider>/<model>`.

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
          // In alternativa, flag di sostituzione della configurazione in stile Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Abilitare solo se questo backend può reinizializzare le sessioni invalidate dalla
          // cronologia grezza e limitata della trascrizione OpenClaw prima della Compaction.
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
2. Crea un prompt di sistema usando lo stesso prompt OpenClaw e lo stesso contesto dello spazio di lavoro.
3. Esegue la CLI con un ID sessione, se supportato, affinché la cronologia rimanga coerente. Il backend `claude-cli` incluso mantiene attivo un processo stdio di Claude per ogni sessione OpenClaw e invia i turni successivi tramite stdin stream-json.
4. Analizza l'output, JSON o testo normale, e restituisce il testo finale.
5. Mantiene gli ID sessione per ciascun backend affinché i turni successivi riutilizzino la stessa sessione CLI.

### Specificità della CLI Claude

Il backend `claude-cli` incluso privilegia il risolutore nativo delle skill di Claude Code. Quando l'istantanea corrente delle skill contiene almeno una skill selezionata con un percorso materializzato, OpenClaw passa un plugin Claude Code temporaneo tramite `--plugin-dir` e omette il catalogo duplicato delle skill OpenClaw dal prompt di sistema aggiunto. In assenza di una skill del plugin materializzata, OpenClaw mantiene il catalogo nel prompt come soluzione di ripiego. Le sostituzioni delle variabili d'ambiente e delle chiavi API delle skill continuano ad applicarsi all'ambiente del processo figlio per l'esecuzione.

La CLI Claude dispone di una propria modalità di autorizzazione non interattiva; OpenClaw la associa ai criteri di esecuzione esistenti anziché aggiungere una configurazione specifica per Claude. Per le sessioni Claude attive gestite da OpenClaw, i criteri di esecuzione effettivi sono vincolanti: YOLO (`tools.exec.security: "full"` e `tools.exec.ask: "off"`) normalmente avvia Claude con `--permission-mode bypassPermissions`, mentre criteri restrittivi lo avviano con `--permission-mode default`. Anche i Gateway eseguiti come root usano `default`, perché Claude Code rifiuta la modalità di bypass per root; OpenClaw continua comunque a rispondere alle richieste stdio di controllo degli strumenti di Claude in base ai criteri di esecuzione configurati. Le impostazioni `agents.list[].tools.exec` per agente sostituiscono l'impostazione globale `tools.exec` per tale agente. Gli argomenti grezzi del backend possono comunque includere `--permission-mode`, ma gli avvii Claude attivi normalizzano tale flag per renderlo conforme ai criteri effettivi e alla restrizione dell'host.

Il backend associa inoltre i livelli `/think` di OpenClaw al flag nativo `--effort` di Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, mentre `high`/`xhigh`/`max` vengono trasmessi direttamente. In questo modo, i livelli di impegno Fable 5 supportati rimangono gli stessi sia per la CLI Claude basata su abbonamento sia per i percorsi con chiave API. `adaptive` rimuove i flag `--effort` configurati e non fornisce alcuna sostituzione, quindi Claude Code determina il livello di impegno effettivo dal proprio ambiente, dalle impostazioni e dai valori predefiniti del modello. Perché `/think` influisca sulla CLI avviata, gli altri backend CLI richiedono che il plugin proprietario dichiari un'associazione argv equivalente.

Prima che OpenClaw possa usare `claude-cli`, Claude Code deve essere autenticato sullo stesso host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Le installazioni Docker richiedono che Claude Code sia installato e autenticato nella home persistente del container, non soltanto sull'host; consultare [Backend CLI Claude in Docker](/it/install/docker#claude-cli-backend-in-docker).

Impostare `agents.defaults.cliBackends.claude-cli.command` solo quando il binario `claude` non è già presente in `PATH`.

## Sessioni

- Se la CLI supporta le sessioni, impostare `sessionArg`, ad esempio `--session-id`, oppure `sessionArgs`, con il segnaposto `{sessionId}`, quando l'ID deve essere inserito in più flag.
- Se la CLI usa un sottocomando di ripresa con flag diversi, impostare `resumeArgs`, che sostituisce `args` durante la ripresa, e facoltativamente `resumeOutput` per le riprese non JSON.
- `sessionMode`:
  - `always`: invia sempre un ID sessione, generando un nuovo UUID se non ne è memorizzato alcuno.
  - `existing`: invia un ID sessione solo se ne era già stato memorizzato uno.
  - `none`: non invia mai un ID sessione.
- `claude-cli` usa come valori predefiniti `liveSession: "claude-stdio"`, `output: "jsonl"` e `input: "stdin"`, quindi i turni successivi riutilizzano il processo Claude attivo finché rimane in esecuzione, anche per le configurazioni personalizzate che omettono i campi di trasporto. Se il Gateway viene riavviato o il processo inattivo termina, OpenClaw riprende dall'ID sessione Claude memorizzato. Prima della ripresa, gli ID sessione memorizzati vengono verificati rispetto a una trascrizione di progetto leggibile; una trascrizione mancante elimina l'associazione, registrando `reason=transcript-missing`, anziché avviare silenziosamente una nuova sessione sotto `--resume`.
- Le sessioni Claude attive mantengono limiti controllati per l'output JSONL: per impostazione predefinita, 8 MiB e 20,000 righe JSONL grezze per turno. È possibile aumentarli per ciascun backend con `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` e `maxTurnLines`; OpenClaw limita tali impostazioni rispettivamente a 64 MiB e 100,000 righe.
- Le sessioni CLI memorizzate rappresentano una continuità di proprietà del provider. La reimpostazione giornaliera implicita della sessione non le interrompe; `/reset` e i criteri espliciti `session.reset` continuano invece a farlo.
- Le nuove sessioni CLI vengono normalmente reinizializzate soltanto dal riepilogo di Compaction di OpenClaw e dalla parte successiva alla Compaction. Per recuperare sessioni brevi invalidate prima della Compaction, un backend può abilitarlo con `reseedFromRawTranscriptWhenUncompacted: true`. La reinizializzazione dalla trascrizione grezza rimane limitata ed è consentita solo per invalidazioni sicure, come una trascrizione CLI mancante, una coda di utilizzo degli strumenti orfana, modifiche ai criteri dei messaggi, al prompt di sistema, alla directory di lavoro o a MCP oppure un nuovo tentativo dovuto alla scadenza della sessione; le modifiche al profilo di autenticazione o all'epoca delle credenziali non reinizializzano mai la cronologia grezza della trascrizione.

Serializzazione: `serialize: true` mantiene ordinate le esecuzioni nella stessa corsia; la maggior parte delle CLI viene serializzata in un'unica corsia del provider. OpenClaw interrompe inoltre il riutilizzo della sessione CLI memorizzata quando cambia l'identità di autenticazione selezionata, inclusi la modifica dell'ID del profilo di autenticazione, della chiave API statica, del token statico o dell'identità dell'account OAuth quando la CLI ne espone una; la sola rotazione dei token di accesso o aggiornamento OAuth non interrompe la sessione. Se una CLI non dispone di un ID account OAuth stabile, OpenClaw consente alla CLI stessa di applicare le proprie autorizzazioni di ripresa.

## Preambolo di ripiego dalle sessioni claude-cli

Quando un tentativo `claude-cli` passa a un candidato non CLI in [`agents.defaults.model.fallbacks`](/it/concepts/model-failover), OpenClaw inizializza il tentativo successivo con un preambolo di contesto ricavato dalla trascrizione JSONL locale di Claude Code, sotto `~/.claude/projects/` e indicizzato per spazio di lavoro. Senza questa inizializzazione, il provider di ripiego parte senza contesto, poiché la trascrizione della sessione di OpenClaw è vuota per le esecuzioni `claude-cli`.

- Il preambolo privilegia il riepilogo `/compact` o l'indicatore `compact_boundary` più recente, quindi aggiunge i turni più recenti successivi al limite fino a raggiungere un budget di caratteri. I turni precedenti al limite vengono eliminati perché il riepilogo li rappresenta già.
- I blocchi degli strumenti vengono raggruppati in indicazioni compatte `(tool call: name)` e `(tool result: …)` per rispettare il budget del prompt; un riepilogo troppo grande viene troncato ed etichettato `(truncated)`.
- Le soluzioni di ripiego dello stesso provider da `claude-cli` a `claude-cli` si basano sul meccanismo `--resume` di Claude e omettono il preambolo.
- L'inizializzazione riutilizza la convalida esistente del percorso del file di sessione Claude, impedendo la lettura di percorsi arbitrari.

## Immagini

Se la CLI accetta percorsi di immagini, impostare `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw scrive le immagini base64 in file temporanei. Se `imageArg` è impostato, tali percorsi vengono passati come argomenti della CLI; in caso contrario, OpenClaw aggiunge i percorsi dei file al prompt, tramite inserimento del percorso, operazione compatibile con le CLI che caricano automaticamente i file locali da percorsi in testo normale.

## Input e output

- `output: "text"`, valore predefinito, considera stdout come risposta finale.
- `output: "json"` tenta di analizzare il JSON ed estrarre il testo insieme a un ID sessione.
- `output: "jsonl"` analizza un flusso JSONL ed estrae il messaggio finale dell'agente insieme agli identificatori di sessione, quando presenti.
- Per l'output JSON della CLI Gemini, OpenClaw legge il testo della risposta da `response` e l'utilizzo da `stats` quando `usage` è mancante o vuoto. Il valore predefinito della CLI Gemini inclusa usa `stream-json`; le vecchie sostituzioni `--output-format json` continuano a usare l'analizzatore JSON.

Modalità di input:

- `input: "arg"` (impostazione predefinita) passa il prompt come ultimo argomento della CLI.
- `input: "stdin"` invia il prompt tramite stdin.
- Se il prompt è molto lungo e `maxPromptArgChars` è impostato, viene invece usato stdin.

## Impostazioni predefinite di proprietà del plugin

Le impostazioni predefinite del backend CLI fanno parte della superficie del plugin:

- I plugin le registrano con `api.registerCliBackend(...)`.
- Il valore `id` del backend diventa il prefisso del provider nei riferimenti ai modelli.
- La configurazione utente in `agents.defaults.cliBackends.<id>` continua ad avere la precedenza sull'impostazione predefinita del plugin.
- La pulizia della configurazione specifica del backend resta di proprietà del plugin tramite l'hook facoltativo `normalizeConfig`.

Anthropic è proprietaria di `claude-cli` e Google è proprietaria di `google-gemini-cli`. Le esecuzioni dell'agente OpenAI Codex usano l'harness app-server di Codex tramite `openai/*`; OpenClaw non registra più un backend `codex-cli` incluso.

Il plugin Anthropic incluso esegue la registrazione per `claude-cli`:

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

Il plugin Google incluso esegue la registrazione per `google-gemini-cli`:

| Chiave                    | Valore                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | lo stesso, con `--resume {sessionId}`                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Prerequisito: la CLI Gemini locale deve essere installata e disponibile in `PATH` come `gemini` (`brew install gemini-cli` o `npm install -g @google/gemini-cli`).

Note sull'output della CLI Gemini:

- Il parser `stream-json` predefinito legge gli eventi `message` dell'assistente, gli eventi degli strumenti, l'utilizzo `result` finale e gli eventi di errore irreversibile di Gemini.
- Se gli argomenti di Gemini vengono sostituiti con `--output-format json`, OpenClaw normalizza nuovamente tale backend in `output: "json"` e legge il testo della risposta dal campo JSON `response`.
- L'utilizzo ripiega su `stats` quando `usage` è assente o vuoto; `stats.cached` viene normalizzato in `cacheRead` di OpenClaw e, se `stats.input` è assente, i token di input vengono ricavati da `stats.input_tokens - stats.cached`.

Sostituire le impostazioni predefinite solo se necessario (più comunemente per indicare un percorso `command` assoluto).

## Overlay di trasformazione del testo

I plugin che richiedono piccoli shim di compatibilità per prompt o messaggi possono dichiarare trasformazioni bidirezionali del testo senza sostituire un provider o un backend CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` riscrive il prompt di sistema e il prompt utente passati alla CLI. `output` riscrive il testo dell'assistente trasmesso in streaming e il testo finale analizzato prima che OpenClaw gestisca i propri marcatori di controllo e la consegna al canale; per le chiamate ai modelli basate su provider, ripristina inoltre i valori stringa negli argomenti strutturati delle chiamate agli strumenti dopo la riparazione dello stream e prima dell'esecuzione degli strumenti. I frammenti JSON non elaborati del provider restano invariati; i consumer devono usare il payload strutturato parziale, finale o del risultato.

Per le CLI che emettono eventi JSONL specifici del provider, impostare `jsonlDialect` nella configurazione di tale backend: `claude-stream-json` per gli stream compatibili con Claude Code, `gemini-stream-json` per gli eventi `stream-json` della CLI Gemini.

## Proprietà della Compaction nativa

Alcuni backend CLI eseguono un agente che compatta autonomamente la propria trascrizione, quindi OpenClaw non deve eseguire su di essi il proprio riepilogatore di salvaguardia: farlo entra in conflitto con la Compaction del backend e può causare il fallimento definitivo del turno.

`claude-cli` non dispone di un endpoint dell'harness (Claude Code esegue internamente la Compaction), quindi dichiara `ownsNativeCompaction: true` e il percorso di Compaction di OpenClaw restituisce invariata la voce della sessione. OpenClaw passa il budget di contesto effettivo dell'esecuzione tramite la variabile documentata [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) di Claude Code, mantenendo la Compaction automatica nativa allineata ai limiti `contextTokens` di Anthropic configurati. Le sessioni con harness nativo, come Codex, continuano invece a essere instradate al relativo endpoint di Compaction dell'harness.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Dichiarare `ownsNativeCompaction` solo per un backend che sia effettivamente proprietario della Compaction: deve limitare in modo affidabile la propria trascrizione in prossimità della finestra di contesto e rendere persistente una sessione ripristinabile (ad esempio `--resume` / `--session-id`), altrimenti una sessione differita può rimanere oltre il budget.

## Overlay MCP inclusi

I backend CLI non ricevono direttamente le chiamate agli strumenti di OpenClaw, ma un backend può scegliere di usare un overlay di configurazione MCP generato mediante `bundleMcp: true`. Comportamento attuale dei componenti inclusi:

- `claude-cli`: file di configurazione MCP rigoroso generato.
- `google-gemini-cli`: file delle impostazioni di sistema di Gemini generato.

Quando l'MCP incluso è abilitato, OpenClaw:

- avvia un server MCP HTTP di loopback che espone gli strumenti del Gateway al processo CLI, autenticato mediante una concessione di contesto per esecuzione (`OPENCLAW_MCP_TOKEN`) attiva solo per il tentativo di esecuzione corrente;
- vincola l'accesso agli strumenti alla sessione, all'account e al contesto del canale selezionati dal Gateway, anziché considerare attendibili le intestazioni del processo figlio;
- carica i server MCP inclusi abilitati per l'area di lavoro corrente e li unisce a qualsiasi configurazione o struttura di impostazioni MCP esistente del backend;
- riscrive la configurazione di avvio usando la modalità di integrazione del backend definita dal plugin proprietario.

Se non è abilitato alcun server MCP, OpenClaw inserisce comunque una configurazione rigorosa quando un backend sceglie di usare l'MCP incluso, così le esecuzioni in background restano isolate.

I runtime MCP inclusi con ambito di sessione vengono memorizzati nella cache per essere riutilizzati all'interno di una sessione, quindi vengono terminati dopo `mcp.sessionIdleTtlMs` millisecondi di inattività (impostazione predefinita: 10 minuti; impostare `0` per disabilitare questa funzione). Le esecuzioni integrate una tantum, come le verifiche di autenticazione, la generazione di slug e il richiamo di Active Memory, richiedono la pulizia al termine dell'esecuzione affinché i processi figlio stdio e gli stream HTTP/SSE trasmissibili non sopravvivano all'esecuzione.

## Limite della cronologia di reinizializzazione

Quando una nuova sessione CLI viene inizializzata da una trascrizione OpenClaw precedente (ad esempio dopo un nuovo tentativo `session_expired`), il blocco `<conversation_history>` sottoposto a rendering è limitato per evitare che i prompt di reinizializzazione crescano eccessivamente. Il valore predefinito è 12,288 caratteri (circa 3,000 token).

I backend della CLI Claude dimensionano invece questo limite in base alla finestra di contesto Claude risolta: le finestre di contesto più grandi ricevono una porzione più ampia della cronologia precedente, fino a un limite massimo fisso; gli altri backend CLI mantengono l'impostazione predefinita conservativa. Questo limite regola solo il blocco della cronologia precedente del prompt di reinizializzazione; i limiti dell'output della sessione attiva vengono configurati separatamente in `reliability.outputLimits` (consultare [Sessioni](#sessions)).

## Limitazioni

- Nessuna chiamata diretta agli strumenti di OpenClaw: OpenClaw non inserisce chiamate agli strumenti nel protocollo del backend CLI. I backend vedono gli strumenti del Gateway solo quando scelgono di usare `bundleMcp: true`.
- Lo streaming dipende dal backend: alcuni backend trasmettono JSONL in streaming, altri accumulano i dati fino all'uscita.
- Gli output strutturati dipendono dal formato JSON della CLI.

## Risoluzione dei problemi

| Sintomo                        | Soluzione                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------ |
| CLI non trovata                | Impostare `command` su un percorso completo.                                  |
| Nome del modello errato        | Usare `modelAliases` per associare `provider/model` all'ID modello della CLI. |
| Nessuna continuità di sessione | Assicurarsi che `sessionArg` sia impostato e che `sessionMode` non sia `none`. |
| Immagini ignorate              | Impostare `imageArg` e verificare che la CLI supporti i percorsi dei file.  |

## Risorse correlate

- [Manuale operativo del Gateway](/it/gateway)
- [Modelli locali](/it/gateway/local-models)
