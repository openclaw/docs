---
read_when:
    - Configurare OpenClaw su un Raspberry Pi
    - Esecuzione di OpenClaw su dispositivi ARM
    - Creare un'IA personale economica sempre attiva
summary: OpenClaw su Raspberry Pi (configurazione auto-ospitata economica)
title: Raspberry Pi (piattaforma)
x-i18n:
    generated_at: "2026-04-30T09:01:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# OpenClaw su Raspberry Pi

## Obiettivo

Esegui un OpenClaw Gateway persistente, sempre attivo, su un Raspberry Pi con un costo una tantum di **~35-80 $** (senza costi mensili).

Perfetto per:

- assistente AI personale 24/7
- hub di automazione domestica
- bot Telegram/WhatsApp a basso consumo e sempre disponibile

## Requisiti hardware

| Modello Pi      | RAM     | Funziona? | Note                               |
| --------------- | ------- | --------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ Migliore | Il più veloce, consigliato         |
| **Pi 4**        | 4GB     | ✅ Buono  | Ideale per la maggior parte degli utenti |
| **Pi 4**        | 2GB     | ✅ OK     | Funziona, aggiungi swap            |
| **Pi 4**        | 1GB     | ⚠️ Limitato | Possibile con swap, configurazione minima |
| **Pi 3B+**      | 1GB     | ⚠️ Lento  | Funziona ma è poco reattivo        |
| **Pi Zero 2 W** | 512MB   | ❌        | Non consigliato                    |

**Specifiche minime:** 1GB di RAM, 1 core, 500MB di disco  
**Consigliato:** 2GB+ di RAM, sistema operativo a 64 bit, scheda SD da 16GB+ (o SSD USB)

## Cosa ti serve

- Raspberry Pi 4 o 5 (consigliati 2GB+)
- Scheda MicroSD (16GB+) o SSD USB (prestazioni migliori)
- Alimentatore (consigliato alimentatore ufficiale Pi)
- Connessione di rete (Ethernet o WiFi)
- ~30 minuti

## 1) Scrivi il sistema operativo

Usa **Raspberry Pi OS Lite (64-bit)** — non serve un desktop per un server headless.

1. Scarica [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Scegli il sistema operativo: **Raspberry Pi OS Lite (64-bit)**
3. Fai clic sull'icona a ingranaggio (⚙️) per preconfigurare:
   - Imposta hostname: `gateway-host`
   - Abilita SSH
   - Imposta nome utente/password
   - Configura WiFi (se non usi Ethernet)
4. Scrivi sulla scheda SD / unità USB
5. Inserisci e avvia il Pi

## 2) Connettiti tramite SSH

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) Configurazione del sistema

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Installa Node.js 24 (ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) Aggiungi swap (importante per 2GB o meno)

Lo swap evita arresti anomali per memoria insufficiente:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) Installa OpenClaw

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

L'installazione modificabile ti dà accesso diretto a log e codice, utile per eseguire il debug di problemi specifici di ARM.

## 7) Esegui l'onboarding

```bash
openclaw onboard --install-daemon
```

Segui la procedura guidata:

1. **Modalità Gateway:** Locale
2. **Autenticazione:** consigliate chiavi API (OAuth può essere instabile su Pi headless)
3. **Canali:** Telegram è il più semplice da cui iniziare
4. **Daemon:** Sì (systemd)

## 8) Verifica l'installazione

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) Accedi alla dashboard di OpenClaw

Sostituisci `user@gateway-host` con il nome utente del Pi e l'hostname o l'indirizzo IP.

Sul tuo computer, chiedi al Pi di stampare un URL dashboard aggiornato:

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

Poi apri l'URL della dashboard stampato nel browser locale.

Se l'interfaccia utente richiede l'autenticazione con segreto condiviso, incolla il token o la password configurati
nelle impostazioni della Control UI. Per l'autenticazione con token, usa `gateway.auth.token` (o
`OPENCLAW_GATEWAY_TOKEN`).

Per l'accesso remoto sempre attivo, consulta [Tailscale](/it/gateway/tailscale).

---

## Ottimizzazioni delle prestazioni

### Usa un SSD USB (miglioramento enorme)

Le schede SD sono lente e si usurano. Un SSD USB migliora drasticamente le prestazioni:

```bash
# Check if booting from USB
lsblk
```

Consulta la [guida all'avvio USB di Pi](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) per la configurazione.

### Velocizza l'avvio della CLI (cache di compilazione dei moduli)

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

- `NODE_COMPILE_CACHE` velocizza le esecuzioni successive (`status`, `health`, `--help`).
- `/var/tmp` sopravvive ai riavvii meglio di `/tmp`.
- `OPENCLAW_NO_RESPAWN=1` evita il costo di avvio aggiuntivo dovuto al riavvio automatico della CLI.
- La prima esecuzione riscalda la cache; le esecuzioni successive ne beneficiano di più.

### Ottimizzazione dell'avvio systemd (facoltativa)

Se questo Pi esegue principalmente OpenClaw, aggiungi un drop-in del servizio per ridurre la variabilità dei riavvii
e mantenere stabile l'ambiente di avvio:

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

Se possibile, mantieni stato/cache di OpenClaw su archiviazione basata su SSD per evitare
colli di bottiglia di I/O casuale della scheda SD durante gli avvii a freddo.

Se questo è un Pi headless, abilita una volta il lingering così il servizio utente sopravvive
alla disconnessione:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Come le policy `Restart=` aiutano il ripristino automatico:
[systemd può automatizzare il ripristino dei servizi](https://www.redhat.com/en/blog/systemd-automate-recovery).

### Riduci l'uso di memoria

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### Monitora le risorse

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## Note specifiche per ARM

### Compatibilità binaria

La maggior parte delle funzionalità di OpenClaw funziona su ARM64, ma alcuni binari esterni potrebbero richiedere build ARM:

| Strumento          | Stato ARM64 | Note                                |
| ------------------ | ----------- | ----------------------------------- |
| Node.js            | ✅          | Funziona molto bene                 |
| WhatsApp (Baileys) | ✅          | JS puro, nessun problema            |
| Telegram           | ✅          | JS puro, nessun problema            |
| gog (Gmail CLI)    | ⚠️          | Verifica la presenza di una release ARM |
| Chromium (browser) | ✅          | `sudo apt install chromium-browser` |

Se una skill fallisce, controlla se il suo binario ha una build ARM. Molti strumenti Go/Rust ce l'hanno; alcuni no.

### 32 bit vs 64 bit

**Usa sempre un sistema operativo a 64 bit.** Node.js e molti strumenti moderni lo richiedono. Controlla con:

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## Configurazione modello consigliata

Dato che il Pi è solo il Gateway (i modelli vengono eseguiti nel cloud), usa modelli basati su API:

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

**Non provare a eseguire LLM locali su un Pi** — anche i modelli piccoli sono troppo lenti. Lascia che Claude/GPT gestiscano il lavoro pesante.

---

## Avvio automatico al boot

L'onboarding lo configura, ma per verificare:

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## Risoluzione dei problemi

### Memoria insufficiente (OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### Prestazioni lente

- Usa SSD USB invece della scheda SD
- Disabilita i servizi inutilizzati: `sudo systemctl disable cups bluetooth avahi-daemon`
- Controlla il throttling della CPU: `vcgencmd get_throttled` (dovrebbe restituire `0x0`)

### Il servizio non si avvia

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### Problemi con binari ARM

Se una skill fallisce con "exec format error":

1. Controlla se il binario ha una build ARM64
2. Prova a compilare dai sorgenti
3. Oppure usa un container Docker con supporto ARM

### Interruzioni del WiFi

Per Pi headless su WiFi:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## Confronto dei costi

| Configurazione | Costo una tantum | Costo mensile | Note                      |
| -------------- | ---------------- | ------------- | ------------------------- |
| **Pi 4 (2GB)** | ~$45             | $0            | + elettricità (~$5/anno)  |
| **Pi 4 (4GB)** | ~$55             | $0            | Consigliato               |
| **Pi 5 (4GB)** | ~$60             | $0            | Prestazioni migliori      |
| **Pi 5 (8GB)** | ~$80             | $0            | Eccessivo ma pronto per il futuro |
| DigitalOcean   | $0               | $6/mese       | $72/anno                  |
| Hetzner        | $0               | €3.79/mese    | ~$50/anno                 |

**Punto di pareggio:** un Pi si ripaga in ~6-12 mesi rispetto a una VPS cloud.

---

## Correlati

- [Guida Linux](/it/platforms/linux) — configurazione Linux generale
- [Guida DigitalOcean](/it/install/digitalocean) — alternativa cloud
- [Guida Hetzner](/it/install/hetzner) — configurazione Docker
- [Tailscale](/it/gateway/tailscale) — accesso remoto
- [Nodes](/it/nodes) — abbina il tuo laptop/telefono al Gateway Pi
