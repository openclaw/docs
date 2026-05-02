---
read_when:
    - Je wilt `openclaw.ai/install.sh` begrijpen
    - Je wilt installaties automatiseren (CI / zonder gebruikersinterface)
    - Je wilt installeren vanuit een GitHub-checkout
summary: Hoe de installatiescripts werken (install.sh, install-cli.sh, install.ps1), vlaggen en automatisering
title: Interne werking van het installatieprogramma
x-i18n:
    generated_at: "2026-05-02T11:20:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 119d94edae8cae2460e1bce9fe6bb31dc3c91d23443090cd34bf10adde9e10f1
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

### Stroom (install.sh)

<Steps>
  <Step title="Detect OS">
    Ondersteunt macOS en Linux (inclusief WSL). Als macOS wordt gedetecteerd, wordt Homebrew geïnstalleerd als dit ontbreekt.
  </Step>
  <Step title="Ensure Node.js 24 by default">
    Controleert de Node-versie en installeert Node 24 indien nodig (Homebrew op macOS, NodeSource-installatiescripts op Linux apt/dnf/yum). OpenClaw ondersteunt nog steeds Node 22 LTS, momenteel `22.14+`, voor compatibiliteit.
  </Step>
  <Step title="Ensure Git">
    Installeert Git als dit ontbreekt.
  </Step>
  <Step title="Install OpenClaw">
    - `npm`-methode (standaard): globale npm-installatie
    - `git`-methode: repo klonen/bijwerken, afhankelijkheden installeren met pnpm, bouwen, en vervolgens wrapper installeren op `~/.local/bin/openclaw`

  </Step>
  <Step title="Post-install tasks">
    - Vernieuwt naar beste vermogen een geladen Gateway-service (`openclaw gateway install --force`, daarna herstarten)
    - Voert `openclaw doctor --non-interactive` uit bij upgrades en git-installaties (naar beste vermogen)
    - Probeert onboarding wanneer passend (TTY beschikbaar, onboarding niet uitgeschakeld en bootstrap-/configuratiecontroles slagen)
    - Stelt standaard `SHARP_IGNORE_GLOBAL_LIBVIPS=1` in

  </Step>
</Steps>

### Detectie van bron-checkout

Als het script binnen een OpenClaw-checkout (`package.json` + `pnpm-workspace.yaml`) wordt uitgevoerd, biedt het script:

- checkout gebruiken (`git`), of
- globale installatie gebruiken (`npm`)

Als er geen TTY beschikbaar is en geen installatiemethode is ingesteld, wordt standaard `npm` gebruikt en wordt een waarschuwing gegeven.

Het script sluit af met code `2` bij ongeldige methodeselectie of ongeldige `--install-method`-waarden.

### Voorbeelden (install.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Skip onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main via npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Dry run">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                                  | Beschrijving                                                |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Kies installatiemethode (standaard: `npm`). Alias: `--method`  |
| `--npm`                               | Snelkoppeling voor npm-methode                                    |
| `--git`                               | Snelkoppeling voor git-methode. Alias: `--github`                 |
| `--version <version\|dist-tag\|spec>` | npm-versie, dist-tag of pakketspecificatie (standaard: `latest`) |
| `--beta`                              | Gebruik beta-dist-tag indien beschikbaar, anders terugvallen op `latest`  |
| `--git-dir <path>`                    | Checkoutdirectory (standaard: `~/openclaw`). Alias: `--dir` |
| `--no-git-update`                     | Sla `git pull` over voor bestaande checkout                      |
| `--no-prompt`                         | Schakel prompts uit                                            |
| `--no-onboard`                        | Sla onboarding over                                            |
| `--onboard`                           | Schakel onboarding in                                          |
| `--dry-run`                           | Toon acties zonder wijzigingen toe te passen                     |
| `--verbose`                           | Schakel debuguitvoer in (`set -x`, npm-logs op notice-niveau)      |
| `--help`                              | Toon gebruik (`-h`)                                          |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabele                                                | Beschrijving                                   |
| ------------------------------------------------------- | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                      | Installatiemethode                                |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | npm-versie, dist-tag of pakketspecificatie        |
| `OPENCLAW_BETA=0\|1`                                    | Gebruik beta indien beschikbaar                         |
| `OPENCLAW_GIT_DIR=<path>`                               | Checkoutdirectory                            |
| `OPENCLAW_GIT_UPDATE=0\|1`                              | Git-updates aan-/uitzetten                            |
| `OPENCLAW_NO_PROMPT=1`                                  | Schakel prompts uit                               |
| `OPENCLAW_NO_ONBOARD=1`                                 | Sla onboarding over                               |
| `OPENCLAW_DRY_RUN=1`                                    | Dry-runmodus                                  |
| `OPENCLAW_VERBOSE=1`                                    | Debugmodus                                    |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`             | npm-logniveau                                 |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                      | Beheer sharp/libvips-gedrag (standaard: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Ontworpen voor omgevingen waarin je alles onder een lokale prefix
(standaard `~/.openclaw`) wilt plaatsen en geen systeemafhankelijkheid van Node wilt. Ondersteunt standaard npm-installaties,
plus git-checkoutinstallaties binnen dezelfde prefixstroom.
</Info>

### Stroom (install-cli.sh)

<Steps>
  <Step title="Install local Node runtime">
    Downloadt een vastgezette ondersteunde Node LTS-tarball (de versie is in het script ingebed en wordt onafhankelijk bijgewerkt) naar `<prefix>/tools/node-v<version>` en verifieert SHA-256.
  </Step>
  <Step title="Ensure Git">
    Als Git ontbreekt, wordt installatie geprobeerd via apt/dnf/yum op Linux of Homebrew op macOS.
  </Step>
  <Step title="Install OpenClaw under prefix">
    - `npm`-methode (standaard): installeert onder de prefix met npm en schrijft daarna de wrapper naar `<prefix>/bin/openclaw`
    - `git`-methode: kloont/werkt een checkout bij (standaard `~/openclaw`) en schrijft de wrapper nog steeds naar `<prefix>/bin/openclaw`

  </Step>
  <Step title="Refresh loaded gateway service">
    Als er al een Gateway-service vanuit dezelfde prefix is geladen, voert het script
    `openclaw gateway install --force` uit, daarna `openclaw gateway restart`, en
    controleert het naar beste vermogen de Gateway-status.
  </Step>
</Steps>

### Voorbeelden (install-cli.sh)

<Tabs>
  <Tab title="Default">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Custom prefix + version">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git install">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="Automation JSON output">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Run onboarding">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Flags reference">

| Flag                        | Beschrijving                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Installatieprefix (standaard: `~/.openclaw`)                                         |
| `--install-method npm\|git` | Kies installatiemethode (standaard: `npm`). Alias: `--method`                       |
| `--npm`                     | Snelkoppeling voor npm-methode                                                         |
| `--git`, `--github`         | Snelkoppeling voor git-methode                                                         |
| `--git-dir <path>`          | Git-checkoutdirectory (standaard: `~/openclaw`). Alias: `--dir`                  |
| `--version <ver>`           | OpenClaw-versie of dist-tag (standaard: `latest`)                                |
| `--node-version <ver>`      | Node-versie (standaard: `22.22.0`)                                               |
| `--json`                    | Geef NDJSON-gebeurtenissen uit                                                              |
| `--onboard`                 | Voer `openclaw onboard` uit na installatie                                            |
| `--no-onboard`              | Sla onboarding over (standaard)                                                       |
| `--set-npm-prefix`          | Forceer op Linux de npm-prefix naar `~/.npm-global` als de huidige prefix niet schrijfbaar is |
| `--help`                    | Toon gebruik (`-h`)                                                               |

  </Accordion>

  <Accordion title="Environment variables reference">

| Variabele                                  | Beschrijving                                      |
| ------------------------------------------- | ------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Installatieprefix                                 |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installatiemethode                                |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-versie of dist-tag                       |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-versie                                       |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-checkoutmap voor git-installaties             |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Schakel git-updates voor bestaande checkouts in/uit |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding overslaan                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-logniveau                                     |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`          | sharp/libvips-gedrag beheren (standaard: `1`)     |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Flow (install.ps1)

<Steps>
  <Step title="Controleer PowerShell + Windows-omgeving">
    Vereist PowerShell 5+.
  </Step>
  <Step title="Controleer standaard Node.js 24">
    Als dit ontbreekt, probeert het script installatie via winget, daarna Chocolatey en daarna Scoop. Node 22 LTS, momenteel `22.14+`, blijft ondersteund voor compatibiliteit.
  </Step>
  <Step title="OpenClaw installeren">
    - `npm`-methode (standaard): globale npm-installatie met de geselecteerde `-Tag`, gestart vanuit een schrijfbare tijdelijke installatiemap, zodat shells die in beveiligde mappen zoals `C:\` zijn geopend nog steeds werken
    - `git`-methode: repo klonen/bijwerken, installeren/bouwen met pnpm, en wrapper installeren op `%USERPROFILE%\.local\bin\openclaw.cmd`

  </Step>
  <Step title="Taken na installatie">
    - Voegt waar mogelijk de benodigde bin-map toe aan de gebruikers-PATH
    - Vernieuwt best-effort een geladen Gateway-service (`openclaw gateway install --force`, daarna opnieuw starten)
    - Voert `openclaw doctor --non-interactive` uit bij upgrades en git-installaties (best effort)

  </Step>
  <Step title="Fouten afhandelen">
    `iwr ... | iex` en scriptblock-installaties melden een afsluitende fout zonder de huidige PowerShell-sessie te sluiten. Directe `powershell -File`- / `pwsh -File`-installaties sluiten nog steeds af met een niet-nulstatus voor automatisering.
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
  <Tab title="Proefrun">
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
  <Accordion title="Referentie voor flags">

| Flag                        | Beschrijving                                              |
| --------------------------- | --------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Installatiemethode (standaard: `npm`)                     |
| `-Tag <tag\|version\|spec>` | npm dist-tag, versie of pakketspecificatie (standaard: `latest`) |
| `-GitDir <path>`            | Checkoutmap (standaard: `%USERPROFILE%\openclaw`)         |
| `-NoOnboard`                | Onboarding overslaan                                      |
| `-NoGitUpdate`              | `git pull` overslaan                                      |
| `-DryRun`                   | Alleen acties afdrukken                                   |

  </Accordion>

  <Accordion title="Referentie voor omgevingsvariabelen">

| Variabele                          | Beschrijving           |
| ---------------------------------- | ---------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installatiemethode     |
| `OPENCLAW_GIT_DIR=<path>`          | Checkoutmap            |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding overslaan   |
| `OPENCLAW_GIT_UPDATE=0`            | git pull uitschakelen  |
| `OPENCLAW_DRY_RUN=1`               | Proefrunmodus          |

  </Accordion>
</AccordionGroup>

<Note>
Als `-InstallMethod git` wordt gebruikt en Git ontbreekt, sluit het script af en drukt het de link naar Git for Windows af.
</Note>

---

## CI en automatisering

Gebruik niet-interactieve flags/env-vars voor voorspelbare uitvoeringen.

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
  <Tab title="install.ps1 (onboarding overslaan)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Waarom is Git vereist?">
    Git is vereist voor de `git`-installatiemethode. Voor `npm`-installaties wordt Git nog steeds gecontroleerd/geïnstalleerd om `spawn git ENOENT`-fouten te voorkomen wanneer afhankelijkheden git-URL's gebruiken.
  </Accordion>

  <Accordion title="Waarom krijgt npm EACCES op Linux?">
    Sommige Linux-configuraties wijzen de globale npm-prefix naar paden die eigendom zijn van root. `install.sh` kan de prefix overschakelen naar `~/.npm-global` en PATH-exports toevoegen aan shell-rc-bestanden (wanneer die bestanden bestaan).
  </Accordion>

  <Accordion title="sharp/libvips-problemen">
    De scripts gebruiken standaard `SHARP_IGNORE_GLOBAL_LIBVIPS=1` om te voorkomen dat sharp tegen systeem-libvips wordt gebouwd. Overschrijven:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Installeer Git for Windows, open PowerShell opnieuw en voer het installatieprogramma opnieuw uit.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Voer `npm config get prefix` uit en voeg die map toe aan je gebruikers-PATH (geen `\bin`-suffix nodig op Windows), en open PowerShell daarna opnieuw.
  </Accordion>

  <Accordion title="Windows: uitgebreide uitvoer van het installatieprogramma krijgen">
    `install.ps1` biedt momenteel geen `-Verbose`-schakelaar.
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
- [Deïnstalleren](/nl/install/uninstall)
