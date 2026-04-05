---
read_when:
    - Chcesz mieć niezawodny fallback, gdy dostawcy API zawodzą
    - Uruchamiasz Claude CLI lub inne lokalne AI CLI i chcesz je ponownie wykorzystać
    - Chcesz zrozumieć most MCP local loopback do dostępu narzędzi backendu CLI
summary: 'Backendy CLI: lokalny fallback AI CLI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-04-05T13:52:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 823f3aeea6be50e5aa15b587e0944e79e862cecb7045f9dd44c93c544024bce1
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backendy CLI (środowisko uruchomieniowe fallback)

OpenClaw może uruchamiać **lokalne AI CLI** jako **fallback tylko dla tekstu**, gdy dostawcy API są niedostępni,
objęci limitami albo tymczasowo działają nieprawidłowo. To rozwiązanie jest celowo zachowawcze:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  (domyślnie Claude CLI) mogą otrzymywać narzędzia gateway przez most MCP local loopback.
- **Strumieniowanie JSONL** (Claude CLI używa `--output-format stream-json` z
  `--include-partial-messages`; prompty są wysyłane przez stdin).
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

To rozwiązanie zostało zaprojektowane jako **siatka bezpieczeństwa**, a nie główna ścieżka. Używaj go, gdy
chcesz uzyskiwać odpowiedzi tekstowe typu „zawsze działa” bez polegania na zewnętrznych API.

Jeśli chcesz pełnego środowiska harness z kontrolą sesji ACP, zadaniami w tle,
powiązaniem wątku/konwersacji oraz trwałymi zewnętrznymi sesjami kodowania, użyj
[ACP Agents](/tools/acp-agents). Backendy CLI nie są ACP.

## Przyjazny dla początkujących szybki start

Możesz używać Claude CLI **bez żadnego config** (pakietowa wtyczka Anthropic
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model claude-cli/claude-sonnet-4-6
```

Codex CLI również działa od razu po instalacji (przez pakietową wtyczkę OpenAI):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jeśli Twój gateway działa pod launchd/systemd i `PATH` jest minimalne, dodaj tylko
ścieżkę do polecenia:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

To wszystko. Nie są potrzebne klucze ani dodatkowy config uwierzytelniania poza samym CLI.

Jeśli używasz pakietowego backendu CLI jako **głównego dostawcy wiadomości** na
hoście gateway, OpenClaw teraz automatycznie ładuje należącą do niego pakietową wtyczkę, gdy Twój config
jawnie odwołuje się do tego backendu w referencji modelu lub w
`agents.defaults.cliBackends`.

## Używanie jako fallback

Dodaj backend CLI do listy fallbacków, aby uruchamiał się tylko wtedy, gdy modele podstawowe zawiodą:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6", "claude-cli/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
        "claude-cli/claude-opus-4-6": {},
      },
    },
  },
}
```

Uwagi:

- Jeśli używasz `agents.defaults.models` (listy dozwolonych), musisz uwzględnić `claude-cli/...`.
- Jeśli podstawowy dostawca zawiedzie (uwierzytelnianie, limity, timeouty), OpenClaw
  spróbuje następnie backendu CLI.
- Pakietowy backend Claude CLI nadal akceptuje krótsze aliasy, takie jak
  `claude-cli/opus`, `claude-cli/opus-4.6` lub `claude-cli/sonnet`, ale dokumentacja
  i przykłady config używają kanonicznych referencji `claude-cli/claude-*`.

## Przegląd konfiguracji

Wszystkie backendy CLI znajdują się w:

```
agents.defaults.cliBackends
```

Każdy wpis jest kluczowany przez **id dostawcy** (np. `claude-cli`, `my-cli`).
Id dostawcy staje się lewą stroną referencji modelu:

```
<provider>/<model>
```

### Przykładowa konfiguracja

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

1. **Wybiera backend** na podstawie prefiksu dostawcy (`claude-cli/...`).
2. **Buduje prompt systemowy** przy użyciu tego samego promptu OpenClaw i kontekstu workspace.
3. **Uruchamia CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
4. **Parsuje dane wyjściowe** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala identyfikatory sesji** per backend, aby kolejne tury ponownie używały tej samej sesji CLI.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) albo
  `sessionArgs` (placeholder `{sessionId}`), gdy identyfikator trzeba wstawić
  do wielu flag.
- Jeśli CLI używa **podpolecenia resume** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy został wcześniej zapisany.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje kolejność uruchomień w tym samym torze.
- Większość CLI serializuje na jednym torze dostawcy.
- `claude-cli` jest węższe: wznowione uruchomienia są serializowane per identyfikator sesji Claude, a nowe uruchomienia per ścieżka workspace. Niezależne workspace mogą działać równolegle.
- OpenClaw porzuca zapisane ponowne użycie sesji CLI, gdy zmienia się stan uwierzytelniania backendu, w tym po ponownym logowaniu, rotacji tokena lub zmianie poświadczeń profilu uwierzytelniania.

## Obrazy (pass-through)

Jeśli Twoje CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli `imageArg` jest ustawione, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` nie jest ustawione, OpenClaw dodaje
ścieżki plików do promptu (wstrzykiwanie ścieżek), co wystarcza dla CLI, które automatycznie
ładują pliki lokalne z podanych zwykłych ścieżek (zachowanie Claude CLI).

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst + identyfikator sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response` oraz
  zużycie z `stats`, gdy `usage` nie istnieje albo jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład `stream-json` Claude CLI
  i `--json` Codex CLI) oraz wyodrębnia końcową wiadomość agenta i identyfikatory
  sesji, jeśli są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używane jest stdin.

## Ustawienia domyślne (należące do wtyczki)

Pakietowa wtyczka Anthropic rejestruje ustawienia domyślne dla `claude-cli`:

- `command: "claude"`
- `args: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions"]`
- `resumeArgs: ["-p", "--output-format", "stream-json", "--include-partial-messages", "--verbose", "--permission-mode", "bypassPermissions", "--resume", "{sessionId}"]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `systemPromptArg: "--append-system-prompt"`
- `sessionArg: "--session-id"`
- `systemPromptWhen: "first"`
- `sessionMode: "always"`

Pakietowa wtyczka OpenAI również rejestruje ustawienia domyślne dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Pakietowa wtyczka Google również rejestruje ustawienia domyślne dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--prompt", "--output-format", "json"]`
- `resumeArgs: ["--resume", "{sessionId}", "--prompt", "--output-format", "json"]`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Wymaganie wstępne: lokalne Gemini CLI musi być zainstalowane i dostępne jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Zużycie wraca do `stats`, gdy `usage` nie istnieje lub jest puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli `stats.input` nie istnieje, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko wtedy, gdy to potrzebne (najczęściej: bezwzględna ścieżka `command`).

## Ustawienia domyślne należące do wtyczki

Domyślne ustawienia backendów CLI są teraz częścią powierzchni wtyczek:

- Wtyczki rejestrują je przez `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w referencjach modeli.
- Config użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje domyślne ustawienia wtyczki.
- Czyszczenie config specyficznego dla backendu pozostaje po stronie wtyczki przez opcjonalny
  hook `normalizeConfig`.

## Nakładki MCP dla pakietów

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć generowaną nakładkę config MCP przez `bundleMcp: true`.

Obecne zachowanie pakietowe:

- `claude-cli`: `bundleMcp: true` (domyślnie)
- `codex-cli`: bez nakładki MCP dla pakietu
- `google-gemini-cli`: bez nakładki MCP dla pakietu

Gdy MCP dla pakietu jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP local loopback, który udostępnia narzędzia gateway procesowi CLI
- uwierzytelnia most tokenem per sesja (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery MCP dla pakietu dla bieżącego workspace
- scala je z istniejącym `--mcp-config` backendu
- przepisuje argumenty CLI, aby przekazać `--strict-mcp-config --mcp-config <generated-file>`

Flaga `--strict-mcp-config` uniemożliwia Claude CLI dziedziczenie otaczających
serwerów MCP na poziomie użytkownika lub globalnym. Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal
wstrzykuje restrykcyjny pusty config, aby uruchomienia w tle pozostały izolowane.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Jednak backendy z `bundleMcp: true` (domyślnie
  Claude CLI) otrzymują narzędzia gateway przez most MCP local loopback,
  więc Claude CLI może wywoływać narzędzia OpenClaw przez natywne wsparcie MCP.
- **Strumieniowanie zależy od backendu.** Claude CLI używa strumieniowania JSONL
  (`stream-json` z `--include-partial-messages`); inne backendy CLI mogą
  nadal buforować dane aż do zakończenia.
- **Wyjścia strukturalne** zależą od formatu JSON danego CLI.
- **Sesje Codex CLI** są wznawiane przez wyjście tekstowe (bez JSONL), co jest mniej
  ustrukturyzowane niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby mapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że ustawiono `sessionArg` i że `sessionMode` nie ma wartości
  `none` (Codex CLI obecnie nie może wznawiać z wyjściem JSON).
- **Obrazy są ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki do plików).
