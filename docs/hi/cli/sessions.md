---
read_when:
    - आप संग्रहीत सत्रों को सूचीबद्ध करना और हाल की गतिविधि देखना चाहते हैं
summary: '`openclaw sessions` के लिए CLI संदर्भ (संग्रहीत सत्रों की सूची + उपयोग)'
title: सत्र
x-i18n:
    generated_at: "2026-07-04T20:33:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

संग्रहीत बातचीत सत्रों की सूची दिखाएं।

सत्र सूचियां चैनल/प्रदाता सक्रियता जांच नहीं हैं। वे सत्र स्टोर से कायम रखी गई
बातचीत पंक्तियां दिखाती हैं। कोई शांत Discord, Slack, Telegram, या
अन्य चैनल नया सत्र पंक्ति बनाए बिना सफलतापूर्वक फिर से कनेक्ट हो सकता है,
जब तक कोई संदेश संसाधित न हो। जब आपको लाइव
चैनल कनेक्टिविटी चाहिए, तो `openclaw channels status --probe`,
`openclaw status --deep`, या `openclaw health --verbose` का उपयोग करें।

`openclaw sessions` और Gateway `sessions.list` प्रतिक्रियाएं डिफ़ॉल्ट रूप से सीमित होती हैं
ताकि बड़े लंबे समय तक रहने वाले स्टोर CLI प्रक्रिया या Gateway
इवेंट लूप पर एकाधिकार न कर सकें। CLI डिफ़ॉल्ट रूप से नवीनतम 100 सत्र लौटाता है; छोटे/बड़े विंडो के लिए
`--limit <n>` पास करें या जब आपको जानबूझकर
पूरा स्टोर चाहिए तो `--limit all` पास करें। जब कॉलरों को दिखाना हो कि और पंक्तियां मौजूद हैं, तो JSON प्रतिक्रियाओं में `totalCount`, `limitApplied`, और
`hasMore` शामिल होते हैं।

RPC क्लाइंट विस्तृत संयुक्त
डिस्कवरी स्रोत बनाए रखते हुए केवल वर्तमान में कॉन्फ़िगरेशन में मौजूद एजेंटों की पंक्तियां लौटाने के लिए `configuredAgentsOnly: true` पास कर सकते हैं।
Control UI डिफ़ॉल्ट रूप से उस मोड का उपयोग करता है, ताकि हटाए गए या केवल-डिस्क एजेंट स्टोर
Sessions दृश्य में फिर से प्रकट न हों।

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

दायरा चयन:

- डिफ़ॉल्ट: कॉन्फ़िगर किया गया डिफ़ॉल्ट एजेंट स्टोर
- `--verbose`: विस्तृत लॉगिंग
- `--agent <id>`: एक कॉन्फ़िगर किया गया एजेंट स्टोर
- `--all-agents`: सभी कॉन्फ़िगर किए गए एजेंट स्टोरों को एकत्र करें
- `--store <path>`: स्पष्ट स्टोर पथ (`--agent` या `--all-agents` के साथ संयोजित नहीं किया जा सकता)
- `--limit <n|all>`: आउटपुट के लिए अधिकतम पंक्तियां (डिफ़ॉल्ट `100`; `all` पूरा आउटपुट पुनर्स्थापित करता है)

संग्रहीत सत्रों के लिए मानव-पठनीय ट्रैजेक्टरी प्रगति को tail करें:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` हाल के ट्रैजेक्टरी JSONL इवेंट्स को संक्षिप्त प्रगति पंक्तियों के रूप में रेंडर करता है। `--session-key` के बिना, यह पहले चल रहे सत्रों को tail करता है, फिर नवीनतम संग्रहीत सत्र को। `--tail <count>` नियंत्रित करता है कि follow मोड से पहले कितने मौजूदा इवेंट प्रिंट हों; डिफ़ॉल्ट `80` है, और `0` वर्तमान अंत से शुरू करता है। `--follow` चुनी गई ट्रैजेक्टरी फ़ाइलों को देखते रहना जारी रखता है, जिसमें `<session>.trajectory-path.json` द्वारा संदर्भित स्थानांतरित फ़ाइलें भी शामिल हैं।

प्रगति दृश्य जानबूझकर रूढ़िवादी है: प्रॉम्प्ट टेक्स्ट, टूल आर्ग्युमेंट, और टूल परिणाम बॉडी प्रिंट नहीं की जातीं। टूल कॉल `{...redacted...}` के साथ टूल नाम दिखाते हैं; टूल परिणाम `ok`, `error`, या `done` जैसी स्थिति दिखाते हैं; मॉडल पूर्णता पंक्तियां प्रदाता/मॉडल और टर्मिनल स्थिति दिखाती हैं।

किसी संग्रहीत सत्र के लिए ट्रैजेक्टरी बंडल निर्यात करें:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

यह वह कमांड पथ है जिसका उपयोग `/export-trajectory` slash command द्वारा
मालिक के exec अनुरोध को मंज़ूरी देने के बाद किया जाता है। आउटपुट डायरेक्टरी हमेशा चुने गए workspace के अंतर्गत
`.openclaw/trajectory-exports/` के अंदर resolve की जाती है।

`openclaw sessions --all-agents` कॉन्फ़िगर किए गए एजेंट स्टोर पढ़ता है। Gateway और ACP
सत्र डिस्कवरी अधिक विस्तृत है: वे डिफ़ॉल्ट
`agents/` root या टेम्पलेटेड `session.store` root के अंतर्गत पाए गए केवल-डिस्क स्टोर भी शामिल करते हैं। उन
खोजे गए स्टोरों को एजेंट root के अंदर नियमित `sessions.json` फ़ाइलों पर resolve होना चाहिए; symlinks और root से बाहर के पथ छोड़े जाते हैं।

JSON उदाहरण:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## सफ़ाई रखरखाव

अभी रखरखाव चलाएं (अगले write cycle की प्रतीक्षा करने के बजाय):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` कॉन्फ़िगरेशन से `session.maintenance` सेटिंग्स का उपयोग करता है:

- दायरा नोट: `openclaw sessions cleanup` सत्र स्टोर, ट्रांसक्रिप्ट, और ट्रैजेक्टरी sidecars का रखरखाव करता है। यह cron run history को prune नहीं करता, जिसे [Cron कॉन्फ़िगरेशन](/hi/automation/cron-jobs#configuration) में `cron.runLog.keepLines` द्वारा प्रबंधित किया जाता है और [Cron रखरखाव](/hi/automation/cron-jobs#maintenance) में समझाया गया है।
- Cleanup `session.maintenance.pruneAfter` से पुराने अनसंदर्भित प्राथमिक ट्रांसक्रिप्ट, Compaction चेकपॉइंट, और ट्रैजेक्टरी sidecars को भी prune करता है; `sessions.json` द्वारा अभी भी संदर्भित फ़ाइलें संरक्षित रहती हैं।
- Cleanup अल्पकालिक gateway model-run probe cleanup को अलग से `modelRunPruned` के रूप में रिपोर्ट करता है। यह केवल `agent:*:explicit:model-run-<uuid>` जैसे आकार वाली सख्त स्पष्ट keys से मेल खाता है। निश्चित retention `24h` है, लेकिन यह pressure-gated है: यह केवल तब stale probe rows हटाता है जब session-entry maintenance/cap pressure पहुंच जाता है। जब यह चलता है, model-run cleanup वैश्विक stale cleanup और capping से पहले होता है।

- `--dry-run`: बिना लिखे preview करें कि कितनी entries prune/cap होंगी।
  - टेक्स्ट मोड में, dry-run प्रति-सत्र action table (`Action`, `Key`, `Age`, `Model`, `Flags`) और session label द्वारा grouped summary प्रिंट करता है, ताकि आप देख सकें कि क्या रखा जाएगा बनाम हटाया जाएगा।
- `--enforce`: `session.maintenance.mode` के `warn` होने पर भी maintenance लागू करें।
- `--fix-missing`: जिन entries की transcript files गायब हैं या header-only/empty हैं, उन्हें हटाएं, भले ही वे सामान्य रूप से अभी age/count out न हों।
- `--fix-dm-scope`: जब `session.dmScope` `main` हो, तो पहले के `per-peer`, `per-channel-peer`, या `per-account-channel-peer` routing से पीछे छूटी stale peer-keyed direct-DM rows retire करें। पहले `--dry-run` का उपयोग करें; cleanup लागू करने से वे rows `sessions.json` से हटती हैं और उनके transcripts deleted archives के रूप में संरक्षित रहते हैं।
- `--active-key <key>`: किसी विशिष्ट active key को disk-budget eviction से बचाएं। टिकाऊ external conversation pointers, जैसे group sessions और thread-scoped chat sessions, भी age/count/disk-budget maintenance द्वारा रखे जाते हैं।
- `--agent <id>`: एक कॉन्फ़िगर किए गए agent store के लिए cleanup चलाएं।
- `--all-agents`: सभी कॉन्फ़िगर किए गए agent stores के लिए cleanup चलाएं।
- `--store <path>`: किसी विशिष्ट `sessions.json` फ़ाइल पर चलाएं।
- `--json`: JSON summary प्रिंट करें। `--all-agents` के साथ, output में प्रति store एक summary शामिल होती है।

जब Gateway पहुंच योग्य हो, तो कॉन्फ़िगर किए गए agent stores के लिए non-dry-run cleanup
Gateway के माध्यम से भेजा जाता है ताकि वह runtime
traffic के समान session-store writer साझा करे। store file की स्पष्ट offline repair के लिए `--store <path>` का उपयोग करें।

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

## सत्र compact करें

wedged या oversized सत्र के लिए context budget पुनः प्राप्त करें। `openclaw sessions compact <key>` `sessions.compact` gateway RPC के चारों ओर first-class wrapper है और इसके लिए running gateway आवश्यक है।

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` के बिना, gateway LLM transcript को summarize करता है। CLI डिफ़ॉल्ट रूप से client deadline लागू नहीं करता; gateway configured compaction lifecycle का मालिक है।
- `--max-lines <n>` के साथ, यह अंतिम `n` transcript lines तक truncate करता है और prior transcript को `.bak` sidecar के रूप में archive करता है।
- `--agent <id>`: session का मालिक agent; `global` keys के लिए आवश्यक।
- `--url` / `--token` / `--password`: gateway connection overrides।
- `--timeout <ms>`: milliseconds में वैकल्पिक client-side RPC timeout।
- `--json`: raw RPC payload प्रिंट करें।

जब gateway failed compaction रिपोर्ट करता है या unreachable होता है, तो command non-zero exit करता है, ताकि crons और scripts किसी silent no-op को success न समझें।

> नोट: `openclaw agent --message '/compact ...'` compaction path **नहीं** है। CLI से slash commands authorized-sender check द्वारा reject किए जाते हैं; वह invocation silently no-op करने के बजाय यहां की ओर guidance देते हुए non-zero exit करता है।

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` स्वीकार करता है:

| Field      | Type        | Required | Description                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | yes      | Compact करने के लिए session key (उदाहरण `agent:main:main`)। |
| `agentId`  | string      | no       | Session का मालिक agent id (`global` keys के लिए)।          |
| `maxLines` | integer ≥ 1 | no       | LLM summarization के बजाय अंतिम N lines तक truncate करें।  |

LLM-summarize response का उदाहरण:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

truncate response का उदाहरण (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## संबंधित

- Session config: [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#session)
- [CLI संदर्भ](/hi/cli)
- [Session management](/hi/concepts/session)
