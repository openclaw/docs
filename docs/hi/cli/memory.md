---
read_when:
    - आप semantic memory को इंडेक्स या खोज करना चाहते हैं
    - आप मेमोरी उपलब्धता या इंडेक्सिंग डिबग कर रहे हैं
    - आप रिकॉल की गई अल्पकालिक मेमोरी को `MEMORY.md` में प्रमोट करना चाहते हैं
summary: '`openclaw memory` के लिए CLI संदर्भ (status/index/search/promote/promote-explain/rem-harness)'
title: मेमोरी
x-i18n:
    generated_at: "2026-06-30T14:02:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

सिमेंटिक मेमोरी इंडेक्सिंग और खोज प्रबंधित करें।
यह बंडल किए गए `memory-core` Plugin द्वारा प्रदान किया जाता है। यह कमांड तब उपलब्ध होता है जब
`plugins.slots.memory` `memory-core` चुनता है (डिफॉल्ट); अन्य मेमोरी Plugin
अपने स्वयं के CLI नेमस्पेस उपलब्ध कराते हैं।

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

- `--agent <id>`: दायरा किसी एक एजेंट तक सीमित करें। इसके बिना, ये कमांड प्रत्येक कॉन्फिगर किए गए एजेंट के लिए चलते हैं; यदि कोई एजेंट सूची कॉन्फिगर नहीं है, तो वे डिफॉल्ट एजेंट पर वापस जाते हैं।
- `--verbose`: प्रोब और इंडेक्सिंग के दौरान विस्तृत लॉग उत्सर्जित करें।

`memory status`:

- `--deep`: लोकल वेक्टर-स्टोर तैयारी, एम्बेडिंग-प्रोवाइडर तैयारी, और सिमेंटिक वेक्टर-सर्च तैयारी की जांच करें। सामान्य `memory status` तेज रहता है और लाइव एम्बेडिंग या प्रोवाइडर डिस्कवरी कार्य नहीं चलाता; अज्ञात वेक्टर-स्टोर या सिमेंटिक-वेक्टर स्थिति का मतलब है कि उस कमांड में उसकी जांच नहीं की गई थी। QMD लेक्सिकल `searchMode: "search"` `--deep` के साथ भी सिमेंटिक वेक्टर प्रोब और एम्बेडिंग रखरखाव छोड़ देता है।
- `--index`: यदि स्टोर डर्टी है तो रीइंडेक्स चलाएं (`--deep` निहित करता है)।
- `--fix`: पुराने रिकॉल लॉक सुधारें और प्रमोशन मेटाडेटा सामान्यीकृत करें।
- `--json`: JSON आउटपुट प्रिंट करें।

यदि `memory status` `Dreaming status: blocked` दिखाता है, तो प्रबंधित Dreaming Cron सक्षम है लेकिन उसे चलाने वाला Heartbeat डिफॉल्ट एजेंट के लिए फायर नहीं हो रहा है। दो सामान्य कारणों के लिए [Dreaming कभी नहीं चलता](/hi/concepts/dreaming#dreaming-never-runs-status-shows-blocked) देखें।

`memory index`:

- `--force`: पूर्ण रीइंडेक्स को बाध्य करें।

`memory search`:

- क्वेरी इनपुट: या तो पोजिशनल `[query]` या `--query <text>` पास करें।
- यदि दोनों दिए गए हैं, तो `--query` प्राथमिकता लेता है।
- यदि कोई भी नहीं दिया गया है, तो कमांड त्रुटि के साथ बाहर निकलता है।
- `--agent <id>`: दायरा किसी एक एजेंट तक सीमित करें (डिफॉल्ट: डिफॉल्ट एजेंट)।
- `--max-results <n>`: लौटाए गए परिणामों की संख्या सीमित करें।
- `--min-score <n>`: कम-स्कोर वाले मैच फ़िल्टर करें।
- `--json`: JSON परिणाम प्रिंट करें।

`memory promote`:

शॉर्ट-टर्म मेमोरी प्रमोशन का पूर्वावलोकन करें और उन्हें लागू करें।

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- प्रमोशन को `MEMORY.md` में लिखें (डिफॉल्ट: केवल पूर्वावलोकन)।
- `--limit <n>` -- दिखाए गए कैंडिडेट की संख्या सीमित करें।
- `--include-promoted` -- पिछले चक्रों में पहले से प्रमोट की गई एंट्री शामिल करें।

पूर्ण विकल्प:

- भारित प्रमोशन संकेतों (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`) का उपयोग करके `memory/YYYY-MM-DD.md` से शॉर्ट-टर्म कैंडिडेट रैंक करता है।
- मेमोरी रिकॉल और डेली-इंजेशन पास, दोनों से शॉर्ट-टर्म संकेतों का उपयोग करता है, साथ ही लाइट/REM चरण रीइन्फोर्समेंट संकेत भी।
- जब Dreaming सक्षम होता है, तो `memory-core` एक Cron जॉब अपने-आप प्रबंधित करता है जो बैकग्राउंड में पूरा स्वीप (`light -> REM -> deep`) चलाता है (मैनुअल `openclaw cron add` आवश्यक नहीं)।
- `--agent <id>`: दायरा किसी एक एजेंट तक सीमित करें (डिफॉल्ट: डिफॉल्ट एजेंट)।
- `--limit <n>`: लौटाने/लागू करने के लिए अधिकतम कैंडिडेट।
- `--min-score <n>`: न्यूनतम भारित प्रमोशन स्कोर।
- `--min-recall-count <n>`: किसी कैंडिडेट के लिए आवश्यक न्यूनतम रिकॉल काउंट।
- `--min-unique-queries <n>`: किसी कैंडिडेट के लिए आवश्यक न्यूनतम विशिष्ट क्वेरी काउंट।
- `--apply`: चुने गए कैंडिडेट को `MEMORY.md` में जोड़ें और उन्हें प्रमोटेड चिह्नित करें।
- `--include-promoted`: आउटपुट में पहले से प्रमोट किए गए कैंडिडेट शामिल करें।
- `--json`: JSON आउटपुट प्रिंट करें।

`memory promote-explain`:

किसी विशिष्ट प्रमोशन कैंडिडेट और उसके स्कोर ब्रेकडाउन को समझाएं।

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: देखने के लिए कैंडिडेट कुंजी, पाथ फ्रैगमेंट, या स्निपेट फ्रैगमेंट।
- `--agent <id>`: दायरा किसी एक एजेंट तक सीमित करें (डिफॉल्ट: डिफॉल्ट एजेंट)।
- `--include-promoted`: पहले से प्रमोट किए गए कैंडिडेट शामिल करें।
- `--json`: JSON आउटपुट प्रिंट करें।

`memory rem-harness`:

कुछ भी लिखे बिना REM रिफ्लेक्शन, कैंडिडेट सत्य, और डीप प्रमोशन आउटपुट का पूर्वावलोकन करें।

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: दायरा किसी एक एजेंट तक सीमित करें (डिफॉल्ट: डिफॉल्ट एजेंट)।
- `--include-promoted`: पहले से प्रमोट किए गए डीप कैंडिडेट शामिल करें।
- `--json`: JSON आउटपुट प्रिंट करें।

## Dreaming

Dreaming तीन सहयोगी चरणों वाला बैकग्राउंड मेमोरी कंसॉलिडेशन सिस्टम है:
**light** (शॉर्ट-टर्म सामग्री को सॉर्ट/स्टेज करना), **deep** (टिकाऊ
तथ्यों को `MEMORY.md` में प्रमोट करना), और **REM** (विचार करना और थीम सतह पर लाना)।

- `plugins.entries.memory-core.config.dreaming.enabled: true` से सक्षम करें।
- चैट से `/dreaming on|off` के साथ टॉगल करें (या `/dreaming status` से जांचें)।
  सेटिंग बदलने के लिए चैनल कॉलर मालिक होने चाहिए; Gateway क्लाइंट को
  `operator.admin` चाहिए। केवल-पढ़ने वाली स्थिति और सहायता अधिकृत
  कमांड भेजने वालों के लिए उपलब्ध रहती हैं।
- Dreaming एक प्रबंधित स्वीप शेड्यूल (`dreaming.frequency`) पर चलता है और चरणों को क्रम में निष्पादित करता है: light, REM, deep।
- केवल deep चरण टिकाऊ मेमोरी को `MEMORY.md` में लिखता है।
- मानव-पठनीय चरण आउटपुट और डायरी एंट्री `DREAMS.md` (या मौजूदा `dreams.md`) में लिखी जाती हैं, वैकल्पिक प्रति-चरण रिपोर्ट `memory/dreaming/<phase>/YYYY-MM-DD.md` में होती हैं।
- रैंकिंग भारित संकेतों का उपयोग करती है: रिकॉल फ्रीक्वेंसी, रिट्रीवल प्रासंगिकता, क्वेरी विविधता, समयगत हालियापन, क्रॉस-डे कंसॉलिडेशन, और व्युत्पन्न कॉन्सेप्ट समृद्धि।
- प्रमोशन `MEMORY.md` में लिखने से पहले लाइव डेली नोट को फिर से पढ़ता है, इसलिए संपादित या हटाए गए शॉर्ट-टर्म स्निपेट पुराने रिकॉल-स्टोर स्नैपशॉट से प्रमोट नहीं होते।
- शेड्यूल किए गए और मैनुअल `memory promote` रन वही deep चरण डिफॉल्ट साझा करते हैं, जब तक कि आप CLI थ्रेशोल्ड ओवरराइड पास नहीं करते।
- ऑटोमैटिक रन कॉन्फिगर किए गए मेमोरी वर्कस्पेस में फैलते हैं।

डिफॉल्ट शेड्यूलिंग:

- **स्वीप कैडेंस**: `dreaming.frequency = 0 3 * * *`
- **डीप थ्रेशोल्ड**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

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

- `memory index --verbose` प्रति-चरण विवरण (प्रोवाइडर, मॉडल, स्रोत, बैच गतिविधि) प्रिंट करता है।
- `memory status` `memorySearch.extraPaths` के जरिए कॉन्फिगर किए गए किसी भी अतिरिक्त पाथ को शामिल करता है।
- यदि प्रभावी Active Memory रिमोट API कुंजी फ़ील्ड SecretRefs के रूप में कॉन्फिगर हैं, तो कमांड सक्रिय Gateway स्नैपशॉट से उन मानों को रिज़ॉल्व करता है। यदि Gateway अनुपलब्ध है, तो कमांड तुरंत विफल हो जाता है।
- Gateway संस्करण असंगति नोट: इस कमांड पाथ को ऐसे Gateway की आवश्यकता है जो `secrets.resolve` का समर्थन करता हो; पुराने Gateway अज्ञात-मेथड त्रुटि लौटाते हैं।
- शेड्यूल किए गए स्वीप कैडेंस को `dreaming.frequency` से ट्यून करें। डीप प्रमोशन नीति अन्यथा आंतरिक है, सिवाय `dreaming.phases.deep.maxPromotedSnippetTokens` के, जो प्रोवेनेंस दिखाई रखते हुए प्रमोटेड स्निपेट लंबाई सीमित करता है। जब आपको एक-बार के मैनुअल थ्रेशोल्ड ओवरराइड चाहिए हों, तो `memory promote` पर CLI फ्लैग का उपयोग करें।
- `memory rem-harness --path <file-or-dir> --grounded` कुछ भी लिखे बिना ऐतिहासिक डेली नोट्स से ग्राउंडेड `What Happened`, `Reflections`, और `Possible Lasting Updates` का पूर्वावलोकन करता है।
- `memory rem-backfill --path <file-or-dir>` UI समीक्षा के लिए `DREAMS.md` में रिवर्सिबल ग्राउंडेड डायरी एंट्री लिखता है।
- `memory rem-backfill --path <file-or-dir> --stage-short-term` लाइव शॉर्ट-टर्म प्रमोशन स्टोर में ग्राउंडेड टिकाऊ कैंडिडेट भी सीड करता है ताकि सामान्य deep चरण उन्हें रैंक कर सके।
- `memory rem-backfill --rollback` पहले लिखी गई ग्राउंडेड डायरी एंट्री हटाता है, और `memory rem-backfill --rollback-short-term` पहले स्टेज किए गए ग्राउंडेड शॉर्ट-टर्म कैंडिडेट हटाता है।
- पूर्ण चरण विवरण और कॉन्फिगरेशन संदर्भ के लिए [Dreaming](/hi/concepts/dreaming) देखें।

## संबंधित

- [CLI संदर्भ](/hi/cli)
- [मेमोरी अवलोकन](/hi/concepts/memory)
