---
read_when:
    - Configurare OpenClaw su un Raspberry Pi
    - Eseguire OpenClaw su dispositivi ARM
    - Creare un'IA personale economica e sempre attiva
summary: Ospita OpenClaw su un Raspberry Pi per un self-hosting sempre attivo
title: Raspberry Pi
x-i18n:
    generated_at: "2026-06-27T17:41:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9cd90b4cc70c8fe7eab2a0abadc0e2969c7dc1c09657a0819bc004280ec32ba3
    source_path: install/raspberry-pi.md
    workflow: 16
---

Esegui un OpenClaw Gateway persistente e sempre attivo su un Raspberry Pi. Poiché il Pi è solo il gateway (i modelli vengono eseguiti nel cloud tramite API), anche un Pi modesto gestisce bene il carico di lavoro — il costo hardware tipico è **35–80 $ una tantum**, senza canoni mensili.

## Compatibilità hardware

| Modello Pi   | RAM    | Funziona? | Note                                       |
| ------------ | ------ | --------- | ------------------------------------------ |
| Pi 5         | 4/8 GB | Migliore  | Il più veloce, consigliato.                |
| Pi 4         | 4 GB   | Buono     | Punto ideale per la maggior parte degli utenti. |
| Pi 4         | 2 GB   | OK        | Aggiungi swap.                             |
| Pi 4         | 1 GB   | Limitato  | Possibile con swap, configurazione minima. |
| Pi 3B+       | 1 GB   | Lento     | Funziona, ma è poco reattivo.              |
| Pi Zero 2 W  | 512 MB | No        | Non consigliato.                           |

**Minimo:** 1 GB di RAM, 1 core, 500 MB di spazio libero su disco, sistema operativo a 64 bit.
**Consigliato:** 2 GB+ di RAM, scheda SD da 16 GB+ (o SSD USB), Ethernet.

## Prerequisiti

- Raspberry Pi 4 o 5 con 2 GB+ di RAM (4 GB consigliati)
- Scheda MicroSD (16 GB+) o SSD USB (prestazioni migliori)
- Alimentatore ufficiale Pi
- Connessione di rete (Ethernet o WiFi)
- Raspberry Pi OS a 64 bit (richiesto -- non usare 32 bit)
- Circa 30 minuti

## Configurazione

<Steps>
  <Step title="Installa l'OS sulla scheda">
    Usa **Raspberry Pi OS Lite (64-bit)** -- non serve un desktop per un server headless.

    1. Scarica [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
    2. Scegli OS: **Raspberry Pi OS Lite (64-bit)**.
    3. Nella finestra delle impostazioni, preconfigura:
       - Nome host: `gateway-host`
       - Abilita SSH
       - Imposta nome utente e password
       - Configura WiFi (se non usi Ethernet)
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

    # Set timezone (important for cron and reminders)
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

    # Reduce swappiness for low-RAM devices
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

    Segui la procedura guidata. Le chiavi API sono consigliate rispetto a OAuth per i dispositivi headless. Telegram è il canale più semplice con cui iniziare.

  </Step>

  <Step title="Verifica">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Accedi alla Control UI">
    Sul tuo computer, ottieni un URL della dashboard dal Pi:

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    Poi crea un tunnel SSH in un altro terminale:

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    Apri l'URL stampato nel browser locale. Per l'accesso remoto sempre attivo, consulta [integrazione Tailscale](/it/gateway/tailscale).

  </Step>
</Steps>

## Suggerimenti per le prestazioni

**Usa un SSD USB** -- Le schede SD sono lente e si usurano. Un SSD USB migliora drasticamente le prestazioni. Consulta la [guida all'avvio USB per Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot).

**Abilita la cache di compilazione dei moduli** -- Accelera le invocazioni CLI ripetute su host Pi meno potenti:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`OPENCLAW_NO_RESPAWN=1` mantiene i riavvii ordinari del Gateway nello stesso processo, evitando passaggi di consegne a processi aggiuntivi e mantenendo semplice il tracciamento del PID su host piccoli.

**Riduci l'uso di memoria** -- Per configurazioni headless, libera memoria GPU e disabilita i servizi inutilizzati:

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**Drop-in systemd per riavvii stabili** -- Se questo Pi esegue principalmente OpenClaw, aggiungi un drop-in del servizio:

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

Poi `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`. Su un Pi headless, abilita anche lingering una volta, così il servizio utente sopravvive al logout: `sudo loginctl enable-linger "$(whoami)"`.

## Configurazione dei modelli consigliata

Poiché il Pi esegue solo il gateway, usa modelli API ospitati nel cloud:

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

Non eseguire LLM locali su un Pi — anche i modelli piccoli sono troppo lenti per essere utili. Lascia che Claude o GPT gestiscano il lavoro del modello.

## Note sui binari ARM

La maggior parte delle funzionalità di OpenClaw funziona su ARM64 senza modifiche (Node.js, Telegram, WhatsApp/Baileys, Chromium). I binari che occasionalmente non dispongono di build ARM sono in genere strumenti CLI Go/Rust opzionali distribuiti dalle skills. Verifica nella pagina delle release di un binario mancante la presenza di artefatti `linux-arm64` / `aarch64` prima di ripiegare sulla compilazione da sorgente.

## Persistenza e backup

Lo stato di OpenClaw si trova in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agente, stato di canali/provider, sessioni.
- `~/.openclaw/workspace/` — workspace dell'agente (SOUL.md, memoria, artefatti).

Questi dati sopravvivono ai riavvii. Crea uno snapshot portabile con:

```bash
openclaw backup create
```

Se li mantieni su un SSD, sia le prestazioni sia la longevità migliorano rispetto alla scheda SD.

## Risoluzione dei problemi

**Memoria esaurita** -- Verifica che lo swap sia attivo con `free -h`. Disabilita i servizi inutilizzati (`sudo systemctl disable cups bluetooth avahi-daemon`). Usa solo modelli basati su API.

**Prestazioni lente** -- Usa un SSD USB invece di una scheda SD. Controlla eventuale throttling della CPU con `vcgencmd get_throttled` (dovrebbe restituire `0x0`).

**Il servizio non si avvia** -- Controlla i log con `journalctl --user -u openclaw-gateway.service --no-pager -n 100` ed esegui `openclaw doctor --non-interactive`. Se questo è un Pi headless, verifica anche che lingering sia abilitato: `sudo loginctl enable-linger "$(whoami)"`.

**Problemi con binari ARM** -- Se una skill fallisce con "exec format error", controlla se il binario ha una build ARM64. Verifica l'architettura con `uname -m` (dovrebbe mostrare `aarch64`).

**Cadute del WiFi** -- Disabilita la gestione energetica del WiFi: `sudo iwconfig wlan0 power off`.

## Passaggi successivi

- [Canali](/it/channels) -- collega Telegram, WhatsApp, Discord e altri
- [Configurazione del Gateway](/it/gateway/configuration) -- tutte le opzioni di configurazione
- [Aggiornamento](/it/install/updating) -- mantieni OpenClaw aggiornato

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Server Linux](/it/vps)
- [Piattaforme](/it/platforms)
