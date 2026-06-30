---
read_when:
    - Logowanie do ClawHub
    - Korzystanie z CLI ClawHub
    - Debugowanie błędów 401
summary: Logowanie do ClawHub, tokeny API, logowanie w CLI, przechowywanie tokenów i unieważnianie.
x-i18n:
    generated_at: "2026-06-30T22:36:08Z"
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

Konta usunięte, zbanowane lub wyłączone nie mogą ukończyć zwykłego logowania do ClawHub.
Jeśli po logowaniu wracasz do stanu wylogowania, Twoje konto może nie mieć dobrej
reputacji. Jeśli Twoje konto zostało zbanowane lub wyłączone, użyj
[formularza odwoławczego ClawHub](https://appeals.openclaw.ai/), jeśli uważasz, że to
pomyłka.

## Logowanie w CLI

Domyślny przepływ logowania w CLI otwiera przeglądarkę:

```bash
clawhub login
clawhub whoami
```

Co się dzieje:

1. CLI uruchamia tymczasowy serwer wywołania zwrotnego na `127.0.0.1`.
2. Przeglądarka otwiera stronę logowania ClawHub.
3. Po zalogowaniu przez GitHub ClawHub tworzy token API.
4. Przeglądarka przekierowuje z powrotem do lokalnego wywołania zwrotnego.
5. CLI zapisuje token w pliku konfiguracji ClawHub.

Jeśli przeglądarka nie może dotrzeć do lokalnego wywołania zwrotnego z powodu reguł zapory, VPN lub
proxy, użyj bezgłowego przepływu tokenu.

## Logowanie bezgłowe

Utwórz token w internetowym interfejsie ClawHub, a następnie przekaż go do CLI:

```bash
clawhub login --token clh_...
```

Użyj tego przepływu dla serwerów, zadań CI lub środowisk wyłącznie terminalowych.

W przypadku zdalnych powłok, gdy możesz otworzyć przeglądarkę gdzie indziej, uruchom:

```bash
clawhub login --device
```

CLI wypisuje jednorazowy kod i czeka, gdy autoryzujesz go pod adresem
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

## Unieważnienie

Tokeny API można unieważnić w internetowym interfejsie ClawHub.

Unieważnione, nieprawidłowe lub brakujące tokeny zwracają `401 Unauthorized`. Zaloguj się ponownie
za pomocą `clawhub login` albo podaj świeży token za pomocą `clawhub login --token`.

Konta usunięte, zbanowane lub wyłączone nie mogą nadal używać istniejących tokenów API.
Jeśli Twoje konto zostało zbanowane lub wyłączone, użyj
[formularza odwoławczego ClawHub](https://appeals.openclaw.ai/), jeśli uważasz, że to
pomyłka.
