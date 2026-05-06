---
read_when:
    - Comprendere come si articola lo stack QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiunta di scenari QA basati sul repository
    - Creazione di automazione QA più realistica per la dashboard del Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari supportati dal repo, corsie di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica QA
x-i18n:
    generated_at: "2026-05-06T08:47:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ec1184395c8771c7bff755c97e5418e0c8b258f9953f1c945327d5c9753a69e
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato serve a esercitare OpenClaw in modo più realistico e
modellato sui canali rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggistica sintetico con superfici DM,
  canale, thread, reazioni, modifica ed eliminazione.
- `extensions/qa-lab`: interfaccia di debug e bus QA per osservare la
  trascrizione, iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, futuri runner plugin: adattatori di trasporto live che
  guidano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed supportati dal repo per l'attività iniziale e gli scenari QA
  di baseline.
- [Mantis](/it/concepts/mantis): verifica live prima e dopo per bug che
  richiedono trasporti reali, screenshot del browser, stato della VM ed evidenza
  PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno
alias di script `pnpm qa:*`; entrambe le forme sono supportate.

| Comando                                             | Scopo                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverifica QA inclusa; scrive un report Markdown.                                                                                                                                                                                                                     |
| `qa suite`                                          | Esegue scenari supportati dal repo contro la corsia del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                                                                                                    |
| `qa coverage`                                       | Stampa l'inventario Markdown della copertura degli scenari (`--json` per output macchina).                                                                                                                                                                              |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentico.                                                                                                                                                                                       |
| `qa character-eval`                                 | Esegue lo scenario QA del carattere su più modelli live con un report giudicato. Vedi [Reportistica](#reporting).                                                                                                                                                       |
| `qa manual`                                         | Esegue un prompt una tantum contro la corsia provider/modello selezionata.                                                                                                                                                                                              |
| `qa ui`                                             | Avvia l'interfaccia di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                           |
| `qa docker-build-image`                             | Compila l'immagine Docker QA preconfezionata.                                                                                                                                                                                                                           |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + corsia Gateway.                                                                                                                                                                                                |
| `qa up`                                             | Compila il sito QA, avvia lo stack supportato da Docker e stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                  |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole dello scenario.                                                                                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool di credenziali Convex condiviso.                                                                                                                                                                                                                       |
| `qa matrix`                                         | Corsia di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [Matrix QA](/it/concepts/qa-matrix).                                                                                                                                                              |
| `qa telegram`                                       | Corsia di trasporto live contro un vero gruppo Telegram privato.                                                                                                                                                                                                        |
| `qa discord`                                        | Corsia di trasporto live contro un vero canale di guild Discord privato.                                                                                                                                                                                                |
| `qa slack`                                          | Corsia di trasporto live contro un vero canale Slack privato.                                                                                                                                                                                                           |
| `qa mantis`                                         | Runner di verifica prima e dopo per bug di trasporto live, con evidenza di reazioni di stato Discord, smoke desktop/browser Crabbox e smoke Slack-in-VNC. Vedi [Mantis](/it/concepts/mantis) e [Runbook desktop Slack Mantis](/it/concepts/mantis-slack-desktop-runbook). |

## Flusso operatore

Il flusso operatore QA attuale è un sito QA a due pannelli:

- Sinistra: dashboard Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello
  scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la corsia Gateway supportata da Docker ed espone
la pagina QA Lab in cui un operatore o un loop di automazione può assegnare
all'agente una missione QA, osservare il comportamento reale del canale e
registrare cosa ha funzionato, cosa è fallito o cosa è rimasto bloccato.

Per iterare più rapidamente sull'interfaccia QA Lab senza ricompilare ogni volta
l'immagine Docker, avvia lo stack con un bundle QA Lab montato via bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta
via bind `extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle alle modifiche, e il browser si ricarica automaticamente
quando cambia l'hash degli asset QA Lab.

Per uno smoke locale delle tracce OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Quello script avvia un ricevitore di tracce OTLP/HTTP locale, esegue lo scenario
QA `otel-trace-smoke` con il plugin `diagnostics-otel` abilitato, quindi decodifica
gli span protobuf esportati e verifica la forma critica per la release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devono essere presenti;
le chiamate al modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono rimanere fuori dalla traccia. Scrive
`otel-smoke-summary.json` accanto agli artefatti della suite QA.

La QA di osservabilità resta solo per checkout sorgente. Il tarball npm omette
intenzionalmente QA Lab, quindi le corsie di release Docker del pacchetto non
eseguono comandi `qa`. Usa `pnpm qa:otel:smoke` da un checkout sorgente compilato
quando modifichi la strumentazione diagnostica.

Per una corsia smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo profili/scenari, le variabili d'ambiente e il layout degli artefatti per questa corsia si trovano in [Matrix QA](/it/concepts/qa-matrix). In breve: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/osservatore, esegue il plugin Matrix reale dentro un Gateway QA figlio con ambito limitato a quel trasporto (nessun `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artefatto di eventi osservati e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Gli scenari coprono comportamenti di trasporto che i test unitari non possono dimostrare end-to-end: gating delle menzioni, policy allow-bot, allowlist, risposte di primo livello e in thread, routing DM, gestione delle reazioni, soppressione delle modifiche in ingresso, deduplicazione del replay al riavvio, recupero da interruzione dell'homeserver, consegna dei metadati di approvazione, gestione dei media e flussi di bootstrap/recupero/verifica Matrix E2EE. Il profilo CLI E2EE guida anche `openclaw matrix encryption setup` e i comandi di verifica attraverso lo stesso homeserver usa e getta prima di controllare le risposte del Gateway.

Discord ha anche scenari opt-in solo Mantis per la riproduzione di bug. Usa
`--scenario discord-status-reactions-tool-only` per la timeline esplicita delle
reazioni di stato, oppure `--scenario discord-thread-reply-filepath-attachment`
per creare un thread Discord reale e verificare che `message.thread-reply`
preservi un allegato `filePath`. Questi scenari restano fuori dalla corsia
Discord live predefinita perché sono probe di riproduzione prima/dopo invece che
copertura smoke ampia. Il workflow Mantis per l'allegato del thread può anche
aggiungere un video testimone Discord Web con accesso effettuato quando
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` è configurato nell'ambiente QA.
Quel profilo visualizzatore serve solo per la cattura visiva; la decisione
pass/fail arriva comunque dall'oracolo REST Discord.

CI usa la stessa superficie di comandi in `.github/workflows/qa-live-transports-convex.yml`. Le esecuzioni pianificate e manuali predefinite eseguono il profilo Matrix veloce con credenziali frontier live, `--fast` e `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Il manuale `matrix_profile=all` si espande nei cinque shard di profilo così il catalogo esaustivo può essere eseguito in parallelo mantenendo una directory di artefatti per shard.

Per corsie smoke Telegram, Discord e Slack con trasporto reale:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Puntano a un canale reale preesistente con due bot (driver + SUT). Le variabili d'ambiente richieste, gli elenchi di scenari, gli artefatti di output e il pool di credenziali Convex sono documentati nel [riferimento QA per Telegram, Discord e Slack](#telegram-discord-and-slack-qa-reference) qui sotto.

Per un'esecuzione completa della VM desktop Slack con recupero VNC, esegui:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Questo comando prende in lease una macchina desktop/browser Crabbox, esegue la lane live Slack
dentro la VM, apre Slack Web nel browser VNC, acquisisce il desktop e
copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`,
quando l'acquisizione video e disponibile, nella directory degli artefatti Mantis. I lease
desktop/browser di Crabbox forniscono in anticipo gli strumenti di acquisizione e i pacchetti helper
per browser/build nativa, quindi lo scenario dovrebbe installare fallback solo sui lease
piu vecchi. Mantis riporta i tempi totali e per fase in
`mantis-slack-desktop-smoke-report.md`, cosi le esecuzioni lente mostrano se il tempo e stato speso in
riscaldamento del lease, acquisizione delle credenziali, configurazione remota o copia degli artefatti. Riusa
`--lease-id <cbx_...>` dopo aver effettuato manualmente l'accesso a Slack Web tramite VNC;
i lease riutilizzati mantengono calda anche la cache dello store pnpm di Crabbox. Il valore predefinito
`--hydrate-mode source` verifica da un checkout sorgente ed esegue install/build
dentro la VM. Usa `--hydrate-mode prehydrated` solo quando lo spazio di lavoro remoto riutilizzato
ha gia `node_modules` e un `dist/` compilato; quella modalita salta il
costoso passaggio install/build e fallisce in modo chiuso quando lo spazio di lavoro non e pronto.
Con `--gateway-setup`, Mantis lascia un Gateway OpenClaw Slack persistente
in esecuzione dentro la VM sulla porta `38973`; senza questa opzione, il comando esegue la normale
lane QA Slack bot-to-bot ed esce dopo l'acquisizione degli artefatti.

La checklist dell'operatore, il comando di dispatch del workflow GitHub, il contratto del commento di evidenza,
la tabella decisionale della modalita hydrate, l'interpretazione dei tempi e i passaggi di gestione degli errori
sono in [Runbook desktop Mantis Slack](/it/concepts/mantis-slack-desktop-runbook).

Per un'attivita desktop in stile agente/CV, esegui:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` prende in lease o riusa una macchina desktop/browser Crabbox, avvia
`crabbox record --while`, guida il browser visibile tramite un
`visual-driver` annidato, acquisisce `visual-task.png`, esegue `openclaw infer image describe`
sullo screenshot quando e selezionato `--vision-mode image-describe` e
scrive `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e `mantis-visual-task-report.md`.
Quando `--expect-text` e impostato, il prompt visivo richiede un verdetto JSON
strutturato e passa solo quando il modello riporta evidenza visibile positiva; una
risposta negativa che si limita a citare il testo target fallisce l'asserzione.
Usa `--vision-mode metadata` per uno smoke senza modello che prova la parte desktop,
browser, screenshot e video senza chiamare un provider di comprensione delle immagini.
La registrazione e un artefatto obbligatorio per `visual-task`; se Crabbox non registra
un `visual-task.mp4` non vuoto, l'attivita fallisce anche quando il driver visivo
e passato. In caso di errore, Mantis conserva il lease per VNC, a meno che l'attivita non fosse gia
passata e `--keep-lease` non fosse impostato.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'ambiente del broker Convex, valida le impostazioni degli endpoint e verifica la raggiungibilita admin/list quando il segreto del maintainer e presente. Riporta solo lo stato impostato/mancante per i segreti.

## Copertura del trasporto live

Le lane di trasporto live condividono un unico contratto invece di inventare ciascuna la propria forma dell'elenco scenari. `qa-channel` e la suite ampia di comportamento prodotto sintetico e non fa parte della matrice di copertura del trasporto live.

| Lane     | Canary | Gating delle menzioni | Bot-to-bot | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione delle reazioni | Comando help | Registrazione comando nativo |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               | x              | x                | x                |                      |              |                             |

Questo mantiene `qa-channel` come suite ampia di comportamento prodotto mentre Matrix,
Telegram e i futuri trasporti live condividono una checklist esplicita del contratto
di trasporto.

Per una lane VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
dentro il guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riusa lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono piu scenari selezionati in parallelo
con worker Gateway isolati per impostazione predefinita. `qa-channel` usa per impostazione predefinita una concorrenza
di 4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Il comando esce con codice diverso da zero quando qualunque scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, percorso della configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la radice del repository cosi il guest
puo scrivere tramite lo spazio di lavoro montato.

## Riferimento QA per Telegram, Discord e Slack

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) per via del numero di scenari e del provisioning dell'homeserver basato su Docker. Telegram, Discord e Slack sono piu piccoli - pochi scenari ciascuno, nessun sistema di profili, contro canali reali preesistenti - quindi il loro riferimento si trova qui.

### Flag CLI condivisi

Queste lane si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                                     | Descrizione                                                                                                           |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                               | Esegui solo questo scenario. Ripetibile.                                                                              |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Dove vengono scritti report/riepilogo/messaggi osservati e il log di output. I percorsi relativi si risolvono rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Radice del repository quando si invoca da una cwd neutra.                                                            |
| `--sut-account <id>`                  | `sut`                                                           | ID account temporaneo dentro la configurazione del Gateway QA.                                                       |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` o `live-frontier` (`live-openai` legacy funziona ancora).                                              |
| `--model <ref>` / `--alt-model <ref>` | predefinito del provider                                        | Riferimenti del modello primario/alternativo.                                                                         |
| `--fast`                              | disattivato                                                     | Modalita veloce del provider dove supportata.                                                                         |
| `--credential-source <env\|convex>`   | `env`                                                           | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, altrimenti `maintainer`                             | Ruolo usato quando `--credential-source convex`.                                                                      |

Ogni lane esce con codice diverso da zero in caso di qualunque scenario fallito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Ha come target un gruppo Telegram privato reale con due bot distinti (driver + SUT). Il bot SUT deve avere uno username Telegram; l'osservazione bot-to-bot funziona meglio quando entrambi i bot hanno la **Modalita di comunicazione bot-to-bot** abilitata in `@BotFather`.

Env richiesto quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opzionale:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserva i corpi dei messaggi negli artefatti dei messaggi osservati (per impostazione predefinita vengono redatti).

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
- `telegram-qa-summary.json` - include l'RTT per risposta (invio driver → risposta SUT osservata) a partire dal canary.
- `telegram-qa-observed-messages.json` - corpi redatti a meno che `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Ha come target un canale guild Discord privato reale con due bot: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il plugin Discord incluso. Verifica la gestione delle menzioni del canale, che il bot SUT abbia registrato il comando nativo `/help` con Discord, e gli scenari di evidenza Mantis opt-in.

Env richiesto quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corrispondere all'id utente del bot SUT restituito da Discord (altrimenti la lane fallisce subito).

Opzionale:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva i corpi dei messaggi negli artefatti dei messaggi osservati.

Scenari (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` - scenario Mantis opt-in. Viene eseguito da solo perche passa il SUT a risposte guild sempre attive e solo strumenti con `messages.statusReactions.enabled=true`, quindi acquisisce una timeline REST delle reazioni piu artefatti visivi HTML/PNG. I report Mantis prima/dopo conservano anche gli artefatti MP4 forniti dallo scenario come `baseline.mp4` e `candidate.mp4`.

Esegui esplicitamente lo scenario Mantis delle reazioni di stato:

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
- `discord-qa-observed-messages.json` - corpi oscurati a meno che `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando viene eseguito lo scenario di reazione allo stato.

### QA Slack

```bash
pnpm openclaw qa slack
```

Prende di mira un canale Slack privato reale con due bot distinti: un bot driver controllato dall'infrastruttura di test e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Slack incluso.

Env obbligatorie quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opzionale:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserva i corpi dei messaggi negli artefatti dei messaggi osservati.

Scenari (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`

Artefatti di output:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` - corpi oscurati a meno che `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurazione dell'area di lavoro Slack

La lane richiede due app Slack distinte in un'unica area di lavoro, più un canale di cui entrambi i bot siano membri:

- `channelId` - l'id `Cxxxxxxxxxx` di un canale a cui entrambi i bot sono stati invitati. Usa un canale dedicato; la lane pubblica a ogni esecuzione.
- `driverBotToken` - token del bot (`xoxb-...`) dell'app **Driver**.
- `sutBotToken` - token del bot (`xoxb-...`) dell'app **SUT**, che deve essere un'app Slack separata dal driver affinché il suo id utente bot sia distinto.
- `sutAppToken` - token a livello di app (`xapp-...`) dell'app SUT con `connections:write`, usato da Socket Mode affinché l'app SUT possa ricevere eventi.

Preferisci un'area di lavoro Slack dedicata alla QA invece di riutilizzare un'area di lavoro di produzione.

Il manifesto SUT qui sotto restringe intenzionalmente l'installazione di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`) alle autorizzazioni e agli eventi coperti dalla suite QA Slack live. Per la configurazione del canale di produzione così come la vedono gli utenti, consulta [configurazione rapida del canale Slack](/it/channels/slack#quick-setup); la coppia Driver/SUT QA è intenzionalmente separata perché la lane richiede due id utente bot distinti in un'unica area di lavoro.

**1. Crea l'app Driver**

Vai a [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → scegli l'area di lavoro QA, incolla il manifesto seguente, quindi _Install to Workspace_:

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

Copia il _Bot User OAuth Token_ (`xoxb-...`) - diventa `driverBotToken`. Al driver serve solo pubblicare messaggi e identificarsi; nessun evento, nessuna Socket Mode.

**2. Crea l'app SUT**

Ripeti _Create New App → From a manifest_ nella stessa area di lavoro. Questa app QA usa intenzionalmente una versione più ristretta del manifesto di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`): gli ambiti e gli eventi di reazione sono omessi perché la suite QA Slack live non copre ancora la gestione delle reazioni.

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
        "pin_removed"
      ]
    }
  }
}
```

Dopo che Slack ha creato l'app, fai due cose nella sua pagina delle impostazioni:

- _Install to Workspace_ → copia il _Bot User OAuth Token_ → diventa `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → aggiungi l'ambito `connections:write` → salva → copia il valore `xapp-...` → diventa `sutAppToken`.

Verifica che i due bot abbiano id utente distinti chiamando `auth.test` su ciascun token. Il runtime distingue driver e SUT in base all'id utente; riutilizzare un'unica app per entrambi farà fallire immediatamente il filtro delle menzioni.

**3. Crea il canale**

Nell'area di lavoro QA, crea un canale (ad es. `#openclaw-qa`) e invita entrambi i bot dall'interno del canale:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia l'id `Cxxxxxxxxxx` da _channel info → About → Channel ID_ - diventa `channelId`. Un canale pubblico funziona; se usi un canale privato, entrambe le app hanno già `groups:history`, quindi le letture della cronologia dell'infrastruttura di test riusciranno comunque.

**4. Registra le credenziali**

Due opzioni. Usa variabili env per il debug su una singola macchina (imposta le quattro variabili `OPENCLAW_QA_SLACK_*` e passa `--credential-source env`), oppure popola il pool Convex condiviso così CI e gli altri manutentori possono prenderle in lease.

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

**5. Verifica da un'estremità all'altra**

Esegui la corsia localmente per confermare che entrambi i bot possano comunicare tra loro tramite il broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Un'esecuzione riuscita si completa in molto meno di 30 secondi e `slack-qa-report.md` mostra sia `slack-canary` sia `slack-mention-gating` con stato `pass`. Se la corsia resta bloccata per circa 90 secondi ed esce con `Convex credential pool exhausted for kind "slack"`, il pool è vuoto oppure ogni riga è in lease: `qa credentials list --kind slack --status all --json` ti dirà quale delle due.

### Pool di credenziali Convex

Le corsie Telegram, Discord e Slack possono prendere in lease le credenziali da un pool Convex condiviso invece di leggere le variabili d'ambiente sopra. Passa `--credential-source convex` (o imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, ne invia l'Heartbeat per tutta la durata dell'esecuzione e lo rilascia allo spegnimento. I tipi di pool sono `"telegram"`, `"discord"` e `"slack"`.

Formati del payload che il broker valida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` deve essere una stringa chat-id numerica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` deve corrispondere a `^[A-Z][A-Z0-9]+$` (un id Slack come `Cxxxxxxxxxx`). Vedi [Configurazione dello workspace Slack](#setting-up-the-slack-workspace) per il provisioning dell'app e degli scope.

Le variabili d'ambiente operative e il contratto dell'endpoint del broker Convex sono in [Testing → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il supporto Discord; la semantica del broker è identica per entrambi i tipi).

## Seed supportati dal repo

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git, così il piano QA è visibile sia alle persone sia
all'agente.

`qa-lab` deve restare un runner markdown generico. Ogni file markdown di scenario è
la fonte di verità per una singola esecuzione di test e deve definire:

- metadati dello scenario
- metadati opzionali di categoria, capacità, corsia e rischio
- riferimenti a documentazione e codice
- requisiti Plugin opzionali
- patch opzionale della configurazione Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può restare generica
e trasversale. Per esempio, gli scenari markdown possono combinare helper lato trasporto
con helper lato browser che guidano la Control UI incorporata tramite la
seam Gateway `browser.request` senza aggiungere un runner per casi speciali.

I file di scenario devono essere raggruppati per capacità di prodotto anziché per cartella
dell'albero sorgente. Mantieni stabili gli ID scenario quando i file si spostano; usa `docsRefs` e `codeRefs`
per la tracciabilità dell'implementazione.

L'elenco baseline deve restare abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback cron
- richiamo della memoria
- cambio di modello
- passaggio a subagente
- lettura del repo e lettura della documentazione
- una piccola attività di build come Lobster Invaders

## Corsie mock dei provider

`qa suite` ha due corsie mock locali dei provider:

- `mock-openai` è il mock OpenClaw consapevole degli scenari. Resta la corsia mock
  deterministica predefinita per QA supportata dal repo e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo,
  fixture, registrazione/riproduzione e caos. È additivo e non
  sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle corsie provider si trova sotto `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, l'avvio del server locale, la configurazione del modello Gateway,
le esigenze di staging degli auth-profile e i flag di capacità live/mock. Il codice condiviso della suite e del
Gateway deve passare attraverso il registro dei provider invece di diramarsi sui
nomi dei provider.

## Adattatori di trasporto

`qa-lab` possiede una seam di trasporto generica per gli scenari QA markdown. `qa-channel` è il primo adattatore su quella seam, ma l'obiettivo di progettazione è più ampio: i canali futuri reali o sintetici devono collegarsi allo stesso runner della suite invece di aggiungere un runner QA specifico per il trasporto.

A livello di architettura, la separazione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza dei worker, scrittura degli artefatti e reportistica.
- L'adattatore di trasporto possiede configurazione Gateway, readiness, osservazione in ingresso e in uscita, azioni di trasporto e stato di trasporto normalizzato.
- I file di scenario markdown sotto `qa/scenarios/` definiscono l'esecuzione di test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiunta di un canale

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adattatore di trasporto per il canale.
2. Un pacchetto di scenari che eserciti il contratto del canale.

Non aggiungere una nuova radice di comando QA di primo livello quando l'host condiviso `qa-lab` può possedere il flusso.

`qa-lab` possiede la meccanica dell'host condiviso:

- la radice del comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per gli scenari `qa-channel` meno recenti

I Plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la radice condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene verificata la prontezza
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposti le trascrizioni e lo stato normalizzato del trasporto
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifica del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della radice condivisa `qa`.
2. Implementa il runner di trasporto sul punto di integrazione host condiviso di `qa-lab`.
3. Mantieni la meccanica specifica del trasporto dentro il Plugin runner o l'harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando radice concorrente. I Plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni leggero `runtime-api.ts`; la CLI lazy e l'esecuzione del runner devono restare dietro entrypoint separati.
5. Crea o adatta scenari Markdown sotto le directory tematiche `qa/scenarios/`.
6. Usa gli helper di scenario generici per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, a meno che il repo non stia eseguendo una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se il comportamento può essere espresso una sola volta in `qa-lab`, inseriscilo in `qa-lab`.
- Se il comportamento dipende da un solo trasporto di canale, mantienilo in quel Plugin runner o nell'harness del Plugin.
- Se uno scenario richiede una nuova capacità utilizzabile da più di un canale, aggiungi un helper generico invece di un ramo specifico del canale in `suite.ts`.
- Se un comportamento ha senso solo per un trasporto, mantieni lo scenario specifico del trasporto e rendilo esplicito nel contratto dello scenario.

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

Gli alias di compatibilità restano disponibili per gli scenari esistenti - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ma la creazione di nuovi scenari deve usare i nomi generici. Gli alias esistono per evitare una migrazione in un unico passaggio, non come modello futuro.

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservata.
Il report deve rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili - utile quando si dimensiona il lavoro di follow-up o si collega un nuovo trasporto - esegui `pnpm openclaw qa coverage` (aggiungi `--json` per output leggibile da macchina).

Per i controlli di carattere e stile, esegui lo stesso scenario su più ref di modelli live
e scrivi un report Markdown valutato:

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

Il comando esegue processi figli del Gateway QA locale, non Docker. Gli scenari di valutazione del carattere
devono impostare la persona tramite `SOUL.md`, poi eseguire turni utente ordinari
come chat, aiuto nello workspace e piccoli task sui file. Al modello candidato non deve
essere detto che è in fase di valutazione. Il comando conserva ogni trascrizione
completa, registra statistiche di esecuzione di base, poi chiede ai modelli giudici in modalità veloce con
ragionamento `xhigh` dove supportato di classificare le esecuzioni per naturalezza, atmosfera e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni trascrizione e stato di esecuzione, ma i ref candidati vengono sostituiti con
etichette neutre come `candidate-01`; il report rimappa le classifiche ai ref reali dopo
il parsing.
Le esecuzioni candidate usano per impostazione predefinita il pensiero `high`, con `medium` per GPT-5.5 e `xhigh`
per i ref di valutazione OpenAI più vecchi che lo supportano. Sovrascrivi un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un
fallback globale, e la forma più vecchia `--model-thinking <provider/model=level>` è
mantenuta per compatibilità.
I ref candidati OpenAI usano per impostazione predefinita la modalità veloce, così viene usata l'elaborazione prioritaria dove
il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice richiede una sovrascrittura. Passa `--fast` solo quando vuoi
forzare la modalità veloce per ogni modello candidato. Le durate di candidati e giudici sono
registrate nel report per l'analisi benchmark, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita la concorrenza 16. Riduci
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul Gateway
locale rendono un'esecuzione troppo rumorosa.
Quando non viene passato nessun `--model` candidato, la valutazione del carattere usa per impostazione predefinita
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato nessun `--model`.
Quando non viene passato nessun `--judge-model`, i giudici predefiniti sono
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documenti correlati

- [QA Matrix](/it/concepts/qa-matrix)
- [Canale QA](/it/channels/qa-channel)
- [Testing](/it/help/testing)
- [Dashboard](/it/web/dashboard)
