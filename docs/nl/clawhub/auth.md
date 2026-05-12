---
read_when:
    - Aanmelden bij ClawHub
    - De ClawHub-CLI gebruiken
    - 401-fouten debuggen
summary: Aanmelden bij ClawHub, API-tokens, CLI-login, tokenopslag en intrekking.
x-i18n:
    generated_at: "2026-05-12T15:42:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261f5a93200db8415e3bc8f35251c3486110ce8e076c482e846ad11f2ccd517f
    source_path: clawhub/auth.md
    workflow: 16
---

# Authenticatie

ClawHub gebruikt GitHub voor aanmelden op het web. De CLI gebruikt ClawHub API-tokens die worden aangemaakt
via dat aangemelde account.

## Aanmelden op het web

Gebruik GitHub om je aan te melden op [clawhub.ai](https://clawhub.ai).

Verwijderde, geblokkeerde of uitgeschakelde accounts kunnen de normale ClawHub-aanmelding niet voltooien.
Als aanmelden je terugbrengt naar een afgemelde status, heeft je account mogelijk geen goede
status.

## CLI-aanmelding

De standaardaanmeldingsflow van de CLI opent je browser:

```bash
clawhub login
clawhub whoami
```

Wat er gebeurt:

1. De CLI start een tijdelijke callbackserver op `127.0.0.1`.
2. Je browser opent de ClawHub-aanmeldingspagina.
3. Na aanmelden met GitHub maakt ClawHub een API-token aan.
4. De browser leidt terug naar de lokale callback.
5. De CLI slaat het token op in je ClawHub-configuratiebestand.

Als je browser de lokale callback niet kan bereiken vanwege firewall-, VPN- of
proxyregels, gebruik dan de tokenflow zonder browser.

## Aanmelden zonder browser

Maak een token aan in de ClawHub-web-UI en geef het daarna door aan de CLI:

```bash
clawhub login --token clh_...
```

Gebruik deze flow voor servers, CI-taken of omgevingen met alleen een terminal.

Voor externe shells waarbij je elders een browser kunt openen, voer je uit:

```bash
clawhub login --device
```

De CLI drukt een eenmalige code af en wacht terwijl je deze autoriseert op
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

## Intrekking

Je kunt API-tokens intrekken in de ClawHub-web-UI.

Ingetrokken, ongeldige of ontbrekende tokens retourneren `401 Unauthorized`. Meld je opnieuw aan
met `clawhub login` of geef een nieuw token op met `clawhub login --token`.

Verwijderde, geblokkeerde of uitgeschakelde accounts kunnen bestaande API-tokens niet blijven gebruiken.
