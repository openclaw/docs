---
read_when:
    - Je wilt `openclaw.ai/install.sh` begrijpen
    - Je wilt installaties automatiseren (CI / zonder grafische interface)
    - Je wilt installeren vanuit een GitHub-checkout
summary: Hoe de installatiescripts werken (install.sh, install-cli.sh, install.ps1), vlaggen en automatisering
title: Interne werking van het installatieprogramma
x-i18n:
    generated_at: "2026-05-07T13:21:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a62720526e2a5ffc94555f77e7e806d63768b849a9491b60f6fdc9cf070eed2f
    source_path: install/installer.md
    workflow: 16
---

OpenClaw levert drie installatiescripts, aangeboden vanaf `openclaw.ai`.

| Script                             | Platform             | Wat het doet                                                                                                   |
| ---------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installeert Node indien nodig, installeert OpenClaw via npm (standaard) of git, en kan onboarding uitvoeren.                   |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installeert Node + OpenClaw in een lokale prefix (`~/.openclaw`) met npm- of git-checkoutmodi. Geen root vereist. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installeert Node indien nodig, installeert OpenClaw via npm (standaard) of git, en kan onboarding uitvoeren.                   |

## Snelle opdrachten

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Als de installatie slaagt maar `openclaw` niet wordt gevonden in een nieuwe terminal, zie [Probleemoplossing voor Node.js](/nl/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Aanbevolen voor de meeste interactieve installaties op macOS/Linux/WSL.
</Tip>

### Verloop (install.sh)

<Steps>
  <Step title="Besturingssysteem detecteren">
    Ondersteunt macOS en Linux (inclusief WSL). Als macOS wordt gedetecteerd, installeert dit Homebrew als het ontbreekt.
  </Step>
  <Step title="Standaard Node.js 24 garanderen">
    Controleert de Node-versie en installeert Node 24 indien nodig (Homebrew op macOS, NodeSource-installatiescripts op Linux apt/dnf/yum). OpenClaw ondersteunt nog steeds Node 22 LTS, momenteel `22.16+`, voor compatibiliteit.
  </Step>
  <Step title="Git garanderen">
    Installeert Git als het ontbreekt.
  </Step>
  <Step title="OpenClaw installeren">
    - `npm`-methode (standaard): globale npm-installatie
    - `git`-methode: repo klonen/bijwerken, afhankelijkheden installeren met pnpm, bouwen en daarna wrapper installeren op `~/.local/bin/openclaw`

  </Step>
  <Step title="Taken na installatie">
    - Vernieuwt zo goed mogelijk een geladen Gateway-service (`openclaw gateway install --force`, daarna herstarten)
    - Voert `openclaw doctor --non-interactive` uit bij upgrades en git-installaties (zo goed mogelijk)
    - Probeert onboarding wanneer gepast (TTY beschikbaar, onboarding niet uitgeschakeld, en bootstrap-/configuratiecontroles slagen)
    - Stelt standaard `SHARP_IGNORE_GLOBAL_LIBVIPS=1` in

  </Step>
</Steps>

### Broncheckoutdetectie

Als het script wordt uitgevoerd binnen een OpenClaw-checkout (`package.json` + `pnpm-workspace.yaml`), biedt het script het volgende aan:

- checkout gebruiken (`git`), of
- globale installatie gebruiken (`npm`)

Als er geen TTY beschikbaar is en er geen installatiemethode is ingesteld, wordt standaard `npm` gebruikt en wordt een waarschuwing gegeven.

Het script sluit af met code `2` bij een ongeldige methodeselectie of ongeldige `--install-method`-waarden.

### Voorbeelden (install.sh)

<Tabs>
  <Tab title="Standaard">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Onboarding overslaan">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git-installatie">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub-main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Proefuitvoering">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referentie voor vlaggen">

| Vlag                                  | Beschrijving                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Kies de installatiemethode (standaard: `npm`). Alias: `--method`  |
| `--npm`                               | Snelkoppeling voor npm-methode                                    |
| `--git`                               | Snelkoppeling voor git-methode. Alias: `--github`                 |
| `--version <version\|dist-tag\|spec>` | npm-versie, dist-tag of pakketspecificatie (standaard: `latest`) |
| `--beta`                              | Gebruik de beta dist-tag indien beschikbaar, anders terugvallen op `latest`  |
| `--git-dir <path>`                    | Checkoutmap (standaard: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Sla `git pull` over voor bestaande checkout                      |
| `--no-prompt`                         | Schakel prompts uit                                            |
| `--no-onboard`                        | Sla onboarding over                                            |
| `--onboard`                           | Schakel onboarding in                                          |
| `--dry-run`                           | Druk acties af zonder wijzigingen toe te passen                     |
| `--verbose`                           | Schakel debuguitvoer in (`set -x`, npm notice-level logs)      |
| `--help`                              | Toon gebruik (`-h`)                                          |

  </Accordion>

  <Accordion title="Referentie voor omgevingsvariabelen">

| Variabele                                                | Beschrijving                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Installatiemethode                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm-versie, dist-tag of pakketspecificatie        |
| `OPENCLAW_BETA=0\|1`                                    | Gebruik beta indien beschikbaar                         |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkoutmap                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Git-updates in-/uitschakelen                            |
| `OPENCLAW_NO_PROMPT=1`                                  | Schakel prompts uit                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | Sla onboarding over                               |
| `OPENCLAW_DRY_RUN=1`                                    | Modus voor proefuitvoering                                  |
| `OPENCLAW_VERBOSE=1`                                    | Debugmodus                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm-logniveau                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Beheer sharp/libvips-gedrag (standaard: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Ontworpen voor omgevingen waarin je alles onder een lokale prefix wilt
(standaard `~/.openclaw`) en geen systeemafhankelijkheid van Node wilt. Ondersteunt standaard npm-installaties,
plus git-checkoutinstallaties binnen hetzelfde prefixverloop.
</Info>

### Verloop (install-cli.sh)

<Steps>
  <Step title="Lokale Node-runtime installeren">
    Downloadt een vastgezette ondersteunde Node LTS-tarball (de versie is ingebed in het script en wordt onafhankelijk bijgewerkt) naar `<prefix>/tools/node-v<version>` en verifieert SHA-256.
  </Step>
  <Step title="Git garanderen">
    Als Git ontbreekt, probeert het installatie via apt/dnf/yum op Linux of Homebrew op macOS.
  </Step>
  <Step title="OpenClaw onder prefix installeren">
    - `npm`-methode (standaard): installeert onder de prefix met npm en schrijft daarna de wrapper naar `<prefix>/bin/openclaw`
    - `git`-methode: kloont/werkt een checkout bij (standaard `~/openclaw`) en schrijft nog steeds de wrapper naar `<prefix>/bin/openclaw`

  </Step>
  <Step title="Geladen Gateway-service vernieuwen">
    Als er al een Gateway-service vanuit diezelfde prefix is geladen, voert het script
    `openclaw gateway install --force` uit, daarna `openclaw gateway restart`, en
    controleert het de Gateway-status zo goed mogelijk.
  </Step>
</Steps>

### Voorbeelden (install-cli.sh)

<Tabs>
  <Tab title="Standaard">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Aangepaste prefix + versie">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git-installatie">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="JSON-uitvoer voor automatisering">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Onboarding uitvoeren">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Referentie voor vlaggen">

| Vlag                        | Beschrijving                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Installatieprefix (standaard: `~/.openclaw`)                                         |
| `--install-method npm\|git` | Kies de installatiemethode (standaard: `npm`). Alias: `--method`                       |
| `--npm`                     | Snelkoppeling voor npm-methode                                                         |
| `--git`, `--github`         | Snelkoppeling voor git-methode                                                         |
| `--git-dir <path>`          | Git-checkoutmap (standaard: `~/openclaw`). Alias: `--dir`                  |
| `--version <ver>`           | OpenClaw-versie of dist-tag (standaard: `latest`)                                |
| `--node-version <ver>`      | Node-versie (standaard: `22.22.0`)                                               |
| `--json`                    | Geef NDJSON-events uit                                                              |
| `--onboard`                 | Voer `openclaw onboard` uit na installatie                                            |
| `--no-onboard`              | Sla onboarding over (standaard)                                                       |
| `--set-npm-prefix`          | Forceer op Linux de npm-prefix naar `~/.npm-global` als de huidige prefix niet schrijfbaar is |
| `--help`                    | Toon gebruik (`-h`)                                                               |

  </Accordion>

  <Accordion title="Referentie voor omgevingsvariabelen">

| Variabele                                  | Beschrijving                                             |
| ------------------------------------------- | -------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Installatieprefix                                       |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installatiemethode                                      |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-versie of dist-tag                             |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-versie                                             |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-checkoutmap voor git-installaties                   |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Git-updates voor bestaande checkouts in- of uitschakelen |
| `OPENCLAW_NO_ONBOARD=1`                     | Introductie overslaan                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-logniveau                                           |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips-gedrag beheren (standaard: `1`)           |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Stroom (install.ps1)

<Steps>
  <Step title="PowerShell + Windows-omgeving controleren">
    Vereist PowerShell 5+.
  </Step>
  <Step title="Standaard Node.js 24 controleren">
    Als dit ontbreekt, probeert het installatie via winget, daarna Chocolatey en daarna Scoop. Node 22 LTS, momenteel `22.16+`, blijft ondersteund voor compatibiliteit.
  </Step>
  <Step title="OpenClaw installeren">
    - `npm`-methode (standaard): globale npm-installatie met de geselecteerde `-Tag`, gestart vanuit een beschrijfbare tijdelijke installatiemap, zodat shells die zijn geopend in beveiligde mappen zoals `C:\` nog steeds werken
    - `git`-methode: repo klonen/bijwerken, installeren/bouwen met pnpm, en wrapper installeren op `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Taken na installatie">
    - Voegt waar mogelijk de benodigde bin-map toe aan de gebruikers-PATH
    - Vernieuwt naar beste kunnen een geladen Gateway-service (`openclaw gateway install --force`, daarna opnieuw starten)
    - Voert `openclaw doctor --non-interactive` uit bij upgrades en git-installaties (naar beste kunnen)

  </Step>
  <Step title="Fouten afhandelen">
    `iwr ... | iex` en scriptblock-installaties melden een beëindigende fout zonder de huidige PowerShell-sessie te sluiten. Directe installaties met `powershell -File` / `pwsh -File` sluiten nog steeds af met een niet-nulcode voor automatisering.
  </Step>
</Steps>

### Voorbeelden (install.ps1)

<Tabs>
  <Tab title="Standaard">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git-installatie">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Aangepaste git-map">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Proefuitvoering">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debugtrace">
    ```powershell
    # install.ps1 has no dedicated -Verbose flag yet.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flagreferentie">

| Flag                        | Beschrijving                                                 |
| --------------------------- | ------------------------------------------------------------ |
| `-InstallMethod npm\|git`   | Installatiemethode (standaard: `npm`)                        |
| `-Tag <tag\|version\|spec>` | npm-dist-tag, versie of pakketspecificatie (standaard: `latest`) |
| `-GitDir <path>`            | Checkoutmap (standaard: `%USERPROFILE%\openclaw`)            |
| `-NoOnboard`                | Introductie overslaan                                        |
| `-NoGitUpdate`              | `git pull` overslaan                                         |
| `-DryRun`                   | Alleen acties afdrukken                                      |

  </Accordion>

  <Accordion title="Referentie voor omgevingsvariabelen">

| Variabele                          | Beschrijving              |
| ---------------------------------- | ------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installatiemethode        |
| `OPENCLAW_GIT_DIR=<path>`          | Checkoutmap               |
| `OPENCLAW_NO_ONBOARD=1`            | Introductie overslaan     |
| `OPENCLAW_GIT_UPDATE=0`            | git pull uitschakelen     |
| `OPENCLAW_DRY_RUN=1`               | Proefuitvoeringsmodus     |

  </Accordion>
</AccordionGroup>

<Note>
Als `-InstallMethod git` wordt gebruikt en Git ontbreekt, sluit het script af en drukt het de link naar Git for Windows af.
</Note>

---

## CI en automatisering

Gebruik niet-interactieve flags/omgevingsvariabelen voor voorspelbare uitvoeringen.

<Tabs>
  <Tab title="install.sh (niet-interactieve npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (niet-interactieve git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (introductie overslaan)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Waarom is Git vereist?">
    Git is vereist voor de `git`-installatiemethode. Voor `npm`-installaties wordt Git nog steeds gecontroleerd/geïnstalleerd om fouten met `spawn git ENOENT` te voorkomen wanneer afhankelijkheden git-URL's gebruiken.
  </Accordion>

  <Accordion title="Waarom krijgt npm EACCES op Linux?">
    Sommige Linux-installaties laten de globale npm-prefix naar paden wijzen die eigendom zijn van root. `install.sh` kan de prefix wijzigen naar `~/.npm-global` en PATH-exports toevoegen aan shell-rc-bestanden (wanneer die bestanden bestaan).
  </Accordion>

  <Accordion title="sharp/libvips-problemen">
    De scripts gebruiken standaard `SHARP_IGNORE_GLOBAL_LIBVIPS=1` om te voorkomen dat sharp tegen de systeemversie van libvips bouwt. Overschrijven:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Installeer Git for Windows, open PowerShell opnieuw en voer het installatieprogramma opnieuw uit.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Voer `npm config get prefix` uit en voeg die map toe aan je gebruikers-PATH (geen `\bin`-achtervoegsel nodig op Windows), en open PowerShell daarna opnieuw.
  </Accordion>

  <Accordion title="Windows: uitgebreide installatie-uitvoer krijgen">
    `install.ps1` biedt momenteel geen `-Verbose`-switch.
    Gebruik PowerShell-tracing voor diagnostiek op scriptniveau:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw niet gevonden na installatie">
    Meestal een PATH-probleem. Zie [Node.js-probleemoplossing](/nl/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Bijwerken](/nl/install/updating)
- [Verwijderen](/nl/install/uninstall)
