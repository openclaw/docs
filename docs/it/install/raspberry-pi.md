---
read_when:
    - Configurazione di OpenClaw su un Raspberry Pi
    - Esecuzione di OpenClaw su dispositivi ARM
    - Creazione di un'AI personale economica e sempre attiva
summary: Ospitare OpenClaw su un Raspberry Pi per self-hosting sempre attivo
title: Raspberry Pi
x-i18n:
    generated_at: "2026-04-05T13:56:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 222ccbfb18a8dcec483adac6f5647dcb455c84edbad057e0ba2589a6da570b4c
    source_path: install/raspberry-pi.md
    workflow: 15
---

# Raspberry Pi

Esegui un Gateway OpenClaw persistente e sempre attivo su un Raspberry Pi. Poiché il Pi funge solo da gateway (i modelli vengono eseguiti nel cloud tramite API), anche un Pi modesto gestisce bene il carico di lavoro.

## Prerequisiti

- Raspberry Pi 4 o 5 con 2 GB+ di RAM (consigliati 4 GB)
- Scheda MicroSD (16 GB+) o SSD USB (prestazioni migliori)
- Alimentatore ufficiale Pi
- Connessione di rete (Ethernet o WiFi)
- Raspberry Pi OS a 64 bit (richiesto -- non usare la versione a 32 bit)
- Circa 30 minuti

## Configurazione

<Steps>
  <Step title="Installa il sistema operativo">
    Usa **Raspberry Pi OS Lite (64-bit)** -- non serve il desktop per un server headless.

    1. Scarica [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Scegli il sistema operativo: **Raspberry Pi OS Lite (64-bit)**.
    3. Nella finestra delle impostazioni, preconfigura:
       - Hostname: `gateway-host`
       - Abilita SSH
       - Imposta nome utente e password
       - Configura il WiFi (se non usi Ethernet)
    4. Scrivi l'immagine sulla scheda SD o sull'unità USB, inseriscila e avvia il Pi.

  </Step>

  <Step title="Connettiti tramite SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Aggiorna il sistema">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Imposta il fuso orario (importante per cron e promemoria)
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

    # Riduci swappiness per dispositivi con poca RAM
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Installa OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Esegui l'onboarding">
    ```bash
    openclaw onboard --install-daemon
    ```

    Segui la procedura guidata. Per i dispositivi headless sono consigliate le chiavi API anziché OAuth. Telegram è il canale più semplice con cui iniziare.

  </Step>

  <Step title="Verifica">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accedi alla Control UI">
    Sul tuo computer, ottieni dal Pi un URL della dashboard:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Poi crea un tunnel SSH in un altro terminale:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Apri l'URL stampato nel browser locale. Per un accesso remoto sempre attivo, vedi [integrazione Tailscale](/gateway/tailscale).

  </Step>
</Steps>

## Suggerimenti per le prestazioni

**Usa un SSD USB** -- le schede SD sono lente e si usurano. Un SSD USB migliora notevolmente le prestazioni. Vedi la [guida all'avvio USB del Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Abilita la cache di compilazione dei moduli** -- accelera le invocazioni ripetute della CLI su host Pi meno potenti:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**Riduci l'uso della memoria** -- per configurazioni headless, libera memoria GPU e disabilita i servizi inutilizzati:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## Risoluzione dei problemi

**Memoria esaurita** -- verifica che lo swap sia attivo con `free -h`. Disabilita i servizi inutilizzati (`sudo systemctl disable cups bluetooth avahi-daemon`). Usa solo modelli basati su API.

**Prestazioni lente** -- usa un SSD USB invece di una scheda SD. Controlla eventuale throttling della CPU con `vcgencmd get_throttled` (dovrebbe restituire `0x0`).

**Il servizio non si avvia** -- controlla i log con `journalctl --user -u openclaw-gateway.service --no-pager -n 100` ed esegui `openclaw doctor --non-interactive`. Se si tratta di un Pi headless, verifica anche che lingering sia abilitato: `sudo loginctl enable-linger "$(whoami)"`.

**Problemi con binari ARM** -- se una skill fallisce con "exec format error", controlla se il binario ha una build ARM64. Verifica l'architettura con `uname -m` (dovrebbe mostrare `aarch64`).

**Disconnessioni WiFi** -- disabilita la gestione energetica del WiFi: `sudo iwconfig wlan0 power off`.

## Passaggi successivi

- [Canali](/it/channels) -- collega Telegram, WhatsApp, Discord e altro
- [Configurazione del Gateway](/gateway/configuration) -- tutte le opzioni di configurazione
- [Aggiornamento](/install/updating) -- mantieni OpenClaw aggiornato
