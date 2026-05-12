---
doc-schema-version: 1
read_when:
    - Vuoi capire quali strumenti mette a disposizione OpenClaw
    - Stai scegliendo tra strumenti integrati, Skills e plugin
    - Ti serve il punto di ingresso corretto della documentazione per le policy degli strumenti, l'automazione o il coordinamento degli agenti
summary: 'Panoramica di strumenti, Skills e plugin di OpenClaw: cosa possono chiamare gli agenti e come estenderli'
title: Panoramica
x-i18n:
    generated_at: "2026-05-12T01:00:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94424b04a520009d40d851e46f7ea0e4e914ff39b7d79958194bb123a6ec0b7b
    source_path: tools/index.md
    workflow: 16
---

Usa questa pagina per scegliere la superficie Capabilities corretta. Gli **strumenti** sono
azioni richiamabili, le **Skills** insegnano agli agenti come lavorare e i **Plugin** aggiungono
capacità di runtime come strumenti, provider, canali, hook e Skills confezionate.

Questa è una pagina di panoramica e indirizzamento. Per criteri esaustivi sugli strumenti, valori predefiniti,
appartenenza ai gruppi, restrizioni dei provider e campi di configurazione, usa
[Strumenti e provider personalizzati](/it/gateway/config-tools).

## Inizia da qui

Per la maggior parte degli agenti, inizia con le categorie di strumenti integrate, poi modifica i criteri
solo quando l'agente deve vedere meno strumenti o necessita di accesso esplicito all'host.

| Se devi...                                  | Usa prima questo                              | Poi leggi                                                               |
| ------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| Consentire a un agente di agire con capacità esistenti | [Strumenti integrati](#built-in-tool-categories) | [Categorie di strumenti](#built-in-tool-categories)                     |
| Controllare cosa può chiamare un agente     | [Criteri degli strumenti](#configure-access-and-approvals) | [Strumenti e provider personalizzati](/it/gateway/config-tools)            |
| Insegnare un workflow a un agente           | [Skills](#choose-tools-skills-or-plugins)    | [Skills](/it/tools/skills) e [Creazione di Skills](/it/tools/creating-skills) |
| Aggiungere una nuova integrazione o superficie di runtime | [Plugin](#extend-capabilities)               | [Plugin](/it/tools/plugin) e [Creare Plugin](/it/plugins/building-plugins)    |
| Eseguire lavoro più tardi o in background   | [Automazione](/it/automation)                   | [Panoramica dell'automazione](/it/automation)                              |
| Coordinare più agenti o harness             | [Sotto-agenti](/it/tools/subagents)             | [Agenti ACP](/it/tools/acp-agents) e [Invio agente](/it/tools/agent-send)     |
| Cercare in un ampio catalogo di strumenti PI | [Ricerca strumenti](/it/tools/tool-search)      | [Ricerca strumenti](/it/tools/tool-search)                                 |

## Scegliere strumenti, Skills o Plugin

<Steps>
  <Step title="Usa uno strumento quando l'agente deve agire">
    Uno strumento è una funzione tipizzata che l'agente può chiamare, come `exec`, `browser`,
    `web_search`, `message` o `image_generate`. Usa gli strumenti quando l'agente
    deve leggere dati, modificare file, inviare messaggi, chiamare un provider o operare
    un altro sistema. Gli strumenti visibili vengono inviati al modello come definizioni
    di funzione strutturate.

    Il modello vede solo gli strumenti che superano profilo attivo, criteri allow/deny,
    restrizioni dei provider, stato della sandbox, autorizzazioni del canale e
    disponibilità dei Plugin.

  </Step>

  <Step title="Usa una Skill quando l'agente ha bisogno di istruzioni">
    Una Skill è un pacchetto di istruzioni `SKILL.md` caricato nel prompt dell'agente. Usa una
    Skill quando l'agente ha già gli strumenti necessari, ma ha bisogno di un
    workflow ripetibile, una rubric di revisione, una sequenza di comandi o un vincolo operativo.

    Le Skills possono trovarsi in un workspace, in una directory di Skills condivisa, nella root
    di Skills gestita da OpenClaw o in un pacchetto Plugin.

    [Skills](/it/tools/skills) | [Creazione di Skills](/it/tools/creating-skills) | [Configurazione Skills](/it/tools/skills-config)

  </Step>

  <Step title="Usa un Plugin quando OpenClaw ha bisogno di una nuova capacità">
    Un Plugin può aggiungere strumenti, Skills, canali, provider di modelli, sintesi vocale, voce
    realtime, generazione multimediale, ricerca web, recupero web, hook e altre capacità
    di runtime. Usa un Plugin quando la capacità include codice, credenziali,
    hook del ciclo di vita, metadati del manifest o packaging installabile. I
    Plugin esistenti possono essere installati da ClawHub, npm, git, directory locali o
    archivi.

    [Installa e configura Plugin](/it/tools/plugin) | [Crea Plugin](/it/plugins/building-plugins) | [Plugin SDK](/it/plugins/sdk-overview)

  </Step>
</Steps>

## Categorie di strumenti integrate

La tabella elenca strumenti rappresentativi così puoi riconoscere la superficie. Non è
il riferimento completo dei criteri. Per gruppi, valori predefiniti e semantica allow/deny
esatti, usa [Strumenti e provider personalizzati](/it/gateway/config-tools).

| Categoria              | Usa quando l'agente deve...                                                 | Strumenti rappresentativi                                             | Leggi dopo                                                             |
| ---------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Runtime                | Eseguire comandi, gestire processi o usare analisi Python supportata da provider | `exec`, `process`, `code_execution`                                  | [Exec](/it/tools/exec), [Esecuzione di codice](/it/tools/code-execution)     |
| File                   | Leggere e modificare file del workspace                                      | `read`, `write`, `edit`, `apply_patch`                               | [Applica patch](/it/tools/apply-patch)                                    |
| Web                    | Cercare nel web, cercare post X o recuperare contenuti di pagina leggibili   | `web_search`, `x_search`, `web_fetch`                                | [Strumenti web](/it/tools/web), [Recupero web](/it/tools/web-fetch)          |
| Browser                | Operare una sessione browser                                                 | `browser`                                                            | [Browser](/it/tools/browser)                                              |
| Messaggistica e canali | Inviare risposte o azioni di canale                                          | `message`                                                            | [Invio agente](/it/tools/agent-send)                                      |
| Sessioni e agenti      | Ispezionare sessioni, delegare lavoro, guidare un'altra esecuzione o riportare lo stato | `sessions_*`, `subagents`, `agents_list`, `session_status`           | [Sotto-agenti](/it/tools/subagents), [Strumento sessione](/it/concepts/session-tool) |
| Automazione            | Pianificare lavoro o rispondere a eventi in background                       | `cron`, `heartbeat_respond`                                          | [Automazione](/it/automation)                                             |
| Gateway e nodi         | Ispezionare lo stato del Gateway o dispositivi target associati              | `gateway`, `nodes`                                                   | [Configurazione Gateway](/it/gateway/configuration), [Nodi](/it/nodes)       |
| Media                  | Analizzare, generare o parlare media                                         | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Panoramica media](/it/tools/media-overview)                              |
| Grandi cataloghi PI    | Cercare e chiamare molti strumenti idonei senza inviare ogni schema al modello | `tool_search_code`, `tool_search`, `tool_describe`                   | [Ricerca strumenti](/it/tools/tool-search)                                |

<Note>
Ricerca strumenti è una superficie sperimentale per agenti PI. Le esecuzioni con harness Codex usano
la modalità codice nativa di Codex, la ricerca strumenti nativa, strumenti dinamici differiti e chiamate
di strumenti annidate invece di `tools.toolSearch`.
</Note>

## Strumenti forniti dai Plugin

I Plugin possono registrare strumenti aggiuntivi. Gli autori di Plugin cablano gli strumenti tramite
`api.registerTool(...)` e `contracts.tools` del manifest; usa
[Plugin SDK](/it/plugins/sdk-overview) e [Manifest Plugin](/it/plugins/manifest)
per i dettagli dei contratti.

Gli strumenti comuni forniti dai Plugin includono:

- [Diff](/it/tools/diffs) per il rendering di diff di file e markdown
- [Task LLM](/it/tools/llm-task) per passaggi di workflow solo JSON
- [Lobster](/it/tools/lobster) per workflow tipizzati con approvazioni riprendibili
- [Tokenjuice](/it/tools/tokenjuice) per compattare output rumoroso degli strumenti `exec` e `bash`
- [Ricerca strumenti](/it/tools/tool-search) per scoprire e chiamare grandi cataloghi di strumenti
  senza mettere ogni schema nel prompt
- [Canvas](/it/plugins/reference/canvas) per il controllo di Canvas Node e il rendering
  A2UI

## Configurare accesso e approvazioni

I criteri degli strumenti vengono applicati prima della chiamata al modello. Se i criteri rimuovono uno strumento, il
modello non riceve lo schema di quello strumento per il turno. Un'esecuzione può perdere strumenti
a causa della configurazione globale, della configurazione per agente, dei criteri di canale, delle restrizioni dei provider,
delle regole della sandbox, del gating riservato al proprietario o della disponibilità dei Plugin.

- [Strumenti e provider personalizzati](/it/gateway/config-tools) documenta profili degli strumenti,
  elenchi allow/deny, restrizioni specifiche dei provider, rilevamento dei loop e
  impostazioni degli strumenti supportati dai provider.
- [Approvazioni exec](/it/tools/exec-approvals) documenta i criteri di approvazione dei comandi host.
- [Exec elevato](/it/tools/elevated) documenta l'esecuzione controllata fuori dalla
  sandbox.
- [Sandbox vs criteri degli strumenti vs elevato](/it/gateway/sandbox-vs-tool-policy-vs-elevated) spiega quale livello controlla l'accesso a file e processi.
- [Sandbox per agente e restrizioni degli strumenti](/it/tools/multi-agent-sandbox-tools)
  documenta le restrizioni specifiche degli agenti per le esecuzioni delegate.

## Estendere le capacità

Scegli il percorso di estensione in base al lavoro che OpenClaw deve svolgere:

- Installa o gestisci un Plugin esistente con [Plugin](/it/tools/plugin).
- Crea una nuova integrazione, provider, canale, strumento o hook con
  [Crea Plugin](/it/plugins/building-plugins).
- Aggiungi o regola istruzioni riutilizzabili per agenti con [Skills](/it/tools/skills) e
  [Creazione di Skills](/it/tools/creating-skills).
- Confeziona materiale di workflow riutilizzabile con
  [Laboratorio Skills](/it/plugins/skill-workshop) quando il workflow appartiene a un
  bundle di Skills distribuito da Plugin.
- Usa [Plugin SDK](/it/plugins/sdk-overview) e [Manifest Plugin](/it/plugins/manifest) quando hai bisogno di contratti di implementazione.

## Risolvere problemi di strumenti mancanti

Se il modello non riesce a vedere o chiamare uno strumento, inizia dai criteri effettivi per il
turno corrente:

1. Controlla il profilo attivo, `tools.allow` e `tools.deny` in
   [Strumenti e provider personalizzati](/it/gateway/config-tools).
2. Controlla le restrizioni specifiche dei provider in
   [Strumenti e provider personalizzati](/it/gateway/config-tools) e conferma che il
   [provider del modello](/it/concepts/model-providers) selezionato supporti la forma dello strumento.
3. Controlla autorizzazioni del canale, stato della sandbox e accesso elevato con
   [Sandbox vs criteri degli strumenti vs elevato](/it/gateway/sandbox-vs-tool-policy-vs-elevated) e [Exec elevato](/it/tools/elevated).
4. Controlla se il Plugin proprietario è installato e abilitato in
   [Plugin](/it/tools/plugin).
5. Per le esecuzioni delegate, controlla le restrizioni per agente in
   [Sandbox per agente e restrizioni degli strumenti](/it/tools/multi-agent-sandbox-tools).
6. Per grandi cataloghi PI, conferma se l'esecuzione usa esposizione diretta degli strumenti o
   [Ricerca strumenti](/it/tools/tool-search).

## Correlati

- [Automazione](/it/automation) per cron, task, Heartbeat, commitment, hook, standing order e Task Flow
- [Agenti](/it/concepts/agent) per il modello agente, sessioni, memoria e coordinamento multi-agente
- [Strumenti e provider personalizzati](/it/gateway/config-tools) per il riferimento canonico dei criteri degli strumenti
- [Plugin](/it/tools/plugin) per installazione e gestione dei Plugin
- [Plugin SDK](/it/plugins/sdk-overview) per il riferimento degli autori di Plugin
- [Skills](/it/tools/skills) per ordine di caricamento, gating e configurazione delle Skill
- [Ricerca strumenti](/it/tools/tool-search) per la scoperta compatta di cataloghi di strumenti PI
