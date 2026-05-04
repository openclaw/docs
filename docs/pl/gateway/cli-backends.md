---
read_when:
    - Chcesz mieć niezawodny mechanizm zapasowy na wypadek awarii dostawców API
    - Korzystasz z Codex CLI lub innych lokalnych CLI AI i chcesz je ponownie wykorzystać
    - Chcesz zrozumieć mostek pętli zwrotnej MCP do dostępu do narzędzi zaplecza CLI
summary: 'Backendy CLI: lokalny awaryjny mechanizm AI CLI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-05-04T18:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchamiać **lokalne CLI AI** jako **tekstowy tryb awaryjny**, gdy dostawcy API są niedostępni,
ograniczani limitami lub tymczasowo działają nieprawidłowo. To celowo konserwatywne podejście:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia Gateway przez most MCP loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

Jest to zaprojektowane jako **siatka bezpieczeństwa**, a nie główna ścieżka. Użyj tego, gdy
chcesz otrzymywać odpowiedzi tekstowe „zawsze działa” bez polegania na zewnętrznych API.

Jeśli chcesz pełne środowisko runtime z kontrolami sesji ACP, zadaniami w tle,
wiązaniem wątku/konwersacji i trwałymi zewnętrznymi sesjami kodowania, użyj zamiast tego
[Agentów ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

## Przyjazny dla początkujących szybki start

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
jawnie odwołuje się do tego backendu w referencji modelu lub w
`agents.defaults.cliBackends`.

## Używanie jako trybu awaryjnego

Dodaj backend CLI do listy awaryjnej, aby uruchamiał się tylko wtedy, gdy modele główne zawiodą:

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

- Jeśli używasz `agents.defaults.models` (lista dozwolonych), musisz uwzględnić tam również modele backendu CLI.
- Jeśli główny dostawca zawiedzie (uwierzytelnianie, limity, przekroczenia czasu), OpenClaw
  spróbuje następnie backendu CLI.

## Omówienie konfiguracji

Wszystkie backendy CLI znajdują się w:

```
agents.defaults.cliBackends
```

Każdy wpis ma klucz w postaci **identyfikatora dostawcy** (np. `codex-cli`, `my-cli`).
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
2. **Buduje prompt systemowy** z użyciem tego samego promptu OpenClaw i kontekstu przestrzeni roboczej.
3. **Wykonuje CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces stdio Claude przy życiu dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stdin stream-json.
4. **Parsuje wyjście** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala identyfikatory sesji** dla każdego backendu, dzięki czemu kolejne tury ponownie używają tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
przekazali nam, że użycie Claude CLI w stylu OpenClaw jest znowu dozwolone, więc OpenClaw traktuje
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
tymczasowy Plugin Claude Code przekazany przez `--plugin-dir`. Plugin zawiera
tylko kwalifikujące się Skills dla danego agenta/sesji, więc natywny resolver Skills
Claude Code widzi ten sam przefiltrowany zestaw, który OpenClaw w przeciwnym razie reklamowałby w
prompcie. Nadpisania zmiennych środowiskowych/API key dla Skills są nadal stosowane przez OpenClaw do
środowiska procesu potomnego na czas uruchomienia.

Claude CLI ma także własny nieinteraktywny tryb uprawnień. OpenClaw mapuje go
na istniejącą politykę exec zamiast dodawać konfigurację specyficzną dla Claude: gdy
efektywna żądana polityka exec to YOLO (`tools.exec.security: "full"` i
`tools.exec.ask: "off"`), OpenClaw dodaje `--permission-mode bypassPermissions`.
Ustawienia poszczególnych agentów `agents.list[].tools.exec` zastępują globalne `tools.exec` dla
tego agenta. Aby wymusić inny tryb Claude, ustaw jawne surowe argumenty backendu,
takie jak `--permission-mode default` lub `--permission-mode acceptEdits` w
`agents.defaults.cliBackends.claude-cli.args` oraz pasujące `resumeArgs`.

Dołączony backend Anthropic `claude-cli` mapuje również poziomy OpenClaw `/think`
na natywną flagę Claude Code `--effort` dla poziomów innych niż wyłączone. `minimal` i
`low` mapują się na `low`, `adaptive` i `medium` mapują się na `medium`, a `high`,
`xhigh` i `max` mapują się bezpośrednio. Inne backendy CLI wymagają, aby ich właścicielski Plugin
zadeklarował równoważny mapper argv, zanim `/think` będzie mogło wpłynąć na uruchamiane CLI.

Zanim OpenClaw będzie mógł użyć dołączonego backendu `claude-cli`, sam Claude Code
musi być już zalogowany na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Użyj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy plik binarny `claude`
nie znajduje się już w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (placeholder `{sessionId}`), gdy identyfikator musi zostać wstawiony
  do wielu flag.
- Jeśli CLI używa **podpolecenia wznowienia** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` podczas wznawiania) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy wcześniej został zapisany.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`,
  i `input: "stdin"`, aby kolejne tury ponownie używały działającego procesu Claude,
  gdy jest aktywny. Ciepłe stdio jest teraz domyślne, również dla niestandardowych konfiguracji,
  które pomijają pola transportu. Jeśli Gateway zostanie zrestartowany lub bezczynny proces
  zakończy działanie, OpenClaw wznawia pracę z zapisanego identyfikatora sesji Claude. Zapisane identyfikatory sesji
  są weryfikowane względem istniejącego czytelnego transkryptu projektu przed
  wznowieniem, więc fikcyjne powiązania są czyszczone z `reason=transcript-missing`
  zamiast cicho uruchamiać świeżą sesję Claude CLI z `--resume`.
- Sesje Claude live utrzymują ograniczone zabezpieczenia wyjścia JSONL. Domyślnie pozwalają na maksymalnie
  8 MiB i 20 000 surowych wierszy JSONL na turę. Tury Claude intensywnie używające narzędzi mogą podnieść
  te limity dla backendu przez
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  oraz `maxTurnLines`; OpenClaw ogranicza te ustawienia do 64 MiB i 100 000
  wierszy.
- Zapisane sesje CLI to ciągłość należąca do dostawcy. Niejawny dzienny reset sesji
  ich nie przerywa; `/reset` i jawne polityki `session.reset` nadal
  działają.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje kolejność uruchomień w tej samej ścieżce.
- Większość CLI serializuje na jednej ścieżce dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmieni się wybrana tożsamość uwierzytelniania,
  w tym zmieniony identyfikator profilu uwierzytelniania, statyczny API key, statyczny token lub tożsamość
  konta OAuth, gdy CLI ją ujawnia. Rotacja tokenów dostępu i odświeżania OAuth
  nie przerywa zapisanej sesji CLI. Jeśli CLI nie ujawnia
  stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować uprawnienia wznowienia.

## Wstęp awaryjny z sesji claude-cli

Gdy próba `claude-cli` przełącza się awaryjnie na kandydata innego niż CLI w
[`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw zasila
następną próbę wstępem kontekstowym zebranym z lokalnego transkryptu JSONL Claude Code
w `~/.claude/projects/`. Bez tego zasiewu dostawca awaryjny
startowałby na zimno, ponieważ własny transkrypt sesji OpenClaw jest pusty
dla uruchomień `claude-cli`.

- Wstęp preferuje najnowsze podsumowanie `/compact` lub znacznik `compact_boundary`,
  a następnie dołącza najnowsze tury po granicy do limitu znaków.
  Tury sprzed granicy są pomijane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są scalane do kompaktowych wskazówek `(tool call: name)` i
  `(tool result: …)`, aby uczciwie zarządzać budżetem promptu. Podsumowanie jest
  oznaczone `(truncated)`, jeśli przekroczy limit.
- Przełączenia awaryjne z `claude-cli` do `claude-cli` u tego samego dostawcy polegają na własnym
  `--resume` Claude i pomijają wstęp.
- Zasiew ponownie używa istniejącej walidacji ścieżki pliku sesji Claude, więc
  nie można odczytywać dowolnych ścieżek.

## Obrazy (przekazywanie dalej)

Jeśli Twoje CLI akceptuje ścieżki obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli `imageArg` jest ustawione, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` brakuje, OpenClaw dołącza
ścieżki plików do promptu (wstrzyknięcie ścieżek), co wystarcza dla CLI, które automatycznie
ładują lokalne pliki ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje parsować JSON i wyodrębnia tekst oraz identyfikator sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response` oraz
  użycie ze `stats`, gdy `usage` brakuje lub jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji, gdy są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używane jest stdin.

## Domyślne wartości (należące do Plugin)

Dołączony Plugin OpenAI rejestruje również domyślne ustawienie dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączony Plugin Google rejestruje również domyślne ustawienie dla `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Warunek wstępny: lokalny Gemini CLI musi być zainstalowany i dostępny jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie korzysta awaryjnie ze `stats`, gdy `usage` jest nieobecne lub puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisz tylko w razie potrzeby (często: bezwzględna ścieżka `command`).

## Wartości domyślne należące do Plugin

Wartości domyślne backendu CLI są teraz częścią powierzchni Plugin:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje wartość domyślną Plugin.
- Czyszczenie konfiguracji specyficzne dla backendu pozostaje własnością Plugin przez opcjonalny
  hak `normalizeConfig`.

Pluginy, które potrzebują niewielkich warstw zgodności promptów/wiadomości, mogą deklarować
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

Dla CLI emitujących JSONL zgodny z Claude Code stream-json ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki MCP pakietu

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć generowaną nakładkę konfiguracji MCP przez `bundleMcp: true`.

Bieżące zachowanie pakietowe:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: nadpisania konfiguracji inline dla `mcp_servers`; wygenerowany
  serwer OpenClaw loopback jest oznaczony trybem zatwierdzania narzędzi per-serwer Codex,
  aby wywołania MCP nie mogły utknąć na lokalnych promptach zatwierdzania
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy MCP pakietu jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP loopback, który udostępnia narzędzia gateway procesowi CLI
- uwierzytelnia most za pomocą tokenu per sesja (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego obszaru roboczego
- scala je z dowolnym istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomienia, używając trybu integracji należącego do backendu z rozszerzenia właściciela

Jeśli nie włączono żadnych serwerów MCP, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza MCP pakietu, aby uruchomienia w tle pozostały odizolowane.

Zakresowe dla sesji pakietowe środowiska uruchomieniowe MCP są buforowane do ponownego użycia w sesji, a następnie
usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10
minut; ustaw `0`, aby wyłączyć). Jednorazowe uruchomienia osadzone, takie jak sondy uwierzytelniania,
generowanie slugów i przywoływanie active-memory, żądają czyszczenia na końcu uruchomienia, aby dzieci
stdio oraz strumienie Streamable HTTP/SSE nie przeżywały uruchomienia.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Streaming zależy od backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  do zakończenia.
- **Dane wyjściowe strukturalne** zależą od formatu JSON CLI.
- **Sesje Codex CLI** wznawiają się przez tekst wyjściowy (bez JSONL), co jest mniej
  strukturalne niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby zmapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie jest
  `none` (Codex CLI obecnie nie może wznawiać z wyjściem JSON).
- **Ignorowane obrazy**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki plików).

## Powiązane

- [Runbook Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
