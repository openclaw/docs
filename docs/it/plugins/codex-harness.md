---
read_when:
    - Vuoi usare l'harness app-server Codex incluso
    - Ti servono esempi di configurazione dell'harness Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su OpenClaw
summary: Esegui i turni dell'agente integrato OpenClaw tramite l'harness app-server Codex incluso
title: Harness di Codex
x-i18n:
    generated_at: "2026-07-04T10:45:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1cf51f87f1ccaab2611926ea6bdba73f53de9a88b44da2395eb5f4c147da188
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` incluso consente a OpenClaw di eseguire turni agent OpenAI incorporati
tramite Codex app-server invece dell'harness OpenClaw integrato.

Usa l'harness Codex quando vuoi che Codex possieda la sessione agent di basso livello:
ripresa nativa del thread, continuazione nativa degli strumenti, compaction nativa ed
esecuzione app-server. OpenClaw possiede ancora canali chat, file di sessione, selezione
del modello, strumenti dinamici OpenClaw, approvazioni, consegna dei media e lo specchio
visibile della trascrizione.

La configurazione normale usa riferimenti canonici ai modelli OpenAI come `openai/gpt-5.5`.
Non configurare riferimenti GPT Codex legacy. Inserisci l'ordine di autenticazione agent OpenAI
in `auth.order.openai`; gli ID profilo di autenticazione Codex legacy più vecchi e
le voci dell'ordine di autenticazione Codex legacy sono stato legacy riparato da
`openclaw doctor --fix`.

Quando non è attiva alcuna sandbox OpenClaw, OpenClaw avvia thread Codex app-server
con la modalità codice nativa Codex abilitata, lasciando al contempo la modalità solo codice disattivata per impostazione predefinita.
Questo mantiene disponibili lo spazio di lavoro nativo Codex e le capacità di codice mentre
gli strumenti dinamici OpenClaw continuano tramite il bridge app-server `item/tool/call`.
La sandboxing OpenClaw attiva e le policy strumenti restrittive disabilitano completamente la modalità codice nativa,
a meno che tu non scelga esplicitamente il percorso sperimentale sandbox exec-server.

Questa funzionalità nativa Codex è separata da
[modalità codice OpenClaw](/it/reference/code-mode), che è un runtime QuickJS-WASI opzionale
per esecuzioni OpenClaw generiche con una forma di input `exec` diversa.

Per la separazione più ampia tra modello/provider/runtime, inizia da
[Runtime agent](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento al modello, `codex` è il runtime, e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Requisiti

- OpenClaw con il Plugin `codex` incluso disponibile.
- Se la tua configurazione usa `plugins.allow`, includi `codex`.
- Codex app-server `0.125.0` o più recente. Il Plugin incluso gestisce per impostazione predefinita
  un binario Codex app-server compatibile, quindi i comandi locali `codex` su `PATH` non
  influenzano l'avvio normale dell'harness.
- Autenticazione Codex disponibile tramite `openclaw models auth login --provider openai`,
  un account app-server nella home Codex dell'agent o un profilo di autenticazione esplicito
  con chiave API Codex.

Per precedenza dell'autenticazione, isolamento dell'ambiente, comandi app-server personalizzati, discovery dei modelli
e tutti i campi di configurazione, consulta
[riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Avvio rapido

La maggior parte degli utenti che vuole Codex in OpenClaw vuole questo percorso: accedere con un
abbonamento ChatGPT/Codex, abilitare il Plugin `codex` incluso e usare un
riferimento canonico al modello `openai/gpt-*`.

Accedi con Codex OAuth:

```bash
openclaw models auth login --provider openai
```

Abilita il Plugin `codex` incluso e seleziona un modello agent OpenAI:

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

Se la tua configurazione usa `plugins.allow`, aggiungi anche `codex` lì:

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

Riavvia il Gateway dopo aver cambiato la configurazione del Plugin. Se una chat esistente
ha già una sessione, usa `/new` o `/reset` prima di testare modifiche al runtime, così il turno
successivo risolve l'harness dalla configurazione corrente.

## Condividere thread con Codex Desktop e CLI

Il valore predefinito `appServer.homeScope: "agent"` mantiene ogni agent OpenClaw isolato
dallo stato Codex nativo dell'operatore. Per consentire a un owner di chiedere a OpenClaw di ispezionare
e gestire gli stessi thread nativi mostrati da Codex Desktop e dalla CLI Codex,
scegli esplicitamente la home Codex dell'utente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

La modalità home utente è disponibile solo con trasporto stdio locale. Usa
`$CODEX_HOME` quando impostato e `~/.codex` altrimenti, inclusi autenticazione,
configurazione, Plugin e archivio thread Codex nativi di quella home. OpenClaw non inietta un
profilo di autenticazione OpenClaw in questo app-server.

I turni dell'owner ottengono lo strumento `codex_threads`. Può elencare, cercare, leggere, creare fork,
rinominare, archiviare e ripristinare thread nativi. Chiedi all'agent di creare il fork di un thread quando
vuoi continuarlo in OpenClaw; il fork viene collegato alla sessione OpenClaw corrente
e resta visibile ad altri client Codex nativi. L'archiviazione richiede conferma esplicita
che il thread sia chiuso altrove.

Non riprendere o scrivere lo stesso thread contemporaneamente da OpenClaw e da un altro
client Codex. Codex coordina scrittori live all'interno di un solo processo app-server, non
tra processi Desktop, CLI e OpenClaw indipendenti. Creare un fork genera una
continuazione separata ed è il percorso di coesistenza sicuro.

## Configurazione

La configurazione di avvio rapido è la configurazione minima praticabile dell'harness Codex. Imposta le opzioni
dell'harness Codex nella configurazione OpenClaw e usa la CLI solo per l'autenticazione Codex:

| Necessità                              | Imposta                                                                          | Dove                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Abilitare l'harness                    | `plugins.entries.codex.enabled: true`                                            | Configurazione OpenClaw            |
| Mantenere un'installazione Plugin in allowlist | Includi `codex` in `plugins.allow`                                      | Configurazione OpenClaw            |
| Instradare i turni agent OpenAI tramite Codex | `agents.defaults.model` o `agents.list[].model` come `openai/gpt-*`       | Configurazione agent OpenClaw      |
| Accedere con ChatGPT/Codex OAuth       | `openclaw models auth login --provider openai`                                   | Profilo di autenticazione CLI      |
| Aggiungere backup con chiave API per esecuzioni Codex | profilo chiave API `openai:*` elencato dopo l'autenticazione dell'abbonamento in `auth.order.openai` | Profilo di autenticazione CLI + configurazione OpenClaw |
| Fallire in modo chiuso quando Codex non è disponibile | `agentRuntime.id: "codex"` del provider o del modello                    | Configurazione modello/provider OpenClaw |
| Usare traffico API OpenAI diretto      | `agentRuntime.id: "openclaw"` del provider o del modello con autenticazione OpenAI normale | Configurazione modello/provider OpenClaw |
| Regolare il comportamento app-server   | `plugins.entries.codex.config.appServer.*`                                       | Configurazione del Plugin Codex    |
| Abilitare app Plugin Codex native      | `plugins.entries.codex.config.codexPlugins.*`                                    | Configurazione del Plugin Codex    |
| Abilitare Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configurazione del Plugin Codex    |

Usa riferimenti modello `openai/gpt-*` per i turni agent OpenAI supportati da Codex. Preferisci
`auth.order.openai` per l'ordinamento prima abbonamento/backup con chiave API. Gli ID profilo
di autenticazione Codex legacy esistenti e l'ordine di autenticazione Codex legacy sono stato
legacy solo per doctor; non scrivere nuovi riferimenti GPT Codex legacy.

Non impostare `compaction.model` o `compaction.provider` su agent supportati da Codex.
Codex esegue la compaction tramite il proprio stato thread app-server nativo, quindi OpenClaw ignora
queste sovrascritture locali del summarizer a runtime e `openclaw doctor --fix` le rimuove
quando l'agent usa Codex.

Lossless resta supportato come motore di contesto per assemblaggio, ingestione e
manutenzione intorno ai turni Codex. Configuralo tramite
`plugins.slots.contextEngine: "lossless-claw"` e
`plugins.entries.lossless-claw.config.summaryModel`, non tramite
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la vecchia
forma `compaction.provider: "lossless-claw"` allo slot del motore di contesto Lossless
quando Codex è il runtime attivo, ma Codex nativo possiede comunque la compaction.

L'harness app-server Codex nativo supporta motori di contesto che richiedono
assemblaggio pre-prompt. I backend CLI generici, incluso `codex-cli`, non forniscono
quella capacità host.

Per gli agent supportati da Codex, `/compact` avvia la compaction nativa Codex app-server sul
thread associato. OpenClaw non attende il completamento, non impone un timeout OpenClaw,
non riavvia l'app-server condiviso e non ripiega su un motore di contesto o su un
summarizer OpenAI pubblico. Se l'associazione al thread Codex nativo è mancante o
obsoleta, il comando fallisce in modo chiuso così l'operatore vede il vero confine del runtime
invece di cambiare silenziosamente backend di compaction.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

In quella forma, entrambi i profili passano comunque tramite Codex per i turni agent
`openai/gpt-*`. La chiave API è solo un fallback di autenticazione, non una richiesta di passare a OpenClaw o
a semplici OpenAI Responses.

Il resto di questa pagina copre varianti comuni tra cui gli utenti devono scegliere:
forma di deployment, routing fail-closed, policy di approvazione guardian, Plugin Codex
nativi e Computer Use. Per elenchi completi delle opzioni, valori predefiniti, enum, discovery,
isolamento dell'ambiente, timeout e campi di trasporto app-server, consulta
[riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Verificare il runtime Codex

Usa `/status` nella chat in cui ti aspetti Codex. Un turno agent OpenAI supportato da Codex
mostra:

```text
Runtime: OpenAI Codex
```

Poi controlla lo stato di Codex app-server:

```text
/codex status
/codex models
```

`/codex status` riporta connettività app-server, account, limiti di frequenza, server MCP
e skills. `/codex models` elenca il catalogo live Codex app-server per
l'harness e l'account. Se `/status` sorprende, consulta
[Risoluzione dei problemi](#troubleshooting).

## Routing e selezione del modello

Mantieni separati riferimenti provider e policy runtime:

- Usa `openai/gpt-*` per i turni agent OpenAI tramite Codex.
- Non usare riferimenti GPT Codex legacy nella configurazione. Esegui `openclaw doctor --fix` per
  riparare riferimenti legacy e pin di route di sessione obsoleti.
- `agentRuntime.id: "codex"` è opzionale per la normale modalità automatica OpenAI, ma utile
  quando un deployment deve fallire in modo chiuso se Codex non è disponibile.
- `agentRuntime.id: "openclaw"` opta un provider o modello nel runtime incorporato OpenClaw
  quando è intenzionale.
- `/codex ...` controlla conversazioni native Codex app-server dalla chat.
- ACP/acpx è un percorso di harness esterno separato. Usalo solo quando l'utente chiede
  ACP/acpx o un adattatore di harness esterno.

Routing comune dei comandi:

| Intento dell'utente                                  | Uso                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Allegare la chat corrente                            | `/codex bind [--cwd <path>]`                                                                          |
| Riprendere un thread Codex esistente                 | `/codex resume <thread-id>`                                                                           |
| Elencare o filtrare i thread Codex                   | `/codex threads [filter]`                                                                             |
| Elencare i Plugin Codex nativi                       | `/codex plugins list`                                                                                 |
| Abilitare o disabilitare un Plugin Codex nativo configurato | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Allegare una sessione Codex CLI esistente su un nodo associato | `/codex sessions --host <node> [filter]`, poi `/codex resume <session-id> --host <node> --bind here` |
| Inviare solo feedback Codex                          | `/codex diagnostics [note]`                                                                           |
| Avviare un'attivita ACP/acpx                         | Comandi di sessione ACP/acpx, non `/codex`                                                           |

| Caso d'uso                                           | Configurazione                                                         | Verifica                                | Note                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-*` piu Plugin `codex` abilitato                            | `/status` mostra `Runtime: OpenAI Codex` | Percorso consigliato                  |
| Fallire in modo chiuso se Codex non e disponibile    | Provider o modello `agentRuntime.id: "codex"`                          | Il turno fallisce invece del fallback incorporato | Usa per distribuzioni solo Codex      |
| Instradare il traffico con chiave API OpenAI diretta tramite OpenClaw | Provider o modello `agentRuntime.id: "openclaw"` e normale autenticazione OpenAI | `/status` mostra il runtime OpenClaw    | Usa solo quando OpenClaw e intenzionale |
| Configurazione legacy                                | riferimenti GPT Codex legacy                                           | `openclaw doctor --fix` la riscrive     | Non scrivere nuova configurazione in questo modo |
| Adattatore Codex ACP/acpx                            | ACP `sessions_spawn({ runtime: "acp" })`                               | Stato attivita/sessione ACP             | Separato dall'harness Codex nativo    |

`agents.defaults.imageModel` segue la stessa suddivisione per prefisso. Usa `openai/gpt-*`
per il normale percorso OpenAI e `codex/gpt-*` solo quando la comprensione delle immagini
deve passare attraverso un turno delimitato del server applicativo Codex. Non usare
riferimenti GPT Codex legacy; doctor riscrive quel prefisso legacy in `openai/gpt-*`.

## Schemi di distribuzione

### Distribuzione Codex di base

Usa la configurazione quickstart quando tutti i turni degli agenti OpenAI devono usare Codex per
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

Questa forma mantiene Claude come agente predefinito e aggiunge un agente Codex denominato:

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

Con questa configurazione, l'agente `main` usa il suo normale percorso provider e
l'agente `codex` usa il server applicativo Codex.

### Distribuzione Codex con fallimento chiuso

Per i turni degli agenti OpenAI, `openai/gpt-*` si risolve gia in Codex quando il
Plugin in bundle e disponibile. Aggiungi una policy runtime esplicita quando vuoi una regola
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

Con Codex forzato, OpenClaw fallisce in anticipo se il Plugin Codex e disabilitato, il
server applicativo e troppo vecchio o il server applicativo non puo avviarsi.

## Policy del server applicativo

Per impostazione predefinita, il Plugin avvia localmente il binario Codex gestito da OpenClaw con trasporto
stdio. Imposta `appServer.command` solo quando vuoi intenzionalmente eseguire un
eseguibile diverso. Usa il trasporto WebSocket solo quando un server applicativo e gia
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

Le sessioni del server applicativo stdio locale usano per impostazione predefinita la postura dell'operatore locale attendibile:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se i requisiti locali di Codex non consentono quella
postura implicita senza approvazioni, OpenClaw seleziona invece le autorizzazioni guardian consentite.
Quando una sandbox OpenClaw e attiva per la sessione, OpenClaw disabilita la Code Mode
nativa di Codex, i server MCP dell'utente e l'esecuzione di Plugin supportata dall'app per quel
turno, invece di affidarsi al sandboxing lato host di Codex. L'accesso alla shell e esposto
tramite strumenti dinamici supportati dalla sandbox OpenClaw come `sandbox_exec` e
`sandbox_process` quando i normali strumenti exec/process sono disponibili.

Usa la modalita exec normalizzata di OpenClaw quando vuoi l'auto-review nativa di Codex prima
delle evasioni dalla sandbox o di autorizzazioni aggiuntive:

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

Per le sessioni del server applicativo Codex, OpenClaw mappa `tools.exec.mode: "auto"` alle approvazioni
esaminate da Guardian di Codex, in genere
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando i requisiti locali consentono quei valori.
In `tools.exec.mode: "auto"`, OpenClaw non preserva override Codex legacy non sicuri
`approvalPolicy: "never"` o `sandbox: "danger-full-access"`; usa
`tools.exec.mode: "full"` per una postura Codex intenzionale senza approvazioni. Il
preset legacy `plugins.entries.codex.config.appServer.mode: "guardian"` funziona ancora,
ma `tools.exec.mode: "auto"` e la superficie OpenClaw normalizzata.

Per il confronto a livello di modalita con le approvazioni exec dell'host e le autorizzazioni ACPX,
vedi [Modalita di autorizzazione](/it/tools/permission-modes).

Per ogni campo del server applicativo, ordine di autenticazione, isolamento dell'ambiente, discovery e
comportamento di timeout, vedi [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference).

## Comandi e diagnostica

Il Plugin in bundle registra `/codex` come comando slash su qualsiasi canale che
supporti i comandi testuali OpenClaw.

L'esecuzione e il controllo nativi richiedono un proprietario o un client Gateway
`operator.admin`. Questo include associare o riprendere thread, inviare o interrompere turni,
cambiare modello, modalita rapida o stato delle autorizzazioni, compattare o rivedere e
scollegare un'associazione. Gli altri mittenti autorizzati mantengono comandi di sola lettura per stato, aiuto,
account, modello, thread, server MCP, skill e ispezione delle associazioni.

Forme comuni:

- `/codex status` controlla connettivita del server applicativo, modelli, account, limiti di frequenza,
  server MCP e Skills.
- `/codex models` elenca i modelli live del server applicativo Codex.
- `/codex threads [filter]` elenca i thread recenti del server applicativo Codex.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un
  thread Codex esistente.
- `/codex compact` chiede al server applicativo Codex di compattare il thread collegato.
- `/codex review` avvia la review nativa Codex per il thread collegato.
- `/codex diagnostics [note]` chiede prima di inviare feedback Codex per il
  thread collegato.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP del server applicativo Codex.
- `/codex skills` elenca le Skills del server applicativo Codex.

Per la maggior parte delle segnalazioni di supporto, inizia con `/diagnostics [note]` nella conversazione
in cui si e verificato il bug. Crea un report diagnostico Gateway e, per le sessioni
dell'harness Codex, chiede approvazione per inviare il bundle di feedback Codex pertinente.
Vedi [Esportazione diagnostica](/it/gateway/diagnostics) per il modello di privacy e il comportamento nelle
chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del feedback
Codex per il thread attualmente collegato senza il bundle diagnostico Gateway completo.

### Ispezionare localmente i thread Codex

Il modo piu rapido per ispezionare un'esecuzione Codex errata e spesso aprire direttamente il thread
Codex nativo:

```bash
codex resume <thread-id>
```

Ottieni l'ID del thread dalla risposta `/diagnostics` completata, da `/codex binding` o da
`/codex threads [filter]`.

Per la meccanica di caricamento e i limiti diagnostici a livello runtime, vedi
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime#codex-feedback-upload).

Nella home predefinita per agente, l'autenticazione viene selezionata in questo ordine:

1. Profili di autenticazione OpenAI ordinati per l'agente, preferibilmente sotto
   `auth.order.openai`. Esegui `openclaw doctor --fix` per migrare gli ID profilo
   di autenticazione Codex legacy precedenti e l'ordine di autenticazione Codex legacy.
2. L'account esistente del server applicativo nella home Codex di quell'agente.
3. Solo per avvii locali del server applicativo stdio, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non e presente alcun account del server applicativo e l'autenticazione OpenAI e
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene disponibili le chiavi API a livello Gateway per embedding o modelli OpenAI diretti
senza far fatturare accidentalmente i turni nativi del server applicativo Codex tramite l'API.
I profili Codex espliciti con chiave API e il fallback locale con chiave env stdio usano il login
del server applicativo invece dell'env ereditato dal processo figlio. Le connessioni WebSocket al server applicativo
non ricevono fallback della chiave API env Gateway; usa un profilo di autenticazione esplicito o
l'account proprio del server applicativo remoto.
Quando sono configurati Plugin Codex nativi, OpenClaw installa o aggiorna quei
Plugin tramite il server applicativo connesso prima di esporre al thread Codex le app di proprieta del Plugin.
`app/list` rimane la fonte di verita per ID app,
accessibilita e metadati, ma OpenClaw possiede la decisione di abilitazione per thread:
se la policy consente un'app accessibile elencata, OpenClaw invia
`thread/start.config.apps[appId].enabled = true` anche quando `app/list` attualmente
segnala quell'app come disabilitata. Questo percorso non inventa installazioni di app per
ID sconosciuti; OpenClaw attiva solo Plugin del marketplace con `plugin/install`
e poi aggiorna l'inventario.

Se un profilo di abbonamento raggiunge un limite di utilizzo Codex, OpenClaw registra l'ora di reset
quando Codex ne segnala una e prova il successivo profilo di autenticazione ordinato per la stessa
esecuzione Codex. Quando l'ora di reset passa, il profilo di abbonamento torna idoneo
senza modificare il modello `openai/gpt-*` selezionato o il runtime Codex.

Per gli avvii locali del server applicativo stdio, OpenClaw imposta `CODEX_HOME` su una directory per agente, così la configurazione di Codex, i file di autenticazione/account, la cache/i dati dei plugin e lo stato dei thread nativi non leggono né scrivono nella `~/.codex` personale dell'operatore per impostazione predefinita. OpenClaw preserva il normale `HOME` del processo; i sottoprocessi eseguiti da Codex possono comunque trovare la configurazione e i token nella home dell'utente, e Codex può individuare le voci condivise di `$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`. Con `appServer.homeScope: "user"`, OpenClaw usa invece la home Codex nativa dell'utente e il suo account esistente senza iniettare un profilo di autenticazione OpenClaw.

Se un deployment richiede un isolamento aggiuntivo dell'ambiente, aggiungi tali variabili a `appServer.clearEnv`:

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

`appServer.clearEnv` influisce solo sul processo figlio del server applicativo Codex generato. OpenClaw rimuove `CODEX_HOME` e `HOME` da questo elenco durante la normalizzazione dell'avvio locale: `CODEX_HOME` resta puntato all'ambito agente o utente selezionato, e `HOME` resta ereditato così i sottoprocessi possono usare il normale stato della home utente.

Gli strumenti dinamici di Codex usano per impostazione predefinita il caricamento `searchable`. OpenClaw non espone strumenti dinamici che duplicano le operazioni native di Codex sull'area di lavoro: `read`, `write`, `edit`, `apply_patch`, `exec`, `process` e `update_plan`. La maggior parte degli strumenti di integrazione OpenClaw rimanenti, come messaggistica, media, cron, browser, nodi, gateway e `heartbeat_respond`, è disponibile tramite la ricerca strumenti di Codex sotto il namespace `openclaw`, mantenendo più contenuto il contesto iniziale del modello. La ricerca web usa per impostazione predefinita lo strumento ospitato `web_search` di Codex quando la ricerca è abilitata e non è selezionato alcun provider gestito. La ricerca ospitata nativa e lo strumento dinamico `web_search` gestito da OpenClaw sono mutuamente esclusivi, così la ricerca gestita non può aggirare le restrizioni native sui domini. OpenClaw usa lo strumento gestito quando la ricerca ospitata non è disponibile, è esplicitamente disabilitata o è sostituita da un provider gestito selezionato. OpenClaw mantiene disabilitata l'estensione autonoma `web.run` di Codex perché il traffico del server applicativo di produzione rifiuta il suo namespace `web` definito dall'utente. `tools.web.search.enabled: false` disabilita entrambi i percorsi, così come le esecuzioni solo LLM con strumenti disabilitati. Codex tratta `"cached"` come una preferenza e la risolve in accesso esterno live per i turni del server applicativo senza restrizioni. Il fallback gestito automatico fallisce in modo chiuso quando sono impostati `allowedDomains` nativi, così l'allowlist non può essere aggirata. Le modifiche persistenti alla policy di ricerca effettiva ruotano il thread Codex associato prima del turno successivo. Le restrizioni transitorie per turno usano un thread temporaneo limitato e preservano il binding esistente per una successiva ripresa. `sessions_yield` e le risposte sorgente solo tramite strumento di messaggistica restano dirette perché sono contratti di controllo del turno. `sessions_spawn` resta ricercabile affinché `spawn_agent` nativo di Codex rimanga la superficie primaria per subagent Codex, mentre la delega esplicita OpenClaw o ACP resta disponibile tramite il namespace degli strumenti dinamici `openclaw`. Le istruzioni di collaborazione Heartbeat indicano a Codex di cercare `heartbeat_respond` prima di terminare un turno Heartbeat quando lo strumento non è già caricato.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un server applicativo Codex personalizzato che non può cercare strumenti dinamici differiti o quando esegui il debug del payload completo degli strumenti.

Campi Plugin Codex di primo livello supportati:

| Campo                      | Predefinito    | Significato                                                                              |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` per inserire gli strumenti dinamici OpenClaw direttamente nel contesto strumenti Codex iniziale. |
| `codexDynamicToolsExclude` | `[]`           | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni del server applicativo Codex. |
| `codexPlugins`             | disabilitato   | Supporto nativo Plugin/app Codex per plugin curati migrati installati da sorgente.       |

Campi `appServer` supportati:

| Campo                                         | Predefinito                                            | Significato                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                                                                                       |
| `homeScope`                                   | `"agent"`                                              | `"agent"` isola lo stato di Codex per ogni agente OpenClaw. `"user"` condivide il `$CODEX_HOME` nativo o `~/.codex`, usa l'autenticazione nativa e abilita la gestione dei thread riservata al proprietario. L'ambito utente richiede stdio.                                                                                                                                                    |
| `command`                                     | binario Codex gestito                                  | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per un override esplicito.                                                                                                                                                                                                                                                               |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                               |
| `url`                                         | non impostato                                          | URL dell'app-server WebSocket.                                                                                                                                                                                                                                                                                                                                                                  |
| `authToken`                                   | non impostato                                          | Token Bearer per il trasporto WebSocket. Accetta una stringa letterale o un SecretInput come `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                       |
| `headers`                                     | `{}`                                                   | Header WebSocket aggiuntivi. I valori degli header accettano stringhe letterali o valori SecretInput, per esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | Nomi di variabili d'ambiente aggiuntive rimossi dal processo app-server stdio avviato dopo che OpenClaw ha costruito il suo ambiente ereditato. OpenClaw mantiene il `CODEX_HOME` selezionato e il `HOME` ereditato per gli avvii locali.                                                                                                                                                       |
| `codeModeOnly`                                | `false`                                                | Abilita esplicitamente la superficie degli strumenti solo in modalità codice di Codex. Gli strumenti dinamici di OpenClaw restano registrati con Codex, così le chiamate annidate `tools.*` ritornano tramite il bridge `item/tool/call` dell'app-server.                                                                                                                                        |
| `remoteWorkspaceRoot`                         | non impostato                                          | Radice remota del workspace dell'app-server Codex. Quando è impostata, OpenClaw deduce la radice locale del workspace dal workspace OpenClaw risolto, preserva il suffisso della cwd corrente sotto questa radice remota e invia a Codex solo la cwd finale dell'app-server. Se la cwd è fuori dalla radice del workspace OpenClaw risolta, OpenClaw rifiuta l'operazione invece di inviare un percorso locale del Gateway all'app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                                | Timeout per le chiamate del piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                 |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Finestra di inattività dopo che Codex accetta un turno o dopo una richiesta app-server con ambito di turno mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | Guardia di inattività del completamento e avanzamento usata dopo un passaggio a uno strumento, il completamento di uno strumento nativo, l'avanzamento grezzo dell'assistente post-strumento, il completamento del ragionamento grezzo o l'avanzamento del ragionamento mentre OpenClaw attende `turn/completed`. Usala per carichi di lavoro attendibili o pesanti in cui la sintesi post-strumento può legittimamente restare silenziosa più a lungo del budget finale di rilascio dell'assistente. |
| `mode`                                        | `"yolo"` salvo requisiti locali di Codex che non consentano YOLO | Preset per esecuzione YOLO o revisionata dal guardian. I requisiti stdio locali che omettono `danger-full-access`, approvazione `never` o il revisore `user` rendono guardian il valore predefinito implicito.                                                                                                                                                                                   |
| `approvalPolicy`                              | `"never"` o una policy di approvazione guardian consentita | Policy di approvazione nativa di Codex inviata ad avvio/ripresa/turno del thread. I valori predefiniti guardian preferiscono `"on-request"` quando consentito.                                                                                                                                                                                                                                  |
| `sandbox`                                     | `"danger-full-access"` o una sandbox guardian consentita | Modalità sandbox nativa di Codex inviata ad avvio/ripresa del thread. I valori predefiniti guardian preferiscono `"workspace-write"` quando consentito, altrimenti `"read-only"`. Quando una sandbox OpenClaw è attiva, i turni `danger-full-access` usano `workspace-write` di Codex con accesso di rete derivato dall'impostazione di egress della sandbox OpenClaw.                           |
| `approvalsReviewer`                           | `"user"` o un revisore guardian consentito             | Usa `"auto_review"` per lasciare che Codex revisioni i prompt di approvazione nativi quando consentito, altrimenti `guardian_subagent` o `user`. `guardian_subagent` resta un alias legacy.                                                                                                                                                                                                     |
| `serviceTier`                                 | non impostato                                          | Livello di servizio opzionale dell'app-server Codex. `"priority"` abilita il routing fast-mode, `"flex"` richiede l'elaborazione flex, `null` cancella l'override e il valore legacy `"fast"` è accettato come `"priority"`.                                                                                                                                                                    |
| `networkProxy`                                | disabilitato                                           | Abilita esplicitamente il networking del profilo di autorizzazioni Codex per i comandi dell'app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la seleziona con `default_permissions` invece di inviare `sandbox`.                                                                                                                                  |
| `experimental.sandboxExecServer`              | `false`                                                | Opt-in di anteprima che registra un ambiente Codex supportato dalla sandbox OpenClaw con Codex app-server 0.132.0 o successivo, così l'esecuzione nativa di Codex può essere eseguita dentro la sandbox OpenClaw attiva.                                                                                                                                                                        |

`appServer.networkProxy` è esplicito perché modifica il contratto della sandbox
Codex. Quando è abilitato, OpenClaw imposta anche `features.network_proxy.enabled` e
`default_permissions` nella configurazione del thread Codex, così il profilo di
autorizzazioni generato può avviare il networking gestito da Codex. Per impostazione
predefinita, OpenClaw genera un nome profilo `openclaw-network-<fingerprint>`
resistente alle collisioni dal corpo del profilo; usa `profileName` solo quando è
richiesto un nome locale stabile.

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
Le voci di dominio usano `allow` o `deny`; le voci di socket Unix usano i valori
`allow` o `none` di Codex.

Le chiamate agli strumenti dinamici di proprietà di OpenClaw sono limitate in modo indipendente da
`appServer.requestTimeoutMs`: le richieste Codex `item/tool/call` usano per impostazione predefinita un watchdog OpenClaw di 90 secondi. Un argomento positivo `timeoutMs` per chiamata estende
o accorcia il budget di quello specifico strumento. Lo strumento `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` quando la chiamata allo strumento non
fornisce un proprio timeout, oppure altrimenti un valore predefinito di generazione immagini di 120 secondi.
Lo strumento `image` per la comprensione dei media usa
`tools.media.image.timeoutSeconds` oppure il suo valore predefinito per i media di 60 secondi. Per la comprensione delle immagini, quel timeout si applica alla richiesta stessa e non viene
ridotto dal lavoro di preparazione precedente. I budget degli strumenti dinamici sono
limitati a 600000 ms. In caso di timeout, OpenClaw interrompe il segnale dello strumento
dove supportato e restituisce una risposta di strumento dinamico non riuscita a Codex, così il turno
può continuare invece di lasciare la sessione in `processing`.
Questo watchdog è il budget esterno dinamico di `item/tool/call`; i timeout di richiesta specifici del provider
vengono eseguiti all'interno di quella chiamata e mantengono la propria semantica di timeout.

Dopo che Codex accetta un turno, e dopo che OpenClaw risponde a una richiesta
app-server con ambito di turno, l'harness si aspetta che Codex faccia progressi nel turno corrente e
alla fine termini il turno nativo con `turn/completed`. Se l'app-server resta
silenzioso per `appServer.turnCompletionIdleTimeoutMs`, OpenClaw interrompe al meglio
il turno Codex, registra un timeout diagnostico e libera la corsia della sessione
OpenClaw, così i messaggi di chat successivi non restano in coda dietro un turno nativo
stale. La maggior parte delle notifiche non terminali per lo stesso turno disarma quel breve
watchdog perché Codex ha dimostrato che il turno è ancora attivo. I passaggi di consegne degli strumenti usano un
budget di inattività post-strumento più lungo: dopo che OpenClaw restituisce una risposta
`item/tool/call`, dopo che elementi di strumenti nativi come `commandExecution` vengono completati, dopo completamenti grezzi
`custom_tool_call_output`, e dopo progressi grezzi post-strumento dell'assistente,
completamenti di reasoning o progressi di reasoning. La guardia usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e
altrimenti usa come valore predefinito cinque minuti. Lo stesso budget post-strumento estende anche il
watchdog di avanzamento per la finestra di sintesi silenziosa prima che Codex emetta il prossimo
evento del turno corrente. Le notifiche globali dell'app-server, come gli aggiornamenti dei limiti di frequenza,
non reimpostano l'avanzamento di inattività del turno. I completamenti di reasoning, i completamenti
`agentMessage` di commento e i progressi grezzi di reasoning o assistente pre-strumento possono
essere seguiti da una risposta finale automatica, quindi usano la guardia di risposta post-avanzamento
invece di liberare immediatamente la corsia della sessione. Solo gli elementi `agentMessage`
completati finali/non di commento e i completamenti grezzi dell'assistente pre-strumento
armano il rilascio dell'output dell'assistente: se Codex poi resta silenzioso
senza `turn/completed`, OpenClaw interrompe al meglio il turno nativo e
libera la corsia della sessione. Se un altro controllo del turno vince quella gara di rilascio,
OpenClaw accetta comunque l'elemento finale completato dell'assistente una volta che nessuna
richiesta nativa, elemento o completamento di strumento dinamico resta attivo e il
rilascio dell'output dell'assistente appartiene ancora all'ultimo elemento completato, senza
completamenti di elementi successivi. Questo può preservare la risposta finale dopo il lavoro completato degli strumenti
senza riprodurre il turno. Delta parziali dell'assistente, risposte precedenti stale
e completamenti successivi vuoti non sono idonei. I guasti app-server stdio sicuri per la riproduzione,
inclusi i timeout di inattività di completamento del turno senza prove di assistente, strumento, elemento attivo
o effetto collaterale, vengono ritentati una volta su un nuovo tentativo app-server. I timeout non sicuri
ritirano comunque il client app-server bloccato e liberano la corsia della sessione OpenClaw.
Cancellano anche il binding stale del thread nativo invece di essere
riprodotti automaticamente. I timeout di controllo del completamento mostrano testo di timeout specifico di Codex:
i casi sicuri per la riproduzione dicono che la risposta potrebbe essere incompleta, mentre i casi non sicuri
dicono all'utente di verificare lo stato corrente prima di riprovare. Le diagnosi pubbliche di timeout
includono campi strutturali come l'ultimo metodo di notifica app-server,
l'id/tipo/ruolo dell'elemento di risposta grezza dell'assistente, conteggi di richieste/elementi attivi e stato
di controllo armato. Quando l'ultima notifica è un elemento di risposta grezza dell'assistente, includono
anche un'anteprima limitata del testo dell'assistente. Non includono prompt grezzi o
contenuto degli strumenti.

Gli override di ambiente restano disponibili per i test locali:

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

Il supporto dei plugin Codex nativi usa le capacità app e plugin proprie del Codex app-server
nello stesso thread Codex del turno dell'harness OpenClaw. OpenClaw
non traduce i plugin Codex in strumenti dinamici OpenClaw sintetici
`codex_plugin_*`.

`codexPlugins` influisce solo sulle sessioni che selezionano l'harness Codex nativo. Non
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

La configurazione dell'app del thread viene calcolata quando OpenClaw stabilisce una sessione dell'harness Codex
o sostituisce un binding stale del thread Codex. Non viene ricalcolata a ogni turno.
Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` o riavvia il gateway, così
le future sessioni dell'harness Codex partono con il set di app aggiornato.

Per idoneità alla migrazione, inventario delle app, policy per azioni distruttive,
elicitazioni e diagnostica dei plugin nativi, consulta
[Plugin Codex nativi](/it/plugins/codex-native-plugins).

L'accesso ad app e plugin lato OpenAI è controllato dall'account Codex connesso
e, per workspace Business ed Enterprise/Edu, dai controlli app del workspace. Consulta
[Usare Codex con il tuo piano ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
per la panoramica di OpenAI su account e controlli del workspace.

## Computer Use

Computer Use è trattato nella propria guida di configurazione:
[Codex Computer Use](/it/plugins/codex-computer-use).

La versione breve: OpenClaw non include come vendor l'app di controllo desktop né esegue
azioni desktop direttamente. Prepara Codex app-server, verifica che il server MCP
`computer-use` sia disponibile e poi lascia che Codex gestisca le chiamate agli strumenti MCP
nativi durante i turni in modalità Codex.

## Confini di runtime

L'harness Codex modifica solo l'esecutore dell'agente embedded di basso livello.

- Gli strumenti dinamici OpenClaw sono supportati. Codex chiede a OpenClaw di eseguire quegli
  strumenti, quindi OpenClaw resta nel percorso di esecuzione.
- Shell, patch, MCP e strumenti app nativi di Codex sono di proprietà di Codex.
  OpenClaw può osservare o bloccare eventi nativi selezionati tramite il relay
  supportato, ma non riscrive gli argomenti degli strumenti nativi.
- Codex possiede la Compaction nativa. OpenClaw mantiene un mirror della trascrizione per la cronologia
  dei canali, la ricerca, `/new`, `/reset` e futuri cambi di modello o harness, ma
  non sostituisce la Compaction di Codex con un riepilogatore OpenClaw o del motore di contesto.
- Generazione media, comprensione media, TTS, approvazioni e output degli strumenti di messaggistica
  continuano attraverso le impostazioni del provider/modello OpenClaw corrispondenti.
- `tool_result_persist` si applica ai risultati degli strumenti della trascrizione di proprietà di OpenClaw, non
  ai record di risultati degli strumenti nativi Codex.

Per livelli di hook, superfici V1 supportate, gestione dei permessi nativi, indirizzamento
della coda, meccanismi di caricamento feedback Codex e dettagli di Compaction, consulta
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime).

## Risoluzione dei problemi

**Codex non appare come normale provider `/model`:** è previsto per
le nuove configurazioni. Seleziona un modello `openai/gpt-*`, abilita
`plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude
`codex`.

**OpenClaw usa l'harness integrato invece di Codex:** assicurati che il riferimento del modello sia
`openai/gpt-*` sul provider OpenAI ufficiale e che il plugin Codex sia
installato e abilitato. Se ti serve una prova rigorosa durante i test, imposta
`agentRuntime.id: "codex"` sul provider o sul modello. Un runtime Codex forzato fallisce invece di
fare fallback a OpenClaw.

**Il runtime OpenAI Codex fa fallback al percorso con chiave API:** raccogli un estratto redatto
del gateway che mostri modello, runtime, provider selezionato e guasto.
Chiedi ai collaboratori interessati di eseguire questo comando in sola lettura sul loro host OpenClaw:

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
invece di un semplice guasto della chiave API OpenAI.

**La configurazione dei riferimenti ai modelli Codex legacy rimane:** esegui `openclaw doctor --fix`.
Doctor riscrive i riferimenti ai modelli legacy in `openai/*`, rimuove i pin stale di sessione e
runtime dell'intero agente, e preserva gli override dei profili di autenticazione esistenti.

**L'app-server viene rifiutato:** usa Codex app-server `0.125.0` o versione successiva.
Prerelease della stessa versione o versioni con suffisso di build come
`0.125.0-alpha.2` o `0.125.0+custom` vengono rifiutate perché OpenClaw verifica il
minimo stabile del protocollo `0.125.0`.

**`/codex status` non riesce a connettersi:** controlla che il plugin `codex` incluso sia
abilitato, che `plugins.allow` lo includa quando è configurata una allowlist, e
che eventuali `appServer.command`, `url`, `authToken` o header personalizzati siano validi.

**La scoperta dei modelli è lenta:** abbassa
`plugins.entries.codex.config.discovery.timeoutMs` o disabilita la scoperta. Consulta
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference#model-discovery).

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`,
gli header e che l'app-server remoto parli la stessa versione del protocollo Codex app-server.

**Gli strumenti shell nativi o patch sono bloccati con `Native hook relay unavailable`:**
il thread Codex sta ancora tentando di usare un id di relay hook nativo che OpenClaw non
ha piu registrato. Questo e un problema del trasporto hook nativo di Codex, non un errore
del backend ACP, del provider, di GitHub o di un comando shell. Avvia una nuova sessione
nella chat interessata con `/new` o `/reset`, poi riprova un comando innocuo. Se funziona
una volta ma la chiamata successiva a uno strumento nativo fallisce di nuovo, considera
`/new` solo come una soluzione temporanea: copia il prompt in una nuova sessione dopo aver
riavviato l'app-server Codex o il Gateway OpenClaw, cosi i vecchi thread vengono eliminati
e le registrazioni degli hook nativi vengono ricreate.

**Un modello non Codex usa l'harness integrato:** e previsto, a meno che
la policy di runtime del provider o del modello non lo indirizzi a un altro harness. I
riferimenti provider non OpenAI semplici restano sul loro normale percorso provider in modalita `auto`.

**Computer Use e installato ma gli strumenti non vengono eseguiti:** controlla
`/codex computer-use status` da una nuova sessione. Se uno strumento segnala
`Native hook relay unavailable`, usa il ripristino del relay hook nativo indicato sopra. Vedi
[Codex Computer Use](/it/plugins/codex-computer-use#troubleshooting).

## Correlati

- [Riferimento dell'harness Codex](/it/plugins/codex-harness-reference)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime)
- [Plugin Codex nativi](/it/plugins/codex-native-plugins)
- [Codex Computer Use](/it/plugins/codex-computer-use)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Provider di modelli](/it/concepts/model-providers)
- [Provider OpenAI](/it/providers/openai)
- [Guida OpenAI Codex](https://help.openai.com/en/collections/14937394-codex)
- [Plugin harness per agenti](/it/plugins/sdk-agent-harness)
- [Hook dei Plugin](/it/plugins/hooks)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Stato](/it/cli/status)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
