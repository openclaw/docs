---
read_when:
    - Je moet Node.js installeren voordat je OpenClaw installeert
    - Je hebt OpenClaw geïnstalleerd, maar `openclaw` wordt niet gevonden als opdracht
    - npm install -g mislukt door problemen met machtigingen of PATH
summary: Node.js installeren en configureren voor OpenClaw — versievereisten, installatieopties en probleemoplossing voor PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-29T22:55:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99c72b917fa8beba136ee6010799c0183cff8b2420b5a1bd256d9155e50f065a
    source_path: install/node.md
    workflow: 16
---

OpenClaw vereist **Node 22.14 of nieuwer**. **Node 24 is de standaard en aanbevolen runtime** voor installaties, CI en release-workflows. Node 22 blijft ondersteund via de actieve LTS-lijn. Het [installatiescript](/nl/install#alternative-install-methods) detecteert en installeert Node automatisch — deze pagina is bedoeld voor wanneer je Node zelf wilt instellen en wilt controleren of alles correct is aangesloten (versies, PATH, globale installaties).

## Controleer je versie

```bash
node -v
```

Als dit `v24.x.x` of hoger toont, gebruik je de aanbevolen standaardversie. Als dit `v22.14.x` of hoger toont, gebruik je het ondersteunde Node 22 LTS-pad, maar we raden nog steeds aan om naar Node 24 te upgraden wanneer dat uitkomt. Als Node niet is geïnstalleerd of de versie te oud is, kies dan hieronder een installatiemethode.

## Node installeren

<Tabs>
  <Tab title="macOS">
    **Homebrew** (aanbevolen):

    ```bash
    brew install node
    ```

    Of download het macOS-installatieprogramma van [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Of gebruik een versiebeheerder (zie hieronder).

  </Tab>
  <Tab title="Windows">
    **winget** (aanbevolen):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Of download het Windows-installatieprogramma van [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Een versiebeheerder gebruiken (nvm, fnm, mise, asdf)">
  Met versiebeheerders kun je eenvoudig wisselen tussen Node-versies. Populaire opties:

- [**fnm**](https://github.com/Schniz/fnm) — snel, cross-platform
- [**nvm**](https://github.com/nvm-sh/nvm) — veel gebruikt op macOS/Linux
- [**mise**](https://mise.jdx.dev/) — polyglot (Node, Python, Ruby, enz.)

Voorbeeld met fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Zorg ervoor dat je versiebeheerder is geïnitialiseerd in het opstartbestand van je shell (`~/.zshrc` of `~/.bashrc`). Als dat niet zo is, wordt `openclaw` mogelijk niet gevonden in nieuwe terminalsessies, omdat de PATH de bin-map van Node niet bevat.
  </Warning>
</Accordion>

## Probleemoplossing

### `openclaw: command not found`

Dit betekent vrijwel altijd dat de globale bin-map van npm niet in je PATH staat.

<Steps>
  <Step title="Zoek je globale npm-prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Controleer of deze in je PATH staat">
    ```bash
    echo "$PATH"
    ```

    Zoek naar `<npm-prefix>/bin` (macOS/Linux) of `<npm-prefix>` (Windows) in de uitvoer.

  </Step>
  <Step title="Voeg deze toe aan het opstartbestand van je shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Voeg toe aan `~/.zshrc` of `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Open daarna een nieuwe terminal (of voer `rehash` uit in zsh / `hash -r` in bash).
      </Tab>
      <Tab title="Windows">
        Voeg de uitvoer van `npm prefix -g` toe aan je systeem-PATH via Instellingen → Systeem → Omgevingsvariabelen.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Machtigingsfouten bij `npm install -g` (Linux)

Als je `EACCES`-fouten ziet, wijzig dan de globale prefix van npm naar een map waarin de gebruiker kan schrijven:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Voeg de regel `export PATH=...` toe aan je `~/.bashrc` of `~/.zshrc` om dit permanent te maken.

## Gerelateerd

- [Installatieoverzicht](/nl/install) — alle installatiemethoden
- [Bijwerken](/nl/install/updating) — OpenClaw up-to-date houden
- [Aan de slag](/nl/start/getting-started) — eerste stappen na installatie
