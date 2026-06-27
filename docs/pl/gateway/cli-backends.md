---
read_when:
    - Chcesz niezawodnej opcji awaryjnej, gdy dostawcy API zawodzą
    - Uruchamiasz lokalne CLI AI i chcesz używać ich ponownie
    - Chcesz zrozumieć most loopback MCP służący do dostępu do narzędzi backendu CLI
summary: 'Backendy CLI: lokalny awaryjny CLI AI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-06-27T17:31:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchamiać **lokalne CLI AI** jako **tekstowy mechanizm awaryjny**, gdy dostawcy API są niedostępni,
objęci limitami szybkości albo tymczasowo działają nieprawidłowo. To celowo zachowawcze rozwiązanie:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia Gateway przez most MCP oparty na local loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

Zostało to zaprojektowane jako **siatka bezpieczeństwa**, a nie główna ścieżka. Używaj tego, gdy
chcesz mieć tekstowe odpowiedzi typu „zawsze działa” bez polegania na zewnętrznych API.

Jeśli potrzebujesz pełnego środowiska uruchomieniowego harness z kontrolą sesji ACP, zadaniami w tle,
wiązaniem wątku/konwersacji i trwałymi zewnętrznymi sesjami kodowania, użyj zamiast tego
[Agentów ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

<Tip>
  Tworzysz nowy plugin backendu? Użyj
  [Pluginów backendów CLI](/pl/plugins/cli-backend-plugins). Ta strona jest przeznaczona dla użytkowników
  konfigurujących i obsługujących już zarejestrowany backend.
</Tip>

## Szybki start dla początkujących

Możesz używać Claude Code CLI **bez żadnej konfiguracji** (dołączony plugin Anthropic
rejestruje domyślny backend):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` to domyślny identyfikator agenta, gdy nie skonfigurowano jawnej listy agentów. Jeśli
używasz wielu agentów, zastąp go identyfikatorem agenta, którego chcesz uruchomić.

Jeśli Twój Gateway działa pod launchd/systemd, a PATH jest minimalny, dodaj tylko
ścieżkę polecenia:

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

To wszystko. Nie potrzeba kluczy ani dodatkowej konfiguracji uwierzytelniania poza samym CLI.

Jeśli używasz dołączonego backendu CLI jako **głównego dostawcy wiadomości** na
hoście Gateway, OpenClaw automatycznie ładuje teraz należący do niego dołączony plugin, gdy konfiguracja
jawnie odwołuje się do tego backendu w referencji modelu albo pod
`agents.defaults.cliBackends`.

## Używanie jako mechanizmu awaryjnego

Dodaj backend CLI do listy mechanizmów awaryjnych, aby uruchamiał się tylko wtedy, gdy modele podstawowe zawiodą:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Uwagi:

- Jeśli używasz `agents.defaults.models` (listy dozwolonych), musisz uwzględnić tam także modele backendu CLI.
- Jeśli główny dostawca zawiedzie (uwierzytelnianie, limity szybkości, przekroczenia czasu), OpenClaw
  spróbuje następnie backendu CLI.

## Omówienie konfiguracji

Wszystkie backendy CLI znajdują się pod:

```
agents.defaults.cliBackends
```

Każdy wpis jest indeksowany przez **identyfikator dostawcy** (np. `claude-cli`, `my-cli`).
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
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Jak to działa

1. **Wybiera backend** na podstawie prefiksu dostawcy (`claude-cli/...`).
2. **Buduje prompt systemowy** z użyciem tego samego promptu OpenClaw i kontekstu przestrzeni roboczej.
3. **Wykonuje CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces Claude stdio przy życiu dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stdin stream-json.
4. **Analizuje dane wyjściowe** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala identyfikatory sesji** dla każdego backendu, dzięki czemu kolejne tury ponownie używają tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend Anthropic `claude-cli` preferuje natywny mechanizm rozpoznawania Skills
Claude Code dla Skills OpenClaw. Gdy bieżąca migawka Skills obejmuje co najmniej
jedną wybraną umiejętność ze zmaterializowaną ścieżką, OpenClaw przekazuje tymczasowy plugin Claude
Code z `--plugin-dir` i pomija zduplikowany katalog Skills OpenClaw
w dołączonym prompcie systemowym. Jeśli migawka nie ma zmaterializowanej umiejętności pluginu,
OpenClaw zachowuje katalog promptu jako mechanizm awaryjny. Nadpisania env/klucza API umiejętności
są nadal stosowane przez OpenClaw do środowiska procesu podrzędnego dla danego
uruchomienia.

Claude CLI ma też własny nieinteraktywny tryb uprawnień. OpenClaw mapuje go
na istniejącą politykę exec zamiast dodawać konfigurację polityki specyficzną dla Claude.
Dla zarządzanych przez OpenClaw sesji Claude live efektywna polityka exec OpenClaw jest
autorytatywna: YOLO (`tools.exec.security: "full"` i
`tools.exec.ask: "off"`) uruchamia Claude z
`--permission-mode bypassPermissions`, natomiast restrykcyjna efektywna polityka exec
uruchamia Claude z `--permission-mode default`. Ustawienia per-agent
`agents.list[].tools.exec` nadpisują globalne `tools.exec` dla tego
agenta. Surowe argumenty backendu Claude nadal mogą zawierać `--permission-mode`, ale uruchomienia live
Claude normalizują tę flagę tak, aby odpowiadała efektywnej polityce exec OpenClaw.

Dołączony backend Anthropic `claude-cli` mapuje również poziomy OpenClaw `/think`
na natywną flagę `--effort` Claude Code dla poziomów innych niż off. `minimal` i
`low` mapują się na `low`, `adaptive` i `medium` mapują się na `medium`, a `high`,
`xhigh` i `max` mapują się bezpośrednio. Inne backendy CLI wymagają, aby ich właścicielski plugin
zadeklarował równoważny mapper argv, zanim `/think` będzie mógł wpływać na uruchamiane CLI.

Zanim OpenClaw będzie mógł używać dołączonego backendu `claude-cli`, sam Claude Code
musi być już zalogowany na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalacje Docker wymagają, aby Claude Code był zainstalowany i zalogowany wewnątrz utrwalonego
katalogu domowego kontenera, nie tylko na hoście. Zobacz
[Backend Claude CLI w Dockerze](/pl/install/docker#claude-cli-backend-in-docker).

Używaj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy binarka `claude`
nie jest już w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) albo
  `sessionArgs` (placeholder `{sessionId}`), gdy identyfikator trzeba wstawić
  do wielu flag.
- Jeśli CLI używa **podpolecenia resume** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` podczas wznawiania) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy został wcześniej zapisany.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`
  i `input: "stdin"`, więc kolejne tury ponownie używają działającego procesu Claude,
  dopóki jest aktywny. Ciepłe stdio jest teraz domyślne, także dla niestandardowych konfiguracji,
  które pomijają pola transportu. Jeśli Gateway zostanie zrestartowany albo bezczynny proces
  zakończy działanie, OpenClaw wznawia z zapisanego identyfikatora sesji Claude. Zapisane
  identyfikatory sesji są weryfikowane względem istniejącego, czytelnego transkryptu projektu przed
  wznowieniem, więc pozorne powiązania są czyszczone z `reason=transcript-missing`
  zamiast po cichu uruchamiać świeżą sesję Claude CLI pod `--resume`.
- Sesje Claude live utrzymują ograniczone zabezpieczenia danych wyjściowych JSONL. Domyślne wartości pozwalają na maksymalnie
  8 MiB i 20 000 surowych wierszy JSONL na turę. Tury Claude intensywnie używające narzędzi mogą zwiększyć
  je per backend za pomocą
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  oraz `maxTurnLines`; OpenClaw ogranicza te ustawienia do 64 MiB i 100 000
  wierszy.
- Zapisane sesje CLI są ciągłością należącą do dostawcy. Domyślny dzienny reset sesji
  ich nie odcina; `/reset` i jawne polityki `session.reset` nadal
  to robią.
- Świeże sesje CLI zwykle odtwarzają kontekst tylko z podsumowania Compaction OpenClaw
  oraz ogona po Compaction. Aby odzyskać krótkie sesje unieważnione
  przed Compaction, backend może włączyć tę opcję za pomocą
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw nadal utrzymuje odtwarzanie z surowego
  transkryptu w ograniczonym zakresie i ogranicza je do bezpiecznych unieważnień, takich jak brakujące
  transkrypty CLI, zmiany promptu systemowego/MCP albo ponowienie po wygaśnięciu sesji; zmiany
  profilu uwierzytelniania lub epoki poświadczeń nigdy nie odtwarzają surowej historii transkryptu.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje kolejność uruchomień w tej samej ścieżce.
- Większość CLI serializuje na jednej ścieżce dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmienia się wybrana tożsamość uwierzytelniania,
  w tym zmieniony identyfikator profilu uwierzytelniania, statyczny klucz API, statyczny token albo tożsamość
  konta OAuth, gdy CLI ją ujawnia. Rotacja tokenów dostępu i odświeżania OAuth
  nie odcina zapisanej sesji CLI. Jeśli CLI nie ujawnia
  stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować uprawnienia wznowienia.

## Wstęp mechanizmu awaryjnego z sesji claude-cli

Gdy próba `claude-cli` przełącza się awaryjnie na kandydata innego niż CLI w
[`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw zasila
następną próbę wstępem kontekstowym zebranym z lokalnego transkryptu JSONL
Claude Code w `~/.claude/projects/`. Bez tego zasilenia dostawca awaryjny
startowałby na zimno, ponieważ własny transkrypt sesji OpenClaw jest pusty
dla uruchomień `claude-cli`.

- Wstęp preferuje najnowsze podsumowanie `/compact` lub znacznik `compact_boundary`,
  a następnie dołącza najnowsze tury po granicy do limitu znaków.
  Tury sprzed granicy są odrzucane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są scalane do kompaktowych wskazówek `(tool call: name)` i
  `(tool result: …)`, aby uczciwie pilnować budżetu promptu. Podsumowanie jest
  oznaczane jako `(truncated)`, jeśli przekroczy limit.
- Przełączenia awaryjne tego samego dostawcy z `claude-cli` do `claude-cli` polegają na własnym
  `--resume` Claude i pomijają wstęp.
- Zasilenie ponownie używa istniejącej walidacji ścieżki pliku sesji Claude, więc
  nie można odczytywać dowolnych ścieżek.

## Obrazy (przekazywanie dalej)

Jeśli Twoje CLI akceptuje ścieżki obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli `imageArg` jest ustawione, te
ścieżki są przekazywane jako argumenty CLI. Jeśli brakuje `imageArg`, OpenClaw dołącza
ścieżki plików do promptu (wstrzyknięcie ścieżek), co wystarcza dla CLI, które automatycznie
ładują lokalne pliki ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje przeanalizować JSON i wyodrębnić tekst oraz identyfikator sesji.
- Dla danych wyjściowych JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response`, a użycie
  ze `stats`, gdy `usage` brakuje albo jest puste. Domyślna konfiguracja dołączonego Gemini CLI
  używa `stream-json`, ale stare nadpisania `--output-format json` nadal używają
  parsera JSON.
- `output: "jsonl"` analizuje strumienie JSONL i wyodrębnia końcową wiadomość agenta oraz
  identyfikatory sesji, jeśli są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używany jest stdin.

## Wartości domyślne (należące do Plugin)

Domyślne ustawienia dołączonych backendów CLI znajdują się przy należącym do nich Plugin. Na przykład
Anthropic posiada `claude-cli`, a Google posiada `google-gemini-cli`. Uruchomienia agentów OpenAI Codex
używają harnessu app-server Codex przez `openai/*`; OpenClaw nie
rejestruje już dołączonego backendu `codex-cli`.

Dołączony Plugin Anthropic rejestruje wartość domyślną dla `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Dołączony Plugin Google również rejestruje wartość domyślną dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Wymaganie wstępne: lokalny Gemini CLI musi być zainstalowany i dostępny jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi dotyczące wyjścia Gemini CLI:

- Domyślny parser `stream-json` odczytuje zdarzenia `message` asystenta, zdarzenia narzędzi,
  końcowe użycie `result` oraz krytyczne zdarzenia błędów Gemini.
- Jeśli nadpiszesz argumenty Gemini na `--output-format json`, OpenClaw normalizuje ten
  backend z powrotem do `output: "json"` i odczytuje tekst odpowiedzi z pola JSON `response`.
- Użycie przełącza się awaryjnie na `stats`, gdy `usage` nie istnieje lub jest puste.
- `stats.cached` jest normalizowane do `cacheRead` OpenClaw.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko wtedy, gdy to potrzebne (często: bezwzględna ścieżka `command`).

## Wartości domyślne należące do Plugin

Domyślne ustawienia backendów CLI są teraz częścią powierzchni Plugin:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w referencjach modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje wartość domyślną Plugin.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje własnością Plugin przez opcjonalny
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
własne znaczniki sterujące i dostarczenie do kanału.

Dla CLI, które emitują zdarzenia JSONL specyficzne dla dostawcy, ustaw `jsonlDialect` w konfiguracji
tego backendu. Obsługiwane dialekty to `claude-stream-json` dla strumieni zgodnych z Claude
Code oraz `gemini-stream-json` dla zdarzeń Gemini CLI `stream-json`.

## Własność natywnego Compaction

Niektóre backendy CLI uruchamiają agenta, który kompaktuje **własny** transkrypt, więc OpenClaw musi
nie uruchamiać wobec nich swojego summarizera zabezpieczającego - takie działanie koliduje z własnym
Compaction backendu i może twardo przerwać turę.

`claude-cli` nie ma endpointu harnessu - Claude Code kompaktuje wewnętrznie - więc deklaruje
`ownsNativeCompaction: true`, a OpenClaw zwraca no-op ze ścieżki Compaction.
Sesje natywnego harnessu, takie jak Codex, nadal kierują się zamiast tego do endpointu Compaction swojego harnessu.

Ponieważ backend posiada Compaction, stary tymczasowy sposób ustawiania
`contextTokens: 1_000_000` wyłącznie po to, aby zabezpieczenie OpenClaw nie uruchamiało się w sesji
claude-cli, **nie jest już potrzebny** - zastępuje go opt-out.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Deklaruj `ownsNativeCompaction` tylko dla backendu, który faktycznie posiada własne Compaction: musi
niezawodnie ograniczać własny transkrypt, gdy zbliża się do okna kontekstu, oraz utrwalać
wznawialną sesję (np. `--resume` / `--session-id`); w przeciwnym razie odroczona sesja może
pozostać ponad budżetem. Sesje z pasującym `agentHarnessId` nadal kierują się do endpointu harnessu.

## Nakładki pakietu MCP

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć wygenerowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`.

Bieżące zachowanie dołączonych elementów:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy pakiet MCP jest włączony, OpenClaw:

- uruchamia serwer HTTP MCP local loopback, który udostępnia narzędzia Gateway procesowi CLI
- uwierzytelnia most tokenem per sesja (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego obszaru roboczego
- scala je z dowolnym istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchamiania z użyciem trybu integracji należącego do backendu z należącego rozszerzenia

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza pakiet MCP, aby uruchomienia w tle pozostawały odizolowane.

Zakresowane do sesji dołączone runtime'y MCP są buforowane do ponownego użycia w ramach sesji, a następnie
sprzątane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10
minut; ustaw `0`, aby wyłączyć). Jednorazowe osadzone uruchomienia, takie jak sondy uwierzytelniania,
generowanie slugów i odwołania Active Memory, żądają czyszczenia na końcu uruchomienia, aby dzieci stdio
oraz strumienie Streamable HTTP/SSE nie żyły dłużej niż uruchomienie.

## Limit historii ponownego seedowania

Gdy świeża sesja CLI jest seedowana z wcześniejszego transkryptu OpenClaw (na
przykład po ponowieniu `session_expired`), wyrenderowany blok
`<conversation_history>` jest limitowany, aby prompty ponownego seedowania nie
rozrastały się nadmiernie. Domyślna wartość to `12288` znaków (około 3000 tokenów).

Backendy Claude CLI automatycznie używają większego limitu wyprowadzonego z rozwiązanego
poziomu kontekstu Claude. Standardowe uruchomienia Claude z 200 tys. tokenów zachowują większy wycinek
transkryptu, a uruchomienia Claude z 1 mln tokenów zachowują jeszcze większy wycinek, podczas gdy inne backendy CLI
zachowują konserwatywną wartość domyślną.

- Limit dotyczy tylko bloku wcześniejszej historii w prompcie ponownego seedowania. Limity wyjścia
  sesji na żywo są dostrajane osobno w `reliability.outputLimits`
  (zobacz [Sesje](#sessions)).

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia Gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie jest specyficzne dla backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  aż do zakończenia.
- **Wyjścia strukturalne** zależą od formatu JSON danego CLI.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby mapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie jest
  `none`.
- **Obrazy ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki plików).

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
