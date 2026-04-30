---
read_when:
    - Używasz wiadomości bezpośrednich w trybie parowania i musisz zatwierdzić nadawców
summary: Dokumentacja referencyjna CLI dla `openclaw pairing` (zatwierdzanie/listowanie żądań parowania)
title: Parowanie
x-i18n:
    generated_at: "2026-04-30T09:45:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Zatwierdzaj lub sprawdzaj żądania parowania przez wiadomości prywatne (dla kanałów obsługujących parowanie).

Powiązane:

- Przepływ parowania: [Parowanie](/pl/channels/pairing)

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

Wyświetla oczekujące żądania parowania dla jednego kanału.

Opcje:

- `[channel]`: pozycyjny identyfikator kanału
- `--channel <channel>`: jawny identyfikator kanału
- `--account <accountId>`: identyfikator konta dla kanałów z wieloma kontami
- `--json`: dane wyjściowe czytelne maszynowo

Uwagi:

- Jeśli skonfigurowano wiele kanałów obsługujących parowanie, musisz podać kanał pozycyjnie albo za pomocą `--channel`.
- Kanały rozszerzeń są dozwolone, o ile identyfikator kanału jest prawidłowy.

## `pairing approve`

Zatwierdza oczekujący kod parowania i zezwala temu nadawcy.

Użycie:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, gdy skonfigurowano dokładnie jeden kanał obsługujący parowanie

Opcje:

- `--channel <channel>`: jawny identyfikator kanału
- `--account <accountId>`: identyfikator konta dla kanałów z wieloma kontami
- `--notify`: wysyła potwierdzenie do osoby wysyłającej żądanie na tym samym kanale

Inicjalizacja właściciela:

- Jeśli `commands.ownerAllowFrom` jest puste podczas zatwierdzania kodu parowania, OpenClaw zapisuje także zatwierdzonego nadawcę jako właściciela poleceń, używając wpisu o zakresie kanału, takiego jak `telegram:123456789`.
- Inicjalizuje to tylko pierwszego właściciela. Późniejsze zatwierdzenia parowania nie zastępują ani nie rozszerzają `commands.ownerAllowFrom`.
- Właściciel poleceń to konto ludzkiego operatora, któremu wolno uruchamiać polecenia dostępne tylko dla właściciela i zatwierdzać niebezpieczne działania, takie jak `/diagnostics`, `/export-trajectory`, `/config` oraz zatwierdzenia exec.

## Uwagi

- Dane wejściowe kanału: przekaż je pozycyjnie (`pairing list telegram`) albo za pomocą `--channel <channel>`.
- `pairing list` obsługuje `--account <accountId>` dla kanałów z wieloma kontami.
- `pairing approve` obsługuje `--account <accountId>` i `--notify`.
- Jeśli skonfigurowano tylko jeden kanał obsługujący parowanie, dozwolone jest `pairing approve <code>`.
- Jeśli zatwierdzono nadawcę przed wprowadzeniem tej inicjalizacji, uruchom `openclaw doctor`; ostrzeże, gdy nie skonfigurowano właściciela poleceń, i pokaże polecenie `openclaw config set commands.ownerAllowFrom ...`, aby to naprawić.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Parowanie kanału](/pl/channels/pairing)
