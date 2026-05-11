---
read_when:
    - Musisz wywołać pomocnicze funkcje rdzenia z Plugin (TTS, STT, generowanie obrazów, wyszukiwanie w sieci, subagent, węzły)
    - Chcesz zrozumieć, co udostępnia api.runtime
    - Uzyskujesz dostęp do pomocników konfiguracji, agenta lub multimediów z kodu Pluginu
sidebarTitle: Runtime helpers
summary: api.runtime -- wstrzyknięte pomocnicze funkcje środowiska uruchomieniowego dostępne dla pluginów
title: Funkcje pomocnicze środowiska uruchomieniowego Plugin
x-i18n:
    generated_at: "2026-05-11T20:35:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d94d9f69c51711800e557274299b0e84679deda4e48c743bf193b7f32fe8d71
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Dokumentacja referencyjna obiektu `api.runtime` wstrzykiwanego do każdego pluginu podczas rejestracji. Używaj tych helperów zamiast bezpośrednio importować wewnętrzne moduły hosta.

<CardGroup cols={2}>
  <Card title="Pluginy kanałów" href="/pl/plugins/sdk-channel-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych helperów w kontekście pluginów kanałów.
  </Card>
  <Card title="Pluginy dostawców" href="/pl/plugins/sdk-provider-plugins">
    Przewodnik krok po kroku, który pokazuje użycie tych helperów w kontekście pluginów dostawców.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Ładowanie i zapisywanie konfiguracji

Preferuj konfigurację, która została już przekazana do aktywnej ścieżki wywołania, na przykład `api.config` podczas rejestracji albo argument `cfg` w callbackach kanału/dostawcy. Dzięki temu przez pracę przepływa jedna migawka procesu zamiast ponownego parsowania konfiguracji na gorących ścieżkach.

Używaj `api.runtime.config.current()` tylko wtedy, gdy długotrwały handler potrzebuje bieżącej migawki procesu, a do tej funkcji nie przekazano konfiguracji. Zwrócona wartość jest tylko do odczytu; sklonuj ją albo użyj helpera mutacji przed edycją.

Fabryki narzędzi otrzymują `ctx.runtimeConfig` oraz `ctx.getRuntimeConfig()`. Używaj gettera wewnątrz callbacku `execute` długotrwałego narzędzia, gdy konfiguracja może zmienić się po utworzeniu definicji narzędzia.

Utrwalaj zmiany za pomocą `api.runtime.config.mutateConfigFile(...)` albo `api.runtime.config.replaceConfigFile(...)`. Każdy zapis musi wybrać jawną politykę `afterWrite`:

- `afterWrite: { mode: "auto" }` pozwala mechanizmowi przeładowania gatewaya zdecydować.
- `afterWrite: { mode: "restart", reason: "..." }` wymusza czysty restart, gdy zapisujący wie, że przeładowanie na gorąco jest niebezpieczne.
- `afterWrite: { mode: "none", reason: "..." }` pomija automatyczne przeładowanie/restart tylko wtedy, gdy wywołujący odpowiada za dalsze działania.

Helpery mutacji zwracają `afterWrite` oraz typowane podsumowanie `followUp`, aby wywołujący mogli logować lub testować, czy zażądali restartu. Gateway nadal odpowiada za to, kiedy ten restart faktycznie nastąpi.

`api.runtime.config.loadConfig()` oraz `api.runtime.config.writeConfigFile(...)` to przestarzałe helpery zgodności w ramach `runtime-config-load-write`. Ostrzegają raz w czasie działania i pozostają dostępne dla starych zewnętrznych pluginów w okresie migracji. Wbudowane pluginy nie mogą ich używać; strażnicy granicy konfiguracji kończą się niepowodzeniem, jeśli kod pluginu je wywołuje albo importuje te helpery z podścieżek SDK pluginów.

Przy bezpośrednich importach SDK używaj wyspecjalizowanych podścieżek konfiguracji zamiast szerokiego
barrela zgodności `openclaw/plugin-sdk/config-runtime`: `config-contracts` dla
typów, `plugin-config-runtime` dla asercji już załadowanej konfiguracji i wyszukiwania
wpisu pluginu, `runtime-config-snapshot` dla bieżących migawek procesu oraz
`config-mutation` dla zapisów. Testy wbudowanych pluginów powinny mockować te wyspecjalizowane
podścieżki bezpośrednio zamiast mockować szeroki barrel zgodności.

Wewnętrzny kod runtime OpenClaw podąża w tym samym kierunku: załaduj konfigurację raz na granicy CLI, Gatewaya lub procesu, a następnie przekazuj tę wartość dalej. Udane zapisy mutacji odświeżają migawkę runtime procesu i zwiększają jej wewnętrzną rewizję; długotrwałe cache powinny używać klucza cache należącego do runtime zamiast lokalnie serializować konfigurację. Długotrwałe moduły runtime mają skaner o zerowej tolerancji dla otaczających wywołań `loadConfig()`; użyj przekazanego `cfg`, żądania `context.getRuntimeConfig()` albo `getRuntimeConfig()` na jawnej granicy procesu.

Ścieżki wykonania dostawców i kanałów muszą używać aktywnej migawki konfiguracji runtime, a nie migawki pliku zwróconej do odczytu zwrotnego lub edycji konfiguracji. Migawki pliku zachowują wartości źródłowe, takie jak markery SecretRef, dla UI i zapisów; callbacki dostawców potrzebują rozwiązanego widoku runtime. Gdy helper może zostać wywołany zarówno z aktywną migawką źródłową, jak i aktywną migawką runtime, przed odczytem poświadczeń przejdź przez `selectApplicableRuntimeConfig()`.

## Przestrzenie nazw runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Tożsamość agenta, katalogi i zarządzanie sesją.

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

    `runEmbeddedAgent(...)` to neutralny helper do uruchamiania zwykłej tury agenta OpenClaw z kodu pluginu. Używa tego samego rozwiązywania dostawcy/modelu i wyboru harnessu agenta co odpowiedzi wyzwalane przez kanał.

    `runEmbeddedPiAgent(...)` pozostaje aliasem zgodności.

    `resolveThinkingPolicy(...)` zwraca obsługiwane poziomy thinking dostawcy/modelu oraz opcjonalną wartość domyślną. Pluginy dostawców odpowiadają za profil specyficzny dla modelu poprzez swoje hooki thinking, więc pluginy narzędziowe powinny wywoływać ten helper runtime zamiast importować lub duplikować listy dostawców.

    `normalizeThinkingLevel(...)` konwertuje tekst użytkownika, taki jak `on`, `x-high` lub `extra high`, na kanoniczny zapisany poziom przed sprawdzeniem go względem rozwiązanej polityki.

    **Helpery magazynu sesji** znajdują się w `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(storePath);
    await api.runtime.agent.session.updateSessionStore(storePath, (nextStore) => {
      // Patch one entry without replacing the whole file from stale state.
      nextStore[sessionKey] = { ...nextStore[sessionKey], thinkingLevel: "high" };
    });
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

    Do zapisów runtime preferuj `updateSessionStore(...)` albo `updateSessionStoreEntry(...)`. Przechodzą przez writer magazynu sesji należący do Gatewaya, zachowują równoległe aktualizacje i ponownie używają gorącego cache. `saveSessionStore(...)` pozostaje dostępne dla zgodności i przeróbek w stylu konserwacji offline.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Domyślne stałe modelu i dostawcy:

    ```typescript
    const model = api.runtime.agent.defaults.model; // e.g. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // e.g. "anthropic"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Uruchom uzupełnianie tekstu należące do hosta bez importowania wewnętrznych modułów dostawcy ani
    duplikowania przygotowania modelu/auth/base URL OpenClaw.

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
    otrzymują powiązaną z sesją capability `llm.complete`, więc wywołania modelu używają
    agenta aktywnej sesji i nie przełączają się po cichu na agenta domyślnego. Wynik
    obejmuje atrybucję dostawcy/modelu/agenta oraz znormalizowane użycie tokenów,
    cache i szacowanego kosztu, gdy są dostępne.

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
    Nadpisania modelu (`provider`/`model`) wymagają zgody operatora przez `plugins.entries.<id>.subagent.allowModelOverride: true` w konfiguracji. Niezaufane pluginy nadal mogą uruchamiać subagentów, ale żądania nadpisania są odrzucane.
    </Warning>

    `deleteSession(...)` może usuwać sesje utworzone przez ten sam plugin przez `api.runtime.subagent.run(...)`. Usuwanie dowolnych sesji użytkownika lub operatora nadal wymaga żądania Gatewaya o zakresie administratora.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Wyświetl połączone węzły i wywołaj polecenie hosta węzła z kodu pluginu załadowanego przez Gateway albo z poleceń CLI pluginu. Użyj tego, gdy plugin odpowiada za lokalną pracę na sparowanym urządzeniu, na przykład most przeglądarki lub audio na innym Macu.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Wewnątrz Gatewaya ten runtime działa w procesie. W poleceniach CLI pluginu wywołuje skonfigurowany Gateway przez RPC, więc polecenia takie jak `openclaw googlemeet recover-tab` mogą sprawdzać sparowane węzły z terminala. Polecenia Node nadal przechodzą przez zwykłe parowanie węzłów Gatewaya, listy dozwolonych poleceń, polityki node-invoke pluginów i lokalną obsługę poleceń węzła.

    Pluginy, które udostępniają niebezpieczne polecenia hosta węzła, powinny zarejestrować politykę node-invoke za pomocą `api.registerNodeInvokePolicy(...)`. Polityka działa w Gatewayu po sprawdzeniu listy dozwolonych poleceń i przed przekazaniem polecenia do węzła, więc bezpośrednie wywołania `node.invoke` i narzędzia pluginów wyższego poziomu współdzielą tę samą ścieżkę egzekwowania.

  </Accordion>
  <Accordion title="api.runtime.tasks.managedFlows">
    Powiąż runtime Task Flow z istniejącym kluczem sesji OpenClaw lub zaufanym kontekstem narzędzia, a następnie twórz i zarządzaj Task Flows bez przekazywania właściciela przy każdym wywołaniu.

    Task Flow śledzi trwały stan wieloetapowego workflow. Nie jest schedulerem:
    użyj Cron albo `api.session.workflow.scheduleSessionTurn(...)` dla przyszłych
    wybudzeń, a następnie użyj `managedFlows` z zaplanowanej tury, gdy ta praca
    potrzebuje stanu flow, zadań podrzędnych, oczekiwań lub anulowania.

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

    Używaj `bindSession({ sessionKey, requesterOrigin })`, gdy masz już zaufany klucz sesji OpenClaw z własnej warstwy wiązania. Nie wiąż na podstawie surowych danych wejściowych użytkownika.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Synteza mowy z tekstu.

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
    Analiza obrazu, dźwięku i wideo.

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

    Zwraca `{ text: undefined }`, gdy nie zostanie wygenerowane żadne wyjście (np. pominięte wejście).

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
    Niskopoziomowe narzędzia do obsługi multimediów.

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
    która rejestruje intencję zapisującego bez odbierania kontroli nad restartem
    Gateway.

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

    Magazyny kluczowane przetrwają restarty i są izolowane według identyfikatora pluginu powiązanego ze środowiskiem uruchomieniowym. Używaj `registerIfAbsent(...)` do atomowego zajmowania kluczy deduplikacji: zwraca `true`, gdy brakowało klucza albo wygasł i został zarejestrowany, albo `false`, gdy aktywna wartość już istnieje, bez nadpisywania jej wartości, czasu utworzenia ani TTL. Limity: `maxEntries` na przestrzeń nazw, 1000 aktywnych wierszy na plugin, wartości JSON poniżej 64 KB oraz opcjonalne wygasanie TTL.

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
    Pomocniki środowiska uruchomieniowego specyficzne dla kanału (dostępne, gdy załadowany jest plugin kanału).

    `api.runtime.channel.mentions` to wspólny interfejs zasad obsługi przychodzących wzmianek dla dołączonych pluginów kanałów, które używają wstrzykiwania środowiska uruchomieniowego:

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
  <Step title="Podłącz w punkcie wejścia">
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
Preferuj `pluginId` jako identyfikator magazynu środowiska uruchomieniowego. Niższego poziomu forma `key` jest przeznaczona dla rzadkich przypadków, gdy jeden plugin celowo potrzebuje więcej niż jednego slotu środowiska uruchomieniowego.
</Note>

## Inne pola najwyższego poziomu `api`

Poza `api.runtime` obiekt API udostępnia także:

<ParamField path="api.id" type="string">
  Identyfikator Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nazwa wyświetlana Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Bieżąca migawka konfiguracji (aktywna migawka środowiska uruchomieniowego w pamięci, gdy jest dostępna).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Konfiguracja specyficzna dla Plugin z `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger o określonym zakresie (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym punktem wejścia.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Rozwiąż ścieżkę względem katalogu głównego Plugin.
</ParamField>

## Powiązane

- [Wewnętrzne mechanizmy Plugin](/pl/plugins/architecture) — model możliwości i rejestr
- [Punkty wejścia SDK](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry`
- [Omówienie SDK](/pl/plugins/sdk-overview) — dokumentacja ścieżek podrzędnych
