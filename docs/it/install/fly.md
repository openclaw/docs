---
read_when:
    - Distribuzione di OpenClaw su Fly.io
    - Configurazione dei volumi Fly, dei segreti e della configurazione iniziale
summary: Distribuzione dettagliata su Fly.io per OpenClaw con archiviazione persistente e HTTPS
title: Fly.io
x-i18n:
    generated_at: "2026-07-16T14:31:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d2b5119c1df8ee077f4db4f44fa92c6ae0e2bf3c355c2117e0fd39146bb49875
    source_path: install/fly.md
    workflow: 16
---

**Obiettivo:** Gateway OpenClaw in esecuzione su una macchina [Fly.io](https://fly.io) con archiviazione persistente, HTTPS automatico e accesso a Discord/altri canali.

## Requisiti

- [CLI flyctl](https://fly.io/docs/hands-on/install-flyctl/) installata
- Account Fly.io (è sufficiente il piano gratuito)
- Autenticazione del modello: chiave API per il provider del modello scelto
- Credenziali dei canali: token del bot Discord, token Telegram, ecc.

## Procedura rapida per principianti

1. Clonare il repository e personalizzare `fly.toml`
2. Creare l'app e il volume, quindi impostare i segreti
3. Distribuire con `fly deploy`
4. Accedere tramite SSH per creare la configurazione oppure usare l'interfaccia di controllo

<Steps>
  <Step title="Creare l'app Fly">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # scegliere un nome personalizzato
    fly apps create my-openclaw

    # 1 GB è solitamente sufficiente
    fly volumes create openclaw_data --size 1 --region iad
    ```

    Scegliere una regione vicina. Opzioni comuni: `lhr` (Londra), `iad` (Virginia), `sjc` (San Jose).

  </Step>

  <Step title="Configurare fly.toml">
    Modificare `fly.toml` affinché corrisponda al nome e ai requisiti dell'app. Il file `fly.toml` incluso nel repository è il modello pubblico mostrato di seguito; `deploy/fly.private.toml` è la variante protetta senza IP pubblico (vedere [Distribuzione privata](#private-deployment-hardened)).

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

    L'entrypoint dell'immagine Docker di OpenClaw è `tini`, che esegue `node openclaw.mjs gateway` per impostazione predefinita. Il valore Fly `[processes]` sostituisce il valore Docker `CMD` (qui esegue direttamente `node dist/index.js gateway ...`, lo stesso entrypoint compilato) senza modificare `ENTRYPOINT`, pertanto il processo continua a essere eseguito con `tini`.

    **Impostazioni principali:**

    | Impostazione                        | Motivo                                                                         |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Esegue il binding su `0.0.0.0` affinché il proxy di Fly possa raggiungere il Gateway                     |
    | `--allow-unconfigured`         | Avvia senza un file di configurazione, che verrà creato successivamente                        |
    | `internal_port = 3000`         | Deve corrispondere a `--port 3000` (o `OPENCLAW_GATEWAY_PORT`) per i controlli di integrità di Fly |
    | `memory = "2048mb"`            | 512 MB sono insufficienti; sono consigliati 2 GB                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | Mantiene lo stato nel volume                                                |

  </Step>

  <Step title="Impostare i segreti">
    ```bash
    # obbligatorio: token di autenticazione del Gateway per il binding non loopback
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # chiavi API dei provider di modelli
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # facoltativo: altri provider
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # token dei canali
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    I binding non loopback (`--bind lan`) richiedono un percorso di autenticazione del Gateway valido. Questo esempio usa `OPENCLAW_GATEWAY_TOKEN`, ma anche `gateway.auth.password` o una distribuzione con proxy attendibile non loopback configurata correttamente soddisfano il requisito. Vedere [Gestione dei segreti](/it/gateway/secrets) per il contratto SecretRef.

    Trattare questi token come password. Per chiavi API e token, preferire le variabili d'ambiente/`fly secrets` al file di configurazione, in modo che i segreti non siano inclusi in `openclaw.json`.

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

    All'avvio, il Gateway registra `gateway ready` quando il listener HTTP/WebSocket è operativo. Il controllo di integrità di Fly monitora `internal_port = 3000` in base a `fly.toml`; la direttiva Docker `HEALTHCHECK` dell'immagine interroga inoltre `/healthz` sulla porta predefinita 18789, che qui non viene utilizzata perché questa distribuzione imposta il Gateway su `--port 3000`.

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

    Sostituire `https://my-openclaw.fly.dev` con l'origine reale dell'app Fly. All'avvio, il Gateway inizializza le origini locali dell'interfaccia di controllo usando i valori di runtime `--bind` e `--port`, affinché il primo avvio possa procedere prima che esista la configurazione; tuttavia, l'accesso dal browser tramite Fly richiede comunque che l'origine HTTPS esatta sia elencata in `gateway.controlUi.allowedOrigins`.

    Il token Discord può provenire da:

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

    Oppure visitare `https://my-openclaw.fly.dev/`.

    Autenticarsi con il segreto condiviso configurato: il token del Gateway proveniente da `OPENCLAW_GATEWAY_TOKEN` oppure la password, se si è passati all'autenticazione tramite password.

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

### "L'app non è in ascolto all'indirizzo previsto"

Il Gateway esegue il binding su `127.0.0.1` anziché su `0.0.0.0`.

**Correzione:** aggiungere `--bind lan` al comando del processo in `fly.toml`.

### Controlli di integrità non riusciti/connessione rifiutata

Fly non riesce a raggiungere il Gateway sulla porta configurata.

**Correzione:** assicurarsi che `internal_port` corrisponda alla porta del Gateway (`--port 3000` o `OPENCLAW_GATEWAY_PORT=3000`).

### OOM/problemi di memoria

Il container continua a riavviarsi o viene terminato. Segnali: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` o riavvii silenziosi.

**Correzione:** aumentare la memoria in `fly.toml`:

```toml
[[vm]]
  memory = "2048mb"
```

Oppure aggiornare una macchina esistente:

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512 MB sono insufficienti. 1 GB può funzionare, ma può causare un OOM sotto carico o con una registrazione dettagliata. Sono consigliati 2 GB.

### Problemi con i lock del Gateway

Dopo il riavvio di un container, il Gateway rifiuta di avviarsi con errori "già in esecuzione".

I file di lock di runtime si trovano in `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`
e `gateway.state.<hash>.lock` (Linux:
`/tmp/openclaw-<uid>/gateway.*.lock`), non nel volume persistente `/data`; pertanto,
un riavvio completo del container normalmente li elimina insieme al resto del
file system del container. Se un lock persiste (ad esempio con un `fly machine restart`
che conserva il file system del container) e blocca l'avvio, rimuoverlo
manualmente:

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### La configurazione non viene letta

`--allow-unconfigured` ignora soltanto il controllo di avvio. Non crea né ripara `/data/openclaw.json`, quindi assicurarsi che la configurazione effettiva esista e includa `"gateway": { "mode": "local" }` per il normale avvio di un Gateway locale.

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

Se dopo un riavvio si perdono i profili di autenticazione, lo stato dei canali/provider o le sessioni, la directory di stato sta scrivendo nel file system del container anziché nel volume.

**Correzione:** assicurarsi che `OPENCLAW_STATE_DIR=/data` sia impostato in `fly.toml`, quindi distribuire nuovamente.

## Aggiornamento

```bash
git pull
fly deploy
fly status
fly logs
```

`git pull` + `fly deploy` è il percorso supervisionato in questo caso: ricrea l'immagine dal Dockerfile, pertanto la versione della CLI/del Gateway, l'immagine del sistema operativo di base e tutte le modifiche al Dockerfile vengono aggiornate insieme. `openclaw update` all'interno del container in esecuzione non è la stessa operazione, poiché l'immagine viene distribuita come albero `dist/` creato tramite Docker, senza un checkout `.git` e senza un'installazione globale gestita da npm che possa essere rilevata; vedere [Aggiornamento](/it/install/updating) per tale procedura nelle installazioni di tipo VM.

### Aggiornamento del comando della macchina

Per modificare il comando di avvio senza una distribuzione completa:

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# oppure aumentando anche la memoria
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

Una successiva esecuzione di `fly deploy` reimposta il comando della macchina sul valore presente in `fly.toml`; applicare nuovamente le modifiche manuali dopo la nuova distribuzione.

## Distribuzione privata (protetta)

Per impostazione predefinita, Fly assegna IP pubblici, pertanto il Gateway è raggiungibile all'indirizzo `https://your-app.fly.dev` e individuabile dagli scanner Internet (Shodan, Censys, ecc.).

Usare `deploy/fly.private.toml` per una distribuzione protetta **senza IP pubblico**: omette `[http_service]`, pertanto non viene assegnato alcun ingresso pubblico.

### Quando usare la distribuzione privata

- Solo chiamate/messaggi in uscita (nessun Webhook in ingresso)
- I tunnel ngrok o Tailscale gestiscono gli eventuali callback dei Webhook
- L'accesso al Gateway avviene tramite SSH, proxy o WireGuard anziché tramite browser
- La distribuzione deve essere nascosta agli scanner Internet

### Configurazione

```bash
fly deploy -c deploy/fly.private.toml
```

Oppure convertire una distribuzione esistente:

```bash
# elenca gli IP attuali
fly ips list -a my-openclaw

# rilascia gli IP pubblici
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# passa alla configurazione privata affinché le distribuzioni future non riallochino IP pubblici
fly deploy -c deploy/fly.private.toml

# assegna un IPv6 esclusivamente privato
fly ips allocate-v6 --private -a my-openclaw
```

Dopo questa operazione, `fly ips list` dovrebbe mostrare solo un IP di tipo `private`:

```text
VERSIONE  IP                   TIPO             REGIONE
v6        fdaa:x:x:x:x::x      privato          globale
```

### Accesso a una distribuzione privata

**Opzione 1: proxy locale (la più semplice)**

```bash
fly proxy 3000:3000 -a my-openclaw
# aprire http://localhost:3000 in un browser
```

**Opzione 2: VPN WireGuard**

```bash
fly wireguard create
# importare in un client WireGuard, quindi accedere tramite l'IPv6 interno
# esempio: http://[fdaa:x:x:x:x::x]:3000
```

**Opzione 3: solo SSH**

```bash
fly ssh console -a my-openclaw
```

### Webhook con una distribuzione privata

Per i callback Webhook (Twilio, Telnyx, ecc.) senza esposizione pubblica:

1. **Tunnel ngrok**: eseguire ngrok nel container o come sidecar
2. **Tailscale Funnel**: esporre percorsi specifici tramite Tailscale
3. **Solo in uscita**: alcuni provider (Twilio) consentono le chiamate in uscita senza Webhook

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

Il tunnel ngrok viene eseguito nel container e fornisce un URL Webhook pubblico senza esporre l'app Fly stessa. Impostare `webhookSecurity.allowedHosts` sul nome host del tunnel affinché le intestazioni host inoltrate vengano accettate.

### Compromessi relativi alla sicurezza

| Aspetto              | Pubblica      | Privata          |
| -------------------- | ------------- | ---------------- |
| Scanner Internet     | Individuabile | Nascosta         |
| Attacchi diretti     | Possibili     | Bloccati         |
| Accesso alla UI di controllo | Browser | Proxy/VPN     |
| Recapito dei Webhook | Diretto       | Tramite tunnel    |

## Note

- Fly.io utilizza l'architettura x86; il Dockerfile è compatibile sia con x86 sia con ARM.
- Per l'onboarding di WhatsApp/Telegram, utilizzare `fly ssh console`.
- I dati persistenti risiedono nel volume in `/data`.
- Signal richiede signal-cli (una CLI basata su Java) nell'immagine; utilizzare un'immagine personalizzata e mantenere almeno 2GB di memoria.

## Costo

Con la configurazione consigliata (`shared-cpu-2x`, 2GB di RAM), il costo previsto è di circa $10-15/mese, a seconda dell'utilizzo; il piano gratuito copre parte della quota di base. Consultare i [prezzi di Fly.io](https://fly.io/docs/about/pricing/) per le tariffe attuali.

## Passaggi successivi

- Configurare i canali di messaggistica: [Canali](/it/channels)
- Configurare il Gateway: [Configurazione del Gateway](/it/gateway/configuration)
- Mantenere OpenClaw aggiornato: [Aggiornamento](/it/install/updating)

## Correlati

- [Panoramica dell'installazione](/it/install)
- [Hetzner](/it/install/hetzner)
- [Docker](/it/install/docker)
- [Hosting su VPS](/it/vps)
