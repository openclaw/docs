---
read_when:
    - OpenClaw in Oracle Cloud einrichten
    - Kostengünstiges VPS-Hosting für OpenClaw finden
    - OpenClaw rund um die Uhr auf einem kleinen Server betreiben
summary: OpenClaw auf Oracle Cloud (Always Free ARM)
title: Oracle Cloud (Plattform)
x-i18n:
    generated_at: "2026-04-30T07:03:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw auf Oracle Cloud (OCI)

## Ziel

Einen persistenten OpenClaw Gateway auf Oracle Clouds **Always Free**-ARM-Stufe betreiben.

Die kostenlose Stufe von Oracle kann gut zu OpenClaw passen (besonders, wenn Sie bereits ein OCI-Konto haben), bringt aber Kompromisse mit sich:

- ARM-Architektur (die meisten Dinge funktionieren, aber einige Binärdateien sind möglicherweise nur für x86 verfügbar)
- Kapazität und Registrierung können heikel sein

## Kostenvergleich (2026)

| Provider     | Tarif           | Spezifikationen        | Preis/Monat | Hinweise                  |
| ------------ | --------------- | ---------------------- | ------------ | ------------------------- |
| Oracle Cloud | Always Free ARM | bis zu 4 OCPU, 24 GB RAM | $0         | ARM, begrenzte Kapazität  |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM       | ~ $4         | Günstigste kostenpflichtige Option |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM       | $6           | Einfache UI, gute Dokumentation |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM       | $6           | Viele Standorte           |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM       | $5           | Jetzt Teil von Akamai     |

---

## Voraussetzungen

- Oracle-Cloud-Konto ([Registrierung](https://www.oracle.com/cloud/free/)) — siehe [Registrierungsleitfaden der Community](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), falls Probleme auftreten
- Tailscale-Konto (kostenlos unter [tailscale.com](https://tailscale.com))
- ~30 Minuten

## 1) OCI-Instanz erstellen

1. Melden Sie sich bei der [Oracle Cloud Console](https://cloud.oracle.com/) an
2. Navigieren Sie zu **Compute → Instances → Create Instance**
3. Konfigurieren Sie:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (oder bis zu 4)
   - **Memory:** 12 GB (oder bis zu 24 GB)
   - **Boot volume:** 50 GB (bis zu 200 GB kostenlos)
   - **SSH key:** Fügen Sie Ihren öffentlichen Schlüssel hinzu
4. Klicken Sie auf **Create**
5. Notieren Sie sich die öffentliche IP-Adresse

**Tipp:** Wenn die Instanzerstellung mit „Out of capacity“ fehlschlägt, versuchen Sie eine andere Availability Domain oder probieren Sie es später erneut. Die Kapazität der kostenlosen Stufe ist begrenzt.

## 2) Verbinden und aktualisieren

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Hinweis:** `build-essential` ist für die ARM-Kompilierung einiger Abhängigkeiten erforderlich.

## 3) Benutzer und Hostnamen konfigurieren

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale installieren

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Dies aktiviert Tailscale SSH, sodass Sie von jedem Gerät in Ihrem Tailnet per `ssh openclaw` eine Verbindung herstellen können — ohne öffentliche IP.

Überprüfen:

```bash
tailscale status
```

**Verbinden Sie sich ab jetzt über Tailscale:** `ssh ubuntu@openclaw` (oder verwenden Sie die Tailscale-IP).

## 5) OpenClaw installieren

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Wenn Sie gefragt werden: „How do you want to hatch your bot?“, wählen Sie **„Do this later“**.

> Hinweis: Wenn ARM-native Build-Probleme auftreten, beginnen Sie mit Systempaketen (z. B. `sudo apt install -y build-essential`), bevor Sie Homebrew verwenden.

## 6) Gateway konfigurieren (loopback + Token-Authentifizierung) und Tailscale Serve aktivieren

Verwenden Sie Token-Authentifizierung als Standard. Sie ist vorhersehbar und vermeidet die Notwendigkeit von „insecure auth“-Flags in der Control UI.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` dient hier nur der Verarbeitung von weitergeleiteter IP/lokalem Client durch den lokalen Tailscale-Serve-Proxy. Es ist **nicht** `gateway.auth.mode: "trusted-proxy"`. Diff-Viewer-Routen behalten in dieser Einrichtung ein Fail-closed-Verhalten bei: rohe `127.0.0.1`-Viewer-Anfragen ohne weitergeleitete Proxy-Header können `Diff not found` zurückgeben. Verwenden Sie `mode=file` / `mode=both` für Anhänge, oder aktivieren Sie Remote-Viewer bewusst und setzen Sie `plugins.entries.diffs.config.viewerBaseUrl` (oder übergeben Sie eine Proxy-`baseUrl`), wenn Sie teilbare Viewer-Links benötigen.

## 7) Überprüfen

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) VCN-Sicherheit sperren

Nachdem alles funktioniert, sperren Sie das VCN, um sämtlichen Datenverkehr außer Tailscale zu blockieren. Das Virtual Cloud Network von OCI wirkt als Firewall am Netzwerkrand — Datenverkehr wird blockiert, bevor er Ihre Instanz erreicht.

1. Gehen Sie in der OCI Console zu **Networking → Virtual Cloud Networks**
2. Klicken Sie auf Ihr VCN → **Security Lists** → Default Security List
3. **Entfernen** Sie alle Ingress-Regeln außer:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Behalten Sie die standardmäßigen Egress-Regeln bei (gesamten ausgehenden Datenverkehr zulassen)

Dies blockiert SSH auf Port 22, HTTP, HTTPS und alles andere am Netzwerkrand. Ab jetzt können Sie nur noch über Tailscale eine Verbindung herstellen.

---

## Auf die Control UI zugreifen

Von jedem Gerät in Ihrem Tailscale-Netzwerk:

```
https://openclaw.<tailnet-name>.ts.net/
```

Ersetzen Sie `<tailnet-name>` durch den Namen Ihres Tailnets (sichtbar in `tailscale status`).

Kein SSH-Tunnel erforderlich. Tailscale bietet:

- HTTPS-Verschlüsselung (automatische Zertifikate)
- Authentifizierung über Tailscale-Identität
- Zugriff von jedem Gerät in Ihrem Tailnet (Laptop, Telefon usw.)

---

## Sicherheit: VCN + Tailscale (empfohlene Basis)

Mit gesperrtem VCN (nur UDP 41641 offen) und an loopback gebundenem Gateway erhalten Sie eine starke Verteidigung in der Tiefe: Öffentlicher Datenverkehr wird am Netzwerkrand blockiert, und administrativer Zugriff erfolgt über Ihr Tailnet.

Diese Einrichtung macht zusätzliche hostbasierte Firewall-Regeln, die nur Internet-weite SSH-Brute-Force-Angriffe verhindern sollen, oft _überflüssig_ — Sie sollten das Betriebssystem aber weiterhin aktuell halten, `openclaw security audit` ausführen und überprüfen, dass Sie nicht versehentlich auf öffentlichen Schnittstellen lauschen.

### Bereits geschützt

| Traditioneller Schritt | Erforderlich? | Warum                                                                        |
| ---------------------- | ------------- | ----------------------------------------------------------------------------- |
| UFW-Firewall           | Nein          | VCN blockiert, bevor Datenverkehr die Instanz erreicht                        |
| fail2ban               | Nein          | Keine Brute-Force-Angriffe, wenn Port 22 im VCN blockiert ist                 |
| sshd-Härtung           | Nein          | Tailscale SSH verwendet sshd nicht                                            |
| Root-Login deaktivieren | Nein         | Tailscale verwendet Tailscale-Identität, nicht Systembenutzer                 |
| Nur-SSH-Schlüssel-Authentifizierung | Nein | Tailscale authentifiziert über Ihr Tailnet                              |
| IPv6-Härtung           | Üblicherweise nicht | Hängt von Ihren VCN-/Subnetz-Einstellungen ab; überprüfen Sie, was tatsächlich zugewiesen/offengelegt ist |

### Weiterhin empfohlen

- **Berechtigungen für Anmeldedaten:** `chmod 700 ~/.openclaw`
- **Sicherheitsaudit:** `openclaw security audit`
- **Systemupdates:** regelmäßig `sudo apt update && sudo apt upgrade`
- **Tailscale überwachen:** Prüfen Sie Geräte in der [Tailscale-Admin-Konsole](https://login.tailscale.com/admin)

### Sicherheitslage überprüfen

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Fallback: SSH-Tunnel

Wenn Tailscale Serve nicht funktioniert, verwenden Sie einen SSH-Tunnel:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Öffnen Sie anschließend `http://localhost:18789`.

---

## Fehlerbehebung

### Instanzerstellung schlägt fehl („Out of capacity“)

Kostenlose ARM-Instanzen sind beliebt. Versuchen Sie:

- Andere Availability Domain
- Während Nebenzeiten erneut versuchen (früher Morgen)
- Beim Auswählen des Shapes den Filter „Always Free“ verwenden

### Tailscale stellt keine Verbindung her

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway startet nicht

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UI ist nicht erreichbar

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### ARM-Binärdatei-Probleme

Einige Tools haben möglicherweise keine ARM-Builds. Prüfen Sie:

```bash
uname -m  # Should show aarch64
```

Die meisten npm-Pakete funktionieren problemlos. Suchen Sie bei Binärdateien nach `linux-arm64`- oder `aarch64`-Releases.

---

## Persistenz

Der gesamte Zustand liegt in:

- `~/.openclaw/` — `openclaw.json`, agentenspezifische `auth-profiles.json`, Kanal-/Provider-Zustand und Sitzungsdaten
- `~/.openclaw/workspace/` — Workspace (SOUL.md, Speicher, Artefakte)

Regelmäßig sichern:

```bash
openclaw backup create
```

---

## Verwandte Themen

- [Gateway-Remote-Zugriff](/de/gateway/remote) — andere Muster für Remote-Zugriff
- [Tailscale-Integration](/de/gateway/tailscale) — vollständige Tailscale-Dokumentation
- [Gateway-Konfiguration](/de/gateway/configuration) — alle Konfigurationsoptionen
- [DigitalOcean-Leitfaden](/de/install/digitalocean) — wenn Sie kostenpflichtig und mit einfacherer Registrierung arbeiten möchten
- [Hetzner-Leitfaden](/de/install/hetzner) — Docker-basierte Alternative
