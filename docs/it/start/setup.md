---
read_when:
    - Configurare una nuova macchina
    - Vuoi “latest + greatest” senza rompere la tua configurazione personale
summary: Configurazione avanzata e flussi di sviluppo per OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-04-24T09:03:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4a965f39a14697a677c89ccadeb2b11b10c8e704e81e00619fffd5abe2ebc83
    source_path: start/setup.md
    workflow: 15
---

<Note>
Se stai configurando tutto per la prima volta, inizia da [Per iniziare](/it/start/getting-started).
Per i dettagli sull'onboarding, consulta [Onboarding (CLI)](/it/start/wizard).
</Note>

## In breve

Scegli un flusso di configurazione in base a quanto spesso vuoi aggiornamenti e se vuoi eseguire il Gateway in prima persona:

- **La personalizzazione vive fuori dal repo:** mantieni configurazione e workspace in `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` così gli aggiornamenti del repo non li toccano.
- **Flusso stabile (consigliato per la maggior parte):** installa l'app macOS e lascia che esegua il Gateway incluso.
- **Flusso bleeding edge (dev):** esegui tu stesso il Gateway tramite `pnpm gateway:watch`, poi lascia che l'app macOS si colleghi in modalità Local.

## Prerequisiti (dal sorgente)

- Node 24 consigliato (Node 22 LTS, attualmente `22.14+`, ancora supportato)
- `pnpm` preferito (oppure Bun se usi intenzionalmente il [flusso Bun](/it/install/bun))
- Docker (facoltativo; solo per configurazione/e2e containerizzata — vedi [Docker](/it/install/docker))

## Strategia di personalizzazione (così gli aggiornamenti non fanno danni)

Se vuoi “100% su misura per me” _e_ aggiornamenti facili, mantieni la tua personalizzazione in:

- **Configurazione:** `~/.openclaw/openclaw.json` (stile JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (skill, prompt, memorie; rendilo un repo git privato)

Bootstrap una volta:

```bash
openclaw setup
```

Da dentro questo repo, usa l'entry CLI locale:

```bash
openclaw setup
```

Se non hai ancora un'installazione globale, eseguilo tramite `pnpm openclaw setup` (oppure `bun run openclaw setup` se stai usando il flusso Bun).

## Eseguire il Gateway da questo repo

Dopo `pnpm build`, puoi eseguire direttamente la CLI pacchettizzata:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flusso stabile (prima l'app macOS)

1. Installa e avvia **OpenClaw.app** (barra dei menu).
2. Completa la checklist di onboarding/permessi (prompt TCC).
3. Assicurati che il Gateway sia **Local** e in esecuzione (l'app lo gestisce).
4. Collega le superfici (esempio: WhatsApp):

```bash
openclaw channels login
```

5. Controllo di sanità:

```bash
openclaw health
```

Se l'onboarding non è disponibile nella tua build:

- Esegui `openclaw setup`, poi `openclaw channels login`, poi avvia manualmente il Gateway (`openclaw gateway`).

## Flusso bleeding edge (Gateway in un terminale)

Obiettivo: lavorare sul Gateway TypeScript, ottenere hot reload, mantenendo la UI dell'app macOS collegata.

### 0) (Facoltativo) Esegui anche l'app macOS dal sorgente

Se vuoi anche l'app macOS in modalità bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Avvia il Gateway dev

```bash
pnpm install
# Solo al primo avvio (o dopo aver reimpostato configurazione/workspace locali di OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` esegue il gateway in modalità watch e ricarica in caso di modifiche rilevanti a sorgente,
configurazione e metadati dei Plugin inclusi.
`pnpm openclaw setup` è il passaggio una tantum di inizializzazione locale di configurazione/workspace per un checkout pulito.
`pnpm gateway:watch` non ricostruisce `dist/control-ui`, quindi riesegui `pnpm ui:build` dopo modifiche a `ui/` oppure usa `pnpm ui:dev` mentre sviluppi la UI di Control.

Se stai usando intenzionalmente il flusso Bun, i comandi equivalenti sono:

```bash
bun install
# Solo al primo avvio (o dopo aver reimpostato configurazione/workspace locali di OpenClaw)
bun run openclaw setup
bun run gateway:watch
```

### 2) Punta l'app macOS al Gateway in esecuzione

In **OpenClaw.app**:

- Modalità di connessione: **Local**
  L'app si collegherà al gateway in esecuzione sulla porta configurata.

### 3) Verifica

- Lo stato del Gateway nell'app dovrebbe mostrare **“Using existing gateway …”**
- Oppure via CLI:

```bash
openclaw health
```

### Errori comuni

- **Porta errata:** il WS del Gateway usa per default `ws://127.0.0.1:18789`; mantieni app + CLI sulla stessa porta.
- **Dove vive lo stato:**
  - Stato canale/provider: `~/.openclaw/credentials/`
  - Profili auth del modello: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa di archiviazione delle credenziali

Usala quando fai debug dell'autenticazione o devi decidere cosa salvare nel backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env oppure `channels.telegram.tokenFile` (solo file regolari; i symlink vengono rifiutati)
- **Token bot Discord**: config/env oppure SecretRef (provider env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist di pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili auth del modello**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload dei segreti supportato da file (facoltativo)**: `~/.openclaw/secrets.json`
- **Import OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Più dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornare (senza distruggere la tua configurazione)

- Mantieni `~/.openclaw/workspace` e `~/.openclaw/` come “la tua roba”; non inserire prompt/config personali nel repo `openclaw`.
- Aggiornamento del sorgente: `git pull` + il passaggio di installazione del package manager scelto (`pnpm install` per default; `bun install` per il flusso Bun) + continua a usare il comando `gateway:watch` corrispondente.

## Linux (servizio utente systemd)

Le installazioni Linux usano un servizio **utente** systemd. Per impostazione predefinita, systemd ferma i
servizi utente al logout/inattività, il che spegne il Gateway. L'onboarding tenta di abilitare
il lingering per te (potrebbe richiedere sudo). Se è ancora disattivato, esegui:

```bash
sudo loginctl enable-linger $USER
```

Per server sempre attivi o multiutente, valuta un servizio **di sistema** invece di un
servizio utente (nessun lingering necessario). Consulta [Runbook del Gateway](/it/gateway) per le note su systemd.

## Documentazione correlata

- [Runbook del Gateway](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema config + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (reply tag + impostazioni replyToMode)
- [Configurazione dell'assistente OpenClaw](/it/start/openclaw)
- [app macOS](/it/platforms/macos) (ciclo di vita del gateway)
