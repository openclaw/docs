---
read_when:
    - Vuoi un gateway containerizzato invece di installazioni locali
    - Stai convalidando il flusso Docker
summary: Configurazione iniziale e onboarding opzionali basati su Docker per OpenClaw
title: Docker
x-i18n:
    generated_at: "2026-04-24T08:46:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6bfd2d4ad8b4629c5077d401b8fec36e71b250da3cccdd9ec3cb9c2abbdfc2
    source_path: install/docker.md
    workflow: 15
---

Docker è **opzionale**. Usalo solo se vuoi un gateway containerizzato o vuoi convalidare il flusso Docker.

## Docker fa al caso mio?

- **Sì**: vuoi un ambiente gateway isolato e usa-e-getta oppure vuoi eseguire OpenClaw su un host senza installazioni locali.
- **No**: stai eseguendo sulla tua macchina e vuoi solo il ciclo di sviluppo più rapido. Usa invece il normale flusso di installazione.
- **Nota sul sandboxing**: il backend sandbox predefinito usa Docker quando il sandboxing è abilitato, ma il sandboxing è disattivato per impostazione predefinita e **non** richiede che l’intero gateway venga eseguito in Docker. Sono disponibili anche i backend sandbox SSH e OpenShell. Vedi [Sandboxing](/it/gateway/sandboxing).

## Prerequisiti

- Docker Desktop (oppure Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la build dell’immagine (`pnpm install` può essere terminato per OOM su host da 1 GB con exit 137)
- Spazio disco sufficiente per immagini e log
- Se esegui su un VPS/host pubblico, consulta
  [Hardening di sicurezza per esposizione di rete](/it/gateway/security),
  in particolare la policy firewall Docker `DOCKER-USER`.

## Gateway containerizzato

<Steps>
  <Step title="Compila l’immagine">
    Dalla radice del repository, esegui lo script di configurazione:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Questo compila localmente l’immagine del gateway. Per usare invece un’immagine precompilata:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Le immagini precompilate sono pubblicate nel
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag comuni: `main`, `latest`, `<version>` (es. `2026.2.26`).

  </Step>

  <Step title="Completa l’onboarding">
    Lo script di configurazione esegue automaticamente l’onboarding. Farà quanto segue:

    - chiederà le chiavi API del provider
    - genererà un token gateway e lo scriverà in `.env`
    - avvierà il gateway tramite Docker Compose

    Durante la configurazione, onboarding pre-start e scritture di configurazione vengono eseguiti tramite
    `openclaw-gateway` direttamente. `openclaw-cli` serve per i comandi eseguiti dopo
    che il container gateway esiste già.

  </Step>

  <Step title="Apri la Control UI">
    Apri `http://127.0.0.1:18789/` nel browser e incolla il segreto condiviso
    configurato nelle Impostazioni. Lo script di configurazione scrive per impostazione predefinita un token in `.env`; se cambi la configurazione del container all’autenticazione con password, usa invece quella
    password.

    Ti serve di nuovo l’URL?

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

Se preferisci eseguire ogni passaggio da solo invece di usare lo script di configurazione:

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
oppure `OPENCLAW_HOME_VOLUME`, lo script di configurazione scrive `docker-compose.extra.yml`;
includilo con `-f docker-compose.yml -f docker-compose.extra.yml`.
</Note>

<Note>
Poiché `openclaw-cli` condivide il namespace di rete di `openclaw-gateway`, è uno
strumento post-start. Prima di `docker compose up -d openclaw-gateway`, esegui onboarding
e scritture di configurazione di setup-time tramite `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variabili d’ambiente

Lo script di configurazione accetta queste variabili d’ambiente opzionali:

| Variabile                     | Scopo                                                           |
| ----------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Usa un’immagine remota invece di compilarla localmente          |
| `OPENCLAW_DOCKER_APT_PACKAGES` | Installa pacchetti apt extra durante la build (separati da spazi) |
| `OPENCLAW_EXTENSIONS`         | Preinstalla dipendenze Plugin al momento della build (nomi separati da spazi) |
| `OPENCLAW_EXTRA_MOUNTS`       | Bind mount host extra (separati da virgole `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Rende persistente `/home/node` in un volume Docker con nome     |
| `OPENCLAW_SANDBOX`            | Opt-in al bootstrap sandbox (`1`, `true`, `yes`, `on`)          |
| `OPENCLAW_DOCKER_SOCKET`      | Sostituisce il percorso del socket Docker                       |

### Controlli di salute

Endpoint probe del container (nessuna autenticazione richiesta):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L’immagine Docker include un `HEALTHCHECK` integrato che interroga `/healthz`.
Se i controlli continuano a fallire, Docker marca il container come `unhealthy` e
i sistemi di orchestrazione possono riavviarlo o sostituirlo.

Snapshot di salute approfondito autenticato:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` usa come predefinito `OPENCLAW_GATEWAY_BIND=lan` così l’accesso host a
`http://127.0.0.1:18789` funziona con la pubblicazione della porta Docker.

- `lan` (predefinito): browser host e CLI host possono raggiungere la porta gateway pubblicata.
- `loopback`: solo i processi dentro il namespace di rete del container possono raggiungere
  direttamente il gateway.

<Note>
Usa i valori della modalità bind in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), non alias host come `0.0.0.0` oppure `127.0.0.1`.
</Note>

### Archiviazione e persistenza

Docker Compose monta in bind `OPENCLAW_CONFIG_DIR` su `/home/node/.openclaw` e
`OPENCLAW_WORKSPACE_DIR` su `/home/node/.openclaw/workspace`, così questi percorsi
sopravvivono alla sostituzione del container.

Quella directory di configurazione montata è dove OpenClaw conserva:

- `openclaw.json` per la configurazione del comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l’autenticazione OAuth/API-key dei provider memorizzata
- `.env` per segreti runtime supportati da env come `OPENCLAW_GATEWAY_TOKEN`

Per i dettagli completi sulla persistenza nei deployment VM, vedi
[Docker VM Runtime - Cosa persiste dove](/it/install/docker-vm-runtime#what-persists-where).

**Punti critici di crescita del disco:** controlla `media/`, i file JSONL delle sessioni, `cron/runs/*.jsonl`
e i log file rolling sotto `/tmp/openclaw/`.

### Helper shell (opzionale)

Per una gestione Docker quotidiana più semplice, installa `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se hai installato ClawDock dal vecchio percorso raw `scripts/shell-helpers/clawdock-helpers.sh`, riesegui il comando di installazione sopra così il file helper locale segua il nuovo percorso.

Poi usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, ecc. Esegui
`clawdock-help` per tutti i comandi.
Vedi [ClawDock](/it/install/clawdock) per la guida completa agli helper.

<AccordionGroup>
  <Accordion title="Abilitare l’agent sandbox per il gateway Docker">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    Percorso socket personalizzato (es. Docker rootless):

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    Lo script monta `docker.sock` solo dopo che i prerequisiti sandbox sono superati. Se
    la configurazione sandbox non può essere completata, lo script reimposta `agents.defaults.sandbox.mode`
    su `off`.

  </Accordion>

  <Accordion title="Automazione / CI (non interattivo)">
    Disabilita l’allocazione pseudo-TTY di Compose con `-T`:

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="Nota di sicurezza sulla rete condivisa">
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` così i
    comandi CLI possono raggiungere il gateway tramite `127.0.0.1`. Trattalo come un
    confine di fiducia condiviso. La configurazione compose rimuove `NET_RAW`/`NET_ADMIN` e abilita
    `no-new-privileges` su `openclaw-cli`.
  </Accordion>

  <Accordion title="Permessi e EACCES">
    L’immagine gira come `node` (uid 1000). Se vedi errori di permesso su
    `/home/node/.openclaw`, assicurati che i bind mount host siano posseduti da uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Ricompilazioni più rapide">
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

  <Accordion title="Opzioni container per utenti avanzati">
    L’immagine predefinita è orientata prima di tutto alla sicurezza e gira come utente non root `node`. Per un
    container più ricco di funzionalità:

    1. **Rendi persistente `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Includi dipendenze di sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Installa browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Rendi persistenti i download dei browser**: imposta
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` e usa
       `OPENCLAW_HOME_VOLUME` oppure `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OpenAI Codex OAuth (Docker headless)">
    Se scegli OpenAI Codex OAuth nella procedura guidata, viene aperto un URL nel browser. In
    configurazioni Docker o headless, copia l’URL completo di redirect su cui arrivi e incollalo
    di nuovo nella procedura guidata per completare l’autenticazione.
  </Accordion>

  <Accordion title="Metadati dell’immagine base">
    L’immagine Docker principale usa `node:24-bookworm` e pubblica annotazioni OCI
    dell’immagine base, incluse `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e altre. Vedi
    [Annotazioni OCI image](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### Esecuzione su un VPS?

Vedi [Hetzner (Docker VPS)](/it/install/hetzner) e
[Docker VM Runtime](/it/install/docker-vm-runtime) per i passaggi condivisi di deployment VM
inclusi baking binari, persistenza e aggiornamenti.

## Agent Sandbox

Quando `agents.defaults.sandbox` è abilitato con il backend Docker, il gateway
esegue l’esecuzione degli strumenti dell’agente (shell, lettura/scrittura file, ecc.) dentro container Docker isolati mentre il gateway stesso resta sull’host. Questo ti dà un muro rigido
attorno a sessioni agente non fidate o multi-tenant senza containerizzare l’intero
gateway.

Lo scope sandbox può essere per-agente (predefinito), per-sessione o condiviso. Ogni scope
ottiene il proprio workspace montato su `/workspace`. Puoi anche configurare
policy allow/deny degli strumenti, isolamento di rete, limiti di risorse e
container browser.

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

Compila l’immagine sandbox predefinita:

```bash
scripts/sandbox-setup.sh
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Immagine mancante o container sandbox che non si avvia">
    Compila l’immagine sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    oppure imposta `agents.defaults.sandbox.docker.image` sulla tua immagine personalizzata.
    I container vengono creati automaticamente per sessione su richiesta.
  </Accordion>

  <Accordion title="Errori di permesso nella sandbox">
    Imposta `docker.user` su un UID:GID che corrisponda alla proprietà del tuo workspace montato,
    oppure esegui `chown` della cartella workspace.
  </Accordion>

  <Accordion title="Strumenti personalizzati non trovati nella sandbox">
    OpenClaw esegue i comandi con `sh -lc` (shell di login), che carica
    `/etc/profile` e può reimpostare PATH. Imposta `docker.env.PATH` per anteporre i
    percorsi dei tuoi strumenti personalizzati, oppure aggiungi uno script sotto `/etc/profile.d/` nel tuo Dockerfile.
  </Accordion>

  <Accordion title="Terminato per OOM durante la build dell’immagine (exit 137)">
    La VM richiede almeno 2 GB di RAM. Usa una classe macchina più grande e riprova.
  </Accordion>

  <Accordion title="Unauthorized o pairing required nella Control UI">
    Recupera un link dashboard nuovo e approva il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Più dettagli: [Dashboard](/it/web/dashboard), [Devices](/it/cli/devices).

  </Accordion>

  <Accordion title="La destinazione gateway mostra ws://172.x.x.x oppure errori pairing dalla Docker CLI">
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
- [ClawDock](/it/install/clawdock) — configurazione community Docker Compose
- [Updating](/it/install/updating) — mantenere OpenClaw aggiornato
- [Configuration](/it/gateway/configuration) — configurazione del gateway dopo l’installazione
