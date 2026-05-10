---
read_when:
    - Comprendere come si integra lo stack di QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiunta di scenari QA basati sul repository
    - Creare un'automazione QA più realistica per la dashboard del Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari basati sul repository, corsie di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica QA
x-i18n:
    generated_at: "2026-05-10T19:33:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f931d3daf9c3794bff7c5452df70c818cce19942eb1de156d27a9928bb3e0a
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato ha lo scopo di esercitare OpenClaw in modo più realistico,
modellato sui canali, rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici per DM, canale, thread,
  reazione, modifica ed eliminazione.
- `extensions/qa-lab`: interfaccia di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, Plugin runner futuri: adattatori di trasporto live che
  pilotano un canale reale all'interno di un Gateway QA figlio.
- `qa/`: asset seed supportati dal repository per il task di avvio e gli scenari QA
  di riferimento.
- [Mantis](/it/concepts/mantis): verifica live prima e dopo per bug che
  richiedono trasporti reali, screenshot del browser, stato della VM ed evidenza della PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno alias di script `pnpm qa:*`;
entrambe le forme sono supportate.

| Comando                                             | Scopo                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Self-check QA incluso; scrive un report Markdown.                                                                                                                                                                                                                        |
| `qa suite`                                          | Esegui scenari supportati dal repository sulla lane del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                                                                                                                  |
| `qa coverage`                                       | Stampa l'inventario Markdown della copertura degli scenari (`--json` per output leggibile dalle macchine).                                                                                                                                                                                           |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentica.                                                                                                                                                                                          |
| `qa character-eval`                                 | Esegui lo scenario QA del carattere su più modelli live con un report giudicato. Vedi [Reporting](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Esegui un prompt una tantum sulla lane provider/modello selezionata.                                                                                                                                                                                                          |
| `qa ui`                                             | Avvia l'interfaccia di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Costruisci l'immagine Docker QA prebaked.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Scrivi uno scaffold docker-compose per la dashboard QA + lane Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Costruisci il sito QA, avvia lo stack supportato da Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole degli scenari.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisci il pool condiviso di credenziali Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Lane di trasporto live su un homeserver Tuwunel usa e getta. Vedi [Matrix QA](/it/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Lane di trasporto live su un gruppo Telegram privato reale.                                                                                                                                                                                                              |
| `qa discord`                                        | Lane di trasporto live su un canale guild Discord privato reale.                                                                                                                                                                                                       |
| `qa slack`                                          | Lane di trasporto live su un canale Slack privato reale.                                                                                                                                                                                                               |
| `qa mantis`                                         | Runner di verifica prima e dopo per bug dei trasporti live, con evidenza di reazioni di stato Discord, smoke desktop/browser Crabbox e smoke Slack in VNC. Vedi [Mantis](/it/concepts/mantis) e [Runbook Mantis Slack Desktop](/it/concepts/mantis-slack-desktop-runbook). |

## Flusso operatore

L'attuale flusso operatore QA è un sito QA a due pannelli:

- Sinistra: dashboard Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo costruisce il sito QA, avvia la lane Gateway supportata da Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può assegnare all'agente una missione QA,
osservare il comportamento reale del canale e registrare cosa ha funzionato, fallito o
è rimasto bloccato.

Per iterazioni più rapide sull'interfaccia QA Lab senza ricostruire ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricostruisce quel bundle a ogni modifica, e il browser si ricarica automaticamente quando cambia l'hash degli asset QA Lab.

Per uno smoke locale delle tracce OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Quello script avvia un ricevitore locale di tracce OTLP/HTTP, esegue lo
scenario QA `otel-trace-smoke` con il Plugin `diagnostics-otel` abilitato, quindi
decodifica gli span protobuf esportati e verifica la forma critica per la release:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled` e `openclaw.message.delivery` devono essere presenti;
le chiamate al modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono restare fuori dalla traccia. Scrive
`otel-smoke-summary.json` accanto agli artifact della suite QA.

La QA di osservabilità resta solo per checkout del sorgente. Il tarball npm omette intenzionalmente
QA Lab, quindi le lane di release Docker del pacchetto non eseguono comandi `qa`. Usa
`pnpm qa:otel:smoke` da un checkout del sorgente compilato quando modifichi la strumentazione
diagnostica.

Per una lane smoke Matrix con trasporto reale, esegui:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo di profili/scenari, le variabili d'ambiente e il layout degli artifact per questa lane si trovano in [Matrix QA](/it/concepts/qa-matrix). In sintesi: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/observer, esegue il Plugin Matrix reale all'interno di un Gateway QA figlio limitato a quel trasporto (nessun `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artifact degli eventi osservati e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Gli scenari coprono comportamenti di trasporto che i test unitari non possono dimostrare end to end: gating delle menzioni, policy allow-bot, allowlist, risposte di livello superiore e in thread, routing DM, gestione delle reazioni, soppressione delle modifiche in ingresso, deduplicazione del replay al riavvio, recupero dall'interruzione dell'homeserver, consegna dei metadati di approvazione, gestione dei media e flussi di bootstrap/recupero/verifica E2EE di Matrix. Il profilo CLI E2EE pilota anche `openclaw matrix encryption setup` e i comandi di verifica attraverso lo stesso homeserver usa e getta prima di controllare le risposte del Gateway.

Discord ha anche scenari opt-in solo Mantis per la riproduzione dei bug. Usa
`--scenario discord-status-reactions-tool-only` per la timeline esplicita delle reazioni di stato,
oppure `--scenario discord-thread-reply-filepath-attachment` per creare un
thread Discord reale e verificare che `message.thread-reply` preservi un
allegato `filePath`. Questi scenari restano fuori dalla lane Discord live predefinita
perché sono probe di riproduzione prima/dopo, non copertura smoke ampia.
Il workflow Mantis per gli allegati nei thread può anche aggiungere un video testimone Discord Web
con accesso effettuato quando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` è configurato nell'ambiente QA.
Quel profilo viewer è solo per la cattura visiva; la decisione pass/fail
proviene comunque dall'oracolo REST di Discord.

La CI usa la stessa superficie dei comandi in `.github/workflows/qa-live-transports-convex.yml`. Le esecuzioni pianificate e manuali predefinite eseguono il profilo Matrix rapido con credenziali frontier live, `--fast` e `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Il valore manuale `matrix_profile=all` si espande nei cinque shard di profilo, così il catalogo esaustivo può essere eseguito in parallelo mantenendo una directory artifact per ogni shard.

Per lane smoke Telegram, Discord e Slack con trasporto reale:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Prendono di mira un canale reale preesistente con due bot (driver + SUT). Le variabili d'ambiente richieste, gli elenchi degli scenari, gli artifact di output e il pool di credenziali Convex sono documentati nel [riferimento QA di Telegram, Discord e Slack](#telegram-discord-and-slack-qa-reference) qui sotto.

Per un’esecuzione completa in VM desktop Slack con salvataggio VNC, esegui:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Quel comando prende in lease una macchina desktop/browser Crabbox, esegue la lane live Slack
all’interno della VM, apre Slack Web nel browser VNC, cattura il desktop e
copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`,
quando la cattura video è disponibile, nella directory degli artefatti Mantis. I lease
desktop/browser Crabbox forniscono in anticipo gli strumenti di cattura e i pacchetti
helper per browser/build nativa, quindi lo scenario dovrebbe installare fallback solo sui lease
più vecchi. Mantis riporta i tempi totali e per fase in
`mantis-slack-desktop-smoke-report.md`, così le esecuzioni lente mostrano se il tempo è stato speso in
warmup del lease, acquisizione delle credenziali, configurazione remota o copia degli artefatti. Riutilizza
`--lease-id <cbx_...>` dopo aver effettuato l’accesso a Slack Web manualmente tramite VNC;
i lease riutilizzati mantengono caldo anche lo store pnpm di Crabbox. Il valore predefinito
`--hydrate-mode source` verifica da un checkout sorgente ed esegue install/build
all’interno della VM. Usa `--hydrate-mode prehydrated` solo quando il workspace remoto riutilizzato
ha già `node_modules` e un `dist/` compilato; quella modalità salta il costoso passaggio
install/build e fallisce in modo chiuso quando il workspace non è pronto.
Con `--gateway-setup`, Mantis lascia in esecuzione un Gateway Slack OpenClaw persistente
all’interno della VM sulla porta `38973`; senza, il comando esegue la normale
lane QA Slack bot-a-bot ed esce dopo la cattura degli artefatti.

La checklist dell’operatore, il comando di dispatch del workflow GitHub, il contratto del commento di evidenza,
la tabella decisionale hydrate-mode, l’interpretazione dei tempi e i passaggi di gestione degli errori
si trovano in [Runbook Mantis Slack Desktop](/it/concepts/mantis-slack-desktop-runbook).

Per un’attività desktop in stile agent/CV, esegui:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.4
```

`visual-task` prende in lease o riutilizza una macchina desktop/browser Crabbox, avvia
`crabbox record --while`, guida il browser visibile tramite un
`visual-driver` annidato, cattura `visual-task.png`, esegue `openclaw infer image describe`
sullo screenshot quando è selezionato `--vision-mode image-describe`, e
scrive `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e `mantis-visual-task-report.md`.
Quando `--expect-text` è impostato, il prompt di visione richiede un verdetto JSON
strutturato e passa solo quando il modello riporta evidenza visibile positiva; una
risposta negativa che si limita a citare il testo target non supera l’asserzione.
Usa `--vision-mode metadata` per uno smoke senza modello che dimostra il funzionamento
di desktop, browser, screenshot e video senza chiamare un provider di comprensione
delle immagini. La registrazione è un artefatto obbligatorio per `visual-task`; se Crabbox registra
nessun `visual-task.mp4` non vuoto, l’attività fallisce anche quando il visual driver
è passato. In caso di errore, Mantis mantiene il lease per VNC a meno che l’attività
non fosse già passata e `--keep-lease` non fosse impostato.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l’env del broker Convex, convalida le impostazioni degli endpoint e verifica la raggiungibilità admin/list quando il segreto del maintainer è presente. Riporta solo lo stato impostato/mancante per i segreti.

## Copertura del trasporto live

Le lane di trasporto live condividono un unico contratto invece di inventare ciascuna la propria forma di elenco scenari. `qa-channel` è la suite sintetica ampia di comportamento prodotto e non fa parte della matrice di copertura del trasporto live.

| Lane     | Canary | Gating delle menzioni | Bot-a-bot | Blocco allowlist | Risposta di primo livello | Ripresa dopo riavvio | Follow-up del thread | Isolamento del thread | Osservazione delle reazioni | Comando help | Registrazione comando nativo |
| -------- | ------ | --------------------- | --------- | ---------------- | ------------------------- | -------------------- | -------------------- | --------------------- | --------------------------- | ------------ | ---------------------------- |
| Matrix   | x      | x                     | x         | x                | x                         | x                    | x                    | x                     | x                           |              |                              |
| Telegram | x      | x                     | x         |                  |                           |                      |                      |                       |                             | x            |                              |
| Discord  | x      | x                     | x         |                  |                           |                      |                      |                       |                             |              | x                            |
| Slack    | x      | x                     | x         | x                | x                         | x                    | x                    | x                     |                             |              |                              |

Questo mantiene `qa-channel` come suite ampia di comportamento prodotto, mentre Matrix,
Telegram e i futuri trasporti live condividono una checklist esplicita del contratto
di trasporto.

Per una lane VM Linux eliminabile senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
all’interno del guest, esegue `qa suite`, quindi copia il normale report QA e
il riepilogo in `.artifacts/qa-e2e/...` sull’host.
Riutilizza lo stesso comportamento di selezione degli scenari di `qa suite` sull’host.
Le esecuzioni della suite host e Multipass eseguono più scenari selezionati in parallelo
con worker Gateway isolati per impostazione predefinita. `qa-channel` usa di default una concorrenza
di 4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l’esecuzione seriale.
Il comando esce con codice diverso da zero quando qualsiasi scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, il percorso della configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repo, così il guest
può scrivere tramite il workspace montato.

## Riferimento QA Telegram, Discord e Slack

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) per via del numero di scenari e del provisioning homeserver basato su Docker. Telegram, Discord e Slack sono più piccoli: una manciata di scenari ciascuno, nessun sistema di profili, contro canali reali preesistenti, quindi il loro riferimento si trova qui.

### Flag CLI condivisi

Queste lane si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                                    | Descrizione                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                              | Esegui solo questo scenario. Ripetibile.                                                                                          |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Dove vengono scritti report/riepilogo/messaggi osservati e il log di output. I percorsi relativi si risolvono rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                                | Root del repository quando si invoca da una cwd neutrale.                                                                         |
| `--sut-account <id>`                  | `sut`                                                          | ID account temporaneo all’interno della configurazione del Gateway QA.                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                                | `mock-openai` o `live-frontier` (`live-openai` legacy funziona ancora).                                                           |
| `--model <ref>` / `--alt-model <ref>` | default del provider                                           | Ref modello primaria/alternativa.                                                                                                 |
| `--fast`                              | disattivato                                                    | Modalità veloce del provider dove supportata.                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                                          | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                                       |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, altrimenti `maintainer`                            | Ruolo usato quando `--credential-source convex`.                                                                                  |

Ogni lane esce con codice diverso da zero su qualsiasi scenario fallito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Punta a un gruppo Telegram privato reale con due bot distinti (driver + SUT). Il bot SUT deve avere uno username Telegram; l’osservazione bot-a-bot funziona meglio quando entrambi i bot hanno **Bot-to-Bot Communication Mode** abilitato in `@BotFather`.

Env obbligatorio quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Facoltativo:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati (predefinito: redatti).

Scenari (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Il set predefinito implicito copre sempre canary, gating delle menzioni, risposte ai comandi nativi, indirizzamento dei comandi e risposte di gruppo bot-a-bot. I valori predefiniti `mock-openai` includono anche controlli deterministici su reply-chain e streaming del messaggio finale. `telegram-current-session-status-tool` resta opt-in perché è stabile solo quando eseguito direttamente dopo canary, non dopo risposte arbitrarie ai comandi nativi. Usa `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` per stampare la suddivisione attuale default/facoltativa con ref di regressione.

Artefatti di output:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` - include RTT per risposta (invio driver → risposta SUT osservata) a partire dal canary.
- `telegram-qa-observed-messages.json` - corpi redatti a meno che `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Punta a un canale guild Discord privato reale con due bot: un bot driver controllato dall’harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord in bundle. Verifica la gestione delle menzioni nel canale, che il bot SUT abbia registrato il comando nativo `/help` con Discord, e gli scenari di evidenza Mantis opt-in.

Env obbligatorio quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corrispondere all'id utente del bot SUT restituito da Discord (altrimenti la lane fallisce rapidamente).

Opzionale:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva i corpi dei messaggi negli artefatti dei messaggi osservati.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleziona il canale vocale/stage per `discord-voice-autojoin`; senza di esso, lo scenario sceglie il primo canale vocale/stage visibile per il bot SUT.

Scenari (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scenario vocale opzionale. Viene eseguito da solo, abilita `channels.discord.voice.autoJoin` e verifica che lo stato vocale Discord corrente del bot SUT sia il canale vocale/stage di destinazione. Le credenziali Convex Discord possono includere il campo opzionale `voiceChannelId`; altrimenti il runner individua il primo canale vocale/stage visibile nella guild.
- `discord-status-reactions-tool-only` - scenario Mantis opzionale. Viene eseguito da solo perché passa il SUT a risposte nella guild sempre attive e solo tramite strumenti con `messages.statusReactions.enabled=true`, quindi acquisisce una timeline delle reazioni REST più artefatti visivi HTML/PNG. I report Mantis prima/dopo conservano anche gli artefatti MP4 forniti dallo scenario come `baseline.mp4` e `candidate.mp4`.

Esegui esplicitamente lo scenario di accesso automatico al canale vocale Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

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
- `discord-qa-observed-messages.json` - corpi oscurati salvo che `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
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
- `slack-qa-observed-messages.json` - corpi oscurati salvo che `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

#### Configurare il workspace Slack

La lane richiede due app Slack distinte in un workspace, più un canale di cui entrambi i bot siano membri:

- `channelId` - l'id `Cxxxxxxxxxx` di un canale a cui entrambi i bot sono stati invitati. Usa un canale dedicato; la lane pubblica messaggi a ogni esecuzione.
- `driverBotToken` - token del bot (`xoxb-...`) dell'app **Driver**.
- `sutBotToken` - token del bot (`xoxb-...`) dell'app **SUT**, che deve essere un'app Slack separata dal driver in modo che il suo id utente bot sia distinto.
- `sutAppToken` - token a livello di app (`xapp-...`) dell'app SUT con `connections:write`, usato da Socket Mode affinché l'app SUT possa ricevere eventi.

Preferisci un workspace Slack dedicato alla QA invece di riutilizzare un workspace di produzione.

Il manifest SUT qui sotto restringe intenzionalmente l'installazione di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`) alle autorizzazioni e agli eventi coperti dalla suite Slack QA live. Per la configurazione del canale di produzione così come la vedono gli utenti, consulta [Configurazione rapida del canale Slack](/it/channels/slack#quick-setup); la coppia QA Driver/SUT è intenzionalmente separata perché la lane richiede due id utente bot distinti in un workspace.

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

Copia il _Bot User OAuth Token_ (`xoxb-...`) - diventa `driverBotToken`. Il driver deve solo pubblicare messaggi e identificarsi; nessun evento, nessun Socket Mode.

**2. Crea l'app SUT**

Ripeti _Create New App → From a manifest_ nello stesso workspace. Questa app QA usa intenzionalmente una versione più ristretta del manifest di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`): gli scope e gli eventi delle reazioni sono omessi perché la suite Slack QA live non copre ancora la gestione delle reazioni.

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

Dopo che Slack crea l'app, fai due cose nella sua pagina delle impostazioni:

- _Install to Workspace_ → copia il _Bot User OAuth Token_ → diventa `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → aggiungi lo scope `connections:write` → salva → copia il valore `xapp-...` → diventa `sutAppToken`.

Verifica che i due bot abbiano id utente distinti chiamando `auth.test` su ciascun token. Il runtime distingue driver e SUT in base all'id utente; riutilizzare un'unica app per entrambi farà fallire immediatamente il mention-gating.

**3. Crea il canale**

Nel workspace QA, crea un canale (ad es. `#openclaw-qa`) e invita entrambi i bot dall'interno del canale:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia l'id `Cxxxxxxxxxx` da _channel info → About → Channel ID_ - diventa `channelId`. Un canale pubblico funziona; se usi un canale privato, entrambe le app hanno già `groups:history`, quindi le letture della cronologia dell'harness avranno comunque esito positivo.

**4. Registra le credenziali**

Due opzioni. Usa le variabili env per il debug su una singola macchina (imposta le quattro variabili `OPENCLAW_QA_SLACK_*` e passa `--credential-source env`), oppure popola il pool Convex condiviso in modo che CI e altri manutentori possano prenderle in lease.

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

Esegui la lane localmente per confermare che entrambi i bot possano parlare tra loro tramite il broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Un'esecuzione riuscita termina in molto meno di 30 secondi e `slack-qa-report.md` mostra sia `slack-canary` sia `slack-mention-gating` con stato `pass`. Se la lane resta bloccata per circa 90 secondi ed esce con `Convex credential pool exhausted for kind "slack"`, il pool è vuoto oppure ogni riga è in lease - `qa credentials list --kind slack --status all --json` ti dirà quale delle due.

### Pool di credenziali Convex

Le lane Telegram, Discord, Slack e WhatsApp possono prendere credenziali in lease da un pool Convex condiviso invece di leggere le variabili env sopra. Passa `--credential-source convex` (oppure imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, ne invia l'Heartbeat per tutta la durata dell'esecuzione e lo rilascia allo shutdown. I tipi del pool sono `"telegram"`, `"discord"`, `"slack"` e `"whatsapp"`.

Forme dei payload che il broker convalida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` deve essere una stringa chat-id numerica.
- Utente reale Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - un lease esclusivo di un account usa e getta utilizzato sia dal driver CLI TDLib sia dal testimone visivo Telegram Desktop.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - i numeri di telefono devono essere stringhe E.164 distinte.

Per una prova visiva con utente reale Telegram, preferisci una sessione Crabbox mantenuta attiva:

```bash
pnpm qa:telegram-user:crabbox -- start --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json --text /status
pnpm qa:telegram-user:crabbox -- finish --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` mantiene un lease Convex `telegram-user` esclusivo sia per il driver CLI TDLib
sia per il testimone Telegram Desktop, avvia la registrazione del desktop e lascia
Crabbox attivo per passaggi di riproduzione arbitrari guidati dall'agente. Gli agenti possono usare `send`,
`run`, `screenshot` e `status` finché non sono soddisfatti, quindi `finish`
raccoglie screenshot, video, video/GIF ritagliati in base al movimento, output dei probe TDLib
e log prima di rilasciare la credenziale. `publish --session <file> --pr
<number>` commenta solo la GIF con movimento per impostazione predefinita; `--full-artifacts` è
l'opt-in esplicito per log e output JSON. Il comando `probe` predefinito resta una
scorciatoia a comando singolo per rapidi smoke check di `/status`.

Usa `--mock-response-file <path>` quando una PR necessita di un diff visivo deterministico:
la stessa risposta fittizia del modello può essere eseguita su `main` e sulla testa della PR mentre il
formatter di Telegram o il livello di consegna cambia. I valori predefiniti di acquisizione sono tarati per i commenti delle PR: classe Crabbox standard, registrazione desktop a 24 fps, GIF di movimento a 24 fps e
larghezza anteprima di 1920 px. I commenti prima/dopo dovrebbero pubblicare un bundle pulito che
contiene solo le GIF previste.

Anche le lane Slack possono usare il pool. I controlli sulla forma del payload Slack attualmente vivono nel runner QA di Slack anziché nel broker; usa `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, con un ID canale Slack come `Cxxxxxxxxxx`. Vedi [Configurare l'area di lavoro Slack](#setting-up-the-slack-workspace) per il provisioning dell'app e degli scope.

Le variabili d'ambiente operative e il contratto dell'endpoint del broker Convex vivono in [Test → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il pool multi-canale; la semantica del lease è condivisa tra i tipi).

## Seed supportati dal repository

Gli asset di seed vivono in `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Sono intenzionalmente in git, così il piano QA è visibile sia agli esseri umani sia
all'agente.

`qa-lab` dovrebbe restare un runner markdown generico. Ogni file markdown di scenario è
la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- metadati dello scenario
- metadati opzionali di categoria, capability, lane e rischio
- riferimenti a documentazione e codice
- requisiti opzionali dei plugin
- patch opzionale della configurazione del gateway
- il `qa-flow` eseguibile

La superficie runtime riutilizzabile che supporta `qa-flow` può restare generica
e trasversale. Per esempio, gli scenari markdown possono combinare helper lato trasporto
con helper lato browser che pilotano la Control UI incorporata tramite il
seam `browser.request` del Gateway senza aggiungere un runner speciale.

I file di scenario dovrebbero essere raggruppati per capability di prodotto anziché per cartella
dell'albero sorgente. Mantieni stabili gli ID scenario quando i file si spostano; usa `docsRefs` e `codeRefs`
per la tracciabilità dell'implementazione.

L'elenco baseline dovrebbe restare abbastanza ampio da coprire:

- chat DM e canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback cron
- richiamo dalla memoria
- cambio di modello
- handoff a subagent
- lettura del repository e lettura della documentazione
- un piccolo task di build come Lobster Invaders

## Lane fittizie dei provider

`qa suite` ha due lane fittizie locali per provider:

- `mock-openai` è il mock OpenClaw consapevole degli scenari. Resta la lane fittizia deterministica predefinita
  per QA supportata dal repository e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo,
  fixture, record/replay e caos. È additivo e non
  sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle lane provider vive sotto `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, l'avvio del server locale, la configurazione del modello del gateway,
le necessità di staging dell'auth profile e i flag di capability live/mock. Il codice condiviso di suite e
gateway dovrebbe passare dal registro dei provider anziché ramificare
sui nomi dei provider.

## Adattatori di trasporto

`qa-lab` possiede un seam di trasporto generico per gli scenari QA markdown. `qa-channel` è il primo adattatore su quel seam, ma l'obiettivo di progettazione è più ampio: canali futuri reali o sintetici dovrebbero collegarsi allo stesso runner di suite anziché aggiungere un runner QA specifico per trasporto.

A livello architetturale, la divisione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza dei worker, scrittura degli artefatti e reporting.
- L'adattatore di trasporto possiede configurazione del gateway, readiness, osservazione inbound e outbound, azioni di trasporto e stato normalizzato del trasporto.
- I file di scenario markdown sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiungere un canale

Aggiungere un canale al sistema QA markdown richiede esattamente due cose:

1. Un adattatore di trasporto per il canale.
2. Un pacchetto di scenari che esercita il contratto del canale.

Non aggiungere una nuova radice di comando QA di primo livello quando l'host condiviso `qa-lab` può possedere il flusso.

`qa-lab` possiede la meccanica dell'host condiviso:

- la radice del comando `openclaw qa`
- avvio e teardown della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per scenari `qa-channel` più vecchi

I plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la radice condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene verificata la readiness
- come vengono iniettati gli eventi inbound
- come vengono osservati i messaggi outbound
- come vengono esposti transcript e stato normalizzato del trasporto
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o cleanup specifico del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della radice condivisa `qa`.
2. Implementa il runner di trasporto sul seam dell'host condiviso `qa-lab`.
3. Mantieni la meccanica specifica del trasporto dentro il plugin runner o l'harness del canale.
4. Monta il runner come `openclaw qa <runner>` anziché registrare un comando radice concorrente. I plugin runner dovrebbero dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni `runtime-api.ts` leggero; la CLI lazy e l'esecuzione del runner dovrebbero restare dietro entrypoint separati.
5. Crea o adatta scenari markdown nelle directory tematiche `qa/scenarios/`.
6. Usa gli helper di scenario generici per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, a meno che il repository non stia facendo una migrazione intenzionale.

La regola decisionale è rigida:

- Se il comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se il comportamento dipende da un trasporto di canale, tienilo in quel plugin runner o harness del plugin.
- Se uno scenario richiede una nuova capability che più di un canale può usare, aggiungi un helper generico anziché una ramificazione specifica per canale in `suite.ts`.
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

Gli alias di compatibilità restano disponibili per gli scenari esistenti - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ma la creazione di nuovi scenari dovrebbe usare i nomi generici. Gli alias esistono per evitare una migrazione flag-day, non come modello futuro.

## Reporting

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservata.
Il report dovrebbe rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili - utile quando si dimensiona il lavoro di follow-up o si collega un nuovo trasporto - esegui `pnpm openclaw qa coverage` (aggiungi `--json` per output leggibile da macchina).

Per controlli di carattere e stile, esegui lo stesso scenario su più riferimenti modello live
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

Il comando esegue processi figlio del gateway QA locale, non Docker. Gli scenari di character eval
dovrebbero impostare la persona tramite `SOUL.md`, poi eseguire normali turni utente
come chat, aiuto sul workspace e piccoli task su file. Al modello candidato non dovrebbe
essere detto che è in valutazione. Il comando conserva ogni transcript completo,
registra statistiche di esecuzione di base, poi chiede ai modelli giudici in modalità fast con
ragionamento `xhigh` dove supportato di classificare le esecuzioni per naturalezza, tono e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni transcript e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con etichette
neutrali come `candidate-01`; il report mappa le classifiche ai riferimenti reali dopo
il parsing.
Le esecuzioni candidate usano per impostazione predefinita thinking `high`, con `medium` per GPT-5.5 e `xhigh`
per i riferimenti eval OpenAI più vecchi che lo supportano. Sovrascrivi un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un
fallback globale, e la forma più vecchia `--model-thinking <provider/model=level>` è
mantenuta per compatibilità.
I riferimenti candidati OpenAI usano per impostazione predefinita la modalità fast, così viene usata
l'elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice necessita di una sovrascrittura. Passa `--fast` solo quando vuoi
forzare la modalità fast per ogni modello candidato. Le durate di candidati e giudici sono
registrate nel report per l'analisi benchmark, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe concorrenza 16 per impostazione predefinita. Abbassa
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul gateway locale
rendono un'esecuzione troppo rumorosa.
Quando non viene passato nessun `--model` candidato, character eval usa per impostazione predefinita
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato nessun `--model`.
Quando non viene passato nessun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-6,thinking=high`.

## Documentazione correlata

- [Matrice QA](/it/concepts/qa-matrix)
- [Canale QA](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Dashboard](/it/web/dashboard)
