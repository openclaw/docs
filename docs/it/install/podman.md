---
read_when:
    - Vuoi un gateway containerizzato con Podman invece di Docker
summary: Eseguire OpenClaw in un container Podman rootless
title: Podman
x-i18n:
    generated_at: "2026-04-23T08:30:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: df478ad4ac63b363c86a53bc943494b32602abfaad8576c5e899e77f7699a533
    source_path: install/podman.md
    workflow: 15
---

# Podman

Esegui il Gateway OpenClaw in un container Podman rootless, gestito dal tuo attuale utente non-root.

Il modello previsto è:

- Podman esegue il container del gateway.
- La CLI `openclaw` sull'host è il control plane.
- Lo stato persistente risiede sull'host in `~/.openclaw` per impostazione predefinita.
- La gestione quotidiana usa `openclaw --container <name> ...` invece di `sudo -u openclaw`, `podman exec` o un utente di servizio separato.

## Prerequisiti

- **Podman** in modalità rootless
- **OpenClaw CLI** installata sull'host
- **Facoltativo:** `systemd --user` se vuoi l'avvio automatico gestito da Quadlet
- **Facoltativo:** `sudo` solo se vuoi `loginctl enable-linger "$(whoami)"` per la persistenza all'avvio su un host headless

## Avvio rapido

<Steps>
  <Step title="Configurazione una tantum">
    Dalla radice del repository, esegui `./scripts/podman/setup.sh`.
  </Step>

  <Step title="Avvia il container Gateway">
    Avvia il container con `./scripts/run-openclaw-podman.sh launch`.
  </Step>

  <Step title="Esegui l'onboarding all'interno del container">
    Esegui `./scripts/run-openclaw-podman.sh launch setup`, quindi apri `http://127.0.0.1:18789/`.
  </Step>

  <Step title="Gestisci il container in esecuzione dalla CLI host">
    Imposta `OPENCLAW_CONTAINER=openclaw`, quindi usa i normali comandi `openclaw` dall'host.
  </Step>
</Steps>

Dettagli della configurazione:

- `./scripts/podman/setup.sh` costruisce `openclaw:local` nel tuo store Podman rootless per impostazione predefinita, oppure usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` se ne imposti uno.
- Crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` se manca.
- Crea `~/.openclaw/.env` con `OPENCLAW_GATEWAY_TOKEN` se manca.
- Per gli avvii manuali, l'helper legge solo una piccola allowlist di chiavi correlate a Podman da `~/.openclaw/.env` e passa variabili env di runtime esplicite al container; non passa l'intero file env a Podman.

Configurazione gestita da Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet è un'opzione solo Linux perché dipende dai servizi utente systemd.

Puoi anche impostare `OPENCLAW_PODMAN_QUADLET=1`.

Variabili env facoltative di build/configurazione:

- `OPENCLAW_IMAGE` o `OPENCLAW_PODMAN_IMAGE` -- usa un'immagine esistente/scaricata invece di costruire `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- installa pacchetti apt aggiuntivi durante la build dell'immagine
- `OPENCLAW_EXTENSIONS` -- preinstalla le dipendenze dei plugin al momento della build

Avvio del container:

```bash
./scripts/run-openclaw-podman.sh launch
```

Lo script avvia il container con uid/gid correnti usando `--userns=keep-id` e monta tramite bind lo stato di OpenClaw nel container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Poi apri `http://127.0.0.1:18789/` e usa il token da `~/.openclaw/.env`.

Predefinito CLI host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Quindi comandi come questi verranno eseguiti automaticamente all'interno di quel container:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

Su macOS, Podman machine può far apparire il browser come non locale al gateway.
Se la Control UI segnala errori di device-auth dopo l'avvio, usa le indicazioni Tailscale in
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Per accesso HTTPS o browser remoto, segui la documentazione principale di Tailscale.

Nota specifica per Podman:

- Mantieni l'host di pubblicazione Podman su `127.0.0.1`.
- Preferisci `tailscale serve` gestito dall'host invece di `openclaw gateway --tailscale serve`.
- Su macOS, se il contesto device-auth del browser locale non è affidabile, usa l'accesso Tailscale invece di workaround improvvisati con tunnel locali.

Vedi:

- [Tailscale](/it/gateway/tailscale)
- [Control UI](/it/web/control-ui)

## Systemd (Quadlet, facoltativo)

Se hai eseguito `./scripts/podman/setup.sh --quadlet`, la configurazione installa un file Quadlet in:

```bash
~/.config/containers/systemd/openclaw.container
```

Comandi utili:

- **Avvia:** `systemctl --user start openclaw.service`
- **Arresta:** `systemctl --user stop openclaw.service`
- **Stato:** `systemctl --user status openclaw.service`
- **Log:** `journalctl --user -u openclaw.service -f`

Dopo aver modificato il file Quadlet:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

Per la persistenza all'avvio su host SSH/headless, abilita lingering per il tuo utente corrente:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configurazione, env e archiviazione

- **Directory config:** `~/.openclaw`
- **Directory workspace:** `~/.openclaw/workspace`
- **File token:** `~/.openclaw/.env`
- **Helper di avvio:** `./scripts/run-openclaw-podman.sh`

Lo script di avvio e Quadlet montano tramite bind lo stato host nel container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Per impostazione predefinita, queste sono directory host, non stato anonimo del container, quindi
`openclaw.json`, `auth-profiles.json` per agente, stato di canali/provider,
sessioni e workspace sopravvivono alla sostituzione del container.
La configurazione Podman inizializza anche `gateway.controlUi.allowedOrigins` per `127.0.0.1` e `localhost` sulla porta gateway pubblicata, così la dashboard locale funziona con il bind non-loopback del container.

Variabili env utili per il launcher manuale:

- `OPENCLAW_PODMAN_CONTAINER` -- nome del container (`openclaw` per impostazione predefinita)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- immagine da eseguire
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- porta host mappata al `18789` del container
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- porta host mappata al `18790` del container
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfaccia host per le porte pubblicate; il valore predefinito è `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modalità bind del gateway all'interno del container; il valore predefinito è `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (predefinito), `auto` o `host`

Il launcher manuale legge `~/.openclaw/.env` prima di finalizzare i valori predefiniti di container/immagine, quindi puoi persisterli lì.

Se usi un valore non predefinito per `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR`, imposta le stesse variabili sia per `./scripts/podman/setup.sh` sia per i successivi comandi `./scripts/run-openclaw-podman.sh launch`. Il launcher locale del repository non persiste gli override di percorso personalizzati tra shell diverse.

Nota su Quadlet:

- Il servizio Quadlet generato mantiene intenzionalmente una forma predefinita fissa e hardened: porte pubblicate su `127.0.0.1`, `--bind lan` all'interno del container e namespace utente `keep-id`.
- Fissa `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`.
- Pubblica sia `127.0.0.1:18789:18789` (gateway) sia `127.0.0.1:18790:18790` (bridge).
- Legge `~/.openclaw/.env` come `EnvironmentFile` di runtime per valori come `OPENCLAW_GATEWAY_TOKEN`, ma non usa la allowlist di override specifici Podman del launcher manuale.
- Se hai bisogno di porte pubblicate personalizzate, host di pubblicazione o altri flag di esecuzione del container, usa il launcher manuale oppure modifica direttamente `~/.config/containers/systemd/openclaw.container`, quindi ricarica e riavvia il servizio.

## Comandi utili

- **Log del container:** `podman logs -f openclaw`
- **Arresta il container:** `podman stop openclaw`
- **Rimuovi il container:** `podman rm -f openclaw`
- **Apri l'URL della dashboard dalla CLI host:** `openclaw dashboard --no-open`
- **Salute/stato tramite CLI host:** `openclaw gateway status --deep` (sonda RPC + scansione di servizio aggiuntiva)

## Risoluzione dei problemi

- **Permission denied (EACCES) su config o workspace:** il container viene eseguito con `--userns=keep-id` e `--user <your uid>:<your gid>` per impostazione predefinita. Assicurati che i percorsi config/workspace host appartengano al tuo utente corrente.
- **Avvio del gateway bloccato (manca `gateway.mode=local`):** assicurati che `~/.openclaw/openclaw.json` esista e imposti `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea se manca.
- **I comandi CLI del container colpiscono il target sbagliato:** usa esplicitamente `openclaw --container <name> ...`, oppure esporta `OPENCLAW_CONTAINER=<name>` nella tua shell.
- **`openclaw update` fallisce con `--container`:** previsto. Ricostruisci/scarica l'immagine, quindi riavvia il container o il servizio Quadlet.
- **Il servizio Quadlet non si avvia:** esegui `systemctl --user daemon-reload`, quindi `systemctl --user start openclaw.service`. Su sistemi headless potrebbe servirti anche `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blocca i bind mount:** lascia invariato il comportamento predefinito del mount; il launcher aggiunge automaticamente `:Z` su Linux quando SELinux è in modalità enforcing o permissive.

## Correlati

- [Docker](/it/install/docker)
- [Processo in background del gateway](/it/gateway/background-process)
- [Risoluzione dei problemi del gateway](/it/gateway/troubleshooting)
