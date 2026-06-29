---
read_when:
    - आपको वैश्विक लॉगिंग स्तर बढ़ाए बिना लक्षित डिबग लॉग चाहिए
    - सहायता के लिए आपको उपप्रणाली-विशिष्ट लॉग कैप्चर करने होंगे
summary: लक्षित डीबग लॉग के लिए डायग्नोस्टिक्स फ़्लैग
title: डायग्नोस्टिक्स फ़्लैग
x-i18n:
    generated_at: "2026-06-28T23:05:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c78c5c2f90fb1d601d0a3ef94919310759d58c9f9c70a093c91f31594bc777fb
    source_path: diagnostics/flags.md
    workflow: 16
---

डायग्नोस्टिक्स फ़्लैग आपको हर जगह वर्बोज़ लॉगिंग चालू किए बिना लक्षित डीबग लॉग सक्षम करने देते हैं। फ़्लैग ऑप्ट-इन हैं और तब तक कोई प्रभाव नहीं डालते जब तक कोई सबसिस्टम उन्हें जांचता नहीं है।

## यह कैसे काम करता है

- फ़्लैग स्ट्रिंग होते हैं (केस-असंवेदनशील)।
- आप फ़्लैग को कॉन्फ़िग में या env ओवरराइड के ज़रिए सक्षम कर सकते हैं।
- वाइल्डकार्ड समर्थित हैं:
  - `telegram.*` `telegram.http` से मेल खाता है
  - `*` सभी फ़्लैग सक्षम करता है

## कॉन्फ़िग के ज़रिए सक्षम करें

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

कई फ़्लैग:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "brave.http", "gateway.*"]
  }
}
```

फ़्लैग बदलने के बाद Gateway को पुनरारंभ करें।

## Env ओवरराइड (एक बार के लिए)

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

सभी फ़्लैग अक्षम करें:

```bash
OPENCLAW_DIAGNOSTICS=0
```

`OPENCLAW_DIAGNOSTICS=0` एक प्रक्रिया-स्तरीय अक्षम ओवरराइड है: यह उस
प्रक्रिया के लिए env और कॉन्फ़िग, दोनों से आने वाले फ़्लैग अक्षम करता है।

## प्रोफाइलिंग फ़्लैग

प्रोफाइलर फ़्लैग वैश्विक लॉगिंग स्तर बढ़ाए बिना लक्षित टाइमिंग स्पैन सक्षम
करते हैं। वे डिफ़ॉल्ट रूप से अक्षम होते हैं।

एक Gateway रन के लिए सभी प्रोफाइलर-गेटेड स्पैन सक्षम करें:

```bash
OPENCLAW_DIAGNOSTICS=profiler openclaw gateway run
```

केवल reply-dispatch प्रोफाइलर स्पैन सक्षम करें:

```bash
OPENCLAW_DIAGNOSTICS=reply.profiler openclaw gateway run
```

केवल Codex ऐप-सर्वर स्टार्टअप/टूल/थ्रेड प्रोफाइलर स्पैन सक्षम करें:

```bash
OPENCLAW_DIAGNOSTICS=codex.profiler openclaw gateway run
```

कॉन्फ़िग से प्रोफाइलर फ़्लैग सक्षम करें:

```json
{
  "diagnostics": {
    "flags": ["reply.profiler", "codex.profiler"]
  }
}
```

कॉन्फ़िग फ़्लैग बदलने के बाद Gateway को पुनरारंभ करें। किसी प्रोफाइलर फ़्लैग
को अक्षम करने के लिए, उसे `diagnostics.flags` से हटाएं और पुनरारंभ करें।
जब कॉन्फ़िग प्रोफाइलर फ़्लैग सक्षम करता हो तब भी हर डायग्नोस्टिक्स फ़्लैग को
अस्थायी रूप से अक्षम करने के लिए, प्रक्रिया को इसके साथ शुरू करें:

```bash
OPENCLAW_DIAGNOSTICS=0 openclaw gateway run
```

## टाइमलाइन आर्टिफ़ैक्ट

`timeline` फ़्लैग बाहरी QA हार्नेस के लिए संरचित स्टार्टअप और रनटाइम टाइमिंग
इवेंट लिखता है:

```bash
OPENCLAW_DIAGNOSTICS=timeline \
OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=/tmp/openclaw-timeline.jsonl \
openclaw gateway run
```

आप इसे कॉन्फ़िग में भी सक्षम कर सकते हैं:

```json
{
  "diagnostics": {
    "flags": ["timeline"]
  }
}
```

टाइमलाइन फ़ाइल पथ अब भी
`OPENCLAW_DIAGNOSTICS_TIMELINE_PATH` से आता है। जब `timeline` केवल
कॉन्फ़िग से सक्षम होता है, तो सबसे शुरुआती कॉन्फ़िग-लोडिंग स्पैन उत्सर्जित
नहीं होते क्योंकि OpenClaw ने अभी तक कॉन्फ़िग नहीं पढ़ा होता; बाद के स्टार्टअप
स्पैन कॉन्फ़िग फ़्लैग का उपयोग करते हैं।

`OPENCLAW_DIAGNOSTICS=1`, `OPENCLAW_DIAGNOSTICS=all`, और
`OPENCLAW_DIAGNOSTICS=*` भी टाइमलाइन सक्षम करते हैं क्योंकि वे हर
डायग्नोस्टिक्स फ़्लैग सक्षम करते हैं। जब आपको केवल JSONL टाइमिंग आर्टिफ़ैक्ट
चाहिए हो, तो `timeline` को प्राथमिकता दें।

टाइमलाइन रिकॉर्ड `openclaw.diagnostics.v1` एनवेलप का उपयोग करते हैं। इवेंट में
प्रोसेस आईडी, चरण नाम, स्पैन नाम, अवधि, Plugin आईडी, निर्भरता की गिनती,
इवेंट-लूप विलंब नमूने, प्रोवाइडर ऑपरेशन नाम, चाइल्ड-प्रोसेस एग्ज़िट स्थिति,
और स्टार्टअप त्रुटि नाम/संदेश शामिल हो सकते हैं। टाइमलाइन फ़ाइलों को स्थानीय
डायग्नोस्टिक्स आर्टिफ़ैक्ट मानें; उन्हें अपनी मशीन के बाहर साझा करने से पहले
समीक्षा करें।

## लॉग कहां जाते हैं

फ़्लैग मानक डायग्नोस्टिक्स लॉग फ़ाइल में लॉग उत्सर्जित करते हैं। डिफ़ॉल्ट रूप से:

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

यदि आप `logging.file` सेट करते हैं, तो उसके बजाय उस पथ का उपयोग करें। लॉग JSONL
होते हैं (हर पंक्ति में एक JSON ऑब्जेक्ट)। `logging.redactSensitive` के आधार पर
रेडैक्शन अब भी लागू होता है।

## लॉग निकालें

नवीनतम लॉग फ़ाइल चुनें:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Telegram HTTP डायग्नोस्टिक्स के लिए फ़िल्टर करें:

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Brave Search HTTP डायग्नोस्टिक्स के लिए फ़िल्टर करें:

```bash
rg "brave http" /tmp/openclaw/openclaw-*.log
```

या पुनरुत्पादन करते समय tail करें:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

रिमोट Gateway के लिए, आप `openclaw logs --follow` का भी उपयोग कर सकते हैं
([/cli/logs](/hi/cli/logs) देखें)।

## नोट्स

- यदि `logging.level` `warn` से ऊंचा सेट है, तो ये लॉग दब सकते हैं। डिफ़ॉल्ट `info` ठीक है।
- `brave.http` Brave Search अनुरोध URL/क्वेरी पैराम, प्रतिक्रिया स्थिति/टाइमिंग, और कैश hit/miss/write इवेंट लॉग करता है। यह API कुंजियां या प्रतिक्रिया बॉडी लॉग नहीं करता, लेकिन खोज क्वेरी संवेदनशील हो सकती हैं।
- फ़्लैग सक्षम छोड़ना सुरक्षित है; वे केवल विशिष्ट सबसिस्टम के लिए लॉग वॉल्यूम को प्रभावित करते हैं।
- लॉग गंतव्य, स्तर, और रेडैक्शन बदलने के लिए [/logging](/hi/logging) का उपयोग करें।

## संबंधित

- [Gateway डायग्नोस्टिक्स](/hi/gateway/diagnostics)
- [Gateway समस्या निवारण](/hi/gateway/troubleshooting)
