---
read_when:
    - आपको सत्र IDs, ट्रांसक्रिप्ट JSONL, या sessions.json फ़ील्ड को डीबग करना है
    - आप स्वचालित Compaction व्यवहार बदल रहे हैं या "पूर्व-Compaction" रखरखाव जोड़ रहे हैं
    - आप मेमोरी फ्लश या मौन सिस्टम टर्न लागू करना चाहते हैं
summary: 'गहन अध्ययन: सत्र स्टोर + ट्रांसक्रिप्ट, लाइफ़साइकिल, और (ऑटो)Compaction के आंतरिक विवरण'
title: सत्र प्रबंधन का गहन अध्ययन
x-i18n:
    generated_at: "2026-07-04T20:34:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw इन क्षेत्रों में sessions को शुरू से अंत तक प्रबंधित करता है:

- **Session routing** (आने वाले संदेश `sessionKey` से कैसे मैप होते हैं)
- **Session store** (`sessions.json`) और यह क्या ट्रैक करता है
- **Transcript persistence** (`*.jsonl`) और इसकी संरचना
- **Transcript hygiene** (रन से पहले provider-specific fixups)
- **Context limits** (context window बनाम ट्रैक किए गए tokens)
- **Compaction** (manual और auto-compaction) और pre-compaction काम कहां hook करना है
- **Silent housekeeping** (memory writes जिनसे user-visible output नहीं बनना चाहिए)

अगर आप पहले उच्च-स्तरीय overview चाहते हैं, तो यहां से शुरू करें:

- [Session management](/hi/concepts/session)
- [Compaction](/hi/concepts/compaction)
- [Memory overview](/hi/concepts/memory)
- [Memory search](/hi/concepts/memory-search)
- [Session pruning](/hi/concepts/session-pruning)
- [Transcript hygiene](/hi/reference/transcript-hygiene)

---

## सत्य का स्रोत: Gateway

OpenClaw एकल **Gateway process** के इर्द-गिर्द डिज़ाइन किया गया है, जो session state का स्वामी होता है।

- UIs (macOS app, web Control UI, TUI) को session lists और token counts के लिए Gateway से query करना चाहिए।
- remote mode में, session files remote host पर होती हैं; "अपनी local Mac files जांचना" यह नहीं दिखाएगा कि Gateway क्या उपयोग कर रहा है।

---

## दो persistence layers

OpenClaw sessions को दो layers में persist करता है:

1. **Session store (`sessions.json`)**
   - Key/value map: `sessionKey -> SessionEntry`
   - छोटा, mutable, edit करने के लिए सुरक्षित (या entries delete करने के लिए)
   - session metadata ट्रैक करता है (current session id, last activity, toggles, token counters, आदि)

2. **Transcript (`<sessionId>.jsonl`)**
   - tree structure वाला append-only transcript (entries में `id` + `parentId` होते हैं)
   - वास्तविक conversation + tool calls + compaction summaries store करता है
   - भविष्य के turns के लिए model context rebuild करने में उपयोग होता है
   - Compaction checkpoints, compacted successor
     transcript के ऊपर metadata होते हैं। नई compactions दूसरी `.checkpoint.*.jsonl`
     copy नहीं लिखतीं।

Gateway history readers को पूरा transcript materialize करने से बचना चाहिए जब तक
surface को स्पष्ट रूप से arbitrary historical access की जरूरत न हो। First-page history,
embedded chat history, restart recovery, और token/usage checks bounded tail
reads का उपयोग करते हैं। Full transcript scans async transcript index से गुजरते हैं, जो
file path और `mtimeMs`/`size` से cached होता है और concurrent readers के बीच shared होता है।

---

## On-disk locations

प्रति agent, Gateway host पर:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram topic sessions: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw इन्हें `src/config/sessions.ts` के जरिए resolve करता है।

---

## Store maintenance और disk controls

Session persistence में `sessions.json`, transcript artifacts, और trajectory sidecars के लिए automatic maintenance controls (`session.maintenance`) हैं:

- `mode`: `enforce` (default) या `warn`
- `pruneAfter`: stale-entry age cutoff (default `30d`)
- `maxEntries`: `sessions.json` में cap entries (default `500`)
- Short-lived gateway model-run probe retention `24h` पर fixed है, लेकिन यह pressure-gated है: यह stale strict probe rows को तभी हटाता है जब session-entry maintenance/cap pressure पहुंचा हो। यह केवल `agent:*:explicit:model-run-<uuid>` से match करने वाली strict explicit probe keys पर लागू होता है और जब यह चलता है तो global stale-entry cleanup/capping से पहले चलता है।
- `resetArchiveRetention`: `*.reset.<timestamp>` transcript archives के लिए retention (default: `pruneAfter` के समान; `false` cleanup disable करता है)
- `maxDiskBytes`: optional sessions-directory budget
- `highWaterBytes`: cleanup के बाद optional target (default `maxDiskBytes` का `80%`)

Normal Gateway writes एक per-store session writer से गुजरती हैं जो runtime file lock लिए बिना in-process mutations को serialize करता है। Hot-path patch helpers उस writer slot को hold करते समय validated mutable cache borrow करते हैं, इसलिए बड़ी `sessions.json` files हर metadata update के लिए clone या reread नहीं होतीं। Runtime code को `updateSessionStore(...)` या `updateSessionStoreEntry(...)` prefer करना चाहिए; direct whole-store saves compatibility और offline-maintenance tools हैं। जब Gateway reachable हो, non-dry-run `openclaw sessions cleanup` और `openclaw agents delete` store mutations को Gateway को delegate करते हैं ताकि cleanup उसी writer queue में शामिल हो; `--store <path>` direct file maintenance के लिए explicit offline repair path है। `maxEntries` cleanup अभी भी production-sized caps के लिए batched है, इसलिए store configured cap को brief रूप से exceed कर सकता है, इससे पहले कि अगला high-water cleanup इसे वापस नीचे rewrite करे। Session store reads Gateway startup के दौरान entries को prune या cap नहीं करते; cleanup के लिए writes या `openclaw sessions cleanup --enforce` का उपयोग करें। `openclaw sessions cleanup --enforce` अभी भी configured cap को तुरंत apply करता है और कोई disk budget configured न होने पर भी पुराने unreferenced transcript, checkpoint, और trajectory artifacts को prune करता है।

Maintenance durable external conversation pointers जैसे group sessions
और thread-scoped chat sessions को बनाए रखता है, लेकिन cron, hooks,
Heartbeat, ACP, और sub-agents के synthetic runtime entries तब भी हटाए जा सकते हैं
जब वे configured age, count, या disk budget से अधिक हो जाएं। Gateway model-run probe sessions
अलग `24h` model-run retention का उपयोग केवल तब करते हैं जब उनकी key बिल्कुल
`agent:*:explicit:model-run-<uuid>` से match करती है; अन्य explicit sessions उस
retention का हिस्सा नहीं हैं। model-run cleanup केवल session-entry cap
pressure के तहत apply होता है। Isolated cron runs अपना अलग `cron.sessionRetention` control रखते हैं,
जो model-run probe retention से independent है।

OpenClaw अब Gateway writes के दौरान automatic `sessions.json.bak.*` rotation backups नहीं बनाता। legacy `session.maintenance.rotateBytes` key ignore की जाती है और `openclaw doctor --fix` इसे पुराने configs से हटा देता है।

Transcript mutations transcript file पर session write lock का उपयोग करते हैं। Lock acquisition busy-session error surface करने से पहले
`session.writeLock.acquireTimeoutMs` तक wait करता है; default `60000`
ms है। इसे केवल तब बढ़ाएं जब legitimate prep, cleanup, compaction, या transcript mirror work slow machines पर
लंबे समय तक contend करता हो। `session.writeLock.staleMs` control करता है कि existing lock को कब
stale मानकर reclaim किया जा सकता है; default `1800000` ms है। `session.writeLock.maxHoldMs`
in-process watchdog release threshold control करता है; default `300000` ms है। Emergency env overrides
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`, और
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS` हैं।

Disk budget cleanup (`mode: "enforce"`) के लिए enforcement order:

1. सबसे पहले सबसे पुराने archived, orphan transcript, या orphan trajectory artifacts हटाएं।
2. अगर अभी भी target से ऊपर है, तो सबसे पुरानी session entries और उनकी transcript/trajectory files evict करें।
3. तब तक जारी रखें जब तक usage `highWaterBytes` पर या उससे नीचे न हो।

`mode: "warn"` में, OpenClaw potential evictions report करता है लेकिन store/files mutate नहीं करता।

Demand पर maintenance चलाएं:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron sessions और run logs

Isolated cron runs भी session entries/transcripts बनाते हैं, और उनके पास dedicated retention controls हैं:

- `cron.sessionRetention` (default `24h`) पुराने isolated cron run sessions को session store से prune करता है (`false` disable करता है)।
- `cron.runLog.keepLines` प्रति cron job retained SQLite run-history rows prune करता है (default: `2000`)। `cron.runLog.maxBytes` पुराने file-backed run logs के लिए accepted रहता है।

जब cron किसी नए isolated run session को force-create करता है, तो यह नई row लिखने से पहले पिछले
`cron:<jobId>` session entry को sanitize करता है। यह thinking/fast/verbose settings, labels, और explicit
user-selected model/auth overrides जैसी सुरक्षित
preferences carry करता है। यह channel/group routing, send या queue policy, elevation, origin, और ACP
runtime binding जैसे ambient conversation context drop करता है ताकि कोई fresh isolated run किसी पुराने run से stale delivery या
runtime authority inherit न कर सके।

---

## Session keys (`sessionKey`)

`sessionKey` यह पहचानता है कि आप _किस conversation bucket_ में हैं (routing + isolation)।

Common patterns:

- Main/direct chat (प्रति agent): `agent:<agentId>:<mainKey>` (default `main`)
- Group: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` या `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (जब तक overridden न हो)

Canonical rules [/concepts/session](/hi/concepts/session) पर documented हैं।

---

## Session ids (`sessionId`)

हर `sessionKey` एक current `sessionId` की ओर point करता है (वह transcript file जो conversation जारी रखती है)।

Rules of thumb:

- **Reset** (`/new`, `/reset`) उस `sessionKey` के लिए नया `sessionId` बनाता है।
- **Daily reset** (gateway host पर default 4:00 AM local time) reset boundary के बाद अगले message पर नया `sessionId` बनाता है।
- **Idle expiry** (`session.reset.idleMinutes` या legacy `session.idleMinutes`) idle window के बाद message आने पर नया `sessionId` बनाता है। जब daily + idle दोनों configured हों, तो जो पहले expire हो वही लागू होता है।
- **Control UI reconnect resume** currently visible session को एक reconnect send के लिए preserve कर सकता है जब Gateway को operator UI client से matching `sessionId` मिलता है। Ordinary stale sends फिर भी नया `sessionId` बनाते हैं।
- **System events** (heartbeat, cron wakeups, exec notifications, gateway bookkeeping) session row mutate कर सकते हैं लेकिन daily/idle reset freshness extend नहीं करते। Reset rollover fresh prompt build होने से पहले previous session के queued system-event notices discard करता है।
- **Parent fork policy** thread या subagent fork बनाते समय OpenClaw की active branch का उपयोग करती है। अगर वह branch बहुत बड़ी है, तो OpenClaw fail होने या unusable history inherit करने के बजाय child को isolated context के साथ शुरू करता है। Sizing policy automatic है; legacy `session.parentForkMaxTokens` config `openclaw doctor --fix` द्वारा removed है।

Implementation detail: decision `src/auto-reply/reply/session.ts` में `initSessionState()` में होता है।

---

## Session store schema (`sessions.json`)

Store का value type `src/config/sessions.ts` में `SessionEntry` है।

Key fields (exhaustive नहीं):

- `sessionId`: वर्तमान transcript id (filename इससे निकाला जाता है, जब तक `sessionFile` सेट न हो)
- `sessionStartedAt`: वर्तमान `sessionId` के लिए start timestamp; daily reset
  freshness इसका उपयोग करती है। Legacy rows इसे JSONL session header से निकाल सकती हैं।
- `lastInteractionAt`: अंतिम वास्तविक user/channel interaction timestamp; idle reset
  freshness इसका उपयोग करती है ताकि Heartbeat, Cron, और exec events sessions को
  alive न रखें। इस field के बिना legacy rows idle freshness के लिए recovered session start
  time पर fall back करती हैं।
- `updatedAt`: अंतिम store-row mutation timestamp, listing, pruning, और
  bookkeeping के लिए उपयोग किया जाता है। यह daily/idle reset freshness का authority नहीं है।
- `archivedAt`: वैकल्पिक archive timestamp। Archived sessions store में अपने transcript के साथ
  intact रहती हैं और सामान्य active listings से बाहर रहती हैं।
- `pinnedAt`: वैकल्पिक pin timestamp। Active pinned sessions
  unpinned sessions से पहले sort होती हैं; session को archive करने पर उसका pin clear हो जाता है।
- Codex thread interop: दोनों fields Codex thread-management shape का पालन करते हैं —
  wire पर `archived`/`pinned` booleans हमेशा timestamp से derived होते हैं
  और server-side stamped होते हैं, Codex `threads.archived_at`
  semantics और camelCase serialization से match करते हुए। OpenClaw timestamps epoch
  milliseconds हैं जबकि Codex epoch seconds उपयोग करता है, इसलिए bridges codex
  Plugin seam पर convert करते हैं। Codex के पास अभी कोई pin API नहीं है (`thread/archive`/`thread/unarchive`
  only); pinned state OpenClaw-side रहती है जब तक कोई मौजूद न हो, और तब
  matching shape bound sessions को pin state mechanically round-trip करने देती है।
- `sessionFile`: वैकल्पिक explicit transcript path override
- `chatType`: `direct | group | room` (UIs और send policy में मदद करता है)
- `provider`, `subject`, `room`, `space`, `displayName`: group/channel labeling के लिए metadata
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (per-session override)
- Model selection:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token counters (best-effort / provider-dependent):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: इस session key के लिए auto-Compaction कितनी बार पूरी हुई
- `memoryFlushAt`: अंतिम pre-Compaction memory flush का timestamp
- `memoryFlushCompactionCount`: अंतिम flush चलने के समय Compaction count

Store edit करने के लिए safe है, लेकिन Gateway authority है: sessions चलने पर यह entries को rewrite या rehydrate कर सकता है।

---

## Transcript संरचना (`*.jsonl`)

Transcripts `openclaw/plugin-sdk/agent-sessions` के `SessionManager` द्वारा managed होते हैं।

File JSONL है:

- पहली line: session header (`type: "session"`, इसमें `id`, `cwd`, `timestamp`, वैकल्पिक `parentSession` शामिल हैं)
- फिर: `id` + `parentId` (tree) वाली session entries

ध्यान देने योग्य entry types:

- `message`: user/assistant/toolResult messages
- `custom_message`: extension-injected messages जो model context में _जाती_ हैं (UI से hidden हो सकती हैं)
- `custom`: extension state जो model context में _नहीं_ जाती
- `compaction`: `firstKeptEntryId` और `tokensBefore` के साथ persisted Compaction summary
- `branch_summary`: tree branch navigate करते समय persisted summary

OpenClaw जानबूझकर transcripts को "fix up" नहीं करता; Gateway उन्हें read/write करने के लिए `SessionManager` का उपयोग करता है।

---

## Context windows बनाम tracked tokens

दो अलग concepts महत्वपूर्ण हैं:

1. **Model context window**: प्रति model hard cap (model को visible tokens)
2. **Session store counters**: `sessions.json` में लिखे rolling stats (/status और dashboards के लिए उपयोग)

अगर आप limits tune कर रहे हैं:

- Context window model catalog से आता है (और config के जरिए overridden हो सकता है)।
- Store में `contextTokens` runtime estimate/reporting value है; इसे strict guarantee न मानें।

अधिक के लिए, [/token-use](/hi/reference/token-use) देखें।

---

## Compaction: यह क्या है

Compaction पुरानी conversation को transcript में persisted `compaction` entry में summarize करता है और recent messages intact रखता है।

Compaction के बाद, future turns देखते हैं:

- Compaction summary
- `firstKeptEntryId` के बाद के messages

Compaction के बाद AGENTS.md section reinjection opt-in है
`agents.defaults.compaction.postCompactionSections` के जरिए; जब unset या `[]` हो,
OpenClaw Compaction summary के ऊपर AGENTS.md excerpts append नहीं करता।

Compaction **persistent** है (session pruning के विपरीत)। [/concepts/session-pruning](/hi/concepts/session-pruning) देखें।

## Compaction chunk boundaries और tool pairing

जब OpenClaw लंबे transcript को Compaction chunks में split करता है, तो यह
assistant tool calls को उनकी matching `toolResult` entries के साथ paired रखता है।

- अगर token-share split किसी tool call और उसके result के बीच land करता है, तो OpenClaw
  pair को separate करने के बजाय boundary को assistant tool-call message पर shift करता है।
- अगर trailing tool-result block अन्यथा chunk को target से ऊपर push कर देता,
  तो OpenClaw उस pending tool block को preserve करता है और unsummarized tail
  intact रखता है।
- Aborted/error tool-call blocks pending split को open नहीं रखते।

---

## Auto-Compaction कब होता है (OpenClaw runtime)

Embedded OpenClaw agent में, auto-Compaction दो cases में trigger होता है:

1. **Overflow recovery**: model context overflow error लौटाता है
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, और समान provider-shaped variants) → compact → retry.
   जब provider attempted token count report करता है, OpenClaw उस
   observed count को overflow recovery Compaction में forward करता है। अगर provider
   overflow confirm करता है लेकिन parseable count expose नहीं करता, तो OpenClaw Compaction engines और diagnostics को minimally
   over-budget synthetic count pass करता है।
   अगर overflow recovery फिर भी fail होती है, तो OpenClaw user को explicit guidance surface करता है
   और session key को fresh session id में silently rotate करने के बजाय current session mapping
   preserve करता है। Next step operator-controlled है:
   message retry करें, `/compact` run करें, या fresh session preferred होने पर `/new` run करें।
2. **Threshold maintenance**: successful turn के बाद, जब:

`contextTokens > contextWindow - reserveTokens`

जहां:

- `contextWindow` model का context window है
- `reserveTokens` prompts + अगले model output के लिए reserved headroom है

ये OpenClaw runtime semantics हैं।

OpenClaw अगला run खोलने से पहले preflight local Compaction भी trigger कर सकता है
जब `agents.defaults.compaction.maxActiveTranscriptBytes` set हो और
active transcript file उस size तक पहुंच जाए। यह local reopen cost के लिए file-size guard है,
raw archival नहीं: OpenClaw अभी भी normal semantic Compaction चलाता है,
और इसे `truncateAfterCompaction` चाहिए ताकि compacted summary
new successor transcript बन सके।

Embedded OpenClaw runs के लिए, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
opt-in tool-loop guard जोड़ता है। Tool result append होने के बाद और
अगली model call से पहले, OpenClaw उसी preflight
budget logic का उपयोग करके prompt pressure estimate करता है जो turn start पर उपयोग होता है। अगर context अब fit नहीं होता, तो guard
OpenClaw runtime के `transformContext` hook के अंदर compact नहीं करता। यह structured
mid-turn precheck signal raise करता है, current prompt submission रोकता है, और
outer run loop को existing recovery path उपयोग करने देता है: oversized tool results truncate करें
जब वह enough हो, या configured Compaction mode trigger करके retry करें। यह
option default रूप से disabled है और `default` तथा `safeguard`
Compaction modes दोनों के साथ काम करता है, provider-backed safeguard Compaction सहित।
यह `maxActiveTranscriptBytes` से independent है: byte-size guard
turn खुलने से पहले चलता है, जबकि mid-turn precheck embedded OpenClaw tool
loop में बाद में चलता है, जब new tool results append हो चुके होते हैं।

---

## Compaction settings (`reserveTokens`, `keepRecentTokens`)

OpenClaw runtime की Compaction settings agent settings में रहती हैं:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw embedded runs के लिए safety floor भी enforce करता है:

- अगर `compaction.reserveTokens < reserveTokensFloor`, OpenClaw उसे bump करता है।
- Default floor `20000` tokens है।
- Floor disable करने के लिए `agents.defaults.compaction.reserveTokensFloor: 0` set करें।
- अगर यह पहले से higher है, OpenClaw इसे वैसे ही छोड़ता है।
- Manual `/compact` explicit `agents.defaults.compaction.keepRecentTokens`
  को honor करता है और OpenClaw runtime का recent-tail cut point रखता है। Explicit keep budget के बिना,
  manual Compaction hard checkpoint रहता है और rebuilt context
  new summary से start होता है।
- New tool results के बाद और अगली model
  call से पहले optional tool-loop precheck चलाने के लिए `agents.defaults.compaction.midTurnPrecheck.enabled: true` set करें।
  यह केवल trigger है; summary generation फिर भी configured
  Compaction path का उपयोग करती है। यह `maxActiveTranscriptBytes` से independent है, जो
  turn-start active-transcript byte-size guard है।
- `agents.defaults.compaction.maxActiveTranscriptBytes` को byte value या
  `"20mb"` जैसी string पर set करें ताकि active
  transcript large होने पर turn से पहले local Compaction चल सके। यह guard केवल तब active होता है जब
  `truncateAfterCompaction` भी enabled हो। Disable करने के लिए इसे unset छोड़ें या `0` set करें।
- जब `agents.defaults.compaction.truncateAfterCompaction` enabled होता है,
  OpenClaw Compaction के बाद active transcript को compacted successor JSONL में rotate करता है।
  Branch/restore checkpoint actions उस compacted successor का उपयोग करते हैं;
  legacy pre-Compaction checkpoint files referenced रहते हुए readable रहती हैं।

क्यों: Compaction unavoidable होने से पहले multi-turn "housekeeping" (जैसे memory writes) के लिए पर्याप्त headroom छोड़ें।

Implementation: `src/agents/agent-settings.ts` में `applyAgentCompactionSettingsFromConfig()`
(embedded-runner turn और Compaction setup paths से called).

---

## Pluggable Compaction providers

Plugins plugin API पर `registerCompactionProvider()` के जरिए Compaction provider register कर सकते हैं। जब `agents.defaults.compaction.provider` registered provider id पर set होता है, safeguard extension built-in `summarizeInStages` pipeline के बजाय summarization उस provider को delegate करता है।

- `provider`: registered Compaction provider Plugin की id. Default LLM summarization के लिए unset छोड़ें।
- `provider` set करने से `mode: "safeguard"` force होता है।
- Providers को built-in path जैसे ही Compaction instructions और identifier-preservation policy मिलती है।
- Safeguard provider output के बाद भी recent-turn और split-turn suffix context preserve करता है।
- Built-in safeguard summarization prior summaries को new messages के साथ re-distill करता है
  full previous summary verbatim preserve करने के बजाय।
- Safeguard mode default रूप से summary quality audits enable करता है; retry-on-malformed-output behavior skip करने के लिए
  `qualityGuard.enabled: false` set करें।
- अगर provider fail होता है या empty result लौटाता है, OpenClaw automatically built-in LLM summarization पर fall back करता है।
- Abort/timeout signals caller cancellation का सम्मान करने के लिए re-thrown होते हैं (swallowed नहीं)।

Source: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## User-visible surfaces

आप Compaction और session state को इनके जरिए observe कर सकते हैं:

- `/status` (किसी भी chat session में)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway logs (`pnpm gateway:watch` या `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Verbose mode: `🧹 Auto-compaction complete` + Compaction count

---

## Silent housekeeping (`NO_REPLY`)

OpenClaw background tasks के लिए "silent" turns support करता है जहां user को intermediate output नहीं दिखना चाहिए।

Convention:

- सहायक अपने आउटपुट की शुरुआत सटीक मौन टोकन `NO_REPLY` /
  `no_reply` से करता है, ताकि यह संकेत दिया जा सके कि "उपयोगकर्ता को उत्तर न भेजें"।
- OpenClaw इसे डिलीवरी लेयर में हटा/दबा देता है।
- सटीक मौन-टोकन दमन केस-असंवेदनशील है, इसलिए `NO_REPLY` और
  `no_reply` दोनों गिने जाते हैं जब पूरा पेलोड केवल मौन टोकन हो।
- यह केवल वास्तविक पृष्ठभूमि/बिना-डिलीवरी टर्न के लिए है; यह
  सामान्य कार्रवाई योग्य उपयोगकर्ता अनुरोधों का शॉर्टकट नहीं है।

`2026.1.10` के अनुसार, OpenClaw **ड्राफ्ट/टाइपिंग स्ट्रीमिंग** को भी दबाता है जब कोई
आंशिक खंड `NO_REPLY` से शुरू होता है, ताकि मौन कार्रवाइयां टर्न के बीच आंशिक
आउटपुट लीक न करें।

---

## पूर्व-Compaction "मेमरी फ्लश" (लागू)

लक्ष्य: auto-compaction होने से पहले, एक मौन एजेंटिक टर्न चलाएं जो टिकाऊ
स्टेट को डिस्क पर लिखे (उदा. एजेंट वर्कस्पेस में `memory/YYYY-MM-DD.md`) ताकि Compaction
महत्वपूर्ण संदर्भ मिटा न सके।

OpenClaw **पूर्व-थ्रेशहोल्ड फ्लश** दृष्टिकोण का उपयोग करता है:

1. सेशन संदर्भ उपयोग की निगरानी करें।
2. जब यह "सॉफ्ट थ्रेशहोल्ड" पार करता है (OpenClaw रनटाइम के Compaction थ्रेशहोल्ड से नीचे), तो एजेंट को मौन
   "अब मेमरी लिखें" निर्देश चलाएं।
3. सटीक मौन टोकन `NO_REPLY` / `no_reply` का उपयोग करें ताकि उपयोगकर्ता को
   कुछ न दिखे।

कॉन्फिग (`agents.defaults.compaction.memoryFlush`):

- `enabled` (डिफॉल्ट: `true`)
- `model` (फ्लश टर्न के लिए वैकल्पिक सटीक प्रदाता/मॉडल ओवरराइड, उदाहरण के लिए `ollama/qwen3:8b`)
- `softThresholdTokens` (डिफॉल्ट: `4000`)
- `prompt` (फ्लश टर्न के लिए उपयोगकर्ता संदेश)
- `systemPrompt` (फ्लश टर्न के लिए जोड़ा गया अतिरिक्त सिस्टम प्रॉम्प्ट)

टिप्पणियां:

- डिफॉल्ट प्रॉम्प्ट/सिस्टम प्रॉम्प्ट में डिलीवरी दबाने के लिए `NO_REPLY` संकेत शामिल होता है।
- जब `model` सेट होता है, तो फ्लश टर्न सक्रिय सेशन फॉलबैक चेन विरासत में लिए बिना
  उसी मॉडल का उपयोग करता है, ताकि केवल-स्थानीय हाउसकीपिंग चुपचाप किसी भुगतान वाले
  बातचीत मॉडल पर फॉलबैक न करे।
- फ्लश हर Compaction चक्र में एक बार चलता है (`sessions.json` में ट्रैक किया जाता है)।
- फ्लश केवल एम्बेडेड OpenClaw सेशनों के लिए चलता है (CLI बैकएंड इसे छोड़ देते हैं)।
- जब सेशन वर्कस्पेस केवल-पढ़ने योग्य हो (`workspaceAccess: "ro"` या `"none"`), तो फ्लश छोड़ दिया जाता है।
- वर्कस्पेस फ़ाइल लेआउट और लेखन पैटर्न के लिए [मेमरी](/hi/concepts/memory) देखें।

OpenClaw एक्सटेंशन API में `session_before_compact` हुक भी उजागर करता है, लेकिन OpenClaw का
फ्लश लॉजिक आज Gateway साइड पर रहता है।

---

## समस्या-निवारण चेकलिस्ट

- सेशन कुंजी गलत है? [/concepts/session](/hi/concepts/session) से शुरू करें और `/status` में `sessionKey` की पुष्टि करें।
- स्टोर बनाम ट्रांसक्रिप्ट असंगति? `openclaw status` से Gateway होस्ट और स्टोर पथ की पुष्टि करें।
- Compaction स्पैम? जांचें:
  - मॉडल संदर्भ विंडो (बहुत छोटी)
  - Compaction सेटिंग्स (मॉडल विंडो के लिए `reserveTokens` बहुत अधिक होने पर Compaction जल्दी हो सकता है)
  - टूल-परिणाम ब्लोट: सेशन प्रूनिंग सक्षम/ट्यून करें
- मौन टर्न लीक हो रहे हैं? पुष्टि करें कि उत्तर `NO_REPLY` से शुरू होता है (केस-असंवेदनशील सटीक टोकन) और आप ऐसे बिल्ड पर हैं जिसमें स्ट्रीमिंग दमन फिक्स शामिल है।

## संबंधित

- [सेशन प्रबंधन](/hi/concepts/session)
- [सेशन प्रूनिंग](/hi/concepts/session-pruning)
- [संदर्भ इंजन](/hi/concepts/context-engine)
