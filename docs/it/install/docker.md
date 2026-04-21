---
read_when:
    - Vuoi un gateway containerizzato invece di installazioni locali
    - Stai verificando il flusso Docker
summary: Configurazione e onboarding opzionali basati su Docker per OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-21T08:24:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: f8d3e346ca60daa9908aef0846c9052321087af7dd2c919ce79de4d5925136a2
    source_path: install/docker.md
    workflow: 15
---

# Docker (opzionale)

Docker è **opzionale**. Usalo solo se vuoi un gateway containerizzato o per verificare il flusso Docker.

## Docker fa al caso mio?

- **Sì**: vuoi un ambiente gateway isolato e usa-e-getta oppure vuoi eseguire OpenClaw su un host senza installazioni locali.
- **No**: stai lavorando sulla tua macchina e vuoi solo il ciclo di sviluppo più rapido. Usa invece il normale flusso di installazione.
- **Nota sul sandboxing**: il backend sandbox predefinito usa Docker quando il sandboxing è abilitato, ma il sandboxing è disattivato per impostazione predefinita e **non** richiede che l'intero gateway venga eseguito in Docker. Sono disponibili anche i backend sandbox SSH e OpenShell. Vedi [Sandboxing](/it/gateway/sandboxing).

## Prerequisiti

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la build dell'immagine (`pnpm install` può essere terminato per OOM su host da 1 GB con exit 137)
- Spazio su disco sufficiente per immagini e log
- Se l'esecuzione avviene su un VPS/host pubblico, consulta
  [Hardening della sicurezza per l'esposizione in rete](/it/gateway/security),
  in particolare la policy firewall Docker `DOCKER-USER`.

## Gateway containerizzato

<Steps>
  <Step title="Compila l'immagine">
    Dalla root del repo, esegui lo script di configurazione:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Questo compila localmente l'immagine del gateway. Per usare invece un'immagine precompilata:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Le immagini precompilate sono pubblicate su
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag comuni: `main`, `latest`, `<version>` (ad es. `2026.2.26`).

  </Step>

  <Step title="Completa l'onboarding">
    Lo script di configurazione esegue automaticamente l'onboarding. Farà quanto segue:

    - richiederà le chiavi API del provider
    - genererà un token del gateway e lo scriverà in `.env`
    - avvierà il gateway tramite Docker Compose

    Durante la configurazione, l'onboarding pre-avvio e le scritture di configurazione passano direttamente tramite
    `openclaw-gateway`. `openclaw-cli` serve per i comandi che esegui dopo
    che il container gateway esiste già.

  </Step>

  <Step title="Apri la Control UI">
    Apri `http://127.0.0.1:18789/` nel browser e incolla il
    secret condiviso configurato in Settings. Lo script di configurazione scrive per impostazione predefinita un token in `.env`; se cambi la configurazione del container per usare l'autenticazione con password, usa invece quella password.

    Hai di nuovo bisogno dell'URL?

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

Se preferisci eseguire ogni passaggio manualmente invece di usare lo script di configurazione:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
Esegui `docker compose` dalla root del repo. Se hai abilitato `OPENCLAW_EXTRA_MOUNTS`
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

Lo script di configurazione accetta queste variabili d'ambiente opzionali:

| Variabile                     | Scopo                                                            |
| ----------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Usa un'immagine remota invece della build locale                 |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Installa pacchetti apt aggiuntivi durante la build (nomi separati da spazi) |
| `OPENCLAW_EXTENSIONS`         | Preinstalla le dipendenze delle extension in fase di build (nomi separati da spazi) |
| `OPENCLAW_EXTRA_MOUNTS`       | Bind mount host aggiuntivi (separati da virgole `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Rende persistente `/home/node` in un volume Docker con nome      |
| `OPENCLAW_SANDBOX`            | Opt-in al bootstrap della sandbox (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`      | Sovrascrive il percorso del socket Docker                        |

### Controlli di integrità

Endpoint di probe del container (non richiedono autenticazione):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L'immagine Docker include un `HEALTHCHECK` integrato che esegue ping su `/healthz`.
Se i controlli continuano a fallire, Docker contrassegna il container come `unhealthy` e
i sistemi di orchestrazione possono riavviarlo o sostituirlo.

Snapshot approfondito di integrità autenticato:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` imposta per default `OPENCLAW_GATEWAY_BIND=lan` in modo che l'accesso host a
`http://127.0.0.1:18789` funzioni con il port publishing di Docker.

- `lan` (predefinito): il browser host e la CLI host possono raggiungere la porta pubblicata del gateway.
- `loopback`: solo i processi all'interno del namespace di rete del container possono raggiungere
  direttamente il gateway.

<Note>
Usa i valori della modalità bind in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), non alias host come `0.0.0.0` o `127.0.0.1`.
</Note>

### Archiviazione e persistenza

Docker Compose monta con bind `OPENCLAW_CONFIG_DIR` su `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` su `/home/node/.openclaw/workspace`, quindi questi percorsi
sopravvivono alla sostituzione del container.

Quella directory di configurazione montata è il luogo in cui OpenClaw conserva:

- `openclaw.json` per la configurazione del comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l'autenticazione provider OAuth/API-key memorizzata
- `.env` per i secret runtime basati su env come `OPENCLAW_GATEWAY_TOKEN`

Per i dettagli completi sulla persistenza nei deployment VM, vedi
[Docker VM Runtime - Cosa persiste e dove](/it/install/docker-vm-runtime#what-persists-where).

**Punti caldi di crescita del disco:** monitora `media/`, i file JSONL di sessione, `cron/runs/*.jsonl`
e i log file rolling sotto `/tmp/openclaw/`.

### Helper shell (opzionale)

Per una gestione quotidiana più semplice di Docker, installa `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se hai installato ClawDock dal vecchio percorso raw `scripts/shell-helpers/clawdock-helpers.sh`, riesegui il comando di installazione sopra in modo che il file helper locale segua il nuovo percorso.

Poi usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, ecc. Esegui
`clawdock-help` per tutti i comandi.
Vedi [ClawDock](/it/install/clawdock) per la guida completa agli helper.

<AccordionGroup>
  <Accordion title="Abilitare la sandbox dell'agente per il gateway Docker">
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
    su `off`.

  </Accordion>

  <Accordion title="Automazione / CI (non interattivo)">
    Disabilita l'allocazione pseudo-TTY di Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota di sicurezza sulla rete condivisa">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` in modo che i
    comandi CLI possano raggiungere il gateway su `127.0.0.1`. Tratta questo come
    un confine di fiducia condiviso. La configurazione Compose rimuove `NET_RAW`/`NET_ADMIN` e abilita
    `no-new-privileges` su `openclaw-cli`.
  </Accordion>

  <Accordion title="Permessi ed EACCES">
    L'immagine viene eseguita come `node` (uid 1000). Se vedi errori di permesso su
    `/home/node/.openclaw`, assicurati che i bind mount host appartengano a uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Ricompilazioni più veloci">
    Ordina il tuo Dockerfile in modo che i layer delle dipendenze siano in cache. Questo evita di rieseguire
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

  <Accordion title="Opzioni container per utenti esperti">
    L'immagine predefinita privilegia la sicurezza ed è eseguita come utente non-root `node`. Per un
    container più ricco di funzionalità:

    1. **Rendi persistente `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Includi dipendenze di sistema nell'immagine**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
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
    Se scegli OpenAI Codex OAuth nella procedura guidata, si apre un URL nel browser. In
    Docker o in configurazioni headless, copia l'intero URL di redirect su cui arrivi e incollalo
    di nuovo nella procedura guidata per completare l'autenticazione.
  </Accordion>

  <Accordion title="Metadati dell'immagine di base">
    L'immagine Docker principale usa `node:24-bookworm` e pubblica annotazioni OCI dell'immagine base
    incluse `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e altre. Vedi
    [Annotazioni immagine OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Esecuzione su un VPS?

Vedi [Hetzner (Docker VPS)](/it/install/hetzner) e
[Docker VM Runtime](/it/install/docker-vm-runtime) per i passaggi di deployment su VM condivise
inclusi baking del binario, persistenza e aggiornamenti.

## Sandbox dell'agente

Quando `agents.defaults.sandbox` è abilitato con il backend Docker, il gateway
esegue l'esecuzione degli strumenti dell'agente (shell, lettura/scrittura file, ecc.) all'interno di container Docker isolati
mentre il gateway stesso resta sull'host. Questo ti offre una barriera netta
attorno a sessioni agente non attendibili o multi-tenant senza containerizzare l'intero
gateway.

L'ambito della sandbox può essere per agente (predefinito), per sessione o condiviso. Ogni ambito
riceve il proprio workspace montato su `/workspace`. Puoi anche configurare
policy di allow/deny degli strumenti, isolamento di rete, limiti di risorse e container browser.

Per configurazione completa, immagini, note di sicurezza e profili multi-agent, vedi:

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo alla sandbox
- [OpenShell](/it/gateway/openshell) -- accesso shell interattivo ai container sandbox
- [Sandbox e strumenti multi-agent](/it/tools/multi-agent-sandbox-tools) -- override per agente

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
  <Accordion title="Immagine mancante o avvio del container sandbox non riuscito">
    Compila l'immagine sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    oppure imposta `agents.defaults.sandbox.docker.image` sulla tua immagine personalizzata.
    I container vengono creati automaticamente per sessione quando necessario.
  </Accordion>

  <Accordion title="Errori di permesso nella sandbox">
    Imposta `docker.user` su un UID:GID che corrisponda alla proprietà del workspace montato,
    oppure esegui `chown` sulla cartella del workspace.
  </Accordion>

  <Accordion title="Strumenti personalizzati non trovati nella sandbox">
    OpenClaw esegue i comandi con `sh -lc` (login shell), che carica
    `/etc/profile` e può reimpostare PATH. Imposta `docker.env.PATH` per anteporre i
    percorsi dei tuoi strumenti personalizzati, oppure aggiungi uno script sotto `/etc/profile.d/` nel tuo Dockerfile.
  </Accordion>

  <Accordion title="Terminato per OOM durante la build dell'immagine (exit 137)">
    La VM richiede almeno 2 GB di RAM. Usa una classe di macchina più grande e riprova.
  </Accordion>

  <Accordion title="Unauthorized o pairing richiesto nella Control UI">
    Recupera un nuovo link della dashboard e approva il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Maggiori dettagli: [Dashboard](/web/dashboard), [Devices](/cli/devices).

  </Accordion>

  <Accordion title="Il target del gateway mostra ws://172.x.x.x o errori di pairing dalla Docker CLI">
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
- [ClawDock](/it/install/clawdock) — configurazione community con Docker Compose
- [Aggiornamento](/it/install/updating) — mantenere OpenClaw aggiornato
- [Configurazione](/it/gateway/configuration) — configurazione del gateway dopo l'installazione
