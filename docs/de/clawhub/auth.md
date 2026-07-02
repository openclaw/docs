---
read_when:
    - Bei ClawHub anmelden
    - ClawHub-CLI verwenden
    - Debugging von 401-Fehlern
summary: ClawHub-Anmeldung, API-Token, CLI-Login, Token-Speicherung und Widerruf.
x-i18n:
    generated_at: "2026-07-02T22:25:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Authentifizierung

ClawHub verwendet GitHub für die Anmeldung im Web. Die CLI verwendet ClawHub-API-Token, die
über dieses angemeldete Konto erstellt wurden.

## Web-Anmeldung

Verwenden Sie GitHub, um sich bei [clawhub.ai](https://clawhub.ai) anzumelden.

Gelöschte, gesperrte oder deaktivierte Konten können die normale ClawHub-Anmeldung nicht abschließen.
Wenn Sie nach der Anmeldung wieder im abgemeldeten Zustand landen, ist Ihr Konto möglicherweise nicht in einwandfreiem
Zustand. Wenn Ihr Konto gesperrt oder deaktiviert wurde, verwenden Sie das
[ClawHub-Einspruchsformular](https://appeals.openclaw.ai/), wenn Sie glauben, dass dies ein
Fehler ist.

## CLI-Anmeldung

Der standardmäßige CLI-Anmeldeablauf öffnet Ihren Browser:

```bash
clawhub login
clawhub whoami
```

Was geschieht:

1. Die CLI startet einen temporären Callback-Server auf `127.0.0.1`.
2. Ihr Browser öffnet die ClawHub-Anmeldeseite.
3. Nach der GitHub-Anmeldung erstellt ClawHub ein API-Token.
4. Der Browser leitet zurück zum lokalen Callback.
5. Die CLI speichert das Token in Ihrer ClawHub-Konfigurationsdatei.

Wenn Ihr Browser den lokalen Callback wegen Firewall-, VPN- oder
Proxy-Regeln nicht erreichen kann, verwenden Sie den Headless-Token-Ablauf.

## Headless-Anmeldung

Erstellen Sie ein Token in der ClawHub-Weboberfläche und übergeben Sie es dann an die CLI:

```bash
clawhub login --token clh_...
```

Verwenden Sie diesen Ablauf für Server, CI-Jobs oder reine Terminalumgebungen.

Für Remote-Shells, bei denen Sie andernorts einen Browser öffnen können, führen Sie Folgendes aus:

```bash
clawhub login --device
```

Die CLI gibt einen einmaligen Code aus und wartet, während Sie ihn unter
`https://clawhub.ai/cli/device` autorisieren.

## Token-Speicherung

Standard-Konfigurationspfade:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` oder `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Überschreiben Sie den Pfad mit:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Geben Sie das gespeicherte Token für die CI-Einrichtung aus mit:

```bash
clawhub token
```

## Widerruf

Sie können API-Token in der ClawHub-Weboberfläche widerrufen.

Widerrufene, ungültige oder fehlende Token geben `401 Unauthorized` zurück. Melden Sie sich erneut
mit `clawhub login` an oder stellen Sie mit `clawhub login --token` ein frisches Token bereit.

Gelöschte, gesperrte oder deaktivierte Konten können vorhandene API-Token nicht weiterverwenden.
Wenn Ihr Konto gesperrt oder deaktiviert wurde, verwenden Sie das
[ClawHub-Einspruchsformular](https://appeals.openclaw.ai/), wenn Sie glauben, dass dies ein
Fehler ist.
