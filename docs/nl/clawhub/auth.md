---
read_when:
    - Aanmelden bij ClawHub
    - De ClawHub-CLI gebruiken
    - Foutopsporing voor 401-fouten
summary: Aanmelden bij ClawHub, API-tokens, inloggen via de CLI, tokenopslag en intrekking.
x-i18n:
    generated_at: "2026-07-12T08:38:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Authenticatie

ClawHub gebruikt GitHub voor aanmelding via het web. De CLI gebruikt ClawHub-API-tokens die via het aangemelde account zijn aangemaakt.

## Aanmelden via het web

Gebruik GitHub om u aan te melden bij [clawhub.ai](https://clawhub.ai).

Verwijderde, verbannen of uitgeschakelde accounts kunnen de normale aanmelding bij ClawHub niet voltooien. Als u na het aanmelden weer in afgemelde toestand terechtkomt, heeft uw account mogelijk geen goede status. Als uw account is verbannen of uitgeschakeld en u denkt dat dit een vergissing is, gebruikt u het [bezwaarformulier van ClawHub](https://appeals.openclaw.ai/).

## Aanmelden via de CLI

De standaardaanmeldingsprocedure van de CLI opent uw browser:

```bash
clawhub login
clawhub whoami
```

Wat er gebeurt:

1. De CLI start een tijdelijke callbackserver op `127.0.0.1`.
2. Uw browser opent de aanmeldingspagina van ClawHub.
3. Na aanmelding bij GitHub maakt ClawHub een API-token aan.
4. De browser leidt u terug naar de lokale callback.
5. De CLI slaat het token op in uw ClawHub-configuratiebestand.

Als uw browser de lokale callback niet kan bereiken vanwege firewall-, VPN- of proxyregels, gebruikt u de headless-tokenprocedure.

## Headless aanmelden

Maak een token aan in de ClawHub-webinterface en geef het vervolgens door aan de CLI:

```bash
clawhub login --token clh_...
```

Gebruik deze procedure voor servers, CI-taken of omgevingen die alleen een terminal bieden.

Voer voor externe shells waarbij u elders een browser kunt openen het volgende uit:

```bash
clawhub login --device
```

De CLI toont een eenmalige code en wacht terwijl u deze autoriseert op `https://clawhub.ai/cli/device`.

## Tokenopslag

Standaardpaden voor configuratiebestanden:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` of `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Overschrijf het pad met:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Geef het opgeslagen token weer voor het instellen van CI met:

```bash
clawhub token
```

## Intrekking

U kunt API-tokens intrekken in de ClawHub-webinterface.

Ingetrokken, ongeldige of ontbrekende tokens retourneren `401 Unauthorized`. Meld u opnieuw aan met `clawhub login` of geef een nieuw token op met `clawhub login --token`.

Verwijderde, verbannen of uitgeschakelde accounts kunnen bestaande API-tokens niet blijven gebruiken. Als uw account is verbannen of uitgeschakeld en u denkt dat dit een vergissing is, gebruikt u het [bezwaarformulier van ClawHub](https://appeals.openclaw.ai/).
