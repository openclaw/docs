---
read_when:
    - Sie benötigen eine andere Installationsmethode als den Schnellstart unter „Erste Schritte“.
    - Sie möchten auf einer Cloud-Plattform bereitstellen.
    - Sie müssen aktualisieren, migrieren oder deinstallieren.
summary: OpenClaw installieren — Installer-Skript, npm/pnpm/bun, aus dem Quellcode, Docker und mehr
title: Installation
x-i18n:
    generated_at: "2026-04-26T11:32:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8dc6b9511be6bf9060cc150a7c51daf3b6d556dab4a85910094b4b892145cd7
    source_path: install/index.md
    workflow: 15
---

## Systemanforderungen

- **Node 24** (empfohlen) oder Node 22.14+ — das Installer-Skript übernimmt dies automatisch
- **macOS, Linux oder Windows** — sowohl natives Windows als auch WSL2 werden unterstützt; WSL2 ist stabiler. Siehe [Windows](/de/platforms/windows).
- `pnpm` wird nur benötigt, wenn Sie aus dem Quellcode bauen

## Empfohlen: Installer-Skript

Der schnellste Weg zur Installation. Es erkennt Ihr Betriebssystem, installiert bei Bedarf Node, installiert OpenClaw und startet das Onboarding.

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

Installation ohne Onboarding:

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

Alle Flags sowie Optionen für CI/Automatisierung finden Sie unter [Installer internals](/de/install/installer).

## Alternative Installationsmethoden

### Installer mit lokalem Präfix (`install-cli.sh`)

Verwenden Sie dies, wenn Sie OpenClaw und Node unter einem lokalen Präfix wie
`~/.openclaw` halten möchten, ohne von einer systemweiten Node-Installation abhängig zu sein:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Standardmäßig unterstützt es npm-Installationen sowie Installationen aus einem Git-Checkout innerhalb desselben
Präfix-Flows. Vollständige Referenz: [Installer internals](/de/install/installer#install-clish).

Bereits installiert? Wechseln Sie zwischen Paket- und Git-Installationen mit
`openclaw update --channel dev` und `openclaw update --channel stable`. Siehe
[Aktualisieren](/de/install/updating#switch-between-npm-and-git-installs).

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
    pnpm erfordert eine explizite Genehmigung für Pakete mit Build-Skripten. Führen Sie nach der ersten Installation `pnpm approve-builds -g` aus.
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
  Wenn `sharp` aufgrund eines global installierten libvips fehlschlägt:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Aus dem Quellcode

Für Mitwirkende oder alle, die aus einem lokalen Checkout heraus arbeiten möchten:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Oder überspringen Sie das Linken und verwenden Sie `pnpm openclaw ...` innerhalb des Repositorys. Vollständige Entwicklungs-Workflows finden Sie unter [Setup](/de/start/setup).

### Von GitHub main installieren

```bash
npm install -g github:openclaw/openclaw#main
```

### Container und Paketmanager

<CardGroup cols={2}>
  <Card title="Docker" href="/de/install/docker" icon="container">
    Containerisierte oder headless Deployments.
  </Card>
  <Card title="Podman" href="/de/install/podman" icon="container">
    Rootless-Container-Alternative zu Docker.
  </Card>
  <Card title="Nix" href="/de/install/nix" icon="snowflake">
    Deklarative Installation über Nix Flake.
  </Card>
  <Card title="Ansible" href="/de/install/ansible" icon="server">
    Automatisierte Bereitstellung für Flotten.
  </Card>
  <Card title="Bun" href="/de/install/bun" icon="zap">
    Nur-CLI-Nutzung über die Bun-Laufzeit.
  </Card>
</CardGroup>

## Installation überprüfen

```bash
openclaw --version      # prüfen, ob die CLI verfügbar ist
openclaw doctor         # auf Konfigurationsprobleme prüfen
openclaw gateway status # prüfen, ob das Gateway läuft
```

Wenn Sie nach der Installation einen verwalteten Start möchten:

- macOS: LaunchAgent über `openclaw onboard --install-daemon` oder `openclaw gateway install`
- Linux/WSL2: systemd-Benutzerdienst über dieselben Befehle
- Natives Windows: zuerst Scheduled Task, mit Fallback auf ein Login-Element im benutzerspezifischen Startup-Ordner, falls die Task-Erstellung verweigert wird

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
  <Card title="Aktualisieren" href="/de/install/updating" icon="refresh-cw">
    OpenClaw aktuell halten.
  </Card>
  <Card title="Migrieren" href="/de/install/migrating" icon="arrow-right">
    Auf einen neuen Rechner umziehen.
  </Card>
  <Card title="Deinstallieren" href="/de/install/uninstall" icon="trash-2">
    OpenClaw vollständig entfernen.
  </Card>
</CardGroup>

## Fehlerbehebung: `openclaw` nicht gefunden

Wenn die Installation erfolgreich war, `openclaw` aber in Ihrem Terminal nicht gefunden wird:

```bash
node -v           # Ist Node installiert?
npm prefix -g     # Wo sind globale Pakete?
echo "$PATH"      # Ist das globale bin-Verzeichnis in PATH?
```

Wenn `$(npm prefix -g)/bin` nicht in Ihrem `$PATH` ist, fügen Sie es Ihrer Shell-Startdatei (`~/.zshrc` oder `~/.bashrc`) hinzu:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Öffnen Sie dann ein neues Terminal. Weitere Details finden Sie unter [Node setup](/de/install/node).
