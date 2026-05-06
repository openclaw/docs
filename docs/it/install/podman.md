---
read_when:
    - Vuoi un Gateway containerizzato con Podman invece di Docker
summary: Esegui OpenClaw in un contenitore Podman senza privilegi di root
title: Podman
x-i18n:
    generated_at: "2026-05-06T08:57:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44f89feede7fe10325810599dad457f8fcc3adbd9c139e26df67b9ad12019d56
    source_path: install/podman.md
    workflow: 16
---

Esegui OpenClaw Gateway in un container Podman rootless, gestito dal tuo attuale utente non root.

Il modello previsto è:

- Podman esegue il container del Gateway.
- La `openclaw` CLI dell'host è il piano di controllo.
- Per impostazione predefinita, lo stato persistente risiede sull'host in `~/.openclaw`.
- La gestione quotidiana usa `openclaw --container <name> ...` invece di `sudo -u openclaw`, `podman exec` o un utente di servizio separato.

## Prerequisiti

- **Podman** in modalità rootless
- **OpenClaw CLI** installata sull'host
- **Facoltativo:** `systemd --user` se vuoi l'avvio automatico gestito da Quadlet
- **Facoltativo:** `sudo` solo se vuoi `loginctl enable-linger "$(whoami)"` per la persistenza all'avvio su un host headless

## Avvio rapido

<Steps>
  <Step title="Configurazione una tantum">
    Dalla radice del repo, esegui `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Avvia il container del Gateway">
    Avvia il container con `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Esegui l'onboarding dentro il container">
    Esegui `./scripts/run-openclaw-podman.sh launch setup`, poi apri `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gestisci il container in esecuzione dalla CLI dell'host">
    Imposta `OPENCLAW_CONTAINER=openclaw`, poi usa i normali comandi `openclaw` dall'host.
  </Step>
</Steps>

Dettagli di configurazione:

- `./scripts/podman/setup.sh` crea `openclaw:local` nel tuo store Podman rootless per impostazione predefinita, oppure usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` se ne imposti una.
- Crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` se manca.
- Crea `~/.openclaw/.env` con `OPENCLAW_GATEWAY_TOKEN` se manca.
- Per gli avvii manuali, l'helper legge solo una piccola allowlist di chiavi relative a Podman da `~/.openclaw/.env` e passa al container variabili env di runtime esplicite; non passa l'intero file env a Podman.

Configurazione gestita da Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet è un'opzione solo Linux perché dipende dai servizi utente systemd.

Puoi anche impostare `OPENCLAW_PODMAN_QUADLET=1`.

Variabili env facoltative per build/configurazione:

- `OPENCLAW_IMAGE` o `OPENCLAW_PODMAN_IMAGE` -- usa un'immagine esistente/scaricata invece di crearere `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- installa pacchetti apt aggiuntivi durante la build dell'immagine
- `OPENCLAW_EXTENSIONS` -- preinstalla le dipendenze dei plugin al momento della build
- `OPENCLAW_INSTALL_BROWSER` -- preinstalla Chromium e Xvfb per l'automazione del browser (imposta a `1` per abilitare)

Avvio del container:

```bash
./scripts/run-openclaw-podman.sh launch
```

Lo script avvia il container con il tuo uid/gid attuale usando `--userns=keep-id` e monta in bind lo stato di OpenClaw nel container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Poi apri `http://127.0.0.1:18789/` e usa il token da `~/.openclaw/.env`.

Predefinito della CLI host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Poi comandi come questi verranno eseguiti automaticamente dentro quel container:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Su macOS, la macchina Podman può far apparire il browser come non locale al Gateway.
Se la Control UI segnala errori di autenticazione del dispositivo dopo l'avvio, usa le indicazioni su Tailscale in
[Podman e Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman e Tailscale

Per HTTPS o accesso remoto da browser, segui la documentazione principale di Tailscale.

Nota specifica per Podman:

- Mantieni l'host di pubblicazione Podman su `127.0.0.1`.
- Preferisci `tailscale serve` gestito dall'host rispetto a `openclaw gateway --tailscale serve`.
- Su macOS, se il contesto di autenticazione dispositivo del browser locale è inaffidabile, usa l'accesso tramite Tailscale invece di soluzioni alternative ad hoc con tunnel locali.

Vedi:

- [Tailscale](/it/gateway/tailscale)
- [Control UI](/it/web/control-ui)

## Systemd (Quadlet, facoltativo)

Se hai eseguito `./scripts/podman/setup.sh --quadlet`, la configurazione installa un file Quadlet in:

```bash
~/.config/containers/systemd/openclaw.container
```

Comandi utili:

- **Avvio:** `systemctl --user start openclaw.service`
- **Arresto:** `systemctl --user stop openclaw.service`
- **Stato:** `systemctl --user status openclaw.service`
- **Log:** `journalctl --user -u openclaw.service -f`

Dopo aver modificato il file Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Per la persistenza all'avvio su host SSH/headless, abilita il lingering per il tuo utente attuale:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configurazione, env e archiviazione

- **Directory di configurazione:** `~/.openclaw`
- **Directory workspace:** `~/.openclaw/workspace`
- **File token:** `~/.openclaw/.env`
- **Helper di avvio:** `./scripts/run-openclaw-podman.sh`

Lo script di avvio e Quadlet montano in bind lo stato dell'host nel container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Per impostazione predefinita queste sono directory host, non stato anonimo del container, quindi
`openclaw.json`, i file `auth-profiles.json` per agente, lo stato di canali/provider,
le sessioni e il workspace sopravvivono alla sostituzione del container.
La configurazione Podman inizializza anche `gateway.controlUi.allowedOrigins` per `127.0.0.1` e `localhost` sulla porta Gateway pubblicata, così la dashboard locale funziona con il bind non local loopback del container.

Variabili env utili per il launcher manuale:

- `OPENCLAW_PODMAN_CONTAINER` -- nome del container (`openclaw` per impostazione predefinita)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- immagine da eseguire
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- porta host mappata alla porta container `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- porta host mappata alla porta container `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfaccia host per le porte pubblicate; il valore predefinito è `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modalità di bind del Gateway dentro il container; il valore predefinito è `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (predefinito), `auto` o `host`

Il launcher manuale legge `~/.openclaw/.env` prima di finalizzare i valori predefiniti di container/immagine, quindi puoi renderli persistenti lì.

Se usi un `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR` non predefinito, imposta le stesse variabili sia per `./scripts/podman/setup.sh` sia per i successivi comandi `./scripts/run-openclaw-podman.sh launch`. Il launcher locale del repo non persiste override di percorsi personalizzati tra shell.

Nota su Quadlet:

- Il servizio Quadlet generato mantiene intenzionalmente una forma predefinita fissa e rafforzata: porte pubblicate su `127.0.0.1`, `--bind lan` dentro il container e namespace utente `keep-id`.
- Imposta `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`.
- Pubblica sia `127.0.0.1:18789:18789` (Gateway) sia `127.0.0.1:18790:18790` (bridge).
- Legge `~/.openclaw/.env` come `EnvironmentFile` di runtime per valori come `OPENCLAW_GATEWAY_TOKEN`, ma non consuma la allowlist di override specifici di Podman del launcher manuale.
- Se ti servono porte di pubblicazione personalizzate, un host di pubblicazione personalizzato o altri flag di esecuzione del container, usa il launcher manuale oppure modifica direttamente `~/.config/containers/systemd/openclaw.container`, quindi ricarica e riavvia il servizio.

## Comandi utili

- **Log del container:** `podman logs -f openclaw`
- **Arresta il container:** `podman stop openclaw`
- **Rimuovi il container:** `podman rm -f openclaw`
- **Apri l'URL della dashboard dalla CLI host:** `openclaw dashboard --no-open`
- **Integrità/stato tramite CLI host:** `openclaw gateway status --deep` (probe RPC + scansione
  extra del servizio)

## Risoluzione dei problemi

- **Permesso negato (EACCES) su configurazione o workspace:** Il container viene eseguito con `--userns=keep-id` e `--user <your uid>:<your gid>` per impostazione predefinita. Assicurati che i percorsi host di configurazione/workspace siano di proprietà del tuo utente attuale.
- **Avvio del Gateway bloccato (`gateway.mode=local` mancante):** Assicurati che `~/.openclaw/openclaw.json` esista e imposti `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea se manca.
- **I comandi CLI del container raggiungono il target sbagliato:** Usa esplicitamente `openclaw --container <name> ...`, oppure esporta `OPENCLAW_CONTAINER=<name>` nella tua shell.
- **`openclaw update` non riesce con `--container`:** Previsto. Ricrea/scarica l'immagine, quindi riavvia il container o il servizio Quadlet.
- **Il servizio Quadlet non si avvia:** Esegui `systemctl --user daemon-reload`, poi `systemctl --user start openclaw.service`. Sui sistemi headless potrebbe servirti anche `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blocca i mount bind:** Lascia invariato il comportamento di mount predefinito; il launcher aggiunge automaticamente `:Z` su Linux quando SELinux è enforcing o permissive.

## Correlati

- [Docker](/it/install/docker)
- [Processo in background del Gateway](/it/gateway/background-process)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
