---
read_when:
    - Logowanie do ClawHub
    - Korzystanie z CLI ClawHub
    - Debugowanie błędów 401
summary: Logowanie do ClawHub, tokeny API, logowanie w CLI, przechowywanie tokenów i ich unieważnianie.
x-i18n:
    generated_at: "2026-07-16T18:07:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Uwierzytelnianie

ClawHub używa GitHub do logowania w przeglądarce. CLI używa tokenów API ClawHub utworzonych
za pośrednictwem zalogowanego konta.

## Logowanie w przeglądarce

Zaloguj się za pomocą GitHub w witrynie [clawhub.ai](https://clawhub.ai).

Usunięte, zbanowane lub wyłączone konta nie mogą ukończyć standardowego logowania do ClawHub.
Jeśli po zalogowaniu nastąpi powrót do stanu wylogowania, konto może nie mieć
dobrej reputacji. Jeśli konto zostało zbanowane lub wyłączone, należy skorzystać z
[formularza odwoławczego ClawHub](https://appeals.openclaw.ai/), jeśli uznaje się to za
pomyłkę.

## Logowanie w CLI

Domyślny proces logowania w CLI otwiera przeglądarkę:

```bash
clawhub login
clawhub whoami
```

Przebieg procesu:

1. CLI uruchamia tymczasowy serwer wywołania zwrotnego na `127.0.0.1`.
2. Przeglądarka otwiera stronę logowania ClawHub.
3. Po zalogowaniu za pomocą GitHub ClawHub tworzy token API.
4. Przeglądarka przekierowuje z powrotem do lokalnego wywołania zwrotnego.
5. CLI zapisuje token w pliku konfiguracyjnym ClawHub.

Jeśli przeglądarka nie może połączyć się z lokalnym wywołaniem zwrotnym z powodu reguł zapory, VPN lub
serwera proxy, należy użyć bezinterfejsowego procesu logowania za pomocą tokenu.

## Logowanie bezinterfejsowe

Utwórz token w interfejsie internetowym ClawHub, a następnie przekaż go do CLI:

```bash
clawhub login --token clh_...
```

Tego procesu należy używać w przypadku serwerów, zadań CI lub środowisk wyłącznie terminalowych.

W przypadku zdalnych powłok, gdy przeglądarkę można otworzyć w innym miejscu, uruchom:

```bash
clawhub login --device
```

CLI wyświetla kod jednorazowy i czeka na autoryzację pod adresem
`https://clawhub.ai/cli/device`.

## Przechowywanie tokenów

Domyślne ścieżki konfiguracji:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` lub `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Ścieżkę można zastąpić za pomocą:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Aby wyświetlić zapisany token na potrzeby konfiguracji CI, użyj:

```bash
clawhub token
```

## Unieważnianie

Tokeny API można unieważnić w interfejsie internetowym ClawHub.

Unieważnione, nieprawidłowe lub brakujące tokeny zwracają `401 Unauthorized`. Zaloguj się ponownie
za pomocą `clawhub login` lub podaj nowy token za pomocą `clawhub login --token`.

Usunięte, zbanowane lub wyłączone konta nie mogą nadal korzystać z istniejących tokenów API.
Jeśli konto zostało zbanowane lub wyłączone, należy skorzystać z
[formularza odwoławczego ClawHub](https://appeals.openclaw.ai/), jeśli uznaje się to za
pomyłkę.
