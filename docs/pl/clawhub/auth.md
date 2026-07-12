---
read_when:
    - Logowanie do ClawHub
    - Korzystanie z CLI ClawHub
    - Debugowanie błędów 401
summary: Logowanie do ClawHub, tokeny API, logowanie w CLI, przechowywanie tokenów i ich unieważnianie.
x-i18n:
    generated_at: "2026-07-12T14:56:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Uwierzytelnianie

ClawHub używa GitHub do logowania w przeglądarce. CLI używa tokenów API ClawHub utworzonych za pośrednictwem zalogowanego konta.

## Logowanie w przeglądarce

Zaloguj się za pomocą GitHub na stronie [clawhub.ai](https://clawhub.ai).

Usunięte, zablokowane lub wyłączone konta nie mogą ukończyć standardowego logowania do ClawHub. Jeśli po próbie logowania nastąpi powrót do stanu wylogowania, konto może nie mieć dobrej reputacji. Jeśli konto zostało zablokowane lub wyłączone i uważasz, że jest to pomyłka, skorzystaj z [formularza odwoławczego ClawHub](https://appeals.openclaw.ai/).

## Logowanie w CLI

Domyślny proces logowania w CLI otwiera przeglądarkę:

```bash
clawhub login
clawhub whoami
```

Przebieg procesu:

1. CLI uruchamia tymczasowy serwer wywołania zwrotnego pod adresem `127.0.0.1`.
2. Przeglądarka otwiera stronę logowania do ClawHub.
3. Po zalogowaniu przez GitHub ClawHub tworzy token API.
4. Przeglądarka przekierowuje z powrotem do lokalnego wywołania zwrotnego.
5. CLI zapisuje token w pliku konfiguracji ClawHub.

Jeśli przeglądarka nie może uzyskać dostępu do lokalnego wywołania zwrotnego z powodu reguł zapory sieciowej, VPN lub serwera proxy, użyj bezobsługowego procesu logowania za pomocą tokenu.

## Logowanie bezobsługowe

Utwórz token w interfejsie internetowym ClawHub, a następnie przekaż go do CLI:

```bash
clawhub login --token clh_...
```

Używaj tego procesu na serwerach, w zadaniach CI lub środowiskach obsługiwanych wyłącznie przez terminal.

W przypadku zdalnych powłok, gdy możesz otworzyć przeglądarkę na innym urządzeniu, uruchom:

```bash
clawhub login --device
```

CLI wyświetli kod jednorazowy i będzie oczekiwać na autoryzację pod adresem `https://clawhub.ai/cli/device`.

## Przechowywanie tokenu

Domyślne ścieżki konfiguracji:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` lub `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Zastąp ścieżkę za pomocą:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Wyświetl zapisany token na potrzeby konfiguracji CI za pomocą:

```bash
clawhub token
```

## Unieważnianie

Tokeny API można unieważnić w interfejsie internetowym ClawHub.

Unieważnione, nieprawidłowe lub brakujące tokeny powodują zwrócenie odpowiedzi `401 Unauthorized`. Zaloguj się ponownie za pomocą `clawhub login` lub podaj nowy token za pomocą `clawhub login --token`.

Usunięte, zablokowane lub wyłączone konta nie mogą dalej korzystać z istniejących tokenów API. Jeśli konto zostało zablokowane lub wyłączone i uważasz, że jest to pomyłka, skorzystaj z [formularza odwoławczego ClawHub](https://appeals.openclaw.ai/).
