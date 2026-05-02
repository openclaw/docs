---
read_when:
    - Potrzebujesz niezawodnego rozwiązania awaryjnego, gdy dostawcy API zawodzą
    - Korzystasz z Codex CLI lub innych lokalnych narzędzi CLI opartych na sztucznej inteligencji i chcesz używać ich ponownie
    - Chcesz zrozumieć mostek pętli zwrotnej MCP do dostępu do narzędzi backendu CLI
summary: 'Backendy CLI: lokalny mechanizm awaryjny AI CLI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-05-02T09:49:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f343469d6a42dc6146196355dc2ba3feed045515c3d8446941b90971aadc9a16
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchamiać **lokalne AI CLI** jako **awaryjny tryb wyłącznie tekstowy**, gdy dostawcy API są niedostępni,
ograniczeni limitami lub tymczasowo działają nieprawidłowo. To celowo konserwatywne rozwiązanie:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia Gateway przez most MCP typu loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

To rozwiązanie zaprojektowano jako **siatkę bezpieczeństwa**, a nie główną ścieżkę. Użyj go, gdy
chcesz uzyskiwać odpowiedzi tekstowe, które „zawsze działają”, bez polegania na zewnętrznych API.

Jeśli chcesz pełne środowisko wykonawcze uprzęży z kontrolami sesji ACP, zadaniami w tle,
wiązaniem wątku/konwersacji i trwałymi zewnętrznymi sesjami kodowania, użyj zamiast tego
[Agentów ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

## Szybki start przyjazny dla początkujących

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony Plugin OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jeśli Twój Gateway działa pod launchd/systemd, a PATH jest minimalne, dodaj tylko
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
hoście Gateway, OpenClaw automatycznie ładuje teraz dołączony Plugin właściciela, gdy konfiguracja
jawnie odwołuje się do tego backendu w referencji modelu albo w
`agents.defaults.cliBackends`.

## Używanie jako trybu awaryjnego

Dodaj backend CLI do listy awaryjnej, aby był uruchamiany tylko wtedy, gdy modele główne zawiodą:

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

- Jeśli używasz `agents.defaults.models` (listy dozwolonych), musisz uwzględnić tam również modele backendów CLI.
- Jeśli główny dostawca zawiedzie (uwierzytelnianie, limity szybkości, przekroczenia czasu), OpenClaw
  spróbuje następnie backendu CLI.

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
2. **Buduje prompt systemowy**, używając tego samego promptu OpenClaw i kontekstu obszaru roboczego.
3. **Wykonuje CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces stdio Claude przy życiu dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stdin stream-json.
4. **Parsuje wynik** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala identyfikatory sesji** dla każdego backendu, więc kolejne tury ponownie używają tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend OpenAI `codex-cli` przekazuje prompt systemowy OpenClaw przez
nadpisanie konfiguracji `model_instructions_file` w Codex (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude
`--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do
pliku tymczasowego dla każdej świeżej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje migawkę Skills OpenClaw
na dwa sposoby: kompaktowy katalog Skills OpenClaw w dołączonym prompcie systemowym oraz
tymczasowy Plugin Claude Code przekazany przez `--plugin-dir`. Plugin zawiera
tylko kwalifikujące się Skills dla danego agenta/sesji, więc natywny resolver umiejętności
Claude Code widzi ten sam odfiltrowany zestaw, który OpenClaw w przeciwnym razie zareklamowałby w
prompcie. Nadpisania zmiennych środowiskowych/API key dla Skill nadal są stosowane przez OpenClaw do
środowiska procesu potomnego dla uruchomienia.

Claude CLI ma też własny nieinteraktywny tryb uprawnień. OpenClaw mapuje go
na istniejącą politykę exec zamiast dodawać konfigurację specyficzną dla Claude: gdy
efektywna żądana polityka exec to YOLO (`tools.exec.security: "full"` i
`tools.exec.ask: "off"`), OpenClaw dodaje `--permission-mode bypassPermissions`.
Ustawienia `agents.list[].tools.exec` dla poszczególnych agentów zastępują globalne `tools.exec` dla
tego agenta. Aby wymusić inny tryb Claude, ustaw jawne surowe argumenty backendu,
takie jak `--permission-mode default` lub `--permission-mode acceptEdits` pod
`agents.defaults.cliBackends.claude-cli.args` i odpowiadające im `resumeArgs`.

Zanim OpenClaw będzie mógł użyć dołączonego backendu `claude-cli`, sam Claude Code
musi być już zalogowany na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Używaj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy plik binarny `claude`
nie jest już dostępny w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (placeholder `{sessionId}`), gdy identyfikator trzeba wstawić
  do wielu flag.
- Jeśli CLI używa **podpolecenia wznawiania** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy wcześniej jakiś zapisano.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`
  i `input: "stdin"`, więc kolejne tury ponownie używają aktywnego procesu Claude na żywo.
  Ciepłe stdio jest teraz domyślne, również dla niestandardowych konfiguracji,
  które pomijają pola transportu. Jeśli Gateway zostanie zrestartowany albo bezczynny proces
  zakończy działanie, OpenClaw wznawia od zapisanego identyfikatora sesji Claude. Zapisane
  identyfikatory sesji są weryfikowane względem istniejącej czytelnej transkrypcji projektu przed
  wznowieniem, więc widmowe powiązania są czyszczone z `reason=transcript-missing`
  zamiast cicho uruchamiać świeżą sesję Claude CLI pod `--resume`.
- Sesje Claude na żywo utrzymują ograniczone strażniki wyjścia JSONL. Domyślnie pozwalają na maksymalnie
  8 MiB i 20 000 surowych linii JSONL na turę. Tury Claude intensywnie używające narzędzi mogą zwiększyć
  je dla backendu za pomocą
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  i `maxTurnLines`; OpenClaw ogranicza te ustawienia do 64 MiB i 100 000
  linii.
- Zapisane sesje CLI są ciągłością należącą do dostawcy. Niejawny codzienny reset sesji
  ich nie odcina; `/reset` i jawne polityki `session.reset` nadal
  to robią.

Uwagi o serializacji:

- `serialize: true` utrzymuje uporządkowanie uruchomień w tej samej ścieżce.
- Większość CLI serializuje na jednej ścieżce dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmienia się wybrana tożsamość uwierzytelniania,
  w tym zmieniony identyfikator profilu uwierzytelniania, statyczny API key, statyczny token lub tożsamość
  konta OAuth, jeśli CLI ją ujawnia. Rotacja tokenów dostępu i odświeżania OAuth
  nie odcina zapisanej sesji CLI. Jeśli CLI nie ujawnia
  stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować uprawnienia wznowienia.

## Prelude awaryjne z sesji claude-cli

Gdy próba `claude-cli` przełącza się awaryjnie na kandydata innego niż CLI w
[`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw zasila
następną próbę prelude kontekstowym zebranym z lokalnej transkrypcji JSONL
Claude Code w `~/.claude/projects/`. Bez tego ziarna dostawca awaryjny
wystartowałby na zimno, ponieważ własna transkrypcja sesji OpenClaw jest pusta
dla uruchomień `claude-cli`.

- Prelude preferuje najnowsze podsumowanie `/compact` albo znacznik `compact_boundary`,
  a następnie dołącza najnowsze tury po granicy do budżetu znaków.
  Tury sprzed granicy są pomijane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są scalane do kompaktowych wskazówek `(tool call: name)` i
  `(tool result: …)`, aby uczciwie trzymać budżet promptu. Podsumowanie jest
  oznaczane `(truncated)`, jeśli go przekroczy.
- Przejścia awaryjne z `claude-cli` do `claude-cli` u tego samego dostawcy polegają na własnym
  `--resume` Claude i pomijają prelude.
- Ziarno ponownie używa istniejącej walidacji ścieżki pliku sesji Claude, więc
  nie można odczytywać dowolnych ścieżek.

## Obrazy (przekazywanie)

Jeśli Twoje CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli `imageArg` jest ustawione, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` nie występuje, OpenClaw dołącza
ścieżki plików do promptu (wstrzyknięcie ścieżki), co wystarcza dla CLI, które automatycznie
ładują lokalne pliki ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst oraz identyfikator sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response` i
  użycie ze `stats`, gdy `usage` brakuje lub jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz
  identyfikatory sesji, gdy są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używany jest stdin.

## Domyślne ustawienia (należące do Plugin)

Dołączony Plugin OpenAI rejestruje również wartość domyślną dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączony Plugin Google rejestruje również wartość domyślną dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Warunek wstępny: lokalny Gemini CLI musi być zainstalowany i dostępny jako
`gemini` w `PATH` (`brew install gemini-cli` albo
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie spada awaryjnie do `stats`, gdy `usage` nie istnieje lub jest puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko w razie potrzeby (często: bezwzględna ścieżka `command`).

## Domyślne ustawienia należące do Plugin

Domyślne ustawienia backendów CLI są teraz częścią powierzchni Plugin:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- Backend `id` staje się prefiksem dostawcy w odwołaniach do modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje domyślne ustawienie pluginu.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje własnością pluginu przez opcjonalny
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
przepisuje strumieniowane delty asystenta i sparsowany tekst końcowy, zanim OpenClaw obsłuży
własne znaczniki kontrolne i dostarczenie do kanału.

Dla CLI emitujących JSONL zgodne z Claude Code stream-json ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki MCP w pakiecie

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć wygenerowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`.

Obecne zachowanie pakietowe:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: wbudowane nadpisania konfiguracji dla `mcp_servers`; wygenerowany
  serwer OpenClaw loopback jest oznaczony trybem zatwierdzania narzędzi per serwer Codex,
  więc wywołania MCP nie mogą utknąć na lokalnych promptach zatwierdzenia
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy pakietowy MCP jest włączony, OpenClaw:

- uruchamia serwer HTTP MCP loopback, który udostępnia narzędzia gateway procesowi CLI
- uwierzytelnia most za pomocą tokenu na sesję (`OPENCLAW_MCP_TOKEN`)
- zawęża dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego obszaru roboczego
- scala je z istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomieniową z użyciem trybu integracji należącego do backendu z właścicielskiego rozszerzenia

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza pakietowy MCP, aby uruchomienia w tle pozostawały izolowane.

Środowiska uruchomieniowe pakietowego MCP o zakresie sesji są buforowane do ponownego użycia w ramach sesji, a następnie
usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10
minut; ustaw `0`, aby wyłączyć). Jednorazowe osadzone uruchomienia, takie jak próby uwierzytelniania,
generowanie slugów i żądania przypominania Active Memory, czyszczą zasoby na końcu uruchomienia, aby dzieci
stdio oraz strumienie Streamable HTTP/SSE nie żyły dłużej niż uruchomienie.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie jest specyficzne dla backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  aż do zakończenia.
- **Ustrukturyzowane dane wyjściowe** zależą od formatu JSON CLI.
- **Sesje Codex CLI** wznawiają działanie przez wyjście tekstowe (bez JSONL), które jest mniej
  ustrukturyzowane niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby zmapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie ma wartości
  `none` (Codex CLI obecnie nie może wznowić działania z wyjściem JSON).
- **Obrazy ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki plików).

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
