---
read_when:
    - Configurazione di OpenClaw su DigitalOcean
    - Cerchi una VPS a pagamento semplice per OpenClaw
summary: Ospitare OpenClaw su un Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-04-24T08:45:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0b3d06a38e257f4a8ab88d1f228c659a6cf1a276fe91c8ba7b89a0084658a314
    source_path: install/digitalocean.md
    workflow: 15
---

Esegui un Gateway OpenClaw persistente su un Droplet DigitalOcean.

## Prerequisiti

- Account DigitalOcean ([registrazione](https://cloud.digitalocean.com/registrations/new))
- Coppia di chiavi SSH (oppure disponibilità a usare l'autenticazione con password)
- Circa 20 minuti

## Configurazione

<Steps>
  <Step title="Crea un Droplet">
    <Warning>
    Usa un'immagine di base pulita (Ubuntu 24.04 LTS). Evita immagini Marketplace 1-click di terze parti a meno che tu non abbia esaminato i loro script di avvio e i valori predefiniti del firewall.
    </Warning>

    1. Accedi a [DigitalOcean](https://cloud.digitalocean.com/).
    2. Fai clic su **Create > Droplets**.
    3. Scegli:
       - **Region:** quella più vicina a te
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** chiave SSH (consigliata) oppure password
    4. Fai clic su **Create Droplet** e annota l'indirizzo IP.

  </Step>

  <Step title="Connettiti e installa">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Installa Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # Installa OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash
    openclaw --version
    ```

  </Step>

  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata ti accompagna attraverso autenticazione del modello, configurazione dei canali, generazione del token del gateway e installazione del daemon (systemd).

  </Step>

  <Step title="Aggiungi swap (consigliato per Droplet da 1 GB)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Verifica il gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accedi all'interfaccia Control">
    Il gateway si collega al loopback per impostazione predefinita. Scegli una di queste opzioni.

    **Opzione A: tunnel SSH (la più semplice)**

    ```bash
    # Dalla tua macchina locale
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Poi apri `http://localhost:18789`.

    **Opzione B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Poi apri `https://<magicdns>/` da qualsiasi dispositivo nella tua tailnet.

    **Opzione C: bind tailnet (senza Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Poi apri `http://<tailscale-ip>:18789` (token richiesto).

  </Step>
</Steps>

## Risoluzione dei problemi

**Il Gateway non si avvia** -- Esegui `openclaw doctor --non-interactive` e controlla i log con `journalctl --user -u openclaw-gateway.service -n 50`.

**Porta già in uso** -- Esegui `lsof -i :18789` per trovare il processo, quindi arrestalo.

**Memoria esaurita** -- Verifica che lo swap sia attivo con `free -h`. Se continui a incorrere in OOM, usa modelli basati su API (Claude, GPT) invece di modelli locali, oppure passa a un Droplet da 2 GB.

## Passi successivi

- [Canali](/it/channels) -- collega Telegram, WhatsApp, Discord e altro
- [Configurazione del Gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione
- [Aggiornamento](/it/install/updating) -- mantieni OpenClaw aggiornato

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Fly.io](/it/install/fly)
- [Hetzner](/it/install/hetzner)
- [Hosting VPS](/it/vps)
