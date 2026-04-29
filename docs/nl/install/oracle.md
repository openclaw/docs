---
read_when:
    - OpenClaw instellen op Oracle Cloud
    - Op zoek naar gratis VPS-hosting voor OpenClaw
    - Wil je 24/7 OpenClaw op een kleine server
summary: OpenClaw hosten op de Always Free ARM-tier van Oracle Cloud
title: Oracle Cloud
x-i18n:
    generated_at: "2026-04-29T22:55:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: dce0d2a33556c8e48a48df744f8d1341fcfa78c93ff5a5e02a5013d207f3e6ed
    source_path: install/oracle.md
    workflow: 16
---

Voer kosteloos een permanente OpenClaw Gateway uit op Oracle Cloud's **Always Free** ARM-tier (tot 4 OCPU, 24 GB RAM, 200 GB opslag).

## Vereisten

- Oracle Cloud-account ([aanmelden](https://www.oracle.com/cloud/free/)) -- zie [community-aanmeldgids](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) als je problemen tegenkomt
- Tailscale-account (gratis op [tailscale.com](https://tailscale.com))
- Een SSH-sleutelpaar
- Ongeveer 30 minuten

## Setup

<Steps>
  <Step title="Een OCI-instantie maken">
    1. Log in op [Oracle Cloud Console](https://cloud.oracle.com/).
    2. Navigeer naar **Compute > Instances > Create Instance**.
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
    Als het maken van de instantie mislukt met "Out of capacity", probeer dan een ander beschikbaarheidsdomein of probeer het later opnieuw. Capaciteit in de gratis tier is beperkt.
    </Tip>

  </Step>

  <Step title="Verbinden en het systeem bijwerken">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` is vereist voor ARM-compilatie van sommige afhankelijkheden.

  </Step>

  <Step title="Gebruiker en hostnaam configureren">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    Het inschakelen van linger houdt gebruikersservices actief na uitloggen.

  </Step>

  <Step title="Tailscale installeren">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    Verbind vanaf nu via Tailscale: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="OpenClaw installeren">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    Wanneer gevraagd wordt "How do you want to hatch your bot?", selecteer **Dit later doen**.

  </Step>

  <Step title="De Gateway configureren">
    Gebruik tokenauthenticatie met Tailscale Serve voor veilige externe toegang.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` is hier alleen bedoeld voor de verwerking van forwarded-IP/local-client door de lokale Tailscale Serve-proxy. Het is **niet** `gateway.auth.mode: "trusted-proxy"`. Diff-viewerroutes behouden fail-closed-gedrag in deze setup: onbewerkte `127.0.0.1`-viewerverzoeken zonder doorgestuurde proxyheaders kunnen `Diff not found` retourneren. Gebruik `mode=file` / `mode=both` voor bijlagen, of schakel bewust externe viewers in en stel `plugins.entries.diffs.config.viewerBaseUrl` in (of geef een proxy-`baseUrl` door) als je deelbare viewerlinks nodig hebt.

  </Step>

  <Step title="VCN-beveiliging vergrendelen">
    Blokkeer al het verkeer behalve Tailscale aan de netwerkrand:

    1. Ga naar **Networking > Virtual Cloud Networks** in de OCI Console.
    2. Klik op je VCN en vervolgens op **Security Lists > Default Security List**.
    3. **Verwijder** alle ingress-regels behalve `0.0.0.0/0 UDP 41641` (Tailscale).
    4. Behoud de standaard egress-regels (sta al het uitgaande verkeer toe).

    Dit blokkeert SSH op poort 22, HTTP, HTTPS en al het overige aan de netwerkrand. Vanaf dit punt kun je alleen nog via Tailscale verbinden.

  </Step>

  <Step title="Verifiëren">
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

## Terugvaloptie: SSH-tunnel

Als Tailscale Serve niet werkt, gebruik dan een SSH-tunnel vanaf je lokale machine:

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Open daarna `http://localhost:18789`.

## Probleemoplossing

**Maken van instantie mislukt ("Out of capacity")** -- Gratis ARM-instanties zijn populair. Probeer een ander beschikbaarheidsdomein of probeer het opnieuw buiten piekuren.

**Tailscale maakt geen verbinding** -- Voer `sudo tailscale up --ssh --hostname=openclaw --reset` uit om opnieuw te authenticeren.

**Gateway start niet** -- Voer `openclaw doctor --non-interactive` uit en controleer logs met `journalctl --user -u openclaw-gateway.service -n 50`.

**ARM-binaire problemen** -- De meeste npm-pakketten werken op ARM64. Zoek voor native binaries naar `linux-arm64`- of `aarch64`-releases. Verifieer de architectuur met `uname -m`.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties
- [Bijwerken](/nl/install/updating) -- houd OpenClaw up-to-date

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [GCP](/nl/install/gcp)
- [VPS-hosting](/nl/vps)
