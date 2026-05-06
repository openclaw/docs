---
read_when:
    - Je hebt een andere installatiemethode nodig dan de quickstart Aan de slag
    - Je wilt implementeren op een cloudplatform
    - Je moet bijwerken, migreren of verwijderen
summary: OpenClaw installeren - installatiescript, npm/pnpm/bun, vanuit de broncode, Docker en meer
title: Installeren
x-i18n:
    generated_at: "2026-05-06T09:19:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## Systeemvereisten

- **Node 24** (aanbevolen) of Node 22.14+ - het installatiescript handelt dit automatisch af
- **macOS, Linux of Windows** - zowel native Windows als WSL2 worden ondersteund; WSL2 is stabieler. Zie [Windows](/nl/platforms/windows).
- `pnpm` is alleen nodig als je vanaf broncode bouwt

## Aanbevolen: installatiescript

De snelste manier om te installeren. Het detecteert je besturingssysteem, installeert Node indien nodig, installeert OpenClaw en start het introductieproces.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Installeren zonder het introductieproces uit te voeren:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Zie voor alle flags en CI-/automatiseringsopties [Interne werking van het installatiescript](/nl/install/installer).

## Alternatieve installatiemethoden

### Installer met lokale prefix (`install-cli.sh`)

Gebruik dit wanneer je OpenClaw en Node onder een lokale prefix zoals
`~/.openclaw` wilt houden, zonder afhankelijk te zijn van een systeembrede Node-installatie:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Het ondersteunt standaard npm-installaties, plus git-checkout-installaties via dezelfde
prefix-werkwijze. Volledige referentie: [Interne werking van het installatiescript](/nl/install/installer#install-clish).

Al geïnstalleerd? Schakel tussen pakket- en git-installaties met
`openclaw update --channel dev` en `openclaw update --channel stable`. Zie
[Bijwerken](/nl/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm of bun

Als je Node al zelf beheert:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm vereist expliciete goedkeuring voor pakketten met buildscripts. Voer `pnpm approve-builds -g` uit na de eerste installatie.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun wordt ondersteund voor het globale CLI-installatiepad. Voor de Gateway-runtime blijft Node de aanbevolen runtime voor de daemon.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Probleemoplossing: buildfouten van sharp (npm)">
  Als `sharp` faalt door een globaal geïnstalleerde libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Vanaf broncode

Voor bijdragers of iedereen die vanuit een lokale checkout wil draaien:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Of sla de link over en gebruik `pnpm openclaw ...` vanuit de repo. Zie [Installatie](/nl/start/setup) voor volledige ontwikkelwerkwijzen.

### Installeren vanaf GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Containers en pakketbeheerders

<CardGroup cols={2}>
  <Card title="Docker" href="/nl/install/docker" icon="container">
    Gecontaineriseerde implementaties of implementaties zonder grafische interface.
  </Card>
  <Card title="Podman" href="/nl/install/podman" icon="container">
    Containeralternatief voor Docker zonder rootrechten.
  </Card>
  <Card title="Nix" href="/nl/install/nix" icon="snowflake">
    Declaratieve installatie via Nix-flake.
  </Card>
  <Card title="Ansible" href="/nl/install/ansible" icon="server">
    Geautomatiseerde inrichting van een servervloot.
  </Card>
  <Card title="Bun" href="/nl/install/bun" icon="zap">
    Gebruik alleen via de CLI met de Bun-runtime.
  </Card>
</CardGroup>

## Controleer de installatie

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Als je beheerd opstarten na installatie wilt:

- macOS: LaunchAgent via `openclaw onboard --install-daemon` of `openclaw gateway install`
- Linux/WSL2: systemd-gebruikersservice via dezelfde opdrachten
- Native Windows: eerst een geplande taak, met een loginitem in de Opstartmap per gebruiker als terugvaloptie als het maken van de taak wordt geweigerd

## Hosting en implementatie

Implementeer OpenClaw op een cloudserver of VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/nl/vps">Elke Linux-VPS</Card>
  <Card title="Docker VM" href="/nl/install/docker-vm-runtime">Gedeelde Docker-stappen</Card>
  <Card title="Kubernetes" href="/nl/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/nl/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/nl/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/nl/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/nl/install/azure">Azure</Card>
  <Card title="Railway" href="/nl/install/railway">Railway</Card>
  <Card title="Render" href="/nl/install/render">Render</Card>
  <Card title="Northflank" href="/nl/install/northflank">Northflank</Card>
</CardGroup>

## Bijwerken, migreren of verwijderen

<CardGroup cols={3}>
  <Card title="Bijwerken" href="/nl/install/updating" icon="refresh-cw">
    Houd OpenClaw bijgewerkt.
  </Card>
  <Card title="Migreren" href="/nl/install/migrating" icon="arrow-right">
    Verhuis naar een nieuwe machine.
  </Card>
  <Card title="Verwijderen" href="/nl/install/uninstall" icon="trash-2">
    Verwijder OpenClaw volledig.
  </Card>
</CardGroup>

## Probleemoplossing: `openclaw` niet gevonden

Als de installatie is geslaagd maar `openclaw` niet wordt gevonden in je terminal:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Als `$(npm prefix -g)/bin` niet in je `$PATH` staat, voeg deze toe aan je shell-opstartbestand (`~/.zshrc` of `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Open daarna een nieuwe terminal. Zie [Node-installatie](/nl/install/node) voor meer informatie.
