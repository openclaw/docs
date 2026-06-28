---
read_when:
    - Musisz wywołać funkcje pomocnicze rdzenia z pluginu (TTS, STT, generowanie obrazów, wyszukiwanie w sieci, podagent, węzły)
    - Chcesz zrozumieć, co udostępnia api.runtime
    - Uzyskujesz dostęp do pomocników konfiguracji, agentów lub multimediów z kodu pluginu
sidebarTitle: Runtime helpers
summary: api.runtime -- wstrzykiwane pomocnicze funkcje środowiska uruchomieniowego dostępne dla Pluginów
title: Pomocnicze funkcje uruchomieniowe Plugin
x-i18n:
    generated_at: "2026-06-28T20:44:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b2bd70bb36ab8fb0fbecb982f56b1302a2a01a8d7ae6f78d3558fbaa8c28742e
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Dokumentacja obiektu `api.runtime` wstrzykiwanego do każdego pluginu podczas rejestracji. Używaj tych helperów zamiast bezpośrednio importować wewnętrzne elementy hosta.

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" href="/pl/plugins/sdk-channel-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych helperów w kontekście pluginów kanałów.
  </Card>
  <Card title="Pluginy providerów" href="/pl/plugins/sdk-provider-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych helperów w kontekście pluginów providerów.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Ładowanie konfiguracji i zapisy

Preferuj konfigurację, która została już przekazana do aktywnej ścieżki wywołania, na przykład `api.config` podczas rejestracji albo argument `cfg` w callbackach kanału/providera. Dzięki temu przez pracę przepływa jedna migawka procesu, zamiast ponownie parsować konfigurację na gorących ścieżkach.

Używaj `api.runtime.config.current()` tylko wtedy, gdy długotrwały handler potrzebuje bieżącej migawki procesu, a do tej funkcji nie przekazano konfiguracji. Zwrócona wartość jest tylko do odczytu; przed edycją sklonuj ją albo użyj helpera mutacji.

Fabryki narzędzi otrzymują `ctx.runtimeConfig` oraz `ctx.getRuntimeConfig()`. Użyj gettera wewnątrz callbacka `execute` długotrwałego narzędzia, gdy konfiguracja może zmienić się po utworzeniu definicji narzędzia.

Utrwalaj zmiany za pomocą `api.runtime.config.mutateConfigFile(...)` albo `api.runtime.config.replaceConfigFile(...)`. Każdy zapis musi wybrać jawną politykę `afterWrite`:

- `afterWrite: { mode: "auto" }` pozwala, aby decyzję podjął mechanizm przeładowania plannera w Gateway.
- `afterWrite: { mode: "restart", reason: "..." }` wymusza czysty restart, gdy zapisujący wie, że hot reload jest niebezpieczny.
- `afterWrite: { mode: "none", reason: "..." }` pomija automatyczne przeładowanie/restart tylko wtedy, gdy wywołujący odpowiada za dalsze działania.

Helpery mutacji zwracają `afterWrite` oraz typowane podsumowanie `followUp`, aby wywołujący mogli logować albo testować, czy zażądali restartu. Gateway nadal decyduje, kiedy ten restart faktycznie nastąpi.

`api.runtime.config.loadConfig()` i `api.runtime.config.writeConfigFile(...)` to przestarzałe helpery zgodności pod `runtime-config-load-write`. Ostrzegają raz w czasie działania i pozostają dostępne dla starych zewnętrznych pluginów w okresie migracji. Wbudowane pluginy nie mogą ich używać; strażnicy granicy konfiguracji zawodzą, jeśli kod pluginu je wywołuje albo importuje te helpery z podścieżek plugin SDK.

Przy bezpośrednich importach SDK używaj wyspecjalizowanych podścieżek konfiguracji zamiast szerokiego zgodnościowego barrela
`openclaw/plugin-sdk/config-runtime`: `config-contracts` dla
typów, `plugin-config-runtime` dla asercji już załadowanej konfiguracji i wyszukiwania
wejścia pluginu, `runtime-config-snapshot` dla bieżących migawek procesu oraz
`config-mutation` dla zapisów. Testy wbudowanych pluginów powinny mockować te wyspecjalizowane
podścieżki bezpośrednio, zamiast mockować szeroki barrel zgodności.

Wewnętrzny kod runtime OpenClaw podąża w tym samym kierunku: załaduj konfigurację raz na granicy CLI, Gateway albo procesu, a następnie przekazuj tę wartość dalej. Udane zapisy mutacji odświeżają migawkę runtime procesu i przesuwają jej wewnętrzną rewizję; długotrwałe cache powinny używać klucza cache należącego do runtime zamiast lokalnie serializować konfigurację. Długotrwałe moduły runtime mają skaner o zerowej tolerancji dla otaczających wywołań `loadConfig()`; użyj przekazanego `cfg`, żądania `context.getRuntimeConfig()` albo `getRuntimeConfig()` na jawnej granicy procesu.

Ścieżki wykonywania providerów i kanałów muszą używać aktywnej migawki konfiguracji runtime, a nie migawki pliku zwróconej do odczytu zwrotnego lub edycji konfiguracji. Migawki plików zachowują wartości źródłowe, takie jak znaczniki SecretRef, na potrzeby UI i zapisów; callbacki providerów potrzebują rozwiązanego widoku runtime. Gdy helper może zostać wywołany z aktywną migawką źródłową albo aktywną migawką runtime, przed odczytem poświadczeń przeprowadź go przez `selectApplicableRuntimeConfig()`.

## Wielokrotnego użytku narzędzia runtime

Używaj przychodzących faktów `botLoopProtection` dla wiadomości przychodzących autorstwa botów. Core stosuje współdzielony strażnik przesuwnego okna w pamięci przed rekordem sesji i dispatch, bez wiązania polityki z jednym kanałem. Strażnik śledzi klucze `(scopeId, conversationId, participant pair)`, zlicza oba kierunki pary razem, nakłada cooldown po przekroczeniu budżetu okna i oportunistycznie przycina nieaktywne wpisy.

Pluginy kanałów, które udostępniają to zachowanie operatorom, powinny preferować współdzielony kształt `channels.defaults.botLoopProtection` dla bazowych budżetów, a następnie nakładać na niego nadpisania specyficzne dla kanału/providera. Współdzielona konfiguracja używa sekund, ponieważ jest widoczna dla użytkownika:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Przekaż znormalizowane fakty pary botów wraz z rozwiązanym turn. Core rozwiązuje wartości domyślne, konwersję jednostek i semantykę `enabled`:

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

Używaj `openclaw/plugin-sdk/pair-loop-guard-runtime` bezpośrednio tylko dla niestandardowych
dwustronnych pętli zdarzeń, które nie przechodzą przez współdzielony runner odpowiedzi przychodzących.

## Przestrzenie nazw runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Tożsamość agenta, katalogi i zarządzanie sesjami.

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

    `runEmbeddedAgent(...)` to neutralny helper do uruchamiania zwykłego turn agenta OpenClaw z kodu pluginu. Używa tego samego rozwiązywania providera/modelu i wyboru agent-harness co odpowiedzi wyzwalane przez kanał.

    `runEmbeddedPiAgent(...)` pozostaje przestarzałym aliasem zgodności dla istniejących pluginów. Nowy kod powinien używać `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` zwraca obsługiwane poziomy myślenia providera/modelu oraz opcjonalną wartość domyślną. Pluginy providerów są właścicielami profilu specyficznego dla modelu przez swoje hooki myślenia, więc pluginy narzędzi powinny wywoływać ten helper runtime zamiast importować albo duplikować listy providerów.

    `normalizeThinkingLevel(...)` konwertuje tekst użytkownika, taki jak `on`, `x-high` albo `extra high`, na kanoniczny zapisany poziom przed sprawdzeniem go względem rozwiązanej polityki.

    **Helpery magazynu sesji** znajdują się pod `api.runtime.agent.session`:

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

    Preferuj `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` albo `upsertSessionEntry(...)` dla workflow sesji. Te helpery adresują sesje według tożsamości agenta/sesji, aby pluginy nie zależały od starszego kształtu magazynu `sessions.json`. Użyj `preserveActivity: true` dla patchy obejmujących tylko metadane, które nie powinny odświeżać aktywności sesji, oraz `replaceEntry: true` tylko wtedy, gdy callback zwraca kompletny wpis, a usunięte pola muszą pozostać usunięte.

    Do odczytów i zapisów transkrypcji importuj `openclaw/plugin-sdk/session-transcript-runtime` i używaj `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` albo `withSessionTranscriptWriteLock(...)` z `{ agentId, sessionKey, sessionId }`. Te API pozwalają pluginom identyfikować transkrypcję, odczytywać jej zdarzenia, dopisywać wiadomości, publikować aktualizacje i uruchamiać powiązane operacje pod tą samą blokadą zapisu transkrypcji. Przekazywanie `sessionFile`, używanie `resolveSessionTranscriptLegacyFileTarget(...)` albo importowanie niskopoziomowych `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` z `openclaw/plugin-sdk/agent-harness-runtime` jest przestarzałe; te ścieżki istnieją tylko dla starszego kodu, który już otrzymuje aktywny artefakt transkrypcji.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` i `resolveAndPersistSessionFile(...)` to przestarzałe helpery zgodności dla pluginów, które nadal celowo zależą od starszego kształtu całego magazynu albo pliku transkrypcji. Nowy kod pluginów nie może używać tych helperów, a istniejący wywołujący powinni migrować do helperów wpisów i helperów tożsamości transkrypcji.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Stałe domyślnego modelu i providera:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Uruchom uzupełnianie tekstu należące do hosta bez importowania wewnętrznych elementów providera ani
    duplikowania przygotowania modelu/auth/bazowego URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Helper używa tej samej ścieżki przygotowania prostego uzupełniania co
    wbudowany runtime OpenClaw oraz migawki konfiguracji runtime należącej do hosta. Silniki kontekstu
    otrzymują powiązaną z sesją możliwość `llm.complete`, więc wywołania modelu używają
    agenta aktywnej sesji i nie przechodzą po cichu na domyślnego agenta. Wynik
    zawiera atrybucję providera/modelu/agenta oraz znormalizowane użycie tokenów,
    cache i szacowanego kosztu, gdy jest dostępne.

    <Warning>
    Nadpisania modelu wymagają zgody operatora przez `plugins.entries.<id>.llm.allowModelOverride: true` w konfiguracji. Użyj `plugins.entries.<id>.llm.allowedModels`, aby ograniczyć zaufane pluginy do konkretnych kanonicznych celów `provider/model`. Uzupełniania między agentami wymagają `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Uruchamiaj i zarządzaj działaniami subagentów w tle.

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
    Nadpisania modelu (`provider`/`model`) wymagają zgody operatora przez `plugins.entries.<id>.subagent.allowModelOverride: true` w konfiguracji. Niezaufane Pluginy nadal mogą uruchamiać subagentów, ale żądania nadpisania są odrzucane.
    </Warning>

    `deleteSession(...)` może usuwać sesje utworzone przez ten sam Plugin za pomocą `api.runtime.subagent.run(...)`. Usuwanie dowolnych sesji użytkownika lub operatora nadal wymaga żądania Gateway z zakresem administratora.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Wyświetla połączone Node i wywołuje polecenie hosta Node z kodu Pluginu załadowanego przez Gateway albo z poleceń CLI Pluginu. Użyj tego, gdy Plugin odpowiada za pracę lokalną na sparowanym urządzeniu, na przykład za most przeglądarki lub audio na innym Macu.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Wewnątrz Gateway ten runtime działa w tym samym procesie. W poleceniach CLI Pluginu wywołuje skonfigurowany Gateway przez RPC, dzięki czemu polecenia takie jak `openclaw googlemeet recover-tab` mogą sprawdzać sparowane Node z terminala. Polecenia Node nadal przechodzą przez zwykłe parowanie Node w Gateway, listy dozwolonych poleceń, zasady wywołań Node przez Plugin oraz lokalną obsługę poleceń Node.

    Pluginy, które udostępniają niebezpieczne polecenia hosta Node, powinny zarejestrować zasadę wywołań Node za pomocą `api.registerNodeInvokePolicy(...)`. Zasada działa w Gateway po sprawdzeniu listy dozwolonych poleceń i przed przekazaniem polecenia do Node, więc bezpośrednie wywołania `node.invoke` i narzędzia Pluginu wyższego poziomu korzystają z tej samej ścieżki egzekwowania.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Powiąż runtime TaskFlow z istniejącym kluczem sesji OpenClaw lub zaufanym kontekstem narzędzia, a następnie twórz i zarządzaj TaskFlow bez przekazywania właściciela przy każdym wywołaniu.

    TaskFlow śledzi trwały stan wieloetapowego przepływu pracy. Nie jest harmonogramem:
    użyj Cron albo `api.session.workflow.scheduleSessionTurn(...)` dla przyszłych
    wybudzeń, a następnie użyj `managedFlows` z zaplanowanej tury, gdy ta praca
    wymaga stanu przepływu, zadań podrzędnych, oczekiwania lub anulowania.

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

    Użyj `bindSession({ sessionKey, requesterOrigin })`, gdy masz już zaufany klucz sesji OpenClaw z własnej warstwy wiązania. Nie wiąż na podstawie surowych danych wejściowych użytkownika.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Synteza tekstu na mowę.

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

    Używa podstawowej konfiguracji `messages.tts` i wyboru dostawcy. Zwraca bufor audio PCM oraz częstotliwość próbkowania.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analiza obrazów, audio i wideo.

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

    Zwraca `{ text: undefined }`, gdy nie zostanie wygenerowane żadne wyjście (np. pominięte dane wejściowe).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności dla `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Generowanie obrazów.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Wyszukiwanie w sieci.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Niskopoziomowe narzędzia multimedialne.

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
    Bieżąca migawka konfiguracji runtime i transakcyjne zapisy konfiguracji. Preferuj
    konfigurację, która została już przekazana do aktywnej ścieżki wywołania; używaj
    `current()` tylko wtedy, gdy procedura obsługi potrzebuje bezpośrednio migawki procesu.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` i `replaceConfigFile(...)` zwracają wartość `followUp`,
    na przykład `{ mode: "restart", requiresRestart: true, reason }`,
    która zapisuje intencję zapisującego bez odbierania gatewayowi kontroli nad restartem.

  </Accordion>
  <Accordion title="api.runtime.system">
    Narzędzia poziomu systemowego.

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

    `runCommandWithTimeout(...)` zwraca przechwycone `stdout` i `stderr`, opcjonalne
    liczniki obcięcia, `code`, `signal`, `killed`, `termination` oraz
    `noOutputTimedOut`. Wyniki przekroczenia limitu czasu i przekroczenia limitu braku wyjścia zgłaszają `code: 124`,
    gdy proces potomny nie podaje niezerowego kodu wyjścia. Wyjścia sygnałowe
    niezwiązane z limitem czasu nadal mogą zwracać `code: null`, więc użyj `termination` i
    `noOutputTimedOut`, aby rozróżnić przyczyny limitu czasu.

  </Accordion>
  <Accordion title="api.runtime.events">
    Subskrypcje zdarzeń.

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
    Logowanie.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Rozwiązywanie uwierzytelniania modelu i dostawcy.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Rozwiązywanie katalogu stanu i magazyn kluczowany oparty na SQLite.

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

    Magazyny kluczowane przetrwają ponowne uruchomienia i są izolowane według identyfikatora pluginu powiązanego ze środowiskiem uruchomieniowym. Użyj `registerIfAbsent(...)` do atomowych roszczeń deduplikacji: zwraca `true`, gdy klucza brakowało albo wygasł i został zarejestrowany, albo `false`, gdy istnieje już aktywna wartość, bez nadpisywania jej wartości, czasu utworzenia ani TTL. Limity: `maxEntries` na przestrzeń nazw, 6000 aktywnych wierszy na plugin, wartości JSON poniżej 64 KB oraz opcjonalne wygasanie TTL. Gdy zapis przekroczyłby limit wierszy pluginu, środowisko uruchomieniowe może usunąć najstarsze aktywne wiersze z zapisywanej przestrzeni nazw; sąsiednie przestrzenie nazw nie są usuwane przy tym zapisie, a zapis nadal kończy się niepowodzeniem, jeśli przestrzeń nazw nie może zwolnić wystarczającej liczby wierszy.

    <Warning>
    Tylko dołączone pluginy w tym wydaniu.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tools">
    Fabryki narzędzi pamięci i CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Pomocnicze elementy środowiska uruchomieniowego specyficzne dla kanału (dostępne, gdy załadowany jest plugin kanału).

    `api.runtime.channel.media` to preferowana powierzchnia do pobierania i przechowywania multimediów kanału:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Użyj `saveRemoteMedia(...)`, gdy zdalny URL powinien stać się multimedium OpenClaw. Użyj `saveResponseMedia(...)`, gdy plugin pobrał już `Response` z obsługą uwierzytelniania, przekierowań lub listy dozwolonych po stronie pluginu. Użyj `readRemoteMediaBuffer(...)` tylko wtedy, gdy plugin potrzebuje surowych bajtów do inspekcji, transformacji, odszyfrowania lub ponownego przesłania. `fetchRemoteMedia(...)` pozostaje przestarzałym aliasem zgodności dla `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` to współdzielona powierzchnia zasad wzmiankowania dla przychodzących danych w dołączonych pluginach kanałów, które używają wstrzykiwania środowiska uruchomieniowego:

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

    Dostępne pomocnicze funkcje wzmianek:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` celowo nie udostępnia starszych pomocniczych funkcji zgodności `resolveMentionGating*`. Preferuj znormalizowaną ścieżkę `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Przechowywanie odwołań do środowiska uruchomieniowego

Użyj `createPluginRuntimeStore`, aby przechowywać odwołanie do środowiska uruchomieniowego do użycia poza wywołaniem zwrotnym `register`:

<Steps>
  <Step title="Utwórz magazyn">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Podłącz do punktu wejścia">
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
  <Step title="Dostęp z innych plików">
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
Preferuj `pluginId` dla tożsamości magazynu środowiska uruchomieniowego. Niższopoziomowa forma `key` jest przeznaczona dla rzadkich przypadków, w których jeden plugin celowo potrzebuje więcej niż jednego slotu środowiska uruchomieniowego.
</Note>

## Inne pola najwyższego poziomu `api`

Poza `api.runtime` obiekt API udostępnia również:

<ParamField path="api.id" type="string">
  Identyfikator pluginu.
</ParamField>
<ParamField path="api.name" type="string">
  Wyświetlana nazwa pluginu.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Bieżąca migawka konfiguracji (aktywna migawka środowiska uruchomieniowego w pamięci, gdy jest dostępna).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger o określonym zakresie (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wejściem.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Rozwiąż ścieżkę względem katalogu głównego pluginu.
</ParamField>

## Powiązane

- [Wewnętrzne mechanizmy pluginu](/pl/plugins/architecture) — model możliwości i rejestr
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry`
- [Omówienie SDK](/pl/plugins/sdk-overview) — referencja podścieżek
