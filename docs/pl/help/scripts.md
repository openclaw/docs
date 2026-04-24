---
read_when:
    - Uruchamianie skryptów z repozytorium
    - Dodawanie lub zmienianie skryptów w ./scripts
summary: 'Skrypty repozytorium: przeznaczenie, zakres i uwagi dotyczące bezpieczeństwa'
title: Skrypty
x-i18n:
    generated_at: "2026-04-24T09:14:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d76777402670abe355b9ad2a0337f96211af1323e36f2ab1ced9f04f87083f5
    source_path: help/scripts.md
    workflow: 15
---

Katalog `scripts/` zawiera skrypty pomocnicze do lokalnych workflow i zadań operacyjnych.
Używaj ich, gdy zadanie jest wyraźnie powiązane ze skryptem; w przeciwnym razie preferuj CLI.

## Konwencje

- Skrypty są **opcjonalne**, chyba że są wskazane w dokumentacji lub checklistach wydania.
- Preferuj powierzchnie CLI, gdy istnieją (przykład: monitorowanie uwierzytelniania używa `openclaw models status --check`).
- Zakładaj, że skrypty są specyficzne dla hosta; przeczytaj je przed uruchomieniem na nowej maszynie.

## Skrypty monitorowania uwierzytelniania

Monitorowanie uwierzytelniania jest opisane w [Authentication](/pl/gateway/authentication). Skrypty w `scripts/` są opcjonalnymi dodatkami dla workflow telefonicznych systemd/Termux.

## Pomocnik odczytu GitHub

Używaj `scripts/gh-read`, gdy chcesz, aby `gh` używało tokena instalacyjnego GitHub App do odczytów ograniczonych do repozytorium, pozostawiając zwykłe `gh` na twoim osobistym logowaniu dla działań zapisu.

Wymagane env:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Opcjonalne env:

- `OPENCLAW_GH_READ_INSTALLATION_ID`, gdy chcesz pominąć wyszukiwanie instalacji na podstawie repozytorium
- `OPENCLAW_GH_READ_PERMISSIONS` jako nadpisanie podzbioru uprawnień do odczytu w postaci ciągu rozdzielanego przecinkami

Kolejność rozwiązywania repozytorium:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Przykłady:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Przy dodawaniu skryptów

- Utrzymuj skrypty jako skupione na jednym celu i udokumentowane.
- Dodaj krótki wpis w odpowiedniej dokumentacji (albo utwórz go, jeśli go brakuje).

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie na żywo](/pl/help/testing-live)
