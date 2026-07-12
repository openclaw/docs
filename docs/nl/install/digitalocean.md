---
read_when:
    - OpenClaw instellen op DigitalOcean
    - Op zoek naar een eenvoudige betaalde VPS voor OpenClaw
summary: Host OpenClaw op een DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T08:59:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Voer een permanente OpenClaw Gateway uit op een DigitalOcean Droplet (~$6/maand voor het Basic-abonnement van 1 GB).

DigitalOcean is een eenvoudige betaalde VPS-optie. Voor goedkopere of gratis opties:

- [Hetzner](/nl/install/hetzner) -- meer cores/RAM per dollar.
- [Oracle Cloud](/nl/install/oracle) -- Always Free ARM-laag (maximaal 4 OCPU, 24 GB RAM), maar registratie kan lastig zijn en deze laag ondersteunt uitsluitend ARM.

## Vereisten

- DigitalOcean-account ([registreren](https://cloud.digitalocean.com/registrations/new))
- SSH-sleutelpaar (of bereidheid om wachtwoordauthenticatie te gebruiken)
- Ongeveer 20 minuten

## Installatie

<Steps>
  <Step title="Een Droplet maken">
    <Warning>
    Gebruik een schone basisimage (Ubuntu 24.04 LTS). Vermijd 1-click-images van derden uit Marketplace, tenzij je hun opstartscripts en standaardinstellingen voor de firewall hebt gecontroleerd.
    </Warning>

    1. Meld je aan bij [DigitalOcean](https://cloud.digitalocean.com/).
    2. Klik op **Create > Droplets**.
    3. Kies:
       - **Region:** De regio die het dichtst bij je ligt
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH-sleutel (aanbevolen) of wachtwoord
    4. Klik op **Create Droplet** en noteer het IP-adres.

  </Step>

  <Step title="Verbinding maken en installeren">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Install Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Install OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # Create the non-root user that will own OpenClaw state and services.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    Gebruik de root-shell uitsluitend voor de initiële systeemconfiguratie. Voer OpenClaw-opdrachten uit als de niet-rootgebruiker `openclaw`, zodat de statusgegevens onder `/home/openclaw/.openclaw/` worden opgeslagen en de Gateway als systemd-`--user`-service van die gebruiker wordt geïnstalleerd.

  </Step>

  <Step title="De introductieconfiguratie uitvoeren">
    ```bash
    openclaw onboard --install-daemon
    ```

    De wizard begeleidt je bij modelauthenticatie, kanaalconfiguratie, het genereren van een Gateway-token en de installatie van de daemon (systemd-gebruikersservice).

  </Step>

  <Step title="Swap toevoegen (aanbevolen voor Droplets met 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="De Gateway verifiëren">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Toegang tot de bedieningsinterface">
    De Gateway luistert standaard alleen op local loopback. Kies een van deze opties.

    **Optie A: SSH-tunnel (eenvoudigst)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Open vervolgens `http://localhost:18789`.

    **Optie B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Open vervolgens `https://<magicdns>/` vanaf een apparaat in je tailnet.

    Tailscale Serve authenticeert verkeer van de bedieningsinterface en WebSocket-verkeer via identiteitsheaders van het tailnet. Hierbij wordt aangenomen dat de Gateway-host zelf wordt vertrouwd. HTTP-API-eindpunten blijven altijd de normale authenticatiemodus van de Gateway volgen (token/wachtwoord). Als je expliciete gedeelde geheime aanmeldgegevens via Serve wilt vereisen, stel je `gateway.auth.allowTailscale: false` in en gebruik je `gateway.auth.mode: "token"` of `"password"`.

    **Optie C: Binden aan het tailnet (zonder Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Open vervolgens `http://<tailscale-ip>:18789` (token vereist).

  </Step>
</Steps>

## Persistentie en back-ups

De statusgegevens van OpenClaw worden opgeslagen onder:

- `~/.openclaw/` -- `openclaw.json`, aanmeldgegevens voor kanalen/providers, `auth-profiles.json` per agent en sessiegegevens.
- `~/.openclaw/workspace/` -- de werkruimte van de agent (SOUL.md, geheugen, artefacten).

Deze blijven behouden wanneer de Droplet opnieuw wordt opgestart. Maak als volgt een overdraagbare momentopname:

```bash
openclaw backup create
```

DigitalOcean-momentopnamen maken een back-up van de volledige Droplet; `openclaw backup create` is overdraagbaar tussen hosts.

## Tips voor 1 GB RAM

De Droplet van $6 heeft slechts 1 GB RAM. Zo blijft alles soepel werken:

- Zorg ervoor dat de bovenstaande swapstap in `/etc/fstab` staat, zodat swap na opnieuw opstarten behouden blijft.
- Geef de voorkeur aan API-gebaseerde modellen (Claude, GPT) boven lokale modellen -- lokale LLM-inferentie past niet in 1 GB.
- Stel `agents.defaults.model.primary` in op een kleiner model als je bij grote prompts OOM-fouten krijgt.
- Houd het systeem in de gaten met `free -h` en `htop`.

## Problemen oplossen

**Gateway start niet** -- Voer `openclaw doctor --non-interactive` uit en controleer de logboeken met `journalctl --user -u openclaw-gateway.service -n 50`.

**Poort is al in gebruik** -- Voer `lsof -i :18789` uit om het proces te vinden en stop het vervolgens.

**Onvoldoende geheugen** -- Controleer met `free -h` of swap actief is. Als je nog steeds OOM-fouten krijgt, schakel dan over op API-gebaseerde modellen (Claude, GPT) in plaats van lokale modellen, of upgrade naar een Droplet met 2 GB.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties
- [Bijwerken](/nl/install/updating) -- houd OpenClaw up-to-date

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Fly.io](/nl/install/fly)
- [Hetzner](/nl/install/hetzner)
- [VPS-hosting](/nl/vps)
