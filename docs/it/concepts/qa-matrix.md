---
read_when:
    - Esecuzione di pnpm openclaw qa matrix in locale
    - Aggiungere o selezionare scenari QA di Matrix
    - Triage degli errori di Matrix QA, dei timeout o della pulizia bloccata
summary: 'Riferimento per i manutentori per la lane QA live di Matrix basata su Docker: CLI, profili, variabili d''ambiente, scenari e artefatti di output.'
title: QA della matrice
x-i18n:
    generated_at: "2026-04-30T08:48:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

Il percorso QA Matrix esegue il Plugin `@openclaw/matrix` incluso contro un homeserver Tuwunel usa e getta in Docker, con account temporanei driver, SUT e observer più stanze prepopolate. È la copertura live, con trasporto reale, per Matrix.

Questo tooling è riservato ai maintainer. Le release OpenClaw pacchettizzate omettono intenzionalmente `qa-lab`, quindi `openclaw qa` è disponibile solo da un checkout sorgente. I checkout sorgente caricano direttamente il runner incluso: non serve alcun passaggio di installazione del Plugin.

Per il contesto più ampio del framework QA, vedi [Panoramica QA](/it/concepts/qa-e2e-automation).

## Avvio rapido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` semplice esegue `--profile all` e non si ferma al primo errore. Usa `--profile fast --fail-fast` per un gate di release; suddividi il catalogo con `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` quando esegui l'inventario completo in parallelo.

## Cosa fa il percorso

1. Provisiona un homeserver Tuwunel usa e getta in Docker (immagine predefinita `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nome server `matrix-qa.test`, porta `28008`).
2. Registra tre utenti temporanei: `driver` (invia traffico in ingresso), `sut` (l'account Matrix OpenClaw sotto test), `observer` (acquisizione del traffico di terze parti).
3. Prepopola le stanze richieste dagli scenari selezionati (principale, threading, media, riavvio, secondaria, allowlist, E2EE, DM di verifica, ecc.).
4. Avvia un Gateway OpenClaw figlio con il Plugin Matrix reale limitato all'account SUT; `qa-channel` non viene caricato nel figlio.
5. Esegue gli scenari in sequenza, osservando gli eventi tramite i client Matrix driver/observer.
6. Arresta l'homeserver, scrive gli artefatti di report e riepilogo, quindi termina.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flag comuni

| Flag                  | Predefinito                                   | Descrizione                                                                                                              |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | Profilo dello scenario. Vedi [Profili](#profiles).                                                                       |
| `--fail-fast`         | disattivato                                   | Fermati dopo il primo controllo o scenario non riuscito.                                                                 |
| `--scenario <id>`     | —                                             | Esegue solo questo scenario. Ripetibile. Vedi [Scenari](#scenarios).                                                     |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Dove vengono scritti report, riepilogo, eventi osservati e log di output. I percorsi relativi sono risolti rispetto a `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Root del repository quando si invoca da una directory di lavoro neutra.                                                  |
| `--sut-account <id>`  | `sut`                                         | ID account Matrix dentro la configurazione del Gateway QA.                                                               |

### Flag del provider

Il percorso usa un trasporto Matrix reale, ma il provider del modello è configurabile:

| Flag                     | Predefinito      | Descrizione                                                                                                                                 |
| ------------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`  | `mock-openai` per dispatch mock deterministico o `live-frontier` per provider frontier live. L'alias legacy `live-openai` funziona ancora. |
| `--model <ref>`          | provider default | Ref principale `provider/model`.                                                                                                            |
| `--alt-model <ref>`      | provider default | Ref alternativa `provider/model` dove gli scenari cambiano a metà esecuzione.                                                               |
| `--fast`                 | disattivato      | Abilita la modalità veloce del provider dove supportata.                                                                                    |

Matrix QA non accetta `--credential-source` o `--credential-role`. Il percorso provisiona utenti usa e getta localmente; non c'è alcun pool di credenziali condiviso da cui effettuare il lease.

## Profili

Il profilo selezionato decide quali scenari eseguire.

| Profilo         | Usalo per                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (default) | Catalogo completo. Lento ma esaustivo.                                                                                                                                                                                              |
| `fast`          | Sottoinsieme da gate di release che esercita il contratto del trasporto live: canary, gating delle menzioni, blocco allowlist, forma della risposta, ripresa dopo riavvio, follow-up nel thread, isolamento del thread, osservazione delle reazioni e consegna dei metadati di approvazione exec. |
| `transport`     | Scenari a livello di trasporto per threading, DM, stanza, autojoin, menzione/allowlist, approvazione e reazioni.                                                                                                                    |
| `media`         | Copertura degli allegati immagine, audio, video, PDF, EPUB.                                                                                                                                                                         |
| `e2ee-smoke`    | Copertura E2EE minima: risposta cifrata di base, follow-up nel thread, bootstrap riuscito.                                                                                                                                           |
| `e2ee-deep`     | Scenari E2EE esaustivi per perdita di stato, backup, chiavi e ripristino.                                                                                                                                                           |
| `e2ee-cli`      | Scenari CLI `openclaw matrix encryption setup` e `verify *` guidati tramite l'harness QA.                                                                                                                                            |

La mappatura esatta si trova in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Scenari

L'elenco completo degli ID scenario è l'unione `MatrixQaScenarioId` in `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Le categorie includono:

- threading — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- livello superiore / DM / stanza — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming e avanzamento strumenti — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- media — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- routing — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reazioni — `matrix-reaction-*`
- approvazioni — `matrix-approval-*` (metadati exec/Plugin, fallback a chunk, reazioni di rifiuto, thread e routing `target: "both"`)
- riavvio e replay — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- gating delle menzioni, bot-to-bot e allowlist — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (risposta di base, follow-up nel thread, bootstrap, ciclo di vita della chiave di ripristino, varianti di perdita di stato, comportamento del backup server, igiene dei dispositivi, verifica SAS / QR / DM, riavvio, redazione degli artefatti)
- CLI E2EE — `matrix-e2ee-cli-*` (configurazione della cifratura, configurazione idempotente, errore di bootstrap, ciclo di vita della chiave di ripristino, multi-account, round-trip gateway-reply, autoverifica)

Passa `--scenario <id>` (ripetibile) per eseguire un set scelto manualmente; combina con `--profile all` per ignorare il gating del profilo.

## Variabili d'ambiente

| Variabile                               | Predefinito                               | Effetto                                                                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Limite massimo rigido per l'intera esecuzione.                                                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Limite per la risposta canary iniziale. La CI di release lo aumenta sui runner condivisi, così un primo turno lento del Gateway non fallisce prima dell'inizio della copertura degli scenari.             |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Finestra di quiete per le asserzioni negative di mancata risposta. Limitata a `≤` il timeout di esecuzione.                                                                                              |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Limite per lo smantellamento Docker. Le superfici di errore includono il comando di ripristino `docker compose ... down --remove-orphans`.                                                               |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Sovrascrive l'immagine dell'homeserver durante la convalida con una versione diversa di Tuwunel.                                                                                                          |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | attivo                                    | `0` disattiva le righe di avanzamento `[matrix-qa] ...` su stderr. `1` le forza.                                                                                                                          |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | oscurato                                  | `1` mantiene il corpo del messaggio e `formatted_body` in `matrix-qa-observed-events.json`. Per impostazione predefinita oscura i dati per mantenere sicuri gli artefatti CI.                             |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | disattivo                                 | `1` salta il `process.exit` deterministico dopo la scrittura degli artefatti. Il comportamento predefinito forza l'uscita perché gli handle di crittografia nativa di matrix-js-sdk possono mantenere attivo l'event loop oltre il completamento degli artefatti. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | non impostata                             | Quando impostata da un launcher esterno (ad esempio `scripts/run-node.mjs`), Matrix QA riutilizza quel percorso di log invece di avviare il proprio tee.                                                  |

## Artefatti di output

Scritti in `--output-dir`:

- `matrix-qa-report.md` — Report del protocollo Markdown (cosa è passato, non è riuscito, è stato saltato e perché).
- `matrix-qa-summary.json` — Riepilogo strutturato adatto al parsing CI e alle dashboard.
- `matrix-qa-observed-events.json` — Eventi Matrix osservati dai client driver e observer. I corpi sono oscurati a meno che `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; i metadati di approvazione sono riepilogati con campi sicuri selezionati e anteprima del comando troncata.
- `matrix-qa-output.log` — stdout/stderr combinati dell'esecuzione. Se `OPENCLAW_RUN_NODE_OUTPUT_LOG` è impostata, viene invece riutilizzato il log del launcher esterno.

La directory di output predefinita è `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, così le esecuzioni successive non si sovrascrivono a vicenda.

## Suggerimenti per il triage

- **L'esecuzione si blocca verso la fine:** gli handle di crittografia nativa di `matrix-js-sdk` possono sopravvivere all'harness. Il comportamento predefinito forza un `process.exit` pulito dopo la scrittura degli artefatti; se hai disattivato `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, aspettati che il processo rimanga in esecuzione.
- **Errore di pulizia:** cerca il comando di ripristino stampato (un'invocazione `docker compose ... down --remove-orphans`) ed eseguilo manualmente per liberare la porta dell'homeserver.
- **Finestre di asserzione negativa instabili in CI:** abbassa `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (predefinito 8 s) quando la CI è veloce; aumentalo sui runner condivisi lenti.
- **Servono corpi oscurati per una segnalazione di bug:** riesegui con `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` e allega `matrix-qa-observed-events.json`. Tratta l'artefatto risultante come sensibile.
- **Versione diversa di Tuwunel:** punta `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` alla versione in test. La lane controlla solo l'immagine predefinita fissata.

## Contratto di trasporto live

Matrix è una delle tre lane di trasporto live (Matrix, Telegram, Discord) che condividono un'unica checklist di contratto definita in [Panoramica QA → Copertura del trasporto live](/it/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` rimane la suite sintetica ampia e intenzionalmente non fa parte di quella matrice.

## Correlati

- [Panoramica QA](/it/concepts/qa-e2e-automation) — stack QA complessivo e contratto di trasporto live
- [QA Channel](/it/channels/qa-channel) — adapter di canale sintetico per scenari supportati dal repo
- [Testing](/it/help/testing) — esecuzione dei test e aggiunta di copertura QA
- [Matrix](/it/channels/matrix) — il Plugin di canale in test
