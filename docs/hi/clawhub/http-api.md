---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डिबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI endpoints + auth).
x-i18n:
    generated_at: "2026-07-05T06:13:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

आधार URL: `https://clawhub.ai` (डिफ़ॉल्ट).

सभी v1 पाथ `/api/v1/...` के अंतर्गत हैं।
लीगेसी `/api/...` और `/api/cli/...` संगतता के लिए बने हुए हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`.

## सार्वजनिक कैटलॉग पुनः उपयोग

तृतीय-पक्ष डायरेक्टरी ClawHub Skills को सूचीबद्ध करने या खोजने के लिए सार्वजनिक रीड एंडपॉइंट का उपयोग कर सकती हैं। कृपया परिणामों को कैश करें, `429`/`Retry-After` का पालन करें, उपयोगकर्ताओं को कैननिकल ClawHub लिस्टिंग (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और यह संकेत देने से बचें कि ClawHub तृतीय-पक्ष साइट का समर्थन करता है। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन-रोकी गई सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट को रूट प्राथमिकता फिर से बनाने के बजाय रीड एंडपॉइंट द्वारा लौटाए गए कैननिकल URL का उपयोग करना चाहिए।

## दर सीमाएँ

प्रवर्तन मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (वैध Bearer टोकन): प्रति उपयोगकर्ता बकेट लागू।
- यदि टोकन अनुपस्थित/अमान्य है, तो व्यवहार IP प्रवर्तन पर वापस चला जाता है।
- प्रमाणित राइट एंडपॉइंट को तब केवल `Unauthorized` नहीं लौटाना चाहिए जब सर्वर कारण जानता हो। अनुपस्थित टोकन, अमान्य/रद्द टोकन, और हटाए/प्रतिबंधित/अक्षम खाते, प्रत्येक को कार्रवाई योग्य पाठ मिलना चाहिए ताकि CLI क्लाइंट उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- रीड: प्रति IP 3000/मिनट, प्रति कुंजी 12000/मिनट
- राइट: प्रति IP 300/मिनट, प्रति कुंजी 3000/मिनट
- डाउनलोड: प्रति IP 1200/मिनट, प्रति कुंजी 6000/मिनट (डाउनलोड एंडपॉइंट)

हेडर:

- लीगेसी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

हेडर अर्थ:

- `X-RateLimit-Reset`: निरपेक्ष Unix epoch सेकंड
- `RateLimit-Reset`: रीसेट तक सेकंड (विलंब)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर सटीक शेष बजट।
  शार्ड किए गए सफल अनुरोध अनुमानित वैश्विक मान लौटाने के बजाय इस हेडर को छोड़ देते हैं।
- `Retry-After`: `429` पर पुनः प्रयास से पहले प्रतीक्षा करने के सेकंड (विलंब)

उदाहरण `429` प्रतिक्रिया:

```http
HTTP/2 429
content-type: text/plain; charset=utf-8
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34

Rate limit exceeded
```

क्लाइंट मार्गदर्शन:

- यदि `Retry-After` मौजूद है, तो पुनः प्रयास से पहले उतने सेकंड प्रतीक्षा करें।
- समकालिक पुनः प्रयासों से बचने के लिए जिटरयुक्त बैकऑफ़ का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` पर वापस जाएँ (या `X-RateLimit-Reset` से गणना करें)।

IP स्रोत:

- विश्वसनीय क्लाइंट IP हेडर, जिनमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब डिप्लॉयमेंट विश्वसनीय फ़ॉरवर्डेड हेडर को स्पष्ट रूप से सक्षम करता है।
- ClawHub एज पर क्लाइंट IP की पहचान करने के लिए विश्वसनीय फ़ॉरवर्डिंग हेडर का उपयोग करता है।
- यदि कोई विश्वसनीय क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध केवल दर-सीमा प्रकार से स्कोप किए गए फ़ॉलबैक बकेट का उपयोग करते हैं। इन फ़ॉलबैक बकेट में कॉलर-प्रदत्त पाथ, स्लग, पैकेज नाम, संस्करण, क्वेरी स्ट्रिंग, या अन्य आर्टिफ़ैक्ट पैरामीटर शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएँ

सार्वजनिक v1 त्रुटि प्रतिक्रियाएँ `content-type: text/plain; charset=utf-8` के साथ सादा पाठ हैं।
इसमें सत्यापन विफलताएँ (`400`), अनुपस्थित सार्वजनिक संसाधन (`404`), प्रमाणीकरण और अनुमति विफलताएँ (`401`/`403`), दर सीमाएँ (`429`), और रोके गए डाउनलोड शामिल हैं। क्लाइंट को प्रतिक्रिया बॉडी को मानव-पठनीय स्ट्रिंग के रूप में पढ़ना चाहिए। अज्ञात क्वेरी पैरामीटर संगतता के लिए अनदेखे किए जाते हैं, लेकिन अमान्य मान वाले पहचाने गए क्वेरी पैरामीटर `400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट (प्रमाणीकरण नहीं)

### `GET /api/v1/search`

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक
- `highlightedOnly` (वैकल्पिक): हाइलाइट किए गए Skills तक फ़िल्टर करने के लिए `true`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए लीगेसी उपनाम

प्रतिक्रिया:

```json
{
  "results": [
    {
      "score": 0.123,
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "version": "1.2.3",
      "updatedAt": 1730000000000,
      "ownerHandle": "openclaw",
      "owner": {
        "handle": "openclaw",
        "displayName": "OpenClaw",
        "image": "https://example.com/avatar.png"
      }
    }
  ]
}
```

नोट:

- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं (एम्बेडिंग समानता + सटीक स्लग/नाम टोकन बूस्ट + छोटा लोकप्रियता पूर्व संकेत)।
- प्रासंगिकता लोकप्रियता से अधिक मजबूत है। सटीक स्लग या डिस्प्ले-नाम टोकन मिलान, कहीं अधिक एंगेजमेंट वाले ढीले मिलान से ऊपर रैंक कर सकता है।
- ASCII पाठ शब्द और विराम-चिह्न सीमाओं पर टोकनाइज़ किया जाता है। उदाहरण के लिए, `personal-map` में एक स्वतंत्र `map` टोकन होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` होते हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में अधिक मजबूत लेक्सिकल मिलान मिलता है।
- लोकप्रियता लॉग-स्केल की जाती है और सीमित होती है। उच्च-एंगेजमेंट Skills कम रैंक कर सकते हैं जब क्वेरी पाठ का मिलान कमजोर हो।
- संदिग्ध या छिपी मॉडरेशन स्थिति, कॉलर फ़िल्टर और वर्तमान मॉडरेशन स्थिति के आधार पर किसी Skill को सार्वजनिक खोज से हटा सकती है।

प्रकाशक खोजयोग्यता मार्गदर्शन:

- डिस्प्ले नाम, सारांश, और टैग में वे शब्द रखें जिन्हें उपयोगकर्ता सचमुच खोजेंगे। स्वतंत्र स्लग टोकन का उपयोग केवल तब करें जब वह एक स्थिर पहचान भी हो जिसे आप बनाए रखना चाहते हैं।
- केवल किसी एक क्वेरी का पीछा करने के लिए स्लग का नाम न बदलें, जब तक नया स्लग बेहतर दीर्घकालिक कैननिकल नाम न हो। पुराने स्लग रीडायरेक्ट उपनाम बन जाते हैं, लेकिन कैननिकल URL, प्रदर्शित स्लग, और भविष्य के खोज डाइजेस्ट नए स्लग का उपयोग करते हैं।
- नाम-बदले उपनाम पुराने URL और रजिस्ट्री के माध्यम से रिज़ॉल्व होने वाले इंस्टॉल के लिए रिज़ॉल्यूशन बनाए रखते हैं, लेकिन खोज रैंकिंग नाम बदलने के इंडेक्स होने के बाद कैननिकल Skill मेटाडेटा पर आधारित होती है। मौजूदा आँकड़े Skill के साथ रहते हैं।
- यदि कोई Skill अप्रत्याशित रूप से अदृश्य है, तो रैंकिंग-संबंधित मेटाडेटा बदलने से पहले लॉग इन रहते हुए `clawhub inspect @owner/slug` से पहले मॉडरेशन स्थिति जाँचें।

### `GET /api/v1/skills`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–200)
- `cursor` (वैकल्पिक): किसी भी गैर-`trending` सॉर्ट के लिए पेजिनेशन कर्सर
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended` (उपनाम: `default`), `createdAt` (उपनाम: `newest`), `downloads`, `stars` (उपनाम: `rating`), लीगेसी इंस्टॉल उपनाम `installsCurrent`/`installs`/`installsAllTime` `downloads` पर मैप होते हैं, `trending`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए लीगेसी उपनाम

अमान्य `sort` मान `400` लौटाते हैं।

नोट:

- `recommended` एंगेजमेंट और हालियापन संकेतों का उपयोग करता है।
- `trending` पिछले 7 दिनों के इंस्टॉल के आधार पर रैंक करता है (टेलीमेट्री-आधारित)।
- `createdAt` नए-Skill क्रॉल के लिए स्थिर है; `updated` तब बदलता है जब मौजूदा Skills पुनः प्रकाशित किए जाते हैं।
- जब `nonSuspiciousOnly=true` हो, तो कर्सर-आधारित सॉर्ट किसी पेज पर `limit` से कम आइटम लौटा सकते हैं क्योंकि संदिग्ध Skills पेज प्राप्ति के बाद फ़िल्टर किए जाते हैं।
- मौजूद होने पर पेजिनेशन जारी रखने के लिए `nextCursor` का उपयोग करें। छोटा पेज अपने आप में परिणामों के अंत का संकेत नहीं देता।

प्रतिक्रिया:

```json
{
  "items": [
    {
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "summary": "…",
      "topics": ["Productivity"],
      "tags": { "latest": "1.2.3" },
      "stats": {},
      "createdAt": 0,
      "updatedAt": 0,
      "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
      "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] }
    }
  ],
  "nextCursor": null
}
```

### `GET /api/v1/skills/{slug}`

प्रतिक्रिया:

```json
{
  "skill": {
    "slug": "gifgrep",
    "displayName": "GifGrep",
    "summary": "…",
    "topics": ["Productivity"],
    "tags": { "latest": "1.2.3" },
    "stats": {},
    "createdAt": 0,
    "updatedAt": 0
  },
  "latestVersion": { "version": "1.2.3", "createdAt": 0, "changelog": "…" },
  "metadata": { "os": ["macos"], "systems": ["aarch64-darwin"] },
  "owner": { "handle": "steipete", "displayName": "Peter", "image": null },
  "moderation": {
    "isSuspicious": false,
    "isMalwareBlocked": false,
    "verdict": "clean",
    "reasonCodes": [],
    "summary": null,
    "engineVersion": "v2.0.0",
    "updatedAt": 0
  }
}
```

नोट:

- मालिक नाम-बदलाव/मर्ज फ़्लो द्वारा बनाए गए पुराने स्लग कैननिकल Skill पर रिज़ॉल्व होते हैं।
- `metadata.os`: Skill frontmatter में घोषित OS प्रतिबंध (जैसे `["macos"]`, `["linux"]`)। घोषित नहीं होने पर `null`।
- `metadata.systems`: Nix सिस्टम लक्ष्य (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित नहीं होने पर `null`।
- यदि Skill में कोई प्लेटफ़ॉर्म मेटाडेटा नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब Skill फ़्लैग किया गया हो या मालिक उसे देख रहा हो।

### `GET /api/v1/skills/{slug}/moderation`

संरचित मॉडरेशन स्थिति लौटाता है।

प्रतिक्रिया:

```json
{
  "moderation": {
    "isSuspicious": true,
    "isMalwareBlocked": false,
    "verdict": "suspicious",
    "reasonCodes": ["suspicious.dynamic_code_execution"],
    "summary": "Detected: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "Dynamic code execution detected.",
        "evidence": ""
      }
    ]
  }
}
```

नोट:

- मालिक और मॉडरेटर छिपे हुए Skills के लिए मॉडरेशन विवरण तक पहुँच सकते हैं।
- सार्वजनिक कॉलर केवल पहले से फ़्लैग किए गए दृश्यमान Skills के लिए `200` प्राप्त करते हैं।
- सार्वजनिक कॉलर के लिए साक्ष्य रिडैक्ट किया जाता है और केवल मालिकों/मॉडरेटर के लिए कच्चे स्निपेट शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

मॉडरेटर समीक्षा के लिए किसी Skill की रिपोर्ट करें। रिपोर्ट Skill-स्तर की होती हैं, वैकल्पिक रूप से किसी संस्करण से लिंक होती हैं, और Skill रिपोर्ट कतार में जाती हैं।

प्रमाणीकरण:

- API टोकन आवश्यक है।

अनुरोध:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

प्रतिक्रिया:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "reportId": "skillReports:...",
  "skillId": "skills:...",
  "reportCount": 1
}
```

### `GET /api/v1/skills/-/reports`

Skill रिपोर्ट ग्रहण के लिए मॉडरेटर/एडमिन एंडपॉइंट।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-200)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

प्रतिक्रिया:

```json
{
  "items": [
    {
      "reportId": "skillReports:...",
      "skillId": "skills:...",
      "skillVersionId": "skillVersions:...",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "version": "1.2.3",
      "reason": "Suspicious install step",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/skills/-/reports/{reportId}/triage`

Skill रिपोर्ट हल करने या फिर से खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

अनुरोध:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट योग्य वर्कफ़्लो में Skill छिपाने के लिए ट्रायेज की गई रिपोर्ट के साथ `finalAction: "hide"` पास करें।

### `GET /api/v1/skills/{slug}/versions`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

### `GET /api/v1/skills/{slug}/versions/{version}`

संस्करण मेटाडेटा + फ़ाइलों की सूची लौटाता है।

- `version.security` उपलब्ध होने पर सामान्यीकृत स्कैन सत्यापन स्थिति और स्कैनर विवरण (VirusTotal + LLM) शामिल करता है।

### `GET /api/v1/skills/{slug}/scan`

किसी Skill संस्करण के लिए सुरक्षा स्कैन सत्यापन विवरण लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किए गए संस्करण को रिज़ॉल्व करें (उदाहरण के लिए `latest`)।

नोट:

- यदि न तो `version` और न ही `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति के साथ scanner-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी scanner ने निश्चित verdict (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से लिया गया वर्तमान skill-स्तरीय moderation snapshot है।
- किसी ऐतिहासिक संस्करण को query करते समय, `moderation` और `security` को समान संस्करण context मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नए ClawScan jobs के लिए प्रमाणीकृत submit endpoint।

स्थानीय upload scans अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले requests `410` लौटाते हैं।

प्रकाशित scans JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- Scan request payloads और डाउनलोड किए जा सकने वाले reports retention window के बाद scan-request store से expire हो जाते हैं।
- प्रकाशित scans के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- प्रकाशित scans केवल तब write back करते हैं जब `update: true` हो और scan सफलतापूर्वक पूरा हो।
- Response `202` होता है, `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` के साथ।
- Scan jobs asynchronous होते हैं। Manual scan requests को सामान्य publish/backfill work से पहले प्राथमिकता दी जाती है, लेकिन completion अब भी worker availability पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए scan के लिए प्रमाणीकृत poll endpoint।

- queued/running/succeeded/failed status लौटाता है।
- queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है ताकि clients दिखा सकें कि request से आगे कितने prioritized manual scans हैं। बहुत बड़ी queues bounded होती हैं और `queuedAheadIsEstimate: true` के साथ report की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` sections होते हैं।
- Failed scan jobs `lastError` के साथ `status: "failed"` लौटाते हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणीकृत report archive endpoint।

- सफल scan आवश्यक है; non-terminal scans `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए versions के लिए प्रमाणीकृत stored report archive endpoint।

- skill या plugin के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- exact submitted version के लिए stored scan results लौटाता है, जिनमें blocked या hidden versions भी शामिल हैं।
- `kind` default रूप से `skill` है; plugin/package scans के लिए `kind=plugin` का उपयोग करें।
- scan-request downloads जैसी ही ZIP shape लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

केवल admin के लिए canonical batch rescan route। यह legacy `POST /api/v1/skills/-/rescan-batch` जैसी ही payload shape स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

केवल admin के लिए canonical batch status route। यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate counters लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला Skill Card verification envelope लौटाता है।

Query params:

- `version` (वैकल्पिक): विशिष्ट version string।
- `tag` (वैकल्पिक): tagged version resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब चुने गए version में generated Skill Card हो, वह moderation द्वारा malware-blocked न हो, और ClawScan verification clean हो।
- Skill identity, publisher identity, और selected version metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि shell automation nested wrappers unpack किए बिना उन्हें पढ़ सके।
- `security` top-level ClawScan/security verdict है। Automation को `ok`, `decision`, `reasons`, और `security.status` पर key off करना चाहिए।
- `security.signals` में `staticScan`, `virusTotal`, और `skillSpector` जैसे supporting scanner evidence होते हैं।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve करके store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

Exact skill versions के लिए वर्तमान compact security verdicts लौटाता है। यह
collection endpoint उन clients के लिए है जो पहले से जानते हैं कि उन्हें कौन से installed
ClawHub skill versions display करने हैं, जैसे OpenClaw Control UI।

Request:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

नोट्स:

- `items` में 1-100 unique `{ slug, version }` pairs होने चाहिए।
- Results प्रति item होते हैं; एक missing skill या version पूरे response को fail नहीं करता।
- Response केवल security-only है। इसमें Skill Card data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं होते।
- `security.signals` में केवल status-level supporting evidence होता है; full scanner details के लिए `/scan` या ClawHub security-audit page का उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; clients को card content की आवश्यकता होने पर installed `skill-card.md` locally पढ़ना चाहिए।
- Single-skill Skill Card verification envelope की आवश्यकता होने पर `/verify`, generated card markdown की आवश्यकता होने पर `/card`, और detailed scanner data की आवश्यकता होने पर `/scan` का उपयोग करें।

Response:

```json
{
  "schema": "clawhub.skill.security-verdicts.v1",
  "items": [
    {
      "ok": true,
      "decision": "pass",
      "reasons": [],
      "requestedSlug": "gifgrep",
      "slug": "gifgrep",
      "displayName": "GifGrep",
      "publisherHandle": "steipete",
      "publisherDisplayName": "Peter",
      "requestedVersion": "1.2.3",
      "version": "1.2.3",
      "createdAt": 0,
      "checkedAt": 0,
      "skillUrl": "https://clawhub.ai/steipete/skills/gifgrep",
      "securityAuditUrl": "https://clawhub.ai/steipete/skills/gifgrep/security-audit?version=1.2.3",
      "security": {
        "status": "clean",
        "passed": true,
        "signals": {
          "staticScan": { "status": "clean", "reasonCodes": [] },
          "virusTotal": null,
          "skillSpector": null,
          "dependencyRegistry": null
        }
      }
    },
    {
      "ok": false,
      "decision": "fail",
      "reasons": ["version.not_found"],
      "requestedSlug": "missing-version",
      "requestedVersion": "1.0.0",
      "error": { "code": "version_not_found", "message": "Version not found" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

कच्ची टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- नवीनतम संस्करण पर डिफ़ॉल्ट करता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग endpoint:

- skills
- code plugins
- bundle plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, legacy alias `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin packages (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले package endpoints) तक सीमित हो। नियंत्रित श्रेणियां और
  legacy v1 filter aliases `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखा कर दिए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` fixed-family aliases बने रहते हैं।
- Skill entries skill registry द्वारा समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अब भी केवल code-plugin और bundle-plugin releases के लिए है।
- गुमनाम कॉलर केवल सार्वजनिक package channels देखते हैं।
- प्रमाणित कॉलर list/search परिणामों में उन publishers के private packages देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें प्रमाणित कॉलर पढ़ सकता है।

### `GET /api/v1/packages/search`

skills + plugin packages में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin packages तक सीमित हो। नियंत्रित श्रेणियां और legacy v1
  filter aliases `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखा कर दिए जाते हैं।
- गुमनाम कॉलर केवल सार्वजनिक package channels देखते हैं।
- प्रमाणित कॉलर उन publishers के private packages खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें प्रमाणित कॉलर पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin packages में केवल Plugin कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, legacy alias `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

Legacy v1 filter aliases read endpoints पर स्वीकार किए जाते रहेंगे:

- `mcp-tooling`, `data`, और `automation` `tools` में resolve होते हैं।
- `observability` और `deployment` `gateway` में resolve होते हैं।
- `dev-tools` `runtime` में resolve होता है।

`trending` सात-दिन का install/download leaderboard है और all-time totals का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` endpoint पर यह केवल plugin के लिए है; skill कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

Legacy aliases संग्रहीत या लेखक-घोषित category values के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक skills का bulk export।

Auth:

- API token आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds lower bound।
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds upper bound।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले response से pagination cursor।

Response:

- Body: ZIP archive।
- प्रत्येक exported skill `{publisher}/{slug}/` पर rooted है।
- Hosted skills में latest stored version files शामिल होती हैं और
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ listed होती हैं।
- `clean` या `suspicious` scan वाली वर्तमान GitHub-backed skills में
  `_source_handoff.json` शामिल होता है जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। इनमें ClawHub-hosted source files शामिल नहीं होतीं।
- प्रत्येक skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP root पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब individual skills या files export नहीं किए जा सके।

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक plugin रिलीज़ का बल्क निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): plugin `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): plugin `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछली प्रतिक्रिया से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ दोनों
  plugin परिवार हैं।

प्रतिक्रिया:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यात किया गया plugin `{family}/{packageName}/` पर रूटेड होता है।
- प्रत्येक निर्यात किए गए plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट में शामिल होता है।
- जब अलग-अलग plugins या फ़ाइलें निर्यात नहीं की जा सकीं, तो `_errors.json` शामिल होता है।

हेडर:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

code-plugin और bundle-plugin पैकेजों में केवल-plugin खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

नोट्स:

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित legacy v1 फ़िल्टर aliases भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग plugin श्रेणी digest rows द्वारा समर्थित वास्तविक API फ़िल्टर है,
  search-query rewrite नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पेजिनेट नहीं होते।
- plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को पुनःक्रमित करते हैं,
  जो वर्तमान `/skills` ब्राउज़ व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट्स:

- Skills unified catalog में इस रूट के माध्यम से भी resolve हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को soft-delete करता है।

नोट्स:

- पैकेज owner, org publisher owner/admin, platform moderator, या platform admin के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

नोट्स:

- निजी पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

एक पैकेज संस्करण लौटाता है, जिसमें फ़ाइल मेटाडेटा, संगतता,
सत्यापन, artifact मेटाडेटा, और scan डेटा शामिल हैं।

नोट्स:

- `version.artifact.kind` पुराने-world पैकेज आर्काइव के लिए `legacy-zip` या
  ClawPack-backed रिलीज़ के लिए `npm-pack` है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने clients के लिए deprecated संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए ठीक ZIP bytes को hash करता है।
  आधुनिक clients को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  canonical रिलीज़ artifact की पहचान करता है।
- scan डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

install clients के लिए सटीक पैकेज रिलीज़ सुरक्षा और trust सारांश लौटाता है।
यह तय करने के लिए कि कोई resolved रिलीज़ install की जा सकती है या नहीं, यह सार्वजनिक OpenClaw consumption surface है।

प्रमाणीकरण:

- सार्वजनिक read endpoint। कोई owner, publisher, moderator, या admin token
  आवश्यक नहीं है।

प्रतिक्रिया:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin"
  },
  "release": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "artifactSha256": "0123456789abcdef...",
    "npmIntegrity": "sha512-...",
    "npmShasum": "0123456789abcdef0123456789abcdef01234567",
    "npmTarballName": "example-plugin-1.2.3.tgz",
    "createdAt": 1730000000000
  },
  "trust": {
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious"],
    "pending": false,
    "stale": false
  }
}
```

प्रतिक्रिया फ़ील्ड:

- `package.name`, `package.displayName`, और `package.family` resolved registry package की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt` उस सटीक release की पहचान करते हैं जिसका मूल्यांकन किया गया था।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` release artifact के लिए ज्ञात होने पर मौजूद होते हैं।
- `trust.scanStatus` scanner inputs और manual release moderation से निकली effective trust status है।
- `trust.moderationState` nullable है। कोई manual release moderation मौजूद न होने पर यह `null` होता है।
- `trust.blockedFromDownload` install block signal है। OpenClaw और अन्य
  install clients को, scanner या moderation फ़ील्ड से blocking rules को फिर से derive करने के बजाय,
  जब यह मान `true` हो तो installation block करना चाहिए।
- `trust.reasons` user-facing और audit explanation list है। Reason codes
  स्थिर, compact strings होते हैं जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक trust inputs अभी भी completion की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि trust summary outdated inputs से computed था और
  high-confidence allow decision से पहले refresh आवश्यक मानकर treat किया जाना चाहिए।

नोट्स:

- यह endpoint version-exact है। Clients को इसे उस package version को resolve करने के बाद call करना चाहिए जिसे वे install करना चाहते हैं, न कि केवल latest package metadata पढ़ने के बाद।
- निजी पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।
- यह endpoint owner/moderator moderation endpoints से जानबूझकर अधिक संकीर्ण है।
  यह install decision और public explanation को expose करता है, reporter identities,
  report bodies, private evidence, या internal review timelines को नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए explicit artifact resolver metadata लौटाता है।

नोट्स:

- Legacy package versions एक `legacy-zip` artifact और legacy ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack versions एक `npm-pack` artifact, npm integrity fields, एक
  `tarballUrl`, और legacy ZIP compatibility URL लौटाते हैं।
- यह OpenClaw resolver surface है; यह shared URL से archive format का अनुमान लगाने से बचाता है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

explicit resolver path के माध्यम से version artifact डाउनलोड करता है।

नोट्स:

- ClawPack versions exact uploaded npm-pack `.tgz` bytes stream करते हैं।
- Legacy ZIP versions `/api/v1/packages/{name}/download?version=` पर redirect करते हैं।
- download rate bucket का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw consumption के लिए computed readiness लौटाता है।

Readiness checks cover:

- official channel status
- latest version availability
- ClawPack npm-pack artifact availability
- artifact digest
- source repo and commit provenance
- OpenClaw compatibility metadata
- host targets
- scan state

प्रतिक्रिया:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack artifact",
      "status": "fail",
      "message": "Latest version is legacy ZIP-only."
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

आधिकारिक OpenClaw plugin migration rows को सूचीबद्ध करने के लिए Moderator endpoint।

प्रमाणीकरण:

- moderator या admin user के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `phase` (वैकल्पिक): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, या
  `all` (डिफ़ॉल्ट)।
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

प्रतिक्रिया:

```json
{
  "items": [
    {
      "migrationId": "officialPluginMigrations:...",
      "bundledPluginId": "core.search",
      "packageName": "@openclaw/search-plugin",
      "packageId": "packages:...",
      "owner": "platform",
      "sourceRepo": "openclaw/openclaw",
      "sourcePath": "plugins/search",
      "sourceCommit": "abc123",
      "phase": "blocked",
      "blockers": ["missing ClawPack"],
      "hostTargetsComplete": true,
      "scanClean": false,
      "moderationApproved": false,
      "runtimeBundlesReady": false,
      "notes": null,
      "createdAt": 1760000000000,
      "updatedAt": 1760000000000
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/migrations`

आधिकारिक plugin migration row बनाने या update करने के लिए Admin endpoint।

प्रमाणीकरण:

- admin user के लिए API टोकन आवश्यक है।

Request body:

```json
{
  "bundledPluginId": "core.search",
  "packageName": "@openclaw/search-plugin",
  "owner": "platform",
  "sourceRepo": "openclaw/openclaw",
  "sourcePath": "plugins/search",
  "sourceCommit": "abc123",
  "phase": "blocked",
  "blockers": ["missing ClawPack"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "waiting on publisher upload"
}
```

नोट्स:

- `bundledPluginId` lowercase में normalized होता है और stable upsert key है।
- `packageName` npm-name normalized है; planned migrations के लिए package missing हो सकता है।
- यह केवल migration readiness track करता है। यह OpenClaw को mutate नहीं करता या
  ClawPacks generate नहीं करता।

### `GET /api/v1/packages/moderation/queue`

package release review queues के लिए Moderator/admin endpoint।

प्रमाणीकरण:

- moderator या admin user के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

Status meanings:

- `open`: suspicious, malicious, pending, quarantined, revoked, or reported releases.
- `blocked`: quarantined, revoked, or malicious releases.
- `manual`: any release with a manual moderation override.
- `all`: any release with a manual override, non-clean scan state, or package report.

प्रतिक्रिया:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "manual review",
      "sourceRepo": "openclaw/example-plugin",
      "sourceCommit": "abc123",
      "reportCount": 2,
      "lastReportedAt": 1730000001000,
      "reasons": ["manual:quarantined", "scan:malicious", "reports:2"]
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `POST /api/v1/packages/{name}/report`

moderator review के लिए पैकेज report करें। Reports package-level हैं, वैकल्पिक रूप से
किसी version से linked हैं। वे moderation queue को feed करते हैं, लेकिन अपने आप
downloads को auto-hide या block नहीं करते; moderators को artifacts को
approve, quarantine, या revoke करने के लिए release moderation का उपयोग करना चाहिए।

प्रमाणीकरण:

- API टोकन आवश्यक है।

Request:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

Response:

```json
{
  "ok": true,
  "reported": true,
  "alreadyReported": false,
  "packageId": "packages:...",
  "releaseId": "packageReleases:...",
  "reportCount": 1
}
```

### `GET /api/v1/packages/reports`

मॉडरेटर/एडमिन endpoint पैकेज रिपोर्ट ग्रहण करने के लिए।

Auth:

- मॉडरेटर या एडमिन उपयोगकर्ता के लिए API token आवश्यक है।

Query params:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन cursor

Response:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "Example Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "Suspicious native binary",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "Reporter"
      },
      "triagedAt": null,
      "triagedBy": null,
      "triageNote": null
    }
  ],
  "nextCursor": null,
  "done": true
}
```

### `GET /api/v1/packages/{name}/moderation`

पैकेज मॉडरेशन दृश्यता के लिए मालिक/मॉडरेटर endpoint।

Auth:

- पैकेज मालिक, publisher सदस्य, मॉडरेटर, या एडमिन उपयोगकर्ता के लिए API token
  आवश्यक है।

Response:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "Example Plugin",
    "family": "code-plugin",
    "channel": "community",
    "isOfficial": false,
    "reportCount": 2,
    "lastReportedAt": 1730000001000,
    "scanStatus": "malicious"
  },
  "latestRelease": {
    "releaseId": "packageReleases:...",
    "version": "1.2.3",
    "artifactKind": "npm-pack",
    "scanStatus": "malicious",
    "moderationState": "quarantined",
    "moderationReason": "manual review",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

पैकेज रिपोर्ट हल करने या फिर से खोलने के लिए मॉडरेटर/एडमिन endpoint।

Request:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open` पर
सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट योग्य वर्कफ़्लो में रिलीज़ मॉडरेशन लागू करने के लिए पुष्टि की गई रिपोर्ट के साथ `finalAction: "quarantine"` या
`finalAction: "revoke"` पास करें।

Response:

```json
{
  "ok": true,
  "reportId": "packageReports:...",
  "packageId": "packages:...",
  "status": "confirmed",
  "reportCount": 0
}
```

### `POST /api/v1/packages/{name}/versions/{version}/moderation`

पैकेज रिलीज़ समीक्षा के लिए मॉडरेटर/एडमिन endpoint।

Request:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित अवस्थाएँ:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई।
- `quarantined`: आगे की कार्रवाई लंबित रहने तक ब्लॉक किया गया।
- `revoked`: किसी रिलीज़ को पहले भरोसेमंद माना गया था, उसके बाद ब्लॉक किया गया।

क्वारंटीन और रद्द की गई रिलीज़ artifact download routes से `403` लौटाती हैं।
हर बदलाव एक audit log entry लिखता है।

### `GET /api/v1/packages/{name}/file`

किसी पैकेज फ़ाइल की raw text content लौटाता है।

Query params:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- download bucket नहीं, read rate bucket का उपयोग करता है।
- Binary files `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal scans reads को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ फिर भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/download`

किसी पैकेज रिलीज़ के लिए legacy deterministic ZIP archive डाउनलोड करता है।

Query params:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- Skills `GET /api/v1/download` पर redirect करते हैं।
- Plugin/पैकेज archives zip files होते हैं जिनका root `package/` होता है, ताकि पुराने OpenClaw
  clients काम करते रहें।
- यह route केवल ZIP रहता है। यह ClawPack `.tgz` files stream नहीं करता।
- Responses में resolver integrity checks के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` headers शामिल होते हैं।
- Registry-only metadata डाउनलोड किए गए archive में inject नहीं किया जाता।
- लंबित VirusTotal scans downloads को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक caller मालिक न हो।

### `GET /api/npm/{package}`

ClawPack-backed package versions के लिए npm-compatible packument लौटाता है।

नोट्स:

- केवल uploaded ClawPack npm-pack tarballs वाले versions सूचीबद्ध होते हैं।
- Legacy ZIP-only versions जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-compatible
  fields का उपयोग करते हैं, ताकि उपयोगकर्ता चाहें तो npm को mirror की ओर point कर सकें।
- Scoped package packuments `/api/npm/@scope/name` और npm के
  encoded `/api/npm/@scope%2Fname` request path, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm mirror clients के लिए ठीक वही uploaded ClawPack tarball bytes stream करता है।

नोट्स:

- download rate bucket का उपयोग करता है।
- Download headers में ClawHub SHA-256 के साथ npm integrity/shasum metadata शामिल होता है।
- Moderation और private package access checks अब भी लागू होते हैं।

### `GET /api/v1/resolve`

CLI द्वारा local fingerprint को ज्ञात version से map करने के लिए उपयोग किया जाता है।

Query params:

- `slug` (आवश्यक)
- `hash` (आवश्यक): bundle fingerprint का 64-char hex sha256

Response:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

किसी hosted skill version ZIP को डाउनलोड करता है, या `clean` या `suspicious` scan वाले और hosted
version के बिना current GitHub-backed skill के लिए GitHub source handoff लौटाता है।

Query params:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver string
- `tag` (वैकल्पिक): tag name (जैसे `latest`)

नोट्स:

- यदि `version` और `tag` दोनों में से कोई भी नहीं दिया गया है, तो नवीनतम version उपयोग किया जाता है।
- Soft-deleted versions `410` लौटाते हैं।
- GitHub-backed skill handoffs bytes को proxy या mirror नहीं करते। JSON response में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; scan/current state एक gate है और success
  payload metadata के रूप में शामिल नहीं होती।
- Download stats प्रति UTC दिन unique identities के रूप में गिने जाते हैं (API token मान्य होने पर `userId`, अन्यथा IP)।

## Auth endpoints (Bearer token)

सभी endpoints को चाहिए:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Token को validate करता है और user handle लौटाता है।

### `POST /api/v1/skills`

नया version publish करता है।

- प्राथमिकता: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`।
- `files` (storageId-based) वाला JSON body भी स्वीकार किया जाता है।
- वैकल्पिक payload field: `ownerHandle`। मौजूद होने पर, API उस
  publisher को server-side resolve करता है और actor के पास publisher access होना आवश्यक करता है।
- वैकल्पिक payload field: `migrateOwner`। `ownerHandle` के साथ `true` होने पर, कोई
  मौजूदा skill उस owner के पास जा सकता है, यदि actor current और target publishers दोनों पर admin/owner है।
  इस opt-in के बिना, owner changes
  अस्वीकार किए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin release publish करता है।

- Bearer token auth आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत form fields हैं `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  tarball reference। `clawpack` एक `.tgz` blob या upload-url flow द्वारा लौटाया गया storage id हो सकता है।
  Staged storage-id publishes में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- `files` या `clawpack` में से किसी एक का उपयोग करें, एक ही request में दोनों कभी नहीं।
- JSON bodies और caller-supplied `payload.files` / `payload.artifact`
  metadata अस्वीकार किए जाते हैं।
- Direct multipart publish requests 18MB पर capped हैं। ClawPack tarballs
  120MB tarball cap तक upload-url flow का उपयोग कर सकते हैं।
- वैकल्पिक payload field: `ownerHandle`। मौजूद होने पर, केवल admins उस owner की ओर से publish कर सकते हैं।

Validation highlights:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin packages को `openclaw.plugin.json` चाहिए। ClawPack `.tgz` uploads में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins को `package.json`, source repo metadata, source commit
  metadata, config schema metadata, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` चाहिए।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक metadata हैं।
- केवल `openclaw` org publisher और current `openclaw` org members के
  personal publishers `official` channel में publish कर सकते हैं।
- On-behalf publishes अब भी target owner account के विरुद्ध official-channel eligibility validate करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

किसी skill को soft-delete / restore करता है (owner, moderator, या admin)।

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill moderation note के रूप में store किया जाता है और audit log में copy किया जाता है।
Owner-initiated soft deletes slug को 30 दिनों के लिए reserve करते हैं, फिर slug को
कोई दूसरा publisher claim कर सकता है। यह expiry लागू होने पर delete response में `slugReservedUntil` शामिल होता है।
Moderator/admin hides और security removals इस तरह expire नहीं होते।

Delete response:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Status codes:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: skill/user not found
- `500`: internal server error

### `POST /api/v1/users/publisher`

केवल admin। किसी handle के लिए org publisher मौजूद होना सुनिश्चित करता है। यदि handle अब भी
legacy shared user/personal publisher की ओर point करता है, तो endpoint पहले उसे org publisher में migrate करता है।
नए बनाए गए org के लिए, `memberHandle` दें; acting admin को member के रूप में नहीं जोड़ा जाता।
`memberRole` का डिफ़ॉल्ट `owner` है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authenticated self-serve org publisher creation। नया org publisher बनाता है और
caller को owner के रूप में जोड़ता है। यह endpoint existing user/personal handles को migrate नहीं करता और
publisher को trusted/official के रूप में mark नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब handle पहले से किसी publisher, user, या personal publisher द्वारा उपयोग किया गया हो, तब `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल admin। किसी rightful owner के लिए release publish किए बिना root slugs और package names reserve करता है।
Package names private placeholder packages बन जाते हैं जिनमें कोई release rows नहीं होतीं, ताकि वही
owner बाद में उस name में वास्तविक code-plugin या bundle-plugin release publish कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल admin। Convex Auth account rows को edit किए बिना verified replacement GitHub OAuth principal के लिए
personal publisher recover करता है। Request में दोनों immutable GitHub
provider account ids का नाम होना चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग किए जाते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से ड्राई-रन पर रहता है। रिकवरी लागू करने के लिए कर्मचारियों द्वारा दोनों
GitHub मुख्य पहचानों के बीच निरंतरता स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` चाहिए। जब गंतव्य उपयोगकर्ता के वर्तमान व्यक्तिगत
प्रकाशक के पास skills, packages, या GitHub skill sources हों, तो रिकवरी सुरक्षित रूप से बंद होकर विफल होती है।
रिकवरी प्राप्त प्रकाशक के skills, skill slug aliases, packages, package inspector warnings, और derived search digest rows के लिए legacy `ownerUserId` फ़ील्ड भी माइग्रेट करती है ताकि
direct-owner पथ नए publisher authority से मेल खाएँ। प्राप्त handle के लिए active protected-handle
reservation भी replacement user को फिर से असाइन किया जाता है ताकि बाद का
profile synchronization पूर्व उपयोगकर्ता की competing authority को पुनर्स्थापित न कर सके। हर primary table को
प्रति apply transaction 100 rows तक सीमित रखा गया है; बड़ी recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped हैं और rewrite करने के बजाय checked के रूप में रिपोर्ट किए जाते हैं।

- बॉडी: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- प्रतिक्रिया: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug प्रबंधन एंडपॉइंट

- `POST /api/v1/skills/{slug}/rename`
  - बॉडी: `{ "newSlug": "new-canonical-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - बॉडी: `{ "targetSlug": "canonical-target-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

नोट:

- दोनों एंडपॉइंट को API token auth चाहिए और ये केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` source listing को छिपाता है और source slug को target listing पर redirect करता है।

### स्वामित्व ट्रांसफ़र एंडपॉइंट

- `POST /api/v1/skills/{slug}/transfer`
  - बॉडी: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - प्रतिक्रिया: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - प्रतिक्रिया (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - प्रतिक्रिया आकार: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

किसी उपयोगकर्ता को ban करें और उसके owned skills को hard-delete करें (केवल moderator/admin)।

बॉडी:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

या

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

प्रतिक्रिया:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

किसी उपयोगकर्ता को unban करें और योग्य skills को restore करें (केवल admin)।

बॉडी:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

या

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

प्रतिक्रिया:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

मौजूदा ban के लिए संग्रहीत reason को unban किए बिना या
content restore किए बिना बदलें (केवल admin)। जब तक `dryRun` `false` न हो, डिफ़ॉल्ट dry-run है।

बॉडी:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

या

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

प्रतिक्रिया:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "malware auto-ban",
  "nextReason": "bulk publishing spam",
  "changed": true
}
```

### `POST /api/v1/users/role`

किसी उपयोगकर्ता की भूमिका बदलें (केवल admin)।

बॉडी:

```json
{ "handle": "user_handle", "role": "moderator" }
```

या

```json
{ "userId": "users_...", "role": "admin" }
```

प्रतिक्रिया:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

उपयोगकर्ताओं की सूची दें या खोजें (केवल admin)।

क्वेरी पैरामीटर:

- `q` (वैकल्पिक): खोज query
- `query` (वैकल्पिक): `q` के लिए alias
- `limit` (वैकल्पिक): अधिकतम परिणाम (डिफ़ॉल्ट 20, अधिकतम 200)

प्रतिक्रिया:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "User",
      "name": "User",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

star (highlights) जोड़ें/हटाएँ। दोनों एंडपॉइंट idempotent हैं।

प्रतिक्रियाएँ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI एंडपॉइंट (deprecated)

पुराने CLI versions के लिए अभी भी समर्थित:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

हटाने की योजना के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। Package
publishes जो ClawPack tarball stage करते हैं, उन्हें resulting storage id को
`clawpack` और returned ticket को `clawpackUploadTicket` के रूप में भेजना होगा।

## Registry discovery (`/.well-known/clawhub.json`)

CLI site से registry/auth settings discover कर सकता है:

- `/.well-known/clawhub.json` (JSON, preferred)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो यह file serve करें (या `CLAWHUB_REGISTRY` स्पष्ट रूप से set करें; legacy `CLAWDHUB_REGISTRY`)।
