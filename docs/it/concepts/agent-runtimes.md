---
read_when:
    - Stai scegliendo tra PI, Codex, ACP o un altro runtime nativo per agenti
    - Le etichette di provider/modello/runtime nello stato o nella configurazione creano confusione
    - Stai documentando la parità di supporto per un harness nativo
summary: Come OpenClaw separa provider di modelli, modelli, canali e runtime degli agenti
title: Runtime degli agenti
x-i18n:
    generated_at: "2026-05-10T19:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime dell'agente** è il componente che possiede un loop di modello preparato:
riceve il prompt, guida l'output del modello, gestisce le chiamate agli strumenti nativi e restituisce
il turno completato a OpenClaw.

I runtime sono facili da confondere con i provider perché entrambi compaiono vicino alla
configurazione del modello. Sono livelli diversi:

| Livello       | Esempi                                | Cosa significa                                                                |
| ------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| Provider      | `openai`, `anthropic`, `openai-codex` | Come OpenClaw autentica, scopre i modelli e nomina i riferimenti ai modelli.  |
| Modello       | `gpt-5.5`, `claude-opus-4-6`          | Il modello selezionato per il turno dell'agente.                              |
| Runtime dell'agente | `pi`, `codex`, `claude-cli`     | Il loop o backend di basso livello che esegue il turno preparato.             |
| Canale        | Telegram, Discord, Slack, WhatsApp    | Dove i messaggi entrano in OpenClaw e ne escono.                              |

Nel codice vedrai anche la parola **harness**. Un harness è l'implementazione
che fornisce un runtime dell'agente. Per esempio, l'harness Codex in bundle
implementa il runtime `codex`. La configurazione pubblica usa `agentRuntime.id`
nelle voci di provider o modello; le chiavi di runtime dell'intero agente sono legacy e ignorate.
`openclaw doctor --fix` rimuove i vecchi pin di runtime dell'intero agente e riscrive
i riferimenti legacy ai modelli di runtime in riferimenti canonici provider/modello più policy
di runtime con ambito modello dove necessario.

Esistono due famiglie di runtime:

- Gli **harness incorporati** vengono eseguiti all'interno del loop agente preparato di OpenClaw. Oggi questo
  è il runtime `pi` integrato più gli harness di Plugin registrati, come
  `codex`.
- I **backend CLI** eseguono un processo CLI locale mantenendo canonico il riferimento al modello.
  Per esempio, `anthropic/claude-opus-4-7` con
  un `agentRuntime.id: "claude-cli"` con ambito modello significa "seleziona il modello Anthropic,
  esegui tramite Claude CLI". `claude-cli` non è un id di harness incorporato
  e non deve essere passato alla selezione AgentHarness.

## Superfici Codex

La maggior parte della confusione deriva da diverse superfici che condividono il nome Codex:

| Superficie                                        | Nome/configurazione OpenClaw          | Cosa fa                                                                                                                |
| ------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Runtime nativo app-server Codex                   | riferimenti modello `openai/*`        | Esegue i turni agente incorporati OpenAI tramite Codex app-server. Questa è la normale configurazione di abbonamento ChatGPT/Codex. |
| Profili di autenticazione OAuth Codex             | provider di autenticazione `openai-codex` | Archivia l'autenticazione dell'abbonamento ChatGPT/Codex usata dall'harness Codex app-server.                         |
| Adattatore ACP Codex                              | `runtime: "acp"`, `agentId: "codex"` | Esegue Codex tramite il piano di controllo esterno ACP/acpx. Usalo solo quando ACP/acpx è richiesto esplicitamente.    |
| Set di comandi nativi di controllo chat Codex     | `/codex ...`                         | Associa, riprende, guida, arresta e ispeziona i thread Codex app-server dalla chat.                                   |
| Route API OpenAI Platform per superfici non agente | `openai/*` più autenticazione con chiave API | Usata per API OpenAI dirette come immagini, embedding, voce e realtime.                                                |

Queste superfici sono intenzionalmente indipendenti. Abilitare il Plugin `codex` rende
disponibili le funzionalità native app-server; `openclaw doctor --fix` possiede la riparazione
delle route legacy `openai-codex/*` e la pulizia dei pin di sessione obsoleti. Selezionare
`openai/*` per un modello agente ora significa "eseguilo tramite Codex", a meno che
non venga usata una superficie API OpenAI non agente.

La configurazione comune di abbonamento ChatGPT/Codex usa OAuth Codex per l'autenticazione, ma mantiene
il riferimento al modello come `openai/*` e seleziona il runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Questo significa che OpenClaw seleziona un riferimento modello OpenAI, poi chiede al runtime Codex app-server
di eseguire il turno agente incorporato. Non significa "usa la fatturazione API" e
non significa che il canale, il catalogo dei provider di modelli o l'archivio sessioni OpenClaw
diventi Codex.

Quando il Plugin `codex` in bundle è abilitato, il controllo Codex in linguaggio naturale
deve usare la superficie di comandi nativa `/codex` (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) invece di ACP. Usa ACP per
Codex solo quando l'utente richiede esplicitamente ACP/acpx o sta testando il percorso
dell'adattatore ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harness esterni
simili usano ancora ACP.

Questo è l'albero decisionale rivolto all'agente:

1. Se l'utente chiede **associazione/controllo/thread/ripresa/guida/arresto Codex**, usa la
   superficie di comandi nativa `/codex` quando il Plugin `codex` in bundle è abilitato.
2. Se l'utente chiede **Codex come runtime incorporato** o vuole la normale
   esperienza agente Codex supportata da abbonamento, usa `openai/<model>`.
3. Se l'utente sceglie esplicitamente **PI per un modello OpenAI**, mantieni il riferimento al modello
   come `openai/<model>` e imposta la policy di runtime provider/modello su
   `agentRuntime.id: "pi"`. Un profilo di autenticazione `openai-codex` selezionato viene instradato
   internamente tramite il trasporto legacy di autenticazione Codex di PI.
4. Se la configurazione legacy contiene ancora **riferimenti modello `openai-codex/*`**, riparala in
   `openai/<model>` con `openclaw doctor --fix`; doctor mantiene la route di autenticazione Codex
   aggiungendo `agentRuntime.id: "codex"` con ambito provider/modello dove il
   vecchio riferimento modello lo implicava.
5. Se l'utente dice esplicitamente **ACP**, **acpx** o **adattatore ACP Codex**, usa
   ACP con `runtime: "acp"` e `agentId: "codex"`.
6. Se la richiesta riguarda **Claude Code, Gemini CLI, OpenCode, Cursor, Droid o
   un altro harness esterno**, usa ACP/acpx, non il runtime sub-agent nativo.

| Intendi...                              | Usa...                                       |
| --------------------------------------- | -------------------------------------------- |
| Controllo chat/thread Codex app-server  | `/codex ...` dal Plugin `codex` in bundle    |
| Runtime agente incorporato Codex app-server | riferimenti modello agente `openai/*`    |
| OAuth OpenAI Codex                      | profili di autenticazione `openai-codex`     |
| Claude Code o altro harness esterno     | ACP/acpx                                     |

Per la divisione dei prefissi della famiglia OpenAI, vedi [OpenAI](/it/providers/openai) e
[Provider di modelli](/it/concepts/model-providers). Per il contratto di supporto del runtime Codex,
vedi [Runtime harness Codex](/it/plugins/codex-harness-runtime#v1-support-contract).

## Proprietà del runtime

Runtime diversi possiedono parti diverse del loop.

| Superficie                  | PI incorporato OpenClaw                | Codex app-server                                                            |
| --------------------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| Proprietario del loop del modello | OpenClaw tramite il runner incorporato PI | Codex app-server                                                        |
| Stato canonico del thread   | Trascrizione OpenClaw                  | Thread Codex, più mirror della trascrizione OpenClaw                        |
| Strumenti dinamici OpenClaw | Loop strumenti nativo OpenClaw         | Collegati tramite l'adattatore Codex                                        |
| Strumenti nativi shell e file | Percorso PI/OpenClaw                 | Strumenti nativi Codex, collegati tramite hook nativi dove supportato       |
| Motore di contesto          | Assemblaggio contesto nativo OpenClaw  | OpenClaw proietta il contesto assemblato nel turno Codex                    |
| Compaction                  | OpenClaw o motore di contesto selezionato | Compaction nativa Codex, con notifiche OpenClaw e manutenzione del mirror |
| Recapito del canale         | OpenClaw                               | OpenClaw                                                                    |

Questa divisione della proprietà è la regola di progettazione principale:

- Se OpenClaw possiede la superficie, OpenClaw può fornire il normale comportamento degli hook del Plugin.
- Se il runtime nativo possiede la superficie, OpenClaw ha bisogno di eventi di runtime o hook nativi.
- Se il runtime nativo possiede lo stato canonico del thread, OpenClaw dovrebbe fare mirror e proiettare il contesto, non riscrivere elementi interni non supportati.

## Selezione del runtime

OpenClaw sceglie un runtime incorporato dopo la risoluzione del provider e del modello:

1. Vince la policy di runtime con ambito modello. Può trovarsi in una voce modello
   provider configurata oppure in `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`.
2. La policy di runtime con ambito provider viene dopo, in
   `models.providers.<provider>.agentRuntime`.
3. In modalità `auto`, i runtime di Plugin registrati possono rivendicare coppie provider/modello
   supportate.
4. Se nessun runtime rivendica un turno in modalità `auto`, OpenClaw usa PI come
   runtime di compatibilità. Usa un id runtime esplicito quando l'esecuzione deve essere
   rigorosa.

I pin di runtime dell'intera sessione e dell'intero agente vengono ignorati. Questo include
`OPENCLAW_AGENT_RUNTIME`, lo stato di sessione `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime` e `agents.list[].agentRuntime`. Esegui
`openclaw doctor --fix` per rimuovere la configurazione obsoleta del runtime dell'intero agente e convertire
i riferimenti legacy ai modelli di runtime dove OpenClaw può preservare l'intento.

I runtime di Plugin provider/modello espliciti falliscono in modo chiuso. Per esempio,
`agentRuntime.id: "codex"` su un provider o modello significa Codex o un chiaro
errore di selezione/runtime; non viene mai instradato silenziosamente di nuovo a PI.

Gli alias dei backend CLI sono diversi dagli id degli harness incorporati. La forma preferita
per Claude CLI è:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

I riferimenti legacy come `claude-cli/claude-opus-4-7` restano supportati per
compatibilità, ma la nuova configurazione dovrebbe mantenere canonico il provider/modello e inserire
il backend di esecuzione nella policy di runtime provider/modello.

La modalità `auto` è intenzionalmente conservativa per la maggior parte dei provider. I modelli agente OpenAI
sono l'eccezione: runtime non impostato e `auto` si risolvono entrambi nell'harness Codex.
La configurazione esplicita del runtime PI resta una route di compatibilità opt-in per
i turni agente `openai/*`; quando abbinata a un profilo di autenticazione `openai-codex` selezionato,
OpenClaw instrada PI internamente tramite il trasporto legacy di autenticazione Codex mantenendo
il riferimento modello pubblico come `openai/*`. I pin di sessione OpenAI PI obsoleti vengono
ignorati dalla selezione del runtime e possono essere puliti con `openclaw doctor --fix`.

Se `openclaw doctor` avvisa che il Plugin `codex` è abilitato mentre
`openai-codex/*` rimane nella configurazione, trattalo come stato di route legacy. Esegui
`openclaw doctor --fix` per riscriverlo in `openai/*` con il runtime Codex.

## Contratto di compatibilità

Quando un runtime non è PI, dovrebbe documentare quali superfici OpenClaw supporta.
Usa questa forma per la documentazione del runtime:

| Domanda                               | Perché è importante                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Chi gestisce il loop del modello?               | Determina dove avvengono i tentativi, la continuazione degli strumenti e le decisioni sulla risposta finale.                   |
| Chi gestisce la cronologia canonica del thread?     | Determina se OpenClaw può modificare la cronologia o solo rispecchiarla.                                   |
| Gli strumenti dinamici di OpenClaw funzionano?        | Messaggistica, sessioni, cron e strumenti gestiti da OpenClaw dipendono da questo.                                 |
| Gli hook degli strumenti dinamici funzionano?            | I Plugin si aspettano `before_tool_call`, `after_tool_call` e middleware intorno agli strumenti gestiti da OpenClaw. |
| Gli hook degli strumenti nativi funzionano?             | Shell, patch e strumenti gestiti dal runtime richiedono supporto nativo degli hook per policy e osservazione.        |
| Il ciclo di vita del motore di contesto viene eseguito? | I Plugin di memoria e contesto dipendono dal ciclo di vita di assemblaggio, ingestione, post-turno e Compaction.      |
| Quali dati di Compaction vengono esposti?       | Alcuni Plugin richiedono solo notifiche, mentre altri richiedono metadati mantenuti/scartati.                    |
| Cosa è intenzionalmente non supportato?     | Gli utenti non dovrebbero presumere equivalenza PI quando il runtime nativo gestisce più stato.                  |

Il contratto di supporto del runtime Codex è documentato in
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime#v1-support-contract).

## Etichette di stato

L'output di stato può mostrare sia le etichette `Execution` sia `Runtime`. Leggile come
diagnostica, non come nomi di provider.

- Un riferimento modello come `openai/gpt-5.5` indica il provider/modello selezionato.
- Un ID runtime come `codex` indica quale loop sta eseguendo il turno.
- Un'etichetta di canale come Telegram o Discord indica dove si svolge la conversazione.

Se un'esecuzione mostra ancora un runtime inatteso, ispeziona prima la policy di runtime
del provider/modello selezionato. I pin runtime delle sessioni legacy non decidono più il routing.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [OpenAI](/it/providers/openai)
- [Plugin di harness agente](/it/plugins/sdk-agent-harness)
- [Loop agente](/it/concepts/agent-loop)
- [Modelli](/it/concepts/models)
- [Stato](/it/cli/status)
