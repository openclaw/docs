---
read_when:
    - Musisz wywołać pomocnicze funkcje rdzenia z Pluginu (TTS, STT, generowanie obrazów, wyszukiwanie w sieci, podagent, węzły)
    - Chcesz zrozumieć, co udostępnia api.runtime
    - Uzyskujesz dostęp do funkcji pomocniczych konfiguracji, agenta lub multimediów z kodu Pluginu
sidebarTitle: Runtime helpers
summary: api.runtime -- wstrzyknięte funkcje pomocnicze środowiska uruchomieniowego dostępne dla pluginów
title: Pomocnicze funkcje środowiska uruchomieniowego Plugin
x-i18n:
    generated_at: "2026-06-27T18:06:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f60c1c206d862e5be767cd56c38f6cacf1e1f3ce43b96fccde376a9be8160be
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Dokumentacja referencyjna obiektu `api.runtime` wstrzykiwanego do każdego pluginu podczas rejestracji. Używaj tych helperów zamiast bezpośrednio importować wewnętrzne elementy hosta.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/pl/plugins/sdk-channel-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych helperów w kontekście pluginów kanałów.
  </Card>
  <Card title="Provider plugins" href="/pl/plugins/sdk-provider-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych helperów w kontekście pluginów dostawców.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Wczytywanie i zapisywanie konfiguracji

Preferuj konfigurację, która została już przekazana do aktywnej ścieżki wywołania, na przykład `api.config` podczas rejestracji albo argument `cfg` w callbackach kanału lub dostawcy. Dzięki temu przez pracę przepływa jedna migawka procesu zamiast ponownego parsowania konfiguracji na gorących ścieżkach.

Używaj `api.runtime.config.current()` tylko wtedy, gdy długotrwały handler potrzebuje bieżącej migawki procesu, a do tej funkcji nie przekazano konfiguracji. Zwrócona wartość jest tylko do odczytu; przed edycją sklonuj ją albo użyj helpera mutacji.

Fabryki narzędzi otrzymują `ctx.runtimeConfig` oraz `ctx.getRuntimeConfig()`. Użyj gettera wewnątrz callbacku `execute` długotrwałego narzędzia, gdy konfiguracja może się zmienić po utworzeniu definicji narzędzia.

Utrwalaj zmiany za pomocą `api.runtime.config.mutateConfigFile(...)` albo `api.runtime.config.replaceConfigFile(...)`. Każdy zapis musi wybrać jawną politykę `afterWrite`:

- `afterWrite: { mode: "auto" }` pozwala, aby zdecydował planer ponownego wczytania Gateway.
- `afterWrite: { mode: "restart", reason: "..." }` wymusza czysty restart, gdy komponent zapisujący wie, że hot reload jest niebezpieczny.
- `afterWrite: { mode: "none", reason: "..." }` blokuje automatyczne ponowne wczytanie lub restart tylko wtedy, gdy wywołujący odpowiada za dalsze działania.

Helpery mutacji zwracają `afterWrite` oraz typowane podsumowanie `followUp`, aby wywołujący mogli zalogować albo przetestować, czy zażądali restartu. Gateway nadal odpowiada za to, kiedy ten restart faktycznie nastąpi.

`api.runtime.config.loadConfig()` i `api.runtime.config.writeConfigFile(...)` to przestarzałe helpery zgodności pod `runtime-config-load-write`. Ostrzegają raz w czasie działania i pozostają dostępne dla starych zewnętrznych pluginów w okresie migracji. Wbudowane pluginy nie mogą ich używać; strażnicy granicy konfiguracji zgłoszą błąd, jeśli kod pluginu je wywoła albo zaimportuje te helpery z podścieżek Plugin SDK.

Przy bezpośrednich importach SDK używaj wyspecjalizowanych podścieżek konfiguracji zamiast szerokiego barrela zgodności
`openclaw/plugin-sdk/config-runtime`: `config-contracts` dla
typów, `plugin-config-runtime` dla asercji już wczytanej konfiguracji i wyszukiwania
wpisu pluginu, `runtime-config-snapshot` dla bieżących migawek procesu oraz
`config-mutation` dla zapisów. Testy wbudowanych pluginów powinny bezpośrednio mockować te wyspecjalizowane
podścieżki zamiast mockować szeroki barrel zgodności.

Wewnętrzny kod runtime OpenClaw ma ten sam kierunek: wczytaj konfigurację raz na granicy CLI, Gateway albo procesu, a potem przekazuj tę wartość dalej. Udane zapisy mutacji odświeżają migawkę runtime procesu i zwiększają jej wewnętrzną rewizję; długotrwałe cache powinny opierać klucze na kluczu cache należącym do runtime zamiast lokalnie serializować konfigurację. Długotrwałe moduły runtime mają skaner o zerowej tolerancji dla otaczających wywołań `loadConfig()`; użyj przekazanego `cfg`, żądania `context.getRuntimeConfig()` albo `getRuntimeConfig()` na jawnej granicy procesu.

Ścieżki wykonywania dostawców i kanałów muszą używać aktywnej migawki konfiguracji runtime, a nie migawki pliku zwróconej do odczytu zwrotnego lub edycji konfiguracji. Migawki plików zachowują wartości źródłowe, takie jak znaczniki SecretRef, na potrzeby UI i zapisów; callbacki dostawców potrzebują rozwiązanego widoku runtime. Gdy helper może zostać wywołany z aktywną migawką źródłową albo aktywną migawką runtime, przed odczytem poświadczeń przeprowadź ścieżkę przez `selectApplicableRuntimeConfig()`.

## Wielokrotnego użytku narzędzia runtime

Używaj przychodzących faktów `botLoopProtection` dla wiadomości przychodzących utworzonych przez boty. Core stosuje współdzielony strażnik przesuwnego okna w pamięci przed zapisem sesji i dispatch, bez wiązania polityki z jednym kanałem. Strażnik śledzi klucze `(scopeId, conversationId, participant pair)`, zlicza oba kierunki pary razem, stosuje cooldown po przekroczeniu budżetu okna i oportunistycznie czyści nieaktywne wpisy.

Pluginy kanałów, które udostępniają to zachowanie operatorom, powinny preferować współdzielony kształt `channels.defaults.botLoopProtection` dla bazowych budżetów, a następnie nakładać na niego nadpisania specyficzne dla kanału lub dostawcy. Współdzielona konfiguracja używa sekund, ponieważ jest widoczna dla użytkownika:

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

    `runEmbeddedAgent(...)` to neutralny helper do uruchamiania normalnego turn agenta OpenClaw z kodu pluginu. Używa tego samego rozwiązywania dostawcy/modelu i wyboru agent-harness co odpowiedzi wyzwalane przez kanał.

    `runEmbeddedPiAgent(...)` pozostaje przestarzałym aliasem zgodności dla istniejących pluginów. Nowy kod powinien używać `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` zwraca obsługiwane poziomy thinking dla dostawcy/modelu oraz opcjonalną wartość domyślną. Pluginy dostawców są właścicielami profilu specyficznego dla modelu przez swoje hooki thinking, więc pluginy narzędziowe powinny wywoływać ten helper runtime zamiast importować albo duplikować listy dostawców.

    `normalizeThinkingLevel(...)` konwertuje tekst użytkownika, taki jak `on`, `x-high` albo `extra high`, na kanoniczny przechowywany poziom przed sprawdzeniem go względem rozwiązanej polityki.

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

    Preferuj `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` albo `upsertSessionEntry(...)` dla przepływów pracy sesji. Te helpery adresują sesje według tożsamości agenta/sesji, aby pluginy nie zależały od starszego kształtu storage `sessions.json`. Użyj `preserveActivity: true` dla poprawek obejmujących tylko metadane, które nie powinny odświeżać aktywności sesji, oraz `replaceEntry: true` tylko wtedy, gdy callback zwraca kompletny wpis, a usunięte pola muszą pozostać usunięte.

    Do odczytu i zapisu transkryptów importuj `openclaw/plugin-sdk/session-transcript-runtime` i używaj `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` albo `withSessionTranscriptWriteLock(...)` z `{ agentId, sessionKey, sessionId }`. Te API pozwalają pluginom zidentyfikować transkrypt, odczytać jego zdarzenia, dodać wiadomości, opublikować aktualizacje i wykonać powiązane operacje pod tą samą blokadą zapisu transkryptu. Przekazuj `sessionFile` tylko podczas adaptowania kodu, który już otrzymuje aktywny artefakt transkryptu i potrzebuje, aby każdy helper działał na tym samym artefakcie.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)` oraz `resolveSessionFilePath(...)` to helpery zgodności dla pluginów, które nadal celowo zależą od starszego kształtu całego magazynu albo pliku transkryptu. Nowy kod pluginu nie może używać tych helperów, a istniejący wywołujący powinni migrować do helperów wpisów.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Domyślne stałe modelu i dostawcy:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Uruchom uzupełnienie tekstu należące do hosta bez importowania wewnętrznych elementów dostawcy ani
    duplikowania przygotowania modelu, uwierzytelniania lub bazowego URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Helper używa tej samej ścieżki przygotowania prostego uzupełnienia co
    wbudowany runtime OpenClaw oraz migawki konfiguracji runtime należącej do hosta. Silniki kontekstu
    otrzymują powiązaną z sesją zdolność `llm.complete`, więc wywołania modelu używają
    agenta aktywnej sesji i nie przechodzą po cichu do domyślnego agenta. Wynik
    zawiera atrybucję dostawcy/modelu/agenta oraz znormalizowane tokeny,
    cache i szacowane użycie kosztów, gdy są dostępne.

    <Warning>
    Nadpisania modelu wymagają zgody operatora przez `plugins.entries.<id>.llm.allowModelOverride: true` w konfiguracji. Użyj `plugins.entries.<id>.llm.allowedModels`, aby ograniczyć zaufane pluginy do konkretnych kanonicznych celów `provider/model`. Uzupełnienia między agentami wymagają `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Uruchamiaj i zarządzaj uruchomieniami subagentów w tle.

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

    `deleteSession(...)` może usuwać sesje utworzone przez ten sam Plugin przez `api.runtime.subagent.run(...)`. Usuwanie dowolnych sesji użytkownika lub operatora nadal wymaga żądania Gateway o zakresie administracyjnym.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Wyświetla połączone węzły i wywołuje polecenie hosta węzła z kodu Pluginu ładowanego przez Gateway albo z poleceń CLI Pluginu. Użyj tego, gdy Plugin odpowiada za lokalną pracę na sparowanym urządzeniu, na przykład za przeglądarkę lub most audio na innym Macu.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Wewnątrz Gateway to środowisko uruchomieniowe działa w procesie. W poleceniach CLI Pluginu wywołuje skonfigurowany Gateway przez RPC, więc polecenia takie jak `openclaw googlemeet recover-tab` mogą sprawdzać sparowane węzły z terminala. Polecenia węzłów nadal przechodzą przez standardowe parowanie węzłów Gateway, listy dozwolonych poleceń, zasady wywołań węzłów Pluginów i lokalną obsługę poleceń węzła.

    Pluginy, które udostępniają niebezpieczne polecenia hosta węzła, powinny zarejestrować zasadę wywołań węzłów za pomocą `api.registerNodeInvokePolicy(...)`. Zasada działa w Gateway po sprawdzeniach listy dozwolonych poleceń i przed przekazaniem polecenia do węzła, dzięki czemu bezpośrednie wywołania `node.invoke` i narzędzia Pluginów wyższego poziomu korzystają z tej samej ścieżki egzekwowania.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Powiąż środowisko uruchomieniowe TaskFlow z istniejącym kluczem sesji OpenClaw albo zaufanym kontekstem narzędzia, a następnie twórz i zarządzaj przepływami zadań bez przekazywania właściciela przy każdym wywołaniu.

    TaskFlow śledzi trwały stan wieloetapowego przepływu pracy. Nie jest harmonogramem:
    użyj Cron albo `api.session.workflow.scheduleSessionTurn(...)` dla przyszłych
    wybudzeń, a następnie użyj `managedFlows` z zaplanowanej tury, gdy ta praca
    wymaga stanu przepływu, zadań podrzędnych, oczekiwań lub anulowania.

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

    Użyj `bindSession({ sessionKey, requesterOrigin })`, gdy masz już zaufany klucz sesji OpenClaw z własnej warstwy wiązania. Nie twórz wiązania z surowych danych wejściowych użytkownika.

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

    Zwraca `{ text: undefined }`, gdy nie powstanie żadne wyjście, np. po pominięciu danych wejściowych.

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
    Bieżąca migawka konfiguracji środowiska uruchomieniowego i transakcyjne zapisy konfiguracji. Preferuj
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
    która zapisuje intencję zapisującego bez odbierania kontroli nad restartem
    od gateway.

  </Accordion>
  <Accordion title="api.runtime.system">
    Narzędzia na poziomie systemu.

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
    liczby obcięć, `code`, `signal`, `killed`, `termination` oraz
    `noOutputTimedOut`. Wyniki timeoutu i timeoutu braku wyjścia zgłaszają `code: 124`,
    gdy proces podrzędny nie podaje niezerowego kodu zakończenia. Zakończenia sygnałem
    niezwiązane z timeoutem nadal mogą zwracać `code: null`, więc użyj `termination` i
    `noOutputTimedOut`, aby rozróżnić przyczyny timeoutu.

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
    Rejestrowanie.

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

    Magazyny z kluczami przetrwają ponowne uruchomienia i są izolowane przez identyfikator pluginu powiązany ze środowiskiem uruchomieniowym. Użyj `registerIfAbsent(...)` do atomowych zgłoszeń deduplikacji: zwraca `true`, gdy klucza brakowało albo wygasł i został zarejestrowany, lub `false`, gdy aktywna wartość już istnieje, bez nadpisywania jej wartości, czasu utworzenia ani TTL. Limity: `maxEntries` na przestrzeń nazw, 6000 aktywnych wierszy na plugin, wartości JSON poniżej 64 KB oraz opcjonalne wygasanie TTL. Gdy zapis przekroczyłby limit wierszy pluginu, środowisko uruchomieniowe może usunąć najstarsze aktywne wiersze z zapisywanej przestrzeni nazw; sąsiednie przestrzenie nazw nie są usuwane dla tego zapisu, a zapis nadal kończy się niepowodzeniem, jeśli przestrzeń nazw nie może zwolnić wystarczającej liczby wierszy.

    <Warning>
    W tej wersji tylko dołączone pluginy.
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
    Pomocnicze funkcje środowiska uruchomieniowego specyficzne dla kanału (dostępne, gdy plugin kanału jest załadowany).

    `api.runtime.channel.media` to preferowana powierzchnia do pobierania i przechowywania multimediów kanału:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Użyj `saveRemoteMedia(...)`, gdy zdalny URL ma stać się multimedium OpenClaw. Użyj `saveResponseMedia(...)`, gdy plugin już pobrał `Response` z obsługą uwierzytelniania, przekierowań lub listy dozwolonych należącą do pluginu. Użyj `readRemoteMediaBuffer(...)` tylko wtedy, gdy plugin potrzebuje surowych bajtów do inspekcji, transformacji, odszyfrowania lub ponownego przesłania. `fetchRemoteMedia(...)` pozostaje przestarzałym aliasem zgodności dla `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` to współdzielona powierzchnia polityki wzmiankowania przychodzącego dla dołączonych pluginów kanałów, które używają wstrzykiwania środowiska uruchomieniowego:

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

    Dostępne funkcje pomocnicze wzmiankowania:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` celowo nie udostępnia starszych funkcji pomocniczych zgodności `resolveMentionGating*`. Preferuj znormalizowaną ścieżkę `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Przechowywanie referencji środowiska uruchomieniowego

Użyj `createPluginRuntimeStore`, aby przechować referencję środowiska uruchomieniowego do użycia poza wywołaniem zwrotnym `register`:

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
  <Step title="Uzyskaj dostęp z innych plików">
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
Preferuj `pluginId` jako tożsamość runtime-store. Niższopoziomowa forma `key` jest przeznaczona do nietypowych przypadków, w których jeden plugin celowo potrzebuje więcej niż jednego slotu środowiska uruchomieniowego.
</Note>

## Inne pola najwyższego poziomu `api`

Poza `api.runtime` obiekt API udostępnia także:

<ParamField path="api.id" type="string">
  Identyfikator pluginu.
</ParamField>
<ParamField path="api.name" type="string">
  Nazwa wyświetlana pluginu.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Bieżący snapshot konfiguracji (aktywny snapshot środowiska uruchomieniowego w pamięci, gdy jest dostępny).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wejściem.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Rozwiązuje ścieżkę względem katalogu głównego pluginu.
</ParamField>

## Powiązane

- [Wewnętrzne mechanizmy pluginów](/pl/plugins/architecture) — model możliwości i rejestr
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry`
- [Przegląd SDK](/pl/plugins/sdk-overview) — referencja podścieżek
