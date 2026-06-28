---
read_when:
    - OpenClaw instellen op Oracle Cloud
    - Op zoek naar gratis VPS-hosting voor OpenClaw
    - Wil OpenClaw 24/7 op een kleine server
summary: Host OpenClaw op de Always Free ARM-laag van Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T09:20:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Voer een persistente OpenClaw Gateway uit op de **Always Free** ARM-laag van Oracle Cloud (tot 4 OCPU, 24 GB RAM, 200 GB opslag) zonder kosten.

## Vereisten

- Oracle Cloud-account ([registreren](https://www.oracle.com/cloud/free/)) -- zie de [registratiegids van de community](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) als je problemen ondervindt
- Tailscale-account (gratis op [tailscale.com](https://tailscale.com))
- Een SSH-sleutelpaar
- Ongeveer 30 minuten

## Installatie

<Steps>
  <Step title="Maak een OCI-instantie aan">
    1. Log in op de [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Ga naar **Compute > Instances > Create Instance**.
    3. Configureer:
       - **Naam:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPU's:** 2 (of tot 4)
       - **Geheugen:** 12 GB (of tot 24 GB)
       - **Bootvolume:** 50 GB (tot 200 GB gratis)
       - **SSH-sleutel:** Voeg je publieke sleutel toe
    4. Klik op **Create** en noteer het openbare IP-adres.

    <Tip>
    Als het aanmaken van de instantie mislukt met "Out of capacity", probeer dan een ander beschikbaarheidsdomein of probeer het later opnieuw. De capaciteit van de gratis laag is beperkt.
    </Tip>

  </Step>

  <Step title="Maak verbinding en werk het systeem bij">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` is vereist voor ARM-compilatie van sommige afhankelijkheden.

  </Step>

  <Step title="Configureer gebruiker en hostnaam">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Het inschakelen van linger houdt gebruikersservices actief na afmelden.

  </Step>

  <Step title="Installeer Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Maak vanaf nu verbinding via Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="Installeer OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Wanneer je wordt gevraagd "How do you want to hatch your bot?", selecteer je **Do this later**.

  </Step>

  <Step title="Configureer de Gateway">
    Gebruik token-authenticatie met Tailscale Serve voor veilige externe toegang.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` is hier alleen bedoeld voor de verwerking van doorgestuurde IP's/lokale clients door de lokale Tailscale Serve-proxy. Het is **niet** `gateway.auth.mode: "trusted-proxy"`. Diff-viewerroutes behouden fail-closed gedrag in deze configuratie: ruwe viewerverzoeken naar `127.0.0.1` zonder doorgestuurde proxyheaders kunnen `Diff not found` retourneren. Gebruik `mode=file` / `mode=both` voor bijlagen, of schakel bewust externe viewers in en stel `plugins.entries.diffs.config.viewerBaseUrl` in (of geef een proxy-`baseUrl` door) als je deelbare viewerlinks nodig hebt.

  </Step>

  <Step title="Vergrendel VCN-beveiliging">
    Blokkeer al het verkeer behalve Tailscale aan de netwerkrand:

    1. Ga naar **Networking > Virtual Cloud Networks** in de OCI Console.
    2. Klik op je VCN en daarna op **Security Lists > Default Security List**.
    3. **Verwijder** alle ingress-regels behalve `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Behoud de standaard egress-regels (alle uitgaande verbindingen toestaan).

    Dit blokkeert SSH op poort 22, HTTP, HTTPS en al het andere aan de netwerkrand. Vanaf dit punt kun je alleen nog via Tailscale verbinding maken.

  </Step>

  <Step title="Verifieer">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    Open de Control UI vanaf elk apparaat op je tailnet:

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    Vervang `<tailnet-name>` door je tailnetnaam (zichtbaar in `tailscale status`).

  </Step>
</Steps>

## Verifieer de beveiligingshouding

Met de VCN vergrendeld (alleen UDP 41641 open) en de Gateway gebonden aan loopback, wordt openbaar verkeer aan de netwerkrand geblokkeerd en is beheertoegang alleen via het tailnet mogelijk. Daardoor zijn meerdere traditionele VPS-hardeningstappen niet meer nodig:

| Traditionele stap       | Nodig?            | Waarom                                                                   |
| ----------------------- | ----------------- | ------------------------------------------------------------------------ |
| UFW-firewall            | Nee               | De VCN blokkeert verkeer voordat het de instantie bereikt.               |
| fail2ban                | Nee               | Poort 22 is geblokkeerd op de VCN; geen brute-force-oppervlak.           |
| sshd-hardening          | Nee               | Tailscale SSH gebruikt geen sshd.                                        |
| Root-login uitschakelen | Nee               | Tailscale authenticeert via tailnetidentiteit, niet via systeemgebruikers. |
| Alleen SSH-sleutel-auth | Nee               | Hetzelfde — tailnetidentiteit vervangt systeem-SSH-sleutels.             |
| IPv6-hardening          | Meestal niet      | Afhankelijk van VCN-/subnetinstellingen; verifieer wat werkelijk is toegewezen/blootgesteld. |

Nog steeds aanbevolen:

- `chmod 700 ~/.openclaw` om machtigingen voor credentialbestanden te beperken.
- `openclaw security audit` voor een OpenClaw-specifieke controle van de beveiligingshouding.
- Regelmatig `sudo apt update && sudo apt upgrade` voor OS-patches.
- Controleer periodiek apparaten in de [Tailscale-beheerconsole](https://login.tailscale.com/admin).

Snelle verificatieopdrachten:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## ARM-opmerkingen

De Always Free-laag is ARM (`aarch64`). De meeste OpenClaw-functies werken prima; een klein aantal native binaries heeft ARM-builds nodig:

- Node.js, Telegram, WhatsApp (Baileys): pure JavaScript, geen problemen.
- De meeste npm-pakketten met native code: vooraf gebouwde `linux-arm64`-artefacten beschikbaar.
- Optionele CLI-helpers (bijv. Go-/Rust-binaries geleverd door Skills): controleer op een `aarch64`- / `linux-arm64`-release voordat je ze installeert.

Verifieer de architectuur met `uname -m` (moet `aarch64` afdrukken). Installeer binaries zonder ARM-build vanuit broncode of sla ze over.

## Persistentie en back-ups

OpenClaw-status bevindt zich onder:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, kanaal-/providerstatus en sessiegegevens.
- `~/.openclaw/workspace/` — de agentworkspace (SOUL.md, geheugen, artefacten).

Deze blijven behouden na herstarts. Maak een draagbare snapshot met:

```bash
openclaw backup create
```

## Fallback: SSH-tunnel

Als Tailscale Serve niet werkt, gebruik dan een SSH-tunnel vanaf je lokale machine:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Open daarna `http://localhost:18789`.

## Probleemoplossing

**Het aanmaken van de instantie mislukt ("Out of capacity")** -- Gratis ARM-instanties zijn populair. Probeer een ander beschikbaarheidsdomein of probeer het opnieuw buiten piekuren.

**Tailscale maakt geen verbinding** -- Voer `sudo tailscale up --ssh --hostname=openclaw --reset` uit om opnieuw te authenticeren.

**Gateway start niet** -- Voer `openclaw doctor --non-interactive` uit en controleer logs met `journalctl --user -u openclaw-gateway.service -n 50`.

**ARM-binaryproblemen** -- De meeste npm-pakketten werken op ARM64. Zoek voor native binaries naar `linux-arm64`- of `aarch64`-releases. Verifieer de architectuur met `uname -m`.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties
- [Bijwerken](/nl/install/updating) -- houd OpenClaw up-to-date

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [GCP](/nl/install/gcp)
- [VPS-hosting](/nl/vps)
