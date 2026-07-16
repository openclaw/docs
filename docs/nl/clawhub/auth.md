---
read_when:
    - Aanmelden bij ClawHub
    - De ClawHub-CLI gebruiken
    - Foutopsporing bij 401-fouten
summary: Aanmelden bij ClawHub, API-tokens, inloggen via de CLI, tokenopslag en intrekking.
x-i18n:
    generated_at: "2026-07-16T15:15:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# Authenticatie

ClawHub gebruikt GitHub voor aanmelden via het web. De CLI gebruikt ClawHub-API-tokens die
via dat aangemelde account zijn aangemaakt.

## Aanmelden via het web

Gebruik GitHub om je aan te melden bij [clawhub.ai](https://clawhub.ai).

Verwijderde, geblokkeerde of uitgeschakelde accounts kunnen de normale aanmelding bij ClawHub niet voltooien.
Als je na het aanmelden weer bent afgemeld, heeft je account mogelijk geen
goede status. Als je account is geblokkeerd of uitgeschakeld, gebruik dan het
[ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) als je denkt dat dit een
vergissing is.

## Aanmelden via de CLI

De standaardprocedure voor aanmelden via de CLI opent je browser:

```bash
clawhub login
clawhub whoami
```

Wat er gebeurt:

1. De CLI start een tijdelijke callbackserver op `127.0.0.1`.
2. Je browser opent de aanmeldpagina van ClawHub.
3. Na het aanmelden bij GitHub maakt ClawHub een API-token aan.
4. De browser leidt je terug naar de lokale callback.
5. De CLI slaat het token op in je ClawHub-configuratiebestand.

Als je browser de lokale callback niet kan bereiken vanwege regels van een firewall, VPN of
proxy, gebruik dan de headless-tokenprocedure.

## Headless aanmelden

Maak een token aan in de ClawHub-webinterface en geef dit vervolgens door aan de CLI:

```bash
clawhub login --token clh_...
```

Gebruik deze procedure voor servers, CI-taken of omgevingen met alleen een terminal.

Voer voor externe shells waarbij je elders een browser kunt openen het volgende uit:

```bash
clawhub login --device
```

De CLI toont een eenmalige code en wacht terwijl je deze autoriseert op
`https://clawhub.ai/cli/device`.

## Tokenopslag

Standaardpaden voor configuratie:

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` of `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`

Overschrijf het pad met:

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

Toon het opgeslagen token voor het instellen van CI met:

```bash
clawhub token
```

## Intrekking

Je kunt API-tokens intrekken in de ClawHub-webinterface.

Ingetrokken, ongeldige of ontbrekende tokens retourneren `401 Unauthorized`. Meld je opnieuw aan
met `clawhub login` of geef een nieuw token op met `clawhub login --token`.

Verwijderde, geblokkeerde of uitgeschakelde accounts kunnen bestaande API-tokens niet blijven gebruiken.
Als je account is geblokkeerd of uitgeschakeld, gebruik dan het
[ClawHub-bezwaarformulier](https://appeals.openclaw.ai/) als je denkt dat dit een
vergissing is.
