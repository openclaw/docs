---
doc-schema-version: 1
read_when:
    - Vuoi capire quali strumenti offre OpenClaw
    - Stai scegliendo tra strumenti integrati, Skills e Plugin
    - Ti serve il punto di accesso corretto alla documentazione per la policy degli strumenti, l'automazione o il coordinamento degli agenti
summary: 'Panoramica di strumenti, Skills e Plugin di OpenClaw: cosa possono chiamare gli agenti e come estenderli'
title: Panoramica
x-i18n:
    generated_at: "2026-06-27T18:21:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

Usa questa pagina per scegliere la superficie Capabilities corretta. **Gli strumenti** sono
azioni richiamabili, le **Skills** insegnano agli agenti come lavorare e i **Plugin** aggiungono capacità di runtime
come strumenti, provider, canali, hook e Skills confezionate.

Questa è una pagina di panoramica e instradamento. Per criteri completi sugli strumenti, impostazioni predefinite,
appartenenza ai gruppi, restrizioni dei provider e campi di configurazione, usa
[Strumenti e provider personalizzati](/it/gateway/config-tools).

## Inizia da qui

Per la maggior parte degli agenti, inizia con le categorie di strumenti integrate, poi modifica i criteri
solo quando l'agente deve vedere meno strumenti o richiede accesso esplicito all'host.

| Se devi...                                  | Usa prima questo                              | Poi leggi                                                                                                       |
| ------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Consentire a un agente di agire con capacità esistenti | [Strumenti integrati](#built-in-tool-categories) | [Categorie di strumenti](#built-in-tool-categories)                                                             |
| Controllare cosa può richiamare un agente   | [Criteri degli strumenti](#configure-access-and-approvals) | [Strumenti e provider personalizzati](/it/gateway/config-tools)                                                     |
| Insegnare un workflow a un agente           | [Skills](#choose-tools-skills-or-plugins)      | [Skills](/it/tools/skills), [Creazione di Skills](/it/tools/creating-skills) e [Skill Workshop](/it/tools/skill-workshop) |
| Aggiungere una nuova integrazione o superficie di runtime | [Plugin](#extend-capabilities)                 | [Plugin](/it/tools/plugin) e [Creare Plugin](/it/plugins/building-plugins)                                            |
| Eseguire lavoro in seguito o in background  | [Automazione](/it/automation)                     | [Panoramica dell'automazione](/it/automation)                                                                      |
| Coordinare più agenti o harness             | [Sub-agenti](/it/tools/subagents)                 | [Agenti ACP](/it/tools/acp-agents) e [Invio agente](/it/tools/agent-send)                                             |
| Cercare in un grande catalogo di strumenti OpenClaw | [Tool Search](/it/tools/tool-search)              | [Tool Search](/it/tools/tool-search)                                                                               |

## Scegli strumenti, Skills o Plugin

<Steps>
  <Step title="Usa uno strumento quando l'agente deve agire">
    Uno strumento è una funzione tipizzata che l'agente può richiamare, come `exec`, `browser`,
    `web_search`, `message` o `image_generate`. Usa gli strumenti quando l'agente
    deve leggere dati, modificare file, inviare messaggi, chiamare un provider o operare
    un altro sistema. Gli strumenti visibili vengono inviati al modello come definizioni
    di funzione strutturate.

    Il modello vede solo gli strumenti che superano il profilo attivo, i criteri allow/deny,
    le restrizioni del provider, lo stato sandbox, i permessi del canale e la
    disponibilità dei Plugin.

  </Step>

  <Step title="Usa una Skill quando l'agente ha bisogno di istruzioni">
    Una Skill è un pacchetto di istruzioni `SKILL.md` caricato nel prompt dell'agente. Usa una
    Skill quando l'agente ha già gli strumenti necessari, ma richiede un workflow
    ripetibile, una rubrica di revisione, una sequenza di comandi o un vincolo operativo.

    Le Skills possono risiedere in un workspace, in una directory Skills condivisa, in una root Skills
    gestita da OpenClaw o in un pacchetto Plugin.

    [Skills](/it/tools/skills) | [Skill Workshop](/it/tools/skill-workshop) | [Creazione di Skills](/it/tools/creating-skills) | [Configurazione Skills](/it/tools/skills-config)

  </Step>

  <Step title="Usa un Plugin quando OpenClaw richiede una nuova capacità">
    Un Plugin può aggiungere strumenti, Skills, canali, provider di modelli, voce, voce realtime,
    generazione di media, ricerca web, recupero web, hook e altre capacità di runtime.
    Usa un Plugin quando la capacità include codice, credenziali,
    hook di lifecycle, metadati manifest o pacchettizzazione installabile. I Plugin esistenti
    possono essere installati da ClawHub, npm, git, directory locali o
    archivi.

    [Installare e configurare Plugin](/it/tools/plugin) | [Creare Plugin](/it/plugins/building-plugins) | [Plugin SDK](/it/plugins/sdk-overview)

  </Step>
</Steps>

## Categorie di strumenti integrate

La tabella elenca strumenti rappresentativi per aiutarti a riconoscere la superficie. Non è
il riferimento completo dei criteri. Per gruppi esatti, impostazioni predefinite e semantica
allow/deny, usa [Strumenti e provider personalizzati](/it/gateway/config-tools).

| Categoria               | Usa quando l'agente deve...                                                     | Strumenti rappresentativi                                           | Leggi dopo                                                                                  |
| ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Runtime                 | Eseguire comandi, gestire processi o usare analisi Python supportata da provider | `exec`, `process`, `code_execution`                                  | [Exec](/it/tools/exec), [Esecuzione del codice](/it/tools/code-execution)                         |
| File                    | Leggere e modificare file del workspace                                       | `read`, `write`, `edit`, `apply_patch`                               | [Apply patch](/it/tools/apply-patch)                                                           |
| Web                     | Cercare sul web, cercare post X o recuperare contenuti leggibili di pagine    | `web_search`, `x_search`, `web_fetch`                                | [Strumenti web](/it/tools/web), [Web fetch](/it/tools/web-fetch)                                  |
| Browser                 | Operare una sessione browser                                                  | `browser`                                                            | [Browser](/it/tools/browser)                                                                   |
| Messaggistica e canali  | Inviare risposte o azioni di canale                                           | `message`                                                            | [Invio agente](/it/tools/agent-send)                                                           |
| Sessioni e agenti       | Ispezionare sessioni, delegare lavoro, guidare un'altra esecuzione o segnalare lo stato | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`   | [Goal](/it/tools/goal), [Sub-agenti](/it/tools/subagents), [Strumento sessione](/it/concepts/session-tool) |
| Automazione             | Pianificare lavoro o rispondere a eventi in background                        | `cron`, `heartbeat_respond`                                          | [Automazione](/it/automation)                                                                  |
| Gateway e nodi          | Ispezionare lo stato del Gateway o dispositivi target associati               | `gateway`, `nodes`                                                   | [Configurazione Gateway](/it/gateway/configuration), [Nodi](/it/nodes)                            |
| Media                   | Analizzare, generare o pronunciare media                                      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Panoramica media](/it/tools/media-overview)                                                    |
| Grandi cataloghi OpenClaw | Cercare e richiamare molti strumenti idonei senza inviare ogni schema al modello | `tool_search_code`, `tool_search`, `tool_describe`                   | [Tool Search](/it/tools/tool-search)                                                           |

<Note>
Tool Search è una superficie sperimentale per agenti OpenClaw. Le esecuzioni dell'harness Codex usano
la modalità codice nativa di Codex, la ricerca strumenti nativa, strumenti dinamici differiti e chiamate
strumento annidate invece di `tools.toolSearch`.
</Note>

## Strumenti forniti dai Plugin

I Plugin possono registrare strumenti aggiuntivi. Gli autori di Plugin collegano gli strumenti tramite
`api.registerTool(...)` e `contracts.tools` del manifest; usa
[Plugin SDK](/it/plugins/sdk-overview) e [Manifest Plugin](/it/plugins/manifest)
per i dettagli del contratto.

Gli strumenti comuni forniti dai Plugin includono:

- [Diff](/it/tools/diffs) per renderizzare diff di file e markdown
- [LLM Task](/it/tools/llm-task) per passaggi di workflow solo JSON
- [Lobster](/it/tools/lobster) per workflow tipizzati con approvazioni riprendibili
- [Tokenjuice](/it/tools/tokenjuice) per comprimere output rumoroso degli strumenti `exec` e `bash`
- [Tool Search](/it/tools/tool-search) per scoprire e richiamare grandi cataloghi di strumenti
  senza inserire ogni schema nel prompt
- [Canvas](/it/plugins/reference/canvas) per il controllo Canvas di Node e il rendering A2UI

## Configura accesso e approvazioni

I criteri degli strumenti vengono applicati prima della chiamata al modello. Se i criteri rimuovono uno strumento, il
modello non riceve lo schema di quello strumento per il turno. Un'esecuzione può perdere strumenti
a causa della configurazione globale, della configurazione per agente, dei criteri di canale, delle restrizioni
dei provider, delle regole sandbox, dei criteri canale/runtime o della disponibilità dei Plugin.

- [Strumenti e provider personalizzati](/it/gateway/config-tools) documenta profili degli strumenti,
  elenchi allow/deny, restrizioni specifiche dei provider, rilevamento loop e
  impostazioni degli strumenti supportati da provider.
- [Approvazioni exec](/it/tools/exec-approvals) documenta i criteri di approvazione dei comandi host.
- [Exec elevato](/it/tools/elevated) documenta l'esecuzione controllata fuori dalla
  sandbox.
- [Sandbox vs criteri strumenti vs elevato](/it/gateway/sandbox-vs-tool-policy-vs-elevated) spiega quale livello controlla l'accesso a file e processi.
- [Sandbox e restrizioni strumenti per agente](/it/tools/multi-agent-sandbox-tools)
  documenta le restrizioni specifiche degli agenti per le esecuzioni delegate.

## Estendi le capacità

Scegli il percorso di estensione in base al lavoro che OpenClaw deve svolgere:

- Installa o gestisci un Plugin esistente con [Plugin](/it/tools/plugin).
- Crea una nuova integrazione, provider, canale, strumento o hook con
  [Creare Plugin](/it/plugins/building-plugins).
- Aggiungi o perfeziona istruzioni riutilizzabili per agenti con [Skills](/it/tools/skills) e
  [Creazione di Skills](/it/tools/creating-skills).
- Usa [Plugin SDK](/it/plugins/sdk-overview) e [Manifest Plugin](/it/plugins/manifest) quando hai bisogno di contratti di implementazione.

## Risoluzione dei problemi degli strumenti mancanti

Se il modello non può vedere o richiamare uno strumento, inizia dai criteri effettivi per il
turno corrente:

1. Controlla il profilo attivo, `tools.allow` e `tools.deny` in
   [Strumenti e provider personalizzati](/it/gateway/config-tools).
2. Controlla le restrizioni specifiche del provider in
   [Strumenti e provider personalizzati](/it/gateway/config-tools) e conferma che il
   [provider del modello](/it/concepts/model-providers) selezionato supporti la forma dello strumento.
3. Controlla i permessi del canale, lo stato sandbox e l'accesso elevato con
   [Sandbox vs criteri strumenti vs elevato](/it/gateway/sandbox-vs-tool-policy-vs-elevated) e [Exec elevato](/it/tools/elevated).
4. Controlla se il Plugin proprietario è installato e abilitato in
   [Plugin](/it/tools/plugin).
5. Per le esecuzioni delegate, controlla le restrizioni per agente in
   [Sandbox e restrizioni strumenti per agente](/it/tools/multi-agent-sandbox-tools).
6. Per grandi cataloghi OpenClaw, conferma se l'esecuzione usa l'esposizione diretta degli strumenti o
   [Tool Search](/it/tools/tool-search).

## Correlati

- [Automazione](/it/automation) per cron, attività, heartbeat, impegni, hook, ordini permanenti e Task Flow
- [Agenti](/it/concepts/agent) per il modello agente, sessioni, memoria e coordinamento multi-agente
- [Strumenti e provider personalizzati](/it/gateway/config-tools) per il riferimento canonico dei criteri strumenti
- [Plugin](/it/tools/plugin) per installazione e gestione dei Plugin
- [Plugin SDK](/it/plugins/sdk-overview) per il riferimento degli autori di Plugin
- [Skills](/it/tools/skills) per ordine di caricamento, gating e configurazione delle Skill
- [Skill Workshop](/it/tools/skill-workshop) per creazione di Skills generate e revisionate
- [Tool Search](/it/tools/tool-search) per scoperta compatta del catalogo strumenti OpenClaw
