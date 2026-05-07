---
read_when:
    - Configurazione di una nuova macchina
    - Vuoi "il meglio e il più recente" senza compromettere la tua configurazione personale
summary: Configurazione avanzata e flussi di lavoro di sviluppo per OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-05-07T13:25:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9325ebfc2c5868e44fba18b75ca27cd9333a8bc7072e933468e1608dde487a8e
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se stai configurando per la prima volta, inizia da [Primi passi](/it/start/getting-started).
Per i dettagli sull’onboarding, consulta [Onboarding (CLI)](/it/start/wizard).
</Note>

## TL;DR

Scegli un flusso di configurazione in base alla frequenza con cui vuoi ricevere aggiornamenti e al fatto che tu voglia eseguire personalmente il Gateway:

- **La personalizzazione vive fuori dal repo:** mantieni la configurazione e il workspace in `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` così gli aggiornamenti del repo non li toccano.
- **Flusso stabile (consigliato per la maggior parte degli utenti):** installa l’app macOS e lascia che esegua il Gateway incluso.
- **Flusso bleeding edge (dev):** esegui tu il Gateway tramite `pnpm gateway:watch`, poi lascia che l’app macOS si colleghi in modalità Local.

## Prerequisiti (da sorgente)

- Node 24 consigliato (Node 22 LTS, attualmente `22.16+`, ancora supportato)
- `pnpm` richiesto per i checkout da sorgente. OpenClaw carica i plugins inclusi dai pacchetti workspace pnpm
  `extensions/*` in modalità dev, quindi `npm install` nella root
  non prepara l’intero albero sorgente.
- Docker (opzionale; solo per configurazione/e2e containerizzati - vedi [Docker](/it/install/docker))

## Strategia di personalizzazione (per evitare problemi con gli aggiornamenti)

Se vuoi una configurazione "100% su misura per me" _e_ aggiornamenti semplici, mantieni la tua personalizzazione in:

- **Configurazione:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (skills, prompt, memorie; rendilo un repo git privato)

Esegui il bootstrap una volta:

```bash
openclaw setup
```

Da dentro questo repo, usa l’entrypoint CLI locale:

```bash
openclaw setup
```

Se non hai ancora un’installazione globale, eseguilo tramite `pnpm openclaw setup`.

## Eseguire il Gateway da questo repo

Dopo `pnpm build`, puoi eseguire direttamente la CLI pacchettizzata:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flusso stabile (prima l’app macOS)

1. Installa e avvia **OpenClaw.app** (barra dei menu).
2. Completa la checklist di onboarding/permessi (prompt TCC).
3. Assicurati che il Gateway sia **Local** e in esecuzione (l’app lo gestisce).
4. Collega le superfici (esempio: WhatsApp):

```bash
openclaw channels login
```

5. Controllo di integrità:

```bash
openclaw health
```

Se l’onboarding non è disponibile nella tua build:

- Esegui `openclaw setup`, poi `openclaw channels login`, quindi avvia manualmente il Gateway (`openclaw gateway`).

## Flusso bleeding edge (Gateway in un terminale)

Obiettivo: lavorare sul Gateway TypeScript, ottenere hot reload, mantenere collegata l’interfaccia dell’app macOS.

### 0) (Opzionale) Esegui anche l’app macOS da sorgente

Se vuoi anche l’app macOS sul bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Avvia il Gateway dev

```bash
pnpm install
# Solo la prima esecuzione (o dopo aver reimpostato la configurazione/workspace locale di OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` avvia o riavvia il processo di watch del Gateway in una sessione tmux
con nome e si collega automaticamente dai terminali interattivi. Le shell non interattive restano
staccate e stampano `tmux attach -t openclaw-gateway-watch-main`; usa
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` per mantenere staccata un’esecuzione interattiva,
oppure `pnpm gateway:watch:raw` per la modalità watch in foreground. Il watcher
ricarica in caso di modifiche rilevanti a sorgenti, configurazione e metadati dei plugin inclusi. Se il
Gateway osservato esce durante l’avvio, `gateway:watch` esegue
`openclaw doctor --fix --non-interactive` una volta e riprova; imposta
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` per disabilitare quel passaggio di riparazione solo-dev.
`pnpm openclaw setup` è il passaggio una tantum di inizializzazione della configurazione/workspace locale per un checkout nuovo.
`pnpm gateway:watch` non ricostruisce `dist/control-ui`, quindi riesegui `pnpm ui:build` dopo modifiche a `ui/` oppure usa `pnpm ui:dev` mentre sviluppi la Control UI.

### 2) Punta l’app macOS al Gateway in esecuzione

In **OpenClaw.app**:

- Connection Mode: **Local**
  L’app si collegherà al gateway in esecuzione sulla porta configurata.

### 3) Verifica

- Lo stato del Gateway nell’app dovrebbe indicare **"Using existing gateway …"**
- Oppure tramite CLI:

```bash
openclaw health
```

### Problemi comuni

- **Porta sbagliata:** il WS del Gateway usa come default `ws://127.0.0.1:18789`; mantieni app e CLI sulla stessa porta.
- **Dove vive lo stato:**
  - Stato canale/provider: `~/.openclaw/credentials/`
  - Profili di autenticazione modello: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa dello storage delle credenziali

Usala quando esegui il debug dell’autenticazione o decidi cosa sottoporre a backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: config/env o `channels.telegram.tokenFile` (solo file normale; symlink rifiutati)
- **Token bot Discord**: config/env o SecretRef (provider env/file/exec)
- **Token Slack**: config/env (`channels.slack.*`)
- **Allowlist di pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili di autenticazione modello**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload di segreti basato su file (opzionale)**: `~/.openclaw/secrets.json`
- **Importazione OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Maggiori dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornamento (senza rovinare la configurazione)

- Mantieni `~/.openclaw/workspace` e `~/.openclaw/` come "le tue cose"; non inserire prompt/config personali nel repo `openclaw`.
- Aggiornamento del sorgente: `git pull` + `pnpm install` + continua a usare `pnpm gateway:watch`.

## Linux (servizio utente systemd)

Le installazioni Linux usano un servizio systemd **utente**. Per impostazione predefinita, systemd arresta i
servizi utente al logout/in inattività, cosa che termina il Gateway. L’onboarding tenta di abilitare
il lingering per te (potrebbe chiedere sudo). Se è ancora disattivato, esegui:

```bash
sudo loginctl enable-linger $USER
```

Per server always-on o multiutente, considera invece un servizio **system**
anziché un servizio utente (lingering non necessario). Consulta il [runbook del Gateway](/it/gateway) per le note su systemd.

## Documenti correlati

- [Runbook del Gateway](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema config + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (tag di risposta + impostazioni replyToMode)
- [Configurazione dell’assistente OpenClaw](/it/start/openclaw)
- [App macOS](/it/platforms/macos) (ciclo di vita del gateway)
