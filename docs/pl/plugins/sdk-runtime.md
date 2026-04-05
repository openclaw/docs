---
read_when:
    - Musisz wywołać helpery core z poziomu pluginu (TTS, STT, generowanie obrazów, wyszukiwanie w sieci, subagent)
    - Chcesz zrozumieć, co udostępnia api.runtime
    - Uzyskujesz dostęp do helperów konfiguracji, agenta lub mediów z kodu pluginu
sidebarTitle: Runtime Helpers
summary: api.runtime -- wstrzyknięte helpery runtime dostępne dla pluginów
title: Helpery runtime pluginów
x-i18n:
    generated_at: "2026-04-05T14:02:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 667edff734fd30f9b05d55eae6360830a45ae8f3012159f88a37b5e05404e666
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

# Helpery runtime pluginów

Dokumentacja referencyjna obiektu `api.runtime`, wstrzykiwanego do każdego pluginu podczas
rejestracji. Używaj tych helperów zamiast bezpośrednio importować wewnętrzne elementy hosta.

<Tip>
  **Szukasz przewodnika krok po kroku?** Zobacz [Pluginy kanałów](/plugins/sdk-channel-plugins)
  lub [Pluginy providerów](/plugins/sdk-provider-plugins), aby zapoznać się z instrukcjami krok po kroku,
  które pokazują te helpery w kontekście.
</Tip>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Przestrzenie nazw runtime

### `api.runtime.agent`

Tożsamość agenta, katalogi i zarządzanie sesjami.

```typescript
// Ustal katalog roboczy agenta
const agentDir = api.runtime.agent.resolveAgentDir(cfg);

// Ustal workspace agenta
const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

// Pobierz tożsamość agenta
const identity = api.runtime.agent.resolveAgentIdentity(cfg);

// Pobierz domyślny poziom myślenia
const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

// Pobierz limit czasu agenta
const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

// Upewnij się, że workspace istnieje
await api.runtime.agent.ensureAgentWorkspace(cfg);

// Uruchom osadzonego agenta Pi
const agentDir = api.runtime.agent.resolveAgentDir(cfg);
const result = await api.runtime.agent.runEmbeddedPiAgent({
  sessionId: "my-plugin:task-1",
  runId: crypto.randomUUID(),
  sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
  workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
  prompt: "Summarize the latest changes",
  timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
});
```

**Helpery magazynu sesji** znajdują się pod `api.runtime.agent.session`:

```typescript
const storePath = api.runtime.agent.session.resolveStorePath(cfg);
const store = api.runtime.agent.session.loadSessionStore(cfg);
await api.runtime.agent.session.saveSessionStore(cfg, store);
const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
```

### `api.runtime.agent.defaults`

Domyślne stałe modelu i providera:

```typescript
const model = api.runtime.agent.defaults.model; // np. "anthropic/claude-sonnet-4-6"
const provider = api.runtime.agent.defaults.provider; // np. "anthropic"
```

### `api.runtime.subagent`

Uruchamiaj i zarządzaj uruchomieniami subagentów w tle.

```typescript
// Rozpocznij uruchomienie subagenta
const { runId } = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai", // opcjonalne nadpisanie
  model: "gpt-4.1-mini", // opcjonalne nadpisanie
  deliver: false,
});

// Poczekaj na zakończenie
const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

// Odczytaj wiadomości sesji
const { messages } = await api.runtime.subagent.getSessionMessages({
  sessionKey: "agent:main:subagent:search-helper",
  limit: 10,
});

// Usuń sesję
await api.runtime.subagent.deleteSession({
  sessionKey: "agent:main:subagent:search-helper",
});
```

<Warning>
  Nadpisania modelu (`provider`/`model`) wymagają zgody operatora przez
  `plugins.entries.<id>.subagent.allowModelOverride: true` w konfiguracji.
  Niezaufane pluginy nadal mogą uruchamiać subagentów, ale żądania nadpisania są odrzucane.
</Warning>

### `api.runtime.taskFlow`

Powiąż runtime Task Flow z istniejącym kluczem sesji OpenClaw lub zaufanym kontekstem
narzędzia, a następnie twórz i zarządzaj Task Flows bez przekazywania ownera przy każdym wywołaniu.

```typescript
const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

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

Użyj `bindSession({ sessionKey, requesterOrigin })`, gdy masz już
zaufany klucz sesji OpenClaw z własnej warstwy powiązań. Nie wykonuj powiązania na podstawie surowego
wejścia użytkownika.

### `api.runtime.tts`

Synteza mowy z tekstu.

```typescript
// Standardowe TTS
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// TTS zoptymalizowane pod telefonię
const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

// Wyświetl dostępne głosy
const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

Używa głównej konfiguracji `messages.tts` i wyboru providera. Zwraca bufor audio
PCM + częstotliwość próbkowania.

### `api.runtime.mediaUnderstanding`

Analiza obrazów, dźwięku i wideo.

```typescript
// Opisz obraz
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

// Transkrybuj audio
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  mime: "audio/ogg", // opcjonalne, gdy nie da się ustalić MIME
});

// Opisz wideo
const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

// Ogólna analiza pliku
const result = await api.runtime.mediaUnderstanding.runFile({
  filePath: "/tmp/inbound-file.pdf",
  cfg: api.config,
});
```

Zwraca `{ text: undefined }`, gdy nie powstanie żaden wynik (np. przy pominiętym wejściu).

<Info>
  `api.runtime.stt.transcribeAudioFile(...)` pozostaje aliasem zgodności
  dla `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
</Info>

### `api.runtime.imageGeneration`

Generowanie obrazów.

```typescript
const result = await api.runtime.imageGeneration.generate({
  prompt: "A robot painting a sunset",
  cfg: api.config,
});

const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
```

### `api.runtime.webSearch`

Wyszukiwanie w sieci.

```typescript
const providers = api.runtime.webSearch.listProviders({ config: api.config });

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: { query: "OpenClaw plugin SDK", count: 5 },
});
```

### `api.runtime.media`

Niskopoziomowe narzędzia do pracy z mediami.

```typescript
const webMedia = await api.runtime.media.loadWebMedia(url);
const mime = await api.runtime.media.detectMime(buffer);
const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
const metadata = await api.runtime.media.getImageMetadata(filePath);
const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
```

### `api.runtime.config`

Wczytywanie i zapisywanie konfiguracji.

```typescript
const cfg = await api.runtime.config.loadConfig();
await api.runtime.config.writeConfigFile(cfg);
```

### `api.runtime.system`

Narzędzia na poziomie systemu.

```typescript
await api.runtime.system.enqueueSystemEvent(event);
api.runtime.system.requestHeartbeatNow();
const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
const hint = api.runtime.system.formatNativeDependencyHint(pkg);
```

### `api.runtime.events`

Subskrypcje zdarzeń.

```typescript
api.runtime.events.onAgentEvent((event) => {
  /* ... */
});
api.runtime.events.onSessionTranscriptUpdate((update) => {
  /* ... */
});
```

### `api.runtime.logging`

Logowanie.

```typescript
const verbose = api.runtime.logging.shouldLogVerbose();
const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
```

### `api.runtime.modelAuth`

Rozwiązywanie uwierzytelniania modeli i providerów.

```typescript
const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
  provider: "openai",
  cfg,
});
```

### `api.runtime.state`

Ustalanie katalogu stanu.

```typescript
const stateDir = api.runtime.state.resolveStateDir();
```

### `api.runtime.tools`

Fabryki narzędzi pamięci i CLI.

```typescript
const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
api.runtime.tools.registerMemoryCli(/* ... */);
```

### `api.runtime.channel`

Helpery runtime specyficzne dla kanału (dostępne, gdy załadowany jest plugin kanału).

## Przechowywanie referencji do runtime

Użyj `createPluginRuntimeStore`, aby przechować referencję runtime do użycia poza
callbackiem `register`:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>("my-plugin runtime not initialized");

// In your entry point
export default defineChannelPluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Example",
  plugin: myPlugin,
  setRuntime: store.setRuntime,
});

// In other files
export function getRuntime() {
  return store.getRuntime(); // throws if not initialized
}

export function tryGetRuntime() {
  return store.tryGetRuntime(); // returns null if not initialized
}
```

## Inne pola najwyższego poziomu `api`

Poza `api.runtime` obiekt API udostępnia również:

| Pole                    | Typ                       | Opis                                                                                        |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Identyfikator pluginu                                                                       |
| `api.name`              | `string`                  | Nazwa wyświetlana pluginu                                                                   |
| `api.config`            | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywny snapshot runtime w pamięci, gdy jest dostępny)       |
| `api.pluginConfig`      | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                        |
| `api.logger`            | `PluginLogger`            | Logger o odpowiednim zakresie (`debug`, `info`, `warn`, `error`)                            |
| `api.registrationMode`  | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno startu/setupu przed pełnym entry   |
| `api.resolvePath(input)`| `(string) => string`      | Ustal ścieżkę względną względem katalogu głównego pluginu                                   |

## Powiązane

- [Przegląd SDK](/plugins/sdk-overview) -- dokumentacja subpath
- [Punkty wejścia SDK](/plugins/sdk-entrypoints) -- opcje `definePluginEntry`
- [Wnętrze pluginów](/plugins/architecture) -- model możliwości i rejestr
