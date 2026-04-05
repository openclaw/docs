---
read_when:
    - Chcesz deterministycznych wieloetapowych workflow z jawnymi zatwierdzeniami
    - Musisz wznowić workflow bez ponownego uruchamiania wcześniejszych kroków
summary: Typowane środowisko uruchomieniowe workflow dla OpenClaw z wznawialnymi bramkami zatwierdzeń.
title: Lobster
x-i18n:
    generated_at: "2026-04-05T14:08:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster to powłoka workflow, która pozwala OpenClaw uruchamiać wieloetapowe sekwencje narzędzi jako jedną, deterministyczną operację z jawnymi punktami zatwierdzania.

Lobster to jedna warstwa tworzenia ponad odłączoną pracą w tle. W przypadku orkiestracji przepływów ponad pojedynczymi zadaniami zobacz [Task Flow](/pl/automation/taskflow) (`openclaw tasks flow`). Informacje o rejestrze aktywności zadań znajdziesz w [`openclaw tasks`](/pl/automation/tasks).

## Hook

Twój asystent może budować narzędzia, które zarządzają nim samym. Poproś o workflow, a 30 minut później masz CLI oraz potoki, które działają jako jedno wywołanie. Lobster to brakujący element: deterministyczne potoki, jawne zatwierdzenia i wznawialny stan.

## Dlaczego

Obecnie złożone workflow wymagają wielu wywołań narzędzi tam i z powrotem. Każde wywołanie kosztuje tokeny, a LLM musi orkiestracją zarządzać na każdym kroku. Lobster przenosi tę orkiestrację do typowanego środowiska uruchomieniowego:

- **Jedno wywołanie zamiast wielu**: OpenClaw wykonuje jedno wywołanie narzędzia Lobster i otrzymuje ustrukturyzowany wynik.
- **Wbudowane zatwierdzenia**: skutki uboczne (wysłanie e-maila, opublikowanie komentarza) zatrzymują workflow do czasu jawnego zatwierdzenia.
- **Wznawialność**: zatrzymane workflow zwracają token; zatwierdź i wznów bez ponownego uruchamiania wszystkiego.

## Dlaczego DSL zamiast zwykłych programów?

Lobster jest celowo niewielki. Celem nie jest „nowy język”, lecz przewidywalna, przyjazna dla AI specyfikacja potoków z zatwierdzeniami pierwszej klasy i tokenami wznowienia.

- **Approve/resume jest wbudowane**: zwykły program może poprosić człowieka o decyzję, ale nie potrafi _wstrzymać się i wznowić_ z trwałym tokenem bez samodzielnego wynalezienia takiego środowiska uruchomieniowego.
- **Deterministyczność + audytowalność**: potoki są danymi, więc łatwo je logować, porównywać jako diff, odtwarzać i przeglądać.
- **Ograniczona powierzchnia dla AI**: mała gramatyka + potoki JSON ograniczają „kreatywne” ścieżki kodu i sprawiają, że walidacja jest realistyczna.
- **Polityka bezpieczeństwa wbudowana**: timeouty, limity wyjścia, kontrole sandbox i allowlist są egzekwowane przez środowisko uruchomieniowe, a nie przez każdy skrypt osobno.
- **Nadal programowalne**: każdy krok może wywołać dowolne CLI lub skrypt. Jeśli chcesz JS/TS, generuj pliki `.lobster` z kodu.

## Jak to działa

OpenClaw uruchamia lokalne CLI `lobster` w **trybie narzędzia** i analizuje obwiednię JSON ze stdout.
Jeśli potok zatrzyma się z powodu zatwierdzenia, narzędzie zwróci `resumeToken`, aby można było kontynuować później.

## Wzorzec: małe CLI + potoki JSON + zatwierdzenia

Twórz małe polecenia mówiące w JSON, a następnie łącz je w jedno wywołanie Lobster. (Nazwy poleceń poniżej to tylko przykłady — podmień je na własne).

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

Jeśli potok wymaga zatwierdzenia, wznów go za pomocą tokenu:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI uruchamia workflow; Lobster wykonuje kroki. Bramki zatwierdzeń sprawiają, że skutki uboczne są jawne i audytowalne.

Przykład: mapowanie elementów wejściowych na wywołania narzędzi:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Kroki LLM tylko w JSON (`llm-task`)

Dla workflow wymagających **ustrukturyzowanego kroku LLM** włącz opcjonalne
narzędzie pluginu `llm-task` i wywołuj je z Lobster. Dzięki temu workflow pozostaje
deterministyczny, a jednocześnie nadal możesz klasyfikować, streszczać i tworzyć szkice przy użyciu modelu.

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

Szczegóły i opcje konfiguracji znajdziesz w [LLM Task](/tools/llm-task).

## Pliki workflow (.lobster)

Lobster może uruchamiać pliki workflow YAML/JSON z polami `name`, `args`, `steps`, `env`, `condition` i `approval`. W wywołaniach narzędzi OpenClaw ustaw `pipeline` na ścieżkę do pliku.

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
- `condition` (lub `when`) może warunkowo uruchamiać kroki na podstawie `$step.approved`.

## Zainstaluj Lobster

Zainstaluj CLI Lobster na **tym samym hoście**, na którym działa Gateway OpenClaw (zobacz [repozytorium Lobster](https://github.com/openclaw/lobster)), i upewnij się, że `lobster` jest na `PATH`.

## Włącz narzędzie

Lobster to **opcjonalne** narzędzie pluginu (domyślnie niewłączone).

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

Uwaga: allowlist są opt-in dla opcjonalnych pluginów. Jeśli allowlist zawiera tylko
narzędzia pluginów (takie jak `lobster`), OpenClaw pozostawia narzędzia rdzenia włączone. Aby ograniczyć narzędzia rdzenia, uwzględnij w allowlist także narzędzia lub grupy rdzenia, których chcesz używać.

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

Zwraca obwiednię JSON (uciętą):

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

Jeden workflow. Deterministyczny. Bezpieczny.

## Parametry narzędzia

### `run`

Uruchamia potok w trybie narzędzia.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Uruchamianie pliku workflow z argumentami:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Kontynuuje zatrzymany workflow po zatwierdzeniu.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Opcjonalne dane wejściowe

- `cwd`: względny katalog roboczy dla potoku (musi pozostać w bieżącym katalogu roboczym procesu).
- `timeoutMs`: zabija podproces, jeśli przekroczy ten czas trwania (domyślnie: 20000).
- `maxStdoutBytes`: zabija podproces, jeśli stdout przekroczy ten rozmiar (domyślnie: 512000).
- `argsJson`: ciąg JSON przekazywany do `lobster run --args-json` (tylko pliki workflow).

## Obwiednia wyjściowa

Lobster zwraca obwiednię JSON z jednym z trzech statusów:

- `ok` → zakończono pomyślnie
- `needs_approval` → wstrzymano; do wznowienia wymagane jest `requiresApproval.resumeToken`
- `cancelled` → jawnie odrzucono lub anulowano

Narzędzie udostępnia obwiednię zarówno w `content` (sformatowany JSON), jak i w `details` (surowy obiekt).

## Zatwierdzenia

Jeśli istnieje `requiresApproval`, sprawdź prompt i zdecyduj:

- `approve: true` → wznów i kontynuuj skutki uboczne
- `approve: false` → anuluj i zakończ workflow

Użyj `approve --preview-from-stdin --limit N`, aby dołączyć podgląd JSON do żądań zatwierdzenia bez niestandardowego klejenia `jq`/heredoc. Tokeny wznowienia są teraz kompaktowe: Lobster przechowuje stan wznowienia workflow w swoim katalogu stanu i zwraca mały klucz tokenu.

## OpenProse

OpenProse dobrze współpracuje z Lobster: użyj `/prose`, aby orkiestracją przygotować pracę wielu agentów, a następnie uruchom potok Lobster dla deterministycznych zatwierdzeń. Jeśli program Prose potrzebuje Lobster, zezwól na narzędzie `lobster` dla podagentów przez `tools.subagents.tools`. Zobacz [OpenProse](/prose).

## Bezpieczeństwo

- **Tylko lokalne podprocesy** — sam plugin nie wykonuje wywołań sieciowych.
- **Bez sekretów** — Lobster nie zarządza OAuth; wywołuje narzędzia OpenClaw, które to robią.
- **Świadomość sandbox** — wyłączone, gdy kontekst narzędzia działa w sandbox.
- **Wzmocnione** — stała nazwa pliku wykonywalnego (`lobster`) na `PATH`; wymuszane są timeouty i limity wyjścia.

## Rozwiązywanie problemów

- **`lobster subprocess timed out`** → zwiększ `timeoutMs` albo podziel długi potok.
- **`lobster output exceeded maxStdoutBytes`** → zwiększ `maxStdoutBytes` albo zmniejsz rozmiar wyjścia.
- **`lobster returned invalid JSON`** → upewnij się, że potok działa w trybie narzędzia i wypisuje tylko JSON.
- **`lobster failed (code …)`** → uruchom ten sam potok w terminalu, aby sprawdzić stderr.

## Dowiedz się więcej

- [Pluginy](/tools/plugin)
- [Tworzenie narzędzi pluginów](/plugins/building-plugins#registering-agent-tools)

## Studium przypadku: workflow społeczności

Jeden publiczny przykład: CLI „second brain” + potoki Lobster, które zarządzają trzema skarbcami Markdown (osobistym, partnera, współdzielonym). CLI emituje JSON dla statystyk, list inbox i skanów nieaktualnych elementów; Lobster łączy te polecenia w workflow, takie jak `weekly-review`, `inbox-triage`, `memory-consolidation` i `shared-task-sync`, każde z bramkami zatwierdzeń. AI obsługuje osąd (kategoryzację), gdy jest dostępne, i przechodzi do reguł deterministycznych, gdy nie jest.

- Wątek: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repozytorium: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Powiązane

- [Automatyzacja i zadania](/pl/automation) — planowanie workflow Lobster
- [Przegląd automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji
- [Przegląd narzędzi](/tools) — wszystkie dostępne narzędzia agenta
