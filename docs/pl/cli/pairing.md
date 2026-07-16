---
read_when:
    - Korzystasz z wiadomości prywatnych w trybie parowania i musisz zatwierdzać nadawców
summary: Dokumentacja CLI dla `openclaw pairing` (zatwierdzanie/wyświetlanie żądań parowania)
title: Parowanie
x-i18n:
    generated_at: "2026-07-16T18:10:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Zatwierdzanie lub sprawdzanie żądań parowania w wiadomościach prywatnych dla kanałów obsługujących parowanie (dotyczy tylko wiadomości prywatnych na czacie — parowanie Node/urządzeń korzysta z `openclaw devices`).

Powiązane: [Proces parowania](/pl/channels/pairing)

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

| Opcja                  | Opis                                  |
| ----------------------- | ------------------------------------- |
| `[channel]`             | pozycyjny identyfikator kanału        |
| `--channel <channel>`   | jawny identyfikator kanału            |
| `--account <accountId>` | identyfikator konta dla kanałów obsługujących wiele kont |
| `--json`                | dane wyjściowe przeznaczone do przetwarzania maszynowego |

Jeśli skonfigurowano wiele kanałów obsługujących parowanie, należy przekazać kanał pozycyjnie lub za pomocą `--channel`. Kanały rozszerzeń działają, o ile identyfikator kanału jest prawidłowy.

## `pairing approve`

Zatwierdza oczekujący kod parowania i zezwala temu nadawcy na dostęp.

Użycie:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, gdy skonfigurowano dokładnie jeden kanał obsługujący parowanie

Opcje: `--channel <channel>`, `--account <accountId>`, `--notify` (wysyła potwierdzenie do osoby zgłaszającej za pośrednictwem tego samego kanału).

### Inicjalizacja właściciela

Jeśli `commands.ownerAllowFrom` jest puste podczas zatwierdzania kodu parowania, OpenClaw zapisuje również zatwierdzonego nadawcę jako właściciela poleceń, używając wpisu ograniczonego do kanału, takiego jak `telegram:123456789`. Powoduje to jedynie inicjalizację pierwszego właściciela — późniejsze zatwierdzenia parowania nigdy nie zastępują ani nie rozszerzają `commands.ownerAllowFrom`.

Właściciel poleceń to konto operatora będącego człowiekiem, które może uruchamiać polecenia przeznaczone wyłącznie dla właściciela oraz zatwierdzać niebezpieczne działania, takie jak `/diagnostics`, `/export-session`, `/export-trajectory`, `/config` i zatwierdzenia wykonywania poleceń. Parowanie jedynie umożliwia nadawcy komunikowanie się z agentem; samo w sobie nie przyznaje uprawnień właściciela poza tą jednorazową inicjalizacją.

Jeśli nadawca został zatwierdzony przed wprowadzeniem tej inicjalizacji, należy uruchomić `openclaw doctor`; polecenie ostrzega, gdy nie skonfigurowano właściciela poleceń, i wyświetla dokładne polecenie `openclaw config set commands.ownerAllowFrom ...` służące do naprawienia konfiguracji.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Parowanie kanału](/pl/channels/pairing)
