---
read_when:
    - Configurare OpenClaw su Raspberry Pi
    - Eseguire OpenClaw su dispositivi ARM
    - Costruire una AI personale economica sempre attiva
summary: OpenClaw su Raspberry Pi (configurazione self-hosted economica)
title: Raspberry Pi (piattaforma)
x-i18n:
    generated_at: "2026-04-24T08:51:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 79a2e8edf3c2853deddece8d52dc87b9a5800643b4d866acd80db3a83ca9b270
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw su Raspberry Pi

## Obiettivo

Eseguire un Gateway OpenClaw persistente e sempre attivo su un Raspberry Pi con un costo una tantum di **~$35-80** (nessun canone mensile).

Perfetto per:

- assistente AI personale 24/7
- hub di automazione domestica
- bot Telegram/WhatsApp sempre disponibile a basso consumo

## Requisiti hardware

| Modello Pi       | RAM     | Funziona? | Note                               |
| ---------------- | ------- | --------- | ---------------------------------- |
| **Pi 5**         | 4GB/8GB | ✅ Migliore | Più veloce, consigliato          |
| **Pi 4**         | 4GB     | ✅ Buono   | Punto ideale per la maggior parte degli utenti |
| **Pi 4**         | 2GB     | ✅ OK      | Funziona, aggiungi swap           |
| **Pi 4**         | 1GB     | ⚠️ Stretto | Possibile con swap, configurazione minima |
| **Pi 3B+**       | 1GB     | ⚠️ Lento   | Funziona ma è lento               |
| **Pi Zero 2 W**  | 512MB   | ❌         | Non consigliato                   |

**Specifiche minime:** 1GB RAM, 1 core, 500MB disco  
**Consigliato:** 2GB+ RAM, OS a 64 bit, scheda SD da 16GB+ (o SSD USB)

## Cosa ti serve

- Raspberry Pi 4 o 5 (consigliati 2GB+)
- Scheda MicroSD (16GB+) o SSD USB (prestazioni migliori)
- Alimentatore (consigliato PSU ufficiale Pi)
- Connessione di rete (Ethernet o WiFi)
- ~30 minuti

## 1) Scrivere l'OS

Usa **Raspberry Pi OS Lite (64-bit)** — per un server headless non serve il desktop.

1. Scarica [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Scegli l'OS: **Raspberry Pi OS Lite (64-bit)**
3. Clicca sull'icona a forma di ingranaggio (⚙️) per la preconfigurazione:
   - Imposta hostname: `gateway-host`
   - Abilita SSH
   - Imposta username/password
   - Configura il WiFi (se non usi Ethernet)
4. Scrivi sulla scheda SD / unità USB
5. Inserisci il supporto e avvia il Pi

## 2) Connettersi via SSH

```bash
ssh user@gateway-host
# oppure usa l'indirizzo IP
ssh user@192.168.x.x
```

## 3) Configurazione del sistema

```bash
# Aggiorna il sistema
sudo apt update && sudo apt upgrade -y

# Installa i pacchetti essenziali
sudo apt install -y git curl build-essential

# Imposta il fuso orario (importante per Cron/promemoria)
sudo timedatectl set-timezone America/Chicago  # Cambia con il tuo fuso orario
```

## 4) Installare Node.js 24 (ARM64)

```bash
# Installa Node.js tramite NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verifica
node --version  # Dovrebbe mostrare v24.x.x
npm --version
```

## 5) Aggiungere swap (importante per 2GB o meno)

Lo swap previene i crash per memoria esaurita:

```bash
# Crea un file swap da 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Rendilo permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Ottimizza per poca RAM (riduci swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Installare OpenClaw

### Opzione A: installazione standard (consigliata)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Opzione B: installazione modificabile (per sperimentare)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

L'installazione modificabile ti dà accesso diretto a log e codice — utile per il debug di problemi specifici di ARM.

## 7) Eseguire l'onboarding

```bash
openclaw onboard --install-daemon
```

Segui la procedura guidata:

1. **Modalità Gateway:** Local
2. **Auth:** consigliate chiavi API (OAuth può essere delicato su Pi headless)
3. **Canali:** Telegram è il più semplice da cui partire
4. **Daemon:** Sì (systemd)

## 8) Verificare l'installazione

```bash
# Controlla lo stato
openclaw status

# Controlla il servizio (installazione standard = unità utente systemd)
systemctl --user status openclaw-gateway.service

# Visualizza i log
journalctl --user -u openclaw-gateway.service -f
```

## 9) Accedere alla dashboard OpenClaw

Sostituisci `user@gateway-host` con username e hostname o indirizzo IP del tuo Pi.

Sul tuo computer, chiedi al Pi di stampare un nuovo URL dashboard:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Il comando stampa `Dashboard URL:`. A seconda di come è configurato `gateway.auth.token`,
l'URL può essere un semplice link `http://127.0.0.1:18789/` oppure uno
che include `#token=...`.

In un altro terminale sul tuo computer, crea il tunnel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Poi apri nel browser locale l'URL Dashboard stampato.

Se la UI chiede l'auth con segreto condiviso, incolla il token o la password configurati
nelle impostazioni della UI Control. Per l'autenticazione con token, usa `gateway.auth.token` (oppure
`OPENCLAW_GATEWAY_TOKEN`).

Per accesso remoto always-on, vedi [Tailscale](/it/gateway/tailscale).

---

## Ottimizzazioni delle prestazioni

### Usa un SSD USB (miglioramento enorme)

Le schede SD sono lente e si usurano. Un SSD USB migliora drasticamente le prestazioni:

```bash
# Controlla se l'avvio avviene da USB
lsblk
```

Consulta la [guida all'avvio USB su Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) per la configurazione.

### Velocizzare l'avvio della CLI (cache di compilazione dei moduli)

Sugli host Pi meno potenti, abilita la cache di compilazione dei moduli di Node così le esecuzioni ripetute della CLI sono più veloci:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Note:

- `NODE_COMPILE_CACHE` accelera le esecuzioni successive (`status`, `health`, `--help`).
- `/var/tmp` sopravvive ai riavvii meglio di `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` evita il costo aggiuntivo di avvio dovuto all'auto-respawn della CLI.
- La prima esecuzione scalda la cache; le esecuzioni successive ne beneficiano maggiormente.

### Ottimizzazione dell'avvio systemd (facoltativa)

Se questo Pi esegue principalmente OpenClaw, aggiungi un drop-in del servizio per ridurre
il jitter di riavvio e mantenere stabile l'ambiente di avvio:

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

Poi applica:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

Se possibile, mantieni stato/cache di OpenClaw su storage supportato da SSD per evitare
colli di bottiglia di I/O casuale della scheda SD durante gli avvii a freddo.

Se questo è un Pi headless, abilita una volta il lingering così il servizio utente sopravvive
al logout:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Come i criteri `Restart=` aiutano il recupero automatico:
[systemd può automatizzare il recupero dei servizi](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Ridurre l'uso della memoria

```bash
# Disabilita l'allocazione della memoria GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disabilita il Bluetooth se non serve
sudo systemctl disable bluetooth
```

### Monitorare le risorse

```bash
# Controlla la memoria
free -h

# Controlla la temperatura della CPU
vcgencmd measure_temp

# Monitoraggio live
htop
```

---

## Note specifiche per ARM

### Compatibilità dei binari

La maggior parte delle funzionalità di OpenClaw funziona su ARM64, ma alcuni binari esterni potrebbero richiedere build ARM:

| Strumento          | Stato ARM64 | Note                                  |
| ------------------ | ----------- | ------------------------------------- |
| Node.js            | ✅          | Funziona molto bene                   |
| WhatsApp (Baileys) | ✅          | JavaScript puro, nessun problema      |
| Telegram           | ✅          | JavaScript puro, nessun problema      |
| gog (Gmail CLI)    | ⚠️          | Verifica la disponibilità di una release ARM |
| Chromium (browser) | ✅          | `sudo apt install chromium-browser`   |

Se una Skill fallisce, controlla se il suo binario ha una build ARM. Molti strumenti Go/Rust ce l'hanno; alcuni no.

### 32 bit vs 64 bit

**Usa sempre un OS a 64 bit.** Node.js e molti strumenti moderni lo richiedono. Controlla con:

```bash
uname -m
# Dovrebbe mostrare: aarch64 (64-bit) e non armv7l (32-bit)
```

---

## Configurazione modello consigliata

Dato che il Pi è solo il Gateway (i modelli girano nel cloud), usa modelli basati su API:

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

**Non provare a eseguire LLM locali su un Pi** — anche i modelli piccoli sono troppo lenti. Lascia che Claude/GPT facciano il lavoro pesante.

---

## Avvio automatico al boot

L'onboarding lo configura già, ma per verificare:

```bash
# Controlla che il servizio sia abilitato
systemctl --user is-enabled openclaw-gateway.service

# Abilitalo se non lo è
systemctl --user enable openclaw-gateway.service

# Avvia al boot
systemctl --user start openclaw-gateway.service
```

---

## Risoluzione dei problemi

### Memoria esaurita (OOM)

```bash
# Controlla la memoria
free -h

# Aggiungi più swap (vedi passaggio 5)
# Oppure riduci i servizi in esecuzione sul Pi
```

### Prestazioni lente

- Usa un SSD USB invece della scheda SD
- Disabilita i servizi inutilizzati: `sudo systemctl disable cups bluetooth avahi-daemon`
- Controlla il throttling della CPU: `vcgencmd get_throttled` (dovrebbe restituire `0x0`)

### Il servizio non si avvia

```bash
# Controlla i log
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Correzione comune: ricostruisci
cd ~/openclaw  # se usi l'installazione modificabile
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problemi con binari ARM

Se una Skill fallisce con "exec format error":

1. Controlla se il binario ha una build ARM64
2. Prova a compilarlo dal sorgente
3. Oppure usa un container Docker con supporto ARM

### Il WiFi cade

Per Pi headless su WiFi:

```bash
# Disabilita il risparmio energetico WiFi
sudo iwconfig wlan0 power off

# Rendilo permanente
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Confronto dei costi

| Configurazione  | Costo una tantum | Costo mensile | Note                          |
| --------------- | ---------------- | ------------- | ----------------------------- |
| **Pi 4 (2GB)**  | ~$45             | $0            | + corrente (~$5/anno)         |
| **Pi 4 (4GB)**  | ~$55             | $0            | Consigliato                   |
| **Pi 5 (4GB)**  | ~$60             | $0            | Migliori prestazioni          |
| **Pi 5 (8GB)**  | ~$80             | $0            | Eccessivo ma a prova di futuro |
| DigitalOcean    | $0               | $6/mese       | $72/anno                      |
| Hetzner         | $0               | €3.79/mese    | ~$50/anno                     |

**Punto di pareggio:** un Pi si ripaga in ~6-12 mesi rispetto a una VPS cloud.

---

## Correlati

- [Guida Linux](/it/platforms/linux) — configurazione Linux generale
- [Guida DigitalOcean](/it/install/digitalocean) — alternativa cloud
- [Guida Hetzner](/it/install/hetzner) — configurazione Docker
- [Tailscale](/it/gateway/tailscale) — accesso remoto
- [Nodes](/it/nodes) — associa il tuo laptop/telefono al gateway Pi
