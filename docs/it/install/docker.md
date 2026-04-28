---
read_when:
    - Vuoi un gateway containerizzato invece di installazioni locali
    - Stai convalidando il flusso Docker
summary: Configurazione e onboarding facoltativi basati su Docker per OpenClaw
title: Docker
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-26T11:31:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3483dafa6c8baa0d4ad12df1a457e07e3c8b4182a2c5e1649bc8db66ff4c676c
    source_path: install/docker.md
    workflow: 15
---

Docker è **facoltativo**. Usalo solo se vuoi un gateway containerizzato o per convalidare il flusso Docker.

## Docker fa al caso mio?

- **Sì**: vuoi un ambiente gateway isolato e usa e getta o vuoi eseguire OpenClaw su un host senza installazioni locali.
- **No**: stai eseguendo sul tuo computer e vuoi solo il ciclo di sviluppo più rapido. Usa invece il normale flusso di installazione.
- **Nota sul sandboxing**: il backend sandbox predefinito usa Docker quando il sandboxing è abilitato, ma il sandboxing è disattivato per impostazione predefinita e **non** richiede che l'intero gateway venga eseguito in Docker. Sono disponibili anche i backend sandbox SSH e OpenShell. Vedi [Sandboxing](/it/gateway/sandboxing).

## Prerequisiti

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la build dell'immagine (`pnpm install` può essere terminato per OOM su host da 1 GB con uscita 137)
- Spazio su disco sufficiente per immagini e log
- Se esegui su un VPS/host pubblico, consulta
  [Hardening della sicurezza per l'esposizione in rete](/it/gateway/security),
  in particolare la policy firewall Docker `DOCKER-USER`.

## Gateway containerizzato

<Steps>
  <Step title="Compila l'immagine">
    Dalla radice del repository, esegui lo script di configurazione:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Questo compila localmente l'immagine del gateway. Per usare invece un'immagine precompilata:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Le immagini precompilate sono pubblicate nel
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag comuni: `main`, `latest`, `<version>` (ad esempio `2026.2.26`).

  </Step>

  <Step title="Completa l'onboarding">
    Lo script di configurazione esegue automaticamente l'onboarding. Farà quanto segue:

    - chiederà le chiavi API del provider
    - genererà un token gateway e lo scriverà in `.env`
    - avvierà il gateway tramite Docker Compose

    Durante la configurazione, l'onboarding pre-avvio e le scritture di configurazione passano tramite
    `openclaw-gateway` direttamente. `openclaw-cli` serve per i comandi che esegui dopo
    che il container gateway esiste già.

  </Step>

  <Step title="Apri la Control UI">
    Apri `http://127.0.0.1:18789/` nel browser e incolla il segreto condiviso configurato in Settings. Lo script di configurazione scrive un token in `.env` per
    impostazione predefinita; se cambi la configurazione del container all'autenticazione con password, usa invece quella
    password.

    Ti serve di nuovo l'URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configura i canali (facoltativo)">
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

Se preferisci eseguire ogni passaggio tu stesso invece di usare lo script di configurazione:

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
strumento post-avvio. Prima di `docker compose up -d openclaw-gateway`, esegui onboarding
e scritture di configurazione in fase di setup tramite `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variabili d'ambiente

Lo script di configurazione accetta queste variabili d'ambiente facoltative:

| Variabile                                 | Scopo                                                           |
| ----------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                          | Usa un'immagine remota invece di compilare localmente           |
| `OPENCLAW_DOCKER_APT_PACKAGES`            | Installa pacchetti apt extra durante la build (separati da spazi) |
| `OPENCLAW_EXTENSIONS`                     | Preinstalla le dipendenze dei Plugin in fase di build (nomi separati da spazi) |
| `OPENCLAW_EXTRA_MOUNTS`                   | Mount bind host extra (separati da virgola `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`                    | Rende persistente `/home/node` in un volume Docker nominato     |
| `OPENCLAW_SANDBOX`                        | Opt-in al bootstrap del sandbox (`1`, `true`, `yes`, `on`)      |
| `OPENCLAW_DOCKER_SOCKET`                  | Sovrascrive il percorso del socket Docker                       |
| `OPENCLAW_DISABLE_BONJOUR`                | Disabilita advertising Bonjour/mDNS (predefinito `1` per Docker) |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | Disabilita gli overlay bind-mount del sorgente dei Plugin inclusi |
| `OTEL_EXPORTER_OTLP_ENDPOINT`             | Endpoint condiviso del collector OTLP/HTTP per l'export OpenTelemetry |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`           | Endpoint OTLP specifici per segnale per trace, metriche o log   |
| `OTEL_EXPORTER_OTLP_PROTOCOL`             | Override del protocollo OTLP. Oggi è supportato solo `http/protobuf` |
| `OTEL_SERVICE_NAME`                       | Nome del servizio usato per le risorse OpenTelemetry            |
| `OTEL_SEMCONV_STABILITY_OPT_IN`           | Opt-in agli ultimi attributi semantici sperimentali GenAI       |
| `OPENCLAW_OTEL_PRELOADED`                 | Salta l'avvio di un secondo SDK OpenTelemetry quando uno è già precaricato |

I maintainer possono testare il sorgente di un Plugin incluso rispetto a un'immagine pacchettizzata montando
una directory sorgente del plugin sopra il relativo percorso del sorgente pacchettizzato, per esempio
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`.
Quella directory sorgente montata sovrascrive il bundle compilato corrispondente
`/app/dist/extensions/synology-chat` per lo stesso id plugin.

### Osservabilità

L'export OpenTelemetry è in uscita dal container Gateway verso il tuo collector OTLP.
Non richiede una porta Docker pubblicata. Se compili l'immagine
localmente e vuoi che l'exporter OpenTelemetry incluso sia disponibile all'interno dell'immagine,
includi le sue dipendenze runtime:

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

L'immagine Docker di rilascio ufficiale OpenClaw include il sorgente del Plugin
`diagnostics-otel` incluso. A seconda dello stato dell'immagine e della cache, il
Gateway può comunque preparare le dipendenze runtime OpenTelemetry locali del plugin al
primo avvio in cui il plugin viene abilitato, quindi consenti a quel primo avvio di raggiungere il
registry dei pacchetti o preriscalda l'immagine nel tuo lane di rilascio. Per abilitare l'export, consenti e
abilita il Plugin `diagnostics-otel` nella configurazione, quindi imposta
`diagnostics.otel.enabled=true` o usa l'esempio di configurazione in
[Export OpenTelemetry](/it/gateway/opentelemetry). Gli header di autenticazione del collector vengono
configurati tramite `diagnostics.otel.headers`, non tramite variabili d'ambiente Docker.

Le metriche Prometheus usano la porta Gateway già pubblicata. Abilita il
Plugin `diagnostics-prometheus`, quindi fai scrape di:

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

La route è protetta dall'autenticazione del Gateway. Non esporre una porta
pubblica `/metrics` separata né un percorso di reverse proxy non autenticato. Vedi
[Metriche Prometheus](/it/gateway/prometheus).

### Controlli di integrità

Endpoint probe del container (nessuna autenticazione richiesta):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L'immagine Docker include un `HEALTHCHECK` integrato che effettua ping a `/healthz`.
Se i controlli continuano a fallire, Docker contrassegna il container come `unhealthy` e
i sistemi di orchestrazione possono riavviarlo o sostituirlo.

Snapshot approfondito di integrità autenticato:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` usa per impostazione predefinita `OPENCLAW_GATEWAY_BIND=lan` così l'accesso host a
`http://127.0.0.1:18789` funziona con la pubblicazione della porta Docker.

- `lan` (predefinito): il browser host e la CLI host possono raggiungere la porta gateway pubblicata.
- `loopback`: solo i processi all'interno del namespace di rete del container possono raggiungere
  direttamente il gateway.

<Note>
Usa i valori della modalità bind in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), non alias host come `0.0.0.0` o `127.0.0.1`.
</Note>

### Bonjour / mDNS

La rete bridge Docker di solito non inoltra in modo affidabile il multicast Bonjour/mDNS
(`224.0.0.251:5353`). La configurazione Compose inclusa quindi usa per impostazione predefinita
`OPENCLAW_DISABLE_BONJOUR=1` così il Gateway non entra in un ciclo di crash o non
riavvia ripetutamente l'advertising quando il bridge interrompe il traffico multicast.

Usa l'URL Gateway pubblicato, Tailscale o DNS-SD wide-area per gli host Docker.
Imposta `OPENCLAW_DISABLE_BONJOUR=0` solo quando esegui con host networking, macvlan
o un'altra rete in cui il multicast mDNS è noto per funzionare.

Per problemi comuni e risoluzione dei problemi, vedi [Discovery Bonjour](/it/gateway/bonjour).

### Archiviazione e persistenza

Docker Compose monta con bind `OPENCLAW_CONFIG_DIR` su `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` su `/home/node/.openclaw/workspace`, quindi quei percorsi
sopravvivono alla sostituzione del container.

Quella directory di configurazione montata è dove OpenClaw mantiene:

- `openclaw.json` per la configurazione del comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l'autenticazione OAuth/chiave API del provider memorizzata
- `.env` per segreti runtime supportati da env come `OPENCLAW_GATEWAY_TOKEN`

Per i dettagli completi sulla persistenza nelle distribuzioni VM, vedi
[Runtime Docker VM - Cosa persiste dove](/it/install/docker-vm-runtime#what-persists-where).

**Punti critici di crescita del disco:** controlla `media/`, i file JSONL delle sessioni, `cron/runs/*.jsonl`
e i log file rolling sotto `/tmp/openclaw/`.

### Helper della shell (facoltativi)

Per una gestione Docker quotidiana più semplice, installa `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se hai installato ClawDock dal vecchio percorso raw `scripts/shell-helpers/clawdock-helpers.sh`, riesegui il comando di installazione qui sopra così il tuo file helper locale segua il nuovo percorso.

Poi usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, ecc. Esegui
`clawdock-help` per tutti i comandi.
Vedi [ClawDock](/it/install/clawdock) per la guida completa agli helper.

<AccordionGroup>
  <Accordion title="Abilitare il sandbox dell'agente per il gateway Docker">
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

    Lo script monta `docker.sock` solo dopo che i prerequisiti del sandbox sono stati soddisfatti. Se
    la configurazione del sandbox non può essere completata, lo script reimposta `agents.defaults.sandbox.mode`
    su `off`.

  </Accordion>

  <Accordion title="Automazione / CI (non interattivo)">
    Disabilita l'allocazione pseudo-TTY di Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota di sicurezza della rete condivisa">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` così i comandi
    CLI possono raggiungere il gateway tramite `127.0.0.1`. Tratta questo come
    un confine di trust condiviso. La configurazione Compose rimuove `NET_RAW`/`NET_ADMIN` e abilita
    `no-new-privileges` su `openclaw-cli`.
  </Accordion>

  <Accordion title="Permessi ed EACCES">
    L'immagine viene eseguita come `node` (uid 1000). Se vedi errori di permesso su
    `/home/node/.openclaw`, assicurati che i bind mount host siano posseduti da uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Ricompilazioni più rapide">
    Ordina il Dockerfile in modo che i layer delle dipendenze siano in cache. Questo evita di rieseguire
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
    L'immagine predefinita è orientata prima di tutto alla sicurezza e viene eseguita come `node` non root. Per un
    container più ricco di funzionalità:

    1. **Rendi persistente `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Incorpora le dipendenze di sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Installa i browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Rendi persistenti i download del browser**: imposta
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` e usa
       `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker headless)">
    Se scegli OAuth OpenAI Codex nella procedura guidata, viene aperto un URL nel browser. In
    configurazioni Docker o headless, copia l'URL completo di reindirizzamento su cui arrivi e incollalo
    di nuovo nella procedura guidata per completare l'autenticazione.
  </Accordion>

  <Accordion title="Metadati dell'immagine di base">
    L'immagine Docker principale usa `node:24-bookworm` e pubblica annotazioni OCI della base-image
    inclusi `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e altri. Vedi
    [Annotazioni OCI image](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Esecuzione su un VPS?

Vedi [Hetzner (Docker VPS)](/it/install/hetzner) e
[Runtime Docker VM](/it/install/docker-vm-runtime) per i passaggi di distribuzione su VM condivisa
inclusi incorporazione binaria, persistenza e aggiornamenti.

## Sandbox dell'agente

Quando `agents.defaults.sandbox` è abilitato con il backend Docker, il gateway
esegue l'esecuzione degli strumenti dell'agente (shell, lettura/scrittura file, ecc.) all'interno di container Docker
isolati mentre il gateway stesso resta sull'host. Questo ti offre un muro rigido
attorno a sessioni agente non attendibili o multi-tenant senza containerizzare l'intero
gateway.

L'ambito del sandbox può essere per agente (predefinito), per sessione o condiviso. Ogni ambito
ottiene il proprio workspace montato in `/workspace`. Puoi anche configurare
policy degli strumenti di allow/deny, isolamento di rete, limiti di risorse e container
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

Compila l'immagine sandbox predefinita:

```bash
scripts/sandbox-setup.sh
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Immagine mancante o container sandbox che non si avvia">
    Compila l'immagine sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    oppure imposta `agents.defaults.sandbox.docker.image` sulla tua immagine personalizzata.
    I container vengono creati automaticamente per sessione su richiesta.
  </Accordion>

  <Accordion title="Errori di permesso nel sandbox">
    Imposta `docker.user` su un UID:GID che corrisponda alla proprietà del workspace montato,
    oppure esegui `chown` sulla cartella del workspace.
  </Accordion>

  <Accordion title="Strumenti personalizzati non trovati nel sandbox">
    OpenClaw esegue i comandi con `sh -lc` (shell di login), che carica
    `/etc/profile` e può reimpostare PATH. Imposta `docker.env.PATH` per anteporre i
    percorsi dei tuoi strumenti personalizzati, oppure aggiungi uno script sotto `/etc/profile.d/` nel tuo Dockerfile.
  </Accordion>

  <Accordion title="Terminato per OOM durante la build dell'immagine (uscita 137)">
    La VM ha bisogno di almeno 2 GB di RAM. Usa una classe di macchina più grande e riprova.
  </Accordion>

  <Accordion title="Unauthorized o pairing richiesto nella Control UI">
    Recupera un link dashboard aggiornato e approva il device browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Maggiori dettagli: [Dashboard](/it/web/dashboard), [Devices](/it/cli/devices).

  </Accordion>

  <Accordion title="La destinazione del gateway mostra ws://172.x.x.x o errori di pairing dalla CLI Docker">
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
- [ClawDock](/it/install/clawdock) — configurazione Docker Compose della community
- [Aggiornamento](/it/install/updating) — mantenere OpenClaw aggiornato
- [Configurazione](/it/gateway/configuration) — configurazione del gateway dopo l'installazione
