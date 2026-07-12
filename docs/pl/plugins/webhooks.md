---
read_when:
    - Chcesz uruchamiać TaskFlows lub sterować nimi z systemu zewnętrznego
    - Konfigurujesz dołączony Plugin Webhooków
summary: 'Plugin Webhooków: uwierzytelniony punkt wejścia TaskFlow dla zaufanej automatyzacji zewnętrznej'
title: Plugin Webhooków
x-i18n:
    generated_at: "2026-07-12T15:32:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 081ccbb4ca60234b20f4db7379395bdc51e7203caad4c0a88f292989ca18b28e
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks dodaje uwierzytelnione trasy HTTP, dzięki którym zaufany system
zewnętrzny (Zapier, n8n, zadanie CI, usługa wewnętrzna) może tworzyć i sterować
zarządzanymi TaskFlows OpenClaw przez HTTP bez pisania niestandardowego pluginu.

Plugin działa wewnątrz procesu Gateway. W przypadku zdalnego Gateway zainstaluj
i skonfiguruj go na tym hoście, a następnie uruchom ponownie Gateway. Domyślnie
nie ma skonfigurowanych żadnych tras, więc nie wykonuje żadnych działań, dopóki
nie dodasz co najmniej jednej trasy.

## Konfigurowanie tras

Ustaw konfigurację w `plugins.entries.webhooks.config`:

```json5
{
  plugins: {
    entries: {
      webhooks: {
        enabled: true,
        config: {
          routes: {
            zapier: {
              path: "/plugins/webhooks/zapier",
              sessionKey: "agent:main:main",
              secret: {
                source: "env",
                provider: "default",
                id: "OPENCLAW_WEBHOOK_SECRET",
              },
              controllerId: "webhooks/zapier",
              description: "Zapier TaskFlow bridge",
            },
          },
        },
      },
    },
  },
}
```

Pola trasy:

| Pole           | Wymagane | Wartość domyślna              | Uwagi                                              |
| -------------- | -------- | ----------------------------- | -------------------------------------------------- |
| `enabled`      | nie      | `true`                        |                                                    |
| `path`         | nie      | `/plugins/webhooks/<routeId>` | Musi być unikatowe wśród tras.                     |
| `sessionKey`   | tak      | -                             | Sesja będąca właścicielem powiązanych TaskFlows.   |
| `secret`       | tak      | -                             | Zwykły ciąg znaków lub SecretRef (poniżej).        |
| `controllerId` | nie      | `webhooks/<routeId>`          | Używane jako domyślny kontroler `create_flow`.      |
| `description`  | nie      | -                             | Wyłącznie uwaga dla operatora.                     |

`secret` przyjmuje zwykły ciąg znaków lub SecretRef: `{ source: "env" | "file" | "exec", provider: "default", id: "..." }`.

Każda skonfigurowana trasa jest rejestrowana podczas uruchamiania niezależnie
od tego, czy jej sekret można w danej chwili rozpoznać. Sekret, którego nie
można rozpoznać, nie wyłącza ani nie pomija trasy — żądania do niej nie
przechodzą uwierzytelniania (`401`), dopóki rozpoznanie sekretu nie stanie się
możliwe. Wartości SecretRef są rozpoznawane ponownie przy każdym żądaniu, więc
rotacja źródłowego sekretu (zmiennej środowiskowej, pliku lub wyniku polecenia)
zaczyna obowiązywać bez ponownego uruchamiania Gateway.

## Model zabezpieczeń

Każda trasa działa z uprawnieniami TaskFlow skonfigurowanego `sessionKey`: może
sprawdzać i modyfikować dowolny TaskFlow należący do tej sesji. Dostęp do
TaskFlow zawsze odbywa się przez
`api.runtime.tasks.managedFlows.bindSession(...)`, dlatego trasa nigdy nie może
działać poza powiązaną sesją. Aby ograniczyć zasięg potencjalnych szkód:

- Używaj silnego, unikatowego sekretu dla każdej trasy.
- Preferuj SecretRef zamiast jawnego sekretu umieszczonego bezpośrednio w konfiguracji.
- Powiąż trasy z sesją o najwęższym zakresie odpowiednim dla przepływu pracy.
- Udostępniaj tylko konkretną ścieżkę Webhooka, której potrzebujesz.

Kolejność obsługi żądania dla każdej ścieżki: sprawdzenie metody HTTP (wyłącznie
`POST`) i `Content-Type: application/json`, następnie ograniczenie częstotliwości
w stałym oknie (120 żądań na 60-sekundowe okno dla każdego klucza
ścieżka+adres-IP-klienta, maksymalnie 4096 śledzonych kluczy), następnie
ograniczenie liczby trwających żądań (8 równoczesnych żądań na klucz,
maksymalnie 4096 śledzonych kluczy), następnie uwierzytelnienie współdzielonym
sekretem, a na końcu odczyt treści JSON z limitem 256 KB i 15 sekund. Żądania,
które nie przejdą wcześniejszej kontroli, nigdy nie docierają do kolejnych.

## Format żądania

Wysyłaj żądania `POST` z `Content-Type: application/json` oraz nagłówkiem
`Authorization: Bearer <secret>` albo `x-openclaw-webhook-secret: <secret>`:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Obsługiwane akcje

| Akcja              | Przeznaczenie                                                              |
| ------------------ | -------------------------------------------------------------------------- |
| `create_flow`      | Tworzy zarządzany TaskFlow dla sesji trasy.                                |
| `get_flow`         | Pobiera jeden TaskFlow według identyfikatora.                              |
| `list_flows`       | Wyświetla listę TaskFlows dla sesji trasy.                                 |
| `find_latest_flow` | Pobiera ostatnio zaktualizowany TaskFlow.                                  |
| `resolve_flow`     | Rozpoznaje TaskFlow na podstawie nieprzezroczystego tokenu.                |
| `get_task_summary` | Pobiera podsumowanie zadania dla TaskFlow.                                 |
| `set_waiting`      | Oznacza TaskFlow jako oczekujący, opcjonalnie ze stanem/danymi oczekiwania. |
| `resume_flow`      | Wznawia oczekujący/zablokowany TaskFlow.                                   |
| `finish_flow`      | Oznacza TaskFlow jako zakończony.                                          |
| `fail_flow`        | Oznacza TaskFlow jako nieudany.                                            |
| `request_cancel`   | Żąda kooperacyjnego anulowania.                                            |
| `cancel_flow`      | Anuluje TaskFlow (może zwrócić `202`, jeśli zadania podrzędne są nadal aktywne). |
| `run_task`         | Tworzy zarządzane zadanie podrzędne w istniejącym TaskFlow.                |

Akcje modyfikujące (`set_waiting`, `resume_flow`, `finish_flow`, `fail_flow`,
`request_cancel`) wymagają pól `flowId` i `expectedRevision` do optymistycznej
kontroli współbieżności; nieaktualna rewizja powoduje zwrócenie
`409 revision_conflict`.

### `create_flow`

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Dozwolone wartości `runtime`: `subagent`, `acp`. Pola `startedAt`, `lastEventAt`
i `progressSummary` są prawidłowe tylko wtedy, gdy `status` ma wartość
`"running"`; wysłanie ich z dowolnym innym statusem powoduje zwrócenie
`400 invalid_request`.

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Struktura odpowiedzi

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Widoki przepływów i zadań nigdy nie zawierają metadanych właściciela ani sesji,
dlatego odpowiedzi nie mogą ujawnić powiązanego z trasą `sessionKey`. Wartości
`code` obejmują `not_found`, `not_managed`, `revision_conflict`,
`persist_failed`, `cancel_requested`, `cancel_pending`, `terminal`,
`invalid_request`, `request_rejected` oraz kody rezerwowe specyficzne dla akcji
(`mutation_rejected`, `create_rejected`, `task_not_created`, `cancel_rejected`),
gdy modyfikacja zostanie odrzucona z powodu nieobjętego wymienionymi wyżej
kodami.

## Powiązane materiały

- [Hooki](/pl/automation/hooks) — wewnętrzne hooki sterowane zdarzeniami w porównaniu z tym mostem TaskFlow opartym na HTTP
- [Webhooki Gateway (konfiguracja `hooks.*`)](/pl/automation/cron-jobs#webhooks) — oddzielna, ogólna funkcja punktu końcowego HTTP Gateway; nie jest tym samym co trasy tego pluginu
- [SDK środowiska uruchomieniowego pluginów](/pl/plugins/sdk-runtime)
- [Webhooki CLI](/pl/cli/webhooks)
