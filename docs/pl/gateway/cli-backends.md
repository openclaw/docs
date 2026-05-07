---
read_when:
    - Potrzebujesz niezawodnego rozwiązania zapasowego, gdy dostawcy API zawodzą
    - Korzystasz z Codex CLI lub innych lokalnych narzędzi CLI do AI i chcesz je ponownie wykorzystać
    - Chcesz zrozumieć most pętli zwrotnej MCP służący do dostępu z CLI do narzędzi zaplecza
summary: 'Backendy CLI: lokalny mechanizm awaryjny AI CLI z opcjonalnym mostkiem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-05-07T13:16:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c29a7f9b05d8d561c117d9c61dda61eded95441abb0355e8bd969d8a4a09a3b
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchamiać **lokalne CLI AI** jako **tekstowy mechanizm awaryjny**, gdy dostawcy API są niedostępni,
ograniczani limitami lub tymczasowo działają nieprawidłowo. To celowo konserwatywne podejście:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia Gateway przez most MCP local loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

Zaprojektowano to jako **siatkę bezpieczeństwa**, a nie główną ścieżkę. Użyj tego, gdy
chcesz mieć odpowiedzi tekstowe „zawsze działa” bez polegania na zewnętrznych API.

Jeśli potrzebujesz pełnego środowiska wykonawczego harness z kontrolą sesji ACP, zadaniami w tle,
wiązaniem wątku/konwersacji i trwałymi zewnętrznymi sesjami kodowania, użyj zamiast tego
[Agentów ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

<Tip>
  Tworzysz nowy backendowy Plugin? Użyj
  [Pluginów backendu CLI](/pl/plugins/cli-backend-plugins). Ta strona jest przeznaczona dla użytkowników,
  którzy konfigurują i obsługują już zarejestrowany backend.
</Tip>

## Szybki start przyjazny początkującym

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony Plugin OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jeśli Twój Gateway działa pod launchd/systemd, a PATH jest minimalny, dodaj tylko
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
hoście Gateway, OpenClaw automatycznie ładuje teraz właścicielski dołączony Plugin, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w odwołaniu modelu lub w
`agents.defaults.cliBackends`.

## Używanie jako mechanizmu awaryjnego

Dodaj backend CLI do swojej listy awaryjnej, aby uruchamiał się tylko wtedy, gdy modele główne zawiodą:

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
- Jeśli główny dostawca zawiedzie (uwierzytelnianie, limity szybkości, limity czasu), OpenClaw
  spróbuje następnie backendu CLI.

## Omówienie konfiguracji

Wszystkie backendy CLI znajdują się pod:

```
agents.defaults.cliBackends
```

Każdy wpis jest kluczowany przez **identyfikator dostawcy** (np. `codex-cli`, `my-cli`).
Identyfikator dostawcy staje się lewą stroną odwołania modelu:

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
          // Dla CLI z dedykowaną flagą pliku promptu:
          // systemPromptFileArg: "--system-file",
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
2. **Buduje prompt systemowy** z użyciem tego samego promptu OpenClaw i kontekstu obszaru roboczego.
3. **Uruchamia CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces stdio Claude przy życiu dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stdin stream-json.
4. **Parsuje dane wyjściowe** (JSON lub zwykły tekst) i zwraca tekst końcowy.
5. **Utrwala identyfikatory sesji** dla każdego backendu, aby kolejne tury ponownie używały tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
poinformowali nas, że użycie Claude CLI w stylu OpenClaw jest ponownie dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje
nowe zasady.
</Note>

Dołączony backend OpenAI `codex-cli` przekazuje prompt systemowy OpenClaw przez
nadpisanie konfiguracji Codex `model_instructions_file` (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude
`--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do
pliku tymczasowego dla każdej nowej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje migawkę Skills OpenClaw
na dwa sposoby: kompaktowy katalog Skills OpenClaw w dołączonym prompcie systemowym oraz
tymczasowy Plugin Claude Code przekazany z `--plugin-dir`. Plugin zawiera
tylko kwalifikujące się Skills dla danego agenta/sesji, więc natywny resolver skill
Claude Code widzi ten sam przefiltrowany zestaw, który OpenClaw w przeciwnym razie reklamowałby
w prompcie. Nadpisania zmiennych środowiskowych/kluczy API Skills nadal są stosowane przez OpenClaw do
środowiska procesu potomnego dla danego uruchomienia.

Claude CLI ma również własny nieinteraktywny tryb uprawnień. OpenClaw mapuje go
na istniejącą politykę exec zamiast dodawać konfigurację specyficzną dla Claude: gdy
efektywna żądana polityka exec to YOLO (`tools.exec.security: "full"` i
`tools.exec.ask: "off"`), OpenClaw dodaje `--permission-mode bypassPermissions`.
Ustawienia per-agent `agents.list[].tools.exec` zastępują globalne `tools.exec` dla
tego agenta. Aby wymusić inny tryb Claude, ustaw jawne surowe argumenty backendu,
takie jak `--permission-mode default` lub `--permission-mode acceptEdits` pod
`agents.defaults.cliBackends.claude-cli.args` oraz odpowiadające im `resumeArgs`.

Dołączony backend Anthropic `claude-cli` mapuje również poziomy OpenClaw `/think`
na natywną flagę Claude Code `--effort` dla poziomów innych niż wyłączony. `minimal` i
`low` mapują się na `low`, `adaptive` i `medium` mapują się na `medium`, a `high`,
`xhigh` i `max` mapują się bezpośrednio. Inne backendy CLI potrzebują, aby ich właścicielski Plugin
zadeklarował równoważny mapper argv, zanim `/think` będzie mogło wpłynąć na uruchamiane CLI.

Zanim OpenClaw będzie mógł użyć dołączonego backendu `claude-cli`, sam Claude Code
musi być już zalogowany na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Użyj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy binarium `claude`
nie znajduje się już w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (placeholder `{sessionId}`), gdy identyfikator trzeba wstawić
  do wielu flag.
- Jeśli CLI używa **podpolecenia resume** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy wcześniej został zapisany.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`
  i `input: "stdin"`, dzięki czemu kolejne tury ponownie używają aktywnego procesu Claude.
  Ciepłe stdio jest teraz domyślne, również dla niestandardowych konfiguracji,
  które pomijają pola transportu. Jeśli Gateway uruchomi się ponownie albo bezczynny proces
  zakończy działanie, OpenClaw wznowi z zapisanego identyfikatora sesji Claude. Zapisane
  identyfikatory sesji są weryfikowane względem istniejącego czytelnego transkryptu projektu przed
  wznowieniem, więc widmowe powiązania są czyszczone z `reason=transcript-missing`
  zamiast po cichu rozpoczynać świeżą sesję Claude CLI z `--resume`.
- Sesje Claude live zachowują ograniczone zabezpieczenia wyjścia JSONL. Wartości domyślne dopuszczają do
  8 MiB i 20 000 surowych wierszy JSONL na turę. Tury Claude intensywnie używające narzędzi mogą zwiększyć
  je dla danego backendu przez
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  i `maxTurnLines`; OpenClaw ogranicza te ustawienia do 64 MiB i 100 000
  wierszy.
- Zapisane sesje CLI są ciągłością należącą do dostawcy. Niejawny dzienny reset sesji
  ich nie przerywa; `/reset` oraz jawne polityki `session.reset` nadal
  to robią.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje uruchomienia w tej samej ścieżce w kolejności.
- Większość CLI serializuje w jednej ścieżce dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmienia się wybrana tożsamość uwierzytelniania,
  w tym zmieniony identyfikator profilu uwierzytelniania, statyczny klucz API, statyczny token lub tożsamość
  konta OAuth, jeśli CLI ją ujawnia. Rotacja tokenu dostępu i odświeżania OAuth
  nie przerywa zapisanej sesji CLI. Jeśli CLI nie ujawnia
  stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować uprawnienia wznowienia.

## Prelude awaryjne z sesji claude-cli

Gdy próba `claude-cli` przełącza się awaryjnie na kandydata niebędącego CLI w
[`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw zasila
następną próbę wstępem kontekstowym pozyskanym z lokalnego transkryptu JSONL
Claude Code w `~/.claude/projects/`. Bez tego zasilenia dostawca awaryjny
startowałby na zimno, ponieważ własny transkrypt sesji OpenClaw jest pusty
dla uruchomień `claude-cli`.

- Prelude preferuje najnowsze podsumowanie `/compact` lub znacznik `compact_boundary`,
  a następnie dołącza najnowsze tury po granicy do limitu znaków.
  Tury sprzed granicy są pomijane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są scalane do kompaktowych wskazówek `(tool call: name)` i
  `(tool result: …)`, aby uczciwie utrzymać budżet promptu. Podsumowanie jest
  oznaczone jako `(truncated)`, jeśli przekroczy limit.
- Przełączenia awaryjne tego samego dostawcy z `claude-cli` na `claude-cli` polegają na własnym
  `--resume` Claude i pomijają prelude.
- Zasilenie ponownie używa istniejącej walidacji ścieżki pliku sesji Claude, więc
  nie można odczytać dowolnych ścieżek.

## Obrazy (przekazywanie dalej)

Jeśli Twoje CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli `imageArg` jest ustawione, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` nie ma, OpenClaw dołącza
ścieżki plików do promptu (wstrzyknięcie ścieżki), co wystarcza CLI, które automatycznie
ładują lokalne pliki ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst oraz identyfikator sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response` oraz
  użycie ze `stats`, gdy `usage` nie istnieje lub jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz
  identyfikatory sesji, jeśli są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi, a `maxPromptArgChars` jest ustawione, używany jest stdin.

## Wartości domyślne (należące do Plugin)

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

Wymaganie wstępne: lokalny Gemini CLI musi być zainstalowany i dostępny jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON w Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie wraca do `stats`, gdy `usage` jest nieobecne lub puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko w razie potrzeby (często: bezwzględna ścieżka `command`).

## Domyślne ustawienia należące do Plugin

Domyślne ustawienia backendu CLI są teraz częścią powierzchni Plugin:

- Plugins rejestrują je za pomocą `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje domyślne ustawienia Plugin.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje własnością Plugin przez opcjonalny
  hook `normalizeConfig`.

Plugins, które potrzebują drobnych nakładek zgodności promptów/wiadomości, mogą deklarować
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
przepisuje strumieniowane delty asystenta oraz sparsowany tekst końcowy, zanim OpenClaw obsłuży
własne znaczniki sterujące i dostarczenie do kanału.

Dla CLI, które emitują JSONL zgodny ze stream-json Claude Code, ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki MCP w pakiecie

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć wygenerowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`.

Obecne zachowanie pakietowe:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: wbudowane nadpisania konfiguracji dla `mcp_servers`; wygenerowany
  serwer loopback OpenClaw jest oznaczony trybem zatwierdzania narzędzi per serwer Codex,
  aby wywołania MCP nie mogły zatrzymać się na lokalnych promptach zatwierdzania
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy pakietowy MCP jest włączony, OpenClaw:

- uruchamia serwer HTTP MCP loopback, który udostępnia narzędzia gateway procesowi CLI
- uwierzytelnia most tokenem dla sesji (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego obszaru roboczego
- scala je z dowolnym istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomienia, używając trybu integracji należącego do backendu z rozszerzenia właścicielskiego

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza pakietowy MCP, aby uruchomienia w tle pozostawały izolowane.

Zakresowane do sesji pakietowe środowiska uruchomieniowe MCP są buforowane do ponownego użycia w ramach sesji, a następnie
usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10
minut; ustaw `0`, aby wyłączyć). Jednorazowe uruchomienia osadzone, takie jak sondy uwierzytelniania,
generowanie slugów i odtwarzanie Active Memory, żądają czyszczenia po zakończeniu uruchomienia, aby dzieci stdio
oraz strumienie Streamable HTTP/SSE nie trwały dłużej niż uruchomienie.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie zależy od backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  do zakończenia.
- **Dane wyjściowe strukturalne** zależą od formatu JSON CLI.
- **Sesje Codex CLI** są wznawiane przez wyjście tekstowe (bez JSONL), które jest mniej
  strukturalne niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby zmapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie ma wartości
  `none` (Codex CLI obecnie nie może wznawiać z wyjściem JSON).
- **Obrazy ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki do plików).

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
