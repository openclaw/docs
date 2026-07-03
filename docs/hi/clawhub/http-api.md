---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ registry अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट्स + प्रमाणीकरण)।
x-i18n:
    generated_at: "2026-07-03T23:31:37Z"
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

## सार्वजनिक कैटलॉग पुन: उपयोग

तृतीय-पक्ष डायरेक्टरी ClawHub Skills को सूचीबद्ध करने या खोजने के लिए सार्वजनिक रीड एंडपॉइंट का उपयोग कर सकती हैं। कृपया परिणाम कैश करें, `429`/`Retry-After` का पालन करें, उपयोगकर्ताओं को कैनॉनिकल ClawHub लिस्टिंग (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और तृतीय-पक्ष साइट के ClawHub समर्थन का संकेत देने से बचें। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन-ब्लॉक की गई सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट को रूट
प्राथमिकता को फिर से बनाने के बजाय रीड एंडपॉइंट द्वारा लौटाए गए कैनॉनिकल URL
का उपयोग करना चाहिए।

## दर सीमाएँ

प्रवर्तन मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer टोकन): प्रति उपयोगकर्ता बकेट लागू।
- यदि टोकन अनुपस्थित/अमान्य है, तो व्यवहार IP प्रवर्तन पर वापस चला जाता है।
- प्रमाणित राइट एंडपॉइंट को तब खाली `Unauthorized` नहीं लौटाना चाहिए जब
  सर्वर कारण जानता हो। अनुपस्थित टोकन, अमान्य/निरस्त टोकन, और
  हटाए गए/प्रतिबंधित/अक्षम खाते, प्रत्येक को कार्रवाई योग्य टेक्स्ट मिलना चाहिए ताकि CLI
  क्लाइंट उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- पढ़ना: प्रति IP 3000/मिनट, प्रति कुंजी 12000/मिनट
- लिखना: प्रति IP 300/मिनट, प्रति कुंजी 3000/मिनट
- डाउनलोड: प्रति IP 1200/मिनट, प्रति कुंजी 6000/मिनट (डाउनलोड एंडपॉइंट)

हेडर:

- लेगेसी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

हेडर अर्थ:

- `X-RateLimit-Reset`: पूर्ण Unix epoch सेकंड
- `RateLimit-Reset`: रीसेट तक सेकंड (विलंब)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर सटीक शेष बजट।
  शार्ड किए गए सफल अनुरोध अनुमानित वैश्विक मान लौटाने के बजाय इस हेडर को छोड़ देते हैं।
- `Retry-After`: `429` पर दोबारा प्रयास से पहले प्रतीक्षा करने के सेकंड (विलंब)

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

- यदि `Retry-After` मौजूद है, तो दोबारा प्रयास करने से पहले उतने सेकंड प्रतीक्षा करें।
- सिंक्रनाइज़ किए गए दोबारा प्रयासों से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` पर वापस जाएँ (या `X-RateLimit-Reset` से गणना करें)।

IP स्रोत:

- विश्वसनीय क्लाइंट IP हेडर, जिनमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब
  डिप्लॉयमेंट स्पष्ट रूप से विश्वसनीय फ़ॉरवर्डेड हेडर सक्षम करता है।
- ClawHub edge पर क्लाइंट IP पहचानने के लिए विश्वसनीय फ़ॉरवर्डिंग हेडर का उपयोग करता है।
- यदि कोई विश्वसनीय क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध fallback buckets का उपयोग करते हैं
  जो केवल दर-सीमा प्रकार द्वारा स्कोप किए जाते हैं। इन fallback buckets में
  कॉलर द्वारा दिए गए पाथ, स्लग, पैकेज नाम, संस्करण, क्वेरी स्ट्रिंग, या अन्य
  artifact पैरामीटर शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएँ

सार्वजनिक v1 त्रुटि प्रतिक्रियाएँ `content-type: text/plain; charset=utf-8` के साथ साधारण टेक्स्ट हैं।
इसमें सत्यापन विफलताएँ (`400`), अनुपस्थित सार्वजनिक संसाधन (`404`), auth और
अनुमति विफलताएँ (`401`/`403`), दर सीमाएँ (`429`), और ब्लॉक किए गए डाउनलोड शामिल हैं। क्लाइंट को
प्रतिक्रिया बॉडी को मानव-पठनीय स्ट्रिंग के रूप में पढ़ना चाहिए। अज्ञात क्वेरी पैरामीटर
संगतता के लिए अनदेखे किए जाते हैं, लेकिन अमान्य मानों वाले पहचाने गए क्वेरी पैरामीटर
`400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट (auth नहीं)

### `GET /api/v1/search`

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): integer
- `highlightedOnly` (वैकल्पिक): हाइलाइट किए गए skills तक फ़िल्टर करने के लिए `true`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) skills छिपाने के लिए `true`
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

- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं (embedding similarity + exact slug/name token boosts + a small popularity prior)।
- प्रासंगिकता लोकप्रियता से अधिक मजबूत है। सटीक slug या display-name token match, बहुत मजबूत engagement वाले ढीले match से ऊपर रैंक कर सकता है।
- ASCII टेक्स्ट word और punctuation boundaries पर tokenize किया जाता है। उदाहरण के लिए, `personal-map` में standalone `map` token होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` होते हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में मजबूत lexical match मिलता है।
- लोकप्रियता log-scaled और capped होती है। यदि query text कमज़ोर match है, तो high-engagement skills भी नीचे रैंक कर सकते हैं।
- संदिग्ध या छिपी moderation state, caller filters और वर्तमान moderation status के आधार पर किसी skill को सार्वजनिक खोज से हटा सकती है।

Publisher discoverability मार्गदर्शन:

- display name, summary, और tags में वे शब्द डालें जिन्हें उपयोगकर्ता सचमुच खोजेंगे। standalone slug token केवल तब उपयोग करें जब वह एक स्थिर पहचान भी हो जिसे आप बनाए रखना चाहते हैं।
- किसी एक query के पीछे भागने के लिए slug का नाम न बदलें, जब तक कि नया slug बेहतर दीर्घकालिक canonical name न हो। पुराने slugs redirect aliases बन जाते हैं, लेकिन canonical URL, displayed slug, और भविष्य के search digests नया slug उपयोग करते हैं।
- rename aliases पुराने URLs और registry के माध्यम से resolve होने वाले installs के लिए resolution बनाए रखते हैं, लेकिन search ranking rename index होने के बाद canonical skill metadata पर आधारित होती है। मौजूदा stats skill के साथ बने रहते हैं।
- यदि कोई skill अप्रत्याशित रूप से अदृश्य है, तो ranking-related metadata बदलने से पहले logged in रहते हुए `clawhub inspect @owner/slug` से पहले moderation state जाँचें।

### `GET /api/v1/skills`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): integer (1–200)
- `cursor` (वैकल्पिक): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर map होते हैं, `trending`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए लेगेसी alias

अमान्य `sort` मान `400` लौटाते हैं।

नोट्स:

- `recommended` engagement और recency signals का उपयोग करता है।
- `trending` पिछले 7 दिनों के installs के आधार पर रैंक करता है (telemetry-based)।
- `createdAt` new-skill crawls के लिए स्थिर है; `updated` मौजूदा skills दोबारा publish होने पर बदलता है।
- जब `nonSuspiciousOnly=true` हो, cursor-based sorts किसी पेज पर `limit` से कम items लौटा सकते हैं क्योंकि संदिग्ध skills page retrieval के बाद filter किए जाते हैं।
- मौजूद होने पर pagination जारी रखने के लिए `nextCursor` उपयोग करें। छोटा पेज अपने आप में end-of-results नहीं दर्शाता।

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
- `metadata.os`: skill frontmatter में घोषित OS restrictions (जैसे `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix system targets (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि skill में कोई platform metadata नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब skill flagged हो या owner उसे देख रहा हो।

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

- Owners और moderators छिपे हुए skills के moderation details access कर सकते हैं।
- Public callers को केवल पहले से flagged visible skills के लिए `200` मिलता है।
- Evidence public callers के लिए redacted होता है और raw snippets केवल owners/moderators के लिए शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

moderator review के लिए skill report करें। Reports skill-level होते हैं, वैकल्पिक रूप से
किसी version से जुड़े होते हैं, और skill report queue को feed करते हैं।

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

skill report intake के लिए moderator/admin endpoint।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed`, या `all`
- `limit` (वैकल्पिक): integer (1-200)
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

skill reports को resolve या reopen करने के लिए moderator/admin endpoint।

अनुरोध:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस
`open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी auditable workflow में skill छिपाने के लिए triaged
report के साथ `finalAction: "hide"` पास करें।

### `GET /api/v1/skills/{slug}/versions`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): integer
- `cursor` (वैकल्पिक): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

version metadata + files list लौटाता है।

- `version.security` में उपलब्ध होने पर normalized scan verification status और scanner details
  (VirusTotal + LLM) शामिल होते हैं।

### `GET /api/v1/skills/{slug}/scan`

किसी skill version के लिए security scan verification details लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): specific version string.
- `tag` (वैकल्पिक): tagged version resolve करें (उदाहरण के लिए `latest`).

नोट्स:

- यदि `version` और `tag` में से कोई भी प्रदान नहीं किया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति के साथ scanner-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी scanner ने निश्चित निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से प्राप्त वर्तमान skill-स्तरीय moderation snapshot है।
- किसी ऐतिहासिक संस्करण को query करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नए ClawScan jobs के लिए प्रमाणीकृत submit endpoint।

Local upload scans अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले requests `410` लौटाते हैं।

Published scans JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

टिप्पणियां:

- Scan request payloads और डाउनलोड करने योग्य reports retention window के बाद scan-request store से expire हो जाते हैं।
- Published scans के लिए owner/publisher management access, या platform moderator/admin authority की आवश्यकता होती है।
- Published scans केवल तब वापस write करते हैं जब `update: true` हो और scan सफलतापूर्वक पूरा हो।
- Response `202` है, `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` के साथ।
- Scan jobs asynchronous हैं। Manual scan requests को सामान्य publish/backfill work से पहले प्राथमिकता दी जाती है, लेकिन completion फिर भी worker availability पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

Submitted scan के लिए प्रमाणीकृत poll endpoint।

- Queued/running/succeeded/failed status लौटाता है।
- Queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है ताकि clients दिखा सकें कि request से आगे कितने prioritized manual scans हैं। बहुत बड़ी queues bounded होती हैं और `queuedAheadIsEstimate: true` के साथ report की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` sections होते हैं।
- Failed scan jobs `lastError` के साथ `status: "failed"` लौटाते हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणीकृत report archive endpoint।

- Succeeded scan की आवश्यकता होती है; non-terminal scans `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Submitted versions के लिए प्रमाणीकृत stored report archive endpoint।

- Skill या plugin के लिए owner/publisher management access, या platform moderator/admin authority की आवश्यकता होती है।
- Exact submitted version के लिए stored scan results लौटाता है, जिसमें blocked या hidden versions शामिल हैं।
- `kind` का default `skill` है; plugin/package scans के लिए `kind=plugin` का उपयोग करें।
- Scan-request downloads जैसा ही ZIP आकार लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

Admin-only canonical batch rescan route। यह legacy `POST /api/v1/skills/-/rescan-batch` जैसा ही payload shape स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

Admin-only canonical batch status route। यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate counters लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया गया Skill Card verification envelope लौटाता है।

Query params:

- `version` (optional): specific version string।
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

टिप्पणियां:

- `ok` केवल तब `true` होता है जब selected version के पास generated Skill Card हो, moderation द्वारा malware-blocked न हो, और ClawScan verification clean हो।
- Skill identity, publisher identity, और selected version metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि shell automation उन्हें nested wrappers unpack किए बिना पढ़ सके।
- `security` top-level ClawScan/security verdict है। Automation को `ok`, `decision`, `reasons`, और `security.status` पर key करना चाहिए।
- `security.signals` में `staticScan`, `virusTotal`, और `skillSpector` जैसे supporting scanner evidence शामिल हैं।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए retained है, लेकिन dependency registry existence scanner retire हो चुका है और यह key हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve और store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

Exact skill versions के लिए वर्तमान compact security verdicts लौटाता है। यह collection endpoint उन clients के लिए है जो पहले से जानते हैं कि उन्हें कौन से installed ClawHub skill versions display करने हैं, जैसे OpenClaw Control UI।

Request:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

टिप्पणियां:

- `items` में 1-100 unique `{ slug, version }` pairs होने चाहिए।
- Results प्रति item होते हैं; एक missing skill या version पूरे response को fail नहीं करता।
- Response security-only है। इसमें Skill Card data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं हैं।
- `security.signals` में केवल status-level supporting evidence होता है; full scanner details के लिए `/scan` या ClawHub security-audit page का उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए retained है, लेकिन dependency registry existence scanner retire हो चुका है और यह key हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; card content की आवश्यकता होने पर clients को installed `skill-card.md` locally पढ़ना चाहिए।
- जब आपको single-skill Skill Card verification envelope चाहिए तो `/verify` का उपयोग करें, generated card markdown चाहिए तो `/card`, और detailed scanner data चाहिए तो `/scan`।

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

टिप्पणियां:

- डिफ़ॉल्ट रूप से नवीनतम संस्करण।
- फ़ाइल आकार सीमा: 200KB.

### `GET /api/v1/packages`

इसके लिए एकीकृत कैटलॉग एंडपॉइंट:

- Skills
- कोड plugins
- बंडल plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, लीगेसी उपनाम `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin पैकेजों (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले पैकेज एंडपॉइंट) तक सीमित हो। नियंत्रित श्रेणियां और
  लीगेसी v1 फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

टिप्पणियां:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` स्थिर-family उपनाम बने रहते हैं।
- Skill प्रविष्टियां skill रजिस्ट्री द्वारा समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अब भी केवल code-plugin और bundle-plugin रिलीज़ के लिए है।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणीकृत कॉलर सूची/खोज परिणामों में उन प्रकाशकों के निजी पैकेज देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे पैकेज लौटाता है जिन्हें प्रमाणीकृत कॉलर पढ़ सकता है।

### `GET /api/v1/packages/search`

Skills + plugin पैकेजों में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin पैकेजों तक सीमित हो। नियंत्रित श्रेणियां और लीगेसी v1
  फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

टिप्पणियां:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- अनाम कॉलर केवल सार्वजनिक पैकेज चैनल देखते हैं।
- प्रमाणीकृत कॉलर उन प्रकाशकों के निजी पैकेज खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे पैकेज लौटाता है जिन्हें प्रमाणीकृत कॉलर पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin पैकेजों में केवल-Plugin कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, लीगेसी उपनाम `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

लीगेसी v1 फ़िल्टर उपनाम रीड एंडपॉइंट पर स्वीकार किए जाते रहते हैं:

- `mcp-tooling`, `data`, और `automation` `tools` में रिज़ॉल्व होते हैं।
- `observability` और `deployment` `gateway` में रिज़ॉल्व होते हैं।
- `dev-tools` `runtime` में रिज़ॉल्व होता है।

`trending` सात-दिन का इंस्टॉल/डाउनलोड लीडरबोर्ड है और सर्वकालिक कुल का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` एंडपॉइंट पर यह केवल-Plugin है; skill कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

लीगेसी उपनाम संग्रहीत या लेखक-घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Skills का बल्क निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`.
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर से पृष्ठांकन कर्सर।

प्रत्युत्तर:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित skill `{publisher}/{slug}/` पर रूटेड है।
- होस्ट किए गए skills में नवीनतम संग्रहीत संस्करण फ़ाइलें शामिल होती हैं और
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध होती हैं।
- `clean` या `suspicious` स्कैन वाले वर्तमान GitHub-समर्थित skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। इनमें ClawHub-होस्टेड स्रोत फ़ाइलें शामिल नहीं होतीं।
- प्रत्येक skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग skills या फ़ाइलों को
  निर्यात नहीं किया जा सका।

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
- `cursor` (वैकल्पिक): पिछले प्रतिसाद से पृष्ठांकन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने पर दोनों
  Plugin परिवार शामिल होते हैं।

प्रतिसाद:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यात किया गया Plugin `{family}/{packageName}/` पर रूट होता है।
- प्रत्येक निर्यात किए गए Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट में शामिल होता है।
- जब अलग-अलग Plugins या फ़ाइलें निर्यात नहीं की जा सकीं, तब `_errors.json`
  शामिल होता है।

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

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित लेगसी v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी डाइजेस्ट पंक्तियों द्वारा समर्थित वास्तविक API फ़िल्टर है,
  खोज-क्वेरी पुनर्लेखन नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पृष्ठांकित नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को
  फिर से क्रमबद्ध करते हैं, जो मौजूदा `/skills` ब्राउज़ व्यवहार से मेल खाता है।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट्स:

- Skills एकीकृत कैटलॉग में इस रूट के माध्यम से भी रिज़ॉल्व हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को सॉफ्ट-डिलीट करता है।

नोट्स:

- पैकेज स्वामी, org प्रकाशक स्वामी/admin, प्लेटफ़ॉर्म मॉडरेटर, या प्लेटफ़ॉर्म admin के
  API टोकन की आवश्यकता है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

नोट्स:

- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

एक पैकेज संस्करण लौटाता है, जिसमें फ़ाइल मेटाडेटा, संगतता,
सत्यापन, आर्टिफ़ैक्ट मेटाडेटा, और स्कैन डेटा शामिल होते हैं।

नोट्स:

- `version.artifact.kind` पुराने-पैकेज आर्काइव के लिए `legacy-zip` या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack` होता है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स का हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैनॉनिकल रिलीज़ आर्टिफ़ैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और
  `version.staticScan` शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और भरोसा सारांश लौटाता है।
यह तय करने के लिए कि रिज़ॉल्व की गई रिलीज़ इंस्टॉल की जा सकती है या नहीं, यह
सार्वजनिक OpenClaw उपभोग सतह है।

प्रमाणीकरण:

- सार्वजनिक पठन एंडपॉइंट। किसी स्वामी, प्रकाशक, मॉडरेटर, या admin टोकन की
  आवश्यकता नहीं है।

प्रतिसाद:

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

प्रतिसाद फ़ील्ड:

- `package.name`, `package.displayName`, और `package.family` रिज़ॉल्व किए गए
  रजिस्ट्री पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt` मूल्यांकित
  सटीक रिलीज़ की पहचान करते हैं।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफ़ैक्ट के लिए
  ज्ञात होने पर मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैनुअल रिलीज़ मॉडरेशन से निकली प्रभावी
  भरोसा स्थिति है।
- `trust.moderationState` nullable है। जब कोई मैनुअल रिलीज़ मॉडरेशन मौजूद नहीं होता,
  यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल ब्लॉक संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को स्कैनर या मॉडरेशन फ़ील्ड से ब्लॉकिंग नियम फिर से निकालने के बजाय,
  इस मान के `true` होने पर इंस्टॉलेशन ब्लॉक करना चाहिए।
- `trust.reasons` उपयोगकर्ता-दिखने वाली और ऑडिट व्याख्या सूची है। कारण कोड
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक भरोसा इनपुट अभी भी पूर्णता की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि भरोसा सारांश पुराने इनपुट से गणना किया गया था और
  उच्च-विश्वास allow निर्णय से पहले इसे रीफ़्रेश आवश्यक मानना चाहिए।

नोट्स:

- यह एंडपॉइंट संस्करण-सटीक है। क्लाइंट को इसे उस पैकेज संस्करण को रिज़ॉल्व करने के
  बाद कॉल करना चाहिए जिसे वे इंस्टॉल करना चाहते हैं, केवल नवीनतम पैकेज मेटाडेटा
  पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।
- यह एंडपॉइंट स्वामी/मॉडरेटर मॉडरेशन एंडपॉइंट्स से जानबूझकर संकरा है। यह
  इंस्टॉल निर्णय और सार्वजनिक व्याख्या उजागर करता है, रिपोर्टर पहचान,
  रिपोर्ट बॉडी, निजी साक्ष्य, या आंतरिक समीक्षा समयरेखाएँ नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफ़ैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

नोट्स:

- लेगसी पैकेज संस्करण `legacy-zip` आर्टिफ़ैक्ट और लेगसी ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण `npm-pack` आर्टिफ़ैक्ट, npm इंटीग्रिटी फ़ील्ड,
  `tarballUrl`, और लेगसी ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से आर्काइव फ़ॉर्मैट का अनुमान लगाने से
  बचता है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से संस्करण आर्टिफ़ैक्ट डाउनलोड करता है।

नोट्स:

- ClawPack संस्करण सटीक अपलोड किए गए npm-pack `.tgz` बाइट्स स्ट्रीम करते हैं।
- लेगसी ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट करते हैं।
- डाउनलोड दर बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw उपभोग के लिए गणित readiness लौटाता है।

Readiness जांचें कवर करती हैं:

- आधिकारिक चैनल स्थिति
- नवीनतम संस्करण उपलब्धता
- ClawPack npm-pack आर्टिफ़ैक्ट उपलब्धता
- आर्टिफ़ैक्ट डाइजेस्ट
- स्रोत repo और commit provenance
- OpenClaw संगतता मेटाडेटा
- होस्ट लक्ष्य
- स्कैन स्थिति

प्रतिसाद:

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

आधिकारिक OpenClaw Plugin माइग्रेशन पंक्तियाँ सूचीबद्ध करने के लिए मॉडरेटर एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या admin उपयोगकर्ता के API टोकन की आवश्यकता है।

क्वेरी पैरामीटर:

- `phase` (वैकल्पिक): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, या
  `all` (डिफ़ॉल्ट)।
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

प्रतिसाद:

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

आधिकारिक Plugin माइग्रेशन पंक्ति बनाने या अपडेट करने के लिए admin एंडपॉइंट।

प्रमाणीकरण:

- admin उपयोगकर्ता के API टोकन की आवश्यकता है।

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

- `bundledPluginId` लोअरकेस में सामान्यीकृत होता है और स्थिर upsert कुंजी है।
- `packageName` npm-name सामान्यीकृत है; नियोजित माइग्रेशन के लिए पैकेज अनुपस्थित हो सकता है।
- यह केवल माइग्रेशन readiness ट्रैक करता है। यह OpenClaw को म्यूटेट नहीं करता या
  ClawPacks जनरेट नहीं करता।

### `GET /api/v1/packages/moderation/queue`

पैकेज रिलीज़ समीक्षा कतारों के लिए मॉडरेटर/admin एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या admin उपयोगकर्ता के API टोकन की आवश्यकता है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

स्थिति अर्थ:

- `open`: संदिग्ध, दुर्भावनापूर्ण, लंबित, क्वारंटीन, revoked, या रिपोर्ट की गई रिलीज़।
- `blocked`: क्वारंटीन, revoked, या दुर्भावनापूर्ण रिलीज़।
- `manual`: मैनुअल मॉडरेशन override वाली कोई भी रिलीज़।
- `all`: मैनुअल override, non-clean स्कैन स्थिति, या पैकेज रिपोर्ट वाली कोई भी रिलीज़।

प्रतिसाद:

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
किसी संस्करण से लिंक की जाती हैं। वे मॉडरेशन कतार में जाती हैं, लेकिन अपने आप
डाउनलोड छिपाती या ब्लॉक नहीं करतीं; मॉडरेटर को आर्टिफ़ैक्ट approve, quarantine,
या revoke करने के लिए रिलीज़ मॉडरेशन का उपयोग करना चाहिए।

प्रमाणीकरण:

- API टोकन आवश्यक है।

अनुरोध:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

प्रतिसाद:

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

पैकेज रिपोर्ट इनटेक के लिए मॉडरेटर/व्यवस्थापक एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या व्यवस्थापक उपयोगकर्ता के लिए API टोकन आवश्यक है।

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

- पैकेज मालिक, प्रकाशक सदस्य, मॉडरेटर, या व्यवस्थापक उपयोगकर्ता के लिए API
  टोकन आवश्यक है।

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

पैकेज रिपोर्ट हल करने या फिर से खोलने के लिए मॉडरेटर/व्यवस्थापक एंडपॉइंट।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस
`open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट-योग्य वर्कफ़्लो में
रिलीज़ मॉडरेशन लागू करने के लिए पुष्टि की गई रिपोर्ट के साथ
`finalAction: "quarantine"` या `finalAction: "revoke"` पास करें।

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

पैकेज रिलीज़ समीक्षा के लिए मॉडरेटर/व्यवस्थापक एंडपॉइंट।

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित स्थितियां:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई।
- `quarantined`: आगे की कार्रवाई लंबित होने तक ब्लॉक किया गया।
- `revoked`: किसी रिलीज़ पर पहले भरोसा किए जाने के बाद ब्लॉक किया गया।

क्वारंटीन की गई और निरस्त रिलीज़ आर्टिफैक्ट डाउनलोड रूट से `403` लौटाती हैं।
हर बदलाव एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

किसी पैकेज फ़ाइल के लिए कच्ची टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट:

- डिफ़ॉल्ट नवीनतम रिलीज़ होता है।
- डाउनलोड बकेट नहीं, रीड रेट बकेट का उपयोग करता है।
- बाइनरी फ़ाइलें `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal स्कैन रीड को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ फिर भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/download`

पैकेज रिलीज़ के लिए विरासती deterministic ZIP आर्काइव डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट:

- डिफ़ॉल्ट नवीनतम रिलीज़ होता है।
- Skills `GET /api/v1/download` पर रीडायरेक्ट होते हैं।
- Plugin/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें हैं ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह रूट केवल ZIP रहता है। यह ClawPack `.tgz` फ़ाइलों को स्ट्रीम नहीं करता।
- रिज़ॉल्वर अखंडता जांचों के लिए प्रतिक्रियाओं में `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type`, और `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल-रजिस्ट्री मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक न हो।

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत packument लौटाता है।

नोट:

- केवल अपलोड किए गए ClawPack npm-pack tarball वाले संस्करण सूचीबद्ध होते हैं।
- विरासती केवल-ZIP संस्करण जानबूझकर छोड़े गए हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत फ़ील्ड का उपयोग करते हैं
  ताकि उपयोगकर्ता चाहें तो npm को मिरर पर पॉइंट कर सकें।
- Scoped package packument `/api/npm/@scope/name` और npm के
  encoded `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm मिरर क्लाइंट के लिए ठीक अपलोड किए गए ClawPack tarball बाइट्स स्ट्रीम करता है।

नोट:

- डाउनलोड रेट बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 और npm integrity/shasum मेटाडेटा शामिल होता है।
- मॉडरेशन और निजी पैकेज एक्सेस जांचें अब भी लागू होती हैं।

### `GET /api/v1/resolve`

स्थानीय fingerprint को किसी ज्ञात संस्करण से मैप करने के लिए CLI द्वारा उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): बंडल fingerprint का 64-अक्षर hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

किसी hosted skill संस्करण ZIP को डाउनलोड करता है, या `clean` या `suspicious`
स्कैन और बिना hosted संस्करण वाली वर्तमान GitHub-समर्थित skill के लिए GitHub
स्रोत handoff लौटाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (जैसे `latest`)

नोट:

- यदि `version` और `tag` में से कोई भी नहीं दिया गया है, तो नवीनतम संस्करण उपयोग होता है।
- Soft-deleted संस्करण `410` लौटाते हैं।
- GitHub-समर्थित skill handoff बाइट्स को proxy या mirror नहीं करते। JSON प्रतिक्रिया में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; scan/current स्थिति एक gate है और सफलता
  payload मेटाडेटा के रूप में शामिल नहीं होती।
- डाउनलोड आंकड़े प्रति UTC दिन अद्वितीय identities के रूप में गिने जाते हैं (`userId` जब API token मान्य हो, अन्यथा IP)।

## प्रमाणीकरण एंडपॉइंट (Bearer token)

सभी एंडपॉइंट के लिए आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन को मान्य करता है और उपयोगकर्ता handle लौटाता है।

### `POST /api/v1/skills`

एक नया संस्करण प्रकाशित करता है।

- प्राथमिक: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`।
- `files` (storageId-आधारित) वाला JSON body भी स्वीकार किया जाता है।
- वैकल्पिक payload फ़ील्ड: `ownerHandle`। मौजूद होने पर, API उस
  publisher को server-side resolve करता है और actor के पास publisher access होना आवश्यक करता है।
- वैकल्पिक payload फ़ील्ड: `migrateOwner`। `ownerHandle` के साथ `true` होने पर,
  कोई मौजूदा skill उस owner के पास जा सकती है अगर actor वर्तमान और लक्ष्य,
  दोनों publishers पर admin/owner है। इस opt-in के बिना, owner बदलाव
  अस्वीकार कर दिए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है।

- Bearer token auth आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत form fields हैं `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  tarball reference। `clawpack` एक `.tgz` blob या upload-url flow द्वारा लौटाया गया
  storage id हो सकता है। Staged storage-id publishes में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- एक ही अनुरोध में `files` या `clawpack` में से किसी एक का उपयोग करें, दोनों का कभी नहीं।
- JSON bodies और caller-supplied `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार किए जाते हैं।
- Direct multipart publish अनुरोध 18MB पर capped हैं। ClawPack tarballs
  120MB tarball cap तक upload-url flow का उपयोग कर सकते हैं।
- वैकल्पिक payload फ़ील्ड: `ownerHandle`। मौजूद होने पर, केवल admins उस owner की ओर से प्रकाशित कर सकते हैं।

मान्यता हाइलाइट:

- `family` `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin पैकेजों के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` uploads में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins के लिए `package.json`, source repo metadata, source commit
  metadata, config schema metadata, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` org publisher और वर्तमान `openclaw` org members के
  personal publishers `official` channel पर प्रकाशित कर सकते हैं।
- On-behalf publishes अब भी target owner account के विरुद्ध official-channel eligibility validate करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill को soft-delete / restore करता है (owner, moderator, या admin)।

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill moderation note के रूप में संग्रहीत होता है और audit log में कॉपी किया जाता है।
Owner-initiated soft deletes slug को 30 दिनों के लिए reserve करते हैं, फिर slug को
दूसरा publisher claim कर सकता है। जब यह expiry लागू होती है, delete response में `slugReservedUntil` शामिल होता है।
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

केवल admin। किसी handle के लिए org publisher मौजूद होना सुनिश्चित करता है। अगर handle अब भी
legacy shared user/personal publisher की ओर इंगित करता है, तो endpoint पहले उसे org publisher में migrate करता है।
नव-निर्मित org के लिए, `memberHandle` दें; acting admin को member के रूप में नहीं जोड़ा जाता।
`memberRole` डिफ़ॉल्ट रूप से `owner` होता है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authenticated self-serve org publisher creation। नया org publisher बनाता है और
caller को owner के रूप में जोड़ता है। यह endpoint मौजूदा user/personal handles को migrate नहीं करता और
publisher को trusted/official के रूप में mark नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब handle पहले से किसी publisher, user, या personal publisher द्वारा उपयोग किया गया हो, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल admin। release प्रकाशित किए बिना, rightful owner के लिए root slugs और package names reserve करता है।
Package names बिना release rows वाले private placeholder packages बन जाते हैं, ताकि वही
owner बाद में वास्तविक code-plugin या bundle-plugin release को उस नाम में प्रकाशित कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल admin। Convex Auth account rows को edit किए बिना, verified replacement GitHub OAuth principal
के लिए personal publisher recover करता है। अनुरोध में दोनों immutable GitHub
provider account ids का नाम होना चाहिए; mutable handles का उपयोग केवल operator-facing guard के रूप में किया जाता है।

एंडपॉइंट डिफ़ॉल्ट रूप से ड्राई-रन होता है। रिकवरी लागू करने के लिए स्टाफ़ द्वारा दोनों
GitHub प्रिंसिपल के बीच निरंतरता स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब गंतव्य उपयोगकर्ता के मौजूदा व्यक्तिगत
प्रकाशक के पास स्किल, पैकेज, या GitHub स्किल स्रोत हों, तो रिकवरी बंद अवस्था में विफल होती है।
रिकवरी, रिकवर किए गए प्रकाशक की स्किल, स्किल स्लग एलियस, पैकेज, पैकेज इंस्पेक्टर चेतावनियों,
और व्युत्पन्न खोज डाइजेस्ट पंक्तियों के लिए पुराने `ownerUserId` फ़ील्ड भी माइग्रेट करती है ताकि
प्रत्यक्ष-स्वामी पथ नए प्रकाशक प्राधिकार से सहमत हों। रिकवर किए गए हैंडल के लिए सक्रिय संरक्षित-हैंडल
आरक्षण भी प्रतिस्थापन उपयोगकर्ता को फिर से सौंपा जाता है ताकि बाद में
प्रोफ़ाइल सिंक्रोनाइज़ेशन पूर्व उपयोगकर्ता के प्रतिस्पर्धी प्राधिकार को बहाल न कर सके। प्रत्येक प्राथमिक तालिका
प्रति लागू ट्रांज़ैक्शन 100 पंक्तियों तक सीमित है; बड़ी रिकवरी के लिए पहले पुनःआरंभ योग्य स्वामी माइग्रेशन का उपयोग करना होगा।
GitHub स्किल स्रोत प्रकाशक-स्कोप्ड होते हैं और फिर से लिखे जाने के बजाय जाँचे गए के रूप में रिपोर्ट किए जाते हैं।

- बॉडी: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- प्रतिक्रिया: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### स्वामी स्लग प्रबंधन एंडपॉइंट

- `POST /api/v1/skills/{slug}/rename`
  - बॉडी: `{ "newSlug": "new-canonical-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - बॉडी: `{ "targetSlug": "canonical-target-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

नोट्स:

- दोनों एंडपॉइंट के लिए API टोकन प्रमाणीकरण आवश्यक है और वे केवल स्किल स्वामी के लिए काम करते हैं।
- `rename` पिछले स्लग को रीडायरेक्ट एलियस के रूप में सुरक्षित रखता है।
- `merge` स्रोत लिस्टिंग को छिपाता है और स्रोत स्लग को लक्ष्य लिस्टिंग पर रीडायरेक्ट करता है।

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

किसी उपयोगकर्ता को प्रतिबंधित करें और स्वामित्व वाली स्किल को हार्ड-डिलीट करें (केवल मॉडरेटर/एडमिन)।

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

किसी उपयोगकर्ता का प्रतिबंध हटाएँ और योग्य स्किल बहाल करें (केवल एडमिन)।

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

प्रतिबंध हटाए बिना या सामग्री बहाल किए बिना किसी मौजूदा प्रतिबंध का संग्रहीत कारण बदलें
(केवल एडमिन)। जब तक `dryRun` `false` न हो, डिफ़ॉल्ट रूप से ड्राई-रन होता है।

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

उपयोगकर्ताओं की सूची दिखाएँ या खोजें (केवल एडमिन)।

क्वेरी पैरामीटर:

- `q` (वैकल्पिक): खोज क्वेरी
- `query` (वैकल्पिक): `q` के लिए एलियस
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

स्टार (हाइलाइट) जोड़ें/हटाएँ। दोनों एंडपॉइंट idempotent हैं।

प्रतिक्रियाएँ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## लेगेसी CLI एंडपॉइंट (बहिष्कृत)

पुराने CLI संस्करणों के लिए अब भी समर्थित:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

हटाने की योजना के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। वे पैकेज
प्रकाशन जो ClawPack टारबॉल को स्टेज करते हैं, उन्हें परिणामी स्टोरेज id को
`clawpack` के रूप में और लौटाए गए टिकट को `clawpackUploadTicket` के रूप में भेजना होगा।

## रजिस्ट्री डिस्कवरी (`/.well-known/clawhub.json`)

CLI साइट से रजिस्ट्री/प्रमाणीकरण सेटिंग खोज सकता है:

- `/.well-known/clawhub.json` (JSON, वरीय)
- `/.well-known/clawdhub.json` (लेगेसी)

स्कीमा:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप स्वयं होस्ट करते हैं, तो यह फ़ाइल सर्व करें (या `CLAWHUB_REGISTRY` स्पष्ट रूप से सेट करें; लेगेसी `CLAWDHUB_REGISTRY`)।
