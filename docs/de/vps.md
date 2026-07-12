---
read_when:
    - Sie möchten das Gateway auf einem Linux-Server oder Cloud-VPS ausführen
    - Sie benötigen einen schnellen Überblick über die Hosting-Anleitungen
    - Sie möchten eine allgemeine Linux-Serveroptimierung für OpenClaw
sidebarTitle: Linux Server
summary: OpenClaw auf einem Linux-Server oder Cloud-VPS ausführen — Provider-Auswahl, Architektur und Optimierung
title: Linux-Server
x-i18n:
    generated_at: "2026-07-12T16:00:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Führen Sie das OpenClaw Gateway auf einem beliebigen Linux-Server oder Cloud-VPS aus. Diese Seite hilft Ihnen
bei der Auswahl eines Providers, erklärt die Funktionsweise von Cloud-Bereitstellungen und behandelt allgemeine Linux-
Optimierungen, die überall gelten.

## Provider auswählen

<CardGroup cols={2}>
  <Card title="Azure" href="/de/install/azure">Linux-VM</Card>
  <Card title="DigitalOcean" href="/de/install/digitalocean">Einfacher kostenpflichtiger VPS</Card>
  <Card title="exe.dev" href="/de/install/exe-dev">VM mit HTTPS-Proxy</Card>
  <Card title="Fly.io" href="/de/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/de/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/de/install/hetzner">Docker auf einem Hetzner-VPS</Card>
  <Card title="Hostinger" href="/de/install/hostinger">VPS mit Ein-Klick-Einrichtung</Card>
  <Card title="Northflank" href="/de/install/northflank">Ein-Klick-Einrichtung im Browser</Card>
  <Card title="Oracle Cloud" href="/de/install/oracle">Dauerhaft kostenloser ARM-Tarif</Card>
  <Card title="Railway" href="/de/install/railway">Ein-Klick-Einrichtung im Browser</Card>
  <Card title="Raspberry Pi" href="/de/install/raspberry-pi">Selbst gehostet auf ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / kostenloser Tarif)** eignet sich ebenfalls gut.
Eine Videoanleitung aus der Community ist verfügbar unter
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(Community-Ressource – möglicherweise künftig nicht mehr verfügbar).

## Funktionsweise von Cloud-Einrichtungen

- Das **Gateway wird auf dem VPS ausgeführt** und verwaltet Zustand und Arbeitsbereich.
- Sie stellen von Ihrem Laptop oder Smartphone über die **Control UI** oder **Tailscale/SSH** eine Verbindung her.
- Behandeln Sie den VPS als maßgebliche Datenquelle und erstellen Sie regelmäßig **Sicherungskopien** von Zustand und Arbeitsbereich.
- Sichere Standardeinstellung: Belassen Sie das Gateway auf der Loopback-Schnittstelle und greifen Sie über einen SSH-Tunnel oder Tailscale Serve darauf zu.
  Wenn Sie es an `lan` oder `tailnet` binden, erfordert das Gateway ein gemeinsames Geheimnis
  (`gateway.auth.token` oder `gateway.auth.password`), sofern die Authentifizierung nicht an einen
  vertrauenswürdigen Proxy delegiert wird.

Verwandte Seiten: [Remote-Zugriff auf das Gateway](/de/gateway/remote), [Plattformübersicht](/de/platforms).

## Zuerst den Administratorzugriff absichern

Bevor Sie OpenClaw auf einem öffentlichen VPS installieren, legen Sie fest, wie Sie den
Server selbst administrieren möchten.

- Für einen ausschließlich über das Tailnet möglichen Administratorzugriff: Installieren Sie zuerst Tailscale, fügen Sie den VPS Ihrem
  Tailnet hinzu, überprüfen Sie eine zweite SSH-Sitzung über die Tailscale-IP oder den MagicDNS-Namen
  und schränken Sie anschließend den öffentlichen SSH-Zugriff ein.
- Ohne Tailscale: Wenden Sie die entsprechende Absicherung auf Ihren SSH-Zugriffsweg an, bevor Sie
  weitere Dienste zugänglich machen.
- Dies ist vom Gateway-Zugriff unabhängig. Sie können OpenClaw weiterhin an die
  Loopback-Schnittstelle binden und für das Dashboard einen SSH-Tunnel oder Tailscale Serve verwenden.

Tailscale-spezifische Gateway-Optionen finden Sie unter [Tailscale](/de/gateway/tailscale).

## Gemeinsam genutzter Unternehmens-Agent auf einem VPS

Ein einzelner Agent für ein Team ist eine geeignete Einrichtung, wenn sich alle Benutzer innerhalb derselben
Vertrauensgrenze befinden und der Agent ausschließlich geschäftlich genutzt wird.

- Verwenden Sie dafür eine dedizierte Laufzeitumgebung (VPS/VM/Container sowie dedizierte Betriebssystembenutzer/-konten).
- Melden Sie diese Laufzeitumgebung nicht bei persönlichen Apple-/Google-Konten oder persönlichen Browser-/Passwortmanager-Profilen an.
- Wenn sich die Benutzer gegenseitig nicht vertrauen, trennen Sie sie nach Gateway/Host/Betriebssystembenutzer.

Details zum Sicherheitsmodell: [Sicherheit](/de/gateway/security).

## Nodes mit einem VPS verwenden

Sie können das Gateway in der Cloud belassen und **Nodes** auf Ihren lokalen Geräten
(Mac/iOS/Android/Headless-Systemen) koppeln. Nodes stellen lokale Bildschirm-, Kamera-, Canvas- und `system.run`-
Funktionen bereit, während das Gateway in der Cloud verbleibt.

Dokumentation: [Nodes](/de/nodes), [Nodes-CLI](/de/cli/nodes).

## Startoptimierung für kleine VMs und ARM-Hosts

Wenn CLI-Befehle auf leistungsschwachen VMs (oder ARM-Hosts) langsam erscheinen, aktivieren Sie den Modulkompilierungs-Cache von Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` verkürzt die Startzeiten bei wiederholten Befehlsaufrufen; beim ersten Aufruf wird der Cache aufgebaut.
- `OPENCLAW_NO_RESPAWN=1` hält routinemäßige Gateway-Neustarts innerhalb desselben Prozesses. Dadurch werden zusätzliche Prozessübergaben vermieden und die PID-Verfolgung auf kleinen Hosts bleibt einfach.
- Raspberry-Pi-spezifische Informationen finden Sie unter [Raspberry Pi](/de/install/raspberry-pi).

### Checkliste zur systemd-Optimierung (optional)

Für VM-Hosts mit `systemd` sollten Sie Folgendes erwägen:

- Dienstumgebungsvariablen für einen stabilen Startpfad: `OPENCLAW_NO_RESPAWN=1` und
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Explizites Neustartverhalten: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- SSD-gestützte Datenträger für Zustands-/Cache-Pfade, um die Nachteile zufälliger E/A-Zugriffe beim Kaltstart zu reduzieren.

Der standardmäßige Ablauf `openclaw onboard --install-daemon` installiert eine systemd-Benutzer-
Unit; bearbeiten Sie sie mit:

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

Wenn Sie stattdessen bewusst eine System-Unit installiert haben, bearbeiten Sie sie über
`sudo systemctl edit openclaw-gateway.service`.

So unterstützen `Restart=`-Richtlinien die automatisierte Wiederherstellung:
[systemd kann die Wiederherstellung von Diensten automatisieren](https://www.redhat.com/en/blog/systemd-automate-recovery).

Informationen zum Linux-OOM-Verhalten, zur Auswahl untergeordneter Prozesse als Opfer und zur Diagnose von `exit 137`
finden Sie unter [Linux-Speicherdruck und OOM-Beendigungen](/de/platforms/linux#memory-pressure-and-oom-kills).

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [DigitalOcean](/de/install/digitalocean)
- [Fly.io](/de/install/fly)
- [Hetzner](/de/install/hetzner)
