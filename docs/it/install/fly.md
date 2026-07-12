---
read_when:
    - Distribuzione di OpenClaw su Fly.io
    - Configurazione dei volumi Fly, dei segreti e della configurazione al primo avvio
summary: Distribuzione dettagliata di OpenClaw su Fly.io con archiviazione persistente e HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T07:07:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**Obiettivo:** Gateway OpenClaw in esecuzione su una macchina [Fly.io](https://fly.io) con archiviazione persistente, HTTPS automatico e accesso a Discord/altri canali.

## Cosa serve

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) installata
- Account Fly.io (il piano gratuito è sufficiente)
- Autenticazione del modello: chiave API per il provider del modello scelto
- Credenziali dei canali: token del bot Discord, token Telegram, ecc.

## Percorso rapido per principianti

1. Clonare il repository e personalizzare `fly.toml`
2. Creare l'app e il volume, quindi impostare i segreti
3. Distribuire con `fly deploy`
4. Accedere tramite SSH per creare la configurazione oppure usare l'interfaccia di controllo

<Steps>
  <Step title="Creare l'app Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # scegli un nome
    fly apps create my-openclaw

    # in genere 1 GB è sufficiente
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Scegliere una regione vicina. Opzioni comuni: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configurare fly.toml">
    Modificare `fly.toml` in base al nome dell'app e ai requisiti. Il file `fly.toml` incluso nel repository è il modello pubblico mostrato di seguito; `deploy/fly.private.toml` è la variante più sicura senza IP pubblico (vedere [Distribuzione privata](#private-deployment-hardened)).

    ```toml
    app = "my-openclaw"  # nome dell'app
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

    L'entrypoint dell'immagine Docker di OpenClaw è `tini`, che per impostazione predefinita esegue `node openclaw.mjs gateway`. La sezione `[processes]` di Fly sostituisce il `CMD` Docker (qui esegue direttamente `node dist/index.js gateway ...`, lo stesso entrypoint compilato) senza modificare `ENTRYPOINT`, quindi il processo continua a essere eseguito sotto `tini`.

    **Impostazioni principali:**

    | Impostazione                    | Motivo                                                                      |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Associa il servizio a `0.0.0.0`, consentendo al proxy di Fly di raggiungere il Gateway |
    | `--allow-unconfigured`         | Avvia il servizio senza un file di configurazione, che verrà creato in seguito |
    | `internal_port = 3000`         | Deve corrispondere a `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) per i controlli di integrità di Fly |
    | `memory = "2048mb"`            | 512 MB sono insufficienti; sono consigliati 2 GB                            |
    | `OPENCLAW_STATE_DIR = "/data"` | Mantiene lo stato in modo persistente sul volume                            |

  </Step>

  <Step title="Impostare i segreti">
    ```bash
    # obbligatorio: token di autenticazione del gateway per l'associazione non loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # chiavi API dei provider di modelli
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # facoltativo: altri provider
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # token dei canali
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    Le associazioni non loopback (`--bind lan`) richiedono un percorso di autenticazione valido per il Gateway. Questo esempio usa `OPENCLAW_GATEWAY_TOKEN`, ma soddisfano il requisito anche `gateway.auth.password` o una distribuzione con proxy attendibile non loopback configurata correttamente. Consultare [Gestione dei segreti](/it/gateway/secrets) per il contratto SecretRef.

    Trattare questi token come password. Per chiavi API e token, preferire le variabili d'ambiente/`fly secrets` al file di configurazione, in modo che i segreti non vengano inseriti in `openclaw.json`.

  </Step>

  <Step title="Distribuire">
    ```bash
    fly deploy
    ```

    La prima distribuzione crea l'immagine Docker. Verificare dopo la distribuzione:

    ```bash
    fly status
    fly logs
    ```

    All'avvio, il Gateway registra `gateway ready` quando il listener HTTP/WebSocket è operativo. Il controllo di integrità di Fly monitora `internal_port = 3000` come definito in `fly.toml`; la direttiva Docker `HEALTHCHECK` dell'immagine interroga inoltre `/healthz` sulla porta predefinita 18789, che qui non viene usata perché questa distribuzione imposta il Gateway su `--port 3000`.

  </Step>

  <Step title="Creare il file di configurazione">
    Accedere alla macchina tramite SSH per creare una configurazione appropriata:

    ```bash
    fly ssh console
    ```

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

    Con `OPENCLAW_STATE_DIR=/data`, il percorso della configurazione è `/data/openclaw.json`.

    Sostituire `https://my-openclaw.fly.dev` con l'origine effettiva dell'app Fly. All'avvio, il Gateway inizializza le origini locali dell'interfaccia di controllo usando i valori di runtime `--bind` e `--port`, così il primo avvio può procedere prima che esista la configurazione; tuttavia, l'accesso dal browser tramite Fly richiede comunque che l'origine HTTPS esatta sia elencata in `gateway.controlUi.allowedOrigins`.

    Il token Discord può provenire da una delle seguenti fonti:

    - Variabile d'ambiente `DISCORD_BOT_TOKEN` (consigliata per i segreti); non è necessario aggiungerla alla configurazione, poiché il Gateway la legge automaticamente
    - File di configurazione `channels.discord.token`

    Riavviare per applicare le modifiche:

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Accedere al Gateway">
    ### Interfaccia di controllo

    ```bash
    fly open
    ```

    In alternativa, visitare `https://my-openclaw.fly.dev/`.

    Autenticarsi con il segreto condiviso configurato: il token del Gateway definito in `OPENCLAW_GATEWAY_TOKEN` oppure la password, se si è passati all'autenticazione tramite password.

    ### Log

    ```bash
    fly logs              # log in tempo reale
    fly logs --no-tail    # log recenti
    ```

    ### Console SSH

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## Risoluzione dei problemi

### "L'app non è in ascolto sull'indirizzo previsto"

Il Gateway è associato a `127.0.0.1` anziché a `0.0.0.0`.

**Soluzione:** aggiungere `--bind lan` al comando del processo in `fly.toml`.

### Controlli di integrità non riusciti / connessione rifiutata

Fly non riesce a raggiungere il Gateway sulla porta configurata.

**Soluzione:** assicurarsi che `internal_port` corrisponda alla porta del Gateway (`--port 3000` o `OPENCLAW_GATEWAY_PORT=3000`).

### OOM / problemi di memoria

Il container continua a riavviarsi o viene terminato. Segnali: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` o riavvii senza messaggi.

**Soluzione:** aumentare la memoria in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Oppure aggiornare una macchina esistente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB sono insufficienti. 1 GB può funzionare, ma può esaurire la memoria sotto carico o con una registrazione dettagliata. Sono consigliati 2 GB.

### Problemi con il blocco del Gateway

Il Gateway rifiuta di avviarsi con errori che indicano che è "già in esecuzione" dopo il riavvio di un container.

Il file di blocco dell'istanza singola si trova in `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock` (su Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`), non nel volume persistente `/data`; pertanto, un riavvio completo del container normalmente lo elimina insieme al resto del file system del container. Se il blocco persiste, ad esempio dopo un `fly machine restart` che conserva il file system del container, e impedisce l'avvio, rimuoverlo manualmente:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### La configurazione non viene letta

`--allow-unconfigured` ignora soltanto il controllo di avvio. Non crea né ripara `/data/openclaw.json`, quindi assicurarsi che la configurazione effettiva esista e includa `"gateway": { "mode": "local" }` per un normale avvio locale del Gateway.

Verificare che la configurazione esista:

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### Scrittura della configurazione tramite SSH

`fly ssh console -C` non supporta il reindirizzamento della shell. Per scrivere un file di configurazione:

```bash
# echo + tee (pipe dal sistema locale a quello remoto)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# oppure sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

`fly sftp` potrebbe non riuscire se il file esiste già; eliminarlo prima:

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### Lo stato non viene mantenuto

Se dopo un riavvio si perdono i profili di autenticazione, lo stato dei canali/provider o le sessioni, la directory di stato viene scritta nel file system del container anziché nel volume.

**Soluzione:** assicurarsi che `OPENCLAW_STATE_DIR=/data` sia impostato in `fly.toml` ed eseguire nuovamente la distribuzione.

## Aggiornamento

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` costituisce qui il percorso supervisionato: ricrea l'immagine dal Dockerfile, aggiornando insieme la versione della CLI/del Gateway, l'immagine di base del sistema operativo e tutte le modifiche al Dockerfile. L'esecuzione di `openclaw update` all'interno del container non è la stessa operazione, poiché l'immagine viene distribuita come albero `dist/` generato da Docker, senza checkout `.git` e senza un'installazione globale gestita da npm che possa rilevare; consultare [Aggiornamento](/it/install/updating) per questo flusso nelle installazioni di tipo VM.

### Aggiornamento del comando della macchina

Per modificare il comando di avvio senza eseguire una distribuzione completa:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# oppure aumentando anche la memoria
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Un successivo `fly deploy` reimposta il comando della macchina sul valore definito in `fly.toml`; applicare nuovamente le modifiche manuali dopo la nuova distribuzione.

## Distribuzione privata (con protezione avanzata)

Per impostazione predefinita, Fly assegna IP pubblici, quindi il Gateway è raggiungibile all'indirizzo `https://your-app.fly.dev` e rilevabile dagli scanner Internet (Shodan, Censys, ecc.).

Usare `deploy/fly.private.toml` per una distribuzione con protezione avanzata **senza IP pubblico**: il file omette `[http_service]`, quindi non viene allocato alcun ingresso pubblico.

### Quando usare la distribuzione privata

- Solo chiamate/messaggi in uscita (nessun Webhook in ingresso)
- I tunnel ngrok o Tailscale gestiscono eventuali callback Webhook
- L'accesso al Gateway avviene tramite SSH, proxy o WireGuard anziché da un browser
- La distribuzione deve essere nascosta agli scanner Internet

### Configurazione

```bash
fly deploy -c deploy/fly.private.toml
```

Oppure convertire una distribuzione esistente:

```bash
# elenca gli IP correnti
fly ips list -a my-openclaw

# rilascia gli IP pubblici
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# passa alla configurazione privata affinché le distribuzioni future non riassegnino IP pubblici
fly deploy -c deploy/fly.private.toml

# alloca un indirizzo IPv6 esclusivamente privato
fly ips allocate-v6 --private -a my-openclaw
```

Dopo questa operazione, `fly ips list` dovrebbe mostrare solo un indirizzo IP di tipo `private`:

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### Accesso a una distribuzione privata

**Opzione 1: proxy locale (la più semplice)**

```bash
fly proxy 3000:3000 -a my-openclaw
# apri http://localhost:3000 in un browser
```

**Opzione 2: VPN WireGuard**

```bash
fly wireguard create
# importa in un client WireGuard, quindi accedi tramite l'indirizzo IPv6 interno
# esempio: http://[fdaa:x:x:x:x::x]:3000
```

**Opzione 3: solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook con una distribuzione privata

Per le callback Webhook (Twilio, Telnyx e così via) senza esposizione pubblica:

1. **Tunnel ngrok**: esegui ngrok nel container oppure come sidecar
2. **Tailscale Funnel**: esponi percorsi specifici tramite Tailscale
3. **Solo in uscita**: alcuni provider (Twilio) consentono chiamate in uscita senza Webhook

Esempio di configurazione delle chiamate vocali con ngrok, in `plugins.entries.voice-call.config`:

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

Il tunnel ngrok viene eseguito nel container e fornisce un URL Webhook pubblico senza esporre direttamente l'app Fly. Imposta `webhookSecurity.allowedHosts` sul nome host del tunnel affinché le intestazioni host inoltrate vengano accettate.

### Compromessi relativi alla sicurezza

| Aspetto                       | Pubblica       | Privata      |
| ----------------------------- | -------------- | ------------ |
| Scanner Internet              | Individuabile  | Nascosta     |
| Attacchi diretti              | Possibili      | Bloccati     |
| Accesso all'interfaccia di controllo | Browser | Proxy/VPN |
| Recapito dei Webhook           | Diretto        | Tramite tunnel |

## Note

- Fly.io utilizza l'architettura x86; il Dockerfile è compatibile sia con x86 sia con ARM.
- Per la configurazione iniziale di WhatsApp/Telegram, utilizza `fly ssh console`.
- I dati persistenti risiedono nel volume in `/data`.
- Signal richiede signal-cli (una CLI basata su Java) nell'immagine; utilizza un'immagine personalizzata e mantieni almeno 2 GB di memoria.

## Costi

Con la configurazione consigliata (`shared-cpu-2x`, 2 GB di RAM), prevedi un costo di circa 10-15 USD al mese, a seconda dell'utilizzo; il piano gratuito copre una parte della quota di base. Consulta i [prezzi di Fly.io](https://fly.io/docs/about/pricing/) per le tariffe aggiornate.

## Passaggi successivi

- Configura i canali di messaggistica: [Canali](/it/channels)
- Configura il Gateway: [Configurazione del Gateway](/it/gateway/configuration)
- Mantieni OpenClaw aggiornato: [Aggiornamento](/it/install/updating)

## Contenuti correlati

- [Panoramica dell'installazione](/it/install)
- [Hetzner](/it/install/hetzner)
- [Docker](/it/install/docker)
- [Hosting VPS](/it/vps)
