---
read_when:
    - Bei ClawHub anmelden
    - Verwenden der ClawHub-CLI
    - Debuggen von 401-Fehlern
summary: ClawHub-Anmeldung, API-Token, CLI-Anmeldung, Token-Speicherung und Widerruf.
x-i18n:
    generated_at: "2026-05-13T04:17:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Authentifizierung

ClawHub verwendet GitHub für die Web-Anmeldung. Die CLI verwendet ClawHub-API-Token, die
über dieses angemeldete Konto erstellt wurden.

## Web-Anmeldung

Melden Sie sich mit GitHub unter [clawhub.ai](https://clawhub.ai) an.

Gelöschte, gesperrte oder deaktivierte Konten können die normale ClawHub-Anmeldung nicht abschließen.
Wenn Sie nach der Anmeldung wieder in einem abgemeldeten Zustand landen, ist Ihr Konto möglicherweise nicht
in einwandfreiem Zustand.

## CLI-Anmeldung

Der standardmäßige CLI-Anmeldevorgang öffnet Ihren Browser:

```bash
clawhub login
clawhub whoami
```

Was passiert:

1. Die CLI startet einen temporären Callback-Server auf `127.0.0.1`.
2. Ihr Browser öffnet die ClawHub-Anmeldeseite.
3. Nach der GitHub-Anmeldung erstellt ClawHub ein API-Token.
4. Der Browser leitet zurück zum lokalen Callback.
5. Die CLI speichert das Token in Ihrer ClawHub-Konfigurationsdatei.

Wenn Ihr Browser den lokalen Callback aufgrund von Firewall-, VPN- oder
Proxy-Regeln nicht erreichen kann, verwenden Sie den Headless-Token-Ablauf.

## Headless-Anmeldung

Erstellen Sie ein Token in der ClawHub-Web-UI und übergeben Sie es dann an die CLI:

```bash
clawhub login --token clh_...
```

Verwenden Sie diesen Ablauf für Server, CI-Jobs oder reine Terminal-Umgebungen.

Für Remote-Shells, bei denen Sie an anderer Stelle einen Browser öffnen können, führen Sie Folgendes aus:

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

## Widerruf

Sie können API-Token in der ClawHub-Web-UI widerrufen.

Widerrufene, ungültige oder fehlende Token geben `401 Unauthorized` zurück. Melden Sie sich erneut
mit `clawhub login` an oder stellen Sie mit `clawhub login --token` ein frisches Token bereit.

Gelöschte, gesperrte oder deaktivierte Konten können vorhandene API-Token nicht weiter verwenden.
