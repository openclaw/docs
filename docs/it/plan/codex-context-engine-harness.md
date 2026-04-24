---
read_when:
    - Stai collegando il comportamento del ciclo di vita del context-engine all'harness Codex
    - Hai bisogno che lossless-claw o un altro plugin Context Engines funzioni con sessioni harness incorporate `codex/*`
    - Stai confrontando il comportamento del contesto tra PI incorporato e app-server Codex
summary: Specifica per fare in modo che l'harness app-server Codex incluso rispetti i plugin Context Engines di OpenClaw
title: Porting del Context Engine dell'Harness Codex
x-i18n:
    generated_at: "2026-04-24T08:49:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d6b106915f2888337cb08c831c1722770ad8ec6612c575efe88fe2fc263dec5
    source_path: plan/codex-context-engine-harness.md
    workflow: 15
---

# Porting del Context Engine dell'Harness Codex

## Stato

Specifica di implementazione in bozza.

## Obiettivo

Fare in modo che l'harness app-server Codex incluso rispetti lo stesso contratto
di ciclo di vita dei plugin Context Engines di OpenClaw già rispettato dai turni PI incorporati.

Una sessione che usa `agents.defaults.embeddedHarness.runtime: "codex"` o un
modello `codex/*` dovrebbe comunque consentire al plugin Context Engines selezionato, come
`lossless-claw`, di controllare l'assemblaggio del contesto, l'ingest post-turno, la manutenzione e la policy di Compaction a livello OpenClaw, per quanto il confine dell'app-server Codex lo consenta.

## Non obiettivi

- Non reimplementare gli interni dell'app-server Codex.
- Non fare in modo che la Compaction nativa dei thread Codex produca un riepilogo lossless-claw.
- Non richiedere ai modelli non Codex di usare l'harness Codex.
- Non cambiare il comportamento delle sessioni ACP/acpx. Questa specifica riguarda solo il
  percorso dell'harness dell'agente incorporato non-ACP.
- Non fare in modo che i Plugin di terze parti registrino factory di estensioni per l'app-server Codex;
  il confine di trust esistente del Plugin incluso rimane invariato.

## Architettura attuale

Il ciclo di esecuzione incorporato risolve il Context Engines configurato una volta per esecuzione prima di
selezionare un harness low-level concreto:

- `src/agents/pi-embedded-runner/run.ts`
  - inizializza i plugin Context Engines
  - chiama `resolveContextEngine(params.config)`
  - passa `contextEngine` e `contextTokenBudget` a
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega all'harness dell'agente selezionato:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

L'harness app-server Codex è registrato dal Plugin Codex incluso:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

L'implementazione dell'harness Codex riceve gli stessi `EmbeddedRunAttemptParams`
dei tentativi supportati da PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Questo significa che il punto di aggancio richiesto è nel codice controllato da OpenClaw. Il confine
esterno è il protocollo stesso dell'app-server Codex: OpenClaw può controllare ciò che
invia a `thread/start`, `thread/resume` e `turn/start`, e può osservare
le notifiche, ma non può cambiare lo store interno dei thread Codex né il compattatore nativo.

## Lacuna attuale

I tentativi PI incorporati chiamano direttamente il ciclo di vita del Context Engines:

- bootstrap/manutenzione prima del tentativo
- assemble prima della chiamata al modello
- afterTurn o ingest dopo il tentativo
- manutenzione dopo un turno riuscito
- Compaction del Context Engines per i motori che possiedono la Compaction

Codice PI rilevante:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

I tentativi app-server Codex attualmente eseguono hook generici dell'harness dell'agente e replicano
la trascrizione, ma non chiamano `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` o
`params.contextEngine.maintain`.

Codice Codex rilevante:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamento desiderato

Per i turni dell'harness Codex, OpenClaw dovrebbe preservare questo ciclo di vita:

1. Leggere la trascrizione della sessione OpenClaw replicata.
2. Eseguire il bootstrap del Context Engines attivo quando esiste un file di sessione precedente.
3. Eseguire la manutenzione di bootstrap quando disponibile.
4. Assemblare il contesto usando il Context Engines attivo.
5. Convertire il contesto assemblato in input compatibili con Codex.
6. Avviare o riprendere il thread Codex con istruzioni developer che includano eventuali
   `systemPromptAddition` del Context Engines.
7. Avviare il turno Codex con il prompt rivolto all'utente assemblato.
8. Replicare il risultato Codex di nuovo nella trascrizione OpenClaw.
9. Chiamare `afterTurn` se implementato, altrimenti `ingestBatch`/`ingest`, usando lo
   snapshot della trascrizione replicata.
10. Eseguire la manutenzione del turno dopo turni riusciti e non interrotti.
11. Preservare i segnali di Compaction nativa di Codex e gli hook di Compaction di OpenClaw.

## Vincoli di progettazione

### L'app-server Codex resta canonico per lo stato nativo dei thread

Codex possiede il proprio thread nativo e qualsiasi cronologia estesa interna. OpenClaw non dovrebbe
provare a mutare la cronologia interna dell'app-server se non tramite chiamate di protocollo supportate.

La replica della trascrizione di OpenClaw resta la sorgente per le funzionalità OpenClaw:

- cronologia della chat
- ricerca
- bookkeeping di `/new` e `/reset`
- future commutazioni di modello o harness
- stato del plugin Context Engines

### L'assemblaggio del Context Engines deve essere proiettato negli input Codex

L'interfaccia Context Engines restituisce `AgentMessage[]` di OpenClaw, non una patch del
thread Codex. L'app-server Codex `turn/start` accetta un input utente corrente, mentre
`thread/start` e `thread/resume` accettano istruzioni developer.

Pertanto l'implementazione ha bisogno di un layer di proiezione. La prima versione sicura
dovrebbe evitare di fingere di poter sostituire la cronologia interna di Codex. Dovrebbe iniettare
il contesto assemblato come materiale deterministico di prompt/istruzioni developer attorno
al turno corrente.

### La stabilità della cache del prompt è importante

Per motori come lossless-claw, il contesto assemblato dovrebbe essere deterministico
a parità di input. Non aggiungere timestamp, ID casuali o ordinamenti non deterministici
al testo di contesto generato.

### La semantica di fallback PI non cambia

La selezione dell'harness resta invariata:

- `runtime: "pi"` forza PI
- `runtime: "codex"` seleziona l'harness Codex registrato
- `runtime: "auto"` consente agli harness dei plugin di rivendicare i provider supportati
- `fallback: "none"` disabilita il fallback PI quando nessun harness di plugin corrisponde

Questo lavoro cambia ciò che accade dopo che l'harness Codex è stato selezionato.

## Piano di implementazione

### 1. Esportare o spostare helper riutilizzabili del tentativo Context Engines

Oggi gli helper riutilizzabili del ciclo di vita vivono sotto il runner PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex non dovrebbe importare da un percorso di implementazione il cui nome implica PI, se
possiamo evitarlo.

Crea un modulo neutrale rispetto all'harness, per esempio:

- `src/agents/harness/context-engine-lifecycle.ts`

Sposta o riesporta:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un piccolo wrapper attorno a `runContextEngineMaintenance`

Mantieni funzionanti le importazioni PI riesportando dai vecchi file oppure aggiornando
i call site PI nella stessa PR.

I nomi neutri degli helper non dovrebbero menzionare PI.

Nomi suggeriti:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Aggiungere un helper di proiezione del contesto Codex

Aggiungi un nuovo modulo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilità:

- Accettare `AgentMessage[]` assemblati, cronologia originale replicata e prompt corrente.
- Determinare quale contesto appartiene alle istruzioni developer rispetto all'input utente corrente.
- Preservare il prompt utente corrente come richiesta finale azionabile.
- Renderizzare i messaggi precedenti in un formato stabile ed esplicito.
- Evitare metadati volatili.

API proposta:

```ts
export type CodexContextProjection = {
  developerInstructionAddition?: string;
  promptText: string;
  assembledMessages: AgentMessage[];
  prePromptMessageCount: number;
};

export function projectContextEngineAssemblyForCodex(params: {
  assembledMessages: AgentMessage[];
  originalHistoryMessages: AgentMessage[];
  prompt: string;
  systemPromptAddition?: string;
}): CodexContextProjection;
```

Prima proiezione consigliata:

- Inserire `systemPromptAddition` nelle istruzioni developer.
- Inserire il contesto della trascrizione assemblata prima del prompt corrente in `promptText`.
- Etichettarlo chiaramente come contesto assemblato OpenClaw.
- Mantenere il prompt corrente per ultimo.
- Escludere il prompt utente corrente duplicato se appare già in coda.

Esempio di forma del prompt:

```text
OpenClaw assembled context for this turn:

<conversation_context>
[user]
...

[assistant]
...
</conversation_context>

Current user request:
...
```

È meno elegante della chirurgia sulla cronologia nativa di Codex, ma è implementabile
all'interno di OpenClaw e preserva la semantica del Context Engines.

Miglioramento futuro: se l'app-server Codex espone un protocollo per sostituire o
integrare la cronologia del thread, sostituisci questo layer di proiezione per usare quell'API.

### 3. Collegare il bootstrap prima dell'avvio del thread Codex

In `extensions/codex/src/app-server/run-attempt.ts`:

- Leggere la cronologia della sessione replicata come oggi.
- Determinare se il file di sessione esisteva prima di questa esecuzione. Preferire un helper
  che controlli `fs.stat(params.sessionFile)` prima delle scritture di replica.
- Aprire un `SessionManager` o usare un adapter ristretto del session manager se l'helper
  lo richiede.
- Chiamare l'helper di bootstrap neutrale quando esiste `params.contextEngine`.

Pseudo-flusso:

```ts
const hadSessionFile = await fileExists(params.sessionFile);
const sessionManager = SessionManager.open(params.sessionFile);
const historyMessages = sessionManager.buildSessionContext().messages;

await bootstrapHarnessContextEngine({
  hadSessionFile,
  contextEngine: params.contextEngine,
  sessionId: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  sessionManager,
  runtimeContext: buildHarnessContextEngineRuntimeContext(...),
  runMaintenance: runHarnessContextEngineMaintenance,
  warn,
});
```

Usa la stessa convenzione `sessionKey` del bridge degli strumenti Codex e della replica
della trascrizione. Oggi Codex calcola `sandboxSessionKey` da `params.sessionKey` o
`params.sessionId`; usalo in modo coerente, a meno che non ci sia una ragione per preservare
`params.sessionKey` raw.

### 4. Collegare assemble prima di `thread/start` / `thread/resume` e `turn/start`

In `runCodexAppServerAttempt`:

1. Costruire prima gli strumenti dinamici, così il Context Engines vede i nomi effettivi
   degli strumenti disponibili.
2. Leggere la cronologia della sessione replicata.
3. Eseguire `assemble(...)` del Context Engines quando esiste `params.contextEngine`.
4. Proiettare il risultato assemblato in:
   - aggiunta alle istruzioni developer
   - testo del prompt per `turn/start`

La chiamata hook esistente:

```ts
resolveAgentHarnessBeforePromptBuildResult({
  prompt: params.prompt,
  developerInstructions: buildDeveloperInstructions(params),
  messages: historyMessages,
  ctx: hookContext,
});
```

dovrebbe diventare consapevole del contesto:

1. calcolare le istruzioni developer di base con `buildDeveloperInstructions(params)`
2. applicare l'assemblaggio/proiezione del Context Engines
3. eseguire `before_prompt_build` con prompt/istruzioni developer proiettati

Questo ordine consente agli hook generici del prompt di vedere lo stesso prompt che Codex riceverà. Se
serve parità rigorosa con PI, esegui l'assemblaggio del Context Engines prima della composizione
degli hook, perché PI applica `systemPromptAddition` del Context Engines al prompt di sistema finale
dopo la propria pipeline del prompt. L'invariante importante è che sia il Context Engines sia gli hook ricevano un ordine deterministico e documentato.

Ordine consigliato per la prima implementazione:

1. `buildDeveloperInstructions(params)`
2. `assemble()` del Context Engines
3. aggiungere/preporre `systemPromptAddition` alle istruzioni developer
4. proiettare i messaggi assemblati nel testo del prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. passare le istruzioni developer finali a `startOrResumeThread(...)`
7. passare il testo del prompt finale a `buildTurnStartParams(...)`

La specifica dovrebbe essere codificata nei test così i cambiamenti futuri non la
riordinino accidentalmente.

### 5. Preservare una formattazione stabile per la cache del prompt

L'helper di proiezione deve produrre output stabile a livello di byte per input identici:

- ordine stabile dei messaggi
- etichette di ruolo stabili
- nessun timestamp generato
- nessuna dipendenza dall'ordine delle chiavi degli oggetti
- nessun delimitatore casuale
- nessun ID per esecuzione

Usa delimitatori fissi e sezioni esplicite.

### 6. Collegare il post-turno dopo la replica della trascrizione

`CodexAppServerEventProjector` di Codex costruisce un `messagesSnapshot` locale per il
turno corrente. `mirrorTranscriptBestEffort(...)` scrive quello snapshot nel mirror della trascrizione OpenClaw.

Dopo che il mirroring riesce o fallisce, chiama il finalizer del Context Engines con il
miglior snapshot di messaggi disponibile:

- Preferisci il contesto completo della sessione replicata dopo la scrittura, perché `afterTurn`
  si aspetta lo snapshot della sessione, non solo il turno corrente.
- Usa come fallback `historyMessages + result.messagesSnapshot` se il file di sessione
  non può essere riaperto.

Pseudo-flusso:

```ts
const prePromptMessageCount = historyMessages.length;
await mirrorTranscriptBestEffort(...);
const finalMessages = readMirroredSessionHistoryMessages(params.sessionFile)
  ?? [...historyMessages, ...result.messagesSnapshot];

await finalizeHarnessContextEngineTurn({
  contextEngine: params.contextEngine,
  promptError: Boolean(finalPromptError),
  aborted: finalAborted,
  yieldAborted,
  sessionIdUsed: params.sessionId,
  sessionKey: sandboxSessionKey,
  sessionFile: params.sessionFile,
  messagesSnapshot: finalMessages,
  prePromptMessageCount,
  tokenBudget: params.contextTokenBudget,
  runtimeContext: buildHarnessContextEngineRuntimeContextFromUsage({
    attempt: params,
    workspaceDir: effectiveWorkspace,
    agentDir,
    tokenBudget: params.contextTokenBudget,
    lastCallUsage: result.attemptUsage,
    promptCache: result.promptCache,
  }),
  runMaintenance: runHarnessContextEngineMaintenance,
  sessionManager,
  warn,
});
```

Se il mirroring fallisce, chiama comunque `afterTurn` con lo snapshot di fallback, ma registra
che il Context Engines sta facendo ingest dai dati di fallback del turno.

### 7. Normalizzare usage e runtime context della cache del prompt

I risultati Codex includono usage normalizzato dalle notifiche dei token dell'app-server quando
disponibili. Passa quell'usage nel runtime context del Context Engines.

Se l'app-server Codex espone in futuro dettagli di lettura/scrittura della cache, mappali in
`ContextEnginePromptCacheInfo`. Fino ad allora, ometti `promptCache` invece di
inventare zeri.

### 8. Policy di Compaction

Esistono due sistemi di Compaction:

1. `compact()` del Context Engines OpenClaw
2. `thread/compact/start` nativo dell'app-server Codex

Non fonderli silenziosamente.

#### `/compact` e Compaction esplicita di OpenClaw

Quando il Context Engines selezionato ha `info.ownsCompaction === true`, la
Compaction esplicita di OpenClaw dovrebbe preferire il risultato di `compact()` del Context Engines per
il mirror della trascrizione OpenClaw e per lo stato del plugin.

Quando l'harness Codex selezionato ha un binding nativo del thread, possiamo in aggiunta
richiedere la Compaction nativa di Codex per mantenere sano il thread dell'app-server, ma questo
deve essere riportato come azione backend separata nei dettagli.

Comportamento consigliato:

- Se `contextEngine.info.ownsCompaction === true`:
  - chiama prima `compact()` del Context Engines
  - poi chiama in best-effort la Compaction nativa di Codex quando esiste un binding di thread
  - restituisci il risultato del Context Engines come risultato primario
  - includi lo stato della Compaction nativa di Codex in `details.codexNativeCompaction`
- Se il Context Engines attivo non possiede la Compaction:
  - preserva il comportamento attuale della Compaction nativa di Codex

Questo probabilmente richiede di cambiare `extensions/codex/src/app-server/compact.ts` oppure
di wrappare quel file dal percorso generico di Compaction, a seconda del punto in cui
viene invocato `maybeCompactAgentHarnessSession(...)`.

#### Eventi nativi `contextCompaction` di Codex durante il turno

Codex può emettere eventi item `contextCompaction` durante un turno. Mantieni l'emissione
attuale degli hook before/after compaction in `event-projector.ts`, ma non trattarla
come una Compaction completata del Context Engines.

Per i motori che possiedono la Compaction, emetti una diagnostica esplicita quando Codex esegue comunque
la Compaction nativa:

- nome stream/evento: lo stream `compaction` esistente è accettabile
- dettagli: `{ backend: "codex-app-server", ownsCompaction: true }`

Questo rende la separazione verificabile.

### 9. Comportamento di reset della sessione e dei binding

L'attuale `reset(...)` dell'harness Codex cancella il binding dell'app-server Codex dal
file di sessione OpenClaw. Preserva questo comportamento.

Assicurati anche che la pulizia dello stato del Context Engines continui a passare attraverso i percorsi
esistenti del ciclo di vita della sessione OpenClaw. Non aggiungere una pulizia specifica di Codex a meno che il
ciclo di vita del Context Engines non perda attualmente eventi di reset/delete per tutti gli harness.

### 10. Gestione degli errori

Segui la semantica PI:

- i fallimenti del bootstrap emettono un warning e si continua
- i fallimenti di assemble emettono un warning e fanno fallback ai messaggi/prompt non assemblati della pipeline
- i fallimenti di afterTurn/ingest emettono un warning e contrassegnano come non riuscita la finalizzazione post-turno
- la manutenzione viene eseguita solo dopo turni riusciti, non interrotti e non yield
- gli errori di Compaction non devono essere ritentati come prompt freschi

Aggiunte specifiche di Codex:

- Se la proiezione del contesto fallisce, emetti un warning e fai fallback al prompt originale.
- Se il mirror della trascrizione fallisce, tenta comunque la finalizzazione del Context Engines con
  messaggi di fallback.
- Se la Compaction nativa di Codex fallisce dopo che la Compaction del Context Engines è riuscita,
  non far fallire l'intera Compaction OpenClaw quando il Context Engines è primario.

## Piano di test

### Test unitari

Aggiungi test sotto `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex chiama `bootstrap` quando esiste un file di sessione.
   - Codex chiama `assemble` con messaggi replicati, budget di token, nomi degli strumenti,
     modalità citazioni, id del modello e prompt.
   - `systemPromptAddition` è incluso nelle istruzioni developer.
   - I messaggi assemblati vengono proiettati nel prompt prima della richiesta corrente.
   - Codex chiama `afterTurn` dopo il mirroring della trascrizione.
   - Senza `afterTurn`, Codex chiama `ingestBatch` o `ingest` per messaggio.
   - La manutenzione del turno viene eseguita dopo turni riusciti.
   - La manutenzione del turno non viene eseguita in caso di prompt error, abort o yield abort.

2. `context-engine-projection.test.ts`
   - output stabile per input identici
   - nessun duplicato del prompt corrente quando la cronologia assemblata lo include
   - gestione di cronologia vuota
   - preserva l'ordine dei ruoli
   - include l'aggiunta di prompt di sistema solo nelle istruzioni developer

3. `compact.context-engine.test.ts`
   - il risultato primario del Context Engines proprietario vince
   - lo stato della Compaction nativa di Codex appare nei dettagli quando viene tentata anch'essa
   - il fallimento della Compaction nativa di Codex non fa fallire la Compaction del Context Engines proprietario
   - un Context Engines non proprietario preserva il comportamento attuale della Compaction nativa

### Test esistenti da aggiornare

- `extensions/codex/src/app-server/run-attempt.test.ts` se presente, altrimenti
  i test di esecuzione app-server Codex più vicini.
- `extensions/codex/src/app-server/event-projector.test.ts` solo se cambiano i
  dettagli degli eventi di Compaction.
- `src/agents/harness/selection.test.ts` non dovrebbe richiedere modifiche a meno che non cambi il comportamento della configurazione; dovrebbe restare stabile.
- I test PI del Context Engines dovrebbero continuare a passare invariati.

### Test di integrazione / live

Aggiungi o estendi smoke test live dell'harness Codex:

- configura `plugins.slots.contextEngine` su un motore di test
- configura `agents.defaults.model` su un modello `codex/*`
- configura `agents.defaults.embeddedHarness.runtime = "codex"`
- verifica che il motore di test abbia osservato:
  - bootstrap
  - assemble
  - afterTurn o ingest
  - manutenzione

Evita di richiedere lossless-claw nei test core di OpenClaw. Usa un piccolo
plugin Context Engines finto nel repository.

## Osservabilità

Aggiungi log di debug attorno alle chiamate del ciclo di vita del Context Engines in Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` con il motivo
- `codex native compaction completed alongside context-engine compaction`

Evita di registrare prompt completi o contenuti delle trascrizioni.

Aggiungi campi strutturati dove utile:

- `sessionId`
- `sessionKey` redatto o omesso secondo la pratica di logging esistente
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migrazione / compatibilità

Questo dovrebbe essere retrocompatibile:

- Se non è configurato alcun Context Engines, il comportamento legacy del Context Engines dovrebbe essere
  equivalente al comportamento attuale dell'harness Codex.
- Se `assemble` del Context Engines fallisce, Codex dovrebbe continuare con il
  percorso del prompt originale.
- I binding dei thread Codex esistenti dovrebbero restare validi.
- Il fingerprinting dinamico degli strumenti non dovrebbe includere l'output del Context Engines; altrimenti
  ogni cambiamento di contesto potrebbe forzare un nuovo thread Codex. Solo il catalogo
  degli strumenti dovrebbe influenzare il fingerprint dinamico degli strumenti.

## Questioni aperte

1. Il contesto assemblato dovrebbe essere iniettato interamente nel prompt utente, interamente
   nelle istruzioni developer, oppure diviso?

   Raccomandazione: dividerlo. Mettere `systemPromptAddition` nelle istruzioni developer;
   mettere il contesto della trascrizione assemblata nel wrapper del prompt utente. Questo corrisponde meglio
   all'attuale protocollo Codex senza mutare la cronologia nativa del thread.

2. La Compaction nativa di Codex dovrebbe essere disabilitata quando un Context Engines possiede
   la Compaction?

   Raccomandazione: no, non inizialmente. La Compaction nativa di Codex potrebbe essere ancora
   necessaria per mantenere vivo il thread dell'app-server. Ma deve essere riportata come
   Compaction nativa di Codex, non come Compaction del Context Engines.

3. `before_prompt_build` dovrebbe essere eseguito prima o dopo l'assemblaggio del Context Engines?

   Raccomandazione: dopo la proiezione del Context Engines per Codex, così gli hook generici dell'harness
   vedono il prompt/le istruzioni developer effettivi che Codex riceverà. Se la parità con PI
   richiede il contrario, codifica l'ordine scelto nei test e documentalo
   qui.

4. L'app-server Codex può accettare in futuro un override strutturato di contesto/cronologia?

   Sconosciuto. Se può, sostituisci il layer di proiezione testuale con quel protocollo e
   mantieni invariate le chiamate del ciclo di vita.

## Criteri di accettazione

- Un turno dell'harness incorporato `codex/*` invoca il ciclo di vita `assemble`
  del Context Engines selezionato.
- Un `systemPromptAddition` del Context Engines influisce sulle istruzioni developer di Codex.
- Il contesto assemblato influisce in modo deterministico sull'input del turno Codex.
- I turni Codex riusciti chiamano `afterTurn` o il fallback di ingest.
- I turni Codex riusciti eseguono la manutenzione del turno del Context Engines.
- I turni falliti/interrotti/yield-aborted non eseguono la manutenzione del turno.
- La Compaction posseduta dal Context Engines resta primaria per lo stato OpenClaw/plugin.
- La Compaction nativa di Codex resta verificabile come comportamento nativo di Codex.
- Il comportamento PI del Context Engines esistente non cambia.
- Il comportamento dell'harness Codex esistente non cambia quando non è selezionato alcun Context Engines non legacy
  oppure quando l'assemblaggio fallisce.
