---
read_when:
    - Devi chiamare gli helper core da un Plugin (TTS, STT, generazione di immagini, ricerca web, sottoagente, nodi)
    - Vuoi capire cosa espone api.runtime
    - Stai accedendo agli helper di configurazione, agente o media dal codice del Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- gli helper di runtime iniettati disponibili per i plugin
title: Helper di runtime del Plugin
x-i18n:
    generated_at: "2026-06-27T18:01:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Riferimento per l'oggetto `api.runtime` iniettato in ogni plugin durante la registrazione. Usa questi helper invece di importare direttamente gli elementi interni dell'host.

<CardGroup cols={2}>
  <Card title="Plugin di canale" href="/it/plugins/sdk-channel-plugins">
    Guida passo per passo che usa questi helper nel contesto dei plugin di canale.
  </Card>
  <Card title="Plugin provider" href="/it/plugins/sdk-provider-plugins">
    Guida passo per passo che usa questi helper nel contesto dei plugin provider.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Caricamento e scritture della configurazione

Preferisci la configurazione già passata nel percorso di chiamata attivo, per esempio `api.config` durante la registrazione o un argomento `cfg` nei callback di canale/provider. Questo mantiene un singolo snapshot di processo lungo tutto il lavoro invece di rianalizzare la configurazione nei percorsi critici.

Usa `api.runtime.config.current()` solo quando un handler a vita lunga ha bisogno dello snapshot di processo corrente e a quella funzione non è stata passata alcuna configurazione. Il valore restituito è di sola lettura; clonalo o usa un helper di mutazione prima di modificarlo.

Le factory di strumenti ricevono `ctx.runtimeConfig` più `ctx.getRuntimeConfig()`. Usa il getter dentro il callback `execute` di uno strumento a vita lunga quando la configurazione può cambiare dopo la creazione della definizione dello strumento.

Persiste le modifiche con `api.runtime.config.mutateConfigFile(...)` o `api.runtime.config.replaceConfigFile(...)`. Ogni scrittura deve scegliere una policy `afterWrite` esplicita:

- `afterWrite: { mode: "auto" }` lascia decidere al planner di reload del gateway.
- `afterWrite: { mode: "restart", reason: "..." }` forza un riavvio pulito quando chi scrive sa che l'hot reload non è sicuro.
- `afterWrite: { mode: "none", reason: "..." }` sopprime il reload/riavvio automatico solo quando il chiamante possiede il passaggio successivo.

Gli helper di mutazione restituiscono `afterWrite` più un riepilogo `followUp` tipizzato, così i chiamanti possono registrare nei log o testare se hanno richiesto un riavvio. Il gateway resta responsabile di quando quel riavvio avviene effettivamente.

`api.runtime.config.loadConfig()` e `api.runtime.config.writeConfigFile(...)` sono helper di compatibilità deprecati sotto `runtime-config-load-write`. Emettono un avviso una volta a runtime e restano disponibili per i vecchi plugin esterni durante la finestra di migrazione. I plugin inclusi non devono usarli; le guardie del confine di configurazione falliscono se il codice del plugin li chiama o importa quegli helper dai sottopercorsi dell'SDK dei plugin.

Per le importazioni dirette dell'SDK, usa i sottopercorsi di configurazione mirati invece del barrel di compatibilità ampio
`openclaw/plugin-sdk/config-runtime`: `config-contracts` per i
tipi, `plugin-config-runtime` per le asserzioni sulla configurazione già caricata e la ricerca
delle entry dei plugin, `runtime-config-snapshot` per gli snapshot di processo correnti e
`config-mutation` per le scritture. I test dei plugin inclusi dovrebbero eseguire il mock diretto di questi
sottopercorsi mirati invece di eseguire il mock del barrel di compatibilità ampio.

Il codice runtime interno di OpenClaw segue la stessa direzione: carica la configurazione una volta al confine della CLI, del gateway o del processo, poi passa quel valore lungo il flusso. Le scritture di mutazione riuscite aggiornano lo snapshot runtime del processo e avanzano la sua revisione interna; le cache a vita lunga dovrebbero basarsi sulla chiave di cache posseduta dal runtime invece di serializzare localmente la configurazione. I moduli runtime a vita lunga hanno uno scanner a tolleranza zero per chiamate ambientali a `loadConfig()`; usa un `cfg` passato, un `context.getRuntimeConfig()` della richiesta o `getRuntimeConfig()` a un confine di processo esplicito.

I percorsi di esecuzione provider e canale devono usare lo snapshot di configurazione runtime attivo, non uno snapshot di file restituito per rilettura o modifica della configurazione. Gli snapshot di file preservano valori sorgente come i marker SecretRef per UI e scritture; i callback provider hanno bisogno della vista runtime risolta. Quando un helper può essere chiamato con lo snapshot sorgente attivo o con lo snapshot runtime attivo, passa attraverso `selectApplicableRuntimeConfig()` prima di leggere le credenziali.

## Utilità runtime riutilizzabili

Usa i fatti `botLoopProtection` in ingresso per i messaggi in ingresso scritti da bot. Il core applica la guardia condivisa in memoria a finestra scorrevole prima del record di sessione e del dispatch, senza legare la policy a un solo canale. La guardia traccia chiavi `(scopeId, conversationId, participant pair)`, conta insieme entrambe le direzioni di una coppia, applica un cooldown una volta superato il budget della finestra e pota opportunisticamente le voci inattive.

I plugin di canale che espongono questo comportamento agli operatori dovrebbero preferire la forma condivisa `channels.defaults.botLoopProtection` per i budget di base, quindi aggiungere sopra override specifici per canale/provider. La configurazione condivisa usa i secondi perché è visibile all'utente:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Passa i fatti normalizzati della coppia di bot con il turno risolto. Il core risolve default, conversione delle unità e semantica di `enabled`:

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

Usa direttamente `openclaw/plugin-sdk/pair-loop-guard-runtime` solo per loop di eventi
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
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` è l'helper neutro per avviare un normale turno dell'agente OpenClaw dal codice del plugin. Usa la stessa risoluzione di provider/modello e la stessa selezione dell'harness agente delle risposte attivate dai canali.

    `runEmbeddedPiAgent(...)` resta un alias di compatibilità deprecato per i plugin esistenti. Il nuovo codice dovrebbe usare `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` restituisce i livelli di thinking supportati dal provider/modello e il default opzionale. I plugin provider possiedono il profilo specifico del modello tramite i loro hook di thinking, quindi i plugin di strumenti dovrebbero chiamare questo helper runtime invece di importare o duplicare liste di provider.

    `normalizeThinkingLevel(...)` converte testo utente come `on`, `x-high` o `extra high` nel livello memorizzato canonico prima di confrontarlo con la policy risolta.

    Gli **helper dello store delle sessioni** sono sotto `api.runtime.agent.session`:

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

    Preferisci `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` o `upsertSessionEntry(...)` per i workflow di sessione. Questi helper indirizzano le sessioni per identità agente/sessione, così i plugin non dipendono dalla forma di storage legacy `sessions.json`. Usa `preserveActivity: true` per patch di soli metadati che non dovrebbero aggiornare l'attività della sessione, e `replaceEntry: true` solo quando il callback restituisce una voce completa e i campi eliminati devono restare eliminati.

    Per letture e scritture delle trascrizioni, importa `openclaw/plugin-sdk/session-transcript-runtime` e usa `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` o `withSessionTranscriptWriteLock(...)` con `{ agentId, sessionKey, sessionId }`. Queste API permettono ai plugin di identificare una trascrizione, leggere i suoi eventi, aggiungere messaggi, pubblicare aggiornamenti ed eseguire operazioni correlate sotto lo stesso lock di scrittura della trascrizione. Passa `sessionFile` solo quando adatti codice che riceve già un artefatto di trascrizione attivo e ha bisogno che ogni helper operi su quello stesso artefatto.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)` e `resolveSessionFilePath(...)` sono helper di compatibilità per plugin che dipendono ancora intenzionalmente dalla forma legacy dell'intero store o del file di trascrizione. Il nuovo codice dei plugin non deve usare quegli helper, e i chiamanti esistenti dovrebbero migrare agli helper per voce.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Costanti di default per modello e provider:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Esegui un completamento di testo posseduto dall'host senza importare elementi interni del provider né
    duplicare la preparazione di modello/autenticazione/base URL di OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    L'helper usa lo stesso percorso di preparazione dei completamenti semplici del runtime
    integrato di OpenClaw e lo snapshot di configurazione runtime posseduto dall'host. I motori di contesto
    ricevono una capability `llm.complete` legata alla sessione, quindi le chiamate al modello usano
    l'agente della sessione attiva e non ricadono silenziosamente sull'agente predefinito. Il
    risultato include attribuzione di provider/modello/agente più utilizzo normalizzato di token,
    cache e costo stimato quando disponibile.

    <Warning>
    Gli override del modello richiedono l'opt-in dell'operatore tramite `plugins.entries.<id>.llm.allowModelOverride: true` nella configurazione. Usa `plugins.entries.<id>.llm.allowedModels` per limitare i plugin attendibili a target canonici `provider/model` specifici. I completamenti tra agenti richiedono `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
    Gli override del modello (`provider`/`model`) richiedono l'adesione esplicita dell'operatore tramite `plugins.entries.<id>.subagent.allowModelOverride: true` nella configurazione. I Plugin non attendibili possono comunque eseguire subagenti, ma le richieste di override vengono rifiutate.
    </Warning>

    `deleteSession(...)` può eliminare le sessioni create dallo stesso Plugin tramite `api.runtime.subagent.run(...)`. L'eliminazione di sessioni arbitrarie di utenti o operatori richiede comunque una richiesta Gateway con ambito amministratore.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Elenca i Node connessi e invoca un comando ospitato da un Node da codice Plugin caricato dal Gateway o da comandi CLI del Plugin. Usalo quando un Plugin possiede lavoro locale su un dispositivo associato, ad esempio un bridge browser o audio su un altro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    All'interno del Gateway questo runtime è in-process. Nei comandi CLI del Plugin chiama il Gateway configurato tramite RPC, quindi comandi come `openclaw googlemeet recover-tab` possono ispezionare i Node associati dal terminale. I comandi Node passano comunque attraverso la normale associazione dei Node del Gateway, le allowlist dei comandi, le policy di invocazione dei Node del Plugin e la gestione dei comandi locale al Node.

    I Plugin che espongono comandi per host Node pericolosi devono registrare una policy di invocazione Node con `api.registerNodeInvokePolicy(...)`. La policy viene eseguita nel Gateway dopo i controlli della allowlist dei comandi e prima che il comando venga inoltrato al Node, quindi le chiamate dirette `node.invoke` e gli strumenti Plugin di livello più alto condividono lo stesso percorso di applicazione.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Associa un runtime Task Flow a una chiave di sessione OpenClaw esistente o a un contesto strumento attendibile, quindi crea e gestisci Task Flow senza passare un proprietario a ogni chiamata.

    Task Flow tiene traccia dello stato durevole di workflow multi-step. Non è un pianificatore:
    usa Cron o `api.session.workflow.scheduleSessionTurn(...)` per risvegli futuri,
    poi usa `managedFlows` dal turno pianificato quando quel lavoro
    richiede stato del flow, attività figlie, attese o annullamento.

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

    Usa `bindSession({ sessionKey, requesterOrigin })` quando hai già una chiave di sessione OpenClaw attendibile dal tuo livello di binding. Non eseguire il binding da input utente grezzo.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sintesi vocale da testo.

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
    Utility multimediali di basso livello.

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
    Snapshot della configurazione runtime corrente e scritture transazionali della configurazione. Preferisci
    la configurazione già passata nel percorso di chiamata attivo; usa
    `current()` solo quando l'handler ha bisogno direttamente dello snapshot del processo.

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
    che registra l'intento dello scrittore senza sottrarre il controllo del riavvio al
    Gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utility a livello di sistema.

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

    `runCommandWithTimeout(...)` restituisce `stdout` e `stderr` catturati, conteggi opzionali
    di troncamento, `code`, `signal`, `killed`, `termination` e
    `noOutputTimedOut`. I risultati di timeout e di timeout senza output riportano `code: 124`
    quando il processo figlio non fornisce un codice di uscita diverso da zero. Le uscite
    per segnale non dovute a timeout possono comunque restituire `code: null`, quindi usa `termination` e
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
    Risoluzione dell'autenticazione di modello e provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Risoluzione della directory di stato e storage a chiave basato su SQLite.

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

    Gli store con chiave sopravvivono ai riavvii e sono isolati dall'id del plugin associato al runtime. Usa `registerIfAbsent(...)` per rivendicazioni atomiche di deduplicazione: restituisce `true` quando la chiave era assente o scaduta ed è stata registrata, oppure `false` quando esiste già un valore attivo senza sovrascriverne valore, ora di creazione o TTL. Limiti: `maxEntries` per namespace, 6.000 righe attive per plugin, valori JSON inferiori a 64 KB e scadenza TTL facoltativa. Quando una scrittura supererebbe il limite di righe del plugin, il runtime può rimuovere le righe attive più vecchie dal namespace in cui si sta scrivendo; i namespace adiacenti non vengono rimossi per quella scrittura, e la scrittura fallisce comunque se il namespace non riesce a liberare abbastanza righe.

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

    `api.runtime.channel.media` è la superficie preferita per download e archiviazione dei media del canale:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Usa `saveRemoteMedia(...)` quando un URL remoto deve diventare media OpenClaw. Usa `saveResponseMedia(...)` quando il plugin ha già recuperato una `Response` con gestione di autenticazione, redirect o allowlist di proprietà del plugin. Usa `readRemoteMediaBuffer(...)` solo quando il plugin ha bisogno dei byte grezzi per ispezione, trasformazioni, decrittazione o nuovo caricamento. `fetchRemoteMedia(...)` rimane un alias di compatibilità deprecato per `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` è la superficie condivisa della policy di menzione in ingresso per i plugin di canale in bundle che usano l'iniezione del runtime:

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

    Helper di menzione disponibili:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` intenzionalmente non espone i vecchi helper di compatibilità `resolveMentionGating*`. Preferisci il percorso normalizzato `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Archiviazione dei riferimenti al runtime

Usa `createPluginRuntimeStore` per archiviare il riferimento al runtime da usare al di fuori della callback `register`:

<Steps>
  <Step title="Crea lo store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Collega al punto di ingresso">
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
  <Step title="Accedi da altri file">
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
Preferisci `pluginId` per l'identità del runtime-store. La forma di livello inferiore `key` è per casi non comuni in cui un plugin ha intenzionalmente bisogno di più di uno slot runtime.
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
  Modalità di caricamento corrente; `"setup-runtime"` è la finestra leggera di avvio/configurazione precedente alla voce completa.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Risolve un percorso relativo alla radice del plugin.
</ParamField>

## Correlati

- [Interni dei plugin](/it/plugins/architecture) — modello di capacità e registro
- [Punti di ingresso dell'SDK](/it/plugins/sdk-entrypoints) — opzioni di `definePluginEntry`
- [Panoramica dell'SDK](/it/plugins/sdk-overview) — riferimento dei sottopercorsi
