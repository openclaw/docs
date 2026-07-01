---
read_when:
    - OpenClaw रनटाइम डेटा, कैश, ट्रांसक्रिप्ट, कार्य स्थिति, या स्क्रैच फ़ाइलों को SQLite में ले जाना
    - पुरानी JSON या JSONL फ़ाइलों से doctor माइग्रेशन डिज़ाइन करना
    - बैकअप, पुनर्स्थापना, VFS, या worker storage व्यवहार बदलना
    - सेशन लॉक, प्रूनिंग, ट्रंकेशन या JSON संगतता पथ हटाना
summary: SQLite को प्राथमिक टिकाऊ स्थिति और कैश लेयर बनाने, जबकि कॉन्फ़िगरेशन को फ़ाइल-समर्थित बनाए रखने की माइग्रेशन योजना
title: डेटाबेस-प्रथम स्टेट रिफैक्टर
x-i18n:
    generated_at: "2026-07-01T20:21:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 566e6aacfaa6aff0db2d1d143ef313d0ce97b82428152bc8940856e317a149ff
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
  क्रेडेंशियल फ़ाइलें OpenClaw के डेटाबेस के बाहर स्वामी-प्रबंधित रहती हैं।

वैश्विक डेटाबेस control-plane डेटाबेस है। यह एजेंट खोज,
साझा Gateway स्टेट, पेयरिंग, डिवाइस/नोड स्टेट, टास्क और फ़्लो लेजर, Plugin
स्टेट, शेड्यूलर रनटाइम स्टेट, बैकअप मेटाडेटा, और माइग्रेशन स्टेट का स्वामी है।

एजेंट डेटाबेस data-plane डेटाबेस है। यह एजेंट के सेशन
मेटाडेटा, ट्रांसक्रिप्ट इवेंट स्ट्रीम, VFS वर्कस्पेस या स्क्रैच नेमस्पेस, टूल
आर्टिफैक्ट, रन आर्टिफैक्ट, और खोजने/इंडेक्स करने योग्य एजेंट-स्थानीय कैश डेटा का स्वामी है।

इससे एक टिकाऊ वैश्विक दृश्य मिलता है, बिना बड़े एजेंट वर्कस्पेस,
ट्रांसक्रिप्ट, और बाइनरी स्क्रैच डेटा को साझा Gateway लेखन लेन में डालने के लिए मजबूर किए।

## कठोर अनुबंध

इस माइग्रेशन का एक canonical रनटाइम आकार है:

- सेशन पंक्तियां केवल सेशन मेटाडेटा बनाए रखती हैं। उन्हें
  `transcriptLocator`, ट्रांसक्रिप्ट फ़ाइल पथ, sibling JSONL पथ, लॉक पथ,
  pruning मेटाडेटा, या फ़ाइल-युग संगतता पॉइंटर बनाए नहीं रखने चाहिए।
- ट्रांसक्रिप्ट पहचान हमेशा SQLite पहचान है: `{agentId, sessionId}` साथ में
  वैकल्पिक topic मेटाडेटा जहां प्रोटोकॉल को इसकी आवश्यकता हो।
- `sqlite-transcript://...` रनटाइम या प्रोटोकॉल पहचान नहीं है। नया कोड
  ट्रांसक्रिप्ट locator derive, persist, pass, parse, या migrate नहीं करना चाहिए। रनटाइम और
  परीक्षणों में pseudo-locators बिल्कुल नहीं होने चाहिए; डॉक्स स्ट्रिंग का उल्लेख
  केवल उसे प्रतिबंधित करने के लिए कर सकते हैं।
- Legacy `sessions.json`, ट्रांसक्रिप्ट JSONL, `.jsonl.lock`, pruning, truncation,
  और पुराना session-path logic केवल doctor migration/import पथ से संबंधित है।
- Legacy सेशन कॉन्फ़िग aliases केवल doctor migration से संबंधित हैं। रनटाइम
  `session.idleMinutes`, `session.resetByType.dm`, या
  किसी अन्य कॉन्फ़िगर किए गए एजेंट के लिए cross-agent `agent:main:*` main-session aliases की व्याख्या नहीं करता।
- सेशन रूटिंग पहचान typed relational state है। Hot runtime और UI पथों को
  `sessions.session_scope`, `sessions.account_id`,
  `sessions.primary_conversation_id`, `conversations`, और
  `session_conversations` पढ़ने चाहिए; उन्हें provider identity के लिए `session_key` parse या
  `session_entries.entry_json` mine नहीं करना चाहिए, सिवाय एक compatibility
  shadow के, जबकि पुराने call sites हटाए जा रहे हों।
- Channel-स्तर के direct-message markers जैसे `dm` बनाम `direct` रूटिंग
  vocabulary हैं, ट्रांसक्रिप्ट locators या file-store compatibility handles नहीं।
- Legacy hook handler config केवल doctor warning/migration surfaces से संबंधित है।
  रनटाइम को `hooks.internal.handlers` लोड नहीं करना चाहिए; hooks केवल discovered
  hook directories और `HOOK.md` metadata के माध्यम से चलते हैं।
- Runtime startup, hot reply paths, Compaction, reset, recovery, diagnostics,
  TTS, memory hooks, subagents, Plugin command routing, protocol boundaries, और
  hooks को रनटाइम के माध्यम से `{agentId, sessionId}` पास करना चाहिए।
- परीक्षणों को `{agentId, sessionId}` के माध्यम से SQLite transcript rows seed और assert करनी चाहिए।
  जो परीक्षण केवल JSONL path forwarding,
  caller-supplied locator preservation, या transcript-file compatibility सिद्ध करते हैं, उन्हें
  हटाया जाना चाहिए, जब तक कि वे doctor import, non-session support/debug
  materialization, या protocol shape को cover न करें।
- `runEmbeddedPiAgent(...)`, prepared worker runs, और inner embedded
  attempt को transcript locators स्वीकार नहीं करने चाहिए। वे `{agentId, sessionId}` से SQLite transcript
  manager खोलते हैं और उस manager को internalized
  PI-compatible agent session को पास करते हैं, ताकि stale callers runner से
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
  QMD केवल configured memory files index करता है; session transcript search
  SQLite-backed रहती है।
- QMD SDK subpath नए कोड के लिए केवल QMD-only है। SQLite session transcript
  indexing helpers `memory-core-host-engine-session-transcripts` पर रहते हैं; कोई भी
  QMD re-export केवल compatibility है और runtime code द्वारा उपयोग नहीं किया जाना चाहिए।
- Built-in memory indexes owning agent database में रहते हैं। Runtime config और
  resolved runtime contracts को `memorySearch.store.path` expose नहीं करना चाहिए; doctor
  उस legacy config key को deletes करता है और वर्तमान कोड agent
  `databasePath` internally पास करता है।

Implementation work को code delete करते रहना चाहिए, जब तक ये statements
doctor/import/export/debug boundaries के बाहर exceptions के बिना true न हों।

## लक्ष्य स्थिति और प्रगति

### कठोर लक्ष्य

- एक वैश्विक SQLite डेटाबेस control-plane state का स्वामी है:
  `state/openclaw.sqlite`.
- एक प्रति-एजेंट SQLite डेटाबेस data-plane state का स्वामी है:
  `agents/<agentId>/agent/openclaw-agent.sqlite`.
- Config file-backed रहता है। `openclaw.json` इस database
  refactor का हिस्सा नहीं है।
- Legacy files केवल doctor migration inputs हैं।
- Runtime कभी भी active state के रूप में session या transcript JSONL लिखता या पढ़ता नहीं है।

### लक्ष्य स्थितियां

- `not-started`: file-era runtime code अभी भी active state लिखता है।
- `migrating`: doctor/import code file data को SQLite में move कर सकता है।
- `dual-read`: temporary bridge SQLite और legacy files दोनों पढ़ता है। यह state
  इस refactor के लिए forbidden है, जब तक इसे स्पष्ट रूप से
  doctor-only के रूप में documented न किया गया हो।
- `sqlite-runtime`: runtime केवल SQLite पढ़ता और लिखता है।
- `clean`: legacy runtime APIs और tests हटाए गए हैं, और guard
  regressions रोकता है।
- `done`: docs, tests, backup, doctor migration, और changed checks
  clean state सिद्ध करते हैं।

### वर्तमान स्थिति

- Sessions: runtime के लिए `clean`। Session rows per-agent database में रहते हैं,
  runtime APIs `{agentId, sessionId}` या `{agentId, sessionKey}` का उपयोग करते हैं, और
  `sessions.json` केवल doctor-only legacy input है।
- Transcripts: runtime के लिए `clean`। Transcript events, identities, snapshots,
  और trajectory runtime events per-agent database में रहते हैं। Runtime अब
  transcript locators या JSONL transcript paths स्वीकार नहीं करता।
- PI embedded runner: `clean`। Embedded PI runs, prepared workers, Compaction,
  और retry loops SQLite session scope का उपयोग करते हैं और stale transcript handles reject करते हैं।
- Cron: runtime के लिए `clean`। Runtime `cron_jobs` और `cron_run_logs` का उपयोग करता है;
  runtime tests SQLite `storeKey` naming का उपयोग करते हैं, और file-era cron paths केवल
  doctor legacy migration tests में रहते हैं।
- Task registry: `clean`। Task और Task Flow runtime rows
  `state/openclaw.sqlite` में रहते हैं; unshipped sidecar SQLite importers हटाए गए हैं।
- Plugin state: `clean`। Plugin state/blob rows shared global
  database में रहते हैं; old plugin-state sidecar SQLite helpers guarded against हैं।
- Memory: built-in memory और session transcript indexing के लिए `sqlite-runtime`।
  Memory index tables per-agent database में रहते हैं, plugin memory state
  shared plugin-state rows का उपयोग करता है, और legacy memory files doctor migration inputs
  या user workspace content हैं।
- Backup: `sqlite-runtime`। Backup stages SQLite snapshots compact करते हैं, live
  WAL/SHM sidecars छोड़ते हैं, SQLite integrity verify करते हैं, और backup runs को
  global database में record करते हैं।
- Doctor migration: `migrating`, जानबूझकर। Doctor legacy JSON,
  JSONL, और retired sidecar stores को SQLite में import करता है, migration runs/sources record करता है,
  और successful sources remove करता है।
- E2E scripts: runtime coverage के लिए `clean`। Docker MCP seeding SQLite
  rows लिखता है। runtime-context Docker script legacy JSONL केवल
  doctor migration seed के अंदर बनाती है और legacy session index path को explicitly नाम देती है।

### बाकी काम

- [x] Cron runtime-test store variables को `storePath` से अलग rename करें, जब तक
      वे doctor legacy inputs न हों।
      Files: `src/cron/service.test-harness.ts`,
      `src/cron/service.runs-one-shot-main-job-disables-it.test.ts`,
      `src/cron/service/timer.regression.test.ts`,
      `src/cron/service/ops.test.ts`, `src/cron/service/store.test.ts`,
      `src/cron/service.heartbeat-ok-summary-suppressed.test.ts`,
      `src/cron/service.main-job-passes-heartbeat-target-last.test.ts`,
      `src/cron/store.test.ts`.
      Proof: `pnpm check:database-first-legacy-stores`; `rg -n 'storePath' src/cron --glob '!**/commands/doctor/**'`.
- [x] Obsolete file-era export test mocks हटाएं या rename करें।
      File: `src/auto-reply/reply/commands-export-test-mocks.ts`.
      Proof: `rg -n 'resolveSessionFilePath|sessionFile|storePath|transcriptLocator' src/auto-reply/reply`.
- [x] Docker runtime-context legacy JSONL seed को स्पष्ट रूप से doctor-only बनाएं।
      File: `scripts/e2e/session-runtime-context-docker-client.ts`.
      Proof: `rg -n 'sessions\\.json|sessionFile|\\.jsonl' scripts/e2e/session-runtime-context-docker-client.ts` shows only
      `seedBrokenLegacySessionForDoctorMigration`.
- [x] किसी भी schema change के बाद Kysely generated types aligned रखें।
      Files: `src/state/openclaw-state-schema.sql`,
      `src/state/openclaw-agent-schema.sql`,
      `src/state/*generated*`.
      Proof: इस pass में कोई schema change नहीं; `pnpm db:kysely:check`;
      `pnpm lint:kysely`.
- [x] Touched stores, commands, और scripts के लिए focused tests फिर चलाएं।
      Proof: `pnpm test src/cron/service/store.test.ts src/cron/store.test.ts src/cron/service.heartbeat-ok-summary-suppressed.test.ts src/cron/service.main-job-passes-heartbeat-target-last.test.ts src/cron/service.every-jobs-fire.test.ts src/cron/service.persists-delivered-status.test.ts src/cron/service.runs-one-shot-main-job-disables-it.test.ts src/cron/service/ops.test.ts src/cron/service/timer.regression.test.ts src/auto-reply/reply/commands-export-trajectory.test.ts extensions/telegram/src/thread-bindings.test.ts extensions/slack/src/monitor/message-handler/prepare.test.ts src/acp/translator.session-lineage-meta.test.ts`; `git diff --check`.
- [x] `done` घोषित करने से पहले changed gate या remote broad proof चलाएं।
      Proof: `pnpm check:changed --timed -- <changed extension paths>` passed on
      Hetzner Crabbox run `run_3f1cabf6b25c` after temporary Node 24/pnpm setup and
      explicit path routing for the synced no-`.git` workspace.

### Regess न करें

- कोई transcript locators नहीं।
- कोई active session files नहीं।
- कोई fake JSONL test fixtures नहीं, doctor legacy migration tests को छोड़कर।
- जहां Kysely अपेक्षित है, वहां कोई raw SQLite access नहीं।
- कोई नई legacy DB migrations नहीं। यह layout shipped नहीं हुआ है; schema version
  `1` पर रखें, जब तक कोई strong reason न हो।

## Code-Read Assumptions

कोई follow-up product decisions इस plan को block नहीं कर रहे हैं। Implementation को
इन assumptions के साथ proceed करना चाहिए:

- इस स्टोरेज पथ के लिए सीधे `node:sqlite` का उपयोग करें और Node 22+ रनटाइम आवश्यक करें।
- ठीक एक सामान्य कॉन्फ़िगरेशन फ़ाइल रखें। इस रिफैक्टर में कॉन्फ़िगरेशन, plugin
  manifests, या Git workspaces को SQLite में न ले जाएँ।
- रनटाइम संगतता फ़ाइलों की आवश्यकता नहीं है। Legacy JSON और JSONL फ़ाइलें
  केवल माइग्रेशन इनपुट हैं। शाखा-स्थानीय SQLite sidecars कभी शिप नहीं हुए और
  आयात करने के बजाय हटाए जाते हैं।
- `openclaw doctor --fix` legacy file-to-database माइग्रेशन चरण का मालिक है।
  रनटाइम startup और `openclaw migrate` को legacy OpenClaw
  database-upgrade पथ नहीं रखने चाहिए।
- क्रेडेंशियल संगतता उसी नियम का पालन करती है: रनटाइम क्रेडेंशियल SQLite में रहते हैं।
  पुराने `auth-profiles.json`, प्रति-एजेंट `auth.json`, और साझा
  `credentials/oauth.json` फ़ाइलें doctor माइग्रेशन इनपुट हैं, फिर आयात के बाद
  हटा दी जाती हैं।
- Generated model catalog स्थिति database-backed है। रनटाइम कोड को
  `agents/<agentId>/agent/models.json` नहीं लिखना चाहिए; मौजूदा `models.json` फ़ाइलें legacy
  doctor इनपुट हैं और `agent_model_catalogs` में आयात के बाद हटाई जाती हैं।
- रनटाइम को transcript locators को migrate, normalize, या bridge नहीं करना चाहिए। सक्रिय
  transcript identity SQLite में `{agentId, sessionId}` है। फ़ाइल पथ केवल
  legacy doctor इनपुट हैं, और `sqlite-transcript://...` को boundary handle की तरह
  मानने के बजाय रनटाइम, protocol, hook, और plugin surfaces से गायब होना चाहिए।
- रनटाइम SQLite transcript reads पुराने JSONL entry-shape migrations नहीं चलाते या
  संगतता के लिए पूरे transcripts को rewrite नहीं करते। Legacy entry normalization
  explicit doctor/import utilities में रहती है। Doctor legacy JSONL transcript
  फ़ाइलों को SQLite rows insert करने से पहले normalize करता है; वर्तमान runtime rows
  पहले से current transcript schema में लिखी जाती हैं। Trajectory/session export
  उन rows को as-is पढ़ता है और export-time legacy migrations नहीं करने चाहिए।
- Legacy transcript JSONL parse/migration helpers केवल doctor-only हैं। रनटाइम
  transcript format code केवल current SQLite transcript context बनाता है; doctor
  rows insert करने से पहले पुराने JSONL entry upgrades का मालिक है।
- पुराने runtime-owned JSONL transcript streaming helper को हटा दिया गया। Doctor
  import code explicit legacy file reads का मालिक है; रनटाइम session history
  SQLite rows पढ़ती है।
- Codex app-server bindings Codex plugin-state namespace में canonical
  key के रूप में OpenClaw `sessionId` का उपयोग करते हैं। `sessionKey` routing/display के लिए
  metadata है और इसे durable session id को replace नहीं करना चाहिए या
  transcript-file identity को resurrect नहीं करना चाहिए।
- Context engines को current runtime contract सीधे मिलता है। registry को
  engines को ऐसे retry shims से wrap नहीं करना चाहिए जो `sessionKey`,
  `transcriptScope`, या `prompt` delete करते हैं; जो engines current
  database-first params स्वीकार नहीं कर सकते, उन्हें bridged होने के बजाय loudly fail करना चाहिए।
- Backup output एक archive file ही रहना चाहिए। Database contents को
  उस archive में compact SQLite snapshots के रूप में जाना चाहिए, raw live WAL sidecars के रूप में नहीं।
- Transcript search उपयोगी है लेकिन पहले database-first
  cut के लिए आवश्यक नहीं है। Schema को इस तरह design करें कि FTS बाद में जोड़ा जा सके।
- Worker execution को experimental ही रहना चाहिए, settings के पीछे, जब तक database
  boundary स्थिर नहीं हो जाती।

## Code-Read Findings

वर्तमान शाखा proof-of-concept चरण से आगे जा चुकी है। shared
database मौजूद है, Node `node:sqlite` एक छोटे runtime helper के माध्यम से wired है, और
पूर्व stores अब `state/openclaw.sqlite` या owning
`openclaw-agent.sqlite` database में लिखते हैं।

बाकी काम SQLite चुनना नहीं है; यह नई boundary को साफ रखना
और ऐसी compatibility-shaped interfaces को हटाना है जो अब भी पुराने
file world जैसी दिखती हैं:

- Session `storePath` अब runtime identity, test fixture shape, या
  status payload field नहीं है। Runtime और bridge tests में अब
  `storePath` contract name नहीं है; doctor/migration code उस legacy vocabulary का मालिक है।
- Session writes अब पुराने in-process `store-writer.ts`
  queue से होकर नहीं गुजरतीं। SQLite patch writes इसके बजाय conflict detection और bounded retry का उपयोग करती हैं।
- Legacy path discovery के अभी भी valid migration uses हैं, लेकिन runtime code को
  `sessions.json` और transcript JSONL files को possible write
  targets मानना बंद करना चाहिए।
- Agent-owned tables प्रति-एजेंट SQLite databases में रहते हैं। Global DB
  registry/control-plane rows रखता है; transcript identity per-agent transcript rows में `{agentId, sessionId}` है।
  Runtime code को transcript file paths persist या transcript locators migrate नहीं करने चाहिए।
- Doctor पहले से कई legacy files import करता है। Cleanup यह है कि उसे एक
  single explicit migration implementation बनाया जाए जिसे doctor calls करे, durable
  migration report के साथ।

कोई अतिरिक्त product questions implementation को block नहीं कर रहे हैं।

## Current Code Shape

शाखा में पहले से एक वास्तविक shared SQLite base है:

- रनटाइम फ़्लोर अब Node 22+ है: `package.json`, CLI रनटाइम गार्ड,
  इंस्टॉलर डिफ़ॉल्ट, macOS रनटाइम लोकेटर, CI, और सार्वजनिक इंस्टॉल दस्तावेज़ सभी
  सहमत हैं। पुरानी Node 22 संगतता लेन हटा दी गई है।
- `src/state/openclaw-state-db.ts` `openclaw.sqlite` खोलता है, WAL सेट करता है,
  `synchronous=NORMAL`, `busy_timeout=30000`, `foreign_keys=ON`, और
  `src/state/openclaw-state-schema.sql` से निकले जनरेटेड स्कीमा मॉड्यूल को
  लागू करता है।
- Kysely टेबल प्रकार और रनटाइम स्कीमा मॉड्यूल कमिट की गई `.sql` फ़ाइलों से बनाए गए
  डिस्पोज़ेबल SQLite डेटाबेस से जनरेट होते हैं; रनटाइम कोड अब ग्लोबल, प्रति-एजेंट,
  या प्रॉक्सी कैप्चर डेटाबेस के लिए कॉपी-पेस्ट किए गए स्कीमा स्ट्रिंग्स नहीं रखता।
- रनटाइम स्टोर हाथ से SQLite रो शेप्स की छाया बनाने के बजाय उन जनरेटेड Kysely
  `DB` इंटरफ़ेस से चुने और डाले गए रो प्रकार निकालते हैं। Raw SQL स्कीमा लागू करने,
  प्रैग्मा, और केवल-माइग्रेशन DDL तक सीमित रहता है।
- SQLite स्कीमा को `user_version = 1` पर संकुचित कर दिया गया है क्योंकि यह डेटाबेस
  लेआउट अभी शिप नहीं हुआ है। रनटाइम ओपनर केवल मौजूदा स्कीमा बनाते हैं;
  फ़ाइल-से-डेटाबेस इम्पोर्ट doctor कोड में रहता है, और ब्रांच-लोकल
  डेटाबेस अपग्रेड हेल्पर हटा दिए गए हैं।
- जहाँ स्वामित्व सीमा canonical है वहाँ रिलेशनल स्वामित्व लागू किया गया है:
  स्रोत माइग्रेशन रो `migration_runs` से cascade होते हैं, टास्क डिलीवरी स्टेट
  `task_runs` से cascade होती है, और ट्रांसक्रिप्ट पहचान रो ट्रांसक्रिप्ट इवेंट्स से
  cascade होते हैं।
- मौजूदा साझा टेबल में `agent_databases`,
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
- मनमानी Plugin-स्वामित्व वाली स्टेट को होस्ट-स्वामित्व वाली टाइप्ड टेबल नहीं मिलती।
  इंस्टॉल किए गए Plugins वर्ज़न वाले JSON पेलोड के लिए `plugin_state_entries` और
  बाइट्स के लिए `plugin_blob_entries` का उपयोग करते हैं, जिसमें namespace/key
  स्वामित्व, TTL क्लीनअप, बैकअप, और Plugin माइग्रेशन रिकॉर्ड होते हैं।
  होस्ट-स्वामित्व वाली Plugin ऑर्केस्ट्रेशन स्टेट में तब भी टाइप्ड टेबल हो सकती हैं
  जब होस्ट क्वेरी कॉन्ट्रैक्ट का स्वामी हो, जैसे `plugin_binding_approvals`।
- Plugin माइग्रेशन Plugin-स्वामित्व वाले namespace पर डेटा माइग्रेशन हैं, होस्ट
  स्कीमा माइग्रेशन नहीं। कोई Plugin माइग्रेशन प्रोवाइडर के ज़रिए अपनी वर्ज़न वाली
  state/blob entries माइग्रेट कर सकता है, और होस्ट सामान्य माइग्रेशन लेजर में
  source/run status रिकॉर्ड करता है। नए Plugin इंस्टॉल के लिए
  `openclaw-state-schema.sql` बदलने की आवश्यकता नहीं होती, जब तक कि होस्ट स्वयं
  किसी नए cross-plugin contract का स्वामित्व नहीं ले रहा हो।
- `src/state/openclaw-agent-db.ts`
  `agents/<agentId>/agent/openclaw-agent.sqlite` खोलता है, डेटाबेस को ग्लोबल DB में
  रजिस्टर करता है, और एजेंट-लोकल session, transcript, VFS, artifact, cache,
  और memory-index टेबलों का स्वामित्व रखता है। साझा रनटाइम डिस्कवरी अब हर call
  site पर उस क्वेरी को फिर से लागू करने के बजाय generated-typed
  `agent_databases` registry पढ़ती है।
- ग्लोबल और प्रति-एजेंट डेटाबेस database role, schema version, timestamps, और
  एजेंट डेटाबेस के लिए agent id के साथ `schema_meta` रो रिकॉर्ड करते हैं। लेआउट
  अभी भी `user_version = 1` पर रहता है क्योंकि यह SQLite स्कीमा अभी शिप नहीं हुआ है।
- प्रति-एजेंट session identity में अब `session_id` से keyed canonical `sessions`
  root table है, जिसमें `session_key`, `session_scope`, `account_id`,
  `primary_conversation_id`, timestamps, display fields, model metadata,
  harness id, और parent/spawn linkage queryable columns के रूप में हैं।
  `session_routes` `session_key` से मौजूदा `session_id` तक unique active route
  index है, ताकि route key fresh durable session पर जा सके और hot reads को duplicate
  `sessions.session_key` rows में से चुनना न पड़े। पुराना
  `session_entries.entry_json` compatibility-shaped payload foreign key द्वारा
  durable `session_id` root से जुड़ा रहता है; यह अब session का एकमात्र
  schema-level representation नहीं है।
- प्रति-एजेंट external conversation identity भी relational है:
  `conversations` normalized provider/account/conversation identity संग्रहीत करता है,
  और `session_conversations` एक OpenClaw session को एक या अधिक external
  conversations से जोड़ता है। यह shared-main DM sessions को कवर करता है जहाँ कई
  peers जानबूझकर एक session पर map हो सकते हैं, बिना `session_key` में गलत दिखाए।
  SQLite natural provider identity के लिए uniqueness भी लागू करता है ताकि वही
  channel/account/kind/peer/thread tuple conversation ids में fork न हो सके।
  Shared-main direct peers को `participant` role से लिंक किया जाता है, ताकि एक
  OpenClaw session कई external DM peers का प्रतिनिधित्व कर सके, बिना पुराने peers
  को अस्पष्ट related rows में demote किए। `sessions.primary_conversation_id` अभी भी
  मौजूदा typed delivery target की ओर इशारा करता है। Closed routing/status columns
  केवल TypeScript unions पर निर्भर रहने के बजाय SQLite `CHECK` constraints से लागू
  किए जाते हैं।
  Runtime session projection typed session/conversation columns लागू करने से पहले
  `session_entries.entry_json` से compatibility routing shadows साफ करता है, ताकि
  stale JSON payloads delivery targets को फिर से जीवित न कर सकें।
  Subagent announce routing को भी typed SQLite delivery context की आवश्यकता होती है;
  यह अब compatibility `SessionEntry` route fields पर fallback नहीं करता।
  Gateway `chat.send` explicit delivery inheritance `origin`/`last*` compatibility
  fields के बजाय typed SQLite delivery context पढ़ता है।
  `tools.effective` भी provider/account/thread context stale `last*`
  session-entry shadows से नहीं, बल्कि typed SQLite delivery/routing rows से निकालता है।
  System-event prompt context `origin` shadows के बजाय typed delivery fields से
  channel/to/account/thread fields फिर से बनाता है।
  साझा `deliveryContextFromSession` helper और session-to-conversation mapper अब
  `SessionEntry.origin` को पूरी तरह अनदेखा करते हैं; केवल typed delivery fields
  और relational conversation rows hot route identity बना सकते हैं।
  Runtime session entry normalization `entry_json` को persist या project करने से पहले
  `origin` हटा देता है, और inbound metadata नए origin shadows बनाने के बजाय typed
  channel/chat fields और relational conversation rows लिखता है।
- Transcript events, transcript snapshots, और trajectory runtime events अब canonical
  प्रति-एजेंट `sessions` root का reference करते हैं और session deletion पर cascade
  होते हैं। Transcript identity/idempotency rows exact transcript event row से
  cascade होते रहते हैं।
- Memory-core indexes अब स्पष्ट agent-database tables
  `memory_index_meta`, `memory_index_sources`, `memory_index_chunks`, और
  `memory_embedding_cache` का उपयोग करते हैं, जहाँ `memory_index_state` revision
  changes ट्रैक करता है। Optional FTS/vector side indexes generic `meta`, `files`,
  `chunks`, `chunks_fts`, या `chunks_vec` tables के बजाय
  `memory_index_chunks_fts` और `memory_index_chunks_vec` नाम से हैं। canonical नाम
  मौजूदा path/source row shape और serialized embedding compatibility बनाए रखते हैं।
  ये tables derived/search cache हैं, canonical transcript storage नहीं; इन्हें
  memory workspace files और configured sources से delete और rebuild किया जा सकता है।
  shipped generic-name memory index खोलने पर उसकी metadata, sources, chunks, और
  embedding cache canonical tables में migrate होती है; derived FTS/vector tables
  अपने canonical नामों के तहत rebuild होती हैं।
- Subagent run recovery state अब typed shared `subagent_runs` rows में रहती है,
  जिनमें child, requester, और controller session keys indexed हैं। पुरानी
  `subagents/runs.json` फ़ाइल केवल doctor migration input है।
- Current conversation bindings अब normalized conversation id से keyed typed shared
  `current_conversation_bindings` rows में रहती हैं, जिनमें target agent/session
  columns, conversation kind, status, expiry, और metadata duplicated opaque binding
  record के बजाय relational columns के रूप में stored हैं। durable binding key में
  normalized conversation kind शामिल है ताकि direct/group/channel refs collide न करें,
  और SQLite invalid binding kind/status values को reject करता है। पुरानी
  `bindings/current-conversations.json` फ़ाइल केवल doctor migration input है।
- Delivery queue recovery अब channel, target, account, session, retry, error,
  platform-send, और recovery state के लिए typed queue columns को replay JSON पर
  overlay करता है। `entry_json` replay payloads, hooks, और formatting payload रखता है,
  लेकिन hot queue routing/state के लिए typed columns authoritative हैं।
- TUI last-session restore pointers अब hashed TUI connection/session scope से keyed
  typed shared `tui_last_sessions` rows में रहते हैं। पुरानी TUI JSON फ़ाइल केवल
  doctor migration input है।
- Default TTS prefs अब `speech-core` Plugin के तहत keyed shared plugin-state SQLite
  rows में रहते हैं। पुरानी `settings/tts.json` फ़ाइल केवल doctor migration input है;
  runtime अब TTS prefs JSON files को पढ़ता या लिखता नहीं, और legacy path resolver
  doctor migration module में रहता है।
- Secret target metadata अब हर credential target को config file बताने का दिखावा करने
  के बजाय stores के बारे में बात करता है। `openclaw.json` config store रहता है;
  auth-profile targets typed SQLite `auth_profile_stores` rows का उपयोग करते हैं,
  जिनमें provider-shaped credentials JSON payloads के रूप में रखे जाते हैं।
- Secret audit अब retired per-agent `auth.json` files scan नहीं करता। Doctor उस
  legacy file के बारे में warning, import, और removal का स्वामी है।
- Legacy auth profile path helpers अब doctor legacy code में रहते हैं। Core auth
  profile path helpers SQLite auth-store identity और display locations expose करते हैं,
  `auth-profiles.json` या `auth-state.json` runtime paths नहीं।
- Subagent run recovery और OpenRouter model capability cache runtime modules अब
  SQLite snapshot readers/writers को doctor-only legacy JSON import helpers से अलग रखते
  हैं। OpenRouter capabilities `provider_id = "openrouter"` के तहत typed generic
  `model_capability_cache` rows का उपयोग करती हैं, एक opaque cache blob या
  provider-specific host table के बजाय। Subagent run `taskName` typed
  `subagent_runs.task_name` column में stored है; `payload_json` copy replay/debug
  data है, hot display या lookup fields का source नहीं।
- `src/agents/filesystem/virtual-agent-fs.sqlite.ts` agent database `vfs_entries`
  table पर SQLite VFS लागू करता है। Directory reads, recursive exports, deletes,
  और renames पूरे namespace को scan करने या `LIKE` path matching पर निर्भर रहने के बजाय
  indexed `(namespace, path)` prefix ranges का उपयोग करते हैं।
- `src/agents/runtime-worker.entry.ts` workers के लिए per-run SQLite VFS, tool artifact,
  run artifact, और scoped cache stores बनाता है।
- Workspace bootstrap completion markers अब `.openclaw/workspace-state.json` के बजाय
  resolved workspace path से keyed typed shared `workspace_setup_state` rows में रहते हैं;
  runtime अब legacy workspace marker को पढ़ता या rewrite नहीं करता, और helper APIs अब
  storage identity derive करने के लिए fake `.openclaw/setup-state` path पास नहीं करते।
- Exec approvals अब typed shared SQLite `exec_approvals_config` singleton row में रहते हैं।
  Doctor legacy `~/.openclaw/exec-approvals.json` import करता है; runtime writes अब उस
  file को active store location के रूप में create, rewrite, या report नहीं करते।
  macOS companion वही `state/openclaw.sqlite` table row पढ़ता और लिखता है; यह disk पर
  केवल Unix prompt socket रखता है क्योंकि वह IPC है, durable runtime state नहीं।
- Device identity, device auth, और bootstrap runtime modules अब अपने SQLite snapshot
  readers/writers को doctor-only legacy JSON import helpers से अलग रखते हैं। Device
  identity typed `device_identities` rows का उपयोग करती है और device auth tokens typed
  `device_auth_tokens` rows का उपयोग करते हैं। Device auth writes token table को truncate
  करने के बजाय device/role द्वारा rows reconcile करते हैं, और runtime अब single-token
  updates को पुराने whole-store adapter से route नहीं करता। Legacy
  version-1 JSON पेलोड केवल doctor आयात/निर्यात रूपों के रूप में मौजूद हैं।
- GitHub Copilot टोकन एक्सचेंज कैश साझा SQLite Plugin-state तालिका का उपयोग करता है
  `github-copilot/token-cache/default` के अंतर्गत। यह प्रदाता-स्वामित्व वाली कैश स्थिति है,
  इसलिए यह जानबूझकर कोई होस्ट स्कीमा तालिका नहीं जोड़ता।
- GitHub Copilot Compaction अब `openclaw-compaction-*.json`
  वर्कस्पेस साइडकार नहीं लिखता। हार्नेस ट्रैक किए गए SDK सत्र के लिए SDK इतिहास Compaction RPC को कॉल करता है, और OpenClaw संगतता मार्कर फ़ाइलों के बजाय
  टिकाऊ सत्र/ट्रांसक्रिप्ट स्थिति SQLite में रखता है।
- साझा Swift रनटाइम (`OpenClawKit`) डिवाइस पहचान और डिवाइस प्रमाणीकरण के लिए वही
  `state/openclaw.sqlite` पंक्तियां उपयोग करता है। macOS ऐप
  हेल्पर दूसरी JSON या SQLite पाथ के स्वामी होने के बजाय साझा SQLite हेल्पर आयात करते हैं। बची हुई विरासती `identity/device.json` पहचान निर्माण को तब तक रोकती है
  जब तक doctor उसे SQLite में आयात नहीं करता, जो TypeScript और Android
  स्टार्टअप गेट से मेल खाता है।
- Android डिवाइस पहचान वही TypeScript-संगत कुंजी सामग्री उपयोग करती है
  जो typed `state/openclaw.sqlite#table/device_identities` पंक्तियों में संग्रहीत है। यह कभी
  `openclaw/identity/device.json` को पढ़ती या लिखती नहीं; बची हुई विरासती फ़ाइल स्टार्टअप को तब तक रोकती है जब तक doctor उसे SQLite में आयात नहीं करता।
- Android कैश किए गए डिवाइस प्रमाणीकरण टोकन भी typed
  `state/openclaw.sqlite#table/device_auth_tokens` पंक्तियों का उपयोग करते हैं और TypeScript और Swift जैसी ही
  version-1 टोकन अर्थवत्ता साझा करते हैं। रनटाइम अब `SecurePrefs`
  `gateway.deviceToken*` संगतता कुंजियां नहीं पढ़ता; वे केवल माइग्रेशन/doctor
  लॉजिक से संबंधित हैं।
- Android सूचना recent-package इतिहास typed
  `android_notification_recent_packages` पंक्तियों का उपयोग करता है। रनटाइम अब पुरानी SharedPreferences CSV कुंजियों को माइग्रेट या
  पढ़ता नहीं।
- जब विरासती `identity/device.json`
  मौजूद हो, SQLite पहचान पंक्ति अमान्य हो, या SQLite पहचान
  स्टोर खोला न जा सके, तो डिवाइस पहचान निर्माण fail-closed होता है। Doctor पहले उस फ़ाइल को आयात और हटाता है, इसलिए रनटाइम
  स्टार्टअप माइग्रेशन से पहले pairing पहचान को चुपचाप घुमा नहीं सकता।
- डिवाइस पहचान चयन SQLite पंक्ति कुंजी है, JSON फ़ाइल लोकेटर नहीं। परीक्षण
  और Gateway हेल्पर स्पष्ट पहचान कुंजियां पास करते हैं; केवल doctor माइग्रेशन और
  fail-closed स्टार्टअप गेट ही सेवानिवृत्त `identity/device.json` फ़ाइलनाम जानते हैं।
- सत्र रीसेट संगतता अब doctor कॉन्फ़िग माइग्रेशन में रहती है:
  `session.idleMinutes` को `session.reset.idleMinutes` में ले जाया जाता है,
  `session.resetByType.dm` को `session.resetByType.direct` में ले जाया जाता है, और
  रनटाइम रीसेट नीति केवल canonical रीसेट कुंजियां पढ़ती है।
- विरासती कॉन्फ़िग संगतता अब `src/commands/doctor/` के अंतर्गत रहती है। सामान्य
  `readConfigFileSnapshot()` सत्यापन doctor विरासती डिटेक्टर आयात नहीं करता
  या विरासती समस्याओं को annotate नहीं करता; `runDoctorConfigPreflight()` doctor मरम्मत/रिपोर्टिंग के लिए
  वे समस्याएं जोड़ता है। doctor कॉन्फ़िग प्रवाह
  `src/commands/doctor/legacy-config.ts` आयात करता है, और पुरानी OAuth profile-id मरम्मत
  `src/commands/doctor/legacy/oauth-profile-ids.ts` के अंतर्गत रहती है।
- Non-doctor कमांड विरासती कॉन्फ़िग मरम्मत अपने-आप नहीं चलाते। उदाहरण के लिए,
  `openclaw update --channel` अब अमान्य विरासती कॉन्फ़िग पर विफल होता है और
  उपयोगकर्ता से doctor चलाने को कहता है, बजाय doctor माइग्रेशन कोड को चुपचाप आयात करने के।
- Web push, APNs, Voice Wake, अपडेट जांच, और कॉन्फ़िग स्वास्थ्य अब subscriptions, VAPID कुंजियों, node registrations, trigger rows,
  routing rows, update-notification state, और config health entries के लिए typed साझा SQLite
  तालिकाओं का उपयोग करते हैं, पूरे opaque JSON blobs के बजाय। Web push और APNs snapshot writes अब
  subscriptions/registrations को primary key से reconcile करते हैं, अपनी तालिकाओं को clear करने के बजाय;
  config health भी config path से ऐसा ही करता है।
  उनके रनटाइम मॉड्यूल SQLite snapshot readers/writers को
  doctor-only विरासती JSON import helpers से अलग रखते हैं।
- Node-host कॉन्फ़िग अब साझा SQLite डेटाबेस में typed singleton row का उपयोग करता है;
  सामान्य रनटाइम उपयोग से पहले doctor पुरानी `node.json` फ़ाइल आयात करता है।
- Device/node pairing, channel pairing, channel allowlists, और bootstrap state
  अब पूरे opaque JSON blobs के बजाय typed SQLite rows का उपयोग करते हैं। Plugin binding
  approvals और Cron job state भी वही विभाजन अपनाते हैं: रनटाइम मॉड्यूल
  SQLite-backed operations और neutral snapshot helpers expose करते हैं, और pairing/bootstrap
  तथा plugin binding approval snapshot writes rows को primary key से reconcile करते हैं
  tables को truncate करने के बजाय, जबकि doctor पुरानी JSON फ़ाइलों को
  `src/commands/doctor/legacy/*` मॉड्यूल के माध्यम से आयात/हटाता है।
- इंस्टॉल किए गए Plugin रिकॉर्ड अब SQLite installed-plugin index में रहते हैं।
  रनटाइम कॉन्फ़िग read/write अब पुराने
  `plugins.installs` authored-config data को माइग्रेट या preserve नहीं करता; doctor सामान्य रनटाइम उपयोग से पहले उस विरासती कॉन्फ़िग
  shape को SQLite में आयात करता है।
- QQBot credential recovery snapshots अब SQLite Plugin state में
  `qqbot/credential-backups` के अंतर्गत रहते हैं। रनटाइम अब
  `qqbot/data/credential-backup*.json` नहीं लिखता; QQBot doctor contract सक्रिय state directory से
  उन विरासती backup files को आयात और archive करता है।
- Gateway reload planning SQLite installed-plugin index snapshots की तुलना
  internal `installedPluginIndex.installRecords.*` diff namespace के अंतर्गत करता है। रनटाइम
  reload decisions अब उन rows को नकली `plugins.installs` config
  objects में wrap नहीं करते।
- Matrix named-account credential upgrade अब रनटाइम
  reads के दौरान नहीं होता। Doctor पुराने top-level `credentials/matrix/credentials.json`
  rename का स्वामी है जब single/default Matrix account resolve किया जा सके।
- Core pairing और Cron रनटाइम मॉड्यूल अब legacy JSON path
  builders export नहीं करते। Doctor-owned legacy modules import tests और
  migration के लिए `pending.json`, `paired.json`,
  `bootstrap.json`, और `cron/jobs.json` source paths बनाते हैं। Legacy Cron job-shape normalization और Cron run-log import
  `src/commands/doctor/legacy/cron*.ts` के अंतर्गत रहते हैं।
- `src/commands/doctor/legacy/runtime-state.ts` doctor से legacy JSON state
  files, जिसमें node host config शामिल है, SQLite में आयात करता है। नए legacy file
  importers `src/commands/doctor/legacy/` के अंतर्गत रहते हैं।
- `src/commands/doctor/state-migrations.ts` विरासती `sessions.json` और
  `*.jsonl` transcripts को सीधे SQLite में आयात करता है और सफल sources हटाता है। यह
  अब root legacy transcripts को
  `agents/<agentId>/sessions/*.jsonl` के माध्यम से stage नहीं करता या import से पहले
  canonical JSONL target नहीं बनाता।
- State integrity doctor checks अब legacy session directories scan नहीं करते या
  orphan JSONL deletion की पेशकश नहीं करते। Legacy transcript files केवल migration inputs हैं,
  और migration step import तथा source removal का स्वामी है।
- Legacy sandbox registry import
  `src/commands/doctor/legacy/sandbox-registry.ts` के अंतर्गत रहता है; active sandbox registry
  reads और writes SQLite-only रहते हैं।
- Legacy session transcript health/import repair
  `src/commands/doctor/legacy/session-transcript-health.ts` के अंतर्गत रहता है; runtime command
  modules अब JSONL transcript parsing या active-branch repair code नहीं रखते।

पूर्ण समेकन/हटाने की मुख्य बातें:

- Plugin स्थिति अब साझा `state/openclaw.sqlite` डेटाबेस का उपयोग करती है। पुराना
  branch-local `plugin-state/state.sqlite` sidecar importer हटा दिया गया है क्योंकि
  वह SQLite layout कभी shipped नहीं हुआ। Probe/test helpers plugin-state-specific SQLite path उजागर करने के बजाय साझा
  `databasePath` रिपोर्ट करते हैं।
- Task और Task Flow runtime tables अब `tasks/runs.sqlite` और
  `tasks/flows/registry.sqlite` के बजाय साझा
  `state/openclaw.sqlite` डेटाबेस में रहते हैं; पुराने sidecar importers उसी
  unshipped-layout कारण से हटा दिए गए हैं।
- `src/config/sessions/store.ts` को अब inbound
  metadata, route updates, या updated-at reads के लिए `storePath` की जरूरत नहीं है। Command persistence, CLI
  session cleanup, subagent depth, auth overrides, और transcript session
  identity agent/session row APIs का उपयोग करते हैं। Writes optimistic conflict retry के साथ SQLite row patches के रूप में लागू होती हैं।
- Session target resolution अब legacy
  `sessions.json` paths नहीं, बल्कि per-agent database targets उजागर करता है। Shared gateway, ACP metadata, doctor route repair, और
  `openclaw sessions` `agent_databases` और configured agents को enumerate करते हैं।
- Gateway session routing अब `resolveGatewaySessionDatabaseTarget` का उपयोग करता है; लौटाया गया target legacy session-store file path के बजाय `databasePath` और candidate SQLite row keys रखता है।
- Channel session runtime types अब
  updated-at reads, inbound metadata, और last-route updates के लिए `{agentId, sessionKey}` उजागर करते हैं। पुराना
  `saveSessionStore(storePath, store)` compatibility type हट गया है।
- Plugin runtime, extension API, और `config/sessions` barrel surfaces अब
  plugin code को SQLite-backed session row helpers की ओर ले जाते हैं। Root library compatibility
  exports (`loadSessionStore`, `saveSessionStore`, `resolveStorePath`) मौजूदा consumers के लिए deprecated shims के रूप में बने हुए हैं। पुराना
  `resolveLegacySessionStorePath` helper हट गया है; legacy `sessions.json` path
  construction अब migration और test fixtures तक स्थानीय है।
- `src/config/sessions/session-entries.sqlite.ts` अब canonical session
  entries को per-agent database में store करता है और row-level read/upsert/delete patch
  support रखता है। Runtime upsert/patch/delete अब case variants के लिए scan नहीं करता या
  legacy alias keys को prune नहीं करता; canonicalization doctor की जिम्मेदारी है। Standalone JSON import helper हट गया है, और migration पूरी session table को replace करने के बजाय newer rows को upsert करके merge करता है। Public read/list/load helpers
  typed `sessions` और `conversations` rows से hot session metadata project करते हैं;
  `entry_json` एक compatibility/debug shadow है और typed session identity या delivery context खोए बिना stale या invalid हो सकता है।
- `src/config/sessions/delivery-info.ts` अब typed per-agent `sessions` + `conversations` + `session_conversations` rows से delivery context resolve करता है।
  यह अब `session_entries.entry_json` से runtime delivery identity reconstruct नहीं करता; missing typed conversation row runtime fallback नहीं, बल्कि doctor
  migration/repair problem है।
- Stored-session reset decisions अब typed `sessions.session_scope`,
  `sessions.chat_type`, और `sessions.channel` metadata को प्राथमिकता देते हैं। `sessionKey` parsing
  केवल command targets पर explicit thread/topic suffixes के लिए रहती है; group vs
  direct reset classification अब key shape से नहीं आती।
- Session list/status display classification अब typed chat metadata और
  gateway session kind का उपयोग करता है। यह अब `session_key` के अंदर `:group:` या `:channel:` substrings को durable group/direct truth नहीं मानता।
- Silent-reply policy selection अब केवल explicit conversation type या surface
  metadata का उपयोग करता है। यह अब `session_key` substrings से direct/group policy का अनुमान नहीं लगाता।
- Session display model resolution अब agent id को SQLite
  session database target से प्राप्त करता है, उसे `session_key` से split नहीं करता।
- Agent-to-agent announce target hydration अब केवल typed `sessions.list`
  `deliveryContext` का उपयोग करता है। यह अब legacy `origin`, mirrored `last*` fields, या `session_key` shape से channel/account/thread routing recover नहीं करता।
- `sessions_send` thread-target rejection अब typed SQLite routing
  metadata पढ़ता है। यह अब target key से thread suffixes parse करके targets को reject या accept नहीं करता।
- Group-scoped tool policy validation अब current या spawned session के लिए typed SQLite conversation
  routing पढ़ता है। यह अब `sessionKey` decode करके group/channel
  identity पर भरोसा नहीं करता; caller-provided group ids तब drop कर दिए जाते हैं जब कोई typed session row उनके लिए vouch नहीं करती।
- Channel model override matching अब explicit group और parent
  conversation metadata का उपयोग करता है। यह अब `parentSessionKey` से parent conversation ids decode नहीं करता।
- Stored model override inheritance अब typed session context से explicit parent session key मांगता है। यह अब `sessionKey` में `:thread:` या `:topic:` suffixes से parent overrides derive नहीं करता।
- पुराना session thread-info wrapper और loaded-plugin thread parser हट गए हैं;
  कोई runtime code `config/sessions/thread-info` import नहीं करता।
- Channel conversation helper अब full-session-key parsing
  bridges उजागर नहीं करता। Core अभी भी provider-owned raw conversation ids को
  `resolveSessionConversation(...)` के जरिए normalize करता है, लेकिन यह `sessionKey` से route facts reconstruct नहीं करता।
- Completion delivery, send policy, और task maintenance अब `session_key` shape से chat
  type derive नहीं करते। पुराना chat-type key parser delete कर दिया गया है;
  इन paths को typed session metadata, typed delivery context, या
  explicit delivery target vocabulary की जरूरत होती है।
- Session list/status, diagnostics, approval account binding, TUI heartbeat
  filtering, और usage summaries अब provider/account/thread/display routing के लिए `SessionEntry.origin` से data mine नहीं करते। बाकी runtime
  `origin` reads केवल non-session concepts या current-turn delivery objects हैं।
- Approval-request native conversation lookup अब typed per-agent session
  routing rows पढ़ता है। यह अब `sessionKey` से channel/group/thread conversation identity parse नहीं करता; missing typed metadata migration/repair issue है।
- Gateway session changed/chat/session event payloads अब
  `SessionEntry.origin` या `last*` route shadows echo नहीं करते; clients को typed
  `channel`, `chatType`, और `deliveryContext` मिलते हैं।
- Heartbeat delivery resolution अब typed SQLite
  `deliveryContext` को सीधे receive कर सकता है, और heartbeat runtime current routing के लिए compatibility `session_entries`
  shadows पर निर्भर रहने के बजाय per-agent
  session delivery row pass करता है।
- Cron isolated-agent delivery target resolution भी compatibility entry payload पर fallback करने से पहले typed per-agent session delivery row से अपना current
  route hydrate करता है।
- Subagent announce origin resolution अब typed requester-session
  delivery context को `loadRequesterSessionEntry` के जरिए thread करता है और compatibility `last*`/`deliveryContext` shadows की तुलना में उस row को प्राथमिकता देता है।
- Inbound session metadata updates अब पहले typed per-agent
  delivery row के against merge होते हैं; पुराने `SessionEntry` delivery fields केवल fallback हैं जब कोई typed conversation row मौजूद नहीं हो।
- Restart/update delivery extraction अब typed SQLite delivery
  `threadId` को `sessionKey` से parse किए गए topic/thread fragments पर प्राथमिकता देता है; parsing केवल legacy thread-shaped keys के लिए fallback है।
- Hook agent context channel ids अब typed SQLite conversation identity,
  फिर explicit message metadata को प्राथमिकता देते हैं। वे अब `sessionKey` से provider/group/channel
  fragments parse नहीं करते।
- Gateway `chat.send` external-route inheritance अब
  `sessionKey` pieces से channel/direct/group scope infer करने के बजाय typed SQLite session
  routing metadata पढ़ता है। Channel-scoped sessions केवल तब inherit करते हैं जब typed
  session channel और chat type stored delivery context से match करते हैं; shared-main
  sessions अपना stricter CLI/no-client-metadata rule रखते हैं।
- Restart-sentinel wake और continuation routing अब heartbeat wakes या routed agent-turn
  continuations queue करने से पहले typed SQLite
  delivery/routing rows पढ़ता है। यह अब session-entry JSON shadow से delivery context reconstruct नहीं करता।
- Gateway `tools.effective` context resolution अब provider, account, target, thread, और reply-mode
  inputs के लिए typed SQLite
  delivery/routing rows पढ़ता है। यह अब stale
  `session_entries.entry_json` origin shadows से वे hot routing fields recover नहीं करता।
- Realtime voice consult routing अब typed
  per-agent SQLite session rows से parent/call delivery resolve करता है। Embedded agent
  message route चुनते समय यह अब compatibility
  `SessionEntry.deliveryContext` shadows पर fallback नहीं करता।
- ACP spawn heartbeat relay और parent-stream routing अब typed SQLite session rows से parent delivery
  पढ़ते हैं। वे अब compatibility session-entry shadows से parent delivery
  context reconstruct नहीं करते।
- Session delivery route preservation अब typed chat metadata और
  persisted delivery columns का पालन करता है। यह अब `sessionKey` से channel hints, direct/main
  markers, या thread shape extract नहीं करता; internal webchat routes केवल तब
  external target inherit करते हैं जब SQLite में session के लिए पहले से typed/persisted delivery
  identity हो।
- Generic session delivery extraction अब केवल exact typed SQLite
  session delivery row पढ़ता है। यह अब thread/topic suffixes parse नहीं करता या thread-shaped key से base session key पर fallback नहीं करता।
- Reply dispatch, restart sentinel recovery, और realtime voice consult routing
  अब thread routing के लिए exact typed SQLite session/conversation rows का उपयोग करते हैं। वे
  अब thread-shaped session keys parse करके thread ids या base-session delivery context recover नहीं करते।
- Embedded PI history limiting अब provider, chat type,
  और peer identity के लिए typed SQLite session routing
  projection (`sessions` + primary `conversations`) का उपयोग करता है। यह अब `sessionKey` से provider, DM, group, या thread shape parse नहीं करता।
- Cron tool delivery inference अब केवल explicit delivery या current typed
  delivery context का उपयोग करता है। यह अब `agentSessionKey` से channel, peer, account, या thread
  targets decode नहीं करता।
- Runtime session rows अब पुराना `lastProvider` route alias नहीं रखते।
  Helpers और tests typed `lastChannel` और `deliveryContext` fields का उपयोग करते हैं;
  doctor migration ही वह एकमात्र जगह है जिसे पुराने route aliases या persisted `origin` shadows translate करने चाहिए।
- Transcript events, VFS rows, और tool artifact rows अब per-agent
  database में write होते हैं। Unshipped global transcript-file mapping table हट गई है; doctor
  legacy source paths को durable migration rows में record करता है।
- Runtime transcript lookup अब JSONL byte offsets scan नहीं करता या legacy
  transcript files probe नहीं करता। Gateway chat/media/history paths SQLite से transcript rows पढ़ते हैं; session JSONL अब केवल legacy doctor input है, runtime state
  या export format नहीं।
- Transcript parent और branch relationships SQLite transcript
  headers में structured `parentTranscriptScope: {agentId, sessionId}` metadata का उपयोग करते हैं, path-like `agent-db:...transcript_events...` locator strings का नहीं।
- Transcript manager contract अब implicit persisted
  `create(cwd)` या `continueRecent(cwd)` constructors उजागर नहीं करता। Persisted transcript
  managers explicit `{agentId, sessionId}` scope के साथ खोले जाते हैं; केवल
  in-memory managers tests और pure transcript transforms के लिए scope-free रहते हैं।
- Runtime transcript store APIs SQLite scope resolve करते हैं, filesystem paths नहीं। पुराना
  `resolve...ForPath` helper और unused `transcriptPath` write options runtime callers से हट गए हैं।
- Runtime session resolution अब `{agentId, sessionId}` का उपयोग करता है और external boundaries के लिए
  `sqlite-transcript://<agent>/<session>` strings derive नहीं करना चाहिए।
  Legacy absolute JSONL paths केवल doctor migration inputs हैं।
- Native hook relay direct-bridge records अब relay id से keyed typed shared
  `native_hook_relay_bridges` rows में रहते हैं। Runtime अब उन short-lived bridge
  records के लिए `/tmp` JSON registry या opaque generic records नहीं लिखता।
- `runEmbeddedPiAgent(...)` में अब transcript-locator parameter नहीं है।
  तैयार worker descriptors भी transcript locators को छोड़ते हैं। Runtime session
  state और queued follow-up runs derived transcript handles के बजाय `{agentId, sessionId}` ले जाते हैं।
- Embedded compaction अब SQLite scope को `agentId` और `sessionId` से लेता है।
  Compaction hooks, context-engine calls, CLI delegation, और protocol replies को
  derived `sqlite-transcript://...` handles नहीं मिलने चाहिए। Export/debug code
  rows से explicit user artifacts materialize कर सकता है, लेकिन यह generic session JSONL export path उपलब्ध नहीं कराता
  या file names को runtime identity में वापस नहीं भेजता।
- `/export-session` SQLite से transcript rows पढ़ता है और केवल requested
  standalone HTML view लिखता है। Embedded viewer अब उन rows से session JSONL को reconstruct या
  download नहीं करता।
- Context-engine delegation अब agent identity recover करने के लिए transcript locator parse नहीं करता।
  Prepared runtime context resolved `agentId` को built-in compaction adapter में ले जाता है।
- Transcript rewrite और live tool-result truncation अब `{agentId, sessionId}` से
  transcript state पढ़ते और persist करते हैं और transcript-update event payloads के लिए temporary
  locators derive नहीं करते।
- Transcript-state helper surface में अब locator-based
  `readTranscriptState`, `replaceTranscriptStateEvents`, या
  `persistTranscriptStateMutation` variants नहीं हैं। Runtime callers को
  `{agentId, sessionId}` APIs इस्तेमाल करनी चाहिए। Doctor import legacy files को explicit file
  path से पढ़ता है और SQLite rows लिखता है; यह locator strings migrate नहीं करता।
- Runtime session-manager contract अब `open(locator)`,
  `forkFrom(locator)`, या `setTranscriptLocator(...)` expose नहीं करता। Persisted session
  managers केवल `{agentId, sessionId}` से open होते हैं; list/fork helpers transcript manager
  facade के बजाय row-oriented session और checkpoint APIs पर रहते हैं।
- Gateway transcript reader APIs scope-first हैं। वे
  `{agentId, sessionId}` लेते हैं और positional transcript locator स्वीकार नहीं करते जो
  गलती से runtime identity बन सकता हो। Active transcript locator parsing हट गई है; legacy source paths केवल doctor import code द्वारा पढ़े जाते हैं।
- Transcript update events भी scope-first हैं। `emitSessionTranscriptUpdate`
  अब bare locator string स्वीकार नहीं करता, और listeners handle parse किए बिना
  `{agentId, sessionId}` से route करते हैं।
- Gateway session-message broadcast session keys को agent/session
  scope से resolve करता है, transcript locator से नहीं। पुराना transcript-locator-to-session
  key resolver/cache हट गया है।
- Gateway session-history SSE live updates को agent/session scope से filter करता है। यह अब
  stream को update मिलना चाहिए या नहीं तय करने के लिए transcript locator candidates, realpaths, या file-shaped
  transcript identities canonicalize नहीं करता।
- Session lifecycle hooks अब `session_end` पर transcript locators derive या expose नहीं करते।
  Hook consumers को `sessionId`, `sessionKey`, next-session
  ids, और agent context मिलता है; transcript files lifecycle
  contract का हिस्सा नहीं हैं।
- Reset hooks भी अब transcript locators derive या expose नहीं करते। `before_reset` payload
  recovered SQLite messages और reset
  reason ले जाता है, जबकि session identity hook context में रहती है।
- Agent harness reset अब transcript locator स्वीकार नहीं करता। Reset dispatch
  `sessionId`/`sessionKey` और reason से scoped है।
- Agent extension session types अब `transcriptLocator` expose नहीं करते; extensions को
  file-shaped transcript identity तक पहुंचने के बजाय session context और runtime APIs इस्तेमाल करनी चाहिए।
- Plugin compaction hooks अब transcript locators expose नहीं करते। Hook context
  पहले से session identity ले जाता है, और transcript reads को file-shaped handles के बजाय SQLite
  scope-aware APIs से गुजरना चाहिए।
- `before_agent_finalize` hooks अब native hook relay payloads सहित
  `transcriptPath` expose नहीं करते। Finalization hooks केवल session context इस्तेमाल करते हैं।
- Gateway reset responses अब returned entry पर transcript locator synthesize नहीं करते।
  Reset SQLite transcript rows बनाता है, clean
  session entry लौटाता है, और transcript access को scope-aware readers पर छोड़ता है।
- Embedded run और compaction results अब session accounting के लिए transcript locators surface नहीं करते।
  Automatic compaction केवल active `sessionId`,
  compaction counters, और token metadata update करता है।
- Embedded attempt results अब `transcriptLocatorUsed` return नहीं करते, और
  context-engine `compact()` results अब transcript locators return नहीं करते।
  Runtime retry loops केवल successor `sessionId` स्वीकार करते हैं।
- Delivery-mirror transcript append results अब transcript
  locators return नहीं करते। Callers को appended `messageId` मिलता है; transcript update signals SQLite scope इस्तेमाल करते हैं।
- Parent-session fork helpers केवल forked `sessionId` return करते हैं। Subagent
  preparation child agent/session scope को engines में pass करता है।
- CLI runner params और history reseeding अब transcript locators स्वीकार नहीं करते।
  CLI history reads SQLite transcript scope को `{agentId,
sessionId}` और session key context से resolve करते हैं।
- CLI और embedded-runner test fixtures अब active sessions को `*.jsonl` files मानने या
  runtime params से `sqlite-transcript://...` string pass करने के बजाय session id से SQLite transcript rows
  seed और read करते हैं।
- Session tool-result guard events known session scope से emit होते हैं, तब भी जब
  in-memory manager के पास derived locator नहीं होता। इसके tests अब active
  `/tmp/*.jsonl` transcript files fake नहीं करते।
- BTW और compaction-checkpoint helpers अब SQLite scope से transcript rows read और fork करते हैं।
  Checkpoint metadata अब केवल session ids और leaf/entry ids
  store करता है; derived locators अब checkpoint payloads में नहीं लिखे जाते।
- Gateway transcript-key lookup protocol
  boundaries पर SQLite transcript scope इस्तेमाल करता है और अब transcript filenames को realpaths या stats नहीं करता।
- Automatic compaction transcript rotation successor transcript rows को
  सीधे SQLite transcript store के जरिए लिखता है। Session rows केवल
  successor session identity रखते हैं, durable JSONL path या persisted locator नहीं।
- Embedded context-engine compaction SQLite-named transcript rotation
  helpers इस्तेमाल करता है। Rotation tests अब JSONL successor paths construct नहीं करते या
  active sessions को files की तरह model नहीं करते।
- Managed outgoing image retention अपने transcript-message cache को
  filesystem stat calls के बजाय SQLite transcript stats से key करता है।
- Runtime session locks और standalone legacy `.jsonl.lock` doctor
  lane हटा दिए गए हैं।
- Microsoft Teams runtime barrel और public plugin SDK अब पुराने file-lock helper को re-export नहीं करते; durable plugin state paths SQLite-backed हैं।
- Session age/count pruning और explicit session cleanup हटा दिए गए हैं।
  Doctor legacy import own करता है; stale sessions explicit रूप से reset या delete होते हैं।
- Doctor integrity checks अब legacy JSONL file को SQLite session row के लिए valid active
  transcript के रूप में count नहीं करते। Active transcript health केवल SQLite है;
  legacy JSONL files migration/orphan-cleanup inputs के रूप में report होती हैं।
- Doctor अब `agents/<agent>/sessions/` को required runtime
  state नहीं मानता। यह उस directory को केवल तब scan करता है जब वह पहले से मौजूद हो, legacy import
  या orphan-cleanup input के रूप में।
- Gateway `sessions.resolve`, session patch/reset/compact paths, subagent
  spawning, fast abort, ACP metadata, heartbeat-isolated sessions, और TUI
  patching अब normal runtime work के side effect के रूप में legacy session keys migrate या prune नहीं करते।
- CLI command session resolution अब `storePath` के बजाय owning `agentId` return करता है,
  और normal `--to` या `--session-id` resolution के दौरान legacy main-session rows copy नहीं करता। Legacy main-row canonicalization केवल doctor से संबंधित है।
- Runtime subagent depth resolution अब `sessions.json` या JSON5
  session stores नहीं पढ़ता। यह SQLite `session_entries` को agent id से पढ़ता है, और legacy
  depth/session metadata केवल doctor import path से enter कर सकता है।
- Auth profile session overrides lazy-loading file-shaped session-store runtime के बजाय direct `{agentId, sessionKey}`
  row upserts से persist होते हैं।
- Auto-reply verbose gating और session update helpers अब session identity से SQLite
  session rows read/upsert करते हैं और persisted row state छूने से पहले legacy store path की जरूरत नहीं रखते।
- Command-run session metadata helpers अब entry-oriented names और module
  paths इस्तेमाल करते हैं; पुराना `session-store` command helper surface हटा दिया गया है।
- Bootstrap header seeding और manual compaction boundary hardening अब SQLite transcript rows को
  सीधे mutate करते हैं। Runtime callers session identity pass करते हैं, writable `.jsonl` paths नहीं।
- Silent session-rotation replay recent user/assistant turns को
  SQLite transcript rows से `{agentId, sessionId}` द्वारा copy करता है। यह अब
  source या target transcript locators स्वीकार नहीं करता।
- Fresh runtime session rows अब transcript locators store नहीं करते। Callers
  `{agentId, sessionId}` सीधे इस्तेमाल करते हैं; export/debug commands rows materialize करते समय output file
  names चुन सकते हैं।
- नया persisted transcript session शुरू करना अब हमेशा SQLite rows को
  scope से open करता है। Session manager अब नई session की identity के लिए previous file-era transcript
  path या locator reuse नहीं करता।
- Persisted transcript sessions explicit
  `openTranscriptSessionManagerForSession({agentId, sessionId})` API इस्तेमाल करते हैं। पुराने
  static `SessionManager.create/openForSession/list/forkFromSession` facades
  हट गए हैं ताकि tests और runtime code गलती से file-era session
  discovery फिर से create न कर सकें।
- Plugin runtime अब `api.runtime.agent.session.resolveTranscriptLocatorPath` expose नहीं करता;
  plugin code SQLite row helpers और scope values इस्तेमाल करता है।
- Public `session-store-runtime` SDK surface अब केवल session row
  और transcript row helpers export करता है। Focused SQLite schema/path/transaction helpers
  `sqlite-runtime` में रहते हैं; raw open/close/reset helpers first-party tests के लिए local-only रहते हैं।
- Legacy `.jsonl` trajectory/checkpoint filename classifiers अब
  doctor legacy session-file module में रहते हैं। Core session validation अब normal SQLite session ids तय करने के लिए
  file-artifact helpers import नहीं करता।
- Active-memory blocking subagent runs plugin state के नीचे temporary या persisted `session.jsonl` files बनाने के बजाय
  SQLite transcript rows इस्तेमाल करते हैं। पुराना
  `transcriptDir` option हटा दिया गया है।
- One-off slug generation और Crestodian planner runs temporary `session.jsonl` files बनाने के बजाय SQLite transcript rows इस्तेमाल करते हैं।
- `llm-task` helper runs और hidden commitment extraction भी SQLite
  transcript rows इस्तेमाल करते हैं, इसलिए ये model-only helper sessions अब temporary JSON/JSONL transcript files
  create नहीं करते।
- `TranscriptSessionManager` अब केवल opened SQLite transcript scope है।
  Runtime code इसे `openTranscriptSessionManagerForSession({agentId,
sessionId})` से open करता है; create, branch, continue, list, और fork flows static manager facades के बजाय अपने
  owning SQLite row helpers में रहते हैं।
  Doctor/import/debug code explicit legacy source files को runtime session manager के बाहर handle करता है।
- Stale `SessionManager.newSession()` और
  `SessionManager.createBranchedSession()` facade methods हटा दिए गए। New
  sessions और transcript descendants अपने owning SQLite
  workflow द्वारा create होते हैं, पहले से open manager को किसी अलग
  persisted session में mutate करके नहीं।
- Parent transcript fork decisions और fork creation अब
  `storePath` या `sessionsDir` स्वीकार नहीं करते; वे retained filesystem path metadata के बजाय `{agentId, sessionId}` SQLite
  transcript scope इस्तेमाल करते हैं।
- Memory-host अब no-op session-directory transcript
  classification helpers export नहीं करता; transcript filtering अब entry construction के दौरान SQLite row
  metadata से derive होती है।
- Memory-host और QMD session-export tests SQLite transcript scopes इस्तेमाल करते हैं। पुराने
  `agents/<agentId>/sessions/*.jsonl` paths केवल वहीं covered रहते हैं जहां कोई test
  जानबूझकर doctor/import/export compatibility सिद्ध कर रहा हो।
- QA-lab raw session inspection अब gateway के जरिए `sessions.list` इस्तेमाल करता है
  `agents/qa/sessions/sessions.json` पढ़ने के बजाय; MSteams प्रतिक्रिया
  JSONL पथ गढ़े बिना सीधे SQLite ट्रांसक्रिप्ट में जोड़ती है।
- साझा इनबाउंड चैनल टर्न अब विरासत `storePath` के बजाय `{agentId, sessionKey}` रखते हैं। LINE, WhatsApp, Slack, Discord, Telegram, Matrix, Signal,
  iMessage, BlueBubbles, Feishu, Google Chat, IRC, Nextcloud Talk, Zalo,
  Zalo Personal, QA Channel, Microsoft Teams, Mattermost, Synology Chat, Tlon,
  Twitch, और QQBot रिकॉर्डिंग पथ अब updated-at मेटाडेटा पढ़ते हैं और
  SQLite पहचान के माध्यम से इनबाउंड सेशन पंक्तियां रिकॉर्ड करते हैं।
- सक्रिय सेशन पंक्तियों से ट्रांसक्रिप्ट लोकेटर persistence हटा दी गई है।
  `resolveSessionTranscriptTarget` `agentId`, `sessionId`, और वैकल्पिक
  topic मेटाडेटा लौटाता है; doctor ही एकमात्र कोड है जो विरासत ट्रांसक्रिप्ट फाइल
  नाम import करता है।
- Runtime ट्रांसक्रिप्ट headers SQLite version `1` से शुरू होते हैं। पुराने JSONL V1/V2/V3
  आकार upgrades केवल doctor import में रहते हैं और imported headers को
  rows संग्रहीत होने से पहले वर्तमान SQLite transcript version में normalize करते हैं।
- database-first guard अब `SessionManager.listAll` और
  `SessionManager.forkFromSession` पर प्रतिबंध लगाता है; session listing और fork/restore workflows
  row/scoped SQLite APIs पर ही रहने चाहिए।
- guard doctor/import code के बाहर legacy transcript JSONL parse/active-branch repair helper
  names पर भी प्रतिबंध लगाता है, इसलिए runtime दूसरा legacy
  transcript migration path नहीं बढ़ा सकता।
- Embedded PI runs आने वाले transcript handles को reject करते हैं। वे worker launch से पहले
  और फिर attempt द्वारा transcript state छूने से पहले SQLite
  `{agentId, sessionId}` identity का उपयोग करते हैं। stale `/tmp/*.jsonl` input
  runtime write target नहीं चुन सकता।
- Cache trace, Anthropic payload, raw stream, और diagnostics timeline records
  अब typed SQLite `diagnostic_events` rows में लिखते हैं। Gateway stability bundles
  अब typed SQLite `diagnostic_stability_bundles` rows में लिखते हैं। पुराने
  `diagnostics.cacheTrace.filePath`, `OPENCLAW_CACHE_TRACE_FILE`,
  `OPENCLAW_ANTHROPIC_PAYLOAD_LOG_FILE`, और
  `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` JSONL override paths हटा दिए गए हैं, और
  normal stability capture अब `logs/stability/*.json` files नहीं लिखता।
- Cron persistence अब हर save पर पूरी job table को delete/reinsert करने के बजाय
  SQLite `cron_jobs` rows को reconcile करता है। Plugin target
  writebacks matching cron rows को सीधे update करते हैं और runtime cron state को
  उसी state-database transaction में रखते हैं।
- Cron runtime callers अब stable SQLite cron store key का उपयोग करते हैं। Legacy
  `cron.store` paths केवल doctor import inputs हैं; production gateway, task
  maintenance, status, run-log, और Telegram target writeback paths
  `resolveCronStoreKey` का उपयोग करते हैं और अब key को path-normalize नहीं करते। Cron status अब
  पुराने file-shaped `storePath` field के बजाय `storeKey` report करता है।
- Cron runtime load और scheduling अब legacy persisted job
  shapes जैसे `jobId`, `schedule.cron`, numeric `atMs`, string booleans, या
  missing `sessionTarget` को normalize नहीं करते। Rows को SQLite में insert करने से पहले
  Doctor legacy import इन repairs का owner है।
- ACP spawn अब transcript JSONL file paths resolve या persist नहीं करता। Spawn
  और thread-bind setup SQLite session row को सीधे persist करते हैं और
  session id को retained transcript identity के रूप में रखते हैं।
- ACP session metadata APIs अब `agentId` के आधार पर SQLite rows read/list/upsert करते हैं और
  ACP session entry contract के भाग के रूप में अब `storePath` expose नहीं करते।
- Session usage accounting और gateway usage aggregation अब transcripts को
  केवल `{agentId, sessionId}` से resolve करते हैं। cost/usage cache और discovered-session
  summaries अब transcript locator strings synthesize या return नहीं करते।
- Gateway chat append, abort-partial persistence, `/sessions.send`, और
  webchat media transcript writes सीधे SQLite transcript
  scope के माध्यम से append करते हैं। gateway transcript-injection helper अब
  `transcriptLocator` parameter स्वीकार नहीं करता।
- SQLite transcript discovery अब केवल transcript scopes और stats list करता है:
  `{agentId, sessionId, updatedAt, eventCount}`। dead
  `listSqliteSessionTranscriptLocators` compatibility helper और per-row
  `locator` field हट गए हैं।
- Transcript repair runtime अब केवल
  `repairTranscriptSessionStateIfNeeded({agentId, sessionId})` expose करता है। पुराना
  locator-based repair helper delete कर दिया गया है; doctor/debug code explicit
  source file paths पढ़ता है और locator strings को कभी migrate नहीं करता।
- ACP replay ledger runtime अब per-session replay rows को
  `acp/event-ledger.json` के बजाय shared SQLite state database में store करता है; doctor legacy file को import करके
  remove करता है।
- Gateway transcript reader helpers अब पुराने
  `session-utils.fs` module name के बजाय
  `src/gateway/session-transcript-readers.ts` में रहते हैं। fallback retry history check को
  पुराने file-helper surface के बजाय SQLite transcript content के नाम से रखा गया है।
- Gateway injected-chat और compaction helpers अब transcript paths या
  source files values को name करने के बजाय internal helper APIs के माध्यम से SQLite transcript scope pass करते हैं।
- Bootstrap continuation detection अब
  `hasCompletedBootstrapTranscriptTurn` के माध्यम से SQLite transcript rows check करता है; यह अब file-shaped
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
  shared plugin state में रहते हैं।
- Microsoft Teams SSO tokens locked JSON files से SQLite plugin
  state में चले गए। Doctor `msteams-sso-tokens.json` import करता है, payloads से canonical SSO token
  keys rebuild करता है, और source file remove करता है। Delegated OAuth tokens अपने existing private credential-file boundary पर रहते हैं।
- Matrix sync cache state `bot-storage.json` से SQLite plugin
  state में चली गई। Doctor legacy raw या wrapped sync payloads import करता है और
  source file remove करता है। Active Matrix और QA Matrix clients SQLite sync-store root
  directory pass करते हैं, fake `sync-store.json` या `bot-storage.json` path नहीं।
- Matrix legacy crypto migration status
  `legacy-crypto-migration.json` से SQLite plugin state में चला गया। Doctor
  old status file import करता है; Matrix SDK IndexedDB snapshots
  `crypto-idb-snapshot.json` से SQLite plugin blobs में चले गए। Matrix recovery keys और
  credentials SQLite plugin-state rows हैं; उनकी पुरानी JSON files केवल doctor
  migration inputs हैं।
- Memory Wiki activity logs अब
  `.openclaw-wiki/log.jsonl` के बजाय SQLite plugin state का उपयोग करते हैं। Memory Wiki migration provider पुराने
  JSONL logs import करता है; wiki markdown और user vault content workspace content के रूप में
  file-backed रहते हैं।
- Memory Wiki अब `.openclaw-wiki/state.json` या unused
  `.openclaw-wiki/locks` directory नहीं बनाता। migration provider उन retired
  plugin metadata files को remove करता है यदि किसी पुराने vault में वे अब भी हैं।
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
  legacy file reads, या file-rewrite options स्वीकार या derive नहीं करता।
- Codex app-server conversation bindings अब
  OpenClaw session key या explicit `{agentId, sessionId}` scope के आधार पर SQLite plugin state key करते हैं। उन्हें transcript-path fallback bindings preserve नहीं करने चाहिए।
- Codex app-server mirrored-history reads केवल SQLite transcript scope का उपयोग करते हैं;
  उन्हें transcript file paths से identity recover नहीं करनी चाहिए।
- Role-ordering और compaction reset paths अब पुराने transcript
  files unlink नहीं करते; reset केवल SQLite session row और transcript identity rotate करता है।
- Gateway reset और checkpoint responses clean session rows plus session
  ids return करते हैं। वे अब clients के लिए SQLite transcript locators synthesize नहीं करते।
- Memory-core dreaming अब missing
  JSONL files probe करके session rows prune नहीं करता। Subagent cleanup filesystem existence checks के बजाय
  session runtime API से गुजरता है। इसके transcript-ingestion tests
  `agents/<id>/sessions` fixtures या locator
  placeholders बनाने के बजाय सीधे SQLite rows seed करते हैं।
- Memory transcript indexing citation/read helpers के लिए
  `transcript:<agentId>:<sessionId>` को virtual search-hit path के रूप में expose कर सकता है। durable index source
  relational है (`source_kind='sessions'`, `source_key='session:<sessionId>'`,
  `session_id=<sessionId>`), इसलिए यह value runtime transcript locator नहीं है,
  filesystem path नहीं है, और इसे session runtime APIs में कभी वापस pass नहीं करना चाहिए।
- Gateway doctor memory status short-term recall और phase-signal counts
  `memory/.dreams/*.json` के बजाय SQLite plugin-state rows से पढ़ता है; CLI और
  doctor output अब उस storage को path नहीं, SQLite store के रूप में label करते हैं।
- Memory-core runtime, CLI status, Gateway doctor methods, और plugin SDK
  facades अब legacy `.dreams/session-corpus` files audit या archive नहीं करते।
  वे files केवल migration inputs हैं; doctor उन्हें SQLite में import करता है और
  verification के बाद source delete करता है। Active session-ingestion evidence rows
  अब virtual SQLite path `memory/session-ingestion/<day>.txt` का उपयोग करते हैं; runtime
  `.dreams/session-corpus` से कभी state नहीं लिखता या derive करता।
- Memory-core public artifacts SQLite host events को virtual JSON
  artifact `memory/events/memory-host-events.json` के रूप में expose करते हैं; वे अब
  legacy `.dreams/events.jsonl` source path reuse नहीं करते।
- Sandbox container/browser registries अब typed session, image, timestamp,
  backend/config, और browser port columns के साथ shared
  `sandbox_registry_entries` SQLite table का उपयोग करते हैं। Doctor legacy monolithic और
  sharded JSON registry files import करता है और successful sources remove करता है। Runtime reads
  source of truth के रूप में typed row columns का उपयोग करते हैं; `entry_json` केवल replay/debug
  copy है।
- Commitments अब whole-store JSON blob के बजाय typed shared `commitments` table का उपयोग करते हैं। Snapshot saves commitment id के आधार पर upsert करते हैं और table clear करके reinsert करने के बजाय केवल
  missing rows delete करते हैं। Runtime commitments को typed scope, delivery-window, status, attempt, और text
  columns से load करता है; `record_json` केवल replay/debug copy है। Doctor legacy
  `commitments.json` import करता है और successful import के बाद उसे remove करता है।
- Cron job definitions, schedule state, और run history में अब runtime
  JSON writers या readers नहीं हैं। Runtime typed schedule के साथ `cron_jobs` rows का उपयोग करता है,
  पेलोड, डिलीवरी, failure-alert, सत्र, स्थिति, और रनटाइम-स्टेट कॉलम, साथ ही स्थिति, डायग्नोस्टिक्स सारांश, डिलीवरी स्थिति/त्रुटि,
  सत्र/रन, मॉडल, और टोकन कुलों के लिए typed
  `cron_run_logs` metadata। `job_json` केवल replay/debug कॉपी है; `state_json` nested
  रनटाइम डायग्नोस्टिक्स रखता है जिनके लिए अभी hot query fields नहीं हैं, जबकि रनटाइम
  typed कॉलम से hot state fields को rehydrate करता है। Doctor
  पुराने `jobs.json`, `jobs-state.json`, और `runs/*.jsonl` फ़ाइलें import करता है और
  imported sources हटा देता है। Plugin target writebacks पूरी cron store को लोड और replace करने के बजाय matching `cron_jobs`
  rows update करते हैं।
- Gateway startup रनटाइम
  projection में legacy `notify: true` markers को अनदेखा करता है। `cron.webhook` valid होने पर Doctor उन्हें explicit SQLite delivery में translate करता है,
  unset होने पर inert markers हटाता है, और configured webhook invalid होने पर
  warning के साथ उन्हें preserve करता है।
- Outbound और session delivery queues अब queue status, entry kind,
  session key, channel, target, account id, retry count, last attempt/error,
  recovery state, और platform-send markers को shared
  `delivery_queue_entries` table में typed columns के रूप में store करती हैं। Runtime recovery उन hot fields को
  typed columns से पढ़ती है, और retry/recovery mutations replay JSON rewrite किए बिना उन columns को सीधे update करते हैं। पूरा JSON payload केवल message bodies और दूसरे cold replay data के लिए
  replay/debug blob के रूप में रहता है।
- Managed outgoing image records अब shared typed
  `managed_outgoing_image_records` rows का उपयोग करते हैं, जबकि media bytes अब भी
  `media_blobs` में store होते हैं। JSON record केवल replay/debug copy के रूप में रहता है।
- Discord model-picker preferences, command-deploy hashes, और thread bindings
  अब shared SQLite Plugin state का उपयोग करते हैं। उनके legacy JSON import plans
  Discord Plugin setup/doctor migration surface में रहते हैं, core migration code में नहीं।
- Plugin legacy import detectors doctor-named modules जैसे
  `doctor-legacy-state.ts` या `doctor-state-imports.ts` का उपयोग करते हैं; normal channel runtime
  modules को legacy JSON detectors import नहीं करने चाहिए।
- BlueBubbles catchup cursors और inbound dedupe markers अब shared SQLite
  Plugin state का उपयोग करते हैं। उनके legacy JSON import plans BlueBubbles Plugin
  setup/doctor migration surface में रहते हैं, core migration code में नहीं।
- Telegram update offsets, sticker cache rows, sent-message cache rows,
  topic-name cache rows, और thread bindings अब shared SQLite Plugin
  state का उपयोग करते हैं। उनके legacy JSON import plans Telegram Plugin
  setup/doctor migration surface में रहते हैं, core migration code में नहीं।
- iMessage catchup cursors, reply short-id mappings, और sent-echo dedupe rows
  अब shared SQLite Plugin state का उपयोग करते हैं। पुरानी `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, और `imessage/sent-echoes.jsonl` फ़ाइलें
  केवल doctor inputs हैं।
- Feishu message dedupe rows अब
  `feishu/dedup/*.json` फ़ाइलों के बजाय shared SQLite Plugin state का उपयोग करते हैं। इसका legacy JSON import plan Feishu
  Plugin setup/doctor migration surface में रहता है, core migration code में नहीं।
- Microsoft Teams conversations, polls, pending upload buffers, और feedback
  learnings अब shared SQLite Plugin state/blob tables का उपयोग करते हैं। pending upload
  path `plugin_blob_entries` का उपयोग करता है ताकि media buffers base64 JSON के बजाय SQLite BLOBs के रूप में store हों। Runtime helper names अब `*-fs` file-store naming के बजाय SQLite/state naming
  का उपयोग करते हैं, और पुराना `storePath` shim इन stores से हट गया है। इसका legacy JSON import plan Microsoft Teams
  Plugin setup/doctor migration surface में रहता है।
- Zalo hosted outbound media अब `openclaw-zalo-outbound-media` JSON/bin temp sidecars के बजाय shared SQLite `plugin_blob_entries`
  का उपयोग करता है।
- Diffs viewer HTML और metadata अब `meta.json`/`viewer.html` temp files के बजाय shared SQLite `plugin_blob_entries`
  का उपयोग करते हैं। Rendered PNG/PDF outputs temp materializations ही रहते हैं
  क्योंकि channel delivery को अब भी file path चाहिए।
- Canvas managed documents अब default `state/canvas/documents` directory के बजाय shared SQLite `plugin_blob_entries` का उपयोग करते हैं। Canvas host उन
  blobs को सीधे serve करता है; local files केवल explicit `host.root`
  operator content या temporary materialization के लिए बनाई जाती हैं जब downstream media reader
  को path चाहिए।
- File Transfer audit decisions अब unbounded `audit/file-transfer.jsonl` runtime log के बजाय shared SQLite `plugin_state_entries`
  का उपयोग करते हैं। Doctor legacy JSONL audit file को Plugin state में import करता है और clean import के बाद source
  हटा देता है।
- ACPX process leases और Gateway instance identity अब shared SQLite Plugin
  state का उपयोग करते हैं। Doctor legacy `gateway-instance-id` file को Plugin state में import करता है
  और source हटा देता है।
- ACPX generated wrapper scripts और isolated Codex home OpenClaw temp root के अंतर्गत temporary
  materialization हैं, durable OpenClaw state नहीं। Durable ACPX runtime records SQLite lease और gateway-instance rows हैं;
  पुराना ACPX `stateDir` config surface हटा दिया गया है क्योंकि अब वहाँ कोई runtime state
  नहीं लिखा जाता।
- Gateway media attachments अब canonical byte store के रूप में shared `media_blobs` SQLite table का उपयोग करते हैं। Channel और sandbox
  compatibility surfaces को लौटाए गए local paths database row के temp materializations हैं, durable media store नहीं। Runtime media allowlists में अब legacy
  `$OPENCLAW_STATE_DIR/media` या config-dir `media` roots शामिल नहीं हैं; वे directories
  केवल doctor import sources हैं।
- Shell completion अब `$OPENCLAW_STATE_DIR/completions/*` cache
  files नहीं लिखता। Install, doctor, update, और release smoke paths durable completion cache
  files के बजाय generated completion output या profile sourcing का उपयोग करते हैं।
- Gateway skill-upload staging अब shared `skill_uploads` rows का उपयोग करता है। Upload
  metadata, idempotency keys, और archive bytes SQLite में रहते हैं; installer को
  केवल install चलने के दौरान temporary materialized archive path मिलता है।
- Subagent inline attachments अब workspace
  `.openclaw/attachments/*` के अंतर्गत materialize नहीं होते। spawn path SQLite VFS seed entries तैयार करता है,
  inline runs उन entries को per-agent runtime scratch namespace में seed करते हैं,
  और disk-backed tools attachment paths के लिए उस SQLite scratch को overlay करते हैं। पुराने subagent-run attachment-dir registry columns और cleanup hooks हट गए हैं।
- CLI image hydration अब stable `openclaw-cli-images` cache
  files maintain नहीं करता। External CLI backends को अब भी file paths मिलते हैं, लेकिन वे paths
  cleanup के साथ per-run temp materializations होते हैं।
- Cache-trace diagnostics, Anthropic payload diagnostics, raw model stream
  diagnostics, diagnostics timeline events, और Gateway stability bundles अब
  `logs/*.jsonl` या `logs/stability/*.json` files के बजाय SQLite rows लिखते हैं।
  Runtime path override flags और env vars हटा दिए गए हैं; export/debug
  commands database rows से files को explicitly materialize कर सकते हैं।
- macOS companion में अब rolling `diagnostics.jsonl` writer नहीं है। App
  logs unified logging में जाते हैं, और durable Gateway diagnostics SQLite-backed रहते हैं।
- macOS port-guardian record list अब Application Support JSON file
  या opaque singleton blob के बजाय typed shared SQLite
  `macos_port_guardian_records` rows का उपयोग करती है।
- Gateway singleton locks अब temp-dir lock files के बजाय
  `gateway_locks` scope के अंतर्गत typed shared SQLite `state_leases` rows का उपयोग करते हैं। Fly और OAuth
  troubleshooting docs अब stale file-lock cleanup के बजाय SQLite lease/auth refresh lock की ओर संकेत करते हैं।
- Gateway restart sentinel state अब `restart-sentinel.json` के बजाय typed shared SQLite
  `gateway_restart_sentinel` rows का उपयोग करता है; runtime
  sentinel kind, status, routing, message, continuation, और stats को
  typed columns से पढ़ता है। `payload_json` केवल replay/debug copy है। Runtime code
  SQLite row को सीधे clear करता है और अब file cleanup plumbing नहीं रखता।
- Gateway restart intent और supervisor handoff state अब
  `gateway-restart-intent.json` और
  `gateway-supervisor-restart-handoff.json` sidecars के बजाय typed shared
  SQLite `gateway_restart_intent` और `gateway_restart_handoff` rows का उपयोग करते हैं।
- Gateway singleton coordination अब `gateway.<hash>.lock` files लिखने के बजाय
  `gateway_locks` के अंतर्गत typed `state_leases` rows का उपयोग करता है। Lease row
  lock owner, expiry, Heartbeat, और debug payload का owner है; SQLite
  atomic acquire/release boundary का owner है। Retired file-lock directory option
  हट गया है; tests SQLite row identity का सीधे उपयोग करते हैं।
- पुराना unreferenced cron usage-report helper जो `cron/runs/*.jsonl`
  files scan करता था, delete कर दिया गया। Cron run history reports को typed
  `cron_run_logs` SQLite rows पढ़नी चाहिए।
- Main-session restart recovery अब `agents/*/sessions`
  directories scan करने के बजाय SQLite `agent_databases` registry के माध्यम से candidate agents खोजती है।
- Gemini session-corruption recovery अब केवल SQLite session row delete करती है;
  उसे अब legacy `storePath` gate की आवश्यकता नहीं है और न ही derived
  transcript JSONL path को unlink करने की कोशिश करती है।
- Path override handling अब literal `undefined`/`null` environment
  values को unset मानता है, जिससे tests या shell handoffs के दौरान accidental repo-root `undefined/state/*.sqlite`
  databases बनने से बचाव होता है।
- Config health fingerprints अब `logs/config-health.json` के बजाय typed shared SQLite `config_health_entries`
  rows का उपयोग करते हैं, जिससे normal config file ही
  एकमात्र non-credential configuration document बनी रहती है। macOS companion केवल
  process-local health state रखता है और पुराना JSON sidecar recreate नहीं करता।
- Auth profile runtime अब credential JSON files import या write नहीं करता। Canonical credential store SQLite है; `auth-profiles.json`, per-agent
  `auth.json`, और shared `credentials/oauth.json` doctor migration inputs हैं
  जिन्हें import के बाद हटा दिया जाता है।
- Auth profile save/state tests अब typed SQLite auth tables को सीधे assert करते हैं
  और legacy auth-profile filenames का उपयोग केवल doctor migration inputs के लिए करते हैं।
- `openclaw secrets apply` केवल config file, env file, और SQLite
  auth-profile store को scrub करता है। यह अब retired per-agent `auth.json` edit करने वाली compatibility logic नहीं रखता;
  उस file को import और delete करने का owner doctor है।
- Hermes secret migration plans और applies imported API-key profiles को सीधे
  SQLite auth-profile store में डालते हैं। यह अब intermediate target के रूप में
  `auth-profiles.json` write या verify नहीं करता।
- User-facing auth docs अब users को `auth-profiles.json` inspect या copy करने को कहने के बजाय
  `state/openclaw.sqlite#table/auth_profile_stores/<agentDir>` describe करते हैं; legacy OAuth/auth JSON
  names केवल doctor-import inputs के रूप में documented रहते हैं।
- Core state-path helpers अब retired `credentials/oauth.json`
  file expose नहीं करते। Legacy filename doctor auth import path तक local है।
- Install, security, onboarding, model-auth, और SecretRef docs अब
  per-agent auth-profile JSON files के बजाय SQLite auth-profile rows और whole-state backup/migration describe करते हैं।
- PI model discovery अब canonical credentials को in-memory
  `pi-coding-agent` auth storage में pass करता है। यह discovery के दौरान अब
  per-agent `auth.json` create, scrub, या write नहीं करता।
- Voice Wake trigger और routing settings अब `settings/voicewake.json`, `settings/voicewake-routing.json`, या
  opaque generic rows के बजाय typed shared SQLite tables का उपयोग करते हैं; doctor legacy JSON files import करता है और
  successful migration के बाद उन्हें हटा देता है।
- Update-check state अब `update-check.json` या opaque generic blob के बजाय
  typed shared `update_check_state` row का उपयोग करता है; doctor
  legacy JSON file import करता है और successful migration के बाद उसे हटा देता है।
- Config health state अब `logs/config-health.json` या opaque generic blob के बजाय typed shared `config_health_entries` rows का उपयोग करता है; doctor
  legacy JSON file import करता है और successful migration के बाद उसे हटा देता है।
- Plugin conversation binding approvals अब opaque shared SQLite state या के बजाय typed
  `plugin_binding_approvals` rows का उपयोग करते हैं
  `plugin-binding-approvals.json`; पुरानी फ़ाइल डॉक्टर माइग्रेशन इनपुट है।
- सामान्य मौजूदा-बातचीत बाइंडिंग्स अब
  `bindings/current-conversations.json` को फिर से लिखने के बजाय टाइप की हुई
  `current_conversation_bindings` पंक्तियां संग्रहीत करती हैं; डॉक्टर पुरानी JSON फ़ाइल आयात करता है और
  सफल माइग्रेशन के बाद उसे हटा देता है।
- Memory Wiki आयातित-स्रोत सिंक लेजर अब `.openclaw-wiki/source-sync.json` को फिर से लिखने के बजाय
  हर vault/source कुंजी के लिए एक SQLite plugin-state पंक्ति
  संग्रहीत करते हैं; माइग्रेशन प्रदाता पुराने JSON लेजर को आयात करके हटा देता है।
- Memory Wiki ChatGPT आयात-रन रिकॉर्ड अब `.openclaw-wiki/import-runs/*.json` लिखने के बजाय
  हर vault/run id के लिए एक SQLite plugin-state पंक्ति संग्रहीत करते हैं।
  रोलबैक स्नैपशॉट तब तक स्पष्ट vault फ़ाइलें बने रहते हैं, जब तक आयात-रन स्नैपशॉट
  आर्काइविंग को blob storage में नहीं ले जाया जाता।
- Memory Wiki संकलित डाइजेस्ट अब
  `.openclaw-wiki/cache/agent-digest.json` और
  `.openclaw-wiki/cache/claims.jsonl` लिखने के बजाय SQLite plugin blob पंक्तियां संग्रहीत करते हैं। माइग्रेशन प्रदाता पुरानी कैश
  फ़ाइलें आयात करता है और कैश डायरेक्टरी खाली होने पर उसे हटा देता है।
- ClawHub skill इंस्टॉल ट्रैकिंग अब रनटाइम पर `.clawhub/lock.json` और
  `.clawhub/origin.json` sidecars लिखने या पढ़ने के बजाय हर
  workspace/skill के लिए एक SQLite plugin-state पंक्ति संग्रहीत करती है। रनटाइम कोड फ़ाइल-आकार वाले lockfile/origin अमूर्तनों के बजाय tracked-install
  state objects का उपयोग करता है। डॉक्टर
  कॉन्फ़िगर किए गए agent workspaces से पुराने sidecars आयात करता है और साफ़ आयात
  के बाद उन्हें हटा देता है।
- इंस्टॉल किया गया Plugin इंडेक्स अब `plugins/installs.json` के बजाय टाइप की हुई साझा SQLite
  `installed_plugin_index` singleton पंक्ति पढ़ता और लिखता है; पुरानी
  JSON फ़ाइल केवल डॉक्टर माइग्रेशन इनपुट है और आयात के बाद हटा दी जाती है।
- पुराना `plugins/installs.json` path helper अब डॉक्टर legacy
  कोड में रहता है। रनटाइम plugin-index मॉड्यूल केवल SQLite-समर्थित persistence
  विकल्प उजागर करते हैं, JSON फ़ाइल path नहीं।
- Gateway restart sentinel, restart intent, और supervisor handoff state अब generic
  opaque blobs के बजाय टाइप की हुई साझा SQLite पंक्तियों (`gateway_restart_sentinel`,
  `gateway_restart_intent`, और `gateway_restart_handoff`) का उपयोग करते हैं। रनटाइम restart code में फ़ाइल-आकार वाला sentinel/intent/handoff
  contract नहीं है।
- Matrix sync cache, storage metadata, thread bindings, inbound dedupe markers,
  startup verification cooldown state, SDK IndexedDB crypto snapshots,
  credentials, और recovery keys अब साझा SQLite plugin state/blob
  tables का उपयोग करते हैं। रनटाइम path structs अब `storage-meta.json` metadata
  path उजागर नहीं करते; वह filename केवल पुराना माइग्रेशन इनपुट है। उनकी पुरानी JSON आयात
  योजना Matrix Plugin setup/doctor migration सतह में रहती है।
- Matrix startup अब पुराने Matrix file
  state को scan, report, या complete नहीं करता। Matrix file detection, legacy crypto snapshot creation, room-key
  restore migration state, import, और source removal सब डॉक्टर के स्वामित्व में हैं।
- Matrix रनटाइम माइग्रेशन barrels हटा दिए गए। Legacy state/crypto detection
  और mutation helpers को रनटाइम API सतह का हिस्सा होने के बजाय
  Matrix डॉक्टर सीधे आयात करता है।
- Matrix migration snapshot reuse markers अब `matrix/migration-snapshot.json` के बजाय SQLite plugin state
  में रहते हैं; डॉक्टर अब भी sidecar state file लिखे बिना वही
  verified pre-migration archive फिर से उपयोग कर सकता है।
- Nostr bus cursors और profile publish state अब साझा SQLite plugin
  state का उपयोग करते हैं। उनकी पुरानी JSON आयात योजना Nostr Plugin setup/doctor
  migration सतह में रहती है।
- Active Memory session toggles अब
  `session-toggles.json` के बजाय साझा SQLite plugin state का उपयोग करते हैं; memory को फिर चालू करने पर JSON object फिर से लिखने के बजाय
  पंक्ति हट जाती है।
- Skill Workshop proposals और review counters अब per-workspace `skill-workshop/<workspace>.json` stores के बजाय साझा SQLite plugin
  state का उपयोग करते हैं। हर proposal `skill-workshop/proposals` के तहत अलग पंक्ति है, और review
  counter `skill-workshop/reviews` के तहत अलग पंक्ति है।
- Skill Workshop reviewer subagent runs अब `skill-workshop/<sessionId>.json` sidecar session
  paths बनाने के बजाय runtime session transcript
  resolver का उपयोग करते हैं।
- ACPX process leases अब पूरी-फ़ाइल `process-leases.json` registry के बजाय
  `acpx/process-leases` के तहत साझा SQLite plugin state का उपयोग करते हैं।
  हर lease अपनी अलग पंक्ति के रूप में संग्रहीत होती है, जिससे runtime JSON rewrite path के बिना
  startup stale-process reaping सुरक्षित रहता है।
- ACPX wrapper scripts और isolated Codex home
  OpenClaw temp root में जनरेट किए जाते हैं। वे जरूरत के अनुसार फिर बनाए जाते हैं और backup या
  migration inputs नहीं हैं।
- Subagent run registry persistence टाइप की हुई साझा `subagent_runs` पंक्तियों का उपयोग करता है। पुराना
  `subagents/runs.json` path अब केवल डॉक्टर माइग्रेशन इनपुट है, और
  runtime helper names अब state layer को disk-backed नहीं बताते।
  Runtime tests अब registry behavior साबित करने के लिए invalid या empty `runs.json` fixtures नहीं बनाते; वे सीधे SQLite rows seed/read करते हैं।
- Backup archive बनाने से पहले state directory stage करता है, non-database files copy करता है,
  `VACUUM INTO` के साथ `*.sqlite` databases का snapshot बनाता है, live WAL/SHM
  sidecars छोड़ देता है, archive manifest में snapshot metadata दर्ज करता है, और
  completed backup runs को archive manifest के साथ SQLite में दर्ज करता है। `openclaw backup
create` लिखे गए archive को default रूप से validate करता है; `--no-verify`
  स्पष्ट fast path है।
- `openclaw backup restore` extraction से पहले archive validate करता है, verifier के normalized manifest का फिर उपयोग करता है, और verified manifest assets को उनके
  दर्ज source paths पर restore करता है। Writes के लिए इसे `--yes` चाहिए और restore plan के लिए `--dry-run`
  का समर्थन करता है।
- पुराना backup volatile-path filter हटा दिया गया है। Backup को अब legacy session या cron JSON/JSONL files के लिए
  live-tar skip list की जरूरत नहीं है, क्योंकि archive creation से पहले SQLite
  snapshots staged होते हैं।
- Plain setup और onboarding workspace preparation अब
  `agents/<agentId>/sessions/` directories नहीं बनाते। वे केवल config/workspace बनाते हैं;
  SQLite session rows और transcript rows मांग पर
  per-agent database में बनाए जाते हैं।
- Security permission repair अब `sessions.json` और transcript
  JSONL files के बजाय global और per-agent SQLite
  databases plus WAL/SHM sidecars को target करता है।
- Sandbox registry runtime names अब active store में legacy JSON registry terminology ढोने के बजाय
  SQLite registry kinds को सीधे बताते हैं।
- `openclaw reset --scope config+creds+sessions` केवल legacy
  `sessions/` directories नहीं, बल्कि per-agent
  `openclaw-agent.sqlite` databases plus WAL/SHM sidecars हटाता है।
- Gateway aggregate session helpers अब entry-oriented names का उपयोग करते हैं:
  `loadCombinedSessionEntriesForGateway` `{ databasePath, entries }` लौटाता है।
  पुरानी combined-store naming को runtime callers से हटा दिया गया है।
- Docker MCP channel seeding अब
  `sessions.json` और JSONL transcript बनाने के बजाय main session row और transcript
  events को per-agent SQLite database में लिखता है।
- Bundled session-memory hook अब
  `{agentId, sessionId}` से SQLite में previous-session context resolve करता है। यह अब transcript paths या `workspace/sessions` directories को scan, store, या synthesize
  नहीं करता।
- Bundled command-logger hook अब
  `logs/commands.log` में append करने के बजाय shared
  SQLite `command_log_entries` table में command audit rows लिखता है।
- Channel pairing allowlists अब रनटाइम और Plugin SDK में केवल SQLite-backed read/write helpers
  उजागर करते हैं। पुराना `*-allowFrom.json` path resolver और
  file reader केवल डॉक्टर legacy import code के तहत रहते हैं।
- `migration_runs` status,
  timestamps, और JSON reports के साथ legacy-state migration executions दर्ज करता है।
- `migration_sources` हर imported legacy file source को hash, size,
  record count, target table, run id, status, और source-removal state के साथ दर्ज करता है।
- `backup_runs` backup archive paths, status, और JSON manifests दर्ज करता है।
- Global schema unused `agents` registry table नहीं रखता। Agent
  database discovery canonical `agent_databases` registry है, जब तक रनटाइम के पास वास्तविक agent-record owner नहीं होता।
- Generated model catalog config agent directory द्वारा keyed, typed global SQLite
  `agent_model_catalogs` rows में संग्रहीत है। Runtime callers
  `ensureOpenClawModelCatalog` का उपयोग करते हैं; runtime code में कोई `models.json` compatibility API नहीं है। Implementation SQLite लिखता है और embedded PI registry
  stored payload से hydrate होती है, बिना `models.json` file बनाए।
- QMD session transcript markdown export और `memory.qmd.sessions` config हटा दिए गए। कोई QMD transcript collection नहीं है, कोई `qmd/sessions*` runtime
  path नहीं है, और कोई file-backed session memory bridge नहीं है।
- Memory-core runtime SQLite transcript indexing helpers को
  `openclaw/plugin-sdk/memory-core-host-engine-session-transcripts` से आयात करता है,
  QMD SDK subpath से नहीं। QMD subpath external callers के लिए compatibility re-export केवल तब तक रखता है,
  जब तक major SDK cleanup उसे हटा नहीं सकता।
- QMD का अपना `index.sqlite` अब main SQLite `plugin_blob_entries` table द्वारा समर्थित temp runtime materialization है। Runtime अब durable
  `~/.openclaw/agents/<agentId>/qmd` sidecar नहीं बनाता।
- Optional `memory-lancedb` Plugin अब
  `~/.openclaw/memory/lancedb` को implicit OpenClaw-managed store के रूप में नहीं बनाता। यह external LanceDB backend है और तब तक disabled रहता है, जब तक operator explicit `dbPath`
  configure नहीं करता।
- `check:database-first-legacy-stores` नए runtime source को fail करता है, जो
  legacy store names को write-style filesystem APIs के साथ pair करता है। यह runtime
  source को भी fail करता है, जो retired transcript bridge markers
  `transcriptLocator` या `sqlite-transcript://...` को फिर से लाता है। Migration, doctor, import,
  और explicit non-session export code अब भी allowed रहते हैं। व्यापक legacy contract
  names जैसे `sessionFile`, `storePath`, और पुराने `SessionManager` file-era
  facades के अब भी current owners हैं और required preflight check बनने से पहले
  अलग migration guard work चाहिए। Guard अब runtime
  `cache/*.json` stores, generic
  `thread-bindings.json` sidecars, cron state/run-log JSON, config health JSON,
  restart और lock sidecars, Voice Wake settings, plugin binding approvals,
  installed plugin index JSON, File Transfer audit JSONL, Memory Wiki activity
  logs, पुराने bundled `command-logger` text log, और pi-mono raw-stream JSONL
  diagnostics knobs को भी cover करता है। यह पुराने root-level doctor legacy module names को भी ban करता है, ताकि
  compatibility code `src/commands/doctor/` के तहत रहे। Android debug handlers
  भी `camera_debug.log` या
  `debug_logs.txt` cache files stage करने के बजाय logcat/in-memory output का उपयोग करते हैं।

## लक्षित स्कीमा संरचना

स्कीमा स्पष्ट रखें। होस्ट-स्वामित्व वाली रनटाइम स्थिति typed tables का उपयोग करती है। Plugin-स्वामित्व
वाली opaque स्थिति `plugin_state_entries` / `plugin_blob_entries` का उपयोग करती है; कोई
सामान्य होस्ट `kv` तालिका नहीं है।

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

भविष्य की खोज canonical event tables को बदले बिना FTS तालिकाएं जोड़ सकती है:

```text
transcript_events_fts(session_id, seq, text)
vfs_entries_fts(namespace, path, text)
```

बड़े मानों को JSON string encoding नहीं, बल्कि `blob` columns का उपयोग करना चाहिए। छोटे
structured data के लिए `value_json` रखें, जिसे plain SQLite tooling से inspectable
रहना चाहिए।

`agent_databases` इस branch के लिए canonical registry है। जब तक कोई वास्तविक
agent-record owner मौजूद न हो, `agents` तालिका न जोड़ें; एजेंट config
`openclaw.json` में रहता है।

## डॉक्टर माइग्रेशन संरचना

डॉक्टर को एक स्पष्ट migration step call करना चाहिए, जो reportable हो और
दोबारा चलाने के लिए सुरक्षित हो:

```bash
openclaw doctor --fix
```

`openclaw doctor --fix` सामान्य config preflight के बाद state migration implementation
invoke करता है और import से पहले एक verified backup बनाता है। Runtime
startup और `openclaw migrate` को legacy OpenClaw state files import नहीं करनी चाहिए।

Migration properties:

- एक migration pass सभी legacy file sources discover करता है और कुछ भी mutate करने
  से पहले एक plan बनाता है।
- डॉक्टर legacy files import करने से पहले एक verified pre-migration backup archive
  बनाता है।
- Imports idempotent होते हैं और source path, mtime, size, hash, और target
  table से keyed होते हैं।
- Successful source files को target database commit होने के बाद remove या archive
  किया जाता है।
- Failed imports source को untouched छोड़ते हैं और `migration_runs` में warning
  record करते हैं।
- Runtime code migration मौजूद होने के बाद केवल SQLite पढ़ता है।
- कोई downgrade/export-to-runtime-files path आवश्यक नहीं है।

## Migration Inventory

इन्हें global database में move करें:

- टास्क रजिस्ट्री रनटाइम लिखाइयां अब साझा डेटाबेस का उपयोग करती हैं; अनशिप्ड
  `tasks/runs.sqlite` साइडकार आयातक हटा दिया गया है। स्नैपशॉट सेव टास्क
  id के आधार पर upsert करते हैं और केवल अनुपस्थित टास्क/डिलीवरी पंक्तियां हटाते हैं।
- Task Flow रनटाइम लिखाइयां अब साझा डेटाबेस का उपयोग करती हैं; अनशिप्ड
  `tasks/flows/registry.sqlite` साइडकार आयातक हटा दिया गया है। स्नैपशॉट सेव
  फ्लो id के आधार पर upsert करते हैं और केवल अनुपस्थित फ्लो पंक्तियां हटाते हैं।
- Plugin स्टेट रनटाइम लिखाइयां अब साझा डेटाबेस का उपयोग करती हैं; अनशिप्ड
  `plugin-state/state.sqlite` साइडकार आयातक हटा दिया गया है।
- बिल्ट-इन मेमोरी खोज अब `memory/<agentId>.sqlite` पर डिफॉल्ट नहीं होती; उसकी
  इंडेक्स टेबल मालिक एजेंट डेटाबेस में रहती हैं, और स्पष्ट
  `memorySearch.store.path` साइडकार opt-in को doctor कॉन्फिग
  माइग्रेशन में सेवानिवृत्त कर दिया गया है।
- बिल्ट-इन मेमोरी reindex एजेंट डेटाबेस में केवल मेमोरी-स्वामित्व वाली टेबल रीसेट करता है।
  इसे पूरी SQLite फाइल को बदलना नहीं चाहिए, क्योंकि वही डेटाबेस
  सेशन, ट्रांसक्रिप्ट, VFS पंक्तियां, आर्टिफैक्ट, और रनटाइम कैश का मालिक है।
- मोनोलिथिक और शार्डेड JSON से सैंडबॉक्स कंटेनर/ब्राउजर रजिस्ट्रियां। रनटाइम
  लिखाइयां अब साझा डेटाबेस का उपयोग करती हैं; लेगेसी JSON आयात बना रहता है।
- Cron जॉब परिभाषाएं, शेड्यूल स्टेट, और रन इतिहास अब साझा SQLite का उपयोग करते हैं;
  doctor लेगेसी `jobs.json`, `jobs-state.json`, और
  `cron/runs/*.jsonl` फाइलें आयात/हटाता है
- डिवाइस पहचान/ऑथ, पुश, अपडेट जांच, कमिटमेंट, OpenRouter मॉडल
  कैश, इंस्टॉल किया गया Plugin इंडेक्स, और ऐप-सर्वर बाइंडिंग
- डिवाइस/Node पेयरिंग और बूटस्ट्रैप रिकॉर्ड अब टाइप्ड SQLite टेबल का उपयोग करते हैं
- डिवाइस-पेयर सूचना सब्सक्राइबर और डिलीवर किए गए अनुरोध मार्कर अब
  `device-pair-notify.json` के बजाय साझा SQLite plugin-state टेबल का उपयोग करते हैं।
- वॉइस-कॉल कॉल रिकॉर्ड अब `calls.jsonl` के बजाय
  `voice-call` / `calls` नेमस्पेस के तहत साझा SQLite plugin-state टेबल का उपयोग करते हैं; Plugin CLI
  SQLite-समर्थित कॉल इतिहास को tail और सारांशित करता है।
- QQBot Gateway सेशन, ज्ञात-यूजर रिकॉर्ड, और ref-index quote cache अब
  `session-*.json`, `known-users.json`,
  और `ref-index.jsonl` के बजाय `qqbot` नेमस्पेस (`gateway-sessions`,
  `known-users`, `ref-index`) के तहत SQLite Plugin स्टेट का उपयोग करते हैं। वे लेगेसी फाइलें कैश हैं और माइग्रेट नहीं की जातीं।
- Discord model-picker प्राथमिकताएं, command-deploy hashes, और thread bindings
  अब `model-picker-preferences.json`, `command-deploy-cache.json`, और
  `thread-bindings.json` के बजाय `discord` नेमस्पेस
  (`model-picker-preferences`, `command-deploy-hashes`, `thread-bindings`)
  के तहत SQLite Plugin स्टेट का उपयोग करते हैं; Discord doctor/setup माइग्रेशन
  लेगेसी फाइलों को आयात और हटाता है।
- BlueBubbles catchup cursors और inbound dedupe markers अब
  `bluebubbles/catchup/*.json` और
  `bluebubbles/inbound-dedupe/*.json` के बजाय `bluebubbles` नेमस्पेस (`catchup-cursors`, `inbound-dedupe`)
  के तहत SQLite Plugin स्टेट का उपयोग करते हैं; BlueBubbles doctor/setup माइग्रेशन
  लेगेसी फाइलों को आयात और हटाता है।
- Telegram update offsets, sticker cache entries, reply-chain message cache
  entries, sent-message cache entries, topic-name cache entries, और thread
  bindings अब `update-offset-*.json`,
  `sticker-cache.json`, `*.telegram-messages.json`,
  `*.telegram-sent-messages.json`, `*.telegram-topic-names.json`, और
  `thread-bindings-*.json` के बजाय `telegram` नेमस्पेस
  (`update-offsets`, `sticker-cache`, `message-cache`, `sent-messages`,
  `topic-names`, `thread-bindings`) के तहत SQLite Plugin स्टेट का उपयोग करते हैं; Telegram doctor/setup माइग्रेशन आयात करता है और
  लेगेसी फाइलों को हटाता है।
- iMessage catchup cursors, reply short-id mappings, और sent-echo dedupe rows
  अब `imessage/catchup/*.json`,
  `imessage/reply-cache.jsonl`, और `imessage/sent-echoes.jsonl` के बजाय
  `imessage` नेमस्पेस (`catchup-cursors`,
  `reply-cache`, `sent-echoes`) के तहत SQLite Plugin स्टेट का उपयोग करते हैं; iMessage
  doctor/setup माइग्रेशन लेगेसी फाइलों को आयात और हटाता है।
- Microsoft Teams conversations, polls, SSO tokens, और feedback learnings अब
  `msteams-conversations.json`,
  `msteams-polls.json`, `msteams-sso-tokens.json`, और `*.learnings.json` के बजाय
  SQLite Plugin स्टेट नेमस्पेस (`conversations`, `polls`, `sso-tokens`,
  `feedback-learnings`) का उपयोग करते हैं; Microsoft Teams doctor/setup माइग्रेशन
  लेगेसी फाइलों को आयात और आर्काइव करता है।
  लंबित अपलोड एक अल्पजीवी SQLite कैश हैं और पुरानी JSON कैश फाइलें
  माइग्रेट नहीं की जातीं।
- Matrix sync cache, storage metadata, thread bindings, inbound dedupe markers,
  startup verification cooldown state, credentials, recovery keys, और SDK
  IndexedDB crypto snapshots अब
  `bot-storage.json`, `storage-meta.json`, `thread-bindings.json`,
  `inbound-dedupe.json`, `startup-verification.json`, `credentials.json`,
  `recovery-key.json`, और `crypto-idb-snapshot.json` के बजाय
  `matrix` (`sync-store`, `storage-meta`, `thread-bindings`, `inbound-dedupe`,
  `startup-verification`, `credentials`, `recovery-key`, `idb-snapshots`) के तहत
  SQLite Plugin स्टेट/blob नेमस्पेस का उपयोग करते हैं; Matrix doctor/setup
  माइग्रेशन account-scoped Matrix storage roots से उन लेगेसी फाइलों को आयात और हटाता है।
- Nostr bus cursors और profile publish state अब
  `bus-state-*.json` और `profile-state-*.json` के बजाय
  `nostr` नेमस्पेस (`bus-state`, `profile-state`) के तहत SQLite Plugin स्टेट का उपयोग करते हैं; Nostr doctor/setup
  माइग्रेशन लेगेसी फाइलों को आयात और हटाता है।
- Active Memory सेशन toggles अब `session-toggles.json` के बजाय
  `active-memory/session-toggles` के तहत SQLite Plugin स्टेट का उपयोग करते हैं।
- Skill Workshop proposal queues और review counters अब
  प्रति-workspace `skill-workshop/<workspace>.json` फाइलों के बजाय
  `skill-workshop/proposals` और `skill-workshop/reviews` के तहत SQLite Plugin स्टेट का उपयोग करते हैं।
- Outbound delivery और session delivery queues अब durable
  `delivery-queue/*.json`, `delivery-queue/failed/*.json`, और
  `session-delivery-queue/*.json` फाइलों के बजाय अलग queue names
  (`outbound-delivery`, `session-delivery`) के तहत वैश्विक SQLite
  `delivery_queue_entries` टेबल साझा करती हैं। doctor legacy-state चरण
  लंबित और विफल पंक्तियां आयात करता है, पुराने delivered markers हटाता है, और आयात के बाद पुरानी
  JSON फाइलों को हटा देता है। Hot routing और retry fields टाइप्ड कॉलम हैं; JSON payload केवल replay/debug के लिए रखा गया है।
- ACPX process leases अब `process-leases.json` के बजाय `acpx/process-leases`
  के तहत SQLite Plugin स्टेट का उपयोग करते हैं।
- बैकअप और माइग्रेशन रन मेटाडेटा

इन्हें एजेंट डेटाबेस में ले जाएं:

- एजेंट सेशन roots और compatibility-shaped session-entry payloads। रनटाइम
  लिखाइयों के लिए पूरा: hot session metadata `sessions` में queryable है, जबकि
  legacy-shaped पूरा `SessionEntry` payload `session_entries` में बना रहता है।
- एजेंट ट्रांसक्रिप्ट इवेंट। रनटाइम लिखाइयों के लिए पूरा।
- Compaction checkpoints और transcript snapshots। रनटाइम लिखाइयों के लिए पूरा:
  checkpoint transcript copies SQLite transcript rows हैं और checkpoint
  metadata `transcript_snapshots` में रिकॉर्ड होता है। Gateway checkpoint helpers
  अब इन मानों को source files के बजाय transcript snapshots कहते हैं।
- एजेंट VFS scratch/workspace namespaces। रनटाइम VFS लिखाइयों के लिए पूरा।
- Subagent attachment payloads। रनटाइम लिखाइयों के लिए पूरा: वे SQLite VFS
  seed entries हैं और कभी durable workspace files नहीं होते।
- Tool artifacts। रनटाइम लिखाइयों के लिए पूरा।
- Run artifacts। per-agent
  `run_artifacts` टेबल के माध्यम से worker runtime लिखाइयों के लिए पूरा।
- Agent-local runtime caches। per-agent `cache_entries` टेबल के माध्यम से
  worker runtime scoped cache लिखाइयों के लिए पूरा। Gateway-wide model caches
  वैश्विक डेटाबेस में रहते हैं जब तक वे agent-specific न हो जाएं।
- ACP parent stream logs। रनटाइम लिखाइयों के लिए पूरा।
- ACP replay ledger sessions। `acp_replay_sessions` और `acp_replay_events` के माध्यम से
  रनटाइम लिखाइयों के लिए पूरा; लेगेसी `acp/event-ledger.json`
  केवल doctor input के रूप में रहता है।
- ACP session metadata। `acp_sessions` के माध्यम से रनटाइम लिखाइयों के लिए पूरा; `sessions.json` में लेगेसी
  `entry.acp` blocks केवल doctor migration input हैं।
- Trajectory sidecars जब वे स्पष्ट export files नहीं हैं। रनटाइम
  लिखाइयों के लिए पूरा: trajectory capture agent-database `trajectory_runtime_events`
  rows लिखता है और run-scoped artifacts को SQLite में mirror करता है। लेगेसी sidecars केवल doctor
  import inputs हैं; export ताजा JSONL support-bundle outputs materialize कर सकता है
  लेकिन runtime पर पुराने trajectory/transcript sidecars को पढ़ता या माइग्रेट नहीं करता।
  Runtime trajectory capture SQLite scope प्रदर्शित करता है; JSONL path helpers
  export/debug support तक अलग रखे गए हैं और runtime module से फिर से export नहीं किए जाते।
  Embedded-runner trajectory metadata transcript locator persist करने के बजाय `{agentId, sessionId, sessionKey}`
  identity रिकॉर्ड करता है।

इन्हें अभी file-backed रखें:

- `openclaw.json`
- provider या CLI credential files
- plugin/package manifests
- user workspaces और Git repositories जब disk mode चुना गया हो
- operator tailing के लिए बने logs, जब तक कोई specific log surface स्थानांतरित न हो

## माइग्रेशन योजना

### चरण 0: सीमा को फ्रीज करें

और पंक्तियां स्थानांतरित करने से पहले durable-state boundary स्पष्ट करें:

- वैश्विक डेटाबेस में `migration_runs` टेबल जोड़ें।
  legacy-state migration execution reports के लिए पूरा।
- file-to-database import के लिए एक single doctor-owned state migration service जोड़ें।
  पूरा: `openclaw doctor --fix` legacy-state migration implementation का उपयोग करता है।
- `plan` को read-only बनाएं और `apply` को backup बनाने, import करने, verify करने, और
  फिर पुरानी files delete या quarantine करने दें।
  पूरा: doctor verified pre-migration backup बनाता है, backup path
  `migration_runs` में पास करता है, और importer/removal paths को फिर से उपयोग करता है।
- static bans जोड़ें ताकि नया runtime code legacy state files न लिख सके, जबकि
  migration code और tests अभी भी उन्हें seed/read कर सकें।
  वर्तमान में माइग्रेट किए गए legacy stores के लिए पूरा; guard nested
  tests को forbidden runtime transcript locator contracts के लिए भी scan करता है।

### चरण 1: वैश्विक नियंत्रण तल पूरा करें

shared coordination state को `state/openclaw.sqlite` में रखें:

- एजेंट और एजेंट डेटाबेस registry
- Task और Task Flow ledgers
- Plugin state
- Sandbox container/browser registry
- Cron/scheduler run history
- Pairing, device, push, update-check, TUI, OpenRouter/model caches, और अन्य
  छोटे gateway-scoped runtime state
- Backup और migration metadata
- Gateway media attachment bytes। रनटाइम लिखाइयों के लिए पूरा; direct file paths
  channel senders और sandbox staging के साथ compatibility के लिए temp materializations हैं।
  Runtime allowlists SQLite materialization paths स्वीकार करती हैं, legacy
  state/config media roots नहीं। Doctor legacy media files को
  `media_blobs` में आयात करता है और सफल row writes के बाद source files हटाता है।
- Debug proxy capture sessions, events, और payload blobs। पूरा: captures shared state DB में रहते हैं
  और shared state DB bootstrap, schema,
  WAL, और busy-timeout settings के माध्यम से खुलते हैं। Payload bytes
  `capture_blobs.data` में gzip-compressed हैं; कोई debug proxy runtime sidecar DB override,
  blob directory, या proxy-capture-only generated schema/codegen target नहीं है।
  Doctor/startup migration shipped `debug-proxy/capture.sqlite` rows
  और referenced payload blobs आयात करता है, जिसमें active legacy DB/blob environment
  overrides शामिल हैं, फिर CA certificates को जस का तस छोड़ते हुए उन sources को archive करता है।

यह चरण उन subsystems से duplicate sidecar openers, permission helpers, WAL
setup, filesystem pruning, और compatibility writers भी हटाता है।

### चरण 2: Per-Agent Databases पेश करें

प्रत्येक एजेंट के लिए एक डेटाबेस बनाएं और उसे global DB से register करें:

```text
~/.openclaw/state/openclaw.sqlite
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

वैश्विक `agent_databases` row path, schema version, last-seen
timestamp, और basic size/integrity metadata संग्रहीत करती है। Runtime code सीधे file paths derive करने के बजाय
registry से agent DB मांगता है।

agent DB का मालिक है:

- `sessions` को कैननिकल सत्र रूट के रूप में, जिसमें `session_entries` उस रूट से जुड़ी
  संगतता-आकार वाली पेलोड तालिका है, और
  `session_routes` अद्वितीय सक्रिय `session_key` लुकअप है
- `conversations` और `session_conversations` को सत्रों से जुड़ी सामान्यीकृत प्रदाता
  रूटिंग पहचान के रूप में
- `transcript_events`
- ट्रांसक्रिप्ट स्नैपशॉट और Compaction चेकपॉइंट। रनटाइम लेखन के लिए पूरा।
- `vfs_entries`
- `tool_artifacts` और रन आर्टिफैक्ट
- एजेंट-स्थानीय रनटाइम/कैश पंक्तियां। वर्कर-स्कोप्ड कैश के लिए पूरा।
- ACP पैरेंट स्ट्रीम इवेंट
- ट्रैजेक्टरी रनटाइम इवेंट, जब वे स्पष्ट निर्यात आर्टिफैक्ट नहीं हैं

### चरण 3: सत्र स्टोर API बदलें

रनटाइम के लिए पूरा। फ़ाइल-आकार वाला सत्र स्टोर सरफेस सक्रिय
रनटाइम अनुबंध नहीं है:

- रनटाइम अब `loadSessionStore(storePath)` को कॉल नहीं करता या `storePath` को
  सत्र पहचान नहीं मानता।
- रनटाइम पंक्ति ऑपरेशन `getSessionEntry`, `upsertSessionEntry`,
  `patchSessionEntry`, `deleteSessionEntry`, और `listSessionEntries` हैं।
- पूरे-स्टोर री-राइट हेल्पर, फ़ाइल राइटर, क्यू परीक्षण, एलियस प्रूनिंग, और
  लेगेसी-कुंजी डिलीशन पैरामीटर रनटाइम से हट गए हैं।
- अप्रचलित रूट-पैकेज संगतता एक्सपोर्ट अभी भी कैननिकल
  `sessions.json` पथों को SQLite पंक्ति API पर अनुकूलित करते हैं।
- `sessions.json` पार्सिंग केवल doctor माइग्रेशन/इंपोर्ट कोड और
  doctor परीक्षणों में रहती है।
- रनटाइम लाइफसाइकल फॉलबैक SQLite ट्रांसक्रिप्ट हेडर पढ़ता है, JSONL की पहली
  पंक्तियां नहीं।

ऐसी कोई भी चीज़ हटाते रहें जो फ़ाइल-लॉक पैरामीटर,
फ़ाइल-रखरखाव शब्दावली के रूप में प्रूनिंग/ट्रंकेशन, स्टोर-पथ पहचान, या ऐसे परीक्षण
फिर से लाती हो जिनका केवल एक दावा JSON पर्सिस्टेंस है।

### चरण 4: ट्रांसक्रिप्ट, ACP स्ट्रीम, ट्रैजेक्टरी, और VFS स्थानांतरित करें

हर एजेंट डेटा स्ट्रीम को डेटाबेस-नेटिव बनाएं:

- ट्रांसक्रिप्ट एपेंड लेखन एक SQLite ट्रांजैक्शन से गुजरते हैं जो
  सत्र हेडर सुनिश्चित करता है, संदेश idempotency जांचता है, पैरेंट टेल चुनता है,
  `transcript_events` में इंसर्ट करता है, और
  `transcript_event_identities` में क्वेरी योग्य पहचान मेटाडेटा रिकॉर्ड करता है। सीधे ट्रांसक्रिप्ट संदेश एपेंड और
  सामान्य पर्सिस्टेड `TranscriptSessionManager` एपेंड के लिए पूरा; स्पष्ट ब्रांच
  ऑपरेशन अपनी स्पष्ट पैरेंट पसंद रखते हैं और फिर भी कोई फ़ाइल लोकेटर निकाले बिना
  SQLite पंक्तियां लिखते हैं।
- ACP पैरेंट स्ट्रीम लॉग पंक्तियां बनते हैं, `.acp-stream.jsonl` फ़ाइलें नहीं। पूरा।
- ACP स्पॉन सेटअप अब ट्रांसक्रिप्ट JSONL पथ पर्सिस्ट नहीं करता। पूरा।
- रनटाइम ट्रैजेक्टरी कैप्चर इवेंट पंक्तियां/आर्टिफैक्ट सीधे लिखता है। स्पष्ट
  सपोर्ट/एक्सपोर्ट कमांड अभी भी सपोर्ट-बंडल JSONL आर्टिफैक्ट को
  निर्यात फ़ॉर्मेट के रूप में बना सकता है, लेकिन सत्र निर्यात सत्र JSONL को दोबारा नहीं बनाता। पूरा।
- डिस्क वर्कस्पेस डिस्क मोड के रूप में कॉन्फ़िगर होने पर डिस्क पर रहते हैं।
- VFS स्क्रैच और प्रायोगिक VFS-केवल वर्कस्पेस मोड एजेंट DB का उपयोग करते हैं।

माइग्रेशन पुरानी JSONL फ़ाइलों को एक बार इंपोर्ट करता है, `migration_runs` में
गिनतियां/हैश रिकॉर्ड करता है, और अखंडता जांचों के बाद इंपोर्ट की गई फ़ाइलें हटाता है।

### चरण 5: बैकअप, रिस्टोर, वैक्यूम, और सत्यापन

बैकअप एक आर्काइव फ़ाइल ही रहते हैं:

- हर वैश्विक और एजेंट डेटाबेस का चेकपॉइंट करें।
- हर DB को SQLite बैकअप सेमांटिक्स या `VACUUM INTO` के साथ स्नैपशॉट करें।
- कॉम्पैक्ट DB स्नैपशॉट, कॉन्फ़िग, बाहरी क्रेडेंशियल, और अनुरोधित
  वर्कस्पेस एक्सपोर्ट आर्काइव करें।
- कच्ची लाइव `*.sqlite-wal` और `*.sqlite-shm` फ़ाइलें छोड़ दें।
- हर DB स्नैपशॉट खोलकर और `PRAGMA integrity_check` चलाकर सत्यापित करें।
  `openclaw backup create` यह आर्काइव सत्यापन डिफ़ॉल्ट रूप से करता है;
  `--no-verify` केवल पोस्ट-राइट आर्काइव पास छोड़ता है, स्नैपशॉट
  निर्माण अखंडता जांच नहीं।
- रिस्टोर स्नैपशॉट को उनके लक्ष्य पथों पर वापस कॉपी करता है। यह ब्रांच
  अप्रकाशित SQLite लेआउट को `user_version = 1` पर रीसेट करता है; भविष्य के प्रकाशित स्कीमा बदलाव
  जरूरत पड़ने पर स्पष्ट माइग्रेशन जोड़ सकते हैं।

### चरण 6: वर्कर रनटाइम

डेटाबेस विभाजन उतरते समय वर्कर मोड को प्रायोगिक रखें:

- वर्करों को एजेंट id, रन id, फ़ाइलसिस्टम मोड, और DB रजिस्ट्री पहचान मिलती है।
- हर वर्कर अपना SQLite कनेक्शन खोलता है।
- पैरेंट चैनल डिलीवरी, अनुमोदन, कॉन्फ़िग, और रद्द करने का अधिकार रखता है।
- हर सक्रिय रन के लिए एक वर्कर से शुरू करें; पूलिंग केवल तब जोड़ें जब लाइफसाइकल और DB
  कनेक्शन स्वामित्व स्थिर हों।

### चरण 7: पुरानी दुनिया हटाएं

रनटाइम सत्र प्रबंधन के लिए पूरा। पुरानी दुनिया केवल स्पष्ट
doctor इनपुट या सपोर्ट/एक्सपोर्ट आउटपुट के रूप में अनुमत है:

- कोई रनटाइम `sessions.json`, ट्रांसक्रिप्ट JSONL, सैंडबॉक्स रजिस्ट्री JSON, टास्क
  साइडकार SQLite, या plugin-state साइडकार SQLite लेखन नहीं।
- कोई JSON/सत्र फ़ाइल प्रूनिंग, फ़ाइल ट्रांसक्रिप्ट ट्रंकेशन, सत्र फ़ाइल लॉक,
  या लॉक-आकार वाले सत्र परीक्षण नहीं।
- कोई रनटाइम संगतता एक्सपोर्ट नहीं जिनका उद्देश्य पुरानी सत्र फ़ाइलों को
  अद्यतित रखना है।
- स्पष्ट सपोर्ट एक्सपोर्ट उपयोगकर्ता-अनुरोधित आर्काइव/मटीरियलाइजेशन
  फ़ॉर्मेट रहते हैं और फ़ाइल नामों को रनटाइम पहचान में वापस नहीं डालना चाहिए।

## बैकअप और रिस्टोर

बैकअप एक आर्काइव फ़ाइल होने चाहिए, लेकिन डेटाबेस कैप्चर
SQLite-नेटिव होना चाहिए:

1. लंबे समय तक चलने वाली लेखन गतिविधि रोकें या एक छोटी बैकअप बाधा में प्रवेश करें।
2. हर वैश्विक और एजेंट डेटाबेस के लिए, एक चेकपॉइंट चलाएं।
3. हर डेटाबेस को SQLite बैकअप सेमांटिक्स या `VACUUM INTO` का उपयोग करके
   एक अस्थायी बैकअप डायरेक्टरी में स्नैपशॉट करें।
4. कॉम्पैक्ट किए गए डेटाबेस स्नैपशॉट, कॉन्फ़िग फ़ाइल, क्रेडेंशियल डायरेक्टरी,
   चयनित वर्कस्पेस, और एक मैनिफेस्ट आर्काइव करें।
5. हर शामिल SQLite स्नैपशॉट खोलकर और
   `PRAGMA integrity_check` चलाकर आर्काइव सत्यापित करें।
   `openclaw backup create` यह डिफ़ॉल्ट रूप से करता है; `--no-verify` केवल
   पोस्ट-राइट आर्काइव पास को जानबूझकर छोड़ने के लिए है।

प्राथमिक बैकअप फ़ॉर्मेट के रूप में कच्ची लाइव `*.sqlite`, `*.sqlite-wal`, और `*.sqlite-shm` कॉपियों पर
निर्भर न रहें। आर्काइव मैनिफेस्ट में डेटाबेस भूमिका,
एजेंट id, स्कीमा संस्करण, स्रोत पथ, स्नैपशॉट पथ, बाइट आकार, और अखंडता
स्थिति रिकॉर्ड होनी चाहिए।

रिस्टोर को आर्काइव स्नैपशॉट से वैश्विक डेटाबेस और एजेंट डेटाबेस फ़ाइलें
फिर से बनानी चाहिए। क्योंकि SQLite लेआउट अभी प्रकाशित नहीं हुआ है, यह रिफ़ैक्टर
केवल version-1 स्कीमा और doctor फ़ाइल-से-डेटाबेस इंपोर्ट रखता है। रिस्टोर
कमांड पहले आर्काइव सत्यापित करता है, फिर सत्यापित निकाले गए पेलोड से
हर मैनिफेस्ट एसेट को बदलता है।

## रनटाइम रिफ़ैक्टर योजना

1. डेटाबेस रजिस्ट्री API जोड़ें।
   - वैश्विक DB और प्रति-एजेंट DB पथ रिज़ॉल्व करें।
   - अप्रकाशित स्कीमा को `user_version = 1` पर रखें; जब तक प्रकाशित स्कीमा को इसकी जरूरत न हो,
     स्कीमा माइग्रेशन रनर कोड न जोड़ें।
   - परीक्षण, बैकअप, और doctor द्वारा उपयोग किए जाने वाले close/checkpoint/integrity हेल्पर जोड़ें।

2. साइडकार SQLite स्टोर समेटें।
   - plugin state तालिकाओं को वैश्विक डेटाबेस में ले जाएं। रनटाइम
     लेखन के लिए पूरा; अप्रकाशित लेगेसी साइडकार इंपोर्टर हटा दिया गया है।
   - टास्क रजिस्ट्री तालिकाओं को वैश्विक डेटाबेस में ले जाएं। रनटाइम
     लेखन के लिए पूरा; अप्रकाशित लेगेसी साइडकार इंपोर्टर हटा दिया गया है।
   - Task Flow तालिकाओं को वैश्विक डेटाबेस में ले जाएं। रनटाइम लेखन के लिए पूरा;
     अप्रकाशित लेगेसी साइडकार इंपोर्टर हटा दिया गया है।
   - बिल्टिन memory-search तालिकाओं को हर एजेंट डेटाबेस में ले जाएं। पूरा; स्पष्ट
     कस्टम `memorySearch.store.path` अब doctor कॉन्फ़िग माइग्रेशन द्वारा हटाया जाता है।
     पूरा रीइंडेक्स केवल मेमोरी तालिकाओं के विरुद्ध उसी जगह चलता है; पुराना पूरे-फ़ाइल
     स्वैप पथ और साइडकार इंडेक्स स्वैप हेल्पर हटा दिए गए हैं।
   - उन सबसिस्टम से डुप्लिकेट डेटाबेस ओपनर, WAL सेटअप, अनुमति हेल्पर, और
     close पथ हटाएं।

3. एजेंट-स्वामित्व वाली तालिकाओं को प्रति-एजेंट डेटाबेस में ले जाएं।
   - वैश्विक डेटाबेस रजिस्ट्री के माध्यम से जरूरत पर एजेंट DB बनाएं। पूरा।
   - रनटाइम सत्र एंट्री, ट्रांसक्रिप्ट इवेंट, VFS पंक्तियां, और टूल
     आर्टिफैक्ट को एजेंट DB में ले जाएं। पूरा।
   - ब्रांच-स्थानीय shared-DB सत्र एंट्री, ट्रांसक्रिप्ट इवेंट,
     VFS पंक्तियां, या टूल आर्टिफैक्ट माइग्रेट न करें; वह लेआउट कभी प्रकाशित नहीं हुआ।
     doctor में केवल लेगेसी फ़ाइल-से-डेटाबेस इंपोर्ट रखें।

4. सत्र स्टोर API बदलें।
   - रनटाइम पहचान के रूप में `storePath` हटाएं। रनटाइम के लिए पूरा और
     `check:database-first-legacy-stores` द्वारा सुरक्षित: सत्र मेटाडेटा, रूट अपडेट,
     कमांड पर्सिस्टेंस, CLI सत्र क्लीनअप, Feishu reasoning previews,
     transcript-state पर्सिस्टेंस, subagent depth, auth profile session
     overrides, parent-fork logic, और QA-lab inspection अब कैननिकल एजेंट/सत्र कुंजियों से
     डेटाबेस रिज़ॉल्व करते हैं।
     Gateway/TUI/UI/macOS सत्र-सूची प्रतिक्रियाएं अब लेगेसी `path` के बजाय `databasePath`
     दिखाती हैं; macOS debug surfaces `session.store` कॉन्फ़िग लिखने के बजाय
     प्रति-एजेंट डेटाबेस को read-only state के रूप में दिखाते हैं।
     `/status`, chat-driven trajectory export, और CLI dependency proxies अब
     लेगेसी स्टोर पथ प्रचारित नहीं करते; transcript usage fallback एजेंट/सत्र पहचान द्वारा
     SQLite पढ़ता है। रनटाइम और bridge tests अब `storePath` उजागर नहीं करते;
     doctor/migration inputs उस लेगेसी फ़ील्ड नाम के स्वामी हैं।
     Gateway combined-session loading में अब non-templated `session.store` मानों के लिए
     विशेष रनटाइम ब्रांच नहीं है; यह प्रति-एजेंट SQLite पंक्तियां एग्रीगेट करता है।
     लेगेसी session-lock doctor lane और उसका `.jsonl.lock` cleanup helper
     हटा दिया गया; SQLite अब सत्र concurrency boundary है।
     हॉट रनटाइम कॉल साइटें `resolveSessionRowEntry` जैसे row-oriented helper names का उपयोग करती हैं;
     पुराना `resolveSessionStoreEntry` संगतता alias रनटाइम और plugin SDK exports से
     हटा दिया गया है।

- `{ agentId, sessionKey }` पंक्ति ऑपरेशन का उपयोग करें।
  पूरा: `getSessionEntry`, `upsertSessionEntry`, `deleteSessionEntry`,
  `patchSessionEntry`, और `listSessionEntries` SQLite-first API हैं जिन्हें
  सत्र स्टोर पथ की जरूरत नहीं होती। Status summary, local agent status, health,
  और `openclaw sessions` listing command अब प्रति-एजेंट पंक्तियां सीधे पढ़ते हैं
  और `sessions.json` पथों के बजाय प्रति-एजेंट SQLite डेटाबेस पथ दिखाते हैं।
- पूरे-स्टोर delete/insert को `upsertSessionEntry`,
  `deleteSessionEntry`, `listSessionEntries`, और SQL cleanup queries से बदलें।
  रनटाइम के लिए पूरा: हॉट पथ अब row APIs और conflict-retried row patches का उपयोग करते हैं;
  बाकी पूरे-स्टोर import/replace helpers migration import
  code और SQLite backend tests तक सीमित हैं।
  - `store-writer.ts` और writer-queue tests हटाएं। पूरा।
  - सत्र पंक्ति upserts/patches से रनटाइम legacy-key pruning और alias-delete parameters हटाएं। पूरा।

5. रनटाइम JSON रजिस्ट्री व्यवहार हटाएं।
   - sandbox registry reads और writes को SQLite-only बनाएं। पूरा।
   - monolithic और sharded JSON को केवल migration step से इंपोर्ट करें। पूरा।
   - sharded registry locks और JSON writes हटाएं। पूरा।

- अगर shape hot-path operational state रहती है, तो registry rows को generic
  opaque JSON के रूप में स्टोर करने के बजाय एक typed registry table रखें। पूरा।

6. फ़ाइल-लॉक-आकार वाला सत्र mutation हटाएं।
   - रनटाइम lock creation और runtime lock APIs के लिए पूरा।
   - standalone legacy `.jsonl.lock` doctor cleanup lane हटाई गई है।
   - `session.writeLock` doctor-migrated legacy config है, typed runtime
     setting नहीं।
   - state integrity में अब अलग orphan transcript-file pruning
     path नहीं है; doctor migration legacy JSONL sources को एक जगह import/remove करता है।
   - Gateway singleton coordination `gateway_locks` के अंतर्गत typed SQLite `state_leases` rows का उपयोग करता है
     और अब file-lock directory seam उजागर नहीं करता।
   - Generic plugin SDK dedupe persistence अब file locks या JSON
     files का उपयोग नहीं करता; यह shared SQLite plugin-state rows लिखता है। पूरा।
   - QMD embed coordination `qmd/embed.lock` के बजाय SQLite state lease का उपयोग करता है। पूरा।

7. वर्करों को डेटाबेस-अवेयर बनाएं।
   - वर्कर अपने SQLite कनेक्शन खोलते हैं।
   - पैरेंट delivery, channel callbacks, और config का स्वामी है।
   - वर्कर को agent id, run id, filesystem mode, और DB registry
     identity मिलती है, live handles नहीं।
   - `vfs-only` प्रायोगिक रहता है और agent database को अपने storage
     root के रूप में उपयोग करता है।
   - पहले हर सक्रिय रन के लिए एक वर्कर रखें। Pooling तब तक इंतज़ार कर सकती है जब तक DB connection
     lifetime और cancellation behavior सामान्य न हों।

8. बैकअप एकीकरण।
   - SQLite बैकअप या `VACUUM INTO` के माध्यम से वैश्विक और एजेंट डेटाबेस का
     स्नैपशॉट लेने के लिए बैकअप को सिखाएँ। state asset के अंतर्गत खोजी गई
     `*.sqlite` फ़ाइलों के लिए पूरा हुआ।
   - SQLite अखंडता और स्कीमा संस्करण के लिए बैकअप सत्यापन जोड़ें। बैकअप
     निर्माण और डिफ़ॉल्ट आर्काइव सत्यापन अखंडता जाँचों के लिए पूरा हुआ।
   - बैकअप रन मेटाडेटा SQLite में रिकॉर्ड करें। साझा `backup_runs`
     तालिका के माध्यम से पूरा हुआ, जिसमें आर्काइव पाथ, स्थिति, और manifest JSON है।
   - सत्यापित आर्काइव स्नैपशॉट से पुनर्स्थापना जोड़ें। पूरा हुआ: `openclaw backup
restore` निष्कर्षण से पहले सत्यापित करता है, verifier के सामान्यीकृत
     manifest का उपयोग करता है, `--dry-run` का समर्थन करता है, और रिकॉर्ड किए गए
     स्रोत पाथ बदलने से पहले `--yes` की आवश्यकता रखता है।
   - VFS/वर्कस्पेस निर्यात केवल अनुरोध किए जाने पर शामिल करें; session
     internals को JSON या JSONL के रूप में निर्यात न करें।

9. अप्रचलित परीक्षण और कोड हटाएँ। ज्ञात रनटाइम session सतहों के लिए पूरा हुआ।

- उन परीक्षणों को हटाएँ जो `sessions.json` या transcript
  JSONL फ़ाइलों के रनटाइम निर्माण का दावा करते हैं। core session store, chat,
  gateway transcript events, preview, lifecycle, command session-entry updates,
  auto-reply reset/trace, और memory-core dreaming fixtures, approval target
  routing, session transcript repair, security permission repair, trajectory
  export, और session export के लिए पूरा हुआ।
  Active-memory transcript परीक्षण अब SQLite scopes और temporary या
  persisted JSONL फ़ाइल निर्माण न होने का दावा करते हैं।
  पुराना heartbeat transcript-pruning regression हटा दिया गया क्योंकि
  रनटाइम अब JSONL transcripts को truncate नहीं करता।
  Agent session-list tool परीक्षण अब legacy `sessions.json` paths को
  gateway response shape के रूप में model नहीं करते; app/UI/macOS परीक्षण
  `databasePath` का उपयोग करते हैं।
  `/status` transcript-usage परीक्षण अब JSONL फ़ाइलें लिखने के बजाय SQLite
  transcript rows को सीधे seed करते हैं।
  Gateway session lifecycle परीक्षण अब SQLite transcript seeding helpers का
  सीधे उपयोग करते हैं; पुराना single-line session-file fixture shape reset
  और delete coverage से हट गया है।
  `sessions.delete` अब file-era `archived: []` field वापस नहीं करता; deletion
  केवल row mutation result रिपोर्ट करता है। पुराना `deleteTranscript` option भी
  हट गया है: session delete करने से canonical `sessions` root हटता है और
  SQLite को session-owned transcript, snapshot, और trajectory rows cascade करने
  देता है, इसलिए कोई caller transcript orphans पीछे नहीं छोड़ सकता या cleanup
  branch भूल नहीं सकता।
  Context-engine trajectory capture परीक्षण अब `session.trajectory.jsonl`
  पढ़ने के बजाय एक isolated agent database से `trajectory_runtime_events`
  rows पढ़ते हैं।
  Docker MCP channel seed scripts अब SQLite rows को सीधे seed करते हैं। सीधे
  `sessions.json` writes doctor fixtures तक सीमित हैं।
  Tool Search Gateway E2E `agents/<agentId>/sessions/*.jsonl` फ़ाइलें scan
  करने के बजाय SQLite transcript rows से tool-call evidence पढ़ता है।
  Memory-core host events और session-corpus scratch rows अब shared
  SQLite plugin-state में रहते हैं; `events.jsonl` और `session-corpus/*.txt`
  केवल legacy doctor migration inputs हैं। सक्रिय rows
  `memory/session-ingestion/` virtual paths का उपयोग करते हैं, `.dreams/session-corpus`
  का नहीं। पुराना memory-core dreaming repair module और उसके CLI/Gateway
  परीक्षण हटा दिए गए क्योंकि रनटाइम अब उस corpus के लिए file archive repair
  का मालिक नहीं है। Memory-core bridge/public-artifact परीक्षण अब
  `.dreams/events.jsonl` surface नहीं करते; वे SQLite-backed virtual JSON
  artifact name का उपयोग करते हैं।
  Public SDK/Codex testing docs अब session files के बजाय SQLite session state
  कहते हैं, और channel-turn example अब `storePath` argument expose नहीं करता।
  Matrix sync state अब SQLite plugin-state store का सीधे उपयोग करता है। सक्रिय
  client/runtime contracts एक account storage root pass करते हैं, `bot-storage.json`
  path नहीं, और doctor source delete करने से पहले legacy `bot-storage.json` को
  SQLite में import करता है। QA Matrix restart/destructive scenarios अब fake
  `bot-storage.json` files बनाने या delete करने के बजाय SQLite sync row को
  सीधे mutate करते हैं, और E2EE substrate fake `sync-store.json` path के बजाय
  sync-store root pass करता है।
  Matrix storage-root selection अब legacy sync/thread JSON files के आधार पर
  roots score नहीं करता; यह durable root metadata और real crypto state का उपयोग
  करता है।
  runtime SQLite session backend test suite अब `sessions.json` fabricate नहीं
  करता; legacy source fixtures अब उन्हें import करने वाले doctor tests में
  रहते हैं।
  Gateway session tests अब `createSessionStoreDir` helper या unused temp
  session-store path setup expose नहीं करते; fixture dirs explicit हैं, और
  direct row setup SQLite session-row naming का उपयोग करता है।
  Doctor-only JSON5 session-store parser coverage infra tests से हटकर doctor
  migration tests में चला गया, इसलिए runtime test suites अब legacy session-file
  parsing की मालिक नहीं हैं।
  Microsoft Teams runtime SSO/pending-upload tests अब JSON sidecar fixtures या
  parsers नहीं रखते; legacy SSO token parsing केवल plugin migration module में
  रहती है। Telegram tests अब fake `/tmp/*.json` store paths seed नहीं करते;
  वे SQLite-backed message cache को सीधे reset करते हैं। generic
  OpenClaw test-state helper अब legacy `auth-profiles.json` writer expose नहीं
  करता; doctor auth migration tests उस fixture को locally own करते हैं।
  TUI last-session pointers, exec approvals, active-memory toggles, Matrix
  dedupe/startup verification, Memory Wiki source sync, current-conversation
  bindings, onboarding auth, और Hermes secret imports के runtime tests अब old
  sidecar files manufacture नहीं करते या old filenames absent होने का दावा नहीं
  करते। वे SQLite rows और public store APIs के माध्यम से behavior prove करते
  हैं; doctor/migration tests ही वह जगह हैं जहाँ legacy source filenames belong
  करते हैं।
  device/node pairing, channel allowFrom, restart intents, restart handoff,
  session delivery queue entries, config health, iMessage caches, cron jobs,
  PI transcript headers, subagent registries, और managed image attachments के
  runtime tests भी अब retired JSON/JSONL files केवल यह prove करने के लिए create
  नहीं करते कि उन्हें ignore किया गया है या वे absent हैं।
  PI overflow recovery में अब SessionManager rewrite/truncation fallback नहीं
  है: tool-result truncation और context-engine transcript rewrites SQLite
  transcript rows mutate करते हैं, फिर database से active prompt state refresh
  करते हैं। Persisted SessionManager message appends parent selection और
  idempotency के लिए atomic SQLite transcript append helper को delegate करते
  हैं। सामान्य metadata/custom entry appends भी SQLite के भीतर current parent
  select करते हैं, इसलिए stale manager instances pre-SQLite parent-chain races
  को resurrect नहीं करते।
  mid-turn prechecks और `sessions_yield` के लिए synthetic PI tail cleanup अब
  SQLite transcript state को सीधे trim करता है; पुराना SessionManager
  tail-removal bridge और उसके tests delete कर दिए गए हैं।
  Compaction checkpoint capture भी केवल SQLite से snapshot करता है; callers अब
  alternate transcript source के रूप में live SessionManager pass नहीं करते।
- legacy files seed करने वाले tests केवल migration के लिए रखें।
- सक्रिय runtime सतहों के लिए JSON-file proof को SQL row proof से बदल दिया गया है।

- legacy session/cache JSON paths पर runtime writes के लिए static bans जोड़ें।
  repo guard के लिए पूरा हुआ।

10. migration report को auditable बनाएँ।
    - migration runs को SQLite में started/finished timestamps, source
      paths, source hashes, counts, warnings, और backup path के साथ record करें।
      पूरा हुआ: legacy-state migration executions अब source path/table
      inventory, source file SHA-256, sizes, record counts, warnings, और backup
      path के साथ `migration_runs` report persist करते हैं।
      पूरा हुआ: legacy-state migration executions source-level audit और future
      skip/backfill decisions के लिए `migration_sources` rows भी persist करते हैं।
    - apply को idempotent बनाएँ। partial import के बाद फिर चलाने पर या तो
      already imported source skip होना चाहिए या stable key से merge होना चाहिए।
      पूरा हुआ: session indexes, transcripts, delivery queues, plugin state,
      task ledgers, और agent-owned global SQLite rows stable keys या
      upsert/replace semantics के माध्यम से import होते हैं, इसलिए reruns durable
      rows duplicate किए बिना merge करते हैं।
    - Failed imports को original source file जगह पर रखनी चाहिए।
      पूरा हुआ: failed transcript imports अब original JSONL source को उसके
      detected path पर छोड़ते हैं, और `migration_sources` source को
      `warning` के रूप में `removed_source=0` के साथ record करता है, ताकि next
      doctor run में उपयोग हो सके।

## Performance Rules

- प्रति thread/process एक connection ठीक है; handles को workers के बीच share
  न करें।
- WAL, `foreign_keys=ON`, 30s busy timeout, और छोटे `BEGIN IMMEDIATE`
  write transactions का उपयोग करें।
- write transaction helpers को synchronous रखें, जब तक/जब तक कोई async transaction
  API explicit mutex/backpressure semantics नहीं जोड़ता।
- parent delivery writes छोटे और transactional रखें।
- whole-store rewrites से बचें; row-level upsert/delete का उपयोग करें।
- hot code move करने से पहले list-by-agent, list-by-session, updated-at, run id,
  और expiration paths के लिए indexes जोड़ें।
- बड़े artifacts, media, और vectors को base64 या numeric-array JSON नहीं, बल्कि
  BLOBs या chunked BLOB rows के रूप में store करें।
- opaque plugin-state entries को छोटा और scoped रखें।
- filesystem pruning के बजाय TTL/expiration के लिए SQL cleanup जोड़ें।
  database-owned runtime stores के लिए पूरा हुआ: media, plugin state, plugin blobs,
  persistent dedupe, और agent cache सभी SQLite rows के माध्यम से expire होते हैं।
  बाकी filesystem cleanup temporary materializations या explicit removal commands
  तक सीमित है।

## Static Bans

एक repo check जोड़ें जो legacy state paths पर नए runtime writes को fail करे:

- `sessions.json`
- `*.trajectory.jsonl` मूर्त रूप दिए गए support-bundle आउटपुट को छोड़कर
- `.acp-stream.jsonl`
- `acp/event-ledger.json`
- `cache/*.json` runtime cache फ़ाइलें
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
- ad-hoc `openclaw-state.sqlite` runtime sidecars
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
- Browser profile decoration `.openclaw-profile-decorated`
- `SessionManager.open(...)` फ़ाइल-समर्थित session खोलने वाले
- `SessionManager.listAll(...)` और `TranscriptSessionManager.listAll(...)`
  transcript सूचीकरण facade
- `SessionManager.forkFromSession(...)` और
  `TranscriptSessionManager.forkFromSession(...)` transcript fork facade
- `SessionManager.newSession(...)` और `TranscriptSessionManager.newSession(...)`
  mutable session replacement facade
- `SessionManager.createBranchedSession(...)` और
  `TranscriptSessionManager.createBranchedSession(...)` branch-session facade

प्रतिबंध tests को legacy fixtures बनाने की अनुमति दे और migration code को
legacy file sources पढ़ने/import/remove करने की अनुमति दे। Unshipped SQLite sidecars प्रतिबंधित ही रहें
और उन्हें doctor import allowances न मिलें।

## पूर्णता मानदंड

- Runtime data और cache writes global या agent SQLite database में जाते हैं।
- Runtime अब session indexes, transcript JSONL, sandbox registry
  JSON, task sidecar SQLite, या plugin-state sidecar SQLite नहीं लिखता। Unshipped task
  और plugin-state sidecar SQLite importers हटाए जाते हैं।
- Legacy file import केवल doctor-only है।
- Backup compact SQLite snapshots और integrity proof के साथ एक archive बनाता है।
- Agent workers disk, VFS scratch, या experimental VFS-only
  storage के साथ चल सकते हैं।
- Config और explicit credential files ही केवल अपेक्षित persistent
  non-database control files रहती हैं।
- Repo checks legacy runtime file stores को दोबारा लाने से रोकते हैं।
