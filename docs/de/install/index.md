---
read_when:
    - Sie benötigen eine andere Installationsmethode als den Schnellstart unter „Erste Schritte“
    - Sie möchten auf einer Cloud-Plattform bereitstellen
    - Sie müssen aktualisieren, migrieren oder deinstallieren
summary: OpenClaw installieren - Installationsskript, npm/pnpm/bun, aus dem Quellcode, Docker und mehr
title: Installieren
x-i18n:
    generated_at: "2026-05-06T06:53:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d5b38787ad80f91c82aa1fd4020a11c99f440ccbf2e9b9309da336dd5883462
    source_path: install/index.md
    workflow: 16
---

## Systemanforderungen

- **Node 24** (empfohlen) oder Node 22.14+ - das Installationsskript übernimmt dies automatisch
- **macOS, Linux oder Windows** - sowohl natives Windows als auch WSL2 werden unterstützt; WSL2 ist stabiler. Siehe [Windows](/de/platforms/windows).
- `pnpm` wird nur benötigt, wenn Sie aus dem Quellcode bauen

## Empfohlen: Installationsskript

Der schnellste Weg zur Installation. Es erkennt Ihr Betriebssystem, installiert Node bei Bedarf, installiert OpenClaw und startet das Onboarding.

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

Zur Installation ohne Ausführen des Onboardings:

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

Alle Flags und CI-/Automatisierungsoptionen finden Sie unter [Installer-Interna](/de/install/installer).

## Alternative Installationsmethoden

### Lokaler Präfix-Installer (`install-cli.sh`)

Verwenden Sie dies, wenn OpenClaw und Node unter einem lokalen Präfix wie
`~/.openclaw` liegen sollen, ohne von einer systemweiten Node-Installation abhängig zu sein:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Standardmäßig werden npm-Installationen unterstützt, außerdem Git-Checkout-Installationen im selben
Präfix-Ablauf. Vollständige Referenz: [Installer-Interna](/de/install/installer#install-clish).

Bereits installiert? Wechseln Sie mit
`openclaw update --channel dev` und `openclaw update --channel stable` zwischen Paket- und Git-Installationen. Siehe
[Aktualisierung](/de/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm oder bun

Wenn Sie Node bereits selbst verwalten:

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
    pnpm erfordert eine ausdrückliche Genehmigung für Pakete mit Build-Skripten. Führen Sie nach der ersten Installation `pnpm approve-builds -g` aus.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun wird für den globalen CLI-Installationspfad unterstützt. Für die Gateway-Laufzeit bleibt Node die empfohlene Daemon-Laufzeit.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Fehlerbehebung: sharp-Build-Fehler (npm)">
  Wenn `sharp` aufgrund einer global installierten libvips fehlschlägt:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Aus dem Quellcode

Für Mitwirkende oder alle, die aus einem lokalen Checkout ausführen möchten:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Oder überspringen Sie das Verknüpfen und verwenden Sie `pnpm openclaw ...` innerhalb des Repos. Siehe [Einrichtung](/de/start/setup) für vollständige Entwicklungsabläufe.

### Aus GitHub main installieren

```bash
npm install -g github:openclaw/openclaw#main
```

### Container und Paketmanager

<CardGroup cols={2}>
  <Card title="Docker" href="/de/install/docker" icon="container">
    Containerisierte oder headless Bereitstellungen.
  </Card>
  <Card title="Podman" href="/de/install/podman" icon="container">
    Rootless-Container-Alternative zu Docker.
  </Card>
  <Card title="Nix" href="/de/install/nix" icon="snowflake">
    Deklarative Installation über Nix-Flake.
  </Card>
  <Card title="Ansible" href="/de/install/ansible" icon="server">
    Automatisierte Flottenbereitstellung.
  </Card>
  <Card title="Bun" href="/de/install/bun" icon="zap">
    Reine CLI-Nutzung über die Bun-Laufzeit.
  </Card>
</CardGroup>

## Installation überprüfen

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Wenn Sie nach der Installation einen verwalteten Start wünschen:

- macOS: LaunchAgent über `openclaw onboard --install-daemon` oder `openclaw gateway install`
- Linux/WSL2: systemd-Benutzerdienst über dieselben Befehle
- Natives Windows: zuerst geplante Aufgabe, mit einem benutzerbezogenen Login-Element im Startup-Ordner als Fallback, falls die Aufgabenerstellung verweigert wird

## Hosting und Bereitstellung

Stellen Sie OpenClaw auf einem Cloud-Server oder VPS bereit:

<CardGroup cols={3}>
  <Card title="VPS" href="/de/vps">Beliebiger Linux-VPS</Card>
  <Card title="Docker VM" href="/de/install/docker-vm-runtime">Gemeinsame Docker-Schritte</Card>
  <Card title="Kubernetes" href="/de/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/de/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/de/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/de/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/de/install/azure">Azure</Card>
  <Card title="Railway" href="/de/install/railway">Railway</Card>
  <Card title="Render" href="/de/install/render">Render</Card>
  <Card title="Northflank" href="/de/install/northflank">Northflank</Card>
</CardGroup>

## Aktualisieren, migrieren oder deinstallieren

<CardGroup cols={3}>
  <Card title="Updating" href="/de/install/updating" icon="refresh-cw">
    Halten Sie OpenClaw aktuell.
  </Card>
  <Card title="Migrating" href="/de/install/migrating" icon="arrow-right">
    Wechseln Sie auf einen neuen Computer.
  </Card>
  <Card title="Uninstall" href="/de/install/uninstall" icon="trash-2">
    Entfernen Sie OpenClaw vollständig.
  </Card>
</CardGroup>

## Fehlerbehebung: `openclaw` nicht gefunden

Wenn die Installation erfolgreich war, `openclaw` in Ihrem Terminal aber nicht gefunden wird:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Wenn `$(npm prefix -g)/bin` nicht in Ihrem `$PATH` enthalten ist, fügen Sie es Ihrer Shell-Startdatei hinzu (`~/.zshrc` oder `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Öffnen Sie anschließend ein neues Terminal. Weitere Details finden Sie unter [Node-Einrichtung](/de/install/node).
