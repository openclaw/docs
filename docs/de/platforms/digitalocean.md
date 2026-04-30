---
read_when:
    - OpenClaw auf DigitalOcean einrichten
    - Günstiges VPS-Hosting für OpenClaw finden
summary: OpenClaw auf DigitalOcean (einfache kostenpflichtige VPS-Option)
title: DigitalOcean (Plattform)
x-i18n:
    generated_at: "2026-04-30T07:02:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw auf DigitalOcean

## Ziel

Einen persistenten OpenClaw Gateway auf DigitalOcean für **6 $/Monat** betreiben (oder 4 $/Monat mit reservierter Preisgestaltung).

Wenn Sie eine Option für 0 $/Monat wünschen und ARM plus provider-spezifische Einrichtung nicht stört, lesen Sie den [Oracle Cloud-Leitfaden](/de/install/oracle).

## Kostenvergleich (2026)

| Provider     | Tarif           | Spezifikationen        | Preis/Monat | Hinweise                                      |
| ------------ | --------------- | ---------------------- | ----------- | --------------------------------------------- |
| Oracle Cloud | Always Free ARM | bis zu 4 OCPU, 24GB RAM | 0 $         | ARM, begrenzte Kapazität / Eigenheiten bei der Registrierung |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | 3,79 € (~4 $) | Günstigste kostenpflichtige Option            |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | 6 $         | Einfache UI, gute Dokumentation               |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | 6 $         | Viele Standorte                               |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | 5 $         | Jetzt Teil von Akamai                         |

**Einen Provider auswählen:**

- DigitalOcean: einfachste UX + vorhersehbare Einrichtung (dieser Leitfaden)
- Hetzner: gutes Preis-Leistungs-Verhältnis (siehe [Hetzner-Leitfaden](/de/install/hetzner))
- Oracle Cloud: kann 0 $/Monat kosten, ist aber etwas kniffliger und nur ARM (siehe [Oracle-Leitfaden](/de/install/oracle))

---

## Voraussetzungen

- DigitalOcean-Konto ([mit 200 $ kostenlosem Guthaben registrieren](https://m.do.co/c/signup))
- SSH-Schlüsselpaar (oder Bereitschaft, Passwortauthentifizierung zu verwenden)
- ~20 Minuten

## 1) Einen Droplet erstellen

<Warning>
Verwenden Sie ein sauberes Basis-Image (Ubuntu 24.04 LTS). Vermeiden Sie 1-Klick-Images von Drittanbietern aus dem Marketplace, sofern Sie deren Startskripte und Firewall-Standards nicht geprüft haben.
</Warning>

1. Melden Sie sich bei [DigitalOcean](https://cloud.digitalocean.com/) an
2. Klicken Sie auf **Create → Droplets**
3. Wählen Sie:
   - **Region:** Am nächsten bei Ihnen (oder Ihren Benutzern)
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **6 $/mo** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH-Schlüssel (empfohlen) oder Passwort
4. Klicken Sie auf **Create Droplet**
5. Notieren Sie sich die IP-Adresse

## 2) Per SSH verbinden

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw installieren

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Onboarding ausführen

```bash
openclaw onboard --install-daemon
```

Der Assistent führt Sie durch:

- Modellauthentifizierung (API-Schlüssel oder OAuth)
- Kanaleinrichtung (Telegram, WhatsApp, Discord usw.)
- Gateway-Token (automatisch generiert)
- Daemon-Installation (systemd)

## 5) Gateway prüfen

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Auf das Dashboard zugreifen

Der Gateway bindet standardmäßig an loopback. So greifen Sie auf die Control UI zu:

**Option A: SSH-Tunnel (empfohlen)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Option B: Tailscale Serve (HTTPS, nur loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Öffnen: `https://<magicdns>/`

Hinweise:

- Serve hält den Gateway nur über loopback erreichbar und authentifiziert Control UI-/WebSocket-Verkehr über Tailscale-Identity-Header (tokenlose Authentifizierung setzt einen vertrauenswürdigen Gateway-Host voraus; HTTP-APIs verwenden diese Tailscale-Header nicht und folgen stattdessen dem normalen HTTP-Auth-Modus des Gateways).
- Um stattdessen explizite Shared-Secret-Zugangsdaten zu verlangen, setzen Sie `gateway.auth.allowTailscale: false` und verwenden Sie `gateway.auth.mode: "token"` oder `"password"`.

**Option C: Tailnet-Bindung (ohne Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Öffnen: `http://<tailscale-ip>:18789` (Token erforderlich).

## 7) Ihre Kanäle verbinden

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Weitere Provider finden Sie unter [Kanäle](/de/channels).

---

## Optimierungen für 1GB RAM

Der Droplet für 6 $ hat nur 1GB RAM. Damit alles reibungslos läuft:

### Swap hinzufügen (empfohlen)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Ein leichteres Modell verwenden

Wenn Sie auf OOMs stoßen, erwägen Sie:

- API-basierte Modelle (Claude, GPT) statt lokaler Modelle zu verwenden
- `agents.defaults.model.primary` auf ein kleineres Modell zu setzen

### Arbeitsspeicher überwachen

```bash
free -h
htop
```

---

## Persistenz

Der gesamte Zustand liegt in:

- `~/.openclaw/` — `openclaw.json`, agent-spezifische `auth-profiles.json`, Kanal-/Provider-Zustand und Sitzungsdaten
- `~/.openclaw/workspace/` — Workspace (SOUL.md, Speicher usw.)

Diese Daten bleiben Neustarts über erhalten. Sichern Sie sie regelmäßig:

```bash
openclaw backup create
```

---

## Kostenlose Alternative mit Oracle Cloud

Oracle Cloud bietet **Always Free**-ARM-Instanzen, die deutlich leistungsfähiger sind als jede kostenpflichtige Option hier — für 0 $/Monat.

| Was Sie erhalten | Spezifikationen       |
| ---------------- | --------------------- |
| **4 OCPUs**      | ARM Ampere A1         |
| **24GB RAM**     | Mehr als ausreichend  |
| **200GB Speicher** | Block-Volume        |
| **Für immer kostenlos** | Keine Kreditkartenbelastungen |

**Einschränkungen:**

- Die Registrierung kann knifflig sein (erneut versuchen, falls sie fehlschlägt)
- ARM-Architektur — das meiste funktioniert, aber einige Binärdateien benötigen ARM-Builds

Den vollständigen Einrichtungsleitfaden finden Sie unter [Oracle Cloud](/de/install/oracle). Tipps zur Registrierung und Fehlerbehebung beim Anmeldeprozess finden Sie in diesem [Community-Leitfaden](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Fehlerbehebung

### Gateway startet nicht

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Port wird bereits verwendet

```bash
lsof -i :18789
kill <PID>
```

### Nicht genügend Arbeitsspeicher

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Verwandte Themen

- [Hetzner-Leitfaden](/de/install/hetzner) — günstiger, leistungsfähiger
- [Docker-Installation](/de/install/docker) — containerisierte Einrichtung
- [Tailscale](/de/gateway/tailscale) — sicherer Remote-Zugriff
- [Konfiguration](/de/gateway/configuration) — vollständige Konfigurationsreferenz
