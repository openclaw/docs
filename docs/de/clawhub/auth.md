---
read_when:
    - Bei ClawHub anmelden
    - ClawHub-CLI verwenden
    - Fehlerbehebung bei 401-Fehlern
summary: ClawHub-Anmeldung, API-Tokens, CLI-Anmeldung, Token-Speicherung und Widerruf.
x-i18n:
    generated_at: "2026-07-16T12:47:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Authentifizierung

ClawHub verwendet GitHub für die Web-Anmeldung. Die CLI verwendet ClawHub-API-Token, die
über das angemeldete Konto erstellt werden.

## Web-Anmeldung

Melden Sie sich über GitHub bei [clawhub.ai](https://clawhub.ai) an.

Gelöschte, gesperrte oder deaktivierte Konten können die normale ClawHub-Anmeldung nicht abschließen.
Wenn Sie nach der Anmeldung wieder abgemeldet sind, weist Ihr Konto möglicherweise
keinen einwandfreien Status auf. Falls Ihr Konto gesperrt oder deaktiviert wurde, verwenden Sie das
[ClawHub-Einspruchsformular](https://appeals.openclaw.ai/), wenn Sie dies für einen
Fehler halten.

## CLI-Anmeldung

Der standardmäßige CLI-Anmeldevorgang öffnet Ihren Browser:

```bash
clawhub login
clawhub whoami
```

Ablauf:

1. Die CLI startet einen temporären Callback-Server auf `127.0.0.1`.
2. Ihr Browser öffnet die ClawHub-Anmeldeseite.
3. Nach der GitHub-Anmeldung erstellt ClawHub ein API-Token.
4. Der Browser leitet zurück zum lokalen Callback.
5. Die CLI speichert das Token in Ihrer ClawHub-Konfigurationsdatei.

Wenn Ihr Browser den lokalen Callback aufgrund von Firewall-, VPN- oder
Proxyregeln nicht erreichen kann, verwenden Sie den Headless-Token-Ablauf.

## Headless-Anmeldung

Erstellen Sie ein Token in der ClawHub-Weboberfläche und übergeben Sie es anschließend an die CLI:

```bash
clawhub login --token clh_...
```

Verwenden Sie diesen Ablauf für Server, CI-Jobs oder reine Terminalumgebungen.

Führen Sie bei Remote-Shells, für die Sie an anderer Stelle einen Browser öffnen können, Folgendes aus:

```bash
clawhub login --device
```

Die CLI gibt einen einmalig verwendbaren Code aus und wartet, während Sie ihn unter
`https://clawhub.ai/cli/device` autorisieren.

## Token-Speicherung

Standardmäßige Konfigurationspfade:

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
mit `clawhub login` an oder stellen Sie mit `clawhub login --token` ein neues Token bereit.

Gelöschte, gesperrte oder deaktivierte Konten können vorhandene API-Token nicht weiterverwenden.
Falls Ihr Konto gesperrt oder deaktiviert wurde, verwenden Sie das
[ClawHub-Einspruchsformular](https://appeals.openclaw.ai/), wenn Sie dies für einen
Fehler halten.
