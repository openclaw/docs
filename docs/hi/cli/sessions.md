---
read_when:
    - आप संग्रहीत सत्रों की सूची देखना और हाल की गतिविधि देखना चाहते हैं
summary: '`openclaw sessions` के लिए CLI संदर्भ (संग्रहीत सत्रों और उपयोग की सूची)'
title: सत्र
x-i18n:
    generated_at: "2026-07-19T08:27:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

संग्रहीत वार्तालाप सत्रों की सूची दिखाएँ।

सत्र सूचियाँ चैनल/प्रदाता की सक्रियता की जाँच नहीं हैं। वे सत्र स्टोर में स्थायी रूप से
सहेजी गई वार्तालाप पंक्तियाँ दिखाती हैं। कोई निष्क्रिय Discord, Slack, Telegram या
अन्य चैनल नया सत्र बनाए बिना सफलतापूर्वक पुनः कनेक्ट हो सकता है, जब तक
किसी संदेश को प्रोसेस नहीं किया जाता। जब आपको लाइव चैनल कनेक्टिविटी चाहिए, तब
`openclaw channels status --probe`, `openclaw status --deep` या `openclaw health --verbose` का उपयोग करें।

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

फ़्लैग:

| फ़्लैग                 | विवरण                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | एक कॉन्फ़िगर किया गया एजेंट स्टोर (डिफ़ॉल्ट: कॉन्फ़िगर किया गया डिफ़ॉल्ट एजेंट)।        |
| `--all-agents`       | सभी कॉन्फ़िगर किए गए एजेंट स्टोर एकत्रित करें।                                 |
| `--store <path>`     | स्पष्ट स्टोर पथ (`--agent` या `--all-agents` के साथ संयोजित नहीं किया जा सकता)। |
| `--active <minutes>` | केवल पिछले N मिनट में अपडेट हुए सत्र दिखाएँ।                  |
| `--limit <n\|all>`   | आउटपुट की अधिकतम पंक्तियाँ (डिफ़ॉल्ट `100`; `all` पूर्ण आउटपुट पुनर्स्थापित करता है)।        |
| `--json`             | मशीन-पठनीय आउटपुट।                                               |
| `--verbose`          | विस्तृत लॉगिंग।                                                       |

`openclaw sessions` और Gateway `sessions.list` RPC डिफ़ॉल्ट रूप से सीमित हैं,
ताकि बड़े और दीर्घकालिक स्टोर CLI प्रक्रिया या Gateway इवेंट
लूप पर एकाधिकार न कर सकें। CLI डिफ़ॉल्ट रूप से नवीनतम 100 सत्र लौटाता है; छोटी/बड़ी
सीमा के लिए `--limit <n>` या जानबूझकर पूर्ण स्टोर की आवश्यकता होने पर
`--limit all` दें। जब कॉलर को यह दिखाना हो कि और पंक्तियाँ मौजूद हैं, तो JSON
प्रतिक्रियाओं में `totalCount`, `limitApplied` और `hasMore` शामिल होते हैं।

RPC क्लाइंट व्यापक संयुक्त खोज स्रोत बनाए रखते हुए केवल कॉन्फ़िगरेशन में
वर्तमान में मौजूद एजेंटों की पंक्तियाँ लौटाने के लिए `configuredAgentsOnly: true` दे सकते हैं।
Control UI डिफ़ॉल्ट रूप से इसी मोड का उपयोग करता है, ताकि हटाए गए या केवल डिस्क पर
मौजूद एजेंट स्टोर Sessions दृश्य में फिर से न दिखाई दें।

`--all-agents` कॉन्फ़िगर किए गए एजेंट स्टोर पढ़ता है। Gateway और ACP सत्र
खोज अधिक व्यापक हैं: उनमें कॉन्फ़िगर किए गए एजेंट रूट या टेम्पलेटयुक्त
`session.store` रूट से निर्धारित SQLite स्टोर भी शामिल होते हैं। लीगेसी चयनकर्ता
पथ एजेंट रूट के भीतर निर्धारित होने चाहिए; सिमलिंक और रूट के बाहर के पथ
छोड़ दिए जाते हैं।

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## प्रगति ट्रैजेक्टरी का अंतिम भाग

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` हाल के रनटाइम ट्रैजेक्टरी इवेंट को संक्षिप्त
प्रगति पंक्तियों के रूप में प्रस्तुत करता है। `--session-key` के बिना, यह पहले चल रहे सत्रों का अंतिम भाग
दिखाता है और फिर नवीनतम संग्रहीत सत्र का। `--tail <count>` नियंत्रित करता है कि फ़ॉलो मोड से पहले कितने
मौजूदा इवेंट प्रिंट किए जाएँ; डिफ़ॉल्ट `80` है और `0` वर्तमान अंत से शुरू करता है।
`--follow` चयनित SQLite-समर्थित सत्र या किसी स्पष्ट
लीगेसी ट्रैजेक्टरी फ़ाइल की निगरानी जारी रखता है।

प्रगति दृश्य जानबूझकर सीमित जानकारी दिखाता है: प्रॉम्प्ट टेक्स्ट, टूल आर्ग्युमेंट
और टूल परिणामों की सामग्री प्रिंट नहीं की जाती। टूल कॉल `{...redacted...}` के साथ
टूल का नाम दिखाते हैं; टूल परिणाम `ok`, `error` या `done` जैसी स्थिति दिखाते हैं;
मॉडल पूर्णता पंक्तियाँ प्रदाता/मॉडल और अंतिम स्थिति दिखाती हैं।

## ट्रैजेक्टरी बंडल निर्यात करें

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

स्वामी द्वारा निष्पादन अनुरोध स्वीकृत करने के बाद `/export-trajectory` स्लैश कमांड
इसी कमांड पथ का उपयोग करता है। आउटपुट डायरेक्टरी हमेशा चयनित कार्यस्थान के भीतर
`.openclaw/trajectory-exports/` में निर्धारित की जाती है।

## क्लीनअप रखरखाव

अगले लेखन चक्र की प्रतीक्षा करने के बजाय अभी रखरखाव चलाएँ:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` कॉन्फ़िगरेशन की `session.maintenance` सेटिंग का उपयोग करता है
([कॉन्फ़िगरेशन संदर्भ](/hi/gateway/config-agents#session)):

- दायरा टिप्पणी: `openclaw sessions cleanup` सत्र स्टोर,
  ट्रांसक्रिप्ट, ट्रैजेक्टरी पंक्तियों और लीगेसी ट्रैजेक्टरी साइडकार का रखरखाव करता है। यह
  Cron रन इतिहास को कम नहीं करता, जो प्रत्येक जॉब के लिए नवीनतम 2000 पंक्तियाँ स्वचालित रूप से रखता है
  ([Cron कॉन्फ़िगरेशन](/hi/automation/cron-jobs#configuration))।
- क्लीनअप बिना संदर्भ वाले लीगेसी/आर्काइव ट्रांसक्रिप्ट आर्टिफ़ैक्ट,
  Compaction चेकपॉइंट और `session.maintenance.pruneAfter` से पुराने ट्रैजेक्टरी साइडकार भी हटाता है;
  SQLite सत्र पंक्तियों द्वारा अब भी संदर्भित आर्टिफ़ैक्ट सुरक्षित रखे जाते हैं।
- क्लीनअप अल्पकालिक Gateway मॉडल-रन प्रोब क्लीनअप को
  `modelRunPruned` के रूप में अलग से रिपोर्ट करता है। यह केवल
  `agent:*:explicit:model-run-<uuid>` जैसे स्वरूप वाली सख्त स्पष्ट कुंजियों से मेल खाता है। अवधारण अवधि निश्चित
  `24h` है और दबाव-नियंत्रित है: यह पुराने प्रोब की पंक्तियाँ केवल तभी हटाता है,
  जब सत्र-प्रविष्टि रखरखाव/सीमा का दबाव पहुँच जाता है। इसके चलने पर मॉडल-रन क्लीनअप
  वैश्विक पुराने डेटा के क्लीनअप और सीमा लागू करने से पहले होता है।

फ़्लैग:

| फ़्लैग                 | विवरण                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | बिना लिखे पूर्वावलोकन करें कि कितनी प्रविष्टियाँ हटाई/सीमित की जाएँगी। टेक्स्ट मोड में, यह प्रति-सत्र कार्रवाई तालिका (`Action`, `Key`, `Age`, `Model`, `Flags`) और सत्र लेबल के अनुसार समूहीकृत सारांश प्रिंट करता है।                                                                                                       |
| `--enforce`          | `session.maintenance.mode` के `warn` होने पर भी रखरखाव लागू करें।                                                                                                                                                                                                                                          |
| `--fix-missing`      | उन लीगेसी प्रविष्टियों को हटाएँ जिनके आर्काइव किए गए ट्रांसक्रिप्ट आर्टिफ़ैक्ट अनुपस्थित हैं या केवल हेडर वाले/खाली हैं, भले ही वे सामान्यतः अभी आयु/गणना सीमा से बाहर न हों।                                                                                                                                                             |
| `--fix-dm-scope`     | जब `session.dmScope`, `main` हो, तो पहले की `per-peer`, `per-channel-peer` या `per-account-channel-peer` रूटिंग द्वारा छोड़ी गई पुरानी पीयर-कुंजीयुक्त डायरेक्ट-DM पंक्तियों को हटाएँ। पहले `--dry-run` का उपयोग करें; इसे लागू करने पर वे पंक्तियाँ SQLite से हट जाती हैं और उनके लीगेसी ट्रांसक्रिप्ट आर्टिफ़ैक्ट हटाए गए आर्काइव के रूप में सुरक्षित रहते हैं। |
| `--active-key <key>` | किसी विशिष्ट सक्रिय कुंजी को डिस्क-बजट निष्कासन से सुरक्षित रखें। स्थायी बाहरी वार्तालाप पॉइंटर, जैसे समूह सत्र और थ्रेड-दायरे वाले चैट सत्र, भी आयु/गणना/डिस्क-बजट रखरखाव द्वारा बनाए रखे जाते हैं।                                                                                               |
| `--agent <id>`       | एक कॉन्फ़िगर किए गए एजेंट स्टोर के लिए क्लीनअप चलाएँ।                                                                                                                                                                                                                                                                |
| `--all-agents`       | सभी कॉन्फ़िगर किए गए एजेंट स्टोर के लिए क्लीनअप चलाएँ।                                                                                                                                                                                                                                                               |
| `--store <path>`     | किसी विशिष्ट लीगेसी स्टोर चयनकर्ता पथ पर चलाएँ।                                                                                                                                                                                                                                                         |
| `--json`             | JSON सारांश प्रिंट करें। `--all-agents` के साथ आउटपुट में प्रत्येक स्टोर के लिए एक सारांश शामिल होता है।                                                                                                                                                                                                                          |

जब Gateway उपलब्ध हो, तो कॉन्फ़िगर किए गए एजेंट स्टोर के लिए गैर-ड्राई-रन क्लीनअप
Gateway के माध्यम से भेजा जाता है, ताकि वह रनटाइम ट्रैफ़िक के समान सत्र-स्टोर राइटर
साझा करे। किसी लीगेसी स्टोर चयनकर्ता की स्पष्ट ऑफ़लाइन मरम्मत के लिए
`--store <path>` का उपयोग करें।

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

## किसी सत्र को संक्षिप्त करें

अटके हुए या अत्यधिक बड़े सत्र के लिए कॉन्टेक्स्ट बजट पुनः प्राप्त करें। `openclaw sessions
compact <key>`, `sessions.compact`
Gateway RPC के लिए प्रथम-श्रेणी रैपर है और इसके लिए चालू Gateway आवश्यक है।

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- `--max-lines` के बिना, Gateway LLM का उपयोग करके ट्रांसक्रिप्ट का सारांश बनाता है। CLI
  डिफ़ॉल्ट रूप से क्लाइंट समय-सीमा लागू नहीं करता; कॉन्फ़िगर किए गए
  Compaction जीवनचक्र का स्वामित्व Gateway के पास होता है।
- `--max-lines <n>` के साथ, यह ट्रांसक्रिप्ट को अंतिम `n` पंक्तियों तक सीमित करता है और
  पिछले ट्रांसक्रिप्ट को `.bak` साइडकार के रूप में आर्काइव करता है।
- `--agent <id>`: सत्र का स्वामी एजेंट; `global` कुंजियों के लिए आवश्यक।
- `--url` / `--token` / `--password`: Gateway कनेक्शन ओवरराइड।
- `--timeout <ms>`: मिलीसेकंड में वैकल्पिक क्लाइंट-साइड RPC समय-सीमा।
- `--json`: अपरिष्कृत RPC पेलोड प्रिंट करें।

जब Gateway विफल Compaction की रिपोर्ट करता है या उस तक पहुँचा नहीं जा सकता, तो कमांड गैर-शून्य स्थिति के साथ समाप्त होती है, ताकि Cron और स्क्रिप्ट किसी मौन नो-ऑप को कभी भी सफलता न समझें।

<Note>
`openclaw agent --message '/compact ...'` कोई Compaction पथ **नहीं** है। CLI से स्लैश कमांड अधिकृत-प्रेषक जाँच द्वारा अस्वीकार कर दिए जाते हैं; वह आह्वान मौन रूप से नो-ऑप होने के बजाय यहाँ इंगित करने वाले मार्गदर्शन के साथ गैर-शून्य स्थिति में समाप्त होता है।
</Note>

### sessions.compact RPC

`openclaw gateway call sessions.compact --params '<json>'` इन्हें स्वीकार करता है:

| फ़ील्ड      | प्रकार        | आवश्यक | विवरण                                                |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | हाँ      | Compaction करने के लिए सेशन कुंजी (उदाहरण के लिए `agent:main:main`)।    |
| `agentId`  | string      | नहीं       | सेशन का स्वामी एजेंट आईडी (`global` कुंजियों के लिए)।        |
| `maxLines` | integer ≥ 1 | नहीं       | LLM सारांश के बजाय अंतिम N पंक्तियों तक ट्रंकेट करें। |

LLM-सारांश प्रतिक्रिया का उदाहरण:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

ट्रंकेट प्रतिक्रिया का उदाहरण (`--max-lines 200`):

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

- [सेशन कॉन्फ़िगरेशन](/hi/gateway/config-agents#session)
- [सेशन प्रबंधन](/hi/concepts/session)
- [Compaction](/hi/concepts/compaction)
- [CLI संदर्भ](/hi/cli)
