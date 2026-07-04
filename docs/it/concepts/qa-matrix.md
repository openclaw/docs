---
read_when:
    - Esecuzione di `pnpm openclaw qa matrix` in locale
    - Aggiunta o selezione di scenari QA Matrix
    - Triage di errori QA Matrix, timeout o pulizia bloccata
summary: 'Riferimento per i maintainer per la lane di QA live Matrix basata su Docker: CLI, profili, variabili d''ambiente, scenari e artefatti di output.'
title: Matrix QA
x-i18n:
    generated_at: "2026-07-04T20:33:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4f7fd98b5e7fef7a30c8820c5a1fc48c199e4d09db34255e8b2287a047b339f
    source_path: concepts/qa-matrix.md
    workflow: 16
---

La corsia QA Matrix esegue il Plugin `@openclaw/matrix` incluso contro un homeserver Tuwunel usa e getta in Docker, con account temporanei per driver, SUT e observer più stanze prepopolate. È la copertura live con trasporto reale per Matrix.

Questo è tooling riservato ai maintainer. Le release pacchettizzate di OpenClaw omettono intenzionalmente `qa-lab`, quindi `openclaw qa` è disponibile solo da un checkout sorgente. I checkout sorgente caricano direttamente il runner incluso: non è necessario alcun passaggio di installazione del Plugin.

Per un contesto più ampio sul framework QA, consulta la [panoramica QA](/it/concepts/qa-e2e-automation).

## Avvio rapido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Il comando semplice `pnpm openclaw qa matrix` esegue `--profile all` e non si ferma al primo errore. Usa `--profile fast --fail-fast` per un gate di rilascio; suddividi il catalogo con `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` quando esegui l'inventario completo in parallelo.

## Cosa fa la corsia

1. Provisiona un homeserver Tuwunel usa e getta in Docker (immagine predefinita `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome server `matrix-qa.test`, porta `28008`) dietro un registratore limitato e con redazione di richieste/risposte.
2. Registra tre utenti temporanei: `driver` (invia traffico in ingresso), `sut` (l'account Matrix di OpenClaw sotto test), `observer` (acquisizione del traffico di terze parti).
3. Prepopola le stanze richieste dagli scenari selezionati (principale, threading, media, riavvio, secondaria, allowlist, E2EE, DM di verifica, ecc.).
4. Esegue la probe del protocollo `matrix-qa-v1` neutrale rispetto al substrate contro il boundary Tuwunel registrato. Gli unit test dimostrano il contratto della probe con la fixture del protocollo Matrix; l'host canonico dell'adapter di trasporto QA in [#99707](https://github.com/openclaw/openclaw/pull/99707) possiede il cablaggio reale del target Crabline.
5. Avvia un Gateway OpenClaw figlio con il Plugin Matrix reale limitato all'account SUT; `qa-channel` non viene caricato nel figlio.
6. Esegue gli scenari in sequenza, osservando gli eventi tramite i client Matrix driver/observer e derivando le aspettative di route/stato dal traffico registrato.
7. Smantella l'homeserver, scrive report e artefatti di evidenza, quindi termina.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flag comuni

| Flag                  | Predefinito                                   | Descrizione                                                                                                                                                         |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Profilo scenario. Vedi [Profili](#profiles).                                                                                                                       |
| `--fail-fast`         | disattivato                                  | Si ferma dopo il primo controllo o scenario non riuscito.                                                                                                          |
| `--scenario <id>`     | -                                             | Esegue solo questo scenario. Ripetibile. Vedi [Scenari](#scenarios).                                                                                               |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Dove vengono scritti report, riepilogo, inventario route/stato, eventi osservati e log di output. I percorsi relativi vengono risolti rispetto a `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Root del repository quando l'invocazione avviene da una directory di lavoro neutrale.                                                                              |
| `--sut-account <id>`  | `sut`                                         | ID dell'account Matrix nella configurazione del Gateway QA.                                                                                                        |

### Flag del provider

La corsia usa un trasporto Matrix reale, ma il provider del modello è configurabile:

| Flag                     | Predefinito      | Descrizione                                                                                                                                          |
| ------------------------ | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` per dispatch mock deterministico o `live-frontier` per provider frontier live. L'alias legacy `live-openai` funziona ancora.        |
| `--model <ref>`          | default provider | Ref primaria `provider/model`.                                                                                                                       |
| `--alt-model <ref>`      | default provider | Ref alternativa `provider/model` quando gli scenari cambiano modello durante l'esecuzione.                                                           |
| `--fast`                 | disattivato      | Abilita la modalità veloce del provider dove supportata.                                                                                             |

Matrix QA non accetta `--credential-source` o `--credential-role`. La corsia provisiona utenti usa e getta localmente; non esiste alcun pool di credenziali condiviso da cui effettuare lease.

## Profili

Il profilo selezionato decide quali scenari eseguire.

| Profilo         | Usalo per                                                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (default) | Catalogo completo. Lento ma esaustivo.                                                                                                                                                                                                   |
| `fast`          | Sottoinsieme per gate di rilascio che esercita il contratto del trasporto live: canary, gating delle menzioni, blocco allowlist, forma della risposta, ripresa dopo riavvio, follow-up del thread, isolamento dei thread, osservazione delle reazioni e consegna dei metadati di approvazione exec. |
| `transport`     | Scenari a livello di trasporto per threading, DM, stanza, autojoin, menzioni/allowlist, approvazione e reazioni.                                                                                                                         |
| `media`         | Copertura allegati immagine, audio, video, PDF, EPUB.                                                                                                                                                                                     |
| `e2ee-smoke`    | Copertura E2EE minima: risposta cifrata di base, follow-up del thread, bootstrap riuscito.                                                                                                                                                |
| `e2ee-deep`     | Scenari E2EE esaustivi di perdita di stato, backup, chiavi e recovery.                                                                                                                                                                    |
| `e2ee-cli`      | Scenari CLI `openclaw matrix encryption setup` e `verify *` eseguiti tramite l'harness QA.                                                                                                                                                |

La mappatura esatta vive in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenari

L'elenco completo degli ID scenario è la union `MatrixQaScenarioId` in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Le categorie includono:

- threading - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- livello superiore / DM / stanza - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming e avanzamento degli strumenti - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reazioni - `matrix-reaction-*`
- approvazioni - `matrix-approval-*` (metadati exec/Plugin, fallback a chunk, reazioni di rifiuto, thread e routing `target: "both"`)
- riavvio e replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- gating delle menzioni, bot-to-bot e allowlist - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (risposta di base, follow-up del thread, bootstrap, ciclo di vita della chiave di recovery, varianti di perdita di stato, comportamento del backup server, igiene dei dispositivi, verifica SAS / QR / DM, riavvio, redazione degli artefatti)
- E2EE CLI - `matrix-e2ee-cli-*` (setup cifratura, setup idempotente, errore di bootstrap, ciclo di vita della chiave di recovery, multi-account, round trip gateway-reply, autoverifica)

Passa `--scenario <id>` (ripetibile) per eseguire un set selezionato manualmente; combina con `--profile all` per ignorare il gating del profilo.

## Variabili d'ambiente

| Variabile                               | Predefinito                               | Effetto                                                                                                                                                                                                      |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite superiore rigido per l'intera esecuzione.                                                                                                                                                             |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite per la risposta canary iniziale. La CI di rilascio aumenta questo valore sui runner condivisi, così un primo turno Gateway lento non fallisce prima dell'inizio della copertura degli scenari.          |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Finestra di silenzio per le asserzioni negative senza risposta. Limitata a `≤` il timeout dell'esecuzione.                                                                                                    |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite per il teardown Docker. Le superfici di errore includono il comando di ripristino `docker compose ... down --remove-orphans`.                                                                          |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Sovrascrive l'immagine dell'homeserver quando si convalida con una versione diversa di Tuwunel.                                                                                                               |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | attivo                                    | `0` silenzia le righe di avanzamento `[matrix-qa] ...` su stderr. `1` le forza attive.                                                                                                                        |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redatto                                   | `1` mantiene il corpo del messaggio e `formatted_body` in `matrix-qa-observed-events.json`. Il valore predefinito li redige per mantenere sicuri gli artefatti CI.                                           |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | disattivo                                 | `1` salta il `process.exit` deterministico dopo la scrittura degli artefatti. Il valore predefinito forza l'uscita perché gli handle di crittografia nativa di matrix-js-sdk possono mantenere attivo l'event loop oltre il completamento degli artefatti. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | non impostata                             | Quando impostata da un launcher esterno (ad esempio `scripts/run-node.mjs`), Matrix QA riutilizza quel percorso di log invece di avviare il proprio tee.                                                     |

## Artefatti di output

Scritti in `--output-dir`:

- `matrix-qa-report.md` - report di protocollo Markdown (cosa è passato, fallito, è stato saltato e perché).
- `matrix-qa-summary.json` - riepilogo strutturato adatto al parsing CI e alle dashboard.
- `matrix-qa-route-state-manifest.json` - inventario dinamico `matrix-qa-v1` indicizzato per id scenario. Registra forme redatte di route/corpo, ordine delle richieste, retry osservati, errori, continuità dei sync-token e famiglie di stato dispositivo/chiave/media/backup osservate durante quell'esecuzione. Questa è evidenza eseguibile, non una baseline archiviata nel repository.
- `matrix-qa-observed-events.json` - eventi Matrix osservati dai client driver e observer. I corpi sono redatti a meno che `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; i metadati di approvazione sono riepilogati con campi sicuri selezionati e un'anteprima del comando troncata.
- `matrix-qa-output.log` - stdout/stderr combinati dall'esecuzione. Se `OPENCLAW_RUN_NODE_OUTPUT_LOG` è impostata, viene invece riutilizzato il log del launcher esterno.

La directory di output predefinita è `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, così le esecuzioni successive non si sovrascrivono.

## Suggerimenti di triage

- **L'esecuzione resta bloccata verso la fine:** gli handle di crittografia nativa di `matrix-js-sdk` possono sopravvivere all'harness. Il valore predefinito forza un `process.exit` pulito dopo la scrittura degli artefatti; se hai disimpostato `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, aspettati che il processo rimanga attivo.
- **Errore di pulizia:** cerca il comando di ripristino stampato (un'invocazione `docker compose ... down --remove-orphans`) ed eseguilo manualmente per liberare la porta dell'homeserver.
- **Finestre di asserzione negativa instabili in CI:** abbassa `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (predefinito 8 s) quando la CI è veloce; aumentalo sui runner condivisi lenti.
- **Servono corpi redatti per un bug report:** riesegui con `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` e allega `matrix-qa-observed-events.json`. Tratta l'artefatto risultante come sensibile.
- **Versione Tuwunel diversa:** punta `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` alla versione in test. La lane controlla solo l'immagine predefinita fissata.

## Contratto di trasporto live

Matrix è una delle tre lane di trasporto live (Matrix, Telegram, Discord) che condividono una singola checklist di contratto definita in [Panoramica QA → Copertura del trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` resta la suite sintetica ampia e intenzionalmente non fa parte di quella matrice.

## Correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation) - stack QA complessivo e contratto di trasporto live
- [Canale QA](/it/channels/qa-channel) - adattatore di canale sintetico per scenari basati sul repository
- [Test](/it/help/testing) - esecuzione dei test e aggiunta di copertura QA
- [Matrix](/it/channels/matrix) - il Plugin di canale in test
