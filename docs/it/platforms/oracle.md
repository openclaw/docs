---
read_when:
    - Configurazione di OpenClaw su Oracle Cloud
    - Cerchi hosting VPS a basso costo per OpenClaw
    - Vuoi OpenClaw 24/7 su un piccolo server
summary: OpenClaw su Oracle Cloud (ARM Always Free)
title: Oracle Cloud (Piattaforma)
x-i18n:
    generated_at: "2026-04-05T13:59:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a42cdf2d18e964123894d382d2d8052c6b8dbb0b3c7dac914477c4a2a0a244f
    source_path: platforms/oracle.md
    workflow: 15
---

# OpenClaw su Oracle Cloud (OCI)

## Obiettivo

Eseguire un Gateway OpenClaw persistente sul livello ARM **Always Free** di Oracle Cloud.

Il livello gratuito di Oracle può essere un'ottima scelta per OpenClaw (soprattutto se hai già un account OCI), ma comporta alcuni compromessi:

- Architettura ARM (la maggior parte delle cose funziona, ma alcuni binari potrebbero essere solo x86)
- Capacità e registrazione possono essere un po' capricciose

## Confronto dei costi (2026)

| Provider     | Piano            | Specifiche             | Prezzo/mese | Note                    |
| ------------ | ---------------- | ---------------------- | ----------- | ----------------------- |
| Oracle Cloud | Always Free ARM  | fino a 4 OCPU, 24GB RAM | $0          | ARM, capacità limitata  |
| Hetzner      | CX22             | 2 vCPU, 4GB RAM        | ~ $4        | Opzione a pagamento più economica |
| DigitalOcean | Basic            | 1 vCPU, 1GB RAM        | $6          | UI semplice, buona documentazione |
| Vultr        | Cloud Compute    | 1 vCPU, 1GB RAM        | $6          | Molte località          |
| Linode       | Nanode           | 1 vCPU, 1GB RAM        | $5          | Ora parte di Akamai     |

---

## Prerequisiti

- Account Oracle Cloud ([registrazione](https://www.oracle.com/cloud/free/)) — vedi la [guida della community per la registrazione](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd) se incontri problemi
- Account Tailscale (gratuito su [tailscale.com](https://tailscale.com))
- ~30 minuti

## 1) Crea un'istanza OCI

1. Accedi alla [Oracle Cloud Console](https://cloud.oracle.com/)
2. Vai a **Compute → Instances → Create Instance**
3. Configura:
   - **Name:** `openclaw`
   - **Image:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPUs:** 2 (o fino a 4)
   - **Memory:** 12 GB (o fino a 24 GB)
   - **Boot volume:** 50 GB (fino a 200 GB gratuiti)
   - **SSH key:** aggiungi la tua chiave pubblica
4. Fai clic su **Create**
5. Annota l'indirizzo IP pubblico

**Suggerimento:** se la creazione dell'istanza fallisce con "Out of capacity", prova un diverso availability domain oppure riprova più tardi. La capacità del livello gratuito è limitata.

## 2) Connettiti e aggiorna

```bash
# Connettiti tramite IP pubblico
ssh ubuntu@YOUR_PUBLIC_IP

# Aggiorna il sistema
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**Nota:** `build-essential` è richiesto per la compilazione ARM di alcune dipendenze.

## 3) Configura utente e hostname

```bash
# Imposta l'hostname
sudo hostnamectl set-hostname openclaw

# Imposta la password per l'utente ubuntu
sudo passwd ubuntu

# Abilita lingering (mantiene i servizi utente in esecuzione dopo il logout)
sudo loginctl enable-linger ubuntu
```

## 4) Installa Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

Questo abilita Tailscale SSH, così puoi connetterti tramite `ssh openclaw` da qualsiasi dispositivo sulla tua tailnet — senza bisogno di IP pubblico.

Verifica:

```bash
tailscale status
```

**Da questo momento in poi, connettiti tramite Tailscale:** `ssh ubuntu@openclaw` (oppure usa l'IP Tailscale).

## 5) Installa OpenClaw

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

Quando viene richiesto "How do you want to hatch your bot?", seleziona **"Do this later"**.

> Nota: se incontri problemi di build nativi ARM, inizia con i pacchetti di sistema (ad esempio `sudo apt install -y build-essential`) prima di ricorrere a Homebrew.

## 6) Configura il Gateway (loopback + autenticazione token) e abilita Tailscale Serve

Usa l'autenticazione token come impostazione predefinita. È prevedibile ed evita di dover usare eventuali flag Control UI di “autenticazione non sicura”.

```bash
# Mantieni il Gateway privato sulla VM
openclaw config set gateway.bind loopback

# Richiedi autenticazione per il Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Espone tramite Tailscale Serve (HTTPS + accesso tailnet)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

`gateway.trustedProxies=["127.0.0.1"]` qui serve solo per la gestione dell'IP inoltrato/client locale del proxy locale Tailscale Serve. **Non** corrisponde a `gateway.auth.mode: "trusted-proxy"`. In questa configurazione, i percorsi del visualizzatore diff mantengono un comportamento fail-closed: richieste raw del visualizzatore da `127.0.0.1` senza header proxy inoltrati possono restituire `Diff not found`. Usa `mode=file` / `mode=both` per gli allegati, oppure abilita intenzionalmente i visualizzatori remoti e imposta `plugins.entries.diffs.config.viewerBaseUrl` (o passa un proxy `baseUrl`) se ti servono link del visualizzatore condivisibili.

## 7) Verifica

```bash
# Controlla la versione
openclaw --version

# Controlla lo stato del daemon
systemctl --user status openclaw-gateway.service

# Controlla Tailscale Serve
tailscale serve status

# Testa la risposta locale
curl http://localhost:18789
```

## 8) Metti in sicurezza il VCN

Ora che tutto funziona, metti in sicurezza il VCN per bloccare tutto il traffico tranne Tailscale. La Virtual Cloud Network di OCI funge da firewall al margine della rete: il traffico viene bloccato prima di raggiungere la tua istanza.

1. Vai a **Networking → Virtual Cloud Networks** nella OCI Console
2. Fai clic sul tuo VCN → **Security Lists** → Default Security List
3. **Rimuovi** tutte le regole in ingresso tranne:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. Mantieni le regole predefinite in uscita (consenti tutto il traffico in uscita)

Questo blocca SSH sulla porta 22, HTTP, HTTPS e qualsiasi altra cosa al margine della rete. Da questo momento in poi, puoi connetterti solo tramite Tailscale.

---

## Accesso alla Control UI

Da qualsiasi dispositivo sulla tua rete Tailscale:

```
https://openclaw.<tailnet-name>.ts.net/
```

Sostituisci `<tailnet-name>` con il nome della tua tailnet (visibile in `tailscale status`).

Non serve alcun tunnel SSH. Tailscale fornisce:

- Cifratura HTTPS (certificati automatici)
- Autenticazione tramite identità Tailscale
- Accesso da qualsiasi dispositivo della tua tailnet (laptop, telefono, ecc.)

---

## Sicurezza: VCN + Tailscale (baseline consigliata)

Con il VCN messo in sicurezza (solo UDP 41641 aperto) e il Gateway associato a loopback, ottieni una solida difesa a più livelli: il traffico pubblico viene bloccato al margine della rete e l'accesso amministrativo avviene tramite la tua tailnet.

Questa configurazione spesso elimina la _necessità_ di regole firewall aggiuntive basate sull'host solo per fermare i tentativi di forza bruta SSH provenienti da Internet — ma dovresti comunque mantenere aggiornato il sistema operativo, eseguire `openclaw security audit` e verificare di non essere accidentalmente in ascolto su interfacce pubbliche.

### Già protetto

| Passaggio tradizionale | Necessario?   | Perché                                                                       |
| ---------------------- | ------------- | ---------------------------------------------------------------------------- |
| Firewall UFW           | No            | Il VCN blocca prima che il traffico raggiunga l'istanza                     |
| fail2ban               | No            | Nessuna forza bruta se la porta 22 è bloccata a livello VCN                 |
| Hardening sshd         | No            | Tailscale SSH non usa sshd                                                  |
| Disabilitare login root | No           | Tailscale usa l'identità Tailscale, non gli utenti di sistema               |
| Autenticazione SSH solo con chiave | No | Tailscale autentica tramite la tua tailnet                                  |
| Hardening IPv6         | Di solito no  | Dipende dalle impostazioni VCN/subnet; verifica cosa è effettivamente assegnato/esposto |

### Ancora consigliato

- **Permessi delle credenziali:** `chmod 700 ~/.openclaw`
- **Audit di sicurezza:** `openclaw security audit`
- **Aggiornamenti di sistema:** `sudo apt update && sudo apt upgrade` regolarmente
- **Monitorare Tailscale:** rivedi i dispositivi nella [console amministrativa Tailscale](https://login.tailscale.com/admin)

### Verifica della postura di sicurezza

```bash
# Conferma che non ci siano porte pubbliche in ascolto
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verifica che Tailscale SSH sia attivo
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Facoltativo: disabilita completamente sshd
sudo systemctl disable --now ssh
```

---

## Fallback: tunnel SSH

Se Tailscale Serve non funziona, usa un tunnel SSH:

```bash
# Dalla tua macchina locale (tramite Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

Poi apri `http://localhost:18789`.

---

## Risoluzione dei problemi

### La creazione dell'istanza fallisce ("Out of capacity")

Le istanze ARM del livello gratuito sono molto richieste. Prova:

- Un availability domain diverso
- Riprova nelle ore di minore utilizzo (la mattina presto)
- Usa il filtro "Always Free" quando selezioni lo shape

### Tailscale non si connette

```bash
# Controlla lo stato
sudo tailscale status

# Riautenticati
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
# Verifica che Tailscale Serve sia in esecuzione
tailscale serve status

# Controlla che il gateway sia in ascolto
curl http://localhost:18789

# Riavvia se necessario
systemctl --user restart openclaw-gateway.service
```

### Problemi con binari ARM

Alcuni strumenti potrebbero non avere build ARM. Controlla:

```bash
uname -m  # Dovrebbe mostrare aarch64
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

## Vedi anche

- [Accesso remoto al Gateway](/gateway/remote) — altri modelli di accesso remoto
- [Integrazione Tailscale](/gateway/tailscale) — documentazione completa di Tailscale
- [Configurazione del Gateway](/gateway/configuration) — tutte le opzioni di configurazione
- [Guida DigitalOcean](/platforms/digitalocean) — se vuoi una soluzione a pagamento con registrazione più semplice
- [Guida Hetzner](/install/hetzner) — alternativa basata su Docker
