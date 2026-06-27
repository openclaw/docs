---
read_when:
    - Distribuire OpenClaw su Fly.io
    - Configurazione dei volumi Fly, dei segreti e della configurazione al primo avvio
summary: Implementazione passo passo su Fly.io per OpenClaw con archiviazione persistente e HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T17:39:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**Obiettivo:** OpenClaw Gateway in esecuzione su una macchina [Fly.io](https://fly.io) con archiviazione persistente, HTTPS automatico e accesso a Discord/canali.

## Cosa ti serve

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) installata
- Account Fly.io (il livello gratuito funziona)
- Autenticazione del modello: chiave API per il provider di modelli scelto
- Credenziali dei canali: token del bot Discord, token Telegram, ecc.

## Percorso rapido per principianti

1. Clona il repository → personalizza `fly.toml`
2. Crea app + volume → imposta i segreti
3. Distribuisci con `fly deploy`
4. Accedi via SSH per creare la configurazione o usa la Control UI

<Steps>
  <Step title="Create the Fly app">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Suggerimento:** scegli una regione vicina a te. Opzioni comuni: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configure fly.toml">
    Modifica `fly.toml` in modo che corrisponda al nome della tua app e ai tuoi requisiti.

    **Nota di sicurezza:** la configurazione predefinita espone un URL pubblico. Per una distribuzione più protetta senza IP pubblico, consulta [Distribuzione privata](#private-deployment-hardened) oppure usa `deploy/fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Your app name
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    L'immagine Docker di OpenClaw usa `tini` come entrypoint. I comandi di processo Fly sostituiscono il `CMD` Docker senza sostituire l'`ENTRYPOINT`, quindi il processo viene comunque eseguito sotto `tini`.

    **Impostazioni chiave:**

    | Impostazione                  | Motivo                                                                                 |
    | ----------------------------- | -------------------------------------------------------------------------------------- |
    | `--bind lan`                  | Associa a `0.0.0.0` così il proxy di Fly può raggiungere il gateway                    |
    | `--allow-unconfigured`        | Avvia senza un file di configurazione (lo creerai dopo)                                |
    | `internal_port = 3000`        | Deve corrispondere a `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) per gli health check Fly |
    | `memory = "2048mb"`           | 512 MB sono troppo pochi; consigliati 2 GB                                             |
    | `OPENCLAW_STATE_DIR = "/data"` | Mantiene lo stato sul volume                                                           |

  </Step>

  <Step title="Set secrets">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    **Note:**

    - I bind non-loopback (`--bind lan`) richiedono un percorso di autenticazione Gateway valido. Questo esempio Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, ma anche `gateway.auth.password` o una distribuzione non-loopback `trusted-proxy` configurata correttamente soddisfano il requisito.
    - Tratta questi token come password.
    - **Preferisci le variabili d'ambiente al file di configurazione** per tutte le chiavi API e i token. Questo mantiene i segreti fuori da `openclaw.json`, dove potrebbero essere esposti o registrati accidentalmente.

  </Step>

  <Step title="Deploy">
    ```bash
    fly deploy
    ```

    La prima distribuzione crea l'immagine Docker (~2-3 minuti). Le distribuzioni successive sono più rapide.

    Dopo la distribuzione, verifica:

    ```bash
    fly status
    fly logs
    ```

    Dovresti vedere:

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="Create config file">
    Accedi alla macchina via SSH per creare una configurazione corretta:

    ```bash
    fly ssh console
    ```

    Crea la directory e il file di configurazione:

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **Nota:** con `OPENCLAW_STATE_DIR=/data`, il percorso della configurazione è `/data/openclaw.json`.

    **Nota:** sostituisci `https://my-openclaw.fly.dev` con l'origine reale della tua app Fly. L'avvio del Gateway inizializza le origini locali della Control UI dai valori runtime `--bind` e `--port`, così il primo avvio può procedere prima che esista la configurazione, ma l'accesso dal browser tramite Fly richiede comunque l'origine HTTPS esatta elencata in `gateway.controlUi.allowedOrigins`.

    **Nota:** il token Discord può provenire da:

    - Variabile d'ambiente: `DISCORD_BOT_TOKEN` (consigliata per i segreti)
    - File di configurazione: `channels.discord.token`

    Se usi la variabile d'ambiente, non è necessario aggiungere il token alla configurazione. Il gateway legge automaticamente `DISCORD_BOT_TOKEN`.

    Riavvia per applicare:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Access the Gateway">
    ### Control UI

    Apri nel browser:

    ```bash
    fly open
    ```

    Oppure visita `https://my-openclaw.fly.dev/`

    Autenticati con il segreto condiviso configurato. Questa guida usa il token Gateway da `OPENCLAW_GATEWAY_TOKEN`; se sei passato all'autenticazione con password, usa invece quella password.

    ### Log

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Risoluzione dei problemi

### "App is not listening on expected address"

Il gateway si sta associando a `127.0.0.1` invece che a `0.0.0.0`.

**Correzione:** aggiungi `--bind lan` al comando di processo in `fly.toml`.

### Health check non riusciti / connessione rifiutata

Fly non riesce a raggiungere il gateway sulla porta configurata.

**Correzione:** assicurati che `internal_port` corrisponda alla porta del gateway (imposta `--port 3000` o `OPENCLAW_GATEWAY_PORT=3000`).

### Problemi OOM / di memoria

Il container continua a riavviarsi o viene terminato. Segnali: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` o riavvii silenziosi.

**Correzione:** aumenta la memoria in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Oppure aggiorna una macchina esistente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Nota:** 512 MB sono troppo pochi. 1 GB può funzionare, ma può andare in OOM sotto carico o con logging dettagliato. **Sono consigliati 2 GB.**

### Problemi di lock del Gateway

Il Gateway rifiuta l'avvio con errori "already running".

Questo accade quando il container si riavvia ma il file di lock PID persiste sul volume.

**Correzione:** elimina il file di lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Il file di lock si trova in `/data/gateway.*.lock` (non in una sottodirectory).

### Configurazione non letta

`--allow-unconfigured` bypassa solo la protezione di avvio. Non crea né ripara `/data/openclaw.json`, quindi assicurati che la configurazione reale esista e includa `gateway.mode="local"` quando vuoi un normale avvio del gateway locale.

Verifica che la configurazione esista:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Scrivere la configurazione tramite SSH

Il comando `fly ssh console -C` non supporta la redirezione della shell. Per scrivere un file di configurazione:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Nota:** `fly sftp` può non riuscire se il file esiste già. Eliminalo prima:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Stato non persistente

Se perdi profili di autenticazione, stato di canali/provider o sessioni dopo un riavvio, la directory di stato sta scrivendo nel filesystem del container.

**Correzione:** assicurati che `OPENCLAW_STATE_DIR=/data` sia impostato in `fly.toml` e ridistribuisci.

## Aggiornamenti

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### Aggiornare il comando della macchina

Se devi cambiare il comando di avvio senza una ridistribuzione completa:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Nota:** dopo `fly deploy`, il comando della macchina può essere reimpostato su quello presente in `fly.toml`. Se hai apportato modifiche manuali, riapplicale dopo la distribuzione.

## Distribuzione privata (protetta)

Per impostazione predefinita, Fly assegna IP pubblici, rendendo il tuo gateway accessibile su `https://your-app.fly.dev`. È comodo, ma significa che la tua distribuzione è individuabile dagli scanner Internet (Shodan, Censys, ecc.).

Per una distribuzione protetta con **nessuna esposizione pubblica**, usa il template privato.

### Quando usare la distribuzione privata

- Effettui solo chiamate/messaggi **in uscita** (nessun Webhook in ingresso)
- Usi tunnel **ngrok o Tailscale** per eventuali callback Webhook
- Accedi al gateway tramite **SSH, proxy o WireGuard** invece che dal browser
- Vuoi che la distribuzione sia **nascosta agli scanner Internet**

### Configurazione

Usa `deploy/fly.private.toml` invece della configurazione standard:

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

Oppure converti una distribuzione esistente:

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

Dopo questa operazione, `fly ips list` dovrebbe mostrare solo un IP di tipo `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Accedere a una distribuzione privata

Poiché non c'è un URL pubblico, usa uno di questi metodi:

**Opzione 1: proxy locale (la più semplice)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**Opzione 2: VPN WireGuard**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**Opzione 3: solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook con distribuzione privata

Se hai bisogno di callback webhook (Twilio, Telnyx, ecc.) senza esposizione pubblica:

1. **tunnel ngrok** - Esegui ngrok all'interno del container o come sidecar
2. **Tailscale Funnel** - Esponi percorsi specifici tramite Tailscale
3. **Solo in uscita** - Alcuni provider (Twilio) funzionano correttamente per le chiamate in uscita senza webhook

Esempio di configurazione per chiamate vocali con ngrok:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

Il tunnel ngrok viene eseguito all'interno del container e fornisce un URL webhook pubblico senza esporre l'app Fly stessa. Imposta `webhookSecurity.allowedHosts` sul nome host pubblico del tunnel affinché gli header host inoltrati vengano accettati.

### Vantaggi di sicurezza

| Aspetto           | Pubblico       | Privato    |
| ----------------- | -------------- | ---------- |
| Scanner Internet  | Individuabile  | Nascosto   |
| Attacchi diretti  | Possibili      | Bloccati   |
| Accesso Control UI | Browser       | Proxy/VPN  |
| Consegna webhook  | Diretta        | Via tunnel |

## Note

- Fly.io usa **architettura x86** (non ARM)
- Il Dockerfile è compatibile con entrambe le architetture
- Per l'onboarding di WhatsApp/Telegram, usa `fly ssh console`
- I dati persistenti risiedono nel volume in `/data`
- Signal richiede Java + signal-cli; usa un'immagine personalizzata e mantieni la memoria a 2 GB+.

## Costo

Con la configurazione consigliata (`shared-cpu-2x`, 2 GB di RAM):

- ~$10-15/mese a seconda dell'utilizzo
- Il piano gratuito include una certa disponibilità

Consulta [prezzi di Fly.io](https://fly.io/docs/about/pricing/) per i dettagli.

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Configura il Gateway: [Configurazione del Gateway](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Aggiornamento](/it/install/updating)

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Hetzner](/it/install/hetzner)
- [Docker](/it/install/docker)
- [Hosting VPS](/it/vps)
