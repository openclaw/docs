---
read_when:
    - Musisz wywołać podstawowe helpery z Plugin (TTS, STT, generowanie obrazów, wyszukiwanie w internecie, subagent, węzły)
    - Chcesz zrozumieć, co udostępnia api.runtime
    - Uzyskujesz dostęp do pomocników konfiguracji, agenta lub multimediów z kodu Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- wstrzyknięte pomocnicze funkcje środowiska uruchomieniowego dostępne dla pluginów
title: Funkcje pomocnicze środowiska uruchomieniowego Plugin
x-i18n:
    generated_at: "2026-07-04T20:45:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22448865af70eedb71180ab88946a88d7eb59c43f09fc1a819d43263b4c4223c
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

## Wczytywanie i zapisywanie konfiguracji

Preferuj konfigurację, która została już przekazana do aktywnej ścieżki wywołania, na przykład `api.config` podczas rejestracji albo argument `cfg` w callbackach kanału/providera. Dzięki temu przez pracę przepływa jeden snapshot procesu zamiast ponownego parsowania konfiguracji na gorących ścieżkach.

Używaj `api.runtime.config.current()` tylko wtedy, gdy długotrwały handler potrzebuje bieżącego snapshotu procesu i do tej funkcji nie przekazano konfiguracji. Zwracana wartość jest tylko do odczytu; przed edycją sklonuj ją albo użyj helpera mutacji.

Fabryki narzędzi otrzymują `ctx.runtimeConfig` oraz `ctx.getRuntimeConfig()`. Użyj gettera wewnątrz callbacka `execute` długotrwałego narzędzia, gdy konfiguracja może się zmienić po utworzeniu definicji narzędzia.

Utrwalaj zmiany za pomocą `api.runtime.config.mutateConfigFile(...)` albo `api.runtime.config.replaceConfigFile(...)`. Każdy zapis musi wybrać jawną politykę `afterWrite`:

- `afterWrite: { mode: "auto" }` pozwala planerowi przeładowania gatewaya zdecydować.
- `afterWrite: { mode: "restart", reason: "..." }` wymusza czysty restart, gdy zapisujący wie, że przeładowanie na gorąco jest niebezpieczne.
- `afterWrite: { mode: "none", reason: "..." }` wyłącza automatyczne przeładowanie/restart tylko wtedy, gdy wywołujący odpowiada za dalsze działania.

Helpery mutacji zwracają `afterWrite` oraz typowane podsumowanie `followUp`, aby wywołujący mogli logować lub testować, czy zażądali restartu. Gateway nadal decyduje, kiedy ten restart faktycznie nastąpi.

`api.runtime.config.loadConfig()` i `api.runtime.config.writeConfigFile(...)` to przestarzałe helpery zgodności w `runtime-config-load-write`. Ostrzegają raz w czasie działania i pozostają dostępne dla starych zewnętrznych pluginów w okresie migracji. Wbudowane pluginy nie mogą ich używać; strażnicy granicy konfiguracji zawiodą, jeśli kod pluginu je wywoła albo zaimportuje te helpery z podścieżek SDK pluginów.

W przypadku bezpośrednich importów SDK używaj ukierunkowanych podścieżek konfiguracji zamiast szerokiego barrela zgodności
`openclaw/plugin-sdk/config-runtime`: `config-contracts` dla
typów, `plugin-config-runtime` dla asercji już wczytanej konfiguracji i wyszukiwania
wejścia pluginu, `runtime-config-snapshot` dla bieżących snapshotów procesu oraz
`config-mutation` dla zapisów. Testy wbudowanych pluginów powinny mockować te ukierunkowane
podścieżki bezpośrednio zamiast mockować szeroki barrel zgodności.

Wewnętrzny kod runtime OpenClaw podąża w tym samym kierunku: wczytaj konfigurację raz na granicy CLI, gatewaya lub procesu, a następnie przekazuj tę wartość dalej. Udane zapisy mutacji odświeżają snapshot runtime procesu i przesuwają jego wewnętrzną rewizję; długotrwałe cache powinny opierać klucze na kluczu cache zarządzanym przez runtime zamiast lokalnie serializować konfigurację. Długotrwałe moduły runtime mają skaner o zerowej tolerancji dla otaczających wywołań `loadConfig()`; użyj przekazanego `cfg`, żądania `context.getRuntimeConfig()` albo `getRuntimeConfig()` na jawnej granicy procesu.

Ścieżki wykonywania providera i kanału muszą używać aktywnego snapshotu konfiguracji runtime, a nie snapshotu pliku zwróconego do odczytu zwrotnego lub edycji konfiguracji. Snapshoty pliku zachowują wartości źródłowe, takie jak znaczniki SecretRef, dla UI i zapisów; callbacki providera potrzebują rozwiązanego widoku runtime. Gdy helper może być wywołany zarówno z aktywnym snapshotem źródłowym, jak i aktywnym snapshotem runtime, przed odczytem poświadczeń przeprowadź go przez `selectApplicableRuntimeConfig()`.

## Wielokrotnego użytku narzędzia runtime

Używaj wejściowych faktów `botLoopProtection` dla wiadomości przychodzących utworzonych przez bota. Core stosuje współdzielone zabezpieczenie w pamięci z przesuwanym oknem przed rekordem sesji i dispatchowaniem, bez wiązania polityki z jednym kanałem. Zabezpieczenie śledzi klucze `(scopeId, conversationId, participant pair)`, zlicza oba kierunki pary razem, stosuje cooldown po przekroczeniu budżetu okna i oportunistycznie przycina nieaktywne wpisy.

Pluginy kanałów, które udostępniają to zachowanie operatorom, powinny preferować współdzielony kształt `channels.defaults.botLoopProtection` jako bazowe budżety, a następnie nakładać na niego nadpisania specyficzne dla kanału/providera. Współdzielona konfiguracja używa sekund, ponieważ jest widoczna dla użytkownika:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Przekazuj znormalizowane fakty par botów z rozwiązanym turnem. Core rozwiązuje wartości domyślne, konwersję jednostek i semantykę `enabled`:

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

    `runEmbeddedAgent(...)` to neutralny helper do uruchamiania normalnego turnu agenta OpenClaw z kodu pluginu. Używa tego samego rozwiązywania providera/modelu i wyboru harnessu agenta co odpowiedzi wyzwalane kanałem.

    `runEmbeddedPiAgent(...)` pozostaje przestarzałym aliasem zgodności dla istniejących pluginów. Nowy kod powinien używać `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` zwraca obsługiwane poziomy thinking providera/modelu oraz opcjonalną wartość domyślną. Pluginy providerów odpowiadają za profil specyficzny dla modelu przez swoje hooki thinking, więc pluginy narzędzi powinny wywoływać ten helper runtime zamiast importować lub powielać listy providerów.

    `normalizeThinkingLevel(...)` konwertuje tekst użytkownika, taki jak `on`, `x-high` lub `extra high`, na kanoniczny zapisany poziom przed sprawdzeniem go względem rozwiązanej polityki.

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

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Create or update the session, then pass signal to the admitted agent run.
      },
    );
    ```

    Preferuj `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` lub `upsertSessionEntry(...)` w przepływach pracy sesji. Te helpery adresują sesje według tożsamości agenta/sesji, dzięki czemu pluginy nie zależą od przestarzałego kształtu magazynu `sessions.json`. Użyj `preserveActivity: true` dla poprawek dotyczących wyłącznie metadanych, które nie powinny odświeżać aktywności sesji, oraz `replaceEntry: true` tylko wtedy, gdy callback zwraca kompletny wpis, a usunięte pola muszą pozostać usunięte.

    Używaj `runWithWorkAdmission(...)`, gdy plugin rozpoczyna pracę na utrwalonej sesji. Callback odrzuca zarchiwizowane lub równocześnie zastąpione sesje, koordynuje mutacje archiwizacji/resetu/usuwania przez zakończenie i otrzymuje `AbortSignal`, który musi zostać przekazany do uruchomienia agenta.

    Do odczytów i zapisów transkryptu importuj `openclaw/plugin-sdk/session-transcript-runtime` i używaj `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` lub `withSessionTranscriptWriteLock(...)` z `{ agentId, sessionKey, sessionId }`. Te API pozwalają pluginom identyfikować transkrypt, czytać jego zdarzenia, dopisywać wiadomości, publikować aktualizacje i uruchamiać powiązane operacje pod tą samą blokadą zapisu transkryptu. Przekazywanie `sessionFile`, używanie `resolveSessionTranscriptLegacyFileTarget(...)` albo importowanie niskopoziomowych `appendSessionTranscriptMessage(...)` / `emitSessionTranscriptUpdate(...)` z `openclaw/plugin-sdk/agent-harness-runtime` jest przestarzałe; te ścieżki istnieją tylko dla starszego kodu, który już otrzymuje aktywny artefakt transkryptu.

    `loadSessionStore(...)`, `saveSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionFilePath(...)` i `resolveAndPersistSessionFile(...)` to przestarzałe helpery zgodności dla pluginów, które nadal celowo zależą od przestarzałego kształtu całego magazynu albo pliku transkryptu. Nowy kod pluginu nie może używać tych helperów, a istniejący wywołujący powinni migrować do helperów wpisów i helperów tożsamości transkryptu.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Stałe domyślnego modelu i providera:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Uruchom tekstowe completion zarządzane przez hosta bez importowania wewnętrznych elementów providera ani
    powielania przygotowania modelu/auth/bazowego URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Helper używa tej samej ścieżki przygotowania prostego completion co
    wbudowany runtime OpenClaw oraz snapshot konfiguracji runtime zarządzany przez hosta. Silniki kontekstu
    otrzymują powiązaną z sesją capability `llm.complete`, więc wywołania modelu używają
    agenta aktywnej sesji i nie przechodzą po cichu do agenta domyślnego. Wynik
    obejmuje atrybucję providera/modelu/agenta oraz znormalizowane użycie tokenów,
    cache i szacowanego kosztu, gdy jest dostępne.

    <Warning>
    Nadpisania modelu wymagają zgody operatora przez `plugins.entries.<id>.llm.allowModelOverride: true` w konfiguracji. Użyj `plugins.entries.<id>.llm.allowedModels`, aby ograniczyć zaufane pluginy do konkretnych kanonicznych celów `provider/model`. Uzupełnienia między agentami wymagają `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Uruchamiaj przebiegi subagentów w tle i zarządzaj nimi.

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
    Nadpisania modelu (`provider`/`model`) wymagają zgody operatora przez `plugins.entries.<id>.subagent.allowModelOverride: true` w konfiguracji. Niezaufane pluginy nadal mogą uruchamiać subagentów, ale żądania nadpisania są odrzucane.
    </Warning>

    `deleteSession(...)` może usuwać sesje utworzone przez ten sam plugin za pomocą `api.runtime.subagent.run(...)`. Usuwanie dowolnych sesji użytkownika lub operatora nadal wymaga żądania Gateway z zakresem administratora.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Wyświetlaj połączone węzły i wywołuj polecenie hosta węzła z kodu pluginu załadowanego przez Gateway lub z poleceń CLI pluginu. Użyj tego, gdy plugin jest właścicielem lokalnej pracy na sparowanym urządzeniu, na przykład mostka przeglądarki lub audio na innym Macu.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    W Gateway ten runtime działa w tym samym procesie. W poleceniach CLI pluginu wywołuje skonfigurowany Gateway przez RPC, dzięki czemu polecenia takie jak `openclaw googlemeet recover-tab` mogą sprawdzać sparowane węzły z terminala. Polecenia węzłów nadal przechodzą przez standardowe parowanie węzłów Gateway, listy dozwolonych poleceń, zasady wywołań węzłów pluginów oraz lokalną obsługę poleceń węzła.

    Pluginy udostępniające niebezpieczne polecenia hosta węzła powinny zarejestrować zasadę wywołań węzłów za pomocą `api.registerNodeInvokePolicy(...)`. Zasada działa w Gateway po sprawdzeniu listy dozwolonych poleceń i przed przekazaniem polecenia do węzła, więc bezpośrednie wywołania `node.invoke` oraz narzędzia pluginów wyższego poziomu korzystają z tej samej ścieżki egzekwowania.

    <Warning>
    Opcjonalne pole `scopes` żąda zakresów operatora Gateway dla wywołania. OpenClaw respektuje je tylko dla pluginów w pakiecie i zaufanych instalacji oficjalnych pluginów; żądania z innych pluginów nie podnoszą uprawnień wywołania. Używaj go tylko wtedy, gdy zaufany plugin musi wywołać polecenie węzła z bardziej restrykcyjnym zakresem Gateway, takim jak `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Powiąż runtime przepływu zadań z istniejącym kluczem sesji OpenClaw lub zaufanym kontekstem narzędzia, a następnie twórz przepływy zadań i zarządzaj nimi bez przekazywania właściciela przy każdym wywołaniu.

    Przepływ zadań śledzi trwały stan wieloetapowego przepływu pracy. Nie jest harmonogramem:
    używaj Cron lub `api.session.workflow.scheduleSessionTurn(...)` do przyszłych
    wybudzeń, a następnie użyj `managedFlows` z zaplanowanego zwrotu, gdy ta praca
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

    Używa podstawowej konfiguracji `messages.tts` i wyboru dostawcy. Zwraca bufor audio PCM + częstotliwość próbkowania.

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
    Bieżący zrzut konfiguracji runtime i transakcyjne zapisy konfiguracji. Preferuj
    konfigurację, która została już przekazana do aktywnej ścieżki wywołania; używaj
    `current()` tylko wtedy, gdy handler potrzebuje bezpośrednio zrzutu procesu.

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
    gatewayowi.

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
    liczniki obcięcia, `code`, `signal`, `killed`, `termination` oraz
    `noOutputTimedOut`. Wyniki timeoutu i timeoutu braku wyjścia zgłaszają `code: 124`,
    gdy proces podrzędny nie podaje niezerowego kodu wyjścia. Wyjścia sygnałowe
    niezwiązane z timeoutem nadal mogą zwracać `code: null`, więc użyj `termination` i
    `noOutputTimedOut`, aby odróżnić przyczyny timeoutu.

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
    Rozpoznawanie katalogu stanu i magazyn kluczowany oparty na SQLite.

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

    Magazyny kluczowane przetrwają ponowne uruchomienia i są izolowane według id Pluginu powiązanego z runtime. Użyj `registerIfAbsent(...)` do atomowych roszczeń deduplikacyjnych: zwraca `true`, gdy klucz był nieobecny albo wygasł i został zarejestrowany, albo `false`, gdy istnieje już aktywna wartość, bez nadpisywania jej wartości, czasu utworzenia ani TTL. Limity: `maxEntries` na przestrzeń nazw, 6000 aktywnych wierszy na Plugin, wartości JSON poniżej 64 KB oraz opcjonalne wygasanie TTL. Gdy zapis przekroczyłby limit wierszy Pluginu, runtime może usunąć najstarsze aktywne wiersze z zapisywanej przestrzeni nazw; sąsiednie przestrzenie nazw nie są usuwane przy tym zapisie, a zapis nadal zakończy się niepowodzeniem, jeśli przestrzeń nazw nie może zwolnić wystarczającej liczby wierszy.

    <Warning>
    W tym wydaniu tylko dołączone Pluginy.
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
    Pomocniki runtime specyficzne dla kanału (dostępne po załadowaniu Pluginu kanału).

    `api.runtime.channel.media` to preferowana powierzchnia do pobierania i przechowywania mediów kanału:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Użyj `saveRemoteMedia(...)`, gdy zdalny URL ma stać się mediami OpenClaw. Użyj `saveResponseMedia(...)`, gdy Plugin już pobrał `Response` z własną obsługą uwierzytelniania, przekierowań lub listy dozwolonych elementów. Używaj `readRemoteMediaBuffer(...)` tylko wtedy, gdy Plugin potrzebuje surowych bajtów do inspekcji, transformacji, odszyfrowania lub ponownego przesłania. `fetchRemoteMedia(...)` pozostaje przestarzałym aliasem zgodności dla `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` to współdzielona powierzchnia zasad wzmiankowania przychodzącego dla dołączonych Pluginów kanałów używających wstrzykiwania runtime:

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

    Dostępne pomocniki wzmiankowania:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` celowo nie udostępnia starszych pomocników zgodności `resolveMentionGating*`. Preferuj znormalizowaną ścieżkę `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Przechowywanie odwołań runtime

Użyj `createPluginRuntimeStore`, aby przechować odwołanie runtime do użycia poza wywołaniem zwrotnym `register`:

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
Preferuj `pluginId` dla tożsamości runtime-store. Niższego poziomu forma `key` służy do rzadkich przypadków, w których jeden Plugin celowo potrzebuje więcej niż jednego slotu runtime.
</Note>

## Inne pola najwyższego poziomu `api`

Poza `api.runtime` obiekt API udostępnia także:

<ParamField path="api.id" type="string">
  Id Pluginu.
</ParamField>
<ParamField path="api.name" type="string">
  Nazwa wyświetlana Pluginu.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Bieżąca migawka konfiguracji (aktywna migawka runtime w pamięci, jeśli jest dostępna).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfiguracja specyficzna dla Pluginu z `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger ograniczony do zakresu (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Bieżący tryb ładowania; `"setup-runtime"` to lekki etap uruchamiania/konfiguracji przed pełnym wpisem.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Rozwiązuje ścieżkę względną względem katalogu głównego Pluginu.
</ParamField>

## Powiązane

- [Elementy wewnętrzne Pluginu](/pl/plugins/architecture) — model możliwości i rejestr
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry`
- [Przegląd SDK](/pl/plugins/sdk-overview) — odwołanie do podścieżek
