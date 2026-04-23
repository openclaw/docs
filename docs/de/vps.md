---
read_when:
    - Sie möchten das Gateway auf einem Linux-Server oder Cloud-VPS ausführen
    - Sie benötigen einen schnellen Überblick über Hosting-Leitfäden
    - Sie möchten allgemeine Linux-Server-Optimierung für OpenClaw
sidebarTitle: Linux Server
summary: OpenClaw auf einem Linux-Server oder Cloud-VPS ausführen — Providerauswahl, Architektur und Optimierung
title: Linux-Server
x-i18n:
    generated_at: "2026-04-23T06:36:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Linux-Server

Führen Sie das OpenClaw Gateway auf einem beliebigen Linux-Server oder Cloud-VPS aus. Diese Seite hilft Ihnen bei der Auswahl eines Providers, erklärt, wie Cloud-Bereitstellungen funktionieren, und behandelt allgemeine Linux-Optimierungen, die überall gelten.

## Einen Provider auswählen

<CardGroup cols={2}>
  <Card title="Railway" href="/de/install/railway">Ein-Klick, Setup im Browser</Card>
  <Card title="Northflank" href="/de/install/northflank">Ein-Klick, Setup im Browser</Card>
  <Card title="DigitalOcean" href="/de/install/digitalocean">Einfacher kostenpflichtiger VPS</Card>
  <Card title="Oracle Cloud" href="/de/install/oracle">Always Free ARM-Tier</Card>
  <Card title="Fly.io" href="/de/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/de/install/hetzner">Docker auf Hetzner-VPS</Card>
  <Card title="Hostinger" href="/de/install/hostinger">VPS mit Ein-Klick-Setup</Card>
  <Card title="GCP" href="/de/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/de/install/azure">Linux-VM</Card>
  <Card title="exe.dev" href="/de/install/exe-dev">VM mit HTTPS-Proxy</Card>
  <Card title="Raspberry Pi" href="/de/install/raspberry-pi">ARM selbst gehostet</Card>
</CardGroup>

**AWS (EC2 / Lightsail / Free Tier)** funktioniert ebenfalls gut.
Ein Community-Video-Walkthrough ist verfügbar unter
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(Community-Ressource -- möglicherweise später nicht mehr verfügbar).

## Wie Cloud-Setups funktionieren

- Das **Gateway läuft auf dem VPS** und verwaltet Status + Workspace.
- Sie verbinden sich von Ihrem Laptop oder Telefon über die **Control UI** oder **Tailscale/SSH**.
- Behandeln Sie den VPS als Source of Truth und **sichern Sie** Status + Workspace regelmäßig.
- Sichere Standardeinstellung: Behalten Sie das Gateway auf loopback und greifen Sie über einen SSH-Tunnel oder Tailscale Serve darauf zu.
  Wenn Sie an `lan` oder `tailnet` binden, verlangen Sie `gateway.auth.token` oder `gateway.auth.password`.

Verwandte Seiten: [Gateway-Fernzugriff](/de/gateway/remote), [Plattformen-Hub](/de/platforms).

## Gemeinsamer Unternehmens-Agent auf einem VPS

Das Ausführen eines einzelnen Agent für ein Team ist ein gültiges Setup, wenn sich alle Benutzer innerhalb derselben Vertrauensgrenze befinden und der Agent nur geschäftlich genutzt wird.

- Halten Sie ihn auf einer dedizierten Runtime (VPS/VM/Container + dedizierter OS-Benutzer/-Konten).
- Melden Sie diese Runtime nicht bei persönlichen Apple-/Google-Konten oder persönlichen Browser-/Passwortmanager-Profilen an.
- Wenn Benutzer einander gegenüber adversarial sind, trennen Sie nach Gateway/Host/OS-Benutzer.

Details zum Sicherheitsmodell: [Sicherheit](/de/gateway/security).

## Verwendung von Nodes mit einem VPS

Sie können das Gateway in der Cloud halten und **Nodes** auf Ihren lokalen Geräten koppeln
(Mac/iOS/Android/headless). Nodes stellen lokale Bildschirm-/Kamera-/Canvas- und `system.run`-
Capabilities bereit, während das Gateway in der Cloud bleibt.

Dokumentation: [Nodes](/de/nodes), [Nodes CLI](/de/cli/nodes).

## Startoptimierung für kleine VMs und ARM-Hosts

Wenn sich CLI-Befehle auf leistungsschwachen VMs (oder ARM-Hosts) langsam anfühlen, aktivieren Sie den Modul-Compile-Cache von Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` verbessert die Startzeiten wiederholter Befehle.
- `OPENCLAW_NO_RESPAWN=1` vermeidet zusätzlichen Start-Overhead durch einen Self-Respawn-Pfad.
- Der erste Befehlslauf wärmt den Cache auf; nachfolgende Läufe sind schneller.
- Zu Raspberry-Pi-spezifischen Themen siehe [Raspberry Pi](/de/install/raspberry-pi).

### Checkliste für systemd-Optimierung (optional)

Für VM-Hosts mit `systemd` sollten Sie Folgendes erwägen:

- Fügen Sie Service-Umgebungsvariablen für einen stabilen Startpfad hinzu:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Halten Sie das Neustartverhalten explizit:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Bevorzugen Sie SSD-gestützte Datenträger für Status-/Cache-Pfade, um Kaltstartnachteile durch zufällige I/O zu verringern.

Für den Standardpfad `openclaw onboard --install-daemon` bearbeiten Sie die User-Unit:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Wenn Sie stattdessen absichtlich eine System-Unit installiert haben, bearbeiten Sie
`openclaw-gateway.service` über `sudo systemctl edit openclaw-gateway.service`.

Wie Richtlinien mit `Restart=` die automatisierte Wiederherstellung unterstützen:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Zu Linux-OOM-Verhalten, Auswahl von Child-Prozessen als Opfer und Diagnosen zu `exit 137`
siehe [Linux memory pressure and OOM kills](/de/platforms/linux#memory-pressure-and-oom-kills).
