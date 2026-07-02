---
read_when:
    - Logowanie do ClawHub
    - Korzystanie z CLI ClawHub
    - Debugowanie błędów 401
summary: Logowanie do ClawHub, tokeny API, logowanie CLI, przechowywanie tokenów i unieważnianie.
x-i18n:
    generated_at: "2026-07-02T17:47:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Uwierzytelnianie

ClawHub używa GitHub do logowania w sieci. CLI używa tokenów API ClawHub tworzonych
przez to zalogowane konto.

## Logowanie w sieci

Użyj GitHub, aby zalogować się na [clawhub.ai](https://clawhub.ai).

Usunięte, zbanowane lub wyłączone konta nie mogą ukończyć normalnego logowania do ClawHub.
Jeśli logowanie przywraca Cię do stanu wylogowania, Twoje konto może nie mieć dobrej
reputacji. Jeśli Twoje konto zostało zbanowane lub wyłączone, użyj
[formularza odwoławczego ClawHub](https://appeals.openclaw.ai/), jeśli uważasz, że to
pomyłka.

## Logowanie w CLI

Domyślny przepływ logowania CLI otwiera przeglądarkę:

```bash
clawhub login
clawhub whoami
```

Co się dzieje:

1. CLI uruchamia tymczasowy serwer zwrotny na `127.0.0.1`.
2. Twoja przeglądarka otwiera stronę logowania ClawHub.
3. Po zalogowaniu przez GitHub ClawHub tworzy token API.
4. Przeglądarka przekierowuje z powrotem do lokalnego punktu zwrotnego.
5. CLI zapisuje token w Twoim pliku konfiguracyjnym ClawHub.

Jeśli Twoja przeglądarka nie może połączyć się z lokalnym punktem zwrotnym z powodu zapory, VPN lub
reguł proxy, użyj przepływu tokenu headless.

## Logowanie headless

Utwórz token w interfejsie webowym ClawHub, a następnie przekaż go do CLI:

```bash
clawhub login --token clh_...
```

Użyj tego przepływu dla serwerów, zadań CI lub środowisk wyłącznie terminalowych.

W przypadku zdalnych powłok, gdy możesz otworzyć przeglądarkę gdzie indziej, uruchom:

```bash
clawhub login --device
```

CLI wyświetla jednorazowy kod i czeka, gdy autoryzujesz go pod adresem
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

Wyświetl zapisany token do konfiguracji CI za pomocą:

```bash
clawhub token
```

## Unieważnianie

Tokeny API możesz unieważnić w interfejsie webowym ClawHub.

Unieważnione, nieprawidłowe lub brakujące tokeny zwracają `401 Unauthorized`. Zaloguj się ponownie
za pomocą `clawhub login` albo podaj nowy token za pomocą `clawhub login --token`.

Usunięte, zbanowane lub wyłączone konta nie mogą dalej używać istniejących tokenów API.
Jeśli Twoje konto zostało zbanowane lub wyłączone, użyj
[formularza odwoławczego ClawHub](https://appeals.openclaw.ai/), jeśli uważasz, że to
pomyłka.
