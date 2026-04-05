---
read_when:
    - Configurazione di OpenClaw su un Raspberry Pi
    - Esecuzione di OpenClaw su dispositivi ARM
    - Creazione di un'AI personale economica sempre attiva
summary: OpenClaw su Raspberry Pi (configurazione self-hosted economica)
title: Raspberry Pi (Piattaforma)
x-i18n:
    generated_at: "2026-04-05T13:59:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07f34e91899b7e0a31d9b944f3cb0cfdd4ecdeba58b619ae554379abdbf37eaf
    source_path: platforms/raspberry-pi.md
    workflow: 15
---

# OpenClaw su Raspberry Pi

## Obiettivo

Esegui un Gateway OpenClaw persistente e sempre attivo su un Raspberry Pi con un costo una tantum di **~$35-80** (nessun canone mensile).

Perfetto per:

- Assistente AI personale 24/7
- Hub di automazione domestica
- Bot Telegram/WhatsApp a basso consumo e sempre disponibile

## Requisiti hardware

| Modello Pi      | RAM     | Funziona? | Note                               |
| --------------- | ------- | --------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Ottimo | Il più veloce, consigliato         |
| **Pi 4**        | 4GB     | ✅ Buono  | Il punto ideale per la maggior parte degli utenti |
| **Pi 4**        | 2GB     | ✅ OK     | Funziona, aggiungi swap            |
| **Pi 4**        | 1GB     | ⚠️ Stretto | Possibile con swap, configurazione minima |
| **Pi 3B+**      | 1GB     | ⚠️ Lento  | Funziona ma è lento                |
| **Pi Zero 2 W** | 512MB   | ❌        | Non consigliato                    |

**Specifiche minime:** 1GB RAM, 1 core, 500MB disco  
**Consigliato:** 2GB+ RAM, OS a 64 bit, scheda SD da 16GB+ (o SSD USB)

## Cosa ti serve

- Raspberry Pi 4 o 5 (consigliati 2GB+)
- Scheda MicroSD (16GB+) o SSD USB (prestazioni migliori)
- Alimentatore (consigliato l'alimentatore ufficiale Pi)
- Connessione di rete (Ethernet o WiFi)
- ~30 minuti

## 1) Scrivi il sistema operativo

Usa **Raspberry Pi OS Lite (64-bit)** — non serve alcun desktop per un server headless.

1. Scarica [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Scegli il sistema operativo: **Raspberry Pi OS Lite (64-bit)**
3. Fai clic sull'icona a ingranaggio (⚙️) per preconfigurare:
   - Imposta il nome host: `gateway-host`
   - Abilita SSH
   - Imposta nome utente/password
   - Configura il WiFi (se non usi Ethernet)
4. Scrivi sulla scheda SD / unità USB
5. Inserisci il supporto e avvia il Pi

## 2) Connettiti via SSH

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

# Imposta il fuso orario (importante per cron/promemoria)
sudo timedatectl set-timezone America/Chicago  # Cambia con il tuo fuso orario
```

## 4) Installa Node.js 24 (ARM64)

```bash
# Installa Node.js tramite NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verifica
node --version  # Dovrebbe mostrare v24.x.x
npm --version
```

## 5) Aggiungi swap (importante per 2GB o meno)

Lo swap previene i crash per memoria esaurita:

```bash
# Crea un file di swap da 2GB
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

## 6) Installa OpenClaw

### Opzione A: installazione standard (consigliata)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### Opzione B: installazione modificabile (per smanettare)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

L'installazione modificabile ti dà accesso diretto a log e codice — utile per il debug di problemi specifici ARM.

## 7) Esegui l'onboarding

```bash
openclaw onboard --install-daemon
```

Segui la procedura guidata:

1. **Modalità Gateway:** Local
2. **Autenticazione:** consigliate le API key (OAuth può essere delicato su Pi headless)
3. **Canali:** Telegram è il più semplice da cui iniziare
4. **Daemon:** Sì (systemd)

## 8) Verifica l'installazione

```bash
# Controlla lo stato
openclaw status

# Controlla il servizio (installazione standard = unità utente systemd)
systemctl --user status openclaw-gateway.service

# Visualizza i log
journalctl --user -u openclaw-gateway.service -f
```

## 9) Accedi alla dashboard OpenClaw

Sostituisci `user@gateway-host` con il tuo nome utente Pi e il nome host o indirizzo IP.

Sul tuo computer, chiedi al Pi di stampare un URL dashboard aggiornato:

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

Il comando stampa `Dashboard URL:`. A seconda di come `gateway.auth.token`
è configurato, l'URL può essere un semplice link `http://127.0.0.1:18789/` oppure uno
che include `#token=...`.

In un altro terminale sul tuo computer, crea il tunnel SSH:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Poi apri l'URL Dashboard stampato nel browser locale.

Se la UI richiede l'autenticazione con segreto condiviso, incolla il token o la password
configurati nelle impostazioni della UI di controllo. Per l'autenticazione con token, usa `gateway.auth.token` (o
`OPENCLAW_GATEWAY_TOKEN`).

Per un accesso remoto sempre attivo, vedi [Tailscale](/gateway/tailscale).

---

## Ottimizzazioni delle prestazioni

### Usa un SSD USB (miglioramento enorme)

Le schede SD sono lente e si usurano. Un SSD USB migliora drasticamente le prestazioni:

```bash
# Controlla se l'avvio avviene da USB
lsblk
```

Vedi la [guida all'avvio USB del Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) per la configurazione.

### Velocizza l'avvio della CLI (cache di compilazione dei moduli)

Sugli host Pi meno potenti, abilita la cache di compilazione dei moduli di Node in modo che le esecuzioni ripetute della CLI siano più rapide:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

Note:

- `NODE_COMPILE_CACHE` velocizza le esecuzioni successive (`status`, `health`, `--help`).
- `/var/tmp` sopravvive ai riavvii meglio di `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` evita il costo di avvio aggiuntivo dovuto all'auto-respawn della CLI.
- La prima esecuzione riscalda la cache; quelle successive ne beneficiano di più.

### Ottimizzazione dell'avvio systemd (facoltativa)

Se questo Pi esegue principalmente OpenClaw, aggiungi un drop-in del servizio per ridurre
l'instabilità dei riavvii e mantenere stabile l'ambiente di avvio:

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

Se possibile, mantieni stato/cache di OpenClaw su storage basato su SSD per evitare
colli di bottiglia di I/O casuale della scheda SD durante gli avvii a freddo.

Se questo è un Pi headless, abilita una volta il lingering in modo che il servizio utente sopravviva
al logout:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Come le policy `Restart=` aiutano il recupero automatico:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Riduci l'uso della memoria

```bash
# Disabilita l'allocazione di memoria GPU (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disabilita Bluetooth se non serve
sudo systemctl disable bluetooth
```

### Monitora le risorse

```bash
# Controlla la memoria
free -h

# Controlla la temperatura della CPU
vcgencmd measure_temp

# Monitoraggio live
htop
```

---

## Note specifiche ARM

### Compatibilità dei binari

La maggior parte delle funzionalità di OpenClaw funziona su ARM64, ma alcuni binari esterni potrebbero richiedere build ARM:

| Strumento          | Stato ARM64 | Note                                  |
| ------------------ | ----------- | ------------------------------------- |
| Node.js            | ✅          | Funziona molto bene                   |
| WhatsApp (Baileys) | ✅          | JS puro, nessun problema              |
| Telegram           | ✅          | JS puro, nessun problema              |
| gog (Gmail CLI)    | ⚠️          | Verifica se esiste una release ARM    |
| Chromium (browser) | ✅          | `sudo apt install chromium-browser`   |

Se una Skill fallisce, controlla se il suo binario ha una build ARM. Molti strumenti Go/Rust sì; alcuni no.

### 32 bit vs 64 bit

**Usa sempre un OS a 64 bit.** Node.js e molti strumenti moderni lo richiedono. Controlla con:

```bash
uname -m
# Dovrebbe mostrare: aarch64 (64 bit) e non armv7l (32 bit)
```

---

## Configurazione del modello consigliata

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

**Non cercare di eseguire LLM locali su un Pi** — anche i modelli piccoli sono troppo lenti. Lascia che Claude/GPT facciano il lavoro pesante.

---

## Avvio automatico al boot

L'onboarding lo configura, ma per verificare:

```bash
# Controlla che il servizio sia abilitato
systemctl --user is-enabled openclaw-gateway.service

# Abilitalo se non lo è
systemctl --user enable openclaw-gateway.service

# Avvia all'accensione
systemctl --user start openclaw-gateway.service
```

---

## Risoluzione dei problemi

### Memoria esaurita (OOM)

```bash
# Controlla la memoria
free -h

# Aggiungi altro swap (vedi Passo 5)
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

# Correzione comune: ricompila
cd ~/openclaw  # se usi l'installazione modificabile
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problemi con binari ARM

Se una Skill fallisce con "exec format error":

1. Controlla se il binario ha una build ARM64
2. Prova a compilare dai sorgenti
3. Oppure usa un container Docker con supporto ARM

### Il WiFi cade

Per Pi headless su WiFi:

```bash
# Disabilita la gestione energetica del WiFi
sudo iwconfig wlan0 power off

# Rendilo permanente
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Confronto dei costi

| Configurazione   | Costo una tantum | Costo mensile | Note                        |
| ---------------- | ---------------- | ------------- | --------------------------- |
| **Pi 4 (2GB)**   | ~$45             | $0            | + corrente (~$5/anno)       |
| **Pi 4 (4GB)**   | ~$55             | $0            | Consigliato                 |
| **Pi 5 (4GB)**   | ~$60             | $0            | Prestazioni migliori        |
| **Pi 5 (8GB)**   | ~$80             | $0            | Eccessivo ma a prova di futuro |
| DigitalOcean     | $0               | $6/mese       | $72/anno                    |
| Hetzner          | $0               | €3.79/mese    | ~$50/anno                   |

**Punto di pareggio:** un Pi si ripaga in ~6-12 mesi rispetto a un VPS cloud.

---

## Vedi anche

- [Guida Linux](/platforms/linux) — configurazione generale Linux
- [Guida DigitalOcean](/platforms/digitalocean) — alternativa cloud
- [Guida Hetzner](/install/hetzner) — configurazione Docker
- [Tailscale](/gateway/tailscale) — accesso remoto
- [Nodi](/nodes) — associa il tuo laptop/telefono al gateway Pi
