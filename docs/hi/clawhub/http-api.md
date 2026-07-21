---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण)।
x-i18n:
    generated_at: "2026-07-21T17:01:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d9b3e64cbb9dce522b3c112a8082a5df32eb118c1ce0c97a28d2c397d1cdfbe3
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

आधार URL: `https://clawhub.ai` (डिफ़ॉल्ट)।

सभी v1 पथ `/api/v1/...` के अंतर्गत हैं।
संगतता के लिए पुराने `/api/...` और `/api/cli/...` बने हुए हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`।

## सार्वजनिक कैटलॉग का पुनः उपयोग

तृतीय-पक्ष निर्देशिकाएँ ClawHub Skills को सूचीबद्ध करने या खोजने के लिए सार्वजनिक रीड एंडपॉइंट का उपयोग कर सकती हैं। कृपया परिणामों को कैश करें, `429`/`Retry-After` का पालन करें, उपयोगकर्ताओं को प्रामाणिक ClawHub सूची (`https://clawhub.ai/<owner>/skills/<slug>`) से वापस लिंक करें, और ऐसा संकेत देने से बचें कि ClawHub तृतीय-पक्ष साइट का समर्थन करता है। सार्वजनिक API सतह के बाहर छिपी, निजी या मॉडरेशन द्वारा अवरुद्ध सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट सभी रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट को रूट
प्राथमिकता का पुनर्निर्माण करने के बजाय रीड एंडपॉइंट द्वारा लौटाए गए प्रामाणिक URL का
उपयोग करना चाहिए।

## दर सीमाएँ

प्रवर्तन मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer टोकन): प्रति उपयोगकर्ता बकेट लागू।
- यदि टोकन अनुपस्थित/अमान्य है, तो व्यवहार वापस IP प्रवर्तन पर आ जाता है।
- जब सर्वर कारण जानता हो, तो प्रमाणित राइट एंडपॉइंट को केवल `Unauthorized` नहीं लौटाना चाहिए।
  अनुपस्थित टोकन, अमान्य/निरस्त टोकन और हटाए गए/प्रतिबंधित/अक्षम खातों में से
  प्रत्येक के लिए कार्रवाई योग्य टेक्स्ट मिलना चाहिए, ताकि CLI क्लाइंट उपयोगकर्ताओं को बता
  सकें कि उन्हें किस कारण अवरुद्ध किया गया।

- रीड: प्रति IP 3000/मिनट, प्रति कुंजी 12000/मिनट
- राइट: प्रति IP 300/मिनट, प्रति कुंजी 3000/मिनट
- डाउनलोड: प्रति IP 1200/मिनट, प्रति कुंजी 6000/मिनट (डाउनलोड एंडपॉइंट)

हेडर:

- पुरानी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

हेडर का अर्थ:

- `X-RateLimit-Reset`: निरपेक्ष Unix epoch सेकंड
- `RateLimit-Reset`: रीसेट होने तक सेकंड (विलंब)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: उपस्थित होने पर सटीक शेष बजट।
  शार्ड किए गए सफल अनुरोध अनुमानित वैश्विक मान लौटाने के बजाय इस हेडर को छोड़ देते हैं।
- `Retry-After`: `429` पर पुनः प्रयास करने से पहले प्रतीक्षा के सेकंड (विलंब)

`429` प्रतिक्रिया का उदाहरण:

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

दर सीमा पार हो गई
```

क्लाइंट मार्गदर्शन:

- यदि `Retry-After` मौजूद है, तो पुनः प्रयास करने से पहले उतने सेकंड प्रतीक्षा करें।
- समकालिक पुनः प्रयासों से बचने के लिए जिटरयुक्त बैकऑफ़ का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` का उपयोग करें (या `X-RateLimit-Reset` से गणना करें)।

IP स्रोत:

- विश्वसनीय क्लाइंट IP हेडर, जिनमें `cf-connecting-ip` शामिल है, का उपयोग केवल तभी किया जाता है जब
  डिप्लॉयमेंट विश्वसनीय फ़ॉरवर्डेड हेडर को स्पष्ट रूप से सक्षम करता है।
- ClawHub एज पर क्लाइंट IP की पहचान करने के लिए विश्वसनीय फ़ॉरवर्डिंग हेडर का उपयोग करता है।
- यदि कोई विश्वसनीय क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध केवल दर-सीमा के प्रकार
  के दायरे वाले फ़ॉलबैक बकेट का उपयोग करते हैं। इन फ़ॉलबैक बकेट में कॉलर द्वारा दिए गए
  पथ, स्लग, पैकेज नाम, संस्करण, क्वेरी स्ट्रिंग या अन्य आर्टिफ़ैक्ट
  पैरामीटर शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएँ

सार्वजनिक v1 त्रुटि प्रतिक्रियाएँ `content-type: text/plain; charset=utf-8` के साथ सादा टेक्स्ट होती हैं।
इसमें सत्यापन विफलताएँ (`400`), अनुपस्थित सार्वजनिक संसाधन (`404`), प्रमाणीकरण और
अनुमति विफलताएँ (`401`/`403`), दर सीमाएँ (`429`) और अवरुद्ध डाउनलोड शामिल हैं। क्लाइंट को
प्रतिक्रिया बॉडी को मानव-पठनीय स्ट्रिंग के रूप में पढ़ना चाहिए। संगतता के लिए अज्ञात क्वेरी पैरामीटर
अनदेखे किए जाते हैं, लेकिन अमान्य मानों वाले पहचाने गए क्वेरी पैरामीटर
`400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट (प्रमाणीकरण नहीं)

### `GET /api/v1/search`

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक
- `highlightedOnly` (वैकल्पिक): हाइलाइट किए गए Skills तक फ़िल्टर करने के लिए `true`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills को छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` का पुराना उपनाम

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

टिप्पणियाँ:

- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं (एम्बेडिंग समानता + सटीक स्लग/नाम टोकन बूस्ट + लोकप्रियता का छोटा पूर्व-भार)।
- प्रासंगिकता लोकप्रियता से अधिक प्रभावी है। स्लग या प्रदर्शन-नाम टोकन का सटीक मिलान, बहुत अधिक सहभागिता वाले कम सटीक मिलान से ऊपर आ सकता है।
- ASCII टेक्स्ट को शब्द और विराम-चिह्न सीमाओं पर टोकनाइज़ किया जाता है। उदाहरण के लिए, `personal-map` में एक स्वतंत्र `map` टोकन है, जबकि `amap-jsapi-skill` में `amap`, `jsapi` और `skill` हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में अधिक मजबूत शाब्दिक मिलान मिलता है।
- लोकप्रियता लॉग-स्केल की जाती है और उसकी सीमा निर्धारित है। क्वेरी टेक्स्ट का मिलान कमजोर होने पर अधिक सहभागिता वाले Skills की रैंक कम हो सकती है।
- कॉलर फ़िल्टर और वर्तमान मॉडरेशन स्थिति के आधार पर संदिग्ध या छिपी मॉडरेशन स्थिति किसी Skill को सार्वजनिक खोज से हटा सकती है।

प्रकाशक खोज-योग्यता मार्गदर्शन:

- जिन शब्दों को उपयोगकर्ता वास्तव में खोजेंगे, उन्हें प्रदर्शन नाम, सारांश और टैग में रखें। स्वतंत्र स्लग टोकन का उपयोग केवल तभी करें, जब वह एक स्थिर पहचान भी हो जिसे आप बनाए रखना चाहते हैं।
- केवल एक क्वेरी को लक्षित करने के लिए स्लग का नाम न बदलें, जब तक कि नया स्लग दीर्घकालिक रूप से बेहतर प्रामाणिक नाम न हो। पुराने स्लग रीडायरेक्ट उपनाम बन जाते हैं, लेकिन प्रामाणिक URL, प्रदर्शित स्लग और भविष्य के खोज डाइजेस्ट नए स्लग का उपयोग करते हैं।
- नाम-बदलाव उपनाम पुराने URL और रजिस्ट्री के माध्यम से रिज़ॉल्व होने वाले इंस्टॉल के लिए रिज़ॉल्यूशन बनाए रखते हैं, लेकिन नाम-बदलाव के इंडेक्स होने के बाद खोज रैंकिंग प्रामाणिक Skill मेटाडेटा पर आधारित होती है। मौजूदा आँकड़े Skill के साथ बने रहते हैं।
- यदि कोई Skill अनपेक्षित रूप से दिखाई नहीं दे रहा है, तो रैंकिंग-संबंधित मेटाडेटा बदलने से पहले लॉग इन रहते हुए `clawhub inspect @owner/slug` से मॉडरेशन स्थिति जाँचें।

### `GET /api/v1/skills`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–200)
- `cursor` (वैकल्पिक): किसी भी गैर-`trending` क्रम के लिए पृष्ठांकन कर्सर
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended` (उपनाम: `default`), `createdAt` (उपनाम: `newest`), `downloads`, `stars` (उपनाम: `rating`), पुराने इंस्टॉल उपनाम `installsCurrent`/`installs`/`installsAllTime` को `downloads`, `trending` पर मैप किया जाता है
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills को छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` का पुराना उपनाम

`sort` के अमान्य मान `400` लौटाते हैं।

टिप्पणियाँ:

- `recommended` सहभागिता और नवीनता संकेतों का उपयोग करता है।
- `trending` पिछले 7 दिनों के इंस्टॉल के आधार पर रैंक करता है (टेलीमेट्री-आधारित)।
- `createdAt` नए Skill क्रॉल के लिए स्थिर रहता है; मौजूदा Skills को पुनः प्रकाशित करने पर `updated` बदलता है।
- जब `nonSuspiciousOnly=true`, तो कर्सर-आधारित क्रम किसी पृष्ठ पर `limit` से कम आइटम लौटा सकते हैं, क्योंकि पृष्ठ पुनर्प्राप्ति के बाद संदिग्ध Skills फ़िल्टर किए जाते हैं।
- उपस्थित होने पर पृष्ठांकन जारी रखने के लिए `nextCursor` का उपयोग करें। केवल छोटा पृष्ठ मिलने का अर्थ यह नहीं है कि परिणाम समाप्त हो गए हैं।

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

टिप्पणियाँ:

- स्वामी के नाम-बदलाव/मर्ज प्रवाहों द्वारा बनाए गए पुराने स्लग प्रामाणिक Skill पर रिज़ॉल्व होते हैं।
- `metadata.os`: Skill फ्रंटमैटर में घोषित OS प्रतिबंध (जैसे `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix सिस्टम लक्ष्य (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि Skill में कोई प्लेटफ़ॉर्म मेटाडेटा नहीं है, तो `metadata`, `null` होता है।
- `moderation` केवल तभी शामिल होता है, जब Skill फ़्लैग किया गया हो या स्वामी उसे देख रहा हो।

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

टिप्पणियाँ:

- स्वामी और मॉडरेटर छिपे हुए Skills के मॉडरेशन विवरण तक पहुँच सकते हैं।
- सार्वजनिक कॉलर को पहले से फ़्लैग किए गए दृश्यमान Skills के लिए केवल `200` मिलता है।
- सार्वजनिक कॉलर के लिए साक्ष्य संपादित किया जाता है और इसमें केवल स्वामियों/मॉडरेटर के लिए कच्चे स्निपेट शामिल होते हैं।

### `POST /api/v1/skills/{slug}/report`

मॉडरेटर समीक्षा के लिए किसी Skill की रिपोर्ट करें। रिपोर्ट Skill-स्तर की होती हैं, वैकल्पिक रूप से
किसी संस्करण से लिंक होती हैं और Skill रिपोर्ट कतार में भेजी जाती हैं।

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

Skill रिपोर्ट प्राप्त करने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed` या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-200)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

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
      "reason": "संदिग्ध इंस्टॉल चरण",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "रिपोर्टर"
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

स्किल रिपोर्ट का समाधान करने या उन्हें फिर से खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

अनुरोध:

```json
{ "status": "confirmed", "note": "समीक्षा की और प्रभावित संस्करण छिपाया।", "finalAction": "hide" }
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open` पर
सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट-योग्य कार्यप्रवाह में स्किल छिपाने के लिए ट्राइएज की गई
रिपोर्ट के साथ `finalAction: "hide"` पास करें।

### `GET /api/v1/skills/{slug}/versions`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

### `GET /api/v1/skills/{slug}/versions/{version}`

संस्करण मेटाडेटा + फ़ाइलों की सूची लौटाता है।

- `version.security` उपलब्ध होने पर सामान्यीकृत स्कैन सत्यापन स्थिति और स्कैनर विवरण
  (VirusTotal + LLM) शामिल करता है।

### `GET /api/v1/skills/{slug}/scan`

स्किल संस्करण के लिए सुरक्षा स्कैन सत्यापन विवरण लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किए गए संस्करण को रिज़ॉल्व करें (उदाहरण के लिए `latest`)।

नोट्स:

- यदि न तो `version` और न ही `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति के साथ स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तभी `true` होता है, जब किसी स्कैनर ने निर्णायक निष्कर्ष (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से प्राप्त वर्तमान स्किल-स्तरीय मॉडरेशन स्नैपशॉट है।
- ऐतिहासिक संस्करण की क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` की जाँच करें।

### `POST /api/v1/skills/-/scan`

नई ClawScan जॉब सबमिट करने के लिए प्रमाणित एंडपॉइंट।

स्थानीय अपलोड स्कैन अब समर्थित नहीं हैं। `multipart/form-data` या
`{ "source": { "kind": "upload" } }` का उपयोग करने वाले अनुरोध `410` लौटाते हैं।

प्रकाशित स्कैन JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- अवधारण अवधि समाप्त होने के बाद स्कैन अनुरोध पेलोड और डाउनलोड योग्य रिपोर्ट स्कैन-अनुरोध स्टोर से समाप्त हो जाते हैं।
- प्रकाशित स्कैन के लिए स्वामी/प्रकाशक प्रबंधन पहुँच या प्लेटफ़ॉर्म मॉडरेटर/एडमिन प्राधिकार आवश्यक है।
- प्रकाशित स्कैन केवल तभी वापस लिखते हैं, जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो जाए।
- प्रतिक्रिया `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` के साथ `202` होती है।
- स्कैन जॉब अतुल्यकालिक हैं। मैन्युअल स्कैन अनुरोधों को सामान्य प्रकाशन/बैकफ़िल कार्य से पहले प्राथमिकता दी जाती है, लेकिन उनका पूरा होना फिर भी वर्कर की उपलब्धता पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणित पोल एंडपॉइंट।

- कतारबद्ध/चल रही/सफल/विफल स्थिति लौटाता है।
- कतारबद्ध रहने के दौरान `queue.queuedAhead` और `queue.position` लौटाता है, ताकि क्लाइंट दिखा सकें कि अनुरोध से पहले कितने प्राथमिकता-प्राप्त मैन्युअल स्कैन हैं। बहुत बड़ी कतारों को सीमित किया जाता है और `queuedAheadIsEstimate: true` के साथ रिपोर्ट किया जाता है।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` अनुभाग होते हैं।
- विफल स्कैन जॉब `lastError` के साथ `status: "failed"` लौटाते हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणित रिपोर्ट आर्काइव एंडपॉइंट।

- सफल स्कैन आवश्यक है; गैर-टर्मिनल स्कैन `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` वाली ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए संस्करणों के लिए प्रमाणित संग्रहीत रिपोर्ट आर्काइव एंडपॉइंट।

- स्किल या Plugin तक स्वामी/प्रकाशक प्रबंधन पहुँच अथवा प्लेटफ़ॉर्म मॉडरेटर/एडमिन प्राधिकार आवश्यक है।
- ब्लॉक किए गए या छिपे संस्करणों सहित, सटीक सबमिट किए गए संस्करण के संग्रहीत स्कैन परिणाम लौटाता है।
- `kind` का डिफ़ॉल्ट `skill` है; Plugin/पैकेज स्कैन के लिए `kind=plugin` का उपयोग करें।
- स्कैन-अनुरोध डाउनलोड के समान ZIP संरचना लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

केवल एडमिन के लिए प्रामाणिक बैच रीस्कैन रूट। यह पुराने `POST /api/v1/skills/-/rescan-batch` के समान पेलोड संरचना स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

केवल एडमिन के लिए प्रामाणिक बैच स्थिति रूट। यह `{ "jobIds": ["..."] }` स्वीकार करता है और पुराने `POST /api/v1/skills/-/rescan-batch/status` के समान समग्र काउंटर लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला स्किल कार्ड सत्यापन एनवेलप लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किए गए संस्करण को रिज़ॉल्व करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तभी `true` होता है, जब चयनित संस्करण के लिए स्किल कार्ड जनरेट किया गया हो, वह मॉडरेशन द्वारा मैलवेयर के कारण ब्लॉक न हो, और ClawScan सत्यापन क्लीन हो।
- स्किल पहचान, प्रकाशक पहचान और चयनित संस्करण मेटाडेटा शीर्ष-स्तरीय एनवेलप फ़ील्ड (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं, ताकि शेल ऑटोमेशन नेस्टेड रैपर खोले बिना उन्हें पढ़ सके।
- `security` शीर्ष-स्तरीय ClawScan/सुरक्षा निष्कर्ष है। ऑटोमेशन को `ok`, `decision`, `reasons`, और `security.status` के आधार पर निर्णय लेना चाहिए।
- `security.signals` में `staticScan`, `virusTotal`, और `skillSpector` जैसे सहायक स्कैनर साक्ष्य होते हैं।
- `security.signals.dependencyRegistry` को v1 प्रतिक्रिया संगतता के लिए बनाए रखा गया है, लेकिन डिपेंडेंसी रजिस्ट्री अस्तित्व स्कैनर को बंद कर दिया गया है और यह कुंजी हमेशा `null` होती है।
- `provenance` केवल तभी `server-resolved-github-import` होता है, जब ClawHub ने प्रकाशन या आयात के दौरान GitHub रेपो/रेफ़/कमिट/पाथ को रिज़ॉल्व और संग्रहीत किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

सटीक स्किल संस्करणों के लिए वर्तमान संक्षिप्त सुरक्षा निष्कर्ष लौटाता है। यह
संग्रह एंडपॉइंट उन क्लाइंट के लिए है, जिन्हें पहले से पता है कि उन्हें कौन-से इंस्टॉल किए गए
ClawHub स्किल संस्करण प्रदर्शित करने हैं, जैसे OpenClaw Control UI।

अनुरोध:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

नोट्स:

- `items` में 1-100 अद्वितीय `{ slug, version }` युग्म होने चाहिए।
- परिणाम प्रत्येक आइटम के अनुसार होते हैं; किसी एक अनुपलब्ध स्किल या संस्करण से पूरी प्रतिक्रिया विफल नहीं होती।
- प्रतिक्रिया केवल सुरक्षा-संबंधी है। इसमें स्किल कार्ड डेटा, जनरेट किए गए कार्ड की स्थिति, आर्टिफ़ैक्ट फ़ाइल सूचियाँ या विस्तृत स्कैनर पेलोड शामिल नहीं हैं।
- `security.signals` में केवल स्थिति-स्तरीय सहायक साक्ष्य होते हैं; पूर्ण स्कैनर विवरण के लिए `/scan` या ClawHub सुरक्षा-ऑडिट पेज का उपयोग करें।
- `security.signals.dependencyRegistry` को v1 प्रतिक्रिया संगतता के लिए बनाए रखा गया है, लेकिन डिपेंडेंसी रजिस्ट्री अस्तित्व स्कैनर को बंद कर दिया गया है और यह कुंजी हमेशा `null` होती है।
- स्किल कार्ड की अनुपस्थिति इस एंडपॉइंट के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; जब क्लाइंट को कार्ड सामग्री चाहिए, तो उन्हें इंस्टॉल किए गए `skill-card.md` को स्थानीय रूप से पढ़ना चाहिए।
- जब आपको एकल-स्किल स्किल कार्ड सत्यापन एनवेलप चाहिए, तब `/verify`; जनरेट किया गया कार्ड Markdown चाहिए, तब `/card`; और विस्तृत स्कैनर डेटा चाहिए, तब `/scan` का उपयोग करें।

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
      "error": { "code": "version_not_found", "message": "संस्करण नहीं मिला" },
      "security": null
    }
  ]
}
```

### `GET /api/v1/skills/{slug}/file`

सटीक संग्रहीत फ़ाइल बाइट्स को डाउनलोड के रूप में लौटाता है। सीमित एस्केप्ड-टेक्स्ट
पूर्वावलोकन का अनुरोध करने के लिए `preview=1` जोड़ें; मान्य UTF-8 बाइट्स वाली किसी भी फ़ाइल का पूर्वावलोकन किया जा सकता है, चाहे उसका एक्सटेंशन या MIME
मेटाडेटा कुछ भी हो।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)
- `preview=1` (वैकल्पिक; बाइट्स के मान्य UTF-8 न होने पर `text/plain` या `415` लौटाता है)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम संस्करण का उपयोग करता है।
- रॉ डाउनलोड सीमा: 10MB।
- टेक्स्ट पूर्वावलोकन सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग एंडपॉइंट:

- स्किल
- कोड Plugin
- बंडल Plugin

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, पुराना उपनाम `installs`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। केवल तभी समर्थित है, जब
  अनुरोध Plugin पैकेजों (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या `family=code-plugin`/`family=bundle-plugin`
  वाले पैकेज एंडपॉइंट) तक सीमित हो। नियंत्रित श्रेणियाँ और
  पुराने v1 फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` निश्चित-फ़ैमिली उपनाम बने रहते हैं।
- स्किल प्रविष्टियाँ स्किल रजिस्ट्री द्वारा समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अब भी केवल कोड-Plugin और बंडल-Plugin रिलीज़ के लिए है।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देख सकते हैं।
- प्रमाणित कॉलर सूची/खोज परिणामों में उन प्रकाशकों के निजी पैकेज देख सकते हैं, जिनसे वे संबद्ध हैं।
- `channel=private` केवल वे पैकेज लौटाता है, जिन्हें प्रमाणित कॉलर पढ़ सकता है।

### `GET /api/v1/packages/search`

स्किल + Plugin पैकेजों में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। केवल तभी समर्थित है जब
  अनुरोध का दायरा Plugin पैकेजों तक सीमित हो। नियंत्रित श्रेणियाँ और पुराने v1
  फ़िल्टर उपनामों का दस्तावेज़ीकरण `GET /api/v1/plugins` के अंतर्गत किया गया है।

टिप्पणियाँ:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देख सकते हैं।
- प्रमाणीकृत कॉलर उन प्रकाशकों के निजी पैकेज खोज सकते हैं जिनसे वे संबद्ध हैं।
- `channel=private` केवल वे पैकेज लौटाता है जिन्हें प्रमाणीकृत कॉलर पढ़ सकता है।

### `GET /api/v1/plugins`

कोड-Plugin और बंडल-Plugin पैकेजों में केवल-Plugin कैटलॉग ब्राउज़िंग।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, पुराना उपनाम `installs`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

पुराने v1 फ़िल्टर उपनाम रीड एंडपॉइंट पर अब भी स्वीकार किए जाते हैं:

- `mcp-tooling`, `data`, और `automation`, `tools` में रूपांतरित होते हैं।
- `observability` और `deployment`, `gateway` में रूपांतरित होते हैं।
- `dev-tools`, `runtime` में रूपांतरित होता है।

`trending` सात-दिवसीय इंस्टॉल/डाउनलोड लीडरबोर्ड है और इसमें सर्वकालिक योग का उपयोग नहीं होता।
एकीकृत `/api/v1/packages` एंडपॉइंट पर यह केवल-Plugin है; Skills कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

पुराने उपनाम संग्रहीत या लेखक द्वारा घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Skills का थोक निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड की निचली सीमा।
- `endDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड की ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर का पृष्ठांकन कर्सर।

प्रत्युत्तर:

- बॉडी: ZIP संग्रह।
- प्रत्येक निर्यातित Skill का मूल `{publisher}/{slug}/` पर होता है।
- होस्ट की गई Skills में नवीनतम संग्रहीत संस्करण की फ़ाइलें शामिल होती हैं और उन्हें
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध किया जाता है।
- `clean` या `suspicious` स्कैन वाली वर्तमान GitHub-समर्थित Skills में
  `_source_handoff.json`, `sourceRef: "public-github"`, रिपॉज़िटरी, कमिट, पथ,
  सामग्री हैश और संग्रह URL के साथ शामिल होता है। इनमें ClawHub पर होस्ट की गई स्रोत फ़ाइलें शामिल नहीं होतीं।
- प्रत्येक Skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP के मूल में शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Skills या फ़ाइलें
  निर्यात नहीं की जा सकीं।

हेडर:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Plugin रिलीज़ का थोक निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड की निचली सीमा।
- `endDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड की ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर का पृष्ठांकन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। इसे छोड़ने का अर्थ दोनों
  Plugin परिवार हैं।

प्रत्युत्तर:

- बॉडी: ZIP संग्रह।
- प्रत्येक निर्यातित Plugin का मूल `{family}/{packageName}/` पर होता है।
- प्रत्येक निर्यातित Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP के मूल में शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Plugin या फ़ाइलें
  निर्यात नहीं की जा सकीं।

हेडर:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

कोड-Plugin और बंडल-Plugin पैकेजों में केवल-Plugin खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

टिप्पणियाँ:

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित पुराने v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी डाइजेस्ट पंक्तियों द्वारा समर्थित एक वास्तविक API फ़िल्टर है,
  न कि खोज क्वेरी का पुनर्लेखन।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में उनका पृष्ठांकन नहीं होता।
- Plugin खोज के लिए ब्राउज़र UI के सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को पुनः क्रमबद्ध करते हैं,
  जो वर्तमान `/skills` ब्राउज़ व्यवहार के अनुरूप है।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

टिप्पणियाँ:

- Skills को एकीकृत कैटलॉग में इस रूट के माध्यम से भी हल किया जा सकता है।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ न सके।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और उसकी सभी रिलीज़ को सॉफ़्ट-डिलीट करता है।

टिप्पणियाँ:

- पैकेज स्वामी, संगठन प्रकाशक स्वामी/एडमिन,
  प्लेटफ़ॉर्म मॉडरेटर या प्लेटफ़ॉर्म एडमिन का API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

टिप्पणियाँ:

- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ न सके।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता, सत्यापन, आर्टिफ़ैक्ट मेटाडेटा और स्कैन डेटा सहित
पैकेज का एक संस्करण लौटाता है।

टिप्पणियाँ:

- `version.artifact.kind` पुराने प्रारूप वाले पैकेज संग्रहों के लिए `legacy-zip` या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack` होता है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए बहिष्कृत संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स का हैश बनाता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैनोनिकल रिलीज़ आर्टिफ़ैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ न सके।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए पैकेज रिलीज़ का सटीक सुरक्षा और विश्वास सारांश लौटाता है।
यह निर्णय लेने के लिए सार्वजनिक OpenClaw उपभोग सतह है कि हल की गई रिलीज़
इंस्टॉल की जा सकती है या नहीं।

प्रमाणीकरण:

- सार्वजनिक रीड एंडपॉइंट। स्वामी, प्रकाशक, मॉडरेटर या एडमिन टोकन
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
  हल किए गए रजिस्ट्री पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt`
  मूल्यांकित की गई सटीक रिलीज़ की पहचान करते हैं।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफ़ैक्ट के लिए ज्ञात होने पर
  मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैन्युअल रिलीज़ मॉडरेशन से प्राप्त
  प्रभावी विश्वास स्थिति है।
- `trust.moderationState` नल योग्य है। मैन्युअल रिलीज़
  मॉडरेशन मौजूद न होने पर यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल अवरोध संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को स्कैनर या मॉडरेशन फ़ील्ड से अवरोध नियमों को फिर से निकालने के बजाय,
  इस मान के `true` होने पर इंस्टॉलेशन अवरुद्ध करना चाहिए।
- `trust.reasons` उपयोगकर्ता-दृश्य और ऑडिट स्पष्टीकरण सूची है। कारण कोड
  `manual:quarantined`, `scan:malicious`, और `package:malicious` जैसी
  स्थिर, संक्षिप्त स्ट्रिंग हैं।
- `trust.pending` का अर्थ है कि एक या अधिक विश्वास इनपुट अब भी पूर्ण होने की प्रतीक्षा में हैं।
- `trust.stale` का अर्थ है कि विश्वास सारांश की गणना पुराने इनपुट से की गई थी और
  उच्च-विश्वास अनुमति निर्णय से पहले इसे रीफ़्रेश करना आवश्यक माना जाना चाहिए।

टिप्पणियाँ:

- यह एंडपॉइंट सटीक-संस्करण वाला है। क्लाइंट को इसे उस पैकेज संस्करण को हल करने के बाद कॉल करना चाहिए
  जिसे वे इंस्टॉल करना चाहते हैं, केवल नवीनतम पैकेज मेटाडेटा पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ न सके।
- यह एंडपॉइंट जानबूझकर स्वामी/मॉडरेटर मॉडरेशन एंडपॉइंट से अधिक सीमित है।
  यह इंस्टॉल निर्णय और सार्वजनिक स्पष्टीकरण उजागर करता है, न कि
  रिपोर्टर की पहचान, रिपोर्ट की सामग्री, निजी साक्ष्य या आंतरिक समीक्षा
  समयरेखाएँ।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

पैकेज संस्करण के लिए स्पष्ट आर्टिफ़ैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

टिप्पणियाँ:

- पुराने पैकेज संस्करण एक `legacy-zip` आर्टिफ़ैक्ट और एक पुराना ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण एक `npm-pack` आर्टिफ़ैक्ट, npm अखंडता फ़ील्ड, एक
  `tarballUrl`, और पुराना ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह किसी साझा URL से संग्रह प्रारूप का
  अनुमान लगाने से बचती है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ से संस्करण आर्टिफ़ैक्ट डाउनलोड करता है।

टिप्पणियाँ:

- ClawPack संस्करण अपलोड किए गए npm-pack के ठीक वही `.tgz` बाइट्स स्ट्रीम करते हैं।
- पुराने ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट होते हैं।
- डाउनलोड दर बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

OpenClaw द्वारा भविष्य में उपयोग के लिए परिकलित तत्परता लौटाता है।

तत्परता जाँच में ये शामिल हैं:

- आधिकारिक चैनल की स्थिति
- नवीनतम संस्करण की उपलब्धता
- ClawPack npm-pack आर्टिफ़ैक्ट की उपलब्धता
- आर्टिफ़ैक्ट डाइजेस्ट
- स्रोत रिपॉज़िटरी और कमिट की उत्पत्ति
- OpenClaw संगतता मेटाडेटा
- होस्ट लक्ष्य
- स्कैन की स्थिति

प्रतिक्रिया:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "उदाहरण Plugin",
    "family": "code-plugin",
    "isOfficial": true,
    "latestVersion": "1.2.3"
  },
  "ready": false,
  "checks": [
    {
      "id": "clawpack",
      "label": "ClawPack आर्टिफ़ैक्ट",
      "status": "fail",
      "message": "नवीनतम संस्करण केवल पुराने ZIP प्रारूप में है।"
    }
  ],
  "blockers": ["clawpack"]
}
```

### `GET /api/v1/packages/migrations`

आधिकारिक OpenClaw Plugin माइग्रेशन पंक्तियाँ सूचीबद्ध करने के लिए मॉडरेटर एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता का API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `phase` (वैकल्पिक): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, या
  `all` (डिफ़ॉल्ट)।
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

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
      "blockers": ["ClawPack अनुपलब्ध"],
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

- एडमिन उपयोगकर्ता का API टोकन आवश्यक है।

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
  "blockers": ["ClawPack अनुपलब्ध"],
  "hostTargetsComplete": true,
  "scanClean": false,
  "moderationApproved": false,
  "runtimeBundlesReady": false,
  "notes": "प्रकाशक के अपलोड की प्रतीक्षा है"
}
```

टिप्पणियाँ:

- `bundledPluginId` को लोअरकेस में सामान्यीकृत किया जाता है और यह स्थायी अपसर्ट कुंजी है।
- `packageName` को npm नाम के अनुरूप सामान्यीकृत किया जाता है; नियोजित
  माइग्रेशन के लिए पैकेज अनुपलब्ध हो सकता है।
- यह केवल माइग्रेशन की तत्परता ट्रैक करता है। यह OpenClaw को परिवर्तित या
  ClawPack जनरेट नहीं करता।

### `GET /api/v1/packages/moderation/queue`

पैकेज रिलीज़ समीक्षा कतारों के लिए मॉडरेटर/एडमिन एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता का API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

स्थिति के अर्थ:

- `open`: संदिग्ध, दुर्भावनापूर्ण, लंबित, क्वारंटीन की गई, निरस्त या रिपोर्ट की गई रिलीज़।
- `blocked`: क्वारंटीन की गई, निरस्त या दुर्भावनापूर्ण रिलीज़।
- `manual`: मैन्युअल मॉडरेशन ओवरराइड वाली कोई भी रिलीज़।
- `all`: मैन्युअल ओवरराइड, गैर-स्वच्छ स्कैन स्थिति या पैकेज रिपोर्ट वाली कोई भी रिलीज़।

प्रतिक्रिया:

```json
{
  "items": [
    {
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "उदाहरण Plugin",
      "family": "code-plugin",
      "channel": "community",
      "isOfficial": false,
      "version": "1.2.3",
      "createdAt": 1730000000000,
      "artifactKind": "npm-pack",
      "scanStatus": "malicious",
      "moderationState": "quarantined",
      "moderationReason": "मैन्युअल समीक्षा",
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

मॉडरेटर समीक्षा के लिए पैकेज की रिपोर्ट करें। रिपोर्ट पैकेज-स्तरीय होती हैं और वैकल्पिक रूप से
किसी संस्करण से जुड़ी होती हैं। वे मॉडरेशन कतार में जाती हैं, लेकिन स्वयं पैकेज को स्वतः छिपाती
या डाउनलोड अवरुद्ध नहीं करतीं; आर्टिफ़ैक्ट स्वीकृत करने, क्वारंटीन करने या निरस्त करने के लिए
मॉडरेटर को रिलीज़ मॉडरेशन का उपयोग करना चाहिए।

प्रमाणीकरण:

- API टोकन आवश्यक है।

अनुरोध:

```json
{ "reason": "संदिग्ध नेटिव बाइनरी", "version": "1.2.3" }
```

प्रतिक्रिया:

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

पैकेज रिपोर्ट प्राप्त करने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता का API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

प्रतिक्रिया:

```json
{
  "items": [
    {
      "reportId": "packageReports:...",
      "packageId": "packages:...",
      "releaseId": "packageReleases:...",
      "name": "@openclaw/example-plugin",
      "displayName": "उदाहरण Plugin",
      "family": "code-plugin",
      "version": "1.2.3",
      "reason": "संदिग्ध नेटिव बाइनरी",
      "status": "open",
      "createdAt": 1730000000000,
      "reporter": {
        "userId": "users:...",
        "handle": "reporter",
        "displayName": "रिपोर्टकर्ता"
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

पैकेज मॉडरेशन दृश्यता के लिए स्वामी/मॉडरेटर एंडपॉइंट।

प्रमाणीकरण:

- पैकेज स्वामी, प्रकाशक सदस्य, मॉडरेटर या
  एडमिन उपयोगकर्ता का API टोकन आवश्यक है।

प्रतिक्रिया:

```json
{
  "package": {
    "packageId": "packages:...",
    "name": "@openclaw/example-plugin",
    "displayName": "उदाहरण Plugin",
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
    "moderationReason": "मैन्युअल समीक्षा",
    "blockedFromDownload": true,
    "reasons": ["manual:quarantined", "scan:malicious", "reports:2"],
    "createdAt": 1730000000000
  }
}
```

### `POST /api/v1/packages/reports/{reportId}/triage`

पैकेज रिपोर्ट हल करने या दोबारा खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "समीक्षा की गई और प्रभावित रिलीज़ को क्वारंटीन किया गया।",
  "finalAction": "quarantine"
}
```

`note`, `confirmed` और `dismissed` के लिए आवश्यक है; `status` को वापस
`open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट-योग्य कार्यप्रवाह में रिलीज़
मॉडरेशन लागू करने के लिए पुष्टि की गई रिपोर्ट के साथ `finalAction: "quarantine"` या
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
{ "state": "quarantined", "reason": "संदिग्ध नेटिव पेलोड।" }
```

समर्थित स्थितियाँ:

- `approved`: मैन्युअल रूप से समीक्षा करके अनुमति दी गई।
- `quarantined`: आगे की कार्रवाई तक अवरुद्ध।
- `revoked`: पहले विश्वसनीय मानी गई रिलीज़ को बाद में अवरुद्ध किया गया।

क्वारंटीन और निरस्त की गई रिलीज़ आर्टिफ़ैक्ट डाउनलोड रूट से `403` लौटाती हैं।
हर परिवर्तन एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

संग्रहीत पैकेज फ़ाइल के ठीक वही बाइट्स डाउनलोड के रूप में लौटाता है। Skills फ़ाइलों के लिए उपयोग किए जाने वाले समान सीमित
UTF-8 टेक्स्ट पूर्वावलोकन का अनुरोध करने हेतु `preview=1` जोड़ें।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)
- `preview=1` (वैकल्पिक; बाइट्स मान्य UTF-8 न होने पर `text/plain` या `415` लौटाता है)

टिप्पणियाँ:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- डाउनलोड बकेट के बजाय रीड दर बकेट का उपयोग करता है।
- रॉ डाउनलोड सीमा: 10MB।
- टेक्स्ट पूर्वावलोकन सीमा: 200KB; अपारदर्शी फ़ाइलें केवल पूर्वावलोकन अनुरोधों के लिए `415` लौटाती हैं।
- लंबित VirusTotal स्कैन रीड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ फिर भी अन्य स्थानों पर रोकी जा सकती हैं।
- जब तक कॉलर को स्वामी प्रकाशक को पढ़ने की अनुमति न हो, निजी पैकेज `404` लौटाते हैं।

### `GET /api/v1/packages/{name}/download`

पैकेज रिलीज़ के लिए पुराना निर्धारक ZIP संग्रह डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- Skills को `GET /api/v1/download` पर रीडायरेक्ट किया जाता है।
- Plugin/पैकेज संग्रह ऐसी zip फ़ाइलें हैं जिनका रूट `package/` होता है, ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह रूट केवल ZIP के लिए बना रहता है। यह ClawPack की `.tgz` फ़ाइलें स्ट्रीम नहीं करता।
- रिज़ॉल्वर की अखंडता जाँच के लिए प्रतिक्रियाओं में `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल रजिस्ट्री वाला मेटाडेटा डाउनलोड किए गए संग्रह में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं।
- जब तक कॉलर स्वामी न हो, निजी पैकेज `404` लौटाते हैं।

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत पैक्युमेंट लौटाता है।

टिप्पणियाँ:

- केवल अपलोड किए गए ClawPack npm-pack टारबॉल वाले संस्करण सूचीबद्ध किए जाते हैं।
- पुराने केवल-ZIP संस्करण जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत
  फ़ील्ड का उपयोग करते हैं, ताकि उपयोगकर्ता चाहें तो npm को मिरर पर निर्देशित कर सकें।
- स्कोप किए गए पैकेज पैक्युमेंट `/api/npm/@scope/name` और npm के
  एन्कोड किए गए `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm मिरर क्लाइंट के लिए अपलोड किए गए ClawPack टारबॉल के ठीक वही बाइट्स स्ट्रीम करता है।

टिप्पणियाँ:

- डाउनलोड दर बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 के साथ npm अखंडता/shasum मेटाडेटा शामिल होता है।
- मॉडरेशन और निजी पैकेज पहुँच जाँच अब भी लागू होती हैं।

### `GET /api/v1/resolve`

स्थानीय फ़िंगरप्रिंट को ज्ञात संस्करण से मैप करने के लिए CLI द्वारा उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): बंडल फ़िंगरप्रिंट का 64-वर्णीय हेक्स sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

होस्ट किए गए skill संस्करण की ZIP डाउनलोड करता है, या ऐसे वर्तमान GitHub-समर्थित skill के लिए GitHub स्रोत हैंडऑफ़ लौटाता है जिसमें `clean` या `suspicious` स्कैन हो और कोई होस्ट किया गया संस्करण न हो।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (उदा. `latest`)

टिप्पणियाँ:

- यदि न तो `version` और न ही `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग किया जाता है।
- सॉफ़्ट-डिलीट किए गए संस्करण `410` लौटाते हैं।
- GitHub-समर्थित skill हैंडऑफ़ बाइट्स को प्रॉक्सी या मिरर नहीं करते। JSON प्रतिक्रिया में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; स्कैन/वर्तमान स्थिति एक गेट है और सफलता
  पेलोड मेटाडेटा के रूप में शामिल नहीं होती।
- डाउनलोड आँकड़े प्रति UTC दिन अद्वितीय पहचानों के रूप में गिने जाते हैं (API टोकन मान्य होने पर `userId`, अन्यथा IP)।

## प्रमाणीकरण एंडपॉइंट (Bearer टोकन)

सभी एंडपॉइंट के लिए आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन को सत्यापित करता है और उपयोगकर्ता हैंडल लौटाता है।

### `POST /api/v1/skills`

एक नया संस्करण प्रकाशित करता है।

- वरीय: `payload` JSON + `files[]` ब्लॉब के साथ `multipart/form-data`।
- `files` (storageId-आधारित) वाली JSON बॉडी भी स्वीकार की जाती है।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर API उस
  प्रकाशक को सर्वर-साइड हल करता है और कर्ता के पास प्रकाशक पहुँच होना आवश्यक बनाता है।
- वैकल्पिक पेलोड फ़ील्ड: `migrateOwner`। `ownerHandle` के साथ `true` होने पर,
  किसी मौजूदा skill को उस स्वामी के पास स्थानांतरित किया जा सकता है, यदि कर्ता वर्तमान
  और लक्ष्य, दोनों प्रकाशकों पर एडमिन/स्वामी हो। इस स्पष्ट सहमति के बिना स्वामी परिवर्तन
  अस्वीकार कर दिए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है।

- Bearer टोकन प्रमाणीकरण आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत फ़ॉर्म फ़ील्ड `payload`, दोहराए गए `files` ब्लॉब, या एक `clawpack`
  टारबॉल संदर्भ हैं। `clawpack` एक `.tgz` ब्लॉब या
  upload-url प्रवाह द्वारा लौटाई गई स्टोरेज आईडी हो सकती है। चरणबद्ध storage-id प्रकाशनों में उस अपलोड URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- `files` या `clawpack` में से किसी एक का उपयोग करें, एक ही अनुरोध में दोनों का कभी नहीं।
- JSON बॉडी और कॉलर द्वारा दिए गए `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार किए जाते हैं।
- प्रत्यक्ष multipart प्रकाशन अनुरोध 18MB तक सीमित हैं। ClawPack टारबॉल
  120MB टारबॉल सीमा तक upload-url प्रवाह का उपयोग कर सकते हैं।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर केवल एडमिन उस स्वामी की ओर से प्रकाशित कर सकते हैं।

सत्यापन की मुख्य बातें:

- `family`, `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin पैकेज के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` अपलोड में
  यह `package/openclaw.plugin.json` पर मौजूद होना चाहिए।
- कोड Plugin के लिए `package.json`, स्रोत रिपॉज़िटरी मेटाडेटा, स्रोत कमिट
  मेटाडेटा, कॉन्फ़िग स्कीमा मेटाडेटा, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` संगठन प्रकाशक और वर्तमान `openclaw` संगठन सदस्यों के
  निजी प्रकाशक `official` चैनल पर प्रकाशित कर सकते हैं।
- दूसरे की ओर से किए गए प्रकाशन भी लक्ष्य स्वामी खाते के विरुद्ध आधिकारिक-चैनल पात्रता को सत्यापित करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

किसी skill को सॉफ़्ट-डिलीट / पुनर्स्थापित करें (स्वामी, मॉडरेटर या एडमिन)।

वैकल्पिक JSON बॉडी:

```json
{ "reason": "कानूनी समीक्षा लंबित होने के कारण मॉडरेशन के लिए रोका गया।" }
```

मौजूद होने पर `reason` को skill मॉडरेशन नोट के रूप में संग्रहीत किया जाता है और ऑडिट लॉग में कॉपी किया जाता है।
स्वामी द्वारा शुरू किए गए सॉफ़्ट डिलीट स्लग को 30 दिनों के लिए आरक्षित रखते हैं, जिसके बाद
कोई अन्य प्रकाशक उस स्लग का दावा कर सकता है। यह समाप्ति लागू होने पर डिलीट प्रतिक्रिया में `slugReservedUntil` शामिल होता है।
मॉडरेटर/एडमिन द्वारा छिपाना और सुरक्षा संबंधी निष्कासन इस तरह समाप्त नहीं होते।

डिलीट प्रतिक्रिया:

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

केवल एडमिन। सुनिश्चित करता है कि किसी हैंडल के लिए संगठन प्रकाशक मौजूद हो। यदि हैंडल अब भी किसी
पुराने साझा उपयोगकर्ता/निजी प्रकाशक की ओर संकेत करता है, तो एंडपॉइंट पहले उसे संगठन प्रकाशक में माइग्रेट करता है।
नए बनाए गए संगठन के लिए `memberHandle` दें; कार्यरत एडमिन को सदस्य के रूप में नहीं जोड़ा जाता।
`memberRole` का डिफ़ॉल्ट `owner` है।

- बॉडी: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- प्रतिक्रिया: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

प्रमाणीकृत स्वयं-सेवा संगठन प्रकाशक निर्माण। एक नया संगठन प्रकाशक बनाता है और
कॉलर को स्वामी के रूप में जोड़ता है। यह एंडपॉइंट मौजूदा उपयोगकर्ता/निजी हैंडल को माइग्रेट नहीं करता और
प्रकाशक को विश्वसनीय/आधिकारिक चिह्नित नहीं करता।

- बॉडी: `{ "handle": "opik", "displayName": "Opik" }`
- प्रतिक्रिया: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब हैंडल पहले से किसी प्रकाशक, उपयोगकर्ता या निजी प्रकाशक द्वारा उपयोग किया जाता है, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल एडमिन। रिलीज़ प्रकाशित किए बिना वैध स्वामी के लिए रूट स्लग और पैकेज नाम आरक्षित करता है।
पैकेज नाम बिना किसी रिलीज़ पंक्ति के निजी प्लेसहोल्डर पैकेज बन जाते हैं, ताकि वही
स्वामी बाद में वास्तविक code-plugin या bundle-plugin रिलीज़ को उस नाम पर प्रकाशित कर सके।

- बॉडी: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- प्रतिक्रिया: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल एडमिन। Convex Auth खाता पंक्तियों को संपादित किए बिना सत्यापित प्रतिस्थापन GitHub OAuth प्रिंसिपल के लिए
निजी प्रकाशक को पुनर्प्राप्त करता है। अनुरोध में दोनों अपरिवर्तनीय GitHub
प्रदाता खाता आईडी का नाम देना आवश्यक है; परिवर्तनीय हैंडल केवल ऑपरेटर-सामना गार्ड के रूप में उपयोग किए जाते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से dry-run होता है। पुनर्प्राप्ति लागू करने के लिए स्टाफ द्वारा दोनों
GitHub प्रिंसिपल के बीच निरंतरता का स्वतंत्र सत्यापन करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब गंतव्य उपयोगकर्ता के वर्तमान निजी
प्रकाशक के पास skills, पैकेज या GitHub skill स्रोत होते हैं, तो पुनर्प्राप्ति विफलता की स्थिति में बंद रहती है।
पुनर्प्राप्ति, पुनर्प्राप्त प्रकाशक के skills, skill स्लग उपनामों, पैकेजों,
पैकेज इंस्पेक्टर चेतावनियों और व्युत्पन्न खोज डाइजेस्ट पंक्तियों के पुराने `ownerUserId` फ़ील्ड भी माइग्रेट करती है, ताकि
प्रत्यक्ष-स्वामी पथ नए प्रकाशक प्राधिकार के अनुरूप हों। पुनर्प्राप्त हैंडल का सक्रिय सुरक्षित-हैंडल
आरक्षण भी प्रतिस्थापन उपयोगकर्ता को पुनः सौंपा जाता है, ताकि बाद का
प्रोफ़ाइल सिंक्रनाइज़ेशन पूर्व उपयोगकर्ता के प्रतिस्पर्धी प्राधिकार को पुनर्स्थापित न कर सके। प्रत्येक प्राथमिक तालिका प्रति लागू लेनदेन
100 पंक्तियों तक सीमित है; बड़ी पुनर्प्राप्तियों में पहले पुनः आरंभ किए जा सकने वाले स्वामी माइग्रेशन का उपयोग करना आवश्यक है।
GitHub skill स्रोत प्रकाशक-स्कोप वाले हैं और पुनर्लिखित किए जाने के बजाय जाँचे गए के रूप में रिपोर्ट किए जाते हैं।

- बॉडी: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- प्रतिक्रिया: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### स्वामी स्लग प्रबंधन एंडपॉइंट

- `POST /api/v1/skills/{slug}/rename`
  - बॉडी: `{ "newSlug": "new-canonical-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - बॉडी: `{ "targetSlug": "canonical-target-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

टिप्पणियाँ:

- दोनों एंडपॉइंट के लिए API टोकन प्रमाणीकरण आवश्यक है और ये केवल skill स्वामी के लिए काम करते हैं।
- `rename` पिछले स्लग को रीडायरेक्ट उपनाम के रूप में संरक्षित रखता है।
- `merge` स्रोत सूची को छिपाता है और स्रोत स्लग को लक्ष्य सूची पर रीडायरेक्ट करता है।

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
  - प्रतिक्रिया संरचना: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

किसी उपयोगकर्ता को प्रतिबंधित करें और उसके स्वामित्व वाले skills को स्थायी रूप से हटाएँ (केवल मॉडरेटर/एडमिन)।

बॉडी:

```json
{ "handle": "user_handle", "reason": "वैकल्पिक प्रतिबंध कारण" }
```

या

```json
{ "userId": "users_...", "reason": "वैकल्पिक प्रतिबंध कारण" }
```

प्रतिक्रिया:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

किसी उपयोगकर्ता का प्रतिबंध हटाएँ और पात्र skills को पुनर्स्थापित करें (केवल एडमिन)।

बॉडी:

```json
{ "handle": "user_handle", "reason": "प्रतिबंध हटाने का वैकल्पिक कारण" }
```

या

```json
{ "userId": "users_...", "reason": "प्रतिबंध हटाने का वैकल्पिक कारण" }
```

प्रतिक्रिया:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

प्रतिबंध हटाए या सामग्री पुनर्स्थापित किए बिना किसी मौजूदा प्रतिबंध का संग्रहीत कारण बदलें
(केवल एडमिन)। जब तक `dryRun`, `false` न हो, डिफ़ॉल्ट रूप से dry-run होता है।

बॉडी:

```json
{ "handle": "user_handle", "reason": "थोक प्रकाशन स्पैम", "dryRun": true }
```

या

```json
{ "userId": "users_...", "reason": "थोक प्रकाशन स्पैम", "dryRun": false }
```

प्रतिक्रिया:

```json
{
  "ok": true,
  "dryRun": false,
  "userId": "users_...",
  "handle": "user_handle",
  "previousReason": "मैलवेयर स्वतः-प्रतिबंध",
  "nextReason": "थोक प्रकाशन स्पैम",
  "changed": true
}
```

### `POST /api/v1/users/role`

उपयोगकर्ता भूमिका बदलें (केवल एडमिन)।

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

उपयोगकर्ताओं की सूची बनाएँ या खोजें (केवल एडमिन)।

क्वेरी पैरामीटर:

- `q` (वैकल्पिक): खोज क्वेरी
- `query` (वैकल्पिक): `q` का उपनाम
- `limit` (वैकल्पिक): अधिकतम परिणाम (डिफ़ॉल्ट 20, अधिकतम 200)

प्रतिक्रिया:

```json
{
  "items": [
    {
      "userId": "users_...",
      "handle": "user_handle",
      "displayName": "उपयोगकर्ता",
      "name": "उपयोगकर्ता",
      "role": "moderator"
    }
  ],
  "total": 1
}
```

### `POST /api/v1/stars/{slug}` / `DELETE /api/v1/stars/{slug}`

एक स्टार जोड़ें/हटाएँ (हाइलाइट)। दोनों एंडपॉइंट आइडेम्पोटेंट हैं।

प्रतिक्रियाएँ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## पुराने CLI एंडपॉइंट (बहिष्कृत)

पुराने CLI संस्करणों के लिए अब भी समर्थित:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

हटाने की योजना के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url`, `uploadUrl` और `uploadTicket` लौटाता है। ClawPack टारबॉल को चरणबद्ध करने वाले पैकेज
प्रकाशनों को परिणामी स्टोरेज आईडी `clawpack` के रूप में और लौटाया गया टिकट
`clawpackUploadTicket` के रूप में भेजना आवश्यक है।

## रजिस्ट्री खोज (`/.well-known/clawhub.json`)

CLI साइट से रजिस्ट्री/प्रमाणीकरण सेटिंग खोज सकता है:

- `/.well-known/clawhub.json` (JSON, वरीय)
- `/.well-known/clawdhub.json` (पुराना)

स्कीमा:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप स्वयं होस्ट करते हैं, तो यह फ़ाइल सर्व करें (या `CLAWHUB_REGISTRY` को स्पष्ट रूप से सेट करें; पुराना `CLAWDHUB_REGISTRY`)।
