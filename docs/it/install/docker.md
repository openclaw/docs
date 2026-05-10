---
read_when:
    - Vuoi un Gateway containerizzato invece di installazioni locali
    - Stai convalidando il flusso Docker
summary: Configurazione e onboarding facoltativi basati su Docker per OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-05-10T19:39:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 810ad901cafda4adad477ea3aeb5940e0bc2bd4a24b15d5f9ab0c172ed943a94
    source_path: install/docker.md
    workflow: 16
---

Docker è **opzionale**. Usalo solo se vuoi un Gateway containerizzato o convalidare il flusso Docker.

## Docker fa al caso mio?

- **Sì**: vuoi un ambiente Gateway isolato e temporaneo, oppure eseguire OpenClaw su un host senza installazioni locali.
- **No**: stai lavorando sulla tua macchina e vuoi solo il ciclo di sviluppo più rapido. Usa invece il normale flusso di installazione.
- **Nota sul sandboxing**: il backend sandbox predefinito usa Docker quando il sandboxing è abilitato, ma il sandboxing è disattivato per impostazione predefinita e **non** richiede che l'intero Gateway venga eseguito in Docker. Sono disponibili anche i backend sandbox SSH e OpenShell. Vedi [Sandboxing](/it/gateway/sandboxing).

## Prerequisiti

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la build dell'immagine (`pnpm install` può essere terminato per OOM su host da 1 GB con uscita 137)
- Spazio su disco sufficiente per immagini e log
- Se esegui su un VPS/host pubblico, consulta
  [Rafforzamento della sicurezza per l'esposizione in rete](/it/gateway/security),
  in particolare la policy firewall Docker `DOCKER-USER`.

## Gateway containerizzato

<Steps>
  <Step title="Build the image">
    Dalla radice del repo, esegui lo script di configurazione:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Questo compila localmente l'immagine del Gateway. Per usare invece un'immagine precompilata:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Le immagini precompilate sono pubblicate nel
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag comuni: `main`, `latest`, `<version>` (ad es. `2026.2.26`).

  </Step>

  <Step title="Complete onboarding">
    Lo script di configurazione esegue automaticamente l'onboarding. Esso:

    - richiede le chiavi API del provider
    - genera un token Gateway e lo scrive in `.env`
    - avvia il Gateway tramite Docker Compose

    Durante la configurazione, l'onboarding pre-avvio e le scritture di configurazione vengono eseguiti direttamente tramite
    `openclaw-gateway`. `openclaw-cli` è per i comandi che esegui dopo che
    il container Gateway esiste già.

  </Step>

  <Step title="Open the Control UI">
    Apri `http://127.0.0.1:18789/` nel browser e incolla il segreto condiviso
    configurato nelle Impostazioni. Lo script di configurazione scrive un token in `.env` per
    impostazione predefinita; se passi la configurazione del container all'autenticazione con password, usa invece quella
    password.

    Hai bisogno di nuovo dell'URL?

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
Esegui `docker compose` dalla radice del repo. Se hai abilitato `OPENCLAW_EXTRA_MOUNTS`
o `OPENCLAW_HOME_VOLUME`, lo script di configurazione scrive `docker-compose.extra.yml`;
includilo con `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Poiché `openclaw-cli` condivide il namespace di rete di `openclaw-gateway`, è uno
strumento post-avvio. Prima di `docker compose up -d openclaw-gateway`, esegui l'onboarding
e le scritture di configurazione in fase di configurazione tramite `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variabili d'ambiente

Lo script di configurazione accetta queste variabili d'ambiente opzionali:

| Variabile                                  | Scopo                                                           |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | Usa un'immagine remota invece di compilarla localmente          |
| `OPENCLAW_DOCKER_APT_PACKAGES`             | Installa pacchetti apt extra durante la build (separati da spazi) |
| `OPENCLAW_EXTENSIONS`                      | Include gli helper dei plugin in bundle selezionati in fase di build |
| `OPENCLAW_EXTRA_MOUNTS`                    | Bind mount host aggiuntivi (`source:target[:opts]` separati da virgole) |
| `OPENCLAW_HOME_VOLUME`                     | Mantiene `/home/node` in un volume Docker con nome              |
| `OPENCLAW_SANDBOX`                         | Abilita il bootstrap della sandbox (`1`, `true`, `yes`, `on`)   |
| `OPENCLAW_SKIP_ONBOARDING`                 | Salta il passaggio di onboarding interattivo (`1`, `true`, `yes`, `on`) |
| `OPENCLAW_DOCKER_SOCKET`                   | Sovrascrive il percorso del socket Docker                       |
| `OPENCLAW_DISABLE_BONJOUR`                 | Disabilita l'annuncio Bonjour/mDNS (predefinito a `1` per Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Disabilita gli overlay bind-mount del sorgente dei plugin in bundle |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | Endpoint collector OTLP/HTTP condiviso per l'esportazione OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | Endpoint OTLP specifici per segnale per trace, metriche o log   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | Sovrascrittura del protocollo OTLP. Oggi è supportato solo `http/protobuf` |
| `OTEL_SERVICE_NAME`                        | Nome del servizio usato per le risorse OpenTelemetry            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | Abilita gli attributi semantici GenAI sperimentali più recenti  |
| `OPENCLAW_OTEL_PRELOADED`                  | Salta l'avvio di un secondo SDK OpenTelemetry quando uno è già precaricato |

I maintainer possono testare il sorgente di un Plugin in bundle rispetto a un'immagine pacchettizzata montando
una directory sorgente del Plugin sopra il suo percorso sorgente pacchettizzato, ad esempio
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Quella directory sorgente montata sovrascrive il bundle compilato
`/app/dist/extensions/synology-chat` corrispondente per lo stesso id Plugin.

### Osservabilità

L'esportazione OpenTelemetry è in uscita dal container Gateway verso il tuo collector
OTLP. Non richiede una porta Docker pubblicata. Se compili l'immagine
localmente e vuoi che l'exporter OpenTelemetry in bundle sia disponibile dentro l'immagine,
includi le sue dipendenze runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Installa il Plugin ufficiale `@openclaw/diagnostics-otel` da ClawHub nelle
installazioni Docker pacchettizzate prima di abilitare l'esportazione. Le immagini personalizzate compilate dal sorgente possono
ancora includere il sorgente Plugin locale con
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

La route è protetta dall'autenticazione Gateway. Non esporre una porta
pubblica `/metrics` separata o un percorso reverse-proxy non autenticato. Vedi
[Metriche Prometheus](/it/gateway/prometheus).

### Controlli di integrità

Endpoint probe del container (nessuna autenticazione richiesta):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L'immagine Docker include un `HEALTHCHECK` integrato che interroga `/healthz`.
Se i controlli continuano a fallire, Docker contrassegna il container come `unhealthy` e
i sistemi di orchestrazione possono riavviarlo o sostituirlo.

Snapshot approfondito dello stato di salute autenticato:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` imposta per impostazione predefinita `OPENCLAW_GATEWAY_BIND=lan` in modo che l'accesso host a
`http://127.0.0.1:18789` funzioni con la pubblicazione delle porte Docker.

- `lan` (predefinito): il browser host e la CLI host possono raggiungere la porta Gateway pubblicata.
- `loopback`: solo i processi dentro il namespace di rete del container possono raggiungere
  direttamente il Gateway.

<Note>
Usa i valori della modalità bind in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), non alias host come `0.0.0.0` o `127.0.0.1`.
</Note>

### Provider locali sull'host

Quando OpenClaw viene eseguito in Docker, `127.0.0.1` dentro il container è il container
stesso, non la tua macchina host. Usa `host.docker.internal` per i provider AI che
vengono eseguiti sull'host:

| Provider  | URL host predefinito     | URL configurazione Docker           |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

La configurazione Docker in bundle usa quegli URL host come impostazioni predefinite di onboarding
per LM Studio e Ollama, e `docker-compose.yml` mappa `host.docker.internal` al
Gateway host di Docker per Docker Engine su Linux. Docker Desktop fornisce già
lo stesso hostname su macOS e Windows.

Anche i servizi host devono ascoltare su un indirizzo raggiungibile da Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Se usi un tuo file Compose o un comando `docker run`, aggiungi tu stesso la stessa
mappatura host, ad esempio
`--add-host=host.docker.internal:host-gateway`.

### Bonjour / mDNS

Il networking bridge di Docker di solito non inoltra in modo affidabile il multicast Bonjour/mDNS
(`224.0.0.251:5353`). La configurazione Compose in bundle quindi imposta per impostazione predefinita
`OPENCLAW_DISABLE_BONJOUR=1` così il Gateway non entra in crash-loop né riavvia ripetutamente
l'annuncio quando il bridge scarta il traffico multicast.

Usa l'URL Gateway pubblicato, Tailscale o wide-area DNS-SD per gli host Docker.
Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo quando esegui con networking host, macvlan
o un'altra rete in cui è noto che il multicast mDNS funzioni.

Per problemi comuni e risoluzione, vedi [Rilevamento Bonjour](/it/gateway/bonjour).

### Archiviazione e persistenza

Docker Compose monta tramite bind `OPENCLAW_CONFIG_DIR` su `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` su `/home/node/.openclaw/workspace`, quindi quei percorsi
sopravvivono alla sostituzione del container. Quando una delle due variabili non è impostata, il
`docker-compose.yml` in bundle ripiega su `${HOME}/.openclaw` (e
`${HOME}/.openclaw/workspace` per il mount workspace), oppure su `/tmp/.openclaw`
quando manca anche `HOME`. Questo evita che `docker compose up` emetta
una specifica di volume con sorgente vuota in ambienti essenziali.

Quella directory di configurazione montata è dove OpenClaw conserva:

- `openclaw.json` per la configurazione del comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l'autenticazione OAuth/API-key dei provider archiviata
- `.env` per i segreti runtime basati su env come `OPENCLAW_GATEWAY_TOKEN`

I plugin scaricabili installati archiviano il loro stato pacchetto sotto la home
OpenClaw montata, quindi i record di installazione dei Plugin e le radici dei pacchetti sopravvivono alla sostituzione del container.
L'avvio del Gateway non genera alberi di dipendenze per i Plugin in bundle.

Per i dettagli completi sulla persistenza nelle distribuzioni VM, vedi
[Runtime VM Docker - Cosa persiste dove](/it/install/docker-vm-runtime#what-persists-where).

**Punti critici di crescita del disco:** monitora `media/`, i file JSONL di sessione,
`cron/runs/*.jsonl`, le radici dei pacchetti plugin installati e i log file a rotazione
sotto `/tmp/openclaw/`.

### Helper shell (opzionali)

Per semplificare la gestione quotidiana di Docker, installa `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se hai installato ClawDock dal vecchio percorso raw `scripts/shell-helpers/clawdock-helpers.sh`, riesegui il comando di installazione sopra in modo che il file helper locale segua la nuova posizione.

Poi usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, ecc. Esegui
`clawdock-help` per tutti i comandi.
Vedi [ClawDock](/it/install/clawdock) per la guida completa agli helper.

<AccordionGroup>
  <Accordion title="Abilita la sandbox dell'agente per il Docker gateway">
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

    Lo script monta `docker.sock` solo dopo che i prerequisiti della sandbox sono soddisfatti. Se
    la configurazione della sandbox non può essere completata, lo script reimposta `agents.defaults.sandbox.mode`
    su `off`.

  </Accordion>

  <Accordion title="Automazione / CI (non interattiva)">
    Disabilita l'allocazione pseudo-TTY di Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota di sicurezza sulla rete condivisa">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` in modo che i comandi
    CLI possano raggiungere il gateway tramite `127.0.0.1`. Consideralo un confine di fiducia
    condiviso. La configurazione compose rimuove `NET_RAW`/`NET_ADMIN` e abilita
    `no-new-privileges` sia su `openclaw-gateway` sia su `openclaw-cli`.
  </Accordion>

  <Accordion title="Errori DNS di Docker Desktop in openclaw-cli">
    Alcune configurazioni di Docker Desktop non riescono a risolvere DNS dal sidecar
    `openclaw-cli` a rete condivisa dopo la rimozione di `NET_RAW`, cosa che appare come
    `EAI_AGAIN` durante comandi basati su npm come `openclaw plugins install`.
    Mantieni il file compose sicuro predefinito per il normale funzionamento del gateway. L'override
    locale qui sotto allenta la postura di sicurezza del container CLI
    ripristinando le capability predefinite di Docker, quindi usalo solo per il comando CLI una tantum
    che richiede accesso al registry dei pacchetti, non come invocazione Compose
    predefinita:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Se hai già creato un container `openclaw-cli` a lunga esecuzione, ricrealo
    con lo stesso override. `docker compose exec` e `docker exec` non possono
    modificare le capability Linux su un container già creato.

  </Accordion>

  <Accordion title="Permessi ed EACCES">
    L'immagine viene eseguita come `node` (uid 1000). Se vedi errori di permesso su
    `/home/node/.openclaw`, assicurati che i bind mount dell'host appartengano all'uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    La stessa mancata corrispondenza può comparire come un avviso di plugin, ad esempio
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    seguito da `plugin present but blocked`. Questo significa che l'uid del processo e il
    proprietario della directory plugin montata non coincidono. Preferisci eseguire il container con l'uid
    predefinito 1000 e correggere la proprietà del bind mount. Esegui chown
    di `/path/to/openclaw-config/npm` a `root:root` solo se intendi eseguire
    OpenClaw come root a lungo termine.

  </Accordion>

  <Accordion title="Ricostruzioni più rapide">
    Ordina il tuo Dockerfile in modo che i layer delle dipendenze vengano memorizzati nella cache. Questo evita di rieseguire
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

  <Accordion title="Opzioni container per utenti avanzati">
    L'immagine predefinita dà priorità alla sicurezza e viene eseguita come `node` non root. Per un container
    con funzionalità più complete:

    1. **Persistere `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Integrare dipendenze di sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Installare i browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Persistere i download dei browser**: usa `OPENCLAW_HOME_VOLUME` o
       `OPENCLAW_EXTRA_MOUNTS`. OpenClaw rileva automaticamente Chromium gestito da Playwright
       dell'immagine Docker su Linux.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker headless)">
    Se scegli OAuth OpenAI Codex nella procedura guidata, viene aperto un URL nel browser. In
    configurazioni Docker o headless, copia l'URL di redirect completo su cui arrivi e incollalo
    di nuovo nella procedura guidata per completare l'autenticazione.
  </Accordion>

  <Accordion title="Metadati dell'immagine base">
    L'immagine runtime Docker principale usa `node:24-bookworm-slim` e include `tini` come processo init di entrypoint (PID 1) per garantire che i processi zombie vengano raccolti e che i segnali siano gestiti correttamente nei container a lunga esecuzione. Pubblica annotazioni OCI dell'immagine base, incluse `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e altre. Il digest base di Node viene
    aggiornato tramite PR Dependabot per l'immagine base Docker; le build di rilascio non eseguono
    un layer di aggiornamento della distro. Vedi
    [annotazioni immagine OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### In esecuzione su una VPS?

Vedi [Hetzner (Docker VPS)](/it/install/hetzner) e
[Docker VM Runtime](/it/install/docker-vm-runtime) per i passaggi di distribuzione su VM condivisa,
inclusi integrazione del binario, persistenza e aggiornamenti.

## Sandbox dell'agente

Quando `agents.defaults.sandbox` è abilitato con il backend Docker, il gateway
esegue l'esecuzione degli strumenti dell'agente (shell, lettura/scrittura file, ecc.) dentro container Docker
isolati, mentre il gateway stesso rimane sull'host. Questo ti dà una barriera solida
intorno a sessioni agente non attendibili o multi-tenant senza containerizzare l'intero
gateway.

L'ambito della sandbox può essere per agente (predefinito), per sessione o condiviso. Ogni ambito
ottiene il proprio workspace montato in `/workspace`. Puoi anche configurare
policy di strumenti allow/deny, isolamento di rete, limiti di risorse e container
browser.

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

Costruisci l'immagine sandbox predefinita (da un checkout del sorgente):

```bash
scripts/sandbox-setup.sh
```

Per installazioni npm senza checkout del sorgente, vedi [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) per i comandi `docker build` inline.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Immagine mancante o container sandbox non avviato">
    Costruisci l'immagine sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    (checkout del sorgente) o con il comando `docker build` inline da [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) (installazione npm),
    oppure imposta `agents.defaults.sandbox.docker.image` sulla tua immagine personalizzata.
    I container vengono creati automaticamente per sessione su richiesta.
  </Accordion>

  <Accordion title="Errori di permesso nella sandbox">
    Imposta `docker.user` su un UID:GID che corrisponda alla proprietà del workspace montato,
    oppure esegui chown della cartella workspace.
  </Accordion>

  <Accordion title="Strumenti personalizzati non trovati nella sandbox">
    OpenClaw esegue i comandi con `sh -lc` (shell di login), che carica
    `/etc/profile` e può reimpostare PATH. Imposta `docker.env.PATH` per anteporre i percorsi
    degli strumenti personalizzati, oppure aggiungi uno script sotto `/etc/profile.d/` nel tuo Dockerfile.
  </Accordion>

  <Accordion title="Terminato per OOM durante la build dell'immagine (exit 137)">
    La VM richiede almeno 2 GB di RAM. Usa una classe macchina più grande e riprova.
  </Accordion>

  <Accordion title="Non autorizzato o pairing richiesto nella Control UI">
    Recupera un link dashboard aggiornato e approva il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Maggiori dettagli: [Dashboard](/it/web/dashboard), [Dispositivi](/it/cli/devices).

  </Accordion>

  <Accordion title="Il target Gateway mostra ws://172.x.x.x o errori di pairing dalla Docker CLI">
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
