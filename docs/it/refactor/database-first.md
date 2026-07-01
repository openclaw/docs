---
read_when:
    - Spostamento di dati di runtime, cache, trascrizioni, stato delle attività o file di lavoro temporanei di OpenClaw in SQLite
    - Progettare migrazioni doctor da file JSON o JSONL
    - Modifica del comportamento di backup, ripristino, VFS o archiviazione dei worker
    - Rimozione di blocchi di sessione, pruning, troncamento o percorsi di compatibilità JSON
summary: Piano di migrazione per rendere SQLite il livello principale per stato durevole e cache, mantenendo la configurazione basata su file
title: Refactor dello stato orientato al database
x-i18n:
    generated_at: "2026-07-01T20:24:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Refactor dello stato basato prima sul database

## Decisione

Usare un layout SQLite a due livelli:

- Database globale: `~/.openclaw/state/openclaw.sqlite`
- Database agente: un database SQLite per ciascun agente per workspace,
  trascrizione, VFS, artefatti e grande stato runtime per agente di proprietà dell'agente
- La configurazione resta basata su file: `openclaw.json` rimane fuori dal
  database. I profili di autenticazione runtime passano a SQLite; i file di
  credenziali di provider esterni o della CLI restano gestiti dal rispettivo proprietario fuori dal database di OpenClaw.

Il database globale è il database del piano di controllo. Possiede il rilevamento degli agenti,
lo stato condiviso del Gateway, l'abbinamento, lo stato di dispositivi/nodi, i registri di task e flussi, lo stato dei Plugin,
lo stato runtime dello scheduler, i metadati dei backup e lo stato delle migrazioni.

Il database agente è il database del piano dati. Possiede i metadati di sessione dell'agente,
il flusso di eventi della trascrizione, il workspace VFS o namespace scratch, gli artefatti degli strumenti,
gli artefatti di esecuzione e i dati cache locali dell'agente ricercabili/indicizzabili.

Questo offre una vista globale durevole senza forzare grandi workspace degli agenti,
trascrizioni e dati scratch binari nella corsia di scrittura condivisa del Gateway.

## Contratto rigido

Questa migrazione ha una sola forma runtime canonica:

- Le righe sessione persistono solo i metadati di sessione. Non devono persistere
  `transcriptLocator`, percorsi di file di trascrizione, percorsi JSONL sibling, percorsi di lock,
  metadati di potatura o puntatori di compatibilità dell'era file.
- L'identità della trascrizione è sempre identità SQLite: `{agentId, sessionId}` più
  metadati opzionali del topic dove il protocollo ne ha bisogno.
- `sqlite-transcript://...` non è un'identità runtime o di protocollo. Il nuovo codice non deve
  derivare, persistere, passare, analizzare o migrare locator di trascrizione. Runtime e
  test non dovrebbero contenere pseudo-locator affatto; la documentazione può menzionare la stringa
  solo per vietarla.
- I vecchi `sessions.json`, JSONL di trascrizione, `.jsonl.lock`, potatura, troncamento
  e la vecchia logica dei percorsi sessione appartengono solo al percorso di migrazione/importazione del doctor.
- Gli alias legacy della configurazione di sessione appartengono solo alla migrazione del doctor. Il runtime non
  interpreta `session.idleMinutes`, `session.resetByType.dm` o
  alias di sessione principale `agent:main:*` tra agenti per un altro agente configurato.
- L'identità di routing della sessione è stato relazionale tipizzato. I percorsi runtime hot e UI
  dovrebbero leggere `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` e
  `session_conversations`; non devono analizzare `session_key` né estrarre da
  `session_entries.entry_json` l'identità del provider, salvo come ombra di compatibilità
  mentre i vecchi punti di chiamata vengono eliminati.
- I marcatori di messaggio diretto a livello di canale, come `dm` rispetto a `direct`, sono vocabolario
  di routing, non locator di trascrizione o handle di compatibilità dell'archivio file.
- La configurazione legacy degli handler hook appartiene solo alle superfici di avviso/migrazione del doctor.
  Il runtime non deve caricare `hooks.internal.handlers`; gli hook passano solo attraverso directory
  hook scoperte e metadati `HOOK.md`.
- Avvio runtime, percorsi hot di risposta, Compaction, reset, ripristino, diagnostica,
  TTS, hook di memoria, sottoagenti, routing dei comandi Plugin, confini di protocollo e
  hook devono passare `{agentId, sessionId}` attraverso il runtime.
- I test dovrebbero seminare e verificare le righe di trascrizione SQLite tramite
  `{agentId, sessionId}`. I test che dimostrano solo l'inoltro di percorsi JSONL,
  la conservazione di locator forniti dal chiamante o la compatibilità dei file di trascrizione dovrebbero
  essere eliminati, salvo se coprono importazione doctor, materializzazione di supporto/debug
  non di sessione o forma del protocollo.
- `runEmbeddedPiAgent(...)`, le esecuzioni worker preparate e il tentativo embedded interno
  non devono accettare locator di trascrizione. Aprono il gestore trascrizione SQLite
  tramite `{agentId, sessionId}` e passano quel gestore alla sessione agente internalizzata
  compatibile con PI, così i chiamanti obsoleti non possono far scrivere al runner
  trascrizioni JSON/JSONL.
- La diagnostica del runner deve archiviare record di traccia runtime/cache/payload in SQLite.
  La diagnostica runtime non deve esporre manopole di override di file JSONL o helper generici
  di esportazione JSONL della trascrizione; le esportazioni rivolte all'utente possono materializzare artefatti espliciti
  da righe del database senza reinserire nomi file nel runtime.
- Il logging dello stream grezzo usa `OPENCLAW_RAW_STREAM=1` più righe diagnostiche SQLite.
  Il vecchio contratto logger file pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` e
  `raw-openai-completions.jsonl` non fa parte del runtime o dei test di OpenClaw.
- L'indicizzazione della memoria QMD non deve esportare trascrizioni SQLite in file markdown.
  QMD indicizza solo i file memoria configurati; la ricerca delle trascrizioni di sessione resta
  basata su SQLite.
- Il subpath SDK QMD è solo QMD per il nuovo codice. Gli helper di indicizzazione
  delle trascrizioni di sessione SQLite vivono su `memory-core-host-engine-session-transcripts`; qualsiasi
  riesportazione QMD è solo compatibilità e non deve essere usata dal codice runtime.
- Gli indici memoria integrati vivono nel database dell'agente proprietario. La configurazione runtime e
  i contratti runtime risolti non devono esporre `memorySearch.store.path`; il doctor
  elimina quella chiave di configurazione legacy e il codice corrente passa internamente il
  `databasePath` dell'agente.

Il lavoro di implementazione dovrebbe continuare a eliminare codice finché queste affermazioni non sono vere
senza eccezioni fuori dai confini doctor/importazione/esportazione/debug.

## Stato obiettivo e avanzamento

### Obiettivo rigido

- Un database SQLite globale possiede lo stato del piano di controllo:
  `state/openclaw.sqlite`.
- Un database SQLite per agente possiede lo stato del piano dati:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- La configurazione resta basata su file. `openclaw.json` non fa parte di questo
  refactor del database.
- I file legacy sono solo input di migrazione del doctor.
- Il runtime non scrive né legge mai sessioni o trascrizioni JSONL come stato attivo.

### Stati obiettivo

- `not-started`: il codice runtime dell'era file scrive ancora stato attivo.
- `migrating`: il codice doctor/importazione può spostare dati file in SQLite.
- `dual-read`: bridge temporaneo che legge sia SQLite sia file legacy. Questo stato
  è vietato per questo refactor salvo che sia documentato esplicitamente come
  solo doctor.
- `sqlite-runtime`: il runtime legge e scrive solo SQLite.
- `clean`: le API e i test runtime legacy vengono rimossi, e la guardia impedisce
  regressioni.
- `done`: documentazione, test, backup, migrazione doctor e controlli sulle modifiche dimostrano lo
  stato pulito.

### Stato attuale

- Sessioni: `clean` per il runtime. Le righe sessione vivono nel database per agente,
  le API runtime usano `{agentId, sessionId}` o `{agentId, sessionKey}`, e
  `sessions.json` è input legacy solo per il doctor.
- Trascrizioni: `clean` per il runtime. Eventi, identità, snapshot
  e eventi runtime di traiettoria della trascrizione vivono nel database per agente. Il runtime non
  accetta più locator di trascrizione o percorsi di trascrizione JSONL.
- Runner embedded PI: `clean`. Esecuzioni embedded PI, worker preparati, Compaction
  e cicli di retry usano l'ambito sessione SQLite e rifiutano handle di trascrizione obsoleti.
- Cron: `clean` per il runtime. Il runtime usa `cron_jobs` e `cron_run_logs`;
  i test runtime usano la denominazione SQLite `storeKey`, e i percorsi cron dell'era file restano
  solo nei test di migrazione legacy del doctor.
- Registro task: `clean`. Le righe runtime di task e flussi di task vivono in
  `state/openclaw.sqlite`; gli importer SQLite sidecar non rilasciati vengono eliminati.
- Stato Plugin: `clean`. Le righe stato/blob dei Plugin vivono nel database globale
  condiviso; i vecchi helper SQLite sidecar dello stato Plugin sono protetti contro l'uso.
- Memoria: `sqlite-runtime` per memoria integrata e indicizzazione delle trascrizioni di sessione.
  Le tabelle degli indici memoria vivono nel database per agente, lo stato memoria dei Plugin usa
  righe condivise dello stato Plugin, e i file memoria legacy sono input di migrazione del doctor
  o contenuto del workspace utente.
- Backup: `sqlite-runtime`. Le fasi di backup compattano snapshot SQLite, omettono sidecar
  WAL/SHM live, verificano l'integrità SQLite e registrano le esecuzioni di backup nel
  database globale.
- Migrazione doctor: `migrating`, intenzionalmente. Il doctor importa JSON legacy,
  JSONL e archivi sidecar ritirati in SQLite, registra esecuzioni/fonti di migrazione
  e rimuove le fonti riuscite.
- Script E2E: `clean` per la copertura runtime. Il seeding Docker MCP scrive righe SQLite.
  Lo script Docker del contesto runtime crea JSONL legacy solo dentro il
  seed di migrazione doctor e nomina esplicitamente il percorso indice sessione legacy.

### Lavoro rimanente

- [x] Rinominare le variabili store dei test runtime Cron allontanandole da `storePath`, salvo che
      siano input legacy del doctor.
      File: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Prova: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Rimuovere o rinominare i mock di test di esportazione obsoleti dell'era file.
      File: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Prova: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Rendere il seed JSONL legacy del contesto runtime Docker ovviamente solo doctor.
      File: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Prova: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` mostra solo
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Mantenere allineati i tipi generati Kysely dopo qualsiasi modifica dello schema.
      File: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Prova: nessuna modifica dello schema in questo passaggio; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Rieseguire i test mirati per archivi, comandi e script toccati.
      Prova: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Prima di dichiarare `done`, eseguire il gate delle modifiche o una prova ampia remota.
      Prova: `pnpm check:changed --timed -- <changed extension paths>` passato su
      esecuzione Hetzner Crabbox `run_3f1cabf6b25c` dopo setup temporaneo Node 24/pnpm e
      routing esplicito dei percorsi per il workspace sincronizzato senza `.git`.

### Non regredire

- Nessun locator di trascrizione.
- Nessun file sessione attivo.
- Nessuna fixture di test JSONL finta, salvo i test di migrazione legacy del doctor.
- Nessun accesso SQLite grezzo dove è previsto Kysely.
- Nessuna nuova migrazione DB legacy. Questo layout non è stato rilasciato; mantenere la versione dello schema
  a `1` salvo forte motivo.

## Presupposti di lettura del codice

Nessuna decisione di prodotto di follow-up blocca questo piano. L'implementazione dovrebbe
procedere con questi presupposti:

- Usa direttamente `node:sqlite` e richiedi l'ambiente di esecuzione Node 22+ per questo percorso di archiviazione.
- Mantieni esattamente un solo file di configurazione normale. Non spostare configurazione, manifest dei Plugin o workspace Git in SQLite in questo refactor.
- I file di compatibilità in fase di esecuzione non sono richiesti. I file JSON e JSONL legacy sono solo input di migrazione. I sidecar SQLite locali al branch non sono mai stati distribuiti e vengono eliminati invece che importati.
- `openclaw doctor --fix` possiede il passaggio di migrazione dai file legacy al database. L'avvio in fase di esecuzione e `openclaw migrate` non devono portare percorsi legacy di aggiornamento del database OpenClaw.
- La compatibilità delle credenziali segue la stessa regola: le credenziali in fase di esecuzione vivono in SQLite. I vecchi file `auth-profiles.json`, `auth.json` per agente e `credentials/oauth.json` condiviso sono input di migrazione per doctor, poi vengono rimossi dopo l'importazione.
- Lo stato del catalogo modelli generato è supportato dal database. Il codice in fase di esecuzione non deve scrivere `agents/<agentId>/agent/models.json`; i file `models.json` esistenti sono input legacy di doctor e vengono rimossi dopo l'importazione in `agent_model_catalogs`.
- L'ambiente di esecuzione non deve migrare, normalizzare o collegare locator di trascrizione. L'identità della trascrizione attiva è `{agentId, sessionId}` in SQLite. I percorsi file sono solo input legacy di doctor, e `sqlite-transcript://...` deve scomparire dalle superfici runtime, protocollo, hook e Plugin invece di essere trattato come handle di confine.
- Le letture SQLite delle trascrizioni in fase di esecuzione non eseguono vecchie migrazioni della forma delle voci JSONL né riscrivono intere trascrizioni per compatibilità. La normalizzazione delle voci legacy resta nelle utilità esplicite di doctor/importazione. Doctor normalizza i file di trascrizione JSONL legacy prima di inserire righe SQLite; le righe runtime correnti sono già scritte nello schema di trascrizione corrente. L'esportazione di traiettorie/sessioni legge quelle righe così come sono e non deve eseguire migrazioni legacy al momento dell'esportazione.
- Gli helper legacy di parsing/migrazione delle trascrizioni JSONL sono solo per doctor. Il codice del formato di trascrizione in fase di esecuzione costruisce solo il contesto di trascrizione SQLite corrente; doctor possiede gli aggiornamenti delle vecchie voci JSONL prima di inserire le righe.
- Il vecchio helper di streaming delle trascrizioni JSONL posseduto dal runtime è stato eliminato. Il codice di importazione di doctor possiede le letture esplicite dei file legacy; la cronologia delle sessioni in fase di esecuzione legge righe SQLite.
- I binding dell'app-server Codex usano il `sessionId` OpenClaw come chiave canonica nello spazio dei nomi di stato del Plugin Codex. `sessionKey` è metadato per routing/visualizzazione e non deve sostituire l'id di sessione durevole né resuscitare l'identità del file di trascrizione.
- I motori di contesto ricevono direttamente il contratto runtime corrente. Il registry non deve avvolgere i motori con shim di retry che eliminano `sessionKey`, `transcriptScope` o `prompt`; i motori che non possono accettare i parametri correnti incentrati sul database devono fallire in modo esplicito invece di essere collegati.
- L'output di backup deve restare un unico file di archivio. I contenuti del database devono entrare in quell'archivio come snapshot SQLite compatti, non come sidecar WAL live grezzi.
- La ricerca nelle trascrizioni è utile ma non richiesta per il primo taglio incentrato sul database. Progetta lo schema in modo che FTS possa essere aggiunto in seguito.
- L'esecuzione dei worker deve restare sperimentale dietro impostazioni mentre il confine del database si stabilizza.

## Risultati della lettura del codice

Il branch corrente è già oltre la fase di proof-of-concept. Il database condiviso esiste, Node `node:sqlite` è collegato tramite un piccolo helper runtime, e gli store precedenti ora scrivono in `state/openclaw.sqlite` o nel database proprietario `openclaw-agent.sqlite`.

Il lavoro rimanente non consiste nello scegliere SQLite; consiste nel mantenere pulito il nuovo confine ed eliminare qualsiasi interfaccia a forma di compatibilità che somigli ancora al vecchio mondo dei file:

- Il `storePath` della sessione non è più un'identità runtime, una forma di fixture di test o un campo del payload di stato. I test runtime e bridge non contengono più il nome di contratto `storePath`; il codice doctor/migrazione possiede quel vocabolario legacy.
- Le scritture di sessione non passano più dalla vecchia coda in-process `store-writer.ts`. Le scritture di patch SQLite usano invece rilevamento dei conflitti e retry limitato.
- La scoperta dei percorsi legacy ha ancora usi validi di migrazione, ma il codice in fase di esecuzione deve smettere di trattare `sessions.json` e i file JSONL di trascrizione come possibili destinazioni di scrittura.
- Le tabelle possedute dagli agenti vivono nei database SQLite per agente. Il DB globale conserva righe di registry/control-plane; l'identità della trascrizione è `{agentId, sessionId}` nelle righe di trascrizione per agente. Il codice in fase di esecuzione non deve rendere persistenti percorsi di file di trascrizione né migrare locator di trascrizione.
- Doctor importa già diversi file legacy. La pulizia consiste nel renderla una singola implementazione di migrazione esplicita che doctor chiama, con un report di migrazione durevole.

Nessuna domanda di prodotto aggiuntiva blocca l'implementazione.

## Forma attuale del codice

Il branch ha già una vera base SQLite condivisa:

- Il requisito minimo di runtime ora è Node 22+: `package.json`, il controllo del runtime della CLI,
  le impostazioni predefinite dell'installer, il localizzatore del runtime macOS, la CI e la documentazione pubblica di installazione
  sono tutti allineati. La vecchia lane di compatibilità con Node 22 è stata rimossa.
- `src/state/openclaw-state-db.ts` apre `openclaw.sqlite`, imposta WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` e applica
  il modulo di schema generato derivato da
  `src/state/openclaw-state-schema.sql`.
- I tipi di tabella Kysely e i moduli di schema runtime sono generati da database
  SQLite usa e getta creati dai file `.sql` committati; il codice runtime non
  mantiene più stringhe di schema copiate e incollate per i database globali,
  per agente o di acquisizione proxy.
- Gli store runtime derivano i tipi di riga selezionati e inseriti da quelle interfacce
  Kysely `DB` generate invece di replicare manualmente le forme delle righe SQLite.
  Il SQL grezzo resta limitato all'applicazione dello schema, ai pragma e al DDL
  solo per migrazioni.
- Gli schemi SQLite sono stati ridotti a `user_version = 1` perché questo layout
  del database non è ancora stato rilasciato. Gli opener runtime creano solo lo
  schema corrente; l'importazione da file a database resta nel codice doctor e
  gli helper di aggiornamento database locali al branch sono stati eliminati.
- La proprietà relazionale viene applicata dove il confine di proprietà è canonico:
  le righe di migrazione sorgente fanno cascade da `migration_runs`, lo stato di consegna
  dei task fa cascade da `task_runs` e le righe di identità della trascrizione
  fanno cascade dagli eventi di trascrizione.
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
- Lo stato arbitrario posseduto dai Plugin non riceve tabelle tipizzate possedute
  dall'host. I Plugin installati usano `plugin_state_entries` per payload JSON
  versionati e `plugin_blob_entries` per byte, con proprietà di namespace/chiave,
  pulizia TTL, backup e record di migrazione del Plugin. Lo stato di orchestrazione
  dei Plugin posseduto dall'host può comunque avere tabelle tipizzate quando l'host
  possiede il contratto di query, come `plugin_binding_approvals`.
- Le migrazioni dei Plugin sono migrazioni dati su namespace posseduti dal Plugin,
  non migrazioni di schema dell'host. Un Plugin può migrare le proprie voci di
  stato/blob versionate tramite un provider di migrazione e l'host registra lo stato
  di source/run nel normale registro delle migrazioni. Le nuove installazioni di
  Plugin non richiedono la modifica di `openclaw-state-schema.sql` a meno che l'host
  stesso non stia assumendo la proprietà di un nuovo contratto cross-Plugin.
- `src/state/openclaw-agent-db.ts` apre
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registra il database nel DB
  globale e possiede le tabelle locali all'agente per sessione, trascrizione, VFS,
  artefatto, cache e indice di memoria. La discovery runtime condivisa ora legge
  il registro `agent_databases` tipizzato generato invece di reimplementare quella
  query in ogni punto di chiamata.
- I database globali e per agente registrano una riga `schema_meta` con ruolo del database,
  versione dello schema, timestamp e id agente per i database agente. Il layout resta
  comunque a `user_version = 1` perché questo schema SQLite non è ancora stato rilasciato.
- L'identità delle sessioni per agente ora ha una tabella root canonica `sessions`
  indicizzata da `session_id`, con `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, timestamp, campi di visualizzazione, metadati del modello,
  id harness e collegamento parent/spawn come colonne interrogabili. `session_routes`
  è l'indice univoco della route attiva da `session_key` al `session_id` corrente,
  così una chiave di route può spostarsi a una nuova sessione durevole senza far scegliere
  alle letture hot tra righe duplicate `sessions.session_key`. Il vecchio payload
  in forma di compatibilità `session_entries.entry_json` è appeso alla root durevole
  `session_id` tramite chiave esterna; non è più l'unica rappresentazione a livello
  di schema di una sessione.
- Anche l'identità delle conversazioni esterne per agente è relazionale:
  `conversations` memorizza l'identità normalizzata di provider/account/conversazione e
  `session_conversations` collega una sessione OpenClaw a una o più conversazioni esterne.
  Questo copre le sessioni DM shared-main in cui più peer possono intenzionalmente mappare
  a una sessione senza mentire in `session_key`. SQLite applica anche l'univocità
  per l'identità naturale del provider, così la stessa tupla
  channel/account/kind/peer/thread non può biforcarsi tra id conversazione.
  I peer diretti shared-main sono collegati con un ruolo `participant`, così una
  sessione OpenClaw può rappresentare più peer DM esterni senza retrocedere i peer
  più vecchi a righe correlate vaghe. `sessions.primary_conversation_id` punta ancora
  al target di consegna tipizzato corrente. Le colonne chiuse di routing/stato sono
  applicate con vincoli SQLite `CHECK` invece di affidarsi solo alle union TypeScript.
  La proiezione runtime della sessione cancella le ombre di routing di compatibilità
  da `session_entries.entry_json` prima di applicare le colonne tipizzate di
  sessione/conversazione, così i payload JSON obsoleti non possono resuscitare target
  di consegna. Anche il routing degli annunci dei subagent richiede il contesto di
  consegna SQLite tipizzato; non ripiega più sui campi route di compatibilità
  `SessionEntry`. L'ereditarietà esplicita della consegna Gateway `chat.send` legge
  il contesto di consegna SQLite tipizzato invece dei campi di compatibilità
  `origin`/`last*`. Anche `tools.effective` deriva il contesto provider/account/thread
  da righe SQLite di consegna/routing tipizzate, non da ombre obsolete `last*` delle
  session-entry. Il contesto prompt degli eventi di sistema ricostruisce i campi
  channel/to/account/thread da campi di consegna tipizzati invece che da ombre `origin`.
  L'helper condiviso `deliveryContextFromSession` e il mapper da sessione a conversazione
  ora ignorano completamente `SessionEntry.origin`; solo i campi di consegna tipizzati
  e le righe di conversazione relazionale possono creare identità di route hot.
  La normalizzazione runtime delle session-entry rimuove `origin` prima di persistere
  o proiettare `entry_json`, e le scritture dei metadati in ingresso scrivono campi
  tipizzati channel/chat più righe di conversazione relazionale invece di creare nuove
  ombre origin.
- Gli eventi di trascrizione, gli snapshot di trascrizione e gli eventi runtime di
  traiettoria ora fanno riferimento alla root canonica per agente `sessions` e fanno
  cascade alla cancellazione della sessione. Le righe di identità/idempotenza della
  trascrizione continuano a fare cascade dalla riga esatta dell'evento di trascrizione.
- Gli indici memory-core ora usano tabelle esplicite del database agente
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` e
  `memory_embedding_cache`, con `memory_index_state` che traccia le modifiche di
  revisione. Gli indici laterali opzionali FTS/vector si chiamano
  `memory_index_chunks_fts` e `memory_index_chunks_vec` invece di tabelle generiche
  `meta`, `files`, `chunks`, `chunks_fts` o `chunks_vec`. I nomi canonici mantengono
  l'attuale forma delle righe path/source e la compatibilità degli embedding serializzati.
  Queste tabelle sono cache derivata/di ricerca, non storage canonico delle trascrizioni;
  possono essere eliminate e ricostruite dai file del workspace di memoria e dalle
  sorgenti configurate. L'apertura di un indice di memoria rilasciato con nomi generici
  migra metadati, sorgenti, chunk e cache degli embedding nelle tabelle canoniche;
  le tabelle derivate FTS/vector vengono ricostruite con i loro nomi canonici.
- Lo stato di recupero delle run dei subagent ora vive in righe condivise tipizzate
  `subagent_runs` con chiavi indicizzate per sessione figlia, richiedente e controller.
  Il vecchio file `subagents/runs.json` è solo input di migrazione doctor.
- I binding delle conversazioni correnti ora vivono in righe condivise tipizzate
  `current_conversation_bindings` indicizzate dall'id conversazione normalizzato, con
  colonne target agent/session, tipo di conversazione, stato, scadenza e metadati
  memorizzati come colonne relazionali invece che come record di binding opaco duplicato.
  La chiave durevole del binding include il tipo di conversazione normalizzato, così
  i riferimenti direct/group/channel non possono collidere, e SQLite rifiuta valori
  di tipo/stato binding non validi. Il vecchio file
  `bindings/current-conversations.json` è solo input di migrazione doctor.
- Il recupero della coda di consegna ora sovrappone al JSON di replay colonne tipizzate
  per channel, target, account, sessione, retry, errore, platform-send e stato di
  recupero. `entry_json` mantiene i payload di replay, hook e formattazione, ma le
  colonne tipizzate sono autoritative per routing/stato hot della coda.
- I puntatori di ripristino dell'ultima sessione TUI ora vivono in righe condivise
  tipizzate `tui_last_sessions` indicizzate dallo scope hashato di connessione/sessione
  TUI. Il vecchio file JSON TUI è solo input di migrazione doctor.
- Le preferenze TTS predefinite ora vivono in righe SQLite di stato Plugin condiviso
  sotto la chiave del Plugin `speech-core`. Il vecchio file `settings/tts.json` è solo
  input di migrazione doctor; il runtime non legge né scrive più file JSON di preferenze
  TTS, e il resolver del percorso legacy vive nel modulo di migrazione doctor.
- I metadati dei target segreti ora parlano di store invece di fingere che ogni target
  di credenziali sia un file di configurazione. `openclaw.json` resta lo store di
  configurazione; i target auth-profile usano righe SQLite tipizzate
  `auth_profile_stores` con credenziali in forma di provider mantenute come payload JSON.
- L'audit dei segreti non scansiona più i file `auth.json` per agente ritirati.
  Doctor possiede l'avviso, l'importazione e la rimozione di quel file legacy.
- Gli helper dei percorsi legacy dei profili auth ora vivono nel codice legacy doctor.
  Gli helper dei percorsi dei profili auth core espongono identità e posizioni di
  visualizzazione degli auth-store SQLite, non percorsi runtime `auth-profiles.json`
  o `auth-state.json`.
- I moduli runtime di recupero delle run dei subagent e della cache delle capacità dei
  modelli OpenRouter ora tengono separati reader/writer di snapshot SQLite dagli helper
  di importazione JSON legacy solo doctor. Le capacità OpenRouter usano le righe tipizzate
  generiche `model_capability_cache` sotto `provider_id = "openrouter"` invece di un
  singolo blob di cache opaco o di una tabella host specifica per provider. `taskName`
  delle run dei subagent è memorizzato nella colonna tipizzata `subagent_runs.task_name`;
  la copia `payload_json` è dato di replay/debug, non la sorgente per i campi hot di
  visualizzazione o lookup.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementa una VFS SQLite
  sulla tabella `vfs_entries` del database agente. Letture di directory, esportazioni
  ricorsive, cancellazioni e rinomine usano intervalli di prefisso indicizzati
  `(namespace, path)` invece di scansionare un intero namespace o affidarsi al matching
  di percorsi `LIKE`.
- `src/agents/runtime-worker.entry.ts` crea VFS SQLite per run, store di artefatti
  tool, artefatti run e cache con scope per i worker.
- I marker di completamento del bootstrap del workspace ora vivono in righe condivise
  tipizzate `workspace_setup_state` indicizzate dal percorso workspace risolto invece
  di `.openclaw/workspace-state.json`; il runtime non legge né riscrive più il marker
  workspace legacy, e le API helper non si passano più un percorso fittizio
  `.openclaw/setup-state` solo per derivare l'identità dello storage.
- Le approvazioni exec ora vivono nella riga singleton SQLite condivisa tipizzata
  `exec_approvals_config`. Doctor importa il legacy `~/.openclaw/exec-approvals.json`;
  le scritture runtime non creano, riscrivono né riportano più quel file come posizione
  dello store attivo. Il companion macOS legge e scrive la stessa riga della tabella
  `state/openclaw.sqlite`; mantiene su disco solo il socket Unix del prompt perché è IPC,
  non stato runtime durevole.
- I moduli runtime di identità dispositivo, auth dispositivo e bootstrap ora tengono
  separati reader/writer di snapshot SQLite dagli helper di importazione JSON legacy
  solo doctor. L'identità dispositivo usa righe tipizzate `device_identities` e i token
  di auth dispositivo usano righe tipizzate `device_auth_tokens`. Le scritture di auth
  dispositivo riconciliano le righe per device/role invece di troncare la tabella dei
  token, e il runtime non instrada più gli aggiornamenti di singolo token attraverso
  il vecchio adapter dell'intero store. Il legacy
  I payload JSON versione 1 esistono solo come forme di importazione/esportazione di doctor.
- La cache di scambio token di GitHub Copilot usa la tabella SQLite condivisa dello stato Plugin
  sotto `github-copilot/token-cache/default`. È stato di cache di proprietà del provider,
  quindi intenzionalmente non aggiunge una tabella schema dell'host.
- La Compaction di GitHub Copilot non scrive più sidecar dell'area di lavoro
  `openclaw-compaction-*.json`. L'harness chiama l'RPC di Compaction della cronologia SDK per la
  sessione SDK tracciata, e OpenClaw mantiene lo stato durevole di sessione/trascrizione in
  SQLite invece che in file marker di compatibilità.
- Il runtime Swift condiviso (`OpenClawKit`) usa le stesse righe
  `state/openclaw.sqlite` per l'identità del dispositivo e l'autenticazione del dispositivo. Gli helper dell'app macOS
  importano gli helper SQLite condivisi invece di possedere un secondo percorso JSON o
  SQLite. Un file legacy residuo `identity/device.json` blocca la creazione dell'identità
  finché doctor non lo importa in SQLite, allineandosi al gate di avvio TypeScript e Android.
- L'identità del dispositivo Android usa lo stesso materiale chiave compatibile con TypeScript
  archiviato in righe tipizzate `state/openclaw.sqlite#table/device_identities`. Non
  legge né scrive mai `openclaw/identity/device.json`; un file legacy residuo blocca
  l'avvio finché doctor non lo importa in SQLite.
- Anche i token di autenticazione dispositivo memorizzati nella cache su Android usano righe tipizzate
  `state/openclaw.sqlite#table/device_auth_tokens` e condividono la stessa semantica dei token
  versione 1 di TypeScript e Swift. Il runtime non legge più le chiavi di compatibilità
  `gateway.deviceToken*` di `SecurePrefs`; quelle appartengono solo alla logica di migrazione/doctor.
- La cronologia dei pacchetti recenti delle notifiche Android usa righe tipizzate
  `android_notification_recent_packages`. Il runtime non migra né legge più le vecchie chiavi CSV di SharedPreferences.
- La creazione dell'identità del dispositivo fallisce in modo chiuso quando esiste il file legacy `identity/device.json`,
  quando la riga identità SQLite non è valida, o quando lo store identità SQLite
  non può essere aperto. Doctor importa e rimuove prima quel file, quindi l'avvio del runtime
  non può ruotare silenziosamente l'identità di pairing prima della migrazione.
- La selezione dell'identità del dispositivo è una chiave di riga SQLite, non un localizzatore di file JSON. Test
  e helper del Gateway passano chiavi identità esplicite; solo la migrazione doctor e il
  gate di avvio fail-closed conoscono il nome file ritirato `identity/device.json`.
- La compatibilità del reset di sessione ora vive nella migrazione della configurazione doctor:
  `session.idleMinutes` viene spostato in `session.reset.idleMinutes`,
  `session.resetByType.dm` viene spostato in `session.resetByType.direct`, e la
  policy di reset del runtime legge solo le chiavi di reset canoniche.
- La compatibilità della configurazione legacy ora vive sotto `src/commands/doctor/`. La normale
  validazione di `readConfigFileSnapshot()` non importa i rilevatori legacy di doctor
  né annota problemi legacy; `runDoctorConfigPreflight()` aggiunge quei problemi per
  riparazione/reporting di doctor. Il flusso di configurazione doctor importa
  `src/commands/doctor/legacy-config.ts`, e la riparazione dei vecchi ID profilo OAuth vive
  sotto
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- I comandi non-doctor non eseguono automaticamente la riparazione della configurazione legacy. Per esempio,
  `openclaw update --channel` ora fallisce su configurazione legacy non valida e chiede
  all'utente di eseguire doctor, invece di importare silenziosamente codice di migrazione doctor.
- Web push, APNs, Voice Wake, controlli di aggiornamento e salute della configurazione ora usano tabelle SQLite condivise
  tipizzate per sottoscrizioni, chiavi VAPID, registrazioni dei nodi, righe trigger,
  righe di routing, stato delle notifiche di aggiornamento e voci di salute della configurazione invece di
  blob JSON opachi interi. Le scritture di snapshot Web push e APNs ora riconciliano
  sottoscrizioni/registrazioni per chiave primaria invece di svuotare le loro tabelle;
  la salute della configurazione fa lo stesso per percorso di configurazione.
  I loro moduli runtime mantengono lettori/scrittori di snapshot SQLite separati dagli
  helper di importazione JSON legacy solo per doctor.
- La configurazione dell'host Node ora usa una riga singleton tipizzata nel database SQLite condiviso;
  doctor importa il vecchio file `node.json` prima dell'uso normale del runtime.
- Pairing dispositivo/nodo, pairing dei canali, allowlist dei canali e stato di bootstrap
  ora usano righe SQLite tipizzate invece di blob JSON opachi interi. Approvazioni dei binding Plugin
  e stato dei job Cron seguono la stessa separazione: i moduli runtime espongono
  operazioni basate su SQLite e helper di snapshot neutrali, e le scritture di snapshot di pairing/bootstrap
  più approvazione binding Plugin riconciliano le righe per chiave primaria
  invece di troncare le tabelle, mentre doctor importa/rimuove i vecchi file JSON tramite
  moduli `src/commands/doctor/legacy/*`.
- I record dei Plugin installati ora vivono nell'indice SQLite dei Plugin installati.
  La lettura/scrittura della configurazione runtime non migra né preserva più i vecchi dati di configurazione autoriale
  `plugins.installs`; doctor importa quella forma di configurazione legacy in SQLite
  prima dell'uso normale del runtime.
- Gli snapshot di recupero credenziali QQBot ora vivono nello stato Plugin SQLite sotto
  `qqbot/credential-backups`. Il runtime non scrive più
  `qqbot/data/credential-backup*.json`; il contratto doctor di QQBot importa e
  archivia quei file di backup legacy dalla directory di stato attiva.
- La pianificazione del reload del Gateway confronta snapshot dell'indice SQLite dei Plugin installati sotto
  un namespace diff interno `installedPluginIndex.installRecords.*`. Le decisioni di reload del runtime
  non racchiudono più quelle righe in falsi oggetti di configurazione `plugins.installs`.
- L'upgrade delle credenziali degli account nominati Matrix non avviene più durante le letture
  runtime. Doctor possiede la ridenominazione del vecchio file top-level `credentials/matrix/credentials.json`
  quando può essere risolto un singolo account Matrix/predefinito.
- I moduli runtime di pairing core e Cron non esportano più builder di percorsi JSON legacy.
  I moduli legacy di proprietà di doctor costruiscono i percorsi sorgente `pending.json`, `paired.json`,
  `bootstrap.json` e `cron/jobs.json` solo per test di importazione e
  migrazione. La normalizzazione legacy della forma dei job Cron e l'importazione dei log di esecuzione Cron
  vivono sotto `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importa file di stato JSON legacy,
  inclusa la configurazione host del nodo, in SQLite da doctor. I nuovi importatori di file legacy
  restano sotto `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importa i transcript legacy `sessions.json` e
  `*.jsonl` direttamente in SQLite e rimuove le sorgenti importate con successo. Non
  mette più in staging i transcript legacy root tramite
  `agents/<agentId>/sessions/*.jsonl` né crea una destinazione JSONL canonica prima
  dell'importazione.
- I controlli doctor di integrità dello stato non scansionano più directory di sessione legacy né
  offrono l'eliminazione di JSONL orfani. I file di transcript legacy sono solo input di migrazione,
  e lo step di migrazione possiede importazione più rimozione della sorgente.
- L'importazione del registro sandbox legacy vive sotto
  `src/commands/doctor/legacy/sandbox-registry.ts`; le letture e scritture del registro sandbox attivo
  restano solo SQLite.
- La riparazione di salute/importazione dei transcript di sessione legacy vive sotto
  `src/commands/doctor/legacy/session-transcript-health.ts`; i moduli dei comandi runtime
  non portano più codice di parsing dei transcript JSONL né di riparazione del branch attivo.

Punti salienti del consolidamento/eliminazione completati:

- Lo stato dei Plugin ora usa il database condiviso `state/openclaw.sqlite`. Il vecchio
  importatore affiancato `plugin-state/state.sqlite` locale al branch è stato rimosso perché
  quel layout SQLite non è mai stato distribuito. Gli helper di probe/test riportano il
  `databasePath` condiviso invece di esporre un percorso SQLite specifico dello stato dei Plugin.
- Le tabelle runtime di task e TaskFlow ora risiedono nel database condiviso
  `state/openclaw.sqlite` invece di `tasks/runs.sqlite` e
  `tasks/flows/registry.sqlite`; i vecchi importatori affiancati sono rimossi per la
  stessa ragione di layout mai distribuito.
- `src/config/sessions/store.ts` non ha più bisogno di `storePath` per i
  metadati in ingresso, gli aggiornamenti di route o le letture updated-at. La persistenza dei comandi, la pulizia delle sessioni CLI, la profondità dei subagent, gli override di autenticazione e l'identità della sessione di trascrizione usano API di riga agente/sessione. Le scritture vengono applicate come patch di riga SQLite con nuovo tentativo in caso di conflitto ottimistico.
- La risoluzione del target di sessione ora espone target di database per agente, non percorsi
  legacy `sessions.json`. Gateway condiviso, metadati ACP, riparazione delle route di doctor e
  `openclaw sessions` enumerano `agent_databases` più gli agenti configurati.
- Il routing delle sessioni Gateway ora usa `resolveGatewaySessionDatabaseTarget`; il
  target restituito contiene `databasePath` e chiavi di riga SQLite candidate invece
  di un percorso file legacy dell'archivio sessioni.
- I tipi runtime delle sessioni di canale ora espongono `{agentId, sessionKey}` per
  letture updated-at, metadati in ingresso e aggiornamenti last-route. Il vecchio
  tipo di compatibilità `saveSessionStore(storePath, store)` è stato rimosso.
- Le superfici runtime dei Plugin, API di estensione e barrel `config/sessions` ora indirizzano
  il codice dei Plugin verso helper di riga sessione basati su SQLite. Gli export di compatibilità
  della libreria root (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) restano come
  shim deprecati per i consumatori esistenti. Il vecchio helper
  `resolveLegacySessionStorePath` è stato rimosso; la costruzione dei percorsi legacy `sessions.json`
  ora è locale alle migrazioni e alle fixture di test.
- `src/config/sessions/session-entries.sqlite.ts` ora archivia le voci di sessione canoniche
  nel database per agente e supporta patch di lettura/upsert/eliminazione a livello di riga.
  Upsert/patch/delete runtime non cercano più varianti di maiuscole/minuscole né eliminano chiavi alias legacy; doctor gestisce la canonicalizzazione. L'helper autonomo di importazione JSON è stato rimosso, e la migrazione unisce con upsert le righe più nuove invece di sostituire l'intera tabella delle sessioni. Gli helper pubblici di lettura/elenco/caricamento proiettano i metadati delle sessioni calde da righe tipizzate `sessions` e `conversations`;
  `entry_json` è un'ombra di compatibilità/debug e può essere obsoleta o non valida
  senza perdere identità di sessione tipizzata o contesto di consegna.
- `src/config/sessions/delivery-info.ts` ora risolve il contesto di consegna dalle
  righe tipizzate per agente `sessions` + `conversations` + `session_conversations`.
  Non ricostruisce più l'identità di consegna runtime da
  `session_entries.entry_json`; una riga conversazione tipizzata mancante è un problema di
  migrazione/riparazione doctor, non un fallback runtime.
- Le decisioni di reset delle sessioni archiviate ora preferiscono i metadati tipizzati
  `sessions.session_scope`, `sessions.chat_type` e `sessions.channel`. Il parsing di `sessionKey`
  resta solo per suffissi espliciti di thread/topic sui target di comando; la classificazione reset gruppo vs diretto non deriva più dalla forma della chiave.
- La classificazione della visualizzazione elenco/stato sessioni ora usa metadati chat tipizzati e
  il tipo di sessione Gateway. Non tratta più le sottostringhe `:group:` o `:channel:`
  dentro `session_key` come verità durevole gruppo/diretto.
- La selezione della policy di risposta silenziosa ora usa solo tipo di conversazione esplicito o
  metadati di superficie. Non deduce più policy diretta/gruppo dalle sottostringhe di
  `session_key`.
- La risoluzione del modello di visualizzazione della sessione ora riceve l'id agente dal target del database sessione SQLite invece di estrarlo dividendo `session_key`.
- L'idratazione dei target di annuncio agente-agente ora usa solo `deliveryContext` tipizzato di
  `sessions.list`. Non recupera più il routing canale/account/thread da `origin` legacy,
  campi `last*` rispecchiati o forma di `session_key`.
- Il rifiuto dei target thread di `sessions_send` ora legge metadati di routing SQLite tipizzati.
  Non rifiuta né accetta più target analizzando suffissi di thread dalla chiave target.
- La validazione della policy degli strumenti con scope gruppo ora legge il routing conversazione SQLite tipizzato
  per la sessione corrente o generata. Non considera più affidabile l'identità gruppo/canale decodificando
  `sessionKey`; gli id gruppo forniti dal chiamante vengono scartati quando nessuna riga sessione tipizzata li attesta.
- Il matching degli override modello di canale ora usa metadati espliciti di gruppo e conversazione padre.
  Non decodifica più gli id conversazione padre da `parentSessionKey`.
- L'ereditarietà degli override modello archiviati ora richiede una chiave sessione padre esplicita
  dal contesto sessione tipizzato. Non deriva più override padre dai suffissi
  `:thread:` o `:topic:` in `sessionKey`.
- Il vecchio wrapper thread-info della sessione e il parser thread dei Plugin caricati sono stati rimossi;
  nessun codice runtime importa `config/sessions/thread-info`.
- L'helper conversazione di canale non espone più bridge di parsing della chiave sessione completa.
  Il core normalizza ancora gli id conversazione grezzi posseduti dal provider tramite
  `resolveSessionConversation(...)`, ma non ricostruisce fatti di route da `sessionKey`.
- Consegna di completamento, policy di invio e manutenzione dei task non derivano più il tipo chat
  dalla forma di `session_key`. Il vecchio parser della chiave tipo chat è stato eliminato;
  questi percorsi richiedono metadati sessione tipizzati, contesto di consegna tipizzato o
  vocabolario esplicito dei target di consegna.
- Elenco/stato sessioni, diagnostica, binding account approvazione, filtraggio Heartbeat TUI
  e riepiloghi d'uso non estraggono più routing provider/account/thread/display da `SessionEntry.origin`.
  Le uniche letture runtime rimanenti di `origin` sono concetti non di sessione o oggetti di consegna del turno corrente.
- La ricerca della conversazione nativa per richiesta di approvazione ora legge righe di routing sessione tipizzate per agente.
  Non analizza più identità conversazione canale/gruppo/thread da `sessionKey`; i metadati tipizzati mancanti sono un problema di migrazione/riparazione.
- I payload degli eventi Gateway session changed/chat/session non ripetono più
  `SessionEntry.origin` o ombre di route `last*`; i client ricevono `channel`,
  `chatType` e `deliveryContext` tipizzati.
- La risoluzione della consegna Heartbeat ora può ricevere direttamente il
  `deliveryContext` SQLite tipizzato, e il runtime Heartbeat passa la riga di consegna sessione per agente
  invece di affidarsi alle ombre di compatibilità `session_entries` per il routing corrente.
- Anche la risoluzione del target di consegna dell'agente isolato Cron idrata la route corrente
  dalla riga di consegna sessione tipizzata per agente prima di ricorrere al payload voce di compatibilità.
- La risoluzione dell'origine annuncio subagent ora propaga il contesto di consegna sessione richiedente tipizzato
  tramite `loadRequesterSessionEntry` e preferisce quella riga alle ombre di compatibilità
  `last*`/`deliveryContext`.
- Gli aggiornamenti dei metadati sessione in ingresso ora fanno merge prima con la riga di consegna tipizzata per agente;
  i vecchi campi di consegna `SessionEntry` sono solo il fallback quando non esiste una riga conversazione tipizzata.
- L'estrazione della consegna restart/update ora lascia prevalere il `threadId` della consegna SQLite tipizzata
  sui frammenti topic/thread analizzati da `sessionKey`; il parsing è solo un fallback per chiavi legacy a forma di thread.
- Gli id canale del contesto agente hook ora preferiscono l'identità conversazione SQLite tipizzata,
  poi i metadati espliciti del messaggio. Non analizzano più frammenti provider/gruppo/canale da `sessionKey`.
- L'ereditarietà external-route di Gateway `chat.send` ora legge metadati di routing sessione SQLite tipizzati invece di inferire scope canale/diretto/gruppo da parti di
  `sessionKey`. Le sessioni con scope canale ereditano solo quando il canale sessione tipizzato e il tipo chat corrispondono al contesto di consegna archiviato; le sessioni shared-main mantengono la loro regola più restrittiva CLI/nessun-metadato-client.
- Wake restart-sentinel e routing di continuazione ora leggono righe SQLite tipizzate di consegna/routing prima di accodare wake Heartbeat o continuazioni agent-turn instradate. Non ricostruisce più il contesto di consegna dall'ombra JSON della voce sessione.
- La risoluzione del contesto Gateway `tools.effective` ora legge righe SQLite tipizzate
  di consegna/routing per input provider, account, target, thread e reply-mode. Non recupera più quei campi di routing caldi dalle ombre origin obsolete di
  `session_entries.entry_json`.
- Il routing delle consulenze vocali realtime ora risolve consegna padre/chiamata da righe sessione SQLite tipizzate per agente. Non ricorre più alle ombre di compatibilità
  `SessionEntry.deliveryContext` quando sceglie la route del messaggio agente incorporato.
- Il relay Heartbeat dello spawn ACP e il routing parent-stream ora leggono la consegna padre
  da righe sessione SQLite tipizzate. Non ricostruiscono più il contesto di consegna padre
  da ombre di compatibilità delle voci sessione.
- La conservazione della route di consegna sessione ora segue metadati chat tipizzati e
  colonne di consegna persistite. Non estrae più indizi di canale, marcatori direct/main
  o forma thread da `sessionKey`; le route webchat interne ereditano un target esterno solo
  quando SQLite ha già identità di consegna tipizzata/persistita per la sessione.
- L'estrazione generica della consegna sessione ora legge solo la riga di consegna sessione SQLite tipizzata esatta. Non analizza più suffissi thread/topic né fa fallback da una chiave a forma di thread a una chiave sessione base.
- Dispatch delle risposte, recupero restart sentinel e routing delle consulenze vocali realtime
  ora usano righe SQLite sessione/conversazione tipizzate esatte per il routing thread. Non recuperano più id thread o contesto di consegna della sessione base analizzando chiavi sessione a forma di thread.
- La limitazione della cronologia PI incorporata ora usa la proiezione di routing sessione SQLite tipizzata
  (`sessions` + `conversations` primarie) per provider, tipo chat e identità peer. Non analizza più provider, DM, gruppo o forma thread da `sessionKey`.
- L'inferenza di consegna degli strumenti Cron ora usa solo consegna esplicita o il contesto di consegna tipizzato corrente. Non decodifica più target canale, peer, account o thread da `agentSessionKey`.
- Le righe sessione runtime non contengono più il vecchio alias route `lastProvider`.
  Helper e test usano campi tipizzati `lastChannel` e `deliveryContext`;
  la migrazione doctor è l'unico punto che dovrebbe tradurre alias route più vecchi
  o ombre `origin` persistite.
- Eventi trascrizione, righe VFS e righe artifact degli strumenti ora scrivono nel database per agente.
  La tabella globale mai distribuita di mappatura file trascrizione è stata rimossa; doctor
  registra i percorsi sorgente legacy in righe di migrazione durevoli.
- La ricerca runtime delle trascrizioni non scansiona più offset byte JSONL né sonda file trascrizione legacy. I percorsi Gateway chat/media/history leggono righe trascrizione da
  SQLite; la sessione JSONL ora è solo un input legacy di doctor, non uno stato runtime
  o un formato di export.
- Le relazioni padre e branch delle trascrizioni usano metadati strutturati
  `parentTranscriptScope: {agentId, sessionId}` nelle intestazioni trascrizione SQLite,
  non stringhe locator simili a percorsi `agent-db:...transcript_events...`.
- Il contratto del transcript manager non espone più costruttori impliciti persistiti
  `create(cwd)` o `continueRecent(cwd)`. I manager trascrizione persistiti vengono aperti con uno scope esplicito `{agentId, sessionId}`; solo i manager in memoria restano senza scope per test e trasformazioni pure di trascrizione.
- Le API dell'archivio trascrizioni runtime risolvono lo scope SQLite, non percorsi filesystem. Il vecchio helper `resolve...ForPath` e le opzioni di scrittura `transcriptPath` inutilizzate sono stati rimossi dai chiamanti runtime.
- La risoluzione runtime delle sessioni ora usa `{agentId, sessionId}` e non deve derivare
  stringhe `sqlite-transcript://<agent>/<session>` per confini esterni.
  I percorsi JSONL assoluti legacy sono solo input di migrazione doctor.
- I record direct-bridge del relay hook nativo ora risiedono in righe condivise tipizzate
  `native_hook_relay_bridges` indicizzate per id relay. Il runtime non scrive più un registro JSON in
  `/tmp` né record generici opachi per quei record bridge di breve durata.
- `runEmbeddedPiAgent(...)` non ha più un parametro transcript-locator.
  I descrittori dei worker preparati omettono anche i localizzatori delle trascrizioni. Lo stato della sessione di runtime
  e le esecuzioni successive in coda trasportano `{agentId, sessionId}` invece di
  handle di trascrizione derivati.
- La Compaction incorporata ora prende lo scope SQLite da `agentId` e `sessionId`.
  Gli hook di Compaction, le chiamate al context-engine, la delega CLI e le risposte del protocollo
  non devono ricevere handle `sqlite-transcript://...` derivati. Il codice di esportazione/debug
  può materializzare artefatti utente espliciti dalle righe, ma non fornisce un
  percorso generico di esportazione JSONL della sessione né reimmette nomi di file nell'identità
  di runtime.
- `/export-session` legge le righe della trascrizione da SQLite e scrive solo la vista HTML
  autonoma richiesta. Il visualizzatore incorporato non ricostruisce né
  scarica più il JSONL della sessione da quelle righe.
- La delega al context-engine non analizza più un localizzatore di trascrizione per recuperare
  l'identità dell'agente. Il contesto di runtime preparato trasporta l'`agentId` risolto
  nell'adapter di Compaction integrato.
- La riscrittura della trascrizione e il troncamento live dei risultati degli strumenti ora leggono e persistono
  lo stato della trascrizione tramite `{agentId, sessionId}` e non derivano localizzatori
  temporanei per i payload degli eventi di aggiornamento della trascrizione.
- La superficie degli helper dello stato della trascrizione non ha più varianti basate su localizzatore
  `readTranscriptState`, `replaceTranscriptStateEvents` o
  `persistTranscriptStateMutation`. I chiamanti di runtime devono usare le API
  `{agentId, sessionId}`. L'importazione di doctor legge i file legacy tramite percorso file esplicito
  e scrive righe SQLite; non migra stringhe di localizzatore.
- Il contratto del session-manager di runtime non espone più `open(locator)`,
  `forkFrom(locator)` o `setTranscriptLocator(...)`. I session manager persistiti
  si aprono solo tramite `{agentId, sessionId}`; gli helper di elenco/fork vivono su
  API di sessione e checkpoint orientate alle righe invece che sulla facade del gestore
  delle trascrizioni.
- Le API del lettore di trascrizioni del Gateway sono scope-first. Accettano
  `{agentId, sessionId}` e non accettano un localizzatore di trascrizione posizionale che
  potrebbe diventare accidentalmente identità di runtime. L'analisi dei localizzatori delle trascrizioni attive
  è stata rimossa; i percorsi sorgente legacy vengono letti solo dal codice di importazione di doctor.
- Anche gli eventi di aggiornamento della trascrizione sono scope-first. `emitSessionTranscriptUpdate`
  non accetta più una stringa localizzatore nuda e i listener instradano tramite
  `{agentId, sessionId}` senza analizzare un handle.
- Il broadcast dei messaggi di sessione del Gateway risolve le chiavi di sessione dallo scope agente/sessione,
  non da un localizzatore di trascrizione. Il vecchio resolver/cache da localizzatore di trascrizione a chiave
  di sessione è stato rimosso.
- I filtri SSE della cronologia delle sessioni del Gateway filtrano gli aggiornamenti live per scope agente/sessione. Non
  canonicalizza più candidati localizzatori di trascrizione, realpath o identità di trascrizione
  a forma di file per decidere se uno stream debba ricevere un aggiornamento.
- Gli hook del ciclo di vita della sessione non derivano né espongono più localizzatori di trascrizione su
  `session_end`. I consumatori degli hook ottengono `sessionId`, `sessionKey`, id della sessione successiva
  e contesto dell'agente; i file di trascrizione non fanno parte del contratto del ciclo di vita.
- Anche gli hook di reset non derivano né espongono più localizzatori di trascrizione. Il
  payload `before_reset` trasporta messaggi SQLite recuperati più il motivo del reset,
  mentre l'identità della sessione resta nel contesto dell'hook.
- Il reset dell'harness dell'agente non accetta più un localizzatore di trascrizione. Il dispatch del reset è
  circoscritto da `sessionId`/`sessionKey` più il motivo.
- I tipi di sessione delle estensioni dell'agente non espongono più `transcriptLocator`; le estensioni
  devono usare il contesto di sessione e le API di runtime invece di cercare
  un'identità di trascrizione a forma di file.
- Gli hook di Compaction dei Plugin non espongono più localizzatori di trascrizione. Il contesto dell'hook
  trasporta già l'identità della sessione e le letture delle trascrizioni devono passare attraverso API
  consapevoli dello scope SQLite invece che da handle a forma di file.
- Gli hook `before_agent_finalize` non espongono più `transcriptPath`, inclusi
  i payload di relay degli hook nativi. Gli hook di finalizzazione usano solo il contesto di sessione.
- Le risposte di reset del Gateway non sintetizzano più un localizzatore di trascrizione sulla
  voce restituita. Il reset crea righe di trascrizione SQLite, restituisce la voce di sessione
  pulita e lascia l'accesso alla trascrizione ai lettori consapevoli dello scope.
- I risultati di esecuzione incorporata e Compaction non espongono più localizzatori di trascrizione per
  la contabilizzazione delle sessioni. La Compaction automatica aggiorna solo il `sessionId` attivo,
  i contatori di Compaction e i metadati dei token.
- I risultati dei tentativi incorporati non restituiscono più `transcriptLocatorUsed` e
  i risultati `compact()` del context-engine non restituiscono più localizzatori di trascrizione.
  I cicli di retry di runtime accettano solo un `sessionId` successore.
- I risultati di append della trascrizione del delivery-mirror non restituiscono più localizzatori di
  trascrizione. I chiamanti ottengono il `messageId` aggiunto; i segnali di aggiornamento della trascrizione usano
  lo scope SQLite.
- Gli helper di fork della sessione padre restituiscono solo il `sessionId` del fork. La preparazione dei subagent
  passa lo scope agente/sessione figlio agli engine.
- I parametri del runner CLI e il reseeding della cronologia non accettano più localizzatori di trascrizione.
  Le letture della cronologia CLI risolvono lo scope della trascrizione SQLite da `{agentId,
sessionId}` e dal contesto della chiave di sessione.
- Le fixture di test CLI e del runner incorporato ora seminano e leggono righe di trascrizione SQLite
  per id sessione invece di fingere che le sessioni attive siano file `*.jsonl` o
  passare una stringa `sqlite-transcript://...` attraverso i parametri di runtime.
- Gli eventi di guardia dei risultati degli strumenti di sessione emettono da scope di sessione noto anche quando un
  manager in memoria non ha un localizzatore derivato. I suoi test non simulano più file di
  trascrizione attivi `/tmp/*.jsonl`.
- Gli helper BTW e dei checkpoint di Compaction ora leggono e forkano le righe delle trascrizioni per
  scope SQLite. I metadati dei checkpoint ora memorizzano solo id sessione e id leaf/entry;
  i localizzatori derivati non vengono più scritti nei payload dei checkpoint.
- La ricerca transcript-key del Gateway usa lo scope della trascrizione SQLite ai confini del protocollo
  e non esegue più realpath o stat sui nomi dei file di trascrizione.
- La rotazione automatica delle trascrizioni di Compaction scrive le righe di trascrizione successive
  direttamente tramite lo store delle trascrizioni SQLite. Le righe di sessione mantengono solo
  l'identità della sessione successore, non un percorso JSONL durevole o un localizzatore persistito.
- La Compaction context-engine incorporata usa helper di rotazione delle trascrizioni denominati da SQLite.
  I test di rotazione non costruiscono più percorsi successori JSONL né
  modellano le sessioni attive come file.
- La retention delle immagini in uscita gestite usa come chiave della cache dei messaggi di trascrizione
  le statistiche delle trascrizioni SQLite invece di chiamate stat al filesystem.
- I lock di sessione di runtime e la lane doctor autonoma legacy `.jsonl.lock`
  sono stati rimossi.
- Il barrel di runtime Microsoft Teams e l'SDK pubblico dei Plugin non riesportano più
  il vecchio helper di file-lock; i percorsi di stato durevole dei Plugin sono supportati da SQLite.
- La potatura per età/conteggio delle sessioni e la pulizia esplicita delle sessioni sono state rimosse.
  Doctor possiede l'importazione legacy; le sessioni obsolete vengono resettate o eliminate esplicitamente.
- I controlli di integrità di doctor non contano più un file JSONL legacy come trascrizione attiva
  valida per una riga di sessione SQLite. La salute delle trascrizioni attive è solo SQLite;
  i file JSONL legacy sono segnalati come input di migrazione/pulizia orfani.
- Doctor non tratta più `agents/<agent>/sessions/` come stato di runtime richiesto.
  Scansiona quella directory solo quando esiste già, come input di importazione legacy
  o pulizia orfani.
- Gateway `sessions.resolve`, percorsi patch/reset/compact della sessione, spawning di subagent,
  abort rapido, metadati ACP, sessioni isolate da Heartbeat e patching TUI
  non migrano né potano più chiavi di sessione legacy come effetto collaterale del
  normale lavoro di runtime.
- La risoluzione della sessione dei comandi CLI ora restituisce l'`agentId` proprietario invece di uno
  `storePath` e non copia più righe legacy della main-session durante la normale
  risoluzione `--to` o `--session-id`. La canonicalizzazione delle righe main legacy appartiene
  solo a doctor.
- La risoluzione della profondità dei subagent di runtime non legge più `sessions.json` o store sessioni JSON5.
  Legge `session_entries` SQLite per id agente e i metadati legacy di profondità/sessione
  possono entrare solo attraverso il percorso di importazione di doctor.
- Gli override di sessione dei profili di autenticazione persistono tramite upsert diretti di righe `{agentId, sessionKey}`
  invece del lazy-loading di un runtime session-store a forma di file.
- Il gating verboso delle risposte automatiche e gli helper di aggiornamento sessione ora leggono/eseguono upsert delle righe
  di sessione SQLite per identità di sessione e non richiedono più un percorso store legacy
  prima di toccare lo stato persistito delle righe.
- Gli helper dei metadati di sessione command-run ora usano nomi e percorsi modulo orientati alle entry;
  la vecchia superficie helper di comando `session-store` è stata rimossa.
- Il seeding dell'header di bootstrap e l'irrobustimento del confine di Compaction manuale ora mutano
  direttamente le righe di trascrizione SQLite. I chiamanti di runtime passano l'identità della sessione, non
  percorsi `.jsonl` scrivibili.
- Il replay silenzioso della rotazione di sessione copia i turni recenti utente/assistant tramite
  `{agentId, sessionId}` dalle righe di trascrizione SQLite. Non accetta più
  localizzatori di trascrizione sorgente o destinazione.
- Le righe nuove di sessione di runtime non memorizzano più localizzatori di trascrizione. I chiamanti usano
  direttamente `{agentId, sessionId}`; i comandi di esportazione/debug possono scegliere i nomi dei file di output
  quando materializzano le righe.
- L'avvio di una nuova sessione di trascrizione persistita ora apre sempre righe SQLite per
  scope. Il session manager non riutilizza più un precedente percorso o localizzatore di trascrizione
  dell'era dei file come identità della nuova sessione.
- Le sessioni di trascrizione persistite usano l'API esplicita
  `openTranscriptSessionManagerForSession({agentId, sessionId})`. Le vecchie
  facade statiche `SessionManager.create/openForSession/list/forkFromSession` sono
  state rimosse, così test e codice di runtime non possono ricreare accidentalmente la discovery delle sessioni
  dell'era dei file.
- Il runtime dei Plugin non espone più `api.runtime.agent.session.resolveTranscriptLocatorPath`;
  il codice dei Plugin usa helper di righe SQLite e valori di scope.
- La superficie SDK pubblica `session-store-runtime` ora esporta solo helper di righe sessione
  e righe trascrizione. Gli helper mirati per schema/percorso/transazione SQLite
  vivono in `sqlite-runtime`; gli helper raw di apertura/chiusura/reset restano solo locali
  per i test first-party.
- I classificatori legacy dei nomi file `.jsonl` di trajectory/checkpoint ora vivono nel
  modulo dei file di sessione legacy di doctor. La validazione core delle sessioni non importa più
  helper di artefatti file per decidere i normali id di sessione SQLite.
- Le esecuzioni subagent bloccanti di Active Memory usano righe di trascrizione SQLite invece di
  creare file temporanei o persistiti `session.jsonl` sotto lo stato dei Plugin. La
  vecchia opzione `transcriptDir` è rimossa.
- La generazione di slug una tantum e le esecuzioni del planner Crestodian usano righe di trascrizione SQLite
  invece di creare file temporanei `session.jsonl`.
- Anche le esecuzioni helper `llm-task` e l'estrazione nascosta degli impegni usano righe di trascrizione SQLite,
  quindi queste sessioni helper solo modello non creano più file temporanei
  di trascrizione JSON/JSONL.
- `TranscriptSessionManager` ora è solo uno scope di trascrizione SQLite aperto.
  Il codice di runtime lo apre con `openTranscriptSessionManagerForSession({agentId,
sessionId})`; i flussi di create, branch, continue, list e fork vivono nei rispettivi
  helper di righe SQLite proprietari invece che in facade statiche del manager.
  Il codice di doctor/import/debug gestisce file sorgente legacy espliciti fuori dal
  session manager di runtime.
- I metodi facade obsoleti `SessionManager.newSession()` e
  `SessionManager.createBranchedSession()` sono stati rimossi. Le nuove
  sessioni e i discendenti delle trascrizioni vengono creati dal loro workflow SQLite
  proprietario invece di mutare un manager già aperto in una sessione persistita diversa.
- Le decisioni di fork della trascrizione padre e la creazione del fork non accettano più
  `storePath` o `sessionsDir`; usano lo scope della trascrizione SQLite `{agentId, sessionId}`
  invece dei metadati dei percorsi filesystem conservati.
- Memory-host non esporta più helper no-op di classificazione delle trascrizioni delle directory di sessione;
  il filtraggio delle trascrizioni ora deriva dai metadati delle righe SQLite durante la costruzione delle entry.
- I test di esportazione sessione di Memory-host e QMD usano scope di trascrizione SQLite. I vecchi
  percorsi `agents/<agentId>/sessions/*.jsonl` restano coperti solo dove un test
  sta intenzionalmente dimostrando compatibilità doctor/import/export.
- L'ispezione grezza delle sessioni di QA-lab ora usa `sessions.list` attraverso il Gateway
  invece di leggere `agents/qa/sessions/sessions.json`; il feedback MSteams
  viene aggiunto direttamente alle trascrizioni SQLite senza fabbricare un percorso JSONL.
- I turn dei canali inbound condivisi ora trasportano `{agentId, sessionKey}` invece di un
  `storePath` legacy. I percorsi di registrazione LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch e QQBot ora leggono i metadati updated-at e registrano
  le righe di sessione inbound tramite l'identità SQLite.
- La persistenza del localizzatore di trascrizione viene rimossa dalle righe di sessione attive.
  `resolveSessionTranscriptTarget` restituisce `agentId`, `sessionId` e metadati
  opzionali dell'argomento; doctor è l'unico codice che importa i nomi dei file di trascrizione legacy.
- Le intestazioni delle trascrizioni runtime partono dalla versione SQLite `1`. Gli upgrade delle vecchie
  forme JSONL V1/V2/V3 vivono solo nell'importazione di doctor e normalizzano le intestazioni importate alla
  versione corrente della trascrizione SQLite prima che le righe vengano archiviate.
- La guardia database-first ora vieta `SessionManager.listAll` e
  `SessionManager.forkFromSession`; i workflow di elenco sessioni e fork/ripristino
  devono restare sulle API SQLite per righe/con ambito.
- La guardia vieta anche i nomi legacy degli helper di parsing delle trascrizioni JSONL/riparazione del ramo attivo
  fuori dal codice doctor/import, così il runtime non può far crescere un secondo
  percorso di migrazione legacy delle trascrizioni.
- Le esecuzioni PI embedded rifiutano gli handle di trascrizione in arrivo. Usano l'identità SQLite
  `{agentId, sessionId}` prima dell'avvio del worker e di nuovo prima che il
  tentativo tocchi lo stato della trascrizione. Un input `/tmp/*.jsonl` obsoleto non può selezionare un
  target di scrittura runtime.
- Traccia cache, payload Anthropic, stream grezzo e record della timeline diagnostica
  ora scrivono su righe SQLite tipizzate `diagnostic_events`. I bundle di stabilità Gateway
  ora scrivono su righe SQLite tipizzate `diagnostic_stability_bundles`. I vecchi
  percorsi di override JSONL `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` e
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` vengono rimossi, e la normale acquisizione della stabilità
  non scrive più file `logs/stability/*.json`.
- La persistenza Cron ora riconcilia le righe SQLite `cron_jobs` invece di
  eliminare/reinserire l'intera tabella dei job a ogni salvataggio. I writeback dei target Plugin
  aggiornano direttamente le righe cron corrispondenti e mantengono lo stato cron runtime nella
  stessa transazione del database di stato.
- I chiamanti runtime Cron ora usano una chiave stabile dello store cron SQLite. I percorsi legacy
  `cron.store` sono solo input di importazione doctor; i percorsi di produzione Gateway, manutenzione task,
  stato, log di esecuzione e writeback del target Telegram usano
  `resolveCronStoreKey` e non normalizzano più la chiave come percorso. Lo stato Cron ora
  riporta `storeKey` invece del vecchio campo `storePath` a forma di file.
- Il caricamento e la pianificazione runtime Cron non normalizzano più forme di job persistite legacy
  come `jobId`, `schedule.cron`, `atMs` numerico, booleani stringa o
  `sessionTarget` mancante. L'importazione legacy di doctor possiede quelle riparazioni prima
  dell'inserimento delle righe in SQLite.
- Lo spawn ACP non risolve né persiste più percorsi di file JSONL delle trascrizioni. Lo spawn
  e la configurazione thread-bind persistono direttamente la riga di sessione SQLite e mantengono
  l'id sessione come identità di trascrizione conservata.
- Le API dei metadati di sessione ACP ora leggono/elencano/upsertano righe SQLite per `agentId` e
  non espongono più `storePath` come parte del contratto di entry di sessione ACP.
- La contabilità dell'uso delle sessioni e l'aggregazione dell'uso Gateway ora risolvono le trascrizioni
  solo tramite `{agentId, sessionId}`. La cache costi/uso e i riepiloghi delle sessioni scoperte
  non sintetizzano né restituiscono più stringhe di localizzatore della trascrizione.
- L'append chat Gateway, la persistenza abort-partial, `/sessions.send` e
  le scritture delle trascrizioni media webchat aggiungono direttamente tramite l'ambito di trascrizione SQLite.
  L'helper di iniezione trascrizione Gateway non accetta più un parametro
  `transcriptLocator`.
- La discovery delle trascrizioni SQLite ora elenca solo ambiti e statistiche delle trascrizioni:
  `{agentId, sessionId, updatedAt, eventCount}`. L'helper di compatibilità morto
  `listSqliteSessionTranscriptLocators` e il campo per riga
  `locator` sono spariti.
- Il runtime di riparazione delle trascrizioni ora espone solo
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})`. Il vecchio
  helper di riparazione basato su localizzatore viene eliminato; il codice doctor/debug legge
  percorsi espliciti dei file sorgente e non migra mai stringhe di localizzatore.
- Il runtime del ledger di replay ACP ora archivia righe di replay per sessione nel database di stato
  SQLite condiviso invece di `acp/event-ledger.json`; doctor importa e
  rimuove il file legacy.
- Gli helper di lettura delle trascrizioni Gateway ora vivono in
  `src/gateway/session-transcript-readers.ts` invece del vecchio
  nome del modulo `session-utils.fs`. Il controllo della cronologia dei retry fallback prende il nome dal
  contenuto della trascrizione SQLite invece che dalla vecchia superficie dell'helper file.
- Gli helper Gateway injected-chat e Compaction ora passano l'ambito della trascrizione SQLite
  tramite API helper interne invece di chiamare i valori percorsi di trascrizione o
  file sorgente.
- Il rilevamento della continuazione bootstrap ora controlla le righe di trascrizione SQLite tramite
  `hasCompletedBootstrapTranscriptTurn`; non espone più un nome helper a forma di file.
- I test embedded-runner ora usano l'identità della trascrizione SQLite, e l'apertura di un nuovo
  gestore trascrizioni richiede sempre un `sessionId` esplicito.
- Gli helper di indicizzazione memoria ora usano la terminologia della trascrizione SQLite dall'inizio alla fine:
  l'host esporta `listSessionTranscriptScopesForAgent` e
  `sessionTranscriptKeyForScope`, le code di sincronizzazione mirate `sessionTranscripts`,
  gli hit pubblici della ricerca sessioni espongono percorsi opachi `transcript:<agent>:<session>`,
  e la chiave sorgente DB interna è `session:<session>` sotto
  `source_kind='sessions'` invece di un finto percorso file.
- L'helper persistente di dedupe del Plugin SDK generico non espone più opzioni a forma di file.
  I chiamanti forniscono chiavi di ambito SQLite e le righe di dedupe durevoli vivono nello
  stato Plugin condiviso.
- I token SSO Microsoft Teams sono stati spostati da file JSON bloccati allo stato Plugin
  SQLite. Doctor importa `msteams-sso-tokens.json`, ricostruisce le chiavi canoniche dei token SSO
  dai payload e rimuove il file sorgente. I token OAuth delegati restano sul
  loro confine esistente dei file di credenziali privati.
- Lo stato della cache di sincronizzazione Matrix è stato spostato da `bot-storage.json` allo stato Plugin
  SQLite. Doctor importa payload di sincronizzazione legacy grezzi o wrappati e rimuove il
  file sorgente. I client Matrix e QA Matrix attivi passano una directory radice sync-store
  SQLite, non un finto percorso `sync-store.json` o `bot-storage.json`.
- Lo stato della migrazione crypto legacy Matrix è stato spostato da
  `legacy-crypto-migration.json` allo stato Plugin SQLite. Doctor importa il
  vecchio file di stato; gli snapshot IndexedDB dell'SDK Matrix sono stati spostati da
  `crypto-idb-snapshot.json` a blob Plugin SQLite. Le chiavi di recupero e
  le credenziali Matrix sono righe di stato Plugin SQLite; i loro vecchi file JSON sono solo
  input di migrazione doctor.
- I log attività Memory Wiki ora usano lo stato Plugin SQLite invece di
  `.openclaw-wiki/log.jsonl`. Il provider di migrazione Memory Wiki importa i vecchi
  log JSONL; markdown wiki e contenuti del vault utente restano basati su file come
  contenuto workspace.
- Memory Wiki non crea più `.openclaw-wiki/state.json` né la directory inutilizzata
  `.openclaw-wiki/locks`. Il provider di migrazione rimuove quei file di metadati Plugin ritirati
  se un vault più vecchio li ha ancora.
- Le voci di audit Crestodian ora usano lo stato Plugin SQLite core invece di
  `audit/crestodian.jsonl`. Doctor importa il log di audit JSONL legacy e
  lo rimuove dopo un'importazione riuscita.
- Le voci di audit di scrittura/osservazione configurazione ora usano lo stato Plugin SQLite core
  invece di `logs/config-audit.jsonl`. Doctor importa il log di audit JSONL legacy e
  lo rimuove dopo un'importazione riuscita.
- Il companion macOS non scrive più sidecar locali all'app `logs/config-audit.jsonl` o
  `logs/config-health.json` durante la modifica di `openclaw.json`. Il file di configurazione
  resta basato su file, gli snapshot di recovery restano accanto al file di configurazione,
  e lo stato durevole di audit/salute della configurazione appartiene allo store SQLite Gateway.
- Le approvazioni pendenti di rescue Crestodian ora usano lo stato Plugin SQLite core invece di
  `crestodian/rescue-pending/*.json`. Doctor importa i file di approvazione pendente legacy
  e li rimuove dopo un'importazione riuscita.
- Lo stato temporaneo arm Phone Control ora usa lo stato Plugin SQLite invece di
  `plugins/phone-control/armed.json`. Doctor importa il file legacy di armed-state
  nel namespace `phone-control/arm-state` e rimuove il file.
- Doctor non ripara più le trascrizioni JSONL sul posto né crea file JSONL di backup.
  Importa il ramo attivo in SQLite e rimuove la sorgente legacy.
- La lookup delle trascrizioni dell'hook session-memory usa letture SQLite solo con ambito
  `{agentId, sessionId}`. Il suo helper non accetta né deriva più localizzatori di trascrizione,
  letture di file legacy o opzioni di riscrittura file.
- I binding conversazione dell'app-server Codex ora indicizzano lo stato Plugin SQLite per
  chiave di sessione OpenClaw o ambito esplicito `{agentId, sessionId}`. Non devono
  preservare binding fallback basati su percorso di trascrizione.
- Le letture mirrored-history dell'app-server Codex usano solo l'ambito della trascrizione SQLite;
  non devono recuperare l'identità dai percorsi dei file di trascrizione.
- I percorsi di riordino ruoli e reset Compaction non scollegano più i vecchi file di trascrizione;
  il reset ruota solo la riga di sessione SQLite e l'identità della trascrizione.
- Le risposte di reset e checkpoint Gateway restituiscono righe di sessione pulite più id sessione.
  Non sintetizzano più localizzatori di trascrizione SQLite per i client.
- Il dreaming memory-core non elimina più righe di sessione sondando file JSONL mancanti.
  La pulizia dei subagent passa attraverso l'API runtime delle sessioni invece di
  controlli di esistenza del filesystem. I suoi test di ingestione trascrizioni seminano direttamente righe SQLite
  invece di creare fixture `agents/<id>/sessions` o placeholder di localizzatore.
- L'indicizzazione delle trascrizioni di memoria può esporre `transcript:<agentId>:<sessionId>` come
  percorso virtuale di hit di ricerca per helper di citazione/lettura. La sorgente durevole dell'indice è
  relazionale (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), quindi il valore non è un localizzatore di trascrizione runtime,
  non è un percorso filesystem e non deve mai essere ripassato alle API runtime delle sessioni.
- Lo stato memoria di Gateway doctor legge i conteggi di richiamo a breve termine e phase-signal
  da righe di stato Plugin SQLite invece di `memory/.dreams/*.json`; l'output CLI e
  doctor ora etichetta quello storage come store SQLite, non come percorso.
- Il runtime memory-core, lo stato CLI, i metodi Gateway doctor e le facade Plugin SDK
  non auditano né archiviano più file legacy `.dreams/session-corpus`.
  Quei file sono solo input di migrazione; doctor li importa in SQLite e
  elimina la sorgente dopo la verifica. Le righe di evidenza dell'ingestione sessione attiva
  ora usano il percorso SQLite virtuale `memory/session-ingestion/<day>.txt`; il runtime
  non scrive né deriva mai stato da `.dreams/session-corpus`.
- Gli artefatti pubblici memory-core espongono eventi host SQLite come artefatto JSON virtuale
  `memory/events/memory-host-events.json`; non riutilizzano più il
  percorso sorgente legacy `.dreams/events.jsonl`.
- I registri sandbox container/browser ora usano la tabella SQLite condivisa
  `sandbox_registry_entries` con colonne tipizzate per sessione, immagine, timestamp,
  backend/config e porta browser. Doctor importa file di registro JSON legacy monolitici e
  shardati e rimuove le sorgenti riuscite. Le letture runtime usano
  le colonne tipizzate delle righe come fonte di verità; `entry_json` è solo una copia di replay/debug.
- Gli impegni ora usano una tabella condivisa tipizzata `commitments` invece di un
  blob JSON dell'intero store. I salvataggi snapshot fanno upsert per id impegno ed eliminano solo
  le righe mancanti invece di svuotare e reinserire la tabella. Il runtime carica
  gli impegni da colonne tipizzate di ambito, finestra di consegna, stato, tentativo e testo;
  `record_json` è solo una copia di replay/debug. Doctor importa il legacy
  `commitments.json` e lo rimuove dopo un'importazione riuscita.
- Le definizioni dei job Cron, lo stato della pianificazione e la cronologia delle esecuzioni non hanno più writer
  o reader JSON runtime. Il runtime usa righe `cron_jobs` con pianificazione tipizzata,
  payload, delivery, failure-alert, session, status e runtime-state, più metadati tipizzati
  `cron_run_logs` per stato, riepilogo diagnostico, stato/errore di consegna,
  sessione/esecuzione, modello e totali dei token. `job_json` è solo una copia di riproduzione/debug; `state_json` mantiene diagnostica
  runtime nidificata che non ha ancora campi per query a caldo, mentre il runtime
  reidrata i campi di stato a caldo dalle colonne tipizzate. Doctor importa
  i file legacy `jobs.json`, `jobs-state.json` e `runs/*.jsonl` e rimuove
  le sorgenti importate. I writeback delle destinazioni Plugin aggiornano le righe `cron_jobs`
  corrispondenti invece di caricare e sostituire l'intero archivio cron.
- L'avvio del Gateway ignora i marker legacy `notify: true` nella proiezione
  runtime. Doctor li traduce in consegna SQLite esplicita quando
  `cron.webhook` è valido, rimuove i marker inerti quando non è impostato e li conserva
  con un avviso quando il webhook configurato non è valido.
- Le code di consegna in uscita e di sessione ora memorizzano stato della coda, tipo di voce,
  chiave di sessione, canale, destinazione, id account, conteggio dei tentativi, ultimo tentativo/errore,
  stato di recupero e marker di invio piattaforma come colonne tipizzate nella tabella condivisa
  `delivery_queue_entries`. Il recupero runtime legge quei campi a caldo dalle
  colonne tipizzate, e le mutazioni di retry/recupero aggiornano quelle colonne direttamente
  senza riscrivere il JSON di riproduzione. Il payload JSON completo resta solo come
  blob di riproduzione/debug per corpi dei messaggi e altri dati di riproduzione freddi.
- I record delle immagini in uscita gestite ora usano righe condivise tipizzate
  `managed_outgoing_image_records`, con i byte multimediali ancora archiviati in
  `media_blobs`. Il record JSON resta solo come copia di riproduzione/debug.
- Le preferenze del selettore modello di Discord, gli hash di distribuzione comandi e i binding dei thread
  ora usano lo stato Plugin SQLite condiviso. I loro piani legacy di importazione JSON vivono nella
  superficie di setup/ migrazione doctor del Plugin Discord, non nel codice di migrazione core.
- I rilevatori di import legacy dei Plugin usano moduli con nome doctor come
  `doctor-legacy-state.ts` o `doctor-state-imports.ts`; i normali moduli runtime
  dei canali non devono importare rilevatori JSON legacy.
- I cursori catchup di BlueBubbles e i marker di deduplicazione in ingresso ora usano lo stato Plugin
  SQLite condiviso. I loro piani legacy di importazione JSON vivono nella superficie di
  setup/migrazione doctor del Plugin BlueBubbles, non nel codice di migrazione core.
- Gli offset degli aggiornamenti Telegram, le righe cache degli sticker, le righe cache dei messaggi inviati,
  le righe cache dei nomi topic e i binding dei thread ora usano lo stato Plugin SQLite
  condiviso. I loro piani legacy di importazione JSON vivono nella superficie di
  setup/migrazione doctor del Plugin Telegram, non nel codice di migrazione core.
- I cursori catchup di iMessage, le mappature reply short-id e le righe di deduplicazione sent-echo
  ora usano lo stato Plugin SQLite condiviso. I vecchi file `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` e `imessage/sent-echoes.jsonl` sono
  solo input doctor.
- Le righe di deduplicazione dei messaggi Feishu ora usano lo stato Plugin SQLite condiviso invece dei
  file `feishu/dedup/*.json`. Il relativo piano legacy di importazione JSON vive nella superficie di
  setup/migrazione doctor del Plugin Feishu, non nel codice di migrazione core.
- Conversazioni, sondaggi, buffer di caricamento in sospeso e apprendimenti di feedback di Microsoft Teams
  ora usano tabelle condivise SQLite di stato/blob dei Plugin. Il percorso di caricamento in sospeso
  usa `plugin_blob_entries`, quindi i buffer multimediali sono archiviati come BLOB SQLite
  invece che come JSON base64. I nomi degli helper runtime ora usano la denominazione SQLite/stato
  invece della denominazione file-store `*-fs`, e il vecchio shim `storePath` è stato rimosso
  da questi store. Il relativo piano legacy di importazione JSON vive nella superficie di
  setup/migrazione doctor del Plugin Microsoft Teams.
- I media in uscita ospitati da Zalo ora usano `plugin_blob_entries` SQLite condiviso
  invece dei sidecar temporanei JSON/bin `openclaw-zalo-outbound-media`.
- L'HTML e i metadati del visualizzatore diff ora usano `plugin_blob_entries` SQLite condiviso
  invece dei file temporanei `meta.json`/`viewer.html`. Gli output PNG/PDF renderizzati restano
  materializzazioni temporanee perché la consegna del canale richiede ancora un percorso file.
- I documenti gestiti Canvas ora usano `plugin_blob_entries` SQLite condiviso
  invece di una directory predefinita `state/canvas/documents`. L'host Canvas serve quei
  blob direttamente; i file locali vengono creati solo per contenuti operatore espliciti `host.root`
  o per materializzazione temporanea quando un lettore multimediale a valle
  richiede un percorso.
- Le decisioni di audit di File Transfer ora usano `plugin_state_entries` SQLite condiviso
  invece del log runtime illimitato `audit/file-transfer.jsonl`. Doctor
  importa il file di audit JSONL legacy nello stato Plugin e rimuove la sorgente
  dopo un'importazione pulita.
- I lease di processo ACPX e l'identità dell'istanza gateway ora usano lo stato Plugin SQLite
  condiviso. Doctor importa il file legacy `gateway-instance-id` nello stato Plugin
  e rimuove la sorgente.
- Gli script wrapper generati da ACPX e la home Codex isolata sono materializzazione temporanea
  sotto la root temporanea OpenClaw, non stato durevole OpenClaw. I
  record runtime ACPX durevoli sono le righe SQLite lease e gateway-instance;
  la vecchia superficie di configurazione ACPX `stateDir` è rimossa perché nessuno stato runtime
  viene più scritto lì.
- Gli allegati multimediali del Gateway ora usano la tabella SQLite condivisa `media_blobs` come
  archivio byte canonico. I percorsi locali restituiti alle superfici di compatibilità
  canale e sandbox sono materializzazioni temporanee della riga database, non
  l'archivio multimediale durevole. Le allowlist multimediali runtime non includono più le root legacy
  `$OPENCLAW_STATE_DIR/media` o `media` della directory di configurazione; quelle directory sono
  solo sorgenti di importazione doctor.
- Il completamento shell non scrive più file cache `$OPENCLAW_STATE_DIR/completions/*`.
  I percorsi smoke di installazione, doctor, aggiornamento e rilascio usano output di
  completamento generato o sourcing del profilo invece di file cache di completamento
  durevoli.
- Lo staging degli upload di Skills del Gateway ora usa righe condivise `skill_uploads`. I metadati
  di upload, le chiavi di idempotenza e i byte degli archivi vivono in SQLite; l'installer
  riceve solo un percorso archivio materializzato temporaneamente mentre un'installazione è
  in corso.
- Gli allegati inline dei subagent non vengono più materializzati sotto
  `.openclaw/attachments/*` del workspace. Il percorso spawn prepara voci seed SQLite VFS,
  le esecuzioni inline seminano quelle voci nello spazio dei nomi scratch runtime per-agent,
  e gli strumenti basati su disco sovrappongono quello scratch SQLite per i percorsi degli allegati. Le
  vecchie colonne registry attachment-dir delle esecuzioni subagent e gli hook di pulizia sono stati rimossi.
- L'idratazione immagini della CLI non mantiene più file cache stabili `openclaw-cli-images`.
  I backend CLI esterni ricevono ancora percorsi file, ma quei percorsi sono
  materializzazioni temporanee per-esecuzione con pulizia.
- Diagnostica cache-trace, diagnostica payload Anthropic, diagnostica stream modello grezzo,
  eventi timeline diagnostici e bundle di stabilità Gateway ora
  scrivono righe SQLite invece di file `logs/*.jsonl` o
  `logs/stability/*.json`.
  I flag e le variabili d'ambiente di override dei percorsi runtime sono stati rimossi; i comandi
  export/debug possono materializzare file esplicitamente dalle righe database.
- Il companion macOS non ha più un writer continuativo `diagnostics.jsonl`. I log dell'app
  vanno al logging unificato, e la diagnostica durevole del Gateway resta basata su SQLite.
- L'elenco dei record port-guardian macOS ora usa righe condivise SQLite tipizzate
  `macos_port_guardian_records` invece di un file JSON in Application Support
  o di un blob singleton opaco.
- I lock singleton Gateway ora usano righe condivise SQLite tipizzate `state_leases` sotto
  lo scope `gateway_locks` invece di file lock nella directory temporanea. La documentazione di troubleshooting
  Fly e OAuth ora punta al lease SQLite/lock di refresh auth invece che alla
  pulizia obsoleta dei file lock.
- Lo stato sentinel di riavvio Gateway ora usa righe condivise SQLite tipizzate
  `gateway_restart_sentinel` invece di `restart-sentinel.json`; il runtime
  legge tipo sentinel, stato, routing, messaggio, continuazione e statistiche dalle
  colonne tipizzate. `payload_json` è solo una copia di riproduzione/debug. Il codice runtime cancella
  direttamente la riga SQLite e non porta più con sé plumbing di pulizia file.
- L'intento di riavvio Gateway e lo stato di handoff del supervisor ora usano righe condivise
  SQLite tipizzate `gateway_restart_intent` e `gateway_restart_handoff` invece dei
  sidecar `gateway-restart-intent.json` e
  `gateway-supervisor-restart-handoff.json`.
- Il coordinamento singleton Gateway ora usa righe tipizzate `state_leases` sotto
  `gateway_locks` invece di scrivere file `gateway.<hash>.lock`. La riga lease
  possiede proprietario del lock, scadenza, heartbeat e payload di debug; SQLite possiede il
  confine atomico di acquisizione/rilascio. L'opzione directory file-lock ritirata è
  stata rimossa; i test usano direttamente l'identità della riga SQLite.
- Il vecchio helper non referenziato di report utilizzo cron che scansionava i file `cron/runs/*.jsonl`
  è stato eliminato. I report della cronologia delle esecuzioni Cron devono leggere le righe SQLite tipizzate
  `cron_run_logs`.
- Il recupero del riavvio della sessione principale ora scopre gli agent candidati tramite il
  registry SQLite `agent_databases` invece di scansionare le directory `agents/*/sessions`.
- Il recupero da corruzione sessione Gemini ora elimina solo la riga sessione SQLite;
  non richiede più un gate legacy `storePath` né tenta di scollegare un percorso
  JSONL di trascrizione derivato.
- La gestione degli override dei percorsi ora tratta i valori ambiente letterali `undefined`/`null`
  come non impostati, impedendo database accidentali `undefined/state/*.sqlite`
  nella root repo durante test o handoff shell.
- Le fingerprint di salute configurazione ora usano righe condivise SQLite tipizzate `config_health_entries`
  invece di `logs/config-health.json`, mantenendo il normale file di configurazione come
  unico documento di configurazione non credenziale. Il companion macOS mantiene solo
  stato di salute process-local e non ricrea il vecchio sidecar JSON.
- Il runtime dei profili auth non importa né scrive più file JSON di credenziali. Lo
  store canonico delle credenziali è SQLite; `auth-profiles.json`, `auth.json` per-agent
  e `credentials/oauth.json` condiviso sono input di migrazione doctor
  rimossi dopo l'importazione.
- I test di salvataggio/stato dei profili auth ora verificano direttamente tabelle auth SQLite tipizzate
  e usano i nomi file auth-profile legacy solo per input di migrazione doctor.
- `openclaw secrets apply` ripulisce solo il file di configurazione, il file env e lo
  store auth-profile SQLite. Non contiene più logica di compatibilità che modifica
  `auth.json` per-agent ritirato; doctor possiede l'importazione e l'eliminazione di quel file.
- I piani di migrazione secret Hermes e le applicazioni importano i profili API-key direttamente
  nello store auth-profile SQLite. Non scrive né verifica più
  `auth-profiles.json` come destinazione intermedia.
- La documentazione auth rivolta agli utenti ora descrive
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` invece di
  dire agli utenti di ispezionare o copiare `auth-profiles.json`; i nomi JSON OAuth/auth
  legacy restano documentati solo come input di importazione doctor.
- Gli helper core per i percorsi di stato non espongono più il file ritirato `credentials/oauth.json`.
  Il nome file legacy è locale al percorso di import auth doctor.
- La documentazione di installazione, sicurezza, onboarding, model-auth e SecretRef ora descrive
  righe auth-profile SQLite e backup/migrazione dell'intero stato invece di
  file JSON auth-profile per-agent.
- La discovery dei modelli PI ora passa credenziali canoniche nello storage auth in memoria
  `pi-coding-agent`. Non crea, ripulisce né scrive più
  `auth.json` per-agent durante la discovery.
- Le impostazioni di trigger e routing di Voice Wake ora usano tabelle condivise SQLite tipizzate
  invece di `settings/voicewake.json`, `settings/voicewake-routing.json` o
  righe generiche opache; doctor importa i file JSON legacy e li rimuove dopo una
  migrazione riuscita.
- Lo stato update-check ora usa una riga condivisa tipizzata `update_check_state` invece di
  `update-check.json` o un blob generico opaco; doctor importa
  il file JSON legacy e lo rimuove dopo una migrazione riuscita.
- Lo stato di salute configurazione ora usa righe condivise tipizzate `config_health_entries` invece
  di `logs/config-health.json` o un blob generico opaco; doctor
  importa il file JSON legacy e lo rimuove dopo una migrazione riuscita.
- Le approvazioni dei binding conversazione Plugin ora usano righe tipizzate
  `plugin_binding_approvals` invece di stato SQLite condiviso opaco o
  `plugin-binding-approvals.json`; il file legacy è un input di migrazione di doctor.
- I binding generici della conversazione corrente ora archiviano righe tipizzate
  `current_conversation_bindings` invece di riscrivere
  `bindings/current-conversations.json`; doctor importa il file JSON legacy e
  lo rimuove dopo una migrazione riuscita.
- I ledger di sincronizzazione delle fonti importate di Memory Wiki ora archiviano una riga di stato Plugin SQLite
  per ogni chiave vault/fonte invece di riscrivere `.openclaw-wiki/source-sync.json`;
  il provider di migrazione importa e rimuove il ledger JSON legacy.
- I record delle esecuzioni di importazione ChatGPT di Memory Wiki ora archiviano una riga di stato Plugin SQLite
  per ogni id vault/esecuzione invece di scrivere `.openclaw-wiki/import-runs/*.json`.
  Gli snapshot di rollback restano file espliciti del vault finché l'archiviazione degli snapshot
  delle esecuzioni di importazione non viene spostata nell'archiviazione blob.
- I digest compilati di Memory Wiki ora archiviano righe blob Plugin SQLite invece di
  scrivere `.openclaw-wiki/cache/agent-digest.json` e
  `.openclaw-wiki/cache/claims.jsonl`. Il provider di migrazione importa i vecchi file di cache
  e rimuove la directory della cache quando diventa vuota.
- Il tracciamento dell'installazione delle skill di ClawHub ora archivia una riga di stato Plugin SQLite per
  workspace/skill invece di scrivere o leggere i sidecar `.clawhub/lock.json` e
  `.clawhub/origin.json` a runtime. Il codice runtime usa oggetti di stato delle installazioni tracciate
  invece di astrazioni lockfile/origin con forma di file. Doctor
  importa i sidecar legacy dai workspace degli agenti configurati e li rimuove
  dopo un'importazione pulita.
- L'indice dei Plugin installati ora legge e scrive la riga singleton SQLite condivisa tipizzata
  `installed_plugin_index` invece di `plugins/installs.json`; il
  file JSON legacy è solo un input di migrazione di doctor e viene rimosso dopo l'importazione.
- L'helper del percorso legacy `plugins/installs.json` ora vive nel codice legacy di doctor.
  I moduli runtime dell'indice Plugin espongono solo opzioni di persistenza basate su SQLite,
  non un percorso file JSON.
- Il sentinel di riavvio del Gateway, l'intento di riavvio e lo stato di handoff del supervisor ora usano
  righe SQLite condivise tipizzate (`gateway_restart_sentinel`,
  `gateway_restart_intent` e `gateway_restart_handoff`) invece di blob opachi
  generici. Il codice runtime di riavvio non ha alcun contratto sentinel/intento/handoff
  con forma di file.
- La cache di sincronizzazione Matrix, i metadati di archiviazione, i binding dei thread, i marker di deduplicazione in ingresso,
  lo stato di cooldown della verifica di avvio, gli snapshot crittografici SDK IndexedDB,
  le credenziali e le chiavi di ripristino ora usano tabelle di stato/blob Plugin SQLite
  condivise. Le struct dei percorsi runtime non espongono più un percorso di metadati `storage-meta.json`;
  quel nome file è solo un input di migrazione legacy. Il loro piano di importazione JSON legacy
  vive nella superficie di setup/migrazione doctor del Plugin Matrix.
- L'avvio di Matrix non scandisce, segnala o completa più lo stato file Matrix
  legacy. Il rilevamento dei file Matrix, la creazione di snapshot crittografici legacy, lo stato di migrazione
  del ripristino delle chiavi delle stanze, l'importazione e la rimozione delle fonti sono tutti di proprietà di doctor.
- I barrel di migrazione runtime di Matrix sono stati rimossi. Gli helper legacy di rilevamento
  e mutazione di stato/crittografia vengono importati direttamente da Matrix doctor invece di essere
  parte della superficie API runtime.
- I marker di riuso degli snapshot di migrazione Matrix ora vivono nello stato Plugin SQLite
  invece che in `matrix/migration-snapshot.json`; doctor può ancora riusare lo stesso
  archivio pre-migrazione verificato senza scrivere un file di stato sidecar.
- I cursori del bus Nostr e lo stato di pubblicazione del profilo ora usano lo stato Plugin SQLite
  condiviso. Il loro piano di importazione JSON legacy vive nella superficie di setup/migrazione doctor
  del Plugin Nostr.
- Gli interruttori di sessione di Active Memory ora usano lo stato Plugin SQLite condiviso invece di
  `session-toggles.json`; riattivare la memoria elimina la riga invece di
  riscrivere un oggetto JSON.
- Le proposte e i contatori di revisione di Skill Workshop ora usano lo stato Plugin SQLite condiviso
  invece degli archivi per workspace `skill-workshop/<workspace>.json`. Ogni
  proposta è una riga separata sotto `skill-workshop/proposals`, e il contatore di revisione
  è una riga separata sotto `skill-workshop/reviews`.
- Le esecuzioni dei subagent revisori di Skill Workshop ora usano il resolver runtime dei transcript
  di sessione invece di creare percorsi di sessione sidecar `skill-workshop/<sessionId>.json`.
- I lease di processo ACPX ora usano lo stato Plugin SQLite condiviso sotto
  `acpx/process-leases` invece di un registro whole-file `process-leases.json`.
  Ogni lease viene archiviato come riga propria, preservando la raccolta dei processi obsoleti
  all'avvio senza un percorso runtime di riscrittura JSON.
- Gli script wrapper ACPX e la home Codex isolata vengono generati nella root temporanea
  di OpenClaw. Vengono ricreati secondo necessità e non sono input di backup o
  migrazione.
- La persistenza del registro delle esecuzioni dei subagent usa righe condivise tipizzate `subagent_runs`. Il
  vecchio percorso `subagents/runs.json` ora è solo un input di migrazione di doctor, e
  i nomi degli helper runtime non descrivono più il livello di stato come basato su disco.
  I test runtime non creano più fixture `runs.json` non valide o vuote per dimostrare
  il comportamento del registro; seminano/leggono direttamente righe SQLite.
- Backup allestisce la directory di stato prima dell'archiviazione, copia i file non database,
  crea snapshot dei database `*.sqlite` con `VACUUM INTO`, omette i sidecar WAL/SHM
  live, registra i metadati dello snapshot nel manifest dell'archivio e registra
  le esecuzioni di backup completate in SQLite con il manifest dell'archivio. `openclaw backup
create` convalida per impostazione predefinita l'archivio scritto; `--no-verify` è il
  percorso rapido esplicito.
- `openclaw backup restore` convalida l'archivio prima dell'estrazione, riusa il
  manifest normalizzato del verificatore e ripristina gli asset del manifest verificati nei loro
  percorsi sorgente registrati. Richiede `--yes` per le scritture e supporta `--dry-run`
  per un piano di ripristino.
- Il vecchio filtro dei percorsi volatili di backup è eliminato. Backup non ha più bisogno di una
  skip list live-tar per file JSON/JSONL legacy di sessione o Cron perché gli snapshot SQLite
  vengono allestiti prima della creazione dell'archivio.
- La preparazione del workspace di setup semplice e onboarding non crea più
  directory `agents/<agentId>/sessions/`. Creano solo config/workspace;
  le righe di sessione SQLite e le righe transcript vengono create on demand nel
  database per agente.
- La riparazione delle autorizzazioni di sicurezza ora prende di mira i database SQLite globali e per agente
  più i sidecar WAL/SHM invece di `sessions.json` e dei file transcript
  JSONL.
- I nomi runtime del registro sandbox ora descrivono direttamente i tipi di registro SQLite
  invece di portare la terminologia del registro JSON legacy attraverso l'archivio attivo.
- `openclaw reset --scope config+creds+sessions` rimuove i database
  `openclaw-agent.sqlite` per agente più i sidecar WAL/SHM, non solo le directory legacy
  `sessions/`.
- Gli helper di sessione aggregata del Gateway ora usano nomi orientati alle voci:
  `loadCombinedSessionEntriesForGateway` restituisce `{ databasePath, entries }`.
  La vecchia denominazione combined-store è stata rimossa dai chiamanti runtime.
- Il seeding del canale Docker MCP ora scrive la riga di sessione principale e gli eventi transcript
  nel database SQLite per agente invece di creare
  `sessions.json` e un transcript JSONL.
- L'hook bundled session-memory ora risolve il contesto della sessione precedente da
  SQLite tramite `{agentId, sessionId}`. Non scandisce, archivia o sintetizza più
  percorsi transcript o directory `workspace/sessions`.
- L'hook bundled command-logger ora scrive righe di audit dei comandi nella tabella SQLite condivisa
  `command_log_entries` invece di accodare a
  `logs/commands.log`.
- Le allowlist di pairing dei canali ora espongono solo helper di lettura/scrittura basati su SQLite a
  runtime e nell'SDK Plugin. Il vecchio resolver di percorso `*-allowFrom.json` e
  il lettore file vivono solo sotto il codice di importazione legacy di doctor.
- `migration_runs` registra le esecuzioni di migrazione dello stato legacy con stato,
  timestamp e report JSON.
- `migration_sources` registra ogni fonte file legacy importata con hash, dimensione,
  conteggio record, tabella di destinazione, id esecuzione, stato e stato di rimozione della fonte.
- `backup_runs` registra percorsi degli archivi di backup, stato e manifest JSON.
- Lo schema globale non mantiene una tabella di registro `agents` inutilizzata. La scoperta dei
  database degli agenti è il registro canonico `agent_databases` finché il runtime
  non avrà un vero owner dei record agente.
- La config generata del catalogo modelli è archiviata in righe SQLite globali tipizzate
  `agent_model_catalogs` indicizzate per directory agente. I chiamanti runtime usano
  `ensureOpenClawModelCatalog`; non esiste una API di compatibilità `models.json` nel
  codice runtime. L'implementazione scrive SQLite e il registro PI embedded viene
  idratato da quel payload archiviato senza creare un file `models.json`.
- L'esportazione markdown dei transcript di sessione QMD e la config `memory.qmd.sessions` sono state
  rimosse. Non esiste alcuna raccolta di transcript QMD, nessun percorso runtime
  `qmd/sessions*` e nessun bridge di memoria di sessione basato su file.
- Il runtime memory-core importa gli helper di indicizzazione dei transcript SQLite da
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, non dal
  sottopercorso SDK QMD. Il sottopercorso QMD mantiene un re-export di compatibilità solo per
  chiamanti esterni finché una pulizia major dell'SDK non potrà rimuoverlo.
- L'`index.sqlite` proprio di QMD ora è una materializzazione runtime temporanea basata sulla
  tabella SQLite principale `plugin_blob_entries`. Il runtime non crea più un sidecar durevole
  `~/.openclaw/agents/<agentId>/qmd`.
- Il Plugin opzionale `memory-lancedb` non crea più
  `~/.openclaw/memory/lancedb` come archivio implicito gestito da OpenClaw. È un
  backend LanceDB esterno e resta disabilitato finché l'operatore non configura un
  `dbPath` esplicito.
- `check:database-first-legacy-stores` fallisce con nuovo sorgente runtime che associa
  nomi di archivi legacy ad API filesystem in stile scrittura. Fallisce anche con sorgente runtime
  che reintroduce i marker del bridge transcript ritirato
  `transcriptLocator` o `sqlite-transcript://...`. Il codice di migrazione, doctor, importazione
  ed esportazione esplicita non di sessione resta consentito. Nomi di contratto legacy più ampi
  come `sessionFile`, `storePath` e le vecchie facciate dell'era file `SessionManager`
  hanno ancora owner correnti e richiedono lavoro separato sulle guardie di migrazione
  prima di poter diventare un controllo preflight obbligatorio. La guardia ora copre anche
  gli archivi runtime `cache/*.json`, i sidecar generici
  `thread-bindings.json`, lo stato/log esecuzioni JSON di Cron, il JSON di salute della config,
  i sidecar di riavvio e lock, le impostazioni Voice Wake, le approvazioni dei binding Plugin,
  il JSON dell'indice dei Plugin installati, il JSONL di audit di File Transfer, i log attività di Memory Wiki,
  il vecchio log di testo bundled `command-logger` e le manopole diagnostiche JSONL raw-stream pi-mono.
  Vieta anche i vecchi nomi di moduli legacy doctor a livello root, così
  il codice di compatibilità resta sotto `src/commands/doctor/`. Anche gli handler di debug Android
  usano output logcat/in-memory invece di allestire file di cache `camera_debug.log` o
  `debug_logs.txt`.

## Forma dello schema di destinazione

Mantieni gli schemi espliciti. Lo stato di runtime di proprietà dell'host usa tabelle tipizzate. Lo stato opaco di proprietà dei Plugin usa `plugin_state_entries` / `plugin_blob_entries`; non esiste una tabella host generica `kv`.

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

La ricerca futura può aggiungere tabelle FTS senza modificare le tabelle canoniche degli eventi:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

I valori di grandi dimensioni dovrebbero usare colonne `blob`, non la codifica come stringhe JSON. Mantieni `value_json` per piccoli dati strutturati che devono restare ispezionabili con i normali strumenti SQLite.

`agent_databases` è il registro canonico per questo ramo. Non aggiungere una tabella `agents` finché non esiste un vero proprietario dei record degli agenti; la configurazione degli agenti resta in `openclaw.json`.

## Forma della migrazione Doctor

Doctor dovrebbe chiamare un unico passaggio di migrazione esplicito, rendicontabile e sicuro da rieseguire:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` richiama l'implementazione della migrazione dello stato dopo il normale preflight della configurazione e crea un backup verificato prima dell'importazione. L'avvio del runtime e `openclaw migrate` non devono importare file di stato legacy di OpenClaw.

Proprietà della migrazione:

- Un solo passaggio di migrazione individua tutte le sorgenti di file legacy e produce un piano prima di modificare qualsiasi cosa.
- Doctor crea un archivio di backup pre-migrazione verificato prima di importare i file legacy.
- Le importazioni sono idempotenti e indicizzate per percorso sorgente, mtime, dimensione, hash e tabella di destinazione.
- I file sorgente importati con successo vengono rimossi o archiviati dopo il commit del database di destinazione.
- Le importazioni non riuscite lasciano intatta la sorgente e registrano un avviso in `migration_runs`.
- Il codice runtime legge solo da SQLite dopo che la migrazione esiste.
- Non è richiesto alcun percorso di downgrade/esportazione verso file runtime.

## Inventario della migrazione

Sposta questi elementi nel database globale:

- Le scritture runtime del registro attività ora usano il database condiviso; l’importatore
  sidecar `tasks/runs.sqlite` non distribuito è stato eliminato. I salvataggi degli snapshot
  eseguono upsert per id attività ed eliminano solo le righe attività/consegna mancanti.
- Le scritture runtime di Task Flow ora usano il database condiviso; l’importatore
  sidecar `tasks/flows/registry.sqlite` non distribuito è stato eliminato. I salvataggi
  degli snapshot eseguono upsert per id flusso ed eliminano solo le righe flusso mancanti.
- Le scritture runtime dello stato dei Plugin ora usano il database condiviso; l’importatore
  sidecar `plugin-state/state.sqlite` non distribuito è stato eliminato.
- La ricerca nella memoria integrata non usa più come valore predefinito `memory/<agentId>.sqlite`; le sue
  tabelle indice vivono nel database dell’agente proprietario, e l’opt-in sidecar esplicito
  `memorySearch.store.path` è stato ritirato nella migrazione della configurazione doctor.
- La reindicizzazione della memoria integrata reimposta solo le tabelle di proprietà della memoria nel database agente.
  Non deve sostituire l’intero file SQLite, perché lo stesso database possiede
  sessioni, trascrizioni, righe VFS, artefatti e cache runtime.
- Registri sandbox di container/browser da JSON monolitici e suddivisi. Le scritture runtime
  ora usano il database condiviso; l’importazione JSON legacy rimane.
- Le definizioni dei job Cron, lo stato della pianificazione e la cronologia delle esecuzioni ora usano SQLite condiviso;
  doctor importa/rimuove i file legacy `jobs.json`, `jobs-state.json` e
  `cron/runs/*.jsonl`
- Identità/autenticazione dispositivo, push, controllo aggiornamenti, commitment, cache modelli OpenRouter,
  indice dei Plugin installati e binding app-server
- I record di abbinamento e bootstrap dispositivo/nodo ora usano tabelle SQLite tipizzate
- I sottoscrittori delle notifiche device-pair e i marker delle richieste consegnate ora usano la
  tabella plugin-state SQLite condivisa invece di `device-pair-notify.json`.
- I record delle chiamate vocali ora usano la tabella plugin-state SQLite condivisa nello
  spazio dei nomi `voice-call` / `calls` invece di `calls.jsonl`; la CLI del Plugin
  segue e riepiloga la cronologia chiamate basata su SQLite.
- Le sessioni Gateway QQBot, i record utente noti e la cache citazioni ref-index ora usano
  lo stato Plugin SQLite negli spazi dei nomi `qqbot` (`gateway-sessions`,
  `known-users`, `ref-index`) invece di `session-*.json`, `known-users.json`
  e `ref-index.jsonl`. Quei file legacy sono cache e non vengono migrati.
- Le preferenze del selettore modelli Discord, gli hash di distribuzione comandi e i binding dei thread
  ora usano lo stato Plugin SQLite negli spazi dei nomi `discord`
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  invece di `model-picker-preferences.json`, `command-deploy-cache.json` e
  `thread-bindings.json`; la migrazione doctor/setup di Discord importa e
  rimuove i file legacy.
- I cursori di recupero BlueBubbles e i marker di deduplicazione in ingresso ora usano lo stato Plugin SQLite
  negli spazi dei nomi `bluebubbles` (`catchup-cursors`, `inbound-dedupe`)
  invece di `bluebubbles/catchup/*.json` e
  `bluebubbles/inbound-dedupe/*.json`; la migrazione doctor/setup di BlueBubbles
  importa e rimuove i file legacy.
- Gli offset degli aggiornamenti Telegram, le voci della cache sticker, le voci della cache messaggi della catena di risposte,
  le voci della cache messaggi inviati, le voci della cache nomi argomento e i binding dei thread
  ora usano lo stato Plugin SQLite negli spazi dei nomi `telegram`
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) invece di `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` e
  `thread-bindings-*.json`; la migrazione doctor/setup di Telegram importa e
  rimuove i file legacy.
- I cursori di recupero iMessage, le mappature reply short-id e le righe di deduplicazione sent-echo
  ora usano lo stato Plugin SQLite negli spazi dei nomi `imessage` (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) invece di `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` e `imessage/sent-echoes.jsonl`; la migrazione
  doctor/setup di iMessage importa e rimuove i file legacy.
- Le conversazioni, i sondaggi, i token SSO e gli apprendimenti dai feedback di Microsoft Teams ora
  usano spazi dei nomi dello stato Plugin SQLite (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) invece di `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` e `*.learnings.json`; la
  migrazione doctor/setup di Microsoft Teams importa e archivia i file legacy.
  I caricamenti in sospeso sono una cache SQLite di breve durata e i vecchi file cache JSON
  non vengono migrati.
- La cache di sincronizzazione Matrix, i metadati di storage, i binding dei thread, i marker di deduplicazione in ingresso,
  lo stato cooldown della verifica all’avvio, le credenziali, le chiavi di recupero e gli snapshot crittografici IndexedDB dell’SDK
  ora usano spazi dei nomi stato/blob Plugin SQLite sotto
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  invece di `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` e `crypto-idb-snapshot.json`; la migrazione doctor/setup di Matrix
  importa e rimuove quei file legacy dalle radici di storage Matrix con ambito account.
- I cursori del bus Nostr e lo stato di pubblicazione del profilo ora usano lo stato Plugin SQLite negli
  spazi dei nomi `nostr` (`bus-state`, `profile-state`) invece di
  `bus-state-*.json` e `profile-state-*.json`; la migrazione doctor/setup di Nostr
  importa e rimuove i file legacy.
- Gli interruttori di sessione Active Memory ora usano lo stato Plugin SQLite sotto
  `active-memory/session-toggles` invece di `session-toggles.json`.
- Le code delle proposte e i contatori di revisione di Skill Workshop ora usano lo stato Plugin SQLite
  sotto `skill-workshop/proposals` e `skill-workshop/reviews` invece dei file
  per workspace `skill-workshop/<workspace>.json`.
- Le code di consegna in uscita e di consegna sessione ora condividono la tabella SQLite globale
  `delivery_queue_entries` sotto nomi di coda separati
  (`outbound-delivery`, `session-delivery`) invece dei file durevoli
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` e
  `session-delivery-queue/*.json`. Il passaggio legacy-state di doctor importa
  le righe in sospeso e non riuscite, rimuove i marker consegnati obsoleti ed elimina i vecchi
  file JSON dopo l’importazione. I campi di routing hot e retry sono colonne tipizzate; il
  payload JSON viene mantenuto solo per replay/debug.
- I lease di processo ACPX ora usano lo stato Plugin SQLite sotto `acpx/process-leases`
  invece di `process-leases.json`.
- Metadati delle esecuzioni di backup e migrazione

Sposta questi nei database agente:

- Radici delle sessioni agente e payload session-entry in forma compatibile. Completato per
  le scritture runtime: i metadati hot di sessione sono interrogabili in `sessions`, mentre il
  payload completo `SessionEntry` in forma legacy rimane in `session_entries`.
- Eventi di trascrizione agente. Completato per le scritture runtime.
- Checkpoint di Compaction e snapshot delle trascrizioni. Completato per le scritture runtime:
  le copie delle trascrizioni dei checkpoint sono righe di trascrizione SQLite e i metadati dei checkpoint
  sono registrati in `transcript_snapshots`. Gli helper di checkpoint Gateway
  ora chiamano questi valori snapshot delle trascrizioni invece di file sorgente.
- Spazi dei nomi scratch/workspace VFS agente. Completato per le scritture VFS runtime.
- Payload degli allegati dei sottoagenti. Completato per le scritture runtime: sono voci seed VFS
  SQLite e mai file workspace durevoli.
- Artefatti degli strumenti. Completato per le scritture runtime.
- Artefatti di esecuzione. Completato per le scritture runtime worker tramite la tabella per agente
  `run_artifacts`.
- Cache runtime locali all’agente. Completato per le scritture cache con ambito runtime worker tramite
  la tabella per agente `cache_entries`. Le cache modelli a livello Gateway restano nel
  database globale a meno che non diventino specifiche dell’agente.
- Log degli stream parent ACP. Completato per le scritture runtime.
- Sessioni del registro di replay ACP. Completato per le scritture runtime tramite
  `acp_replay_sessions` e `acp_replay_events`; il legacy `acp/event-ledger.json`
  rimane solo come input doctor.
- Metadati sessione ACP. Completato per le scritture runtime tramite `acp_sessions`; i blocchi legacy
  `entry.acp` in `sessions.json` sono solo input di migrazione doctor.
- Sidecar di traiettoria quando non sono file di esportazione espliciti. Completato per le scritture
  runtime: l’acquisizione della traiettoria scrive righe `trajectory_runtime_events`
  nel database agente e replica gli artefatti con ambito esecuzione in SQLite. I sidecar legacy sono solo
  input di importazione doctor; l’esportazione può materializzare nuovi output JSONL per support-bundle
  ma non legge né migra vecchi sidecar di traiettoria/trascrizione a runtime.
  L’acquisizione runtime della traiettoria espone l’ambito SQLite; gli helper dei percorsi JSONL sono
  isolati al supporto export/debug e non vengono riesportati dal modulo runtime.
  I metadati di traiettoria dell’embedded-runner registrano l’identità `{agentId, sessionId, sessionKey}`
  invece di persistere un localizzatore di trascrizione.

Mantieni questi basati su file per ora:

- `openclaw.json`
- file delle credenziali provider o CLI
- manifest di Plugin/package
- workspace utente e repository Git quando è selezionata la modalità disco
- log destinati al tailing da parte dell’operatore, a meno che una specifica superficie di log venga spostata

## Piano di migrazione

### Fase 0: Congelare il confine

Rendi esplicito il confine dello stato durevole prima di spostare altre righe:

- Aggiungi una tabella `migration_runs` al database globale.
  Completato per i report di esecuzione della migrazione legacy-state.
- Aggiungi un unico servizio di migrazione stato di proprietà di doctor per l’importazione da file a database.
  Completato: `openclaw doctor --fix` usa l’implementazione di migrazione legacy-state.
- Rendi `plan` in sola lettura e fai in modo che `apply` crei un backup, importi, verifichi e
  poi elimini o metta in quarantena i vecchi file.
  Completato: doctor crea un backup pre-migrazione verificato, passa il percorso del backup
  a `migration_runs` e riusa i percorsi di importazione/rimozione.
- Aggiungi divieti statici in modo che il nuovo codice runtime non possa scrivere file di stato legacy mentre
  il codice di migrazione e i test possono ancora inizializzarli/leggerli.
  Completato per gli store legacy attualmente migrati; la guardia analizza anche i test annidati
  per contratti vietati dei localizzatori di trascrizione runtime.

### Fase 1: Completare il control plane globale

Mantieni lo stato di coordinamento condiviso in `state/openclaw.sqlite`:

- Agenti e registro dei database agente
- Ledger Task e Task Flow
- Stato Plugin
- Registro sandbox di container/browser
- Cronologia esecuzioni Cron/scheduler
- Abbinamento, dispositivo, push, controllo aggiornamenti, TUI, cache OpenRouter/modelli e altro
  piccolo stato runtime con ambito Gateway
- Metadati di backup e migrazione
- Byte degli allegati multimediali Gateway. Completato per le scritture runtime; i percorsi file diretti
  sono materializzazioni temporanee per compatibilità con i mittenti dei canali e lo staging sandbox.
  Le allowlist runtime accettano percorsi di materializzazione SQLite, non radici media legacy
  di stato/config. Doctor importa i file media legacy in
  `media_blobs` e rimuove i file sorgente dopo la scrittura riuscita delle righe.
- Sessioni, eventi e blob payload dell’acquisizione debug proxy. Completato: le acquisizioni vivono
  nel DB di stato condiviso e si aprono tramite bootstrap, schema,
  WAL e impostazioni busy-timeout del DB di stato condiviso. I byte dei payload sono compressi con gzip in
  `capture_blobs.data`; non esiste alcun override DB sidecar runtime debug proxy,
  directory blob o target schema/codegen generato solo per proxy-capture.
  La migrazione doctor/startup importa le righe `debug-proxy/capture.sqlite` distribuite
  e i blob payload referenziati, inclusi gli override legacy attivi di ambiente DB/blob,
  quindi archivia quelle sorgenti lasciando intatti i certificati CA.

Questa fase elimina anche opener sidecar duplicati, helper dei permessi, configurazione WAL,
pulizia del filesystem e writer di compatibilità da quei sottosistemi.

### Fase 2: Introdurre database per agente

Crea un database per ogni agente e registralo dal DB globale:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

La riga globale `agent_databases` memorizza il percorso, la versione dello schema, il timestamp
last-seen e metadati di base su dimensione/integrità. Il codice runtime chiede al registro il
DB agente invece di derivare direttamente i percorsi file.

Il DB agente possiede:

- `sessions` come radice canonica delle sessioni, con `session_entries` come tabella dei payload con forma di compatibilità collegata a quella radice, e `session_routes` come ricerca univoca della `session_key` attiva
- `conversations` e `session_conversations` come identità di instradamento del provider normalizzata collegata alle sessioni
- `transcript_events`
- snapshot delle trascrizioni e checkpoint di Compaction. Completato per le scritture runtime.
- `vfs_entries`
- `tool_artifacts` e artefatti di run
- righe runtime/cache locali all'agente. Completato per le cache con ambito worker.
- eventi dello stream padre ACP
- eventi runtime della traiettoria quando non sono artefatti di esportazione espliciti

### Fase 3: sostituire le API dello store delle sessioni

Completato per il runtime. La superficie dello store delle sessioni con forma di file non è un contratto runtime attivo:

- Il runtime non chiama più `loadSessionStore(storePath)` né tratta `storePath` come identità della sessione.
- Le operazioni runtime sulle righe sono `getSessionEntry`, `upsertSessionEntry`, `patchSessionEntry`, `deleteSessionEntry` e `listSessionEntries`.
- Gli helper di riscrittura dell'intero store, i writer di file, i test delle code, la rimozione degli alias e i parametri di eliminazione delle chiavi legacy sono stati rimossi dal runtime.
- Gli export di compatibilità deprecati del pacchetto radice adattano ancora i percorsi canonici `sessions.json` sulle API delle righe SQLite.
- Il parsing di `sessions.json` resta solo nel codice di migrazione/importazione di doctor e nei test di doctor.
- Il fallback del ciclo di vita runtime legge le intestazioni delle trascrizioni da SQLite, non le prime righe JSONL.

Continua a eliminare tutto ciò che reintroduce parametri di file lock, vocabolario di pruning/troncamento come manutenzione di file, identità basata su percorso dello store, o test la cui unica asserzione è la persistenza JSON.

### Fase 4: spostare trascrizioni, stream ACP, traiettorie e VFS

Rendi ogni stream di dati dell'agente nativo del database:

- Le scritture di append delle trascrizioni passano attraverso una transazione SQLite che garantisce l'intestazione della sessione, controlla l'idempotenza del messaggio, seleziona la coda padre, inserisce in `transcript_events` e registra metadati di identità interrogabili in `transcript_event_identities`. Completato per gli append diretti dei messaggi di trascrizione e per i normali append persistiti di `TranscriptSessionManager`; le operazioni esplicite sui branch mantengono la loro scelta esplicita del padre e scrivono comunque righe SQLite senza derivare alcun localizzatore di file.
- I log degli stream padre ACP diventano righe, non file `.acp-stream.jsonl`. Completato.
- La configurazione dello spawn ACP non persiste più percorsi JSONL delle trascrizioni. Completato.
- La cattura runtime delle traiettorie scrive direttamente righe/artefatti di evento. Il comando esplicito di supporto/esportazione può ancora produrre artefatti JSONL del bundle di supporto come formato di esportazione, ma l'esportazione della sessione non ricrea JSONL di sessione. Completato.
- Gli workspace su disco restano su disco quando configurati in modalità disco.
- Lo scratch VFS e la modalità workspace sperimentale solo VFS usano il DB dell'agente.

La migrazione importa i vecchi file JSONL una sola volta, registra conteggi/hash in `migration_runs` e rimuove i file importati dopo i controlli di integrità.

### Fase 5: backup, ripristino, vacuum e verifica

I backup restano un unico file di archivio:

- Esegui il checkpoint di ogni database globale e dell'agente.
- Crea snapshot di ogni DB con semantica di backup SQLite o `VACUUM INTO`.
- Archivia snapshot compatti dei DB, configurazione, credenziali esterne ed esportazioni degli workspace richiesti.
- Ometti i file live grezzi `*.sqlite-wal` e `*.sqlite-shm`.
- Verifica aprendo ogni snapshot di DB ed eseguendo `PRAGMA integrity_check`.
  `openclaw backup create` esegue questa verifica dell'archivio per impostazione predefinita;
  `--no-verify` salta solo il passaggio di archivio post-scrittura, non il controllo di integrità della creazione dello snapshot.
- Il ripristino copia gli snapshot nei rispettivi percorsi di destinazione. Questo branch reimposta il layout SQLite non ancora rilasciato a `user_version = 1`; le future modifiche dello schema rilasciate potranno aggiungere migrazioni esplicite quando necessarie.

### Fase 6: runtime worker

Mantieni la modalità worker sperimentale mentre viene introdotta la separazione del database:

- I worker ricevono id agente, id run, modalità filesystem e identità del registro DB.
- Ogni worker apre la propria connessione SQLite.
- Il padre mantiene consegna del canale, approvazioni, configurazione e autorità di annullamento.
- Inizia con un worker per run attivo; aggiungi pooling solo dopo che ciclo di vita e proprietà delle connessioni DB sono stabili.

### Fase 7: eliminare il vecchio mondo

Completato per la gestione runtime delle sessioni. Il vecchio mondo è consentito solo come input esplicito di doctor o output di supporto/esportazione:

- Nessuna scrittura runtime di `sessions.json`, JSONL di trascrizioni, JSON del registro sandbox, SQLite sidecar dei task o SQLite sidecar dello stato Plugin.
- Nessun pruning di file JSON/sessione, troncamento di trascrizioni su file, lock dei file di sessione o test di sessione con forma di lock.
- Nessun export di compatibilità runtime il cui scopo sia mantenere aggiornati i vecchi file di sessione.
- Gli export espliciti di supporto restano formati di archivio/materializzazione richiesti dall'utente e non devono reinserire nomi di file nell'identità runtime.

## Backup e ripristino

I backup dovrebbero essere un unico file di archivio, ma la cattura del database dovrebbe essere nativa di SQLite:

1. Ferma le attività di scrittura di lunga durata o entra in una breve barriera di backup.
2. Per ogni database globale e dell'agente, esegui un checkpoint.
3. Crea uno snapshot di ogni database usando semantica di backup SQLite o `VACUUM INTO` in una directory temporanea di backup.
4. Archivia gli snapshot compattati dei database, il file di configurazione, la directory delle credenziali, gli workspace selezionati e un manifest.
5. Verifica l'archivio aprendo ogni snapshot SQLite incluso ed eseguendo `PRAGMA integrity_check`.
   `openclaw backup create` lo fa per impostazione predefinita; `--no-verify` serve solo a saltare intenzionalmente il passaggio di archivio post-scrittura.

Non fare affidamento sulle copie live grezze di `*.sqlite`, `*.sqlite-wal` e `*.sqlite-shm` come formato di backup principale. Il manifest dell'archivio dovrebbe registrare ruolo del database, id agente, versione dello schema, percorso sorgente, percorso dello snapshot, dimensione in byte e stato di integrità.

Il ripristino dovrebbe ricostruire il database globale e i file di database dell'agente dagli snapshot dell'archivio. Poiché il layout SQLite non è ancora stato rilasciato, questo refactor mantiene solo lo schema versione 1 più l'importazione da file a database di doctor. Il comando di ripristino convalida prima l'archivio, poi sostituisce ogni asset del manifest dal payload estratto verificato.

## Piano di refactor runtime

1. Aggiungi API del registro database.
   - Risolvi i percorsi del DB globale e dei DB per agente.
   - Mantieni gli schemi non rilasciati a `user_version = 1`; non aggiungere codice di runner di migrazione schema finché uno schema rilasciato non ne ha bisogno.
   - Aggiungi helper di chiusura/checkpoint/integrità usati da test, backup e doctor.

2. Comprimi gli store SQLite sidecar.
   - Sposta le tabelle di stato Plugin nel database globale. Completato per le scritture runtime; l'importer sidecar legacy non rilasciato è eliminato.
   - Sposta le tabelle del registro dei task nel database globale. Completato per le scritture runtime; l'importer sidecar legacy non rilasciato è eliminato.
   - Sposta le tabelle TaskFlow nel database globale. Completato per le scritture runtime; l'importer sidecar legacy non rilasciato è eliminato.
   - Sposta le tabelle integrate di ricerca memoria in ogni database dell'agente. Completato; `memorySearch.store.path` personalizzato esplicito ora viene rimosso dalla migrazione della configurazione di doctor.
     La reindicizzazione completa viene eseguita sul posto solo sulle tabelle di memoria; il vecchio percorso di swap dell'intero file e l'helper di swap dell'indice sidecar sono eliminati.
   - Elimina opener di database duplicati, configurazione WAL, helper di permessi e percorsi di chiusura da quei sottosistemi.

3. Sposta le tabelle di proprietà dell'agente nei database per agente.
   - Crea il DB dell'agente su richiesta attraverso il registro del database globale. Completato.
   - Sposta voci di sessione runtime, eventi di trascrizione, righe VFS e artefatti degli strumenti nei DB degli agenti. Completato.
   - Non migrare voci di sessione, eventi di trascrizione, righe VFS o artefatti degli strumenti del DB condiviso locale al branch; quel layout non è mai stato rilasciato. Mantieni solo l'importazione legacy da file a database in doctor.

4. Sostituisci le API dello store delle sessioni.
   - Rimuovi `storePath` come identità runtime. Completato per il runtime e protetto da `check:database-first-legacy-stores`: metadati di sessione, aggiornamenti delle route, persistenza dei comandi, pulizia sessioni CLI, anteprime di ragionamento Feishu, persistenza dello stato trascrizione, profondità dei subagent, override di sessione del profilo auth, logica di fork dal padre e ispezione QA-lab ora risolvono il database da chiavi canoniche agente/sessione.
     Le risposte degli elenchi sessione Gateway/TUI/UI/macOS ora espongono `databasePath` invece del legacy `path`; le superfici di debug macOS mostrano il database per agente come stato di sola lettura invece di scrivere la configurazione `session.store`.
     `/status`, esportazione della traiettoria guidata dalla chat e proxy di dipendenze CLI non propagano più percorsi legacy dello store; il fallback di utilizzo delle trascrizioni legge SQLite tramite identità agente/sessione. I test runtime e bridge non espongono più `storePath`; gli input di doctor/migrazione possiedono quel nome di campo legacy.
     Il caricamento delle sessioni combinate del Gateway non ha più un branch runtime speciale per valori `session.store` non templated; aggrega righe SQLite per agente.
     La lane doctor legacy dei lock di sessione e il relativo helper di pulizia `.jsonl.lock` sono stati rimossi; SQLite ora è il confine di concorrenza delle sessioni.
     I call site runtime caldi usano nomi di helper orientati alle righe come `resolveSessionRowEntry`; il vecchio alias di compatibilità `resolveSessionStoreEntry` è stato rimosso dal runtime e dagli export dell'SDK Plugin.

- Usa operazioni su righe `{ agentId, sessionKey }`.
  Completato: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`, `patchSessionEntry` e `listSessionEntries` sono API SQLite-first che non richiedono un percorso dello store delle sessioni. Riepilogo stato, stato dell'agente locale, health e il comando di elenco `openclaw sessions` ora leggono direttamente le righe per agente e mostrano percorsi del database SQLite per agente invece di percorsi `sessions.json`.
- Sostituisci eliminazione/inserimento dell'intero store con `upsertSessionEntry`, `deleteSessionEntry`, `listSessionEntries` e query SQL di pulizia.
  Completato per il runtime: i percorsi caldi ora usano API di riga e patch di riga con retry sui conflitti; gli helper rimanenti di importazione/sostituzione dell'intero store sono limitati al codice di importazione delle migrazioni e ai test del backend SQLite.
  - Elimina `store-writer.ts` e i test della coda writer. Completato.
  - Elimina il pruning delle chiavi legacy runtime e i parametri alias-delete dagli upsert/patch delle righe di sessione. Completato.

5. Elimina il comportamento runtime del registro JSON.
   - Rendi le letture e scritture del registro sandbox solo SQLite. Completato.
   - Importa JSON monolitico e sharded solo dal passaggio di migrazione. Completato.
   - Rimuovi lock del registro sharded e scritture JSON. Completato.

- Mantieni una tabella di registro tipizzata invece di archiviare le righe del registro come JSON opaco generico se la forma resta stato operativo del percorso caldo. Completato.

6. Elimina la mutazione di sessione con forma di file lock.
   - Completato per la creazione di lock runtime e le API runtime dei lock.
   - La lane autonoma di pulizia doctor legacy `.jsonl.lock` è rimossa.
   - `session.writeLock` è configurazione legacy migrata da doctor, non un'impostazione runtime tipizzata.
   - L'integrità dello stato non ha più un percorso separato di pruning di file di trascrizione orfani; la migrazione doctor importa/rimuove le sorgenti JSONL legacy in un solo punto.
   - La coordinazione singleton del Gateway usa righe SQLite tipizzate `state_leases` sotto `gateway_locks` e non espone più una superficie di directory di file lock.
   - La persistenza dedupe generica dell'SDK Plugin non usa più file lock o file JSON; scrive righe SQLite condivise di stato Plugin. Completato.
   - La coordinazione dell'embed QMD usa una lease di stato SQLite invece di `qmd/embed.lock`. Completato.

7. Rendi i worker consapevoli del database.
   - I worker aprono le proprie connessioni SQLite.
   - Il padre possiede consegna, callback dei canali e configurazione.
   - Il worker riceve id agente, id run, modalità filesystem e identità del registro DB, non handle live.
   - `vfs-only` resta sperimentale e usa il database dell'agente come radice di archiviazione.
   - Mantieni prima un worker per run attivo. Il pooling può aspettare finché durata delle connessioni DB e comportamento di annullamento non saranno ordinari.

8. Integrazione dei backup.
   - Insegnare al backup a creare snapshot dei database globali e degli agenti tramite backup SQLite o
     `VACUUM INTO`. Fatto per i file `*.sqlite` rilevati sotto l'asset di stato.
   - Aggiungere la verifica dei backup per l'integrità SQLite e la versione dello schema. Fatto per
     la creazione dei backup e i controlli di integrità predefiniti per la verifica degli archivi.
   - Registrare i metadati delle esecuzioni di backup in SQLite. Fatto tramite la tabella condivisa `backup_runs`
     con percorso dell'archivio, stato e JSON del manifest.
   - Aggiungere il ripristino da snapshot di archivio verificati. Fatto: `openclaw backup
restore` convalida prima dell'estrazione, usa il manifest normalizzato del verificatore,
     supporta `--dry-run` e richiede `--yes` prima di sostituire
     i percorsi sorgente registrati.
   - Includere l'esportazione VFS/workspace solo quando richiesta; non esportare gli internals
     di sessione come JSON o JSONL.

9. Eliminare test e codice obsoleti. Fatto per le superfici note delle sessioni runtime.

- Rimuovere i test che verificano la creazione runtime di `sessions.json` o file
  JSONL di trascrizione. Fatto per store di sessione core, chat, eventi di trascrizione del gateway,
  anteprima, ciclo di vita, aggiornamenti command session-entry, reset/traccia auto-reply e
  fixture Dreaming di memory-core, routing dei target di approvazione, riparazione della trascrizione
  di sessione, riparazione dei permessi di sicurezza, esportazione della traiettoria ed esportazione della sessione.
  I test delle trascrizioni Active Memory ora verificano gli ambiti SQLite e l'assenza di creazione di file JSONL temporanei o
  persistiti.
  La vecchia regressione di pruning delle trascrizioni Heartbeat è stata rimossa perché
  il runtime non tronca più le trascrizioni JSONL.
  I test dello strumento agent session-list non modellano più i percorsi legacy `sessions.json`
  come forma della risposta del Gateway; i test app/UI/macOS usano `databasePath`.
  I test di uso della trascrizione di `/status` ora seminano direttamente righe di trascrizione SQLite
  invece di scrivere file JSONL.
  I test del ciclo di vita delle sessioni del Gateway ora usano direttamente helper di seeding delle trascrizioni SQLite;
  la vecchia forma di fixture session-file a riga singola non esiste più nella copertura di reset
  ed eliminazione.
  `sessions.delete` non restituisce più un campo dell'era dei file `archived: []`; l'eliminazione
  riporta solo il risultato della mutazione della riga. Anche la vecchia opzione `deleteTranscript` è
  scomparsa: l'eliminazione di una sessione rimuove la radice canonica `sessions` e lascia
  che SQLite propaghi a cascata le righe di trascrizione, snapshot e traiettoria di proprietà della sessione, quindi nessun
  chiamante può lasciare trascrizioni orfane o dimenticare un ramo di cleanup.
  I test di acquisizione delle traiettorie del context-engine ora leggono le righe `trajectory_runtime_events`
  da un database agente isolato invece di leggere
  `session.trajectory.jsonl`.
  Gli script seed del canale Docker MCP ora seminano direttamente righe SQLite. Le scritture dirette
  di `sessions.json` sono limitate alle fixture di doctor.
  L'E2E Tool Search Gateway legge le prove delle chiamate agli strumenti dalle righe di trascrizione SQLite
  invece di scansionare i file `agents/<agentId>/sessions/*.jsonl`.
  Gli eventi host memory-core e le righe scratch session-corpus ora vivono nello stato Plugin SQLite condiviso;
  `events.jsonl` e `session-corpus/*.txt` sono solo input legacy
  di migrazione doctor. Le righe attive usano percorsi virtuali `memory/session-ingestion/`,
  non `.dreams/session-corpus`. Il vecchio modulo di riparazione Dreaming
  memory-core e i relativi test CLI/Gateway sono stati rimossi perché il runtime non
  possiede più la riparazione dell'archivio file per quel corpus. I test bridge/public-artifact
  memory-core non espongono più `.dreams/events.jsonl`; usano
  il nome dell'artefatto JSON virtuale supportato da SQLite.
  La documentazione di test pubblica SDK/Codex ora parla di stato sessione SQLite invece che di file
  di sessione, e l'esempio channel-turn non espone più un argomento `storePath`.
  Lo stato di sincronizzazione Matrix ora usa direttamente lo store stato Plugin SQLite. I contratti
  client/runtime attivi passano una radice di archiviazione account, non un percorso `bot-storage.json`,
  e doctor importa il legacy `bot-storage.json` in SQLite prima di eliminare
  la sorgente. Gli scenari QA Matrix di riavvio/distruttivi ora mutano direttamente la riga di sincronizzazione SQLite
  invece di creare o eliminare file `bot-storage.json` fittizi, e
  il substrato E2EE passa una radice sync-store invece di un percorso
  `sync-store.json` fittizio.
  La selezione della storage-root Matrix non assegna più punteggi alle radici in base a file JSON legacy di sync/thread;
  usa metadati di radice durevoli più lo stato crittografico reale.
  La suite di test del backend sessione SQLite runtime non fabbrica più un
  `sessions.json`; le fixture sorgente legacy ora vivono nei test doctor
  che le importano.
  I test sessione del Gateway non espongono più un helper `createSessionStoreDir` né
  setup inutilizzati di percorsi temp session-store; le directory fixture sono esplicite e il setup diretto
  delle righe usa la denominazione delle righe sessione SQLite.
  La copertura del parser session-store JSON5 solo doctor è stata spostata fuori dai test infra e
  nei test di migrazione doctor, quindi le suite di test runtime non possiedono più il parsing legacy
  dei file sessione.
  I test runtime SSO/pending-upload di Microsoft Teams non portano più fixture o parser
  sidecar JSON; il parsing legacy dei token SSO vive solo nel modulo di migrazione
  del Plugin. I test Telegram non seminano più percorsi store `/tmp/*.json`
  fittizi; resettano direttamente la cache messaggi supportata da SQLite. L'helper generico
  di stato test OpenClaw non espone più un writer legacy `auth-profiles.json`;
  i test di migrazione auth doctor possiedono localmente quella fixture.
  I test runtime per puntatori TUI last-session, approvazioni exec, toggle Active Memory,
  verifica Matrix dedupe/startup, sync sorgenti Memory Wiki,
  binding current-conversation, auth di onboarding e importazioni di segreti Hermes non
  fabbricano più vecchi file sidecar né verificano che vecchi nomi file siano assenti. Provano
  il comportamento tramite righe SQLite e API pubbliche dello store; i test doctor/migration
  sono l'unico posto in cui appartengono i nomi file sorgente legacy.
  Anche i test runtime per pairing device/node, channel allowFrom, intenti di riavvio,
  handoff di riavvio, voci della coda di consegna sessione, salute config, cache iMessage,
  job cron, header trascrizione PI, registri subagent e allegati immagine gestiti
  non creano più file JSON/JSONL ritirati solo per dimostrare
  che vengono ignorati o sono assenti.
  Il recupero da overflow PI non ha più un fallback di riscrittura/troncamento SessionManager:
  il troncamento dei risultati degli strumenti e le riscritture della trascrizione del context-engine mutano
  le righe di trascrizione SQLite, poi aggiornano lo stato prompt attivo dal database.
  Gli append persistiti dei messaggi SessionManager delegano all'helper atomico di append
  trascrizione SQLite per selezione del genitore e idempotenza. Anche gli append normali
  di metadati/voci custom selezionano il genitore corrente dentro SQLite, quindi
  istanze manager obsolete non resuscitano race della parent-chain pre-SQLite.
  Il cleanup sintetico della coda PI per precheck mid-turn e `sessions_yield` ora
  rifinisce direttamente lo stato trascrizione SQLite; il vecchio bridge di rimozione coda
  SessionManager e i suoi test sono eliminati.
  Anche l'acquisizione dei checkpoint di Compaction esegue snapshot solo da SQLite; i chiamanti non
  passano più un SessionManager live come sorgente alternativa di trascrizione.
- Mantenere i test che seminano file legacy solo per la migrazione.
- La prova basata su file JSON è stata sostituita con prova basata su righe SQL per le superfici
  runtime attive.

- Aggiungere divieti statici per scritture runtime verso percorsi JSON legacy di sessione/cache.
  Fatto per la guardia del repository.

10. Rendere il report di migrazione verificabile.
    - Registrare le esecuzioni di migrazione in SQLite con timestamp di inizio/fine, percorsi
      sorgente, hash sorgente, conteggi, avvisi e percorso backup.
      Fatto: le esecuzioni di migrazione dello stato legacy ora persistono un report `migration_runs`
      con inventario dei percorsi/tabelle sorgente, SHA-256 dei file sorgente, dimensioni,
      conteggi dei record, avvisi e percorso backup.
      Fatto: le esecuzioni di migrazione dello stato legacy persistono anche righe `migration_sources`
      per audit a livello di sorgente e future decisioni di skip/backfill.
    - Rendere apply idempotente. Rieseguire dopo un'importazione parziale dovrebbe
      saltare una sorgente già importata o unire tramite chiave stabile.
      Fatto: indici sessione, trascrizioni, code di consegna, stato Plugin, registri task
      e righe SQLite globali di proprietà dell'agente importano tramite chiavi stabili o
      semantiche upsert/replace, quindi le riesecuzioni uniscono senza duplicare righe
      durevoli.
    - Le importazioni fallite devono mantenere il file sorgente originale al suo posto.
      Fatto: le importazioni di trascrizioni fallite ora lasciano la sorgente JSONL originale nel
      suo percorso rilevato, e `migration_sources` registra la sorgente come
      `warning` con `removed_source=0` per la successiva esecuzione doctor.

## Regole di prestazione

- Una connessione per thread/processo va bene; non condividere handle tra
  worker.
- Usare WAL, `foreign_keys=ON`, un busy timeout di 30s e brevi transazioni di scrittura
  `BEGIN IMMEDIATE`.
- Mantenere sincroni gli helper per le transazioni di scrittura salvo finché un'API di transazione asincrona
  non aggiunge semantiche esplicite di mutex/backpressure.
- Mantenere piccole e transazionali le scritture di parent delivery.
- Evitare riscritture dell'intero store; usare upsert/delete a livello di riga.
- Aggiungere indici per percorsi list-by-agent, list-by-session, updated-at, run id ed
  expiration prima di spostare codice hot.
- Archiviare artefatti grandi, media e vettori come BLOB o righe BLOB a chunk, non
  JSON base64 o array numerici.
- Mantenere piccole e delimitate le voci opache dello stato Plugin.
- Aggiungere cleanup SQL per TTL/expiration invece del pruning del filesystem.
  Fatto per gli store runtime di proprietà del database: media, stato Plugin, blob Plugin,
  dedupe persistente e cache agente scadono tutti tramite righe SQLite. Il cleanup
  filesystem rimanente è limitato a materializzazioni temporanee o comandi espliciti
  di rimozione.

## Divieti statici

Aggiungere un controllo del repository che fallisca nuove scritture runtime verso percorsi di stato legacy:

- `sessions.json`
- `*.trajectory.jsonl` tranne gli output dei bundle di supporto materializzati
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- file di cache runtime `cache/*.json`
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` e `recovery-key.json`
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
- file JSON del bridge `/tmp` per il relay degli hook nativi
- `plugin-state/state.sqlite`
- sidecar runtime ad hoc `openclaw-state.sqlite`
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
- opener di sessioni basati su file `SessionManager.open(...)`
- facade di elenco delle trascrizioni `SessionManager.listAll(...)` e `TranscriptSessionManager.listAll(...)`
- facade di fork delle trascrizioni `SessionManager.forkFromSession(...)` e
  `TranscriptSessionManager.forkFromSession(...)`
- facade di sostituzione delle sessioni mutabili `SessionManager.newSession(...)` e `TranscriptSessionManager.newSession(...)`
- facade di sessioni di ramo `SessionManager.createBranchedSession(...)` e
  `TranscriptSessionManager.createBranchedSession(...)`

Il divieto dovrebbe consentire ai test di creare fixture legacy e al codice di migrazione di
leggere/importare/rimuovere sorgenti file legacy. I sidecar SQLite non rilasciati restano vietati
e non ottengono autorizzazioni di importazione tramite doctor.

## Criteri di Completamento

- Le scritture di dati runtime e cache vanno nel database SQLite globale o dell'agente.
- Il runtime non scrive più indici di sessione, JSONL di trascrizione, JSON del registro sandbox,
  sidecar SQLite delle attività o sidecar SQLite dello stato dei Plugin. Gli importer SQLite sidecar non rilasciati
  per attività e stato dei Plugin vengono eliminati.
- L'importazione di file legacy è solo doctor.
- Il backup produce un unico archivio con snapshot SQLite compatti e prova di integrità.
- I worker degli agenti possono essere eseguiti con disco, spazio scratch VFS o storage sperimentale solo VFS.
- I file di configurazione e i file di credenziali espliciti restano gli unici file di controllo persistenti
  non di database previsti.
- I controlli del repo impediscono la reintroduzione di archivi file runtime legacy.
