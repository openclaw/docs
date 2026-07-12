---
read_when:
    - Je wilt `openclaw.ai/install.sh` begrijpen
    - U wilt installaties automatiseren (CI / zonder grafische interface)
    - Je wilt installeren vanuit een GitHub-check-out
summary: Hoe de installatiescripts werken (install.sh, install-cli.sh, install.ps1), opties en automatisering
title: Interne werking van het installatieprogramma
x-i18n:
    generated_at: "2026-07-12T09:00:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 59b38a2eecbf15cc966beada81acf1824229a3825c73ae33ea0f8e89612bdf5b
    source_path: install/installer.md
    workflow: 16
---

OpenClaw levert drie installatiescripts, aangeboden via `openclaw.ai`.

| Script                             | Platform             | Wat het doet                                                                                           |
| ---------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Installeert indien nodig Node, installeert OpenClaw via npm (standaard) of git en kan de configuratie starten. |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Installeert Node + OpenClaw via npm of git in een lokaal voorvoegsel (`~/.openclaw`). Geen root vereist. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Installeert indien nodig Node, installeert OpenClaw via npm (standaard) of git en kan de configuratie starten. |

Alle drie ondersteunen Node **22.19+, 23.11+ of 24+**; Node 24 is het standaarddoel voor nieuwe installaties.

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
Als de installatie slaagt maar `openclaw` niet wordt gevonden in een nieuwe terminal, raadpleeg dan [Problemen met Node.js oplossen](/nl/install/node#troubleshooting).
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
    Ondersteunt macOS en Linux (inclusief WSL).
  </Step>
  <Step title="Standaard Node.js 24 garanderen">
    Controleert de Node-versie en installeert indien nodig Node 24 (Homebrew op macOS, NodeSource-configuratiescripts op Linux met apt/dnf/yum). Op macOS wordt Homebrew alleen geïnstalleerd wanneer het installatieprogramma dit nodig heeft voor Node of Git. Node 22.19+ en 23.11+ blijven voor compatibiliteit ondersteund.
    Op Alpine/musl Linux gebruikt het installatieprogramma apk-pakketten in plaats van NodeSource; de geconfigureerde Alpine-pakketbronnen moeten een ondersteunde Node-versie aanbieden (op het moment van schrijven Alpine 3.21 of nieuwer).
  </Step>
  <Step title="Git garanderen">
    Installeert Git als dit ontbreekt met het gedetecteerde pakketbeheer, waaronder Homebrew op macOS en apk op Alpine.
  </Step>
  <Step title="OpenClaw installeren">
    - `npm`-methode (standaard): globale npm-installatie
    - `git`-methode: kloont of werkt de repository bij, installeert afhankelijkheden met pnpm, bouwt het project en installeert vervolgens de wrapper in `~/.local/bin/openclaw`

  </Step>
  <Step title="Taken na installatie">
    - Bepaalt het zojuist geïnstalleerde binaire bestand `openclaw` voor vervolgopdrachten
    - Voor een niet-geconfigureerde installatie wordt de configuratie gestart vóór doctor- of Gateway-controles. Met `--no-onboard` of zonder TTY wordt de opdracht weergegeven waarmee de configuratie later kan worden voltooid.
    - Voor een geconfigureerde installatie wordt een geladen Gateway-service naar beste vermogen vernieuwd en opnieuw gestart en wordt doctor uitgevoerd. Bij upgrades worden Plugins waar mogelijk bijgewerkt, of wordt bij een headless uitvoering met prompts de handmatige opdracht weergegeven.
    - Wanneer `--verify` wordt uitgevoerd, controleert dit de geïnstalleerde versie en alleen als er een configuratie bestaat ook de status van de Gateway.

  </Step>
</Steps>

### Detectie van broncodecheckout

Als het script binnen een OpenClaw-checkout (`package.json` + `pnpm-workspace.yaml`) wordt uitgevoerd, biedt het de volgende opties:

- de checkout gebruiken (`git`), of
- de globale installatie gebruiken (`npm`)

Als er geen TTY beschikbaar is en geen installatiemethode is ingesteld, wordt standaard `npm` gebruikt en wordt een waarschuwing weergegeven.

Het script wordt afgesloten met code `2` bij een ongeldige methodeselectie of ongeldige waarden voor `--install-method`.

### Voorbeelden (install.sh)

<Tabs>
  <Tab title="Standaard">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Configuratie overslaan">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git-installatie">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="Checkout van GitHub-main">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
    ```
  </Tab>
  <Tab title="Proefuitvoering">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
  <Tab title="Verifiëren na installatie">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard --verify
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Overzicht van vlaggen">

| Vlag                                    | Beschrijving                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `--install-method \| --method npm\|git` | Installatiemethode kiezen (standaard: `npm`)                                      |
| `--npm`                                 | Snelkoppeling voor de npm-methode                                                |
| `--git \| --github`                     | Snelkoppeling voor de git-methode                                                |
| `--version <version\|dist-tag\|spec>`   | npm-versie, distributielabel of pakketspecificatie (standaard: `latest`)          |
| `--beta`                                | Het bèta-distributielabel gebruiken indien beschikbaar, anders `latest` gebruiken |
| `--git-dir \| --dir <path>`             | Checkoutmap (standaard: `~/openclaw`)                                            |
| `--no-git-update`                       | `git pull` overslaan voor een bestaande checkout                                 |
| `--no-prompt`                           | Prompts uitschakelen                                                             |
| `--no-onboard`                          | Configuratie overslaan                                                           |
| `--onboard`                             | Configuratie inschakelen                                                         |
| `--verify`                              | Een snelle verificatie na installatie uitvoeren (`--version`, Gateway-status indien geladen) |
| `--dry-run`                             | Acties weergeven zonder wijzigingen toe te passen                                |
| `--verbose`                             | Foutopsporingsuitvoer inschakelen (`set -x`, npm-logboeken op meldingsniveau)     |
| `--help \| -h`                          | Gebruiksinformatie weergeven                                                     |

  </Accordion>

  <Accordion title="Overzicht van omgevingsvariabelen">

| Variabele                                         | Beschrijving                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                | Installatiemethode                                                              |
| `OPENCLAW_VERSION=latest\|next\|<semver>\|<spec>` | npm-versie, distributielabel of pakketspecificatie                               |
| `OPENCLAW_BETA=0\|1`                              | Bèta gebruiken indien beschikbaar                                               |
| `OPENCLAW_HOME=<path>`                            | Basismap voor OpenClaw-status en standaardpaden voor git/configuratie            |
| `OPENCLAW_GIT_DIR=<path>`                         | Checkoutmap                                                                      |
| `OPENCLAW_GIT_UPDATE=0\|1`                        | Git-updates in- of uitschakelen                                                  |
| `OPENCLAW_NO_PROMPT=1`                            | Prompts uitschakelen                                                             |
| `OPENCLAW_VERIFY_INSTALL=1`                       | De snelle verificatie na installatie uitvoeren                                  |
| `OPENCLAW_NO_ONBOARD=1`                           | Configuratie overslaan                                                           |
| `OPENCLAW_DRY_RUN=1`                              | Proefuitvoeringsmodus                                                            |
| `OPENCLAW_VERBOSE=1`                              | Foutopsporingsmodus                                                              |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`       | npm-logniveau (standaard: `error`, verbergt npm-waarschuwingen over veroudering) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Ontworpen voor omgevingen waarin u alles onder een lokaal voorvoegsel wilt
(standaard `~/.openclaw`) en geen systeemafhankelijkheid van Node wilt. Ondersteunt
standaard npm-installaties en daarnaast installaties vanuit een git-checkout via hetzelfde voorvoegsel.
</Info>

### Verloop (install-cli.sh)

<Steps>
  <Step title="Lokale Node-runtime installeren">
    Downloadt een vastgezette, ondersteunde Node LTS-tarball (de versie is in het script opgenomen en wordt onafhankelijk bijgewerkt, standaard `22.22.2`) naar `<prefix>/tools/node-v<version>` en verifieert SHA-256.
    Op Alpine/musl Linux, waarvoor Node geen compatibele tarballs voor de vastgezette runtime publiceert, worden `nodejs` en `npm` met `apk` geïnstalleerd en wordt die runtime gekoppeld aan het wrapperpad in het voorvoegsel. De Alpine-pakketbronnen moeten een ondersteunde Node-versie aanbieden (22.19+, 23.11+ of 24+); gebruik Alpine 3.21 of nieuwer als oudere pakketbronnen alleen Node 20 of 21 aanbieden.
  </Step>
  <Step title="Git garanderen">
    Als Git ontbreekt, wordt geprobeerd dit via apt/dnf/yum/apk op Linux of Homebrew op macOS te installeren.
  </Step>
  <Step title="OpenClaw onder het voorvoegsel installeren">
    - `npm`-methode (standaard): installeert met npm onder het voorvoegsel en schrijft vervolgens de wrapper naar `<prefix>/bin/openclaw`
    - `git`-methode: kloont of werkt een checkout bij (standaard `~/openclaw`) en schrijft de wrapper eveneens naar `<prefix>/bin/openclaw`

  </Step>
  <Step title="Geladen Gateway-service vernieuwen">
    Als er al een Gateway-service vanuit hetzelfde voorvoegsel is geladen, voert het script
    `openclaw gateway install --force` en vervolgens `openclaw gateway restart` uit, waarna
    het naar beste vermogen de status van de Gateway controleert.
  </Step>
</Steps>

### Voorbeelden (install-cli.sh)

<Tabs>
  <Tab title="Standaard">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Aangepast voorvoegsel + versie">
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
  <Tab title="Configuratie uitvoeren">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Overzicht van vlaggen">

| Vlag                                    | Beschrijving                                                                     |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| `--prefix <path>`                       | Installatievoorvoegsel (standaard: `~/.openclaw`)                                |
| `--install-method \| --method npm\|git` | Kies de installatiemethode (standaard: `npm`)                                    |
| `--npm`                                 | Snelkoppeling voor de npm-methode                                                |
| `--git \| --github`                     | Snelkoppeling voor de git-methode                                                |
| `--git-dir \| --dir <path>`             | Git-checkoutmap (standaard: `~/openclaw`)                                        |
| `--version <ver>`                       | OpenClaw-versie of dist-tag (standaard: `latest`)                                |
| `--node-version <ver>`                  | Node-versie (standaard: `22.22.2`)                                               |
| `--json`                                | NDJSON-gebeurtenissen uitvoeren                                                  |
| `--onboard`                             | Na installatie `openclaw onboard` uitvoeren                                     |
| `--no-onboard`                          | Onboarding overslaan (standaard)                                                 |
| `--set-npm-prefix`                      | Op Linux het npm-voorvoegsel afdwingen op `~/.npm-global` als het huidige voorvoegsel niet beschrijfbaar is |
| `--help \| -h`                          | Gebruik weergeven                                                                |

  </Accordion>

  <Accordion title="Naslag voor omgevingsvariabelen">

| Variabele                                   | Beschrijving                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                    | Installatievoorvoegsel                                                     |
| `OPENCLAW_INSTALL_METHOD=git\|npm`          | Installatiemethode                                                        |
| `OPENCLAW_VERSION=<ver>`                    | OpenClaw-versie of dist-tag                                                |
| `OPENCLAW_NODE_VERSION=<ver>`               | Node-versie                                                               |
| `OPENCLAW_HOME=<path>`                      | Basismap voor OpenClaw-status en standaardpaden voor git en onboarding     |
| `OPENCLAW_GIT_DIR=<path>`                   | Git-checkoutmap voor git-installaties                                     |
| `OPENCLAW_GIT_UPDATE=0\|1`                  | Git-updates voor bestaande checkouts in- of uitschakelen                  |
| `OPENCLAW_NO_ONBOARD=1`                     | Onboarding overslaan                                                      |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | npm-logniveau (standaard: `error`)                                        |

  </Accordion>
</AccordionGroup>

<Note>
`openclaw@main` en andere GitHub-bronspecificaties zijn geen geldige `--version`-doelen voor npm-installaties. Gebruik in plaats daarvan `--install-method git --version main`.
</Note>

---

<a id="installps1"></a>

## install.ps1

### Verloop (install.ps1)

<Steps>
  <Step title="PowerShell- en Windows-omgeving controleren">
    Vereist PowerShell 5+.
  </Step>
  <Step title="Standaard Node.js 24 beschikbaar maken">
    Als dit ontbreekt, wordt installatie geprobeerd via winget, daarna Chocolatey en vervolgens Scoop. Als er geen pakketbeheerder beschikbaar is, downloadt het script het officiële Windows-zipbestand van Node.js 24 naar `%LOCALAPPDATA%\OpenClaw\deps\portable-node` en voegt het dit toe aan het PATH van het huidige proces en de gebruiker. Node 22.19+ en 23.11+ blijven voor compatibiliteit ondersteund.
  </Step>
  <Step title="OpenClaw installeren">
    - `npm`-methode (standaard): globale npm-installatie met de geselecteerde `-Tag`, gestart vanuit een beschrijfbare tijdelijke installatiemap zodat shells die in beveiligde mappen zoals `C:\` zijn geopend, blijven werken
    - `git`-methode: repository klonen/bijwerken, installeren/bouwen met pnpm en een wrapper installeren op `%USERPROFILE%\.local\bin\openclaw.cmd`. Als Git ontbreekt, initialiseert het script een gebruikerslokale MinGit onder `%LOCALAPPDATA%\OpenClaw\deps\portable-git` en voegt het deze toe aan het PATH van het huidige proces en de gebruiker.

  </Step>
  <Step title="Taken na installatie">
    - Voegt waar mogelijk de benodigde bin-map toe aan het gebruikers-PATH
    - Vernieuwt naar beste vermogen een geladen Gateway-service (`openclaw gateway install --force`, daarna opnieuw starten)
    - Voert bij upgrades en git-installaties `openclaw doctor --non-interactive` uit (naar beste vermogen)

  </Step>
  <Step title="Fouten afhandelen">
    Installaties via `iwr ... | iex` en scriptblokken melden een beëindigende fout zonder de huidige PowerShell-sessie te sluiten. Rechtstreekse installaties via `powershell -File` / `pwsh -File` eindigen voor automatisering nog steeds met een niet-nulstatus.
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
  <Tab title="Checkout van GitHub-main">
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
</Tabs>

<AccordionGroup>
  <Accordion title="Naslag voor vlaggen">

| Vlag                        | Beschrijving                                                       |
| --------------------------- | ------------------------------------------------------------------ |
| `-InstallMethod npm\|git`   | Installatiemethode (standaard: `npm`)                              |
| `-Tag <tag\|version\|spec>` | npm-dist-tag, versie of pakketspecificatie (standaard: `latest`)   |
| `-GitDir <path>`            | Checkoutmap (standaard: `%USERPROFILE%\openclaw`)                  |
| `-NoOnboard`                | Onboarding overslaan                                               |
| `-NoGitUpdate`              | `git pull` overslaan                                               |
| `-DryRun`                   | Alleen acties weergeven                                            |

  </Accordion>

  <Accordion title="Naslag voor omgevingsvariabelen">

| Variabele                          | Beschrijving             |
| ---------------------------------- | ------------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Installatiemethode       |
| `OPENCLAW_GIT_DIR=<path>`          | Checkoutmap              |
| `OPENCLAW_NO_ONBOARD=1`            | Onboarding overslaan     |
| `OPENCLAW_GIT_UPDATE=0`            | git pull uitschakelen    |
| `OPENCLAW_DRY_RUN=1`               | Proefuitvoeringsmodus    |

  </Accordion>
</AccordionGroup>

<Note>
Als `-InstallMethod git` wordt gebruikt en Git ontbreekt, probeert het script een gebruikerslokale MinGit te initialiseren voordat het de koppeling naar Git for Windows weergeeft.
</Note>

---

## CI en automatisering

Gebruik niet-interactieve vlaggen/omgevingsvariabelen voor voorspelbare uitvoeringen.

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

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Waarom is Git vereist?">
    Git is vereist voor de `git`-installatiemethode. Bij `npm`-installaties wordt Git nog steeds gecontroleerd/geïnstalleerd om `spawn git ENOENT`-fouten te voorkomen wanneer afhankelijkheden git-URL's gebruiken.
  </Accordion>

  <Accordion title="Waarom krijgt npm op Linux een EACCES-fout?">
    Sommige Linux-configuraties verwijzen voor het globale npm-voorvoegsel naar paden die eigendom zijn van root. `install.sh` kan het voorvoegsel wijzigen in `~/.npm-global` en PATH-exportregels toevoegen aan shell-rc-bestanden (als die bestanden bestaan).
  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Voer het installatieprogramma opnieuw uit zodat het een gebruikerslokale MinGit kan initialiseren, of installeer Git for Windows en open PowerShell opnieuw.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Voer `npm config get prefix` uit en voeg die map toe aan uw gebruikers-PATH (in Windows is geen achtervoegsel `\bin` nodig). Open daarna PowerShell opnieuw.
  </Accordion>

  <Accordion title="Windows: uitgebreide uitvoer van het installatieprogramma verkrijgen">
    `install.ps1` biedt geen schakeloptie `-Verbose`.
    Gebruik PowerShell-tracering voor diagnostiek op scriptniveau:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw niet gevonden na installatie">
    Meestal is dit een PATH-probleem. Zie [Problemen met Node.js oplossen](/nl/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Bijwerken](/nl/install/updating)
- [Verwijderen](/nl/install/uninstall)
