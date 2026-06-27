---
read_when:
    - Vuoi usare l’harness app-server Codex incluso
    - Ti servono esempi di configurazione dell'harness Codex
    - Vuoi che le distribuzioni solo Codex falliscano invece di ripiegare su OpenClaw
summary: Esegui i turni dell'agente integrato di OpenClaw tramite l'harness app-server Codex incluso
title: Harness di Codex
x-i18n:
    generated_at: "2026-06-27T17:48:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfa04f53d01aad16dd6ea499ea1c04b1050c80ed12326db6fb4fa88c9c40a68c
    source_path: plugins/codex-harness.md
    workflow: 16
---

Il Plugin `codex` in bundle consente a OpenClaw di eseguire turni agente OpenAI incorporati
tramite Codex app-server invece dell'harness OpenClaw integrato.

Usa l'harness Codex quando vuoi che Codex gestisca la sessione agente di basso livello:
ripresa nativa del thread, continuazione nativa degli strumenti, compaction nativa ed
esecuzione app-server. OpenClaw continua a gestire canali chat, file di sessione, selezione
del modello, strumenti dinamici OpenClaw, approvazioni, consegna dei media e il mirror visibile
della trascrizione.

La configurazione normale usa riferimenti canonici ai modelli OpenAI come `openai/gpt-5.5`.
Non configurare riferimenti GPT Codex legacy. Inserisci l'ordine di autenticazione agente OpenAI
sotto `auth.order.openai`; gli ID dei profili di autenticazione Codex legacy più vecchi e
le voci dell'ordine di autenticazione Codex legacy sono stato legacy riparato da
`openclaw doctor --fix`.

Quando nessuna sandbox OpenClaw è attiva, OpenClaw avvia thread Codex app-server
con la modalità codice nativa Codex abilitata lasciando code-mode-only disattivata per impostazione predefinita.
Questo mantiene disponibili l'area di lavoro nativa Codex e le capacità codice mentre
gli strumenti dinamici OpenClaw continuano attraverso il bridge app-server `item/tool/call`.
Il sandboxing OpenClaw attivo e le policy degli strumenti con restrizioni disabilitano completamente la modalità codice nativa,
a meno che tu non abiliti esplicitamente il percorso sperimentale sandbox exec-server.

Questa funzionalità nativa di Codex è separata da
[modalità codice OpenClaw](/it/reference/code-mode), che è un runtime QuickJS-WASI opt-in
per esecuzioni OpenClaw generiche con una forma di input `exec` diversa.

Per la separazione più ampia tra modello/provider/runtime, inizia da
[Runtime agente](/it/concepts/agent-runtimes). La versione breve è:
`openai/gpt-5.5` è il riferimento del modello, `codex` è il runtime e Telegram,
Discord, Slack o un altro canale resta la superficie di comunicazione.

## Requisiti

- OpenClaw con il Plugin `codex` in bundle disponibile.
- Se la tua configurazione usa `plugins.allow`, includi `codex`.
- Codex app-server `0.125.0` o più recente. Il Plugin in bundle gestisce per impostazione predefinita un binario
  Codex app-server compatibile, quindi i comandi locali `codex` in `PATH` non
  influiscono sul normale avvio dell'harness.
- Autenticazione Codex disponibile tramite `openclaw models auth login --provider openai`,
  un account app-server nella home Codex dell'agente, oppure un profilo di autenticazione Codex API-key
  esplicito.

Per precedenza dell'autenticazione, isolamento dell'ambiente, comandi app-server personalizzati, individuazione dei modelli
e tutti i campi di configurazione, vedi
[Riferimento harness Codex](/it/plugins/codex-harness-reference).

## Avvio rapido

La maggior parte degli utenti che vogliono Codex in OpenClaw vuole questo percorso: accedi con un
abbonamento ChatGPT/Codex, abilita il Plugin `codex` in bundle e usa un
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

Riavvia il gateway dopo aver cambiato la configurazione dei Plugin. Se una chat esistente
ha già una sessione, usa `/new` o `/reset` prima di testare le modifiche del runtime, così il turno
successivo risolverà l'harness dalla configurazione corrente.

## Configurazione

La configurazione dell'avvio rapido è la configurazione minima utilizzabile dell'harness Codex. Imposta le opzioni
dell'harness Codex nella configurazione OpenClaw e usa la CLI solo per l'autenticazione Codex:

| Necessità                              | Impostazione                                                                      | Dove                               |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| Abilitare l'harness                    | `plugins.entries.codex.enabled: true`                                            | Configurazione OpenClaw            |
| Mantenere un'installazione Plugin in allowlist | Includi `codex` in `plugins.allow`                                               | Configurazione OpenClaw            |
| Instradare i turni agente OpenAI tramite Codex | `agents.defaults.model` o `agents.list[].model` come `openai/gpt-*`              | Configurazione agente OpenClaw     |
| Accedere con ChatGPT/Codex OAuth       | `openclaw models auth login --provider openai`                                   | Profilo autenticazione CLI         |
| Aggiungere backup API-key per esecuzioni Codex | Profilo API-key `openai:*` elencato dopo l'autenticazione con abbonamento in `auth.order.openai` | Profilo autenticazione CLI + configurazione OpenClaw |
| Fallire chiuso quando Codex non è disponibile | Provider o modello `agentRuntime.id: "codex"`                                    | Configurazione modello/provider OpenClaw |
| Usare traffico diretto OpenAI API      | Provider o modello `agentRuntime.id: "openclaw"` con autenticazione OpenAI normale | Configurazione modello/provider OpenClaw |
| Regolare il comportamento app-server   | `plugins.entries.codex.config.appServer.*`                                       | Configurazione Plugin Codex        |
| Abilitare app Plugin Codex native      | `plugins.entries.codex.config.codexPlugins.*`                                    | Configurazione Plugin Codex        |
| Abilitare Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                                     | Configurazione Plugin Codex        |

Usa riferimenti modello `openai/gpt-*` per i turni agente OpenAI supportati da Codex. Preferisci
`auth.order.openai` per l'ordinamento prima abbonamento/backup API-key. Gli ID dei profili di autenticazione
Codex legacy esistenti e l'ordine di autenticazione Codex legacy sono stato legacy solo per doctor;
non scrivere nuovi riferimenti GPT Codex legacy.

Non impostare `compaction.model` o `compaction.provider` su agenti supportati da Codex.
Codex compatta tramite il proprio stato thread app-server nativo, quindi OpenClaw ignora
quegli override locali del riepilogatore a runtime e `openclaw doctor --fix` li rimuove
quando l'agente usa Codex.

Lossless resta supportato come motore di contesto per assemblaggio, ingestione e
manutenzione intorno ai turni Codex. Configuralo tramite
`plugins.slots.contextEngine: "lossless-claw"` e
`plugins.entries.lossless-claw.config.summaryModel`, non tramite
`agents.defaults.compaction.provider`. `openclaw doctor --fix` migra la vecchia
forma `compaction.provider: "lossless-claw"` nello slot motore di contesto Lossless
quando Codex è il runtime attivo, ma Codex nativo continua a gestire la Compaction.

L'harness nativo Codex app-server supporta motori di contesto che richiedono
assemblaggio pre-prompt. I backend CLI generici, incluso `codex-cli`, non forniscono
questa capacità host.

Per agenti supportati da Codex, `/compact` avvia la Compaction nativa Codex app-server sul
thread associato. OpenClaw non attende il completamento, non impone un timeout OpenClaw,
non riavvia l'app-server condiviso e non ripiega su un motore di contesto o su un
riepilogatore OpenAI pubblico. Se l'associazione del thread Codex nativo manca o è
obsoleta, il comando fallisce chiuso così l'operatore vede il reale confine del runtime
invece di cambiare silenziosamente backend di Compaction.

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
a semplici OpenAI Responses.

Il resto di questa pagina copre varianti comuni tra cui gli utenti devono scegliere:
forma di distribuzione, routing fail-closed, policy di approvazione guardian, Plugin Codex
nativi e Computer Use. Per elenchi completi di opzioni, valori predefiniti, enum, individuazione,
isolamento dell'ambiente, timeout e campi di trasporto app-server, vedi
[Riferimento harness Codex](/it/plugins/codex-harness-reference).

## Verificare il runtime Codex

Usa `/status` nella chat in cui ti aspetti Codex. Un turno agente OpenAI supportato da Codex
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
e Skills. `/codex models` elenca il catalogo live Codex app-server per
l'harness e l'account. Se `/status` è inatteso, vedi
[Risoluzione dei problemi](#troubleshooting).

## Routing e selezione del modello

Mantieni separati i riferimenti provider e la policy di runtime:

- Usa `openai/gpt-*` per i turni agente OpenAI tramite Codex.
- Non usare riferimenti GPT Codex legacy nella configurazione. Esegui `openclaw doctor --fix` per
  riparare riferimenti legacy e pin di route di sessione obsoleti.
- `agentRuntime.id: "codex"` è facoltativo per la normale modalità automatica OpenAI, ma utile
  quando una distribuzione deve fallire chiusa se Codex non è disponibile.
- `agentRuntime.id: "openclaw"` opta un provider o un modello nel runtime incorporato OpenClaw
  quando è intenzionale.
- `/codex ...` controlla conversazioni native Codex app-server dalla chat.
- ACP/acpx è un percorso di harness esterno separato. Usalo solo quando l'utente chiede
  ACP/acpx o un adattatore harness esterno.

Routing dei comandi comuni:

| Intento dell'utente                                  | Usa                                                                                                   |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Collegare la chat corrente                           | `/codex bind [--cwd <path>]`                                                                          |
| Riprendere un thread Codex esistente                 | `/codex resume <thread-id>`                                                                           |
| Elencare o filtrare thread Codex                     | `/codex threads [filter]`                                                                             |
| Elencare Plugin Codex nativi                         | `/codex plugins list`                                                                                 |
| Abilitare o disabilitare un Plugin Codex nativo configurato | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| Collegare una sessione Codex CLI esistente su un nodo abbinato | `/codex sessions --host <node> [filter]`, poi `/codex resume <session-id> --host <node> --bind here` |
| Inviare solo feedback Codex                          | `/codex diagnostics [note]`                                                                           |
| Avviare un'attività ACP/acpx                         | Comandi di sessione ACP/acpx, non `/codex`                                                           |

| Caso d'uso                                           | Configurazione                                                        | Verifica                                | Note                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------- | ------------------------------------- |
| Abbonamento ChatGPT/Codex con runtime Codex nativo   | `openai/gpt-*` più Plugin `codex` abilitato                            | `/status` mostra `Runtime: OpenAI Codex` | Percorso consigliato                  |
| Fallisci in modo chiuso se Codex non è disponibile   | Provider o modello `agentRuntime.id: "codex"`                          | Il turno fallisce invece del fallback incorporato | Da usare per distribuzioni solo Codex |
| Traffico diretto con chiave API OpenAI tramite OpenClaw | Provider o modello `agentRuntime.id: "openclaw"` e normale autenticazione OpenAI | `/status` mostra il runtime OpenClaw    | Da usare solo quando OpenClaw è intenzionale |
| Configurazione legacy                                | riferimenti GPT Codex legacy                                           | `openclaw doctor --fix` la riscrive     | Non scrivere nuove configurazioni in questo modo |
| Adattatore Codex ACP/acpx                            | ACP `sessions_spawn({ runtime: "acp" })`                               | Stato attività/sessione ACP             | Separato dall'harness Codex nativo    |

`agents.defaults.imageModel` segue la stessa suddivisione per prefisso. Usa `openai/gpt-*`
per il normale percorso OpenAI e `codex/gpt-*` solo quando la comprensione delle immagini
deve passare attraverso un turno delimitato del server dell'app Codex. Non usare
riferimenti GPT Codex legacy; doctor riscrive quel prefisso legacy in `openai/gpt-*`.

## Pattern di distribuzione

### Distribuzione Codex di base

Usa la configurazione quickstart quando tutti i turni dell'agente OpenAI devono usare Codex
per impostazione predefinita.

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

Con questa configurazione, l'agente `main` usa il suo normale percorso provider e l'agente
`codex` usa il server dell'app Codex.

### Distribuzione Codex con fallimento chiuso

Per i turni dell'agente OpenAI, `openai/gpt-*` viene già risolto in Codex quando il
Plugin in bundle è disponibile. Aggiungi una policy di runtime esplicita quando vuoi una
regola scritta di fallimento chiuso:

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

Con Codex forzato, OpenClaw fallisce in anticipo se il Plugin Codex è disabilitato, il
server dell'app è troppo vecchio o il server dell'app non riesce ad avviarsi.

## Policy del server dell'app

Per impostazione predefinita, il Plugin avvia localmente il binario Codex gestito da OpenClaw con trasporto stdio. Imposta `appServer.command` solo quando vuoi intenzionalmente eseguire un eseguibile diverso. Usa il trasporto WebSocket solo quando un server dell'app è già in esecuzione altrove:

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

Le sessioni locali del server dell'app stdio usano per impostazione predefinita la postura dell'operatore locale attendibile:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` e
`sandbox: "danger-full-access"`. Se i requisiti locali di Codex non consentono quella
postura YOLO implicita, OpenClaw seleziona invece le autorizzazioni guardian consentite.
Quando una sandbox OpenClaw è attiva per la sessione, OpenClaw disabilita Code Mode
nativo di Codex, i server MCP dell'utente e l'esecuzione di Plugin supportati dall'app per quel
turno, invece di fare affidamento sulla sandbox lato host di Codex. L'accesso alla shell è esposto
tramite strumenti dinamici supportati dalla sandbox OpenClaw, come `sandbox_exec` e
`sandbox_process`, quando i normali strumenti exec/process sono disponibili.

Usa la modalità exec normalizzata di OpenClaw quando vuoi l'auto-review nativa di Codex prima
di fughe dalla sandbox o autorizzazioni aggiuntive:

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

Per le sessioni del server dell'app Codex, OpenClaw mappa `tools.exec.mode: "auto"` alle approvazioni
revisionate da Guardian di Codex, di solito
`approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` e
`sandbox: "workspace-write"` quando i requisiti locali consentono questi valori.
In `tools.exec.mode: "auto"`, OpenClaw non preserva gli override legacy non sicuri di Codex
`approvalPolicy: "never"` o `sandbox: "danger-full-access"`; usa
`tools.exec.mode: "full"` per una postura Codex intenzionale senza approvazione. Il
preset legacy `plugins.entries.codex.config.appServer.mode: "guardian"` funziona ancora,
ma `tools.exec.mode: "auto"` è la superficie OpenClaw normalizzata.

Per il confronto a livello di modalità con le approvazioni exec dell'host e le autorizzazioni ACPX,
vedi [Modalità di autorizzazione](/it/tools/permission-modes).

Per ogni campo del server dell'app, ordine di autenticazione, isolamento dell'ambiente, discovery e
comportamento di timeout, vedi [Riferimento harness Codex](/it/plugins/codex-harness-reference).

## Comandi e diagnostica

Il Plugin in bundle registra `/codex` come comando slash su qualsiasi canale che
supporti i comandi di testo OpenClaw.

Forme comuni:

- `/codex status` verifica connettività del server dell'app, modelli, account, limiti di frequenza,
  server MCP e Skills.
- `/codex models` elenca i modelli live del server dell'app Codex.
- `/codex threads [filter]` elenca i thread recenti del server dell'app Codex.
- `/codex resume <thread-id>` collega la sessione OpenClaw corrente a un
  thread Codex esistente.
- `/codex compact` chiede al server dell'app Codex di compattare il thread collegato.
- `/codex review` avvia la review nativa di Codex per il thread collegato.
- `/codex diagnostics [note]` chiede conferma prima di inviare il feedback Codex per il
  thread collegato.
- `/codex account` mostra lo stato dell'account e dei limiti di frequenza.
- `/codex mcp` elenca lo stato dei server MCP del server dell'app Codex.
- `/codex skills` elenca le Skills del server dell'app Codex.

Per la maggior parte delle segnalazioni di supporto, inizia con `/diagnostics [note]` nella conversazione
in cui si è verificato il bug. Crea un report diagnostico Gateway e, per le sessioni
harness Codex, chiede l'approvazione per inviare il bundle di feedback Codex pertinente.
Vedi [Esportazione diagnostica](/it/gateway/diagnostics) per il modello di privacy e il comportamento
delle chat di gruppo.

Usa `/codex diagnostics [note]` solo quando vuoi specificamente il caricamento del feedback Codex
per il thread attualmente collegato senza il bundle diagnostico Gateway completo.

### Ispezionare i thread Codex localmente

Il modo più rapido per ispezionare una cattiva esecuzione Codex è spesso aprire direttamente il thread Codex
nativo:

```bash
codex resume <thread-id>
```

Ottieni l'id del thread dalla risposta `/diagnostics` completata, da `/codex binding` o da
`/codex threads [filter]`.

Per la meccanica di caricamento e i confini diagnostici a livello di runtime, vedi
[Runtime harness Codex](/it/plugins/codex-harness-runtime#codex-feedback-upload).

L'autenticazione viene selezionata in questo ordine:

1. Profili di autenticazione OpenAI ordinati per l'agente, preferibilmente sotto
   `auth.order.openai`. Esegui `openclaw doctor --fix` per migrare gli id dei profili di autenticazione
   Codex legacy più vecchi e l'ordine di autenticazione Codex legacy.
2. L'account esistente del server dell'app nella home Codex di quell'agente.
3. Solo per gli avvii locali del server dell'app stdio, `CODEX_API_KEY`, poi
   `OPENAI_API_KEY`, quando non è presente alcun account del server dell'app e l'autenticazione OpenAI è
   ancora richiesta.

Quando OpenClaw vede un profilo di autenticazione Codex in stile abbonamento ChatGPT, rimuove
`CODEX_API_KEY` e `OPENAI_API_KEY` dal processo figlio Codex generato. Questo
mantiene disponibili le chiavi API a livello Gateway per embeddings o modelli OpenAI diretti
senza far sì che i turni nativi del server dell'app Codex vengano fatturati accidentalmente tramite l'API.
I profili espliciti con chiave API Codex e il fallback locale stdio con chiave env usano il login del server dell'app
invece dell'env ereditato del processo figlio. Le connessioni WebSocket al server dell'app
non ricevono il fallback della chiave API env del Gateway; usa un profilo di autenticazione esplicito o l'account
proprio del server dell'app remoto.
Quando sono configurati Plugin Codex nativi, OpenClaw installa o aggiorna quei
Plugin tramite il server dell'app connesso prima di esporre le app possedute dal Plugin al
thread Codex. `app/list` rimane la fonte di verità per id app,
accessibilità e metadati, ma OpenClaw possiede la decisione di abilitazione per thread:
se la policy consente un'app accessibile elencata, OpenClaw invia
`thread/start.config.apps[appId].enabled = true` anche quando `app/list` al momento
segnala quell'app come disabilitata. Questo percorso non inventa installazioni di app per
id sconosciuti; OpenClaw attiva solo Plugin marketplace con `plugin/install`
e poi aggiorna l'inventario.

Se un profilo di abbonamento raggiunge un limite di utilizzo Codex, OpenClaw registra l'ora di reset
quando Codex ne segnala una e prova il profilo di autenticazione ordinato successivo per la stessa
esecuzione Codex. Quando l'ora di reset passa, il profilo di abbonamento torna idoneo
senza cambiare il modello `openai/gpt-*` selezionato o il runtime Codex.

Per gli avvii locali del server dell'app stdio, OpenClaw imposta `CODEX_HOME` su una directory
per agente, in modo che configurazione Codex, file di autenticazione/account, cache/dati dei Plugin e stato
dei thread nativi non leggano né scrivano per impostazione predefinita il `~/.codex` personale dell'operatore.
OpenClaw preserva il normale `HOME` del processo; i sottoprocessi eseguiti da Codex
possono ancora trovare configurazioni e token nella home utente, e Codex può scoprire voci condivise
`$HOME/.agents/skills` e `$HOME/.agents/plugins/marketplace.json`.

Se una distribuzione richiede ulteriore isolamento dell'ambiente, aggiungi quelle variabili a
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

`appServer.clearEnv` influisce solo sul processo figlio del server dell'app Codex generato.
OpenClaw rimuove `CODEX_HOME` e `HOME` da questo elenco durante la normalizzazione dell'avvio locale:
`CODEX_HOME` resta per agente e `HOME` resta ereditato affinché
i sottoprocessi possano usare il normale stato della home utente.

Gli strumenti dinamici di Codex usano per impostazione predefinita il caricamento `searchable`. OpenClaw non espone
strumenti dinamici che duplicano le operazioni dell'area di lavoro native di Codex: `read`, `write`,
`edit`, `apply_patch`, `exec`, `process` e `update_plan`. La maggior parte degli altri
strumenti di integrazione OpenClaw, come messaggistica, media, Cron, browser, nodi,
Gateway e `heartbeat_respond`, è disponibile tramite la ricerca strumenti di Codex sotto
lo spazio dei nomi `openclaw`, mantenendo più piccolo il contesto iniziale del modello. La ricerca web
usa per impostazione predefinita lo strumento ospitato `web_search` di Codex quando la ricerca è abilitata e non è
selezionato alcun provider gestito. La ricerca ospitata nativa e lo strumento dinamico gestito
`web_search` di OpenClaw si escludono a vicenda, così la ricerca gestita non può aggirare
le restrizioni di dominio native. OpenClaw usa lo strumento gestito quando la ricerca ospitata non è
disponibile, è disabilitata esplicitamente o è sostituita da un provider gestito selezionato.
OpenClaw mantiene disabilitata l'estensione standalone `web.run` di Codex perché
il traffico app-server di produzione rifiuta lo spazio dei nomi `web` definito dall'utente.
`tools.web.search.enabled: false` disabilita entrambi i percorsi, così come le esecuzioni solo LLM
con strumenti disabilitati. Codex tratta `"cached"` come una preferenza e la risolve in accesso
esterno live per i turni app-server senza restrizioni. Il fallback gestito automatico
fallisce in modo chiuso quando sono impostati `allowedDomains` nativi, così l'elenco consentiti non può essere
aggirato. Le modifiche persistenti effettive alla policy di ricerca ruotano il thread Codex
associato prima del turno successivo. Le restrizioni temporanee per singolo turno usano un thread
ristretto temporaneo e preservano l'associazione esistente per una ripresa successiva.
`sessions_yield` e le risposte di origine solo tramite strumenti di messaggistica restano dirette perché
sono contratti di controllo del turno. `sessions_spawn` resta ricercabile, così lo
`spawn_agent` nativo di Codex rimane la superficie principale per i subagent Codex, mentre la delega
esplicita OpenClaw o ACP resta disponibile tramite lo spazio dei nomi degli strumenti dinamici
`openclaw`. Le istruzioni di collaborazione Heartbeat indicano a Codex di cercare
`heartbeat_respond` prima di terminare un turno Heartbeat quando lo strumento non è già
caricato.

Imposta `codexDynamicToolsLoading: "direct"` solo quando ti connetti a un app-server Codex
personalizzato che non può cercare strumenti dinamici differiti o quando esegui il debug del payload
completo degli strumenti.

Campi Plugin Codex di primo livello supportati:

| Campo                      | Predefinito    | Significato                                                                              |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | Usa `"direct"` per inserire gli strumenti dinamici OpenClaw direttamente nel contesto iniziale degli strumenti Codex. |
| `codexDynamicToolsExclude` | `[]`           | Nomi aggiuntivi di strumenti dinamici OpenClaw da omettere dai turni app-server Codex.   |
| `codexPlugins`             | disabilitato   | Supporto nativo per Plugin/app Codex per Plugin curati installati da sorgente e migrati. |

Campi `appServer` supportati:

| Campo                                         | Valore predefinito                                    | Significato                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                             | `"stdio"` avvia Codex; `"websocket"` si connette a `url`.                                                                                                                                                                                                                                                                                                                                                                  |
| `command`                                     | binario Codex gestito                                | Eseguibile per il trasporto stdio. Lascialo non impostato per usare il binario gestito; impostalo solo per un override esplicito.                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`              | Argomenti per il trasporto stdio.                                                                                                                                                                                                                                                                                                                                                                                         |
| `url`                                         | non impostato                                         | URL WebSocket dell'app-server.                                                                                                                                                                                                                                                                                                                                                                                            |
| `authToken`                                   | non impostato                                         | Token Bearer per il trasporto WebSocket. Accetta una stringa letterale o SecretInput come `${CODEX_APP_SERVER_TOKEN}`.                                                                                                                                                                                                                                                                                                    |
| `headers`                                     | `{}`                                                  | Header WebSocket aggiuntivi. I valori degli header accettano stringhe letterali o valori SecretInput, per esempio `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                        |
| `clearEnv`                                    | `[]`                                                  | Nomi di variabili d'ambiente aggiuntive rimossi dal processo app-server stdio avviato dopo che OpenClaw ha costruito il suo ambiente ereditato. OpenClaw mantiene `CODEX_HOME` per agente e `HOME` ereditato per gli avvii locali.                                                                                                                                                                                        |
| `codeModeOnly`                                | `false`                                               | Attiva la superficie degli strumenti di Codex solo in modalità codice. Gli strumenti dinamici di OpenClaw restano registrati con Codex, così le chiamate `tools.*` annidate tornano attraverso il bridge `item/tool/call` dell'app-server.                                                                                                                                                                                |
| `remoteWorkspaceRoot`                         | non impostato                                         | Radice remota del workspace dell'app-server Codex. Quando è impostata, OpenClaw deduce la radice del workspace locale dal workspace OpenClaw risolto, conserva il suffisso cwd corrente sotto questa radice remota e invia a Codex solo la cwd finale dell'app-server. Se la cwd è fuori dalla radice del workspace OpenClaw risolta, OpenClaw fallisce in modo chiuso invece di inviare un percorso locale del gateway all'app-server remoto. |
| `requestTimeoutMs`                            | `60000`                                               | Timeout per le chiamate del piano di controllo dell'app-server.                                                                                                                                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                               | Finestra di quiete dopo che Codex accetta un turno o dopo una richiesta app-server con ambito di turno mentre OpenClaw attende `turn/completed`.                                                                                                                                                                                                                                                                            |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                              | Guardia di inattività sul completamento e sul progresso usata dopo un passaggio di consegne a uno strumento, un completamento di strumento nativo, un progresso grezzo dell'assistente post-strumento, un completamento grezzo del reasoning o un progresso del reasoning mentre OpenClaw attende `turn/completed`. Usala per carichi di lavoro fidati o pesanti in cui la sintesi post-strumento può legittimamente restare silenziosa più a lungo del budget finale di rilascio dell'assistente. |
| `mode`                                        | `"yolo"` salvo requisiti Codex locali che vietano YOLO | Preset per esecuzione YOLO o con revisione guardian. I requisiti stdio locali che omettono l'approvazione `danger-full-access`, `never` o il revisore `user` rendono guardian il valore predefinito implicito.                                                                                                                                                                                                              |
| `approvalPolicy`                              | `"never"` o una policy di approvazione guardian consentita | Policy di approvazione nativa di Codex inviata all'avvio/ripresa/turno del thread. I valori predefiniti guardian preferiscono `"on-request"` quando consentito.                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` o una sandbox guardian consentita | Modalità sandbox nativa di Codex inviata all'avvio/ripresa del thread. I valori predefiniti guardian preferiscono `"workspace-write"` quando consentito, altrimenti `"read-only"`. Quando è attiva una sandbox OpenClaw, i turni `danger-full-access` usano `workspace-write` di Codex con accesso di rete derivato dall'impostazione di egress della sandbox OpenClaw.                                                    |
| `approvalsReviewer`                           | `"user"` o un revisore guardian consentito            | Usa `"auto_review"` per lasciare che Codex esamini i prompt di approvazione nativi quando consentito, altrimenti `guardian_subagent` o `user`. `guardian_subagent` resta un alias legacy.                                                                                                                                                                                                                                  |
| `serviceTier`                                 | non impostato                                         | Tier di servizio opzionale dell'app-server Codex. `"priority"` abilita il routing in modalità rapida, `"flex"` richiede l'elaborazione flex, `null` cancella l'override e il legacy `"fast"` è accettato come `"priority"`.                                                                                                                                                                                                 |
| `networkProxy`                                | disabilitato                                          | Attiva il networking del profilo di permessi Codex per i comandi app-server. OpenClaw definisce la configurazione `permissions.<profile>.network` selezionata e la seleziona con `default_permissions` invece di inviare `sandbox`.                                                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                               | Opt-in di anteprima che registra un ambiente Codex supportato dalla sandbox OpenClaw con Codex app-server 0.132.0 o più recente, così l'esecuzione nativa di Codex può essere eseguita dentro la sandbox OpenClaw attiva.                                                                                                                                                                                                  |

`appServer.networkProxy` è esplicito perché cambia il contratto della sandbox
Codex. Quando è abilitato, OpenClaw imposta anche `features.network_proxy.enabled` e
`default_permissions` nella configurazione del thread Codex, così il profilo di
permessi generato può avviare il networking gestito da Codex. Per impostazione
predefinita, OpenClaw genera un nome di profilo resistente alle collisioni
`openclaw-network-<fingerprint>` dal corpo del profilo; usa `profileName` solo
quando è richiesto un nome locale stabile.

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

Se il runtime app-server normale sarebbe `danger-full-access`, abilitare
`networkProxy` usa un accesso al filesystem in stile workspace per il profilo di
permessi generato. L'applicazione gestita della rete da parte di Codex è networking
in sandbox, quindi un profilo con accesso completo non proteggerebbe il traffico
in uscita.
Le voci di dominio usano `allow` o `deny`; le voci di socket Unix usano i valori
`allow` o `none` di Codex.

Le chiamate a strumenti dinamici di proprietà di OpenClaw sono limitate indipendentemente da
`appServer.requestTimeoutMs`: le richieste Codex `item/tool/call` usano per impostazione predefinita un watchdog
OpenClaw di 90 secondi. Un argomento per chiamata positivo `timeoutMs` estende
o accorcia il budget di quello strumento specifico. Lo strumento `image_generate` usa
`agents.defaults.imageGenerationModel.timeoutMs` quando la chiamata allo strumento non
fornisce un proprio timeout, oppure altrimenti un valore predefinito di 120 secondi per la generazione di immagini.
Lo strumento `image` per la comprensione dei contenuti multimediali usa
`tools.media.image.timeoutSeconds` oppure il suo valore predefinito multimediale di 60 secondi. Per la
comprensione delle immagini, quel timeout si applica alla richiesta stessa e non viene
ridotto dal lavoro di preparazione precedente. I budget degli strumenti dinamici sono
limitati a 600000 ms. Al timeout, OpenClaw interrompe il segnale dello strumento
quando supportato e restituisce una risposta di strumento dinamico non riuscita a Codex, così il turno
può continuare invece di lasciare la sessione in `processing`.
Questo watchdog è il budget dinamico esterno `item/tool/call`; i timeout delle richieste
specifici del provider vengono eseguiti all'interno di quella chiamata e mantengono la propria semantica di timeout.

Dopo che Codex accetta un turno, e dopo che OpenClaw risponde a una richiesta
app-server con ambito di turno, l'harness si aspetta che Codex faccia avanzare il turno corrente e
alla fine completi il turno nativo con `turn/completed`. Se l'app-server rimane
silenzioso per `appServer.turnCompletionIdleTimeoutMs`, OpenClaw tenta al meglio di
interrompere il turno Codex, registra un timeout diagnostico e libera la corsia della
sessione OpenClaw in modo che i messaggi di chat successivi non vengano accodati dietro un turno
nativo obsoleto. La maggior parte delle notifiche non terminali per lo stesso turno disattiva quel breve
watchdog perché Codex ha dimostrato che il turno è ancora attivo. I passaggi di consegne degli strumenti usano un
budget di inattività post-strumento più lungo: dopo che OpenClaw restituisce una risposta
`item/tool/call`, dopo che elementi di strumenti nativi come `commandExecution` vengono completati, dopo i completamenti grezzi
`custom_tool_call_output`, e dopo l'avanzamento grezzo post-strumento dell'assistente,
i completamenti di ragionamento grezzi o l'avanzamento del ragionamento. La guardia usa
`appServer.postToolRawAssistantCompletionIdleTimeoutMs` quando configurato e
altrimenti usa come valore predefinito cinque minuti. Lo stesso budget post-strumento estende anche il
watchdog di avanzamento per la finestra di sintesi silenziosa prima che Codex emetta il prossimo
evento del turno corrente. Le notifiche globali dell'app-server, come gli aggiornamenti dei limiti di frequenza,
non azzerano l'avanzamento dell'inattività del turno. I completamenti di ragionamento, i completamenti
`agentMessage` di commento e l'avanzamento grezzo di ragionamento o dell'assistente pre-strumento possono
essere seguiti da una risposta finale automatica, quindi usano la guardia di risposta
post-avanzamento invece di liberare immediatamente la corsia della sessione. Solo gli elementi
`agentMessage` completati finali/non di commento e i completamenti grezzi
dell'assistente pre-strumento armano il rilascio dell'output dell'assistente: se Codex poi rimane silenzioso
senza `turn/completed`, OpenClaw tenta al meglio di interrompere il turno nativo e
libera la corsia della sessione. Gli errori stdio dell'app-server sicuri per la riproduzione, inclusi
i timeout di inattività del completamento del turno senza evidenza di assistente, strumento, elemento attivo o
effetti collaterali, vengono ritentati una volta su un nuovo tentativo dell'app-server. I timeout non sicuri
ritirano comunque il client app-server bloccato e liberano la corsia della sessione OpenClaw.
Inoltre cancellano l'associazione obsoleta del thread nativo invece di essere
riprodotti automaticamente. I timeout di osservazione del completamento mostrano testo di timeout specifico di Codex:
i casi sicuri per la riproduzione dicono che la risposta potrebbe essere incompleta, mentre i casi non sicuri
dicono all'utente di verificare lo stato corrente prima di riprovare. Le diagnostiche pubbliche dei timeout
includono campi strutturali come l'ultimo metodo di notifica dell'app-server,
l'id/tipo/ruolo dell'elemento di risposta grezzo dell'assistente, i conteggi di richieste/elementi attivi e lo
stato di osservazione armato. Quando l'ultima notifica è un elemento di risposta grezzo dell'assistente,
includono anche un'anteprima limitata del testo dell'assistente. Non includono prompt grezzi o
contenuti degli strumenti.

Gli override di ambiente rimangono disponibili per i test locali:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` ignora il binario gestito quando
`appServer.command` non è impostato.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` è stato rimosso. Usa invece
`plugins.entries.codex.config.appServer.mode: "guardian"`, oppure
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` per test locali una tantum. La configurazione è
preferita per distribuzioni ripetibili perché mantiene il comportamento del plugin nello
stesso file revisionato del resto della configurazione dell'harness Codex.

## Plugin Codex nativi

Il supporto dei plugin Codex nativi usa le capacità app e plugin proprie dell'app-server Codex
nello stesso thread Codex del turno dell'harness OpenClaw. OpenClaw
non traduce i plugin Codex in strumenti dinamici OpenClaw sintetici `codex_plugin_*`.

`codexPlugins` influisce solo sulle sessioni che selezionano l'harness Codex nativo. Non
ha effetto sulle esecuzioni dell'harness integrato, sulle normali esecuzioni del provider OpenAI, sulle associazioni di conversazione ACP
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
o sostituisce un'associazione obsoleta del thread Codex. Non viene ricalcolata a ogni turno.
Dopo aver modificato `codexPlugins`, usa `/new`, `/reset` oppure riavvia il gateway in modo che
le sessioni future dell'harness Codex partano con il set di app aggiornato.

Per l'idoneità alla migrazione, l'inventario delle app, la policy per le azioni distruttive,
le elicitazioni e la diagnostica dei plugin nativi, vedi
[Plugin Codex nativi](/it/plugins/codex-native-plugins).

L'accesso ad app e plugin lato OpenAI è controllato dall'account Codex connesso
e, per gli spazi di lavoro Business ed Enterprise/Edu, dai controlli delle app dello spazio di lavoro. Vedi
[Usare Codex con il tuo piano ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
per la panoramica di OpenAI sull'account e sui controlli dello spazio di lavoro.

## Uso del computer

L'uso del computer è trattato nella propria guida di configurazione:
[Uso del computer Codex](/it/plugins/codex-computer-use).

La versione breve: OpenClaw non include l'app di controllo del desktop né esegue
azioni desktop direttamente. Prepara l'app-server Codex, verifica che il server MCP
`computer-use` sia disponibile e poi lascia a Codex la proprietà delle chiamate agli strumenti MCP
nativi durante i turni in modalità Codex.

## Confini di runtime

L'harness Codex modifica solo l'esecutore dell'agente incorporato di basso livello.

- Gli strumenti dinamici OpenClaw sono supportati. Codex chiede a OpenClaw di eseguire quegli
  strumenti, quindi OpenClaw rimane nel percorso di esecuzione.
- Gli strumenti shell, patch, MCP e app nativi di Codex sono di proprietà di Codex.
  OpenClaw può osservare o bloccare eventi nativi selezionati tramite il relay
  supportato, ma non riscrive gli argomenti degli strumenti nativi.
- Codex possiede la compaction nativa. OpenClaw mantiene uno specchio della trascrizione per la cronologia
  del canale, la ricerca, `/new`, `/reset` e il futuro cambio di modello o harness, ma
  non sostituisce la compaction di Codex con un riepilogatore OpenClaw o del motore di contesto.
- Generazione multimediale, comprensione multimediale, TTS, approvazioni e output degli strumenti
  di messaggistica continuano attraverso le impostazioni provider/modello OpenClaw corrispondenti.
- `tool_result_persist` si applica ai risultati degli strumenti della trascrizione di proprietà di OpenClaw, non
  ai record dei risultati degli strumenti nativi di Codex.

Per i livelli di hook, le superfici V1 supportate, la gestione delle autorizzazioni native, l'indirizzamento
delle code, i meccanismi di caricamento del feedback Codex e i dettagli di compaction, vedi
[Runtime dell'harness Codex](/it/plugins/codex-harness-runtime).

## Risoluzione dei problemi

**Codex non appare come normale provider `/model`:** è previsto per le
nuove configurazioni. Seleziona un modello `openai/gpt-*`, abilita
`plugins.entries.codex.enabled` e controlla se `plugins.allow` esclude
`codex`.

**OpenClaw usa l'harness integrato invece di Codex:** assicurati che il riferimento del modello sia
`openai/gpt-*` sul provider OpenAI ufficiale e che il plugin Codex sia
installato e abilitato. Se ti serve una prova rigorosa durante i test, imposta
`agentRuntime.id: "codex"` sul provider o sul modello. Un runtime Codex forzato fallisce invece di
ripiegare su OpenClaw.

**Il runtime OpenAI Codex ripiega sul percorso con chiave API:** raccogli un estratto
redatto del gateway che mostri modello, runtime, provider selezionato ed errore.
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
`No API key`. Un'esecuzione corretta dovrebbe mostrare il percorso OAuth di OpenAI
invece di un semplice errore di chiave API OpenAI.

**La configurazione dei riferimenti modello Codex legacy rimane:** esegui `openclaw doctor --fix`.
Doctor riscrive i riferimenti modello legacy in `openai/*`, rimuove pin di runtime obsoleti della sessione e
dell'intero agente e preserva gli override esistenti dei profili di autenticazione.

**L'app-server viene rifiutato:** usa l'app-server Codex `0.125.0` o più recente.
Le prerelease della stessa versione o le versioni con suffisso di build, come
`0.125.0-alpha.2` o `0.125.0+custom`, vengono rifiutate perché OpenClaw verifica il
minimo stabile del protocollo `0.125.0`.

**`/codex status` non riesce a connettersi:** controlla che il plugin `codex` incluso sia
abilitato, che `plugins.allow` lo includa quando è configurata una allowlist e
che eventuali `appServer.command`, `url`, `authToken` o header personalizzati siano validi.

**La scoperta dei modelli è lenta:** abbassa
`plugins.entries.codex.config.discovery.timeoutMs` oppure disabilita la scoperta. Vedi
[Riferimento dell'harness Codex](/it/plugins/codex-harness-reference#model-discovery).

**Il trasporto WebSocket fallisce immediatamente:** controlla `appServer.url`, `authToken`,
gli header e che l'app-server remoto parli la stessa versione del protocollo
app-server Codex.

**Gli strumenti shell o patch nativi sono bloccati con `Native hook relay unavailable`:**
il thread Codex sta ancora tentando di usare un id relay di hook nativo che OpenClaw non
ha più registrato. Questo è un problema del trasporto degli hook nativi Codex, non un errore del backend
ACP, del provider, di GitHub o di un comando shell. Avvia una nuova sessione nella
chat interessata con `/new` o `/reset`, poi riprova un comando innocuo. Se funziona
una volta ma la chiamata successiva allo strumento nativo fallisce di nuovo, considera `/new` solo come soluzione temporanea:
copia il prompt in una nuova sessione dopo aver riavviato l'app-server Codex
o il Gateway OpenClaw, in modo che i vecchi thread vengano eliminati e le registrazioni degli hook
nativi vengano ricreate.

**Un modello non Codex usa l'harness integrato:** è previsto, a meno che
la policy di runtime del provider o del modello non lo indirizzi a un altro harness. I normali riferimenti a provider non OpenAI
rimangono sul loro percorso provider normale in modalità `auto`.

**Computer Use è installato ma gli strumenti non vengono eseguiti:** controlla
`/codex computer-use status` da una nuova sessione. Se uno strumento segnala
`Native hook relay unavailable`, usa il recupero del relay degli hook nativi indicato sopra. Vedi
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
- [Plugin di harness degli agenti](/it/plugins/sdk-agent-harness)
- [Hook dei Plugin](/it/plugins/hooks)
- [Esportazione diagnostica](/it/gateway/diagnostics)
- [Stato](/it/cli/status)
- [Test](/it/help/testing-live#live-codex-app-server-harness-smoke)
