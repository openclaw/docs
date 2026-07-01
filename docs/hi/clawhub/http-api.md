---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डिबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण)।
x-i18n:
    generated_at: "2026-07-01T08:02:57Z"
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
लेगेसी `/api/...` और `/api/cli/...` संगतता के लिए बने हुए हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`.

## सार्वजनिक कैटलॉग पुन: उपयोग

तृतीय-पक्ष डायरेक्टरियाँ ClawHub Skills को सूचीबद्ध या खोजने के लिए सार्वजनिक रीड एंडपॉइंट्स का उपयोग कर सकती हैं। कृपया परिणाम कैश करें, `429`/`Retry-After` का पालन करें, उपयोगकर्ताओं को कैनॉनिकल ClawHub लिस्टिंग (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और तृतीय-पक्ष साइट के लिए ClawHub समर्थन का संकेत देने से बचें। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन-ब्लॉक की गई सामग्री को मिरर करने की कोशिश न करें।

वेब स्लग शॉर्टकट रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट्स को रूट प्राथमिकता को दोबारा बनाने के बजाय रीड एंडपॉइंट्स द्वारा लौटाए गए कैनॉनिकल URLs का उपयोग करना चाहिए।

## दर सीमाएँ

लागू करने का मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer token): प्रति उपयोगकर्ता बकेट लागू।
- यदि token अनुपस्थित/अमान्य है, तो व्यवहार IP प्रवर्तन पर वापस चला जाता है।
- प्रमाणित राइट एंडपॉइंट्स को तब केवल `Unauthorized` नहीं लौटाना चाहिए जब सर्वर कारण जानता हो। अनुपस्थित tokens, अमान्य/रद्द किए गए tokens, और हटाए गए/प्रतिबंधित/अक्षम खातों में से प्रत्येक को कार्रवाई योग्य टेक्स्ट मिलना चाहिए ताकि CLI क्लाइंट्स उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- रीड: प्रति IP 3000/मिनट, प्रति key 12000/मिनट
- राइट: प्रति IP 300/मिनट, प्रति key 3000/मिनट
- डाउनलोड: प्रति IP 1200/मिनट, प्रति key 6000/मिनट (डाउनलोड एंडपॉइंट्स)

हेडर्स:

- लेगेसी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

हेडर अर्थ:

- `X-RateLimit-Reset`: पूर्ण Unix epoch सेकंड
- `RateLimit-Reset`: रीसेट तक सेकंड (विलंब)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर सटीक बचा हुआ बजट।
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

- विश्वसनीय क्लाइंट IP हेडर्स, जिनमें `cf-connecting-ip` शामिल है, का उपयोग केवल तब किया जाता है जब deployment स्पष्ट रूप से विश्वसनीय forwarded headers सक्षम करता है।
- ClawHub edge पर क्लाइंट IPs की पहचान करने के लिए विश्वसनीय forwarding headers का उपयोग करता है।
- यदि कोई विश्वसनीय क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध fallback buckets का उपयोग करते हैं जो केवल rate-limit प्रकार के अनुसार scoped होते हैं। इन fallback buckets में caller-supplied paths, slugs, package names, versions, query strings, या अन्य artifact parameters शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएँ

सार्वजनिक v1 त्रुटि प्रतिक्रियाएँ `content-type: text/plain; charset=utf-8` के साथ सादा टेक्स्ट होती हैं।
इसमें validation failures (`400`), अनुपस्थित सार्वजनिक संसाधन (`404`), auth और permission failures (`401`/`403`), rate limits (`429`), और blocked downloads शामिल हैं। क्लाइंट्स को प्रतिक्रिया body को मानव-पठनीय string के रूप में पढ़ना चाहिए। अज्ञात query parameters को संगतता के लिए अनदेखा किया जाता है, लेकिन अमान्य values वाले पहचाने गए query parameters `400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट्स (auth नहीं)

### `GET /api/v1/search`

Query params:

- `q` (required): query string
- `limit` (optional): integer
- `highlightedOnly` (optional): highlighted Skills तक फ़िल्टर करने के लिए `true`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (optional): `nonSuspiciousOnly` के लिए legacy alias

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

- परिणाम relevance क्रम में लौटाए जाते हैं (embedding similarity + exact slug/name token boosts + छोटा popularity prior).
- relevance, popularity से अधिक मजबूत है। सटीक slug या display-name token match, बहुत अधिक engagement वाले ढीले match से ऊपर रैंक कर सकता है।
- ASCII टेक्स्ट को शब्द और विराम-चिह्न सीमाओं पर tokenize किया जाता है। उदाहरण के लिए, `personal-map` में standalone `map` token होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` होते हैं; इसलिए `map` खोजने पर `amap-jsapi-skill` की तुलना में `personal-map` को अधिक मजबूत lexical match मिलता है।
- popularity log-scaled और capped है। query text कमजोर match होने पर high-engagement Skills नीचे रैंक कर सकते हैं।
- suspicious या hidden moderation state, caller filters और मौजूदा moderation status के आधार पर किसी Skill को सार्वजनिक खोज से हटा सकता है।

Publisher discoverability guidance:

- वे शब्द display name, summary, और tags में रखें जिन्हें उपयोगकर्ता सचमुच खोजेंगे। standalone slug token का उपयोग केवल तब करें जब वह एक स्थिर पहचान भी हो जिसे आप रखना चाहते हैं।
- केवल एक query के पीछे भागने के लिए slug का नाम न बदलें, जब तक नया slug बेहतर दीर्घकालिक canonical name न हो। पुराने slugs redirect aliases बन जाते हैं, लेकिन canonical URL, displayed slug, और भविष्य के search digests नया slug उपयोग करते हैं।
- Rename aliases पुराने URLs और registry के माध्यम से resolve होने वाले installs के लिए resolution बनाए रखते हैं, लेकिन search ranking rename indexed होने के बाद canonical Skill metadata पर आधारित होती है। मौजूदा stats Skill के साथ रहते हैं।
- यदि कोई Skill अनपेक्षित रूप से अदृश्य है, तो ranking-संबंधित metadata बदलने से पहले logged in रहते हुए `clawhub inspect @owner/slug` से moderation state पहले जाँचें।

### `GET /api/v1/skills`

Query params:

- `limit` (optional): integer (1–200)
- `cursor` (optional): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (optional): `updated` (default), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर map होते हैं, `trending`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (optional): `nonSuspiciousOnly` के लिए legacy alias

अमान्य `sort` values `400` लौटाते हैं।

नोट्स:

- `recommended` engagement और recency signals का उपयोग करता है।
- `trending` पिछले 7 दिनों में installs के आधार पर रैंक करता है (telemetry-based)।
- `createdAt` new-skill crawls के लिए stable है; `updated` तब बदलता है जब मौजूदा Skills republish होते हैं।
- जब `nonSuspiciousOnly=true` होता है, cursor-based sorts किसी page पर `limit` से कम items लौटा सकते हैं क्योंकि suspicious Skills page retrieval के बाद filtered होते हैं।
- मौजूद होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। छोटा page अपने आप में end-of-results नहीं दर्शाता।

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

- owner rename/merge flows द्वारा बनाए गए पुराने slugs canonical Skill पर resolve होते हैं।
- `metadata.os`: Skill frontmatter में घोषित OS restrictions (जैसे `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix system targets (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि Skill में कोई platform metadata नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब Skill flagged हो या owner उसे देख रहा हो।

### `GET /api/v1/skills/{slug}/moderation`

संरचित moderation state लौटाता है।

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

- Owners और moderators hidden Skills के लिए moderation details access कर सकते हैं।
- सार्वजनिक callers को केवल already-flagged visible Skills के लिए `200` मिलता है।
- Evidence सार्वजनिक callers के लिए redacted होता है और केवल owners/moderators के लिए raw snippets शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

moderator review के लिए Skill की report करें। Reports skill-level होती हैं, वैकल्पिक रूप से version से linked होती हैं, और Skill report queue को feed करती हैं।

Auth:

- API token आवश्यक है।

Request:

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

Skill report intake के लिए moderator/admin endpoint.

Query params:

- `status` (optional): `open` (default), `confirmed`, `dismissed`, या `all`
- `limit` (optional): integer (1-200)
- `cursor` (optional): pagination cursor

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

Skill reports को resolve या reopen करने के लिए moderator/admin endpoint.

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open` पर set करते समय इसे छोड़ा जा सकता है। triaged report के साथ `finalAction: "hide"` pass करें ताकि उसी auditable workflow में Skill hidden हो जाए।

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (optional): integer
- `cursor` (optional): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

version metadata + files list लौटाता है।

- `version.security` में normalized scan verification status और scanner details (VirusTotal + LLM), उपलब्ध होने पर, शामिल होते हैं।

### `GET /api/v1/skills/{slug}/scan`

Skill version के लिए security scan verification details लौटाता है।

Query params:

- `version` (optional): विशिष्ट version string.
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- यदि `version` और `tag` में से कोई भी प्रदान नहीं किया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति और स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निश्चित निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से प्राप्त वर्तमान स्किल-स्तरीय मॉडरेशन स्नैपशॉट है।
- किसी ऐतिहासिक संस्करण की क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नई ClawScan जॉब्स के लिए प्रमाणित सबमिट एंडपॉइंट।

स्थानीय अपलोड स्कैन अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले अनुरोध `410` लौटाते हैं।

प्रकाशित स्कैन JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

टिप्पणियां:

- स्कैन अनुरोध पेलोड और डाउनलोड योग्य रिपोर्ट्स रिटेंशन विंडो के बाद स्कैन-अनुरोध स्टोर से समाप्त हो जाती हैं।
- प्रकाशित स्कैन के लिए स्वामी/प्रकाशक प्रबंधन एक्सेस, या प्लेटफॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- प्रकाशित स्कैन केवल तब वापस लिखते हैं जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो।
- प्रतिक्रिया `202` होती है, जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- स्कैन जॉब्स असिंक्रोनस होती हैं। मैनुअल स्कैन अनुरोधों को सामान्य publish/backfill कार्य से पहले प्राथमिकता दी जाती है, लेकिन पूरा होना फिर भी वर्कर उपलब्धता पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणित पोल एंडपॉइंट।

- queued/running/succeeded/failed स्थिति लौटाता है।
- queued होने पर `queue.queuedAhead` और `queue.position` लौटाता है, ताकि क्लाइंट दिखा सकें कि अनुरोध से आगे कितने प्राथमिकता प्राप्त मैनुअल स्कैन हैं। बहुत बड़ी क्यू सीमित की जाती हैं और `queuedAheadIsEstimate: true` के साथ रिपोर्ट की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` अनुभाग होते हैं।
- विफल स्कैन जॉब्स `lastError` के साथ `status: "failed"` लौटाती हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणित रिपोर्ट आर्काइव एंडपॉइंट।

- सफल स्कैन आवश्यक है; नॉन-टर्मिनल स्कैन `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए संस्करणों के लिए प्रमाणित संग्रहीत रिपोर्ट आर्काइव एंडपॉइंट।

- स्किल या plugin के लिए स्वामी/प्रकाशक प्रबंधन एक्सेस, या प्लेटफॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- ठीक सबमिट किए गए संस्करण के लिए संग्रहीत स्कैन परिणाम लौटाता है, जिसमें अवरुद्ध या छिपे हुए संस्करण भी शामिल हैं।
- `kind` का डिफॉल्ट `skill` है; plugin/package स्कैन के लिए `kind=plugin` का उपयोग करें।
- स्कैन-अनुरोध डाउनलोड जैसी ही ZIP संरचना लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

केवल एडमिन के लिए canonical बैच रीस्कैन रूट। यह legacy `POST /api/v1/skills/-/rescan-batch` जैसी ही पेलोड संरचना स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

केवल एडमिन के लिए canonical बैच स्थिति रूट। यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate काउंटर लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला Skill Card सत्यापन एनवेलप लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किया गया संस्करण resolve करें (उदाहरण के लिए `latest`)।

टिप्पणियां:

- `ok` केवल तब `true` होता है जब चुने गए संस्करण में generated Skill Card हो, वह मॉडरेशन द्वारा malware-blocked न हो, और ClawScan सत्यापन clean हो।
- स्किल पहचान, प्रकाशक पहचान, और चुने गए संस्करण का मेटाडेटा शीर्ष-स्तरीय एनवेलप फ़ील्ड (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं, ताकि shell automation उन्हें nested wrappers unpack किए बिना पढ़ सके।
- `security` शीर्ष-स्तरीय ClawScan/security निर्णय है। Automation को `ok`, `decision`, `reasons`, और `security.status` पर आधारित होना चाहिए।
- `security.signals` में सहायक स्कैनर प्रमाण होते हैं, जैसे `staticScan`, `virusTotal`, और `skillSpector`।
- `security.signals.dependencyRegistry` v1 प्रतिक्रिया compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` रहती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve करके store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

सटीक स्किल संस्करणों के लिए वर्तमान compact security verdicts लौटाता है। यह collection endpoint उन clients के लिए है जो पहले से जानते हैं कि उन्हें कौन से installed ClawHub skill versions दिखाने हैं, जैसे OpenClaw Control UI।

अनुरोध:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

टिप्पणियां:

- `items` में 1-100 unique `{ slug, version }` pairs होने चाहिए।
- परिणाम प्रति item होते हैं; एक missing skill या version पूरी response को fail नहीं करता।
- response केवल security-only है। इसमें Skill Card data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं होते।
- `security.signals` में केवल status-level supporting evidence होता है; full scanner details के लिए `/scan` या ClawHub security-audit page का उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए retained है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` रहती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; clients को card content की आवश्यकता होने पर installed `skill-card.md` को locally पढ़ना चाहिए।
- जब आपको single-skill Skill Card verification envelope चाहिए तो `/verify` का उपयोग करें, generated card markdown चाहिए तो `/card`, और detailed scanner data चाहिए तो `/scan` का उपयोग करें।

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

कच्ची टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- नवीनतम संस्करण पर डिफ़ॉल्ट होता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इसके लिए एकीकृत कैटलॉग एंडपॉइंट:

- Skills
- कोड plugins
- बंडल plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, लेगेसी उपनाम `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin पैकेजों तक सीमित हो (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले पैकेज एंडपॉइंट)। नियंत्रित श्रेणियाँ और
  लेगेसी v1 फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` स्थिर-फ़ैमिली उपनाम बने रहते हैं।
- Skill प्रविष्टियाँ skill रजिस्ट्री द्वारा समर्थित रहती हैं और अभी भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अभी भी केवल code-plugin और bundle-plugin रिलीज़ के लिए है।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणित कॉलर सूची/खोज परिणामों में उन प्रकाशकों के निजी पैकेज देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे पैकेज लौटाता है जिन्हें प्रमाणित कॉलर पढ़ सकता है।

### `GET /api/v1/packages/search`

Skills + plugin पैकेजों में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin पैकेजों तक सीमित हो। नियंत्रित श्रेणियाँ और लेगेसी v1
  फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

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

`trending` सात-दिन का install/download लीडरबोर्ड है और सर्वकालिक कुलों का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` एंडपॉइंट पर यह केवल-Plugin है; skill कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

लेगेसी उपनाम संग्रहीत या लेखक-घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Skills का बल्क निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रतिसाद से पेजिनेशन कर्सर।

प्रतिसाद:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित skill `{publisher}/{slug}/` पर रूटेड होता है।
- होस्टेड Skills में नवीनतम संग्रहीत संस्करण फ़ाइलें शामिल होती हैं और वे
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध होती हैं।
- `clean` या `suspicious` स्कैन वाले मौजूदा GitHub-समर्थित Skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। इनमें ClawHub-होस्टेड स्रोत फ़ाइलें शामिल नहीं होतीं।
- प्रत्येक skill में `_export_skill_meta.json` शामिल होता है।
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
- `cursor` (वैकल्पिक): पिछली प्रतिक्रिया से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ दोनों
  Plugin परिवार हैं।

प्रतिक्रिया:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यात किया गया Plugin `{family}/{packageName}/` पर रूट किया जाता है।
- प्रत्येक निर्यात किए गए Plugin में नवीनतम रिलीज़ की संग्रहित फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहित होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Plugin या फ़ाइलें निर्यात नहीं की जा
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

नोट:

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ीकृत पुराने v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी डाइजेस्ट पंक्तियों द्वारा समर्थित एक वास्तविक API फ़िल्टर है,
  खोज-क्वेरी पुनर्लेखन नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पेजिनेट नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को फिर से क्रमबद्ध करते हैं,
  जो वर्तमान `/skills` ब्राउज़ व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट:

- Skills एकीकृत कैटलॉग में इस रूट के माध्यम से भी रिज़ॉल्व हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ न सके।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को सॉफ्ट-डिलीट करता है।

नोट:

- पैकेज स्वामी, संगठन प्रकाशक स्वामी/एडमिन, प्लेटफ़ॉर्म मॉडरेटर, या प्लेटफ़ॉर्म एडमिन के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

नोट:

- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ न सके।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता,
सत्यापन, आर्टिफ़ैक्ट मेटाडेटा, और स्कैन डेटा सहित एक पैकेज संस्करण लौटाता है।

नोट:

- `version.artifact.kind` पुराने-विश्व पैकेज आर्काइव के लिए `legacy-zip` या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack` है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स को हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैनॉनिकल रिलीज़ आर्टिफ़ैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ न सके।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और भरोसा सारांश लौटाता है।
यह यह तय करने के लिए सार्वजनिक OpenClaw उपभोग सतह है कि कोई
रिज़ॉल्व की गई रिलीज़ इंस्टॉल की जा सकती है या नहीं।

प्रमाणीकरण:

- सार्वजनिक रीड एंडपॉइंट। किसी स्वामी, प्रकाशक, मॉडरेटर, या एडमिन टोकन की
  आवश्यकता नहीं है।

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

- `package.name`, `package.displayName`, और `package.family`
  रिज़ॉल्व किए गए रजिस्ट्री पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt`
  मूल्यांकित की गई सटीक रिलीज़ की पहचान करते हैं।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफ़ैक्ट के लिए
  ज्ञात होने पर मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैनुअल रिलीज़ मॉडरेशन से व्युत्पन्न
  प्रभावी भरोसा स्थिति है।
- `trust.moderationState` nullable है। जब कोई मैनुअल रिलीज़
  मॉडरेशन मौजूद नहीं होता, तो यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल ब्लॉक संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को इस मान के `true` होने पर इंस्टॉलेशन रोक देना चाहिए, बजाय इसके कि
  वे स्कैनर या मॉडरेशन फ़ील्ड से ब्लॉकिंग नियम फिर से निकालें।
- `trust.reasons` उपयोगकर्ता-सामने और ऑडिट स्पष्टीकरण सूची है। कारण कोड
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक भरोसा इनपुट अभी भी पूर्णता की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि भरोसा सारांश पुराने इनपुट से गणना किया गया था और
  उच्च-विश्वास अनुमति निर्णय से पहले इसे रीफ़्रेश की आवश्यकता के रूप में माना जाना चाहिए।

नोट:

- यह एंडपॉइंट संस्करण-सटीक है। क्लाइंट को इसे उस
  पैकेज संस्करण को रिज़ॉल्व करने के बाद कॉल करना चाहिए जिसे वे इंस्टॉल करना चाहते हैं, न कि केवल नवीनतम
  पैकेज मेटाडेटा पढ़ने के बाद।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर स्वामी प्रकाशक को पढ़ न सके।
- यह एंडपॉइंट स्वामी/मॉडरेटर मॉडरेशन
  एंडपॉइंट की तुलना में जानबूझकर संकरा है। यह इंस्टॉल निर्णय और सार्वजनिक स्पष्टीकरण उजागर करता है,
  रिपोर्टर पहचान, रिपोर्ट बॉडी, निजी प्रमाण, या आंतरिक समीक्षा
  समयरेखाएँ नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफ़ैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

नोट:

- पुराने पैकेज संस्करण `legacy-zip` आर्टिफ़ैक्ट और पुराना ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण `npm-pack` आर्टिफ़ैक्ट, npm इंटीग्रिटी फ़ील्ड,
  `tarballUrl`, और पुराना ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से
  आर्काइव फ़ॉर्मैट का अनुमान लगाने से बचती है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से संस्करण आर्टिफ़ैक्ट डाउनलोड करता है।

नोट:

- ClawPack संस्करण सटीक अपलोड किए गए npm-pack `.tgz` बाइट्स स्ट्रीम करते हैं।
- पुराने ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट करते हैं।
- डाउनलोड रेट बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw उपभोग के लिए गणना की गई तैयारी लौटाता है।

तैयारी जाँचें कवर करती हैं:

- आधिकारिक चैनल स्थिति
- नवीनतम संस्करण उपलब्धता
- ClawPack npm-pack आर्टिफ़ैक्ट उपलब्धता
- आर्टिफ़ैक्ट डाइजेस्ट
- स्रोत रेपो और कमिट प्रॉवेनेन्स
- OpenClaw संगतता मेटाडेटा
- होस्ट लक्ष्य
- स्कैन स्थिति

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

आधिकारिक OpenClaw Plugin माइग्रेशन पंक्तियों को सूचीबद्ध करने के लिए मॉडरेटर एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता के लिए API टोकन आवश्यक है।

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

नोट:

- `bundledPluginId` को lowercase में सामान्यीकृत किया जाता है और यह स्थिर upsert कुंजी है।
- `packageName` npm-name सामान्यीकृत है; नियोजित
  माइग्रेशन के लिए पैकेज गायब हो सकता है।
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

मॉडरेटर समीक्षा के लिए पैकेज रिपोर्ट करें। रिपोर्ट पैकेज-स्तर की होती हैं, वैकल्पिक रूप से
किसी संस्करण से लिंक होती हैं। वे मॉडरेशन कतार को फ़ीड करती हैं लेकिन स्वयं से डाउनलोड को
ऑटो-हाइड या ब्लॉक नहीं करतीं; मॉडरेटर को आर्टिफ़ैक्ट को
स्वीकृत, क्वारंटीन, या रद्द करने के लिए रिलीज़ मॉडरेशन का उपयोग करना चाहिए।

प्रमाणीकरण:

- API टोकन आवश्यक है।

अनुरोध:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
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

Moderator/admin endpoint for package report intake.

Auth:

- Requires an API token for a moderator or admin user.

Query params:

- `status` (optional): `open` (default), `confirmed`, `dismissed`, or `all`
- `limit` (optional): integer (1-100)
- `cursor` (optional): pagination cursor

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

पैकेज मॉडरेशन दृश्यता के लिए owner/moderator endpoint.

प्रमाणीकरण:

- पैकेज owner, publisher member, moderator, या admin user के लिए API token आवश्यक है।

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

पैकेज रिपोर्ट को resolve या reopen करने के लिए moderator/admin endpoint.

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी audit योग्य workflow में release moderation लागू करने के लिए confirmed report के साथ `finalAction: "quarantine"` या `finalAction: "revoke"` पास करें।

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

पैकेज release समीक्षा के लिए moderator/admin endpoint.

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित states:

- `approved`: manually reviewed और allowed.
- `quarantined`: follow-up लंबित रहते हुए blocked.
- `revoked`: किसी release के पहले trusted होने के बाद blocked.

Quarantined और revoked releases artifact download routes से `403` लौटाते हैं। हर बदलाव audit log entry लिखता है।

### `GET /api/v1/packages/{name}/file`

किसी package file के लिए raw text content लौटाता है।

Query params:

- `path` (required)
- `version` (optional)
- `tag` (optional)

Notes:

- latest release पर default करता है।
- download bucket नहीं, read rate bucket का उपयोग करता है।
- Binary files `415` लौटाती हैं।
- File size limit: 200KB.
- Pending VirusTotal scans reads को block नहीं करते; malicious releases फिर भी कहीं और withheld हो सकते हैं।
- Private packages `404` लौटाते हैं, जब तक caller owning publisher को read नहीं कर सकता।

### `GET /api/v1/packages/{name}/download`

किसी package release के लिए legacy deterministic ZIP archive download करता है।

Query params:

- `version` (optional)
- `tag` (optional)

Notes:

- latest release पर default करता है।
- Skills `GET /api/v1/download` पर redirect करते हैं।
- Plugin/package archives ऐसे zip files होते हैं जिनमें `package/` root होता है ताकि पुराने OpenClaw clients काम करते रहें।
- यह route ZIP-only रहता है। यह ClawPack `.tgz` files stream नहीं करता।
- Responses में resolver integrity checks के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और `X-ClawHub-Artifact-Sha256` headers शामिल होते हैं।
- Registry-only metadata downloaded archive में inject नहीं किया जाता।
- Pending VirusTotal scans downloads को block नहीं करते; malicious releases `403` लौटाते हैं।
- Private packages `404` लौटाते हैं, जब तक caller owner नहीं है।

### `GET /api/npm/{package}`

ClawPack-backed package versions के लिए npm-compatible packument लौटाता है।

Notes:

- केवल uploaded ClawPack npm-pack tarballs वाले versions list किए जाते हैं।
- Legacy ZIP-only versions जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-compatible fields का उपयोग करते हैं ताकि users चाहें तो npm को mirror की ओर point कर सकें।
- Scoped package packuments `/api/npm/@scope/name` और npm के encoded `/api/npm/@scope%2Fname` request path, दोनों को support करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm mirror clients के लिए exact uploaded ClawPack tarball bytes stream करता है।

Notes:

- download rate bucket का उपयोग करता है।
- Download headers में ClawHub SHA-256 और npm integrity/shasum metadata शामिल होते हैं।
- Moderation और private package access checks अभी भी लागू होते हैं।

### `GET /api/v1/resolve`

CLI द्वारा local fingerprint को known version से map करने के लिए उपयोग किया जाता है।

Query params:

- `slug` (required)
- `hash` (required): bundle fingerprint का 64-char hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Hosted skill version ZIP download करता है, या `clean` या `suspicious` scan और बिना hosted version वाली current GitHub-backed skill के लिए GitHub source handoff लौटाता है।

Query params:

- `slug` (required)
- `version` (optional): semver string
- `tag` (optional): tag name (e.g. `latest`)

Notes:

- यदि न `version` दिया गया है न `tag`, तो latest version उपयोग किया जाता है।
- Soft-deleted versions `410` लौटाते हैं।
- GitHub-backed skill handoffs bytes को proxy या mirror नहीं करते। JSON response में `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`, और `archiveUrl` शामिल होते हैं; scan/current state एक gate है और success payload metadata के रूप में शामिल नहीं होती।
- Download stats प्रति UTC day unique identities के रूप में गिने जाते हैं (`userId` जब API token valid हो, अन्यथा IP).

## Auth endpoints (Bearer token)

सभी endpoints को आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Token validate करता है और user handle लौटाता है।

### `POST /api/v1/skills`

नया version publish करता है।

- Preferred: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`.
- `files` (storageId-based) वाला JSON body भी accepted है।
- Optional payload field: `ownerHandle`. मौजूद होने पर, API उस publisher को server-side resolve करता है और actor के पास publisher access होना आवश्यक करता है।
- Optional payload field: `migrateOwner`. `ownerHandle` के साथ `true` होने पर, existing skill उस owner पर move हो सकता है यदि actor current और target publishers, दोनों पर admin/owner है। इस opt-in के बिना, owner changes reject किए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin release publish करता है।

- Bearer token auth आवश्यक है।
- `multipart/form-data` आवश्यक है।
- Allowed form fields हैं `payload`, repeated `files` blobs, या एक `clawpack` tarball reference. `clawpack` एक `.tgz` blob या upload-url flow द्वारा लौटाया गया storage id हो सकता है। Staged storage-id publishes में उस upload URL के साथ लौटाया गया `clawpackUploadTicket` भी शामिल होना चाहिए।
- एक ही request में या तो `files` या `clawpack` उपयोग करें, दोनों कभी नहीं।
- JSON bodies और caller-supplied `payload.files` / `payload.artifact` metadata reject किए जाते हैं।
- Direct multipart publish requests 18MB तक capped हैं। ClawPack tarballs 120MB tarball cap तक upload-url flow का उपयोग कर सकते हैं।
- Optional payload field: `ownerHandle`. मौजूद होने पर, केवल admins उस owner की ओर से publish कर सकते हैं।

Validation highlights:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin packages को `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` uploads में यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins को `package.json`, source repo metadata, source commit metadata, config schema metadata, `openclaw.compat.pluginApi`, और `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` optional metadata हैं।
- केवल `openclaw` org publisher और current `openclaw` org members के personal publishers `official` channel में publish कर सकते हैं।
- On-behalf publishes अभी भी target owner account के विरुद्ध official-channel eligibility validate करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Skill को soft-delete / restore करता है (owner, moderator, या admin).

Optional JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill moderation note के रूप में store किया जाता है और audit log में copy किया जाता है।
Owner-initiated soft deletes slug को 30 दिनों के लिए reserve करते हैं, फिर slug किसी दूसरे publisher द्वारा claim किया जा सकता है। जब यह expiry लागू होती है तो delete response में `slugReservedUntil` शामिल होता है।
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

Admin-only. किसी handle के लिए org publisher मौजूद होना सुनिश्चित करता है। यदि handle अभी भी legacy shared user/personal publisher की ओर point करता है, तो endpoint पहले उसे org publisher में migrate करता है।
Newly-created org के लिए, `memberHandle` दें; acting admin member के रूप में add नहीं किया जाता।
`memberRole` defaults to `owner`.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authenticated self-serve org publisher creation. नया org publisher बनाता है और caller को owner के रूप में add करता है। यह endpoint existing user/personal handles migrate नहीं करता और publisher को trusted/official mark नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब handle पहले से किसी publisher, user, या personal publisher द्वारा उपयोग किया जा चुका हो तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

Admin-only. Release publish किए बिना rightful owner के लिए root slugs और package names reserve करता है। Package names no release rows वाले private placeholder packages बन जाते हैं, ताकि वही owner बाद में उस name में real code-plugin या bundle-plugin release publish कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Admin-only. Convex Auth account rows edit किए बिना verified replacement GitHub OAuth principal के लिए personal publisher recover करता है। Request में दोनों immutable GitHub provider account ids नामित होने चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग किए जाते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से ड्राई-रन होता है। रिकवरी लागू करने के लिए स्टाफ़ द्वारा दोनों
GitHub principals के बीच निरंतरता को स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब गंतव्य उपयोगकर्ता के मौजूदा व्यक्तिगत
प्रकाशक के पास Skills, पैकेज, या GitHub Skill स्रोत होते हैं, तो रिकवरी सुरक्षित रूप से विफल हो जाती है।
रिकवरी पुनर्प्राप्त प्रकाशक के Skills, Skill slug उपनामों, पैकेजों, पैकेज इंस्पेक्टर चेतावनियों,
और व्युत्पन्न खोज डाइजेस्ट पंक्तियों के लिए legacy `ownerUserId` फ़ील्ड भी माइग्रेट करती है ताकि
direct-owner पथ नए प्रकाशक अधिकार से मेल खाएं। पुनर्प्राप्त हैंडल के लिए एक सक्रिय संरक्षित-handle
आरक्षण भी प्रतिस्थापन उपयोगकर्ता को फिर से असाइन किया जाता है ताकि बाद का
प्रोफ़ाइल सिंक्रोनाइज़ेशन पूर्व उपयोगकर्ता के प्रतिस्पर्धी अधिकार को बहाल न कर सके। प्रत्येक प्राथमिक तालिका
प्रति apply लेनदेन 100 पंक्तियों तक सीमित है; बड़ी रिकवरी को पहले एक resumable owner migration का उपयोग करना चाहिए।
GitHub Skill स्रोत publisher-scoped होते हैं और उन्हें फिर से लिखने के बजाय checked के रूप में रिपोर्ट किया जाता है।

- बॉडी: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- प्रतिक्रिया: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug प्रबंधन एंडपॉइंट

- `POST /api/v1/skills/{slug}/rename`
  - बॉडी: `{ "newSlug": "new-canonical-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - बॉडी: `{ "targetSlug": "canonical-target-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

टिप्पणियां:

- दोनों एंडपॉइंट को API token auth की आवश्यकता होती है और ये केवल Skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` स्रोत listing को छिपाता है और स्रोत slug को लक्ष्य listing पर redirect करता है।

### स्वामित्व ट्रांसफ़र एंडपॉइंट

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

किसी उपयोगकर्ता को प्रतिबंधित करें और उसके स्वामित्व वाले Skills को hard-delete करें (केवल moderator/admin)।

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

किसी उपयोगकर्ता का प्रतिबंध हटाएं और पात्र Skills को बहाल करें (केवल admin)।

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

किसी मौजूदा प्रतिबंध का संग्रहीत कारण बदलें, बिना प्रतिबंध हटाए या
सामग्री बहाल किए (केवल admin)। जब तक `dryRun` `false` न हो, डिफ़ॉल्ट रूप से ड्राई-रन होता है।

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

उपयोगकर्ताओं की सूची दिखाएं या खोजें (केवल admin)।

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

star जोड़ें/हटाएं (highlights)। दोनों एंडपॉइंट idempotent हैं।

प्रतिक्रियाएं:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI एंडपॉइंट (बहिष्कृत)

पुराने CLI संस्करणों के लिए अभी भी समर्थित:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

हटाने की योजना के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। ऐसे पैकेज
publish, जो ClawPack tarball stage करते हैं, परिणामी storage id को
`clawpack` के रूप में और लौटाए गए ticket को `clawpackUploadTicket` के रूप में भेजना चाहिए।

## Registry discovery (`/.well-known/clawhub.json`)

CLI साइट से registry/auth सेटिंग्स खोज सकता है:

- `/.well-known/clawhub.json` (JSON, वरीय)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो यह फ़ाइल serve करें (या `CLAWHUB_REGISTRY` स्पष्ट रूप से सेट करें; legacy `CLAWDHUB_REGISTRY`)।
