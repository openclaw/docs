---
read_when:
    - Uruchamianie skryptów z repozytorium
    - Dodawanie lub zmienianie skryptów w katalogu ./scripts
summary: 'Skrypty repozytorium: przeznaczenie, zakres i uwagi dotyczące bezpieczeństwa'
title: Skrypty
x-i18n:
    generated_at: "2026-07-12T15:12:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 323069190ea6647101ee7120e06f6b2a018833d0904a11787fa1b610f5b3d9e1
    source_path: help/scripts.md
    workflow: 16
---

`scripts/` zawiera skrypty pomocnicze do lokalnych przepływów pracy i zadań operacyjnych. Używaj ich, gdy zadanie jest wyraźnie związane ze skryptem; w przeciwnym razie preferuj CLI.

## Konwencje

- Skrypty są **opcjonalne**, chyba że odwołują się do nich dokumentacja lub listy kontrolne wydania.
- Preferuj interfejsy CLI, jeśli są dostępne (przykład: `openclaw models status --check`).
- Zakładaj, że skrypty są specyficzne dla hosta; przeczytaj je przed uruchomieniem na nowej maszynie.

## Skrypty monitorowania uwierzytelniania

Ogólne uwierzytelnianie modeli opisano w sekcji [Uwierzytelnianie](/pl/gateway/authentication). Poniższe skrypty stanowią oddzielny, opcjonalny system do monitorowania **tokenu subskrypcji Claude Code CLI** na zdalnym hoście bez interfejsu graficznego oraz ponownego uwierzytelniania za pomocą telefonu:

- `scripts/setup-auth-system.sh` — jednorazowa konfiguracja: sprawdza bieżący stan uwierzytelniania, pomaga wygenerować długoterminowy `claude setup-token` i wyświetla instrukcje instalacji dla systemd/Termux.
- `scripts/claude-auth-status.sh [full|json|simple]` — sprawdza stan uwierzytelniania Claude Code i OpenClaw.
- `scripts/auth-monitor.sh` — cyklicznie sprawdza stan i wysyła powiadomienie (za pomocą wysyłania OpenClaw i/lub ntfy.sh), gdy zbliża się termin wygaśnięcia tokenu. Zmienne środowiskowe: `WARN_HOURS` (domyślnie `2`), `NOTIFY_PHONE`, `NOTIFY_NTFY`. Uruchamiaj zgodnie z harmonogramem za pomocą dołączonych plików `scripts/systemd/openclaw-auth-monitor.{service,timer}` (co 30 minut).
- `scripts/mobile-reauth.sh` — ponownie uruchamia `claude setup-token` i wyświetla adresy URL do otwarcia na telefonie; przeznaczony do użycia przez SSH z Termux.
- `scripts/termux-quick-auth.sh`, `scripts/termux-auth-widget.sh`, `scripts/termux-sync-widget.sh` — skrypty Termux:Widget, które łączą się z hostem przez SSH, wyświetlają wyskakujące powiadomienie o stanie i otwierają konsolę lub instrukcje ponownego uwierzytelnienia po wygaśnięciu uwierzytelniania.

## Narzędzie pomocnicze do odczytu z GitHub

Użyj `scripts/gh-read`, gdy chcesz, aby `gh` używało tokenu instalacyjnego aplikacji GitHub do wywołań odczytu ograniczonych do repozytorium, pozostawiając zwykłe `gh` zalogowane na Twoim koncie osobistym do wykonywania operacji zapisu.

Wymagane zmienne środowiskowe:

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_GH_READ_INSTALLATION_ID`, jeśli chcesz pominąć wyszukiwanie instalacji na podstawie repozytorium
- `OPENCLAW_GH_READ_PERMISSIONS` jako rozdzielone przecinkami zastąpienie podzbioru żądanych uprawnień do odczytu

Kolejność rozpoznawania repozytorium:

- `gh ... -R owner/repo`
- `GH_REPO`
- `git remote origin`

Przykłady:

- `scripts/gh-read pr view 123`
- `scripts/gh-read run list -R openclaw/openclaw`
- `scripts/gh-read api repos/openclaw/openclaw/pulls/123`

## Podczas dodawania skryptów

- Skrypty powinny być ukierunkowane i udokumentowane.
- Dodaj krótki wpis w odpowiednim dokumencie (lub utwórz go, jeśli nie istnieje).

## Powiązane

- [Testowanie](/pl/help/testing)
- [Testowanie na żywo](/pl/help/testing-live)
