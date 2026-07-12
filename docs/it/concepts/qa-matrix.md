---
read_when:
    - Esecuzione locale di pnpm openclaw qa matrix
    - Aggiunta o selezione di scenari di QA per Matrix
    - Triage di errori, timeout o blocchi della pulizia nel QA di Matrix
summary: 'Riferimento per i manutentori del flusso di QA live di Matrix basato su Docker: CLI, profili, variabili di ambiente, scenari e artefatti di output.'
title: QA di Matrix
x-i18n:
    generated_at: "2026-07-12T07:01:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

La corsia QA di Matrix esegue il Plugin `@openclaw/matrix` incluso su un homeserver Tuwunel temporaneo in Docker, con account temporanei per driver, SUT e osservatore, oltre a stanze preconfigurate. Fornisce la copertura reale, con trasporto effettivo, per Matrix.

Strumentazione riservata ai manutentori. Le versioni distribuite di OpenClaw omettono `qa-lab`, quindi `openclaw qa` viene eseguito solo da un checkout del codice sorgente, che carica direttamente l'esecutore incluso senza alcun passaggio di installazione del Plugin.

Per un contesto più ampio sul framework QA, consulta la [panoramica QA](/it/concepts/qa-e2e-automation).

## Avvio rapido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il semplice comando `pnpm openclaw qa matrix` esegue `--profile all` e non si arresta al primo errore. Suddividi l'inventario completo tra processi paralleli con `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## Funzionamento della corsia

1. Predispone un homeserver Tuwunel temporaneo in Docker (immagine predefinita `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome del server `matrix-qa.test`, porta `28008`) dietro un registratore limitato di richieste e risposte che oscura i dati sensibili.
2. Registra tre utenti temporanei: `driver` (invia il traffico in entrata), `sut` (l'account Matrix di OpenClaw sottoposto a test), `observer` (acquisisce il traffico di terze parti).
3. Preconfigura le stanze richieste dagli scenari selezionati (principale, conversazioni in thread, contenuti multimediali, riavvio, secondaria, elenco di autorizzazione, E2EE, messaggio diretto di verifica e così via).
4. Esegue la sonda del protocollo `matrix-qa-v1`, indipendente dal substrato, sul confine Tuwunel registrato. I test unitari verificano il contratto della sonda con il dispositivo di test del protocollo Matrix; l'host canonico dell'adattatore di trasporto QA in [#99707](https://github.com/openclaw/openclaw/pull/99707) gestisce il collegamento ai target Crabline reali.
5. Avvia un Gateway OpenClaw figlio con il Plugin Matrix reale limitato all'account SUT.
6. Esegue gli scenari in sequenza, osservando gli eventi tramite i client Matrix del driver e dell'osservatore e ricavando le aspettative relative a instradamento e stato dal traffico registrato.
7. Arresta l'homeserver, scrive il rapporto e gli artefatti delle prove, quindi termina.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Opzioni comuni

| Opzione               | Valore predefinito                           | Descrizione                                                                                                                                                                           |
| --------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                        | Profilo degli scenari. Consulta [Profili](#profiles).                                                                                                                                 |
| `--fail-fast`         | disattivato                                  | Si arresta dopo il primo controllo o scenario non riuscito.                                                                                                                           |
| `--scenario <id>`     | -                                            | Esegue solo questo scenario. Ripetibile. Consulta [Scenari](#scenarios).                                                                                                               |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Percorso in cui vengono scritti rapporti, riepilogo, inventario di instradamento e stato, eventi osservati e registro di output. I percorsi relativi vengono risolti rispetto a `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                              | Radice del repository quando il comando viene richiamato da una directory di lavoro neutra.                                                                                           |
| `--sut-account <id>`  | `sut`                                        | ID dell'account Matrix nella configurazione del Gateway QA.                                                                                                                           |

### Opzioni del provider

La corsia utilizza un trasporto Matrix reale, ma il provider del modello è configurabile:

| Opzione                  | Valore predefinito        | Descrizione                                                                                                                                                                                     |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`           | `mock-openai` per l'inoltro simulato deterministico oppure `live-frontier` per provider avanzati in tempo reale. L'alias precedente `live-openai` continua a funzionare.                         |
| `--model <ref>`          | predefinito del provider  | Riferimento `provider/model` principale.                                                                                                                                                         |
| `--alt-model <ref>`      | predefinito del provider  | Riferimento `provider/model` alternativo per gli scenari che cambiano modello durante l'esecuzione.                                                                                              |
| `--fast`                 | disattivato               | Abilita la modalità rapida del provider, se supportata.                                                                                                                                         |

Il QA di Matrix non accetta `--credential-source` o `--credential-role`. La corsia predispone localmente utenti temporanei; non è presente alcun pool condiviso di credenziali da cui effettuare un'assegnazione temporanea.

## Profili

| Profilo         | Utilizzo                                                                                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (predefinito) | Catalogo completo. Lento ma esaustivo.                                                                                                                                                                                                                     |
| `fast`          | Sottoinsieme per il controllo delle versioni che verifica il contratto imperativo del trasporto reale: filtro delle menzioni, blocco tramite elenco di autorizzazione, struttura delle risposte, ripresa dopo il riavvio, osservazione delle reazioni, consegna dei metadati di approvazione dell'esecuzione e risposta E2EE di base. |
| `transport`     | Scenari a livello di trasporto relativi a thread, messaggi diretti, stanze, accesso automatico, menzioni ed elenchi di autorizzazione, approvazioni e reazioni.                                                                                                |
| `media`         | Copertura degli allegati immagine, audio, video, PDF ed EPUB.                                                                                                                                                                                                 |
| `e2ee-smoke`    | Copertura E2EE minima: risposta crittografata di base, seguito nel thread e inizializzazione riuscita.                                                                                                                                                         |
| `e2ee-deep`     | Scenari esaustivi E2EE relativi a perdita dello stato, backup, chiavi e ripristino.                                                                                                                                                                            |
| `e2ee-cli`      | Scenari CLI `openclaw matrix encryption setup` e `verify *` eseguiti tramite l'infrastruttura di test QA.                                                                                                                                                     |

La mappatura esatta si trova in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenari

L'adattatore Matrix condiviso espone questi scenari YAML canonici tramite `openclaw qa suite --channel-driver live --channel matrix`:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` rimane disponibile tramite la selezione esplicita `--scenario subagent-thread-spawn`,
ma non fa parte dell'insieme Matrix condiviso predefinito finché la prova reale del completamento del processo figlio non sarà stabile.

L'elenco degli ID dei restanti scenari imperativi è l'unione `MatrixQaScenarioId` in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Categorie:

- thread: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- livello principale / messaggio diretto / stanza: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming e avanzamento degli strumenti: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- contenuti multimediali: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- instradamento: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reazioni: `matrix-reaction-*`
- approvazioni: `matrix-approval-*` (metadati di esecuzione e Plugin, ripiego suddiviso in blocchi, reazioni di rifiuto, thread e instradamento `target: "both"`)
- riavvio e riproduzione: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- filtro delle menzioni, comunicazione tra bot ed elenchi di autorizzazione: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (risposta di base, seguito nel thread, inizializzazione, ciclo di vita della chiave di ripristino, varianti di perdita dello stato, comportamento del backup sul server, integrità dei dispositivi, verifica SAS / QR / tramite messaggio diretto, riavvio, oscuramento degli artefatti)
- CLI E2EE: `matrix-e2ee-cli-*` (configurazione della crittografia, configurazione idempotente, errore di inizializzazione, ciclo di vita della chiave di ripristino, account multipli, ciclo completo di risposta del Gateway, autoverifica)

Passa `--scenario <id>` (ripetibile) per eseguire un insieme selezionato manualmente; combinalo con `--profile all` per ignorare il filtro del profilo.

## Variabili di ambiente

| Variabile                               | Valore predefinito                        | Effetto                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite massimo assoluto per l'intera esecuzione.                                                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite per la risposta canary iniziale. La CI di rilascio lo aumenta sui runner condivisi, affinché un primo turno lento del Gateway non causi un errore prima dell'inizio della copertura degli scenari. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Finestra di inattività per le asserzioni negative di mancata risposta. Limitata a `<=` il timeout dell'esecuzione.                                                                                      |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite per l'arresto di Docker. Le segnalazioni di errore includono il comando di ripristino `docker compose ... down --remove-orphans`.                                                               |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Sostituisce l'immagine dell'homeserver durante la convalida con una versione diversa di Tuwunel.                                                                                                       |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | attivo                                    | `0` disattiva le righe di avanzamento `[matrix-qa] ...` su stderr. `1` ne forza la visualizzazione.                                                                                                    |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | oscurato                                  | `1` conserva il corpo del messaggio e `formatted_body` in `matrix-qa-observed-events.json`. Per impostazione predefinita li oscura per proteggere gli artefatti della CI.                              |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | disattivo                                 | `1` evita il `process.exit` deterministico dopo la scrittura degli artefatti. Il comportamento predefinito forza l'uscita perché gli handle crittografici nativi di matrix-js-sdk possono mantenere attivo il ciclo degli eventi dopo il completamento degli artefatti. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | non impostato                             | Quando viene impostato da un launcher esterno (ad es. `scripts/run-node.mjs`), il QA Matrix riutilizza quel percorso di log anziché avviare il proprio tee.                                              |

## Artefatti di output

Scritti in `--output-dir` (valore predefinito `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, affinché le esecuzioni successive non si sovrascrivano):

- `matrix-qa-report.md`: rapporto del protocollo in Markdown (cosa è riuscito, non è riuscito, è stato ignorato e perché).
- `matrix-qa-summary.json`: riepilogo strutturato adatto all'analisi della CI e ai pannelli di controllo.
- `matrix-qa-route-state-manifest.json`: inventario dinamico `matrix-qa-v1` indicizzato per ID dello scenario. Registra le forme oscurate di route e corpi, l'ordine delle richieste, i nuovi tentativi osservati, gli errori, la continuità dei token di sincronizzazione e le famiglie di stato relative a dispositivi, chiavi, contenuti multimediali e backup osservate durante l'esecuzione. Si tratta di prove eseguibili, non di una baseline inclusa nel repository.
- `matrix-qa-observed-events.json`: eventi Matrix osservati dai client driver e osservatore. I corpi sono oscurati a meno che non sia impostato `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; i metadati di approvazione sono riepilogati con campi sicuri selezionati e un'anteprima troncata del comando.
- `matrix-qa-output.log`: stdout/stderr combinati dell'esecuzione. Se `OPENCLAW_RUN_NODE_OUTPUT_LOG` è impostato, viene invece riutilizzato il log del launcher esterno.

## Suggerimenti per la diagnosi

- **L'esecuzione si blocca verso la fine:** gli handle crittografici nativi di `matrix-js-sdk` possono sopravvivere all'harness. Il comportamento predefinito forza un `process.exit` pulito dopo la scrittura degli artefatti; se si imposta `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, è normale che il processo rimanga attivo.
- **Errore di pulizia:** cercare il comando di ripristino stampato (una chiamata `docker compose ... down --remove-orphans`) ed eseguirlo manualmente per liberare la porta dell'homeserver.
- **Finestre instabili per le asserzioni negative nella CI:** ridurre `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (valore predefinito 8 s) quando la CI è veloce; aumentarlo sui runner condivisi lenti.
- **Servono corpi oscurati per una segnalazione di bug:** rieseguire con `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` e allegare `matrix-qa-observed-events.json`. Trattare l'artefatto risultante come sensibile.
- **Versione diversa di Tuwunel:** impostare `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` sulla versione sottoposta a test. Nella corsia viene registrata solo l'immagine predefinita fissata.

## Contratto del trasporto in tempo reale

Matrix è una delle tre corsie di trasporto in tempo reale (Matrix, Telegram, Discord) che condividono un'unica lista di controllo del contratto definita in [Panoramica QA: copertura del trasporto in tempo reale](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` rimane l'ampia suite sintetica e non fa intenzionalmente parte di tale matrice.

## Contenuti correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation): stack QA complessivo e contratto del trasporto in tempo reale
- [Canale QA](/it/channels/qa-channel): adattatore di canale sintetico per scenari supportati dal repository
- [Test](/it/help/testing): esecuzione dei test e aggiunta della copertura QA
- [Matrix](/it/channels/matrix): il Plugin del canale sottoposto a test
