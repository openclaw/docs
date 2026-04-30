---
read_when:
    - Comprendere come si articola lo stack di QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiungere scenari QA basati sul repository
    - Creazione di un’automazione QA più realistica attorno alla dashboard del Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari basati sul repository, lane di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica QA
x-i18n:
    generated_at: "2026-04-30T08:47:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato serve a esercitare OpenClaw in modo più realistico e
orientato ai canali rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggistica sintetico con superfici DM,
  canale, thread, reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, futuri Plugin runner: adattatori di trasporto live che
  pilotano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed basati sul repo per il task di avvio e gli scenari QA di
  baseline.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno
alias di script `pnpm qa:*`; entrambe le forme sono supportate.

| Comando                                             | Scopo                                                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Self-check QA incluso; scrive un report Markdown.                                                                                                                              |
| `qa suite`                                          | Esegue scenari basati sul repo contro la lane del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                  |
| `qa coverage`                                       | Stampa l'inventario Markdown della copertura degli scenari (`--json` per output macchina).                                                                                      |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report del gate di parità agentico.                                                                                      |
| `qa character-eval`                                 | Esegue lo scenario QA del personaggio su più modelli live con un report valutato. Vedi [Reportistica](#reporting).                                                              |
| `qa manual`                                         | Esegue un prompt una tantum contro la lane del provider/modello selezionato.                                                                                                    |
| `qa ui`                                             | Avvia la UI di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                           |
| `qa docker-build-image`                             | Costruisce l'immagine Docker QA preconfezionata.                                                                                                                               |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + lane del Gateway.                                                                                                      |
| `qa up`                                             | Costruisce il sito QA, avvia lo stack supportato da Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                          |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole degli scenari.                                                                                                         |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool condiviso di credenziali Convex.                                                                                                                              |
| `qa matrix`                                         | Lane di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [QA Matrix](/it/concepts/qa-matrix).                                                                        |
| `qa telegram`                                       | Lane di trasporto live contro un gruppo Telegram privato reale.                                                                                                                |
| `qa discord`                                        | Lane di trasporto live contro un canale guild Discord privato reale.                                                                                                           |

## Flusso operatore

L'attuale flusso operatore QA è un sito QA a due pannelli:

- Sinistra: dashboard Gateway (Control UI) con l'agente.
- Destra: QA Lab, con trascrizione in stile Slack e piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo costruisce il sito QA, avvia la lane del Gateway supportata da Docker ed
espone la pagina QA Lab, dove un operatore o un ciclo di automazione può dare
all'agente una missione QA, osservare il comportamento reale del canale e
registrare che cosa ha funzionato, fallito o è rimasto bloccato.

Per iterare più velocemente sulla UI di QA Lab senza ricostruire ogni volta
l'immagine Docker, avvia lo stack con un bundle QA Lab montato via bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta
via bind `extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricostruisce quel bundle a ogni modifica e il browser si ricarica
automaticamente quando cambia l'hash degli asset di QA Lab.

Per uno smoke locale di tracce OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Quello script avvia un ricevitore locale di tracce OTLP/HTTP, esegue lo
scenario QA `otel-trace-smoke` con il Plugin `diagnostics-otel` abilitato, poi
decodifica gli span protobuf esportati e verifica la forma critica per il
rilascio: devono essere presenti `openclaw.run`, `openclaw.harness.run`,
`openclaw.model.call`, `openclaw.context.assembled` e
`openclaw.message.delivery`; le chiamate al modello non devono esportare
`StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e gli attributi
`openclaw.content.*` devono restare fuori dalla traccia. Scrive
`otel-smoke-summary.json` accanto agli artefatti della suite QA.

La QA di osservabilità resta solo per checkout sorgente. Il tarball npm omette
intenzionalmente QA Lab, quindi le lane di rilascio Docker del pacchetto non
eseguono comandi `qa`. Usa `pnpm qa:otel:smoke` da un checkout sorgente
costruito quando modifichi la strumentazione diagnostica.

Per una lane smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo di profili/scenari, le variabili env e il layout degli artefatti per questa lane si trovano in [QA Matrix](/it/concepts/qa-matrix). In sintesi: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/observer, esegue il Plugin Matrix reale dentro un Gateway QA figlio limitato a quel trasporto (senza `qa-channel`), poi scrive un report Markdown, un riepilogo JSON, un artefatto di eventi osservati e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Per lane smoke Telegram e Discord con trasporto reale:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Entrambe mirano a un canale reale preesistente con due bot (driver + SUT). Le variabili env richieste, gli elenchi di scenari, gli artefatti di output e il pool di credenziali Convex sono documentati nel [riferimento QA Telegram e Discord](#telegram-and-discord-qa-reference) sotto.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'env del broker Convex, valida le impostazioni degli endpoint
e verifica la raggiungibilità admin/list quando è presente il segreto del
maintainer. Riporta solo lo stato impostato/mancante per i segreti.

## Copertura trasporto live

Le lane di trasporto live condividono un solo contratto invece di inventare
ciascuna la propria forma di elenco scenari. `qa-channel` è la suite sintetica
ampia del comportamento prodotto e non fa parte della matrice di copertura dei
trasporti live.

| Lane     | Canary | Gating menzioni | Bot-to-bot | Blocco allowlist | Risposta top-level | Ripresa dopo riavvio | Follow-up thread | Isolamento thread | Osservazione reazioni | Comando help | Registrazione comandi nativi |
| -------- | ------ | --------------- | ---------- | ---------------- | ------------------ | -------------------- | ---------------- | ----------------- | --------------------- | ------------ | ----------------------------- |
| Matrix   | x      | x               | x          | x                | x                  | x                    | x                | x                 | x                     |              |                               |
| Telegram | x      | x               | x          |                  |                    |                      |                  |                   |                       | x            |                               |
| Discord  | x      | x               | x          |                  |                    |                      |                  |                   |                       |              | x                             |

Questo mantiene `qa-channel` come suite ampia del comportamento prodotto,
mentre Matrix, Telegram e i futuri trasporti live condividono una checklist
esplicita del contratto di trasporto.

Per una lane VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass fresco, installa le dipendenze, costruisce
OpenClaw dentro il guest, esegue `qa suite`, poi copia il normale report QA e il
riepilogo dentro `.artifacts/qa-e2e/...` sull'host.
Riusa lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono per impostazione
predefinita più scenari selezionati in parallelo con worker Gateway isolati.
`qa-channel` usa come predefinita la concorrenza 4, limitata al numero di scenari
selezionati. Usa `--concurrency <count>` per regolare il numero di worker, oppure
`--concurrency 1` per l'esecuzione seriale.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa
`--allow-failures` quando vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono
pratici per il guest: chiavi provider basate su env, percorso della configurazione
del provider live QA e `CODEX_HOME` quando presente. Mantieni `--output-dir` sotto
la radice del repo, così il guest può riscrivere tramite il workspace montato.

## Riferimento QA Telegram e Discord

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) per il numero di scenari e il provisioning dell'homeserver supportato da Docker. Telegram e Discord sono più piccoli: una manciata di scenari ciascuno, nessun sistema di profili, contro canali reali preesistenti; quindi il loro riferimento vive qui.

### Flag CLI condivisi

Entrambe le lane si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                              | Descrizione                                                                                                                   |
| ------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Esegui solo questo scenario. Ripetibile.                                                                                     |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Percorso in cui vengono scritti report/riepilogo/messaggi osservati e log di output. I percorsi relativi sono risolti rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Root del repository quando l'invocazione avviene da una cwd neutra.                                                          |
| `--sut-account <id>`                  | `sut`                                                     | Id account temporaneo nella configurazione del Gateway QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` o `live-frontier` (il legacy `live-openai` funziona ancora).                                                   |
| `--model <ref>` / `--alt-model <ref>` | predefinito del provider                                  | Ref dei modelli primario/alternativo.                                                                                        |
| `--fast`                              | disattivato                                               | Modalità veloce del provider dove supportata.                                                                                |
| `--credential-source <env\|convex>`   | `env`                                                     | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                                  |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, `maintainer` altrimenti                       | Ruolo usato quando `--credential-source convex`.                                                                             |

Entrambi terminano con codice non zero per qualsiasi scenario non riuscito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Ha come target un vero gruppo Telegram privato con due bot distinti (driver + SUT). Il bot SUT deve avere un nome utente Telegram; l'osservazione bot-a-bot funziona meglio quando entrambi i bot hanno **Bot-to-Bot Communication Mode** abilitata in `@BotFather`.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opzionale:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserva i corpi dei messaggi negli artefatti dei messaggi osservati (per impostazione predefinita sono oscurati).

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
- `telegram-qa-summary.json` — include l'RTT per risposta (invio driver → risposta SUT osservata) a partire dal canary.
- `telegram-qa-observed-messages.json` — corpi oscurati a meno che `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Ha come target un vero canale di guild Discord privata con due bot: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord incluso. Verifica la gestione delle menzioni del canale e che il bot SUT abbia registrato il comando nativo `/help` con Discord.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — deve corrispondere all'id utente del bot SUT restituito da Discord (altrimenti la lane fallisce subito).

Opzionale:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva i corpi dei messaggi negli artefatti dei messaggi osservati.

Scenari (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Artefatti di output:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — corpi oscurati a meno che `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Pool di credenziali Convex

Le lane Telegram e Discord possono entrambe prendere in leasing credenziali da un pool Convex condiviso invece di leggere le env var sopra. Passa `--credential-source convex` (o imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, invia Heartbeat per tutta la durata dell'esecuzione e lo rilascia allo shutdown. I tipi di pool sono `"telegram"` e `"discord"`.

Forme dei payload che il broker valida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve essere una stringa chat-id numerica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Le env var operative e il contratto dell'endpoint del broker Convex sono in [Testing → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il supporto Discord; la semantica del broker è identica per entrambi i tipi).

## Seed basati sul repository

Gli asset seed sono in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git così il piano QA è visibile sia agli umani sia
all'agente.

`qa-lab` deve restare un runner Markdown generico. Ogni file Markdown di scenario è
la fonte di verità per una singola esecuzione di test e deve definire:

- metadati dello scenario
- metadati opzionali di categoria, capability, lane e rischio
- ref di documentazione e codice
- requisiti Plugin opzionali
- patch opzionale della configurazione Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può restare generica
e trasversale. Per esempio, gli scenari Markdown possono combinare helper lato
trasporto con helper lato browser che guidano la Control UI incorporata tramite la
seam Gateway `browser.request` senza aggiungere un runner per casi speciali.

I file di scenario devono essere raggruppati per capability di prodotto invece che per
cartella dell'albero sorgente. Mantieni stabili gli ID scenario quando i file si spostano; usa `docsRefs` e `codeRefs`
per la tracciabilità dell'implementazione.

L'elenco baseline deve restare abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback cron
- richiamo della memoria
- cambio modello
- handoff del sottoagente
- lettura del repository e della documentazione
- un piccolo task di build come Lobster Invaders

## Lane mock del provider

`qa suite` ha due lane mock provider locali:

- `mock-openai` è il mock OpenClaw consapevole dello scenario. Rimane la lane mock
  deterministica predefinita per QA basata su repository e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo,
  fixture, registrazione/riproduzione e caos. È additivo e non
  sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle lane provider vive sotto `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri predefiniti, l'avvio del server locale, la configurazione del modello Gateway,
le esigenze di staging auth-profile e i flag di capability live/mock. Il codice condiviso di suite e
Gateway deve instradare tramite il registro dei provider invece di ramificare sui
nomi dei provider.

## Adattatori di trasporto

`qa-lab` possiede una seam di trasporto generica per gli scenari QA Markdown. `qa-channel` è il primo adattatore su quella seam, ma il target di progettazione è più ampio: canali futuri reali o sintetici devono collegarsi allo stesso runner di suite invece di aggiungere un runner QA specifico del trasporto.

A livello architetturale, la divisione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza worker, scrittura degli artefatti e reporting.
- L'adattatore di trasporto possiede configurazione Gateway, readiness, osservazione inbound e outbound, azioni di trasporto e stato di trasporto normalizzato.
- I file di scenario Markdown sotto `qa/scenarios/` definiscono l'esecuzione di test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiungere un canale

Aggiungere un canale al sistema QA Markdown richiede esattamente due cose:

1. Un adattatore di trasporto per il canale.
2. Un pacchetto di scenari che esercita il contratto del canale.

Non aggiungere una nuova root di comando QA di primo livello quando l'host condiviso `qa-lab` può possedere il flusso.

`qa-lab` possiede i meccanismi condivisi dell'host:

- la root del comando `openclaw qa`
- avvio e teardown della suite
- concorrenza worker
- scrittura degli artefatti
- generazione del report
- esecuzione degli scenari
- alias di compatibilità per scenari `qa-channel` più vecchi

I Plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root `qa` condivisa
- come il Gateway viene configurato per quel trasporto
- come viene controllata la readiness
- come vengono iniettati gli eventi inbound
- come vengono osservati i messaggi outbound
- come vengono esposti trascrizioni e stato di trasporto normalizzato
- come vengono eseguite le azioni basate sul trasporto
- come vengono gestiti reset o pulizia specifici del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della root `qa` condivisa.
2. Implementa il runner di trasporto sulla seam dell'host `qa-lab` condiviso.
3. Mantieni i meccanismi specifici del trasporto dentro il Plugin runner o l'harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando root concorrente. I Plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni leggero `runtime-api.ts`; CLI lazy ed esecuzione runner devono restare dietro entrypoint separati.
5. Crea o adatta scenari Markdown sotto le directory tematiche `qa/scenarios/`.
6. Usa gli helper di scenario generici per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti a meno che il repository stia eseguendo una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se il comportamento può essere espresso una volta in `qa-lab`, mettilo in `qa-lab`.
- Se il comportamento dipende da un trasporto di canale, mantienilo in quel Plugin runner o nell'harness del Plugin.
- Se uno scenario richiede una nuova capability che più di un canale può usare, aggiungi un helper generico invece di un ramo specifico del canale in `suite.ts`.
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

Gli alias di compatibilità rimangono disponibili per gli scenari esistenti — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ma la creazione di nuovi scenari deve usare i nomi generici. Gli alias esistono per evitare una migrazione flag-day, non come modello futuro.

## Reporting

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservato.
Il report deve rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili — utile quando si dimensiona il lavoro di follow-up o si collega un nuovo trasporto — esegui `pnpm openclaw qa coverage` (aggiungi `--json` per un output leggibile dalle macchine).

Per i controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modelli live
e scrivi un rapporto Markdown valutato:

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
dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, assistenza sullo spazio di lavoro e piccoli task sui file. Il modello candidato
non dovrebbe essere informato che è in fase di valutazione. Il comando preserva ogni trascrizione
completa, registra le statistiche di base dell'esecuzione, quindi chiede ai modelli giudice in modalità veloce con
ragionamento `xhigh`, dove supportato, di classificare le esecuzioni per naturalezza, tono e umorismo.
Usa `--blind-judge-models` quando confronti i provider: il prompt del giudice riceve comunque
ogni trascrizione e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con
etichette neutre come `candidate-01`; il rapporto associa di nuovo le classifiche ai riferimenti reali dopo
il parsing.
Le esecuzioni candidate usano per impostazione predefinita il thinking `high`, con `medium` per GPT-5.5 e `xhigh`
per i riferimenti di valutazione OpenAI meno recenti che lo supportano. Sovrascrivi un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un
fallback globale, e la forma precedente `--model-thinking <provider/model=level>` viene
mantenuta per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità veloce, quindi viene usata
l'elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando
un singolo candidato o giudice richiede una sovrascrittura. Passa `--fast` solo quando vuoi
forzare la modalità veloce per ogni modello candidato. Le durate dei candidati e dei giudici vengono
registrate nel rapporto per l'analisi benchmark, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita la concorrenza 16. Riduci
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul Gateway
locale rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun candidato `--model`, la valutazione del carattere usa per impostazione predefinita
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [QA Matrix](/it/concepts/qa-matrix)
- [QA Channel](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Dashboard](/it/web/dashboard)
