---
read_when:
    - OpenClaw auf Oracle Cloud einrichten
    - Auf der Suche nach kostenlosem VPS-Hosting für OpenClaw
    - Sie möchten OpenClaw rund um die Uhr auf einem kleinen Server betreiben
summary: OpenClaw im „Always Free“-ARM-Tarif von Oracle Cloud hosten
title: Oracle Cloud
x-i18n:
    generated_at: "2026-07-24T03:57:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e1eb95b6bc8ad73e1492a03d8ebe32d89c80e58347614e6ae12d2d3d926d577
    source_path: install/oracle.md
    workflow: 16
---

Führen Sie einen persistenten OpenClaw Gateway auf der **Always Free**-ARM-Stufe von Oracle Cloud (bis zu 4 OCPU, 24 GB RAM, 200 GB Speicher) kostenlos aus.

## Voraussetzungen

- Oracle-Cloud-Konto ([registrieren](https://www.oracle.com/cloud/free/)) -- bei Problemen siehe [Registrierungsleitfaden der Community](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale-Konto (kostenlos unter [tailscale.com](https://tailscale.com))
- Ein SSH-Schlüsselpaar
- Etwa 30 Minuten

## Einrichtung

<Steps>
  <Step title="OCI-Instanz erstellen">
    1. Melden Sie sich bei der [Oracle Cloud Console](https://cloud.oracle.com/) an.
    2. Navigieren Sie zu **Compute > Instances > Create Instance**.
    3. Konfigurieren Sie Folgendes:
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2 (oder bis zu 4)
       - **Memory:** 12 GB (oder bis zu 24 GB)
       - **Boot volume:** 50 GB (bis zu 200 GB kostenlos)
       - **SSH key:** Fügen Sie Ihren öffentlichen Schlüssel hinzu
    4. Klicken Sie auf **Create** und notieren Sie die öffentliche IP-Adresse.

    <Tip>
    Wenn die Instanzerstellung mit „Out of capacity“ fehlschlägt, versuchen Sie es in einer anderen Availability Domain oder zu einem späteren Zeitpunkt erneut. Die Kapazität der kostenlosen Stufe ist begrenzt.
    </Tip>

  </Step>

  <Step title="Verbindung herstellen und System aktualisieren">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` ist für die ARM-Kompilierung einiger Abhängigkeiten erforderlich.

  </Step>

  <Step title="Benutzer und Hostnamen konfigurieren">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Durch die Aktivierung von Linger werden Benutzerdienste nach der Abmeldung weiter ausgeführt.

  </Step>

  <Step title="Tailscale installieren">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Stellen Sie die Verbindung ab jetzt über Tailscale her: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="OpenClaw installieren">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Wenn Sie gefragt werden „How do you want to hatch your bot?“, wählen Sie **Do this later**.

  </Step>

  <Step title="Gateway konfigurieren">
    Verwenden Sie Token-Authentifizierung mit Tailscale Serve für sicheren Remotezugriff.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` dient hier ausschließlich der Verarbeitung weitergeleiteter IP-Adressen und lokaler Clients durch den lokalen Tailscale-Serve-Proxy. Es ist **nicht** `gateway.auth.mode: "trusted-proxy"`. Die Routen des Diff-Viewers behalten in dieser Einrichtung ihr Fail-Closed-Verhalten bei: Unverarbeitete `127.0.0.1`-Viewer-Anfragen ohne weitergeleitete Proxy-Header geben `Diff not found` zurück. Verwenden Sie `mode=file` / `mode=both` für Anhänge, oder aktivieren Sie Remote-Viewer bewusst und legen Sie `plugins.entries.diffs.config.viewerBaseUrl` fest (oder übergeben Sie einen Proxy-`baseUrl`), wenn Sie teilbare Viewer-Links benötigen.

  </Step>

  <Step title="VCN-Sicherheit einschränken">
    Blockieren Sie sämtlichen Datenverkehr außer Tailscale am Netzwerkrand:

    1. Öffnen Sie in der OCI Console **Networking > Virtual Cloud Networks**.
    2. Klicken Sie auf Ihr VCN und anschließend auf **Security Lists > Default Security List**.
    3. **Entfernen** Sie alle Eingangsregeln außer `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Behalten Sie die standardmäßigen Ausgangsregeln bei (gesamten ausgehenden Datenverkehr zulassen).

    Dadurch werden SSH auf Port 22, HTTP, HTTPS und sämtlicher anderer Datenverkehr am Netzwerkrand blockiert. Ab diesem Zeitpunkt können Sie ausschließlich über Tailscale eine Verbindung herstellen.

  </Step>

  <Step title="Überprüfen">
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

Wenn das VCN eingeschränkt ist (nur UDP 41641 geöffnet) und der Gateway an Loopback gebunden ist, wird öffentlicher Datenverkehr am Netzwerkrand blockiert und der administrative Zugriff ist ausschließlich über das Tailnet möglich. Dadurch entfallen mehrere herkömmliche Schritte zur Absicherung eines VPS:

| Herkömmlicher Schritt       | Erforderlich?       | Warum                                                                       |
| --------------------------- | ------------------- | --------------------------------------------------------------------------- |
| UFW-Firewall                | Nein                | Das VCN blockiert den Datenverkehr, bevor er die Instanz erreicht.          |
| fail2ban                    | Nein                | Port 22 ist im VCN blockiert; es gibt keine Angriffsfläche für Brute-Force-Angriffe. |
| sshd-Härtung                | Nein                | Tailscale SSH verwendet sshd nicht.                                         |
| Root-Anmeldung deaktivieren | Nein                | Tailscale authentifiziert anhand der Tailnet-Identität, nicht anhand von Systembenutzern. |
| Nur SSH-Schlüsselauthentifizierung | Nein          | Ebenso -- die Tailnet-Identität ersetzt systemseitige SSH-Schlüssel.        |
| IPv6-Härtung                | Normalerweise nicht | Hängt von den VCN-/Subnetzeinstellungen ab; überprüfen Sie, was tatsächlich zugewiesen und exponiert ist. |

Weiterhin empfohlen:

- `chmod 700 ~/.openclaw`, um die Berechtigungen von Anmeldedatendateien einzuschränken.
- `openclaw security audit` für eine OpenClaw-spezifische Sicherheitsstatusprüfung.
- Regelmäßig `sudo apt update && sudo apt upgrade` für Betriebssystem-Patches.
- Überprüfen Sie regelmäßig die Geräte in der [Tailscale-Verwaltungskonsole](https://login.tailscale.com/admin).

Befehle zur schnellen Überprüfung:

```bash
# Bestätigen, dass keine öffentlichen Ports Verbindungen annehmen
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Überprüfen, ob Tailscale SSH aktiv ist
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH aktiv"

# Optional: sshd vollständig deaktivieren, sobald die Funktion von Tailscale SSH bestätigt wurde
sudo systemctl disable --now ssh
```

## Hinweise zu ARM

Die Always Free-Stufe verwendet ARM (`aarch64`). Die meisten OpenClaw-Funktionen funktionieren problemlos; eine kleine Anzahl nativer Binärdateien benötigt ARM-Builds:

- Node.js, Telegram, WhatsApp (Baileys): reines JavaScript, keine Probleme.
- Die meisten npm-Pakete mit nativem Code: vorkompilierte `linux-arm64`-Artefakte sind verfügbar.
- Optionale CLI-Hilfsprogramme (z. B. von Skills bereitgestellte Go-/Rust-Binärdateien): Prüfen Sie vor der Installation, ob eine `aarch64`- / `linux-arm64`-Version verfügbar ist.

Überprüfen Sie die Architektur mit `uname -m` (sollte `aarch64` ausgeben). Installieren Sie Binärdateien ohne ARM-Build aus dem Quellcode oder überspringen Sie sie.

## Persistenz und Sicherungen

Der OpenClaw-Zustand befindet sich unter:

- `~/.openclaw/` -- `openclaw.json`, agentenspezifische `auth-profiles.json`, Kanal-/Provider-Zustand und Sitzungsdaten.
- `~/.openclaw/workspace/` -- der Agent-Arbeitsbereich (SOUL.md, Speicher, Artefakte).

Diese Daten bleiben nach Neustarts erhalten. So erstellen Sie einen portablen Snapshot:

```bash
openclaw backup create
```

## Ausweichlösung: SSH-Tunnel

Wenn Tailscale Serve nicht funktioniert, verwenden Sie auf Ihrem lokalen Rechner einen SSH-Tunnel:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Öffnen Sie anschließend `http://localhost:18789`.

## Fehlerbehebung

**Instanzerstellung schlägt fehl („Out of capacity“)** -- ARM-Instanzen der kostenlosen Stufe sind beliebt. Versuchen Sie es in einer anderen Availability Domain oder außerhalb der Spitzenzeiten erneut.

**Tailscale stellt keine Verbindung her** -- Führen Sie `sudo tailscale up --ssh --hostname=openclaw --reset` aus, um sich erneut zu authentifizieren.

**Gateway startet nicht** -- Führen Sie `openclaw doctor --non-interactive` aus und prüfen Sie die Protokolle mit `journalctl --user -u openclaw-gateway.service -n 50`.

**Probleme mit ARM-Binärdateien** -- Die meisten npm-Pakete funktionieren auf ARM64. Suchen Sie für native Binärdateien nach `linux-arm64`- oder `aarch64`-Versionen. Überprüfen Sie die Architektur mit `uname -m`.

## Nächste Schritte

- [Kanäle](/de/channels) -- Telegram, WhatsApp, Discord und weitere verbinden
- [Gateway-Konfiguration](/de/gateway/configuration) -- alle Konfigurationsoptionen
- [Aktualisieren](/de/install/updating) -- OpenClaw auf dem neuesten Stand halten

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [GCP](/de/install/gcp)
- [VPS-Hosting](/de/vps)
