---
read_when:
    - OpenClaw-runtimegegevens, cache, transcripts, taakstatus of scratchbestanden verplaatsen naar SQLite
    - OpenClaw-doctormigraties ontwerpen vanuit verouderde JSON- of JSONL-bestanden
    - Back-up-, herstel-, VFS- of workeropslaggedrag wijzigen
    - Sessie-locks, opschoning, inkorting of JSON-compatibiliteitspaden verwijderen
summary: Migratieplan om SQLite de primaire duurzame laag voor status en cache te maken, terwijl configuratie via bestanden ondersteund blijft
title: Databankgerichte herstructurering van statusbeheer
x-i18n:
    generated_at: "2026-06-27T18:16:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# Database-eerst-statusrefactor

## Besluit

Gebruik een SQLite-indeling met twee niveaus:

- Globale database: `~/.openclaw/state/openclaw.sqlite`
- Agentdatabase: één SQLite-database per agent voor agent-eigen werkruimte,
  transcript, VFS, artifact en grote runtime-status per agent
- Configuratie blijft bestandsgebaseerd: `openclaw.json` blijft buiten de
  database. Runtime-authenticatieprofielen verhuizen naar SQLite; externe
  provider- of CLI-referentiebestanden blijven door de eigenaar beheerd buiten
  de database van OpenClaw.

De globale database is de control-plane-database. Deze beheert agentdetectie,
gedeelde Gateway-status, koppeling, apparaat-/node-status, taak- en flowboeken,
pluginstatus, runtime-status van de scheduler, back-upmetadata en migratiestatus.

De agentdatabase is de data-plane-database. Deze beheert de sessiemetadata van
de agent, de transcript-eventstream, VFS-werkruimte of scratch-namespace,
tool-artifacts, run-artifacts en doorzoekbare/indexeerbare agentlokale cachedata.

Dit geeft één duurzame globale weergave zonder grote agentwerkruimten,
transcripten en binaire scratchdata in de gedeelde Gateway-schrijfbaan te
forceren.

## Hard contract

Deze migratie heeft één canonieke runtime-vorm:

- Sessierijen bewaren alleen sessiemetadata. Ze mogen geen
  `transcriptLocator`, transcriptbestandspaden, sibling-JSONL-paden, lockpaden,
  pruning-metadata of compatibiliteitspointers uit het bestandstijdperk bewaren.
- Transcriptidentiteit is altijd SQLite-identiteit: `{agentId, sessionId}` plus
  optionele topicmetadata waar het protocol die nodig heeft.
- `sqlite-transcript://...` is geen runtime- of protocolidentiteit. Nieuwe code
  mag geen transcriptlocators afleiden, bewaren, doorgeven, parsen of migreren.
  Runtime en tests horen helemaal geen pseudo-locators te bevatten; docs mogen
  de tekenreeks alleen noemen om deze te verbieden.
- Legacy `sessions.json`, transcript-JSONL, `.jsonl.lock`, pruning, truncation
  en oude sessiepadlogica horen alleen thuis in het doctor-migratie-/importpad.
- Legacy sessieconfiguratie-aliassen horen alleen thuis in doctor-migratie.
  Runtime interpreteert geen `session.idleMinutes`, `session.resetByType.dm` of
  cross-agent `agent:main:*` main-session-aliassen voor een andere
  geconfigureerde agent.
- Sessierouteringsidentiteit is getypeerde relationele status. Hot runtime- en
  UI-paden horen `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations` en
  `session_conversations` te lezen; ze mogen `session_key` niet parsen of
  `session_entries.entry_json` doorzoeken voor provideridentiteit, behalve als
  compatibiliteitsschaduw terwijl oude call-sites worden verwijderd.
- Direct-message-markeringen op kanaalniveau zoals `dm` tegenover `direct` zijn
  routeringsvocabulaire, geen transcriptlocators of compatibiliteitshandles voor
  bestandsopslag.
- Legacy hook-handlerconfiguratie hoort alleen thuis in doctor-waarschuwings-/
  migratieoppervlakken. Runtime mag `hooks.internal.handlers` niet laden; hooks
  draaien alleen via ontdekte hookmappen en `HOOK.md`-metadata.
- Runtime-startup, hot reply-paden, Compaction, reset, herstel, diagnostiek,
  TTS, memory hooks, subagents, routering van plugincommando's,
  protocolgrenzen en hooks moeten `{agentId, sessionId}` door de runtime
  doorgeven.
- Tests horen SQLite-transcriptrijen via `{agentId, sessionId}` te seeden en te
  controleren. Tests die alleen JSONL-padforwarding, behoud van door de caller
  aangeleverde locators of transcriptbestandcompatibiliteit bewijzen, moeten
  worden verwijderd tenzij ze doctor-import, niet-sessiegebonden
  support-/debugmaterialisatie of protocolvorm dekken.
- `runEmbeddedPiAgent(...)`, voorbereide workerruns en de inner embedded attempt
  mogen geen transcriptlocators accepteren. Ze openen de SQLite-transcriptmanager
  via `{agentId, sessionId}` en geven die manager door aan de geïnternaliseerde
  PI-compatibele agentsessie, zodat verouderde callers de runner geen
  JSON-/JSONL-transcripten kunnen laten schrijven.
- Runnerdiagnostiek moet runtime-/cache-/payloadtracerecords in SQLite opslaan.
  Runtimediagnostiek mag geen JSONL-bestandsoverrideknoppen of generieke
  transcript-JSONL-exporthelpers blootstellen; gebruikersgerichte exports kunnen
  expliciete artifacts uit databaserijen materialiseren zonder bestandsnamen
  terug de runtime in te voeren.
- Ruwe streamlogging gebruikt `OPENCLAW_RAW_STREAM=1` plus
  SQLite-diagnostiekrijen. Het oude pi-mono-contract voor `PI_RAW_STREAM`,
  `PI_RAW_STREAM_PATH` en de bestandslogger `raw-openai-completions.jsonl` maakt
  geen deel uit van OpenClaw-runtime of -tests.
- QMD-geheugenindexering mag SQLite-transcripten niet naar markdownbestanden
  exporteren. QMD indexeert alleen geconfigureerde geheugenbestanden;
  sessietranscriptzoekopdrachten blijven SQLite-backed.
- Het QMD SDK-subpad is voor nieuwe code alleen QMD. Indexeringshelpers voor
  SQLite-sessietranscripten leven op
  `memory-core-host-engine-session-transcripts`; elke QMD-re-export is alleen
  compatibiliteit en mag niet door runtimecode worden gebruikt.
- Ingebouwde geheugenindexen leven in de database van de beherende agent.
  Runtimeconfiguratie en opgeloste runtimecontracten mogen
  `memorySearch.store.path` niet blootstellen; doctor verwijdert die legacy
  configuratiesleutel en huidige code geeft de agent-`databasePath` intern door.

Implementatiewerk moet code blijven verwijderen totdat deze uitspraken waar zijn
zonder uitzonderingen buiten doctor-/import-/export-/debuggrenzen.

## Doelstatus en voortgang

### Hard doel

- Eén globale SQLite-database beheert control-plane-status:
  `state/openclaw.sqlite`.
- Eén SQLite-database per agent beheert data-plane-status:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Config blijft bestandsgebaseerd. `openclaw.json` maakt geen deel uit van deze
  databaserefactor.
- Legacy bestanden zijn alleen invoer voor doctor-migratie.
- Runtime schrijft of leest nooit sessie- of transcript-JSONL als actieve
  status.

### Doelstatussen

- `not-started`: runtimecode uit het bestandstijdperk schrijft nog actieve
  status.
- `migrating`: doctor-/importcode kan bestandsdata naar SQLite verplaatsen.
- `dual-read`: tijdelijke brug leest zowel SQLite als legacy bestanden. Deze
  status is verboden voor deze refactor tenzij deze expliciet als doctor-only is
  gedocumenteerd.
- `sqlite-runtime`: runtime leest en schrijft alleen SQLite.
- `clean`: legacy runtime-API's en tests zijn verwijderd, en de guard voorkomt
  regressies.
- `done`: docs, tests, back-up, doctor-migratie en changed checks bewijzen de
  schone status.

### Huidige status

- Sessies: `clean` voor runtime. Sessierijen leven in de database per agent,
  runtime-API's gebruiken `{agentId, sessionId}` of `{agentId, sessionKey}`, en
  `sessions.json` is doctor-only legacy invoer.
- Transcripten: `clean` voor runtime. Transcript-events, identiteiten,
  snapshots en trajectory-runtime-events leven in de database per agent. Runtime
  accepteert geen transcriptlocators of JSONL-transcriptpaden meer.
- PI embedded runner: `clean`. Embedded PI-runs, voorbereide workers,
  Compaction en retry-loops gebruiken SQLite-sessiescope en weigeren verouderde
  transcripthandles.
- Cron: `clean` voor runtime. Runtime gebruikt `cron_jobs` en `cron_run_logs`;
  runtimetests gebruiken SQLite-`storeKey`-naamgeving, en cronpaden uit het
  bestandstijdperk blijven alleen in doctor-legacy-migratietests.
- Taakregister: `clean`. Runtime-rijen voor Task en Task Flow leven in
  `state/openclaw.sqlite`; niet-uitgebrachte sidecar-SQLite-importers zijn
  verwijderd.
- Pluginstatus: `clean`. Pluginstatus-/blobrijen leven in de gedeelde globale
  database; oude sidecar-SQLite-helpers voor pluginstatus worden tegengehouden.
- Geheugen: `sqlite-runtime` voor ingebouwd geheugen en
  sessietranscriptindexering. Geheugenindextabellen leven in de database per
  agent, plugingeheugenstatus gebruikt gedeelde pluginstatusrijen, en legacy
  geheugenbestanden zijn doctor-migratie-invoer of inhoud van de
  gebruikerswerkruimte.
- Back-up: `sqlite-runtime`. Back-upstappen comprimeren SQLite-snapshots, laten
  live WAL-/SHM-sidecars weg, verifiëren SQLite-integriteit en registreren
  back-upruns in de globale database.
- Doctor-migratie: `migrating`, bewust. Doctor importeert legacy JSON, JSONL en
  gepensioneerde sidecar-stores naar SQLite, registreert migratieruns/-bronnen
  en verwijdert succesvolle bronnen.
- E2E-scripts: `clean` voor runtimedekking. Docker MCP-seeding schrijft
  SQLite-rijen. Het Docker-script voor runtime-context maakt legacy JSONL alleen
  binnen de doctor-migratieseed aan en benoemt het legacy sessie-indexpad
  expliciet.

### Resterend werk

- [x] Hernoem cron-runtime-teststorevariabelen weg van `storePath`, tenzij het
      doctor-legacy-invoer is.
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
- [x] Houd door Kysely gegenereerde typen gelijkgetrokken na elke schemawijziging.
      Bestanden: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Bewijs: geen schemawijziging in deze pass; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Voer gerichte tests opnieuw uit voor aangeraakte stores, commando's en
      scripts.
      Bewijs: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] Voer vóór het verklaren van `done` de changed gate of extern breed bewijs
      uit.
      Bewijs: `pnpm check:changed --timed -- <changed extension paths>` geslaagd op
      Hetzner Crabbox-run `run_3f1cabf6b25c` na tijdelijke Node 24-/pnpm-setup en
      expliciete padroutering voor de gesynchroniseerde werkruimte zonder `.git`.

### Niet laten terugvallen

- Geen transcriptlocators.
- Geen actieve sessiebestanden.
- Geen nep-JSONL-testfixtures behalve doctor-legacy-migratietests.
- Geen ruwe SQLite-toegang waar Kysely wordt verwacht.
- Geen nieuwe legacy DB-migraties. Deze indeling is niet uitgebracht; houd
  schemaversie op `1`, tenzij er een sterke reden is.

## Aannames uit codelezing

Geen vervolgbeslissingen over het product blokkeren dit plan. De implementatie
moet doorgaan met deze aannames:

- Gebruik `node:sqlite` direct en vereis de Node 22+-runtime voor dit opslagpad.
- Houd precies één normaal configuratiebestand aan. Verplaats config, Plugin-manifesten of Git-workspaces niet naar SQLite in deze refactor.
- Runtime-compatibiliteitsbestanden zijn niet vereist. Legacy JSON- en JSONL-bestanden zijn alleen migratie-invoer. De branch-lokale SQLite-sidecars zijn nooit uitgebracht en worden verwijderd in plaats van geïmporteerd.
- `openclaw doctor --fix` is eigenaar van de legacy migratiestap van bestand naar database. Runtime-opstart en `openclaw migrate` mogen geen legacy OpenClaw-database-upgradepaden bevatten.
- Credential-compatibiliteit volgt dezelfde regel: runtime-credentials staan in SQLite. Oude `auth-profiles.json`-, per-agent `auth.json`- en gedeelde `credentials/oauth.json`-bestanden zijn doctor-migratie-invoer en worden na import verwijderd.
- Gegenereerde modelcatalogusstatus wordt door de database ondersteund. Runtime-code mag geen `agents/<agentId>/agent/models.json` schrijven; bestaande `models.json`-bestanden zijn legacy doctor-invoer en worden na import in `agent_model_catalogs` verwijderd.
- Runtime mag transcriptlocators niet migreren, normaliseren of overbruggen. Actieve transcriptidentiteit is `{agentId, sessionId}` in SQLite. Bestandspaden zijn alleen legacy doctor-invoer, en `sqlite-transcript://...` moet verdwijnen uit runtime-, protocol-, hook- en Plugin-oppervlakken in plaats van te worden behandeld als een grens-handle.
- Runtime SQLite-transcriptlezingen voeren geen oude JSONL-migraties van entry-vormen uit en herschrijven geen volledige transcripts voor compatibiliteit. Legacy entry-normalisatie blijft in expliciete doctor-/importhulpprogramma's. Doctor normaliseert legacy JSONL-transcriptbestanden voordat SQLite-rijen worden ingevoegd; huidige runtime-rijen zijn al geschreven in het huidige transcriptschema. Trajectory-/sessie-export leest die rijen zoals ze zijn en mag geen legacy migraties tijdens export uitvoeren.
- Legacy JSONL-parse-/migratiehulpen voor transcripts zijn alleen voor doctor. Runtime-transcriptformaatcode bouwt alleen huidige SQLite-transcriptcontext; doctor is eigenaar van oude JSONL-entry-upgrades voordat rijen worden ingevoegd.
- De oude door runtime beheerde JSONL-streaminghulp voor transcripts is verwijderd. Doctor-importcode is eigenaar van expliciete legacy bestandslezingen; runtime-sessiegeschiedenis leest SQLite-rijen.
- Codex app-server-bindings gebruiken de OpenClaw `sessionId` als de canonieke sleutel in de Codex plugin-state-namespace. `sessionKey` is metadata voor routering/weergave en mag de duurzame sessie-id niet vervangen of transcript-bestandsidentiteit doen herleven.
- Contextengines ontvangen het huidige runtimecontract direct. Het register mag engines niet omhullen met retry-shims die `sessionKey`, `transcriptScope` of `prompt` verwijderen; engines die de huidige database-first params niet kunnen accepteren, moeten luid falen in plaats van te worden overbrugd.
- Back-upuitvoer moet één archiefbestand blijven. Database-inhoud moet dat archief binnenkomen als compacte SQLite-snapshots, niet als ruwe live WAL-sidecars.
- Transcript zoeken is nuttig, maar niet vereist voor de eerste database-first versie. Ontwerp het schema zodat FTS later kan worden toegevoegd.
- Worker-uitvoering moet experimenteel blijven achter instellingen terwijl de databasegrens stabiliseert.

## Bevindingen Uit Codelezing

De huidige branch is de proof-of-conceptfase al voorbij. De gedeelde database bestaat, Node `node:sqlite` is aangesloten via een kleine runtimehulp, en voormalige stores schrijven nu naar `state/openclaw.sqlite` of de eigenaar zijnde `openclaw-agent.sqlite`-database.

Het resterende werk is niet kiezen voor SQLite; het is de nieuwe grens schoon houden en alle compatibiliteitsvormige interfaces verwijderen die nog op de oude bestandswereld lijken:

- Sessie-`storePath` is niet langer een runtime-identiteit, testfixturevorm of veld in een statuspayload. Runtime- en bridgetests bevatten de contractnaam `storePath` niet meer; doctor-/migratiecode is eigenaar van die legacy woordenschat.
- Sessieschrijfacties lopen niet langer via de oude in-process `store-writer.ts`-queue. SQLite-patchschrijfacties gebruiken in plaats daarvan conflictdetectie en begrensde retry.
- Legacy paddetectie heeft nog geldige migratietoepassingen, maar runtime-code moet stoppen met `sessions.json` en transcript-JSONL-bestanden behandelen als mogelijke schrijfdoelen.
- Agent-eigen tabellen staan in per-agent SQLite-databases. De globale DB bewaart register-/control-plane-rijen; transcriptidentiteit is `{agentId, sessionId}` in de per-agent transcript-rijen. Runtime-code mag geen transcriptbestandspaden persistent opslaan of transcriptlocators migreren.
- Doctor importeert al meerdere legacy bestanden. De opschoning is om daarvan één expliciete migratie-implementatie te maken die doctor aanroept, met een duurzaam migratierapport.

Er blokkeren geen aanvullende productvragen de implementatie.

## Huidige Codevorm

De branch heeft al een echte gedeelde SQLite-basis:

- De runtimebasis is nu Node 22+: `package.json`, de CLI-runtimeguard,
  installerstandaarden, macOS-runtimezoeker, CI en openbare installatiedocumentatie
  zijn allemaal op elkaar afgestemd. De oude Node 22-compatibiliteitslane is verwijderd.
- `src/state/openclaw-state-db.ts` opent `openclaw.sqlite`, stelt WAL,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON` in en past
  de gegenereerde schemamodule toe die is afgeleid van
  `src/state/openclaw-state-schema.sql`.
- Kysely-tabeltypen en runtimeschemamodules worden gegenereerd uit wegwerpbare
  SQLite-databases die zijn gemaakt op basis van de vastgelegde `.sql`-bestanden; runtimecode
  bewaart niet langer gekopieerde schemateksten voor globale, per-agent- of proxy-
  capturedatabases.
- Runtimestores leiden geselecteerde en ingevoegde rijtypen af van die gegenereerde
  Kysely-`DB`-interfaces in plaats van SQLite-rijvormen handmatig te spiegelen. Ruwe SQL
  blijft beperkt tot schematoepassing, pragmas en alleen-migratie-DDL.
- De SQLite-schema's zijn teruggebracht tot `user_version = 1`, omdat deze database-
  indeling nog niet is uitgebracht. Runtime-openers maken alleen het huidige schema aan;
  import van bestand naar database blijft in doctor-code, en branch-lokale
  database-upgradehelpers zijn verwijderd.
- Relationeel eigenaarschap wordt afgedwongen waar de eigendomsgrens canoniek is:
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
- Willekeurige Plugin-eigen status krijgt geen host-eigen getypeerde tabellen. Geïnstalleerde
  plugins gebruiken `plugin_state_entries` voor geversioneerde JSON-payloads en
  `plugin_blob_entries` voor bytes, met namespace-/sleuteleigenaarschap, TTL-opschoning,
  back-up en Plugin-migratierecords. Host-eigen Plugin-orkestratiestatus kan
  nog steeds getypeerde tabellen hebben wanneer de host eigenaar is van het querycontract, zoals
  `plugin_binding_approvals`.
- Plugin-migraties zijn datamigraties over Plugin-eigen namespaces, geen host-
  schemamigraties. Een Plugin kan zijn eigen geversioneerde status-/blobentries
  migreren via een migratieprovider, en de host registreert bron-/runstatus in het
  normale migratielogboek. Nieuwe Plugin-installaties vereisen geen wijziging van
  `openclaw-state-schema.sql`, tenzij de host zelf eigenaarschap neemt over een
  nieuw cross-Plugin-contract.
- `src/state/openclaw-agent-db.ts` opent
  `agents/<agentId>/agent/openclaw-agent.sqlite`, registreert de database in de
  globale DB en beheert agent-lokale sessie-, transcript-, VFS-, artifact-, cache-
  en memory-index-tabellen. Gedeelde runtimediscovery leest nu het gegenereerd getypeerde
  `agent_databases`-register in plaats van die query op elke callsite opnieuw te implementeren.
- Globale en per-agent-databases registreren een `schema_meta`-rij met databaserol,
  schemaversie, tijdstempels en agent-id voor agentdatabases. De indeling blijft nog steeds
  op `user_version = 1`, omdat dit SQLite-schema nog niet is uitgebracht.
- Per-agent-sessie-identiteit heeft nu een canonieke `sessions`-roottabel met sleutel
  `session_id`, met `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, tijdstempels, weergavevelden, modelmetadata,
  harness-id en parent-/spawn-koppeling als querybare kolommen. `session_routes`
  is de unieke actieve route-index van `session_key` naar de huidige
  `session_id`, zodat een routesleutel naar een nieuwe duurzame sessie kan verhuizen zonder
  dat hot reads moeten kiezen tussen dubbele `sessions.session_key`-rijen. De oude
  compatibiliteitsvormige payload `session_entries.entry_json` hangt via foreign key aan de
  duurzame `session_id`-root; dit is niet langer de enige
  representatie van een sessie op schemaniveau.
- Per-agent externe gespreksidentiteit is ook relationeel:
  `conversations` bewaart genormaliseerde provider-/account-/gespreksidentiteit, en
  `session_conversations` koppelt één OpenClaw-sessie aan één of meer externe
  gesprekken. Dit dekt gedeelde-main-DM-sessies waarbij meerdere peers opzettelijk
  aan één sessie kunnen worden gekoppeld zonder te liegen in `session_key`. SQLite dwingt ook
  uniciteit af voor de natuurlijke provideridentiteit, zodat dezelfde
  channel/account/kind/peer/thread-tuple niet over gespreks-id's kan vertakken.
  Gedeelde-main directe peers worden gekoppeld met een `participant`-rol, zodat één
  OpenClaw-sessie meerdere externe DM-peers kan vertegenwoordigen zonder oudere peers
  te degraderen tot vage gerelateerde rijen. `sessions.primary_conversation_id` wijst nog steeds
  naar het huidige getypeerde afleverdoel. Gesloten routerings-/statuskolommen
  worden afgedwongen met SQLite-`CHECK`-constraints in plaats van alleen te vertrouwen op
  TypeScript-unions.
  Runtimesessieprojectie wist compatibiliteitsrouting-schaduwen uit
  `session_entries.entry_json` voordat getypeerde sessie-/gesprekskolommen worden toegepast,
  zodat verouderde JSON-payloads geen afleverdoelen kunnen laten herleven.
  Subagent-aankondigingsrouting vereist eveneens de getypeerde SQLite-aflevercontext;
  deze valt niet langer terug op compatibiliteitsvelden van `SessionEntry`-routes.
  Gateway `chat.send` expliciete afleveringsovererving leest de getypeerde SQLite-
  aflevercontext in plaats van compatibiliteitsvelden `origin`/`last*`.
  `tools.effective` leidt eveneens provider-/account-/threadcontext af van getypeerde
  SQLite-afleverings-/routeringsrijen, niet van verouderde `last*` session-entry-schaduwen.
  Promptcontext voor systeemgebeurtenissen bouwt channel-/to-/account-/threadvelden opnieuw op uit
  getypeerde aflevervelden in plaats van `origin`-schaduwen.
  De gedeelde helper `deliveryContextFromSession` en de sessie-naar-gesprek-
  mapper negeren nu `SessionEntry.origin` volledig; alleen getypeerde aflevervelden
  en relationele gespreksrijen kunnen hot route-identiteit maken.
  Normalisatie van runtimesessieentries verwijdert `origin` voordat `entry_json` wordt opgeslagen of
  geprojecteerd, en inkomende metadata schrijft getypeerde channel-/chatvelden plus
  relationele gespreksrijen in plaats van nieuwe origin-schaduwen te maken.
- Transcriptgebeurtenissen, transcriptsnapshots en trajectory-runtimegebeurtenissen verwijzen nu
  naar de canonieke per-agent `sessions`-root en cascaderen bij sessieverwijdering.
  Transcriptidentiteits-/idempotentierijen blijven cascaderen vanuit de exacte
  transcriptgebeurtenisrij.
- Memory-core-indexen gebruiken nu expliciete agentdatabasetabellen
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks` en
  `memory_embedding_cache`, waarbij `memory_index_state` revisiewijzigingen bijhoudt.
  Optionele FTS-/vector-zij-indexen heten `memory_index_chunks_fts` en
  `memory_index_chunks_vec` in plaats van generieke tabellen `meta`, `files`, `chunks`,
  `chunks_fts` of `chunks_vec`. De canonieke namen behouden de huidige
  path/source-rijvorm en compatibiliteit met geserialiseerde embeddings. Deze tabellen
  zijn afgeleide/zoekcache, geen canonieke transcriptopslag; ze kunnen worden
  verwijderd en opnieuw opgebouwd uit memory-workspacebestanden en geconfigureerde bronnen.
  Het openen van een uitgebrachte memory-index met generieke naam migreert de metadata, bronnen,
  chunks en embeddingcache naar de canonieke tabellen; afgeleide FTS-/vectortabellen
  worden opnieuw opgebouwd onder hun canonieke namen.
- Herstelstatus van subagent-runs leeft nu in getypeerde gedeelde `subagent_runs`-rijen
  met geïndexeerde child-, requester- en controller-sessiesleutels. Het oude
  bestand `subagents/runs.json` is alleen doctor-migratie-invoer.
- Huidige gespreksbindingen leven nu in getypeerde gedeelde
  `current_conversation_bindings`-rijen met sleutel op genormaliseerde gespreks-id, met
  doelagent-/sessiekolommen, gesprekssoort, status, vervaldatum en metadata
  opgeslagen als relationele kolommen in plaats van een gedupliceerd ondoorzichtig bindingsrecord.
  De duurzame bindingssleutel bevat de genormaliseerde gesprekssoort, zodat
  direct/group/channel-referenties niet kunnen botsen, en SQLite wijst ongeldige waarden voor
  bindingssoort/status af. Het oude
  bestand `bindings/current-conversations.json` is alleen doctor-migratie-invoer.
- Herstel van de afleverwachtrij legt nu getypeerde wachtrijkolommen voor channel, target,
  account, sessie, retry, fout, platform-send en herstelstatus over de
  replay-JSON heen. `entry_json` behoudt de replay-payloads, hooks en formatteringspayload,
  maar getypeerde kolommen zijn gezaghebbend voor hot wachtrijroutering/-status.
- TUI last-session-herstelwijzers leven nu in getypeerde gedeelde
  `tui_last_sessions`-rijen met sleutel op de gehashte TUI-connection-/sessionscope.
  Het oude TUI-JSON-bestand is alleen doctor-migratie-invoer.
- Standaard TTS-voorkeuren leven nu in gedeelde SQLite-rijen voor Plugin-status met sleutel onder de
  `speech-core`-Plugin. Het oude bestand `settings/tts.json` is alleen doctor-migratie-
  invoer; runtime leest of schrijft geen TTS-voorkeuren-JSON-bestanden meer, en de
  legacy-padresolver leeft in de doctor-migratiemodule.
- Secret-targetmetadata spreekt nu over stores in plaats van te doen alsof elk
  credential-target een configbestand is. `openclaw.json` blijft de configstore;
  auth-profile-targets gebruiken getypeerde SQLite-`auth_profile_stores`-rijen met
  provider-vormige credentials bewaard als JSON-payloads.
- Secretaudit scant niet langer gepensioneerde per-agent `auth.json`-bestanden. Doctor beheert
  het waarschuwen over, importeren van en verwijderen van dat legacybestand.
- Legacy auth-profile-padhelpers leven nu in doctor-legacycode. Core auth-
  profile-padhelpers geven SQLite-auth-store-identiteit en weergavelocaties vrij,
  niet runtimepaden `auth-profiles.json` of `auth-state.json`.
- Runtime-modules voor subagent-runherstel en OpenRouter-modelcapabilitycache
  houden SQLite-snapshotreaders/-writers nu gescheiden van alleen-doctor legacy-JSON-
  importhelpers. OpenRouter-capabilities gebruiken de getypeerde generieke
  `model_capability_cache`-rijen onder `provider_id = "openrouter"` in plaats van
  één ondoorzichtige cacheblob of een providerspecifieke hosttabel. Subagent-run
  `taskName` wordt opgeslagen in de getypeerde kolom `subagent_runs.task_name`; de
  kopie `payload_json` is replay-/debugdata, niet de bron voor hot display- of
  opzoekvelden.
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` implementeert een SQLite-VFS
  bovenop de agentdatabase-`vfs_entries`-tabel. Directoryreads, recursieve
  exports, deletes en renames gebruiken geïndexeerde prefixbereiken `(namespace, path)`
  in plaats van een hele namespace te scannen of te vertrouwen op `LIKE`-padmatching.
- `src/agents/runtime-worker.entry.ts` maakt per-run SQLite-VFS-, tool-artifact-,
  run-artifact- en scoped-cachestores voor workers.
- Voltooiingsmarkeringen voor workspace-bootstrap leven nu in getypeerde gedeelde
  `workspace_setup_state`-rijen met sleutel op opgelost workspacepad in plaats van
  `.openclaw/workspace-state.json`; runtime leest of herschrijft de legacy workspace-
  markering niet langer, en helper-API's geven niet langer een nep
  `.openclaw/setup-state`-pad door alleen om opslagidentiteit af te leiden.
- Exec-goedkeuringen leven nu in de getypeerde gedeelde SQLite-singletonrij
  `exec_approvals_config`. Doctor importeert legacy `~/.openclaw/exec-approvals.json`;
  runtimeschrijfacties maken, herschrijven of rapporteren dat bestand niet langer als actieve
  storelocatie. De macOS-companion leest en schrijft dezelfde
  `state/openclaw.sqlite`-tabelrij; deze houdt alleen de Unix-promptsocket op schijf
  omdat dat IPC is, geen duurzame runtimestatus.
- Device-identiteit, device-auth en bootstrap-runtimemodules houden hun
  SQLite-snapshotreaders/-writers nu gescheiden van alleen-doctor legacy-JSON-
  importhelpers. Device-identiteit gebruikt getypeerde `device_identities`-rijen en device-
  auth-tokens gebruiken getypeerde `device_auth_tokens`-rijen. Device-auth-schrijfacties
  verzoenen rijen per device/role in plaats van de tokentabel af te kappen, en runtime routeert
  single-token-updates niet langer via de oude whole-store-adapter. De legacy
  versie-1 JSON-payloads bestaan alleen als doctor-import-/exportvormen.
- De GitHub Copilot-cache voor tokenuitwisseling gebruikt de gedeelde SQLite-pluginstatustabel
  onder `github-copilot/token-cache/default`. Dit is cachestatus die eigendom is van de provider,
  dus voegt deze bewust geen host-schematabel toe.
- GitHub Copilot-compaction schrijft geen `openclaw-compaction-*.json`
  workspace-sidecars meer. De harness roept de SDK RPC voor geschiedeniscompaction aan voor de
  gevolgde SDK-sessie, en OpenClaw bewaart duurzame sessie-/transcriptstatus in
  SQLite in plaats van compatibiliteitsmarkeringsbestanden.
- De gedeelde Swift-runtime (`OpenClawKit`) gebruikt dezelfde
  `state/openclaw.sqlite`-rijen voor apparaatidentiteit en apparaatauthenticatie. macOS-apphelpers
  importeren de gedeelde SQLite-helpers in plaats van een tweede JSON- of
  SQLite-pad te bezitten. Een achtergebleven legacy `identity/device.json` blokkeert het aanmaken van identiteit
  totdat doctor het in SQLite importeert, in lijn met de TypeScript- en Android-
  opstartpoort.
- Android-apparaatidentiteit gebruikt hetzelfde TypeScript-compatibele sleutelmateriaal
  dat is opgeslagen in getypeerde `state/openclaw.sqlite#table/device_identities`-rijen. Het leest of
  schrijft nooit `openclaw/identity/device.json`; een achtergebleven legacybestand blokkeert
  het opstarten totdat doctor het in SQLite importeert.
- Android-gecachete apparaatauthenticatietokens gebruiken ook getypeerde
  `state/openclaw.sqlite#table/device_auth_tokens`-rijen en delen dezelfde
  versie-1 tokensemantiek als TypeScript en Swift. Runtime leest niet langer `SecurePrefs`
  `gateway.deviceToken*`-compatibiliteitssleutels; die horen alleen thuis in migratie-/doctor-
  logica.
- Android-meldingengeschiedenis voor recente pakketten gebruikt getypeerde
  `android_notification_recent_packages`-rijen. Runtime migreert of leest de oude SharedPreferences CSV-sleutels
  niet langer.
- Het aanmaken van apparaatidentiteit faalt gesloten wanneer legacy `identity/device.json`
  bestaat, wanneer de SQLite-identiteitsrij ongeldig is, of wanneer de SQLite-identiteitsopslag
  niet kan worden geopend. Doctor importeert en verwijdert dat bestand eerst, zodat runtime-
  opstart de koppelingsidentiteit niet stilzwijgend kan roteren vóór migratie.
- Selectie van apparaatidentiteit is een SQLite-rijsleutel, geen JSON-bestandslocator. Tests
  en Gateway-helpers geven expliciete identiteitssleutels door; alleen doctor-migratie en de
  fail-closed opstartpoort kennen de uitgefaseerde bestandsnaam `identity/device.json`.
- Compatibiliteit voor sessiereset leeft nu in doctor-configuratiemigratie:
  `session.idleMinutes` wordt verplaatst naar `session.reset.idleMinutes`,
  `session.resetByType.dm` wordt verplaatst naar `session.resetByType.direct`, en het
  runtime-resetbeleid leest alleen canonieke resetsleutels.
- Legacy configuratiecompatibiliteit leeft nu onder `src/commands/doctor/`. Normale
  `readConfigFileSnapshot()`-validatie importeert geen doctor legacy-detectors
  en annoteert geen legacyproblemen; `runDoctorConfigPreflight()` voegt die problemen toe voor
  doctor-reparatie/-rapportage. De doctor-configuratiestroom importeert
  `src/commands/doctor/legacy-config.ts`, en oude OAuth profiel-id-reparatie leeft
  onder
  `src/commands/doctor/legacy/oauth-profile-ids.ts`.
- Niet-doctor-commando's voeren legacy configuratiereparatie niet automatisch uit. Bijvoorbeeld:
  `openclaw update --channel` faalt nu op ongeldige legacy configuratie en vraagt de
  gebruiker om doctor uit te voeren, in plaats van stilzwijgend doctor-migratiecode te importeren.
- Webpush, APNs, Voice Wake, updatecontroles en configuratiegezondheid gebruiken nu getypeerde gedeelde SQLite-
  tabellen voor abonnementen, VAPID-sleutels, Node-registraties, trigger-rijen,
  routeringsrijen, update-meldingsstatus en configuratiegezondheidsvermeldingen in plaats van
  volledig ondoorzichtige JSON-blobs. Webpush- en APNs-snapshotwrites stemmen nu
  abonnementen/registraties af op primaire sleutel in plaats van hun tabellen te wissen;
  configuratiegezondheid doet hetzelfde op configuratiepad.
  Hun runtimemodules houden SQLite-snapshotreaders/-writers gescheiden van
  doctor-only legacy JSON-importhelpers.
- Node-hostconfiguratie gebruikt nu een getypeerde singletonrij in de gedeelde SQLite-database;
  doctor importeert het oude `node.json`-bestand vóór normaal runtimegebruik.
- Apparaat-/Node-koppeling, kanaalkoppeling, kanaal-allowlists en bootstrapstatus
  gebruiken nu getypeerde SQLite-rijen in plaats van volledig ondoorzichtige JSON-blobs. Plugin-bindings-
  goedkeuringen en cron-taakstatus volgen dezelfde splitsing: runtimemodules stellen
  SQLite-ondersteunde bewerkingen en neutrale snapshothelpers beschikbaar, en pairing/bootstrap
  plus snapshotwrites voor Plugin-bindingsgoedkeuring stemmen rijen af op primaire sleutel
  in plaats van tabellen af te kappen, terwijl doctor de oude JSON-bestanden importeert/verwijdert via
  `src/commands/doctor/legacy/*`-modules.
- Geïnstalleerde Plugin-records leven nu in de SQLite-index voor geïnstalleerde Plugins.
  Runtime configuratie lezen/schrijven migreert of behoudt niet langer oude
  `plugins.installs` authored-config-gegevens; doctor importeert die legacy configuratievorm
  in SQLite vóór normaal runtimegebruik.
- QQBot-snapshots voor herstel van referenties leven nu in SQLite-pluginstatus onder
  `qqbot/credential-backups`. Runtime schrijft niet langer
  `qqbot/data/credential-backup*.json`; doctor importeert en verwijdert die
  legacy back-upbestanden samen met de andere QQBot-statusinputs.
- Gateway-herlaadplanning vergelijkt snapshots van de SQLite-index voor geïnstalleerde Plugins onder
  een interne `installedPluginIndex.installRecords.*` diff-namespace. Runtime-
  herlaadbeslissingen wikkelen die rijen niet langer in neppe `plugins.installs` configuratie-
  objecten.
- Matrix-upgrade van referenties voor benoemde accounts gebeurt niet langer tijdens runtime-
  reads. Doctor bezit de hernoeming van de oude top-level `credentials/matrix/credentials.json`
  wanneer een enkel/default Matrix-account kan worden herleid.
- Core pairing- en cron-runtimemodules exporteren niet langer legacy JSON-pad-
  builders. Doctor-owned legacy modules construeren `pending.json`, `paired.json`,
  `bootstrap.json` en `cron/jobs.json`-bronpaden alleen voor importtests en
  migratie. Legacy cron-taakvormnormalisatie en cron run-log-import
  leven onder `src/commands/doctor/legacy/cron*.ts`.
- `src/commands/doctor/legacy/runtime-state.ts` importeert legacy JSON-status-
  bestanden, inclusief Node-hostconfiguratie, vanuit doctor in SQLite. Nieuwe legacy bestands-
  importers blijven onder `src/commands/doctor/legacy/`.
- `src/commands/doctor/state-migrations.ts` importeert legacy `sessions.json` en
  `*.jsonl`-transcripten rechtstreeks in SQLite en verwijdert succesvolle bronnen. Het
  stage't root legacy transcripten niet langer via
  `agents/<agentId>/sessions/*.jsonl` en maakt geen canoniek JSONL-doel meer aan vóór
  import.
- Doctor-controles voor statusintegriteit scannen geen legacy sessiemappen meer en
  bieden geen verwijdering van verweesde JSONL aan. Legacy transcriptbestanden zijn alleen
  migratie-inputs, en de migratiestap bezit import plus bronverwijdering.
- Legacy sandboxregisterimport leeft onder
  `src/commands/doctor/legacy/sandbox-registry.ts`; actieve sandboxregister-
  reads en -writes blijven alleen SQLite.
- De legacy reparatie voor gezondheid/import van sessietranscripten leeft onder
  `src/commands/doctor/legacy/session-transcript-health.ts`; runtimecommando-
  modules dragen geen JSONL-transcriptparsing of active-branch-reparatiecode meer.

Voltooide hoogtepunten van consolidatie/verwijdering:

- Plugin-status gebruikt nu de gedeelde database `state/openclaw.sqlite`. De oude
  branch-lokale sidecar-importer `plugin-state/state.sqlite` is verwijderd omdat
  die SQLite-indeling nooit is uitgebracht. Probe-/testhelpers rapporteren het gedeelde
  `databasePath` in plaats van een plugin-state-specifiek SQLite-pad bloot te leggen.
- Runtime-tabellen voor taken en Task Flow staan nu in de gedeelde database
  `state/openclaw.sqlite` in plaats van `tasks/runs.sqlite` en
  `tasks/flows/registry.sqlite`; de oude sidecar-importers zijn om dezelfde reden van
  niet-uitgebrachte indeling verwijderd.
- `src/config/sessions/store.ts` heeft `storePath` niet meer nodig voor inkomende
  metadata, route-updates of updated-at-reads. Persistentie van opdrachten, opschoning
  van CLI-sessies, subagent-diepte, auth-overschrijvingen en transcript-sessie-identiteit
  gebruiken agent-/sessierij-API's. Schrijfbewerkingen worden toegepast als SQLite-rijpatches
  met optimistische conflictherhaling.
- Oplossing van sessiedoelen geeft nu per-agent databasedoelen bloot, geen verouderde
  `sessions.json`-paden. Gedeelde Gateway, ACP-metadata, doctor-routeherstel en
  `openclaw sessions` inventariseren `agent_databases` plus geconfigureerde agents.
- Gateway-sessieroutering gebruikt nu `resolveGatewaySessionDatabaseTarget`; het
  geretourneerde doel bevat `databasePath` en kandidaat-SQLite-rijsleutels in plaats
  van een verouderd bestandspad voor de sessiestore.
- Runtime-typen voor kanaalsessies geven nu `{agentId, sessionKey}` bloot voor
  updated-at-reads, inkomende metadata en last-route-updates. Het oude compatibiliteitstype
  `saveSessionStore(storePath, store)` is verdwenen.
- Plugin-runtime, extension-API en barrel-oppervlakken van `config/sessions` sturen
  plugincode nu naar SQLite-ondersteunde helpers voor sessierijen. Compatibiliteitsexports
  van de rootbibliotheek (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`)
  blijven bestaan als verouderde shims voor bestaande consumenten. De oude helper
  `resolveLegacySessionStorePath` is verdwenen; constructie van verouderde
  `sessions.json`-paden is nu lokaal voor migratie- en testfixtures.
- `src/config/sessions/session-entries.sqlite.ts` slaat canonieke sessie-items nu op
  in de per-agent database en heeft ondersteuning voor read/upsert/delete-patches op
  rijniveau. Runtime-upsert/patch/delete scant niet meer op hoofdlettervarianten en
  snoeit geen verouderde alias-sleutels meer; doctor is eigenaar van canonicalisatie. De
  zelfstandige JSON-importhelper is verdwenen, en migratie-merges upserten nieuwere rijen
  in plaats van de hele sessietabel te vervangen. Publieke read/list/load-helpers
  projecteren hot sessiemetadata uit getypeerde `sessions`- en `conversations`-rijen;
  `entry_json` is een compatibiliteits-/debugschaduw en mag verouderd of ongeldig zijn
  zonder verlies van getypeerde sessie-identiteit of aflevercontext.
- `src/config/sessions/delivery-info.ts` lost aflevercontext nu op uit de getypeerde
  per-agent rijen `sessions` + `conversations` + `session_conversations`. Het reconstrueert
  runtime-afleveridentiteit niet meer uit `session_entries.entry_json`; een ontbrekende
  getypeerde gespreksrij is een doctor-migratie-/herstelprobleem, geen runtime-fallback.
- Beslissingen voor reset van opgeslagen sessies geven nu de voorkeur aan getypeerde
  metadata `sessions.session_scope`, `sessions.chat_type` en `sessions.channel`.
  `sessionKey`-parsing blijft alleen voor expliciete thread-/topic-achtervoegsels op
  opdrachtdoelen; classificatie als groep versus direct komt niet meer uit de sleutelvorm.
- Classificatie voor sessielijst-/statusweergave gebruikt nu getypeerde chatmetadata en
  Gateway-sessiesoort. Substrings `:group:` of `:channel:` binnen `session_key` worden niet
  meer behandeld als duurzame waarheid voor groep/direct.
- Selectie van stil-antwoordbeleid gebruikt nu alleen expliciet gesprekstype of
  oppervlaktemetadata. Direct-/groepsbeleid wordt niet meer geraden uit substrings in
  `session_key`.
- Resolutie van het sessieweergavemodel ontvangt nu de agent-id uit het SQLite
  sessiedatabasedoel in plaats van die uit `session_key` te splitsen.
- Hydratatie van agent-naar-agent-aankondigingsdoelen gebruikt nu alleen getypeerde
  `deliveryContext` van `sessions.list`. Routering voor kanaal/account/thread wordt niet
  meer hersteld uit verouderde `origin`, gespiegelde `last*`-velden of de vorm van
  `session_key`.
- Thread-doelweigering van `sessions_send` leest nu getypeerde SQLite-routeringsmetadata.
  Doelen worden niet meer geweigerd of geaccepteerd door thread-achtervoegsels uit de
  doelsleutel te parsen.
- Validatie van toolbeleid met groepsscope leest nu getypeerde SQLite-gespreksroutering
  voor de huidige of gespawnde sessie. Groeps-/kanaalidentiteit wordt niet meer vertrouwd
  door `sessionKey` te decoderen; door de caller aangeleverde groeps-id's worden verwijderd
  wanneer geen getypeerde sessierij daarvoor instaat.
- Matching van kanaalmodel-overschrijvingen gebruikt nu expliciete groeps- en
  bovenliggende gespreksmetadata. Bovenliggende gespreks-id's worden niet meer gedecodeerd
  uit `parentSessionKey`.
- Overerving van opgeslagen modeloverschrijvingen vereist nu een expliciete bovenliggende
  sessiesleutel uit getypeerde sessiecontext. Bovenliggende overschrijvingen worden niet
  meer afgeleid uit achtervoegsels `:thread:` of `:topic:` in `sessionKey`.
- De oude wrapper voor sessie-threadinfo en de threadparser voor geladen plugins zijn
  verdwenen; geen runtimecode importeert nog `config/sessions/thread-info`.
- De helper voor kanaalgesprekken geeft geen parsing-bridges voor volledige sessiesleutels
  meer bloot. Core normaliseert provider-eigen ruwe gespreks-id's nog steeds via
  `resolveSessionConversation(...)`, maar reconstrueert geen routefeiten uit `sessionKey`.
- Aflevering van completion, verzendbeleid en taakonderhoud leiden chat-type niet meer af
  uit de vorm van `session_key`. De oude sleutelparser voor chat-type is verwijderd; deze
  paden vereisen getypeerde sessiemetadata, getypeerde aflevercontext of expliciete
  woordenschat voor afleverdoelen.
- Sessielijst/status, diagnostiek, binding van goedkeuringsaccounts, TUI Heartbeat-filtering
  en gebruikssamenvattingen mijnen `SessionEntry.origin` niet meer voor
  provider-/account-/thread-/weergaveroutering. De enige overgebleven runtime-reads van
  `origin` zijn niet-sessieconcepten of afleverobjecten van de huidige beurt.
- Native gesprekslookup voor goedkeuringsverzoeken leest nu getypeerde per-agent
  sessierouteringsrijen. Kanaal-/groeps-/thread-gespreksidentiteit wordt niet meer uit
  `sessionKey` geparset; ontbrekende getypeerde metadata is een migratie-/herstelprobleem.
- Payloads van gewijzigde Gateway-sessie-, chat- en sessie-events echoën
  `SessionEntry.origin` of `last*`-routeschaduwen niet meer; clients ontvangen getypeerde
  `channel`, `chatType` en `deliveryContext`.
- Oplossing van Heartbeat-aflevering kan nu de getypeerde SQLite `deliveryContext` direct
  ontvangen, en de heartbeat-runtime geeft de per-agent sessie-afleverrij door in plaats
  van te vertrouwen op compatibiliteitschaduwen in `session_entries` voor huidige routering.
- Doelresolutie voor Cron-aflevering van geïsoleerde agents hydrateert de huidige route ook
  uit de getypeerde per-agent sessie-afleverrij voordat wordt teruggevallen op de
  compatibiliteits-entrypayload.
- Origin-resolutie van subagent-aankondigingen rijgt nu de getypeerde aflevercontext van
  de requester-sessie door `loadRequesterSessionEntry` en geeft de voorkeur aan die rij
  boven compatibiliteitsschaduwen `last*`/`deliveryContext`.
- Updates van inkomende sessiemetadata mergen nu eerst tegen de getypeerde per-agent
  afleverrij; oude aflevervelden van `SessionEntry` zijn alleen de fallback wanneer geen
  getypeerde gespreksrij bestaat.
- Extractie van restart/update-aflevering laat nu de getypeerde SQLite-aflevering
  `threadId` winnen van topic-/thread-fragmenten die uit `sessionKey` zijn geparset;
  parsing is alleen een fallback voor verouderde thread-vormige sleutels.
- Kanaal-id's voor hook-agentcontext geven nu de voorkeur aan getypeerde
  SQLite-gespreksidentiteit, daarna expliciete berichtmetadata. Provider-/groeps-/kanaalfragmenten
  worden niet meer uit `sessionKey` geparset.
- Externe-route-overerving van Gateway `chat.send` leest nu getypeerde
  SQLite-sessierouteringsmetadata in plaats van kanaal-/direct-/groepsscope af te leiden
  uit stukken van `sessionKey`. Kanaalgescopete sessies erven alleen wanneer het getypeerde
  sessiekanaal en chat-type overeenkomen met de opgeslagen aflevercontext; gedeelde
  hoofdsessies behouden hun strengere CLI-/geen-clientmetadata-regel.
- Wake- en voortzettingsroutering van de restart-sentinel leest nu getypeerde
  SQLite-aflever-/routeringsrijen voordat Heartbeat-wakes of gerouteerde
  agent-turn-voortzettingen in de wachtrij worden gezet. Aflevercontext wordt niet meer
  gereconstrueerd uit de JSON-schaduw van de sessie-entry.
- Contextresolutie van Gateway `tools.effective` leest nu getypeerde
  SQLite-aflever-/routeringsrijen voor provider-, account-, doel-, thread- en
  reply-mode-invoer. Die hot-routeringsvelden worden niet meer hersteld uit verouderde
  `session_entries.entry_json`-originschaduwen.
- Routering voor realtime-spraakconsults lost nu bovenliggende/call-aflevering op uit
  getypeerde per-agent SQLite-sessierijen. Er wordt niet meer teruggevallen op
  compatibiliteitsschaduwen `SessionEntry.deliveryContext` bij het kiezen van de
  ingebedde agentberichtroute.
- ACP-spawn Heartbeat-relay en parent-stream-routering lezen bovenliggende aflevercontext
  nu uit getypeerde SQLite-sessierijen. Ze reconstrueren bovenliggende aflevercontext niet
  meer uit compatibiliteitsschaduwen van sessie-entries.
- Behoud van sessie-afleverroutes volgt nu getypeerde chatmetadata en gepersisteerde
  afleverkolommen. Kanaalhints, direct/main-markeringen of thread-vorm worden niet meer
  uit `sessionKey` gehaald; interne webchat-routes erven alleen een extern doel wanneer
  SQLite al getypeerde/gepersisteerde afleveridentiteit voor de sessie heeft.
- Generieke extractie van sessie-aflevering leest alleen nog de exact getypeerde
  SQLite-sessie-afleverrij. Er worden geen thread-/topic-achtervoegsels meer geparset en
  er wordt niet meer teruggevallen van een thread-vormige sleutel naar een basissessiesleutel.
- Reply-dispatch, herstel van restart-sentinel en routering voor realtime-spraakconsults
  gebruiken nu exacte getypeerde SQLite-sessie-/gespreksrijen voor thread-routering. Ze
  herstellen thread-id's of aflevercontext van basissessies niet meer door thread-vormige
  sessiesleutels te parsen.
- Inperking van ingebedde PI-geschiedenis gebruikt nu de getypeerde
  SQLite-sessierouteringsprojectie (`sessions` + primaire `conversations`) voor provider,
  chat-type en peer-identiteit. Provider-, DM-, groeps- of thread-vorm wordt niet meer uit
  `sessionKey` geparset.
- Cron-toolafleveringsinferentie gebruikt nu alleen expliciete aflevering of de huidige
  getypeerde aflevercontext. Kanaal-, peer-, account- of threaddoelen worden niet meer
  gedecodeerd uit `agentSessionKey`.
- Runtime-sessierijen bevatten de oude route-alias `lastProvider` niet meer. Helpers en
  tests gebruiken getypeerde velden `lastChannel` en `deliveryContext`; doctor-migratie is
  de enige plek die oudere route-aliassen of gepersisteerde `origin`-schaduwen zou moeten
  vertalen.
- Transcript-events, VFS-rijen en tool-artefactrijen schrijven nu naar de per-agent
  database. De niet-uitgebrachte globale transcript-file-mappingtabel is verdwenen; doctor
  registreert verouderde bronpaden in duurzame migratierijen in plaats daarvan.
- Runtime-transcriptlookup scant geen JSONL-byte-offsets meer en probeit geen verouderde
  transcriptbestanden. Gateway-chat-/media-/geschiedenispaden lezen transcriptrijen uit
  SQLite; sessie-JSONL is nu alleen een verouderde doctor-input, geen runtime-status of
  exportformaat.
- Bovenliggende en branch-relaties van transcripts gebruiken gestructureerde metadata
  `parentTranscriptScope: {agentId, sessionId}` in SQLite-transcriptheaders, geen padachtige
  locatorstrings `agent-db:...transcript_events...`.
- Het transcriptmanager-contract geeft geen impliciet gepersisteerde constructors
  `create(cwd)` of `continueRecent(cwd)` meer bloot. Gepersisteerde transcriptmanagers
  worden geopend met een expliciete scope `{agentId, sessionId}`; alleen in-memory managers
  blijven scopevrij voor tests en pure transcripttransformaties.
- Runtime-API's voor transcriptstores lossen SQLite-scope op, geen bestandssysteempaden.
  De oude helper `resolve...ForPath` en ongebruikte schrijfopties `transcriptPath` zijn
  verdwenen uit runtime-callers.
- Runtime-sessieresolutie gebruikt nu `{agentId, sessionId}` en mag geen
  `sqlite-transcript://<agent>/<session>`-strings afleiden voor externe grenzen.
  Verouderde absolute JSONL-paden zijn alleen doctor-migratie-inputs.
- Direct-bridge-records voor native hook relay staan nu in getypeerde gedeelde
  `native_hook_relay_bridges`-rijen met relay-id als sleutel. Runtime schrijft geen
  `/tmp` JSON-register of ondoorzichtige generieke records meer voor die kortlevende
  bridge-records.
- `runEmbeddedPiAgent(...)` heeft geen transcript-locatorparameter meer.
  Voorbereide worker-descriptors laten ook transcriptlocators weg. Runtime-sessie-
  status en in wachtrij geplaatste vervolgruns dragen `{agentId, sessionId}` in plaats van
  afgeleide transcripthandles.
- Ingebedde Compaction haalt de SQLite-scope nu uit `agentId` en `sessionId`.
  Compaction-hooks, context-engine-aanroepen, CLI-delegatie en protocolantwoorden
  mogen geen afgeleide `sqlite-transcript://...`-handles ontvangen. Export-/debugcode
  kan expliciete gebruikersartefacten uit rijen materialiseren, maar biedt geen
  generiek JSONL-exportpad voor sessies en voert bestandsnamen niet terug in runtime-
  identiteit.
- `/export-session` leest transcriptrijen uit SQLite en schrijft alleen de gevraagde
  zelfstandige HTML-weergave. De ingebedde viewer reconstrueert of downloadt geen
  sessie-JSONL meer uit die rijen.
- Context-engine-delegatie parseert geen transcriptlocator meer om agentidentiteit
  terug te halen. De voorbereide runtime-context draagt de opgeloste `agentId`
  naar de ingebouwde Compaction-adapter.
- Transcript-herschrijving en live inkorting van toolresultaten lezen en bewaren
  transcriptstatus nu op basis van `{agentId, sessionId}` en leiden geen tijdelijke
  locators af voor payloads van transcript-update-events.
- Het helperoppervlak voor transcriptstatus heeft geen locator-gebaseerde
  varianten van `readTranscriptState`, `replaceTranscriptStateEvents` of
  `persistTranscriptStateMutation` meer. Runtime-callers moeten de
  `{agentId, sessionId}`-API's gebruiken. Doctor-import leest oude bestanden via een expliciet bestandspad en schrijft SQLite-rijen; het migreert geen locator-strings.
- Het contract van de runtime-sessiemanager stelt `open(locator)`,
  `forkFrom(locator)` of `setTranscriptLocator(...)` niet meer bloot.
  Gepersisteerde sessiemanagers openen alleen op basis van `{agentId, sessionId}`;
  lijst-/forkhelpers leven op rijgerichte sessie- en checkpoint-API's in plaats
  van op de transcriptmanager-facade.
- Gateway-transcriptreader-API's gebruiken eerst de scope. Ze nemen
  `{agentId, sessionId}` en accepteren geen positionele transcriptlocator die
  per ongeluk runtime-identiteit zou kunnen worden. Parsing van actieve
  transcriptlocators is verdwenen; oude bronpaden worden alleen gelezen door
  doctor-importcode.
- Transcript-update-events gebruiken ook eerst de scope. `emitSessionTranscriptUpdate`
  accepteert geen losse locator-string meer, en listeners routeren op
  `{agentId, sessionId}` zonder een handle te parsen.
- Gateway-broadcasts van sessieberichten lossen sessiesleutels op vanuit agent-/sessiescope,
  niet vanuit een transcriptlocator. De oude resolver/cache van transcriptlocator naar sessiesleutel is verdwenen.
- Gateway session-history SSE filtert live updates op agent-/sessiescope. Het
  canonicaliseert geen kandidaten voor transcriptlocators, realpaths of bestandsvormige
  transcriptidentiteiten meer om te bepalen of een stream een update moet ontvangen.
- Hooks voor sessielevenscyclus leiden geen transcriptlocators meer af of stellen
  die bloot bij `session_end`. Hook-consumenten krijgen `sessionId`, `sessionKey`,
  ids van volgende sessies en agentcontext; transcriptbestanden maken geen deel uit
  van het levenscycluscontract.
- Resethooks leiden of tonen ook geen transcriptlocators meer. De
  `before_reset`-payload draagt herstelde SQLite-berichten plus de resetreden,
  terwijl sessie-identiteit in hookcontext blijft.
- Agent-harnasreset accepteert geen transcriptlocator meer. Resetdispatch is
  gescoped door `sessionId`/`sessionKey` plus reden.
- Sessie-typen van agentextensies stellen `transcriptLocator` niet meer bloot;
  extensies moeten sessiecontext en runtime-API's gebruiken in plaats van naar een
  bestandsvormige transcriptidentiteit te grijpen.
- Plugin-Compaction-hooks stellen geen transcriptlocators meer bloot. Hookcontext
  draagt sessie-identiteit al, en transcriptlezingen moeten via SQLite-API's gaan
  die scopebewust zijn in plaats van via bestandsvormige handles.
- `before_agent_finalize`-hooks stellen `transcriptPath` niet meer bloot, ook niet
  in payloads voor native hookrelay. Finalisatiehooks gebruiken alleen sessiecontext.
- Gateway-resetantwoorden synthetiseren geen transcriptlocator meer op de
  geretourneerde entry. De reset maakt SQLite-transcriptrijen, retourneert de schone
  sessie-entry en laat transcripttoegang over aan scopebewuste readers.
- Ingebedde run- en Compaction-resultaten tonen geen transcriptlocators meer voor
  sessieboekhouding. Automatische Compaction werkt alleen de actieve `sessionId`,
  Compaction-tellers en tokenmetadata bij.
- Ingebedde pogingresultaten retourneren geen `transcriptLocatorUsed` meer, en
  context-engine-`compact()`-resultaten retourneren geen transcriptlocators meer.
  Runtime-retrylussen accepteren alleen een opvolgende `sessionId`.
- Resultaten van delivery-mirror-transcripttoevoegingen retourneren geen
  transcriptlocators meer. Callers krijgen de toegevoegde `messageId`;
  transcript-updatesignalen gebruiken SQLite-scope.
- Forkhelpers voor oudersessies retourneren alleen de geforkte `sessionId`.
  Subagentvoorbereiding geeft de child-agent-/sessiescope door aan engines.
- CLI-runnerparameters en opnieuw zaaien van geschiedenis accepteren geen
  transcriptlocators meer. CLI-geschiedenislezingen lossen de SQLite-transcriptscope
  op vanuit `{agentId,
sessionId}` en sessiesleutelcontext.
- CLI- en embedded-runner-testfixtures zaaien en lezen SQLite-transcriptrijen nu
  op sessie-id in plaats van te doen alsof actieve sessies `*.jsonl`-bestanden zijn
  of een `sqlite-transcript://...`-string door runtimeparameters te geven.
- Guard-events voor sessietoolresultaten zenden vanuit bekende sessiescope, ook
  wanneer een in-memory manager geen afgeleide locator heeft. De tests faken geen
  actieve `/tmp/*.jsonl`-transcriptbestanden meer.
- BTW- en Compaction-checkpointhelpers lezen en forken transcriptrijen nu op
  SQLite-scope. Checkpointmetadata slaat nu alleen sessie-ids en leaf-/entry-ids
  op; afgeleide locators worden niet meer naar checkpointpayloads geschreven.
- Gateway-transcriptkey-lookup gebruikt SQLite-transcriptscope op protocolgrenzen
  en voert geen realpath of stat meer uit op transcriptbestandsnamen.
- Automatische Compaction-transcriptrotatie schrijft opvolgende transcriptrijen
  direct via de SQLite-transcriptstore. Sessierijen bewaren alleen de identiteit
  van de opvolgende sessie, geen duurzaam JSONL-pad of gepersisteerde locator.
- Ingebedde context-engine-Compaction gebruikt SQLite-genaamde transcriptrotatiehelpers.
  De rotatietests construeren geen JSONL-opvolgerpaden meer en modelleren actieve
  sessies niet meer als bestanden.
- Beheerde retentie van uitgaande afbeeldingen sleutel haar transcriptberichtcache
  op basis van SQLite-transcriptstatistieken in plaats van filesystem-stat-aanroepen.
- Runtime-sessielocks en de zelfstandige oude `.jsonl.lock`-doctorbaan
  zijn verwijderd.
- De Microsoft Teams-runtimebarrel en publieke Plugin-SDK re-exporteren de oude
  bestandslockhelper niet meer; duurzame Plugin-statuspaden worden door SQLite ondersteund.
- Snoeien op sessieleeftijd/-aantal en expliciete sessieopruiming zijn verwijderd.
  Doctor is eigenaar van oude import; verouderde sessies worden expliciet gereset
  of verwijderd.
- Doctor-integriteitscontroles tellen een oud JSONL-bestand niet meer als een
  geldig actief transcript voor een SQLite-sessierij. Actieve transcriptgezondheid
  is alleen SQLite; oude JSONL-bestanden worden gerapporteerd als invoer voor
  migratie-/weesopruiming.
- Doctor behandelt `agents/<agent>/sessions/` niet meer als vereiste runtime-
  status. Het scant die directory alleen wanneer die al bestaat, als invoer voor
  oude import of weesopruiming.
- Gateway `sessions.resolve`, paden voor sessiepatch/reset/compact, subagent
  spawning, snelle abort, ACP-metadata, heartbeat-geisoleerde sessies en TUI-
  patching migreren of snoeien geen oude sessiesleutels meer als neveneffect van
  normaal runtimewerk.
- CLI-opdrachtsessieresolutie retourneert nu de eigenaar-`agentId` in plaats van
  een `storePath`, en kopieert geen oude hoofd-sessierijen meer tijdens normale
  `--to`- of `--session-id`-resolutie. Canonicalisatie van oude hoofdrijen hoort
  alleen bij doctor.
- Runtime-resolutie van subagentdiepte leest geen `sessions.json` of JSON5-
  sessiestores meer. Het leest SQLite `session_entries` op agent-id, en oude
  diepte-/sessiemetadata kan alleen binnenkomen via het doctor-importpad.
- Sessieverschrijvingen voor auth-profielen worden gepersisteerd via directe
  rij-upserts op `{agentId, sessionKey}` in plaats van door lazy-loading van een
  bestandsvormige sessiestore-runtime.
- Verbose gating voor automatisch antwoorden en sessie-updatehelpers lezen/upserten
  nu SQLite-sessierijen op basis van sessie-identiteit en vereisen geen oud storepad
  meer voordat gepersisteerde rijstatus wordt aangeraakt.
- Metadatahelpers voor command-runsessies gebruiken nu entrygerichte namen en
  modulepaden; het oude `session-store`-opdrachtshelperoppervlak is verwijderd.
- Bootstrap-headerzaaien en hardening van handmatige Compaction-grenzen muteren
  SQLite-transcriptrijen direct. Runtime-callers geven sessie-identiteit door,
  geen schrijfbare `.jsonl`-paden.
- Stille replay van sessierotatie kopieert recente user-/assistant-beurten op
  basis van `{agentId, sessionId}` uit SQLite-transcriptrijen. Het accepteert geen
  bron- of doeltranscriptlocators meer.
- Verse runtime-sessierijen slaan geen transcriptlocators meer op. Callers gebruiken
  `{agentId, sessionId}` direct; export-/debugopdrachten kunnen uitvoerbestandsnamen
  kiezen wanneer ze rijen materialiseren.
- Een nieuwe gepersisteerde transcriptsessie starten opent nu altijd SQLite-rijen
  op scope. De sessiemanager hergebruikt geen eerder transcriptpad of locator uit
  het bestandstijdperk meer als identiteit voor de nieuwe sessie.
- Gepersisteerde transcriptsessies gebruiken de expliciete
  `openTranscriptSessionManagerForSession({agentId, sessionId})`-API. De oude
  statische facades `SessionManager.create/openForSession/list/forkFromSession`
  zijn verdwenen zodat tests en runtimecode niet per ongeluk sessiediscovery uit
  het bestandstijdperk opnieuw kunnen maken.
- Plugin-runtime stelt `api.runtime.agent.session.resolveTranscriptLocatorPath`
  niet meer bloot; Plugincode gebruikt SQLite-rijhelpers en scopewaarden.
- Het publieke `session-store-runtime`-SDK-oppervlak exporteert nu alleen helpers
  voor sessierijen en transcriptrijen. Gerichte SQLite-schema-/pad-/transactiehelpers
  leven in `sqlite-runtime`; ruwe open-/close-/resethelpers blijven alleen lokaal
  voor eigen tests.
- Oude `.jsonl`-classifiers voor traject-/checkpointbestandsnamen leven nu in de
  doctor-module voor oude sessiebestanden. Core-sessievalidering importeert geen
  bestandsartefacthelpers meer om normale SQLite-sessie-ids te bepalen.
- Active Memory-blokkerende subagent-runs gebruiken SQLite-transcriptrijen in
  plaats van tijdelijke of gepersisteerde `session.jsonl`-bestanden onder
  Plugin-status te maken. De oude `transcriptDir`-optie is verwijderd.
- Eenmalige sluggeneratie en Crestodian-plannerruns gebruiken SQLite-transcriptrijen
  in plaats van tijdelijke `session.jsonl`-bestanden te maken.
- `llm-task`-helperruns en verborgen commitmentextractie gebruiken ook SQLite-
  transcriptrijen, zodat deze model-only helpersessies geen tijdelijke JSON-/JSONL-
  transcriptbestanden meer maken.
- `TranscriptSessionManager` is nu alleen een geopende SQLite-transcriptscope.
  Runtimecode opent die met `openTranscriptSessionManagerForSession({agentId,
sessionId})`; flows voor maken, branchen, voortzetten, lijsten en forken leven in hun
  eigen SQLite-rijhelpers in plaats van in statische managerfacades.
  Doctor-/import-/debugcode verwerkt expliciete oude bronbestanden buiten de
  runtime-sessiemanager.
- De verouderde facademethoden `SessionManager.newSession()` en
  `SessionManager.createBranchedSession()` zijn verwijderd. Nieuwe sessies en
  transcriptafstammelingen worden gemaakt door hun eigen SQLite-workflow in plaats
  van een al geopende manager naar een andere gepersisteerde sessie te muteren.
- Forkbeslissingen en forkcreatie voor bovenliggende transcripten accepteren geen
  `storePath` of `sessionsDir` meer; ze gebruiken `{agentId, sessionId}` SQLite-
  transcriptscope in plaats van bewaarde filesystem-padmetadata.
- Memory-host exporteert geen no-op classificatiehelpers voor sessiedirectory-
  transcripten meer; transcriptfiltering wordt nu afgeleid uit SQLite-rijmetadata
  tijdens entryconstructie.
- Memory-host- en QMD-sessie-exporttests gebruiken SQLite-transcriptscopes. Oude
  `agents/<agentId>/sessions/*.jsonl`-paden blijven alleen gedekt waar een test
  bewust doctor-/import-/exportcompatibiliteit bewijst.
- QA-lab ruwe sessie-inspectie gebruikt nu `sessions.list` via de Gateway
  in plaats van `agents/qa/sessions/sessions.json` te lezen; MSteams-feedback
  voegt direct toe aan SQLite-transcripten zonder een JSONL-pad te fabriceren.
- Gedeelde inkomende kanaalbeurten bevatten nu `{agentId, sessionKey}` in plaats van een
  verouderd `storePath`. LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch en QQBot-opnamepaden lezen nu updated-at-metadata en registreren
  inkomende sessierijen via SQLite-identiteit.
- Persistentie van transcriptlocators is verwijderd uit actieve sessierijen.
  `resolveSessionTranscriptTarget` retourneert `agentId`, `sessionId` en optionele
  topicmetadata; doctor is de enige code die verouderde transcriptbestandsnamen
  importeert.
- Runtime-transcriptheaders beginnen bij SQLite-versie `1`. Oude JSONL V1/V2/V3
  vormupgrades bestaan alleen in doctor-import en normaliseren geïmporteerde headers naar
  de huidige SQLite-transcriptversie voordat rijen worden opgeslagen.
- De database-first guard verbiedt nu `SessionManager.listAll` en
  `SessionManager.forkFromSession`; workflows voor sessielijsten en fork/restore
  moeten op rij-/scoped SQLite-API's blijven.
- De guard verbiedt ook verouderde transcript-JSONL-parse-/active-branch-reparatiehelpernamen
  buiten doctor-/importcode, zodat runtime geen tweede verouderd
  transcriptmigratiepad kan krijgen.
- Ingesloten PI-runs weigeren inkomende transcripthandles. Ze gebruiken de SQLite
  `{agentId, sessionId}`-identiteit vóór de worker-start en opnieuw voordat de
  poging transcriptstatus aanraakt. Een verouderde `/tmp/*.jsonl`-invoer kan geen
  runtime-schrijfdoel selecteren.
- Cache-trace-, Anthropic-payload-, raw-stream- en diagnostics-timeline-records
  schrijven nu naar getypeerde SQLite-`diagnostic_events`-rijen. Gateway-stabilitybundels
  schrijven nu naar getypeerde SQLite-`diagnostic_stability_bundles`-rijen. De oude
  JSONL-overridepaden `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE` en
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` zijn verwijderd, en normale stability-capture
  schrijft geen `logs/stability/*.json`-bestanden meer.
- Cron-persistentie verzoent nu SQLite-`cron_jobs`-rijen in plaats van
  de volledige jobtabel bij elke opslag te verwijderen en opnieuw in te voegen. Plugin-doel
  writebacks werken overeenkomende cronrijen direct bij en houden runtime-cronstatus in
  dezelfde state-database-transactie.
- Cron-runtimecallers gebruiken nu een stabiele SQLite-cronstorekey. Verouderde
  `cron.store`-paden zijn alleen doctor-importinvoer; productie-Gateway-, taakonderhoud-,
  status-, run-log- en Telegram-doelwritebackpaden gebruiken
  `resolveCronStoreKey` en normaliseren de key niet langer als pad. Cron-status
  rapporteert nu `storeKey` in plaats van het oude bestandsvormige `storePath`-veld.
- Cron-runtimeloading en planning normaliseren niet langer verouderde gepersisteerde jobvormen
  zoals `jobId`, `schedule.cron`, numerieke `atMs`, string-booleans of
  ontbrekende `sessionTarget`. Doctor legacy import bezit die reparaties voordat rijen
  in SQLite worden ingevoegd.
- ACP-spawn resolveert of persisteert geen transcript-JSONL-bestandspaden meer. Spawn-
  en thread-bind-setup persisteren de SQLite-sessierij direct en houden de
  sessie-id als de behouden transcriptidentiteit.
- ACP-sessiemetadata-API's lezen/listen/upserten nu SQLite-rijen op `agentId` en
  stellen `storePath` niet langer bloot als onderdeel van het ACP-sessie-entrycontract.
- Sessiegebruikregistratie en Gateway-gebruiksaggregatie resolveeren transcripten
  nu alleen op `{agentId, sessionId}`. De kosten-/gebruikscache en ontdekte-sessiesamenvattingen
  synthetiseren of retourneren geen transcriptlocatorstrings meer.
- Gateway chat append, abort-partial-persistentie, `/sessions.send` en
  webchat-mediatranscriptschrijfacties voegen direct toe via SQLite-transcriptscope.
  De Gateway-transcriptinjectiehelper accepteert niet langer een
  `transcriptLocator`-parameter.
- SQLite-transcriptontdekking vermeldt nu alleen transcriptscopes en statistieken:
  `{agentId, sessionId, updatedAt, eventCount}`. De dode
  `listSqliteSessionTranscriptLocators`-compatibiliteitshelper en het per-rij
  `locator`-veld zijn verdwenen.
- Transcriptreparatie-runtime stelt nu alleen
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` beschikbaar. De oude
  locatorgebaseerde reparatiehelper is verwijderd; doctor-/debugcode leest expliciete
  bronbestandspaden en migreert nooit locatorstrings.
- ACP replay ledger-runtime slaat per-sessie replay-rijen nu op in de gedeelde
  SQLite-state-database in plaats van `acp/event-ledger.json`; doctor importeert en
  verwijdert het verouderde bestand.
- Gateway-transcriptlezerhelpers staan nu in
  `src/gateway/session-transcript-readers.ts` in plaats van de oude
  `session-utils.fs`-modulenaam. De fallback-retry-history-check is genoemd naar
  SQLite-transcriptinhoud in plaats van het oude file-helper-oppervlak.
- Gateway injected-chat- en compaction-helpers geven nu SQLite-transcriptscope
  door via interne helper-API's in plaats van waarden transcriptpaden of
  bronbestanden te noemen.
- Bootstrap-continuatiedetectie controleert nu SQLite-transcriptrijen via
  `hasCompletedBootstrapTranscriptTurn`; het stelt geen bestandsvormige
  helpernaam meer bloot.
- Embedded-runner-tests gebruiken nu SQLite-transcriptidentiteit, en het openen van een nieuwe
  transcriptmanager vereist altijd een expliciete `sessionId`.
- Memory-indexeringshelpers gebruiken nu overal SQLite-transcriptterminologie:
  host exporteert `listSessionTranscriptScopesForAgent` en
  `sessionTranscriptKeyForScope`, gerichte syncwachtrijen `sessionTranscripts`,
  publieke session-search-hits stellen ondoorzichtige `transcript:<agent>:<session>`-paden bloot,
  en de interne DB-bronkey is `session:<session>` onder
  `source_kind='sessions'` in plaats van een nepbestandspad.
- De generieke Plugin SDK persistent-dedupe-helper stelt geen bestandsvormige
  opties meer bloot. Callers leveren SQLite-scopekeys en duurzame dedupe-rijen leven in
  gedeelde Plugin-state.
- Microsoft Teams SSO-tokens zijn verplaatst van vergrendelde JSON-bestanden naar SQLite Plugin
  state. Doctor importeert `msteams-sso-tokens.json`, bouwt canonieke SSO-tokenkeys
  opnieuw op uit payloads en verwijdert het bronbestand. Gedelegeerde OAuth-tokens blijven
  op hun bestaande private credential-file-grens.
- Matrix-synccachestatus is verplaatst van `bot-storage.json` naar SQLite Plugin
  state. Doctor importeert verouderde raw of wrapped syncpayloads en verwijdert het
  bronbestand. Actieve Matrix- en QA Matrix-clients geven een SQLite sync-store-rootdirectory
  door, niet een nep `sync-store.json`- of `bot-storage.json`-pad.
- Matrix legacy crypto-migratiestatus is verplaatst van
  `legacy-crypto-migration.json` naar SQLite Plugin state. Doctor importeert het
  oude statusbestand; Matrix SDK IndexedDB-snapshots zijn verplaatst van
  `crypto-idb-snapshot.json` naar SQLite Plugin-blobs. Matrix-herstelkeys en
  credentials zijn SQLite Plugin-state-rijen; hun oude JSON-bestanden zijn alleen
  doctor-migratie-invoer.
- Memory Wiki-activiteitslogs gebruiken nu SQLite Plugin state in plaats van
  `.openclaw-wiki/log.jsonl`. De Memory Wiki-migratieprovider importeert oude
  JSONL-logs; wiki-markdown en gebruikerskluisinhoud blijven file-backed als
  workspace-inhoud.
- Memory Wiki maakt niet langer `.openclaw-wiki/state.json` of de ongebruikte
  `.openclaw-wiki/locks`-directory aan. De migratieprovider verwijdert die uitgefaseerde
  Plugin-metadatabestanden als een oudere kluis ze nog heeft.
- Crestodian-auditentries gebruiken nu core SQLite Plugin state in plaats van
  `audit/crestodian.jsonl`. Doctor importeert de verouderde JSONL-auditlog en
  verwijdert deze na een geslaagde import.
- Config write/observe-auditentries gebruiken nu core SQLite Plugin state in plaats
  van `logs/config-audit.jsonl`. Doctor importeert de verouderde JSONL-auditlog en
  verwijdert deze na een geslaagde import.
- De macOS-companion schrijft geen app-lokale `logs/config-audit.jsonl`- of
  `logs/config-health.json`-sidecars meer tijdens het bewerken van `openclaw.json`. Het configbestand
  blijft file-backed, herstelsnapshots blijven naast het configbestand,
  en duurzame config audit/health-status hoort bij de Gateway SQLite-store.
- Crestodian rescue pending approvals gebruiken nu core SQLite Plugin state in plaats
  van `crestodian/rescue-pending/*.json`. Doctor importeert verouderde pending approval-bestanden
  en verwijdert ze na een geslaagde import.
- Phone Control tijdelijke arm-status gebruikt nu SQLite Plugin state in plaats van
  `plugins/phone-control/armed.json`. Doctor importeert het verouderde armed-state-bestand
  in de `phone-control/arm-state`-namespace en verwijdert het bestand.
- Doctor repareert JSONL-transcripten niet langer ter plekke en maakt geen backup-JSONL-
  bestanden meer. Het importeert de actieve branch in SQLite en verwijdert de verouderde bron.
- Session-memory hook-transcriptlookup gebruikt `{agentId, sessionId}` scope-only
  SQLite-reads. De helper accepteert of leidt niet langer transcriptlocators,
  verouderde file-reads of file-rewrite-opties af.
- Codex app-server-conversationbindings keyen SQLite Plugin state nu op
  OpenClaw-sessiekey of expliciete `{agentId, sessionId}`-scope. Ze mogen geen
  transcript-path fallback-bindings behouden.
- Codex app-server mirrored-history-reads gebruiken alleen de SQLite-transcriptscope;
  ze mogen identiteit niet herstellen uit transcriptbestandspaden.
- Role-ordering- en compaction-resetpaden unlinken geen oude transcriptbestanden
  meer; reset roteert alleen de SQLite-sessierij en transcriptidentiteit.
- Gateway reset- en checkpointresponses retourneren schone sessierijen plus sessie-
  id's. Ze synthetiseren geen SQLite-transcriptlocators meer voor clients.
- Memory-core dreaming schoont sessierijen niet langer op door te peilen naar ontbrekende
  JSONL-bestanden. Subagent-cleanup verloopt via de sessie-runtime-API in plaats van
  filesystem-bestaanscontroles. De transcript-ingestion-tests seeden SQLite-rijen
  direct in plaats van `agents/<id>/sessions`-fixtures of locator-
  placeholders te maken.
- Memory-transcriptindexering mag `transcript:<agentId>:<sessionId>` blootstellen als een
  virtueel search-hit-pad voor citation/read-helpers. De duurzame indexbron is
  relationeel (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), dus de waarde is geen runtime-transcriptlocator,
  geen filesystempad, en mag nooit terug worden doorgegeven aan sessie-runtime-API's.
- Gateway doctor memory-status leest short-term recall- en phase-signal-aantallen
  uit SQLite Plugin-state-rijen in plaats van `memory/.dreams/*.json`; CLI- en
  doctor-output labelen die opslag nu als een SQLite-store, niet als een pad.
- Memory-core-runtime, CLI-status, Gateway doctor-methoden en Plugin SDK-
  facades auditen of archiveren geen verouderde `.dreams/session-corpus`-bestanden meer.
  Die bestanden zijn alleen migratie-invoer; doctor importeert ze in SQLite en
  verwijdert de bron na verificatie. Actieve session-ingestion-evidencerijen
  gebruiken nu het virtuele SQLite-pad `memory/session-ingestion/<day>.txt`; runtime
  schrijft of leidt nooit state af uit `.dreams/session-corpus`.
- Publieke Memory-core-artifacten stellen SQLite-hostevents bloot als het virtuele JSON-
  artifact `memory/events/memory-host-events.json`; ze hergebruiken niet langer het
  verouderde `.dreams/events.jsonl`-bronpad.
- Sandbox-container-/browserregistries gebruiken nu de gedeelde
  `sandbox_registry_entries` SQLite-tabel met getypeerde sessie-, image-, timestamp-,
  backend/config- en browserpoortkolommen. Doctor importeert verouderde monolithische en
  geshardede JSON-registerbestanden en verwijdert geslaagde bronnen. Runtime-reads gebruiken
  de getypeerde rijkolommen als bron van waarheid; `entry_json` is alleen een replay-/debug-
  kopie.
- Commitments gebruiken nu een getypeerde gedeelde `commitments`-tabel in plaats van een
  whole-store JSON-blob. Snapshot-opslag upsert op commitment-id en verwijdert alleen
  ontbrekende rijen in plaats van de tabel te legen en opnieuw in te voegen. Runtime laadt
  commitments uit getypeerde scope-, delivery-window-, status-, attempt- en tekst-
  kolommen; `record_json` is alleen een replay-/debugkopie. Doctor importeert verouderde
  `commitments.json` en verwijdert het na een geslaagde import.
- Cron-jobdefinities, schedulestatus en runhistorie hebben geen runtime
  JSON-writers of readers meer. Runtime gebruikt `cron_jobs`-rijen met getypeerd schema,
  payload-, bezorging-, foutwaarschuwing-, sessie-, status- en runtimestatuskolommen plus getypeerde
  `cron_run_logs`-metadata voor status, diagnoseoverzicht, bezorgstatus/-fout,
  sessie/run, model en tokentotalen. `job_json` is alleen een replay-/debugkopie; `state_json` bewaart geneste
  runtimediagnostiek die nog geen hot-queryvelden heeft, terwijl runtime
  hot-statusvelden opnieuw hydrateert vanuit getypeerde kolommen. Doctor importeert
  verouderde `jobs.json`-, `jobs-state.json`- en `runs/*.jsonl`-bestanden en verwijdert
  de geïmporteerde bronnen. Plugin-doelterugschrijvingen werken overeenkomende `cron_jobs`-
  rijen bij in plaats van de volledige cron-store te laden en te vervangen.
- Gateway-opstart negeert verouderde `notify: true`-markeringen in de runtime-
  projectie. Doctor vertaalt ze naar expliciete SQLite-bezorging wanneer
  `cron.webhook` geldig is, verwijdert inerte markeringen wanneer deze niet is ingesteld, en behoudt
  ze met een waarschuwing wanneer de geconfigureerde webhook ongeldig is.
- Uitgaande en sessiebezorgwachtrijen slaan nu wachtrijstatus, itemsoort,
  sessiesleutel, kanaal, doel, account-id, aantal pogingen, laatste poging/fout,
  herstelstatus en platformverzendmarkeringen op als getypeerde kolommen in de gedeelde
  `delivery_queue_entries`-tabel. Runtimeherstel leest die hot fields uit
  de getypeerde kolommen, en retry-/herstelmutaties werken die kolommen rechtstreeks bij
  zonder replay-JSON te herschrijven. De volledige JSON-payload blijft alleen bestaan als de
  replay-/debugblob voor berichtinhoud en andere koude replaygegevens.
- Beheerde uitgaande afbeeldingsrecords gebruiken nu getypeerde gedeelde
  `managed_outgoing_image_records`-rijen, waarbij mediabytes nog steeds worden opgeslagen in
  `media_blobs`. Het JSON-record blijft alleen bestaan als replay-/debugkopie.
- Discord-modelkiezer-voorkeuren, command-deploy-hashes en threadbindings
  gebruiken nu gedeelde SQLite Plugin-status. Hun verouderde JSON-importplannen staan in het
  Discord Plugin setup-/doctor-migratieoppervlak, niet in core-migratiecode.
- Plugin-verouderde-importdetectors gebruiken door doctor benoemde modules zoals
  `doctor-legacy-state.ts` of `doctor-state-imports.ts`; normale kanaalruntime-
  modules mogen geen verouderde JSON-detectors importeren.
- BlueBubbles catchup-cursors en inbound dedupe-markeringen gebruiken nu gedeelde SQLite
  Plugin-status. Hun verouderde JSON-importplannen staan in het BlueBubbles Plugin
  setup-/doctor-migratieoppervlak, niet in core-migratiecode.
- Telegram-update-offsets, stickercache-rijen, verzonden-berichtcache-rijen,
  topicnaamcache-rijen en threadbindings gebruiken nu gedeelde SQLite Plugin-
  status. Hun verouderde JSON-importplannen staan in het Telegram Plugin
  setup-/doctor-migratieoppervlak, niet in core-migratiecode.
- iMessage catchup-cursors, reply short-id-mappings en sent-echo dedupe-rijen
  gebruiken nu gedeelde SQLite Plugin-status. De oude `imessage/catchup/*.json`-,
  `imessage/reply-cache.jsonl`- en `imessage/sent-echoes.jsonl`-bestanden zijn
  alleen doctor-inputs.
- Feishu-berichtdedupe-rijen gebruiken nu gedeelde SQLite Plugin-status in plaats van
  `feishu/dedup/*.json`-bestanden. Het verouderde JSON-importplan staat in het Feishu
  Plugin setup-/doctor-migratieoppervlak, niet in core-migratiecode.
- Microsoft Teams-gesprekken, polls, buffers voor wachtende uploads en feedback-
  learnings gebruiken nu gedeelde SQLite Plugin-status-/blobtabellen. Het pad voor wachtende uploads
  gebruikt `plugin_blob_entries`, zodat mediabuffers als SQLite BLOBs worden opgeslagen
  in plaats van base64-JSON. De namen van runtimehelpers gebruiken nu SQLite-/statusnamen
  in plaats van `*-fs`-filestore-namen, en de oude `storePath`-shim is verdwenen
  uit deze stores. Het verouderde JSON-importplan staat in het Microsoft Teams
  Plugin setup-/doctor-migratieoppervlak.
- Door Zalo gehoste uitgaande media gebruikt nu gedeelde SQLite `plugin_blob_entries`
  in plaats van `openclaw-zalo-outbound-media` JSON-/bin-temp-sidecars.
- Diffs viewer-HTML en metadata gebruiken nu gedeelde SQLite `plugin_blob_entries`
  in plaats van `meta.json`-/`viewer.html`-tempbestanden. Gerenderde PNG-/PDF-uitvoer blijft
  tijdelijke materialisaties omdat kanaalbezorging nog steeds een bestandspad nodig heeft.
- Canvas-beheerde documenten gebruiken nu gedeelde SQLite `plugin_blob_entries` in plaats
  van een standaardmap `state/canvas/documents`. De Canvas-host serveert die
  blobs rechtstreeks; lokale bestanden worden alleen gemaakt voor expliciete `host.root`-
  operatorinhoud of tijdelijke materialisatie wanneer een downstream medialeezer
  een pad vereist.
- File Transfer-auditbeslissingen gebruiken nu gedeelde SQLite `plugin_state_entries`
  in plaats van het onbegrensde `audit/file-transfer.jsonl`-runtimelog. Doctor
  importeert het verouderde JSONL-auditbestand in Plugin-status en verwijdert de bron
  na een schone import.
- ACPX-procesleases en Gateway-instantie-identiteit gebruiken nu gedeelde SQLite Plugin-
  status. Doctor importeert het verouderde `gateway-instance-id`-bestand in Plugin-status
  en verwijdert de bron.
- Door ACPX gegenereerde wrapperscripts en de geïsoleerde Codex-home zijn tijdelijke
  materialisatie onder de OpenClaw-temp-root, geen duurzame OpenClaw-status. De
  duurzame ACPX-runtimerecords zijn de SQLite-lease en gateway-instance-rijen;
  het oude ACPX `stateDir`-configuratieoppervlak is verwijderd omdat daar geen runtime-status
  meer wordt geschreven.
- Gateway-mediabijlagen gebruiken nu de gedeelde SQLite-tabel `media_blobs` als
  canonieke bytestore. Lokale paden die worden teruggegeven aan kanaal- en sandbox-
  compatibiliteitsoppervlakken zijn tijdelijke materialisaties van de databaserij, niet de
  duurzame mediastore. Runtime-media-allowlists bevatten niet langer verouderde
  `$OPENCLAW_STATE_DIR/media`- of config-dir `media`-roots; die mappen zijn
  alleen doctor-importbronnen.
- Shell completion schrijft niet langer `$OPENCLAW_STATE_DIR/completions/*`-cache-
  bestanden. Install-, doctor-, update- en release-smoke-paden gebruiken gegenereerde
  completion-uitvoer of profilesourcing in plaats van duurzame completion-cache-
  bestanden.
- Gateway skill-upload-staging gebruikt nu gedeelde `skill_uploads`-rijen. Upload-
  metadata, idempotency keys en archiefbytes staan in SQLite; de installer
  ontvangt alleen een tijdelijk gematerialiseerd archiefpad terwijl een installatie
  draait.
- Inline bijlagen van subagents materialiseren niet langer onder workspace
  `.openclaw/attachments/*`. Het spawn-pad bereidt SQLite VFS-seeditems voor,
  inline runs seeden die items in de per-agent runtime-scratchnaamruimte,
  en disk-backed tools leggen die SQLite-scratch over bijlagepaden heen. De
  oude subagent-run attachment-dir-registrykolommen en cleanup-hooks zijn verdwenen.
- CLI-afbeeldingshydratie onderhoudt niet langer stabiele `openclaw-cli-images`-cache-
  bestanden. Externe CLI-backends ontvangen nog steeds bestandspaden, maar die paden zijn
  per-run tijdelijke materialisaties met cleanup.
- Cache-trace-diagnostiek, Anthropic-payloaddiagnostiek, ruwe modelstream-
  diagnostiek, diagnostische tijdlijngebeurtenissen en Gateway-stabiliteitsbundels schrijven nu
  SQLite-rijen in plaats van `logs/*.jsonl`- of
  `logs/stability/*.json`-bestanden.
  Runtime-padoverschrijvingsflags en env-vars zijn verwijderd; export-/debug-
  commando's kunnen bestanden expliciet materialiseren vanuit databaserijen.
- De macOS companion heeft niet langer een rolling `diagnostics.jsonl`-writer. App-
  logs gaan naar unified logging, en duurzame Gateway-diagnostiek blijft SQLite-backed.
- De macOS port-guardian-recordlijst gebruikt nu getypeerde gedeelde SQLite
  `macos_port_guardian_records`-rijen in plaats van een JSON-bestand in Application Support
  of een opaque singleton-blob.
- Gateway singleton locks gebruiken nu getypeerde gedeelde SQLite `state_leases`-rijen onder
  de `gateway_locks`-scope in plaats van temp-dir-lockbestanden. Fly- en OAuth-
  troubleshootingdocs wijzen nu naar de SQLite-lease-/auth-refresh-lock in plaats
  van verouderde file-lock-cleanup.
- Gateway restart sentinel-status gebruikt nu getypeerde gedeelde SQLite
  `gateway_restart_sentinel`-rijen in plaats van `restart-sentinel.json`; runtime
  leest sentinelsoort, status, routing, bericht, voortzetting en statistieken uit
  getypeerde kolommen. `payload_json` is alleen een replay-/debugkopie. Runtimecode wist
  de SQLite-rij rechtstreeks en draagt geen file-cleanup-plumbing meer.
- Gateway restart intent- en supervisor handoff-status gebruiken nu getypeerde gedeelde
  SQLite `gateway_restart_intent`- en `gateway_restart_handoff`-rijen in plaats van
  `gateway-restart-intent.json`- en
  `gateway-supervisor-restart-handoff.json`-sidecars.
- Gateway singleton-coördinatie gebruikt nu getypeerde `state_leases`-rijen onder
  `gateway_locks` in plaats van `gateway.<hash>.lock`-bestanden te schrijven. De lease-rij
  bezit de lock-owner, expiry, heartbeat en debugpayload; SQLite bezit de
  atomische acquire-/releasegrens. De gepensioneerde file-lock-directory-optie is
  verdwenen; tests gebruiken de SQLite-rijidentiteit rechtstreeks.
- De oude niet-gerefereerde cron usage-report-helper die `cron/runs/*.jsonl`-
  bestanden scande, is verwijderd. Cron-run-geschiedenisrapporten moeten de getypeerde
  `cron_run_logs` SQLite-rijen lezen.
- Main-session restart recovery ontdekt nu kandidaat-agents via het
  SQLite `agent_databases`-register in plaats van `agents/*/sessions`-
  mappen te scannen.
- Gemini session-corruption recovery verwijdert nu alleen de SQLite-sessierij;
  het heeft niet langer een verouderde `storePath`-gate nodig en probeert geen afgeleid
  transcript-JSONL-pad te unlinken.
- Padoverschrijvingsafhandeling behandelt letterlijke `undefined`/`null`-environment-
  waarden nu als niet ingesteld, waardoor accidentele repo-root `undefined/state/*.sqlite`-
  databases tijdens tests of shell-handoffs worden voorkomen.
- Config-gezondheidsfingerprints gebruiken nu getypeerde gedeelde SQLite `config_health_entries`-
  rijen in plaats van `logs/config-health.json`, zodat het normale configbestand het
  enige niet-credential configuratiedocument blijft. De macOS companion bewaart alleen
  proceslokale gezondheidsstatus en maakt de oude JSON-sidecar niet opnieuw.
- Auth-profielruntime importeert of schrijft niet langer credential-JSON-bestanden. De
  canonieke credentialstore is SQLite; `auth-profiles.json`, per-agent
  `auth.json` en gedeelde `credentials/oauth.json` zijn doctor-migratie-inputs
  die na import worden verwijderd.
- Auth-profiel-save-/statustests controleren nu getypeerde SQLite-auth-tabellen rechtstreeks
  en gebruiken verouderde auth-profielfilenames alleen voor doctor-migratie-inputs.
- `openclaw secrets apply` scrubt alleen het configbestand, env-bestand en de SQLite
  auth-profielstore. Het draagt niet langer compatibiliteitslogica die gepensioneerde
  per-agent `auth.json` bewerkt; doctor is eigenaar van het importeren en verwijderen van dat bestand.
- Hermes-geheimmigratieplannen en applies importeren geïmporteerde API-key-profielen rechtstreeks
  in de SQLite auth-profielstore. Het schrijft of verifieert niet langer
  `auth-profiles.json` als tussenliggend doel.
- Gebruikersgerichte auth-docs beschrijven nu
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` in plaats van
  gebruikers te vertellen `auth-profiles.json` te inspecteren of te kopiëren; verouderde OAuth-/auth-JSON-
  namen blijven alleen gedocumenteerd als doctor-import-inputs.
- Core state-path-helpers exposen niet langer het gepensioneerde `credentials/oauth.json`-
  bestand. De verouderde bestandsnaam is lokaal voor het doctor auth-importpad.
- Installatie-, beveiligings-, onboarding-, model-auth- en SecretRef-docs beschrijven nu
  SQLite auth-profielrijen en whole-state backup/migratie in plaats van
  per-agent auth-profiel-JSON-bestanden.
- PI-modeldiscovery geeft nu canonieke credentials door aan in-memory
  `pi-coding-agent`-authopslag. Het maakt, scrubt of schrijft niet langer
  per-agent `auth.json` tijdens discovery.
- Voice Wake-trigger- en routinginstellingen gebruiken nu getypeerde gedeelde SQLite-tabellen
  in plaats van `settings/voicewake.json`, `settings/voicewake-routing.json` of
  opaque generieke rijen; doctor importeert de verouderde JSON-bestanden en verwijdert ze na een
  geslaagde migratie.
- Update-check-status gebruikt nu een getypeerde gedeelde `update_check_state`-rij in plaats van
  `update-check.json` of een opaque generieke blob; doctor importeert
  het verouderde JSON-bestand en verwijdert het na een geslaagde migratie.
- Config-gezondheidsstatus gebruikt nu getypeerde gedeelde `config_health_entries`-rijen in plaats
  van `logs/config-health.json` of een opaque generieke blob; doctor
  importeert het verouderde JSON-bestand en verwijdert het na een geslaagde migratie.
- Plugin-goedkeuringen voor gespreksbindings gebruiken nu getypeerde
  `plugin_binding_approvals`-rijen in plaats van opaque gedeelde SQLite-status of
  `plugin-binding-approvals.json`; het verouderde bestand is invoer voor een doctor-migratie.
- Generieke bindingen voor het huidige gesprek slaan nu getypeerde
  `current_conversation_bindings`-rijen op in plaats van
  `bindings/current-conversations.json` te herschrijven; doctor importeert het
  verouderde JSON-bestand en verwijdert het na een geslaagde migratie.
- Synchronisatielogboeken voor geimporteerde bronnen van Memory Wiki slaan nu
  een SQLite-pluginstatusrij per vault-/bronsleutel op in plaats van
  `.openclaw-wiki/source-sync.json` te herschrijven; de migratieprovider
  importeert en verwijdert het verouderde JSON-logboek.
- Import-runrecords van Memory Wiki ChatGPT slaan nu een SQLite-pluginstatusrij
  per vault-/run-id op in plaats van `.openclaw-wiki/import-runs/*.json` te
  schrijven. Rollback-snapshots blijven expliciete vault-bestanden totdat
  archivering van import-run-snapshots naar blobopslag is verplaatst.
- Gecompileerde digests van Memory Wiki slaan nu SQLite-pluginblobrijen op in
  plaats van `.openclaw-wiki/cache/agent-digest.json` en
  `.openclaw-wiki/cache/claims.jsonl` te schrijven. De migratieprovider
  importeert oude cachebestanden en verwijdert de cachemap wanneer die leeg
  wordt.
- Installatietracking van ClawHub-Skills slaat nu een SQLite-pluginstatusrij per
  workspace/skill op in plaats van `.clawhub/lock.json` en
  `.clawhub/origin.json`-nevenbestanden tijdens runtime te schrijven of lezen.
  Runtimecode gebruikt statusobjecten voor getrackte installaties in plaats van
  lockfile-/origin-abstracties in bestandsvorm. Doctor importeert de verouderde
  nevenbestanden uit geconfigureerde agent-workspaces en verwijdert ze na een
  schone import.
- De geinstalleerde Plugin-index leest en schrijft nu de getypeerde gedeelde
  SQLite-singletonrij `installed_plugin_index` in plaats van
  `plugins/installs.json`; het verouderde JSON-bestand is alleen invoer voor
  een doctor-migratie en wordt na import verwijderd.
- De verouderde padhelper voor `plugins/installs.json` leeft nu in verouderde
  doctor-code. Runtime Plugin-indexmodules bieden alleen door SQLite ondersteunde
  persistentieopties, geen JSON-bestandspad.
- Gateway-herstartsentinel, herstartintentie en supervisor-overdrachtsstatus
  gebruiken nu getypeerde gedeelde SQLite-rijen (`gateway_restart_sentinel`,
  `gateway_restart_intent` en `gateway_restart_handoff`) in plaats van generieke
  ondoorzichtige blobs. Runtime-herstartcode heeft geen sentinel-/intentie-/
  overdrachtscontract in bestandsvorm.
- Matrix-synchronisatiecache, opslagmetadata, threadbindingen, inkomende
  deduplicatiemarkeringen, cooldownstatus voor opstartverificatie, SDK
  IndexedDB-cryptosnapshots, referenties en herstelsleutels gebruiken nu
  gedeelde SQLite-pluginstatus-/blobtabellen. Runtime-padstructuren bieden geen
  metadatapad `storage-meta.json` meer; die bestandsnaam is alleen verouderde
  migratie-invoer. Hun verouderde JSON-importplan leeft in het setup-/doctor-
  migratieoppervlak van de Matrix-Plugin.
- Matrix-opstart scant, rapporteert of voltooit geen verouderde Matrix-
  bestandsstatus meer. Matrix-bestandsdetectie, aanmaak van verouderde
  cryptosnapshots, migratiestatus voor room-key-herstel, import en verwijdering
  van bronnen zijn allemaal eigendom van doctor.
- Matrix-runtime-migratiebarrels zijn verwijderd. Helpers voor detectie en
  mutatie van verouderde status/crypto worden rechtstreeks door Matrix-doctor
  geimporteerd in plaats van deel uit te maken van het runtime-API-oppervlak.
- Hergebruikmarkeringen voor Matrix-migratiesnapshots leven nu in SQLite-
  pluginstatus in plaats van `matrix/migration-snapshot.json`; doctor kan nog
  steeds hetzelfde geverifieerde pre-migratiearchief hergebruiken zonder een
  nevenstatusbestand te schrijven.
- Nostr-buscursors en profielpublicatiestatus gebruiken nu gedeelde SQLite-
  pluginstatus. Hun verouderde JSON-importplan leeft in het setup-/doctor-
  migratieoppervlak van de Nostr-Plugin.
- Sessieschakelaars van Active Memory gebruiken nu gedeelde SQLite-pluginstatus
  in plaats van `session-toggles.json`; geheugen weer inschakelen verwijdert de
  rij in plaats van een JSON-object te herschrijven.
- Voorstellen en reviewtellers van Skill Workshop gebruiken nu gedeelde SQLite-
  pluginstatus in plaats van `skill-workshop/<workspace>.json`-stores per
  workspace. Elk voorstel is een afzonderlijke rij onder
  `skill-workshop/proposals`, en de reviewteller is een afzonderlijke rij onder
  `skill-workshop/reviews`.
- Reviewer-subagent-runs van Skill Workshop gebruiken nu de transcriptresolver
  voor runtimesessies in plaats van `skill-workshop/<sessionId>.json`-
  nevensessiepaden te maken.
- ACPX-procesleases gebruiken nu gedeelde SQLite-pluginstatus onder
  `acpx/process-leases` in plaats van een volledig bestandsregister
  `process-leases.json`. Elke lease wordt als eigen rij opgeslagen, waardoor het
  opruimen van verouderde processen bij opstarten behouden blijft zonder
  runtimepad voor JSON-herschrijving.
- ACPX-wrapperscripts en de geisoleerde Codex-home worden gegenereerd in de
  tijdelijke hoofdmap van OpenClaw. Ze worden opnieuw aangemaakt wanneer nodig en
  zijn geen backup- of migratie-invoer.
- Persistentie van het subagent-runregister gebruikt getypeerde gedeelde
  `subagent_runs`-rijen. Het oude pad `subagents/runs.json` is nu alleen invoer
  voor een doctor-migratie, en runtime-helpernamen beschrijven de statuslaag niet
  langer als schijfondersteund. Runtimetests maken geen ongeldige of lege
  `runs.json`-fixtures meer om registergedrag te bewijzen; ze seeden/lezen
  SQLite-rijen rechtstreeks.
- Backup staget de statusmap voordat er wordt gearchiveerd, kopieert niet-
  databasebestanden, maakt snapshots van `*.sqlite`-databases met `VACUUM INTO`,
  laat live WAL/SHM-nevenbestanden weg, registreert snapshotmetadata in het
  archiefmanifest en registreert voltooide backupruns in SQLite met het
  archiefmanifest. `openclaw backup create` valideert het geschreven archief
  standaard; `--no-verify` is het expliciete snelle pad.
- `openclaw backup restore` valideert het archief voor extractie, hergebruikt
  het genormaliseerde manifest van de verifier en herstelt geverifieerde
  manifestassets naar hun geregistreerde bronpaden. Het vereist `--yes` voor
  schrijfacties en ondersteunt `--dry-run` voor een herstelplan.
- Het oude filter voor vluchtige backuppaden is verwijderd. Backup heeft geen
  live-tar-oversla-lijst meer nodig voor verouderde sessie- of cron-JSON/JSONL-
  bestanden, omdat SQLite-snapshots worden gestaged voordat het archief wordt
  gemaakt.
- Voorbereiding van workspaces bij gewone setup en onboarding maakt geen
  `agents/<agentId>/sessions/`-mappen meer aan. Ze maken alleen configuratie/
  workspace aan; SQLite-sessierijen en transcriptrijen worden op aanvraag
  aangemaakt in de database per agent.
- Herstel van beveiligingsmachtigingen richt zich nu op de globale en per-agent
  SQLite-databases plus WAL/SHM-nevenbestanden in plaats van `sessions.json` en
  transcript-JSONL-bestanden.
- Runtime-namen van het sandboxregister beschrijven nu rechtstreeks SQLite-
  registersoorten in plaats van verouderde JSON-registerterminologie door de
  actieve store te dragen.
- `openclaw reset --scope config+creds+sessions` verwijdert per-agent
  `openclaw-agent.sqlite`-databases plus WAL/SHM-nevenbestanden, niet alleen
  verouderde `sessions/`-mappen.
- Gateway-helpers voor geaggregeerde sessies gebruiken nu entrygerichte namen:
  `loadCombinedSessionEntriesForGateway` retourneert `{ databasePath, entries }`.
  De oude naamgeving voor gecombineerde stores is verwijderd uit runtime-
  aanroepers.
- Docker MCP-kanaalseeding schrijft nu de hoofdsessierij en transcriptgebeurtenissen
  naar de per-agent SQLite-database in plaats van `sessions.json` en een JSONL-
  transcript te maken.
- De gebundelde session-memory-hook lost nu context van vorige sessies op uit
  SQLite op basis van `{agentId, sessionId}`. Deze scant, bewaart of synthetiseert
  geen transcriptpaden of `workspace/sessions`-mappen meer.
- De gebundelde command-logger-hook schrijft nu commando-auditrijen naar de
  gedeelde SQLite-tabel `command_log_entries` in plaats van aan
  `logs/commands.log` toe te voegen.
- Allowlists voor kanaalkoppeling bieden nu alleen door SQLite ondersteunde
  lees-/schrijfhelpers tijdens runtime en in de Plugin-SDK. De oude
  `*-allowFrom.json`-padresolver en bestandslezer leven alleen onder verouderde
  doctor-importcode.
- `migration_runs` registreert uitvoeringen van migraties van verouderde status
  met status, tijdstempels en JSON-rapporten.
- `migration_sources` registreert elke geimporteerde verouderde bestandsbron met
  hash, grootte, recordaantal, doeltabel, run-id, status en bronverwijderingsstatus.
- `backup_runs` registreert backup-archiefpaden, status en JSON-manifesten.
- Het globale schema houdt geen ongebruikte `agents`-registertabel bij.
  Agentdatabasedetectie is het canonieke `agent_databases`-register totdat
  runtime een echte eigenaar van agentrecords heeft.
- Gegenereerde modelcatalogusconfiguratie wordt opgeslagen in getypeerde globale
  SQLite-rijen `agent_model_catalogs`, gesleuteld op agentmap. Runtime-
  aanroepers gebruiken `ensureOpenClawModelCatalog`; er is geen compatibiliteits-
  API voor `models.json` in runtimecode. De implementatie schrijft SQLite en het
  ingebedde PI-register wordt gevuld vanuit die opgeslagen payload zonder een
  `models.json`-bestand aan te maken.
- QMD-sessietranscript-markdownexport en `memory.qmd.sessions`-configuratie zijn
  verwijderd. Er is geen QMD-transcriptcollectie, geen runtimepad
  `qmd/sessions*` en geen door bestanden ondersteunde sessiegeheugenbrug.
- Memory-core-runtime importeert SQLite-transcriptindexeringshelpers uit
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts`, niet uit het
  QMD-SDK-subpad. Het QMD-subpad behoudt alleen een compatibiliteits-herexport
  voor externe aanroepers totdat een grote SDK-opschoning deze kan verwijderen.
- QMD's eigen `index.sqlite` is nu een tijdelijke runtimematerialisatie
  ondersteund door de hoofd-SQLite-tabel `plugin_blob_entries`. Runtime maakt
  geen duurzaam nevenpad `~/.openclaw/agents/<agentId>/qmd` meer aan.
- De optionele `memory-lancedb`-Plugin maakt niet langer
  `~/.openclaw/memory/lancedb` aan als impliciete door OpenClaw beheerde store.
  Het is een externe LanceDB-backend en blijft uitgeschakeld totdat de operator
  een expliciet `dbPath` configureert.
- `check:database-first-legacy-stores` laat nieuwe runtimebroncode falen die
  verouderde storenamen koppelt aan schrijvende bestandssysteem-API's. De check
  laat ook runtimebroncode falen die de uitgefaseerde transcriptbrugmarkeringen
  `transcriptLocator` of `sqlite-transcript://...` opnieuw introduceert.
  Migratie-, doctor-, import- en expliciete niet-sessie-exportcode blijven
  toegestaan. Bredere verouderde contractnamen zoals `sessionFile`, `storePath`
  en oude bestandsperiodefacades van `SessionManager` hebben nog huidige
  eigenaren en hebben afzonderlijk werk aan migratiebewaking nodig voordat ze
  een vereiste preflightcheck kunnen worden. De guard dekt nu ook runtime
  `cache/*.json`-stores, generieke `thread-bindings.json`-nevenbestanden, JSON
  voor cronstatus/run-log, JSON voor configuratiegezondheid, herstart- en
  lock-nevenbestanden, Voice Wake-instellingen, Plugin-bindingsgoedkeuringen,
  JSON voor de geinstalleerde Plugin-index, File Transfer-audit-JSONL, Memory
  Wiki-activiteitlogs, het oude tekstlogboek van de gebundelde `command-logger`
  en diagnostische knoppen voor pi-mono raw-stream-JSONL. De guard verbiedt ook
  oude rootniveau-module namen voor verouderde doctor-code zodat
  compatibiliteitscode onder `src/commands/doctor/` blijft. Android-
  debughandlers gebruiken ook logcat/in-memory-uitvoer in plaats van cachebestanden
  `camera_debug.log` of `debug_logs.txt` te stagen.

## Doelschemavorm

Houd schema's expliciet. Runtime-status die eigendom is van de host gebruikt getypeerde tabellen. Ondoorzichtige status die eigendom is van een Plugin gebruikt `plugin_state_entries` / `plugin_blob_entries`; er is geen generieke host-`kv`-tabel.

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

Toekomstige zoekfunctionaliteit kan FTS-tabellen toevoegen zonder de canonieke gebeurtenistabellen te wijzigen:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

Grote waarden moeten `blob`-kolommen gebruiken, geen JSON-stringcodering. Houd `value_json` voor kleine gestructureerde gegevens die inspecteerbaar moeten blijven met eenvoudige SQLite-tools.

`agent_databases` is het canonieke register voor deze branch. Voeg geen `agents`-tabel toe totdat er een echte eigenaar van agentrecords bestaat; agentconfiguratie blijft in `openclaw.json`.

## Vorm van Doctor-migratie

Doctor moet een expliciete migratiestap aanroepen die rapporteerbaar is en veilig opnieuw kan worden uitgevoerd:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` roept de implementatie van statusmigratie aan na de gewone configuratiepreflight en maakt een geverifieerde back-up voordat er wordt geïmporteerd. Runtime-opstart en `openclaw migrate` mogen geen verouderde OpenClaw-statusbestanden importeren.

Migratie-eigenschappen:

- Eén migratiepassage ontdekt alle verouderde bestandsbronnen en produceert een plan voordat er iets wordt gewijzigd.
- Doctor maakt een geverifieerd pre-migratieback-uparchief voordat verouderde bestanden worden geïmporteerd.
- Imports zijn idempotent en gesleuteld op bronpad, mtime, grootte, hash en doeltabel.
- Succesvol verwerkte bronbestanden worden verwijderd of gearchiveerd nadat de doeldatabase heeft gecommit.
- Mislukte imports laten de bron onaangeroerd en registreren een waarschuwing in `migration_runs`.
- Runtime-code leest alleen SQLite nadat de migratie bestaat.
- Er is geen downgrade-/export-naar-runtime-bestandenpad vereist.

## Migratie-inventaris

Verplaats deze naar de globale database:

- Runtime-schrijfoperaties voor het taakregister gebruiken nu de gedeelde database; de niet-uitgebrachte
  `tasks/runs.sqlite` sidecar-importer is verwijderd. Snapshot-opslag doet upserts op taak
  id en verwijdert alleen ontbrekende taak-/leveringsrijen.
- Runtime-schrijfoperaties voor taakstromen gebruiken nu de gedeelde database; de niet-uitgebrachte
  `tasks/flows/registry.sqlite` sidecar-importer is verwijderd. Snapshot-opslag
  doet upserts op flow-id en verwijdert alleen ontbrekende flow-rijen.
- Runtime-schrijfoperaties voor Plugin-status gebruiken nu de gedeelde database; de niet-uitgebrachte
  `plugin-state/state.sqlite` sidecar-importer is verwijderd.
- Ingebouwde geheugenzoekactie gebruikt niet langer standaard `memory/<agentId>.sqlite`; de
  indextabellen staan in de eigenaar-agentdatabase, en de expliciete
  `memorySearch.store.path` sidecar-opt-in is verplaatst naar doctor-configuratiemigratie.
- Ingebouwde geheugenherindexering reset alleen tabellen in de agentdatabase die door geheugen worden beheerd.
  Het mag niet het hele SQLite-bestand vervangen, omdat dezelfde database eigenaar is van
  sessies, transcripties, VFS-rijen, artefacten en runtime-caches.
- Sandbox-container-/browserregisters uit monolithische en geshardede JSON. Runtime-
  schrijfoperaties gebruiken nu de gedeelde database; legacy-JSON-import blijft bestaan.
- Cron-taakdefinities, planningsstatus en uitvoeringsgeschiedenis gebruiken nu gedeelde SQLite;
  doctor importeert/verwijdert legacy `jobs.json`, `jobs-state.json` en
  `cron/runs/*.jsonl` bestanden
- Apparaatidentiteit/-auth, push, updatecontrole, commitments, OpenRouter-model
  cache, geïnstalleerde Plugin-index en app-serverbindingen
- Apparaat-/Node-koppeling en bootstraprecords gebruiken nu getypeerde SQLite-tabellen
- Apparaatkoppelingsmeldingsabonnees en markers voor geleverde verzoeken gebruiken nu de
  gedeelde SQLite Plugin-status-tabel in plaats van `device-pair-notify.json`.
- Gespreksrecords voor spraakoproepen gebruiken nu de gedeelde SQLite Plugin-status-tabel onder de
  `voice-call` / `calls` namespace in plaats van `calls.jsonl`; de Plugin-CLI
  volgt en vat door SQLite ondersteunde oproepgeschiedenis samen.
- QQBot Gateway-sessies, bekende-gebruikersrecords en ref-index-citaatcache gebruiken nu
  SQLite Plugin-status onder `qqbot` namespaces (`sessions`, `known-users`,
  `ref-index`) in plaats van `session-*.json`, `known-users.json` en
  `ref-index.jsonl`; de QQBot doctor-/setupmigratie importeert en verwijdert de
  legacy-bestanden.
- Discord modelkiezer-voorkeuren, command-deploy-hashes en threadbindingen
  gebruiken nu SQLite Plugin-status onder `discord` namespaces
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  in plaats van `model-picker-preferences.json`, `command-deploy-cache.json` en
  `thread-bindings.json`; de Discord doctor-/setupmigratie importeert en
  verwijdert de legacy-bestanden.
- BlueBubbles catchup-cursors en inkomende dedupe-markers gebruiken nu SQLite Plugin-
  status onder `bluebubbles` namespaces (`catchup-cursors`, `inbound-dedupe`)
  in plaats van `bluebubbles/catchup/*.json` en
  `bluebubbles/inbound-dedupe/*.json`; de BlueBubbles doctor-/setupmigratie
  importeert en verwijdert de legacy-bestanden.
- Telegram update-offsets, sticker-cachevermeldingen, berichtcachevermeldingen voor reply chains
  vermeldingen, verzonden-bericht-cachevermeldingen, topicnaam-cachevermeldingen en thread-
  bindingen gebruiken nu SQLite Plugin-status onder `telegram` namespaces
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) in plaats van `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json` en
  `thread-bindings-*.json`; de Telegram doctor-/setupmigratie importeert en
  verwijdert de legacy-bestanden.
- iMessage catchup-cursors, reply short-id mappings en sent-echo dedupe-rijen
  gebruiken nu SQLite Plugin-status onder `imessage` namespaces (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) in plaats van `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl` en `imessage/sent-echoes.jsonl`; de iMessage
  doctor-/setupmigratie importeert en verwijdert de legacy-bestanden.
- Microsoft Teams gesprekken, polls, SSO-tokens en feedback-learnings gebruiken nu
  SQLite Plugin-status-namespaces (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) in plaats van `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json` en `*.learnings.json`; de
  Microsoft Teams doctor-/setupmigratie importeert en archiveert de legacy-bestanden.
  Openstaande uploads zijn een kortlevende SQLite-cache en oude JSON-cachebestanden worden
  niet gemigreerd.
- Matrix sync-cache, opslagmetadata, threadbindingen, inkomende dedupe-markers,
  cooldownstatus voor opstartverificatie, inloggegevens, herstelsleutels en SDK
  IndexedDB-cryptosnapshots gebruiken nu SQLite Plugin-status-/blob-namespaces onder
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  in plaats van `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json` en `crypto-idb-snapshot.json`; de Matrix doctor-/setup-
  migratie importeert en verwijdert die legacy-bestanden uit account-gescopeerde Matrix
  opslagroots.
- Nostr bus-cursors en profielpublicatiestatus gebruiken nu SQLite Plugin-status onder
  `nostr` namespaces (`bus-state`, `profile-state`) in plaats van
  `bus-state-*.json` en `profile-state-*.json`; de Nostr doctor-/setup-
  migratie importeert en verwijdert de legacy-bestanden.
- Active Memory sessietoggles gebruiken nu SQLite Plugin-status onder
  `active-memory/session-toggles` in plaats van `session-toggles.json`.
- Skill Workshop voorstelwachtrijen en reviewtellers gebruiken nu SQLite Plugin-status
  onder `skill-workshop/proposals` en `skill-workshop/reviews` in plaats van
  per-werkruimte `skill-workshop/<workspace>.json` bestanden.
- Uitgaande levering en sessieleveringswachtrijen delen nu de globale SQLite
  `delivery_queue_entries` tabel onder afzonderlijke wachtrijnamen
  (`outbound-delivery`, `session-delivery`) in plaats van duurzame
  `delivery-queue/*.json`, `delivery-queue/failed/*.json` en
  `session-delivery-queue/*.json` bestanden. De doctor legacy-state-stap importeert
  openstaande en mislukte rijen, verwijdert verouderde geleverde markers en verwijdert de oude
  JSON-bestanden na import. Hot-routing- en retry-velden zijn getypeerde kolommen; de
  JSON-payload blijft alleen behouden voor replay/debug.
- ACPX-procesleases gebruiken nu SQLite Plugin-status onder `acpx/process-leases`
  in plaats van `process-leases.json`.
- Back-up- en migratie-uitvoeringsmetadata

Verplaats deze naar agentdatabases:

- Agentsessieroots en compatibiliteitsvormige session-entry-payloads. Gedaan voor
  runtime-schrijfoperaties: hot sessiemetadata is opvraagbaar in `sessions`, terwijl de
  legacy-vormige volledige `SessionEntry` payload in `session_entries` blijft.
- Agenttranscriptiegebeurtenissen. Gedaan voor runtime-schrijfoperaties.
- Compaction-checkpoints en transcriptiesnapshots. Gedaan voor runtime-schrijfoperaties:
  checkpoint-transcriptiekopieën zijn SQLite-transcriptierijen en checkpoint-
  metadata wordt vastgelegd in `transcript_snapshots`. Gateway-checkpointhelpers
  benoemen deze waarden nu als transcriptiesnapshots in plaats van bronbestanden.
- Agent-VFS scratch-/werkruimte-namespaces. Gedaan voor runtime-VFS-schrijfoperaties.
- Subagent-bijlagepayloads. Gedaan voor runtime-schrijfoperaties: het zijn SQLite VFS-
  seed-vermeldingen en nooit duurzame werkruimtebestanden.
- Toolartefacten. Gedaan voor runtime-schrijfoperaties.
- Run-artefacten. Gedaan voor worker-runtime-schrijfoperaties via de per-agent
  `run_artifacts` tabel.
- Agent-lokale runtime-caches. Gedaan voor worker-runtime-gescopeerde cacheschrijfoperaties via
  de per-agent `cache_entries` tabel. Gateway-brede modelcaches blijven in de
  globale database tenzij ze agentspecifiek worden.
- ACP parent-streamlogs. Gedaan voor runtime-schrijfoperaties.
- ACP replay-ledgersessies. Gedaan voor runtime-schrijfoperaties via
  `acp_replay_sessions` en `acp_replay_events`; legacy `acp/event-ledger.json`
  blijft alleen als doctor-invoer bestaan.
- ACP-sessiemetadata. Gedaan voor runtime-schrijfoperaties via `acp_sessions`; legacy
  `entry.acp` blokken in `sessions.json` zijn alleen doctor-migratie-invoer.
- Trajectory-sidecars wanneer ze geen expliciete exportbestanden zijn. Gedaan voor runtime-
  schrijfoperaties: trajectory-capture schrijft agentdatabase-`trajectory_runtime_events`
  rijen en spiegelt run-gescopeerde artefacten naar SQLite. Legacy-sidecars zijn alleen doctor-
  importinvoer; export kan verse JSONL-supportbundle-uitvoer materialiseren
  maar leest of migreert oude trajectory-/transcriptie-sidecars niet tijdens runtime.
  Runtime trajectory-capture exposeert SQLite-scope; JSONL-padhelpers zijn
  geïsoleerd voor export-/debugsupport en worden niet opnieuw geëxporteerd vanuit de runtime-module.
  Embedded-runner trajectory-metadata legt `{agentId, sessionId, sessionKey}`
  identiteit vast in plaats van een transcriptielocator te persisteren.

Laat deze voorlopig door bestanden ondersteund blijven:

- `openclaw.json`
- provider- of CLI-inloggegevensbestanden
- Plugin-/pakketmanifesten
- gebruikerswerkruimten en Git-repositories wanneer schijfmodus is geselecteerd
- logs bedoeld voor operator-tailing, tenzij een specifiek logoppervlak wordt verplaatst

## Migratieplan

### Fase 0: Bevries de grens

Maak de duurzame-statusgrens expliciet voordat meer rijen worden verplaatst:

- Voeg een `migration_runs` tabel toe aan de globale database.
  Gedaan voor uitvoeringsrapporten van legacy-statusmigraties.
- Voeg één door doctor beheerde statusmigratieservice toe voor import van bestand naar database.
  Gedaan: `openclaw doctor --fix` gebruikt de implementatie voor legacy-statusmigratie.
- Maak `plan` alleen-lezen en laat `apply` een back-up maken, importeren, verifiëren en
  daarna oude bestanden verwijderen of in quarantaine plaatsen.
  Gedaan: doctor maakt een geverifieerde pre-migratieback-up, geeft het back-uppad
  door aan `migration_runs` en hergebruikt de importer-/verwijderpaden.
- Voeg statische verboden toe zodat nieuwe runtime-code geen legacy-statusbestanden kan schrijven terwijl
  migratiecode en tests ze nog steeds kunnen seeden/lezen.
  Gedaan voor de momenteel gemigreerde legacy-stores; de guard scant ook geneste
  tests op verboden runtime-transcriptielocatorcontracten.

### Fase 1: Voltooi het globale besturingsvlak

Houd gedeelde coördinatiestatus in `state/openclaw.sqlite`:

- Agents en agentdatabaseregister
- Taak- en taakstroomledgers
- Plugin-status
- Sandbox-container-/browserregister
- Cron-/scheduler-uitvoeringsgeschiedenis
- Koppeling, apparaat, push, updatecontrole, TUI, OpenRouter-/modelcaches en andere
  kleine Gateway-gescopeerde runtime-status
- Back-up- en migratiemetadata
- Gateway media-bijlagebytes. Gedaan voor runtime-schrijfoperaties; directe bestandspaden
  zijn tijdelijke materialisaties voor compatibiliteit met kanaalverzenders en sandbox-
  staging. Runtime-allowlists accepteren SQLite-materialisatiepaden, niet legacy
  status-/configmedia-roots. Doctor importeert legacy-mediabestanden naar
  `media_blobs` en verwijdert de bronbestanden na succesvolle rijschrijfoperaties.
- Debug-proxy capture-sessies, gebeurtenissen en payloadblobs. Gedaan: captures leven
  in de gedeelde status-DB en openen via de gedeelde status-DB-bootstrap, schema,
  WAL en busy-timeout-instellingen. Payloadbytes zijn gzip-gecomprimeerd in
  `capture_blobs.data`; er is geen runtime-sidecar-DB-override voor debug proxy,
  blobdirectory of alleen-proxy-capture gegenereerd schema/codegen-doel.
  Doctor-/opstartmigratie importeert uitgebrachte `debug-proxy/capture.sqlite` rijen
  en gerefereerde payloadblobs, inclusief actieve legacy DB-/blob-omgeving
  overrides, en archiveert daarna die bronnen terwijl CA-certificaten intact blijven.

Deze fase verwijdert ook dubbele sidecar-openers, permissiehelpers, WAL-
setup, bestandssysteemopschoning en compatibiliteitsschrijvers uit die subsystemen.

### Fase 2: Introduceer per-agent databases

Maak één database per agent en registreer die vanuit de globale DB:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

De globale `agent_databases` rij bewaart het pad, de schemaversie, de last-seen
timestamp en basale grootte-/integriteitsmetadata. Runtime-code vraagt het register om
de agent-DB in plaats van bestandspaden direct af te leiden.

De agent-DB is eigenaar van:

- `sessions` als de canonieke sessieroot, met `session_entries` als de
  compatibiliteitsvormige payloadtabel die aan die root is gekoppeld, en
  `session_routes` als de unieke actieve `session_key`-lookup
- `conversations` en `session_conversations` als de genormaliseerde
  routeringsidentiteit van de provider die aan sessies is gekoppeld
- `transcript_events`
- transcript-snapshots en Compaction-checkpoints. Voltooid voor runtime-writes.
- `vfs_entries`
- `tool_artifacts` en run-artefacten
- agent-lokale runtime/cache-rijen. Voltooid voor worker-scoped caches.
- ACP-parentstream-events
- trajectory-runtime-events wanneer ze geen expliciete exportartefacten zijn

### Fase 3: Vervang Session Store-API’s

Voltooid voor runtime. Het bestandsvormige session store-oppervlak is geen actief
runtimecontract:

- Runtime roept `loadSessionStore(storePath)` niet meer aan en behandelt
  `storePath` niet meer als sessie-identiteit.
- Runtime-rijbewerkingen zijn `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry` en `listSessionEntries`.
- Helpers voor het herschrijven van de hele store, bestandswriters, wachtrijtests,
  alias-pruning en parameters voor legacy-key-verwijdering zijn uit runtime
  verdwenen.
- Verouderde compatibiliteitsexports van het root-package passen canonieke
  `sessions.json`-paden nog steeds aan naar de SQLite-rij-API’s.
- `sessions.json`-parsing blijft alleen in doctor-migratie/importcode en
  doctor-tests.
- Runtime-lifecycle-fallback leest SQLite-transcriptheaders, niet eerst
  JSONL-eerste regels.

Blijf alles verwijderen wat file-lock-parameters, terminologie voor
pruning/truncation-as-file-maintenance, store-path-identiteit of tests opnieuw
introduceert waarvan de enige assertie JSON-persistentie is.

### Fase 4: Verplaats transcripts, ACP-streams, trajectories en VFS

Maak elke agent-datastroom database-native:

- Transcript-append-writes lopen via één SQLite-transactie die de sessieheader
  waarborgt, idempotentie van berichten controleert, de parent-tail selecteert,
  invoegt in `transcript_events` en opvraagbare identiteitsmetadata vastlegt in
  `transcript_event_identities`. Voltooid voor directe transcriptbericht-appends
  en normale gepersisteerde `TranscriptSessionManager`-appends; expliciete
  branch-bewerkingen behouden hun expliciete parent-keuze en schrijven nog
  steeds SQLite-rijen zonder een bestandslocator af te leiden.
- ACP-parentstream-logs worden rijen, geen `.acp-stream.jsonl`-bestanden.
  Voltooid.
- ACP-spawn-setup persisteert geen transcript-JSONL-paden meer. Voltooid.
- Runtime-trajectory-capture schrijft event-rijen/artefacten direct. De
  expliciete support/export-opdracht kan nog steeds support-bundle-JSONL-
  artefacten produceren als exportformaat, maar sessie-export maakt geen
  sessie-JSONL opnieuw aan. Voltooid.
- Schijfwerkruimten blijven op schijf wanneer ze als schijfmodus zijn
  geconfigureerd.
- VFS-scratch en experimentele VFS-only-werkruimtemodus gebruiken de agent-DB.

De migratie importeert oude JSONL-bestanden één keer, legt aantallen/hashes vast
in `migration_runs` en verwijdert geïmporteerde bestanden na integriteitscontroles.

### Fase 5: Back-up, herstel, vacuum en verificatie

Back-ups blijven één archiefbestand:

- Checkpoint elke globale en agentdatabase.
- Snapshot elke DB met SQLite-back-upsemantiek of `VACUUM INTO`.
- Archiveer compacte DB-snapshots, configuratie, externe credentials en
  aangevraagde werkruimte-exports.
- Laat raw live `*.sqlite-wal`- en `*.sqlite-shm`-bestanden weg.
- Verifieer door elke DB-snapshot te openen en `PRAGMA integrity_check` uit te
  voeren. `openclaw backup create` doet deze archiefverificatie standaard;
  `--no-verify` slaat alleen de post-write-archiefpass over, niet de
  integriteitscontrole voor snapshot-creatie.
- Herstel kopieert snapshots terug naar hun doelpaden. Deze branch reset de
  niet-geshipte SQLite-layout naar `user_version = 1`; toekomstige geshipte
  schemawijzigingen kunnen expliciete migraties toevoegen wanneer die nodig zijn.

### Fase 6: Worker-runtime

Houd worker-modus experimenteel terwijl de databasesplitsing landt:

- Workers ontvangen agent-id, run-id, bestandssysteemmodus en DB-registry-
  identiteit.
- Elke worker opent zijn eigen SQLite-verbinding.
- Parent behoudt channel-delivery, goedkeuringen, configuratie en
  annuleringsautoriteit.
- Begin met één worker per actieve run; voeg pooling pas toe nadat lifecycle en
  eigenaarschap van DB-verbindingen stabiel zijn.

### Fase 7: Verwijder de oude wereld

Voltooid voor runtime-sessiebeheer. De oude wereld is alleen toegestaan als
expliciete doctor-input of support/export-output:

- Geen runtime-writes naar `sessions.json`, transcript-JSONL,
  sandbox-registry-JSON, task-sidecar-SQLite of plugin-state-sidecar-SQLite.
- Geen pruning van JSON/sessiebestanden, transcripttruncatie via bestanden,
  sessiebestandslocks of lock-vormige sessietests.
- Geen runtime-compatibiliteitsexports waarvan het doel is oude sessiebestanden
  actueel te houden.
- Expliciete support-exports blijven door de gebruiker aangevraagde
  archief-/materialisatieformaten en mogen bestandsnamen niet terugvoeren in
  runtime-identiteit.

## Back-up en herstel

Back-ups moeten één archiefbestand zijn, maar databasecapture moet
SQLite-native zijn:

1. Stop langdurige schrijfactiviteit of ga een korte back-upbarrière in.
2. Voer voor elke globale en agentdatabase een checkpoint uit.
3. Maak van elke database een snapshot met SQLite-back-upsemantiek of
   `VACUUM INTO` naar een tijdelijke back-upmap.
4. Archiveer de gecompacteerde databasesnapshots, het configuratiebestand, de
   credentials-directory, geselecteerde werkruimten en een manifest.
5. Verifieer het archief door elke opgenomen SQLite-snapshot te openen en
   `PRAGMA integrity_check` uit te voeren.
   `openclaw backup create` doet dit standaard; `--no-verify` is alleen bedoeld
   om bewust de post-write-archiefpass over te slaan.

Vertrouw niet op raw live kopieën van `*.sqlite`, `*.sqlite-wal` en
`*.sqlite-shm` als primair back-upformaat. Het archiefmanifest moet
databaserol, agent-id, schemaversie, bronpad, snapshotpad, bytegrootte en
integriteitsstatus vastleggen.

Herstel moet de globale database en agentdatabasebestanden opnieuw opbouwen uit
de archiefsnapshots. Omdat de SQLite-layout nog niet is geshipt, behoudt deze
refactor alleen het versie-1-schema plus doctor-import van bestand naar database.
De herstelopdracht valideert eerst het archief en vervangt daarna elk
manifestasset vanuit de geverifieerde uitgepakte payload.

## Runtime-refactorplan

1. Voeg database-registry-API’s toe.
   - Resolve globale DB- en per-agent-DB-paden.
   - Houd de niet-geshipte schema’s op `user_version = 1`; voeg geen
     schema-migratierunnercode toe totdat een geshipt schema die nodig heeft.
   - Voeg close/checkpoint/integrity-helpers toe die worden gebruikt door tests,
     back-up en doctor.

2. Vouw sidecar-SQLite-stores samen.
   - Verplaats Plugin-state-tabellen naar de globale database. Voltooid voor
     runtime-writes; de niet-geshipte legacy-sidecar-importer is verwijderd.
   - Verplaats task-registry-tabellen naar de globale database. Voltooid voor
     runtime-writes; de niet-geshipte legacy-sidecar-importer is verwijderd.
   - Verplaats Task Flow-tabellen naar de globale database. Voltooid voor
     runtime-writes; de niet-geshipte legacy-sidecar-importer is verwijderd.
   - Verplaats ingebouwde memory-search-tabellen naar elke agentdatabase.
     Voltooid; expliciete aangepaste `memorySearch.store.path` wordt nu
     verwijderd door doctor-configuratiemigratie. Volledige herindexering draait
     in place alleen tegen memory-tabellen; het oude whole-file-swappad en de
     sidecar-index-swaphelper zijn verwijderd.
   - Verwijder dubbele databaseopeners, WAL-setup, permissiehelpers en
     sluitpaden uit die subsystemen.

3. Verplaats agent-owned tabellen naar per-agent-databases.
   - Maak agent-DB on demand via de globale database-registry. Voltooid.
   - Verplaats runtime-sessie-items, transcript-events, VFS-rijen en
     toolartefacten naar agent-DB’s. Voltooid.
   - Migreer geen branch-lokale shared-DB-sessie-items, transcript-events,
     VFS-rijen of toolartefacten; die layout is nooit geshipt. Behoud alleen
     legacy-import van bestand naar database in doctor.

4. Vervang session store-API’s.
   - Verwijder `storePath` als runtime-identiteit. Voltooid voor runtime en
     bewaakt door `check:database-first-legacy-stores`: sessiemetadata,
     route-updates, command-persistentie, CLI-sessiecleanup,
     Feishu-reasoningpreviews, transcript-state-persistentie, subagent-diepte,
     authprofiel-sessieoverrides, parent-fork-logica en QA-lab-inspectie
     resolven de database nu vanuit canonieke agent-/sessiesleutels.
     Gateway/TUI/UI/macOS-sessielijstresponses exposen nu `databasePath` in
     plaats van legacy `path`; macOS-debugoppervlakken tonen de per-agent-
     database als read-only state in plaats van `session.store`-configuratie te
     schrijven.
     `/status`, chat-gedreven trajectory-export en CLI-dependency-proxy’s
     propageren geen legacy store-paden meer; fallback voor transcriptgebruik
     leest SQLite via agent-/sessie-identiteit. Runtime- en bridge-tests exposen
     `storePath` niet meer; doctor-/migratie-inputs bezitten die legacy-
     veldnaam.
     Gateway combined-session loading heeft geen speciale runtime-branch meer
     voor niet-getemplate `session.store`-waarden; het aggregeert per-agent
     SQLite-rijen.
     De legacy session-lock doctor-lane en de bijbehorende `.jsonl.lock`-
     cleanuphelper zijn verwijderd; SQLite is nu de sessieconcurrencygrens.
     Hot runtime-call sites gebruiken rijgerichte helpernamen zoals
     `resolveSessionRowEntry`; de oude compatibiliteitsalias
     `resolveSessionStoreEntry` is verwijderd uit runtime- en Plugin SDK-
     exports.

- Gebruik `{ agentId, sessionKey }`-rijbewerkingen.
  Voltooid: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry` en `listSessionEntries` zijn SQLite-first-API’s die geen
  session store-pad vereisen. Statussamenvatting, lokale agentstatus, health en
  de listingopdracht `openclaw sessions` lezen nu per-agent-rijen direct en
  tonen per-agent SQLite-databasepaden in plaats van `sessions.json`-paden.
- Vervang whole-store delete/insert door `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries` en SQL-cleanupqueries.
  Voltooid voor runtime: hot paths gebruiken nu rij-API’s en conflict-retried
  rijpatches; resterende whole-store import/replace-helpers zijn beperkt tot
  migratie-importcode en SQLite-backendtests.
  - Verwijder `store-writer.ts` en writer-queue-tests. Voltooid.
  - Verwijder runtime legacy-key-pruning en alias-delete-parameters uit sessie-
    rij-upserts/patches. Voltooid.

5. Verwijder runtime-JSON-registrygedrag.
   - Maak sandbox-registry-reads en -writes SQLite-only. Voltooid.
   - Importeer monolithische en gesharde JSON alleen vanuit de migratiestap.
     Voltooid.
   - Verwijder gesharde registry-locks en JSON-writes. Voltooid.

- Houd één getypeerde registrytabel in plaats van registry-rijen als generieke
  opaque JSON op te slaan als de vorm hot-path operationele state blijft.
  Voltooid.

6. Verwijder sessiemutatie in file-lock-vorm.
   - Voltooid voor runtime-lockcreatie en runtime-lock-API’s.
   - De standalone legacy `.jsonl.lock` doctor-cleanuplaan is verwijderd.
   - `session.writeLock` is door doctor gemigreerde legacy-configuratie, geen
     getypeerde runtime-instelling.
   - State-integriteit heeft geen apart orphan transcript-file-pruningpad meer;
     doctor-migratie importeert/verwijdert legacy JSONL-bronnen op één plaats.
   - Gateway-singletoncoördinatie gebruikt getypeerde SQLite `state_leases`-
     rijen onder `gateway_locks` en exposeert geen file-lock-directoryseam meer.
   - Generieke Plugin SDK-dedupe-persistentie gebruikt geen file-locks of
     JSON-bestanden meer; deze schrijft gedeelde SQLite plugin-state-rijen.
     Voltooid.
   - QMD-embedcoördinatie gebruikt een SQLite-state-lease in plaats van
     `qmd/embed.lock`. Voltooid.

7. Maak workers databasebewust.
   - Workers openen hun eigen SQLite-verbindingen.
   - Parent bezit delivery, channel-callbacks en configuratie.
   - Worker ontvangt agent-id, run-id, bestandssysteemmodus en DB-registry-
     identiteit, geen live handles.
   - `vfs-only` blijft experimenteel en gebruikt de agentdatabase als
     storageroot.
   - Houd eerst één worker per actieve run. Pooling kan wachten totdat de
     levensduur van DB-verbindingen en annuleringsgedrag saai zijn.

8. Back-upintegratie.
   - Leer back-up globale en agentdatabases vast te leggen via SQLite-back-up of
     `VACUUM INTO`. Gedaan voor ontdekte `*.sqlite`-bestanden onder de state-asset.
   - Voeg back-upverificatie toe voor SQLite-integriteit en schemaversie. Gedaan voor
     het maken van back-ups en standaardintegriteitscontroles bij archiefverificatie.
   - Leg metadata van back-upruns vast in SQLite. Gedaan via de gedeelde
     `backup_runs`-tabel met archiefpad, status en manifest-JSON.
   - Voeg herstel toe vanuit geverifieerde archiefsnapshots. Gedaan: `openclaw backup
restore` valideert vóór extractie, gebruikt het genormaliseerde manifest van de verifier,
     ondersteunt `--dry-run` en vereist `--yes` voordat vastgelegde bronpaden worden vervangen.
   - Neem VFS-/werkruimte-export alleen op wanneer daarom wordt gevraagd; exporteer sessie-
     internals niet als JSON of JSONL.

9. Verwijder verouderde tests en code. Gedaan voor de bekende runtimesessie-oppervlakken.

- Verwijder tests die runtime-aanmaak van `sessions.json` of transcript-
  JSONL-bestanden verifiëren. Gedaan voor core-sessieopslag, chat, Gateway-transcriptgebeurtenissen,
  preview, lifecycle, updates van commandosessie-items, auto-reply-reset/trace en
  memory-core dreaming-fixtures, routering van goedkeuringsdoelen, reparatie van sessietranscripten,
  reparatie van beveiligingsmachtigingen, trajectexport en sessie-export.
  Active-memory-transcripttests verifiëren nu SQLite-scopes en geen aanmaak van tijdelijke of
  persistente JSONL-bestanden.
  De oude Heartbeat-regressie voor transcript-snoeien is verwijderd omdat
  runtime JSONL-transcripten niet meer afkapt.
  Tests voor de agent-sessielijsttool modelleren legacy-`sessions.json`-paden niet meer
  als de Gateway-responsvorm; app-/UI-/macOS-tests gebruiken `databasePath`.
  `/status`-tests voor transcriptgebruik zaaien nu SQLite-transcriptrijen rechtstreeks
  in plaats van JSONL-bestanden te schrijven.
  Gateway-sessie-lifecycletests gebruiken nu rechtstreeks SQLite-helpers voor transcript-seeding;
  de oude fixturevorm met een eenregelig sessiebestand is verdwenen uit reset-
  en delete-dekking.
  `sessions.delete` retourneert geen file-era-veld `archived: []` meer; verwijdering
  rapporteert alleen het resultaat van de rijmutatie. De oude optie `deleteTranscript` is
  ook verdwenen: het verwijderen van een sessie verwijdert de canonieke `sessions`-root en laat
  SQLite sessie-eigen transcript-, snapshot- en trajectrijen cascade-verwijderen, zodat geen
  caller transcriptwezen kan achterlaten of een cleanup-branch kan vergeten.
  Context-engine-trajectcapturtests lezen nu `trajectory_runtime_events`-
  rijen uit een geïsoleerde agentdatabase in plaats van
  `session.trajectory.jsonl` te lezen.
  Docker MCP-channel seed-scripts zaaien nu SQLite-rijen rechtstreeks. Directe
  `sessions.json`-writes zijn beperkt tot doctor-fixtures.
  Tool Search Gateway E2E leest bewijs voor tool-calls uit SQLite-transcriptrijen
  in plaats van `agents/<agentId>/sessions/*.jsonl`-bestanden te scannen.
  Memory-core host-events en scratch-rijen voor session-corpus staan nu in gedeelde
  SQLite-plugin-state; `events.jsonl` en `session-corpus/*.txt` zijn alleen legacy-
  invoer voor doctormigratie. Actieve rijen gebruiken virtuele paden
  `memory/session-ingestion/`, niet `.dreams/session-corpus`. De oude memory-core dreaming-
  reparatiemodule en de CLI-/Gateway-tests daarvoor zijn verwijderd omdat runtime niet
  langer bestandsarchiefreparatie voor dat corpus bezit. Memory-core-
  bridge-/public-artifacttests tonen `.dreams/events.jsonl` niet meer; ze
  gebruiken de virtuele JSON-artifactnaam met SQLite-backend.
  Publieke SDK-/Codex-testdocumentatie spreekt nu over SQLite-sessiestatus in plaats van sessie-
  bestanden, en het channel-turn-voorbeeld toont geen `storePath`-argument meer.
  Matrix-syncstatus gebruikt nu rechtstreeks de SQLite-plugin-state-store. Actieve
  client-/runtimecontracten geven een accountopslagroot door, niet een pad `bot-storage.json`,
  en doctor importeert legacy-`bot-storage.json` in SQLite voordat de
  bron wordt verwijderd. QA Matrix restart/destructive-scenario's muteren nu de SQLite-sync-
  rij rechtstreeks in plaats van neppe `bot-storage.json`-bestanden te maken of verwijderen, en
  het E2EE-substraat geeft een sync-store-root door in plaats van een nep
  `sync-store.json`-pad.
  Matrix-selectie van storage-root scoort roots niet meer op legacy-sync-/thread-JSON-
  bestanden; het gebruikt duurzame rootmetadata plus echte cryptostatus.
  De runtime SQLite-sessiebbackend-testsuite fabriceert geen
  `sessions.json` meer; legacy-bronfixtures staan nu in de doctor-
  tests die ze importeren.
  Gateway-sessietests tonen geen helper `createSessionStoreDir` meer en
  geen ongebruikte setup voor tijdelijke session-store-paden; fixturemappen zijn expliciet, en directe
  rijsetup gebruikt SQLite-session-row-naamgeving.
  Doctor-only JSON5-parserdekking voor session-store is uit infratests verplaatst naar
  doctormigratietests, zodat runtime-testsuites niet langer eigenaar zijn van legacy
  session-file-parsing.
  Microsoft Teams runtime SSO-/pending-uploadtests dragen geen JSON-sidecar-
  fixtures of parsers meer; legacy SSO-tokenparsing leeft alleen in de Plugin-
  migratiemodule. Telegram-tests zaaien geen neppe `/tmp/*.json` store-
  paden meer; ze resetten de SQLite-backed message-cache rechtstreeks. De generieke
  OpenClaw test-state-helper toont geen legacy `auth-profiles.json`-
  writer meer; doctorauthmigratietests bezitten die fixture lokaal.
  Runtimetests voor TUI last-session-pointers, exec-goedkeuringen, active-memory-
  toggles, Matrix-dedupe/startup-verificatie, Memory Wiki-bronsync,
  current-conversation-bindings, onboarding-auth en Hermes-secretimports maken
  niet langer oude sidecar-bestanden aan en verifiëren niet meer dat oude bestandsnamen afwezig zijn. Ze
  bewijzen gedrag via SQLite-rijen en publieke store-API's; doctor-/migratie-
  tests zijn de enige plek waar legacy-bronbestandsnamen thuishoren.
  Runtimetests voor device/node-pairing, channel allowFrom, restart intents,
  restart handoff, session delivery queue entries, config health, iMessage-
  caches, cronjobs, PI-transcriptheaders, subagentregistries en beheerde
  afbeeldingsbijlagen maken ook geen gepensioneerde JSON-/JSONL-bestanden meer alleen om te bewijzen
  dat ze worden genegeerd of afwezig zijn.
  PI overflow-herstel heeft niet langer een SessionManager-rewrite-/truncation-
  fallback: tool-result-truncation en context-engine-transcript-rewrites muteren
  SQLite-transcriptrijen en verversen daarna actieve promptstatus vanuit de database.
  Persistente SessionManager-message-appends delegeren naar de atomaire SQLite-
  transcript-append-helper voor ouderselectie en idempotentie. Normale
  metadata-/custom-entry-appends selecteren ook de huidige ouder binnen SQLite, zodat
  verouderde managerinstanties geen parent-chain-races van vóór SQLite doen herleven.
  Synthetische PI-tail-cleanup voor mid-turn prechecks en `sessions_yield` trimt nu
  rechtstreeks SQLite-transcriptstatus; de oude SessionManager tail-removal-
  bridge en de tests daarvoor zijn verwijderd.
  Compaction-checkpointcapture maakt ook alleen snapshots vanuit SQLite; callers geven niet
  langer een live SessionManager door als alternatieve transcriptbron.
- Behoud tests die legacybestanden zaaien alleen voor migratie.
- JSON-bestandsbewijs is vervangen door SQL-rijbewijs voor actieve runtime-
  oppervlakken.

- Voeg statische verboden toe voor runtime-writes naar legacy JSON-paden voor sessies/cache.
  Gedaan voor de repo-guard.

10. Maak het migratierapport auditeerbaar.
    - Leg migratieruns vast in SQLite met start-/eindtijdstempels, bron-
      paden, bronhashes, aantallen, waarschuwingen en back-uppad.
      Gedaan: legacy-state-migratie-uitvoeringen persisteren nu een `migration_runs`-
      rapport met inventaris van bronpaden/-tabellen, SHA-256 van bronbestanden, groottes,
      recordaantallen, waarschuwingen en back-uppad.
      Gedaan: legacy-state-migratie-uitvoeringen persisteren ook `migration_sources`-
      rijen voor audit op bronniveau en toekomstige beslissingen over overslaan/backfill.
    - Maak apply idempotent. Opnieuw uitvoeren na een gedeeltelijke import moet ofwel
      een al geïmporteerde bron overslaan of samenvoegen op basis van een stabiele sleutel.
      Gedaan: sessie-indexen, transcripten, delivery queues, Plugin-state, taak-
      ledgers en agent-owned globale SQLite-rijen importeren via stabiele sleutels of
      upsert-/replace-semantiek, zodat herhaalde runs samenvoegen zonder duurzame
      rijen te dupliceren.
    - Mislukte imports moeten het oorspronkelijke bronbestand laten staan.
      Gedaan: mislukte transcriptimports laten nu de oorspronkelijke JSONL-bron op
      het gedetecteerde pad staan, en `migration_sources` registreert de bron als
      `warning` met `removed_source=0` voor de volgende doctor-run.

## Prestatieregels

- Eén verbinding per thread/proces is prima; deel handles niet tussen
  workers.
- Gebruik WAL, `foreign_keys=ON`, een busy-timeout van 30s en korte `BEGIN IMMEDIATE`-
  schrijftransacties.
- Houd helpers voor schrijftransacties synchroon tenzij/totdat een async transactie-
  API expliciete mutex-/backpressure-semantiek toevoegt.
- Houd parent-delivery-writes klein en transactioneel.
- Vermijd herschrijvingen van de hele store; gebruik upsert/delete op rijniveau.
- Voeg indexen toe voor list-by-agent, list-by-session, updated-at, run id en
  expiration-paden voordat hot code wordt verplaatst.
- Sla grote artifacts, media en vectoren op als BLOB's of chunked BLOB-rijen, niet
  als base64 of numeric-array JSON.
- Houd opaque Plugin-state entries klein en gescoped.
- Voeg SQL-cleanup toe voor TTL/expiration in plaats van filesystem pruning.
  Gedaan voor database-owned runtime-stores: media, Plugin-state, Plugin-blobs,
  persistent dedupe en agent-cache verlopen allemaal via SQLite-rijen. Resterende
  filesystem-cleanup is beperkt tot tijdelijke materialisaties of expliciete
  verwijderopdrachten.

## Statische verboden

Voeg een repo-check toe die nieuwe runtime-writes naar legacy state-paden laat falen:

- `sessions.json`
- `*.trajectory.jsonl` behalve gematerialiseerde uitvoer van ondersteuningsbundels
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` runtimecachebestanden
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
- JSON-bestanden voor native hook relay `/tmp`-bruggen
- `plugin-state/state.sqlite`
- ad-hoc `openclaw-state.sqlite` runtimebijbestanden
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
- `SessionManager.open(...)` sessieopeners op basis van bestanden
- `SessionManager.listAll(...)` en `TranscriptSessionManager.listAll(...)`
  facades voor transcriptvermeldingen
- `SessionManager.forkFromSession(...)` en
  `TranscriptSessionManager.forkFromSession(...)` facades voor transcriptforks
- `SessionManager.newSession(...)` en `TranscriptSessionManager.newSession(...)`
  facades voor vervanging van muteerbare sessies
- `SessionManager.createBranchedSession(...)` en
  `TranscriptSessionManager.createBranchedSession(...)` facades voor vertakte sessies

Het verbod moet toestaan dat tests verouderde fixtures maken en dat migratiecode
verouderde bestandsbronnen leest/importeert/verwijdert. Niet-uitgebrachte
SQLite-bijbestanden blijven verboden en krijgen geen importtoestemmingen voor
doctor.

## Voltooiingscriteria

- Runtimegegevens en cache-schrijfacties gaan naar de globale SQLite-database of de SQLite-database van de agent.
- De runtime schrijft geen sessie-indexen, transcript-JSONL, sandbox-register-
  JSON, taakbijbestand-SQLite of Plugin-state-bijbestand-SQLite meer. De niet-uitgebrachte importeurs voor taak-
  en Plugin-state-bijbestand-SQLite zijn verwijderd.
- Import van verouderde bestanden gebeurt alleen via doctor.
- Back-up produceert één archief met compacte SQLite-snapshots en integriteitsbewijs.
- Agentwerkers kunnen draaien met schijf, VFS-scratch of experimentele opslag
  met alleen VFS.
- Configuratie en expliciete referentiebestanden blijven de enige verwachte persistente
  niet-databasebesturingsbestanden.
- Repocontroles voorkomen dat verouderde runtimebestandsopslag opnieuw wordt ingevoerd.
