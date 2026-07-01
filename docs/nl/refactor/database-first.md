---
read_when:
    - OpenClaw-runtimegegevens, cache, transcripties, taakstatus of tijdelijke bestanden naar SQLite verplaatsen
    - Migraties voor doctor ontwerpen vanuit verouderde JSON- of JSONL-bestanden
    - Gedrag voor back-ups, herstel, VFS of workeropslag wijzigen
    - Sessie-locks verwijderen, opschonen, afkappen of JSON-compatibiliteitspaden
summary: Migratieplan om SQLite de primaire duurzame laag voor status en cache te maken, terwijl configuratie bestandsgebaseerd blijft
title: Refactor van toestand met database als uitgangspunt
x-i18n:
    generated_at: "2026-07-01T20:28:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
    source_path: refactor/database-first.md
    workflow: 16
---

# Database-First State-refactor

## Besluit

Gebruik een SQLite-indeling met twee niveaus:

- Globale database: `~/.openclaw/state/openclaw.sqlite`
- Agentdatabase: één SQLite-database per agent voor agentbeheerde werkruimte,
  transcript, VFS, artifact en grote runtime-state per agent
- Configuratie blijft bestandsgebaseerd: `openclaw.json` blijft buiten de
  database. Runtime-authprofielen verhuizen naar SQLite; externe provider- of
  CLI-referentiebestanden blijven door de eigenaar beheerd buiten de database
  van OpenClaw.

De globale database is de control-plane-database. Deze beheert agentdetectie,
gedeelde Gateway-state, koppeling, apparaat-/node-state, taak- en flowgrootboeken, Plugin
state, scheduler-runtime-state, back-upmetadata en migratiestate.

De agentdatabase is de data-plane-database. Deze beheert de sessiemetadata van
de agent, de transcript-eventstream, VFS-werkruimte of scratch-namespace, tool
artifacts, run-artifacts en doorzoekbare/indexeerbare agentlokale cachedata.

Dit geeft één duurzame globale weergave zonder grote agentwerkruimten,
transcripten en binaire scratchdata in de gedeelde Gateway-schrijfbaan te
dwingen.

## Hard Contract

Deze migratie heeft één canonieke runtime-vorm:

- Sessierijen bewaren alleen sessiemetadata. Ze mogen geen
  `transcriptLocator`, transcriptbestandspaden, naastliggende JSONL-paden, lockpaden,
  pruning-metadata of compatibiliteitspointers uit het bestandstijdperk bewaren.
- Transcriptidentiteit is altijd SQLite-identiteit: `{agentId, sessionId}` plus
  optionele topicmetadata waar het protocol die nodig heeft.
- `sqlite-transcript://...` is geen runtime- of protocolidentiteit. Nieuwe code mag
  geen transcriptlocators afleiden, bewaren, doorgeven, parsen of migreren. Runtime en
  tests mogen helemaal geen pseudolocators bevatten; docs mogen de tekenreeks
  alleen vermelden om die te verbieden.
- Legacy `sessions.json`, transcript-JSONL, `.jsonl.lock`, pruning, truncation
  en oude sessiepadlogica horen alleen in het doctor-migratie-/importpad.
- Legacy sessieconfiguratie-aliassen horen alleen in doctor-migratie. Runtime
  interpreteert `session.idleMinutes`, `session.resetByType.dm` of
  cross-agent `agent:main:*` main-session-aliassen voor een andere geconfigureerde agent niet.
- Sessierouteringsidentiteit is getypte relationele state. Hot runtime- en UI-paden
  moeten `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` en
  `session_conversations` lezen; ze mogen `session_key` niet parsen of
  `session_entries.entry_json` doorzoeken op provideridentiteit, behalve als
  compatibiliteitsschaduw terwijl oude callsites worden verwijderd.
- Channel-level direct-message-markeringen zoals `dm` versus `direct` zijn
  routeringsvocabulaire, geen transcriptlocators of compatibiliteitshandles voor
  bestandsopslag.
- Legacy hookhandlerconfiguratie hoort alleen in doctor-waarschuwings-/migratiesurfaces.
  Runtime mag `hooks.internal.handlers` niet laden; hooks draaien alleen via ontdekte
  hookdirectories en `HOOK.md`-metadata.
- Runtime-opstart, hot reply-paden, Compaction, reset, herstel, diagnostics,
  TTS, memory hooks, subagents, Plugin-commandoroutering, protocolgrenzen en
  hooks moeten `{agentId, sessionId}` door de runtime doorgeven.
- Tests moeten SQLite-transcriptrijen seeden en asserten via
  `{agentId, sessionId}`. Tests die alleen JSONL-paddoorsturen,
  behoud van door de caller aangeleverde locator of transcriptbestandcompatibiliteit
  bewijzen, moeten worden verwijderd tenzij ze doctor-import, niet-sessiegebonden
  support-/debugmaterialisatie of protocolvorm dekken.
- `runEmbeddedPiAgent(...)`, voorbereide workerruns en de interne embedded
  poging mogen geen transcriptlocators accepteren. Ze openen de SQLite-transcriptmanager
  via `{agentId, sessionId}` en geven die manager door aan de geïnternaliseerde
  PI-compatibele agentsessie, zodat verouderde callers de runner geen
  JSON/JSONL-transcripten kunnen laten schrijven.
- Runnerdiagnostics moeten runtime-/cache-/payload-tracerecords in SQLite opslaan.
  Runtime-diagnostics mogen geen JSONL-bestandsoverrideknoppen of generieke
  exporthelpers voor transcript-JSONL blootstellen; gebruikersgerichte exports kunnen
  expliciete artifacts uit databaserijen materialiseren zonder bestandsnamen terug
  de runtime in te voeren.
- Raw stream logging gebruikt `OPENCLAW_RAW_STREAM=1` plus SQLite-diagnosticsrijen.
  Het oude pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH` en
  `raw-openai-completions.jsonl`-bestandsloggercontract maakt geen deel uit van
  OpenClaw-runtime of tests.
- QMD-geheugenindexering mag SQLite-transcripten niet naar markdownbestanden exporteren.
  QMD indexeert alleen geconfigureerde geheugenbestanden; zoekfunctionaliteit voor
  sessietranscripten blijft SQLite-backed.
- Het QMD SDK-subpad is alleen voor QMD voor nieuwe code. SQLite-indexeringshelpers
  voor sessietranscripten staan op `memory-core-host-engine-session-transcripts`; elke
  QMD-re-export is alleen compatibiliteit en mag niet door runtimecode worden gebruikt.
- Ingebouwde geheugenindexen leven in de database van de eigenaar-agent. Runtimeconfiguratie en
  opgeloste runtimecontracten mogen `memorySearch.store.path` niet blootstellen; doctor
  verwijdert die legacy config key en huidige code geeft intern de agent
  `databasePath` door.

Implementatiewerk moet code blijven verwijderen totdat deze uitspraken waar zijn
zonder uitzonderingen buiten doctor-/import-/export-/debuggrenzen.

## Doelstatus en voortgang

### Hard doel

- Eén globale SQLite-database beheert control-plane-state:
  `state/openclaw.sqlite`.
- Eén SQLite-database per agent beheert data-plane-state:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Config blijft bestandsgebaseerd. `openclaw.json` maakt geen deel uit van deze
  database-refactor.
- Legacy bestanden zijn alleen doctor-migratie-inputs.
- Runtime schrijft of leest nooit sessie- of transcript-JSONL als actieve state.

### Doelstatussen

- `not-started`: runtimecode uit het bestandstijdperk schrijft nog actieve state.
- `migrating`: doctor-/importcode kan bestandsdata naar SQLite verplaatsen.
- `dual-read`: tijdelijke brug leest zowel SQLite als legacy bestanden. Deze status
  is verboden voor deze refactor tenzij die expliciet als alleen-doctor is gedocumenteerd.
- `sqlite-runtime`: runtime leest en schrijft alleen SQLite.
- `clean`: legacy runtime-API's en tests zijn verwijderd, en de guard voorkomt
  regressies.
- `done`: docs, tests, back-up, doctor-migratie en gewijzigde checks bewijzen de
  clean state.

### Huidige status

- Sessies: `clean` voor runtime. Sessierijen leven in de database per agent,
  runtime-API's gebruiken `{agentId, sessionId}` of `{agentId, sessionKey}`, en
  `sessions.json` is legacy input alleen voor doctor.
- Transcripten: `clean` voor runtime. Transcript-events, identiteiten, snapshots
  en trajectory-runtime-events leven in de database per agent. Runtime accepteert
  geen transcriptlocators of JSONL-transcriptpaden meer.
- PI embedded runner: `clean`. Embedded PI-runs, voorbereide workers, Compaction
  en retryloops gebruiken SQLite-sessiescope en weigeren verouderde transcripthandles.
- Cron: `clean` voor runtime. Runtime gebruikt `cron_jobs` en `cron_run_logs`;
  runtime-tests gebruiken SQLite-`storeKey`-naamgeving, en cronpaden uit het
  bestandstijdperk blijven alleen in doctor-legacy-migratietests.
- Taakregister: `clean`. Runtime-rijen voor taak en Task Flow leven in
  `state/openclaw.sqlite`; niet-uitgebrachte sidecar-SQLite-importers zijn verwijderd.
- Plugin state: `clean`. Plugin state-/blobrijen leven in de gedeelde globale
  database; oude sidecar-SQLite-helpers voor Plugin state worden bewaakt.
- Geheugen: `sqlite-runtime` voor ingebouwd geheugen en indexering van sessietranscripten.
  Geheugenindextabellen leven in de database per agent, Plugin-geheugenstate gebruikt
  gedeelde Plugin state-rijen, en legacy geheugenbestanden zijn doctor-migratie-inputs
  of gebruikerswerkruimtecontent.
- Back-up: `sqlite-runtime`. Back-upstages comprimeren SQLite-snapshots, laten live
  WAL/SHM-sidecars weg, verifiëren SQLite-integriteit en registreren back-upruns in de
  globale database.
- Doctor-migratie: `migrating`, opzettelijk. Doctor importeert legacy JSON,
  JSONL en uitgefaseerde sidecarstores naar SQLite, registreert migratieruns/-bronnen
  en verwijdert geslaagde bronnen.
- E2E-scripts: `clean` voor runtime-dekking. Docker MCP-seeding schrijft SQLite-rijen.
  Het runtime-context-Docker-script maakt legacy JSONL alleen binnen de
  doctor-migratieseed en benoemt het legacy sessie-indexpad expliciet.

### Resterend werk

- [x] Hernoem cron runtime-test-storevariabelen weg van `storePath`, tenzij
      ze doctor legacy inputs zijn.
      Bestanden: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Bewijs: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Verwijder of hernoem verouderde exporttestmocks uit het bestandstijdperk.
      Bestand: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Bewijs: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Maak de Docker runtime-context legacy JSONL-seed duidelijk doctor-only.
      Bestand: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Bewijs: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` toont alleen
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] Houd Kysely-gegenereerde types uitgelijnd na elke schemawijziging.
      Bestanden: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Bewijs: geen schemawijziging in deze pass; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Draai gerichte tests opnieuw voor aangeraakte stores, commands en scripts.
      Bewijs: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Voer vóór het verklaren van `done` de changed gate of remote brede proof uit.
      Bewijs: `pnpm check:changed --timed -- <changed extension paths>` geslaagd op
      Hetzner Crabbox-run `run_3f1cabf6b25c` na tijdelijke Node 24-/pnpm-setup en
      expliciete padrouting voor de gesynchroniseerde werkruimte zonder `.git`.

### Niet terugvallen

- Geen transcriptlocators.
- Geen actieve sessiebestanden.
- Geen nep-JSONL-testfixtures behalve doctor-legacy-migratietests.
- Geen raw SQLite-toegang waar Kysely wordt verwacht.
- Geen nieuwe legacy DB-migraties. Deze indeling is niet uitgebracht; houd de schemaversie
  op `1` tenzij er een sterke reden is.

## Code-Read-aannames

Geen vervolgproductbeslissingen blokkeren dit plan. De implementatie moet
doorgaan met deze aannames:

- Gebruik `node:sqlite` rechtstreeks en vereis de Node 22+-runtime voor dit opslagpad.
- Houd precies één normaal configuratiebestand. Verplaats config, pluginmanifests of Git-workspaces niet naar SQLite in deze refactor.
- Runtime-compatibiliteitsbestanden zijn niet vereist. Verouderde JSON- en JSONL-bestanden zijn alleen migratie-invoer. De branch-lokale SQLite-sidecars zijn nooit uitgebracht en worden verwijderd in plaats van geïmporteerd.
- `openclaw doctor --fix` is eigenaar van de migratiestap van verouderde bestanden naar de database. Runtime-startup en `openclaw migrate` mogen geen verouderde OpenClaw-database-upgradepaden bevatten.
- Compatibiliteit van referenties volgt dezelfde regel: runtimereferenties leven in SQLite. Oude `auth-profiles.json`, per-agent `auth.json` en gedeelde `credentials/oauth.json`-bestanden zijn doctor-migratie-invoer en worden na import verwijderd.
- Gegenereerde modelcatalogusstatus wordt door de database ondersteund. Runtimecode mag geen `agents/<agentId>/agent/models.json` schrijven; bestaande `models.json`-bestanden zijn verouderde doctor-invoer en worden verwijderd na import in `agent_model_catalogs`.
- Runtime mag transcriptlocators niet migreren, normaliseren of overbruggen. Actieve transcriptidentiteit is `{agentId, sessionId}` in SQLite. Bestandspaden zijn alleen verouderde doctor-invoer, en `sqlite-transcript://...` moet verdwijnen uit runtime-, protocol-, hook- en pluginoppervlakken in plaats van als grenshandle te worden behandeld.
- Runtime SQLite-transcriptlezingen voeren geen oude JSONL entry-shape-migraties uit en herschrijven geen volledige transcripts voor compatibiliteit. Verouderde entry-normalisatie blijft in expliciete doctor-/importhulpprogramma's. Doctor normaliseert verouderde JSONL-transcriptbestanden voordat SQLite-rijen worden ingevoegd; huidige runtimerijen zijn al geschreven in het huidige transcriptschema. Trajectory-/sessie-export leest die rijen zoals ze zijn en mag geen verouderde migraties tijdens export uitvoeren.
- Verouderde parse-/migratiehelpers voor transcript-JSONL zijn alleen voor doctor. Runtimecode voor transcriptindeling bouwt alleen huidige SQLite-transcriptcontext; doctor is eigenaar van oude JSONL-entry-upgrades voordat rijen worden ingevoegd.
- De oude runtime-eigen JSONL-helper voor transcriptstreaming is verwijderd. Doctor-importcode is eigenaar van expliciete lezingen van verouderde bestanden; runtime-sessiegeschiedenis leest SQLite-rijen.
- Codex app-server-bindings gebruiken de OpenClaw `sessionId` als de canonieke sleutel in de Codex plugin-state-namespace. `sessionKey` is metadata voor routering/weergave en mag de duurzame sessie-id niet vervangen of transcriptbestandsidentiteit opnieuw introduceren.
- Context-engines ontvangen het huidige runtimecontract rechtstreeks. Het register mag engines niet omwikkelen met retry-shims die `sessionKey`, `transcriptScope` of `prompt` verwijderen; engines die de huidige database-first parameters niet kunnen accepteren, moeten duidelijk falen in plaats van te worden overbrugd.
- Back-upuitvoer moet één archiefbestand blijven. Database-inhoud moet dat archief ingaan als compacte SQLite-snapshots, niet als ruwe live WAL-sidecars.
- Transcriptzoeken is nuttig maar niet vereist voor de eerste database-first stap. Ontwerp het schema zodat FTS later kan worden toegevoegd.
- Worker-uitvoering moet experimenteel blijven achter instellingen terwijl de databasegrens stabiliseert.

## Bevindingen uit codelezing

De huidige branch is de proof-of-conceptfase al voorbij. De gedeelde database bestaat, Node `node:sqlite` is via een kleine runtimehelper aangesloten, en eerdere stores schrijven nu naar `state/openclaw.sqlite` of de eigenaarsdatabase `openclaw-agent.sqlite`.

Het resterende werk is niet SQLite kiezen; het is de nieuwe grens schoon houden en alle compatibiliteitsvormige interfaces verwijderen die nog lijken op de oude bestandswereld:

- Sessie-`storePath` is niet langer een runtime-identiteit, testfixtureshape of statuspayloadveld. Runtime- en bridgetests bevatten de contractnaam `storePath` niet meer; doctor-/migratiecode is eigenaar van die verouderde woordenschat.
- Sessieschrijfacties lopen niet langer via de oude in-process `store-writer.ts`-wachtrij. SQLite-patchschrijfacties gebruiken in plaats daarvan conflictdetectie en begrensde retries.
- Verouderde paddetectie heeft nog geldige migratietoepassingen, maar runtimecode moet stoppen met `sessions.json` en transcript-JSONL-bestanden te behandelen als mogelijke schrijfdoelen.
- Agent-eigen tabellen leven in per-agent SQLite-databases. De globale DB bewaart registry-/control-plane-rijen; transcriptidentiteit is `{agentId, sessionId}` in de per-agent transcriptrijen. Runtimecode mag geen transcriptbestandspaden persistent maken of transcriptlocators migreren.
- Doctor importeert al verschillende verouderde bestanden. De cleanup is om daarvan één expliciete migratie-implementatie te maken die doctor aanroept, met een duurzaam migratierapport.

Geen aanvullende productvragen blokkeren de implementatie.

## Huidige codevorm

De branch heeft al een echte gedeelde SQLite-basis:

- De runtime-ondergrens is nu Node 22+: `package.json`, de CLI-runtimecontrole,
  installerstandaarden, macOS-runtimezoeker, CI en openbare installatiedocs zijn
  allemaal consistent. De oude Node 22-compatibiliteitslane is verwijderd.
- `src/state/openclaw-state-db.ts` opent `openclaw.sqlite`, stelt WAL in,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, en past de
  gegenereerde schemamodule toe die is afgeleid van
  `src/state/openclaw-state-schema.sql`.
- Kysely-tabeltypen en runtimeschemamodules worden gegenereerd vanuit wegwerpbare
  SQLite-databases die uit de gecommitte `.sql`-bestanden zijn gemaakt; runtimecode
  bewaart niet langer gekopieerde schemastrings voor globale, per-agent- of proxy
  capture-databases.
- Runtimestores leiden geselecteerde en ingevoegde rijtypen af van die gegenereerde
  Kysely-`DB`-interfaces in plaats van SQLite-rijvormen handmatig te schaduwen.
  Raw SQL blijft beperkt tot schematoepassing, pragma's en alleen-migratie-DDL.
- De SQLite-schema's zijn teruggebracht tot `user_version = 1` omdat deze
  databaselay-out nog niet is uitgebracht. Runtime-openers maken alleen het
  huidige schema aan; import van bestand naar database blijft in doctor-code, en
  branchlokale database-upgradehelpers zijn verwijderd.
- Relationeel eigendom wordt afgedwongen waar de eigendomsgrens canoniek is:
  bronmigratierijen cascaderen vanuit `migration_runs`, taakafleveringsstatus
  cascadeert vanuit `task_runs`, en transcriptidentiteitsrijen cascaderen vanuit
  transcriptgebeurtenissen.
- Huidige gedeelde tabellen omvatten `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs` en `backup_runs`.
- Willekeurige Plugin-eigen status krijgt geen host-eigen getypeerde tabellen.
  Geinstalleerde plugins gebruiken `plugin_state_entries` voor geversioneerde
  JSON-payloads en `plugin_blob_entries` voor bytes, met namespace/key-eigendom,
  TTL-opschoning, back-up en Plugin-migratierecords. Host-eigen
  Plugin-orkestratiestatus kan nog steeds getypeerde tabellen hebben wanneer de
  host eigenaar is van het querycontract, zoals `plugin_binding_approvals`.
- Plugin-migraties zijn datamigraties over Plugin-eigen namespaces, geen
  hostschemamigraties. Een Plugin kan zijn eigen geversioneerde status/blob-entries
  migreren via een migratieprovider, en de host registreert bron-/runstatus in
  het normale migratielogboek. Nieuwe Plugin-installaties vereisen geen wijziging
  van `openclaw-state-schema.sql`, tenzij de host zelf eigenaar wordt van een
  nieuw cross-Plugin-contract.
- `src/state/openclaw-agent-db.ts` opent
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registreert de database in de
  globale DB, en beheert agentlokale sessie-, transcript-, VFS-, artefact-, cache-
  en geheugenindextabellen. Gedeelde runtime-discovery leest nu het gegenereerd-getypeerde
  `agent_databases`-register in plaats van die query op elke callsite opnieuw te
  implementeren.
- Globale en per-agent-databases registreren een `schema_meta`-rij met databaserol,
  schemaversie, tijdstempels en agent-id voor agentdatabases. De lay-out blijft nog
  steeds op `user_version = 1` omdat dit SQLite-schema nog niet is uitgebracht.
- Per-agent-sessie-identiteit heeft nu een canonieke `sessions`-roottabel met sleutel
  `session_id`, met `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, tijdstempels, weergavevelden, modelmetadata,
  harness-id en parent/spawn-koppeling als querybare kolommen. `session_routes`
  is de unieke actieve route-index van `session_key` naar de huidige
  `session_id`, zodat een routesleutel naar een nieuwe duurzame sessie kan
  verhuizen zonder dat hot reads moeten kiezen tussen dubbele `sessions.session_key`-rijen. De oude
  compatibiliteitsvormige payload `session_entries.entry_json` hangt via een
  foreign key aan de duurzame `session_id`-root; dit is niet langer de enige
  schemaniveau-representatie van een sessie.
- Per-agent-externe gespreksidentiteit is ook relationeel:
  `conversations` slaat genormaliseerde provider-/account-/gespreksidentiteit op, en
  `session_conversations` koppelt een OpenClaw-sessie aan een of meer externe
  gesprekken. Dit dekt gedeelde hoofd-DM-sessies waarbij meerdere peers bewust aan
  een sessie kunnen worden gekoppeld zonder te liegen in `session_key`. SQLite dwingt
  ook uniciteit af voor de natuurlijke provideridentiteit, zodat dezelfde
  channel/account/kind/peer/thread-tuple niet over gespreks-id's kan vertakken.
  Gedeelde hoofd-directe peers worden gekoppeld met een `participant`-rol, zodat een
  OpenClaw-sessie meerdere externe DM-peers kan vertegenwoordigen zonder oudere peers
  te degraderen tot vage gerelateerde rijen. `sessions.primary_conversation_id` wijst
  nog steeds naar het huidige getypeerde afleverdoel. Gesloten routing-/statuskolommen
  worden afgedwongen met SQLite-`CHECK`-constraints in plaats van alleen op
  TypeScript-unions te vertrouwen.
  Runtime-sessieprojectie wist compatibiliteitsroutingschaduwen uit
  `session_entries.entry_json` voordat getypeerde sessie-/gesprekskolommen worden
  toegepast, zodat verouderde JSON-payloads geen afleverdoelen kunnen laten herleven.
  Subagent-aankondigingsrouting vereist eveneens de getypeerde SQLite-aflevercontext;
  die valt niet langer terug op compatibiliteits-`SessionEntry`-routevelden.
  Gateway `chat.send` expliciete afleverovererving leest de getypeerde SQLite-
  aflevercontext in plaats van `origin`/`last*`-compatibiliteitsvelden.
  `tools.effective` leidt provider-/account-/threadcontext eveneens af uit getypeerde
  SQLite-aflever-/routingrijen, niet uit verouderde `last*`-session-entry-schaduwen.
  Promptcontext voor systeemgebeurtenissen bouwt channel/to/account/thread-velden
  opnieuw op uit getypeerde aflevervelden in plaats van `origin`-schaduwen.
  De gedeelde `deliveryContextFromSession`-helper en session-to-conversation-mapper
  negeren `SessionEntry.origin` nu volledig; alleen getypeerde aflevervelden en
  relationele gespreksrijen kunnen hot route-identiteit maken.
  Runtime-sessie-entry-normalisatie verwijdert `origin` voordat `entry_json` wordt
  gepersisteerd of geprojecteerd, en inkomende metadata schrijft getypeerde
  channel/chat-velden plus relationele gespreksrijen in plaats van nieuwe origin-schaduwen
  te maken.
- Transcriptgebeurtenissen, transcriptsnapshots en traject-runtimegebeurtenissen
  verwijzen nu naar de canonieke per-agent-`sessions`-root en cascaderen bij
  sessieverwijdering. Transcriptidentiteits-/idempotentierijen blijven cascaderen
  vanuit de exacte transcriptgebeurtenisrij.
- Memory-core-indexen gebruiken nu expliciete agentdatabasetabellen
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` en
  `memory_embedding_cache`, waarbij `memory_index_state` revisiewijzigingen bijhoudt.
  Optionele FTS-/vectorzij-indexen heten `memory_index_chunks_fts` en
  `memory_index_chunks_vec` in plaats van generieke tabellen `meta`, `files`, `chunks`,
  `chunks_fts` of `chunks_vec`. De canonieke namen behouden de huidige
  pad-/bronrijvorm en compatibiliteit met geserialiseerde embeddings. Deze tabellen
  zijn afgeleide/zoekcache, geen canonieke transcriptopslag; ze kunnen worden
  verwijderd en opnieuw opgebouwd vanuit geheugenwerkruimtebestanden en geconfigureerde
  bronnen.
  Het openen van een uitgebrachte geheugenindex met generieke naam migreert de metadata,
  bronnen, chunks en embeddingcache naar de canonieke tabellen; afgeleide
  FTS-/vectortabellen worden opnieuw opgebouwd onder hun canonieke namen.
- Herstelstatus voor subagent-runs leeft nu in getypeerde gedeelde `subagent_runs`-rijen
  met geindexeerde child-, requester- en controller-sessiesleutels. Het oude
  `subagents/runs.json`-bestand is alleen doctor-migratie-invoer.
- Huidige gespreksbindingen leven nu in getypeerde gedeelde
  `current_conversation_bindings`-rijen met sleutel op genormaliseerd gespreks-id,
  met doelagent-/sessiekolommen, gesprekssoort, status, vervaldatum en metadata
  opgeslagen als relationele kolommen in plaats van een gedupliceerd opaak bindingrecord.
  De duurzame bindingsleutel bevat de genormaliseerde gesprekssoort, zodat
  direct/group/channel-refs niet kunnen botsen, en SQLite weigert ongeldige waarden
  voor bindingsoort/status. Het oude
  `bindings/current-conversations.json`-bestand is alleen doctor-migratie-invoer.
- Herstel van de afleverqueue legt nu getypeerde queuekolommen voor channel, doel,
  account, sessie, retry, fout, platform-send en herstelstatus over de replay-JSON.
  `entry_json` bewaart de replay-payloads, hooks en formattingpayload, maar getypeerde
  kolommen zijn gezaghebbend voor hot queue-routing/status.
- TUI-laatste-sessie-herstelwijzers leven nu in getypeerde gedeelde
  `tui_last_sessions`-rijen met sleutel op de gehashte TUI-verbindings-/sessiescope.
  Het oude TUI-JSON-bestand is alleen doctor-migratie-invoer.
- Standaard-TTS-voorkeuren leven nu in gedeelde Plugin-status-SQLite-rijen met sleutel
  onder de `speech-core`-Plugin. Het oude `settings/tts.json`-bestand is alleen
  doctor-migratie-invoer; runtime leest of schrijft niet langer TTS-voorkeuren-JSON-bestanden,
  en de legacy-padresolver leeft in de doctor-migratiemodule.
- Metadata voor geheime doelen spreekt nu over stores in plaats van te doen alsof elk
  credential-doel een configuratiebestand is. `openclaw.json` blijft de configuratiestore;
  auth-profile-doelen gebruiken getypeerde SQLite-`auth_profile_stores`-rijen met
  provider-vormige credentials bewaard als JSON-payloads.
- Secretaudit scant niet langer gepensioneerde per-agent-`auth.json`-bestanden. Doctor
  beheert waarschuwingen over, import van en verwijdering van dat legacy-bestand.
- Legacy-auth-profielpadhelpers leven nu in doctor-legacycode. Core-auth-profielpadhelpers
  tonen SQLite-auth-store-identiteit en weergavelocaties, niet
  `auth-profiles.json`- of `auth-state.json`-runtimepaden.
- Runtime-modules voor subagent-runherstel en OpenRouter-modelcapaciteitscache houden
  SQLite-snapshotlezers/-schrijvers nu gescheiden van alleen-doctor legacy-JSON-
  importhelpers. OpenRouter-capaciteiten gebruiken de getypeerde generieke
  `model_capability_cache`-rijen onder `provider_id = "openrouter"` in plaats van
  een opake cacheblob of een provider-specifieke hosttabel. Subagent-run
  `taskName` wordt opgeslagen in de getypeerde kolom `subagent_runs.task_name`; de
  `payload_json`-kopie is replay-/debugdata, niet de bron voor hot weergave- of
  lookupvelden.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementeert een SQLite-VFS
  over de agentdatabasetabel `vfs_entries`. Directoryreads, recursieve exports,
  deletes en renames gebruiken geindexeerde `(namespace, path)`-prefixbereiken
  in plaats van een hele namespace te scannen of op `LIKE`-padmatching te vertrouwen.
- `src/agents/runtime-worker.entry.ts` maakt per-run SQLite-VFS-, toolartefact-,
  runartefact- en scoped cache-stores voor workers.
- Voltooiingsmarkeringen voor workspace-bootstrap leven nu in getypeerde gedeelde
  `workspace_setup_state`-rijen met sleutel op het resolved workspace-pad in plaats van
  `.openclaw/workspace-state.json`; runtime leest of herschrijft de legacy workspace-
  markering niet langer, en helper-API's geven niet langer een nep
  `.openclaw/setup-state`-pad door alleen om opslagidentiteit af te leiden.
- Exec-goedkeuringen leven nu in de getypeerde gedeelde SQLite-`exec_approvals_config`-
  singletonrij. Doctor importeert legacy `~/.openclaw/exec-approvals.json`;
  runtimewrites maken, herschrijven of rapporteren dat bestand niet langer als de actieve
  storelocatie. De macOS-companion leest en schrijft dezelfde
  `state/openclaw.sqlite`-tabelrij; hij bewaart alleen de Unix-promptsocket op schijf
  omdat dat IPC is, geen duurzame runtimestatus.
- Device-identiteit, device-auth en bootstrap-runtimemodules houden hun SQLite-
  snapshotlezers/-schrijvers nu gescheiden van alleen-doctor legacy-JSON-importhelpers.
  Device-identiteit gebruikt getypeerde `device_identities`-rijen en device-auth-tokens
  gebruiken getypeerde `device_auth_tokens`-rijen. Device-auth-writes reconciliëren rijen
  per device/role in plaats van de tokentabel af te kappen, en runtime routeert
  single-token-updates niet langer via de oude whole-store-adapter. De legacy
  versie-1 JSON-payloads bestaan alleen als doctor-import-/exportvormen.
- De GitHub Copilot-cache voor tokenuitwisseling gebruikt de gedeelde SQLite-tabel voor Plugin-status
  onder `github-copilot/token-cache/default`. Dit is cache-status die eigendom is van de provider,
  dus voegt deze bewust geen host-schematabel toe.
- GitHub Copilot Compaction schrijft geen `openclaw-compaction-*.json`
  workspace-sidecars meer. De harness roept de SDK-history-Compaction-RPC aan voor de
  bijgehouden SDK-sessie, en OpenClaw bewaart duurzame sessie-/transcriptstatus in
  SQLite in plaats van compatibiliteitsmarkeringsbestanden.
- De gedeelde Swift-runtime (`OpenClawKit`) gebruikt dezelfde
  `state/openclaw.sqlite`-rijen voor apparaatidentiteit en apparaatauthenticatie. macOS-apphelpers
  importeren de gedeelde SQLite-helpers in plaats van eigenaar te zijn van een tweede JSON- of
  SQLite-pad. Een achtergebleven legacy `identity/device.json` blokkeert het aanmaken van identiteit
  totdat doctor het in SQLite importeert, overeenkomstig de TypeScript- en Android-
  opstartpoort.
- Android-apparaatidentiteit gebruikt hetzelfde TypeScript-compatibele sleutelmateriaal
  dat is opgeslagen in getypeerde `state/openclaw.sqlite#table/device_identities`-rijen. Deze leest of
  schrijft nooit `openclaw/identity/device.json`; een achtergebleven legacy-bestand blokkeert
  het opstarten totdat doctor het in SQLite importeert.
- Android-gecachete apparaatauthenticatietokens gebruiken ook getypeerde
  `state/openclaw.sqlite#table/device_auth_tokens`-rijen en delen dezelfde
  versie-1 tokensemantiek als TypeScript en Swift. De runtime leest geen `SecurePrefs`
  `gateway.deviceToken*`-compatibiliteitssleutels meer; die horen alleen bij migratie-/doctor-
  logica.
- De recente-pakkettenhistorie van Android-meldingen gebruikt getypeerde
  `android_notification_recent_packages`-rijen. De runtime migreert of leest de oude SharedPreferences CSV-sleutels niet meer.
- Het aanmaken van apparaatidentiteit faalt fail-closed wanneer legacy `identity/device.json`
  bestaat, wanneer de SQLite-identiteitsrij ongeldig is, of wanneer de SQLite-identiteitsopslag
  niet kan worden geopend. Doctor importeert en verwijdert dat bestand eerst, zodat de runtime-
  opstart de koppelingsidentiteit niet stilzwijgend kan roteren vóór migratie.
- Selectie van apparaatidentiteit is een SQLite-rijsleutel, geen JSON-bestandslocator. Tests
  en Gateway-helpers geven expliciete identiteitssleutels door; alleen doctor-migratie en de
  fail-closed opstartpoort kennen de buiten gebruik gestelde bestandsnaam `identity/device.json`.
- Compatibiliteit voor sessiereset leeft nu in doctor-configmigratie:
  `session.idleMinutes` wordt verplaatst naar `session.reset.idleMinutes`,
  `session.resetByType.dm` wordt verplaatst naar `session.resetByType.direct`, en het
  runtime-resetbeleid leest alleen canonieke resetsleutels.
- Legacy-configcompatibiliteit leeft nu onder `src/commands/doctor/`. Normale
  `readConfigFileSnapshot()`-validatie importeert geen doctor-legacydetectors
  of annoteert geen legacy-problemen; `runDoctorConfigPreflight()` voegt die problemen toe voor
  doctor-reparatie/-rapportage. De doctor-configflow importeert
  `src/commands/doctor/legacy-config.ts`, en oude OAuth-profiel-id-reparatie leeft
  onder
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Niet-doctor-commando's voeren legacy-configreparatie niet automatisch uit. Bijvoorbeeld:
  `openclaw update --channel` faalt nu bij ongeldige legacy-config en vraagt de
  gebruiker doctor uit te voeren, in plaats van stilzwijgend doctor-migratiecode te importeren.
- Web push, APNs, Voice Wake, updatecontroles en configgezondheid gebruiken nu getypeerde gedeelde SQLite-
  tabellen voor abonnementen, VAPID-sleutels, node-registraties, triggerrijen,
  routeringsrijen, update-meldingsstatus en configgezondheidsvermeldingen in plaats van
  volledige ondoorzichtige JSON-blobs. Snapshot-schrijfacties voor Web push en APNs stemmen
  abonnementen/registraties nu af op basis van primaire sleutel in plaats van hun tabellen leeg te maken;
  configgezondheid doet hetzelfde op basis van configpad.
  Hun runtimemodules houden SQLite-snapshotlezers/-schrijvers gescheiden van
  doctor-only legacy JSON-importhelpers.
- Node-hostconfig gebruikt nu een getypeerde singleton-rij in de gedeelde SQLite-database;
  doctor importeert het oude `node.json`-bestand vóór normaal runtimegebruik.
- Apparaat-/node-koppeling, kanaalkoppeling, kanaal-allowlists en bootstrapstatus
  gebruiken nu getypeerde SQLite-rijen in plaats van volledige ondoorzichtige JSON-blobs. Plugin-binding-
  goedkeuringen en cronjobstatus volgen dezelfde splitsing: runtimemodules stellen
  SQLite-backed bewerkingen en neutrale snapshothelpers beschikbaar, en koppelings-/bootstrap-
  plus Plugin-bindinggoedkeurings-snapshot-schrijfacties stemmen rijen af op primaire sleutel
  in plaats van tabellen af te kappen, terwijl doctor de oude JSON-bestanden importeert/verwijdert via
  `src/commands/doctor/legacy/*`-modules.
- Geïnstalleerde Plugin-records leven nu in de SQLite-index voor geïnstalleerde Plugins.
  Runtime-config lezen/schrijven migreert of bewaart oude
  `plugins.installs` authored-configgegevens niet meer; doctor importeert die legacy-configvorm
  in SQLite vóór normaal runtimegebruik.
- QQBot-snapshots voor herstel van referenties leven nu in SQLite Plugin-status onder
  `qqbot/credential-backups`. De runtime schrijft geen
  `qqbot/data/credential-backup*.json` meer; het QQBot-doctorcontract importeert en
  archiveert die legacy-back-upbestanden vanuit de actieve statusdirectory.
- Gateway-herlaadplanning vergelijkt SQLite-indexsnapshots van geïnstalleerde Plugins onder
  een interne `installedPluginIndex.installRecords.*`-diffnamespace. Runtime-
  herlaadbeslissingen verpakken die rijen niet meer in neppe `plugins.installs`-configobjecten.
- Matrix-upgrade van named-account-referenties gebeurt niet meer tijdens runtime-
  leesacties. Doctor is eigenaar van de oude hernoeming van top-level `credentials/matrix/credentials.json`
  wanneer een enkel/default Matrix-account kan worden opgelost.
- Core-koppelings- en cron-runtimemodules exporteren geen legacy JSON-padbouwers
  meer. Legacy-modules die eigendom zijn van doctor construeren `pending.json`, `paired.json`,
  `bootstrap.json` en `cron/jobs.json`-bronpaden alleen voor importtests en
  migratie. Normalisatie van legacy cronjobvormen en import van cron-runlogs
  leven onder `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importeert legacy JSON-status-
  bestanden, inclusief node-hostconfig, vanuit doctor in SQLite. Nieuwe legacy-bestands-
  importers blijven onder `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importeert legacy `sessions.json` en
  `*.jsonl`-transcripten direct in SQLite en verwijdert succesvolle bronnen. Deze
  staget root-legacytranscripten niet meer via
  `agents/<agentId>/sessions/*.jsonl` en maakt geen canoniek JSONL-doel meer aan vóór
  import.
- Doctor-controles voor statusintegriteit scannen geen legacy-sessiedirectory's meer en
  bieden geen verwijdering van verweesde JSONL-bestanden meer aan. Legacy-transcriptbestanden zijn alleen
  migratie-invoer, en de migratiestap is eigenaar van import plus bronverwijdering.
- Legacy-import van sandboxregister leeft onder
  `src/commands/doctor/legacy/sandbox-registry.ts`; actieve sandboxregister-
  lees- en schrijfwerkzaamheden blijven alleen SQLite.
- De legacy-reparatie voor sessietranscriptgezondheid/import leeft onder
  `src/commands/doctor/legacy/session-transcript-health.ts`; runtimecommando-
  modules dragen geen JSONL-transcriptparsing of active-branch-reparatiecode meer.

Hoogtepunten van voltooide consolidatie/verwijdering:

- Pluginstatus gebruikt nu de gedeelde database `state/openclaw.sqlite`. De oude
  branch-lokale sidecar-importer `plugin-state/state.sqlite` is verwijderd omdat
  die SQLite-indeling nooit is uitgebracht. Probe-/testhelpers rapporteren het gedeelde
  `databasePath` in plaats van een plugin-state-specifiek SQLite-pad beschikbaar te maken.
  Voorbereide workerbeschrijvingen laten ook transcriptlocators weg. Runtime-sessie
  state en wachtrijgeplaatste vervolgruns dragen `{agentId, sessionId}` in plaats van
  afgeleide transcripthandles.
- Ingebedde Compaction haalt SQLite-scope nu uit `agentId` en `sessionId`.
  Compaction-hooks, context-engine-aanroepen, CLI-delegatie en protocolantwoorden
  mogen geen afgeleide `sqlite-transcript://...`-handles ontvangen. Export-/debugcode
  kan expliciete gebruikersartefacten uit rijen materialiseren, maar biedt geen
  generiek JSONL-exportpad voor sessies en voert bestandsnamen niet terug in runtime-
  identiteit.
- `/export-session` leest transcriptrijen uit SQLite en schrijft alleen de gevraagde
  zelfstandige HTML-weergave. De ingebedde viewer reconstrueert of downloadt geen
  sessie-JSONL meer uit die rijen.
- Context-engine-delegatie parseert geen transcriptlocator meer om
  agentidentiteit te herstellen. De voorbereide runtimecontext draagt de opgeloste
  `agentId` mee naar de ingebouwde Compaction-adapter.
- Transcript herschrijven en live truncatie van toolresultaten lezen en bewaren
  transcriptstate nu op `{agentId, sessionId}` en leiden geen tijdelijke
  locators af voor payloads van transcript-update-events.
- Het hulpoppervlak voor transcriptstate heeft geen locator-gebaseerde
  varianten van `readTranscriptState`, `replaceTranscriptStateEvents` of
  `persistTranscriptStateMutation` meer. Runtime-aanroepers moeten de
  `{agentId, sessionId}`-API's gebruiken. Doctor-import leest legacy-bestanden via een expliciet bestandspad
  en schrijft SQLite-rijen; het migreert geen locatorstrings.
- Het contract van de runtime-session-manager exposeert geen `open(locator)`,
  `forkFrom(locator)` of `setTranscriptLocator(...)` meer. Persisted session
  managers openen alleen via `{agentId, sessionId}`; list-/fork-helpers leven op
  rijgerichte sessie- en checkpoint-API's in plaats van op de transcript-manager-
  facade.
- Gateway-API's voor transcriptlezers zijn scope-eerst. Ze nemen
  `{agentId, sessionId}` en accepteren geen positionele transcriptlocator die
  per ongeluk runtime-identiteit zou kunnen worden. Parsing van actieve
  transcriptlocators is verdwenen; legacy-bronpaden worden alleen door
  doctor-importcode gelezen.
- Transcript-update-events zijn ook scope-eerst. `emitSessionTranscriptUpdate`
  accepteert geen losse locatorstring meer, en listeners routeren op
  `{agentId, sessionId}` zonder een handle te parsen.
- Gateway-broadcast van sessieberichten lost sessiesleutels op uit agent-/sessiescope,
  niet uit een transcriptlocator. De oude resolver/cache van transcriptlocator naar
  sessiesleutel is verdwenen.
- Gateway session-history SSE filtert live-updates op agent-/sessiescope. Het
  canonicaliseert geen kandidaten voor transcriptlocators, realpaths of bestandsvormige
  transcriptidentiteiten meer om te bepalen of een stream een update moet ontvangen.
- Sessielevenscyclus-hooks leiden geen transcriptlocators meer af en exposen ze niet meer op
  `session_end`. Hook-consumenten krijgen `sessionId`, `sessionKey`, volgende-sessie-
  id's en agentcontext; transcriptbestanden maken geen deel uit van het levenscyclus-
  contract.
- Reset-hooks leiden ook geen transcriptlocators meer af en exposen ze niet meer. De
  `before_reset`-payload draagt herstelde SQLite-berichten plus de resetreden,
  terwijl sessie-identiteit in de hookcontext blijft.
- Agent-harness-reset accepteert geen transcriptlocator meer. Reset-dispatch is
  gescopeerd op `sessionId`/`sessionKey` plus reden.
- Sessietypen voor agentextensies exposen `transcriptLocator` niet meer; extensies
  moeten sessiecontext en runtime-API's gebruiken in plaats van naar een
  bestandsvormige transcriptidentiteit te grijpen.
- Plugin Compaction-hooks exposen geen transcriptlocators meer. Hookcontext
  draagt al sessie-identiteit, en transcriptlezingen moeten via SQLite-
  scopebewuste API's gaan in plaats van via bestandsvormige handles.
- `before_agent_finalize`-hooks exposen `transcriptPath` niet meer, inclusief
  native hook-relay-payloads. Finalisatiehooks gebruiken alleen sessiecontext.
- Gateway-resetantwoorden synthetiseren geen transcriptlocator meer op de
  geretourneerde entry. De reset maakt SQLite-transcriptrijen, retourneert de schone
  sessie-entry en laat transcripttoegang over aan scopebewuste lezers.
- Resultaten van ingebedde runs en Compaction tonen geen transcriptlocators meer voor
  sessieboekhouding. Automatische Compaction werkt alleen de actieve `sessionId`,
  Compaction-tellers en tokenmetadata bij.
- Resultaten van ingebedde pogingen retourneren geen `transcriptLocatorUsed` meer, en
  resultaten van context-engine `compact()` retourneren geen transcriptlocators meer.
  Runtime-retryloops accepteren alleen een opvolgende `sessionId`.
- Delivery-mirror-resultaten voor toevoegen aan transcript retourneren geen
  transcriptlocators meer. Aanroepers krijgen de toegevoegde `messageId`;
  transcriptupdatesignalen gebruiken SQLite-scope.
- Parent-session fork-helpers retourneren alleen de geforkte `sessionId`. Subagent-
  voorbereiding geeft de scope van de child-agent/-sessie door aan engines.
- CLI-runnerparameters en opnieuw seeden van geschiedenis accepteren geen transcriptlocators meer.
  CLI-geschiedenislezingen lossen de SQLite-transcriptscope op uit `{agentId,
sessionId}` en sessiesleutelcontext.
- CLI- en embedded-runner-testfixtures seeden en lezen SQLite-transcriptrijen nu
  op sessie-id in plaats van te doen alsof actieve sessies `*.jsonl`-bestanden zijn of
  een `sqlite-transcript://...`-string via runtimeparameters door te geven.
- Guard-events voor sessietoolresultaten emitten vanuit bekende sessiescope, zelfs wanneer een
  in-memory manager geen afgeleide locator heeft. De tests faken geen actieve
  `/tmp/*.jsonl`-transcriptbestanden meer.
- BTW- en compaction-checkpoint-helpers lezen en forken transcriptrijen nu op
  SQLite-scope. Checkpointmetadata bewaart nu alleen sessie-id's en leaf-/entry-id's;
  afgeleide locators worden niet meer in checkpointpayloads geschreven.
- Gateway transcript-key lookup gebruikt SQLite-transcriptscope aan protocolgrenzen
  en voert geen realpath of stat meer uit op transcriptbestandsnamen.
- Automatische Compaction-transcriptrotatie schrijft opvolgende transcriptrijen
  direct via de SQLite-transcriptstore. Sessierijen bewaren alleen de opvolgende
  sessie-identiteit, geen duurzaam JSONL-pad of persisted locator.
- Ingebedde context-engine-Compaction gebruikt SQLite-genoemde helpers voor
  transcriptrotatie. De rotatietests construeren geen JSONL-opvolgerpaden meer en
  modelleren actieve sessies niet meer als bestanden.
- Beheerde retentie van uitgaande afbeeldingen baseert de sleutel voor de transcriptberichtencache op
  SQLite-transcriptstatistieken in plaats van filesystem-stat-aanroepen.
- Runtime-sessielocks en de zelfstandige legacy `.jsonl.lock` doctor-
  lane zijn verwijderd.
- De Microsoft Teams-runtime-barrel en openbare Plugin-SDK re-exporteren de oude
  file-lock-helper niet meer; duurzame Plugin-statepaden worden door SQLite ondersteund.
- Snoeien op sessieleeftijd/-aantal en expliciete sessieopschoning zijn verwijderd.
  Doctor is eigenaar van legacy-import; verouderde sessies worden expliciet gereset of verwijderd.
- Doctor-integriteitscontroles tellen een legacy JSONL-bestand niet meer als geldig actief
  transcript voor een SQLite-sessierij. Gezondheid van actieve transcripts is alleen SQLite;
  legacy JSONL-bestanden worden gerapporteerd als invoer voor migratie/orphan-cleanup.
- Doctor behandelt `agents/<agent>/sessions/` niet meer als vereiste runtime-
  state. Het scant die directory alleen wanneer die al bestaat, als legacy-import
  of invoer voor orphan-cleanup.
- Gateway `sessions.resolve`, sessie patch-/reset-/compact-paden, subagent-
  spawning, snelle abort, ACP-metadata, Heartbeat-geisoleerde sessies en TUI-
  patching migreren of snoeien legacy-sessiesleutels niet meer als neveneffect van
  normaal runtimewerk.
- CLI-resolutie van commandsessies retourneert nu de eigenaar-`agentId` in plaats van een
  `storePath`, en kopieert geen legacy main-session-rijen meer tijdens normale
  `--to`- of `--session-id`-resolutie. Legacy canonicalisatie van main-rijen hoort
  alleen bij doctor.
- Runtime-resolutie van subagentdiepte leest geen `sessions.json` of JSON5-
  sessiestores meer. Het leest SQLite `session_entries` op agent-id, en legacy
  diepte-/sessiemetadata kunnen alleen via het doctor-importpad binnenkomen.
- Sessie-overrides voor authprofielen blijven bestaan via directe `{agentId, sessionKey}`-
  rij-upserts in plaats van lazy-loading van een bestandsvormige session-store-runtime.
- Verbose gating voor auto-reply en sessie-updatehelpers lezen/upserten nu SQLite-
  sessierijen op sessie-identiteit en vereisen geen legacy storepad meer voordat
  persisted rijstate wordt aangeraakt.
- Helpers voor command-run-sessiemetadata gebruiken nu entry-gerichte namen en module-
  paden; het oude `session-store` command-helperoppervlak is verwijderd.
- Bootstrap-header-seeding en hardening van handmatige Compaction-grenzen muteren nu
  SQLite-transcriptrijen direct. Runtime-aanroepers geven sessie-identiteit door, geen
  schrijfbare `.jsonl`-paden.
- Stille replay van sessierotatie kopieert recente user-/assistant-beurten op
  `{agentId, sessionId}` uit SQLite-transcriptrijen. Het accepteert geen bron- of
  doeltranscriptlocators meer.
- Nieuwe runtime-sessierijen bewaren geen transcriptlocators meer. Aanroepers gebruiken
  `{agentId, sessionId}` direct; export-/debugcommands kunnen uitvoerbestandsnamen
  kiezen wanneer ze rijen materialiseren.
- Een nieuwe persisted transcriptsessie starten opent SQLite-rijen nu altijd op
  scope. De session manager hergebruikt geen eerder transcriptpad of locator uit het
  bestandstijdperk meer als identiteit voor de nieuwe sessie.
- Persisted transcriptsessies gebruiken de expliciete
  `openTranscriptSessionManagerForSession({agentId, sessionId})`-API. De oude
  statische `SessionManager.create/openForSession/list/forkFromSession`-facades zijn
  verdwenen zodat tests en runtimecode niet per ongeluk sessiedetectie uit het
  bestandstijdperk kunnen recreëren.
- Plugin-runtime exposeert `api.runtime.agent.session.resolveTranscriptLocatorPath` niet meer;
  Plugincode gebruikt SQLite-rijhelpers en scopewaarden.
- Het openbare `session-store-runtime`-SDK-oppervlak exporteert nu alleen helpers voor sessierijen
  en transcriptrijen. Gerichte SQLite-schema-/pad-/transactiehelpers
  leven in `sqlite-runtime`; raw open-/close-/reset-helpers blijven lokaal alleen voor
  first-party tests.
- Legacy `.jsonl`-classifiers voor traject-/checkpointbestandsnamen leven nu in de
  doctor-module voor legacy sessiebestanden. Core-sessievalidering importeert geen
  helpers voor bestandsartefacten meer om normale SQLite-sessie-id's te bepalen.
- Active Memory-blokkerende subagentruns gebruiken SQLite-transcriptrijen in plaats van
  tijdelijke of persisted `session.jsonl`-bestanden onder Plugin-state te maken. De
  oude `transcriptDir`-optie is verwijderd.
- Eenmalige sluggeneratie en Crestodian-plannerruns gebruiken SQLite-transcriptrijen
  in plaats van tijdelijke `session.jsonl`-bestanden te maken.
- `llm-task`-helperruns en verborgen commitment-extractie gebruiken ook SQLite-
  transcriptrijen, zodat deze model-only helpersessies geen tijdelijke JSON/JSONL-
  transcriptbestanden meer maken.
- `TranscriptSessionManager` is nu alleen een geopende SQLite-transcriptscope.
  Runtimecode opent die met `openTranscriptSessionManagerForSession({agentId,
sessionId})`; create-, branch-, continue-, list- en fork-flows leven in hun
  eigenaar-SQLite-rijhelpers in plaats van in statische managerfacades.
  Doctor-/import-/debugcode behandelt expliciete legacy-bronbestanden buiten de
  runtime-session-manager.
- De verouderde facade-methoden `SessionManager.newSession()` en
  `SessionManager.createBranchedSession()` zijn verwijderd. Nieuwe
  sessies en transcriptdescendants worden gemaakt door hun eigenaar-SQLite-
  workflow in plaats van een al geopende manager naar een andere persisted
  sessie te muteren.
- Beslissingen over parent-transcript-forks en forkcreatie accepteren geen
  `storePath` of `sessionsDir` meer; ze gebruiken `{agentId, sessionId}` SQLite-
  transcriptscope in plaats van bewaarde filesystem-padmetadata.
- Memory-host exporteert geen no-op helpers voor transcriptclassificatie van sessie-
  directory's meer; transcriptfiltering wordt nu afgeleid uit SQLite-rijmetadata
  tijdens entryconstructie.
- Memory-host- en QMD-tests voor sessie-export gebruiken SQLite-transcriptscopes. Oude
  `agents/<agentId>/sessions/*.jsonl`-paden blijven alleen gedekt waar een test
  bewust doctor-/import-/exportcompatibiliteit bewijst.
- Raw sessie-inspectie in QA-lab gebruikt nu `sessions.list` via de Gateway
  in plaats van `agents/qa/sessions/sessions.json` te lezen; MSteams-feedback
  voegt rechtstreeks toe aan SQLite-transcripten zonder een JSONL-pad te verzinnen.
- Gedeelde inkomende kanaalbeurten dragen nu `{agentId, sessionKey}` in plaats van een
  verouderde `storePath`. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch en QQBot-opnamepaden lezen nu bijgewerkte-op-metadata en leggen
  inkomende sessierijen vast via SQLite-identiteit.
- Persistentie van transcriptlocators is verwijderd uit actieve sessierijen.
  `resolveSessionTranscriptTarget` retourneert `agentId`, `sessionId` en optionele
  topicmetadata; doctor is de enige code die verouderde transcriptbestandsnamen
  importeert.
- Runtime-transcriptheaders beginnen bij SQLite-versie `1`. Oude JSONL V1/V2/V3
  vormupgrades leven alleen in doctor-import en normaliseren geïmporteerde headers naar
  de huidige SQLite-transcriptversie voordat rijen worden opgeslagen.
- De database-first guard verbiedt nu `SessionManager.listAll` en
  `SessionManager.forkFromSession`; workflows voor sessielijsten en fork/herstel
  moeten op rij-/scoped SQLite-API's blijven.
- De guard verbiedt ook verouderde helpernamen voor transcript-JSONL-parse/actieve-branch-reparatie
  buiten doctor-/importcode, zodat runtime geen tweede verouderd
  transcriptmigratiepad kan krijgen.
- Ingebedde PI-runs weigeren inkomende transcripthandles. Ze gebruiken de SQLite
  `{agentId, sessionId}`-identiteit vóór workerstart en opnieuw voordat de
  poging transcriptstatus raakt. Een verouderde `/tmp/*.jsonl`-invoer kan geen
  runtime-schrijfdoel selecteren.
- Cachetrace-, Anthropic-payload-, raw stream- en diagnostische tijdlijnrecords
  schrijven nu naar getypeerde SQLite-`diagnostic_events`-rijen. Gateway-stabiliteitsbundels
  schrijven nu naar getypeerde SQLite-`diagnostic_stability_bundles`-rijen. De oude
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` en
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL-overridepaden zijn verwijderd, en
  normale stabiliteitsvastlegging schrijft niet langer `logs/stability/*.json`-bestanden.
- Cron-persistentie verzoent nu SQLite-`cron_jobs`-rijen in plaats van
  de hele jobtabel bij elke opslag te verwijderen en opnieuw in te voegen. Plugin-doel
  writebacks werken overeenkomende Cron-rijen rechtstreeks bij en houden runtime-Cron-status in
  dezelfde statusdatabasetransactie.
- Cron-runtimecallers gebruiken nu een stabiele SQLite Cron-store-sleutel. Verouderde
  `cron.store`-paden zijn alleen doctor-importinvoer; productie-Gateway, taakonderhoud,
  status, run-log en Telegram-doelwritebackpaden gebruiken
  `resolveCronStoreKey` en normaliseren de sleutel niet langer als pad. Cron-status meldt nu
  `storeKey` in plaats van het oude bestandsvormige `storePath`-veld.
- Cron-runtimelading en planning normaliseren niet langer verouderde persistente jobvormen
  zoals `jobId`, `schedule.cron`, numerieke `atMs`, stringbooleans of
  ontbrekende `sessionTarget`. Doctor legacy-import bezit die reparaties voordat rijen
  in SQLite worden ingevoegd.
- ACP-spawn lost geen transcript-JSONL-bestandspaden meer op en persisteert die niet.
  Spawn- en thread-bindconfiguratie persisteren de SQLite-sessierij rechtstreeks en behouden
  de sessie-id als de bewaarde transcriptidentiteit.
- ACP-sessiemetadata-API's lezen/lijsten/upserten nu SQLite-rijen per `agentId` en
  stellen `storePath` niet langer bloot als onderdeel van het ACP-sessie-entrycontract.
- Sessiegebruiksboekhouding en Gateway-gebruiksaggregatie lossen transcripten nu
  alleen op via `{agentId, sessionId}`. De kosten-/gebruikscache en ontdekte-sessiesamenvattingen
  synthetiseren of retourneren geen transcriptlocatorstrings meer.
- Gateway-chatappend, abort-partial-persistentie, `/sessions.send` en
  webchat-mediatranscriptschrijfacties voegen rechtstreeks toe via SQLite-transcriptscope.
  De Gateway-transcriptinjectiehelper accepteert niet langer een
  `transcriptLocator`-parameter.
- SQLite-transcriptontdekking vermeldt nu alleen transcriptscopes en statistieken:
  `{agentId, sessionId, updatedAt, eventCount}`. De dode
  compatibiliteitshelper `listSqliteSessionTranscriptLocators` en het per-rij
  `locator`-veld zijn verdwenen.
- Transcriptreparatieruntime stelt nu alleen
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` bloot. De oude
  locatorgebaseerde reparatiehelper is verwijderd; doctor-/debugcode leest expliciete
  bronbestandspaden en migreert nooit locatorstrings.
- ACP-replay-ledger-runtime slaat per-sessie replayrijen nu op in de gedeelde
  SQLite-statusdatabase in plaats van `acp/event-ledger.json`; doctor importeert en
  verwijdert het verouderde bestand.
- Gateway-transcriptlezerhelpers leven nu in
  `src/gateway/session-transcript-readers.ts` in plaats van de oude
  modulenaam `session-utils.fs`. De fallbackcontrole voor opnieuw-proberen-geschiedenis is genoemd naar
  SQLite-transcriptinhoud in plaats van het oude file-helper-oppervlak.
- Gateway injected-chat- en compaction-helpers geven nu SQLite-transcriptscope door
  via interne helper-API's in plaats van waarden transcriptpaden of
  bronbestanden te noemen.
- Bootstrap-voortzettingsdetectie controleert nu SQLite-transcriptrijen via
  `hasCompletedBootstrapTranscriptTurn`; ze stelt niet langer een bestandsvormige
  helpernaam bloot.
- Embedded-runner-tests gebruiken nu SQLite-transcriptidentiteit, en het openen van een nieuwe
  transcriptmanager vereist altijd een expliciete `sessionId`.
- Geheugenindexeringshelpers gebruiken nu van begin tot eind SQLite-transcriptterminologie:
  host exporteert `listSessionTranscriptScopesForAgent` en
  `sessionTranscriptKeyForScope`, gerichte synchronisatiewachtrijen `sessionTranscripts`,
  publieke sessiezoekhits tonen opaque `transcript:<agent>:<session>`-paden,
  en de interne DB-bronsleutel is `session:<session>` onder
  `source_kind='sessions'` in plaats van een nepbestandspad.
- De generieke Plugin SDK persistent-dedupe-helper stelt geen bestandsvormige
  opties meer bloot. Callers leveren SQLite-scopesleutels en duurzame dedupe-rijen leven in
  gedeelde Plugin-status.
- Microsoft Teams SSO-tokens zijn verplaatst van vergrendelde JSON-bestanden naar SQLite Plugin-status.
  Doctor importeert `msteams-sso-tokens.json`, herbouwt canonieke SSO-tokensleutels
  uit payloads en verwijdert het bronbestand. Gedelegeerde OAuth-tokens blijven
  op hun bestaande private credential-file boundary.
- Matrix-synccachestatus is verplaatst van `bot-storage.json` naar SQLite Plugin-status.
  Doctor importeert verouderde raw of gewrapte syncpayloads en verwijdert het
  bronbestand. Actieve Matrix- en QA Matrix-clients geven een SQLite sync-store-rootdirectory door,
  geen nep `sync-store.json`- of `bot-storage.json`-pad.
- Matrix legacy crypto-migratiestatus is verplaatst van
  `legacy-crypto-migration.json` naar SQLite Plugin-status. Doctor importeert het
  oude statusbestand; Matrix SDK IndexedDB-snapshots zijn verplaatst van
  `crypto-idb-snapshot.json` naar SQLite Plugin-blobs. Matrix-herstelsleutels en
  credentials zijn SQLite Plugin-statusrijen; hun oude JSON-bestanden zijn alleen
  doctor-migratie-invoer.
- Memory Wiki-activiteitslogs gebruiken nu SQLite Plugin-status in plaats van
  `.openclaw-wiki/log.jsonl`. De Memory Wiki-migratieprovider importeert oude
  JSONL-logs; wiki-markdown en gebruikerskluisinhoud blijven file-backed als
  workspace-inhoud.
- Memory Wiki maakt niet langer `.openclaw-wiki/state.json` of de ongebruikte
  directory `.openclaw-wiki/locks` aan. De migratieprovider verwijdert die gepensioneerde
  Plugin-metadatabestanden als een oudere kluis ze nog heeft.
- Crestodian-audititems gebruiken nu core SQLite Plugin-status in plaats van
  `audit/crestodian.jsonl`. Doctor importeert de verouderde JSONL-auditlog en
  verwijdert die na succesvolle import.
- Config schrijf-/observe-audititems gebruiken nu core SQLite Plugin-status in plaats
  van `logs/config-audit.jsonl`. Doctor importeert de verouderde JSONL-auditlog en
  verwijdert die na succesvolle import.
- De macOS companion schrijft niet langer app-lokale `logs/config-audit.jsonl`- of
  `logs/config-health.json`-sidecars terwijl `openclaw.json` wordt bewerkt. Het configbestand
  blijft file-backed, herstelsnapshots blijven naast het configbestand,
  en duurzame config-audit-/healthstatus hoort bij de Gateway SQLite-store.
- Crestodian rescue-wachtende goedkeuringen gebruiken nu core SQLite Plugin-status in plaats
  van `crestodian/rescue-pending/*.json`. Doctor importeert verouderde wachtende-goedkeuringsbestanden
  en verwijdert ze na succesvolle import.
- Phone Control tijdelijke arm-status gebruikt nu SQLite Plugin-status in plaats van
  `plugins/phone-control/armed.json`. Doctor importeert het verouderde armed-state-bestand
  in de namespace `phone-control/arm-state` en verwijdert het bestand.
- Doctor repareert JSONL-transcripten niet langer in-place en maakt geen back-up-JSONL-bestanden
  meer aan. Het importeert de actieve branch in SQLite en verwijdert de verouderde bron.
- Transcriptopzoeking van de session-memory-hook gebruikt alleen scoped SQLite-lezingen
  met `{agentId, sessionId}`. De helper accepteert of deriveert niet langer transcriptlocators,
  verouderde bestandslezingen of opties voor bestands-herschrijven.
- Codex app-server-conversatiebindingen keyen SQLite Plugin-status nu op
  OpenClaw-sessiesleutel of expliciete `{agentId, sessionId}`-scope. Ze mogen geen
  fallbackbindingen op basis van transcriptpaden bewaren.
- Codex app-server mirrored-history-lezingen gebruiken alleen de SQLite-transcriptscope;
  ze mogen identiteit niet herstellen uit transcriptbestandspaden.
- Role-ordering- en compaction-resetpaden unlinken oude transcriptbestanden niet langer;
  reset roteert alleen de SQLite-sessierij en transcriptidentiteit.
- Gateway-reset- en checkpointreacties retourneren schone sessierijen plus sessie-id's.
  Ze synthetiseren niet langer SQLite-transcriptlocators voor clients.
- Memory-core dreaming snoeit sessierijen niet langer door te peilen naar ontbrekende
  JSONL-bestanden. Subagent-opruiming loopt via de sessieruntime-API in plaats van
  filesystem-existence-controles. De transcript-ingestion-tests seeden SQLite-rijen
  rechtstreeks in plaats van `agents/<id>/sessions`-fixtures of locatorplaceholders
  aan te maken.
- Geheugentranscriptindexering mag `transcript:<agentId>:<sessionId>` tonen als een
  virtueel zoekhitpad voor citation-/leeshelpers. De duurzame indexbron is
  relationeel (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), dus de waarde is geen runtime-transcriptlocator,
  geen bestandssysteempad en mag nooit terug worden doorgegeven aan sessieruntime-API's.
- Gateway doctor-geheugenstatus leest short-term recall- en phase-signal-aantallen
  uit SQLite Plugin-statusrijen in plaats van `memory/.dreams/*.json`; CLI- en
  doctoruitvoer labelen die opslag nu als een SQLite-store, niet als een pad.
- Memory-core-runtime, CLI-status, Gateway doctor-methoden en Plugin SDK-facades
  auditen of archiveren geen verouderde `.dreams/session-corpus`-bestanden meer.
  Die bestanden zijn alleen migratie-invoer; doctor importeert ze in SQLite en
  verwijdert de bron na verificatie. Actieve session-ingestion-bewijsrijen
  gebruiken nu het virtuele SQLite-pad `memory/session-ingestion/<day>.txt`; runtime
  schrijft nooit status naar of leidt status af uit `.dreams/session-corpus`.
- Memory-core publieke artefacten tonen SQLite-hostevents als het virtuele JSON-artefact
  `memory/events/memory-host-events.json`; ze hergebruiken niet langer het
  verouderde bronpad `.dreams/events.jsonl`.
- Sandbox-container-/browserregistries gebruiken nu de gedeelde
  SQLite-tabel `sandbox_registry_entries` met getypeerde kolommen voor sessie, image,
  timestamp, backend/config en browserpoort. Doctor importeert verouderde monolithische en
  gesharde JSON-registerbestanden en verwijdert succesvolle bronnen. Runtimelezingen gebruiken
  de getypeerde rijkolommen als source of truth; `entry_json` is alleen een replay-/debugkopie.
- Commitments gebruiken nu een getypeerde gedeelde tabel `commitments` in plaats van een
  JSON-blob voor de hele store. Snapshotopslagen upserten per commitment-id en verwijderen alleen
  ontbrekende rijen in plaats van de tabel leeg te maken en opnieuw in te voegen. Runtimeladingen
  laden commitments uit getypeerde scope-, delivery-window-, status-, attempt- en tekstkolommen;
  `record_json` is alleen een replay-/debugkopie. Doctor importeert verouderde
  `commitments.json` en verwijdert het na een succesvolle import.
- Cron-jobdefinities, planningsstatus en uitvoeringsgeschiedenis hebben niet langer runtime
  JSON-schrijvers of -lezers. Runtime gebruikt `cron_jobs`-rijen met getypeerde planning,
  payload-, delivery-, failure-alert-, session-, status- en runtime-state-kolommen plus getypeerde
  `cron_run_logs`-metadata voor status, diagnostische samenvatting, afleverstatus/-fout,
  session/run, model en tokentotalen. `job_json` is alleen een replay-/debugkopie; `state_json` bewaart geneste
  runtime-diagnostiek die nog geen hot-queryvelden heeft, terwijl de runtime
  hot statusvelden opnieuw hydrateert vanuit getypeerde kolommen. Doctor importeert
  verouderde `jobs.json`-, `jobs-state.json`- en `runs/*.jsonl`-bestanden en verwijdert
  de geïmporteerde bronnen. Plugin-target-terugschrijvingen werken overeenkomende `cron_jobs`-
  rijen bij in plaats van de hele cron-store te laden en te vervangen.
- Gateway-opstart negeert verouderde `notify: true`-markeringen in de runtime-
  projectie. Doctor vertaalt ze naar expliciete SQLite-aflevering wanneer
  `cron.webhook` geldig is, verwijdert inerte markeringen wanneer die niet is ingesteld, en behoudt
  ze met een waarschuwing wanneer de geconfigureerde webhook ongeldig is.
- Uitgaande en session-afleverwachtrijen slaan nu wachtrijstatus, itemsoort,
  session-sleutel, kanaal, target, account-id, aantal nieuwe pogingen, laatste poging/fout,
  herstelstatus en platform-send-markeringen op als getypeerde kolommen in de gedeelde
  `delivery_queue_entries`-tabel. Runtime-herstel leest die hot velden uit
  de getypeerde kolommen, en retry-/herstelmutaties werken die kolommen direct bij
  zonder replay-JSON te herschrijven. De volledige JSON-payload blijft alleen bestaan als de
  replay-/debugblob voor berichtinhoud en andere koude replaygegevens.
- Beheerde uitgaande afbeeldingsrecords gebruiken nu getypeerde gedeelde
  `managed_outgoing_image_records`-rijen, terwijl mediabytes nog steeds worden opgeslagen in
  `media_blobs`. Het JSON-record blijft alleen bestaan als replay-/debugkopie.
- Discord-modelkiezer-voorkeuren, command-deploy-hashes en threadbindingen
  gebruiken nu gedeelde SQLite-Plugin-status. Hun verouderde JSON-importplannen bevinden zich in het
  Discord-Plugin setup-/doctor-migratieoppervlak, niet in core-migratiecode.
- Verouderde Plugin-importdetectors gebruiken door doctor benoemde modules zoals
  `doctor-legacy-state.ts` of `doctor-state-imports.ts`; normale channel-runtime-
  modules mogen geen verouderde JSON-detectors importeren.
- BlueBubbles-catchup-cursors en inbound-dedupe-markeringen gebruiken nu gedeelde SQLite-
  Plugin-status. Hun verouderde JSON-importplannen bevinden zich in het BlueBubbles-Plugin
  setup-/doctor-migratieoppervlak, niet in core-migratiecode.
- Telegram-update-offsets, stickercache-rijen, sent-message-cache-rijen,
  topic-name-cache-rijen en threadbindingen gebruiken nu gedeelde SQLite-Plugin-
  status. Hun verouderde JSON-importplannen bevinden zich in het Telegram-Plugin
  setup-/doctor-migratieoppervlak, niet in core-migratiecode.
- iMessage-catchup-cursors, reply short-id-mappings en sent-echo-dedupe-rijen
  gebruiken nu gedeelde SQLite-Plugin-status. De oude `imessage/catchup/*.json`-,
  `imessage/reply-cache.jsonl`- en `imessage/sent-echoes.jsonl`-bestanden zijn
  alleen doctor-inputs.
- Feishu-berichtdedupe-rijen gebruiken nu gedeelde SQLite-Plugin-status in plaats van
  `feishu/dedup/*.json`-bestanden. Het verouderde JSON-importplan bevindt zich in het Feishu-
  Plugin setup-/doctor-migratieoppervlak, niet in core-migratiecode.
- Microsoft Teams-gesprekken, polls, pending upload-buffers en feedback-
  learnings gebruiken nu gedeelde SQLite-Plugin-status-/blobtabellen. Het pending upload-
  pad gebruikt `plugin_blob_entries`, zodat mediabuffers worden opgeslagen als SQLite BLOBs
  in plaats van base64-JSON. De namen van de runtime-helpers gebruiken nu SQLite-/state-naamgeving
  in plaats van `*-fs`-file-store-naamgeving, en de oude `storePath`-shim is verdwenen
  uit deze stores. Het verouderde JSON-importplan bevindt zich in het Microsoft Teams-
  Plugin setup-/doctor-migratieoppervlak.
- Door Zalo gehoste outbound media gebruikt nu gedeelde SQLite `plugin_blob_entries`
  in plaats van `openclaw-zalo-outbound-media` JSON/bin tijdelijke sidecars.
- Diffs viewer-HTML en metadata gebruiken nu gedeelde SQLite `plugin_blob_entries`
  in plaats van tijdelijke `meta.json`-/`viewer.html`-bestanden. Gerenderde PNG-/PDF-uitvoer blijft
  tijdelijke materialisaties omdat channel-aflevering nog steeds een bestandspad nodig heeft.
- Door Canvas beheerde documenten gebruiken nu gedeelde SQLite `plugin_blob_entries` in plaats
  van een standaardmap `state/canvas/documents`. De Canvas-host serveert die
  blobs direct; lokale bestanden worden alleen gemaakt voor expliciete `host.root`-
  operatorinhoud of tijdelijke materialisatie wanneer een downstream medialeezer
  een pad vereist.
- File Transfer-auditbeslissingen gebruiken nu gedeelde SQLite `plugin_state_entries`
  in plaats van het onbegrensde `audit/file-transfer.jsonl` runtime-log. Doctor
  importeert het verouderde JSONL-auditbestand in Plugin-status en verwijdert de bron
  na een schone import.
- ACPX-procesleases en Gateway-instantie-identiteit gebruiken nu gedeelde SQLite-Plugin-
  status. Doctor importeert het verouderde `gateway-instance-id`-bestand in Plugin-status
  en verwijdert de bron.
- Door ACPX gegenereerde wrapper-scripts en de geïsoleerde Codex-home zijn tijdelijke
  materialisatie onder de OpenClaw-temp-root, geen duurzame OpenClaw-status. De
  duurzame ACPX-runtime-records zijn de SQLite-lease- en gateway-instance-rijen;
  het oude ACPX `stateDir`-configoppervlak is verwijderd omdat daar geen runtime-status
  meer wordt geschreven.
- Gateway-media-bijlagen gebruiken nu de gedeelde SQLite-tabel `media_blobs` als
  canonieke byte-store. Lokale paden die aan channel- en sandbox-
  compatibiliteitsoppervlakken worden teruggegeven, zijn tijdelijke materialisaties van de databaserij,
  niet de duurzame media-store. Runtime-media-allowlists bevatten niet langer verouderde
  `$OPENCLAW_STATE_DIR/media`- of config-dir `media`-roots; die mappen zijn
  alleen doctor-importbronnen.
- Shell completion schrijft niet langer `$OPENCLAW_STATE_DIR/completions/*` cache-
  bestanden. Install-, doctor-, update- en release-smoke-paden gebruiken gegenereerde
  completion-uitvoer of profile sourcing in plaats van duurzame completion-cache-
  bestanden.
- Gateway skill-upload-staging gebruikt nu gedeelde `skill_uploads`-rijen. Upload-
  metadata, idempotency-sleutels en archiefbytes staan in SQLite; de installer
  ontvangt alleen een tijdelijk gematerialiseerd archiefpad terwijl een installatie
  draait.
- Inline-bijlagen van subagents worden niet langer gematerialiseerd onder workspace
  `.openclaw/attachments/*`. Het spawn-pad bereidt SQLite VFS-seed-items voor,
  inline-runs seeden die items in de per-agent runtime scratch-namespace,
  en disk-backed tools leggen die SQLite scratch als overlay voor bijlagepaden. De
  oude registry-kolommen en cleanup-hooks voor subagent-run attachment-dir zijn verdwenen.
- CLI-afbeeldingshydratie onderhoudt niet langer stabiele `openclaw-cli-images` cache-
  bestanden. Externe CLI-backends ontvangen nog steeds bestandspaden, maar die paden zijn
  tijdelijke materialisaties per run met cleanup.
- Cache-trace-diagnostiek, Anthropic-payloaddiagnostiek, raw model stream-
  diagnostiek, diagnostische timeline-events en Gateway-stabiliteitsbundels schrijven nu
  SQLite-rijen in plaats van `logs/*.jsonl`- of
  `logs/stability/*.json`-bestanden.
  Runtime path override-flags en env vars zijn verwijderd; export-/debug-
  commando's kunnen bestanden expliciet materialiseren vanuit databaserijen.
- De macOS-companion heeft niet langer een rollende `diagnostics.jsonl`-writer. App-
  logs gaan naar unified logging, en duurzame Gateway-diagnostiek blijft SQLite-backed.
- De macOS port-guardian-recordlijst gebruikt nu getypeerde gedeelde SQLite
  `macos_port_guardian_records`-rijen in plaats van een Application Support-JSON-bestand
  of opaque singleton-blob.
- Gateway singleton-locks gebruiken nu getypeerde gedeelde SQLite `state_leases`-rijen onder
  de `gateway_locks`-scope in plaats van lockbestanden in de temp-dir. Fly- en OAuth-
  troubleshootingdocumentatie verwijst nu naar de SQLite lease/auth refresh-lock in plaats
  van verouderde file-lock-cleanup.
- Gateway restart sentinel-status gebruikt nu getypeerde gedeelde SQLite
  `gateway_restart_sentinel`-rijen in plaats van `restart-sentinel.json`; runtime
  leest sentinelsoort, status, routing, bericht, continuation en statistieken uit
  getypeerde kolommen. `payload_json` is alleen een replay-/debugkopie. Runtime-code wist
  de SQLite-rij direct en draagt geen file cleanup-plumbing meer mee.
- Gateway restart intent- en supervisor handoff-status gebruiken nu getypeerde gedeelde
  SQLite `gateway_restart_intent`- en `gateway_restart_handoff`-rijen in plaats van
  `gateway-restart-intent.json`- en
  `gateway-supervisor-restart-handoff.json`-sidecars.
- Gateway singleton-coördinatie gebruikt nu getypeerde `state_leases`-rijen onder
  `gateway_locks` in plaats van `gateway.<hash>.lock`-bestanden te schrijven. De lease-rij
  bezit de lock owner, expiry, heartbeat en debug-payload; SQLite bezit de
  atomische acquire/release-grens. De uitgefaseerde file-lock-directory-optie is
  verdwenen; tests gebruiken de SQLite-rijidentiteit direct.
- De oude niet-gerefereerde cron usage-report-helper die `cron/runs/*.jsonl`-
  bestanden scande, is verwijderd. Cron run-history-rapporten moeten de getypeerde
  `cron_run_logs` SQLite-rijen lezen.
- Main-session restart-herstel ontdekt candidate-agents nu via de
  SQLite `agent_databases`-registry in plaats van `agents/*/sessions`-
  mappen te scannen.
- Gemini session-corruption-herstel verwijdert nu alleen de SQLite session-rij;
  het heeft niet langer een verouderde `storePath`-gate nodig en probeert geen afgeleid
  transcript-JSONL-pad te unlinken.
- Path override-afhandeling behandelt letterlijke `undefined`-/`null`-environment-
  waarden nu als unset, waardoor onbedoelde repo-root `undefined/state/*.sqlite`-
  databases tijdens tests of shell-handoffs worden voorkomen.
- Config health-fingerprints gebruiken nu getypeerde gedeelde SQLite `config_health_entries`-
  rijen in plaats van `logs/config-health.json`, waardoor het normale configbestand het
  enige niet-credential configuratiedocument blijft. De macOS-companion houdt alleen
  proceslokale health-status bij en maakt de oude JSON-sidecar niet opnieuw aan.
- Auth profile-runtime importeert of schrijft niet langer credential-JSON-bestanden. De
  canonieke credential-store is SQLite; `auth-profiles.json`, per-agent
  `auth.json` en gedeelde `credentials/oauth.json` zijn doctor-migratie-inputs
  die na import worden verwijderd.
- Auth profile-save-/state-tests controleren nu direct getypeerde SQLite-auth-tabellen
  en gebruiken verouderde auth-profile-bestandsnamen alleen voor doctor-migratie-inputs.
- `openclaw secrets apply` scrubt alleen het configbestand, env-bestand en de SQLite
  auth-profile-store. Het draagt niet langer compatibiliteitslogica die
  uitgefaseerde per-agent `auth.json` bewerkt; doctor bezit het importeren en verwijderen van dat bestand.
- Hermes-geheimmigratieplannen en applies importeerden API-key-profielen direct
  in de SQLite auth-profile-store. Het schrijft of verifieert niet langer
  `auth-profiles.json` als tussendoel.
- Gebruikersgerichte auth-documentatie beschrijft nu
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` in plaats van
  gebruikers te vertellen `auth-profiles.json` te inspecteren of te kopiëren; verouderde OAuth-/auth-JSON-
  namen blijven alleen gedocumenteerd als doctor-import-inputs.
- Core state-path-helpers stellen het uitgefaseerde `credentials/oauth.json`-
  bestand niet langer beschikbaar. De verouderde bestandsnaam is lokaal voor het doctor auth-importpad.
- Install-, security-, onboarding-, model-auth- en SecretRef-documentatie beschrijft nu
  SQLite auth-profile-rijen en whole-state backup/migratie in plaats van
  per-agent auth-profile-JSON-bestanden.
- PI-modeldiscovery geeft nu canonieke credentials door aan in-memory
  `pi-coding-agent` auth-opslag. Het maakt, scrubt of schrijft niet langer
  per-agent `auth.json` tijdens discovery.
- Voice Wake-trigger- en routeringsinstellingen gebruiken nu getypeerde gedeelde SQLite-tabellen
  in plaats van `settings/voicewake.json`, `settings/voicewake-routing.json` of
  opaque generieke rijen; doctor importeert de verouderde JSON-bestanden en verwijdert ze na een
  geslaagde migratie.
- Update-check-status gebruikt nu een getypeerde gedeelde `update_check_state`-rij in plaats van
  `update-check.json` of een opaque generieke blob; doctor importeert
  het verouderde JSON-bestand en verwijdert het na een geslaagde migratie.
- Config health-status gebruikt nu getypeerde gedeelde `config_health_entries`-rijen in plaats
  van `logs/config-health.json` of een opaque generieke blob; doctor
  importeert het verouderde JSON-bestand en verwijdert het na een geslaagde migratie.
- Goedkeuringen voor Plugin-conversation-bindingen gebruiken nu getypeerde
  `plugin_binding_approvals`-rijen in plaats van opaque gedeelde SQLite-status of
  `plugin-binding-approvals.json`; het legacybestand is invoer voor een doctormigratie.
- Generieke bindingen voor huidige gesprekken slaan nu getypeerde
  `current_conversation_bindings`-rijen op in plaats van
  `bindings/current-conversations.json` te herschrijven; doctor importeert het legacy-JSON-bestand en
  verwijdert het na een geslaagde migratie.
- Memory Wiki-ledgers voor geïmporteerde-bronsynchronisatie slaan nu één SQLite-rij voor pluginstatus op
  per kluis-/bronsleutel in plaats van `.openclaw-wiki/source-sync.json` te herschrijven;
  de migratieprovider importeert en verwijdert het legacy-JSON-ledger.
- Memory Wiki ChatGPT-records voor importruns slaan nu één SQLite-rij voor pluginstatus op
  per kluis-/run-id in plaats van `.openclaw-wiki/import-runs/*.json` te schrijven.
  Rollback-snapshots blijven expliciete kluisbestanden totdat archivering van importrun-snapshots
  naar blobopslag is verplaatst.
- Gecompileerde digests van Memory Wiki slaan nu SQLite-pluginblobrijen op in plaats van
  `.openclaw-wiki/cache/agent-digest.json` en
  `.openclaw-wiki/cache/claims.jsonl` te schrijven. De migratieprovider importeert oude cachebestanden
  en verwijdert de cachemap wanneer die leeg wordt.
- ClawHub-tracking van Skill-installaties slaat nu één SQLite-rij voor pluginstatus op per
  werkruimte/skill in plaats van `.clawhub/lock.json` en
  `.clawhub/origin.json`-sidecars tijdens runtime te schrijven of te lezen. Runtimecode gebruikt statusobjecten
  voor bijgehouden installaties in plaats van lockfile-/origin-abstracties met bestandsvorm. Doctor
  importeert de legacy-sidecars uit geconfigureerde agentwerkruimten en verwijdert ze
  na een schone import.
- De geïnstalleerde-pluginindex leest en schrijft nu de getypeerde gedeelde SQLite
  `installed_plugin_index`-singletonrij in plaats van `plugins/installs.json`; het
  legacy-JSON-bestand is alleen invoer voor een doctormigratie en wordt na import verwijderd.
- De legacy `plugins/installs.json`-padhulp leeft nu in legacycode van doctor.
  Runtime-pluginindexmodules bieden alleen SQLite-ondersteunde persistentieopties,
  geen JSON-bestandspad.
- Gateway-herstartsentinel, herstartintentie en supervisor-overdrachtstatus gebruiken nu
  getypeerde gedeelde SQLite-rijen (`gateway_restart_sentinel`,
  `gateway_restart_intent` en `gateway_restart_handoff`) in plaats van generieke
  ondoorzichtige blobs. Runtime-herstartcode heeft geen sentinel-/intentie-/overdrachtcontract
  met bestandsvorm.
- Matrix-synchronisatiecache, opslagmetadata, threadbindingen, inbound deduplicatiemarkeringen,
  cooldownstatus voor opstartverificatie, SDK IndexedDB-cryptosnapshots,
  referenties en herstelsleutels gebruiken nu gedeelde SQLite-pluginstatus-/blobtabellen.
  Runtime-padstructs tonen niet langer een `storage-meta.json`-metadatapad; die bestandsnaam
  is alleen invoer voor legacy-migratie. Hun legacy-JSON-importplan leeft in het
  setup-/doctormigratieoppervlak van de Matrix-plugin.
- Matrix-opstart scant, rapporteert of voltooit legacy Matrix-bestandsstatus niet meer.
  Matrix-bestandsdetectie, aanmaak van legacy-cryptosnapshots, migratiestatus voor room-key-herstel,
  import en bronverwijdering zijn allemaal eigendom van doctor.
- Matrix-runtime-migratiebarrels zijn verwijderd. Legacy-status-/cryptodetectie
  en mutatiehelpers worden rechtstreeks door Matrix-doctor geïmporteerd in plaats van deel uit te maken
  van het runtime-API-oppervlak.
- Markeringen voor hergebruik van Matrix-migratiesnapshots leven nu in SQLite-pluginstatus
  in plaats van `matrix/migration-snapshot.json`; doctor kan nog steeds hetzelfde
  geverifieerde premigratiearchief hergebruiken zonder een sidecar-statusbestand te schrijven.
- Nostr-buscursors en publicatiestatus van profielen gebruiken nu gedeelde SQLite-pluginstatus.
  Hun legacy-JSON-importplan leeft in het setup-/doctormigratieoppervlak van de Nostr-plugin.
- Active Memory-sessieschakelaars gebruiken nu gedeelde SQLite-pluginstatus in plaats van
  `session-toggles.json`; geheugen weer inschakelen verwijdert de rij in plaats van
  een JSON-object te herschrijven.
- Skill Workshop-voorstellen en reviewtellers gebruiken nu gedeelde SQLite-pluginstatus
  in plaats van `skill-workshop/<workspace>.json`-opslag per werkruimte. Elk
  voorstel is een aparte rij onder `skill-workshop/proposals`, en de reviewteller
  is een aparte rij onder `skill-workshop/reviews`.
- Skill Workshop-reviewer-subagentruns gebruiken nu de transcriptresolver voor runtimesessies
  in plaats van `skill-workshop/<sessionId>.json`-sidecarpaden voor sessies te maken.
- ACPX-procesleases gebruiken nu gedeelde SQLite-pluginstatus onder
  `acpx/process-leases` in plaats van een volledig `process-leases.json`-registerbestand.
  Elke lease wordt als eigen rij opgeslagen, waardoor het opruimen van verouderde processen bij opstart
  behouden blijft zonder runtimepad dat JSON herschrijft.
- ACPX-wrapperscripts en de geïsoleerde Codex-home worden gegenereerd in de
  tijdelijke root van OpenClaw. Ze worden opnieuw aangemaakt wanneer nodig en zijn geen backup- of
  migratie-invoer.
- Persistentie van het subagentrunregister gebruikt getypeerde gedeelde `subagent_runs`-rijen. Het
  oude `subagents/runs.json`-pad is nu alleen invoer voor een doctormigratie, en
  namen van runtimehelpers beschrijven de statuslaag niet langer als schijfondersteund.
  Runtimetests maken niet langer ongeldige of lege `runs.json`-fixtures aan om
  registergedrag te bewijzen; ze seeden/lezen SQLite-rijen rechtstreeks.
- Backup staged de statusmap vóór archivering, kopieert niet-databasebestanden,
  maakt snapshots van `*.sqlite`-databases met `VACUUM INTO`, laat live WAL/SHM-
  sidecars weg, registreert snapshotmetadata in het archiefmanifest en registreert
  voltooide backupruns in SQLite met het archiefmanifest. `openclaw backup
create` valideert het geschreven archief standaard; `--no-verify` is het
  expliciete snelle pad.
- `openclaw backup restore` valideert het archief vóór extractie, hergebruikt het
  genormaliseerde manifest van de verifier en herstelt geverifieerde manifestassets naar hun
  geregistreerde bronpaden. Het vereist `--yes` voor schrijfacties en ondersteunt `--dry-run`
  voor een herstelplan.
- Het oude backupfilter voor vluchtige paden is verwijderd. Backup heeft geen
  live-tar-oversla-lijst meer nodig voor legacy sessie- of cron-JSON/JSONL-bestanden omdat SQLite-
  snapshots vóór archiefaanmaak worden gestaged.
- Eenvoudige setup en onboarding-werkruimtevoorbereiding maken niet langer
  `agents/<agentId>/sessions/`-mappen aan. Ze maken alleen configuratie/werkruimte aan;
  SQLite-sessierijen en transcriptrijen worden op aanvraag gemaakt in de
  database per agent.
- Reparatie van beveiligingsrechten richt zich nu op de globale en per-agent SQLite-
  databases plus WAL/SHM-sidecars in plaats van `sessions.json` en transcript-
  JSONL-bestanden.
- Runtime-namen van het sandboxregister beschrijven nu SQLite-registertypen rechtstreeks
  in plaats van legacy-JSON-registerterminologie door de actieve opslag mee te dragen.
- `openclaw reset --scope config+creds+sessions` verwijdert per-agent
  `openclaw-agent.sqlite`-databases plus WAL/SHM-sidecars, niet alleen legacy
  `sessions/`-mappen.
- Gateway-helpers voor geaggregeerde sessies gebruiken nu invoergerichte namen:
  `loadCombinedSessionEntriesForGateway` retourneert `{ databasePath, entries }`.
  De oude naamgeving voor gecombineerde opslag is verwijderd uit runtime-aanroepers.
- Docker MCP-kanaalseeding schrijft nu de hoofd-sessierij en transcriptevents
  naar de per-agent SQLite-database in plaats van
  `sessions.json` en een JSONL-transcript aan te maken.
- De gebundelde sessiegeheugen-hook resolveert nu vorige-sessiecontext uit
  SQLite via `{agentId, sessionId}`. Hij scant, bewaart of synthetiseert niet langer
  transcriptpaden of `workspace/sessions`-mappen.
- De gebundelde command-logger-hook schrijft nu commando-auditrijen naar de gedeelde
  SQLite-tabel `command_log_entries` in plaats van aan
  `logs/commands.log` toe te voegen.
- Allowlists voor kanaalkoppeling tonen nu alleen SQLite-ondersteunde lees-/schrijfhelpers tijdens
  runtime en in de plugin-SDK. De oude `*-allowFrom.json`-padresolver en
  bestandlezer leven alleen onder doctor-legacy-importcode.
- `migration_runs` registreert uitvoeringen van legacy-statusmigraties met status,
  tijdstempels en JSON-rapporten.
- `migration_sources` registreert elke geïmporteerde legacy-bestandsbron met hash, grootte,
  recordaantal, doeltabel, run-id, status en bronverwijderingsstatus.
- `backup_runs` registreert backup-archiefpaden, status en JSON-manifesten.
- Het globale schema houdt geen ongebruikte `agents`-registertabel bij. Agent-
  databasedetectie is het canonieke `agent_databases`-register totdat runtime
  een echte eigenaar voor agentrecords heeft.
- Gegenereerde configuratie voor modelcatalogi wordt opgeslagen in getypeerde globale SQLite-
  `agent_model_catalogs`-rijen, gesleuteld op agentmap. Runtime-aanroepers gebruiken
  `ensureOpenClawModelCatalog`; er is geen `models.json`-compatibiliteits-API in
  runtimecode. De implementatie schrijft SQLite en het ingebedde PI-register wordt
  gehydrateerd vanuit die opgeslagen payload zonder een `models.json`-bestand te maken.
- QMD-markdownexport van sessietranscripten en `memory.qmd.sessions`-configuratie zijn
  verwijderd. Er is geen QMD-transcriptverzameling, geen `qmd/sessions*`-runtimepad
  en geen bestandsgebaseerde brug voor sessiegeheugen.
- Memory-core-runtime importeert SQLite-transcriptindexeringshelpers uit
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, niet het
  QMD-SDK-subpad. Het QMD-subpad behoudt alleen een compatibiliteits-re-export voor
  externe aanroepers totdat een grote SDK-opschoning die kan verwijderen.
- QMD's eigen `index.sqlite` is nu een tijdelijke runtime-materialisatie, ondersteund door de
  hoofd-SQLite-tabel `plugin_blob_entries`. Runtime maakt niet langer een duurzame
  `~/.openclaw/agents/<agentId>/qmd`-sidecar aan.
- De optionele `memory-lancedb`-plugin maakt niet langer
  `~/.openclaw/memory/lancedb` aan als impliciete door OpenClaw beheerde opslag. Het is een
  externe LanceDB-backend en blijft uitgeschakeld totdat de operator een expliciete
  `dbPath` configureert.
- `check:database-first-legacy-stores` faalt nieuwe runtimebron die
  legacy-opslagnamen koppelt aan schrijfachtige bestandssysteem-API's. Het faalt ook runtimebron
  die de gepensioneerde transcriptbrugmarkeringen
  `transcriptLocator` of `sqlite-transcript://...` opnieuw introduceert. Migratie, doctor, import
  en expliciete niet-sessie-exportcode blijven toegestaan. Bredere legacycontract-
  namen zoals `sessionFile`, `storePath` en oude `SessionManager`-facades uit het bestandstijdperk
  hebben nog huidige eigenaars en hebben apart werk voor migratiebewaking nodig
  voordat ze een vereiste preflightcheck kunnen worden. De guard dekt nu ook
  runtime-`cache/*.json`-opslag, generieke
  `thread-bindings.json`-sidecars, cron-status-/run-log-JSON, JSON voor configuratiegezondheid,
  herstart- en lock-sidecars, Voice Wake-instellingen, pluginbindinggoedkeuringen,
  JSON voor geïnstalleerde-pluginindex, File Transfer-audit-JSONL, Memory Wiki-activiteitslogs,
  het oude gebundelde `command-logger`-tekstlog en pi-mono raw-stream JSONL-
  diagnoseknoppen. Hij verbiedt ook oude root-level legacy-modulenamen van doctor zodat
  compatibiliteitscode onder `src/commands/doctor/` blijft. Android-debughandlers
  gebruiken ook logcat-/in-memory-uitvoer in plaats van `camera_debug.log`- of
  `debug_logs.txt`-cachebestanden te stagen.

## Doelschemavorm

Houd schema's expliciet. Runtime-status die eigendom is van de host gebruikt getypeerde tabellen. Ondoorzichtige status die eigendom is van Plugins gebruikt `plugin_state_entries` / `plugin_blob_entries`; er is geen generieke hosttabel `kv`.

Globale database:

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

Agentdatabase:

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

Toekomstig zoeken kan FTS-tabellen toevoegen zonder de canonieke gebeurtenistabellen te wijzigen:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Grote waarden moeten `blob`-kolommen gebruiken, geen JSON-stringcodering. Houd `value_json` voor kleine gestructureerde gegevens die inspecteerbaar moeten blijven met gewone SQLite-tools.

`agent_databases` is het canonieke register voor deze branch. Voeg geen tabel `agents` toe totdat er een echte eigenaar van agentrecords bestaat; agentconfiguratie blijft in `openclaw.json`.

## Vorm van Doctor-migratie

Doctor moet een expliciete migratiestap aanroepen die rapporteerbaar is en veilig opnieuw kan worden uitgevoerd:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` roept de statusmigratie-implementatie aan na de gewone configuratiepreflight en maakt een geverifieerde back-up vóór import. Runtime-startup en `openclaw migrate` mogen geen verouderde OpenClaw-statusbestanden importeren.

Migratie-eigenschappen:

- Eén migratiepassage ontdekt alle verouderde bestandsbronnen en maakt een plan voordat er iets wordt gewijzigd.
- Doctor maakt een geverifieerd pre-migratieback-uparchief voordat verouderde bestanden worden geïmporteerd.
- Imports zijn idempotent en worden gekoppeld aan bronpad, mtime, grootte, hash en doeltabel.
- Succesvolle bronbestanden worden verwijderd of gearchiveerd nadat de doeldatabase heeft gecommit.
- Mislukte imports laten de bron ongemoeid en registreren een waarschuwing in `migration_runs`.
- Runtime-code leest alleen SQLite nadat de migratie bestaat.
- Er is geen downgrade- of export-naar-runtime-bestandenpad vereist.

## Migratie-inventaris

Verplaats deze naar de globale database:

- Runtime-schrijfacties voor het taakregister gebruiken nu de gedeelde database; de niet-uitgebrachte
  `tasks/runs.sqlite`-sidecar-importer is verwijderd. Snapshot-opslagen voeren een upsert uit op taak-
  id en verwijderen alleen ontbrekende taak-/bezorgingsrijen.
- Runtime-schrijfacties voor Task Flow gebruiken nu de gedeelde database; de niet-uitgebrachte
  `tasks/flows/registry.sqlite`-sidecar-importer is verwijderd. Snapshot-opslagen
  voeren een upsert uit op flow-id en verwijderen alleen ontbrekende flowrijen.
- Runtime-schrijfacties voor Plugin-status gebruiken nu de gedeelde database; de niet-uitgebrachte
  `plugin-state/state.sqlite`-sidecar-importer is verwijderd.
- Ingebouwd geheugen zoeken gebruikt niet langer standaard `memory/<agentId>.sqlite`; de
  indextabellen staan in de database van de eigenaar-agent, en de expliciete
  `memorySearch.store.path`-sidecar-opt-in is verplaatst naar doctor-configuratiemigratie.
- Ingebouwd geheugen opnieuw indexeren reset alleen geheugeneigen tabellen in de agentdatabase.
  Het mag niet het hele SQLite-bestand vervangen, omdat dezelfde database ook
  sessies, transcripties, VFS-rijen, artefacten en runtimecaches bezit.
- Sandbox-container-/browserregisters uit monolithische en geshardede JSON. Runtime-
  schrijfacties gebruiken nu de gedeelde database; import van verouderde JSON blijft bestaan.
- Cron-taakdefinities, planningsstatus en uitvoeringsgeschiedenis gebruiken nu gedeelde SQLite;
  doctor importeert/verwijdert verouderde `jobs.json`-, `jobs-state.json`- en
  `cron/runs/*.jsonl`-bestanden
- Apparaatidentiteit/auth, push, updatecontrole, commitments, OpenRouter-model-
  cache, index van geïnstalleerde plugins en app-serverbindingen
- Apparaat-/Node-koppeling en bootstrap-records gebruiken nu getypeerde SQLite-tabellen
- Device-pair-meldingsabonnees en markers voor geleverde verzoeken gebruiken nu de
  gedeelde SQLite-plugin-statustabel in plaats van `device-pair-notify.json`.
- Gespreksrecords voor spraakoproepen gebruiken nu de gedeelde SQLite-plugin-statustabel onder de
  `voice-call` / `calls`-namespace in plaats van `calls.jsonl`; de Plugin-CLI
  volgt en vat SQLite-ondersteunde gespreksgeschiedenis samen.
- QQBot Gateway-sessies, bekende-gebruiker-records en ref-index-citaatcache gebruiken nu
  SQLite-pluginstatus onder `qqbot`-namespaces (`gateway-sessions`,
  `known-users`, `ref-index`) in plaats van `session-*.json`, `known-users.json`
  en `ref-index.jsonl`. Die verouderde bestanden zijn caches en worden niet gemigreerd.
- Discord-modelkiezer-voorkeuren, command-deploy-hashes en threadbindingen
  gebruiken nu SQLite-pluginstatus onder `discord`-namespaces
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  in plaats van `model-picker-preferences.json`, `command-deploy-cache.json` en
  `thread-bindings.json`; de Discord doctor/setup-migratie importeert en
  verwijdert de verouderde bestanden.
- BlueBubbles-catchup-cursors en inkomende dedupe-markers gebruiken nu SQLite-pluginstatus
  onder `bluebubbles`-namespaces (`catchup-cursors`, `inbound-dedupe`)
  in plaats van `bluebubbles/catchup/*.json` en
  `bluebubbles/inbound-dedupe/*.json`; de BlueBubbles doctor/setup-migratie
  importeert en verwijdert de verouderde bestanden.
- Telegram-update-offsets, stickercache-items, berichtcache-items voor antwoordketens,
  verzonden-berichtcache-items, onderwerpnaamcache-items en threadbindingen
  gebruiken nu SQLite-pluginstatus onder `telegram`-namespaces
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) in plaats van `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` en
  `thread-bindings-*.json`; de Telegram doctor/setup-migratie importeert en
  verwijdert de verouderde bestanden.
- iMessage-catchup-cursors, mappings voor korte antwoord-id's en dedupe-rijen voor verzonden echo's
  gebruiken nu SQLite-pluginstatus onder `imessage`-namespaces (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) in plaats van `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` en `imessage/sent-echoes.jsonl`; de iMessage
  doctor/setup-migratie importeert en verwijdert de verouderde bestanden.
- Microsoft Teams-gesprekken, polls, SSO-tokens en feedbacklearnings gebruiken nu
  SQLite-pluginstatusnamespaces (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) in plaats van `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` en `*.learnings.json`; de
  Microsoft Teams doctor/setup-migratie importeert en archiveert de verouderde bestanden.
  Wachtende uploads zijn een kortlevende SQLite-cache en oude JSON-cachebestanden worden
  niet gemigreerd.
- Matrix-synccache, opslagmetadata, threadbindingen, inkomende dedupe-markers,
  cooldownstatus voor opstartverificatie, referenties, herstelsleutels en SDK
  IndexedDB-cryptosnapshots gebruiken nu SQLite-pluginstatus-/blobnamespaces onder
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  in plaats van `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` en `crypto-idb-snapshot.json`; de Matrix doctor/setup-
  migratie importeert en verwijdert die verouderde bestanden uit accountgebonden Matrix-
  opslagroots.
- Nostr-buscursors en publicatiestatus van profielen gebruiken nu SQLite-pluginstatus onder
  `nostr`-namespaces (`bus-state`, `profile-state`) in plaats van
  `bus-state-*.json` en `profile-state-*.json`; de Nostr doctor/setup-
  migratie importeert en verwijdert de verouderde bestanden.
- Active Memory-sessietoggles gebruiken nu SQLite-pluginstatus onder
  `active-memory/session-toggles` in plaats van `session-toggles.json`.
- Skill Workshop-voorstelwachtrijen en reviewtellers gebruiken nu SQLite-pluginstatus
  onder `skill-workshop/proposals` en `skill-workshop/reviews` in plaats van
  per-workspace `skill-workshop/<workspace>.json`-bestanden.
- Wachtrijen voor uitgaande bezorging en sessiebezorging delen nu de globale SQLite-
  `delivery_queue_entries`-tabel onder afzonderlijke wachtrijnamen
  (`outbound-delivery`, `session-delivery`) in plaats van duurzame
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` en
  `session-delivery-queue/*.json`-bestanden. De doctor legacy-state-stap importeert
  wachtende en mislukte rijen, verwijdert verouderde geleverde markers en verwijdert de oude
  JSON-bestanden na import. Hot-routing- en retryvelden zijn getypeerde kolommen; de
  JSON-payload blijft alleen behouden voor replay/debug.
- ACPX-procesleases gebruiken nu SQLite-pluginstatus onder `acpx/process-leases`
  in plaats van `process-leases.json`.
- Metadata van back-up- en migratieruns

Verplaats deze naar agentdatabases:

- Agent-sessieroots en compatibiliteitsvormige session-entry-payloads. Gereed voor
  runtime-schrijfacties: hot sessiemetadata is opvraagbaar in `sessions`, terwijl de
  volledige verouderd gevormde `SessionEntry`-payload in `session_entries` blijft.
- Agent-transcriptiegebeurtenissen. Gereed voor runtime-schrijfacties.
- Compaction-checkpoints en transcriptiesnapshots. Gereed voor runtime-schrijfacties:
  checkpoint-transcriptiekopieën zijn SQLite-transcriptierijen en checkpoint-
  metadata wordt vastgelegd in `transcript_snapshots`. Gateway-checkpointhelpers
  noemen deze waarden nu transcriptiesnapshots in plaats van bronbestanden.
- Agent-VFS-scratch-/workspace-namespaces. Gereed voor runtime-VFS-schrijfacties.
- Subagent-bijlagepayloads. Gereed voor runtime-schrijfacties: het zijn SQLite-VFS-
  seed-items en nooit duurzame workspacebestanden.
- Toolartefacten. Gereed voor runtime-schrijfacties.
- Runartefacten. Gereed voor worker-runtime-schrijfacties via de per-agent
  `run_artifacts`-tabel.
- Agent-lokale runtimecaches. Gereed voor worker-runtime-scoped cache-schrijfacties via
  de per-agent `cache_entries`-tabel. Gateway-brede modelcaches blijven in de
  globale database tenzij ze agent-specifiek worden.
- ACP-parentstreamlogs. Gereed voor runtime-schrijfacties.
- ACP-replay-ledgersessies. Gereed voor runtime-schrijfacties via
  `acp_replay_sessions` en `acp_replay_events`; verouderde `acp/event-ledger.json`
  blijft alleen als doctor-input bestaan.
- ACP-sessiemetadata. Gereed voor runtime-schrijfacties via `acp_sessions`; verouderde
  `entry.acp`-blokken in `sessions.json` zijn alleen input voor doctor-migratie.
- Trajectory-sidecars wanneer het geen expliciete exportbestanden zijn. Gereed voor runtime-
  schrijfacties: trajectory-capture schrijft agentdatabase-`trajectory_runtime_events`-
  rijen en spiegelt run-scoped artefacten naar SQLite. Verouderde sidecars zijn alleen
  doctor-importinput; export kan verse JSONL-supportbundeloutputs materialiseren
  maar leest of migreert oude trajectory-/transcriptiesidecars niet tijdens runtime.
  Runtime-trajectory-capture stelt SQLite-scope beschikbaar; JSONL-padhelpers zijn
  geïsoleerd tot export-/debugondersteuning en worden niet opnieuw geëxporteerd vanuit de runtimemodule.
  Embedded-runner-trajectorymetadata registreert `{agentId, sessionId, sessionKey}`-
  identiteit in plaats van een transcriptielocator te bewaren.

Houd deze voorlopig bestandsgebaseerd:

- `openclaw.json`
- provider- of CLI-referentiebestanden
- plugin-/pakketmanifests
- gebruikersworkspaces en Git-repositories wanneer schijfmodus is geselecteerd
- logs bedoeld voor operator-tailing, tenzij een specifiek logoppervlak wordt verplaatst

## Migratieplan

### Fase 0: De grens bevriezen

Maak de duurzame-statusgrens expliciet voordat meer rijen worden verplaatst:

- Voeg een `migration_runs`-tabel toe aan de globale database.
  Gereed voor uitvoeringsrapporten van legacy-state-migraties.
- Voeg één doctor-eigen statusmigratieservice toe voor import van bestand naar database.
  Gereed: `openclaw doctor --fix` gebruikt de legacy-state-migratie-implementatie.
- Maak `plan` alleen-lezen en laat `apply` een back-up maken, importeren, verifiëren en
  daarna oude bestanden verwijderen of in quarantaine plaatsen.
  Gereed: doctor maakt een geverifieerde pre-migratieback-up, geeft het back-uppad
  door aan `migration_runs` en hergebruikt de importer-/verwijderpaden.
- Voeg statische verboden toe zodat nieuwe runtimecode geen verouderde statusbestanden kan schrijven terwijl
  migratiecode en tests ze nog steeds kunnen seeden/lezen.
  Gereed voor de momenteel gemigreerde verouderde stores; de guard scant ook geneste
  tests op verboden runtime-transcriptielocatorcontracten.

### Fase 1: Het globale control plane afronden

Houd gedeelde coördinatiestatus in `state/openclaw.sqlite`:

- Agents en agentdatabaseregister
- Task- en Task Flow-ledgers
- Pluginstatus
- Sandbox-container-/browserregister
- Cron-/scheduler-uitvoeringsgeschiedenis
- Koppeling, apparaat, push, updatecontrole, TUI, OpenRouter-/modelcaches en andere
  kleine Gateway-scoped runtime-status
- Back-up- en migratiemetadata
- Gateway-mediabijlagebytes. Gereed voor runtime-schrijfacties; directe bestandspaden
  zijn tijdelijke materialisaties voor compatibiliteit met kanaalverzenders en sandbox-
  staging. Runtime-allowlists accepteren SQLite-materialisatiepaden, niet verouderde
  state-/config-mediaroots. Doctor importeert verouderde mediabestanden naar
  `media_blobs` en verwijdert de bronbestanden na geslaagde rijschrijfacties.
- Debugproxy-capturesessies, gebeurtenissen en payloadblobs. Gereed: captures leven
  in de gedeelde status-DB en openen via de bootstrap, het schema, WAL en de
  busy-timeout-instellingen van de gedeelde status-DB. Payloadbytes zijn gzip-gecomprimeerd in
  `capture_blobs.data`; er is geen runtime-sidecar-DB-override voor debugproxy,
  blobdirectory of proxy-capture-only gegenereerd schema/codegen-target.
  Doctor-/opstartmigratie importeert verzonden `debug-proxy/capture.sqlite`-rijen
  en gerefereerde payloadblobs, inclusief actieve verouderde DB-/blobomgevings-
  overrides, en archiveert daarna die bronnen terwijl CA-certificaten intact blijven.

Deze fase verwijdert ook dubbele sidecar-openers, permissiehelpers, WAL-
setup, bestandssysteemopschoning en compatibiliteitsschrijvers uit die subsystemen.

### Fase 2: Per-agent-databases introduceren

Maak één database per agent en registreer die vanuit de globale DB:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

De globale `agent_databases`-rij bewaart het pad, de schemaversie, de last-seen-
tijdstempel en basismetadata voor grootte/integriteit. Runtimecode vraagt het register om
de agent-DB in plaats van bestandspaden direct af te leiden.

De agent-DB bezit:

- `sessions` als de canonieke sessieroot, met `session_entries` als de
  compatibel gevormde payloadtabel die aan die root is gekoppeld, en
  `session_routes` als de unieke actieve `session_key`-lookup
- `conversations` en `session_conversations` als de genormaliseerde provider-
  routeringsidentiteit die aan sessies is gekoppeld
- `transcript_events`
- transcriptsnapshots en Compaction-checkpoints. Voltooid voor runtime-writes.
- `vfs_entries`
- `tool_artifacts` en run-artefacten
- agent-lokale runtime-/cacherijen. Voltooid voor worker-scoped caches.
- ACP-parentstreamevents
- trajectory-runtime-events wanneer ze geen expliciete exportartefacten zijn

### Fase 3: Vervang Session Store-API's

Voltooid voor runtime. Het bestandsvormige session store-oppervlak is geen
actief runtimecontract:

- Runtime roept `loadSessionStore(storePath)` niet meer aan en behandelt
  `storePath` niet als sessie-identiteit.
- Runtime-rijbewerkingen zijn `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` en `listSessionEntries`.
- Helpers voor herschrijven van de hele store, bestandswriters, queue-tests,
  aliasopschoning en parameters voor legacy-keyverwijdering zijn uit runtime
  verdwenen.
- Verouderde compatibiliteitsexports van het rootpakket passen canonieke
  `sessions.json`-paden nog steeds aan op de SQLite-rij-API's.
- `sessions.json`-parsing blijft alleen in doctor-migratie-/importcode en
  doctor-tests.
- Runtime-lifecyclefallbacks lezen SQLite-transcriptheaders, niet de eerste
  JSONL-regels.

Blijf alles verwijderen dat bestandslockparameters, vocabulaire rond
opschonen/afkappen-als-bestandsonderhoud, store-path-identiteit of tests
opnieuw introduceert waarvan de enige assertie JSON-persistentie is.

### Fase 4: Verplaats transcripts, ACP-streams, trajectories en VFS

Maak elke agentdatastream database-native:

- Transcript-append-writes lopen via één SQLite-transactie die de sessieheader
  waarborgt, bericht-idempotentie controleert, de parent-tail selecteert, invoegt
  in `transcript_events` en doorzoekbare identiteitsmetadata vastlegt in
  `transcript_event_identities`. Voltooid voor directe transcriptbericht-appends
  en normale persistente `TranscriptSessionManager`-appends; expliciete
  branchbewerkingen behouden hun expliciete parentkeuze en schrijven nog steeds
  SQLite-rijen zonder een bestandslocator af te leiden.
- ACP-parentstreamlogs worden rijen, geen `.acp-stream.jsonl`-bestanden.
  Voltooid.
- ACP-spawnsetup persisteert geen transcript-JSONL-paden meer. Voltooid.
- Runtime-trajectorycapture schrijft eventrijen/artefacten direct. De expliciete
  support-/exportopdracht kan nog steeds support-bundle-JSONL-artefacten als
  exportformaat produceren, maar sessie-export maakt geen sessie-JSONL opnieuw
  aan. Voltooid.
- Schijfworkspaces blijven op schijf wanneer ze als schijfmodus zijn
  geconfigureerd.
- VFS-scratch en experimentele VFS-only-workspacemodus gebruiken de agent-DB.

De migratie importeert oude JSONL-bestanden één keer, legt aantallen/hashes vast
in `migration_runs` en verwijdert geïmporteerde bestanden na
integriteitscontroles.

### Fase 5: Back-up, herstel, vacuum en verificatie

Back-ups blijven één archiefbestand:

- Checkpoint elke globale en agentdatabase.
- Snapshot elke DB met SQLite-back-upsemantiek of `VACUUM INTO`.
- Archiveer compacte DB-snapshots, configuratie, externe credentials en
  aangevraagde workspace-exports.
- Laat ruwe live `*.sqlite-wal`- en `*.sqlite-shm`-bestanden weg.
- Verifieer door elke DB-snapshot te openen en `PRAGMA integrity_check` uit te
  voeren. `openclaw backup create` doet deze archiefverificatie standaard;
  `--no-verify` slaat alleen de archiefpass na het schrijven over, niet de
  integriteitscontrole bij het maken van de snapshot.
- Herstel kopieert snapshots terug naar hun doelpaden. Deze branch reset de
  niet-verzonden SQLite-layout naar `user_version = 1`; toekomstige verzonden
  schemawijzigingen kunnen expliciete migraties toevoegen wanneer die nodig
  zijn.

### Fase 6: Worker-runtime

Houd workermodus experimenteel terwijl de databasesplitsing landt:

- Workers ontvangen agent-id, run-id, bestandssysteemmodus en
  DB-registry-identiteit.
- Elke worker opent zijn eigen SQLite-verbinding.
- Parent behoudt autoriteit over kanaallevering, approvals, configuratie en
  annulering.
- Begin met één worker per actieve run; voeg pooling pas toe nadat lifecycle en
  eigenaarschap van DB-verbindingen stabiel zijn.

### Fase 7: Verwijder de oude wereld

Voltooid voor runtime-sessiebeheer. De oude wereld is alleen toegestaan als
expliciete doctor-input of support-/exportoutput:

- Geen runtime-writes naar `sessions.json`, transcript-JSONL,
  sandboxregistry-JSON, taak-sidecar-SQLite of plugin-state-sidecar-SQLite.
- Geen JSON-/sessiebestandopschoning, transcriptbestand-afkapping,
  sessiebestandslocks of lockvormige sessietests.
- Geen runtime-compatibiliteitsexports waarvan het doel is oude sessiebestanden
  actueel te houden.
- Expliciete supportexports blijven door de gebruiker aangevraagde
  archief-/materialisatieformaten en mogen bestandsnamen niet terugvoeren naar
  runtime-identiteit.

## Back-up en herstel

Back-ups moeten één archiefbestand zijn, maar databasecapture moet
SQLite-native zijn:

1. Stop langdurige write-activiteit of ga een korte back-upbarrière in.
2. Voer voor elke globale en agentdatabase een checkpoint uit.
3. Maak een snapshot van elke database met SQLite-back-upsemantiek of
   `VACUUM INTO` naar een tijdelijke back-updirectory.
4. Archiveer de gecompacteerde databasesnapshots, het configuratiebestand, de
   credentialsdirectory, geselecteerde workspaces en een manifest.
5. Verifieer het archief door elke opgenomen SQLite-snapshot te openen en
   `PRAGMA integrity_check` uit te voeren.
   `openclaw backup create` doet dit standaard; `--no-verify` is alleen bedoeld
   om bewust de archiefpass na het schrijven over te slaan.

Vertrouw niet op ruwe live kopieën van `*.sqlite`, `*.sqlite-wal` en
`*.sqlite-shm` als primair back-upformaat. Het archiefmanifest moet
databaserol, agent-id, schemaversie, bronpad, snapshotpad, bytegrootte en
integriteitsstatus vastleggen.

Herstel moet de globale database- en agentdatabasebestanden opnieuw opbouwen
vanuit de archiefsnapshots. Omdat de SQLite-layout nog niet is verzonden, behoudt
deze refactor alleen het versie-1-schema plus doctor-import van bestand naar
database. De herstelopdracht valideert eerst het archief en vervangt daarna elk
manifestasset vanuit de geverifieerde uitgepakte payload.

## Runtime-refactorplan

1. Voeg database-registry-API's toe.
   - Los globale DB- en per-agent-DB-paden op.
   - Houd de niet-verzonden schema's op `user_version = 1`; voeg geen
     schemamigratierunnercode toe totdat een verzonden schema die nodig heeft.
   - Voeg close-/checkpoint-/integriteitshelpers toe die door tests, back-up en
     doctor worden gebruikt.

2. Vouw sidecar-SQLite-stores samen.
   - Verplaats plugin-statetabellen naar de globale database. Voltooid voor
     runtime-writes; de niet-verzonden legacy-sidecarimporter is verwijderd.
   - Verplaats taakregistrytabellen naar de globale database. Voltooid voor
     runtime-writes; de niet-verzonden legacy-sidecarimporter is verwijderd.
   - Verplaats Task Flow-tabellen naar de globale database. Voltooid voor
     runtime-writes; de niet-verzonden legacy-sidecarimporter is verwijderd.
   - Verplaats ingebouwde memory-search-tabellen naar elke agentdatabase.
     Voltooid; expliciete aangepaste `memorySearch.store.path` wordt nu
     verwijderd door doctor-configuratiemigratie. Volledige herindexering draait
     in place alleen tegen memorytabellen; het oude pad voor whole-file swap en
     de sidecar-indexswaphelper zijn verwijderd.
   - Verwijder dubbele database-openers, WAL-setup, permissionhelpers en
     close-paden uit die subsystemen.

3. Verplaats agent-owned tabellen naar per-agent-databases.
   - Maak agent-DB on demand aan via de globale databaseregistry. Voltooid.
   - Verplaats runtime-sessie-items, transcriptevents, VFS-rijen en
     toolartefacten naar agent-DB's. Voltooid.
   - Migreer geen branch-lokale shared-DB-sessie-items, transcriptevents,
     VFS-rijen of toolartefacten; die layout is nooit verzonden. Behoud alleen
     legacy import van bestand naar database in doctor.

4. Vervang session store-API's.
   - Verwijder `storePath` als runtime-identiteit. Voltooid voor runtime en
     bewaakt door `check:database-first-legacy-stores`: sessiemetadata,
     route-updates, commandopersistentie, CLI-sessieopschoning,
     Feishu-reasoningpreviews, transcript-statepersistentie, subagentdiepte,
     sessieoverrides voor authprofielen, parent-forklogica en QA-lab-inspectie
     lossen de database nu op vanuit canonieke agent-/sessiesleutels.
     Gateway-/TUI-/UI-/macOS-sessielijstresponses tonen nu `databasePath` in
     plaats van legacy `path`; macOS-debugoppervlakken tonen de per-agentdatabase
     als read-only state in plaats van `session.store`-configuratie te schrijven.
     `/status`, chatgestuurde trajectory-export en CLI-dependencyproxies geven
     legacy store-paden niet meer door; transcriptgebruiksfallback leest SQLite
     via agent-/sessie-identiteit. Runtime- en bridgetests tonen `storePath` niet
     meer; doctor-/migratie-inputs bezitten die legacy-veldnaam.
     Gateway combined-session loading heeft geen speciale runtimebranch meer
     voor niet-getemplatiseerde `session.store`-waarden; het aggregeert
     per-agent-SQLite-rijen. De legacy doctor-lane voor session locks en de
     bijbehorende `.jsonl.lock`-opschoonhelper zijn verwijderd; SQLite is nu de
     sessie-concurrencygrens. Hot runtime-call sites gebruiken rijgerichte
     helpernamen zoals `resolveSessionRowEntry`; de oude
     `resolveSessionStoreEntry`-compatibiliteitsalias is verwijderd uit runtime
     en Plugin SDK-exports.

- Gebruik `{ agentId, sessionKey }`-rijbewerkingen.
  Voltooid: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` en `listSessionEntries` zijn SQLite-first API's die geen
  session store-pad vereisen. Statussamenvatting, lokale agentstatus, health en
  de listingopdracht `openclaw sessions` lezen nu rechtstreeks per-agent-rijen
  en tonen per-agent-SQLite-databasepaden in plaats van `sessions.json`-paden.
- Vervang whole-store delete/insert door `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` en SQL-cleanupqueries.
  Voltooid voor runtime: hot paths gebruiken nu rij-API's en conflict-retried
  rijpatches; overgebleven whole-store-import-/replacehelpers zijn beperkt tot
  migratie-importcode en SQLite-backendtests.
  - Verwijder `store-writer.ts` en writer-queue-tests. Voltooid.
  - Verwijder runtime legacy-keyopschoning en alias-deleteparameters uit
    sessie-row-upserts/-patches. Voltooid.

5. Verwijder runtime-JSON-registrygedrag.
   - Maak sandboxregistry reads en writes alleen SQLite. Voltooid.
   - Importeer monolithische en sharded JSON alleen vanuit de migratiestap.
     Voltooid.
   - Verwijder sharded registry-locks en JSON-writes. Voltooid.

- Behoud één getypeerde registrytabel in plaats van registryrijen als generieke
  opaque JSON op te slaan als de vorm hot-path operationele state blijft.
  Voltooid.

6. Verwijder bestandslockvormige sessiemutatie.
   - Voltooid voor runtime-lockaanmaak en runtime-lock-API's.
   - De standalone legacy `.jsonl.lock`-doctoropschoonlane is verwijderd.
   - `session.writeLock` is door doctor gemigreerde legacyconfiguratie, geen
     getypeerde runtime-instelling.
   - State-integriteit heeft geen apart pad meer voor het opschonen van orphan
     transcriptbestanden; doctor-migratie importeert/verwijdert legacy
     JSONL-bronnen op één plek.
   - Gateway-singletoncoördinatie gebruikt getypeerde SQLite-`state_leases`-rijen
     onder `gateway_locks` en toont geen bestandslockdirectory-seam meer.
   - Generieke Plugin SDK-dedupepersistentie gebruikt geen bestandslocks of
     JSON-bestanden meer; het schrijft gedeelde SQLite-plugin-state-rijen.
     Voltooid.
   - QMD-embedcoördinatie gebruikt een SQLite-state lease in plaats van
     `qmd/embed.lock`. Voltooid.

7. Maak workers database-aware.
   - Workers openen hun eigen SQLite-verbindingen.
   - Parent bezit delivery, channel callbacks en configuratie.
   - Worker ontvangt agent-id, run-id, bestandssysteemmodus en
     DB-registry-identiteit, geen live handles.
   - `vfs-only` blijft experimenteel en gebruikt de agentdatabase als zijn
     storageroot.
   - Houd eerst één worker per actieve run. Pooling kan wachten totdat de
     levensduur van DB-verbindingen en annuleringsgedrag stabiel zijn.

8. Back-upintegratie.
   - Leer back-up globale en agentdatabases vast te leggen via SQLite-back-up of
     `VACUUM INTO`. Gedaan voor ontdekte `*.sqlite`-bestanden onder het state-asset.
   - Voeg back-upverificatie toe voor SQLite-integriteit en schemaversie. Gedaan voor
     integriteitscontroles bij back-upcreatie en standaard archiefverificatie.
   - Registreer metadata van back-upruns in SQLite. Gedaan via de gedeelde
     `backup_runs`-tabel met archiefpad, status en manifest-JSON.
   - Voeg herstel uit geverifieerde archiefmomentopnamen toe. Gedaan: `openclaw backup
restore` valideert vóór extractie, gebruikt het genormaliseerde
     manifest van de verifier, ondersteunt `--dry-run`, en vereist `--yes` voordat
     geregistreerde bronpaden worden vervangen.
   - Neem VFS-/werkruimte-export alleen op wanneer daarom wordt gevraagd; exporteer sessie-
     internals niet als JSON of JSONL.

9. Verwijder verouderde tests en code. Gedaan voor de bekende runtime-sessiesurfaces.

- Verwijder tests die runtime-creatie van `sessions.json` of transcript-
  JSONL-bestanden afdwingen. Gedaan voor core-sessieopslag, chat, Gateway-transcriptgebeurtenissen,
  preview, levenscyclus, commandosessie-entry-updates, auto-reply reset/trace, en
  memory-core dreaming-fixtures, approval-targetrouting, sessietranscript-
  reparatie, beveiligingsmachtigingsreparatie, trajectexport en sessie-export.
  Active-memory-transcripttests controleren nu SQLite-scopes en dat er geen tijdelijke of
  gepersisteerde JSONL-bestanden worden aangemaakt.
  De oude Heartbeat-regressie voor transcript-pruning is verwijderd omdat
  runtime JSONL-transcripten niet langer afkapt.
  Tests voor de agent session-list-tool modelleren legacy `sessions.json`-paden niet langer
  als de Gateway-responsvorm; app-/UI-/macOS-tests gebruiken `databasePath`.
  `/status`-tests voor transcriptgebruik seeden nu direct SQLite-transcriptrijen
  in plaats van JSONL-bestanden te schrijven.
  Gateway-tests voor sessielevenscyclus gebruiken nu direct SQLite-transcriptseedinghelpers;
  de oude single-line sessiebestand-fixturevorm is verdwenen uit reset-
  en delete-dekking.
  `sessions.delete` retourneert niet langer een bestandsperiodeveld `archived: []`; verwijdering
  rapporteert alleen het resultaat van de rijmutatie. De oude optie `deleteTranscript` is
  ook verdwenen: het verwijderen van een sessie verwijdert de canonieke `sessions`-root en laat
  SQLite sessie-eigen transcript-, snapshot- en trajectrijen cascaderen, zodat geen
  aanroeper transcriptwezen kan achterlaten of een cleanup-branch kan vergeten.
  Tests voor context-engine-trajectcapture lezen nu `trajectory_runtime_events`-
  rijen uit een geïsoleerde agentdatabase in plaats van
  `session.trajectory.jsonl` te lezen.
  Docker MCP-channel seed-scripts seeden nu direct SQLite-rijen. Directe
  `sessions.json`-writes zijn beperkt tot doctor-fixtures.
  Tool Search Gateway E2E leest tool-call-bewijs uit SQLite-transcriptrijen
  in plaats van `agents/<agentId>/sessions/*.jsonl`-bestanden te scannen.
  Memory-core host events en session-corpus scratch-rijen leven nu in gedeelde
  SQLite plugin-state; `events.jsonl` en `session-corpus/*.txt` zijn alleen legacy
  doctor-migratie-invoer. Actieve rijen gebruiken virtuele paden
  `memory/session-ingestion/`, niet `.dreams/session-corpus`. De oude memory-core dreaming-
  reparatiemodule en de CLI-/Gateway-tests ervan zijn verwijderd omdat runtime niet
  langer bestandarchiefreparatie voor die corpus bezit. Memory-core
  bridge-/public-artifact-tests tonen `.dreams/events.jsonl` niet langer; ze
  gebruiken de door SQLite ondersteunde virtuele JSON-artefactnaam.
  Public SDK-/Codex-testdocumentatie zegt nu SQLite-sessiestatus in plaats van sessie-
  bestanden, en het channel-turn-voorbeeld toont niet langer een `storePath`-argument.
  Matrix-syncstatus gebruikt nu direct de SQLite plugin-state store. Actieve
  client-/runtimecontracten geven een accountopslagroot door, geen `bot-storage.json`-
  pad, en doctor importeert legacy `bot-storage.json` in SQLite voordat de
  bron wordt verwijderd. QA Matrix restart/destructive-scenario's muteren nu direct de SQLite-sync-
  rij in plaats van neppe `bot-storage.json`-bestanden te maken of te verwijderen, en
  het E2EE-substraat geeft een sync-store-root door in plaats van een nep
  `sync-store.json`-pad.
  Matrix-selectie van storage-root scoort roots niet langer op legacy sync-/thread-JSON-
  bestanden; deze gebruikt duurzame rootmetadata plus echte cryptostatus.
  De runtime SQLite-sessiebackend-testsuite fabriceert niet langer een
  `sessions.json`; legacy bron-fixtures leven nu in de doctor-
  tests die ze importeren.
  Gateway-sessietests tonen niet langer een `createSessionStoreDir`-helper of
  ongebruikte temp session-store-padsetup; fixturemappen zijn expliciet, en directe
  rijsetup gebruikt SQLite session-row-naamgeving.
  Doctor-only JSON5 parserdekking voor session-store is verplaatst uit infratests naar
  doctor-migratietests, zodat runtime-testsuites niet langer legacy
  sessiebestandparsing bezitten.
  Microsoft Teams runtime SSO-/pending-upload-tests dragen niet langer JSON-sidecar-
  fixtures of parsers; legacy SSO-tokenparsing leeft alleen in de Plugin-
  migratiemodule. Telegram-tests seeden niet langer neppe `/tmp/*.json` store-
  paden; ze resetten direct de door SQLite ondersteunde berichtcache. De generieke
  OpenClaw test-state-helper exposeert niet langer een legacy `auth-profiles.json`-
  writer; doctor-authmigratietests bezitten die fixture lokaal.
  Runtime-tests voor TUI last-session-pointers, exec approvals, active-memory-
  toggles, Matrix-dedupe-/startupverificatie, Memory Wiki-bronsync,
  current-conversation-bindings, onboarding-auth en Hermes-secretimports
  produceren niet langer oude sidecar-bestanden of controleren dat oude bestandsnamen afwezig zijn. Ze
  bewijzen gedrag via SQLite-rijen en publieke store-API's; doctor-/migratie-
  tests zijn de enige plaats waar legacy bronbestandsnamen thuishoren.
  Runtime-tests voor device-/node-pairing, channel allowFrom, restart intents,
  restart handoff, sessie-delivery-queue-entries, config health, iMessage-
  caches, Cron-taken, PI-transcriptheaders, subagent-registries en beheerde
  afbeeldingsbijlagen maken ook niet langer gepensioneerde JSON-/JSONL-bestanden alleen om te bewijzen
  dat ze worden genegeerd of afwezig zijn.
  PI-overflowherstel heeft niet langer een SessionManager rewrite-/truncation-
  fallback: tool-result-truncation en context-engine transcript-rewrites muteren
  SQLite-transcriptrijen en verversen daarna actieve promptstatus vanuit de database.
  Gepersisteerde SessionManager-berichtappends delegeren naar de atomische SQLite
  transcript-appendhelper voor ouderselectie en idempotentie. Normale
  metadata-/custom-entry-appends selecteren ook de huidige ouder binnen SQLite, zodat
  verouderde managerinstances geen pre-SQLite parent-chain-races laten herleven.
  Synthetische PI-tail-cleanup voor mid-turn-prechecks en `sessions_yield` trimt nu
  direct SQLite-transcriptstatus; de oude SessionManager tail-removal-
  bridge en de tests ervan zijn verwijderd.
  Compaction-checkpointcapture maakt ook alleen snapshots vanuit SQLite; aanroepers geven niet
  langer een live SessionManager door als alternatieve transcriptbron.
- Behoud tests die legacy-bestanden seeden alleen voor migratie.
- JSON-bestandsbewijs is vervangen door SQL-rijbewijs voor actieve runtime-
  surfaces.

- Voeg statische verboden toe voor runtime-writes naar legacy sessie-/cache-JSON-paden.
  Gedaan voor de repo-guard.

10. Maak het migratierapport controleerbaar.
    - Registreer migratieruns in SQLite met start-/eindtijdstempels, bron-
      paden, bronhashes, aantallen, waarschuwingen en back-uppad.
      Gedaan: legacy-state-migratieuitvoeringen persisteren nu een `migration_runs`-
      rapport met bronpad-/tabelinventaris, SHA-256 van bronbestand, groottes,
      recordaantallen, waarschuwingen en back-uppad.
      Gedaan: legacy-state-migratieuitvoeringen persisteren ook `migration_sources`-
      rijen voor audit op bronniveau en toekomstige skip-/backfill-beslissingen.
    - Maak apply idempotent. Opnieuw uitvoeren na een gedeeltelijke import moet ofwel
      een al geïmporteerde bron overslaan of mergen op stabiele sleutel.
      Gedaan: sessie-indexen, transcripten, delivery queues, plugin-state, task-
      ledgers en agent-eigen globale SQLite-rijen importeren via stabiele sleutels of
      upsert-/replace-semantiek, zodat heruitvoeringen mergen zonder duurzame
      rijen te dupliceren.
    - Mislukte imports moeten het oorspronkelijke bronbestand laten staan.
      Gedaan: mislukte transcriptimports laten nu de oorspronkelijke JSONL-bron op
      het gedetecteerde pad staan, en `migration_sources` registreert de bron als
      `warning` met `removed_source=0` voor de volgende doctor-run.

## Prestatieregels

- Eén verbinding per thread/proces is prima; deel handles niet tussen
  workers.
- Gebruik WAL, `foreign_keys=ON`, een busy-timeout van 30 s en korte `BEGIN IMMEDIATE`-
  schrijfacties.
- Houd helpers voor schrijftransacties synchroon tenzij/totdat een async transaction-
  API expliciete mutex-/backpressure-semantiek toevoegt.
- Houd parent-delivery-writes klein en transactioneel.
- Vermijd herschrijven van de hele store; gebruik upsert/delete op rijniveau.
- Voeg indexen toe voor list-by-agent, list-by-session, updated-at, run-id en
  expiration-paden voordat hot code wordt verplaatst.
- Sla grote artefacten, media en vectoren op als BLOB's of gechunkte BLOB-rijen, niet
  als base64 of numeric-array JSON.
- Houd opaque plugin-state-entries klein en gescoped.
- Voeg SQL-cleanup toe voor TTL/expiration in plaats van filesystem-pruning.
  Gedaan voor database-eigen runtime-stores: media, plugin state, plugin blobs,
  persistent dedupe en agentcache verlopen allemaal via SQLite-rijen. Resterende
  filesystem-cleanup is beperkt tot tijdelijke materialisaties of expliciete
  verwijdercommando's.

## Statische verboden

Voeg een repocontrole toe die faalt op nieuwe runtime-writes naar legacy state-paden:

- `sessions.json`
- `*.trajectory.jsonl` behalve gematerialiseerde support-bundle-uitvoer
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` runtime-cachebestanden
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` en `recovery-key.json`
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
- JSON-bestanden voor sandbox-registershards
- JSON-bestanden voor native hook relay `/tmp`-bridge
- `plugin-state/state.sqlite`
- ad-hoc `openclaw-state.sqlite` runtime-sidecars
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
- Browserprofieldecoratie `.openclaw-profile-decorated`
- `SessionManager.open(...)` bestandsgebaseerde sessie-openers
- `SessionManager.listAll(...)` en `TranscriptSessionManager.listAll(...)`
  transcriptlijstfacades
- `SessionManager.forkFromSession(...)` en
  `TranscriptSessionManager.forkFromSession(...)` transcriptforkfacades
- `SessionManager.newSession(...)` en `TranscriptSessionManager.newSession(...)`
  facades voor vervanging van muteerbare sessies
- `SessionManager.createBranchedSession(...)` en
  `TranscriptSessionManager.createBranchedSession(...)` branchsessie-facades

Het verbod moet toestaan dat tests verouderde fixtures maken en dat migratiecode
verouderde bestandsbronnen leest/importeert/verwijdert. Niet-uitgebrachte SQLite-sidecars blijven verboden
en krijgen geen doctor-importtoestemmingen.

## Criteria voor voltooiing

- Runtimegegevens en cache-schrijfbewerkingen gaan naar de globale of agent-SQLite-database.
- Runtime schrijft niet langer sessie-indexen, transcript-JSONL, sandboxregister-
  JSON, taaksidecar-SQLite of plugin-state-sidecar-SQLite. De niet-uitgebrachte importers voor taak-
  en plugin-state-sidecar-SQLite worden verwijderd.
- Import van verouderde bestanden is alleen voor doctor.
- Back-up produceert één archief met compacte SQLite-snapshots en integriteitsbewijs.
- Agent-workers kunnen draaien met schijfopslag, VFS-scratch of experimentele
  opslag met alleen VFS.
- Configuratie en expliciete referentiebestanden blijven de enige verwachte persistente
  niet-database-controlebestanden.
- Repocontroles voorkomen dat verouderde runtime-bestandsopslag opnieuw wordt geïntroduceerd.
