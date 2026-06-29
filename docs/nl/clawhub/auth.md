---
read_when:
    - Aanmelden bij ClawHub
    - De ClawHub-CLI gebruiken
    - 401’s debuggen
summary: ClawHub-aanmelding, API-tokens, CLI-login, tokenopslag en intrekking.
x-i18n:
    generated_at: "2026-06-28T22:31:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Auth

ClawHub gebruikt GitHub voor inloggen op het web. De CLI gebruikt ClawHub API-tokens die zijn aangemaakt
via dat ingelogde account.

## Inloggen op het web

Gebruik GitHub om in te loggen op [clawhub.ai](https://clawhub.ai).

Verwijderde, verbannen of uitgeschakelde accounts kunnen de normale ClawHub-inlog niet voltooien.
Als inloggen u terugbrengt naar een uitgelogde status, heeft uw account mogelijk geen goede
status. Als uw account is verbannen of uitgeschakeld, gebruik dan het
[ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) als u denkt dat dit een
vergissing is.

## CLI-login

De standaard CLI-loginflow opent uw browser:

```bash
clawhub login
clawhub whoami
```

Wat er gebeurt:

1. De CLI start een tijdelijke callbackserver op `127.0.0.1`.
2. Uw browser opent de ClawHub-inlogpagina.
3. Na inloggen via GitHub maakt ClawHub een API-token aan.
4. De browser leidt terug naar de lokale callback.
5. De CLI slaat het token op in uw ClawHub-configuratiebestand.

Als uw browser de lokale callback niet kan bereiken vanwege firewall-, VPN- of
proxyregels, gebruik dan de headless-tokenflow.

## Headless login

Maak een token aan in de ClawHub-web-UI en geef dit vervolgens door aan de CLI:

```bash
clawhub login --token clh_...
```

Gebruik deze flow voor servers, CI-taken of omgevingen met alleen een terminal.

Voor externe shells waarbij u elders een browser kunt openen, voert u uit:

```bash
clawhub login --device
```

De CLI toont een eenmalige code en wacht terwijl u deze autoriseert op
`https://clawhub.ai/cli/device`.

## Tokenopslag

Standaard configuratiepaden:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` of `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Overschrijf het pad met:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Druk het opgeslagen token af voor CI-configuratie met:

```bash
clawhub token
```

## Intrekking

U kunt API-tokens intrekken in de ClawHub-web-UI.

Ingetrokken, ongeldige of ontbrekende tokens retourneren `401 Unauthorized`. Log opnieuw in
met `clawhub login` of geef een nieuw token op met `clawhub login --token`.

Verwijderde, verbannen of uitgeschakelde accounts kunnen bestaande API-tokens niet blijven gebruiken.
Als uw account is verbannen of uitgeschakeld, gebruik dan het
[ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) als u denkt dat dit een
vergissing is.
