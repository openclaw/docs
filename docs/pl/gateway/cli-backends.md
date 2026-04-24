---
read_when:
    - Chcesz niezawodnego fallbacku, gdy zawodzą dostawcy API
    - Uruchamiasz Codex CLI lub inne lokalne AI CLI i chcesz używać ich ponownie
    - Chcesz zrozumieć most MCP local loopback dla dostępu narzędzi backendu CLI
summary: 'Backendy CLI: lokalny fallback AI CLI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-04-24T09:08:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36ea909118e173d397a21bb4ee2c33be0965be4bf57649efef038caeead3ab
    source_path: gateway/cli-backends.md
    workflow: 15
---

# Backendy CLI (środowisko wykonawcze fallback)

OpenClaw może uruchamiać **lokalne AI CLI** jako **tekstowy fallback** wtedy, gdy dostawcy API są niedostępni,
objęci limitem szybkości lub tymczasowo działają nieprawidłowo. To rozwiązanie jest celowo zachowawcze:

- **Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio**, ale backendy z `bundleMcp: true`
  mogą otrzymywać narzędzia gateway przez most MCP local loopback.
- **Strumieniowanie JSONL** dla CLI, które je obsługują.
- **Sesje są obsługiwane** (dzięki czemu kolejne tury pozostają spójne).
- **Obrazy mogą być przekazywane dalej**, jeśli CLI akceptuje ścieżki do obrazów.

To rozwiązanie jest przeznaczone jako **siatka bezpieczeństwa**, a nie główna ścieżka. Używaj go, gdy
chcesz mieć odpowiedzi tekstowe typu „zawsze działa” bez polegania na zewnętrznych API.

Jeśli chcesz pełnego środowiska harness z kontrolą sesji ACP, zadaniami w tle,
powiązaniem z wątkiem/rozmową i trwałymi zewnętrznymi sesjami kodowania, użyj
zamiast tego [Agenci ACP](/pl/tools/acp-agents). Backendy CLI nie są ACP.

## Szybki start dla początkujących

Możesz używać Codex CLI **bez żadnej konfiguracji** (dołączony Plugin OpenAI
rejestruje domyślny backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Jeśli twoje gateway działa pod launchd/systemd, a `PATH` jest minimalne, dodaj tylko
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

To wszystko. Nie potrzeba kluczy ani dodatkowej konfiguracji auth poza samym CLI.

Jeśli używasz dołączonego backendu CLI jako **głównego dostawcy wiadomości** na
hoście gateway, OpenClaw teraz automatycznie ładuje posiadający go dołączony Plugin, gdy twoja konfiguracja
jawnie odwołuje się do tego backendu w model ref lub pod
`agents.defaults.cliBackends`.

## Używanie jako fallback

Dodaj backend CLI do listy fallbacków, aby był uruchamiany tylko wtedy, gdy modele główne zawiodą:

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

- Jeśli używasz `agents.defaults.models` (allowlista), musisz uwzględnić tam także modele backendów CLI.
- Jeśli główny dostawca zawiedzie (auth, limity szybkości, timeouty), OpenClaw
  spróbuje następnie backendu CLI.

## Przegląd konfiguracji

Wszystkie backendy CLI znajdują się pod:

```
agents.defaults.cliBackends
```

Każdy wpis jest kluczowany przez **identyfikator dostawcy** (np. `codex-cli`, `my-cli`).
Identyfikator dostawcy staje się lewą stroną twojego model ref:

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
2. **Buduje prompt systemowy** przy użyciu tego samego promptu OpenClaw + kontekstu obszaru roboczego.
3. **Uruchamia CLI** z identyfikatorem sesji (jeśli obsługiwany), aby historia pozostała spójna.
   Dołączony backend `claude-cli` utrzymuje proces stdio Claude aktywny per
   sesja OpenClaw i wysyła kolejne tury przez stream-json na stdin.
4. **Parsuje wynik** (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. **Utrwala identyfikatory sesji** per backend, dzięki czemu kolejne tury używają tej samej sesji CLI.

<Note>
Dołączony backend Anthropic `claude-cli` jest ponownie obsługiwany. Pracownicy Anthropic
powiedzieli nam, że użycie Claude CLI w stylu OpenClaw jest znów dozwolone, więc OpenClaw traktuje
użycie `claude -p` jako usankcjonowane dla tej integracji, chyba że Anthropic opublikuje
nową politykę.
</Note>

Dołączony backend OpenAI `codex-cli` przekazuje prompt systemowy OpenClaw przez
nadpisanie konfiguracji `model_instructions_file` w Codex (`-c
model_instructions_file="..."`). Codex nie udostępnia flagi w stylu Claude
`--append-system-prompt`, więc OpenClaw zapisuje złożony prompt do
tymczasowego pliku dla każdej nowej sesji Codex CLI.

Dołączony backend Anthropic `claude-cli` otrzymuje snapshot Skills OpenClaw
na dwa sposoby: kompaktowy katalog Skills OpenClaw w dołączonym prompcie systemowym oraz
tymczasowy Plugin Claude Code przekazywany przez `--plugin-dir`. Plugin zawiera
tylko Skills kwalifikujące się dla danego agenta/sesji, dzięki czemu natywny resolver Skills Claude Code widzi ten sam przefiltrowany zestaw, który OpenClaw w przeciwnym razie reklamowałby w prompcie. Nadpisania env/kluczy API dla Skills są nadal stosowane przez OpenClaw do środowiska procesu potomnego dla danego przebiegu.

Claude CLI ma też własny nieinteraktywny tryb uprawnień. OpenClaw mapuje go
na istniejącą politykę exec zamiast dodawać konfigurację specyficzną dla Claude: gdy
efektywnie żądana polityka exec to YOLO (`tools.exec.security: "full"` i
`tools.exec.ask: "off"`), OpenClaw dodaje `--permission-mode bypassPermissions`.
Ustawienia per agent `agents.list[].tools.exec` nadpisują globalne `tools.exec` dla
tego agenta. Aby wymusić inny tryb Claude, ustaw jawne surowe argumenty backendu,
takie jak `--permission-mode default` lub `--permission-mode acceptEdits` w
`agents.defaults.cliBackends.claude-cli.args` oraz odpowiadające `resumeArgs`.

Zanim OpenClaw będzie mógł użyć dołączonego backendu `claude-cli`, samo Claude Code
musi być już zalogowane na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Używaj `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy binarka `claude`
nie znajduje się już w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub
  `sessionArgs` (placeholder `{sessionId}`), gdy ID musi zostać wstawione
  do wielu flag.
- Jeśli CLI używa **podpolecenia resume** z innymi flagami, ustaw
  `resumeArgs` (zastępuje `args` przy wznawianiu) i opcjonalnie `resumeOutput`
  (dla wznowień nie-JSON).
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowe UUID, jeśli nic nie zapisano).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy został już wcześniej zapisany.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"`
  i `input: "stdin"`, dzięki czemu kolejne tury ponownie używają aktywnego procesu Claude, dopóki
  jest aktywny. Ciepłe stdio jest teraz wartością domyślną, także dla niestandardowych konfiguracji,
  które pomijają pola transportu. Jeśli Gateway uruchomi się ponownie albo proces bezczynny
  zakończy działanie, OpenClaw wznowi pracę z zapisanego identyfikatora sesji Claude. Zapisane identyfikatory sesji są weryfikowane względem istniejącego czytelnego transkryptu projektu przed
  wznowieniem, dzięki czemu fantomowe powiązania są czyszczone z `reason=transcript-missing`
  zamiast po cichu uruchamiać nową sesję Claude CLI pod `--resume`.
- Zapisane sesje CLI są ciągłością należącą do dostawcy. Niejawny dzienny reset sesji
  ich nie przerywa; robią to nadal `/reset` i jawne polityki `session.reset`.

Uwagi dotyczące serializacji:

- `serialize: true` utrzymuje kolejność przebiegów w tym samym pasie.
- Większość CLI serializuje w jednym pasie dostawcy.
- OpenClaw porzuca ponowne użycie zapisanej sesji CLI, gdy zmienia się wybrana tożsamość auth,
  w tym zmieniony identyfikator profilu auth, statyczny klucz API, statyczny token albo tożsamość konta OAuth,
  gdy CLI ją ujawnia. Rotacja tokenów dostępu i odświeżania OAuth nie przerywa zapisanej sesji CLI. Jeśli CLI nie ujawnia stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować uprawnienia wznowienia.

## Obrazy (pass-through)

Jeśli twoje CLI akceptuje ścieżki obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisze obrazy base64 do plików tymczasowych. Jeśli ustawiono `imageArg`, te
ścieżki są przekazywane jako argumenty CLI. Jeśli `imageArg` nie jest ustawione, OpenClaw dołącza
ścieżki plików do promptu (wstrzykiwanie ścieżek), co wystarcza dla CLI, które automatycznie
ładują lokalne pliki ze zwykłych ścieżek.

## Wejścia / wyjścia

- `output: "json"` (domyślnie) próbuje sparsować JSON i wyodrębnić tekst + identyfikator sesji.
- Dla wyjścia JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response`, a
  użycie z `stats`, gdy `usage` jest nieobecne lub puste.
- `output: "jsonl"` parsuje strumienie JSONL (na przykład Codex CLI `--json`) i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji, gdy są obecne.
- `output: "text"` traktuje stdout jako końcową odpowiedź.

Tryby wejścia:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez stdin.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, używany jest stdin.

## Wartości domyślne (należące do Pluginu)

Dołączony Plugin OpenAI rejestruje też wartość domyślną dla `codex-cli`:

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

Warunek wstępny: lokalny Gemini CLI musi być zainstalowany i dostępny jako
`gemini` w `PATH` (`brew install gemini-cli` lub
`npm install -g @google/gemini-cli`).

Uwagi dotyczące JSON Gemini CLI:

- Tekst odpowiedzi jest odczytywany z pola JSON `response`.
- Użycie wraca do `stats`, gdy `usage` jest nieobecne lub puste.
- `stats.cached` jest normalizowane do OpenClaw `cacheRead`.
- Jeśli brakuje `stats.input`, OpenClaw wyprowadza tokeny wejściowe z
  `stats.input_tokens - stats.cached`.

Nadpisuj tylko w razie potrzeby (najczęściej: bezwzględna ścieżka `command`).

## Wartości domyślne należące do Pluginu

Wartości domyślne backendów CLI są teraz częścią powierzchni Pluginu:

- Pluginy rejestrują je przez `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w model ref.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal nadpisuje wartość domyślną Pluginu.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje własnością Pluginu przez opcjonalny
  Hook `normalizeConfig`.

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
przepisuje strumieniowane delty asystenta i sparsowany końcowy tekst, zanim OpenClaw wykona
własną obsługę znaczników sterujących i dostarczania do kanału.

Dla CLI, które emitują JSONL zgodny z Claude Code stream-json, ustaw
`jsonlDialect: "claude-stream-json"` w konfiguracji tego backendu.

## Nakładki MCP bundla

Backendy CLI **nie** otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może
jawnie włączyć wygenerowaną nakładkę konfiguracji MCP przez `bundleMcp: true`.

Bieżące zachowanie dołączone:

- `claude-cli`: wygenerowany ścisły plik konfiguracji MCP
- `codex-cli`: inline nadpisania konfiguracji dla `mcp_servers`; wygenerowany
  serwer local loopback OpenClaw jest oznaczony trybem zatwierdzania narzędzi per serwer Codex,
  dzięki czemu wywołania MCP nie mogą utknąć na lokalnych promptach zatwierdzania
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini

Gdy bundle MCP jest włączone, OpenClaw:

- uruchamia serwer HTTP MCP local loopback, który udostępnia narzędzia gateway procesowi CLI
- uwierzytelnia most tokenem per sesja (`OPENCLAW_MCP_TOKEN`)
- ogranicza dostęp do narzędzi do bieżącej sesji, konta i kontekstu kanału
- ładuje włączone serwery bundle-MCP dla bieżącego obszaru roboczego
- scala je z istniejącym kształtem konfiguracji/ustawień MCP backendu
- przepisuje konfigurację uruchomienia z użyciem trybu integracji należącego do backendu z rozszerzenia właściciela

Jeśli nie są włączone żadne serwery MCP, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy
backend włączy bundle MCP, tak aby przebiegi w tle pozostały izolowane.

## Ograniczenia

- **Brak bezpośrednich wywołań narzędzi OpenClaw.** OpenClaw nie wstrzykuje wywołań narzędzi do
  protokołu backendu CLI. Backendy widzą narzędzia gateway tylko wtedy, gdy włączą
  `bundleMcp: true`.
- **Strumieniowanie jest specyficzne dla backendu.** Niektóre backendy strumieniują JSONL; inne buforują
  aż do zakończenia.
- **Wyjścia ustrukturyzowane** zależą od formatu JSON danego CLI.
- **Sesje Codex CLI** są wznawiane przez wyjście tekstowe (bez JSONL), co daje
  mniej struktury niż początkowy przebieg `--json`. Sesje OpenClaw nadal działają
  normalnie.

## Rozwiązywanie problemów

- **Nie znaleziono CLI**: ustaw `command` na pełną ścieżkę.
- **Nieprawidłowa nazwa modelu**: użyj `modelAliases`, aby mapować `provider/model` → model CLI.
- **Brak ciągłości sesji**: upewnij się, że `sessionArg` jest ustawione, a `sessionMode` nie ma wartości
  `none` (Codex CLI obecnie nie może wznawiać z wyjściem JSON).
- **Obrazy są ignorowane**: ustaw `imageArg` (i sprawdź, czy CLI obsługuje ścieżki plików).

## Powiązane

- [Instrukcja operacyjna Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
