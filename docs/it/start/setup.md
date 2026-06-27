---
read_when:
    - Configurazione di una nuova macchina
    - Vuoi il “meglio e più recente” senza compromettere la tua configurazione personale
summary: Flussi di lavoro avanzati di configurazione e sviluppo per OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-06-27T18:16:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81cad59d4eab731ba548452211bfc578d6f79e38431057c52cc3580d3b9d9944
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se stai configurando per la prima volta, inizia da [Per iniziare](/it/start/getting-started).
Per i dettagli sull'onboarding, consulta [Onboarding (CLI)](/it/start/wizard).
</Note>

## TL;DR

Scegli un flusso di configurazione in base alla frequenza con cui vuoi ricevere aggiornamenti e al fatto che tu voglia eseguire personalmente il Gateway:

- **La personalizzazione vive fuori dal repo:** tieni la configurazione e l'area di lavoro in `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` in modo che gli aggiornamenti del repo non le tocchino.
- **Flusso stabile (consigliato per la maggior parte degli utenti):** installa l'app macOS e lascia che esegua il Gateway incluso.
- **Flusso bleeding edge (dev):** esegui personalmente il Gateway tramite `pnpm gateway:watch`, poi lascia che l'app macOS si colleghi in modalità Local.

## Prerequisiti (da sorgente)

- Node 24 consigliato (Node 22 LTS, attualmente `22.19+`, ancora supportato)
- `pnpm` è richiesto per i checkout da sorgente. OpenClaw carica i plugin inclusi dai pacchetti workspace pnpm
  `extensions/*` in modalità dev, quindi `npm install` nella root
  non prepara l'intero albero sorgente.
- Docker (opzionale; solo per configurazione/e2e containerizzata - vedi [Docker](/it/install/docker))

## Strategia di personalizzazione (così gli aggiornamenti non fanno danni)

Se vuoi un'esperienza "100% su misura per me" _e_ aggiornamenti facili, tieni la tua personalizzazione in:

- **Configurazione:** `~/.openclaw/openclaw.json` (simile a JSON/JSON5)
- **Area di lavoro:** `~/.openclaw/workspace` (skills, prompt, memorie; rendila un repo git privato)

Esegui il bootstrap una sola volta:

```bash
openclaw setup
```

Dall'interno di questo repo, usa l'entrypoint CLI locale:

```bash
openclaw setup
```

Se non hai ancora un'installazione globale, eseguilo tramite `pnpm openclaw setup`.

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

5. Controllo rapido:

```bash
openclaw health
```

Se l'onboarding non è disponibile nella tua build:

- Esegui `openclaw setup`, poi `openclaw channels login`, quindi avvia manualmente il Gateway (`openclaw gateway`).

## Flusso bleeding edge (Gateway in un terminale)

Obiettivo: lavorare sul Gateway TypeScript, ottenere il ricaricamento a caldo, mantenere collegata l'interfaccia dell'app macOS.

### 0) (Opzionale) Eseguire anche l'app macOS da sorgente

Se vuoi anche l'app macOS sulla bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Avviare il Gateway di sviluppo

```bash
pnpm install
# Solo alla prima esecuzione (o dopo aver reimpostato la configurazione/area di lavoro locale di OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` avvia o riavvia il processo watch del Gateway in una sessione tmux
con nome e si collega automaticamente dai terminali interattivi. Le shell non interattive restano
scollegate e stampano `tmux attach -t openclaw-gateway-watch-main`; usa
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` per mantenere scollegata un'esecuzione interattiva,
oppure `pnpm gateway:watch:raw` per la modalità watch in primo piano. Il watcher
ricarica in caso di modifiche rilevanti a sorgenti, configurazione e metadati dei plugin inclusi. Se il
Gateway osservato esce durante l'avvio, `gateway:watch` esegue
`openclaw doctor --fix --non-interactive` una volta e riprova; imposta
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` per disabilitare questo passaggio di riparazione solo dev.
`pnpm openclaw setup` è il passaggio una tantum di inizializzazione di configurazione/area di lavoro locale per un checkout nuovo.
`pnpm gateway:watch` non ricostruisce `dist/control-ui`, quindi riesegui `pnpm ui:build` dopo modifiche in `ui/` oppure usa `pnpm ui:dev` mentre sviluppi la Control UI.

### 2) Puntare l'app macOS al Gateway in esecuzione

In **OpenClaw.app**:

- Modalità di connessione: **Local**
  L'app si collegherà al gateway in esecuzione sulla porta configurata.

### 3) Verificare

- Lo stato del Gateway nell'app dovrebbe mostrare **"Utilizzo del gateway esistente …"**
- Oppure tramite CLI:

```bash
openclaw health
```

### Errori comuni

- **Porta sbagliata:** il WS del Gateway usa come predefinito `ws://127.0.0.1:18789`; mantieni app e CLI sulla stessa porta.
- **Dove vive lo stato:**
  - Stato canale/provider: `~/.openclaw/credentials/`
  - Profili di autenticazione modello: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa dell'archiviazione delle credenziali

Usala quando esegui il debug dell'autenticazione o decidi cosa salvare in backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: configurazione/env o `channels.telegram.tokenFile` (solo file normale; symlink rifiutati)
- **Token bot Discord**: configurazione/env o SecretRef (provider env/file/exec)
- **Token Slack**: configurazione/env (`channels.slack.*`)
- **Allowlist di abbinamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili di autenticazione modello**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload dei segreti basato su file (opzionale)**: `~/.openclaw/secrets.json`
- **Importazione OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Maggiori dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornare (senza rovinare la configurazione)

- Mantieni `~/.openclaw/workspace` e `~/.openclaw/` come "le tue cose"; non inserire prompt/config personali nel repo `openclaw`.
- Aggiornare il sorgente: `git pull` + `pnpm install` + continua a usare `pnpm gateway:watch`.

## Linux (servizio utente systemd)

Le installazioni Linux usano un servizio **utente** systemd. Per impostazione predefinita, systemd arresta i servizi
utente al logout/in inattività, il che termina il Gateway. L'onboarding tenta di abilitare
il lingering per te (potrebbe chiedere sudo). Se è ancora disattivato, esegui:

```bash
sudo loginctl enable-linger $USER
```

Per server sempre attivi o multiutente, considera un servizio **di sistema** invece di un
servizio utente (lingering non necessario). Consulta il [Runbook del Gateway](/it/gateway) per le note su systemd.

## Documenti correlati

- [Runbook del Gateway](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema di configurazione + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (tag di risposta + impostazioni replyToMode)
- [Configurazione dell'assistente OpenClaw](/it/start/openclaw)
- [App macOS](/it/platforms/macos) (ciclo di vita del gateway)
