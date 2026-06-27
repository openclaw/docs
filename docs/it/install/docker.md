---
read_when:
    - Vuoi un gateway containerizzato invece delle installazioni locali
    - Stai convalidando il flusso Docker
summary: Configurazione e onboarding opzionali basati su Docker per OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-06-27T17:39:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 717fbf53a465196bb7be22037b613939e7cad9e4f0642c9d59ec4e7ec064df14
    source_path: install/docker.md
    workflow: 16
---

Docker è **opzionale**. Usalo solo se vuoi un Gateway containerizzato o validare il flusso Docker.

## Docker fa al caso mio?

- **Sì**: vuoi un ambiente Gateway isolato e temporaneo oppure eseguire OpenClaw su un host senza installazioni locali.
- **No**: stai eseguendo tutto sulla tua macchina e vuoi solo il ciclo di sviluppo più rapido. Usa invece il normale flusso di installazione.
- **Nota sul sandboxing**: il backend sandbox predefinito usa Docker quando il sandboxing è abilitato, ma il sandboxing è disattivato per impostazione predefinita e **non** richiede che l'intero Gateway venga eseguito in Docker. Sono disponibili anche i backend sandbox SSH e OpenShell. Vedi [Sandboxing](/it/gateway/sandboxing).

## Prerequisiti

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la build dell'immagine (`pnpm install` potrebbe essere terminato per OOM su host da 1 GB con uscita 137)
- Spazio su disco sufficiente per immagini e log
- Se esegui su un VPS/host pubblico, consulta
  [Hardening di sicurezza per l'esposizione di rete](/it/gateway/security),
  in particolare la policy firewall Docker `DOCKER-USER`.

## Gateway containerizzato

<Steps>
  <Step title="Crea l'immagine">
    Dalla radice del repo, esegui lo script di configurazione:

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
    Tag comuni: `main`, `latest`, `<version>` (ad es. `2026.2.26`).

  </Step>

  <Step title="Riesecuzione airgapped">
    Su host offline, trasferisci e carica prima l'immagine:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica che `OPENCLAW_IMAGE` esista già localmente, disabilita
    pull e build impliciti di Compose, quindi esegue il normale flusso di configurazione, come
    sincronizzazione di `.env`, correzioni dei permessi, onboarding, sincronizzazione della configurazione del Gateway
    e avvio di Compose.

    Se `OPENCLAW_SANDBOX=1`, la configurazione offline controlla anche le immagini sandbox predefinite
    configurate e quelle attive per agente sul daemon dietro
    `OPENCLAW_DOCKER_SOCKET`. Anche le immagini browser basate su Docker devono includere
    l'etichetta del contratto browser OpenClaw corrente. Quando un'immagine richiesta è mancante o
    incompatibile, la configurazione termina senza modificare la configurazione sandbox invece di
    riportare un successo con un sandbox inutilizzabile.

  </Step>

  <Step title="Completa l'onboarding">
    Lo script di configurazione esegue automaticamente l'onboarding. Eseguirà queste operazioni:

    - richiede le chiavi API del provider
    - genera un token Gateway e lo scrive in `.env`
    - crea la directory della chiave segreta dell'auth-profile
    - avvia il Gateway tramite Docker Compose

    Durante la configurazione, l'onboarding pre-avvio e le scritture di configurazione passano direttamente da
    `openclaw-gateway`. `openclaw-cli` è per i comandi che esegui dopo
    che il container del Gateway esiste già.

  </Step>

  <Step title="Apri la Control UI">
    Apri `http://127.0.0.1:18789/` nel browser e incolla il segreto condiviso
    configurato in Settings. Per impostazione predefinita lo script di configurazione scrive un token in `.env`;
    se cambi la configurazione del container per usare l'autenticazione con password, usa invece quella
    password.

    Ti serve di nuovo l'URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configura i canali (opzionale)">
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
Esegui `docker compose` dalla radice del repo. Se hai abilitato `OPENCLAW_EXTRA_MOUNTS`
o `OPENCLAW_HOME_VOLUME`, lo script di configurazione scrive `docker-compose.extra.yml`;
includilo dopo qualsiasi file di override standard, per esempio
`-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`
quando esistono entrambi i file di override.
</Note>

<Note>
Poiché `openclaw-cli` condivide il namespace di rete di `openclaw-gateway`, è uno
strumento post-avvio. Prima di `docker compose up -d openclaw-gateway`, esegui l'onboarding
e le scritture di configurazione in fase di setup tramite `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variabili d'ambiente

Lo script di configurazione accetta queste variabili d'ambiente opzionali:

| Variabile                                  | Scopo                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usa un'immagine remota invece di crearla localmente                   |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | Installa pacchetti apt aggiuntivi durante la build (separati da spazi) |
| `OPENCLAW_IMAGE_PIP_PACKAGES`              | Installa pacchetti Python aggiuntivi durante la build (separati da spazi) |
| `OPENCLAW_EXTENSIONS`                      | Preinstalla le dipendenze dei Plugin in fase di build (nomi separati da spazi) |
| `OPENCLAW_EXTRA_MOUNTS`                    | Montaggi bind host aggiuntivi (`source:target[:opts]` separati da virgole) |
| `OPENCLAW_HOME_VOLUME`                     | Persiste `/home/node` in un volume Docker nominato                    |
| `OPENCLAW_SANDBOX`                         | Abilita il bootstrap del sandbox (`1`, `true`, `yes`, `on`)           |
| `OPENCLAW_SKIP_ONBOARDING`                 | Salta il passaggio di onboarding interattivo (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Sovrascrive il percorso del socket Docker                             |
| `OPENCLAW_DISABLE_BONJOUR`                 | Disabilita la pubblicazione Bonjour/mDNS (predefinito a `1` per Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Disabilita gli overlay bind-mount del codice sorgente dei Plugin inclusi |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint collector OTLP/HTTP condiviso per l'esportazione OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP specifici del segnale per trace, metriche o log         |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Override del protocollo OTLP. Oggi è supportato solo `http/protobuf`  |
| `OTEL_SERVICE_NAME`                        | Nome del servizio usato per le risorse OpenTelemetry                  |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Abilita gli attributi semantici GenAI sperimentali più recenti        |
| `OPENCLAW_OTEL_PRELOADED`                  | Salta l'avvio di un secondo SDK OpenTelemetry quando uno è precaricato |

L'immagine Docker ufficiale non include Homebrew. Durante l'onboarding, OpenClaw
nasconde gli installer di dipendenze delle skill disponibili solo tramite brew quando è in esecuzione in un container
Linux senza `brew`; tali dipendenze devono essere fornite da un'immagine personalizzata
o installate manualmente. Per le dipendenze disponibili come pacchetti Debian, usa
`OPENCLAW_IMAGE_APT_PACKAGES` durante la build dell'immagine. Il nome legacy
`OPENCLAW_DOCKER_APT_PACKAGES` è ancora accettato.
Per le dipendenze Python, usa `OPENCLAW_IMAGE_PIP_PACKAGES`. Questo esegue
`python3 -m pip install --break-system-packages` durante la build dell'immagine, quindi fissa
le versioni dei pacchetti e usa solo indici di pacchetti di cui ti fidi.

I maintainer possono testare il sorgente di un Plugin incluso rispetto a un'immagine pacchettizzata montando
una directory sorgente del Plugin sopra il suo percorso sorgente pacchettizzato, per esempio
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Quella directory sorgente montata sovrascrive il bundle compilato corrispondente
`/app/dist/extensions/synology-chat` per lo stesso id Plugin.

### Osservabilità

L'esportazione OpenTelemetry è in uscita dal container Gateway verso il tuo collector
OTLP. Non richiede una porta Docker pubblicata. Se crei l'immagine
localmente e vuoi che l'exporter OpenTelemetry incluso sia disponibile dentro l'immagine,
includi le sue dipendenze runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installa il Plugin ufficiale `@openclaw/diagnostics-otel` da ClawHub nelle
installazioni Docker pacchettizzate prima di abilitare l'esportazione. Le immagini personalizzate create da sorgente possono
ancora includere il sorgente del Plugin locale con
`OPENCLAW_EXTENSIONS=diagnostics-otel`. Per abilitare l'esportazione, consenti e abilita il
Plugin `diagnostics-otel` nella configurazione, quindi imposta
`diagnostics.otel.enabled=true` oppure usa l'esempio di configurazione in [Esportazione
OpenTelemetry](/it/gateway/opentelemetry). Gli header di autenticazione del collector sono configurati tramite
`diagnostics.otel.headers`, non tramite variabili d'ambiente Docker.

Le metriche Prometheus usano la porta Gateway già pubblicata. Installa
`clawhub:@openclaw/diagnostics-prometheus`, abilita il
Plugin `diagnostics-prometheus`, quindi esegui lo scrape:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route è protetta dall'autenticazione del Gateway. Non esporre una porta
pubblica `/metrics` separata né un percorso reverse proxy non autenticato. Vedi
[Metriche Prometheus](/it/gateway/prometheus).

### Controlli di integrità

Endpoint di probe del container (nessuna autenticazione richiesta):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L'immagine Docker include un `HEALTHCHECK` integrato che interroga `/healthz`.
Se i controlli continuano a fallire, Docker contrassegna il container come `unhealthy` e
i sistemi di orchestrazione possono riavviarlo o sostituirlo.

Snapshot di integrità approfondito autenticato:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` imposta per impostazione predefinita `OPENCLAW_GATEWAY_BIND=lan` così l'accesso dall'host a
`http://127.0.0.1:18789` funziona con la pubblicazione delle porte Docker.

- `lan` (predefinito): il browser host e la CLI host possono raggiungere la porta Gateway pubblicata.
- `loopback`: solo i processi dentro il namespace di rete del container possono raggiungere
  direttamente il Gateway.

<Note>
Usa i valori della modalità bind in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), non alias host come `0.0.0.0` o `127.0.0.1`.
</Note>

### Provider locali dell'host

Quando OpenClaw è in esecuzione in Docker, `127.0.0.1` dentro il container è il container
stesso, non la tua macchina host. Usa `host.docker.internal` per i provider AI che
girano sull'host:

| Provider  | URL host predefinito     | URL configurazione Docker           |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

La configurazione Docker inclusa usa quegli URL host come valori predefiniti di onboarding per LM Studio e Ollama,
e `docker-compose.yml` mappa `host.docker.internal` al
Gateway host di Docker per Docker Engine su Linux. Docker Desktop fornisce già
lo stesso hostname su macOS e Windows.

Anche i servizi host devono ascoltare su un indirizzo raggiungibile da Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se usi il tuo file Compose o comando `docker run`, aggiungi tu stesso la stessa
mappatura dell'host, per esempio
`--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI in Docker

L'immagine Docker ufficiale di OpenClaw non preinstalla Claude Code. Installa ed
effettua l'accesso a Claude Code all'interno dell'utente del container che esegue
OpenClaw, quindi rendi persistente la home di quel container affinché gli
aggiornamenti dell'immagine non cancellino il binario o lo stato di autenticazione
di Claude.

Per le nuove installazioni Docker, abilita un volume `/home/node` persistente
prima di eseguire la configurazione:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Per un'installazione Docker esistente, arresta prima lo stack e ricarica i valori
Docker `.env` correnti prima di rieseguire la configurazione. Lo script di
configurazione non legge `.env` autonomamente; riscrive `.env` dalla shell
corrente e dai valori predefiniti. Per il `.env` generato, esegui:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Se il tuo `.env` contiene valori che la shell non può caricare come sorgente,
riesporta prima manualmente i valori esistenti da cui dipendi, come
`OPENCLAW_IMAGE`, porte, modalità bind, percorsi personalizzati,
`OPENCLAW_EXTRA_MOUNTS`, sandbox e impostazioni di skip-onboarding.
L'overlay generato monta il volume home sia per `openclaw-gateway` sia per
`openclaw-cli`.

Esegui i comandi rimanenti con l'overlay Compose generato, così entrambi i servizi
montano la home persistente. Se la tua configurazione usa anche
`docker-compose.override.yml`, includilo prima di `docker-compose.extra.yml`.

Installa Claude Code in quella home persistente:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

L'installer nativo scrive il binario `claude` in
`/home/node/.local/bin/claude`. Indica a OpenClaw di usare quel percorso del
container:

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

Dopo di che, puoi usare il backend `claude-cli` incluso:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Say hello from Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` rende persistente l'installazione nativa di Claude Code in
`/home/node/.local/bin` e `/home/node/.local/share/claude`, oltre alle
impostazioni e allo stato di autenticazione di Claude Code in `/home/node/.claude`
e `/home/node/.claude.json`. Rendere persistente solo `/home/node/.openclaw` non è
sufficiente per riutilizzare Claude CLI. Se usi `OPENCLAW_EXTRA_MOUNTS` invece di
un volume home, monta tutti quei percorsi Claude in entrambi i servizi Docker.

<Note>
Per automazioni di produzione condivise o fatturazione Anthropic prevedibile,
preferisci il percorso con chiave API Anthropic. Il riutilizzo di Claude CLI segue
la versione installata di Claude Code, l'accesso dell'account, la fatturazione e
il comportamento di aggiornamento.
</Note>

### Bonjour / mDNS

La rete bridge Docker di solito non inoltra in modo affidabile il multicast
Bonjour/mDNS (`224.0.0.251:5353`). La configurazione Compose inclusa quindi usa
per impostazione predefinita `OPENCLAW_DISABLE_BONJOUR=1` affinché il Gateway non
entri in crash-loop o non riavvii ripetutamente l'annuncio quando il bridge scarta
il traffico multicast.

Usa l'URL Gateway pubblicato, Tailscale o DNS-SD wide-area per gli host Docker.
Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo quando esegui con rete host, macvlan o
un'altra rete in cui è noto che il multicast mDNS funzioni.

Per insidie e risoluzione dei problemi, consulta [rilevamento Bonjour](/it/gateway/bonjour).

### Archiviazione e persistenza

Docker Compose monta come bind mount `OPENCLAW_CONFIG_DIR` su `/home/node/.openclaw`,
`OPENCLAW_WORKSPACE_DIR` su `/home/node/.openclaw/workspace` e
`OPENCLAW_AUTH_PROFILE_SECRET_DIR` su `/home/node/.config/openclaw`, quindi quei
percorsi sopravvivono alla sostituzione del container. Quando una variabile non è
impostata, il `docker-compose.yml` incluso ripiega su `${HOME}`, oppure su `/tmp`
quando anche `HOME` manca. Questo evita che `docker compose up` emetta una
specifica di volume con origine vuota in ambienti essenziali.

Quella directory di configurazione montata è dove OpenClaw conserva:

- `openclaw.json` per la configurazione del comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l'autenticazione OAuth/chiave API dei provider archiviata
- `.env` per i segreti runtime basati su env, come `OPENCLAW_GATEWAY_TOKEN`

La directory della chiave segreta del profilo di autenticazione archivia la chiave
di crittografia locale usata per il materiale dei token dei profili di
autenticazione basati su OAuth. Tienila insieme allo stato del tuo host Docker,
ma separata da `OPENCLAW_CONFIG_DIR`.

I Plugin scaricabili installati archiviano il proprio stato del pacchetto nella
home OpenClaw montata, quindi i record di installazione dei Plugin e le radici dei
pacchetti sopravvivono alla sostituzione del container. L'avvio del Gateway non
genera alberi di dipendenze per i Plugin inclusi.

Per i dettagli completi sulla persistenza nelle distribuzioni VM, consulta
[Runtime VM Docker - Cosa persiste dove](/it/install/docker-vm-runtime#what-persists-where).

  **Punti critici di crescita del disco:** controlla `media/`, i file JSONL di sessione, il database di stato
  SQLite condiviso, le radici dei pacchetti Plugin installati e i log su file a rotazione
  in `/tmp/openclaw/`.

  ### Helper shell (opzionali)

  Per una gestione quotidiana più semplice di Docker, installa `ClawDock`:

  ```bash
  mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
  echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
  ```

  Se hai installato ClawDock dal vecchio percorso raw `scripts/shell-helpers/clawdock-helpers.sh`, riesegui il comando di installazione sopra in modo che il tuo file helper locale segua la nuova posizione.

  Poi usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, ecc. Esegui
  `clawdock-help` per tutti i comandi.
  Consulta [ClawDock](/it/install/clawdock) per la guida completa agli helper.

  <AccordionGroup>
  <Accordion title="Abilita la sandbox dell'agente per il gateway Docker">
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

    Lo script monta `docker.sock` solo dopo il superamento dei prerequisiti della sandbox. Se
    la configurazione della sandbox non può essere completata, lo script reimposta `agents.defaults.sandbox.mode`
    su `off`. I turni in modalità codice di Codex restano comunque vincolati a
    `workspace-write` di Codex mentre la sandbox OpenClaw è attiva; non montare il
    socket Docker dell'host nei container sandbox degli agenti.

  </Accordion>

  <Accordion title="Automazione / CI (non interattivo)">
    Disabilita l'allocazione pseudo-TTY di Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota di sicurezza sulla rete condivisa">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` affinché i comandi
    CLI possano raggiungere il Gateway tramite `127.0.0.1`. Consideralo un confine
    di fiducia condiviso. La configurazione compose rimuove `NET_RAW`/`NET_ADMIN` e abilita
    `no-new-privileges` sia su `openclaw-gateway` sia su `openclaw-cli`.
  </Accordion>

  <Accordion title="Errori DNS di Docker Desktop in openclaw-cli">
    Alcune configurazioni di Docker Desktop non riescono a risolvere il DNS dal sidecar
    `openclaw-cli` sulla rete condivisa dopo la rimozione di `NET_RAW`, cosa che si manifesta come
    `EAI_AGAIN` durante comandi basati su npm come `openclaw plugins install`.
    Mantieni il file compose irrigidito predefinito per il normale funzionamento del Gateway. L'override
    locale qui sotto allenta la postura di sicurezza del container CLI
    ripristinando le capability predefinite di Docker, quindi usalo solo per il comando CLI una tantum
    che richiede accesso al registro dei pacchetti, non come invocazione Compose
    predefinita:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Se hai già creato un container `openclaw-cli` a esecuzione prolungata, ricrealo
    con lo stesso override. `docker compose exec` e `docker exec` non possono
    modificare le capability Linux su un container già creato.

  </Accordion>

  <Accordion title="Permessi ed EACCES">
    L'immagine viene eseguita come `node` (uid 1000). Se vedi errori di permesso su
    `/home/node/.openclaw`, assicurati che i bind mount dell'host siano di proprietà dell'uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    La stessa mancata corrispondenza può comparire come avviso di Plugin, ad esempio
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguito da `plugin present but blocked`. Significa che l'uid del processo e il
    proprietario della directory Plugin montata non coincidono. Preferisci eseguire il container con l'uid
    predefinito 1000 e correggere la proprietà del bind mount. Esegui chown di
    `/path/to/openclaw-config/npm` a `root:root` solo se intendi eseguire
    OpenClaw come root a lungo termine.

  </Accordion>

  <Accordion title="Ricompilazioni più rapide">
    Ordina il Dockerfile in modo che i layer delle dipendenze vengano memorizzati nella cache. Questo evita di rieseguire
    `pnpm install` a meno che i lockfile non cambino:

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

  <Accordion title="Opzioni container per utenti avanzati">
    L'immagine predefinita privilegia la sicurezza e viene eseguita come `node` non root. Per un container
    più completo:

    1. **Mantieni `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Integra dipendenze di sistema**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Integra dipendenze Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Integra Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`
    5. **Oppure installa i browser Playwright in un volume persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Mantieni i download dei browser**: usa `OPENCLAW_HOME_VOLUME` oppure
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw rileva automaticamente il Chromium gestito da Playwright
       dell'immagine Docker su Linux.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker headless)">
    Se scegli OAuth OpenAI Codex nella procedura guidata, viene aperto un URL del browser. In
    configurazioni Docker o headless, copia l'URL di reindirizzamento completo su cui arrivi e incollalo
    di nuovo nella procedura guidata per completare l'autenticazione.
  </Accordion>

  <Accordion title="Metadati dell'immagine base">
    L'immagine runtime Docker principale usa `node:24-bookworm-slim` e include `tini` come processo init entrypoint (PID 1) per garantire che i processi zombie vengano raccolti e che i segnali siano gestiti correttamente nei container a lunga esecuzione. Pubblica annotazioni OCI dell'immagine base, incluse `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e altre. Il digest della base Node viene
    aggiornato tramite le PR Dependabot per l'immagine base Docker; le build di rilascio non eseguono
    un livello di aggiornamento della distribuzione. Vedi
    [annotazioni dell'immagine OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Esecuzione su una VPS?

Vedi [Hetzner (Docker VPS)](/it/install/hetzner) e
[Docker VM Runtime](/it/install/docker-vm-runtime) per i passaggi di distribuzione su VM condivisa,
inclusi integrazione del binario nell'immagine, persistenza e aggiornamenti.

## Sandbox dell'agente

Quando `agents.defaults.sandbox` è abilitato con il backend Docker, il gateway
esegue l'esecuzione degli strumenti dell'agente (shell, lettura/scrittura di file, ecc.) all'interno di container Docker
isolati, mentre il gateway stesso resta sull'host. Questo ti offre una barriera netta
attorno alle sessioni agente non attendibili o multi-tenant senza containerizzare l'intero
gateway.

L'ambito del sandbox può essere per agente (predefinito), per sessione o condiviso. Ogni ambito
ottiene il proprio workspace montato in `/workspace`. Puoi anche configurare
policy di consenso/rifiuto per gli strumenti, isolamento di rete, limiti di risorse e container
browser.

Per configurazione completa, immagini, note di sicurezza e profili multi-agente, vedi:

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo del sandbox
- [OpenShell](/it/gateway/openshell) -- accesso shell interattivo ai container sandbox
- [Multi-Agent Sandbox and Tools](/it/tools/multi-agent-sandbox-tools) -- override per agente

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

Crea l'immagine sandbox predefinita (da un checkout del sorgente):

```bash
scripts/sandbox-setup.sh
```

Per installazioni npm senza un checkout del sorgente, vedi [Sandboxing § Images and setup](/it/gateway/sandboxing#images-and-setup) per i comandi `docker build` inline.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Immagine mancante o container sandbox non avviato">
    Crea l'immagine sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout del sorgente) o con il comando `docker build` inline da [Sandboxing § Images and setup](/it/gateway/sandboxing#images-and-setup) (installazione npm),
    oppure imposta `agents.defaults.sandbox.docker.image` sulla tua immagine personalizzata.
    I container vengono creati automaticamente per sessione su richiesta.
  </Accordion>

  <Accordion title="Errori di autorizzazione nel sandbox">
    Imposta `docker.user` su un UID:GID che corrisponda alla proprietà del workspace montato,
    oppure esegui chown sulla cartella del workspace.
  </Accordion>

  <Accordion title="Strumenti personalizzati non trovati nel sandbox">
    OpenClaw esegue i comandi con `sh -lc` (shell di login), che carica
    `/etc/profile` e può reimpostare PATH. Imposta `docker.env.PATH` per anteporre i
    percorsi dei tuoi strumenti personalizzati, oppure aggiungi uno script in `/etc/profile.d/` nel tuo Dockerfile.
  </Accordion>

  <Accordion title="Terminato per OOM durante la build dell'immagine (exit 137)">
    La VM richiede almeno 2 GB di RAM. Usa una classe di macchina più grande e riprova.
  </Accordion>

  <Accordion title="Non autorizzato o associazione richiesta nella Control UI">
    Recupera un nuovo link dashboard e approva il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Maggiori dettagli: [Dashboard](/it/web/dashboard), [Devices](/it/cli/devices).

  </Accordion>

  <Accordion title="Il target del Gateway mostra ws://172.x.x.x o errori di associazione dalla CLI Docker">
    Reimposta modalità e bind del gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'installazione](/it/install) — tutti i metodi di installazione
- [Podman](/it/install/podman) — alternativa Podman a Docker
- [ClawDock](/it/install/clawdock) — configurazione comunitaria con Docker Compose
- [Aggiornamento](/it/install/updating) — mantenere OpenClaw aggiornato
- [Configurazione](/it/gateway/configuration) — configurazione del gateway dopo l'installazione
