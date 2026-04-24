---
read_when:
    - Configurare OpenClaw su un Pi
    - Eseguire OpenClaw su dispositivi ARM
    - Creare un’AI personale economica e sempre attiva
summary: Ospitare OpenClaw su un Pi per self-hosting sempre attivo
title: Pi
x-i18n:
    generated_at: "2026-04-24T08:47:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5fa11bf65f6db50b0864dabcf417f08c06e82a5ce067304f1cbfc189a4991a40
    source_path: install/raspberry-pi.md
    workflow: 15
---

Esegui un Gateway OpenClaw persistente e sempre attivo su un Pi. Poiché il Pi funge solo da gateway (i modelli vengono eseguiti nel cloud tramite API), anche un Pi modesto gestisce bene il carico.

## Prerequisiti

- Raspberry Pi 4 o 5 con 2 GB+ di RAM (4 GB consigliati)
- Scheda MicroSD (16 GB+) oppure SSD USB (prestazioni migliori)
- Alimentatore ufficiale Pi
- Connessione di rete (Ethernet o WiFi)
- Raspberry Pi OS 64-bit (obbligatorio -- non usare 32-bit)
- Circa 30 minuti

## Configurazione

<Steps>
  <Step title="Scrivi il sistema operativo">
    Usa **Raspberry Pi OS Lite (64-bit)** -- non serve alcun desktop per un server headless.

    1. Scarica [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Scegli il sistema operativo: **Raspberry Pi OS Lite (64-bit)**.
    3. Nella finestra delle impostazioni, preconfigura:
       - Hostname: `gateway-host`
       - Abilita SSH
       - Imposta username e password
       - Configura il WiFi (se non usi Ethernet)
    4. Scrivi l’immagine sulla scheda SD o sull’unità USB, inseriscila e avvia il Pi.

  </Step>

  <Step title="Connettiti via SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Aggiorna il sistema">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Imposta il fuso orario (importante per Cron e promemoria)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Installa Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Aggiungi swap (importante per 2 GB o meno)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Riduci la swappiness per dispositivi con poca RAM
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Installa OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Esegui l’onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Segui la procedura guidata. Per dispositivi headless sono consigliate le chiavi API invece di OAuth. Telegram è il canale più semplice da cui iniziare.

  </Step>

  <Step title="Verifica">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accedi alla Control UI">
    Sul tuo computer, ottieni un URL dashboard dal Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Poi crea un tunnel SSH in un altro terminale:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Apri l’URL stampato nel browser locale. Per accesso remoto sempre attivo, vedi [Integrazione Tailscale](/it/gateway/tailscale).

  </Step>
</Steps>

## Suggerimenti sulle prestazioni

**Usa un SSD USB** -- le schede SD sono lente e si usurano. Un SSD USB migliora drasticamente le prestazioni. Vedi la [guida di avvio USB per Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Abilita la cache di compilazione dei moduli** -- accelera invocazioni CLI ripetute su host Pi meno potenti:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Riduci l’uso della memoria** -- per configurazioni headless, libera la memoria GPU e disabilita i servizi inutilizzati:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Risoluzione dei problemi

**Memoria esaurita** -- Verifica che lo swap sia attivo con `free -h`. Disabilita i servizi inutilizzati (`sudo systemctl disable cups bluetooth avahi-daemon`). Usa solo modelli basati su API.

**Prestazioni lente** -- Usa un SSD USB invece di una scheda SD. Controlla l’eventuale throttling della CPU con `vcgencmd get_throttled` (dovrebbe restituire `0x0`).

**Il servizio non si avvia** -- Controlla i log con `journalctl --user -u openclaw-gateway.service --no-pager -n 100` ed esegui `openclaw doctor --non-interactive`. Se questo è un Pi headless, verifica anche che lingering sia abilitato: `sudo loginctl enable-linger "$(whoami)"`.

**Problemi con binari ARM** -- Se una Skill fallisce con “exec format error”, controlla se il binario ha una build ARM64. Verifica l’architettura con `uname -m` (dovrebbe mostrare `aarch64`).

**Cadute WiFi** -- Disabilita la gestione energetica del WiFi: `sudo iwconfig wlan0 power off`.

## Passi successivi

- [Channels](/it/channels) -- collega Telegram, WhatsApp, Discord e altro
- [Configurazione del Gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione
- [Updating](/it/install/updating) -- mantieni OpenClaw aggiornato

## Correlati

- [Panoramica installazione](/it/install)
- [Server Linux](/it/vps)
- [Piattaforme](/it/platforms)
