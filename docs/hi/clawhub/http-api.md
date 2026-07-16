---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण)।
x-i18n:
    generated_at: "2026-07-16T13:43:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

आधार URL: `https://clawhub.ai` (डिफ़ॉल्ट)।

सभी v1 पथ `/api/v1/...` के अंतर्गत हैं।
पुराने `/api/...` और `/api/cli/...` संगतता के लिए उपलब्ध हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`।

## सार्वजनिक कैटलॉग का पुनः उपयोग

तृतीय-पक्ष निर्देशिकाएँ ClawHub Skills को सूचीबद्ध करने या खोजने के लिए सार्वजनिक रीड एंडपॉइंट का उपयोग कर सकती हैं। कृपया परिणामों को कैश करें, `429`/`Retry-After` का पालन करें, उपयोगकर्ताओं को प्रामाणिक ClawHub सूची (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस ले जाएँ और ऐसा संकेत देने से बचें कि ClawHub तृतीय-पक्ष साइट का समर्थन करता है। सार्वजनिक API सतह के बाहर छिपी, निजी या मॉडरेशन द्वारा अवरुद्ध सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट सभी रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट को रूट
प्राथमिकता का पुनर्निर्माण करने के बजाय रीड एंडपॉइंट द्वारा लौटाए गए प्रामाणिक URL का
उपयोग करना चाहिए।

## दर सीमाएँ

प्रवर्तन मॉडल:

- अनाम अनुरोध: प्रति IP प्रवर्तित।
- प्रमाणित अनुरोध (मान्य Bearer टोकन): प्रति उपयोगकर्ता बकेट प्रवर्तित।
- यदि टोकन अनुपस्थित/अमान्य है, तो व्यवहार IP प्रवर्तन पर वापस आ जाता है।
- जब सर्वर को कारण ज्ञात हो, तो प्रमाणित राइट एंडपॉइंट को केवल `Unauthorized` नहीं लौटाना चाहिए।
  अनुपस्थित टोकन, अमान्य/निरस्त टोकन और हटाए गए/प्रतिबंधित/अक्षम खातों में से प्रत्येक के
  लिए कार्रवाई योग्य टेक्स्ट मिलना चाहिए, ताकि CLI क्लाइंट उपयोगकर्ताओं को बता सकें कि
  उन्हें किस कारण से अवरुद्ध किया गया।

- रीड: प्रति IP 3000/मिनट, प्रति कुंजी 12000/मिनट
- राइट: प्रति IP 300/मिनट, प्रति कुंजी 3000/मिनट
- डाउनलोड: प्रति IP 1200/मिनट, प्रति कुंजी 6000/मिनट (डाउनलोड एंडपॉइंट)

हेडर:

- पुरानी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

हेडर के अर्थ:

- `X-RateLimit-Reset`: निरपेक्ष Unix epoch सेकंड
- `RateLimit-Reset`: रीसेट होने तक सेकंड (विलंब)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: उपलब्ध होने पर शेष सटीक बजट।
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

क्लाइंट के लिए मार्गदर्शन:

- यदि `Retry-After` मौजूद है, तो पुनः प्रयास करने से पहले उतने सेकंड प्रतीक्षा करें।
- समकालिक पुनः प्रयासों से बचने के लिए जिटरयुक्त बैकऑफ़ का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` का उपयोग करें (या `X-RateLimit-Reset` से गणना करें)।

IP स्रोत:

- विश्वसनीय क्लाइंट IP हेडर का उपयोग केवल तभी किया जाता है, जिनमें `cf-connecting-ip` भी शामिल है, जब
  डिप्लॉयमेंट विश्वसनीय फ़ॉरवर्डेड हेडर को स्पष्ट रूप से सक्षम करता है।
- ClawHub एज पर क्लाइंट IP की पहचान करने के लिए विश्वसनीय फ़ॉरवर्डिंग हेडर का उपयोग करता है।
- यदि कोई विश्वसनीय क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध केवल दर-सीमा के प्रकार
  के दायरे वाले फ़ॉलबैक बकेट का उपयोग करते हैं। इन फ़ॉलबैक बकेट में
  कॉलर द्वारा दिए गए पथ, स्लग, पैकेज नाम, संस्करण, क्वेरी स्ट्रिंग या अन्य
  आर्टिफ़ैक्ट पैरामीटर शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएँ

सार्वजनिक v1 त्रुटि प्रतिक्रियाएँ `content-type: text/plain; charset=utf-8` के साथ सादा टेक्स्ट होती हैं।
इसमें सत्यापन विफलताएँ (`400`), अनुपस्थित सार्वजनिक संसाधन (`404`), प्रमाणीकरण और
अनुमति विफलताएँ (`401`/`403`), दर सीमाएँ (`429`) और अवरुद्ध डाउनलोड शामिल हैं। क्लाइंट को
प्रतिक्रिया बॉडी को मानव-पठनीय स्ट्रिंग के रूप में पढ़ना चाहिए। अज्ञात क्वेरी पैरामीटर
संगतता के लिए अनदेखे किए जाते हैं, लेकिन अमान्य मानों वाले पहचाने गए क्वेरी पैरामीटर
`400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट (प्रमाणीकरण आवश्यक नहीं)

### `GET /api/v1/search`

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक
- `highlightedOnly` (वैकल्पिक): प्रमुखता से प्रदर्शित Skills तक फ़िल्टर करने के लिए `true`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
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

- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं (एम्बेडिंग समानता + सटीक स्लग/नाम टोकन बूस्ट + लोकप्रियता का एक छोटा पूर्व मान)।
- प्रासंगिकता लोकप्रियता से अधिक प्रभावी होती है। सटीक स्लग या प्रदर्शन-नाम टोकन मिलान, कहीं अधिक सहभागिता वाले कम सटीक मिलान से ऊपर स्थान पा सकता है।
- ASCII टेक्स्ट को शब्द और विराम-चिह्न सीमाओं पर टोकनाइज़ किया जाता है। उदाहरण के लिए, `personal-map` में एक स्वतंत्र `map` टोकन होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi` और `skill` होते हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में अधिक मजबूत शब्दगत मिलान मिलता है।
- लोकप्रियता को लॉग-स्केल करके सीमित किया जाता है। अधिक सहभागिता वाले Skills क्वेरी टेक्स्ट से कमजोर मिलान होने पर नीचे रैंक कर सकते हैं।
- कॉलर फ़िल्टर और वर्तमान मॉडरेशन स्थिति के आधार पर संदिग्ध या छिपी मॉडरेशन स्थिति किसी Skill को सार्वजनिक खोज से हटा सकती है।

प्रकाशक के लिए खोज-योग्यता मार्गदर्शन:

- वे शब्द, जिन्हें उपयोगकर्ता वास्तव में खोजेंगे, प्रदर्शन नाम, सारांश और टैग में रखें। स्वतंत्र स्लग टोकन का उपयोग केवल तभी करें, जब वह एक स्थिर पहचान भी हो जिसे आप बनाए रखना चाहते हैं।
- केवल एक क्वेरी के पीछे जाने के लिए स्लग का नाम न बदलें, जब तक कि नया स्लग दीर्घकाल में बेहतर प्रामाणिक नाम न हो। पुराने स्लग रीडायरेक्ट उपनाम बन जाते हैं, लेकिन प्रामाणिक URL, प्रदर्शित स्लग और भविष्य के खोज डाइजेस्ट नए स्लग का उपयोग करते हैं।
- नाम-परिवर्तन उपनाम पुराने URL और रजिस्ट्री के माध्यम से रिज़ॉल्व होने वाले इंस्टॉल के लिए रिज़ॉल्यूशन बनाए रखते हैं, लेकिन नाम-परिवर्तन को इंडेक्स किए जाने के बाद खोज रैंकिंग प्रामाणिक Skill मेटाडेटा पर आधारित होती है। मौजूदा आँकड़े Skill के साथ बने रहते हैं।
- यदि कोई Skill अप्रत्याशित रूप से दिखाई नहीं दे रहा है, तो रैंकिंग-संबंधित मेटाडेटा बदलने से पहले लॉग इन रहते हुए `clawhub inspect @owner/slug` से मॉडरेशन स्थिति जाँचें।

### `GET /api/v1/skills`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–200)
- `cursor` (वैकल्पिक): किसी भी गैर-`trending` क्रम के लिए पृष्ठांकन कर्सर
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended` (उपनाम: `default`), `createdAt` (उपनाम: `newest`), `downloads`, `stars` (उपनाम: `rating`), पुराने इंस्टॉल उपनाम `installsCurrent`/`installs`/`installsAllTime`, `downloads`, `trending` पर मैप होते हैं
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` का पुराना उपनाम

अमान्य `sort` मान `400` लौटाते हैं।

टिप्पणियाँ:

- `recommended` सहभागिता और नवीनता संकेतों का उपयोग करता है।
- `trending` पिछले 7 दिनों के इंस्टॉल के आधार पर रैंक करता है (टेलीमेट्री-आधारित)।
- `createdAt` नए Skill क्रॉल के लिए स्थिर है; मौजूदा Skills पुनः प्रकाशित होने पर `updated` बदलता है।
- जब `nonSuspiciousOnly=true`, कर्सर-आधारित क्रम किसी पृष्ठ पर `limit` से कम आइटम लौटा सकते हैं, क्योंकि संदिग्ध Skills को पृष्ठ प्राप्त करने के बाद फ़िल्टर किया जाता है।
- उपलब्ध होने पर पृष्ठांकन जारी रखने के लिए `nextCursor` का उपयोग करें। केवल छोटा पृष्ठ होने का अर्थ परिणामों का अंत नहीं है।

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

- स्वामी के नाम-परिवर्तन/मर्ज प्रवाह द्वारा बनाए गए पुराने स्लग प्रामाणिक Skill पर रिज़ॉल्व होते हैं।
- `metadata.os`: Skill फ्रंटमैटर में घोषित OS प्रतिबंध (उदाहरण के लिए `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix सिस्टम लक्ष्य (उदाहरण के लिए `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि Skill में कोई प्लेटफ़ॉर्म मेटाडेटा नहीं है, तो `metadata`, `null` होता है।
- `moderation` केवल तभी शामिल किया जाता है, जब Skill फ़्लैग किया गया हो या स्वामी उसे देख रहा हो।

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
    "summary": "पता चला: suspicious.dynamic_code_execution",
    "engineVersion": "v2.0.0",
    "updatedAt": 0,
    "legacyReason": null,
    "evidence": [
      {
        "code": "suspicious.dynamic_code_execution",
        "severity": "critical",
        "file": "index.ts",
        "line": 3,
        "message": "डायनेमिक कोड निष्पादन का पता चला।",
        "evidence": ""
      }
    ]
  }
}
```

टिप्पणियाँ:

- स्वामी और मॉडरेटर छिपे हुए Skills के मॉडरेशन विवरण तक पहुँच सकते हैं।
- सार्वजनिक कॉलर को पहले से फ़्लैग किए गए दृश्यमान Skills के लिए केवल `200` मिलता है।
- सार्वजनिक कॉलर के लिए साक्ष्य संपादित किया जाता है और कच्चे स्निपेट केवल स्वामियों/मॉडरेटरों के लिए शामिल होते हैं।

### `POST /api/v1/skills/{slug}/report`

मॉडरेटर समीक्षा के लिए किसी Skill की रिपोर्ट करें। रिपोर्ट Skill-स्तरीय होती हैं, वैकल्पिक रूप से
किसी संस्करण से जुड़ी होती हैं और Skill रिपोर्ट कतार में जाती हैं।

प्रमाणीकरण:

- एक API टोकन आवश्यक है।

अनुरोध:

```json
{ "reason": "संदिग्ध इंस्टॉल चरण", "version": "1.2.3" }
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

Skill रिपोर्ट ग्रहण करने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

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

### `POST /api/v1/skills/-/reports/{reportId}/triage`

स्किल रिपोर्ट को हल करने या फिर से खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

अनुरोध:

```json
{ "status": "confirmed", "note": "समीक्षा की गई और प्रभावित संस्करण छिपाया गया।", "finalAction": "hide" }
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open` पर
सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट-योग्य वर्कफ़्लो में स्किल छिपाने के लिए ट्राइएज की गई
रिपोर्ट के साथ `finalAction: "hide"` पास करें।

### `GET /api/v1/skills/{slug}/versions`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

### `GET /api/v1/skills/{slug}/versions/{version}`

संस्करण मेटाडेटा + फ़ाइलों की सूची लौटाता है।

- `version.security` में उपलब्ध होने पर सामान्यीकृत स्कैन सत्यापन स्थिति और स्कैनर विवरण
  (VirusTotal + LLM) शामिल होते हैं।

### `GET /api/v1/skills/{slug}/scan`

स्किल संस्करण के लिए सुरक्षा स्कैन सत्यापन विवरण लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किया गया संस्करण निर्धारित करें (उदाहरण के लिए `latest`)।

टिप्पणियाँ:

- यदि न तो `version` और न ही `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग होता है।
- इसमें सामान्यीकृत सत्यापन स्थिति के साथ स्कैनर-विशिष्ट विवरण शामिल होते हैं।
- `security.hasScanResult` केवल तभी `true` होता है, जब किसी स्कैनर ने निर्णायक निर्णय दिया हो (`clean`, `suspicious`, या `malicious`)।
- `moderation` नवीनतम संस्करण से प्राप्त वर्तमान स्किल-स्तरीय मॉडरेशन स्नैपशॉट है।
- किसी ऐतिहासिक संस्करण की क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जाँचें।

### `POST /api/v1/skills/-/scan`

नई ClawScan जॉब सबमिट करने के लिए प्रमाणीकृत एंडपॉइंट।

स्थानीय अपलोड स्कैन अब समर्थित नहीं हैं। `multipart/form-data` या
`{ "source": { "kind": "upload" } }` का उपयोग करने वाले अनुरोध `410` लौटाते हैं।

प्रकाशित स्कैन JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

टिप्पणियाँ:

- प्रतिधारण अवधि के बाद स्कैन अनुरोध पेलोड और डाउनलोड योग्य रिपोर्ट स्कैन-अनुरोध स्टोर से समाप्त हो जाते हैं।
- प्रकाशित स्कैन के लिए स्वामी/प्रकाशक प्रबंधन पहुँच या प्लेटफ़ॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- प्रकाशित स्कैन केवल तभी वापस लिखते हैं, जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो।
- प्रतिक्रिया `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` के साथ `202` होती है।
- स्कैन जॉब एसिंक्रोनस होती हैं। मैन्युअल स्कैन अनुरोधों को सामान्य प्रकाशन/बैकफ़िल कार्य से अधिक प्राथमिकता दी जाती है, लेकिन उनका पूरा होना फिर भी वर्कर की उपलब्धता पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणीकृत पोल एंडपॉइंट।

- कतारबद्ध/चल रही/सफल/विफल स्थिति लौटाता है।
- कतारबद्ध रहते समय `queue.queuedAhead` और `queue.position` लौटाता है, ताकि क्लाइंट दिखा सकें कि अनुरोध से पहले कितने प्राथमिकता-प्राप्त मैन्युअल स्कैन हैं। बहुत बड़ी कतारों को सीमित करके `queuedAheadIsEstimate: true` के साथ रिपोर्ट किया जाता है।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` अनुभाग होते हैं।
- विफल स्कैन जॉब `lastError` के साथ `status: "failed"` लौटाती हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणीकृत रिपोर्ट संग्रह एंडपॉइंट।

- इसके लिए सफल स्कैन आवश्यक है; गैर-टर्मिनल स्कैन `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` वाला ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए संस्करणों के लिए प्रमाणीकृत संग्रहीत रिपोर्ट संग्रह एंडपॉइंट।

- इसके लिए स्किल या Plugin की स्वामी/प्रकाशक प्रबंधन पहुँच या प्लेटफ़ॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- अवरुद्ध या छिपे हुए संस्करणों सहित, ठीक उसी सबमिट किए गए संस्करण के लिए संग्रहीत स्कैन परिणाम लौटाता है।
- `kind` का डिफ़ॉल्ट `skill` है; Plugin/पैकेज स्कैन के लिए `kind=plugin` का उपयोग करें।
- स्कैन-अनुरोध डाउनलोड जैसा ही ZIP स्वरूप लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

केवल एडमिन के लिए कैनोनिकल बैच रीस्कैन रूट। यह पुराने `POST /api/v1/skills/-/rescan-batch` जैसा ही पेलोड स्वरूप स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

केवल एडमिन के लिए कैनोनिकल बैच स्थिति रूट। यह `{ "jobIds": ["..."] }` स्वीकार करता है और पुराने `POST /api/v1/skills/-/rescan-batch/status` जैसे ही समेकित काउंटर लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला Skill Card सत्यापन एन्वेलप लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किया गया संस्करण निर्धारित करें (उदाहरण के लिए `latest`)।

टिप्पणियाँ:

- `ok` केवल तभी `true` होता है, जब चयनित संस्करण में जनरेट किया गया Skill Card हो, वह मॉडरेशन द्वारा मैलवेयर के कारण अवरुद्ध न हो, और ClawScan सत्यापन क्लीन हो।
- स्किल पहचान, प्रकाशक पहचान और चयनित संस्करण का मेटाडेटा शीर्ष-स्तरीय एन्वेलप फ़ील्ड (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं, ताकि शेल ऑटोमेशन नेस्टेड रैपर को अनपैक किए बिना उन्हें पढ़ सके।
- `security` शीर्ष-स्तरीय ClawScan/सुरक्षा निर्णय है। ऑटोमेशन को `ok`, `decision`, `reasons`, और `security.status` को आधार बनाना चाहिए।
- `security.signals` में `staticScan`, `virusTotal`, और `skillSpector` जैसे सहायक स्कैनर साक्ष्य होते हैं।
- `security.signals.dependencyRegistry` को v1 प्रतिक्रिया संगतता के लिए बनाए रखा गया है, लेकिन डिपेंडेंसी रजिस्ट्री अस्तित्व स्कैनर सेवानिवृत्त हो चुका है और यह कुंजी हमेशा `null` होती है।
- `provenance` केवल तभी `server-resolved-github-import` होता है, जब ClawHub ने प्रकाशन या आयात के दौरान GitHub रेपो/ref/commit/path निर्धारित करके संग्रहीत किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

सटीक स्किल संस्करणों के लिए वर्तमान संक्षिप्त सुरक्षा निर्णय लौटाता है। यह
संग्रह एंडपॉइंट उन क्लाइंट के लिए है, जिन्हें पहले से पता है कि उन्हें कौन-से इंस्टॉल किए गए
ClawHub स्किल संस्करण प्रदर्शित करने हैं, जैसे OpenClaw Control UI।

अनुरोध:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

टिप्पणियाँ:

- `items` में 1-100 अद्वितीय `{ slug, version }` युग्म होने चाहिए।
- परिणाम प्रत्येक आइटम के लिए अलग होते हैं; एक अनुपलब्ध स्किल या संस्करण से पूरी प्रतिक्रिया विफल नहीं होती।
- प्रतिक्रिया केवल सुरक्षा संबंधी है। इसमें Skill Card डेटा, जनरेट किए गए कार्ड की स्थिति, आर्टिफ़ैक्ट फ़ाइल सूचियाँ या विस्तृत स्कैनर पेलोड शामिल नहीं हैं।
- `security.signals` में केवल स्थिति-स्तरीय सहायक साक्ष्य होते हैं; पूर्ण स्कैनर विवरण के लिए `/scan` या ClawHub सुरक्षा-ऑडिट पेज का उपयोग करें।
- `security.signals.dependencyRegistry` को v1 प्रतिक्रिया संगतता के लिए बनाए रखा गया है, लेकिन डिपेंडेंसी रजिस्ट्री अस्तित्व स्कैनर सेवानिवृत्त हो चुका है और यह कुंजी हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस एंडपॉइंट के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; कार्ड सामग्री की आवश्यकता होने पर क्लाइंट को इंस्टॉल किया गया `skill-card.md` स्थानीय रूप से पढ़ना चाहिए।
- एकल-स्किल Skill Card सत्यापन एन्वेलप की आवश्यकता होने पर `/verify`, जनरेट किए गए कार्ड मार्कडाउन की आवश्यकता होने पर `/card`, और विस्तृत स्कैनर डेटा की आवश्यकता होने पर `/scan` का उपयोग करें।

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

अपरिष्कृत टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- डिफ़ॉल्ट रूप से नवीनतम संस्करण का उपयोग होता है।
- फ़ाइल आकार सीमा: 200KB।

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
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। केवल तब समर्थित है, जब
  अनुरोध Plugin पैकेज तक सीमित हो (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या `family=code-plugin`/`family=bundle-plugin`
  वाले पैकेज एंडपॉइंट)। नियंत्रित श्रेणियाँ और पुराने v1 फ़िल्टर
  उपनाम `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

टिप्पणियाँ:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` निश्चित-फ़ैमिली उपनाम बने रहते हैं।
- स्किल प्रविष्टियाँ स्किल रजिस्ट्री द्वारा समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अब भी केवल कोड-Plugin और बंडल-Plugin रिलीज़ के लिए है।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देख सकते हैं।
- प्रमाणीकृत कॉलर सूची/खोज परिणामों में उन प्रकाशकों के निजी पैकेज देख सकते हैं, जिनसे वे संबद्ध हैं।
- `channel=private` केवल वे पैकेज लौटाता है, जिन्हें प्रमाणीकृत कॉलर पढ़ सकता है।

### `GET /api/v1/packages/search`

स्किल + Plugin पैकेज में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। केवल तब समर्थित है जब
  अनुरोध का दायरा Plugin पैकेजों तक सीमित हो। नियंत्रित श्रेणियाँ और लेगेसी v1
  फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

टिप्पणियाँ:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देख सकते हैं।
- प्रमाणित कॉलर उन प्रकाशकों के निजी पैकेज खोज सकते हैं जिनसे वे संबद्ध हैं।
- `channel=private` केवल वही पैकेज लौटाता है जिन्हें प्रमाणित कॉलर पढ़ सकता है।

### `GET /api/v1/plugins`

कोड-Plugin और बंडल-Plugin पैकेजों में केवल-Plugin कैटलॉग ब्राउज़िंग।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, लेगेसी उपनाम `installs`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

लेगेसी v1 फ़िल्टर उपनाम रीड एंडपॉइंट पर अब भी स्वीकार किए जाते हैं:

- `mcp-tooling`, `data`, और `automation` का समाधान `tools` के रूप में होता है।
- `observability` और `deployment` का समाधान `gateway` के रूप में होता है।
- `dev-tools` का समाधान `runtime` के रूप में होता है।

`trending` सात-दिवसीय इंस्टॉल/डाउनलोड लीडरबोर्ड है और सर्वकालिक योग का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` एंडपॉइंट पर यह केवल Plugin के लिए है; Skills कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

लेगेसी उपनाम संग्रहीत या लेखक द्वारा घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Skills का बल्क निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड की निचली सीमा।
- `endDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड की ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछली प्रतिक्रिया से पृष्ठांकन कर्सर।

प्रतिक्रिया:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Skill का रूट `{publisher}/{slug}/` पर होता है।
- होस्ट की गई Skills में नवीनतम संग्रहीत संस्करण की फ़ाइलें शामिल होती हैं और उन्हें
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध किया जाता है।
- `clean` या `suspicious` स्कैन वाली वर्तमान GitHub-समर्थित Skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, रिपॉज़िटरी, कमिट, पथ,
  सामग्री हैश और आर्काइव URL होते हैं। उनमें ClawHub द्वारा होस्ट की गई स्रोत फ़ाइलें शामिल नहीं होतीं।
- प्रत्येक Skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- जब अलग-अलग Skills या फ़ाइलें निर्यात नहीं की जा सकीं, तब `_errors.json`
  शामिल होता है।

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

- `startDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड की निचली सीमा।
- `endDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड की ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछली प्रतिक्रिया से पृष्ठांकन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ दोनों
  Plugin परिवार हैं।

प्रतिक्रिया:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Plugin का रूट `{family}/{packageName}/` पर होता है।
- प्रत्येक निर्यातित Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- जब अलग-अलग Plugin या फ़ाइलें निर्यात नहीं की जा सकीं, तब `_errors.json`
  शामिल होता है।

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

- `GET /api/v1/plugins` के अंतर्गत प्रलेखित लेगेसी v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी डाइजेस्ट पंक्तियों द्वारा समर्थित एक वास्तविक API फ़िल्टर है,
  न कि खोज-क्वेरी का पुनर्लेखन।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में उनका पृष्ठांकन नहीं होता।
- Plugin खोज के लिए ब्राउज़र UI के सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को पुनः क्रमित करते हैं,
  जो वर्तमान `/skills` ब्राउज़ व्यवहार से मेल खाता है।

### `GET /api/v1/packages/{name}`

पैकेज का विस्तृत मेटाडेटा लौटाता है।

टिप्पणियाँ:

- एकीकृत कैटलॉग में इस रूट के माध्यम से Skills का समाधान भी हो सकता है।
- जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता, निजी पैकेज `404` लौटाते हैं।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और उसकी सभी रिलीज़ को सॉफ़्ट-डिलीट करता है।

टिप्पणियाँ:

- पैकेज स्वामी, संगठन प्रकाशक के स्वामी/एडमिन, प्लेटफ़ॉर्म मॉडरेटर या प्लेटफ़ॉर्म एडमिन के API टोकन की
  आवश्यकता होती है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

टिप्पणियाँ:

- जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता, निजी पैकेज `404` लौटाते हैं।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता, सत्यापन, आर्टिफ़ैक्ट मेटाडेटा और स्कैन डेटा सहित
पैकेज का एक संस्करण लौटाता है।

टिप्पणियाँ:

- पुराने स्वरूप वाले पैकेज आर्काइव के लिए `version.artifact.kind`, `legacy-zip` होता है या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack` होता है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स का हैश बनाता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैनोनिकल रिलीज़ आर्टिफ़ैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता, निजी पैकेज `404` लौटाते हैं।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और विश्वास सारांश लौटाता है।
यह निर्धारित करने के लिए कि समाधान की गई रिलीज़ इंस्टॉल की जा सकती है या नहीं, यह सार्वजनिक OpenClaw
उपयोग सतह है।

प्रमाणीकरण:

- सार्वजनिक रीड एंडपॉइंट। स्वामी, प्रकाशक, मॉडरेटर या एडमिन टोकन
  आवश्यक नहीं है।

प्रतिक्रिया:

```json
{
  "package": {
    "name": "@openclaw/example-plugin",
    "displayName": "उदाहरण Plugin",
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

- `package.name`, `package.displayName`, और `package.family`
  समाधान किए गए रजिस्ट्री पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt`
  मूल्यांकित की गई सटीक रिलीज़ की पहचान करते हैं।
- रिलीज़ आर्टिफ़ैक्ट के लिए ज्ञात होने पर `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैन्युअल रिलीज़ मॉडरेशन से प्राप्त
  प्रभावी विश्वास स्थिति है।
- `trust.moderationState` शून्य-योग्य है। जब कोई मैन्युअल रिलीज़
  मॉडरेशन मौजूद नहीं होता, तो यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल अवरोध संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को स्कैनर या मॉडरेशन फ़ील्ड से अवरोध नियम दोबारा प्राप्त करने के बजाय, यह मान `true` होने पर
  इंस्टॉलेशन अवरुद्ध करना चाहिए।
- `trust.reasons` उपयोगकर्ता-दृश्य और ऑडिट व्याख्या सूची है। कारण कोड
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक विश्वास इनपुट अब भी पूर्ण होने की प्रतीक्षा में हैं।
- `trust.stale` का अर्थ है कि विश्वास सारांश की गणना पुराने इनपुट से की गई थी और
  उच्च-विश्वास अनुमति निर्णय से पहले इसे रीफ़्रेश करना आवश्यक माना जाना चाहिए।

टिप्पणियाँ:

- यह एंडपॉइंट संस्करण-सटीक है। क्लाइंट को केवल नवीनतम
  पैकेज मेटाडेटा पढ़ने के बाद नहीं, बल्कि उस पैकेज संस्करण का समाधान करने के बाद इसे कॉल करना चाहिए
  जिसे वे इंस्टॉल करना चाहते हैं।
- जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता, निजी पैकेज `404` लौटाते हैं।
- यह एंडपॉइंट जानबूझकर स्वामी/मॉडरेटर मॉडरेशन
  एंडपॉइंट से अधिक सीमित है। यह इंस्टॉल निर्णय और सार्वजनिक व्याख्या उजागर करता है,
  न कि रिपोर्टर की पहचान, रिपोर्ट की सामग्री, निजी साक्ष्य या आंतरिक समीक्षा
  समयरेखाएँ।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफ़ैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

टिप्पणियाँ:

- लेगेसी पैकेज संस्करण एक `legacy-zip` आर्टिफ़ैक्ट और एक लेगेसी ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण एक `npm-pack` आर्टिफ़ैक्ट, npm इंटीग्रिटी फ़ील्ड, एक
  `tarballUrl`, और लेगेसी ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से आर्काइव प्रारूप का
  अनुमान लगाने से बचती है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से संस्करण आर्टिफ़ैक्ट डाउनलोड करता है।

टिप्पणियाँ:

- ClawPack संस्करण अपलोड किए गए npm-pack के ठीक वही `.tgz` बाइट स्ट्रीम करते हैं।
- लीगेसी ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट होते हैं।
- डाउनलोड रेट बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

OpenClaw द्वारा भविष्य में उपयोग के लिए परिकलित तत्परता लौटाता है।

तत्परता जाँच में शामिल हैं:

- आधिकारिक चैनल की स्थिति
- नवीनतम संस्करण की उपलब्धता
- ClawPack npm-pack आर्टिफ़ैक्ट की उपलब्धता
- आर्टिफ़ैक्ट डाइजेस्ट
- स्रोत रिपॉज़िटरी और कमिट की उत्पत्ति
- OpenClaw संगतता मेटाडेटा
- होस्ट लक्ष्य
- स्कैन स्थिति

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
      "message": "नवीनतम संस्करण केवल लीगेसी ZIP में उपलब्ध है।"
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

- `bundledPluginId` को लोअरकेस में सामान्यीकृत किया जाता है और यह स्थिर अपसर्ट कुंजी है।
- `packageName` को npm नाम के अनुसार सामान्यीकृत किया जाता है; नियोजित
  माइग्रेशन के लिए पैकेज अनुपलब्ध हो सकता है।
- यह केवल माइग्रेशन तत्परता को ट्रैक करता है। यह OpenClaw को परिवर्तित नहीं करता या
  ClawPacks जनरेट नहीं करता।

### `GET /api/v1/packages/moderation/queue`

पैकेज रिलीज़ समीक्षा कतारों के लिए मॉडरेटर/एडमिन एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता का API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

स्थितियों के अर्थ:

- `open`: संदिग्ध, दुर्भावनापूर्ण, लंबित, क्वारंटीन की गई, निरस्त या रिपोर्ट की गई रिलीज़।
- `blocked`: क्वारंटीन की गई, निरस्त या दुर्भावनापूर्ण रिलीज़।
- `manual`: मैन्युअल मॉडरेशन ओवरराइड वाली कोई भी रिलीज़।
- `all`: मैन्युअल ओवरराइड, अस्वच्छ स्कैन स्थिति या पैकेज रिपोर्ट वाली कोई भी रिलीज़।

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
किसी संस्करण से लिंक की जा सकती हैं। वे मॉडरेशन कतार में जाती हैं, लेकिन अपने आप
डाउनलोड को छिपाती या अवरुद्ध नहीं करतीं; मॉडरेटर को आर्टिफ़ैक्ट स्वीकृत करने, क्वारंटीन करने
या निरस्त करने के लिए रिलीज़ मॉडरेशन का उपयोग करना चाहिए।

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

पैकेज रिपोर्ट का समाधान करने या उन्हें फिर से खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "समीक्षा करके प्रभावित रिलीज़ को क्वारंटीन कर दिया गया।",
  "finalAction": "quarantine"
}
```

`note`, `confirmed` और `dismissed` के लिए आवश्यक है; `status` को वापस
`open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट-योग्य कार्यप्रवाह में
रिलीज़ मॉडरेशन लागू करने के लिए पुष्टि की गई रिपोर्ट के साथ `finalAction: "quarantine"` या
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
- `quarantined`: आगे की कार्रवाई लंबित होने तक अवरुद्ध।
- `revoked`: पहले विश्वसनीय मानी गई रिलीज़ को बाद में अवरुद्ध किया गया।

क्वारंटीन और निरस्त की गई रिलीज़ आर्टिफ़ैक्ट डाउनलोड रूट से `403` लौटाती हैं।
हर परिवर्तन एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

पैकेज फ़ाइल की अपरिष्कृत टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- डाउनलोड बकेट के बजाय रीड रेट बकेट का उपयोग करता है।
- बाइनरी फ़ाइलें `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal स्कैन पढ़ने को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ को अन्य स्थानों पर फिर भी रोका जा सकता है।
- यदि कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता, तो निजी पैकेज `404` लौटाते हैं।

### `GET /api/v1/packages/{name}/download`

पैकेज रिलीज़ के लिए लीगेसी निर्धारक ZIP आर्काइव डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- Skills को `GET /api/v1/download` पर रीडायरेक्ट किया जाता है।
- Plugin/पैकेज आर्काइव ऐसी zip फ़ाइलें हैं जिनमें `package/` रूट होता है, ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह रूट केवल ZIP के लिए बना रहता है। यह ClawPack की `.tgz` फ़ाइलें स्ट्रीम नहीं करता।
- रिज़ॉल्वर अखंडता जाँच के लिए प्रतिक्रियाओं में `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल रजिस्ट्री का मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं।
- यदि कॉलर स्वामी नहीं है, तो निजी पैकेज `404` लौटाते हैं।

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत पैक्यूमेंट लौटाता है।

टिप्पणियाँ:

- केवल अपलोड किए गए ClawPack npm-pack टारबॉल वाले संस्करण सूचीबद्ध होते हैं।
- केवल लीगेसी ZIP वाले संस्करण जानबूझकर छोड़ दिए जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत
  फ़ील्ड का उपयोग करते हैं, ताकि उपयोगकर्ता चाहें तो npm को मिरर पर इंगित कर सकें।
- स्कोप किए गए पैकेज पैक्यूमेंट `/api/npm/@scope/name` और npm के
  एन्कोड किए गए `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm मिरर क्लाइंट के लिए अपलोड किए गए ClawPack टारबॉल के ठीक वही बाइट स्ट्रीम करता है।

टिप्पणियाँ:

- डाउनलोड रेट बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 के साथ npm इंटीग्रिटी/shasum मेटाडेटा शामिल होता है।
- मॉडरेशन और निजी पैकेज की पहुँच जाँच अब भी लागू होती है।

### `GET /api/v1/resolve`

CLI द्वारा स्थानीय फ़िंगरप्रिंट को किसी ज्ञात संस्करण से मैप करने के लिए उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): बंडल फ़िंगरप्रिंट का 64-वर्णीय हेक्स sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

होस्ट किए गए skill संस्करण का ZIP डाउनलोड करता है, या `clean` अथवा `suspicious` स्कैन वाले और बिना होस्ट किए गए
संस्करण वाले वर्तमान GitHub-समर्थित skill के लिए GitHub स्रोत हैंडऑफ़ लौटाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (उदा. `latest`)

टिप्पणियाँ:

- यदि न तो `version` और न ही `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग किया जाता है।
- सॉफ़्ट-डिलीट किए गए संस्करण `410` लौटाते हैं।
- GitHub-समर्थित skill हैंडऑफ़ बाइट्स को प्रॉक्सी या मिरर नहीं करते। JSON प्रतिक्रिया में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; स्कैन/वर्तमान स्थिति एक गेट है और इसे सफलता
  पेलोड मेटाडेटा के रूप में शामिल नहीं किया जाता।
- डाउनलोड आँकड़े प्रत्येक UTC दिन के लिए अद्वितीय पहचानों के रूप में गिने जाते हैं (API टोकन मान्य होने पर `userId`, अन्यथा IP)।

## प्रमाणीकरण एंडपॉइंट (Bearer टोकन)

सभी एंडपॉइंट के लिए आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन को सत्यापित करता है और उपयोगकर्ता हैंडल लौटाता है।

### `POST /api/v1/skills`

नया संस्करण प्रकाशित करता है।

- वरीयता: `payload` JSON + `files[]` ब्लॉब्स के साथ `multipart/form-data`।
- `files` (storageId-आधारित) वाला JSON बॉडी भी स्वीकार किया जाता है।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर API उस
  प्रकाशक को सर्वर-साइड हल करता है और अभिनेता के पास प्रकाशक पहुँच होना आवश्यक बनाता है।
- वैकल्पिक पेलोड फ़ील्ड: `migrateOwner`। `ownerHandle` के साथ `true` होने पर,
  कोई मौजूदा skill उस स्वामी के पास जा सकती है, यदि अभिनेता वर्तमान और लक्षित दोनों
  प्रकाशकों पर एडमिन/स्वामी है। इस स्पष्ट सहमति के बिना स्वामी परिवर्तन
  अस्वीकार कर दिए जाते हैं।

### `POST /api/v1/packages`

कोड-Plugin या बंडल-Plugin रिलीज़ प्रकाशित करता है।

- Bearer टोकन प्रमाणीकरण आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत फ़ॉर्म फ़ील्ड `payload`, दोहराए गए `files` ब्लॉब्स या एक `clawpack`
  टारबॉल संदर्भ हैं। `clawpack` एक `.tgz` ब्लॉब या
  अपलोड-URL प्रवाह द्वारा लौटाई गई स्टोरेज ID हो सकती है। स्टेज की गई स्टोरेज-ID प्रकाशन में उस
  अपलोड URL के साथ लौटाया गया `clawpackUploadTicket` भी शामिल होना चाहिए।
- `files` या `clawpack` में से किसी एक का उपयोग करें; एक ही अनुरोध में दोनों का कभी उपयोग न करें।
- JSON बॉडी और कॉलर द्वारा प्रदान किया गया `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार कर दिया जाता है।
- प्रत्यक्ष मल्टीपार्ट प्रकाशन अनुरोध 18MB तक सीमित हैं। ClawPack टारबॉल
  120MB टारबॉल सीमा तक अपलोड-URL प्रवाह का उपयोग कर सकते हैं।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर केवल एडमिन ही उस स्वामी की ओर से प्रकाशित कर सकते हैं।

सत्यापन की मुख्य बातें:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin पैकेज के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` अपलोड में
  यह `package/openclaw.plugin.json` पर मौजूद होना चाहिए।
- कोड Plugin के लिए `package.json`, स्रोत रिपॉज़िटरी मेटाडेटा, स्रोत कमिट
  मेटाडेटा, कॉन्फ़िग स्कीमा मेटाडेटा, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` संगठन प्रकाशक और वर्तमान `openclaw` संगठन सदस्यों के
  व्यक्तिगत प्रकाशक ही `official` चैनल पर प्रकाशित कर सकते हैं।
- दूसरे की ओर से किए गए प्रकाशन भी लक्षित स्वामी खाते के आधार पर आधिकारिक-चैनल पात्रता सत्यापित करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

किसी skill को सॉफ़्ट-डिलीट/पुनर्स्थापित करें (स्वामी, मॉडरेटर या एडमिन)।

वैकल्पिक JSON बॉडी:

```json
{ "reason": "कानूनी समीक्षा लंबित रहने तक मॉडरेशन के लिए रोका गया।" }
```

मौजूद होने पर `reason` को skill मॉडरेशन टिप्पणी के रूप में संग्रहीत करके ऑडिट लॉग में कॉपी किया जाता है।
स्वामी द्वारा शुरू किए गए सॉफ़्ट डिलीट स्लग को 30 दिनों के लिए आरक्षित रखते हैं, जिसके बाद
कोई अन्य प्रकाशक स्लग पर दावा कर सकता है। यह समाप्ति लागू होने पर डिलीट प्रतिक्रिया में
`slugReservedUntil` शामिल होता है।
मॉडरेटर/एडमिन द्वारा छिपाने और सुरक्षा निष्कासनों की अवधि इस प्रकार समाप्त नहीं होती।

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
पुराने साझा उपयोगकर्ता/व्यक्तिगत प्रकाशक की ओर संकेत करता है, तो एंडपॉइंट पहले उसे संगठन प्रकाशक में माइग्रेट करता है।
नए बनाए गए संगठन के लिए `memberHandle` दें; कार्रवाई करने वाले एडमिन को सदस्य के रूप में नहीं जोड़ा जाता।
`memberRole` का डिफ़ॉल्ट `owner` है।

- बॉडी: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- प्रतिक्रिया: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

प्रमाणित स्व-सेवा संगठन प्रकाशक निर्माण। नया संगठन प्रकाशक बनाता है और
कॉलर को स्वामी के रूप में जोड़ता है। यह एंडपॉइंट मौजूदा उपयोगकर्ता/व्यक्तिगत हैंडल माइग्रेट नहीं करता और
प्रकाशक को विश्वसनीय/आधिकारिक के रूप में चिह्नित नहीं करता।

- बॉडी: `{ "handle": "opik", "displayName": "Opik" }`
- प्रतिक्रिया: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब हैंडल का उपयोग पहले से किसी प्रकाशक, उपयोगकर्ता या व्यक्तिगत प्रकाशक द्वारा किया जा रहा हो, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल एडमिन। बिना रिलीज़ प्रकाशित किए वास्तविक स्वामी के लिए रूट स्लग और पैकेज नाम आरक्षित करता है।
पैकेज नाम बिना रिलीज़ पंक्तियों वाले निजी प्लेसहोल्डर पैकेज बन जाते हैं, ताकि वही
स्वामी बाद में उस नाम पर वास्तविक कोड-Plugin या बंडल-Plugin रिलीज़ प्रकाशित कर सके।

- बॉडी: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- प्रतिक्रिया: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल एडमिन। Convex Auth खाता पंक्तियों को संपादित किए बिना सत्यापित प्रतिस्थापन GitHub OAuth प्रिंसिपल के लिए
व्यक्तिगत प्रकाशक पुनर्प्राप्त करता है। अनुरोध में दोनों अपरिवर्तनीय GitHub
प्रदाता खाता ID नामित होनी चाहिए; परिवर्तनशील हैंडल केवल ऑपरेटर-सामना सुरक्षा-जाँच के रूप में उपयोग किए जाते हैं।

एंडपॉइंट का डिफ़ॉल्ट ड्राई-रन है। पुनर्प्राप्ति लागू करने के लिए कर्मचारियों द्वारा दोनों
GitHub प्रिंसिपल के बीच निरंतरता का स्वतंत्र रूप से सत्यापन करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। यदि गंतव्य उपयोगकर्ता के वर्तमान व्यक्तिगत
प्रकाशक के पास skills, पैकेज या GitHub skill स्रोत हैं, तो पुनर्प्राप्ति सुरक्षित रूप से विफल होती है।
पुनर्प्राप्ति, पुनर्प्राप्त प्रकाशक की skills, skill स्लग उपनामों, पैकेजों, पैकेज निरीक्षक चेतावनियों
और व्युत्पन्न खोज डाइजेस्ट पंक्तियों के पुराने `ownerUserId` फ़ील्ड भी माइग्रेट करती है, ताकि
प्रत्यक्ष-स्वामी पथ नए प्रकाशक प्राधिकार से मेल खाएँ। पुनर्प्राप्त हैंडल का कोई सक्रिय संरक्षित-हैंडल
आरक्षण भी प्रतिस्थापन उपयोगकर्ता को पुनः सौंप दिया जाता है, ताकि बाद का
प्रोफ़ाइल समन्वयन पूर्व उपयोगकर्ता के प्रतिस्पर्धी प्राधिकार को पुनर्स्थापित न कर सके। प्रत्येक प्राथमिक तालिका प्रति लागू लेनदेन
100 पंक्तियों तक सीमित है; बड़ी पुनर्प्राप्तियों में पहले पुनः आरंभ किए जा सकने वाले स्वामी माइग्रेशन का उपयोग होना चाहिए।
GitHub skill स्रोत प्रकाशक-स्कोप वाले होते हैं और पुनर्लिखित करने के बजाय जाँचे गए के रूप में रिपोर्ट किए जाते हैं।

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

- दोनों एंडपॉइंट के लिए API टोकन प्रमाणीकरण आवश्यक है और वे केवल skill स्वामी के लिए काम करते हैं।
- `rename` पिछले स्लग को रीडायरेक्ट उपनाम के रूप में संरक्षित रखता है।
- `merge` स्रोत सूची को छिपाता है और स्रोत स्लग को लक्षित सूची पर रीडायरेक्ट करता है।

### स्वामित्व स्थानांतरण एंडपॉइंट

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

किसी उपयोगकर्ता को प्रतिबंधित करें और उसके स्वामित्व वाली skills को स्थायी रूप से हटाएँ (केवल मॉडरेटर/एडमिन)।

बॉडी:

```json
{ "handle": "user_handle", "reason": "प्रतिबंध का वैकल्पिक कारण" }
```

या

```json
{ "userId": "users_...", "reason": "प्रतिबंध का वैकल्पिक कारण" }
```

प्रतिक्रिया:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

किसी उपयोगकर्ता का प्रतिबंध हटाएँ और पात्र skills पुनर्स्थापित करें (केवल एडमिन)।

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

प्रतिबंध हटाए या सामग्री पुनर्स्थापित किए बिना किसी मौजूदा प्रतिबंध के लिए संग्रहीत कारण बदलें
(केवल एडमिन)। जब तक `dryRun`, `false` न हो, डिफ़ॉल्ट रूप से ड्राई-रन होता है।

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
  "previousReason": "मैलवेयर स्वचालित प्रतिबंध",
  "nextReason": "थोक प्रकाशन स्पैम",
  "changed": true
}
```

### `POST /api/v1/users/role`

उपयोगकर्ता की भूमिका बदलें (केवल एडमिन)।

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

स्टार जोड़ें/हटाएँ (हाइलाइट)। दोनों एंडपॉइंट आइडेम्पोटेंट हैं।

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

`POST /api/cli/upload-url`, `uploadUrl` और `uploadTicket` लौटाता है। ClawPack टारबॉल को स्टेज करने वाले
पैकेज प्रकाशनों को परिणामी स्टोरेज ID `clawpack` के रूप में और लौटाया गया टिकट
`clawpackUploadTicket` के रूप में भेजना चाहिए।

## रजिस्ट्री खोज (`/.well-known/clawhub.json`)

CLI साइट से रजिस्ट्री/प्रमाणीकरण सेटिंग्स खोज सकता है:

- `/.well-known/clawhub.json` (JSON, वरीय)
- `/.well-known/clawdhub.json` (पुराना)

स्कीमा:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप स्वयं होस्ट करते हैं, तो यह फ़ाइल उपलब्ध कराएँ (या स्पष्ट रूप से `CLAWHUB_REGISTRY` सेट करें; पुराना `CLAWDHUB_REGISTRY`)।
