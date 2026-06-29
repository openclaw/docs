---
read_when:
    - आप संग्रहीत सत्रों की सूची देखना और हाल की गतिविधि देखना चाहते हैं
summary: CLI संदर्भ `openclaw sessions` के लिए (संग्रहीत सत्रों की सूची + उपयोग)
title: सत्र
x-i18n:
    generated_at: "2026-06-28T22:53:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

संग्रहीत वार्तालाप सत्रों की सूची दिखाएँ।

सत्र सूचियाँ चैनल/प्रदाता की लाइवनेस जाँच नहीं हैं। वे सत्र स्टोर से बने रहने वाले वार्तालाप पंक्तियाँ दिखाती हैं। कोई शांत Discord, Slack, Telegram, या अन्य चैनल नया सत्र पंक्ति बनाए बिना सफलतापूर्वक फिर से कनेक्ट हो सकता है, जब तक कोई संदेश संसाधित न हो। जब आपको लाइव चैनल कनेक्टिविटी चाहिए, तो `openclaw channels status --probe`, `openclaw status --deep`, या `openclaw health --verbose` का उपयोग करें।

`openclaw sessions` और Gateway `sessions.list` प्रतिक्रियाएँ डिफ़ॉल्ट रूप से सीमित होती हैं ताकि बड़े, लंबे समय तक चलने वाले स्टोर CLI प्रक्रिया या Gateway इवेंट लूप पर एकाधिकार न कर सकें। CLI डिफ़ॉल्ट रूप से नवीनतम 100 सत्र लौटाता है; छोटे/बड़े विंडो के लिए `--limit <n>` पास करें या जब आपको जानबूझकर पूरा स्टोर चाहिए, तब `--limit all` पास करें। जब कॉलरों को यह दिखाना हो कि और पंक्तियाँ मौजूद हैं, तो JSON प्रतिक्रियाओं में `totalCount`, `limitApplied`, और `hasMore` शामिल होते हैं।

RPC क्लाइंट व्यापक संयुक्त डिस्कवरी स्रोत बनाए रखते हुए केवल वर्तमान में कॉन्फ़िगरेशन में मौजूद एजेंटों की पंक्तियाँ लौटाने के लिए `configuredAgentsOnly: true` पास कर सकते हैं। Control UI डिफ़ॉल्ट रूप से इसी मोड का उपयोग करता है ताकि हटाए गए या केवल-डिस्क एजेंट स्टोर Sessions दृश्य में फिर से दिखाई न दें।

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

स्कोप चयन:

- डिफ़ॉल्ट: कॉन्फ़िगर किया गया डिफ़ॉल्ट एजेंट स्टोर
- `--verbose`: विस्तृत लॉगिंग
- `--agent <id>`: एक कॉन्फ़िगर किया गया एजेंट स्टोर
- `--all-agents`: सभी कॉन्फ़िगर किए गए एजेंट स्टोर को समेकित करें
- `--store <path>`: स्पष्ट स्टोर पथ (`--agent` या `--all-agents` के साथ जोड़ा नहीं जा सकता)
- `--limit <n|all>`: आउटपुट की अधिकतम पंक्तियाँ (डिफ़ॉल्ट `100`; `all` पूरा आउटपुट बहाल करता है)

संग्रहीत सत्रों के लिए मानव-पठनीय ट्रैजेक्टरी प्रगति को टेल करें:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` हाल की ट्रैजेक्टरी JSONL घटनाओं को संक्षिप्त प्रगति पंक्तियों के रूप में रेंडर करता है। `--session-key` के बिना, यह पहले चल रहे सत्रों को टेल करता है, फिर नवीनतम संग्रहीत सत्र को। `--tail <count>` नियंत्रित करता है कि फ़ॉलो मोड से पहले कितनी मौजूदा घटनाएँ प्रिंट हों; डिफ़ॉल्ट `80` है, और `0` वर्तमान अंत से शुरू करता है। `--follow` चुनी गई ट्रैजेक्टरी फ़ाइलों को देखता रहता है, जिनमें `<session>.trajectory-path.json` द्वारा संदर्भित स्थानांतरित फ़ाइलें भी शामिल हैं।

प्रगति दृश्य जानबूझकर रूढ़िवादी है: प्रॉम्प्ट टेक्स्ट, टूल आर्ग्युमेंट, और टूल परिणाम बॉडी प्रिंट नहीं किए जाते। टूल कॉल `{...redacted...}` के साथ टूल नाम दिखाते हैं; टूल परिणाम `ok`, `error`, या `done` जैसी स्थिति दिखाते हैं; मॉडल पूर्णता पंक्तियाँ प्रदाता/मॉडल और अंतिम स्थिति दिखाती हैं।

किसी संग्रहीत सत्र के लिए ट्रैजेक्टरी बंडल निर्यात करें:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

यह वह कमांड पथ है जिसका उपयोग मालिक द्वारा exec अनुरोध स्वीकृत करने के बाद `/export-trajectory` स्लैश कमांड करता है। आउटपुट डायरेक्टरी हमेशा चुने गए वर्कस्पेस के अंतर्गत `.openclaw/trajectory-exports/` के भीतर हल की जाती है।

`openclaw sessions --all-agents` कॉन्फ़िगर किए गए एजेंट स्टोर पढ़ता है। Gateway और ACP सत्र डिस्कवरी व्यापक हैं: वे डिफ़ॉल्ट `agents/` रूट या टेम्पलेटेड `session.store` रूट के अंतर्गत पाए गए केवल-डिस्क स्टोर भी शामिल करते हैं। उन खोजे गए स्टोर को एजेंट रूट के भीतर नियमित `sessions.json` फ़ाइलों पर हल होना चाहिए; सिमलिंक और रूट से बाहर के पथ छोड़े जाते हैं।

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

अभी रखरखाव चलाएँ (अगले लेखन चक्र की प्रतीक्षा करने के बजाय):

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

- स्कोप नोट: `openclaw sessions cleanup` सत्र स्टोर, ट्रांसक्रिप्ट, और ट्रैजेक्टरी साइडकार का रखरखाव करता है। यह cron रन इतिहास को नहीं छाँटता, जिसे [Cron कॉन्फ़िगरेशन](/hi/automation/cron-jobs#configuration) में `cron.runLog.keepLines` द्वारा प्रबंधित किया जाता है और [Cron रखरखाव](/hi/automation/cron-jobs#maintenance) में समझाया गया है।
- सफ़ाई `session.maintenance.pruneAfter` से पुराने असंदर्भित प्राथमिक ट्रांसक्रिप्ट, Compaction चेकपॉइंट, और ट्रैजेक्टरी साइडकार भी छाँटती है; `sessions.json` द्वारा अभी भी संदर्भित फ़ाइलें सुरक्षित रखी जाती हैं।
- सफ़ाई अल्पकालिक gateway मॉडल-रन प्रोब सफ़ाई को अलग से `modelRunPruned` के रूप में रिपोर्ट करती है। यह केवल `agent:*:explicit:model-run-<uuid>` जैसे बने सख्त स्पष्ट कुंजियों से मेल खाता है। निश्चित रिटेंशन `24h` है, लेकिन यह दबाव-गेटेड है: यह केवल तब पुराने प्रोब पंक्तियाँ हटाता है जब session-entry रखरखाव/कैप दबाव पहुँचता है। जब यह चलता है, मॉडल-रन सफ़ाई वैश्विक पुराने डेटा की सफ़ाई और कैपिंग से पहले होती है।

- `--dry-run`: लिखे बिना पूर्वावलोकन करें कि कितनी प्रविष्टियाँ छाँटी/कैप की जाएँगी।
  - टेक्स्ट मोड में, dry-run प्रति-सत्र क्रिया तालिका (`Action`, `Key`, `Age`, `Model`, `Flags`) और सत्र लेबल के अनुसार समूहित सारांश प्रिंट करता है ताकि आप देख सकें कि क्या रखा जाएगा बनाम हटाया जाएगा।
- `--enforce`: `session.maintenance.mode` के `warn` होने पर भी रखरखाव लागू करें।
- `--fix-missing`: उन प्रविष्टियों को हटाएँ जिनकी ट्रांसक्रिप्ट फ़ाइलें गायब हैं या केवल-हेडर/खाली हैं, भले ही वे सामान्यतः अभी उम्र/गिनती सीमा से बाहर न होतीं।
- `--fix-dm-scope`: जब `session.dmScope` `main` हो, तो पहले के `per-peer`, `per-channel-peer`, या `per-account-channel-peer` रूटिंग द्वारा छोड़ी गई पुरानी peer-keyed direct-DM पंक्तियाँ रिटायर करें। पहले `--dry-run` का उपयोग करें; सफ़ाई लागू करने से वे पंक्तियाँ `sessions.json` से हट जाती हैं और उनके ट्रांसक्रिप्ट हटाए गए आर्काइव के रूप में सुरक्षित रहते हैं।
- `--active-key <key>`: किसी विशिष्ट सक्रिय कुंजी को डिस्क-बजट निष्कासन से सुरक्षित रखें। टिकाऊ बाहरी वार्तालाप पॉइंटर, जैसे समूह सत्र और थ्रेड-स्कोप्ड चैट सत्र, भी उम्र/गिनती/डिस्क-बजट रखरखाव द्वारा रखे जाते हैं।
- `--agent <id>`: एक कॉन्फ़िगर किए गए एजेंट स्टोर के लिए सफ़ाई चलाएँ।
- `--all-agents`: सभी कॉन्फ़िगर किए गए एजेंट स्टोर के लिए सफ़ाई चलाएँ।
- `--store <path>`: किसी विशिष्ट `sessions.json` फ़ाइल के विरुद्ध चलाएँ।
- `--json`: JSON सारांश प्रिंट करें। `--all-agents` के साथ, आउटपुट में प्रति स्टोर एक सारांश शामिल होता है।

जब Gateway उपलब्ध हो, तो कॉन्फ़िगर किए गए एजेंट स्टोर के लिए non-dry-run सफ़ाई Gateway के माध्यम से भेजी जाती है ताकि यह रनटाइम ट्रैफ़िक जैसा ही session-store लेखक साझा करे। किसी स्टोर फ़ाइल की स्पष्ट ऑफ़लाइन मरम्मत के लिए `--store <path>` का उपयोग करें।

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

## सत्र को कॉम्पैक्ट करें

अटके हुए या बड़े आकार के सत्र के लिए संदर्भ बजट पुनः प्राप्त करें। `openclaw sessions compact <key>` `sessions.compact` gateway RPC के चारों ओर प्रथम-श्रेणी रैपर है और इसके लिए चलता हुआ gateway आवश्यक है।

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` के बिना, gateway LLM द्वारा ट्रांसक्रिप्ट का सारांश बनाता है। यह धीमा हो सकता है, इसलिए डिफ़ॉल्ट `--timeout` `180000` ms है।
- `--max-lines <n>` के साथ, यह अंतिम `n` ट्रांसक्रिप्ट पंक्तियों तक काटता है और पहले के ट्रांसक्रिप्ट को `.bak` साइडकार के रूप में आर्काइव करता है।
- `--agent <id>`: वह एजेंट जिसके पास सत्र का स्वामित्व है; `global` कुंजियों के लिए आवश्यक।
- `--url` / `--token` / `--password`: gateway कनेक्शन ओवरराइड।
- `--timeout <ms>`: मिलीसेकंड में RPC टाइमआउट।
- `--json`: कच्चा RPC पेलोड प्रिंट करें।

जब gateway विफल compaction रिपोर्ट करता है या उपलब्ध नहीं होता, तो कमांड non-zero के साथ बाहर निकलता है, ताकि crons और स्क्रिप्ट कभी भी शांत no-op को सफलता न समझें।

> नोट: `openclaw agent --message '/compact ...'` compaction पथ **नहीं** है। CLI से स्लैश कमांड authorized-sender जाँच द्वारा अस्वीकार किए जाते हैं; वह invocation शांत no-op करने के बजाय यहाँ इंगित करने वाले मार्गदर्शन के साथ non-zero निकलता है।

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` स्वीकार करता है:

| फ़ील्ड      | प्रकार        | आवश्यक | विवरण                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | स्ट्रिंग      | हाँ      | कॉम्पैक्ट करने के लिए सत्र कुंजी (उदाहरण `agent:main:main`)।    |
| `agentId`  | स्ट्रिंग      | नहीं       | वह एजेंट id जिसके पास सत्र का स्वामित्व है (`global` कुंजियों के लिए)।        |
| `maxLines` | पूर्णांक ≥ 1 | नहीं       | LLM सारांश के बजाय अंतिम N पंक्तियों तक काटें। |

LLM-सारांश प्रतिक्रिया का उदाहरण:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

काटने की प्रतिक्रिया का उदाहरण (`--max-lines 200`):

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

- सत्र कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#session)
- [CLI संदर्भ](/hi/cli)
- [सत्र प्रबंधन](/hi/concepts/session)
