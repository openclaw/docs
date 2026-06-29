---
read_when:
    - OpenClaw रनटाइम डेटा, कैश, ट्रांसक्रिप्ट, कार्य स्थिति या स्क्रैच फ़ाइलों को SQLite में ले जाना
    - पुरानी JSON या JSONL फ़ाइलों से doctor migrations डिज़ाइन करना
    - बैकअप, पुनर्स्थापना, VFS, या worker storage व्यवहार बदलना
    - सेशन लॉक हटाना, छंटाई, ट्रंकेशन, या JSON संगतता पाथ
summary: SQLite को प्राथमिक टिकाऊ स्टेट और कैश लेयर बनाने की माइग्रेशन योजना, जबकि कॉन्फ़िग को फ़ाइल-समर्थित बनाए रखा जाए
title: डेटाबेस-प्रथम स्थिति रिफैक्टर
x-i18n:
    generated_at: "2026-06-29T00:05:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54995a9f43f740e7cc3ac3e0a4b69d73ddba6b2c30731193ab7ce3aa1dfc9d94
    source_path: refactor/database-first.md
    workflow: 16
---

# डेटाबेस-प्रथम स्टेट रिफैक्टर

## निर्णय

दो-स्तरीय SQLite लेआउट का उपयोग करें:

- वैश्विक डेटाबेस: `~/.openclaw/state/openclaw.sqlite`
- एजेंट डेटाबेस: एजेंट-स्वामित्व वाले वर्कस्पेस,
  ट्रांसक्रिप्ट, VFS, आर्टिफैक्ट, और बड़े प्रति-एजेंट रनटाइम स्टेट के लिए प्रति एजेंट एक SQLite डेटाबेस
- कॉन्फ़िगरेशन फ़ाइल-समर्थित रहता है: `openclaw.json`
  डेटाबेस से बाहर रहता है। रनटाइम auth प्रोफ़ाइल SQLite में जाती हैं; बाहरी प्रदाता या CLI
  क्रेडेंशियल फ़ाइलें OpenClaw के डेटाबेस से बाहर, स्वामी-प्रबंधित रहती हैं।

वैश्विक डेटाबेस नियंत्रण-प्लेन डेटाबेस है। यह एजेंट डिस्कवरी,
साझा Gateway स्टेट, पेयरिंग, डिवाइस/नोड स्टेट, टास्क और फ्लो लेजर, Plugin
स्टेट, शेड्यूलर रनटाइम स्टेट, बैकअप मेटाडेटा, और माइग्रेशन स्टेट का स्वामी है।

एजेंट डेटाबेस डेटा-प्लेन डेटाबेस है। यह एजेंट के सत्र
मेटाडेटा, ट्रांसक्रिप्ट इवेंट स्ट्रीम, VFS वर्कस्पेस या स्क्रैच नेमस्पेस, टूल
आर्टिफैक्ट, रन आर्टिफैक्ट, और खोजने/इंडेक्स करने योग्य एजेंट-स्थानीय कैश डेटा का स्वामी है।

इससे एक टिकाऊ वैश्विक दृश्य मिलता है, बिना बड़े एजेंट वर्कस्पेस,
ट्रांसक्रिप्ट, और बाइनरी स्क्रैच डेटा को साझा Gateway राइट लेन में धकेले।

## कठोर अनुबंध

इस माइग्रेशन का एक ही कैननिकल रनटाइम आकार है:

- सत्र पंक्तियां केवल सत्र मेटाडेटा को स्थायी रखें। उन्हें
  `transcriptLocator`, ट्रांसक्रिप्ट फ़ाइल पाथ, sibling JSONL पाथ, लॉक पाथ,
  pruning मेटाडेटा, या फ़ाइल-युग संगतता पॉइंटर स्थायी नहीं रखने चाहिए।
- ट्रांसक्रिप्ट पहचान हमेशा SQLite पहचान है: `{agentId, sessionId}` और
  जहां प्रोटोकॉल को आवश्यकता हो वहां वैकल्पिक topic मेटाडेटा।
- `sqlite-transcript://...` रनटाइम या प्रोटोकॉल पहचान नहीं है। नए कोड को
  ट्रांसक्रिप्ट लोकेटर derive, persist, pass, parse, या migrate नहीं करने चाहिए। रनटाइम और
  टेस्ट में pseudo-locator बिल्कुल नहीं होने चाहिए; docs इस स्ट्रिंग का उल्लेख
  केवल इसे प्रतिबंधित करने के लिए कर सकते हैं।
- Legacy `sessions.json`, ट्रांसक्रिप्ट JSONL, `.jsonl.lock`, pruning, truncation,
  और पुराना session-path लॉजिक केवल doctor migration/import पाथ में ही आते हैं।
- Legacy session config aliases केवल doctor migration में आते हैं। रनटाइम
  `session.idleMinutes`, `session.resetByType.dm`, या
  किसी दूसरे configured agent के लिए cross-agent `agent:main:*` main-session aliases की व्याख्या नहीं करता।
- Session routing identity typed relational state है। Hot runtime और UI paths को
  `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations`, और
  `session_conversations` पढ़ने चाहिए; उन्हें provider identity के लिए
  `session_key` parse नहीं करना चाहिए या `session_entries.entry_json` mine
  नहीं करना चाहिए, सिवाय compatibility shadow के जब पुराने call sites हटाए जा रहे हों।
- Channel-level direct-message markers जैसे `dm` बनाम `direct` routing
  vocabulary हैं, transcript locators या file-store compatibility handles नहीं।
- Legacy hook handler config केवल doctor warning/migration surfaces में आता है।
  रनटाइम को `hooks.internal.handlers` लोड नहीं करना चाहिए; hooks केवल discovered
  hook directories और `HOOK.md` metadata के जरिए चलते हैं।
- Runtime startup, hot reply paths, compaction, reset, recovery, diagnostics,
  TTS, memory hooks, subagents, Plugin command routing, protocol boundaries, और
  hooks को रनटाइम में `{agentId, sessionId}` pass करना होगा।
- टेस्ट को `{agentId, sessionId}` के जरिए SQLite transcript rows seed और assert करनी चाहिए।
  जो टेस्ट केवल JSONL path forwarding,
  caller-supplied locator preservation, या transcript-file compatibility साबित करते हैं, उन्हें
  हटाया जाना चाहिए, जब तक वे doctor import, non-session support/debug
  materialization, या protocol shape को cover न करते हों।
- `runEmbeddedPiAgent(...)`, prepared worker runs, और inner embedded
  attempt को transcript locators स्वीकार नहीं करने चाहिए। वे `{agentId, sessionId}` से SQLite transcript
  manager खोलते हैं और उस manager को internalized
  PI-compatible agent session को pass करते हैं, ताकि stale callers runner से
  JSON/JSONL transcripts न लिखवा सकें।
- Runner diagnostics को runtime/cache/payload trace records SQLite में store करने चाहिए।
  Runtime diagnostics को JSONL file override knobs या generic
  transcript JSONL export helpers expose नहीं करने चाहिए; user-facing exports database rows से explicit
  artifacts materialize कर सकते हैं, बिना file names को runtime में वापस feed किए।
- Raw stream logging `OPENCLAW_RAW_STREAM=1` और SQLite diagnostics rows का उपयोग करती है।
  पुराना pi-mono `PI_RAW_STREAM`, `PI_RAW_STREAM_PATH`, और
  `raw-openai-completions.jsonl` file logger contract OpenClaw
  runtime या tests का हिस्सा नहीं है।
- QMD memory indexing को SQLite transcripts को markdown files में export नहीं करना चाहिए।
  QMD केवल configured memory files को index करता है; session transcript search
  SQLite-backed रहती है।
- नए code के लिए QMD SDK subpath केवल QMD-only है। SQLite session transcript
  indexing helpers `memory-core-host-engine-session-transcripts` पर रहते हैं; कोई भी
  QMD re-export केवल compatibility है और runtime code द्वारा उपयोग नहीं किया जाना चाहिए।
- Built-in memory indexes owning agent database में रहते हैं। Runtime config और
  resolved runtime contracts को `memorySearch.store.path` expose नहीं करना चाहिए; doctor
  उस legacy config key को delete करता है और current code agent
  `databasePath` को internally pass करता है।

Implementation work को code delete करते रहना चाहिए जब तक ये statements
doctor/import/export/debug boundaries के बाहर बिना exceptions true न हो जाएं।

## लक्ष्य स्थिति और प्रगति

### कठोर लक्ष्य

- एक global SQLite database control-plane state का स्वामी है:
  `state/openclaw.sqlite`.
- एक per-agent SQLite database data-plane state का स्वामी है:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Config file-backed रहता है। `openclaw.json` इस database
  refactor का हिस्सा नहीं है।
- Legacy files केवल doctor migration inputs हैं।
- Runtime active state के रूप में session या transcript JSONL कभी write या read नहीं करता।

### लक्ष्य स्थितियां

- `not-started`: file-era runtime code अभी भी active state लिखता है।
- `migrating`: doctor/import code file data को SQLite में move कर सकता है।
- `dual-read`: temporary bridge SQLite और legacy files दोनों पढ़ता है। इस refactor के लिए यह state
  forbidden है, जब तक इसे explicitly
  doctor-only के रूप में documented न किया गया हो।
- `sqlite-runtime`: runtime केवल SQLite पढ़ता और लिखता है।
- `clean`: legacy runtime APIs और tests हटाए गए हैं, और guard
  regressions रोकता है।
- `done`: docs, tests, backup, doctor migration, और changed checks
  clean state साबित करते हैं।

### वर्तमान स्थिति

- Sessions: runtime के लिए `clean`। Session rows per-agent database में रहती हैं,
  runtime APIs `{agentId, sessionId}` या `{agentId, sessionKey}` का उपयोग करते हैं, और
  `sessions.json` केवल doctor-only legacy input है।
- Transcripts: runtime के लिए `clean`। Transcript events, identities, snapshots,
  और trajectory runtime events per-agent database में रहते हैं। Runtime अब
  transcript locators या JSONL transcript paths स्वीकार नहीं करता।
- PI embedded runner: `clean`। Embedded PI runs, prepared workers, compaction,
  और retry loops SQLite session scope का उपयोग करते हैं और stale transcript handles reject करते हैं।
- Cron: runtime के लिए `clean`। Runtime `cron_jobs` और `cron_run_logs` का उपयोग करता है;
  runtime tests SQLite `storeKey` naming का उपयोग करते हैं, और file-era cron paths केवल
  doctor legacy migration tests में रहते हैं।
- Task registry: `clean`। Task और Task Flow runtime rows
  `state/openclaw.sqlite` में रहते हैं; unshipped sidecar SQLite importers delete कर दिए गए हैं।
- Plugin state: `clean`। Plugin state/blob rows shared global
  database में रहते हैं; पुराने plugin-state sidecar SQLite helpers guard किए गए हैं।
- Memory: built-in memory और session transcript indexing के लिए `sqlite-runtime`।
  Memory index tables per-agent database में रहते हैं, plugin memory state
  shared plugin-state rows का उपयोग करता है, और legacy memory files doctor migration inputs
  या user workspace content हैं।
- Backup: `sqlite-runtime`। Backup stages SQLite snapshots compact करते हैं, live
  WAL/SHM sidecars omit करते हैं, SQLite integrity verify करते हैं, और backup runs को
  global database में record करते हैं।
- Doctor migration: `migrating`, जानबूझकर। Doctor legacy JSON,
  JSONL, और retired sidecar stores को SQLite में import करता है, migration runs/sources record करता है,
  और successful sources remove करता है।
- E2E scripts: runtime coverage के लिए `clean`। Docker MCP seeding SQLite
  rows लिखती है। runtime-context Docker script legacy JSONL केवल
  doctor migration seed के अंदर create करती है और legacy session index path को explicitly name करती है।

### शेष कार्य

- [x] Cron runtime-test store variables को `storePath` से दूर rename करें, जब तक
      वे doctor legacy inputs न हों।
      Files: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Proof: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] अप्रचलित file-era export test mocks हटाएं या rename करें।
      File: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Proof: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Docker runtime-context legacy JSONL seed को स्पष्ट रूप से doctor-only बनाएं।
      File: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Proof: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` केवल
      `seedBrokenLegacySessionForDoctorMigration` दिखाता है।
- [x] किसी भी schema change के बाद Kysely generated types को aligned रखें।
      Files: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Proof: इस pass में कोई schema change नहीं; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] touched stores, commands, और scripts के लिए focused tests फिर से run करें।
      Proof: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] `done` घोषित करने से पहले, changed gate या remote broad proof run करें।
      Proof: `pnpm check:changed --timed -- <changed extension paths>` passed on
      Hetzner Crabbox run `run_3f1cabf6b25c` after temporary Node 24/pnpm setup and
      explicit path routing for the synced no-`.git` workspace.

### Regression न करें

- कोई transcript locators नहीं।
- कोई active session files नहीं।
- doctor legacy migration tests को छोड़कर कोई fake JSONL test fixtures नहीं।
- जहां Kysely expected है वहां कोई raw SQLite access नहीं।
- कोई नए legacy DB migrations नहीं। यह layout shipped नहीं हुआ है; schema version
  `1` पर रखें जब तक कोई strong reason न हो।

## कोड-पठन अनुमानों

कोई follow-up product decisions इस plan को block नहीं कर रहे। Implementation को
इन assumptions के साथ आगे बढ़ना चाहिए:

- इस स्टोरेज पथ के लिए सीधे `node:sqlite` का उपयोग करें और Node 22+ runtime आवश्यक रखें।
- ठीक एक सामान्य कॉन्फ़िगरेशन फ़ाइल रखें। इस refactor में config, plugin
  manifests, या Git workspaces को SQLite में न ले जाएँ।
- Runtime compatibility फ़ाइलों की आवश्यकता नहीं है। Legacy JSON और JSONL फ़ाइलें
  केवल migration inputs हैं। Branch-local SQLite sidecars कभी shipped नहीं हुए और
  import करने के बजाय delete किए जाते हैं।
- `openclaw doctor --fix` legacy file-to-database migration step का स्वामी है।
  Runtime startup और `openclaw migrate` को legacy OpenClaw
  database-upgrade paths नहीं रखने चाहिए।
- Credential compatibility भी इसी नियम का पालन करती है: runtime credentials
  SQLite में रहते हैं। पुराने `auth-profiles.json`, per-agent `auth.json`, और shared
  `credentials/oauth.json` फ़ाइलें doctor migration inputs हैं, फिर import के बाद
  हटा दी जाती हैं।
- Generated model catalog state database-backed है। Runtime code को
  `agents/<agentId>/agent/models.json` नहीं लिखना चाहिए; मौजूदा `models.json`
  फ़ाइलें legacy doctor inputs हैं और `agent_model_catalogs` में import के बाद हटा दी जाती हैं।
- Runtime को transcript locators migrate, normalize, या bridge नहीं करने चाहिए। Active
  transcript identity SQLite में `{agentId, sessionId}` है। File paths केवल
  legacy doctor inputs हैं, और `sqlite-transcript://...` को boundary handle की तरह
  treat करने के बजाय runtime, protocol, hook, और plugin surfaces से हट जाना चाहिए।
- Runtime SQLite transcript reads पुरानी JSONL entry-shape migrations नहीं चलाते या
  compatibility के लिए whole transcripts rewrite नहीं करते। Legacy entry normalization
  explicit doctor/import utilities में रहती है। Doctor legacy JSONL transcript
  फ़ाइलों को SQLite rows insert करने से पहले normalize करता है; current runtime rows
  पहले से current transcript schema में लिखी जाती हैं। Trajectory/session export
  उन rows को as-is पढ़ता है और export-time legacy migrations नहीं करनी चाहिए।
- Legacy transcript JSONL parse/migration helpers केवल doctor-only हैं। Runtime
  transcript format code केवल current SQLite transcript context बनाता है; doctor
  rows insert करने से पहले old JSONL entry upgrades का स्वामी है।
- पुराना runtime-owned JSONL transcript streaming helper delete कर दिया गया था। Doctor
  import code explicit legacy file reads का स्वामी है; runtime session history
  SQLite rows पढ़ती है।
- Codex app-server bindings Codex plugin-state namespace में OpenClaw `sessionId` को canonical
  key के रूप में उपयोग करते हैं। `sessionKey` routing/display के लिए metadata है
  और durable session id को replace नहीं करना चाहिए या transcript-file identity को resurrect
  नहीं करना चाहिए।
- Context engines को current runtime contract सीधे मिलता है। Registry को
  ऐसे retry shims से engines wrap नहीं करने चाहिए जो `sessionKey`,
  `transcriptScope`, या `prompt` delete करते हैं; जो engines current
  database-first params accept नहीं कर सकते, उन्हें bridge किए जाने के बजाय loudly fail करना चाहिए।
- Backup output एक archive file ही रहना चाहिए। Database contents उस archive में
  compact SQLite snapshots के रूप में जाने चाहिए, raw live WAL sidecars के रूप में नहीं।
- Transcript search उपयोगी है लेकिन पहले database-first
  cut के लिए आवश्यक नहीं है। Schema ऐसा design करें कि FTS बाद में जोड़ा जा सके।
- Worker execution को database boundary settle होने तक settings के पीछे experimental रहना चाहिए।

## Code-Read Findings

Current branch proof-of-concept stage से आगे निकल चुकी है। Shared
database मौजूद है, Node `node:sqlite` एक छोटे runtime helper के माध्यम से wired है, और
पूर्व stores अब `state/openclaw.sqlite` या owning
`openclaw-agent.sqlite` database में लिखते हैं।

बाकी काम SQLite चुनना नहीं है; यह new boundary को clean रखना
और किसी भी compatibility-shaped interfaces को delete करना है जो अभी भी पुराने
file world जैसे दिखते हैं:

- Session `storePath` अब runtime identity, test fixture shape, या
  status payload field नहीं है। Runtime और bridge tests में अब
  `storePath` contract name नहीं है; doctor/migration code उस legacy vocabulary का स्वामी है।
- Session writes अब पुराने in-process `store-writer.ts`
  queue से होकर नहीं गुजरतीं। SQLite patch writes इसके बजाय conflict detection और bounded retry use करती हैं।
- Legacy path discovery के अब भी valid migration uses हैं, लेकिन runtime code को
  `sessions.json` और transcript JSONL files को possible write
  targets की तरह treat करना बंद करना चाहिए।
- Agent-owned tables per-agent SQLite databases में रहती हैं। Global DB
  registry/control-plane rows रखता है; transcript identity per-agent transcript rows में `{agentId, sessionId}` है।
  Runtime code को transcript file paths persist नहीं करने चाहिए या transcript locators migrate नहीं करने चाहिए।
- Doctor पहले से कई legacy files import करता है। Cleanup यह है कि इसे एक
  single explicit migration implementation बनाया जाए जिसे doctor call करे, durable
  migration report के साथ।

कोई additional product questions implementation को block नहीं कर रहे हैं।

## Current Code Shape

Branch में पहले से एक real shared SQLite base है:

- रनटाइम फ्लोर अब Node 22+ है: `package.json`, CLI रनटाइम गार्ड,
  इंस्टॉलर डिफॉल्ट, macOS रनटाइम लोकेटर, CI, और सार्वजनिक इंस्टॉल दस्तावेज़ सभी
  सहमत हैं। पुरानी Node 22 संगतता लेन हटा दी गई है।
- `src/state/openclaw-state-db.ts` `openclaw.sqlite` खोलता है, WAL सेट करता है,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, और
  `src/state/openclaw-state-schema.sql` से व्युत्पन्न जनरेटेड स्कीमा मॉड्यूल
  लागू करता है।
- Kysely टेबल प्रकार और रनटाइम स्कीमा मॉड्यूल प्रतिबद्ध `.sql` फ़ाइलों से बनाए गए डिस्पोजेबल
  SQLite डेटाबेस से जनरेट किए जाते हैं; रनटाइम कोड अब ग्लोबल, प्रति-एजेंट, या प्रॉक्सी
  कैप्चर डेटाबेस के लिए कॉपी-पेस्ट किए गए स्कीमा स्ट्रिंग नहीं रखता।
- रनटाइम स्टोर हाथ से SQLite पंक्ति आकारों की छाया बनाने के बजाय उन जनरेटेड
  Kysely `DB` इंटरफ़ेस से चुने गए और सम्मिलित पंक्ति प्रकार व्युत्पन्न करते हैं। Raw SQL
  स्कीमा लागू करने, प्रैग्मा, और केवल-माइग्रेशन DDL तक सीमित रहता है।
- SQLite स्कीमा `user_version = 1` पर समेटे गए हैं क्योंकि यह डेटाबेस
  लेआउट अभी शिप नहीं हुआ है। रनटाइम ओपनर केवल वर्तमान स्कीमा बनाते हैं;
  फ़ाइल-से-डेटाबेस इम्पोर्ट डॉक्टर कोड में रहता है, और ब्रांच-लोकल
  डेटाबेस अपग्रेड हेल्पर हटा दिए गए हैं।
- जहाँ स्वामित्व सीमा कैनॉनिकल है वहाँ रिलेशनल स्वामित्व लागू किया जाता है:
  सोर्स माइग्रेशन पंक्तियाँ `migration_runs` से कैस्केड होती हैं, टास्क डिलीवरी स्थिति
  `task_runs` से कैस्केड होती है, और ट्रांसक्रिप्ट पहचान पंक्तियाँ
  ट्रांसक्रिप्ट इवेंट से कैस्केड होती हैं।
- वर्तमान साझा टेबल में `agent_databases`,
  `auth_profile_stores`, `auth_profile_state`,
  `plugin_state_entries`, `plugin_blob_entries`, `media_blobs`,
  `skill_uploads`, `capture_sessions`, `capture_events`, `capture_blobs`,
  `sandbox_registry_entries`, `cron_run_logs`, `cron_jobs`, `commitments`,
  `delivery_queue_entries`, `model_capability_cache`,
  `workspace_setup_state`, `native_hook_relay_bridges`,
  `current_conversation_bindings`, `plugin_binding_approvals`,
  `tui_last_sessions`, `acp_sessions`, `acp_replay_sessions`,
  `acp_replay_events`, `task_runs`, `task_delivery_state`, `flow_runs`,
  `subagent_runs`, `migration_runs`, और `backup_runs` शामिल हैं।
- मनमानी Plugin-स्वामित्व वाली स्थिति को होस्ट-स्वामित्व वाली टाइप्ड टेबल नहीं मिलतीं। इंस्टॉल किए गए
  plugins संस्करणित JSON पेलोड के लिए `plugin_state_entries` और
  बाइट्स के लिए `plugin_blob_entries` का उपयोग करते हैं, जिसमें नेमस्पेस/की स्वामित्व, TTL क्लीनअप,
  बैकअप, और Plugin माइग्रेशन रिकॉर्ड होते हैं। होस्ट-स्वामित्व वाली Plugin ऑर्केस्ट्रेशन स्थिति में
  तब भी टाइप्ड टेबल हो सकती हैं जब होस्ट क्वेरी कॉन्ट्रैक्ट का मालिक हो, जैसे
  `plugin_binding_approvals`।
- Plugin माइग्रेशन Plugin-स्वामित्व वाले नेमस्पेस पर डेटा माइग्रेशन हैं, होस्ट
  स्कीमा माइग्रेशन नहीं। कोई Plugin अपने संस्करणित स्टेट/ब्लॉब एंट्री को
  माइग्रेशन प्रोवाइडर के माध्यम से माइग्रेट कर सकता है, और होस्ट सामान्य
  माइग्रेशन लेजर में सोर्स/रन स्थिति रिकॉर्ड करता है। नए Plugin इंस्टॉल के लिए
  `openclaw-state-schema.sql` बदलने की आवश्यकता नहीं होती जब तक होस्ट स्वयं
  किसी नए क्रॉस-Plugin कॉन्ट्रैक्ट का स्वामित्व नहीं ले रहा हो।
- `src/state/openclaw-agent-db.ts`
  `agents/<agentId>/agent/openclaw-agent.sqlite` खोलता है, डेटाबेस को
  ग्लोबल DB में रजिस्टर करता है, और एजेंट-लोकल सेशन, ट्रांसक्रिप्ट, VFS, आर्टिफैक्ट, कैश,
  और मेमोरी-इंडेक्स टेबल का मालिक है। साझा रनटाइम डिस्कवरी अब हर कॉल
  साइट पर उस क्वेरी को दोबारा लागू करने के बजाय जनरेटेड-टाइप्ड
  `agent_databases` रजिस्ट्री पढ़ती है।
- ग्लोबल और प्रति-एजेंट डेटाबेस डेटाबेस भूमिका,
  स्कीमा संस्करण, टाइमस्टैम्प, और एजेंट डेटाबेस के लिए एजेंट id के साथ `schema_meta` पंक्ति रिकॉर्ड करते हैं। लेआउट अभी भी
  `user_version = 1` पर रहता है क्योंकि यह SQLite स्कीमा अभी शिप नहीं हुआ है।
- प्रति-एजेंट सेशन पहचान में अब `session_id` से की की गई कैनॉनिकल `sessions` रूट टेबल है,
  जिसमें `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, टाइमस्टैम्प, डिस्प्ले फ़ील्ड, मॉडल मेटाडेटा,
  हार्नेस id, और पैरेंट/स्पॉन लिंकज क्वेरी योग्य कॉलम के रूप में हैं। `session_routes`
  `session_key` से वर्तमान `session_id` तक का अद्वितीय सक्रिय रूट इंडेक्स
  है, इसलिए कोई रूट की ताज़े टिकाऊ सेशन में जा सकती है बिना हॉट रीड्स को
  डुप्लिकेट `sessions.session_key` पंक्तियों के बीच चुनने पर मजबूर किए। पुराना
  `session_entries.entry_json` संगतता-आकार का पेलोड टिकाऊ
  `session_id` रूट से फ़ॉरेन की द्वारा जुड़ा है; अब यह सेशन का एकमात्र
  स्कीमा-स्तरीय निरूपण नहीं है।
- प्रति-एजेंट बाहरी बातचीत पहचान भी रिलेशनल है:
  `conversations` सामान्यीकृत प्रोवाइडर/अकाउंट/बातचीत पहचान स्टोर करता है, और
  `session_conversations` एक OpenClaw सेशन को एक या अधिक बाहरी
  बातचीत से जोड़ता है। यह साझा-मुख्य DM सेशन को कवर करता है जहाँ कई पीयर
  जानबूझकर एक सेशन पर मैप हो सकते हैं बिना `session_key` में गलत प्रस्तुति किए। SQLite
  प्राकृतिक प्रोवाइडर पहचान के लिए विशिष्टता भी लागू करता है ताकि वही
  चैनल/अकाउंट/काइंड/पीयर/थ्रेड टपल बातचीत ids में विभाजित न हो सके।
  साझा-मुख्य डायरेक्ट पीयर `participant` भूमिका से लिंक किए जाते हैं, ताकि एक
  OpenClaw सेशन कई बाहरी DM पीयर का प्रतिनिधित्व कर सके बिना पुराने
  पीयर को अस्पष्ट संबंधित पंक्तियों में घटाए। `sessions.primary_conversation_id` अभी भी
  वर्तमान टाइप्ड डिलीवरी लक्ष्य की ओर इशारा करता है। बंद रूटिंग/स्थिति कॉलम
  केवल TypeScript यूनियन पर निर्भर रहने के बजाय SQLite `CHECK` constraints से लागू होते हैं।
  रनटाइम सेशन प्रोजेक्शन टाइप्ड सेशन/बातचीत
  कॉलम लागू करने से पहले `session_entries.entry_json` से संगतता रूटिंग शैडो साफ करता है,
  इसलिए पुराने JSON पेलोड डिलीवरी लक्ष्यों को फिर से जीवित नहीं कर सकते।
  Subagent announce रूटिंग भी टाइप्ड SQLite डिलीवरी संदर्भ की मांग करती है;
  यह अब संगतता `SessionEntry` रूट फ़ील्ड पर वापस नहीं जाती।
  Gateway `chat.send` स्पष्ट डिलीवरी इनहेरिटेंस `origin`/`last*` संगतता फ़ील्ड के बजाय टाइप्ड SQLite
  डिलीवरी संदर्भ पढ़ता है।
  `tools.effective` भी प्रोवाइडर/अकाउंट/थ्रेड संदर्भ टाइप्ड
  SQLite डिलीवरी/रूटिंग पंक्तियों से व्युत्पन्न करता है, पुराने `last*` सेशन-एंट्री शैडो से नहीं।
  सिस्टम-इवेंट प्रॉम्प्ट संदर्भ `origin` शैडो के बजाय टाइप्ड डिलीवरी फ़ील्ड से
  चैनल/to/अकाउंट/थ्रेड फ़ील्ड फिर से बनाता है।
  साझा `deliveryContextFromSession` हेल्पर और सेशन-से-बातचीत
  मैपर अब `SessionEntry.origin` को पूरी तरह अनदेखा करते हैं; केवल टाइप्ड डिलीवरी फ़ील्ड
  और रिलेशनल बातचीत पंक्तियाँ हॉट रूट पहचान बना सकती हैं।
  रनटाइम सेशन एंट्री सामान्यीकरण `entry_json` को पर्सिस्ट या
  प्रोजेक्ट करने से पहले `origin` हटाता है, और इनबाउंड मेटाडेटा नए origin
  शैडो बनाने के बजाय टाइप्ड चैनल/चैट फ़ील्ड और रिलेशनल बातचीत पंक्तियाँ लिखता है।
- ट्रांसक्रिप्ट इवेंट, ट्रांसक्रिप्ट स्नैपशॉट, और ट्रैजेक्टरी रनटाइम इवेंट अब
  कैनॉनिकल प्रति-एजेंट `sessions` रूट को संदर्भित करते हैं और सेशन
  हटाने पर कैस्केड होते हैं। ट्रांसक्रिप्ट पहचान/idempotency पंक्तियाँ ठीक
  ट्रांसक्रिप्ट इवेंट पंक्ति से कैस्केड होती रहती हैं।
- Memory-core इंडेक्स अब स्पष्ट एजेंट-डेटाबेस टेबल
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`, और
  `memory_embedding_cache` का उपयोग करते हैं, जहाँ `memory_index_state` रिविज़न बदलाव ट्रैक करता है।
  वैकल्पिक FTS/वेक्टर साइड इंडेक्स सामान्य `meta`, `files`, `chunks`,
  `chunks_fts`, या `chunks_vec` टेबल के बजाय `memory_index_chunks_fts` और
  `memory_index_chunks_vec` नामित हैं। कैनॉनिकल नाम वर्तमान
  path/source पंक्ति आकार और serialized embedding संगतता बनाए रखते हैं। ये टेबल
  व्युत्पन्न/सर्च कैश हैं, कैनॉनिकल ट्रांसक्रिप्ट स्टोरेज नहीं; इन्हें
  मेमोरी वर्कस्पेस फ़ाइलों और कॉन्फ़िगर किए गए सोर्स से हटाकर फिर से बनाया जा सकता है।
  शिप किए गए generic-name मेमोरी इंडेक्स को खोलना उसके मेटाडेटा, सोर्स,
  chunks, और embedding cache को कैनॉनिकल टेबल में माइग्रेट करता है; व्युत्पन्न FTS/vector
  टेबल उनके कैनॉनिकल नामों के तहत फिर से बनाई जाती हैं।
- Subagent रन रिकवरी स्थिति अब टाइप्ड साझा `subagent_runs` पंक्तियों में रहती है
  जिसमें इंडेक्स किए गए चाइल्ड, रिक्वेस्टर, और कंट्रोलर सेशन की हैं। पुरानी
  `subagents/runs.json` फ़ाइल केवल डॉक्टर माइग्रेशन इनपुट है।
- वर्तमान बातचीत बाइंडिंग अब सामान्यीकृत बातचीत id से की की गई टाइप्ड साझा
  `current_conversation_bindings` पंक्तियों में रहती हैं, जिनमें
  लक्ष्य एजेंट/सेशन कॉलम, बातचीत काइंड, स्थिति, एक्सपायरी, और मेटाडेटा
  डुप्लिकेट अपारदर्शी बाइंडिंग रिकॉर्ड के बजाय रिलेशनल कॉलम के रूप में स्टोर होते हैं।
  टिकाऊ बाइंडिंग की में सामान्यीकृत बातचीत काइंड शामिल है ताकि
  direct/group/channel refs टकरा न सकें, और SQLite अमान्य बाइंडिंग
  काइंड/स्थिति मान अस्वीकार करता है। पुरानी
  `bindings/current-conversations.json` फ़ाइल केवल डॉक्टर माइग्रेशन इनपुट है।
- डिलीवरी क्यू रिकवरी अब replay JSON पर चैनल, लक्ष्य,
  अकाउंट, सेशन, retry, error, platform-send, और recovery state के लिए टाइप्ड क्यू कॉलम ओवरले करती है।
  `entry_json` replay पेलोड, hooks, और formatting
  पेलोड रखता है, लेकिन हॉट क्यू रूटिंग/स्थिति के लिए टाइप्ड कॉलम अधिकृत हैं।
- TUI last-session restore pointers अब hashed TUI connection/session scope से की की गई टाइप्ड साझा
  `tui_last_sessions` पंक्तियों में रहते हैं।
  पुरानी TUI JSON फ़ाइल केवल डॉक्टर माइग्रेशन इनपुट है।
- डिफॉल्ट TTS prefs अब `speech-core` Plugin के तहत की की गई साझा Plugin-state SQLite पंक्तियों में रहते हैं।
  पुरानी `settings/tts.json` फ़ाइल केवल डॉक्टर माइग्रेशन
  इनपुट है; रनटाइम अब TTS prefs JSON फ़ाइलें न पढ़ता है न लिखता है, और
  legacy path resolver डॉक्टर माइग्रेशन मॉड्यूल में रहता है।
- सीक्रेट लक्ष्य मेटाडेटा अब हर
  क्रेडेंशियल लक्ष्य को config file बताने का दिखावा करने के बजाय स्टोर के बारे में बात करता है। `openclaw.json` config store ही रहता है;
  auth-profile लक्ष्य टाइप्ड SQLite `auth_profile_stores` पंक्तियों का उपयोग करते हैं, जिनमें
  प्रोवाइडर-आकार के credentials JSON पेलोड के रूप में रखे जाते हैं।
- सीक्रेट ऑडिट अब सेवानिवृत्त प्रति-एजेंट `auth.json` फ़ाइलों को स्कैन नहीं करता। डॉक्टर
  उस legacy फ़ाइल के बारे में चेतावनी देने, इम्पोर्ट करने, और हटाने का मालिक है।
- Legacy auth profile path helpers अब डॉक्टर legacy code में रहते हैं। Core auth
  profile path helpers SQLite auth-store पहचान और display locations उजागर करते हैं,
  `auth-profiles.json` या `auth-state.json` runtime paths नहीं।
- Subagent run recovery और OpenRouter model capability cache runtime modules
  अब SQLite snapshot readers/writers को doctor-only legacy JSON
  import helpers से अलग रखते हैं। OpenRouter capabilities टाइप्ड generic
  `model_capability_cache` पंक्तियों का उपयोग `provider_id = "openrouter"` के तहत करते हैं, किसी
  एक opaque cache blob या provider-specific host table के बजाय। Subagent run
  `taskName` टाइप्ड `subagent_runs.task_name` कॉलम में स्टोर होता है;
  `payload_json` कॉपी replay/debug डेटा है, hot display या
  lookup fields का स्रोत नहीं।
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` एजेंट डेटाबेस `vfs_entries` टेबल पर SQLite VFS
  लागू करता है। Directory reads, recursive
  exports, deletes, और renames पूरे namespace को scan करने या `LIKE` path matching पर निर्भर रहने के बजाय indexed `(namespace, path)` prefix ranges
  का उपयोग करते हैं।
- `src/agents/runtime-worker.entry.ts` workers के लिए per-run SQLite VFS, tool artifact,
  run artifact, और scoped cache stores बनाता है।
- Workspace bootstrap completion markers अब resolved workspace path से की की गई टाइप्ड साझा
  `workspace_setup_state` पंक्तियों में रहते हैं,
  `.openclaw/workspace-state.json` के बजाय; runtime अब legacy workspace marker को न पढ़ता है न rewrite करता है, और helper APIs अब storage identity derive करने के लिए fake
  `.openclaw/setup-state` path को इधर-उधर pass नहीं करते।
- Exec approvals अब टाइप्ड साझा SQLite `exec_approvals_config`
  singleton row में रहते हैं। Doctor legacy `~/.openclaw/exec-approvals.json` import करता है;
  runtime writes अब उस file को active
  store location के रूप में create, rewrite, या report नहीं करते। macOS companion वही
  `state/openclaw.sqlite` table row पढ़ता और लिखता है; वह disk पर केवल Unix prompt socket रखता है
  क्योंकि वह IPC है, durable runtime state नहीं।
- Device identity, device auth, और bootstrap runtime modules अब अपने
  SQLite snapshot readers/writers को doctor-only legacy JSON import
  helpers से अलग रखते हैं। Device identity टाइप्ड `device_identities` rows का उपयोग करती है और device auth
  tokens टाइप्ड `device_auth_tokens` rows का उपयोग करते हैं। Device auth writes
  token table को truncate करने के बजाय device/role के अनुसार rows reconcile करती हैं, और runtime अब
  single-token updates को पुराने whole-store adapter के माध्यम से route नहीं करता। Legacy
  version-1 JSON पेलोड केवल doctor import/export आकारों के रूप में मौजूद हैं।
- GitHub Copilot token exchange cache साझा SQLite plugin-state तालिका का उपयोग करता है
  `github-copilot/token-cache/default` के अंतर्गत। यह provider-owned cache state है,
  इसलिए यह जानबूझकर कोई host schema table नहीं जोड़ता।
- GitHub Copilot compaction अब `openclaw-compaction-*.json`
  workspace sidecars नहीं लिखता। harness tracked SDK session के लिए SDK history compaction RPC को कॉल करता है, और OpenClaw compatibility marker files के बजाय टिकाऊ session/transcript state
  SQLite में रखता है।
- साझा Swift runtime (`OpenClawKit`) device identity और device auth के लिए वही
  `state/openclaw.sqlite` rows उपयोग करता है। macOS app
  helpers दूसरी JSON या SQLite path के मालिक होने के बजाय साझा SQLite helpers import करते हैं। बची हुई legacy `identity/device.json` identity creation को तब तक रोकती है
  जब तक doctor उसे SQLite में import नहीं कर देता, TypeScript और Android
  startup gate से मेल खाते हुए।
- Android device identity वही TypeScript-compatible key material उपयोग करती है
  जो typed `state/openclaw.sqlite#table/device_identities` rows में stored है। यह कभी
  `openclaw/identity/device.json` पढ़ती या लिखती नहीं; बची हुई legacy file startup को तब तक रोकती है जब तक doctor उसे SQLite में import नहीं कर देता।
- Android cached device auth tokens भी typed
  `state/openclaw.sqlite#table/device_auth_tokens` rows उपयोग करते हैं और TypeScript तथा Swift जैसी वही
  version-1 token semantics साझा करते हैं। Runtime अब `SecurePrefs`
  `gateway.deviceToken*` compatibility keys नहीं पढ़ता; वे केवल migration/doctor
  logic से संबंधित हैं।
- Android notification recent-package history typed
  `android_notification_recent_packages` rows उपयोग करती है। Runtime अब पुराने SharedPreferences CSV keys को migrate या
  read नहीं करता।
- Device identity creation fail closed होती है जब legacy `identity/device.json`
  मौजूद हो, जब SQLite identity row invalid हो, या जब SQLite identity
  store खोला न जा सके। Doctor पहले उस file को import और remove करता है, इसलिए runtime
  startup migration से पहले pairing identity को चुपचाप rotate नहीं कर सकता।
- Device identity selection एक SQLite row key है, JSON file locator नहीं। Tests
  और gateway helpers explicit identity keys pass करते हैं; केवल doctor migration और
  fail-closed startup gate retired `identity/device.json` filename जानते हैं।
- Session reset compatibility अब doctor config migration में रहती है:
  `session.idleMinutes` को `session.reset.idleMinutes` में move किया जाता है,
  `session.resetByType.dm` को `session.resetByType.direct` में move किया जाता है, और
  runtime reset policy केवल canonical reset keys पढ़ती है।
- Legacy config compatibility अब `src/commands/doctor/` के अंतर्गत रहती है। सामान्य
  `readConfigFileSnapshot()` validation doctor legacy detectors import नहीं करता
  या legacy issues annotate नहीं करता; `runDoctorConfigPreflight()` doctor repair/reporting के लिए
  वे issues जोड़ता है। doctor config flow
  `src/commands/doctor/legacy-config.ts` import करता है, और पुराना OAuth profile-id repair
  `src/commands/doctor/legacy/oauth-profile-ids.ts` के अंतर्गत रहता है।
- Non-doctor commands legacy config repair auto-run नहीं करते। उदाहरण के लिए,
  `openclaw update --channel` अब invalid legacy config पर fail होता है और
  user से doctor चलाने को कहता है, doctor migration code को चुपचाप import करने के बजाय।
- Web push, APNs, Voice Wake, update checks, और config health अब subscriptions, VAPID keys, node registrations, trigger rows,
  routing rows, update-notification state, और config health entries के लिए whole opaque JSON blobs के बजाय typed shared SQLite
  tables उपयोग करते हैं। Web push और APNs snapshot writes अब
  subscriptions/registrations को tables clear करने के बजाय primary key से reconcile करते हैं;
  config health config path से ऐसा ही करता है।
  उनके runtime modules SQLite snapshot readers/writers को
  doctor-only legacy JSON import helpers से अलग रखते हैं।
- Node-host config अब shared SQLite database में typed singleton row उपयोग करता है;
  doctor सामान्य runtime use से पहले पुरानी `node.json` file import करता है।
- Device/node pairing, channel pairing, channel allowlists, और bootstrap state
  अब whole opaque JSON blobs के बजाय typed SQLite rows उपयोग करते हैं। Plugin binding
  approvals और cron job state वही split follow करते हैं: runtime modules
  SQLite-backed operations और neutral snapshot helpers expose करते हैं, और pairing/bootstrap
  plus plugin binding approval snapshot writes tables truncate करने के बजाय rows को primary key से reconcile करते हैं, जबकि doctor पुरानी JSON files को
  `src/commands/doctor/legacy/*` modules के माध्यम से import/remove करता है।
- Installed plugin records अब SQLite installed-plugin index में रहते हैं।
  Runtime config read/write अब पुराने
  `plugins.installs` authored-config data को migrate या preserve नहीं करता; doctor सामान्य runtime use से पहले उस legacy config
  shape को SQLite में import करता है।
- QQBot credential recovery snapshots अब SQLite plugin state में
  `qqbot/credential-backups` के अंतर्गत रहते हैं। Runtime अब
  `qqbot/data/credential-backup*.json` नहीं लिखता; doctor उन
  legacy backup files को अन्य QQBot state inputs के साथ import और remove करता है।
- Gateway reload planning SQLite installed-plugin index snapshots की तुलना
  internal `installedPluginIndex.installRecords.*` diff namespace के अंतर्गत करता है। Runtime
  reload decisions अब उन rows को fake `plugins.installs` config
  objects में wrap नहीं करते।
- Matrix named-account credential upgrade अब runtime
  reads के दौरान नहीं होता। Doctor पुराने top-level `credentials/matrix/credentials.json`
  rename का मालिक है जब single/default Matrix account resolve किया जा सकता है।
- Core pairing और cron runtime modules अब legacy JSON path
  builders export नहीं करते। Doctor-owned legacy modules import tests और
  migration के लिए `pending.json`, `paired.json`,
  `bootstrap.json`, और `cron/jobs.json` source paths construct करते हैं। Legacy cron job-shape normalization और cron run-log import
  `src/commands/doctor/legacy/cron*.ts` के अंतर्गत रहते हैं।
- `src/commands/doctor/legacy/runtime-state.ts` doctor से SQLite में node host config सहित legacy JSON state
  files import करता है। नई legacy file
  importers `src/commands/doctor/legacy/` के अंतर्गत ही रहती हैं।
- `src/commands/doctor/state-migrations.ts` legacy `sessions.json` और
  `*.jsonl` transcripts को सीधे SQLite में import करता है और successful sources हटाता है। यह
  अब root legacy transcripts को
  `agents/<agentId>/sessions/*.jsonl` के माध्यम से stage नहीं करता या import से पहले canonical JSONL target create नहीं करता।
- State integrity doctor checks अब legacy session directories scan नहीं करते या
  orphan JSONL deletion offer नहीं करते। Legacy transcript files केवल migration inputs हैं, और migration step import plus source removal का मालिक है।
- Legacy sandbox registry import
  `src/commands/doctor/legacy/sandbox-registry.ts` के अंतर्गत रहता है; active sandbox registry
  reads और writes SQLite-only रहते हैं।
- Legacy session transcript health/import repair
  `src/commands/doctor/legacy/session-transcript-health.ts` के अंतर्गत रहता है; runtime command
  modules अब JSONL transcript parsing या active-branch repair code नहीं रखते।

पूर्ण किए गए समेकन/हटाने की मुख्य बातें:

- Plugin स्थिति अब साझा `state/openclaw.sqlite` डेटाबेस का उपयोग करती है। पुराना
  शाखा-स्थानीय `plugin-state/state.sqlite` साइडकार आयातक हटा दिया गया है क्योंकि
  वह SQLite लेआउट कभी शिप नहीं हुआ। प्रोब/परीक्षण सहायक Plugin-स्थिति-विशिष्ट SQLite पथ
  उजागर करने के बजाय साझा `databasePath` रिपोर्ट करते हैं।
- कार्य और कार्य प्रवाह रनटाइम तालिकाएं अब `tasks/runs.sqlite` और
  `tasks/flows/registry.sqlite` के बजाय साझा `state/openclaw.sqlite` डेटाबेस में
  रहती हैं; उसी अशिप्ड-लेआउट कारण से पुराने साइडकार आयातक हटा दिए गए हैं।
- `src/config/sessions/store.ts` को अब इनबाउंड
  मेटाडेटा, रूट अपडेट, या updated-at पढ़ने के लिए `storePath` की जरूरत नहीं है। कमांड स्थायित्व, CLI
  सत्र सफाई, उप-एजेंट गहराई, प्रमाणीकरण ओवरराइड, और ट्रांसक्रिप्ट सत्र
  पहचान एजेंट/सत्र पंक्ति API का उपयोग करते हैं। लेखन आशावादी संघर्ष पुनःप्रयास के साथ SQLite पंक्ति पैच
  के रूप में लागू किए जाते हैं।
- सत्र लक्ष्य समाधान अब लेगेसी
  `sessions.json` पथों के बजाय प्रति-एजेंट डेटाबेस लक्ष्य उजागर करता है। साझा Gateway, ACP मेटाडेटा, doctor रूट मरम्मत, और
  `openclaw sessions` `agent_databases` के साथ कॉन्फिगर किए गए एजेंटों की गणना करते हैं।
- Gateway सत्र रूटिंग अब `resolveGatewaySessionDatabaseTarget` का उपयोग करती है; लौटाया गया
  लक्ष्य किसी लेगेसी सत्र-स्टोर फ़ाइल पथ के बजाय `databasePath` और उम्मीदवार SQLite पंक्ति कुंजियां
  रखता है।
- चैनल सत्र रनटाइम प्रकार अब updated-at पढ़ने, इनबाउंड मेटाडेटा, और अंतिम-रूट अपडेट के लिए
  `{agentId, sessionKey}` उजागर करते हैं। पुराना
  `saveSessionStore(storePath, store)` संगतता प्रकार चला गया है।
- Plugin रनटाइम, एक्सटेंशन API, और `config/sessions` बैरल सतहें अब
  Plugin कोड को SQLite-समर्थित सत्र पंक्ति सहायकों की ओर ले जाती हैं। रूट लाइब्रेरी संगतता
  निर्यात (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) मौजूदा उपभोक्ताओं के लिए
  अप्रचलित शिम के रूप में बने रहते हैं। पुराना
  `resolveLegacySessionStorePath` सहायक चला गया है; लेगेसी `sessions.json` पथ
  निर्माण अब माइग्रेशन और परीक्षण फिक्स्चर तक स्थानीय है।
- `src/config/sessions/session-entries.sqlite.ts` अब कैनोनिकल सत्र
  प्रविष्टियां प्रति-एजेंट डेटाबेस में संग्रहीत करता है और इसमें पंक्ति-स्तरीय read/upsert/delete पैच
  समर्थन है। रनटाइम upsert/patch/delete अब केस वैरिएंट स्कैन नहीं करता या
  लेगेसी उपनाम कुंजियां प्रून नहीं करता; doctor कैनोनिकलाइज़ेशन का मालिक है। स्वतंत्र JSON आयात सहायक चला गया है, और माइग्रेशन पूरी सत्र तालिका बदलने के बजाय
  नई पंक्तियों को upsert करके मर्ज करता है। सार्वजनिक read/list/load सहायक
  टाइप की गई `sessions` और `conversations` पंक्तियों से सक्रिय सत्र मेटाडेटा प्रोजेक्ट करते हैं;
  `entry_json` एक संगतता/डिबग छाया है और टाइप की गई सत्र पहचान या डिलीवरी संदर्भ खोए बिना
  पुराना या अमान्य हो सकता है।
- `src/config/sessions/delivery-info.ts` अब टाइप की गई प्रति-एजेंट
  `sessions` + `conversations` + `session_conversations` पंक्तियों से डिलीवरी संदर्भ हल करता है।
  यह अब `session_entries.entry_json` से रनटाइम डिलीवरी पहचान का पुनर्निर्माण नहीं करता; गुम टाइप की गई conversation पंक्ति एक doctor
  माइग्रेशन/मरम्मत समस्या है, रनटाइम फॉलबैक नहीं।
- संग्रहीत-सत्र रीसेट निर्णय अब टाइप किए गए `sessions.session_scope`,
  `sessions.chat_type`, और `sessions.channel` मेटाडेटा को प्राथमिकता देते हैं। `sessionKey` पार्सिंग
  केवल कमांड लक्ष्यों पर स्पष्ट थ्रेड/टॉपिक प्रत्ययों के लिए बनी रहती है; group बनाम
  direct रीसेट वर्गीकरण अब कुंजी आकार से नहीं आता।
- सत्र सूची/स्थिति प्रदर्शन वर्गीकरण अब टाइप किए गए chat मेटाडेटा और
  Gateway सत्र प्रकार का उपयोग करता है। यह अब `session_key` के अंदर `:group:` या `:channel:` सबस्ट्रिंग को टिकाऊ group/direct सत्य
  नहीं मानता।
- मौन-उत्तर नीति चयन अब केवल स्पष्ट conversation प्रकार या सतह
  मेटाडेटा का उपयोग करता है। यह अब `session_key` सबस्ट्रिंग से direct/group नीति का अनुमान
  नहीं लगाता।
- सत्र प्रदर्शन मॉडल समाधान अब SQLite
  सत्र डेटाबेस लक्ष्य से एजेंट id प्राप्त करता है, उसे `session_key` से अलग नहीं करता।
- एजेंट-से-एजेंट घोषणा लक्ष्य हाइड्रेशन अब केवल टाइप किए गए `sessions.list`
  `deliveryContext` का उपयोग करता है। यह अब लेगेसी `origin`, मिरर किए गए `last*` फ़ील्ड, या `session_key` आकार से
  चैनल/account/thread रूटिंग पुनर्प्राप्त नहीं करता।
- `sessions_send` थ्रेड-लक्ष्य अस्वीकृति अब टाइप किया गया SQLite रूटिंग
  मेटाडेटा पढ़ती है। यह अब लक्ष्य कुंजी से थ्रेड प्रत्यय पार्स करके लक्ष्यों को अस्वीकार या स्वीकार
  नहीं करती।
- group-स्कोप्ड टूल नीति सत्यापन अब वर्तमान या spawned सत्र के लिए टाइप की गई SQLite conversation
  रूटिंग पढ़ता है। यह अब `sessionKey` डिकोड करके group/channel
  पहचान पर भरोसा नहीं करता; कॉलर-प्रदान group ids तब हटा दिए जाते हैं जब
  कोई टाइप की गई सत्र पंक्ति उनके लिए पुष्टि नहीं करती।
- चैनल मॉडल ओवरराइड मिलान अब स्पष्ट group और parent
  conversation मेटाडेटा का उपयोग करता है। यह अब `parentSessionKey` से parent conversation ids
  डिकोड नहीं करता।
- संग्रहीत मॉडल ओवरराइड इनहेरिटेंस को अब टाइप किए गए सत्र संदर्भ से स्पष्ट parent सत्र कुंजी
  चाहिए। यह अब `sessionKey` में `:thread:` या `:topic:` प्रत्ययों से parent ओवरराइड
  व्युत्पन्न नहीं करता।
- पुराना सत्र thread-info wrapper और loaded-Plugin थ्रेड पार्सर चले गए हैं;
  कोई रनटाइम कोड `config/sessions/thread-info` आयात नहीं करता।
- चैनल conversation सहायक अब पूर्ण-सत्र-कुंजी पार्सिंग
  ब्रिज उजागर नहीं करता। core अब भी provider-स्वामित्व वाले raw conversation ids को
  `resolveSessionConversation(...)` के माध्यम से सामान्यीकृत करता है, लेकिन यह `sessionKey` से रूट तथ्यों का पुनर्निर्माण
  नहीं करता।
- Completion डिलीवरी, send नीति, और कार्य रखरखाव अब `session_key` आकार से chat
  प्रकार व्युत्पन्न नहीं करते। पुराना chat-type कुंजी पार्सर हटा दिया गया है;
  इन पथों को टाइप किए गए सत्र मेटाडेटा, टाइप किए गए डिलीवरी संदर्भ, या
  स्पष्ट डिलीवरी लक्ष्य शब्दावली की जरूरत है।
- सत्र सूची/स्थिति, डायग्नोस्टिक्स, approval account binding, TUI Heartbeat
  फ़िल्टरिंग, और उपयोग सारांश अब provider/account/thread/display रूटिंग के लिए `SessionEntry.origin` को
  नहीं खंगालते। केवल बचे हुए रनटाइम
  `origin` reads गैर-सत्र अवधारणाएं या वर्तमान-turn डिलीवरी ऑब्जेक्ट हैं।
- approval-request native conversation lookup अब टाइप की गई प्रति-एजेंट सत्र
  रूटिंग पंक्तियां पढ़ता है। यह अब `sessionKey` से channel/group/thread conversation पहचान
  पार्स नहीं करता; गुम टाइप किया गया मेटाडेटा एक माइग्रेशन/मरम्मत समस्या है।
- Gateway सत्र changed/chat/session event payloads अब
  `SessionEntry.origin` या `last*` रूट छायाएं echo नहीं करते; क्लाइंट्स को टाइप किए गए
  `channel`, `chatType`, और `deliveryContext` मिलते हैं।
- Heartbeat डिलीवरी समाधान अब टाइप किया गया SQLite
  `deliveryContext` सीधे प्राप्त कर सकता है, और Heartbeat रनटाइम वर्तमान रूटिंग के लिए संगतता `session_entries`
  छायाओं पर निर्भर रहने के बजाय प्रति-एजेंट
  सत्र डिलीवरी पंक्ति पास करता है।
- Cron isolated-agent डिलीवरी लक्ष्य समाधान भी संगतता entry payload पर fallback करने से पहले
  अपनी वर्तमान
  रूट को टाइप की गई प्रति-एजेंट सत्र डिलीवरी पंक्ति से hydrate करता है।
- उप-एजेंट announce origin समाधान अब `loadRequesterSessionEntry` के माध्यम से टाइप किया गया requester-session
  डिलीवरी संदर्भ थ्रेड करता है और उस पंक्ति को संगतता `last*`/`deliveryContext` छायाओं पर प्राथमिकता देता है।
- इनबाउंड सत्र मेटाडेटा अपडेट अब पहले टाइप की गई प्रति-एजेंट
  डिलीवरी पंक्ति के विरुद्ध मर्ज करते हैं; पुराने `SessionEntry` डिलीवरी फ़ील्ड केवल तब fallback
  हैं जब कोई टाइप की गई conversation पंक्ति मौजूद नहीं होती।
- restart/update डिलीवरी extraction अब टाइप किए गए SQLite डिलीवरी
  `threadId` को `sessionKey` से पार्स किए गए topic/thread खंडों पर प्राथमिकता देता है; पार्सिंग
  केवल लेगेसी thread-shaped कुंजियों के लिए fallback है।
- Hook agent context channel ids अब टाइप की गई SQLite conversation पहचान को प्राथमिकता देते हैं,
  फिर स्पष्ट message मेटाडेटा को। वे अब `sessionKey` से provider/group/channel
  खंड पार्स नहीं करते।
- Gateway `chat.send` external-route inheritance अब
  `sessionKey` टुकड़ों से channel/direct/group scope अनुमानित करने के बजाय टाइप किया गया SQLite सत्र
  रूटिंग मेटाडेटा पढ़ता है। चैनल-स्कोप्ड सत्र केवल तब inherit करते हैं जब टाइप किया गया
  सत्र channel और chat type संग्रहीत डिलीवरी संदर्भ से मेल खाते हैं; shared-main
  सत्र अपना सख्त CLI/no-client-metadata नियम रखते हैं।
- Restart-sentinel wake और continuation रूटिंग अब Heartbeat wakes या routed agent-turn
  continuations queue करने से पहले टाइप की गई SQLite
  डिलीवरी/रूटिंग पंक्तियां पढ़ती है। यह अब
  session-entry JSON छाया से डिलीवरी संदर्भ का पुनर्निर्माण नहीं करती।
- Gateway `tools.effective` संदर्भ समाधान अब provider, account, target, thread, और reply-mode
  inputs के लिए टाइप की गई SQLite
  डिलीवरी/रूटिंग पंक्तियां पढ़ता है। यह अब पुराने
  `session_entries.entry_json` origin छायाओं से उन सक्रिय रूटिंग फ़ील्ड्स को पुनर्प्राप्त नहीं करता।
- Realtime voice consult रूटिंग अब टाइप की गई
  प्रति-एजेंट SQLite सत्र पंक्तियों से parent/call डिलीवरी हल करती है। यह अब embedded एजेंट
  message route चुनते समय संगतता
  `SessionEntry.deliveryContext` छायाओं पर fallback नहीं करती।
- ACP spawn Heartbeat relay और parent-stream रूटिंग अब टाइप की गई SQLite सत्र पंक्तियों से parent delivery
  पढ़ते हैं। वे अब संगतता session-entry छायाओं से parent delivery
  संदर्भ का पुनर्निर्माण नहीं करते।
- सत्र डिलीवरी रूट संरक्षण अब टाइप किए गए chat मेटाडेटा और
  persisted डिलीवरी कॉलम का पालन करता है। यह अब `sessionKey` से channel hints, direct/main
  markers, या thread shape नहीं निकालता; internal webchat routes केवल तब
  external target inherit करते हैं जब SQLite के पास पहले से सत्र के लिए typed/persisted delivery
  identity हो।
- Generic सत्र डिलीवरी extraction अब केवल exact typed SQLite
  सत्र डिलीवरी पंक्ति पढ़ता है। यह अब thread/topic प्रत्यय पार्स नहीं करता या
  thread-shaped कुंजी से base session key पर fallback नहीं करता।
- Reply dispatch, restart sentinel recovery, और realtime voice consult routing
  अब thread routing के लिए exact typed SQLite session/conversation पंक्तियों का उपयोग करते हैं। वे
  अब thread-shaped session keys पार्स करके thread ids या base-session delivery context
  पुनर्प्राप्त नहीं करते।
- Embedded PI history limiting अब provider, chat type,
  और peer identity के लिए typed SQLite session routing
  projection (`sessions` + primary `conversations`) का उपयोग करता है। यह अब `sessionKey` से provider, DM, group, या thread shape
  पार्स नहीं करता।
- Cron tool delivery inference अब केवल स्पष्ट delivery या current typed
  delivery context का उपयोग करता है। यह अब `agentSessionKey` से channel, peer, account, या thread
  targets डिकोड नहीं करता।
- रनटाइम सत्र पंक्तियां अब पुराना `lastProvider` route alias नहीं रखतीं।
  सहायक और परीक्षण typed `lastChannel` और `deliveryContext` फ़ील्ड का उपयोग करते हैं;
  doctor migration ही एकमात्र जगह है जिसे पुराने route aliases
  या persisted `origin` shadows का अनुवाद करना चाहिए।
- Transcript events, VFS rows, और tool artifact rows अब प्रति-एजेंट
  डेटाबेस में लिखते हैं। अशिप्ड global transcript-file mapping table चली गई है; doctor
  इसके बजाय durable migration rows में legacy source paths रिकॉर्ड करता है।
- रनटाइम transcript lookup अब JSONL byte offsets स्कैन नहीं करता या legacy
  transcript files probe नहीं करता। Gateway chat/media/history paths SQLite से transcript rows
  पढ़ते हैं; session JSONL अब केवल legacy doctor input है, runtime state
  या export format नहीं।
- Transcript parent और branch relationships SQLite transcript
  headers में structured `parentTranscriptScope: {agentId, sessionId}` metadata का उपयोग करते हैं,
  path-like `agent-db:...transcript_events...` locator strings का नहीं।
- transcript manager contract अब implicit persisted
  `create(cwd)` या `continueRecent(cwd)` constructors उजागर नहीं करता। Persisted transcript
  managers explicit `{agentId, sessionId}` scope के साथ खोले जाते हैं; केवल
  in-memory managers tests और pure transcript transforms के लिए scope-free रहते हैं।
- Runtime transcript store APIs SQLite scope हल करते हैं, filesystem paths नहीं। पुराना
  `resolve...ForPath` helper और unused `transcriptPath` write options runtime callers से
  चले गए हैं।
- Runtime session resolution अब `{agentId, sessionId}` का उपयोग करता है और external boundaries के लिए
  `sqlite-transcript://<agent>/<session>` strings व्युत्पन्न नहीं करना चाहिए।
  Legacy absolute JSONL paths केवल doctor migration inputs हैं।
- Native hook relay direct-bridge records अब relay id से keyed typed shared
  `native_hook_relay_bridges` rows में रहते हैं। Runtime अब उन अल्पकालिक bridge
  records के लिए `/tmp` JSON registry या opaque generic records नहीं लिखता।
- `runEmbeddedPiAgent(...)` में अब transcript-locator parameter नहीं है।
  तैयार worker descriptors भी transcript locators को छोड़ देते हैं। Runtime session
  state और queued follow-up runs derived transcript handles के बजाय `{agentId, sessionId}` रखते हैं।
- Embedded compaction अब SQLite scope `agentId` और `sessionId` से लेता है।
  Compaction hooks, context-engine calls, CLI delegation, और protocol replies को
  derived `sqlite-transcript://...` handles नहीं मिलने चाहिए। Export/debug code
  rows से explicit user artifacts materialize कर सकता है, लेकिन वह generic
  session JSONL export path नहीं देता या file names को runtime identity में वापस
  feed नहीं करता।
- `/export-session` SQLite से transcript rows पढ़ता है और केवल requested
  standalone HTML view लिखता है। Embedded viewer अब उन rows से session JSONL को
  reconstruct या download नहीं करता।
- Context-engine delegation अब agent identity recover करने के लिए transcript
  locator parse नहीं करता। Prepared runtime context resolved `agentId` को
  built-in compaction adapter में carry करता है।
- Transcript rewrite और live tool-result truncation अब transcript state को
  `{agentId, sessionId}` से पढ़ते और persist करते हैं और transcript-update event
  payloads के लिए temporary locators derive नहीं करते।
- transcript-state helper surface में अब locator-based
  `readTranscriptState`, `replaceTranscriptStateEvents`, या
  `persistTranscriptStateMutation` variants नहीं हैं। Runtime callers को
  `{agentId, sessionId}` APIs इस्तेमाल करनी होंगी। Doctor import legacy files को
  explicit file path से पढ़ता है और SQLite rows लिखता है; वह locator strings
  migrate नहीं करता।
- runtime session-manager contract अब `open(locator)`, `forkFrom(locator)`, या
  `setTranscriptLocator(...)` expose नहीं करता। Persisted session managers केवल
  `{agentId, sessionId}` से open होते हैं; list/fork helpers transcript manager
  facade के बजाय row-oriented session और checkpoint APIs पर रहते हैं।
- Gateway transcript reader APIs scope-first हैं। वे `{agentId, sessionId}` लेते
  हैं और positional transcript locator accept नहीं करते जो गलती से runtime
  identity बन सकता हो। Active transcript locator parsing हट गई है; legacy source
  paths केवल doctor import code द्वारा पढ़े जाते हैं।
- Transcript update events भी scope-first हैं। `emitSessionTranscriptUpdate` अब
  bare locator string accept नहीं करता, और listeners handle parse किए बिना
  `{agentId, sessionId}` से route करते हैं।
- Gateway session-message broadcast session keys को agent/session scope से
  resolve करता है, transcript locator से नहीं। पुराना transcript-locator-to-session
  key resolver/cache हट गया है।
- Gateway session-history SSE live updates को agent/session scope से filter करता
  है। यह अब यह तय करने के लिए transcript locator candidates, realpaths, या
  file-shaped transcript identities canonicalize नहीं करता कि किसी stream को
  update मिलना चाहिए या नहीं।
- Session lifecycle hooks अब `session_end` पर transcript locators derive या
  expose नहीं करते। Hook consumers को `sessionId`, `sessionKey`, next-session
  ids, और agent context मिलते हैं; transcript files lifecycle contract का हिस्सा
  नहीं हैं।
- Reset hooks भी अब transcript locators derive या expose नहीं करते। `before_reset`
  payload recovered SQLite messages और reset reason carry करता है, जबकि session
  identity hook context में रहती है।
- Agent harness reset अब transcript locator accept नहीं करता। Reset dispatch
  `sessionId`/`sessionKey` और reason से scoped है।
- Agent extension session types अब `transcriptLocator` expose नहीं करते;
  extensions को file-shaped transcript identity तक पहुंचने के बजाय session
  context और runtime APIs इस्तेमाल करनी चाहिए।
- Plugin compaction hooks अब transcript locators expose नहीं करते। Hook context
  में पहले से session identity होती है, और transcript reads file-shaped handles
  के बजाय SQLite scope-aware APIs से होनी चाहिए।
- `before_agent_finalize` hooks अब `transcriptPath` expose नहीं करते, native hook
  relay payloads सहित। Finalization hooks केवल session context इस्तेमाल करते हैं।
- Gateway reset responses अब returned entry पर transcript locator synthesize नहीं
  करते। Reset SQLite transcript rows बनाता है, clean session entry return करता है,
  और transcript access को scope-aware readers पर छोड़ता है।
- Embedded run और compaction results अब session accounting के लिए transcript
  locators surface नहीं करते। Automatic compaction केवल active `sessionId`,
  compaction counters, और token metadata update करता है।
- Embedded attempt results अब `transcriptLocatorUsed` return नहीं करते, और
  context-engine `compact()` results अब transcript locators return नहीं करते।
  Runtime retry loops केवल successor `sessionId` accept करते हैं।
- Delivery-mirror transcript append results अब transcript locators return नहीं
  करते। Callers को appended `messageId` मिलता है; transcript update signals SQLite
  scope इस्तेमाल करते हैं।
- Parent-session fork helpers केवल forked `sessionId` return करते हैं। Subagent
  preparation child agent/session scope को engines में pass करता है।
- CLI runner params और history reseeding अब transcript locators accept नहीं
  करते। CLI history reads SQLite transcript scope को `{agentId,
sessionId}` और session key context से resolve करते हैं।
- CLI और embedded-runner test fixtures अब active sessions को `*.jsonl` files
  pretend करने या runtime params के through `sqlite-transcript://...` string pass
  करने के बजाय session id से SQLite transcript rows seed और read करते हैं।
- Session tool-result guard events known session scope से emit करते हैं, तब भी
  जब in-memory manager के पास derived locator नहीं होता। इसके tests अब active
  `/tmp/*.jsonl` transcript files fake नहीं करते।
- BTW और compaction-checkpoint helpers अब transcript rows को SQLite scope से read
  और fork करते हैं। Checkpoint metadata अब केवल session ids और leaf/entry ids
  store करता है; derived locators अब checkpoint payloads में नहीं लिखे जाते।
- Gateway transcript-key lookup protocol boundaries पर SQLite transcript scope
  इस्तेमाल करता है और अब transcript filenames के realpaths या stats नहीं करता।
- Automatic compaction transcript rotation successor transcript rows को सीधे
  SQLite transcript store के through लिखता है। Session rows केवल successor
  session identity रखते हैं, durable JSONL path या persisted locator नहीं।
- Embedded context-engine compaction SQLite-named transcript rotation helpers
  इस्तेमाल करता है। Rotation tests अब JSONL successor paths construct नहीं करते
  या active sessions को files की तरह model नहीं करते।
- Managed outgoing image retention अपने transcript-message cache को filesystem
  stat calls के बजाय SQLite transcript stats से key करता है।
- Runtime session locks और standalone legacy `.jsonl.lock` doctor
  lane हटा दिए गए हैं।
- Microsoft Teams runtime barrel और public plugin SDK अब पुराने file-lock helper
  को re-export नहीं करते; durable plugin state paths SQLite-backed हैं।
- Session age/count pruning और explicit session cleanup हटा दिए गए हैं।
  Doctor legacy import का owner है; stale sessions explicit रूप से reset या
  delete किए जाते हैं।
- Doctor integrity checks अब legacy JSONL file को SQLite session row के लिए
  valid active transcript के रूप में count नहीं करते। Active transcript health
  केवल SQLite-only है; legacy JSONL files migration/orphan-cleanup inputs के रूप
  में report की जाती हैं।
- Doctor अब `agents/<agent>/sessions/` को required runtime state नहीं मानता। वह
  उस directory को केवल तब scan करता है जब वह पहले से मौजूद हो, legacy import
  या orphan-cleanup input के रूप में।
- Gateway `sessions.resolve`, session patch/reset/compact paths, subagent
  spawning, fast abort, ACP metadata, heartbeat-isolated sessions, और TUI
  patching अब normal runtime work के side effect के रूप में legacy session keys
  migrate या prune नहीं करते।
- CLI command session resolution अब `storePath` के बजाय owning `agentId` return
  करता है, और normal `--to` या `--session-id` resolution के दौरान legacy
  main-session rows copy नहीं करता। Legacy main-row canonicalization केवल doctor
  की जिम्मेदारी है।
- Runtime subagent depth resolution अब `sessions.json` या JSON5 session stores
  नहीं पढ़ता। यह agent id से SQLite `session_entries` पढ़ता है, और legacy
  depth/session metadata केवल doctor import path से enter कर सकता है।
- Auth profile session overrides lazy-loading file-shaped session-store runtime
  के बजाय direct `{agentId, sessionKey}` row upserts के through persist होते हैं।
- Auto-reply verbose gating और session update helpers अब session identity से
  SQLite session rows read/upsert करते हैं और persisted row state को touch करने
  से पहले legacy store path की आवश्यकता नहीं रखते।
- Command-run session metadata helpers अब entry-oriented names और module paths
  इस्तेमाल करते हैं; पुराना `session-store` command helper surface हटा दिया गया है।
- Bootstrap header seeding और manual compaction boundary hardening अब SQLite
  transcript rows को सीधे mutate करते हैं। Runtime callers session identity pass
  करते हैं, writable `.jsonl` paths नहीं।
- Silent session-rotation replay recent user/assistant turns को SQLite transcript
  rows से `{agentId, sessionId}` द्वारा copy करता है। यह अब source या target
  transcript locators accept नहीं करता।
- Fresh runtime session rows अब transcript locators store नहीं करते। Callers
  सीधे `{agentId, sessionId}` इस्तेमाल करते हैं; export/debug commands rows
  materialize करते समय output file names चुन सकते हैं।
- नया persisted transcript session शुरू करना अब हमेशा scope से SQLite rows open
  करता है। Session manager अब new session की identity के रूप में previous
  file-era transcript path या locator reuse नहीं करता।
- Persisted transcript sessions explicit
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API इस्तेमाल
  करते हैं। पुराने static `SessionManager.create/openForSession/list/forkFromSession`
  facades हट गए हैं ताकि tests और runtime code गलती से file-era session
  discovery फिर से create न कर सकें।
- Plugin runtime अब `api.runtime.agent.session.resolveTranscriptLocatorPath`
  expose नहीं करता; plugin code SQLite row helpers और scope values इस्तेमाल करता है।
- public `session-store-runtime` SDK surface अब केवल session row और transcript
  row helpers export करता है। Focused SQLite schema/path/transaction helpers
  `sqlite-runtime` में रहते हैं; raw open/close/reset helpers first-party tests
  के लिए local-only रहते हैं।
- Legacy `.jsonl` trajectory/checkpoint filename classifiers अब doctor legacy
  session-file module में रहते हैं। Core session validation अब normal SQLite
  session ids तय करने के लिए file-artifact helpers import नहीं करता।
- Active Memory blocking subagent runs plugin state के नीचे temporary या persisted
  `session.jsonl` files बनाने के बजाय SQLite transcript rows इस्तेमाल करते हैं।
  पुराना `transcriptDir` option हटाया गया है।
- One-off slug generation और Crestodian planner runs temporary `session.jsonl`
  files बनाने के बजाय SQLite transcript rows इस्तेमाल करते हैं।
- `llm-task` helper runs और hidden commitment extraction भी SQLite transcript
  rows इस्तेमाल करते हैं, इसलिए ये model-only helper sessions अब temporary
  JSON/JSONL transcript files नहीं बनाते।
- `TranscriptSessionManager` अब केवल opened SQLite transcript scope है।
  Runtime code इसे `openTranscriptSessionManagerForSession({agentId,
sessionId})` से open करता है; create, branch, continue, list, और fork flows
  static manager facades के बजाय उनके owning SQLite row helpers में रहते हैं।
  Doctor/import/debug code runtime session manager के बाहर explicit legacy source
  files handle करता है।
- stale `SessionManager.newSession()` और
  `SessionManager.createBranchedSession()` facade methods हटाए गए। New sessions
  और transcript descendants अपने owning SQLite workflow द्वारा create किए जाते
  हैं, किसी already-open manager को अलग persisted session में mutate करके नहीं।
- Parent transcript fork decisions और fork creation अब `storePath` या
  `sessionsDir` accept नहीं करते; वे retained filesystem path metadata के बजाय
  `{agentId, sessionId}` SQLite transcript scope इस्तेमाल करते हैं।
- Memory-host अब no-op session-directory transcript classification helpers export
  नहीं करता; transcript filtering अब entry construction के दौरान SQLite row
  metadata से derive होती है।
- Memory-host और QMD session-export tests SQLite transcript scopes इस्तेमाल करते
  हैं। पुराने `agents/<agentId>/sessions/*.jsonl` paths केवल वहीं covered रहते
  हैं जहां कोई test जानबूझकर doctor/import/export compatibility prove कर रहा हो।
- QA-lab raw session inspection अब gateway के through `sessions.list` इस्तेमाल
  करता है
  `agents/qa/sessions/sessions.json` पढ़ने के बजाय; MSteams feedback
  JSONL पथ गढ़े बिना सीधे SQLite transcripts में जोड़ता है।
- साझा inbound channel turns अब legacy `storePath` के बजाय `{agentId, sessionKey}`
  ले जाते हैं। LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch, और QQBot recording paths अब updated-at metadata पढ़ते हैं और SQLite
  identity के जरिए inbound session rows record करते हैं।
- सक्रिय session rows से transcript locator persistence हटा दिया गया है।
  `resolveSessionTranscriptTarget` `agentId`, `sessionId`, और वैकल्पिक
  topic metadata लौटाता है; doctor ही एकमात्र code है जो legacy transcript file
  names import करता है।
- Runtime transcript headers SQLite version `1` से शुरू होते हैं। पुराने JSONL V1/V2/V3
  shape upgrades केवल doctor import में रहते हैं और rows store होने से पहले
  imported headers को वर्तमान SQLite transcript version में normalize करते हैं।
- database-first guard अब `SessionManager.listAll` और
  `SessionManager.forkFromSession` को ban करता है; session listing और fork/restore workflows
  row/scoped SQLite APIs पर ही रहने चाहिए।
- guard doctor/import code के बाहर legacy transcript JSONL parse/active-branch repair helper
  names को भी ban करता है, इसलिए runtime दूसरा legacy transcript migration path
  नहीं बढ़ा सकता।
- Embedded PI runs incoming transcript handles को reject करते हैं। वे worker launch से पहले
  और attempt के transcript state को छूने से पहले फिर से SQLite
  `{agentId, sessionId}` identity का उपयोग करते हैं। stale `/tmp/*.jsonl` input runtime
  write target नहीं चुन सकता।
- Cache trace, Anthropic payload, raw stream, और diagnostics timeline records
  अब typed SQLite `diagnostic_events` rows में लिखते हैं। Gateway stability bundles
  अब typed SQLite `diagnostic_stability_bundles` rows में लिखते हैं। पुराने
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`, और
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL override paths हटा दिए गए हैं, और
  सामान्य stability capture अब `logs/stability/*.json` files नहीं लिखता।
- Cron persistence अब हर save पर पूरी job table delete/reinsert करने के बजाय
  SQLite `cron_jobs` rows reconcile करता है। Plugin target
  writebacks matching cron rows को सीधे update करते हैं और runtime cron state को
  उसी state-database transaction में रखते हैं।
- Cron runtime callers अब stable SQLite cron store key का उपयोग करते हैं। Legacy
  `cron.store` paths केवल doctor import inputs हैं; production gateway, task
  maintenance, status, run-log, और Telegram target writeback paths
  `resolveCronStoreKey` का उपयोग करते हैं और अब key को path-normalize नहीं करते। Cron status अब
  पुराने file-shaped `storePath` field के बजाय `storeKey` report करता है।
- Cron runtime load और scheduling अब legacy persisted job
  shapes जैसे `jobId`, `schedule.cron`, numeric `atMs`, string booleans, या
  missing `sessionTarget` को normalize नहीं करते। rows SQLite में insert होने से पहले
  Doctor legacy import उन repairs का owner है।
- ACP spawn अब transcript JSONL file paths resolve या persist नहीं करता। Spawn
  और thread-bind setup SQLite session row को सीधे persist करते हैं और
  session id को retained transcript identity के रूप में रखते हैं।
- ACP session metadata APIs अब `agentId` से SQLite rows read/list/upsert करते हैं और
  ACP session entry contract के हिस्से के रूप में `storePath` expose नहीं करते।
- Session usage accounting और gateway usage aggregation अब केवल `{agentId, sessionId}` से
  transcripts resolve करते हैं। cost/usage cache और discovered-session
  summaries अब transcript locator strings synthesize या return नहीं करते।
- Gateway chat append, abort-partial persistence, `/sessions.send`, और
  webchat media transcript writes SQLite transcript scope के जरिए सीधे append करते हैं।
  gateway transcript-injection helper अब `transcriptLocator` parameter
  accept नहीं करता।
- SQLite transcript discovery अब केवल transcript scopes और stats list करता है:
  `{agentId, sessionId, updatedAt, eventCount}`। dead
  `listSqliteSessionTranscriptLocators` compatibility helper और per-row
  `locator` field हट गए हैं।
- Transcript repair runtime अब केवल
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` expose करता है। पुराना
  locator-based repair helper delete कर दिया गया है; doctor/debug code explicit
  source file paths पढ़ता है और locator strings कभी migrate नहीं करता।
- ACP replay ledger runtime अब `acp/event-ledger.json` के बजाय shared
  SQLite state database में per-session replay rows store करता है; doctor legacy file को import और
  remove करता है।
- Gateway transcript reader helpers अब पुराने
  `session-utils.fs` module name के बजाय
  `src/gateway/session-transcript-readers.ts` में रहते हैं। fallback retry history check का नाम
  पुराने file-helper surface के बजाय SQLite transcript content के लिए रखा गया है।
- Gateway injected-chat और compaction helpers अब values को transcript paths या
  source files नाम देने के बजाय internal helper APIs के जरिए SQLite transcript scope
  pass करते हैं।
- Bootstrap continuation detection अब
  `hasCompletedBootstrapTranscriptTurn` के जरिए SQLite transcript rows check करता है; यह अब file-shaped
  helper name expose नहीं करता।
- Embedded-runner tests अब SQLite transcript identity का उपयोग करते हैं, और नया
  transcript manager खोलने के लिए हमेशा explicit `sessionId` चाहिए।
- Memory indexing helpers अब end to end SQLite transcript terminology का उपयोग करते हैं:
  host `listSessionTranscriptScopesForAgent` और
  `sessionTranscriptKeyForScope` export करता है, targeted sync queues `sessionTranscripts`,
  public session-search hits opaque `transcript:<agent>:<session>` paths expose करते हैं,
  और internal DB source key fake file path के बजाय
  `source_kind='sessions'` के तहत `session:<session>` है।
- generic plugin SDK persistent-dedupe helper अब file-shaped
  options expose नहीं करता। Callers SQLite scope keys provide करते हैं और durable dedupe rows
  shared plugin state में रहती हैं।
- Microsoft Teams SSO tokens locked JSON files से SQLite plugin
  state में moved हो गए हैं। Doctor `msteams-sso-tokens.json` import करता है, payloads से canonical SSO token
  keys rebuild करता है, और source file remove करता है। Delegated OAuth tokens
  अपनी मौजूदा private credential-file boundary पर रहते हैं।
- Matrix sync cache state `bot-storage.json` से SQLite plugin
  state में moved हो गया है। Doctor legacy raw या wrapped sync payloads import करता है और
  source file remove करता है। Active Matrix और QA Matrix clients SQLite sync-store root
  directory pass करते हैं, fake `sync-store.json` या `bot-storage.json` path नहीं।
- Matrix legacy crypto migration status
  `legacy-crypto-migration.json` से SQLite plugin state में moved हो गया है। Doctor
  old status file import करता है; Matrix SDK IndexedDB snapshots
  `crypto-idb-snapshot.json` से SQLite plugin blobs में moved हो गए। Matrix recovery keys और
  credentials SQLite plugin-state rows हैं; उनकी पुरानी JSON files केवल doctor
  migration inputs हैं।
- Memory Wiki activity logs अब
  `.openclaw-wiki/log.jsonl` के बजाय SQLite plugin state का उपयोग करते हैं। Memory Wiki migration provider पुराने
  JSONL logs import करता है; wiki markdown और user vault content workspace content के रूप में
  file-backed रहते हैं।
- Memory Wiki अब `.openclaw-wiki/state.json` या unused
  `.openclaw-wiki/locks` directory नहीं बनाता। migration provider उन retired
  plugin metadata files को remove करता है अगर किसी older vault में वे अभी भी हों।
- Crestodian audit entries अब
  `audit/crestodian.jsonl` के बजाय core SQLite plugin state का उपयोग करते हैं। Doctor legacy JSONL audit log import करता है और
  successful import के बाद उसे remove करता है।
- Config write/observe audit entries अब
  `logs/config-audit.jsonl` के बजाय core SQLite plugin state का उपयोग करते हैं। Doctor legacy JSONL audit log import करता है और
  successful import के बाद उसे remove करता है।
- macOS companion अब `openclaw.json` edit करते समय app-local `logs/config-audit.jsonl` या
  `logs/config-health.json` sidecars नहीं लिखता। config
  file file-backed रहती है, recovery snapshots config file के पास रहते हैं,
  और durable config audit/health state Gateway SQLite store से संबंधित है।
- Crestodian rescue pending approvals अब
  `crestodian/rescue-pending/*.json` के बजाय core SQLite plugin state का उपयोग करते हैं। Doctor legacy pending approval
  files import करता है और successful import के बाद उन्हें remove करता है।
- Phone Control temporary arm state अब
  `plugins/phone-control/armed.json` के बजाय SQLite plugin state का उपयोग करता है। Doctor legacy armed-state
  file को `phone-control/arm-state` namespace में import करता है और file remove करता है।
- Doctor अब JSONL transcripts को in place repair नहीं करता या backup JSONL
  files नहीं बनाता। यह active branch को SQLite में import करता है और legacy source remove करता है।
- Session-memory hook transcript lookup `{agentId, sessionId}` scope-only
  SQLite reads का उपयोग करता है। इसका helper अब transcript locators,
  legacy file reads, या file-rewrite options accept या derive नहीं करता।
- Codex app-server conversation bindings अब SQLite plugin state को
  OpenClaw session key या explicit `{agentId, sessionId}` scope से key करते हैं। उन्हें
  transcript-path fallback bindings preserve नहीं करनी चाहिए।
- Codex app-server mirrored-history reads केवल SQLite transcript scope का उपयोग करते हैं;
  उन्हें transcript file paths से identity recover नहीं करनी चाहिए।
- Role-ordering और compaction reset paths अब पुराने transcript
  files unlink नहीं करते; reset केवल SQLite session row और transcript identity rotate करता है।
- Gateway reset और checkpoint responses clean session rows plus session
  ids return करते हैं। वे अब clients के लिए SQLite transcript locators synthesize नहीं करते।
- Memory-core dreaming अब missing
  JSONL files के लिए probe करके session rows prune नहीं करता। Subagent cleanup filesystem existence checks के बजाय
  session runtime API के जरिए जाता है। इसके transcript-ingestion tests
  `agents/<id>/sessions` fixtures या locator
  placeholders बनाने के बजाय सीधे SQLite rows seed करते हैं।
- Memory transcript indexing citation/read helpers के लिए virtual search-hit path के रूप में
  `transcript:<agentId>:<sessionId>` expose कर सकता है। durable index source
  relational है (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), इसलिए value runtime transcript locator नहीं है,
  filesystem path नहीं है, और उसे session runtime APIs में कभी वापस pass नहीं करना चाहिए।
- Gateway doctor memory status short-term recall और phase-signal counts
  `memory/.dreams/*.json` के बजाय SQLite plugin-state rows से पढ़ता है; CLI और
  doctor output अब उस storage को path नहीं, SQLite store के रूप में label करते हैं।
- Memory-core runtime, CLI status, Gateway doctor methods, और plugin SDK
  facades अब legacy `.dreams/session-corpus` files audit या archive नहीं करते।
  वे files केवल migration inputs हैं; doctor उन्हें SQLite में import करता है और
  verification के बाद source delete करता है। Active session-ingestion evidence rows
  अब virtual SQLite path `memory/session-ingestion/<day>.txt` का उपयोग करते हैं; runtime
  `.dreams/session-corpus` से कभी state नहीं लिखता या derive नहीं करता।
- Memory-core public artifacts SQLite host events को virtual JSON
  artifact `memory/events/memory-host-events.json` के रूप में expose करते हैं; वे अब
  legacy `.dreams/events.jsonl` source path reuse नहीं करते।
- Sandbox container/browser registries अब typed session, image, timestamp,
  backend/config, और browser port columns वाली shared
  `sandbox_registry_entries` SQLite table का उपयोग करते हैं। Doctor legacy monolithic और
  sharded JSON registry files import करता है और successful sources remove करता है। Runtime reads
  source of truth के रूप में typed row columns का उपयोग करते हैं; `entry_json` केवल replay/debug
  copy है।
- Commitments अब whole-store JSON blob के बजाय typed shared `commitments` table का उपयोग करते हैं।
  Snapshot saves commitment id से upsert करते हैं और table को clear और reinsert करने के बजाय केवल
  missing rows delete करते हैं। Runtime commitments को typed scope, delivery-window,
  status, attempt, और text columns से load करता है; `record_json` केवल replay/debug copy है।
  Doctor legacy `commitments.json` import करता है और successful import के बाद उसे remove करता है।
- Cron job definitions, schedule state, और run history में अब runtime
  JSON writers या readers नहीं हैं। Runtime typed schedule वाली `cron_jobs` rows का उपयोग करता है,
  payload, डिलीवरी, विफलता-अलर्ट, सत्र, स्थिति, और रनटाइम-स्थिति कॉलम, साथ ही स्थिति, डायग्नोस्टिक्स सारांश, डिलीवरी स्थिति/त्रुटि, सत्र/रन, मॉडल, और टोकन कुलों के लिए टाइप किया हुआ
  `cron_run_logs` मेटाडेटा। `job_json` केवल रीप्ले/डीबग कॉपी है; `state_json` नेस्टेड
  रनटाइम डायग्नोस्टिक्स रखता है जिनके पास अभी हॉट क्वेरी फ़ील्ड नहीं हैं, जबकि रनटाइम
  टाइप किए हुए कॉलम से हॉट स्थिति फ़ील्ड दोबारा हाइड्रेट करता है। Doctor
  पुराने `jobs.json`, `jobs-state.json`, और `runs/*.jsonl` फ़ाइलें आयात करता है और
  आयातित स्रोतों को हटाता है। Plugin लक्ष्य राइटबैक पूरे cron स्टोर को लोड करके बदलने के बजाय मेल खाने वाली `cron_jobs`
  पंक्तियों को अपडेट करते हैं।
- Gateway स्टार्टअप रनटाइम प्रोजेक्शन में पुराने `notify: true` मार्करों को अनदेखा करता है।
  Doctor उन्हें स्पष्ट SQLite डिलीवरी में बदलता है जब
  `cron.webhook` मान्य हो, सेट न होने पर निष्क्रिय मार्कर हटाता है, और कॉन्फ़िगर किया गया webhook अमान्य होने पर
  उन्हें चेतावनी के साथ सुरक्षित रखता है।
- आउटबाउंड और सत्र डिलीवरी कतारें अब कतार स्थिति, एंट्री प्रकार,
  सत्र कुंजी, चैनल, लक्ष्य, अकाउंट id, पुनःप्रयास संख्या, अंतिम प्रयास/त्रुटि,
  रिकवरी स्थिति, और प्लेटफ़ॉर्म-भेजें मार्करों को साझा
  `delivery_queue_entries` तालिका में टाइप किए हुए कॉलम के रूप में संग्रहीत करती हैं। रनटाइम रिकवरी उन हॉट फ़ील्ड को
  टाइप किए हुए कॉलम से पढ़ती है, और पुनःप्रयास/रिकवरी म्यूटेशन रीप्ले JSON दोबारा लिखे बिना उन कॉलम को सीधे
  अपडेट करते हैं। पूरा JSON payload केवल संदेश बॉडी और अन्य ठंडे रीप्ले डेटा के लिए
  रीप्ले/डीबग blob के रूप में रहता है।
- प्रबंधित आउटगोइंग इमेज रिकॉर्ड अब टाइप की हुई साझा
  `managed_outgoing_image_records` पंक्तियों का उपयोग करते हैं, जबकि मीडिया बाइट अभी भी
  `media_blobs` में संग्रहीत रहते हैं। JSON रिकॉर्ड केवल रीप्ले/डीबग कॉपी के रूप में रहता है।
- Discord मॉडल-पिकर प्राथमिकताएं, कमांड-डिप्लॉय hash, और थ्रेड बाइंडिंग
  अब साझा SQLite Plugin स्थिति का उपयोग करते हैं। उनकी पुरानी JSON आयात योजनाएं
  Discord Plugin सेटअप/doctor माइग्रेशन सतह में रहती हैं, core माइग्रेशन कोड में नहीं।
- Plugin पुराने आयात डिटेक्टर doctor-नामित मॉड्यूल जैसे
  `doctor-legacy-state.ts` या `doctor-state-imports.ts` का उपयोग करते हैं; सामान्य चैनल रनटाइम
  मॉड्यूल पुराने JSON डिटेक्टर आयात नहीं करने चाहिए।
- BlueBubbles catchup cursor और inbound dedupe marker अब साझा SQLite
  Plugin स्थिति का उपयोग करते हैं। उनकी पुरानी JSON आयात योजनाएं BlueBubbles Plugin
  सेटअप/doctor माइग्रेशन सतह में रहती हैं, core माइग्रेशन कोड में नहीं।
- Telegram अपडेट offset, sticker cache पंक्तियां, sent-message cache पंक्तियां,
  topic-name cache पंक्तियां, और thread bindings अब साझा SQLite Plugin
  स्थिति का उपयोग करते हैं। उनकी पुरानी JSON आयात योजनाएं Telegram Plugin
  सेटअप/doctor माइग्रेशन सतह में रहती हैं, core माइग्रेशन कोड में नहीं।
- iMessage catchup cursor, reply short-id mapping, और sent-echo dedupe पंक्तियां
  अब साझा SQLite Plugin स्थिति का उपयोग करती हैं। पुरानी `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, और `imessage/sent-echoes.jsonl` फ़ाइलें केवल
  doctor इनपुट हैं।
- Feishu संदेश dedupe पंक्तियां अब
  `feishu/dedup/*.json` फ़ाइलों के बजाय साझा SQLite Plugin स्थिति का उपयोग करती हैं। इसकी पुरानी JSON आयात योजना Feishu
  Plugin सेटअप/doctor माइग्रेशन सतह में रहती है, core माइग्रेशन कोड में नहीं।
- Microsoft Teams बातचीत, poll, लंबित अपलोड buffer, और feedback
  learning अब साझा SQLite Plugin स्थिति/blob तालिकाओं का उपयोग करते हैं। लंबित अपलोड
  पथ `plugin_blob_entries` का उपयोग करता है ताकि मीडिया buffer base64 JSON के बजाय SQLite BLOB के रूप में
  संग्रहीत हों। रनटाइम helper नाम अब `*-fs` file-store नामकरण के बजाय SQLite/स्थिति नामकरण
  का उपयोग करते हैं, और पुराना `storePath` shim इन स्टोर से हटा दिया गया है। इसकी पुरानी JSON आयात योजना Microsoft Teams
  Plugin सेटअप/doctor माइग्रेशन सतह में रहती है।
- Zalo hosted outbound media अब `openclaw-zalo-outbound-media` JSON/bin temp sidecar के बजाय साझा SQLite `plugin_blob_entries`
  का उपयोग करता है।
- Diffs viewer HTML और metadata अब `meta.json`/`viewer.html` temp फ़ाइलों के बजाय साझा SQLite `plugin_blob_entries`
  का उपयोग करते हैं। रेंडर किए गए PNG/PDF आउटपुट temp materializations बने रहते हैं
  क्योंकि चैनल डिलीवरी को अभी भी फ़ाइल पथ चाहिए।
- Canvas प्रबंधित दस्तावेज़ अब डिफ़ॉल्ट `state/canvas/documents` डायरेक्टरी के बजाय साझा SQLite `plugin_blob_entries`
  का उपयोग करते हैं। Canvas host उन blobs को सीधे serve करता है; स्थानीय फ़ाइलें केवल स्पष्ट `host.root`
  operator content या अस्थायी materialization के लिए बनाई जाती हैं जब किसी downstream media reader को
  पथ चाहिए।
- File Transfer audit निर्णय अब असीमित `audit/file-transfer.jsonl` रनटाइम log के बजाय साझा SQLite `plugin_state_entries`
  का उपयोग करते हैं। Doctor
  पुरानी JSONL audit फ़ाइल को Plugin स्थिति में आयात करता है और साफ़ आयात के बाद स्रोत
  हटा देता है।
- ACPX process lease और gateway instance identity अब साझा SQLite Plugin
  स्थिति का उपयोग करते हैं। Doctor पुरानी `gateway-instance-id` फ़ाइल को Plugin स्थिति में आयात करता है
  और स्रोत हटा देता है।
- ACPX generated wrapper scripts और isolated Codex home OpenClaw temp root के अंतर्गत अस्थायी
  materialization हैं, टिकाऊ OpenClaw स्थिति नहीं। टिकाऊ ACPX रनटाइम रिकॉर्ड SQLite lease और gateway-instance पंक्तियां हैं;
  पुराना ACPX `stateDir` config surface हटा दिया गया है क्योंकि अब वहां कोई रनटाइम स्थिति
  नहीं लिखी जाती।
- Gateway media attachments अब canonical byte store के रूप में साझा `media_blobs` SQLite तालिका का
  उपयोग करते हैं। चैनल और sandbox compatibility सतहों को लौटाए गए स्थानीय पथ
  database row के temp materializations हैं, टिकाऊ media store नहीं। रनटाइम media allowlist में अब पुराने
  `$OPENCLAW_STATE_DIR/media` या config-dir `media` root शामिल नहीं हैं; वे डायरेक्टरी केवल
  doctor आयात स्रोत हैं।
- Shell completion अब `$OPENCLAW_STATE_DIR/completions/*` cache
  फ़ाइलें नहीं लिखता। Install, doctor, update, और release smoke पथ टिकाऊ completion cache
  फ़ाइलों के बजाय generated completion output या profile sourcing का उपयोग करते हैं।
- Gateway skill-upload staging अब साझा `skill_uploads` पंक्तियों का उपयोग करता है। Upload
  metadata, idempotency keys, और archive bytes SQLite में रहते हैं; installer
  को install चलते समय केवल एक temporary materialized archive path मिलता है।
- Subagent inline attachments अब workspace
  `.openclaw/attachments/*` के अंतर्गत materialize नहीं होते। spawn path SQLite VFS seed entries तैयार करता है,
  inline runs उन entries को per-agent runtime scratch namespace में seed करते हैं,
  और disk-backed tools attachment paths के लिए उस SQLite scratch को overlay करते हैं। पुराने subagent-run attachment-dir registry columns और cleanup hooks हट गए हैं।
- CLI image hydration अब स्थिर `openclaw-cli-images` cache
  फ़ाइलें बनाए नहीं रखता। External CLI backends अभी भी file paths प्राप्त करते हैं, लेकिन वे paths
  cleanup के साथ per-run temp materializations होते हैं।
- Cache-trace diagnostics, Anthropic payload diagnostics, raw model stream
  diagnostics, diagnostics timeline events, और Gateway stability bundles अब
  `logs/*.jsonl` या `logs/stability/*.json` फ़ाइलों के बजाय SQLite rows
  लिखते हैं।
  Runtime path override flags और env vars हटा दिए गए हैं; export/debug
  commands database rows से files स्पष्ट रूप से materialize कर सकते हैं।
- macOS companion में अब rolling `diagnostics.jsonl` writer नहीं है। App
  logs unified logging में जाते हैं, और durable Gateway diagnostics SQLite-backed रहते हैं।
- macOS port-guardian record list अब Application Support JSON file
  या opaque singleton blob के बजाय typed shared SQLite
  `macos_port_guardian_records` rows का उपयोग करती है।
- Gateway singleton locks अब temp-dir lock files के बजाय
  `gateway_locks` scope के अंतर्गत typed shared SQLite `state_leases` rows का उपयोग करते हैं। Fly और OAuth
  troubleshooting docs अब stale file-lock cleanup के बजाय SQLite lease/auth refresh lock की ओर
  संकेत करते हैं।
- Gateway restart sentinel state अब `restart-sentinel.json` के बजाय typed shared SQLite
  `gateway_restart_sentinel` rows का उपयोग करती है; runtime
  sentinel kind, status, routing, message, continuation, और stats को
  typed columns से पढ़ता है। `payload_json` केवल replay/debug copy है। Runtime code
  SQLite row को सीधे clear करता है और अब file cleanup plumbing नहीं रखता।
- Gateway restart intent और supervisor handoff state अब
  `gateway-restart-intent.json` और
  `gateway-supervisor-restart-handoff.json` sidecars के बजाय typed shared
  SQLite `gateway_restart_intent` और `gateway_restart_handoff` rows का उपयोग करते हैं।
- Gateway singleton coordination अब
  `gateway.<hash>.lock` files लिखने के बजाय `gateway_locks` के अंतर्गत typed `state_leases` rows का उपयोग करता है। lease row
  lock owner, expiry, heartbeat, और debug payload को own करता है; SQLite
  atomic acquire/release boundary को own करता है। retired file-lock directory option
  हट गया है; tests सीधे SQLite row identity का उपयोग करते हैं।
- पुराना unreferenced cron usage-report helper, जो `cron/runs/*.jsonl`
  files scan करता था, हटा दिया गया। Cron run history reports को typed
  `cron_run_logs` SQLite rows पढ़नी चाहिए।
- Main-session restart recovery अब `agents/*/sessions`
  directories scan करने के बजाय SQLite `agent_databases` registry के माध्यम से candidate agents discover करता है।
- Gemini session-corruption recovery अब केवल SQLite session row हटाता है;
  उसे अब legacy `storePath` gate की आवश्यकता नहीं है या derived
  transcript JSONL path unlink करने की कोशिश नहीं करता।
- Path override handling अब literal `undefined`/`null` environment
  values को unset मानता है, जिससे tests या shell handoff के दौरान accidental repo-root `undefined/state/*.sqlite`
  databases रोके जाते हैं।
- Config health fingerprints अब `logs/config-health.json` के बजाय typed shared SQLite `config_health_entries`
  rows का उपयोग करते हैं, जिससे normal config file ही एकमात्र non-credential configuration document रहती है। macOS companion केवल
  process-local health state रखता है और पुराना JSON sidecar दोबारा नहीं बनाता।
- Auth profile runtime अब credential JSON files आयात या लिखता नहीं है। Canonical credential store SQLite है; `auth-profiles.json`, per-agent
  `auth.json`, और shared `credentials/oauth.json` doctor migration inputs हैं
  जिन्हें import के बाद हटा दिया जाता है।
- Auth profile save/state tests अब typed SQLite auth tables को सीधे assert करते हैं
  और legacy auth-profile filenames का उपयोग केवल doctor migration inputs के लिए करते हैं।
- `openclaw secrets apply` केवल config file, env file, और SQLite
  auth-profile store को scrub करता है। यह अब retired per-agent `auth.json` edit करने वाला
  compatibility logic नहीं रखता; doctor उस file को import और delete करने का मालिक है।
- Hermes secret migration plans और applies imported API-key profiles को सीधे
  SQLite auth-profile store में डालते हैं। यह अब intermediate target के रूप में
  `auth-profiles.json` लिखता या verify नहीं करता।
- User-facing auth docs अब users को `auth-profiles.json` inspect या copy करने को कहने के बजाय
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` का वर्णन करते हैं; legacy OAuth/auth JSON
  नाम केवल doctor-import inputs के रूप में documented रहते हैं।
- Core state-path helpers अब retired `credentials/oauth.json`
  file expose नहीं करते। legacy filename doctor auth import path के लिए local है।
- Install, security, onboarding, model-auth, और SecretRef docs अब
  per-agent auth-profile JSON files के बजाय SQLite auth-profile rows और whole-state backup/migration का वर्णन करते हैं।
- PI model discovery अब canonical credentials को in-memory
  `pi-coding-agent` auth storage में pass करता है। यह discovery के दौरान अब
  per-agent `auth.json` create, scrub, या write नहीं करता।
- Voice Wake trigger और routing settings अब `settings/voicewake.json`, `settings/voicewake-routing.json`, या
  opaque generic rows के बजाय typed shared SQLite tables का उपयोग करते हैं; doctor legacy JSON files import करता है और
  successful migration के बाद उन्हें हटा देता है।
- Update-check state अब `update-check.json` या opaque generic blob के बजाय typed shared `update_check_state` row का उपयोग करती है; doctor
  legacy JSON file import करता है और successful migration के बाद उसे हटा देता है।
- Config health state अब `logs/config-health.json` या opaque generic blob के बजाय typed shared `config_health_entries` rows का उपयोग करती है; doctor
  legacy JSON file import करता है और successful migration के बाद उसे हटा देता है।
- Plugin conversation binding approvals अब opaque shared SQLite state या के बजाय typed
  `plugin_binding_approvals` rows का उपयोग करते हैं
  `plugin-binding-approvals.json`; लेगेसी फ़ाइल doctor माइग्रेशन इनपुट है।
- सामान्य वर्तमान-वार्तालाप bindings अब
  `bindings/current-conversations.json` को फिर से लिखने के बजाय टाइप की हुई
  `current_conversation_bindings` पंक्तियां संग्रहीत करते हैं; doctor लेगेसी JSON फ़ाइल आयात करता है और
  सफल माइग्रेशन के बाद उसे हटा देता है।
- Memory Wiki imported-source sync ledgers अब `.openclaw-wiki/source-sync.json` को
  फिर से लिखने के बजाय प्रति vault/source कुंजी एक SQLite plugin-state पंक्ति
  संग्रहीत करते हैं; migration provider लेगेसी JSON ledger को आयात और हटा देता है।
- Memory Wiki ChatGPT import-run रिकॉर्ड अब `.openclaw-wiki/import-runs/*.json` लिखने के बजाय
  प्रति vault/run id एक SQLite plugin-state पंक्ति
  संग्रहीत करते हैं। Rollback snapshots स्पष्ट vault फ़ाइलें बनी रहती हैं जब तक import-run snapshot
  archival को blob storage में नहीं ले जाया जाता।
- Memory Wiki compiled digests अब
  `.openclaw-wiki/cache/agent-digest.json` और
  `.openclaw-wiki/cache/claims.jsonl` लिखने के बजाय SQLite plugin blob पंक्तियां संग्रहीत करते हैं। Migration provider पुरानी cache
  फ़ाइलें आयात करता है और cache directory खाली होने पर उसे हटा देता है।
- ClawHub skill install tracking अब runtime पर `.clawhub/lock.json` और
  `.clawhub/origin.json` sidecars लिखने या पढ़ने के बजाय प्रति
  workspace/skill एक SQLite plugin-state पंक्ति संग्रहीत करता है। Runtime code file-shaped lockfile/origin abstractions के बजाय tracked-install
  state objects का उपयोग करता है। Doctor
  configured agent workspaces से legacy sidecars आयात करता है और clean import के बाद उन्हें हटा देता है।
- Installed plugin index अब `plugins/installs.json` के बजाय typed shared SQLite
  `installed_plugin_index` singleton row पढ़ता और लिखता है; legacy JSON फ़ाइल
  केवल doctor migration input है और import के बाद हटा दी जाती है।
- Legacy `plugins/installs.json` path helper अब doctor legacy
  code में रहता है। Runtime plugin-index modules केवल SQLite-backed persistence
  options expose करते हैं, JSON file path नहीं।
- Gateway restart sentinel, restart intent, और supervisor handoff state अब generic
  opaque blobs के बजाय typed shared SQLite rows (`gateway_restart_sentinel`,
  `gateway_restart_intent`, और `gateway_restart_handoff`) का उपयोग करते हैं।
  Runtime restart code में file-shaped sentinel/intent/handoff
  contract नहीं है।
- Matrix sync cache, storage metadata, thread bindings, inbound dedupe markers,
  startup verification cooldown state, SDK IndexedDB crypto snapshots,
  credentials, और recovery keys अब shared SQLite plugin state/blob
  tables का उपयोग करते हैं। Runtime path structs अब `storage-meta.json` metadata
  path expose नहीं करते; वह filename केवल legacy migration input है। उनका legacy JSON import
  plan Matrix plugin setup/doctor migration surface में रहता है।
- Matrix startup अब legacy Matrix file
  state को scan, report, या complete नहीं करता। Matrix file detection, legacy crypto snapshot creation, room-key
  restore migration state, import, और source removal सब doctor-owned हैं।
- Matrix runtime migration barrels हटा दिए गए। Legacy state/crypto detection
  और mutation helpers Matrix doctor द्वारा सीधे import किए जाते हैं, runtime API surface का
  हिस्सा होने के बजाय।
- Matrix migration snapshot reuse markers अब `matrix/migration-snapshot.json` के बजाय SQLite plugin state
  में रहते हैं; doctor अब भी sidecar state file लिखे बिना वही
  verified pre-migration archive reuse कर सकता है।
- Nostr bus cursors और profile publish state अब shared SQLite plugin
  state का उपयोग करते हैं। उनका legacy JSON import plan Nostr plugin setup/doctor
  migration surface में रहता है।
- Active Memory session toggles अब `session-toggles.json` के बजाय
  shared SQLite plugin state का उपयोग करते हैं; memory को वापस on toggle करने पर JSON object को
  फिर से लिखने के बजाय row delete होती है।
- Skill Workshop proposals और review counters अब per-workspace
  `skill-workshop/<workspace>.json` stores के बजाय shared SQLite plugin
  state का उपयोग करते हैं। हर proposal `skill-workshop/proposals` के तहत अलग row है, और review
  counter `skill-workshop/reviews` के तहत अलग row है।
- Skill Workshop reviewer subagent runs अब `skill-workshop/<sessionId>.json` sidecar session
  paths बनाने के बजाय runtime session transcript
  resolver का उपयोग करते हैं।
- ACPX process leases अब whole-file `process-leases.json` registry के बजाय
  `acpx/process-leases` के तहत shared SQLite plugin state का उपयोग करते हैं।
  हर lease अपनी row के रूप में stored है, जिससे runtime JSON rewrite path के बिना
  startup stale-process reaping सुरक्षित रहती है।
- ACPX wrapper scripts और isolated Codex home
  OpenClaw temp root में generate होते हैं। उन्हें जरूरत के अनुसार फिर बनाया जाता है और वे backup या
  migration inputs नहीं हैं।
- Subagent run registry persistence typed shared `subagent_runs` rows का उपयोग करता है। पुराना
  `subagents/runs.json` path अब केवल doctor migration input है, और
  runtime helper names अब state layer को disk-backed के रूप में वर्णित नहीं करते।
  Runtime tests अब registry behavior साबित करने के लिए invalid या empty `runs.json` fixtures
  नहीं बनाते; वे सीधे SQLite rows seed/read करते हैं।
- Backup archive करने से पहले state directory stage करता है, non-database files copy करता है,
  `VACUUM INTO` के साथ `*.sqlite` databases snapshot करता है, live WAL/SHM
  sidecars छोड़ता है, archive manifest में snapshot metadata record करता है, और
  completed backup runs को archive manifest के साथ SQLite में record करता है। `openclaw backup
create` लिखे गए archive को default रूप से validate करता है; `--no-verify`
  स्पष्ट fast path है।
- `openclaw backup restore` extraction से पहले archive validate करता है, verifier के
  normalized manifest को reuse करता है, और verified manifest assets को उनके
  recorded source paths पर restore करता है। यह writes के लिए `--yes` मांगता है और restore plan के लिए `--dry-run`
  support करता है।
- पुराना backup volatile-path filter delete कर दिया गया है। Backup को अब legacy session या cron JSON/JSONL files के लिए
  live-tar skip list की जरूरत नहीं है क्योंकि SQLite
  snapshots archive creation से पहले staged होते हैं।
- Plain setup और onboarding workspace preparation अब
  `agents/<agentId>/sessions/` directories नहीं बनाते। वे केवल config/workspace बनाते हैं;
  SQLite session rows और transcript rows demand पर
  per-agent database में बनाए जाते हैं।
- Security permission repair अब `sessions.json` और transcript
  JSONL files के बजाय global और per-agent SQLite
  databases plus WAL/SHM sidecars को target करता है।
- Sandbox registry runtime names अब active store के जरिए legacy JSON registry terminology carrying करने के बजाय
  SQLite registry kinds को सीधे describe करते हैं।
- `openclaw reset --scope config+creds+sessions` per-agent
  `openclaw-agent.sqlite` databases plus WAL/SHM sidecars हटाता है, केवल legacy
  `sessions/` directories नहीं।
- Gateway aggregate session helpers अब entry-oriented names का उपयोग करते हैं:
  `loadCombinedSessionEntriesForGateway` `{ databasePath, entries }` return करता है।
  पुरानी combined-store naming runtime callers से हटा दी गई है।
- Docker MCP channel seeding अब `sessions.json` और JSONL transcript बनाने के बजाय main session row और transcript
  events को per-agent SQLite database में लिखता है।
- Bundled session-memory hook अब previous-session context को
  SQLite से `{agentId, sessionId}` द्वारा resolve करता है। यह अब transcript paths या `workspace/sessions` directories को
  scan, store, या synthesize नहीं करता।
- Bundled command-logger hook अब `logs/commands.log` में append करने के बजाय command audit rows को shared
  SQLite `command_log_entries` table में लिखता है।
- Channel pairing allowlists अब runtime और plugin SDK में केवल SQLite-backed read/write helpers
  expose करते हैं। पुराना `*-allowFrom.json` path resolver और
  file reader केवल doctor legacy import code के तहत रहते हैं।
- `migration_runs` legacy-state migration executions को status,
  timestamps, और JSON reports के साथ record करता है।
- `migration_sources` हर imported legacy file source को hash, size,
  record count, target table, run id, status, और source-removal state के साथ record करता है।
- `backup_runs` backup archive paths, status, और JSON manifests record करता है।
- Global schema unused `agents` registry table नहीं रखता। Agent
  database discovery canonical `agent_databases` registry है जब तक runtime के पास real agent-record owner नहीं होता।
- Generated model catalog config agent directory द्वारा keyed typed global SQLite
  `agent_model_catalogs` rows में stored है। Runtime callers
  `ensureOpenClawModelCatalog` का उपयोग करते हैं; runtime code में कोई `models.json` compatibility API नहीं है। Implementation SQLite लिखता है और embedded PI registry उस stored payload से
  hydrated होता है, `models.json` file बनाए बिना।
- QMD session transcript markdown export और `memory.qmd.sessions` config
  हटा दिए गए। कोई QMD transcript collection नहीं है, कोई `qmd/sessions*` runtime
  path नहीं है, और कोई file-backed session memory bridge नहीं है।
- Memory-core runtime SQLite transcript indexing helpers को
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` से import करता है, QMD SDK subpath से नहीं। QMD subpath
  external callers के लिए compatibility re-export रखता है केवल तब तक जब तक major SDK cleanup उसे हटा नहीं सकता।
- QMD का अपना `index.sqlite` अब main SQLite `plugin_blob_entries` table द्वारा backed temp runtime materialization है। Runtime अब durable
  `~/.openclaw/agents/<agentId>/qmd` sidecar नहीं बनाता।
- Optional `memory-lancedb` plugin अब
  `~/.openclaw/memory/lancedb` को implicit OpenClaw-managed store के रूप में नहीं बनाता। यह एक
  external LanceDB backend है और तब तक disabled रहता है जब तक operator explicit `dbPath` configure नहीं करता।
- `check:database-first-legacy-stores` नए runtime source को fail करता है जो legacy store names को write-style filesystem APIs के साथ pair करता है। यह उस runtime
  source को भी fail करता है जो retired transcript bridge markers
  `transcriptLocator` या `sqlite-transcript://...` को फिर से introduce करता है। Migration, doctor, import,
  और explicit non-session export code allowed रहते हैं। Broader legacy contract
  names जैसे `sessionFile`, `storePath`, और पुराने `SessionManager` file-era
  facades के अभी current owners हैं और required preflight check बनने से पहले उन्हें separate migration guard work
  चाहिए। Guard अब runtime `cache/*.json` stores, generic
  `thread-bindings.json` sidecars, cron state/run-log JSON, config health JSON,
  restart और lock sidecars, Voice Wake settings, plugin binding approvals,
  installed plugin index JSON, File Transfer audit JSONL, Memory Wiki activity
  logs, पुराने bundled `command-logger` text log, और pi-mono raw-stream JSONL
  diagnostics knobs को भी cover करता है। यह पुराने root-level doctor legacy module names को भी ban करता है ताकि
  compatibility code `src/commands/doctor/` के तहत रहे। Android debug handlers
  भी `camera_debug.log` या
  `debug_logs.txt` cache files stage करने के बजाय logcat/in-memory output का उपयोग करते हैं।

## लक्ष्य स्कीमा संरचना

स्कीमा स्पष्ट रखें। होस्ट-स्वामित्व वाली रनटाइम स्थिति टाइप की गई टेबलों का उपयोग करती है। Plugin-स्वामित्व वाली
अपारदर्शी स्थिति `plugin_state_entries` / `plugin_blob_entries` का उपयोग करती है; कोई
सामान्य होस्ट `kv` टेबल नहीं है।

वैश्विक डेटाबेस:

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

एजेंट डेटाबेस:

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

भविष्य की खोज कैनॉनिकल इवेंट टेबलों को बदले बिना FTS टेबल जोड़ सकती है:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

बड़े मानों को JSON स्ट्रिंग एन्कोडिंग नहीं, बल्कि `blob` कॉलम का उपयोग करना चाहिए। छोटे संरचित डेटा के लिए
`value_json` रखें, जिसे सामान्य SQLite टूलिंग से निरीक्षण योग्य बने रहना चाहिए।

`agent_databases` इस ब्रांच के लिए कैनॉनिकल रजिस्ट्री है। जब तक कोई वास्तविक एजेंट-रिकॉर्ड स्वामी मौजूद न हो,
`agents` टेबल न जोड़ें; एजेंट कॉन्फ़िगरेशन
`openclaw.json` में ही रहता है।

## डॉक्टर माइग्रेशन संरचना

डॉक्टर को एक स्पष्ट माइग्रेशन चरण कॉल करना चाहिए जो रिपोर्ट किया जा सके और दोबारा चलाने के लिए सुरक्षित हो:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` सामान्य कॉन्फ़िगरेशन प्रीफ्लाइट के बाद स्थिति माइग्रेशन कार्यान्वयन को आमंत्रित करता है और इम्पोर्ट से पहले एक सत्यापित बैकअप बनाता है। रनटाइम
स्टार्टअप और `openclaw migrate` को लेगेसी OpenClaw स्थिति फ़ाइलें इम्पोर्ट नहीं करनी चाहिए।

माइग्रेशन गुण:

- एक माइग्रेशन पास सभी लेगेसी फ़ाइल स्रोतों को खोजता है और कुछ भी बदलने से पहले एक योजना बनाता है।
- डॉक्टर लेगेसी फ़ाइलें इम्पोर्ट करने से पहले एक सत्यापित प्री-माइग्रेशन बैकअप आर्काइव बनाता है।
- इम्पोर्ट idempotent होते हैं और स्रोत पथ, mtime, आकार, हैश, और लक्ष्य
  टेबल से की किए जाते हैं।
- सफल स्रोत फ़ाइलों को लक्ष्य डेटाबेस के कमिट होने के बाद हटाया या आर्काइव किया जाता है।
- असफल इम्पोर्ट स्रोत को अनछुआ छोड़ते हैं और
  `migration_runs` में चेतावनी रिकॉर्ड करते हैं।
- माइग्रेशन मौजूद होने के बाद रनटाइम कोड केवल SQLite पढ़ता है।
- किसी डाउनग्रेड/एक्सपोर्ट-टू-रनटाइम-फ़ाइल्स पथ की आवश्यकता नहीं है।

## माइग्रेशन इन्वेंटरी

इन्हें वैश्विक डेटाबेस में ले जाएँ:

- टास्क रजिस्ट्री रनटाइम राइट्स अब साझा डेटाबेस का उपयोग करते हैं; अनशिप्ड
  `tasks/runs.sqlite` साइडकार इंपोर्टर हटा दिया गया है। स्नैपशॉट सेव टास्क
  id के आधार पर अपसर्ट करते हैं और केवल अनुपस्थित टास्क/डिलीवरी पंक्तियां हटाते हैं।
- Task Flow रनटाइम राइट्स अब साझा डेटाबेस का उपयोग करते हैं; अनशिप्ड
  `tasks/flows/registry.sqlite` साइडकार इंपोर्टर हटा दिया गया है। स्नैपशॉट सेव
  flow id के आधार पर अपसर्ट करते हैं और केवल अनुपस्थित flow पंक्तियां हटाते हैं।
- Plugin स्टेट रनटाइम राइट्स अब साझा डेटाबेस का उपयोग करते हैं; अनशिप्ड
  `plugin-state/state.sqlite` साइडकार इंपोर्टर हटा दिया गया है।
- बिल्टइन मेमोरी सर्च अब डिफ़ॉल्ट रूप से `memory/<agentId>.sqlite` का उपयोग नहीं करता; इसकी
  इंडेक्स टेबल्स मालिक एजेंट डेटाबेस में रहती हैं, और स्पष्ट
  `memorySearch.store.path` साइडकार ऑप्ट-इन को doctor कॉन्फिग
  माइग्रेशन में रिटायर कर दिया गया है।
- बिल्टइन मेमोरी रीइंडेक्स एजेंट डेटाबेस में केवल मेमोरी-स्वामित्व वाली टेबल्स रीसेट करता है।
  इसे पूरी SQLite फ़ाइल को नहीं बदलना चाहिए, क्योंकि वही डेटाबेस
  सेशंस, ट्रांसक्रिप्ट्स, VFS पंक्तियां, आर्टिफैक्ट्स, और रनटाइम कैशेज का मालिक है।
- मोनोलिथिक और शार्डेड JSON से sandbox कंटेनर/ब्राउज़र रजिस्ट्रियां। रनटाइम
  राइट्स अब साझा डेटाबेस का उपयोग करते हैं; legacy JSON इंपोर्ट बना रहता है।
- Cron जॉब परिभाषाएं, शेड्यूल स्टेट, और रन हिस्ट्री अब साझा SQLite का उपयोग करते हैं;
  doctor legacy `jobs.json`, `jobs-state.json`, और
  `cron/runs/*.jsonl` फ़ाइलों को इंपोर्ट/हटाता है
- डिवाइस आइडेंटिटी/auth, push, अपडेट चेक, commitments, OpenRouter मॉडल
  कैश, इंस्टॉल्ड Plugin इंडेक्स, और app-server bindings
- डिवाइस/node pairing और bootstrap records अब टाइप्ड SQLite टेबल्स का उपयोग करते हैं
- Device-pair नोटिफिकेशन subscribers और delivered-request markers अब
  `device-pair-notify.json` के बजाय साझा SQLite plugin-state टेबल का उपयोग करते हैं।
- Voice-call कॉल रिकॉर्ड्स अब `calls.jsonl` के बजाय
  `voice-call` / `calls` namespace के तहत साझा SQLite plugin-state टेबल का उपयोग करते हैं; Plugin CLI
  SQLite-backed कॉल हिस्ट्री को tail और summarize करता है।
- QQBot Gateway सेशंस, known-user records, और ref-index quote cache अब
  `session-*.json`, `known-users.json`, और
  `ref-index.jsonl` के बजाय `qqbot` namespaces (`sessions`, `known-users`,
  `ref-index`) के तहत SQLite Plugin state का उपयोग करते हैं; QQBot doctor/setup migration
  legacy फ़ाइलों को इंपोर्ट और हटाता है।
- Discord model-picker preferences, command-deploy hashes, और thread bindings
  अब `model-picker-preferences.json`, `command-deploy-cache.json`, और
  `thread-bindings.json` के बजाय `discord` namespaces
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  के तहत SQLite Plugin state का उपयोग करते हैं; Discord doctor/setup migration इंपोर्ट करता है और
  legacy फ़ाइलों को हटाता है।
- BlueBubbles catchup cursors और inbound dedupe markers अब
  `bluebubbles/catchup/*.json` और
  `bluebubbles/inbound-dedupe/*.json` के बजाय `bluebubbles` namespaces (`catchup-cursors`, `inbound-dedupe`)
  के तहत SQLite Plugin state का उपयोग करते हैं; BlueBubbles doctor/setup migration
  legacy फ़ाइलों को इंपोर्ट और हटाता है।
- Telegram update offsets, sticker cache entries, reply-chain message cache
  entries, sent-message cache entries, topic-name cache entries, और thread
  bindings अब `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json`, और
  `thread-bindings-*.json` के बजाय `telegram` namespaces
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) के तहत SQLite Plugin state का उपयोग करते हैं; Telegram doctor/setup migration इंपोर्ट करता है और
  legacy फ़ाइलों को हटाता है।
- iMessage catchup cursors, reply short-id mappings, और sent-echo dedupe rows
  अब `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, और `imessage/sent-echoes.jsonl` के बजाय `imessage` namespaces (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) के तहत SQLite Plugin state का उपयोग करते हैं; iMessage
  doctor/setup migration legacy फ़ाइलों को इंपोर्ट और हटाता है।
- Microsoft Teams conversations, polls, SSO tokens, और feedback learnings अब
  `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, और `*.learnings.json` के बजाय SQLite Plugin state namespaces (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) का उपयोग करते हैं; Microsoft Teams doctor/setup migration
  legacy फ़ाइलों को इंपोर्ट और archive करता है।
  Pending uploads एक short-lived SQLite cache हैं और पुरानी JSON cache files
  migrate नहीं की जातीं।
- Matrix sync cache, storage metadata, thread bindings, inbound dedupe markers,
  startup verification cooldown state, credentials, recovery keys, और SDK
  IndexedDB crypto snapshots अब `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`)
  के तहत SQLite Plugin state/blob namespaces का उपयोग करते हैं,
  `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, और `crypto-idb-snapshot.json` के बजाय; Matrix doctor/setup
  migration account-scoped Matrix storage roots से उन legacy फ़ाइलों को इंपोर्ट और हटाता है।
- Nostr bus cursors और profile publish state अब
  `bus-state-*.json` और `profile-state-*.json` के बजाय
  `nostr` namespaces (`bus-state`, `profile-state`) के तहत SQLite Plugin state का उपयोग करते हैं; Nostr doctor/setup
  migration legacy फ़ाइलों को इंपोर्ट और हटाता है।
- Active Memory session toggles अब `session-toggles.json` के बजाय
  `active-memory/session-toggles` के तहत SQLite Plugin state का उपयोग करते हैं।
- Skill Workshop proposal queues और review counters अब
  per-workspace `skill-workshop/<workspace>.json` files के बजाय
  `skill-workshop/proposals` और `skill-workshop/reviews` के तहत SQLite Plugin state का उपयोग करते हैं।
- Outbound delivery और session delivery queues अब durable
  `delivery-queue/*.json`, `delivery-queue/failed/*.json`, और
  `session-delivery-queue/*.json` files के बजाय अलग-अलग queue names
  (`outbound-delivery`, `session-delivery`) के तहत global SQLite
  `delivery_queue_entries` table साझा करते हैं। doctor legacy-state step
  pending और failed rows को इंपोर्ट करता है, stale delivered markers हटाता है, और import के बाद पुरानी
  JSON files हटाता है। Hot routing और retry fields typed columns हैं; JSON payload केवल replay/debug के लिए रखा गया है।
- ACPX process leases अब `process-leases.json` के बजाय `acpx/process-leases`
  के तहत SQLite Plugin state का उपयोग करते हैं।
- Backup और migration run metadata

इन्हें agent databases में ले जाएं:

- Agent session roots और compatibility-shaped session-entry payloads। रनटाइम राइट्स के लिए पूरा:
  hot session metadata `sessions` में queryable है, जबकि
  legacy-shaped पूरा `SessionEntry` payload `session_entries` में रहता है।
- Agent transcript events। रनटाइम राइट्स के लिए पूरा।
- Compaction checkpoints और transcript snapshots। रनटाइम राइट्स के लिए पूरा:
  checkpoint transcript copies SQLite transcript rows हैं और checkpoint
  metadata `transcript_snapshots` में रिकॉर्ड किया जाता है। Gateway checkpoint helpers
  अब इन values को source files के बजाय transcript snapshots के रूप में नाम देते हैं।
- Agent VFS scratch/workspace namespaces। रनटाइम VFS राइट्स के लिए पूरा।
- Subagent attachment payloads। रनटाइम राइट्स के लिए पूरा: वे SQLite VFS
  seed entries हैं और कभी durable workspace files नहीं होते।
- Tool artifacts। रनटाइम राइट्स के लिए पूरा।
- Run artifacts। per-agent
  `run_artifacts` table के माध्यम से worker runtime writes के लिए पूरा।
- Agent-local runtime caches। per-agent `cache_entries` table के माध्यम से
  worker runtime scoped cache writes के लिए पूरा। Gateway-wide model caches global database में रहते हैं जब तक वे agent-specific नहीं बन जाते।
- ACP parent stream logs। रनटाइम राइट्स के लिए पूरा।
- ACP replay ledger sessions। रनटाइम राइट्स के लिए पूरा
  `acp_replay_sessions` और `acp_replay_events` के माध्यम से; legacy `acp/event-ledger.json`
  केवल doctor input के रूप में रहता है।
- ACP session metadata। रनटाइम राइट्स के लिए पूरा `acp_sessions` के माध्यम से; legacy
  `entry.acp` blocks in `sessions.json` केवल doctor migration input हैं।
- Trajectory sidecars जब वे explicit export files नहीं हैं। रनटाइम
  राइट्स के लिए पूरा: trajectory capture agent-database `trajectory_runtime_events`
  rows लिखता है और run-scoped artifacts को SQLite में mirror करता है। Legacy sidecars केवल doctor
  import inputs हैं; export fresh JSONL support-bundle outputs materialize कर सकता है
  लेकिन runtime पर पुराने trajectory/transcript sidecars को read या migrate नहीं करता।
  Runtime trajectory capture SQLite scope expose करता है; JSONL path helpers
  export/debug support तक isolated हैं और runtime module से re-export नहीं किए जाते।
  Embedded-runner trajectory metadata transcript locator persist करने के बजाय `{agentId, sessionId, sessionKey}`
  identity record करता है।

इनको फिलहाल file-backed रखें:

- `openclaw.json`
- provider या CLI credential files
- plugin/package manifests
- user workspaces और Git repositories जब disk mode selected हो
- operator tailing के लिए intended logs, जब तक कोई specific log surface moved न हो

## Migration Plan

### Phase 0: Freeze The Boundary

और rows move करने से पहले durable-state boundary को explicit बनाएं:

- global database में `migration_runs` table जोड़ें।
  legacy-state migration execution reports के लिए पूरा।
- file-to-database import के लिए single doctor-owned state migration service जोड़ें।
  पूरा: `openclaw doctor --fix` legacy-state migration implementation का उपयोग करता है।
- `plan` को read-only बनाएं और `apply` से backup create, import, verify, और
  फिर old files delete या quarantine करवाएं।
  पूरा: doctor verified pre-migration backup create करता है, backup path को
  `migration_runs` में pass करता है, और importer/removal paths reuse करता है।
- Static bans जोड़ें ताकि new runtime code legacy state files न लिख सके जबकि
  migration code और tests अभी भी उन्हें seed/read कर सकें।
  currently migrated legacy stores के लिए पूरा; guard forbidden runtime transcript locator contracts के लिए nested
  tests भी scan करता है।

### Phase 1: Finish The Global Control Plane

shared coordination state को `state/openclaw.sqlite` में रखें:

- Agents और agent database registry
- Task और Task Flow ledgers
- Plugin state
- Sandbox container/browser registry
- Cron/scheduler run history
- Pairing, device, push, update-check, TUI, OpenRouter/model caches, और other
  small gateway-scoped runtime state
- Backup और migration metadata
- Gateway media attachment bytes। रनटाइम राइट्स के लिए पूरा; direct file paths
  channel senders और sandbox staging के साथ compatibility के लिए temp materializations हैं। Runtime allowlists SQLite materialization paths accept करते हैं, legacy
  state/config media roots नहीं। Doctor legacy media files को
  `media_blobs` में import करता है और successful row writes के बाद source files हटाता है।
- Debug proxy capture sessions, events, और payload blobs। पूरा: captures
  shared state DB में रहते हैं और shared state DB bootstrap, schema,
  WAL, और busy-timeout settings के माध्यम से open होते हैं। Payload bytes
  `capture_blobs.data` में gzip-compressed हैं; कोई debug proxy runtime sidecar DB override,
  blob directory, या proxy-capture-only generated schema/codegen target नहीं है।
  Doctor/startup migration shipped `debug-proxy/capture.sqlite` rows
  और referenced payload blobs को import करता है, जिसमें active legacy DB/blob environment
  overrides भी शामिल हैं, फिर CA certificates intact रखते हुए उन sources को archive करता है।

यह phase उन subsystems से duplicate sidecar openers, permission helpers, WAL
setup, filesystem pruning, और compatibility writers भी delete करता है।

### Phase 2: Introduce Per-Agent Databases

एक database per agent create करें और global DB से उसे register करें:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

global `agent_databases` row path, schema version, last-seen
timestamp, और basic size/integrity metadata store करता है। Runtime code file paths सीधे derive करने के बजाय
agent DB के लिए registry से पूछता है।

agent DB owns:

- `sessions` को canonical session root के रूप में, जिसमें `session_entries` उस root से जुड़ी
  compatibility-shaped payload table है, और
  `session_routes` unique active `session_key` lookup है
- `conversations` और `session_conversations` को sessions से जुड़ी normalized provider
  routing identity के रूप में
- `transcript_events`
- transcript snapshots और compaction checkpoints. runtime writes के लिए पूर्ण.
- `vfs_entries`
- `tool_artifacts` और run artifacts
- agent-local runtime/cache rows. worker scoped caches के लिए पूर्ण.
- ACP parent stream events
- trajectory runtime events जब वे explicit export artifacts नहीं हैं

### चरण 3: Session Store APIs बदलें

runtime के लिए पूर्ण. file-shaped session store surface active
runtime contract नहीं है:

- Runtime अब `loadSessionStore(storePath)` को call नहीं करता या `storePath` को
  session identity नहीं मानता.
- Runtime row operations हैं `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry`, और `listSessionEntries`.
- Whole-store rewrite helpers, file writers, queue tests, alias pruning, और
  legacy-key deletion parameters runtime से हटा दिए गए हैं.
- Deprecated root-package compatibility exports अभी भी canonical
  `sessions.json` paths को SQLite row APIs पर adapt करते हैं.
- `sessions.json` parsing केवल doctor migration/import code और
  doctor tests में बची है.
- Runtime lifecycle fallback SQLite transcript headers पढ़ता है, JSONL first
  lines नहीं.

ऐसी किसी भी चीज़ को हटाते रहें जो file-lock parameters,
pruning/truncation-as-file-maintenance vocabulary, store-path identity, या ऐसे tests
फिर से लाती हो जिनका केवल assertion JSON persistence है.

### चरण 4: Transcripts, ACP Streams, Trajectories, और VFS स्थानांतरित करें

हर agent data stream को database-native बनाएं:

- Transcript append writes एक SQLite transaction से गुजरते हैं जो
  session header सुनिश्चित करता है, message idempotency जांचता है, parent tail चुनता है,
  `transcript_events` में insert करता है, और queryable identity metadata को
  `transcript_event_identities` में record करता है. direct transcript message appends और
  normal persisted `TranscriptSessionManager` appends के लिए पूर्ण; explicit branch
  operations अपना explicit parent choice रखते हैं और फिर भी कोई file locator derive किए बिना
  SQLite rows लिखते हैं.
- ACP parent stream logs rows बनते हैं, `.acp-stream.jsonl` files नहीं. पूर्ण.
- ACP spawn setup अब transcript JSONL paths persist नहीं करता. पूर्ण.
- Runtime trajectory capture event rows/artifacts सीधे लिखता है. explicit
  support/export command अभी भी support-bundle JSONL artifacts को
  export format के रूप में बना सकता है, लेकिन session export session JSONL को दोबारा नहीं बनाता. पूर्ण.
- Disk workspaces configured disk mode में disk पर ही रहते हैं.
- VFS scratch और experimental VFS-only workspace mode agent DB का उपयोग करते हैं.

migration पुराने JSONL files को एक बार import करता है, counts/hashes को
`migration_runs` में record करता है, और integrity checks के बाद imported files हटाता है.

### चरण 5: Backup, Restore, Vacuum, और Verify

Backups एक archive file ही रहते हैं:

- हर global और agent database को checkpoint करें.
- हर DB को SQLite backup semantics या `VACUUM INTO` से snapshot करें.
- compact DB snapshots, config, external credentials, और requested
  workspace exports को archive करें.
- raw live `*.sqlite-wal` और `*.sqlite-shm` files छोड़ दें.
- हर DB snapshot खोलकर और `PRAGMA integrity_check` चलाकर verify करें.
  `openclaw backup create` default रूप से यह archive verification करता है;
  `--no-verify` केवल post-write archive pass छोड़ता है, snapshot
  creation integrity check नहीं.
- Restore snapshots को उनके target paths पर वापस copy करता है. यह branch
  unshipped SQLite layout को `user_version = 1` पर reset करता है; भविष्य के shipped schema changes
  जरूरत पड़ने पर explicit migrations जोड़ सकते हैं.

### चरण 6: Worker Runtime

database split land होने तक worker mode को experimental रखें:

- Workers को agent id, run id, filesystem mode, और DB registry identity मिलती है.
- हर worker अपना SQLite connection खोलता है.
- Parent channel delivery, approvals, config, और cancellation authority रखता है.
- हर active run के लिए एक worker से शुरू करें; lifecycle और DB
  connection ownership stable होने के बाद ही pooling जोड़ें.

### चरण 7: पुरानी दुनिया हटाएं

runtime session management के लिए पूर्ण. पुरानी दुनिया केवल explicit
doctor input या support/export output के रूप में अनुमत है:

- कोई runtime `sessions.json`, transcript JSONL, sandbox registry JSON, task
  sidecar SQLite, या plugin-state sidecar SQLite writes नहीं.
- कोई JSON/session file pruning, file transcript truncation, session file locks,
  या lock-shaped session tests नहीं.
- कोई runtime compatibility exports नहीं जिनका उद्देश्य पुराने session files को
  current रखना है.
- Explicit support exports user-requested archive/materialization
  formats बने रहते हैं और file names को runtime identity में वापस feed नहीं करना चाहिए.

## Backup और Restore

Backups एक archive file होने चाहिए, लेकिन database capture
SQLite-native होना चाहिए:

1. लंबे समय तक चलने वाली write activity रोकें या एक छोटा backup barrier enter करें.
2. हर global और agent database के लिए checkpoint चलाएं.
3. SQLite backup semantics या `VACUUM INTO` का उपयोग करके हर database को
   temporary backup directory में snapshot करें.
4. compacted database snapshots, config file, credentials directory,
   selected workspaces, और manifest को archive करें.
5. हर included SQLite snapshot खोलकर और
   `PRAGMA integrity_check` चलाकर archive verify करें.
   `openclaw backup create` default रूप से यह करता है; `--no-verify` केवल
   post-write archive pass को जानबूझकर skip करने के लिए है.

primary backup format के रूप में raw live `*.sqlite`, `*.sqlite-wal`, और `*.sqlite-shm` copies पर
निर्भर न रहें. archive manifest में database role,
agent id, schema version, source path, snapshot path, byte size, और integrity
status record होना चाहिए.

Restore को archive snapshots से global database और agent database files को
फिर से बनाना चाहिए. क्योंकि SQLite layout अभी shipped नहीं हुआ है, यह refactor
केवल version-1 schema और doctor file-to-database import रखता है. restore
command पहले archive validate करता है, फिर verified extracted payload से हर manifest asset replace करता है.

## Runtime Refactor Plan

1. database registry APIs जोड़ें.
   - global DB और per-agent DB paths resolve करें.
   - unshipped schemas को `user_version = 1` पर रखें; shipped schema को जरूरत पड़ने तक
     schema migration runner code न जोड़ें.
   - tests, backup, और doctor द्वारा उपयोग किए जाने वाले close/checkpoint/integrity helpers जोड़ें.

2. sidecar SQLite stores collapse करें.
   - plugin state tables को global database में move करें. runtime
     writes के लिए पूर्ण; unshipped legacy sidecar importer delete कर दिया गया है.
   - task registry tables को global database में move करें. runtime
     writes के लिए पूर्ण; unshipped legacy sidecar importer delete कर दिया गया है.
   - Task Flow tables को global database में move करें. runtime writes के लिए पूर्ण;
     unshipped legacy sidecar importer delete कर दिया गया है.
   - builtin memory-search tables को हर agent database में move करें. पूर्ण; explicit
     custom `memorySearch.store.path` अब doctor config migration द्वारा remove किया जाता है.
     Full reindex केवल memory tables के विरुद्ध in place चलता है; पुराना whole-file
     swap path और sidecar index swap helper delete कर दिए गए हैं.
   - उन subsystems से duplicate database openers, WAL setup, permission helpers, और
     close paths हटाएं.

3. agent-owned tables को per-agent databases में move करें.
   - global database registry के माध्यम से demand पर agent DB create करें. पूर्ण.
   - runtime session entries, transcript events, VFS rows, और tool
     artifacts को agent DBs में move करें. पूर्ण.
   - branch-local shared-DB session entries, transcript events,
     VFS rows, या tool artifacts migrate न करें; वह layout कभी shipped नहीं हुआ. केवल legacy
     file-to-database import doctor में रखें.

4. session store APIs बदलें.
   - `storePath` को runtime identity के रूप में हटाएं. runtime के लिए पूर्ण और
     `check:database-first-legacy-stores` द्वारा guarded: session metadata, route updates,
     command persistence, CLI session cleanup, Feishu reasoning previews,
     transcript-state persistence, subagent depth, auth profile session
     overrides, parent-fork logic, और QA-lab inspection अब canonical agent/session keys से
     database resolve करते हैं.
     Gateway/TUI/UI/macOS session-list responses अब legacy `path` के बजाय `databasePath`
     expose करते हैं; macOS debug surfaces `session.store` config लिखने के बजाय
     per-agent database को read-only state के रूप में दिखाते हैं.
     `/status`, chat-driven trajectory export, और CLI dependency proxies अब
     legacy store paths propagate नहीं करते; transcript usage fallback
     SQLite को agent/session identity से पढ़ता है. Runtime और bridge tests अब
     `storePath` expose नहीं करते; doctor/migration inputs उस legacy field name के owner हैं.
     Gateway combined-session loading में अब non-templated `session.store` values के लिए
     special runtime branch नहीं है; यह per-agent SQLite rows aggregate करता है.
     legacy session-lock doctor lane और उसका `.jsonl.lock` cleanup helper
     remove कर दिया गया; SQLite अब session concurrency boundary है.
     Hot runtime call sites `resolveSessionRowEntry` जैसे row-oriented helper names का उपयोग करते हैं;
     पुराना `resolveSessionStoreEntry` compatibility alias runtime और plugin SDK exports से हटाया गया है.

- `{ agentId, sessionKey }` row operations का उपयोग करें.
  पूर्ण: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry`, और `listSessionEntries` SQLite-first APIs हैं जिन्हें
  session store path की जरूरत नहीं है. Status summary, local agent status, health,
  और `openclaw sessions` listing command अब per-agent rows सीधे पढ़ते हैं
  और `sessions.json` paths के बजाय per-agent SQLite database paths दिखाते हैं.
- Whole-store delete/insert को `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries`, और SQL cleanup queries से बदलें.
  runtime के लिए पूर्ण: hot paths अब row APIs और conflict-retried row patches का उपयोग करते हैं;
  remaining whole-store import/replace helpers migration import
  code और SQLite backend tests तक सीमित हैं.
  - `store-writer.ts` और writer-queue tests delete करें. पूर्ण.
  - session row upserts/patches से runtime legacy-key pruning और alias-delete parameters delete करें. पूर्ण.

5. runtime JSON registry behavior delete करें.
   - sandbox registry reads और writes को SQLite-only बनाएं. पूर्ण.
   - monolithic और sharded JSON को केवल migration step से import करें. पूर्ण.
   - sharded registry locks और JSON writes remove करें. पूर्ण.

- registry rows को generic opaque JSON के रूप में store करने के बजाय एक typed registry table रखें
  यदि shape hot-path operational state बनी रहती है. पूर्ण.

6. file-lock-shaped session mutation delete करें.
   - runtime lock creation और runtime lock APIs के लिए पूर्ण.
   - standalone legacy `.jsonl.lock` doctor cleanup lane remove कर दी गई है.
   - `session.writeLock` doctor-migrated legacy config है, typed runtime
     setting नहीं.
   - State integrity में अब अलग orphan transcript-file pruning
     path नहीं है; doctor migration legacy JSONL sources को एक जगह import/remove करता है.
   - Gateway singleton coordination typed SQLite `state_leases` rows का उपयोग
     `gateway_locks` के अंतर्गत करता है और अब file-lock directory seam expose नहीं करता.
   - Generic plugin SDK dedupe persistence अब file locks या JSON
     files का उपयोग नहीं करता; यह shared SQLite plugin-state rows लिखता है. पूर्ण.
   - QMD embed coordination `qmd/embed.lock` के बजाय SQLite state lease का उपयोग करता है. पूर्ण.

7. workers को database-aware बनाएं.
   - Workers अपने SQLite connections खोलते हैं.
   - Parent delivery, channel callbacks, और config own करता है.
   - Worker को agent id, run id, filesystem mode, और DB registry
     identity मिलती है, live handles नहीं.
   - `vfs-only` experimental रहता है और agent database को अपने storage
     root के रूप में उपयोग करता है.
   - पहले हर active run के लिए एक worker रखें. Pooling तब तक wait कर सकता है जब तक DB connection
     lifetime और cancellation behavior सामान्य न हो जाए.

8. बैकअप एकीकरण।
   - बैकअप को SQLite बैकअप या `VACUUM INTO` के ज़रिए वैश्विक और एजेंट डेटाबेस के स्नैपशॉट लेना सिखाएँ। स्टेट एसेट के अंतर्गत खोजी गई `*.sqlite` फ़ाइलों के लिए पूरा।
   - SQLite अखंडता और स्कीमा संस्करण के लिए बैकअप सत्यापन जोड़ें। बैकअप निर्माण और डिफ़ॉल्ट आर्काइव सत्यापन अखंडता जाँचों के लिए पूरा।
   - बैकअप रन मेटाडेटा SQLite में रिकॉर्ड करें। आर्काइव पथ, स्थिति, और मेनिफ़ेस्ट JSON वाली साझा `backup_runs` तालिका के ज़रिए पूरा।
   - सत्यापित आर्काइव स्नैपशॉट से रिस्टोर जोड़ें। पूरा: `openclaw backup
restore` एक्सट्रैक्शन से पहले सत्यापित करता है, सत्यापक के सामान्यीकृत
     मेनिफ़ेस्ट का उपयोग करता है, `--dry-run` का समर्थन करता है, और रिकॉर्ड
     किए गए स्रोत पथों को बदलने से पहले `--yes` आवश्यक करता है।
   - VFS/वर्कस्पेस निर्यात केवल अनुरोध किए जाने पर शामिल करें; सत्र
     इंटरनल्स को JSON या JSONL के रूप में निर्यात न करें।

9. अप्रचलित टेस्ट और कोड हटाएँ। ज्ञात रनटाइम सत्र सतहों के लिए पूरा।

- वे टेस्ट हटाएँ जो `sessions.json` या ट्रांसक्रिप्ट JSONL फ़ाइलों के रनटाइम
  निर्माण का दावा करते हैं। कोर सत्र स्टोर, चैट, Gateway ट्रांसक्रिप्ट इवेंट,
  प्रीव्यू, लाइफ़साइकल, कमांड सत्र-एंट्री अपडेट, ऑटो-रिप्लाई रीसेट/ट्रेस, और
  memory-core dreaming फ़िक्स्चर, अप्रूवल टार्गेट रूटिंग, सत्र ट्रांसक्रिप्ट
  मरम्मत, सुरक्षा अनुमति मरम्मत, ट्रैजेक्टरी निर्यात, और सत्र निर्यात के लिए
  पूरा।
  Active-memory ट्रांसक्रिप्ट टेस्ट अब SQLite स्कोप और अस्थायी या
  स्थायी JSONL फ़ाइल निर्माण न होने का दावा करते हैं।
  पुराना heartbeat ट्रांसक्रिप्ट-प्रूनिंग रिग्रेशन हटा दिया गया क्योंकि
  रनटाइम अब JSONL ट्रांसक्रिप्ट को काटता नहीं है।
  एजेंट सत्र-सूची टूल टेस्ट अब Gateway प्रतिक्रिया आकार के रूप में पुराने
  `sessions.json` पथों को मॉडल नहीं करते; ऐप/UI/macOS टेस्ट `databasePath` का
  उपयोग करते हैं।
  `/status` ट्रांसक्रिप्ट-उपयोग टेस्ट अब JSONL फ़ाइलें लिखने के बजाय सीधे
  SQLite ट्रांसक्रिप्ट पंक्तियाँ सीड करते हैं।
  Gateway सत्र लाइफ़साइकल टेस्ट अब सीधे SQLite ट्रांसक्रिप्ट सीडिंग हेल्पर
  उपयोग करते हैं; पुराना एक-पंक्ति सत्र-फ़ाइल फ़िक्स्चर आकार रीसेट और डिलीट
  कवरेज से हट गया है।
  `sessions.delete` अब फ़ाइल-युग का `archived: []` फ़ील्ड नहीं लौटाता; डिलीशन
  केवल पंक्ति म्यूटेशन परिणाम रिपोर्ट करता है। पुराना `deleteTranscript`
  विकल्प भी हट गया है: सत्र हटाने से कैनॉनिकल `sessions` रूट हटता है और
  SQLite को सत्र-स्वामित्व वाली ट्रांसक्रिप्ट, स्नैपशॉट, और ट्रैजेक्टरी
  पंक्तियों को cascade करने देता है, इसलिए कोई कॉलर ट्रांसक्रिप्ट अनाथ नहीं
  छोड़ सकता या क्लीनअप शाखा भूल नहीं सकता।
  Context-engine ट्रैजेक्टरी कैप्चर टेस्ट अब
  `session.trajectory.jsonl` पढ़ने के बजाय अलग-थलग एजेंट डेटाबेस से
  `trajectory_runtime_events` पंक्तियाँ पढ़ते हैं।
  Docker MCP चैनल सीड स्क्रिप्ट अब सीधे SQLite पंक्तियाँ सीड करती हैं। सीधे
  `sessions.json` लिखना केवल doctor फ़िक्स्चर तक सीमित है।
  Tool Search Gateway E2E `agents/<agentId>/sessions/*.jsonl` फ़ाइलें स्कैन
  करने के बजाय SQLite ट्रांसक्रिप्ट पंक्तियों से tool-call प्रमाण पढ़ता है।
  Memory-core होस्ट इवेंट और session-corpus स्क्रैच पंक्तियाँ अब साझा
  SQLite plugin-state में रहती हैं; `events.jsonl` और
  `session-corpus/*.txt` केवल legacy doctor माइग्रेशन इनपुट हैं। सक्रिय
  पंक्तियाँ `memory/session-ingestion/` वर्चुअल पथ उपयोग करती हैं, न कि
  `.dreams/session-corpus`। पुराना memory-core dreaming मरम्मत मॉड्यूल और उसके
  CLI/Gateway टेस्ट हटा दिए गए क्योंकि रनटाइम अब उस corpus के लिए फ़ाइल
  आर्काइव मरम्मत का स्वामी नहीं है। Memory-core bridge/public-artifact टेस्ट
  अब `.dreams/events.jsonl` सतह पर नहीं लाते; वे SQLite-समर्थित वर्चुअल JSON
  आर्टिफ़ैक्ट नाम का उपयोग करते हैं।
  सार्वजनिक SDK/Codex टेस्टिंग डॉक्स अब सत्र फ़ाइलों के बजाय SQLite सत्र
  स्टेट कहते हैं, और channel-turn उदाहरण अब `storePath` आर्ग्युमेंट नहीं
  दिखाता।
  Matrix sync स्टेट अब सीधे SQLite plugin-state स्टोर उपयोग करता है। सक्रिय
  क्लाइंट/रनटाइम कॉन्ट्रैक्ट `bot-storage.json` पथ नहीं, बल्कि अकाउंट स्टोरेज
  रूट पास करते हैं, और doctor स्रोत हटाने से पहले legacy `bot-storage.json`
  को SQLite में इंपोर्ट करता है। QA Matrix रीस्टार्ट/destructive scenarios अब
  नकली `bot-storage.json` फ़ाइलें बनाने या हटाने के बजाय सीधे SQLite sync
  पंक्ति बदलते हैं, और E2EE सब्सट्रेट नकली `sync-store.json` पथ के बजाय
  sync-store रूट पास करता है।
  Matrix storage-root चयन अब legacy sync/thread JSON फ़ाइलों से रूट्स को स्कोर
  नहीं करता; यह टिकाऊ रूट मेटाडेटा और वास्तविक crypto स्टेट का उपयोग करता है।
  रनटाइम SQLite सत्र बैकएंड टेस्ट सूट अब `sessions.json` नहीं गढ़ता; legacy
  स्रोत फ़िक्स्चर अब उन doctor टेस्ट में रहते हैं जो उन्हें इंपोर्ट करते हैं।
  Gateway सत्र टेस्ट अब `createSessionStoreDir` हेल्पर या अनुपयोगी अस्थायी
  session-store पथ सेटअप उजागर नहीं करते; फ़िक्स्चर डायरेक्टरी स्पष्ट हैं, और
  सीधा पंक्ति सेटअप SQLite session-row नामकरण उपयोग करता है।
  Doctor-only JSON5 session-store पार्सर कवरेज infra टेस्ट से doctor
  माइग्रेशन टेस्ट में चला गया, इसलिए रनटाइम टेस्ट सूट अब legacy session-file
  पार्सिंग के स्वामी नहीं हैं।
  Microsoft Teams रनटाइम SSO/pending-upload टेस्ट अब JSON sidecar फ़िक्स्चर या
  पार्सर नहीं रखते; legacy SSO token पार्सिंग केवल Plugin माइग्रेशन मॉड्यूल
  में रहती है। Telegram टेस्ट अब नकली `/tmp/*.json` स्टोर पथ सीड नहीं करते;
  वे SQLite-समर्थित message cache को सीधे रीसेट करते हैं। जेनेरिक OpenClaw
  test-state हेल्पर अब legacy `auth-profiles.json` writer उजागर नहीं करता;
  doctor auth माइग्रेशन टेस्ट उस फ़िक्स्चर के स्थानीय स्वामी हैं।
  TUI last-session pointers, exec approvals, active-memory toggles, Matrix
  dedupe/startup verification, Memory Wiki source sync, current-conversation
  bindings, onboarding auth, और Hermes secret imports के रनटाइम टेस्ट अब पुरानी
  sidecar फ़ाइलें नहीं बनाते या पुराने फ़ाइलनाम अनुपस्थित होने का दावा नहीं
  करते। वे SQLite पंक्तियों और सार्वजनिक store APIs के ज़रिए व्यवहार सिद्ध
  करते हैं; doctor/migration टेस्ट ही वह जगह हैं जहाँ legacy स्रोत फ़ाइलनाम
  होने चाहिए।
  device/node pairing, channel allowFrom, restart intents, restart handoff,
  session delivery queue entries, config health, iMessage caches, cron jobs, PI
  transcript headers, subagent registries, और managed image attachments के
  रनटाइम टेस्ट भी अब retired JSON/JSONL फ़ाइलें केवल यह सिद्ध करने के लिए नहीं
  बनाते कि उन्हें अनदेखा किया गया है या वे अनुपस्थित हैं।
  PI overflow recovery में अब SessionManager rewrite/truncation fallback नहीं
  है: tool-result truncation और context-engine transcript rewrites SQLite
  transcript पंक्तियाँ बदलते हैं, फिर डेटाबेस से सक्रिय prompt state refresh
  करते हैं। Persisted SessionManager message appends parent selection और
  idempotency के लिए atomic SQLite transcript append helper को delegate करते
  हैं। सामान्य metadata/custom entry appends भी SQLite के अंदर वर्तमान parent
  चुनते हैं, इसलिए stale manager instances pre-SQLite parent-chain races को
  फिर से जीवित नहीं करते।
  Synthetic PI tail cleanup for mid-turn prechecks और `sessions_yield` अब सीधे
  SQLite transcript state trim करता है; पुराना SessionManager tail-removal
  bridge और उसके टेस्ट हटा दिए गए हैं।
  Compaction checkpoint capture भी केवल SQLite से snapshots लेता है; callers
  अब alternate transcript source के रूप में live SessionManager पास नहीं करते।
- केवल माइग्रेशन के लिए legacy फ़ाइलें सीड करने वाले टेस्ट रखें।
- सक्रिय रनटाइम सतहों के लिए JSON-file proof को SQL row proof से बदल दिया गया है।

- legacy session/cache JSON पथों पर रनटाइम writes के लिए static bans जोड़ें।
  repo guard के लिए पूरा।

10. माइग्रेशन रिपोर्ट को audit योग्य बनाएँ।
    - माइग्रेशन runs को SQLite में started/finished timestamps, source
      paths, source hashes, counts, warnings, और backup path के साथ रिकॉर्ड
      करें।
      पूरा: legacy-state माइग्रेशन executions अब source path/table inventory,
      source file SHA-256, sizes, record counts, warnings, और backup path के साथ
      `migration_runs` रिपोर्ट persist करते हैं।
      पूरा: legacy-state माइग्रेशन executions source-level audit और future
      skip/backfill decisions के लिए `migration_sources` पंक्तियाँ भी persist
      करते हैं।
    - apply को idempotent बनाएँ। partial import के बाद दोबारा चलाने पर या तो
      पहले से imported source skip होना चाहिए या stable key से merge होना
      चाहिए।
      पूरा: session indexes, transcripts, delivery queues, plugin state, task
      ledgers, और agent-owned global SQLite rows stable keys या upsert/replace
      semantics के ज़रिए import होते हैं, इसलिए reruns durable rows को duplicate
      किए बिना merge करते हैं।
    - असफल imports को मूल source file अपनी जगह रखनी चाहिए।
      पूरा: असफल transcript imports अब original JSONL source को उसके detected
      path पर छोड़ते हैं, और `migration_sources` source को अगले doctor run के
      लिए `warning` के रूप में `removed_source=0` के साथ record करता है।

## प्रदर्शन नियम

- प्रति thread/process एक connection ठीक है; workers के बीच handles share न करें।
- WAL, `foreign_keys=ON`, 30s busy timeout, और छोटे `BEGIN IMMEDIATE` write
  transactions उपयोग करें।
- write transaction helpers को synchronous रखें जब तक/जब तक कोई async
  transaction API explicit mutex/backpressure semantics न जोड़ दे।
- parent delivery writes को छोटा और transactional रखें।
- whole-store rewrites से बचें; row-level upsert/delete उपयोग करें।
- hot code स्थानांतरित करने से पहले list-by-agent, list-by-session, updated-at,
  run id, और expiration paths के लिए indexes जोड़ें।
- बड़े artifacts, media, और vectors को base64 या numeric-array JSON नहीं, बल्कि
  BLOBs या chunked BLOB rows के रूप में store करें।
- opaque plugin-state entries को छोटा और scoped रखें।
- filesystem pruning के बजाय TTL/expiration के लिए SQL cleanup जोड़ें।
  database-owned runtime stores के लिए पूरा: media, plugin state, plugin blobs,
  persistent dedupe, और agent cache सभी SQLite rows के ज़रिए expire होते हैं।
  शेष filesystem cleanup अस्थायी materializations या explicit removal commands
  तक सीमित है।

## Static Bans

legacy state paths पर नए runtime writes को fail करने वाला repo check जोड़ें:

- `sessions.json`
- साकार किए गए support-bundle आउटपुट को छोड़कर `*.trajectory.jsonl`
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` रनटाइम कैश फ़ाइलें
- `agents/<agentId>/agent/auth.json`
- `agents/<agentId>/agent/models.json`
- `credentials/oauth.json`
- `github-copilot.token.json`
- `openrouter-models.json`
- `auth-profiles.json`
- `auth-state.json`
- `exec-approvals.json`
- `workspace-state.json`
- Matrix `credentials*.json` और `recovery-key.json`
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
- sandbox registry shard JSON फ़ाइलें
- native hook relay `/tmp` bridge JSON फ़ाइलें
- `plugin-state/state.sqlite`
- तदर्थ `openclaw-state.sqlite` रनटाइम sidecars
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
- Browser प्रोफ़ाइल सजावट `.openclaw-profile-decorated`
- `SessionManager.open(...)` फ़ाइल-समर्थित सेशन ओपनर
- `SessionManager.listAll(...)` और `TranscriptSessionManager.listAll(...)`
  ट्रांसक्रिप्ट सूचीकरण facades
- `SessionManager.forkFromSession(...)` और
  `TranscriptSessionManager.forkFromSession(...)` ट्रांसक्रिप्ट fork facades
- `SessionManager.newSession(...)` और `TranscriptSessionManager.newSession(...)`
  परिवर्तनीय सेशन प्रतिस्थापन facades
- `SessionManager.createBranchedSession(...)` और
  `TranscriptSessionManager.createBranchedSession(...)` branch-session facades

प्रतिबंध को परीक्षणों को legacy fixtures बनाने की अनुमति देनी चाहिए और migration कोड को
legacy फ़ाइल स्रोतों को पढ़ने/import/remove करने की अनुमति देनी चाहिए। अनशिप्ड SQLite sidecars प्रतिबंधित ही रहते हैं
और उन्हें doctor import allowances नहीं मिलतीं।

## पूर्णता मानदंड

- रनटाइम डेटा और कैश राइट वैश्विक या एजेंट SQLite डेटाबेस में जाते हैं।
- रनटाइम अब सेशन इंडेक्स, ट्रांसक्रिप्ट JSONL, sandbox registry
  JSON, task sidecar SQLite, या plugin-state sidecar SQLite नहीं लिखता। अनशिप्ड task
  और plugin-state sidecar SQLite importers हटाए जाते हैं।
- Legacy फ़ाइल import केवल doctor में है।
- Backup compact SQLite snapshots और integrity proof के साथ एक archive बनाता है।
- Agent workers disk, VFS scratch, या experimental VFS-only
  storage के साथ चल सकते हैं।
- Config और स्पष्ट credential फ़ाइलें ही एकमात्र अपेक्षित persistent
  non-database control फ़ाइलें रहती हैं।
- Repo checks legacy runtime file stores को फिर से लाने से रोकते हैं।
