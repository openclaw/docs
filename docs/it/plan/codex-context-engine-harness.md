---
read_when:
    - Stai integrando il comportamento del ciclo di vita di context-engine nell'harness Codex
    - Ti serve lossless-claw o un altro plugin context-engine per lavorare con le sessioni harness integrate codex/*
    - Stai confrontando il comportamento del contesto di PI incorporato e dell'app-server Codex
summary: Specifica per fare in modo che l'harness app-server Codex incluso rispetti i plugin del motore di contesto OpenClaw
title: Porting del motore di contesto di Codex Harness
x-i18n:
    generated_at: "2026-05-03T21:37:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6575c25973d43c04cada6157e39c52ea5ad1cc60171cf801fe36cbb9c54c9237
    source_path: plan/codex-context-engine-harness.md
    workflow: 16
---

## Stato

Specificazione di implementazione in bozza.

## Obiettivo

Fare in modo che l'harness app-server Codex incluso rispetti lo stesso contratto
di ciclo di vita del motore di contesto OpenClaw che i turni PI integrati
rispettano già.

Una sessione che usa `agents.defaults.embeddedHarness.runtime: "codex"` o un
modello `codex/*` dovrebbe comunque consentire al plugin del motore di contesto
selezionato, come `lossless-claw`, di controllare assemblaggio del contesto,
ingest post-turno, manutenzione e policy di Compaction a livello OpenClaw nei
limiti consentiti dal confine app-server Codex.

## Non obiettivi

- Non reimplementare gli interni dell'app-server Codex.
- Non fare in modo che la Compaction nativa dei thread Codex produca un riepilogo
  lossless-claw.
- Non richiedere ai modelli non Codex di usare l'harness Codex.
- Non modificare il comportamento delle sessioni ACP/acpx. Questa specifica è
  solo per il percorso dell'harness agente integrato non ACP.
- Non fare in modo che Plugin di terze parti registrino factory di estensione
  dell'app-server Codex; il confine di fiducia esistente dei plugin inclusi resta
  invariato.

## Architettura attuale

Il loop di esecuzione integrato risolve il motore di contesto configurato una
volta per esecuzione prima di selezionare un harness concreto di basso livello:

- `src/agents/pi-embedded-runner/run.ts`
  - inizializza i plugin del motore di contesto
  - chiama `resolveContextEngine(params.config)`
  - passa `contextEngine` e `contextTokenBudget` a
    `runEmbeddedAttemptWithBackend(...)`

`runEmbeddedAttemptWithBackend(...)` delega all'harness agente selezionato:

- `src/agents/pi-embedded-runner/run/backend.ts`
- `src/agents/harness/selection.ts`

L'harness app-server Codex è registrato dal Plugin Codex incluso:

- `extensions/codex/index.ts`
- `extensions/codex/harness.ts`

L'implementazione dell'harness Codex riceve gli stessi
`EmbeddedRunAttemptParams` dei tentativi basati su PI:

- `extensions/codex/src/app-server/run-attempt.ts`

Questo significa che il punto di hook richiesto è in codice controllato da
OpenClaw. Il confine esterno è il protocollo app-server Codex stesso: OpenClaw
può controllare cosa invia a `thread/start`, `thread/resume` e `turn/start`, e
può osservare le notifiche, ma non può modificare lo store interno dei thread di
Codex né il compattatore nativo.

## Lacuna attuale

I tentativi PI integrati chiamano direttamente il ciclo di vita del motore di
contesto:

- bootstrap/manutenzione prima del tentativo
- assemblaggio prima della chiamata al modello
- afterTurn o ingest dopo il tentativo
- manutenzione dopo un turno riuscito
- Compaction del motore di contesto per i motori che possiedono la Compaction

Codice PI rilevante:

- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

I tentativi app-server Codex attualmente eseguono hook generici dell'harness
agente e rispecchiano la trascrizione, ma non chiamano
`params.contextEngine.bootstrap`, `params.contextEngine.assemble`,
`params.contextEngine.afterTurn`, `params.contextEngine.ingestBatch`,
`params.contextEngine.ingest` o `params.contextEngine.maintain`.

Codice Codex rilevante:

- `extensions/codex/src/app-server/run-attempt.ts`
- `extensions/codex/src/app-server/thread-lifecycle.ts`
- `extensions/codex/src/app-server/event-projector.ts`
- `extensions/codex/src/app-server/compact.ts`

## Comportamento desiderato

Per i turni dell'harness Codex, OpenClaw dovrebbe preservare questo ciclo di
vita:

1. Leggere la trascrizione rispecchiata della sessione OpenClaw.
2. Eseguire il bootstrap del motore di contesto attivo quando esiste un file di
   sessione precedente.
3. Eseguire la manutenzione di bootstrap quando disponibile.
4. Assemblare il contesto usando il motore di contesto attivo.
5. Convertire il contesto assemblato in input compatibili con Codex.
6. Avviare o riprendere il thread Codex con istruzioni per sviluppatori che
   includono eventuali `systemPromptAddition` del motore di contesto.
7. Avviare il turno Codex con il prompt rivolto all'utente assemblato.
8. Rispecchiare il risultato Codex nella trascrizione OpenClaw.
9. Chiamare `afterTurn` se implementato, altrimenti `ingestBatch`/`ingest`,
   usando lo snapshot della trascrizione rispecchiata.
10. Eseguire la manutenzione del turno dopo turni riusciti e non interrotti.
11. Preservare i segnali di Compaction nativa Codex e gli hook di Compaction
    OpenClaw.

## Vincoli di progettazione

### L'app-server Codex resta canonico per lo stato nativo dei thread

Codex possiede il proprio thread nativo e qualsiasi cronologia estesa interna.
OpenClaw non dovrebbe tentare di mutare la cronologia interna dell'app-server se
non tramite chiamate di protocollo supportate.

Il mirror della trascrizione OpenClaw resta la fonte per le funzionalità
OpenClaw:

- cronologia chat
- ricerca
- contabilità di `/new` e `/reset`
- futuro cambio di modello o harness
- stato del plugin del motore di contesto

### L'assemblaggio del motore di contesto deve essere proiettato negli input Codex

L'interfaccia del motore di contesto restituisce `AgentMessage[]` OpenClaw, non
una patch del thread Codex. `turn/start` dell'app-server Codex accetta un input
utente corrente, mentre `thread/start` e `thread/resume` accettano istruzioni per
sviluppatori.

Pertanto l'implementazione necessita di un livello di proiezione. La prima
versione sicura dovrebbe evitare di fingere di poter sostituire la cronologia
interna di Codex. Dovrebbe iniettare il contesto assemblato come materiale
deterministico di prompt/istruzioni per sviluppatori attorno al turno corrente.

### La stabilità della cache dei prompt è importante

Per motori come lossless-claw, il contesto assemblato dovrebbe essere
deterministico per input invariati. Non aggiungere timestamp, id casuali o
ordinamenti non deterministici al testo di contesto generato.

### La semantica di selezione del runtime non cambia

La selezione dell'harness resta invariata:

- `runtime: "pi"` forza PI
- `runtime: "codex"` seleziona l'harness Codex registrato
- `runtime: "auto"` consente agli harness dei plugin di rivendicare provider
  supportati
- le esecuzioni `auto` senza corrispondenza usano PI

Questo lavoro cambia ciò che accade dopo la selezione dell'harness Codex.

## Piano di implementazione

### 1. Esportare o ricollocare helper riutilizzabili per i tentativi del motore di contesto

Oggi gli helper riutilizzabili del ciclo di vita vivono sotto il runner PI:

- `src/agents/pi-embedded-runner/run/attempt.context-engine-helpers.ts`
- `src/agents/pi-embedded-runner/run/attempt.prompt-helpers.ts`
- `src/agents/pi-embedded-runner/context-engine-maintenance.ts`

Codex non dovrebbe importare da un percorso di implementazione il cui nome
implica PI, se possiamo evitarlo.

Creare un modulo neutro rispetto all'harness, per esempio:

- `src/agents/harness/context-engine-lifecycle.ts`

Spostare o riesportare:

- `runAttemptContextEngineBootstrap`
- `assembleAttemptContextEngine`
- `finalizeAttemptContextEngineTurn`
- `buildAfterTurnRuntimeContext`
- `buildAfterTurnRuntimeContextFromUsage`
- un piccolo wrapper attorno a `runContextEngineMaintenance`

Mantenere funzionanti gli import PI riesportando dai vecchi file oppure
aggiornando i call site PI nella stessa PR.

I nomi degli helper neutri non dovrebbero menzionare PI.

Nomi suggeriti:

- `bootstrapHarnessContextEngine`
- `assembleHarnessContextEngine`
- `finalizeHarnessContextEngineTurn`
- `buildHarnessContextEngineRuntimeContext`
- `runHarnessContextEngineMaintenance`

### 2. Aggiungere un helper di proiezione del contesto Codex

Aggiungere un nuovo modulo:

- `extensions/codex/src/app-server/context-engine-projection.ts`

Responsabilità:

- Accettare `AgentMessage[]` assemblati, la cronologia originale rispecchiata e
  il prompt corrente.
- Determinare quale contesto appartiene alle istruzioni per sviluppatori rispetto
  all'input utente corrente.
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

- Inserire `systemPromptAddition` nelle istruzioni per sviluppatori.
- Inserire il contesto della trascrizione assemblata prima del prompt corrente in
  `promptText`.
- Etichettarlo chiaramente come contesto assemblato OpenClaw.
- Mantenere il prompt corrente per ultimo.
- Escludere il prompt utente corrente duplicato se appare già in coda.

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

Questo è meno elegante della modifica nativa della cronologia Codex, ma è
implementabile dentro OpenClaw e preserva la semantica del motore di contesto.

Miglioramento futuro: se l'app-server Codex espone un protocollo per sostituire o
integrare la cronologia del thread, modificare questo livello di proiezione per
usare quell'API.

### 3. Collegare il bootstrap prima dell'avvio del thread Codex

In `extensions/codex/src/app-server/run-attempt.ts`:

- Leggere la cronologia della sessione rispecchiata come oggi.
- Determinare se il file di sessione esisteva prima di questa esecuzione.
  Preferire un helper che controlli `fs.stat(params.sessionFile)` prima delle
  scritture di mirroring.
- Aprire un `SessionManager` o usare un adapter stretto per il session manager se
  l'helper lo richiede.
- Chiamare l'helper di bootstrap neutro quando `params.contextEngine` esiste.

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

Usare la stessa convenzione `sessionKey` del bridge strumenti Codex e del mirror
della trascrizione. Oggi Codex calcola `sandboxSessionKey` da
`params.sessionKey` o `params.sessionId`; usarlo in modo coerente, salvo che ci
sia una ragione per preservare `params.sessionKey` grezzo.

### 4. Collegare l'assemblaggio prima di `thread/start` / `thread/resume` e `turn/start`

In `runCodexAppServerAttempt`:

1. Costruire prima gli strumenti dinamici, così il motore di contesto vede i nomi
   effettivi degli strumenti disponibili.
2. Leggere la cronologia della sessione rispecchiata.
3. Eseguire `assemble(...)` del motore di contesto quando
   `params.contextEngine` esiste.
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

1. calcolare le istruzioni base per sviluppatori con
   `buildDeveloperInstructions(params)`
2. applicare assemblaggio/proiezione del motore di contesto
3. eseguire `before_prompt_build` con prompt/istruzioni per sviluppatori
   proiettati

Questo ordine consente agli hook generici dei prompt di vedere lo stesso prompt
che Codex riceverà. Se serve parità stretta con PI, eseguire l'assemblaggio del
motore di contesto prima della composizione degli hook, perché PI applica
`systemPromptAddition` del motore di contesto al prompt di sistema finale dopo la
sua pipeline di prompt. L'invariante importante è che sia il motore di contesto
sia gli hook abbiano un ordine deterministico e documentato.

Ordine consigliato per la prima implementazione:

1. `buildDeveloperInstructions(params)`
2. `assemble()` del motore di contesto
3. aggiungere/preporre `systemPromptAddition` alle istruzioni per sviluppatori
4. proiettare i messaggi assemblati nel testo del prompt
5. `resolveAgentHarnessBeforePromptBuildResult(...)`
6. passare le istruzioni finali per sviluppatori a `startOrResumeThread(...)`
7. passare il testo finale del prompt a `buildTurnStartParams(...)`

La specifica dovrebbe essere codificata nei test così che modifiche future non
ne riordinino i passi per errore.

### 5. Preservare la formattazione stabile della cache dei prompt

L'helper di proiezione deve produrre output stabile a livello di byte per input
identici:

- ordine stabile dei messaggi
- etichette dei ruoli stabili
- nessun timestamp generato
- nessuna fuga dell'ordine delle chiavi degli oggetti
- nessun delimitatore casuale
- nessun id per esecuzione

Usare delimitatori fissi e sezioni esplicite.

### 6. Collegare il post-turno dopo il mirroring della trascrizione

Codex `CodexAppServerEventProjector` crea un `messagesSnapshot` locale per il
turno corrente. `mirrorTranscriptBestEffort(...)` scrive quello snapshot nel
mirror della trascrizione di OpenClaw.

Dopo che il mirroring riesce o fallisce, chiama il finalizzatore del motore di
contesto con il miglior snapshot dei messaggi disponibile:

- Preferisci il contesto completo della sessione con mirroring dopo la scrittura, perché `afterTurn`
  si aspetta lo snapshot della sessione, non solo il turno corrente.
- Ripiega su `historyMessages + result.messagesSnapshot` se il file della sessione
  non può essere riaperto.

Flusso pseudo:

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
che il motore di contesto sta importando dai dati di turno di fallback.

### 7. Normalizzare il contesto di runtime di utilizzo e prompt-cache

I risultati di Codex includono l'utilizzo normalizzato dalle notifiche dei token app-server quando
disponibili. Passa quell'utilizzo nel contesto di runtime del motore di contesto.

Se Codex app-server espone in futuro dettagli di lettura/scrittura della cache, mappali in
`ContextEnginePromptCacheInfo`. Fino ad allora, ometti `promptCache` invece di
inventare zeri.

### 8. Criterio di Compaction

Ci sono due sistemi di Compaction:

1. `compact()` del motore di contesto OpenClaw
2. `thread/compact/start` nativo di Codex app-server

Non confonderli silenziosamente.

#### `/compact` e Compaction OpenClaw esplicita

Quando il motore di contesto selezionato ha `info.ownsCompaction === true`, la Compaction
OpenClaw esplicita dovrebbe preferire il risultato `compact()` del motore di contesto per
il mirror della trascrizione di OpenClaw e lo stato del Plugin.

Quando l'harness Codex selezionato ha un'associazione nativa al thread, possiamo inoltre
richiedere la Compaction nativa Codex per mantenere sano il thread app-server, ma questo
deve essere riportato come azione backend separata nei dettagli.

Comportamento consigliato:

- Se `contextEngine.info.ownsCompaction === true`:
  - chiama prima `compact()` del motore di contesto
  - poi chiama in modo best-effort la Compaction nativa Codex quando esiste un'associazione al thread
  - restituisci il risultato del motore di contesto come risultato primario
  - includi lo stato della Compaction nativa Codex in `details.codexNativeCompaction`
- Se il motore di contesto attivo non possiede la Compaction:
  - preserva il comportamento attuale della Compaction nativa Codex

Questo probabilmente richiede di modificare `extensions/codex/src/app-server/compact.ts` o
di incapsularlo dal percorso di Compaction generico, a seconda di dove viene invocato
`maybeCompactAgentHarnessSession(...)`.

#### Eventi contextCompaction nativi Codex durante il turno

Codex può emettere eventi di elemento `contextCompaction` durante un turno. Mantieni l'emissione
attuale degli hook di Compaction before/after in `event-projector.ts`, ma non trattarla
come una Compaction del motore di contesto completata.

Per i motori che possiedono la Compaction, emetti una diagnostica esplicita quando Codex esegue
comunque la Compaction nativa:

- nome stream/evento: lo stream `compaction` esistente è accettabile
- dettagli: `{ backend: "codex-app-server", ownsCompaction: true }`

Questo rende verificabile la separazione.

### 9. Reset della sessione e comportamento di binding

Il `reset(...)` esistente dell'harness Codex cancella l'associazione Codex app-server dal
file di sessione OpenClaw. Preserva questo comportamento.

Assicurati inoltre che la pulizia dello stato del motore di contesto continui ad avvenire tramite
i percorsi esistenti del ciclo di vita della sessione OpenClaw. Non aggiungere pulizia specifica di Codex a meno che
il ciclo di vita del motore di contesto non perda attualmente eventi di reset/eliminazione per tutti gli harness.

### 10. Gestione degli errori

Segui la semantica PI:

- gli errori di bootstrap avvisano e continuano
- gli errori di assemble avvisano e ripiegano sui messaggi/prompt della pipeline non assemblata
- gli errori afterTurn/ingest avvisano e marcano la finalizzazione post-turno come non riuscita
- la manutenzione viene eseguita solo dopo turni riusciti, non interrotti e non yield
- gli errori di Compaction non dovrebbero essere ritentati come prompt nuovi

Aggiunte specifiche di Codex:

- Se la proiezione del contesto fallisce, avvisa e ripiega sul prompt originale.
- Se il mirror della trascrizione fallisce, tenta comunque la finalizzazione del motore di contesto con
  messaggi di fallback.
- Se la Compaction nativa Codex fallisce dopo che la Compaction del motore di contesto è riuscita,
  non far fallire l'intera Compaction OpenClaw quando il motore di contesto è primario.

## Piano di test

### Test unitari

Aggiungi test sotto `extensions/codex/src/app-server`:

1. `run-attempt.context-engine.test.ts`
   - Codex chiama `bootstrap` quando esiste un file di sessione.
   - Codex chiama `assemble` con messaggi con mirroring, budget di token, nomi degli strumenti,
     modalità delle citazioni, id del modello e prompt.
   - `systemPromptAddition` è incluso nelle istruzioni developer.
   - I messaggi assemblati sono proiettati nel prompt prima della richiesta corrente.
   - Codex chiama `afterTurn` dopo il mirroring della trascrizione.
   - Senza `afterTurn`, Codex chiama `ingestBatch` o `ingest` per messaggio.
   - La manutenzione del turno viene eseguita dopo i turni riusciti.
   - La manutenzione del turno non viene eseguita su errore del prompt, abort o yield abort.

2. `context-engine-projection.test.ts`
   - output stabile per input identici
   - nessun prompt corrente duplicato quando la cronologia assemblata lo include
   - gestisce la cronologia vuota
   - preserva l'ordine dei ruoli
   - include l'aggiunta al prompt di sistema solo nelle istruzioni developer

3. `compact.context-engine.test.ts`
   - il risultato primario del motore di contesto proprietario vince
   - lo stato della Compaction nativa Codex appare nei dettagli quando viene tentata anche quella
   - il fallimento nativo Codex non fa fallire la Compaction del motore di contesto proprietario
   - il motore di contesto non proprietario preserva il comportamento attuale della Compaction nativa

### Test esistenti da aggiornare

- `extensions/codex/src/app-server/run-attempt.test.ts` se presente, altrimenti
  i test di esecuzione Codex app-server più vicini.
- `extensions/codex/src/app-server/event-projector.test.ts` solo se cambiano i dettagli degli eventi di Compaction.
- `src/agents/harness/selection.test.ts` non dovrebbe richiedere modifiche a meno che non cambi il comportamento
  della configurazione; dovrebbe rimanere stabile.
- I test del motore di contesto PI dovrebbero continuare a passare invariati.

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

Evita di richiedere lossless-claw nei test core di OpenClaw. Usa un piccolo Plugin
finto del motore di contesto interno al repo.

## Osservabilità

Aggiungi log di debug attorno alle chiamate del ciclo di vita del motore di contesto Codex:

- `codex context engine bootstrap started/completed/failed`
- `codex context engine assemble applied`
- `codex context engine finalize completed/failed`
- `codex context engine maintenance skipped` con motivo
- `codex native compaction completed alongside context-engine compaction`

Evita di registrare prompt completi o contenuti della trascrizione.

Aggiungi campi strutturati dove utili:

- `sessionId`
- `sessionKey` redatto o omesso secondo la prassi di logging esistente
- `engineId`
- `threadId`
- `turnId`
- `assembledMessageCount`
- `estimatedTokens`
- `hasSystemPromptAddition`

## Migrazione / compatibilità

Questo dovrebbe essere retrocompatibile:

- Se non è configurato alcun motore di contesto, il comportamento legacy del motore di contesto dovrebbe essere
  equivalente al comportamento attuale dell'harness Codex.
- Se `assemble` del motore di contesto fallisce, Codex dovrebbe continuare con il percorso del
  prompt originale.
- Le associazioni thread Codex esistenti dovrebbero rimanere valide.
- Il fingerprinting dinamico degli strumenti non dovrebbe includere l'output del motore di contesto; altrimenti
  ogni modifica del contesto potrebbe forzare un nuovo thread Codex. Solo il catalogo degli strumenti
  dovrebbe influire sul fingerprint dinamico degli strumenti.

## Domande aperte

1. Il contesto assemblato dovrebbe essere iniettato interamente nel prompt utente, interamente
   nelle istruzioni developer, o diviso?

   Raccomandazione: dividerlo. Metti `systemPromptAddition` nelle istruzioni developer;
   metti il contesto della trascrizione assemblata nel wrapper del prompt utente. Questo corrisponde meglio
   al protocollo Codex attuale senza mutare la cronologia nativa del thread.

2. La Compaction nativa Codex dovrebbe essere disabilitata quando un motore di contesto possiede
   la Compaction?

   Raccomandazione: no, non inizialmente. La Compaction nativa Codex può essere ancora
   necessaria per mantenere vivo il thread app-server. Ma deve essere riportata come
   Compaction Codex nativa, non come Compaction del motore di contesto.

3. `before_prompt_build` dovrebbe essere eseguito prima o dopo l'assemblaggio del motore di contesto?

   Raccomandazione: dopo la proiezione del motore di contesto per Codex, così gli hook generici dell'harness
   vedono il prompt/le istruzioni developer effettivi che Codex riceverà. Se la
   parità PI richiede l'opposto, codifica l'ordine scelto nei test e documentalo
   qui.

4. Codex app-server può accettare in futuro un override strutturato di contesto/cronologia?

   Sconosciuto. Se può, sostituisci il livello di proiezione testuale con quel protocollo e
   mantieni invariate le chiamate del ciclo di vita.

## Criteri di accettazione

- Un turno dell'harness embedded `codex/*` invoca il ciclo di vita assemble del
  motore di contesto selezionato.
- Un `systemPromptAddition` del motore di contesto influisce sulle istruzioni developer di Codex.
- Il contesto assemblato influisce sull'input del turno Codex in modo deterministico.
- I turni Codex riusciti chiamano `afterTurn` o il fallback ingest.
- I turni Codex riusciti eseguono la manutenzione del turno del motore di contesto.
- I turni falliti/interrotti/yield-aborted non eseguono la manutenzione del turno.
- La Compaction posseduta dal motore di contesto rimane primaria per lo stato OpenClaw/Plugin.
- La Compaction nativa Codex rimane verificabile come comportamento nativo Codex.
- Il comportamento esistente del motore di contesto PI è invariato.
- Il comportamento esistente dell'harness Codex è invariato quando non è selezionato alcun motore di contesto non legacy
  o quando l'assemblaggio fallisce.
