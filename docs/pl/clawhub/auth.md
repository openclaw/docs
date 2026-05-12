---
read_when:
    - Logowanie do ClawHub
    - Korzystanie z CLI ClawHub
    - Debugowanie błędów 401
summary: Logowanie do ClawHub, tokeny API, logowanie w CLI, przechowywanie tokenów i unieważnianie.
x-i18n:
    generated_at: "2026-05-12T15:42:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Uwierzytelnianie

ClawHub używa GitHub do logowania w przeglądarce. CLI używa tokenów API ClawHub utworzonych
za pomocą tego zalogowanego konta.

## Logowanie w przeglądarce

Użyj GitHub, aby zalogować się na [clawhub.ai](https://clawhub.ai).

Usunięte, zablokowane lub wyłączone konta nie mogą ukończyć normalnego logowania do ClawHub.
Jeśli po logowaniu wracasz do stanu wylogowania, Twoje konto może nie być w dobrym
stanie.

## Logowanie w CLI

Domyślny przepływ logowania CLI otwiera przeglądarkę:

```bash
clawhub login
clawhub whoami
```

Co się dzieje:

1. CLI uruchamia tymczasowy serwer callback na `127.0.0.1`.
2. Przeglądarka otwiera stronę logowania ClawHub.
3. Po zalogowaniu przez GitHub ClawHub tworzy token API.
4. Przeglądarka przekierowuje z powrotem do lokalnego callbacku.
5. CLI zapisuje token w pliku konfiguracyjnym ClawHub.

Jeśli przeglądarka nie może połączyć się z lokalnym callbackiem z powodu reguł zapory, VPN lub
proxy, użyj przepływu tokenu bez interfejsu graficznego.

## Logowanie bez interfejsu graficznego

Utwórz token w interfejsie webowym ClawHub, a następnie przekaż go do CLI:

```bash
clawhub login --token clh_...
```

Używaj tego przepływu na serwerach, w zadaniach CI lub w środowiskach wyłącznie terminalowych.

W przypadku zdalnych powłok, gdy możesz otworzyć przeglądarkę gdzie indziej, uruchom:

```bash
clawhub login --device
```

CLI wyświetla kod jednorazowy i czeka, aż autoryzujesz go pod adresem
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

## Unieważnianie

Możesz unieważniać tokeny API w interfejsie webowym ClawHub.

Unieważnione, nieprawidłowe lub brakujące tokeny zwracają `401 Unauthorized`. Zaloguj się ponownie
za pomocą `clawhub login` albo podaj nowy token za pomocą `clawhub login --token`.

Usunięte, zablokowane lub wyłączone konta nie mogą nadal używać istniejących tokenów API.
