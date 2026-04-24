---
read_when:
    - Używasz wiadomości DM w trybie pairingu i musisz zatwierdzać nadawców
summary: Odwołanie CLI dla `openclaw pairing` (zatwierdzanie/wyświetlanie żądań pairingu)
title: Pairing
x-i18n:
    generated_at: "2026-04-24T09:03:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e81dc407138e958e41d565b0addb600ad1ba5187627bb219f0b85b92bd112d1
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Zatwierdzaj lub sprawdzaj żądania pairingu DM (dla kanałów obsługujących pairing).

Powiązane:

- Przepływ pairingu: [Pairing](/pl/channels/pairing)

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

Wyświetla oczekujące żądania pairingu dla jednego kanału.

Opcje:

- `[channel]`: pozycyjny identyfikator kanału
- `--channel <channel>`: jawny identyfikator kanału
- `--account <accountId>`: identyfikator konta dla kanałów wielokontowych
- `--json`: wyjście czytelne maszynowo

Uwagi:

- Jeśli skonfigurowano wiele kanałów obsługujących pairing, musisz podać kanał pozycyjnie albo przez `--channel`.
- Kanały rozszerzeń są dozwolone, o ile identyfikator kanału jest prawidłowy.

## `pairing approve`

Zatwierdza oczekujący kod pairingu i dopuszcza tego nadawcę.

Użycie:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` gdy skonfigurowano dokładnie jeden kanał obsługujący pairing

Opcje:

- `--channel <channel>`: jawny identyfikator kanału
- `--account <accountId>`: identyfikator konta dla kanałów wielokontowych
- `--notify`: wyślij potwierdzenie z powrotem do żądającego w tym samym kanale

## Uwagi

- Dane wejściowe kanału: podaj je pozycyjnie (`pairing list telegram`) albo przez `--channel <channel>`.
- `pairing list` obsługuje `--account <accountId>` dla kanałów wielokontowych.
- `pairing approve` obsługuje `--account <accountId>` i `--notify`.
- Jeśli skonfigurowano tylko jeden kanał obsługujący pairing, dozwolone jest `pairing approve <code>`.

## Powiązane

- [Odwołanie CLI](/pl/cli)
- [Pairing kanałów](/pl/channels/pairing)
