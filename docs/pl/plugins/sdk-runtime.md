---
read_when:
    - Musisz wywołać pomocnicze funkcje rdzenia z poziomu Plugin (TTS, STT, generowanie obrazów, wyszukiwanie w sieci, subagent, węzły)
    - Chcesz zrozumieć, co udostępnia api.runtime
    - Uzyskujesz dostęp do funkcji pomocniczych konfiguracji, agenta lub multimediów z kodu Plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- wstrzyknięte pomocniki runtime dostępne dla wtyczek
title: Funkcje pomocnicze środowiska wykonawczego Plugin
x-i18n:
    generated_at: "2026-05-06T17:59:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ce16325613efc07bccb8baee3fdb46eb28452b760a6c265d3a25d36bfcbcf0f
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Dokumentacja referencyjna obiektu `api.runtime` wstrzykiwanego do każdego Plugin podczas rejestracji. Używaj tych pomocników zamiast bezpośrednio importować wewnętrzne elementy hosta.

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" href="/pl/plugins/sdk-channel-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych pomocników w kontekście Plugin kanałów.
  </Card>
  <Card title="Pluginy dostawców" href="/pl/plugins/sdk-provider-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych pomocników w kontekście Plugin dostawców.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Wczytywanie i zapisywanie konfiguracji

Preferuj konfigurację, która została już przekazana do aktywnej ścieżki wywołania, na przykład `api.config` podczas rejestracji albo argument `cfg` w wywołaniach zwrotnych kanału/dostawcy. Dzięki temu jedna migawka procesu przepływa przez pracę zamiast ponownego parsowania konfiguracji na gorących ścieżkach.

Używaj `api.runtime.config.current()` tylko wtedy, gdy długotrwały handler potrzebuje bieżącej migawki procesu, a do tej funkcji nie przekazano żadnej konfiguracji. Zwracana wartość jest tylko do odczytu; przed edycją sklonuj ją albo użyj pomocnika mutacji.

Fabryki narzędzi otrzymują `ctx.runtimeConfig` oraz `ctx.getRuntimeConfig()`. Używaj gettera wewnątrz wywołania zwrotnego `execute` długotrwałego narzędzia, gdy konfiguracja może się zmienić po utworzeniu definicji narzędzia.

Utrwalaj zmiany za pomocą `api.runtime.config.mutateConfigFile(...)` albo `api.runtime.config.replaceConfigFile(...)`. Każdy zapis musi wybrać jawną politykę `afterWrite`:

- `afterWrite: { mode: "auto" }` pozwala mechanizmowi przeładowania Gateway podjąć decyzję.
- `afterWrite: { mode: "restart", reason: "..." }` wymusza czysty restart, gdy zapisujący wie, że przeładowanie na gorąco jest niebezpieczne.
- `afterWrite: { mode: "none", reason: "..." }` blokuje automatyczne przeładowanie/restart tylko wtedy, gdy wywołujący odpowiada za dalsze działania.

Pomocniki mutacji zwracają `afterWrite` oraz typowane podsumowanie `followUp`, aby wywołujący mogli logować albo testować, czy zażądali restartu. Gateway nadal odpowiada za to, kiedy ten restart faktycznie nastąpi.

`api.runtime.config.loadConfig()` oraz `api.runtime.config.writeConfigFile(...)` są przestarzałymi pomocnikami zgodności pod `runtime-config-load-write`. Ostrzegają raz w czasie działania i pozostają dostępne dla starych zewnętrznych Plugin w oknie migracji. Dołączone Plugin nie mogą ich używać; strażnicy granicy konfiguracji zawodzą, jeśli kod Plugin je wywoła albo zaimportuje tych pomocników ze ścieżek podrzędnych SDK Plugin.

W przypadku bezpośrednich importów SDK używaj wyspecjalizowanych ścieżek podrzędnych konfiguracji zamiast szerokiego beczkowego modułu zgodności
`openclaw/plugin-sdk/config-runtime`: `config-types` dla
typów, `plugin-config-runtime` dla asercji już wczytanej konfiguracji i wyszukiwania wpisu Plugin,
`runtime-config-snapshot` dla bieżących migawek procesu oraz
`config-mutation` dla zapisów. Testy dołączonych Plugin powinny mockować te wyspecjalizowane
ścieżki podrzędne bezpośrednio zamiast mockować szeroki beczkowy moduł zgodności.

Wewnętrzny kod runtime OpenClaw podąża w tym samym kierunku: wczytaj konfigurację raz na granicy CLI, Gateway albo procesu, a następnie przekazuj tę wartość dalej. Udane zapisy mutacji odświeżają migawkę runtime procesu i zwiększają jej wewnętrzną rewizję; długotrwałe cache powinny opierać klucze na kluczu cache należącym do runtime zamiast lokalnie serializować konfigurację. Długotrwałe moduły runtime mają skaner o zerowej tolerancji dla otaczających wywołań `loadConfig()`; użyj przekazanego `cfg`, żądania `context.getRuntimeConfig()` albo `getRuntimeConfig()` na jawnej granicy procesu.

Ścieżki wykonywania dostawców i kanałów muszą używać aktywnej migawki konfiguracji runtime, a nie migawki pliku zwróconej do odczytu zwrotnego lub edycji konfiguracji. Migawki plików zachowują wartości źródłowe, takie jak znaczniki SecretRef, dla UI i zapisów; wywołania zwrotne dostawców potrzebują rozwiązanego widoku runtime. Gdy pomocnik może zostać wywołany zarówno z aktywną migawką źródłową, jak i aktywną migawką runtime, przed odczytem poświadczeń przeprowadź przepływ przez `selectApplicableRuntimeConfig()`.

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

    `runEmbeddedAgent(...)` to neutralny pomocnik do uruchamiania normalnej tury agenta OpenClaw z kodu Plugin. Używa tego samego rozwiązywania dostawcy/modelu i wyboru uprzęży agenta co odpowiedzi wyzwalane przez kanał.

    `runEmbeddedPiAgent(...)` pozostaje aliasem zgodności.

    `resolveThinkingPolicy(...)` zwraca obsługiwane poziomy myślenia dostawcy/modelu oraz opcjonalną wartość domyślną. Plugin dostawców odpowiadają za profil specyficzny dla modelu przez swoje hooki myślenia, więc Plugin narzędziowe powinny wywoływać tego pomocnika runtime zamiast importować albo duplikować listy dostawców.

    `normalizeThinkingLevel(...)` konwertuje tekst użytkownika, taki jak `on`, `x-high` albo `extra high`, na kanoniczny przechowywany poziom przed sprawdzeniem go względem rozwiązanej polityki.

    **Pomocniki magazynu sesji** znajdują się pod `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Preferuj `updateSessionStore(...)` albo `updateSessionStoreEntry(...)` dla zapisów runtime. Przechodzą one przez należący do Gateway mechanizm zapisu magazynu sesji, zachowują współbieżne aktualizacje i ponownie wykorzystują gorący cache. `saveSessionStore(...)` pozostaje dostępne dla zgodności i przepisań w stylu konserwacji offline.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Domyślne stałe modelu i dostawcy:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Uruchamianie i zarządzanie działaniami subagentów w tle.

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
    Nadpisania modelu (`provider`/`model`) wymagają zgody operatora przez `plugins.entries.<id>.subagent.allowModelOverride: true` w konfiguracji. Niezaufane Plugin nadal mogą uruchamiać subagentów, ale żądania nadpisania są odrzucane.
    </Warning>

    `deleteSession(...)` może usuwać sesje utworzone przez ten sam Plugin za pomocą `api.runtime.subagent.run(...)`. Usuwanie dowolnych sesji użytkownika lub operatora nadal wymaga żądania Gateway o zakresie administracyjnym.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Wyświetlanie połączonych węzłów i wywoływanie polecenia hostowanego przez węzeł z kodu Plugin wczytanego przez Gateway albo z poleceń CLI Plugin. Użyj tego, gdy Plugin odpowiada za pracę lokalną na sparowanym urządzeniu, na przykład most przeglądarki albo audio na innym Macu.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Wewnątrz Gateway ten runtime działa w procesie. W poleceniach CLI Plugin wywołuje skonfigurowany Gateway przez RPC, więc polecenia takie jak `openclaw googlemeet recover-tab` mogą sprawdzać sparowane węzły z terminala. Polecenia węzłów nadal przechodzą przez zwykłe parowanie węzłów Gateway, listy dozwolonych poleceń, polityki wywołań węzłów Plugin oraz lokalną obsługę poleceń węzła.

    Plugin, które ujawniają niebezpieczne polecenia hostowane przez węzeł, powinny zarejestrować politykę wywołań węzła za pomocą `api.registerNodeInvokePolicy(...)`. Polityka działa w Gateway po sprawdzeniach listy dozwolonych poleceń i przed przekazaniem polecenia do węzła, więc bezpośrednie wywołania `node.invoke` i narzędzia Plugin wyższego poziomu współdzielą tę samą ścieżkę egzekwowania.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Powiąż runtime Task Flow z istniejącym kluczem sesji OpenClaw albo zaufanym kontekstem narzędzia, a następnie twórz i zarządzaj Task Flows bez przekazywania właściciela przy każdym wywołaniu.

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

    Użyj `bindSession({ sessionKey, requesterOrigin })`, gdy masz już zaufany klucz sesji OpenClaw z własnej warstwy wiązania. Nie wiąż z surowego wejścia użytkownika.

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
    Bieżąca migawka konfiguracji środowiska runtime i transakcyjne zapisy konfiguracji. Preferuj
    konfigurację, która została już przekazana do aktywnej ścieżki wywołania; używaj
    `current()` tylko wtedy, gdy handler potrzebuje bezpośrednio migawki procesu.

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
    która rejestruje intencję zapisującego bez odbierania kontroli nad ponownym uruchomieniem
    Gateway.

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
    Rozwiązywanie uwierzytelniania modeli i dostawców.

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

    Magazyny kluczowane przetrwają ponowne uruchomienia i są izolowane przez identyfikator pluginu powiązany ze środowiskiem runtime. Użyj `registerIfAbsent(...)` do atomowych roszczeń deduplikacyjnych: zwraca `true`, gdy klucza brakowało albo wygasł i został zarejestrowany, albo `false`, gdy aktywna wartość już istnieje bez nadpisywania jej wartości, czasu utworzenia ani TTL. Limity: `maxEntries` na przestrzeń nazw, 1000 aktywnych wierszy na plugin, wartości JSON poniżej 64 KB oraz opcjonalne wygasanie TTL.

    <Warning>
    W tym wydaniu tylko wbudowane pluginy.
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
    Pomocnicze funkcje runtime specyficzne dla kanału (dostępne, gdy załadowany jest plugin kanału).

    `api.runtime.channel.mentions` to współdzielona powierzchnia zasad wzmianek przychodzących dla wbudowanych pluginów kanałów używających wstrzykiwania runtime:

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

    Dostępne funkcje pomocnicze wzmianek:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` celowo nie udostępnia starszych funkcji pomocniczych zgodności `resolveMentionGating*`. Preferuj znormalizowaną ścieżkę `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Przechowywanie referencji runtime

Użyj `createPluginRuntimeStore`, aby przechować referencję runtime do użycia poza callbackiem `register`:

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
Preferuj `pluginId` jako tożsamość magazynu runtime. Niższopoziomowa forma `key` jest przeznaczona dla rzadkich przypadków, w których jeden plugin celowo potrzebuje więcej niż jednego slotu runtime.
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
  Bieżąca migawka konfiguracji (aktywna migawka runtime w pamięci, gdy jest dostępna).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger zakresowy (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Bieżący tryb ładowania; `"setup-runtime"` to lekki okres uruchamiania/konfiguracji przed pełnym punktem wejścia.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Rozwiąż ścieżkę względem katalogu głównego pluginu.
</ParamField>

## Powiązane

- [Wewnętrzne mechanizmy pluginów](/pl/plugins/architecture) — model możliwości i rejestr
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry`
- [Przegląd SDK](/pl/plugins/sdk-overview) — referencja podścieżek
