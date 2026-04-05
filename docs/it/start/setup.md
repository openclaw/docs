---
read_when:
    - Configurazione di una nuova macchina
    - Vuoi “il meglio del meglio” senza compromettere la tua configurazione personale
summary: Configurazione avanzata e flussi di lavoro di sviluppo per OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-04-05T14:04:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: be4e280dde7f3a224345ca557ef2fb35a9c9db8520454ff63794ac6f8d4e71e7
    source_path: start/setup.md
    workflow: 15
---

# Configurazione

<Note>
Se stai effettuando la configurazione per la prima volta, inizia da [Getting Started](/start/getting-started).
Per i dettagli sull'onboarding, vedi [Onboarding (CLI)](/start/wizard).
</Note>

## In breve

- **La personalizzazione vive fuori dal repository:** `~/.openclaw/workspace` (workspace) + `~/.openclaw/openclaw.json` (configurazione).
- **Flusso di lavoro stabile:** installa l'app macOS; lascia che esegua il Gateway incluso.
- **Flusso di lavoro all'avanguardia:** esegui tu stesso il Gateway tramite `pnpm gateway:watch`, poi lascia che l'app macOS si colleghi in modalità Local.

## Prerequisiti (dal sorgente)

- Node 24 consigliato (Node 22 LTS, attualmente `22.14+`, ancora supportato)
- `pnpm` preferito (oppure Bun se usi intenzionalmente il [flusso di lavoro Bun](/it/install/bun))
- Docker (opzionale; solo per configurazione containerizzata/e2e — vedi [Docker](/it/install/docker))

## Strategia di personalizzazione (così gli aggiornamenti non causano problemi)

Se vuoi qualcosa di “100% personalizzato per me” _e_ aggiornamenti semplici, mantieni la tua personalizzazione in:

- **Configurazione:** `~/.openclaw/openclaw.json` (stile JSON/JSON5)
- **Workspace:** `~/.openclaw/workspace` (skills, prompt, memorie; rendilo un repository git privato)

Esegui l'inizializzazione una sola volta:

```bash
openclaw setup
```

Da dentro questo repository, usa l'entry della CLI locale:

```bash
openclaw setup
```

Se non hai ancora un'installazione globale, eseguila tramite `pnpm openclaw setup` (oppure `bun run openclaw setup` se stai usando il flusso di lavoro Bun).

## Esegui il Gateway da questo repository

Dopo `pnpm build`, puoi eseguire direttamente la CLI pacchettizzata:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flusso di lavoro stabile (prima l'app macOS)

1. Installa e avvia **OpenClaw.app** (barra dei menu).
2. Completa la checklist di onboarding/autorizzazioni (prompt TCC).
3. Assicurati che il Gateway sia **Local** e in esecuzione (l'app lo gestisce).
4. Collega le superfici di messaggistica (esempio: WhatsApp):

```bash
openclaw channels login
```

5. Controllo rapido:

```bash
openclaw health
```

Se l'onboarding non è disponibile nella tua build:

- Esegui `openclaw setup`, poi `openclaw channels login`, quindi avvia manualmente il Gateway (`openclaw gateway`).

## Flusso di lavoro all'avanguardia (Gateway in un terminale)

Obiettivo: lavorare sul Gateway TypeScript, ottenere l'hot reload e mantenere collegata l'interfaccia dell'app macOS.

### 0) (Facoltativo) Esegui anche l'app macOS dal sorgente

Se vuoi anche l'app macOS all'avanguardia:

```bash
./scripts/restart-mac.sh
```

### 1) Avvia il Gateway di sviluppo

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` esegue il gateway in modalità watch e ricarica in caso di modifiche rilevanti al sorgente,
alla configurazione e ai metadati dei plugin inclusi.

Se stai usando intenzionalmente il flusso di lavoro Bun, i comandi equivalenti sono:

```bash
bun install
bun run gateway:watch
```

### 2) Punta l'app macOS al Gateway in esecuzione

In **OpenClaw.app**:

- Modalità di connessione: **Local**
  L'app si collegherà al gateway in esecuzione sulla porta configurata.

### 3) Verifica

- Lo stato del Gateway nell'app dovrebbe indicare **“Using existing gateway …”**
- Oppure tramite CLI:

```bash
openclaw health
```

### Errori comuni

- **Porta errata:** il Gateway WS usa per impostazione predefinita `ws://127.0.0.1:18789`; mantieni app e CLI sulla stessa porta.
- **Dove si trovano i dati di stato:**
  - Stato canale/provider: `~/.openclaw/credentials/`
  - Profili di autenticazione del modello: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa di archiviazione delle credenziali

Usala quando esegui il debug dell'autenticazione o decidi cosa sottoporre a backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env oppure `channels.telegram.tokenFile` (solo file normali; i symlink vengono rifiutati)
- **Token bot Discord**: config/env oppure SecretRef (provider env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist di pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili di autenticazione del modello**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload di segreti supportato da file (opzionale)**: `~/.openclaw/secrets.json`
- **Importazione OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Maggiori dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornamento (senza distruggere la tua configurazione)

- Mantieni `~/.openclaw/workspace` e `~/.openclaw/` come “le tue cose”; non inserire prompt/configurazione personali nel repository `openclaw`.
- Aggiornamento del sorgente: `git pull` + il passaggio di installazione del package manager scelto (`pnpm install` per impostazione predefinita; `bun install` per il flusso di lavoro Bun) + continua a usare il comando `gateway:watch` corrispondente.

## Linux (servizio utente systemd)

Le installazioni Linux usano un servizio **utente** systemd. Per impostazione predefinita, systemd arresta i
servizi utente in caso di logout/inattività, il che interrompe il Gateway. L'onboarding prova ad abilitare
il lingering per te (potrebbe richiedere sudo). Se è ancora disattivato, esegui:

```bash
sudo loginctl enable-linger $USER
```

Per server sempre attivi o multiutente, considera invece un servizio **di sistema**
invece di un servizio utente (non serve il lingering). Vedi [Gateway runbook](/it/gateway) per le note su systemd.

## Documenti correlati

- [Gateway runbook](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema di configurazione + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (tag di risposta + impostazioni `replyToMode`)
- [Configurazione dell'assistente OpenClaw](/start/openclaw)
- [App macOS](/it/platforms/macos) (ciclo di vita del gateway)
