---
read_when:
    - Wybór ścieżki wdrożenia
    - Konfigurowanie nowego środowiska
sidebarTitle: Onboarding Overview
summary: Przegląd opcji i przebiegów wdrażania do OpenClaw
title: Przegląd wdrażania
x-i18n:
    generated_at: "2026-04-24T09:33:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a161e504f94c633873a497dd97c971ebfed6f31ef23a3fe9e85eec5a06d1d97
    source_path: start/onboarding-overview.md
    workflow: 15
---

OpenClaw ma dwie ścieżki wdrażania. Obie konfigurują uwierzytelnianie, Gateway oraz
opcjonalne kanały czatu — różnią się jedynie sposobem interakcji z konfiguracją.

## Którą ścieżkę wybrać?

|                | Wdrażanie przez CLI                     | Wdrażanie w aplikacji macOS |
| -------------- | -------------------------------------- | --------------------------- |
| **Platformy**  | macOS, Linux, Windows (natywnie lub WSL2) | tylko macOS               |
| **Interfejs**  | Kreator w terminalu                    | Prowadzony interfejs w aplikacji |
| **Najlepsze dla** | Serwerów, środowisk bezgłowych, pełnej kontroli | Komputerów Mac, konfiguracji wizualnej |
| **Automatyzacja** | `--non-interactive` dla skryptów     | Tylko ręcznie               |
| **Polecenie**  | `openclaw onboard`                     | Uruchom aplikację           |

Większość użytkowników powinna zacząć od **wdrażania przez CLI** — działa
wszędzie i daje największą kontrolę.

## Co konfiguruje wdrażanie

Niezależnie od wybranej ścieżki, wdrażanie ustawia:

1. **Dostawcę modelu i uwierzytelnianie** — klucz API, OAuth lub token konfiguracji dla wybranego dostawcy
2. **Obszar roboczy** — katalog na pliki agenta, szablony startowe i pamięć
3. **Gateway** — port, adres powiązania, tryb uwierzytelniania
4. **Kanały** (opcjonalnie) — wbudowane i dołączone kanały czatu, takie jak
   BlueBubbles, Discord, Feishu, Google Chat, Mattermost, Microsoft Teams,
   Telegram, WhatsApp i inne
5. **Daemon** (opcjonalnie) — usługa działająca w tle, dzięki której Gateway uruchamia się automatycznie

## Wdrażanie przez CLI

Uruchom w dowolnym terminalu:

```bash
openclaw onboard
```

Dodaj `--install-daemon`, aby w jednym kroku zainstalować również usługę działającą w tle.

Pełne informacje: [Wdrażanie (CLI)](/pl/start/wizard)
Dokumentacja polecenia CLI: [`openclaw onboard`](/pl/cli/onboard)

## Wdrażanie w aplikacji macOS

Otwórz aplikację OpenClaw. Kreator pierwszego uruchomienia przeprowadzi Cię przez te same kroki
za pomocą interfejsu graficznego.

Pełne informacje: [Wdrażanie (aplikacja macOS)](/pl/start/onboarding)

## Niestandardowi lub niewymienieni dostawcy

Jeśli Twój dostawca nie jest wymieniony we wdrażaniu, wybierz **Custom Provider** i
wprowadź:

- tryb zgodności API (zgodny z OpenAI, zgodny z Anthropic lub automatyczne wykrywanie)
- bazowy URL i klucz API
- identyfikator modelu i opcjonalny alias

Wiele niestandardowych punktów końcowych może współistnieć — każdy otrzymuje własny identyfikator punktu końcowego.

## Powiązane

- [Pierwsze kroki](/pl/start/getting-started)
- [Dokumentacja referencyjna konfiguracji CLI](/pl/start/wizard-cli-reference)
