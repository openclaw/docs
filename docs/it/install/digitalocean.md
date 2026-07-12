---
read_when:
    - Configurazione di OpenClaw su DigitalOcean
    - Cerchi un semplice VPS a pagamento per OpenClaw
summary: Ospitare OpenClaw su un Droplet DigitalOcean
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T07:09:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

Esegui un Gateway OpenClaw persistente su un Droplet DigitalOcean (~6 $/mese per il piano Basic da 1 GB).

DigitalOcean offre una soluzione VPS a pagamento semplice. Per opzioni più economiche o gratuite:

- [Hetzner](/it/install/hetzner) -- più core/RAM per ogni dollaro.
- [Oracle Cloud](/it/install/oracle) -- piano ARM Always Free (fino a 4 OCPU e 24 GB di RAM), ma la registrazione può essere problematica ed è disponibile solo per ARM.

## Prerequisiti

- Account DigitalOcean ([registrazione](https://cloud.digitalocean.com/registrations/new))
- Coppia di chiavi SSH (oppure disponibilità a usare l'autenticazione tramite password)
- Circa 20 minuti

## Configurazione

<Steps>
  <Step title="Crea un Droplet">
    <Warning>
    Usa un'immagine di base pulita (Ubuntu 24.04 LTS). Evita le immagini Marketplace di terze parti con installazione in un clic, a meno che tu non ne abbia esaminato gli script di avvio e le impostazioni predefinite del firewall.
    </Warning>

    1. Accedi a [DigitalOcean](https://cloud.digitalocean.com/).
    2. Fai clic su **Create > Droplets**.
    3. Scegli:
       - **Region:** la regione più vicina
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** chiave SSH (consigliata) o password
    4. Fai clic su **Create Droplet** e annota l'indirizzo IP.

  </Step>

  <Step title="Connettiti e installa">
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

    Usa la shell root solo per la configurazione iniziale del sistema. Esegui i comandi OpenClaw come utente non root `openclaw`, affinché lo stato risieda in `/home/openclaw/.openclaw/` e il Gateway venga installato come servizio systemd `--user` di tale utente.

  </Step>

  <Step title="Esegui la configurazione iniziale">
    ```bash
    openclaw onboard --install-daemon
    ```

    La procedura guidata illustra l'autenticazione del modello, la configurazione dei canali, la generazione del token del Gateway e l'installazione del daemon (servizio utente systemd).

  </Step>

  <Step title="Aggiungi lo swap (consigliato per i Droplet da 1 GB)">
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

  <Step title="Accedi all'interfaccia di controllo">
    Per impostazione predefinita, il Gateway resta in ascolto sull'interfaccia local loopback. Scegli una delle seguenti opzioni.

    **Opzione A: tunnel SSH (la più semplice)**

    ```bash
    # From your local machine
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    Quindi apri `http://localhost:18789`.

    **Opzione B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    Quindi apri `https://<magicdns>/` da qualsiasi dispositivo sulla tua tailnet.

    Tailscale Serve autentica il traffico dell'interfaccia di controllo e WebSocket tramite le intestazioni di identità della tailnet; ciò presuppone che l'host del Gateway stesso sia attendibile. Gli endpoint dell'API HTTP continuano comunque a seguire la normale modalità di autenticazione del Gateway (token/password). Per richiedere credenziali esplicite basate su un segreto condiviso tramite Serve, imposta `gateway.auth.allowTailscale: false` e usa `gateway.auth.mode: "token"` oppure `"password"`.

    **Opzione C: associazione alla tailnet (senza Serve)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    Quindi apri `http://<tailscale-ip>:18789` (token obbligatorio).

  </Step>
</Steps>

## Persistenza e backup

Lo stato di OpenClaw risiede in:

- `~/.openclaw/` -- `openclaw.json`, credenziali di canali e provider, file `auth-profiles.json` per ciascun agente e dati delle sessioni.
- `~/.openclaw/workspace/` -- lo spazio di lavoro dell'agente (SOUL.md, memoria, artefatti).

Questi dati persistono dopo i riavvii del Droplet. Per creare un'istantanea portabile:

```bash
openclaw backup create
```

Le istantanee di DigitalOcean eseguono il backup dell'intero Droplet; `openclaw backup create` è portabile tra host diversi.

## Suggerimenti per 1 GB di RAM

Il Droplet da 6 $ dispone di solo 1 GB di RAM. Per garantire un funzionamento fluido:

- Assicurati che la configurazione dello swap descritta sopra sia presente in `/etc/fstab`, in modo che persista dopo i riavvii.
- Preferisci i modelli basati su API (Claude, GPT) a quelli locali: l'inferenza LLM locale non è eseguibile con 1 GB.
- Imposta `agents.defaults.model.primary` su un modello più piccolo se riscontri errori OOM con prompt di grandi dimensioni.
- Monitora il sistema con `free -h` e `htop`.

## Risoluzione dei problemi

**Il Gateway non si avvia** -- Esegui `openclaw doctor --non-interactive` e controlla i log con `journalctl --user -u openclaw-gateway.service -n 50`.

**Porta già in uso** -- Esegui `lsof -i :18789` per individuare il processo, quindi arrestalo.

**Memoria esaurita** -- Verifica che lo swap sia attivo con `free -h`. Se continui a riscontrare errori OOM, passa a modelli basati su API (Claude, GPT) anziché a modelli locali, oppure esegui l'upgrade a un Droplet da 2 GB.

## Passaggi successivi

- [Canali](/it/channels) -- connetti Telegram, WhatsApp, Discord e altri servizi
- [Configurazione del Gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione
- [Aggiornamento](/it/install/updating) -- mantieni OpenClaw aggiornato

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Fly.io](/it/install/fly)
- [Hetzner](/it/install/hetzner)
- [Hosting VPS](/it/vps)
