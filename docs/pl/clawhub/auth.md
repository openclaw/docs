---
read_when:
    - Logowanie do ClawHub
    - Korzystanie z CLI ClawHub
    - Debugowanie błędów 401
summary: Logowanie do ClawHub, tokeny API, logowanie w CLI, przechowywanie tokenów i unieważnianie.
x-i18n:
    generated_at: "2026-05-10T19:25:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Uwierzytelnianie

ClawHub używa GitHub do logowania w sieci. CLI używa tokenów API ClawHub utworzonych
za pomocą tego zalogowanego konta.

## Logowanie w sieci

Użyj GitHub, aby zalogować się na [clawhub.ai](https://clawhub.ai).

Usunięte, zbanowane lub wyłączone konta nie mogą ukończyć normalnego logowania w ClawHub.
Jeśli po logowaniu wracasz do stanu wylogowania, Twoje konto może nie mieć dobrej
reputacji.

## Logowanie CLI

Domyślny przepływ logowania CLI otwiera przeglądarkę:

```bash
clawhub login
clawhub whoami
```

Co się dzieje:

1. CLI uruchamia tymczasowy serwer callback na `127.0.0.1`.
2. Przeglądarka otwiera stronę logowania ClawHub.
3. Po zalogowaniu przez GitHub ClawHub tworzy token API.
4. Przeglądarka przekierowuje z powrotem do lokalnego callback.
5. CLI zapisuje token w pliku konfiguracji ClawHub.

Jeśli przeglądarka nie może połączyć się z lokalnym callback z powodu zapory, VPN lub
reguł proxy, użyj bezgłowego przepływu tokenu.

## Logowanie bezgłowe

Utwórz token w interfejsie WWW ClawHub, a następnie przekaż go do CLI:

```bash
clawhub login --token clh_...
```

Użyj tego przepływu dla serwerów, zadań CI lub środowisk wyłącznie terminalowych.

W przypadku zdalnych powłok, gdy możesz otworzyć przeglądarkę gdzie indziej, uruchom:

```bash
clawhub login --device
```

CLI wyświetla jednorazowy kod i czeka, aż autoryzujesz go na
`https://clawhub.ai/cli/device`.

## Przechowywanie tokenów

Domyślne ścieżki konfiguracji:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` lub `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Zmień ścieżkę za pomocą:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

## Unieważnienie

Możesz unieważnić tokeny API w interfejsie WWW ClawHub.

Unieważnione, nieprawidłowe lub brakujące tokeny zwracają `401 Unauthorized`. Zaloguj się ponownie
za pomocą `clawhub login` albo podaj świeży token za pomocą `clawhub login --token`.

Usunięte, zbanowane lub wyłączone konta nie mogą nadal używać istniejących tokenów API.
