---
read_when:
    - Comprendere come si integra lo stack QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiunta di scenari QA basati sul repository
    - Creazione di automazione QA più realistica per la dashboard del Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari basati sul repository, percorsi di trasporto in tempo reale, adattatori di trasporto e reportistica.'
title: Panoramica della QA
x-i18n:
    generated_at: "2026-05-07T13:15:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9b767fff432112ff20cae738e40da45cdbf00a2431cb17c025e098b97eafa3e8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato è pensato per esercitare OpenClaw in un modo più realistico,
modellato sui canali, rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici per DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, futuri plugin runner: adattatori di trasporto live che
  guidano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed gestiti dal repository per l'attività iniziale e gli scenari
  QA di baseline.
- [Mantis](/it/concepts/mantis): verifica live prima e dopo per bug che
  richiedono trasporti reali, screenshot del browser, stato della VM ed evidenze PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno alias di script `pnpm qa:*`;
entrambe le forme sono supportate.

| Comando                                             | Scopo                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Self-check QA integrato; scrive un report Markdown.                                                                                                                                                                                                                     |
| `qa suite`                                          | Esegue scenari gestiti dal repository contro la lane del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                                                                                                    |
| `qa coverage`                                       | Stampa l'inventario markdown della copertura degli scenari (`--json` per output leggibile dalle macchine).                                                                                                                                                              |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentica.                                                                                                                                                                                        |
| `qa character-eval`                                 | Esegue lo scenario QA del personaggio su più modelli live con un report giudicato. Vedi [Reportistica](#reporting).                                                                                                                                                     |
| `qa manual`                                         | Esegue un prompt una tantum contro la lane del provider/modello selezionato.                                                                                                                                                                                             |
| `qa ui`                                             | Avvia la UI di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Crea l'immagine Docker QA preconfezionata.                                                                                                                                                                                                                              |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + lane del Gateway.                                                                                                                                                                                               |
| `qa up`                                             | Crea il sito QA, avvia lo stack supportato da Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                       |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole degli scenari.                                                                                                                                                                                                   |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool condiviso di credenziali Convex.                                                                                                                                                                                                                       |
| `qa matrix`                                         | Lane di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [QA Matrix](/it/concepts/qa-matrix).                                                                                                                                                                 |
| `qa telegram`                                       | Lane di trasporto live contro un gruppo Telegram privato reale.                                                                                                                                                                                                         |
| `qa discord`                                        | Lane di trasporto live contro un canale guild Discord privato reale.                                                                                                                                                                                                    |
| `qa slack`                                          | Lane di trasporto live contro un canale Slack privato reale.                                                                                                                                                                                                            |
| `qa mantis`                                         | Runner di verifica prima e dopo per bug di trasporto live, con evidenze di reazioni di stato Discord, smoke del desktop/browser Crabbox e smoke Slack in VNC. Vedi [Mantis](/it/concepts/mantis) e [Runbook desktop Slack Mantis](/it/concepts/mantis-slack-desktop-runbook). |

## Flusso operatore

L'attuale flusso operatore QA è un sito QA a due riquadri:

- Sinistra: dashboard del Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo crea il sito QA, avvia la lane del Gateway supportata da Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può assegnare all'agente una
missione QA, osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o
cosa è rimasto bloccato.

Per un'iterazione più rapida della UI di QA Lab senza ricreare ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricrea quel bundle quando cambia, e il browser si ricarica automaticamente quando cambia l'hash degli asset di QA Lab.

Per uno smoke locale delle trace OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Questo script avvia un ricevitore trace OTLP/HTTP locale, esegue lo scenario QA
`otel-trace-smoke` con il plugin `diagnostics-otel` abilitato, quindi
decodifica gli span protobuf esportati e verifica la forma critica per la release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devono essere presenti;
le chiamate al modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e gli
attributi `openclaw.content.*` devono rimanere fuori dalla trace. Scrive
`otel-smoke-summary.json` accanto agli artefatti della suite QA.

La QA di osservabilità resta solo per checkout del sorgente. Il tarball npm omette intenzionalmente
QA Lab, quindi le lane di release Docker del pacchetto non eseguono comandi `qa`. Usa
`pnpm qa:otel:smoke` da un checkout del sorgente compilato quando modifichi la strumentazione
diagnostica.

Per una lane smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo di profili/scenari, le variabili d'ambiente e il layout degli artefatti per questa lane si trovano in [QA Matrix](/it/concepts/qa-matrix). In breve: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/observer, esegue il plugin Matrix reale dentro un Gateway QA figlio limitato a quel trasporto (senza `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artefatto degli eventi osservati e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Gli scenari coprono comportamenti di trasporto che i test unitari non possono dimostrare end to end: gating delle menzioni, policy allow-bot, allowlist, risposte di primo livello e in thread, routing DM, gestione delle reazioni, soppressione delle modifiche in ingresso, deduplicazione del replay al riavvio, recupero dall'interruzione dell'homeserver, recapito dei metadati di approvazione, gestione dei media e flussi di bootstrap/recupero/verifica Matrix E2EE. Il profilo CLI E2EE esegue anche `openclaw matrix encryption setup` e i comandi di verifica attraverso lo stesso homeserver usa e getta prima di controllare le risposte del Gateway.

Discord ha anche scenari Mantis-only opt-in per la riproduzione dei bug. Usa
`--scenario discord-status-reactions-tool-only` per la timeline esplicita delle reazioni di stato,
oppure `--scenario discord-thread-reply-filepath-attachment` per creare un
thread Discord reale e verificare che `message.thread-reply` preservi un
allegato `filePath`. Questi scenari restano fuori dalla lane Discord live predefinita
perché sono sonde di riproduzione prima/dopo, non copertura smoke ampia.
Il workflow Mantis per gli allegati nei thread può anche aggiungere un video testimone Discord Web
con accesso effettuato quando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` è configurato nell'ambiente QA.
Quel profilo viewer serve solo per la cattura visiva; la decisione pass/fail
arriva comunque dall'oracolo REST di Discord.

La CI usa la stessa superficie di comando in `.github/workflows/qa-live-transports-convex.yml`. Le esecuzioni pianificate e manuali predefinite eseguono il profilo Matrix veloce con credenziali frontier live, `--fast` e `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Il `matrix_profile=all` manuale viene distribuito nei cinque shard di profilo così che il catalogo esaustivo possa essere eseguito in parallelo mantenendo una directory di artefatti per shard.

Per le lane smoke Telegram, Discord e Slack con trasporto reale:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Hanno come target un canale reale preesistente con due bot (driver + SUT). Variabili d'ambiente richieste, elenchi di scenari, artefatti di output e il pool di credenziali Convex sono documentati nel [riferimento QA per Telegram, Discord e Slack](#telegram-discord-and-slack-qa-reference) qui sotto.

Per un'esecuzione completa della VM desktop Slack con recupero VNC, esegui:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Quel comando prende in lease una macchina desktop/browser Crabbox, esegue la lane live Slack
all'interno della VM, apre Slack Web nel browser VNC, acquisisce il desktop e
copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`,
quando l'acquisizione video e disponibile, nella directory degli artefatti Mantis. I lease
desktop/browser Crabbox forniscono in anticipo gli strumenti di acquisizione e i pacchetti
helper per browser/build nativa, quindi lo scenario dovrebbe installare fallback solo sui
lease piu vecchi. Mantis riporta i tempi totali e per fase in
`mantis-slack-desktop-smoke-report.md`, cosi le esecuzioni lente mostrano se il tempo e stato speso in
warmup del lease, acquisizione delle credenziali, configurazione remota o copia degli artefatti. Riusa
`--lease-id <cbx_...>` dopo aver effettuato manualmente l'accesso a Slack Web tramite VNC;
i lease riutilizzati mantengono calda anche la cache dello store pnpm di Crabbox. Il valore predefinito
`--hydrate-mode source` verifica da un checkout sorgente ed esegue install/build
all'interno della VM. Usa `--hydrate-mode prehydrated` solo quando il workspace remoto riutilizzato
ha gia `node_modules` e un `dist/` compilato; quella modalita salta il costoso passaggio
install/build e fallisce in modo chiuso quando il workspace non e pronto.
Con `--gateway-setup`, Mantis lascia in esecuzione dentro la VM un Gateway Slack OpenClaw
persistente sulla porta `38973`; senza questa opzione, il comando esegue la normale
lane QA Slack bot-to-bot ed esce dopo l'acquisizione degli artefatti.

La checklist dell'operatore, il comando di dispatch del workflow GitHub, il contratto del commento
di evidenza, la tabella decisionale di hydrate-mode, l'interpretazione dei tempi e i passaggi di
gestione degli errori si trovano in [Manuale operativo desktop Slack Mantis](/it/concepts/mantis-slack-desktop-runbook).

Per un'attivita desktop in stile agente/CV, esegui:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` prende in lease o riusa una macchina desktop/browser Crabbox, avvia
`crabbox record --while`, controlla il browser visibile tramite un
`visual-driver` annidato, acquisisce `visual-task.png`, esegue `openclaw infer image describe`
sullo screenshot quando e selezionato `--vision-mode image-describe` e
scrive `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e `mantis-visual-task-report.md`.
Quando `--expect-text` e impostato, il prompt di visione richiede un verdetto JSON
strutturato e passa solo quando il modello segnala prove visibili positive; una
risposta negativa che si limita a citare il testo target fallisce l'asserzione.
Usa `--vision-mode metadata` per uno smoke senza modello che dimostra il funzionamento di desktop,
browser, screenshot e infrastruttura video senza chiamare un provider di comprensione
delle immagini. La registrazione e un artefatto obbligatorio per `visual-task`; se Crabbox non registra
alcun `visual-task.mp4` non vuoto, l'attivita fallisce anche quando il visual driver
e passato. In caso di errore, Mantis mantiene il lease per VNC a meno che l'attivita non fosse gia
passata e `--keep-lease` non fosse impostato.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'env del broker Convex, convalida le impostazioni degli endpoint e verifica la raggiungibilita admin/list quando il segreto del maintainer e presente. Riporta solo lo stato impostato/mancante per i segreti.

## Copertura del trasporto live

Le lane di trasporto live condividono un unico contratto invece di inventare ciascuna la propria forma di elenco scenari. `qa-channel` e la suite ampia di comportamento prodotto sintetico e non fa parte della matrice di copertura del trasporto live.

| Lane     | Canary | Gating delle menzioni | Bot-to-bot | Blocco allowlist | Risposta di livello superiore | Ripresa dopo riavvio | Follow-up nel thread | Isolamento del thread | Osservazione delle reazioni | Comando help | Registrazione comando nativo |
| -------- | ------ | --------------------- | ---------- | ---------------- | ----------------------------- | -------------------- | -------------------- | --------------------- | --------------------------- | ------------ | ---------------------------- |
| Matrix   | x      | x                     | x          | x                | x                             | x                    | x                    | x                     | x                           |              |                              |
| Telegram | x      | x                     | x          |                  |                               |                      |                      |                       |                             | x            |                              |
| Discord  | x      | x                     | x          |                  |                               |                      |                      |                       |                             |              | x                            |
| Slack    | x      | x                     | x          | x                | x                             | x                    | x                    | x                     |                             |              |                              |

Questo mantiene `qa-channel` come suite ampia di comportamento prodotto, mentre Matrix,
Telegram e i futuri trasporti live condividono un'unica checklist esplicita
del contratto di trasporto.

Per una lane VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, poi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riusa lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono per impostazione predefinita piu scenari selezionati in parallelo
con worker Gateway isolati. `qa-channel` usa come impostazione predefinita una concorrenza
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Il comando esce con codice diverso da zero quando qualsiasi scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, il percorso della configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repo cosi il guest
puo riscrivere attraverso il workspace montato.

## Riferimento QA per Telegram, Discord e Slack

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) per via del numero di scenari e del provisioning homeserver basato su Docker. Telegram, Discord e Slack sono piu piccoli - una manciata di scenari ciascuno, nessun sistema di profili, contro canali reali preesistenti - quindi il loro riferimento si trova qui.

### Flag CLI condivisi

Queste lane si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                                    | Descrizione                                                                                                              |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--scenario <id>`                     | -                                                              | Esegui solo questo scenario. Ripetibile.                                                                                 |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Dove vengono scritti report/riepilogo/messaggi osservati e il log di output. I percorsi relativi sono risolti rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Root del repository quando si invoca da una cwd neutra.                                                                  |
| `--sut-account <id>`                  | `sut`                                                          | ID account temporaneo all'interno della configurazione del Gateway QA.                                                   |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` o `live-frontier` (il legacy `live-openai` funziona ancora).                                               |
| `--model <ref>` / `--alt-model <ref>` | predefinito del provider                                       | Riferimenti del modello primario/alternativo.                                                                            |
| `--fast`                              | disattivato                                                    | Modalita rapida del provider dove supportata.                                                                            |
| `--credential-source <env\|convex>`   | `env`                                                          | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, altrimenti `maintainer`                            | Ruolo usato quando `--credential-source convex`.                                                                         |

Ogni lane esce con codice diverso da zero per qualsiasi scenario fallito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Ha come target un gruppo Telegram privato reale con due bot distinti (driver + SUT). Il bot SUT deve avere uno username Telegram; l'osservazione bot-to-bot funziona meglio quando entrambi i bot hanno **Modalita di comunicazione bot-to-bot** abilitata in `@BotFather`.

Env richiesto quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opzionale:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati (per impostazione predefinita redatti).

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
- `telegram-qa-observed-messages.json` - corpi redatti salvo `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Ha come target un canale guild Discord privato reale con due bot: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord in bundle. Verifica la gestione delle menzioni del canale, che il bot SUT abbia registrato il comando nativo `/help` con Discord e scenari di evidenza Mantis opt-in.

Env richiesto quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corrispondere all'id utente del bot SUT restituito da Discord (altrimenti la lane fallisce rapidamente).

Opzionale:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleziona il canale vocale/stage per `discord-voice-autojoin`; senza di esso, lo scenario seleziona il primo canale vocale/stage visibile per il bot SUT.

Scenari (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scenario vocale opzionale. Viene eseguito da solo, abilita `channels.discord.voice.autoJoin` e verifica che lo stato vocale Discord corrente del bot SUT sia il canale vocale/stage di destinazione. Le credenziali Convex Discord possono includere `voiceChannelId` opzionale; altrimenti il runner rileva il primo canale vocale/stage visibile nella guild.
- `discord-status-reactions-tool-only` - scenario Mantis opzionale. Viene eseguito da solo perché imposta il SUT su risposte di guild sempre attive e solo tramite strumenti con `messages.statusReactions.enabled=true`, poi acquisisce una timeline delle reazioni REST più artefatti visivi HTML/PNG. I report Mantis prima/dopo conservano anche gli artefatti MP4 forniti dallo scenario come `baseline.mp4` e `candidate.mp4`.

Esegui esplicitamente lo scenario di accesso automatico al canale vocale Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

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
- `discord-qa-observed-messages.json` - corpi redatti salvo `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando viene eseguito lo scenario delle reazioni di stato.

### QA Slack

```bash
pnpm openclaw qa slack
```

Punta a un canale Slack privato reale con due bot distinti: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Slack incluso.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opzionale:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati.

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
- `slack-qa-observed-messages.json` - corpi redatti salvo `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurare l'area di lavoro Slack

La corsia richiede due app Slack distinte in un'unica area di lavoro, più un canale di cui entrambi i bot sono membri:

- `channelId` - l'id `Cxxxxxxxxxx` di un canale a cui entrambi i bot sono stati invitati. Usa un canale dedicato; la corsia pubblica a ogni esecuzione.
- `driverBotToken` - token bot (`xoxb-...`) dell'app **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) dell'app **SUT**, che deve essere un'app Slack separata dal driver affinché il suo id utente bot sia distinto.
- `sutAppToken` - token a livello di app (`xapp-...`) dell'app SUT con `connections:write`, usato da Socket Mode affinché l'app SUT possa ricevere eventi.

Preferisci un'area di lavoro Slack dedicata alla QA rispetto al riutilizzo di un'area di lavoro di produzione.

Il manifest SUT qui sotto limita intenzionalmente l'installazione di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`) alle autorizzazioni e agli eventi coperti dalla suite QA live di Slack. Per la configurazione del canale di produzione vista dagli utenti, consulta [Configurazione rapida del canale Slack](/it/channels/slack#quick-setup); la coppia QA Driver/SUT è intenzionalmente separata perché la corsia richiede due id utente bot distinti in un'unica area di lavoro.

**1. Crea l'app Driver**

Vai a [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → scegli l'area di lavoro QA, incolla il manifest seguente, poi _Install to Workspace_:

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

Copia il _Bot User OAuth Token_ (`xoxb-...`) - diventa `driverBotToken`. Il driver deve solo pubblicare messaggi e identificarsi; niente eventi, niente Socket Mode.

**2. Crea l'app SUT**

Ripeti _Create New App → From a manifest_ nella stessa area di lavoro. Questa app QA usa intenzionalmente una versione più limitata del manifest di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`): gli ambiti e gli eventi delle reazioni sono omessi perché la suite QA live di Slack non copre ancora la gestione delle reazioni.

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

Dopo che Slack ha creato l'app, esegui due azioni nella relativa pagina delle impostazioni:

- _Install to Workspace_ → copia il _Bot User OAuth Token_ → diventa `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → aggiungi l'ambito `connections:write` → salva → copia il valore `xapp-...` → diventa `sutAppToken`.

Verifica che i due bot abbiano id utente distinti chiamando `auth.test` su ciascun token. Il runtime distingue driver e SUT tramite l'id utente; riutilizzare un'unica app per entrambi farà fallire subito il gating delle menzioni.

**3. Crea il canale**

Nell'area di lavoro QA, crea un canale (ad esempio `#openclaw-qa`) e invita entrambi i bot dall'interno del canale:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia l'id `Cxxxxxxxxxx` da _channel info → About → Channel ID_ - diventa `channelId`. Un canale pubblico funziona; se usi un canale privato, entrambe le app hanno già `groups:history`, quindi le letture della cronologia dell'harness riusciranno comunque.

**4. Registra le credenziali**

Due opzioni. Usa variabili env per il debug su una singola macchina (imposta le quattro variabili `OPENCLAW_QA_SLACK_*` e passa `--credential-source env`), oppure inizializza il pool Convex condiviso in modo che CI e altri maintainer possano prenderle in lease.

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

**5. Verifica end to end**

Esegui la corsia localmente per confermare che entrambi i bot possano comunicare tra loro tramite il broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Un'esecuzione verde si completa ben sotto i 30 secondi e `slack-qa-report.md` mostra sia `slack-canary` sia `slack-mention-gating` con stato `pass`. Se la corsia resta bloccata per circa 90 secondi ed esce con `Convex credential pool exhausted for kind "slack"`, il pool è vuoto oppure ogni riga è in lease - `qa credentials list --kind slack --status all --json` ti dirà quale dei due casi.

### Pool di credenziali Convex

Le corsie Telegram, Discord e Slack possono prendere in lease le credenziali da un pool Convex condiviso invece di leggere le variabili env sopra. Passa `--credential-source convex` (oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, invia Heartbeat per la durata dell'esecuzione e lo rilascia allo spegnimento. I tipi del pool sono `"telegram"`, `"discord"` e `"slack"`.

Forme del payload che il broker valida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` deve essere una stringa chat-id numerica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Slack (`kind: "slack"`): `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }` - `channelId` deve corrispondere a `^[A-Z][A-Z0-9]+$` (un id Slack come `Cxxxxxxxxxx`). Consulta [Configurare l'area di lavoro Slack](#setting-up-the-slack-workspace) per il provisioning di app e ambiti.

Le variabili env operative e il contratto dell'endpoint del broker Convex si trovano in [Test → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il supporto Discord; la semantica del broker è identica per entrambi i tipi).

## Seed basati sul repo

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git affinché il piano QA sia visibile sia agli esseri umani sia all'agent.

`qa-lab` dovrebbe restare un runner markdown generico. Ogni file markdown di scenario è la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- metadati opzionali di categoria, capability, corsia e rischio
- riferimenti a documentazione e codice
- requisiti opzionali del Plugin
- patch opzionale alla configurazione del Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può restare generica e trasversale. Per esempio, gli scenari markdown possono combinare helper lato trasporto con helper lato browser che controllano la Control UI incorporata tramite il seam `browser.request` del Gateway senza aggiungere un runner speciale.

I file di scenario dovrebbero essere raggruppati per capability di prodotto anziché per cartella dell'albero sorgente. Mantieni stabili gli ID degli scenari quando i file vengono spostati; usa `docsRefs` e `codeRefs` per la tracciabilità dell'implementazione.

L'elenco baseline dovrebbe restare abbastanza ampio da coprire:

- chat in DM e canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio di modello
- handoff al subagent
- lettura del repo e lettura della documentazione
- un piccolo task di build come Lobster Invaders

## Corsie mock dei provider

`qa suite` ha due corsie mock di provider locali:

- `mock-openai` è il mock OpenClaw consapevole dello scenario. Rimane la corsia mock deterministica predefinita per QA basata sul repo e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo, fixture, registrazione/riproduzione e caos. È additivo e non sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle corsie provider si trova sotto `extensions/qa-lab/src/providers/`. Ogni provider possiede i propri default, l'avvio del server locale, la configurazione del modello Gateway, le esigenze di staging degli auth-profile e i flag di capability live/mock. Il codice della suite condivisa e del Gateway dovrebbe passare attraverso il registro dei provider invece di diramare sui nomi dei provider.

## Adapter di trasporto

`qa-lab` possiede un seam di trasporto generico per scenari QA in markdown. `qa-channel` è il primo adapter su quel seam, ma l'obiettivo progettuale è più ampio: i futuri canali reali o sintetici dovrebbero collegarsi allo stesso runner della suite invece di aggiungere un runner QA specifico per il trasporto.

A livello di architettura, la suddivisione è:

- `qa-lab` possiede l'esecuzione generica degli scenari, la concorrenza dei worker, la scrittura degli artifact e la reportistica.
- L'adapter di trasporto possiede la configurazione del Gateway, la readiness, l'osservazione inbound e outbound, le azioni di trasporto e lo stato di trasporto normalizzato.
- I file scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiunta di un canale

Aggiungere un canale al sistema QA Markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che esercita il contratto del canale.

Non aggiungere una nuova radice di comando QA di primo livello quando l'host condiviso `qa-lab` può possedere il flusso.

`qa-lab` possiede la meccanica dell'host condiviso:

- la radice di comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artifact
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per gli scenari `qa-channel` meno recenti

I Plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la radice `qa` condivisa
- come il Gateway viene configurato per quel trasporto
- come viene verificata la readiness
- come vengono iniettati gli eventi inbound
- come vengono osservati i messaggi outbound
- come vengono esposti trascrizioni e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifica del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della radice `qa` condivisa.
2. Implementa il runner di trasporto sul seam dell'host `qa-lab` condiviso.
3. Mantieni la meccanica specifica del trasporto dentro il Plugin runner o l'harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando radice concorrente. I Plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni `runtime-api.ts` leggero; la CLI lazy e l'esecuzione del runner devono restare dietro entrypoint separati.
5. Crea o adatta scenari Markdown sotto le directory tematiche `qa/scenarios/`.
6. Usa gli helper di scenario generici per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, a meno che il repo stia eseguendo una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se il comportamento può essere espresso una volta in `qa-lab`, inseriscilo in `qa-lab`.
- Se il comportamento dipende da un trasporto di canale, mantienilo in quel Plugin runner o nell'harness del Plugin.
- Se uno scenario richiede una nuova capacità utilizzabile da più di un canale, aggiungi un helper generico invece di un branch specifico del canale in `suite.ts`.
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

Gli alias di compatibilità restano disponibili per gli scenari esistenti - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ma la creazione di nuovi scenari dovrebbe usare i nomi generici. Gli alias esistono per evitare una migrazione in un unico momento, non come modello futuro.

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservata.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili - utile quando si dimensiona il lavoro di follow-up o si collega un nuovo trasporto - esegui `pnpm openclaw qa coverage` (aggiungi `--json` per un output leggibile dalla macchina).

Per i controlli su carattere e stile, esegui lo stesso scenario su più refs di modelli live e scrivi un report Markdown giudicato:

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

Il comando esegue processi figli del Gateway QA locale, non Docker. Gli scenari di valutazione del carattere dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente come chat, aiuto nell'area di lavoro e piccoli task sui file. Al modello candidato non dovrebbe essere detto che è in fase di valutazione. Il comando conserva ogni trascrizione completa, registra statistiche di base dell'esecuzione, quindi chiede ai modelli giudici in modalità fast con ragionamento `xhigh` dove supportato di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque ogni trascrizione e stato di esecuzione, ma i refs candidati vengono sostituiti con etichette neutrali come `candidate-01`; il report mappa le classifiche ai refs reali dopo il parsing.
Le esecuzioni candidate usano per impostazione predefinita il thinking `high`, con `medium` per GPT-5.5 e `xhigh` per i refs di valutazione OpenAI più vecchi che lo supportano. Sovrascrivi un candidato specifico inline con `--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un fallback globale, e la forma precedente `--model-thinking <provider/model=level>` viene mantenuta per compatibilità.
I refs candidati OpenAI usano per impostazione predefinita la modalità fast, così viene usata l'elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un singolo candidato o giudice necessita di una sovrascrittura. Passa `--fast` solo quando vuoi forzare la modalità fast per ogni modello candidato. Le durate di candidati e giudici vengono registrate nel report per l'analisi dei benchmark, ma i prompt dei giudici dicono esplicitamente di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita concorrenza 16. Riduci `--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul Gateway locale rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun `--model` candidato, la valutazione del carattere usa per impostazione predefinita `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`, `moonshot/kimi-k2.5` e `google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita `openai/gpt-5.5,thinking=xhigh,fast` e `anthropic/claude-opus-4-6,thinking=high`.

## Documenti correlati

- [QA matrice](/it/concepts/qa-matrix)
- [Canale QA](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Dashboard](/it/web/dashboard)
