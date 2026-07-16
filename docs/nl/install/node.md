---
read_when:
    - Je moet Node.js installeren voordat je OpenClaw installeert
    - Je hebt OpenClaw geïnstalleerd, maar `openclaw` geeft ‘opdracht niet gevonden’ aan
    - npm install -g mislukt door problemen met machtigingen of PATH
summary: Node.js installeren en configureren voor OpenClaw - versievereisten, installatieopties en probleemoplossing voor PATH
title: Node.js
x-i18n:
    generated_at: "2026-07-16T15:59:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef4df255c24a11a549c757b597a07b00852e60973a5e513bdcf60796037a462a
    source_path: install/node.md
    workflow: 16
---

OpenClaw vereist **Node 22.22.3+, Node 24.15+ of Node 25.9+**. **Node 24 is de standaard en aanbevolen runtime** voor installaties, CI en releaseworkflows; Node 22 blijft ondersteund via de actieve LTS-lijn. Node 23 wordt niet ondersteund. Het [installatiescript](/nl/install#alternative-install-methods) detecteert en installeert Node automatisch — gebruik deze pagina als je Node zelf wilt configureren (versies, PATH, globale installaties).

## Controleer je versie

```bash
node -v
```

`v24.15.0` of een nieuwere 24.x-versie is de aanbevolen standaard. `v22.22.3` of een nieuwere 22.x-versie is het ondersteunde Node 22 LTS-traject; Node `v25.9.0+` wordt ook ondersteund. Node 23 wordt niet ondersteund. Als Node ontbreekt of buiten het ondersteunde bereik valt, kies dan hieronder een installatiemethode.

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
  Met versiebeheerders kun je eenvoudig tussen Node-versies schakelen. Populaire opties:

- [**fnm**](https://github.com/Schniz/fnm) - snel, platformonafhankelijk
- [**nvm**](https://github.com/nvm-sh/nvm) - veelgebruikt op macOS/Linux
- [**mise**](https://mise.jdx.dev/) - meertalig (Node, Python, Ruby enzovoort)

Voorbeeld met fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Initialiseer je versiebeheerder in het opstartbestand van je shell (`~/.zshrc` of `~/.bashrc`). Als je dit overslaat, wordt `openclaw` mogelijk niet gevonden in nieuwe terminalsessies, omdat PATH de bin-map van Node niet bevat.
  </Warning>
</Accordion>

## Problemen oplossen

### `openclaw: command not found`

Dit betekent bijna altijd dat de globale bin-map van npm niet in je PATH staat.

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

    Zoek in de uitvoer naar `<npm-prefix>/bin` (macOS/Linux) of `<npm-prefix>` (Windows).

  </Step>
  <Step title="Voeg deze toe aan het opstartbestand van je shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Voeg het volgende toe aan `~/.zshrc` of `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Open daarna een nieuwe terminal (of voer `rehash` uit in zsh / `hash -r` in bash).
      </Tab>
      <Tab title="Windows">
        Voeg de uitvoer van `npm prefix -g` toe aan je systeem-PATH via Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Machtigingsfouten bij `npm install -g` (Linux)

Als je `EACCES`-fouten ziet, wijzig dan de globale prefix van npm in een map waarin de gebruiker kan schrijven:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Voeg de regel `export PATH=...` toe aan je `~/.bashrc` of `~/.zshrc` om de wijziging permanent te maken.

## Gerelateerd

- [Installatieoverzicht](/nl/install) - alle installatiemethoden
- [Bijwerken](/nl/install/updating) - OpenClaw up-to-date houden
- [Aan de slag](/nl/start/getting-started) - eerste stappen na de installatie
