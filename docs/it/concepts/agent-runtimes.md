---
read_when:
    - Stai scegliendo tra PI, Codex, ACP o un altro runtime nativo per agenti
    - Le etichette di provider/modello/runtime nello stato o nella configurazione ti confondono
    - Stai documentando la parità di supporto per un ambiente di test nativo
summary: Come OpenClaw separa fornitori di modelli, modelli, canali e ambienti di esecuzione degli agenti
title: Runtime degli agenti
x-i18n:
    generated_at: "2026-05-03T21:30:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime dell'agente** è il componente che possiede un ciclo del modello preparato: riceve il prompt, guida l'output del modello, gestisce le chiamate agli strumenti nativi e restituisce il turno completato a OpenClaw.

È facile confondere i runtime con i provider perché entrambi compaiono vicino alla configurazione del modello. Sono livelli diversi:

| Livello       | Esempi                               | Cosa significa                                                              |
| ------------- | ------------------------------------ | ---------------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Come OpenClaw autentica, scopre i modelli e denomina i riferimenti modello. |
| Modello       | `gpt-5.5`, `claude-opus-4-6`          | Il modello selezionato per il turno dell'agente.                             |
| Runtime dell'agente | `pi`, `codex`, `claude-cli`      | Il ciclo o backend di basso livello che esegue il turno preparato.           |
| Canale        | Telegram, Discord, Slack, WhatsApp    | Dove i messaggi entrano ed escono da OpenClaw.                               |

Nel codice vedrai anche la parola **harness**. Un harness è l'implementazione che fornisce un runtime dell'agente. Ad esempio, l'harness Codex incluso implementa il runtime `codex`. La configurazione pubblica usa `agentRuntime.id`; `openclaw doctor --fix` riscrive le vecchie chiavi di policy del runtime in questa forma.

Esistono due famiglie di runtime:

- Gli **harness incorporati** vengono eseguiti all'interno del ciclo dell'agente preparato di OpenClaw. Oggi questo include il runtime integrato `pi` più gli harness dei plugin registrati, come `codex`.
- I **backend CLI** eseguono un processo CLI locale mantenendo canonico il riferimento del modello. Ad esempio, `anthropic/claude-opus-4-7` con `agentRuntime.id: "claude-cli"` significa "seleziona il modello Anthropic, esegui tramite Claude CLI." `claude-cli` non è un id di harness incorporato e non deve essere passato alla selezione AgentHarness.

## Superfici Codex

La maggior parte della confusione deriva da diverse superfici che condividono il nome Codex:

| Superficie                                            | Nome/configurazione OpenClaw                | Cosa fa                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime app-server Codex nativo                      | `openai/*` più `agentRuntime.id: "codex"`   | Esegue il turno dell'agente incorporato tramite Codex app-server. Questa è la configurazione abituale per l'abbonamento ChatGPT/Codex. |
| Route provider OAuth Codex                           | riferimenti modello `openai-codex/*`        | Usa OAuth dell'abbonamento ChatGPT/Codex tramite il normale runner PI di OpenClaw.                       |
| Adapter ACP Codex                                    | `runtime: "acp"`, `agentId: "codex"`        | Esegue Codex tramite il piano di controllo esterno ACP/acpx. Usalo solo quando ACP/acpx è richiesto esplicitamente. |
| Set di comandi nativo di controllo chat Codex        | `/codex ...`                                | Collega, riprende, guida, arresta e ispeziona thread Codex app-server dalla chat.                        |
| Route API OpenAI Platform per modelli stile GPT/Codex | riferimenti modello `openai/*`              | Usa l'autenticazione con chiave API OpenAI salvo che un override del runtime, come `agentRuntime.id: "codex"`, esegua il turno. |

Queste superfici sono intenzionalmente indipendenti. Abilitare il plugin `codex` rende disponibili le funzionalità native app-server; non riscrive `openai-codex/*` in `openai/*`, non modifica le sessioni esistenti e non rende ACP il valore predefinito per Codex. Selezionare `openai-codex/*` significa "usa la route provider OAuth Codex", a meno che tu non forzi separatamente un runtime.

La configurazione comune per l'abbonamento ChatGPT/Codex usa OAuth Codex per l'autenticazione, ma mantiene il riferimento del modello come `openai/*` e seleziona il runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Ciò significa che OpenClaw seleziona un riferimento modello OpenAI, poi chiede al runtime Codex app-server di eseguire il turno dell'agente incorporato. Non significa "usa la fatturazione API" e non significa che il canale, il catalogo dei provider di modelli o l'archivio sessioni di OpenClaw diventino Codex.

Quando il plugin `codex` incluso è abilitato, il controllo Codex in linguaggio naturale deve usare la superficie di comando nativa `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) invece di ACP. Usa ACP per Codex solo quando l'utente chiede esplicitamente ACP/acpx o sta testando il percorso dell'adapter ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harness esterni simili continuano a usare ACP.

Questo è l'albero decisionale rivolto all'agente:

1. Se l'utente chiede **Codex bind/control/thread/resume/steer/stop**, usa la superficie di comando nativa `/codex` quando il plugin `codex` incluso è abilitato.
2. Se l'utente chiede **Codex come runtime incorporato** o vuole la normale esperienza agente Codex supportata da abbonamento, usa `openai/<model>` con `agentRuntime.id: "codex"`.
3. Se l'utente chiede **autenticazione OAuth/abbonamento Codex sul normale runner OpenClaw**, usa `openai-codex/<model>` e lascia il runtime come PI.
4. Se l'utente dice esplicitamente **ACP**, **acpx** o **adapter ACP Codex**, usa ACP con `runtime: "acp"` e `agentId: "codex"`.
5. Se la richiesta riguarda **Claude Code, Gemini CLI, OpenCode, Cursor, Droid o un altro harness esterno**, usa ACP/acpx, non il runtime nativo del sub-agente.

| Intendi...                              | Usa...                                      |
| --------------------------------------- | ------------------------------------------- |
| Controllo chat/thread Codex app-server  | `/codex ...` dal plugin `codex` incluso     |
| Runtime dell'agente incorporato Codex app-server | `agentRuntime.id: "codex"`          |
| OAuth OpenAI Codex sul runner PI        | riferimenti modello `openai-codex/*`        |
| Claude Code o altro harness esterno     | ACP/acpx                                    |

Per la divisione dei prefissi della famiglia OpenAI, vedi [OpenAI](/it/providers/openai) e [Provider di modelli](/it/concepts/model-providers). Per il contratto di supporto del runtime Codex, vedi [Harness Codex](/it/plugins/codex-harness#v1-support-contract).

## Proprietà del runtime

Runtime diversi possiedono quantità diverse del ciclo.

| Superficie                  | OpenClaw PI incorporato                 | Codex app-server                                                           |
| --------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Proprietario del ciclo modello | OpenClaw tramite il runner PI incorporato | Codex app-server                                                        |
| Stato canonico del thread   | Transcript OpenClaw                     | Thread Codex, più mirror del transcript OpenClaw                           |
| Strumenti dinamici OpenClaw | Ciclo strumenti nativo OpenClaw         | Collegati tramite l'adapter Codex                                          |
| Strumenti nativi shell e file | Percorso PI/OpenClaw                  | Strumenti nativi Codex, collegati tramite hook nativi dove supportato      |
| Motore di contesto          | Assemblaggio contesto nativo OpenClaw   | OpenClaw proietta il contesto assemblato nel turno Codex                   |
| Compaction                  | OpenClaw o motore di contesto selezionato | Compaction nativa Codex, con notifiche OpenClaw e manutenzione del mirror |
| Consegna canale             | OpenClaw                                | OpenClaw                                                                  |

Questa divisione della proprietà è la regola di progettazione principale:

- Se OpenClaw possiede la superficie, OpenClaw può fornire il normale comportamento degli hook dei plugin.
- Se il runtime nativo possiede la superficie, OpenClaw ha bisogno di eventi runtime o hook nativi.
- Se il runtime nativo possiede lo stato canonico del thread, OpenClaw dovrebbe rispecchiare e proiettare il contesto, non riscrivere internals non supportati.

## Selezione del runtime

OpenClaw sceglie un runtime incorporato dopo la risoluzione di provider e modello:

1. Il runtime registrato di una sessione ha la precedenza. Le modifiche alla configurazione non cambiano a caldo un transcript esistente verso un diverso sistema di thread nativo.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza quel runtime per sessioni nuove o reimpostate.
3. `agents.defaults.agentRuntime.id` o `agents.list[].agentRuntime.id` può impostare `auto`, `pi`, un id di harness incorporato registrato come `codex`, o un alias di backend CLI supportato come `claude-cli`.
4. In modalità `auto`, i runtime dei plugin registrati possono rivendicare coppie provider/modello supportate.
5. Se nessun runtime rivendica un turno in modalità `auto`, OpenClaw usa PI come runtime di compatibilità. Usa un id runtime esplicito quando l'esecuzione deve essere rigorosa.

I runtime plugin espliciti falliscono in modo chiuso. Ad esempio, `agentRuntime.id: "codex"` significa Codex o un chiaro errore di selezione/runtime; non viene mai instradato silenziosamente di nuovo a PI.

Gli alias dei backend CLI sono diversi dagli id degli harness incorporati. La forma preferita per Claude CLI è:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

I riferimenti legacy come `claude-cli/claude-opus-4-7` restano supportati per compatibilità, ma la nuova configurazione dovrebbe mantenere canonico il provider/modello e inserire il backend di esecuzione in `agentRuntime.id`.

La modalità `auto` è intenzionalmente conservativa. I runtime dei plugin possono rivendicare coppie provider/modello che comprendono, ma il plugin Codex non rivendica il provider `openai-codex` in modalità `auto`. Questo mantiene `openai-codex/*` come route OAuth Codex PI esplicita ed evita di spostare silenziosamente le configurazioni con autenticazione da abbonamento sull'harness app-server nativo.

Se `openclaw doctor` avvisa che il plugin `codex` è abilitato mentre `openai-codex/*` continua a passare tramite PI, trattalo come una diagnosi, non come una migrazione. Mantieni invariata la configurazione quando OAuth Codex PI è ciò che desideri. Passa a `openai/<model>` più `agentRuntime.id: "codex"` solo quando vuoi l'esecuzione nativa Codex app-server.

## Contratto di compatibilità

Quando un runtime non è PI, dovrebbe documentare quali superfici OpenClaw supporta. Usa questa forma per la documentazione del runtime:

| Domanda                                | Perché è importante                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Chi possiede il ciclo del modello?     | Determina dove avvengono i tentativi, la continuazione degli strumenti e le decisioni sulla risposta finale. |
| Chi possiede la cronologia canonica del thread? | Determina se OpenClaw può modificare la cronologia o solo rispecchiarla.              |
| Gli strumenti dinamici OpenClaw funzionano? | Messaggistica, sessioni, cron e strumenti di proprietà di OpenClaw dipendono da questo. |
| Gli hook degli strumenti dinamici funzionano? | I plugin si aspettano `before_tool_call`, `after_tool_call` e middleware attorno agli strumenti di proprietà di OpenClaw. |
| Gli hook degli strumenti nativi funzionano? | Shell, patch e strumenti di proprietà del runtime necessitano del supporto degli hook nativi per policy e osservazione. |
| Il ciclo di vita del motore di contesto viene eseguito? | I plugin di memoria e contesto dipendono dai cicli di vita di assemblaggio, ingestione, dopo-turno e compaction. |
| Quali dati di compaction sono esposti? | Alcuni plugin hanno bisogno solo delle notifiche, mentre altri necessitano di metadati mantenuti/scartati. |
| Cosa è intenzionalmente non supportato? | Gli utenti non dovrebbero presumere l'equivalenza con PI dove il runtime nativo possiede più stato. |

Il contratto di supporto del runtime Codex è documentato in [Harness Codex](/it/plugins/codex-harness#v1-support-contract).

## Etichette di stato

L'output di stato può mostrare sia le etichette `Execution` sia `Runtime`. Interpretale come
diagnostica, non come nomi di provider.

- Un riferimento di modello come `openai/gpt-5.5` indica il provider/modello selezionato.
- Un ID di runtime come `codex` indica quale loop sta eseguendo il turno.
- Un'etichetta di canale come Telegram o Discord indica dove si svolge la conversazione.

Se una sessione mostra ancora PI dopo aver modificato la configurazione del runtime, avvia una nuova sessione
con `/new` o cancella quella corrente con `/reset`. Le sessioni esistenti mantengono il
runtime registrato, così una trascrizione non viene riprodotta attraverso due sistemi di sessione nativi
incompatibili.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [OpenAI](/it/providers/openai)
- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Loop agente](/it/concepts/agent-loop)
- [Modelli](/it/concepts/models)
- [Stato](/it/cli/status)
