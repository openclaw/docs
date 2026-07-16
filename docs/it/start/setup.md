---
read_when:
    - Configurazione di una nuova macchina
    - Si desidera avere «il meglio e più recente» senza compromettere la propria configurazione personale
summary: Flussi di lavoro avanzati per la configurazione e lo sviluppo di OpenClaw
title: Configurazione
x-i18n:
    generated_at: "2026-07-16T14:59:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c40d6d2bf2814465f3cc49c65d4c1498671420af728ce8012d13af3fba67025a
    source_path: start/setup.md
    workflow: 16
---

<Note>
Se si esegue la configurazione per la prima volta, iniziare da [Primi passi](/it/start/getting-started).
Per i dettagli sulla procedura iniziale, vedere [Procedura iniziale (CLI)](/it/start/wizard).
</Note>

## In breve

Scegliere un flusso di configurazione in base alla frequenza desiderata degli aggiornamenti e alla volontà di eseguire autonomamente il Gateway:

- **Le personalizzazioni risiedono fuori dal repository:** mantenere la configurazione e lo spazio di lavoro in `~/.openclaw/openclaw.json` e `~/.openclaw/workspace/`, in modo che gli aggiornamenti del repository non li modifichino.
- **Flusso stabile (consigliato per la maggior parte degli utenti):** installare l'app macOS e lasciare che esegua il Gateway incluso.
- **Flusso all'avanguardia (sviluppo):** eseguire autonomamente il Gateway tramite `pnpm gateway:watch`, quindi consentire all'app macOS di connettersi in modalità Locale.

## Prerequisiti (dal codice sorgente)

- Consigliato Node 24.15+ (Node 22 LTS, attualmente `22.22.3+`, è ancora supportato)
- `pnpm` è necessario per i checkout del codice sorgente. In modalità sviluppo, OpenClaw carica i plugin inclusi dai pacchetti dell'area di lavoro pnpm
  `extensions/*`, pertanto `npm install` nella radice
  non prepara l'intero albero dei sorgenti.
- Docker (facoltativo; solo per la configurazione containerizzata/e2e; vedere [Docker](/it/install/docker))

## Strategia di personalizzazione (per evitare problemi con gli aggiornamenti)

Per ottenere una configurazione «personalizzata al 100%» _e_ aggiornamenti semplici, mantenere le personalizzazioni in:

- **Configurazione:** `~/.openclaw/openclaw.json` (JSON/simile a JSON5)
- **Spazio di lavoro:** `~/.openclaw/workspace` (Skills, prompt, memorie; renderlo un repository git privato)

Inizializzare una sola volta le cartelle della configurazione e dello spazio di lavoro, senza eseguire l'intera procedura guidata iniziale:

```bash
openclaw setup --baseline
```

Non è ancora presente un'installazione globale? Eseguire invece il comando da questo repository:

```bash
pnpm openclaw setup --baseline
```

(`openclaw setup` senza `--baseline` è un alias di `openclaw onboard` ed esegue l'intera procedura guidata interattiva.)

## Eseguire il Gateway da questo repository

Dopo `pnpm build`, è possibile eseguire direttamente la CLI inclusa nel pacchetto:

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## Flusso stabile (prima l'app macOS)

1. Installare e avviare **OpenClaw.app** (barra dei menu).
2. Completare l'elenco di controllo della procedura iniziale e delle autorizzazioni (richieste TCC).
3. Assicurarsi che il Gateway sia **Locale** e in esecuzione (viene gestito dall'app).
4. Collegare i canali (ad esempio WhatsApp):

```bash
openclaw channels login
```

5. Verifica di corretto funzionamento:

```bash
openclaw health
```

Se la procedura iniziale non è disponibile nella build:

- Eseguire `openclaw setup`, quindi `openclaw channels login` e infine avviare manualmente il Gateway (`openclaw gateway`).

## Flusso all'avanguardia (Gateway in un terminale)

Obiettivo: lavorare sul Gateway TypeScript, usufruire del ricaricamento automatico e mantenere collegata l'interfaccia dell'app macOS.

### 0) (Facoltativo) Eseguire dal codice sorgente anche l'app macOS

Per utilizzare la versione all'avanguardia anche dell'app macOS:

```bash
./scripts/restart-mac.sh
```

### 1) Avviare il Gateway di sviluppo

```bash
pnpm install
# Solo alla prima esecuzione (o dopo il ripristino della configurazione/dello spazio di lavoro locale di OpenClaw)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch` avvia o riavvia il processo di monitoraggio del Gateway in una sessione tmux
con nome (`openclaw-gateway-watch-main`) e si collega automaticamente dai terminali
interattivi. Le shell non interattive rimangono scollegate e mostrano
`tmux attach -t openclaw-gateway-watch-main`; utilizzare
`OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch` per mantenere scollegata un'esecuzione
interattiva oppure `pnpm gateway:watch:raw` per la modalità di monitoraggio in primo piano. Il processo di monitoraggio
arresta il servizio Gateway installato del profilo attivo prima di acquisire la
porta configurata/predefinita, impedendo al supervisore del servizio di sostituire il
processo sorgente. Il servizio rimane installato; eseguire `pnpm openclaw gateway start`
al termine del monitoraggio. Il pannello tmux rimane disponibile dopo un errore di avvio,
in modo che un altro terminale o agente possa collegarsi o acquisirne i log. Il processo di monitoraggio
ricarica in seguito alle modifiche pertinenti al codice sorgente, alla configurazione e ai metadati dei plugin inclusi. Se il
Gateway monitorato termina durante l'avvio, `gateway:watch` esegue
`openclaw doctor --fix --non-interactive` una volta e riprova; impostare
`OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0` per disabilitare questo tentativo di riparazione riservato allo sviluppo.
`pnpm gateway:watch` non ricompila `dist/control-ui`; pertanto, eseguire nuovamente `pnpm ui:build` dopo le modifiche a `ui/` oppure utilizzare `pnpm ui:dev` durante lo sviluppo dell'interfaccia di controllo.

### 2) Connettere l'app macOS al Gateway in esecuzione

In **OpenClaw.app**:

- Connection Mode: **Local**
  L'app si connetterà al Gateway in esecuzione sulla porta configurata.

### 3) Verificare

- Lo stato del Gateway nell'app dovrebbe indicare **"Using existing gateway …"**
- In alternativa, tramite CLI:

```bash
openclaw health
```

### Problemi comuni

- **Porta errata:** per impostazione predefinita, il WebSocket del Gateway usa `ws://127.0.0.1:18789`; configurare l'app e la CLI sulla stessa porta.
- **Posizione dello stato:**
  - Stato dei canali/provider: `~/.openclaw/credentials/`
  - Profili di autenticazione dei modelli: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - Sessioni e trascrizioni: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - Artefatti di sessione legacy/archiviati: `~/.openclaw/agents/<agentId>/sessions/`
  - Log: `/tmp/openclaw/`

## Mappa di archiviazione delle credenziali

Utilizzare questa mappa durante il debug dell'autenticazione o per decidere cosa includere nel backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token del bot Telegram**: configurazione/ambiente oppure `channels.telegram.tokenFile` (solo file normale; i collegamenti simbolici vengono rifiutati)
- **Token del bot Discord**: configurazione/ambiente oppure SecretRef (provider env/file/exec)
- **Token Slack**: configurazione/ambiente (`channels.slack.*`)
- **Elenchi consentiti per l'associazione**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (account predefinito)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (account non predefiniti)
- **Profili di autenticazione dei modelli**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload dei segreti basato su file (facoltativo)**: `~/.openclaw/secrets.json`
- **Importazione OAuth legacy**: `~/.openclaw/credentials/oauth.json`
  Ulteriori dettagli: [Sicurezza](/it/gateway/security#credential-storage-map).

## Aggiornamento (senza compromettere la configurazione)

- Mantenere `~/.openclaw/workspace` e `~/.openclaw/` come «contenuti personali»; non inserire prompt o configurazioni personali nel repository `openclaw`.
- Aggiornamento del codice sorgente: `git pull` + `pnpm install` + continuare a utilizzare `pnpm gateway:watch`.

## Linux (servizio utente systemd)

Le installazioni Linux utilizzano un servizio **utente** systemd. Per impostazione predefinita, systemd arresta i servizi
utente alla disconnessione/inattività, terminando così il Gateway. La procedura iniziale tenta di abilitare
la persistenza per l'utente (potrebbe richiedere sudo). Se è ancora disabilitata, eseguire:

```bash
sudo loginctl enable-linger $USER
```

Per i server sempre attivi o multiutente, valutare invece un servizio di **sistema**
anziché un servizio utente (la persistenza non è necessaria). Consultare il [manuale operativo del Gateway](/it/gateway) per le note su systemd.

## Documentazione correlata

- [Manuale operativo del Gateway](/it/gateway) (flag, supervisione, porte)
- [Configurazione del Gateway](/it/gateway/configuration) (schema di configurazione + esempi)
- [Discord](/it/channels/discord) e [Telegram](/it/channels/telegram) (tag di risposta + impostazioni replyToMode)
- [Configurazione dell'assistente OpenClaw](/it/start/openclaw)
- [App macOS](/it/platforms/macos) (ciclo di vita del Gateway)
