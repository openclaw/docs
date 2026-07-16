---
read_when:
    - Potrzebne jest niezawodne rozwiązanie awaryjne na wypadek awarii dostawców API
    - Uruchamiasz lokalne narzędzia AI w interfejsie CLI i chcesz używać ich ponownie
    - Chcesz zrozumieć most pętli zwrotnej MCP zapewniający backendowi CLI dostęp do narzędzi
summary: 'Backendy CLI: lokalny mechanizm awaryjny AI CLI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-07-16T18:22:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchomić lokalne CLI AI jako tekstowy mechanizm awaryjny, gdy dostawcy API są niedostępni, ograniczają częstotliwość żądań lub działają nieprawidłowo. Rozwiązanie jest celowo zachowawcze:

- Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio, ale backend z `bundleMcp: true` może odbierać narzędzia Gateway za pośrednictwem lokalnego mostu MCP.
- Strumieniowanie JSONL dla obsługujących je CLI.
- Obsługiwane są sesje, dzięki czemu kolejne interakcje zachowują spójność.
- Obrazy są przekazywane, jeśli CLI akceptuje ścieżki do obrazów.

Należy używać tego rozwiązania jako zabezpieczenia zapewniającego „zawsze działające” odpowiedzi tekstowe, a nie jako głównej ścieżki. Aby korzystać z pełnego środowiska uruchomieniowego z kontrolą sesji ACP, zadaniami w tle, powiązaniem wątków/konwersacji i trwałymi zewnętrznymi sesjami programistycznymi, należy zamiast tego użyć [agentów ACP](/pl/tools/acp-agents); backendy CLI nie są ACP.

<Tip>
  Tworzysz nowy Plugin backendu? Zobacz [Pluginy backendów CLI](/pl/plugins/cli-backend-plugins). Ta strona opisuje konfigurowanie i obsługę już zarejestrowanego backendu.
</Tip>

## Szybki start

Dołączony Plugin Anthropic rejestruje domyślny backend `claude-cli`, więc działa on bez dodatkowej konfiguracji, o ile Claude Code jest zainstalowany i zalogowany:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` jest domyślnym identyfikatorem agenta, gdy nie skonfigurowano jawnej listy agentów; w przeciwnym razie należy zastąpić go własnym identyfikatorem agenta.

Jeśli Gateway działa pod kontrolą launchd/systemd z minimalną zmienną `PATH`, należy jawnie wskazać plik binarny:

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

Jeśli dołączony backend CLI jest używany jako główny dostawca wiadomości na hoście Gateway, OpenClaw automatycznie ładuje należący do niego dołączony Plugin, gdy konfiguracja odwołuje się do tego backendu w referencji modelu lub w sekcji `agents.defaults.cliBackends`.

## Używanie jako mechanizmu awaryjnego

Należy dodać backend CLI do listy mechanizmów awaryjnych, aby był uruchamiany tylko w przypadku awarii modeli głównych:

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

Jeśli `agents.defaults.models` jest używane jako lista dozwolonych elementów, należy uwzględnić tam również modele backendu CLI. Gdy główny dostawca ulegnie awarii (uwierzytelnianie, limity częstotliwości, przekroczenia limitu czasu), OpenClaw w następnej kolejności próbuje użyć backendu CLI.

## Konfiguracja

Wszystkie backendy CLI znajdują się w sekcji `agents.defaults.cliBackends` i są indeksowane według identyfikatora dostawcy (np. `claude-cli`, `my-cli`). Identyfikator dostawcy staje się lewą częścią referencji modelu: `<provider>/<model>`.

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
          // Dedykowana flaga pliku promptu:
          // systemPromptFileArg: "--system-file",
          // Alternatywnie flaga nadpisania konfiguracji w stylu Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Włącz tylko wtedy, gdy ten backend może ponownie zainicjować unieważnione
          // sesje na podstawie ograniczonej, surowej historii transkrypcji OpenClaw sprzed Compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Jak to działa

1. Wybiera backend na podstawie prefiksu dostawcy (`claude-cli/...`).
2. Tworzy prompt systemowy przy użyciu tego samego promptu OpenClaw i kontekstu obszaru roboczego.
3. Uruchamia CLI z identyfikatorem sesji (jeśli jest obsługiwany), aby zachować spójność historii. Dołączony backend `claude-cli` utrzymuje aktywny proces Claude stdio dla każdej sesji OpenClaw i wysyła kolejne interakcje przez standardowe wejście stream-json.
4. Analizuje dane wyjściowe (JSON lub zwykły tekst) i zwraca ostateczny tekst.
5. Utrwala identyfikatory sesji dla każdego backendu, aby kolejne interakcje ponownie używały tej samej sesji CLI.

### Szczegóły dotyczące Claude CLI

Dołączony backend `claude-cli` preferuje natywny mechanizm rozpoznawania umiejętności Claude Code. Gdy bieżąca migawka umiejętności zawiera co najmniej jedną wybraną umiejętność ze zmaterializowaną ścieżką, OpenClaw przekazuje tymczasowy Plugin Claude Code przez `--plugin-dir` i pomija zduplikowany katalog umiejętności OpenClaw w dołączanym prompcie systemowym. Bez zmaterializowanej umiejętności Pluginu OpenClaw zachowuje katalog w prompcie jako mechanizm awaryjny. Nadpisania zmiennych środowiskowych i kluczy API umiejętności nadal mają zastosowanie do środowiska procesu potomnego podczas uruchomienia.

Claude CLI ma własny nieinteraktywny tryb uprawnień; OpenClaw odwzorowuje go na istniejące zasady wykonywania zamiast dodawać konfigurację specyficzną dla Claude. W przypadku zarządzanych przez OpenClaw aktywnych sesji Claude obowiązujące zasady wykonywania są rozstrzygające: tryb YOLO (`tools.exec.security: "full"` i `tools.exec.ask: "off"`) zazwyczaj uruchamia Claude z `--permission-mode bypassPermissions`, natomiast restrykcyjne zasady uruchamiają go z `--permission-mode default`. Gateway uruchamiany jako root również używa `default`, ponieważ Claude Code odrzuca tryb pomijania uprawnień dla użytkownika root; OpenClaw nadal odpowiada na żądania sterowania narzędziami stdio Claude zgodnie ze skonfigurowanymi zasadami wykonywania. Ustawienia `agents.list[].tools.exec` poszczególnych agentów zastępują globalne `tools.exec` dla danego agenta. Surowe argumenty backendu mogą nadal zawierać `--permission-mode`, ale aktywne uruchomienia Claude normalizują tę flagę zgodnie z obowiązującymi zasadami i ograniczeniami hosta.

Backend odwzorowuje również poziomy `/think` OpenClaw na natywną flagę `--effort` Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, natomiast `high`/`xhigh`/`max` są przekazywane bezpośrednio. Dzięki temu obsługiwane poziomy nakładu Fable 5 są takie same dla Claude CLI opartego na subskrypcji oraz ścieżek korzystających z klucza API. `adaptive` usuwa skonfigurowane flagi `--effort` i nie dostarcza zamiennika, dlatego Claude Code ustala obowiązujący nakład na podstawie własnego środowiska, ustawień i wartości domyślnych modelu. Inne backendy CLI wymagają, aby należący do nich Plugin zadeklarował równoważny mechanizm mapowania argv, zanim `/think` wpłynie na uruchamiane CLI.

Zanim OpenClaw będzie mógł użyć `claude-cli`, sam Claude Code musi być zalogowany na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalacje Docker wymagają zainstalowania i zalogowania Claude Code wewnątrz utrwalonego katalogu domowego kontenera, a nie tylko na hoście; zobacz [backend Claude CLI w Dockerze](/pl/install/docker#claude-cli-backend-in-docker).

Ustawienie `agents.defaults.cliBackends.claude-cli.command` jest potrzebne tylko wtedy, gdy plik binarny `claude` nie znajduje się jeszcze w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, należy ustawić `sessionArg` (np. `--session-id`) lub `sessionArgs` (symbol zastępczy `{sessionId}`), gdy identyfikator musi trafić do wielu flag.
- Jeśli CLI używa podpolecenia wznawiania z innymi flagami, należy ustawić `resumeArgs` (zastępuje `args` podczas wznawiania) oraz opcjonalnie `resumeOutput` dla wznowień innych niż JSON.
- `sessionMode`:
  - `always`: zawsze wysyła identyfikator sesji (nowy UUID, jeśli żaden nie jest zapisany).
  - `existing`: wysyła identyfikator sesji tylko wtedy, gdy został wcześniej zapisany.
  - `none`: nigdy nie wysyła identyfikatora sesji.
- `claude-cli` domyślnie przyjmuje wartości `liveSession: "claude-stdio"`, `output: "jsonl"` i `input: "stdin"`, dzięki czemu kolejne interakcje ponownie używają aktywnego procesu Claude, również w przypadku niestandardowych konfiguracji bez pól transportu. Jeśli Gateway zostanie ponownie uruchomiony lub bezczynny proces zakończy działanie, OpenClaw wznawia sesję na podstawie zapisanego identyfikatora sesji Claude. Przed wznowieniem zapisane identyfikatory sesji są weryfikowane względem możliwej do odczytu transkrypcji projektu; brak transkrypcji powoduje usunięcie powiązania (rejestrowane jako `reason=transcript-missing`) zamiast niejawnego uruchomienia nowej sesji pod `--resume`.
- Aktywne sesje Claude zachowują ograniczenia wyjścia JSONL: domyślnie 8 MiB i 20,000 surowych wierszy JSONL na interakcję. Można zwiększyć je dla poszczególnych backendów za pomocą `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` i `maxTurnLines`; OpenClaw ogranicza te ustawienia odpowiednio do 64 MiB i 100,000 wierszy.
- Zapisane sesje CLI zapewniają ciągłość będącą własnością dostawcy. Niejawny codzienny reset sesji ich nie przerywa; zasady `/reset` i jawne zasady `session.reset` nadal to robią.
- Nowe sesje CLI zwykle są ponownie inicjowane wyłącznie na podstawie podsumowania Compaction OpenClaw i fragmentu po Compaction. Aby odzyskać krótkie sesje unieważnione przed Compaction, backend może włączyć tę funkcję za pomocą `reseedFromRawTranscriptWhenUncompacted: true`. Ponowne inicjowanie na podstawie surowej transkrypcji pozostaje ograniczone i dotyczy tylko bezpiecznych unieważnień, takich jak brak transkrypcji CLI, osierocona końcówka użycia narzędzia, zmiany zasad wiadomości/promptu systemowego/cwd/MCP lub ponowienie po wygaśnięciu sesji; zmiany profilu uwierzytelniania ani epoki danych uwierzytelniających nigdy nie powodują ponownego inicjowania na podstawie surowej historii transkrypcji.

Serializacja: `serialize: true` zachowuje kolejność uruchomień w tej samej ścieżce (większość CLI serializuje operacje w jednej ścieżce dostawcy). OpenClaw rezygnuje również z ponownego użycia zapisanej sesji CLI, gdy zmieni się wybrana tożsamość uwierzytelniania, w tym identyfikator profilu uwierzytelniania, statyczny klucz API, statyczny token lub tożsamość konta OAuth, jeśli CLI ją udostępnia; sama rotacja tokenu dostępu/odświeżania OAuth nie przerywa sesji. Jeśli CLI nie ma stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować własne uprawnienia do wznawiania.

## Kontekst wstępny mechanizmu awaryjnego z sesji claude-cli

Gdy próba `claude-cli` przełącza się awaryjnie na kandydata innego niż CLI w ramach [`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw inicjuje następną próbę kontekstem wstępnym pobranym z lokalnej transkrypcji JSONL Claude Code (w `~/.claude/projects/`, indeksowanej według obszaru roboczego). Bez tej inicjalizacji dostawca awaryjny rozpoczyna bez kontekstu, ponieważ własna transkrypcja sesji OpenClaw jest pusta dla uruchomień `claude-cli`.

- Kontekst wstępny preferuje najnowsze podsumowanie `/compact` lub znacznik `compact_boundary`, a następnie dołącza najnowsze interakcje po granicy aż do osiągnięcia budżetu znaków. Interakcje sprzed granicy są pomijane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są scalane w zwięzłe wskazówki `(tool call: name)` i `(tool result: …)`, aby rzetelnie zachować budżet promptu; zbyt duże podsumowanie jest skracane i oznaczane etykietą `(truncated)`.
- Mechanizmy awaryjne tego samego dostawcy z `claude-cli` do `claude-cli` polegają na własnym `--resume` Claude i pomijają kontekst wstępny.
- Inicjalizacja ponownie wykorzystuje istniejącą walidację ścieżki pliku sesji Claude, dlatego nie można odczytywać dowolnych ścieżek.

## Obrazy

Jeśli CLI akceptuje ścieżki do obrazów, należy ustawić `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisuje obrazy base64 w plikach tymczasowych. Jeśli ustawiono `imageArg`, ścieżki te są przekazywane jako argumenty CLI; w przeciwnym razie OpenClaw dołącza ścieżki plików do promptu (wstrzykiwanie ścieżek), co działa w przypadku CLI automatycznie wczytujących pliki lokalne ze zwykłych ścieżek.

## Dane wejściowe i wyjściowe

- `output: "text"` (wartość domyślna) traktuje stdout jako ostateczną odpowiedź.
- `output: "json"` próbuje przeanalizować JSON i wyodrębnić tekst wraz z identyfikatorem sesji.
- `output: "jsonl"` analizuje strumień JSONL i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji, jeśli są dostępne.
- W przypadku danych wyjściowych JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response`, a dane użycia z `stats`, gdy `usage` brakuje lub jest puste. Domyślna konfiguracja dołączonego Gemini CLI używa `stream-json`; stare nadpisania `--output-format json` nadal korzystają z parsera JSON.

Tryby danych wejściowych:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez standardowe wejście.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, zamiast tego używane jest standardowe wejście.

## Ustawienia domyślne należące do Pluginu

Ustawienia domyślne backendu CLI są częścią powierzchni Pluginu:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- Wartość `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal zastępuje ustawienie domyślne Pluginu.
- Czyszczenie konfiguracji specyficznej dla backendu pozostaje w gestii Pluginu za pośrednictwem opcjonalnego hooka `normalizeConfig`.

Anthropic jest właścicielem `claude-cli`, a Google jest właścicielem `google-gemini-cli`. Uruchomienia agenta OpenAI Codex używają środowiska aplikacji serwerowej Codex za pośrednictwem `openai/*`; OpenClaw nie rejestruje już dołączonego backendu `codex-cli`.

Dołączony Plugin Anthropic rejestruje dla `claude-cli`:

| Klucz                 | Wartość                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

Dołączony Plugin Google rejestruje dla `google-gemini-cli`:

| Klucz                     | Wartość                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | tak samo, z `--resume {sessionId}`                                                    |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Wymaganie wstępne: lokalne Gemini CLI musi być zainstalowane i dostępne w `PATH` jako `gemini` (`brew install gemini-cli` lub `npm install -g @google/gemini-cli`).

Uwagi dotyczące danych wyjściowych Gemini CLI:

- Domyślny parser `stream-json` odczytuje zdarzenia asystenta `message`, zdarzenia narzędzi, końcowe użycie `result` oraz zdarzenia krytycznych błędów Gemini.
- Jeśli argumenty Gemini zostaną zastąpione wartością `--output-format json`, OpenClaw normalizuje ten backend z powrotem do `output: "json"` i odczytuje tekst odpowiedzi z pola JSON `response`.
- W przypadku braku lub pustej wartości `usage` użycie przyjmuje wartość zastępczą `stats`; `stats.cached` jest normalizowane do `cacheRead` OpenClaw, a jeśli brakuje `stats.input`, liczba tokenów wejściowych jest wyprowadzana z `stats.input_tokens - stats.cached`.

Ustawienia domyślne należy zastępować tylko w razie potrzeby (najczęściej bezwzględną ścieżką `command`).

## Nakładki przekształceń tekstu

Pluginy wymagające niewielkich warstw zgodności promptów lub wiadomości mogą deklarować dwukierunkowe przekształcenia tekstu bez zastępowania dostawcy ani backendu CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` przepisuje prompt systemowy i prompt użytkownika przekazywane do CLI. `output` przepisuje strumieniowany tekst asystenta i przeanalizowany tekst końcowy, zanim OpenClaw przetworzy własne znaczniki sterujące i dostarczy dane do kanału; w przypadku wywołań modeli obsługiwanych przez dostawcę przywraca również wartości tekstowe wewnątrz ustrukturyzowanych argumentów wywołań narzędzi po naprawie strumienia, a przed wykonaniem narzędzia. Surowe fragmenty JSON dostawcy pozostają niezmienione; konsumenci powinni używać ustrukturyzowanego ładunku częściowego, końcowego lub wynikowego.

W przypadku CLI emitujących zdarzenia JSONL specyficzne dla dostawcy należy ustawić `jsonlDialect` w konfiguracji tego backendu: `claude-stream-json` dla strumieni zgodnych z Claude Code, `gemini-stream-json` dla zdarzeń Gemini CLI `stream-json`.

## Własność natywnej Compaction

Niektóre backendy CLI uruchamiają agenta, który sam wykonuje Compaction własnej transkrypcji, dlatego OpenClaw nie może uruchamiać dla nich zabezpieczającego mechanizmu podsumowującego — powodowałoby to konflikt z własną Compaction backendu i mogłoby skutkować poważnym błędem tury.

`claude-cli` nie ma punktu końcowego środowiska (Claude Code wykonuje Compaction wewnętrznie), dlatego deklaruje `ownsNativeCompaction: true`, a ścieżka Compaction OpenClaw zwraca wpis sesji bez zmian. OpenClaw przekazuje efektywny budżet kontekstu uruchomienia przez udokumentowaną zmienną [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) Claude Code, utrzymując natywną automatyczną Compaction w zgodzie ze skonfigurowanymi limitami `contextTokens` Anthropic. Sesje korzystające z natywnego środowiska, takie jak Codex, są zamiast tego nadal kierowane do punktu końcowego Compaction swojego środowiska.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Wartość `ownsNativeCompaction` należy deklarować wyłącznie dla backendu, który rzeczywiście odpowiada za Compaction: musi niezawodnie ograniczać własną transkrypcję w pobliżu okna kontekstu i utrwalać sesję możliwą do wznowienia (np. `--resume` / `--session-id`), w przeciwnym razie odroczona sesja może nadal przekraczać budżet.

## Nakładki pakietu MCP

Backendy CLI nie otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może włączyć generowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`. Bieżące zachowanie dołączonych backendów:

- `claude-cli`: wygenerowany plik ścisłej konfiguracji MCP.
- `google-gemini-cli`: wygenerowany plik ustawień systemowych Gemini.

Gdy pakiet MCP jest włączony, OpenClaw:

- uruchamia lokalny serwer HTTP MCP udostępniający narzędzia Gateway procesowi CLI, uwierzytelniany przyznaniem kontekstu dla danego uruchomienia (`OPENCLAW_MCP_TOKEN`), aktywnym wyłącznie podczas bieżącej próby wykonania;
- wiąże dostęp do narzędzi z sesją, kontem i kontekstem kanału wybranymi przez Gateway, zamiast ufać nagłówkom procesu potomnego;
- wczytuje włączone serwery pakietu MCP dla bieżącego obszaru roboczego i scala je z istniejącą konfiguracją MCP lub strukturą ustawień backendu;
- przepisuje konfigurację uruchomienia przy użyciu trybu integracji należącego do Pluginu będącego właścicielem backendu.

Jeśli nie włączono żadnych serwerów MCP, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy backend włącza pakiet MCP, dzięki czemu uruchomienia w tle pozostają odizolowane.

Dołączone środowiska wykonawcze MCP o zakresie sesji są buforowane do ponownego użycia w ramach sesji, a następnie usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10 minut; aby wyłączyć, należy ustawić `0`). Jednorazowe osadzone uruchomienia, takie jak testy uwierzytelniania, generowanie identyfikatorów slug i przywoływanie Active Memory, żądają czyszczenia po zakończeniu uruchomienia, aby procesy potomne stdio oraz strumienie Streamable HTTP/SSE nie działały dłużej niż samo uruchomienie.

## Limit historii ponownego inicjowania

Gdy nowa sesja CLI jest inicjowana na podstawie wcześniejszej transkrypcji OpenClaw (na przykład po ponownej próbie `session_expired`), renderowany blok `<conversation_history>` jest ograniczany, aby zapobiec nadmiernemu rozrastaniu się promptów ponownego inicjowania. Wartość domyślna wynosi 12,288 znaków (około 3,000 tokenów).

Backendy Claude CLI skalują ten limit zgodnie z rozmiarem rozpoznanego okna kontekstu Claude: większe okna kontekstu otrzymują większy wycinek wcześniejszej historii, aż do stałej wartości maksymalnej; pozostałe backendy CLI zachowują konserwatywną wartość domyślną. Ten limit dotyczy wyłącznie bloku wcześniejszej historii w prompcie ponownego inicjowania — limity danych wyjściowych aktywnej sesji są dostrajane oddzielnie w `reliability.outputLimits` (zobacz [Sesje](#sessions)).

## Ograniczenia

- Brak bezpośrednich wywołań narzędzi OpenClaw: OpenClaw nie wstrzykuje wywołań narzędzi do protokołu backendu CLI. Backendy widzą narzędzia Gateway tylko wtedy, gdy włączą `bundleMcp: true`.
- Strumieniowanie zależy od backendu: niektóre backendy strumieniują JSONL, inne buforują dane do zakończenia procesu.
- Ustrukturyzowane dane wyjściowe zależą od formatu JSON obsługiwanego przez dane CLI.

## Rozwiązywanie problemów

| Objaw                    | Rozwiązanie                                                              |
| ------------------------ | ------------------------------------------------------------------------ |
| Nie znaleziono CLI       | Ustaw `command` na pełną ścieżkę.                                      |
| Nieprawidłowa nazwa modelu | Użyj `modelAliases`, aby odwzorować `provider/model` na identyfikator modelu CLI. |
| Brak ciągłości sesji     | Upewnij się, że ustawiono `sessionArg`, a `sessionMode` nie ma wartości `none`. |
| Obrazy są ignorowane     | Ustaw `imageArg` i sprawdź, czy CLI obsługuje ścieżki plików.            |

## Powiązane

- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
