---
read_when:
    - Potrzebujesz deterministycznych, wieloetapowych przepływów pracy z jawnymi zatwierdzeniami
    - Musisz wznowić przepływ pracy bez ponownego uruchamiania wcześniejszych kroków
summary: Typowane środowisko wykonawcze przepływów pracy dla OpenClaw z wznawialnymi bramkami zatwierdzania.
title: Homar
x-i18n:
    generated_at: "2026-05-04T02:26:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster to powłoka przepływów pracy, która pozwala OpenClaw uruchamiać wieloetapowe sekwencje narzędzi jako pojedynczą, deterministyczną operację z jawnymi punktami zatwierdzania.

Lobster jest warstwą autorską ponad odłączoną pracą w tle. Informacje o orkiestracji przepływów ponad pojedynczymi zadaniami znajdziesz w [TaskFlow](/pl/automation/taskflow) (`openclaw tasks flow`). Informacje o rejestrze aktywności zadań znajdziesz w [`openclaw tasks`](/pl/automation/tasks).

## Hook

Twój asystent może budować narzędzia, które zarządzają nim samym. Poproś o przepływ pracy, a 30 minut później masz CLI oraz potoki uruchamiane jednym wywołaniem. Lobster jest brakującym elementem: deterministyczne potoki, jawne zatwierdzenia i wznawialny stan.

## Dlaczego

Dziś złożone przepływy pracy wymagają wielu wywołań narzędzi w obie strony. Każde wywołanie kosztuje tokeny, a LLM musi orkiestracyjnie prowadzić każdy krok. Lobster przenosi tę orkiestrację do typowanego środowiska uruchomieniowego:

- **Jedno wywołanie zamiast wielu**: OpenClaw uruchamia jedno wywołanie narzędzia Lobster i otrzymuje strukturalny wynik.
- **Wbudowane zatwierdzenia**: Efekty uboczne (wysłanie e-maila, opublikowanie komentarza) zatrzymują przepływ pracy do czasu jawnego zatwierdzenia.
- **Wznawialność**: Zatrzymane przepływy pracy zwracają token; zatwierdź i wznów bez ponownego uruchamiania wszystkiego.

## Dlaczego DSL zamiast zwykłych programów?

Lobster jest celowo mały. Celem nie jest „nowy język”, lecz przewidywalna, przyjazna AI specyfikacja potoku z natywnymi zatwierdzeniami i tokenami wznowienia.

- **Zatwierdzanie/wznawianie jest wbudowane**: Zwykły program może poprosić człowieka o decyzję, ale nie może _wstrzymać się i wznowić_ z trwałym tokenem bez wymyślania takiego środowiska uruchomieniowego samodzielnie.
- **Determinizm i audytowalność**: Potoki są danymi, więc łatwo je logować, porównywać, odtwarzać i przeglądać.
- **Ograniczona powierzchnia dla AI**: Mała gramatyka i przekazywanie JSON ograniczają „kreatywne” ścieżki kodu i sprawiają, że walidacja jest realistyczna.
- **Wbudowana polityka bezpieczeństwa**: Limity czasu, limity wyjścia, kontrole sandboxa i allowlisty są egzekwowane przez środowisko uruchomieniowe, a nie przez każdy skrypt.
- **Nadal programowalne**: Każdy krok może wywołać dowolne CLI lub skrypt. Jeśli chcesz JS/TS, generuj pliki `.lobster` z kodu.

## Jak to działa

OpenClaw uruchamia przepływy pracy Lobster **w tym samym procesie** za pomocą osadzonego runnera. Nie jest uruchamiany zewnętrzny podproces CLI; silnik przepływu pracy wykonuje się w procesie Gateway i zwraca bezpośrednio kopertę JSON.
Jeśli potok wstrzyma się w celu zatwierdzenia, narzędzie zwraca `resumeToken`, aby można było kontynuować później.

## Wzorzec: małe CLI + potoki JSON + zatwierdzenia

Buduj małe polecenia, które mówią JSON, a następnie łącz je w pojedyncze wywołanie Lobster. (Nazwy przykładowych poleceń poniżej — zastąp je własnymi).

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

Jeśli potok zażąda zatwierdzenia, wznów z tokenem:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI uruchamia przepływ pracy; Lobster wykonuje kroki. Bramki zatwierdzeń utrzymują efekty uboczne jako jawne i audytowalne.

Przykład: mapowanie elementów wejściowych na wywołania narzędzi:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Kroki LLM wyłącznie w JSON (llm-task)

W przypadku przepływów pracy, które potrzebują **strukturalnego kroku LLM**, włącz opcjonalne
narzędzie pluginu `llm-task` i wywołuj je z Lobster. Dzięki temu przepływ pracy pozostaje
deterministyczny, a jednocześnie nadal możesz klasyfikować, podsumowywać i szkicować za pomocą modelu.

Włącz narzędzie:

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

Użyj go w potoku:

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

Szczegóły i opcje konfiguracji znajdziesz w [LLM Task](/pl/tools/llm-task).

## Pliki przepływu pracy (.lobster)

Lobster może uruchamiać pliki przepływu pracy YAML/JSON z polami `name`, `args`, `steps`, `env`, `condition` i `approval`. W wywołaniach narzędzi OpenClaw ustaw `pipeline` na ścieżkę pliku.

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

- `stdin: $step.stdout` i `stdin: $step.json` przekazują wyjście wcześniejszego kroku.
- `condition` (lub `when`) może blokować kroki na podstawie `$step.approved`.

## Instalacja Lobster

Dołączone przepływy pracy Lobster działają w tym samym procesie; osobny plik binarny `lobster` nie jest wymagany. Osadzony runner jest dostarczany z Plugin Lobster.

Jeśli potrzebujesz samodzielnego CLI Lobster do tworzenia lub zewnętrznych potoków, zainstaluj je z [repozytorium Lobster](https://github.com/openclaw/lobster) i upewnij się, że `lobster` znajduje się w `PATH`.

## Włącz narzędzie

Lobster jest **opcjonalnym** narzędziem pluginu (domyślnie niewłączonym).

Zalecane (addytywne, bezpieczne):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Lub dla agenta:

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

Unikaj używania `tools.allow: ["lobster"]`, chyba że zamierzasz działać w restrykcyjnym trybie allowlisty.

<Note>
Allowlists są opcjonalne dla opcjonalnych pluginów. `alsoAllow` włącza tylko nazwane opcjonalne narzędzia pluginów, zachowując normalny podstawowy zestaw narzędzi. Aby ograniczyć narzędzia podstawowe, użyj `tools.allow` z wybranymi narzędziami lub grupami podstawowymi.
</Note>

## Przykład: Triage e-maili

Bez Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Z Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Zwraca kopertę JSON (skróconą):

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

Użytkownik zatwierdza → wznowienie:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Jeden przepływ pracy. Deterministyczny. Bezpieczny.

## Parametry narzędzia

### `run`

Uruchom potok w trybie narzędzia.

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

### `resume`

Kontynuuj zatrzymany przepływ pracy po zatwierdzeniu.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Opcjonalne wejścia

- `cwd`: Względny katalog roboczy dla potoku (musi pozostać w katalogu roboczym Gateway).
- `timeoutMs`: Przerwij przepływ pracy, jeśli przekroczy ten czas trwania (domyślnie: 20000).
- `maxStdoutBytes`: Przerwij przepływ pracy, jeśli wyjście przekroczy ten rozmiar (domyślnie: 512000).
- `argsJson`: Ciąg JSON przekazywany do `lobster run --args-json` (tylko pliki przepływu pracy).

## Koperta wyjściowa

Lobster zwraca kopertę JSON z jednym z trzech statusów:

- `ok` → zakończono pomyślnie
- `needs_approval` → wstrzymano; `requiresApproval.resumeToken` jest wymagany do wznowienia
- `cancelled` → jawnie odrzucono lub anulowano

Narzędzie udostępnia kopertę zarówno w `content` (ładnie sformatowany JSON), jak i w `details` (surowy obiekt).

## Zatwierdzenia

Jeśli obecne jest `requiresApproval`, sprawdź monit i zdecyduj:

- `approve: true` → wznów i kontynuuj efekty uboczne
- `approve: false` → anuluj i zakończ przepływ pracy

Użyj `approve --preview-from-stdin --limit N`, aby dołączać podgląd JSON do żądań zatwierdzenia bez niestandardowego klejenia jq/heredoc. Tokeny wznowienia są teraz kompaktowe: Lobster przechowuje stan wznowienia przepływu pracy w swoim katalogu stanu i zwraca mały klucz tokenu.

## OpenProse

OpenProse dobrze współpracuje z Lobster: użyj `/prose`, aby orkiestracyjnie przygotować pracę wielu agentów, a następnie uruchom potok Lobster dla deterministycznych zatwierdzeń. Jeśli program Prose potrzebuje Lobster, zezwól na narzędzie `lobster` dla subagentów przez `tools.subagents.tools`. Zobacz [OpenProse](/pl/prose).

## Bezpieczeństwo

- **Tylko lokalnie, w tym samym procesie** — przepływy pracy wykonują się w procesie Gateway; sam plugin nie wykonuje wywołań sieciowych.
- **Bez sekretów** — Lobster nie zarządza OAuth; wywołuje narzędzia OpenClaw, które to robią.
- **Świadomość sandboxa** — wyłączone, gdy kontekst narzędzia jest objęty sandboxem.
- **Utwardzone** — limity czasu i limity wyjścia egzekwowane przez osadzony runner.

## Rozwiązywanie problemów

- **`lobster timed out`** → zwiększ `timeoutMs` albo podziel długi potok.
- **`lobster output exceeded maxStdoutBytes`** → zwiększ `maxStdoutBytes` albo zmniejsz rozmiar wyjścia.
- **`lobster returned invalid JSON`** → upewnij się, że potok działa w trybie narzędzia i wypisuje tylko JSON.
- **`lobster failed`** → sprawdź logi Gateway, aby uzyskać szczegóły błędu osadzonego runnera.

## Dowiedz się więcej

- [Plugins](/pl/tools/plugin)
- [Tworzenie narzędzi pluginów](/pl/plugins/building-plugins#registering-agent-tools)

## Studium przypadku: społecznościowe przepływy pracy

Jeden publiczny przykład: CLI „drugiego mózgu” i potoki Lobster, które zarządzają trzema skarbcami Markdown (osobistym, partnerskim, współdzielonym). CLI emituje JSON dla statystyk, list inbox i skanów nieaktualnych elementów; Lobster łączy te polecenia w przepływy pracy takie jak `weekly-review`, `inbox-triage`, `memory-consolidation` i `shared-task-sync`, każdy z bramkami zatwierdzeń. AI obsługuje ocenę (kategoryzację), gdy jest dostępna, a gdy nie jest, wraca do deterministycznych reguł.

- Wątek: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repozytorium: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — planowanie przepływów pracy Lobster
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji
- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agentów
