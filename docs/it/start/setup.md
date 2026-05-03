---
read_when:
    - Configurare una nuova macchina
    - Vuoi il “meglio e più recente” senza compromettere la tua configurazione personale
summary: Configurazione avanzata e flussi di lavoro di sviluppo per OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-05-03T21:44:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5d12f319ab4c60be7ff6538ffd28626f425f7df1a10bbe08cceb59eef3662c75
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se stai configurando per la prima volta, inizia da [Guida introduttiva](/it/start/getting-started).
Per i dettagli sull'onboarding, vedi [Onboarding (CLI)](/it/start/wizard).
</Note>

## TL;DR

Scegli un flusso di configurazione in base alla frequenza con cui vuoi ricevere aggiornamenti e al fatto che tu voglia eseguire il Gateway autonomamente:

- **La personalizzazione vive fuori dal repo:** mantieni la configurazione e il workspace in `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/` così gli aggiornamenti del repo non li toccano.
- **Flusso stabile (consigliato per la maggior parte degli utenti):** installa l'app macOS e lascia che esegua il Gateway incluso.
- **Flusso bleeding edge (dev):** esegui il Gateway autonomamente tramite `pnpm gateway:watch`, poi lascia che l'app macOS si colleghi in modalità Local.

## Prerequisiti (da sorgente)

- Node 24 consigliato (Node 22 LTS, attualmente `22.14+`, ancora supportato)
- `pnpm` è richiesto per i checkout del sorgente. OpenClaw carica i plugin inclusi dai pacchetti del workspace pnpm
  `extensions/*` in modalità dev, quindi `npm install` nella root
  non prepara l'intero albero sorgente.
- Docker (opzionale; solo per configurazione/e2e containerizzati — vedi [Docker](/it/install/docker))

## Strategia di personalizzazione (così gli aggiornamenti non creano problemi)

Se vuoi qualcosa “100% su misura per me” _e_ aggiornamenti semplici, mantieni la personalizzazione in:

- **Configurazione:** `~/.openclaw/openclaw.json` (JSON/JSON5-ish)
- **Workspace:** `~/.openclaw/workspace` (Skills, prompt, memorie; rendilo un repo git privato)

Esegui il bootstrap una volta:

```bash
openclaw setup
```

Da dentro questo repo, usa l'entry CLI locale:

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

Obiettivo: lavorare sul Gateway TypeScript, ottenere l'hot reload, mantenere collegata la UI dell'app macOS.

### 0) (Opzionale) Esegui anche l'app macOS da sorgente

Se vuoi anche l'app macOS sul bleeding edge:

```bash
./scripts/restart-mac.sh
```

### 1) Avvia il Gateway dev

```bash
pnpm install
# Solo alla prima esecuzione (o dopo aver reimpostato configurazione/workspace locali di OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` avvia o riavvia il processo watch del Gateway in una sessione tmux
con nome e si collega automaticamente dai terminali interattivi. Le shell non interattive restano
scollegate e stampano `tmux attach -t openclaw-gateway-watch-main`; usa
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` per mantenere scollegata
un'esecuzione interattiva, oppure `pnpm gateway:watch:raw` per la modalità watch in primo piano. Il watcher
ricarica in caso di modifiche rilevanti a sorgente, configurazione e metadati dei plugin inclusi. Se il
Gateway osservato esce durante l'avvio, `gateway:watch` esegue
`openclaw doctor --fix --non-interactive` una volta e riprova; imposta
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` per disabilitare questo passaggio di riparazione solo dev.
`pnpm openclaw setup` è il passaggio una tantum di inizializzazione della configurazione/workspace locale per un checkout fresco.
`pnpm gateway:watch` non ricompila `dist/control-ui`, quindi riesegui `pnpm ui:build` dopo modifiche a `ui/` oppure usa `pnpm ui:dev` mentre sviluppi la Control UI.

### 2) Punta l'app macOS al Gateway in esecuzione

In **OpenClaw.app**:

- Modalità di connessione: **Local**
  L'app si collegherà al gateway in esecuzione sulla porta configurata.

### 3) Verifica

- Lo stato del Gateway nell'app dovrebbe indicare **“Uso del gateway esistente …”**
- Oppure tramite CLI:

```bash
openclaw health
```

### Errori comuni

- **Porta errata:** il valore predefinito del Gateway WS è `ws://127.0.0.1:18789`; mantieni app e CLI sulla stessa porta.
- **Dove vive lo stato:**
  - Stato di canali/provider: `~/.openclaw/credentials/`
  - Profili di autenticazione del modello: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa dell'archiviazione delle credenziali

Usala durante il debug dell'autenticazione o quando decidi cosa salvare in backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token bot Telegram**: configurazione/env o `channels.telegram.tokenFile` (solo file regolare; symlink rifiutati)
- **Token bot Discord**: configurazione/env o SecretRef (provider env/file/exec)
- **Token Slack**: configurazione/env (`channels.slack.*`)
- **Allowlist di pairing**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili di autenticazione del modello**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload di segreti supportato da file (opzionale)**: `~/.openclaw/secrets.json`
- **Import OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Maggiori dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornamento (senza rovinare la configurazione)

- Considera `~/.openclaw/workspace` e `~/.openclaw/` come “le tue cose”; non mettere prompt/configurazioni personali nel repo `openclaw`.
- Aggiornamento del sorgente: `git pull` + `pnpm install` + continua a usare `pnpm gateway:watch`.

## Linux (servizio utente systemd)

Le installazioni Linux usano un servizio **utente** systemd. Per impostazione predefinita, systemd arresta i
servizi utente al logout/inattività, il che termina il Gateway. L'onboarding tenta di abilitare
il lingering per te (potrebbe chiedere sudo). Se è ancora disattivato, esegui:

```bash
sudo loginctl enable-linger $USER
```

Per server always-on o multiutente, considera un servizio **di sistema** invece di un
servizio utente (nessun lingering necessario). Vedi [Runbook del Gateway](/it/gateway) per le note su systemd.

## Documenti correlati

- [Runbook del Gateway](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema di configurazione + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (tag di risposta + impostazioni replyToMode)
- [Configurazione dell'assistente OpenClaw](/it/start/openclaw)
- [App macOS](/it/platforms/macos) (ciclo di vita del gateway)
