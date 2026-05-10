---
read_when:
    - Potrzebujesz niezawodnego mechanizmu awaryjnego, gdy dostawcy API zawodzą
    - Używasz Codex CLI lub innych lokalnych CLI AI i chcesz je ponownie wykorzystać
    - Chcesz zrozumieć mostek loopback MCP służący do dostępu do narzędzi backendu CLI
summary: 'Backendy CLI: lokalny mechanizm rezerwowy AI CLI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-05-10T19:34:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchamiać **lokalne CLI AI** jako **tekstowy fallback**, gdy dostawcy API są niedostępni,
ograniczani limitami lub tymczasowo działają nieprawidłowo. To celowo zachowawcze rozwiązanie:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia Gateway przez most MCP local loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (więc kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki obrazów.

To rozwiązanie zaprojektowano jako **siatkę bezpieczeństwa**, a nie główną ścieżkę. Używaj go, gdy
chcesz mieć tekstowe odpowiedzi, które „zawsze działają”, bez polegania na zewnętrznych API.

Jeśli chcesz pełne środowisko uruchomieniowe harness z kontrolą sesji ACP, zadaniami w tle,
wiązaniem wątku/konwersacji oraz trwałymi zewnętrznymi sesjami kodowania, użyj zamiast tego
[Agentów ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

<Tip>
  Tworzysz nowy backend plugin? Użyj
  [Pluginów backendu CLI](/pl/plugins/cli-backend-plugins). Ta strona jest dla użytkowników
  konfigurujących i obsługujących już zarejestrowany backend.
</Tip>

## Szybki start dla początkujących

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony plugin OpenAI
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

Jeśli używasz dołączonego backendu CLI jako **głównego dostawcy wiadomości** na hoście
gateway, OpenClaw teraz automatycznie ładuje właścicielski dołączony plugin, gdy Twoja konfiguracja
jawnie odwołuje się do tego backendu w referencji modelu lub w
`agents.defaults.cliBackends`.

## Używanie jako fallback

Dodaj backend CLI do listy fallback, aby uruchamiał się tylko wtedy, gdy modele główne zawiodą:

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
- Jeśli główny dostawca zawiedzie (uwierzytelnianie, limity szybkości, timeouty), OpenClaw
  spróbuje następnie backendu CLI.

## Omówienie konfiguracji

Wszystkie backendy CLI znajdują się w:

```
agents.defaults.cliBackends
```

Każdy wpis jest kluczowany przez **identyfikator dostawcy** (np. `codex-cli`, `my-cli`).
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

1. **Wybiera backend** na podstawie prefiksu dostawcy (`codex-cli/...`).
2. **Buduje prompt systemowy** przy użyciu tego samego promptu OpenClaw i kontekstu obszaru roboczego.
3. **Uruchamia CLI** z identyfikatorem sesji (jeśli jest obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces Claude stdio przy życiu dla każdej
   sesji OpenClaw i wysyła kolejne tury przez stream-json stdin.
4. **Parsuje wyjście** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala identyfikatory sesji** dla każdego backendu, aby kolejne tury ponownie używały tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako zatwierdzone dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend OpenAI `codex-cli` przekazuje prompt systemowy OpenClaw przez
nadpisanie konfiguracji `model_instructions_file` Codex (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude
`--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do
pliku tymczasowego dla każdej świeżej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje migawkę Skills OpenClaw
na dwa sposoby: kompaktowy katalog Skills OpenClaw w dołączonym promptcie systemowym oraz
tymczasowy plugin Claude Code przekazany przez `--plugin-dir`. Plugin zawiera
tylko kwalifikujące się Skills dla tego agenta/sesji, więc natywny resolver Skills
Claude Code widzi ten sam odfiltrowany zestaw, który OpenClaw w przeciwnym razie ogłaszałby w
promptcie. Nadpisania env/API key Skills nadal są stosowane przez OpenClaw do
środowiska procesu potomnego dla danego uruchomienia.

Claude CLI ma także własny nieinteraktywny tryb uprawnień. OpenClaw mapuje go
na istniejącą politykę exec zamiast dodawać konfigurację specyficzną dla Claude: gdy
efektywna żądana polityka exec to YOLO (`tools.exec.security: "full"` i
`tools.exec.ask: "off"`), OpenClaw dodaje `--permission-mode bypassPermissions`.
Ustawienia per-agent `agents.list[].tools.exec` nadpisują globalne `tools.exec` dla
tego agenta. Aby wymusić inny tryb Claude, ustaw jawne surowe argumenty backendu
takie jak `--permission-mode default` lub `--permission-mode acceptEdits` w
`agents.defaults.cliBackends.claude-cli.args` oraz pasujące `resumeArgs`.

Dołączony backend Anthropic `claude-cli` mapuje także poziomy OpenClaw `/think`
na natywną flagę Claude Code `--effort` dla poziomów innych niż off. `minimal` i
`low` mapują się na `low`, `adaptive` i `medium` mapują się na `medium`, a `high`,
`xhigh` i `max` mapują się bezpośrednio. Inne backendy CLI wymagają, aby ich właścicielski plugin
zadeklarował równoważny mapper argv, zanim `/think` będzie mogło wpływać na uruchamiane CLI.

Zanim OpenClaw będzie mógł używać dołączonego backendu `claude-cli`, sam Claude Code
musi już być zalogowany na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Używaj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy binarka `claude`
nie znajduje się już w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (placeholder `{sessionId}`), gdy ID musi zostać wstawiony
  do wielu flag.
- Jeśli CLI używa **podpolecenia resume** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` podczas wznawiania) i opcjonalnie `resumeOutput`
  (dla wznowień innych niż JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy wcześniej jakiś zapisano.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`,
  oraz `input: "stdin"`, aby kolejne tury ponownie używały aktywnego procesu Claude.
  Ciepłe stdio jest teraz domyślne, także dla niestandardowych konfiguracji,
  które pomijają pola transportu. Jeśli Gateway zostanie zrestartowany lub bezczynny proces
  zakończy działanie, OpenClaw wznawia z zapisanego identyfikatora sesji Claude. Zapisane
  identyfikatory sesji są weryfikowane względem istniejącego czytelnego transkryptu projektu przed
  wznowieniem, więc fantomowe powiązania są czyszczone z `reason=transcript-missing`
  zamiast po cichu zaczynać świeżą sesję Claude CLI pod `--resume`.
- Sesje live Claude zachowują ograniczone strażniki wyjścia JSONL. Domyślne ustawienia pozwalają na maksymalnie
  8 MiB i 20 000 surowych linii JSONL na turę. Tury Claude intensywnie używające narzędzi mogą podnieść
  te limity dla backendu przez
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  oraz `maxTurnLines`; OpenClaw ogranicza te ustawienia do 64 MiB i 100 000
  linii.
- Zapisane sesje CLI są ciągłością należącą do dostawcy. Niejawny dzienny reset sesji
  ich nie przerywa; `/reset` i jawne polityki `session.reset` nadal to robią.
- Świeże sesje CLI zwykle reseedują tylko z podsumowania Compaction OpenClaw
  oraz ogona po Compaction. Aby odzyskać krótkie sesje unieważnione
  przed Compaction, backend może włączyć opcję
  `reseedFromRawTranscriptWhenUncompacted: true`. OpenClaw nadal utrzymuje reseed surowego
  transkryptu w ograniczonym zakresie i ogranicza go do bezpiecznych unieważnień, takich jak brakujące
  transkrypty CLI, zmiany promptu systemowego/MCP lub ponowienie po wygaśnięciu sesji; zmiany
  profilu auth lub epoki poświadczeń nigdy nie reseedują surowej historii transkryptu.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje uruchomienia w tej samej ścieżce w kolejności.
- Większość CLI serializuje w jednej ścieżce dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmienia się wybrana tożsamość auth,
  w tym zmieniony identyfikator profilu auth, statyczny API key, statyczny token lub tożsamość
  konta OAuth, gdy CLI ją ujawnia. Rotacja tokenów dostępu i odświeżania OAuth
  nie przerywa zapisanej sesji CLI. Jeśli CLI nie ujawnia
  stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować uprawnienia wznowienia.

## Prelude fallback z sesji claude-cli

Gdy próba `claude-cli` przełącza się awaryjnie na kandydata innego niż CLI w
[`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw zasila
następną próbę prelude kontekstu zebranym z lokalnego transkryptu JSONL
Claude Code w `~/.claude/projects/`. Bez tego ziarna dostawca fallback
startowałby na zimno, ponieważ własny transkrypt sesji OpenClaw jest pusty
dla uruchomień `claude-cli`.

- Prelude preferuje najnowsze podsumowanie `/compact` lub marker `compact_boundary`,
  a następnie dołącza najnowsze tury po granicy do limitu znaków.
  Tury sprzed granicy są odrzucane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są łączone w kompaktowe wskazówki `(tool call: name)` oraz
  `(tool result: …)`, aby zachować uczciwy budżet promptu. Podsumowanie jest
  oznaczane `(truncated)`, jeśli przekroczy limit.
- Fallbacki tego samego dostawcy z `claude-cli` do `claude-cli` polegają na własnym
  `--resume` Claude i pomijają prelude.
- Ziarno ponownie używa istniejącej walidacji ścieżki pliku sesji Claude, więc
  nie można odczytywać dowolnych ścieżek.

## Obrazy (przekazywanie dalej)

Jeśli Twoje CLI akceptuje ścieżki obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli `imageArg` jest ustawione, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` brakuje, OpenClaw dołącza
ścieżki plików do promptu (wstrzyknięcie ścieżek), co wystarcza CLI, które automatycznie
ładują lokalne pliki ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst oraz identyfikator sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response` oraz
  użycie ze `stats`, gdy `usage` brakuje lub jest puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji,
  gdy są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używane jest stdin.

## Domyślne wartości (należące do pluginu)

Dołączony plugin OpenAI rejestruje także domyślne ustawienie dla `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Dołączony Plugin Google rejestruje też wartość domyślną dla `google-gemini-cli`:

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
- `stats.cached` jest normalizowane do `cacheRead` OpenClaw.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko w razie potrzeby (często: bezwzględna ścieżka `command`).

## Wartości domyślne należące do Pluginu

Wartości domyślne backendu CLI są teraz częścią powierzchni Pluginu:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje wartość domyślną Pluginu.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje własnością Pluginu przez opcjonalny
  hook `normalizeConfig`.

Pluginy, które potrzebują drobnych podkładek zgodności promptów/wiadomości, mogą deklarować
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

Dla CLI, które emitują JSONL zgodny z Claude Code stream-json, ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki MCP pakietu

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
włączyć generowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`.

Bieżące zachowanie dołączonych backendów:

- `claude-cli`: generowany ścisły plik konfiguracji MCP
- `codex-cli`: wbudowane nadpisania konfiguracji dla `mcp_servers`; generowany
  serwer loopback OpenClaw jest oznaczony trybem zatwierdzania narzędzi per serwer w Codex,
  aby wywołania MCP nie mogły zatrzymać się na lokalnych monitach zatwierdzania
- `google-gemini-cli`: generowany plik ustawień systemowych Gemini

Gdy MCP pakietu jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP loopback, który udostępnia narzędzia Gateway procesowi CLI
- uwierzytelnia most tokenem per sesja (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego obszaru roboczego
- scala je z istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomienia przy użyciu trybu integracji należącego do backendu z właścicielskiego rozszerzenia

Jeśli żadne serwery MCP nie są włączone, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włącza MCP pakietu, aby uruchomienia w tle pozostały odizolowane.

Środowiska uruchomieniowe MCP dołączonego pakietu o zakresie sesji są buforowane do ponownego użycia w ramach sesji, a następnie
usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10
minut; ustaw `0`, aby wyłączyć). Jednorazowe osadzone uruchomienia, takie jak próby uwierzytelniania,
generowanie slugów i przypominanie Active Memory, żądają sprzątania na końcu uruchomienia, aby dzieci
stdio oraz strumienie Streamable HTTP/SSE nie żyły dłużej niż uruchomienie.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia Gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie jest specyficzne dla backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  do zakończenia.
- **Dane wyjściowe strukturalne** zależą od formatu JSON CLI.
- **Sesje Codex CLI** wznawiają działanie przez wyjście tekstowe (bez JSONL), które jest mniej
  strukturalne niż początkowe uruchomienie `--json`. Sesje OpenClaw nadal działają
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
