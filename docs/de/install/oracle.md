---
read_when:
    - OpenClaw auf Oracle Cloud einrichten
    - Auf der Suche nach kostenlosem VPS-Hosting für OpenClaw
    - OpenClaw rund um die Uhr auf einem kleinen Server nutzen
summary: OpenClaw auf dem Always Free-ARM-Tarif von Oracle Cloud hosten
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T06:54:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Führen Sie ein dauerhaftes OpenClaw Gateway auf der **Always Free**-ARM-Stufe von Oracle Cloud aus (bis zu 4 OCPU, 24 GB RAM, 200 GB Speicher), ohne Kosten.

## Voraussetzungen

- Oracle Cloud-Konto ([signup](https://www.oracle.com/cloud/free/)) -- siehe [Community-Registrierungsleitfaden](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd), falls Probleme auftreten
- Tailscale-Konto (kostenlos unter [tailscale.com](https://tailscale.com))
- Ein SSH-Schlüsselpaar
- Etwa 30 Minuten

## Einrichtung

<Steps>
  <Step title="Create an OCI instance">
    1. Melden Sie sich bei der [Oracle Cloud Console](https://cloud.oracle.com/) an.
    2. Navigieren Sie zu **Compute > Instances > Create Instance**.
    3. Konfigurieren Sie:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (oder bis zu 4)
       - **Memory:** 12 GB (oder bis zu 24 GB)
       - **Boot volume:** 50 GB (bis zu 200 GB kostenlos)
       - **SSH key:** Fügen Sie Ihren öffentlichen Schlüssel hinzu
    4. Klicken Sie auf **Create** und notieren Sie die öffentliche IP-Adresse.

    <Tip>
    Wenn die Instanzerstellung mit „Out of capacity“ fehlschlägt, versuchen Sie eine andere Availability Domain oder versuchen Sie es später erneut. Die Kapazität der kostenlosen Stufe ist begrenzt.
    </Tip>

  </Step>

  <Step title="Connect and update the system">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` ist für die ARM-Kompilierung einiger Abhängigkeiten erforderlich.

  </Step>

  <Step title="Configure user and hostname">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Durch das Aktivieren von linger laufen Benutzerdienste auch nach dem Abmelden weiter.

  </Step>

  <Step title="Install Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Verbinden Sie sich ab jetzt über Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Install OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Wenn Sie mit „How do you want to hatch your bot?“ gefragt werden, wählen Sie **Do this later**.

  </Step>

  <Step title="Configure the gateway">
    Verwenden Sie Token-Authentifizierung mit Tailscale Serve für sicheren Fernzugriff.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` dient hier nur der Forwarded-IP-/Local-Client-Verarbeitung des lokalen Tailscale Serve-Proxys. Es ist **nicht** `gateway.auth.mode: "trusted-proxy"`. Diff-Viewer-Routen behalten in dieser Einrichtung ein Fail-Closed-Verhalten bei: Rohe `127.0.0.1`-Viewer-Anfragen ohne weitergeleitete Proxy-Header können `Diff not found` zurückgeben. Verwenden Sie `mode=file` / `mode=both` für Anhänge, oder aktivieren Sie bewusst Remote-Viewer und setzen Sie `plugins.entries.diffs.config.viewerBaseUrl` (oder übergeben Sie eine Proxy-`baseUrl`), wenn Sie teilbare Viewer-Links benötigen.

  </Step>

  <Step title="Lock down VCN security">
    Blockieren Sie am Netzwerkrand sämtlichen Traffic außer Tailscale:

    1. Gehen Sie in der OCI Console zu **Networking > Virtual Cloud Networks**.
    2. Klicken Sie auf Ihre VCN und dann auf **Security Lists > Default Security List**.
    3. **Entfernen** Sie alle Ingress-Regeln außer `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Behalten Sie die standardmäßigen Egress-Regeln bei (alle ausgehenden Verbindungen erlauben).

    Dadurch werden SSH auf Port 22, HTTP, HTTPS und alles Weitere am Netzwerkrand blockiert. Ab diesem Punkt können Sie sich nur noch über Tailscale verbinden.

  </Step>

  <Step title="Verify">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Greifen Sie von jedem Gerät in Ihrem Tailnet auf die Control UI zu:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Ersetzen Sie `<tailnet-name>` durch den Namen Ihres Tailnets (sichtbar in `tailscale status`).

  </Step>
</Steps>

## Sicherheitsstatus überprüfen

Wenn die VCN abgesperrt ist (nur UDP 41641 offen) und das Gateway an loopback gebunden ist, wird öffentlicher Traffic am Netzwerkrand blockiert und Administratorzugriff ist nur über das Tailnet möglich. Dadurch entfallen mehrere klassische Schritte zur VPS-Härtung:

| Klassischer Schritt | Erforderlich? | Warum                                                                     |
| ------------------- | ------------- | ------------------------------------------------------------------------- |
| UFW-Firewall        | Nein          | Die VCN blockiert Traffic, bevor er die Instanz erreicht.                 |
| fail2ban            | Nein          | Port 22 ist an der VCN blockiert; keine Brute-Force-Angriffsfläche.       |
| sshd-Härtung        | Nein          | Tailscale SSH verwendet kein sshd.                                        |
| Root-Login deaktivieren | Nein      | Tailscale authentifiziert über Tailnet-Identität, nicht Systembenutzer.   |
| Nur SSH-Schlüsselauthentifizierung | Nein | Dasselbe — Tailnet-Identität ersetzt System-SSH-Schlüssel.        |
| IPv6-Härtung        | Meist nicht   | Hängt von VCN-/Subnetzeinstellungen ab; prüfen Sie, was tatsächlich zugewiesen/exponiert ist. |

Weiterhin empfohlen:

- `chmod 700 ~/.openclaw`, um die Berechtigungen für Anmeldedaten-Dateien einzuschränken.
- `openclaw security audit` für eine OpenClaw-spezifische Sicherheitsprüfung.
- Regelmäßiges `sudo apt update && sudo apt upgrade` für OS-Patches.
- Prüfen Sie regelmäßig Geräte in der [Tailscale-Admin-Konsole](https://login.tailscale.com/admin).

Schnelle Verifizierungsbefehle:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## ARM-Hinweise

Die Always Free-Stufe ist ARM (`aarch64`). Die meisten OpenClaw-Funktionen funktionieren problemlos; eine kleine Anzahl nativer Binärdateien benötigt ARM-Builds:

- Node.js, Telegram, WhatsApp (Baileys): reines JavaScript, keine Probleme.
- Die meisten npm-Pakete mit nativem Code: vorgefertigte `linux-arm64`-Artefakte verfügbar.
- Optionale CLI-Helfer (z. B. Go-/Rust-Binärdateien, die von Skills ausgeliefert werden): Prüfen Sie vor der Installation, ob ein `aarch64`- / `linux-arm64`-Release verfügbar ist.

Überprüfen Sie die Architektur mit `uname -m` (sollte `aarch64` ausgeben). Installieren Sie Binärdateien ohne ARM-Build aus dem Quellcode oder überspringen Sie sie.

## Persistenz und Backups

Der OpenClaw-Zustand liegt unter:

- `~/.openclaw/` — `openclaw.json`, agentenspezifische `auth-profiles.json`, Channel-/Provider-Zustand und Sitzungsdaten.
- `~/.openclaw/workspace/` — der Agent-Arbeitsbereich (SOUL.md, Speicher, Artefakte).

Diese Daten überstehen Neustarts. So erstellen Sie einen portablen Snapshot:

```bash
openclaw backup create
```

## Fallback: SSH-Tunnel

Wenn Tailscale Serve nicht funktioniert, verwenden Sie einen SSH-Tunnel von Ihrem lokalen Rechner:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Öffnen Sie anschließend `http://localhost:18789`.

## Fehlerbehebung

**Instanzerstellung schlägt fehl („Out of capacity“) ** -- ARM-Instanzen der kostenlosen Stufe sind beliebt. Versuchen Sie eine andere Availability Domain oder wiederholen Sie den Vorgang außerhalb der Spitzenzeiten.

**Tailscale verbindet sich nicht** -- Führen Sie `sudo tailscale up --ssh --hostname=openclaw --reset` aus, um sich erneut zu authentifizieren.

**Gateway startet nicht** -- Führen Sie `openclaw doctor --non-interactive` aus und prüfen Sie die Logs mit `journalctl --user -u openclaw-gateway.service -n 50`.

**ARM-Binärprobleme** -- Die meisten npm-Pakete funktionieren auf ARM64. Suchen Sie bei nativen Binärdateien nach `linux-arm64`- oder `aarch64`-Releases. Überprüfen Sie die Architektur mit `uname -m`.

## Nächste Schritte

- [Channels](/de/channels) -- Telegram, WhatsApp, Discord und mehr verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) -- alle Konfigurationsoptionen
- [Aktualisierung](/de/install/updating) -- OpenClaw aktuell halten

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [GCP](/de/install/gcp)
- [VPS-Hosting](/de/vps)
