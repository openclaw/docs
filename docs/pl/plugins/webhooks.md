---
read_when:
    - Chcesz wyzwalać przepływy TaskFlow lub sterować nimi z systemu zewnętrznego
    - Konfigurujesz dołączony Plugin webhooków
summary: 'Plugin Webhooks: uwierzytelnione wejście TaskFlow dla zaufanej automatyzacji zewnętrznej'
title: Plugin Webhook
x-i18n:
    generated_at: "2026-04-30T10:11:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 70b195e330264af48a9e9c619bb5a0937bb15b2640edd3dd2b5517a13424e9fe
    source_path: plugins/webhooks.md
    workflow: 16
---

# Webhooks (Plugin)

Plugin Webhooks dodaje uwierzytelnione trasy HTTP, które wiążą zewnętrzną automatyzację z TaskFlow OpenClaw.

Użyj go, gdy chcesz, aby zaufany system, taki jak Zapier, n8n, zadanie CI lub usługa wewnętrzna, tworzył i prowadził zarządzane TaskFlow bez wcześniejszego pisania niestandardowego Plugin.

## Gdzie działa

Plugin Webhooks działa wewnątrz procesu Gateway.

Jeśli Twój Gateway działa na innej maszynie, zainstaluj i skonfiguruj Plugin na tym hoście Gateway, a następnie uruchom ponownie Gateway.

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

- `enabled`: opcjonalne, domyślnie `true`
- `path`: opcjonalne, domyślnie `/plugins/webhooks/<routeId>`
- `sessionKey`: wymagana sesja, która jest właścicielem powiązanych TaskFlow
- `secret`: wymagany współdzielony sekret lub SecretRef
- `controllerId`: opcjonalny identyfikator kontrolera dla utworzonych zarządzanych przepływów
- `description`: opcjonalna notatka operatora

Obsługiwane wejścia `secret`:

- Zwykły ciąg tekstowy
- SecretRef z `source: "env" | "file" | "exec"`

Jeśli trasa oparta na sekrecie nie może rozwiązać swojego sekretu podczas uruchamiania, Plugin pomija tę trasę i zapisuje ostrzeżenie w dzienniku zamiast ujawniać uszkodzony punkt końcowy.

## Model bezpieczeństwa

Każda trasa jest zaufana do działania z uprawnieniami TaskFlow skonfigurowanego `sessionKey`.

Oznacza to, że trasa może sprawdzać i modyfikować TaskFlow należące do tej sesji, więc należy:

- Używać silnego, unikalnego sekretu dla każdej trasy
- Preferować odwołania do sekretów zamiast sekretów w postaci zwykłego tekstu w konfiguracji
- Wiązać trasy z najwęższą sesją pasującą do przepływu pracy
- Ujawniać tylko konkretną ścieżkę Webhook, której potrzebujesz

Plugin stosuje:

- Uwierzytelnianie współdzielonym sekretem
- Limity rozmiaru treści żądania i czasu oczekiwania
- Ograniczanie szybkości w stałym oknie
- Ograniczanie liczby równoczesnych żądań
- Powiązany z właścicielem dostęp do TaskFlow przez `api.runtime.tasks.managedFlows.bindSession(...)`

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

Tworzy zarządzany TaskFlow dla powiązanej sesji trasy.

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

Tworzy zarządzane zadanie podrzędne wewnątrz istniejącego zarządzanego TaskFlow.

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
- [Omówienie hooków i Webhook](/pl/automation/hooks)
- [Webhook CLI](/pl/cli/webhooks)
