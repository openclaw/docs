---
read_when:
    - Refactoring delle definizioni degli scenari QA o del codice harness qa-lab
    - Spostamento del comportamento QA tra scenari Markdown e logica harness TypeScript
summary: Piano di refactoring QA per il catalogo degli scenari e il consolidamento dell'harness
title: Refactoring QA
x-i18n:
    generated_at: "2026-04-24T08:59:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

Stato: migrazione di base completata.

## Obiettivo

Spostare la QA di OpenClaw da un modello a definizione divisa a un'unica fonte di verità:

- metadati dello scenario
- prompt inviati al modello
- setup e teardown
- logica dell'harness
- asserzioni e criteri di successo
- artifact e suggerimenti per i report

Lo stato finale desiderato è un harness QA generico che carichi file di definizione degli scenari potenti invece di hardcodare la maggior parte del comportamento in TypeScript.

## Stato attuale

La fonte primaria di verità ora risiede in `qa/scenarios/index.md` più un file per
scenario sotto `qa/scenarios/<theme>/*.md`.

Implementato:

- `qa/scenarios/index.md`
  - metadati canonici del pacchetto QA
  - identità dell'operatore
  - missione di kickoff
- `qa/scenarios/<theme>/*.md`
  - un file markdown per scenario
  - metadati dello scenario
  - binding degli handler
  - configurazione di esecuzione specifica dello scenario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser markdown del pacchetto + validazione zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - rendering del piano dal pacchetto markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - semina dei file di compatibilità generati più `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - seleziona gli scenari eseguibili tramite binding degli handler definiti nel markdown
- Protocollo QA bus + UI
  - allegati inline generici per rendering di immagini/video/audio/file

Superfici ancora divise:

- `extensions/qa-lab/src/suite.ts`
  - gestisce ancora la maggior parte della logica eseguibile degli handler personalizzati
- `extensions/qa-lab/src/report.ts`
  - deriva ancora la struttura del report dagli output runtime

Quindi la divisione della fonte di verità è stata corretta, ma l'esecuzione è ancora per lo più supportata dagli handler invece di essere completamente dichiarativa.

## Com'è davvero la superficie degli scenari

La lettura della suite attuale mostra alcune classi distinte di scenario.

### Interazione semplice

- baseline del canale
- baseline DM
- follow-up in thread
- cambio modello
- proseguimento dopo approvazione
- reaction/edit/delete

### Mutazione di configurazione e runtime

- config patch con disabilitazione Skill
- config apply con riattivazione dopo restart
- capability flip al restart della configurazione
- controllo drift dell'inventario runtime

### Asserzioni su filesystem e repository

- report di discovery di sorgente/documentazione
- build di Lobster Invaders
- ricerca di artifact generati di immagini

### Orchestrazione della memoria

- richiamo della memoria
- strumenti di memoria nel contesto del canale
- fallback in caso di errore della memoria
- ranking della memoria di sessione
- isolamento della memoria del thread
- sweep di Dreaming della memoria

### Integrazione di strumenti e Plugin

- chiamata MCP plugin-tools
- visibilità delle Skill
- hot install delle Skill
- generazione di immagini nativa
- roundtrip immagine
- comprensione dell'immagine da allegato

### Multi-turno e multi-attore

- handoff a sottoagente
- sintesi fanout di sottoagenti
- flussi in stile recupero dopo restart

Queste categorie contano perché guidano i requisiti del DSL. Un elenco piatto di prompt + testo atteso non basta.

## Direzione

### Unica fonte di verità

Usa `qa/scenarios/index.md` più `qa/scenarios/<theme>/*.md` come
fonte di verità creata manualmente.

Il pacchetto dovrebbe restare:

- leggibile da esseri umani in review
- analizzabile dalla macchina
- abbastanza ricco da guidare:
  - esecuzione della suite
  - bootstrap dello spazio di lavoro QA
  - metadati della UI QA Lab
  - prompt di documentazione/discovery
  - generazione dei report

### Formato di authoring preferito

Usa markdown come formato di alto livello, con YAML strutturato al suo interno.

Forma consigliata:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - riferimenti alla documentazione
  - riferimenti al codice
  - override modello/provider
  - prerequisiti
- sezioni in prosa
  - objective
  - notes
  - debugging hints
- blocchi YAML fenced
  - setup
  - steps
  - assertions
  - cleanup

Questo offre:

- migliore leggibilità in PR rispetto a enormi JSON
- contesto più ricco rispetto al puro YAML
- parsing rigoroso e validazione zod

Il JSON raw è accettabile solo come forma generata intermedia.

## Forma proposta del file di scenario

Esempio:

````md
---
id: image-generation-roundtrip
title: Roundtrip di generazione immagine
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Obiettivo

Verificare che i media generati vengano riattaccati nel turno di follow-up.

# Setup

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Passi

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Controllo generazione immagine: genera un'immagine QA di un faro e riassumila in una breve frase.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Controllo generazione immagine
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Controllo di ispezione immagine roundtrip: descrivi l'allegato dell'immagine del faro generata in una breve frase.
  attachments:
    - fromArtifact: lighthouseImage
```

# Atteso

```yaml scenario.expect
- assert: outbound.textIncludes
  value: faro
- assert: requestLog.matches
  where:
    promptIncludes: Controllo di ispezione immagine roundtrip
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Capability del runner che il DSL deve coprire

Sulla base della suite attuale, il runner generico ha bisogno di più della sola esecuzione di prompt.

### Azioni di ambiente e setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Azioni del turno agente

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Azioni di configurazione e runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Azioni su file e artifact

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Azioni di memoria e Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Azioni MCP

- `mcp.callTool`

### Asserzioni

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Variabili e riferimenti agli artifact

Il DSL deve supportare output salvati e riferimenti successivi.

Esempi dalla suite attuale:

- creare un thread, poi riusare `threadId`
- creare una sessione, poi riusare `sessionKey`
- generare un'immagine, poi allegare il file al turno successivo
- generare una stringa marker di wake, poi verificare che compaia più avanti

Capability necessarie:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- riferimenti tipizzati per percorsi, chiavi di sessione, id thread, marker, output degli strumenti

Senza supporto alle variabili, l'harness continuerà a perdere logica di scenario dentro TypeScript.

## Cosa dovrebbe restare come via di fuga

Un runner completamente dichiarativo non è realistico nella fase 1.

Alcuni scenari sono intrinsecamente pesanti dal punto di vista dell'orchestrazione:

- sweep di Dreaming della memoria
- config apply con riattivazione dopo restart
- capability flip al restart della configurazione
- risoluzione di artifact di immagini generate per timestamp/percorso
- valutazione del discovery-report

Per ora questi dovrebbero usare handler personalizzati espliciti.

Regola consigliata:

- 85-90% dichiarativo
- `customHandler` espliciti per il resto più difficile
- solo handler personalizzati nominati e documentati
- nessun codice inline anonimo nel file di scenario

Questo mantiene pulito il motore generico consentendo comunque progresso.

## Cambio architetturale

### Attuale

Il markdown degli scenari è già la fonte di verità per:

- esecuzione della suite
- file bootstrap dello spazio di lavoro
- catalogo degli scenari della UI QA Lab
- metadati dei report
- prompt di discovery

Compatibilità generata:

- lo spazio di lavoro seminato include ancora `QA_KICKOFF_TASK.md`
- lo spazio di lavoro seminato include ancora `QA_SCENARIO_PLAN.md`
- lo spazio di lavoro seminato ora include anche `QA_SCENARIOS.md`

## Piano di refactoring

### Fase 1: loader e schema

Completata.

- aggiunto `qa/scenarios/index.md`
- suddivisi gli scenari in `qa/scenarios/<theme>/*.md`
- aggiunto parser per contenuti named markdown YAML pack
- validato con zod
- cambiati i consumer al pack parsato
- rimossi `qa/seed-scenarios.json` e `qa/QA_KICKOFF_TASK.md` a livello repository

### Fase 2: motore generico

- dividere `extensions/qa-lab/src/suite.ts` in:
  - loader
  - engine
  - registro delle azioni
  - registro delle asserzioni
  - handler personalizzati
- mantenere le funzioni helper esistenti come operazioni del motore

Deliverable:

- il motore esegue scenari dichiarativi semplici

Inizia con scenari che sono per lo più prompt + wait + assert:

- follow-up in thread
- comprensione immagine da allegato
- visibilità e invocazione delle Skill
- baseline del canale

Deliverable:

- primi veri scenari definiti in markdown distribuiti tramite il motore generico

### Fase 4: migrare scenari medi

- roundtrip di generazione immagine
- strumenti di memoria nel contesto del canale
- ranking della memoria di sessione
- handoff a sottoagente
- sintesi fanout di sottoagenti

Deliverable:

- variabili, artifact, asserzioni sugli strumenti, asserzioni sui request-log con prova effettiva

### Fase 5: mantenere gli scenari difficili su handler personalizzati

- sweep di Dreaming della memoria
- config apply con riattivazione dopo restart
- capability flip al restart della configurazione
- drift dell'inventario runtime

Deliverable:

- stesso formato di authoring, ma con blocchi custom-step espliciti dove necessario

### Fase 6: eliminare la mappa di scenari hardcoded

Una volta che la copertura del pack sarà abbastanza buona:

- rimuovere la maggior parte del branching TypeScript specifico dello scenario da `extensions/qa-lab/src/suite.ts`

## Fake Slack / supporto rich media

L'attuale QA bus è centrato sul testo.

File rilevanti:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Oggi il QA bus supporta:

- testo
- reaction
- thread

Non modella ancora allegati media inline.

### Contratto di trasporto necessario

Aggiungere un modello generico di allegato QA bus:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Poi aggiungere `attachments?: QaBusAttachment[]` a:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Perché partire dal generico

Non costruire un modello media solo-Slack.

Invece:

- un unico modello di trasporto QA generico
- più renderer sopra di esso
  - attuale chat QA Lab
  - futuro fake Slack web
  - qualsiasi altra vista di fake transport

Questo evita logica duplicata e permette agli scenari media di restare agnostici rispetto al trasporto.

### Lavoro UI necessario

Aggiornare la UI QA per renderizzare:

- anteprima immagine inline
- player audio inline
- player video inline
- chip allegato file

L'attuale UI può già renderizzare thread e reaction, quindi il rendering degli allegati dovrebbe sovrapporsi allo stesso modello di message card.

### Lavoro sugli scenari abilitato dal trasporto media

Una volta che gli allegati scorrono attraverso il QA bus, possiamo aggiungere scenari fake-chat più ricchi:

- risposta con immagine inline in fake Slack
- comprensione di allegato audio
- comprensione di allegato video
- ordine misto degli allegati
- risposta in thread con media mantenuti

## Raccomandazione

Il prossimo blocco di implementazione dovrebbe essere:

1. aggiungere loader di scenari markdown + schema zod
2. generare l'attuale catalogo dal markdown
3. migrare prima alcuni scenari semplici
4. aggiungere supporto generico agli allegati QA bus
5. renderizzare immagini inline nella UI QA
6. poi espandere ad audio e video

Questo è il percorso più piccolo che dimostra entrambi gli obiettivi:

- QA generica definita in markdown
- superfici di fake messaging più ricche

## Domande aperte

- se i file di scenario debbano consentire template di prompt markdown incorporati con interpolazione di variabili
- se setup/cleanup debbano essere sezioni nominate o semplici elenchi ordinati di azioni
- se i riferimenti agli artifact debbano essere fortemente tipizzati nello schema o basati su stringhe
- se gli handler personalizzati debbano risiedere in un unico registro o in registri per superficie
- se il file di compatibilità JSON generato debba restare versionato durante la migrazione

## Correlati

- [QA E2E automation](/it/concepts/qa-e2e-automation)
