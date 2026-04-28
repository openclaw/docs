---
read_when:
    - Distribuzione di OpenClaw su Fly.io
    - Configurazione di volumi Fly, segreti e config di prima esecuzione
summary: Deploy passo passo su Fly.io per OpenClaw con storage persistente e HTTPS
title: Fly.io
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-26T11:31:37Z"
  model: gpt-5.4
  provider: openai
  source_hash: 1fe13cb60aff6ee2159e1008d2af660b689d819d38893e9758c23e1edaf32e22
  source_path: install/fly.md
  workflow: 15
---

# Deploy su Fly.io

**Obiettivo:** Gateway OpenClaw in esecuzione su una macchina [Fly.io](https://fly.io) con storage persistente, HTTPS automatico e accesso Discord/canali.

## Cosa ti serve

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) installata
- Account Fly.io (va bene anche il livello gratuito)
- Auth del modello: chiave API per il provider di modelli scelto
- Credenziali del canale: token bot Discord, token Telegram, ecc.

## Percorso rapido per principianti

1. Clona il repo → personalizza `fly.toml`
2. Crea app + volume → imposta i segreti
3. Esegui il deploy con `fly deploy`
4. Entra via SSH per creare la config oppure usa la Control UI

<Steps>
  <Step title="Crea l'app Fly">
    ```bash
    # Clona il repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Crea una nuova app Fly (scegli un tuo nome)
    fly apps create my-openclaw

    # Crea un volume persistente (1GB di solito è sufficiente)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **Suggerimento:** scegli una regione vicina a te. Opzioni comuni: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configura fly.toml">
    Modifica `fly.toml` in modo che corrisponda al nome della tua app e ai tuoi requisiti.

    **Nota di sicurezza:** la config predefinita espone un URL pubblico. Per un deployment rinforzato senza IP pubblico, consulta [Deployment privato](#private-deployment-hardened) oppure usa `fly.private.toml`.

    ```toml
    app = "my-openclaw"  # Il nome della tua app
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

    | Impostazione                   | Motivo                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fa il bind a `0.0.0.0` così il proxy di Fly può raggiungere il gateway      |
    | `--allow-unconfigured`         | Avvia senza file di config (lo creerai dopo)                                |
    | `internal_port = 3000`         | Deve corrispondere a `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) per gli health check di Fly |
    | `memory = "2048mb"`            | 512MB sono troppo pochi; si consigliano 2GB                                 |
    | `OPENCLAW_STATE_DIR = "/data"` | Mantiene lo stato persistente sul volume                                    |

  </Step>

  <Step title="Imposta i segreti">
    ```bash
    # Obbligatorio: token del Gateway (per bind non loopback)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Chiavi API del provider di modelli
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # Facoltativo: altri provider
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Token dei canali
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **Note:**

    - I bind non loopback (`--bind lan`) richiedono un percorso auth del gateway valido. Questo esempio Fly.io usa `OPENCLAW_GATEWAY_TOKEN`, ma anche `gateway.auth.password` o un deployment `trusted-proxy` non loopback configurato correttamente soddisfano il requisito.
    - Tratta questi token come password.
    - **Preferisci le variabili d’ambiente al file di config** per tutte le chiavi API e i token. Così i segreti restano fuori da `openclaw.json`, dove potrebbero essere esposti o registrati accidentalmente.

  </Step>

  <Step title="Esegui il deploy">
    ```bash
    fly deploy
    ```

    Il primo deploy costruisce l’immagine Docker (~2-3 minuti). I deploy successivi sono più veloci.

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

  <Step title="Crea il file di config">
    Entra via SSH nella macchina per creare una config corretta:

    ```bash
    fly ssh console
    ```

    Crea la directory e il file di config:

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

    **Nota:** con `OPENCLAW_STATE_DIR=/data`, il percorso della config è `/data/openclaw.json`.

    **Nota:** sostituisci `https://my-openclaw.fly.dev` con l’origine reale
    della tua app Fly. L’avvio del Gateway inizializza le origini locali della Control UI dai valori runtime
    `--bind` e `--port`, così il primo boot può procedere prima che esista la config, ma l’accesso via browser
    tramite Fly richiede comunque che l’origine HTTPS esatta sia elencata in
    `gateway.controlUi.allowedOrigins`.

    **Nota:** il token Discord può arrivare da:

    - Variabile d’ambiente: `DISCORD_BOT_TOKEN` (consigliato per i segreti)
    - File di config: `channels.discord.token`

    Se usi la variabile d’ambiente, non serve aggiungere il token alla config. Il gateway legge automaticamente `DISCORD_BOT_TOKEN`.

    Riavvia per applicare:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Accedi al Gateway">
    ### Control UI

    Apri nel browser:

    ```bash
    fly open
    ```

    Oppure visita `https://my-openclaw.fly.dev/`

    Autenticati con il segreto condiviso configurato. Questa guida usa il token gateway
    da `OPENCLAW_GATEWAY_TOKEN`; se sei passato all’auth con password, usa invece
    quella password.

    ### Log

    ```bash
    fly logs              # Log live
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

Il gateway sta facendo il bind a `127.0.0.1` invece che a `0.0.0.0`.

**Correzione:** aggiungi `--bind lan` al comando del processo in `fly.toml`.

### Health check in errore / connection refused

Fly non riesce a raggiungere il gateway sulla porta configurata.

**Correzione:** assicurati che `internal_port` corrisponda alla porta del gateway (imposta `--port 3000` o `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemi di memoria

Il container continua a riavviarsi o a essere terminato. Segnali: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` oppure riavvii silenziosi.

**Correzione:** aumenta la memoria in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Oppure aggiorna una macchina esistente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**Nota:** 512MB sono troppo pochi. 1GB può funzionare ma può andare in OOM sotto carico o con logging verboso. **Si consigliano 2GB.**

### Problemi di lock del Gateway

Il Gateway rifiuta di avviarsi con errori del tipo "already running".

Succede quando il container si riavvia ma il file lock PID resta sul volume.

**Correzione:** elimina il file lock:

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

Il file lock si trova in `/data/gateway.*.lock` (non in una sottodirectory).

### La config non viene letta

`--allow-unconfigured` aggira solo il controllo all’avvio. Non crea né ripara `/data/openclaw.json`, quindi assicurati che la tua config reale esista e includa `gateway.mode="local"` quando vuoi un normale avvio locale del gateway.

Verifica che la config esista:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Scrivere la config via SSH

Il comando `fly ssh console -C` non supporta il reindirizzamento della shell. Per scrivere un file di config:

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

### Lo stato non resta persistente

Se perdi profili auth, stato del canale/provider o sessioni dopo un riavvio,
la directory di stato sta scrivendo nel filesystem del container.

**Correzione:** assicurati che `OPENCLAW_STATE_DIR=/data` sia impostato in `fly.toml` ed esegui di nuovo il deploy.

## Aggiornamenti

```bash
# Scarica le ultime modifiche
git pull

# Esegui di nuovo il deploy
fly deploy

# Controlla lo stato
fly status
fly logs
```

### Aggiornare il comando della macchina

Se devi cambiare il comando di avvio senza un redeploy completo:

```bash
# Ottieni l'ID della macchina
fly machines list

# Aggiorna il comando
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Oppure con aumento memoria
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**Nota:** dopo `fly deploy`, il comando della macchina può essere reimpostato a quello presente in `fly.toml`. Se hai fatto modifiche manuali, riapplicale dopo il deploy.

## Deployment privato (rinforzato)

Per impostazione predefinita, Fly assegna IP pubblici, rendendo il tuo gateway accessibile su `https://your-app.fly.dev`. È comodo, ma significa che il tuo deployment è individuabile dagli scanner Internet (Shodan, Censys, ecc.).

Per un deployment rinforzato con **nessuna esposizione pubblica**, usa il template privato.

### Quando usare un deployment privato

- Effettui solo chiamate/messaggi **in uscita** (nessun Webhook in ingresso)
- Usi tunnel **ngrok o Tailscale** per eventuali callback Webhook
- Accedi al gateway tramite **SSH, proxy o WireGuard** invece che dal browser
- Vuoi che il deployment sia **nascosto agli scanner Internet**

### Configurazione

Usa `fly.private.toml` invece della config standard:

```bash
# Esegui il deploy con config privata
fly deploy -c fly.private.toml
```

Oppure converti un deployment esistente:

```bash
# Elenca gli IP correnti
fly ips list -a my-openclaw

# Rilascia gli IP pubblici
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Passa alla config privata così i deploy futuri non riassegnano IP pubblici
# (rimuovi [http_service] oppure esegui il deploy con il template privato)
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

Poiché non c’è un URL pubblico, usa uno di questi metodi:

**Opzione 1: proxy locale (più semplice)**

```bash
# Inoltra la porta locale 3000 all'app
fly proxy 3000:3000 -a my-openclaw

# Poi apri http://localhost:3000 nel browser
```

**Opzione 2: VPN WireGuard**

```bash
# Crea la config WireGuard (una sola volta)
fly wireguard create

# Importa nel client WireGuard, poi accedi tramite IPv6 interno
# Esempio: http://[fdaa:x:x:x:x::x]:3000
```

**Opzione 3: solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook con deployment privato

Se hai bisogno di callback Webhook (Twilio, Telnyx, ecc.) senza esposizione pubblica:

1. **Tunnel ngrok** - Esegui ngrok dentro il container o come sidecar
2. **Tailscale Funnel** - Esponi percorsi specifici tramite Tailscale
3. **Solo uscita** - Alcuni provider (Twilio) funzionano bene per chiamate in uscita anche senza Webhook

Esempio di config voice-call con ngrok:

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

Il tunnel ngrok viene eseguito dentro il container e fornisce un URL Webhook pubblico senza esporre direttamente l’app Fly. Imposta `webhookSecurity.allowedHosts` sull’hostname pubblico del tunnel in modo che gli header host inoltrati vengano accettati.

### Vantaggi di sicurezza

| Aspetto            | Pubblico     | Privato    |
| ------------------ | ------------ | ---------- |
| Scanner Internet   | Individuabile | Nascosto  |
| Attacchi diretti   | Possibili    | Bloccati   |
| Accesso Control UI | Browser      | Proxy/VPN  |
| Recapito Webhook   | Diretto      | Tramite tunnel |

## Note

- Fly.io usa **architettura x86** (non ARM)
- Il Dockerfile è compatibile con entrambe le architetture
- Per l’onboarding WhatsApp/Telegram, usa `fly ssh console`
- I dati persistenti si trovano sul volume in `/data`
- Signal richiede Java + signal-cli; usa un’immagine personalizzata e mantieni la memoria a 2GB+.

## Costo

Con la config consigliata (`shared-cpu-2x`, 2GB RAM):

- ~10-15 $/mese a seconda dell’utilizzo
- Il livello gratuito include un certo margine

Consulta [Fly.io pricing](https://fly.io/docs/about/pricing/) per i dettagli.

## Passaggi successivi

- Configura i canali di messaggistica: [Channels](/it/channels)
- Configura il Gateway: [Gateway configuration](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Updating](/it/install/updating)

## Correlati

- [Panoramica dell’installazione](/it/install)
- [Hetzner](/it/install/hetzner)
- [Docker](/it/install/docker)
- [Hosting VPS](/it/vps)
