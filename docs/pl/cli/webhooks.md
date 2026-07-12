---
read_when:
    - Chcesz połączyć zdarzenia Gmail Pub/Sub z OpenClaw
    - Potrzebujesz pełnej listy flag i wartości domyślnych
summary: Dokumentacja CLI dla `openclaw webhooks` (konfiguracja Gmail Pub/Sub i program uruchamiający)
title: Webhooki
x-i18n:
    generated_at: "2026-07-12T15:03:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83fff0ac2ce247402f45523eda0b5cdd551bd65212636118698e45cb8740236c
    source_path: cli/webhooks.md
    workflow: 16
---

# `openclaw webhooks`

Narzędzia pomocnicze i integracje Webhook. Obecnie ten obszar obejmuje przepływy Gmail Pub/Sub oparte na dołączonym obserwatorze `gog`.

## Podpolecenia

```bash
openclaw webhooks gmail setup --account <email> [...]
openclaw webhooks gmail run   [--account <email>] [...]
```

| Podpolecenie   | Opis                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `gmail setup`  | Jednorazowy kreator: obserwowanie Gmaila, temat i subskrypcja Pub/Sub oraz dostarczanie do haka OpenClaw. |
| `gmail run`    | Uruchamia `gog watch serve` wraz z pętlą automatycznego odnawiania obserwowania na pierwszym planie.   |

<Note>
Gateway automatycznie uruchamia również `gog gmail watch serve` podczas startu, gdy ustawiono `hooks.enabled=true` oraz `hooks.gmail.account` (ustawiane przez `gmail setup`). `gmail run` realizuje tę samą logikę na pierwszym planie, co jest przydatne podczas debugowania lub gdy obserwator Gateway jest wyłączony. Szczegóły automatycznego uruchamiania oraz sposób rezygnacji za pomocą `OPENCLAW_SKIP_GMAIL_WATCHER` opisano w sekcji [Integracja Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration).
</Note>

## `webhooks gmail setup`

```bash
openclaw webhooks gmail setup --account you@example.com
openclaw webhooks gmail setup --account you@example.com --project my-gcp-project --json
openclaw webhooks gmail setup --account you@example.com --hook-url https://gateway.example.com/hooks/gmail
```

Instaluje `gcloud` i `gog`, jeśli ich brakuje, uwierzytelnia `gcloud`, tworzy temat i subskrypcję Pub/Sub, rozpoczyna obserwowanie Gmaila oraz zapisuje konfigurację `hooks.gmail` z wartością `hooks.enabled=true`. Wyświetla `Next: openclaw webhooks gmail run`.

### Wymagane

| Flaga               | Opis                                |
| ------------------- | ----------------------------------- |
| `--account <email>` | Konto Gmail, które ma być obserwowane. |

### Opcje Pub/Sub

| Flaga                   | Wartość domyślna      | Opis                                                                                                                                                                     |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--project <id>`        | (brak)                | Identyfikator projektu GCP (właściciela klienta OAuth). W razie braku używany jest identyfikator projektu tematu, a następnie projekt określony na podstawie danych uwierzytelniających `gog`. |
| `--topic <name>`        | `gog-gmail-watch`     | Nazwa tematu Pub/Sub.                                                                                                                                                    |
| `--subscription <name>` | `gog-gmail-watch-push` | Nazwa subskrypcji Pub/Sub.                                                                                                                                               |
| `--label <label>`       | `INBOX`               | Etykieta Gmaila, która ma być obserwowana.                                                                                                                               |
| `--push-endpoint <url>` | (brak)                | Jawnie określony punkt końcowy push Pub/Sub. Zastępuje Tailscale.                                                                                                        |

### Opcje dostarczania OpenClaw

| Flaga                  | Wartość domyślna                                      | Opis                         |
| ---------------------- | ----------------------------------------------------- | ---------------------------- |
| `--hook-url <url>`     | Tworzony na podstawie `hooks.path` i portu Gateway    | Adres URL Webhook OpenClaw.  |
| `--hook-token <token>` | `hooks.token` lub wygenerowany token                   | Token Webhook OpenClaw.      |
| `--push-token <token>` | Wygenerowany token                                     | Token push przekazywany do `gog watch serve`. |

### Opcje `gog watch serve`

| Flaga                 | Wartość domyślna | Opis                                                                                                                                                                                                 |
| --------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <host>`       | `127.0.0.1`      | Host powiązania `gog watch serve`.                                                                                                                                                                   |
| `--port <port>`       | `8788`           | Port `gog watch serve`.                                                                                                                                                                              |
| `--path <path>`       | `/gmail-pubsub`  | Ścieżka `gog watch serve`. Wymuszana jest wartość `/`, gdy Tailscale jest włączony bez jawnie określonego celu, ponieważ Tailscale usuwa ścieżkę przed przekazaniem przez serwer proxy.                 |
| `--include-body`      | `true`           | Dołącza fragmenty treści wiadomości e-mail. Nie ma flagi CLI umożliwiającej wyłączenie tej opcji; zamiast tego ustaw w konfiguracji `hooks.gmail.includeBody: false`.                                  |
| `--max-bytes <n>`     | `20000`          | Maksymalna liczba bajtów na fragment treści.                                                                                                                                                          |
| `--renew-minutes <n>` | `720` (12 godz.) | Odnawia obserwowanie Gmaila co N minut.                                                                                                                                                               |

### Udostępnianie przez Tailscale

| Flaga                     | Wartość domyślna | Opis                                                                      |
| ------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `--tailscale <mode>`      | `funnel`         | Udostępnia punkt końcowy push przez Tailscale: `funnel`, `serve` lub `off`. |
| `--tailscale-path <path>` | (brak)           | Ścieżka dla funkcji serve/funnel Tailscale.                               |
| `--tailscale-target <t>`  | (brak)           | Cel funkcji serve/funnel Tailscale (port, `host:port` lub adres URL).      |

### Dane wyjściowe

| Flaga    | Opis                                                   |
| -------- | ------------------------------------------------------ |
| `--json` | Wyświetla podsumowanie do odczytu maszynowego zamiast tekstu. |

## `webhooks gmail run`

```bash
openclaw webhooks gmail run --account you@example.com
```

Uruchamia `gog watch serve` wraz z pętlą automatycznego odnawiania obserwowania na pierwszym planie, ponownie uruchamiając `gog watch serve` po 2-sekundowym opóźnieniu, jeśli proces nieoczekiwanie się zakończy.

`run` przyjmuje te same flagi Pub/Sub, dostarczania OpenClaw, `gog watch serve` i Tailscale co `setup`, z następującymi wyjątkami:

- Flaga `--account` jest **opcjonalna** dla `run`; w razie jej braku używana jest wartość `hooks.gmail.account`.
- `run` **nie** przyjmuje flag `--project`, `--push-endpoint` ani `--json`.
- Każda flaga używa w razie braku odpowiadającej jej wartości konfiguracji `hooks.gmail.*` (zapisanej przez `setup`), a następnie tej samej wbudowanej wartości domyślnej, której używa `setup`, z jednym wyjątkiem: dla `run` wartością domyślną `--tailscale` jest `off` (a nie `funnel`), gdy nie ustawiono ani flagi, ani `hooks.gmail.tailscale.mode`.

| Kategoria             | Flagi                                                                            |
| --------------------- | -------------------------------------------------------------------------------- |
| Pub/Sub               | `--account`, `--topic`, `--subscription`, `--label`                              |
| Dostarczanie OpenClaw | `--hook-url`, `--hook-token`, `--push-token`                                     |
| `gog watch serve`     | `--bind`, `--port`, `--path`, `--include-body`, `--max-bytes`, `--renew-minutes` |
| Tailscale             | `--tailscale`, `--tailscale-path`, `--tailscale-target`                          |

<Note>
Dla `run` wartość `--topic` jest pełną ścieżką tematu Pub/Sub (`projects/.../topics/...`), a nie tylko skróconą nazwą tematu.
</Note>

## Powiązane materiały

- [Dokumentacja CLI](/pl/cli)
- [Automatyzacja Webhook](/pl/automation/cron-jobs)
- [Integracja Gmail Pub/Sub](/pl/automation/cron-jobs#gmail-pubsub-integration)
