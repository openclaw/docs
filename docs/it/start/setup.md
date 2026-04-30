---
read_when:
    - Configurazione di una nuova macchina
    - Vuoi “il più recente + il migliore” senza compromettere la tua configurazione personale
summary: Configurazione avanzata e flussi di lavoro di sviluppo per OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-04-30T09:13:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se stai configurando per la prima volta, inizia da [Primi passi](/it/start/getting-started).
Per i dettagli sull'onboarding, consulta [Onboarding (CLI)](/it/start/wizard).
</Note>

## TL;DR

Scegli un flusso di configurazione in base a quanto spesso vuoi ricevere aggiornamenti e se vuoi eseguire il Gateway autonomamente:

- **La personalizzazione vive fuori dal repo:** tieni la tua configurazione e il workspace in `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` così gli aggiornamenti del repo non li toccano.
- **Flusso stabile (consigliato per la maggior parte degli utenti):** installa l'app macOS e lascia che esegua il Gateway incluso.
- **Flusso bleeding edge (dev):** esegui il Gateway autonomamente tramite `pnpm gateway:watch`, poi lascia che l'app macOS si colleghi in modalità Locale.

## Prerequisiti (da sorgente)

- Node 24 consigliato (Node 22 LTS, attualmente `22.14+`, ancora supportato)
- `pnpm` preferito (o Bun se usi intenzionalmente il [flusso Bun](/it/install/bun))
- Docker (opzionale; solo per configurazione/e2e containerizzati — vedi [Docker](/it/install/docker))

## Strategia di personalizzazione (così gli aggiornamenti non fanno danni)

Se vuoi qualcosa di “100% su misura per me” _e_ aggiornamenti semplici, tieni le tue personalizzazioni in:

- **Configurazione:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (skills, prompt, memorie; rendilo un repo git privato)

Esegui il bootstrap una volta:

```bash
openclaw setup
```

Da dentro questo repo, usa la voce CLI locale:

```bash
openclaw setup
```

Se non hai ancora un'installazione globale, eseguilo tramite `pnpm openclaw setup` (o `bun run openclaw setup` se stai usando il flusso Bun).

## Eseguire il Gateway da questo repo

Dopo `pnpm build`, puoi eseguire direttamente la CLI pacchettizzata:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flusso stabile (prima l'app macOS)

1. Installa e avvia **OpenClaw.app** (barra dei menu).
2. Completa la checklist di onboarding/permessi (prompt TCC).
3. Assicurati che il Gateway sia **Locale** e in esecuzione (l'app lo gestisce).
4. Collega le superfici (esempio: WhatsApp):

```bash
openclaw channels login
```

5. Controllo di integrità:

```bash
openclaw health
```

Se l'onboarding non è disponibile nella tua build:

- Esegui `openclaw setup`, poi `openclaw channels login`, quindi avvia manualmente il Gateway (`openclaw gateway`).

## Flusso bleeding edge (Gateway in un terminale)

Obiettivo: lavorare sul Gateway TypeScript, ottenere il ricaricamento a caldo, mantenere collegata l'interfaccia dell'app macOS.

### 0) (Opzionale) Eseguire anche l'app macOS da sorgente

Se vuoi anche l'app macOS in bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Avviare il Gateway di sviluppo

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` avvia o riavvia il processo di watch del Gateway in una sessione tmux
con nome e si collega automaticamente dai terminali interattivi. Le shell non interattive restano
scollegate e stampano `tmux attach -t openclaw-gateway-watch-main`; usa
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` per mantenere scollegata un'esecuzione interattiva,
oppure `pnpm gateway:watch:raw` per la modalità watch in primo piano. Il watcher
ricarica in caso di modifiche rilevanti a sorgente, configurazione e metadati dei Plugin inclusi.
`pnpm openclaw setup` è il passaggio una tantum di inizializzazione della configurazione/workspace locale per un checkout nuovo.
`pnpm gateway:watch` non ricostruisce `dist/control-ui`, quindi riesegui `pnpm ui:build` dopo modifiche in `ui/` oppure usa `pnpm ui:dev` durante lo sviluppo della Control UI.

Se stai usando intenzionalmente il flusso Bun, i comandi equivalenti sono:

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) Puntare l'app macOS al Gateway in esecuzione

In **OpenClaw.app**:

- Modalità di connessione: **Locale**
  L'app si collegherà al gateway in esecuzione sulla porta configurata.

### 3) Verificare

- Lo stato del Gateway nell'app dovrebbe indicare **“Uso del gateway esistente …”**
- Oppure tramite CLI:

```bash
openclaw health
```

### Problemi comuni

- **Porta errata:** il WS del Gateway ha come valore predefinito `ws://127.0.0.1:18789`; mantieni app e CLI sulla stessa porta.
- **Dove vive lo stato:**
  - Stato di canali/provider: `~/.openclaw/credentials/`
  - Profili di autenticazione del modello: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa di archiviazione delle credenziali

Usala quando esegui il debug dell'autenticazione o decidi cosa sottoporre a backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: configurazione/env o `channels.telegram.tokenFile` (solo file normale; symlink rifiutati)
- **Token bot Discord**: configurazione/env o SecretRef (provider env/file/exec)
- **Token Slack**: configurazione/env (`channels.slack.*`)
- **Allowlist di pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili di autenticazione del modello**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload dei segreti basato su file (opzionale)**: `~/.openclaw/secrets.json`
- **Importazione OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Maggiori dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornamento (senza rovinare la configurazione)

- Considera `~/.openclaw/workspace` e `~/.openclaw/` come “le tue cose”; non mettere prompt/config personali nel repo `openclaw`.
- Aggiornamento del sorgente: `git pull` + il passaggio di installazione del gestore pacchetti scelto (`pnpm install` per impostazione predefinita; `bun install` per il flusso Bun) + continua a usare il comando `gateway:watch` corrispondente.

## Linux (servizio utente systemd)

Le installazioni Linux usano un servizio systemd **utente**. Per impostazione predefinita, systemd arresta i
servizi utente al logout/inattività, il che termina il Gateway. L'onboarding tenta di abilitare
il lingering per te (potrebbe richiedere sudo). Se è ancora disattivato, esegui:

```bash
sudo loginctl enable-linger $USER
```

Per server sempre attivi o multiutente, considera un servizio **di sistema** invece di un
servizio utente (non serve lingering). Consulta il [runbook del Gateway](/it/gateway) per le note su systemd.

## Documentazione correlata

- [Runbook del Gateway](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema di configurazione + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (tag di risposta + impostazioni replyToMode)
- [Configurazione dell'assistente OpenClaw](/it/start/openclaw)
- [App macOS](/it/platforms/macos) (ciclo di vita del gateway)
