---
read_when:
    - Esecuzione di pnpm openclaw qa matrix in locale
    - Aggiunta o selezione di scenari QA di Matrix
    - Triage degli errori di Matrix QA, dei timeout o della pulizia bloccata
summary: 'Riferimento per manutentori per il percorso di QA live Matrix basato su Docker: CLI, profili, variabili d''ambiente, scenari e artefatti di output.'
title: Matrice QA
x-i18n:
    generated_at: "2026-05-06T08:47:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
---

La lane QA Matrix esegue il Plugin `@openclaw/matrix` incluso contro un homeserver Tuwunel temporaneo in Docker, con account temporanei per driver, SUT e observer, più stanze prepopolate. È la copertura live con trasporto reale per Matrix.

Questo tooling è riservato ai maintainer. Le release pacchettizzate di OpenClaw omettono intenzionalmente `qa-lab`, quindi `openclaw qa` è disponibile solo da un checkout sorgente. I checkout sorgente caricano direttamente il runner incluso: non è necessario alcun passaggio di installazione del Plugin.

Per un contesto più ampio sul framework QA, vedi [panoramica QA](/it/concepts/qa-e2e-automation).

## Avvio rapido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` semplice esegue `--profile all` e non si ferma al primo errore. Usa `--profile fast --fail-fast` per un gate di release; suddividi il catalogo con `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` quando esegui l'inventario completo in parallelo.

## Cosa fa la lane

1. Esegue il provisioning di un homeserver Tuwunel temporaneo in Docker (immagine predefinita `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome server `matrix-qa.test`, porta `28008`).
2. Registra tre utenti temporanei: `driver` (invia traffico in ingresso), `sut` (l'account Matrix OpenClaw sotto test), `observer` (acquisizione del traffico di terze parti).
3. Prepopola le stanze richieste dagli scenari selezionati (principale, thread, media, riavvio, secondaria, allowlist, E2EE, DM di verifica, ecc.).
4. Avvia un Gateway OpenClaw figlio con il vero Plugin Matrix limitato all'account SUT; `qa-channel` non viene caricato nel figlio.
5. Esegue gli scenari in sequenza, osservando gli eventi tramite i client Matrix driver/observer.
6. Arresta l'homeserver, scrive report e artefatti di riepilogo, quindi termina.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flag comuni

| Flag                  | Predefinito                                   | Descrizione                                                                                                              |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | Profilo scenario. Vedi [Profili](#profiles).                                                                            |
| `--fail-fast`         | disattivato                                   | Ferma l'esecuzione dopo il primo controllo o scenario non riuscito.                                                      |
| `--scenario <id>`     | -                                             | Esegue solo questo scenario. Ripetibile. Vedi [Scenari](#scenarios).                                                     |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Dove vengono scritti report, riepilogo, eventi osservati e log di output. I percorsi relativi sono risolti da `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Root del repository quando l'invocazione avviene da una directory di lavoro neutra.                                      |
| `--sut-account <id>`  | `sut`                                         | ID account Matrix nella configurazione del Gateway QA.                                                                   |

### Flag del provider

La lane usa un trasporto Matrix reale, ma il provider del modello è configurabile:

| Flag                     | Predefinito    | Descrizione                                                                                                                                 |
| ------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier` | `mock-openai` per dispatch mock deterministico o `live-frontier` per provider frontier live. L'alias legacy `live-openai` funziona ancora. |
| `--model <ref>`          | predefinito del provider | Ref primaria `provider/model`.                                                                                                      |
| `--alt-model <ref>`      | predefinito del provider | Ref alternativa `provider/model` quando gli scenari cambiano a metà esecuzione.                                                     |
| `--fast`                 | disattivato    | Abilita la modalità veloce del provider dove supportata.                                                                                    |

Matrix QA non accetta `--credential-source` o `--credential-role`. La lane effettua il provisioning locale di utenti temporanei; non esiste un pool di credenziali condiviso da cui effettuare il lease.

## Profili

Il profilo selezionato decide quali scenari vengono eseguiti.

| Profilo         | Usalo per                                                                                                                                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (predefinito) | Catalogo completo. Lento ma esaustivo.                                                                                                                                                                                           |
| `fast`          | Sottoinsieme per gate di release che esercita il contratto di trasporto live: canary, mention gating, blocco allowlist, forma della risposta, ripresa dopo riavvio, follow-up nel thread, isolamento del thread, osservazione delle reazioni e consegna dei metadati di approvazione exec. |
| `transport`     | Scenari a livello di trasporto per thread, DM, stanza, autojoin, menzione/allowlist, approvazione e reazioni.                                                                                                                         |
| `media`         | Copertura degli allegati immagine, audio, video, PDF, EPUB.                                                                                                                                                                           |
| `e2ee-smoke`    | Copertura E2EE minima: risposta cifrata di base, follow-up nel thread, bootstrap riuscito.                                                                                                                                            |
| `e2ee-deep`     | Scenari E2EE esaustivi per perdita di stato, backup, chiavi e ripristino.                                                                                                                                                             |
| `e2ee-cli`      | Scenari CLI `openclaw matrix encryption setup` e `verify *` guidati tramite l'harness QA.                                                                                                                                             |

La mappatura esatta si trova in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenari

L'elenco completo degli ID scenario è l'union `MatrixQaScenarioId` in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Le categorie includono:

- thread - `matrix-thread-*`, `matrix-subagent-thread-spawn`
- livello principale / DM / stanza - `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming e avanzamento degli strumenti - `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media - `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing - `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reazioni - `matrix-reaction-*`
- approvazioni - `matrix-approval-*` (metadati exec/plugin, fallback a chunk, reazioni di rifiuto, thread e routing `target: "both"`)
- riavvio e replay - `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- mention gating, bot-to-bot e allowlist - `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE - `matrix-e2ee-*` (risposta di base, follow-up nel thread, bootstrap, ciclo di vita della chiave di ripristino, varianti di perdita di stato, comportamento del backup server, igiene dei dispositivi, verifica SAS / QR / DM, riavvio, redazione degli artefatti)
- CLI E2EE - `matrix-e2ee-cli-*` (configurazione della cifratura, configurazione idempotente, errore di bootstrap, ciclo di vita della chiave di ripristino, multi-account, round-trip della risposta del Gateway, autoverifica)

Passa `--scenario <id>` (ripetibile) per eseguire un set selezionato manualmente; combinalo con `--profile all` per ignorare il gating del profilo.

## Variabili d'ambiente

| Variabile                               | Predefinito                               | Effetto                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite massimo assoluto sull'intera esecuzione.                                                                                                                                                         |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite per la risposta canary iniziale. La CI di rilascio lo aumenta sui runner condivisi, così un primo turno lento del Gateway non fallisce prima dell'avvio della copertura dello scenario.           |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Finestra di silenzio per le asserzioni negative di mancata risposta. Limitata a `≤` il timeout dell'esecuzione.                                                                                        |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite per lo smantellamento Docker. Le superfici di errore includono il comando di ripristino `docker compose ... down --remove-orphans`.                                                             |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Sovrascrive l'immagine dell'homeserver quando si convalida rispetto a una versione diversa di Tuwunel.                                                                                                  |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | attivo                                    | `0` silenzia le righe di avanzamento `[matrix-qa] ...` su stderr. `1` le forza.                                                                                                                         |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redatto                                   | `1` mantiene il corpo del messaggio e `formatted_body` in `matrix-qa-observed-events.json`. Il valore predefinito redige i dati per mantenere sicuri gli artefatti CI.                                  |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | disattivo                                 | `1` salta il `process.exit` deterministico dopo la scrittura degli artefatti. Il valore predefinito forza l'uscita perché gli handle crypto nativi di matrix-js-sdk possono mantenere attivo il loop degli eventi dopo il completamento degli artefatti. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | non impostato                             | Quando impostato da un launcher esterno (ad es. `scripts/run-node.mjs`), Matrix QA riusa quel percorso di log invece di avviare un proprio tee.                                                         |

## Artefatti di output

Scritti in `--output-dir`:

- `matrix-qa-report.md` - report del protocollo Markdown (che cosa è passato, fallito, saltato e perché).
- `matrix-qa-summary.json` - riepilogo strutturato adatto al parsing della CI e alle dashboard.
- `matrix-qa-observed-events.json` - eventi Matrix osservati dai client driver e osservatori. I corpi sono redatti a meno che `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; i metadati di approvazione sono riepilogati con campi sicuri selezionati e anteprima del comando troncata.
- `matrix-qa-output.log` - stdout/stderr combinati dell'esecuzione. Se `OPENCLAW_RUN_NODE_OUTPUT_LOG` è impostato, viene riusato invece il log del launcher esterno.

La directory di output predefinita è `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, così le esecuzioni successive non si sovrascrivono a vicenda.

## Suggerimenti per il triage

- **L'esecuzione si blocca verso la fine:** gli handle crypto nativi di `matrix-js-sdk` possono sopravvivere all'harness. Il valore predefinito forza un `process.exit` pulito dopo la scrittura degli artefatti; se hai annullato `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, aspettati che il processo resti attivo.
- **Errore di pulizia:** cerca il comando di ripristino stampato (un'invocazione `docker compose ... down --remove-orphans`) ed eseguilo manualmente per liberare la porta dell'homeserver.
- **Finestre di asserzione negativa instabili nella CI:** abbassa `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (predefinito 8 s) quando la CI è veloce; aumentalo sui runner condivisi lenti.
- **Servono corpi redatti per una segnalazione di bug:** riesegui con `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` e allega `matrix-qa-observed-events.json`. Tratta l'artefatto risultante come sensibile.
- **Versione diversa di Tuwunel:** punta `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` alla versione in test. La lane controlla solo l'immagine predefinita fissata.

## Contratto di trasporto live

Matrix è una delle tre lane di trasporto live (Matrix, Telegram, Discord) che condividono una singola checklist di contratto definita in [panoramica QA → Copertura del trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` resta la suite sintetica ampia e intenzionalmente non fa parte di quella matrice.

## Correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation) - stack QA complessivo e contratto di trasporto live
- [Canale QA](/it/channels/qa-channel) - adattatore di canale sintetico per scenari basati sul repo
- [Testing](/it/help/testing) - esecuzione dei test e aggiunta di copertura QA
- [Matrix](/it/channels/matrix) - il Plugin del canale in test
