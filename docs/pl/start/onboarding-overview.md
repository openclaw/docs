---
read_when:
    - Wybór ścieżki onboardingu
    - Konfigurowanie nowego środowiska
sidebarTitle: Onboarding Overview
summary: Przegląd opcji i przepływów onboardingu OpenClaw
title: Przegląd onboardingu
x-i18n:
    generated_at: "2026-04-05T14:06:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 374697c1dbe0c3871c43164076fbed7119ef032f4a40d0f6e421051f914806e5
    source_path: start/onboarding-overview.md
    workflow: 15
---

# Przegląd onboardingu

OpenClaw ma dwie ścieżki onboardingu. Obie konfigurują uwierzytelnianie, Gateway oraz
opcjonalne kanały czatu — różnią się tylko sposobem interakcji z konfiguracją.

## Którą ścieżkę wybrać?

|                | Onboarding CLI                          | Onboarding w aplikacji macOS |
| -------------- | --------------------------------------- | ---------------------------- |
| **Platformy**  | macOS, Linux, Windows (natywnie lub WSL2) | tylko macOS                |
| **Interfejs**  | Kreator w terminalu                     | Prowadzony interfejs w aplikacji |
| **Najlepsze dla** | Serwerów, środowisk bezobsługowych, pełnej kontroli | Komputerów Mac, konfiguracji wizualnej |
| **Automatyzacja** | `--non-interactive` dla skryptów      | Tylko ręcznie               |
| **Polecenie**  | `openclaw onboard`                      | Uruchom aplikację           |

Większość użytkowników powinna zacząć od **onboardingu CLI** — działa wszędzie i daje
największą kontrolę.

## Co konfiguruje onboarding

Niezależnie od wybranej ścieżki onboarding ustawia:

1. **Dostawcę modelu i uwierzytelnianie** — klucz API, OAuth lub token konfiguracji dla wybranego dostawcy
2. **Przestrzeń roboczą** — katalog dla plików agenta, szablonów bootstrap i pamięci
3. **Gateway** — port, adres powiązania, tryb uwierzytelniania
4. **Kanały** (opcjonalnie) — wbudowane i dołączone kanały czatu, takie jak
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp i inne
5. **Demon** (opcjonalnie) — usługa działająca w tle, dzięki której Gateway uruchamia się automatycznie

## Onboarding CLI

Uruchom w dowolnym terminalu:

```bash
openclaw onboard
```

Dodaj `--install-daemon`, aby w jednym kroku zainstalować także usługę działającą w tle.

Pełny opis: [Onboarding (CLI)](/start/wizard)
Dokumentacja polecenia CLI: [`openclaw onboard`](/cli/onboard)

## Onboarding w aplikacji macOS

Otwórz aplikację OpenClaw. Kreator pierwszego uruchomienia przeprowadzi Cię przez te same kroki
za pomocą interfejsu graficznego.

Pełny opis: [Onboarding (aplikacja macOS)](/start/onboarding)

## Niestandardowi lub niewymienieni dostawcy

Jeśli Twojego dostawcy nie ma na liście w onboardingu, wybierz **Niestandardowy dostawca** i
wprowadź:

- Tryb zgodności API (zgodny z OpenAI, zgodny z Anthropic lub automatyczne wykrywanie)
- Base URL i klucz API
- Identyfikator modelu i opcjonalny alias

Wiele niestandardowych endpointów może współistnieć — każdy otrzymuje własny identyfikator endpointu.
