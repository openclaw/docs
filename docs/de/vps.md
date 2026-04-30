---
read_when:
    - Sie möchten das Gateway auf einem Linux-Server oder einem Cloud-VPS ausführen
    - Sie benötigen eine schnelle Übersicht über die Hosting-Anleitungen
    - Sie möchten allgemeine Linux-Server-Optimierung für OpenClaw
sidebarTitle: Linux Server
summary: OpenClaw auf einem Linux-Server oder Cloud-VPS ausführen — Provider-Auswahl, Architektur und Tuning
title: Linux-Server
x-i18n:
    generated_at: "2026-04-30T07:21:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

Führen Sie den OpenClaw Gateway auf jedem Linux-Server oder Cloud-VPS aus. Diese Seite hilft Ihnen dabei,
einen Provider auszuwählen, erklärt, wie Cloud-Bereitstellungen funktionieren, und behandelt generisches Linux-
Tuning, das überall gilt.

## Provider auswählen

<CardGroup cols={2}>
  <Card title="Railway" href="/de/install/railway">Ein-Klick-Einrichtung im Browser</Card>
  <Card title="Northflank" href="/de/install/northflank">Ein-Klick-Einrichtung im Browser</Card>
  <Card title="DigitalOcean" href="/de/install/digitalocean">Einfacher kostenpflichtiger VPS</Card>
  <Card title="Oracle Cloud" href="/de/install/oracle">Always Free ARM-Stufe</Card>
  <Card title="Fly.io" href="/de/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/de/install/hetzner">Docker auf Hetzner VPS</Card>
  <Card title="Hostinger" href="/de/install/hostinger">VPS mit Ein-Klick-Einrichtung</Card>
  <Card title="GCP" href="/de/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/de/install/azure">Linux-VM</Card>
  <Card title="exe.dev" href="/de/install/exe-dev">VM mit HTTPS-Proxy</Card>
  <Card title="Raspberry Pi" href="/de/install/raspberry-pi">ARM selbst gehostet</Card>
</CardGroup>

**AWS (EC2 / Lightsail / kostenlose Stufe)** funktioniert ebenfalls gut.
Eine Videoanleitung aus der Community ist verfügbar unter
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(Community-Ressource -- möglicherweise später nicht mehr verfügbar).

## Funktionsweise von Cloud-Setups

- Der **Gateway läuft auf dem VPS** und verwaltet Zustand + Workspace.
- Sie verbinden sich von Ihrem Laptop oder Telefon über die **Control UI** oder **Tailscale/SSH**.
- Behandeln Sie den VPS als die maßgebliche Quelle und **sichern Sie** Zustand + Workspace regelmäßig.
- Sichere Standardeinstellung: Halten Sie den Gateway auf loopback und greifen Sie über einen SSH-Tunnel oder Tailscale Serve darauf zu.
  Wenn Sie an `lan` oder `tailnet` binden, verlangen Sie `gateway.auth.token` oder `gateway.auth.password`.

Verwandte Seiten: [Gateway-Fernzugriff](/de/gateway/remote), [Plattform-Hub](/de/platforms).

## Admin-Zugriff zuerst absichern

Bevor Sie OpenClaw auf einem öffentlichen VPS installieren, entscheiden Sie, wie Sie
die Maschine selbst administrieren möchten.

- Wenn Sie Admin-Zugriff nur über Tailnet möchten, installieren Sie zuerst Tailscale, fügen Sie den VPS
  Ihrem Tailnet hinzu, verifizieren Sie eine zweite SSH-Sitzung über die Tailscale-IP oder
  den MagicDNS-Namen und beschränken Sie anschließend öffentliches SSH.
- Wenn Sie Tailscale nicht verwenden, wenden Sie eine entsprechende Härtung für Ihren SSH-
  Pfad an, bevor Sie weitere Dienste bereitstellen.
- Dies ist getrennt vom Gateway-Zugriff. Sie können OpenClaw weiterhin an
  loopback gebunden lassen und einen SSH-Tunnel oder Tailscale Serve für das Dashboard verwenden.

Tailscale-spezifische Gateway-Optionen finden Sie unter [Tailscale](/de/gateway/tailscale).

## Gemeinsamer Unternehmens-Agent auf einem VPS

Einen einzelnen Agent für ein Team zu betreiben, ist ein gültiges Setup, wenn alle Benutzer innerhalb derselben Vertrauensgrenze sind und der Agent ausschließlich geschäftlich genutzt wird.

- Betreiben Sie ihn auf einer dedizierten Runtime (VPS/VM/Container + dedizierter OS-Benutzer/dedizierte Konten).
- Melden Sie diese Runtime nicht bei persönlichen Apple-/Google-Konten oder persönlichen Browser-/Passwortmanager-Profilen an.
- Wenn Benutzer einander gegenüber adversarial sind, trennen Sie nach Gateway/Host/OS-Benutzer.

Details zum Sicherheitsmodell: [Sicherheit](/de/gateway/security).

## Nodes mit einem VPS verwenden

Sie können den Gateway in der Cloud belassen und **Nodes** auf Ihren lokalen Geräten
(Mac/iOS/Android/headless) koppeln. Nodes stellen lokale Bildschirm-/Kamera-/Canvas- und `system.run`-
Funktionen bereit, während der Gateway in der Cloud bleibt.

Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

## Start-Tuning für kleine VMs und ARM-Hosts

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
- `OPENCLAW_NO_RESPAWN=1` vermeidet zusätzlichen Start-Overhead durch einen Selbst-Respawn-Pfad.
- Der erste Befehlslauf wärmt den Cache auf; nachfolgende Läufe sind schneller.
- Raspberry-Pi-spezifische Details finden Sie unter [Raspberry Pi](/de/install/raspberry-pi).

### systemd-Tuning-Checkliste (optional)

Für VM-Hosts, die `systemd` verwenden, sollten Sie Folgendes erwägen:

- Service-Umgebungsvariablen für einen stabilen Startpfad hinzufügen:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Neustartverhalten explizit halten:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Bevorzugen Sie SSD-gestützte Datenträger für Zustands-/Cache-Pfade, um Cold-Start-Nachteile durch zufällige I/O zu reduzieren.

Für den Standardpfad `openclaw onboard --install-daemon` bearbeiten Sie die Benutzereinheit:

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

Wenn Sie stattdessen bewusst eine Systemeinheit installiert haben, bearbeiten Sie
`openclaw-gateway.service` über `sudo systemctl edit openclaw-gateway.service`.

Wie `Restart=`-Richtlinien bei automatisierter Wiederherstellung helfen:
[systemd kann die Wiederherstellung von Diensten automatisieren](https://www.redhat.com/en/blog/systemd-automate-recovery).

Informationen zum Linux-OOM-Verhalten, zur Auswahl von Child-Prozess-Opfern und zur Diagnose von `exit 137`
finden Sie unter [Linux-Speicherdruck und OOM-Kills](/de/platforms/linux#memory-pressure-and-oom-kills).

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [DigitalOcean](/de/install/digitalocean)
- [Fly.io](/de/install/fly)
- [Hetzner](/de/install/hetzner)
