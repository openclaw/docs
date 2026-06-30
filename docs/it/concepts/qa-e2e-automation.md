---
read_when:
    - Capire come si integra lo stack QA
    - Estendere qa-lab, qa-channel o un adattatore di trasporto
    - Aggiungere scenari QA supportati dal repository
    - Creazione di un'automazione QA a maggiore realismo attorno alla dashboard del Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari supportati dal repository, percorsi di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica QA
x-i18n:
    generated_at: "2026-06-30T14:05:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato serve a esercitare OpenClaw in modo più realistico,
modellato sui canali, rispetto a quanto possa fare un singolo test unitario.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggistica sintetico con superfici DM,
  canale, thread, reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, futuri plugin runner: adattatori di trasporto live che
  guidano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed basati sul repository per il task iniziale e gli scenari QA
  di baseline.
- [Mantis](/it/concepts/mantis): verifica live prima e dopo per bug che
  richiedono trasporti reali, screenshot del browser, stato VM ed evidenza PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno alias
di script `pnpm qa:*`; entrambe le forme sono supportate.

| Comando                                             | Scopo                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Self-check QA incluso senza `--qa-profile`; runner del profilo di maturità basato sulla tassonomia con `--qa-profile smoke-ci`, `--qa-profile release` o `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Esegue scenari basati sul repository contro la lane del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                                                                                                                  |
| `qa coverage`                                       | Stampa l'inventario della copertura degli scenari YAML (`--json` per output macchina).                                                                                                                                                                                               |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentica, oppure usa `--runtime-axis --token-efficiency` per scrivere report di parità runtime Codex-vs-OpenClaw e di efficienza token da un riepilogo di coppia runtime.                                         |
| `qa character-eval`                                 | Esegue lo scenario QA del personaggio su più modelli live con un report giudicato. Vedi [Reportistica](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Esegue un prompt una tantum contro la lane del provider/modello selezionata.                                                                                                                                                                                                          |
| `qa ui`                                             | Avvia la UI di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Compila l'immagine Docker QA prebaked.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + lane Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Compila il sito QA, avvia lo stack basato su Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole dello scenario.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool condiviso di credenziali Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Lane di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [QA Matrix](/it/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Lane di trasporto live contro un gruppo Telegram privato reale.                                                                                                                                                                                                              |
| `qa discord`                                        | Lane di trasporto live contro un canale guild Discord privato reale.                                                                                                                                                                                                       |
| `qa slack`                                          | Lane di trasporto live contro un canale Slack privato reale.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Lane di trasporto live contro account WhatsApp Web reali.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Runner di verifica prima e dopo per bug dei trasporti live, con evidenza di reazioni di stato Discord, smoke desktop/browser Crabbox e smoke Slack-in-VNC. Vedi [Mantis](/it/concepts/mantis) e [Runbook Mantis Slack Desktop](/it/concepts/mantis-slack-desktop-runbook). |

`qa run` basato su profilo legge l'appartenenza da `taxonomy.yaml`, poi instrada
gli scenari risolti tramite `qa suite`. `--surface` e
`--category` filtrano il profilo selezionato invece di definire lane separate.
Il `qa-evidence.json` risultante include un riepilogo scorecard del profilo con
conteggi delle categorie selezionate e ID di copertura mancanti; le singole
voci di evidenza rimangono la fonte di verità per test, ruoli di copertura e risultati.
Gli ID di copertura delle funzionalità della tassonomia sono target di prova esatti,
non alias. La copertura dello scenario primaria soddisfa gli ID corrispondenti;
la copertura secondaria resta consultiva.
Gli ID di copertura usano la forma puntata `namespace.behavior` con segmenti
alfanumerici/trattini minuscoli; gli ID di profilo, superficie e categoria possono
ancora usare gli ID di tassonomia esistenti con trattini o puntati.
L'evidenza snella omette `execution` per voce e imposta `evidenceMode: "slim"`;
`smoke-ci` usa slim per impostazione predefinita, e `--evidence-mode full` ripristina le voci complete:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Usa `smoke-ci` per prove di profilo deterministiche con provider di modelli mock e
server provider locali Crabline. Usa `release` per prove Stable/LTS contro canali
live. Usa `all` solo per esecuzioni esplicite di evidenza sull'intera tassonomia;
seleziona ogni categoria di maturità attiva e può essere instradato tramite il workflow
`QA Profile Evidence` con `qa_profile=all`. Quando un comando richiede anche un
profilo root OpenClaw, metti il profilo root prima del comando QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flusso operatore

L'attuale flusso operatore QA è un sito QA a due pannelli:

- Sinistra: dashboard Gateway (Control UI) con l'agente.
- Destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguilo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la lane Gateway basata su Docker ed espone la
pagina QA Lab dove un operatore o un ciclo di automazione può assegnare
all'agente una missione QA, osservare il comportamento reale del canale e
registrare cosa ha funzionato, cosa è fallito o cosa è rimasto bloccato.

Per iterazioni più rapide della UI QA Lab senza ricompilare ogni volta l'immagine Docker,
avvia lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e monta tramite bind
`extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle a ogni modifica, e il browser si ricarica automaticamente quando
cambia l'hash degli asset QA Lab.

Per uno smoke locale del segnale OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Quello script avvia un ricevitore OTLP/HTTP locale, esegue lo scenario QA
`otel-trace-smoke` con il plugin `diagnostics-otel` abilitato, poi verifica che tracce,
metriche e log siano esportati. Decodifica gli span di traccia protobuf esportati
e controlla la forma critica per la release:
`openclaw.run`, `openclaw.harness.run`, uno span di chiamata modello con l'ultima
convenzione semantica GenAI, `openclaw.context.assembled` e `openclaw.message.delivery`
devono essere presenti. Lo smoke forza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, quindi lo span di chiamata
modello deve usare il nome `{gen_ai.operation.name} {gen_ai.request.model}`;
le chiamate modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono restare fuori dalla traccia. I payload OTLP grezzi
non devono contenere il sentinel del prompt, il sentinel della risposta o la chiave di sessione QA.
Scrive `otel-smoke-summary.json` accanto agli artifact della suite QA.

Per uno smoke OpenTelemetry basato su collector, esegui:

```bash
pnpm qa:otel:collector-smoke
```

Quella lane mette un container Docker OpenTelemetry Collector reale davanti allo
stesso ricevitore locale. Usala quando modifichi il cablaggio degli endpoint, la
compatibilità del collector o il comportamento di esportazione OTLP che il ricevitore in-process potrebbe mascherare.

Per lo smoke di scrape Prometheus protetto, esegui:

```bash
pnpm qa:prometheus:smoke
```

Quell'alias esegue lo scenario QA `docker-prometheus-smoke` con
`diagnostics-prometheus` abilitato, verifica che gli scrape non autenticati vengano rifiutati,
quindi controlla che lo scrape autenticato includa famiglie di metriche critiche
per il rilascio senza contenuto dei prompt, contenuto delle risposte, identificatori
diagnostici grezzi, token di autenticazione o percorsi locali.

Per eseguire entrambi gli smoke di osservabilità in sequenza, usa:

```bash
pnpm qa:observability:smoke
```

Per la lane OpenTelemetry supportata dal collector più lo smoke dello scrape
Prometheus protetto, usa:

```bash
pnpm qa:observability:collector-smoke
```

La QA di osservabilità rimane solo per checkout sorgente. Il tarball npm omette
intenzionalmente QA Lab, quindi le lane Docker di rilascio del pacchetto non eseguono
comandi `qa`. Usa `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` oppure
`pnpm qa:observability:smoke` da un checkout sorgente compilato quando modifichi
la strumentazione diagnostica.

Per una lane smoke Matrix con trasporto reale che non richiede credenziali del
provider del modello, esegui il profilo rapido con il provider OpenAI mock
deterministico:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Per la lane del provider live-frontier, fornisci esplicitamente credenziali
compatibili con OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Il riferimento completo della CLI, il catalogo profili/scenari, le variabili di ambiente e la disposizione degli artefatti per questa lane sono in [QA Matrix](/it/concepts/qa-matrix). In breve: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/observer, esegue il vero plugin Matrix dentro un gateway QA figlio limitato a quel trasporto (senza `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artefatto degli eventi osservati e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Gli scenari coprono comportamenti di trasporto che i test unitari non possono provare end-to-end: gating delle menzioni, policy allow-bot, allowlist, risposte di primo livello e in thread, routing DM, gestione delle reazioni, soppressione delle modifiche in ingresso, deduplica del replay dopo riavvio, recupero da interruzione dell'homeserver, consegna dei metadati di approvazione, gestione dei media e flussi di bootstrap/recupero/verifica Matrix E2EE. Il profilo CLI E2EE esegue anche `openclaw matrix encryption setup` e i comandi di verifica tramite lo stesso homeserver usa e getta prima di controllare le risposte del Gateway.

Discord ha anche scenari Mantis solo opt-in per la riproduzione di bug. Usa
`--scenario discord-status-reactions-tool-only` per la timeline esplicita delle reazioni di stato,
oppure `--scenario discord-thread-reply-filepath-attachment` per creare un
vero thread Discord e verificare che `message.thread-reply` preservi un allegato
`filePath`. Questi scenari restano fuori dalla lane Discord live predefinita
perché sono probe di riproduzione prima/dopo anziché copertura smoke ampia.
Il workflow Mantis per gli allegati nei thread può anche aggiungere un video
testimone da Discord Web con utente autenticato quando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` è configurato nell'ambiente QA.
Quel profilo viewer serve solo per la cattura visiva; la decisione pass/fail
arriva comunque dall'oracolo REST di Discord.

CI usa la stessa superficie di comando in `.github/workflows/qa-live-transports-convex.yml`.
Le esecuzioni pianificate e manuali predefinite eseguono il profilo Matrix rapido con
credenziali live-frontier fornite dalla QA, `--fast` e
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Il valore manuale `matrix_profile=all` si
espande nei cinque shard di profilo.

Per le lane smoke con trasporto reale Telegram, Discord, Slack e WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Hanno come target un canale reale preesistente con due bot o account (driver + SUT). Le variabili di ambiente richieste, gli elenchi di scenari, gli artefatti di output e il pool di credenziali Convex sono documentati nel [riferimento QA per Telegram, Discord, Slack e WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) qui sotto.

Per un'esecuzione completa della VM desktop Slack con recupero VNC, esegui:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Quel comando prende in lease una macchina desktop/browser Crabbox, esegue la lane Slack live
dentro la VM, apre Slack Web nel browser VNC, cattura il desktop e
copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`
quando la cattura video è disponibile nella directory degli artefatti Mantis. I lease
desktop/browser Crabbox forniscono in anticipo gli strumenti di cattura e i pacchetti helper
per browser/build nativa, quindi lo scenario dovrebbe installare fallback solo su lease
più vecchi. Mantis riporta i tempi totali e per fase in
`mantis-slack-desktop-smoke-report.md` così le esecuzioni lente mostrano se il tempo è andato in
riscaldamento del lease, acquisizione delle credenziali, configurazione remota o copia degli artefatti. Riusa
`--lease-id <cbx_...>` dopo aver effettuato l'accesso a Slack Web manualmente tramite VNC;
i lease riutilizzati mantengono caldo anche lo store pnpm di Crabbox. Il valore predefinito
`--hydrate-mode source` verifica da un checkout sorgente ed esegue installazione/build
dentro la VM. Usa `--hydrate-mode prehydrated` solo quando il workspace remoto riutilizzato
ha già `node_modules` e un `dist/` compilato; quella modalità salta il costoso passaggio
installazione/build e fallisce in modo chiuso quando il workspace non è pronto.
Con `--gateway-setup`, Mantis lascia un Gateway Slack OpenClaw persistente
in esecuzione dentro la VM sulla porta `38973`; senza di esso, il comando esegue la normale
lane QA Slack bot-to-bot ed esce dopo la cattura degli artefatti.

Per provare l'interfaccia di approvazione nativa di Slack con evidenza desktop, esegui la modalità
checkpoint di approvazione Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Questa modalità è mutuamente esclusiva con `--gateway-setup`. Esegue gli scenari di
approvazione Slack, rifiuta gli id scenario non di approvazione, attende a ogni stato di
approvazione in sospeso e risolto, renderizza il messaggio Slack API osservato in
`approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png`, quindi fallisce se qualunque checkpoint,
evidenza del messaggio, acknowledgement o screenshot renderizzato è mancante o vuoto.
I lease CI a freddo possono ancora mostrare l'accesso a Slack in `slack-desktop-smoke.png`; le
immagini dei checkpoint di approvazione sono la prova visiva per questa lane.

La checklist dell'operatore, il comando di dispatch del workflow GitHub, il contratto dei commenti
di evidenza, la tabella decisionale hydrate-mode, l'interpretazione dei tempi e i passaggi di
gestione degli errori sono nel [Runbook desktop Mantis Slack](/it/concepts/mantis-slack-desktop-runbook).

Per un'attività desktop in stile agente/CV, esegui:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` prende in lease o riusa una macchina desktop/browser Crabbox, avvia
`crabbox record --while`, guida il browser visibile tramite un
`visual-driver` annidato, cattura `visual-task.png`, esegue `openclaw infer image describe`
sullo screenshot quando `--vision-mode image-describe` è selezionato, e
scrive `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e `mantis-visual-task-report.md`.
Quando `--expect-text` è impostato, il prompt di visione richiede un verdetto JSON
strutturato e passa solo quando il modello segnala evidenza visibile positiva; una
risposta negativa che si limita a citare il testo target fallisce l'asserzione.
Usa `--vision-mode metadata` per uno smoke senza modello che prova il cablaggio di desktop,
browser, screenshot e video senza chiamare un provider di comprensione delle immagini.
La registrazione è un artefatto obbligatorio per `visual-task`; se Crabbox non registra
un `visual-task.mp4` non vuoto, l'attività fallisce anche quando il visual driver
è passato. In caso di errore, Mantis mantiene il lease per VNC a meno che l'attività non fosse già
passata e `--keep-lease` non fosse impostato.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'ambiente del broker Convex, valida le impostazioni degli endpoint e verifica la raggiungibilità admin/list quando il segreto maintainer è presente. Riporta solo lo stato impostato/mancante per i segreti.

## Copertura del trasporto live

Le lane di trasporto live condividono un unico contratto invece di inventare ognuna la propria forma di elenco scenari. `qa-channel` è la suite sintetica ampia del comportamento di prodotto e non fa parte della matrice di copertura dei trasporti live.

I runner di trasporto live dovrebbero importare gli id scenario condivisi, gli helper di
copertura baseline e l'helper di selezione scenari da
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Lane     | Canary | Gating menzioni | Bot-to-bot | Blocco allowlist | Risposta primo livello | Risposta citata | Ripresa dopo riavvio | Follow-up thread | Isolamento thread | Osservazione reazioni | Comando help | Registrazione comando nativo |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

Questo mantiene `qa-channel` come suite ampia del comportamento di prodotto mentre Matrix,
Telegram e gli altri trasporti live condividono un'unica checklist esplicita del contratto di trasporto.

Per una lane VM Linux usa e getta senza portare Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
dentro il guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riusa lo stesso comportamento di selezione scenari di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono più scenari selezionati in parallelo
con worker Gateway isolati per impostazione predefinita. `qa-channel` usa per impostazione predefinita concorrenza
4, limitata dal conteggio degli scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Usa `--pack personal-agent` per eseguire il pacchetto benchmark dell'assistente personale. Il
selettore del pacchetto è additivo con flag `--scenario` ripetuti: gli scenari espliciti
vengono eseguiti prima, poi gli scenari del pacchetto vengono eseguiti nell'ordine del pacchetto con i duplicati rimossi.
Usa `--pack observability` quando un runner QA personalizzato fornisce già la
configurazione del collector OpenTelemetry e vuole selezionare insieme gli scenari smoke di diagnostica
OpenTelemetry e Prometheus.
Il comando esce con codice diverso da zero quando qualunque scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, percorso di configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la radice del repository così il guest
può scrivere di nuovo tramite il workspace montato.

## Riferimento QA per Telegram, Discord, Slack e WhatsApp

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) a causa del numero di scenari e del provisioning di homeserver supportato da Docker. Telegram, Discord, Slack e WhatsApp vengono eseguiti su trasporti reali preesistenti, quindi il loro riferimento si trova qui.

### Flag CLI condivisi

Questi percorsi si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                       | Descrizione                                                                                                                                          |
| ------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Esegue solo questo scenario. Ripetibile.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Dove vengono scritti report, riepiloghi, evidenze, artefatti specifici del trasporto e log di output. I percorsi relativi sono risolti rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                   | Root del repository quando l'invocazione avviene da una cwd neutra.                                                                                  |
| `--sut-account <id>`                  | `sut`                                             | ID account temporaneo nella configurazione del Gateway QA.                                                                                           |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` o `live-frontier` (il legacy `live-openai` funziona ancora).                                                                           |
| `--model <ref>` / `--alt-model <ref>` | valore predefinito del provider                   | Riferimenti al modello primario/alternativo.                                                                                                         |
| `--fast`                              | disattivato                                       | Modalità rapida del provider, dove supportata.                                                                                                       |
| `--credential-source <env\|convex>`   | `env`                                             | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, altrimenti `maintainer`               | Ruolo usato quando `--credential-source convex`.                                                                                                     |

Ogni percorso termina con codice diverso da zero in caso di scenario non riuscito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Punta a un vero gruppo privato Telegram con due bot distinti (driver + SUT). Il bot SUT deve avere un nome utente Telegram; l'osservazione bot-to-bot funziona al meglio quando entrambi i bot hanno **Bot-to-Bot Communication Mode** abilitata in `@BotFather`.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID chat numerico (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

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

Il set predefinito implicito copre sempre canary, controllo delle menzioni, risposte ai comandi nativi, indirizzamento dei comandi e risposte di gruppo bot-to-bot. I valori predefiniti di `mock-openai` includono anche controlli deterministici su catena di risposte e streaming del messaggio finale. `telegram-current-session-status-tool` resta opt-in perché è stabile solo quando viene eseguito in thread direttamente dopo canary, non dopo risposte arbitrarie a comandi nativi. Usa `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` per stampare l'attuale suddivisione predefinita/opzionale con riferimenti di regressione.

Artefatti di output:

- `telegram-qa-report.md`
- `qa-evidence.json` - voci di evidenza per i controlli del trasporto live, inclusi campi profilo, copertura, provider, canale, artefatti, risultato e RTT.

Le esecuzioni Telegram del pacchetto usano lo stesso contratto di credenziali Telegram. La misurazione RTT ripetuta fa parte del normale percorso live Telegram del pacchetto; la distribuzione RTT viene incorporata in `qa-evidence.json` sotto `result.timing` per il controllo RTT selezionato.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Quando `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` è impostato, il wrapper live del pacchetto prende in lease una credenziale `kind: "telegram"`, esporta l'env del gruppo/driver/bot SUT in lease nell'esecuzione del pacchetto installato, invia heartbeat del lease e lo rilascia allo spegnimento. Il wrapper del pacchetto usa per impostazione predefinita 20 controlli RTT di `telegram-mentioned-message-reply`, un timeout RTT di 30 s e il ruolo Convex `maintainer` fuori dalla CI quando Convex è selezionato. Sovrascrivi `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` per regolare la misurazione RTT senza creare un comando RTT separato o un formato di riepilogo specifico per Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Punta a un vero canale di guild Discord privato con due bot: un bot driver controllato dall'ambiente di test e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord in bundle. Verifica la gestione delle menzioni nel canale, che il bot SUT abbia registrato il comando nativo `/help` con Discord e gli scenari di evidenza Mantis opt-in.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corrispondere all'ID utente del bot SUT restituito da Discord (altrimenti il percorso fallisce rapidamente).

Opzionale:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleziona il canale vocale/stage per `discord-voice-autojoin`; senza di esso, lo scenario sceglie il primo canale vocale/stage visibile al bot SUT.

Scenari (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scenario vocale opt-in. Viene eseguito da solo, abilita `channels.discord.voice.autoJoin` e verifica che lo stato vocale Discord corrente del bot SUT sia il canale vocale/stage di destinazione. Le credenziali Convex Discord possono includere `voiceChannelId` opzionale; altrimenti il runner scopre il primo canale vocale/stage visibile nella guild.
- `discord-status-reactions-tool-only` - scenario Mantis opt-in. Viene eseguito da solo perché porta il SUT su risposte di guild sempre attive e solo strumenti con `messages.statusReactions.enabled=true`, poi acquisisce una timeline delle reazioni REST più artefatti visivi HTML/PNG. I report Mantis prima/dopo preservano anche gli artefatti MP4 forniti dallo scenario come `baseline.mp4` e `candidate.mp4`.

Esegui esplicitamente lo scenario Discord di ingresso automatico nel canale vocale:

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
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Artefatti di output:

- `discord-qa-report.md`
- `qa-evidence.json` - voci di evidenza per i controlli del trasporto live.
- `discord-qa-observed-messages.json` - corpi oscurati salvo `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando viene eseguito lo scenario delle reazioni di stato.

### QA Slack

```bash
pnpm openclaw qa slack
```

Punta a un vero canale Slack privato con due bot distinti: un bot driver controllato dall'ambiente di test e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Slack in bundle.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opzionale:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` abilita checkpoint di approvazione visivi per Mantis. Il runner scrive `<scenario>.pending.json` e `<scenario>.resolved.json`, quindi attende i file `.ack.json` corrispondenti.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` sovrascrive il timeout di riconoscimento del checkpoint. Il valore predefinito è `120000`.

Scenari (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - scenario di approvazione exec nativa Slack opt-in. Richiede un'approvazione exec tramite il Gateway, verifica che il messaggio Slack abbia pulsanti di approvazione nativi, la risolve e verifica l'aggiornamento Slack risolto.
- `slack-approval-plugin-native` - scenario di approvazione Plugin nativa Slack opt-in. Abilita insieme l'inoltro delle approvazioni exec e Plugin in modo che gli eventi Plugin non vengano soppressi dal routing delle approvazioni exec, quindi verifica lo stesso percorso UI Slack nativo in sospeso/risolto.

Artefatti di output:

- `slack-qa-report.md`
- `qa-evidence.json` - voci di evidenza per i controlli del trasporto live.
- `slack-qa-observed-messages.json` - corpi oscurati salvo `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - solo quando Mantis imposta `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contiene JSON dei checkpoint, JSON di riconoscimento e screenshot in sospeso/risolti.

#### Configurazione del workspace Slack

Il percorso richiede due app Slack distinte in un workspace, più un canale di cui entrambi i bot siano membri:

- `channelId` - l'ID `Cxxxxxxxxxx` di un canale a cui entrambi i bot sono stati invitati. Usa un canale dedicato; il percorso pubblica a ogni esecuzione.
- `driverBotToken` - token bot (`xoxb-...`) dell'app **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) dell'app **SUT**, che deve essere un'app Slack separata dal driver in modo che il suo ID utente bot sia distinto.
- `sutAppToken` - token a livello di app (`xapp-...`) dell'app SUT con `connections:write`, usato da Socket Mode affinché l'app SUT possa ricevere eventi.

Preferisci un workspace Slack dedicato alla QA rispetto al riuso di un workspace di produzione.

Il manifesto SUT seguente restringe intenzionalmente l'installazione di produzione del Plugin Slack in bundle (`extensions/slack/src/setup-shared.ts:10`) alle autorizzazioni e agli eventi coperti dalla suite QA Slack live. Per la configurazione del canale di produzione così come la vedono gli utenti, vedi [configurazione rapida del canale Slack](/it/channels/slack#quick-setup); la coppia Driver/SUT per QA è intenzionalmente separata perché il percorso richiede due ID utente bot distinti in un workspace.

**1. Crea l'app Driver**

Vai su [api.slack.com/apps](https://api.slack.com/apps) → _Crea nuova app_ → _Da un manifesto_ → scegli il workspace QA, incolla il manifesto seguente, poi _Installa nel workspace_:

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

Copia il _Token OAuth utente bot_ (`xoxb-...`): diventa `driverBotToken`. Al driver serve solo pubblicare messaggi e identificarsi; nessun evento, nessuna Socket Mode.

**2. Crea l'app SUT**

Ripeti _Crea nuova app → Da un manifesto_ nello stesso workspace. Questa app QA usa intenzionalmente una versione più ristretta del manifesto di produzione del Plugin Slack in bundle (`extensions/slack/src/setup-shared.ts:10`): gli ambiti e gli eventi di reazione sono omessi perché la suite QA Slack live non copre ancora la gestione delle reazioni.

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

- _Installa nel workspace_ → copia il _Token OAuth utente bot_ → diventa `sutBotToken`.
- _Informazioni di base → Token a livello app → Genera token e ambiti_ → aggiungi l'ambito `connections:write` → salva → copia il valore `xapp-...` → diventa `sutAppToken`.

Verifica che i due bot abbiano ID utente distinti chiamando `auth.test` su ciascun token. Il runtime distingue driver e SUT tramite ID utente; riutilizzare una sola app per entrambi farà fallire immediatamente il gating delle menzioni.

**3. Crea il canale**

Nel workspace QA, crea un canale (ad esempio `#openclaw-qa`) e invita entrambi i bot dall'interno del canale:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia l'ID `Cxxxxxxxxxx` da _informazioni canale → Informazioni → ID canale_: diventa `channelId`. Va bene un canale pubblico; se usi un canale privato, entrambe le app hanno già `groups:history`, quindi le letture della cronologia dell'harness riusciranno comunque.

**4. Registra le credenziali**

Due opzioni. Usa le variabili d'ambiente per il debug su una singola macchina (imposta le quattro variabili `OPENCLAW_QA_SLACK_*` e passa `--credential-source env`), oppure inizializza il pool Convex condiviso in modo che CI e altri maintainer possano prenderle in lease.

Per il pool Convex, scrivi i quattro campi in un file JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Con `OPENCLAW_QA_CONVEX_SITE_URL` e `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` esportate nella shell, registra e verifica:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Atteso: `count: 1`, `status: "active"`, nessun campo `lease`.

**5. Verifica end to end**

Esegui la lane localmente per confermare che entrambi i bot possano comunicare tra loro tramite il broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Un'esecuzione verde completa in molto meno di 30 secondi e `slack-qa-report.md` mostra sia `slack-canary` sia `slack-mention-gating` con stato `pass`. Se la lane resta in sospeso per ~90 secondi ed esce con `Convex credential pool exhausted for kind "slack"`, il pool è vuoto oppure ogni riga è in lease: `qa credentials list --kind slack --status all --json` ti dirà quale dei due casi.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Ha come target due account WhatsApp Web dedicati: un account driver controllato
dall'harness e un account SUT avviato dal Gateway OpenClaw figlio tramite il
Plugin WhatsApp in bundle.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opzionali:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` abilita scenari di gruppo come
  `whatsapp-mention-gating` e `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` conserva i corpi dei messaggi negli
  artefatti dei messaggi osservati.

Catalogo scenari (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline e gating di gruppo: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Comandi nativi: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamento di risposta e output finale: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Media in ingresso e messaggi strutturati: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Questi inviano veri eventi WhatsApp di immagine, audio,
  documento, posizione, contatto e sticker tramite il driver.
- Copertura di Gateway in uscita e azioni messaggio:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Copertura del controllo accessi: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Approvazioni native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reazioni di stato: `whatsapp-status-reactions`.

Il catalogo contiene attualmente 36 scenari. La lane predefinita `live-frontier` è
mantenuta piccola, con 10 scenari, per una copertura smoke rapida. La lane predefinita
`mock-openai` esegue 31 scenari deterministici tramite il trasporto WhatsApp reale,
mockando solo l'output del modello. Gli scenari di approvazione e alcuni controlli
più pesanti/bloccanti restano espliciti per ID scenario.

Il driver QA WhatsApp osserva eventi live strutturati (`text`, `media`,
`location`, `reaction` e `poll`) e può inviare attivamente media, poll,
contatti, posizioni e sticker. QA Lab importa quel driver tramite la superficie
del pacchetto `@openclaw/whatsapp/api.js` invece di accedere ai file privati
del runtime WhatsApp. Il contenuto dei messaggi è redatto per impostazione predefinita. La copertura di
poll in uscita e caricamento file passa tramite chiamate Gateway deterministiche `poll` e
`message.action` invece che tramite invocazione di strumenti solo da prompt modello.

Artefatti di output:

- `whatsapp-qa-report.md`
- `qa-evidence.json`: voci di evidenza per i controlli del trasporto live.
- `whatsapp-qa-observed-messages.json`: corpi redatti salvo `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool di credenziali Convex

Le lane Telegram, Discord, Slack e WhatsApp possono prendere in lease credenziali da un pool Convex condiviso invece di leggere le variabili d'ambiente sopra. Passa `--credential-source convex` (o imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, invia heartbeat per tutta la durata dell'esecuzione e lo rilascia allo spegnimento. I tipi del pool sono `"telegram"`, `"discord"`, `"slack"` e `"whatsapp"`.

Shape dei payload che il broker valida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }`: `groupId` deve essere una stringa chat-id numerica.
- Utente reale Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`: solo proof Mantis Telegram Desktop. Le lane generiche QA Lab non devono acquisire questo tipo.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`: i numeri di telefono devono essere stringhe E.164 distinte.

Il workflow di proof Mantis Telegram Desktop mantiene un lease Convex esclusivo
`telegram-user` sia per il driver CLI TDLib sia per il witness Telegram Desktop,
poi lo rilascia dopo la pubblicazione del proof.

Quando una PR richiede un diff visivo deterministico, Mantis può usare la stessa
risposta modello mock su `main` e sulla testa della PR mentre cambiano il formatter
Telegram o il layer di consegna. I valori predefiniti di cattura sono calibrati per
i commenti PR: classe Crabbox standard, registrazione desktop a 24 fps, GIF di movimento
a 24 fps e larghezza anteprima di 1920 px. I commenti prima/dopo dovrebbero pubblicare
un bundle pulito che contiene solo le GIF previste.

Anche le lane Slack possono usare il pool. I controlli della shape del payload Slack attualmente vivono nel runner QA Slack invece che nel broker; usa `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, con un ID canale Slack come `Cxxxxxxxxxx`. Vedi [Configurare il workspace Slack](#setting-up-the-slack-workspace) per il provisioning di app e ambiti.

Le variabili d'ambiente operative e il contratto dell'endpoint del broker Convex sono in [Testing → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il pool multi-canale; la semantica di lease è condivisa tra i tipi).

## Seed supportati dal repo

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Sono intenzionalmente in git in modo che il piano QA sia visibile sia agli esseri umani sia
all'agente.

`qa-lab` dovrebbe restare un runner generico di scenari YAML. Ogni file YAML di scenario è
la fonte di verità per una singola esecuzione di test e dovrebbe definire:

- `title` di primo livello
- metadati `scenario`
- metadati opzionali di categoria, capability, lane e rischio in `scenario`
- riferimenti a documentazione e codice in `scenario`
- requisiti Plugin opzionali in `scenario`
- patch opzionale della configurazione Gateway in `scenario`
- `flow` eseguibile di primo livello per gli scenari di flusso, oppure `scenario.execution.kind` /
  `scenario.execution.path` per scenari Vitest e Playwright

La superficie runtime riutilizzabile che supporta `flow` può rimanere generica
e trasversale. Ad esempio, gli scenari YAML possono combinare helper lato trasporto
con helper lato browser che controllano la Control UI incorporata attraverso il
punto di integrazione Gateway `browser.request`, senza aggiungere un runner speciale.

I file di scenario devono essere raggruppati per capacità di prodotto invece che
per cartella dell'albero dei sorgenti. Mantieni stabili gli ID degli scenari quando i file vengono spostati; usa `docsRefs` e `codeRefs`
per la tracciabilità dell'implementazione.

L'elenco di base deve rimanere sufficientemente ampio da coprire:

- chat DM e di canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback cron
- richiamo della memoria
- cambio di modello
- passaggio a subagente
- lettura del repository e della documentazione
- un piccolo task di build come Lobster Invaders

## Lane mock dei provider

`qa suite` ha due lane locali di mock dei provider:

- `mock-openai` è il mock OpenClaw consapevole degli scenari. Rimane la lane mock
  deterministica predefinita per QA basata su repository e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo,
  fixture, registrazione/riproduzione e caos. È additiva e non
  sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle lane provider si trova sotto `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri default, l'avvio del server locale, la configurazione del modello del gateway,
le esigenze di staging del profilo di autenticazione e i flag di capacità live/mock. Il codice condiviso della suite e del
gateway deve instradare attraverso il registro dei provider invece di diramarsi sui
nomi dei provider.

## Adattatori di trasporto

`qa-lab` possiede un punto di integrazione di trasporto generico per gli scenari QA YAML. `qa-channel` è
il default sintetico. `crabline` avvia server locali con forma da provider ed esegue
i normali plugin di canale di OpenClaw contro di essi. `live` è riservato a credenziali
provider reali e canali esterni.

A livello architetturale, la suddivisione è:

- `qa-lab` possiede l'esecuzione generica degli scenari, la concorrenza dei worker, la scrittura degli artefatti e la reportistica.
- L'adattatore di trasporto possiede la configurazione del gateway, la readiness, l'osservazione in ingresso e in uscita, le azioni di trasporto e lo stato di trasporto normalizzato.
- I file di scenario YAML sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiungere un canale

Aggiungere un canale al sistema QA YAML richiede l'implementazione del canale più
un pacchetto di scenari che eserciti il contratto del canale. Per la copertura smoke in CI, aggiungi
il server provider locale Crabline corrispondente ed esponilo tramite il driver `crabline`.

Non aggiungere una nuova radice di comando QA di primo livello quando l'host condiviso `qa-lab` può possedere il flusso.

`qa-lab` possiede i meccanismi dell'host condiviso:

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
- come vengono iniettati gli eventi in ingresso
- come vengono osservati i messaggi in uscita
- come vengono esposti i transcript e lo stato di trasporto normalizzato
- come vengono eseguite le azioni supportate dal trasporto
- come viene gestito il reset o la pulizia specifica del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come proprietario della radice condivisa `qa`.
2. Implementa il runner di trasporto sul punto di integrazione dell'host condiviso `qa-lab`.
3. Mantieni i meccanismi specifici del trasporto dentro il plugin runner o l'harness del canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando radice concorrente. I plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni `runtime-api.ts` leggero; CLI lazy ed esecuzione del runner devono restare dietro entrypoint separati.
5. Crea o adatta scenari YAML sotto le directory tematiche `qa/scenarios/`.
6. Usa gli helper generici di scenario per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, salvo che il repository stia eseguendo una migrazione intenzionale.

La regola decisionale è rigida:

- Se il comportamento può essere espresso una sola volta in `qa-lab`, mettilo in `qa-lab`.
- Se il comportamento dipende da un trasporto di canale, mantienilo in quel plugin runner o harness del plugin.
- Se uno scenario richiede una nuova capacità che più di un canale può usare, aggiungi un helper generico invece di una diramazione specifica del canale in `suite.ts`.
- Se un comportamento è significativo solo per un trasporto, mantieni lo scenario specifico del trasporto e rendilo esplicito nel contratto dello scenario.

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

Gli alias di compatibilità rimangono disponibili per gli scenari esistenti - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ma la creazione di nuovi scenari deve usare i nomi generici. Gli alias esistono per evitare una migrazione simultanea obbligatoria, non come modello futuro.

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline del bus osservata.
Il report deve rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili - utile quando si dimensiona il lavoro di follow-up o si collega un nuovo trasporto - esegui `pnpm openclaw qa coverage` (aggiungi `--json` per output leggibile da macchina).
Quando scegli una prova mirata per un comportamento o percorso file toccato, esegui `pnpm openclaw qa coverage --match <query>`.
Il report di corrispondenza cerca nei metadati degli scenari, nei riferimenti alla documentazione, nei riferimenti al codice, negli ID di copertura, nei plugin e nei requisiti dei provider, quindi stampa i target `qa suite --scenario ...` corrispondenti.
Ogni esecuzione di `qa suite` scrive gli artefatti di primo livello `qa-evidence.json`,
`qa-suite-summary.json` e `qa-suite-report.md` per l'insieme di scenari selezionato.
Gli scenari che dichiarano `execution.kind: vitest` o
`execution.kind: playwright` eseguono il percorso di test corrispondente e scrivono anche
log per scenario. Gli scenari che dichiarano `execution.kind: script` eseguono il
produttore di evidenze in `execution.path` tramite `node --import tsx` (con
`${outputDir}` e `${scenarioId}` espansi in `execution.args`); il produttore
scrive il proprio `qa-evidence.json`, le cui voci vengono importate nell'output
della suite e i cui percorsi degli artefatti vengono risolti in modo relativo a quel
`qa-evidence.json` del produttore. Quando `qa suite` viene raggiunto tramite
`qa run --qa-profile`, lo stesso `qa-evidence.json` include anche il riepilogo
della scorecard del profilo per le categorie di tassonomia selezionate.
Trattalo come un aiuto alla scoperta, non come un sostituto dei gate; lo scenario selezionato richiede comunque la modalità provider, il trasporto live, Multipass, Testbox o la lane di release corretti per il comportamento sotto test.
Per il contesto della scorecard, vedi [Scorecard di maturità](/it/maturity/scorecard).

Per controlli di carattere e stile, esegui lo stesso scenario su più riferimenti di modello live
e scrivi un report Markdown valutato:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Il comando esegue processi figli del gateway QA locale, non Docker. Gli scenari di valutazione del carattere
devono impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente
come chat, aiuto sul workspace e piccoli task sui file. Al modello candidato non deve
essere detto che è in valutazione. Il comando conserva ogni transcript completo,
registra statistiche di base dell'esecuzione, quindi chiede ai modelli giudice in modalità veloce con
ragionamento `xhigh` dove supportato di classificare le esecuzioni per naturalezza, atmosfera e umorismo.
Usa `--blind-judge-models` quando confronti provider: il prompt del giudice riceve comunque
ogni transcript e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con etichette
neutre come `candidate-01`; il report rimappa le classifiche ai riferimenti reali dopo
il parsing.
Le esecuzioni dei candidati usano per default il ragionamento `high`, con `medium` per GPT-5.5 e `xhigh`
per i riferimenti di valutazione OpenAI più vecchi che lo supportano. Sovrascrivi un candidato specifico inline con
`--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un
fallback globale, e la forma più vecchia `--model-thinking <provider/model=level>` viene
mantenuta per compatibilità.
I riferimenti dei candidati OpenAI usano per default la modalità veloce, così viene usata
l'elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un
singolo candidato o giudice richiede una sovrascrittura. Passa `--fast` solo quando vuoi
forzare la modalità veloce per ogni modello candidato. Le durate di candidati e giudici vengono
registrate nel report per l'analisi benchmark, ma i prompt dei giudici dicono esplicitamente
di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per default concorrenza 16. Abbassa
`--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul gateway locale
rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun candidato `--model`, la valutazione del carattere usa per default
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per default
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-8,thinking=high`.

## Documenti correlati

- [Matrice QA](/it/concepts/qa-matrix)
- [Scorecard di maturità](/it/maturity/scorecard)
- [Pacchetto benchmark per agenti personali](/it/concepts/personal-agent-benchmark-pack)
- [Canale QA](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Dashboard](/it/web/dashboard)
