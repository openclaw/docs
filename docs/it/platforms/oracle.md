---
read_when:
    - Configurare OpenClaw su Oracle Cloud
    - Alla ricerca di hosting VPS a basso costo per OpenClaw
    - Vuoi OpenClaw 24/7 su un piccolo server
summary: OpenClaw su Oracle Cloud (ARM Always Free)
title: Oracle Cloud (piattaforma)
x-i18n:
    generated_at: "2026-04-30T09:01:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# OpenClaw su Oracle Cloud (OCI)

## Obiettivo

Eseguire un Gateway OpenClaw persistente sul livello ARM **Always Free** di Oracle Cloud.

Il livello gratuito di Oracle può essere molto adatto per OpenClaw (soprattutto se hai già un account OCI), ma comporta alcuni compromessi:

- Architettura ARM (la maggior parte delle cose funziona, ma alcuni binari potrebbero essere solo x86)
- La capacità e la registrazione possono essere macchinose

## Confronto dei costi (2026)

| Provider     | Piano           | Specifiche             | Prezzo/mese | Note                         |
| ------------ | --------------- | ---------------------- | ----------- | ---------------------------- |
| Oracle Cloud | Always Free ARM | fino a 4 OCPU, 24GB RAM | $0          | ARM, capacità limitata       |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | ~ $4        | Opzione a pagamento più economica |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | UI semplice, buona documentazione |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | Molte località               |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | Ora parte di Akamai          |

---

## Prerequisiti

- Account Oracle Cloud ([registrazione](https://www.oracle.com/cloud/free/)) — consulta la [guida della community alla registrazione](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se incontri problemi
- Account Tailscale (gratuito su [tailscale.com](https://tailscale.com))
- ~30 minuti

## 1) Crea un'istanza OCI

1. Accedi alla [Console Oracle Cloud](https://cloud.oracle.com/)
2. Vai a **Compute → Instances → Create Instance**
3. Configura:
   - **Nome:** `openclaw`
   - **Immagine:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU:** 2 (o fino a 4)
   - **Memoria:** 12 GB (o fino a 24 GB)
   - **Volume di avvio:** 50 GB (fino a 200 GB gratuiti)
   - **Chiave SSH:** aggiungi la tua chiave pubblica
4. Fai clic su **Create**
5. Annota l'indirizzo IP pubblico

**Suggerimento:** se la creazione dell'istanza fallisce con "Out of capacity", prova un dominio di disponibilità diverso o riprova più tardi. La capacità del livello gratuito è limitata.

## 2) Connetti e aggiorna

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Nota:** `build-essential` è necessario per compilare alcune dipendenze su ARM.

## 3) Configura utente e hostname

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Installa Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Questo abilita SSH di Tailscale, così puoi connetterti con `ssh openclaw` da qualsiasi dispositivo sulla tua tailnet — senza bisogno di IP pubblico.

Verifica:

```bash
tailscale status
```

**Da ora in poi, connettiti tramite Tailscale:** `ssh ubuntu@openclaw` (oppure usa l'IP Tailscale).

## 5) Installa OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Quando richiesto "How do you want to hatch your bot?", seleziona **"Do this later"**.

> Nota: se incontri problemi di build nativa ARM, inizia dai pacchetti di sistema (ad esempio `sudo apt install -y build-essential`) prima di ricorrere a Homebrew.

## 6) Configura il Gateway (loopback + autenticazione con token) e abilita Tailscale Serve

Usa l'autenticazione con token come impostazione predefinita. È prevedibile ed evita la necessità di flag Control UI per “autenticazione non sicura”.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` qui serve solo per la gestione dell'IP inoltrato/client locale del proxy locale Tailscale Serve. **Non** è `gateway.auth.mode: "trusted-proxy"`. In questa configurazione le route del visualizzatore diff mantengono un comportamento fail-closed: le richieste raw del visualizzatore da `127.0.0.1` senza header proxy inoltrati possono restituire `Diff not found`. Usa `mode=file` / `mode=both` per gli allegati, oppure abilita intenzionalmente i visualizzatori remoti e imposta `plugins.entries.diffs.config.viewerBaseUrl` (o passa un proxy `baseUrl`) se ti servono link del visualizzatore condivisibili.

## 7) Verifica

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) Blocca la sicurezza VCN

Ora che tutto funziona, blocca la VCN per impedire tutto il traffico eccetto Tailscale. La Virtual Cloud Network di OCI agisce come un firewall al perimetro di rete: il traffico viene bloccato prima di raggiungere la tua istanza.

1. Vai a **Networking → Virtual Cloud Networks** nella Console OCI
2. Fai clic sulla tua VCN → **Security Lists** → Default Security List
3. **Rimuovi** tutte le regole di ingresso eccetto:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Mantieni le regole di uscita predefinite (consenti tutto il traffico in uscita)

Questo blocca SSH sulla porta 22, HTTP, HTTPS e tutto il resto al perimetro di rete. Da ora in poi, puoi connetterti solo tramite Tailscale.

---

## Accedi alla Control UI

Da qualsiasi dispositivo sulla tua rete Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Sostituisci `<tailnet-name>` con il nome della tua tailnet (visibile in `tailscale status`).

Non serve alcun tunnel SSH. Tailscale fornisce:

- Cifratura HTTPS (certificati automatici)
- Autenticazione tramite identità Tailscale
- Accesso da qualsiasi dispositivo sulla tua tailnet (laptop, telefono, ecc.)

---

## Sicurezza: VCN + Tailscale (baseline consigliata)

Con la VCN bloccata (solo UDP 41641 aperta) e il Gateway vincolato a loopback, ottieni una solida difesa in profondità: il traffico pubblico viene bloccato al perimetro di rete e l'accesso amministrativo avviene tramite la tua tailnet.

Questa configurazione spesso elimina la _necessità_ di regole firewall aggiuntive basate sull'host solo per fermare attacchi brute force SSH su Internet, ma dovresti comunque mantenere aggiornato il sistema operativo, eseguire `openclaw security audit` e verificare di non essere accidentalmente in ascolto su interfacce pubbliche.

### Già protetto

| Passaggio tradizionale | Necessario? | Perché                                                                       |
| ---------------------- | ----------- | ---------------------------------------------------------------------------- |
| Firewall UFW           | No          | La VCN blocca prima che il traffico raggiunga l'istanza                      |
| fail2ban               | No          | Nessun brute force se la porta 22 è bloccata nella VCN                       |
| Hardening di sshd      | No          | SSH di Tailscale non usa sshd                                                |
| Disabilitare login root | No         | Tailscale usa l'identità Tailscale, non gli utenti di sistema                |
| Autenticazione solo chiave SSH | No  | Tailscale autentica tramite la tua tailnet                                   |
| Hardening IPv6         | Di solito no | Dipende dalle impostazioni VCN/subnet; verifica cosa è realmente assegnato/esposto |

### Ancora consigliato

- **Permessi delle credenziali:** `chmod 700 ~/.openclaw`
- **Audit di sicurezza:** `openclaw security audit`
- **Aggiornamenti di sistema:** `sudo apt update && sudo apt upgrade` regolarmente
- **Monitora Tailscale:** controlla i dispositivi nella [console di amministrazione Tailscale](https://login.tailscale.com/admin)

### Verifica la postura di sicurezza

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## Ripiego: tunnel SSH

Se Tailscale Serve non funziona, usa un tunnel SSH:

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Poi apri `http://localhost:18789`.

---

## Risoluzione dei problemi

### La creazione dell'istanza fallisce ("Out of capacity")

Le istanze ARM del livello gratuito sono popolari. Prova:

- Un dominio di disponibilità diverso
- Riprova durante le ore non di punta (mattina presto)
- Usa il filtro "Always Free" quando selezioni lo shape

### Tailscale non si connette

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Il Gateway non si avvia

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Impossibile raggiungere la Control UI

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### Problemi con binari ARM

Alcuni strumenti potrebbero non avere build ARM. Controlla:

```bash
uname -m  # Should show aarch64
```

La maggior parte dei pacchetti npm funziona correttamente. Per i binari, cerca release `linux-arm64` o `aarch64`.

---

## Persistenza

Tutto lo stato si trova in:

- `~/.openclaw/` — `openclaw.json`, `auth-profiles.json` per agente, stato di canali/provider e dati di sessione
- `~/.openclaw/workspace/` — workspace (SOUL.md, memoria, artefatti)

Esegui backup periodici:

```bash
openclaw backup create
```

---

## Correlati

- [Accesso remoto al Gateway](/it/gateway/remote) — altri pattern di accesso remoto
- [Integrazione Tailscale](/it/gateway/tailscale) — documentazione completa di Tailscale
- [Configurazione del Gateway](/it/gateway/configuration) — tutte le opzioni di configurazione
- [Guida DigitalOcean](/it/install/digitalocean) — se vuoi una registrazione a pagamento e più semplice
- [Guida Hetzner](/it/install/hetzner) — alternativa basata su Docker
