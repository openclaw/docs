---
read_when:
    - Potrzebujesz niezawodnego mechanizmu zapasowego, gdy dostawcy API zawodzą.
    - Korzystasz z Codex CLI lub innych lokalnych CLI AI i chcesz używać ich ponownie.
    - Chcesz zrozumieć most local loopback MCP służący do dostępu narzędzi backendu CLI.
summary: 'Backendy CLI: lokalny mechanizm zapasowy AI CLI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-04-22T09:51:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3566d4f2b7a841473a4ed6379c1abd8dbd06c392dbff15ca37c4f8ea1e1ead51
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backendy CLI (zapasowe środowisko uruchomieniowe)

OpenClaw może uruchamiać **lokalne CLI AI** jako **zapasowe rozwiązanie tylko tekstowe**, gdy dostawcy API są niedostępni,
objęci limitami szybkości lub tymczasowo działają nieprawidłowo. To rozwiązanie jest celowo zachowawcze:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia Gateway przez most MCP local loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (dzięki czemu kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

To rozwiązanie jest zaprojektowane jako **siatka bezpieczeństwa**, a nie główna ścieżka. Używaj go wtedy, gdy
chcesz uzyskać odpowiedzi tekstowe typu „zawsze działa” bez polegania na zewnętrznych API.

Jeśli potrzebujesz pełnego środowiska harness z kontrolą sesji ACP, zadaniami w tle,
powiązaniem z wątkiem/konwersacją i trwałymi zewnętrznymi sesjami kodowania, użyj
[Agentów ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

## Szybki start dla początkujących

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony Plugin OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Jeśli Twój Gateway działa pod launchd/systemd i `PATH` jest minimalne, dodaj tylko
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

To wszystko. Nie są potrzebne klucze ani dodatkowa konfiguracja uwierzytelniania poza samym CLI.

Jeśli używasz dołączonego backendu CLI jako **głównego dostawcy wiadomości** na hoście
Gateway, OpenClaw automatycznie załaduje teraz należący do niego dołączony Plugin, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w odwołaniu do modelu lub w
`agents.defaults.cliBackends`.

## Używanie jako mechanizmu zapasowego

Dodaj backend CLI do listy zapasowej, aby był uruchamiany tylko wtedy, gdy podstawowe modele zawiodą:

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

- Jeśli używasz `agents.defaults.models` (listy dozwolonych), musisz uwzględnić tam także modele backendu CLI.
- Jeśli podstawowy dostawca zawiedzie (uwierzytelnianie, limity szybkości, przekroczenia czasu), OpenClaw
  spróbuje następnie użyć backendu CLI.

## Przegląd konfiguracji

Wszystkie backendy CLI znajdują się pod:

```
agents.defaults.cliBackends
```

Każdy wpis jest kluczowany przez **identyfikator dostawcy** (np. `codex-cli`, `my-cli`).
Identyfikator dostawcy staje się lewą stroną odwołania do modelu:

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
          // CLI w stylu Codex mogą zamiast tego wskazywać plik promptu:
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
2. **Buduje prompt systemowy** przy użyciu tego samego promptu OpenClaw i kontekstu przestrzeni roboczej.
3. **Uruchamia CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces stdio Claude aktywny dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stdin stream-json.
4. **Parsuje dane wyjściowe** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala identyfikatory sesji** dla każdego backendu, aby kolejne tury ponownie używały tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend OpenAI `codex-cli` przekazuje prompt systemowy OpenClaw przez
nadpisanie konfiguracji `model_instructions_file` w Codex (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude
`--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do
pliku tymczasowego dla każdej nowej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje migawkę Skills OpenClaw
na dwa sposoby: kompaktowy katalog Skills OpenClaw w dołączonym prompcie systemowym oraz
tymczasowy Plugin Claude Code przekazywany przez `--plugin-dir`. Plugin zawiera
tylko kwalifikujące się Skills dla danego agenta/sesji, więc natywny mechanizm rozpoznawania umiejętności Claude Code widzi ten sam filtrowany zestaw, który OpenClaw w przeciwnym razie reklamowałby w prompcie. Nadpisania zmiennych środowiskowych/kluczy API dla Skills są nadal stosowane przez OpenClaw do środowiska procesu podrzędnego dla danego uruchomienia.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (symbol zastępczy `{sessionId}`), gdy identyfikator musi zostać wstawiony
  do wielu flag.
- Jeśli CLI używa **podpolecenia wznawiania** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy był wcześniej zapisany.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- Dołączony backend `claude-cli` używa `liveSession: "claude-stdio"`, dzięki czemu
  kolejne tury ponownie używają aktywnego procesu Claude, gdy jest aktywny. Jeśli
  Gateway zostanie uruchomiony ponownie lub bezczynny proces zakończy działanie, OpenClaw wznowi pracę na podstawie zapisanego identyfikatora sesji Claude.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje uporządkowanie uruchomień w tym samym torze.
- Większość CLI serializuje na jednym torze dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy stan uwierzytelnienia backendu się zmienia, w tym przy ponownym logowaniu, rotacji tokenu lub zmianie poświadczenia profilu uwierzytelniania.

## Obrazy (pass-through)

Jeśli Twoje CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli ustawiono `imageArg`, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` nie jest ustawione, OpenClaw dołącza
ścieżki do plików do promptu (wstrzykiwanie ścieżek), co wystarcza dla CLI, które automatycznie
ładują pliki lokalne ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst + identyfikator sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response` i
  użycie z `stats`, gdy `usage` nie istnieje lub jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji,
  jeśli są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używany jest stdin.

## Ustawienia domyślne (należące do Plugin)

Dołączony Plugin OpenAI rejestruje także domyślne ustawienia dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączony Plugin Google rejestruje także domyślne ustawienia dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Warunek wstępny: lokalne Gemini CLI musi być zainstalowane i dostępne jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie przełącza się na `stats`, gdy `usage` nie istnieje lub jest puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli `stats.input` nie istnieje, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko wtedy, gdy to konieczne (typowy przypadek: bezwzględna ścieżka `command`).

## Domyślne ustawienia należące do Plugin

Domyślne ustawienia backendu CLI są teraz częścią powierzchni Plugin:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje ustawienia domyślne Plugin.
- Porządkowanie konfiguracji specyficznej dla backendu pozostaje własnością Plugin przez opcjonalny
  hook `normalizeConfig`.

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
własne znaczniki kontrolne i dostarczanie kanałowe.

Dla CLI emitujących JSONL zgodny z Claude Code stream-json ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki bundle MCP

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć generowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`.

Obecne zachowanie dołączonych komponentów:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: wbudowane nadpisania konfiguracji dla `mcp_servers`
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy bundle MCP jest włączone, OpenClaw:

- uruchamia serwer loopback HTTP MCP, który udostępnia narzędzia Gateway procesowi CLI
- uwierzytelnia most tokenem na sesję (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącej przestrzeni roboczej
- scala je z istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomienia przy użyciu należącego do backendu trybu integracji z rozszerzenia będącego właścicielem

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza bundle MCP, aby uruchomienia w tle pozostały odizolowane.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia Gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie zależy od backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  do zakończenia działania.
- **Ustrukturyzowane wyjścia** zależą od formatu JSON danego CLI.
- **Sesje Codex CLI** są wznawiane przez wyjście tekstowe (bez JSONL), co jest mniej
  ustrukturyzowane niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby odwzorować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie jest
  `none` (Codex CLI obecnie nie może wznawiać pracy z wyjściem JSON).
- **Obrazy są ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki do plików).
