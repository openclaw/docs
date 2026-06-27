---
read_when:
    - Spostare dati di runtime, cache, trascrizioni, stato delle attività o file scratch di OpenClaw in SQLite
    - Progettare migrazioni doctor da file JSON o JSONL legacy
    - Modifica del comportamento di backup, ripristino, VFS o archiviazione dei worker
    - Rimozione dei blocchi di sessione, della potatura, del troncamento o dei percorsi di compatibilità JSON
summary: Piano di migrazione per rendere SQLite il livello principale di stato e cache durevoli, mantenendo il backing su file di configurazione
title: Refactor dello stato database-first
x-i18n:
    generated_at: "2026-06-27T18:11:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Refactor dello stato con priorità al database

## Decisione

Usa un layout SQLite a due livelli:

- Database globale: `~/.openclaw/state/openclaw.sqlite`
- Database dell'agente: un database SQLite per ogni agente per workspace,
  trascrizione, VFS, artefatti e stato di runtime per agente di grandi dimensioni di proprietà dell'agente
- La configurazione resta basata su file: `openclaw.json` rimane fuori dal
  database. I profili di autenticazione di runtime passano a SQLite; i file di
  credenziali di provider esterni o della CLI rimangono gestiti dal proprietario fuori dal database di OpenClaw.

Il database globale è il database del control plane. Possiede il rilevamento
degli agenti, lo stato condiviso del Gateway, pairing, stato di dispositivi/nodi, registri di attività e flussi, stato dei Plugin, stato di runtime dello scheduler, metadati dei backup e stato delle migrazioni.

Il database dell'agente è il database del data plane. Possiede i metadati di sessione
dell'agente, lo stream di eventi della trascrizione, il workspace VFS o namespace scratch, gli artefatti degli strumenti, gli artefatti delle esecuzioni e i dati di cache locali all'agente ricercabili/indicizzabili.

Questo offre una vista globale durevole senza forzare workspace degli agenti,
trascrizioni e dati scratch binari di grandi dimensioni nella corsia di scrittura condivisa del Gateway.

## Contratto vincolante

Questa migrazione ha una sola forma canonica di runtime:

- Le righe di sessione persistono solo i metadati di sessione. Non devono persistere
  `transcriptLocator`, percorsi dei file di trascrizione, percorsi JSONL sibling, percorsi di lock,
  metadati di pruning o puntatori di compatibilità dell'era file.
- L'identità della trascrizione è sempre identità SQLite: `{agentId, sessionId}` più
  metadati opzionali del topic dove il protocollo ne ha bisogno.
- `sqlite-transcript://...` non è un'identità di runtime o di protocollo. Il nuovo codice non deve
  derivare, persistere, passare, analizzare o migrare locator di trascrizione. Runtime e
  test non devono contenere pseudo-locator affatto; la documentazione può menzionare la stringa
  solo per vietarla.
- I vecchi `sessions.json`, JSONL di trascrizione, `.jsonl.lock`, pruning, troncamento
  e vecchia logica dei percorsi di sessione appartengono solo al percorso di migrazione/importazione doctor.
- Gli alias di configurazione di sessione legacy appartengono solo alla migrazione doctor. Il runtime non
  interpreta `session.idleMinutes`, `session.resetByType.dm` o
  alias di sessione principale cross-agent `agent:main:*` per un altro agente configurato.
- L'identità di routing della sessione è stato relazionale tipizzato. I percorsi di runtime hot e UI
  dovrebbero leggere `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` e
  `session_conversations`; non devono analizzare `session_key` o estrarre da
  `session_entries.entry_json` l'identità del provider, tranne come ombra di compatibilità
  mentre i vecchi call site vengono eliminati.
- I marker di messaggio diretto a livello di canale, come `dm` rispetto a `direct`, sono vocabolario
  di routing, non locator di trascrizione o handle di compatibilità del file store.
- La configurazione legacy degli handler hook appartiene solo alle superfici di avviso/migrazione doctor.
  Il runtime non deve caricare `hooks.internal.handlers`; gli hook vengono eseguiti solo tramite directory
  hook rilevate e metadati `HOOK.md`.
- Avvio del runtime, percorsi hot di risposta, Compaction, reset, recovery, diagnostica,
  TTS, hook di memoria, subagenti, routing dei comandi Plugin, confini di protocollo e
  hook devono passare `{agentId, sessionId}` attraverso il runtime.
- I test dovrebbero inizializzare e verificare righe di trascrizione SQLite tramite
  `{agentId, sessionId}`. I test che dimostrano solo inoltro di percorsi JSONL,
  preservazione di locator forniti dal chiamante o compatibilità dei file di trascrizione dovrebbero
  essere eliminati, a meno che coprano importazione doctor, materializzazione di supporto/debug
  non di sessione o forma del protocollo.
- `runEmbeddedPiAgent(...)`, esecuzioni worker preparate e il tentativo embedded interno
  non devono accettare locator di trascrizione. Aprono il gestore delle trascrizioni SQLite
  tramite `{agentId, sessionId}` e passano quel gestore alla sessione agente compatibile con
  PI internalizzata, così chiamanti obsoleti non possono far scrivere al runner
  trascrizioni JSON/JSONL.
- La diagnostica del runner deve archiviare record di trace runtime/cache/payload in SQLite.
  La diagnostica di runtime non deve esporre manopole di override dei file JSONL o helper generici
  di esportazione JSONL delle trascrizioni; le esportazioni visibili all'utente possono materializzare artefatti
  espliciti da righe del database senza reimmettere nomi di file nel runtime.
- Il logging dello stream grezzo usa `OPENCLAW_RAW_STREAM=1` più righe diagnostiche SQLite.
  Il vecchio contratto del logger file pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` e
  `raw-openai-completions.jsonl` non fa parte del runtime o dei test OpenClaw.
- L'indicizzazione memoria QMD non deve esportare trascrizioni SQLite in file markdown.
  QMD indicizza solo i file di memoria configurati; la ricerca delle trascrizioni di sessione resta
  basata su SQLite.
- Il sottopercorso SDK QMD è solo QMD per il nuovo codice. Gli helper di indicizzazione
  delle trascrizioni di sessione SQLite vivono su `memory-core-host-engine-session-transcripts`; qualsiasi
  riesportazione QMD è solo compatibilità e non deve essere usata dal codice di runtime.
- Gli indici memoria integrati vivono nel database dell'agente proprietario. La configurazione di runtime e
  i contratti di runtime risolti non devono esporre `memorySearch.store.path`; doctor
  elimina quella chiave di configurazione legacy e il codice corrente passa internamente il
  `databasePath` dell'agente.

Il lavoro di implementazione dovrebbe continuare a eliminare codice finché queste affermazioni sono vere
senza eccezioni al di fuori dei confini doctor/import/export/debug.

## Stato obiettivo e avanzamento

### Obiettivo vincolante

- Un database SQLite globale possiede lo stato del control plane:
  `state/openclaw.sqlite`.
- Un database SQLite per agente possiede lo stato del data plane:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configurazione resta basata su file. `openclaw.json` non fa parte di questo
  refactor del database.
- I file legacy sono solo input di migrazione doctor.
- Il runtime non scrive né legge mai JSONL di sessioni o trascrizioni come stato attivo.

### Stati obiettivo

- `not-started`: il codice di runtime dell'era file scrive ancora stato attivo.
- `migrating`: il codice doctor/import può spostare dati file in SQLite.
- `dual-read`: bridge temporaneo che legge sia SQLite sia file legacy. Questo stato
  è vietato per questo refactor, a meno che sia esplicitamente documentato come
  solo doctor.
- `sqlite-runtime`: il runtime legge e scrive solo SQLite.
- `clean`: le API e i test di runtime legacy sono rimossi e la guardia previene
  regressioni.
- `done`: documentazione, test, backup, migrazione doctor e controlli sulle modifiche dimostrano lo
  stato pulito.

### Stato corrente

- Sessioni: `clean` per il runtime. Le righe di sessione vivono nel database per agente,
  le API di runtime usano `{agentId, sessionId}` o `{agentId, sessionKey}` e
  `sessions.json` è input legacy solo doctor.
- Trascrizioni: `clean` per il runtime. Eventi di trascrizione, identità, snapshot
  ed eventi di runtime delle traiettorie vivono nel database per agente. Il runtime non
  accetta più locator di trascrizione o percorsi JSONL di trascrizione.
- Runner PI embedded: `clean`. Esecuzioni PI embedded, worker preparati, Compaction
  e cicli di retry usano l'ambito di sessione SQLite e rifiutano handle di trascrizione obsoleti.
- Cron: `clean` per il runtime. Il runtime usa `cron_jobs` e `cron_run_logs`;
  i test di runtime usano denominazione SQLite `storeKey` e i percorsi Cron dell'era file rimangono
  solo nei test di migrazione legacy doctor.
- Registro attività: `clean`. Le righe di runtime per attività e flussi di attività vivono in
  `state/openclaw.sqlite`; gli importer SQLite sidecar non rilasciati sono eliminati.
- Stato Plugin: `clean`. Le righe stato/blob dei Plugin vivono nel database globale condiviso;
  i vecchi helper SQLite sidecar dello stato Plugin sono protetti da guardia.
- Memoria: `sqlite-runtime` per memoria integrata e indicizzazione delle trascrizioni di sessione.
  Le tabelle degli indici memoria vivono nel database per agente, lo stato memoria dei Plugin usa
  righe stato Plugin condivise e i file memoria legacy sono input di migrazione doctor
  o contenuto del workspace utente.
- Backup: `sqlite-runtime`. Le fasi di backup compattano snapshot SQLite, omettono sidecar
  WAL/SHM live, verificano l'integrità SQLite e registrano le esecuzioni di backup nel
  database globale.
- Migrazione doctor: `migrating`, intenzionalmente. Doctor importa JSON legacy,
  JSONL e store sidecar ritirati in SQLite, registra esecuzioni/fonti di migrazione
  e rimuove le fonti riuscite.
- Script E2E: `clean` per la copertura runtime. Il seeding Docker MCP scrive righe SQLite.
  Lo script Docker runtime-context crea JSONL legacy solo all'interno del
  seed di migrazione doctor e denomina esplicitamente il percorso dell'indice sessioni legacy.

### Lavoro rimanente

- [x] Rinominare le variabili store dei test di runtime Cron eliminando `storePath`, salvo
      quando sono input legacy doctor.
      File: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Prova: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Rimuovere o rinominare i mock obsoleti dei test di esportazione dell'era file.
      File: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Prova: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Rendere il seed JSONL legacy Docker runtime-context chiaramente solo doctor.
      File: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Prova: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` mostra solo
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Mantenere allineati i tipi generati Kysely dopo qualsiasi modifica allo schema.
      File: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Prova: nessuna modifica allo schema in questo passaggio; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Rieseguire test mirati per store, comandi e script toccati.
      Prova: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Prima di dichiarare `done`, eseguire il gate delle modifiche o una prova ampia remota.
      Prova: `pnpm check:changed --timed -- <changed extension paths>` superato su
      Hetzner Crabbox run `run_3f1cabf6b25c` dopo configurazione temporanea di Node 24/pnpm e
      routing esplicito dei percorsi per il workspace sincronizzato senza `.git`.

### Da non regredire

- Nessun locator di trascrizione.
- Nessun file di sessione attivo.
- Nessuna fixture di test JSONL fittizia eccetto i test di migrazione legacy doctor.
- Nessun accesso SQLite grezzo dove è atteso Kysely.
- Nessuna nuova migrazione DB legacy. Questo layout non è stato rilasciato; mantenere la versione dello schema
  a `1` salvo motivo forte.

## Presupposti di lettura del codice

Nessuna decisione di prodotto successiva blocca questo piano. L'implementazione dovrebbe
procedere con questi presupposti:

- Usa direttamente `node:sqlite` e richiedi il runtime Node 22+ per questo percorso
  di archiviazione.
- Mantieni esattamente un normale file di configurazione. Non spostare configurazione, manifest
  dei plugin o workspace Git in SQLite in questo refactor.
- I file di compatibilità runtime non sono richiesti. I file JSON e JSONL legacy sono
  solo input di migrazione. I sidecar SQLite locali al branch non sono mai stati rilasciati e vengono
  eliminati invece di essere importati.
- `openclaw doctor --fix` possiede il passaggio di migrazione legacy da file a database.
  L'avvio del runtime e `openclaw migrate` non devono includere percorsi legacy di
  upgrade del database OpenClaw.
- La compatibilità delle credenziali segue la stessa regola: le credenziali runtime vivono in
  SQLite. I vecchi file `auth-profiles.json`, `auth.json` per agente e
  `credentials/oauth.json` condiviso sono input di migrazione di doctor, quindi vengono rimossi
  dopo l'importazione.
- Lo stato del catalogo dei modelli generato è supportato dal database. Il codice runtime non deve scrivere
  `agents/<agentId>/agent/models.json`; i file `models.json` esistenti sono input legacy
  di doctor e vengono rimossi dopo l'importazione in `agent_model_catalogs`.
- Il runtime non deve migrare, normalizzare o collegare locator di trascrizioni. L'identità
  della trascrizione attiva è `{agentId, sessionId}` in SQLite. I percorsi file sono
  solo input legacy di doctor, e `sqlite-transcript://...` deve sparire dalle superfici
  runtime, protocollo, hook e Plugin invece di essere trattato come handle di confine.
- Le letture runtime delle trascrizioni SQLite non eseguono vecchie migrazioni della forma delle voci JSONL né
  riscrivono intere trascrizioni per compatibilità. La normalizzazione delle voci legacy resta nelle
  utilità esplicite di doctor/importazione. Doctor normalizza i file di trascrizione JSONL legacy
  prima di inserire righe SQLite; le righe runtime attuali sono
  già scritte nello schema di trascrizione attuale. L'esportazione di traiettorie/sessioni
  legge quelle righe così come sono e non deve eseguire migrazioni legacy al momento dell'esportazione.
- Gli helper legacy di parsing/migrazione delle trascrizioni JSONL sono solo per doctor. Il codice runtime
  del formato delle trascrizioni costruisce solo il contesto attuale delle trascrizioni SQLite; doctor
  possiede gli upgrade delle vecchie voci JSONL prima dell'inserimento delle righe.
- Il vecchio helper di streaming delle trascrizioni JSONL posseduto dal runtime è stato eliminato. Il codice di
  importazione di doctor possiede le letture esplicite dei file legacy; la cronologia delle sessioni runtime legge
  righe SQLite.
- I binding app-server di Codex usano `sessionId` di OpenClaw come chiave canonica
  nel namespace di stato del Plugin Codex. `sessionKey` è metadato per
  routing/visualizzazione e non deve sostituire l'id durevole della sessione né ripristinare
  l'identità basata su file di trascrizione.
- I motori di contesto ricevono direttamente il contratto runtime attuale. Il registro
  non deve avvolgere i motori con shim di retry che eliminano `sessionKey`,
  `transcriptScope` o `prompt`; i motori che non possono accettare i parametri attuali
  database-first devono fallire in modo evidente invece di essere collegati.
- L'output di backup deve restare un unico file archivio. I contenuti del database devono entrare
  in quell'archivio come snapshot SQLite compatti, non come sidecar WAL live grezzi.
- La ricerca nelle trascrizioni è utile ma non richiesta per il primo passaggio database-first.
  Progetta lo schema in modo che FTS possa essere aggiunto in seguito.
- L'esecuzione dei worker deve restare sperimentale dietro impostazioni mentre il confine del database
  si stabilizza.

## Risultati della Lettura del Codice

Il branch attuale ha già superato la fase di proof-of-concept. Il database condiviso
esiste, Node `node:sqlite` è collegato tramite un piccolo helper runtime, e
gli store precedenti ora scrivono in `state/openclaw.sqlite` o nel database
`openclaw-agent.sqlite` proprietario.

Il lavoro rimanente non è scegliere SQLite; è mantenere pulito il nuovo confine
ed eliminare qualsiasi interfaccia dalla forma compatibile che assomigli ancora al vecchio
mondo dei file:

- `storePath` di sessione non è più un'identità runtime, una forma di fixture di test o
  un campo del payload di stato. I test runtime e bridge non contengono più il
  nome di contratto `storePath`; il codice doctor/migrazione possiede quel vocabolario legacy.
- Le scritture di sessione non passano più attraverso la vecchia coda in-process `store-writer.ts`.
  Le scritture di patch SQLite usano invece rilevamento dei conflitti e retry limitato.
- La scoperta dei percorsi legacy ha ancora usi di migrazione validi, ma il codice runtime dovrebbe
  smettere di trattare `sessions.json` e i file JSONL di trascrizione come possibili target di scrittura.
- Le tabelle possedute dall'agente vivono nei database SQLite per agente. Il DB globale mantiene
  righe di registro/control-plane; l'identità della trascrizione è `{agentId, sessionId}` nelle
  righe di trascrizione per agente. Il codice runtime non deve persistere percorsi file di
  trascrizione né migrare locator di trascrizioni.
- Doctor importa già diversi file legacy. La pulizia consiste nel renderla una
  singola implementazione di migrazione esplicita che doctor richiama, con un report di migrazione durevole.

Nessuna ulteriore domanda di prodotto blocca l'implementazione.

## Forma Attuale del Codice

Il branch ha già una vera base SQLite condivisa:

- Il requisito minimo di runtime ora è Node 22+: `package.json`, la guardia di runtime della CLI,
  i valori predefiniti dell'installer, il localizzatore del runtime macOS, la CI e la documentazione
  pubblica di installazione sono tutti allineati. La vecchia corsia di compatibilità con Node 22 è rimossa.
- `src/state/openclaw-state-db.ts` apre `openclaw.sqlite`, imposta WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` e applica
  il modulo di schema generato derivato da
  `src/state/openclaw-state-schema.sql`.
- I tipi di tabella Kysely e i moduli di schema runtime sono generati da database
  SQLite temporanei creati dai file `.sql` sottoposti a commit; il codice runtime non
  mantiene più stringhe di schema copiate e incollate per database globali, per agente
  o di acquisizione proxy.
- Gli store runtime derivano i tipi di righe selezionate e inserite da quelle interfacce
  Kysely `DB` generate invece di duplicare manualmente le forme delle righe SQLite. L'SQL grezzo
  resta limitato all'applicazione dello schema, ai pragma e al DDL solo per migrazione.
- Gli schemi SQLite sono ridotti a `user_version = 1` perché questo layout di database
  non è ancora stato distribuito. Gli opener runtime creano solo lo schema corrente;
  l'importazione da file a database resta nel codice doctor e gli helper di upgrade
  database locali al ramo sono stati eliminati.
- La proprietà relazionale è applicata dove il confine di proprietà è canonico:
  le righe di migrazione sorgente propagano l'eliminazione da `migration_runs`, lo stato
  di consegna dei task propaga l'eliminazione da `task_runs` e le righe di identità
  transcript propagano l'eliminazione dagli eventi transcript.
- Le tabelle condivise correnti includono `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` e `backup_runs`.
- Lo stato arbitrario di proprietà dei plugin non ottiene tabelle tipizzate di proprietà dell'host. I plugin
  installati usano `plugin_state_entries` per payload JSON versionati e
  `plugin_blob_entries` per byte, con proprietà di namespace/chiave, pulizia TTL,
  backup e record di migrazione plugin. Lo stato di orchestrazione dei plugin di proprietà dell'host può
  comunque avere tabelle tipizzate quando l'host possiede il contratto di query, come
  `plugin_binding_approvals`.
- Le migrazioni dei plugin sono migrazioni di dati su namespace di proprietà dei plugin, non migrazioni
  dello schema host. Un plugin può migrare le proprie voci stato/blob versionate
  tramite un provider di migrazione, e l'host registra stato sorgente/esecuzione nel
  normale registro di migrazione. Le nuove installazioni di plugin non richiedono modifiche a
  `openclaw-state-schema.sql`, a meno che l'host stesso non stia assumendo la proprietà di un
  nuovo contratto cross-plugin.
- `src/state/openclaw-agent-db.ts` apre
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registra il database nel
  DB globale e possiede le tabelle locali all'agente per sessioni, transcript, VFS, artefatti, cache
  e indici di memoria. La discovery runtime condivisa ora legge il registry
  `agent_databases` tipizzato generato invece di reimplementare quella query in ogni call
  site.
- I database globali e per agente registrano una riga `schema_meta` con ruolo del database,
  versione dello schema, timestamp e id agente per i database agente. Il layout resta comunque
  a `user_version = 1` perché questo schema SQLite non è ancora stato distribuito.
- L'identità di sessione per agente ora ha una tabella radice canonica `sessions` indicizzata da
  `session_id`, con `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, timestamp, campi di visualizzazione, metadati modello,
  id harness e collegamento parent/spawn come colonne interrogabili. `session_routes`
  è l'indice univoco delle route attive da `session_key` al `session_id` corrente,
  quindi una chiave di route può spostarsi a una nuova sessione durevole senza
  costringere le letture hot a scegliere tra righe `sessions.session_key` duplicate. Il vecchio
  payload con forma di compatibilità `session_entries.entry_json` è collegato alla
  radice durevole `session_id` tramite chiave esterna; non è più l'unica
  rappresentazione a livello di schema di una sessione.
- Anche l'identità delle conversazioni esterne per agente è relazionale:
  `conversations` archivia l'identità normalizzata di provider/account/conversazione, e
  `session_conversations` collega una sessione OpenClaw a una o più conversazioni
  esterne. Questo copre le sessioni DM main condivise in cui più peer possono
  intenzionalmente mappare a una sessione senza mentire in `session_key`. SQLite applica anche
  l'univocità per l'identità naturale del provider, così la stessa tupla
  channel/account/kind/peer/thread non può biforcarsi su id conversazione diversi.
  I peer diretti main condivisi sono collegati con un ruolo `participant`, quindi una
  sessione OpenClaw può rappresentare più peer DM esterni senza retrocedere
  i peer precedenti a righe correlate vaghe. `sessions.primary_conversation_id` punta ancora
  all'attuale target di consegna tipizzato. Le colonne chiuse di routing/stato
  sono applicate con vincoli SQLite `CHECK` invece di affidarsi solo alle
  union TypeScript.
  La proiezione runtime della sessione elimina le ombre di routing di compatibilità da
  `session_entries.entry_json` prima di applicare le colonne tipizzate sessione/conversazione,
  così i payload JSON obsoleti non possono riesumare target di consegna.
  Il routing di annuncio dei subagent richiede allo stesso modo il contesto di consegna SQLite tipizzato;
  non ricade più sui campi route di compatibilità `SessionEntry`.
  L'ereditarietà della consegna esplicita Gateway `chat.send` legge il contesto di consegna SQLite
  tipizzato invece dei campi di compatibilità `origin`/`last*`.
  Anche `tools.effective` deriva il contesto provider/account/thread da righe SQLite tipizzate
  di consegna/routing, non da ombre obsolete `last*` della session-entry.
  Il contesto prompt degli eventi di sistema ricostruisce i campi channel/to/account/thread da
  campi di consegna tipizzati invece che da ombre `origin`.
  L'helper condiviso `deliveryContextFromSession` e il mapper session-to-conversation
  ora ignorano completamente `SessionEntry.origin`; solo i campi di consegna tipizzati
  e le righe di conversazione relazionali possono creare identità di route hot.
  La normalizzazione runtime delle session entry rimuove `origin` prima di persistere o
  proiettare `entry_json`, e le scritture dei metadati in ingresso scrivono campi channel/chat
  tipizzati più righe di conversazione relazionali invece di creare nuove ombre origin.
- Gli eventi transcript, gli snapshot transcript e gli eventi runtime di traiettoria ora
  referenziano la radice canonica `sessions` per agente e propagano l'eliminazione alla cancellazione della sessione.
  Le righe di identità/idempotenza transcript continuano a propagare l'eliminazione dalla
  riga esatta dell'evento transcript.
- Gli indici memory-core ora usano tabelle esplicite del database agente
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` e
  `memory_embedding_cache`, con `memory_index_state` che traccia le modifiche di revisione.
  Gli indici laterali FTS/vector opzionali sono denominati `memory_index_chunks_fts` e
  `memory_index_chunks_vec` invece delle tabelle generiche `meta`, `files`, `chunks`,
  `chunks_fts` o `chunks_vec`. I nomi canonici conservano l'attuale forma delle righe
  path/source e la compatibilità degli embedding serializzati. Queste tabelle
  sono cache derivate/di ricerca, non archiviazione canonica dei transcript; possono essere
  eliminate e ricostruite dai file del workspace di memoria e dalle sorgenti configurate.
  L'apertura di un indice di memoria distribuito con nomi generici migra i suoi metadati, sorgenti,
  chunk e cache degli embedding nelle tabelle canoniche; le tabelle derivate FTS/vector
  sono ricostruite con i loro nomi canonici.
- Lo stato di recovery delle esecuzioni subagent ora vive in righe condivise tipizzate `subagent_runs`
  con chiavi di sessione figlio, richiedente e controller indicizzate. Il vecchio
  file `subagents/runs.json` è solo input di migrazione doctor.
- I binding della conversazione corrente ora vivono in righe condivise tipizzate
  `current_conversation_bindings` indicizzate per id conversazione normalizzato, con
  colonne target agent/session, tipo di conversazione, stato, scadenza e metadati
  archiviati come colonne relazionali invece di un record di binding opaco duplicato.
  La chiave di binding durevole include il tipo di conversazione normalizzato, così
  i riferimenti direct/group/channel non possono collidere, e SQLite rifiuta valori di tipo/stato
  binding non validi. Il vecchio
  file `bindings/current-conversations.json` è solo input di migrazione doctor.
- La recovery della coda di consegna ora sovrappone al JSON di replay colonne tipizzate della coda
  per channel, target, account, sessione, retry, errore, invio piattaforma e stato
  di recovery. `entry_json` conserva i payload di replay, hook e formattazione,
  ma le colonne tipizzate sono autorevoli per routing/stato hot della coda.
- I puntatori di ripristino dell'ultima sessione TUI ora vivono in righe condivise tipizzate
  `tui_last_sessions` indicizzate dallo scope hashato della connessione/sessione TUI.
  Il vecchio file JSON TUI è solo input di migrazione doctor.
- Le preferenze TTS predefinite ora vivono in righe SQLite di stato plugin condivise indicizzate sotto il
  plugin `speech-core`. Il vecchio file `settings/tts.json` è solo input di migrazione
  doctor; il runtime non legge né scrive più file JSON di preferenze TTS, e il
  resolver del percorso legacy vive nel modulo di migrazione doctor.
- I metadati dei target dei segreti ora parlano di store invece di fingere che ogni
  target di credenziali sia un file di configurazione. `openclaw.json` resta lo store di configurazione;
  i target auth-profile usano righe SQLite tipizzate `auth_profile_stores` con
  credenziali conformate al provider mantenute come payload JSON.
- L'audit dei segreti non scansiona più i file `auth.json` per agente ritirati. Doctor possiede
  gli avvisi, l'importazione e la rimozione di quel file legacy.
- Gli helper legacy dei percorsi dei profili auth ora vivono nel codice legacy doctor. Gli helper dei percorsi
  dei profili auth core espongono identità e posizioni di visualizzazione auth-store SQLite,
  non percorsi runtime `auth-profiles.json` o `auth-state.json`.
- I moduli runtime di recovery delle esecuzioni subagent e della cache delle capacità modello OpenRouter
  ora tengono separati i lettori/scrittori di snapshot SQLite dagli helper di import JSON legacy
  solo doctor. Le capacità OpenRouter usano le righe generiche tipizzate
  `model_capability_cache` sotto `provider_id = "openrouter"` invece di
  un unico blob cache opaco o una tabella host specifica del provider. Il `taskName` delle esecuzioni subagent
  è archiviato nella colonna tipizzata `subagent_runs.task_name`; la
  copia `payload_json` è dato di replay/debug, non la sorgente per i campi hot di visualizzazione o
  lookup.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementa un VFS SQLite
  sopra la tabella `vfs_entries` del database agente. Letture di directory, esportazioni
  ricorsive, eliminazioni e rinomine usano intervalli di prefisso indicizzati `(namespace, path)`
  invece di scansionare un intero namespace o affidarsi al matching dei percorsi con `LIKE`.
- `src/agents/runtime-worker.entry.ts` crea per ogni esecuzione VFS SQLite, artefatti tool,
  artefatti run e store cache con scope per i worker.
- I marker di completamento del bootstrap del workspace ora vivono in righe condivise tipizzate
  `workspace_setup_state` indicizzate per percorso workspace risolto invece di
  `.openclaw/workspace-state.json`; il runtime non legge né riscrive più il
  marker workspace legacy, e le API helper non si passano più un falso percorso
  `.openclaw/setup-state` solo per derivare l'identità di archiviazione.
- Le approvazioni exec ora vivono nella riga singleton tipizzata SQLite condivisa
  `exec_approvals_config`. Doctor importa il legacy `~/.openclaw/exec-approvals.json`;
  le scritture runtime non creano, riscrivono o riportano più quel file come sua posizione di store
  attiva. Il companion macOS legge e scrive la stessa riga della tabella
  `state/openclaw.sqlite`; mantiene su disco solo il socket del prompt Unix
  perché quello è IPC, non stato runtime durevole.
- I moduli runtime di identità dispositivo, auth dispositivo e bootstrap ora tengono separati
  i loro lettori/scrittori di snapshot SQLite dagli helper di import JSON legacy solo doctor.
  L'identità dispositivo usa righe tipizzate `device_identities` e i token di auth dispositivo
  usano righe tipizzate `device_auth_tokens`. Le scritture di auth dispositivo riconciliano le righe
  per dispositivo/ruolo invece di troncare la tabella dei token, e il runtime non instrada più
  gli aggiornamenti di singolo token attraverso il vecchio adapter dell'intero store. Il legacy
  I payload JSON versione 1 esistono solo come forme di importazione/esportazione di doctor.
- La cache di scambio token di GitHub Copilot usa la tabella SQLite condivisa dello stato dei Plugin
  sotto `github-copilot/token-cache/default`. È stato di cache di proprietà del provider,
  quindi intenzionalmente non aggiunge una tabella di schema host.
- La Compaction di GitHub Copilot non scrive più sidecar dell'area di lavoro
  `openclaw-compaction-*.json`. L'harness chiama l'RPC di Compaction della cronologia dell'SDK per la
  sessione SDK tracciata, e OpenClaw mantiene lo stato durevole di sessione/trascrizione in
  SQLite invece che in file marker di compatibilità.
- Il runtime Swift condiviso (`OpenClawKit`) usa le stesse righe
  `state/openclaw.sqlite` per identità dispositivo e autenticazione dispositivo. Gli helper dell'app macOS
  importano gli helper SQLite condivisi invece di possedere un secondo percorso JSON o
  SQLite. Un file legacy residuo `identity/device.json` blocca la creazione dell'identità
  finché doctor non lo importa in SQLite, in linea con il gate di avvio TypeScript e Android.
- L'identità dispositivo Android usa lo stesso materiale di chiavi compatibile con TypeScript
  archiviato in righe tipizzate `state/openclaw.sqlite#table/device_identities`. Non
  legge né scrive mai `openclaw/identity/device.json`; un file legacy residuo blocca
  l'avvio finché doctor non lo importa in SQLite.
- Anche i token di autenticazione dispositivo Android memorizzati nella cache usano righe tipizzate
  `state/openclaw.sqlite#table/device_auth_tokens` e condividono la stessa
  semantica dei token versione 1 di TypeScript e Swift. Il runtime non legge più le chiavi di compatibilità
  `SecurePrefs` `gateway.deviceToken*`; queste appartengono solo alla logica di migrazione/doctor.
- La cronologia dei pacchetti recenti delle notifiche Android usa righe tipizzate
  `android_notification_recent_packages`. Il runtime non migra né legge più
  le vecchie chiavi CSV SharedPreferences.
- La creazione dell'identità dispositivo fallisce in modo chiuso quando esiste il legacy `identity/device.json`,
  quando la riga di identità SQLite non è valida o quando lo store di identità SQLite
  non può essere aperto. Doctor importa e rimuove prima quel file, quindi l'avvio del runtime
  non può ruotare silenziosamente l'identità di pairing prima della migrazione.
- La selezione dell'identità dispositivo è una chiave di riga SQLite, non un localizzatore di file JSON. I test
  e gli helper del Gateway passano chiavi di identità esplicite; solo la migrazione doctor e il
  gate di avvio fail-closed conoscono il nome file ritirato `identity/device.json`.
- La compatibilità del reset di sessione ora vive nella migrazione di configurazione di doctor:
  `session.idleMinutes` viene spostato in `session.reset.idleMinutes`,
  `session.resetByType.dm` viene spostato in `session.resetByType.direct`, e la
  policy di reset del runtime legge solo chiavi di reset canoniche.
- La compatibilità della configurazione legacy ora vive sotto `src/commands/doctor/`. La normale
  validazione `readConfigFileSnapshot()` non importa i detector legacy di doctor
  né annota problemi legacy; `runDoctorConfigPreflight()` aggiunge questi problemi per
  la riparazione/reportistica di doctor. Il flusso di configurazione doctor importa
  `src/commands/doctor/legacy-config.ts`, e la vecchia riparazione degli id profilo OAuth vive
  sotto
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- I comandi non doctor non eseguono automaticamente la riparazione della configurazione legacy. Per esempio,
  `openclaw update --channel` ora fallisce su una configurazione legacy non valida e chiede
  all'utente di eseguire doctor, invece di importare silenziosamente codice di migrazione doctor.
- Web push, APNs, Voice Wake, controlli di aggiornamento e salute della configurazione ora usano tabelle SQLite condivise tipizzate
  per sottoscrizioni, chiavi VAPID, registrazioni dei Node, righe trigger,
  righe di routing, stato delle notifiche di aggiornamento e voci di salute della configurazione invece di
  interi blob JSON opachi. Le scritture di snapshot Web push e APNs ora riconciliano
  sottoscrizioni/registrazioni per chiave primaria invece di svuotare le loro tabelle;
  la salute della configurazione fa lo stesso per percorso di configurazione.
  I loro moduli runtime mantengono lettori/scrittori di snapshot SQLite separati dagli
  helper di importazione JSON legacy riservati a doctor.
- La configurazione host Node ora usa una riga singleton tipizzata nel database SQLite condiviso;
  doctor importa il vecchio file `node.json` prima del normale uso del runtime.
- Pairing dispositivo/Node, pairing dei canali, allowlist dei canali e stato bootstrap
  ora usano righe SQLite tipizzate invece di interi blob JSON opachi. Le approvazioni di binding
  dei Plugin e lo stato dei job Cron seguono la stessa separazione: i moduli runtime espongono
  operazioni basate su SQLite e helper di snapshot neutrali, e le scritture di snapshot di pairing/bootstrap
  più approvazioni di binding dei Plugin riconciliano le righe per chiave primaria
  invece di troncare le tabelle, mentre doctor importa/rimuove i vecchi file JSON tramite
  moduli `src/commands/doctor/legacy/*`.
- I record dei Plugin installati ora vivono nell'indice SQLite dei Plugin installati.
  La lettura/scrittura della configurazione runtime non migra né preserva più i vecchi
  dati di configurazione authored `plugins.installs`; doctor importa quella forma di configurazione legacy
  in SQLite prima del normale uso del runtime.
- Gli snapshot di recupero credenziali QQBot ora vivono nello stato Plugin SQLite sotto
  `qqbot/credential-backups`. Il runtime non scrive più
  `qqbot/data/credential-backup*.json`; doctor importa e rimuove quei
  file di backup legacy insieme agli altri input di stato QQBot.
- La pianificazione di reload del Gateway confronta snapshot dell'indice SQLite dei Plugin installati sotto
  uno spazio dei nomi di diff interno `installedPluginIndex.installRecords.*`. Le decisioni di reload
  del runtime non racchiudono più quelle righe in falsi oggetti di configurazione
  `plugins.installs`.
- L'upgrade delle credenziali account nominati Matrix non avviene più durante le letture
  del runtime. Doctor possiede la rinomina del vecchio
  `credentials/matrix/credentials.json` di livello superiore quando è possibile risolvere un account Matrix singolo/predefinito.
- I moduli runtime core di pairing e Cron non esportano più builder di percorsi JSON
  legacy. I moduli legacy di proprietà di doctor costruiscono i percorsi sorgente
  `pending.json`, `paired.json`, `bootstrap.json` e `cron/jobs.json` solo per test di importazione e
  migrazione. La normalizzazione legacy della forma dei job Cron e l'importazione del log di esecuzione Cron
  vivono sotto `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importa file di stato JSON legacy,
  inclusa la configurazione host Node, in SQLite da doctor. I nuovi importer di file legacy
  restano sotto `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importa le trascrizioni legacy `sessions.json` e
  `*.jsonl` direttamente in SQLite e rimuove le sorgenti riuscite. Non
  mette più in staging le trascrizioni legacy root tramite
  `agents/<agentId>/sessions/*.jsonl` né crea un target JSONL canonico prima
  dell'importazione.
- I controlli doctor di integrità dello stato non scansionano più directory di sessioni legacy né
  offrono l'eliminazione di JSONL orfani. I file di trascrizione legacy sono solo input di migrazione,
  e lo step di migrazione possiede importazione più rimozione della sorgente.
- L'importazione del registro sandbox legacy vive sotto
  `src/commands/doctor/legacy/sandbox-registry.ts`; le letture e scritture del registro sandbox
  attivo restano solo SQLite.
- La riparazione legacy di salute/importazione delle trascrizioni di sessione vive sotto
  `src/commands/doctor/legacy/session-transcript-health.ts`; i moduli comando runtime
  non portano più parsing di trascrizioni JSONL né codice di riparazione del ramo attivo.

Elementi principali del consolidamento/dell'eliminazione completati:

- Lo stato dei Plugin ora usa il database condiviso `state/openclaw.sqlite`. Il vecchio
  importatore sidecar `plugin-state/state.sqlite` locale al branch è stato rimosso perché
  quel layout SQLite non è mai stato rilasciato. Gli helper di probe/test riportano il
  `databasePath` condiviso invece di esporre un percorso SQLite specifico per lo stato dei plugin.
- Le tabelle runtime di attività e Task Flow ora risiedono nel database condiviso
  `state/openclaw.sqlite` invece che in `tasks/runs.sqlite` e
  `tasks/flows/registry.sqlite`; i vecchi importatori sidecar sono stati rimossi per la
  stessa ragione di layout non rilasciato.
- `src/config/sessions/store.ts` non richiede più `storePath` per i metadati
  in ingresso, gli aggiornamenti delle route o le letture updated-at. Persistenza dei comandi, pulizia
  sessione CLI, profondità subagent, override auth e identità della sessione del transcript
  usano API di riga agente/sessione. Le scritture sono applicate come patch di riga SQLite
  con nuovo tentativo su conflitto ottimistico.
- La risoluzione del target di sessione ora espone target di database per agente, non percorsi
  legacy `sessions.json`. Gateway condiviso, metadati ACP, riparazione route doctor e
  `openclaw sessions` enumerano `agent_databases` più gli agenti configurati.
- Il routing delle sessioni Gateway ora usa `resolveGatewaySessionDatabaseTarget`; il
  target restituito contiene `databasePath` e chiavi di riga SQLite candidate invece
  di un percorso file legacy dello store sessioni.
- I tipi runtime delle sessioni canale ora espongono `{agentId, sessionKey}` per
  letture updated-at, metadati in ingresso e aggiornamenti last-route. Il vecchio
  tipo di compatibilità `saveSessionStore(storePath, store)` non esiste più.
- Le superfici barrel di runtime Plugin, API estensione e `config/sessions` ora indirizzano
  il codice plugin verso helper di riga sessione basati su SQLite. Gli export di compatibilità
  della libreria root (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) restano come
  shim deprecati per i consumatori esistenti. Il vecchio helper
  `resolveLegacySessionStorePath` non esiste più; la costruzione del percorso legacy `sessions.json`
  è ora locale alle migrazioni e alle fixture di test.
- `src/config/sessions/session-entries.sqlite.ts` ora memorizza le voci sessione canoniche
  nel database per agente e supporta patch di lettura/upsert/eliminazione a livello di riga.
  Upsert/patch/eliminazione runtime non scansionano più varianti di maiuscole/minuscole né
  potano chiavi alias legacy; doctor possiede la canonicalizzazione. L'helper autonomo di
  importazione JSON non esiste più e la migrazione fonde le righe più nuove con upsert
  invece di sostituire l'intera tabella sessioni. Gli helper pubblici di lettura/lista/caricamento
  proiettano metadati di sessione hot da righe tipizzate `sessions` e `conversations`;
  `entry_json` è un'ombra di compatibilità/debug e può essere obsoleto o non valido
  senza perdere l'identità tipizzata della sessione o il contesto di consegna.
- `src/config/sessions/delivery-info.ts` ora risolve il contesto di consegna dalle
  righe tipizzate per agente `sessions` + `conversations` + `session_conversations`.
  Non ricostruisce più l'identità di consegna runtime da
  `session_entries.entry_json`; una riga conversazione tipizzata mancante è un problema di
  migrazione/riparazione doctor, non un fallback runtime.
- Le decisioni di reset delle sessioni memorizzate ora preferiscono i metadati tipizzati
  `sessions.session_scope`, `sessions.chat_type` e `sessions.channel`. Il parsing di `sessionKey`
  resta solo per suffissi thread/topic espliciti sui target di comando; la classificazione reset
  gruppo vs diretto non deriva più dalla forma della chiave.
- La classificazione nella visualizzazione elenco/stato sessioni ora usa metadati chat tipizzati e
  tipo di sessione Gateway. Non tratta più sottostringhe `:group:` o `:channel:`
  dentro `session_key` come verità durevole gruppo/diretto.
- La selezione della policy di risposta silenziosa ora usa solo tipo conversazione esplicito o
  metadati di superficie. Non deduce più la policy diretto/gruppo da sottostringhe di
  `session_key`.
- La risoluzione del modello di visualizzazione sessione ora riceve l'id agente dal target
  database sessione SQLite invece di estrarlo da `session_key`.
- L'idratazione del target annuncio agente-ad-agente ora usa solo il `deliveryContext` tipizzato
  di `sessions.list`. Non recupera più routing canale/account/thread da `origin` legacy,
  campi `last*` specchiati o forma di `session_key`.
- Il rifiuto del target thread di `sessions_send` ora legge metadati di routing SQLite tipizzati.
  Non rifiuta né accetta più target analizzando suffissi thread dalla chiave target.
- La validazione della policy strumenti con ambito gruppo ora legge il routing conversazione SQLite
  tipizzato per la sessione corrente o avviata. Non si fida più dell'identità gruppo/canale
  decodificando `sessionKey`; gli id gruppo forniti dal chiamante vengono scartati quando
  nessuna riga sessione tipizzata li garantisce.
- Il matching degli override modello canale ora usa metadati espliciti di gruppo e conversazione
  padre. Non decodifica più id conversazione padre da `parentSessionKey`.
- L'ereditarietà degli override modello memorizzati ora richiede una chiave sessione padre esplicita
  dal contesto sessione tipizzato. Non deriva più override padre da suffissi
  `:thread:` o `:topic:` in `sessionKey`.
- Il vecchio wrapper thread-info di sessione e il parser thread dei plugin caricati non esistono più;
  nessun codice runtime importa `config/sessions/thread-info`.
- L'helper conversazione canale non espone più bridge di parsing full-session-key.
  Il core normalizza ancora gli id conversazione raw posseduti dal provider tramite
  `resolveSessionConversation(...)`, ma non ricostruisce i fatti di route da `sessionKey`.
- Consegna completamento, policy di invio e manutenzione attività non derivano più il tipo chat
  dalla forma di `session_key`. Il vecchio parser chiave chat-type è stato eliminato;
  questi percorsi richiedono metadati sessione tipizzati, contesto consegna tipizzato o
  vocabolario esplicito dei target di consegna.
- Elenco/stato sessioni, diagnostica, binding account approvazione, filtro heartbeat TUI
  e riepiloghi d'uso non estraggono più da `SessionEntry.origin` routing
  provider/account/thread/display. Le uniche letture runtime residue di
  `origin` sono concetti non-sessione o oggetti di consegna del turno corrente.
- La ricerca conversazione nativa delle richieste di approvazione ora legge righe di routing sessione
  tipizzate per agente. Non analizza più identità conversazione canale/gruppo/thread
  da `sessionKey`; metadati tipizzati mancanti sono un problema di migrazione/riparazione.
- I payload evento Gateway session changed/chat/session non riecheggiano più
  `SessionEntry.origin` o ombre di route `last*`; i client ricevono
  `channel`, `chatType` e `deliveryContext` tipizzati.
- La risoluzione della consegna Heartbeat ora può ricevere direttamente il
  `deliveryContext` SQLite tipizzato, e il runtime heartbeat passa la riga consegna sessione
  per agente invece di affidarsi alle ombre di compatibilità `session_entries`
  per il routing corrente.
- Anche la risoluzione del target di consegna dell'agente isolato Cron idrata la sua route
  corrente dalla riga consegna sessione tipizzata per agente prima di ricadere sul
  payload voce di compatibilità.
- La risoluzione dell'origine annuncio subagent ora propaga il contesto di consegna
  della sessione richiedente tipizzata tramite `loadRequesterSessionEntry` e preferisce quella riga rispetto
  alle ombre di compatibilità `last*`/`deliveryContext`.
- Gli aggiornamenti dei metadati sessione in ingresso ora fondono prima contro la riga consegna
  tipizzata per agente; i vecchi campi consegna `SessionEntry` sono solo il fallback
  quando non esiste alcuna riga conversazione tipizzata.
- L'estrazione consegna restart/update ora lascia prevalere il `threadId` della consegna SQLite
  tipizzata sui frammenti topic/thread analizzati da `sessionKey`; il parsing
  è solo un fallback per chiavi legacy a forma di thread.
- Gli id canale del contesto hook agent ora preferiscono l'identità conversazione SQLite tipizzata,
  poi i metadati messaggio espliciti. Non analizzano più frammenti provider/gruppo/canale
  da `sessionKey`.
- L'ereditarietà della route esterna Gateway `chat.send` ora legge metadati di routing sessione
  SQLite tipizzati invece di inferire ambito canale/diretto/gruppo da parti di
  `sessionKey`. Le sessioni con ambito canale ereditano solo quando il canale sessione tipizzato
  e il tipo chat corrispondono al contesto di consegna memorizzato; le sessioni shared-main
  mantengono la loro regola più rigorosa CLI/no-client-metadata.
- Il wake del restart-sentinel e il routing di continuazione ora leggono righe SQLite
  di consegna/routing tipizzate prima di accodare wake heartbeat o continuazioni
  agent-turn instradate. Non ricostruiscono più il contesto di consegna dall'ombra JSON
  della voce sessione.
- La risoluzione contesto Gateway `tools.effective` ora legge righe SQLite
  di consegna/routing tipizzate per input provider, account, target, thread e reply-mode.
  Non recupera più quei campi di routing hot da ombre `origin`
  obsolete di `session_entries.entry_json`.
- Il routing della consulenza vocale realtime ora risolve consegna padre/chiamata da righe sessione
  SQLite tipizzate per agente. Non ricade più su ombre di compatibilità
  `SessionEntry.deliveryContext` quando sceglie la route messaggio dell'agente incorporato.
- Il relay heartbeat dello spawn ACP e il routing parent-stream ora leggono la consegna padre
  da righe sessione SQLite tipizzate. Non ricostruiscono più il contesto di consegna padre
  da ombre di compatibilità della voce sessione.
- La conservazione della route di consegna sessione ora segue metadati chat tipizzati e
  colonne di consegna persistite. Non estrae più suggerimenti canale, marker direct/main
  o forma thread da `sessionKey`; le route webchat interne ereditano un target esterno
  solo quando SQLite ha già identità consegna tipizzata/persistita per la sessione.
- L'estrazione generica della consegna sessione ora legge solo l'esatta riga consegna sessione
  SQLite tipizzata. Non analizza più suffissi thread/topic né ricade
  da una chiave a forma di thread a una chiave sessione base.
- Dispatch risposta, recovery restart sentinel e routing della consulenza vocale realtime
  ora usano righe sessione/conversazione SQLite tipizzate esatte per il routing thread.
  Non recuperano più id thread o contesto di consegna della sessione base analizzando
  chiavi sessione a forma di thread.
- La limitazione della cronologia PI incorporata ora usa la proiezione di routing sessione SQLite
  tipizzata (`sessions` + `conversations` primaria) per provider, tipo chat
  e identità peer. Non analizza più provider, DM, gruppo o forma thread
  da `sessionKey`.
- L'inferenza della consegna strumenti Cron ora usa solo consegna esplicita o il contesto di
  consegna tipizzato corrente. Non decodifica più target canale, peer, account o thread
  da `agentSessionKey`.
- Le righe sessione runtime non portano più il vecchio alias route `lastProvider`.
  Helper e test usano i campi tipizzati `lastChannel` e `deliveryContext`;
  la migrazione doctor è l'unico punto che dovrebbe tradurre alias route più vecchi
  o ombre `origin` persistite.
- Eventi transcript, righe VFS e righe artefatti strumento ora scrivono nel database per agente.
  La tabella globale non rilasciata di mapping transcript-file non esiste più; doctor
  registra invece i percorsi sorgente legacy in righe di migrazione durevoli.
- La ricerca runtime dei transcript non scansiona più offset byte JSONL né sonda file
  transcript legacy. I percorsi Gateway chat/media/history leggono righe transcript da
  SQLite; JSONL sessione è ora solo un input doctor legacy, non uno stato runtime
  o un formato di esportazione.
- Le relazioni padre e branch dei transcript usano metadati strutturati
  `parentTranscriptScope: {agentId, sessionId}` negli header transcript SQLite,
  non stringhe locator simili a percorsi `agent-db:...transcript_events...`.
- Il contratto del gestore transcript non espone più costruttori impliciti persistiti
  `create(cwd)` o `continueRecent(cwd)`. I gestori transcript persistiti
  si aprono con un ambito esplicito `{agentId, sessionId}`; solo i gestori
  in memoria restano senza ambito per test e trasformazioni transcript pure.
- Le API runtime dello store transcript risolvono l'ambito SQLite, non percorsi filesystem. Il
  vecchio helper `resolve...ForPath` e le opzioni di scrittura `transcriptPath` inutilizzate
  non esistono più nei chiamanti runtime.
- La risoluzione runtime sessione ora usa `{agentId, sessionId}` e non deve derivare
  stringhe `sqlite-transcript://<agent>/<session>` per confini esterni.
  I percorsi JSONL assoluti legacy sono solo input di migrazione doctor.
- I record direct-bridge del relay hook nativo ora risiedono in righe condivise tipizzate
  `native_hook_relay_bridges` indicizzate per id relay. Il runtime non scrive più un
  registro JSON in `/tmp` né record generici opachi per quei record bridge
  di breve durata.
- `runEmbeddedPiAgent(...)` non ha più un parametro transcript-locator.
  I descrittori dei worker preparati omettono anche i localizzatori di trascrizione. Lo stato della sessione runtime
  e le esecuzioni successive in coda trasportano `{agentId, sessionId}` invece di
  handle di trascrizione derivati.
- La Compaction incorporata ora prende l'ambito SQLite da `agentId` e `sessionId`.
  Gli hook di Compaction, le chiamate al context-engine, la delega CLI e le risposte di protocollo
  non devono ricevere handle derivati `sqlite-transcript://...`. Il codice di
  esportazione/debug può materializzare artefatti utente espliciti dalle righe, ma non fornisce un
  percorso generico di esportazione JSONL della sessione né reinserisce nomi di file nell'identità
  runtime.
- `/export-session` legge le righe di trascrizione da SQLite e scrive solo la vista HTML
  autonoma richiesta. Il visualizzatore incorporato non ricostruisce né
  scarica più il JSONL della sessione da quelle righe.
- La delega del context-engine non analizza più un localizzatore di trascrizione per recuperare
  l'identità dell'agente. Il contesto runtime preparato trasporta l'`agentId`
  risolto nell'adattatore di Compaction integrato.
- La riscrittura della trascrizione e il troncamento live dei risultati degli strumenti ora leggono e persistono
  lo stato della trascrizione tramite `{agentId, sessionId}` e non derivano localizzatori
  temporanei per i payload degli eventi di aggiornamento della trascrizione.
- La superficie helper dello stato di trascrizione non ha più varianti basate su localizzatore
  `readTranscriptState`, `replaceTranscriptStateEvents` o
  `persistTranscriptStateMutation`. I chiamanti runtime devono usare le API
  `{agentId, sessionId}`. L'importazione doctor legge i file legacy tramite percorso file esplicito
  e scrive righe SQLite; non migra stringhe di localizzatore.
- Il contratto del session-manager runtime non espone più `open(locator)`,
  `forkFrom(locator)` o `setTranscriptLocator(...)`. I session manager persistiti
  si aprono solo tramite `{agentId, sessionId}`; gli helper di lista/fork risiedono su
  API di sessione e checkpoint orientate alle righe invece che sulla facade del transcript manager.
- Le API del lettore di trascrizioni del Gateway sono scope-first. Accettano
  `{agentId, sessionId}` e non accettano un localizzatore di trascrizione posizionale che
  potrebbe diventare accidentalmente identità runtime. L'analisi del localizzatore della trascrizione
  attiva è stata rimossa; i percorsi sorgente legacy vengono letti solo dal codice di importazione doctor.
- Anche gli eventi di aggiornamento della trascrizione sono scope-first. `emitSessionTranscriptUpdate`
  non accetta più una stringa di localizzatore nuda e i listener instradano tramite
  `{agentId, sessionId}` senza analizzare un handle.
- Il broadcast session-message del Gateway risolve le chiavi di sessione dall'ambito agente/sessione,
  non da un localizzatore di trascrizione. Il vecchio resolver/cache da localizzatore di trascrizione a chiave
  di sessione è stato rimosso.
- Gli SSE di session-history del Gateway filtrano gli aggiornamenti live per ambito agente/sessione. Non
  canonicalizzano più candidati localizzatori di trascrizione, realpath o identità di trascrizione a forma di file
  per decidere se uno stream debba ricevere un aggiornamento.
- Gli hook del ciclo di vita della sessione non derivano né espongono più localizzatori di trascrizione su
  `session_end`. I consumer degli hook ricevono `sessionId`, `sessionKey`, gli id della sessione successiva
  e il contesto dell'agente; i file di trascrizione non fanno parte del contratto del ciclo di vita.
- Nemmeno gli hook di reset derivano o espongono più localizzatori di trascrizione. Il
  payload `before_reset` trasporta i messaggi SQLite recuperati più il motivo del reset,
  mentre l'identità della sessione rimane nel contesto dell'hook.
- Il reset dell'harness dell'agente non accetta più un localizzatore di trascrizione. Il dispatch del reset è
  scoped tramite `sessionId`/`sessionKey` più il motivo.
- I tipi di sessione delle estensioni agente non espongono più `transcriptLocator`; le estensioni
  devono usare il contesto di sessione e le API runtime invece di accedere a
  un'identità di trascrizione a forma di file.
- Gli hook di Compaction dei Plugin non espongono più localizzatori di trascrizione. Il contesto dell'hook
  trasporta già l'identità della sessione e le letture della trascrizione devono passare tramite API
  consapevoli dell'ambito SQLite invece che tramite handle a forma di file.
- Gli hook `before_agent_finalize` non espongono più `transcriptPath`, inclusi
  i payload di relay degli hook nativi. Gli hook di finalizzazione usano solo il contesto di sessione.
- Le risposte di reset del Gateway non sintetizzano più un localizzatore di trascrizione sulla
  voce restituita. Il reset crea righe di trascrizione SQLite, restituisce la voce di sessione pulita
  e lascia l'accesso alla trascrizione ai lettori consapevoli dell'ambito.
- I risultati di esecuzione incorporata e Compaction non espongono più localizzatori di trascrizione per la
  contabilità della sessione. La Compaction automatica aggiorna solo il `sessionId` attivo,
  i contatori di Compaction e i metadati dei token.
- I risultati dei tentativi incorporati non restituiscono più `transcriptLocatorUsed`, e
  i risultati `compact()` del context-engine non restituiscono più localizzatori di trascrizione.
  I cicli di retry runtime accettano solo un `sessionId` successore.
- I risultati di append della trascrizione delivery-mirror non restituiscono più localizzatori di
  trascrizione. I chiamanti ricevono il `messageId` aggiunto; i segnali di aggiornamento della trascrizione usano
  l'ambito SQLite.
- Gli helper di fork della sessione padre restituiscono solo il `sessionId` forkato. La preparazione dei subagenti
  passa agli engine l'ambito agente/sessione figlio.
- I parametri del runner CLI e il reseeding della cronologia non accettano più localizzatori di trascrizione.
  Le letture della cronologia CLI risolvono l'ambito della trascrizione SQLite da `{agentId,
sessionId}` e dal contesto della chiave di sessione.
- Le fixture di test CLI e embedded-runner ora seminano e leggono righe di trascrizione SQLite
  per id sessione invece di fingere che le sessioni attive siano file `*.jsonl` o
  di passare una stringa `sqlite-transcript://...` tramite i parametri runtime.
- Gli eventi della guardia dei risultati degli strumenti di sessione emettono dall'ambito sessione noto anche quando un
  manager in memoria non ha localizzatore derivato. I relativi test non simulano più file di trascrizione
  attivi `/tmp/*.jsonl`.
- Gli helper BTW e compaction-checkpoint ora leggono e forkano righe di trascrizione per
  ambito SQLite. I metadati dei checkpoint ora memorizzano solo id di sessione e id leaf/entry;
  i localizzatori derivati non vengono più scritti nei payload dei checkpoint.
- La ricerca della transcript-key del Gateway usa l'ambito della trascrizione SQLite ai confini del protocollo
  e non esegue più realpath o stat sui nomi file delle trascrizioni.
- La rotazione automatica della trascrizione di Compaction scrive le righe di trascrizione successive
  direttamente tramite lo store di trascrizioni SQLite. Le righe di sessione conservano solo l'identità
  della sessione successiva, non un percorso JSONL durevole o un localizzatore persistito.
- La Compaction del context-engine incorporato usa helper di rotazione della trascrizione denominati SQLite.
  I test di rotazione non costruiscono più percorsi successori JSONL né modellano le sessioni attive come file.
- La conservazione delle immagini in uscita gestite indicizza la cache dei messaggi di trascrizione da
  statistiche di trascrizione SQLite invece che da chiamate stat del filesystem.
- I lock delle sessioni runtime e la lane doctor autonoma legacy `.jsonl.lock`
  sono stati rimossi.
- Il barrel runtime Microsoft Teams e l'SDK pubblico dei Plugin non riesportano più
  il vecchio helper di file-lock; i percorsi di stato durevole dei Plugin sono supportati da SQLite.
- La rimozione per età/conteggio delle sessioni e la pulizia esplicita delle sessioni sono state rimosse.
  Doctor possiede l'importazione legacy; le sessioni obsolete vengono reimpostate o eliminate esplicitamente.
- I controlli di integrità doctor non contano più un file JSONL legacy come trascrizione attiva
  valida per una riga di sessione SQLite. La salute della trascrizione attiva è solo SQLite;
  i file JSONL legacy sono segnalati come input di migrazione/pulizia degli orfani.
- Doctor non tratta più `agents/<agent>/sessions/` come stato runtime richiesto.
  Scansiona quella directory solo quando esiste già, come input di importazione legacy
  o pulizia degli orfani.
- `sessions.resolve` del Gateway, i percorsi patch/reset/compact di sessione, lo spawning dei subagenti,
  l'interruzione rapida, i metadati ACP, le sessioni isolate da Heartbeat e il patching TUI
  non migrano né eliminano più chiavi di sessione legacy come effetto collaterale del
  normale lavoro runtime.
- La risoluzione della sessione del comando CLI ora restituisce l'`agentId` proprietario invece di uno
  `storePath`, e non copia più righe legacy della sessione principale durante la normale risoluzione
  `--to` o `--session-id`. La canonicalizzazione delle righe principali legacy appartiene
  solo a doctor.
- La risoluzione della profondità dei subagenti runtime non legge più `sessions.json` o store di sessioni
  JSON5. Legge `session_entries` SQLite per id agente, e i metadati legacy
  di profondità/sessione possono entrare solo tramite il percorso di importazione doctor.
- Gli override della sessione del profilo di autenticazione persistono tramite upsert diretti delle righe
  `{agentId, sessionKey}` invece di caricare pigramente un runtime session-store a forma di file.
- Il gating verbose dell'auto-reply e gli helper di aggiornamento della sessione ora leggono/upsertano righe
  di sessione SQLite per identità di sessione e non richiedono più un percorso store legacy
  prima di toccare lo stato persistito delle righe.
- Gli helper dei metadati di sessione command-run ora usano nomi e percorsi modulo orientati alle entry;
  la vecchia superficie helper di comando `session-store` è stata rimossa.
- Il seeding dell'header di bootstrap e l'irrobustimento dei confini di Compaction manuale ora mutano
  direttamente le righe di trascrizione SQLite. I chiamanti runtime passano l'identità della sessione, non
  percorsi `.jsonl` scrivibili.
- Il replay silenzioso della rotazione di sessione copia i turni utente/assistant recenti tramite
  `{agentId, sessionId}` dalle righe di trascrizione SQLite. Non accetta più
  localizzatori di trascrizione sorgente o destinazione.
- Le nuove righe di sessione runtime non memorizzano più localizzatori di trascrizione. I chiamanti usano
  direttamente `{agentId, sessionId}`; i comandi di esportazione/debug possono scegliere i nomi dei file di output
  quando materializzano le righe.
- L'avvio di una nuova sessione di trascrizione persistita ora apre sempre righe SQLite per
  ambito. Il session manager non riusa più un precedente percorso o localizzatore di trascrizione
  dell'era dei file come identità per la nuova sessione.
- Le sessioni di trascrizione persistite usano l'API esplicita
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Le vecchie
  facade statiche `SessionManager.create/openForSession/list/forkFromSession` sono
  state rimosse così che test e codice runtime non possano ricreare accidentalmente la discovery delle sessioni
  dell'era dei file.
- Il runtime dei Plugin non espone più `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  il codice dei Plugin usa helper di righe SQLite e valori di ambito.
- La superficie SDK pubblica `session-store-runtime` ora esporta solo helper per righe di sessione
  e righe di trascrizione. Gli helper mirati di schema/percorso/transazione SQLite
  risiedono in `sqlite-runtime`; gli helper grezzi di apertura/chiusura/reset restano locali
  solo per test first-party.
- I classificatori legacy dei nomi file `.jsonl` di traiettoria/checkpoint ora risiedono nel
  modulo doctor legacy session-file. La validazione delle sessioni core non importa più
  helper di artefatti file per decidere i normali id di sessione SQLite.
- Le esecuzioni di subagenti bloccanti Active Memory usano righe di trascrizione SQLite invece di
  creare file `session.jsonl` temporanei o persistiti sotto lo stato del Plugin. La
  vecchia opzione `transcriptDir` è stata rimossa.
- La generazione di slug una tantum e le esecuzioni del planner Crestodian usano righe di trascrizione SQLite
  invece di creare file `session.jsonl` temporanei.
- Anche le esecuzioni dell'helper `llm-task` e l'estrazione nascosta degli impegni usano righe di
  trascrizione SQLite, quindi queste sessioni helper solo modello non creano più
  file di trascrizione JSON/JSONL temporanei.
- `TranscriptSessionManager` ora è solo un ambito di trascrizione SQLite aperto.
  Il codice runtime lo apre con `openTranscriptSessionManagerForSession({agentId,
sessionId})`; i flussi di creazione, branch, continuazione, lista e fork risiedono nei rispettivi
  helper di righe SQLite proprietari invece che nelle facade statiche del manager.
  Il codice doctor/import/debug gestisce file sorgente legacy espliciti fuori dal
  session manager runtime.
- I metodi facade obsoleti `SessionManager.newSession()` e
  `SessionManager.createBranchedSession()` sono stati rimossi. Le nuove
  sessioni e i discendenti di trascrizione vengono creati dal workflow SQLite
  proprietario invece di mutare un manager già aperto in una diversa
  sessione persistita.
- Le decisioni di fork della trascrizione padre e la creazione dei fork non accettano più
  `storePath` o `sessionsDir`; usano invece l'ambito di trascrizione SQLite
  `{agentId, sessionId}` al posto di metadati di percorso filesystem mantenuti.
- Memory-host non esporta più helper no-op di classificazione della trascrizione della directory di sessione;
  il filtraggio della trascrizione ora deriva dai metadati delle righe SQLite durante la costruzione delle entry.
- I test di esportazione sessione di Memory-host e QMD usano ambiti di trascrizione SQLite. I vecchi
  percorsi `agents/<agentId>/sessions/*.jsonl` restano coperti solo dove un test sta
  intenzionalmente provando la compatibilità doctor/import/export.
- L'ispezione grezza delle sessioni di QA-lab ora usa `sessions.list` tramite il Gateway
  invece di leggere `agents/qa/sessions/sessions.json`; il feedback MSteams
  viene aggiunto direttamente alle trascrizioni SQLite senza fabbricare un percorso JSONL.
- I turni dei canali in ingresso condivisi ora trasportano `{agentId, sessionKey}` invece di un
  `storePath` legacy. I percorsi di registrazione LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch e QQBot ora leggono i metadati updated-at e registrano
  le righe di sessione in ingresso tramite l’identità SQLite.
- La persistenza del localizzatore della trascrizione viene rimossa dalle righe di sessione attive.
  `resolveSessionTranscriptTarget` restituisce `agentId`, `sessionId` e metadati
  opzionali dell’argomento; doctor è l’unico codice che importa i nomi dei file di trascrizione legacy.
- Le intestazioni delle trascrizioni runtime partono dalla versione SQLite `1`. Gli aggiornamenti
  delle vecchie forme JSONL V1/V2/V3 vivono solo nell’importazione doctor e normalizzano
  le intestazioni importate alla versione corrente della trascrizione SQLite prima che le righe vengano archiviate.
- La guardia database-first ora vieta `SessionManager.listAll` e
  `SessionManager.forkFromSession`; i flussi di elenco sessioni e fork/restore
  devono restare sulle API SQLite per righe/con ambito.
- La guardia vieta anche i nomi degli helper legacy per parsing JSONL delle trascrizioni/riparazione active-branch
  fuori dal codice doctor/import, quindi il runtime non può sviluppare un secondo percorso di migrazione
  delle trascrizioni legacy.
- Le esecuzioni PI embedded rifiutano gli handle di trascrizione in ingresso. Usano l’identità SQLite
  `{agentId, sessionId}` prima dell’avvio del worker e di nuovo prima che il
  tentativo tocchi lo stato della trascrizione. Un input obsoleto `/tmp/*.jsonl` non può selezionare un
  target di scrittura runtime.
- I record di cache trace, payload Anthropic, stream grezzo e timeline diagnostica
  ora vengono scritti in righe SQLite tipizzate `diagnostic_events`. I bundle di stabilità del
  Gateway ora vengono scritti in righe SQLite tipizzate `diagnostic_stability_bundles`. I vecchi
  percorsi di override JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` e
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` sono rimossi, e
  la normale cattura della stabilità non scrive più file `logs/stability/*.json`.
- La persistenza Cron ora riconcilia le righe SQLite `cron_jobs` invece di
  eliminare e reinserire l’intera tabella dei job a ogni salvataggio. Le riscritture dei target Plugin
  aggiornano direttamente le righe cron corrispondenti e mantengono lo stato cron runtime nella
  stessa transazione del database di stato.
- I chiamanti runtime Cron ora usano una chiave stabile dello store cron SQLite. I percorsi legacy
  `cron.store` sono solo input di importazione doctor; i percorsi production gateway, manutenzione
  task, stato, run-log e riscrittura target Telegram usano
  `resolveCronStoreKey` e non normalizzano più la chiave come percorso. Lo stato Cron ora
  riporta `storeKey` invece del vecchio campo `storePath` in forma di file.
- Il caricamento e la pianificazione runtime Cron non normalizzano più forme di job persistite legacy
  come `jobId`, `schedule.cron`, `atMs` numerico, booleani stringa o
  `sessionTarget` mancante. L’importazione legacy doctor possiede queste riparazioni prima che le righe
  vengano inserite in SQLite.
- Lo spawn ACP non risolve né persiste più percorsi di file JSONL delle trascrizioni. La configurazione
  di spawn e thread-bind persiste direttamente la riga di sessione SQLite e mantiene
  l’id sessione come identità di trascrizione conservata.
- Le API dei metadati di sessione ACP ora leggono/elencano/eseguono upsert di righe SQLite per `agentId` e
  non espongono più `storePath` come parte del contratto della voce di sessione ACP.
- La contabilizzazione dell’uso delle sessioni e l’aggregazione dell’uso del gateway ora risolvono le trascrizioni
  solo tramite `{agentId, sessionId}`. La cache cost/usage e i riepiloghi delle sessioni
  scoperte non sintetizzano né restituiscono più stringhe di localizzatore della trascrizione.
- L’append della chat Gateway, la persistenza abort-partial, `/sessions.send` e
  le scritture delle trascrizioni media webchat aggiungono direttamente tramite l’ambito della trascrizione SQLite.
  L’helper di injection delle trascrizioni del gateway non accetta più un parametro
  `transcriptLocator`.
- La discovery delle trascrizioni SQLite ora elenca solo ambiti e statistiche delle trascrizioni:
  `{agentId, sessionId, updatedAt, eventCount}`. L’helper di compatibilità morto
  `listSqliteSessionTranscriptLocators` e il campo per-riga
  `locator` sono spariti.
- Il runtime di riparazione delle trascrizioni ora espone solo
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Il vecchio
  helper di riparazione basato su localizzatore è eliminato; il codice doctor/debug legge percorsi
  espliciti dei file sorgente e non migra mai stringhe di localizzatore.
- Il runtime del ledger di replay ACP ora archivia righe di replay per sessione nel database di stato
  SQLite condiviso invece di `acp/event-ledger.json`; doctor importa e
  rimuove il file legacy.
- Gli helper di lettura delle trascrizioni Gateway ora vivono in
  `src/gateway/session-transcript-readers.ts` invece del vecchio
  nome modulo `session-utils.fs`. Il controllo della cronologia retry di fallback è nominato per
  il contenuto della trascrizione SQLite invece della vecchia superficie dell’helper file.
- Gli helper Gateway injected-chat e Compaction ora passano l’ambito della trascrizione SQLite
  tramite API helper interne invece di nominare i valori come percorsi di trascrizione o
  file sorgente.
- Il rilevamento della continuazione bootstrap ora controlla le righe di trascrizione SQLite tramite
  `hasCompletedBootstrapTranscriptTurn`; non espone più un nome helper in forma di file.
- I test embedded-runner ora usano l’identità della trascrizione SQLite, e l’apertura di un nuovo
  transcript manager richiede sempre un `sessionId` esplicito.
- Gli helper di indicizzazione della memoria ora usano la terminologia delle trascrizioni SQLite end to end:
  l’host esporta `listSessionTranscriptScopesForAgent` e
  `sessionTranscriptKeyForScope`, le code di sync mirate `sessionTranscripts`,
  gli hit di ricerca sessione pubblici espongono percorsi opachi `transcript:<agent>:<session>`,
  e la chiave sorgente DB interna è `session:<session>` sotto
  `source_kind='sessions'` invece di un finto percorso file.
- L’helper persistent-dedupe generico del Plugin SDK non espone più opzioni in forma di file.
  I chiamanti forniscono chiavi di ambito SQLite e le righe di dedupe durevoli vivono nello
  stato Plugin condiviso.
- I token SSO Microsoft Teams sono stati spostati da file JSON bloccati allo stato Plugin
  SQLite. Doctor importa `msteams-sso-tokens.json`, ricostruisce le chiavi canoniche dei token SSO
  dai payload e rimuove il file sorgente. I token OAuth delegati restano sul loro
  confine esistente dei file di credenziali private.
- Lo stato della cache di sync Matrix è stato spostato da `bot-storage.json` allo stato Plugin
  SQLite. Doctor importa payload di sync legacy grezzi o incapsulati e rimuove il
  file sorgente. I client Matrix e QA Matrix attivi passano una directory radice dello store di sync
  SQLite, non un finto percorso `sync-store.json` o `bot-storage.json`.
- Lo stato della migrazione crypto legacy Matrix è stato spostato da
  `legacy-crypto-migration.json` allo stato Plugin SQLite. Doctor importa il
  vecchio file di stato; gli snapshot IndexedDB Matrix SDK sono stati spostati da
  `crypto-idb-snapshot.json` a blob Plugin SQLite. Le chiavi di recovery Matrix e
  le credenziali sono righe di stato Plugin SQLite; i loro vecchi file JSON sono solo
  input di migrazione doctor.
- I log di attività Memory Wiki ora usano lo stato Plugin SQLite invece di
  `.openclaw-wiki/log.jsonl`. Il provider di migrazione Memory Wiki importa i vecchi
  log JSONL; il markdown wiki e il contenuto del vault utente restano file-backed come
  contenuto workspace.
- Memory Wiki non crea più `.openclaw-wiki/state.json` o la directory inutilizzata
  `.openclaw-wiki/locks`. Il provider di migrazione rimuove quei file di metadati Plugin
  ritirati se un vault più vecchio li ha ancora.
- Le voci di audit Crestodian ora usano lo stato Plugin SQLite core invece di
  `audit/crestodian.jsonl`. Doctor importa il log di audit JSONL legacy e
  lo rimuove dopo un’importazione riuscita.
- Le voci di audit di scrittura/osservazione della configurazione ora usano lo stato Plugin SQLite core
  invece di `logs/config-audit.jsonl`. Doctor importa il log di audit JSONL legacy e
  lo rimuove dopo un’importazione riuscita.
- Il companion macOS non scrive più sidecar app-local `logs/config-audit.jsonl` o
  `logs/config-health.json` durante la modifica di `openclaw.json`. Il file di configurazione
  resta file-backed, gli snapshot di recovery restano accanto al file di configurazione,
  e lo stato durevole di audit/salute della configurazione appartiene allo store SQLite del Gateway.
- Le approvazioni in sospeso del rescue Crestodian ora usano lo stato Plugin SQLite core invece
  di `crestodian/rescue-pending/*.json`. Doctor importa i file legacy di approvazione in sospeso
  e li rimuove dopo un’importazione riuscita.
- Lo stato temporaneo arm di Phone Control ora usa lo stato Plugin SQLite invece di
  `plugins/phone-control/armed.json`. Doctor importa il file legacy dello stato armed
  nel namespace `phone-control/arm-state` e rimuove il file.
- Doctor non ripara più le trascrizioni JSONL sul posto né crea file JSONL
  di backup. Importa il branch attivo in SQLite e rimuove la sorgente legacy.
- La ricerca delle trascrizioni dell’hook session-memory usa letture SQLite solo per ambito
  `{agentId, sessionId}`. Il suo helper non accetta né deriva più localizzatori di trascrizione,
  letture di file legacy o opzioni di riscrittura file.
- I binding di conversazione del server app Codex ora indicizzano lo stato Plugin SQLite per
  chiave sessione OpenClaw o ambito esplicito `{agentId, sessionId}`. Non devono
  preservare binding di fallback basati su percorso di trascrizione.
- Le letture della cronologia mirrored-history del server app Codex usano solo l’ambito della trascrizione SQLite;
  non devono recuperare l’identità dai percorsi dei file di trascrizione.
- I percorsi di role-ordering e reset Compaction non eliminano più i vecchi file di trascrizione;
  il reset ruota solo la riga di sessione SQLite e l’identità della trascrizione.
- Le risposte di reset e checkpoint del Gateway restituiscono righe di sessione pulite più id sessione.
  Non sintetizzano più localizzatori di trascrizione SQLite per i client.
- Il dreaming memory-core non elimina più righe di sessione sondando file JSONL mancanti.
  La pulizia dei subagent passa tramite l’API runtime di sessione invece di
  controlli di esistenza del filesystem. I suoi test di ingestione delle trascrizioni preparano direttamente righe SQLite
  invece di creare fixture `agents/<id>/sessions` o placeholder di localizzatore.
- L’indicizzazione delle trascrizioni di memoria può esporre `transcript:<agentId>:<sessionId>` come
  percorso virtuale dell’hit di ricerca per helper di citazione/lettura. La sorgente durevole dell’indice è
  relazionale (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), quindi il valore non è un localizzatore di trascrizione runtime,
  non è un percorso filesystem e non deve mai essere ripassato alle API runtime di sessione.
- Lo stato memoria doctor del Gateway legge i conteggi di short-term recall e phase-signal
  dalle righe di stato Plugin SQLite invece di `memory/.dreams/*.json`; l’output CLI e
  doctor ora etichetta quello storage come store SQLite, non come percorso.
- Il runtime memory-core, lo stato CLI, i metodi doctor Gateway e le facciate Plugin SDK
  non fanno più audit né archiviano file legacy `.dreams/session-corpus`.
  Quei file sono solo input di migrazione; doctor li importa in SQLite e
  elimina la sorgente dopo la verifica. Le righe di evidenza active session-ingestion
  ora usano il percorso SQLite virtuale `memory/session-ingestion/<day>.txt`; il runtime
  non scrive né deriva mai stato da `.dreams/session-corpus`.
- Gli artefatti pubblici memory-core espongono gli eventi host SQLite come artefatto JSON virtuale
  `memory/events/memory-host-events.json`; non riusano più il
  percorso sorgente legacy `.dreams/events.jsonl`.
- I registri container/browser sandbox ora usano la tabella SQLite condivisa
  `sandbox_registry_entries` con colonne tipizzate per sessione, immagine, timestamp,
  backend/config e porta browser. Doctor importa i file registro JSON legacy monolitici e
  sharded e rimuove le sorgenti riuscite. Le letture runtime usano le colonne tipizzate
  delle righe come fonte di verità; `entry_json` è solo una copia di replay/debug.
- I commitments ora usano una tabella condivisa tipizzata `commitments` invece di un
  blob JSON dell’intero store. I salvataggi snapshot eseguono upsert per id commitment ed eliminano solo
  le righe mancanti invece di svuotare e reinserire la tabella. Il runtime carica
  i commitments da colonne tipizzate di ambito, delivery-window, stato, tentativo e testo;
  `record_json` è solo una copia di replay/debug. Doctor importa il legacy
  `commitments.json` e lo rimuove dopo un’importazione riuscita.
- Le definizioni dei job Cron, lo stato della pianificazione e la cronologia di esecuzione non hanno più writer o reader JSON
  runtime. Il runtime usa righe `cron_jobs` con pianificazione tipizzata,
  payload, consegna, avviso di errore, sessione, stato e stato di runtime più metadati
  `cron_run_logs` tipizzati per stato, riepilogo diagnostico, stato/errore di consegna,
  sessione/run, modello e totali dei token. `job_json` è solo una copia di replay/debug; `state_json` conserva diagnostica
  di runtime annidata che non ha ancora campi di query caldi, mentre il runtime
  reidrata i campi di stato caldi dalle colonne tipizzate. Doctor importa
  i file legacy `jobs.json`, `jobs-state.json` e `runs/*.jsonl` e rimuove
  le sorgenti importate. I writeback dei target Plugin aggiornano le righe `cron_jobs`
  corrispondenti invece di caricare e sostituire l'intero archivio cron.
- L'avvio del Gateway ignora i marcatori legacy `notify: true` nella proiezione
  di runtime. Doctor li traduce in consegna SQLite esplicita quando
  `cron.webhook` è valido, rimuove i marcatori inerti quando non è impostato e li conserva
  con un avviso quando il webhook configurato non è valido.
- Le code di consegna in uscita e di sessione ora memorizzano stato della coda, tipo di voce,
  chiave di sessione, canale, target, ID account, conteggio dei tentativi, ultimo tentativo/errore,
  stato di recupero e marcatori di invio della piattaforma come colonne tipizzate nella tabella condivisa
  `delivery_queue_entries`. Il recupero runtime legge questi campi caldi dalle
  colonne tipizzate, e le mutazioni di retry/recupero aggiornano direttamente quelle colonne
  senza riscrivere il JSON di replay. Il payload JSON completo resta solo come blob
  di replay/debug per i corpi dei messaggi e altri dati di replay freddi.
- I record delle immagini in uscita gestite ora usano righe condivise tipizzate
  `managed_outgoing_image_records` con i byte multimediali ancora archiviati in
  `media_blobs`. Il record JSON resta solo come copia di replay/debug.
- Le preferenze del selettore modello di Discord, gli hash di distribuzione dei comandi e i binding dei thread
  ora usano lo stato Plugin SQLite condiviso. I loro piani di importazione JSON legacy vivono nella
  superficie di migrazione setup/doctor del plugin Discord, non nel codice di migrazione core.
- I rilevatori di importazione legacy dei Plugin usano moduli denominati per doctor come
  `doctor-legacy-state.ts` o `doctor-state-imports.ts`; i normali moduli runtime dei canali
  non devono importare rilevatori JSON legacy.
- I cursori di catchup BlueBubbles e i marcatori di deduplicazione in ingresso ora usano lo stato Plugin SQLite
  condiviso. I loro piani di importazione JSON legacy vivono nella superficie di migrazione setup/doctor del plugin
  BlueBubbles, non nel codice di migrazione core.
- Offset degli aggiornamenti Telegram, righe cache degli sticker, righe cache dei messaggi inviati,
  righe cache dei nomi topic e binding dei thread ora usano lo stato Plugin SQLite condiviso.
  I loro piani di importazione JSON legacy vivono nella superficie di migrazione setup/doctor del plugin Telegram,
  non nel codice di migrazione core.
- I cursori di catchup iMessage, le mappature reply short-id e le righe di deduplicazione sent-echo
  ora usano lo stato Plugin SQLite condiviso. I vecchi file `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` e `imessage/sent-echoes.jsonl` sono solo input di doctor.
- Le righe di deduplicazione dei messaggi Feishu ora usano lo stato Plugin SQLite condiviso invece dei
  file `feishu/dedup/*.json`. Il suo piano di importazione JSON legacy vive nella superficie di migrazione
  setup/doctor del plugin Feishu, non nel codice di migrazione core.
- Conversazioni, sondaggi, buffer di upload in sospeso e apprendimenti di feedback di Microsoft Teams
  ora usano tabelle di stato/blob Plugin SQLite condivise. Il percorso di upload in sospeso
  usa `plugin_blob_entries` così i buffer multimediali sono archiviati come BLOB SQLite
  invece che come JSON base64. I nomi degli helper runtime ora usano la nomenclatura SQLite/stato
  invece della nomenclatura file-store `*-fs`, e il vecchio shim `storePath` è stato rimosso
  da questi archivi. Il suo piano di importazione JSON legacy vive nella superficie di migrazione setup/doctor
  del plugin Microsoft Teams.
- I media in uscita ospitati da Zalo ora usano `plugin_blob_entries` SQLite condiviso
  invece dei sidecar temporanei JSON/bin `openclaw-zalo-outbound-media`.
- HTML e metadati del visualizzatore diff ora usano `plugin_blob_entries` SQLite condiviso
  invece dei file temporanei `meta.json`/`viewer.html`. Gli output PNG/PDF renderizzati restano
  materializzazioni temporanee perché la consegna del canale richiede ancora un percorso file.
- I documenti gestiti Canvas ora usano `plugin_blob_entries` SQLite condiviso invece
  di una directory predefinita `state/canvas/documents`. L'host Canvas serve questi
  blob direttamente; i file locali vengono creati solo per contenuti operatore `host.root`
  espliciti o per materializzazione temporanea quando un lettore multimediale downstream
  richiede un percorso.
- Le decisioni di audit File Transfer ora usano `plugin_state_entries` SQLite condiviso
  invece del log runtime illimitato `audit/file-transfer.jsonl`. Doctor
  importa il file di audit JSONL legacy nello stato Plugin e rimuove la sorgente
  dopo un'importazione pulita.
- I lease di processo ACPX e l'identità dell'istanza Gateway ora usano lo stato Plugin SQLite condiviso.
  Doctor importa il file legacy `gateway-instance-id` nello stato Plugin
  e rimuove la sorgente.
- Gli script wrapper generati da ACPX e la home Codex isolata sono materializzazione
  temporanea sotto la root temporanea OpenClaw, non stato OpenClaw durevole. I record runtime
  ACPX durevoli sono il lease SQLite e le righe gateway-instance;
  la vecchia superficie di configurazione ACPX `stateDir` è rimossa perché nessuno stato runtime
  viene più scritto lì.
- Gli allegati multimediali del Gateway ora usano la tabella SQLite condivisa `media_blobs` come
  archivio canonico dei byte. I percorsi locali restituiti alle superfici di compatibilità
  canale e sandbox sono materializzazioni temporanee della riga del database, non l'archivio
  multimediale durevole. Le allowlist multimediali runtime non includono più le root legacy
  `$OPENCLAW_STATE_DIR/media` o `media` della directory di configurazione; queste directory sono
  solo sorgenti di importazione doctor.
- Il completamento shell non scrive più file cache `$OPENCLAW_STATE_DIR/completions/*`.
  I percorsi smoke di installazione, doctor, update e release usano output di completamento
  generato o sourcing del profilo invece di file cache di completamento durevoli.
- Lo staging degli upload Skills del Gateway ora usa righe `skill_uploads` condivise. Metadati
  di upload, chiavi di idempotenza e byte dell'archivio vivono in SQLite; l'installer
  riceve solo un percorso di archivio materializzato temporaneo mentre un'installazione è
  in esecuzione.
- Gli allegati inline dei subagent non vengono più materializzati sotto
  `.openclaw/attachments/*` del workspace. Il percorso spawn prepara voci seed SQLite VFS,
  i run inline inseriscono queste voci nello spazio dei nomi scratch runtime per-agent,
  e gli strumenti basati su disco sovrappongono quello scratch SQLite per i percorsi degli allegati. Le
  vecchie colonne di registro attachment-dir dei run subagent e gli hook di cleanup sono stati rimossi.
- L'idratazione immagini CLI non mantiene più file cache stabili `openclaw-cli-images`.
  I backend CLI esterni ricevono ancora percorsi file, ma quei percorsi sono
  materializzazioni temporanee per-run con cleanup.
- Diagnostica cache-trace, diagnostica payload Anthropic, diagnostica stream modello grezzo,
  eventi timeline diagnostici e bundle di stabilità Gateway ora
  scrivono righe SQLite invece di file `logs/*.jsonl` o
  `logs/stability/*.json`.
  Flag di override dei percorsi runtime e variabili env sono stati rimossi; i comandi
  export/debug possono materializzare file esplicitamente dalle righe del database.
- Il companion macOS non ha più uno writer continuo `diagnostics.jsonl`. I log dell'app
  vanno al logging unificato, e la diagnostica Gateway durevole resta supportata da SQLite.
- L'elenco dei record macOS port-guardian ora usa righe SQLite condivise tipizzate
  `macos_port_guardian_records` invece di un file JSON Application Support
  o di un blob singleton opaco.
- I lock singleton del Gateway ora usano righe SQLite condivise tipizzate `state_leases` sotto
  lo scope `gateway_locks` invece di file lock nella directory temporanea. La documentazione di troubleshooting
  Fly e OAuth ora punta al lock di lease/auth refresh SQLite invece che a una pulizia
  obsoleta dei file lock.
- Lo stato sentinel di riavvio del Gateway ora usa righe SQLite condivise tipizzate
  `gateway_restart_sentinel` invece di `restart-sentinel.json`; il runtime
  legge tipo sentinel, stato, routing, messaggio, continuation e statistiche da
  colonne tipizzate. `payload_json` è solo una copia di replay/debug. Il codice runtime cancella
  direttamente la riga SQLite e non porta più con sé plumbing di cleanup dei file.
- Intento di riavvio del Gateway e stato di handoff del supervisor ora usano righe SQLite condivise tipizzate
  `gateway_restart_intent` e `gateway_restart_handoff` invece dei sidecar
  `gateway-restart-intent.json` e
  `gateway-supervisor-restart-handoff.json`.
- Il coordinamento singleton del Gateway ora usa righe tipizzate `state_leases` sotto
  `gateway_locks` invece di scrivere file `gateway.<hash>.lock`. La riga lease
  possiede proprietario del lock, scadenza, Heartbeat e payload di debug; SQLite possiede il
  confine atomico acquire/release. L'opzione ritirata della directory dei file lock è
  rimossa; i test usano direttamente l'identità della riga SQLite.
- Il vecchio helper non referenziato di report di utilizzo cron che scandiva i file `cron/runs/*.jsonl`
  è stato eliminato. I report della cronologia dei run Cron devono leggere le righe SQLite tipizzate
  `cron_run_logs`.
- Il recupero del riavvio della sessione principale ora scopre gli agenti candidati tramite il
  registro SQLite `agent_databases` invece di scandire directory `agents/*/sessions`.
- Il recupero della corruzione sessione Gemini ora elimina solo la riga sessione SQLite;
  non ha più bisogno di un gate legacy `storePath` né prova a scollegare un percorso
  transcript JSONL derivato.
- La gestione degli override dei percorsi ora tratta i valori ambiente letterali `undefined`/`null`
  come non impostati, evitando database accidentali `undefined/state/*.sqlite`
  nella root del repo durante test o handoff shell.
- Le impronte di integrità config ora usano righe SQLite condivise tipizzate `config_health_entries`
  invece di `logs/config-health.json`, mantenendo il normale file config come
  unico documento di configurazione non credenziale. Il companion macOS mantiene solo
  stato di integrità process-local e non ricrea il vecchio sidecar JSON.
- Il runtime dei profili auth non importa né scrive più file JSON di credenziali. Lo
  store canonico delle credenziali è SQLite; `auth-profiles.json`, `auth.json` per-agent
  e `credentials/oauth.json` condiviso sono input di migrazione doctor
  che vengono rimossi dopo l'importazione.
- I test di salvataggio/stato dei profili auth ora verificano direttamente tabelle auth SQLite tipizzate
  e usano nomi file auth-profile legacy solo per input di migrazione doctor.
- `openclaw secrets apply` pulisce solo il file config, il file env e lo store
  auth-profile SQLite. Non porta più logica di compatibilità che modifica
  il ritirato `auth.json` per-agent; doctor possiede importazione ed eliminazione di quel file.
- I piani e le applicazioni di migrazione segreti Hermes importavano profili API-key direttamente
  nello store auth-profile SQLite. Non scrive né verifica più
  `auth-profiles.json` come target intermedio.
- La documentazione auth rivolta agli utenti ora descrive
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` invece di
  dire agli utenti di ispezionare o copiare `auth-profiles.json`; i nomi JSON legacy OAuth/auth
  restano documentati solo come input di importazione doctor.
- Gli helper dei percorsi di stato core non espongono più il file ritirato `credentials/oauth.json`.
  Il nome file legacy è locale al percorso di importazione auth doctor.
- La documentazione di installazione, sicurezza, onboarding, model-auth e SecretRef ora descrive
  righe auth-profile SQLite e backup/migrazione dell'intero stato invece di
  file JSON auth-profile per-agent.
- La discovery dei modelli PI ora passa credenziali canoniche nello storage auth
  in-memory `pi-coding-agent`. Non crea, pulisce né scrive più
  `auth.json` per-agent durante la discovery.
- Le impostazioni di trigger e routing Voice Wake ora usano tabelle SQLite condivise tipizzate
  invece di `settings/voicewake.json`, `settings/voicewake-routing.json` o
  righe generiche opache; doctor importa i file JSON legacy e li rimuove dopo una
  migrazione riuscita.
- Lo stato update-check ora usa una riga condivisa tipizzata `update_check_state` invece di
  `update-check.json` o un blob generico opaco; doctor importa
  il file JSON legacy e lo rimuove dopo una migrazione riuscita.
- Lo stato di integrità config ora usa righe condivise tipizzate `config_health_entries` invece
  di `logs/config-health.json` o un blob generico opaco; doctor
  importa il file JSON legacy e lo rimuove dopo una migrazione riuscita.
- Le approvazioni dei binding delle conversazioni Plugin ora usano righe tipizzate
  `plugin_binding_approvals` invece di stato SQLite condiviso opaco o
  `plugin-binding-approvals.json`; il file legacy è un input di migrazione per doctor.
- I binding generici della conversazione corrente ora archiviano righe tipizzate
  `current_conversation_bindings` invece di riscrivere
  `bindings/current-conversations.json`; doctor importa il file JSON legacy e
  lo rimuove dopo una migrazione riuscita.
- I registri di sincronizzazione delle fonti importate di Memory Wiki ora archiviano una riga di stato Plugin SQLite
  per ogni chiave vault/fonte invece di riscrivere `.openclaw-wiki/source-sync.json`;
  il provider di migrazione importa e rimuove il registro JSON legacy.
- I record delle esecuzioni di importazione ChatGPT di Memory Wiki ora archiviano una riga di stato Plugin SQLite
  per ogni id vault/esecuzione invece di scrivere `.openclaw-wiki/import-runs/*.json`.
  Gli snapshot di rollback restano file vault espliciti finché l'archiviazione degli snapshot
  delle esecuzioni di importazione non viene spostata nello storage blob.
- I digest compilati di Memory Wiki ora archiviano righe blob Plugin SQLite invece di
  scrivere `.openclaw-wiki/cache/agent-digest.json` e
  `.openclaw-wiki/cache/claims.jsonl`. Il provider di migrazione importa i vecchi file di cache
  e rimuove la directory della cache quando diventa vuota.
- Il tracciamento dell'installazione delle skill ClawHub ora archivia una riga di stato Plugin SQLite per
  workspace/skill invece di scrivere o leggere i file collaterali `.clawhub/lock.json` e
  `.clawhub/origin.json` a runtime. Il codice runtime usa oggetti di stato di installazione tracciata
  invece di astrazioni lockfile/origin modellate come file. Doctor
  importa i file collaterali legacy dai workspace agent configurati e li rimuove
  dopo un'importazione pulita.
- L'indice dei Plugin installati ora legge e scrive la riga singleton tipizzata SQLite condivisa
  `installed_plugin_index` invece di `plugins/installs.json`; il
  file JSON legacy è solo un input di migrazione per doctor e viene rimosso dopo l'importazione.
- L'helper del percorso legacy `plugins/installs.json` ora vive nel codice legacy di doctor.
  I moduli runtime dell'indice Plugin espongono solo opzioni di persistenza basate su SQLite,
  non un percorso di file JSON.
- Il sentinel di riavvio del Gateway, l'intenzione di riavvio e lo stato di passaggio al supervisore ora usano
  righe SQLite condivise tipizzate (`gateway_restart_sentinel`,
  `gateway_restart_intent` e `gateway_restart_handoff`) invece di blob generici
  opachi. Il codice runtime di riavvio non ha contratti sentinel/intento/passaggio
  modellati come file.
- Cache di sincronizzazione Matrix, metadati di storage, binding dei thread, marcatori di deduplicazione in ingresso,
  stato di cooldown della verifica di avvio, snapshot crittografici IndexedDB dell'SDK,
  credenziali e chiavi di recupero ora usano tabelle di stato/blob Plugin SQLite
  condivise. Le strutture dei percorsi runtime non espongono più un percorso di metadati `storage-meta.json`;
  quel nome file è solo un input di migrazione legacy. Il loro piano di importazione JSON legacy
  vive nella superficie di configurazione/migrazione doctor del Plugin Matrix.
- L'avvio di Matrix non esegue più scansioni, segnalazioni o completamenti dello stato file
  legacy di Matrix. Il rilevamento dei file Matrix, la creazione di snapshot crittografici legacy,
  lo stato di migrazione del ripristino delle chiavi delle stanze, l'importazione e la rimozione
  della fonte sono tutti di proprietà di doctor.
- I barrel di migrazione runtime di Matrix sono stati rimossi. Gli helper di rilevamento
  e modifica di stato/crittografia legacy sono importati direttamente da Matrix doctor invece di far
  parte della superficie API runtime.
- I marcatori di riuso degli snapshot di migrazione Matrix ora vivono nello stato Plugin SQLite
  invece che in `matrix/migration-snapshot.json`; doctor può ancora riusare lo stesso
  archivio pre-migrazione verificato senza scrivere un file di stato collaterale.
- I cursori del bus Nostr e lo stato di pubblicazione profilo ora usano lo stato Plugin SQLite condiviso.
  Il loro piano di importazione JSON legacy vive nella superficie di configurazione/migrazione doctor
  del Plugin Nostr.
- Gli interruttori di sessione di Active Memory ora usano lo stato Plugin SQLite condiviso invece di
  `session-toggles.json`; riattivare la memoria elimina la riga invece di
  riscrivere un oggetto JSON.
- Le proposte di Skill Workshop e i contatori di revisione ora usano lo stato Plugin SQLite condiviso
  invece degli archivi per workspace `skill-workshop/<workspace>.json`. Ogni
  proposta è una riga separata sotto `skill-workshop/proposals`, e il contatore di revisione
  è una riga separata sotto `skill-workshop/reviews`.
- Le esecuzioni dei subagent revisori di Skill Workshop ora usano il resolver delle trascrizioni
  di sessione runtime invece di creare percorsi di sessione collaterali
  `skill-workshop/<sessionId>.json`.
- I lease di processo ACPX ora usano lo stato Plugin SQLite condiviso sotto
  `acpx/process-leases` invece di un registro a file intero `process-leases.json`.
  Ogni lease è archiviato come riga propria, preservando la pulizia dei processi obsoleti all'avvio
  senza un percorso runtime di riscrittura JSON.
- Gli script wrapper ACPX e la home Codex isolata sono generati nella
  radice temporanea di OpenClaw. Vengono ricreati quando necessario e non sono input
  di backup o migrazione.
- La persistenza del registro delle esecuzioni dei subagent usa righe condivise tipizzate `subagent_runs`. Il
  vecchio percorso `subagents/runs.json` ora è solo un input di migrazione per doctor, e
  i nomi degli helper runtime non descrivono più il livello di stato come basato su disco.
  I test runtime non creano più fixture `runs.json` non valide o vuote per dimostrare
  il comportamento del registro; inizializzano/leggono direttamente righe SQLite.
- Il backup prepara la directory di stato prima dell'archiviazione, copia i file non database,
  crea snapshot dei database `*.sqlite` con `VACUUM INTO`, omette i file collaterali WAL/SHM
  live, registra i metadati degli snapshot nel manifest dell'archivio e registra
  le esecuzioni di backup completate in SQLite con il manifest dell'archivio. `openclaw backup
create` valida l'archivio scritto per impostazione predefinita; `--no-verify` è il
  percorso veloce esplicito.
- `openclaw backup restore` valida l'archivio prima dell'estrazione, riusa il
  manifest normalizzato del verificatore e ripristina gli asset verificati del manifest nei loro
  percorsi sorgente registrati. Richiede `--yes` per le scritture e supporta `--dry-run`
  per un piano di ripristino.
- Il vecchio filtro dei percorsi volatili di backup è eliminato. Il backup non ha più bisogno di una
  lista di esclusione live-tar per file JSON/JSONL legacy di sessione o Cron perché gli snapshot SQLite
  vengono preparati prima della creazione dell'archivio.
- La preparazione del workspace in setup e onboarding semplice non crea più
  directory `agents/<agentId>/sessions/`. Crea solo config/workspace;
  le righe di sessione SQLite e le righe di trascrizione vengono create su richiesta nel
  database per agent.
- La riparazione dei permessi di sicurezza ora prende di mira i database SQLite
  globali e per agent più i file collaterali WAL/SHM invece di `sessions.json` e dei file
  transcript JSONL.
- I nomi runtime del registro sandbox ora descrivono direttamente i tipi di registro SQLite
  invece di portare la terminologia legacy del registro JSON nello store attivo.
- `openclaw reset --scope config+creds+sessions` rimuove i database
  `openclaw-agent.sqlite` per agent più i file collaterali WAL/SHM, non solo le directory
  `sessions/` legacy.
- Gli helper di sessione aggregata del Gateway ora usano nomi orientati alle entry:
  `loadCombinedSessionEntriesForGateway` restituisce `{ databasePath, entries }`.
  La vecchia denominazione combined-store è stata rimossa dai chiamanti runtime.
- Il seeding del canale Docker MCP ora scrive la riga di sessione principale e gli eventi di trascrizione
  nel database SQLite per agent invece di creare
  `sessions.json` e una trascrizione JSONL.
- L'hook session-memory incluso ora risolve il contesto della sessione precedente da
  SQLite tramite `{agentId, sessionId}`. Non scansiona, archivia o sintetizza più
  percorsi di trascrizione o directory `workspace/sessions`.
- L'hook command-logger incluso ora scrive righe di audit dei comandi nella tabella SQLite condivisa
  `command_log_entries` invece di aggiungerle a
  `logs/commands.log`.
- Le allowlist di pairing dei canali ora espongono solo helper di lettura/scrittura basati su SQLite a
  runtime e nel Plugin SDK. Il vecchio resolver del percorso `*-allowFrom.json` e
  il lettore di file vivono solo sotto il codice di importazione legacy di doctor.
- `migration_runs` registra le esecuzioni di migrazione dello stato legacy con stato,
  timestamp e report JSON.
- `migration_sources` registra ogni fonte file legacy importata con hash, dimensione,
  conteggio record, tabella di destinazione, id esecuzione, stato e stato di rimozione della fonte.
- `backup_runs` registra percorsi degli archivi di backup, stato e manifest JSON.
- Lo schema globale non conserva una tabella di registro `agents` inutilizzata. La scoperta
  dei database agent è il registro canonico `agent_databases` finché il runtime
  non avrà un vero proprietario dei record agent.
- La config generata del catalogo modelli è archiviata in righe SQLite globali tipizzate
  `agent_model_catalogs` indicizzate per directory agent. I chiamanti runtime usano
  `ensureOpenClawModelCatalog`; non esiste un'API di compatibilità `models.json` nel
  codice runtime. L'implementazione scrive SQLite e il registro PI incorporato viene
  idratato da quel payload archiviato senza creare un file `models.json`.
- L'esportazione markdown delle trascrizioni di sessione QMD e la config `memory.qmd.sessions` sono state
  rimosse. Non esiste una raccolta di trascrizioni QMD, nessun percorso runtime
  `qmd/sessions*` e nessun bridge di memoria di sessione basato su file.
- Il runtime memory-core importa gli helper di indicizzazione delle trascrizioni SQLite da
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, non dal
  sottopercorso SDK QMD. Il sottopercorso QMD mantiene una riesportazione di compatibilità solo per
  chiamanti esterni finché una pulizia maggiore dell'SDK potrà rimuoverla.
- L'`index.sqlite` proprio di QMD ora è una materializzazione runtime temporanea basata sulla
  tabella SQLite principale `plugin_blob_entries`. Il runtime non crea più un file collaterale durevole
  `~/.openclaw/agents/<agentId>/qmd`.
- Il Plugin opzionale `memory-lancedb` non crea più
  `~/.openclaw/memory/lancedb` come store implicito gestito da OpenClaw. È un
  backend LanceDB esterno e resta disabilitato finché l'operatore non configura un
  `dbPath` esplicito.
- `check:database-first-legacy-stores` fallisce nuovo codice sorgente runtime che abbina
  nomi di store legacy ad API filesystem in stile scrittura. Fallisce anche codice sorgente runtime
  che reintroduce i marcatori ritirati del bridge di trascrizione
  `transcriptLocator` o `sqlite-transcript://...`. Migrazione, doctor, importazione
  e codice esplicito di esportazione non-sessione restano consentiti. Nomi di contratti legacy più ampi
  come `sessionFile`, `storePath` e le vecchie facciate dell'era file `SessionManager`
  hanno ancora proprietari correnti e necessitano di lavoro separato sulle guardie di migrazione
  prima di poter diventare un controllo preflight obbligatorio. La guardia ora copre anche
  store runtime `cache/*.json`, file collaterali generici
  `thread-bindings.json`, JSON di stato/log di esecuzione Cron, JSON di salute config,
  file collaterali di riavvio e lock, impostazioni Voice Wake, approvazioni di binding Plugin,
  JSON dell'indice dei Plugin installati, JSONL di audit File Transfer, log attività di Memory Wiki,
  il vecchio log di testo `command-logger` incluso e le opzioni diagnostiche JSONL raw-stream
  pi-mono. Vieta anche i vecchi nomi dei moduli legacy doctor a livello radice, così
  il codice di compatibilità resta sotto `src/commands/doctor/`. Anche gli handler di debug Android
  usano logcat/output in memoria invece di preparare file cache `camera_debug.log` o
  `debug_logs.txt`.

## Forma dello schema di destinazione

Mantieni gli schemi espliciti. Lo stato di runtime di proprieta dell'host usa tabelle tipizzate. Lo stato opaco di proprieta dei Plugin usa `plugin_state_entries` / `plugin_blob_entries`; non esiste una tabella host generica `kv`.

Database globale:

```text
state_leases(scope, lease_key, owner, expires_at, heartbeat_at, payload_json, created_at, updated_at)
exec_approvals_config(config_key, raw_json, socket_path, has_socket_token, default_security, default_ask, default_ask_fallback, auto_allow_skills, agent_count, allowlist_count, updated_at_ms)
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
agent_databases(agent_id, path, schema_version, last_seen_at, size_bytes)
task_runs(...)
task_delivery_state(...)
flow_runs(...)
subagent_runs(run_id, child_session_key, requester_session_key, controller_session_key, created_at, ended_at, cleanup_handled, payload_json)
current_conversation_bindings(binding_key, binding_id, target_agent_id, target_session_id, target_session_key, channel, account_id, conversation_kind, parent_conversation_id, conversation_id, target_kind, status, bound_at, expires_at, metadata_json, updated_at)
plugin_binding_approvals(plugin_root, channel, account_id, plugin_id, plugin_name, approved_at)
tui_last_sessions(scope_key, session_key, updated_at)
plugin_state_entries(plugin_id, namespace, entry_key, value_json, created_at, expires_at)
plugin_blob_entries(plugin_id, namespace, entry_key, metadata_json, blob, created_at, expires_at)
media_blobs(subdir, id, content_type, size_bytes, blob, created_at, updated_at)
skill_uploads(upload_id, kind, slug, force, size_bytes, sha256, actual_sha256, received_bytes, archive_blob, created_at, expires_at, committed, committed_at, idempotency_key_hash)
web_push_subscriptions(endpoint_hash, subscription_id, endpoint, p256dh, auth, created_at_ms, updated_at_ms)
web_push_vapid_keys(key_id, public_key, private_key, subject, updated_at_ms)
apns_registrations(node_id, transport, token, relay_handle, send_grant, installation_id, topic, environment, distribution, token_debug_suffix, updated_at_ms)
node_host_config(config_key, version, node_id, token, display_name, gateway_host, gateway_port, gateway_tls, gateway_tls_fingerprint, updated_at_ms)
device_identities(identity_key, device_id, public_key_pem, private_key_pem, created_at_ms, updated_at_ms)
device_auth_tokens(device_id, role, token, scopes_json, updated_at_ms)
macos_port_guardian_records(pid, port, command, mode, timestamp)
workspace_setup_state(workspace_key, workspace_path, version, bootstrap_seeded_at, setup_completed_at, updated_at)
native_hook_relay_bridges(relay_id, pid, hostname, port, token, expires_at_ms, updated_at_ms)
model_capability_cache(provider_id, model_id, name, input_text, input_image, reasoning, supports_tools, context_window, max_tokens, cost_input, cost_output, cost_cache_read, cost_cache_write, updated_at_ms)
agent_model_catalogs(catalog_key, agent_dir, raw_json, updated_at)
managed_outgoing_image_records(attachment_id, session_key, message_id, created_at, updated_at, retention_class, alt, original_media_id, original_media_subdir, original_content_type, original_width, original_height, original_size_bytes, original_filename, record_json)
gateway_restart_sentinel(sentinel_key, version, kind, status, ts, session_key, thread_id, delivery_channel, delivery_to, delivery_account_id, message, continuation_json, doctor_hint, stats_json, payload_json, updated_at_ms)
channel_pairing_requests(channel_key, account_id, request_id, code, created_at, last_seen_at, meta_json)
channel_pairing_allow_entries(channel_key, account_id, entry, sort_order, updated_at)
voicewake_triggers(config_key, position, trigger, updated_at_ms)
voicewake_routing_config(config_key, version, default_target_mode, default_target_agent_id, default_target_session_key, updated_at_ms)
voicewake_routing_routes(config_key, position, trigger, target_mode, target_agent_id, target_session_key, updated_at_ms)
update_check_state(state_key, last_checked_at, last_notified_version, last_notified_tag, last_available_version, last_available_tag, auto_install_id, auto_first_seen_version, auto_first_seen_tag, auto_first_seen_at, auto_last_attempt_version, auto_last_attempt_at, auto_last_success_version, auto_last_success_at, updated_at_ms)
config_health_entries(config_path, last_known_good_json, last_promoted_good_json, last_observed_suspicious_signature, updated_at_ms)
sandbox_registry_entries(registry_kind, container_name, session_key, backend_id, runtime_label, image, created_at_ms, last_used_at_ms, config_label_kind, config_hash, cdp_port, no_vnc_port, entry_json, updated_at)
cron_run_logs(store_key, job_id, seq, ts, status, error, summary, diagnostics_summary, delivery_status, delivery_error, delivered, session_id, session_key, run_id, run_at_ms, duration_ms, next_run_at_ms, model, provider, total_tokens, entry_json, created_at)
cron_jobs(store_key, job_id, name, description, enabled, delete_after_run, created_at_ms, agent_id, session_key, schedule_kind, schedule_expr, schedule_tz, every_ms, anchor_ms, at, stagger_ms, session_target, wake_mode, payload_kind, payload_message, payload_model, payload_fallbacks_json, payload_thinking, payload_timeout_seconds, payload_allow_unsafe_external_content, payload_external_content_source_json, payload_light_context, payload_tools_allow_json, delivery_mode, delivery_channel, delivery_to, delivery_thread_id, delivery_account_id, delivery_best_effort, failure_delivery_mode, failure_delivery_channel, failure_delivery_to, failure_delivery_account_id, failure_alert_disabled, failure_alert_after, failure_alert_channel, failure_alert_to, failure_alert_cooldown_ms, failure_alert_include_skipped, failure_alert_mode, failure_alert_account_id, next_run_at_ms, running_at_ms, last_run_at_ms, last_run_status, last_error, last_duration_ms, consecutive_errors, consecutive_skipped, schedule_error_count, last_delivery_status, last_delivery_error, last_delivered, last_failure_alert_at_ms, job_json, state_json, runtime_updated_at_ms, schedule_identity, sort_order, updated_at)
delivery_queue_entries(queue_name, id, status, entry_kind, session_key, channel, target, account_id, retry_count, last_attempt_at, last_error, recovery_state, platform_send_started_at, entry_json, enqueued_at, updated_at, failed_at)
commitments(id, agent_id, session_key, channel, account_id, recipient_id, thread_id, sender_id, kind, sensitivity, source, status, reason, suggested_text, dedupe_key, confidence, due_earliest_ms, due_latest_ms, due_timezone, source_message_id, source_run_id, created_at_ms, updated_at_ms, attempts, last_attempt_at_ms, sent_at_ms, dismissed_at_ms, snoozed_until_ms, expired_at_ms, record_json)
migration_runs(id, started_at, finished_at, status, report_json)
migration_sources(source_key, migration_kind, source_path, target_table, source_sha256, source_size_bytes, source_record_count, last_run_id, status, imported_at, removed_source, report_json)
backup_runs(id, created_at, archive_path, status, manifest_json)
```

Database dell'agente:

```text
schema_meta(meta_key, role, schema_version, agent_id, app_version, created_at, updated_at)
sessions(session_id, session_key, session_scope, created_at, updated_at, started_at, ended_at, status, chat_type, channel, account_id, primary_conversation_id, model_provider, model, agent_harness_id, parent_session_key, spawned_by, display_name)
conversations(conversation_id, channel, account_id, kind, peer_id, parent_conversation_id, thread_id, native_channel_id, native_direct_user_id, label, metadata_json, created_at, updated_at)
session_conversations(session_id, conversation_id, role, first_seen_at, last_seen_at)
session_routes(session_key, session_id, updated_at)
session_entries(session_id, session_key, entry_json, updated_at)
transcript_events(session_id, seq, event_json, created_at)
transcript_event_identities(session_id, event_id, seq, event_type, has_parent, parent_id, message_idempotency_key, created_at)
transcript_snapshots(session_id, snapshot_id, reason, event_count, created_at, metadata_json)
vfs_entries(namespace, path, kind, content_blob, metadata_json, updated_at)
tool_artifacts(run_id, artifact_id, kind, metadata_json, blob, created_at)
run_artifacts(run_id, path, kind, metadata_json, blob, created_at)
trajectory_runtime_events(session_id, run_id, seq, event_json, created_at)
memory_index_meta(key, value)
memory_index_sources(path, source, hash, mtime, size)
memory_index_chunks(id, path, source, start_line, end_line, hash, model, text, embedding, updated_at)
memory_embedding_cache(provider, model, provider_key, hash, embedding, dims, updated_at)
memory_index_state(id, revision)
cache_entries(scope, key, value_json, blob, expires_at, updated_at)
```

La ricerca futura puo aggiungere tabelle FTS senza modificare le tabelle canoniche degli eventi:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

I valori grandi dovrebbero usare colonne `blob`, non codifica di stringhe JSON. Mantieni `value_json` per piccoli dati strutturati che devono restare ispezionabili con normali strumenti SQLite.

`agent_databases` e il registro canonico per questo ramo. Non aggiungere una tabella `agents` finche non esiste un vero proprietario dei record degli agenti; la configurazione degli agenti resta in `openclaw.json`.

## Forma della migrazione di doctor

Il comando doctor dovrebbe chiamare un singolo passaggio di migrazione esplicito, rendicontabile e sicuro da rieseguire:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` invoca l'implementazione della migrazione dello stato dopo il normale preflight della configurazione e crea un backup verificato prima dell'importazione. L'avvio del runtime e `openclaw migrate` non devono importare file di stato OpenClaw legacy.

Proprieta della migrazione:

- Un passaggio di migrazione individua tutte le sorgenti di file legacy e produce un piano prima di modificare qualsiasi cosa.
- Doctor crea un archivio di backup pre-migrazione verificato prima di importare i file legacy.
- Le importazioni sono idempotenti e indicizzate per percorso sorgente, mtime, dimensione, hash e tabella di destinazione.
- I file sorgente importati correttamente vengono rimossi o archiviati dopo il commit del database di destinazione.
- Le importazioni non riuscite lasciano la sorgente intatta e registrano un avviso in `migration_runs`.
- Il codice di runtime legge solo SQLite dopo che la migrazione esiste.
- Non e richiesto alcun percorso di downgrade/esportazione verso file di runtime.

## Inventario della migrazione

Sposta questi elementi nel database globale:

- Le scritture runtime del registro delle attività ora usano il database condiviso; l'importatore sidecar non distribuito
  `tasks/runs.sqlite` è stato eliminato. I salvataggi degli snapshot eseguono upsert per id attività
  ed eliminano solo le righe di attività/consegna mancanti.
- Le scritture runtime di Task Flow ora usano il database condiviso; l'importatore sidecar non distribuito
  `tasks/flows/registry.sqlite` è stato eliminato. I salvataggi degli snapshot
  eseguono upsert per id flusso ed eliminano solo le righe di flusso mancanti.
- Le scritture runtime dello stato dei Plugin ora usano il database condiviso; l'importatore sidecar non distribuito
  `plugin-state/state.sqlite` è stato eliminato.
- La ricerca di memoria integrata non usa più come impostazione predefinita `memory/<agentId>.sqlite`; le sue
  tabelle indice risiedono nel database dell'agente proprietario, e l'adesione esplicita al sidecar
  `memorySearch.store.path` è stata ritirata nella migrazione della configurazione di doctor.
- La reindicizzazione della memoria integrata reimposta solo le tabelle di proprietà della memoria nel database dell'agente.
  Non deve sostituire l'intero file SQLite, perché lo stesso database possiede
  sessioni, trascrizioni, righe VFS, artefatti e cache runtime.
- Registri dei container/browser sandbox da JSON monolitico e frammentato. Le scritture runtime
  ora usano il database condiviso; l'importazione JSON legacy rimane.
- Le definizioni dei job Cron, lo stato di pianificazione e la cronologia delle esecuzioni ora usano SQLite condiviso;
  doctor importa/rimuove i file legacy `jobs.json`, `jobs-state.json` e
  `cron/runs/*.jsonl`
- Identità/autenticazione del dispositivo, push, controllo aggiornamenti, commitment, cache dei modelli OpenRouter,
  indice dei Plugin installati e associazioni dell'app-server
- I record di associazione e bootstrap dispositivo/nodo ora usano tabelle SQLite tipizzate
- I sottoscrittori delle notifiche device-pair e i marcatori delle richieste consegnate ora usano la tabella
  plugin-state SQLite condivisa invece di `device-pair-notify.json`.
- I record delle chiamate vocali ora usano la tabella plugin-state SQLite condivisa nello
  spazio dei nomi `voice-call` / `calls` invece di `calls.jsonl`; la CLI del Plugin
  segue e riassume la cronologia delle chiamate supportata da SQLite.
- Le sessioni Gateway QQBot, i record degli utenti noti e la cache delle citazioni ref-index ora usano
  lo stato Plugin SQLite negli spazi dei nomi `qqbot` (`sessions`, `known-users`,
  `ref-index`) invece di `session-*.json`, `known-users.json` e
  `ref-index.jsonl`; la migrazione doctor/setup di QQBot importa e rimuove i
  file legacy.
- Le preferenze del selettore di modelli Discord, gli hash di distribuzione dei comandi e le associazioni dei thread
  ora usano lo stato Plugin SQLite negli spazi dei nomi `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  invece di `model-picker-preferences.json`, `command-deploy-cache.json` e
  `thread-bindings.json`; la migrazione doctor/setup di Discord importa e
  rimuove i file legacy.
- I cursori di recupero BlueBubbles e i marcatori di deduplicazione in ingresso ora usano lo stato Plugin SQLite
  negli spazi dei nomi `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  invece di `bluebubbles/catchup/*.json` e
  `bluebubbles/inbound-dedupe/*.json`; la migrazione doctor/setup di BlueBubbles
  importa e rimuove i file legacy.
- Gli offset degli aggiornamenti Telegram, le voci della cache degli sticker, le voci della cache dei messaggi della catena di risposte,
  le voci della cache dei messaggi inviati, le voci della cache dei nomi degli argomenti e le
  associazioni dei thread ora usano lo stato Plugin SQLite negli spazi dei nomi `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) invece di `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` e
  `thread-bindings-*.json`; la migrazione doctor/setup di Telegram importa e
  rimuove i file legacy.
- I cursori di recupero iMessage, le mappature degli short-id delle risposte e le righe di deduplicazione sent-echo
  ora usano lo stato Plugin SQLite negli spazi dei nomi `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) invece di `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` e `imessage/sent-echoes.jsonl`; la migrazione doctor/setup di iMessage
  importa e rimuove i file legacy.
- Le conversazioni, i sondaggi, i token SSO e gli apprendimenti del feedback di Microsoft Teams ora
  usano spazi dei nomi dello stato Plugin SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) invece di `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` e `*.learnings.json`; la
  migrazione doctor/setup di Microsoft Teams importa e archivia i file legacy.
  I caricamenti in sospeso sono una cache SQLite di breve durata e i vecchi file di cache JSON
  non vengono migrati.
- La cache di sincronizzazione Matrix, i metadati di archiviazione, le associazioni dei thread, i marcatori di deduplicazione in ingresso,
  lo stato di cooldown della verifica all'avvio, le credenziali, le chiavi di recupero e gli snapshot crittografici
  IndexedDB dell'SDK ora usano spazi dei nomi di stato/blob Plugin SQLite sotto
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  invece di `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` e `crypto-idb-snapshot.json`; la migrazione doctor/setup di Matrix
  importa e rimuove quei file legacy dalle radici di archiviazione Matrix con ambito account.
- I cursori del bus Nostr e lo stato di pubblicazione del profilo ora usano lo stato Plugin SQLite negli
  spazi dei nomi `nostr` (`bus-state`, `profile-state`) invece di
  `bus-state-*.json` e `profile-state-*.json`; la migrazione doctor/setup di Nostr
  importa e rimuove i file legacy.
- Gli interruttori di sessione di Active Memory ora usano lo stato Plugin SQLite sotto
  `active-memory/session-toggles` invece di `session-toggles.json`.
- Le code delle proposte e i contatori delle revisioni di Skill Workshop ora usano lo stato Plugin SQLite
  sotto `skill-workshop/proposals` e `skill-workshop/reviews` invece dei file
  `skill-workshop/<workspace>.json` per workspace.
- Le code di consegna in uscita e di consegna sessione ora condividono la tabella SQLite globale
  `delivery_queue_entries` sotto nomi di coda separati
  (`outbound-delivery`, `session-delivery`) invece dei file durevoli
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` e
  `session-delivery-queue/*.json`. Il passaggio doctor legacy-state importa
  righe in sospeso e non riuscite, rimuove i marcatori consegnati obsoleti ed elimina i vecchi
  file JSON dopo l'importazione. I campi di instradamento rapido e tentativi sono colonne tipizzate; il
  payload JSON viene conservato solo per replay/debug.
- I lease dei processi ACPX ora usano lo stato Plugin SQLite sotto `acpx/process-leases`
  invece di `process-leases.json`.
- Metadati delle esecuzioni di backup e migrazione

Sposta questi nei database degli agenti:

- Radici delle sessioni agente e payload session-entry con forma compatibile. Completato per
  le scritture runtime: i metadati rapidi delle sessioni sono interrogabili in `sessions`, mentre il
  payload completo legacy-shaped `SessionEntry` rimane in `session_entries`.
- Eventi di trascrizione degli agenti. Completato per le scritture runtime.
- Checkpoint di Compaction e snapshot delle trascrizioni. Completato per le scritture runtime:
  le copie delle trascrizioni dei checkpoint sono righe di trascrizione SQLite e i metadati dei checkpoint
  sono registrati in `transcript_snapshots`. Gli helper dei checkpoint Gateway
  ora nominano questi valori come snapshot delle trascrizioni invece che come file sorgente.
- Spazi dei nomi scratch/workspace VFS degli agenti. Completato per le scritture VFS runtime.
- Payload degli allegati dei subagenti. Completato per le scritture runtime: sono voci seed VFS SQLite
  e mai file workspace durevoli.
- Artefatti degli strumenti. Completato per le scritture runtime.
- Artefatti delle esecuzioni. Completato per le scritture runtime dei worker tramite la tabella per agente
  `run_artifacts`.
- Cache runtime locali all'agente. Completato per le scritture cache con ambito runtime dei worker tramite
  la tabella per agente `cache_entries`. Le cache dei modelli a livello Gateway restano nel
  database globale a meno che non diventino specifiche dell'agente.
- Log degli stream padre ACP. Completato per le scritture runtime.
- Sessioni del registro di replay ACP. Completato per le scritture runtime tramite
  `acp_replay_sessions` e `acp_replay_events`; il file legacy `acp/event-ledger.json`
  rimane solo come input di doctor.
- Metadati delle sessioni ACP. Completato per le scritture runtime tramite `acp_sessions`; i blocchi legacy
  `entry.acp` in `sessions.json` sono solo input di migrazione doctor.
- Sidecar delle traiettorie quando non sono file di esportazione espliciti. Completato per le scritture
  runtime: la cattura delle traiettorie scrive righe `trajectory_runtime_events` nel database dell'agente
  e replica gli artefatti con ambito esecuzione in SQLite. I sidecar legacy sono solo input di importazione doctor;
  l'esportazione può materializzare nuovi output JSONL per bundle di supporto
  ma non legge né migra vecchi sidecar di traiettorie/trascrizioni a runtime.
  La cattura runtime delle traiettorie espone l'ambito SQLite; gli helper dei percorsi JSONL sono
  isolati al supporto esportazione/debug e non sono riesportati dal modulo runtime.
  I metadati delle traiettorie dell'embedded-runner registrano l'identità `{agentId, sessionId, sessionKey}`
  invece di rendere persistente un localizzatore di trascrizioni.

Mantieni questi su file per ora:

- `openclaw.json`
- file di credenziali del provider o della CLI
- manifest di Plugin/pacchetto
- workspace utente e repository Git quando è selezionata la modalità disco
- log destinati al tailing dell'operatore, a meno che una superficie di log specifica venga spostata

## Piano di migrazione

### Fase 0: congelare il confine

Rendi esplicito il confine dello stato durevole prima di spostare altre righe:

- Aggiungi una tabella `migration_runs` al database globale.
  Completato per i report di esecuzione della migrazione dello stato legacy.
- Aggiungi un unico servizio di migrazione dello stato da file a database di proprietà di doctor.
  Completato: `openclaw doctor --fix` usa l'implementazione della migrazione legacy-state.
- Rendi `plan` in sola lettura e fai sì che `apply` crei un backup, importi, verifichi e
  poi elimini o metta in quarantena i vecchi file.
  Completato: doctor crea un backup pre-migrazione verificato, passa il percorso del backup
  a `migration_runs` e riutilizza i percorsi di importazione/rimozione.
- Aggiungi divieti statici in modo che il nuovo codice runtime non possa scrivere file di stato legacy mentre
  il codice di migrazione e i test possono ancora seminarli/leggerli.
  Completato per gli store legacy attualmente migrati; la protezione scansiona anche i test
  annidati per contratti vietati dei localizzatori di trascrizioni runtime.

### Fase 1: completare il piano di controllo globale

Mantieni lo stato di coordinamento condiviso in `state/openclaw.sqlite`:

- Agenti e registro dei database degli agenti
- Ledger di Task e Task Flow
- Stato dei Plugin
- Registro dei container/browser sandbox
- Cronologia delle esecuzioni di Cron/scheduler
- Associazione, dispositivo, push, controllo aggiornamenti, TUI, cache OpenRouter/modelli e altro
  piccolo stato runtime con ambito Gateway
- Metadati di backup e migrazione
- Byte degli allegati multimediali Gateway. Completato per le scritture runtime; i percorsi file diretti
  sono materializzazioni temporanee per compatibilità con i mittenti dei canali e lo staging sandbox.
  Le allowlist runtime accettano percorsi di materializzazione SQLite, non radici media legacy
  di stato/configurazione. Doctor importa i file media legacy in
  `media_blobs` e rimuove i file sorgente dopo scritture di riga riuscite.
- Sessioni, eventi e blob payload di cattura del proxy di debug. Completato: le catture vivono
  nel DB di stato condiviso e si aprono tramite bootstrap, schema,
  WAL e impostazioni busy-timeout del DB di stato condiviso. I byte dei payload sono compressi con gzip in
  `capture_blobs.data`; non esiste alcun override DB sidecar runtime del proxy di debug,
  directory blob o target schema/codegen generato solo per proxy-capture.
  La migrazione doctor/avvio importa le righe `debug-proxy/capture.sqlite` distribuite
  e i blob payload referenziati, inclusi gli override di ambiente legacy DB/blob attivi,
  poi archivia quelle sorgenti lasciando intatti i certificati CA.

Questa fase elimina anche opener sidecar duplicati, helper dei permessi, configurazione WAL,
potatura del filesystem e writer di compatibilità da quei sottosistemi.

### Fase 2: introdurre database per agente

Crea un database per ogni agente e registralo dal DB globale:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

La riga globale `agent_databases` memorizza il percorso, la versione dello schema, il timestamp
dell'ultimo avvistamento e metadati di base su dimensione/integrità. Il codice runtime chiede
al registro il DB dell'agente invece di derivare direttamente i percorsi file.

Il DB dell'agente possiede:

- `sessions` come radice canonica delle sessioni, con `session_entries` come
  tabella dei payload con forma di compatibilità collegata a quella radice, e
  `session_routes` come lookup univoco del `session_key` attivo
- `conversations` e `session_conversations` come identità di instradamento del provider
  normalizzata collegata alle sessioni
- `transcript_events`
- snapshot delle trascrizioni e checkpoint di Compaction. Fatto per le scritture runtime.
- `vfs_entries`
- `tool_artifacts` e artefatti di esecuzione
- righe runtime/cache locali all'agente. Fatto per le cache con ambito worker.
- eventi dello stream padre ACP
- eventi runtime della traiettoria quando non sono artefatti di esportazione espliciti

### Fase 3: Sostituire le API dello store delle sessioni

Fatto per il runtime. La superficie dello store delle sessioni a forma di file non è un contratto
runtime attivo:

- Il runtime non chiama più `loadSessionStore(storePath)` né tratta `storePath` come
  identità della sessione.
- Le operazioni runtime sulle righe sono `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` e `listSessionEntries`.
- Gli helper di riscrittura dell'intero store, i writer su file, i test delle code, la potatura degli alias e
  i parametri di eliminazione delle chiavi legacy sono spariti dal runtime.
- Gli export di compatibilità deprecati del pacchetto radice adattano ancora i percorsi
  canonici `sessions.json` sulle API SQLite per righe.
- Il parsing di `sessions.json` rimane solo nel codice di migrazione/import di doctor e
  nei test di doctor.
- Il fallback del ciclo di vita runtime legge gli header delle trascrizioni SQLite, non le prime
  righe JSONL.

Continuare a eliminare tutto ciò che reintroduce parametri di lock dei file,
vocabolario di potatura/troncamento come manutenzione dei file, identità basata sul percorso dello store, o test
la cui unica asserzione è la persistenza JSON.

### Fase 4: Spostare trascrizioni, stream ACP, traiettorie e VFS

Rendere nativo su database ogni stream di dati dell'agente:

- Le scritture append delle trascrizioni passano attraverso una transazione SQLite che garantisce
  l'header della sessione, controlla l'idempotenza dei messaggi, seleziona la coda padre, inserisce
  in `transcript_events` e registra metadati di identità interrogabili in
  `transcript_event_identities`. Fatto per gli append diretti dei messaggi di trascrizione e
  per i normali append persistiti di `TranscriptSessionManager`; le operazioni esplicite sui branch
  mantengono la loro scelta esplicita del padre e scrivono comunque righe SQLite
  senza derivare alcun localizzatore di file.
- I log dello stream padre ACP diventano righe, non file `.acp-stream.jsonl`. Fatto.
- La configurazione dello spawn ACP non persiste più i percorsi JSONL delle trascrizioni. Fatto.
- La cattura runtime delle traiettorie scrive direttamente righe/artefatti evento. Il comando esplicito
  di supporto/esportazione può ancora produrre artefatti JSONL del bundle di supporto come
  formato di esportazione, ma l'esportazione della sessione non ricrea JSONL di sessione. Fatto.
- Le workspace su disco rimangono su disco quando configurate in modalità disco.
- Lo scratch VFS e la modalità sperimentale workspace solo VFS usano il DB dell'agente.

La migrazione importa i vecchi file JSONL una sola volta, registra conteggi/hash in
`migration_runs` e rimuove i file importati dopo i controlli di integrità.

### Fase 5: Backup, ripristino, Vacuum e verifica

I backup rimangono un unico file archivio:

- Eseguire checkpoint di ogni database globale e agente.
- Creare snapshot di ogni DB con semantica di backup SQLite o `VACUUM INTO`.
- Archiviare snapshot DB compatti, configurazione, credenziali esterne ed esportazioni
  workspace richieste.
- Omettere i file live grezzi `*.sqlite-wal` e `*.sqlite-shm`.
- Verificare aprendo ogni snapshot DB ed eseguendo `PRAGMA integrity_check`.
  `openclaw backup create` esegue questa verifica dell'archivio per impostazione predefinita;
  `--no-verify` salta solo il passaggio di verifica post-scrittura dell'archivio, non il controllo
  di integrità della creazione dello snapshot.
- Il ripristino copia gli snapshot nei loro percorsi di destinazione. Questo branch reimposta il
  layout SQLite non distribuito a `user_version = 1`; le future modifiche di schema distribuite
  potranno aggiungere migrazioni esplicite quando saranno necessarie.

### Fase 6: Runtime dei worker

Mantenere sperimentale la modalità worker mentre approda la separazione del database:

- I worker ricevono id agente, id esecuzione, modalità filesystem e identità del registro DB.
- Ogni worker apre la propria connessione SQLite.
- Il padre mantiene autorità su consegna dei canali, approvazioni, configurazione e annullamento.
- Iniziare con un worker per esecuzione attiva; aggiungere pooling solo dopo che ciclo di vita e
  proprietà delle connessioni DB sono stabili.

### Fase 7: Eliminare il vecchio mondo

Fatto per la gestione runtime delle sessioni. Il vecchio mondo è consentito solo come input
esplicito di doctor o output di supporto/esportazione:

- Nessuna scrittura runtime di `sessions.json`, JSONL delle trascrizioni, JSON del registro sandbox, SQLite
  sidecar dei task o SQLite sidecar dello stato Plugin.
- Nessuna potatura di file JSON/sessione, troncamento di trascrizioni su file, lock dei file di sessione
  o test di sessione a forma di lock.
- Nessun export di compatibilità runtime il cui scopo sia mantenere aggiornati i vecchi file di sessione.
- Gli export di supporto espliciti rimangono formati di archivio/materializzazione richiesti dall'utente
  e non devono reintrodurre nomi di file nell'identità runtime.

## Backup e ripristino

I backup dovrebbero essere un unico file archivio, ma la cattura del database dovrebbe essere
nativa SQLite:

1. Fermare l'attività di scrittura a lungo termine o entrare in una breve barriera di backup.
2. Per ogni database globale e agente, eseguire un checkpoint.
3. Creare uno snapshot di ogni database usando la semantica di backup SQLite o `VACUUM INTO` in una
   directory temporanea di backup.
4. Archiviare gli snapshot compattati dei database, il file di configurazione, la directory delle credenziali,
   le workspace selezionate e un manifest.
5. Verificare l'archivio aprendo ogni snapshot SQLite incluso ed eseguendo
   `PRAGMA integrity_check`.
   `openclaw backup create` lo fa per impostazione predefinita; `--no-verify` serve solo a
   saltare intenzionalmente il passaggio di verifica post-scrittura dell'archivio.

Non affidarsi a copie live grezze di `*.sqlite`, `*.sqlite-wal` e `*.sqlite-shm` come
formato di backup primario. Il manifest dell'archivio dovrebbe registrare ruolo del database,
id agente, versione dello schema, percorso sorgente, percorso dello snapshot, dimensione in byte e stato di
integrità.

Il ripristino dovrebbe ricostruire i file del database globale e dei database agente dagli
snapshot dell'archivio. Poiché il layout SQLite non è ancora stato distribuito, questo refactor
mantiene solo lo schema versione 1 più l'import da file a database di doctor. Il comando di ripristino
valida prima l'archivio, poi sostituisce ogni asset del manifest dal payload estratto verificato.

## Piano di refactor del runtime

1. Aggiungere API del registro database.
   - Risolvere i percorsi del DB globale e dei DB per agente.
   - Mantenere gli schemi non distribuiti a `user_version = 1`; non aggiungere codice runner di
     migrazione dello schema finché uno schema distribuito non lo richiede.
   - Aggiungere helper di chiusura/checkpoint/integrità usati da test, backup e doctor.

2. Collassare gli store SQLite sidecar.
   - Spostare le tabelle di stato Plugin nel database globale. Fatto per le scritture runtime;
     l'importer del sidecar legacy non distribuito è eliminato.
   - Spostare le tabelle del registro task nel database globale. Fatto per le scritture runtime;
     l'importer del sidecar legacy non distribuito è eliminato.
   - Spostare le tabelle Task Flow nel database globale. Fatto per le scritture runtime;
     l'importer del sidecar legacy non distribuito è eliminato.
   - Spostare le tabelle integrate di ricerca memoria in ogni database agente. Fatto; il
     `memorySearch.store.path` personalizzato esplicito ora viene rimosso dalla migrazione della configurazione doctor.
     La reindicizzazione completa viene eseguita in-place solo sulle tabelle di memoria; il vecchio percorso di swap
     dell'intero file e l'helper di swap dell'indice sidecar sono eliminati.
   - Eliminare opener di database duplicati, configurazione WAL, helper dei permessi e
     percorsi di chiusura da quei sottosistemi.

3. Spostare le tabelle di proprietà dell'agente nei database per agente.
   - Creare il DB agente on demand tramite il registro del database globale. Fatto.
   - Spostare entry di sessione runtime, eventi di trascrizione, righe VFS e artefatti degli strumenti
     nei DB agente. Fatto.
   - Non migrare entry di sessione, eventi di trascrizione, righe VFS o artefatti degli strumenti
     branch-local nel DB condiviso; quel layout non è mai stato distribuito. Mantenere solo
     l'import legacy da file a database in doctor.

4. Sostituire le API dello store delle sessioni.
   - Rimuovere `storePath` come identità runtime. Fatto per runtime e protetto da
     `check:database-first-legacy-stores`: metadati di sessione, aggiornamenti di route,
     persistenza dei comandi, pulizia sessione CLI, anteprime di ragionamento Feishu,
     persistenza dello stato della trascrizione, profondità dei subagent, override di sessione del profilo auth,
     logica parent-fork e ispezione QA-lab ora risolvono il
     database dalle chiavi canoniche agente/sessione.
     Le risposte degli elenchi sessione Gateway/TUI/UI/macOS ora espongono `databasePath`
     invece del `path` legacy; le superfici debug macOS mostrano il database per agente
     come stato in sola lettura invece di scrivere la configurazione `session.store`.
     `/status`, esportazione della traiettoria guidata da chat e proxy delle dipendenze CLI non
     propagano più percorsi store legacy; il fallback di utilizzo della trascrizione legge
     SQLite per identità agente/sessione. I test runtime e bridge non espongono più
     `storePath`; gli input doctor/migrazione possiedono quel nome di campo legacy.
     Il caricamento combinato delle sessioni Gateway non ha più un branch runtime speciale per
     valori `session.store` non templated; aggrega righe SQLite per agente.
     La lane doctor del lock sessione legacy e il suo helper di pulizia `.jsonl.lock`
     sono stati rimossi; SQLite è ora il confine di concorrenza delle sessioni.
     I call site runtime hot usano nomi di helper orientati alle righe come
     `resolveSessionRowEntry`; il vecchio alias di compatibilità `resolveSessionStoreEntry`
     è stato rimosso dal runtime e dagli export SDK Plugin.

- Usare operazioni su righe `{ agentId, sessionKey }`.
  Fatto: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` e `listSessionEntries` sono API SQLite-first che non
  richiedono un percorso dello store sessione. Riepilogo stato, stato agente locale, salute
  e comando di elenco `openclaw sessions` ora leggono direttamente righe per agente
  e mostrano percorsi dei database SQLite per agente invece di percorsi `sessions.json`.
- Sostituire delete/insert dell'intero store con `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` e query SQL di pulizia.
  Fatto per il runtime: gli hot path ora usano API su righe e patch di righe ritentate su conflitto;
  gli helper rimanenti di import/sostituzione dell'intero store sono limitati al codice di importazione
  migrazione e ai test del backend SQLite.
  - Eliminare `store-writer.ts` e i test della coda writer. Fatto.
  - Eliminare potatura runtime delle chiavi legacy e parametri alias-delete dagli upsert/patch
    delle righe sessione. Fatto.

5. Eliminare il comportamento runtime del registro JSON.
   - Rendere letture e scritture del registro sandbox solo SQLite. Fatto.
   - Importare JSON monolitico e sharded solo dal passaggio di migrazione. Fatto.
   - Rimuovere lock del registro sharded e scritture JSON. Fatto.

- Mantenere una tabella di registro tipizzata invece di archiviare righe di registro come JSON opaco
  generico se la forma rimane stato operativo hot-path. Fatto.

6. Eliminare mutazioni di sessione a forma di lock file.
   - Fatto per la creazione lock runtime e le API lock runtime.
   - La lane autonoma di pulizia doctor legacy `.jsonl.lock` è rimossa.
   - `session.writeLock` è configurazione legacy migrata da doctor, non un'impostazione runtime tipizzata.
   - L'integrità dello stato non ha più un percorso separato di potatura dei file di trascrizione orfani;
     la migrazione doctor importa/rimuove le sorgenti JSONL legacy in un unico punto.
   - La coordinazione singleton Gateway usa righe SQLite tipizzate `state_leases` sotto
     `gateway_locks` e non espone più una superficie di directory di lock file.
   - La persistenza dedupe generica dell'SDK Plugin non usa più lock file o file JSON;
     scrive righe SQLite condivise dello stato Plugin. Fatto.
   - La coordinazione embed QMD usa un lease di stato SQLite invece di
     `qmd/embed.lock`. Fatto.

7. Rendere i worker consapevoli del database.
   - I worker aprono le proprie connessioni SQLite.
   - Il padre possiede consegna, callback dei canali e configurazione.
   - Il worker riceve id agente, id esecuzione, modalità filesystem e identità del registro
     DB, non handle live.
   - `vfs-only` rimane sperimentale e usa il database agente come radice di storage.
   - Mantenere prima un worker per esecuzione attiva. Il pooling può aspettare finché la durata
     delle connessioni DB e il comportamento di annullamento non saranno ordinari.

8. Integrazione del backup.
   - Insegna al backup a creare snapshot dei database globali e degli agenti tramite backup SQLite o
     `VACUUM INTO`. Fatto per i file `*.sqlite` scoperti sotto l'asset di stato.
   - Aggiungi la verifica del backup per l'integrità SQLite e la versione dello schema. Fatto per
     la creazione del backup e i controlli di integrità predefiniti per la verifica dell'archivio.
   - Registra i metadati dell'esecuzione del backup in SQLite. Fatto tramite la tabella condivisa
     `backup_runs` con percorso dell'archivio, stato e JSON del manifest.
   - Aggiungi il ripristino da snapshot di archivio verificati. Fatto: `openclaw backup
restore` valida prima dell'estrazione, usa il manifest normalizzato del verificatore,
     supporta `--dry-run` e richiede `--yes` prima di sostituire
     i percorsi sorgente registrati.
   - Includi l'esportazione VFS/workspace solo quando richiesta; non esportare gli elementi interni
     della sessione come JSON o JSONL.

9. Elimina test e codice obsoleti. Fatto per le superfici note delle sessioni runtime.

- Rimuovi i test che verificano la creazione runtime di `sessions.json` o file transcript
  JSONL. Fatto per core session store, chat, eventi transcript Gateway,
  preview, lifecycle, aggiornamenti command session-entry, reset/trace auto-reply e
  fixture memory-core dreaming, routing target approval, riparazione transcript di sessione,
  riparazione permessi di sicurezza, esportazione traiettoria ed esportazione sessione.
  I test transcript Active-memory ora verificano gli scope SQLite e nessuna creazione di file JSONL
  temporanei o persistiti.
  La vecchia regressione heartbeat di potatura dei transcript è stata rimossa perché
  il runtime non tronca più i transcript JSONL.
  I test dello strumento agent session-list non modellano più i percorsi legacy `sessions.json`
  come forma della risposta Gateway; i test app/UI/macOS usano `databasePath`.
  I test di utilizzo transcript `/status` ora seminano direttamente righe transcript SQLite
  invece di scrivere file JSONL.
  I test del lifecycle delle sessioni Gateway ora usano direttamente helper di seeding transcript
  SQLite; la vecchia forma fixture session-file a riga singola è scomparsa dalla copertura
  di reset ed eliminazione.
  `sessions.delete` non restituisce più un campo dell'era file `archived: []`; l'eliminazione
  riporta solo il risultato della mutazione della riga. Anche la vecchia opzione `deleteTranscript` è
  scomparsa: eliminare una sessione rimuove la root canonica `sessions` e lascia che
  SQLite propaghi a cascata la rimozione delle righe transcript, snapshot e traiettoria di proprietà della sessione, quindi nessun
  chiamante può lasciare transcript orfani o dimenticare un ramo di pulizia.
  I test di cattura traiettoria context-engine ora leggono righe `trajectory_runtime_events`
  da un database agente isolato invece di leggere
  `session.trajectory.jsonl`.
  Gli script seed del canale Docker MCP ora seminano direttamente righe SQLite. Le scritture dirette di
  `sessions.json` sono limitate alle fixture doctor.
  Tool Search Gateway E2E legge le prove tool-call dalle righe transcript SQLite
  invece di scandire file `agents/<agentId>/sessions/*.jsonl`.
  Gli eventi host memory-core e le righe scratch session-corpus ora vivono nello stato Plugin
  SQLite condiviso; `events.jsonl` e `session-corpus/*.txt` sono solo input di migrazione
  doctor legacy. Le righe attive usano percorsi virtuali `memory/session-ingestion/`,
  non `.dreams/session-corpus`. Il vecchio modulo di riparazione memory-core dreaming
  e i suoi test CLI/Gateway sono stati rimossi perché il runtime non
  possiede più la riparazione dell'archivio file per quel corpus. I test memory-core
  bridge/public-artifact non espongono più `.dreams/events.jsonl`; usano
  il nome dell'artefatto JSON virtuale basato su SQLite.
  La documentazione di test SDK/Codex pubblica ora parla di stato sessione SQLite invece che di file
  sessione, e l'esempio channel-turn non espone più un argomento `storePath`.
  Lo stato di sincronizzazione Matrix ora usa direttamente lo store plugin-state SQLite. I contratti attivi
  client/runtime passano una root di archiviazione account, non un percorso `bot-storage.json`,
  e doctor importa il `bot-storage.json` legacy in SQLite prima di eliminare
  la sorgente. Gli scenari QA Matrix di riavvio/distruttivi ora modificano direttamente la riga di sincronizzazione SQLite
  invece di creare o eliminare file `bot-storage.json` fittizi, e
  il substrato E2EE passa una root sync-store invece di un percorso
  `sync-store.json` fittizio.
  La selezione storage-root di Matrix non assegna più punteggi alle root in base a file JSON legacy di sync/thread;
  usa metadati root durevoli più stato crypto reale.
  La suite di test del backend sessioni SQLite runtime non fabbrica più un
  `sessions.json`; le fixture sorgente legacy ora vivono nei test doctor
  che le importano.
  I test sessione Gateway non espongono più un helper `createSessionStoreDir` o
  una configurazione inutilizzata di percorso session-store temporaneo; le directory fixture sono esplicite e la configurazione diretta
  delle righe usa la denominazione session-row SQLite.
  La copertura del parser session-store JSON5 solo doctor è stata spostata fuori dai test infra e
  dentro i test di migrazione doctor, quindi le suite di test runtime non possiedono più il parsing legacy
  dei file sessione.
  I test runtime SSO/pending-upload di Microsoft Teams non portano più fixture o parser
  sidecar JSON; il parsing legacy dei token SSO vive solo nel modulo di migrazione del Plugin.
  I test Telegram non seminano più percorsi store `/tmp/*.json` fittizi;
  reimpostano direttamente la cache messaggi basata su SQLite. L'helper generico
  OpenClaw test-state non espone più uno writer legacy `auth-profiles.json`;
  i test di migrazione auth doctor possiedono localmente quella fixture.
  I test runtime per puntatori last-session TUI, approval exec, toggle active-memory,
  dedupe/verifica startup Matrix, sincronizzazione sorgente Memory Wiki,
  binding current-conversation, autenticazione onboarding e import secret Hermes non
  fabbricano più vecchi file sidecar né verificano che vecchi nomi file siano assenti. Dimostrano
  il comportamento tramite righe SQLite e API di store pubbliche; i test doctor/migration
  sono l'unico posto a cui appartengono i nomi file sorgente legacy.
  I test runtime per pairing device/node, channel allowFrom, intent di riavvio,
  handoff di riavvio, voci della coda di consegna sessione, salute config, cache iMessage,
  cron job, intestazioni transcript PI, registri subagent e allegati immagine gestiti
  non creano più nemmeno file JSON/JSONL ritirati solo per dimostrare
  che sono ignorati o assenti.
  Il recupero overflow PI non ha più un fallback di riscrittura/troncamento SessionManager:
  il troncamento tool-result e le riscritture transcript context-engine modificano
  righe transcript SQLite, poi aggiornano lo stato del prompt attivo dal database.
  Gli append dei messaggi SessionManager persistiti delegano all'helper atomico di append transcript SQLite
  per la selezione del parent e l'idempotenza. Anche gli append normali
  metadata/custom entry selezionano il parent corrente dentro SQLite, quindi
  le istanze manager obsolete non resuscitano race parent-chain precedenti a SQLite.
  La pulizia sintetica della coda PI per precheck mid-turn e `sessions_yield` ora
  ritaglia direttamente lo stato transcript SQLite; il vecchio bridge di rimozione coda
  SessionManager e i suoi test sono eliminati.
  Anche la cattura checkpoint Compaction crea snapshot solo da SQLite; i chiamanti non
  passano più un SessionManager live come sorgente transcript alternativa.
- Mantieni i test che seminano file legacy solo per la migrazione.
- La prova con file JSON è stata sostituita con prova tramite righe SQL per le superfici runtime
  attive.

- Aggiungi divieti statici per scritture runtime verso percorsi JSON legacy di sessione/cache.
  Fatto per la guardia del repo.

10. Rendi verificabile il report di migrazione.
    - Registra le esecuzioni di migrazione in SQLite con timestamp di inizio/fine, percorsi
      sorgente, hash sorgente, conteggi, avvisi e percorso backup.
      Fatto: le esecuzioni di migrazione legacy-state ora persistono un report `migration_runs`
      con inventario percorso/tabella sorgente, SHA-256 del file sorgente, dimensioni,
      conteggi record, avvisi e percorso backup.
      Fatto: le esecuzioni di migrazione legacy-state persistono anche righe `migration_sources`
      per audit a livello sorgente e future decisioni di skip/backfill.
    - Rendi apply idempotente. La riesecuzione dopo un'importazione parziale dovrebbe
      saltare una sorgente già importata o fare merge tramite chiave stabile.
      Fatto: indici sessione, transcript, code di consegna, stato Plugin, registri task
      e righe SQLite globali di proprietà dell'agente importano tramite chiavi stabili o
      semantica upsert/replace, quindi le riesecuzioni fanno merge senza duplicare righe
      durevoli.
    - Le importazioni fallite devono lasciare il file sorgente originale al suo posto.
      Fatto: le importazioni transcript fallite ora lasciano la sorgente JSONL originale
      nel percorso rilevato, e `migration_sources` registra la sorgente come
      `warning` con `removed_source=0` per la prossima esecuzione doctor.

## Regole di prestazione

- Una connessione per thread/processo va bene; non condividere handle tra
  worker.
- Usa WAL, `foreign_keys=ON`, un busy timeout di 30s e transazioni di scrittura brevi
  `BEGIN IMMEDIATE`.
- Mantieni sincroni gli helper delle transazioni di scrittura a meno che/fino a quando un'API di transazione async
  non aggiunge semantiche esplicite di mutex/backpressure.
- Mantieni piccole e transazionali le scritture di consegna parent.
- Evita riscritture dell'intero store; usa upsert/delete a livello di riga.
- Aggiungi indici per percorsi list-by-agent, list-by-session, updated-at, run id ed
  expiration prima di spostare codice caldo.
- Archivia artefatti grandi, media e vettori come BLOB o righe BLOB chunked, non
  JSON base64 o array numerici.
- Mantieni piccole e con scope le voci opache plugin-state.
- Aggiungi pulizia SQL per TTL/expiration invece di pruning del filesystem.
  Fatto per gli store runtime di proprietà del database: media, stato Plugin, blob Plugin,
  dedupe persistente e cache agente scadono tutti tramite righe SQLite. La pulizia
  filesystem restante è limitata a materializzazioni temporanee o comandi di rimozione
  espliciti.

## Divieti statici

Aggiungi un controllo repo che fallisca nuove scritture runtime verso percorsi di stato legacy:

- `sessions.json`
- `*.trajectory.jsonl` eccetto gli output materializzati dei bundle di supporto
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- file di cache di runtime `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- `credentials*.json` e `recovery-key.json` di Matrix
- `cron/runs/*.jsonl`
- `cron/jobs.json`
- `jobs-state.json`
- `device-pair-notify.json`
- `devices/pending.json`
- `devices/paired.json`
- `devices/bootstrap.json`
- `nodes/pending.json`
- `nodes/paired.json`
- `identity/device.json`
- `identity/device-auth.json`
- `push/web-push-subscriptions.json`
- `push/vapid-keys.json`
- `push/apns-registrations.json`
- `process-leases.json`
- `gateway-instance-id`
- `session-toggles.json`
- Memory-core `.dreams/events.jsonl`
- Memory-core `.dreams/session-corpus/`
- Memory-core `.dreams/daily-ingestion.json`
- Memory-core `.dreams/session-ingestion.json`
- Memory-core `.dreams/short-term-recall.json`
- Memory-core `.dreams/phase-signals.json`
- Memory-core `.dreams/short-term-promotion.lock`
- Skill Workshop `skill-workshop/<workspace>.json`
- Skill Workshop `skill-workshop/skill-workshop-review-*.json`
- Nostr `bus-state-*.json`
- Nostr `profile-state-*.json`
- `calls.jsonl`
- `known-users.json`
- `ref-index.jsonl`
- QQBot `session-*.json`
- BlueBubbles `bluebubbles/catchup/*.json`
- BlueBubbles `bluebubbles/inbound-dedupe/*.json`
- Telegram `update-offset-*.json`
- Telegram `sticker-cache.json`
- Telegram `*.telegram-messages.json`
- Telegram `*.telegram-sent-messages.json`
- Telegram `*.telegram-topic-names.json`
- Telegram `thread-bindings-*.json`
- iMessage `catchup/*.json`
- iMessage `reply-cache.jsonl`
- iMessage `sent-echoes.jsonl`
- Microsoft Teams `msteams-conversations.json`
- Microsoft Teams `msteams-polls.json`
- Microsoft Teams `msteams-sso-tokens.json`
- Microsoft Teams `*.learnings.json`
- Matrix `bot-storage.json`
- Matrix `sync-store.json`
- Matrix `thread-bindings.json`
- Matrix `inbound-dedupe.json`
- Matrix `startup-verification.json`
- Matrix `storage-meta.json`
- Matrix `crypto-idb-snapshot.json`
- Discord `model-picker-preferences.json`
- Discord `command-deploy-cache.json`
- file JSON degli shard del registro sandbox
- file JSON del bridge `/tmp` del relay degli hook nativi
- `plugin-state/state.sqlite`
- sidecar di runtime `openclaw-state.sqlite` ad hoc
- `tasks/runs.sqlite`
- `tasks/flows/registry.sqlite`
- `bindings/current-conversations.json`
- `restart-sentinel.json`
- `gateway-restart-intent.json`
- `gateway-supervisor-restart-handoff.json`
- `gateway.<hash>.lock`
- `qmd/embed.lock`
- `commands.log`
- `config-health.json`
- `port-guard.json`
- `settings/voicewake.json`
- `settings/voicewake-routing.json`
- `plugin-binding-approvals.json`
- `plugins/installs.json`
- `audit/file-transfer.jsonl`
- `audit/crestodian.jsonl`
- `crestodian/rescue-pending/*.json`
- `plugins/phone-control/armed.json`
- Memory Wiki `.openclaw-wiki/log.jsonl`
- Memory Wiki `.openclaw-wiki/state.json`
- Memory Wiki `.openclaw-wiki/locks/`
- Memory Wiki `.openclaw-wiki/source-sync.json`
- Memory Wiki `.openclaw-wiki/import-runs/*.json`
- Memory Wiki `.openclaw-wiki/cache/agent-digest.json`
- Memory Wiki `.openclaw-wiki/cache/claims.jsonl`
- ClawHub `.clawhub/lock.json`
- ClawHub `.clawhub/origin.json`
- decorazione del profilo browser `.openclaw-profile-decorated`
- aperture di sessione basate su file `SessionManager.open(...)`
- facciate di elenco delle trascrizioni `SessionManager.listAll(...)` e `TranscriptSessionManager.listAll(...)`
- facciate di fork delle trascrizioni `SessionManager.forkFromSession(...)` e
  `TranscriptSessionManager.forkFromSession(...)`
- facciate di sostituzione delle sessioni mutabili `SessionManager.newSession(...)` e `TranscriptSessionManager.newSession(...)`
- facciate per sessioni ramificate `SessionManager.createBranchedSession(...)` e
  `TranscriptSessionManager.createBranchedSession(...)`

Il divieto deve consentire ai test di creare fixture legacy e al codice di migrazione di
leggere/importare/rimuovere sorgenti di file legacy. I sidecar SQLite non rilasciati restano vietati
e non ottengono autorizzazioni di importazione tramite doctor.

## Criteri di completamento

- Le scritture di dati e cache di runtime vanno nel database SQLite globale o dell'agente.
- Il runtime non scrive più indici di sessione, JSONL di trascrizioni, JSON del registro sandbox,
  SQLite sidecar dei task o SQLite sidecar dello stato dei Plugin. Gli importer SQLite sidecar non rilasciati
  dei task e dello stato dei Plugin vengono eliminati.
- L'importazione di file legacy è riservata a doctor.
- Il backup produce un unico archivio con snapshot SQLite compatti e prova di integrità.
- I worker degli agenti possono essere eseguiti con disco, scratch VFS o storage sperimentale solo VFS.
- I file di configurazione e delle credenziali esplicite restano gli unici file di controllo persistenti
  non basati su database previsti.
- I controlli del repo impediscono di reintrodurre archivi di file di runtime legacy.
