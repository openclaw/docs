---
read_when:
    - Chcesz wyzwalać lub sterować przepływami TaskFlow z systemu zewnętrznego
    - Konfigurujesz dołączony plugin webhooków
summary: 'Plugin Webhooks: uwierzytelnione wejście TaskFlow dla zaufanej automatyzacji zewnętrznej'
title: Plugin Webhooks
x-i18n:
    generated_at: "2026-05-06T17:59:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d21d96f680fa24d4a53c1ed5759f800d3cfdc3336789c42c15266edd8ce9e80
    source_path: plugins/webhooks.md
    workflow: 16
---

Plugin Webhooks dodaje uwierzytelnione trasy HTTP, które łączą zewnętrzną
automatyzację z TaskFlow OpenClaw.

Użyj go, gdy chcesz, aby zaufany system, taki jak Zapier, n8n, zadanie CI lub
usługa wewnętrzna, tworzył i obsługiwał zarządzane TaskFlow bez wcześniejszego
pisania niestandardowego pluginu.

## Gdzie działa

Plugin Webhooks działa wewnątrz procesu Gateway.

Jeśli Twój Gateway działa na innym komputerze, zainstaluj i skonfiguruj plugin
na tym hoście Gateway, a następnie uruchom ponownie Gateway.

## Konfigurowanie tras

Ustaw konfigurację pod `plugins.entries.webhooks.config`:

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
              description: "Most TaskFlow Zapier",
            },
          },
        },
      },
    },
  },
}
```

Pola trasy:

- `enabled`: opcjonalne, domyślnie `true`
- `path`: opcjonalne, domyślnie `/plugins/webhooks/<routeId>`
- `sessionKey`: wymagana sesja, która jest właścicielem powiązanych TaskFlow
- `secret`: wymagany współdzielony sekret lub SecretRef
- `controllerId`: opcjonalny identyfikator kontrolera dla utworzonych zarządzanych przepływów
- `description`: opcjonalna notatka operatora

Obsługiwane dane wejściowe `secret`:

- Zwykły ciąg znaków
- SecretRef z `source: "env" | "file" | "exec"`

Jeśli trasa oparta na sekrecie nie może rozwiązać swojego sekretu podczas uruchamiania,
plugin pomija tę trasę i rejestruje ostrzeżenie zamiast udostępniać niedziałający punkt końcowy.

## Model zabezpieczeń

Każda trasa jest zaufana do działania z uprawnieniami TaskFlow skonfigurowanego
`sessionKey`.

Oznacza to, że trasa może sprawdzać i modyfikować TaskFlow należące do tej sesji, więc
należy:

- Używać silnego, unikalnego sekretu dla każdej trasy
- Preferować odwołania do sekretów zamiast sekretów zapisanych jawnie w konfiguracji
- Wiązać trasy z najwęższą sesją pasującą do przepływu pracy
- Udostępniać tylko konkretną ścieżkę Webhook, której potrzebujesz

Plugin stosuje:

- Uwierzytelnianie współdzielonym sekretem
- Ograniczenia rozmiaru treści żądania i czasu oczekiwania
- Limitowanie szybkości w stałym oknie
- Limitowanie równoległych żądań w toku
- Dostęp do TaskFlow powiązany z właścicielem przez `api.runtime.tasks.managedFlows.bindSession(...)`

## Format żądania

Wysyłaj żądania `POST` z:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` lub `x-openclaw-webhook-secret: <secret>`

Przykład:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Obsługiwane akcje

Plugin obecnie akceptuje następujące wartości JSON `action`:

- `create_flow`
- `get_flow`
- `list_flows`
- `find_latest_flow`
- `resolve_flow`
- `get_task_summary`
- `set_waiting`
- `resume_flow`
- `finish_flow`
- `fail_flow`
- `request_cancel`
- `cancel_flow`
- `run_task`

### `create_flow`

Tworzy zarządzany TaskFlow dla sesji powiązanej z trasą.

Przykład:

```json
{
  "action": "create_flow",
  "goal": "Review inbound queue",
  "status": "queued",
  "notifyPolicy": "done_only"
}
```

### `run_task`

Tworzy zarządzane zadanie podrzędne w istniejącym zarządzanym TaskFlow.

Dozwolone środowiska uruchomieniowe to:

- `subagent`
- `acp`

Przykład:

```json
{
  "action": "run_task",
  "flowId": "flow_123",
  "runtime": "acp",
  "childSessionKey": "agent:main:acp:worker",
  "task": "Inspect the next message batch"
}
```

## Kształt odpowiedzi

Pomyślne odpowiedzi zwracają:

```json
{
  "ok": true,
  "routeId": "zapier",
  "result": {}
}
```

Odrzucone żądania zwracają:

```json
{
  "ok": false,
  "routeId": "zapier",
  "code": "not_found",
  "error": "TaskFlow not found.",
  "result": {}
}
```

Plugin celowo usuwa metadane właściciela/sesji z odpowiedzi Webhook.

## Powiązana dokumentacja

- [SDK środowiska uruchomieniowego Plugin](/pl/plugins/sdk-runtime)
- [Omówienie hooków i Webhooków](/pl/automation/hooks)
- [Webhooki CLI](/pl/cli/webhooks)
