---
doc-schema-version: 1
read_when:
    - Comprendere come si integrano i componenti dello stack QA
    - Estensione di qa-lab, qa-channel o di un adattatore di trasporto
    - Aggiunta di scenari di QA basati sul repository
    - Creazione di un'automazione QA più realistica per la dashboard del Gateway
summary: 'Panoramica dello stack di QA: qa-lab, qa-channel, scenari supportati dal repository, corsie di trasporto live, adattatori di trasporto e reportistica.'
title: Panoramica del QA
x-i18n:
    generated_at: "2026-07-16T14:19:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8dcb506cedb57289f29938eb55b5f11ceedfaabba88364dce8249116010ce859
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Lo stack QA privato sottopone OpenClaw a verifiche realistiche, strutturate come un canale, che
un test unitario non può eseguire.

Componenti:

- `extensions/qa-channel`: canale di messaggistica sintetico con superfici per messaggi diretti, canali, thread,
  reazioni, modifiche ed eliminazioni.
- `extensions/qa-lab`: interfaccia utente del debugger, bus QA, profili di scenario e adattatori di trasporto
  live per osservare la trascrizione, inserire messaggi in entrata
  ed esportare un report Markdown.
- `qa/`: risorse seed basate sul repository per l'attività iniziale e gli scenari QA
  di riferimento.
- [Mantis](/it/concepts/mantis): verifica live prima/dopo per i bug che
  richiedono trasporti reali, screenshot del browser, stato della VM e prove della PR.

## Superficie dei comandi

Ogni flusso QA viene eseguito tramite `pnpm openclaw qa <subcommand>`. Molti dispongono di alias
di script `pnpm qa:*`; entrambe le forme funzionano.

| Comando                                             | Scopo                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autoverifica QA integrata senza `--qa-profile`; esecutore di profili di maturità basati sulla tassonomia con `--qa-profile smoke-ci`, `--qa-profile release` o `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Esegue scenari basati sul repository nella corsia del Gateway QA. `--runner multipass` utilizza una VM Linux usa e getta anziché l'host.                                                                                                                                         |
| `qa coverage`                                       | Stampa l'inventario YAML della copertura degli scenari (`--json` per l'output elaborabile da una macchina; `--match <query>` per trovare gli scenari relativi a un comportamento modificato; `--tools` per la copertura delle fixture degli strumenti di runtime).                                                                                  |
| `qa parity-report`                                  | Confronta due file `qa-suite-summary.json` per un gate di parità sull'asse dei modelli oppure usa `--runtime-axis --token-efficiency` per scrivere report sulla parità di runtime tra Codex e OpenClaw e sull'efficienza dei token.                                                                          |
| `qa confidence-report`                              | Classifica gli artefatti di prova QA rispetto a un manifesto in un report di affidabilità con zero elementi sconosciuti.                                                                                                                                                                               |
| `qa confidence-self-test`                           | Scrive canary seed di controllo negativo che dimostrano che il gate di affidabilità rileva le divergenze.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | Riproduce trascrizioni JSONL selezionate tramite l'harness di riproduzione della parità di runtime.                                                                                                                                                                                         |
| `qa character-eval`                                 | Esegue lo scenario QA del personaggio su più modelli live con un report valutato. Consultare [Report](#reporting).                                                                                                                                                        |
| `qa manual`                                         | Esegue un prompt una tantum nella corsia del provider/modello selezionato.                                                                                                                                                                                                      |
| `qa ui`                                             | Avvia l'interfaccia utente del debugger QA e il bus QA locale (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | Compila l'immagine Docker QA preconfigurata.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Scrive uno scaffold docker-compose per la corsia dashboard QA + Gateway.                                                                                                                                                                                                |
| `qa up`                                             | Compila il sito QA, avvia lo stack basato su Docker e stampa l'URL (alias: `pnpm qa:lab:up`; la variante `:fast` aggiunge `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                              |
| `qa aimock`                                         | Avvia soltanto il server del provider AIMock.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Avvia soltanto il server del provider `mock-openai` sensibile agli scenari.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestisce il pool condiviso di credenziali Convex.                                                                                                                                                                                                                           |
| `qa discord`                                        | Corsia di trasporto live verso un canale reale di una gilda Discord privata.                                                                                                                                                                                                   |
| `qa matrix`                                         | Profili Matrix di QA Lab su un homeserver Tuwunel usa e getta. Consultare [Corsie smoke di Matrix](#matrix-smoke-lanes).                                                                                                                                                      |
| `qa slack`                                          | Corsia di trasporto live verso un canale Slack privato reale.                                                                                                                                                                                                           |
| `qa telegram`                                       | Corsia di trasporto live verso un gruppo Telegram privato reale.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | Corsia di trasporto live verso account WhatsApp Web reali.                                                                                                                                                                                                             |
| `qa mantis`                                         | Esecutore di verifiche prima/dopo per i bug del trasporto live, con prove delle reazioni di stato di Discord, smoke test desktop/browser di Crabbox e smoke test di Slack in VNC. Consultare [Mantis](/it/concepts/mantis) e [Runbook di Mantis per Slack Desktop](/it/concepts/mantis-slack-desktop-runbook). |

### `qa run` basato sui profili

`qa run` basato sui profili legge l'appartenenza da `taxonomy.yaml`, quindi invia
gli scenari risolti tramite `qa suite`. `--surface` e `--category` filtrano
il profilo selezionato anziché definire corsie separate. Il file
`qa-evidence.json` risultante include un riepilogo della scheda di valutazione del profilo con i conteggi
delle categorie selezionate e gli ID di copertura mancanti; le singole voci di prova rimangono la
fonte attendibile per test, ruoli di copertura e risultati. Gli ID di copertura
delle funzionalità della tassonomia sono obiettivi di prova esatti, non alias: la copertura dello scenario
primario soddisfa gli ID corrispondenti, mentre la copertura secondaria rimane indicativa. Gli ID di copertura usano
il formato `namespace.behavior` puntato con segmenti alfanumerici minuscoli o con trattini;
gli ID di profilo, superficie e categoria possono continuare a usare gli ID della tassonomia
esistenti con trattini o punti.

Le prove ridotte omettono `execution` per ogni voce e impostano `evidenceMode: "slim"`;
`smoke-ci` usa per impostazione predefinita il formato ridotto e `--evidence-mode full` ripristina le voci complete:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Usare `smoke-ci` per prove deterministiche del profilo con provider di modelli simulati e
server di provider locali Crabline. Usare `release` per prove Stable/LTS su
canali live. Usare `all` solo per esecuzioni esplicite di prova dell'intera tassonomia; questo
seleziona ogni categoria di maturità attiva e può essere inviato tramite il workflow GitHub Actions `QA
Profile Evidence` con `qa_profile=all`. Quando un
comando richiede anche un profilo radice di OpenClaw, inserire il profilo radice prima del
comando QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flusso operativo

L'attuale flusso operativo QA è un sito QA a due riquadri:

- A sinistra: dashboard del Gateway (interfaccia utente di controllo) con l'agente.
- A destra: QA Lab, che mostra la trascrizione in stile Slack e il piano dello scenario.

Eseguirlo con:

```bash
pnpm qa:lab:up
```

Questo compila il sito QA, avvia la corsia del Gateway basata su Docker ed espone
la pagina QA Lab, dove un operatore o un ciclo di automazione può assegnare all'agente una
missione QA, osservare il comportamento reale del canale e registrare ciò che ha funzionato, non ha funzionato o
è rimasto bloccato.

Per iterare più rapidamente sull'interfaccia utente di QA Lab senza ricompilare ogni volta l'immagine Docker,
avviare lo stack con un bundle QA Lab montato tramite bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene i servizi Docker su un'immagine precompilata e
monta tramite bind `extensions/qa-lab/web/dist` nel container `qa-lab`.
`qa:lab:watch` ricompila il bundle a ogni modifica e il browser si ricarica
automaticamente quando cambia l'hash delle risorse di QA Lab.

### Smoke test di osservabilità

<Note>
La QA dell'osservabilità rimane disponibile solo dal checkout dei sorgenti. Il tarball npm
omette intenzionalmente QA Lab (e `qa-channel`), pertanto le corsie
di rilascio Docker dei pacchetti non eseguono i comandi `qa`. Eseguire questi comandi da un checkout dei sorgenti compilato quando
si modifica la strumentazione diagnostica.
</Note>

| Alias                                   | Cosa esegue                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Ricevitore OpenTelemetry locale più lo scenario `otel-trace-smoke` con `diagnostics-otel` abilitato.                                      |
| `pnpm qa:otel:collector-smoke`          | Stesso percorso dietro un vero container Docker OpenTelemetry Collector. Utilizzarlo quando si modifica il cablaggio degli endpoint o la compatibilità con il collector/OTLP. |
| `pnpm qa:prometheus:smoke`              | Lo scenario `docker-prometheus-smoke` con `diagnostics-prometheus` abilitato.                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` seguito da `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` seguito da `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` avvia un ricevitore OTLP/HTTP locale, esegue un turno
minimo dell'agente del canale QA, quindi verifica che tracce, metriche e log
vengano esportati. Decodifica gli span di traccia protobuf esportati e
controlla la struttura critica per il rilascio: `openclaw.run`,
`openclaw.harness.run`, uno span di chiamata al modello conforme alla convenzione
semantica GenAI più recente, `openclaw.context.assembled` e `openclaw.message.delivery`
devono essere tutti presenti. Lo smoke test imposta
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, quindi lo span della chiamata
al modello deve usare il nome `{gen_ai.operation.name} {gen_ai.request.model}`; le chiamate
al modello non devono esportare `StreamAbandoned` nei turni riusciti; gli ID
diagnostici grezzi e gli attributi `openclaw.content.*` devono rimanere esclusi
dalla traccia. Il prompt dello scenario chiede al modello di rispondere con un
marcatore fisso e di non divulgare una stringa segreta fissa; i payload OTLP
grezzi non devono contenere né l'uno né l'altra, né la chiave di sessione QA
derivata dall'ID dello scenario. Scrive `otel-smoke-summary.json` accanto agli
artefatti della suite QA.

`qa:prometheus:smoke` verifica che gli scraping non autenticati vengano
rifiutati, quindi controlla che lo scraping autenticato includa le famiglie
di metriche critiche per il rilascio senza contenuto del prompt, contenuto
della risposta, identificatori diagnostici grezzi, token di autenticazione
o percorsi locali.

### Percorsi smoke di Matrix

Per un percorso smoke di Matrix con trasporto reale che non richiede
credenziali del provider del modello, eseguire il profilo di rilascio con il
provider OpenAI mock deterministico:

```bash
pnpm openclaw qa matrix --provider-mode mock-openai --profile release
```

Per il percorso del provider live-frontier, fornire esplicitamente credenziali
compatibili con OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile release
```

Il semplice `pnpm openclaw qa matrix` esegue il profilo `all` completo e
continua dopo gli errori degli scenari. Utilizzare `--fail-fast` per un
ciclo di feedback più breve oppure ripetere `--scenario <id>` per selezionare
singoli scenari; gli ID di scenario espliciti hanno la precedenza su
`--profile`.

| Profilo      | Scenari | Scopo                                                                                                                                  |
| ------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `all`        | 93        | Catalogo completo (predefinito).                                                                                                              |
| `release`    | 2         | Baseline del canale critica per il rilascio e ricaricamento live dell'elenco consentito.                                                                             |
| `fast`       | 12        | Copertura mirata di thread, reazioni, approvazioni, criteri, controllo dei bot e risposte crittografate.                                               |
| `transport`  | 50        | Thread, instradamento di messaggi diretti/stanze, accesso automatico, approvazioni, reazioni, riavvii, criteri per menzioni/elenchi consentiti, modifiche e ordinamento multi-attore.         |
| `media`      | 7         | Copertura di immagini, immagini generate, voce, allegati, contenuti multimediali non supportati e contenuti multimediali crittografati.                                              |
| `e2ee-smoke` | 8         | Copertura minima di risposte crittografate, thread, bootstrap, ripristino, riavvio, redazione ed errori.                                       |
| `e2ee-deep`  | 18        | Perdita di stato, backup, recupero delle chiavi, integrità dei dispositivi e verifica SAS/QR/messaggi diretti.                                                            |
| `e2ee-cli`   | 9         | `openclaw matrix encryption setup`, chiave di recupero, account multipli, round trip del Gateway e comandi di autoverifica tramite l'harness. |

L'appartenenza ai profili e i requisiti del canale risiedono insieme agli
scenari Matrix dichiarativi in `qa/scenarios/channels/`. L'esecuzione sceglie il
driver del canale. Le relative implementazioni live risiedono in
`extensions/qa-lab/src/live-transports/matrix/scenarios/`.

L'adattatore predispone in Docker un homeserver Tuwunel monouso (immagine
predefinita `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome del server `matrix-qa.test`,
porta `28008`), registra utenti temporanei per driver, SUT e
osservatore, inizializza le stanze richieste e registra il confine
richiesta/risposta redatto. Esegue quindi il vero Plugin Matrix all'interno
di un Gateway QA figlio limitato a tale trasporto (nessun
`qa-channel`) e infine smantella l'ambiente.

Opzioni comuni:

| Flag                     | Valore predefinito           | Scopo                                                                              |
| ------------------------ | ----------------- | ------------------------------------------------------------------------------------ |
| `--profile <profile>`    | `all`             | Seleziona uno dei profili precedenti.                                                    |
| `--scenario <id>`        | -                 | Seleziona uno scenario; ripetibile.                                                     |
| `--fail-fast`            | disattivato               | Interrompe dopo il primo controllo o scenario non riuscito.                                       |
| `--allow-failures`       | disattivato               | Scrive gli artefatti senza restituire un codice di uscita di errore per gli scenari non riusciti.         |
| `--provider-mode <mode>` | `live-frontier`   | Utilizza `mock-openai` per l'invio deterministico o `live-frontier` per un provider live. |
| `--model <ref>`          | valore predefinito del provider  | Imposta il riferimento `provider/model` primario.                                          |
| `--alt-model <ref>`      | valore predefinito del provider  | Imposta il modello alternativo utilizzato dagli scenari che cambiano modello.                        |
| `--fast`                 | disattivato               | Abilita la modalità rapida del provider, ove supportata.                                           |
| `--output-dir <path>`    | generato         | Sceglie la directory dei report; i percorsi relativi vengono risolti rispetto a `--repo-root`.           |
| `--repo-root <path>`     | directory corrente | Esegue da una directory di lavoro neutra.                                                |
| `--sut-account <id>`     | `sut`             | Seleziona l'ID dell'account Matrix nella configurazione del Gateway figlio.                            |

Il QA di Matrix non prende in leasing credenziali Matrix condivise:
l'adattatore crea localmente utenti monouso, quindi non accetta
`--credential-source` né `--credential-role`. Sostituire l'immagine
dell'homeserver con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`; regolare le verifiche negative di
mancata risposta con `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (valore predefinito
`8000`, limitato al timeout dello scenario attivo). Il comando a
esecuzione singola normalmente forza un'uscita pulita dopo lo svuotamento
degli artefatti, poiché gli handle nativi della crittografia Matrix possono
sopravvivere alla pulizia; impostare `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1` solo per un harness
di test diretto che richieda invece la restituzione del comando.

Ogni esecuzione scrive i normali artefatti di QA Lab nella directory di
output selezionata: `qa-suite-report.md`, `qa-suite-summary.json`,
`qa-evidence.json` e un manifesto `matrix-harness-*/matrix-qa-harness.json` redatto. Se la pulizia
non riesce, eseguire il comando di recupero `docker compose ... down --remove-orphans` stampato.
Sugli esecutori lenti, aumentare la finestra di mancata risposta; su CI
veloce, una finestra più piccola può abbreviare le verifiche negative.

Gli scenari coprono il comportamento del trasporto che i test unitari non
possono dimostrare end-to-end: controllo delle menzioni, criteri di
autorizzazione dei bot, elenchi consentiti, risposte di primo livello e nei
thread, instradamento dei messaggi diretti, gestione delle reazioni,
soppressione delle modifiche in entrata, deduplicazione della riproduzione
dopo il riavvio, ripristino dopo l'interruzione dell'homeserver, consegna dei
metadati di approvazione, gestione dei contenuti multimediali e flussi di
bootstrap/ripristino/verifica E2EE di Matrix. Il profilo CLI E2EE esegue
inoltre `openclaw matrix encryption setup` e i comandi di verifica tramite lo stesso
homeserver monouso prima di controllare le risposte del Gateway.

`matrix-room-block-streaming` e `subagent-thread-spawn` rimangono disponibili tramite
selezione esplicita di `--scenario`, ma restano esclusi dal profilo
`all` predefinito.

La CI utilizza la stessa superficie di comando in
`.github/workflows/qa-live-transports-convex.yml`. Le esecuzioni pianificate e di rilascio
eseguono gli scenari di rilascio. Gli invii manuali `matrix_profile=all`
distribuiscono in parallelo i profili `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` e
`e2ee-cli`; gli invii mirati selezionano `fast`,
`release` o `transport` in un unico job.

### Scenari Discord Mantis

Discord dispone anche di scenari Mantis facoltativi dedicati alla riproduzione
dei bug. Utilizzare `--scenario discord-status-reactions-tool-only` per la cronologia esplicita delle
reazioni di stato oppure `--scenario discord-thread-reply-filepath-attachment` per creare un vero thread Discord
e verificare che `message.thread-reply` conservi un allegato
`filePath`. Questi scenari restano esclusi dal percorso Discord live
predefinito perché sono verifiche di riproduzione prima/dopo, anziché una
copertura smoke generale. Il flusso di lavoro Mantis per gli allegati nei
thread può anche aggiungere un video di testimonianza di Discord Web con
accesso effettuato quando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` è
configurato nell'ambiente QA. Tale profilo di visualizzazione serve solo
all'acquisizione visiva; la decisione di esito positivo/negativo proviene
comunque dall'oracolo REST di Discord.

Per gli altri percorsi smoke con trasporto reale:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Sono destinati a un canale reale preesistente con due bot o account (driver +
SUT). Le variabili di ambiente richieste, gli elenchi degli scenari, gli
artefatti di output e il pool di credenziali Convex per questi quattro
trasporti sono documentati nel
[riferimento QA per Discord, Slack, Telegram e WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
seguente.

### Esecutori Mantis per desktop Slack e attività visive

Per un'esecuzione completa in VM del desktop Slack con recupero VNC,
eseguire:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Quel comando prende in leasing una macchina desktop/browser Crabbox, esegue la lane live di Slack
all'interno della VM, apre Slack Web nel browser VNC, acquisisce il desktop
e copia `slack-qa/`, `slack-desktop-smoke.png` e
`slack-desktop-smoke.mp4` (quando è disponibile l'acquisizione video) nella
directory degli artefatti di Mantis. I leasing desktop/browser Crabbox forniscono in anticipo gli
strumenti di acquisizione e i pacchetti di supporto per browser/build native, quindi lo scenario
dovrebbe installare i fallback solo nei leasing meno recenti. Mantis riporta le tempistiche totali
e per fase in `mantis-slack-desktop-smoke-report.md`, in modo che le esecuzioni lente mostrino
se il tempo è stato impiegato nel riscaldamento del leasing, nell'acquisizione delle credenziali, nella configurazione remota o
nella copia degli artefatti. Riutilizzare `--lease-id <cbx_...>` dopo aver effettuato manualmente l'accesso a Slack Web
tramite VNC; i leasing riutilizzati mantengono calda anche la cache dello store pnpm di Crabbox.
Il valore predefinito `--hydrate-mode source` esegue la verifica da un checkout dei sorgenti ed
esegue installazione/build all'interno della VM. Utilizzare `--hydrate-mode prehydrated` solo quando
lo spazio di lavoro remoto riutilizzato dispone già di `node_modules` e di un `dist/` compilato;
questa modalità salta il costoso passaggio di installazione/build e termina in modo sicuro quando lo
spazio di lavoro non è pronto. Con `--gateway-setup`, Mantis lascia in esecuzione un
gateway Slack OpenClaw persistente all'interno della VM sulla porta `38973`; senza questa opzione, il
comando esegue la normale lane QA Slack bot-to-bot e termina dopo
l'acquisizione degli artefatti.

Per dimostrare l'interfaccia di approvazione nativa di Slack con evidenze del desktop, eseguire la modalità
checkpoint di approvazione di Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Questa modalità è mutuamente esclusiva con `--gateway-setup`. Esegue gli scenari di
approvazione Slack, rifiuta gli ID di scenari non relativi all'approvazione, attende ogni stato di
approvazione in sospeso e risolto, esegue il rendering del messaggio Slack API osservato in
`approval-checkpoints/<scenario>-pending.png` e
`approval-checkpoints/<scenario>-resolved.png`, quindi non riesce se un checkpoint,
un'evidenza del messaggio, una conferma o uno screenshot renderizzato manca oppure
è vuoto. I leasing CI avviati a freddo possono comunque mostrare l'accesso a Slack in
`slack-desktop-smoke.png`; le immagini dei checkpoint di approvazione costituiscono la prova
visiva per questa lane.

L'esecuzione predefinita dei checkpoint mantiene i due scenari standard di approvazione Slack.
Per acquisire uno dei percorsi di approvazione Codex opzionali, selezionarlo esplicitamente con
`--scenario slack-codex-approval-exec-native` o
`--scenario slack-codex-approval-plugin-native`; Mantis li accetta entrambi e genera
la stessa coppia di screenshot in sospeso/risolto. Il runner estende le scadenze dei checkpoint
e dei comandi remoti per ciascun percorso Codex selezionato, affinché l'intera
sequenza di approvazione, completamento dell'agente e aggiornamento dello stato risolto possa terminare.

La checklist dell'operatore, il comando di dispatch del workflow GitHub, il contratto dei commenti
sulle evidenze, la tabella decisionale della modalità hydrate, l'interpretazione delle tempistiche e i passaggi
di gestione degli errori sono disponibili in
[Runbook di Mantis per il desktop Slack](/it/concepts/mantis-slack-desktop-runbook).

Per un'attività desktop in stile agente/CV, eseguire:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` prende in leasing o riutilizza una macchina desktop/browser Crabbox, avvia
`crabbox record --while`, controlla il browser visibile tramite un
`visual-driver` annidato, acquisisce `visual-task.png`, esegue `openclaw infer image
describe` sullo screenshot quando è
selezionato `--vision-mode image-describe` e scrive `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` e
`mantis-visual-task-report.md`. Quando è impostato `--expect-text`, il prompt di visione
richiede un verdetto JSON strutturato (`visible`, `evidence`, `reason`)
e ha esito positivo solo quando il modello segnala `visible: true` con evidenze che
citano il testo previsto; una risposta `visible: false` che si limita a riportare il
testo obiettivo non supera comunque l'asserzione. Utilizzare `--vision-mode metadata` per uno
smoke test senza modello che verifichi l'infrastruttura di desktop, browser, screenshot e video
senza chiamare un provider di comprensione delle immagini. La registrazione è un
artefatto obbligatorio per `visual-task`; se Crabbox non registra alcun
`visual-task.mp4` non vuoto, l'attività non riesce anche quando il driver visivo ha avuto esito positivo. In caso di
errore, Mantis mantiene il leasing per VNC, salvo che l'attività avesse già avuto esito positivo
e `--keep-lease` non fosse impostato.

### Controllo dello stato del pool di credenziali

Prima di utilizzare credenziali live condivise, eseguire:

```bash
pnpm openclaw qa credentials doctor
```

Il doctor controlla le variabili di ambiente del broker Convex (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), convalida le impostazioni degli endpoint, riporta
solo lo stato impostato/mancante per `OPENCLAW_QA_CONVEX_SECRET_CI` e
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` e verifica la raggiungibilità delle operazioni di amministrazione/elenco
quando è presente il secret del manutentore.

## Copertura canonica degli scenari

Il file radice `taxonomy.yaml` definisce gli ID di copertura semantica. I file YAML degli scenari
in `qa/scenarios/` associano ogni scenario a tali ID e gestiscono i metadati
di esecuzione: `channel` è l'unico requisito del canale e `profiles` dichiara
l'appartenenza alle esecuzioni denominate. Il driver del canale è una scelta di implementazione
intercambiabile a livello di esecuzione. I runner TypeScript
interrogano tale catalogo; non mantengono inventari paralleli di scenari o copertura.

L'output statico di `qa coverage` riporta la mappatura tra tassonomia e scenari. La
prova effettiva proviene da `qa-evidence.json`, che registra lo scenario eseguito,
gli ID di copertura, il canale, il driver effettivamente utilizzato e il risultato. Canale e driver sono
dimensioni del report, non vocabolari aggiuntivi di ID di copertura né assi di
idoneità degli scenari.

Per una lane su una VM Linux usa e getta senza introdurre Docker nel percorso QA, eseguire:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Questo avvia un nuovo guest Multipass, installa le dipendenze, compila OpenClaw
all'interno del guest, esegue `qa suite`, quindi copia il normale report QA e il
riepilogo in `.artifacts/qa-e2e/...` sull'host. Riutilizza lo stesso
comportamento di selezione degli scenari di `qa suite` sull'host.

Le esecuzioni della suite sull'host e su Multipass eseguono più scenari selezionati in
parallelo, utilizzando per impostazione predefinita worker Gateway isolati. `qa-channel` usa per impostazione predefinita
una concorrenza pari a 4, limitata dal numero di scenari selezionati. Utilizzare `--concurrency
<count>` per regolare il numero di worker oppure `--concurrency 1` per l'esecuzione seriale.
Utilizzare `--pack personal-agent` per eseguire il pacchetto di benchmark dell'assistente personale (10
scenari). Il selettore del pacchetto è additivo rispetto ai flag `--scenario` ripetuti:
prima vengono eseguiti gli scenari espliciti, quindi gli scenari del pacchetto nell'ordine del pacchetto, con
rimozione dei duplicati. Utilizzare `--pack observability` per selezionare insieme gli scenari
`otel-trace-smoke` e `docker-prometheus-smoke` quando un
runner QA personalizzato fornisce già la configurazione del collector OpenTelemetry.

Il comando termina con un codice diverso da zero quando uno scenario non riesce. Utilizzare `--allow-failures`
quando si desiderano gli artefatti senza un codice di uscita di errore.

Le esecuzioni live inoltrano gli input di autenticazione QA supportati che sono utilizzabili nel
guest: chiavi del provider basate su variabili di ambiente, il percorso della configurazione live del provider QA e
`CODEX_HOME`, quando presente. Mantenere `--output-dir` sotto la radice del repository affinché il
guest possa scrivere tramite lo spazio di lavoro montato.

## Riferimento QA per Discord, Slack, Telegram e WhatsApp

L'adattatore Matrix utilizza la lane usa e getta basata su Docker documentata in precedenza.
Discord, Slack, Telegram e WhatsApp operano su trasporti reali
preesistenti, quindi il relativo riferimento è disponibile qui.

### Flag CLI condivisi

Queste lane vengono registrate tramite
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` e
accettano gli stessi flag:

| Flag                                  | Valore predefinito                                  | Descrizione                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Esegue solo questo scenario. Ripetibile.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Posizione in cui vengono scritti report, riepiloghi, evidenze, artefatti specifici del trasporto e log di output. I percorsi relativi vengono risolti rispetto a `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Radice del repository quando l'esecuzione avviene da una directory di lavoro neutra.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | ID dell'account temporaneo nella configurazione del Gateway QA.                                                                                              |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai`, `aimock` o `live-frontier`.                                                                                                    |
| `--model <ref>` / `--alt-model <ref>` | valore predefinito del provider                    | Riferimenti al modello primario/alternativo.                                                                                                                   |
| `--fast`                              | disattivato                                        | Modalità rapida del provider, dove supportata.                                                                                                             |
| `--credential-source <env\|convex>`   | `env`                                              | Consultare [Pool di credenziali Convex](#convex-credential-pool).                                                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` in CI, altrimenti `maintainer`                 | Ruolo utilizzato quando `--credential-source convex`.                                                                                                    |
| `--allow-failures`                    | disattivato                                        | Scrive gli artefatti senza restituire un codice di uscita di errore quando gli scenari non riescono.                                                                      |

Ogni lane termina con un codice diverso da zero in caso di fallimento di uno scenario. `--allow-failures` scrive
gli artefatti senza impostare un codice di uscita di errore. Telegram accetta anche
`--list-scenarios` per stampare gli ID degli scenari disponibili e terminare; le altre lane
non espongono tale flag.

### QA di Telegram

```bash
pnpm openclaw qa telegram
```

Ha come destinazione un singolo gruppo Telegram privato reale con due bot distinti (driver +
SUT). Il bot SUT deve avere un nome utente Telegram; l'osservazione bot-to-bot funziona
meglio quando entrambi i bot hanno **Bot-to-Bot Communication Mode** abilitata in
`@BotFather`.

Variabili di ambiente obbligatorie quando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - ID numerico della chat (stringa).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Il profilo `release` seleziona gli scenari YAML Telegram mantenuti; `all`
aggiunge controlli opzionali di stress per sessione, utilizzo, catena di risposte e streaming. I valori
espliciti di `--scenario` sostituiscono il profilo.

- `channel-canary`
- `channel-mention-gating`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

Il profilo `release` copre sempre canary, filtro delle menzioni, risposte ai comandi
nativi, indirizzamento dei comandi e risposte da bot a bot nei gruppi. `mock-openai`
include anche il controllo deterministico dell'anteprima finale lunga.
`telegram-current-session-status-tool` e
`telegram-tool-only-usage-footer` rimangono facoltativi: il primo è stabile solo
quando viene eseguito in thread direttamente dopo canary, mentre il secondo è una verifica su Telegram reale
del piè di pagina `/usage` nelle risposte contenenti solo strumenti. Usare `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` per stampare l'attuale
suddivisione tra valori predefiniti e facoltativi con riferimenti alle regressioni. Usare `--profile all` per ogni
scenario dell'adattatore live di Telegram.

Artefatti di output:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - voci di evidenza per i controlli del trasporto live,
  inclusi i campi relativi a profilo, copertura, provider, canale, artefatti, risultato e RTT.

Le esecuzioni del pacchetto Telegram usano lo stesso contratto delle credenziali Telegram. La misurazione
ripetuta dell'RTT fa parte della normale pipeline live di Telegram del pacchetto; la distribuzione
dell'RTT viene incorporata in `qa-evidence.json` sotto `result.timing` per il
controllo RTT selezionato.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Quando è impostato `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, il wrapper live del pacchetto
ottiene in leasing una credenziale `kind: "telegram"`, esporta le variabili di ambiente del gruppo, del driver e del bot
SUT ottenute in leasing nell'esecuzione del pacchetto installato, invia l'Heartbeat del leasing e lo rilascia
all'arresto. Per impostazione predefinita, il wrapper del pacchetto esegue 20 controlli RTT di
`channel-canary`, usa un timeout RTT di 30s e il ruolo Convex
`maintainer` al di fuori della CI quando è selezionato Convex. Sovrascrivere
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
o `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` per regolare la misurazione dell'RTT senza
creare un comando RTT separato o un formato di riepilogo specifico per Telegram.

### QA di Discord

```bash
pnpm openclaw qa discord
```

Utilizza un singolo canale privato reale di un server Discord con due bot: un bot driver
controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio
tramite il Plugin Discord incluso. Verifica la gestione delle menzioni nel canale, che
il bot SUT abbia registrato su Discord il comando nativo `/help` e
gli scenari di evidenza Mantis facoltativi.

Variabili di ambiente obbligatorie quando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - deve corrispondere all'ID utente del bot SUT
  restituito da Discord (altrimenti la pipeline termina immediatamente con un errore).

Facoltativo:

- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` seleziona il canale vocale/palcoscenico per
  `discord-voice-autojoin`; in sua assenza, lo scenario seleziona il primo
  canale vocale/palcoscenico visibile al bot SUT.

Scenari del modulo YAML di Discord (`qa/scenarios/channels/discord-*.yaml`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - scenario vocale facoltativo. Viene eseguito da solo, abilita
  `channels.discord.voice.autoJoin` e verifica che lo stato vocale corrente del bot SUT
  su Discord corrisponda al canale vocale/palcoscenico di destinazione. Le credenziali Discord di Convex
  possono includere il valore facoltativo `voiceChannelId`; altrimenti l'adattatore del runner
  rileva il primo canale vocale/palcoscenico visibile nel server.
- `discord-status-reactions-tool-only` - scenario Mantis facoltativo. Viene eseguito
  da solo perché configura il SUT affinché invii risposte sempre attive e contenenti solo strumenti nel server
  tramite `messages.statusReactions.enabled=true`, quindi acquisisce una cronologia
  delle reazioni REST e artefatti visivi HTML/PNG. I report Mantis precedenti e successivi
  conservano inoltre gli artefatti MP4 forniti dallo scenario come `baseline.mp4`
  e `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - scenario Mantis facoltativo; vedere
  [Scenari Mantis di Discord](#discord-mantis-scenarios).

Eseguire esplicitamente lo scenario di accesso automatico al canale vocale di Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Eseguire esplicitamente lo scenario Mantis delle reazioni di stato:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Artefatti di output:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - voci di evidenza per i controlli del trasporto live.
- `discord-qa-reaction-timelines.json` e
  `discord-status-reactions-tool-only-timeline.png` quando viene eseguito lo scenario
  delle reazioni di stato.

### QA di Slack

```bash
pnpm openclaw qa slack
```

Utilizza un singolo canale privato reale di Slack con due bot distinti: un bot driver
controllato dall'harness e un bot SUT avviato dal Gateway OpenClaw figlio
tramite il Plugin Slack incluso.

Variabili di ambiente obbligatorie quando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Facoltativo:

- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` abilita i checkpoint di approvazione
  visiva per Mantis. L'adattatore scrive `<scenario>.pending.json` e
  `<scenario>.resolved.json`, quindi attende i file `.ack.json` corrispondenti.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` sovrascrive il timeout
  di conferma del checkpoint. Il valore predefinito è `120000`.

Scenari YAML canonici esposti tramite l'adattatore live di Slack:

- `thread-follow-up`
- `thread-isolation`

Scenari del modulo YAML di Slack (`qa/scenarios/channels/slack-*.yaml`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - verifica facoltativa su Slack reale che conferma che un
  canale configurato come disabilitato emetta un avviso strutturato senza rispondere.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` e
  `slack-progress-commentary-verbose-dedupe` - verifiche facoltative su Slack reale per
  controlli indipendenti dei commenti e dell'avanzamento degli strumenti, il valore
  predefinito legacy quando la chiave è omessa e il comportamento di consegna singola quando è attivo l'avanzamento dettagliato persistente.
- `slack-reaction-glyph-native` - scenario facoltativo di reazione tramite lo strumento dei messaggi live.
  Indica all'agente di passare esattamente il glifo `✅` e conferma che Slack abbia memorizzato
  `white_check_mark` per il bot SUT nel messaggio di destinazione.
- `slack-chart-presentation-native` - scenario facoltativo con grafico portabile che
  verifica il blocco nativo `data_visualization` e il testo accessibile esatto.
- `slack-table-presentation-native` - scenario facoltativo con tabella portabile che
  verifica il blocco nativo `data_table`, le righe esatte e il testo accessibile.
- `slack-table-invalid-blocks-fallback` - scenario facoltativo di trasporto diretto
  che invia tramite il percorso di invio Slack di produzione una tabella non elaborata, strutturalmente leggibile e oltre il limite, con 101 righe di dati
  più la relativa intestazione, dimostra che Slack stesso restituisce `invalid_blocks`
  e verifica che il fallback memorizzato con formattazione disabilitata sia completo e privo di
  blocchi dati nativi. I dettagli dello scenario conservano solo evidenze sicure relative a codice di errore, conteggio e
  valori booleani.
- `slack-approval-exec-native` - scenario facoltativo di approvazione nativa dell'esecuzione in Slack.
  Richiede un'approvazione dell'esecuzione tramite il Gateway, verifica che il messaggio Slack
  contenga pulsanti di approvazione nativi, la risolve e verifica l'aggiornamento Slack
  risolto.
- `slack-approval-plugin-native` - scenario facoltativo di approvazione nativa del Plugin
  in Slack. Abilita contemporaneamente l'inoltro delle approvazioni di esecuzione e del Plugin, affinché gli eventi del Plugin
  non vengano soppressi dall'instradamento delle approvazioni di esecuzione, quindi verifica lo stesso
  percorso dell'interfaccia utente nativa di Slack in stato in sospeso/risolto.
- `slack-codex-approval-exec-native` - scenario di approvazione dei comandi di Codex Guardian
  facoltativo. Abilita il Plugin Codex in modalità Guardian, instrada un turno
  dell'agente Gateway originato da Slack tramite l'harness app-server di Codex,
  attende la richiesta nativa di approvazione del Plugin in Slack per
  `openclaw-codex-app-server`, la risolve e verifica che il turno Codex
  termini con gli indicatori previsti dell'output del comando e dell'assistente.
- `slack-codex-approval-plugin-native` - scenario di approvazione dei file di Codex Guardian
  facoltativo. Usa un'istruzione `apply_patch` esterna all'area di lavoro affinché Codex emetta
  il percorso di approvazione delle modifiche ai file dell'app-server, quindi verifica lo stesso percorso
  nativo di approvazione Slack in sospeso/risolto, l'indicatore finale dell'assistente e il contenuto esatto del file
  prima della pulizia.

Gli scenari di approvazione Codex richiedono un `openai/*` o `codex/*` `--model`, le
normali credenziali del modello live e un'autenticazione Codex o tramite chiave API accettata dal Plugin Codex.
I dettagli dello scenario includono il metodo dell'app-server Codex, la chiave del modello Codex
selezionato, lo stato finale del turno Codex e la verifica dell'indicatore dell'operazione insieme ai
metadati oscurati dell'approvazione Slack.

Artefatti di output:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - voci di evidenza per i controlli del trasporto live.
- `approval-checkpoints/` - solo quando Mantis imposta
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contiene il JSON del checkpoint,
  il JSON di conferma e gli screenshot degli stati in sospeso/risolto.

#### Configurazione dell'area di lavoro Slack

La pipeline richiede due app Slack distinte nella stessa area di lavoro, oltre a un canale di cui entrambi
i bot siano membri:

- `channelId` - l'ID `Cxxxxxxxxxx` di un canale a cui entrambi i bot sono stati
  invitati. Usare un canale dedicato; la pipeline pubblica messaggi a ogni esecuzione.
- `driverBotToken` - token del bot (`xoxb-...`) dell'app **Driver**.
- `sutBotToken` - token del bot (`xoxb-...`) dell'app **SUT**, che deve essere
  un'app Slack distinta da quella del driver affinché l'ID utente del relativo bot sia diverso.
- `sutAppToken` - token a livello di app (`xapp-...`) dell'app SUT con
  `connections:write`, usato da Socket Mode affinché l'app SUT possa ricevere eventi.

È preferibile usare un'area di lavoro Slack dedicata alla QA anziché riutilizzare un'area di lavoro
di produzione.

Il manifesto SUT seguente limita intenzionalmente l'installazione di produzione
(`extensions/slack/src/setup-shared.ts:12`) del Plugin Slack incluso alle
autorizzazioni e agli eventi coperti dalla suite QA live di Slack. Per la
configurazione del canale di produzione come viene presentata agli utenti, vedere
[Configurazione rapida del canale Slack](/it/channels/slack#quick-setup); la coppia QA Driver/SUT
è intenzionalmente separata perché la pipeline richiede due ID utente di bot distinti
nella stessa area di lavoro.

**1. Creare l'app Driver**

Accedere a [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → scegliere l'area di lavoro QA, incollare il manifesto seguente,
quindi selezionare _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Bot driver di test per la pipeline live QA di OpenClaw per Slack"
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

Copiare il _Bot User OAuth Token_ (`xoxb-...`): diventa
`driverBotToken`. Il driver deve solo pubblicare messaggi e identificarsi;
non richiede eventi né Socket Mode.

**2. Creare l'app SUT**

Ripetere _Create New App → From a manifest_ nella stessa area di lavoro. Questa app QA
usa intenzionalmente una versione più limitata del manifesto di produzione
(`extensions/slack/src/setup-shared.ts:12`) del Plugin Slack incluso: gli ambiti
e gli eventi relativi alle reazioni sono omessi perché la suite QA live di Slack non copre
ancora la gestione delle reazioni.

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

Dopo che Slack ha creato l'app, eseguire due operazioni nella relativa pagina delle impostazioni:

- _Install to Workspace_ → copiare il _Bot User OAuth Token_ → diventa
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → aggiungere
  l'ambito `connections:write` → salvare → copiare il valore `xapp-...` → diventa
  `sutAppToken`.

Verificare che i due bot abbiano ID utente distinti chiamando `auth.test` per ciascun
token. Il runtime distingue il driver e il SUT tramite l'ID utente; il riutilizzo di un'unica app
per entrambi farà fallire immediatamente il controllo delle menzioni.

**3. Creare il canale**

Nell'area di lavoro QA, creare un canale (ad es. `#openclaw-qa`) e invitare entrambi i
bot dall'interno del canale:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copiare l'ID `Cxxxxxxxxxx` da _channel info → About → Channel ID_: diventa
`channelId`. È possibile utilizzare un canale pubblico; se si utilizza un canale privato,
entrambe le app dispongono già di `groups:history`, quindi le letture della cronologia da parte dell'harness
riusciranno comunque.

**4. Registrare le credenziali**

Sono disponibili due opzioni. Utilizzare le variabili di ambiente per il debug su una singola macchina (impostare le quattro
variabili `OPENCLAW_QA_SLACK_*` e passare `--credential-source env`), oppure inizializzare
il pool Convex condiviso affinché la CI e gli altri manutentori possano prenderle in leasing.

Per il pool Convex, scrivere i quattro campi in un file JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Con `OPENCLAW_QA_CONVEX_SITE_URL` e `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
esportati nella shell, registrare e verificare:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Sono previsti `count: 1`, `status: "active"` e nessun campo `lease`.

**5. Verificare end-to-end**

Eseguire la lane localmente per confermare che entrambi i bot possano comunicare tra loro tramite il
broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Un'esecuzione riuscita si completa in molto meno di 30 secondi e `qa-suite-report.md`
mostra sia `slack-canary` sia `slack-mention-gating` con stato `pass`. Se la
lane resta bloccata per ~90 secondi e termina con `Convex credential pool exhausted
for kind "slack"`, il pool è vuoto oppure tutte le righe sono in leasing: `qa
credentials list --kind slack --status all --json` indicherà quale delle due condizioni si è verificata.

### QA di WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Ha come destinazione due account WhatsApp Web dedicati: un account driver controllato
dall'harness e un account SUT avviato dal Gateway OpenClaw figlio tramite
il plugin WhatsApp incluso.

Variabili di ambiente obbligatorie quando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Facoltativo:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` abilita scenari di gruppo come
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, scenari di azioni, contenuti multimediali e sondaggi di gruppo
  e `whatsapp-group-allowlist-block`.

Scenari YAML di WhatsApp (`qa/scenarios/channels/whatsapp-*.yaml`):

- Riferimento di base e controllo dei gruppi: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Comandi nativi: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamento delle risposte e dell'output finale: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Azioni sui messaggi nel percorso utente: `whatsapp-agent-message-action-react` parte
  da un DM reale del driver, consente al modello di chiamare lo strumento `message` e
  osserva la reazione nativa di WhatsApp. `whatsapp-agent-message-action-upload-file`
  utilizza lo stesso approccio per `message(action=upload-file)` e osserva
  contenuti multimediali nativi di WhatsApp. `whatsapp-group-agent-message-action-react` e
  `whatsapp-group-agent-message-action-upload-file` dimostrano le stesse
  azioni visibili all'utente in un gruppo WhatsApp reale.
- Distribuzione al gruppo: `whatsapp-broadcast-group-fanout` parte da un singolo
  messaggio di gruppo WhatsApp con menzione e verifica risposte visibili distinte da `main`
  e `qa-second`.
- Attivazione del gruppo: `whatsapp-group-activation-always` modifica una sessione di gruppo reale
  impostandola su `/activation always`, dimostra che un messaggio di gruppo senza menzione attiva
  l'agente, quindi ripristina `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` inizializza una risposta del bot, le invia una
  risposta citata nativa senza una menzione esplicita e verifica che l'agente
  si attivi da tale contesto di risposta.
- Contenuti multimediali in entrata e messaggi strutturati: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Questi inviano tramite il driver eventi reali di WhatsApp relativi a immagini, audio, documenti, posizioni, contatti,
  adesivi e reazioni.
- Probe dirette del contratto del Gateway: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Queste bypassano intenzionalmente i prompt del modello
  e dimostrano i contratti deterministici `send`, `poll` e
  `message.action` del Gateway/canale.
- Copertura del controllo degli accessi: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Approvazioni native: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reazioni di stato: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Il catalogo contiene attualmente 52 scenari. La lane predefinita `live-frontier`
viene mantenuta ridotta a 8 scenari per una copertura smoke rapida. La lane predefinita `mock-openai`
esegue 39 scenari in modo deterministico tramite il trasporto WhatsApp reale,
simulando soltanto l'output del modello; gli scenari di approvazione e alcuni controlli
più pesanti o bloccanti restano espliciti tramite l'ID dello scenario.

Il driver QA di WhatsApp osserva eventi live strutturati (`text`, `media`,
`location`, `reaction` e `poll`) e può inviare attivamente contenuti multimediali, sondaggi,
contatti, posizioni e adesivi. QA Lab importa tale driver tramite la superficie
del pacchetto `@openclaw/whatsapp/api.js`, anziché accedere ai file privati
del runtime WhatsApp. Per le osservazioni dei gruppi, `fromJid` è il JID del gruppo,
mentre `participantJid` e `fromPhoneE164` identificano il partecipante mittente.
Il contenuto dei messaggi è oscurato per impostazione predefinita. Le probe dirette del Gateway per sondaggi, caricamento di file,
contenuti multimediali, sondaggi di gruppo, contenuti multimediali di gruppo e forma delle risposte sono controlli del contratto
di trasporto/API; non sono considerate una prova che un prompt utente abbia indotto
l'agente a scegliere la stessa azione. La prova delle azioni nel percorso utente proviene da scenari
come `whatsapp-agent-message-action-react` e
`whatsapp-group-agent-message-action-react`, nei quali il driver invia un normale
messaggio WhatsApp e QA Lab osserva l'artefatto WhatsApp nativo risultante.
I dettagli degli scenari WhatsApp includono l'approccio di ciascuno scenario (`user-path`,
`direct-gateway` o `native-approval`), affinché le evidenze non possano essere scambiate per un
contratto più forte di quello effettivamente dimostrato.

Artefatti di output:

- `qa-suite-report.md`
- `qa-suite-summary.json`
- `qa-evidence.json` - voci di evidenza per i controlli del trasporto live.

### Pool di credenziali Convex

Le lane Discord, Slack, Telegram e WhatsApp possono prendere in leasing le credenziali da un
pool Convex condiviso anziché leggere le variabili di ambiente indicate sopra. Passare
`--credential-source convex` (oppure impostare `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
QA Lab acquisisce un leasing esclusivo, ne mantiene attivo l'Heartbeat per la durata
dell'esecuzione e lo rilascia all'arresto. I tipi del pool sono `"discord"`, `"slack"`,
`"telegram"` e `"whatsapp"`.

Formati dei payload convalidati dal broker in `admin/add`:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` deve essere una stringa numerica dell'ID chat.
- Utente Telegram reale (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  esclusivamente per la prova di Telegram Desktop di Mantis. Le lane generiche di QA Lab non devono acquisire
  questo tipo.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - i numeri di telefono devono essere stringhe E.164 distinte.

Il flusso di lavoro di prova di Telegram Desktop di Mantis mantiene un singolo leasing Convex
esclusivo `telegram-user` sia per il driver CLI TDLib sia per il testimone Telegram Desktop,
quindi lo rilascia dopo la pubblicazione della prova.

Quando una PR richiede una differenza visiva deterministica, Mantis può utilizzare la stessa risposta
del modello simulata su `main` e sulla head della PR mentre cambia il formattatore
o il livello di consegna di Telegram. Le impostazioni predefinite di acquisizione sono ottimizzate per i commenti delle PR: classe
Crabbox standard, registrazione del desktop a 24fps, GIF del movimento a 24fps e larghezza dell'anteprima
di 1920px. I commenti prima/dopo devono pubblicare un pacchetto pulito contenente
soltanto le GIF previste.

Anche le lane Slack possono utilizzare il pool. I controlli del formato del payload Slack attualmente risiedono
nel runner QA di Slack anziché nel broker; utilizzare `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, con un
ID canale Slack come `Cxxxxxxxxxx`. Consultare
[Configurazione dell'area di lavoro Slack](#setting-up-the-slack-workspace) per il provisioning dell'app
e degli ambiti.

Le variabili di ambiente operative e il contratto dell'endpoint del broker Convex sono descritti in
[Test → Credenziali Telegram condivise tramite Convex](/it/help/testing#shared-telegram-credentials-via-convex-v1)
(il nome della sezione è precedente al pool multicanale; la semantica del leasing è
condivisa tra i tipi).

## Seed supportati dal repository

Gli asset seed si trovano in `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Sono intenzionalmente inclusi in git affinché il piano QA sia visibile sia alle persone sia
all'agente.

`qa-lab` rimane un runner generico di scenari YAML. Ogni file YAML di scenario è la
fonte di verità per una singola esecuzione di test e deve definire:

- `title` di primo livello
- metadati `scenario`
- metadati facoltativi relativi a categoria, funzionalità, lane e rischio in `scenario`
- riferimenti alla documentazione e al codice in `scenario`
- requisiti facoltativi dei plugin in `scenario`
- patch facoltativa della configurazione del Gateway in `scenario`
- `flow` eseguibile di primo livello per gli scenari di flusso, oppure
  `scenario.execution.kind` / `scenario.execution.path` per gli scenari Vitest e
  Playwright

La superficie di runtime riutilizzabile su cui si basa `flow` rimane generica e
trasversale. Ad esempio, gli scenari YAML possono combinare helper lato trasporto
con helper lato browser che controllano la Control UI incorporata tramite
il punto di integrazione `browser.request` del Gateway senza aggiungere un runner per casi speciali.

I file degli scenari devono essere raggruppati per funzionalità del prodotto anziché per cartella
dell'albero dei sorgenti. Mantenere stabili gli ID degli scenari quando i file vengono spostati; usare `docsRefs` e
`codeRefs` per la tracciabilità dell'implementazione.

L'elenco di base deve rimanere abbastanza ampio da includere:

- messaggi diretti e chat dei canali
- comportamento dei thread
- ciclo di vita delle azioni sui messaggi
- callback Cron
- recupero dalla memoria
- cambio di modello
- passaggio di consegne al sottoagente
- lettura del repository e della documentazione
- una piccola attività di compilazione, come Lobster Invaders

## Corsie mock dei provider

`qa suite` dispone di due corsie mock locali per i provider:

- `mock-openai` è il mock OpenClaw che tiene conto degli scenari. Rimane la corsia
  mock deterministica predefinita per la QA basata sul repository e i gate di parità.
- `aimock` avvia un server provider basato su AIMock per la copertura sperimentale
  di protocolli, fixture, registrazione/riproduzione e caos. È aggiuntivo e
  non sostituisce il dispatcher di scenari `mock-openai`.

L'implementazione delle corsie dei provider si trova in `extensions/qa-lab/src/providers/`.
Ogni provider gestisce i propri valori predefiniti, l'avvio del server locale, la configurazione del modello del Gateway,
le esigenze di predisposizione dei profili di autenticazione e i flag delle funzionalità live/mock. Il codice condiviso della suite e
del Gateway effettua l'instradamento tramite il registro dei provider anziché creare diramazioni
in base ai nomi dei provider.

## Adattatori di trasporto

`qa-lab` gestisce un punto di integrazione di trasporto generico per gli scenari QA YAML. `qa-channel` è
l'impostazione sintetica predefinita. `crabline` avvia server locali con la struttura dei provider ed
esegue su di essi i normali Plugin di canale di OpenClaw. `live` è riservato alle
credenziali reali dei provider e ai canali esterni.

A livello di architettura, la suddivisione è la seguente:

- `qa-lab` gestisce l'esecuzione generica degli scenari, la concorrenza dei worker, la scrittura
  degli artefatti e la generazione dei report.
- L'adattatore di trasporto gestisce la configurazione del Gateway, lo stato di disponibilità, l'osservazione
  in entrata e in uscita, le azioni di trasporto e lo stato di trasporto normalizzato.
- I file degli scenari YAML in `qa/scenarios/` definiscono l'esecuzione del test; `qa-lab`
  fornisce la superficie di runtime riutilizzabile che li esegue.

### Aggiunta di un canale

L'aggiunta di un canale al sistema QA YAML richiede l'implementazione del canale
e un pacchetto di scenari che eserciti il contratto del canale. Per la copertura CI
smoke, aggiungere il server provider locale Crabline corrispondente ed esporlo
tramite il driver `crabline`.

Non aggiungere una nuova radice di comando QA di primo livello quando l'host condiviso `qa-lab` può
gestire il flusso.

`qa-lab` gestisce i meccanismi dell'host condiviso:

- la radice di comando `openclaw qa`
- avvio e arresto della suite
- concorrenza dei worker
- scrittura degli artefatti
- generazione dei report
- esecuzione degli scenari
- alias di compatibilità per gli scenari `qa-channel` meno recenti

I Plugin runner gestiscono il contratto di trasporto:

- come `openclaw qa <runner>` viene montato sotto la radice condivisa `qa`
- come viene configurato il Gateway per tale trasporto
- come viene verificato lo stato di disponibilità
- come vengono inseriti gli eventi in entrata
- come vengono osservati i messaggi in uscita
- come vengono esposte le trascrizioni e lo stato di trasporto normalizzato
- come vengono eseguite le azioni basate sul trasporto
- come vengono gestiti il ripristino o la pulizia specifici del trasporto

I requisiti minimi per l'adozione di un nuovo canale:

1. Mantenere `qa-lab` come responsabile della radice condivisa `qa`.
2. Implementare il runner di trasporto sul punto di integrazione dell'host condiviso `qa-lab`.
3. Mantenere i meccanismi specifici del trasporto all'interno del Plugin runner o dell'harness
   del canale.
4. Montare il runner come `openclaw qa <runner>` anziché registrare una
   radice di comando concorrente. I Plugin runner devono dichiarare `qaRunners` in
   `openclaw.plugin.json` ed esportare un array `qaRunnerCliRegistrations`
   corrispondente da `runtime-api.ts`. Mantenere `runtime-api.ts` leggero; la CLI lazy e
   l'esecuzione del runner devono rimanere dietro punti di ingresso separati. Un elemento facoltativo
   `adapterFactory` espone il trasporto agli scenari condivisi senza modificare
   il catalogo degli scenari esistente del comando.
5. Creare o adattare gli scenari YAML nelle directory tematiche `qa/scenarios/`.
6. Usare gli helper generici degli scenari per i nuovi scenari.
7. Mantenere funzionanti gli alias di compatibilità esistenti, a meno che il repository non stia eseguendo una
   migrazione intenzionale.

La regola decisionale è rigorosa:

- Se un comportamento può essere espresso una sola volta in `qa-lab`, inserirlo in `qa-lab`.
- Se un comportamento dipende dal trasporto di un singolo canale, mantenerlo nel relativo Plugin
  runner o nell'harness del Plugin.
- Se uno scenario richiede una nuova funzionalità utilizzabile da più di un canale,
  aggiungere un helper generico anziché una diramazione specifica del canale in `suite.ts`.
- Se un comportamento è significativo solo per un trasporto, mantenere lo scenario
  specifico del trasporto e renderlo esplicito nel contratto dello scenario.

### Nomi degli helper degli scenari

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

Gli alias di compatibilità rimangono disponibili per gli scenari esistenti:
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus`; tuttavia, per la creazione di nuovi scenari
si devono usare i nomi generici. Gli alias esistono per evitare una migrazione
simultanea, non come modello da seguire in futuro.

## Generazione dei report

`qa-lab` esporta un report Markdown del protocollo dalla sequenza temporale osservata del bus.
Il report deve indicare:

- Cosa ha funzionato
- Cosa non ha funzionato
- Cosa è rimasto bloccato
- Quali scenari di follow-up vale la pena aggiungere

Per ottenere l'inventario degli scenari disponibili, utile per dimensionare il lavoro di follow-up
o collegare un nuovo trasporto, eseguire `pnpm openclaw qa coverage` (aggiungere `--json`
per un output leggibile dalla macchina). Per scegliere una verifica mirata per un comportamento
o un percorso di file interessato, eseguire `pnpm openclaw qa coverage --match <query>`. Il
report delle corrispondenze cerca nei metadati degli scenari, nei riferimenti alla documentazione, nei riferimenti al codice, negli ID di copertura,
nei Plugin e nei requisiti dei provider, quindi stampa le destinazioni `qa suite
--scenario ...` corrispondenti.

Ogni esecuzione di `qa suite` scrive gli artefatti di primo livello `qa-evidence.json`,
`qa-suite-summary.json` e `qa-suite-report.md` per l'insieme di scenari
selezionato. Gli scenari che dichiarano `execution.kind: vitest` o
`execution.kind: playwright` eseguono il percorso di test corrispondente e scrivono inoltre
log per ogni scenario. Gli scenari che dichiarano `execution.kind: script` eseguono il
produttore di evidenze in `execution.path` tramite `node --import tsx` (con
`${outputDir}` e `${scenarioId}` espansi in `execution.args`); il
produttore scrive il proprio `qa-evidence.json`, le cui voci vengono importate nell'output
della suite e i cui percorsi degli artefatti vengono risolti relativamente a tale
`qa-evidence.json` del produttore. Quando `qa suite` viene raggiunto tramite `qa run
--qa-profile`, lo stesso `qa-evidence.json` include anche il riepilogo della
scheda di valutazione del profilo per le categorie della tassonomia selezionate.

Considerare l'output della copertura come ausilio alla scoperta, non come sostituto dei gate; lo
scenario selezionato richiede comunque la modalità provider, il trasporto live,
Multipass, Testbox o la corsia di rilascio appropriati per il comportamento sottoposto a test. Per
il contesto della scheda di valutazione, vedere [Scheda di valutazione della maturità](/it/maturity/scorecard).

Per i controlli di carattere e stile, eseguire lo stesso scenario con più riferimenti a modelli
live e scrivere un report Markdown valutato:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Il comando esegue processi figlio del Gateway QA locale, non Docker. Gli scenari
di valutazione del carattere devono impostare la personalità tramite `SOUL.md`, quindi eseguire normali
interazioni utente, come chat, assistenza per il workspace e piccole attività sui file. Al modello candidato
non deve essere comunicato che è sottoposto a valutazione. Il comando conserva
ogni trascrizione completa, registra le statistiche di base dell'esecuzione, quindi chiede ai modelli giudici in
modalità veloce con ragionamento `xhigh`, ove supportato, di classificare le esecuzioni per
naturalezza, stile e umorismo. Usare `--blind-judge-models` quando si confrontano
i provider: il prompt del giudice riceve comunque ogni trascrizione e stato dell'esecuzione, ma
i riferimenti dei candidati vengono sostituiti con etichette neutre come `candidate-01`; dopo l'analisi, il
report riconduce le classifiche ai riferimenti reali.

Le esecuzioni dei candidati usano per impostazione predefinita il ragionamento `high`, con `medium` per GPT-5.6 Luna e
`xhigh` per i riferimenti di valutazione OpenAI meno recenti che lo supportano. Per sovrascrivere uno specifico
candidato in linea, usare `--model provider/model,thinking=<level>`; le
opzioni in linea supportano anche `fast`, `no-fast` e `fast=<bool>`. `--thinking
<level>` imposta ancora un valore di ripiego globale e la forma precedente `--model-thinking
<provider/model=level>` viene mantenuta per compatibilità. I riferimenti dei candidati
OpenAI usano per impostazione predefinita la modalità veloce, affinché venga utilizzata l'elaborazione prioritaria dove il provider
la supporta. Passare `--fast` solo quando si desidera forzare l'attivazione della modalità veloce per
ogni modello candidato. Le durate dei candidati e dei giudici vengono registrate nel
report per l'analisi dei benchmark, ma i prompt dei giudici specificano esplicitamente di non classificare
in base alla velocità. Sia le esecuzioni dei modelli candidati sia quelle dei modelli giudici usano per impostazione predefinita una concorrenza di 16.
Ridurre `--concurrency` o `--judge-concurrency` quando i limiti del provider o il carico
del Gateway locale rendono un'esecuzione troppo instabile.

Quando non viene passato alcun `--model` candidato, la valutazione del carattere usa per impostazione predefinita
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` e `google/gemini-3.1-pro-preview`. Quando non viene
passato alcun `--judge-model`, i giudici predefiniti sono
`openai/gpt-5.6-sol,thinking=xhigh,fast` e
`anthropic/claude-opus-4-8,thinking=high`.

## Documentazione correlata

- [Scheda di valutazione della maturità](/it/maturity/scorecard)
- [Pacchetto di benchmark per agenti personali](/it/concepts/personal-agent-benchmark-pack)
- [Canale QA](/it/channels/qa-channel)
- [Test](/it/help/testing)
- [Dashboard](/it/web/dashboard)
