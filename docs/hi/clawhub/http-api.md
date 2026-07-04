---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण).
x-i18n:
    generated_at: "2026-07-04T03:46:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

आधार URL: `https://clawhub.ai` (डिफ़ॉल्ट).

सभी v1 पथ `/api/v1/...` के अंतर्गत हैं।
लेगेसी `/api/...` और `/api/cli/...` संगतता के लिए बने हुए हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`.

## सार्वजनिक कैटलॉग पुनः उपयोग

तृतीय-पक्ष डायरेक्टरियाँ ClawHub Skills को सूचीबद्ध या खोजने के लिए सार्वजनिक रीड एंडपॉइंट्स का उपयोग कर सकती हैं। कृपया परिणाम कैश करें, `429`/`Retry-After` का सम्मान करें, उपयोगकर्ताओं को कैनॉनिकल ClawHub लिस्टिंग (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और तृतीय-पक्ष साइट के लिए ClawHub समर्थन का संकेत देने से बचें। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन-ब्लॉक की गई सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट्स को रूट प्राथमिकता को फिर से बनाने के बजाय रीड एंडपॉइंट्स द्वारा लौटाए गए कैनॉनिकल URL का उपयोग करना चाहिए।

## दर सीमाएँ

प्रवर्तन मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer token): प्रति उपयोगकर्ता बकेट लागू।
- यदि टोकन अनुपस्थित/अमान्य है, तो व्यवहार IP प्रवर्तन पर वापस जाता है।
- प्रमाणित राइट एंडपॉइंट्स को तब केवल `Unauthorized` नहीं लौटाना चाहिए जब
  सर्वर कारण जानता हो। अनुपस्थित टोकन, अमान्य/निरस्त टोकन, और
  हटाए गए/प्रतिबंधित/अक्षम खाते, प्रत्येक को कार्रवाई योग्य पाठ मिलना चाहिए ताकि CLI
  क्लाइंट्स उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- रीड: प्रति IP 3000/min, प्रति कुंजी 12000/min
- राइट: प्रति IP 300/min, प्रति कुंजी 3000/min
- डाउनलोड: प्रति IP 1200/min, प्रति कुंजी 6000/min (डाउनलोड एंडपॉइंट्स)

हेडर:

- लेगेसी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

हेडर अर्थ:

- `X-RateLimit-Reset`: पूर्ण Unix epoch सेकंड
- `RateLimit-Reset`: रीसेट तक सेकंड (विलंब)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: उपस्थित होने पर सटीक शेष बजट।
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
- सिंक्रनाइज़ पुनः प्रयासों से बचने के लिए जिटरयुक्त बैकऑफ का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` पर वापस जाएँ (या `X-RateLimit-Reset` से गणना करें)।

IP स्रोत:

- विश्वसनीय क्लाइंट IP हेडर, जिनमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब
  डिप्लॉयमेंट विश्वसनीय फ़ॉरवर्डेड हेडर स्पष्ट रूप से सक्षम करता है।
- ClawHub एज पर क्लाइंट IPs की पहचान करने के लिए विश्वसनीय फ़ॉरवर्डिंग हेडर का उपयोग करता है।
- यदि कोई विश्वसनीय क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध fallback बकेट्स का उपयोग करते हैं
  जो केवल दर-सीमा प्रकार द्वारा स्कोप किए जाते हैं। इन fallback बकेट्स में
  कॉलर-दिए गए पथ, स्लग, पैकेज नाम, संस्करण, क्वेरी स्ट्रिंग्स, या अन्य
  आर्टिफैक्ट पैरामीटर शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएँ

सार्वजनिक v1 त्रुटि प्रतिक्रियाएँ `content-type: text/plain; charset=utf-8` के साथ सादा पाठ हैं।
इसमें सत्यापन विफलताएँ (`400`), अनुपस्थित सार्वजनिक संसाधन (`404`), auth और
अनुमति विफलताएँ (`401`/`403`), दर सीमाएँ (`429`), और ब्लॉक किए गए डाउनलोड शामिल हैं। क्लाइंट्स
को प्रतिक्रिया बॉडी को मानव-पठनीय स्ट्रिंग के रूप में पढ़ना चाहिए। अज्ञात क्वेरी पैरामीटर
संगतता के लिए अनदेखे किए जाते हैं, लेकिन अमान्य मानों वाले पहचाने गए क्वेरी पैरामीटर
`400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट्स (कोई auth नहीं)

### `GET /api/v1/search`

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक
- `highlightedOnly` (वैकल्पिक): हाइलाइट किए गए Skills तक फ़िल्टर करने के लिए `true`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए लेगेसी alias

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

- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं (embedding समानता + सटीक slug/name token boosts + छोटा popularity prior)।
- प्रासंगिकता लोकप्रियता से अधिक मजबूत है। सटीक slug या display-name token match, बहुत अधिक engagement वाले ढीले match से ऊपर रैंक कर सकता है।
- ASCII पाठ को शब्द और विराम-चिह्न सीमाओं पर tokenized किया जाता है। उदाहरण के लिए, `personal-map` में स्वतंत्र `map` token है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में अधिक मजबूत lexical match मिलता है।
- लोकप्रियता log-scaled और capped है। High-engagement Skills नीचे रैंक कर सकते हैं जब क्वेरी पाठ कमजोर match हो।
- संदिग्ध या छिपी मॉडरेशन स्थिति, कॉलर फ़िल्टर और वर्तमान मॉडरेशन स्थिति के आधार पर किसी skill को सार्वजनिक खोज से हटा सकती है।

प्रकाशक खोजयोग्यता मार्गदर्शन:

- जिन शब्दों को उपयोगकर्ता सचमुच खोजेंगे, उन्हें display name, summary, और tags में रखें। standalone slug token का उपयोग केवल तब करें जब वह एक स्थिर पहचान भी हो जिसे आप रखना चाहते हैं।
- केवल किसी एक क्वेरी का पीछा करने के लिए slug का नाम न बदलें, जब तक नया slug बेहतर दीर्घकालिक कैनॉनिकल नाम न हो। पुराने slugs redirect aliases बन जाते हैं, लेकिन कैनॉनिकल URL, प्रदर्शित slug, और भविष्य के search digests नया slug उपयोग करते हैं।
- Rename aliases पुराने URLs और उन installs के लिए resolution बनाए रखते हैं जो registry के माध्यम से resolve करते हैं, लेकिन search ranking rename indexed होने के बाद canonical skill metadata पर आधारित होती है। मौजूदा stats skill के साथ बने रहते हैं।
- यदि कोई skill अप्रत्याशित रूप से अदृश्य है, तो ranking-related metadata बदलने से पहले लॉग इन रहते हुए `clawhub inspect @owner/slug` के साथ पहले moderation state जाँचें।

### `GET /api/v1/skills`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–200)
- `cursor` (वैकल्पिक): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर map होते हैं, `trending`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए लेगेसी alias

अमान्य `sort` मान `400` लौटाते हैं।

नोट्स:

- `recommended` engagement और recency signals का उपयोग करता है।
- `trending` पिछले 7 दिनों के installs के आधार पर रैंक करता है (telemetry-based)।
- `createdAt` new-skill crawls के लिए स्थिर है; `updated` तब बदलता है जब मौजूदा Skills फिर से प्रकाशित किए जाते हैं।
- जब `nonSuspiciousOnly=true` हो, cursor-based sorts किसी पेज पर `limit` से कम आइटम लौटा सकते हैं क्योंकि संदिग्ध Skills पेज retrieval के बाद फ़िल्टर किए जाते हैं।
- उपस्थित होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। छोटा पेज अपने आप end-of-results नहीं दर्शाता।

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

- owner rename/merge flows द्वारा बनाए गए पुराने slugs canonical skill पर resolve होते हैं।
- `metadata.os`: skill frontmatter में घोषित OS प्रतिबंध (जैसे `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix system targets (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि skill में कोई platform metadata नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब skill flagged हो या owner उसे देख रहा हो।

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

- owners और moderators hidden Skills के लिए moderation details access कर सकते हैं।
- सार्वजनिक callers केवल already-flagged visible Skills के लिए `200` पाते हैं।
- Evidence सार्वजनिक callers के लिए redacted है और केवल owners/moderators के लिए raw snippets शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

moderator review के लिए skill report करें। Reports skill-level हैं, वैकल्पिक रूप से
किसी version से linked हैं, और skill report queue को feed करते हैं।

Auth:

- API token आवश्यक है।

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

skill report intake के लिए moderator/admin endpoint.

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

skill reports को resolve या reopen करने के लिए moderator/admin endpoint.

अनुरोध:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` `confirmed` और `dismissed` के लिए आवश्यक है; `status` को वापस `open` पर
set करते समय इसे छोड़ा जा सकता है। triaged report के साथ `finalAction: "hide"` पास करें ताकि
उसी auditable workflow में skill को hide किया जा सके।

### `GET /api/v1/skills/{slug}/versions`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक
- `cursor` (वैकल्पिक): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

version metadata + files list लौटाता है।

- `version.security` normalized scan verification status और scanner details
  (VirusTotal + LLM) शामिल करता है, जब उपलब्ध हो।

### `GET /api/v1/skills/{slug}/scan`

skill version के लिए security scan verification details लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट version string.
- `tag` (वैकल्पिक): tagged version resolve करें (उदाहरण के लिए `latest`).

नोट्स:

- यदि `version` या `tag` में से कोई भी प्रदान नहीं किया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति के साथ स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निर्णायक निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से व्युत्पन्न वर्तमान Skills-स्तर का मॉडरेशन स्नैपशॉट है।
- ऐतिहासिक संस्करण क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

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

टिप्पणियां:

- स्कैन अनुरोध पेलोड और डाउनलोड योग्य रिपोर्ट अवधारण अवधि के बाद स्कैन-अनुरोध स्टोर से समाप्त हो जाते हैं।
- प्रकाशित स्कैन के लिए स्वामी/प्रकाशक प्रबंधन पहुंच, या प्लेटफॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- प्रकाशित स्कैन केवल तब वापस लिखते हैं जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो।
- प्रतिक्रिया `202` होती है, जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- स्कैन नौकरियां असमकालिक होती हैं। मैन्युअल स्कैन अनुरोधों को सामान्य प्रकाशन/बैकफिल कार्य से पहले प्राथमिकता दी जाती है, लेकिन पूर्णता फिर भी वर्कर उपलब्धता पर निर्भर करती है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणित पोल एंडपॉइंट।

- कतारबद्ध/चल रहा/सफल/विफल स्थिति लौटाता है।
- कतारबद्ध होने पर `queue.queuedAhead` और `queue.position` लौटाता है, ताकि क्लाइंट दिखा सकें कि अनुरोध से पहले कितने प्राथमिकता प्राप्त मैन्युअल स्कैन हैं। बहुत बड़ी कतारें सीमित की जाती हैं और `queuedAheadIsEstimate: true` के साथ रिपोर्ट की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` अनुभाग होते हैं।
- विफल स्कैन नौकरियां `lastError` के साथ `status: "failed"` लौटाती हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणित रिपोर्ट आर्काइव एंडपॉइंट।

- सफल स्कैन की आवश्यकता होती है; गैर-अंतिम स्कैन `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ एक ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए संस्करणों के लिए प्रमाणित संग्रहीत रिपोर्ट आर्काइव एंडपॉइंट।

- Skill या Plugin के लिए स्वामी/प्रकाशक प्रबंधन पहुंच, या प्लेटफॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- ठीक सबमिट किए गए संस्करण के लिए संग्रहीत स्कैन परिणाम लौटाता है, जिसमें अवरुद्ध या छिपे हुए संस्करण शामिल हैं।
- `kind` का डिफॉल्ट `skill` है; Plugin/पैकेज स्कैन के लिए `kind=plugin` का उपयोग करें।
- स्कैन-अनुरोध डाउनलोड जैसा ही ZIP आकार लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

केवल एडमिन के लिए कैनॉनिकल बैच रीस्कैन रूट। यह विरासत `POST /api/v1/skills/-/rescan-batch` जैसा ही पेलोड आकार स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

केवल एडमिन के लिए कैनॉनिकल बैच स्थिति रूट। यह `{ "jobIds": ["..."] }` स्वीकार करता है और विरासत `POST /api/v1/skills/-/rescan-batch/status` जैसे ही समेकित काउंटर लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला Skill Card सत्यापन एनवेलप लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किए गए संस्करण को रिजॉल्व करें (उदाहरण के लिए `latest`)।

टिप्पणियां:

- `ok` केवल तब `true` होता है जब चयनित संस्करण में जनरेट किया गया Skill Card हो, वह मॉडरेशन द्वारा मैलवेयर-अवरुद्ध न हो, और ClawScan सत्यापन साफ हो।
- Skill पहचान, प्रकाशक पहचान, और चयनित संस्करण मेटाडेटा शीर्ष-स्तरीय एनवेलप फील्ड (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं, ताकि शेल ऑटोमेशन उन्हें नेस्टेड रैपर अनपैक किए बिना पढ़ सके।
- `security` शीर्ष-स्तरीय ClawScan/सुरक्षा निर्णय है। ऑटोमेशन को `ok`, `decision`, `reasons`, और `security.status` पर आधारित होना चाहिए।
- `security.signals` में `staticScan`, `virusTotal`, और `skillSpector` जैसे सहायक स्कैनर साक्ष्य होते हैं।
- `security.signals.dependencyRegistry` v1 प्रतिक्रिया संगतता के लिए रखा गया है, लेकिन डिपेंडेंसी रजिस्ट्री अस्तित्व स्कैनर सेवानिवृत्त है और यह कुंजी हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने प्रकाशन या आयात के दौरान GitHub repo/ref/commit/path रिजॉल्व और संग्रहीत किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

ठीक Skill संस्करणों के लिए वर्तमान संक्षिप्त सुरक्षा निर्णय लौटाता है। यह कलेक्शन एंडपॉइंट उन क्लाइंट के लिए है जिन्हें पहले से पता है कि उन्हें कौन से इंस्टॉल किए गए ClawHub Skill संस्करण दिखाने हैं, जैसे OpenClaw Control UI।

अनुरोध:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

टिप्पणियां:

- `items` में 1-100 अद्वितीय `{ slug, version }` जोड़े होने चाहिए।
- परिणाम प्रत्येक आइटम के अनुसार होते हैं; एक अनुपस्थित Skill या संस्करण पूरी प्रतिक्रिया को विफल नहीं करता।
- प्रतिक्रिया केवल सुरक्षा-संबंधी है। इसमें Skill Card डेटा, जनरेटेड कार्ड स्थिति, आर्टिफैक्ट फाइल सूचियां, या विस्तृत स्कैनर पेलोड शामिल नहीं हैं।
- `security.signals` में केवल स्थिति-स्तर के सहायक साक्ष्य होते हैं; पूर्ण स्कैनर विवरण के लिए `/scan` या ClawHub सुरक्षा-ऑडिट पेज का उपयोग करें।
- `security.signals.dependencyRegistry` v1 प्रतिक्रिया संगतता के लिए रखा गया है, लेकिन डिपेंडेंसी रजिस्ट्री अस्तित्व स्कैनर सेवानिवृत्त है और यह कुंजी हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस एंडपॉइंट के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; जब क्लाइंट को कार्ड सामग्री चाहिए, तो उन्हें इंस्टॉल किया गया `skill-card.md` स्थानीय रूप से पढ़ना चाहिए।
- जब आपको एकल-Skill Skill Card सत्यापन एनवेलप चाहिए तो `/verify` का उपयोग करें, जब आपको जनरेटेड कार्ड Markdown चाहिए तो `/card` का उपयोग करें, और जब आपको विस्तृत स्कैनर डेटा चाहिए तो `/scan` का उपयोग करें।

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
- फ़ाइल आकार सीमा: 200KB.

### `GET /api/v1/packages`

इसके लिए एकीकृत कैटलॉग एंडपॉइंट:

- Skills
- कोड Plugin
- बंडल Plugin

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
  नियंत्रित श्रेणियां और लेगेसी v1 फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत
  दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` निश्चित-फ़ैमिली उपनाम बने रहते हैं।
- Skill प्रविष्टियां Skill रजिस्ट्री से समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अब भी केवल code-plugin और bundle-plugin रिलीज़ के लिए है।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणित कॉलर सूची/खोज परिणामों में उन प्रकाशकों के निजी पैकेज देख सकते हैं जिनसे वे संबद्ध हैं।
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
- प्रमाणित कॉलर उन प्रकाशकों के निजी पैकेज खोज सकते हैं जिनसे वे संबद्ध हैं।
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
  `tools`, `runtime`, `gateway`, `security`, `other`.

लेगेसी v1 फ़िल्टर उपनाम रीड एंडपॉइंट पर स्वीकार किए जाते रहेंगे:

- `mcp-tooling`, `data`, और `automation` `tools` में रिज़ॉल्व होते हैं।
- `observability` और `deployment` `gateway` में रिज़ॉल्व होते हैं।
- `dev-tools` `runtime` में रिज़ॉल्व होता है।

`trending` सात-दिवसीय इंस्टॉल/डाउनलोड लीडरबोर्ड है और सर्वकालिक कुलों का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` एंडपॉइंट पर यह केवल-Plugin है; Skill कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

लेगेसी उपनाम संग्रहीत या लेखक-घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Skills का बल्क निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`.
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर से पृष्ठांकन कर्सर।

प्रत्युत्तर:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यात की गई Skill `{publisher}/{slug}/` पर रूटेड होती है।
- होस्ट की गई Skills में नवीनतम संग्रहीत संस्करण फ़ाइलें शामिल होती हैं और
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध होती हैं।
- `clean` या `suspicious` स्कैन वाली मौजूदा GitHub-समर्थित Skills में
  `sourceRef: "public-github"`, रेपो, कमिट, पथ,
  सामग्री हैश, और आर्काइव URL के साथ `_source_handoff.json` शामिल होता है। इनमें ClawHub-होस्टेड स्रोत फ़ाइलें शामिल नहीं होतीं।
- प्रत्येक Skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- जब अलग-अलग Skills या फ़ाइलें निर्यात नहीं की जा सकीं, तब
  `_errors.json` शामिल होता है।

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
- `cursor` (वैकल्पिक): पिछले रिस्पॉन्स से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ दोनों
  Plugin परिवार हैं।

रिस्पॉन्स:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Plugin `{family}/{packageName}/` पर रूट होता है।
- प्रत्येक निर्यातित Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Plugins या फ़ाइलें निर्यात नहीं की जा
  सकीं।

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
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। मौजूदा मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

नोट्स:

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित लेगेसी v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी डाइजेस्ट पंक्तियों द्वारा समर्थित वास्तविक API फ़िल्टर है,
  खोज-क्वेरी पुनर्लेखन नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पेजिनेट नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को पुनः क्रमित करते हैं,
  जो मौजूदा `/skills` ब्राउज़ व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट्स:

- Skills एकीकृत कैटलॉग में इस रूट से भी रिज़ॉल्व हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ न सके।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को सॉफ़्ट-डिलीट करता है।

नोट्स:

- पैकेज मालिक, संगठन प्रकाशक मालिक/एडमिन, प्लेटफ़ॉर्म मॉडरेटर, या प्लेटफ़ॉर्म एडमिन के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

वर्शन इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

नोट्स:

- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ न सके।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता, सत्यापन, आर्टिफैक्ट मेटाडेटा, और स्कैन डेटा सहित एक पैकेज वर्शन लौटाता है।

नोट्स:

- `version.artifact.kind` पुराने-पद्धति पैकेज आर्काइव के लिए `legacy-zip` या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack` है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स को हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैननिकल रिलीज़ आर्टिफैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ न सके।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और भरोसा सारांश लौटाता है।
यह यह तय करने के लिए सार्वजनिक OpenClaw उपभोग सतह है कि कोई
रिज़ॉल्व की गई रिलीज़ इंस्टॉल की जा सकती है या नहीं।

प्रमाणीकरण:

- सार्वजनिक पठन एंडपॉइंट। किसी मालिक, प्रकाशक, मॉडरेटर, या एडमिन टोकन की
  आवश्यकता नहीं है।

रिस्पॉन्स:

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

रिस्पॉन्स फ़ील्ड:

- `package.name`, `package.displayName`, और `package.family` रिज़ॉल्व किए गए
  रजिस्ट्री पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt` मूल्यांकित की गई
  सटीक रिलीज़ की पहचान करते हैं।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफैक्ट के लिए ज्ञात होने पर
  मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैनुअल रिलीज़ मॉडरेशन से निकाली गई प्रभावी भरोसा स्थिति है।
- `trust.moderationState` nullable है। जब कोई मैनुअल रिलीज़ मॉडरेशन मौजूद नहीं होता,
  यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल ब्लॉक संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को, स्कैनर या मॉडरेशन फ़ील्ड से ब्लॉकिंग नियम फिर से निकालने के बजाय,
  इस मान के `true` होने पर इंस्टॉलेशन ब्लॉक करना चाहिए।
- `trust.reasons` उपयोगकर्ता-दृश्य और ऑडिट व्याख्या सूची है। कारण कोड
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक भरोसा इनपुट अभी भी पूर्णता की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि भरोसा सारांश पुराने इनपुट से गणना किया गया था और
  उच्च-विश्वास अनुमति निर्णय से पहले इसे रिफ़्रेश आवश्यक माना जाना चाहिए।

नोट्स:

- यह एंडपॉइंट वर्शन-सटीक है। क्लाइंट को इसे उस पैकेज वर्शन को रिज़ॉल्व करने के बाद कॉल करना चाहिए
  जिसे वे इंस्टॉल करना चाहते हैं, केवल नवीनतम पैकेज मेटाडेटा पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ न सके।
- यह एंडपॉइंट मालिक/मॉडरेटर मॉडरेशन एंडपॉइंट से जानबूझकर संकरा है।
  यह इंस्टॉल निर्णय और सार्वजनिक व्याख्या उजागर करता है, रिपोर्टर पहचान,
  रिपोर्ट बॉडी, निजी साक्ष्य, या आंतरिक समीक्षा टाइमलाइन नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज वर्शन के लिए स्पष्ट आर्टिफैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

नोट्स:

- लेगेसी पैकेज वर्शन `legacy-zip` आर्टिफैक्ट और लेगेसी ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack वर्शन `npm-pack` आर्टिफैक्ट, npm इंटीग्रिटी फ़ील्ड,
  `tarballUrl`, और लेगेसी ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से आर्काइव फ़ॉर्मैट का अनुमान लगाने से बचती है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से वर्शन आर्टिफैक्ट डाउनलोड करता है।

नोट्स:

- ClawPack वर्शन सटीक अपलोड किए गए npm-pack `.tgz` बाइट्स स्ट्रीम करते हैं।
- लेगेसी ZIP वर्शन `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट करते हैं।
- डाउनलोड रेट बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw उपभोग के लिए गणित तत्परता लौटाता है।

तत्परता जांचें शामिल करती हैं:

- आधिकारिक चैनल स्थिति
- नवीनतम वर्शन उपलब्धता
- ClawPack npm-pack आर्टिफैक्ट उपलब्धता
- आर्टिफैक्ट डाइजेस्ट
- स्रोत रेपो और कमिट प्रॉवेनेन्स
- OpenClaw संगतता मेटाडेटा
- होस्ट लक्ष्य
- स्कैन स्थिति

रिस्पॉन्स:

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

रिस्पॉन्स:

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

नोट्स:

- `bundledPluginId` को लोअरकेस में सामान्यीकृत किया जाता है और यह स्थिर upsert कुंजी है।
- `packageName` npm-नाम सामान्यीकृत है; नियोजित माइग्रेशन के लिए पैकेज अनुपस्थित हो सकता है।
- यह केवल माइग्रेशन तत्परता ट्रैक करता है। यह OpenClaw को परिवर्तित नहीं करता या
  ClawPacks उत्पन्न नहीं करता।

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

रिस्पॉन्स:

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

मॉडरेटर समीक्षा के लिए पैकेज रिपोर्ट करें। रिपोर्ट पैकेज-स्तर की होती हैं, वैकल्पिक रूप से
किसी वर्शन से जुड़ी हुई। वे मॉडरेशन कतार को फ़ीड करती हैं लेकिन स्वयं डाउनलोड को
स्वतः छिपाती या ब्लॉक नहीं करतीं; मॉडरेटर को आर्टिफैक्ट को अनुमोदित, क्वारंटीन, या रद्द करने के लिए
रिलीज़ मॉडरेशन का उपयोग करना चाहिए।

प्रमाणीकरण:

- API टोकन आवश्यक है।

अनुरोध:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

रिस्पॉन्स:

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

पैकेज रिपोर्ट ग्रहण के लिए मॉडरेटर/एडमिन एंडपॉइंट।

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

पैकेज मॉडरेशन दृश्यता के लिए स्वामी/मॉडरेटर एंडपॉइंट।

प्रमाणीकरण:

- पैकेज स्वामी, प्रकाशक सदस्य, मॉडरेटर, या एडमिन उपयोगकर्ता के लिए API टोकन
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

पैकेज रिपोर्टों को हल करने या फिर से खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

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
मॉडरेशन लागू करने के लिए पुष्ट रिपोर्ट के साथ `finalAction: "quarantine"` या
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

समर्थित स्थितियां:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई।
- `quarantined`: आगे की कार्रवाई लंबित रहने तक अवरुद्ध।
- `revoked`: पहले विश्वसनीय मानी गई रिलीज़ के बाद अवरुद्ध।

क्वारंटीन और रद्द की गई रिलीज़ आर्टिफैक्ट डाउनलोड रूट से `403` लौटाती हैं।
हर बदलाव एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

किसी पैकेज फ़ाइल के लिए कच्ची टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियां:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- डाउनलोड बकेट नहीं, रीड रेट बकेट का उपयोग करता है।
- बाइनरी फ़ाइलें `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal स्कैन पढ़ने को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ अब भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/download`

किसी पैकेज रिलीज़ के लिए लेगेसी निर्धारक ZIP आर्काइव डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियां:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- Skills `GET /api/v1/download` पर रीडायरेक्ट होती हैं।
- Plugin/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें हैं ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह रूट केवल ZIP रहता है। यह ClawPack `.tgz` फ़ाइलें स्ट्रीम नहीं करता।
- प्रतिक्रिया में रिज़ॉल्वर इंटेग्रिटी जांचों के लिए `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type`, और `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल-रजिस्ट्री मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी न हो।

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत पैक्यूमेंट लौटाता है।

टिप्पणियां:

- केवल अपलोड किए गए ClawPack npm-pack tarball वाले संस्करण सूचीबद्ध किए जाते हैं।
- लेगेसी केवल-ZIP संस्करण जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत
  फ़ील्ड का उपयोग करते हैं ताकि उपयोगकर्ता चाहें तो npm को मिरर पर इंगित कर सकें।
- स्कोप्ड पैकेज पैक्यूमेंट `/api/npm/@scope/name` और npm के
  एन्कोडेड `/api/npm/@scope%2Fname` अनुरोध पाथ, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm मिरर क्लाइंट के लिए ठीक अपलोड किए गए ClawPack tarball बाइट्स स्ट्रीम करता है।

टिप्पणियां:

- डाउनलोड रेट बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 के साथ npm integrity/shasum मेटाडेटा शामिल होता है।
- मॉडरेशन और निजी पैकेज एक्सेस जांचें अब भी लागू होती हैं।

### `GET /api/v1/resolve`

CLI द्वारा local fingerprint को ज्ञात संस्करण से मैप करने के लिए उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): बंडल फ़िंगरप्रिंट का 64-अक्षर hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

होस्टेड skill संस्करण ZIP डाउनलोड करता है, या `clean` या `suspicious` स्कैन और
बिना होस्टेड संस्करण वाली वर्तमान GitHub-समर्थित skill के लिए GitHub स्रोत
हैंडऑफ़ लौटाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (जैसे `latest`)

टिप्पणियां:

- यदि `version` या `tag` में से कोई भी नहीं दिया गया है, तो नवीनतम संस्करण उपयोग किया जाता है।
- सॉफ़्ट-डिलीट किए गए संस्करण `410` लौटाते हैं।
- GitHub-समर्थित skill हैंडऑफ़ बाइट्स को प्रॉक्सी या मिरर नहीं करते। JSON प्रतिक्रिया
  में `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; स्कैन/वर्तमान स्थिति एक गेट है और सफलता
  पेलोड मेटाडेटा के रूप में शामिल नहीं होती।
- डाउनलोड आंकड़े प्रति UTC दिन अद्वितीय पहचान के रूप में गिने जाते हैं (`userId` जब API टोकन मान्य हो, अन्यथा IP)।

## प्रमाणीकरण एंडपॉइंट (Bearer टोकन)

सभी एंडपॉइंट को यह आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन मान्य करता है और उपयोगकर्ता हैंडल लौटाता है।

### `POST /api/v1/skills`

नया संस्करण प्रकाशित करता है।

- पसंदीदा: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`।
- `files` (storageId-आधारित) वाली JSON बॉडी भी स्वीकार की जाती है।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, API उस
  प्रकाशक को सर्वर-साइड रिज़ॉल्व करता है और अभिनेता के पास प्रकाशक एक्सेस होना आवश्यक है।
- वैकल्पिक पेलोड फ़ील्ड: `migrateOwner`। `ownerHandle` के साथ `true` होने पर,
  मौजूदा skill उस स्वामी पर जा सकती है यदि अभिनेता वर्तमान और लक्षित दोनों
  प्रकाशकों पर एडमिन/स्वामी है। इस opt-in के बिना, स्वामी परिवर्तन
  अस्वीकार कर दिए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है।

- Bearer टोकन प्रमाणीकरण आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत फ़ॉर्म फ़ील्ड `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  tarball संदर्भ हैं। `clawpack` एक `.tgz` blob या upload-url फ्लो द्वारा लौटाई गई
  storage id हो सकती है। staged storage-id प्रकाशितियों में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- `files` या `clawpack` में से किसी एक का उपयोग करें, एक ही अनुरोध में दोनों कभी नहीं।
- JSON बॉडी और कॉलर द्वारा दिए गए `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार किए जाते हैं।
- सीधे multipart publish अनुरोध 18MB तक सीमित हैं। ClawPack tarball
  upload-url फ्लो का उपयोग 120MB tarball सीमा तक कर सकते हैं।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, केवल एडमिन उस स्वामी की ओर से प्रकाशित कर सकते हैं।

मान्यकरण मुख्य बिंदु:

- `family` `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin पैकेजों के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` अपलोड में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins के लिए `package.json`, स्रोत repo मेटाडेटा, स्रोत commit
  मेटाडेटा, config schema मेटाडेटा, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` org प्रकाशक और वर्तमान `openclaw` org सदस्यों के
  व्यक्तिगत प्रकाशक `official` channel पर प्रकाशित कर सकते हैं।
- on-behalf प्रकाशितियां अब भी लक्षित स्वामी खाते के विरुद्ध official-channel पात्रता मान्य करती हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill को सॉफ़्ट-डिलीट / पुनर्स्थापित करें (स्वामी, मॉडरेटर, या एडमिन)।

वैकल्पिक JSON बॉडी:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill मॉडरेशन नोट के रूप में संग्रहीत होता है और ऑडिट लॉग में कॉपी किया जाता है।
स्वामी द्वारा शुरू किए गए सॉफ़्ट डिलीट slug को 30 दिनों के लिए आरक्षित रखते हैं, फिर slug को
दूसरा प्रकाशक दावा कर सकता है। जब यह समाप्ति लागू होती है तो delete प्रतिक्रिया में `slugReservedUntil` शामिल होता है।
मॉडरेटर/एडमिन hide और सुरक्षा removals इस तरह समाप्त नहीं होते।

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

केवल एडमिन। किसी हैंडल के लिए org प्रकाशक मौजूद होना सुनिश्चित करता है। यदि हैंडल अब भी
लेगेसी shared user/personal publisher की ओर इशारा करता है, तो एंडपॉइंट पहले उसे org प्रकाशक में माइग्रेट करता है।
नए बनाए गए org के लिए, `memberHandle` दें; कार्यरत एडमिन को सदस्य के रूप में नहीं जोड़ा जाता।
`memberRole` डिफ़ॉल्ट रूप से `owner` होता है।

- बॉडी: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- प्रतिक्रिया: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

प्रमाणीकृत self-serve org प्रकाशक निर्माण। नया org प्रकाशक बनाता है और
कॉलर को स्वामी के रूप में जोड़ता है। यह एंडपॉइंट मौजूदा user/personal हैंडल माइग्रेट नहीं करता और
प्रकाशक को trusted/official के रूप में चिह्नित नहीं करता।

- बॉडी: `{ "handle": "opik", "displayName": "Opik" }`
- प्रतिक्रिया: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब हैंडल पहले से किसी प्रकाशक, उपयोगकर्ता, या व्यक्तिगत प्रकाशक द्वारा उपयोग किया गया हो, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल एडमिन। रिलीज़ प्रकाशित किए बिना किसी वैध स्वामी के लिए रूट slugs और पैकेज नाम आरक्षित करता है।
पैकेज नाम बिना रिलीज़ rows वाले निजी placeholder पैकेज बन जाते हैं, ताकि वही
स्वामी बाद में असली code-plugin या bundle-plugin रिलीज़ उस नाम में प्रकाशित कर सके।

- बॉडी: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- प्रतिक्रिया: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल एडमिन। Convex Auth account rows को संपादित किए बिना सत्यापित replacement GitHub OAuth principal
के लिए व्यक्तिगत प्रकाशक recover करता है। अनुरोध में दोनों immutable GitHub
provider account ids का नाम होना चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग होते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से ड्राई-रन होता है। रिकवरी लागू करने के लिए स्टाफ़ द्वारा दोनों
GitHub प्रिंसिपल्स के बीच निरंतरता स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। यदि गंतव्य उपयोगकर्ता के वर्तमान व्यक्तिगत
प्रकाशक के पास skills, packages, या GitHub skill sources हैं, तो रिकवरी बंद अवस्था में विफल होती है।
रिकवरी पुनर्प्राप्त प्रकाशक के skills, skill slug aliases, packages, package inspector warnings, और derived search digest rows के लिए legacy `ownerUserId` फ़ील्ड भी माइग्रेट करती है, ताकि
direct-owner paths नई publisher authority से मेल खाएँ। पुनर्प्राप्त handle के लिए सक्रिय protected-handle
reservation को भी replacement user को फिर से सौंप दिया जाता है, ताकि बाद का
profile synchronization पूर्व उपयोगकर्ता की प्रतिस्पर्धी authority को फिर से बहाल न कर सके। प्रत्येक primary table प्रति apply transaction
100 rows तक सीमित है; बड़ी recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped होते हैं और rewrite किए जाने के बजाय checked के रूप में रिपोर्ट किए जाते हैं।

- बॉडी: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- प्रतिक्रिया: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### स्वामी slug प्रबंधन एंडपॉइंट

- `POST /api/v1/skills/{slug}/rename`
  - बॉडी: `{ "newSlug": "new-canonical-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - बॉडी: `{ "targetSlug": "canonical-target-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

नोट्स:

- दोनों एंडपॉइंट API token auth की मांग करते हैं और केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` source listing को छिपाता है और source slug को target listing पर redirect करता है।

### स्वामित्व स्थानांतरण एंडपॉइंट

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

किसी उपयोगकर्ता को ban करें और owned skills को hard-delete करें (केवल moderator/admin)।

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

किसी उपयोगकर्ता को unban करें और पात्र skills को restore करें (केवल admin)।

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

किसी मौजूदा ban का stored reason बदलें, बिना unban किए या
content restore किए (केवल admin)। जब तक `dryRun` `false` न हो, डिफ़ॉल्ट रूप से dry-run होता है।

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

किसी उपयोगकर्ता की role बदलें (केवल admin)।

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

उपयोगकर्ताओं की सूची दिखाएँ या खोजें (केवल admin)।

क्वेरी पैरामीटर:

- `q` (वैकल्पिक): खोज query
- `query` (वैकल्पिक): `q` के लिए alias
- `limit` (वैकल्पिक): अधिकतम results (डिफ़ॉल्ट 20, अधिकतम 200)

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

star जोड़ें/हटाएँ (highlights)। दोनों एंडपॉइंट idempotent हैं।

प्रतिक्रियाएँ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI एंडपॉइंट (deprecated)

पुराने CLI versions के लिए अभी भी supported हैं:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Removal plan के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। ऐसे package
publishes जो ClawPack tarball stage करते हैं, उन्हें resulting storage id को
`clawpack` के रूप में और returned ticket को `clawpackUploadTicket` के रूप में भेजना होगा।

## Registry discovery (`/.well-known/clawhub.json`)

CLI site से registry/auth settings discover कर सकता है:

- `/.well-known/clawhub.json` (JSON, preferred)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो यह file serve करें (या `CLAWHUB_REGISTRY` explicitly set करें; legacy `CLAWDHUB_REGISTRY`)।
