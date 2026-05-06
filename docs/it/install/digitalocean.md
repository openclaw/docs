---
read_when:
    - Configurazione di OpenClaw su DigitalOcean
    - Cerchi un VPS a pagamento semplice per OpenClaw
summary: Ospita OpenClaw su un Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-05-06T08:55:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7aa09915d845c9ede27db794cac464490ba038e8e5e0a2ef0f5bfc62ef7e59ff
    source_path: install/digitalocean.md
    workflow: 16
---

Esegui un OpenClaw Gateway persistente su un Droplet DigitalOcean (~6 $/mese per il piano Basic da 1 GB).

DigitalOcean è il percorso VPS a pagamento più semplice. Se preferisci opzioni più economiche o gratuite:

- [Hetzner](/it/install/hetzner) — 3,79 €/mese, più core/RAM per dollaro.
- [Oracle Cloud](/it/install/oracle) — ARM Always Free (fino a 4 OCPU, 24 GB di RAM), ma la registrazione può essere macchinosa ed è solo ARM.

## Prerequisiti

- Account DigitalOcean ([registrazione](https://cloud.digitalocean.com/registrations/new))
- Coppia di chiavi SSH (o disponibilità a usare l'autenticazione con password)
- Circa 20 minuti

## Configurazione

<Steps>
  <Step title="Crea un Droplet">
    <Warning>
    Usa un'immagine di base pulita (Ubuntu 24.04 LTS). Evita le immagini Marketplace 1-click di terze parti, a meno che tu non abbia esaminato i loro script di avvio e le impostazioni predefinite del firewall.
    </Warning>

    1. Accedi a [DigitalOcean](https://cloud.digitalocean.com/).
    2. Fai clic su **Create > Droplets**.
    3. Scegli:
       - **Regione:** La più vicina a te
       - **Immagine:** Ubuntu 24.04 LTS
       - **Dimensione:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Autenticazione:** Chiave SSH (consigliata) o password
    4. Fai clic su **Create Droplet** e annota l'indirizzo IP.

  </Step>

  <Step title="Connetti e installa">
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

  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata ti accompagna attraverso l'autenticazione del modello, la configurazione del canale, la generazione del token del Gateway e l'installazione del daemon (systemd).

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

  <Step title="Verifica il Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accedi alla UI di controllo">
    Il Gateway si associa al loopback per impostazione predefinita. Scegli una di queste opzioni.

    **Opzione A: tunnel SSH (la più semplice)**

    ```bash
    # From your local machine
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

    Poi apri `https://<magicdns>/` da qualsiasi dispositivo sulla tua tailnet.

    Tailscale Serve autentica la UI di controllo e il traffico WebSocket tramite intestazioni di identità della tailnet, il che presuppone che l'host del Gateway stesso sia attendibile. Gli endpoint dell'API HTTP seguono comunque la normale modalità di autenticazione del Gateway (token/password). Per richiedere credenziali esplicite con segreto condiviso su Serve, imposta `gateway.auth.allowTailscale: false` e usa `gateway.auth.mode: "token"` o `"password"`.

    **Opzione C: bind tailnet (senza Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Poi apri `http://<tailscale-ip>:18789` (token richiesto).

  </Step>
</Steps>

## Persistenza e backup

Lo stato di OpenClaw risiede in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agente, stato di canali/provider e dati di sessione.
- `~/.openclaw/workspace/` — l'area di lavoro dell'agente (SOUL.md, memoria, artefatti).

Questi dati sopravvivono ai riavvii del Droplet. Per creare uno snapshot portabile:

```bash
openclaw backup create
```

Gli snapshot DigitalOcean eseguono il backup dell'intero Droplet; `openclaw backup create` è portabile tra host.

## Suggerimenti per 1 GB di RAM

Il Droplet da 6 $ ha solo 1 GB di RAM. Per mantenere tutto fluido:

- Assicurati che il passaggio dello swap sopra sia in `/etc/fstab`, così sopravvive ai riavvii.
- Preferisci modelli basati su API (Claude, GPT) rispetto a quelli locali — l'inferenza LLM locale non entra in 1 GB.
- Imposta `agents.defaults.model.primary` su un modello più piccolo se riscontri OOM con prompt grandi.
- Monitora con `free -h` e `htop`.

## Risoluzione dei problemi

**Il Gateway non si avvia** -- Esegui `openclaw doctor --non-interactive` e controlla i log con `journalctl --user -u openclaw-gateway.service -n 50`.

**Porta già in uso** -- Esegui `lsof -i :18789` per trovare il processo, poi arrestalo.

**Memoria esaurita** -- Verifica che lo swap sia attivo con `free -h`. Se continui a riscontrare OOM, usa modelli basati su API (Claude, GPT) invece dei modelli locali, oppure passa a un Droplet da 2 GB.

## Passaggi successivi

- [Canali](/it/channels) -- connetti Telegram, WhatsApp, Discord e altro
- [Configurazione del Gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione
- [Aggiornamento](/it/install/updating) -- mantieni OpenClaw aggiornato

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Fly.io](/it/install/fly)
- [Hetzner](/it/install/hetzner)
- [Hosting VPS](/it/vps)
