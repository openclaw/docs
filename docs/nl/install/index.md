---
read_when:
    - Je hebt een andere installatiemethode nodig dan de snelstart Aan de slag
    - Je wilt uitrollen naar een cloudplatform
    - Je moet bijwerken, migreren of verwijderen
summary: OpenClaw installeren - installatiescript, npm/pnpm/bun, vanuit de broncode, Docker en meer
title: Installeren
x-i18n:
    generated_at: "2026-05-07T13:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a5dc92d262710cc96a160b7cac2b93ee1e25f994ddcd45e274ad96c026b7d72
    source_path: install/index.md
    workflow: 16
---

## Systeemvereisten

- **Node 24** (aanbevolen) of Node 22.16+ - het installatiescript regelt dit automatisch
- **macOS, Linux of Windows** - zowel native Windows als WSL2 worden ondersteund; WSL2 is stabieler. Zie [Windows](/nl/platforms/windows).
- `pnpm` is alleen nodig als je vanuit de broncode bouwt

## Aanbevolen: installatiescript

De snelste manier om te installeren. Het detecteert je OS, installeert Node indien nodig, installeert OpenClaw en start de onboarding.

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

Installeren zonder onboarding uit te voeren:

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

Zie [Interne werking van de installer](/nl/install/installer) voor alle vlaggen en CI-/automatiseringsopties.

## Alternatieve installatiemethoden

### Lokale prefix-installer (`install-cli.sh`)

Gebruik dit wanneer je OpenClaw en Node onder een lokale prefix zoals
`~/.openclaw` wilt houden, zonder afhankelijk te zijn van een systeembrede Node-installatie:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Standaard worden npm-installaties ondersteund, plus git-checkout-installaties onder dezelfde
prefix-flow. Volledige referentie: [Interne werking van de installer](/nl/install/installer#install-clish).

Al geinstalleerd? Wissel tussen package- en git-installaties met
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
    pnpm vereist expliciete goedkeuring voor packages met buildscripts. Voer `pnpm approve-builds -g` uit na de eerste installatie.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun wordt ondersteund voor het globale CLI-installatiepad. Voor de Gateway-runtime blijft Node de aanbevolen daemon-runtime.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Probleemoplossing: sharp-buildfouten (npm)">
  Als `sharp` mislukt door een globaal geinstalleerde libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Vanuit broncode

Voor bijdragers of iedereen die vanuit een lokale checkout wil draaien:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Of sla de link over en gebruik `pnpm openclaw ...` vanuit de repo. Zie [Setup](/nl/start/setup) voor volledige ontwikkelworkflows.

### Installeren vanaf GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Containers en packagemanagers

<CardGroup cols={2}>
  <Card title="Docker" href="/nl/install/docker" icon="container">
    Gecontaineriseerde of headless deployments.
  </Card>
  <Card title="Podman" href="/nl/install/podman" icon="container">
    Containeralternatief zonder rootrechten voor Docker.
  </Card>
  <Card title="Nix" href="/nl/install/nix" icon="snowflake">
    Declaratieve installatie via Nix flake.
  </Card>
  <Card title="Ansible" href="/nl/install/ansible" icon="server">
    Geautomatiseerde fleet-provisioning.
  </Card>
  <Card title="Bun" href="/nl/install/bun" icon="zap">
    Alleen CLI-gebruik via de Bun-runtime.
  </Card>
</CardGroup>

## De installatie verifieren

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Als je beheerde opstart na installatie wilt:

- macOS: LaunchAgent via `openclaw onboard --install-daemon` of `openclaw gateway install`
- Linux/WSL2: systemd-gebruikersservice via dezelfde opdrachten
- Native Windows: eerst Scheduled Task, met een login-item in de Startup-map per gebruiker als fallback als het maken van de taak wordt geweigerd

## Hosting en deployment

Deploy OpenClaw op een cloudserver of VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/nl/vps">Elke Linux-VPS</Card>
  <Card title="Docker-VM" href="/nl/install/docker-vm-runtime">Gedeelde Docker-stappen</Card>
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
    Houd OpenClaw up-to-date.
  </Card>
  <Card title="Migreren" href="/nl/install/migrating" icon="arrow-right">
    Verplaats naar een nieuwe machine.
  </Card>
  <Card title="Verwijderen" href="/nl/install/uninstall" icon="trash-2">
    Verwijder OpenClaw volledig.
  </Card>
</CardGroup>

## Probleemoplossing: `openclaw` niet gevonden

Als de installatie is geslaagd, maar `openclaw` niet wordt gevonden in je terminal:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Als `$(npm prefix -g)/bin` niet in je `$PATH` staat, voeg dit dan toe aan je shell-startupbestand (`~/.zshrc` of `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Open daarna een nieuwe terminal. Zie [Node-setup](/nl/install/node) voor meer details.
