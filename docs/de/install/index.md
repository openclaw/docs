---
read_when:
    - Sie benötigen eine andere Installationsmethode als die Schnellstartanleitung „Erste Schritte“
    - Sie möchten die Bereitstellung auf einer Cloud-Plattform durchführen
    - Sie müssen aktualisieren, migrieren oder deinstallieren
summary: OpenClaw installieren – Installationsskript, npm/pnpm/bun, aus dem Quellcode, Docker und mehr
title: Installieren
x-i18n:
    generated_at: "2026-07-12T15:34:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cc819cc6c1d57af0739a7d11f0f2834479ddabbca0571b105b8cb9325e87b145
    source_path: install/index.md
    workflow: 16
---

## Systemanforderungen

- **Node 22.19+, 23.11+ oder 24+** – Node 24 ist das standardmäßige Ziel; das Installationsskript übernimmt dies automatisch.
- **macOS, Linux oder Windows** – Windows-Benutzer können mit der nativen Windows Hub-App, dem PowerShell-CLI-Installationsprogramm oder einem WSL2-Gateway beginnen. Siehe [Windows](/de/platforms/windows).
- `pnpm` wird nur benötigt, wenn Sie aus dem Quellcode bauen.

## Empfohlen: Installationsskript

Die schnellste Installationsmethode. Es erkennt Ihr Betriebssystem, installiert bei Bedarf Node, installiert OpenClaw und startet das Onboarding.

<Note>
Benutzer von Windows-Desktop-Systemen können auch die native Begleit-App [Windows Hub](/de/platforms/windows#recommended-windows-hub) installieren, die Einrichtung, Taskleistenstatus, Chat, Node-Modus und lokalen MCP-Modus umfasst.
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

So installieren Sie ohne Ausführung des Onboardings:

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

Alle Flags und Optionen für CI/Automatisierung finden Sie unter [Interna des Installationsprogramms](/de/install/installer).

## Alternative Installationsmethoden

### Installationsprogramm mit lokalem Präfix (`install-cli.sh`)

Verwenden Sie diese Methode, wenn OpenClaw und Node unter einem lokalen Präfix wie
`~/.openclaw` gespeichert werden sollen, ohne von einer systemweiten Node-Installation abhängig zu sein:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Standardmäßig werden npm-Installationen sowie Installationen aus einem Git-Checkout
mit demselben Präfixablauf unterstützt. Vollständige Referenz: [Interna des Installationsprogramms](/de/install/installer#install-clish).

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

    <Note>
    Das gehostete Installationsprogramm deaktiviert für die Installation des OpenClaw-Pakets npm-Aktualitätsfilter wie `min-release-age`.
    Wenn Sie die Installation manuell mit npm durchführen, gilt weiterhin Ihre eigene
    npm-Richtlinie.
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
    Bun wird für den globalen CLI-Installationspfad unterstützt. Für die Gateway-Laufzeit bleibt Node die empfohlene Daemon-Laufzeit.
    </Note>

  </Tab>
</Tabs>

### Aus dem Quellcode

Für Mitwirkende oder alle, die OpenClaw aus einem lokalen Checkout ausführen möchten:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Alternativ können Sie die Verknüpfung überspringen und `pnpm openclaw ...` innerhalb des Repositorys verwenden. Vollständige Entwicklungsabläufe finden Sie unter [Einrichtung](/de/start/setup).

### Aus dem GitHub-Main-Checkout installieren

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git --version main
```

### Container und Paketmanager

<CardGroup cols={2}>
  <Card title="Docker" href="/de/install/docker" icon="container">
    Containerisierte oder monitorlose Bereitstellungen.
  </Card>
  <Card title="Podman" href="/de/install/podman" icon="container">
    Rootless-Container-Alternative zu Docker.
  </Card>
  <Card title="Nix" href="/de/install/nix" icon="snowflake">
    Deklarative Installation über einen Nix-Flake.
  </Card>
  <Card title="Ansible" href="/de/install/ansible" icon="server">
    Automatisierte Bereitstellung für Geräteflotten.
  </Card>
  <Card title="Bun" href="/de/install/bun" icon="zap">
    Reine CLI-Nutzung über die Bun-Laufzeit.
  </Card>
</CardGroup>

## Installation überprüfen

```bash
openclaw --version      # bestätigen, dass die CLI verfügbar ist
openclaw doctor         # auf Konfigurationsprobleme prüfen
openclaw gateway status # überprüfen, ob das Gateway ausgeführt wird
```

Wenn Sie nach der Installation einen verwalteten Start wünschen:

- macOS: LaunchAgent über `openclaw onboard --install-daemon` oder `openclaw gateway install`
- Linux/WSL2: systemd-Benutzerdienst über dieselben Befehle
- Natives Windows: zunächst eine geplante Aufgabe, mit einem benutzerspezifischen Anmeldeeintrag im Autostartordner als Ausweichlösung, falls die Aufgabenerstellung verweigert wird

## Hosting und Bereitstellung

Stellen Sie OpenClaw auf einem Cloud-Server oder VPS bereit. Unter [Linux-Server](/de/vps) finden Sie die vollständige
Provider-Auswahl (DigitalOcean, Hetzner, Hostinger, Fly.io, GCP, Azure, Railway,
Northflank, Oracle Cloud, Raspberry Pi und weitere). Alternativ können Sie OpenClaw deklarativ auf
[Render](/de/install/render) bereitstellen.

<CardGroup cols={3}>
  <Card title="VPS" href="/de/vps">
    Wählen Sie einen Provider.
  </Card>
  <Card title="Docker-VM" href="/de/install/docker-vm-runtime">
    Gemeinsame Docker-Schritte.
  </Card>
  <Card title="Kubernetes" href="/de/install/kubernetes">
    K8s-Bereitstellung.
  </Card>
</CardGroup>

## Aktualisieren, migrieren oder deinstallieren

<CardGroup cols={3}>
  <Card title="Aktualisierung" href="/de/install/updating" icon="refresh-cw">
    Halten Sie OpenClaw auf dem neuesten Stand.
  </Card>
  <Card title="Migration" href="/de/install/migrating" icon="arrow-right">
    Wechseln Sie auf einen neuen Rechner.
  </Card>
  <Card title="Deinstallation" href="/de/install/uninstall" icon="trash-2">
    Entfernen Sie OpenClaw vollständig.
  </Card>
</CardGroup>

## Fehlerbehebung: `openclaw` nicht gefunden

Fast immer handelt es sich um ein PATH-Problem: Das globale Binärverzeichnis von npm ist nicht im `PATH` Ihrer Shell enthalten. Unter [Node.js-Fehlerbehebung](/de/install/node#troubleshooting) finden Sie die vollständige Lösung einschließlich des Windows-Pfads.

```bash
node -v           # Ist Node installiert?
npm prefix -g     # Wo befinden sich globale Pakete?
echo "$PATH"      # Befindet sich das globale Binärverzeichnis im PATH?
```
