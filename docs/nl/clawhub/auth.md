---
read_when:
    - Inloggen bij ClawHub
    - De ClawHub CLI gebruiken
    - 401-fouten debuggen
summary: ClawHub-aanmelding, API-tokens, CLI-login, tokenopslag en intrekking.
x-i18n:
    generated_at: "2026-06-30T22:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Auth

ClawHub gebruikt GitHub voor aanmelden op het web. De CLI gebruikt ClawHub-API-tokens die worden aangemaakt
via dat aangemelde account.

## Aanmelden op het web

Gebruik GitHub om je aan te melden op [clawhub.ai](https://clawhub.ai).

Verwijderde, geblokkeerde of uitgeschakelde accounts kunnen de normale ClawHub-aanmelding niet voltooien.
Als aanmelden je terugbrengt naar een afgemelde staat, heeft je account mogelijk geen goede
status. Als je account is geblokkeerd of uitgeschakeld, gebruik dan het
[ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) als je denkt dat dit een
vergissing is.

## CLI-login

De standaard CLI-loginflow opent je browser:

```bash
clawhub login
clawhub whoami
```

Wat er gebeurt:

1. De CLI start een tijdelijke callbackserver op `127.0.0.1`.
2. Je browser opent de ClawHub-aanmeldpagina.
3. Na aanmelding met GitHub maakt ClawHub een API-token aan.
4. De browser verwijst terug naar de lokale callback.
5. De CLI slaat het token op in je ClawHub-configuratiebestand.

Als je browser de lokale callback niet kan bereiken door firewall-, VPN- of
proxyregels, gebruik dan de headless-tokenflow.

## Headless-login

Maak een token aan in de ClawHub-webinterface en geef het daarna door aan de CLI:

```bash
clawhub login --token clh_...
```

Gebruik deze flow voor servers, CI-taken of omgevingen met alleen een terminal.

Voor externe shells waarbij je elders een browser kunt openen, voer je uit:

```bash
clawhub login --device
```

De CLI toont een eenmalige code en wacht terwijl je deze autoriseert op
`https://clawhub.ai/cli/device`.

## Tokenopslag

Standaardconfiguratiepaden:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` of `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Overschrijf het pad met:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Toon het opgeslagen token voor CI-configuratie met:

```bash
clawhub token
```

## Intrekking

Je kunt API-tokens intrekken in de ClawHub-webinterface.

Ingetrokken, ongeldige of ontbrekende tokens geven `401 Unauthorized` terug. Meld je opnieuw aan
met `clawhub login` of geef een nieuw token op met `clawhub login --token`.

Verwijderde, geblokkeerde of uitgeschakelde accounts kunnen bestaande API-tokens niet blijven gebruiken.
Als je account is geblokkeerd of uitgeschakeld, gebruik dan het
[ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) als je denkt dat dit een
vergissing is.
