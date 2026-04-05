---
read_when:
    - Deployment di OpenClaw su Fly.io
    - Configurazione di volumi Fly, secret e configurazione al primo avvio
summary: Deployment passo dopo passo su Fly.io per OpenClaw con storage persistente e HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-04-05T13:55:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5f8c2c03295d786c0d8df98f8a5ae9335fa0346a188b81aae3e07d566a2c0ef
    source_path: install/fly.md
    workflow: 15
---

# Deployment Fly.io

**Obiettivo:** Gateway OpenClaw in esecuzione su una macchina [Fly.io](https://fly.io) con storage persistente, HTTPS automatico e accesso Discord/canali.

## Cosa ti serve

- [CLI `flyctl`](https://fly.io/docs/hands-on/install-flyctl/) installata
- Account Fly.io (il piano gratuito va bene)
- Autenticazione modello: API key per il provider di modelli scelto
- Credenziali canale: token bot Discord, token Telegram, ecc.

## Percorso rapido per principianti

1. Clona il repo → personalizza `fly.toml`
2. Crea app + volume → imposta i secret
3. Esegui il deployment con `fly deploy`
4. Accedi via SSH per creare la configurazione oppure usa la UI di controllo

<Steps>
  <Step title="Crea l'app Fly">
    ```bash
    # Clona il repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Crea una nuova app Fly (scegli il tuo nome)
    fly apps create my-openclaw

    # Crea un volume persistente (1GB di solito è sufficiente)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Suggerimento:** scegli una regione vicina a te. Opzioni comuni: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configura fly.toml">
    Modifica `fly.toml` in modo che corrisponda al nome della tua app e ai tuoi requisiti.

    **Nota di sicurezza:** la configurazione predefinita espone un URL pubblico. Per un deployment con hardening senza IP pubblico, vedi [Deployment privato](#private-deployment-hardened) oppure usa `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Nome della tua app
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

    **Impostazioni chiave:**

    | Impostazione                  | Motivo                                                                      |
    | ----------------------------- | --------------------------------------------------------------------------- |
    | `--bind lan`                  | Effettua il bind a `0.0.0.0` così il proxy di Fly può raggiungere il gateway |
    | `--allow-unconfigured`        | Avvia senza un file di configurazione (lo creerai dopo)                     |
    | `internal_port = 3000`        | Deve corrispondere a `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) per gli health check di Fly |
    | `memory = "2048mb"`           | 512MB sono troppo pochi; 2GB consigliati                                    |
    | `OPENCLAW_STATE_DIR = "/data"`| Mantiene lo stato sul volume                                                |

  </Step>

  <Step title="Imposta i secret">
    ```bash
    # Obbligatorio: token del Gateway (per bind non loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # API key provider di modelli
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Facoltativo: altri provider
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Token canali
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Note:**

    - I bind non loopback (`--bind lan`) richiedono un percorso di autenticazione gateway valido. Questo esempio Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, ma anche `gateway.auth.password` o un deployment `trusted-proxy` non loopback configurato correttamente soddisfano il requisito.
    - Tratta questi token come password.
    - **Preferisci le env var al file di configurazione** per tutte le API key e i token. In questo modo i secret restano fuori da `openclaw.json`, dove potrebbero essere esposti o registrati accidentalmente nei log.

  </Step>

  <Step title="Esegui il deployment">
    ```bash
    fly deploy
    ```

    Il primo deployment costruisce l'immagine Docker (~2-3 minuti). I deployment successivi sono più rapidi.

    Dopo il deployment, verifica:

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

  <Step title="Crea il file di configurazione">
    Accedi via SSH alla macchina per creare una configurazione corretta:

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
        "bind": "auto"
      },
      "meta": {}
    }
    EOF
    ```

    **Nota:** con `OPENCLAW_STATE_DIR=/data`, il percorso della configurazione è `/data/openclaw.json`.

    **Nota:** il token Discord può provenire da:

    - Variabile d'ambiente: `DISCORD_BOT_TOKEN` (consigliato per i secret)
    - File di configurazione: `channels.discord.token`

    Se usi la env var, non serve aggiungere il token alla configurazione. Il gateway legge automaticamente `DISCORD_BOT_TOKEN`.

    Riavvia per applicare:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Accedi al Gateway">
    ### UI di controllo

    Apri nel browser:

    ```bash
    fly open
    ```

    Oppure visita `https://my-openclaw.fly.dev/`

    Autenticati con il segreto condiviso configurato. Questa guida usa il token gateway
    da `OPENCLAW_GATEWAY_TOKEN`; se sei passato all'autenticazione con password, usa
    invece quella password.

    ### Log

    ```bash
    fly logs              # Log in tempo reale
    fly logs --no-tail    # Log recenti
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Risoluzione dei problemi

### "App is not listening on expected address"

Il gateway sta facendo bind a `127.0.0.1` invece che a `0.0.0.0`.

**Correzione:** aggiungi `--bind lan` al comando del processo nel tuo `fly.toml`.

### Health check che falliscono / connessione rifiutata

Fly non riesce a raggiungere il gateway sulla porta configurata.

**Correzione:** assicurati che `internal_port` corrisponda alla porta del gateway (imposta `--port 3000` o `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemi di memoria

Il container continua a riavviarsi o viene terminato. Segnali: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` oppure riavvii silenziosi.

**Correzione:** aumenta la memoria in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Oppure aggiorna una macchina esistente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Nota:** 512MB sono troppo pochi. 1GB può funzionare ma può andare in OOM sotto carico o con logging verboso. **2GB sono consigliati.**

### Problemi di lock del Gateway

Il Gateway rifiuta di avviarsi con errori del tipo "already running".

Questo succede quando il container si riavvia ma il file lock PID resta sul volume.

**Correzione:** elimina il file lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Il file lock si trova in `/data/gateway.*.lock` (non in una sottodirectory).

### La configurazione non viene letta

`--allow-unconfigured` aggira solo il controllo all'avvio. Non crea né ripara `/data/openclaw.json`, quindi assicurati che la tua configurazione reale esista e includa `gateway.mode="local"` quando vuoi un normale avvio locale del gateway.

Verifica che la configurazione esista:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Scrittura della configurazione via SSH

Il comando `fly ssh console -C` non supporta la redirezione della shell. Per scrivere un file di configurazione:

```bash
# Usa echo + tee (pipe dal locale al remoto)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Oppure usa sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**Nota:** `fly sftp` può fallire se il file esiste già. Eliminalo prima:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Lo stato non persiste

Se perdi profili auth, stato del canale/provider o sessioni dopo un riavvio,
la directory di stato sta scrivendo nel filesystem del container.

**Correzione:** assicurati che `OPENCLAW_STATE_DIR=/data` sia impostato in `fly.toml` e ridistribuisci.

## Aggiornamenti

```bash
# Recupera le modifiche più recenti
git pull

# Esegui di nuovo il deployment
fly deploy

# Controlla lo stato di salute
fly status
fly logs
```

### Aggiornamento del comando della macchina

Se devi cambiare il comando di avvio senza un nuovo deployment completo:

```bash
# Ottieni l'ID della macchina
fly machines list

# Aggiorna il comando
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Oppure con aumento della memoria
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Nota:** dopo `fly deploy`, il comando della macchina può tornare a quello in `fly.toml`. Se hai apportato modifiche manuali, riapplicale dopo il deployment.

## Deployment privato (con hardening)

Per impostazione predefinita, Fly alloca IP pubblici, rendendo il tuo gateway accessibile su `https://your-app.fly.dev`. È pratico, ma significa che il tuo deployment è rilevabile dagli scanner internet (Shodan, Censys, ecc.).

Per un deployment con hardening **senza esposizione pubblica**, usa il template privato.

### Quando usare il deployment privato

- Fai solo chiamate/messaggi **in uscita** (nessun webhook in ingresso)
- Usi tunnel **ngrok o Tailscale** per eventuali callback webhook
- Accedi al gateway tramite **SSH, proxy o WireGuard** invece che dal browser
- Vuoi che il deployment sia **nascosto agli scanner internet**

### Configurazione

Usa `fly.private.toml` invece della configurazione standard:

```bash
# Deployment con configurazione privata
fly deploy -c fly.private.toml
```

Oppure converti un deployment esistente:

```bash
# Elenca gli IP attuali
fly ips list -a my-openclaw

# Rilascia gli IP pubblici
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Passa alla configurazione privata così i deployment futuri non riallochino IP pubblici
# (rimuovi [http_service] oppure esegui il deployment con il template privato)
fly deploy -c fly.private.toml

# Alloca IPv6 solo privato
fly ips allocate-v6 --private -a my-openclaw
```

Dopo questo, `fly ips list` dovrebbe mostrare solo un IP di tipo `private`:

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Accesso a un deployment privato

Poiché non esiste un URL pubblico, usa uno di questi metodi:

**Opzione 1: proxy locale (più semplice)**

```bash
# Inoltra la porta locale 3000 all'app
fly proxy 3000:3000 -a my-openclaw

# Poi apri http://localhost:3000 nel browser
```

**Opzione 2: VPN WireGuard**

```bash
# Crea la configurazione WireGuard (una sola volta)
fly wireguard create

# Importa nel client WireGuard, poi accedi tramite IPv6 interno
# Esempio: http://[fdaa:x:x:x:x::x]:3000
```

**Opzione 3: solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook con deployment privato

Se hai bisogno di callback webhook (Twilio, Telnyx, ecc.) senza esposizione pubblica:

1. **Tunnel ngrok** - Esegui ngrok dentro il container o come sidecar
2. **Tailscale Funnel** - Esponi percorsi specifici tramite Tailscale
3. **Solo uscita** - Alcuni provider (Twilio) funzionano bene per chiamate in uscita anche senza webhook

Esempio di configurazione voice-call con ngrok:

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

Il tunnel ngrok viene eseguito dentro il container e fornisce un URL webhook pubblico senza esporre l'app Fly stessa. Imposta `webhookSecurity.allowedHosts` sull'hostname pubblico del tunnel, in modo che gli header host inoltrati vengano accettati.

### Vantaggi di sicurezza

| Aspetto           | Pubblico     | Privato    |
| ----------------- | ------------ | ---------- |
| Scanner internet  | Rilevabile   | Nascosto   |
| Attacchi diretti  | Possibili    | Bloccati   |
| Accesso UI di controllo | Browser | Proxy/VPN  |
| Consegna webhook  | Diretta      | Tramite tunnel |

## Note

- Fly.io usa architettura **x86** (non ARM)
- Il Dockerfile è compatibile con entrambe le architetture
- Per l'onboarding di WhatsApp/Telegram, usa `fly ssh console`
- I dati persistenti si trovano sul volume in `/data`
- Signal richiede Java + signal-cli; usa un'immagine personalizzata e mantieni la memoria a 2GB+.

## Costo

Con la configurazione consigliata (`shared-cpu-2x`, 2GB RAM):

- ~\$10-15/mese a seconda dell'utilizzo
- Il piano gratuito include una certa quota

Vedi [prezzi Fly.io](https://fly.io/docs/about/pricing/) per i dettagli.

## Passi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Configura il Gateway: [Configurazione del Gateway](/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Aggiornamento](/install/updating)
