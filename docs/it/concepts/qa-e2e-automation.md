---
read_when:
    - Comprendere come si integra lo stack QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiunta di scenari QA supportati dal repository
    - Creare un'automazione QA più realistica attorno alla dashboard Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari basati sul repository, corsie di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica QA
x-i18n:
    generated_at: "2026-05-05T06:17:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d313abf9e0f13a159ce28c023e2a1c4c1518529da1354a130e9f495e65faac19
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato serve a esercitare OpenClaw in modo più realistico e
modellato sui canali rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale messaggi sintetico con superfici DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, Plugin runner futuri: adattatori di trasporto live che
  pilotano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed basati sul repository per il task di kickoff e gli scenari QA
  baseline.
- [Mantis](/it/concepts/mantis): verifica live prima e dopo per bug che
  richiedono trasporti reali, screenshot del browser, stato della VM ed evidenza PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno alias di script `pnpm qa:*`;
entrambe le forme sono supportate.

| Comando                                             | Scopo                                                                                                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverifica QA inclusa; scrive un report Markdown.                                                                                                                                          |
| `qa suite`                                          | Esegue scenari basati sul repository contro la lane del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                        |
| `qa coverage`                                       | Stampa l'inventario Markdown della copertura scenari (`--json` per output macchina).                                                                                                        |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentica.                                                                                                           |
| `qa character-eval`                                 | Esegue lo scenario QA dei personaggi su più modelli live con un report valutato. Vedi [Reportistica](#reporting).                                                                            |
| `qa manual`                                         | Esegue un prompt una tantum contro la lane del provider/modello selezionata.                                                                                                                |
| `qa ui`                                             | Avvia la UI di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                                        |
| `qa docker-build-image`                             | Costruisce l'immagine Docker QA precompilata.                                                                                                                                                |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + lane Gateway.                                                                                                                       |
| `qa up`                                             | Costruisce il sito QA, avvia lo stack basato su Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).          |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                                        |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole dello scenario.                                                                                                                      |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool di credenziali Convex condiviso.                                                                                                                                            |
| `qa matrix`                                         | Lane di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [QA Matrix](/it/concepts/qa-matrix).                                                                                     |
| `qa telegram`                                       | Lane di trasporto live contro un gruppo Telegram privato reale.                                                                                                                              |
| `qa discord`                                        | Lane di trasporto live contro un canale guild Discord privato reale.                                                                                                                         |
| `qa slack`                                          | Lane di trasporto live contro un canale Slack privato reale.                                                                                                                                 |
| `qa mantis`                                         | Runner di verifica prima e dopo per bug di trasporto live, con evidenza di reazioni di stato Discord, smoke desktop/browser Crabbox e smoke Slack-in-VNC. Vedi [Mantis](/it/concepts/mantis). |

## Flusso operatore

L'attuale flusso operatore QA è un sito QA a due riquadri:

- Sinistra: dashboard Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo costruisce il sito QA, avvia la lane Gateway basata su Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può dare all'agente una missione QA,
osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o
cosa è rimasto bloccato.

Per iterare più velocemente sulla UI di QA Lab senza ricostruire ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato in bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta in bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricostruisce quel bundle a ogni modifica, e il browser si ricarica automaticamente quando cambia l'hash
degli asset QA Lab.

Per uno smoke locale di traccia OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Quello script avvia un ricevitore locale di tracce OTLP/HTTP, esegue lo scenario QA
`otel-trace-smoke` con il Plugin `diagnostics-otel` abilitato, poi
decodifica gli span protobuf esportati e verifica la forma critica per il rilascio:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devono essere presenti;
le chiamate modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono restare fuori dalla traccia. Scrive
`otel-smoke-summary.json` accanto agli artefatti della suite QA.

La QA di osservabilità resta disponibile solo da checkout sorgente. Il tarball npm omette intenzionalmente
QA Lab, quindi le lane Docker di rilascio pacchetto non eseguono comandi `qa`. Usa
`pnpm qa:otel:smoke` da un checkout sorgente costruito quando modifichi la strumentazione
diagnostica.

Per una lane smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo profili/scenari, le variabili env e il layout degli artefatti per questa lane si trovano in [QA Matrix](/it/concepts/qa-matrix). In sintesi: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/osservatore, esegue il Plugin Matrix reale dentro un Gateway QA figlio limitato a quel trasporto (nessun `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artefatto observed-events e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Per lane smoke Telegram, Discord e Slack con trasporto reale:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Puntano a un canale reale preesistente con due bot (driver + SUT). Le variabili env richieste, le liste di scenari, gli artefatti di output e il pool di credenziali Convex sono documentati nel [riferimento QA Telegram, Discord e Slack](#telegram-discord-and-slack-qa-reference) qui sotto.

Per un'esecuzione completa su VM desktop Slack con recupero VNC, esegui:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Quel comando prende in lease una macchina desktop/browser Crabbox, esegue la lane live Slack
dentro la VM, apre Slack Web nel browser VNC, cattura il desktop e
copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`,
quando la cattura video è disponibile, nella directory artefatti Mantis. Riusa `--lease-id <cbx_...>` dopo aver effettuato manualmente l'accesso a Slack Web
tramite VNC. Con `--gateway-setup`, Mantis lascia un Gateway Slack OpenClaw
persistente in esecuzione dentro la VM sulla porta `38973`; senza di esso, il comando esegue la
normale lane QA Slack da bot a bot ed esce dopo la cattura degli artefatti.

Per un task desktop in stile agente/CV, esegui:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` prende in lease o riusa una macchina desktop/browser Crabbox, avvia
`crabbox record --while`, guida il browser visibile tramite un
`visual-driver` annidato, cattura `visual-task.png`, esegue `openclaw infer image describe`
sullo screenshot quando è selezionato `--vision-mode image-describe` e
scrive `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e `mantis-visual-task-report.md`.
Quando `--expect-text` è impostato, il prompt di visione chiede un verdetto JSON
strutturato e passa solo quando il modello segnala evidenza visibile positiva; una
risposta negativa che cita soltanto il testo target fallisce l'asserzione.
Usa `--vision-mode metadata` per uno smoke senza modello che prova il plumbing di desktop,
browser, screenshot e video senza chiamare un provider di comprensione immagini.
La registrazione è un artefatto obbligatorio per `visual-task`; se Crabbox non registra
un `visual-task.mp4` non vuoto, il task fallisce anche quando il visual driver
è passato. In caso di errore, Mantis mantiene il lease per VNC a meno che il task non fosse già
passato e `--keep-lease` non fosse impostato.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'env del broker Convex, valida le impostazioni endpoint e verifica la raggiungibilità admin/list quando è presente il segreto maintainer. Segnala solo lo stato impostato/mancante per i segreti.

## Copertura trasporto live

Le lane di trasporto live condividono un contratto invece di inventarsi ciascuna la propria forma di lista scenari. `qa-channel` è la suite sintetica ampia di comportamento prodotto e non fa parte della matrice di copertura del trasporto live.

| Lane     | Canary | Controllo delle menzioni | Da bot a bot | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up del thread | Isolamento del thread | Osservazione delle reazioni | Comando di aiuto | Registrazione dei comandi nativi |
| -------- | ------ | ------------------------ | ------------ | ---------------- | -------------------------- | -------------------- | -------------------- | --------------------- | --------------------------- | ---------------- | --------------------------------- |
| Matrix   | x      | x                        | x            | x                | x                          | x                    | x                    | x                     | x                           |                  |                                   |
| Telegram | x      | x                        | x            |                  |                            |                      |                      |                       |                             | x                |                                   |
| Discord  | x      | x                        | x            |                  |                            |                      |                      |                       |                             |                  | x                                 |
| Slack    | x      | x                        | x            |                  |                            |                      |                      |                       |                             |                  |                                   |

Questo mantiene `qa-channel` come suite ampia per il comportamento del prodotto, mentre Matrix,
Telegram e i futuri trasporti live condividono un'unica checklist esplicita
del contratto di trasporto.

Per una lane VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un nuovo guest Multipass, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono più scenari selezionati in parallelo
con worker Gateway isolati per impostazione predefinita. `qa-channel` usa come default la concorrenza
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, il percorso di configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repository, così il guest
può riscrivere attraverso il workspace montato.

## Riferimento QA per Telegram, Discord e Slack

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) per via del numero di scenari e del provisioning dell'homeserver basato su Docker. Telegram, Discord e Slack sono più piccoli: una manciata di scenari ciascuno, nessun sistema di profili, su canali reali preesistenti, quindi il loro riferimento vive qui.

### Flag CLI condivisi

Queste lane si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                                     | Descrizione                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Esegue solo questo scenario. Ripetibile.                                                                              |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Dove vengono scritti report/riepilogo/messaggi osservati e il log di output. I percorsi relativi si risolvono rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Root del repository quando si invoca da una cwd neutra.                                                               |
| `--sut-account <id>`                  | `sut`                                                           | ID account temporaneo all'interno della configurazione del Gateway QA.                                                |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` o `live-frontier` (il legacy `live-openai` funziona ancora).                                            |
| `--model <ref>` / `--alt-model <ref>` | provider default                                                | Riferimenti al modello primario/alternativo.                                                                          |
| `--fast`                              | off                                                             | Modalità veloce del provider dove supportata.                                                                         |
| `--credential-source <env\|convex>`   | `env`                                                           | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                           |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, `maintainer` altrimenti                             | Ruolo usato quando `--credential-source convex`.                                                                      |

Ogni lane termina con codice diverso da zero per qualsiasi scenario fallito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Prende di mira un vero gruppo privato Telegram con due bot distinti (driver + SUT). Il bot SUT deve avere uno username Telegram; l'osservazione bot-to-bot funziona al meglio quando entrambi i bot hanno **Bot-to-Bot Communication Mode** abilitata in `@BotFather`.

Env richiesto quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opzionale:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati (per impostazione predefinita vengono redatti).

Scenari (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Artefatti di output:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — include l'RTT per risposta (invio driver → risposta SUT osservata) a partire dal canary.
- `telegram-qa-observed-messages.json` — corpi redatti salvo `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Prende di mira un vero canale privato di una guild Discord con due bot: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord incluso. Verifica la gestione delle menzioni del canale, che il bot SUT abbia registrato il comando nativo `/help` con Discord, e gli scenari di evidenza Mantis opt-in.

Env richiesto quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — deve corrispondere all'ID utente del bot SUT restituito da Discord (altrimenti la lane fallisce rapidamente).

Opzionale:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati.

Scenari (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scenario Mantis opt-in. Viene eseguito da solo perché passa il SUT a risposte di guild sempre attive e solo tool con `messages.statusReactions.enabled=true`, quindi cattura una timeline delle reazioni REST più artefatti visivi HTML/PNG. I report Mantis prima/dopo preservano anche gli artefatti MP4 forniti dallo scenario come `baseline.mp4` e `candidate.mp4`.

Esegui esplicitamente lo scenario delle reazioni di stato Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefatti di output:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — corpi redatti salvo `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando viene eseguito lo scenario delle reazioni di stato.

### QA Slack

```bash
pnpm openclaw qa slack
```

Prende di mira un vero canale privato Slack con due bot distinti: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Slack incluso.

Env richiesto quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opzionale:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati.

Scenari (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefatti di output:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — corpi redatti salvo `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurazione del workspace Slack

La lane richiede due app Slack distinte in un workspace, più un canale di cui entrambi i bot siano membri:

- `channelId` — l'ID `Cxxxxxxxxxx` di un canale in cui entrambi i bot sono stati invitati. Usa un canale dedicato; la lane pubblica a ogni esecuzione.
- `driverBotToken` — token bot (`xoxb-...`) dell'app **Driver**.
- `sutBotToken` — token bot (`xoxb-...`) dell'app **SUT**, che deve essere un'app Slack separata dal driver, così il suo ID utente bot è distinto.
- `sutAppToken` — token a livello app (`xapp-...`) dell'app SUT con `connections:write`, usato da Socket Mode affinché l'app SUT possa ricevere eventi.

Preferisci un workspace Slack dedicato alla QA invece di riutilizzare un workspace di produzione.

Il manifest SUT qui sotto rispecchia l'installazione di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`). Per la configurazione del canale di produzione come la vedono gli utenti, vedi [configurazione rapida del canale Slack](/it/channels/slack#quick-setup); la coppia Driver/SUT QA è intenzionalmente separata perché la lane richiede due ID utente bot distinti in un workspace.

**1. Crea l'app Driver**

Vai su [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → scegli il workspace QA, incolla il manifest seguente, quindi _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copia il _Bot User OAuth Token_ (`xoxb-...`): diventa `driverBotToken`. Il driver deve solo pubblicare messaggi e identificarsi; nessun evento, nessuna Socket Mode.

**2. Crea l'app SUT**

Ripeti _Create New App → From a manifest_ nello stesso workspace. L'insieme di scope rispecchia l'installazione di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`):

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Dopo che Slack ha creato l’app, fai due cose nella sua pagina delle impostazioni:

- _Install to Workspace_ → copia il _Bot User OAuth Token_ → questo diventa `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → aggiungi lo scope `connections:write` → salva → copia il valore `xapp-...` → questo diventa `sutAppToken`.

Verifica che i due bot abbiano ID utente distinti chiamando `auth.test` su ciascun token. Il runtime distingue driver e SUT in base all’ID utente; riutilizzare una sola app per entrambi farà fallire immediatamente il controllo delle menzioni.

**3. Crea il canale**

Nel workspace QA, crea un canale (ad esempio `#openclaw-qa`) e invita entrambi i bot dall’interno del canale:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia l’ID `Cxxxxxxxxxx` da _channel info → About → Channel ID_ — questo diventa `channelId`. Un canale pubblico va bene; se usi un canale privato, entrambe le app hanno già `groups:history`, quindi le letture della cronologia dell’harness riusciranno comunque.

**4. Registra le credenziali**

Due opzioni. Usa le variabili env per il debug su una singola macchina (imposta le quattro variabili `OPENCLAW_QA_SLACK_*` e passa `--credential-source env`), oppure inizializza il pool Convex condiviso così CI e altri maintainer possono prenderle in leasing.

Per il pool Convex, scrivi i quattro campi in un file JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Con `OPENCLAW_QA_CONVEX_SITE_URL` e `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` esportati nella tua shell, registra e verifica:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Aspettati `count: 1`, `status: "active"`, nessun campo `lease`.

**5. Verifica end to end**

Esegui la lane localmente per confermare che entrambi i bot possano comunicare tra loro tramite il broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Un’esecuzione verde completa in molto meno di 30 secondi e `slack-qa-report.md` mostra sia `slack-canary` sia `slack-mention-gating` con stato `pass`. Se la lane resta sospesa per circa 90 secondi ed esce con `Convex credential pool exhausted for kind "slack"`, il pool è vuoto oppure ogni riga è in leasing — `qa credentials list --kind slack --status all --json` ti dirà quale dei due casi.

### Pool di credenziali Convex

Le lane Telegram, Discord e Slack possono prendere in leasing credenziali da un pool Convex condiviso invece di leggere le variabili env sopra. Passa `--credential-source convex` (oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un leasing esclusivo, invia Heartbeat per tutta la durata dell’esecuzione e lo rilascia allo spegnimento. I tipi del pool sono `"telegram"`, `"discord"` e `"slack"`.

Forme del payload che il broker valida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve essere una stringa chat-id numerica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` — `channelId` deve corrispondere a `^[A-Z][A-Z0-9]+$` (un ID Slack come `Cxxxxxxxxxx`). Vedi [Configurazione del workspace Slack](#setting-up-the-slack-workspace) per il provisioning di app e scope.

Le variabili env operative e il contratto dell’endpoint del broker Convex si trovano in [Test → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il supporto Discord; la semantica del broker è identica per entrambi i tipi).

## Seed supportati dal repo

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git così il piano QA è visibile sia agli esseri umani sia all’agente.

`qa-lab` deve rimanere un runner Markdown generico. Ogni file Markdown di scenario è la fonte di verità per una singola esecuzione di test e deve definire:

- metadati dello scenario
- metadati opzionali di categoria, capability, lane e rischio
- riferimenti a documentazione e codice
- requisiti Plugin opzionali
- patch opzionale della configurazione Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può rimanere generica e trasversale. Ad esempio, gli scenari Markdown possono combinare helper lato trasporto con helper lato browser che guidano la Control UI incorporata tramite il seam `browser.request` del Gateway senza aggiungere un runner speciale.

I file scenario devono essere raggruppati per capability di prodotto invece che per cartella del source tree. Mantieni stabili gli ID scenario quando i file vengono spostati; usa `docsRefs` e `codeRefs` per la tracciabilità dell’implementazione.

L’elenco baseline deve rimanere abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio di modello
- handoff a subagente
- lettura del repo e lettura della documentazione
- un piccolo task di build come Lobster Invaders

## Lane mock del provider

`qa suite` ha due lane mock locali del provider:

- `mock-openai` è il mock OpenClaw consapevole degli scenari. Rimane la lane mock deterministica predefinita per QA supportata dal repo e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo, fixture, record/replay e chaos. È additiva e non sostituisce il dispatcher di scenari `mock-openai`.

L’implementazione delle lane provider vive sotto `extensions/qa-lab/src/providers/`. Ogni provider possiede i propri default, l’avvio del server locale, la configurazione del modello Gateway, le necessità di staging degli auth-profile e i flag di capability live/mock. Il codice condiviso di suite e Gateway deve passare attraverso il registro dei provider invece di ramificare sui nomi dei provider.

## Adapter di trasporto

`qa-lab` possiede un seam di trasporto generico per gli scenari QA Markdown. `qa-channel` è il primo adapter su quel seam, ma l’obiettivo di design è più ampio: canali futuri reali o sintetici devono collegarsi allo stesso runner di suite invece di aggiungere un runner QA specifico per trasporto.

A livello architetturale, la divisione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza dei worker, scrittura degli artefatti e reportistica.
- L’adapter di trasporto possiede configurazione Gateway, readiness, osservazione inbound e outbound, azioni di trasporto e stato normalizzato del trasporto.
- I file scenario Markdown sotto `qa/scenarios/` definiscono l’esecuzione di test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiunta di un canale

Aggiungere un canale al sistema QA Markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che esercita il contratto del canale.

Non aggiungere una nuova root di comando QA di primo livello quando l’host condiviso `qa-lab` può possedere il flusso.

`qa-lab` possiede i meccanismi dell’host condiviso:

- la root del comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per scenari `qa-channel` più vecchi

I Plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il Gateway è configurato per quel trasporto
- come viene controllata la readiness
- come vengono iniettati gli eventi inbound
- come vengono osservati i messaggi outbound
- come vengono esposti transcript e stato normalizzato del trasporto
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito reset o cleanup specifico del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della root condivisa `qa`.
2. Implementa il runner di trasporto sul seam host condiviso di `qa-lab`.
3. Mantieni i meccanismi specifici del trasporto dentro il Plugin runner o l’harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando root concorrente. I Plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni `runtime-api.ts` leggero; CLI lazy ed esecuzione del runner devono restare dietro entrypoint separati.
5. Scrivi o adatta scenari Markdown sotto le directory tematiche `qa/scenarios/`.
6. Usa gli helper generici di scenario per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, a meno che il repo stia eseguendo una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se il comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se il comportamento dipende da un trasporto di canale, mantienilo in quel Plugin runner o harness del Plugin.
- Se uno scenario richiede una nuova capability che può essere usata da più di un canale, aggiungi un helper generico invece di un ramo specifico del canale in `suite.ts`.
- Se un comportamento è significativo solo per un trasporto, mantieni lo scenario specifico del trasporto e rendilo esplicito nel contratto dello scenario.

### Nomi degli helper di scenario

Helper generici preferiti per nuovi scenari:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Gli alias di compatibilità restano disponibili per gli scenari esistenti — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ma la creazione di nuovi scenari deve usare i nomi generici. Gli alias esistono per evitare una migrazione flag-day, non come modello futuro.

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservata.
Il report deve rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l’inventario degli scenari disponibili — utile quando si dimensiona il lavoro di follow-up o si collega un nuovo trasporto — esegui `pnpm openclaw qa coverage` (aggiungi `--json` per output leggibile da macchina).

Per i controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modello live e scrivi un report Markdown valutato:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Il comando esegue processi figlio locali del Gateway QA, non Docker. Gli scenari di valutazione del personaggio dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente come chat, aiuto nell'area di lavoro e piccoli task sui file. Al modello candidato non dovrebbe essere comunicato che è in fase di valutazione. Il comando conserva ogni trascrizione completa, registra le statistiche di base dell'esecuzione, quindi chiede ai modelli giudice in modalità veloce con ragionamento `xhigh`, dove supportato, di classificare le esecuzioni per naturalezza, atmosfera e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque ogni trascrizione e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con etichette neutre come `candidate-01`; il report rimappa le classifiche ai riferimenti reali dopo il parsing.
Le esecuzioni candidate usano per impostazione predefinita il pensiero `high`, con `medium` per GPT-5.5 e `xhigh` per i riferimenti di valutazione OpenAI più vecchi che lo supportano. Sovrascrivi inline un candidato specifico con `--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un fallback globale, e la forma precedente `--model-thinking <provider/model=level>` viene mantenuta per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità veloce, in modo che venga usata l'elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un singolo candidato o giudice richiede una sovrascrittura. Passa `--fast` solo quando vuoi forzare la modalità veloce per ogni modello candidato. Le durate di candidati e giudici vengono registrate nel report per l'analisi dei benchmark, ma i prompt dei giudici dicono esplicitamente di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita una concorrenza pari a 16. Riduci `--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul Gateway locale rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun candidato `--model`, la valutazione del personaggio usa per impostazione predefinita `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Matrice QA](/it/concepts/qa-matrix)
- [Canale QA](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Dashboard](/it/web/dashboard)
