---
read_when:
    - Uruchamianie skryptów z repozytorium
    - Dodawanie lub zmienianie skryptów w katalogu ./scripts
summary: 'Skrypty repozytorium: cel, zakres i uwagi dotyczące bezpieczeństwa'
title: Skrypty
x-i18n:
    generated_at: "2026-05-06T09:16:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01f2e064891940959acf23c003d7e842386f67ac6c869d0677b802738ac04bdf
    source_path: help/scripts.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Katalog `scripts/` zawiera skrypty pomocnicze do lokalnych przepływów pracy i zadań operacyjnych.
Używaj ich, gdy zadanie jest wyraźnie powiązane ze skryptem; w przeciwnym razie preferuj CLI.

## Konwencje

- Skrypty są **opcjonalne**, chyba że odwołują się do nich dokumentacja lub listy kontrolne wydań.
- Preferuj powierzchnie CLI, gdy istnieją (przykład: monitorowanie uwierzytelniania używa `openclaw models status --check`).
- Zakładaj, że skrypty są specyficzne dla hosta; przeczytaj je przed uruchomieniem na nowym komputerze.

## Skrypty monitorowania uwierzytelniania

Monitorowanie uwierzytelniania opisano w sekcji [Uwierzytelnianie](/pl/gateway/authentication). Skrypty w katalogu `scripts/` są opcjonalnymi dodatkami do przepływów pracy na telefonach z systemd/Termux.

## Pomocnik odczytu GitHub

Użyj `scripts/gh-read`, gdy chcesz, aby `gh` używał tokenu instalacji GitHub App do wywołań odczytu ograniczonych do repozytorium, pozostawiając zwykłe `gh` na Twoim osobistym loginie do działań zapisu.

Wymagane zmienne środowiskowe:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_GH_READ_INSTALLATION_ID`, gdy chcesz pominąć wyszukiwanie instalacji na podstawie repozytorium
- `OPENCLAW_GH_READ_PERMISSIONS` jako rozdzielone przecinkami nadpisanie podzbioru uprawnień odczytu, o które należy poprosić

Kolejność rozpoznawania repozytorium:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Przykłady:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Podczas dodawania skryptów

- Skrypty powinny być wąsko ukierunkowane i udokumentowane.
- Dodaj krótki wpis w odpowiedniej dokumentacji (lub utwórz go, jeśli go brakuje).

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie na żywo](/pl/help/testing-live)
