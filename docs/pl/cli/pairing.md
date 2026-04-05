---
read_when:
    - Używasz DM-ów w trybie parowania i musisz zatwierdzać nadawców
summary: Dokumentacja CLI dla `openclaw pairing` (zatwierdzanie/wyświetlanie żądań parowania)
title: pairing
x-i18n:
    generated_at: "2026-04-05T13:48:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Zatwierdzaj lub sprawdzaj żądania parowania DM (dla kanałów obsługujących parowanie).

Powiązane:

- Przepływ parowania: [Pairing](/pl/channels/pairing)

## Polecenia

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Wyświetl oczekujące żądania parowania dla jednego kanału.

Opcje:

- `[channel]`: pozycyjny identyfikator kanału
- `--channel <channel>`: jawny identyfikator kanału
- `--account <accountId>`: identyfikator konta dla kanałów wielokontowych
- `--json`: wyjście czytelne maszynowo

Uwagi:

- Jeśli skonfigurowano wiele kanałów obsługujących parowanie, musisz podać kanał pozycyjnie albo przez `--channel`.
- Kanały pluginów są dozwolone, o ile identyfikator kanału jest prawidłowy.

## `pairing approve`

Zatwierdź oczekujący kod parowania i zezwól temu nadawcy.

Użycie:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, gdy skonfigurowano dokładnie jeden kanał obsługujący parowanie

Opcje:

- `--channel <channel>`: jawny identyfikator kanału
- `--account <accountId>`: identyfikator konta dla kanałów wielokontowych
- `--notify`: wyślij potwierdzenie z powrotem do zgłaszającego w tym samym kanale

## Uwagi

- Wejście kanału: podaj je pozycyjnie (`pairing list telegram`) albo przez `--channel <channel>`.
- `pairing list` obsługuje `--account <accountId>` dla kanałów wielokontowych.
- `pairing approve` obsługuje `--account <accountId>` i `--notify`.
- Jeśli skonfigurowano tylko jeden kanał obsługujący parowanie, dozwolone jest `pairing approve <code>`.
