---
read_when:
    - Stai scegliendo tra PI, Codex, ACP o un altro runtime nativo per agenti
    - Le etichette di fornitore/modello/ambiente di esecuzione nello stato o nella configurazione ti confondono
    - Stai documentando la parità di supporto per un'infrastruttura nativa
summary: Come OpenClaw separa i provider di modelli, i modelli, i canali e i runtime degli agenti
title: Runtime degli agenti
x-i18n:
    generated_at: "2026-05-02T08:20:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **agent runtime** è il componente che possiede un ciclo del modello preparato: riceve il prompt, guida l'output del modello, gestisce le chiamate native agli strumenti e restituisce il turno completato a OpenClaw.

I runtime si confondono facilmente con i provider perché entrambi compaiono vicino alla configurazione del modello. Sono livelli diversi:

| Livello       | Esempi                               | Cosa significa                                                           |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| Provider      | `openai`, `anthropic`, `openai-codex` | Come OpenClaw autentica, scopre i modelli e denomina i riferimenti ai modelli. |
| Modello       | `gpt-5.5`, `claude-opus-4-6`          | Il modello selezionato per il turno dell'agente.                         |
| Agent runtime | `pi`, `codex`, `claude-cli`           | Il ciclo o backend di basso livello che esegue il turno preparato.       |
| Canale        | Telegram, Discord, Slack, WhatsApp    | Dove i messaggi entrano ed escono da OpenClaw.                           |

Nel codice vedrai anche la parola **harness**. Un harness è l'implementazione che fornisce un agent runtime. Ad esempio, l'harness Codex incluso implementa il runtime `codex`. La configurazione pubblica usa `agentRuntime.id`; `openclaw doctor --fix` riscrive le chiavi runtime-policy precedenti in quella forma.

Esistono due famiglie di runtime:

- Gli **harness incorporati** vengono eseguiti dentro il ciclo dell'agente preparato di OpenClaw. Oggi questo include il runtime integrato `pi` più gli harness di plugin registrati, come `codex`.
- I **backend CLI** eseguono un processo CLI locale mantenendo canonico il riferimento al modello. Ad esempio, `anthropic/claude-opus-4-7` con `agentRuntime.id: "claude-cli"` significa "seleziona il modello Anthropic, esegui tramite Claude CLI." `claude-cli` non è un id di harness incorporato e non deve essere passato alla selezione di AgentHarness.

## Superfici Codex

La maggior parte della confusione nasce da diverse superfici che condividono il nome Codex:

| Superficie                                            | Nome/configurazione OpenClaw                 | Cosa fa                                                                                                   |
| ----------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Runtime nativo app-server Codex                       | `openai/*` più `agentRuntime.id: "codex"`     | Esegue il turno dell'agente incorporato tramite app-server Codex. Questa è la configurazione abituale con abbonamento ChatGPT/Codex. |
| Route del provider OAuth Codex                        | riferimenti modello `openai-codex/*`          | Usa l'OAuth dell'abbonamento ChatGPT/Codex tramite il normale runner PI di OpenClaw.                      |
| Adapter ACP Codex                                     | `runtime: "acp"`, `agentId: "codex"`          | Esegue Codex tramite il piano di controllo ACP/acpx esterno. Usalo solo quando ACP/acpx è richiesto esplicitamente. |
| Set di comandi nativo di controllo chat Codex          | `/codex ...`                                  | Collega, riprende, orienta, arresta e ispeziona i thread app-server Codex dalla chat.                     |
| Route OpenAI Platform API per modelli stile GPT/Codex | riferimenti modello `openai/*`                | Usa l'autenticazione con chiave API OpenAI, a meno che un override del runtime, come `agentRuntime.id: "codex"`, esegua il turno. |

Queste superfici sono intenzionalmente indipendenti. Abilitare il plugin `codex` rende disponibili le funzionalità native app-server; non riscrive `openai-codex/*` in `openai/*`, non modifica le sessioni esistenti e non rende ACP il default di Codex. Selezionare `openai-codex/*` significa "usa la route del provider OAuth Codex", a meno che non si forzi separatamente un runtime.

La configurazione comune con abbonamento ChatGPT/Codex usa OAuth Codex per l'autenticazione, ma mantiene il riferimento al modello come `openai/*` e seleziona il runtime `codex`:

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

Questo significa che OpenClaw seleziona un riferimento a modello OpenAI, poi chiede al runtime app-server Codex di eseguire il turno dell'agente incorporato. Non significa "usa la fatturazione API" e non significa che il canale, il catalogo dei provider di modelli o lo store delle sessioni OpenClaw diventi Codex.

Quando il plugin `codex` incluso è abilitato, il controllo Codex in linguaggio naturale dovrebbe usare la superficie di comandi nativa `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) invece di ACP. Usa ACP per Codex solo quando l'utente richiede esplicitamente ACP/acpx o sta testando il percorso dell'adapter ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harness esterni simili usano comunque ACP.

Questo è l'albero decisionale rivolto agli agenti:

1. Se l'utente chiede **bind/control/thread/resume/steer/stop di Codex**, usa la superficie di comandi nativa `/codex` quando il plugin `codex` incluso è abilitato.
2. Se l'utente chiede **Codex come runtime incorporato** o vuole la normale esperienza agente Codex supportata da abbonamento, usa `openai/<model>` con `agentRuntime.id: "codex"`.
3. Se l'utente chiede **autenticazione OAuth/abbonamento Codex sul normale runner OpenClaw**, usa `openai-codex/<model>` e lascia il runtime come PI.
4. Se l'utente dice esplicitamente **ACP**, **acpx** o **adapter ACP Codex**, usa ACP con `runtime: "acp"` e `agentId: "codex"`.
5. Se la richiesta riguarda **Claude Code, Gemini CLI, OpenCode, Cursor, Droid o un altro harness esterno**, usa ACP/acpx, non il runtime nativo del sotto-agente.

| Intendi...                                  | Usa...                                      |
| ------------------------------------------- | ------------------------------------------- |
| Controllo chat/thread app-server Codex      | `/codex ...` dal plugin `codex` incluso     |
| Runtime agente incorporato app-server Codex | `agentRuntime.id: "codex"`                  |
| OAuth OpenAI Codex sul runner PI            | riferimenti modello `openai-codex/*`        |
| Claude Code o altro harness esterno         | ACP/acpx                                    |

Per la divisione dei prefissi della famiglia OpenAI, vedi [OpenAI](/it/providers/openai) e [Provider di modelli](/it/concepts/model-providers). Per il contratto di supporto del runtime Codex, vedi [harness Codex](/it/plugins/codex-harness#v1-support-contract).

## Proprietà del runtime

Runtime diversi possiedono parti diverse del ciclo.

| Superficie                  | OpenClaw PI incorporato                 | app-server Codex                                                            |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| Proprietario ciclo modello  | OpenClaw tramite il runner PI incorporato | app-server Codex                                                          |
| Stato canonico del thread   | Trascrizione OpenClaw                   | Thread Codex, più mirror della trascrizione OpenClaw                        |
| Strumenti dinamici OpenClaw | Ciclo strumenti nativo OpenClaw         | Collegati tramite l'adapter Codex                                           |
| Strumenti nativi shell e file | Percorso PI/OpenClaw                  | Strumenti nativi Codex, collegati tramite hook nativi dove supportato       |
| Motore di contesto          | Assemblaggio contesto nativo OpenClaw   | OpenClaw proietta il contesto assemblato nel turno Codex                    |
| Compaction                  | OpenClaw o motore di contesto selezionato | Compaction nativa Codex, con notifiche OpenClaw e manutenzione del mirror |
| Consegna canale             | OpenClaw                                | OpenClaw                                                                    |

Questa divisione della proprietà è la regola di progettazione principale:

- Se OpenClaw possiede la superficie, OpenClaw può fornire il normale comportamento degli hook dei plugin.
- Se il runtime nativo possiede la superficie, OpenClaw ha bisogno di eventi del runtime o hook nativi.
- Se il runtime nativo possiede lo stato canonico del thread, OpenClaw dovrebbe creare un mirror e proiettare il contesto, non riscrivere internals non supportati.

## Selezione del runtime

OpenClaw sceglie un runtime incorporato dopo la risoluzione del provider e del modello:

1. Vince il runtime registrato di una sessione. Le modifiche di configurazione non trasferiscono a caldo una trascrizione esistente a un sistema di thread nativo diverso.
2. `OPENCLAW_AGENT_RUNTIME=<id>` forza quel runtime per sessioni nuove o reimpostate.
3. `agents.defaults.agentRuntime.id` o `agents.list[].agentRuntime.id` può impostare `auto`, `pi`, un id di harness incorporato registrato come `codex` o un alias di backend CLI supportato come `claude-cli`.
4. In modalità `auto`, i runtime dei plugin registrati possono rivendicare coppie provider/modello supportate.
5. Se nessun runtime rivendica un turno in modalità `auto` e `fallback: "pi"` è impostato (il default), OpenClaw usa PI come fallback di compatibilità. Imposta `fallback: "none"` per fare invece fallire la selezione in modalità `auto` senza corrispondenze.

I runtime dei plugin espliciti falliscono chiusi per default. Ad esempio, `agentRuntime.id: "codex"` significa Codex o un errore di selezione chiaro, a meno che non imposti `fallback: "pi"` nello stesso ambito di override. Un override del runtime non eredita un'impostazione di fallback più ampia, quindi un `agentRuntime.id: "codex"` a livello di agente non viene instradato silenziosamente di nuovo a PI solo perché i default usavano `fallback: "pi"`.

Gli alias dei backend CLI sono diversi dagli id di harness incorporati. La forma Claude CLI preferita è:

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

I riferimenti legacy come `claude-cli/claude-opus-4-7` rimangono supportati per compatibilità, ma la nuova configurazione dovrebbe mantenere canonici provider/modello e mettere il backend di esecuzione in `agentRuntime.id`.

La modalità `auto` è intenzionalmente conservativa. I runtime dei plugin possono rivendicare coppie provider/modello che comprendono, ma il plugin Codex non rivendica il provider `openai-codex` in modalità `auto`. Questo mantiene `openai-codex/*` come route esplicita OAuth Codex PI ed evita di spostare silenziosamente le configurazioni con autenticazione da abbonamento sull'harness app-server nativo.

Se `openclaw doctor` avvisa che il plugin `codex` è abilitato mentre `openai-codex/*` passa ancora tramite PI, considera questo come una diagnosi, non una migrazione. Mantieni invariata la configurazione quando PI Codex OAuth è ciò che vuoi. Passa a `openai/<model>` più `agentRuntime.id: "codex"` solo quando vuoi l'esecuzione nativa app-server Codex.

## Contratto di compatibilità

Quando un runtime non è PI, dovrebbe documentare quali superfici OpenClaw supporta. Usa questa forma per la documentazione dei runtime:

| Domanda                               | Perché è importante                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Chi possiede il ciclo del modello?               | Determina dove avvengono i nuovi tentativi, la continuazione degli strumenti e le decisioni sulla risposta finale.                   |
| Chi possiede la cronologia canonica del thread?     | Determina se OpenClaw può modificare la cronologia o solo rispecchiarla.                                   |
| Gli strumenti dinamici di OpenClaw funzionano?        | Messaggistica, sessioni, cron e strumenti di proprietà di OpenClaw dipendono da questo.                                 |
| Gli hook degli strumenti dinamici funzionano?            | I plugin si aspettano `before_tool_call`, `after_tool_call` e middleware attorno agli strumenti di proprietà di OpenClaw. |
| Gli hook degli strumenti nativi funzionano?             | Shell, patch e strumenti di proprietà del runtime necessitano del supporto degli hook nativi per criteri e osservazione.        |
| Il ciclo di vita del motore di contesto viene eseguito? | I plugin di memoria e contesto dipendono dal ciclo di vita di assemblaggio, ingestione, dopo-turno e compaction.      |
| Quali dati di compaction vengono esposti?       | Alcuni plugin necessitano solo di notifiche, mentre altri necessitano di metadati conservati/scartati.                    |
| Cosa non è supportato intenzionalmente?     | Gli utenti non devono presumere l’equivalenza PI dove il runtime nativo possiede più stato.                  |

Il contratto di supporto del runtime Codex è documentato in
[Codex harness](/it/plugins/codex-harness#v1-support-contract).

## Etichette di stato

L’output di stato può mostrare sia etichette `Execution` sia `Runtime`. Leggile come
diagnostica, non come nomi di provider.

- Un riferimento al modello come `openai/gpt-5.5` indica il provider/modello selezionato.
- Un id di runtime come `codex` indica quale ciclo sta eseguendo il turno.
- Un’etichetta di canale come Telegram o Discord indica dove sta avvenendo la conversazione.

Se una sessione mostra ancora PI dopo aver modificato la configurazione del runtime, avvia una nuova sessione
con `/new` oppure cancella quella corrente con `/reset`. Le sessioni esistenti mantengono il loro
runtime registrato, così una trascrizione non viene riprodotta attraverso due sistemi di sessione nativi incompatibili.

## Correlati

- [Codex harness](/it/plugins/codex-harness)
- [OpenAI](/it/providers/openai)
- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Ciclo dell’agente](/it/concepts/agent-loop)
- [Modelli](/it/concepts/models)
- [Stato](/it/cli/status)
