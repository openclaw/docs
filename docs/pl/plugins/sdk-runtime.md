---
read_when:
    - Musisz wywołać pomocniki rdzenia z Plugin (TTS, STT, generowanie obrazów, wyszukiwanie w sieci, subagent, węzły)
    - Chcesz zrozumieć, co udostępnia api.runtime
    - Uzyskujesz dostęp do funkcji pomocniczych konfiguracji, agenta lub mediów z kodu pluginu
sidebarTitle: Runtime helpers
summary: api.runtime -- wstrzyknięte pomocniki środowiska uruchomieniowego dostępne dla pluginów
title: Pomocniki środowiska uruchomieniowego Plugin
x-i18n:
    generated_at: "2026-05-10T19:49:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7771eb89c8ce132cc3c908b3775a89243db310d3d3222452b21ec070a78cd23d
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Odwołanie dla obiektu `api.runtime` wstrzykiwanego do każdego pluginu podczas rejestracji. Używaj tych pomocników zamiast bezpośrednio importować elementy wewnętrzne hosta.

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" href="/pl/plugins/sdk-channel-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych pomocników w kontekście pluginów kanałów.
  </Card>
  <Card title="Pluginy dostawców" href="/pl/plugins/sdk-provider-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych pomocników w kontekście pluginów dostawców.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Ładowanie i zapisywanie konfiguracji

Preferuj konfigurację, która została już przekazana do aktywnej ścieżki wywołania, na przykład `api.config` podczas rejestracji albo argument `cfg` w wywołaniach zwrotnych kanału/dostawcy. Dzięki temu przez pracę przepływa jedna migawka procesu zamiast ponownego parsowania konfiguracji na gorących ścieżkach.

Używaj `api.runtime.config.current()` tylko wtedy, gdy długo działający handler potrzebuje bieżącej migawki procesu, a do tej funkcji nie przekazano żadnej konfiguracji. Zwrócona wartość jest tylko do odczytu; przed edycją sklonuj ją albo użyj pomocnika mutacji.

Fabryki narzędzi otrzymują `ctx.runtimeConfig` oraz `ctx.getRuntimeConfig()`. Użyj gettera wewnątrz wywołania zwrotnego `execute` długo działającego narzędzia, gdy konfiguracja może się zmienić po utworzeniu definicji narzędzia.

Utrwalaj zmiany za pomocą `api.runtime.config.mutateConfigFile(...)` albo `api.runtime.config.replaceConfigFile(...)`. Każdy zapis musi wybrać jawną politykę `afterWrite`:

- `afterWrite: { mode: "auto" }` pozwala, aby decyzję podjął mechanizm przeładowania planera Gateway.
- `afterWrite: { mode: "restart", reason: "..." }` wymusza czysty restart, gdy komponent zapisujący wie, że przeładowanie na gorąco jest niebezpieczne.
- `afterWrite: { mode: "none", reason: "..." }` wyłącza automatyczne przeładowanie/restart tylko wtedy, gdy wywołujący odpowiada za dalsze działania.

Pomocniki mutacji zwracają `afterWrite` oraz typowane podsumowanie `followUp`, aby wywołujący mogli zalogować albo przetestować, czy zażądali restartu. Gateway nadal decyduje, kiedy ten restart faktycznie nastąpi.

`api.runtime.config.loadConfig()` i `api.runtime.config.writeConfigFile(...)` to przestarzałe pomocniki zgodności w ramach `runtime-config-load-write`. Ostrzegają raz w czasie działania i pozostają dostępne dla starych zewnętrznych pluginów w oknie migracji. Dołączone pluginy nie mogą ich używać; strażnicy granicy konfiguracji zawiodą, jeśli kod pluginu je wywoła albo zaimportuje te pomocniki z podścieżek SDK pluginów.

Przy bezpośrednich importach SDK używaj wyspecjalizowanych podścieżek konfiguracji zamiast szerokiego beczkowego eksportu zgodności
`openclaw/plugin-sdk/config-runtime`: `config-contracts` dla
typów, `plugin-config-runtime` dla asercji już załadowanej konfiguracji i wyszukiwania
wpisów pluginów, `runtime-config-snapshot` dla bieżących migawek procesu oraz
`config-mutation` dla zapisów. Testy dołączonych pluginów powinny mockować te wyspecjalizowane
podścieżki bezpośrednio, zamiast mockować szeroki beczkowy eksport zgodności.

Wewnętrzny kod runtime OpenClaw podąża w tym samym kierunku: załaduj konfigurację raz na granicy CLI, Gateway albo procesu, a następnie przekazuj tę wartość dalej. Udane zapisy mutacji odświeżają migawkę runtime procesu i zwiększają jej wewnętrzną rewizję; długo działające pamięci podręczne powinny opierać klucz na kluczu cache należącym do runtime, zamiast lokalnie serializować konfigurację. Długo działające moduły runtime mają skaner o zerowej tolerancji dla otaczających wywołań `loadConfig()`; użyj przekazanego `cfg`, żądania `context.getRuntimeConfig()` albo `getRuntimeConfig()` na jawnej granicy procesu.

Ścieżki wykonywania dostawców i kanałów muszą używać aktywnej migawki konfiguracji runtime, a nie migawki pliku zwróconej do odczytu zwrotnego lub edycji konfiguracji. Migawki plików zachowują wartości źródłowe, takie jak znaczniki SecretRef, dla UI i zapisów; wywołania zwrotne dostawców potrzebują rozwiązanego widoku runtime. Gdy pomocnik może zostać wywołany z aktywną migawką źródłową albo aktywną migawką runtime, przed odczytem poświadczeń przejdź przez `selectApplicableRuntimeConfig()`.

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

    `runEmbeddedAgent(...)` to neutralny pomocnik do uruchamiania normalnej tury agenta OpenClaw z kodu pluginu. Używa tego samego rozwiązywania dostawcy/modelu i wyboru harnessu agenta co odpowiedzi wyzwalane przez kanał.

    `runEmbeddedPiAgent(...)` pozostaje aliasem zgodności.

    `resolveThinkingPolicy(...)` zwraca obsługiwane przez dostawcę/model poziomy myślenia oraz opcjonalną wartość domyślną. Pluginy dostawców odpowiadają za profil specyficzny dla modelu przez swoje hooki myślenia, więc pluginy narzędzi powinny wywoływać ten pomocnik runtime zamiast importować lub duplikować listy dostawców.

    `normalizeThinkingLevel(...)` konwertuje tekst użytkownika, taki jak `on`, `x-high` albo `extra high`, do kanonicznego zapisanego poziomu przed sprawdzeniem go względem rozwiązanej polityki.

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

    Do zapisów runtime preferuj `updateSessionStore(...)` albo `updateSessionStoreEntry(...)`. Przechodzą przez writer magazynu sesji należący do Gateway, zachowują równoczesne aktualizacje i ponownie wykorzystują gorący cache. `saveSessionStore(...)` pozostaje dostępne dla zgodności i przepisań w stylu konserwacji offline.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Domyślne stałe modelu i dostawcy:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Uruchom należące do hosta uzupełnianie tekstu bez importowania elementów wewnętrznych dostawcy ani
    duplikowania przygotowania modelu/uwierzytelnienia/bazowego adresu URL OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Summarize this transcript." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    Pomocnik używa tej samej ścieżki przygotowania prostego uzupełniania co
    wbudowany runtime OpenClaw oraz należącej do hosta migawki konfiguracji runtime. Silniki kontekstu
    otrzymują powiązaną z sesją funkcję `llm.complete`, więc wywołania modelu używają
    agenta aktywnej sesji i nie przechodzą po cichu do agenta domyślnego. Wynik
    zawiera atrybucję dostawcy/modelu/agenta oraz znormalizowane użycie tokenów,
    cache i szacowanego kosztu, gdy jest dostępne.

    <Warning>
    Nadpisania modelu wymagają zgody operatora przez `plugins.entries.<id>.llm.allowModelOverride: true` w konfiguracji. Użyj `plugins.entries.<id>.llm.allowedModels`, aby ograniczyć zaufane pluginy do konkretnych kanonicznych celów `provider/model`. Uzupełnienia między agentami wymagają `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
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
    Nadpisania modelu (`provider`/`model`) wymagają zgody operatora przez `plugins.entries.<id>.subagent.allowModelOverride: true` w konfiguracji. Niezaufane pluginy nadal mogą uruchamiać subagentów, ale żądania nadpisania są odrzucane.
    </Warning>

    `deleteSession(...)` może usuwać sesje utworzone przez ten sam plugin za pomocą `api.runtime.subagent.run(...)`. Usuwanie dowolnych sesji użytkownika lub operatora nadal wymaga żądania Gateway z zakresem administratora.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Wyświetl połączone węzły i wywołaj polecenie hostowane na węźle z kodu pluginu załadowanego przez Gateway albo z poleceń CLI pluginu. Użyj tego, gdy plugin odpowiada za lokalną pracę na sparowanym urządzeniu, na przykład most przeglądarki lub audio na innym Macu.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Wewnątrz Gateway ten runtime działa w procesie. W poleceniach CLI pluginu wywołuje skonfigurowany Gateway przez RPC, więc polecenia takie jak `openclaw googlemeet recover-tab` mogą sprawdzać sparowane węzły z terminala. Polecenia węzłów nadal przechodzą przez normalne parowanie węzłów Gateway, listy dozwolonych poleceń, polityki wywołań węzłów pluginów oraz obsługę poleceń lokalnych dla węzła.

    Pluginy, które udostępniają niebezpieczne polecenia hostowane na węźle, powinny zarejestrować politykę wywołania węzła za pomocą `api.registerNodeInvokePolicy(...)`. Polityka działa w Gateway po sprawdzeniach listy dozwolonych poleceń i przed przekazaniem polecenia do węzła, więc bezpośrednie wywołania `node.invoke` i narzędzia pluginów wyższego poziomu współdzielą tę samą ścieżkę egzekwowania.

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

    Użyj `bindSession({ sessionKey, requesterOrigin })`, gdy masz już zaufany klucz sesji OpenClaw z własnej warstwy wiązania. Nie wiąż z surowych danych wejściowych użytkownika.

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
    Analiza obrazów, dźwięku i wideo.

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
    Bieżący zrzut konfiguracji środowiska uruchomieniowego oraz transakcyjne zapisy konfiguracji. Preferuj
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
    która zapisuje intencję autora zapisu bez odbierania kontroli nad restartem
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
    Rejestrowanie dzienników.

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

    Magazyny kluczowane przetrwają restarty i są izolowane według identyfikatora Plugin powiązanego ze środowiskiem uruchomieniowym. Użyj `registerIfAbsent(...)` do atomowych zgłoszeń deduplikacji: zwraca `true`, gdy brakowało klucza albo wygasł i został zarejestrowany, albo `false`, gdy aktywna wartość już istnieje bez nadpisywania jej wartości, czasu utworzenia ani TTL. Limity: `maxEntries` na przestrzeń nazw, 1000 aktywnych wierszy na Plugin, wartości JSON poniżej 64 KB oraz opcjonalne wygaśnięcie TTL.

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
    Pomocniki środowiska uruchomieniowego specyficzne dla kanału (dostępne, gdy załadowany jest Plugin kanału).

    `api.runtime.channel.mentions` to współdzielona powierzchnia zasad wzmianek przychodzących dla dołączonych Pluginów kanałów, które używają wstrzykiwania środowiska uruchomieniowego:

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

    Dostępne pomocniki wzmianek:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` celowo nie udostępnia starszych pomocników zgodności `resolveMentionGating*`. Preferuj znormalizowaną ścieżkę `{ facts, policy }`.

  </Accordion>
</AccordionGroup>

## Przechowywanie referencji środowiska uruchomieniowego

Użyj `createPluginRuntimeStore`, aby przechowywać referencję środowiska uruchomieniowego do użycia poza wywołaniem zwrotnym `register`:

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
Preferuj `pluginId` jako tożsamość magazynu środowiska uruchomieniowego. Niższego poziomu forma `key` jest przeznaczona dla nietypowych przypadków, w których jeden Plugin celowo potrzebuje więcej niż jednego slotu środowiska uruchomieniowego.
</Note>

## Inne pola najwyższego poziomu `api`

Poza `api.runtime` obiekt API udostępnia również:

<ParamField path="api.id" type="string">
  Identyfikator Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nazwa wyświetlana Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Bieżący zrzut konfiguracji (aktywny zrzut środowiska uruchomieniowego w pamięci, gdy jest dostępny).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfiguracja specyficzna dla Plugin z `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger o określonym zakresie (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno startu/konfiguracji przed pełnym wejściem.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Rozwiązuje ścieżkę względem katalogu głównego Plugin.
</ParamField>

## Powiązane

- [Wewnętrzne mechanizmy Plugin](/pl/plugins/architecture) — model możliwości i rejestr
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry`
- [Przegląd SDK](/pl/plugins/sdk-overview) — referencja podścieżek
