---
read_when:
    - Logowanie do ClawHub
    - Korzystanie z CLI ClawHub
    - Rozwiązywanie problemów z błędami 401
summary: Logowanie do ClawHub, tokeny API, logowanie w CLI, przechowywanie tokenów i ich unieważnianie.
x-i18n:
    generated_at: "2026-05-12T12:49:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Uwierzytelnianie

ClawHub używa GitHub do logowania w sieci. CLI używa tokenów API ClawHub utworzonych
za pośrednictwem tego zalogowanego konta.

## Logowanie w sieci

Użyj GitHub, aby zalogować się na [clawhub.ai](https://clawhub.ai).

Konta usunięte, zablokowane lub wyłączone nie mogą ukończyć standardowego logowania do ClawHub.
Jeśli logowanie zwraca Cię do stanu wylogowania, Twoje konto może nie mieć prawidłowego
statusu.

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

Jeśli przeglądarka nie może dotrzeć do lokalnego wywołania zwrotnego z powodu zapory, VPN lub
reguł proxy, użyj przepływu tokenu bez interfejsu graficznego.

## Logowanie bez interfejsu graficznego

Utwórz token w webowym interfejsie użytkownika ClawHub, a następnie przekaż go do CLI:

```bash
clawhub login --token clh_...
```

Użyj tego przepływu dla serwerów, zadań CI lub środowisk wyłącznie terminalowych.

W przypadku zdalnych powłok, gdy możesz otworzyć przeglądarkę w innym miejscu, uruchom:

```bash
clawhub login --device
```

CLI wyświetla jednorazowy kod i czeka, aż autoryzujesz go pod adresem
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

Możesz unieważniać tokeny API w webowym interfejsie użytkownika ClawHub.

Unieważnione, nieprawidłowe lub brakujące tokeny zwracają `401 Unauthorized`. Zaloguj się ponownie
za pomocą `clawhub login` lub podaj nowy token za pomocą `clawhub login --token`.

Konta usunięte, zablokowane lub wyłączone nie mogą nadal używać istniejących tokenów API.
