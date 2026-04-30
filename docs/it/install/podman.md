---
read_when:
    - Vuoi un Gateway containerizzato con Podman invece di Docker
summary: Esegui OpenClaw in un container Podman senza privilegi di root
title: Podman
x-i18n:
    generated_at: "2026-04-30T08:59:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

Esegui OpenClaw Gateway in un container Podman rootless, gestito dal tuo attuale utente non root.

Il modello previsto è:

- Podman esegue il container del gateway.
- La tua CLI host `openclaw` è il piano di controllo.
- Lo stato persistente si trova sull'host in `~/.openclaw` per impostazione predefinita.
- La gestione quotidiana usa `openclaw --container <name> ...` invece di `sudo -u openclaw`, `podman exec` o un utente di servizio separato.

## Prerequisiti

- **Podman** in modalità rootless
- **CLI OpenClaw** installata sull'host
- **Opzionale:** `systemd --user` se vuoi l'avvio automatico gestito da Quadlet
- **Opzionale:** `sudo` solo se vuoi `loginctl enable-linger "$(whoami)"` per la persistenza all'avvio su un host headless

## Avvio rapido

<Steps>
  <Step title="Configurazione iniziale">
    Dalla radice del repository, esegui `./scripts/podman/setup.sh`.
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

- `./scripts/podman/setup.sh` crea `openclaw:local` nel tuo store Podman rootless per impostazione predefinita, oppure usa `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` se ne imposti una.
- Crea `~/.openclaw/openclaw.json` con `gateway.mode: "local"` se manca.
- Crea `~/.openclaw/.env` con `OPENCLAW_GATEWAY_TOKEN` se manca.
- Per gli avvii manuali, l'helper legge solo una piccola allowlist di chiavi relative a Podman da `~/.openclaw/.env` e passa al container variabili di ambiente di runtime esplicite; non consegna a Podman l'intero file env.

Configurazione gestita da Quadlet:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet è un'opzione solo Linux perché dipende dai servizi utente systemd.

Puoi anche impostare `OPENCLAW_PODMAN_QUADLET=1`.

Variabili env opzionali per build/configurazione:

- `OPENCLAW_IMAGE` o `OPENCLAW_PODMAN_IMAGE` -- usa un'immagine esistente/scaricata invece di crearere `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- installa pacchetti apt aggiuntivi durante la build dell'immagine
- `OPENCLAW_EXTENSIONS` -- preinstalla le dipendenze dei plugin in fase di build
- `OPENCLAW_INSTALL_BROWSER` -- preinstalla Chromium e Xvfb per l'automazione del browser (imposta a `1` per abilitare)

Avvio del container:

```bash
./scripts/run-openclaw-podman.sh launch
```

Lo script avvia il container con il tuo uid/gid attuale usando `--userns=keep-id` e monta in bind il tuo stato OpenClaw nel container.

Onboarding:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

Poi apri `http://127.0.0.1:18789/` e usa il token da `~/.openclaw/.env`.

Predefinito della CLI host:

```bash
export OPENCLAW_CONTAINER=openclaw
```

Quindi comandi come questi verranno eseguiti automaticamente dentro quel container:

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # include scansione extra del servizio
openclaw doctor
openclaw channels login
```

Su macOS, Podman machine può far apparire il browser come non locale al gateway.
Se la Control UI segnala errori di autenticazione dispositivo dopo l'avvio, usa le indicazioni su Tailscale in
[Podman + Tailscale](#podman--tailscale).

<a id="podman--tailscale"></a>

## Podman + Tailscale

Per HTTPS o accesso remoto dal browser, segui la documentazione principale di Tailscale.

Nota specifica per Podman:

- Mantieni l'host di pubblicazione Podman su `127.0.0.1`.
- Preferisci `tailscale serve` gestito dall'host rispetto a `openclaw gateway --tailscale serve`.
- Su macOS, se il contesto di autenticazione dispositivo del browser locale non è affidabile, usa l'accesso Tailscale invece di workaround ad hoc con tunnel locali.

Vedi:

- [Tailscale](/it/gateway/tailscale)
- [Control UI](/it/web/control-ui)

## Systemd (Quadlet, opzionale)

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

Per la persistenza all'avvio su host SSH/headless, abilita lingering per il tuo utente attuale:

```bash
sudo loginctl enable-linger "$(whoami)"
```

## Configurazione, env e archiviazione

- **Directory di configurazione:** `~/.openclaw`
- **Directory workspace:** `~/.openclaw/workspace`
- **File token:** `~/.openclaw/.env`
- **Helper di avvio:** `./scripts/run-openclaw-podman.sh`

Lo script di avvio e Quadlet montano in bind lo stato host nel container:

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

Per impostazione predefinita queste sono directory host, non stato anonimo del container, quindi
`openclaw.json`, `auth-profiles.json` per agente, stato di canali/provider,
sessioni e workspace sopravvivono alla sostituzione del container.
La configurazione Podman inizializza anche `gateway.controlUi.allowedOrigins` per `127.0.0.1` e `localhost` sulla porta gateway pubblicata, così la dashboard locale funziona con il bind non-loopback del container.

Variabili env utili per il launcher manuale:

- `OPENCLAW_PODMAN_CONTAINER` -- nome del container (`openclaw` per impostazione predefinita)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- immagine da eseguire
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- porta host mappata al container `18789`
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- porta host mappata al container `18790`
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- interfaccia host per le porte pubblicate; il valore predefinito è `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- modalità di bind del gateway dentro il container; il valore predefinito è `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id` (predefinito), `auto` o `host`

Il launcher manuale legge `~/.openclaw/.env` prima di finalizzare i valori predefiniti di container/immagine, quindi puoi mantenerli lì.

Se usi un `OPENCLAW_CONFIG_DIR` o `OPENCLAW_WORKSPACE_DIR` non predefinito, imposta le stesse variabili sia per `./scripts/podman/setup.sh` sia per i successivi comandi `./scripts/run-openclaw-podman.sh launch`. Il launcher locale del repository non conserva override di percorso personalizzati tra shell.

Nota su Quadlet:

- Il servizio Quadlet generato mantiene intenzionalmente una forma predefinita fissa e rafforzata: porte pubblicate su `127.0.0.1`, `--bind lan` dentro il container e namespace utente `keep-id`.
- Fissa `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure` e `TimeoutStartSec=300`.
- Pubblica sia `127.0.0.1:18789:18789` (gateway) sia `127.0.0.1:18790:18790` (bridge).
- Legge `~/.openclaw/.env` come `EnvironmentFile` di runtime per valori come `OPENCLAW_GATEWAY_TOKEN`, ma non consuma la allowlist di override specifici di Podman del launcher manuale.
- Se ti servono porte pubblicate, host di pubblicazione o altri flag container-run personalizzati, usa il launcher manuale o modifica direttamente `~/.config/containers/systemd/openclaw.container`, poi ricarica e riavvia il servizio.

## Comandi utili

- **Log del container:** `podman logs -f openclaw`
- **Arresta container:** `podman stop openclaw`
- **Rimuovi container:** `podman rm -f openclaw`
- **Apri URL dashboard dalla CLI host:** `openclaw dashboard --no-open`
- **Salute/stato tramite CLI host:** `openclaw gateway status --deep` (probe RPC + scansione extra
  del servizio)

## Risoluzione dei problemi

- **Permesso negato (EACCES) su configurazione o workspace:** Il container viene eseguito con `--userns=keep-id` e `--user <your uid>:<your gid>` per impostazione predefinita. Assicurati che i percorsi host di configurazione/workspace siano di proprietà del tuo utente attuale.
- **Avvio del Gateway bloccato (`gateway.mode=local` mancante):** Assicurati che `~/.openclaw/openclaw.json` esista e imposti `gateway.mode="local"`. `scripts/podman/setup.sh` lo crea se manca.
- **I comandi CLI del container raggiungono la destinazione sbagliata:** Usa `openclaw --container <name> ...` esplicitamente, oppure esporta `OPENCLAW_CONTAINER=<name>` nella tua shell.
- **`openclaw update` fallisce con `--container`:** Previsto. Ricrea/scarica l'immagine, poi riavvia il container o il servizio Quadlet.
- **Il servizio Quadlet non si avvia:** Esegui `systemctl --user daemon-reload`, poi `systemctl --user start openclaw.service`. Su sistemi headless potresti dover usare anche `sudo loginctl enable-linger "$(whoami)"`.
- **SELinux blocca i montaggi bind:** Lascia invariato il comportamento di mount predefinito; il launcher aggiunge automaticamente `:Z` su Linux quando SELinux è in modalità enforcing o permissive.

## Correlati

- [Docker](/it/install/docker)
- [Processo in background del Gateway](/it/gateway/background-process)
- [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting)
