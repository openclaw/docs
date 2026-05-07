---
read_when:
    - Stai scegliendo tra PI, Codex, ACP o un altro runtime nativo per agenti
    - Le etichette di provider/modello/runtime nello stato o nella configurazione ti confondono
    - Stai documentando la parità di supporto per un harness nativo
summary: Come OpenClaw separa fornitori di modelli, modelli, canali e runtime degli agenti
title: Runtime degli agenti
x-i18n:
    generated_at: "2026-05-07T13:15:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime dell'agente** è il componente che possiede un singolo ciclo del modello preparato: riceve il prompt, pilota l'output del modello, gestisce le chiamate agli strumenti nativi e restituisce il turno completato a OpenClaw.

I runtime sono facili da confondere con i provider perché entrambi compaiono vicino alla configurazione del modello. Sono livelli diversi:

| Livello        | Esempi                                | Cosa significa                                                              |
| -------------- | ------------------------------------- | ---------------------------------------------------------------------------- |
| Provider       | `openai`, `anthropic`, `openai-codex` | Come OpenClaw autentica, scopre i modelli e nomina i riferimenti ai modelli. |
| Modello        | `gpt-5.5`, `claude-opus-4-6`          | Il modello selezionato per il turno dell'agente.                             |
| Runtime agente | `pi`, `codex`, `claude-cli`           | Il ciclo o backend di basso livello che esegue il turno preparato.           |
| Canale         | Telegram, Discord, Slack, WhatsApp    | Dove i messaggi entrano ed escono da OpenClaw.                               |

Nel codice vedrai anche la parola **harness**. Un harness è l'implementazione che fornisce un runtime dell'agente. Per esempio, l'harness Codex incluso implementa il runtime `codex`. La configurazione pubblica usa `agentRuntime.id`; `openclaw doctor --fix` riscrive le vecchie chiavi di policy del runtime in quella forma.

Esistono due famiglie di runtime:

- Gli **harness incorporati** vengono eseguiti dentro il ciclo agente preparato di OpenClaw. Oggi si tratta del runtime integrato `pi` più gli harness Plugin registrati come `codex`.
- I **backend CLI** eseguono un processo CLI locale mantenendo canonico il riferimento al modello. Per esempio, `anthropic/claude-opus-4-7` con `agentRuntime.id: "claude-cli"` significa "seleziona il modello Anthropic, esegui tramite Claude CLI." `claude-cli` non è un id di harness incorporato e non deve essere passato alla selezione AgentHarness.

## Superfici Codex

La maggior parte della confusione deriva da varie superfici diverse che condividono il nome Codex:

| Superficie                                      | Nome/configurazione OpenClaw          | Cosa fa                                                                                                                   |
| ----------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Runtime app-server Codex nativo                 | riferimenti modello `openai/*`        | Esegue i turni agente incorporati OpenAI tramite Codex app-server. Questa è la configurazione abituale ChatGPT/Codex con abbonamento. |
| Profili auth OAuth Codex                        | provider auth `openai-codex`          | Memorizza l'autenticazione dell'abbonamento ChatGPT/Codex consumata dall'harness Codex app-server.                       |
| Adattatore ACP Codex                            | `runtime: "acp"`, `agentId: "codex"` | Esegue Codex tramite il piano di controllo esterno ACP/acpx. Usalo solo quando ACP/acpx è richiesto esplicitamente.       |
| Set di comandi nativo per il controllo chat Codex | `/codex ...`                         | Associa, riprende, guida, arresta e ispeziona thread Codex app-server dalla chat.                                        |
| Route API OpenAI Platform per superfici non agente | `openai/*` più auth con chiave API   | Usata per API OpenAI dirette come immagini, embedding, voce e realtime.                                                  |

Queste superfici sono intenzionalmente indipendenti. Abilitare il Plugin `codex` rende disponibili le funzionalità native dell'app-server; `openclaw doctor --fix` possiede la riparazione delle route legacy `openai-codex/*` e la pulizia dei pin di sessione obsoleti. Selezionare `openai/*` per un modello agente ora significa "eseguilo tramite Codex", a meno che non venga usata una superficie API OpenAI non agente.

La configurazione comune con abbonamento ChatGPT/Codex usa OAuth Codex per l'autenticazione, ma mantiene il riferimento al modello come `openai/*` e seleziona il runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Ciò significa che OpenClaw seleziona un riferimento a un modello OpenAI, poi chiede al runtime Codex app-server di eseguire il turno agente incorporato. Non significa "usa la fatturazione API" e non significa che il canale, il catalogo dei provider di modelli o l'archivio sessioni OpenClaw diventino Codex.

Quando il Plugin `codex` incluso è abilitato, il controllo Codex in linguaggio naturale dovrebbe usare la superficie di comando nativa `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) invece di ACP. Usa ACP per Codex solo quando l'utente chiede esplicitamente ACP/acpx o sta testando il percorso dell'adattatore ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harness esterni simili usano comunque ACP.

Questo è l'albero decisionale rivolto all'agente:

1. Se l'utente chiede **Codex bind/control/thread/resume/steer/stop**, usa la superficie di comando nativa `/codex` quando il Plugin `codex` incluso è abilitato.
2. Se l'utente chiede **Codex come runtime incorporato** o vuole la normale esperienza agente Codex supportata da abbonamento, usa `openai/<model>`.
3. Se l'utente sceglie esplicitamente **PI per un modello OpenAI**, mantieni il riferimento al modello come `openai/<model>` e imposta `agentRuntime.id: "pi"`. Un profilo auth `openai-codex` selezionato viene instradato internamente tramite il trasporto auth Codex legacy di PI.
4. Se la configurazione legacy contiene ancora **riferimenti modello `openai-codex/*`**, riparala in `openai/<model>` con `openclaw doctor --fix`.
5. Se l'utente dice esplicitamente **ACP**, **acpx** o **adattatore ACP Codex**, usa ACP con `runtime: "acp"` e `agentId: "codex"`.
6. Se la richiesta riguarda **Claude Code, Gemini CLI, OpenCode, Cursor, Droid o un altro harness esterno**, usa ACP/acpx, non il runtime sub-agente nativo.

| Vuoi dire...                            | Usa...                                      |
| --------------------------------------- | ------------------------------------------- |
| Controllo chat/thread Codex app-server  | `/codex ...` dal Plugin `codex` incluso     |
| Runtime agente incorporato Codex app-server | riferimenti modello agente `openai/*`   |
| OAuth OpenAI Codex                      | profili auth `openai-codex`                 |
| Claude Code o altro harness esterno     | ACP/acpx                                    |

Per la separazione dei prefissi della famiglia OpenAI, vedi [OpenAI](/it/providers/openai) e [Provider di modelli](/it/concepts/model-providers). Per il contratto di supporto del runtime Codex, vedi [Harness Codex](/it/plugins/codex-harness#v1-support-contract).

## Proprietà del runtime

Runtime diversi possiedono porzioni diverse del ciclo.

| Superficie                  | OpenClaw PI incorporato                    | Codex app-server                                                            |
| --------------------------- | ------------------------------------------ | --------------------------------------------------------------------------- |
| Proprietario del ciclo modello | OpenClaw tramite runner PI incorporato  | Codex app-server                                                            |
| Stato thread canonico       | Trascrizione OpenClaw                      | Thread Codex, più mirror della trascrizione OpenClaw                        |
| Strumenti dinamici OpenClaw | Ciclo strumenti nativo OpenClaw            | Collegati tramite l'adattatore Codex                                        |
| Strumenti shell e file nativi | Percorso PI/OpenClaw                     | Strumenti nativi Codex, collegati tramite hook nativi dove supportato       |
| Motore di contesto          | Assemblaggio contesto nativo OpenClaw      | OpenClaw proietta il contesto assemblato nel turno Codex                    |
| Compaction                  | OpenClaw o motore di contesto selezionato  | Compaction nativa Codex, con notifiche OpenClaw e manutenzione del mirror   |
| Consegna sul canale         | OpenClaw                                   | OpenClaw                                                                    |

Questa separazione della proprietà è la regola principale di progettazione:

- Se OpenClaw possiede la superficie, OpenClaw può fornire il normale comportamento degli hook Plugin.
- Se il runtime nativo possiede la superficie, OpenClaw ha bisogno di eventi runtime o hook nativi.
- Se il runtime nativo possiede lo stato thread canonico, OpenClaw dovrebbe fare mirror e proiettare contesto, non riscrivere internals non supportati.

## Selezione del runtime

OpenClaw sceglie un runtime incorporato dopo la risoluzione di provider e modello:

1. Vince il runtime registrato di una sessione. Le modifiche alla configurazione non spostano a caldo una trascrizione esistente verso un diverso sistema di thread nativo.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza quel runtime per sessioni nuove o reimpostate.
3. `agents.defaults.agentRuntime.id` o `agents.list[].agentRuntime.id` possono impostare `auto`, `pi`, un id di harness incorporato registrato come `codex`, oppure un alias di backend CLI supportato come `claude-cli`.
4. In modalità `auto`, i runtime Plugin registrati possono rivendicare coppie provider/modello supportate.
5. Se nessun runtime rivendica un turno in modalità `auto`, OpenClaw usa PI come runtime di compatibilità. Usa un id runtime esplicito quando l'esecuzione deve essere rigorosa.

I runtime Plugin espliciti falliscono in modo chiuso. Per esempio, `agentRuntime.id: "codex"` significa Codex o un chiaro errore di selezione/runtime; non viene mai instradato silenziosamente di nuovo a PI.

Gli alias dei backend CLI sono diversi dagli id degli harness incorporati. La forma Claude CLI preferita è:

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

Riferimenti legacy come `claude-cli/claude-opus-4-7` rimangono supportati per compatibilità, ma la nuova configurazione dovrebbe mantenere canonici provider/modello e inserire il backend di esecuzione in `agentRuntime.id`.

La modalità `auto` è intenzionalmente conservativa per la maggior parte dei provider. I modelli agente OpenAI sono l'eccezione: runtime non impostato e `auto` si risolvono entrambi nell'harness Codex. La configurazione runtime PI esplicita rimane un percorso di compatibilità opt-in per i turni agente `openai/*`; quando abbinata a un profilo auth `openai-codex` selezionato, OpenClaw instrada PI internamente tramite il trasporto auth Codex legacy mantenendo il riferimento modello pubblico come `openai/*`. I pin di sessione OpenAI PI obsoleti senza configurazione esplicita vengono riparati di nuovo a Codex.

Se `openclaw doctor` avvisa che il Plugin `codex` è abilitato mentre `openai-codex/*` rimane nella configurazione, trattalo come stato di route legacy. Esegui `openclaw doctor --fix` per riscriverlo in `openai/*` con il runtime Codex.

## Contratto di compatibilità

Quando un runtime non è PI, dovrebbe documentare quali superfici OpenClaw supporta. Usa questa forma per la documentazione dei runtime:

| Domanda                                | Perché è importante                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Chi possiede il ciclo del modello?     | Determina dove avvengono i tentativi, la prosecuzione degli strumenti e le decisioni sulla risposta finale. |
| Chi possiede la cronologia thread canonica? | Determina se OpenClaw può modificare la cronologia o solo farne il mirror.                          |
| Gli strumenti dinamici OpenClaw funzionano? | Messaggistica, sessioni, Cron e strumenti di proprietà OpenClaw dipendono da questo.                 |
| Gli hook degli strumenti dinamici funzionano? | I Plugin si aspettano `before_tool_call`, `after_tool_call` e middleware attorno agli strumenti di proprietà OpenClaw. |
| Gli hook degli strumenti nativi funzionano? | Shell, patch e strumenti di proprietà del runtime richiedono supporto hook nativo per policy e osservazione. |
| Il ciclo di vita del motore di contesto viene eseguito? | I Plugin di memoria e contesto dipendono da assemble, ingest, after-turn e ciclo di vita della Compaction. |
| Quali dati di Compaction sono esposti? | Alcuni Plugin hanno bisogno solo di notifiche, mentre altri richiedono metadati mantenuti/scartati.       |
| Cosa è intenzionalmente non supportato? | Gli utenti non dovrebbero presumere equivalenza con PI dove il runtime nativo possiede più stato.        |

Il contratto di supporto del runtime Codex è documentato in
[harness Codex](/it/plugins/codex-harness#v1-support-contract).

## Etichette di stato

L'output di stato può mostrare sia le etichette `Execution` sia `Runtime`. Leggile come
diagnostica, non come nomi di provider.

- Un riferimento a un modello come `openai/gpt-5.5` indica il provider/modello selezionato.
- Un id di runtime come `codex` indica quale ciclo sta eseguendo il turno.
- Un'etichetta di canale come Telegram o Discord indica dove si sta svolgendo la conversazione.

Se una sessione mostra ancora PI dopo aver modificato la configurazione del runtime, avvia una nuova sessione
con `/new` oppure cancella quella corrente con `/reset`. Le sessioni esistenti mantengono il
runtime registrato, così una trascrizione non viene riprodotta tramite due sistemi di sessione nativi incompatibili.

## Correlati

- [harness Codex](/it/plugins/codex-harness)
- [OpenAI](/it/providers/openai)
- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Ciclo dell'agente](/it/concepts/agent-loop)
- [Modelli](/it/concepts/models)
- [Stato](/it/cli/status)
