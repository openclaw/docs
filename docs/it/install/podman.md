---
read_when:
    - Vuoi un gateway containerizzato con Podman invece di Docker
summary: Esegui OpenClaw in un container Podman rootless
title: Podman
x-i18n:
    generated_at: "2026-04-05T13:56:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6cb06e2d85b4b0c8a8c6e69c81f629c83b447cbcbb32e34b7876a1819c488020
    source_path: install/podman.md
    workflow: 15
---

# Podman

Esegui OpenClaw Gateway in un container Podman rootless, gestito dal tuo attuale utente non root.

Il modello previsto è:

- Podman esegue il container del gateway.
- La tua CLI `openclaw` sull'host è il control plane.
- Lo stato persistente vive sull'host sotto `~/.openclaw` per impostazione predefinita.
- La gestione quotidiana usa `openclaw --container <name> ...` invece di `sudo -u openclaw`, `podman exec` o un utente di servizio separato.

## Prerequisiti

- **Podman** in modalità rootless
- **CLI OpenClaw** installata sull'host
- **Facoltativo:** `systemd --user` se vuoi l'avvio automatico gestito da Quadlet
- **Facoltativo:** `sudo` solo se vuoi `loginctl enable-linger "$(whoami)"` per la persistenza al boot su un host headless

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

  <Step title="Gestisci il container in esecuzione dalla CLI host">
    Imposta `OPENCLAW_CONTAINER=openclaw`, poi usa i normali comandi `openclaw` dall'host.
  </Step>
</Steps>

Dettagli di configurazione:

- `./scripts/podman/setup.sh` costruisce per impostazione predefinita `openclaw:local` nel tuo store Podman rootless, oppure usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` se ne imposti uno.
- Crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` se manca.
- Crea `~/.openclaw/.env` con `OPENCLAW_GATEWAY_TOKEN` se manca.
- Per gli avvii manuali, l'helper legge solo una piccola allowlist di chiavi relative a Podman da `~/.openclaw/.env` e passa env var runtime esplicite al container; non passa l'intero file env a Podman.

Configurazione gestita da Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet è un'opzione solo Linux perché dipende dai servizi utente systemd.

Puoi anche impostare `OPENCLAW_PODMAN_QUADLET=1`.

Env var opzionali di build/configurazione:

- `OPENCLAW_IMAGE` o `OPENCLAW_PODMAN_IMAGE` -- usa un'immagine esistente/scaricata invece di costruire `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- installa pacchetti apt aggiuntivi durante la build dell'immagine
- `OPENCLAW_EXTENSIONS` -- preinstalla le dipendenze delle estensioni al momento della build

Avvio del container:

```bash
./scripts/run-openclaw-podman.sh launch
```

Lo script avvia il container con il tuo uid/gid corrente tramite `--userns=keep-id` ed esegue il bind-mount dello stato OpenClaw nel container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Poi apri `http://127.0.0.1:18789/` e usa il token da `~/.openclaw/.env`.

Predefinito per la CLI host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Poi comandi come questi verranno eseguiti automaticamente all'interno di quel container:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # include una scansione di servizio aggiuntiva
openclaw doctor
openclaw channels login
```

Su macOS, Podman machine può far apparire il browser come non locale al gateway.
Se la UI di controllo riporta errori di autenticazione del dispositivo dopo l'avvio, usa le indicazioni Tailscale in
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Per HTTPS o accesso browser remoto, segui la documentazione principale di Tailscale.

Nota specifica per Podman:

- Mantieni l'host di pubblicazione Podman su `127.0.0.1`.
- Preferisci `tailscale serve` gestito dall'host invece di `openclaw gateway --tailscale serve`.
- Su macOS, se il contesto di autenticazione del dispositivo del browser locale non è affidabile, usa l'accesso Tailscale invece di workaround improvvisati con tunnel locali.

Vedi:

- [Tailscale](/gateway/tailscale)
- [UI di controllo](/web/control-ui)

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

Per la persistenza al boot su host SSH/headless, abilita il lingering per il tuo utente corrente:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configurazione, env e storage

- **Directory config:** `~/.openclaw`
- **Directory workspace:** `~/.openclaw/workspace`
- **File token:** `~/.openclaw/.env`
- **Helper di avvio:** `./scripts/run-openclaw-podman.sh`

Lo script di avvio e Quadlet eseguono il bind-mount dello stato host nel container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Per impostazione predefinita queste sono directory host, non stato anonimo del container, quindi
`openclaw.json`, `auth-profiles.json` per agente, stato del canale/provider,
sessioni e workspace sopravvivono alla sostituzione del container.
La configurazione Podman inizializza anche `gateway.controlUi.allowedOrigins` per `127.0.0.1` e `localhost` sulla porta gateway pubblicata, in modo che la dashboard locale funzioni con il bind non loopback del container.

Env var utili per il launcher manuale:

- `OPENCLAW_PODMAN_CONTAINER` -- nome del container (`openclaw` per impostazione predefinita)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- immagine da eseguire
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- porta host mappata sul `18789` del container
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- porta host mappata sul `18790` del container
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfaccia host per le porte pubblicate; il valore predefinito è `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modalità bind del gateway all'interno del container; il valore predefinito è `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (predefinito), `auto` o `host`

Il launcher manuale legge `~/.openclaw/.env` prima di finalizzare i valori predefiniti di container/immagine, così puoi conservarli lì.

Se usi un `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR` non predefinito, imposta le stesse variabili sia per `./scripts/podman/setup.sh` sia per i successivi comandi `./scripts/run-openclaw-podman.sh launch`. Il launcher locale del repo non mantiene override di percorso personalizzati tra shell diverse.

Nota su Quadlet:

- Il servizio Quadlet generato mantiene intenzionalmente una forma predefinita fissa e rinforzata: porte pubblicate su `127.0.0.1`, `--bind lan` dentro il container e user namespace `keep-id`.
- Fissa `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`.
- Pubblica sia `127.0.0.1:18789:18789` (gateway) sia `127.0.0.1:18790:18790` (bridge).
- Legge `~/.openclaw/.env` come `EnvironmentFile` runtime per valori come `OPENCLAW_GATEWAY_TOKEN`, ma non usa la allowlist di override specifici Podman del launcher manuale.
- Se hai bisogno di porte di pubblicazione personalizzate, host di pubblicazione o altri flag `container-run`, usa il launcher manuale oppure modifica direttamente `~/.config/containers/systemd/openclaw.container`, quindi ricarica e riavvia il servizio.

## Comandi utili

- **Log del container:** `podman logs -f openclaw`
- **Arresta il container:** `podman stop openclaw`
- **Rimuovi il container:** `podman rm -f openclaw`
- **Apri l'URL della dashboard dalla CLI host:** `openclaw dashboard --no-open`
- **Stato/salute tramite CLI host:** `openclaw gateway status --deep` (probe RPC + scansione di servizio aggiuntiva)

## Risoluzione dei problemi

- **Permission denied (EACCES) su config o workspace:** il container viene eseguito per impostazione predefinita con `--userns=keep-id` e `--user <your uid>:<your gid>`. Assicurati che i percorsi config/workspace host siano di proprietà del tuo utente corrente.
- **Avvio del gateway bloccato (manca `gateway.mode=local`):** assicurati che `~/.openclaw/openclaw.json` esista e imposti `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea se manca.
- **I comandi CLI del container colpiscono il target sbagliato:** usa esplicitamente `openclaw --container <name> ...`, oppure esporta `OPENCLAW_CONTAINER=<name>` nella tua shell.
- **`openclaw update` fallisce con `--container`:** previsto. Ricostruisci/scarica l'immagine, poi riavvia il container o il servizio Quadlet.
- **Il servizio Quadlet non si avvia:** esegui `systemctl --user daemon-reload`, poi `systemctl --user start openclaw.service`. Su sistemi headless potrebbe servirti anche `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blocca i bind mount:** lascia invariato il comportamento di mount predefinito; il launcher aggiunge automaticamente `:Z` su Linux quando SELinux è in modalità enforcing o permissive.

## Correlati

- [Docker](/install/docker)
- [Processo Gateway in background](/gateway/background-process)
- [Risoluzione dei problemi del Gateway](/gateway/troubleshooting)
