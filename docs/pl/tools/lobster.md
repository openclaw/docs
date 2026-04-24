---
read_when:
    - Chcesz deterministycznych wieloetapowych workflow z jawnymi zatwierdzeniami
    - Musisz wznowić workflow bez ponownego uruchamiania wcześniejszych kroków
summary: Typowany runtime workflow dla OpenClaw z wznawialnymi bramkami zatwierdzeń.
title: Lobster
x-i18n:
    generated_at: "2026-04-24T09:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster to powłoka workflow, która pozwala OpenClaw uruchamiać wieloetapowe sekwencje narzędzi jako pojedynczą, deterministyczną operację z jawnymi punktami kontrolnymi zatwierdzeń.

Lobster jest o jedną warstwę autorską wyżej niż odłączona praca w tle. Do orkiestracji przepływu ponad pojedynczymi zadaniami zobacz [TaskFlow](/pl/automation/taskflow) (`openclaw tasks flow`). Dla rejestru aktywności zadań zobacz [`openclaw tasks`](/pl/automation/tasks).

## Hook

Twój asystent może budować narzędzia, które zarządzają nim samym. Poproś o workflow, a 30 minut później masz CLI plus pipeline’y, które działają jako jedno wywołanie. Lobster to brakujący element: deterministyczne pipeline’y, jawne zatwierdzenia i wznawialny stan.

## Dlaczego

Dziś złożone workflow wymagają wielu wywołań narzędzi tam i z powrotem. Każde wywołanie kosztuje tokeny, a LLM musi orkiestrwać każdy krok. Lobster przenosi tę orkiestrację do typowanego runtime:

- **Jedno wywołanie zamiast wielu**: OpenClaw uruchamia jedno wywołanie narzędzia Lobster i otrzymuje ustrukturyzowany wynik.
- **Wbudowane zatwierdzenia**: efekty uboczne (wysłanie e-maila, opublikowanie komentarza) zatrzymują workflow do czasu jawnego zatwierdzenia.
- **Wznawialność**: zatrzymane workflow zwracają token; zatwierdź i wznów bez ponownego uruchamiania wszystkiego.

## Dlaczego DSL zamiast zwykłych programów?

Lobster jest celowo mały. Celem nie jest „nowy język”, lecz przewidywalna, przyjazna dla AI specyfikacja pipeline z pierwszoklasowymi zatwierdzeniami i tokenami wznowienia.

- **Approve/resume jest wbudowane**: zwykły program może wyświetlić prompt człowiekowi, ale nie potrafi _wstrzymać się i wznowić_ z trwałym tokenem bez samodzielnego wymyślenia takiego runtime.
- **Deterministyczność + audytowalność**: pipeline’y są danymi, więc łatwo je logować, porównywać, odtwarzać i przeglądać.
- **Ograniczona powierzchnia dla AI**: mała gramatyka + potokowanie JSON ograniczają „kreatywne” ścieżki kodu i czynią walidację realistyczną.
- **Polityka bezpieczeństwa wbudowana na stałe**: timeouty, limity wyjścia, kontrole sandboxa i allowlisty są egzekwowane przez runtime, a nie przez każdy skrypt.
- **Nadal programowalne**: każdy krok może wywołać dowolne CLI lub skrypt. Jeśli chcesz JS/TS, generuj pliki `.lobster` z kodu.

## Jak to działa

OpenClaw uruchamia workflow Lobster **in-process** przy użyciu osadzonego runnera. Nie jest uruchamiany żaden zewnętrzny podproces CLI; silnik workflow wykonuje się wewnątrz procesu gateway i bezpośrednio zwraca kopertę JSON.
Jeśli pipeline zatrzyma się na zatwierdzeniu, narzędzie zwraca `resumeToken`, aby można było kontynuować później.

## Wzorzec: małe CLI + potoki JSON + zatwierdzenia

Buduj małe polecenia mówiące w JSON, a następnie łącz je w jedno wywołanie Lobster. (Poniższe nazwy poleceń są przykładowe — podmień na własne).

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

Jeśli pipeline zażąda zatwierdzenia, wznów za pomocą tokenu:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI wyzwala workflow; Lobster wykonuje kroki. Bramki zatwierdzeń utrzymują efekty uboczne jako jawne i audytowalne.

Przykład: mapowanie elementów wejściowych na wywołania narzędzi:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Kroki LLM tylko-JSON (`llm-task`)

Dla workflow, które potrzebują **ustrukturyzowanego kroku LLM**, włącz opcjonalne
narzędzie Pluginu `llm-task` i wywołuj je z Lobster. Dzięki temu workflow pozostaje
deterministyczny, a jednocześnie nadal możesz klasyfikować/podsumowywać/tworzyć szkice przy użyciu modelu.

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
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Użyj go w pipeline:

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

## Pliki workflow (.lobster)

Lobster może uruchamiać pliki workflow YAML/JSON z polami `name`, `args`, `steps`, `env`, `condition` i `approval`. W wywołaniach narzędzi OpenClaw ustaw `pipeline` na ścieżkę pliku.

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
- `condition` (albo `when`) może bramkować kroki na podstawie `$step.approved`.

## Instalacja Lobster

Dołączone workflow Lobster działają in-process; nie jest wymagany osobny binarny plik `lobster`. Osadzony runner jest dostarczany z Pluginem Lobster.

Jeśli potrzebujesz samodzielnego CLI Lobster do developmentu lub zewnętrznych pipeline’ów, zainstaluj go z [repozytorium Lobster](https://github.com/openclaw/lobster) i upewnij się, że `lobster` znajduje się na `PATH`.

## Włącz narzędzie

Lobster to **opcjonalne** narzędzie Pluginu (domyślnie niewłączone).

Zalecane (addytywne, bezpieczne):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Albo per agent:

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

Unikaj używania `tools.allow: ["lobster"]`, chyba że zamierzasz działać w restrykcyjnym trybie allowlist.

Uwaga: allowlisty są opt-in dla opcjonalnych Pluginów. Jeśli twoja allowlista wymienia tylko
narzędzia Pluginów (takie jak `lobster`), OpenClaw pozostawia narzędzia core włączone. Aby ograniczyć narzędzia core,
uwzględnij w allowliście także te narzędzia core lub grupy, których chcesz używać.

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

Zwraca kopertę JSON (uciętą):

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

Jedno workflow. Deterministyczne. Bezpieczne.

## Parametry narzędzia

### `run`

Uruchom pipeline w trybie narzędzia.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Uruchom plik workflow z argumentami:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Kontynuuj zatrzymane workflow po zatwierdzeniu.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Opcjonalne dane wejściowe

- `cwd`: względny katalog roboczy dla pipeline (musi pozostać w obrębie katalogu roboczego gateway).
- `timeoutMs`: przerwij workflow, jeśli przekroczy ten czas trwania (domyślnie: `20000`).
- `maxStdoutBytes`: przerwij workflow, jeśli wyjście przekroczy ten rozmiar (domyślnie: `512000`).
- `argsJson`: ciąg JSON przekazywany do `lobster run --args-json` (tylko pliki workflow).

## Koperta wyjściowa

Lobster zwraca kopertę JSON z jednym z trzech statusów:

- `ok` → zakończono pomyślnie
- `needs_approval` → wstrzymano; do wznowienia wymagane jest `requiresApproval.resumeToken`
- `cancelled` → jawnie odrzucono albo anulowano

Narzędzie udostępnia kopertę zarówno w `content` (ładnie sformatowany JSON), jak i w `details` (surowy obiekt).

## Zatwierdzenia

Jeśli obecne jest `requiresApproval`, sprawdź prompt i zdecyduj:

- `approve: true` → wznów i kontynuuj efekty uboczne
- `approve: false` → anuluj i sfinalizuj workflow

Użyj `approve --preview-from-stdin --limit N`, aby dołączyć podgląd JSON do żądań zatwierdzenia bez własnego klejenia `jq`/heredoc. Tokeny wznowienia są teraz zwięzłe: Lobster przechowuje stan wznowienia workflow w swoim katalogu stanu i zwraca mały klucz tokenu.

## OpenProse

OpenProse dobrze współpracuje z Lobster: użyj `/prose`, aby orkiestrwać przygotowanie wieloagentowe, a następnie uruchom pipeline Lobster dla deterministycznych zatwierdzeń. Jeśli program Prose potrzebuje Lobster, zezwól na narzędzie `lobster` dla sub-agentów przez `tools.subagents.tools`. Zobacz [OpenProse](/pl/prose).

## Bezpieczeństwo

- **Tylko lokalnie in-process** — workflow wykonują się wewnątrz procesu gateway; sam Plugin nie wykonuje wywołań sieciowych.
- **Bez sekretów** — Lobster nie zarządza OAuth; wywołuje narzędzia OpenClaw, które to robią.
- **Świadomość sandboxa** — wyłączone, gdy kontekst narzędzia jest sandboxowany.
- **Utwardzone** — timeouty i limity wyjścia są egzekwowane przez osadzony runner.

## Rozwiązywanie problemów

- **`lobster timed out`** → zwiększ `timeoutMs` albo podziel długi pipeline.
- **`lobster output exceeded maxStdoutBytes`** → zwiększ `maxStdoutBytes` albo zmniejsz rozmiar wyjścia.
- **`lobster returned invalid JSON`** → upewnij się, że pipeline działa w trybie narzędzia i wypisuje tylko JSON.
- **`lobster failed`** → sprawdź logi gateway, aby zobaczyć szczegóły błędu osadzonego runnera.

## Dowiedz się więcej

- [Pluginy](/pl/tools/plugin)
- [Tworzenie narzędzi Pluginów](/pl/plugins/building-plugins#registering-agent-tools)

## Studium przypadku: workflow społeczności

Jeden publiczny przykład: CLI „second brain” + pipeline’y Lobster zarządzające trzema sejfami Markdown (osobistym, partnerskim, współdzielonym). CLI emituje JSON dla statystyk, list inbox i skanów nieaktualności; Lobster łączy te polecenia w workflow takie jak `weekly-review`, `inbox-triage`, `memory-consolidation` i `shared-task-sync`, każde z bramkami zatwierdzeń. AI obsługuje osąd (kategoryzację), gdy jest dostępne, i wraca do deterministycznych reguł, gdy nie jest.

- Wątek: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repozytorium: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — planowanie workflow Lobster
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji
- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agenta
