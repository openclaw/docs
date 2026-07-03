---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण).
x-i18n:
    generated_at: "2026-07-03T09:35:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

बेस URL: `https://clawhub.ai` (डिफ़ॉल्ट).

सभी v1 पाथ `/api/v1/...` के अंतर्गत हैं।
लेगेसी `/api/...` और `/api/cli/...` संगतता के लिए बने हुए हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`.

## सार्वजनिक कैटलॉग पुनःउपयोग

तृतीय-पक्ष डायरेक्टरी ClawHub Skills को सूचीबद्ध या खोजने के लिए सार्वजनिक रीड एंडपॉइंट का उपयोग कर सकती हैं। कृपया परिणाम कैश करें, `429`/`Retry-After` का सम्मान करें, उपयोगकर्ताओं को कैनॉनिकल ClawHub लिस्टिंग (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और तृतीय-पक्ष साइट के लिए ClawHub समर्थन का संकेत देने से बचें। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन-ब्लॉक की गई सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट को रूट प्राथमिकता को फिर से बनाने के बजाय रीड एंडपॉइंट द्वारा लौटाए गए कैनॉनिकल URL का उपयोग करना चाहिए।

## दर सीमाएँ

प्रवर्तन मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer टोकन): प्रति उपयोगकर्ता बकेट लागू।
- यदि टोकन अनुपस्थित/अमान्य है, तो व्यवहार IP प्रवर्तन पर वापस चला जाता है।
- प्रमाणित राइट एंडपॉइंट को तब खाली `Unauthorized` नहीं लौटाना चाहिए जब सर्वर कारण जानता हो। अनुपस्थित टोकन, अमान्य/रद्द किए गए टोकन, और हटाए गए/प्रतिबंधित/अक्षम खाते, प्रत्येक को कार्रवाई योग्य पाठ मिलना चाहिए ताकि CLI क्लाइंट उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- रीड: प्रति IP 3000/मिनट, प्रति कुंजी 12000/मिनट
- राइट: प्रति IP 300/मिनट, प्रति कुंजी 3000/मिनट
- डाउनलोड: प्रति IP 1200/मिनट, प्रति कुंजी 6000/मिनट (डाउनलोड एंडपॉइंट)

हेडर:

- लेगेसी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

हेडर अर्थ:

- `X-RateLimit-Reset`: पूर्ण Unix epoch सेकंड
- `RateLimit-Reset`: रीसेट तक सेकंड (देरी)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर सटीक शेष बजट।
  शार्ड किए गए सफल अनुरोध अनुमानित वैश्विक मान लौटाने के बजाय इस हेडर को छोड़ देते हैं।
- `Retry-After`: `429` पर पुनः प्रयास से पहले प्रतीक्षा करने के सेकंड (देरी)

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
- समकालिक पुनःप्रयासों से बचने के लिए जिटर वाला बैकऑफ़ उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` पर वापस जाएँ (या `X-RateLimit-Reset` से गणना करें)।

IP स्रोत:

- विश्वसनीय क्लाइंट IP हेडर, जिनमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब डिप्लॉयमेंट विश्वसनीय फ़ॉरवर्डेड हेडर को स्पष्ट रूप से सक्षम करता है।
- ClawHub एज पर क्लाइंट IP की पहचान करने के लिए विश्वसनीय फ़ॉरवर्डिंग हेडर का उपयोग करता है।
- यदि कोई विश्वसनीय क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध केवल दर-सीमा प्रकार के दायरे वाले फ़ॉलबैक बकेट का उपयोग करते हैं। इन फ़ॉलबैक बकेट में कॉलर द्वारा दिए गए पाथ, स्लग, पैकेज नाम, संस्करण, क्वेरी स्ट्रिंग, या अन्य आर्टिफ़ैक्ट पैरामीटर शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएँ

सार्वजनिक v1 त्रुटि प्रतिक्रियाएँ `content-type: text/plain; charset=utf-8` के साथ सादा पाठ होती हैं।
इसमें सत्यापन विफलताएँ (`400`), अनुपस्थित सार्वजनिक संसाधन (`404`), auth और अनुमति विफलताएँ (`401`/`403`), दर सीमाएँ (`429`), और ब्लॉक किए गए डाउनलोड शामिल हैं। क्लाइंट को प्रतिक्रिया बॉडी को मानव-पठनीय स्ट्रिंग के रूप में पढ़ना चाहिए। अज्ञात क्वेरी पैरामीटर संगतता के लिए अनदेखे किए जाते हैं, लेकिन अमान्य मानों वाले पहचाने गए क्वेरी पैरामीटर `400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट (auth नहीं)

### `GET /api/v1/search`

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक
- `highlightedOnly` (वैकल्पिक): हाइलाइट किए गए Skills तक फ़िल्टर करने के लिए `true`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए लेगेसी उपनाम

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

- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं (एम्बेडिंग समानता + सटीक स्लग/नाम टोकन बूस्ट + छोटा लोकप्रियता प्रायर)।
- प्रासंगिकता लोकप्रियता से अधिक मजबूत है। सटीक स्लग या डिस्प्ले-नाम टोकन मिलान, बहुत अधिक एंगेजमेंट वाले ढीले मिलान से ऊपर रैंक कर सकता है।
- ASCII पाठ को शब्द और विराम-चिह्न सीमाओं पर टोकनाइज़ किया जाता है। उदाहरण के लिए, `personal-map` में स्वतंत्र `map` टोकन है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` शामिल हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में मजबूत शब्दात्मक मिलान मिलता है।
- लोकप्रियता लॉग-स्केल की जाती है और कैप की जाती है। उच्च-एंगेजमेंट Skills तब नीचे रैंक कर सकते हैं जब क्वेरी पाठ का मिलान कमजोर हो।
- संदिग्ध या छिपी मॉडरेशन स्थिति, कॉलर फ़िल्टर और वर्तमान मॉडरेशन स्थिति के आधार पर, किसी Skill को सार्वजनिक खोज से हटा सकती है।

प्रकाशक खोज-योग्यता मार्गदर्शन:

- वे शब्द डिस्प्ले नाम, सारांश, और टैग में रखें जिन्हें उपयोगकर्ता सचमुच खोजेंगे। स्वतंत्र स्लग टोकन केवल तब उपयोग करें जब वह एक स्थिर पहचान भी हो जिसे आप बनाए रखना चाहते हैं।
- केवल किसी एक क्वेरी का पीछा करने के लिए स्लग का नाम न बदलें, जब तक नया स्लग बेहतर दीर्घकालिक कैनॉनिकल नाम न हो। पुराने स्लग रीडायरेक्ट उपनाम बन जाते हैं, लेकिन कैनॉनिकल URL, प्रदर्शित स्लग, और भविष्य के खोज डाइजेस्ट नए स्लग का उपयोग करते हैं।
- नाम बदलने के उपनाम पुराने URL और रजिस्ट्री के माध्यम से रिज़ॉल्व होने वाले इंस्टॉल के लिए रिज़ॉल्यूशन बनाए रखते हैं, लेकिन खोज रैंकिंग नाम बदलने के इंडेक्स होने के बाद कैनॉनिकल Skill मेटाडेटा पर आधारित होती है। मौजूदा आँकड़े Skill के साथ रहते हैं।
- यदि कोई Skill अप्रत्याशित रूप से अदृश्य है, तो रैंकिंग-संबंधित मेटाडेटा बदलने से पहले लॉग इन रहते हुए `clawhub inspect @owner/slug` के साथ पहले मॉडरेशन स्थिति जाँचें।

### `GET /api/v1/skills`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–200)
- `cursor` (वैकल्पिक): किसी भी गैर-`trending` सॉर्ट के लिए पेजिनेशन कर्सर
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended` (उपनाम: `default`), `createdAt` (उपनाम: `newest`), `downloads`, `stars` (उपनाम: `rating`), लेगेसी इंस्टॉल उपनाम `installsCurrent`/`installs`/`installsAllTime` `downloads` पर मैप होते हैं, `trending`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए लेगेसी उपनाम

अमान्य `sort` मान `400` लौटाते हैं।

नोट:

- `recommended` एंगेजमेंट और हालियापन संकेतों का उपयोग करता है।
- `trending` पिछले 7 दिनों के इंस्टॉल के आधार पर रैंक करता है (टेलीमेट्री-आधारित)।
- `createdAt` नए-Skill क्रॉल के लिए स्थिर है; `updated` मौजूदा Skills के पुनःप्रकाशित होने पर बदलता है।
- जब `nonSuspiciousOnly=true` हो, तो कर्सर-आधारित सॉर्ट किसी पेज पर `limit` से कम आइटम लौटा सकते हैं क्योंकि संदिग्ध Skills पेज पुनर्प्राप्ति के बाद फ़िल्टर किए जाते हैं।
- मौजूद होने पर पेजिनेशन जारी रखने के लिए `nextCursor` का उपयोग करें। छोटा पेज अपने आप परिणामों के अंत का अर्थ नहीं है।

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

- स्वामी नाम बदलने/मर्ज फ़्लो द्वारा बनाए गए पुराने स्लग कैनॉनिकल Skill पर रिज़ॉल्व होते हैं।
- `metadata.os`: Skill frontmatter में घोषित OS प्रतिबंध (जैसे `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix सिस्टम लक्ष्य (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि Skill में कोई प्लेटफ़ॉर्म मेटाडेटा नहीं है, तो `metadata` `null` होता है।
- `moderation` केवल तब शामिल होता है जब Skill फ़्लैग किया गया हो या स्वामी उसे देख रहा हो।

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

- स्वामी और मॉडरेटर छिपे हुए Skills के मॉडरेशन विवरण तक पहुँच सकते हैं।
- सार्वजनिक कॉलर को केवल पहले से-फ़्लैग किए गए दृश्यमान Skills के लिए `200` मिलता है।
- सार्वजनिक कॉलर के लिए साक्ष्य रिडैक्ट किया जाता है और कच्चे स्निपेट केवल स्वामियों/मॉडरेटरों के लिए शामिल होते हैं।

### `POST /api/v1/skills/{slug}/report`

मॉडरेटर समीक्षा के लिए Skill की रिपोर्ट करें। रिपोर्ट Skill-स्तर की होती हैं, वैकल्पिक रूप से किसी संस्करण से जुड़ी होती हैं, और Skill रिपोर्ट कतार को फ़ीड करती हैं।

Auth:

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

Skill रिपोर्ट इनटेक के लिए मॉडरेटर/admin एंडपॉइंट।

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

Skill रिपोर्ट को हल करने या फिर से खोलने के लिए मॉडरेटर/admin एंडपॉइंट।

अनुरोध:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट योग्य वर्कफ़्लो में Skill छिपाने के लिए ट्रायाज की गई रिपोर्ट के साथ `finalAction: "hide"` पास करें।

### `GET /api/v1/skills/{slug}/versions`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

### `GET /api/v1/skills/{slug}/versions/{version}`

संस्करण मेटाडेटा + फ़ाइल सूची लौटाता है।

- `version.security` उपलब्ध होने पर सामान्यीकृत स्कैन सत्यापन स्थिति और स्कैनर विवरण (VirusTotal + LLM) शामिल करता है।

### `GET /api/v1/skills/{slug}/scan`

Skill संस्करण के लिए सुरक्षा स्कैन सत्यापन विवरण लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किया गया संस्करण रिज़ॉल्व करें (उदाहरण के लिए `latest`)।

नोट:

- यदि न `version` और न ही `tag` दिया गया हो, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति और स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निर्णायक निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से निकाला गया मौजूदा कौशल-स्तर मॉडरेशन स्नैपशॉट है।
- किसी ऐतिहासिक संस्करण को क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नई ClawScan नौकरियों के लिए प्रमाणित सबमिट एंडपॉइंट।

स्थानीय अपलोड स्कैन अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले अनुरोध `410` लौटाते हैं।

प्रकाशित स्कैन JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- स्कैन अनुरोध पेलोड और डाउनलोड करने योग्य रिपोर्टें रिटेंशन विंडो के बाद स्कैन-अनुरोध स्टोर से समाप्त हो जाती हैं।
- प्रकाशित स्कैन के लिए मालिक/प्रकाशक प्रबंधन पहुंच, या प्लेटफ़ॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- प्रकाशित स्कैन केवल तब वापस लिखते हैं जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो।
- प्रतिक्रिया `202` होती है, `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` के साथ।
- स्कैन नौकरियां असिंक्रोनस होती हैं। मैनुअल स्कैन अनुरोधों को सामान्य प्रकाशन/बैकफ़िल कार्य से पहले प्राथमिकता दी जाती है, लेकिन पूरा होना फिर भी वर्कर उपलब्धता पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणित पोल एंडपॉइंट।

- queued/running/succeeded/failed स्थिति लौटाता है।
- queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है ताकि क्लाइंट दिखा सकें कि अनुरोध से आगे कितने प्राथमिकता-प्राप्त मैनुअल स्कैन हैं। बहुत बड़ी कतारें सीमित की जाती हैं और `queuedAheadIsEstimate: true` के साथ रिपोर्ट की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` अनुभाग होते हैं।
- विफल स्कैन नौकरियां `lastError` के साथ `status: "failed"` लौटाती हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणित रिपोर्ट आर्काइव एंडपॉइंट।

- सफल स्कैन आवश्यक है; गैर-टर्मिनल स्कैन `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए संस्करणों के लिए प्रमाणित संग्रहीत रिपोर्ट आर्काइव एंडपॉइंट।

- कौशल या Plugin के लिए मालिक/प्रकाशक प्रबंधन पहुंच, या प्लेटफ़ॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- सटीक सबमिट किए गए संस्करण के लिए संग्रहीत स्कैन परिणाम लौटाता है, जिसमें अवरुद्ध या छिपे हुए संस्करण भी शामिल हैं।
- `kind` डिफ़ॉल्ट रूप से `skill` होता है; Plugin/पैकेज स्कैन के लिए `kind=plugin` का उपयोग करें।
- स्कैन-अनुरोध डाउनलोड जैसी ही ZIP संरचना लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

केवल एडमिन के लिए कैनोनिकल बैच रीस्कैन रूट। यह पुराने `POST /api/v1/skills/-/rescan-batch` जैसी ही पेलोड संरचना स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

केवल एडमिन के लिए कैनोनिकल बैच स्थिति रूट। यह `{ "jobIds": ["..."] }` स्वीकार करता है और पुराने `POST /api/v1/skills/-/rescan-batch/status` जैसे ही एग्रीगेट काउंटर लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला कौशल कार्ड सत्यापन एनवेलप लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किए गए संस्करण को रिज़ॉल्व करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब चयनित संस्करण के पास जनरेट किया गया कौशल कार्ड हो, वह मॉडरेशन द्वारा मैलवेयर-अवरुद्ध न हो, और ClawScan सत्यापन clean हो।
- कौशल पहचान, प्रकाशक पहचान, और चयनित संस्करण मेटाडेटा शीर्ष-स्तरीय एनवेलप फ़ील्ड (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) होते हैं ताकि शेल ऑटोमेशन नेस्टेड रैपर अनपैक किए बिना उन्हें पढ़ सके।
- `security` शीर्ष-स्तरीय ClawScan/सुरक्षा निर्णय है। ऑटोमेशन को `ok`, `decision`, `reasons`, और `security.status` पर आधारित होना चाहिए।
- `security.signals` में सहायक स्कैनर साक्ष्य होते हैं, जैसे `staticScan`, `virusTotal`, और `skillSpector`।
- `security.signals.dependencyRegistry` v1 प्रतिक्रिया संगतता के लिए रखा गया है, लेकिन dependency registry existence scanner रिटायर हो चुका है और यह कुंजी हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने प्रकाशन या आयात के दौरान GitHub repo/ref/commit/path को रिज़ॉल्व और संग्रहीत किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

सटीक कौशल संस्करणों के लिए मौजूदा कॉम्पैक्ट सुरक्षा निर्णय लौटाता है। यह संग्रह एंडपॉइंट उन क्लाइंट के लिए है जो पहले से जानते हैं कि उन्हें कौन से इंस्टॉल किए गए ClawHub कौशल संस्करण दिखाने हैं, जैसे OpenClaw Control UI।

अनुरोध:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

नोट्स:

- `items` में 1-100 अद्वितीय `{ slug, version }` जोड़े होने चाहिए।
- परिणाम प्रति आइटम होते हैं; एक अनुपस्थित कौशल या संस्करण पूरी प्रतिक्रिया को विफल नहीं करता।
- प्रतिक्रिया केवल सुरक्षा-संबंधी है। इसमें कौशल कार्ड डेटा, जनरेटेड कार्ड स्थिति, आर्टिफैक्ट फ़ाइल सूचियां, या विस्तृत स्कैनर पेलोड शामिल नहीं हैं।
- `security.signals` में केवल स्थिति-स्तर के सहायक साक्ष्य होते हैं; पूरे स्कैनर विवरणों के लिए `/scan` या ClawHub security-audit पेज का उपयोग करें।
- `security.signals.dependencyRegistry` v1 प्रतिक्रिया संगतता के लिए रखा गया है, लेकिन dependency registry existence scanner रिटायर हो चुका है और यह कुंजी हमेशा `null` होती है।
- कौशल कार्ड की अनुपस्थिति इस एंडपॉइंट के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; जब क्लाइंट को कार्ड सामग्री चाहिए, उन्हें इंस्टॉल किया गया `skill-card.md` स्थानीय रूप से पढ़ना चाहिए।
- जब आपको एकल-कौशल कौशल कार्ड सत्यापन एनवेलप चाहिए तो `/verify` का उपयोग करें, जनरेटेड कार्ड markdown चाहिए तो `/card`, और विस्तृत स्कैनर डेटा चाहिए तो `/scan`।

प्रतिक्रिया:

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

कच्ची पाठ सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- नवीनतम संस्करण पर डिफ़ॉल्ट होता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग एंडपॉइंट:

- Skills
- कोड Plugin
- बंडल Plugin

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, लेगेसी उपनाम `installs`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध Plugin पैकेजों (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले पैकेज एंडपॉइंट) तक सीमित हो। नियंत्रित श्रेणियां और
  लेगेसी v1 फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` स्थिर-family उपनाम बने रहते हैं।
- Skills प्रविष्टियां Skills रजिस्ट्री द्वारा समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अब भी केवल code-plugin और bundle-plugin रिलीज़ के लिए है।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणित कॉलर सूची/खोज परिणामों में उन प्रकाशकों के निजी पैकेज देख सकते हैं जिनसे वे जुड़े हैं।
- `channel=private` केवल वे पैकेज लौटाता है जिन्हें प्रमाणित कॉलर पढ़ सकता है।

### `GET /api/v1/packages/search`

Skills + Plugin पैकेजों में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध Plugin पैकेजों तक सीमित हो। नियंत्रित श्रेणियां और लेगेसी v1
  फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणित कॉलर उन प्रकाशकों के निजी पैकेज खोज सकते हैं जिनसे वे जुड़े हैं।
- `channel=private` केवल वे पैकेज लौटाता है जिन्हें प्रमाणित कॉलर पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin पैकेजों में केवल-Plugin कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, लेगेसी उपनाम `installs`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

लेगेसी v1 फ़िल्टर उपनाम रीड एंडपॉइंट पर स्वीकार किए जाते रहते हैं:

- `mcp-tooling`, `data`, और `automation` `tools` में रिज़ॉल्व होते हैं।
- `observability` और `deployment` `gateway` में रिज़ॉल्व होते हैं।
- `dev-tools` `runtime` में रिज़ॉल्व होता है।

`trending` सात-दिन का इंस्टॉल/डाउनलोड लीडरबोर्ड है और सर्वकालिक कुलों का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` एंडपॉइंट पर यह केवल-Plugin है; Skills कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

लेगेसी उपनाम संग्रहीत या लेखक-घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Skills का बल्क निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर से पेजिनेशन कर्सर।

प्रत्युत्तर:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Skill `{publisher}/{slug}/` पर रूटेड होता है।
- होस्ट किए गए Skills में नवीनतम संग्रहीत संस्करण फ़ाइलें शामिल होती हैं और
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध होते हैं।
- `clean` या `suspicious` स्कैन वाले वर्तमान GitHub-समर्थित Skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, रेपो, कमिट, पाथ,
  सामग्री हैश, और आर्काइव URL होता है। वे ClawHub-होस्टेड स्रोत फ़ाइलें शामिल नहीं करते।
- प्रत्येक Skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Skills या फ़ाइलें
  निर्यात नहीं की जा सकीं।

हेडर:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Plugin रिलीज़ का बल्क निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ दोनों
  Plugin परिवार हैं।

प्रत्युत्तर:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यात किया गया Plugin `{family}/{packageName}/` पर रूटेड होता है।
- प्रत्येक निर्यात किए गए Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- जब अलग-अलग Plugin या फ़ाइलें निर्यात नहीं की जा सकीं, तब `_errors.json` शामिल होता है।

हेडर:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

code-plugin और bundle-plugin पैकेजों में केवल-Plugin खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

टिप्पणियां:

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित लेगेसी v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी डाइजेस्ट
  पंक्तियों पर आधारित वास्तविक API फ़िल्टर है, खोज-क्वेरी पुनर्लेखन नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पेजिनेट नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को पुनःक्रमित करते हैं,
  जो वर्तमान `/skills` ब्राउज़ व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

टिप्पणियां:

- Skills एकीकृत कैटलॉग में इस रूट के माध्यम से भी रिज़ॉल्व हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को सॉफ्ट-डिलीट करता है।

टिप्पणियां:

- पैकेज स्वामी, org प्रकाशक स्वामी/एडमिन,
  प्लेटफ़ॉर्म मॉडरेटर, या प्लेटफ़ॉर्म एडमिन के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

टिप्पणियां:

- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता,
सत्यापन, आर्टिफैक्ट मेटाडेटा, और स्कैन डेटा सहित एक पैकेज संस्करण लौटाता है।

टिप्पणियां:

- `version.artifact.kind` पुराने-विश्व पैकेज आर्काइव के लिए `legacy-zip` या
  ClawPack-आधारित रिलीज़ के लिए `npm-pack` होता है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स को हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैनॉनिकल रिलीज़ आर्टिफैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और विश्वास सारांश लौटाता है।
यह यह तय करने के लिए सार्वजनिक OpenClaw उपभोग सतह है कि
रिज़ॉल्व की गई रिलीज़ इंस्टॉल की जा सकती है या नहीं।

प्रमाणीकरण:

- सार्वजनिक रीड एंडपॉइंट। कोई स्वामी, प्रकाशक, मॉडरेटर, या एडमिन टोकन
  आवश्यक नहीं है।

प्रत्युत्तर:

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

प्रत्युत्तर फ़ील्ड:

- `package.name`, `package.displayName`, और `package.family`
  रिज़ॉल्व किए गए रजिस्ट्री पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt`
  मूल्यांकित की गई सटीक रिलीज़ की पहचान करते हैं।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफैक्ट के लिए ज्ञात होने पर
  मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैनुअल रिलीज़ मॉडरेशन से व्युत्पन्न
  प्रभावी विश्वास स्थिति है।
- `trust.moderationState` nullable है। जब कोई मैनुअल रिलीज़
  मॉडरेशन मौजूद नहीं होता, तब यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल ब्लॉक संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को स्कैनर या मॉडरेशन फ़ील्ड से ब्लॉकिंग नियमों को पुनःव्युत्पन्न करने के बजाय
  यह मान `true` होने पर इंस्टॉलेशन ब्लॉक करना चाहिए।
- `trust.reasons` उपयोगकर्ता-सामने और ऑडिट व्याख्या सूची है। कारण कोड
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक विश्वास इनपुट अभी भी पूर्ण होने की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि विश्वास सारांश पुराने इनपुट से गणना किया गया था और
  उच्च-विश्वास अनुमति निर्णय से पहले इसे रीफ़्रेश की आवश्यकता के रूप में माना जाना चाहिए।

टिप्पणियां:

- यह एंडपॉइंट संस्करण-सटीक है। क्लाइंट को इसे उस पैकेज संस्करण को रिज़ॉल्व करने के बाद कॉल करना चाहिए
  जिसे वे इंस्टॉल करना चाहते हैं, केवल नवीनतम
  पैकेज मेटाडेटा पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।
- यह एंडपॉइंट स्वामी/मॉडरेटर मॉडरेशन
  एंडपॉइंट की तुलना में जानबूझकर अधिक संकीर्ण है। यह इंस्टॉल निर्णय और सार्वजनिक व्याख्या उजागर करता है,
  रिपोर्टर पहचान, रिपोर्ट बॉडी, निजी साक्ष्य, या आंतरिक समीक्षा
  टाइमलाइन नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

टिप्पणियां:

- लेगेसी पैकेज संस्करण `legacy-zip` आर्टिफैक्ट और लेगेसी ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण `npm-pack` आर्टिफैक्ट, npm इंटीग्रिटी फ़ील्ड,
  `tarballUrl`, और लेगेसी ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से
  आर्काइव फ़ॉर्मैट का अनुमान लगाने से बचती है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से संस्करण आर्टिफैक्ट डाउनलोड करता है।

टिप्पणियां:

- ClawPack संस्करण सटीक अपलोड किए गए npm-pack `.tgz` बाइट्स स्ट्रीम करते हैं।
- लेगेसी ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट करते हैं।
- डाउनलोड दर बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw उपभोग के लिए गणना की गई तैयारी लौटाता है।

तैयारी जांचें इनमें शामिल हैं:

- आधिकारिक चैनल स्थिति
- नवीनतम संस्करण उपलब्धता
- ClawPack npm-pack आर्टिफैक्ट उपलब्धता
- आर्टिफैक्ट डाइजेस्ट
- स्रोत repo और कमिट उद्गम
- OpenClaw संगतता मेटाडेटा
- होस्ट लक्ष्य
- स्कैन स्थिति

प्रत्युत्तर:

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

आधिकारिक OpenClaw Plugin माइग्रेशन पंक्तियों को सूचीबद्ध करने के लिए मॉडरेटर एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `phase` (वैकल्पिक): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, या
  `all` (डिफ़ॉल्ट)।
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

प्रत्युत्तर:

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

आधिकारिक Plugin माइग्रेशन पंक्ति बनाने या अपडेट करने के लिए एडमिन एंडपॉइंट।

प्रमाणीकरण:

- एडमिन उपयोगकर्ता के लिए API टोकन आवश्यक है।

अनुरोध बॉडी:

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

टिप्पणियां:

- `bundledPluginId` को लोअरकेस में सामान्यीकृत किया जाता है और यह स्थिर upsert कुंजी है।
- `packageName` npm-name सामान्यीकृत है; नियोजित
  माइग्रेशन के लिए पैकेज अनुपस्थित हो सकता है।
- यह केवल माइग्रेशन तैयारी को ट्रैक करता है। यह OpenClaw को म्यूटेट नहीं करता या
  ClawPacks जनरेट नहीं करता।

### `GET /api/v1/packages/moderation/queue`

पैकेज रिलीज़ समीक्षा कतारों के लिए मॉडरेटर/एडमिन एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

स्थिति अर्थ:

- `open`: संदिग्ध, दुर्भावनापूर्ण, लंबित, क्वारंटीन, रद्द, या रिपोर्ट की गई रिलीज़।
- `blocked`: क्वारंटीन, रद्द, या दुर्भावनापूर्ण रिलीज़।
- `manual`: मैनुअल मॉडरेशन ओवरराइड वाली कोई भी रिलीज़।
- `all`: मैनुअल ओवरराइड, गैर-क्लीन स्कैन स्थिति, या पैकेज रिपोर्ट वाली कोई भी रिलीज़।

प्रत्युत्तर:

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

मॉडरेटर समीक्षा के लिए पैकेज की रिपोर्ट करें। रिपोर्ट पैकेज-स्तर की होती हैं, वैकल्पिक रूप से
किसी संस्करण से लिंक होती हैं। वे मॉडरेशन कतार को फ़ीड करती हैं लेकिन स्वयं डाउनलोड को
ऑटो-हाइड या ब्लॉक नहीं करतीं; मॉडरेटर को आर्टिफैक्ट को
स्वीकृत, क्वारंटीन, या रद्द करने के लिए रिलीज़ मॉडरेशन का उपयोग करना चाहिए।

प्रमाणीकरण:

- API टोकन आवश्यक है।

अनुरोध:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

प्रत्युत्तर:

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

मॉडरेटर/एडमिन एंडपॉइंट, पैकेज रिपोर्ट ग्रहण के लिए।

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

प्रतिक्रिया:

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

पैकेज मॉडरेशन दृश्यता के लिए मालिक/मॉडरेटर एंडपॉइंट।

प्रमाणीकरण:

- पैकेज मालिक, प्रकाशक सदस्य, मॉडरेटर, या
  एडमिन उपयोगकर्ता के लिए API टोकन आवश्यक है।

प्रतिक्रिया:

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

पैकेज रिपोर्ट हल करने या फिर से खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

अनुरोध:

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

प्रतिक्रिया:

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

पैकेज रिलीज़ समीक्षा के लिए मॉडरेटर/एडमिन एंडपॉइंट।

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित अवस्थाएँ:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई।
- `quarantined`: फ़ॉलो-अप लंबित होने तक ब्लॉक किया गया।
- `revoked`: किसी रिलीज़ पर पहले भरोसा किए जाने के बाद ब्लॉक किया गया।

क्वारंटीन और रद्द की गई रिलीज़ें आर्टिफ़ैक्ट डाउनलोड रूट से `403` लौटाती हैं।
हर बदलाव एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

पैकेज फ़ाइल के लिए कच्ची टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- डाउनलोड बकेट नहीं, रीड रेट बकेट का उपयोग करता है।
- बाइनरी फ़ाइलें `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal स्कैन पढ़ने को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ें फिर भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/download`

पैकेज रिलीज़ के लिए लेगेसी निर्धारक ZIP आर्काइव डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- Skills `GET /api/v1/download` पर रीडायरेक्ट करती हैं।
- Plugin/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें हैं ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह रूट केवल ZIP रहता है। यह ClawPack `.tgz` फ़ाइलों को स्ट्रीम नहीं करता।
- प्रतिक्रियाओं में रिज़ॉल्वर अखंडता जाँचों के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल-रजिस्ट्री मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ें `403` लौटाती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक न हो।

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत पैक्यूमेंट लौटाता है।

टिप्पणियाँ:

- केवल अपलोड किए गए ClawPack npm-pack टारबॉल वाले संस्करण सूचीबद्ध होते हैं।
- लेगेसी केवल-ZIP संस्करण जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत
  फ़ील्ड का उपयोग करते हैं ताकि उपयोगकर्ता चाहें तो npm को मिरर की ओर इंगित कर सकें।
- स्कोप्ड पैकेज पैक्यूमेंट `/api/npm/@scope/name` और npm के
  एन्कोडेड `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm मिरर क्लाइंट के लिए ठीक अपलोड किए गए ClawPack टारबॉल बाइट्स स्ट्रीम करता है।

टिप्पणियाँ:

- डाउनलोड रेट बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 के साथ npm integrity/shasum मेटाडेटा शामिल होता है।
- मॉडरेशन और निजी पैकेज एक्सेस जाँचें अब भी लागू होती हैं।

### `GET /api/v1/resolve`

CLI द्वारा स्थानीय फ़िंगरप्रिंट को ज्ञात संस्करण से मैप करने के लिए उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): बंडल फ़िंगरप्रिंट का 64-अक्षर hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

होस्ट किया गया skill संस्करण ZIP डाउनलोड करता है, या किसी वर्तमान GitHub-समर्थित skill के लिए GitHub स्रोत हैंडऑफ़ लौटाता है, जिसके पास `clean` या `suspicious` स्कैन हो और कोई होस्ट किया गया
संस्करण न हो।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (जैसे `latest`)

टिप्पणियाँ:

- यदि न `version` दिया गया है और न `tag`, तो नवीनतम संस्करण उपयोग किया जाता है।
- सॉफ़्ट-डिलीट किए गए संस्करण `410` लौटाते हैं।
- GitHub-समर्थित skill हैंडऑफ़ बाइट्स को प्रॉक्सी या मिरर नहीं करते। JSON प्रतिक्रिया में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; स्कैन/वर्तमान अवस्था एक गेट है और सफलता
  पेलोड मेटाडेटा के रूप में शामिल नहीं होती।
- डाउनलोड आँकड़े प्रति UTC दिन अद्वितीय पहचान के रूप में गिने जाते हैं (API टोकन वैध होने पर `userId`, अन्यथा IP)।

## प्रमाणीकरण एंडपॉइंट (Bearer token)

सभी एंडपॉइंट को आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन सत्यापित करता है और उपयोगकर्ता हैंडल लौटाता है।

### `POST /api/v1/skills`

नया संस्करण प्रकाशित करता है।

- पसंदीदा: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`।
- `files` (storageId-आधारित) वाला JSON body भी स्वीकार किया जाता है।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, API उस
  प्रकाशक को सर्वर-साइड रिज़ॉल्व करता है और अभिनेता के पास प्रकाशक एक्सेस होना आवश्यक करता है।
- वैकल्पिक पेलोड फ़ील्ड: `migrateOwner`। `ownerHandle` के साथ `true` होने पर,
  कोई मौजूदा skill उस मालिक के पास जा सकता है यदि अभिनेता वर्तमान और लक्ष्य
  दोनों प्रकाशकों पर एडमिन/मालिक है। इस opt-in के बिना, मालिक बदलाव
  अस्वीकार किए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है।

- Bearer token प्रमाणीकरण आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत फ़ॉर्म फ़ील्ड `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  टारबॉल संदर्भ हैं। `clawpack` एक `.tgz` blob या upload-url फ़्लो द्वारा लौटाया गया storage id हो सकता है। स्टेज किए गए storage-id प्रकाशनों में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- `files` या `clawpack` में से एक का उपयोग करें, उसी अनुरोध में दोनों का कभी नहीं।
- JSON bodies और कॉलर द्वारा दिए गए `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार किए जाते हैं।
- डायरेक्ट multipart प्रकाशन अनुरोध 18MB पर सीमित हैं। ClawPack टारबॉल
  120MB टारबॉल सीमा तक upload-url फ़्लो का उपयोग कर सकते हैं।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, केवल एडमिन उस मालिक की ओर से प्रकाशित कर सकते हैं।

सत्यापन मुख्य बिंदु:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin पैकेजों को `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` अपलोड में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins को `package.json`, स्रोत repo मेटाडेटा, स्रोत commit
  मेटाडेटा, config schema मेटाडेटा, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` org प्रकाशक और वर्तमान `openclaw` org सदस्यों के
  निजी प्रकाशक `official` चैनल पर प्रकाशित कर सकते हैं।
- ओर-से प्रकाशन अब भी लक्ष्य मालिक खाते के विरुद्ध official-channel पात्रता सत्यापित करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill को सॉफ़्ट-डिलीट / पुनर्स्थापित करें (मालिक, मॉडरेटर, या एडमिन)।

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill मॉडरेशन नोट के रूप में संग्रहीत होता है और ऑडिट लॉग में कॉपी किया जाता है।
मालिक द्वारा शुरू किए गए सॉफ़्ट डिलीट slug को 30 दिनों के लिए आरक्षित रखते हैं, फिर slug को
दूसरा प्रकाशक क्लेम कर सकता है। जब यह समाप्ति लागू होती है, delete प्रतिक्रिया में `slugReservedUntil` शामिल होता है।
मॉडरेटर/एडमिन हाइड और सुरक्षा removals इस तरह समाप्त नहीं होते।

Delete प्रतिक्रिया:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

स्थिति कोड:

- `200`: ठीक
- `401`: अनधिकृत
- `403`: निषिद्ध
- `404`: skill/उपयोगकर्ता नहीं मिला
- `500`: आंतरिक सर्वर त्रुटि

### `POST /api/v1/users/publisher`

केवल एडमिन। सुनिश्चित करता है कि किसी हैंडल के लिए org प्रकाशक मौजूद है। यदि हैंडल अब भी
लेगेसी साझा उपयोगकर्ता/निजी प्रकाशक की ओर इशारा करता है, तो एंडपॉइंट पहले उसे org प्रकाशक में माइग्रेट करता है।
नए बनाए गए org के लिए, `memberHandle` दें; कार्यरत एडमिन को सदस्य के रूप में नहीं जोड़ा जाता।
`memberRole` डिफ़ॉल्ट रूप से `owner` होता है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

प्रमाणीकृत self-serve org प्रकाशक निर्माण। नया org प्रकाशक बनाता है और
कॉलर को मालिक के रूप में जोड़ता है। यह एंडपॉइंट मौजूदा उपयोगकर्ता/निजी हैंडल माइग्रेट नहीं करता और
प्रकाशक को trusted/official चिह्नित नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब हैंडल पहले से किसी प्रकाशक, उपयोगकर्ता, या निजी प्रकाशक द्वारा उपयोग किया जाता है, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल एडमिन। किसी वैध मालिक के लिए रिलीज़ प्रकाशित किए बिना root slugs और पैकेज नाम आरक्षित करता है।
पैकेज नाम बिना release rows वाले निजी placeholder packages बन जाते हैं, ताकि वही
मालिक बाद में वास्तविक code-plugin या bundle-plugin रिलीज़ उस नाम में प्रकाशित कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल एडमिन। Convex Auth account rows संपादित किए बिना सत्यापित प्रतिस्थापन GitHub OAuth principal
के लिए निजी प्रकाशक रिकवर करता है। अनुरोध में दोनों immutable GitHub
provider account ids नामित होने चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग होते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से ड्राई-रन होता है। पुनर्प्राप्ति लागू करने के लिए स्टाफ़ द्वारा दोनों
GitHub principals के बीच निरंतरता को स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब गंतव्य उपयोगकर्ता के मौजूदा व्यक्तिगत
प्रकाशक के पास Skills, पैकेज, या GitHub Skill स्रोत हों, तो पुनर्प्राप्ति बंद-स्थिति में विफल होती है।
पुनर्प्राप्ति, पुनर्प्राप्त प्रकाशक के Skills, Skill slug उपनामों, पैकेजों, पैकेज निरीक्षक चेतावनियों, और व्युत्पन्न खोज डाइजेस्ट पंक्तियों के लिए लेगेसी `ownerUserId` फ़ील्ड भी माइग्रेट करती है ताकि
प्रत्यक्ष-मालिक पथ नए प्रकाशक प्राधिकरण से मेल खाएं। पुनर्प्राप्त हैंडल के लिए सक्रिय संरक्षित-हैंडल
आरक्षण भी प्रतिस्थापन उपयोगकर्ता को फिर से सौंपा जाता है ताकि बाद का
प्रोफ़ाइल सिंक्रनाइज़ेशन पूर्व उपयोगकर्ता के प्रतिस्पर्धी प्राधिकरण को पुनर्स्थापित न कर सके। प्रत्येक प्राथमिक तालिका प्रति लागू लेनदेन
100 पंक्तियों तक सीमित है; बड़ी पुनर्प्राप्तियों को पहले फिर से शुरू की जा सकने वाली मालिक माइग्रेशन का उपयोग करना होगा।
GitHub Skill स्रोत प्रकाशक-स्कोप्ड हैं और दोबारा लिखे जाने के बजाय जांचे गए के रूप में रिपोर्ट किए जाते हैं।

- बॉडी: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- प्रतिक्रिया: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### मालिक slug प्रबंधन एंडपॉइंट

- `POST /api/v1/skills/{slug}/rename`
  - बॉडी: `{ "newSlug": "new-canonical-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - बॉडी: `{ "targetSlug": "canonical-target-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

टिप्पणियां:

- दोनों एंडपॉइंट को API टोकन प्रमाणीकरण की आवश्यकता होती है और ये केवल Skill मालिक के लिए काम करते हैं।
- `rename` पिछले slug को रीडायरेक्ट उपनाम के रूप में सुरक्षित रखता है।
- `merge` स्रोत सूची को छिपाता है और स्रोत slug को लक्ष्य सूची पर रीडायरेक्ट करता है।

### स्वामित्व हस्तांतरण एंडपॉइंट

- `POST /api/v1/skills/{slug}/transfer`
  - बॉडी: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - प्रतिक्रिया: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - प्रतिक्रिया (स्वीकार/अस्वीकार/रद्द): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - प्रतिक्रिया आकार: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

किसी उपयोगकर्ता को प्रतिबंधित करें और स्वामित्व वाले Skills को हार्ड-डिलीट करें (केवल मॉडरेटर/एडमिन)।

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

किसी उपयोगकर्ता से प्रतिबंध हटाएं और पात्र Skills को पुनर्स्थापित करें (केवल एडमिन)।

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

किसी मौजूदा प्रतिबंध के संग्रहीत कारण को बिना प्रतिबंध हटाए या
सामग्री पुनर्स्थापित किए बदलें (केवल एडमिन)। जब तक `dryRun` `false` न हो, डिफ़ॉल्ट ड्राई-रन होता है।

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

किसी उपयोगकर्ता की भूमिका बदलें (केवल एडमिन)।

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

उपयोगकर्ताओं को सूचीबद्ध करें या खोजें (केवल एडमिन)।

क्वेरी पैरामीटर:

- `q` (वैकल्पिक): खोज क्वेरी
- `query` (वैकल्पिक): `q` के लिए उपनाम
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

स्टार जोड़ें/हटाएं (हाइलाइट)। दोनों एंडपॉइंट idempotent हैं।

प्रतिक्रियाएं:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## लेगेसी CLI एंडपॉइंट (अप्रचलित)

पुराने CLI संस्करणों के लिए अभी भी समर्थित:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

हटाने की योजना के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। पैकेज
प्रकाशन जो ClawPack tarball को स्टेज करते हैं, उन्हें परिणामी स्टोरेज id को
`clawpack` के रूप में और लौटाए गए टिकट को `clawpackUploadTicket` के रूप में भेजना होगा।

## रजिस्ट्री खोज (`/.well-known/clawhub.json`)

CLI साइट से रजिस्ट्री/प्रमाणीकरण सेटिंग खोज सकता है:

- `/.well-known/clawhub.json` (JSON, वरीय)
- `/.well-known/clawdhub.json` (लेगेसी)

स्कीमा:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप स्वयं होस्ट करते हैं, तो इस फ़ाइल को सर्व करें (या `CLAWHUB_REGISTRY` को स्पष्ट रूप से सेट करें; लेगेसी `CLAWDHUB_REGISTRY`)।
