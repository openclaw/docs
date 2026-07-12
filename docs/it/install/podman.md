---
read_when:
    - Vuoi un Gateway containerizzato con Podman anziché Docker
summary: Esegui OpenClaw in un container Podman senza privilegi di root
title: Podman
x-i18n:
    generated_at: "2026-07-12T07:08:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

Esegui il Gateway OpenClaw in un container Podman senza privilegi di root, gestito dall'utente corrente non root.

Il modello:

- Podman esegue il container del Gateway.
- La CLI `openclaw` dell'host funge da piano di controllo.
- Per impostazione predefinita, lo stato persistente risiede sull'host in `~/.openclaw`.
- La gestione quotidiana utilizza `openclaw --container <name> ...` anziché `sudo -u openclaw`, `podman exec` o un utente di servizio separato.

## Prerequisiti

- **Podman** in modalità senza privilegi di root
- **CLI OpenClaw** installata sull'host
- **Facoltativo:** `systemd --user` se desideri l'avvio automatico gestito da Quadlet
- **Facoltativo:** `sudo` solo se desideri usare `loginctl enable-linger "$(whoami)"` per mantenere il servizio attivo all'avvio su un host headless

## Avvio rapido

<Steps>
  <Step title="Configurazione iniziale">
    Dalla radice del repository, esegui `./scripts/podman/setup.sh`.

    Questo comando compila `openclaw:local` nell'archivio Podman senza privilegi di root (oppure scarica `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`, se impostata), crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` se non esiste e crea `~/.openclaw/.env` con un `OPENCLAW_GATEWAY_TOKEN` generato se non esiste.

    Variabili di ambiente facoltative per la compilazione:

    | Variabile | Effetto |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | Utilizza un'immagine esistente/scaricata anziché compilare `openclaw:local` |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | Installa pacchetti apt aggiuntivi durante la compilazione dell'immagine (accetta anche la variabile precedente `OPENCLAW_DOCKER_APT_PACKAGES`) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | Installa pacchetti Python aggiuntivi durante la compilazione dell'immagine; specifica le versioni e utilizza solo indici di pacchetti attendibili |
    | `OPENCLAW_EXTENSIONS` | Compila/crea i pacchetti dei plugin selezionati supportati e installa le relative dipendenze di runtime |
    | `OPENCLAW_INSTALL_BROWSER` | Preinstalla Chromium e Xvfb per l'automazione del browser (imposta su `1`) |

    In alternativa, per una configurazione gestita da Quadlet (solo Linux con servizi utente systemd):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    Oppure imposta `OPENCLAW_PODMAN_QUADLET=1`.

  </Step>

  <Step title="Avvia il container del Gateway">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    Avvia il container con l'uid/gid dell'utente corrente usando `--userns=keep-id` e monta tramite bind lo stato di OpenClaw nel container.

  </Step>

  <Step title="Esegui la configurazione iniziale nel container">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    Quindi apri `http://127.0.0.1:18789/` e usa il token presente in `~/.openclaw/.env`.

    Autenticazione del modello: durante la configurazione usa l'autenticazione gestita da OpenClaw (chiavi API Anthropic oppure autenticazione OAuth tramite browser/codice dispositivo di OpenAI Codex per OpenAI basato su Codex). Il programma di avvio Podman non monta nel container di configurazione o del Gateway le directory delle credenziali delle CLI dell'host, come `~/.claude` o `~/.codex`. Gli accessi esistenti alle CLI dell'host sono soltanto percorsi pratici sullo stesso host; per le installazioni in container, conserva l'autenticazione dei provider nello stato `~/.openclaw` montato e gestito dalla configurazione.

  </Step>

  <Step title="Gestisci il container in esecuzione dalla CLI dell'host">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    I normali comandi `openclaw` vengono quindi eseguiti automaticamente all'interno del container:

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # include un'ulteriore scansione dei servizi
    openclaw doctor
    openclaw channels login
    ```

    Su macOS, la macchina Podman può far apparire il browser come non locale al Gateway. Se dopo l'avvio l'interfaccia di controllo segnala errori di autenticazione del dispositivo, segui le indicazioni relative a Tailscale in [Podman e Tailscale](#podman-and-tailscale).

  </Step>
</Steps>

Il programma di avvio manuale legge da `~/.openclaw/.env` soltanto un piccolo elenco consentito di chiavi relative a Podman e passa al container variabili di ambiente di runtime esplicite; non fornisce a Podman l'intero file di ambiente.

<a id="podman-and-tailscale"></a>

## Podman e Tailscale

Per l'accesso HTTPS o remoto tramite browser, segui la documentazione principale di Tailscale.

Note specifiche per Podman:

- Mantieni l'host di pubblicazione Podman su `127.0.0.1`.
- Preferisci `tailscale serve` gestito dall'host a `openclaw gateway --tailscale serve`.
- Su macOS, se il contesto locale di autenticazione del dispositivo tramite browser non è affidabile, utilizza l'accesso tramite Tailscale anziché soluzioni temporanee basate su tunnel locali.

Consulta [Tailscale](/it/gateway/tailscale) e [Interfaccia di controllo](/it/web/control-ui).

## Systemd (Quadlet, facoltativo)

Se hai eseguito `./scripts/podman/setup.sh --quadlet`, la configurazione installa un file Quadlet in `~/.config/containers/systemd/openclaw.container`.

| Azione | Comando                                    |
| ------ | ------------------------------------------ |
| Avvia  | `systemctl --user start openclaw.service`  |
| Arresta | `systemctl --user stop openclaw.service`   |
| Stato | `systemctl --user status openclaw.service` |
| Log   | `journalctl --user -u openclaw.service -f` |

Dopo aver modificato il file Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Per mantenere il servizio attivo all'avvio sugli host SSH/headless, abilita il lingering per l'utente corrente:

```bash
sudo loginctl enable-linger "$(whoami)"
```

Il servizio Quadlet generato mantiene una configurazione predefinita fissa e rafforzata: porte pubblicate su `127.0.0.1` (`18789` per il Gateway, `18790` per il bridge), `--bind lan` all'interno del container, spazio dei nomi utente `keep-id`, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`. Legge `~/.openclaw/.env` come `EnvironmentFile` di runtime per valori come `OPENCLAW_GATEWAY_TOKEN`, ma non utilizza l'elenco consentito di sostituzioni specifiche di Podman del programma di avvio manuale. Per porte di pubblicazione personalizzate, un host di pubblicazione personalizzato o altri flag di esecuzione del container, usa invece il programma di avvio manuale oppure modifica direttamente `~/.config/containers/systemd/openclaw.container`, quindi ricarica e riavvia il servizio.

## Configurazione, ambiente e archiviazione

- **Directory di configurazione:** `~/.openclaw`
- **Directory dell'area di lavoro:** `~/.openclaw/workspace`
- **File del token:** `~/.openclaw/.env`
- **Script ausiliario di avvio:** `./scripts/run-openclaw-podman.sh`

Lo script di avvio e Quadlet montano tramite bind lo stato dell'host nel container: `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. Per impostazione predefinita, si tratta di directory dell'host e non di stato anonimo del container; pertanto `openclaw.json`, i file `auth-profiles.json` dei singoli agenti, lo stato dei canali/provider, le sessioni e l'area di lavoro persistono dopo la sostituzione del container. La configurazione inizializza inoltre `gateway.controlUi.allowedOrigins` per `127.0.0.1` e `localhost` sulla porta pubblicata del Gateway, affinché la dashboard locale funzioni con il binding non-local loopback del container.

Variabili di ambiente utili per il programma di avvio manuale (salvale in `~/.openclaw/.env`; il programma di avvio legge questo file prima di determinare le impostazioni predefinite definitive del container e dell'immagine):

| Variabile                                  | Valore predefinito | Effetto                                      |
| ------------------------------------------ | ------------------ | -------------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`         | Nome del container                           |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local`   | Immagine da eseguire                         |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`            | Porta dell'host associata alla porta `18789` del container |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`            | Porta dell'host associata alla porta `18790` del container |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`        | Interfaccia dell'host per le porte pubblicate |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`              | Modalità di binding del Gateway nel container |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`          | `keep-id`, `auto` o `host`                   |

Se utilizzi valori non predefiniti per `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR`, imposta le stesse variabili sia per `./scripts/podman/setup.sh` sia per i successivi comandi `./scripts/run-openclaw-podman.sh launch`: il programma di avvio locale del repository non mantiene le sostituzioni personalizzate dei percorsi tra una shell e l'altra.

## Aggiornamento delle immagini

Dopo aver ricompilato o scaricato una nuova immagine, riavvia il container o il servizio Quadlet.
Al primo avvio di una nuova versione di OpenClaw, il Gateway esegue riparazioni sicure dello stato e dei plugin prima di segnalare di essere pronto.

Se il Gateway termina anziché diventare pronto, esegui una volta la stessa immagine con `openclaw doctor --fix` sullo stesso stato/configurazione montato, quindi riavvia normalmente il Gateway:

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

Sugli host SELinux, aggiungi `,Z` a entrambi i montaggi bind se Podman blocca l'accesso allo stato montato.

## Comandi utili

- **Log del container:** `podman logs -f openclaw`
- **Arresta il container:** `podman stop openclaw`
- **Rimuovi il container:** `podman rm -f openclaw`
- **Apri l'URL della dashboard dalla CLI dell'host:** `openclaw dashboard --no-open`
- **Integrità/stato tramite la CLI dell'host:** `openclaw gateway status --deep` (sonda RPC + ulteriore scansione dei servizi)

## Risoluzione dei problemi

- **Permesso negato (EACCES) per la configurazione o l'area di lavoro:** Per impostazione predefinita, il container viene eseguito con `--userns=keep-id` e `--user <il tuo uid>:<il tuo gid>`. Assicurati che i percorsi di configurazione/area di lavoro sull'host appartengano all'utente corrente.
- **Avvio del Gateway bloccato (`gateway.mode=local` mancante):** Assicurati che `~/.openclaw/openclaw.json` esista e imposti `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea se manca.
- **Il container si riavvia dopo l'aggiornamento di un'immagine:** Esegui il comando monouso `openclaw doctor --fix` descritto in [Aggiornamento delle immagini](#upgrading-images), quindi avvia nuovamente il Gateway.
- **I comandi della CLI del container raggiungono la destinazione errata:** Usa esplicitamente `openclaw --container <name> ...` oppure esporta `OPENCLAW_CONTAINER=<name>` nella shell.
- **`openclaw update` non riesce con `--container`:** È previsto. Ricompila/scarica l'immagine, quindi riavvia il container o il servizio Quadlet.
- **Il servizio Quadlet non si avvia:** Esegui `systemctl --user daemon-reload`, quindi `systemctl --user start openclaw.service`. Sui sistemi headless potrebbe essere necessario anche eseguire `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blocca i montaggi bind:** Non modificare il comportamento predefinito dei montaggi; il programma di avvio aggiunge automaticamente `:Z` su Linux quando SELinux è in modalità enforcing o permissive.

## Risorse correlate

- [Docker](/it/install/docker)
- [Processo in background del Gateway](/it/gateway/background-process)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
