---
read_when:
    - Vuoi un Gateway containerizzato anziché installazioni locali
    - Stai verificando il flusso Docker
summary: Configurazione e avvio guidato facoltativi basati su Docker per OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-30T08:57:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: c67a6351afb09961ff3b2e95a132acff7f33b02d3b67330d4608c46e3c18f63a
    source_path: install/docker.md
    workflow: 16
---

Docker è **facoltativo**. Usalo solo se vuoi un gateway containerizzato o convalidare il flusso Docker.

## Docker è adatto a me?

- **Sì**: vuoi un ambiente gateway isolato e temporaneo oppure eseguire OpenClaw su un host senza installazioni locali.
- **No**: stai eseguendo tutto sulla tua macchina e vuoi solo il loop di sviluppo più rapido. Usa invece il normale flusso di installazione.
- **Nota sul sandboxing**: il backend sandbox predefinito usa Docker quando il sandboxing è abilitato, ma il sandboxing è disattivato per impostazione predefinita e **non** richiede che l'intero gateway venga eseguito in Docker. Sono disponibili anche i backend sandbox SSH e OpenShell. Vedi [Sandboxing](/it/gateway/sandboxing).

## Prerequisiti

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la build dell'immagine (`pnpm install` potrebbe essere terminato per OOM su host con 1 GB con codice di uscita 137)
- Spazio su disco sufficiente per immagini e log
- Se esegui su un VPS/host pubblico, consulta
  [Rafforzamento della sicurezza per l'esposizione in rete](/it/gateway/security),
  in particolare la policy firewall Docker `DOCKER-USER`.

## Gateway containerizzato

<Steps>
  <Step title="Build the image">
    Dalla radice del repository, esegui lo script di configurazione:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Questo crea localmente l'immagine del Gateway. Per usare invece un'immagine precompilata:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Le immagini precompilate sono pubblicate nel
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag comuni: `main`, `latest`, `<version>` (ad esempio `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    Lo script di configurazione esegue automaticamente l'onboarding. Eseguirà queste operazioni:

    - richiede le chiavi API del provider
    - genera un token del Gateway e lo scrive in `.env`
    - avvia il Gateway tramite Docker Compose

    Durante la configurazione, l'onboarding prima dell'avvio e le scritture di configurazione passano direttamente tramite
    `openclaw-gateway`. `openclaw-cli` serve per i comandi da eseguire dopo che
    il container del Gateway esiste già.

  </Step>

  <Step title="Open the Control UI">
    Apri `http://127.0.0.1:18789/` nel browser e incolla il segreto condiviso
    configurato in Impostazioni. Per impostazione predefinita, lo script di configurazione scrive un token in `.env`;
    se cambi la configurazione del container per usare l'autenticazione tramite password, usa invece quella
    password.

    Ti serve di nuovo l'URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configure channels (optional)">
    Usa il container CLI per aggiungere canali di messaggistica:

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    Documentazione: [WhatsApp](/it/channels/whatsapp), [Telegram](/it/channels/telegram), [Discord](/it/channels/discord)

  </Step>
</Steps>

### Flusso manuale

Se preferisci eseguire ogni passaggio autonomamente invece di usare lo script di configurazione:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Esegui `docker compose` dalla radice del repository. Se hai abilitato `OPENCLAW_EXTRA_MOUNTS`
o `OPENCLAW_HOME_VOLUME`, lo script di configurazione scrive `docker-compose.extra.yml`;
includilo con `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Poiché `openclaw-cli` condivide il namespace di rete di `openclaw-gateway`, è uno
strumento post-avvio. Prima di `docker compose up -d openclaw-gateway`, esegui l'onboarding
e le scritture di configurazione in fase di setup tramite `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variabili d'ambiente

Lo script di configurazione accetta queste variabili d'ambiente facoltative:

| Variabile                                  | Scopo                                                           |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usa un'immagine remota invece di crearla localmente             |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Installa pacchetti apt extra durante la build (separati da spazi) |
| `OPENCLAW_EXTENSIONS`                      | Preinstalla le dipendenze dei plugin in fase di build (nomi separati da spazi) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount host extra (`source:target[:opts]` separati da virgole) |
| `OPENCLAW_HOME_VOLUME`                     | Mantieni `/home/node` in un volume Docker con nome              |
| `OPENCLAW_PLUGIN_STAGE_DIR`                | Percorso del container per dipendenze e mirror dei plugin integrati generati |
| `OPENCLAW_SANDBOX`                         | Abilita esplicitamente il bootstrap sandbox (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_SKIP_ONBOARDING`                 | Salta il passaggio di onboarding interattivo (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Sovrascrive il percorso del socket Docker                       |
| `OPENCLAW_DISABLE_BONJOUR`                 | Disabilita la pubblicità Bonjour/mDNS (predefinito a `1` per Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Disabilita gli overlay bind-mount del sorgente dei plugin integrati |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint collector OTLP/HTTP condiviso per l'esportazione OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP specifici per segnale per tracce, metriche o log  |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Override del protocollo OTLP. Oggi è supportato solo `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nome del servizio usato per le risorse OpenTelemetry            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Abilita esplicitamente gli attributi semantici GenAI sperimentali più recenti |
| `OPENCLAW_OTEL_PRELOADED`                  | Salta l'avvio di un secondo SDK OpenTelemetry quando uno è precaricato |

I maintainer possono testare il sorgente dei plugin integrati rispetto a un'immagine pacchettizzata montando
una directory sorgente del plugin sopra il relativo percorso sorgente pacchettizzato, ad esempio
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Quella directory sorgente montata sostituisce il bundle compilato corrispondente
`/app/dist/extensions/synology-chat` per lo stesso id plugin.

### Osservabilità

L'esportazione OpenTelemetry è in uscita dal container del Gateway verso il tuo collector
OTLP. Non richiede una porta Docker pubblicata. Se crei l'immagine
localmente e vuoi che l'exporter OpenTelemetry integrato sia disponibile dentro l'immagine,
includi le sue dipendenze runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

L'immagine di rilascio Docker ufficiale di OpenClaw include il sorgente del plugin integrato
`diagnostics-otel`. A seconda dell'immagine e dello stato della cache, il
Gateway potrebbe comunque preparare le dipendenze runtime OpenTelemetry locali al plugin
la prima volta che il plugin viene abilitato; consenti quindi a quel primo avvio di raggiungere il registro
dei pacchetti oppure preriscalda l'immagine nella tua lane di rilascio. Per abilitare l'esportazione, consenti e
abilita il plugin `diagnostics-otel` nella configurazione, quindi imposta
`diagnostics.otel.enabled=true` oppure usa l'esempio di configurazione in
[Esportazione OpenTelemetry](/it/gateway/opentelemetry). Gli header di autenticazione del collector sono
configurati tramite `diagnostics.otel.headers`, non tramite variabili d'ambiente Docker.

Le metriche Prometheus usano la porta del Gateway già pubblicata. Abilita il
plugin `diagnostics-prometheus`, quindi esegui lo scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route è protetta dall'autenticazione del Gateway. Non esporre una porta
pubblica `/metrics` separata o un percorso reverse proxy non autenticato. Vedi
[Metriche Prometheus](/it/gateway/prometheus).

### Controlli di integrità

Endpoint di probe del container (nessuna autenticazione richiesta):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L'immagine Docker include un `HEALTHCHECK` integrato che interroga `/healthz`.
Se i controlli continuano a fallire, Docker marca il container come `unhealthy` e
i sistemi di orchestrazione possono riavviarlo o sostituirlo.

Snapshot di integrità approfondito autenticato:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` imposta per impostazione predefinita `OPENCLAW_GATEWAY_BIND=lan`, quindi l'accesso dall'host a
`http://127.0.0.1:18789` funziona con la pubblicazione della porta Docker.

- `lan` (predefinito): il browser dell'host e la CLI dell'host possono raggiungere la porta del Gateway pubblicata.
- `loopback`: solo i processi dentro il namespace di rete del container possono raggiungere
  direttamente il Gateway.

<Note>
Usa i valori della modalità di bind in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), non alias host come `0.0.0.0` o `127.0.0.1`.
</Note>

### Provider locali dell'host

Quando OpenClaw viene eseguito in Docker, `127.0.0.1` dentro il container è il container
stesso, non la tua macchina host. Usa `host.docker.internal` per i provider AI che
vengono eseguiti sull'host:

| Provider  | URL host predefinito      | URL configurazione Docker          |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

La configurazione Docker integrata usa questi URL host come valori predefiniti di onboarding
per LM Studio e Ollama, e `docker-compose.yml` mappa `host.docker.internal` al
gateway host di Docker per Linux Docker Engine. Docker Desktop fornisce già
lo stesso nome host su macOS e Windows.

Anche i servizi host devono restare in ascolto su un indirizzo raggiungibile da Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se usi un tuo file Compose o comando `docker run`, aggiungi tu stesso la stessa
mappatura host, ad esempio
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

La rete bridge Docker di solito non inoltra in modo affidabile il multicast Bonjour/mDNS
(`224.0.0.251:5353`). La configurazione Compose integrata quindi imposta per impostazione predefinita
`OPENCLAW_DISABLE_BONJOUR=1`, così il Gateway non entra in un ciclo di crash o non
riavvia ripetutamente la pubblicità quando il bridge scarta il traffico multicast.

Usa l'URL del Gateway pubblicato, Tailscale o DNS-SD wide-area per gli host Docker.
Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo quando esegui con rete host, macvlan
o un'altra rete in cui è noto che il multicast mDNS funziona.

Per aspetti critici e risoluzione dei problemi, vedi [Individuazione Bonjour](/it/gateway/bonjour).

### Archiviazione e persistenza

Docker Compose monta tramite bind `OPENCLAW_CONFIG_DIR` su `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` su `/home/node/.openclaw/workspace`, quindi quei percorsi
sopravvivono alla sostituzione del container. Quando una delle due variabili non è impostata, il
`docker-compose.yml` integrato ripiega su `${HOME}/.openclaw` (e
`${HOME}/.openclaw/workspace` per il mount dell'area di lavoro), oppure su `/tmp/.openclaw`
quando anche `HOME` manca. Questo evita che `docker compose up`
emetta una specifica di volume con sorgente vuota in ambienti essenziali.

Quella directory di configurazione montata è dove OpenClaw conserva:

- `openclaw.json` per la configurazione del comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l'autenticazione OAuth/API-key dei provider archiviata
- `.env` per segreti runtime basati su env come `OPENCLAW_GATEWAY_TOKEN`

Le dipendenze runtime dei Plugin inclusi e i file runtime mirrorati sono stato generato, non configurazione utente. Compose li archivia nel volume Docker denominato `openclaw-plugin-runtime-deps` montato in `/var/lib/openclaw/plugin-runtime-deps`. Mantenere quell'albero ad alta variabilità fuori dal bind mount della configurazione host evita operazioni file lente di Docker Desktop/WSL e handle Windows obsoleti durante l'avvio a freddo del Gateway.

Il file Compose predefinito imposta `OPENCLAW_PLUGIN_STAGE_DIR` su quel percorso sia per `openclaw-gateway` sia per `openclaw-cli`, quindi `openclaw doctor --fix`, i comandi di accesso/configurazione dei canali e l'avvio del Gateway usano tutti lo stesso volume runtime generato.

Per tutti i dettagli sulla persistenza nelle distribuzioni VM, vedi
[Runtime Docker VM - Cosa persiste dove](/it/install/docker-vm-runtime#what-persists-where).

**Punti critici di crescita del disco:** monitora `media/`, i file JSONL delle sessioni, `cron/runs/*.jsonl`, il volume Docker `openclaw-plugin-runtime-deps` e i log file rotativi sotto `/tmp/openclaw/`.

### Helper shell (opzionali)

Per una gestione Docker quotidiana più semplice, installa `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se hai installato ClawDock dal vecchio percorso raw `scripts/shell-helpers/clawdock-helpers.sh`, riesegui il comando di installazione sopra in modo che il tuo file helper locale segua la nuova posizione.

Poi usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, ecc. Esegui
`clawdock-help` per tutti i comandi.
Vedi [ClawDock](/it/install/clawdock) per la guida completa agli helper.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Percorso socket personalizzato (ad es. Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Lo script monta `docker.sock` solo dopo il superamento dei prerequisiti della sandbox. Se la configurazione della sandbox non può essere completata, lo script reimposta `agents.defaults.sandbox.mode` su `off`.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Disabilita l'allocazione pseudo-TTY di Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` affinché i comandi CLI possano raggiungere il gateway tramite `127.0.0.1`. Consideralo un perimetro di fiducia condiviso. La configurazione compose rimuove `NET_RAW`/`NET_ADMIN` e abilita `no-new-privileges` su `openclaw-cli`.
  </Accordion>

  <Accordion title="Permissions and EACCES">
    L'immagine viene eseguita come `node` (uid 1000). Se vedi errori di permessi su `/home/node/.openclaw`, assicurati che i bind mount dell'host siano di proprietà dell'uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Faster rebuilds">
    Ordina il tuo Dockerfile in modo che i layer delle dipendenze vengano memorizzati nella cache. Questo evita di rieseguire `pnpm install` a meno che i lockfile non cambino:

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
    COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
    COPY ui/package.json ./ui/package.json
    COPY scripts ./scripts
    RUN pnpm install --frozen-lockfile
    COPY . .
    RUN pnpm build
    RUN pnpm ui:install
    RUN pnpm ui:build
    ENV NODE_ENV=production
    CMD ["node","dist/index.js"]
    ```

  </Accordion>

  <Accordion title="Power-user container options">
    L'immagine predefinita privilegia la sicurezza ed è eseguita come `node` non root. Per un container più completo:

    1. **Persisti `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Includi dipendenze di sistema nell'immagine**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Installa i browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persisti i download dei browser**: imposta `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` e usa `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (headless Docker)">
    Se scegli OpenAI Codex OAuth nella procedura guidata, viene aperto un URL del browser. In Docker o in configurazioni headless, copia l'intero URL di reindirizzamento a cui arrivi e incollalo di nuovo nella procedura guidata per completare l'autenticazione.
  </Accordion>

  <Accordion title="Base image metadata">
    L'immagine runtime Docker principale usa `node:24-bookworm-slim` e pubblica annotazioni OCI dell'immagine base, incluse `org.opencontainers.image.base.name`, `org.opencontainers.image.source` e altre. Il digest base Node viene aggiornato tramite PR Dependabot per l'immagine base Docker; le build di rilascio non eseguono un layer di aggiornamento della distribuzione. Vedi
    [Annotazioni immagine OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Esecuzione su un VPS?

Vedi [Hetzner (Docker VPS)](/it/install/hetzner) e
[Runtime Docker VM](/it/install/docker-vm-runtime) per i passaggi di distribuzione VM condivisa, inclusi baking dei binari, persistenza e aggiornamenti.

## Sandbox agenti

Quando `agents.defaults.sandbox` è abilitato con il backend Docker, il gateway esegue l'esecuzione degli strumenti agente (shell, lettura/scrittura file, ecc.) dentro container Docker isolati mentre il gateway stesso resta sull'host. Questo offre una barriera netta attorno a sessioni agente non attendibili o multi-tenant senza containerizzare l'intero gateway.

L'ambito della sandbox può essere per agente (predefinito), per sessione o condiviso. Ogni ambito ottiene il proprio workspace montato in `/workspace`. Puoi anche configurare criteri allow/deny per gli strumenti, isolamento di rete, limiti di risorse e container browser.

Per configurazione completa, immagini, note di sicurezza e profili multi-agente, vedi:

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo della sandbox
- [OpenShell](/it/gateway/openshell) -- accesso shell interattivo ai container sandbox
- [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) -- override per agente

### Abilitazione rapida

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

Crea l'immagine sandbox predefinita:

```bash
scripts/sandbox-setup.sh
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Image missing or sandbox container not starting">
    Crea l'immagine sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    oppure imposta `agents.defaults.sandbox.docker.image` sulla tua immagine personalizzata.
    I container vengono creati automaticamente per sessione su richiesta.
  </Accordion>

  <Accordion title="Permission errors in sandbox">
    Imposta `docker.user` su un UID:GID che corrisponda alla proprietà del workspace montato, oppure esegui chown sulla cartella del workspace.
  </Accordion>

  <Accordion title="Custom tools not found in sandbox">
    OpenClaw esegue i comandi con `sh -lc` (shell di login), che carica
    `/etc/profile` e può reimpostare PATH. Imposta `docker.env.PATH` per anteporre i percorsi dei tuoi strumenti personalizzati, oppure aggiungi uno script sotto `/etc/profile.d/` nel tuo Dockerfile.
  </Accordion>

  <Accordion title="OOM-killed during image build (exit 137)">
    La VM richiede almeno 2 GB di RAM. Usa una classe macchina più grande e riprova.
  </Accordion>

  <Accordion title="Unauthorized or pairing required in Control UI">
    Recupera un link dashboard aggiornato e approva il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Maggiori dettagli: [Dashboard](/it/web/dashboard), [Dispositivi](/it/cli/devices).

  </Accordion>

  <Accordion title="Gateway target shows ws://172.x.x.x or pairing errors from Docker CLI">
    Reimposta modalità e bind del gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica installazione](/it/install) — tutti i metodi di installazione
- [Podman](/it/install/podman) — alternativa Podman a Docker
- [ClawDock](/it/install/clawdock) — configurazione Docker Compose della community
- [Aggiornamento](/it/install/updating) — mantenere OpenClaw aggiornato
- [Configurazione](/it/gateway/configuration) — configurazione del gateway dopo l'installazione
