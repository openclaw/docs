---
read_when:
    - Chcesz wywoływać lub sterować TaskFlows z zewnętrznego systemu
    - Konfigurujesz dołączoną wtyczkę webhooks
summary: 'Wtyczka Webhooks: uwierzytelnione wejście TaskFlow dla zaufanej automatyzacji zewnętrznej'
title: Wtyczka Webhooks
x-i18n:
    generated_at: "2026-04-07T09:48:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5da12a887752ec6ee853cfdb912db0ae28512a0ffed06fe3828ef2eee15bc9d
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooks (wtyczka)

Wtyczka Webhooks dodaje uwierzytelnione trasy HTTP, które wiążą zewnętrzną
automatyzację z OpenClaw TaskFlows.

Używaj jej, gdy chcesz, aby zaufany system, taki jak Zapier, n8n, zadanie CI lub
wewnętrzna usługa, tworzył i obsługiwał zarządzane TaskFlows bez konieczności
najpierw pisania własnej wtyczki.

## Gdzie działa

Wtyczka Webhooks działa wewnątrz procesu Gateway.

Jeśli Twój Gateway działa na innej maszynie, zainstaluj i skonfiguruj wtyczkę na
hoście tego Gateway, a następnie uruchom ponownie Gateway.

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
- `sessionKey`: wymagana sesja, do której należą powiązane TaskFlows
- `secret`: wymagany współdzielony sekret lub SecretRef
- `controllerId`: opcjonalny identyfikator kontrolera dla tworzonych zarządzanych flow
- `description`: opcjonalna notatka operatora

Obsługiwane wejścia `secret`:

- Zwykły string
- SecretRef z `source: "env" | "file" | "exec"`

Jeśli trasa oparta na sekrecie nie może rozwiązać swojego sekretu podczas startu, wtyczka pomija
tę trasę i zapisuje ostrzeżenie w logach zamiast udostępniać uszkodzony endpoint.

## Model bezpieczeństwa

Każda trasa jest traktowana jako zaufana i działa z uprawnieniami TaskFlow swojej
skonfigurowanej `sessionKey`.

Oznacza to, że trasa może odczytywać i modyfikować TaskFlows należące do tej sesji, więc
należy:

- Używać silnego, unikalnego sekretu dla każdej trasy
- Preferować odwołania do sekretów zamiast osadzonych jawnych sekretów
- Wiązać trasy z możliwie najwęższą sesją, która pasuje do workflow
- Udostępniać tylko konkretną potrzebną ścieżkę webhook

Wtyczka stosuje:

- Uwierzytelnianie współdzielonym sekretem
- Ograniczenia rozmiaru treści żądania i timeouty
- Ograniczanie szybkości w stałym oknie
- Ograniczanie liczby żądań w locie
- Dostęp do TaskFlow powiązany z właścicielem przez `api.runtime.taskFlow.bindSession(...)`

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

Wtyczka obecnie akceptuje te wartości JSON `action`:

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

Tworzy zarządzane zadanie podrzędne wewnątrz istniejącego zarządzanego TaskFlow.

Dozwolone runtime to:

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

Wtyczka celowo usuwa metadane właściciela/sesji z odpowiedzi webhook.

## Powiązana dokumentacja

- [Plugin runtime SDK](/pl/plugins/sdk-runtime)
- [Przegląd Hooks i webhooks](/pl/automation/hooks)
- [CLI webhooks](/cli/webhooks)
