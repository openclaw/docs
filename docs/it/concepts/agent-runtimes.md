---
read_when:
    - Stai scegliendo tra OpenClaw, Codex, ACP o un altro runtime agente nativo
    - Sei confuso dalle etichette provider/modello/runtime nello stato o nella configurazione
    - Stai documentando la parità di supporto per un harness nativo
summary: Come OpenClaw separa provider di modelli, modelli, canali e runtime degli agenti
title: Runtime degli agenti
x-i18n:
    generated_at: "2026-06-27T17:23:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime dell'agente** è il componente che possiede un singolo ciclo del modello preparato: riceve il prompt, guida l'output del modello, gestisce le chiamate agli strumenti nativi e restituisce a OpenClaw il turno completato.

I runtime sono facili da confondere con i provider perché entrambi compaiono vicino alla configurazione del modello. Sono livelli diversi:

| Livello        | Esempi                                      | Cosa significa                                                                 |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------------------ |
| Provider       | `openai`, `anthropic`, `github-copilot`     | Come OpenClaw autentica, scopre i modelli e denomina i riferimenti ai modelli. |
| Modello        | `gpt-5.5`, `claude-opus-4-6`                | Il modello selezionato per il turno dell'agente.                               |
| Runtime agente | `openclaw`, `codex`, `copilot`, `claude-cli` | Il ciclo o backend di basso livello che esegue il turno preparato.             |
| Canale         | Telegram, Discord, Slack, WhatsApp          | Dove i messaggi entrano ed escono da OpenClaw.                                 |

Nel codice vedrai anche la parola **harness**. Un harness è l'implementazione che fornisce un runtime dell'agente. Per esempio, l'harness Codex incluso implementa il runtime `codex`. La configurazione pubblica usa `agentRuntime.id` nelle voci provider o modello; le chiavi di runtime per l'intero agente sono legacy e vengono ignorate. `openclaw doctor --fix` rimuove i vecchi pin di runtime per l'intero agente e riscrive i riferimenti legacy ai modelli runtime in riferimenti canonici provider/modello più, dove necessario, una policy di runtime con ambito modello.

Esistono due famiglie di runtime:

- Gli **harness incorporati** vengono eseguiti all'interno del ciclo agente preparato di OpenClaw. Oggi questo include il runtime integrato `openclaw` più gli harness Plugin registrati come `codex` e `copilot`.
- I **backend CLI** eseguono un processo CLI locale mantenendo canonico il riferimento al modello. Per esempio, `anthropic/claude-opus-4-8` con un `agentRuntime.id: "claude-cli"` con ambito modello significa "seleziona il modello Anthropic, esegui tramite Claude CLI". `claude-cli` non è un id di harness incorporato e non deve essere passato alla selezione AgentHarness.

L'harness `copilot` è un harness Plugin esterno separato e opzionale per la CLI GitHub Copilot; vedi [runtime agente GitHub Copilot](/it/plugins/copilot) per la decisione rivolta all'utente tra PI, Codex e runtime agente GitHub Copilot.

## Superfici Codex

La maggior parte della confusione deriva da diverse superfici che condividono il nome Codex:

| Superficie                                      | Nome/configurazione OpenClaw           | Cosa fa                                                                                                           |
| ----------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Runtime app-server Codex nativo                 | riferimenti modello `openai/*`         | Esegue i turni agente incorporati OpenAI tramite Codex app-server. Questa è la configurazione usuale con abbonamento ChatGPT/Codex. |
| Profili di autenticazione OAuth Codex           | profili OAuth `openai`                 | Memorizza l'autenticazione con abbonamento ChatGPT/Codex consumata dall'harness Codex app-server.                 |
| Adattatore ACP Codex                            | `runtime: "acp"`, `agentId: "codex"`  | Esegue Codex tramite il piano di controllo esterno ACP/acpx. Usalo solo quando ACP/acpx è richiesto esplicitamente. |
| Set di comandi nativi di controllo chat Codex   | `/codex ...`                           | Collega, riprende, orienta, arresta e ispeziona thread Codex app-server dalla chat.                               |
| Route API OpenAI Platform per superfici non agente | `openai/*` più autenticazione con chiave API | Usata per API OpenAI dirette come immagini, embedding, voce e realtime.                                           |

Queste superfici sono intenzionalmente indipendenti. Abilitare il Plugin `codex` rende disponibili le funzionalità native app-server; `openclaw doctor --fix` possiede la riparazione delle route Codex legacy e la pulizia dei pin di sessione obsoleti. Selezionare `openai/*` come modello agente ora significa "esegui questo tramite Codex", a meno che non si stia usando una superficie API OpenAI non agente.

La configurazione comune con abbonamento ChatGPT/Codex usa OAuth Codex per l'autenticazione, ma mantiene il riferimento del modello come `openai/*` e seleziona il runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Questo significa che OpenClaw seleziona un riferimento modello OpenAI, poi chiede al runtime Codex app-server di eseguire il turno agente incorporato. Non significa "usa la fatturazione API" e non significa che il canale, il catalogo provider dei modelli o l'archivio sessioni OpenClaw diventino Codex.

Quando il Plugin `codex` incluso è abilitato, il controllo Codex in linguaggio naturale dovrebbe usare la superficie di comando nativa `/codex` (`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`, `/codex stop`) invece di ACP. Usa ACP per Codex solo quando l'utente richiede esplicitamente ACP/acpx o sta testando il percorso dell'adattatore ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harness esterni simili usano ancora ACP.

Questo è l'albero decisionale rivolto all'agente:

1. Se l'utente chiede **bind/control/thread/resume/steer/stop Codex**, usa la superficie di comando nativa `/codex` quando il Plugin `codex` incluso è abilitato.
2. Se l'utente chiede **Codex come runtime incorporato** o vuole la normale esperienza agente Codex supportata da abbonamento, usa `openai/<model>`.
3. Se l'utente sceglie esplicitamente **OpenClaw per un modello OpenAI**, mantieni il riferimento del modello come `openai/<model>` e imposta la policy runtime provider/modello su `agentRuntime.id: "openclaw"`. Un profilo OAuth `openai` selezionato viene instradato internamente tramite il trasporto di autenticazione Codex di OpenClaw.
4. Se la configurazione legacy contiene ancora **riferimenti modello Codex legacy**, riparala in `openai/<model>` con `openclaw doctor --fix`; doctor mantiene la route di autenticazione Codex aggiungendo, dove il vecchio riferimento modello lo implicava, `agentRuntime.id: "codex"` con ambito provider/modello.
   I **riferimenti modello `codex-cli/*` legacy** vengono riparati nella stessa route Codex app-server `openai/<model>`; OpenClaw non mantiene più un backend CLI Codex incluso.
5. Se l'utente dice esplicitamente **ACP**, **acpx** o **adattatore ACP Codex**, usa ACP con `runtime: "acp"` e `agentId: "codex"`.
6. Se la richiesta riguarda **Claude Code, Gemini CLI, OpenCode, Cursor, Droid o un altro harness esterno**, usa ACP/acpx, non il runtime sub-agente nativo.

| Intendi...                                  | Usa...                                      |
| ------------------------------------------ | ------------------------------------------ |
| Controllo chat/thread Codex app-server     | `/codex ...` dal Plugin `codex` incluso    |
| Runtime agente incorporato Codex app-server | riferimenti modello agente `openai/*`      |
| OAuth OpenAI Codex                         | profili OAuth `openai`                     |
| Claude Code o altro harness esterno        | ACP/acpx                                   |

Per la divisione dei prefissi della famiglia OpenAI, vedi [OpenAI](/it/providers/openai) e [provider di modelli](/it/concepts/model-providers). Per il contratto di supporto del runtime Codex, vedi [runtime harness Codex](/it/plugins/codex-harness-runtime#v1-support-contract).

## Proprietà del runtime

Runtime diversi possiedono quantità diverse del ciclo.

| Superficie                  | OpenClaw incorporato                         | Codex app-server                                                           |
| --------------------------- | -------------------------------------------- | -------------------------------------------------------------------------- |
| Proprietario del ciclo modello | OpenClaw tramite il runner incorporato OpenClaw | Codex app-server                                                           |
| Stato canonico del thread   | Trascrizione OpenClaw                        | Thread Codex, più mirror della trascrizione OpenClaw                       |
| Strumenti dinamici OpenClaw | Ciclo strumenti nativo OpenClaw              | Collegati tramite l'adattatore Codex                                       |
| Strumenti nativi shell e file | Percorso OpenClaw                          | Strumenti nativi Codex, collegati tramite hook nativi dove supportato      |
| Motore di contesto          | Assemblaggio contesto nativo OpenClaw        | OpenClaw proietta il contesto assemblato nel turno Codex                   |
| Compaction                  | OpenClaw o motore di contesto selezionato    | Compaction nativa Codex, con notifiche OpenClaw e manutenzione del mirror  |
| Consegna canale             | OpenClaw                                     | OpenClaw                                                                   |

Questa divisione della proprietà è la principale regola di progettazione:

- Se OpenClaw possiede la superficie, OpenClaw può fornire il normale comportamento degli hook Plugin.
- Se il runtime nativo possiede la superficie, OpenClaw ha bisogno di eventi runtime o hook nativi.
- Se il runtime nativo possiede lo stato canonico del thread, OpenClaw dovrebbe rispecchiare e proiettare il contesto, non riscrivere interni non supportati.

## Selezione del runtime

OpenClaw sceglie un runtime incorporato dopo la risoluzione di provider e modello:

1. La policy runtime con ambito modello ha la precedenza. Può trovarsi in una voce modello provider configurata o in `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime`. Un wildcard provider come `agents.defaults.models["vllm/*"].agentRuntime` si applica dopo la policy esatta del modello, quindi i modelli provider scoperti dinamicamente possono condividere un runtime senza sovrascrivere le eccezioni esatte per modello.
2. La policy runtime con ambito provider viene dopo in `models.providers.<provider>.agentRuntime`.
3. In modalità `auto`, i runtime Plugin registrati possono rivendicare coppie provider/modello supportate.
4. Se nessun runtime rivendica un turno in modalità `auto`, OpenClaw usa `openclaw` come runtime di compatibilità. Usa un id runtime esplicito quando l'esecuzione deve essere rigorosa.

I pin di runtime per l'intera sessione e per l'intero agente vengono ignorati. Questo include `OPENCLAW_AGENT_RUNTIME`, lo stato sessione `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime` e `agents.list[].agentRuntime`. Esegui `openclaw doctor --fix` per rimuovere la configurazione runtime obsoleta per l'intero agente e convertire i riferimenti modello runtime legacy dove OpenClaw può preservarne l'intento.

I runtime Plugin espliciti provider/modello falliscono in modo chiuso. Per esempio, `agentRuntime.id: "codex"` su un provider o modello significa Codex o un chiaro errore di selezione/runtime; non viene mai reindirizzato silenziosamente a OpenClaw.

Gli alias dei backend CLI sono diversi dagli id degli harness incorporati. La forma Claude CLI preferita è:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

I riferimenti legacy come `claude-cli/claude-opus-4-7` rimangono supportati per compatibilità, ma la nuova configurazione dovrebbe mantenere canonico provider/modello e mettere il backend di esecuzione nella policy runtime provider/modello.

I riferimenti legacy `codex-cli/*` sono diversi: doctor li migra a `openai/*` affinché vengano eseguiti tramite l'harness Codex app-server invece di preservare un backend CLI Codex.

La modalità `auto` è intenzionalmente conservativa per la maggior parte dei provider. I modelli agente OpenAI sono l'eccezione: runtime non impostato e `auto` si risolvono entrambi nell'harness Codex. La configurazione runtime OpenClaw esplicita rimane una route di compatibilità opzionale per i turni agente `openai/*`; quando è abbinata a un profilo OAuth `openai` selezionato, OpenClaw instrada quel percorso internamente tramite il trasporto di autenticazione Codex mantenendo il riferimento pubblico del modello come `openai/*`. I pin di sessione runtime OpenAI obsoleti vengono ignorati dalla selezione del runtime e possono essere puliti con `openclaw doctor --fix`.

Se `openclaw doctor` avvisa che il plugin `codex` è abilitato mentre
rimangono in configurazione riferimenti a modelli Codex legacy, trattalo come stato di routing legacy. Esegui
`openclaw doctor --fix` per riscriverlo in `openai/*` con il runtime Codex.

## Runtime agente GitHub Copilot

Il plugin esterno `@openclaw/copilot` registra un runtime `copilot` opzionale
basato sulla CLI GitHub Copilot (`@github/copilot-sdk`). Dichiara il provider
di sottoscrizione canonico `github-copilot` e non viene **mai** selezionato da
`auto`. Attivalo per modello o per provider tramite `agentRuntime.id`:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

L'harness dichiara il proprio provider, runtime, chiave di sessione CLI e
prefisso del profilo di autenticazione in `extensions/copilot/doctor-contract-api.ts`, che
`openclaw doctor` carica automaticamente. Per configurazione, autenticazione, mirroring delle trascrizioni,
compaction, contratto dichiarativo di doctor e la decisione più ampia tra SDK PI, Codex e
Copilot, consulta [Runtime agente GitHub Copilot](/it/plugins/copilot).

## Contratto di compatibilità

Quando un runtime non è OpenClaw, dovrebbe documentare quali superfici OpenClaw supporta.
Usa questa struttura per la documentazione del runtime:

| Domanda                               | Perché è importante                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Chi possiede il loop del modello?               | Determina dove avvengono i tentativi, la continuazione degli strumenti e le decisioni sulla risposta finale.                   |
| Chi possiede la cronologia canonica del thread?     | Determina se OpenClaw può modificare la cronologia o solo farne il mirror.                                   |
| Gli strumenti dinamici di OpenClaw funzionano?        | Messaggistica, sessioni, cron e strumenti posseduti da OpenClaw dipendono da questo.                                 |
| Gli hook degli strumenti dinamici funzionano?            | I plugin si aspettano `before_tool_call`, `after_tool_call` e middleware attorno agli strumenti posseduti da OpenClaw. |
| Gli hook degli strumenti nativi funzionano?             | Shell, patch e strumenti posseduti dal runtime richiedono supporto degli hook nativi per policy e osservazione.        |
| Il ciclo di vita del motore di contesto viene eseguito? | I plugin di memoria e contesto dipendono da assemble, ingest, after-turn e ciclo di vita di compaction.      |
| Quali dati di compaction sono esposti?       | Alcuni plugin hanno bisogno solo di notifiche, mentre altri necessitano di metadati conservati/scartati.                    |
| Cosa non è intenzionalmente supportato?     | Gli utenti non dovrebbero presumere equivalenza con OpenClaw quando il runtime nativo possiede più stato.            |

Il contratto di supporto del runtime Codex è documentato in
[Runtime harness Codex](/it/plugins/codex-harness-runtime#v1-support-contract).

## Etichette di stato

L'output di stato può mostrare sia le etichette `Execution` sia `Runtime`. Leggile come
diagnostica, non come nomi di provider.

- Un riferimento di modello come `openai/gpt-5.5` indica il provider/modello selezionato.
- Un id runtime come `codex` indica quale loop sta eseguendo il turno.
- Un'etichetta di canale come Telegram o Discord indica dove sta avvenendo la conversazione.

Se un'esecuzione mostra ancora un runtime inatteso, ispeziona prima la policy del runtime
del provider/modello selezionato. I pin runtime delle sessioni legacy non decidono più il routing.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Runtime harness Codex](/it/plugins/codex-harness-runtime)
- [Runtime agente GitHub Copilot](/it/plugins/copilot)
- [OpenAI](/it/providers/openai)
- [Plugin harness agente](/it/plugins/sdk-agent-harness)
- [Loop agente](/it/concepts/agent-loop)
- [Modelli](/it/concepts/models)
- [Stato](/it/cli/status)
