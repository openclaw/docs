---
read_when:
    - Potrzebujesz deterministycznych, wieloetapowych przepływów pracy z jawnymi zatwierdzeniami
    - Musisz wznowić przepływ pracy bez ponownego wykonywania wcześniejszych kroków
summary: Typowane środowisko wykonawcze przepływów pracy dla OpenClaw ze wznawialnymi bramkami zatwierdzania.
title: Homar
x-i18n:
    generated_at: "2026-07-12T15:40:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster uruchamia wieloetapowe potoki narzędzi jako jedno deterministyczne wywołanie narzędzia, z
jawnymi punktami zatwierdzania i tokenami wznawiania. Działa warstwę ponad
odłączonymi zadaniami w tle: informacje o koordynowaniu przepływów obejmujących wiele odłączonych zadań
znajdziesz w sekcji [TaskFlow](/pl/automation/taskflow) (`openclaw tasks flow`); informacje o rejestrze
aktywności zadań znajdziesz w sekcji [Zadania w tle](/pl/automation/tasks).

## Dlaczego

Bez Lobster wieloetapowe zadanie wymaga wielu wywołań narzędzi w obie strony, a
model koordynuje każdy krok. Lobster przenosi tę koordynację do typowanego
środowiska wykonawczego:

- **Jedno wywołanie zamiast wielu**: pojedyncze wywołanie narzędzia Lobster zwraca ustrukturyzowany
  wynik całego potoku.
- **Wbudowane zatwierdzanie**: skutki uboczne (wysyłanie, publikowanie, usuwanie) zatrzymują przepływ pracy
  do czasu jawnego zatwierdzenia.
- **Możliwość wznowienia**: zatrzymany przepływ pracy zwraca token; można go zatwierdzić i wznowić bez
  ponownego wykonywania wcześniejszych kroków.

Lobster to mały, ograniczony język DSL, a nie język skryptowy ogólnego przeznaczenia:
zatwierdzanie/wznawianie jest trwałym, wbudowanym mechanizmem podstawowym; potoki są danymi (łatwymi do
rejestrowania, porównywania, ponownego odtwarzania i przeglądania); niewielka gramatyka ogranicza „kreatywne” ścieżki kodu, dzięki czemu
walidacja pozostaje realistyczna; limity czasu, limity danych wyjściowych, kontrole piaskownicy i
listy dozwolonych elementów są wymuszane przez środowisko wykonawcze, a nie przez poszczególne skrypty. Każdy krok nadal może
wywoływać dowolne CLI lub skrypt — jeśli potrzebujesz bogatszego języka tworzenia przepływów, generuj pliki `.lobster`
za pomocą innych narzędzi.

Bez Lobster cykliczna selekcja poczty e-mail wygląda tak:

```text
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Z Lobster to samo zadanie jest jednym wywołaniem, które zatrzymuje się w celu zatwierdzenia, a następnie jest wznawiane:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Jak to działa

OpenClaw uruchamia przepływy pracy Lobster **wewnątrz procesu**, używając dołączonego
pakietu `@clawdbot/lobster` jako osadzonego modułu wykonawczego. Nie jest uruchamiany żaden zewnętrzny podproces `lobster`;
wywołanie narzędzia zwraca bezpośrednio obwiednię JSON. Jeśli
potok zatrzyma się w celu zatwierdzenia, obwiednia zawiera token wznowienia (lub krótki
identyfikator zatwierdzenia), dzięki czemu można kontynuować później.

## Włączanie

Lobster jest **opcjonalnym** narzędziem Pluginu, domyślnie niewłączonym. Jest dostarczany
w pakiecie, więc nie wymaga osobnej instalacji — wystarczy zezwolić na użycie narzędzia:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Lub dla poszczególnych agentów:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

<Note>
`alsoAllow` dodaje `lobster` do aktywnego profilu narzędzi bez
ograniczania innych podstawowych narzędzi. Używaj `tools.allow` tylko wtedy, gdy zamiast tego chcesz zastosować restrykcyjny
tryb listy dozwolonych elementów.
</Note>

Narzędzie jest całkowicie wyłączone w kontekstach narzędzi działających w piaskownicy.

Jeśli potrzebujesz samodzielnego CLI Lobster do programowania lub zewnętrznych potoków
(poza osadzonym modułem wykonawczym Gateway), zainstaluj je z
[repozytorium Lobster](https://github.com/openclaw/lobster) i dodaj `lobster` do
`PATH`.

## Wzorzec: małe CLI + potoki JSON + zatwierdzanie

Twórz małe polecenia komunikujące się za pomocą JSON, a następnie łącz je w jedno wywołanie Lobster.
(Poniższe nazwy poleceń są przykładowe — zastąp je własnymi).

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Jeśli potok zażąda zatwierdzenia, wznów go przy użyciu tokenu:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Przykład: mapowanie elementów wejściowych na wywołania narzędzi:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Kroki LLM używające wyłącznie JSON (`llm-task`)

Aby wykonać **ustrukturyzowany krok LLM** wewnątrz przepływu pracy, włącz opcjonalne
narzędzie Pluginu `llm-task` i wywołaj je z Lobster:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### Ważne ograniczenie: osadzony Lobster a `openclaw.invoke`

Dołączony Plugin Lobster uruchamia przepływy pracy **wewnątrz procesu** Gateway.
W tym osadzonym trybie `openclaw.invoke` **nie** dziedziczy automatycznie
adresu URL Gateway ani kontekstu uwierzytelniania dla zagnieżdżonych wywołań narzędzi CLI OpenClaw.

Oznacza to, że ten wzorzec **nie jest obecnie niezawodny w osadzonym module wykonawczym**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Poniższego przykładu używaj tylko podczas uruchamiania **samodzielnego CLI Lobster** w
środowisku, w którym `openclaw.invoke` jest już skonfigurowane z prawidłowym
adresem Gateway i kontekstem uwierzytelniania.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Jeśli obecnie używasz osadzonego Pluginu Lobster, wybierz jedną z następujących opcji:

- bezpośrednie wywołanie narzędzia `llm-task` poza Lobster lub
- kroki inne niż `openclaw.invoke` wewnątrz potoku Lobster, dopóki nie zostanie dodany obsługiwany
  most osadzony.

Szczegółowe informacje i opcje konfiguracji znajdziesz w sekcji [Zadanie LLM](/pl/tools/llm-task).

## Pliki przepływów pracy (`.lobster`)

Lobster może uruchamiać pliki przepływów pracy YAML/JSON z polami `name`, `args`, `steps`, `env`,
`condition` i `approval`. W wywołaniu narzędzia ustaw `pipeline` na ścieżkę pliku.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Uwagi:

- `stdin: $step.stdout` i `stdin: $step.json` przekazują dane wyjściowe wcześniejszego kroku.
- `condition` (lub `when`) może uzależniać wykonanie kroków od `$step.approved`.

## Parametry narzędzia

### `run`

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Uruchom plik przepływu pracy z argumentami:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Pole             | Wartość domyślna | Uwagi                                                                                                                   |
| ---------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | wymagane         | Wbudowany ciąg potoku lub ścieżka kończąca się na `.lobster`/`.yaml`/`.yml`/`.json`, wskazująca plik przepływu pracy.    |
| `cwd`            | katalog roboczy Gateway | Względny katalog roboczy; musi wskazywać lokalizację wewnątrz katalogu roboczego Gateway (ścieżki bezwzględne są odrzucane). |
| `timeoutMs`      | `20000`          | Przerywa wykonanie po przekroczeniu limitu.                                                                             |
| `maxStdoutBytes` | `512000`         | Przerywa wykonanie, jeśli przechwycone dane stdout lub stderr przekroczą ten rozmiar.                                    |
| `argsJson`       | -                | Ciąg JSON z argumentami pliku przepływu pracy (ignorowany w przypadku potoków wbudowanych).                              |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume` przyjmuje `token` (pełny token wznowienia z `requiresApproval`)
albo `approvalId` (krótki identyfikator z tego samego obiektu) — użyj wartości zwróconej przez zatrzymane
wykonanie. Parametr `approve` jest wymagany.

### Tryb zarządzanego TaskFlow

Przekazanie `flowControllerId` i `flowGoal` do `run` (albo `flowId` i
`flowExpectedRevision` do `resume`) kieruje wywołanie przez zarządzany interfejs API
[TaskFlow](/pl/automation/taskflow) środowiska wykonawczego Pluginu zamiast zwracać
samą obwiednię: OpenClaw tworzy lub wznawia trwały rekord przepływu, stosuje do niego
obwiednię Lobster (`waiting` podczas oczekiwania na zatwierdzenie, `succeeded`/`failed` po
zakończeniu) i zwraca `{ ok, envelope, flow, mutation }`. Ten tryb wymaga
powiązanego środowiska wykonawczego TaskFlow i jest przeznaczony dla kodu Pluginu lub kontrolera, który potrzebuje
trwałego stanu przepływu między ponownymi uruchomieniami Gateway, a nie do typowego doraźnego użycia przez agenta.

## Obwiednia wyjściowa

Lobster zwraca obwiednię JSON z jednym z trzech stanów:

- `ok` — zakończono pomyślnie
- `needs_approval` — wstrzymano; `requiresApproval` zawiera `resumeToken` oraz krótki
  `approvalId`, a każdy z nich może posłużyć do wznowienia wykonania
- `cancelled` — jawnie odrzucono lub anulowano

Narzędzie udostępnia obwiednię zarówno w `content` (sformatowany JSON), jak i `details`
(surowy obiekt).

## Zatwierdzanie

Jeśli występuje `requiresApproval`, zapoznaj się z komunikatem i zdecyduj:

- `approve: true` — wznów i kontynuuj wykonywanie skutków ubocznych
- `approve: false` — anuluj i zakończ przepływ pracy

Użyj `approve --preview-from-stdin --limit N`, aby dołączyć podgląd JSON do
żądań zatwierdzenia bez niestandardowego łączenia za pomocą jq/heredoc. Stan wznowienia jest przechowywany jako
małe pliki JSON w katalogu stanu Lobster (domyślnie `~/.lobster/state`,
można go zmienić za pomocą `LOBSTER_STATE_DIR`); sam token koduje tylko
wskaźnik do tego stanu, a nie pełny stan potoku.

## OpenProse

OpenProse dobrze współpracuje z Lobster: użyj `/prose`, aby koordynować przygotowanie
przez wielu agentów, a następnie uruchom potok Lobster w celu deterministycznego zatwierdzania. Jeśli program Prose
potrzebuje Lobster, zezwól podagentom na użycie narzędzia `lobster` za pomocą
`tools.subagents.tools`. Zobacz [OpenProse](/pl/prose).

## Bezpieczeństwo

- **Tylko lokalnie, wewnątrz procesu** — przepływy pracy są wykonywane wewnątrz procesu Gateway; sam Plugin nie wykonuje
  wywołań sieciowych.
- **Bez sekretów** — Lobster nie zarządza OAuth; wywołuje narzędzia OpenClaw, które
  się tym zajmują.
- **Uwzględnianie piaskownicy** — narzędzie jest wyłączone, gdy jego kontekst działa w piaskownicy.
- **Wzmocnione zabezpieczenia** — limity czasu i danych wyjściowych są wymuszane przez osadzony moduł wykonawczy.

## Rozwiązywanie problemów

| Błąd                                                          | Przyczyna / rozwiązanie                                                                  |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | Potok przekroczył `timeoutMs`. Zwiększ tę wartość lub podziel potok.                      |
| `lobster stdout exceeded maxStdoutBytes` (lub `stderr`)        | Przechwycone dane wyjściowe przekroczyły limit. Zwiększ `maxStdoutBytes` lub ogranicz dane wyjściowe. |
| `run --args-json must be valid JSON`                          | Nie udało się przeanalizować `argsJson` (w przypadku uruchomień pliku przepływu pracy). Popraw ciąg JSON. |
| `lobster runtime failed` (lub inny komunikat `runtime_error`) | Osadzone środowisko wykonawcze zwróciło obwiednię błędu. Szczegóły znajdziesz w dziennikach Gateway. |

## Więcej informacji

- [Pluginy](/pl/tools/plugin)
- [Tworzenie narzędzi Pluginu](/pl/plugins/building-plugins#registering-agent-tools)

## Studium przypadku: przepływy pracy społeczności

Jeden z publicznych przykładów: CLI „drugiego mózgu” oraz potoki Lobster, które zarządzają trzema
magazynami Markdown (osobistym, partnera i współdzielonym). CLI generuje dane JSON ze statystykami,
listami skrzynek odbiorczych i skanami nieaktualnych elementów; Lobster łączy te polecenia w przepływy pracy,
takie jak `weekly-review`, `inbox-triage`, `memory-consolidation` i
`shared-task-sync`, każdy z bramkami zatwierdzania. AI dokonuje oceny
(kategoryzacji), gdy jest dostępna, a gdy nie jest — korzysta z deterministycznych reguł
zastępczych.

- Wątek: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repozytorium: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Powiązane

- [Automatyzacja](/pl/automation) — wszystkie mechanizmy automatyzacji
- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
