---
read_when:
    - Chcesz wyzwalać lub sterować TaskFlow z zewnętrznego systemu
    - Konfigurujesz dołączony Plugin Webhooków
summary: 'Plugin Webhooków: uwierzytelnione wejście TaskFlow dla zaufanej automatyzacji zewnętrznej'
title: Plugin Webhooków
x-i18n:
    generated_at: "2026-04-24T09:25:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: a35074f256e0664ee73111bcb93ce1a2311dbd4db2231200a1a385e15ed5e6c4
    source_path: plugins/webhooks.md
    workflow: 15
---

# Webhooki (Plugin)

Plugin Webhooków dodaje uwierzytelnione trasy HTTP, które wiążą zewnętrzną
automatyzację z TaskFlow OpenClaw.

Używaj go, gdy chcesz, aby zaufany system, taki jak Zapier, n8n, zadanie CI albo
usługa wewnętrzna, tworzył i sterował zarządzanymi TaskFlow bez konieczności pisania najpierw własnego
Pluginu.

## Gdzie działa

Plugin Webhooków działa wewnątrz procesu Gateway.

Jeśli twoje Gateway działa na innej maszynie, zainstaluj i skonfiguruj Plugin na
hoście tego Gateway, a następnie uruchom Gateway ponownie.

## Konfiguracja tras

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
              description: "Most TaskFlow dla Zapier",
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
- `secret`: wymagany współdzielony sekret albo SecretRef
- `controllerId`: opcjonalny identyfikator kontrolera dla tworzonych zarządzanych flow
- `description`: opcjonalna notatka dla operatora

Obsługiwane wejścia `secret`:

- Zwykły ciąg znaków
- SecretRef z `source: "env" | "file" | "exec"`

Jeśli trasa oparta na sekrecie nie może rozwiązać swojego sekretu przy uruchomieniu, Plugin pomija
tę trasę i zapisuje ostrzeżenie w logu, zamiast wystawiać uszkodzony punkt końcowy.

## Model bezpieczeństwa

Każda trasa jest uznawana za zaufaną do działania z uprawnieniami TaskFlow swojej skonfigurowanej
`sessionKey`.

Oznacza to, że trasa może sprawdzać i mutować TaskFlow należące do tej sesji, więc
powinieneś:

- Używać silnego unikalnego sekretu dla każdej trasy
- Preferować odwołania do sekretów zamiast jawnych sekretów w tekście jawnym
- Wiązać trasy z najwęższą sesją pasującą do workflow
- Wystawiać tylko konkretną ścieżkę Webhook, której potrzebujesz

Plugin stosuje:

- Uwierzytelnianie współdzielonym sekretem
- Ograniczenia rozmiaru treści żądania i timeouty
- Ograniczanie szybkości w stałym oknie
- Ograniczanie liczby żądań w locie
- Dostęp do TaskFlow powiązany z właścicielem przez `api.runtime.taskFlow.bindSession(...)`

## Format żądania

Wysyłaj żądania `POST` z:

- `Content-Type: application/json`
- `Authorization: Bearer <secret>` albo `x-openclaw-webhook-secret: <secret>`

Przykład:

```bash
curl -X POST https://gateway.example.com/plugins/webhooks/zapier \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_SHARED_SECRET' \
  -d '{"action":"create_flow","goal":"Review inbound queue"}'
```

## Obsługiwane akcje

Plugin obecnie akceptuje te wartości JSON `action`:

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

Dozwolone środowiska wykonawcze:

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

Plugin celowo usuwa metadane właściciela/sesji z odpowiedzi Webhooków.

## Powiązana dokumentacja

- [SDK runtime Pluginów](/pl/plugins/sdk-runtime)
- [Przegląd Hooków i Webhooków](/pl/automation/hooks)
- [Webhooki CLI](/pl/cli/webhooks)
