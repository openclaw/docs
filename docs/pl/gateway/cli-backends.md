---
read_when:
    - Chcesz mieć niezawodny fallback, gdy dostawcy API zawodzą
    - Uruchamiasz Codex CLI lub inne lokalne AI CLI i chcesz używać ich ponownie
    - Chcesz zrozumieć most loopback MCP do dostępu narzędzi backendu CLI
summary: 'Backendy CLI: lokalny awaryjny fallback AI CLI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-04-07T09:44:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0e8c41f5f5a8e34466f6b765e5c08585ef1788fa9e9d953257324bcc6cbc414
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backendy CLI (awaryjny runtime)

OpenClaw może uruchamiać **lokalne AI CLI** jako **tekstowy fallback** gdy dostawcy API są niedostępni,
ograniczani limitami lub tymczasowo działają nieprawidłowo. To podejście jest celowo zachowawcze:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia gateway przez most loopback MCP.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

To rozwiązanie zostało zaprojektowane jako **siatka bezpieczeństwa**, a nie główna ścieżka. Używaj go, gdy
chcesz mieć odpowiedzi tekstowe typu „zawsze działa” bez polegania na zewnętrznych API.

Jeśli chcesz mieć pełny runtime harness z kontrolą sesji ACP, zadaniami w tle,
powiązaniem wątku/konwersacji i trwałymi zewnętrznymi sesjami kodowania, użyj
[ACP Agents](/pl/tools/acp-agents). Backendy CLI nie są ACP.

## Przyjazny dla początkujących szybki start

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączona wtyczka OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jeśli Twój gateway działa pod launchd/systemd i PATH jest minimalny, dodaj tylko
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

Jeśli używasz dołączonego backendu CLI jako **głównego dostawcy wiadomości** na
hoście gateway, OpenClaw teraz automatycznie ładuje odpowiednią dołączoną wtyczkę, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w odwołaniu do modelu lub w
`agents.defaults.cliBackends`.

## Używanie jako fallback

Dodaj backend CLI do listy fallbacków, aby był uruchamiany tylko wtedy, gdy modele podstawowe zawiodą:

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

- Jeśli używasz `agents.defaults.models` (listy dozwolonych), musisz uwzględnić tam również modele backendu CLI.
- Jeśli podstawowy dostawca zawiedzie (uwierzytelnianie, limity, timeouty), OpenClaw
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
2. **Buduje system prompt** przy użyciu tego samego promptu OpenClaw + kontekstu workspace.
3. **Uruchamia CLI** z id sesji (jeśli jest obsługiwane), aby historia pozostała spójna.
4. **Parsuje wyjście** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala id sesji** dla każdego backendu, aby kolejne tury używały tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) albo
  `sessionArgs` (placeholder `{sessionId}`), gdy ID trzeba wstawić
  do wielu flag.
- Jeśli CLI używa **podpolecenia resume** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj id sesji (nowe UUID, jeśli nic nie zapisano).
  - `existing`: wysyłaj id sesji tylko wtedy, gdy było wcześniej zapisane.
  - `none`: nigdy nie wysyłaj id sesji.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje uporządkowaną kolejność uruchomień w tym samym przebiegu.
- Większość CLI serializuje na jednym przebiegu dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmienia się stan uwierzytelnienia backendu, w tym po ponownym logowaniu, rotacji tokena lub zmianie poświadczeń profilu uwierzytelniania.

## Obrazy (pass-through)

Jeśli Twoje CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli ustawiono `imageArg`, te
ścieżki są przekazywane jako argumenty CLI. Jeśli brakuje `imageArg`, OpenClaw dopisuje
ścieżki plików do promptu (wstrzykiwanie ścieżek), co wystarcza dla CLI, które automatycznie
ładują lokalne pliki ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst + id sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response`, a
  informacje o zużyciu z `stats`, gdy `usage` nie istnieje lub jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji,
  jeśli są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używany jest stdin.

## Wartości domyślne (należące do wtyczki)

Dołączona wtyczka OpenAI rejestruje także wartość domyślną dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączona wtyczka Google rejestruje także wartość domyślną dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Wymaganie wstępne: lokalne Gemini CLI musi być zainstalowane i dostępne jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi o JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Zużycie korzysta z `stats` jako fallbacku, gdy `usage` nie istnieje lub jest puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko wtedy, gdy to potrzebne (najczęściej: bezwzględna ścieżka `command`).

## Wartości domyślne należące do wtyczki

Wartości domyślne backendu CLI są teraz częścią powierzchni wtyczki:

- Wtyczki rejestrują je przez `api.registerCliBackend(...)`.
- Backend `id` staje się prefiksem dostawcy w odwołaniach do modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje wartość domyślną wtyczki.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje po stronie wtyczki przez opcjonalny hook
  `normalizeConfig`.

## Nakładki bundle MCP

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć wygenerowaną nakładkę konfiguracji MCP przez `bundleMcp: true`.

Obecne zachowanie dla dołączonych backendów:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: wbudowane nadpisania konfiguracji dla `mcp_servers`
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy bundle MCP jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP loopback, który udostępnia narzędzia gateway procesowi CLI
- uwierzytelnia most tokenem na sesję (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego workspace
- scala je z dowolnym istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomienia przy użyciu trybu integracji należącego do backendu z odpowiedniego rozszerzenia

Jeśli nie są włączone żadne serwery MCP, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza bundle MCP, aby uruchomienia w tle pozostały odizolowane.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia gateway tylko wtedy, gdy włączają
  `bundleMcp: true`.
- **Strumieniowanie jest zależne od backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  do zakończenia działania.
- **Wyjścia strukturalne** zależą od formatu JSON danego CLI.
- **Sesje Codex CLI** są wznawiane przez wyjście tekstowe (bez JSONL), co jest mniej
  ustrukturyzowane niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby mapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że ustawiono `sessionArg` i `sessionMode` nie jest
  `none` (Codex CLI obecnie nie potrafi wznawiać z wyjściem JSON).
- **Obrazy są ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki plików).
