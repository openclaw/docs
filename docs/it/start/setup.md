---
read_when:
    - Configurazione di una nuova macchina
    - Vuoi "il più recente + il migliore" senza compromettere la tua configurazione personale
summary: Configurazione avanzata e flussi di lavoro di sviluppo per OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-05-06T09:09:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99b65443deac92ed74d2fb0d8db9a00bf81b37d60ce25c0c38c1f8d9a7c0cfd3
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se stai configurando per la prima volta, inizia da [Introduzione](/it/start/getting-started).
Per i dettagli sull'onboarding, consulta [Onboarding (CLI)](/it/start/wizard).
</Note>

## TL;DR

Scegli un flusso di configurazione in base alla frequenza con cui vuoi ricevere aggiornamenti e al fatto che tu voglia eseguire il Gateway autonomamente:

- **La personalizzazione vive fuori dal repo:** mantieni la configurazione e il workspace in `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/`, così gli aggiornamenti del repo non li toccheranno.
- **Flusso stabile (consigliato per la maggior parte degli utenti):** installa l'app macOS e lascia che esegua il Gateway incluso.
- **Flusso bleeding edge (dev):** esegui tu il Gateway tramite `pnpm gateway:watch`, quindi lascia che l'app macOS si colleghi in modalità Local.

## Prerequisiti (da sorgente)

- Node 24 consigliato (Node 22 LTS, attualmente `22.14+`, ancora supportato)
- `pnpm` richiesto per i checkout sorgente. OpenClaw carica i plugin inclusi dai
  pacchetti del workspace pnpm `extensions/*` in modalità dev, quindi `npm install`
  nella root non prepara l'intero albero sorgente.
- Docker (opzionale; solo per configurazione/e2e containerizzata: vedi [Docker](/it/install/docker))

## Strategia di personalizzazione (così gli aggiornamenti non fanno danni)

Se vuoi una configurazione "100% su misura per me" _e_ aggiornamenti semplici, mantieni le personalizzazioni in:

- **Configurazione:** `~/.openclaw/openclaw.json` (simile a JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompt, memorie; rendilo un repo git privato)

Esegui il bootstrap una volta:

```bash
openclaw setup
```

Da dentro questo repo, usa l'entry locale della CLI:

```bash
openclaw setup
```

Se non hai ancora un'installazione globale, eseguila tramite `pnpm openclaw setup`.

## Eseguire il Gateway da questo repo

Dopo `pnpm build`, puoi eseguire direttamente la CLI pacchettizzata:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flusso stabile (prima l'app macOS)

1. Installa e avvia **OpenClaw.app** (barra dei menu).
2. Completa la checklist di onboarding/permessi (prompt TCC).
3. Assicurati che il Gateway sia **Local** e in esecuzione (lo gestisce l'app).
4. Collega le superfici (esempio: WhatsApp):

```bash
openclaw channels login
```

5. Controllo di sanità:

```bash
openclaw health
```

Se l'onboarding non è disponibile nella tua build:

- Esegui `openclaw setup`, poi `openclaw channels login`, quindi avvia manualmente il Gateway (`openclaw gateway`).

## Flusso bleeding edge (Gateway in un terminale)

Obiettivo: lavorare sul Gateway TypeScript, ottenere hot reload, mantenere collegata l'interfaccia dell'app macOS.

### 0) (Opzionale) Esegui anche l'app macOS da sorgente

Se vuoi anche l'app macOS su bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Avvia il Gateway dev

```bash
pnpm install
# Solo al primo avvio (o dopo aver reimpostato la configurazione/workspace locale di OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` avvia o riavvia il processo di watch del Gateway in una sessione
tmux denominata e si collega automaticamente dai terminali interattivi. Le shell
non interattive restano scollegate e stampano `tmux attach -t openclaw-gateway-watch-main`; usa
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` per mantenere scollegata un'esecuzione interattiva,
oppure `pnpm gateway:watch:raw` per la modalità watch in primo piano. Il watcher
ricarica quando cambiano sorgenti, configurazione e metadati dei plugin inclusi pertinenti. Se il
Gateway osservato esce durante l'avvio, `gateway:watch` esegue
`openclaw doctor --fix --non-interactive` una volta e riprova; imposta
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` per disabilitare quel passaggio di riparazione solo dev.
`pnpm openclaw setup` è il passaggio una tantum di inizializzazione della configurazione/workspace locale per un checkout fresco.
`pnpm gateway:watch` non ricompila `dist/control-ui`, quindi riesegui `pnpm ui:build` dopo modifiche a `ui/` oppure usa `pnpm ui:dev` mentre sviluppi la Control UI.

### 2) Punta l'app macOS al Gateway in esecuzione

In **OpenClaw.app**:

- Modalità di connessione: **Local**
  L'app si collegherà al gateway in esecuzione sulla porta configurata.

### 3) Verifica

- Lo stato del Gateway nell'app dovrebbe mostrare **"Uso del gateway esistente …"**
- Oppure tramite CLI:

```bash
openclaw health
```

### Errori comuni

- **Porta sbagliata:** il valore predefinito di Gateway WS è `ws://127.0.0.1:18789`; mantieni app e CLI sulla stessa porta.
- **Dove vive lo stato:**
  - Stato canale/provider: `~/.openclaw/credentials/`
  - Profili di autenticazione modello: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa di archiviazione delle credenziali

Usala durante il debug dell'autenticazione o per decidere cosa includere nel backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env oppure `channels.telegram.tokenFile` (solo file regolare; symlink rifiutati)
- **Token bot Discord**: config/env oppure SecretRef (provider env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist di pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili di autenticazione modello**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload segreti basato su file (opzionale)**: `~/.openclaw/secrets.json`
- **Import OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Maggiori dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornamento (senza rovinare la configurazione)

- Considera `~/.openclaw/workspace` e `~/.openclaw/` come "le tue cose"; non inserire prompt/configurazioni personali nel repo `openclaw`.
- Aggiornamento del sorgente: `git pull` + `pnpm install` + continua a usare `pnpm gateway:watch`.

## Linux (servizio utente systemd)

Le installazioni Linux usano un servizio **utente** systemd. Per impostazione predefinita, systemd arresta i
servizi utente al logout/inattività, il che termina il Gateway. L'onboarding prova ad abilitare
il lingering per te (potrebbe chiedere sudo). Se è ancora disattivato, esegui:

```bash
sudo loginctl enable-linger $USER
```

Per server sempre attivi o multiutente, considera un servizio **di sistema** invece di un
servizio utente (nessun lingering necessario). Consulta il [runbook del Gateway](/it/gateway) per le note su systemd.

## Documenti correlati

- [Runbook del Gateway](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema di configurazione + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (tag di risposta + impostazioni replyToMode)
- [Configurazione assistente OpenClaw](/it/start/openclaw)
- [App macOS](/it/platforms/macos) (ciclo di vita del gateway)
