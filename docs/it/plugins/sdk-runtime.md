---
read_when:
    - Devi chiamare helper core da un Plugin (TTS, STT, generazione di immagini, ricerca web, sottoagente, nodi)
    - Vuoi capire cosa espone api.runtime
    - Stai accedendo agli helper di configurazione, agente o media dal codice del plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- gli helper di runtime iniettati disponibili per i Plugin
title: Helper di runtime dei Plugin
x-i18n:
    generated_at: "2026-06-30T14:09:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 028e4b75840fe228ee98440f7e86030cb4e1377b2688e0564394d1424662ca39
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Riferimento per l'oggetto `api.runtime` iniettato in ogni plugin durante la registrazione. Usa questi helper invece di importare direttamente gli elementi interni dell'host.

<CardGroup cols={2}>
  <Card title="Plugin di canale" href="/it/plugins/sdk-channel-plugins">
    Guida passo passo che usa questi helper nel contesto dei plugin di canale.
  </Card>
  <Card title="Plugin provider" href="/it/plugins/sdk-provider-plugins">
    Guida passo passo che usa questi helper nel contesto dei plugin provider.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Caricamento e scrittura della configurazione

Preferisci la configurazione già passata nel percorso di chiamata attivo, per esempio `api.config` durante la registrazione o un argomento `cfg` nei callback di canale/provider. Questo mantiene uno snapshot di processo che fluisce nel lavoro invece di rianalizzare la configurazione nei percorsi critici.

Usa `api.runtime.config.current()` solo quando un handler a lunga durata ha bisogno dello snapshot corrente del processo e nessuna configurazione è stata passata a quella funzione. Il valore restituito è di sola lettura; clonalo o usa un helper di mutazione prima di modificarlo.

Le factory di strumenti ricevono `ctx.runtimeConfig` più `ctx.getRuntimeConfig()`. Usa il getter dentro il callback `execute` di uno strumento a lunga durata quando la configurazione può cambiare dopo la creazione della definizione dello strumento.

Persisti le modifiche con `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Ogni scrittura deve scegliere una policy `afterWrite` esplicita:

- `afterWrite: { mode: "auto" }` lascia decidere al ricaricamento del Gateway.
- `afterWrite: { mode: "restart", reason: "..." }` forza un riavvio pulito quando chi scrive sa che il ricaricamento a caldo non è sicuro.
- `afterWrite: { mode: "none", reason: "..." }` sopprime ricaricamento/riavvio automatici solo quando il chiamante possiede il passaggio successivo.

Gli helper di mutazione restituiscono `afterWrite` più un riepilogo tipizzato `followUp`, così i chiamanti possono registrare o testare se hanno richiesto un riavvio. Il Gateway continua a possedere il momento in cui quel riavvio avviene effettivamente.

`api.runtime.config.loadConfig()` e `api.runtime.config.writeConfigFile(...)` sono helper di compatibilità deprecati sotto `runtime-config-load-write`. Avvisano una volta a runtime e restano disponibili per i vecchi plugin esterni durante la finestra di migrazione. I plugin in bundle non devono usarli; le guardie del confine di configurazione falliscono se il codice del plugin li chiama o importa quegli helper dai sottopercorsi dell'SDK dei plugin.

Per gli import diretti dell'SDK, usa i sottopercorsi di configurazione mirati invece del barrel di compatibilità ampio
`openclaw/plugin-sdk/config-runtime`: `config-contracts` per i
tipi, `plugin-config-runtime` per le asserzioni su configurazione già caricata e la ricerca
dell'entry del plugin, `runtime-config-snapshot` per gli snapshot correnti del processo, e
`config-mutation` per le scritture. I test dei plugin in bundle dovrebbero simulare direttamente questi sottopercorsi
mirati invece di simulare il barrel di compatibilità ampio.

Il codice runtime interno di OpenClaw segue la stessa direzione: carica la configurazione una volta al confine della CLI, del Gateway o del processo, poi passa quel valore lungo il flusso. Le scritture di mutazione riuscite aggiornano lo snapshot runtime del processo e avanzano la sua revisione interna; le cache a lunga durata dovrebbero basarsi sulla chiave cache posseduta dal runtime invece di serializzare localmente la configurazione. I moduli runtime a lunga durata hanno uno scanner a tolleranza zero per chiamate ambientali a `loadConfig()`; usa un `cfg` passato, un `context.getRuntimeConfig()` della richiesta o `getRuntimeConfig()` in un confine di processo esplicito.

I percorsi di esecuzione provider e canale devono usare lo snapshot della configurazione runtime attiva, non uno snapshot file restituito per rilettura o modifica della configurazione. Gli snapshot file preservano valori sorgente come i marker SecretRef per UI e scritture; i callback provider hanno bisogno della vista runtime risolta. Quando un helper può essere chiamato con lo snapshot sorgente attivo o con lo snapshot runtime attivo, passa attraverso `selectApplicableRuntimeConfig()` prima di leggere le credenziali.

## Utilità runtime riutilizzabili

Usa i dati `botLoopProtection` in ingresso per i messaggi in ingresso scritti da bot. Il core applica la guardia condivisa in memoria a finestra scorrevole prima della registrazione della sessione e del dispatch, senza legare la policy a un singolo canale. La guardia traccia chiavi `(scopeId, conversationId, participant pair)`, conta insieme entrambe le direzioni di una coppia, applica un cooldown una volta superato il budget della finestra e rimuove opportunisticamente le voci inattive.

I plugin di canale che espongono questo comportamento agli operatori dovrebbero preferire la forma condivisa `channels.defaults.botLoopProtection` per i budget di base, poi sovrapporre override specifici di canale/provider. La configurazione condivisa usa i secondi perché è visibile all'utente:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Passa i dati normalizzati della coppia di bot con il turno risolto. Il core risolve default, conversione di unità e semantica di `enabled`:

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

Usa `openclaw/plugin-sdk/pair-loop-guard-runtime` direttamente solo per loop di eventi
personalizzati tra due parti che non passano attraverso il runner condiviso delle risposte in ingresso.

## Namespace runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identità dell'agente, directory e gestione delle sessioni.

    ```typescript
    // Resolve the agent's working directory
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve agent workspace
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Get agent identity
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Get default thinking level
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validate a user-provided thinking level against the active provider profile
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // pass level to an embedded run
    }

    // Get agent timeout
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Ensure workspace exists
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Run an embedded agent turn
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` è l'helper neutrale per avviare un normale turno dell'agente OpenClaw dal codice del plugin. Usa la stessa risoluzione provider/modello e la stessa selezione dell'harness dell'agente delle risposte attivate dal canale.

    `runEmbeddedPiAgent(...)` resta un alias di compatibilità deprecato per i plugin esistenti. Il nuovo codice dovrebbe usare `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` restituisce i livelli di pensiero supportati dal provider/modello e l'eventuale valore predefinito. I plugin provider possiedono il profilo specifico del modello tramite i loro hook di pensiero, quindi i plugin di strumenti dovrebbero chiamare questo helper runtime invece di importare o duplicare elenchi di provider.

    `normalizeThinkingLevel(...)` converte testo utente come `on`, `x-high` o `extra high` nel livello canonico memorizzato prima di verificarlo rispetto alla policy risolta.

    **Gli helper dello store sessioni** sono sotto `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterate session rows without depending on the legacy sessions.json shape.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });
    ```

    Preferisci `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` o `upsertSessionEntry(...)` per i flussi di lavoro delle sessioni. Questi helper indirizzano le sessioni per identità agente/sessione, così i plugin non dipendono dalla forma di archiviazione legacy `sessions.json`. Usa `preserveActivity: true` per patch di soli metadati che non dovrebbero aggiornare l'attività della sessione, e `replaceEntry: true` solo quando il callback restituisce una voce completa e i campi eliminati devono restare eliminati.

    Per letture e scritture della trascrizione, importa `openclaw/plugin-sdk/session-transcript-runtime` e usa `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` o `withSessionTranscriptWriteLock(...)` con `{ agentId, sessionKey, sessionId }`. Queste API consentono ai plugin di identificare una trascrizione, leggerne gli eventi, aggiungere messaggi, pubblicare aggiornamenti ed eseguire operazioni correlate sotto lo stesso lock di scrittura della trascrizione. Passare `sessionFile`, usare `resolveSessionTranscriptLegacyFileTarget(...)` o importare `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` di basso livello da `openclaw/plugin-sdk/agent-harness-runtime` è deprecato; quei percorsi esistono solo per codice legacy che riceve già un artefatto di trascrizione attivo.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` e `resolveAndPersistSessionFile(...)` sono helper di compatibilità deprecati per plugin che dipendono ancora intenzionalmente dalla forma legacy dello store completo o del file di trascrizione. Il nuovo codice dei plugin non deve usare questi helper, e i chiamanti esistenti dovrebbero migrare agli helper di voce e agli helper di identità della trascrizione.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Costanti predefinite di modello e provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Esegui un completamento testuale posseduto dall'host senza importare elementi interni del provider o
    duplicare la preparazione di modello/autenticazione/URL di base di OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    L'helper usa lo stesso percorso di preparazione dei completamenti semplici del runtime
    integrato di OpenClaw e lo snapshot della configurazione runtime posseduto dall'host. I motori di contesto
    ricevono una capability `llm.complete` legata alla sessione, quindi le chiamate al modello usano
    l'agente della sessione attiva e non ripiegano silenziosamente sull'agente predefinito. Il
    risultato include attribuzione provider/modello/agente più utilizzo normalizzato di token,
    cache e costo stimato quando disponibile.

    <Warning>
    Gli override del modello richiedono opt-in dell'operatore tramite `plugins.entries.<id>.llm.allowModelOverride: true` nella configurazione. Usa `plugins.entries.<id>.llm.allowedModels` per limitare i plugin attendibili a specifici target canonici `provider/model`. I completamenti tra agenti richiedono `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Avvia e gestisci esecuzioni di subagenti in background.

    ```typescript
    // Start a subagent run
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // optional override
      model: "gpt-4.1-mini", // optional override
      deliver: false,
    });

    // Wait for completion
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Read session messages
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Delete a session
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Gli override dei modelli (`provider`/`model`) richiedono l'adesione esplicita dell'operatore tramite `plugins.entries.<id>.subagent.allowModelOverride: true` nella configurazione. I Plugin non attendibili possono comunque eseguire subagent, ma le richieste di override vengono rifiutate.
    </Warning>

    `deleteSession(...)` può eliminare le sessioni create dallo stesso Plugin tramite `api.runtime.subagent.run(...)`. L'eliminazione di sessioni utente o operatore arbitrarie richiede comunque una richiesta Gateway con ambito admin.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Elenca i nodi connessi e invoca un comando ospitato dal nodo dal codice del Plugin caricato dal Gateway o dai comandi CLI del Plugin. Usalo quando un Plugin possiede lavoro locale su un dispositivo abbinato, ad esempio un bridge browser o audio su un altro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    All'interno del Gateway, questo runtime è in-process. Nei comandi CLI del Plugin chiama il Gateway configurato tramite RPC, quindi comandi come `openclaw googlemeet recover-tab` possono ispezionare i nodi abbinati dal terminale. I comandi dei nodi passano comunque attraverso il normale abbinamento dei nodi del Gateway, le allowlist dei comandi, le policy node-invoke del Plugin e la gestione dei comandi locale al nodo.

    I Plugin che espongono comandi per host nodo pericolosi dovrebbero registrare una policy node-invoke con `api.registerNodeInvokePolicy(...)`. La policy viene eseguita nel Gateway dopo i controlli della allowlist dei comandi e prima che il comando venga inoltrato al nodo, quindi le chiamate dirette `node.invoke` e gli strumenti Plugin di livello superiore condividono lo stesso percorso di applicazione.

    <Warning>
    Il campo opzionale `scopes` richiede ambiti operatore del Gateway per l'invocazione. OpenClaw lo rispetta solo per i Plugin inclusi e per le installazioni di Plugin ufficiali attendibili; le richieste provenienti da altri Plugin non elevano la chiamata. Usalo solo quando un Plugin attendibile deve invocare un comando nodo con un ambito Gateway più rigoroso, come `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Associa un runtime Task Flow a una chiave di sessione OpenClaw esistente o a un contesto strumento attendibile, quindi crea e gestisci Task Flow senza passare un proprietario a ogni chiamata.

    Task Flow traccia lo stato durevole dei workflow a più passaggi. Non è uno scheduler:
    usa Cron o `api.session.workflow.scheduleSessionTurn(...)` per i risvegli futuri, quindi usa `managedFlows` dal turno pianificato quando quel lavoro
    richiede stato del flusso, attività figlie, attese o annullamento.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Review new pull requests",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Review PR #123",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    Usa `bindSession({ sessionKey, requesterOrigin })` quando hai già una chiave di sessione OpenClaw attendibile dal tuo livello di binding. Non associare da input utente grezzo.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sintesi vocale.

    ```typescript
    // Standard TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // Telephony-optimized TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // List available voices
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Usa la configurazione core `messages.tts` e la selezione del provider. Restituisce buffer audio PCM + frequenza di campionamento.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analisi di immagini, audio e video.

    ```typescript
    // Describe an image
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcribe audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // optional, for when MIME cannot be inferred
    });

    // Describe a video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Generic file analysis
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Structured image extraction through a specific provider/model.
    // Include at least one image; text inputs are supplemental context.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.5",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefer the printed total over handwritten notes." },
      ],
      instructions: "Extract vendor, total, and searchable tags.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    Restituisce `{ text: undefined }` quando non viene prodotto alcun output (ad esempio input saltato).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` rimane un alias di compatibilità per `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Generazione di immagini.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Ricerca Web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Utilità multimediali di basso livello.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    Snapshot della configurazione runtime corrente e scritture di configurazione transazionali. Preferisci
    la configurazione già passata nel percorso di chiamata attivo; usa
    `current()` solo quando l'handler necessita direttamente dello snapshot del processo.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` e `replaceConfigFile(...)` restituiscono un valore `followUp`,
    ad esempio `{ mode: "restart", requiresRestart: true, reason }`,
    che registra l'intento dello scrivente senza sottrarre al
    gateway il controllo del riavvio.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilità a livello di sistema.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Deprecated compatibility alias.
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runCommandWithTimeout(...)` restituisce `stdout` e `stderr` acquisiti, conteggi
    di troncamento opzionali, `code`, `signal`, `killed`, `termination` e
    `noOutputTimedOut`. I risultati di timeout e no-output-timeout riportano `code: 124`
    quando il processo figlio non fornisce un codice di uscita diverso da zero. Le uscite
    con segnale non dovute a timeout possono comunque restituire `code: null`, quindi usa `termination` e
    `noOutputTimedOut` per distinguere i motivi di timeout.

  </Accordion>
  <Accordion title="api.runtime.events">
    Sottoscrizioni agli eventi.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Logging.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Risoluzione dell'autenticazione di modelli e provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Risoluzione della directory di stato e storage con chiavi basato su SQLite.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Gli store con chiave sopravvivono ai riavvii e sono isolati dall'id del plugin associato al runtime. Usa `registerIfAbsent(...)` per rivendicazioni atomiche di deduplicazione: restituisce `true` quando la chiave mancava o era scaduta ed è stata registrata, oppure `false` quando esiste già un valore attivo senza sovrascriverne il valore, l'ora di creazione o il TTL. Limiti: `maxEntries` per namespace, 6.000 righe attive per plugin, valori JSON inferiori a 64 KB e scadenza TTL opzionale. Quando una scrittura supererebbe il limite di righe del plugin, il runtime può eliminare le righe attive più vecchie dal namespace in scrittura; i namespace fratelli non vengono eliminati per quella scrittura, e la scrittura fallisce comunque se il namespace non riesce a liberare abbastanza righe.

    <Warning>
    Solo plugin in bundle in questa release.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Factory degli strumenti di memoria e CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Helper runtime specifici del canale (disponibili quando viene caricato un plugin di canale).

    `api.runtime.channel.media` è la superficie preferita per il download e l'archiviazione dei contenuti multimediali del canale:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Usa `saveRemoteMedia(...)` quando un URL remoto deve diventare un contenuto multimediale OpenClaw. Usa `saveResponseMedia(...)` quando il plugin ha già recuperato una `Response` con gestione di autenticazione, reindirizzamento o allowlist di proprietà del plugin. Usa `readRemoteMediaBuffer(...)` solo quando il plugin necessita dei byte grezzi per ispezione, trasformazioni, decrittazione o nuovo caricamento. `fetchRemoteMedia(...)` rimane un alias di compatibilità deprecato per `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` è la superficie condivisa della policy delle menzioni in ingresso per i plugin di canale in bundle che usano l'iniezione runtime:

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    Helper delle menzioni disponibili:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` intenzionalmente non espone i vecchi helper di compatibilità `resolveMentionGating*`. Preferisci il percorso normalizzato `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Archiviazione dei riferimenti runtime

Usa `createPluginRuntimeStore` per archiviare il riferimento runtime da usare al di fuori della callback `register`:

<Steps>
  <Step title="Create the store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Wire into the entry point">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Access from other files">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // throws if not initialized
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // returns null if not initialized
    }
    ```

  </Step>
</Steps>

<Note>
Preferisci `pluginId` per l'identità del runtime-store. La forma di livello inferiore `key` è pensata per casi non comuni in cui un plugin necessita intenzionalmente di più di uno slot runtime.
</Note>

## Altri campi `api` di primo livello

Oltre a `api.runtime`, l'oggetto API fornisce anche:

<ParamField path="api.id" type="string">
  Id del plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nome visualizzato del plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot della configurazione corrente (snapshot runtime attivo in memoria quando disponibile).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configurazione specifica del plugin da `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger con ambito (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/configurazione precedente all'entry completa.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Risolve un percorso relativo alla radice del plugin.
</ParamField>

## Correlati

- [Interni del plugin](/it/plugins/architecture) — modello delle capability e registro
- [Punti di ingresso SDK](/it/plugins/sdk-entrypoints) — opzioni di `definePluginEntry`
- [Panoramica SDK](/it/plugins/sdk-overview) — riferimento dei sottopercorsi
