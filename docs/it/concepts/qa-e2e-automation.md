---
read_when:
    - Comprendere come si integra lo stack di QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiunta di scenari di QA basati su repository
    - Creazione di automazione QA ad alto realismo intorno alla dashboard Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari basati sul repository, corsie di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica QA
x-i18n:
    generated_at: "2026-05-03T21:31:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato serve a esercitare OpenClaw in modo più realistico e
modellato sui canali rispetto a quanto possa fare un singolo unit test.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici per DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, futuri plugin runner: adattatori di trasporto live che
  guidano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed supportati dal repository per il task iniziale e gli scenari
  QA di baseline.
- [Mantis](/it/concepts/mantis): verifica live prima e dopo per bug che
  richiedono trasporti reali, screenshot del browser, stato della VM ed evidenze PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno alias di script `pnpm qa:*`;
sono supportate entrambe le forme.

| Comando                                             | Scopo                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Self-check QA incluso; scrive un report Markdown.                                                                                                                       |
| `qa suite`                                          | Esegue scenari supportati dal repository contro la corsia del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                 |
| `qa coverage`                                       | Stampa l'inventario Markdown della copertura degli scenari (`--json` per output macchina).                                                                                          |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentico.                                                                                         |
| `qa character-eval`                                 | Esegue lo scenario QA del personaggio su più modelli live con un report valutato. Vedi [Reportistica](#reporting).                                                           |
| `qa manual`                                         | Esegue un prompt una tantum contro la corsia provider/modello selezionata.                                                                                                         |
| `qa ui`                                             | Avvia la UI di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                   |
| `qa docker-build-image`                             | Costruisce l'immagine Docker QA prebaked.                                                                                                                                    |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + corsia Gateway.                                                                                                   |
| `qa up`                                             | Costruisce il sito QA, avvia lo stack supportato da Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                 |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole degli scenari.                                                                                                           |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool di credenziali Convex condiviso.                                                                                                                              |
| `qa matrix`                                         | Corsia di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [QA Matrix](/it/concepts/qa-matrix).                                                                     |
| `qa telegram`                                       | Corsia di trasporto live contro un vero gruppo privato Telegram.                                                                                                             |
| `qa discord`                                        | Corsia di trasporto live contro un vero canale di una guild privata Discord.                                                                                                      |
| `qa mantis`                                         | Runner di verifica prima e dopo per bug di trasporto live, con il primo scenario di reazioni di stato Discord. Vedi [Mantis](/it/concepts/mantis).                        |

## Flusso operativo

L'attuale flusso operativo QA è un sito QA a due riquadri:

- Sinistra: dashboard Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo costruisce il sito QA, avvia la corsia Gateway supportata da Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può assegnare all'agente una missione QA,
osservare il comportamento reale del canale e registrare ciò che ha funzionato, fallito o
è rimasto bloccato.

Per iterazioni più rapide sulla UI di QA Lab senza ricostruire ogni volta l'immagine Docker,
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

Per uno smoke trace OpenTelemetry locale, esegui:

```bash
pnpm qa:otel:smoke
```

Quello script avvia un ricevitore trace OTLP/HTTP locale, esegue lo scenario QA
`otel-trace-smoke` con il plugin `diagnostics-otel` abilitato, quindi
decodifica gli span protobuf esportati e verifica la forma critica per il rilascio:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devono essere presenti;
le chiamate al modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono restare fuori dalla trace. Scrive
`otel-smoke-summary.json` accanto agli artifact della suite QA.

La QA di osservabilità resta disponibile solo da checkout dei sorgenti. Il tarball npm omette intenzionalmente
QA Lab, quindi le corsie Docker di rilascio pacchetto non eseguono comandi `qa`. Usa
`pnpm qa:otel:smoke` da un checkout dei sorgenti compilato quando modifichi la strumentazione
diagnostica.

Per una corsia smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo di profili/scenari, le variabili env e il layout degli artifact per questa corsia si trovano in [QA Matrix](/it/concepts/qa-matrix). In breve: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/observer, esegue il vero plugin Matrix dentro un Gateway QA figlio circoscritto a quel trasporto (nessun `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artifact di eventi osservati e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Per corsie smoke Telegram e Discord con trasporto reale:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Entrambe puntano a un canale reale preesistente con due bot (driver + SUT). Le variabili env richieste, gli elenchi di scenari, gli artifact di output e il pool di credenziali Convex sono documentati nel [riferimento QA Telegram e Discord](#telegram-and-discord-qa-reference) sotto.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'env del broker Convex, valida le impostazioni degli endpoint e verifica la raggiungibilità admin/list quando è presente il segreto del maintainer. Riporta solo lo stato impostato/mancante per i segreti.

## Copertura del trasporto live

Le corsie di trasporto live condividono un unico contratto invece di inventare ognuna una propria forma di elenco scenari. `qa-channel` è l'ampia suite sintetica di comportamento del prodotto e non fa parte della matrice di copertura del trasporto live.

| Corsia   | Canary | Gating delle menzioni | Bot-a-bot | Blocco allowlist | Risposta di primo livello | Ripresa al riavvio | Follow-up del thread | Isolamento del thread | Osservazione reazioni | Comando help | Registrazione comandi nativi |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |                |                  |                  |                      |              | x                           |

Questo mantiene `qa-channel` come ampia suite di comportamento del prodotto mentre Matrix,
Telegram e i futuri trasporti live condividono una checklist esplicita del contratto di trasporto.

Per una corsia VM Linux usa e getta senza portare Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
dentro il guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono più scenari selezionati in parallelo
con worker Gateway isolati per impostazione predefinita. `qa-channel` usa per default concorrenza
4, limitata dal conteggio degli scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, o `--concurrency 1` per l'esecuzione seriale.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artifact senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, percorso della configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la radice del repository così il guest
può scrivere indietro attraverso il workspace montato.

## Riferimento QA Telegram e Discord

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) per via del numero di scenari e del provisioning dell'homeserver supportato da Docker. Telegram e Discord sono più piccoli: una manciata di scenari ciascuno, nessun sistema di profili, contro canali reali preesistenti, quindi il loro riferimento vive qui.

### Flag CLI condivisi

Entrambe le corsie si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Opzione                               | Predefinito                                               | Descrizione                                                                                                                     |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Esegue solo questo scenario. Ripetibile.                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Dove vengono scritti report/riepilogo/messaggi osservati e log di output. I percorsi relativi si risolvono rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Root del repository quando si invoca da una cwd neutra.                                                                         |
| `--sut-account <id>`                  | `sut`                                                     | ID account temporaneo nella configurazione del Gateway QA.                                                                      |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` o `live-frontier` (il legacy `live-openai` funziona ancora).                                                      |
| `--model <ref>` / `--alt-model <ref>` | provider default                                          | Riferimenti modello primario/alternativo.                                                                                       |
| `--fast`                              | off                                                       | Modalità veloce del provider dove supportata.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                                     |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, `maintainer` altrimenti                       | Ruolo usato quando `--credential-source convex`.                                                                                |

Entrambi escono con codice diverso da zero per qualsiasi scenario non riuscito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Ha come target un gruppo Telegram privato reale con due bot distinti (driver + SUT). Il bot SUT deve avere un nome utente Telegram; l'osservazione bot-a-bot funziona meglio quando entrambi i bot hanno la **Modalità di comunicazione bot-a-bot** abilitata in `@BotFather`.

Env richiesto quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opzionale:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati (predefinito: redatti).

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
- `telegram-qa-observed-messages.json` — corpi redatti salvo `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Ha come target un canale guild Discord privato reale con due bot: un bot driver controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord incluso. Verifica la gestione delle menzioni del canale, che il bot SUT abbia registrato il comando nativo `/help` con Discord, e scenari di evidenza Mantis opt-in.

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
- `discord-status-reactions-tool-only` — scenario Mantis opt-in. Viene eseguito da solo perché passa il SUT a risposte guild sempre attive e solo strumenti con `messages.statusReactions.enabled=true`, poi acquisisce una timeline REST delle reaction più un artefatto visivo HTML/PNG.

Esegui esplicitamente lo scenario Mantis delle reaction di stato:

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
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando viene eseguito lo scenario delle reaction di stato.

### Pool di credenziali Convex

Entrambe le lane Telegram e Discord possono ottenere credenziali in lease da un pool Convex condiviso invece di leggere le variabili env sopra. Passa `--credential-source convex` (o imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, invia Heartbeat per tutta la durata dell'esecuzione e lo rilascia allo shutdown. I tipi di pool sono `"telegram"` e `"discord"`.

Forme del payload che il broker valida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve essere una stringa chat-id numerica.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Le variabili env operative e il contratto dell'endpoint del broker Convex si trovano in [Testing → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il supporto Discord; la semantica del broker è identica per entrambi i tipi).

## Seed supportati dal repo

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Questi sono intenzionalmente in git così che il piano QA sia visibile sia agli esseri umani sia all'agente.

`qa-lab` deve rimanere un runner markdown generico. Ogni file markdown di scenario è la fonte di verità per un'esecuzione di test e deve definire:

- metadati dello scenario
- metadati opzionali di categoria, capability, lane e rischio
- riferimenti a documentazione e codice
- requisiti opzionali dei Plugin
- patch opzionale della configurazione Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può rimanere generica e trasversale. Per esempio, gli scenari markdown possono combinare helper lato trasporto con helper lato browser che guidano la Control UI incorporata tramite il seam `browser.request` del Gateway senza aggiungere un runner speciale.

I file di scenario devono essere raggruppati per capability di prodotto anziché per cartella del source tree. Mantieni stabili gli ID scenario quando i file vengono spostati; usa `docsRefs` e `codeRefs` per la tracciabilità dell'implementazione.

L'elenco baseline deve rimanere abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo della memoria
- cambio di modello
- passaggio a subagent
- lettura del repo e lettura della documentazione
- un piccolo task di build come Lobster Invaders

## Lane mock dei provider

`qa suite` ha due lane mock dei provider locali:

- `mock-openai` è il mock OpenClaw consapevole degli scenari. Rimane la lane mock deterministica predefinita per QA supportata dal repo e parity gate.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo, fixture, registrazione/riproduzione e caos. È additivo e non sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle lane provider vive sotto `extensions/qa-lab/src/providers/`. Ogni provider possiede i propri predefiniti, avvio del server locale, configurazione del modello Gateway, esigenze di staging degli auth-profile e flag di capability live/mock. Il codice condiviso di suite e Gateway deve instradare tramite il registro dei provider invece di ramificare sui nomi dei provider.

## Adapter di trasporto

`qa-lab` possiede un seam di trasporto generico per scenari QA markdown. `qa-channel` è il primo adapter su quel seam, ma il target di progettazione è più ampio: canali futuri reali o sintetici devono collegarsi allo stesso suite runner invece di aggiungere un runner QA specifico per trasporto.

A livello di architettura, la divisione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza dei worker, scrittura degli artefatti e reportistica.
- L'adapter di trasporto possiede configurazione Gateway, readiness, osservazione in ingresso e in uscita, azioni di trasporto e stato di trasporto normalizzato.
- I file di scenario markdown sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiungere un canale

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adapter di trasporto per il canale.
2. Un pacchetto di scenari che esercita il contratto del canale.

Non aggiungere una nuova root di comando QA di primo livello quando l'host condiviso `qa-lab` può possedere il flusso.

`qa-lab` possiede la meccanica dell'host condiviso:

- la root del comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per scenari `qa-channel` più vecchi

I Plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come viene configurato il Gateway per quel trasporto
- come viene controllata la readiness
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposti trascrizioni e stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito reset o cleanup specifico del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della root `qa` condivisa.
2. Implementa il runner di trasporto sul seam dell'host `qa-lab` condiviso.
3. Mantieni la meccanica specifica del trasporto dentro il Plugin runner o l'harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando root concorrente. I Plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni `runtime-api.ts` leggero; CLI lazy ed esecuzione del runner devono rimanere dietro entrypoint separati.
5. Crea o adatta scenari markdown sotto le directory tematiche `qa/scenarios/`.
6. Usa gli helper di scenario generici per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti salvo una migrazione intenzionale del repo.

La regola decisionale è rigida:

- Se il comportamento può essere espresso una volta in `qa-lab`, mettilo in `qa-lab`.
- Se il comportamento dipende da un trasporto di canale, mantienilo in quel Plugin runner o nell'harness del Plugin.
- Se uno scenario richiede una nuova capability utilizzabile da più di un canale, aggiungi un helper generico invece di un ramo specifico del canale in `suite.ts`.
- Se un comportamento ha senso solo per un trasporto, mantieni lo scenario specifico del trasporto e rendilo esplicito nel contratto dello scenario.

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

Gli alias di compatibilità restano disponibili per gli scenari esistenti — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ma la creazione di nuovi scenari dovrebbe usare i nomi generici. Gli alias esistono per evitare una migrazione in un unico momento, non come modello da seguire in futuro.

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla cronologia osservata del bus.
Il report dovrebbe rispondere a:

- Che cosa ha funzionato
- Che cosa non ha funzionato
- Che cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili — utile per dimensionare il lavoro di follow-up o collegare un nuovo trasporto — esegui `pnpm openclaw qa coverage` (aggiungi `--json` per un output leggibile dalle macchine).

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
dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, aiuto sul workspace e piccoli task sui file. Al modello candidato non dovrebbe
essere detto che è in fase di valutazione. Il comando conserva ogni trascrizione completa,
registra statistiche di esecuzione di base, quindi chiede ai modelli giudici in modalità fast con
ragionamento `xhigh` dove supportato di classificare le esecuzioni per naturalezza, atmosfera e umorismo.
Usa `--blind-judge-models` quando confronti i provider: il prompt del giudice riceve comunque
ogni trascrizione e stato di esecuzione, ma le ref dei candidati vengono sostituite con
etichette neutrali come `candidate-01`; il report mappa le classifiche alle ref reali dopo
il parsing.
Le esecuzioni dei candidati usano per impostazione predefinita il thinking `high`, con `medium` per GPT-5.5 e `xhigh`
per le ref di valutazione OpenAI più vecchie che lo supportano. Sovrascrivi uno specifico candidato inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un
fallback globale, e la forma precedente `--model-thinking <provider/model=level>` è
mantenuta per compatibilità.
Le ref dei candidati OpenAI usano per impostazione predefinita la modalità fast, così viene usata l'elaborazione prioritaria dove
il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice richiede una sovrascrittura. Passa `--fast` solo quando vuoi
forzare l'attivazione della modalità fast per ogni modello candidato. Le durate di candidati e giudici sono
registrate nel report per l'analisi dei benchmark, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita una concorrenza di 16. Riduci
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul Gateway locale
rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun `--model` candidato, la valutazione del carattere usa per impostazione predefinita
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [QA a matrice](/it/concepts/qa-matrix)
- [Canale QA](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Dashboard](/it/web/dashboard)
