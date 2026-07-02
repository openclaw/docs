---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI endpoints + auth).
x-i18n:
    generated_at: "2026-07-02T17:36:36Z"
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
लेगेसी `/api/...` और `/api/cli/...` संगतता के लिए बने रहते हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`.

## सार्वजनिक कैटलॉग का पुन: उपयोग

तृतीय-पक्ष डायरेक्टरी ClawHub Skills को सूचीबद्ध या खोजने के लिए सार्वजनिक रीड एंडपॉइंट का उपयोग कर सकती हैं। कृपया परिणाम कैश करें, `429`/`Retry-After` का पालन करें, उपयोगकर्ताओं को कैननिकल ClawHub सूची (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और यह संकेत देने से बचें कि ClawHub तृतीय-पक्ष साइट का समर्थन करता है। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन-द्वारा-अवरुद्ध सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट को रूट
प्राथमिकता को फिर से बनाने के बजाय रीड एंडपॉइंट द्वारा लौटाए गए
कैननिकल URL का उपयोग करना चाहिए।

## दर सीमाएं

प्रवर्तन मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणीकृत अनुरोध (मान्य Bearer टोकन): प्रति उपयोगकर्ता बकेट लागू।
- यदि टोकन गुम/अमान्य है, तो व्यवहार IP प्रवर्तन पर वापस चला जाता है।
- प्रमाणीकृत राइट एंडपॉइंट को तब खाली `Unauthorized` नहीं लौटाना चाहिए जब
  सर्वर कारण जानता हो। गुम टोकन, अमान्य/निरस्त टोकन, और
  हटाए गए/प्रतिबंधित/निष्क्रिय खातों में प्रत्येक को कार्रवाई-योग्य टेक्स्ट मिलना चाहिए ताकि CLI
  क्लाइंट उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- रीड: प्रति IP 3000/मिनट, प्रति कुंजी 12000/मिनट
- राइट: प्रति IP 300/मिनट, प्रति कुंजी 3000/मिनट
- डाउनलोड: प्रति IP 1200/मिनट, प्रति कुंजी 6000/मिनट (डाउनलोड एंडपॉइंट)

हेडर:

- लेगेसी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

हेडर अर्थ:

- `X-RateLimit-Reset`: निरपेक्ष Unix epoch सेकंड
- `RateLimit-Reset`: रीसेट तक सेकंड (विलंब)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर सटीक बचा हुआ बजट।
  शार्डेड सफल अनुरोध अनुमानित वैश्विक मान लौटाने के बजाय इस हेडर को छोड़ देते हैं।
- `Retry-After`: `429` पर फिर से प्रयास करने से पहले प्रतीक्षा करने के सेकंड (विलंब)

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

- यदि `Retry-After` मौजूद है, तो फिर से प्रयास करने से पहले उतने सेकंड प्रतीक्षा करें।
- समकालिक रीट्राई से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` गुम है, तो `RateLimit-Reset` पर वापस जाएं (या `X-RateLimit-Reset` से गणना करें)।

IP स्रोत:

- भरोसेमंद क्लाइंट IP हेडर, जिनमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब
  डिप्लॉयमेंट स्पष्ट रूप से भरोसेमंद फॉरवर्डेड हेडर सक्षम करता है।
- ClawHub एज पर क्लाइंट IP की पहचान करने के लिए भरोसेमंद फॉरवर्डिंग हेडर का उपयोग करता है।
- यदि कोई भरोसेमंद क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध fallback buckets का उपयोग करते हैं
  जो केवल दर-सीमा प्रकार द्वारा स्कोप किए जाते हैं। इन fallback buckets में
  कॉलर-आपूर्ति किए गए पाथ, स्लग, पैकेज नाम, संस्करण, क्वेरी स्ट्रिंग, या अन्य
  artifact पैरामीटर शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएं

सार्वजनिक v1 त्रुटि प्रतिक्रियाएं `content-type: text/plain; charset=utf-8` के साथ सादा टेक्स्ट होती हैं।
इसमें वैलिडेशन विफलताएं (`400`), गुम सार्वजनिक संसाधन (`404`), auth और
अनुमति विफलताएं (`401`/`403`), दर सीमाएं (`429`), और अवरुद्ध डाउनलोड शामिल हैं। क्लाइंट को
प्रतिक्रिया body को मानव-पठनीय स्ट्रिंग के रूप में पढ़ना चाहिए। अज्ञात क्वेरी पैरामीटर
संगतता के लिए अनदेखे किए जाते हैं, लेकिन अमान्य मानों वाले पहचाने गए क्वेरी पैरामीटर
`400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट (auth नहीं)

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

- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं (embedding similarity + सटीक slug/name token boosts + छोटा popularity prior)।
- प्रासंगिकता लोकप्रियता से अधिक मजबूत है। कोई सटीक slug या display-name token match बहुत अधिक engagement वाले ढीले match से ऊपर रैंक कर सकता है।
- ASCII टेक्स्ट को शब्द और विराम-चिह्न सीमाओं पर tokenized किया जाता है। उदाहरण के लिए, `personal-map` में स्वतंत्र `map` token है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` हैं; इसलिए `map` की खोज `personal-map` को `amap-jsapi-skill` की तुलना में मजबूत lexical match देती है।
- लोकप्रियता log-scaled और capped होती है। High-engagement Skills कम रैंक कर सकते हैं जब क्वेरी टेक्स्ट कमजोर match हो।
- संदिग्ध या छिपी हुई मॉडरेशन स्थिति caller filters और वर्तमान मॉडरेशन स्थिति के आधार पर किसी Skill को सार्वजनिक खोज से हटा सकती है।

प्रकाशक discoverability मार्गदर्शन:

- वे शब्द display name, summary, और tags में रखें जिन्हें उपयोगकर्ता सचमुच खोजेंगे। standalone slug token केवल तब उपयोग करें जब वह एक स्थिर पहचान भी हो जिसे आप बनाए रखना चाहते हैं।
- केवल किसी एक क्वेरी के पीछे जाने के लिए slug का नाम न बदलें, जब तक नया slug बेहतर दीर्घकालिक कैननिकल नाम न हो। पुराने slugs redirect aliases बन जाते हैं, लेकिन canonical URL, प्रदर्शित slug, और भविष्य के search digests नया slug उपयोग करते हैं।
- Rename aliases पुराने URL और registry के माध्यम से resolve होने वाले installs के लिए resolution बनाए रखते हैं, लेकिन search ranking rename indexed होने के बाद canonical Skill metadata पर आधारित होती है। मौजूदा stats Skill के साथ रहते हैं।
- यदि कोई Skill अप्रत्याशित रूप से अदृश्य है, तो ranking-related metadata बदलने से पहले logged in रहते हुए `clawhub inspect @owner/slug` से पहले मॉडरेशन स्थिति जांचें।

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
- `trending` पिछले 7 दिनों में installs के आधार पर रैंक करता है (telemetry-based)।
- `createdAt` new-skill crawls के लिए स्थिर है; `updated` तब बदलता है जब मौजूदा Skills पुनः प्रकाशित किए जाते हैं।
- जब `nonSuspiciousOnly=true` हो, cursor-based sorts किसी पेज पर `limit` से कम items लौटा सकते हैं क्योंकि suspicious Skills page retrieval के बाद फ़िल्टर किए जाते हैं।
- मौजूद होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। छोटा पेज अपने आप end-of-results का अर्थ नहीं रखता।

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

- owner rename/merge flows द्वारा बनाए गए पुराने slugs कैननिकल Skill पर resolve होते हैं।
- `metadata.os`: Skill frontmatter में घोषित OS प्रतिबंध (जैसे `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix system targets (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि Skill में कोई platform metadata नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब Skill flagged हो या owner उसे देख रहा हो।

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

- Owners और moderators छिपे हुए Skills के लिए moderation details एक्सेस कर सकते हैं।
- सार्वजनिक callers को केवल पहले से flagged visible Skills के लिए `200` मिलता है।
- Evidence सार्वजनिक callers के लिए redacted होता है और केवल owners/moderators के लिए raw snippets शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

moderator review के लिए Skill की रिपोर्ट करें। Reports skill-level होती हैं, वैकल्पिक रूप से
किसी version से लिंक की जाती हैं, और skill report queue को feed करती हैं।

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

Skill report intake के लिए moderator/admin endpoint।

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

Skill reports को resolve या reopen करने के लिए moderator/admin endpoint।

अनुरोध:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` `confirmed` और `dismissed` के लिए आवश्यक है; `status` को वापस
`open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी auditable workflow में Skill छिपाने के लिए triaged
report के साथ `finalAction: "hide"` पास करें।

### `GET /api/v1/skills/{slug}/versions`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक
- `cursor` (वैकल्पिक): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

version metadata + files list लौटाता है।

- उपलब्ध होने पर `version.security` में normalized scan verification status और scanner details
  (VirusTotal + LLM) शामिल होते हैं।

### `GET /api/v1/skills/{slug}/scan`

Skill version के लिए security scan verification details लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): specific version string.
- `tag` (वैकल्पिक): tagged version resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- यदि `version` या `tag` में से कोई भी नहीं दिया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति के साथ scanner-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी scanner ने निश्चित निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से व्युत्पन्न मौजूदा skill-स्तरीय moderation snapshot है।
- किसी ऐतिहासिक संस्करण को query करते समय, `moderation` और `security` को समान संस्करण context मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नए ClawScan jobs के लिए authenticated submit endpoint।

स्थानीय upload scans अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले requests `410` लौटाते हैं।

Published scans JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- Scan request payloads और downloadable reports retention window के बाद scan-request store से expire हो जाते हैं।
- Published scans के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- Published scans केवल तब write back करते हैं जब `update: true` हो और scan सफलतापूर्वक पूरा हो जाए।
- Response `202` है, जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- Scan jobs asynchronous होते हैं। Manual scan requests को सामान्य publish/backfill work से पहले प्राथमिकता दी जाती है, लेकिन completion फिर भी worker availability पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

Submitted scan के लिए authenticated poll endpoint।

- queued/running/succeeded/failed status लौटाता है।
- Queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है ताकि clients दिखा सकें कि request से पहले कितने prioritized manual scans हैं। बहुत बड़ी queues bounded होती हैं और `queuedAheadIsEstimate: true` के साथ report की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` sections होते हैं।
- Failed scan jobs `lastError` के साथ `status: "failed"` लौटाते हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

Authenticated report archive endpoint।

- Succeeded scan आवश्यक है; non-terminal scans `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Submitted versions के लिए authenticated stored report archive endpoint।

- Skill या plugin के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- Exact submitted version के लिए stored scan results लौटाता है, जिसमें blocked या hidden versions शामिल हैं।
- `kind` का default `skill` है; plugin/package scans के लिए `kind=plugin` का उपयोग करें।
- Scan-request downloads जैसा ही ZIP shape लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

Admin-only canonical batch rescan route। यह legacy `POST /api/v1/skills/-/rescan-batch` जैसा ही payload shape स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

Admin-only canonical batch status route। यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate counters लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया गया Skill Card verification envelope लौटाता है।

Query params:

- `version` (optional): विशिष्ट version string।
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब selected version में generated Skill Card हो, वह moderation द्वारा malware-blocked न हो, और ClawScan verification clean हो।
- Skill identity, publisher identity, और selected version metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि shell automation nested wrappers unpack किए बिना उन्हें पढ़ सके।
- `security` top-level ClawScan/security verdict है। Automation को `ok`, `decision`, `reasons`, और `security.status` पर key करना चाहिए।
- `security.signals` में `staticScan`, `virusTotal`, और `skillSpector` जैसे supporting scanner evidence होते हैं।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve और store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

Exact skill versions के लिए मौजूदा compact security verdicts लौटाता है। यह collection endpoint उन clients के लिए है जिन्हें पहले से पता है कि उन्हें कौन से installed ClawHub skill versions display करने हैं, जैसे OpenClaw Control UI।

Request:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

नोट्स:

- `items` में 1-100 unique `{ slug, version }` pairs होने चाहिए।
- Results प्रति item होते हैं; एक missing skill या version पूरी response को fail नहीं करता।
- Response केवल security-only है। इसमें Skill Card data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं हैं।
- `security.signals` में केवल status-level supporting evidence होता है; full scanner details के लिए `/scan` या ClawHub security-audit page का उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; clients को card content की आवश्यकता होने पर installed `skill-card.md` को locally पढ़ना चाहिए।
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

कच्ची पाठ सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- नवीनतम संस्करण पर डिफ़ॉल्ट करता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग एंडपॉइंट:

- skills
- कोड plugins
- बंडल plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, लेगेसी उपनाम `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित है जब
  अनुरोध plugin पैकेजों तक सीमित हो (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले पैकेज एंडपॉइंट)। नियंत्रित श्रेणियां और
  लेगेसी v1 फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` निश्चित-family उपनाम बने रहते हैं।
- Skill प्रविष्टियां skill रजिस्ट्री द्वारा समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अब भी केवल code-plugin और bundle-plugin रिलीज़ के लिए है।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणीकृत कॉलर सूची/खोज परिणामों में उन प्रकाशकों के निजी पैकेज देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे पैकेज लौटाता है जिन्हें प्रमाणीकृत कॉलर पढ़ सकता है।

### `GET /api/v1/packages/search`

skills + plugin पैकेजों में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित है जब
  अनुरोध plugin पैकेजों तक सीमित हो। नियंत्रित श्रेणियां और लेगेसी v1
  फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणीकृत कॉलर उन प्रकाशकों के निजी पैकेज खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे पैकेज लौटाता है जिन्हें प्रमाणीकृत कॉलर पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin पैकेजों में केवल-Plugin कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, लेगेसी उपनाम `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। मौजूदा मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

लेगेसी v1 फ़िल्टर उपनाम रीड एंडपॉइंट पर स्वीकार किए जाते रहते हैं:

- `mcp-tooling`, `data`, और `automation` `tools` में रिज़ॉल्व होते हैं।
- `observability` और `deployment` `gateway` में रिज़ॉल्व होते हैं।
- `dev-tools` `runtime` में रिज़ॉल्व होता है।

`trending` सात-दिन का इंस्टॉल/डाउनलोड लीडरबोर्ड है और सर्वकालिक कुल का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` एंडपॉइंट पर यह केवल-plugin है; skill कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

लेगेसी उपनाम संग्रहीत या लेखक-घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक skills का बल्क एक्सपोर्ट।

प्रमाणीकरण:

- API टोकन आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रतिसाद से पेजिनेशन कर्सर।

प्रतिसाद:

- बॉडी: ZIP आर्काइव।
- हर एक्सपोर्ट किया गया skill `{publisher}/{slug}/` पर रूटेड होता है।
- होस्ट किए गए skills में नवीनतम संग्रहीत संस्करण फ़ाइलें शामिल होती हैं और उन्हें
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध किया जाता है।
- `clean` या `suspicious` स्कैन वाले मौजूदा GitHub-समर्थित skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। उनमें ClawHub-होस्टेड स्रोत फ़ाइलें शामिल नहीं होतीं।
- हर skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग skills या फ़ाइलें
  एक्सपोर्ट नहीं की जा सकीं।

हेडर:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Plugin रिलीज़ का बल्क एक्सपोर्ट।

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
- हर एक्सपोर्ट किया गया Plugin `{family}/{packageName}/` पर रूटेड होता है।
- हर एक्सपोर्ट किए गए Plugin में नवीनतम रिलीज़ की संग्रहित फ़ाइलें शामिल होती हैं।
- प्रति-Plugin एक्सपोर्ट मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहित होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Plugin या फ़ाइलें एक्सपोर्ट नहीं की जा
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
- श्रेणी फ़िल्टरिंग एक वास्तविक API फ़िल्टर है जो Plugin श्रेणी डाइजेस्ट
  रो से समर्थित है, न कि खोज-क्वेरी रीराइट।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पेजिनेट नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को पुनः क्रमित करते हैं,
  जो मौजूदा `/skills` ब्राउज़ व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट्स:

- Skills भी एकीकृत कैटलॉग में इस रूट के माध्यम से रिज़ॉल्व हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को सॉफ्ट-डिलीट करता है।

नोट्स:

- पैकेज मालिक, किसी org प्रकाशक मालिक/admin, प्लेटफ़ॉर्म मॉडरेटर, या प्लेटफ़ॉर्म admin के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

नोट्स:

- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

एक पैकेज संस्करण लौटाता है, जिसमें फ़ाइल मेटाडेटा, संगतता,
सत्यापन, आर्टिफ़ैक्ट मेटाडेटा, और स्कैन डेटा शामिल हैं।

नोट्स:

- `version.artifact.kind` पुराने-ढांचे वाले पैकेज आर्काइव के लिए `legacy-zip` या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack` है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स को हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैनॉनिकल रिलीज़ आर्टिफ़ैक्ट की पहचान करता है।
- `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan` तब
  शामिल होते हैं जब स्कैन डेटा मौजूद हो।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और भरोसा सारांश लौटाता है।
यह यह तय करने के लिए सार्वजनिक OpenClaw उपभोग सतह है कि कोई
रिज़ॉल्व की गई रिलीज़ इंस्टॉल की जा सकती है या नहीं।

प्रमाणीकरण:

- सार्वजनिक पढ़ने वाला एंडपॉइंट। कोई मालिक, प्रकाशक, मॉडरेटर, या admin टोकन
  आवश्यक नहीं है।

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
- `release.releaseId`, `release.version`, और `release.createdAt` उस
  सटीक रिलीज़ की पहचान करते हैं जिसका मूल्यांकन किया गया।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफ़ैक्ट के लिए ज्ञात होने पर मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैनुअल रिलीज़ मॉडरेशन से व्युत्पन्न प्रभावी भरोसा स्थिति है।
- `trust.moderationState` nullable है। जब कोई मैनुअल रिलीज़
  मॉडरेशन मौजूद नहीं होता, यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल ब्लॉक संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को scanner या moderation फ़ील्ड से ब्लॉकिंग नियम फिर से निकालने के बजाय
  इस मान के `true` होने पर इंस्टॉलेशन ब्लॉक करना चाहिए।
- `trust.reasons` उपयोगकर्ता-दृश्य और ऑडिट स्पष्टीकरण सूची है। कारण कोड
  स्थिर, कॉम्पैक्ट स्ट्रिंग होते हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक भरोसा इनपुट अभी भी पूर्णता की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि भरोसा सारांश पुराने इनपुट से गणना किया गया था और
  उच्च-विश्वास अनुमति निर्णय से पहले इसे रिफ़्रेश की आवश्यकता वाला माना जाना चाहिए।

नोट्स:

- यह एंडपॉइंट संस्करण-सटीक है। क्लाइंट को इसे उस पैकेज संस्करण को रिज़ॉल्व करने के बाद कॉल करना चाहिए
  जिसे वे इंस्टॉल करना चाहते हैं, केवल नवीनतम
  पैकेज मेटाडेटा पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।
- यह एंडपॉइंट मालिक/moderator moderation एंडपॉइंट की तुलना में जानबूझकर संकरा है।
  यह इंस्टॉल निर्णय और सार्वजनिक स्पष्टीकरण उजागर करता है, न कि
  रिपोर्टर पहचान, रिपोर्ट बॉडी, निजी साक्ष्य, या आंतरिक समीक्षा
  समयरेखाएँ।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफ़ैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

नोट्स:

- लेगेसी पैकेज संस्करण एक `legacy-zip` आर्टिफ़ैक्ट और एक लेगेसी ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण एक `npm-pack` आर्टिफ़ैक्ट, npm integrity फ़ील्ड, एक
  `tarballUrl`, और लेगेसी ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से
  आर्काइव प्रारूप का अनुमान लगाने से बचती है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से संस्करण आर्टिफ़ैक्ट डाउनलोड करता है।

नोट्स:

- ClawPack संस्करण सटीक अपलोड किए गए npm-pack `.tgz` बाइट्स स्ट्रीम करते हैं।
- लेगेसी ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट करते हैं।
- डाउनलोड दर बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw उपभोग के लिए गणना की गई readiness लौटाता है।

Readiness जांचों में शामिल हैं:

- आधिकारिक चैनल स्थिति
- नवीनतम संस्करण उपलब्धता
- ClawPack npm-pack आर्टिफ़ैक्ट उपलब्धता
- आर्टिफ़ैक्ट डाइजेस्ट
- स्रोत repo और commit provenance
- OpenClaw संगतता मेटाडेटा
- host targets
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

आधिकारिक OpenClaw Plugin migration रो सूचीबद्ध करने के लिए moderator एंडपॉइंट।

प्रमाणीकरण:

- moderator या admin उपयोगकर्ता के लिए API टोकन आवश्यक है।

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

आधिकारिक Plugin migration रो बनाने या अपडेट करने के लिए admin एंडपॉइंट।

प्रमाणीकरण:

- admin उपयोगकर्ता के लिए API टोकन आवश्यक है।

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

- `bundledPluginId` को lowercase में normalize किया जाता है और यह स्थिर upsert कुंजी है।
- `packageName` npm-name normalized है; planned migrations के लिए पैकेज अनुपस्थित हो सकता है।
- यह केवल migration readiness ट्रैक करता है। यह OpenClaw को mutate नहीं करता या
  ClawPacks जनरेट नहीं करता।

### `GET /api/v1/packages/moderation/queue`

पैकेज रिलीज़ समीक्षा कतारों के लिए moderator/admin एंडपॉइंट।

प्रमाणीकरण:

- moderator या admin उपयोगकर्ता के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

स्थिति अर्थ:

- `open`: suspicious, malicious, pending, quarantined, revoked, या reported releases.
- `blocked`: quarantined, revoked, या malicious releases.
- `manual`: manual moderation override वाली कोई भी release.
- `all`: manual override, non-clean scan state, या package report वाली कोई भी release.

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

moderator समीक्षा के लिए पैकेज रिपोर्ट करें। रिपोर्ट पैकेज-स्तर की होती हैं, वैकल्पिक रूप से
किसी संस्करण से लिंक होती हैं। वे moderation queue को फ़ीड करती हैं लेकिन स्वयं
डाउनलोड को auto-hide या block नहीं करतीं; moderators को artifacts को
approve, quarantine, या revoke करने के लिए release moderation का उपयोग करना चाहिए।

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

पैकेज रिपोर्ट इंटेक के लिए मॉडरेटर/व्यवस्थापक एंडपॉइंट.

प्रमाणीकरण:

- मॉडरेटर या व्यवस्थापक उपयोगकर्ता के लिए API टोकन आवश्यक है.

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

प्रत्युत्तर:

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

पैकेज मॉडरेशन दृश्यता के लिए मालिक/मॉडरेटर एंडपॉइंट.

प्रमाणीकरण:

- पैकेज मालिक, प्रकाशक सदस्य, मॉडरेटर, या व्यवस्थापक उपयोगकर्ता के लिए API
  टोकन आवश्यक है.

प्रत्युत्तर:

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

पैकेज रिपोर्टों को हल करने या फिर से खोलने के लिए मॉडरेटर/व्यवस्थापक एंडपॉइंट.

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open`
सेट करते समय इसे छोड़ा जा सकता है. उसी ऑडिट योग्य वर्कफ़्लो में रिलीज़
मॉडरेशन लागू करने के लिए पुष्ट रिपोर्ट के साथ `finalAction: "quarantine"` या
`finalAction: "revoke"` पास करें.

प्रत्युत्तर:

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

पैकेज रिलीज़ समीक्षा के लिए मॉडरेटर/व्यवस्थापक एंडपॉइंट.

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित अवस्थाएं:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई.
- `quarantined`: आगे की कार्रवाई लंबित होने तक अवरुद्ध.
- `revoked`: किसी रिलीज़ पर पहले भरोसा किए जाने के बाद अवरुद्ध.

क्वारंटीन और निरस्त रिलीज़ आर्टिफ़ैक्ट डाउनलोड रूटों से `403` लौटाती हैं.
हर बदलाव एक ऑडिट लॉग प्रविष्टि लिखता है.

### `GET /api/v1/packages/{name}/file`

पैकेज फ़ाइल के लिए कच्ची टेक्स्ट सामग्री लौटाता है.

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट:

- नवीनतम रिलीज़ पर डिफ़ॉल्ट होता है.
- डाउनलोड बकेट नहीं, रीड रेट बकेट का उपयोग करता है.
- बाइनरी फ़ाइलें `415` लौटाती हैं.
- फ़ाइल आकार सीमा: 200KB.
- लंबित VirusTotal स्कैन रीड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ फिर भी कहीं और रोकी जा सकती हैं.
- निजी पैकेज `404` लौटाते हैं जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता.

### `GET /api/v1/packages/{name}/download`

पैकेज रिलीज़ के लिए विरासती निर्धारक ZIP आर्काइव डाउनलोड करता है.

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट:

- नवीनतम रिलीज़ पर डिफ़ॉल्ट होता है.
- Skills `GET /api/v1/download` पर रीडायरेक्ट होती हैं.
- Plugin/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें होती हैं ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें.
- यह रूट केवल ZIP रहता है. यह ClawPack `.tgz` फ़ाइलें स्ट्रीम नहीं करता.
- प्रत्युत्तर resolver integrity जांचों के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` हेडर शामिल करते हैं.
- केवल-रजिस्ट्री मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता.
- लंबित VirusTotal स्कैन डाउनलोड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं.
- निजी पैकेज `404` लौटाते हैं जब तक कॉलर मालिक न हो.

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत पैक्यूमेंट लौटाता है.

नोट:

- केवल अपलोड किए गए ClawPack npm-pack tarball वाले संस्करण सूचीबद्ध किए जाते हैं.
- विरासती केवल-ZIP संस्करण जानबूझकर छोड़े जाते हैं.
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत फ़ील्ड का उपयोग करते हैं
  ताकि उपयोगकर्ता चाहें तो npm को मिरर की ओर इंगित कर सकें.
- Scoped पैकेज पैक्यूमेंट `/api/npm/@scope/name` और npm के
  एन्कोडेड `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm मिरर क्लाइंट के लिए ठीक अपलोड किए गए ClawPack tarball बाइट्स स्ट्रीम करता है.

नोट:

- डाउनलोड रेट बकेट का उपयोग करता है.
- डाउनलोड हेडर में ClawHub SHA-256 और npm integrity/shasum मेटाडेटा शामिल होता है.
- मॉडरेशन और निजी पैकेज एक्सेस जांचें फिर भी लागू होती हैं.

### `GET /api/v1/resolve`

CLI द्वारा स्थानीय फिंगरप्रिंट को ज्ञात संस्करण से मैप करने के लिए उपयोग किया जाता है.

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): बंडल फिंगरप्रिंट का 64-वर्ण hex sha256

प्रत्युत्तर:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

होस्ट किया गया skill संस्करण ZIP डाउनलोड करता है, या वर्तमान GitHub-समर्थित skill के लिए
GitHub स्रोत हैंडऑफ़ लौटाता है जिसके पास `clean` या `suspicious` स्कैन है और कोई होस्टेड
संस्करण नहीं है.

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (जैसे `latest`)

नोट:

- यदि न `version` और न `tag` प्रदान किया गया है, तो नवीनतम संस्करण उपयोग किया जाता है.
- सॉफ़्ट-डिलीट किए गए संस्करण `410` लौटाते हैं.
- GitHub-समर्थित skill हैंडऑफ़ बाइट्स को प्रॉक्सी या मिरर नहीं करते. JSON प्रत्युत्तर
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल करता है; स्कैन/वर्तमान स्थिति एक गेट है और सफल
  पेलोड मेटाडेटा के रूप में शामिल नहीं की जाती.
- डाउनलोड आंकड़े प्रति UTC दिन अद्वितीय पहचान के रूप में गिने जाते हैं (API टोकन मान्य होने पर `userId`, अन्यथा IP).

## प्रमाणीकरण एंडपॉइंट (Bearer टोकन)

सभी एंडपॉइंट को आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन सत्यापित करता है और उपयोगकर्ता हैंडल लौटाता है.

### `POST /api/v1/skills`

नया संस्करण प्रकाशित करता है.

- पसंदीदा: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`.
- `files` (storageId-आधारित) वाला JSON body भी स्वीकार किया जाता है.
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`. मौजूद होने पर, API उस
  प्रकाशक को सर्वर-साइड resolve करता है और actor के पास publisher access होना आवश्यक करता है.
- वैकल्पिक पेलोड फ़ील्ड: `migrateOwner`. `ownerHandle` के साथ `true` होने पर,
  मौजूदा skill उस मालिक पर जा सकती है यदि actor वर्तमान और लक्ष्य, दोनों
  प्रकाशकों पर व्यवस्थापक/मालिक है. इस opt-in के बिना, मालिक बदलाव
  अस्वीकार किए जाते हैं.

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है.

- Bearer token auth आवश्यक है.
- `multipart/form-data` आवश्यक है.
- अनुमत form fields `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  tarball संदर्भ हैं. `clawpack` `.tgz` blob हो सकता है या upload-url flow द्वारा लौटाया गया
  storage id हो सकता है. Staged storage-id publishes में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए.
- या तो `files` या `clawpack` उपयोग करें, एक ही अनुरोध में दोनों कभी नहीं.
- JSON bodies और caller-supplied `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार किए जाते हैं.
- Direct multipart publish requests 18MB पर सीमित हैं. ClawPack tarballs
  120MB tarball cap तक upload-url flow उपयोग कर सकते हैं.
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`. मौजूद होने पर, केवल व्यवस्थापक उस मालिक की ओर से प्रकाशित कर सकते हैं.

सत्यापन मुख्य बिंदु:

- `family` `code-plugin` या `bundle-plugin` होना चाहिए.
- Plugin पैकेजों को `openclaw.plugin.json` आवश्यक है. ClawPack `.tgz` uploads में
  यह `package/openclaw.plugin.json` पर होना चाहिए.
- Code plugins को `package.json`, source repo metadata, source commit
  metadata, config schema metadata, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं.
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं.
- केवल `openclaw` org publisher और वर्तमान `openclaw` org members के
  personal publishers `official` channel पर प्रकाशित कर सकते हैं.
- On-behalf publishes अभी भी target owner account के विरुद्ध official-channel eligibility सत्यापित करते हैं.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill को सॉफ़्ट-डिलीट / पुनर्स्थापित करता है (मालिक, मॉडरेटर, या व्यवस्थापक).

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill moderation note के रूप में संग्रहीत होता है और audit log में कॉपी किया जाता है.
मालिक द्वारा शुरू किए गए सॉफ़्ट डिलीट slug को 30 दिनों के लिए आरक्षित रखते हैं, फिर slug को
कोई दूसरा प्रकाशक claim कर सकता है. जब यह expiry लागू होती है, delete response में `slugReservedUntil` शामिल होता है.
मॉडरेटर/व्यवस्थापक hide और security removals इस तरह expire नहीं होते.

Delete response:

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

केवल व्यवस्थापक. किसी handle के लिए org publisher मौजूद होना सुनिश्चित करता है. यदि handle अभी भी
legacy shared user/personal publisher की ओर इशारा करता है, तो endpoint पहले उसे org publisher में migrate करता है.
नए बनाए गए org के लिए, `memberHandle` प्रदान करें; acting admin को member के रूप में नहीं जोड़ा जाता.
`memberRole` डिफ़ॉल्ट रूप से `owner` होता है.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

प्रमाणित self-serve org publisher creation. नया org publisher बनाता है और
caller को owner के रूप में जोड़ता है. यह endpoint मौजूदा user/personal handles migrate नहीं करता और
publisher को trusted/official चिह्नित नहीं करता.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब handle पहले से किसी publisher, user, या personal publisher द्वारा उपयोग किया जा रहा हो तो `409` लौटाता है.

### `POST /api/v1/users/reserve`

केवल व्यवस्थापक. release प्रकाशित किए बिना rightful owner के लिए root slugs और package names आरक्षित करता है.
Package names बिना release rows वाले private placeholder packages बन जाते हैं, ताकि वही
owner बाद में वास्तविक code-plugin या bundle-plugin release उस name में प्रकाशित कर सके.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल व्यवस्थापक. Convex Auth account rows को संपादित किए बिना verified replacement GitHub OAuth principal
के लिए personal publisher recover करता है. अनुरोध में दोनों immutable GitHub
provider account ids का नाम होना चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग किए जाते हैं.

एंडपॉइंट डिफ़ॉल्ट रूप से ड्राई-रन होता है। रिकवरी लागू करने के लिए `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं, जब स्टाफ दोनों
GitHub principals के बीच निरंतरता को स्वतंत्र रूप से सत्यापित कर ले। रिकवरी fail closed होती है जब गंतव्य उपयोगकर्ता के मौजूदा व्यक्तिगत
प्रकाशक के पास skills, पैकेज, या GitHub skill स्रोत हों।
रिकवरी पुनर्प्राप्त प्रकाशक के skills,
skill slug aliases, पैकेज, package inspector warnings, और व्युत्पन्न search digest rows के लिए legacy `ownerUserId` फ़ील्ड भी माइग्रेट करती है ताकि
direct-owner पथ नए प्रकाशक authority से मेल खाएँ। पुनर्प्राप्त handle के लिए एक सक्रिय protected-handle
reservation भी replacement user को फिर से सौंपा जाता है ताकि बाद की
profile synchronization पूर्व उपयोगकर्ता की प्रतिस्पर्धी authority को restore न कर सके। प्रत्येक primary table प्रति apply transaction
100 rows तक सीमित है; बड़ी recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped होते हैं और rewrite करने के बजाय checked के रूप में report किए जाते हैं।

- बॉडी: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- प्रतिक्रिया: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug प्रबंधन एंडपॉइंट

- `POST /api/v1/skills/{slug}/rename`
  - बॉडी: `{ "newSlug": "new-canonical-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - बॉडी: `{ "targetSlug": "canonical-target-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

नोट्स:

- दोनों एंडपॉइंट को API token auth की आवश्यकता होती है और ये केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` source listing को छिपाता है और source slug को target listing पर redirect करता है।

### Ownership transfer एंडपॉइंट

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

किसी उपयोगकर्ता को ban करें और स्वामित्व वाले skills को hard-delete करें (केवल moderator/admin)।

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

किसी मौजूदा ban के लिए stored reason बदलें, बिना unban किए या
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

उपयोगकर्ताओं की सूची दिखाएँ या खोजें (केवल admin)।

Query params:

- `q` (वैकल्पिक): search query
- `query` (वैकल्पिक): `q` का alias
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

## पुराने CLI एंडपॉइंट (अप्रचलित)

पुराने CLI versions के लिए अब भी समर्थित:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

removal plan के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। ऐसे Package
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

यदि आप self-host करते हैं, तो यह file serve करें (या `CLAWHUB_REGISTRY` explicitly set करें; legacy `CLAWDHUB_REGISTRY`)।
