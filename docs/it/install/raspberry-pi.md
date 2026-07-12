---
read_when:
    - Configurazione di OpenClaw su un Raspberry Pi
    - Esecuzione di OpenClaw su dispositivi ARM
    - Creare un'IA personale economica e sempre attiva
summary: Ospita OpenClaw su un Raspberry Pi per un'installazione self-hosted sempre attiva
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T07:10:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Esegui un Gateway OpenClaw persistente e sempre attivo su un Raspberry Pi. Poiché il Pi funge solo da Gateway (i modelli vengono eseguiti nel cloud tramite API), anche un Pi modesto gestisce bene il carico di lavoro: il costo tipico dell'hardware è di **35-80 $ una tantum**, senza costi mensili.

## Compatibilità hardware

| Modello Pi   | RAM    | Funziona? | Note                                        |
| ------------ | ------ | ---------- | ------------------------------------------- |
| Pi 5         | 4/8 GB | Ottimo     | Il più veloce, consigliato.                 |
| Pi 4         | 4 GB   | Buono      | La soluzione ideale per la maggior parte degli utenti. |
| Pi 4         | 2 GB   | Adeguato   | Aggiungere lo spazio di swap.               |
| Pi 4         | 1 GB   | Limitato   | Possibile con swap e configurazione minima. |
| Pi 3B+       | 1 GB   | Lento      | Funziona, ma con scarsa reattività.         |
| Pi Zero 2 W  | 512 MB | No         | Non consigliato.                            |

**Minimo:** 1 GB di RAM, 1 core, 500 MB di spazio libero su disco, sistema operativo a 64 bit.
**Consigliato:** almeno 2 GB di RAM, scheda SD da almeno 16 GB (oppure SSD USB), Ethernet.

## Prerequisiti

- Raspberry Pi 4 o 5 con almeno 2 GB di RAM (consigliati 4 GB)
- Scheda microSD (almeno 16 GB) oppure SSD USB (prestazioni migliori)
- Alimentatore ufficiale per Pi
- Connessione di rete (Ethernet o WiFi)
- Raspberry Pi OS a 64 bit (obbligatorio: non utilizzare la versione a 32 bit)
- Circa 30 minuti

## Configurazione

<Steps>
  <Step title="Installare il sistema operativo">
    Utilizza **Raspberry Pi OS Lite (64-bit)**: per un server senza monitor non è necessario un ambiente desktop.

    1. Scarica [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Scegli il sistema operativo: **Raspberry Pi OS Lite (64-bit)**.
    3. Nella finestra delle impostazioni, configura in anticipo:
       - Hostname: `gateway-host`
       - Enable SSH
       - Set username and password
       - Configure WiFi (se non utilizzi Ethernet)
    4. Scrivi l'immagine sulla scheda SD o sull'unità USB, inseriscila e avvia il Pi.

  </Step>

  <Step title="Connettersi tramite SSH">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="Aggiornare il sistema">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # Set timezone (important for cron and reminders)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Installare Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="Aggiungere lo spazio di swap (importante con 2 GB o meno)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # Reduce swappiness for low-RAM devices
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="Installare OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="Eseguire la configurazione iniziale">
    ```bash
    openclaw onboard --install-daemon
    ```

    Segui la procedura guidata. Per i dispositivi senza monitor sono consigliate le chiavi API anziché OAuth. Telegram è il canale più semplice con cui iniziare.

  </Step>

  <Step title="Verificare">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accedere all'interfaccia di controllo">
    Sul computer, ottieni dal Pi l'URL della dashboard:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Quindi crea un tunnel SSH in un altro terminale:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Apri l'URL visualizzato nel browser locale. Per un accesso remoto sempre disponibile, consulta l'[integrazione con Tailscale](/it/gateway/tailscale).

  </Step>
</Steps>

## Suggerimenti per le prestazioni

**Utilizza un SSD USB**: le schede SD sono lente e si usurano. Un SSD USB migliora notevolmente le prestazioni e sopporta più cicli di scrittura; utilizzalo per `OPENCLAW_STATE_DIR` se mantieni il sistema operativo sulla scheda SD. Consulta la [guida all'avvio da USB del Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Abilita la cache di compilazione dei moduli**: velocizza le invocazioni ripetute della CLI sui Pi meno potenti. `OPENCLAW_NO_RESPAWN=1` mantiene nello stesso processo i normali riavvii del Gateway, evitando ulteriori passaggi tra processi e semplificando il monitoraggio del PID sui dispositivi meno potenti:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Utilizza `/var/tmp`, non `/tmp`: alcune distribuzioni svuotano `/tmp` all'avvio, eliminando la cache già preparata.

**Riduci l'utilizzo della memoria**: per le configurazioni senza monitor, libera la memoria della GPU e disabilita i servizi inutilizzati:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Configurazione aggiuntiva di systemd per riavvii affidabili**: se questo Pi viene utilizzato principalmente per eseguire OpenClaw, aggiungi una configurazione aggiuntiva al servizio:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Quindi esegui `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Su un Pi senza monitor, abilita inoltre una volta la persistenza della sessione utente affinché il servizio continui a funzionare dopo la disconnessione: `sudo loginctl enable-linger "$(whoami)"`.

## Configurazione consigliata dei modelli

Poiché il Pi esegue solo il Gateway, utilizza modelli API ospitati nel cloud; non eseguire LLM locali su un Pi, perché anche i modelli più piccoli sono troppo lenti per risultare utili:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

## Note sui file binari ARM

La maggior parte delle funzionalità di OpenClaw opera su ARM64 senza modifiche (Node.js, Telegram, WhatsApp/Baileys, Chromium). I file binari per cui talvolta non sono disponibili build ARM sono in genere strumenti CLI Go/Rust facoltativi distribuiti tramite Skills. Verifica l'architettura con `uname -m` (dovrebbe mostrare `aarch64`), quindi controlla nella pagina delle versioni del file binario mancante la presenza di artefatti `linux-arm64` / `aarch64` prima di ricorrere alla compilazione dal codice sorgente.

## Persistenza e backup

Lo stato di OpenClaw si trova in:

- `~/.openclaw/`: `openclaw.json`, file `auth-profiles.json` per agente, stato di canali e provider, sessioni.
- `~/.openclaw/workspace/`: spazio di lavoro dell'agente (SOUL.md, memoria, artefatti).

Questi dati persistono dopo i riavvii e traggono vantaggio dall'uso di un SSD anziché di una scheda SD, sia in termini di prestazioni sia di durata. Crea un'istantanea portabile con:

```bash
openclaw backup create
```

## Risoluzione dei problemi

**Memoria insufficiente**: verifica che lo swap sia attivo con `free -h`. Disabilita i servizi inutilizzati (`sudo systemctl disable cups bluetooth avahi-daemon`). Utilizza esclusivamente modelli basati su API.

**Prestazioni lente**: utilizza un SSD USB anziché una scheda SD. Controlla la limitazione della frequenza della CPU con `vcgencmd get_throttled` (dovrebbe restituire `0x0`).

**Il servizio non si avvia**: controlla i registri con `journalctl --user -u openclaw-gateway.service --no-pager -n 100` ed esegui `openclaw doctor --non-interactive`. Se si tratta di un Pi senza monitor, verifica inoltre che la persistenza della sessione utente sia abilitata: `sudo loginctl enable-linger "$(whoami)"`.

**Problemi con i file binari ARM**: se una Skill non riesce a essere eseguita e restituisce `"exec format error"`, controlla se è disponibile una build ARM64 del file binario. Verifica l'architettura con `uname -m` (dovrebbe mostrare `aarch64`).

**Disconnessioni WiFi**: disabilita la gestione energetica del WiFi: `sudo iwconfig wlan0 power off`.

## Passaggi successivi

- [Canali](/it/channels): collega Telegram, WhatsApp, Discord e altri servizi
- [Configurazione del Gateway](/it/gateway/configuration): tutte le opzioni di configurazione
- [Aggiornamento](/it/install/updating): mantieni OpenClaw aggiornato

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Server Linux](/it/vps)
- [Piattaforme](/it/platforms)
