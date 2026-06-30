---
read_when:
    - Vuoi usare l’harness app-server Codex incluso
    - Hai bisogno di esempi di configurazione dell'harness Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ricorrere a OpenClaw
summary: Esegui i turni dell'agente incorporato OpenClaw tramite l'harness app-server Codex incluso
title: Ambiente di test Codex
x-i18n:
    generated_at: "2026-06-30T14:09:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1569dca11b6d5a870c2dde58d04046df7829e70a5c59f34b25cf79b209c530e5
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` in bundle consente a OpenClaw di eseguire turni agente OpenAI incorporati
tramite l'app-server Codex invece dell'harness OpenClaw integrato.

Usa l'harness Codex quando vuoi che Codex possieda la sessione agente di basso livello:
ripresa nativa del thread, continuazione nativa degli strumenti, Compaction nativa ed
esecuzione tramite app-server. OpenClaw continua a possedere i canali chat, i file di sessione, la
selezione del modello, gli strumenti dinamici OpenClaw, le approvazioni, la consegna dei media e il mirror
visibile della trascrizione.

La configurazione normale usa riferimenti canonici ai modelli OpenAI come `openai/gpt-5.5`.
Non configurare riferimenti GPT Codex legacy. Inserisci l'ordine di autenticazione agente OpenAI
sotto `auth.order.openai`; gli id profilo di autenticazione Codex legacy meno recenti e
le voci legacy dell'ordine di autenticazione Codex sono stato legacy riparato da
`openclaw doctor --fix`.

Quando nessuna sandbox OpenClaw è attiva, OpenClaw avvia i thread dell'app-server Codex
con la modalità codice nativa di Codex abilitata, lasciando al contempo disattivata per impostazione predefinita la modalità solo codice.
Questo mantiene disponibili lo spazio di lavoro nativo e le capacità di codice di Codex mentre
gli strumenti dinamici OpenClaw continuano tramite il bridge app-server `item/tool/call`.
Il sandboxing OpenClaw attivo e le policy degli strumenti limitate disabilitano completamente la modalità codice nativa,
a meno che tu non scelga esplicitamente il percorso sperimentale sandbox exec-server.

Questa funzionalità nativa di Codex è separata da
[modalità codice OpenClaw](/it/reference/code-mode), che è un runtime QuickJS-WASI opzionale
per esecuzioni OpenClaw generiche con una forma di input `exec` diversa.

Per la divisione più ampia tra modello/provider/runtime, inizia da
[Runtime agente](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime e Telegram,
Discord, Slack o un altro canale rimane la superficie di comunicazione.

## Requisiti

- OpenClaw con il Plugin `codex` in bundle disponibile.
- Se la tua configurazione usa `plugins.allow`, includi `codex`.
- App-server Codex `0.125.0` o più recente. Il Plugin in bundle gestisce per impostazione predefinita
  un binario app-server Codex compatibile, quindi i comandi locali `codex` in `PATH` non
  influenzano l'avvio normale dell'harness.
- Autenticazione Codex disponibile tramite `openclaw models auth login --provider openai`,
  un account app-server nella home Codex dell'agente o un profilo di autenticazione Codex con chiave API esplicita.

Per precedenza dell'autenticazione, isolamento dell'ambiente, comandi app-server personalizzati, discovery dei modelli
e tutti i campi di configurazione, consulta
[Riferimento harness Codex](/it/plugins/codex-harness-reference).

## Avvio rapido

La maggior parte degli utenti che desidera Codex in OpenClaw vuole questo percorso: accedere con un
abbonamento ChatGPT/Codex, abilitare il Plugin `codex` in bundle e usare un
riferimento modello canonico `openai/gpt-*`.

Accedi con Codex OAuth:

```bash
openclaw models auth login --provider openai
```

Abilita il Plugin `codex` in bundle e seleziona un modello agente OpenAI:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Se la tua configurazione usa `plugins.allow`, aggiungi anche lì `codex`:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Riavvia il Gateway dopo aver modificato la configurazione del Plugin. Se una chat esistente
ha già una sessione, usa `/new` o `/reset` prima di testare modifiche al runtime, in modo che il turno successivo
risolva l'harness dalla configurazione corrente.

## Configurazione

La configurazione di avvio rapido è la configurazione minima praticabile dell'harness Codex. Imposta le opzioni
dell'harness Codex nella configurazione OpenClaw e usa la CLI solo per l'autenticazione Codex:

| Esigenza                               | Imposta                                                                          | Dove                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Abilitare l'harness                    | `plugins.entries.codex.enabled: true`                                            | Configurazione OpenClaw            |
| Mantenere un'installazione Plugin in allowlist | Includi `codex` in `plugins.allow`                                               | Configurazione OpenClaw            |
| Instradare i turni agente OpenAI tramite Codex | `agents.defaults.model` o `agents.list[].model` come `openai/gpt-*`              | Configurazione agente OpenClaw     |
| Accedere con ChatGPT/Codex OAuth       | `openclaw models auth login --provider openai`                                   | Profilo di autenticazione CLI      |
| Aggiungere un backup con chiave API per le esecuzioni Codex | Profilo con chiave API `openai:*` elencato dopo l'autenticazione in abbonamento in `auth.order.openai` | Profilo di autenticazione CLI + configurazione OpenClaw |
| Fallire in modo chiuso quando Codex non è disponibile | Provider o modello `agentRuntime.id: "codex"`                                    | Configurazione modello/provider OpenClaw |
| Usare traffico API OpenAI diretto      | Provider o modello `agentRuntime.id: "openclaw"` con normale autenticazione OpenAI | Configurazione modello/provider OpenClaw |
| Regolare il comportamento dell'app-server | `plugins.entries.codex.config.appServer.*`                                       | Configurazione Plugin Codex        |
| Abilitare app Plugin native Codex      | `plugins.entries.codex.config.codexPlugins.*`                                    | Configurazione Plugin Codex        |
| Abilitare Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configurazione Plugin Codex        |

Usa riferimenti modello `openai/gpt-*` per turni agente OpenAI supportati da Codex. Preferisci
`auth.order.openai` per l'ordinamento con abbonamento prima e chiave API come backup. Gli id
profilo di autenticazione Codex legacy esistenti e l'ordine di autenticazione Codex legacy sono
stato legacy solo per doctor; non scrivere nuovi riferimenti GPT Codex legacy.

Non impostare `compaction.model` o `compaction.provider` sugli agenti supportati da Codex.
Codex compatta tramite lo stato thread nativo del suo app-server, quindi OpenClaw ignora
questi override locali del riepilogatore a runtime e `openclaw doctor --fix` li rimuove
quando l'agente usa Codex.

Lossless rimane supportato come motore di contesto per assemblaggio, ingestione e
manutenzione intorno ai turni Codex. Configuralo tramite
`plugins.slots.contextEngine: "lossless-claw"` e
`plugins.entries.lossless-claw.config.summaryModel`, non tramite
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la vecchia forma
`compaction.provider: "lossless-claw"` nello slot del motore di contesto Lossless
quando Codex è il runtime attivo, ma la Compaction resta comunque di proprietà di Codex nativo.

L'harness app-server nativo Codex supporta motori di contesto che richiedono
assemblaggio pre-prompt. I backend CLI generici, incluso `codex-cli`, non forniscono
quella capacità host.

Per gli agenti supportati da Codex, `/compact` avvia la Compaction nativa dell'app-server Codex sul
thread associato. OpenClaw non attende il completamento, non impone un timeout OpenClaw,
non riavvia l'app-server condiviso e non ricorre a un motore di contesto o a un
riepilogatore OpenAI pubblico. Se il binding del thread Codex nativo è mancante o
obsoleto, il comando fallisce in modo chiuso, così l'operatore vede il reale confine del runtime
invece di passare silenziosamente ad altri backend di Compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In quella forma, entrambi i profili continuano a passare tramite Codex per i turni agente
`openai/gpt-*`. La chiave API è solo un fallback di autenticazione, non una richiesta di passare a OpenClaw o
a OpenAI Responses semplice.

Il resto di questa pagina copre le varianti comuni tra cui gli utenti devono scegliere:
forma di distribuzione, instradamento fail-closed, policy di approvazione guardian, Plugin Codex
nativi e Computer Use. Per elenchi completi delle opzioni, valori predefiniti, enum, discovery,
isolamento dell'ambiente, timeout e campi di trasporto dell'app-server, consulta
[Riferimento harness Codex](/it/plugins/codex-harness-reference).

## Verificare il runtime Codex

Usa `/status` nella chat in cui ti aspetti Codex. Un turno agente OpenAI supportato da Codex
mostra:

```text
Runtime: OpenAI Codex
```

Poi controlla lo stato dell'app-server Codex:

```text
/codex status
/codex models
```

`/codex status` segnala connettività dell'app-server, account, limiti di frequenza, server MCP
e Skills. `/codex models` elenca il catalogo live dell'app-server Codex per
l'harness e l'account. Se `/status` sorprende, consulta
[Risoluzione dei problemi](#troubleshooting).

## Instradamento e selezione del modello

Mantieni separati i riferimenti provider e la policy runtime:

- Usa `openai/gpt-*` per i turni agente OpenAI tramite Codex.
- Non usare riferimenti GPT Codex legacy nella configurazione. Esegui `openclaw doctor --fix` per
  riparare riferimenti legacy e pin di route sessione obsoleti.
- `agentRuntime.id: "codex"` è facoltativo per la normale modalità automatica OpenAI, ma utile
  quando una distribuzione deve fallire in modo chiuso se Codex non è disponibile.
- `agentRuntime.id: "openclaw"` opta un provider o modello nel runtime incorporato OpenClaw
  quando questo è intenzionale.
- `/codex ...` controlla le conversazioni native dell'app-server Codex dalla chat.
- ACP/acpx è un percorso harness esterno separato. Usalo solo quando l'utente chiede
  ACP/acpx o un adattatore harness esterno.

Instradamento dei comandi comuni:

| Intento dell'utente                                  | Usa                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Collegare la chat corrente                           | `/codex bind [--cwd <path>]`                                                                          |
| Riprendere un thread Codex esistente                 | `/codex resume <thread-id>`                                                                           |
| Elencare o filtrare thread Codex                     | `/codex threads [filter]`                                                                             |
| Elencare Plugin Codex nativi                         | `/codex plugins list`                                                                                 |
| Abilitare o disabilitare un Plugin Codex nativo configurato | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Collegare una sessione Codex CLI esistente su un nodo abbinato | `/codex sessions --host <node> [filter]`, poi `/codex resume <session-id> --host <node> --bind here` |
| Inviare solo feedback Codex                          | `/codex diagnostics [note]`                                                                           |
| Avviare un'attività ACP/acpx                         | Comandi di sessione ACP/acpx, non `/codex`                                                            |

| Caso d'uso                                           | Configurazione                                                        | Verifica                                | Note                                  |
| ---------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-*` più plugin `codex` abilitato                           | `/status` mostra `Runtime: OpenAI Codex` | Percorso consigliato                  |
| Fallimento chiuso se Codex non è disponibile         | Provider o modello `agentRuntime.id: "codex"`                         | Il turno fallisce invece del fallback integrato | Da usare per distribuzioni solo Codex |
| Traffico diretto con chiave API OpenAI tramite OpenClaw | Provider o modello `agentRuntime.id: "openclaw"` e normale auth OpenAI | `/status` mostra il runtime OpenClaw    | Da usare solo quando OpenClaw è intenzionale |
| Config legacy                                        | riferimenti GPT Codex legacy                                          | `openclaw doctor --fix` la riscrive     | Non scrivere nuova configurazione in questo modo |
| Adapter Codex ACP/acpx                               | ACP `sessions_spawn({ runtime: "acp" })`                              | Stato di attività/sessione ACP          | Separato dall'harness Codex nativo    |

`agents.defaults.imageModel` segue la stessa divisione dei prefissi. Usa `openai/gpt-*`
per il normale percorso OpenAI e `codex/gpt-*` solo quando la comprensione delle immagini
deve passare attraverso un turno app-server Codex delimitato. Non usare
riferimenti GPT Codex legacy; doctor riscrive quel prefisso legacy in `openai/gpt-*`.

## Pattern di distribuzione

### Distribuzione Codex di base

Usa la configurazione quickstart quando tutti i turni agent OpenAI devono usare Codex per
impostazione predefinita.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

### Distribuzione con provider misti

Questa forma mantiene Claude come agent predefinito e aggiunge un agent Codex denominato:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
      },
    ],
  },
}
```

Con questa configurazione, l'agent `main` usa il suo normale percorso provider e l'agent
`codex` usa l'app-server Codex.

### Distribuzione Codex con fallimento chiuso

Per i turni agent OpenAI, `openai/gpt-*` si risolve già in Codex quando il
plugin incluso è disponibile. Aggiungi una policy runtime esplicita quando vuoi una regola
scritta di fallimento chiuso:

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Con Codex forzato, OpenClaw fallisce in anticipo se il plugin Codex è disabilitato, se
l'app-server è troppo vecchio o se l'app-server non può avviarsi.

## Policy dell'app-server

Per impostazione predefinita, il plugin avvia localmente il binario Codex gestito da OpenClaw con trasporto stdio.
Imposta `appServer.command` solo quando vuoi intenzionalmente eseguire un
eseguibile diverso. Usa il trasporto WebSocket solo quando un app-server è già
in esecuzione altrove:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

Le sessioni app-server stdio locali usano per impostazione predefinita la postura dell'operatore locale attendibile:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se i requisiti Codex locali non consentono quella
postura YOLO implicita, OpenClaw seleziona invece i permessi guardian consentiti.
Quando una sandbox OpenClaw è attiva per la sessione, OpenClaw disabilita Code Mode
nativo di Codex, i server MCP utente e l'esecuzione di plugin supportati da app per quel
turno, invece di affidarsi al sandboxing lato host di Codex. L'accesso shell è esposto
tramite strumenti dinamici supportati dalla sandbox OpenClaw, come `sandbox_exec` e
`sandbox_process`, quando i normali strumenti exec/process sono disponibili.

Usa la modalità exec normalizzata di OpenClaw quando vuoi l'auto-review nativa di Codex prima
di escape dalla sandbox o permessi aggiuntivi:

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Per le sessioni app-server Codex, OpenClaw mappa `tools.exec.mode: "auto"` ad approvazioni
reviewed da Codex Guardian, di solito
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando i requisiti locali consentono quei valori.
In `tools.exec.mode: "auto"`, OpenClaw non conserva override Codex legacy non sicuri
`approvalPolicy: "never"` o `sandbox: "danger-full-access"`; usa
`tools.exec.mode: "full"` per una postura Codex intenzionale senza approvazioni. Il
preset legacy `plugins.entries.codex.config.appServer.mode: "guardian"` continua a
funzionare, ma `tools.exec.mode: "auto"` è la superficie OpenClaw normalizzata.

Per il confronto a livello di modalità con approvazioni exec host e permessi ACPX,
vedi [Modalità di permesso](/it/tools/permission-modes).

Per ogni campo app-server, ordine auth, isolamento dell'ambiente, discovery e
comportamento di timeout, vedi [Riferimento harness Codex](/it/plugins/codex-harness-reference).

## Comandi e diagnostica

Il plugin incluso registra `/codex` come comando slash su qualsiasi canale che
supporta i comandi testuali OpenClaw.

L'esecuzione e il controllo nativi richiedono un owner o un client Gateway
`operator.admin`. Questo include associare o riprendere thread, inviare o interrompere turni,
cambiare modello, fast-mode o stato dei permessi, compattare o revisionare e
staccare un'associazione. Gli altri mittenti autorizzati mantengono i comandi di sola lettura per stato, aiuto,
account, modello, thread, server MCP, skill e ispezione delle associazioni.

Forme comuni:

- `/codex status` controlla connettività app-server, modelli, account, limiti di frequenza,
  server MCP e skills.
- `/codex models` elenca i modelli app-server Codex live.
- `/codex threads [filter]` elenca i thread recenti dell'app-server Codex.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un
  thread Codex esistente.
- `/codex compact` chiede all'app-server Codex di compattare il thread collegato.
- `/codex review` avvia la review nativa Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare feedback Codex per il
  thread collegato.
- `/codex account` mostra account e stato dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP dell'app-server Codex.
- `/codex skills` elenca le skills dell'app-server Codex.

Per la maggior parte dei report di supporto, inizia con `/diagnostics [note]` nella conversazione
in cui si è verificato il bug. Crea un report diagnostico Gateway e, per le sessioni
harness Codex, chiede l'approvazione per inviare il bundle di feedback Codex pertinente.
Vedi [Esportazione diagnostica](/it/gateway/diagnostics) per il modello di privacy e il comportamento
nelle chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del feedback Codex
per il thread attualmente collegato senza il bundle diagnostico Gateway completo.

### Ispezionare localmente i thread Codex

Il modo più rapido per ispezionare un'esecuzione Codex non riuscita è spesso aprire direttamente il
thread Codex nativo:

```bash
codex resume <thread-id>
```

Ottieni l'id del thread dalla risposta `/diagnostics` completata, da `/codex binding` o da
`/codex threads [filter]`.

Per la meccanica di upload e i confini diagnostici a livello runtime, vedi
[Runtime harness Codex](/it/plugins/codex-harness-runtime#codex-feedback-upload).

L'auth viene selezionata in questo ordine:

1. Profili auth OpenAI ordinati per l'agent, preferibilmente sotto
   `auth.order.openai`. Esegui `openclaw doctor --fix` per migrare i vecchi
   id dei profili auth Codex legacy e l'ordine auth Codex legacy.
2. L'account esistente dell'app-server nella home Codex di quell'agent.
3. Solo per avvii app-server stdio locali, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account app-server e l'auth OpenAI è
   ancora richiesta.

Quando OpenClaw rileva un profilo auth Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene le chiavi API a livello Gateway disponibili per embeddings o modelli OpenAI diretti
senza far fatturare per errore i turni app-server Codex nativi tramite API.
I profili Codex espliciti con chiave API e il fallback locale stdio con chiave env usano il login
app-server invece dell'env ereditato dal processo figlio. Le connessioni app-server WebSocket
non ricevono il fallback con chiave API env del Gateway; usa un profilo auth esplicito o
l'account proprio dell'app-server remoto.
Quando sono configurati plugin Codex nativi, OpenClaw installa o aggiorna quei
plugin tramite l'app-server connesso prima di esporre le app possedute dai plugin al
thread Codex. `app/list` rimane la fonte di verità per id app,
accessibilità e metadati, ma OpenClaw possiede la decisione di abilitazione per thread:
se la policy consente un'app accessibile elencata, OpenClaw invia
`thread/start.config.apps[appId].enabled = true` anche quando `app/list` attualmente
segnala quell'app come disabilitata. Questo percorso non inventa installazioni di app per
id sconosciuti; OpenClaw attiva solo plugin marketplace con `plugin/install`
e poi aggiorna l'inventario.

Se un profilo di abbonamento raggiunge un limite di utilizzo Codex, OpenClaw registra l'orario di reset
quando Codex ne segnala uno e prova il successivo profilo auth ordinato per la stessa
esecuzione Codex. Quando l'orario di reset passa, il profilo di abbonamento torna idoneo
senza cambiare il modello `openai/gpt-*` selezionato o il runtime Codex.

Per avvii app-server stdio locali, OpenClaw imposta `CODEX_HOME` su una directory per agent
così configurazione Codex, file auth/account, cache/dati dei plugin e stato dei thread nativi
non leggono né scrivono per impostazione predefinita il `~/.codex` personale dell'operatore.
OpenClaw conserva il normale `HOME` del processo; i sottoprocessi eseguiti da Codex
possono comunque trovare configurazione e token nella home utente, e Codex può scoprire voci condivise
`$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`.

Se una distribuzione richiede isolamento aggiuntivo dell'ambiente, aggiungi quelle variabili a
`appServer.clearEnv`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` influisce solo sul processo figlio app-server Codex generato.
OpenClaw rimuove `CODEX_HOME` e `HOME` da questo elenco durante la normalizzazione dell'avvio locale:
`CODEX_HOME` resta per agent e `HOME` resta ereditato così
i sottoprocessi possono usare il normale stato della home utente.

Codex dynamic tools usa per impostazione predefinita il caricamento `searchable`. OpenClaw non espone
dynamic tools che duplicano le operazioni dell'area di lavoro native di Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. La maggior parte degli altri
strumenti di integrazione di OpenClaw, come messaggistica, media, cron, browser, nodi,
gateway e `heartbeat_respond`, è disponibile tramite la ricerca degli strumenti di Codex nello
spazio dei nomi `openclaw`, mantenendo più piccolo il contesto iniziale del modello. La ricerca Web
usa per impostazione predefinita lo strumento `web_search` ospitato da Codex quando la ricerca è abilitata e non è
selezionato alcun provider gestito. La ricerca ospitata nativa e il dynamic tool
`web_search` gestito da OpenClaw si escludono a vicenda, così la ricerca gestita non può aggirare
le restrizioni di dominio native. OpenClaw usa lo strumento gestito quando la ricerca ospitata non è
disponibile, è disabilitata esplicitamente o è sostituita da un provider gestito selezionato.
OpenClaw mantiene disabilitata l'estensione autonoma `web.run` di Codex perché
il traffico app-server di produzione rifiuta lo spazio dei nomi `web` definito dall'utente.
`tools.web.search.enabled: false` disabilita entrambi i percorsi, così come le esecuzioni solo LLM
con strumenti disabilitati. Codex tratta `"cached"` come una preferenza e la risolve in accesso
esterno live per i turni app-server senza restrizioni. Il fallback gestito automatico
fallisce in modo chiuso quando sono impostati `allowedDomains` nativi, così l'elenco consentito non può essere
aggirato. Le modifiche persistenti alla policy di ricerca effettiva ruotano il thread Codex
associato prima del turno successivo. Le restrizioni transitorie per turno usano un thread
temporaneo con restrizioni e preservano l'associazione esistente per una ripresa successiva.
`sessions_yield` e le risposte sorgente solo con strumenti di messaggio restano dirette perché
sono contratti di controllo del turno. `sessions_spawn` resta ricercabile, così il
`spawn_agent` nativo di Codex rimane la superficie primaria dei subagenti Codex, mentre la delega
esplicita OpenClaw o ACP resta disponibile tramite lo spazio dei nomi dei dynamic tool
`openclaw`. Le istruzioni di collaborazione Heartbeat indicano a Codex di cercare
`heartbeat_respond` prima di terminare un turno Heartbeat quando lo strumento non è già
caricato.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un app-server Codex
personalizzato che non può cercare dynamic tools differiti o quando esegui il debug del payload
completo degli strumenti.

Campi Plugin Codex di primo livello supportati:

| Campo                      | Predefinito    | Significato                                                                                  |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` per inserire i dynamic tools OpenClaw direttamente nel contesto iniziale degli strumenti Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomi aggiuntivi di dynamic tool OpenClaw da omettere dai turni app-server Codex.              |
| `codexPlugins`             | disabilitato   | Supporto nativo Plugin/app Codex per Plugin curati installati da sorgente migrati.            |

Campi `appServer` supportati:

| Campo                                         | Predefinito                                           | Significato                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `command`                                     | binario Codex gestito                                 | Eseguibile per il trasporto stdio. Lascia non impostato per usare il binario gestito; impostalo solo per un override esplicito.                                                                                                                                                                                                                                                                 |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                               |
| `url`                                         | non impostato                                         | URL dell'app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                  |
| `authToken`                                   | non impostato                                         | Token Bearer per il trasporto WebSocket. Accetta una stringa letterale o SecretInput come `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                          |
| `headers`                                     | `{}`                                                  | Header WebSocket aggiuntivi. I valori degli header accettano stringhe letterali o valori SecretInput, per esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                  | Nomi di variabili d'ambiente aggiuntive rimossi dal processo app-server stdio avviato dopo che OpenClaw ha costruito il proprio ambiente ereditato. OpenClaw mantiene `CODEX_HOME` per agente e `HOME` ereditato per gli avvii locali.                                                                                                                                                         |
| `codeModeOnly`                                | `false`                                               | Abilita la superficie degli strumenti solo in modalità codice di Codex. Gli strumenti dinamici di OpenClaw restano registrati con Codex, quindi le chiamate annidate `tools.*` ritornano tramite il bridge app-server `item/tool/call`.                                                                                                                                                         |
| `remoteWorkspaceRoot`                         | non impostato                                         | Radice remota del workspace dell'app-server Codex. Quando impostata, OpenClaw deduce la radice del workspace locale dal workspace OpenClaw risolto, preserva il suffisso cwd corrente sotto questa radice remota e invia a Codex solo la cwd finale dell'app-server. Se la cwd è esterna alla radice del workspace OpenClaw risolta, OpenClaw fallisce in modo chiuso invece di inviare un percorso locale del Gateway all'app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                               | Timeout per le chiamate del piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Finestra di inattività dopo che Codex accetta un turno o dopo una richiesta app-server con ambito di turno mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                             |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Guardia di inattività del completamento e avanzamento usata dopo un passaggio a uno strumento, un completamento di strumento nativo, avanzamento grezzo dell'assistente post-strumento, completamento grezzo del ragionamento o avanzamento del ragionamento mentre OpenClaw attende `turn/completed`. Usalo per carichi di lavoro attendibili o pesanti in cui la sintesi post-strumento può legittimamente restare silenziosa più a lungo del budget finale di rilascio dell'assistente. |
| `mode`                                        | `"yolo"` a meno che i requisiti Codex locali non vietino YOLO | Preset per esecuzione YOLO o con revisione guardian. I requisiti stdio locali che omettono `danger-full-access`, l'approvazione `never` o il revisore `user` rendono guardian il valore predefinito implicito.                                                                                                                                                                                  |
| `approvalPolicy`                              | `"never"` o una policy di approvazione guardian consentita | Policy di approvazione nativa di Codex inviata all'avvio/ripresa/turno del thread. I valori predefiniti guardian preferiscono `"on-request"` quando consentito.                                                                                                                                                                                                                                |
| `sandbox`                                     | `"danger-full-access"` o una sandbox guardian consentita | Modalità sandbox nativa di Codex inviata all'avvio/ripresa del thread. I valori predefiniti guardian preferiscono `"workspace-write"` quando consentito, altrimenti `"read-only"`. Quando una sandbox OpenClaw è attiva, i turni `danger-full-access` usano Codex `workspace-write` con accesso di rete derivato dall'impostazione di egress della sandbox OpenClaw.                             |
| `approvalsReviewer`                           | `"user"` o un revisore guardian consentito            | Usa `"auto_review"` per lasciare che Codex esamini le richieste di approvazione native quando consentito, altrimenti `guardian_subagent` o `user`. `guardian_subagent` resta un alias legacy.                                                                                                                                                                                                    |
| `serviceTier`                                 | non impostato                                         | Tier di servizio opzionale dell'app-server Codex. `"priority"` abilita il routing in modalità veloce, `"flex"` richiede l'elaborazione flex, `null` cancella l'override e il legacy `"fast"` è accettato come `"priority"`.                                                                                                                                                                     |
| `networkProxy`                                | disabilitato                                          | Abilita il networking del profilo di permessi Codex per i comandi app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la seleziona con `default_permissions` invece di inviare `sandbox`.                                                                                                                                                           |
| `experimental.sandboxExecServer`              | `false`                                               | Opt-in di anteprima che registra con Codex app-server 0.132.0 o più recente un ambiente Codex basato su sandbox OpenClaw, in modo che l'esecuzione nativa di Codex possa essere eseguita dentro la sandbox OpenClaw attiva.                                                                                                                                                                    |

`appServer.networkProxy` è esplicito perché cambia il contratto della sandbox
Codex. Quando è abilitato, OpenClaw imposta anche `features.network_proxy.enabled` e
`default_permissions` nella configurazione del thread Codex, così il profilo di permessi
generato può avviare il networking gestito da Codex. Per impostazione predefinita, OpenClaw genera un
nome profilo resistente alle collisioni `openclaw-network-<fingerprint>` dal
corpo del profilo; usa `profileName` solo quando è richiesto un nome locale stabile.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

Se il runtime app-server normale fosse `danger-full-access`, abilitare
`networkProxy` usa l'accesso al filesystem in stile workspace per il profilo di
permessi generato. L'applicazione della rete gestita da Codex è networking in sandbox,
quindi un profilo con accesso completo non proteggerebbe il traffico in uscita.
Le voci di dominio usano `allow` o `deny`; le voci dei socket Unix usano i valori
`allow` o `none` di Codex.

Le chiamate a strumenti dinamici di proprietà di OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: le richieste Codex `item/tool/call` usano per impostazione predefinita un watchdog
OpenClaw di 90 secondi. Un argomento `timeoutMs` positivo per chiamata estende
o riduce il budget di quello specifico strumento. Lo strumento `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` quando la chiamata allo strumento non
fornisce un proprio timeout, oppure altrimenti un valore predefinito di 120 secondi per la generazione di immagini.
Lo strumento `image` per la comprensione dei media usa
`tools.media.image.timeoutSeconds` o il suo valore predefinito per i media di 60 secondi. Per la comprensione delle immagini,
quel timeout si applica alla richiesta stessa e non viene
ridotto dal lavoro di preparazione precedente. I budget degli strumenti dinamici sono
limitati a 600000 ms. In caso di timeout, OpenClaw interrompe il segnale dello strumento
dove supportato e restituisce a Codex una risposta di strumento dinamico non riuscita, così il turno
può continuare invece di lasciare la sessione in `processing`.
Questo watchdog è il budget dinamico esterno di `item/tool/call`; i timeout delle richieste specifici del provider
vengono eseguiti all'interno di quella chiamata e mantengono la propria semantica di timeout.

Dopo che Codex accetta un turno, e dopo che OpenClaw risponde a una richiesta
app-server con ambito di turno, l'harness si aspetta che Codex avanzi nel turno corrente e
alla fine concluda il turno nativo con `turn/completed`. Se l'app-server resta
silenzioso per `appServer.turnCompletionIdleTimeoutMs`, OpenClaw tenta al meglio
di interrompere il turno Codex, registra un timeout diagnostico e libera la
corsia di sessione OpenClaw, così i messaggi di chat successivi non restano in coda dietro un turno
nativo obsoleto. La maggior parte delle notifiche non terminali per lo stesso turno disarma quel breve
watchdog perché Codex ha dimostrato che il turno è ancora attivo. I passaggi di consegne degli strumenti usano un
budget di inattività post-strumento più lungo: dopo che OpenClaw restituisce una risposta
`item/tool/call`, dopo il completamento di elementi strumento nativi come `commandExecution`, dopo i completamenti grezzi
`custom_tool_call_output`, e dopo avanzamento grezzo dell'assistente post-strumento,
completamenti di ragionamento o avanzamento del ragionamento. La guardia usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e
altrimenti usa per impostazione predefinita cinque minuti. Lo stesso budget post-strumento estende anche il
watchdog di avanzamento per la finestra di sintesi silenziosa prima che Codex emetta il successivo
evento del turno corrente. Le notifiche globali dell'app-server, come gli aggiornamenti dei limiti di frequenza,
non reimpostano l'avanzamento di inattività del turno. I completamenti di ragionamento, i completamenti
`agentMessage` di commentary e l'avanzamento grezzo di ragionamento o assistente prima dello strumento possono
essere seguiti da una risposta finale automatica, quindi usano la guardia di risposta post-avanzamento
invece di liberare immediatamente la corsia di sessione. Solo gli elementi
`agentMessage` finali/non-commentary completati e i completamenti grezzi
dell'assistente prima dello strumento armano il rilascio dell'output dell'assistente: se Codex poi resta silenzioso
senza `turn/completed`, OpenClaw tenta al meglio di interrompere il turno nativo e
libera la corsia di sessione. Gli errori stdio dell'app-server riproducibili in sicurezza, inclusi
i timeout di inattività del completamento turno senza evidenze di assistente, strumento, elemento attivo o
effetti collaterali, vengono ritentati una volta su un nuovo tentativo dell'app-server. I timeout non sicuri
ritirano comunque il client app-server bloccato e liberano la corsia di sessione
OpenClaw. Inoltre cancellano il binding obsoleto del thread nativo invece di essere
riprodotti automaticamente. I timeout del monitoraggio del completamento mostrano testo di timeout specifico di Codex:
i casi riproducibili in sicurezza dicono che la risposta potrebbe essere incompleta, mentre i casi non sicuri
dicono all'utente di verificare lo stato corrente prima di riprovare. La diagnostica pubblica dei timeout
include campi strutturali come l'ultimo metodo di notifica dell'app-server,
id/tipo/ruolo dell'elemento di risposta grezzo dell'assistente, conteggi di richieste/elementi attivi e stato
del monitoraggio armato. Quando l'ultima notifica è un elemento di risposta grezzo dell'assistente, include
anche un'anteprima limitata del testo dell'assistente. Non include contenuto grezzo di prompt o
strumenti.

Gli override d'ambiente restano disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` bypassa il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferibile per distribuzioni ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Plugin Codex nativi

Il supporto dei plugin Codex nativi usa le capacità app e plugin proprie dell'app-server Codex
nello stesso thread Codex del turno dell'harness OpenClaw. OpenClaw
non traduce i plugin Codex in strumenti dinamici OpenClaw sintetici `codex_plugin_*`.

`codexPlugins` riguarda solo le sessioni che selezionano l'harness Codex nativo. Non
ha effetto sulle esecuzioni dell'harness integrato, sulle normali esecuzioni del provider OpenAI, sui binding di conversazione ACP
o su altri harness.

Configurazione minima migrata:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

La configurazione app del thread viene calcolata quando OpenClaw stabilisce una sessione dell'harness Codex
o sostituisce un binding obsoleto del thread Codex. Non viene ricalcolata a ogni turno.
Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` o riavvia il gateway, così
le future sessioni dell'harness Codex iniziano con l'insieme di app aggiornato.

Per idoneità alla migrazione, inventario app, policy delle azioni distruttive,
elicitazioni e diagnostica dei plugin nativi, consulta
[Plugin Codex nativi](/it/plugins/codex-native-plugins).

L'accesso ad app e plugin lato OpenAI è controllato dall'account Codex connesso
e, per gli spazi di lavoro Business ed Enterprise/Edu, dai controlli app dello spazio di lavoro. Consulta
[Usare Codex con il tuo piano ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
per la panoramica di OpenAI su account e controlli dello spazio di lavoro.

## Computer Use

Computer Use è trattato nella propria guida di configurazione:
[Codex Computer Use](/it/plugins/codex-computer-use).

La versione breve: OpenClaw non integra come vendor l'app di controllo desktop né esegue
azioni desktop in proprio. Prepara l'app-server Codex, verifica che il server MCP
`computer-use` sia disponibile, e poi lascia che Codex possieda le chiamate agli strumenti MCP
nativi durante i turni in modalità Codex.

## Confini runtime

L'harness Codex modifica solo l'esecutore agent incorporato di basso livello.

- Gli strumenti dinamici OpenClaw sono supportati. Codex chiede a OpenClaw di eseguire quegli
  strumenti, quindi OpenClaw resta nel percorso di esecuzione.
- Gli strumenti shell, patch, MCP e app nativi di Codex sono di proprietà di Codex.
  OpenClaw può osservare o bloccare eventi nativi selezionati tramite il relay supportato,
  ma non riscrive gli argomenti degli strumenti nativi.
- Codex possiede la Compaction nativa. OpenClaw mantiene uno specchio della trascrizione per la cronologia
  del canale, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness, ma
  non sostituisce la Compaction di Codex con un riepilogatore OpenClaw o del motore di contesto.
- Generazione media, comprensione media, TTS, approvazioni e output degli strumenti di messaggistica
  continuano tramite le impostazioni OpenClaw di provider/modello corrispondenti.
- `tool_result_persist` si applica ai risultati degli strumenti nella trascrizione di proprietà di OpenClaw, non
  ai record di risultati degli strumenti nativi di Codex.

Per livelli hook, superfici V1 supportate, gestione nativa dei permessi, instradamento della coda,
meccaniche di caricamento feedback Codex e dettagli di compaction, consulta
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime).

## Risoluzione dei problemi

**Codex non appare come un normale provider `/model`:** questo è previsto per
le nuove configurazioni. Seleziona un modello `openai/gpt-*`, abilita
`plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude
`codex`.

**OpenClaw usa l'harness integrato invece di Codex:** assicurati che il riferimento modello sia
`openai/gpt-*` sul provider OpenAI ufficiale e che il plugin Codex sia
installato e abilitato. Se ti serve una prova rigorosa durante i test, imposta provider o
modello `agentRuntime.id: "codex"`. Un runtime Codex forzato fallisce invece di
ripiegare su OpenClaw.

**Il runtime OpenAI Codex ripiega sul percorso con chiave API:** raccogli un estratto redatto
del gateway che mostri modello, runtime, provider selezionato ed errore.
Chiedi ai collaboratori interessati di eseguire questo comando di sola lettura sul loro host OpenClaw:

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

Gli estratti utili di solito includono `openai/gpt-5.5` o `openai/gpt-5.4`,
`Runtime: OpenAI Codex`, `agentRuntime.id` o `harnessRuntime`,
`candidateProvider: "openai"` e un risultato `401`, `Incorrect API key` o
`No API key`. Un'esecuzione corretta dovrebbe mostrare il percorso OAuth OpenAI
invece di un semplice errore di chiave API OpenAI.

**La configurazione dei riferimenti modello Codex legacy rimane:** esegui `openclaw doctor --fix`.
Doctor riscrive i riferimenti modello legacy in `openai/*`, rimuove i pin runtime obsoleti di sessione e
dell'intero agent, e preserva gli override esistenti dei profili di autenticazione.

**L'app-server viene rifiutato:** usa Codex app-server `0.125.0` o più recente.
Prerelease della stessa versione o versioni con suffisso di build come
`0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché OpenClaw verifica la
soglia minima del protocollo stabile `0.125.0`.

**`/codex status` non riesce a connettersi:** controlla che il plugin `codex` incluso sia
abilitato, che `plugins.allow` lo includa quando è configurata una allowlist, e
che eventuali `appServer.command`, `url`, `authToken` o header personalizzati siano validi.

**Il rilevamento dei modelli è lento:** abbassa
`plugins.entries.codex.config.discovery.timeoutMs` o disabilita il rilevamento. Consulta
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference#model-discovery).

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`,
gli header e che l'app-server remoto parli la stessa versione del protocollo
app-server Codex.

**Gli strumenti shell o patch nativi sono bloccati con `Native hook relay unavailable`:**
il thread Codex sta ancora provando a usare un id relay di hook nativo che OpenClaw non
ha più registrato. Questo è un problema del trasporto hook nativo Codex, non un errore di backend
ACP, provider, GitHub o comando shell. Avvia una nuova sessione nella chat
interessata con `/new` o `/reset`, poi riprova un comando innocuo. Se questo
funziona una volta ma la successiva chiamata a uno strumento nativo fallisce di nuovo, tratta `/new` solo come soluzione temporanea:
copia il prompt in una nuova sessione dopo aver riavviato l'app-server Codex
o OpenClaw Gateway, così i vecchi thread vengono eliminati e le registrazioni degli hook
nativi vengono ricreate.

**Un modello non Codex usa l'harness integrato:** questo è previsto a meno che
la policy runtime del provider o del modello non lo instradi a un altro harness. I semplici riferimenti a provider non OpenAI
restano sul loro normale percorso provider in modalità `auto`.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla
`/codex computer-use status` da una nuova sessione. Se uno strumento segnala
`Native hook relay unavailable`, usa il ripristino del relay degli hook nativi sopra. Vedi
[Codex Computer Use](/it/plugins/codex-computer-use#troubleshooting).

## Correlati

- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Guida di OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin dell'harness agenti](/it/plugins/sdk-agent-harness)
- [Hook dei Plugin](/it/plugins/hooks)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Stato](/it/cli/status)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
