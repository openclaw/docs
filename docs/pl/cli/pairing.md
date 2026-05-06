---
read_when:
    - Używasz wiadomości prywatnych w trybie parowania i musisz zatwierdzić nadawców
summary: Dokumentacja referencyjna CLI dla `openclaw pairing` (zatwierdzanie/wyświetlanie żądań parowania)
title: Parowanie
x-i18n:
    generated_at: "2026-05-06T17:54:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Zatwierdzaj lub sprawdzaj prośby o parowanie DM (dla kanałów obsługujących parowanie).

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

Wyświetl oczekujące prośby o parowanie dla jednego kanału.

Opcje:

- `[channel]`: pozycyjny identyfikator kanału
- `--channel <channel>`: jawny identyfikator kanału
- `--account <accountId>`: identyfikator konta dla kanałów z wieloma kontami
- `--json`: dane wyjściowe czytelne maszynowo

Uwagi:

- Jeśli skonfigurowano wiele kanałów obsługujących parowanie, musisz podać kanał pozycyjnie albo za pomocą `--channel`.
- Kanały rozszerzeń są dozwolone, o ile identyfikator kanału jest prawidłowy.

## `pairing approve`

Zatwierdź oczekujący kod parowania i zezwól temu nadawcy.

Użycie:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, gdy skonfigurowano dokładnie jeden kanał obsługujący parowanie

Opcje:

- `--channel <channel>`: jawny identyfikator kanału
- `--account <accountId>`: identyfikator konta dla kanałów z wieloma kontami
- `--notify`: wyślij potwierdzenie z powrotem do proszącego na tym samym kanale

Inicjalizacja właściciela:

- Jeśli `commands.ownerAllowFrom` jest puste w chwili zatwierdzania kodu parowania, OpenClaw zapisuje też zatwierdzonego nadawcę jako właściciela poleceń, używając wpisu ograniczonego do kanału, takiego jak `telegram:123456789`.
- Powoduje to inicjalizację tylko pierwszego właściciela. Późniejsze zatwierdzenia parowania nie zastępują ani nie rozszerzają `commands.ownerAllowFrom`.
- Właściciel poleceń to konto operatora, któremu wolno uruchamiać polecenia dostępne tylko dla właściciela i zatwierdzać niebezpieczne działania, takie jak `/diagnostics`, `/export-trajectory`, `/config` oraz zatwierdzenia exec.

## Uwagi

- Dane wejściowe kanału: podaj je pozycyjnie (`pairing list telegram`) albo za pomocą `--channel <channel>`.
- `pairing list` obsługuje `--account <accountId>` dla kanałów z wieloma kontami.
- `pairing approve` obsługuje `--account <accountId>` i `--notify`.
- Jeśli skonfigurowano tylko jeden kanał obsługujący parowanie, `pairing approve <code>` jest dozwolone.
- Jeśli zatwierdziłeś nadawcę przed wprowadzeniem tej inicjalizacji, uruchom `openclaw doctor`; ostrzeże, gdy nie skonfigurowano właściciela poleceń, i pokaże polecenie `openclaw config set commands.ownerAllowFrom ...`, które to naprawia.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Parowanie kanału](/pl/channels/pairing)
