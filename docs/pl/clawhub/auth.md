---
read_when:
    - Logowanie do ClawHub
    - Korzystanie z CLI ClawHub
    - Debugowanie błędów 401
summary: Logowanie do ClawHub, tokeny API, logowanie CLI, przechowywanie tokenów i unieważnianie.
x-i18n:
    generated_at: "2026-07-03T23:43:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Uwierzytelnianie

ClawHub używa GitHub do logowania w sieci. CLI używa tokenów API ClawHub utworzonych
przez to zalogowane konto.

## Logowanie w sieci

Użyj GitHub, aby zalogować się na [clawhub.ai](https://clawhub.ai).

Usunięte, zablokowane lub wyłączone konta nie mogą ukończyć normalnego logowania do ClawHub.
Jeśli logowanie zwraca Cię do stanu wylogowania, Twoje konto może nie mieć dobrej
reputacji. Jeśli Twoje konto zostało zablokowane lub wyłączone, użyj
[formularza odwołania ClawHub](https://appeals.openclaw.ai/), jeśli uważasz, że to
pomyłka.

## Logowanie w CLI

Domyślny przepływ logowania w CLI otwiera przeglądarkę:

```bash
clawhub login
clawhub whoami
```

Co się dzieje:

1. CLI uruchamia tymczasowy serwer wywołania zwrotnego na `127.0.0.1`.
2. Twoja przeglądarka otwiera stronę logowania ClawHub.
3. Po zalogowaniu przez GitHub ClawHub tworzy token API.
4. Przeglądarka przekierowuje z powrotem do lokalnego wywołania zwrotnego.
5. CLI zapisuje token w pliku konfiguracji ClawHub.

Jeśli przeglądarka nie może dotrzeć do lokalnego wywołania zwrotnego z powodu zapory, VPN lub
reguł proxy, użyj przepływu tokenu bez interfejsu graficznego.

## Logowanie bez interfejsu graficznego

Utwórz token w interfejsie WWW ClawHub, a następnie przekaż go do CLI:

```bash
clawhub login --token clh_...
```

Użyj tego przepływu dla serwerów, zadań CI lub środowisk wyłącznie terminalowych.

W przypadku zdalnych powłok, gdzie możesz otworzyć przeglądarkę gdzie indziej, uruchom:

```bash
clawhub login --device
```

CLI wypisuje jednorazowy kod i czeka, aż autoryzujesz go na
`https://clawhub.ai/cli/device`.

## Przechowywanie tokenów

Domyślne ścieżki konfiguracji:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` lub `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Zastąp ścieżkę za pomocą:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Wypisz zapisany token do konfiguracji CI za pomocą:

```bash
clawhub token
```

## Unieważnianie

Możesz unieważniać tokeny API w interfejsie WWW ClawHub.

Unieważnione, nieprawidłowe lub brakujące tokeny zwracają `401 Unauthorized`. Zaloguj się ponownie
za pomocą `clawhub login` lub podaj świeży token za pomocą `clawhub login --token`.

Usunięte, zablokowane lub wyłączone konta nie mogą dalej używać istniejących tokenów API.
Jeśli Twoje konto zostało zablokowane lub wyłączone, użyj
[formularza odwołania ClawHub](https://appeals.openclaw.ai/), jeśli uważasz, że to
pomyłka.
