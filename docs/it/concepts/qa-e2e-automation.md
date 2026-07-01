---
read_when:
    - Capire come si integra lo stack QA
    - Estensione di qa-lab, qa-channel o di un adattatore di trasporto
    - Aggiunta di scenari QA basati su repository
    - Costruire automazione QA a maggiore realismo attorno alla dashboard del Gateway
summary: 'Panoramica dello stack QA: qa-lab, qa-channel, scenari basati sul repository, live transport lanes, adattatori di trasporto e reportistica.'
title: Panoramica QA
x-i18n:
    generated_at: "2026-07-01T08:06:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato serve a esercitare OpenClaw in un modo più realistico e
modellato sui canali rispetto a quanto possa fare un singolo unit test.

Componenti attuali:

- `extensions/qa-channel`: canale di messaggi sintetico con superfici per DM,
  canale, thread, reazione, modifica ed eliminazione.
- `extensions/qa-lab`: UI di debug e bus QA per osservare la trascrizione,
  iniettare messaggi in ingresso ed esportare un report Markdown.
- `extensions/qa-matrix`, Plugin runner futuri: adattatori di trasporto live che
  guidano un canale reale dentro un Gateway QA figlio.
- `qa/`: asset seed supportati dal repository per il task di avvio e gli
  scenari QA baseline.
- [Mantis](/it/concepts/mantis): verifica live prima e dopo per bug che richiedono
  trasporti reali, screenshot del browser, stato della VM ed evidenze di PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito sotto `pnpm openclaw qa <subcommand>`. Molti hanno
alias di script `pnpm qa:*`; entrambe le forme sono supportate.

| Comando                                             | Scopo                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverifica QA in bundle senza `--qa-profile`; runner di profili di maturità basato sulla tassonomia con `--qa-profile smoke-ci`, `--qa-profile release` o `--qa-profile all`.                                                                                         |
| `qa suite`                                          | Esegue scenari supportati dal repository contro la corsia del Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` per una VM Linux usa e getta.                                                                                                               |
| `qa coverage`                                       | Stampa l'inventario della copertura degli scenari YAML (`--json` per output macchina).                                                                                                                                                                                  |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` e scrive il report di parità agentico, oppure usa `--runtime-axis --token-efficiency` per scrivere report di parità runtime Codex-vs-OpenClaw ed efficienza dei token da un riepilogo di coppia runtime.                    |
| `qa character-eval`                                 | Esegue lo scenario QA del personaggio su più modelli live con un report giudicato. Vedi [Reportistica](#reporting).                                                                                                                                                     |
| `qa manual`                                         | Esegue un prompt una tantum contro la corsia provider/modello selezionata.                                                                                                                                                                                               |
| `qa ui`                                             | Avvia la UI di debug QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                   |
| `qa docker-build-image`                             | Crea l'immagine Docker QA precostruita.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la dashboard QA + corsia Gateway.                                                                                                                                                                                                |
| `qa up`                                             | Compila il sito QA, avvia lo stack supportato da Docker, stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                   |
| `qa aimock`                                         | Avvia solo il server provider AIMock.                                                                                                                                                                                                                                   |
| `qa mock-openai`                                    | Avvia solo il server provider `mock-openai` consapevole degli scenari.                                                                                                                                                                                                  |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool condiviso di credenziali Convex.                                                                                                                                                                                                                       |
| `qa matrix`                                         | Corsia di trasporto live contro un homeserver Tuwunel usa e getta. Vedi [QA Matrix](/it/concepts/qa-matrix).                                                                                                                                                              |
| `qa telegram`                                       | Corsia di trasporto live contro un vero gruppo privato Telegram.                                                                                                                                                                                                        |
| `qa discord`                                        | Corsia di trasporto live contro un vero canale di guild privata Discord.                                                                                                                                                                                                |
| `qa slack`                                          | Corsia di trasporto live contro un vero canale privato Slack.                                                                                                                                                                                                           |
| `qa whatsapp`                                       | Corsia di trasporto live contro account WhatsApp Web reali.                                                                                                                                                                                                             |
| `qa mantis`                                         | Runner di verifica prima e dopo per bug di trasporto live, con evidenza di reazioni di stato Discord, smoke desktop/browser Crabbox e smoke Slack-in-VNC. Vedi [Mantis](/it/concepts/mantis) e [Runbook Mantis Slack Desktop](/it/concepts/mantis-slack-desktop-runbook). |

`qa run` supportato da profili legge l'appartenenza da `taxonomy.yaml`, quindi
invia gli scenari risolti tramite `qa suite`. `--surface` e
`--category` filtrano il profilo selezionato invece di definire corsie separate.
Il `qa-evidence.json` risultante include un riepilogo della scorecard del
profilo con conteggi delle categorie selezionate e ID di copertura mancanti; le
singole voci di evidenza restano la fonte di verità per i test, i ruoli di
copertura e i risultati. Gli ID di copertura delle feature della tassonomia sono
target di prova esatti, non alias. La copertura primaria degli scenari soddisfa
gli ID corrispondenti; la copertura secondaria resta consultiva. Gli ID di
copertura usano la forma puntata `namespace.behavior` con segmenti minuscoli
alfanumerici/con trattino; gli ID di profilo, superficie e categoria possono
ancora usare gli ID di tassonomia esistenti con trattini o punti.
L'evidenza snella omette `execution` per voce e imposta `evidenceMode: "slim"`;
`smoke-ci` usa slim per impostazione predefinita, e `--evidence-mode full`
ripristina le voci complete:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Usa `smoke-ci` per prove deterministiche di profilo con provider di modelli mock
e server provider locali Crabline. Usa `release` per prove Stable/LTS contro
canali live. Usa `all` solo per esecuzioni esplicite di evidenza sull'intera
tassonomia; seleziona ogni categoria di maturità attiva e può essere inviato
tramite il workflow `QA Profile Evidence` con `qa_profile=all`. Quando un
comando richiede anche un profilo root OpenClaw, metti il profilo root prima del
comando QA:

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

Questo compila il sito QA, avvia la corsia Gateway supportata da Docker ed
espone la pagina QA Lab dove un operatore o un loop di automazione può assegnare
all'agente una missione QA, osservare il comportamento reale del canale e
registrare cosa ha funzionato, cosa non è riuscito o cosa è rimasto bloccato.

Per iterazioni più rapide sulla UI QA Lab senza ricreare ogni volta l'immagine
Docker, avvia lo stack con un bundle QA Lab montato via bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precostruita e monta
via bind `extensions/qa-lab/web/dist` nel container `qa-lab`. `qa:lab:watch`
ricompila quel bundle al cambiamento, e il browser si ricarica automaticamente
quando cambia l'hash degli asset QA Lab.

Per uno smoke locale del segnale OpenTelemetry, esegui:

```bash
pnpm qa:otel:smoke
```

Questo script avvia un receiver OTLP/HTTP locale, esegue lo scenario QA
`otel-trace-smoke` con il Plugin `diagnostics-otel` abilitato, quindi verifica
che tracce, metriche e log siano esportati. Decodifica gli span di traccia
protobuf esportati e controlla la forma critica per il rilascio:
`openclaw.run`, `openclaw.harness.run`, uno span di chiamata modello secondo la
più recente convenzione semantica GenAI, `openclaw.context.assembled` e
`openclaw.message.delivery` devono essere presenti. Lo smoke forza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, quindi lo span di
chiamata modello deve usare il nome `{gen_ai.operation.name} {gen_ai.request.model}`;
le chiamate modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID diagnostici grezzi e
gli attributi `openclaw.content.*` devono restare fuori dalla traccia. I payload
OTLP grezzi non devono contenere il sentinel del prompt, il sentinel della
risposta o la chiave di sessione QA. Scrive `otel-smoke-summary.json` accanto
agli artefatti della suite QA.

Per uno smoke OpenTelemetry supportato da collector, esegui:

```bash
pnpm qa:otel:collector-smoke
```

Quella corsia mette un vero container Docker OpenTelemetry Collector davanti allo
stesso receiver locale. Usala quando modifichi il cablaggio degli endpoint, la
compatibilità del collector o il comportamento di esportazione OTLP che il
receiver in-process potrebbe mascherare.

Per lo smoke di scrape Prometheus protetto, esegui:

```bash
pnpm qa:prometheus:smoke
```

Quell'alias esegue lo scenario QA `docker-prometheus-smoke` con
`diagnostics-prometheus` abilitato, verifica che gli scrape non autenticati vengano rifiutati,
quindi controlla che lo scrape autenticato includa famiglie di metriche critiche per il rilascio
senza contenuto dei prompt, contenuto delle risposte, identificatori diagnostici grezzi, token di
autenticazione o percorsi locali.

Per eseguire entrambi gli smoke di osservabilità in sequenza, usa:

```bash
pnpm qa:observability:smoke
```

Per la corsia OpenTelemetry supportata dal collector più lo smoke dello scrape Prometheus protetto,
usa:

```bash
pnpm qa:observability:collector-smoke
```

La QA di osservabilità rimane solo per checkout del sorgente. Il tarball npm omette
intenzionalmente QA Lab, quindi le corsie di rilascio Docker del pacchetto non eseguono comandi `qa`.
Usa `pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` o
`pnpm qa:observability:smoke` da un checkout del sorgente compilato quando modifichi
la strumentazione diagnostica.

Per una corsia smoke Matrix con trasporto reale che non richiede credenziali del provider del modello,
esegui il profilo rapido con il provider OpenAI mock deterministico:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Per la corsia del provider live-frontier, fornisci esplicitamente credenziali compatibili con OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

Il riferimento CLI completo, il catalogo di profili/scenari, le variabili d'ambiente e il layout degli artefatti per questa corsia si trovano in [QA Matrix](/it/concepts/qa-matrix). In sintesi: effettua il provisioning di un homeserver Tuwunel usa e getta in Docker, registra utenti temporanei driver/SUT/observer, esegue il Plugin Matrix reale dentro un Gateway QA figlio limitato a quel trasporto (senza `qa-channel`), quindi scrive un report Markdown, un riepilogo JSON, un artefatto observed-events e un log di output combinato sotto `.artifacts/qa-e2e/matrix-<timestamp>/`.

Gli scenari coprono comportamenti di trasporto che gli unit test non possono dimostrare end to end: gating delle menzioni, policy allow-bot, allowlist, risposte di primo livello e in thread, routing DM, gestione delle reazioni, soppressione delle modifiche in ingresso, deduplicazione del replay al riavvio, ripristino da interruzione dell'homeserver, consegna dei metadati di approvazione, gestione dei media e flussi di bootstrap/ripristino/verifica Matrix E2EE. Il profilo CLI E2EE esegue anche `openclaw matrix encryption setup` e i comandi di verifica tramite lo stesso homeserver usa e getta prima di controllare le risposte del Gateway.

Discord ha anche scenari opt-in solo Mantis per la riproduzione di bug. Usa
`--scenario discord-status-reactions-tool-only` per la timeline esplicita delle reazioni di stato,
oppure `--scenario discord-thread-reply-filepath-attachment` per creare un
thread Discord reale e verificare che `message.thread-reply` preservi un allegato
`filePath`. Questi scenari restano fuori dalla corsia Discord live predefinita
perché sono sonde di riproduzione prima/dopo invece di una copertura smoke ampia.
Il workflow Mantis per l'allegato nel thread può anche aggiungere un video testimone di Discord Web
con accesso effettuato quando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` è configurato nell'ambiente QA.
Quel profilo viewer serve solo per l'acquisizione visiva; la decisione pass/fail
arriva comunque dall'oracolo REST di Discord.

La CI usa la stessa superficie di comando in `.github/workflows/qa-live-transports-convex.yml`.
Le esecuzioni pianificate e manuali predefinite eseguono il profilo Matrix rapido con
credenziali live-frontier fornite dalla QA, `--fast` e
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. Il `matrix_profile=all` manuale si distribuisce
nei cinque shard di profilo.

Per corsie smoke con trasporto reale Telegram, Discord, Slack e WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Prendono di mira un canale reale preesistente con due bot o account (driver + SUT). Le variabili d'ambiente richieste, gli elenchi di scenari, gli artefatti di output e il pool di credenziali Convex sono documentati nel [riferimento QA per Telegram, Discord, Slack e WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) qui sotto.

Per un'esecuzione VM desktop Slack completa con recupero VNC, esegui:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Quel comando affitta una macchina desktop/browser Crabbox, esegue la corsia live Slack
dentro la VM, apre Slack Web nel browser VNC, acquisisce il desktop e
copia `slack-qa/`, `slack-desktop-smoke.png` e `slack-desktop-smoke.mp4`
quando l'acquisizione video è disponibile nella directory degli artefatti Mantis. I lease
desktop/browser Crabbox forniscono in anticipo gli strumenti di acquisizione e i pacchetti helper
browser/native-build, quindi lo scenario dovrebbe installare fallback solo su lease più vecchi.
Mantis riporta tempi totali e per fase in
`mantis-slack-desktop-smoke-report.md`, così le esecuzioni lente mostrano se il tempo è stato speso in
warmup del lease, acquisizione credenziali, configurazione remota o copia degli artefatti. Riusa
`--lease-id <cbx_...>` dopo aver effettuato manualmente l'accesso a Slack Web tramite VNC;
i lease riutilizzati mantengono anche calda la cache dello store pnpm di Crabbox. Il valore predefinito
`--hydrate-mode source` verifica da un checkout del sorgente ed esegue install/build
dentro la VM. Usa `--hydrate-mode prehydrated` solo quando il workspace remoto riutilizzato
ha già `node_modules` e un `dist/` compilato; quella modalità salta il costoso passaggio
install/build e fallisce in modo chiuso quando il workspace non è pronto.
Con `--gateway-setup`, Mantis lascia un Gateway OpenClaw Slack persistente
in esecuzione dentro la VM sulla porta `38973`; senza, il comando esegue la normale
corsia QA Slack bot-to-bot ed esce dopo l'acquisizione degli artefatti.

Per dimostrare la UI nativa di approvazione Slack con evidenza desktop, esegui la modalità
checkpoint di approvazione Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Questa modalità è mutuamente esclusiva con `--gateway-setup`. Esegue gli scenari di
approvazione Slack, rifiuta gli id scenario non di approvazione, attende a ogni stato di approvazione
pendente e risolto, renderizza il messaggio Slack API osservato in
`approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png`, quindi fallisce se qualsiasi checkpoint,
evidenza del messaggio, conferma o screenshot renderizzato manca o è vuoto.
I lease CI a freddo possono comunque mostrare l'accesso a Slack in `slack-desktop-smoke.png`;
le immagini dei checkpoint di approvazione sono la prova visiva per questa corsia.

La checklist operatore, il comando di dispatch del workflow GitHub, il contratto del commento di evidenza, la tabella decisionale hydrate-mode, l'interpretazione dei tempi e i passaggi di gestione degli errori si trovano nel [Runbook Mantis Slack Desktop](/it/concepts/mantis-slack-desktop-runbook).

Per un'attività desktop in stile agente/CV, esegui:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` affitta o riusa una macchina desktop/browser Crabbox, avvia
`crabbox record --while`, guida il browser visibile tramite un
`visual-driver` annidato, acquisisce `visual-task.png`, esegue `openclaw infer image describe`
sullo screenshot quando `--vision-mode image-describe` è selezionato e
scrive `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e `mantis-visual-task-report.md`.
Quando `--expect-text` è impostato, il prompt di visione richiede un verdetto JSON strutturato
e passa solo quando il modello riporta evidenza visibile positiva; una risposta
negativa che si limita a citare il testo target fallisce l'asserzione.
Usa `--vision-mode metadata` per uno smoke senza modello che dimostra il collegamento tra desktop,
browser, screenshot e video senza chiamare un provider di comprensione immagini.
La registrazione è un artefatto richiesto per `visual-task`; se Crabbox non registra
un `visual-task.mp4` non vuoto, l'attività fallisce anche quando il visual driver
è passato. In caso di errore, Mantis conserva il lease per VNC a meno che l'attività
non fosse già passata e `--keep-lease` non fosse impostato.

Prima di usare credenziali live in pool, esegui:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla l'ambiente del broker Convex, convalida le impostazioni degli endpoint e verifica la raggiungibilità admin/list quando il secret del maintainer è presente. Riporta solo lo stato impostato/mancante per i secret.

## Copertura dei trasporti live

Le corsie di trasporto live condividono un unico contratto invece di inventare ciascuna la propria forma di elenco scenari. `qa-channel` è la suite sintetica ampia per il comportamento del prodotto e non fa parte della matrice di copertura dei trasporti live.

I runner dei trasporti live dovrebbero importare gli id scenario condivisi, gli helper di copertura
baseline e l'helper di selezione scenario da
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Corsia   | Canary | Gating menzioni | Bot-to-bot | Blocco allowlist | Risposta di primo livello | Risposta citata | Ripresa al riavvio | Follow-up thread | Isolamento thread | Osservazione reazioni | Comando help | Registrazione comando nativo |
| -------- | ------ | --------------- | ---------- | ---------------- | ------------------------- | --------------- | ------------------ | ---------------- | ----------------- | --------------------- | ------------ | ----------------------------- |
| Matrix   | x      | x               | x          | x                | x                         |                 | x                  | x                | x                 | x                     |              |                               |
| Telegram | x      | x               | x          |                  |                           |                 |                    |                  |                   |                       | x            |                               |
| Discord  | x      | x               | x          |                  |                           |                 |                    |                  |                   |                       |              | x                             |
| Slack    | x      | x               | x          | x                | x                         |                 | x                  | x                | x                 |                       |              |                               |
| WhatsApp | x      | x               |            | x                | x                         | x               | x                  |                  |                   | x                     | x            |                               |

Questo mantiene `qa-channel` come suite ampia per il comportamento del prodotto mentre Matrix,
Telegram e altri trasporti live condividono una checklist esplicita del contratto di trasporto.

Per una corsia VM Linux usa e getta senza introdurre Docker nel percorso QA, esegui:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un guest Multipass nuovo, installa le dipendenze, compila OpenClaw
dentro il guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host.
Riusa lo stesso comportamento di selezione scenario di `qa suite` sull'host.
Le esecuzioni della suite su host e Multipass eseguono più scenari selezionati in parallelo
con worker Gateway isolati per impostazione predefinita. `qa-channel` usa per impostazione predefinita una concorrenza
4, limitata dal numero di scenari selezionati. Usa `--concurrency <count>` per regolare
il numero di worker, oppure `--concurrency 1` per l'esecuzione seriale.
Usa `--pack personal-agent` per eseguire il pacchetto benchmark dell'assistente personale. Il
selettore di pacchetto è additivo con flag `--scenario` ripetuti: gli scenari espliciti
vengono eseguiti prima, poi gli scenari del pacchetto vengono eseguiti nell'ordine del pacchetto con i duplicati rimossi.
Usa `--pack observability` quando un runner QA personalizzato fornisce già la configurazione
del collector OpenTelemetry e vuole selezionare insieme gli scenari smoke diagnostici
OpenTelemetry e Prometheus.
Il comando esce con stato non zero quando qualsiasi scenario fallisce. Usa `--allow-failures` quando
vuoi gli artefatti senza un codice di uscita di errore.
Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono pratici per il
guest: chiavi provider basate su env, il percorso della configurazione del provider live QA e
`CODEX_HOME` quando presente. Mantieni `--output-dir` sotto la root del repo così il guest
può scrivere indietro tramite il workspace montato.

## Riferimento QA per Telegram, Discord, Slack e WhatsApp

Matrix ha una [pagina dedicata](/it/concepts/qa-matrix) a causa del numero di scenari e del provisioning dell’homeserver basato su Docker. Telegram, Discord, Slack e WhatsApp vengono eseguiti su trasporti reali preesistenti, quindi il loro riferimento si trova qui.

### Flag CLI condivisi

Queste lane si registrano tramite `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e accettano gli stessi flag:

| Flag                                  | Predefinito                                        | Descrizione                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Esegue solo questo scenario. Ripetibile.                                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Dove vengono scritti report, riepiloghi, evidenze, artefatti specifici del trasporto e il log di output. I percorsi relativi si risolvono rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Root del repository quando si invoca da una cwd neutra.                                                                                         |
| `--sut-account <id>`                  | `sut`                                              | ID account temporaneo nella configurazione del gateway QA.                                                                                      |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` o `live-frontier` (`live-openai` legacy funziona ancora).                                                                         |
| `--model <ref>` / `--alt-model <ref>` | predefinito del provider                           | Riferimenti del modello primario/alternativo.                                                                                                   |
| `--fast`                              | disattivato                                        | Modalità rapida del provider dove supportata.                                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                              | Vedi [pool di credenziali Convex](#convex-credential-pool).                                                                                     |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, altrimenti `maintainer`                | Ruolo usato quando `--credential-source convex`.                                                                                                |

Ogni lane esce con codice diverso da zero per qualsiasi scenario non riuscito. `--allow-failures` scrive gli artefatti senza impostare un codice di uscita di errore.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Mira a un gruppo Telegram privato reale con due bot distinti (driver + SUT). Il bot SUT deve avere uno username Telegram; l’osservazione bot-to-bot funziona meglio quando entrambi i bot hanno **Bot-to-Bot Communication Mode** abilitata in `@BotFather`.

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

L’insieme predefinito implicito copre sempre canary, mention gating, risposte ai comandi nativi, indirizzamento dei comandi e risposte di gruppo bot-to-bot. I predefiniti `mock-openai` includono anche controlli deterministici della catena di risposte e dello streaming del messaggio finale. `telegram-current-session-status-tool` resta opt-in perché è stabile solo quando eseguito direttamente dopo canary, non dopo risposte arbitrarie ai comandi nativi. Usa `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` per stampare l’attuale suddivisione predefinita/opzionale con riferimenti di regressione.

Artefatti di output:

- `telegram-qa-report.md`
- `qa-evidence.json` - voci di evidenza per i controlli del trasporto live, inclusi profilo, copertura, provider, canale, artefatti, risultato e campi RTT.

Le esecuzioni Telegram del pacchetto usano lo stesso contratto di credenziali Telegram. La misurazione RTT ripetuta fa parte della normale lane live Telegram del pacchetto; la distribuzione RTT viene integrata in `qa-evidence.json` sotto `result.timing` per il controllo RTT selezionato.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Quando `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` è impostato, il wrapper live del pacchetto prende in lease una credenziale `kind: "telegram"`, esporta gli env del gruppo/driver/bot SUT in lease nell’esecuzione del pacchetto installato, invia Heartbeat per il lease e lo rilascia allo shutdown. Il wrapper del pacchetto usa per impostazione predefinita 20 controlli RTT di `telegram-mentioned-message-reply`, un timeout RTT di 30s e il ruolo Convex `maintainer` fuori dalla CI quando Convex è selezionato. Sovrascrivi `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` per regolare la misurazione RTT senza creare un comando RTT separato o un formato di riepilogo specifico per Telegram.

### QA Discord

```bash
pnpm openclaw qa discord
```

Mira a un canale guild Discord privato reale con due bot: un bot driver controllato dall’harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Discord in bundle. Verifica la gestione delle menzioni del canale, che il bot SUT abbia registrato il comando nativo `/help` con Discord, e scenari di evidenza Mantis opt-in.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corrispondere all’ID utente del bot SUT restituito da Discord (altrimenti la lane fallisce rapidamente).

Opzionale:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleziona il canale voce/stage per `discord-voice-autojoin`; senza di esso, lo scenario sceglie il primo canale voce/stage visibile per il bot SUT.

Scenari (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scenario voce opt-in. Viene eseguito da solo, abilita `channels.discord.voice.autoJoin` e verifica che lo stato voce Discord corrente del bot SUT sia il canale voce/stage di destinazione. Le credenziali Discord Convex possono includere `voiceChannelId` opzionale; altrimenti il runner rileva il primo canale voce/stage visibile nella guild.
- `discord-status-reactions-tool-only` - scenario Mantis opt-in. Viene eseguito da solo perché imposta il SUT su risposte guild sempre attive e solo tool con `messages.statusReactions.enabled=true`, quindi cattura una timeline di reazioni REST più artefatti visivi HTML/PNG. I report prima/dopo di Mantis preservano anche gli artefatti MP4 forniti dallo scenario come `baseline.mp4` e `candidate.mp4`.

Esegui esplicitamente lo scenario di auto-join voce Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Esegui esplicitamente lo scenario di reazioni di stato Mantis:

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
- `discord-qa-reaction-timelines.json` e `discord-status-reactions-tool-only-timeline.png` quando viene eseguito lo scenario di reazioni di stato.

### QA Slack

```bash
pnpm openclaw qa slack
```

Mira a un canale Slack privato reale con due bot distinti: un bot driver controllato dall’harness e un bot SUT avviato dal Gateway OpenClaw figlio tramite il Plugin Slack in bundle.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opzionale:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli artefatti dei messaggi osservati.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` abilita checkpoint di approvazione visiva per Mantis. Il runner scrive `<scenario>.pending.json` e `<scenario>.resolved.json`, poi attende file `.ack.json` corrispondenti.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` sovrascrive il timeout di conferma del checkpoint. Il valore predefinito è `120000`.

Scenari (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - scenario opt-in di approvazione exec nativa Slack. Richiede un’approvazione exec tramite il Gateway, verifica che il messaggio Slack abbia pulsanti di approvazione nativi, la risolve e verifica l’aggiornamento Slack risolto.
- `slack-approval-plugin-native` - scenario opt-in di approvazione Plugin nativa Slack. Abilita insieme l’inoltro delle approvazioni exec e Plugin, così gli eventi Plugin non vengono soppressi dal routing dell’approvazione exec, poi verifica lo stesso percorso UI nativo Slack in sospeso/risolto.

Artefatti di output:

- `slack-qa-report.md`
- `qa-evidence.json` - voci di evidenza per i controlli del trasporto live.
- `slack-qa-observed-messages.json` - corpi oscurati salvo `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - solo quando Mantis imposta `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contiene JSON dei checkpoint, JSON di conferma e screenshot in sospeso/risolti.

#### Configurazione dello workspace Slack

La lane richiede due app Slack distinte in uno workspace, più un canale di cui entrambi i bot siano membri:

- `channelId` - l’ID `Cxxxxxxxxxx` di un canale a cui entrambi i bot sono stati invitati. Usa un canale dedicato; la lane pubblica a ogni esecuzione.
- `driverBotToken` - token bot (`xoxb-...`) dell’app **Driver**.
- `sutBotToken` - token bot (`xoxb-...`) dell’app **SUT**, che deve essere un’app Slack separata dal driver affinché il suo ID utente bot sia distinto.
- `sutAppToken` - token a livello app (`xapp-...`) dell’app SUT con `connections:write`, usato da Socket Mode affinché l’app SUT possa ricevere eventi.

Preferisci uno workspace Slack dedicato alla QA invece di riutilizzare uno workspace di produzione.

Il manifest SUT seguente restringe intenzionalmente l’installazione di produzione del Plugin Slack in bundle (`extensions/slack/src/setup-shared.ts:10`) alle autorizzazioni e agli eventi coperti dalla suite QA Slack live. Per la configurazione del canale di produzione come la vedono gli utenti, vedi [configurazione rapida del canale Slack](/it/channels/slack#quick-setup); la coppia Driver/SUT QA è intenzionalmente separata perché la lane richiede due ID utente bot distinti in uno workspace.

**1. Crea l’app Driver**

Vai su [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ → _From a manifest_ → scegli il workspace QA, incolla il seguente manifest, quindi _Install to Workspace_:

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

Ripeti _Create New App → From a manifest_ nello stesso workspace. Questa app QA usa intenzionalmente una versione più ristretta del manifest di produzione del Plugin Slack incluso (`extensions/slack/src/setup-shared.ts:10`): gli scope e gli eventi delle reazioni sono omessi perché la suite QA Slack live non copre ancora la gestione delle reazioni.

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
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → aggiungi lo scope `connections:write` → salva → copia il valore `xapp-...` → diventa `sutAppToken`.

Verifica che i due bot abbiano id utente distinti chiamando `auth.test` su ciascun token. Il runtime distingue driver e SUT in base all'id utente; riutilizzare un'unica app per entrambi farà fallire immediatamente il gating delle menzioni.

**3. Crea il canale**

Nel workspace QA, crea un canale (ad esempio `#openclaw-qa`) e invita entrambi i bot dall'interno del canale:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia l'id `Cxxxxxxxxxx` da _channel info → About → Channel ID_ - diventa `channelId`. Un canale pubblico va bene; se usi un canale privato, entrambe le app hanno già `groups:history`, quindi le letture della cronologia dell'harness riusciranno comunque.

**4. Registra le credenziali**

Due opzioni. Usa variabili env per il debugging su una singola macchina (imposta le quattro variabili `OPENCLAW_QA_SLACK_*` e passa `--credential-source env`), oppure popola il pool Convex condiviso in modo che CI e altri maintainer possano prenderle in lease.

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

Attendi `count: 1`, `status: "active"`, nessun campo `lease`.

**5. Verifica end to end**

Esegui la lane localmente per confermare che entrambi i bot possano parlarsi tramite il broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Un'esecuzione verde si completa in molto meno di 30 secondi e `slack-qa-report.md` mostra sia `slack-canary` sia `slack-mention-gating` con stato `pass`. Se la lane resta sospesa per ~90 secondi ed esce con `Convex credential pool exhausted for kind "slack"`, il pool è vuoto oppure ogni riga è in lease - `qa credentials list --kind slack --status all --json` ti dirà quale dei due casi.

### QA WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Ha come target due account WhatsApp Web dedicati: un account driver controllato
dall'harness e un account SUT avviato dal Gateway OpenClaw figlio tramite il
Plugin WhatsApp incluso.

Env richieste quando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opzionale:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` abilita scenari di gruppo come
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, scenari di gruppo per azioni/media/sondaggi e
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` mantiene i corpi dei messaggi negli
  artefatti observed-message.

Catalogo degli scenari (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Baseline e gating di gruppo: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Comandi nativi: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamento di risposta e output finale: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Azioni messaggio sul percorso utente: `whatsapp-agent-message-action-react` parte da
  un vero DM del driver, consente al modello di chiamare lo strumento `message` e osserva la
  reazione nativa di WhatsApp. `whatsapp-agent-message-action-upload-file` usa
  la stessa postura per `message(action=upload-file)` e osserva media nativi
  WhatsApp. `whatsapp-group-agent-message-action-react` e
  `whatsapp-group-agent-message-action-upload-file` provano le stesse azioni
  visibili all'utente in un vero gruppo WhatsApp.
- Fanout di gruppo: `whatsapp-broadcast-group-fanout` parte da un messaggio di
  gruppo WhatsApp con menzione e verifica risposte visibili distinte da `main` e
  `qa-second`.
- Attivazione di gruppo: `whatsapp-group-activation-always` cambia una vera
  sessione di gruppo a `/activation always`, prova che un messaggio di gruppo
  senza menzione risveglia l'agente, poi ripristina `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  semina una risposta del bot, invia una risposta nativa citata a essa senza
  una menzione esplicita e verifica che l'agente si risvegli da quel contesto di risposta.
- Media in ingresso e messaggi strutturati: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Questi inviano veri eventi WhatsApp di immagine, audio, documento, posizione, contatto, sticker
  e reazione tramite il driver.
- Probe dirette del contratto Gateway:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Queste aggirano intenzionalmente il prompting del modello e
  provano contratti deterministici Gateway/canale `send`, `poll` e `message.action`.
- Copertura del controllo di accesso: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Approvazioni native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reazioni di stato: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Il catalogo contiene attualmente 50 scenari. La lane predefinita `live-frontier` è
mantenuta piccola con 10 scenari per una copertura smoke rapida. La lane predefinita
`mock-openai` esegue 44 scenari deterministici tramite il vero trasporto WhatsApp
simulando solo l'output del modello. Gli scenari di approvazione e alcuni controlli più pesanti/bloccanti
restano espliciti per id scenario.

Il driver QA WhatsApp osserva eventi live strutturati (`text`, `media`,
`location`, `reaction` e `poll`) e può inviare attivamente media, sondaggi,
contatti, posizioni e sticker. QA Lab importa quel driver tramite la superficie
del pacchetto `@openclaw/whatsapp/api.js` invece di accedere a file runtime
WhatsApp privati. Per le osservazioni di gruppo, `fromJid` è il JID del gruppo mentre
`participantJid` e `fromPhoneE164` identificano il mittente partecipante. Il contenuto
dei messaggi è redatto per impostazione predefinita. Le probe dirette Gateway
per poll, upload-file, media, poll di gruppo, media di gruppo e forma della risposta sono controlli del contratto trasporto/API;
non sono trattate come prova che un prompt utente abbia fatto scegliere
all'agente la stessa azione. La prova delle azioni sul percorso utente proviene da scenari come
`whatsapp-agent-message-action-react` e
`whatsapp-group-agent-message-action-react`, in cui il driver invia un normale
messaggio WhatsApp e QA Lab osserva l'artefatto WhatsApp nativo risultante.
I report WhatsApp includono la postura di ciascuno scenario (`user-path`, `direct-gateway`,
o `native-approval`) così che le prove non possano essere scambiate per un contratto più forte
di quanto dimostrino realmente.

Artefatti di output:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - voci di prova per i controlli del trasporto live.
- `whatsapp-qa-observed-messages.json` - corpi redatti salvo `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool di credenziali Convex

Le lane Telegram, Discord, Slack e WhatsApp possono prendere credenziali in lease da un pool Convex condiviso invece di leggere le variabili env sopra. Passa `--credential-source convex` (o imposta `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab acquisisce un lease esclusivo, invia Heartbeat per tutta la durata dell'esecuzione e lo rilascia allo spegnimento. I tipi del pool sono `"telegram"`, `"discord"`, `"slack"` e `"whatsapp"`.

Strutture dei payload che il broker valida su `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` deve essere una stringa chat-id numerica.
- Utente reale Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - solo proof Mantis Telegram Desktop. Le lane QA Lab generiche non devono acquisire questo tipo.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - i numeri di telefono devono essere stringhe E.164 distinte.

Il workflow di proof Mantis Telegram Desktop mantiene un lease Convex
`telegram-user` esclusivo sia per il driver CLI TDLib sia per il witness Telegram Desktop,
poi lo rilascia dopo la pubblicazione della proof.

Quando una PR richiede un diff visivo deterministico, Mantis può usare la stessa risposta
del modello mock su `main` e sulla head della PR mentre cambia il formatter Telegram o il layer
di consegna. I valori predefiniti di acquisizione sono ottimizzati per i commenti delle PR: classe Crabbox
standard, registrazione desktop a 24 fps, GIF di movimento a 24 fps e larghezza anteprima di 1920 px.
I commenti prima/dopo devono pubblicare un bundle pulito che contenga solo le
GIF previste.

Anche le lane Slack possono usare il pool. I controlli della forma del payload Slack al momento si trovano nel runner QA Slack anziché nel broker; usa `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, con un id canale Slack come `Cxxxxxxxxxx`. Vedi [Configurazione del workspace Slack](#setting-up-the-slack-workspace) per il provisioning di app e scope.

Le variabili d'ambiente operative e il contratto dell'endpoint broker Convex si trovano in [Testing → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1) (il nome della sezione precede il pool multi-canale; la semantica dei lease è condivisa tra i tipi).

## Seed basati sul repo

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Sono intenzionalmente in git, così il piano QA è visibile sia agli esseri umani sia
all'agent.

`qa-lab` deve restare un runner generico di scenari YAML. Ogni file YAML di scenario è
la fonte di verità per una singola esecuzione di test e deve definire:

- `title` di primo livello
- metadati `scenario`
- metadati opzionali di categoria, capability, lane e rischio in `scenario`
- riferimenti a documentazione e codice in `scenario`
- requisiti Plugin opzionali in `scenario`
- patch opzionale della configurazione Gateway in `scenario`
- `flow` eseguibile di primo livello per gli scenari di flow, oppure `scenario.execution.kind` /
  `scenario.execution.path` per scenari Vitest e Playwright

La superficie runtime riutilizzabile che supporta `flow` può rimanere generica
e trasversale. Per esempio, gli scenari YAML possono combinare helper lato trasporto
con helper lato browser che pilotano la Control UI incorporata attraverso il seam
Gateway `browser.request` senza aggiungere un runner con caso speciale.

I file di scenario devono essere raggruppati per capability di prodotto anziché per cartella
dell'albero sorgente. Mantieni stabili gli ID degli scenari quando i file vengono spostati; usa `docsRefs` e `codeRefs`
per la tracciabilità dell'implementazione.

L'elenco baseline deve restare abbastanza ampio da coprire:

- chat DM e canale
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback cron
- richiamo della memoria
- cambio modello
- handoff a subagent
- lettura del repo e lettura della documentazione
- una piccola attività di build come Lobster Invaders

## Lane mock provider

`qa suite` ha due lane mock provider locali:

- `mock-openai` è il mock OpenClaw consapevole dello scenario. Rimane la lane mock
  deterministica predefinita per QA basata sul repo e gate di parità.
- `aimock` avvia un server provider basato su AIMock per copertura sperimentale di protocollo,
  fixture, record/replay e chaos. È additivo e non
  sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle lane provider si trova sotto `extensions/qa-lab/src/providers/`.
Ogni provider possiede i propri valori predefiniti, l'avvio del server locale, la configurazione modello del gateway,
le esigenze di staging del profilo auth e i flag di capability live/mock. Il codice condiviso della suite e del
gateway deve passare attraverso il registry provider invece di ramificare sui
nomi dei provider.

## Adapter di trasporto

`qa-lab` possiede un seam di trasporto generico per gli scenari QA YAML. `qa-channel` è
il default sintetico. `crabline` avvia server locali con forma provider ed esegue
i normali plugin canale di OpenClaw contro di essi. `live` è riservato a
credenziali provider reali e canali esterni.

A livello architetturale, la divisione è:

- `qa-lab` possiede esecuzione generica degli scenari, concorrenza worker, scrittura artefatti e reportistica.
- L'adapter di trasporto possiede configurazione gateway, readiness, osservazione inbound e outbound, azioni di trasporto e stato di trasporto normalizzato.
- I file di scenario YAML sotto `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab` fornisce la superficie runtime riutilizzabile che li esegue.

### Aggiungere un canale

Aggiungere un canale al sistema QA YAML richiede l'implementazione del canale più
un pacchetto di scenari che eserciti il contratto del canale. Per copertura smoke CI, aggiungi
il server provider locale Crabline corrispondente ed esponilo tramite il driver `crabline`.

Non aggiungere una nuova radice di comando QA di primo livello quando l'host condiviso `qa-lab` può possedere il flow.

`qa-lab` possiede la meccanica dell'host condiviso:

- la radice comando `openclaw qa`
- avvio e teardown della suite
- concorrenza worker
- scrittura degli artefatti
- generazione report
- esecuzione degli scenari
- alias di compatibilità per scenari `qa-channel` più vecchi

I plugin runner possiedono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la radice condivisa `qa`
- come il gateway viene configurato per quel trasporto
- come viene controllata la readiness
- come vengono iniettati gli eventi inbound
- come vengono osservati i messaggi outbound
- come vengono esposti transcript e stato di trasporto normalizzato
- come vengono eseguite le azioni basate sul trasporto
- come viene gestito il reset o la pulizia specifica del trasporto

La soglia minima di adozione per un nuovo canale:

1. Mantieni `qa-lab` come owner della radice condivisa `qa`.
2. Implementa il runner di trasporto sul seam host condiviso `qa-lab`.
3. Mantieni la meccanica specifica del trasporto dentro il plugin runner o l'harness canale.
4. Monta il runner come `openclaw qa <runner>` invece di registrare un comando root concorrente. I plugin runner devono dichiarare `qaRunners` in `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations` corrispondente da `runtime-api.ts`. Mantieni `runtime-api.ts` leggero; la CLI lazy e l'esecuzione runner devono restare dietro entrypoint separati.
5. Crea o adatta scenari YAML sotto le directory tematiche `qa/scenarios/`.
6. Usa gli helper di scenario generici per i nuovi scenari.
7. Mantieni funzionanti gli alias di compatibilità esistenti, a meno che il repo non stia eseguendo una migrazione intenzionale.

La regola decisionale è rigida:

- Se un comportamento può essere espresso una volta in `qa-lab`, mettilo in `qa-lab`.
- Se un comportamento dipende da un trasporto canale, tienilo in quel plugin runner o harness plugin.
- Se uno scenario richiede una nuova capability che può essere usata da più di un canale, aggiungi un helper generico invece di un ramo specifico del canale in `suite.ts`.
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

Gli alias di compatibilità restano disponibili per gli scenari esistenti - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - ma la creazione di nuovi scenari deve usare i nomi generici. Gli alias esistono per evitare una migrazione flag-day, non come modello futuro.

## Reportistica

`qa-lab` esporta un report di protocollo Markdown dalla timeline bus osservata.
Il report deve rispondere a:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per l'inventario degli scenari disponibili - utile per dimensionare il lavoro di follow-up o cablare un nuovo trasporto - esegui `pnpm openclaw qa coverage` (aggiungi `--json` per output leggibile da macchina).
Quando scegli una proof mirata per un comportamento o percorso file modificato, esegui `pnpm openclaw qa coverage --match <query>`.
Il report di match cerca nei metadati degli scenari, nei riferimenti alla documentazione, nei riferimenti al codice, negli ID di copertura, nei plugin e nei requisiti provider, poi stampa i target `qa suite --scenario ...` corrispondenti.
Ogni esecuzione di `qa suite` scrive gli artefatti di primo livello `qa-evidence.json`,
`qa-suite-summary.json` e `qa-suite-report.md` per l'insieme di scenari selezionato.
Gli scenari che dichiarano `execution.kind: vitest` o
`execution.kind: playwright` eseguono il percorso di test corrispondente e scrivono anche
log per scenario. Gli scenari che dichiarano `execution.kind: script` eseguono il
producer di evidenza in `execution.path` tramite `node --import tsx` (con
`${outputDir}` e `${scenarioId}` espansi in `execution.args`); il producer
scrive il proprio `qa-evidence.json`, le cui voci vengono importate nell'output
della suite e i cui percorsi artefatto sono risolti relativamente a quel
`qa-evidence.json` del producer. Quando `qa suite` viene raggiunto tramite
`qa run --qa-profile`, lo stesso `qa-evidence.json` include anche il riepilogo
scorecard del profilo per le categorie tassonomiche selezionate.
Trattalo come un aiuto alla scoperta, non come sostituto dei gate; lo scenario selezionato richiede comunque la modalità provider, il trasporto live, Multipass, Testbox o la lane di release corretti per il comportamento sotto test.
Per il contesto della scorecard, vedi [Scorecard di maturità](/it/maturity/scorecard).

Per controlli di carattere e stile, esegui lo stesso scenario su più riferimenti modello
live e scrivi un report Markdown valutato:

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

Il comando esegue processi figlio del gateway QA locale, non Docker. Gli scenari di valutazione dei personaggi dovrebbero impostare la persona tramite `SOUL.md`, quindi eseguire normali turni utente come chat, aiuto nell'area di lavoro e piccole attività sui file. Al modello candidato non dovrebbe essere comunicato che è in valutazione. Il comando conserva ogni trascrizione completa, registra statistiche di esecuzione di base, quindi chiede ai modelli giudice in modalità veloce con ragionamento `xhigh` dove supportato di classificare le esecuzioni per naturalezza, vibe e umorismo.
Usa `--blind-judge-models` quando confronti i provider: il prompt del giudice riceve comunque ogni trascrizione e stato di esecuzione, ma i riferimenti dei candidati vengono sostituiti con etichette neutrali come `candidate-01`; il report riconduce le classifiche ai riferimenti reali dopo il parsing.
Le esecuzioni dei candidati usano per impostazione predefinita il thinking `high`, con `medium` per GPT-5.5 e `xhigh` per i riferimenti di valutazione OpenAI più vecchi che lo supportano. Sovrascrivi uno specifico candidato inline con `--model provider/model,thinking=<level>`. `--thinking <level>` imposta ancora un fallback globale, e la forma precedente `--model-thinking <provider/model=level>` viene mantenuta per compatibilità.
I riferimenti dei candidati OpenAI usano per impostazione predefinita la modalità veloce, così viene usata l'elaborazione prioritaria dove il provider la supporta. Aggiungi `,fast`, `,no-fast` o `,fast=false` inline quando un singolo candidato o giudice richiede una sovrascrittura. Passa `--fast` solo quando vuoi forzare la modalità veloce per ogni modello candidato. Le durate di candidati e giudici vengono registrate nel report per l'analisi dei benchmark, ma i prompt dei giudici dicono esplicitamente di non classificare in base alla velocità.
Le esecuzioni dei modelli candidati e giudici usano entrambe per impostazione predefinita la concorrenza 16. Abbassa `--concurrency` o `--judge-concurrency` quando i limiti del provider o la pressione sul gateway locale rendono un'esecuzione troppo rumorosa.
Quando non viene passato alcun `--model` candidato, la valutazione dei personaggi usa per impostazione predefinita `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e
`google/gemini-3.1-pro-preview` quando non viene passato alcun `--model`.
Quando non viene passato alcun `--judge-model`, i giudici usano per impostazione predefinita
`openai/gpt-5.5,thinking=xhigh,fast` e
`anthropic/claude-opus-4-8,thinking=high`.

## Documentazione correlata

- [QA a matrice](/it/concepts/qa-matrix)
- [Scheda di valutazione della maturità](/it/maturity/scorecard)
- [Pacchetto di benchmark per agent personale](/it/concepts/personal-agent-benchmark-pack)
- [Canale QA](/it/channels/qa-channel)
- [Testing](/it/help/testing)
- [Dashboard](/it/web/dashboard)
