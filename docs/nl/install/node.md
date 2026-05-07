---
read_when:
    - Je moet Node.js installeren voordat je OpenClaw installeert
    - Je hebt OpenClaw geïnstalleerd, maar `openclaw` wordt niet gevonden als opdracht
    - npm install -g mislukt door machtigings- of PATH-problemen
summary: Node.js voor OpenClaw installeren en configureren - versievereisten, installatieopties en probleemoplossing voor PATH
title: Node.js
x-i18n:
    generated_at: "2026-05-07T13:22:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8ef8d00c8996741187000f55d07d15a2d09e89b6deb99cf687b6b9128ad266
    source_path: install/node.md
    workflow: 16
---

OpenClaw vereist **Node 22.16 of nieuwer**. **Node 24 is de standaard en aanbevolen runtime** voor installaties, CI en releaseworkflows. Node 22 blijft ondersteund via de actieve LTS-lijn. Het [installatiescript](/nl/install#alternative-install-methods) detecteert en installeert Node automatisch - deze pagina is bedoeld voor wanneer je Node zelf wilt instellen en zeker wilt weten dat alles correct is gekoppeld (versies, PATH, globale installaties).

## Controleer je versie

```bash
node -v
```

Als dit `v24.x.x` of hoger afdrukt, gebruik je de aanbevolen standaardversie. Als dit `v22.16.x` of hoger afdrukt, gebruik je het ondersteunde Node 22 LTS-pad, maar we raden nog steeds aan om naar Node 24 te upgraden wanneer dat uitkomt. Als Node niet is geïnstalleerd of de versie te oud is, kies dan hieronder een installatiemethode.

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

    Of gebruik een versiemanager (zie hieronder).

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

<Accordion title="Using a version manager (nvm, fnm, mise, asdf)">
  Versiemanagers laten je eenvoudig wisselen tussen Node-versies. Populaire opties:

- [**fnm**](https://github.com/Schniz/fnm) - snel, platformonafhankelijk
- [**nvm**](https://github.com/nvm-sh/nvm) - veelgebruikt op macOS/Linux
- [**mise**](https://mise.jdx.dev/) - polyglot (Node, Python, Ruby, enz.)

Voorbeeld met fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Zorg ervoor dat je versiemanager is geïnitialiseerd in het opstartbestand van je shell (`~/.zshrc` of `~/.bashrc`). Als dat niet zo is, wordt `openclaw` mogelijk niet gevonden in nieuwe terminalsessies omdat de PATH de bin-map van Node niet bevat.
  </Warning>
</Accordion>

## Problemen oplossen

### `openclaw: command not found`

Dit betekent bijna altijd dat de globale bin-map van npm niet op je PATH staat.

<Steps>
  <Step title="Find your global npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Check if it's on your PATH">
    ```bash
    echo "$PATH"
    ```

    Zoek naar `<npm-prefix>/bin` (macOS/Linux) of `<npm-prefix>` (Windows) in de uitvoer.

  </Step>
  <Step title="Add it to your shell startup file">
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

Als je `EACCES`-fouten ziet, verplaats dan de globale prefix van npm naar een map waarin de gebruiker kan schrijven:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Voeg de regel `export PATH=...` toe aan je `~/.bashrc` of `~/.zshrc` om dit permanent te maken.

## Gerelateerd

- [Installatie-overzicht](/nl/install) - alle installatiemethoden
- [Bijwerken](/nl/install/updating) - OpenClaw up-to-date houden
- [Aan de slag](/nl/start/getting-started) - eerste stappen na installatie
