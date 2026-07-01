---
read_when:
    - Potrzebujesz niezawodnej opcji awaryjnej, gdy dostawcy API zawodzą
    - Uruchamiasz lokalne CLI AI i chcesz używać ich ponownie
    - Chcesz zrozumieć most pętli zwrotnej MCP do dostępu do narzędzi backendu CLI
summary: 'CLI backends: lokalny zapasowy mechanizm CLI AI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-07-01T08:35:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchamiać **lokalne CLI AI** jako **tekstowy mechanizm awaryjny**, gdy dostawcy API są niedostępni,
limitowani lub tymczasowo działają nieprawidłowo. Jest to celowo konserwatywne:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia gateway przez mostek MCP loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki obrazów.

Zaprojektowano to jako **siatkę bezpieczeństwa**, a nie główną ścieżkę. Użyj tego, gdy
chcesz uzyskiwać „zawsze działające” odpowiedzi tekstowe bez polegania na zewnętrznych API.

Jeśli chcesz pełnego środowiska uruchomieniowego harness z kontrolą sesji ACP, zadaniami w tle,
powiązaniem wątku/konwersacji i trwałymi zewnętrznymi sesjami kodowania, użyj zamiast tego
[Agentów ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

<Tip>
  Tworzysz nowy backend plugin? Użyj
  [pluginów backendu CLI](/pl/plugins/cli-backend-plugins). Ta strona jest dla użytkowników
  konfigurujących i obsługujących już zarejestrowany backend.
</Tip>

## Przyjazny dla początkujących szybki start

Możesz używać Claude Code CLI **bez żadnej konfiguracji** (dołączony plugin Anthropic
rejestruje domyślny backend):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` to domyślny identyfikator agenta, gdy nie skonfigurowano jawnej listy agentów. Jeśli
używasz wielu agentów, zastąp go identyfikatorem agenta, którego chcesz uruchomić.

Jeśli Twój gateway działa pod launchd/systemd i PATH jest minimalny, dodaj tylko
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

To wszystko. Żadnych kluczy, żadnej dodatkowej konfiguracji uwierzytelniania poza samym CLI.

Jeśli używasz dołączonego backendu CLI jako **głównego dostawcy wiadomości** na hoście
gateway, OpenClaw automatycznie ładuje teraz właścicielski dołączony plugin, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w referencji modelu lub pod
`agents.defaults.cliBackends`.

## Używanie jako mechanizmu awaryjnego

Dodaj backend CLI do listy awaryjnej, aby uruchamiał się tylko wtedy, gdy modele główne zawiodą:

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

- Jeśli używasz `agents.defaults.models` (listy dozwolonych), musisz uwzględnić tam również modele backendu CLI.
- Jeśli główny dostawca zawiedzie (uwierzytelnianie, limity, przekroczenia czasu), OpenClaw
  spróbuje następnie backendu CLI.

## Przegląd konfiguracji

Wszystkie backendy CLI znajdują się pod:

```
agents.defaults.cliBackends
```

Każdy wpis jest kluczowany **identyfikatorem dostawcy** (np. `claude-cli`, `my-cli`).
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
2. **Buduje prompt systemowy** przy użyciu tego samego promptu OpenClaw i kontekstu przestrzeni roboczej.
3. **Wykonuje CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostawała spójna.
   Dołączony backend `claude-cli` utrzymuje proces Claude stdio przy życiu dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stdin stream-json.
4. **Parsuje dane wyjściowe** (JSON lub zwykły tekst) i zwraca tekst końcowy.
5. **Utrwala identyfikatory sesji** dla każdego backendu, aby kolejne tury ponownie używały tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend Anthropic `claude-cli` preferuje natywny resolver Skills Claude Code
dla Skills OpenClaw. Gdy bieżąca migawka Skills zawiera co najmniej
jedną wybraną umiejętność z materializowaną ścieżką, OpenClaw przekazuje tymczasowy plugin Claude
Code z `--plugin-dir` i pomija zduplikowany katalog Skills OpenClaw
z dołączonego promptu systemowego. Jeśli migawka nie ma materializowanej umiejętności plugin,
OpenClaw zachowuje katalog promptu jako mechanizm awaryjny. Nadpisania env/kluczy API umiejętności
są nadal stosowane przez OpenClaw do środowiska procesu potomnego dla
uruchomienia.

Claude CLI ma również własny nieinteraktywny tryb uprawnień. OpenClaw mapuje go
na istniejącą politykę exec zamiast dodawać konfigurację polityki specyficzną dla Claude.
Dla zarządzanych przez OpenClaw sesji live Claude efektywna polityka exec OpenClaw jest
autorytatywna: YOLO (`tools.exec.security: "full"` i
`tools.exec.ask: "off"`) uruchamia Claude z
`--permission-mode bypassPermissions`, a restrykcyjna efektywna polityka exec
uruchamia Claude z `--permission-mode default`. Ustawienia poszczególnych agentów
`agents.list[].tools.exec` nadpisują globalne `tools.exec` dla tego
agenta. Surowe argumenty backendu Claude mogą nadal zawierać `--permission-mode`, ale uruchomienia live
Claude normalizują tę flagę, aby odpowiadała efektywnej polityce exec OpenClaw.

Dołączony backend Anthropic `claude-cli` mapuje również poziomy OpenClaw `/think`
na natywną flagę `--effort` Claude Code dla poziomów innych niż off. `minimal` i
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

Instalacje Docker wymagają, aby Claude Code był zainstalowany i zalogowany w utrwalonym
katalogu domowym kontenera, a nie tylko na hoście. Zobacz
[Backend Claude CLI w Dockerze](/pl/install/docker#claude-cli-backend-in-docker).

Używaj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy plik binarny `claude`
nie jest już w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (placeholder `{sessionId}`), gdy identyfikator musi zostać wstawiony
  do wielu flag.
- Jeśli CLI używa **podpolecenia resume** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy wcześniej jakiś zapisano.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`
  i `input: "stdin"`, więc kolejne tury ponownie używają aktywnego procesu live Claude,
  gdy jest aktywny. Ciepłe stdio jest teraz domyślne, również dla niestandardowych konfiguracji,
  które pomijają pola transportu. Jeśli Gateway uruchomi się ponownie lub bezczynny proces
  zakończy działanie, OpenClaw wznowi pracę z zapisanego identyfikatora sesji Claude. Zapisane identyfikatory
  sesji są weryfikowane względem istniejącego czytelnego transkryptu projektu przed
  wznowieniem, więc fantomowe powiązania są czyszczone z `reason=transcript-missing`
  zamiast po cichu rozpoczynać świeżą sesję Claude CLI pod `--resume`.
- Sesje live Claude zachowują ograniczone zabezpieczenia danych wyjściowych JSONL. Domyślne limity pozwalają na maksymalnie
  8 MiB i 20 000 surowych linii JSONL na turę. Tury Claude intensywnie używające narzędzi mogą podnieść
  je dla backendu za pomocą
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  i `maxTurnLines`; OpenClaw ogranicza te ustawienia do 64 MiB i 100 000
  linii.
- Zapisane sesje CLI są ciągłością należącą do dostawcy. Niejawny dzienny reset sesji
  ich nie odcina; `/reset` i jawne polityki `session.reset` nadal
  to robią.
- Świeże sesje CLI zwykle dosiewają tylko z podsumowania Compaction OpenClaw
  oraz ogona po Compaction. Aby odzyskać krótkie sesje unieważnione
  przed Compaction, backend może włączyć opcję
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw nadal utrzymuje dosiew z surowego
  transkryptu w ograniczonym zakresie i ogranicza go do bezpiecznych unieważnień, takich jak brakujące
  transkrypty CLI, zmiany promptu systemowego/MCP lub ponowna próba po wygaśnięciu sesji; zmiany
  profilu uwierzytelniania lub epoki poświadczeń nigdy nie dosiewają historii surowego transkryptu.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje uporządkowanie uruchomień w tej samej ścieżce.
- Większość CLI serializuje w jednej ścieżce dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmieni się wybrana tożsamość uwierzytelniania,
  w tym zmieniony identyfikator profilu uwierzytelniania, statyczny klucz API, statyczny token lub tożsamość
  konta OAuth, gdy CLI ją ujawnia. Rotacja tokenów dostępu i odświeżania OAuth
  nie odcina zapisanej sesji CLI. Jeśli CLI nie ujawnia
  stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować uprawnienia wznowienia.

## Wstęp awaryjny z sesji claude-cli

Gdy próba `claude-cli` przełącza się awaryjnie na kandydata spoza CLI w
[`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw zasila
następną próbę wstępem kontekstu zebranym z lokalnego
transkryptu JSONL Claude Code w `~/.claude/projects/`. Bez tego zasilenia dostawca awaryjny
startowałby na zimno, ponieważ własny transkrypt sesji OpenClaw jest pusty
dla uruchomień `claude-cli`.

- Wstęp preferuje najnowsze podsumowanie `/compact` lub marker `compact_boundary`,
  a następnie dołącza najnowsze tury po granicy do limitu znaków.
  Tury sprzed granicy są pomijane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są scalane do kompaktowych wskazówek `(tool call: name)` i
  `(tool result: …)`, aby uczciwie traktować budżet promptu. Podsumowanie jest
  oznaczone `(truncated)`, jeśli przekroczy limit.
- Przełączenia awaryjne `claude-cli` na `claude-cli` u tego samego dostawcy polegają na własnym
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
ścieżki plików do promptu (wstrzykiwanie ścieżek), co wystarcza dla CLI, które automatycznie
ładują lokalne pliki ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślne) próbuje sparsować JSON i wyodrębnić tekst oraz identyfikator sesji.
- Dla danych wyjściowych JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response` i użycie
  ze `stats`, gdy `usage` brakuje lub jest puste. Domyślny dołączony Gemini CLI
  używa `stream-json`, ale stare nadpisania `--output-format json` nadal używają
  parsera JSON.
- `output: "jsonl"` parsuje strumienie JSONL i wyodrębnia końcową wiadomość agenta oraz identyfikatory
  sesji, gdy są obecne.
- `output: "text"` traktuje stdout jako odpowiedź końcową.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używany jest stdin.

## Wartości domyślne (własność pluginu)

Domyślne ustawienia backendu dołączonego CLI znajdują się przy należącym do nich pluginie. Na przykład
Anthropic jest właścicielem `claude-cli`, a Google jest właścicielem `google-gemini-cli`. Uruchomienia agentów OpenAI Codex
używają uprzęży serwera aplikacji Codex przez `openai/*`; OpenClaw nie
rejestruje już dołączonego backendu `codex-cli`.

Dołączony plugin Anthropic rejestruje wartość domyślną dla `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Dołączony plugin Google rejestruje też wartość domyślną dla `google-gemini-cli`:

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

Wymaganie wstępne: lokalne Gemini CLI musi być zainstalowane i dostępne jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi dotyczące danych wyjściowych Gemini CLI:

- Domyślny parser `stream-json` odczytuje zdarzenia `message` asystenta, zdarzenia narzędzi,
  końcowe użycie `result` oraz krytyczne zdarzenia błędów Gemini.
- Jeśli zastąpisz argumenty Gemini na `--output-format json`, OpenClaw normalizuje ten
  backend z powrotem do `output: "json"` i odczytuje tekst odpowiedzi z pola JSON `response`.
- Użycie wraca do `stats`, gdy `usage` jest nieobecne lub puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Zastępuj tylko w razie potrzeby (typowe: bezwzględna ścieżka `command`).

## Wartości domyślne będące własnością pluginu

Domyślne ustawienia backendu CLI są teraz częścią powierzchni pluginu:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w referencjach modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal zastępuje domyślne ustawienie pluginu.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje własnością pluginu przez opcjonalny
  hook `normalizeConfig`.

Pluginy, które potrzebują drobnych shimów zgodności promptu/wiadomości, mogą deklarować
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
przepisuje strumieniowany tekst asystenta i sparsowany tekst końcowy, zanim OpenClaw obsłuży
własne znaczniki kontrolne i dostarczenie kanałem. Dla wywołań modeli wspieranych przez dostawcę
`output` przywraca także wartości tekstowe wewnątrz ustrukturyzowanych argumentów wywołań narzędzi po
naprawie strumienia i przed wykonaniem narzędzia. Surowe fragmenty JSON dostawcy pozostają
bez zmian; konsumenci powinni używać ustrukturyzowanego ładunku częściowego, końcowego lub wynikowego.

Dla CLI emitujących zdarzenia JSONL specyficzne dla dostawcy ustaw `jsonlDialect` w konfiguracji tego
backendu. Obsługiwane dialekty to `claude-stream-json` dla strumieni zgodnych z Claude
Code oraz `gemini-stream-json` dla zdarzeń Gemini CLI `stream-json`.

## Własność natywnej Compaction

Niektóre backendy CLI uruchamiają agenta, który kompaktuje **własny** transkrypt, więc OpenClaw nie może
uruchamiać wobec nich swojego zabezpieczającego sumaryzatora - powoduje to konflikt z własną
Compaction backendu i może twardo przerwać turę.

`claude-cli` nie ma punktu końcowego uprzęży - Claude Code kompaktuje wewnętrznie - więc deklaruje
`ownsNativeCompaction: true`, a OpenClaw zwraca no-op ze ścieżki Compaction.
Sesje natywnej uprzęży, takie jak Codex, nadal są kierowane do punktu końcowego Compaction ich uprzęży.

Ponieważ backend jest właścicielem Compaction, stare obejście polegające na ustawieniu
`contextTokens: 1_000_000` wyłącznie po to, aby zabezpieczenie OpenClaw nie uruchamiało się w sesji
claude-cli, **nie jest już potrzebne** - zastępuje je rezygnacja.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Deklaruj `ownsNativeCompaction` tylko dla backendu, który rzeczywiście jest właścicielem swojej Compaction: musi on
niezawodnie ograniczać własny transkrypt, gdy zbliża się do okna kontekstu, oraz utrwalać
wznawialną sesję (np. `--resume` / `--session-id`); w przeciwnym razie odroczona sesja może
pozostać ponad budżetem. Pasujące sesje `agentHarnessId` nadal kierują się do punktu końcowego uprzęży.

## Nakładki pakietu MCP

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć generowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`.

Obecne zachowanie dołączonych backendów:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy pakiet MCP jest włączony, OpenClaw:

- uruchamia serwer MCP HTTP w local loopback, który udostępnia narzędzia Gateway procesowi CLI
- uwierzytelnia most tokenem dla sesji (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego obszaru roboczego
- scala je z dowolnym istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomieniową przy użyciu trybu integracji należącego do backendu z rozszerzenia właścicielskiego

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza pakiet MCP, aby uruchomienia w tle pozostawały odizolowane.

Zakresowane do sesji dołączone runtime'y MCP są buforowane do ponownego użycia w ramach sesji, a następnie
usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10
minut; ustaw `0`, aby wyłączyć). Jednorazowe uruchomienia osadzone, takie jak sondy uwierzytelniania,
generowanie slugów i żądania przywołania active-memory, sprzątają po zakończeniu uruchomienia, aby dzieci stdio
oraz strumienie Streamable HTTP/SSE nie żyły dłużej niż uruchomienie.

## Limit historii reseed

Gdy świeża sesja CLI jest zasiewana z wcześniejszego transkryptu OpenClaw (na
przykład po ponowieniu `session_expired`), wyrenderowany blok
`<conversation_history>` jest ograniczony, aby prompty reseed nie
rosły nadmiernie. Wartość domyślna to `12288` znaków (około 3000 tokenów).

Backendy Claude CLI automatycznie używają większego limitu wyprowadzonego z rozwiązanego
poziomu kontekstu Claude. Standardowe uruchomienia Claude z 200 tys. tokenów zachowują większy wycinek
transkryptu, a uruchomienia Claude z 1 mln tokenów zachowują jeszcze większy wycinek, podczas gdy inne backendy CLI
zachowują konserwatywną wartość domyślną.

- Limit kontroluje tylko blok wcześniejszej historii promptu reseed. Limity danych wyjściowych
  sesji na żywo są dostrajane osobno w `reliability.outputLimits`
  (zobacz [Sesje](#sessions)).

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia Gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie jest specyficzne dla backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  do zakończenia.
- **Ustrukturyzowane dane wyjściowe** zależą od formatu JSON CLI.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby zmapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie ma wartości
  `none`.
- **Obrazy ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki plików).

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
