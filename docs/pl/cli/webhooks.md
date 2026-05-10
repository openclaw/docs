---
read_when:
    - Chcesz podłączyć zdarzenia Gmail Pub/Sub do OpenClaw
    - Potrzebna jest pełna lista flag i wartości domyślnych
summary: Dokumentacja CLI dla `openclaw webhooks` (konfiguracja Gmail Pub/Sub i program uruchamiający)
title: Webhooki
x-i18n:
    generated_at: "2026-05-10T19:30:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ce17ca78bbe9836edd4643a262833e52cceb27f441d5922c036777e47a6f74
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Pomocniki i integracje Webhook. Obecnie ten obszar jest ograniczony do przepływów Gmail Pub/Sub, które integrują się z dołączonym obserwatorem `gog`.

## Podpolecenia

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Podpolecenie  | Opis                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `gmail setup` | Skonfiguruj obserwację Gmail, temat/subskrypcję Pub/Sub oraz cel dostarczania Webhook OpenClaw. |
| `gmail run`   | Uruchom `gog watch serve` oraz pętlę automatycznego odnawiania obserwacji.                   |

## `webhooks gmail setup`

Skonfiguruj obserwację Gmail, Pub/Sub i dostarczanie Webhook OpenClaw.

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

### Wymagane

| Flaga               | Opis                         |
| ------------------- | ---------------------------- |
| `--account <email>` | Konto Gmail do obserwowania. |

### Opcje Pub/Sub

| Flaga                   | Wartość domyślna       | Opis                                                       |
| ----------------------- | ---------------------- | ---------------------------------------------------------- |
| `--project <id>`        | (brak)                 | Identyfikator projektu GCP (właściciel klienta OAuth).     |
| `--topic <name>`        | `gog-gmail-watch`      | Nazwa tematu Pub/Sub.                                      |
| `--subscription <name>` | `gog-gmail-watch-push` | Nazwa subskrypcji Pub/Sub.                                 |
| `--label <label>`       | `INBOX`                | Etykieta Gmail do obserwowania.                            |
| `--push-endpoint <url>` | (brak)                 | Jawny punkt końcowy push Pub/Sub. Zastępuje Tailscale.     |

### Opcje dostarczania OpenClaw

| Flaga                  | Wartość domyślna | Opis                                  |
| ---------------------- | ---------------- | ------------------------------------- |
| `--hook-url <url>`     | (brak)           | URL Webhook OpenClaw.                 |
| `--hook-token <token>` | (brak)           | Token Webhook OpenClaw.               |
| `--push-token <token>` | (brak)           | Token push przekazywany do `gog watch serve`. |

### Opcje `gog watch serve`

| Flaga                 | Wartość domyślna | Opis                                                                    |
| --------------------- | ---------------- | ----------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`      | Host powiązania `gog watch serve`.                                      |
| `--port <port>`       | `8788`           | Port `gog watch serve`.                                                 |
| `--path <path>`       | `/gmail-pubsub`  | Ścieżka `gog watch serve`.                                              |
| `--include-body`      | `true`           | Uwzględniaj fragmenty treści e-maili. Przekaż `--no-include-body`, aby wyłączyć. |
| `--max-bytes <n>`     | `20000`          | Maksymalna liczba bajtów na fragment treści.                            |
| `--renew-minutes <n>` | `720` (12h)      | Odnawiaj obserwację Gmail co N minut.                                   |

### Udostępnianie przez Tailscale

| Flaga                     | Wartość domyślna | Opis                                                                        |
| ------------------------- | ---------------- | --------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`         | Udostępnij punkt końcowy push przez tailscale: `funnel`, `serve` lub `off`. |
| `--tailscale-path <path>` | (brak)           | Ścieżka dla tailscale serve/funnel.                                         |
| `--tailscale-target <t>`  | (brak)           | Cel Tailscale serve/funnel (port, `host:port` lub URL).                     |

### Dane wyjściowe

| Flaga    | Opis                                             |
| -------- | ------------------------------------------------ |
| `--json` | Wypisz podsumowanie czytelne maszynowo zamiast tekstu. |

## `webhooks gmail run`

Uruchom `gog watch serve` oraz pętlę automatycznego odnawiania obserwacji na pierwszym planie.

```bash
openclaw webhooks gmail run --account you@example.com
```

`run` akceptuje te same flagi `gog watch serve`, dostarczania OpenClaw, Pub/Sub i Tailscale co `setup`, z wyjątkiem:

- `--account` jest **opcjonalne** dla `run` (używa skonfigurowanego konta jako wartości zastępczej).
- `run` **nie** akceptuje `--project`, `--push-endpoint` ani `--json`.
- Flagi `run` nie mają wbudowanych wartości domyślnych; brakujące wartości używają wartości zapisanych przez `setup`.

| Kategoria             | Flagi                                                                            |
| --------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub               | `--account`, `--topic`, `--subscription`, `--label`                              |
| Dostarczanie OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`     | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale             | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Dla `run` wartość `--topic` to pełna ścieżka tematu Pub/Sub (`projects/.../topics/...`), a nie tylko krótka nazwa tematu.
</Note>

## Przepływ od początku do końca

Zobacz [integrację Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration), aby poznać konfigurację projektu GCP, OAuth i po stronie Gateway, która współdziała z tymi poleceniami CLI.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Automatyzacja Webhook](/pl/automation/cron-jobs)
- [Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration)
