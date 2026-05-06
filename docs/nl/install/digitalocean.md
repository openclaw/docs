---
read_when:
    - OpenClaw instellen op DigitalOcean
    - Op zoek naar een eenvoudige betaalde VPS voor OpenClaw
summary: OpenClaw hosten op een DigitalOcean Droplet
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T09:19:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

Voer een persistente OpenClaw Gateway uit op een DigitalOcean Droplet (~$6/maand voor het 1 GB Basic-abonnement).

DigitalOcean is de eenvoudigste betaalde VPS-route. Als je goedkopere of gratis opties verkiest:

- [Hetzner](/nl/install/hetzner) — €3,79/maand, meer cores/RAM per dollar.
- [Oracle Cloud](/nl/install/oracle) — Always Free ARM (tot 4 OCPU, 24 GB RAM), maar aanmelden kan lastig zijn en het is alleen ARM.

## Vereisten

- DigitalOcean-account ([aanmelden](https://cloud.digitalocean.com/registrations/new))
- SSH-sleutelpaar (of bereidheid om wachtwoordauthenticatie te gebruiken)
- Ongeveer 20 minuten

## Installatie

<Steps>
  <Step title="Maak een Droplet aan">
    <Warning>
    Gebruik een schone basisimage (Ubuntu 24.04 LTS). Vermijd 1-klik-images van derden uit de Marketplace, tenzij je hun opstartscripts en firewallstandaarden hebt gecontroleerd.
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

  <Step title="Maak verbinding en installeer">
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

  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --install-daemon
    ```

    De wizard leidt je door modelauthenticatie, kanaalconfiguratie, het genereren van een Gateway-token en daemon-installatie (systemd).

  </Step>

  <Step title="Voeg swap toe (aanbevolen voor 1 GB Droplets)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Controleer de Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Open de Control UI">
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

    Tailscale Serve authenticeert verkeer van de Control UI en WebSocket-verkeer via tailnet-identiteitsheaders, waarbij wordt aangenomen dat de Gateway-host zelf vertrouwd is. HTTP API-eindpunten volgen hoe dan ook de normale authenticatiemodus van de Gateway (token/wachtwoord). Stel `gateway.auth.allowTailscale: false` in en gebruik `gateway.auth.mode: "token"` of `"password"` om expliciete shared-secret-credentials via Serve te vereisen.

    **Optie C: Tailnet-bind (zonder Serve)**

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

Deze blijven behouden na Droplet-herstarts. Maak een draagbare snapshot met:

```bash
openclaw backup create
```

DigitalOcean-snapshots maken een back-up van de hele Droplet; `openclaw backup create` is overdraagbaar tussen hosts.

## Tips voor 1 GB RAM

De Droplet van $6 heeft slechts 1 GB RAM. Om alles soepel te houden:

- Zorg dat de swapstap hierboven in `/etc/fstab` staat, zodat deze herstarts overleeft.
- Geef de voorkeur aan API-gebaseerde modellen (Claude, GPT) boven lokale modellen — lokale LLM-inferentie past niet in 1 GB.
- Stel `agents.defaults.model.primary` in op een kleiner model als je OOM's krijgt bij grote prompts.
- Monitor met `free -h` en `htop`.

## Probleemoplossing

**Gateway start niet** -- Voer `openclaw doctor --non-interactive` uit en controleer logs met `journalctl --user -u openclaw-gateway.service -n 50`.

**Poort is al in gebruik** -- Voer `lsof -i :18789` uit om het proces te vinden en stop het daarna.

**Onvoldoende geheugen** -- Controleer met `free -h` of swap actief is. Als je nog steeds OOM krijgt, gebruik dan API-gebaseerde modellen (Claude, GPT) in plaats van lokale modellen, of upgrade naar een Droplet van 2 GB.

## Volgende stappen

- [Kanalen](/nl/channels) -- verbind Telegram, WhatsApp, Discord en meer
- [Gateway-configuratie](/nl/gateway/configuration) -- alle configuratieopties
- [Bijwerken](/nl/install/updating) -- houd OpenClaw up-to-date

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Fly.io](/nl/install/fly)
- [Hetzner](/nl/install/hetzner)
- [VPS-hosting](/nl/vps)
