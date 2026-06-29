---
read_when:
    - आप अर्थ-संबंधी स्मृति को अनुक्रमित करना या खोजना चाहते हैं
    - आप मेमोरी उपलब्धता या इंडेक्सिंग को डीबग कर रहे हैं
    - आप पुनः प्राप्त अल्पकालिक स्मृति को `MEMORY.md` में प्रोन्नत करना चाहते हैं
summary: '`openclaw memory` के लिए CLI संदर्भ (status/index/search/promote/promote-explain/rem-harness)'
title: मेमोरी
x-i18n:
    generated_at: "2026-06-28T22:50:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 553c69ccc92d398e765a33bfadb8cc9a0bf9e0f86b319fb4fcff05464ebebe7c
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

सिमैंटिक मेमोरी इंडेक्सिंग और खोज प्रबंधित करें।
बंडल किए गए `memory-core` Plugin द्वारा प्रदान किया गया। यह कमांड तब उपलब्ध होता है जब
`plugins.slots.memory` `memory-core` को चुनता है (डिफ़ॉल्ट); अन्य मेमोरी Plugins
अपने स्वयं के CLI नेमस्पेस उजागर करते हैं।

संबंधित:

- मेमोरी अवधारणा: [मेमोरी](/hi/concepts/memory)
- मेमोरी विकी: [मेमोरी विकी](/hi/plugins/memory-wiki)
- विकी CLI: [wiki](/hi/cli/wiki)
- Plugins: [Plugins](/hi/tools/plugin)

## उदाहरण

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## विकल्प

`memory status` और `memory index`:

- `--agent <id>`: एक ही एजेंट तक सीमित करें। इसके बिना, ये कमांड हर कॉन्फ़िगर किए गए एजेंट के लिए चलते हैं; अगर कोई एजेंट सूची कॉन्फ़िगर नहीं है, तो वे डिफ़ॉल्ट एजेंट पर वापस चले जाते हैं।
- `--verbose`: प्रोब और इंडेक्सिंग के दौरान विस्तृत लॉग उत्सर्जित करें।

`memory status`:

- `--deep`: स्थानीय वेक्टर-स्टोर तैयारी, एम्बेडिंग-प्रोवाइडर तैयारी, और सिमैंटिक वेक्टर-खोज तैयारी की जांच करें। साधारण `memory status` तेज़ रहता है और लाइव एम्बेडिंग या प्रोवाइडर डिस्कवरी काम नहीं चलाता; अज्ञात वेक्टर-स्टोर या सिमैंटिक-वेक्टर स्थिति का अर्थ है कि उस कमांड में इसकी जांच नहीं की गई थी। QMD lexical `searchMode: "search"` `--deep` के साथ भी सिमैंटिक वेक्टर प्रोब और एम्बेडिंग मेंटेनेंस छोड़ देता है।
- `--index`: अगर स्टोर dirty है तो रीइंडेक्स चलाएं (`--deep` निहित है)।
- `--fix`: stale रिकॉल लॉक सुधारें और प्रमोशन मेटाडेटा सामान्यीकृत करें।
- `--json`: JSON आउटपुट प्रिंट करें।

अगर `memory status` `Dreaming status: blocked` दिखाता है, तो managed dreaming Cron सक्षम है लेकिन उसे चलाने वाला Heartbeat डिफ़ॉल्ट एजेंट के लिए फायर नहीं हो रहा है। दो सामान्य कारणों के लिए [Dreaming कभी नहीं चलता](/hi/concepts/dreaming#dreaming-never-runs-status-shows-blocked) देखें।

`memory index`:

- `--force`: पूरा रीइंडेक्स बाध्य करें।

`memory search`:

- क्वेरी इनपुट: या तो पोज़िशनल `[query]` या `--query <text>` पास करें।
- अगर दोनों दिए गए हैं, तो `--query` प्राथमिकता लेता है।
- अगर कोई भी नहीं दिया गया है, तो कमांड त्रुटि के साथ बाहर निकलता है।
- `--agent <id>`: एक ही एजेंट तक सीमित करें (डिफ़ॉल्ट: डिफ़ॉल्ट एजेंट)।
- `--max-results <n>`: लौटाए गए परिणामों की संख्या सीमित करें।
- `--min-score <n>`: कम-स्कोर मिलानों को फ़िल्टर करें।
- `--json`: JSON परिणाम प्रिंट करें।

`memory promote`:

शॉर्ट-टर्म मेमोरी प्रमोशन का पूर्वावलोकन करें और लागू करें।

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- प्रमोशन को `MEMORY.md` में लिखें (डिफ़ॉल्ट: केवल पूर्वावलोकन)।
- `--limit <n>` -- दिखाए गए उम्मीदवारों की संख्या सीमित करें।
- `--include-promoted` -- पिछले चक्रों में पहले से प्रमोट की गई प्रविष्टियां शामिल करें।

पूर्ण विकल्प:

- `memory/YYYY-MM-DD.md` से शॉर्ट-टर्म उम्मीदवारों को weighted promotion signals (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`) का उपयोग करके रैंक करता है।
- मेमोरी रिकॉल और daily-ingestion पास, दोनों से शॉर्ट-टर्म सिग्नल, साथ ही light/REM phase reinforcement सिग्नल उपयोग करता है।
- जब Dreaming सक्षम होता है, तो `memory-core` एक Cron जॉब को अपने-आप प्रबंधित करता है जो पृष्ठभूमि में पूरा sweep (`light -> REM -> deep`) चलाता है (मैन्युअल `openclaw cron add` आवश्यक नहीं)।
- `--agent <id>`: एक ही एजेंट तक सीमित करें (डिफ़ॉल्ट: डिफ़ॉल्ट एजेंट)।
- `--limit <n>`: लौटाने/लागू करने के लिए अधिकतम उम्मीदवार।
- `--min-score <n>`: न्यूनतम weighted promotion score।
- `--min-recall-count <n>`: किसी उम्मीदवार के लिए आवश्यक न्यूनतम recall count।
- `--min-unique-queries <n>`: किसी उम्मीदवार के लिए आवश्यक न्यूनतम distinct query count।
- `--apply`: चुने गए उम्मीदवारों को `MEMORY.md` में जोड़ें और उन्हें promoted चिह्नित करें।
- `--include-promoted`: आउटपुट में पहले से promoted उम्मीदवार शामिल करें।
- `--json`: JSON आउटपुट प्रिंट करें।

`memory promote-explain`:

किसी विशिष्ट प्रमोशन उम्मीदवार और उसके स्कोर breakdown को समझाएं।

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: देखने के लिए candidate key, path fragment, या snippet fragment।
- `--agent <id>`: एक ही एजेंट तक सीमित करें (डिफ़ॉल्ट: डिफ़ॉल्ट एजेंट)।
- `--include-promoted`: पहले से promoted उम्मीदवार शामिल करें।
- `--json`: JSON आउटपुट प्रिंट करें।

`memory rem-harness`:

कुछ भी लिखे बिना REM reflections, candidate truths, और deep promotion output का पूर्वावलोकन करें।

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: एक ही एजेंट तक सीमित करें (डिफ़ॉल्ट: डिफ़ॉल्ट एजेंट)।
- `--include-promoted`: पहले से promoted deep candidates शामिल करें।
- `--json`: JSON आउटपुट प्रिंट करें।

## Dreaming

Dreaming तीन सहयोगी चरणों वाला पृष्ठभूमि मेमोरी consolidation system है:
चरण: **light** (शॉर्ट-टर्म सामग्री को sort/stage करें), **deep** (टिकाऊ
तथ्यों को `MEMORY.md` में promote करें), और **REM** (reflect करें और themes सामने लाएं)।

- `plugins.entries.memory-core.config.dreaming.enabled: true` से सक्षम करें।
- चैट से `/dreaming on|off` के साथ टॉगल करें (या `/dreaming status` से जांचें)।
- Dreaming एक managed sweep schedule (`dreaming.frequency`) पर चलता है और चरणों को क्रम में निष्पादित करता है: light, REM, deep।
- केवल deep phase टिकाऊ मेमोरी को `MEMORY.md` में लिखता है।
- मानव-पठनीय phase output और diary entries `DREAMS.md` (या मौजूदा `dreams.md`) में लिखी जाती हैं, वैकल्पिक per-phase reports के साथ `memory/dreaming/<phase>/YYYY-MM-DD.md` में।
- रैंकिंग weighted signals का उपयोग करती है: recall frequency, retrieval relevance, query diversity, temporal recency, cross-day consolidation, और derived concept richness।
- प्रमोशन `MEMORY.md` में लिखने से पहले लाइव daily note को फिर से पढ़ता है, इसलिए संपादित या हटाए गए शॉर्ट-टर्म snippets stale recall-store snapshots से promote नहीं होते।
- scheduled और manual `memory promote` रन वही deep phase defaults साझा करते हैं, जब तक आप CLI threshold overrides पास नहीं करते।
- automatic runs कॉन्फ़िगर किए गए मेमोरी workspaces में fan out होते हैं।

डिफ़ॉल्ट scheduling:

- **Sweep cadence**: `dreaming.frequency = 0 3 * * *`
- **Deep thresholds**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

उदाहरण:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

नोट्स:

- `memory index --verbose` per-phase विवरण (provider, model, sources, batch activity) प्रिंट करता है।
- `memory status` `memorySearch.extraPaths` के ज़रिए कॉन्फ़िगर किए गए किसी भी अतिरिक्त path को शामिल करता है।
- अगर प्रभावी Active Memory remote API key fields SecretRefs के रूप में कॉन्फ़िगर हैं, तो कमांड उन मानों को active Gateway snapshot से resolve करता है। अगर Gateway उपलब्ध नहीं है, तो कमांड तुरंत विफल होता है।
- Gateway version skew note: इस command path को ऐसे Gateway की आवश्यकता है जो `secrets.resolve` का समर्थन करता हो; पुराने gateways unknown-method error लौटाते हैं।
- scheduled sweep cadence को `dreaming.frequency` से ट्यून करें। Deep promotion policy अन्यथा internal है, सिवाय `dreaming.phases.deep.maxPromotedSnippetTokens` के, जो provenance visible रखते हुए promoted snippet length को सीमित करता है। जब आपको one-off manual threshold overrides चाहिए हों, तो `memory promote` पर CLI flags उपयोग करें।
- `memory rem-harness --path <file-or-dir> --grounded` कुछ भी लिखे बिना historical daily notes से grounded `What Happened`, `Reflections`, और `Possible Lasting Updates` का पूर्वावलोकन करता है।
- `memory rem-backfill --path <file-or-dir>` UI review के लिए reversible grounded diary entries को `DREAMS.md` में लिखता है।
- `memory rem-backfill --path <file-or-dir> --stage-short-term` grounded durable candidates को live short-term promotion store में भी seed करता है ताकि सामान्य deep phase उन्हें rank कर सके।
- `memory rem-backfill --rollback` पहले लिखी गई grounded diary entries हटाता है, और `memory rem-backfill --rollback-short-term` पहले staged grounded short-term candidates हटाता है।
- पूर्ण phase descriptions और configuration reference के लिए [Dreaming](/hi/concepts/dreaming) देखें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [मेमोरी अवलोकन](/hi/concepts/memory)
