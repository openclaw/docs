---
read_when:
    - Potrzebujesz niezawodnego rozwiązania awaryjnego na wypadek awarii dostawców API
    - Uruchamiasz lokalne interfejsy CLI AI i chcesz ponownie z nich korzystać
    - Chcesz zrozumieć most local loopback MCP zapewniający backendowi CLI dostęp do narzędzi
summary: 'Backendy CLI: lokalny mechanizm rezerwowy CLI AI z opcjonalnym mostem narzędzi MCP'
title: Backendy CLI
x-i18n:
    generated_at: "2026-07-12T15:06:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw może uruchamiać lokalny interfejs CLI AI jako tekstowy mechanizm awaryjny, gdy dostawcy API są niedostępni, ograniczają częstotliwość żądań lub działają nieprawidłowo. To rozwiązanie jest celowo zachowawcze:

- Narzędzia OpenClaw nie są wstrzykiwane bezpośrednio, ale backend z ustawieniem `bundleMcp: true` może otrzymywać narzędzia Gateway przez most MCP korzystający z local loopback.
- Strumieniowanie JSONL dla interfejsów CLI, które je obsługują.
- Obsługa sesji zapewnia spójność kolejnych tur.
- Obrazy są przekazywane, jeśli CLI akceptuje ścieżki do obrazów.

Używaj tego rozwiązania jako zabezpieczenia zapewniającego „zawsze działające” odpowiedzi tekstowe, a nie jako podstawowej ścieżki. Jeśli potrzebujesz pełnego środowiska wykonawczego z kontrolą sesji ACP, zadaniami w tle, powiązaniem wątku/konwersacji i trwałymi zewnętrznymi sesjami programistycznymi, użyj zamiast tego [agentów ACP](/pl/tools/acp-agents); backendy CLI nie są ACP.

<Tip>
  Tworzysz nowy Plugin backendu? Zobacz [Pluginy backendów CLI](/pl/plugins/cli-backend-plugins). Ta strona opisuje konfigurowanie i obsługę już zarejestrowanego backendu.
</Tip>

## Szybki start

Dołączony Plugin Anthropic rejestruje domyślny backend `claude-cli`, więc działa on bez dodatkowej konfiguracji, o ile Claude Code jest zainstalowany i zalogowany:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` jest domyślnym identyfikatorem agenta, gdy nie skonfigurowano jawnej listy agentów; w przeciwnym razie zastąp go identyfikatorem własnego agenta.

Jeśli Gateway działa pod kontrolą launchd/systemd z minimalną wartością `PATH`, wskaż plik wykonywalny bezpośrednio:

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

Jeśli używasz dołączonego backendu CLI jako głównego dostawcy wiadomości na hoście Gateway, OpenClaw automatycznie ładuje dołączony Plugin będący jego właścicielem, gdy konfiguracja odwołuje się do tego backendu w referencji modelu lub w `agents.defaults.cliBackends`.

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

Jeśli używasz `agents.defaults.models` jako listy dozwolonych elementów, uwzględnij tam również modele backendu CLI. Gdy główny dostawca zawiedzie z powodu uwierzytelniania, limitów częstotliwości lub przekroczenia limitu czasu, OpenClaw spróbuje następnie użyć backendu CLI.

## Konfiguracja

Wszystkie backendy CLI znajdują się w `agents.defaults.cliBackends` i są indeksowane według identyfikatora dostawcy (np. `claude-cli`, `my-cli`). Identyfikator dostawcy staje się lewą stroną referencji modelu: `<provider>/<model>`.

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
          // Zamiast tego flaga nadpisania konfiguracji w stylu Codex:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Włącz tylko wtedy, gdy ten backend może ponownie zainicjować
          // unieważnione sesje na podstawie ograniczonej, surowej historii
          // transkrypcji OpenClaw sprzed Compaction.
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
2. Tworzy prompt systemowy, używając tego samego promptu OpenClaw i kontekstu obszaru roboczego.
3. Uruchamia CLI z identyfikatorem sesji (jeśli jest obsługiwany), aby zachować spójność historii. Dołączony backend `claude-cli` utrzymuje aktywny proces stdio Claude dla każdej sesji OpenClaw i wysyła kolejne tury przez standardowe wejście stream-json.
4. Analizuje dane wyjściowe (JSON lub zwykły tekst) i zwraca końcowy tekst.
5. Utrwala identyfikatory sesji dla poszczególnych backendów, aby kolejne tury ponownie używały tej samej sesji CLI.

### Szczegóły dotyczące Claude CLI

Dołączony backend `claude-cli` preferuje natywny mechanizm rozpoznawania umiejętności Claude Code. Gdy bieżąca migawka umiejętności zawiera co najmniej jedną wybraną umiejętność ze zmaterializowaną ścieżką, OpenClaw przekazuje tymczasowy Plugin Claude Code przez `--plugin-dir` i pomija powielony katalog umiejętności OpenClaw w dołączanym prompcie systemowym. Jeśli nie ma zmaterializowanej umiejętności Pluginu, OpenClaw zachowuje katalog w prompcie jako mechanizm awaryjny. Nadpisania zmiennych środowiskowych i kluczy API dla umiejętności nadal mają zastosowanie do środowiska procesu potomnego podczas danego uruchomienia.

Claude CLI ma własny nieinteraktywny tryb uprawnień; OpenClaw odwzorowuje go na istniejące zasady wykonywania zamiast dodawać konfigurację specyficzną dla Claude. W przypadku zarządzanych przez OpenClaw aktywnych sesji Claude obowiązujące zasady wykonywania są rozstrzygające: tryb YOLO (`tools.exec.security: "full"` oraz `tools.exec.ask: "off"`) uruchamia Claude z `--permission-mode bypassPermissions`, natomiast restrykcyjne zasady uruchamiają go z `--permission-mode default`. Ustawienia `agents.list[].tools.exec` poszczególnych agentów zastępują globalne `tools.exec` dla danego agenta. Surowe argumenty backendu mogą nadal zawierać `--permission-mode`, ale aktywne uruchomienia Claude normalizują tę flagę zgodnie z obowiązującymi zasadami.

Backend odwzorowuje również poziomy `/think` OpenClaw na natywną flagę `--effort` Claude Code: `minimal`/`low` -> `low`, `medium` -> `medium`, a `high`/`xhigh`/`max` są przekazywane bez zmian. `adaptive` usuwa skonfigurowane flagi `--effort` i nie podaje zamiennika, dzięki czemu Claude Code ustala obowiązujący poziom wysiłku na podstawie własnego środowiska, ustawień i wartości domyślnych modelu. Aby `/think` wpływało na uruchamiany CLI w innych backendach CLI, ich Plugin będący właścicielem musi zadeklarować równoważny mechanizm mapowania argumentów.

Zanim OpenClaw będzie mógł użyć `claude-cli`, sam Claude Code musi być zalogowany na tym samym hoście:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Instalacje Docker wymagają, aby Claude Code był zainstalowany i zalogowany w utrwalanym katalogu domowym kontenera, a nie tylko na hoście; zobacz [backend Claude CLI w Dockerze](/pl/install/docker#claude-cli-backend-in-docker).

Ustaw `agents.defaults.cliBackends.claude-cli.command` tylko wtedy, gdy plik wykonywalny `claude` nie znajduje się już w `PATH`.

## Sesje

- Jeśli CLI obsługuje sesje, ustaw `sessionArg` (np. `--session-id`) lub `sessionArgs` (symbol zastępczy `{sessionId}`), gdy identyfikator musi trafić do wielu flag.
- Jeśli CLI używa podpolecenia wznawiania z innymi flagami, ustaw `resumeArgs` (zastępuje `args` podczas wznawiania) i opcjonalnie `resumeOutput` dla wznowień innych niż JSON.
- `sessionMode`:
  - `always`: zawsze wysyłaj identyfikator sesji (nowy UUID, jeśli żaden nie jest przechowywany).
  - `existing`: wysyłaj identyfikator sesji tylko wtedy, gdy został wcześniej zapisany.
  - `none`: nigdy nie wysyłaj identyfikatora sesji.
- `claude-cli` domyślnie używa `liveSession: "claude-stdio"`, `output: "jsonl"` oraz `input: "stdin"`, dzięki czemu kolejne tury ponownie używają aktywnego procesu Claude, również w niestandardowych konfiguracjach pomijających pola transportu. Jeśli Gateway zostanie ponownie uruchomiony lub bezczynny proces zakończy działanie, OpenClaw wznowi pracę na podstawie zapisanego identyfikatora sesji Claude. Przed wznowieniem zapisane identyfikatory sesji są weryfikowane względem możliwej do odczytania transkrypcji projektu; brak transkrypcji usuwa powiązanie (rejestrowane jako `reason=transcript-missing`), zamiast niejawnie uruchamiać nową sesję z `--resume`.
- Aktywne sesje Claude zachowują ograniczenia ochronne danych wyjściowych JSONL: domyślnie 8 MiB i 20 000 surowych wierszy JSONL na turę. Można je zwiększyć dla poszczególnych backendów za pomocą `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` oraz `maxTurnLines`; OpenClaw ogranicza te ustawienia odpowiednio do 64 MiB i 100 000 wierszy.
- Zapisane sesje CLI stanowią ciągłość należącą do dostawcy. Niejawne codzienne resetowanie sesji ich nie przerywa; `/reset` i jawne zasady `session.reset` nadal to robią.
- Nowe sesje CLI są zwykle ponownie inicjowane wyłącznie na podstawie podsumowania Compaction OpenClaw oraz fragmentu po Compaction. Aby odzyskać krótkie sesje unieważnione przed Compaction, backend może włączyć `reseedFromRawTranscriptWhenUncompacted: true`. Ponowne inicjowanie z surowej transkrypcji pozostaje ograniczone i jest dozwolone wyłącznie w przypadku bezpiecznych unieważnień, takich jak brak transkrypcji CLI, osierocony końcowy fragment użycia narzędzia, zmiany zasad wiadomości/promptu systemowego/katalogu roboczego/MCP lub ponowna próba po wygaśnięciu sesji; zmiany profilu uwierzytelniania lub epoki poświadczeń nigdy nie powodują ponownego inicjowania z surowej historii transkrypcji.

Serializacja: `serialize: true` zachowuje kolejność uruchomień w tej samej ścieżce (większość interfejsów CLI serializuje zadania w jednej ścieżce dostawcy). OpenClaw przestaje również ponownie używać zapisanej sesji CLI, gdy zmieni się wybrana tożsamość uwierzytelniania, w tym identyfikator profilu uwierzytelniania, statyczny klucz API, statyczny token lub tożsamość konta OAuth, jeśli CLI ją udostępnia; sama rotacja tokenu dostępu lub odświeżania OAuth nie przerywa sesji. Jeśli CLI nie ma stabilnego identyfikatora konta OAuth, OpenClaw pozwala temu CLI egzekwować własne uprawnienia do wznawiania.

## Kontekst wstępny mechanizmu awaryjnego z sesji claude-cli

Gdy próba `claude-cli` przełącza się po niepowodzeniu na kandydata niebędącego CLI z [`agents.defaults.model.fallbacks`](/pl/concepts/model-failover), OpenClaw inicjuje kolejną próbę kontekstem wstępnym pobranym z lokalnej transkrypcji JSONL Claude Code (w `~/.claude/projects/`, indeksowanej według obszaru roboczego). Bez tego materiału inicjującego dostawca awaryjny zaczyna bez kontekstu, ponieważ własna transkrypcja sesji OpenClaw jest pusta dla uruchomień `claude-cli`.

- Kontekst wstępny preferuje najnowsze podsumowanie `/compact` lub znacznik `compact_boundary`, a następnie dołącza najnowsze tury po granicy aż do osiągnięcia budżetu znaków. Tury sprzed granicy są pomijane, ponieważ podsumowanie już je reprezentuje.
- Bloki narzędzi są scalane do zwięzłych wskazówek `(wywołanie narzędzia: nazwa)` i `(wynik narzędzia: …)`, aby zachować rzeczywisty budżet promptu; zbyt duże podsumowanie jest skracane i oznaczane jako `(skrócono)`.
- Mechanizmy awaryjne tego samego dostawcy, przełączające się z `claude-cli` na `claude-cli`, korzystają z własnego `--resume` Claude i pomijają kontekst wstępny.
- Materiał inicjujący ponownie wykorzystuje istniejącą walidację ścieżki do pliku sesji Claude, dlatego nie można odczytywać dowolnych ścieżek.

## Obrazy

Jeśli CLI akceptuje ścieżki do obrazów, ustaw `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw zapisuje obrazy base64 w plikach tymczasowych. Jeśli ustawiono `imageArg`, ścieżki te są przekazywane jako argumenty CLI; w przeciwnym razie OpenClaw dołącza ścieżki plików do promptu (wstrzykiwanie ścieżek), co działa w interfejsach CLI automatycznie wczytujących pliki lokalne ze zwykłych ścieżek.

## Dane wejściowe i wyjściowe

- `output: "text"` (domyślnie) traktuje standardowe wyjście jako odpowiedź końcową.
- `output: "json"` próbuje przeanalizować JSON oraz wyodrębnić tekst i identyfikator sesji.
- `output: "jsonl"` analizuje strumień JSONL i wyodrębnia końcową wiadomość agenta oraz identyfikatory sesji, jeśli są obecne.
- W przypadku danych wyjściowych JSON Gemini CLI OpenClaw odczytuje tekst odpowiedzi z `response`, a dane o użyciu ze `stats`, gdy `usage` jest nieobecne lub puste. Dołączona domyślna konfiguracja Gemini CLI używa `stream-json`; stare nadpisania `--output-format json` nadal używają parsera JSON.

Tryby wejściowe:

- `input: "arg"` (domyślnie) przekazuje prompt jako ostatni argument CLI.
- `input: "stdin"` wysyła prompt przez standardowe wejście.
- Jeśli prompt jest bardzo długi i ustawiono `maxPromptArgChars`, zamiast argumentu używane jest standardowe wejście.

## Wartości domyślne należące do Pluginu

Domyślne ustawienia backendu CLI są częścią interfejsu Pluginu:

- Pluginy rejestrują je za pomocą `api.registerCliBackend(...)`.
- `id` backendu staje się prefiksem dostawcy w referencjach modeli.
- Konfiguracja użytkownika w `agents.defaults.cliBackends.<id>` nadal zastępuje wartość domyślną Pluginu.
- Porządkowanie konfiguracji specyficznej dla backendu pozostaje własnością Pluginu za pośrednictwem opcjonalnego punktu zaczepienia `normalizeConfig`.

Anthropic jest właścicielem `claude-cli`, a Google właścicielem `google-gemini-cli`. Uruchomienia agenta OpenAI Codex korzystają ze środowiska app-server Codex przez `openai/*`; OpenClaw nie rejestruje już dołączonego backendu `codex-cli`.

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

Dołączony Plugin Google rejestruje się dla `google-gemini-cli`:

| Klucz                     | Wartość                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | tak samo, z `--resume {sessionId}`                                                     |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Wymaganie wstępne: lokalny Gemini CLI musi być zainstalowany i dostępny w `PATH` jako `gemini` (`brew install gemini-cli` lub `npm install -g @google/gemini-cli`).

Uwagi dotyczące danych wyjściowych Gemini CLI:

- Domyślny parser `stream-json` odczytuje zdarzenia `message` asystenta, zdarzenia narzędzi, końcowe użycie z `result` oraz krytyczne zdarzenia błędów Gemini.
- Jeśli argumenty Gemini zostaną zastąpione przez `--output-format json`, OpenClaw normalizuje ten backend z powrotem do `output: "json"` i odczytuje tekst odpowiedzi z pola JSON `response`.
- Gdy `usage` jest nieobecne lub puste, dane o użyciu są pobierane z `stats`; `stats.cached` jest normalizowane do `cacheRead` OpenClaw, a jeśli brakuje `stats.input`, liczba tokenów wejściowych jest wyliczana jako `stats.input_tokens - stats.cached`.

Zmieniaj wartości domyślne tylko w razie potrzeby (najczęściej jest to bezwzględna ścieżka `command`).

## Nakładki przekształcające tekst

Pluginy wymagające niewielkich warstw zgodności dla promptów lub wiadomości mogą deklarować dwukierunkowe przekształcenia tekstu bez zastępowania dostawcy ani backendu CLI:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` przekształca prompt systemowy i prompt użytkownika przekazywane do CLI. `output` przekształca strumieniowany tekst asystenta oraz przeanalizowany tekst końcowy, zanim OpenClaw obsłuży własne znaczniki sterujące i dostarczenie do kanału; w przypadku wywołań modeli opartych na dostawcy przywraca również wartości tekstowe w ustrukturyzowanych argumentach wywołań narzędzi po naprawie strumienia, a przed wykonaniem narzędzia. Surowe fragmenty JSON dostawcy pozostają niezmienione; odbiorcy powinni używać ustrukturyzowanego ładunku częściowego, końcowego lub wynikowego.

W przypadku CLI generujących zdarzenia JSONL specyficzne dla dostawcy ustaw `jsonlDialect` w konfiguracji tego backendu: `claude-stream-json` dla strumieni zgodnych z Claude Code oraz `gemini-stream-json` dla zdarzeń `stream-json` Gemini CLI.

## Własność natywnej Compaction

Niektóre backendy CLI uruchamiają agenta, który sam wykonuje Compaction swojej transkrypcji, dlatego OpenClaw nie może uruchamiać dla nich zabezpieczającego mechanizmu podsumowywania — powodowałoby to konflikt z Compaction wykonywaną przez backend i mogłoby doprowadzić do całkowitego niepowodzenia tury.

`claude-cli` nie ma punktu końcowego mechanizmu wykonawczego (Claude Code wykonuje Compaction wewnętrznie), dlatego deklaruje `ownsNativeCompaction: true`, a ścieżka Compaction OpenClaw zwraca wpis sesji bez zmian. Sesje z natywnym mechanizmem wykonawczym, takie jak Codex, nadal są kierowane do jego punktu końcowego Compaction.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Deklaruj `ownsNativeCompaction` tylko dla backendu, który rzeczywiście odpowiada za Compaction: musi on niezawodnie ograniczać własną transkrypcję w pobliżu okna kontekstu i utrwalać sesję możliwą do wznowienia (np. `--resume` / `--session-id`), w przeciwnym razie odroczona sesja może nadal przekraczać budżet.

## Nakładki pakietu MCP

Backendy CLI nie otrzymują bezpośrednio wywołań narzędzi OpenClaw, ale backend może włączyć generowaną nakładkę konfiguracji MCP za pomocą `bundleMcp: true`. Obecne zachowanie dołączonych backendów:

- `claude-cli`: generowany plik ścisłej konfiguracji MCP.
- `google-gemini-cli`: generowany plik ustawień systemowych Gemini.

Gdy pakiet MCP jest włączony, OpenClaw:

- uruchamia serwer HTTP MCP w trybie local loopback, który udostępnia narzędzia Gateway procesowi CLI i jest uwierzytelniany za pomocą przyznanego kontekstu dla danego uruchomienia (`OPENCLAW_MCP_TOKEN`), aktywnego tylko podczas bieżącej próby wykonania;
- wiąże dostęp do narzędzi z sesją, kontem i kontekstem kanału wybranymi przez Gateway, zamiast ufać nagłówkom procesu potomnego;
- wczytuje włączone serwery pakietu MCP dla bieżącego obszaru roboczego i scala je z istniejącą konfiguracją MCP lub strukturą ustawień backendu;
- przekształca konfigurację uruchomieniową przy użyciu trybu integracji należącego do Pluginu będącego właścicielem.

Jeśli nie włączono żadnych serwerów MCP, OpenClaw nadal wstrzykuje ścisłą konfigurację, gdy backend korzysta z pakietu MCP, dzięki czemu uruchomienia w tle pozostają odizolowane.

Dołączone środowiska uruchomieniowe MCP o zakresie sesji są buforowane do ponownego użycia w ramach sesji, a następnie usuwane po `mcp.sessionIdleTtlMs` milisekundach bezczynności (domyślnie 10 minut; ustaw `0`, aby wyłączyć). Jednorazowe uruchomienia osadzone, takie jak sondy uwierzytelniania, generowanie identyfikatorów tekstowych i odtwarzanie Active Memory, żądają oczyszczenia po zakończeniu uruchomienia, aby procesy potomne stdio oraz strumienie Streamable HTTP/SSE nie pozostawały aktywne po jego zakończeniu.

## Limit historii ponownego inicjowania

Gdy nowa sesja CLI jest inicjowana na podstawie wcześniejszej transkrypcji OpenClaw (na przykład po ponowieniu wskutek `session_expired`), renderowany blok `<conversation_history>` jest ograniczany, aby zapobiec nadmiernemu rozrostowi promptów ponownego inicjowania. Domyślny limit wynosi 12 288 znaków (około 3000 tokenów).

Backendy Claude CLI skalują ten limit zgodnie z ustalonym oknem kontekstu Claude: większe okna kontekstu otrzymują większy wycinek wcześniejszej historii, aż do stałego maksymalnego limitu; pozostałe backendy CLI zachowują konserwatywną wartość domyślną. Limit ten dotyczy wyłącznie bloku wcześniejszej historii w prompcie ponownego inicjowania — limity danych wyjściowych aktywnej sesji są konfigurowane oddzielnie w `reliability.outputLimits` (zobacz [Sesje](#sessions)).

## Ograniczenia

- Brak bezpośrednich wywołań narzędzi OpenClaw: OpenClaw nie wstrzykuje wywołań narzędzi do protokołu backendu CLI. Backendy widzą narzędzia Gateway tylko wtedy, gdy włączą `bundleMcp: true`.
- Strumieniowanie zależy od backendu: niektóre backendy strumieniują JSONL, a inne buforują dane aż do zakończenia.
- Ustrukturyzowane dane wyjściowe zależą od własnego formatu JSON danego CLI.

## Rozwiązywanie problemów

| Objaw                     | Rozwiązanie                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------ |
| Nie znaleziono CLI        | Ustaw `command` na pełną ścieżkę.                                                    |
| Nieprawidłowa nazwa modelu | Użyj `modelAliases`, aby odwzorować `provider/model` na identyfikator modelu w CLI. |
| Brak ciągłości sesji      | Upewnij się, że ustawiono `sessionArg`, a `sessionMode` nie ma wartości `none`.       |
| Obrazy są ignorowane      | Ustaw `imageArg` i sprawdź, czy CLI obsługuje ścieżki plików.                        |

## Powiązane materiały

- [Podręcznik operacyjny Gateway](/pl/gateway)
- [Modele lokalne](/pl/gateway/local-models)
