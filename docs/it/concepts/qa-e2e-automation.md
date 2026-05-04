---
read_when:
    - Comprendere come si integra lo stack QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiunta di scenari QA basati sul repository
    - Creazione di automazione QA a maggiore realismo attorno alla dashboard del Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari basati sul repository, corsie di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica QA
x-i18n:
    generated_at: "2026-05-04T07:05:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato serve a esercitare OpenClaw in modo più realistico e
orientato ai canali rispetto a quanto possa fare un singolo unit test.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici per DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, futuri plugin runner: adattatori di trasporto live che
  guidano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed basati sul repository per il task di avvio e gli scenari QA
  di base.
- [Mantis](/it/concepts/mantis): verifica live prima e dopo per bug che
  richiedono trasporti reali, screenshot del browser, stato della VM ed evidenze PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno alias di script `pnpm qa:*`;
sono supportate entrambe le forme.

| Comando                                             | Scopo                                                                                                                                                                                      |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Self-check QA incluso; scrive un report Markdown.                                                                                                                                             |
| `qa suite`                                          | Esegue scenari basati sul repository contro la lane del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                                       |
| `qa coverage`                                       | Stampa l'inventario markdown della copertura degli scenari (`--json` per output macchina).                                                                                                                |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentico.                                                                                                               |
| `qa character-eval`                                 | Esegue lo scenario QA del personaggio su più modelli live con un report giudicato. Vedi [Reporting](#reporting).                                                                                 |
| `qa manual`                                         | Esegue un prompt una tantum contro la lane provider/modello selezionata.                                                                                                                               |
| `qa ui`                                             | Avvia la UI di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                                         |
| `qa docker-build-image`                             | Crea l'immagine Docker QA precotta.                                                                                                                                                          |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + lane Gateway.                                                                                                                         |
| `qa up`                                             | Crea il sito QA, avvia lo stack basato su Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                       |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                                       |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole degli scenari.                                                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool condiviso di credenziali Convex.                                                                                                                                                    |
| `qa matrix`                                         | Lane di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [Matrix QA](/it/concepts/qa-matrix).                                                                                           |
| `qa telegram`                                       | Lane di trasporto live contro un gruppo Telegram privato reale.                                                                                                                                   |
| `qa discord`                                        | Lane di trasporto live contro un canale guild Discord privato reale.                                                                                                                            |
| `qa slack`                                          | Lane di trasporto live contro un canale Slack privato reale.                                                                                                                                    |
| `qa mantis`                                         | Runner di verifica prima e dopo per bug di trasporto live, con evidenze di reazioni di stato Discord, smoke desktop/browser Crabbox e smoke Slack-in-VNC. Vedi [Mantis](/it/concepts/mantis). |

## Flusso operatore

L'attuale flusso operatore QA è un sito QA a due pannelli:

- Sinistra: dashboard Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo crea il sito QA, avvia la lane Gateway basata su Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può assegnare all'agente
una missione QA, osservare il comportamento reale del canale e registrare cosa ha funzionato, cosa è fallito o cosa
è rimasto bloccato.

Per un'iterazione più rapida della UI QA Lab senza ricreare ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precostruita e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricostruisce quel bundle a ogni modifica, e il browser si ricarica automaticamente quando l'hash degli asset di QA Lab
cambia.

Per uno smoke locale della traccia OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Questo script avvia un ricevitore locale di tracce OTLP/HTTP, esegue lo
scenario QA `otel-trace-smoke` con il Plugin `diagnostics-otel` abilitato, quindi
decodifica gli span protobuf esportati e verifica la forma critica per la release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devono essere presenti;
le chiamate al modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono restare fuori dalla traccia. Scrive
`otel-smoke-summary.json` accanto agli artefatti della suite QA.

La QA dell'osservabilità resta disponibile solo da checkout dei sorgenti. Il tarball npm omette intenzionalmente
QA Lab, quindi le lane di release Docker del pacchetto non eseguono comandi `qa`. Usa
`pnpm qa:otel:smoke` da un checkout dei sorgenti già compilato quando modifichi la strumentazione
diagnostica.

Per una lane smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo profili/scenari, le variabili d'ambiente e il layout degli artefatti per questa lane si trovano in [Matrix QA](/it/concepts/qa-matrix). In sintesi: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/observer, esegue il Plugin Matrix reale dentro un Gateway QA figlio con ambito limitato a quel trasporto (senza `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artefatto di eventi osservati e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Per lane smoke Telegram, Discord e Slack con trasporto reale:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Prendono di mira un canale reale preesistente con due bot (driver + SUT). Le variabili d'ambiente richieste, gli elenchi di scenari, gli artefatti di output e il pool di credenziali Convex sono documentati nel [riferimento QA per Telegram, Discord e Slack](#telegram-discord-and-slack-qa-reference) sotto.

Per un'esecuzione completa su VM desktop Slack con recupero VNC, esegui:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Questo comando prende in lease una macchina desktop/browser Crabbox, esegue la lane live Slack
dentro la VM, apre Slack Web nel browser VNC, cattura il desktop e
copia `slack-qa/` più `slack-desktop-smoke.png` nella directory degli artefatti Mantis.
Riutilizza `--lease-id <cbx_...>` dopo aver effettuato manualmente l'accesso a Slack Web
tramite VNC. Con `--gateway-setup`, Mantis lascia un Gateway Slack OpenClaw
persistente in esecuzione dentro la VM sulla porta `38973`; senza di esso, il comando esegue la
normale lane QA Slack bot-to-bot ed esce dopo la cattura degli artefatti.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'ambiente del broker Convex, valida le impostazioni degli endpoint e verifica la raggiungibilità admin/list quando il secret maintainer è presente. Riporta solo lo stato impostato/mancante per i secret.

## Copertura dei trasporti live

Le lane di trasporto live condividono un unico contratto invece di inventare ciascuna una propria forma di elenco scenari. `qa-channel` è l'ampia suite sintetica di comportamento prodotto e non fa parte della matrice di copertura dei trasporti live.

| Lane     | Canary | Gating menzioni | Bot-to-bot | Blocco allowlist | Risposta di primo livello | Ripresa al riavvio | Follow-up thread | Isolamento thread | Osservazione reazioni | Comando help | Registrazione comando nativo |
| -------- | ------ | --------------- | ---------- | ---------------- | ------------------------- | ------------------ | ---------------- | ----------------- | --------------------- | ------------ | ---------------------------- |
| Matrix   | x      | x               | x          | x                | x                         | x                  | x                | x                 | x                     |              |                              |
| Telegram | x      | x               | x          |                  |                           |                    |                  |                   |                       | x            |                              |
| Discord  | x      | x               | x          |                  |                           |                    |                  |                   |                       |              | x                            |
| Slack    | x      | x               | x          |                  |                           |                    |                  |                   |                       |              |                              |

Questo mantiene `qa-channel` come ampia suite di comportamento prodotto, mentre Matrix,
Telegram e i futuri trasporti live condividono un'unica checklist esplicita del contratto di trasporto.

Per una lane VM Linux usa e getta senza portare Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono in parallelo più scenari selezionati
con worker Gateway isolati per impostazione predefinita. `qa-channel` usa come predefinita una concorrenza
di 4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi ottenere gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, percorso della configurazione provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la radice del repository in modo che il guest
possa riscrivere attraverso il workspace montato.

## Riferimento QA per Telegram, Discord e Slack

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) per il numero di scenari e il provisioning dell'homeserver supportato da Docker. Telegram, Discord e Slack sono più piccoli — pochi scenari ciascuno, nessun sistema di profili, contro canali reali preesistenti — quindi il loro riferimento vive qui.

### Flag CLI condivisi

Queste corsie si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                                   | Descrizione                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                             | Esegue solo questo scenario. Ripetibile.                                                                                |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Dove vengono scritti report/riepilogo/messaggi osservati e il log di output. I percorsi relativi sono risolti rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                               | Radice del repository quando si invoca da una cwd neutra.                                                               |
| `--sut-account <id>`                  | `sut`                                                         | ID account temporaneo nella configurazione del Gateway QA.                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                               | `mock-openai` o `live-frontier` (`live-openai` legacy funziona ancora).                                                 |
| `--model <ref>` / `--alt-model <ref>` | predefinito del provider                                      | Riferimenti modello primario/alternativo.                                                                               |
| `--fast`                              | disattivato                                                   | Modalità veloce del provider dove supportata.                                                                           |
| `--credential-source <env\|convex>`   | `env`                                                         | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                             |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, altrimenti `maintainer`                           | Ruolo usato quando `--credential-source convex`.                                                                        |

Ogni corsia termina con codice diverso da zero per qualunque scenario non riuscito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Prende di mira un gruppo Telegram privato reale con due bot distinti (driver + SUT). Il bot SUT deve avere un nome utente Telegram; l'osservazione bot-a-bot funziona al meglio quando entrambi i bot hanno **Bot-to-Bot Communication Mode** abilitata in `@BotFather`.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opzionale:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati (il valore predefinito li oscura).

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
- `telegram-qa-summary.json` — include RTT per risposta (invio driver → risposta SUT osservata) a partire dal canary.
- `telegram-qa-observed-messages.json` — corpi oscurati salvo `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Prende di mira un canale di guild Discord privato reale con due bot: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord incluso. Verifica la gestione delle menzioni nel canale, che il bot SUT abbia registrato il comando nativo `/help` con Discord e scenari di evidenza Mantis opt-in.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — deve corrispondere all'ID utente del bot SUT restituito da Discord (altrimenti la corsia fallisce rapidamente).

Opzionale:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati.

Scenari (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — scenario Mantis opt-in. Viene eseguito da solo perché passa il SUT a risposte di guild sempre attive e solo tool con `messages.statusReactions.enabled=true`, quindi acquisisce una timeline di reazioni REST più un artefatto visivo HTML/PNG.

Esegui esplicitamente lo scenario di reazione di stato Mantis:

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
- `discord-qa-observed-messages.json` — corpi oscurati salvo `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando viene eseguito lo scenario di reazione di stato.

### QA Slack

```bash
pnpm openclaw qa slack
```

Prende di mira un canale Slack privato reale con due bot distinti: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Slack incluso.

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

Artefatti di output:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — corpi oscurati salvo `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Pool di credenziali Convex

Le corsie Telegram, Discord e Slack possono prendere in leasing credenziali da un pool Convex condiviso invece di leggere le env var sopra. Passa `--credential-source convex` (o imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, lo mantiene in Heartbeat per tutta la durata dell'esecuzione e lo rilascia allo shutdown. I tipi del pool sono `"telegram"`, `"discord"` e `"slack"`.

Forme del payload che il broker valida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve essere una stringa chat-id numerica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Le env var operative e il contratto dell'endpoint broker Convex vivono in [Testing → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il supporto Discord; la semantica del broker è identica per entrambi i tipi).

## Seed supportati dal repository

Gli asset seed vivono in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git in modo che il piano QA sia visibile sia agli esseri umani sia
all'agente.

`qa-lab` dovrebbe rimanere un runner markdown generico. Ogni file markdown di scenario è
la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- metadati opzionali di categoria, capability, corsia e rischio
- riferimenti a documentazione e codice
- requisiti Plugin opzionali
- patch opzionale della configurazione Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può rimanere generica
e trasversale. Ad esempio, gli scenari markdown possono combinare helper lato trasporto
con helper lato browser che pilotano la Control UI incorporata attraverso il
seam `browser.request` del Gateway senza aggiungere un runner speciale.

I file scenario dovrebbero essere raggruppati per capability del prodotto anziché per cartella
dell'albero sorgente. Mantieni stabili gli ID scenario quando i file si spostano; usa `docsRefs` e `codeRefs`
per la tracciabilità dell'implementazione.

L'elenco di baseline dovrebbe rimanere abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback cron
- richiamo della memoria
- cambio modello
- handoff al subagent
- lettura del repository e della documentazione
- un piccolo task di build come Lobster Invaders

## Corsie mock dei provider

`qa suite` ha due corsie mock provider locali:

- `mock-openai` è il mock OpenClaw consapevole degli scenari. Rimane la corsia mock
  deterministica predefinita per la QA supportata dal repository e i gate di parità.
- `aimock` avvia un server provider supportato da AIMock per copertura sperimentale di protocollo,
  fixture, registrazione/riproduzione e chaos. È additivo e non
  sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle corsie provider vive sotto `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, avvio del server locale, configurazione modello del Gateway,
necessità di staging degli auth-profile e flag di capability live/mock. Il codice condiviso della suite e del
Gateway dovrebbe instradare attraverso il registry dei provider invece di diramarsi sui
nomi dei provider.

## Adattatori di trasporto

`qa-lab` possiede un seam di trasporto generico per gli scenari QA markdown. `qa-channel` è il primo adattatore su quel seam, ma l'obiettivo di design è più ampio: canali futuri reali o sintetici dovrebbero collegarsi allo stesso runner della suite invece di aggiungere un runner QA specifico per trasporto.

A livello di architettura, la divisione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza dei worker, scrittura degli artefatti e reportistica.
- L'adattatore di trasporto possiede configurazione Gateway, readiness, osservazione inbound e outbound, azioni di trasporto e stato di trasporto normalizzato.
- I file scenario markdown sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiungere un canale

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adattatore di trasporto per il canale.
2. Un pacchetto di scenari che esercita il contratto del canale.

Non aggiungere una nuova radice di comando QA di primo livello quando l'host condiviso `qa-lab` può possedere il flusso.

`qa-lab` possiede i meccanismi host condivisi:

- la radice del comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per scenari `qa-channel` precedenti

I plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la radice `qa` condivisa
- come il Gateway viene configurato per quel trasporto
- come viene controllata la prontezza
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposti trascrizioni e stato normalizzato del trasporto
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifica del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della radice `qa` condivisa.
2. Implementa il runner di trasporto sul seam host condiviso di `qa-lab`.
3. Mantieni i meccanismi specifici del trasporto all'interno del plugin runner o dell'harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando radice concorrente. I plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni `runtime-api.ts` leggero; CLI lazy ed esecuzione del runner devono restare dietro entrypoint separati.
5. Crea o adatta scenari Markdown nelle directory tematiche `qa/scenarios/`.
6. Usa gli helper di scenario generici per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, a meno che il repository stia eseguendo una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un trasporto di canale, mantienilo in quel plugin runner o nell'harness del Plugin.
- Se uno scenario richiede una nuova funzionalità utilizzabile da più di un canale, aggiungi un helper generico invece di un ramo specifico del canale in `suite.ts`.
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

Gli alias di compatibilità restano disponibili per gli scenari esistenti — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ma la creazione di nuovi scenari dovrebbe usare i nomi generici. Gli alias esistono per evitare una migrazione flag-day, non come modello da seguire in futuro.

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservata.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili — utile quando si dimensiona il lavoro di follow-up o si collega un nuovo trasporto — esegui `pnpm openclaw qa coverage` (aggiungi `--json` per output leggibile da macchina).

Per i controlli su carattere e stile, esegui lo stesso scenario su più ref di modelli live
e scrivi un report Markdown giudicato:

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
dovrebbero impostare la persona tramite `SOUL.md`, poi eseguire normali turni utente
come chat, aiuto sul workspace e piccoli task sui file. Al modello candidato non dovrebbe
essere detto che è in fase di valutazione. Il comando conserva ogni trascrizione completa,
registra statistiche di base della run, poi chiede ai modelli giudice in modalità fast con
ragionamento `xhigh`, dove supportato, di classificare le run per naturalezza, atmosfera e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni trascrizione e stato della run, ma i ref candidati vengono sostituiti con etichette neutre
come `candidate-01`; il report rimappa le classifiche ai ref reali dopo il parsing.
Le run candidate usano per impostazione predefinita thinking `high`, con `medium` per GPT-5.5 e `xhigh`
per ref di valutazione OpenAI precedenti che lo supportano. Sovrascrivi un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un fallback
globale, e la forma precedente `--model-thinking <provider/model=level>` viene
mantenuta per compatibilità.
I ref candidati OpenAI usano per impostazione predefinita la modalità fast, così viene usata
l'elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice richiede una sovrascrittura. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate di candidati e giudici sono
registrate nel report per l'analisi dei benchmark, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le run dei modelli candidati e giudici usano entrambe per impostazione predefinita concorrenza 16. Abbassa
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul Gateway
locale rendono una run troppo rumorosa.
Quando non viene passato alcun candidato `--model`, la valutazione del carattere usa per impostazione predefinita
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documenti correlati

- [QA matrice](/it/concepts/qa-matrix)
- [Canale QA](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Dashboard](/it/web/dashboard)
