---
read_when:
    - Potrzebujesz deterministycznych wieloetapowych przepływów pracy z jawnymi zatwierdzeniami
    - Musisz wznowić przepływ pracy bez ponownego wykonywania wcześniejszych kroków
summary: Typowane środowisko wykonawcze przepływów pracy dla OpenClaw z wznawialnymi bramkami zatwierdzania.
title: Homar
x-i18n:
    generated_at: "2026-04-30T10:23:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster to powłoka przepływów pracy, która pozwala OpenClaw uruchamiać wieloetapowe sekwencje narzędzi jako jedną, deterministyczną operację z jawnymi punktami kontrolnymi zatwierdzeń.

Lobster to jedna warstwa autorska ponad odłączoną pracą w tle. Orkiestrację przepływów ponad pojedynczymi zadaniami opisuje [Task Flow](/pl/automation/taskflow) (`openclaw tasks flow`). Rejestr aktywności zadań opisuje [`openclaw tasks`](/pl/automation/tasks).

## Hak

Twój asystent może budować narzędzia, które zarządzają nim samym. Poproś o przepływ pracy, a 30 minut później masz CLI oraz potoki uruchamiane jednym wywołaniem. Lobster jest brakującym elementem: deterministyczne potoki, jawne zatwierdzenia i wznawialny stan.

## Dlaczego

Obecnie złożone przepływy pracy wymagają wielu wymian wywołań narzędzi. Każde wywołanie kosztuje tokeny, a LLM musi orkiestracji każdy krok. Lobster przenosi tę orkiestrację do typowanego środowiska uruchomieniowego:

- **Jedno wywołanie zamiast wielu**: OpenClaw uruchamia jedno wywołanie narzędzia Lobster i otrzymuje strukturalny wynik.
- **Wbudowane zatwierdzenia**: Skutki uboczne (wyślij e-mail, opublikuj komentarz) wstrzymują przepływ pracy do czasu jawnego zatwierdzenia.
- **Wznawialność**: Wstrzymane przepływy pracy zwracają token; zatwierdź i wznów bez ponownego uruchamiania wszystkiego.

## Dlaczego DSL zamiast zwykłych programów?

Lobster jest celowo mały. Celem nie jest „nowy język”, lecz przewidywalna, przyjazna AI specyfikacja potoku z natywnymi zatwierdzeniami i tokenami wznowienia.

- **Zatwierdzanie/wznawianie jest wbudowane**: Zwykły program może poprosić człowieka o decyzję, ale nie potrafi _wstrzymać się i wznowić_ z trwałym tokenem bez samodzielnego wymyślania takiego środowiska uruchomieniowego.
- **Determinizm i audytowalność**: Potoki są danymi, więc łatwo je rejestrować, porównywać, odtwarzać i przeglądać.
- **Ograniczona powierzchnia dla AI**: Mała gramatyka i przekazywanie JSON ograniczają „kreatywne” ścieżki kodu i sprawiają, że walidacja jest realistyczna.
- **Wbudowana polityka bezpieczeństwa**: Limity czasu, limity danych wyjściowych, kontrole sandboxa i listy dozwolonych elementów są egzekwowane przez środowisko uruchomieniowe, a nie przez każdy skrypt.
- **Nadal programowalne**: Każdy krok może wywołać dowolne CLI lub skrypt. Jeśli chcesz JS/TS, generuj pliki `.lobster` z kodu.

## Jak to działa

OpenClaw uruchamia przepływy pracy Lobster **w tym samym procesie** przy użyciu osadzonego runnera. Nie jest uruchamiany zewnętrzny podproces CLI; silnik przepływu pracy wykonuje się w procesie gatewaya i zwraca bezpośrednio kopertę JSON.
Jeśli potok zatrzyma się na zatwierdzenie, narzędzie zwróci `resumeToken`, aby można było kontynuować później.

## Wzorzec: małe CLI + potoki JSON + zatwierdzenia

Buduj małe polecenia mówiące JSON-em, a potem łącz je w jedno wywołanie Lobster. (Przykładowe nazwy poleceń poniżej — zastąp je własnymi).

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

Jeśli potok poprosi o zatwierdzenie, wznów go tokenem:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI wyzwala przepływ pracy; Lobster wykonuje kroki. Bramki zatwierdzania utrzymują skutki uboczne jako jawne i audytowalne.

Przykład: mapowanie elementów wejściowych na wywołania narzędzi:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Kroki LLM wyłącznie w JSON (llm-task)

Dla przepływów pracy wymagających **strukturalnego kroku LLM** włącz opcjonalne narzędzie Plugin
`llm-task` i wywołuj je z Lobster. Dzięki temu przepływ pracy pozostaje
deterministyczny, a jednocześnie pozwala klasyfikować/podsumowywać/tworzyć szkice za pomocą modelu.

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

- `stdin: $step.stdout` i `stdin: $step.json` przekazują dane wyjściowe wcześniejszego kroku.
- `condition` (lub `when`) może uzależniać kroki od `$step.approved`.

## Instalacja Lobster

Dołączone przepływy pracy Lobster działają w tym samym procesie; oddzielny binarny `lobster` nie jest wymagany. Osadzony runner jest dostarczany z Plugin Lobster.

Jeśli potrzebujesz samodzielnego CLI Lobster do rozwoju lub zewnętrznych potoków, zainstaluj je z [repozytorium Lobster](https://github.com/openclaw/lobster) i upewnij się, że `lobster` znajduje się w `PATH`.

## Włącz narzędzie

Lobster jest **opcjonalnym** narzędziem Plugin (domyślnie niewłączonym).

Zalecane (addytywne, bezpieczne):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Lub per agent:

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

Unikaj używania `tools.allow: ["lobster"]`, chyba że zamierzasz działać w restrykcyjnym trybie listy dozwolonych elementów.

<Note>
Listy dozwolonych elementów są opt-in dla opcjonalnych pluginów. Jeśli lista dozwolonych elementów wymienia tylko narzędzia pluginów (takie jak `lobster`), OpenClaw pozostawia narzędzia core włączone. Aby ograniczyć narzędzia core, dołącz do listy dozwolonych elementów także wybrane narzędzia lub grupy core.
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

Użytkownik zatwierdza → wznów:

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

Kontynuuj wstrzymany przepływ pracy po zatwierdzeniu.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Opcjonalne dane wejściowe

- `cwd`: Względny katalog roboczy potoku (musi pozostać w katalogu roboczym gatewaya).
- `timeoutMs`: Przerwij przepływ pracy, jeśli przekroczy ten czas trwania (domyślnie: 20000).
- `maxStdoutBytes`: Przerwij przepływ pracy, jeśli dane wyjściowe przekroczą ten rozmiar (domyślnie: 512000).
- `argsJson`: Ciąg JSON przekazywany do `lobster run --args-json` (tylko pliki przepływów pracy).

## Koperta wyjściowa

Lobster zwraca kopertę JSON z jednym z trzech statusów:

- `ok` → zakończono pomyślnie
- `needs_approval` → wstrzymano; `requiresApproval.resumeToken` jest wymagany do wznowienia
- `cancelled` → jawnie odrzucono lub anulowano

Narzędzie udostępnia kopertę zarówno w `content` (ładnie sformatowany JSON), jak i w `details` (surowy obiekt).

## Zatwierdzenia

Jeśli obecne jest `requiresApproval`, sprawdź prompt i zdecyduj:

- `approve: true` → wznów i kontynuuj skutki uboczne
- `approve: false` → anuluj i sfinalizuj przepływ pracy

Użyj `approve --preview-from-stdin --limit N`, aby dołączać podgląd JSON do próśb o zatwierdzenie bez własnego kleju jq/heredoc. Tokeny wznowienia są teraz kompaktowe: Lobster przechowuje stan wznowienia przepływu pracy w swoim katalogu stanu i zwraca mały klucz tokena.

## OpenProse

OpenProse dobrze współpracuje z Lobster: użyj `/prose` do orkiestracji przygotowania wielu agentów, a następnie uruchom potok Lobster dla deterministycznych zatwierdzeń. Jeśli program Prose potrzebuje Lobster, zezwól podagentom na narzędzie `lobster` przez `tools.subagents.tools`. Zobacz [OpenProse](/pl/prose).

## Bezpieczeństwo

- **Tylko lokalnie w tym samym procesie** — przepływy pracy wykonują się w procesie gatewaya; sam plugin nie wykonuje wywołań sieciowych.
- **Bez sekretów** — Lobster nie zarządza OAuth; wywołuje narzędzia OpenClaw, które to robią.
- **Świadomość sandboxa** — wyłączone, gdy kontekst narzędzia jest objęty sandboxem.
- **Wzmocnione** — limity czasu i limity danych wyjściowych są egzekwowane przez osadzonego runnera.

## Rozwiązywanie problemów

- **`lobster timed out`** → zwiększ `timeoutMs` albo podziel długi potok.
- **`lobster output exceeded maxStdoutBytes`** → zwiększ `maxStdoutBytes` albo zmniejsz rozmiar danych wyjściowych.
- **`lobster returned invalid JSON`** → upewnij się, że potok działa w trybie narzędzia i wypisuje tylko JSON.
- **`lobster failed`** → sprawdź logi gatewaya, aby poznać szczegóły błędu osadzonego runnera.

## Dowiedz się więcej

- [Pluginy](/pl/tools/plugin)
- [Tworzenie narzędzi Plugin](/pl/plugins/building-plugins#registering-agent-tools)

## Studium przypadku: przepływy pracy społeczności

Jeden publiczny przykład: CLI „drugiego mózgu” oraz potoki Lobster zarządzające trzema sejfami Markdown (osobistym, partnera, współdzielonym). CLI emituje JSON ze statystykami, listami inboxa i skanami nieaktualnych elementów; Lobster łączy te polecenia w przepływy pracy takie jak `weekly-review`, `inbox-triage`, `memory-consolidation` i `shared-task-sync`, każdy z bramkami zatwierdzania. AI obsługuje osąd (kategoryzację), gdy jest dostępna, i wraca do deterministycznych reguł, gdy nie jest.

- Wątek: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repozytorium: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — planowanie przepływów pracy Lobster
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji
- [Przegląd narzędzi](/pl/tools) — wszystkie dostępne narzędzia agentów
