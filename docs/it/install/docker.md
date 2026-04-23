---
read_when:
    - Vuoi un gateway containerizzato invece di installazioni locali
    - Stai verificando il flusso Docker
summary: Configurazione e onboarding facoltativi basati su Docker per OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-23T08:30:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60a874ff7a3c5405ba4437a1d6746f0d9268ba7bd4faf3e20cee6079d5fb68d3
    source_path: install/docker.md
    workflow: 15
---

# Docker (facoltativo)

Docker è **facoltativo**. Usalo solo se vuoi un gateway containerizzato o per verificare il flusso Docker.

## Docker fa al caso mio?

- **Sì**: vuoi un ambiente gateway isolato e usa e getta oppure vuoi eseguire OpenClaw su un host senza installazioni locali.
- **No**: stai eseguendo sul tuo computer e vuoi solo il ciclo di sviluppo più veloce. Usa invece il normale flusso di installazione.
- **Nota sul sandboxing**: il backend sandbox predefinito usa Docker quando il sandboxing è abilitato, ma il sandboxing è disattivato per impostazione predefinita e **non** richiede che l'intero gateway venga eseguito in Docker. Sono disponibili anche i backend sandbox SSH e OpenShell. Vedi [Sandboxing](/it/gateway/sandboxing).

## Prerequisiti

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la build dell'immagine (`pnpm install` può essere terminato per OOM su host da 1 GB con exit 137)
- Spazio disco sufficiente per immagini e log
- Se esegui su un VPS/host pubblico, consulta
  [Rafforzamento della sicurezza per l'esposizione in rete](/it/gateway/security),
  in particolare la policy firewall Docker `DOCKER-USER`.

## Gateway containerizzato

<Steps>
  <Step title="Crea l'immagine">
    Dalla root del repo, esegui lo script di configurazione:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Questo crea localmente l'immagine del gateway. Per usare invece un'immagine precompilata:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Le immagini precompilate vengono pubblicate nel
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag comuni: `main`, `latest`, `<version>` (ad esempio `2026.2.26`).

  </Step>

  <Step title="Completa l'onboarding">
    Lo script di configurazione esegue automaticamente l'onboarding. Farà quanto segue:

    - chiederà le API key dei provider
    - genererà un token gateway e lo scriverà in `.env`
    - avvierà il gateway tramite Docker Compose

    Durante la configurazione, l'onboarding pre-avvio e le scritture di config passano tramite
    `openclaw-gateway` direttamente. `openclaw-cli` serve per i comandi che esegui dopo
    che il container gateway esiste già.

  </Step>

  <Step title="Apri la Control UI">
    Apri `http://127.0.0.1:18789/` nel browser e incolla in Settings il
    segreto condiviso configurato. Lo script di configurazione scrive per impostazione predefinita un token in `.env`; se cambi la config del container per usare l'autenticazione con password, usa invece quella
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
e scritture di config in fase di setup tramite `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variabili d'ambiente

Lo script di configurazione accetta queste variabili d'ambiente facoltative:

| Variabile                     | Scopo                                                           |
| ----------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Usa un'immagine remota invece di crearla localmente             |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Installa pacchetti apt aggiuntivi durante la build (separati da spazi) |
| `OPENCLAW_EXTENSIONS`         | Preinstalla dipendenze dei plugin in fase di build (nomi separati da spazi) |
| `OPENCLAW_EXTRA_MOUNTS`       | Bind mount host aggiuntivi (separati da virgole `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Rende persistente `/home/node` in un volume Docker con nome     |
| `OPENCLAW_SANDBOX`            | Abilita il bootstrap del sandbox (`1`, `true`, `yes`, `on`)     |
| `OPENCLAW_DOCKER_SOCKET`      | Sovrascrive il percorso del socket Docker                       |

### Controlli di stato

Endpoint probe del container (nessuna autenticazione richiesta):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L'immagine Docker include un `HEALTHCHECK` integrato che esegue ping su `/healthz`.
Se i controlli continuano a fallire, Docker contrassegna il container come `unhealthy` e
i sistemi di orchestrazione possono riavviarlo o sostituirlo.

Snapshot approfondito dello stato con autenticazione:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` usa come predefinito `OPENCLAW_GATEWAY_BIND=lan` così l'accesso host a
`http://127.0.0.1:18789` funziona con la pubblicazione delle porte Docker.

- `lan` (predefinito): browser host e CLI host possono raggiungere la porta gateway pubblicata.
- `loopback`: solo i processi all'interno del namespace di rete del container possono raggiungere
  direttamente il gateway.

<Note>
Usa i valori della modalità bind in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), non alias host come `0.0.0.0` o `127.0.0.1`.
</Note>

### Archiviazione e persistenza

Docker Compose esegue bind-mount di `OPENCLAW_CONFIG_DIR` su `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` su `/home/node/.openclaw/workspace`, quindi quei percorsi
sopravvivono alla sostituzione del container.

Quella directory di config montata è dove OpenClaw mantiene:

- `openclaw.json` per la config di comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l'autenticazione OAuth/API-key dei provider memorizzata
- `.env` per i segreti di runtime supportati da env come `OPENCLAW_GATEWAY_TOKEN`

Per i dettagli completi sulla persistenza nelle distribuzioni VM, vedi
[Docker VM Runtime - What persists where](/it/install/docker-vm-runtime#what-persists-where).

**Punti caldi di crescita del disco:** monitora `media/`, file JSONL di sessione, `cron/runs/*.jsonl`,
e i rolling file log sotto `/tmp/openclaw/`.

### Helper shell (facoltativi)

Per una gestione Docker quotidiana più semplice, installa `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se hai installato ClawDock dal vecchio percorso raw `scripts/shell-helpers/clawdock-helpers.sh`, riesegui il comando di installazione sopra così il tuo file helper locale segua il nuovo percorso.

Poi usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, ecc. Esegui
`clawdock-help` per tutti i comandi.
Vedi [ClawDock](/it/install/clawdock) per la guida completa agli helper.

<AccordionGroup>
  <Accordion title="Abilita il sandbox dell'agente per il gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Percorso socket personalizzato (ad esempio Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Lo script monta `docker.sock` solo dopo che i prerequisiti del sandbox sono stati superati. Se
    la configurazione del sandbox non può essere completata, lo script reimposta `agents.defaults.sandbox.mode`
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
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` così i
    comandi CLI possono raggiungere il gateway tramite `127.0.0.1`. Tratta questo come un confine di fiducia condiviso. La config compose rimuove `NET_RAW`/`NET_ADMIN` e abilita
    `no-new-privileges` su `openclaw-cli`.
  </Accordion>

  <Accordion title="Permessi ed EACCES">
    L'immagine viene eseguita come `node` (uid 1000). Se vedi errori di permessi su
    `/home/node/.openclaw`, assicurati che i tuoi bind mount host siano di proprietà dell'uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Ricompilazioni più veloci">
    Ordina il tuo Dockerfile in modo che i layer delle dipendenze siano in cache. Questo evita di rieseguire
    `pnpm install` a meno che non cambino i lockfile:

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
    L'immagine predefinita è orientata alla sicurezza e viene eseguita come utente non root `node`. Per un container più ricco di funzionalità:

    1. **Rendi persistente `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Integra dipendenze di sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Installa browser Playwright**:
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
    configurazioni Docker o headless, copia l'intero URL di redirect su cui arrivi e incollalo
    nuovamente nella procedura guidata per completare l'autenticazione.
  </Accordion>

  <Accordion title="Metadati dell'immagine base">
    L'immagine Docker principale usa `node:24-bookworm` e pubblica annotazioni OCI
    dell'immagine base incluse `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e altre. Vedi
    [Annotazioni immagine OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Esecuzione su un VPS?

Vedi [Hetzner (Docker VPS)](/it/install/hetzner) e
[Docker VM Runtime](/it/install/docker-vm-runtime) per i passaggi di distribuzione su VM condivisa
inclusi integrazione binaria, persistenza e aggiornamenti.

## Sandbox dell'agente

Quando `agents.defaults.sandbox` è abilitato con il backend Docker, il gateway
esegue l'esecuzione degli strumenti dell'agente (shell, lettura/scrittura file, ecc.) all'interno di container Docker
isolati mentre il gateway stesso resta sull'host. Questo ti offre una barriera rigida
attorno a sessioni agente non attendibili o multi-tenant senza containerizzare l'intero
gateway.

L'ambito del sandbox può essere per agente (predefinito), per sessione o condiviso. Ogni ambito
ottiene il proprio workspace montato in `/workspace`. Puoi anche configurare
policy di allow/deny degli strumenti, isolamento della rete, limiti di risorse e
container browser.

Per configurazione completa, immagini, note di sicurezza e profili multi-agente, vedi:

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo al sandbox
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

Crea l'immagine sandbox predefinita:

```bash
scripts/sandbox-setup.sh
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Immagine mancante o container sandbox non si avvia">
    Crea l'immagine sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    oppure imposta `agents.defaults.sandbox.docker.image` sulla tua immagine personalizzata.
    I container vengono creati automaticamente per sessione su richiesta.
  </Accordion>

  <Accordion title="Errori di permessi nel sandbox">
    Imposta `docker.user` su un UID:GID che corrisponda alla proprietà del workspace montato,
    oppure esegui chown sulla cartella del workspace.
  </Accordion>

  <Accordion title="Strumenti personalizzati non trovati nel sandbox">
    OpenClaw esegue i comandi con `sh -lc` (login shell), che carica
    `/etc/profile` e può reimpostare PATH. Imposta `docker.env.PATH` per anteporre i
    percorsi dei tuoi strumenti personalizzati, oppure aggiungi uno script in `/etc/profile.d/` nel tuo Dockerfile.
  </Accordion>

  <Accordion title="Terminato per OOM durante la build dell'immagine (exit 137)">
    La VM richiede almeno 2 GB di RAM. Usa una classe macchina più grande e riprova.
  </Accordion>

  <Accordion title="Non autorizzato o abbinamento richiesto nella Control UI">
    Recupera un nuovo link della dashboard e approva il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Maggiori dettagli: [Dashboard](/it/web/dashboard), [Devices](/it/cli/devices).

  </Accordion>

  <Accordion title="Il target gateway mostra ws://172.x.x.x o errori di abbinamento dalla CLI Docker">
    Reimposta modalità e bind del gateway:

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica installazione](/it/install) — tutti i metodi di installazione
- [Podman](/it/install/podman) — alternativa a Docker con Podman
- [ClawDock](/it/install/clawdock) — configurazione community Docker Compose
- [Aggiornamento](/it/install/updating) — mantenere OpenClaw aggiornato
- [Configuration](/it/gateway/configuration) — configurazione del gateway dopo l'installazione
