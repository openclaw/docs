---
read_when:
    - Configurazione di OpenClaw su DigitalOcean
    - Alla ricerca di un hosting VPS economico per OpenClaw
summary: OpenClaw su DigitalOcean (semplice opzione VPS a pagamento)
title: DigitalOcean (piattaforma)
x-i18n:
    generated_at: "2026-04-30T09:00:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# OpenClaw su DigitalOcean

## Obiettivo

Esegui un Gateway OpenClaw persistente su DigitalOcean per **6 $/mese** (o 4 $/mese con prezzo riservato).

Se vuoi un'opzione da 0 $/mese e non ti dispiacciono ARM + configurazione specifica del provider, consulta la [guida Oracle Cloud](/it/install/oracle).

## Confronto dei costi (2026)

| Provider     | Piano           | Specifiche             | Prezzo/mese | Note                                             |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------------------ |
| Oracle Cloud | Always Free ARM | fino a 4 OCPU, 24 GB RAM | 0 $         | ARM, capacita limitata / particolarita di registrazione |
| Hetzner      | CX22            | 2 vCPU, 4 GB RAM       | 3,79 € (~4 $) | Opzione a pagamento piu economica               |
| DigitalOcean | Basic           | 1 vCPU, 1 GB RAM       | 6 $         | UI semplice, buona documentazione                |
| Vultr        | Cloud Compute   | 1 vCPU, 1 GB RAM       | 6 $         | Molte localita                                  |
| Linode       | Nanode          | 1 vCPU, 1 GB RAM       | 5 $         | Ora parte di Akamai                              |

**Scelta del provider:**

- DigitalOcean: UX piu semplice + configurazione prevedibile (questa guida)
- Hetzner: buon rapporto prezzo/prestazioni (vedi la [guida Hetzner](/it/install/hetzner))
- Oracle Cloud: puo essere 0 $/mese, ma e piu delicato e solo ARM (vedi la [guida Oracle](/it/install/oracle))

---

## Prerequisiti

- Account DigitalOcean ([registrati con 200 $ di credito gratuito](https://m.do.co/c/signup))
- Coppia di chiavi SSH (o disponibilita a usare l'autenticazione con password)
- ~20 minuti

## 1) Crea un Droplet

<Warning>
Usa un'immagine di base pulita (Ubuntu 24.04 LTS). Evita immagini 1-click di Marketplace di terze parti a meno che tu non abbia esaminato i loro script di avvio e le impostazioni predefinite del firewall.
</Warning>

1. Accedi a [DigitalOcean](https://cloud.digitalocean.com/)
2. Fai clic su **Create → Droplets**
3. Scegli:
   - **Regione:** quella piu vicina a te (o ai tuoi utenti)
   - **Immagine:** Ubuntu 24.04 LTS
   - **Dimensione:** Basic → Regular → **6 $/mese** (1 vCPU, 1 GB RAM, 25 GB SSD)
   - **Autenticazione:** chiave SSH (consigliata) o password
4. Fai clic su **Create Droplet**
5. Annota l'indirizzo IP

## 2) Connettiti via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Installa OpenClaw

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) Esegui l'onboarding

```bash
openclaw onboard --install-daemon
```

La procedura guidata ti accompagnera attraverso:

- Autenticazione del modello (chiavi API o OAuth)
- Configurazione dei canali (Telegram, WhatsApp, Discord, ecc.)
- Token del Gateway (generato automaticamente)
- Installazione del daemon (systemd)

## 5) Verifica il Gateway

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) Accedi alla dashboard

Il Gateway si associa a loopback per impostazione predefinita. Per accedere all'interfaccia di controllo:

**Opzione A: tunnel SSH (consigliato)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**Opzione B: Tailscale Serve (HTTPS, solo loopback)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Apri: `https://<magicdns>/`

Note:

- Serve mantiene il Gateway solo su loopback e autentica il traffico dell'interfaccia di controllo/WebSocket tramite gli header di identita Tailscale (l'autenticazione senza token presume un host gateway attendibile; le API HTTP non usano quegli header Tailscale e seguono invece la normale modalita di autenticazione HTTP del gateway).
- Per richiedere invece credenziali esplicite con segreto condiviso, imposta `gateway.auth.allowTailscale: false` e usa `gateway.auth.mode: "token"` o `"password"`.

**Opzione C: bind alla tailnet (senza Serve)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

Apri: `http://<tailscale-ip>:18789` (token richiesto).

## 7) Collega i tuoi canali

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

Consulta [Canali](/it/channels) per altri provider.

---

## Ottimizzazioni per 1 GB RAM

Il droplet da 6 $ ha solo 1 GB di RAM. Per mantenere il funzionamento fluido:

### Aggiungi swap (consigliato)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Usa un modello piu leggero

Se riscontri OOM, considera:

- L'uso di modelli basati su API (Claude, GPT) invece di modelli locali
- L'impostazione di `agents.defaults.model.primary` su un modello piu piccolo

### Monitora la memoria

```bash
free -h
htop
```

---

## Persistenza

Tutto lo stato risiede in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agente, stato di canali/provider e dati di sessione
- `~/.openclaw/workspace/` — workspace (SOUL.md, memoria, ecc.)

Questi dati sopravvivono ai riavvii. Esegui backup periodici:

```bash
openclaw backup create
```

---

## Alternativa gratuita Oracle Cloud

Oracle Cloud offre istanze ARM **Always Free** significativamente piu potenti di qualsiasi opzione a pagamento qui indicata, per 0 $/mese.

| Cosa ottieni        | Specifiche             |
| ------------------- | ---------------------- |
| **4 OCPU**          | ARM Ampere A1          |
| **24 GB RAM**       | Piu che sufficiente    |
| **200 GB storage**  | Volume a blocchi       |
| **Gratis per sempre** | Nessun addebito su carta di credito |

**Avvertenze:**

- La registrazione puo essere delicata (riprova se fallisce)
- Architettura ARM: la maggior parte delle cose funziona, ma alcuni binari richiedono build ARM

Per la guida completa alla configurazione, consulta [Oracle Cloud](/it/install/oracle). Per suggerimenti sulla registrazione e risoluzione dei problemi del processo di iscrizione, consulta questa [guida della community](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Risoluzione dei problemi

### Il Gateway non si avvia

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### Porta gia in uso

```bash
lsof -i :18789
kill <PID>
```

### Memoria insufficiente

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## Correlati

- [Guida Hetzner](/it/install/hetzner) — piu economica, piu potente
- [Installazione Docker](/it/install/docker) — configurazione containerizzata
- [Tailscale](/it/gateway/tailscale) — accesso remoto sicuro
- [Configurazione](/it/gateway/configuration) — riferimento completo della configurazione
