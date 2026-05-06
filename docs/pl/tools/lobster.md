---
read_when:
    - Chcesz deterministycznych, wieloetapowych przepływów pracy z jawnymi zatwierdzeniami
    - Musisz wznowić przepływ pracy bez ponownego wykonywania wcześniejszych kroków
summary: Typowane środowisko wykonawcze przepływów pracy dla OpenClaw z wznawialnymi bramkami zatwierdzania.
title: Homar
x-i18n:
    generated_at: "2026-05-06T09:33:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster to powłoka przepływów pracy, która pozwala OpenClaw uruchamiać wieloetapowe sekwencje narzędzi jako pojedynczą, deterministyczną operację z jawnymi punktami kontrolnymi zatwierdzeń.

Lobster jest warstwą autorską nad odłączoną pracą w tle. Aby uzyskać informacje o orkiestracji przepływów ponad pojedynczymi zadaniami, zobacz [Task Flow](/pl/automation/taskflow) (`openclaw tasks flow`). Aby poznać dziennik aktywności zadań, zobacz [`openclaw tasks`](/pl/automation/tasks).

## Hak

Twój asystent może zbudować narzędzia, które zarządzają nim samym. Poproś o przepływ pracy, a 30 minut później masz CLI oraz potoki uruchamiane jednym wywołaniem. Lobster jest brakującym elementem: deterministyczne potoki, jawne zatwierdzenia i wznawialny stan.

## Dlaczego

Dzisiaj złożone przepływy pracy wymagają wielu wywołań narzędzi tam i z powrotem. Każde wywołanie kosztuje tokeny, a LLM musi orkiestrację każdego kroku prowadzić samodzielnie. Lobster przenosi tę orkiestrację do typowanego środowiska uruchomieniowego:

- **Jedno wywołanie zamiast wielu**: OpenClaw uruchamia jedno wywołanie narzędzia Lobster i otrzymuje strukturalny wynik.
- **Wbudowane zatwierdzenia**: Efekty uboczne (wysłanie e-maila, opublikowanie komentarza) zatrzymują przepływ pracy do czasu jawnego zatwierdzenia.
- **Wznawialność**: Zatrzymane przepływy pracy zwracają token; zatwierdź i wznów bez ponownego uruchamiania wszystkiego.

## Dlaczego DSL zamiast zwykłych programów?

Lobster jest celowo mały. Celem nie jest „nowy język”, lecz przewidywalna, przyjazna dla AI specyfikacja potoku z pierwszorzędnymi zatwierdzeniami i tokenami wznowienia.

- **Zatwierdzanie/wznawianie jest wbudowane**: Zwykły program może poprosić człowieka o decyzję, ale nie potrafi _wstrzymać się i wznowić_ z trwałym tokenem bez samodzielnego tworzenia takiego środowiska uruchomieniowego.
- **Determinizm + audytowalność**: Potoki są danymi, więc łatwo je logować, porównywać, odtwarzać i przeglądać.
- **Ograniczona powierzchnia dla AI**: Mała gramatyka + przekazywanie JSON ograniczają „kreatywne” ścieżki kodu i czynią walidację realistyczną.
- **Wbudowana polityka bezpieczeństwa**: Limity czasu, limity wyjścia, kontrole piaskownicy i listy dozwolonych są wymuszane przez środowisko uruchomieniowe, a nie przez każdy skrypt.
- **Nadal programowalne**: Każdy krok może wywołać dowolne CLI lub skrypt. Jeśli chcesz JS/TS, generuj pliki `.lobster` z kodu.

## Jak to działa

OpenClaw uruchamia przepływy pracy Lobster **w procesie** za pomocą osadzonego runnera. Nie jest uruchamiany zewnętrzny podproces CLI; silnik przepływu pracy wykonuje się wewnątrz procesu Gateway i zwraca bezpośrednio kopertę JSON.
Jeśli potok zatrzyma się w celu zatwierdzenia, narzędzie zwraca `resumeToken`, aby można było kontynuować później.

## Wzorzec: małe CLI + potoki JSON + zatwierdzenia

Buduj małe polecenia komunikujące się przez JSON, a potem łącz je w jedno wywołanie Lobster. (Poniższe nazwy poleceń są przykładowe - podmień je na własne).

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

Jeśli potok poprosi o zatwierdzenie, wznów z tokenem:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI wyzwala przepływ pracy; Lobster wykonuje kroki. Bramki zatwierdzeń sprawiają, że efekty uboczne są jawne i audytowalne.

Przykład: mapowanie elementów wejściowych na wywołania narzędzi:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Kroki LLM tylko w JSON (llm-task)

W przypadku przepływów pracy, które wymagają **strukturalnego kroku LLM**, włącz opcjonalne narzędzie Plugin
`llm-task` i wywołuj je z Lobster. Dzięki temu przepływ pracy pozostaje
deterministyczny, a jednocześnie nadal możesz klasyfikować, streszczać i tworzyć szkice z użyciem modelu.

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

Zobacz [LLM Task](/pl/tools/llm-task), aby poznać szczegóły i opcje konfiguracji.

## Pliki przepływów pracy (.lobster)

Lobster może uruchamiać pliki przepływów pracy YAML/JSON z polami `name`, `args`, `steps`, `env`, `condition` i `approval`. W wywołaniach narzędzi OpenClaw ustaw `pipeline` na ścieżkę pliku.

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
- `condition` (lub `when`) może uzależniać kroki od `$step.approved`.

## Instalacja Lobster

Dołączone przepływy pracy Lobster działają w procesie; osobny plik binarny `lobster` nie jest wymagany. Osadzony runner jest dostarczany z Plugin Lobster.

Jeśli potrzebujesz samodzielnego CLI Lobster do tworzenia lub zewnętrznych potoków, zainstaluj je z [repozytorium Lobster](https://github.com/openclaw/lobster) i upewnij się, że `lobster` znajduje się w `PATH`.

## Włączanie narzędzia

Lobster jest **opcjonalnym** narzędziem Plugin (domyślnie niewłączonym).

Zalecane (addytywne, bezpieczne):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Lub dla konkretnego agenta:

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

Unikaj używania `tools.allow: ["lobster"]`, chyba że zamierzasz działać w restrykcyjnym trybie listy dozwolonych.

<Note>
Listy dozwolonych są włączane dobrowolnie dla opcjonalnych pluginów. `alsoAllow` włącza tylko wskazane opcjonalne narzędzia Plugin, zachowując normalny zestaw narzędzi rdzenia. Aby ograniczyć narzędzia rdzenia, użyj `tools.allow` z wybranymi narzędziami lub grupami rdzenia.
</Note>

## Przykład: triage e-maili

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

### Opcjonalne dane wejściowe

- `cwd`: Względny katalog roboczy potoku (musi pozostać w katalogu roboczym Gateway).
- `timeoutMs`: Przerwij przepływ pracy, jeśli przekroczy ten czas trwania (domyślnie: 20000).
- `maxStdoutBytes`: Przerwij przepływ pracy, jeśli wyjście przekroczy ten rozmiar (domyślnie: 512000).
- `argsJson`: Łańcuch JSON przekazywany do `lobster run --args-json` (tylko pliki przepływu pracy).

## Koperta wyjściowa

Lobster zwraca kopertę JSON z jednym z trzech statusów:

- `ok` → zakończono pomyślnie
- `needs_approval` → wstrzymano; `requiresApproval.resumeToken` jest wymagany do wznowienia
- `cancelled` → jawnie odmówiono lub anulowano

Narzędzie udostępnia kopertę zarówno w `content` (ładnie sformatowany JSON), jak i w `details` (surowy obiekt).

## Zatwierdzenia

Jeśli obecne jest `requiresApproval`, sprawdź prompt i zdecyduj:

- `approve: true` → wznów i kontynuuj efekty uboczne
- `approve: false` → anuluj i sfinalizuj przepływ pracy

Użyj `approve --preview-from-stdin --limit N`, aby dołączać podgląd JSON do próśb o zatwierdzenie bez niestandardowego klejenia jq/heredoc. Tokeny wznowienia są teraz kompaktowe: Lobster przechowuje stan wznowienia przepływu pracy w swoim katalogu stanu i zwraca mały klucz tokena.

## OpenProse

OpenProse dobrze współpracuje z Lobster: użyj `/prose`, aby orkiestrację przygotowania z wieloma agentami wykonać wcześniej, a następnie uruchom potok Lobster dla deterministycznych zatwierdzeń. Jeśli program Prose potrzebuje Lobster, zezwól na narzędzie `lobster` dla subagentów przez `tools.subagents.tools`. Zobacz [OpenProse](/pl/prose).

## Bezpieczeństwo

- **Tylko lokalnie w procesie** - przepływy pracy wykonują się wewnątrz procesu Gateway; sam Plugin nie wykonuje wywołań sieciowych.
- **Bez sekretów** - Lobster nie zarządza OAuth; wywołuje narzędzia OpenClaw, które to robią.
- **Świadomość piaskownicy** - wyłączone, gdy kontekst narzędzia jest w piaskownicy.
- **Utwardzone** - limity czasu i limity wyjścia są wymuszane przez osadzony runner.

## Rozwiązywanie problemów

- **`lobster timed out`** → zwiększ `timeoutMs` albo podziel długi potok.
- **`lobster output exceeded maxStdoutBytes`** → zwiększ `maxStdoutBytes` albo zmniejsz rozmiar wyjścia.
- **`lobster returned invalid JSON`** → upewnij się, że potok działa w trybie narzędzia i wypisuje tylko JSON.
- **`lobster failed`** → sprawdź logi Gateway, aby uzyskać szczegóły błędu osadzonego runnera.

## Dowiedz się więcej

- [Pluginy](/pl/tools/plugin)
- [Tworzenie narzędzi Plugin](/pl/plugins/building-plugins#registering-agent-tools)

## Studium przypadku: przepływy pracy społeczności

Jeden publiczny przykład: CLI „drugiego mózgu” + potoki Lobster, które zarządzają trzema sejfami Markdown (osobistym, partnerskim, współdzielonym). CLI emituje JSON dla statystyk, list skrzynki odbiorczej i skanów nieaktualnych treści; Lobster łączy te polecenia w przepływy pracy takie jak `weekly-review`, `inbox-triage`, `memory-consolidation` i `shared-task-sync`, każdy z bramkami zatwierdzeń. AI obsługuje ocenę (kategoryzację), gdy jest dostępna, i wraca do deterministycznych reguł, gdy nie jest.

- Wątek: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repozytorium: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Powiązane

- [Automatyzacja i zadania](/pl/automation) - planowanie przepływów pracy Lobster
- [Omówienie automatyzacji](/pl/automation) - wszystkie mechanizmy automatyzacji
- [Omówienie narzędzi](/pl/tools) - wszystkie dostępne narzędzia agenta
