---
read_when:
    - Je wilt `openclaw.ai/install.sh` begrijpen
    - Je wilt installaties automatiseren (CI / zonder grafische interface)
    - Je wilt installeren vanuit een GitHub-checkout
summary: Hoe de installerscripts werken (install.sh, install-cli.sh, install.ps1), flags en automatisering
title: Interne werking van het installatieprogramma
x-i18n:
    generated_at: "2026-06-27T17:42:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72182472f423e64b33afa071feda76c2c9abdf896bffa269f2148124c49a451c
    source_path: install/installer.md
    workflow: 16
---

OpenClaw levert drie installatiescripts, aangeboden vanaf `openclaw.ai`.

| Script                             | Platform             | Wat het doet                                                                                                                    |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installeert Node indien nodig, installeert OpenClaw via npm (standaard) of git, en kan onboarding uitvoeren.                    |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installeert Node + OpenClaw in een lokale prefix (`~/.openclaw`) met npm- of git-checkoutmodi. Geen root vereist.               |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installeert Node indien nodig, installeert OpenClaw via npm (standaard) of git, en kan onboarding uitvoeren.                    |

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
Als de installatie slaagt maar `openclaw` niet wordt gevonden in een nieuwe terminal, zie [Problemen met Node.js oplossen](/nl/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Aanbevolen voor de meeste interactieve installaties op macOS/Linux/WSL.
</Tip>

### Flow (install.sh)

<Steps>
  <Step title="Besturingssysteem detecteren">
    Ondersteunt macOS en Linux (inclusief WSL).
  </Step>
  <Step title="Standaard Node.js 24 garanderen">
    Controleert de Node-versie en installeert Node 24 indien nodig (Homebrew op macOS, NodeSource-installatiescripts op Linux apt/dnf/yum). Op macOS wordt Homebrew alleen geïnstalleerd wanneer het installatieprogramma dit nodig heeft voor Node of Git. OpenClaw ondersteunt nog steeds Node 22 LTS, momenteel `22.19+`, voor compatibiliteit.
    Op Alpine/musl Linux gebruikt het installatieprogramma apk-pakketten in plaats van NodeSource; de geconfigureerde Alpine-repository's moeten Node `22.19+` leveren (Alpine 3.21 of nieuwer op het moment van schrijven).
  </Step>
  <Step title="Git garanderen">
    Installeert Git als dit ontbreekt met de gedetecteerde pakketbeheerder, inclusief Homebrew op macOS en apk op Alpine.
  </Step>
  <Step title="OpenClaw installeren">
    - `npm`-methode (standaard): globale npm-installatie
    - `git`-methode: repo klonen/bijwerken, afhankelijkheden installeren met pnpm, bouwen, daarna wrapper installeren op `~/.local/bin/openclaw`

  </Step>
  <Step title="Taken na installatie">
    - Vernieuwt een geladen Gateway-service naar beste vermogen (`openclaw gateway install --force`, daarna opnieuw starten)
    - Voert `openclaw doctor --non-interactive` uit bij upgrades en git-installaties (naar beste vermogen)
    - Probeert onboarding wanneer dat passend is (TTY beschikbaar, onboarding niet uitgeschakeld, en bootstrap-/configuratiecontroles slagen)

  </Step>
</Steps>

### Detectie van bron-checkout

Als het script wordt uitgevoerd binnen een OpenClaw-checkout (`package.json` + `pnpm-workspace.yaml`), biedt het script:

- checkout gebruiken (`git`), of
- globale installatie gebruiken (`npm`)

Als er geen TTY beschikbaar is en er geen installatiemethode is ingesteld, gebruikt het standaard `npm` en geeft het een waarschuwing.

Het script sluit af met code `2` bij ongeldige methodeselectie of ongeldige `--install-method`-waarden.

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
  <Tab title="GitHub main-checkout">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Proefrun">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Naslag voor flags">

| Flag                                  | Beschrijving                                                      |
| ------------------------------------- | ----------------------------------------------------------------- |
| `--install-method npm\|git`           | Kies installatiemethode (standaard: `npm`). Alias: `--method`     |
| `--npm`                               | Snelkoppeling voor npm-methode                                    |
| `--git`                               | Snelkoppeling voor git-methode. Alias: `--github`                 |
| `--version <version\|dist-tag\|spec>` | npm-versie, dist-tag of pakketspecificatie (standaard: `latest`)  |
| `--beta`                              | Gebruik beta-dist-tag indien beschikbaar, anders terugval naar `latest` |
| `--git-dir <path>`                    | Checkoutmap (standaard: `~/openclaw`). Alias: `--dir`             |
| `--no-git-update`                     | Sla `git pull` over voor bestaande checkout                       |
| `--no-prompt`                         | Schakel prompts uit                                               |
| `--no-onboard`                        | Sla onboarding over                                               |
| `--onboard`                           | Schakel onboarding in                                             |
| `--dry-run`                           | Toon acties zonder wijzigingen toe te passen                      |
| `--verbose`                           | Schakel debuguitvoer in (`set -x`, npm notice-level logs)         |
| `--help`                              | Toon gebruik (`-h`)                                               |

  </Accordion>

  <Accordion title="Naslag voor omgevingsvariabelen">

| Variabele                                         | Beschrijving                                                            |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Installatiemethode                                                      |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm-versie, dist-tag of pakketspecificatie                              |
| `OPENCLAW_BETA=0\|1`                              | Gebruik beta indien beschikbaar                                         |
| `OPENCLAW_HOME=<path>`                            | Basismap voor OpenClaw-status en standaard git-/onboardingpaden         |
| `OPENCLAW_GIT_DIR=<path>`                         | Checkoutmap                                                             |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Git-updates in- of uitschakelen                                         |
| `OPENCLAW_NO_PROMPT=1`                            | Schakel prompts uit                                                     |
| `OPENCLAW_NO_ONBOARD=1`                           | Sla onboarding over                                                     |
| `OPENCLAW_DRY_RUN=1`                              | Proefrunmodus                                                           |
| `OPENCLAW_VERBOSE=1`                              | Debugmodus                                                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm-logniveau                                                           |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Ontworpen voor omgevingen waarin je alles onder een lokale prefix wilt
(standaard `~/.openclaw`) en geen systeemafhankelijkheid van Node wilt. Ondersteunt standaard npm-installaties,
plus git-checkoutinstallaties binnen dezelfde prefix-flow.
</Info>

### Flow (install-cli.sh)

<Steps>
  <Step title="Lokale Node-runtime installeren">
    Downloadt een vastgepinde ondersteunde Node LTS-tarball (de versie is in het script opgenomen en wordt onafhankelijk bijgewerkt) naar `<prefix>/tools/node-v<version>` en verifieert SHA-256.
    Op Alpine/musl Linux, waar Node geen compatibele tarballs voor de vastgepinde runtime publiceert, installeert het script `nodejs` en `npm` met `apk` en koppelt het die runtime aan het wrapperpad binnen de prefix. De Alpine-repository's moeten Node `22.19+` leveren; gebruik Alpine 3.21 of nieuwer als oudere repository's alleen Node 20 of 21 leveren.
  </Step>
  <Step title="Git garanderen">
    Als Git ontbreekt, probeert het script installatie via apt/dnf/yum/apk op Linux of Homebrew op macOS.
  </Step>
  <Step title="OpenClaw onder prefix installeren">
    - `npm`-methode (standaard): installeert onder de prefix met npm en schrijft daarna de wrapper naar `<prefix>/bin/openclaw`
    - `git`-methode: kloont/bijwerkt een checkout (standaard `~/openclaw`) en schrijft nog steeds de wrapper naar `<prefix>/bin/openclaw`

  </Step>
  <Step title="Geladen Gateway-service vernieuwen">
    Als er al een Gateway-service vanuit dezelfde prefix is geladen, voert het script
    `openclaw gateway install --force` uit, daarna `openclaw gateway restart`, en
    peilt het de Gateway-gezondheid naar beste vermogen.
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
  <Accordion title="Naslag voor flags">

| Vlag                        | Beschrijving                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Installatieprefix (standaard: `~/.openclaw`)                                    |
| `--install-method npm\|git` | Kies installatiemethode (standaard: `npm`). Alias: `--method`                   |
| `--npm`                     | Snelkoppeling voor npm-methode                                                  |
| `--git`, `--github`         | Snelkoppeling voor git-methode                                                  |
| `--git-dir <path>`          | Git-checkoutmap (standaard: `~/openclaw`). Alias: `--dir`                       |
| `--version <ver>`           | OpenClaw-versie of dist-tag (standaard: `latest`)                               |
| `--node-version <ver>`      | Node-versie (standaard: `22.22.0`)                                               |
| `--json`                    | Genereer NDJSON-gebeurtenissen                                                  |
| `--onboard`                 | Voer `openclaw onboard` uit na installatie                                      |
| `--no-onboard`              | Sla onboarding over (standaard)                                                  |
| `--set-npm-prefix`          | Forceer op Linux npm-prefix naar `~/.npm-global` als huidige prefix niet schrijfbaar is |
| `--help`                    | Toon gebruik (`-h`)                                                              |

  </Accordion>

  <Accordion title="Referentie voor omgevingsvariabelen">

| Variabele                                   | Beschrijving                                                        |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `OPENCLAW_PREFIX=<path>`                    | Installatieprefix                                                   |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installatiemethode                                                  |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-versie of dist-tag                                         |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-versie                                                         |
| `OPENCLAW_HOME=<path>`                      | Basismap voor OpenClaw-status en standaard git-/onboardingpaden     |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-checkoutmap voor git-installaties                               |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Schakel git-updates voor bestaande checkouts in of uit              |
| `OPENCLAW_NO_ONBOARD=1`                     | Sla onboarding over                                                 |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-logniveau                                                       |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Stroom (install.ps1)

<Steps>
  <Step title="Zorg voor PowerShell + Windows-omgeving">
    Vereist PowerShell 5+.
  </Step>
  <Step title="Zorg standaard voor Node.js 24">
    Als dit ontbreekt, probeert het script installatie via winget, daarna Chocolatey en daarna Scoop. Als er geen pakketbeheerder beschikbaar is, downloadt het script de officiële Node.js-Windows-zip naar `%LOCALAPPDATA%\OpenClaw\deps\portable-node` en voegt het deze toe aan het huidige proces en de gebruikers-PATH. Node 22 LTS, momenteel `22.19+`, blijft ondersteund voor compatibiliteit.
  </Step>
  <Step title="Installeer OpenClaw">
    - `npm`-methode (standaard): globale npm-installatie met de geselecteerde `-Tag`, gestart vanuit een schrijfbare tijdelijke installatiemap zodat shells die in beschermde mappen zoals `C:\` zijn geopend nog steeds werken
    - `git`-methode: kloon/update de repo, installeer/bouw met pnpm en installeer de wrapper op `%USERPROFILE%\.local\bin\openclaw.cmd`. Als Git ontbreekt, bootstrapt het script gebruikerslokale MinGit onder `%LOCALAPPDATA%\OpenClaw\deps\portable-git` en voegt het deze toe aan het huidige proces en de gebruikers-PATH.

  </Step>
  <Step title="Taken na installatie">
    - Voegt waar mogelijk de benodigde bin-map toe aan de gebruikers-PATH
    - Vernieuwt naar beste vermogen een geladen Gateway-service (`openclaw gateway install --force`, daarna herstarten)
    - Voert `openclaw doctor --non-interactive` uit bij upgrades en git-installaties (naar beste vermogen)

  </Step>
  <Step title="Fouten afhandelen">
    `iwr ... | iex` en scriptblock-installaties rapporteren een beëindigende fout zonder de huidige PowerShell-sessie te sluiten. Directe `powershell -File` / `pwsh -File`-installaties sluiten nog steeds af met een niet-nulstatus voor automatisering.
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
  <Tab title="GitHub main-checkout">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -Tag main
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
  <Accordion title="Referentie voor vlaggen">

| Vlag                        | Beschrijving                                                |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Installatiemethode (standaard: `npm`)                      |
| `-Tag <tag\|version\|spec>` | npm-dist-tag, versie of pakketspecificatie (standaard: `latest`) |
| `-GitDir <path>`            | Checkoutmap (standaard: `%USERPROFILE%\openclaw`)          |
| `-NoOnboard`                | Sla onboarding over                                        |
| `-NoGitUpdate`              | Sla `git pull` over                                        |
| `-DryRun`                   | Druk alleen acties af                                      |

  </Accordion>

  <Accordion title="Referentie voor omgevingsvariabelen">

| Variabele                          | Beschrijving       |
| ---------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installatiemethode |
| `OPENCLAW_GIT_DIR=<path>`          | Checkoutmap        |
| `OPENCLAW_NO_ONBOARD=1`            | Sla onboarding over |
| `OPENCLAW_GIT_UPDATE=0`            | Schakel git pull uit |
| `OPENCLAW_DRY_RUN=1`               | Proefuitvoeringsmodus |

  </Accordion>
</AccordionGroup>

<Note>
Als `-InstallMethod git` wordt gebruikt en Git ontbreekt, probeert het script een gebruikerslokale MinGit-bootstrap voordat het de Git for Windows-link afdrukt.
</Note>

---

## CI en automatisering

Gebruik niet-interactieve vlaggen/omgevingsvariabelen voor voorspelbare runs.

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
    Sommige Linux-configuraties wijzen de globale npm-prefix naar paden die eigendom zijn van root. `install.sh` kan de prefix omzetten naar `~/.npm-global` en PATH-exports toevoegen aan shell-rc-bestanden (wanneer die bestanden bestaan).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Voer het installatieprogramma opnieuw uit zodat het gebruikerslokale MinGit kan bootstrappen, of installeer Git for Windows en open PowerShell opnieuw.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Voer `npm config get prefix` uit en voeg die map toe aan je gebruikers-PATH (geen `\bin`-achtervoegsel nodig op Windows), en open PowerShell daarna opnieuw.
  </Accordion>

  <Accordion title="Windows: hoe krijg je uitgebreide uitvoer van het installatieprogramma">
    `install.ps1` biedt momenteel geen `-Verbose`-schakeloptie.
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
