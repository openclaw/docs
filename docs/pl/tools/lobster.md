---
read_when:
    - Chcesz deterministycznych, wieloetapowych przepływów pracy z jawnymi zatwierdzeniami
    - Musisz wznowić przepływ pracy bez ponownego wykonywania wcześniejszych kroków
summary: Typowane środowisko uruchomieniowe przepływów pracy dla OpenClaw z wznawialnymi bramkami zatwierdzania.
title: Homar
x-i18n:
    generated_at: "2026-05-07T13:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster to powłoka przepływów pracy, która pozwala OpenClaw uruchamiać wieloetapowe sekwencje narzędzi jako pojedynczą, deterministyczną operację z jawnymi punktami zatwierdzenia.

Lobster to warstwa autorska nad odłączoną pracą w tle. Informacje o orkiestracji przepływu ponad pojedynczymi zadaniami znajdziesz w [Task Flow](/pl/automation/taskflow) (`openclaw tasks flow`). Informacje o dzienniku aktywności zadań znajdziesz w [`openclaw tasks`](/pl/automation/tasks).

## Hook

Twój asystent może tworzyć narzędzia, które zarządzają nim samym. Poproś o przepływ pracy, a 30 minut później masz CLI oraz potoki uruchamiane jednym wywołaniem. Lobster to brakujący element: deterministyczne potoki, jawne zatwierdzenia i wznawialny stan.

## Dlaczego

Obecnie złożone przepływy pracy wymagają wielu wymian wywołań narzędzi. Każde wywołanie kosztuje tokeny, a LLM musi orkiestracji każdy krok. Lobster przenosi tę orkiestrację do typowanego środowiska uruchomieniowego:

- **Jedno wywołanie zamiast wielu**: OpenClaw uruchamia jedno wywołanie narzędzia Lobster i otrzymuje strukturalny wynik.
- **Wbudowane zatwierdzenia**: Skutki uboczne (wysłanie e-maila, opublikowanie komentarza) zatrzymują przepływ pracy do czasu jawnego zatwierdzenia.
- **Wznawialność**: Zatrzymane przepływy pracy zwracają token; zatwierdź i wznów bez ponownego uruchamiania wszystkiego.

## Dlaczego DSL zamiast zwykłych programów?

Lobster jest celowo mały. Celem nie jest „nowy język”, lecz przewidywalna, przyjazna dla AI specyfikacja potoku z pierwszorzędną obsługą zatwierdzeń i tokenów wznawiania.

- **Zatwierdzanie/wznawianie jest wbudowane**: Zwykły program może poprosić człowieka o decyzję, ale nie może _wstrzymać się i wznowić_ z trwałym tokenem bez tworzenia przez Ciebie takiego środowiska uruchomieniowego.
- **Determinizm i audytowalność**: Potoki są danymi, więc łatwo je rejestrować, porównywać, odtwarzać i przeglądać.
- **Ograniczona powierzchnia dla AI**: Niewielka gramatyka i przekazywanie JSON ograniczają „kreatywne” ścieżki kodu i sprawiają, że walidacja jest realistyczna.
- **Wbudowana polityka bezpieczeństwa**: Limity czasu, limity wyjścia, kontrole piaskownicy i listy dozwolonych elementów są egzekwowane przez środowisko uruchomieniowe, a nie przez każdy skrypt.
- **Nadal programowalne**: Każdy krok może wywołać dowolne CLI lub skrypt. Jeśli chcesz JS/TS, generuj pliki `.lobster` z kodu.

## Jak to działa

OpenClaw uruchamia przepływy pracy Lobster **w procesie**, używając osadzonego runnera. Nie jest uruchamiany żaden zewnętrzny podproces CLI; silnik przepływu pracy wykonuje się wewnątrz procesu Gateway i bezpośrednio zwraca kopertę JSON.
Jeśli potok wstrzyma się w oczekiwaniu na zatwierdzenie, narzędzie zwraca `resumeToken`, aby można było kontynuować później.

## Wzorzec: małe CLI + potoki JSON + zatwierdzenia

Buduj małe polecenia, które komunikują się przez JSON, a następnie łącz je w jedno wywołanie Lobster. (Nazwy przykładowych poleceń poniżej - podmień je na własne).

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

Jeśli potok poprosi o zatwierdzenie, wznów go za pomocą tokenu:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

AI wyzwala przepływ pracy; Lobster wykonuje kroki. Bramki zatwierdzeń utrzymują skutki uboczne jako jawne i audytowalne.

Przykład: mapowanie elementów wejściowych na wywołania narzędzi:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Kroki LLM wyłącznie w JSON (`llm-task`)

W przypadku przepływów pracy, które wymagają **strukturalnego kroku LLM**, włącz opcjonalne narzędzie pluginu `llm-task` i wywołuj je z Lobster. Dzięki temu przepływ pracy pozostaje deterministyczny, a jednocześnie nadal pozwala klasyfikować/podsumowywać/tworzyć szkice przy użyciu modelu.

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

### Ważne ograniczenie: osadzony Lobster a `openclaw.invoke`

Dołączony plugin Lobster uruchamia przepływy pracy **w procesie** wewnątrz Gateway. W tym trybie osadzonym `openclaw.invoke` **nie** dziedziczy automatycznie adresu URL Gateway ani kontekstu uwierzytelniania dla zagnieżdżonych wywołań narzędzi OpenClaw CLI.

Oznacza to, że ten wzorzec **nie jest obecnie niezawodny w osadzonym runnerze**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Używaj poniższego przykładu tylko wtedy, gdy uruchamiasz **samodzielne CLI Lobster** w środowisku, w którym `openclaw.invoke` jest już skonfigurowane z poprawnym kontekstem Gateway/uwierzytelniania.

Użyj go w samodzielnym potoku Lobster CLI:

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

Jeśli obecnie używasz osadzonego pluginu Lobster, preferuj jedną z tych opcji:

- bezpośrednie wywołanie narzędzia `llm-task` poza Lobster albo
- kroki bez `openclaw.invoke` wewnątrz potoku Lobster do czasu dodania obsługiwanego mostka osadzonego.

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

- `stdin: $step.stdout` i `stdin: $step.json` przekazują wyjście wcześniejszego kroku.
- `condition` (lub `when`) może uzależniać wykonanie kroków od `$step.approved`.

## Instalacja Lobster

Dołączone przepływy pracy Lobster działają w procesie; osobny plik binarny `lobster` nie jest wymagany. Osadzony runner jest dostarczany z pluginem Lobster.

Jeśli potrzebujesz samodzielnego Lobster CLI do programowania lub zewnętrznych potoków, zainstaluj je z [repozytorium Lobster](https://github.com/openclaw/lobster) i upewnij się, że `lobster` znajduje się w `PATH`.

## Włączenie narzędzia

Lobster jest **opcjonalnym** narzędziem pluginu (domyślnie niewłączonym).

Zalecane (addytywne, bezpieczne):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Albo dla konkretnego agenta:

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
Listy dozwolonych elementów są opcjonalne dla opcjonalnych pluginów. `alsoAllow` włącza tylko wskazane opcjonalne narzędzia pluginów, zachowując normalny zestaw narzędzi rdzenia. Aby ograniczyć narzędzia rdzenia, użyj `tools.allow` z wybranymi narzędziami lub grupami rdzenia.
</Note>

## Przykład: klasyfikacja e-maili

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

- `cwd`: Względny katalog roboczy dla potoku (musi pozostać w katalogu roboczym Gateway).
- `timeoutMs`: Przerwij przepływ pracy, jeśli przekroczy ten czas trwania (domyślnie: 20000).
- `maxStdoutBytes`: Przerwij przepływ pracy, jeśli wyjście przekroczy ten rozmiar (domyślnie: 512000).
- `argsJson`: Ciąg JSON przekazywany do `lobster run --args-json` (tylko pliki przepływów pracy).

## Koperta wyjściowa

Lobster zwraca kopertę JSON z jednym z trzech statusów:

- `ok` → zakończono pomyślnie
- `needs_approval` → wstrzymano; `requiresApproval.resumeToken` jest wymagany do wznowienia
- `cancelled` → jawnie odrzucono lub anulowano

Narzędzie udostępnia kopertę zarówno w `content` (sformatowany JSON), jak i w `details` (surowy obiekt).

## Zatwierdzenia

Jeśli obecne jest `requiresApproval`, sprawdź prompt i zdecyduj:

- `approve: true` → wznów i kontynuuj skutki uboczne
- `approve: false` → anuluj i sfinalizuj przepływ pracy

Użyj `approve --preview-from-stdin --limit N`, aby dołączyć podgląd JSON do żądań zatwierdzenia bez własnego łączenia jq/heredoc. Tokeny wznawiania są teraz kompaktowe: Lobster przechowuje stan wznawiania przepływu pracy w swoim katalogu stanu i zwraca mały klucz tokenu.

## OpenProse

OpenProse dobrze współpracuje z Lobster: użyj `/prose`, aby orkiestracji przygotowanie wielu agentów, a następnie uruchom potok Lobster dla deterministycznych zatwierdzeń. Jeśli program Prose potrzebuje Lobster, zezwól podagentom na narzędzie `lobster` przez `tools.subagents.tools`. Zobacz [OpenProse](/pl/prose).

## Bezpieczeństwo

- **Tylko lokalnie w procesie** - przepływy pracy wykonują się wewnątrz procesu Gateway; sam plugin nie wykonuje wywołań sieciowych.
- **Bez sekretów** - Lobster nie zarządza OAuth; wywołuje narzędzia OpenClaw, które to robią.
- **Świadomy piaskownicy** - wyłączony, gdy kontekst narzędzia działa w piaskownicy.
- **Utwardzony** - limity czasu i limity wyjścia egzekwowane przez osadzonego runnera.

## Rozwiązywanie problemów

- **`lobster timed out`** → zwiększ `timeoutMs` albo podziel długi potok.
- **`lobster output exceeded maxStdoutBytes`** → zwiększ `maxStdoutBytes` albo zmniejsz rozmiar wyjścia.
- **`lobster returned invalid JSON`** → upewnij się, że potok działa w trybie narzędzia i wypisuje wyłącznie JSON.
- **`lobster failed`** → sprawdź logi Gateway, aby znaleźć szczegóły błędu osadzonego runnera.

## Dowiedz się więcej

- [Pluginy](/pl/tools/plugin)
- [Tworzenie narzędzi pluginów](/pl/plugins/building-plugins#registering-agent-tools)

## Studium przypadku: przepływy pracy społeczności

Jeden publiczny przykład: CLI „drugi mózg” i potoki Lobster zarządzające trzema sejfami Markdown (osobistym, partnera, wspólnym). CLI emituje JSON dla statystyk, list skrzynki odbiorczej i skanów nieaktualnych elementów; Lobster łączy te polecenia w przepływy pracy, takie jak `weekly-review`, `inbox-triage`, `memory-consolidation` i `shared-task-sync`, każdy z bramkami zatwierdzeń. AI obsługuje ocenę (kategoryzację), gdy jest dostępna, i wraca do deterministycznych reguł, gdy nie jest.

- Wątek: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repozytorium: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Powiązane

- [Automatyzacja i zadania](/pl/automation) - planowanie przepływów pracy Lobster
- [Przegląd automatyzacji](/pl/automation) - wszystkie mechanizmy automatyzacji
- [Przegląd narzędzi](/pl/tools) - wszystkie dostępne narzędzia agenta
