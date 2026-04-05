---
read_when:
    - Configurare OpenClaw su DigitalOcean
    - Cercare hosting VPS economico per OpenClaw
summary: OpenClaw su DigitalOcean (opzione VPS a pagamento semplice)
title: DigitalOcean (piattaforma)
x-i18n:
    generated_at: "2026-04-05T13:58:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ee4ad84c421f87064534a4fb433df1f70304502921841ec618318ed862d4092
    source_path: platforms/digitalocean.md
    workflow: 15
---

# OpenClaw su DigitalOcean

## Obiettivo

Eseguire un Gateway OpenClaw persistente su DigitalOcean per **6 $/mese** (o 4 $/mese con prezzi riservati).

Se vuoi un'opzione a 0 $/mese e non ti dispiacciono ARM + una configurazione specifica del provider, vedi la [guida Oracle Cloud](/platforms/oracle).

## Confronto dei costi (2026)

| Provider     | Piano           | Specifiche             | Prezzo/mese | Note                                  |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | fino a 4 OCPU, 24GB RAM | 0 $         | ARM, capacità limitata / particolarità in fase di registrazione |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3,79 (~4 $) | Opzione a pagamento più economica     |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | 6 $         | UI semplice, buona documentazione     |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | 6 $         | Molte località                        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | 5 $         | Ora parte di Akamai                   |

**Scelta di un provider:**

- DigitalOcean: UX più semplice + configurazione prevedibile (questa guida)
- Hetzner: buon rapporto prezzo/prestazioni (vedi [guida Hetzner](/install/hetzner))
- Oracle Cloud: può costare 0 $/mese, ma è più capriccioso e solo ARM (vedi [guida Oracle](/platforms/oracle))

---

## Prerequisiti

- Account DigitalOcean ([registrazione con 200 $ di credito gratuito](https://m.do.co/c/signup))
- Coppia di chiavi SSH (oppure disponibilità a usare l'autenticazione con password)
- ~20 minuti

## 1) Crea un Droplet

<Warning>
Usa un'immagine di base pulita (Ubuntu 24.04 LTS). Evita immagini Marketplace di terze parti con 1 clic a meno che tu non abbia esaminato i loro script di avvio e i valori predefiniti del firewall.
</Warning>

1. Accedi a [DigitalOcean](https://cloud.digitalocean.com/)
2. Fai clic su **Create → Droplets**
3. Scegli:
   - **Regione:** quella più vicina a te (o ai tuoi utenti)
   - **Immagine:** Ubuntu 24.04 LTS
   - **Dimensione:** Basic → Regular → **6 $/mese** (1 vCPU, 1GB RAM, 25GB SSD)
   - **Autenticazione:** chiave SSH (consigliata) o password
4. Fai clic su **Create Droplet**
5. Annota l'indirizzo IP

## 2) Connettiti via SSH

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) Installa OpenClaw

```bash
# Aggiorna il sistema
apt update && apt upgrade -y

# Installa Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Installa OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verifica
openclaw --version
```

## 4) Esegui l'onboarding

```bash
openclaw onboard --install-daemon
```

La procedura guidata ti accompagnerà in:

- autenticazione del modello (chiavi API o OAuth)
- configurazione dei canali (Telegram, WhatsApp, Discord, ecc.)
- token Gateway (generato automaticamente)
- installazione del daemon (systemd)

## 5) Verifica il Gateway

```bash
# Controlla lo stato
openclaw status

# Controlla il servizio
systemctl --user status openclaw-gateway.service

# Visualizza i log
journalctl --user -u openclaw-gateway.service -f
```

## 6) Accedi alla Dashboard

Per impostazione predefinita il gateway fa il bind su loopback. Per accedere alla Control UI:

**Opzione A: tunnel SSH (consigliata)**

```bash
# Dalla tua macchina locale
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Poi apri: http://localhost:18789
```

**Opzione B: Tailscale Serve (HTTPS, solo loopback)**

```bash
# Sul droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configura il Gateway per usare Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

Apri: `https://<magicdns>/`

Note:

- Serve mantiene il Gateway solo loopback e autentica il traffico Control UI/WebSocket tramite header di identità Tailscale (l'autenticazione senza token presuppone un host gateway fidato; le API HTTP non usano quegli header Tailscale e seguono invece la normale modalità di autenticazione HTTP del gateway).
- Se vuoi richiedere invece credenziali esplicite con segreto condiviso, imposta `gateway.auth.allowTailscale: false` e usa `gateway.auth.mode: "token"` o `"password"`.

**Opzione C: bind tailnet (senza Serve)**

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
# Scansiona il codice QR
```

Vedi [Channels](/it/channels) per altri provider.

---

## Ottimizzazioni per 1GB di RAM

Il droplet da 6 $ ha solo 1GB di RAM. Per mantenere tutto stabile:

### Aggiungi swap (consigliato)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Usa un modello più leggero

Se incontri OOM, valuta:

- usare modelli basati su API (Claude, GPT) invece di modelli locali
- impostare `agents.defaults.model.primary` su un modello più piccolo

### Monitora la memoria

```bash
free -h
htop
```

---

## Persistenza

Tutto lo stato si trova in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agente, stato di canali/provider e dati di sessione
- `~/.openclaw/workspace/` — workspace (SOUL.md, memoria, ecc.)

Questi elementi sopravvivono ai riavvii. Esegui periodicamente il backup:

```bash
openclaw backup create
```

---

## Alternativa gratuita Oracle Cloud

Oracle Cloud offre istanze ARM **Always Free** significativamente più potenti di qualsiasi opzione a pagamento qui — a 0 $/mese.

| Cosa ottieni      | Specifiche             |
| ----------------- | ---------------------- |
| **4 OCPU**        | ARM Ampere A1          |
| **24GB RAM**      | Più che sufficienti    |
| **200GB storage** | Volume a blocchi       |
| **Gratis per sempre** | Nessun addebito su carta di credito |

**Limitazioni:**

- La registrazione può essere capricciosa (riprova se fallisce)
- Architettura ARM — la maggior parte delle cose funziona, ma alcuni binari richiedono build ARM

Per la guida completa alla configurazione, vedi [Oracle Cloud](/platforms/oracle). Per suggerimenti sulla registrazione e troubleshooting del processo di iscrizione, vedi questa [guida della community](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd).

---

## Troubleshooting

### Il Gateway non si avvia

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### La porta è già in uso

```bash
lsof -i :18789
kill <PID>
```

### Memoria esaurita

```bash
# Controlla la memoria
free -h

# Aggiungi più swap
# Oppure passa a un droplet da 12 $/mese (2GB RAM)
```

---

## Vedi anche

- [guida Hetzner](/install/hetzner) — più economico, più potente
- [installazione Docker](/install/docker) — configurazione containerizzata
- [Tailscale](/gateway/tailscale) — accesso remoto sicuro
- [Configuration](/gateway/configuration) — riferimento completo della configurazione
