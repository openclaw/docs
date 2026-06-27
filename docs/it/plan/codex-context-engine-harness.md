---
read_when:
    - Stai collegando il comportamento del ciclo di vita del motore di contesto all'harness Codex
    - Ti serve lossless-claw o un altro plugin di motore di contesto per lavorare con le sessioni di harness incorporate codex/*
    - Stai confrontando il comportamento del contesto incorporato di OpenClaw e del server dell'app Codex
summary: Specifica per fare in modo che l'harness app-server Codex incluso rispetti i Plugin del motore di contesto di OpenClaw
title: Porting del motore di contesto di Codex Harness
x-i18n:
    generated_at: "2026-06-27T17:43:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a757ee324e7937e30736ff8a82d86fec6b3fe93e837a71a69a6d0af911e9f395
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Stato

Specifica di implementazione in bozza.

## Obiettivo

Fare in modo che l'harness app-server Codex incluso rispetti lo stesso contratto
di ciclo di vita del motore di contesto OpenClaw che i turni OpenClaw incorporati
rispettano gia.

Una sessione che usa provider/model `agentRuntime.id: "codex"` o un modello
`codex/*` dovrebbe comunque consentire al Plugin di motore di contesto
selezionato, come `lossless-claw`, di controllare assemblaggio del contesto,
ingestione post-turno, manutenzione e policy di Compaction a livello OpenClaw
per quanto consentito dal confine dell'app-server Codex.

## Non obiettivi

- Non reimplementare gli interni dell'app-server Codex.
- Non fare in modo che la Compaction nativa dei thread Codex produca un riepilogo lossless-claw.
- Non richiedere ai modelli non Codex di usare l'harness Codex.
- Non modificare il comportamento delle sessioni ACP/acpx. Questa specifica riguarda solo il
  percorso dell'harness agente incorporato non ACP.
- Non fare registrare ai Plugin di terze parti factory di estensioni app-server Codex;
  il confine di fiducia esistente dei Plugin inclusi resta invariato.

## Architettura attuale

Il ciclo di esecuzione incorporato risolve il motore di contesto configurato una volta per esecuzione prima
di selezionare un harness concreto di basso livello:

- `src/agents/embedded-agent-runner/run.ts`
  - inizializza i Plugin di motore di contesto
  - chiama `resolveContextEngine(params.config)`
  - passa `contextEngine` e `contextTokenBudget` a
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega all'harness agente selezionato:

- `src/agents/embedded-agent-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

L'harness app-server Codex e registrato dal Plugin Codex incluso:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

L'implementazione dell'harness Codex riceve gli stessi `EmbeddedRunAttemptParams`
dei tentativi OpenClaw integrati:

- `extensions/codex/src/app-server/run-attempt.ts`

Questo significa che il punto di aggancio richiesto e nel codice controllato da OpenClaw. Il confine
esterno e il protocollo dell'app-server Codex stesso: OpenClaw puo controllare cio che
invia a `thread/start`, `thread/resume` e `turn/start`, e puo osservare
le notifiche, ma non puo modificare lo store interno dei thread di Codex o il compattatore
nativo.

## Lacuna attuale

I tentativi OpenClaw integrati chiamano direttamente il ciclo di vita del motore di contesto:

- bootstrap/manutenzione prima del tentativo
- assemblaggio prima della chiamata al modello
- afterTurn o ingestione dopo il tentativo
- manutenzione dopo un turno riuscito
- Compaction del motore di contesto per i motori che possiedono la Compaction

Codice OpenClaw pertinente:

- `src/agents/embedded-agent-runner/run/attempt.ts`
- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

I tentativi app-server Codex attualmente eseguono hook generici dell'harness agente e replicano
la trascrizione, ma non chiamano `params.contextEngine.bootstrap`,
`params.contextEngine.assemble`, `params.contextEngine.afterTurn`,
`params.contextEngine.ingestBatch`, `params.contextEngine.ingest` o
`params.contextEngine.maintain`.

Codice Codex pertinente:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamento desiderato

Per i turni dell'harness Codex, OpenClaw dovrebbe preservare questo ciclo di vita:

1. Leggere la trascrizione della sessione OpenClaw replicata.
2. Eseguire il bootstrap del motore di contesto attivo quando esiste un file di sessione precedente.
3. Eseguire la manutenzione di bootstrap quando disponibile.
4. Assemblare il contesto usando il motore di contesto attivo.
5. Convertire il contesto assemblato in input compatibili con Codex.
6. Avviare o riprendere il thread Codex con istruzioni per sviluppatori che includano qualsiasi
   `systemPromptAddition` del motore di contesto.
7. Avviare il turno Codex con il prompt assemblato visibile all'utente.
8. Replicare il risultato Codex nella trascrizione OpenClaw.
9. Chiamare `afterTurn` se implementato, altrimenti `ingestBatch`/`ingest`, usando lo
   snapshot della trascrizione replicata.
10. Eseguire la manutenzione del turno dopo turni riusciti non interrotti.
11. Preservare i segnali di Compaction nativi Codex e gli hook di Compaction OpenClaw.

## Vincoli di progettazione

### L'app-server Codex resta canonico per lo stato nativo del thread

Codex possiede il proprio thread nativo e qualsiasi cronologia estesa interna. OpenClaw non dovrebbe
provare a mutare la cronologia interna dell'app-server se non tramite chiamate di protocollo
supportate.

La trascrizione replicata di OpenClaw resta la fonte per le funzionalita OpenClaw:

- cronologia chat
- ricerca
- contabilita di `/new` e `/reset`
- cambio futuro di modello o harness
- stato dei Plugin di motore di contesto

### L'assemblaggio del motore di contesto deve essere proiettato negli input Codex

L'interfaccia del motore di contesto restituisce `AgentMessage[]` OpenClaw, non una patch
di thread Codex. `turn/start` dell'app-server Codex accetta un input utente corrente, mentre
`thread/start` e `thread/resume` accettano istruzioni per sviluppatori.

Pertanto l'implementazione necessita di un livello di proiezione. La prima versione sicura
dovrebbe evitare di fingere di poter sostituire la cronologia interna di Codex. Dovrebbe iniettare
il contesto assemblato come materiale deterministico di prompt/istruzioni per sviluppatori attorno
al turno corrente.

### La stabilita della cache del prompt conta

Per motori come lossless-claw, il contesto assemblato dovrebbe essere deterministico
per input invariati. Non aggiungere timestamp, id casuali o ordinamenti non deterministici
al testo di contesto generato.

### La semantica di selezione del runtime non cambia

La selezione dell'harness resta invariata:

- `runtime: "openclaw"` seleziona l'harness OpenClaw integrato
- `runtime: "codex"` seleziona l'harness Codex registrato
- `runtime: "auto"` consente agli harness dei Plugin di dichiarare provider supportati
- le esecuzioni `auto` senza corrispondenza usano l'harness OpenClaw integrato

Questo lavoro cambia cio che accade dopo la selezione dell'harness Codex.

## Piano di implementazione

### 1. Esportare o spostare helper riutilizzabili dei tentativi del motore di contesto

Oggi gli helper riutilizzabili del ciclo di vita vivono sotto il runner dell'agente incorporato:

- `src/agents/embedded-agent-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/embedded-agent-runner/run/attempt.prompt-helpers.ts`
- `src/agents/embedded-agent-runner/context-engine-maintenance.ts`

Codex dovrebbe importare helper neutrali rispetto all'harness invece di accedere ai dettagli
di implementazione del runner.

Creare un modulo neutrale rispetto all'harness, per esempio:

- `src/agents/harness/context-engine-lifecycle.ts`

Spostare o riesportare:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un piccolo wrapper attorno a `runContextEngineMaintenance`

Aggiornare i siti di chiamata dell'harness integrato nella stessa PR.

I nomi degli helper neutrali non dovrebbero menzionare l'harness integrato.

Nomi suggeriti:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Aggiungere un helper di proiezione del contesto Codex

Aggiungere un nuovo modulo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilita:

- Accettare gli `AgentMessage[]` assemblati, la cronologia replicata originale e il prompt
  corrente.
- Determinare quale contesto appartiene alle istruzioni per sviluppatori rispetto all'input
  utente corrente.
- Preservare il prompt utente corrente come richiesta finale azionabile.
- Rendere i messaggi precedenti in un formato stabile ed esplicito.
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

- Mettere `systemPromptAddition` nelle istruzioni per sviluppatori.
- Mettere il contesto della trascrizione assemblata prima del prompt corrente in `promptText`.
- Etichettarlo chiaramente come contesto assemblato OpenClaw.
- Mantenere il prompt corrente per ultimo.
- Escludere il prompt utente corrente duplicato se appare gia in coda.

Forma di prompt di esempio:

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

Questo e meno elegante di una modifica chirurgica della cronologia nativa Codex, ma e implementabile
dentro OpenClaw e preserva la semantica del motore di contesto.

Miglioramento futuro: se l'app-server Codex espone un protocollo per sostituire o
integrare la cronologia del thread, sostituire questo livello di proiezione per usare quell'API.

### 3. Collegare il bootstrap prima dell'avvio del thread Codex

In `extensions/codex/src/app-server/run-attempt.ts`:

- Leggere la cronologia della sessione replicata come oggi.
- Determinare se il file di sessione esisteva prima di questa esecuzione. Preferire un helper
  che controlli `fs.stat(params.sessionFile)` prima delle scritture di replica.
- Aprire un `SessionManager` o usare un adapter stretto del gestore di sessione se l'helper
  lo richiede.
- Chiamare l'helper di bootstrap neutrale quando `params.contextEngine` esiste.

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

Usare la stessa convenzione `sessionKey` del bridge degli strumenti Codex e della replica
della trascrizione. Oggi Codex calcola `sandboxSessionKey` da `params.sessionKey` o
`params.sessionId`; usarlo in modo coerente salvo che ci sia un motivo per preservare
`params.sessionKey` grezzo.

### 4. Collegare l'assemblaggio prima di `thread/start` / `thread/resume` e `turn/start`

In `runCodexAppServerAttempt`:

1. Costruire prima gli strumenti dinamici, cosi il motore di contesto vede i nomi effettivi
   degli strumenti disponibili.
2. Leggere la cronologia della sessione replicata.
3. Eseguire `assemble(...)` del motore di contesto quando `params.contextEngine` esiste.
4. Proiettare il risultato assemblato in:
   - aggiunta alle istruzioni per sviluppatori
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

1. calcolare le istruzioni per sviluppatori di base con `buildDeveloperInstructions(params)`
2. applicare assemblaggio/proiezione del motore di contesto
3. eseguire `before_prompt_build` con il prompt/le istruzioni per sviluppatori proiettati

Questo ordine consente agli hook generici del prompt di vedere lo stesso prompt che Codex ricevera. Se
serve una parita OpenClaw rigorosa, eseguire l'assemblaggio del motore di contesto prima della
composizione degli hook, perche l'harness integrato applica
`systemPromptAddition` del motore di contesto al prompt di sistema finale dopo la sua pipeline del prompt. L'
invariante importante e che sia il motore di contesto sia gli hook ottengano un ordine deterministico
e documentato.

Ordine consigliato per la prima implementazione:

1. `buildDeveloperInstructions(params)`
2. `assemble()` del motore di contesto
3. aggiungere in append/prepend `systemPromptAddition` alle istruzioni per sviluppatori
4. proiettare i messaggi assemblati nel testo del prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. passare le istruzioni per sviluppatori finali a `startOrResumeThread(...)`
7. passare il testo del prompt finale a `buildTurnStartParams(...)`

La specifica dovrebbe essere codificata nei test cosi modifiche future non la riordinino
per errore.

### 5. Preservare la formattazione stabile per la cache del prompt

L'helper di proiezione deve produrre output stabile a livello di byte per input identici:

- ordine stabile dei messaggi
- etichette di ruolo stabili
- nessun timestamp generato
- nessuna perdita di ordinamento delle chiavi degli oggetti
- nessun delimitatore casuale
- nessun id per esecuzione

Usare delimitatori fissi e sezioni esplicite.

### 6. Collegare il post-turno dopo la replica della trascrizione

Il `CodexAppServerEventProjector` di Codex crea un `messagesSnapshot` locale per il
turno corrente. `mirrorTranscriptBestEffort(...)` scrive quello snapshot nel
mirror della trascrizione di OpenClaw.

Dopo che il mirroring riesce o fallisce, chiama il finalizzatore del motore di
contesto con il miglior snapshot dei messaggi disponibile:

- Preferisci il contesto completo della sessione sottoposta a mirroring dopo la
  scrittura, perché `afterTurn` si aspetta lo snapshot della sessione, non solo
  il turno corrente.
- Ripiega su `historyMessages + result.messagesSnapshot` se il file di sessione
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

Se il mirroring fallisce, chiama comunque `afterTurn` con lo snapshot di fallback,
ma registra che il motore di contesto sta ingerendo dati dal turno di fallback.

### 7. Normalizzare l'utilizzo e il contesto runtime della cache dei prompt

I risultati di Codex includono l'utilizzo normalizzato dalle notifiche dei token
dell'app-server quando disponibile. Passa quell'utilizzo al contesto runtime del
motore di contesto.

Se l'app-server di Codex in futuro esporrà i dettagli di lettura/scrittura della
cache, mappali in `ContextEnginePromptCacheInfo`. Fino ad allora, ometti
`promptCache` invece di inventare zeri.

### 8. Policy di Compaction

Esistono due sistemi di Compaction:

1. `compact()` del motore di contesto di OpenClaw
2. `thread/compact/start` nativo dell'app-server di Codex

Non confonderli implicitamente.

#### `/compact` e Compaction esplicita di OpenClaw

Quando il motore di contesto selezionato ha `info.ownsCompaction === true`, la
Compaction esplicita di OpenClaw dovrebbe preferire il risultato di `compact()`
del motore di contesto per il mirror della trascrizione di OpenClaw e lo stato
del Plugin.

Quando l'harness Codex selezionato ha un binding nativo al thread, possiamo
inoltre richiedere la Compaction nativa di Codex per mantenere sano il thread
dell'app-server, ma questo deve essere riportato nei dettagli come un'azione di
backend separata.

Comportamento consigliato:

- Se `contextEngine.info.ownsCompaction === true`:
  - chiama prima `compact()` del motore di contesto
  - poi chiama al meglio delle possibilità la Compaction nativa di Codex quando
    esiste un binding al thread
  - restituisci il risultato del motore di contesto come risultato primario
  - includi lo stato della Compaction nativa di Codex in `details.codexNativeCompaction`
- Se il motore di contesto attivo non possiede la Compaction:
  - preserva il comportamento corrente della Compaction nativa di Codex

Questo probabilmente richiede la modifica di `extensions/codex/src/app-server/compact.ts` o
il wrapping dal percorso di Compaction generico, a seconda di dove viene invocato
`maybeCompactAgentHarnessSession(...)`.

#### Eventi `contextCompaction` nativi di Codex durante il turno

Codex può emettere eventi di elemento `contextCompaction` durante un turno.
Mantieni l'emissione corrente degli hook di Compaction prima/dopo in
`event-projector.ts`, ma non trattarla come una Compaction completata del motore
di contesto.

Per i motori che possiedono la Compaction, emetti una diagnostica esplicita
quando Codex esegue comunque la Compaction nativa:

- nome stream/evento: lo stream `compaction` esistente è accettabile
- dettagli: `{ backend: "codex-app-server", ownsCompaction: true }`

Questo rende la separazione verificabile.

### 9. Comportamento di reset della sessione e binding

L'attuale `reset(...)` dell'harness Codex cancella il binding dell'app-server di
Codex dal file di sessione di OpenClaw. Preserva questo comportamento.

Assicurati inoltre che la pulizia dello stato del motore di contesto continui ad
avvenire tramite i percorsi di ciclo di vita della sessione OpenClaw esistenti.
Non aggiungere pulizia specifica per Codex a meno che il ciclo di vita del motore
di contesto attualmente perda eventi reset/delete per tutti gli harness.

### 10. Gestione degli errori

Segui la semantica integrata di OpenClaw:

- gli errori di bootstrap emettono un avviso e continuano
- gli errori di assemblaggio emettono un avviso e ripiegano sui messaggi/prompt
  della pipeline non assemblata
- gli errori di `afterTurn`/ingestione emettono un avviso e marcano la
  finalizzazione post-turno come non riuscita
- la manutenzione viene eseguita solo dopo turni riusciti, non interrotti e senza
  yield abort
- gli errori di Compaction non dovrebbero essere ritentati come prompt nuovi

Aggiunte specifiche per Codex:

- Se la proiezione del contesto fallisce, avvisa e ripiega sul prompt originale.
- Se il mirror della trascrizione fallisce, tenta comunque la finalizzazione del
  motore di contesto con i messaggi di fallback.
- Se la Compaction nativa di Codex fallisce dopo che la Compaction del motore di
  contesto è riuscita, non far fallire l'intera Compaction di OpenClaw quando il
  motore di contesto è primario.

## Piano di test

### Test unitari

Aggiungi test sotto `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex chiama `bootstrap` quando esiste un file di sessione.
   - Codex chiama `assemble` con messaggi sottoposti a mirroring, budget di
     token, nomi degli strumenti, modalità citazioni, ID modello e prompt.
   - `systemPromptAddition` è incluso nelle istruzioni per sviluppatori.
   - I messaggi assemblati vengono proiettati nel prompt prima della richiesta
     corrente.
   - Codex chiama `afterTurn` dopo il mirroring della trascrizione.
   - Senza `afterTurn`, Codex chiama `ingestBatch` o `ingest` per messaggio.
   - La manutenzione del turno viene eseguita dopo turni riusciti.
   - La manutenzione del turno non viene eseguita in caso di errore del prompt,
     interruzione o yield abort.

2. `context-engine-projection.test.ts`
   - output stabile per input identici
   - nessun prompt corrente duplicato quando la cronologia assemblata lo include
   - gestisce una cronologia vuota
   - preserva l'ordine dei ruoli
   - include l'aggiunta al prompt di sistema solo nelle istruzioni per sviluppatori

3. `compact.context-engine.test.ts`
   - vince il risultato primario del motore di contesto proprietario
   - lo stato della Compaction nativa di Codex compare nei dettagli quando viene
     tentata anche quella
   - il fallimento nativo di Codex non fa fallire la Compaction del motore di
     contesto proprietario
   - il motore di contesto non proprietario preserva il comportamento corrente
     della Compaction nativa

### Test esistenti da aggiornare

- `extensions/codex/src/app-server/run-attempt.test.ts` se presente, altrimenti
  i test di esecuzione dell'app-server Codex più vicini.
- `extensions/codex/src/app-server/event-projector.test.ts` solo se cambiano i
  dettagli dell'evento di Compaction.
- `src/agents/harness/selection.test.ts` non dovrebbe richiedere modifiche a meno
  che cambi il comportamento di configurazione; dovrebbe restare stabile.
- I test integrati del motore di contesto dell'harness dovrebbero continuare a
  passare invariati.

### Test di integrazione / live

Aggiungi o estendi i test smoke live dell'harness Codex:

- configura `plugins.slots.contextEngine` su un motore di test
- configura `agents.defaults.model` su un modello `codex/*`
- configura provider/modello `agentRuntime.id = "codex"`
- verifica che il motore di test abbia osservato:
  - bootstrap
  - assemble
  - `afterTurn` o ingestione
  - manutenzione

Evita di richiedere lossless-claw nei test core di OpenClaw. Usa un piccolo
Plugin fittizio del motore di contesto interno al repository.

## Osservabilità

Aggiungi log di debug intorno alle chiamate al ciclo di vita del motore di
contesto Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` con motivo
- `codex native compaction completed alongside context-engine compaction`

Evita di registrare prompt completi o contenuti della trascrizione.

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

- Se non è configurato alcun motore di contesto, il comportamento del motore di
  contesto legacy dovrebbe essere equivalente al comportamento odierno
  dell'harness Codex.
- Se `assemble` del motore di contesto fallisce, Codex dovrebbe continuare con il
  percorso del prompt originale.
- I binding dei thread Codex esistenti dovrebbero restare validi.
- Il fingerprint dinamico degli strumenti non dovrebbe includere l'output del
  motore di contesto; altrimenti ogni modifica del contesto potrebbe forzare un
  nuovo thread Codex. Solo il catalogo degli strumenti dovrebbe influire sul
  fingerprint dinamico degli strumenti.

## Domande aperte

1. Il contesto assemblato dovrebbe essere iniettato interamente nel prompt
   utente, interamente nelle istruzioni per sviluppatori o suddiviso?

   Raccomandazione: suddiviso. Metti `systemPromptAddition` nelle istruzioni per
   sviluppatori; metti il contesto della trascrizione assemblata nel wrapper del
   prompt utente. Questo corrisponde meglio al protocollo Codex corrente senza
   mutare la cronologia nativa del thread.

2. La Compaction nativa di Codex dovrebbe essere disabilitata quando un motore di
   contesto possiede la Compaction?

   Raccomandazione: no, non inizialmente. La Compaction nativa di Codex potrebbe
   essere comunque necessaria per mantenere attivo il thread dell'app-server. Ma
   deve essere riportata come Compaction nativa di Codex, non come Compaction del
   motore di contesto.

3. `before_prompt_build` dovrebbe essere eseguito prima o dopo l'assemblaggio del
   motore di contesto?

   Raccomandazione: dopo la proiezione del motore di contesto per Codex, così gli
   hook generici dell'harness vedono il prompt/le istruzioni per sviluppatori
   effettivi che Codex riceverà. Se la parità con l'harness integrato richiede
   l'opposto, codifica l'ordine scelto nei test e documentalo qui.

4. L'app-server Codex può accettare in futuro un override strutturato di
   contesto/cronologia?

   Sconosciuto. Se può, sostituisci il livello di proiezione testuale con quel
   protocollo e mantieni invariate le chiamate al ciclo di vita.

## Criteri di accettazione

- Un turno dell'harness incorporato `codex/*` invoca il ciclo di vita `assemble`
  del motore di contesto selezionato.
- Un `systemPromptAddition` del motore di contesto influisce sulle istruzioni per
  sviluppatori di Codex.
- Il contesto assemblato influisce in modo deterministico sull'input del turno
  Codex.
- I turni Codex riusciti chiamano `afterTurn` o il fallback di ingestione.
- I turni Codex riusciti eseguono la manutenzione del turno del motore di
  contesto.
- I turni falliti/interrotti/con yield abort non eseguono la manutenzione del
  turno.
- La Compaction posseduta dal motore di contesto resta primaria per lo stato di
  OpenClaw/Plugin.
- La Compaction nativa di Codex resta verificabile come comportamento nativo di
  Codex.
- Il comportamento esistente del motore di contesto dell'harness integrato resta
  invariato.
- Il comportamento esistente dell'harness Codex resta invariato quando non viene
  selezionato alcun motore di contesto non legacy o quando l'assemblaggio
  fallisce.
