---
read_when:
    - Je hebt een andere installatiemethode nodig dan de snelstartgids Aan de slag
    - Je wilt implementeren op een cloudplatform
    - Je moet bijwerken, migreren of verwijderen
summary: OpenClaw installeren - installatiescript, npm/pnpm/bun, vanuit de broncode, Docker en meer
title: Installeren
x-i18n:
    generated_at: "2026-07-16T15:58:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc6c6c33294852c90d2d2904b78ff8b0483b8e72a380d5835c5bdda67547de0c
    source_path: install/index.md
    workflow: 16
---

## Systeemvereisten

- **Node 22.22.3+, 24.15+ of 25.9+** - Node 24 is het standaarddoel; het installatiescript regelt dit automatisch.
- **macOS, Linux of Windows** - Windows-gebruikers kunnen beginnen met de systeemeigen Windows Hub-app, het PowerShell CLI-installatieprogramma of een WSL2 Gateway. Zie [Windows](/nl/platforms/windows).
- `pnpm` is alleen nodig als je vanuit de broncode bouwt.

## Aanbevolen: installatiescript

De snelste installatiemethode. Het detecteert je besturingssysteem, installeert indien nodig Node, installeert OpenClaw en start de onboarding.

<Note>
Gebruikers van Windows-desktops kunnen ook de systeemeigen begeleidende app [Windows Hub](/nl/platforms/windows#recommended-windows-hub) installeren, die configuratie, status in het systeemvak, chat, Node-modus en lokale MCP-modus bevat.
</Note>

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

Installeren zonder de onboarding uit te voeren:

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

Zie [Interne werking van het installatieprogramma](/nl/install/installer) voor alle vlaggen en opties voor CI/automatisering.

## Alternatieve installatiemethoden

### Installatieprogramma met lokaal voorvoegsel (`install-cli.sh`)

Gebruik dit wanneer je OpenClaw en Node onder een lokaal voorvoegsel wilt bewaren, zoals
`~/.openclaw`, zonder afhankelijk te zijn van een systeembrede Node-installatie:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Het ondersteunt standaard npm-installaties en daarnaast installaties vanuit een git-checkout binnen dezelfde
voorvoegselstroom. Volledige referentie: [Interne werking van het installatieprogramma](/nl/install/installer#install-clish).

Al geïnstalleerd? Wissel tussen pakket- en git-installaties met
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

    <Note>
    Het gehoste installatieprogramma wist npm-filters voor actualiteit, zoals `min-release-age`,
    voor de installatie van het OpenClaw-pakket. Als je handmatig installeert met npm, blijft je eigen
    npm-beleid van toepassing.
    </Note>

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
    Bun kan het globale pakket installeren, maar het resulterende uitvoerbare bestand `openclaw` vereist een ondersteunde Node-runtime, omdat de OpenClaw-status `node:sqlite` gebruikt.
    </Note>

  </Tab>
</Tabs>

### Vanuit de broncode

Voor bijdragers of iedereen die vanuit een lokale checkout wil werken:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Je kunt de koppeling ook overslaan en `pnpm openclaw ...` vanuit de repository gebruiken. Zie [Configuratie](/nl/start/setup) voor de volledige ontwikkelworkflows.

### Installeren vanuit de GitHub-checkout van main

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Containers en pakketbeheerders

<CardGroup cols={2}>
  <Card title="Docker" href="/nl/install/docker" icon="container">
    Implementaties in containers of zonder grafische interface.
  </Card>
  <Card title="Podman" href="/nl/install/podman" icon="container">
    Rootless containeralternatief voor Docker.
  </Card>
  <Card title="Nix" href="/nl/install/nix" icon="snowflake">
    Declaratieve installatie via een Nix-flake.
  </Card>
  <Card title="Ansible" href="/nl/install/ansible" icon="server">
    Geautomatiseerde inrichting van een machinepark.
  </Card>
  <Card title="Bun" href="/nl/install/bun" icon="zap">
    Optioneel installatieprogramma voor afhankelijkheden en uitvoerder van pakketscripts.
  </Card>
</CardGroup>

## De installatie verifiëren

```bash
openclaw --version      # bevestig dat de CLI beschikbaar is
openclaw doctor         # controleer op configuratieproblemen
openclaw gateway status # controleer of de Gateway actief is
```

Als je na de installatie beheerd opstarten wilt:

- macOS: LaunchAgent via `openclaw onboard --install-daemon` of `openclaw gateway install`
- Linux/WSL2: systemd-gebruikersservice via dezelfde opdrachten
- Systeemeigen Windows: eerst een geplande taak, met als terugvaloptie een aanmeldingsitem per gebruiker in de map Opstarten als het maken van de taak wordt geweigerd

## Hosting en implementatie

Implementeer OpenClaw op een cloudserver of VPS. Zie [Linux-server](/nl/vps) voor de volledige
providerkiezer (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi en meer), of implementeer declaratief op
[Render](/nl/install/render).

<CardGroup cols={3}>
  <Card title="VPS" href="/nl/vps">
    Kies een provider.
  </Card>
  <Card title="Docker-VM" href="/nl/install/docker-vm-runtime">
    Gedeelde Docker-stappen.
  </Card>
  <Card title="Kubernetes" href="/nl/install/kubernetes">
    K8s-implementatie.
  </Card>
</CardGroup>

## Bijwerken, migreren of verwijderen

<CardGroup cols={3}>
  <Card title="Bijwerken" href="/nl/install/updating" icon="refresh-cw">
    Houd OpenClaw actueel.
  </Card>
  <Card title="Migreren" href="/nl/install/migrating" icon="arrow-right">
    Verplaats naar een nieuwe machine.
  </Card>
  <Card title="Verwijderen" href="/nl/install/uninstall" icon="trash-2">
    Verwijder OpenClaw volledig.
  </Card>
</CardGroup>

## Probleemoplossing: `openclaw` niet gevonden

Dit is bijna altijd een PATH-probleem: de globale bin-map van npm staat niet in de `PATH` van je shell. Zie [Problemen met Node.js oplossen](/nl/install/node#troubleshooting) voor de volledige oplossing, inclusief het Windows-pad.

```bash
node -v           # Is Node geïnstalleerd?
npm prefix -g     # Waar staan globale pakketten?
echo "$PATH"      # Staat de globale bin-map in PATH?
```
