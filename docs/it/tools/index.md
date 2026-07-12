---
doc-schema-version: 1
read_when:
    - Vuoi capire quali strumenti offre OpenClaw
    - Stai scegliendo tra strumenti integrati, Skills e Plugin
    - Hai bisogno del punto di accesso corretto alla documentazione per i criteri degli strumenti, l'automazione o il coordinamento degli agenti
summary: 'Panoramica di strumenti, Skills e Plugin di OpenClaw: cosa possono richiamare gli agenti e come estenderli'
title: Panoramica
x-i18n:
    generated_at: "2026-07-12T07:33:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Usa questa pagina per scegliere la superficie di funzionalità corretta. Gli **strumenti** sono
azioni richiamabili, le **Skills** insegnano agli agenti come operare e i **Plugin** aggiungono
funzionalità di runtime quali strumenti, provider, canali, hook e Skills
distribuite come pacchetti.

Questa è una pagina introduttiva e di orientamento. Per informazioni complete su criteri degli strumenti, impostazioni predefinite,
appartenenza ai gruppi, restrizioni dei provider e campi di configurazione, consulta
[Strumenti e provider personalizzati](/it/gateway/config-tools).

## Da qui

Per la maggior parte degli agenti, inizia con le categorie di strumenti integrate, quindi modifica i criteri
solo quando l'agente deve visualizzare meno strumenti o necessita di accesso esplicito all'host.

| Se devi...                                           | Usa prima questo                                      | Quindi consulta                                                                                                            |
| ---------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Consentire a un agente di usare le funzionalità esistenti | [Strumenti integrati](#built-in-tool-categories)      | [Categorie di strumenti](#built-in-tool-categories)                                                                        |
| Controllare ciò che un agente può richiamare         | [Criteri degli strumenti](#configure-access-and-approvals) | [Strumenti e provider personalizzati](/it/gateway/config-tools)                                                          |
| Insegnare un flusso di lavoro a un agente            | [Skills](#choose-tools-skills-or-plugins)             | [Skills](/it/tools/skills), [Creazione di Skills](/it/tools/creating-skills) e [Laboratorio delle Skills](/it/tools/skill-workshop) |
| Aggiungere una nuova integrazione o superficie di runtime | [Plugin](#extend-capabilities)                    | [Plugin](/it/tools/plugin) e [Creazione di Plugin](/it/plugins/building-plugins)                                                  |
| Eseguire attività in seguito o in background         | [Automazione](/it/automation)                            | [Panoramica dell'automazione](/it/automation)                                                                                  |
| Coordinare più agenti o infrastrutture di esecuzione | [Sottoagenti](/it/tools/subagents)                       | [Agenti ACP](/it/tools/acp-agents) e [Invio dell'agente](/it/tools/agent-send)                                                    |
| Cercare in un ampio catalogo di strumenti OpenClaw   | [Ricerca strumenti](/it/tools/tool-search)               | [Ricerca strumenti](/it/tools/tool-search)                                                                                     |

## Scegliere strumenti, Skills o Plugin

<Steps>
  <Step title="Usa uno strumento quando l'agente deve agire">
    Uno strumento è una funzione tipizzata che l'agente può richiamare, come `exec`, `browser`,
    `web_search`, `message` o `image_generate`. Usa gli strumenti quando l'agente
    deve leggere dati, modificare file, inviare messaggi, richiamare un provider o
    utilizzare un altro sistema. Gli strumenti visibili vengono inviati al modello come definizioni
    di funzione strutturate.

    Il modello vede solo gli strumenti che superano il profilo attivo, i criteri di autorizzazione/blocco,
    le restrizioni del provider, lo stato della sandbox, le autorizzazioni del canale e
    la disponibilità dei Plugin.

  </Step>

  <Step title="Usa una Skill quando l'agente necessita di istruzioni">
    Una Skill è un pacchetto di istruzioni `SKILL.md` caricato nel prompt dell'agente. Usa
    una Skill quando l'agente dispone già degli strumenti necessari, ma necessita di un
    flusso di lavoro ripetibile, criteri di revisione, una sequenza di comandi o un vincolo
    operativo.

    Le Skills possono trovarsi in uno spazio di lavoro, in una directory condivisa delle Skills, nella radice
    gestita delle Skills di OpenClaw o nel pacchetto di un Plugin.

    [Skills](/it/tools/skills) | [Laboratorio delle Skills](/it/tools/skill-workshop) | [Creazione di Skills](/it/tools/creating-skills) | [Configurazione delle Skills](/it/tools/skills-config)

  </Step>

  <Step title="Usa un Plugin quando OpenClaw necessita di una nuova funzionalità">
    Un Plugin può aggiungere strumenti, Skills, canali, provider di modelli, sintesi vocale,
    voce in tempo reale, generazione di contenuti multimediali, ricerca web, recupero web, hook e altre
    funzionalità di runtime. Usa un Plugin quando la funzionalità include codice,
    credenziali, hook del ciclo di vita, metadati del manifesto o un pacchetto
    installabile. I Plugin esistenti possono essere installati da ClawHub, npm, git,
    directory locali o archivi.

    [Installare e configurare i Plugin](/it/tools/plugin) | [Creare Plugin](/it/plugins/building-plugins) | [SDK dei Plugin](/it/plugins/sdk-overview)

  </Step>
</Steps>

## Categorie di strumenti integrate

La tabella elenca strumenti rappresentativi per consentirti di riconoscere la superficie. Non è
il riferimento completo dei criteri. Per gruppi esatti, impostazioni predefinite e semantica di autorizzazione/blocco,
consulta [Strumenti e provider personalizzati](/it/gateway/config-tools).

| Categoria                 | Da usare quando l'agente deve...                                                  | Strumenti rappresentativi                                                                              | Consulta anche                                                                                     |
| ------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Runtime                   | Eseguire comandi, gestire processi o usare analisi Python supportate da un provider | `exec`, `process`, `code_execution`                                                                    | [Exec](/it/tools/exec), [Esecuzione del codice](/it/tools/code-execution)                                |
| File                      | Leggere e modificare i file dello spazio di lavoro                                | `read`, `write`, `edit`, `apply_patch`                                                                 | [Applicazione delle patch](/it/tools/apply-patch)                                                     |
| Web                       | Cercare sul web, cercare post su X o recuperare contenuti leggibili dalle pagine  | `web_search`, `x_search`, `web_fetch`                                                                  | [Strumenti web](/it/tools/web), [Recupero web](/it/tools/web-fetch)                                      |
| Browser                   | Utilizzare una sessione del browser                                                | `browser`                                                                                              | [Browser](/it/tools/browser)                                                                          |
| Messaggistica e canali    | Inviare risposte o azioni del canale                                               | `message`                                                                                              | [Invio dell'agente](/it/tools/agent-send)                                                             |
| Sessioni e agenti         | Esaminare sessioni, delegare attività, dirigere un'altra esecuzione o segnalare lo stato | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Obiettivo](/it/tools/goal), [Sottoagenti](/it/tools/subagents), [Strumento di sessione](/it/concepts/session-tool) |
| Automazione               | Pianificare attività o rispondere a eventi in background                          | `cron`, `heartbeat_respond`                                                                            | [Automazione](/it/automation)                                                                         |
| Gateway e nodi            | Esaminare lo stato del Gateway o i dispositivi di destinazione associati          | `gateway`, `nodes`                                                                                     | [Configurazione del Gateway](/it/gateway/configuration), [Nodi](/it/nodes)                               |
| Contenuti multimediali    | Analizzare, generare o riprodurre vocalmente contenuti multimediali                | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                   | [Panoramica dei contenuti multimediali](/it/tools/media-overview)                                     |
| Ampi cataloghi OpenClaw   | Cercare e richiamare molti strumenti idonei senza inviare ogni schema al modello   | `tool_search_code`, `tool_search`, `tool_describe`                                                     | [Ricerca strumenti](/it/tools/tool-search)                                                            |

<Note>
La Ricerca strumenti è una superficie sperimentale per gli agenti OpenClaw. Le esecuzioni dell'infrastruttura Codex usano
la modalità codice nativa di Codex, la ricerca strumenti nativa, gli strumenti dinamici differiti e
le chiamate di strumenti annidate invece di `tools.toolSearch`.
</Note>

## Strumenti forniti dai Plugin

I Plugin possono registrare strumenti aggiuntivi. Gli autori dei Plugin collegano gli strumenti tramite
`api.registerTool(...)` e `contracts.tools` del manifesto; consulta
[SDK dei Plugin](/it/plugins/sdk-overview) e [Manifesto dei Plugin](/it/plugins/manifest)
per i dettagli dei contratti.

Gli strumenti comunemente forniti dai Plugin includono:

- [Differenze](/it/tools/diffs) per rappresentare le differenze tra file e Markdown
- [Visualizzazione widget](/tools/show-widget) per SVG e HTML autonomi incorporati nella chat web
- [Attività LLM](/it/tools/llm-task) per passaggi del flusso di lavoro esclusivamente JSON
- [Lobster](/it/tools/lobster) per flussi di lavoro tipizzati con approvazioni ripristinabili
- [Tokenjuice](/it/tools/tokenjuice) per compattare l'output prolisso degli strumenti `exec` e `bash`
- [Ricerca strumenti](/it/tools/tool-search) per individuare e richiamare ampi cataloghi di strumenti
  senza inserire ogni schema nel prompt
- [Canvas](/it/plugins/reference/canvas) per il controllo di Canvas sui nodi e la rappresentazione
  A2UI

## Configurare accesso e approvazioni

I criteri degli strumenti vengono applicati prima della chiamata al modello. Se i criteri rimuovono uno strumento, il
modello non riceve lo schema di tale strumento per il turno. Un'esecuzione può perdere strumenti
a causa della configurazione globale, della configurazione per agente, dei criteri del canale, delle restrizioni
del provider, delle regole della sandbox, dei criteri del canale/runtime o della disponibilità dei Plugin.

- [Strumenti e provider personalizzati](/it/gateway/config-tools) documenta i profili degli strumenti,
  gli elenchi di autorizzazione/blocco, le restrizioni specifiche dei provider, il rilevamento dei cicli e
  le impostazioni degli strumenti supportati dai provider.
- [Approvazioni di Exec](/it/tools/exec-approvals) documenta i criteri di approvazione dei comandi
  dell'host.
- [Exec con privilegi elevati](/it/tools/elevated) documenta l'esecuzione controllata al di fuori della
  sandbox.
- [Sandbox, criteri degli strumenti ed esecuzione con privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
  spiega quale livello controlla l'accesso ai file e ai processi.
- [Sandbox per agente e restrizioni degli strumenti](/it/tools/multi-agent-sandbox-tools)
  documenta le restrizioni specifiche dell'agente per le esecuzioni delegate.

## Estendere le funzionalità

Scegli il percorso di estensione in base all'attività che OpenClaw deve svolgere:

- Installa o gestisci un Plugin esistente con [Plugin](/it/tools/plugin).
- Crea una nuova integrazione, un provider, un canale, uno strumento o un hook con
  [Creazione di Plugin](/it/plugins/building-plugins).
- Aggiungi o perfeziona istruzioni riutilizzabili per gli agenti con [Skills](/it/tools/skills) e
  [Creazione di Skills](/it/tools/creating-skills).
- Usa [SDK dei Plugin](/it/plugins/sdk-overview) e
  [Manifesto dei Plugin](/it/plugins/manifest) quando necessiti dei contratti
  di implementazione.

## Risolvere i problemi relativi agli strumenti mancanti

Se il modello non può vedere o richiamare uno strumento, inizia dai criteri effettivi per
il turno corrente:

1. Controlla il profilo attivo, `tools.allow` e `tools.deny` in
   [Strumenti e provider personalizzati](/it/gateway/config-tools).
2. Controlla le restrizioni specifiche del provider in
   [Strumenti e provider personalizzati](/it/gateway/config-tools) e verifica che il
   [provider del modello](/it/concepts/model-providers) selezionato supporti la struttura dello strumento.
3. Controlla le autorizzazioni del canale, lo stato della sandbox e l'accesso con privilegi elevati tramite
   [Sandbox, criteri degli strumenti ed esecuzione con privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated)
   ed [Exec con privilegi elevati](/it/tools/elevated).
4. Controlla se il Plugin proprietario è installato e abilitato in
   [Plugin](/it/tools/plugin).
5. Per le esecuzioni delegate, controlla le restrizioni per agente in
   [Sandbox per agente e restrizioni degli strumenti](/it/tools/multi-agent-sandbox-tools).
6. Per gli ampi cataloghi OpenClaw, verifica se l'esecuzione usa l'esposizione diretta degli strumenti
   o la [Ricerca strumenti](/it/tools/tool-search).

## Contenuti correlati

- [Automazione](/it/automation) per Cron, attività, Heartbeat, impegni, hook,
  ordini permanenti e TaskFlow
- [Agenti](/it/concepts/agent) per il modello di agente, le sessioni, la memoria e
  il coordinamento multi-agente
- [Strumenti e provider personalizzati](/it/gateway/config-tools) per il riferimento
  canonico ai criteri degli strumenti
- [Plugin](/it/tools/plugin) per l'installazione e la gestione dei Plugin
- [SDK dei Plugin](/it/plugins/sdk-overview) come riferimento per gli autori di Plugin
- [Skills](/it/tools/skills) per l'ordine di caricamento, le condizioni di attivazione e la configurazione delle Skills
- [Laboratorio delle Skills](/it/tools/skill-workshop) per la creazione di Skills
  generate e sottoposte a revisione
- [Ricerca degli strumenti](/it/tools/tool-search) per esplorare il catalogo compatto
  degli strumenti di OpenClaw
