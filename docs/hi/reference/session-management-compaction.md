---
read_when:
    - आपको सेशन IDs, ट्रांसक्रिप्ट JSONL, या sessions.json फ़ील्ड डीबग करने की आवश्यकता है
    - आप स्वचालित Compaction व्यवहार बदल रहे हैं या "पूर्व-Compaction" रखरखाव जोड़ रहे हैं
    - आप मेमोरी फ्लश या साइलेंट सिस्टम टर्न लागू करना चाहते हैं
summary: 'गहन अध्ययन: सेशन स्टोर + ट्रांसक्रिप्ट्स, लाइफसाइकिल, और (ऑटो)Compaction की आंतरिक कार्यप्रणाली'
title: सत्र प्रबंधन की गहन पड़ताल
x-i18n:
    generated_at: "2026-06-29T00:09:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw इन क्षेत्रों में सत्रों को शुरू से अंत तक प्रबंधित करता है:

- **सत्र रूटिंग** (इनबाउंड संदेश `sessionKey` से कैसे मैप होते हैं)
- **सत्र स्टोर** (`sessions.json`) और यह क्या ट्रैक करता है
- **ट्रांसक्रिप्ट स्थायित्व** (`*.jsonl`) और इसकी संरचना
- **ट्रांसक्रिप्ट स्वच्छता** (रन से पहले प्रदाता-विशिष्ट सुधार)
- **संदर्भ सीमाएं** (संदर्भ विंडो बनाम ट्रैक किए गए टोकन)
- **Compaction** (मैन्युअल और ऑटो-Compaction) और प्री-Compaction काम कहां हुक करना है
- **मौन रखरखाव** (मेमोरी लेखन जिनसे उपयोगकर्ता-दृश्य आउटपुट नहीं बनना चाहिए)

अगर आप पहले उच्च-स्तरीय अवलोकन चाहते हैं, तो यहां से शुरू करें:

- [सत्र प्रबंधन](/hi/concepts/session)
- [Compaction](/hi/concepts/compaction)
- [मेमोरी अवलोकन](/hi/concepts/memory)
- [मेमोरी खोज](/hi/concepts/memory-search)
- [सत्र छंटाई](/hi/concepts/session-pruning)
- [ट्रांसक्रिप्ट स्वच्छता](/hi/reference/transcript-hygiene)

---

## सत्य का स्रोत: Gateway

OpenClaw एकल **Gateway प्रक्रिया** के इर्द-गिर्द डिजाइन किया गया है जो सत्र स्थिति की स्वामी होती है।

- UI (macOS ऐप, वेब Control UI, TUI) को सत्र सूचियों और टोकन गणनाओं के लिए Gateway से क्वेरी करनी चाहिए।
- रिमोट मोड में, सत्र फाइलें रिमोट होस्ट पर होती हैं; "आपकी स्थानीय Mac फाइलें जांचना" यह नहीं दिखाएगा कि Gateway क्या उपयोग कर रहा है।

---

## दो स्थायित्व परतें

OpenClaw सत्रों को दो परतों में स्थायी करता है:

1. **सत्र स्टोर (`sessions.json`)**
   - कुंजी/मान मैप: `sessionKey -> SessionEntry`
   - छोटा, परिवर्तनीय, संपादित करने के लिए सुरक्षित (या प्रविष्टियां हटाने के लिए)
   - सत्र मेटाडेटा ट्रैक करता है (वर्तमान सत्र id, अंतिम गतिविधि, टॉगल, टोकन काउंटर आदि)

2. **ट्रांसक्रिप्ट (`<sessionId>.jsonl`)**
   - ट्री संरचना वाला केवल-जोड़े जाने वाला ट्रांसक्रिप्ट (प्रविष्टियों में `id` + `parentId` होते हैं)
   - वास्तविक बातचीत + टूल कॉल + Compaction सारांश संग्रहीत करता है
   - भविष्य के टर्न के लिए मॉडल संदर्भ फिर से बनाने में उपयोग होता है
   - Compaction चेकपॉइंट compacted successor
     ट्रांसक्रिप्ट पर मेटाडेटा होते हैं। नए Compaction दूसरी `.checkpoint.*.jsonl`
     कॉपी नहीं लिखते।

Gateway इतिहास रीडरों को पूरा ट्रांसक्रिप्ट मटेरियलाइज करने से बचना चाहिए, जब तक
सतह को स्पष्ट रूप से मनमाने ऐतिहासिक एक्सेस की जरूरत न हो। प्रथम-पृष्ठ इतिहास,
एम्बेडेड चैट इतिहास, पुनःआरंभ रिकवरी, और टोकन/उपयोग जांचें सीमित टेल
रीड का उपयोग करती हैं। पूर्ण ट्रांसक्रिप्ट स्कैन async ट्रांसक्रिप्ट इंडेक्स से गुजरते हैं, जो
फाइल पथ और `mtimeMs`/`size` से कैश होता है और समवर्ती रीडरों में साझा होता है।

---

## ऑन-डिस्क स्थान

प्रति एजेंट, Gateway होस्ट पर:

- स्टोर: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- ट्रांसक्रिप्ट: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram टॉपिक सत्र: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw इन्हें `src/config/sessions.ts` के जरिए रिजॉल्व करता है।

---

## स्टोर रखरखाव और डिस्क नियंत्रण

सत्र स्थायित्व में `sessions.json`, ट्रांसक्रिप्ट आर्टिफैक्ट, और ट्रैजेक्टरी साइडकार के लिए स्वचालित रखरखाव नियंत्रण (`session.maintenance`) हैं:

- `mode`: `enforce` (डिफॉल्ट) या `warn`
- `pruneAfter`: बासी-प्रविष्टि आयु कटऑफ (डिफॉल्ट `30d`)
- `maxEntries`: `sessions.json` में प्रविष्टियों की सीमा (डिफॉल्ट `500`)
- अल्पकालिक gateway model-run probe retention `24h` पर स्थिर है, लेकिन यह दबाव-गेटेड है: यह बासी strict probe rows केवल तब हटाता है जब session-entry रखरखाव/कैप दबाव पहुंचता है। यह केवल `agent:*:explicit:model-run-<uuid>` से मेल खाने वाली strict explicit probe keys पर लागू होता है और चलने पर global stale-entry cleanup/capping से पहले चलता है।
- `resetArchiveRetention`: `*.reset.<timestamp>` ट्रांसक्रिप्ट आर्काइव के लिए retention (डिफॉल्ट: `pruneAfter` जैसा; `false` cleanup अक्षम करता है)
- `maxDiskBytes`: वैकल्पिक sessions-directory बजट
- `highWaterBytes`: cleanup के बाद वैकल्पिक लक्ष्य (डिफॉल्ट `maxDiskBytes` का `80%`)

सामान्य Gateway लेखन per-store session writer से गुजरता है जो runtime file lock लिए बिना in-process mutations को serialize करता है। Hot-path patch helpers उस writer slot को पकड़े रहते समय validated mutable cache उधार लेते हैं, इसलिए बड़े `sessions.json` फाइलें हर metadata update के लिए clone या reread नहीं होतीं। Runtime code को `updateSessionStore(...)` या `updateSessionStoreEntry(...)` को प्राथमिकता देनी चाहिए; direct whole-store saves compatibility और offline-maintenance tools हैं। जब Gateway पहुंच योग्य हो, non-dry-run `openclaw sessions cleanup` और `openclaw agents delete` store mutations को Gateway को delegate करते हैं ताकि cleanup उसी writer queue में शामिल हो; `--store <path>` direct file maintenance के लिए explicit offline repair path है। `maxEntries` cleanup अभी भी production-sized caps के लिए batched है, इसलिए store configured cap से थोड़े समय के लिए अधिक हो सकता है, फिर अगला high-water cleanup उसे वापस नीचे rewrite करता है। Gateway startup के दौरान session store reads entries को prune या cap नहीं करते; cleanup के लिए writes या `openclaw sessions cleanup --enforce` का उपयोग करें। `openclaw sessions cleanup --enforce` अभी भी configured cap तुरंत लागू करता है और disk budget configured न होने पर भी पुराने unreferenced transcript, checkpoint, और trajectory artifacts को prune करता है।

रखरखाव durable external conversation pointers जैसे group sessions
और thread-scoped chat sessions को बनाए रखता है, लेकिन cron, hooks,
heartbeat, ACP, और sub-agents के लिए synthetic runtime entries तब भी हटाई जा सकती हैं जब वे
configured age, count, या disk budget से अधिक हो जाएं। Gateway model-run probe sessions
अलग `24h` model-run retention का उपयोग केवल तब करते हैं जब उनकी key ठीक
`agent:*:explicit:model-run-<uuid>` से मेल खाती है; अन्य explicit sessions उस
retention का हिस्सा नहीं हैं। model-run cleanup केवल session-entry cap
pressure के तहत लागू होता है। Isolated cron runs अपना अलग `cron.sessionRetention` control रखते हैं,
जो model-run probe retention से स्वतंत्र है।

OpenClaw अब Gateway writes के दौरान automatic `sessions.json.bak.*` rotation backups नहीं बनाता। legacy `session.maintenance.rotateBytes` key ignored है और `openclaw doctor --fix` इसे पुराने configs से हटाता है।

ट्रांसक्रिप्ट mutations transcript file पर session write lock का उपयोग करते हैं। Lock acquisition
busy-session error दिखाने से पहले `session.writeLock.acquireTimeoutMs` तक प्रतीक्षा करता है; डिफॉल्ट `60000`
ms है। इसे केवल तब बढ़ाएं जब वैध prep, cleanup, compaction, या transcript mirror work धीमी मशीनों पर
लंबे समय तक contend करे। `session.writeLock.staleMs` नियंत्रित करता है कि मौजूदा lock कब
stale मानकर reclaim किया जा सकता है; डिफॉल्ट `1800000` ms है। `session.writeLock.maxHoldMs`
in-process watchdog release threshold नियंत्रित करता है; डिफॉल्ट `300000` ms है। Emergency env overrides हैं
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`, और
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`।

disk budget cleanup (`mode: "enforce"`) के लिए enforcement order:

1. सबसे पहले सबसे पुराने archived, orphan transcript, या orphan trajectory artifacts हटाएं।
2. अगर अभी भी target से ऊपर है, तो सबसे पुरानी session entries और उनकी transcript/trajectory files evict करें।
3. usage `highWaterBytes` पर या उससे नीचे आने तक जारी रखें।

`mode: "warn"` में, OpenClaw संभावित evictions रिपोर्ट करता है लेकिन store/files को mutate नहीं करता।

मांग पर रखरखाव चलाएं:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron सत्र और रन लॉग

Isolated cron runs भी session entries/transcripts बनाते हैं, और उनके dedicated retention controls होते हैं:

- `cron.sessionRetention` (डिफॉल्ट `24h`) session store से पुराने isolated cron run sessions prune करता है (`false` अक्षम करता है)।
- `cron.runLog.keepLines` प्रति cron job retained SQLite run-history rows prune करता है (डिफॉल्ट: `2000`)। `cron.runLog.maxBytes` पुराने file-backed run logs के लिए accepted रहता है।

जब cron नया isolated run session force-create करता है, तो यह नया row लिखने से पहले पिछले
`cron:<jobId>` session entry को sanitize करता है। यह thinking/fast/verbose settings, labels, और explicit
user-selected model/auth overrides जैसी safe preferences carry करता है। यह channel/group routing, send या queue policy, elevation, origin, और ACP
runtime binding जैसे ambient conversation context को drop करता है ताकि नया isolated run पुराने run से stale delivery या
runtime authority inherit न कर सके।

---

## सत्र कुंजियां (`sessionKey`)

`sessionKey` पहचानता है कि आप _किस conversation bucket_ में हैं (routing + isolation)।

सामान्य patterns:

- Main/direct chat (प्रति agent): `agent:<agentId>:<mainKey>` (डिफॉल्ट `main`)
- Group: `agent:<agentId>:<channel>:group:<id>`
- Room/channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` या `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (जब तक override न किया गया हो)

Canonical rules [/concepts/session](/hi/concepts/session) पर documented हैं।

---

## सत्र ids (`sessionId`)

हर `sessionKey` एक current `sessionId` की ओर संकेत करता है (वह transcript file जो conversation जारी रखती है)।

व्यावहारिक नियम:

- **Reset** (`/new`, `/reset`) उस `sessionKey` के लिए नया `sessionId` बनाता है।
- **Daily reset** (gateway host पर डिफॉल्ट 4:00 AM local time) reset boundary के बाद अगले message पर नया `sessionId` बनाता है।
- **Idle expiry** (`session.reset.idleMinutes` या legacy `session.idleMinutes`) idle window के बाद message आने पर नया `sessionId` बनाता है। जब daily + idle दोनों configured हों, जो पहले expire हो वही लागू होता है।
- **Control UI reconnect resume** operator UI client से matching `sessionId` Gateway को मिलने पर एक reconnect send के लिए currently visible session को preserve कर सकता है। Ordinary stale sends अभी भी नया `sessionId` बनाते हैं।
- **System events** (heartbeat, cron wakeups, exec notifications, gateway bookkeeping) session row mutate कर सकते हैं लेकिन daily/idle reset freshness नहीं बढ़ाते। Reset rollover fresh prompt बनने से पहले previous session के queued system-event notices discard करता है।
- **Parent fork policy** thread या subagent fork बनाते समय OpenClaw की active branch का उपयोग करती है। अगर वह branch बहुत बड़ी है, तो OpenClaw fail होने या unusable history inherit करने के बजाय child को isolated context के साथ शुरू करता है। sizing policy automatic है; legacy `session.parentForkMaxTokens` config `openclaw doctor --fix` द्वारा हटाया जाता है।

Implementation detail: निर्णय `src/auto-reply/reply/session.ts` में `initSessionState()` में होता है।

---

## सत्र स्टोर schema (`sessions.json`)

स्टोर का value type `src/config/sessions.ts` में `SessionEntry` है।

मुख्य fields (पूर्ण सूची नहीं):

- `sessionId`: current transcript id (filename इससे derive होता है जब तक `sessionFile` set न हो)
- `sessionStartedAt`: current `sessionId` के लिए start timestamp; daily reset
  freshness इसका उपयोग करती है। Legacy rows इसे JSONL session header से derive कर सकते हैं।
- `lastInteractionAt`: last real user/channel interaction timestamp; idle reset
  freshness इसका उपयोग करती है ताकि heartbeat, cron, और exec events sessions को
  alive न रखें। इस field के बिना legacy rows idle freshness के लिए recovered session start
  time पर fall back करते हैं।
- `updatedAt`: last store-row mutation timestamp, listing, pruning, और
  bookkeeping के लिए used। यह daily/idle reset freshness का authority नहीं है।
- `sessionFile`: optional explicit transcript path override
- `chatType`: `direct | group | room` (UIs और send policy में मदद करता है)
- `provider`, `subject`, `room`, `space`, `displayName`: group/channel labeling के लिए metadata
- Toggles:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (per-session override)
- Model selection:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token counters (best-effort / provider-dependent):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: इस session key के लिए auto-compaction कितनी बार complete हुआ
- `memoryFlushAt`: last pre-compaction memory flush का timestamp
- `memoryFlushCompactionCount`: last flush चलने के समय compaction count

स्टोर edit करने के लिए safe है, लेकिन Gateway authority है: sessions चलते समय यह entries rewrite या rehydrate कर सकता है।

---

## ट्रांसक्रिप्ट संरचना (`*.jsonl`)

Transcripts `openclaw/plugin-sdk/agent-sessions` के `SessionManager` द्वारा managed होते हैं।

फाइल JSONL है:

- पहली line: session header (`type: "session"`, `id`, `cwd`, `timestamp`, optional `parentSession` शामिल)
- फिर: `id` + `parentId` (tree) वाली session entries

उल्लेखनीय entry types:

- `message`: user/assistant/toolResult संदेश
- `custom_message`: एक्सटेंशन द्वारा इंजेक्ट किए गए संदेश जो मॉडल संदर्भ में _प्रवेश करते हैं_ (UI से छिपाए जा सकते हैं)
- `custom`: एक्सटेंशन स्थिति जो मॉडल संदर्भ में _प्रवेश नहीं करती_
- `compaction`: `firstKeptEntryId` और `tokensBefore` के साथ स्थायी Compaction सारांश
- `branch_summary`: ट्री ब्रांच नेविगेट करते समय स्थायी सारांश

OpenClaw जानबूझकर ट्रांसक्रिप्ट को **"fix up"** नहीं करता; Gateway उन्हें पढ़ने/लिखने के लिए `SessionManager` का उपयोग करता है.

---

## संदर्भ विंडो बनाम ट्रैक किए गए टोकन

दो अलग अवधारणाएं महत्वपूर्ण हैं:

1. **मॉडल संदर्भ विंडो**: प्रति मॉडल हार्ड कैप (मॉडल को दिखने वाले टोकन)
2. **सेशन स्टोर काउंटर**: `sessions.json` में लिखे जाने वाले रोलिंग आंकड़े (/status और डैशबोर्ड के लिए उपयोग)

अगर आप सीमाएं ट्यून कर रहे हैं:

- संदर्भ विंडो मॉडल कैटलॉग से आती है (और config के माध्यम से ओवरराइड की जा सकती है).
- स्टोर में `contextTokens` एक रनटाइम अनुमान/रिपोर्टिंग मान है; इसे सख्त गारंटी न मानें.

अधिक जानकारी के लिए, [/token-use](/hi/reference/token-use) देखें.

---

## Compaction: यह क्या है

Compaction पुरानी बातचीत को ट्रांसक्रिप्ट में एक स्थायी `compaction` एंट्री में सारांशित करता है और हाल के संदेशों को यथावत रखता है.

Compaction के बाद, भविष्य के टर्न देखते हैं:

- Compaction सारांश
- `firstKeptEntryId` के बाद के संदेश

Compaction के बाद AGENTS.md सेक्शन reinjection
`agents.defaults.compaction.postCompactionSections` के माध्यम से opt-in है; जब यह unset या `[]` हो,
OpenClaw Compaction सारांश के ऊपर AGENTS.md अंश नहीं जोड़ता.

Compaction **स्थायी** है (सेशन pruning के विपरीत). [/concepts/session-pruning](/hi/concepts/session-pruning) देखें.

## Compaction chunk सीमाएं और टूल pairing

जब OpenClaw लंबे ट्रांसक्रिप्ट को Compaction chunks में विभाजित करता है, तो यह
assistant tool calls को उनके संबंधित `toolResult` entries के साथ paired रखता है.

- अगर token-share split किसी tool call और उसके result के बीच आ जाता है, तो OpenClaw
  pair को अलग करने के बजाय boundary को assistant tool-call message तक shift करता है.
- अगर trailing tool-result block अन्यथा chunk को target से ऊपर धकेल देगा, तो
  OpenClaw उस pending tool block को preserve करता है और unsummarized tail
  intact रखता है.
- Aborted/error tool-call blocks pending split को open नहीं रखते.

---

## Auto-compaction कब होता है (OpenClaw रनटाइम)

embedded OpenClaw agent में, auto-compaction दो मामलों में trigger होता है:

1. **Overflow recovery**: मॉडल context overflow error लौटाता है
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`, और समान provider-shaped variants) → compact → retry.
   जब provider attempted token count रिपोर्ट करता है, OpenClaw उस observed count को
   overflow recovery compaction में forward करता है. अगर provider overflow confirm करता है
   लेकिन parseable count expose नहीं करता, तो OpenClaw compaction engines और diagnostics को minimally
   over-budget synthetic count पास करता है.
   अगर overflow recovery फिर भी fail होती है, तो OpenClaw user को explicit guidance दिखाता है
   और session key को चुपचाप नए session id पर rotate करने के बजाय current session mapping preserve करता है.
   अगला कदम operator-controlled है:
   message retry करें, `/compact` चलाएं, या fresh session पसंद होने पर `/new` चलाएं.
2. **Threshold maintenance**: successful turn के बाद, जब:

`contextTokens > contextWindow - reserveTokens`

जहां:

- `contextWindow` मॉडल की context window है
- `reserveTokens` prompts + अगले model output के लिए reserved headroom है

ये OpenClaw runtime semantics हैं.

OpenClaw अगला run खोलने से पहले preflight local compaction भी trigger कर सकता है
जब `agents.defaults.compaction.maxActiveTranscriptBytes` set हो और
active transcript file उस size तक पहुंच जाए. यह local reopen cost के लिए file-size guard है,
raw archival नहीं: OpenClaw अभी भी normal semantic compaction चलाता है,
और इसके लिए `truncateAfterCompaction` चाहिए ताकि compacted summary
new successor transcript बन सके.

embedded OpenClaw runs के लिए, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
एक opt-in tool-loop guard जोड़ता है. Tool result append होने के बाद और
अगले model call से पहले, OpenClaw वही preflight
budget logic उपयोग करके prompt pressure estimate करता है जो turn start पर उपयोग होती है. अगर context अब fit नहीं होता, तो guard
OpenClaw runtime के `transformContext` hook के अंदर compact नहीं करता. यह structured
mid-turn precheck signal raise करता है, current prompt submission रोकता है, और
outer run loop को existing recovery path उपयोग करने देता है: oversized tool results को truncate करें
जब वह पर्याप्त हो, या configured compaction mode trigger करके retry करें. यह
option default रूप से disabled है और `default` तथा `safeguard`
दोनों compaction modes के साथ काम करता है, जिसमें provider-backed safeguard compaction भी शामिल है.
यह `maxActiveTranscriptBytes` से स्वतंत्र है: byte-size guard
turn खुलने से पहले चलता है, जबकि mid-turn precheck embedded OpenClaw tool
loop में नए tool results append होने के बाद बाद में चलता है.

---

## Compaction settings (`reserveTokens`, `keepRecentTokens`)

OpenClaw runtime की compaction settings agent settings में रहती हैं:

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

- अगर `compaction.reserveTokens < reserveTokensFloor`, OpenClaw इसे बढ़ाता है.
- Default floor `20000` tokens है.
- Floor disable करने के लिए `agents.defaults.compaction.reserveTokensFloor: 0` set करें.
- अगर यह पहले से अधिक है, OpenClaw इसे वैसे ही छोड़ता है.
- Manual `/compact` explicit `agents.defaults.compaction.keepRecentTokens`
  का सम्मान करता है और OpenClaw runtime का recent-tail cut point रखता है. Explicit keep budget के बिना,
  manual compaction hard checkpoint रहता है और rebuilt context
  नए summary से शुरू होता है.
- नए tool results के बाद और अगले model
  call से पहले optional tool-loop precheck चलाने के लिए `agents.defaults.compaction.midTurnPrecheck.enabled: true` set करें. यह केवल trigger है; summary generation अब भी configured
  compaction path का उपयोग करता है. यह `maxActiveTranscriptBytes` से स्वतंत्र है, जो
  turn-start active-transcript byte-size guard है.
- Active transcript बड़ा होने पर turn से पहले local compaction चलाने के लिए
  `agents.defaults.compaction.maxActiveTranscriptBytes` को byte value या
  `"20mb"` जैसी string पर set करें. यह guard केवल तब active है जब
  `truncateAfterCompaction` भी enabled हो. Disable करने के लिए इसे unset छोड़ें या `0` set करें.
- जब `agents.defaults.compaction.truncateAfterCompaction` enabled हो,
  OpenClaw compaction के बाद active transcript को compacted successor JSONL पर rotate करता है.
  Branch/restore checkpoint actions उस compacted successor का उपयोग करते हैं;
  legacy pre-compaction checkpoint files referenced रहते हुए readable रहती हैं.

क्यों: Compaction unavoidable होने से पहले multi-turn "housekeeping" (जैसे memory writes) के लिए पर्याप्त headroom छोड़ना.

Implementation: `src/agents/agent-settings.ts` में `applyAgentCompactionSettingsFromConfig()`
(embedded-runner turn और compaction setup paths से called).

---

## Pluggable compaction providers

Plugins plugin API पर `registerCompactionProvider()` के माध्यम से compaction provider register कर सकते हैं. जब `agents.defaults.compaction.provider` किसी registered provider id पर set हो, safeguard extension built-in `summarizeInStages` pipeline के बजाय summarization उस provider को delegate करता है.

- `provider`: registered compaction provider plugin की id. Default LLM summarization के लिए unset छोड़ें.
- `provider` set करने से `mode: "safeguard"` force होता है.
- Providers को built-in path जैसी ही compaction instructions और identifier-preservation policy मिलती है.
- Safeguard provider output के बाद भी recent-turn और split-turn suffix context preserve करता है.
- Built-in safeguard summarization prior summaries को new messages के साथ re-distill करता है
  बजाय full previous summary verbatim preserve करने के.
- Safeguard mode default रूप से summary quality audits enable करता है; retry-on-malformed-output behavior skip करने के लिए
  `qualityGuard.enabled: false` set करें.
- अगर provider fail होता है या empty result लौटाता है, OpenClaw automatically built-in LLM summarization पर fall back करता है.
- Caller cancellation का सम्मान करने के लिए abort/timeout signals re-throw किए जाते हैं (swallow नहीं किए जाते).

Source: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## User-visible surfaces

आप compaction और session state इनसे observe कर सकते हैं:

- `/status` (किसी भी chat session में)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway logs (`pnpm gateway:watch` या `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Verbose mode: `🧹 Auto-compaction complete` + compaction count

---

## Silent housekeeping (`NO_REPLY`)

OpenClaw background tasks के लिए "silent" turns support करता है, जहां user को intermediate output नहीं दिखना चाहिए.

Convention:

- Assistant अपना output exact silent token `NO_REPLY` /
  `no_reply` से शुरू करता है ताकि indicate हो "user को reply deliver न करें".
- OpenClaw delivery layer में इसे strip/suppress करता है.
- Exact silent-token suppression case-insensitive है, इसलिए `NO_REPLY` और
  `no_reply` दोनों count होते हैं जब पूरा payload सिर्फ silent token हो.
- यह केवल true background/no-delivery turns के लिए है; यह
  ordinary actionable user requests के लिए shortcut नहीं है.

`2026.1.10` के अनुसार, OpenClaw **draft/typing streaming** भी suppress करता है जब
partial chunk `NO_REPLY` से शुरू होता है, ताकि silent operations mid-turn में partial
output leak न करें.

---

## Pre-compaction "memory flush" (implemented)

Goal: auto-compaction होने से पहले, एक silent agentic turn चलाएं जो durable
state को disk पर लिखे (जैसे agent workspace में `memory/YYYY-MM-DD.md`) ताकि compaction
critical context erase न कर सके.

OpenClaw **pre-threshold flush** approach उपयोग करता है:

1. Session context usage monitor करें.
2. जब यह "soft threshold" cross करता है (OpenClaw runtime के compaction threshold से नीचे), तो agent को silent
   "write memory now" directive चलाएं.
3. Exact silent token `NO_REPLY` / `no_reply` उपयोग करें ताकि user को
   कुछ न दिखे.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (default: `true`)
- `model` (flush turn के लिए optional exact provider/model override, उदाहरण के लिए `ollama/qwen3:8b`)
- `softThresholdTokens` (default: `4000`)
- `prompt` (flush turn के लिए user message)
- `systemPrompt` (flush turn के लिए appended extra system prompt)

Notes:

- Default prompt/system prompt delivery suppress करने के लिए `NO_REPLY` hint शामिल करते हैं.
- जब `model` set हो, flush turn active session fallback chain inherit किए बिना
  उस model का उपयोग करता है, ताकि local-only housekeeping चुपचाप
  paid conversation model पर fall back न करे.
- Flush प्रति compaction cycle एक बार चलता है (`sessions.json` में tracked).
- Flush केवल embedded OpenClaw sessions के लिए चलता है (CLI backends इसे skip करते हैं).
- जब session workspace read-only हो (`workspaceAccess: "ro"` या `"none"`), flush skip किया जाता है.
- Workspace file layout और write patterns के लिए [Memory](/hi/concepts/memory) देखें.

OpenClaw extension API में `session_before_compact` hook भी expose करता है, लेकिन OpenClaw की
flush logic आज Gateway side पर रहती है.

---

## Troubleshooting checklist

- Session key गलत है? [/concepts/session](/hi/concepts/session) से शुरू करें और `/status` में `sessionKey` confirm करें.
- Store बनाम transcript mismatch? `openclaw status` से Gateway host और store path confirm करें.
- Compaction spam? Check करें:
  - model context window (बहुत छोटी)
  - compaction settings (model window के लिए `reserveTokens` बहुत high होने से earlier compaction हो सकता है)
  - tool-result bloat: session pruning enable/tune करें
- Silent turns leak हो रहे हैं? Confirm करें कि reply `NO_REPLY` (case-insensitive exact token) से शुरू होता है और आप ऐसे build पर हैं जिसमें streaming suppression fix शामिल है.

## Related

- [Session management](/hi/concepts/session)
- [Session pruning](/hi/concepts/session-pruning)
- [Context engine](/hi/concepts/context-engine)
