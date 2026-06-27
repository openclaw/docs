---
read_when:
    - Sie möchten den Gateway auf einem Linux-Server oder Cloud-VPS ausführen
    - Sie benötigen eine kurze Übersicht der Hosting-Anleitungen
    - Sie möchten allgemeines Linux-Server-Tuning für OpenClaw
sidebarTitle: Linux Server
summary: OpenClaw auf einem Linux-Server oder Cloud-VPS ausführen – Provider-Auswahl, Architektur und Tuning
title: Linux-Server
x-i18n:
    generated_at: "2026-06-27T18:23:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

Führen Sie den OpenClaw Gateway auf einem beliebigen Linux-Server oder Cloud-VPS aus. Diese Seite hilft Ihnen,
einen Provider auszuwählen, erklärt, wie Cloud-Bereitstellungen funktionieren, und behandelt generisches Linux-
Tuning, das überall gilt.

## Provider auswählen

<CardGroup cols={2}>
  <Card title="Railway" href="/de/install/railway">Ein-Klick-Einrichtung im Browser</Card>
  <Card title="Northflank" href="/de/install/northflank">Ein-Klick-Einrichtung im Browser</Card>
  <Card title="DigitalOcean" href="/de/install/digitalocean">Einfacher kostenpflichtiger VPS</Card>
  <Card title="Oracle Cloud" href="/de/install/oracle">Always Free ARM-Tarif</Card>
  <Card title="Fly.io" href="/de/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/de/install/hetzner">Docker auf Hetzner VPS</Card>
  <Card title="Hostinger" href="/de/install/hostinger">VPS mit Ein-Klick-Einrichtung</Card>
  <Card title="GCP" href="/de/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/de/install/azure">Linux-VM</Card>
  <Card title="exe.dev" href="/de/install/exe-dev">VM mit HTTPS-Proxy</Card>
  <Card title="Raspberry Pi" href="/de/install/raspberry-pi">ARM selbst gehostet</Card>
</CardGroup>

**AWS (EC2 / Lightsail / kostenloser Tarif)** funktioniert ebenfalls gut.
Eine Videoanleitung aus der Community ist verfügbar unter
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(Community-Ressource -- möglicherweise später nicht mehr verfügbar).

## So funktionieren Cloud-Einrichtungen

- Der **Gateway läuft auf dem VPS** und verwaltet Zustand + Workspace.
- Sie verbinden sich von Ihrem Laptop oder Telefon über die **Control UI** oder **Tailscale/SSH**.
- Behandeln Sie den VPS als maßgebliche Quelle und **sichern Sie** Zustand + Workspace regelmäßig.
- Sichere Standardeinstellung: Belassen Sie den Gateway auf loopback und greifen Sie über einen SSH-Tunnel oder Tailscale Serve darauf zu.
  Wenn Sie an `lan` oder `tailnet` binden, verlangen Sie `gateway.auth.token` oder `gateway.auth.password`.

Verwandte Seiten: [Remote-Zugriff auf den Gateway](/de/gateway/remote), [Plattform-Hub](/de/platforms).

## Admin-Zugriff zuerst härten

Bevor Sie OpenClaw auf einem öffentlichen VPS installieren, entscheiden Sie, wie Sie die Box selbst
administrieren möchten.

- Wenn Sie Admin-Zugriff nur über Tailnet möchten, installieren Sie zuerst Tailscale, fügen Sie den VPS
  Ihrem Tailnet hinzu, prüfen Sie eine zweite SSH-Sitzung über die Tailscale-IP oder
  den MagicDNS-Namen und beschränken Sie anschließend öffentliches SSH.
- Wenn Sie Tailscale nicht verwenden, wenden Sie eine gleichwertige Härtung für Ihren SSH-
  Pfad an, bevor Sie weitere Dienste verfügbar machen.
- Dies ist vom Gateway-Zugriff getrennt. Sie können OpenClaw weiterhin an
  loopback binden und einen SSH-Tunnel oder Tailscale Serve für das Dashboard verwenden.

Tailscale-spezifische Gateway-Optionen finden Sie unter [Tailscale](/de/gateway/tailscale).

## Gemeinsamer Unternehmens-Agent auf einem VPS

Einen einzelnen Agent für ein Team auszuführen ist eine gültige Einrichtung, wenn alle Benutzer in derselben Vertrauensgrenze sind und der Agent ausschließlich geschäftlich genutzt wird.

- Belassen Sie ihn auf einer dedizierten Runtime (VPS/VM/Container + dedizierter OS-Benutzer/Konten).
- Melden Sie diese Runtime nicht bei persönlichen Apple-/Google-Konten oder persönlichen Browser-/Passwortmanager-Profilen an.
- Wenn Benutzer einander gegenüber adversarial sind, trennen Sie nach Gateway/Host/OS-Benutzer.

Details zum Sicherheitsmodell: [Sicherheit](/de/gateway/security).

## Knoten mit einem VPS verwenden

Sie können den Gateway in der Cloud belassen und **Knoten** auf Ihren lokalen Geräten
(Mac/iOS/Android/headless) koppeln. Knoten stellen lokale Bildschirm-/Kamera-/Canvas- und `system.run`-
Fähigkeiten bereit, während der Gateway in der Cloud bleibt.

Dokumentation: [Knoten](/de/nodes), [Knoten-CLI](/de/cli/nodes).

## Start-Tuning für kleine VMs und ARM-Hosts

Wenn CLI-Befehle auf leistungsschwachen VMs (oder ARM-Hosts) langsam wirken, aktivieren Sie den Modul-Compile-Cache von Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` verbessert die Startzeiten wiederholter Befehle.
- `OPENCLAW_NO_RESPAWN=1` hält routinemäßige Gateway-Neustarts im Prozess, wodurch zusätzliche Prozessübergaben vermieden werden und die PID-Nachverfolgung auf kleinen Hosts einfach bleibt.
- Der erste Befehlslauf wärmt den Cache auf; nachfolgende Läufe sind schneller.
- Raspberry Pi-spezifische Details finden Sie unter [Raspberry Pi](/de/install/raspberry-pi).

### systemd-Tuning-Checkliste (optional)

Für VM-Hosts mit `systemd` sollten Sie Folgendes erwägen:

- Dienstumgebung für einen stabilen Startpfad hinzufügen:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Neustartverhalten explizit halten:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Bevorzugen Sie SSD-gestützte Datenträger für Zustands-/Cache-Pfade, um Cold-Start-Einbußen durch zufällige I/O zu verringern.

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

So helfen `Restart=`-Richtlinien bei der automatisierten Wiederherstellung:
[systemd kann die Dienstwiederherstellung automatisieren](https://www.redhat.com/en/blog/systemd-automate-recovery).

Informationen zum Linux-OOM-Verhalten, zur Auswahl von Kindprozessen als Opfer und zu `exit 137`-
Diagnosen finden Sie unter [Linux-Speicherdruck und OOM-Kills](/de/platforms/linux#memory-pressure-and-oom-kills).

## Verwandt

- [Installationsübersicht](/de/install)
- [DigitalOcean](/de/install/digitalocean)
- [Fly.io](/de/install/fly)
- [Hetzner](/de/install/hetzner)
