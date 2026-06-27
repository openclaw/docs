---
read_when:
    - Sie benötigen eine andere Installationsmethode als den Schnellstart „Erste Schritte“
    - Sie möchten auf einer Cloud-Plattform bereitstellen
    - Sie müssen aktualisieren, migrieren oder deinstallieren
summary: OpenClaw installieren - Installationsskript, npm/pnpm/bun, aus dem Quellcode, Docker und mehr
title: Installieren
x-i18n:
    generated_at: "2026-06-27T17:38:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8c6108cecea3e38a6f714758fe4de9b01eebe1c89f9ff68251685c440e8a41f
    source_path: install/index.md
    workflow: 16
---

## Systemanforderungen

- **Node 24** (empfohlen) oder Node 22.19+ - das Installer-Skript übernimmt dies automatisch
- **macOS, Linux oder Windows** - Windows-Nutzer können mit der nativen Windows Hub-App, dem PowerShell-CLI-Installer oder einem WSL2-Gateway starten. Siehe [Windows](/de/platforms/windows).
- `pnpm` wird nur benötigt, wenn Sie aus dem Quellcode bauen

## Empfohlen: Installer-Skript

Der schnellste Weg zur Installation. Es erkennt Ihr Betriebssystem, installiert bei Bedarf Node, installiert OpenClaw und startet das Onboarding.

<Note>
Windows-Desktop-Nutzer können außerdem die native Begleit-App [Windows Hub](/de/platforms/windows#recommended-windows-hub) installieren, die Einrichtung, Tray-Status, Chat, Node-Modus und lokalen MCP-Modus enthält.
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

Installation ohne Ausführen des Onboardings:

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

### Installer mit lokalem Präfix (`install-cli.sh`)

Verwenden Sie dies, wenn OpenClaw und Node unter einem lokalen Präfix wie
`~/.openclaw` abgelegt werden sollen, ohne von einer systemweiten Node-Installation abhängig zu sein:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Standardmäßig werden npm-Installationen unterstützt, außerdem Git-Checkout-Installationen im selben
Präfixablauf. Vollständige Referenz: [Installer-Interna](/de/install/installer#install-clish).

Bereits installiert? Wechseln Sie mit
`openclaw update --channel dev` und `openclaw update --channel stable` zwischen Paket- und Git-Installationen. Siehe
[Aktualisieren](/de/install/updating#switch-between-npm-and-git-installs).

### npm, pnpm oder bun

Wenn Sie Node bereits selbst verwalten:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Der gehostete Installer entfernt npm-Aktualitätsfilter wie `min-release-age`
    für die Installation des OpenClaw-Pakets. Wenn Sie manuell mit npm installieren, gilt weiterhin
    Ihre eigene npm-Richtlinie.
    </Note>

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
    Bun wird für den globalen CLI-Installationspfad unterstützt. Für die Gateway-Laufzeit bleibt Node die empfohlene Daemon-Laufzeitumgebung.
    </Note>

  </Tab>
</Tabs>

### Aus dem Quellcode

Für Beitragende oder alle, die aus einem lokalen Checkout heraus ausführen möchten:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Oder überspringen Sie den Link und verwenden Sie `pnpm openclaw ...` innerhalb des Repos. Vollständige Entwicklungsabläufe finden Sie unter [Einrichtung](/de/start/setup).

### Installation aus dem GitHub-main-Checkout

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Container und Paketmanager

<CardGroup cols={2}>
  <Card title="Docker" href="/de/install/docker" icon="container">
    Containerisierte oder Headless-Bereitstellungen.
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
- Natives Windows: zuerst geplante Aufgabe, mit einem Login-Eintrag im benutzerspezifischen Autostart-Ordner als Fallback, falls die Aufgabenerstellung verweigert wird

## Hosting und Bereitstellung

Stellen Sie OpenClaw auf einem Cloud-Server oder VPS bereit:

<CardGroup cols={3}>
  <Card title="VPS" href="/de/vps">
    Beliebiger Linux-VPS.
  </Card>
  <Card title="Docker VM" href="/de/install/docker-vm-runtime">
    Gemeinsame Docker-Schritte.
  </Card>
  <Card title="Kubernetes" href="/de/install/kubernetes">
    K8s-Bereitstellung.
  </Card>
  <Card title="Fly.io" href="/de/install/fly">
    Auf Fly.io bereitstellen.
  </Card>
  <Card title="Hetzner" href="/de/install/hetzner">
    Hetzner-Bereitstellung.
  </Card>
  <Card title="GCP" href="/de/install/gcp">
    Google Cloud-Bereitstellung.
  </Card>
  <Card title="Azure" href="/de/install/azure">
    Azure-Bereitstellung.
  </Card>
  <Card title="Railway" href="/de/install/railway">
    Railway-Bereitstellung.
  </Card>
  <Card title="Render" href="/de/install/render">
    Render-Bereitstellung.
  </Card>
  <Card title="Northflank" href="/de/install/northflank">
    Northflank-Bereitstellung.
  </Card>
</CardGroup>

## Aktualisieren, migrieren oder deinstallieren

<CardGroup cols={3}>
  <Card title="Updating" href="/de/install/updating" icon="refresh-cw">
    Halten Sie OpenClaw aktuell.
  </Card>
  <Card title="Migrating" href="/de/install/migrating" icon="arrow-right">
    Auf einen neuen Computer umziehen.
  </Card>
  <Card title="Uninstall" href="/de/install/uninstall" icon="trash-2">
    OpenClaw vollständig entfernen.
  </Card>
</CardGroup>

## Fehlerbehebung: `openclaw` nicht gefunden

Wenn die Installation erfolgreich war, `openclaw` in Ihrem Terminal aber nicht gefunden wird:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Wenn `$(npm prefix -g)/bin` nicht in Ihrem `$PATH` ist, fügen Sie es Ihrer Shell-Startdatei (`~/.zshrc` oder `~/.bashrc`) hinzu:

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Öffnen Sie anschließend ein neues Terminal. Weitere Details finden Sie unter [Node-Einrichtung](/de/install/node).
