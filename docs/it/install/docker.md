---
read_when:
    - Vuoi un gateway containerizzato invece di installazioni locali
    - Stai convalidando il flusso Docker
summary: Configurazione e onboarding opzionali di OpenClaw basati su Docker
title: Docker
x-i18n:
    generated_at: "2026-04-05T13:55:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4628362d52597f85e72c214efe96b2923c7a59a8592b3044dc8c230318c515b8
    source_path: install/docker.md
    workflow: 15
---

# Docker (facoltativo)

Docker è **facoltativo**. Usalo solo se vuoi un gateway containerizzato o per convalidare il flusso Docker.

## Docker è adatto a me?

- **Sì**: vuoi un ambiente gateway isolato e usa e getta oppure vuoi eseguire OpenClaw su un host senza installazioni locali.
- **No**: stai eseguendo sul tuo computer e vuoi solo il ciclo di sviluppo più veloce. Usa invece il normale flusso di installazione.
- **Nota sul sandboxing**: anche il sandboxing degli agenti usa Docker, ma **non** richiede che l'intero gateway venga eseguito in Docker. Vedi [Sandboxing](/gateway/sandboxing).

## Prerequisiti

- Docker Desktop (o Docker Engine) + Docker Compose v2
- Almeno 2 GB di RAM per la build dell'immagine (`pnpm install` può essere terminato per OOM su host da 1 GB con exit 137)
- Spazio su disco sufficiente per immagini e log
- Se esegui su un VPS/host pubblico, consulta
  [Hardening della sicurezza per l'esposizione di rete](/gateway/security),
  in particolare la policy firewall Docker `DOCKER-USER`.

## Gateway containerizzato

<Steps>
  <Step title="Crea l'immagine">
    Dalla radice del repository, esegui lo script di configurazione:

    ```bash
    ./scripts/docker/setup.sh
    ```

    Questo costruisce localmente l'immagine del gateway. Per usare invece un'immagine precompilata:

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    Le immagini precompilate sono pubblicate su
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw).
    Tag comuni: `main`, `latest`, `<version>` (ad esempio `2026.2.26`).

  </Step>

  <Step title="Completa l'onboarding">
    Lo script di configurazione esegue automaticamente l'onboarding. Farà quanto segue:

    - richiederà le chiavi API del provider
    - genererà un token gateway e lo scriverà in `.env`
    - avvierà il gateway tramite Docker Compose

    Durante la configurazione, l'onboarding pre-avvio e le scritture di configurazione passano direttamente tramite
    `openclaw-gateway`. `openclaw-cli` è per i comandi eseguiti dopo che
    il container gateway esiste già.

  </Step>

  <Step title="Apri la Control UI">
    Apri `http://127.0.0.1:18789/` nel browser e incolla il
    segreto condiviso configurato in Settings. Lo script di configurazione scrive per impostazione predefinita un token in `.env`; se cambi la configurazione del container in autenticazione con password, usa invece quella
    password.

    Hai bisogno di nuovo dell'URL?

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="Configura i canali (facoltativo)">
    Usa il container CLI per aggiungere i canali di messaggistica:

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

Se preferisci eseguire personalmente ogni passaggio invece di usare lo script di configurazione:

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
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
e scritture di configurazione iniziali tramite `openclaw-gateway` con
`--no-deps --entrypoint node`.
</Note>

### Variabili d'ambiente

Lo script di configurazione accetta queste variabili d'ambiente facoltative:

| Variabile                      | Scopo                                                            |
| ----------------------------- | ---------------------------------------------------------------- |
| `OPENCLAW_IMAGE`              | Usa un'immagine remota invece di costruirla localmente           |
| `OPENCLAW_DOCKER_APT_PACKAGES`| Installa pacchetti apt aggiuntivi durante la build (separati da spazi) |
| `OPENCLAW_EXTENSIONS`         | Preinstalla le dipendenze delle estensioni in fase di build (nomi separati da spazi) |
| `OPENCLAW_EXTRA_MOUNTS`       | Bind mount host aggiuntivi (separati da virgole `source:target[:opts]`) |
| `OPENCLAW_HOME_VOLUME`        | Mantiene `/home/node` in un volume Docker nominato               |
| `OPENCLAW_SANDBOX`            | Attiva il bootstrap sandbox (`1`, `true`, `yes`, `on`)           |
| `OPENCLAW_DOCKER_SOCKET`      | Sovrascrive il percorso del socket Docker                        |

### Health check

Endpoint probe del container (nessuna autenticazione richiesta):

```bash
curl -fsS http://127.0.0.1:18789/healthz   # liveness
curl -fsS http://127.0.0.1:18789/readyz     # readiness
```

L'immagine Docker include un `HEALTHCHECK` integrato che interroga `/healthz`.
Se i controlli continuano a fallire, Docker segna il container come `unhealthy` e
i sistemi di orchestrazione possono riavviarlo o sostituirlo.

Snapshot approfondito dello stato di salute autenticato:

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN vs loopback

`scripts/docker/setup.sh` imposta per default `OPENCLAW_GATEWAY_BIND=lan` così l'accesso host a
`http://127.0.0.1:18789` funziona con la pubblicazione delle porte Docker.

- `lan` (predefinito): browser host e CLI host possono raggiungere la porta gateway pubblicata.
- `loopback`: solo i processi all'interno del namespace di rete del container possono raggiungere
  direttamente il gateway.

<Note>
Usa i valori di modalità bind in `gateway.bind` (`lan` / `loopback` / `custom` /
`tailnet` / `auto`), non alias host come `0.0.0.0` o `127.0.0.1`.
</Note>

### Archiviazione e persistenza

Docker Compose esegue bind-mount di `OPENCLAW_CONFIG_DIR` su `/home/node/.openclaw` e
di `OPENCLAW_WORKSPACE_DIR` su `/home/node/.openclaw/workspace`, quindi questi percorsi
sopravvivono alla sostituzione del container.

Quella directory di configurazione montata è dove OpenClaw mantiene:

- `openclaw.json` per la configurazione del comportamento
- `agents/<agentId>/agent/auth-profiles.json` per l'autenticazione OAuth/chiave API dei provider archiviata
- `.env` per i segreti di runtime basati su env come `OPENCLAW_GATEWAY_TOKEN`

Per i dettagli completi sulla persistenza nei deployment VM, vedi
[Docker VM Runtime - Cosa persiste e dove](/install/docker-vm-runtime#what-persists-where).

**Punti critici di crescita del disco:** monitora `media/`, i file JSONL delle sessioni, `cron/runs/*.jsonl`,
e i log a rotazione sotto `/tmp/openclaw/`.

### Helper shell (facoltativi)

Per una gestione Docker quotidiana più semplice, installa `ClawDock`:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Se hai installato ClawDock dal vecchio percorso raw `scripts/shell-helpers/clawdock-helpers.sh`, riesegui il comando di installazione sopra così il tuo file helper locale segua la nuova posizione.

Poi usa `clawdock-start`, `clawdock-stop`, `clawdock-dashboard`, ecc. Esegui
`clawdock-help` per tutti i comandi.
Vedi [ClawDock](/install/clawdock) per la guida completa agli helper.

<AccordionGroup>
  <Accordion title="Abilita la sandbox degli agenti per il gateway Docker">
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

    Lo script monta `docker.sock` solo dopo che i prerequisiti della sandbox sono stati superati. Se
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
    `openclaw-cli` usa `network_mode: "service:openclaw-gateway"` così i comandi CLI
    possono raggiungere il gateway tramite `127.0.0.1`. Tratta questo come un
    confine di fiducia condiviso. La configurazione Compose rimuove `NET_RAW`/`NET_ADMIN` e abilita
    `no-new-privileges` su `openclaw-cli`.
  </Accordion>

  <Accordion title="Permessi e EACCES">
    L'immagine viene eseguita come `node` (uid 1000). Se vedi errori di permesso su
    `/home/node/.openclaw`, assicurati che i bind mount host siano di proprietà di uid 1000:

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="Rebuild più veloci">
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

  <Accordion title="Opzioni del container per utenti avanzati">
    L'immagine predefinita è orientata alla sicurezza e viene eseguita come `node` non root. Per un container più
    ricco di funzionalità:

    1. **Mantieni `/home/node`**: `export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **Includi dipendenze di sistema**: `export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **Installa i browser Playwright**:
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **Mantieni i download dei browser**: imposta
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` e usa
       `OPENCLAW_HOME_VOLUME` o `OPENCLAW_EXTRA_MOUNTS`.

  </Accordion>

  <Accordion title="OAuth OpenAI Codex (Docker headless)">
    Se scegli OAuth OpenAI Codex nella procedura guidata, si apre un URL nel browser. In
    configurazioni Docker o headless, copia l'URL di reindirizzamento completo su cui arrivi e incollalo
    di nuovo nella procedura guidata per completare l'autenticazione.
  </Accordion>

  <Accordion title="Metadati dell'immagine di base">
    L'immagine Docker principale usa `node:24-bookworm` e pubblica annotazioni OCI dell'immagine di base
    incluse `org.opencontainers.image.base.name`,
    `org.opencontainers.image.source` e altre. Vedi
    [Annotazioni immagine OCI](https://github.com/opencontainers/image-spec/blob/main/annotations.md).
  </Accordion>
</AccordionGroup>

### In esecuzione su un VPS?

Vedi [Hetzner (Docker VPS)](/install/hetzner) e
[Docker VM Runtime](/install/docker-vm-runtime) per i passaggi di deployment su VM condivise
inclusi baking del binario, persistenza e aggiornamenti.

## Sandbox degli agenti

Quando `agents.defaults.sandbox` è abilitato, il gateway esegue l'esecuzione degli strumenti dell'agente
(shell, lettura/scrittura file, ecc.) all'interno di container Docker isolati mentre il
gateway stesso resta sull'host. Questo ti offre una barriera rigida attorno a sessioni agente non fidate o multi-tenant senza containerizzare l'intero gateway.

L'ambito della sandbox può essere per agente (predefinito), per sessione o condiviso. Ogni ambito
ottiene il proprio workspace montato in `/workspace`. Puoi anche configurare
policy di allow/deny degli strumenti, isolamento di rete, limiti di risorse e container browser.

Per configurazione completa, immagini, note di sicurezza e profili multi-agente, vedi:

- [Sandboxing](/gateway/sandboxing) -- riferimento completo della sandbox
- [OpenShell](/gateway/openshell) -- accesso shell interattivo ai container sandbox
- [Sandbox e strumenti multi-agente](/tools/multi-agent-sandbox-tools) -- override per agente

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

Costruisci l'immagine sandbox predefinita:

```bash
scripts/sandbox-setup.sh
```

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Immagine mancante o container sandbox che non si avvia">
    Costruisci l'immagine sandbox con
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    o imposta `agents.defaults.sandbox.docker.image` sulla tua immagine personalizzata.
    I container vengono creati automaticamente per sessione su richiesta.
  </Accordion>

  <Accordion title="Errori di permesso nella sandbox">
    Imposta `docker.user` su un UID:GID che corrisponda alla proprietà del workspace montato,
    oppure esegui `chown` della cartella workspace.
  </Accordion>

  <Accordion title="Strumenti personalizzati non trovati nella sandbox">
    OpenClaw esegue i comandi con `sh -lc` (shell di login), che carica
    `/etc/profile` e può reimpostare PATH. Imposta `docker.env.PATH` per anteporre i
    percorsi dei tuoi strumenti personalizzati, oppure aggiungi uno script sotto `/etc/profile.d/` nel tuo Dockerfile.
  </Accordion>

  <Accordion title="Terminato per OOM durante la build dell'immagine (exit 137)">
    La VM necessita di almeno 2 GB di RAM. Usa una classe macchina più grande e riprova.
  </Accordion>

  <Accordion title="Non autorizzato o pairing richiesto nella Control UI">
    Recupera un nuovo link dashboard e approva il dispositivo browser:

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    Maggiori dettagli: [Dashboard](/web/dashboard), [Dispositivi](/cli/devices).

  </Accordion>

  <Accordion title="Il target gateway mostra ws://172.x.x.x o errori di pairing dalla CLI Docker">
    Reimposta modalità e bind del gateway:

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## Correlati

- [Panoramica dell'installazione](/install) — tutti i metodi di installazione
- [Podman](/install/podman) — alternativa Podman a Docker
- [ClawDock](/install/clawdock) — configurazione community Docker Compose
- [Aggiornamento](/install/updating) — mantenere OpenClaw aggiornato
- [Configurazione](/gateway/configuration) — configurazione del gateway dopo l'installazione
