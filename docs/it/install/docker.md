---
read_when:
    - Si desidera un Gateway containerizzato anziché installazioni locali
    - Si sta convalidando il flusso Docker
summary: Configurazione e onboarding facoltativi basati su Docker per OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-07-16T14:27:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8e1fb302763fd21f7a24947c95ab059ddfe92b3f5b3c0df68023a8087672ae4e
    source_path: install/docker.md
    workflow: 16
---

Docker è **opzionale**. Va utilizzato per un ambiente Gateway isolato e temporaneo o per un host privo di installazioni locali. Se lo sviluppo avviene già sulla propria macchina, utilizzare invece il normale flusso di installazione.

Il backend sandbox predefinito utilizza Docker quando `agents.defaults.sandbox` è abilitato, ma il sandboxing è disattivato per impostazione predefinita e non richiede che il Gateway stesso venga eseguito in Docker. Sono disponibili anche i backend sandbox SSH e OpenShell; vedere [Sandboxing](/it/gateway/sandboxing).

Si ospitano più utenti? Vedere [Hosting multi-tenant](/it/gateway/multi-tenant-hosting) per il modello con una cella per tenant.

## Prerequisiti

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la creazione dell'immagine (`pnpm install` potrebbe essere terminato per esaurimento della memoria negli host con 1 GB, con codice di uscita 137)
- Spazio su disco sufficiente per immagini e log
- Su un VPS/host pubblico, consultare [Rafforzamento della sicurezza per l'esposizione di rete](/it/gateway/security), in particolare la catena firewall Docker `DOCKER-USER`

## Gateway in container

<Steps>
  <Step title="Creare l'immagine">
    Dalla radice del repository:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Questo comando crea localmente l'immagine del Gateway come `openclaw:local`. Per utilizzare invece un'immagine precompilata:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Le immagini precompilate vengono pubblicate innanzitutto nel [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw). GHCR è il registro principale per l'automazione dei rilasci, le distribuzioni con versione fissata e le verifiche della provenienza. Lo stesso rilascio pubblica un mirror su Docker Hub all'indirizzo `openclaw/openclaw`:

    ```bash
    export OPENCLAW_IMAGE="openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Utilizzare `ghcr.io/openclaw/openclaw` o `openclaw/openclaw` ed evitare i mirror non ufficiali, che non condividono la pianificazione dei rilasci o i criteri di conservazione di OpenClaw. Tag ufficiali: `main`, `latest`, `<version>` (ad es. `2026.2.26`) e tag beta come `2026.2.26-beta.1` (le versioni beta non spostano mai `latest`/`main`). L'immagine predefinita `main`/`latest`/`<version>` include i plugin `codex` e `diagnostics-otel`. Viene inoltre distribuita una variante `-browser` (ad es. `latest-browser`) che include Chromium, utile per lo strumento [browser in sandbox](/it/gateway/sandboxing#sandboxed-browser) senza dover installare Playwright al primo avvio.

  </Step>

  <Step title="Rieseguire in un ambiente isolato dalla rete">
    Sugli host offline, trasferire e caricare prima l'immagine:

    ```bash
    docker load -i openclaw-image.tar
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh --offline
    ```

    `--offline` verifica che `OPENCLAW_IMAGE` esista già localmente, disabilita i pull e le build implicite di Compose, quindi esegue il flusso normale: sincronizzazione di `.env`, correzioni delle autorizzazioni, onboarding, sincronizzazione della configurazione del Gateway e avvio di Compose.

    Se `OPENCLAW_SANDBOX=1`, la configurazione offline verifica anche le immagini sandbox predefinite e specifiche per agente configurate sul daemon associato a `OPENCLAW_DOCKER_SOCKET`, inclusa l'etichetta del contratto del browser nelle immagini browser basate su Docker. Se un'immagine richiesta manca o è obsoleta, la configurazione termina senza modificare la configurazione della sandbox, anziché segnalare erroneamente un esito positivo.

  </Step>

  <Step title="Completare l'onboarding">
    Lo script di configurazione esegue automaticamente l'onboarding:

    - richiede le chiavi API del provider
    - genera un token del Gateway e lo scrive in `.env`
    - crea la directory della chiave segreta del profilo di autenticazione
    - avvia il Gateway tramite Docker Compose

    L'onboarding precedente all'avvio e le scritture della configurazione vengono eseguiti direttamente tramite `openclaw-gateway` (con `--no-deps --entrypoint node`), poiché `openclaw-cli` condivide lo spazio dei nomi di rete del Gateway e funziona solo dopo la creazione del container del Gateway.

  </Step>

  <Step title="Aprire l'interfaccia di controllo">
    Aprire `http://127.0.0.1:18789/` e incollare in Settings il token scritto in `.env`. Se l'autenticazione del container è stata impostata tramite password, utilizzare invece tale password.

    Serve nuovamente l'URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configurare i canali (facoltativo)">
    ```bash
    # WhatsApp (codice QR)
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

```bash
BUILD_GIT_COMMIT="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
docker build \
  --build-arg "GIT_COMMIT=${BUILD_GIT_COMMIT}" \
  --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
  -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

Il contesto Docker esclude `.git`. Passare l'identità del sorgente come argomenti di build,
come mostrato sopra, affinché la schermata Informazioni dell'immagine riporti il commit estratto e
un singolo timestamp di build. `scripts/docker/setup.sh` risolve e passa automaticamente
entrambi i valori.

<Note>
Eseguire `docker compose` dalla radice del repository. Se è stato abilitato `OPENCLAW_EXTRA_MOUNTS` o `OPENCLAW_HOME_VOLUME`, lo script di configurazione scrive `docker-compose.extra.yml`; includerlo dopo qualsiasi `docker-compose.override.yml` gestito autonomamente, ad es. `-f docker-compose.yml -f docker-compose.override.yml -f docker-compose.extra.yml`.
</Note>

### Aggiornamento delle immagini dei container

Quando si sostituisce l'immagine OpenClaw mantenendo lo stesso stato e la stessa configurazione montati, il
nuovo Gateway esegue migrazioni di aggiornamento sicure all'avvio e la convergenza dei plugin prima
di risultare pronto. Gli aggiornamenti ordinari delle immagini non dovrebbero richiedere un'esecuzione
separata di `openclaw doctor --fix`.

Se all'avvio non è possibile completare queste riparazioni in modo sicuro, il Gateway termina anziché
segnalare uno stato integro. In presenza di un criterio di riavvio, Docker, Podman o Kubernetes potrebbero mostrare
il riavvio del container del Gateway. Mantenere montato il volume di stato, quindi eseguire
una volta la stessa immagine con `openclaw doctor --fix` come comando del container, utilizzando gli
stessi montaggi di stato/configurazione utilizzati dal Gateway:

```bash
docker run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
podman run --rm -v <openclaw-state>:/home/node/.openclaw <image> openclaw doctor --fix
```

Al termine di doctor, riavviare il container del Gateway con il comando predefinito.
In Kubernetes, eseguire lo stesso comando in un Job temporaneo o in un pod di debug montato sullo
stesso PVC, quindi riavviare il Deployment o lo StatefulSet.

### Variabili di ambiente

Variabili facoltative accettate da `scripts/docker/setup.sh` (e, per il container del Gateway, direttamente da `docker-compose.yml`):

| Variabile                                        | Scopo                                                                                                           |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                                | Utilizzare un'immagine remota anziché crearla localmente                                                                    |
| `OPENCLAW_IMAGE_APT_PACKAGES`                   | Installare pacchetti apt aggiuntivi durante la build (separati da spazi). Alias precedente: `OPENCLAW_DOCKER_APT_PACKAGES`           |
| `OPENCLAW_IMAGE_PIP_PACKAGES`                   | Installare pacchetti Python aggiuntivi durante la build (separati da spazi)                                                      |
| `OPENCLAW_EXTENSIONS`                           | Compilare/creare i pacchetti dei plugin selezionati supportati e installarne le dipendenze di runtime (ID separati da virgole o spazi) |
| `OPENCLAW_DOCKER_BUILD_NODE_OPTIONS`            | Sostituire le opzioni di Node per la build locale dai sorgenti (valore predefinito `--max-old-space-size=8192`)                                |
| `OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB` | Sostituire l'heap tsdown della build locale dai sorgenti in MB                                                                 |
| `OPENCLAW_DOCKER_BUILD_SKIP_DTS`                | Omettere la generazione delle dichiarazioni durante le build locali di immagini per il solo runtime (valore predefinito `1`)                                      |
| `OPENCLAW_INSTALL_BROWSER`                      | Includere Chromium + Xvfb nell'immagine durante la build                                                                 |
| `OPENCLAW_EXTRA_MOUNTS`                         | Montaggi bind aggiuntivi dell'host (`source:target[:opts]` separati da virgole)                                                   |
| `OPENCLAW_HOME_VOLUME`                          | Rendere persistente `/home/node` in un volume Docker denominato                                                                     |
| `OPENCLAW_SANDBOX`                              | Abilitare il bootstrap della sandbox (`1`, `true`, `yes`, `on`)                                                            |
| `OPENCLAW_SKIP_ONBOARDING`                      | Omettere il passaggio interattivo di onboarding (`1`, `true`, `yes`, `on`)                                                   |
| `OPENCLAW_DOCKER_SOCKET`                        | Sostituire il percorso del socket Docker                                                                                   |
| `OPENCLAW_DISABLE_BONJOUR`                      | Forzare l'attivazione (`0`) o la disattivazione (`1`) dell'annuncio Bonjour/mDNS; vedere [Bonjour / mDNS](#bonjour--mdns)                        |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`      | Disabilitare le sovrapposizioni dei montaggi bind dei sorgenti dei plugin inclusi                                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT`                   | Endpoint condiviso del raccoglitore OTLP/HTTP per l'esportazione OpenTelemetry                                                      |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`                 | Endpoint OTLP specifici per segnali relativi a tracce, metriche o log                                                       |
| `OTEL_EXPORTER_OTLP_PROTOCOL`                   | Sostituzione del protocollo OTLP. Attualmente è supportato solo `http/protobuf`                                                   |
| `OTEL_SERVICE_NAME`                             | Nome del servizio utilizzato per le risorse OpenTelemetry                                                                     |
| `OTEL_SEMCONV_STABILITY_OPT_IN`                 | Abilitare gli attributi semantici sperimentali GenAI più recenti                                                           |
| `OPENCLAW_OTEL_PRELOADED`                       | Evitare di avviare un secondo SDK OpenTelemetry quando ne è già stato precaricato uno                                                    |

L'immagine ufficiale non include Homebrew. Durante l'onboarding, OpenClaw nasconde gli installer delle dipendenze delle Skills disponibili solo tramite brew in un container Linux privo di `brew`; fornire tali dipendenze tramite un'immagine personalizzata oppure installarle manualmente. Utilizzare `OPENCLAW_IMAGE_APT_PACKAGES` per le dipendenze distribuite come pacchetti Debian e `OPENCLAW_IMAGE_PIP_PACKAGES` per le dipendenze Python (esegue `python3 -m pip install --break-system-packages` durante la build, quindi fissare le versioni e utilizzare esclusivamente indici attendibili).

Se Docker segnala `ResourceExhausted`, `cannot allocate memory` o si interrompe durante `tsdown`, aumentare il limite di memoria del builder Docker oppure riprovare con heap espliciti più piccoli:

```bash
OPENCLAW_DOCKER_BUILD_NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_DOCKER_BUILD_TSDOWN_MAX_OLD_SPACE_MB=4096
```

### Immagini create dai sorgenti con plugin selezionati

`OPENCLAW_EXTENSIONS` seleziona gli ID dei manifest dei plugin dal checkout sorgente;
sono accettati anche i nomi esistenti delle directory sorgente quando differiscono. La build Docker
risolve una sola volta la selezione nelle directory sorgente, installa le dipendenze
di produzione e, quando un plugin selezionato viene pubblicato separatamente con
`openclaw.build.bundledDist: false`, ne compila il runtime nella distribuzione
inclusa nel bundle principale. Questo processo di pacchettizzazione esclusivo di Docker non modifica il contratto dell'artefatto npm o ClawHub
del plugin. Gli ID sconosciuti, non validi o ambigui causano il fallimento della build dell'immagine.
Gli ID noti riservati alle dipendenze o al sorgente mantengono la gestione temporanea
esistente del sorgente e delle dipendenze senza ottenere una voce compilata nella distribuzione principale. Un plugin selezionato con
voci di build unificate deve essere compilato correttamente; il sorgente e l'output di runtime
dei plugin esterni non selezionati vengono rimossi.

Ad esempio, questi comandi creano immagini gateway FakeCo autonome,
separate e multiarchitettura per ClickClack, Slack e Microsoft Teams. ClawRouter fa
già parte del runtime principale di OpenClaw, quindi l'immagine ClickClack seleziona solo
`clickclack`. L'argomento esplicitamente vuoto per il browser mantiene l'immagine predefinita priva
di Chromium:

```bash
SOURCE_SHA="$(git rev-parse HEAD)"
BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
REGISTRY="registry.example.com/fakeco"

build_gateway_image() {
  gateway="$1"
  selected_plugin="$2"
  docker buildx build \
    --platform linux/amd64,linux/arm64 \
    --build-arg "GIT_COMMIT=${SOURCE_SHA}" \
    --build-arg "OPENCLAW_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}" \
    --build-arg "OPENCLAW_EXTENSIONS=${selected_plugin}" \
    --build-arg OPENCLAW_INSTALL_BROWSER= \
    --provenance=mode=max \
    --sbom=true \
    --tag "${REGISTRY}/openclaw-${gateway}:${SOURCE_SHA}" \
    --push \
    .
}

build_gateway_image clickclack clickclack
build_gateway_image slack slack
build_gateway_image teams msteams
```

Utilizzare `--platform linux/arm64 --load` o `--platform linux/amd64 --load` per una
singola build locale nativa. L'output multipiattaforma e le attestazioni SBOM/provenienza
allegate richiedono un registro o un altro output Buildx che conservi le attestazioni. Dopo
il push, esaminare il manifest e distribuire il digest immutabile anziché il
tag SHA del sorgente modificabile:

```bash
docker buildx imagetools inspect \
  "${REGISTRY}/openclaw-clickclack:${SOURCE_SHA}"
# Distribuire: registry.example.com/fakeco/openclaw-clickclack@sha256:<manifest-digest>
```

Queste immagini sono destinate ai gateway autonomi basati su OCI e agli utenti Docker generici.
I gateway gestiti da Crabhelm non le utilizzano: quel percorso di distribuzione crea un
archivio appliance x86_64 separato contenente un tarball npm di OpenClaw e blocca
i digest di Node, dell'archivio e del manifest. Creare tale appliance separatamente
dallo stesso sorgente OpenClaw integrato.

Per testare il sorgente di un plugin incluso nel bundle rispetto a un'immagine pacchettizzata, montare una directory sorgente del plugin sul relativo percorso sorgente pacchettizzato, ad esempio `OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`. Ciò sostituisce il bundle compilato `/app/dist/extensions/synology-chat` corrispondente per lo stesso ID plugin.

### Osservabilità

L'esportazione OpenTelemetry è in uscita dal contenitore Gateway verso il collector OTLP; non richiede la pubblicazione di alcuna porta Docker. Per includere l'esportatore incluso nel bundle in un'immagine creata localmente:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

Le immagini ufficiali precompilate includono già `diagnostics-otel`; installare autonomamente `clawhub:@openclaw/diagnostics-otel` solo se è stato rimosso. Per abilitare l'esportazione, consentire e abilitare il plugin `diagnostics-otel` nella configurazione, quindi impostare `diagnostics.otel.enabled=true` (vedere l'esempio completo in [Esportazione OpenTelemetry](/it/gateway/opentelemetry)). Le intestazioni di autenticazione del collector vengono gestite tramite `diagnostics.otel.headers`, non tramite variabili di ambiente Docker.

Le metriche Prometheus riutilizzano la porta Gateway già pubblicata. Installare `clawhub:@openclaw/diagnostics-prometheus`, abilitare il plugin `diagnostics-prometheus`, quindi eseguire lo scraping:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route è protetta dall'autenticazione del Gateway; non esporre una porta pubblica `/metrics` separata né un percorso di reverse proxy non autenticato. Vedere [Metriche Prometheus](/it/gateway/prometheus).

### Controlli di integrità

Endpoint di verifica del contenitore (nessuna autenticazione richiesta):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # operatività
curl -fsS http://127.0.0.1:18789/readyz     # disponibilità
```

Il `HEALTHCHECK` integrato nell'immagine interroga `/healthz`; i fallimenti ripetuti contrassegnano il contenitore come `unhealthy`, consentendo agli orchestratori di riavviarlo o sostituirlo.

Snapshot approfondito e autenticato dello stato di integrità:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN e loopback

`scripts/docker/setup.sh` usa come valore predefinito `OPENCLAW_GATEWAY_BIND=lan`, affinché `http://127.0.0.1:18789` sull'host funzioni con la pubblicazione delle porte Docker.

- `lan` (predefinito): il browser e la CLI dell'host possono raggiungere la porta pubblicata del gateway.
- `loopback`: solo i processi nello spazio dei nomi di rete del contenitore possono raggiungere direttamente il gateway.

<Note>
Utilizzare i valori della modalità di binding in `gateway.bind` (`lan` / `loopback` / `custom` / `tailnet` / `auto`), non alias dell'host come `0.0.0.0` o `127.0.0.1`.
</Note>

### Provider locali dell'host

All'interno del contenitore, `127.0.0.1` indica il contenitore stesso, non l'host. Utilizzare `host.docker.internal` per i provider in esecuzione sull'host:

| Provider  | URL predefinito dell'host         | URL di configurazione Docker                    |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

La configurazione inclusa nel bundle utilizza tali URL come valori predefiniti per l'onboarding di LM Studio/Ollama e `docker-compose.yml` associa `host.docker.internal` al gateway dell'host su Docker Engine per Linux (Docker Desktop fornisce lo stesso alias su macOS/Windows). I servizi dell'host devono essere in ascolto su un indirizzo raggiungibile da Docker:

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

Si utilizza un file Compose personalizzato o `docker run`? Aggiungere autonomamente la stessa associazione, ad esempio `--add-host=host.docker.internal:host-gateway`.

### Backend Claude CLI in Docker

L'immagine ufficiale non preinstalla Claude Code. Installarlo ed effettuare l'accesso all'interno dell'utente `node` del contenitore, quindi rendere persistente la home del contenitore affinché gli aggiornamenti dell'immagine non eliminino il binario o lo stato di autenticazione.

Per una nuova installazione, abilitare un volume `/home/node` persistente prima di eseguire la configurazione:

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
export OPENCLAW_HOME_VOLUME="openclaw_home"
./scripts/docker/setup.sh
```

Per un'installazione esistente, arrestare lo stack e ricaricare prima i valori `.env` correnti: lo script di configurazione riscrive sempre `.env` utilizzando la shell corrente e i valori predefiniti, senza leggere autonomamente il file:

```bash
set -a
. ./.env
set +a
export OPENCLAW_HOME_VOLUME="${OPENCLAW_HOME_VOLUME:-openclaw_home}"
./scripts/docker/setup.sh
```

Se `.env` contiene valori che la shell non può importare, riesportare prima manualmente quelli utilizzati (`OPENCLAW_IMAGE`, porte, modalità di binding, percorsi personalizzati, `OPENCLAW_EXTRA_MOUNTS`, sandbox, esclusione dell'onboarding). L'overlay generato monta il volume home sia per `openclaw-gateway` sia per `openclaw-cli`; eseguire i comandi rimanenti con tale overlay (e prima `docker-compose.override.yml`, se utilizzato):

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  --entrypoint sh openclaw-cli -lc \
  'curl -fsSL https://claude.ai/install.sh | bash'
```

L'installer nativo scrive `claude` in `/home/node/.local/bin/claude`. Configurare OpenClaw affinché utilizzi tale percorso:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli config set \
  agents.defaults.cliBackends.claude-cli.command \
  /home/node/.local/bin/claude
```

Effettuare l'accesso e verificare dalla stessa home persistente:

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

Quindi utilizzare il backend `claude-cli` incluso nel bundle:

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml run --rm \
  openclaw-cli agent \
  --agent main \
  --model claude-cli/claude-sonnet-4-6 \
  --message "Saluta da Docker Claude CLI"
```

`OPENCLAW_HOME_VOLUME` rende persistente l'installazione nativa in `/home/node/.local/bin` e `/home/node/.local/share/claude`, oltre alle impostazioni e all'autenticazione di Claude Code in `/home/node/.claude` e `/home/node/.claude.json`. Rendere persistente solo `/home/node/.openclaw` non è sufficiente; se si utilizza `OPENCLAW_EXTRA_MOUNTS` anziché un volume home, montare tutti questi percorsi Claude in entrambi i servizi.

<Note>
Per l'automazione di produzione condivisa o una fatturazione Anthropic prevedibile, preferire il percorso basato sulla chiave API Anthropic. Il riutilizzo di Claude CLI segue la versione installata, l'accesso all'account, la fatturazione e il comportamento di aggiornamento di Claude Code.
</Note>

### Bonjour / mDNS

La rete bridge Docker generalmente non inoltra in modo affidabile il multicast Bonjour/mDNS (`224.0.0.251:5353`). Quando `OPENCLAW_DISABLE_BONJOUR` non è impostato, il plugin Bonjour incluso nel bundle disabilita automaticamente la pubblicizzazione LAN quando rileva di essere in esecuzione in un contenitore, evitando così un ciclo di arresti anomali dovuto ai tentativi ripetuti di inviare multicast scartato dal bridge. Impostare `OPENCLAW_DISABLE_BONJOUR=1` per disabilitarlo forzatamente indipendentemente dal rilevamento oppure `0` per abilitarlo forzatamente (solo con rete host, macvlan o un'altra rete in cui è noto che il multicast mDNS funzioni).

Negli altri casi, per gli host Docker utilizzare l'URL Gateway pubblicato, Tailscale o DNS-SD geografico. Vedere [Rilevamento Bonjour](/it/gateway/bonjour) per le problematiche note e la risoluzione dei problemi.

### Archiviazione e persistenza

Docker Compose monta tramite bind `OPENCLAW_CONFIG_DIR` in `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` in `/home/node/.openclaw/workspace` e `OPENCLAW_AUTH_PROFILE_SECRET_DIR` in `/home/node/.config/openclaw`, affinché tali percorsi sopravvivano alla sostituzione del contenitore. Quando una variabile non è impostata, `docker-compose.yml` utilizza un percorso di fallback in `${HOME}`, oppure `/tmp` se `HOME` stesso è assente, affinché `docker compose up` non generi mai una specifica del volume con un'origine vuota negli ambienti essenziali.

La directory di configurazione montata contiene:

- `openclaw.json` per la configurazione del comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l'autenticazione OAuth/con chiave API archiviata dei provider
- `.env` per i segreti di runtime basati sull'ambiente, come `OPENCLAW_GATEWAY_TOKEN`

La directory dei segreti del profilo di autenticazione archivia la chiave di crittografia locale per il materiale dei token dei profili di autenticazione basati su OAuth. Conservarla con lo stato dell'host Docker, ma separata da `OPENCLAW_CONFIG_DIR`.

I plugin scaricabili installati archiviano lo stato dei pacchetti nella home OpenClaw montata, affinché i record di installazione e le directory principali dei pacchetti sopravvivano alla sostituzione del contenitore; l'avvio del gateway non rigenera gli alberi delle dipendenze dei plugin inclusi nel bundle.

Per tutti i dettagli sulla persistenza della macchina virtuale, vedere [Runtime della VM Docker - Cosa viene mantenuto e dove](/it/install/docker-vm-runtime#what-persists-where).

**Principali fonti di crescita dell'utilizzo del disco:** `media/`, database SQLite per agente, trascrizioni JSONL delle sessioni precedenti, database SQLite condiviso dello stato, directory principali dei pacchetti dei plugin installati e log su file a rotazione in `/tmp/openclaw/`.

### Helper della shell (facoltativi)

Per abbreviare i comandi quotidiani, installare [ClawDock](/it/install/clawdock):

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se l'installazione è stata eseguita dal precedente percorso `scripts/shell-helpers/clawdock-helpers.sh`, eseguire nuovamente il comando precedente affinché l'helper locale utilizzi il percorso corrente. Quindi usare `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, ecc. (eseguire `clawdock-help` per l'elenco completo).

<AccordionGroup>
  <Accordion title="Abilitare la sandbox dell'agente per il Gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Percorso del socket personalizzato (ad es. Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Lo script monta `docker.sock` solo dopo che i prerequisiti della sandbox sono stati soddisfatti. Se la configurazione della sandbox non può essere completata, reimposta `agents.defaults.sandbox.mode` su `off`. La modalità codice di Codex è disabilitata per i turni in cui la sandbox di OpenClaw è attiva (vedere [Sandboxing § Backend Docker](/it/gateway/sandboxing#docker-backend)); non montare mai il socket Docker dell'host nei container sandbox degli agenti.

  </Accordion>

  <Accordion title="Automazione / CI (non interattiva)">
    Disabilitare l'allocazione pseudo-TTY di Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota sulla sicurezza della rete condivisa">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` affinché i comandi della CLI possano raggiungere il Gateway tramite `127.0.0.1`. Considerarlo un confine di attendibilità condiviso. La configurazione Compose rimuove `NET_RAW`/`NET_ADMIN` e abilita `no-new-privileges` sia su `openclaw-gateway` sia su `openclaw-cli`.
  </Accordion>

  <Accordion title="Errori DNS di Docker Desktop in openclaw-cli">
    In alcune configurazioni di Docker Desktop, le ricerche DNS dal sidecar `openclaw-cli` della rete condivisa non riescono dopo la rimozione di `NET_RAW`, manifestandosi come `EAI_AGAIN` durante comandi basati su npm come `openclaw plugins install`. Mantenere il file Compose predefinito con protezioni avanzate per il normale funzionamento. L'override seguente ripristina le funzionalità predefinite solo per il container `openclaw-cli`: usarlo per il singolo comando che richiede l'accesso al registro, non come invocazione predefinita:

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    Se è già stato creato un container `openclaw-cli` a lunga esecuzione, ricrearlo con lo stesso override: `docker compose exec`/`docker exec` non possono modificare le funzionalità Linux di un container già creato.

  </Accordion>

  <Accordion title="Autorizzazioni ed EACCES">
    L'immagine viene eseguita come `node` (uid 1000). Se si verificano errori di autorizzazione su `/home/node/.openclaw`, assicurarsi che i bind mount dell'host appartengano all'uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    La stessa mancata corrispondenza può manifestarsi come `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` seguito da `plugin present but blocked`: l'uid del processo e il proprietario della directory del Plugin montata non corrispondono. È preferibile eseguire il processo con l'uid predefinito 1000 e correggere la proprietà del bind mount. Modificare il proprietario di `/path/to/openclaw-config/npm` in `root:root` solo se si intende eseguire OpenClaw come root a lungo termine.

  </Accordion>

  <Accordion title="Ricompilazioni più rapide">
    Ordinare il Dockerfile in modo che i livelli delle dipendenze vengano memorizzati nella cache, evitando di rieseguire `pnpm install` a meno che i lockfile non cambino:

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

  <Accordion title="Opzioni del container per utenti avanzati">
    L'immagine predefinita privilegia la sicurezza e viene eseguita come utente non root `node`. Per un container con più funzionalità:

    1. **Rendere persistente `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Integrare le dipendenze di sistema**: `export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **Integrare le dipendenze Python**: `export OPENCLAW_IMAGE_PIP_PACKAGES="requests==2.32.5 humanize==4.14.0"`
    4. **Integrare Playwright Chromium**: `export OPENCLAW_INSTALL_BROWSER=1`, oppure usare il tag ufficiale dell'immagine `-browser`
    5. **Oppure installare i browser Playwright in un volume persistente**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    6. **Rendere persistenti i download dei browser**: usare `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`. OpenClaw rileva automaticamente su Linux il Chromium gestito da Playwright incluso nell'immagine.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker headless)">
    Se nella procedura guidata si seleziona OAuth OpenAI Codex, viene aperto un URL nel browser. Nelle configurazioni Docker o headless, copiare l'URL di reindirizzamento completo della pagina di destinazione e incollarlo nuovamente nella procedura guidata per completare l'autenticazione.
  </Accordion>

  <Accordion title="Metadati dell'immagine di base">
    L'immagine di runtime usa `node:24-bookworm-slim` ed esegue `tini` come PID 1, in modo che i processi zombie vengano terminati e i segnali siano gestiti correttamente nei container a lunga esecuzione. Pubblica annotazioni dell'immagine di base OCI, incluse `org.opencontainers.image.base.name` e `org.opencontainers.image.source`. Dependabot aggiorna il digest fissato dell'immagine Node di base; le build di rilascio non eseguono un livello separato di aggiornamento della distribuzione. Vedere [Annotazioni delle immagini OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Esecuzione su un VPS?

Vedere [Hetzner (VPS Docker)](/it/install/hetzner) e [Runtime VM Docker](/it/install/docker-vm-runtime) per i passaggi di distribuzione su VM condivise, tra cui l'integrazione dei binari, la persistenza e gli aggiornamenti.

## Sandbox dell'agente

Quando `agents.defaults.sandbox` è abilitato con il backend Docker, il Gateway esegue gli strumenti dell'agente (shell, lettura/scrittura di file, ecc.) all'interno di container Docker isolati, mentre il Gateway stesso rimane sull'host: una barriera rigida attorno alle sessioni degli agenti non attendibili o multi-tenant, senza inserire l'intero Gateway in un container.

L'ambito della sandbox può essere per agente (impostazione predefinita), per sessione o condiviso; ogni ambito dispone di un proprio spazio di lavoro montato in `/workspace`. È inoltre possibile configurare criteri di autorizzazione/negazione degli strumenti, isolamento della rete, limiti delle risorse e container per browser.

Per la configurazione completa, le immagini, le note sulla sicurezza e i profili multi-agente:

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo della sandbox
- [OpenShell](/it/gateway/openshell) -- accesso interattivo tramite shell ai container sandbox
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

Compilare l'immagine sandbox predefinita (da un checkout del codice sorgente):

```bash
scripts/sandbox-setup.sh
```

Per le installazioni npm senza checkout del codice sorgente, vedere [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) per i comandi `docker build` in linea.

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Immagine mancante o container sandbox non avviato">
    Compilare l'immagine sandbox con [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) (checkout del codice sorgente) o con il comando `docker build` in linea da [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup) (installazione npm), oppure impostare `agents.defaults.sandbox.docker.image` sull'immagine personalizzata. I container vengono creati automaticamente per ogni sessione, su richiesta.
  </Accordion>

  <Accordion title="Errori di autorizzazione nella sandbox">
    Impostare `docker.user` su un UID:GID corrispondente alla proprietà dello spazio di lavoro montato oppure modificare il proprietario della cartella dello spazio di lavoro.
  </Accordion>

  <Accordion title="Strumenti personalizzati non trovati nella sandbox">
    OpenClaw esegue i comandi con `sh -lc` (shell di login), che carica `/etc/profile` e potrebbe reimpostare PATH. Impostare `docker.env.PATH` per anteporre i percorsi degli strumenti personalizzati oppure aggiungere uno script in `/etc/profile.d/` nel Dockerfile.
  </Accordion>

  <Accordion title="Processo terminato per memoria esaurita durante la compilazione dell'immagine (codice di uscita 137)">
    La VM richiede almeno 2 GB di RAM. Usare una classe di macchina più grande e riprovare.
  </Accordion>

  <Accordion title="Autorizzazione non riuscita o associazione richiesta nell'interfaccia di controllo">
    Ottenere un nuovo link alla dashboard e approvare il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Maggiori dettagli: [Dashboard](/it/web/dashboard), [Dispositivi](/it/cli/devices).

  </Accordion>

  <Accordion title="La destinazione del Gateway mostra ws://172.x.x.x o la CLI Docker genera errori di associazione">
    Reimpostare la modalità e il bind del Gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Risorse correlate

- [Panoramica dell'installazione](/it/install) — tutti i metodi di installazione
- [Podman](/it/install/podman) — alternativa a Docker basata su Podman
- [ClawDock](/it/install/clawdock) — configurazione Docker Compose della community
- [Aggiornamento](/it/install/updating) — mantenere OpenClaw aggiornato
- [Configurazione](/it/gateway/configuration) — configurazione del Gateway dopo l'installazione
