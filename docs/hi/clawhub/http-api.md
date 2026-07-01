---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI endpoints + auth).
x-i18n:
    generated_at: "2026-07-01T18:11:35Z"
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
लेगेसी `/api/...` और `/api/cli/...` संगतता के लिए बने रहते हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`.

## सार्वजनिक कैटलॉग पुनः उपयोग

तृतीय-पक्ष डायरेक्टरियाँ ClawHub Skills की सूची बनाने या खोजने के लिए सार्वजनिक रीड एंडपॉइंट्स का उपयोग कर सकती हैं। कृपया परिणाम कैश करें, `429`/`Retry-After` का सम्मान करें, उपयोगकर्ताओं को प्रामाणिक ClawHub लिस्टिंग (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और तृतीय-पक्ष साइट के लिए ClawHub समर्थन का संकेत देने से बचें। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन द्वारा अवरुद्ध सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट्स को रूट प्राथमिकता को फिर से बनाने के बजाय रीड एंडपॉइंट्स द्वारा लौटाए गए प्रामाणिक URL का उपयोग करना चाहिए।

## दर सीमाएँ

प्रवर्तन मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer टोकन): प्रति उपयोगकर्ता बकेट लागू।
- यदि टोकन अनुपस्थित/अमान्य है, तो व्यवहार वापस IP प्रवर्तन पर चला जाता है।
- प्रमाणित राइट एंडपॉइंट्स को तब केवल `Unauthorized` नहीं लौटाना चाहिए जब
  सर्वर कारण जानता हो। अनुपस्थित टोकन, अमान्य/रद्द किए गए टोकन, और
  हटाए गए/प्रतिबंधित/अक्षम खातों में प्रत्येक को कार्रवाई योग्य टेक्स्ट मिलना चाहिए ताकि CLI
  क्लाइंट उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- रीड: 3000/मिनट प्रति IP, 12000/मिनट प्रति कुंजी
- राइट: 300/मिनट प्रति IP, 3000/मिनट प्रति कुंजी
- डाउनलोड: 1200/मिनट प्रति IP, 6000/मिनट प्रति कुंजी (डाउनलोड एंडपॉइंट्स)

हेडर:

- लेगेसी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
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
- समकालिक पुनः प्रयासों से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` पर वापस जाएँ (या `X-RateLimit-Reset` से गणना करें)।

IP स्रोत:

- विश्वसनीय क्लाइंट IP हेडर, जिनमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब
  डिप्लॉयमेंट स्पष्ट रूप से विश्वसनीय फ़ॉरवर्डेड हेडर सक्षम करता है।
- ClawHub किनारे पर क्लाइंट IP की पहचान करने के लिए विश्वसनीय फ़ॉरवर्डिंग हेडर का उपयोग करता है।
- यदि कोई विश्वसनीय क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध फ़ॉलबैक बकेट का उपयोग करते हैं
  जो केवल दर-सीमा प्रकार के अनुसार स्कोप किए जाते हैं। इन फ़ॉलबैक बकेट में
  कॉलर द्वारा दिए गए पाथ, स्लग, पैकेज नाम, संस्करण, क्वेरी स्ट्रिंग, या अन्य
  आर्टिफैक्ट पैरामीटर शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएँ

सार्वजनिक v1 त्रुटि प्रतिक्रियाएँ `content-type: text/plain; charset=utf-8` के साथ सादा टेक्स्ट होती हैं।
इसमें वैलिडेशन विफलताएँ (`400`), अनुपस्थित सार्वजनिक संसाधन (`404`), auth और
अनुमति विफलताएँ (`401`/`403`), दर सीमाएँ (`429`), और अवरुद्ध डाउनलोड शामिल हैं। क्लाइंट्स को
प्रतिक्रिया बॉडी को मानव-पठनीय स्ट्रिंग के रूप में पढ़ना चाहिए। अज्ञात क्वेरी पैरामीटर
संगतता के लिए अनदेखे किए जाते हैं, लेकिन अमान्य मानों वाले पहचाने गए क्वेरी पैरामीटर
`400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट्स (कोई auth नहीं)

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

नोट्स:

- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं (embedding समानता + सटीक स्लग/नाम टोकन बूस्ट + एक छोटा लोकप्रियता पूर्वानुमान)।
- प्रासंगिकता लोकप्रियता से अधिक मजबूत है। सटीक स्लग या डिस्प्ले-नाम टोकन मिलान बहुत अधिक सहभागिता वाले ढीले मिलान से ऊपर रैंक कर सकता है।
- ASCII टेक्स्ट को शब्द और विराम-चिह्न सीमाओं पर टोकनाइज़ किया जाता है। उदाहरण के लिए, `personal-map` में स्वतंत्र `map` टोकन है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में मजबूत lexical मिलान मिलता है।
- लोकप्रियता लॉग-स्केल और कैप की गई है। उच्च-सहभागिता Skills तब नीचे रैंक कर सकती हैं जब क्वेरी टेक्स्ट कमज़ोर मिलान हो।
- संदिग्ध या छिपी मॉडरेशन स्थिति कॉलर फ़िल्टर और वर्तमान मॉडरेशन स्थिति के आधार पर किसी skill को सार्वजनिक खोज से हटा सकती है।

प्रकाशक खोजयोग्यता मार्गदर्शन:

- उन शब्दों को डिस्प्ले नाम, सारांश, और टैग में रखें जिन्हें उपयोगकर्ता वास्तव में खोजेंगे। स्वतंत्र स्लग टोकन का उपयोग केवल तब करें जब वह एक स्थिर पहचान भी हो जिसे आप रखना चाहते हैं।
- केवल एक क्वेरी के पीछे भागने के लिए स्लग का नाम न बदलें, जब तक नया स्लग बेहतर दीर्घकालिक प्रामाणिक नाम न हो। पुराने स्लग रीडायरेक्ट उपनाम बन जाते हैं, लेकिन प्रामाणिक URL, प्रदर्शित स्लग, और भविष्य के खोज डाइजेस्ट नए स्लग का उपयोग करते हैं।
- नाम बदलने वाले उपनाम पुराने URL और रजिस्ट्री के माध्यम से रिज़ॉल्व होने वाले इंस्टॉल के लिए रिज़ॉल्यूशन बनाए रखते हैं, लेकिन खोज रैंकिंग नाम बदलने के इंडेक्स हो जाने के बाद प्रामाणिक skill मेटाडेटा पर आधारित होती है। मौजूदा आँकड़े skill के साथ रहते हैं।
- यदि कोई skill अप्रत्याशित रूप से अदृश्य है, तो रैंकिंग-संबंधित मेटाडेटा बदलने से पहले लॉग इन रहते हुए `clawhub inspect @owner/slug` के साथ पहले मॉडरेशन स्थिति जाँचें।

### `GET /api/v1/skills`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–200)
- `cursor` (वैकल्पिक): किसी भी गैर-`trending` सॉर्ट के लिए pagination cursor
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended` (उपनाम: `default`), `createdAt` (उपनाम: `newest`), `downloads`, `stars` (उपनाम: `rating`), लेगेसी इंस्टॉल उपनाम `installsCurrent`/`installs`/`installsAllTime` `downloads` पर मैप होते हैं, `trending`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए लेगेसी उपनाम

अमान्य `sort` मान `400` लौटाते हैं।

नोट्स:

- `recommended` सहभागिता और नवीनता संकेतों का उपयोग करता है।
- `trending` पिछले 7 दिनों के इंस्टॉल के आधार पर रैंक करता है (टेलीमेट्री-आधारित)।
- `createdAt` नए-skill crawls के लिए स्थिर है; मौजूदा Skills के पुनः प्रकाशित होने पर `updated` बदलता है।
- जब `nonSuspiciousOnly=true` होता है, तो cursor-आधारित सॉर्ट किसी पेज पर `limit` से कम आइटम लौटा सकते हैं क्योंकि पेज पुनर्प्राप्ति के बाद संदिग्ध Skills फ़िल्टर किए जाते हैं।
- मौजूद होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। छोटा पेज अपने आप में परिणामों के अंत का अर्थ नहीं है।

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

नोट्स:

- स्वामी नाम बदलने/मर्ज फ्लो द्वारा बनाए गए पुराने स्लग प्रामाणिक skill पर रिज़ॉल्व होते हैं।
- `metadata.os`: skill frontmatter में घोषित OS प्रतिबंध (जैसे `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix सिस्टम लक्ष्य (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि skill में कोई प्लेटफ़ॉर्म मेटाडेटा नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब skill फ़्लैग किया गया हो या स्वामी इसे देख रहा हो।

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

नोट्स:

- स्वामी और मॉडरेटर छिपे हुए Skills के लिए मॉडरेशन विवरणों तक पहुँच सकते हैं।
- सार्वजनिक कॉलर केवल पहले से फ़्लैग किए गए दृश्यमान Skills के लिए `200` पाते हैं।
- सार्वजनिक कॉलर के लिए साक्ष्य redacted होता है और केवल स्वामी/मॉडरेटर के लिए raw snippets शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

मॉडरेटर समीक्षा के लिए skill की रिपोर्ट करें। रिपोर्टें skill-स्तर की होती हैं, वैकल्पिक रूप से
किसी संस्करण से लिंक होती हैं, और skill रिपोर्ट कतार में जाती हैं।

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

skill रिपोर्ट इनटेक के लिए मॉडरेटर/admin एंडपॉइंट।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-200)
- `cursor` (वैकल्पिक): pagination cursor

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

skill रिपोर्टों को हल करने या फिर से खोलने के लिए मॉडरेटर/admin एंडपॉइंट।

अनुरोध:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` `confirmed` और `dismissed` के लिए आवश्यक है; `status` को वापस `open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट योग्य workflow में skill छिपाने के लिए triaged रिपोर्ट के साथ `finalAction: "hide"` पास करें।

### `GET /api/v1/skills/{slug}/versions`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक
- `cursor` (वैकल्पिक): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

संस्करण मेटाडेटा + फ़ाइलों की सूची लौटाता है।

- `version.security` उपलब्ध होने पर normalized scan verification status और scanner details
  (VirusTotal + LLM) शामिल करता है।

### `GET /api/v1/skills/{slug}/scan`

skill संस्करण के लिए सुरक्षा स्कैन सत्यापन विवरण लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किया गया संस्करण रिज़ॉल्व करें (उदाहरण के लिए `latest`)।

नोट्स:

- यदि न `version` और न ही `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति और स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निश्चित निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से निकाला गया वर्तमान skill-स्तर moderation स्नैपशॉट है।
- किसी ऐतिहासिक संस्करण को क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नए ClawScan जॉब के लिए प्रमाणित सबमिट endpoint।

स्थानीय upload scan अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले request `410` लौटाते हैं।

प्रकाशित scan JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- scan request payload और डाउनलोड किए जा सकने वाले report retention window के बाद scan-request store से समाप्त हो जाते हैं।
- प्रकाशित scan के लिए owner/publisher प्रबंधन पहुंच, या platform moderator/admin अधिकार आवश्यक हैं।
- प्रकाशित scan केवल तब वापस लिखते हैं जब `update: true` हो और scan सफलतापूर्वक पूरा हो।
- Response `202` होता है, साथ में `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }`।
- scan jobs asynchronous होते हैं। Manual scan request को सामान्य publish/backfill कार्य से पहले प्राथमिकता दी जाती है, लेकिन completion फिर भी worker availability पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए scan के लिए प्रमाणित poll endpoint।

- queued/running/succeeded/failed status लौटाता है।
- queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है ताकि clients दिखा सकें कि request से आगे कितने prioritized manual scan हैं। बहुत बड़ी queues bounded होती हैं और `queuedAheadIsEstimate: true` के साथ report की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` sections होते हैं।
- Failed scan jobs `lastError` के साथ `status: "failed"` लौटाते हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणित report archive endpoint।

- सफल scan आवश्यक है; non-terminal scan `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए versions के लिए प्रमाणित stored report archive endpoint।

- skill या plugin पर owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- ठीक उसी submitted version के stored scan results लौटाता है, जिसमें blocked या hidden versions भी शामिल हैं।
- `kind` default रूप से `skill` होता है; plugin/package scans के लिए `kind=plugin` उपयोग करें।
- scan-request downloads जैसा ही ZIP shape लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

Admin-only canonical batch rescan route। यह legacy `POST /api/v1/skills/-/rescan-batch` जैसा ही payload shape स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

Admin-only canonical batch status route। यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate counters लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया गया Skill Card verification envelope लौटाता है।

Query params:

- `version` (वैकल्पिक): specific version string।
- `tag` (वैकल्पिक): tagged version resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब selected version के पास generated Skill Card हो, moderation द्वारा malware-blocked न हो, और ClawScan verification clean हो।
- Skill identity, publisher identity, और selected version metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि shell automation उन्हें nested wrappers unpack किए बिना पढ़ सके।
- `security` top-level ClawScan/security verdict है। Automation को `ok`, `decision`, `reasons`, और `security.status` पर key करना चाहिए।
- `security.signals` में supporting scanner evidence होता है, जैसे `staticScan`, `virusTotal`, और `skillSpector`।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` रहती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve और store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

ठीक-ठीक skill versions के लिए current compact security verdicts लौटाता है। यह collection endpoint उन clients के लिए है जिन्हें पहले से पता है कि उन्हें कौन से installed ClawHub skill versions display करने हैं, जैसे OpenClaw Control UI।

Request:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

नोट्स:

- `items` में 1-100 unique `{ slug, version }` pairs होने चाहिए।
- Results प्रति item होते हैं; एक missing skill या version पूरे response को fail नहीं करता।
- Response security-only है। इसमें Skill Card data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं हैं।
- `security.signals` में केवल status-level supporting evidence होता है; full scanner details के लिए `/scan` या ClawHub security-audit page उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` रहती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; card content की जरूरत होने पर clients को installed `skill-card.md` locally पढ़ना चाहिए।
- single-skill Skill Card verification envelope की जरूरत हो तो `/verify`, generated card markdown की जरूरत हो तो `/card`, और detailed scanner data की जरूरत हो तो `/scan` उपयोग करें।

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

- डिफ़ॉल्ट रूप से नवीनतम संस्करण पर जाता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग एंडपॉइंट:

- Skills
- code Plugins
- bundle Plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, लेगेसी उपनाम `installs`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध Plugin पैकेजों (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले पैकेज एंडपॉइंट) तक सीमित हो।
  नियंत्रित श्रेणियाँ और लेगेसी v1 फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत
  दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` निश्चित-family उपनाम बने रहते हैं।
- Skill प्रविष्टियाँ skill रजिस्ट्री द्वारा समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अब भी केवल code-plugin और bundle-plugin रिलीज़ के लिए है।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणित कॉलर सूची/खोज परिणामों में उन प्रकाशकों के निजी पैकेज देख सकते हैं जिनसे वे संबंधित हैं।
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
  अनुरोध Plugin पैकेजों तक सीमित हो। नियंत्रित श्रेणियाँ और लेगेसी v1
  फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणित कॉलर उन प्रकाशकों के निजी पैकेज खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे पैकेज लौटाता है जिन्हें प्रमाणित कॉलर पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin पैकेजों में केवल-Plugin कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, लेगेसी उपनाम `installs`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

लेगेसी v1 फ़िल्टर उपनाम रीड एंडपॉइंट पर स्वीकार किए जाते रहते हैं:

- `mcp-tooling`, `data`, और `automation` का समाधान `tools` में होता है।
- `observability` और `deployment` का समाधान `gateway` में होता है।
- `dev-tools` का समाधान `runtime` में होता है।

`trending` सात-दिन का install/download लीडरबोर्ड है और सर्वकालिक कुलों का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` एंडपॉइंट पर यह केवल-Plugin है; Skill कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

लेगेसी उपनाम संग्रहित या लेखक-घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Skills का बल्क निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रतिसाद से पृष्ठांकन कर्सर।

प्रतिसाद:

- बॉडी: ZIP संग्रह।
- प्रत्येक निर्यातित Skill `{publisher}/{slug}/` पर रूटेड होता है।
- होस्टेड Skills में नवीनतम संग्रहित संस्करण फ़ाइलें शामिल होती हैं और
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध होती हैं।
- `clean` या `suspicious` स्कैन वाले वर्तमान GitHub-समर्थित Skills में
  `sourceRef: "public-github"`, रेपो, कमिट, पथ,
  सामग्री हैश, और आर्काइव URL के साथ `_source_handoff.json` शामिल होता है। इनमें ClawHub-होस्टेड स्रोत फ़ाइलें शामिल नहीं होतीं।
- प्रत्येक Skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- जब अलग-अलग Skills या फ़ाइलें निर्यात नहीं की जा सकीं, तो `_errors.json`
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

- `startDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ दोनों
  Plugin परिवार हैं।

प्रत्युत्तर:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यात किया गया Plugin `{family}/{packageName}/` पर रूट होता है।
- प्रत्येक निर्यात किए गए Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट में शामिल होता है।
- जब अलग-अलग Plugins या फ़ाइलें निर्यात नहीं की जा सकीं, तो `_errors.json` शामिल होता है।

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

नोट्स:

- `GET /api/v1/plugins` के अंतर्गत प्रलेखित legacy v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी digest पंक्तियों पर आधारित एक वास्तविक API फ़िल्टर है,
  न कि search-query rewrite।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में paginate नहीं होते।
- Plugin खोज के लिए Browser UI sort controls लोड किए गए relevance results को फिर से क्रमबद्ध करते हैं,
  जो वर्तमान `/skills` browse behavior से मेल खाता है।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट्स:

- Skills unified catalog में इस route के माध्यम से भी resolve हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि caller owning publisher को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को soft-delete करता है।

नोट्स:

- पैकेज owner, org publisher owner/admin,
  platform moderator, या platform admin के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

version history लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): pagination cursor

नोट्स:

- निजी पैकेज `404` लौटाते हैं, जब तक कि caller owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

एक पैकेज संस्करण लौटाता है, जिसमें file metadata, compatibility,
verification, artifact metadata, और scan data शामिल होते हैं।

नोट्स:

- `version.artifact.kind` पुरानी दुनिया के package archives के लिए `legacy-zip` या
  ClawPack-backed releases के लिए `npm-pack` है।
- ClawPack releases में npm-compatible `npmIntegrity`, `npmShasum`, और
  `npmTarballName` fields शामिल होते हैं।
- `version.sha256hash` पुराने clients के लिए deprecated compatibility metadata है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP bytes को hash करता है।
  Modern clients को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  canonical release artifact की पहचान करता है।
- scan data मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि caller owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

install clients के लिए सटीक package release security और trust summary लौटाता है।
यह तय करने के लिए कि resolved release install की जा सकती है या नहीं, यह सार्वजनिक OpenClaw consumption surface है।

प्रमाणीकरण:

- सार्वजनिक read endpoint। कोई owner, publisher, moderator, या admin token
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

- `package.name`, `package.displayName`, और `package.family` resolved registry package की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt` मूल्यांकित की गई सटीक release की पहचान करते हैं।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` release artifact के लिए ज्ञात होने पर मौजूद होते हैं।
- `trust.scanStatus` scanner inputs और manual release moderation से निकला effective trust status है।
- `trust.moderationState` nullable है। जब कोई manual release
  moderation मौजूद नहीं होता, तो यह `null` होता है।
- `trust.blockedFromDownload` install block signal है। OpenClaw और अन्य
  install clients को, scanner या moderation fields से blocking rules फिर से निकालने के बजाय,
  यह मान `true` होने पर installation block करनी चाहिए।
- `trust.reasons` user-facing और audit explanation list है। Reason codes
  स्थिर, compact strings हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक trust inputs अभी भी completion की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि trust summary outdated inputs से computed की गई थी और
  high-confidence allow decision से पहले इसे refresh आवश्यक मानना चाहिए।

नोट्स:

- यह endpoint version-exact है। Clients को इसे उस package version को resolve करने के बाद call करना चाहिए
  जिसे वे install करना चाहते हैं, केवल latest package metadata पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि caller owning publisher को पढ़ नहीं सकता।
- यह endpoint owner/moderator moderation endpoints से जानबूझकर narrow है।
  यह install decision और public explanation expose करता है, reporter identities,
  report bodies, private evidence, या internal review timelines नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

package version के लिए explicit artifact resolver metadata लौटाता है।

नोट्स:

- Legacy package versions एक `legacy-zip` artifact और legacy ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack versions एक `npm-pack` artifact, npm integrity fields, एक
  `tarballUrl`, और legacy ZIP compatibility URL लौटाते हैं।
- यह OpenClaw resolver surface है; यह shared URL से archive format का अनुमान लगाने से बचता है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

explicit resolver path के माध्यम से version artifact डाउनलोड करता है।

नोट्स:

- ClawPack versions exact uploaded npm-pack `.tgz` bytes stream करते हैं।
- Legacy ZIP versions `/api/v1/packages/{name}/download?version=` पर redirect करते हैं।
- download rate bucket का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw consumption के लिए computed readiness लौटाता है।

Readiness checks में शामिल हैं:

- official channel status
- latest version availability
- ClawPack npm-pack artifact availability
- artifact digest
- source repo और commit provenance
- OpenClaw compatibility metadata
- host targets
- scan state

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

official OpenClaw Plugin migration rows सूचीबद्ध करने के लिए moderator endpoint।

प्रमाणीकरण:

- moderator या admin user के लिए API token आवश्यक है।

क्वेरी पैरामीटर:

- `phase` (वैकल्पिक): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, या
  `all` (डिफ़ॉल्ट)।
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): pagination cursor

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

official Plugin migration row बनाने या update करने के लिए admin endpoint।

प्रमाणीकरण:

- admin user के लिए API token आवश्यक है।

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
- `packageName` npm-name normalized है; planned
  migrations के लिए package missing हो सकता है।
- यह केवल migration readiness track करता है। यह OpenClaw को mutate नहीं करता या
  ClawPacks generate नहीं करता।

### `GET /api/v1/packages/moderation/queue`

package release review queues के लिए moderator/admin endpoint।

प्रमाणीकरण:

- moderator या admin user के लिए API token आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): pagination cursor

Status meanings:

- `open`: suspicious, malicious, pending, quarantined, revoked, या reported releases।
- `blocked`: quarantined, revoked, या malicious releases।
- `manual`: manual moderation override वाली कोई भी release।
- `all`: manual override, non-clean scan state, या package report वाली कोई भी release।

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

moderator review के लिए package report करें। Reports package-level होते हैं, वैकल्पिक रूप से
किसी version से जुड़े होते हैं। वे moderation queue को feed करते हैं, लेकिन अपने-आप
downloads को auto-hide या block नहीं करते; moderators को artifacts को
approve, quarantine, या revoke करने के लिए release moderation का उपयोग करना चाहिए।

प्रमाणीकरण:

- API token आवश्यक है।

Request:

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

पैकेज रिपोर्ट स्वीकार करने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

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

- पैकेज मालिक, प्रकाशक सदस्य, मॉडरेटर, या एडमिन उपयोगकर्ता के लिए API टोकन
  आवश्यक है।

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

पैकेज रिपोर्ट को हल करने या फिर से खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open`
पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट योग्य वर्कफ़्लो में रिलीज़
मॉडरेशन लागू करने के लिए पुष्टि की गई रिपोर्ट के साथ `finalAction: "quarantine"`
या `finalAction: "revoke"` पास करें।

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
- `quarantined`: आगे की कार्रवाई लंबित रहने तक अवरुद्ध।
- `revoked`: किसी रिलीज़ पर पहले भरोसा किए जाने के बाद अवरुद्ध।

क्वारंटीन और रद्द की गई रिलीज़ें आर्टिफैक्ट डाउनलोड रूट से `403` लौटाती हैं।
हर परिवर्तन एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

पैकेज फ़ाइल के लिए कच्चा टेक्स्ट कंटेंट लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग होता है।
- डाउनलोड बकेट नहीं, रीड रेट बकेट का उपयोग करता है।
- बाइनरी फ़ाइलें `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal स्कैन पढ़ने को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ें फिर भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/download`

पैकेज रिलीज़ के लिए लेगेसी निर्धारक ZIP आर्काइव डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग होता है।
- Skills `GET /api/v1/download` पर रीडायरेक्ट करते हैं।
- Plugin/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें होते हैं ताकि पुराने
  OpenClaw क्लाइंट काम करते रहें।
- यह रूट केवल ZIP रहता है। यह ClawPack `.tgz` फ़ाइलें स्ट्रीम नहीं करता।
- रिज़ॉल्वर अखंडता जाँचों के लिए प्रतिक्रियाओं में `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type`, और `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल-रजिस्ट्री मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ें `403` लौटाती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक नहीं है।

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत पैक्यूमेंट लौटाता है।

नोट:

- केवल अपलोड किए गए ClawPack npm-pack टारबॉल वाले संस्करण सूचीबद्ध होते हैं।
- लेगेसी केवल-ZIP संस्करण जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत फ़ील्ड का उपयोग
  करते हैं ताकि उपयोगकर्ता चाहें तो npm को मिरर की ओर इंगित कर सकें।
- स्कोप्ड पैकेज पैक्यूमेंट `/api/npm/@scope/name` और npm के एन्कोडेड
  `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm मिरर क्लाइंट के लिए ठीक वही अपलोड किए गए ClawPack टारबॉल बाइट्स स्ट्रीम करता है।

नोट:

- डाउनलोड रेट बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 और npm integrity/shasum मेटाडेटा शामिल होता है।
- मॉडरेशन और निजी पैकेज पहुँच जाँचें अब भी लागू होती हैं।

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

होस्ट किया गया skill संस्करण ZIP डाउनलोड करता है, या `clean` या `suspicious`
स्कैन और बिना होस्टेड संस्करण वाले वर्तमान GitHub-समर्थित skill के लिए GitHub
स्रोत हैंडऑफ़ लौटाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (उदा. `latest`)

नोट:

- यदि न `version` दिया गया हो और न `tag`, तो नवीनतम संस्करण उपयोग किया जाता है।
- सॉफ्ट-डिलीट किए गए संस्करण `410` लौटाते हैं।
- GitHub-समर्थित skill हैंडऑफ़ बाइट्स को प्रॉक्सी या मिरर नहीं करते। JSON प्रतिक्रिया
  में `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; स्कैन/वर्तमान अवस्था एक गेट है और सफल
  पेलोड मेटाडेटा के रूप में शामिल नहीं होती।
- डाउनलोड आँकड़े प्रति UTC दिन अद्वितीय पहचानों के रूप में गिने जाते हैं (API टोकन मान्य होने पर `userId`, अन्यथा IP)।

## प्रमाणीकरण एंडपॉइंट (Bearer टोकन)

सभी एंडपॉइंट को यह आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन को सत्यापित करता है और उपयोगकर्ता हैंडल लौटाता है।

### `POST /api/v1/skills`

नया संस्करण प्रकाशित करता है।

- अनुशंसित: `payload` JSON + `files[]` ब्लॉब के साथ `multipart/form-data`।
- `files` (storageId-आधारित) वाला JSON बॉडी भी स्वीकार किया जाता है।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, API उस प्रकाशक को
  सर्वर-साइड रिज़ॉल्व करता है और अभिनेता के पास प्रकाशक पहुँच होना आवश्यक करता है।
- वैकल्पिक पेलोड फ़ील्ड: `migrateOwner`। `ownerHandle` के साथ `true` होने पर,
  यदि अभिनेता वर्तमान और लक्ष्य दोनों प्रकाशकों पर एडमिन/मालिक है, तो मौजूदा
  skill उस मालिक के पास जा सकता है। इस ऑप्ट-इन के बिना, मालिक परिवर्तन अस्वीकार
  कर दिए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है।

- Bearer टोकन प्रमाणीकरण आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत फ़ॉर्म फ़ील्ड हैं `payload`, दोहराए गए `files` ब्लॉब, या एक `clawpack`
  टारबॉल संदर्भ। `clawpack` एक `.tgz` ब्लॉब या upload-url फ़्लो द्वारा लौटाई गई
  storage id हो सकती है। स्टेज्ड storage-id प्रकाशनों में उस अपलोड URL के साथ
  लौटाया गया `clawpackUploadTicket` भी शामिल होना चाहिए।
- या तो `files` या `clawpack` उपयोग करें, एक ही अनुरोध में दोनों कभी नहीं।
- JSON बॉडी और कॉलर द्वारा दी गई `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार की जाती है।
- सीधे multipart प्रकाशन अनुरोध 18MB तक सीमित हैं। ClawPack टारबॉल 120MB
  टारबॉल सीमा तक upload-url फ़्लो का उपयोग कर सकते हैं।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, केवल एडमिन उस मालिक की ओर से प्रकाशित कर सकते हैं।

सत्यापन मुख्य बिंदु:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin पैकेजों के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` अपलोड में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins के लिए `package.json`, स्रोत रेपो मेटाडेटा, स्रोत कमिट
  मेटाडेटा, कॉन्फ़िग स्कीमा मेटाडेटा, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` org प्रकाशक और वर्तमान `openclaw` org सदस्यों के निजी प्रकाशक
  `official` चैनल में प्रकाशित कर सकते हैं।
- ऑन-बीहाफ प्रकाशन अब भी लक्ष्य मालिक खाते के विरुद्ध official-channel पात्रता सत्यापित करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill को सॉफ्ट-डिलीट / पुनर्स्थापित करें (मालिक, मॉडरेटर, या एडमिन)।

वैकल्पिक JSON बॉडी:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill मॉडरेशन नोट के रूप में संग्रहीत होता है और ऑडिट लॉग में कॉपी किया जाता है।
मालिक द्वारा शुरू किए गए सॉफ्ट डिलीट slug को 30 दिनों तक आरक्षित रखते हैं, फिर slug किसी
दूसरे प्रकाशक द्वारा दावा किया जा सकता है। जब यह समाप्ति लागू होती है, तो delete प्रतिक्रिया में `slugReservedUntil` शामिल होता है।
मॉडरेटर/एडमिन द्वारा छिपाना और सुरक्षा हटाने इस तरह समाप्त नहीं होते।

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

केवल एडमिन। किसी हैंडल के लिए org प्रकाशक मौजूद होना सुनिश्चित करता है। यदि हैंडल अब भी
लेगेसी साझा उपयोगकर्ता/निजी प्रकाशक की ओर इशारा करता है, तो एंडपॉइंट पहले उसे org प्रकाशक में माइग्रेट करता है।
नए बनाए गए org के लिए, `memberHandle` दें; कार्यरत एडमिन को सदस्य के रूप में नहीं जोड़ा जाता।
`memberRole` डिफ़ॉल्ट रूप से `owner` होता है।

- बॉडी: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- प्रतिक्रिया: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

प्रमाणीकृत सेल्फ-सर्व org प्रकाशक निर्माण। नया org प्रकाशक बनाता है और
कॉलर को मालिक के रूप में जोड़ता है। यह एंडपॉइंट मौजूदा उपयोगकर्ता/निजी हैंडल माइग्रेट नहीं करता और
प्रकाशक को trusted/official के रूप में चिह्नित नहीं करता।

- बॉडी: `{ "handle": "opik", "displayName": "Opik" }`
- प्रतिक्रिया: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब हैंडल पहले से किसी प्रकाशक, उपयोगकर्ता, या निजी प्रकाशक द्वारा उपयोग किया गया हो, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल एडमिन। रिलीज़ प्रकाशित किए बिना वैध मालिक के लिए रूट slugs और पैकेज नाम आरक्षित करता है।
पैकेज नाम बिना रिलीज़ पंक्तियों वाले निजी प्लेसहोल्डर पैकेज बन जाते हैं, ताकि वही मालिक
बाद में वास्तविक code-plugin या bundle-plugin रिलीज़ उस नाम में प्रकाशित कर सके।

- बॉडी: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- प्रतिक्रिया: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल एडमिन। Convex Auth खाता पंक्तियों को संपादित किए बिना सत्यापित प्रतिस्थापन GitHub OAuth प्रिंसिपल
के लिए निजी प्रकाशक को पुनर्प्राप्त करता है। अनुरोध में दोनों अपरिवर्तनीय GitHub
प्रदाता खाता id नामित होने चाहिए; परिवर्तनीय हैंडल केवल ऑपरेटर-सामना गार्ड के रूप में उपयोग होते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से dry-run होता है। रिकवरी लागू करने के लिए स्टाफ़ द्वारा दोनों GitHub principals के बीच निरंतरता को स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब गंतव्य उपयोगकर्ता के मौजूदा personal
publisher के पास skills, packages, या GitHub skill sources हों, तो रिकवरी fail closed होती है।
रिकवरी, recover किए गए publisher की skills, skill slug aliases, packages, package inspector warnings, और derived search digest rows के लिए पुराने `ownerUserId` फ़ील्ड भी migrate करती है ताकि
direct-owner paths नए publisher authority से मेल खाएँ। recover किए गए handle के लिए active protected-handle
reservation भी replacement user को फिर से assign कर दी जाती है ताकि बाद में
profile synchronization पूर्व उपयोगकर्ता की competing authority को restore न कर सके। प्रत्येक primary table प्रति apply transaction
100 rows तक सीमित है; बड़ी recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped होते हैं और उन्हें rewrite करने के बजाय checked के रूप में report किया जाता है।

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "issue #2555 के लिए account continuity verified", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "issue #2555 के लिए account continuity verified" }`

### Owner slug management endpoints

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

नोट्स:

- दोनों endpoints को API token auth की आवश्यकता होती है और ये केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` source listing को छिपाता है और source slug को target listing पर redirect करता है।

### Transfer ownership endpoints

- `POST /api/v1/skills/{slug}/transfer`
  - Body: `{ "toUserHandle": "target_handle", "message": "optional" }`
  - Response: `{ "ok": true, "transferId": "skillOwnershipTransfers:...", "toUserHandle": "target_handle", "expiresAt": 1730000000000 }`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
  - Response (accept/reject/cancel): `{ "ok": true, "skillSlug": "demo-skill?" }`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
  - Response shape: `{ "transfers": [{ "_id": "...", "skill": { "slug": "demo", "displayName": "Demo" }, "fromUser"|"toUser": { "handle": "..." }, "message": "...", "requestedAt": 0, "expiresAt": 0 }] }`

### `POST /api/v1/users/ban`

किसी उपयोगकर्ता को ban करें और owned skills को hard-delete करें (केवल moderator/admin)।

Body:

```json
{ "handle": "user_handle", "reason": "optional ban reason" }
```

या

```json
{ "userId": "users_...", "reason": "optional ban reason" }
```

Response:

```json
{ "ok": true, "alreadyBanned": false, "deletedSkills": 3 }
```

### `POST /api/v1/users/unban`

किसी उपयोगकर्ता को unban करें और पात्र skills को restore करें (केवल admin)।

Body:

```json
{ "handle": "user_handle", "reason": "optional unban reason" }
```

या

```json
{ "userId": "users_...", "reason": "optional unban reason" }
```

Response:

```json
{ "ok": true, "alreadyUnbanned": false, "restoredSkills": 3 }
```

### `POST /api/v1/users/reclassify-ban`

unban या content restore किए बिना मौजूदा ban के stored reason को बदलें (केवल admin)। जब तक `dryRun` `false` न हो, डिफ़ॉल्ट dry-run होता है।

Body:

```json
{ "handle": "user_handle", "reason": "bulk publishing spam", "dryRun": true }
```

या

```json
{ "userId": "users_...", "reason": "bulk publishing spam", "dryRun": false }
```

Response:

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

किसी user role को बदलें (केवल admin)।

Body:

```json
{ "handle": "user_handle", "role": "moderator" }
```

या

```json
{ "userId": "users_...", "role": "admin" }
```

Response:

```json
{ "ok": true, "role": "moderator" }
```

### `GET /api/v1/users`

उपयोगकर्ताओं को सूचीबद्ध करें या खोजें (केवल admin)।

Query params:

- `q` (optional): search query
- `query` (optional): `q` के लिए alias
- `limit` (optional): अधिकतम results (default 20, max 200)

Response:

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

star जोड़ें/हटाएँ (highlights)। दोनों endpoints idempotent हैं।

Responses:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI endpoints (deprecated)

पुराने CLI versions के लिए अब भी supported हैं:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

removal plan के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। Package
publishes जो ClawPack tarball को stage करते हैं, उन्हें resulting storage id को
`clawpack` के रूप में और returned ticket को `clawpackUploadTicket` के रूप में भेजना होगा।

## Registry discovery (`/.well-known/clawhub.json`)

CLI site से registry/auth settings discover कर सकता है:

- `/.well-known/clawhub.json` (JSON, preferred)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो यह file serve करें (या `CLAWHUB_REGISTRY` explicit रूप से set करें; legacy `CLAWDHUB_REGISTRY`)।
