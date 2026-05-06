---
read_when:
    - Chcesz mieć niezawodny mechanizm awaryjny, gdy dostawcy API zawodzą
    - Uruchamiasz Codex CLI lub inne lokalne CLI AI i chcesz je ponownie wykorzystać
    - Chcesz zrozumieć mostek pętli zwrotnej MCP do dostępu narzędzi zaplecza CLI
summary: 'Backendy CLI: lokalny awaryjny mechanizm CLI SI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-05-06T09:11:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchamiać **lokalne CLI AI** jako **tekstowy mechanizm awaryjny**, gdy dostawcy API są niedostępni,
ograniczeni limitami szybkości lub tymczasowo działają nieprawidłowo. To celowo konserwatywne podejście:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia gateway przez most MCP loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy można przekazywać dalej**, jeśli CLI akceptuje ścieżki do obrazów.

Zaprojektowano to jako **sieć bezpieczeństwa**, a nie główną ścieżkę. Użyj tego, gdy
chcesz mieć tekstowe odpowiedzi, które „zawsze działają”, bez polegania na zewnętrznych API.

Jeśli chcesz pełne środowisko wykonawcze harness z kontrolą sesji ACP, zadaniami w tle,
powiązaniem wątków/konwersacji oraz trwałymi zewnętrznymi sesjami kodowania, użyj zamiast tego
[agentów ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

## Przyjazny dla początkujących szybki start

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony Plugin OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jeśli Twój gateway działa pod launchd/systemd, a PATH jest minimalny, dodaj tylko
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
hoście gateway, OpenClaw automatycznie ładuje teraz właścicielski dołączony plugin, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w referencji modelu lub w
`agents.defaults.cliBackends`.

## Używanie jako mechanizmu awaryjnego

Dodaj backend CLI do listy mechanizmów awaryjnych, aby uruchamiał się tylko wtedy, gdy modele główne zawiodą:

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

- Jeśli używasz `agents.defaults.models` (listy dozwolonych), musisz uwzględnić tam również modele backendu CLI.
- Jeśli główny dostawca zawiedzie (uwierzytelnianie, limity szybkości, przekroczenia czasu), OpenClaw
  spróbuje następnie backendu CLI.

## Omówienie konfiguracji

Wszystkie backendy CLI znajdują się w:

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
2. **Buduje prompt systemowy** z użyciem tego samego promptu OpenClaw i kontekstu workspace.
3. **Wykonuje CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces Claude stdio przy życiu dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stream-json stdin.
4. **Parsuje wyjście** (JSON lub zwykły tekst) i zwraca tekst końcowy.
5. **Utrwala identyfikatory sesji** dla każdego backendu, dzięki czemu kolejne tury ponownie używają tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend OpenAI `codex-cli` przekazuje prompt systemowy OpenClaw przez
nadpisanie konfiguracji Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude
`--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do
pliku tymczasowego dla każdej świeżej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje migawkę OpenClaw Skills
na dwa sposoby: przez kompaktowy katalog OpenClaw Skills w dołączonym prompcie systemowym oraz
tymczasowy plugin Claude Code przekazany przez `--plugin-dir`. Plugin zawiera
tylko kwalifikujące się Skills dla danego agenta/sesji, więc natywny resolver Skills
Claude Code widzi ten sam przefiltrowany zestaw, który OpenClaw w przeciwnym razie reklamowałby w
prompcie. Nadpisania env/kluczy API Skills są nadal stosowane przez OpenClaw do
środowiska procesu potomnego dla danego uruchomienia.

Claude CLI ma także własny nieinteraktywny tryb uprawnień. OpenClaw mapuje go
na istniejącą politykę exec zamiast dodawać konfigurację specyficzną dla Claude: gdy
efektywna żądana polityka exec to YOLO (`tools.exec.security: "full"` i
`tools.exec.ask: "off"`), OpenClaw dodaje `--permission-mode bypassPermissions`.
Ustawienia `agents.list[].tools.exec` dla poszczególnych agentów zastępują globalne `tools.exec` dla
tego agenta. Aby wymusić inny tryb Claude, ustaw jawne surowe argumenty backendu,
takie jak `--permission-mode default` lub `--permission-mode acceptEdits` w
`agents.defaults.cliBackends.claude-cli.args` oraz pasujących `resumeArgs`.

Dołączony backend Anthropic `claude-cli` mapuje także poziomy OpenClaw `/think`
na natywną flagę Claude Code `--effort` dla poziomów innych niż off. `minimal` i
`low` mapują się na `low`, `adaptive` i `medium` mapują się na `medium`, a `high`,
`xhigh` i `max` mapują się bezpośrednio. Inne backendy CLI wymagają, aby ich właścicielski plugin
zadeklarował równoważny mapper argv, zanim `/think` będzie mogło wpływać na uruchamiane CLI.

Zanim OpenClaw będzie mógł użyć dołączonego backendu `claude-cli`, sam Claude Code
musi być już zalogowany na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Używaj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy plik binarny `claude`
nie znajduje się już w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (placeholder `{sessionId}`), gdy identyfikator trzeba wstawić
  do wielu flag.
- Jeśli CLI używa **podpolecenia wznowienia** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy wcześniej zapisano jakiś identyfikator.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`
  i `input: "stdin"`, więc kolejne tury ponownie używają aktywnego procesu Claude na żywo.
  Ciepłe stdio jest teraz domyślne, także dla niestandardowych konfiguracji,
  które pomijają pola transportu. Jeśli Gateway uruchomi się ponownie albo bezczynny proces
  zakończy działanie, OpenClaw wznawia z zapisanego identyfikatora sesji Claude. Zapisane
  identyfikatory sesji są weryfikowane względem istniejącego czytelnego transkryptu projektu przed
  wznowieniem, więc widmowe powiązania są czyszczone z `reason=transcript-missing`
  zamiast po cichu uruchamiać świeżą sesję Claude CLI pod `--resume`.
- Sesje Claude na żywo utrzymują ograniczone strażniki wyjścia JSONL. Domyślne wartości pozwalają na maksymalnie
  8 MiB i 20 000 surowych linii JSONL na turę. Tury Claude intensywnie używające narzędzi mogą zwiększyć
  je dla backendu przez
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  i `maxTurnLines`; OpenClaw ogranicza te ustawienia do 64 MiB i 100 000
  linii.
- Zapisane sesje CLI to ciągłość należąca do dostawcy. Niejawny dzienny reset sesji
  ich nie przerywa; `/reset` i jawne polityki `session.reset` nadal
  to robią.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje uporządkowanie uruchomień w tej samej lane.
- Większość CLI serializuje w jednej lane dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmieni się wybrana tożsamość uwierzytelniania,
  w tym zmieniony identyfikator profilu uwierzytelniania, statyczny klucz API, statyczny token lub tożsamość
  konta OAuth, gdy CLI ją ujawnia. Rotacja tokenów dostępu i odświeżania OAuth
  nie przerywa zapisanej sesji CLI. Jeśli CLI nie ujawnia
  stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować uprawnienia wznowienia.

## Prelude mechanizmu awaryjnego z sesji claude-cli

Gdy próba `claude-cli` przełącza się awaryjnie na kandydata niebędącego CLI z
[`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw zasila
następną próbę prelude kontekstu pobranym z lokalnego transkryptu JSONL Claude Code
w `~/.claude/projects/`. Bez tego ziarna dostawca awaryjny
startowałby na zimno, ponieważ własny transkrypt sesji OpenClaw jest pusty
dla uruchomień `claude-cli`.

- Prelude preferuje najnowsze podsumowanie `/compact` lub znacznik `compact_boundary`,
  a następnie dołącza najnowsze tury po granicy do limitu
  znaków. Tury sprzed granicy są pomijane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są scalane do kompaktowych wskazówek `(tool call: name)` i
  `(tool result: …)`, aby uczciwie pilnować budżetu promptu. Podsumowanie jest
  oznaczone jako `(truncated)`, jeśli przekroczy limit.
- Przełączenia awaryjne tego samego dostawcy z `claude-cli` na `claude-cli` polegają na własnym
  `--resume` Claude i pomijają prelude.
- Ziarno ponownie używa istniejącej walidacji ścieżki pliku sesji Claude, więc
  nie można odczytywać dowolnych ścieżek.

## Obrazy (przekazywanie dalej)

Jeśli Twoje CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli ustawiono `imageArg`, te
ścieżki są przekazywane jako argumenty CLI. Jeśli brakuje `imageArg`, OpenClaw dołącza
ścieżki plików do promptu (wstrzyknięcie ścieżek), co wystarcza dla CLI, które automatycznie
ładują pliki lokalne ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst oraz identyfikator sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response` oraz
  użycie ze `stats`, gdy `usage` jest brakujące lub puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz identyfikatory
  sesji, jeśli są obecne.
- `output: "text"` traktuje stdout jako odpowiedź końcową.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używany jest stdin.

## Domyślne wartości (należące do pluginu)

Dołączony plugin OpenAI rejestruje także domyślną konfigurację dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączony plugin Google rejestruje także domyślną konfigurację dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Wymaganie wstępne: lokalny Gemini CLI musi być zainstalowany i dostępny jako
`gemini` w `PATH` (`brew install gemini-cli` albo
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie wraca do `stats`, gdy `usage` jest nieobecne lub puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wylicza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisz tylko w razie potrzeby (często: bezwzględna ścieżka `command`).

## Domyślne ustawienia należące do Plugin

Domyślne ustawienia backendu CLI są teraz częścią powierzchni Plugin:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w referencjach modelu.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje domyślne ustawienie Plugin.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje własnością Plugin przez opcjonalny
  hook `normalizeConfig`.

Pluginy, które potrzebują drobnych shimów zgodności promptów/wiadomości, mogą deklarować
dwukierunkowe przekształcenia tekstu bez zastępowania dostawcy ani backendu CLI:

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
przepisuje strumieniowane delty asystenta oraz przeanalizowany tekst końcowy, zanim OpenClaw obsłuży
własne znaczniki kontrolne i dostarczenie do kanału.

Dla CLI emitujących JSONL zgodny z Claude Code stream-json ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki MCP pakietu

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć wygenerowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`.

Bieżące zachowanie w pakiecie:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: wbudowane nadpisania konfiguracji dla `mcp_servers`; wygenerowany
  serwer loopback OpenClaw jest oznaczony trybem zatwierdzania narzędzi per serwer Codex,
  aby wywołania MCP nie mogły utknąć na lokalnych promptach zatwierdzania
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy MCP pakietu jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP typu loopback, który udostępnia narzędzia gateway procesowi CLI
- uwierzytelnia most tokenem per sesja (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego obszaru roboczego
- scala je z istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomienia przy użyciu trybu integracji należącego do backendu z rozszerzenia właściciela

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza MCP pakietu, aby uruchomienia w tle pozostały izolowane.

Sesyjne pakietowe środowiska uruchomieniowe MCP są buforowane do ponownego użycia w ramach sesji, a następnie
usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10
minut; ustaw `0`, aby wyłączyć). Jednorazowe osadzone uruchomienia, takie jak sondy uwierzytelniania,
generowanie slugów i żądania przypominania active-memory, sprzątają po zakończeniu uruchomienia, aby dzieci stdio
oraz strumienie Streamable HTTP/SSE nie żyły dłużej niż uruchomienie.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie jest specyficzne dla backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  do zakończenia.
- **Dane wyjściowe strukturalne** zależą od formatu JSON danego CLI.
- **Sesje Codex CLI** są wznawiane przez wyjście tekstowe (bez JSONL), które jest mniej
  ustrukturyzowane niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby zmapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie jest
  `none` (Codex CLI obecnie nie może wznawiać z wyjściem JSON).
- **Obrazy ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki plików).

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
