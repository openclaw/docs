---
read_when:
    - Potrzebujesz niezawodnej opcji zapasowej, gdy dostawcy API zawodzą.
    - Uruchamiasz Codex CLI lub inne lokalne interfejsy CLI AI i chcesz używać ich ponownie.
    - Chcesz zrozumieć most local loopback MCP do dostępu narzędzi backendu CLI.
summary: 'Backendy CLI: lokalny zapasowy interfejs CLI AI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-04-16T19:31:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 381273532a8622bc4628000a6fb999712b12af08faade2b5f2b7ac4cc7d23efe
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backendy CLI (zapasowe środowisko uruchomieniowe)

OpenClaw może uruchamiać **lokalne interfejsy CLI AI** jako **tekstową opcję zapasową**, gdy dostawcy API są niedostępni,
ograniczani limitami lub tymczasowo działają nieprawidłowo. To rozwiązanie jest celowo zachowawcze:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia gatewaya przez most MCP local loopback.
- **Strumieniowanie JSONL** dla interfejsów CLI, które je obsługują.
- **Sesje są obsługiwane** (dzięki temu kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

To rozwiązanie zostało zaprojektowane jako **siatka bezpieczeństwa**, a nie główna ścieżka. Używaj go, gdy
chcesz mieć tekstowe odpowiedzi typu „zawsze działa” bez polegania na zewnętrznych API.

Jeśli chcesz w pełni funkcjonalne środowisko z kontrolą sesji ACP, zadaniami w tle,
powiązaniem z wątkiem/konwersacją i trwałymi zewnętrznymi sesjami kodowania, użyj
[ACP Agents](/pl/tools/acp-agents). Backendy CLI nie są ACP.

## Szybki start dla początkujących

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony Plugin OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jeśli Twój gateway działa pod launchd/systemd i `PATH` jest minimalne, dodaj tylko
ścieżkę polecenia:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

To wszystko. Nie są potrzebne żadne klucze ani dodatkowa konfiguracja uwierzytelniania poza samym CLI.

Jeśli używasz dołączonego backendu CLI jako **głównego dostawcy wiadomości** na hoście
gatewaya, OpenClaw automatycznie załaduje należący do niego dołączony Plugin, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w odwołaniu do modelu lub pod
`agents.defaults.cliBackends`.

## Używanie jako opcji zapasowej

Dodaj backend CLI do listy opcji zapasowych, aby uruchamiał się tylko wtedy, gdy modele główne zawiodą:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Uwagi:

- Jeśli używasz `agents.defaults.models` (allowlisty), musisz uwzględnić tam również modele backendu CLI.
- Jeśli główny dostawca zawiedzie (uwierzytelnianie, limity, przekroczenie czasu), OpenClaw
  spróbuje następnie użyć backendu CLI.

## Przegląd konfiguracji

Wszystkie backendy CLI znajdują się pod:

```
agents.defaults.cliBackends
```

Każdy wpis jest kluczowany przez **id dostawcy** (np. `codex-cli`, `my-cli`).
Id dostawcy staje się lewą stroną odwołania do modelu:

```
<provider>/<model>
```

### Przykładowa konfiguracja

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Interfejsy CLI w stylu Codex mogą zamiast tego wskazywać plik promptu:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Jak to działa

1. **Wybiera backend** na podstawie prefiksu dostawcy (`codex-cli/...`).
2. **Buduje prompt systemowy** z użyciem tego samego promptu OpenClaw i kontekstu workspace.
3. **Uruchamia CLI** z id sesji (jeśli jest obsługiwane), aby historia pozostała spójna.
4. **Parsuje dane wyjściowe** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala id sesji** dla każdego backendu, dzięki czemu kolejne tury ponownie używają tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend OpenAI `codex-cli` przekazuje prompt systemowy OpenClaw przez
nadpisanie konfiguracji `model_instructions_file` w Codex (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude,
takiej jak `--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do
pliku tymczasowego dla każdej nowej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje migawkę Skills OpenClaw
na dwa sposoby: kompaktowy katalog Skills OpenClaw w dołączonym promptcie systemowym oraz
tymczasowy Plugin Claude Code przekazywany przez `--plugin-dir`. Plugin zawiera
wyłącznie kwalifikujące się Skills dla tego agenta/sesji, dzięki czemu natywny mechanizm rozpoznawania Skills w Claude Code
widzi ten sam przefiltrowany zestaw, który OpenClaw w przeciwnym razie reklamowałby w promptcie.
Nadpisania zmiennych środowiskowych/API key dla Skills są nadal stosowane przez OpenClaw do środowiska procesu podrzędnego dla danego uruchomienia.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (placeholder `{sessionId}`), gdy id musi zostać wstawione
  do wielu flag.
- Jeśli CLI używa **podpolecenia resume** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) oraz opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj id sesji (nowy UUID, jeśli nic nie zapisano).
  - `existing`: wysyłaj id sesji tylko wtedy, gdy zostało wcześniej zapisane.
  - `none`: nigdy nie wysyłaj id sesji.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje kolejność uruchomień w tym samym przebiegu.
- Większość interfejsów CLI serializuje na jednym przebiegu dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy stan uwierzytelnienia backendu się zmienia, w tym po ponownym logowaniu, rotacji tokena lub zmianie poświadczeń profilu uwierzytelniania.

## Obrazy (pass-through)

Jeśli Twój CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli `imageArg` jest ustawione, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` nie jest ustawione, OpenClaw dopisuje
ścieżki plików do promptu (wstrzyknięcie ścieżki), co wystarcza dla interfejsów CLI, które automatycznie
ładują pliki lokalne ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst oraz id sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response`, a
  użycie z `stats`, gdy `usage` nie istnieje lub jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji, gdy są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używany jest stdin.

## Wartości domyślne (własność Pluginu)

Dołączony Plugin OpenAI rejestruje także wartość domyślną dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączony Plugin Google rejestruje także wartość domyślną dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Wymaganie wstępne: lokalny Gemini CLI musi być zainstalowany i dostępny jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie przechodzi na `stats`, gdy `usage` jest nieobecne lub puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli `stats.input` nie istnieje, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko wtedy, gdy to konieczne (często: bezwzględna ścieżka `command`).

## Wartości domyślne będące własnością Pluginu

Wartości domyślne backendów CLI są teraz częścią powierzchni Pluginu:

- Pluginy rejestrują je przez `api.registerCliBackend(...)`.
- Backend `id` staje się prefiksem dostawcy w odwołaniach do modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje wartość domyślną Pluginu.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje własnością Pluginu dzięki opcjonalnemu hookowi
  `normalizeConfig`.

Pluginy, które potrzebują drobnych shimów zgodności promptów/wiadomości, mogą deklarować
dwukierunkowe transformacje tekstu bez zastępowania dostawcy ani backendu CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` przepisuje prompt systemowy i prompt użytkownika przekazywane do CLI. `output`
przepisuje strumieniowane delty asystenta i sparsowany końcowy tekst, zanim OpenClaw obsłuży
własne znaczniki sterujące i dostarczanie do kanału.

Dla interfejsów CLI, które emitują JSONL zgodny z Claude Code stream-json, ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki MCP bundle

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć wygenerowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`.

Bieżące dołączone zachowanie:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: wbudowane nadpisania konfiguracji dla `mcp_servers`
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy bundle MCP jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP local loopback, który udostępnia narzędzia gatewaya procesowi CLI
- uwierzytelnia most za pomocą tokena na sesję (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego workspace
- scala je z istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomienia przy użyciu trybu integracji będącego własnością backendu z rozszerzenia właściciela

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza bundle MCP, aby uruchomienia w tle pozostawały odizolowane.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia gatewaya tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie zależy od backendu.** Niektóre backendy strumieniują JSONL, inne buforują
  aż do zakończenia.
- **Wyjścia strukturalne** zależą od formatu JSON danego CLI.
- **Sesje Codex CLI** są wznawiane przez wyjście tekstowe (bez JSONL), co jest mniej
  ustrukturyzowane niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby odwzorować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie ma wartości
  `none` (Codex CLI obecnie nie może wznawiać z wyjściem JSON).
- **Obrazy są ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki do plików).
