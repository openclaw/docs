---
read_when:
    - Comprendere come si integra lo stack di QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiunta di scenari di QA basati sul repository
    - Creare automazione QA più realistica attorno alla dashboard del Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari basati sul repository, lane di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica QA
x-i18n:
    generated_at: "2026-05-02T20:44:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato è pensato per esercitare OpenClaw in modo più realistico e
modellato sui canali rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, plugin runner futuri: adattatori di trasporto live che
  pilotano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed supportati dal repository per l'attività di avvio e gli scenari QA
  di baseline.

## Interfaccia dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno alias di script `pnpm qa:*`;
sono supportate entrambe le forme.

| Comando                                             | Scopo                                                                                                                                                                  |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Self-check QA incluso; scrive un report Markdown.                                                                                                                      |
| `qa suite`                                          | Esegue scenari supportati dal repository contro la corsia QA Gateway. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                 |
| `qa coverage`                                       | Stampa l'inventario Markdown della copertura degli scenari (`--json` per output leggibile dalle macchine).                                                             |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentico.                                                                                      |
| `qa character-eval`                                 | Esegue lo scenario QA del personaggio su più modelli live con un report giudicato. Vedi [Reportistica](#reporting).                                                    |
| `qa manual`                                         | Esegue un prompt una tantum contro la corsia provider/modello selezionata.                                                                                             |
| `qa ui`                                             | Avvia la UI di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                  |
| `qa docker-build-image`                             | Crea l'immagine Docker QA preconfezionata.                                                                                                                             |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + corsia Gateway.                                                                                               |
| `qa up`                                             | Crea il sito QA, avvia lo stack supportato da Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                  |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole degli scenari.                                                                                                 |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool condiviso di credenziali Convex.                                                                                                                      |
| `qa matrix`                                         | Corsia di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [QA Matrix](/it/concepts/qa-matrix).                                                             |
| `qa telegram`                                       | Corsia di trasporto live contro un gruppo Telegram privato reale.                                                                                                      |
| `qa discord`                                        | Corsia di trasporto live contro un canale di guild Discord privato reale.                                                                                              |

## Flusso dell'operatore

L'attuale flusso dell'operatore QA è un sito QA a due pannelli:

- Sinistra: dashboard Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo crea il sito QA, avvia la corsia Gateway supportata da Docker ed espone la
pagina QA Lab in cui un operatore o un ciclo di automazione può assegnare
all'agente una missione QA, osservare il comportamento reale del canale e
registrare cosa ha funzionato, cosa è fallito o cosa è rimasto bloccato.

Per iterare più rapidamente sulla UI di QA Lab senza ricreare ogni volta
l'immagine Docker, avvia lo stack con un bundle QA Lab montato in bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta in bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle a ogni modifica e il browser si ricarica automaticamente quando cambia
l'hash degli asset di QA Lab.

Per uno smoke locale di trace OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Questo script avvia un receiver trace OTLP/HTTP locale, esegue lo scenario QA
`otel-trace-smoke` con il Plugin `diagnostics-otel` abilitato, quindi
decodifica gli span protobuf esportati e verifica la forma critica per il rilascio:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devono essere presenti;
le chiamate al modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono restare fuori dal trace. Scrive
`otel-smoke-summary.json` accanto agli artefatti della suite QA.

La QA di osservabilità resta disponibile solo da checkout del sorgente. Il tarball npm omette intenzionalmente
QA Lab, quindi le corsie di rilascio Docker del pacchetto non eseguono comandi `qa`. Usa
`pnpm qa:otel:smoke` da un checkout del sorgente compilato quando modifichi la strumentazione
diagnostica.

Per una corsia smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo profili/scenari, le variabili env e il layout degli artefatti per questa corsia si trovano in [QA Matrix](/it/concepts/qa-matrix). In breve: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/observer, esegue il Plugin Matrix reale dentro un Gateway QA figlio limitato a quel trasporto (senza `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artefatto observed-events e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Per corsie smoke Telegram e Discord con trasporto reale:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Entrambe puntano a un canale reale preesistente con due bot (driver + SUT). Le variabili env richieste, gli elenchi di scenari, gli artefatti di output e il pool di credenziali Convex sono documentati nel [riferimento QA Telegram e Discord](#telegram-and-discord-qa-reference) qui sotto.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'env del broker Convex, valida le impostazioni degli endpoint e verifica la raggiungibilità admin/list quando il segreto del maintainer è presente. Riporta solo lo stato impostato/mancante per i segreti.

## Copertura dei trasporti live

Le corsie di trasporto live condividono un unico contratto invece di inventare ciascuna la propria forma di elenco scenari. `qa-channel` è l'ampia suite sintetica di comportamento del prodotto e non fa parte della matrice di copertura dei trasporti live.

| Corsia   | Canary | Gating menzione | Bot-to-bot | Blocco allowlist | Risposta top-level | Ripresa dopo riavvio | Follow-up thread | Isolamento thread | Osservazione reazioni | Comando help | Registrazione comandi nativi |
| -------- | ------ | --------------- | ---------- | ---------------- | ------------------ | -------------------- | ---------------- | ----------------- | --------------------- | ------------ | ----------------------------- |
| Matrix   | x      | x               | x          | x                | x                  | x                    | x                | x                 | x                     |              |                               |
| Telegram | x      | x               | x          |                  |                    |                      |                  |                   |                       | x            |                               |
| Discord  | x      | x               | x          |                  |                    |                      |                  |                   |                       |              | x                             |

Questo mantiene `qa-channel` come ampia suite di comportamento del prodotto mentre Matrix,
Telegram e i futuri trasporti live condividono una checklist esplicita di contratto
di trasporto.

Per una corsia VM Linux usa e getta senza portare Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass fresco, installa le dipendenze, compila OpenClaw
dentro il guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono più scenari selezionati in parallelo
con worker Gateway isolati per impostazione predefinita. `qa-channel` usa come default la concorrenza
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Il comando termina con codice diverso da zero quando uno scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input auth QA supportati che sono pratici per il
guest: chiavi provider basate su env, percorso della configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la radice del repository così il guest
può riscrivere tramite il workspace montato.

## Riferimento QA Telegram e Discord

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) per via del numero di scenari e del provisioning dell'homeserver supportato da Docker. Telegram e Discord sono più piccoli: una manciata di scenari ciascuno, nessun sistema di profili, contro canali reali preesistenti; quindi il loro riferimento vive qui.

### Flag CLI condivisi

Entrambe le corsie si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                              | Descrizione                                                                                                                     |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Esegue solo questo scenario. Ripetibile.                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Percorso in cui vengono scritti report/riepilogo/messaggi osservati e il log di output. I percorsi relativi si risolvono rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Radice del repository quando l’invocazione avviene da una cwd neutra.                                                           |
| `--sut-account <id>`                  | `sut`                                                     | ID account temporaneo nella configurazione del Gateway QA.                                                                       |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` o `live-frontier` (il valore legacy `live-openai` funziona ancora).                                               |
| `--model <ref>` / `--alt-model <ref>` | predefinito del provider                                  | Riferimenti del modello primario/alternativo.                                                                                    |
| `--fast`                              | disattivato                                               | Modalità veloce del provider, dove supportata.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                                      |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, altrimenti `maintainer`                       | Ruolo usato quando `--credential-source convex`.                                                                                 |

Entrambi escono con codice diverso da zero in caso di scenario non riuscito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Usa come target un gruppo Telegram privato reale con due bot distinti (driver + SUT). Il bot SUT deve avere un nome utente Telegram; l’osservazione bot-to-bot funziona meglio quando entrambi i bot hanno **Bot-to-Bot Communication Mode** abilitata in `@BotFather`.

Variabili d’ambiente richieste quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — ID chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opzionale:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` conserva i corpi dei messaggi negli artefatti dei messaggi osservati (per impostazione predefinita vengono oscurati).

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
- `telegram-qa-summary.json` — include l’RTT per risposta (invio del driver → risposta SUT osservata), a partire dal canary.
- `telegram-qa-observed-messages.json` — corpi oscurati a meno che `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Usa come target un canale di guild Discord privato reale con due bot: un bot driver controllato dall’harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord incluso. Verifica la gestione delle menzioni del canale e che il bot SUT abbia registrato il comando nativo `/help` con Discord.

Variabili d’ambiente richieste quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — deve corrispondere all’ID utente del bot SUT restituito da Discord (altrimenti la lane fallisce rapidamente).

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

Le lane Telegram e Discord possono entrambe prendere in lease credenziali da un pool Convex condiviso invece di leggere le variabili d’ambiente sopra. Passa `--credential-source convex` (o imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, invia heartbeat per tutta la durata dell’esecuzione e lo rilascia allo spegnimento. I tipi di pool sono `"telegram"` e `"discord"`.

Forme del payload validate dal broker su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` deve essere una stringa di chat-id numerico.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Le variabili d’ambiente operative e il contratto dell’endpoint del broker Convex si trovano in [Testing → credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il supporto a Discord; la semantica del broker è identica per entrambi i tipi).

## Seed basati sul repository

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git, così il piano QA è visibile sia agli esseri umani sia all’agente.

`qa-lab` dovrebbe rimanere un runner Markdown generico. Ogni file Markdown di scenario è la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- metadati facoltativi di categoria, capability, lane e rischio
- riferimenti a documentazione e codice
- requisiti Plugin facoltativi
- patch facoltativa della configurazione del Gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può rimanere generica e trasversale. Per esempio, gli scenari Markdown possono combinare helper lato transport con helper lato browser che pilotano la Control UI incorporata attraverso la seam `browser.request` del Gateway senza aggiungere un runner speciale.

I file di scenario dovrebbero essere raggruppati per capability di prodotto invece che per cartella dell’albero sorgente. Mantieni stabili gli ID degli scenari quando i file vengono spostati; usa `docsRefs` e `codeRefs` per la tracciabilità dell’implementazione.

L’elenco di baseline dovrebbe restare abbastanza ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- richiamo dalla memoria
- cambio di modello
- handoff a subagent
- lettura del repository e della documentazione
- una piccola attività di build, come Lobster Invaders

## Lane mock del provider

`qa suite` ha due lane mock locali del provider:

- `mock-openai` è il mock OpenClaw consapevole degli scenari. Rimane la lane mock deterministica predefinita per QA basata sul repository e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo, fixture, record/replay e chaos. È additivo e non sostituisce il dispatcher di scenari `mock-openai`.

L’implementazione delle lane provider si trova sotto `extensions/qa-lab/src/providers/`. Ogni provider possiede i propri valori predefiniti, l’avvio del server locale, la configurazione del modello del Gateway, le esigenze di staging degli auth-profile e i flag di capability live/mock. Il codice condiviso di suite e Gateway dovrebbe instradare attraverso il registro dei provider invece di diramarsi sui nomi dei provider.

## Adattatori transport

`qa-lab` possiede una seam transport generica per gli scenari QA Markdown. `qa-channel` è il primo adattatore su quella seam, ma l’obiettivo di design è più ampio: i futuri canali reali o sintetici dovrebbero collegarsi allo stesso runner di suite invece di aggiungere un runner QA specifico per transport.

A livello architetturale, la separazione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza dei worker, scrittura degli artefatti e reporting.
- L’adattatore transport possiede configurazione del Gateway, readiness, osservazione inbound e outbound, azioni transport e stato transport normalizzato.
- I file di scenario Markdown sotto `qa/scenarios/` definiscono l’esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiunta di un canale

Aggiungere un canale al sistema QA Markdown richiede esattamente due cose:

1. Un adattatore transport per il canale.
2. Un pacchetto di scenari che eserciti il contratto del canale.

Non aggiungere una nuova root di comando QA di primo livello quando l’host condiviso `qa-lab` può possedere il flusso.

`qa-lab` possiede la meccanica dell’host condiviso:

- la root del comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione del report
- esecuzione degli scenari
- alias di compatibilità per vecchi scenari `qa-channel`

I Plugin runner possiedono il contratto transport:

- come `openclaw qa <runner>` viene montato sotto la root condivisa `qa`
- come il Gateway viene configurato per quel transport
- come viene verificata la readiness
- come vengono iniettati gli eventi inbound
- come vengono osservati i messaggi outbound
- come vengono esposti transcript e stato transport normalizzato
- come vengono eseguite le azioni basate su transport
- come viene gestito reset o cleanup specifico del transport

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della root condivisa `qa`.
2. Implementa il runner transport sulla seam dell’host condiviso `qa-lab`.
3. Mantieni la meccanica specifica del transport dentro il Plugin runner o l’harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando root concorrente. I Plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni `runtime-api.ts` leggero; CLI lazy ed esecuzione del runner dovrebbero restare dietro entrypoint separati.
5. Crea o adatta scenari Markdown sotto le directory tematiche `qa/scenarios/`.
6. Usa gli helper generici di scenario per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, a meno che il repository stia eseguendo una migrazione intenzionale.

La regola decisionale è rigorosa:

- Se il comportamento può essere espresso una volta in `qa-lab`, mettilo in `qa-lab`.
- Se il comportamento dipende da un transport di canale, mantienilo in quel Plugin runner o nell’harness del Plugin.
- Se uno scenario richiede una nuova capability che più di un canale può usare, aggiungi un helper generico invece di un ramo specifico per canale in `suite.ts`.
- Se un comportamento ha senso solo per un transport, mantieni lo scenario specifico per transport e rendilo esplicito nel contratto dello scenario.

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

Gli alias di compatibilità restano disponibili per gli scenari esistenti — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — ma la creazione di nuovi scenari dovrebbe usare i nomi generici. Gli alias esistono per evitare una migrazione in un’unica data, non come modello da seguire.

## Reporting

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservato.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili — utile quando si dimensiona il lavoro di follow-up o si collega un nuovo trasporto — esegui `pnpm openclaw qa coverage` (aggiungi `--json` per un output leggibile da macchina).

Per i controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modelli live
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

Il comando esegue processi figlio del Gateway QA locale, non Docker. Gli scenari di valutazione del carattere
dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, aiuto sul workspace e piccoli task sui file. Al modello candidato
non dovrebbe essere detto che è in fase di valutazione. Il comando conserva ogni transcript
completo, registra le statistiche di base dell'esecuzione, quindi chiede ai modelli giudici in modalità fast con
ragionamento `xhigh`, dove supportato, di classificare le esecuzioni per naturalezza, atmosfera e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni transcript e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con
etichette neutre come `candidate-01`; il report rimappa le classifiche ai riferimenti reali dopo
il parsing.
Le esecuzioni candidate usano per impostazione predefinita il livello di thinking `high`, con `medium` per GPT-5.5 e `xhigh`
per i riferimenti di valutazione OpenAI più vecchi che lo supportano. Sovrascrivi un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un
fallback globale, e la forma precedente `--model-thinking <provider/model=level>` viene
mantenuta per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità fast, così viene usata l'elaborazione prioritaria dove
il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice ha bisogno di un override. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate di candidati e giudici sono
registrate nel report per l'analisi dei benchmark, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita una concorrenza di 16. Abbassa
`--concurrency` o `--judge-concurrency` quando i limiti dei provider o la pressione sul Gateway
locale rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun `--model` candidato, la valutazione del carattere usa come predefiniti
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici predefiniti sono
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documenti correlati

- [Matrice QA](/it/concepts/qa-matrix)
- [Canale QA](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Dashboard](/it/web/dashboard)
