---
read_when:
    - Configurazione di una nuova macchina
    - Vuoi il “più recente e migliore” senza compromettere la tua configurazione personale
summary: Configurazione avanzata e flussi di lavoro di sviluppo per OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-05-02T08:34:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 101f7911d4a4cba139dd7a464b2ed82e2c80c630ba6ea58486309642c6690ee9
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se stai configurando per la prima volta, inizia da [Guida introduttiva](/it/start/getting-started).
Per i dettagli sull'onboarding, vedi [Onboarding (CLI)](/it/start/wizard).
</Note>

## In breve

Scegli un flusso di configurazione in base alla frequenza con cui vuoi ricevere aggiornamenti e al fatto che tu voglia eseguire il Gateway personalmente:

- **La personalizzazione resta fuori dal repository:** mantieni configurazione e workspace in `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` così gli aggiornamenti del repository non li modificano.
- **Flusso di lavoro stabile (consigliato per la maggior parte degli utenti):** installa l'app macOS e lascia che esegua il Gateway incluso.
- **Flusso di lavoro all'avanguardia (sviluppo):** esegui personalmente il Gateway tramite `pnpm gateway:watch`, poi lascia che l'app macOS si colleghi in modalità Local.

## Prerequisiti (da sorgente)

- Node 24 consigliato (Node 22 LTS, attualmente `22.14+`, ancora supportato)
- `pnpm` è richiesto per i checkout da sorgente. OpenClaw carica i plugin inclusi dai pacchetti pnpm workspace `extensions/*` in modalità di sviluppo, quindi `npm install` nella root non prepara l'intero albero sorgente.
- Docker (facoltativo; solo per configurazione/e2e containerizzati — vedi [Docker](/it/install/docker))

## Strategia di personalizzazione (così gli aggiornamenti non fanno danni)

Se vuoi una configurazione “100% su misura per me” _e_ aggiornamenti semplici, mantieni le personalizzazioni in:

- **Configurazione:** `~/.openclaw/openclaw.json` (JSON/simile a JSON5)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompt, memorie; rendilo un repository git privato)

Esegui il bootstrap una volta:

```bash
openclaw setup
```

Da dentro questo repository, usa l'entrypoint CLI locale:

```bash
openclaw setup
```

Se non hai ancora un'installazione globale, eseguilo tramite `pnpm openclaw setup`.

## Eseguire il Gateway da questo repository

Dopo `pnpm build`, puoi eseguire direttamente la CLI pacchettizzata:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flusso di lavoro stabile (prima l'app macOS)

1. Installa e avvia **OpenClaw.app** (barra dei menu).
2. Completa la checklist di onboarding/permessi (prompt TCC).
3. Assicurati che il Gateway sia **Local** e in esecuzione (lo gestisce l'app).
4. Collega le superfici (esempio: WhatsApp):

```bash
openclaw channels login
```

5. Controllo di base:

```bash
openclaw health
```

Se l'onboarding non è disponibile nella tua build:

- Esegui `openclaw setup`, poi `openclaw channels login`, quindi avvia manualmente il Gateway (`openclaw gateway`).

## Flusso di lavoro all'avanguardia (Gateway in un terminale)

Obiettivo: lavorare sul Gateway TypeScript, ottenere hot reload, mantenere collegata l'interfaccia dell'app macOS.

### 0) (Facoltativo) Esegui anche l'app macOS da sorgente

Se vuoi anche l'app macOS all'avanguardia:

```bash
./scripts/restart-mac.sh
```

### 1) Avvia il Gateway di sviluppo

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` avvia o riavvia il processo di osservazione del Gateway in una sessione tmux con nome e si collega automaticamente dai terminali interattivi. Le shell non interattive restano scollegate e stampano `tmux attach -t openclaw-gateway-watch-main`; usa `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` per mantenere scollegata un'esecuzione interattiva, oppure `pnpm gateway:watch:raw` per la modalità di osservazione in primo piano. Il watcher ricarica in caso di modifiche rilevanti a sorgenti, configurazione e metadati dei plugin inclusi.
`pnpm openclaw setup` è il passaggio una tantum di inizializzazione della configurazione/workspace locale per un checkout nuovo.
`pnpm gateway:watch` non ricompila `dist/control-ui`, quindi riesegui `pnpm ui:build` dopo modifiche a `ui/` oppure usa `pnpm ui:dev` durante lo sviluppo della Control UI.

### 2) Punta l'app macOS al Gateway in esecuzione

In **OpenClaw.app**:

- Modalità di connessione: **Local**
  L'app si collegherà al gateway in esecuzione sulla porta configurata.

### 3) Verifica

- Lo stato del Gateway nell'app dovrebbe mostrare **“Uso del gateway esistente …”**
- Oppure tramite CLI:

```bash
openclaw health
```

### Insidie comuni

- **Porta sbagliata:** il WS del Gateway usa come default `ws://127.0.0.1:18789`; mantieni app e CLI sulla stessa porta.
- **Dove risiede lo stato:**
  - Stato canali/provider: `~/.openclaw/credentials/`
  - Profili di autenticazione modello: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa di archiviazione delle credenziali

Usala quando fai debug dell'autenticazione o decidi cosa salvare in backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: configurazione/env o `channels.telegram.tokenFile` (solo file regolare; symlink rifiutati)
- **Token bot Discord**: configurazione/env o SecretRef (provider env/file/exec)
- **Token Slack**: configurazione/env (`channels.slack.*`)
- **Allowlist di pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili di autenticazione modello**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload di segreti basato su file (facoltativo)**: `~/.openclaw/secrets.json`
- **Importazione OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Maggiori dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornamento (senza rovinare la configurazione)

- Considera `~/.openclaw/workspace` e `~/.openclaw/` come “le tue cose”; non mettere prompt/configurazioni personali nel repository `openclaw`.
- Aggiornamento del sorgente: `git pull` + `pnpm install` + continua a usare `pnpm gateway:watch`.

## Linux (servizio utente systemd)

Le installazioni Linux usano un servizio systemd **utente**. Per impostazione predefinita, systemd arresta i servizi utente al logout/in inattività, uccidendo il Gateway. L'onboarding prova ad abilitare il lingering per te (potrebbe chiedere sudo). Se è ancora disattivato, esegui:

```bash
sudo loginctl enable-linger $USER
```

Per server sempre attivi o multiutente, considera invece un servizio **di sistema** al posto di un servizio utente (nessun lingering necessario). Vedi [Runbook del Gateway](/it/gateway) per le note su systemd.

## Documentazione correlata

- [Runbook del Gateway](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema di configurazione + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (tag di risposta + impostazioni replyToMode)
- [Configurazione dell'assistente OpenClaw](/it/start/openclaw)
- [App macOS](/it/platforms/macos) (ciclo di vita del gateway)
