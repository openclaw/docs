---
read_when:
    - Chcesz mieć niezawodny mechanizm awaryjny, gdy dostawcy API zawodzą
    - Uruchamiasz Codex CLI lub inne lokalne narzędzia CLI AI i chcesz je ponownie wykorzystać
    - Chcesz zrozumieć most pętli zwrotnej MCP zapewniający backendowi CLI dostęp do narzędzi
summary: 'Backendy CLI: lokalny mechanizm awaryjny CLI AI z opcjonalnym mostkiem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-04-30T09:51:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchamiać **lokalne AI CLI** jako **wyłącznie tekstowy mechanizm awaryjny**, gdy dostawcy API nie działają,
mają limity szybkości albo tymczasowo działają nieprawidłowo. To celowo konserwatywne rozwiązanie:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia Gateway przez mostek MCP w pętli zwrotnej.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki obrazów.

Zaprojektowano to jako **siatkę bezpieczeństwa**, a nie główną ścieżkę. Użyj tego, gdy
chcesz mieć tekstowe odpowiedzi, które „zawsze działają”, bez polegania na zewnętrznych API.

Jeśli chcesz pełne środowisko wykonawcze uprzęży z kontrolą sesji ACP, zadaniami w tle,
wiązaniem wątków/konwersacji oraz trwałymi zewnętrznymi sesjami kodowania, użyj zamiast tego
[Agenci ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

## Szybki start przyjazny początkującym

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony Plugin OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jeśli Gateway działa pod launchd/systemd, a PATH jest minimalny, dodaj tylko
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

To wszystko. Nie potrzeba kluczy ani dodatkowej konfiguracji uwierzytelniania poza samym CLI.

Jeśli używasz dołączonego backendu CLI jako **głównego dostawcy wiadomości** na
hoście Gateway, OpenClaw automatycznie wczytuje teraz właścicielski dołączony Plugin, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w referencji modelu albo pod
`agents.defaults.cliBackends`.

## Używanie jako mechanizmu awaryjnego

Dodaj backend CLI do listy awaryjnej, aby uruchamiał się tylko wtedy, gdy modele podstawowe zawiodą:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Uwagi:

- Jeśli używasz `agents.defaults.models` (listy dozwolonych), musisz uwzględnić tam także modele backendu CLI.
- Jeśli główny dostawca zawiedzie (uwierzytelnianie, limity szybkości, przekroczenia czasu), OpenClaw spróbuje
  następnie użyć backendu CLI.

## Omówienie konfiguracji

Wszystkie backendy CLI znajdują się pod:

```
agents.defaults.cliBackends
```

Każdy wpis jest indeksowany przez **identyfikator dostawcy** (np. `codex-cli`, `my-cli`).
Identyfikator dostawcy staje się lewą stroną referencji modelu:

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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
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
2. **Buduje prompt systemowy** przy użyciu tego samego promptu OpenClaw i kontekstu obszaru roboczego.
3. **Wykonuje CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces Claude stdio przy życiu dla każdej
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
nadpisanie konfiguracji Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude
`--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do
pliku tymczasowego dla każdej świeżej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje migawkę Skills OpenClaw
na dwa sposoby: kompaktowy katalog Skills OpenClaw w dołączonym prompcie systemowym oraz
tymczasowy Plugin Claude Code przekazany z `--plugin-dir`. Plugin zawiera
tylko Skills kwalifikujące się dla danego agenta/sesji, więc natywny mechanizm rozpoznawania skill Claude Code
widzi ten sam odfiltrowany zestaw, który OpenClaw w przeciwnym razie reklamowałby w
prompcie. Nadpisania środowiska skill / kluczy API nadal są stosowane przez OpenClaw do
środowiska procesu potomnego dla danego uruchomienia.

Claude CLI ma także własny nieinteraktywny tryb uprawnień. OpenClaw mapuje go
na istniejącą politykę wykonywania zamiast dodawać konfigurację specyficzną dla Claude: gdy
efektywna żądana polityka wykonywania to YOLO (`tools.exec.security: "full"` oraz
`tools.exec.ask: "off"`), OpenClaw dodaje `--permission-mode bypassPermissions`.
Ustawienia `agents.list[].tools.exec` dla agenta zastępują globalne `tools.exec` dla
tego agenta. Aby wymusić inny tryb Claude, ustaw jawne surowe argumenty backendu,
takie jak `--permission-mode default` lub `--permission-mode acceptEdits` pod
`agents.defaults.cliBackends.claude-cli.args` oraz odpowiadające im `resumeArgs`.

Zanim OpenClaw będzie mógł użyć dołączonego backendu `claude-cli`, sam Claude Code
musi już być zalogowany na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Używaj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy plik binarny `claude`
nie jest już dostępny w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) albo
  `sessionArgs` (placeholder `{sessionId}`), gdy identyfikator musi zostać wstawiony
  do wielu flag.
- Jeśli CLI używa **podpolecenia wznawiania** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` podczas wznawiania) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy wcześniej został zapisany.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`
  oraz `input: "stdin"`, więc kolejne tury ponownie używają działającego procesu Claude,
  gdy jest aktywny. Ciepłe stdio jest teraz domyślne, także dla niestandardowych konfiguracji,
  które pomijają pola transportu. Jeśli Gateway zostanie zrestartowany albo bezczynny proces
  zakończy działanie, OpenClaw wznawia pracę z zapisanego identyfikatora sesji Claude. Zapisane
  identyfikatory sesji są weryfikowane względem istniejącego czytelnego transkryptu projektu przed
  wznowieniem, więc fantomowe powiązania są czyszczone z `reason=transcript-missing`
  zamiast po cichu rozpoczynać świeżą sesję Claude CLI pod `--resume`.
- Zapisane sesje CLI to ciągłość należąca do dostawcy. Domyślny dzienny reset sesji
  ich nie odcina; `/reset` oraz jawne polityki `session.reset` nadal to robią.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje uporządkowanie uruchomień na tej samej ścieżce.
- Większość CLI serializuje na jednej ścieżce dostawcy.
- OpenClaw odrzuca ponowne użycie zapisanej sesji CLI, gdy zmieni się wybrana tożsamość uwierzytelniania,
  w tym zmieniony identyfikator profilu uwierzytelniania, statyczny klucz API, statyczny token albo tożsamość
  konta OAuth, gdy CLI ją udostępnia. Rotacja tokenów dostępu i odświeżania OAuth
  nie odcina zapisanej sesji CLI. Jeśli CLI nie udostępnia
  stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI wymusić uprawnienia wznowienia.

## Wstęp awaryjny z sesji claude-cli

Gdy próba `claude-cli` przełącza się awaryjnie na kandydata innego niż CLI w
[`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw zasila
następną próbę wstępem kontekstowym pobranym z lokalnego transkryptu JSONL Claude Code
w `~/.claude/projects/`. Bez tego ziarna dostawca awaryjny wystartowałby na zimno,
ponieważ własny transkrypt sesji OpenClaw jest pusty dla uruchomień `claude-cli`.

- Wstęp preferuje najnowsze podsumowanie `/compact` albo znacznik `compact_boundary`,
  a następnie dołącza najnowsze tury po granicy do limitu znaków. Tury sprzed granicy
  są odrzucane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są scalane do kompaktowych wskazówek `(tool call: name)` oraz
  `(tool result: …)`, aby uczciwie trzymać budżet promptu. Podsumowanie jest
  oznaczane jako `(truncated)`, jeśli się przepełni.
- Przełączenia awaryjne z `claude-cli` do `claude-cli` u tego samego dostawcy polegają na własnym
  `--resume` Claude i pomijają wstęp.
- Ziarno ponownie używa istniejącej walidacji ścieżki pliku sesji Claude, więc
  nie można odczytać dowolnych ścieżek.

## Obrazy (przekazywanie dalej)

Jeśli Twoje CLI akceptuje ścieżki obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli ustawiono `imageArg`, te
ścieżki są przekazywane jako argumenty CLI. Jeśli brakuje `imageArg`, OpenClaw dołącza
ścieżki plików do promptu (wstrzyknięcie ścieżek), co wystarcza dla CLI, które automatycznie
wczytują lokalne pliki ze zwykłych ścieżek.

## Dane wejściowe / wyjściowe

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst oraz identyfikator sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response` oraz
  użycie ze `stats`, gdy `usage` nie istnieje lub jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz
  identyfikatory sesji, gdy są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używane jest stdin.

## Domyślne ustawienia (należące do Plugin)

Dołączony Plugin OpenAI rejestruje także domyślne ustawienie dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączony Plugin Google rejestruje także domyślne ustawienie dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Wymaganie wstępne: lokalne Gemini CLI musi być zainstalowane i dostępne jako
`gemini` w `PATH` (`brew install gemini-cli` albo
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie wraca do `stats`, gdy `usage` nie istnieje lub jest puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko w razie potrzeby (częsty przypadek: bezwzględna ścieżka `command`).

## Domyślne ustawienia należące do Plugin

Domyślne ustawienia backendu CLI są teraz częścią powierzchni Plugin:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w referencjach modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal zastępuje domyślne ustawienie Plugin.
- Czyszczenie konfiguracji specyficzne dla backendu pozostaje własnością Plugin przez opcjonalny
  hook `normalizeConfig`.

Pluginy, które potrzebują niewielkich shimów zgodności promptów/wiadomości, mogą deklarować
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
przepisuje strumieniowane delty asystenta i sparsowany tekst końcowy, zanim OpenClaw obsłuży
własne znaczniki sterujące i dostarczanie do kanału.

W przypadku CLI, które emitują JSONL zgodne z Claude Code stream-json, ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki Bundle MCP

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć wygenerowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`.

Obecne zachowanie wbudowane:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: wbudowane nadpisania konfiguracji dla `mcp_servers`; wygenerowany
  serwer loopback OpenClaw jest oznaczony trybem zatwierdzania narzędzi per serwer w Codex,
  aby wywołania MCP nie mogły zatrzymać się na lokalnych promptach zatwierdzenia
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy Bundle MCP jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP przez loopback, który udostępnia narzędzia gateway procesowi CLI
- uwierzytelnia most tokenem per sesja (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery Bundle MCP dla bieżącego obszaru roboczego
- scala je z dowolnym istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomienia przy użyciu trybu integracji należącego do backendu z rozszerzenia właściciela

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza Bundle MCP, aby uruchomienia w tle pozostały odizolowane.

Zakresowane do sesji wbudowane środowiska uruchomieniowe MCP są buforowane do ponownego użycia w sesji, a następnie
usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10
minut; ustaw `0`, aby wyłączyć). Jednorazowe uruchomienia osadzone, takie jak sondy uwierzytelniania,
generowanie sluga i żądania przywołania active-memory, czyszczą zasoby po zakończeniu uruchomienia, aby
procesy potomne stdio oraz strumienie Streamable HTTP/SSE nie żyły dłużej niż uruchomienie.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia Gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Streaming zależy od backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  dane aż do zakończenia.
- **Dane wyjściowe strukturalne** zależą od formatu JSON CLI.
- **Sesje Codex CLI** są wznawiane przez wyjście tekstowe (bez JSONL), które jest mniej
  ustrukturyzowane niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby zmapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie ma wartości
  `none` (Codex CLI obecnie nie może wznawiać z wyjściem JSON).
- **Obrazy ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki plików).

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
