---
read_when:
    - OpenClaw instellen op DigitalOcean
    - Op zoek naar een eenvoudige betaalde VPS voor OpenClaw
summary: OpenClaw hosten op een DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-29T22:53:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 16
---

Voer een permanente OpenClaw Gateway uit op een DigitalOcean Droplet.

## Vereisten

- DigitalOcean-account ([registreren](https://cloud.digitalocean.com/registrations/new))
- SSH-sleutelpaar (of bereidheid om wachtwoordauthenticatie te gebruiken)
- Ongeveer 20 minuten

## Instellen

<Steps>
  <Step title="Create a Droplet">
    <Warning>
    Gebruik een schone basisimage (Ubuntu 24.04 LTS). Vermijd 1-klik-images van derden uit de Marketplace, tenzij je hun opstartscripts en standaardinstellingen voor de firewall hebt gecontroleerd.
    </Warning>

    1. Log in bij [DigitalOcean](https://cloud.digitalocean.com/).
    2. Klik op **Create > Droplets**.
    3. Kies:
       - **Regio:** Dichtst bij jou
       - **Image:** Ubuntu 24.04 LTS
       - **Grootte:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authenticatie:** SSH-sleutel (aanbevolen) of wachtwoord
    4. Klik op **Create Droplet** en noteer het IP-adres.

  </Step>

  <Step title="Connect and install">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Run onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    De wizard leidt je door modelauthenticatie, kanaalinstelling, Gateway-tokenaanmaak en daemoninstallatie (systemd).

  </Step>

  <Step title="Add swap (recommended for 1 GB Droplets)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verify the gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Access the Control UI">
    De Gateway bindt standaard aan loopback. Kies een van deze opties.

    **Optie A: SSH-tunnel (eenvoudigst)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Open daarna `http://localhost:18789`.

    **Optie B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Open daarna `https://<magicdns>/` vanaf elk apparaat op je tailnet.

    **Optie C: Tailnet-binding (zonder Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Open daarna `http://<tailscale-ip>:18789` (token vereist).

  </Step>
</Steps>

## Probleemoplossing

**Gateway start niet** -- Voer `openclaw doctor --non-interactive` uit en controleer logs met `journalctl --user -u openclaw-gateway.service -n 50`.

**Poort is al in gebruik** -- Voer `lsof -i :18789` uit om het proces te vinden en stop het daarna.

**Onvoldoende geheugen** -- Controleer met `free -h` of swap actief is. Als je nog steeds OOM-fouten krijgt, gebruik dan API-gebaseerde modellen (Claude, GPT) in plaats van lokale modellen, of upgrade naar een Droplet van 2 GB.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties
- [Bijwerken](/nl/install/updating) -- houd OpenClaw up-to-date

## Gerelateerd

- [Installatie-overzicht](/nl/install)
- [Fly.io](/nl/install/fly)
- [Hetzner](/nl/install/hetzner)
- [VPS-hosting](/nl/vps)
