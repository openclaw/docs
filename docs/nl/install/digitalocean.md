---
read_when:
    - OpenClaw instellen op DigitalOcean
    - Op zoek naar een eenvoudige betaalde VPS voor OpenClaw
summary: OpenClaw hosten op een DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-11T20:35:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ddfe3e6df5e48616584e912e12eede30a62f869fc307f586c9604c9c06c9e5b
    source_path: install/digitalocean.md
    workflow: 16
---

Voer een persistente OpenClaw Gateway uit op een DigitalOcean Droplet (~$6/maand voor het 1 GB Basic-abonnement).

DigitalOcean is de eenvoudigste betaalde VPS-route. Als je goedkopere of gratis opties verkiest:

- [Hetzner](/nl/install/hetzner) — €3,79/mnd, meer cores/RAM per dollar.
- [Oracle Cloud](/nl/install/oracle) — Always Free ARM (tot 4 OCPU, 24 GB RAM), maar aanmelden kan lastig zijn en is alleen ARM.

## Vereisten

- DigitalOcean-account ([aanmelden](https://cloud.digitalocean.com/registrations/new))
- SSH-sleutelpaar (of bereidheid om wachtwoordauthenticatie te gebruiken)
- Ongeveer 20 minuten

## Instellen

<Steps>
  <Step title="Een Droplet maken">
    <Warning>
    Gebruik een schone basisimage (Ubuntu 24.04 LTS). Vermijd Marketplace 1-click-images van derden, tenzij je hun opstartscripts en firewallstandaarden hebt gecontroleerd.
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

  <Step title="Verbinden en installeren">
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

    Gebruik de root-shell alleen voor de systeem-bootstrap. Voer OpenClaw-opdrachten uit als de niet-rootgebruiker `openclaw`, zodat de status onder `/home/openclaw/.openclaw/` staat en de Gateway wordt geïnstalleerd als systemd-service van die gebruiker.

  </Step>

  <Step title="Onboarding uitvoeren">
    ```bash
    openclaw onboard --install-daemon
    ```

    De wizard leidt je door modelauthenticatie, kanaalconfiguratie, het genereren van een gateway-token en daemoninstallatie (systemd).

  </Step>

  <Step title="Swap toevoegen (aanbevolen voor 1 GB Droplets)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="De gateway verifiëren">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Toegang tot de Control UI">
    De gateway bindt standaard aan loopback. Kies een van deze opties.

    **Optie A: SSH-tunnel (eenvoudigst)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Open daarna `http://localhost:18789`.

    **Optie B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Open daarna `https://<magicdns>/` vanaf elk apparaat op je tailnet.

    Tailscale Serve authenticeert Control UI- en WebSocket-verkeer via tailnet-identiteitsheaders, waarbij wordt aangenomen dat de gateway-host zelf vertrouwd is. HTTP API-eindpunten volgen ongeacht dit de normale auth-modus van de gateway (token/wachtwoord). Stel `gateway.auth.allowTailscale: false` in en gebruik `gateway.auth.mode: "token"` of `"password"` om expliciete gedeelde-geheime aanmeldgegevens via Serve te vereisen.

    **Optie C: Tailnet-bind (geen Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Open daarna `http://<tailscale-ip>:18789` (token vereist).

  </Step>
</Steps>

## Persistentie en back-ups

OpenClaw-status staat onder:

- `~/.openclaw/` — `openclaw.json`, per-agent `auth-profiles.json`, kanaal-/providerstatus en sessiegegevens.
- `~/.openclaw/workspace/` — de agentwerkruimte (SOUL.md, geheugen, artefacten).

Deze blijven behouden na herstarts van de Droplet. Een draagbare snapshot maken:

```bash
openclaw backup create
```

DigitalOcean-snapshots maken een back-up van de hele Droplet; `openclaw backup create` is overdraagbaar tussen hosts.

## Tips voor 1 GB RAM

De Droplet van $6 heeft slechts 1 GB RAM. Om alles soepel te houden:

- Zorg ervoor dat de swapstap hierboven in `/etc/fstab` staat, zodat deze herstarts overleeft.
- Geef de voorkeur aan API-gebaseerde modellen (Claude, GPT) boven lokale modellen — lokale LLM-inferentie past niet in 1 GB.
- Stel `agents.defaults.model.primary` in op een kleiner model als je OOMs krijgt bij grote prompts.
- Monitor met `free -h` en `htop`.

## Problemen oplossen

**Gateway start niet** -- Voer `openclaw doctor --non-interactive` uit en controleer logs met `journalctl --user -u openclaw-gateway.service -n 50`.

**Poort is al in gebruik** -- Voer `lsof -i :18789` uit om het proces te vinden en stop het daarna.

**Onvoldoende geheugen** -- Controleer met `free -h` of swap actief is. Als je nog steeds OOM krijgt, gebruik dan API-gebaseerde modellen (Claude, GPT) in plaats van lokale modellen, of upgrade naar een 2 GB Droplet.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties
- [Bijwerken](/nl/install/updating) -- houd OpenClaw up-to-date

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Fly.io](/nl/install/fly)
- [Hetzner](/nl/install/hetzner)
- [VPS-hosting](/nl/vps)
