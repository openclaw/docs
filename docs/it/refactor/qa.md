---
read_when:
    - Refactoring delle definizioni degli scenari QA o del codice harness di qa-lab
    - Spostamento del comportamento QA tra scenari Markdown e logica harness TypeScript
summary: Piano di refactoring QA per il catalogo degli scenari e il consolidamento dell’harness
title: Refactor QA
x-i18n:
    generated_at: "2026-04-23T08:36:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 16867d5be372ab414aa516144193144414c326ea53a52627f3ff91f85b8fdf9d
    source_path: refactor/qa.md
    workflow: 15
---

# Refactor QA

Stato: migrazione fondamentale completata.

## Obiettivo

Spostare il QA di OpenClaw da un modello a definizione divisa a una singola fonte di verità:

- metadati dello scenario
- prompt inviati al modello
- setup e teardown
- logica dell’harness
- asserzioni e criteri di successo
- artefatti e hint del report

Lo stato finale desiderato è un harness QA generico che carica file di definizione degli scenari potenti invece di hardcodare la maggior parte del comportamento in TypeScript.

## Stato attuale

La fonte primaria di verità ora si trova in `qa/scenarios/index.md` più un file per
scenario in `qa/scenarios/<theme>/*.md`.

Implementato:

- `qa/scenarios/index.md`
  - metadati canonici del pacchetto QA
  - identità operator
  - missione di kickoff
- `qa/scenarios/<theme>/*.md`
  - un file Markdown per scenario
  - metadati dello scenario
  - binding degli handler
  - configurazione di esecuzione specifica dello scenario
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser del pacchetto Markdown + validazione zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - rendering del piano dal pacchetto Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - inizializza file di compatibilità generati più `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - seleziona gli scenari eseguibili tramite binding degli handler definiti in Markdown
- Protocollo QA bus + UI
  - allegati inline generici per rendering di immagini/video/audio/file

Superfici ancora divise:

- `extensions/qa-lab/src/suite.ts`
  - possiede ancora la maggior parte della logica eseguibile degli handler personalizzati
- `extensions/qa-lab/src/report.ts`
  - deriva ancora la struttura del report dagli output runtime

Quindi la divisione della fonte di verità è stata corretta, ma l’esecuzione è ancora per lo più basata su handler piuttosto che completamente dichiarativa.

## Che aspetto ha davvero la superficie degli scenari

Leggere la suite attuale mostra alcune classi distinte di scenari.

### Interazione semplice

- baseline del canale
- baseline DM
- follow-up in thread
- cambio modello
- completamento dell’approvazione
- reaction/edit/delete

### Mutazione della configurazione e del runtime

- config patch disable della Skill
- config apply restart wake-up
- config restart capability flip
- controllo del drift dell’inventario runtime

### Asserzioni su filesystem e repository

- report di discovery di source/docs
- build di Lobster Invaders
- lookup di artefatti immagine generati

### Orchestrazione della memoria

- recall della memoria
- strumenti memoria nel contesto canale
- fallback in caso di errore memoria
- ranking della memoria di sessione
- isolamento della memoria del thread
- sweep Dreaming della memoria

### Integrazione di strumenti e plugin

- chiamata MCP plugin-tools
- visibilità delle Skills
- hot install della Skill
- generazione nativa di immagini
- roundtrip dell’immagine
- comprensione dell’immagine da allegato

### Multi-turno e multi-attore

- handoff del subagent
- sintesi fanout del subagent
- flussi in stile recovery dopo riavvio

Queste categorie sono importanti perché guidano i requisiti della DSL. Un elenco piatto di prompt + testo atteso non è sufficiente.

## Direzione

### Singola fonte di verità

Usare `qa/scenarios/index.md` più `qa/scenarios/<theme>/*.md` come
fonte di verità redatta.

Il pacchetto deve restare:

- leggibile dagli esseri umani in review
- analizzabile dalla macchina
- abbastanza ricco da guidare:
  - esecuzione della suite
  - bootstrap del workspace QA
  - metadati della UI QA Lab
  - prompt docs/discovery
  - generazione del report

### Formato di authoring preferito

Usare Markdown come formato di primo livello, con YAML strutturato al suo interno.

Struttura consigliata:

- frontmatter YAML
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
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

- migliore leggibilità nelle PR rispetto a enormi JSON
- contesto più ricco rispetto al solo YAML
- parsing rigoroso e validazione zod

Il JSON raw è accettabile solo come forma intermedia generata.

## Struttura proposta del file di scenario

Esempio:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
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

# Objective

Verify generated media is reattached on the follow-up turn.

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

# Steps

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Expect

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Capability del runner che la DSL deve coprire

In base alla suite attuale, il runner generico ha bisogno di più della semplice esecuzione di prompt.

### Azioni di ambiente e setup

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Azioni di turno dell’agente

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

### Azioni su file e artefatti

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Azioni su memoria e Cron

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

## Variabili e riferimenti agli artefatti

La DSL deve supportare output salvati e riferimenti successivi.

Esempi dalla suite attuale:

- creare un thread, poi riusare `threadId`
- creare una sessione, poi riusare `sessionKey`
- generare un’immagine, poi allegare il file al turno successivo
- generare una stringa marker di wake, poi verificare che compaia più tardi

Capability necessarie:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- riferimenti tipizzati per percorsi, chiavi di sessione, thread id, marker, output degli strumenti

Senza supporto alle variabili, l’harness continuerà a far trapelare la logica dello scenario di nuovo in TypeScript.

## Cosa dovrebbe restare come escape hatch

Un runner completamente puro e dichiarativo non è realistico nella fase 1.

Alcuni scenari sono intrinsecamente pesanti dal punto di vista dell’orchestrazione:

- sweep Dreaming della memoria
- config apply restart wake-up
- config restart capability flip
- risoluzione dell’artefatto immagine generato tramite timestamp/percorso
- valutazione del report di discovery

Per ora dovrebbero usare handler personalizzati espliciti.

Regola consigliata:

- 85-90% dichiarativo
- `customHandler` espliciti per la parte restante più difficile
- solo handler personalizzati nominati e documentati
- nessun codice inline anonimo nel file di scenario

Questo mantiene pulito il motore generico pur consentendo comunque di procedere.

## Cambiamento architetturale

### Attuale

Il Markdown dello scenario è già la fonte di verità per:

- esecuzione della suite
- file bootstrap del workspace
- catalogo degli scenari della UI QA Lab
- metadati del report
- prompt di discovery

Compatibilità generata:

- il workspace inizializzato include ancora `QA_KICKOFF_TASK.md`
- il workspace inizializzato include ancora `QA_SCENARIO_PLAN.md`
- il workspace inizializzato ora include anche `QA_SCENARIOS.md`

## Piano di refactor

### Fase 1: loader e schema

Completata.

- aggiunto `qa/scenarios/index.md`
- scenari suddivisi in `qa/scenarios/<theme>/*.md`
- aggiunto parser per contenuto di pacchetto Markdown YAML con nome
- validato con zod
- i consumer sono stati spostati al pacchetto parsato
- rimossi `qa/seed-scenarios.json` e `qa/QA_KICKOFF_TASK.md` a livello repository

### Fase 2: motore generico

- suddividere `extensions/qa-lab/src/suite.ts` in:
  - loader
  - engine
  - registro delle azioni
  - registro delle asserzioni
  - handler personalizzati
- mantenere le funzioni helper esistenti come operazioni del motore

Deliverable:

- il motore esegue scenari dichiarativi semplici

Iniziare con scenari che sono per lo più prompt + attesa + asserzione:

- follow-up in thread
- comprensione immagine da allegato
- visibilità e invocazione della Skill
- baseline del canale

Deliverable:

- primi scenari reali definiti in Markdown distribuiti tramite il motore generico

### Fase 4: migrare gli scenari medi

- image generation roundtrip
- strumenti memoria nel contesto canale
- ranking della memoria di sessione
- handoff del subagent
- sintesi fanout del subagent

Deliverable:

- variabili, artefatti, asserzioni sugli strumenti, asserzioni sul request log dimostrate

### Fase 5: mantenere gli scenari difficili su handler personalizzati

- sweep Dreaming della memoria
- config apply restart wake-up
- config restart capability flip
- drift dell’inventario runtime

Deliverable:

- stesso formato di authoring, ma con blocchi di passaggi personalizzati espliciti dove necessario

### Fase 6: eliminare la mappa degli scenari hardcoded

Una volta che la copertura del pacchetto è sufficientemente buona:

- rimuovere la maggior parte del branching TypeScript specifico dello scenario da `extensions/qa-lab/src/suite.ts`

## Supporto Fake Slack / Rich Media

L’attuale QA bus è text-first.

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

Non modella ancora gli allegati media inline.

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

### Perché prima generico

Non costruire un modello media solo Slack.

Invece:

- un modello di trasporto QA generico
- più renderer sopra di esso
  - chat QA Lab attuale
  - futura fake Slack web
  - qualsiasi altra vista di fake transport

Questo evita logica duplicata e consente agli scenari media di restare indipendenti dal trasporto.

### Lavoro UI necessario

Aggiornare la UI QA per renderizzare:

- anteprima inline dell’immagine
- player audio inline
- player video inline
- chip di allegato file

L’attuale UI può già renderizzare thread e reaction, quindi il rendering degli allegati dovrebbe aggiungersi allo stesso modello di card del messaggio.

### Lavoro sugli scenari abilitato dal trasporto media

Una volta che gli allegati fluiscono tramite QA bus, possiamo aggiungere scenari fake-chat più ricchi:

- risposta inline con immagine in fake Slack
- comprensione dell’allegato audio
- comprensione dell’allegato video
- ordinamento misto degli allegati
- risposta nel thread con media mantenuto

## Raccomandazione

Il prossimo blocco di implementazione dovrebbe essere:

1. aggiungere loader di scenari Markdown + schema zod
2. generare il catalogo attuale dal Markdown
3. migrare prima alcuni scenari semplici
4. aggiungere supporto generico agli allegati del QA bus
5. renderizzare l’immagine inline nella UI QA
6. quindi estendersi ad audio e video

Questo è il percorso più piccolo che dimostra entrambi gli obiettivi:

- QA generico definito in Markdown
- superfici di messaggistica fake più ricche

## Domande aperte

- se i file di scenario dovrebbero consentire template di prompt Markdown incorporati con interpolazione di variabili
- se setup/cleanup dovrebbero essere sezioni nominate o solo elenchi ordinati di azioni
- se i riferimenti agli artefatti dovrebbero essere fortemente tipizzati nello schema o basati su stringhe
- se gli handler personalizzati dovrebbero vivere in un unico registro o in registri per superficie
- se il file di compatibilità JSON generato dovrebbe restare versionato durante la migrazione
