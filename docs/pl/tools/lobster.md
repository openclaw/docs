---
read_when:
    - Chcesz deterministycznych wieloetapowych przepływów pracy z jawnymi zatwierdzeniami
    - Musisz wznowić przepływ pracy bez ponownego wykonywania wcześniejszych kroków
summary: Typowane środowisko wykonawcze przepływów pracy dla OpenClaw z wznawialnymi bramkami zatwierdzania.
title: Homar
x-i18n:
    generated_at: "2026-05-12T01:00:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Lobster to powłoka przepływów pracy, która pozwala OpenClaw uruchamiać wieloetapowe sekwencje narzędzi jako pojedynczą, deterministyczną operację z jawnymi punktami kontrolnymi zatwierdzeń.

Lobster jest warstwą autorską ponad odłączoną pracą w tle. Informacje o orkiestracji przepływów ponad pojedynczymi zadaniami znajdziesz w [Task Flow](/pl/automation/taskflow) (`openclaw tasks flow`). Informacje o rejestrze aktywności zadań znajdziesz w [`openclaw tasks`](/pl/automation/tasks).

## Punkt zaczepienia

Twój asystent może zbudować narzędzia, które zarządzają nim samym. Poproś o przepływ pracy, a 30 minut później masz CLI oraz potoki uruchamiane jednym wywołaniem. Lobster jest brakującym elementem: deterministyczne potoki, jawne zatwierdzenia i wznawialny stan.

## Dlaczego

Obecnie złożone przepływy pracy wymagają wielu wywołań narzędzi w obie strony. Każde wywołanie kosztuje tokeny, a LLM musi orkiestratorować każdy krok. Lobster przenosi tę orkiestrację do typowanego środowiska uruchomieniowego:

- **Jedno wywołanie zamiast wielu**: OpenClaw uruchamia jedno wywołanie narzędzia Lobster i otrzymuje ustrukturyzowany wynik.
- **Wbudowane zatwierdzenia**: Efekty uboczne (wysłanie e-maila, opublikowanie komentarza) zatrzymują przepływ pracy do czasu jawnego zatwierdzenia.
- **Wznawialność**: Zatrzymane przepływy pracy zwracają token; zatwierdź i wznów bez ponownego uruchamiania wszystkiego.

## Dlaczego DSL zamiast zwykłych programów?

Lobster jest celowo mały. Celem nie jest „nowy język”, lecz przewidywalna, przyjazna dla AI specyfikacja potoku z pierwszorzędną obsługą zatwierdzeń i tokenów wznowienia.

- **Zatwierdzanie/wznawianie jest wbudowane**: Zwykły program może poprosić człowieka o decyzję, ale nie potrafi _wstrzymać się i wznowić_ z trwałym tokenem bez tworzenia takiego środowiska uruchomieniowego od podstaw.
- **Determinizm + audytowalność**: Potoki są danymi, więc łatwo je logować, porównywać, odtwarzać i sprawdzać.
- **Ograniczona powierzchnia dla AI**: Mała gramatyka + przekazywanie JSON ograniczają „kreatywne” ścieżki kodu i czynią walidację realistyczną.
- **Wbudowana polityka bezpieczeństwa**: Limity czasu, limity wyjścia, kontrole piaskownicy i listy dozwolonych elementów są egzekwowane przez środowisko uruchomieniowe, a nie przez każdy skrypt.
- **Nadal programowalne**: Każdy krok może wywołać dowolny CLI lub skrypt. Jeśli chcesz JS/TS, generuj pliki `.lobster` z kodu.

## Jak to działa

OpenClaw uruchamia przepływy pracy Lobster **w procesie** za pomocą osadzonego runnera. Nie jest uruchamiany zewnętrzny podproces CLI; silnik przepływu pracy wykonuje się wewnątrz procesu Gateway i zwraca bezpośrednio kopertę JSON.
Jeśli potok zostanie wstrzymany w celu zatwierdzenia, narzędzie zwróci `resumeToken`, aby można było kontynuować później.

## Wzorzec: mały CLI + potoki JSON + zatwierdzenia

Buduj małe polecenia, które komunikują się przez JSON, a następnie łącz je w pojedyncze wywołanie Lobster. (Nazwy przykładowych poleceń poniżej — zastąp je własnymi).

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

Jeśli potok zażąda zatwierdzenia, wznów go z tokenem:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI wyzwala przepływ pracy; Lobster wykonuje kroki. Bramki zatwierdzeń utrzymują efekty uboczne jako jawne i audytowalne.

Przykład: mapowanie elementów wejściowych na wywołania narzędzi:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Kroki LLM tylko JSON (llm-task)

Dla przepływów pracy, które wymagają **ustrukturyzowanego kroku LLM**, włącz opcjonalne narzędzie pluginu `llm-task` i wywołuj je z Lobster. Dzięki temu przepływ pracy pozostaje deterministyczny, a jednocześnie pozwala klasyfikować, streszczać i szkicować za pomocą modelu.

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

### Ważne ograniczenie: osadzony Lobster kontra `openclaw.invoke`

Dołączony Plugin Lobster uruchamia przepływy pracy **w procesie** wewnątrz Gateway. W tym trybie osadzonym `openclaw.invoke` **nie** dziedziczy automatycznie adresu URL Gateway ani kontekstu uwierzytelnienia dla zagnieżdżonych wywołań narzędzi CLI OpenClaw.

Oznacza to, że ten wzorzec **nie jest obecnie niezawodny w osadzonym runnerze**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Używaj przykładu poniżej tylko wtedy, gdy uruchamiasz **samodzielny CLI Lobster** w środowisku, w którym `openclaw.invoke` jest już skonfigurowane z prawidłowym kontekstem Gateway/uwierzytelnienia.

Użyj go w samodzielnym potoku CLI Lobster:

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

Jeśli dziś używasz osadzonego pluginu Lobster, preferuj jedno z poniższych:

- bezpośrednie wywołanie narzędzia `llm-task` poza Lobster albo
- kroki inne niż `openclaw.invoke` wewnątrz potoku Lobster, dopóki nie zostanie dodany obsługiwany osadzony most.

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
- `condition` (lub `when`) może bramkować kroki na podstawie `$step.approved`.

## Instalacja Lobster

Dołączone przepływy pracy Lobster uruchamiają się w procesie; osobny plik binarny `lobster` nie jest wymagany. Osadzony runner jest dostarczany z pluginem Lobster.

Jeśli potrzebujesz samodzielnego CLI Lobster do developmentu lub zewnętrznych potoków, zainstaluj go z [repozytorium Lobster](https://github.com/openclaw/lobster) i upewnij się, że `lobster` znajduje się w `PATH`.

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

Unikaj używania `tools.allow: ["lobster"]`, chyba że zamierzasz działać w restrykcyjnym trybie listy dozwolonych elementów.

<Note>
Listy dozwolonych elementów są opt-in dla opcjonalnych pluginów. `alsoAllow` włącza tylko nazwane opcjonalne narzędzia pluginów, zachowując normalny zestaw narzędzi rdzenia. Aby ograniczyć narzędzia rdzenia, użyj `tools.allow` z narzędziami lub grupami rdzenia, których chcesz używać.
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
- `argsJson`: Ciąg JSON przekazywany do `lobster run --args-json` (tylko pliki przepływu pracy).

## Koperta wyjścia

Lobster zwraca kopertę JSON z jednym z trzech statusów:

- `ok` → zakończono pomyślnie
- `needs_approval` → wstrzymano; `requiresApproval.resumeToken` jest wymagany do wznowienia
- `cancelled` → jawnie odrzucono lub anulowano

Narzędzie udostępnia kopertę zarówno w `content` (ładnie sformatowany JSON), jak i `details` (surowy obiekt).

## Zatwierdzenia

Jeśli obecne jest `requiresApproval`, sprawdź komunikat i zdecyduj:

- `approve: true` → wznów i kontynuuj efekty uboczne
- `approve: false` → anuluj i sfinalizuj przepływ pracy

Użyj `approve --preview-from-stdin --limit N`, aby dołączyć podgląd JSON do żądań zatwierdzenia bez własnego kleju jq/heredoc. Tokeny wznowienia są teraz kompaktowe: Lobster przechowuje stan wznowienia przepływu pracy w swoim katalogu stanu i zwraca mały klucz tokenu.

## OpenProse

OpenProse dobrze współdziała z Lobster: użyj `/prose`, aby orkiestratorować przygotowanie wieloagentowe, a następnie uruchom potok Lobster dla deterministycznych zatwierdzeń. Jeśli program Prose potrzebuje Lobster, zezwól na narzędzie `lobster` dla podagentów przez `tools.subagents.tools`. Zobacz [OpenProse](/pl/prose).

## Bezpieczeństwo

- **Tylko lokalnie w procesie** — przepływy pracy wykonują się wewnątrz procesu Gateway; sam plugin nie wykonuje wywołań sieciowych.
- **Brak sekretów** — Lobster nie zarządza OAuth; wywołuje narzędzia OpenClaw, które to robią.
- **Świadomy piaskownicy** — wyłączony, gdy kontekst narzędzia jest w piaskownicy.
- **Utwardzony** — limity czasu i limity wyjścia egzekwowane przez osadzonego runnera.

## Rozwiązywanie problemów

- **`lobster timed out`** → zwiększ `timeoutMs` albo podziel długi potok.
- **`lobster output exceeded maxStdoutBytes`** → zwiększ `maxStdoutBytes` albo zmniejsz rozmiar wyjścia.
- **`lobster returned invalid JSON`** → upewnij się, że potok działa w trybie narzędzia i wypisuje tylko JSON.
- **`lobster failed`** → sprawdź logi Gateway pod kątem szczegółów błędu osadzonego runnera.

## Dowiedz się więcej

- [Pluginy](/pl/tools/plugin)
- [Tworzenie narzędzi pluginów](/pl/plugins/building-plugins#registering-agent-tools)

## Studium przypadku: przepływy pracy społeczności

Jeden publiczny przykład: CLI „drugiego mózgu” + potoki Lobster, które zarządzają trzema skarbcami Markdown (osobistym, partnera, współdzielonym). CLI emituje JSON dla statystyk, list skrzynki odbiorczej i skanów nieaktualnych treści; Lobster łączy te polecenia w przepływy pracy takie jak `weekly-review`, `inbox-triage`, `memory-consolidation` i `shared-task-sync`, każdy z bramkami zatwierdzeń. AI obsługuje osąd (kategoryzację), gdy jest dostępna, a gdy nie jest, wraca do deterministycznych reguł.

- Wątek: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repozytorium: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Powiązane

- [Automatyzacja](/pl/automation) — planowanie przepływów pracy Lobster
- [Omówienie automatyzacji](/pl/automation) — wszystkie mechanizmy automatyzacji
- [Omówienie narzędzi](/pl/tools) — wszystkie dostępne narzędzia agentów
