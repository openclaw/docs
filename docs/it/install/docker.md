---
read_when:
    - Vuoi un gateway containerizzato invece di installazioni locali
    - Stai convalidando il flusso Docker
summary: Configurazione e onboarding opzionali basati su Docker per OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-28T20:43:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f28b60449da7e4194fa32cc4681a0d276612b91e68af30a81dfab0dc89e02d1f
    source_path: install/docker.md
    workflow: 16
---

Docker è **opzionale**. Usalo solo se vuoi un Gateway containerizzato o per validare il flusso Docker.

## Docker fa al caso mio?

- **Sì**: vuoi un ambiente Gateway isolato e temporaneo oppure eseguire OpenClaw su un host senza installazioni locali.
- **No**: stai lavorando sulla tua macchina e vuoi solo il ciclo di sviluppo più rapido. Usa invece il normale flusso di installazione.
- **Nota sul sandboxing**: il backend di sandboxing predefinito usa Docker quando il sandboxing è abilitato, ma il sandboxing è disattivato per impostazione predefinita e **non** richiede che l'intero Gateway venga eseguito in Docker. Sono disponibili anche i backend di sandboxing SSH e OpenShell. Vedi [Sandboxing](/it/gateway/sandboxing).

## Prerequisiti

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la compilazione dell'immagine (`pnpm install` può essere terminato per OOM su host da 1 GB con uscita 137)
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

    Questo compila l'immagine Gateway localmente. Per usare invece un'immagine precompilata:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Le immagini precompilate vengono pubblicate prima nel
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    GHCR è il registro principale per l'automazione dei rilasci, i deployment
    fissati a una versione e i controlli di provenienza. Lo stesso workflow di rilascio pubblica anche un mirror ufficiale
    Docker Hub in `openclaw/openclaw` per gli host che preferiscono Docker Hub:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Usa `ghcr.io/openclaw/openclaw` o `openclaw/openclaw`. Evita i mirror
    Docker Hub della community perché OpenClaw non ne controlla le tempistiche di rilascio,
    le ricompilazioni o la policy di conservazione. Tag ufficiali comuni: `main`, `latest`,
    `<version>` (ad es. `2026.2.26`) e versioni beta come
    `2026.2.26-beta.1`. I tag beta non spostano `latest` o `main`.

  </Step>

  <Step title="Airgapped rerun">
    Sugli host offline, trasferisci e carica prima l'immagine:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica che `OPENCLAW_IMAGE` esista già localmente, disabilita
    pull e build impliciti di Compose, quindi esegue il normale flusso di configurazione come
    sincronizzazione di `.env`, correzioni dei permessi, configurazione iniziale, sincronizzazione della configurazione del Gateway
    e avvio di Compose.

    Se `OPENCLAW_SANDBOX=1`, la configurazione offline controlla anche le immagini sandbox predefinite configurate
    e quelle attive per agente nel daemon dietro
    `OPENCLAW_DOCKER_SOCKET`. Anche le immagini browser basate su Docker devono avere
    l'etichetta del contratto browser OpenClaw corrente. Quando un'immagine richiesta manca o
    è incompatibile, la configurazione termina senza modificare la configurazione sandbox invece di
    segnalare successo con una sandbox inutilizzabile.

  </Step>

  <Step title="Complete onboarding">
    Lo script di configurazione esegue automaticamente la configurazione iniziale. Eseguirà:

    - richiedere le chiavi API del provider
    - generare un token Gateway e scriverlo in `.env`
    - creare la directory della chiave segreta del profilo di autenticazione
    - avviare il Gateway tramite Docker Compose

    Durante la configurazione, la configurazione iniziale pre-avvio e le scritture di configurazione passano
    direttamente tramite `openclaw-gateway`. `openclaw-cli` è per i comandi che esegui dopo
    che il container Gateway esiste già.

  </Step>

  <Step title="Open the Control UI">
    Apri `http://127.0.0.1:18789/` nel browser e incolla il segreto condiviso
    configurato in Impostazioni. Per impostazione predefinita, lo script di configurazione scrive un token in `.env`;
    se cambi la configurazione del container per usare l'autenticazione con password, usa invece quella
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

Se preferisci eseguire ogni passaggio personalmente invece di usare lo script di configurazione:

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
includilo dopo qualsiasi file di override standard, ad esempio
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
quando entrambi i file di override esistono.
</Note>

<Note>
Poiché `openclaw-cli` condivide lo spazio dei nomi di rete di `openclaw-gateway`, è uno
strumento post-avvio. Prima di `docker compose up -d openclaw-gateway`, esegui la configurazione iniziale
e le scritture di configurazione in fase di setup tramite `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variabili d'ambiente

Lo script di configurazione accetta queste variabili d'ambiente opzionali:

| Variabile                                  | Scopo                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usa un'immagine remota invece di compilarla localmente                |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Installa pacchetti apt aggiuntivi durante la build (separati da spazi) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Installa pacchetti Python aggiuntivi durante la build (separati da spazi) |
| `OPENCLAW_EXTENSIONS`                      | Preinstalla le dipendenze dei Plugin in fase di build (nomi separati da spazi) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Mount bind host aggiuntivi (`source:target[:opts]` separati da virgole) |
| `OPENCLAW_HOME_VOLUME`                     | Mantieni `/home/node` in un volume Docker con nome                    |
| `OPENCLAW_SANDBOX`                         | Abilita il bootstrap della sandbox (`1`, `true`, `yes`, `on`)         |
| `OPENCLAW_SKIP_ONBOARDING`                 | Salta il passaggio interattivo di configurazione iniziale (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Sovrascrive il percorso del socket Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Disabilita la pubblicità Bonjour/mDNS (predefinito a `1` per Docker)  |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Disabilita gli overlay bind-mount dei sorgenti dei Plugin inclusi     |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint collector OTLP/HTTP condiviso per l'esportazione OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP specifici del segnale per tracce, metriche o log        |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Override del protocollo OTLP. Oggi è supportato solo `http/protobuf`  |
| `OTEL_SERVICE_NAME`                        | Nome del servizio usato per le risorse OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Abilita gli attributi semantici GenAI sperimentali più recenti        |
| `OPENCLAW_OTEL_PRELOADED`                  | Salta l'avvio di un secondo SDK OpenTelemetry quando uno è pre-caricato |

L'immagine Docker ufficiale non include Homebrew. Durante la configurazione iniziale, OpenClaw
nasconde gli installer di dipendenze skill solo brew quando è in esecuzione in un container
Linux senza `brew`; queste dipendenze devono essere fornite da un'immagine personalizzata
o installate manualmente. Per le dipendenze disponibili dai pacchetti Debian, usa
`OPENCLAW_IMAGE_APT_PACKAGES` durante la build dell'immagine. Il nome legacy
`OPENCLAW_DOCKER_APT_PACKAGES` è ancora accettato.
Per le dipendenze Python, usa `OPENCLAW_IMAGE_PIP_PACKAGES`. Questo esegue
`python3 -m pip install --break-system-packages` durante la build dell'immagine, quindi blocca
le versioni dei pacchetti e usa solo indici di pacchetti di cui ti fidi.

I maintainer possono testare il sorgente dei Plugin inclusi rispetto a un'immagine pacchettizzata montando
una directory sorgente di Plugin sopra il relativo percorso sorgente pacchettizzato, ad esempio
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Quella directory sorgente montata sostituisce il bundle compilato corrispondente
`/app/dist/extensions/synology-chat` per lo stesso id Plugin.

### Osservabilità

L'esportazione OpenTelemetry è in uscita dal container Gateway verso il tuo collector OTLP.
Non richiede una porta Docker pubblicata. Se compili l'immagine
localmente e vuoi che l'exporter OpenTelemetry incluso sia disponibile dentro l'immagine,
includi le sue dipendenze runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installa il Plugin ufficiale `@openclaw/diagnostics-otel` da ClawHub nelle
installazioni Docker pacchettizzate prima di abilitare l'esportazione. Le immagini personalizzate compilate da sorgente possono
ancora includere il sorgente del Plugin locale con
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Per abilitare l'esportazione, consenti e abilita il
Plugin `diagnostics-otel` nella configurazione, quindi imposta
`diagnostics.otel.enabled=true` o usa l'esempio di configurazione in [Esportazione
OpenTelemetry](/it/gateway/opentelemetry). Gli header di autenticazione del collector sono configurati tramite
`diagnostics.otel.headers`, non tramite variabili d'ambiente Docker.

Le metriche Prometheus usano la porta Gateway già pubblicata. Installa
`clawhub:@openclaw/diagnostics-prometheus`, abilita il
Plugin `diagnostics-prometheus`, quindi esegui lo scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route è protetta dall'autenticazione Gateway. Non esporre una porta
pubblica `/metrics` separata né un percorso reverse-proxy non autenticato. Vedi
[Metriche Prometheus](/it/gateway/prometheus).

### Controlli di integrità

Endpoint probe del container (nessuna autenticazione richiesta):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L'immagine Docker include un `HEALTHCHECK` integrato che esegue il ping di `/healthz`.
Se i controlli continuano a fallire, Docker contrassegna il container come `unhealthy` e
i sistemi di orchestrazione possono riavviarlo o sostituirlo.

Snapshot approfondito dell'integrità autenticato:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` imposta per impostazione predefinita `OPENCLAW_GATEWAY_BIND=lan`, così l'accesso dall'host a
`http://127.0.0.1:18789` funziona con la pubblicazione delle porte Docker.

- `lan` (predefinito): il browser dell'host e la CLI dell'host possono raggiungere la porta Gateway pubblicata.
- `loopback`: solo i processi dentro lo spazio dei nomi di rete del container possono raggiungere
  direttamente il Gateway.

<Note>
Usa i valori della modalità di bind in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), non alias host come `0.0.0.0` o `127.0.0.1`.
</Note>

### Provider locali dell'host

Quando OpenClaw viene eseguito in Docker, `127.0.0.1` dentro il container è il container
stesso, non la tua macchina host. Usa `host.docker.internal` per i provider AI che
girano sull'host:

| Provider  | URL predefinito dell'host | URL di configurazione Docker        |
| --------- | ------------------------- | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`   | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434`  | `http://host.docker.internal:11434` |

La configurazione Docker inclusa usa questi URL host come impostazioni predefinite di onboarding per LM Studio e Ollama, e `docker-compose.yml` mappa `host.docker.internal` al Gateway host di Docker per Docker Engine su Linux. Docker Desktop fornisce gia lo stesso nome host su macOS e Windows.

Anche i servizi host devono restare in ascolto su un indirizzo raggiungibile da Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se usi un tuo file Compose o comando `docker run`, aggiungi tu stesso la stessa mappatura host, per esempio
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI in Docker

L'immagine Docker ufficiale di OpenClaw non preinstalla Claude Code. Installa ed esegui l'accesso a Claude Code dentro l'utente del container che esegue OpenClaw, poi rendi persistente la home di quel container in modo che gli aggiornamenti dell'immagine non cancellino il binario o lo stato di autenticazione di Claude.

Per nuove installazioni Docker, abilita un volume persistente `/home/node` prima di eseguire la configurazione:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Per un'installazione Docker esistente, arresta prima lo stack e ricarica i valori Docker `.env` correnti prima di rieseguire la configurazione. Lo script di configurazione non legge `.env` autonomamente; riscrive `.env` dalla shell corrente e dai valori predefiniti. Per il `.env` generato, esegui:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Se il tuo `.env` contiene valori che la shell non puo caricare come sorgente, riesporta manualmente prima i valori esistenti da cui dipendi, come `OPENCLAW_IMAGE`, porte, modalita di bind, percorsi personalizzati, `OPENCLAW_EXTRA_MOUNTS`, sandbox e impostazioni skip-onboarding.
L'overlay generato monta il volume home sia per `openclaw-gateway` sia per `openclaw-cli`.

Esegui i comandi rimanenti con l'overlay Compose generato, cosi entrambi i servizi montano la home persistente. Se la tua configurazione usa anche `docker-compose.override.yml`, includilo prima di `docker-compose.extra.yml`.

Installa Claude Code in quella home persistente:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

L'installer nativo scrive il binario `claude` sotto
`/home/node/.local/bin/claude`. Indica a OpenClaw di usare quel percorso nel container:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Accedi e verifica dall'interno della stessa home persistente del container:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth login
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint /home/node/.local/bin/claude openclaw-cli auth status --text
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models auth login \
  --provider anthropic --method cli --set-default
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli models list --provider anthropic
```

Dopo, puoi usare il backend `claude-cli` incluso:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` rende persistente l'installazione nativa di Claude Code sotto
`/home/node/.local/bin` e `/home/node/.local/share/claude`, piu le impostazioni e lo stato di autenticazione di Claude Code sotto `/home/node/.claude` e `/home/node/.claude.json`.
Rendere persistente solo `/home/node/.openclaw` non basta per riutilizzare Claude CLI. Se usi `OPENCLAW_EXTRA_MOUNTS` invece di un volume home, monta tutti questi percorsi Claude in entrambi i servizi Docker.

<Note>
Per automazioni di produzione condivise o fatturazione Anthropic prevedibile, preferisci il percorso con chiave API Anthropic. Il riutilizzo di Claude CLI segue la versione installata, l'accesso dell'account, la fatturazione e il comportamento di aggiornamento di Claude Code.
</Note>

### Bonjour / mDNS

La rete bridge di Docker di solito non inoltra in modo affidabile il multicast Bonjour/mDNS
(`224.0.0.251:5353`). La configurazione Compose inclusa quindi imposta come predefinito
`OPENCLAW_DISABLE_BONJOUR=1` cosi il Gateway non entra in un ciclo di crash o non riavvia ripetutamente la pubblicita quando il bridge elimina il traffico multicast.

Usa l'URL Gateway pubblicato, Tailscale o DNS-SD wide-area per gli host Docker.
Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo quando esegui con rete host, macvlan o un'altra rete in cui il multicast mDNS e noto per funzionare.

Per insidie e risoluzione dei problemi, vedi [scoperta Bonjour](/it/gateway/bonjour).

### Archiviazione e persistenza

Docker Compose monta in bind `OPENCLAW_CONFIG_DIR` su `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` su `/home/node/.openclaw/workspace` e
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` su `/home/node/.config/openclaw`, cosi quei percorsi sopravvivono alla sostituzione del container. Quando una variabile non e impostata, il `docker-compose.yml` incluso ripiega sotto `${HOME}`, oppure su `/tmp` quando manca anche `HOME`. Questo evita che `docker compose up` emetta una specifica di volume con sorgente vuota in ambienti essenziali.

Quella directory di configurazione montata e dove OpenClaw conserva:

- `openclaw.json` per la configurazione del comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l'autenticazione OAuth/chiave API salvata dei provider
- `.env` per i segreti di runtime basati su env, come `OPENCLAW_GATEWAY_TOKEN`

La directory della chiave segreta dei profili di autenticazione archivia la chiave di cifratura locale usata per il materiale dei token dei profili di autenticazione basati su OAuth. Conservala con lo stato del tuo host Docker, ma separata da `OPENCLAW_CONFIG_DIR`.

I plugin scaricabili installati archiviano il loro stato di pacchetto sotto la home OpenClaw montata, quindi i record di installazione dei plugin e le radici dei pacchetti sopravvivono alla sostituzione del container. L'avvio del Gateway non genera alberi di dipendenze dei plugin inclusi.

Per i dettagli completi sulla persistenza nelle distribuzioni VM, vedi
[Runtime VM Docker - Cosa persiste dove](/it/install/docker-vm-runtime#what-persists-where).

**Punti critici di crescita del disco:** monitora `media/`, i file JSONL di sessione, il database di stato SQLite condiviso, le radici dei pacchetti dei plugin installati e i log su file a rotazione sotto `/tmp/openclaw/`.

### Helper shell (facoltativi)

Per una gestione Docker quotidiana piu semplice, installa `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se hai installato ClawDock dal vecchio percorso raw `scripts/shell-helpers/clawdock-helpers.sh`, riesegui il comando di installazione sopra in modo che il file helper locale segua la nuova posizione.

Poi usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard` e cosi via. Esegui
`clawdock-help` per tutti i comandi.
Vedi [ClawDock](/it/install/clawdock) per la guida completa agli helper.

<AccordionGroup>
  <Accordion title="Enable agent sandbox for Docker gateway">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Percorso socket personalizzato (per esempio Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Lo script monta `docker.sock` solo dopo il superamento dei prerequisiti della sandbox. Se la configurazione della sandbox non puo completarsi, lo script reimposta `agents.defaults.sandbox.mode`
    su `off`. I turni in modalita codice di Codex restano comunque limitati a `workspace-write` di Codex mentre la sandbox OpenClaw e attiva; non montare il socket Docker host nei container sandbox degli agenti.

  </Accordion>

  <Accordion title="Automation / CI (non-interactive)">
    Disabilita l'allocazione pseudo-TTY di Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Shared-network security note">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` cosi i comandi CLI possono raggiungere il gateway su `127.0.0.1`. Tratta questo come un confine di fiducia condiviso. La configurazione compose rimuove `NET_RAW`/`NET_ADMIN` e abilita
    `no-new-privileges` sia su `openclaw-gateway` sia su `openclaw-cli`.
  </Accordion>

  <Accordion title="Docker Desktop DNS failures in openclaw-cli">
    Alcune configurazioni Docker Desktop non riescono a risolvere DNS dal sidecar `openclaw-cli` su rete condivisa dopo la rimozione di `NET_RAW`, cosa che si manifesta come
    `EAI_AGAIN` durante comandi basati su npm come `openclaw plugins install`.
    Mantieni il file compose sicuro predefinito per il normale funzionamento del Gateway. L'override locale sotto allenta la postura di sicurezza del container CLI ripristinando le capability predefinite di Docker, quindi usalo solo per il comando CLI una tantum che richiede accesso al registro dei pacchetti, non come invocazione Compose predefinita:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Se hai gia creato un container `openclaw-cli` a lunga esecuzione, ricrealo con lo stesso override. `docker compose exec` e `docker exec` non possono cambiare le capability Linux su un container gia creato.

  </Accordion>

  <Accordion title="Permissions and EACCES">
    L'immagine viene eseguita come `node` (uid 1000). Se vedi errori di permessi su
    `/home/node/.openclaw`, assicurati che i bind mount host siano di proprieta di uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    La stessa mancata corrispondenza puo apparire come un avviso di plugin, per esempio
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguito da `plugin present but blocked`. Significa che l'uid del processo e il proprietario della directory plugin montata non corrispondono. Preferisci eseguire il container con l'uid predefinito 1000 e correggere la proprieta del bind mount. Esegui chown di
    `/path/to/openclaw-config/npm` a `root:root` solo se intendi eseguire OpenClaw come root a lungo termine.

  </Accordion>

  <Accordion title="Faster rebuilds">
    Ordina il tuo Dockerfile in modo che i layer delle dipendenze siano memorizzati nella cache. Questo evita di rieseguire
    `pnpm install` a meno che i lockfile cambino:

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
    L'immagine predefinita privilegia la sicurezza ed e eseguita come `node` non root. Per un container con piu funzionalita:

    1. **Rendi persistente `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Preinstalla le dipendenze di sistema nell'immagine**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Preinstalla le dipendenze Python nell'immagine**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Preinstalla Playwright Chromium nell'immagine**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Oppure installa i browser Playwright in un volume persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Rendi persistenti i download dei browser**: usa `OPENCLAW_HOME_VOLUME` o
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw rileva automaticamente il Chromium
       gestito da Playwright dell'immagine Docker su Linux.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Se scegli OpenAI Codex OAuth nella procedura guidata, viene aperto un URL del browser. Nelle
    configurazioni Docker o headless, copia l'URL di reindirizzamento completo su cui arrivi e incollalo
    di nuovo nella procedura guidata per completare l'autenticazione.
  </Accordion>

  <Accordion title="Metadati dell'immagine di base">
    L'immagine runtime Docker principale usa `node:24-bookworm-slim` e include `tini` come processo init di entrypoint (PID 1) per garantire che i processi zombie vengano raccolti e che i segnali siano gestiti correttamente nei container a lunga esecuzione. Pubblica annotazioni OCI dell'immagine di base, tra cui `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e altre. Il digest di base Node viene
    aggiornato tramite PR Dependabot per l'immagine di base Docker; le build di rilascio non eseguono
    un layer di aggiornamento della distribuzione. Vedi
    [annotazioni delle immagini OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Esecuzione su una VPS?

Vedi [Hetzner (VPS Docker)](/it/install/hetzner) e
[Runtime VM Docker](/it/install/docker-vm-runtime) per i passaggi di distribuzione su VM condivisa,
inclusi preinstallazione dei binari nell'immagine, persistenza e aggiornamenti.

## Sandbox degli agenti

Quando `agents.defaults.sandbox` è abilitato con il backend Docker, il gateway
esegue l'esecuzione degli strumenti degli agenti (shell, lettura/scrittura file, ecc.) dentro container Docker
isolati, mentre il gateway stesso rimane sull'host. Questo ti offre una barriera netta
attorno a sessioni agente non attendibili o multi-tenant senza containerizzare l'intero
gateway.

L'ambito della sandbox può essere per agente (predefinito), per sessione o condiviso. Ogni ambito
ottiene il proprio workspace montato in `/workspace`. Puoi anche configurare
criteri allow/deny per gli strumenti, isolamento di rete, limiti di risorse e container
browser.

Per configurazione completa, immagini, note di sicurezza e profili multi-agente, vedi:

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo alla sandbox
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

Costruisci l'immagine sandbox predefinita (da un checkout dei sorgenti):

```bash
scripts/sandbox-setup.sh
```

Per installazioni npm senza un checkout dei sorgenti, vedi [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) per i comandi `docker build` inline.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Immagine mancante o container sandbox che non si avvia">
    Costruisci l'immagine sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout dei sorgenti) o con il comando `docker build` inline da [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) (installazione npm),
    oppure imposta `agents.defaults.sandbox.docker.image` sulla tua immagine personalizzata.
    I container vengono creati automaticamente per sessione su richiesta.
  </Accordion>

  <Accordion title="Errori di autorizzazione nella sandbox">
    Imposta `docker.user` su un UID:GID che corrisponda alla proprietà del workspace montato,
    oppure esegui chown sulla cartella del workspace.
  </Accordion>

  <Accordion title="Strumenti personalizzati non trovati nella sandbox">
    OpenClaw esegue i comandi con `sh -lc` (shell di login), che carica
    `/etc/profile` e può reimpostare PATH. Imposta `docker.env.PATH` per anteporre i percorsi
    dei tuoi strumenti personalizzati, oppure aggiungi uno script sotto `/etc/profile.d/` nel tuo Dockerfile.
  </Accordion>

  <Accordion title="Interruzione per OOM durante la build dell'immagine (exit 137)">
    La VM richiede almeno 2 GB di RAM. Usa una classe di macchina più grande e riprova.
  </Accordion>

  <Accordion title="Non autorizzato o associazione richiesta nella Control UI">
    Recupera un nuovo link della dashboard e approva il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Maggiori dettagli: [Dashboard](/it/web/dashboard), [Dispositivi](/it/cli/devices).

  </Accordion>

  <Accordion title="La destinazione Gateway mostra ws://172.x.x.x o errori di associazione dalla CLI Docker">
    Reimposta la modalità e il bind del gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'installazione](/it/install) — tutti i metodi di installazione
- [Podman](/it/install/podman) — alternativa Podman a Docker
- [ClawDock](/it/install/clawdock) — configurazione community con Docker Compose
- [Aggiornamento](/it/install/updating) — mantenere OpenClaw aggiornato
- [Configurazione](/it/gateway/configuration) — configurazione del gateway dopo l'installazione
