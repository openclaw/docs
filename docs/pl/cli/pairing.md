---
read_when:
    - Korzystasz z wiadomości prywatnych w trybie parowania i musisz zatwierdzać nadawców
summary: Dokumentacja CLI dla `openclaw pairing` (zatwierdzanie/wyświetlanie listy żądań parowania)
title: Parowanie
x-i18n:
    generated_at: "2026-07-12T14:55:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Zatwierdzaj lub sprawdzaj żądania parowania wiadomości prywatnych dla kanałów obsługujących parowanie (dotyczy tylko wiadomości prywatnych na czacie — do parowania węzłów/urządzeń służy `openclaw devices`).

Powiązane: [Przebieg parowania](/pl/channels/pairing)

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

| Opcja                   | Opis                                      |
| ----------------------- | ----------------------------------------- |
| `[channel]`             | pozycyjny identyfikator kanału            |
| `--channel <channel>`   | jawny identyfikator kanału                |
| `--account <accountId>` | identyfikator konta dla kanałów wielokontowych |
| `--json`                | dane wyjściowe do odczytu maszynowego     |

Jeśli skonfigurowano wiele kanałów obsługujących parowanie, przekaż kanał jako argument pozycyjny lub za pomocą opcji `--channel`. Kanały rozszerzeń działają, o ile identyfikator kanału jest prawidłowy.

## `pairing approve`

Zatwierdza oczekujący kod parowania i zezwala danemu nadawcy na dostęp.

Użycie:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>`, gdy skonfigurowano dokładnie jeden kanał obsługujący parowanie

Opcje: `--channel <channel>`, `--account <accountId>`, `--notify` (wysyła potwierdzenie do osoby zgłaszającej w tym samym kanale).

### Początkowa konfiguracja właściciela

Jeśli podczas zatwierdzania kodu parowania wartość `commands.ownerAllowFrom` jest pusta, OpenClaw zapisuje również zatwierdzonego nadawcę jako właściciela poleceń, używając wpisu ograniczonego do kanału, takiego jak `telegram:123456789`. W ten sposób konfigurowany jest wyłącznie pierwszy właściciel — późniejsze zatwierdzenia parowania nigdy nie zastępują ani nie rozszerzają wartości `commands.ownerAllowFrom`.

Właściciel poleceń to konto operatora będącego człowiekiem, które może uruchamiać polecenia dostępne wyłącznie dla właściciela oraz zatwierdzać niebezpieczne działania, takie jak `/diagnostics`, `/export-trajectory`, `/config` i zatwierdzenia wykonania poleceń. Parowanie jedynie pozwala nadawcy rozmawiać z agentem; samo w sobie nie nadaje uprawnień właściciela poza tą jednorazową początkową konfiguracją.

Jeśli zatwierdzono nadawcę, zanim wprowadzono tę początkową konfigurację, uruchom `openclaw doctor`; polecenie wyświetli ostrzeżenie, gdy nie skonfigurowano właściciela poleceń, oraz dokładne polecenie `openclaw config set commands.ownerAllowFrom ...`, które rozwiąże ten problem.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Parowanie kanałów](/pl/channels/pairing)
