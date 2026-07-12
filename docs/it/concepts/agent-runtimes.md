---
read_when:
    - Stai scegliendo tra OpenClaw, Codex, ACP o un altro runtime nativo per agenti
    - Sei confuso dalle etichette di provider/modello/runtime nello stato o nella configurazione
    - Stai documentando la parità di supporto per un harness nativo
summary: Come OpenClaw separa provider di modelli, modelli, canali e runtime degli agenti
title: Runtime degli agenti
x-i18n:
    generated_at: "2026-07-12T06:55:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Un **runtime dell'agente** gestisce un singolo ciclo del modello già predisposto: riceve il prompt,
guida l'output del modello, gestisce le chiamate native agli strumenti e restituisce a
OpenClaw il turno completato.

È facile confondere i runtime con i provider, perché entrambi compaiono vicino alla
configurazione del modello. Si tratta di livelli diversi:

| Livello            | Esempi                                       | Significato                                                                                  |
| ------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Provider           | `anthropic`, `github-copilot`, `openai`      | Come OpenClaw esegue l'autenticazione, rileva i modelli e denomina i riferimenti ai modelli. |
| Modello            | `claude-opus-4-6`, `gpt-5.6-sol`             | Il modello selezionato per il turno dell'agente.                                              |
| Runtime dell'agente | `claude-cli`, `codex`, `copilot`, `openclaw` | Il ciclo di basso livello o il backend che esegue il turno predisposto.                       |
| Canale             | Discord, Slack, Telegram, WhatsApp           | Dove i messaggi entrano ed escono da OpenClaw.                                                |

Un **harness** è l'implementazione che fornisce un runtime dell'agente (termine del
codice). Ad esempio, l'harness Codex incluso implementa il runtime `codex`.
La configurazione pubblica usa `agentRuntime.id` nelle voci dei provider o dei modelli; le chiavi
di runtime per l'intero agente sono obsolete e vengono ignorate. `openclaw doctor --fix` rimuove i vecchi
vincoli di runtime per l'intero agente e riscrive i riferimenti obsoleti ai modelli di runtime come riferimenti
canonici provider/modello, aggiungendo dove necessario criteri di runtime specifici per il modello.

Due famiglie di runtime:

- Gli **harness incorporati** vengono eseguiti all'interno del ciclo dell'agente predisposto da OpenClaw: il
  runtime `openclaw` integrato e gli harness dei plugin registrati, come
  `codex` e `copilot`.
- I **backend CLI** eseguono un processo CLI locale mantenendo canonico il riferimento al
  modello. Ad esempio, `anthropic/claude-opus-4-8` con
  `agentRuntime.id: "claude-cli"` specifico per il modello significa «seleziona il modello Anthropic ed esegui
  tramite Claude CLI». `claude-cli` non è l'ID di un harness incorporato e non deve
  essere passato alla selezione di AgentHarness.

L'harness `copilot` è un harness di plugin esterno separato e facoltativo per la
CLI di GitHub Copilot; consulta [Runtime dell'agente GitHub Copilot](/it/plugins/copilot) per
la scelta rivolta all'utente tra PI, Codex e il runtime dell'agente GitHub Copilot.

## Superfici Codex

Diverse superfici condividono il nome Codex:

| Superficie                                           | Nome/configurazione OpenClaw            | Funzione                                                                                                                       |
| ---------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Runtime nativo Codex app-server                      | Riferimenti ai modelli `openai/*`       | Esegue i turni dell'agente incorporato OpenAI tramite Codex app-server. Questa è la normale configurazione con abbonamento ChatGPT/Codex. |
| Profili di autenticazione OAuth Codex                | Profili OAuth `openai`                  | Memorizza l'autenticazione dell'abbonamento ChatGPT/Codex utilizzata dall'harness Codex app-server.                            |
| Adattatore ACP Codex                                 | `runtime: "acp"`, `agentId: "codex"`    | Esegue Codex tramite il piano di controllo esterno ACP/acpx. Usalo solo quando ACP/acpx viene richiesto esplicitamente.         |
| Insieme nativo di comandi di controllo chat Codex    | `/codex ...`                            | Collega, riprende, guida, arresta e ispeziona i thread Codex app-server dalla chat.                                             |
| Percorso API OpenAI Platform per superfici non agente | `openai/*` più autenticazione con chiave API | API OpenAI dirette, come immagini, incorporamenti, sintesi vocale e comunicazione in tempo reale.                              |

Queste superfici sono intenzionalmente indipendenti. L'abilitazione del plugin `codex`
rende disponibili le funzionalità native dell'app-server; `openclaw doctor --fix` gestisce
la riparazione dei percorsi Codex obsoleti e la pulizia dei vincoli di sessione non più validi. Selezionare `openai/*`
per un modello agente ora significa «esegui tramite Codex», a meno che non venga usata
una superficie API OpenAI non agente.

La configurazione comune con abbonamento ChatGPT/Codex usa Codex OAuth per l'autenticazione, ma
mantiene il riferimento al modello come `openai/*` e seleziona il runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Ciò significa che OpenClaw seleziona un riferimento a un modello OpenAI, quindi chiede al runtime
Codex app-server di eseguire il turno dell'agente incorporato. Non significa «usa la
fatturazione API» e non significa che il canale, il catalogo dei provider di modelli o
l'archivio delle sessioni di OpenClaw diventino Codex.

Quando il plugin `codex` incluso è abilitato, usa la superficie nativa dei comandi `/codex`
(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) per il controllo di Codex in linguaggio naturale anziché ACP. Usa ACP per
Codex solo quando l'utente richiede esplicitamente ACP/acpx o sta verificando il percorso
dell'adattatore ACP. Claude Code, Gemini CLI, OpenCode, Cursor e harness esterni
simili continuano a usare ACP.

Albero decisionale:

1. **Collegamento/controllo/thread/ripresa/guida/arresto di Codex** -> superficie nativa dei comandi `/codex` quando il plugin `codex` incluso è abilitato.
2. **Codex come runtime incorporato** o la normale esperienza dell'agente Codex basata su abbonamento -> `openai/<model>`.
3. **OpenClaw scelto esplicitamente per un modello OpenAI** -> mantieni il riferimento al modello come `openai/<model>` e imposta il criterio di runtime del provider/modello su `agentRuntime.id: "openclaw"`. Un profilo OAuth `openai` selezionato viene instradato internamente tramite il trasporto di autenticazione Codex di OpenClaw.
4. **Riferimenti obsoleti ai modelli Codex nella configurazione** -> correggili con `openclaw doctor --fix` trasformandoli in `openai/<model>`; doctor mantiene il percorso di autenticazione Codex aggiungendo `agentRuntime.id: "codex"` specifico per provider/modello quando il vecchio riferimento al modello lo implicava. I riferimenti obsoleti ai modelli **`codex-cli/*`** vengono corretti nello stesso percorso Codex app-server `openai/<model>`; OpenClaw non mantiene più un backend CLI Codex incluso.
5. **ACP, acpx o adattatore ACP Codex richiesto esplicitamente** -> `runtime: "acp"` e `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid o un altro harness esterno** -> ACP/acpx, non il runtime nativo dei sotto-agenti.

| Intendi...                                      | Usa...                                                  |
| ----------------------------------------------- | ------------------------------------------------------- |
| Controllo di chat/thread Codex app-server       | `/codex ...` dal plugin `codex` incluso                 |
| Runtime dell'agente incorporato Codex app-server | Riferimenti ai modelli agente `openai/*`                |
| OAuth OpenAI Codex                              | Profili OAuth `openai`                                  |
| Claude Code o un altro harness esterno          | ACP/acpx                                                |

Per la suddivisione dei prefissi della famiglia OpenAI, consulta [OpenAI](/it/providers/openai) e
[Provider di modelli](/it/concepts/model-providers). Per il contratto di supporto del runtime Codex,
consulta [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime#v1-support-contract).

## Responsabilità del runtime

Runtime diversi gestiscono porzioni diverse del ciclo:

| Superficie                      | OpenClaw incorporato                                  | Codex app-server                                                                  |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------- |
| Responsabile del ciclo del modello | OpenClaw, tramite l'esecutore incorporato di OpenClaw | Codex app-server                                                                  |
| Stato canonico del thread       | Trascrizione OpenClaw                                 | Thread Codex, più copia speculare della trascrizione OpenClaw                     |
| Strumenti dinamici OpenClaw     | Ciclo nativo degli strumenti OpenClaw                 | Collegati tramite l'adattatore Codex                                               |
| Strumenti nativi per shell e file | Percorso OpenClaw                                     | Strumenti nativi Codex, collegati tramite hook nativi dove supportato              |
| Motore di contesto              | Composizione nativa del contesto OpenClaw             | OpenClaw proietta il contesto composto nel turno Codex                             |
| Compaction                      | OpenClaw o motore di contesto selezionato             | Compaction nativa Codex, con notifiche OpenClaw e manutenzione della copia speculare |
| Recapito sul canale             | OpenClaw                                              | OpenClaw                                                                          |

Regola di progettazione: se OpenClaw gestisce la superficie, può fornire il normale comportamento
degli hook dei plugin. Se il runtime nativo gestisce la superficie, OpenClaw necessita di eventi
del runtime o hook nativi. Se il runtime nativo gestisce lo stato canonico del thread,
OpenClaw replica e proietta il contesto anziché riscrivere componenti interni
non supportati.

## Selezione del runtime

OpenClaw risolve un runtime incorporato dopo la risoluzione del provider e del modello, in
quest'ordine:

1. Il **criterio di runtime specifico per il modello** ha la precedenza. Si trova in una voce di modello
   di un provider configurato oppure in `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime`. Un carattere jolly del provider
   come `agents.defaults.models["vllm/*"].agentRuntime` si applica
   dopo il criterio esatto del modello, così i modelli del provider rilevati dinamicamente possono
   condividere un runtime senza sostituire le eccezioni esatte per singolo modello.
2. **Criterio di runtime specifico per il provider**: `models.providers.<provider>.agentRuntime`.
3. **Modalità `auto`**: i runtime dei plugin registrati possono rivendicare le coppie provider/modello supportate.
4. Se nessuno rivendica il turno in modalità `auto`, OpenClaw usa
   `openclaw` come runtime di compatibilità. Usa un ID di runtime esplicito quando
   l'esecuzione deve essere rigorosa.

I vincoli di runtime per l'intera sessione e l'intero agente vengono ignorati: `OPENCLAW_AGENT_RUNTIME`,
lo stato di sessione `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime`
e `agents.list[].agentRuntime`. Esegui `openclaw doctor --fix` per rimuovere la configurazione
di runtime obsoleta per l'intero agente e convertire i riferimenti obsoleti ai modelli di runtime quando
è possibile preservare l'intento.

I runtime espliciti dei plugin per provider/modello non prevedono fallback: `agentRuntime.id: "codex"`
su un provider o un modello significa Codex oppure un chiaro errore di selezione/runtime; non viene
mai instradato silenziosamente di nuovo a OpenClaw. Solo `auto` può instradare a OpenClaw
un turno senza corrispondenza.

Gli alias dei backend CLI sono diversi dagli ID degli harness incorporati. Forma preferita per Claude CLI:

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

I riferimenti obsoleti come `claude-cli/claude-opus-4-7` restano supportati per
compatibilità, ma le nuove configurazioni devono mantenere canonica la coppia provider/modello e
inserire il backend di esecuzione nel criterio di runtime del provider/modello.

I riferimenti obsoleti `codex-cli/*` sono diversi: doctor li migra a `openai/*` affinché
vengano eseguiti tramite l'harness Codex app-server anziché conservare un backend
CLI Codex.

La modalità `auto` è intenzionalmente conservativa per la maggior parte dei provider. I modelli agente
OpenAI costituiscono l'eccezione: sia un runtime non impostato sia `auto` vengono risolti nell'harness
Codex. La configurazione esplicita del runtime OpenClaw rimane un percorso di compatibilità
facoltativo per i turni dell'agente `openai/*`; se abbinata a un profilo OAuth `openai`
selezionato, OpenClaw instrada internamente tale percorso tramite il trasporto di
autenticazione Codex, mantenendo il riferimento pubblico al modello come `openai/*`. I vincoli
obsoleti di sessione del runtime OpenAI vengono ignorati dalla selezione del runtime e possono essere rimossi con
`openclaw doctor --fix`.

Se `openclaw doctor` avverte che il plugin `codex` è abilitato mentre nella configurazione
rimangono riferimenti obsoleti ai modelli Codex, consideralo uno stato di percorso obsoleto ed esegui
`openclaw doctor --fix` per riscriverlo come `openai/*` con il runtime Codex.

## Runtime dell'agente GitHub Copilot

Il plugin esterno `@openclaw/copilot` registra un runtime `copilot` attivabile esplicitamente,
basato sulla CLI di GitHub Copilot (`@github/copilot-sdk`). Rivendica il
provider di abbonamento canonico `github-copilot` e non viene **mai** selezionato da
`auto`. Attivalo esplicitamente per modello o per provider tramite `agentRuntime.id`:

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

L'harness rivendica il proprio provider, runtime, la chiave di sessione della CLI e il prefisso
del profilo di autenticazione in `extensions/copilot/doctor-contract-api.ts`, che `openclaw doctor`
carica automaticamente. Per configurazione, autenticazione, mirroring della trascrizione, Compaction, il
contratto dichiarativo di doctor e la decisione più generale tra SDK di Pi, Codex e Copilot,
consulta [runtime dell'agente GitHub Copilot](/it/plugins/copilot).

## Contratto di compatibilità

Quando un runtime non è OpenClaw, la relativa documentazione deve indicare quali funzionalità di OpenClaw
supporta:

| Domanda                                      | Perché è importante                                                                                                           |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Chi gestisce il ciclo del modello?           | Determina dove avvengono i nuovi tentativi, la continuazione degli strumenti e le decisioni sulla risposta finale.             |
| Chi gestisce la cronologia canonica del thread? | Determina se OpenClaw può modificare la cronologia o soltanto replicarla.                                                     |
| Gli strumenti dinamici di OpenClaw funzionano? | Messaggistica, sessioni, Cron e gli strumenti gestiti da OpenClaw dipendono da questo.                                        |
| Gli hook dinamici degli strumenti funzionano? | I Plugin richiedono `before_tool_call`, `after_tool_call` e il middleware attorno agli strumenti gestiti da OpenClaw.         |
| Gli hook degli strumenti nativi funzionano?  | Shell, patch e strumenti gestiti dal runtime richiedono il supporto nativo degli hook per l'applicazione delle policy e l'osservazione. |
| Viene eseguito il ciclo di vita del motore di contesto? | I Plugin di memoria e contesto dipendono dai cicli di assemblaggio, acquisizione, post-turno e Compaction.             |
| Quali dati di Compaction vengono esposti?     | Alcuni Plugin richiedono solo notifiche; altri necessitano dei metadati sugli elementi mantenuti o eliminati.                  |
| Cosa non è intenzionalmente supportato?       | Gli utenti non devono presumere l'equivalenza con OpenClaw quando il runtime nativo gestisce più stato.                        |

Il contratto di supporto del runtime Codex è documentato in
[runtime dell'harness Codex](/it/plugins/codex-harness-runtime#v1-support-contract).

## Etichette di stato

L'output dello stato può mostrare entrambe le etichette `Execution` e `Runtime`. Interpretale come
informazioni diagnostiche, non come nomi di provider:

- Un riferimento al modello come `openai/gpt-5.6-sol` indica il provider/modello selezionato.
- Un ID di runtime come `codex` indica il ciclo che esegue il turno.
- Un'etichetta di canale come Telegram o Discord indica dove si svolge la conversazione.

Se un'esecuzione mostra un runtime inatteso, esamina innanzitutto la policy di runtime del
provider/modello selezionato. I vincoli legacy del runtime di sessione non determinano più l'instradamento.

## Contenuti correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Runtime dell'agente GitHub Copilot](/it/plugins/copilot)
- [OpenAI](/it/providers/openai)
- [Plugin per harness di agenti](/it/plugins/sdk-agent-harness)
- [Ciclo dell'agente](/it/concepts/agent-loop)
- [Modelli](/it/concepts/models)
- [Stato](/it/cli/status)
