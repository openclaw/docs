---
read_when:
    - Capire come si integra lo stack di QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiunta di scenari QA basati sul repository
    - Creazione di automazione QA a maggiore realismo intorno alla dashboard del Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari supportati dal repository, corsie di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica del QA
x-i18n:
    generated_at: "2026-05-05T01:45:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83adbe934d73265a1b47ee463c98fdd3eddfb1cd063d3a46a83dfc7568df0a96
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato è pensato per esercitare OpenClaw in modo più realistico,
modellato sui canali, rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici per DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, futuri plugin runner: adattatori di trasporto live che
  pilotano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed supportati dal repository per il task di avvio e gli scenari QA
  di riferimento.
- [Mantis](/it/concepts/mantis): verifica live prima e dopo per bug che
  richiedono trasporti reali, screenshot del browser, stato della VM ed evidenze della PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno alias di script `pnpm qa:*`;
entrambe le forme sono supportate.

| Comando                                             | Scopo                                                                                                                                                                                        |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverifica QA inclusa; scrive un report Markdown.                                                                                                                                          |
| `qa suite`                                          | Esegue scenari supportati dal repository contro la lane del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                     |
| `qa coverage`                                       | Stampa l'inventario Markdown della copertura degli scenari (`--json` per output macchina).                                                                                                  |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentico.                                                                                                            |
| `qa character-eval`                                 | Esegue lo scenario QA del personaggio su più modelli live con un report valutato. Vedi [Reportistica](#reporting).                                                                           |
| `qa manual`                                         | Esegue un prompt una tantum contro la lane del provider/modello selezionata.                                                                                                                 |
| `qa ui`                                             | Avvia la UI di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                                        |
| `qa docker-build-image`                             | Compila l'immagine Docker QA preconfezionata.                                                                                                                                                |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + la lane del Gateway.                                                                                                                |
| `qa up`                                             | Compila il sito QA, avvia lo stack supportato da Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).         |
| `qa aimock`                                         | Avvia solo il server del provider AIMock.                                                                                                                                                    |
| `qa mock-openai`                                    | Avvia solo il server del provider `mock-openai` consapevole degli scenari.                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool di credenziali Convex condiviso.                                                                                                                                            |
| `qa matrix`                                         | Lane di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [QA Matrix](/it/concepts/qa-matrix).                                                                                      |
| `qa telegram`                                       | Lane di trasporto live contro un gruppo Telegram privato reale.                                                                                                                              |
| `qa discord`                                        | Lane di trasporto live contro un canale di una guild Discord privata reale.                                                                                                                  |
| `qa slack`                                          | Lane di trasporto live contro un canale Slack privato reale.                                                                                                                                 |
| `qa mantis`                                         | Runner di verifica prima e dopo per bug di trasporto live, con evidenze di reazioni di stato Discord, smoke desktop/browser Crabbox e smoke Slack-in-VNC. Vedi [Mantis](/it/concepts/mantis).  |

## Flusso operatore

Il flusso operatore QA attuale è un sito QA a due pannelli:

- Sinistra: dashboard Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la lane del Gateway supportata da Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può assegnare all'agente una missione QA,
osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa non ha funzionato o
cosa è rimasto bloccato.

Per iterazioni più rapide sulla UI di QA Lab senza ricompilare ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind mount
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle a ogni modifica e il browser si ricarica automaticamente quando cambia l'hash
degli asset di QA Lab.

Per uno smoke trace OpenTelemetry locale, esegui:

```bash
pnpm qa:otel:smoke
```

Questo script avvia un ricevitore trace OTLP/HTTP locale, esegue lo scenario QA
`otel-trace-smoke` con il Plugin `diagnostics-otel` abilitato, poi
decodifica gli span protobuf esportati e asserisce la forma critica per la release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devono essere presenti;
le chiamate al modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono restare fuori dal trace. Scrive
`otel-smoke-summary.json` accanto agli artefatti della suite QA.

La QA di osservabilità resta disponibile solo dal checkout dei sorgenti. Il tarball npm omette intenzionalmente
QA Lab, quindi le lane di release Docker dei pacchetti non eseguono comandi `qa`. Usa
`pnpm qa:otel:smoke` da un checkout dei sorgenti compilato quando modifichi la strumentazione
diagnostica.

Per una lane smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo di profili/scenari, le variabili d'ambiente e il layout degli artefatti per questa lane sono in [QA Matrix](/it/concepts/qa-matrix). In sintesi: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/osservatore, esegue il Plugin Matrix reale dentro un Gateway QA figlio limitato a quel trasporto (nessun `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artefatto con gli eventi osservati e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Per lane smoke con trasporto reale Telegram, Discord e Slack:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Puntano a un canale reale preesistente con due bot (driver + SUT). Le variabili d'ambiente richieste, gli elenchi di scenari, gli artefatti di output e il pool di credenziali Convex sono documentati nel [riferimento QA per Telegram, Discord e Slack](#telegram-discord-and-slack-qa-reference) qui sotto.

Per un'esecuzione completa su VM desktop Slack con recupero VNC, esegui:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Questo comando prende in lease una macchina desktop/browser Crabbox, esegue la lane live Slack
dentro la VM, apre Slack Web nel browser VNC, acquisisce il desktop e
copia `slack-qa/` più `slack-desktop-smoke.png` nella directory degli artefatti Mantis.
Riusa `--lease-id <cbx_...>` dopo aver effettuato manualmente l'accesso a Slack Web
tramite VNC. Con `--gateway-setup`, Mantis lascia un Gateway Slack OpenClaw persistente
in esecuzione dentro la VM sulla porta `38973`; senza di esso, il comando esegue la
normale lane QA Slack bot-to-bot ed esce dopo l'acquisizione degli artefatti.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'ambiente del broker Convex, valida le impostazioni dell'endpoint e verifica la raggiungibilità admin/list quando il segreto del manutentore è presente. Riporta solo lo stato impostato/mancante per i segreti.

## Copertura dei trasporti live

Le lane di trasporto live condividono un unico contratto invece di inventare ciascuna una propria forma di elenco scenari. `qa-channel` è la suite sintetica ampia di comportamento prodotto e non fa parte della matrice di copertura dei trasporti live.

| Lane     | Canary | Gating menzioni | Bot-to-bot | Blocco allowlist | Risposta di primo livello | Ripresa al riavvio | Follow-up thread | Isolamento thread | Osservazione reazioni | Comando help | Registrazione comando nativo |
| -------- | ------ | --------------- | ---------- | ---------------- | ------------------------- | ------------------ | ---------------- | ----------------- | --------------------- | ------------ | ----------------------------- |
| Matrix   | x      | x               | x          | x                | x                         | x                  | x                | x                 | x                     |              |                               |
| Telegram | x      | x               | x          |                  |                           |                    |                  |                   |                       | x            |                               |
| Discord  | x      | x               | x          |                  |                           |                    |                  |                   |                       |              | x                             |
| Slack    | x      | x               | x          |                  |                           |                    |                  |                   |                       |              |                               |

Questo mantiene `qa-channel` come suite ampia di comportamento prodotto mentre Matrix,
Telegram e i futuri trasporti live condividono una checklist esplicita del contratto
di trasporto.

Per una lane VM Linux usa e getta senza portare Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono più scenari selezionati in parallelo
con worker Gateway isolati per impostazione predefinita. `qa-channel` usa come predefinita la concorrenza
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Il comando termina con un codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi ottenere gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati e pratici per il
guest: chiavi provider basate su env, il percorso della configurazione provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la radice del repository, così il guest
può riscrivere tramite il workspace montato.

## Riferimento QA per Telegram, Discord e Slack

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) per via del numero di scenari e del provisioning dell'homeserver supportato da Docker. Telegram, Discord e Slack sono più piccoli: pochi scenari ciascuno, nessun sistema di profili, contro canali reali preesistenti, quindi il loro riferimento è qui.

### Flag CLI condivisi

Queste lane si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                                     | Descrizione                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Esegue solo questo scenario. Ripetibile.                                                                              |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Dove vengono scritti report/riepilogo/messaggi osservati e il log di output. I percorsi relativi si risolvono rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Radice del repository quando si invoca da una cwd neutra.                                                             |
| `--sut-account <id>`                  | `sut`                                                           | ID account temporaneo all'interno della configurazione del Gateway QA.                                                |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` o `live-frontier` (il legacy `live-openai` funziona ancora).                                            |
| `--model <ref>` / `--alt-model <ref>` | predefinito del provider                                        | Riferimenti al modello primario/alternativo.                                                                          |
| `--fast`                              | disattivato                                                     | Modalità veloce del provider dove supportata.                                                                         |
| `--credential-source <env\|convex>`   | `env`                                                           | Vedi [pool credenziali Convex](#convex-credential-pool).                                                              |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, altrimenti `maintainer`                             | Ruolo usato quando `--credential-source convex`.                                                                      |

Ogni lane termina con un codice diverso da zero se uno scenario fallisce. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Punta a un gruppo Telegram privato reale con due bot distinti (driver + SUT). Il bot SUT deve avere un nome utente Telegram; l'osservazione bot-to-bot funziona meglio quando entrambi i bot hanno **Bot-to-Bot Communication Mode** abilitata in `@BotFather`.

Env richiesto quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opzionale:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati (il valore predefinito li redige).

Scenari (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artefatti di output:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — include l'RTT per risposta (invio del driver → risposta SUT osservata) a partire dal canary.
- `telegram-qa-observed-messages.json` — corpi redatti a meno che `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Punta a un canale guild Discord privato reale con due bot: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord incluso. Verifica la gestione delle menzioni del canale, che il bot SUT abbia registrato il comando nativo `/help` con Discord, e gli scenari di evidenza Mantis opt-in.

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
- `discord-status-reactions-tool-only` — scenario Mantis opt-in. Viene eseguito da solo perché imposta il SUT su risposte guild sempre attive e solo strumenti con `messages.statusReactions.enabled=true`, quindi cattura una timeline delle reazioni REST più un artefatto visuale HTML/PNG.

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
- `discord-qa-observed-messages.json` — corpi redatti a meno che `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando viene eseguito lo scenario delle reazioni di stato.

### QA Slack

```bash
pnpm openclaw qa slack
```

Punta a un canale Slack privato reale con due bot distinti: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Slack incluso.

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
- `slack-qa-observed-messages.json` — corpi redatti a meno che `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurazione del workspace Slack

La lane richiede due app Slack distinte in un workspace, più un canale di cui entrambi i bot sono membri:

- `channelId` — l'ID `Cxxxxxxxxxx` di un canale a cui entrambi i bot sono stati invitati. Usa un canale dedicato; la lane pubblica a ogni esecuzione.
- `driverBotToken` — token bot (`xoxb-...`) dell'app **Driver**.
- `sutBotToken` — token bot (`xoxb-...`) dell'app **SUT**, che deve essere un'app Slack separata dal driver così che il suo ID utente bot sia distinto.
- `sutAppToken` — token a livello di app (`xapp-...`) dell'app SUT con `connections:write`, usato da Socket Mode così l'app SUT può ricevere eventi.

Preferisci un workspace Slack dedicato alla QA rispetto al riutilizzo di un workspace di produzione.

Il manifest SUT seguente rispecchia l'installazione di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`). Per la configurazione del canale di produzione come la vedono gli utenti, vedi [configurazione rapida del canale Slack](/it/channels/slack#quick-setup); la coppia Driver/SUT QA è intenzionalmente separata perché la lane richiede due ID utente bot distinti in un workspace.

**1. Crea l'app Driver**

Vai a [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → scegli il workspace QA, incolla il manifest seguente, quindi _Install to Workspace_:

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

Copia il _Bot User OAuth Token_ (`xoxb-...`): diventa `driverBotToken`. Il driver deve solo pubblicare messaggi e identificarsi; niente eventi, niente Socket Mode.

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

Dopo che Slack crea l'app, fai due cose nella sua pagina delle impostazioni:

- _Install to Workspace_ → copia il _Bot User OAuth Token_ → diventa `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → aggiungi lo scope `connections:write` → salva → copia il valore `xapp-...` → diventa `sutAppToken`.

Verifica che i due bot abbiano ID utente distinti chiamando `auth.test` su ciascun token. Il runtime distingue driver e SUT in base all'ID utente; riutilizzare un'unica app per entrambi farà fallire immediatamente il gating delle menzioni.

**3. Crea il canale**

Nel workspace QA, crea un canale (ad es. `#openclaw-qa`) e invita entrambi i bot dall'interno del canale:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia l'ID `Cxxxxxxxxxx` da _informazioni canale → Informazioni → ID canale_: diventa `channelId`. Un canale pubblico funziona; se usi un canale privato, entrambe le app hanno già `groups:history`, quindi le letture della cronologia dell'harness riusciranno comunque.

**4. Registra le credenziali**

Due opzioni. Usa variabili di ambiente per il debug su una singola macchina (imposta le quattro variabili `OPENCLAW_QA_SLACK_*` e passa `--credential-source env`), oppure inizializza il pool Convex condiviso in modo che CI e altri maintainer possano prenderle in lease.

Per il pool Convex, scrivi i quattro campi in un file JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Con `OPENCLAW_QA_CONVEX_SITE_URL` e `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` esportati nella shell, registra e verifica:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Aspettati `count: 1`, `status: "active"`, nessun campo `lease`.

**5. Verifica end-to-end**

Esegui la lane localmente per confermare che entrambi i bot possano comunicare tra loro tramite il broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Un'esecuzione verde completa in ben meno di 30 secondi e `slack-qa-report.md` mostra sia `slack-canary` sia `slack-mention-gating` con stato `pass`. Se la lane resta bloccata per circa 90 secondi ed esce con `Convex credential pool exhausted for kind "slack"`, il pool è vuoto oppure ogni riga è in lease: `qa credentials list --kind slack --status all --json` ti dirà quale caso è.

### Pool di credenziali Convex

Le lane Telegram, Discord e Slack possono prendere in lease le credenziali da un pool Convex condiviso invece di leggere le variabili di ambiente sopra. Passa `--credential-source convex` (oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, ne invia heartbeat per tutta la durata dell'esecuzione e lo rilascia allo spegnimento. I tipi di pool sono `"telegram"`, `"discord"` e `"slack"`.

Forme dei payload che il broker valida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }`: `groupId` deve essere una stringa chat-id numerica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`: `channelId` deve corrispondere a `^[A-Z][A-Z0-9]+$` (un ID Slack come `Cxxxxxxxxxx`). Consulta [Configurazione del workspace Slack](#setting-up-the-slack-workspace) per il provisioning di app e ambiti.

Le variabili di ambiente operative e il contratto dell'endpoint del broker Convex si trovano in [Testing → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il supporto Discord; la semantica del broker è identica per entrambi i tipi).

## Seed supportati dal repo

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git in modo che il piano QA sia visibile sia agli esseri umani sia all'agente.

`qa-lab` deve restare un runner Markdown generico. Ogni file Markdown di scenario è la fonte di verità per una singola esecuzione di test e deve definire:

- metadati dello scenario
- metadati opzionali di categoria, capability, lane e rischio
- riferimenti a documenti e codice
- requisiti opzionali dei Plugin
- patch opzionale della configurazione del Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile alla base di `qa-flow` può rimanere generica e trasversale. Per esempio, gli scenari Markdown possono combinare helper lato trasporto con helper lato browser che guidano la Control UI integrata attraverso la seam `browser.request` del Gateway senza aggiungere un runner speciale.

I file di scenario devono essere raggruppati per capability del prodotto anziché per cartella dell'albero sorgente. Mantieni stabili gli ID scenario quando i file vengono spostati; usa `docsRefs` e `codeRefs` per la tracciabilità dell'implementazione.

L'elenco di baseline deve restare abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio di modello
- handoff dei subagent
- lettura del repo e lettura della documentazione
- un piccolo task di build come Lobster Invaders

## Lane mock dei provider

`qa suite` ha due lane mock locali dei provider:

- `mock-openai` è il mock OpenClaw consapevole degli scenari. Rimane la lane mock deterministica predefinita per QA supportato dal repo e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo, fixture, record/replay e chaos. È additivo e non sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle lane provider si trova sotto `extensions/qa-lab/src/providers/`. Ogni provider possiede i propri default, l'avvio del server locale, la configurazione del modello Gateway, le esigenze di staging degli auth-profile e i flag di capability live/mock. Il codice condiviso di suite e Gateway deve passare attraverso il registry dei provider invece di ramificare sui nomi dei provider.

## Adapter di trasporto

`qa-lab` possiede una seam di trasporto generica per gli scenari QA Markdown. `qa-channel` è il primo adapter su quella seam, ma l'obiettivo di progettazione è più ampio: i canali futuri reali o sintetici devono collegarsi allo stesso runner di suite invece di aggiungere un runner QA specifico per trasporto.

A livello architetturale, la suddivisione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza dei worker, scrittura degli artefatti e reportistica.
- L'adapter di trasporto possiede configurazione del Gateway, readiness, osservazione in ingresso e in uscita, azioni di trasporto e stato di trasporto normalizzato.
- I file di scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiungere un canale

Aggiungere un canale al sistema QA Markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che esercita il contratto del canale.

Non aggiungere una nuova radice di comando QA di primo livello quando l'host `qa-lab` condiviso può possedere il flusso.

`qa-lab` possiede la meccanica dell'host condiviso:

- la radice del comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per gli scenari `qa-channel` più vecchi

I Plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la radice condivisa `qa`
- come il Gateway viene configurato per quel trasporto
- come viene controllata la readiness
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposti trascrizioni e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o cleanup specifico del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della radice `qa` condivisa.
2. Implementa il runner di trasporto sulla seam dell'host `qa-lab` condiviso.
3. Mantieni la meccanica specifica del trasporto dentro il Plugin runner o l'harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando radice concorrente. I Plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni `runtime-api.ts` leggero; CLI lazy ed esecuzione del runner devono restare dietro entrypoint separati.
5. Crea o adatta scenari Markdown sotto le directory tematiche `qa/scenarios/`.
6. Usa gli helper di scenario generici per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, a meno che il repo stia eseguendo una migrazione intenzionale.

La regola decisionale è rigida:

- Se il comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se il comportamento dipende da un trasporto di canale, tienilo in quel Plugin runner o harness del Plugin.
- Se uno scenario richiede una nuova capability che più di un canale può usare, aggiungi un helper generico invece di un ramo specifico per canale in `suite.ts`.
- Se un comportamento ha senso solo per un trasporto, mantieni lo scenario specifico per trasporto e rendilo esplicito nel contratto dello scenario.

### Nomi degli helper di scenario

Helper generici preferiti per i nuovi scenari:

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

Gli alias di compatibilità restano disponibili per gli scenari esistenti: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`, ma la creazione di nuovi scenari deve usare i nomi generici. Gli alias esistono per evitare una migrazione flag-day, non come modello futuro.

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservato.
Il report deve rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili, utile quando si dimensiona il lavoro di follow-up o si collega un nuovo trasporto, esegui `pnpm openclaw qa coverage` (aggiungi `--json` per output leggibile dalla macchina).

Per controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modelli live e scrivi un report Markdown giudicato:

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

Il comando esegue processi figlio del Gateway QA locale, non Docker. Gli scenari di valutazione del personaggio devono impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente come chat, aiuto nello spazio di lavoro e piccole attività sui file. Al modello candidato non deve essere comunicato che viene valutato. Il comando conserva ogni trascrizione completa, registra le statistiche di base dell'esecuzione, quindi chiede ai modelli giudici in modalità veloce con ragionamento `xhigh`, dove supportato, di classificare le esecuzioni per naturalezza, tono e umorismo.
Usa `--blind-judge-models` quando confronti i provider: il prompt del giudice riceve comunque ogni trascrizione e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con etichette neutre come `candidate-01`; il report riconduce le classifiche ai riferimenti reali dopo il parsing.
Le esecuzioni dei candidati usano per impostazione predefinita il thinking `high`, con `medium` per GPT-5.5 e `xhigh` per i riferimenti di valutazione OpenAI più vecchi che lo supportano. Sovrascrivi un candidato specifico inline con `--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un fallback globale, e la forma precedente `--model-thinking <provider/model=level>` viene mantenuta per compatibilità.
I riferimenti dei candidati OpenAI usano per impostazione predefinita la modalità veloce, in modo da usare l'elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un singolo candidato o giudice necessita di una sovrascrittura. Passa `--fast` solo quando vuoi forzare la modalità veloce per ogni modello candidato. Le durate di candidati e giudici vengono registrate nel report per l'analisi dei benchmark, ma i prompt dei giudici indicano esplicitamente di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita una concorrenza di 16. Riduci `--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul Gateway locale rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun candidato `--model`, la valutazione del personaggio usa per impostazione predefinita `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita `openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Matrice QA](/it/concepts/qa-matrix)
- [Canale QA](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Pannello di controllo](/it/web/dashboard)
