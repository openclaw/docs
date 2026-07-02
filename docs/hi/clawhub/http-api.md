---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI endpoints + auth).
x-i18n:
    generated_at: "2026-07-02T22:29:57Z"
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

## सार्वजनिक catalog पुन: उपयोग

तृतीय-पक्ष directories सार्वजनिक read endpoints का उपयोग ClawHub skills को सूचीबद्ध करने या खोजने के लिए कर सकती हैं। कृपया परिणामों को cache करें, `429`/`Retry-After` का सम्मान करें, उपयोगकर्ताओं को canonical ClawHub listing (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस link करें, और तृतीय-पक्ष site के लिए ClawHub endorsement का संकेत देने से बचें। public API surface के बाहर hidden, private, या moderation-blocked content को mirror करने का प्रयास न करें।

Web slug shortcuts registry families में resolve होते हैं, लेकिन API clients को route precedence को दोबारा बनाने के बजाय read endpoints द्वारा लौटाए गए canonical URLs का उपयोग करना चाहिए।

## Rate limits

Enforcement model:

- Anonymous requests: प्रति IP enforce किए जाते हैं।
- Authenticated requests (valid Bearer token): प्रति user bucket enforce किए जाते हैं।
- यदि token missing/invalid है, तो behavior IP enforcement पर वापस चला जाता है।
- Authenticated write endpoints को bare `Unauthorized` return नहीं करना चाहिए जब server को reason पता हो। Missing tokens, invalid/revoked tokens, और deleted/banned/disabled accounts में से प्रत्येक को actionable text मिलना चाहिए ताकि CLI clients users को बता सकें कि उन्हें किसने block किया।

- Read: 3000/min प्रति IP, 12000/min प्रति key
- Write: 300/min प्रति IP, 3000/min प्रति key
- Download: 1200/min प्रति IP, 6000/min प्रति key (download endpoints)

Headers:

- Legacy compatibility: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardized: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

Header semantics:

- `X-RateLimit-Reset`: absolute Unix epoch seconds
- `RateLimit-Reset`: reset तक seconds (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर exact remaining budget।
  Sharded successful requests approximate global value return करने के बजाय इस header को omit करते हैं।
- `Retry-After`: `429` पर retry से पहले wait करने के seconds (delay)

Example `429` response:

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

Client guidance:

- यदि `Retry-After` मौजूद है, तो retry से पहले उतने seconds wait करें।
- synchronized retries से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` missing है, तो `RateLimit-Reset` पर fallback करें (या `X-RateLimit-Reset` से compute करें)।

IP source:

- trusted client IP headers, जिनमें `cf-connecting-ip` शामिल है, केवल तब use करता है जब deployment trusted forwarded headers को स्पष्ट रूप से enable करता है।
- ClawHub edge पर client IPs की पहचान करने के लिए trusted forwarding headers का उपयोग करता है।
- यदि कोई trusted client IP उपलब्ध नहीं है, तो anonymous requests fallback buckets का उपयोग करती हैं जो केवल rate-limit kind से scoped होते हैं। इन fallback buckets में caller-supplied paths, slugs, package names, versions, query strings, या अन्य artifact parameters शामिल नहीं होते।

## Error responses

Public v1 error responses `content-type: text/plain; charset=utf-8` के साथ plain text होते हैं।
इसमें validation failures (`400`), missing public resources (`404`), auth और permission failures (`401`/`403`), rate limits (`429`), और blocked downloads शामिल हैं। Clients को response body को human-readable string के रूप में पढ़ना चाहिए। Unknown query parameters संगतता के लिए ignored होते हैं, लेकिन invalid values वाले recognized query parameters `400` return करते हैं।

## Public endpoints (no auth)

### `GET /api/v1/search`

Query params:

- `q` (required): query string
- `limit` (optional): integer
- `highlightedOnly` (optional): highlighted skills तक filter करने के लिए `true`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) skills को hide करने के लिए `true`
- `nonSuspicious` (optional): `nonSuspiciousOnly` के लिए legacy alias

Response:

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

Notes:

- Results relevance order में return किए जाते हैं (embedding similarity + exact slug/name token boosts + a small popularity prior)।
- Relevance popularity से stronger है। Precise slug या display-name token match, much stronger engagement वाले looser match से ऊपर rank कर सकता है।
- ASCII text word और punctuation boundaries पर tokenized होता है। उदाहरण के लिए, `personal-map` में standalone `map` token होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` होते हैं; इसलिए `map` search करने पर `personal-map` को `amap-jsapi-skill` से stronger lexical match मिलता है।
- Popularity log-scaled और capped है। High-engagement skills lower rank कर सकते हैं जब query text weaker match हो।
- Suspicious या hidden moderation state caller filters और current moderation status के आधार पर किसी skill को public search से remove कर सकता है।

Publisher discoverability guidance:

- जिन terms को users सचमुच search करेंगे, उन्हें display name, summary, और tags में रखें। Standalone slug token केवल तभी use करें जब वह ऐसी stable identity भी हो जिसे आप बनाए रखना चाहते हैं।
- केवल एक query को chase करने के लिए slug rename न करें, जब तक कि नया slug बेहतर long-term canonical name न हो। Old slugs redirect aliases बन जाते हैं, लेकिन canonical URL, displayed slug, और future search digests नया slug use करते हैं।
- Rename aliases पुराने URLs और registry के माध्यम से resolve होने वाले installs के लिए resolution preserve करते हैं, लेकिन search ranking rename indexed होने के बाद canonical skill metadata पर आधारित होती है। Existing stats skill के साथ रहती हैं।
- यदि कोई skill unexpectedly invisible है, तो ranking-related metadata बदलने से पहले logged in रहते हुए `clawhub inspect @owner/slug` के साथ moderation state पहले check करें।

### `GET /api/v1/skills`

Query params:

- `limit` (optional): integer (1–200)
- `cursor` (optional): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (optional): `updated` (default), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर map होते हैं, `trending`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) skills को hide करने के लिए `true`
- `nonSuspicious` (optional): `nonSuspiciousOnly` के लिए legacy alias

Invalid `sort` values `400` return करते हैं।

Notes:

- `recommended` engagement और recency signals का उपयोग करता है।
- `trending` पिछले 7 दिनों में installs के आधार पर rank करता है (telemetry-based)।
- `createdAt` new-skill crawls के लिए stable है; `updated` existing skills republished होने पर बदलता है।
- जब `nonSuspiciousOnly=true` हो, cursor-based sorts किसी page पर `limit` से fewer items return कर सकते हैं क्योंकि suspicious skills page retrieval के बाद filtered होती हैं।
- मौजूद होने पर pagination continue करने के लिए `nextCursor` use करें। Short page अपने आप end-of-results नहीं बताता।

Response:

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

Response:

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

Notes:

- owner rename/merge flows द्वारा बनाए गए old slugs canonical skill पर resolve होते हैं।
- `metadata.os`: skill frontmatter में declared OS restrictions (जैसे `["macos"]`, `["linux"]`)। declared न होने पर `null`।
- `metadata.systems`: Nix system targets (जैसे `["aarch64-darwin", "x86_64-linux"]`)। declared न होने पर `null`।
- यदि skill में कोई platform metadata नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब included होता है जब skill flagged हो या owner उसे देख रहा हो।

### `GET /api/v1/skills/{slug}/moderation`

structured moderation state return करता है।

Response:

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

Notes:

- Owners और moderators hidden skills के moderation details access कर सकते हैं।
- Public callers को केवल already-flagged visible skills के लिए `200` मिलता है।
- Evidence public callers के लिए redacted होता है और raw snippets केवल owners/moderators के लिए शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

moderator review के लिए skill report करें। Reports skill-level हैं, optionally version से linked हैं, और skill report queue को feed करते हैं।

Auth:

- API token required है।

Request:

```json
{ "reason": "Suspicious install step", "version": "1.2.3" }
```

Response:

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

skill report intake के लिए Moderator/admin endpoint।

Query params:

- `status` (optional): `open` (default), `confirmed`, `dismissed`, या `all`
- `limit` (optional): integer (1-200)
- `cursor` (optional): pagination cursor

Response:

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

skill reports resolve या reopen करने के लिए Moderator/admin endpoint।

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` `confirmed` और `dismissed` के लिए required है; `status` को वापस `open` पर set करते समय इसे omit किया जा सकता है। same auditable workflow में skill hide करने के लिए triaged report के साथ `finalAction: "hide"` pass करें।

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (optional): integer
- `cursor` (optional): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

version metadata + files list return करता है।

- `version.security` normalized scan verification status और scanner details
  (VirusTotal + LLM), उपलब्ध होने पर, शामिल करता है।

### `GET /api/v1/skills/{slug}/scan`

skill version के लिए security scan verification details return करता है।

Query params:

- `version` (optional): specific version string।
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

Notes:

- यदि न तो `version` और न ही `tag` दिया गया हो, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति और स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निश्चित निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से निकाला गया वर्तमान स्किल-स्तर मॉडरेशन स्नैपशॉट है।
- किसी ऐतिहासिक संस्करण की क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नए ClawScan जॉब के लिए प्रमाणित सबमिट एंडपॉइंट।

स्थानीय अपलोड स्कैन अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले अनुरोध `410` लौटाते हैं।

प्रकाशित स्कैन JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- स्कैन अनुरोध पेलोड और डाउनलोड करने योग्य रिपोर्ट प्रतिधारण अवधि के बाद स्कैन-अनुरोध स्टोर से समाप्त हो जाते हैं।
- प्रकाशित स्कैन के लिए स्वामी/प्रकाशक प्रबंधन पहुंच, या प्लेटफ़ॉर्म मॉडरेटर/एडमिन अधिकार की आवश्यकता होती है।
- प्रकाशित स्कैन केवल तब वापस लिखते हैं जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो जाए।
- प्रतिक्रिया `202` होती है, जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- स्कैन जॉब असिंक्रोनस होते हैं। मैनुअल स्कैन अनुरोधों को सामान्य प्रकाशन/बैकफिल काम से पहले प्राथमिकता दी जाती है, लेकिन पूर्णता फिर भी वर्कर उपलब्धता पर निर्भर करती है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणित पोल एंडपॉइंट।

- queued/running/succeeded/failed स्थिति लौटाता है।
- queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है ताकि क्लाइंट दिखा सकें कि अनुरोध से पहले कितने प्राथमिकता प्राप्त मैनुअल स्कैन हैं। बहुत बड़ी कतारों को सीमित किया जाता है और `queuedAheadIsEstimate: true` के साथ रिपोर्ट किया जाता है।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` सेक्शन होते हैं।
- विफल स्कैन जॉब `lastError` के साथ `status: "failed"` लौटाते हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणित रिपोर्ट आर्काइव एंडपॉइंट।

- सफल स्कैन आवश्यक है; गैर-टर्मिनल स्कैन `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` वाला ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए संस्करणों के लिए प्रमाणित संग्रहित रिपोर्ट आर्काइव एंडपॉइंट।

- स्किल या प्लगइन तक स्वामी/प्रकाशक प्रबंधन पहुंच, या प्लेटफ़ॉर्म मॉडरेटर/एडमिन अधिकार की आवश्यकता होती है।
- सटीक सबमिट किए गए संस्करण के लिए संग्रहित स्कैन परिणाम लौटाता है, जिसमें अवरुद्ध या छिपे हुए संस्करण शामिल हैं।
- `kind` का डिफ़ॉल्ट `skill` है; प्लगइन/पैकेज स्कैन के लिए `kind=plugin` का उपयोग करें।
- स्कैन-अनुरोध डाउनलोड जैसा ही ZIP आकार लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

केवल एडमिन के लिए कैनॉनिकल बैच पुनः-स्कैन रूट। यह लेगेसी `POST /api/v1/skills/-/rescan-batch` जैसा ही पेलोड आकार स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

केवल एडमिन के लिए कैनॉनिकल बैच स्थिति रूट। यह `{ "jobIds": ["..."] }` स्वीकार करता है और लेगेसी `POST /api/v1/skills/-/rescan-batch/status` जैसे ही समेकित काउंटर लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया गया स्किल कार्ड सत्यापन एनवलप लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किए गए संस्करण को रिज़ॉल्व करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब चुने गए संस्करण में जनरेट किया गया स्किल कार्ड हो, वह मॉडरेशन द्वारा मैलवेयर-अवरुद्ध न हो, और ClawScan सत्यापन साफ़ हो।
- स्किल पहचान, प्रकाशक पहचान, और चुने गए संस्करण का मेटाडेटा टॉप-लेवल एनवलप फ़ील्ड (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि शेल ऑटोमेशन नेस्टेड रैपर अनपैक किए बिना उन्हें पढ़ सके।
- `security` टॉप-लेवल ClawScan/सुरक्षा निर्णय है। ऑटोमेशन को `ok`, `decision`, `reasons`, और `security.status` पर आधारित होना चाहिए।
- `security.signals` में सहायक स्कैनर प्रमाण होते हैं, जैसे `staticScan`, `virusTotal`, और `skillSpector`।
- `security.signals.dependencyRegistry` v1 प्रतिक्रिया संगतता के लिए रखा गया है, लेकिन डिपेंडेंसी रजिस्ट्री अस्तित्व स्कैनर सेवानिवृत्त हो चुका है और यह कुंजी हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने प्रकाशन या आयात के दौरान GitHub repo/ref/commit/path को रिज़ॉल्व और संग्रहित किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

सटीक स्किल संस्करणों के लिए वर्तमान संक्षिप्त सुरक्षा निर्णय लौटाता है। यह कलेक्शन एंडपॉइंट उन क्लाइंटों के लिए है जिन्हें पहले से पता है कि उन्हें कौन से इंस्टॉल किए गए ClawHub स्किल संस्करण दिखाने हैं, जैसे OpenClaw Control UI।

अनुरोध:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

नोट्स:

- `items` में 1-100 अद्वितीय `{ slug, version }` जोड़े होने चाहिए।
- परिणाम प्रति आइटम होते हैं; एक गायब स्किल या संस्करण पूरी प्रतिक्रिया को विफल नहीं करता।
- प्रतिक्रिया केवल सुरक्षा-संबंधी है। इसमें स्किल कार्ड डेटा, जनरेटेड कार्ड स्थिति, आर्टिफैक्ट फ़ाइल सूचियां, या विस्तृत स्कैनर पेलोड शामिल नहीं हैं।
- `security.signals` में केवल स्थिति-स्तर का सहायक प्रमाण होता है; पूरे स्कैनर विवरण के लिए `/scan` या ClawHub सुरक्षा-ऑडिट पेज का उपयोग करें।
- `security.signals.dependencyRegistry` v1 प्रतिक्रिया संगतता के लिए रखा गया है, लेकिन डिपेंडेंसी रजिस्ट्री अस्तित्व स्कैनर सेवानिवृत्त हो चुका है और यह कुंजी हमेशा `null` होती है।
- स्किल कार्ड की अनुपस्थिति इस एंडपॉइंट के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; क्लाइंटों को कार्ड सामग्री की आवश्यकता होने पर इंस्टॉल किया गया `skill-card.md` स्थानीय रूप से पढ़ना चाहिए।
- जब आपको एकल-स्किल स्किल कार्ड सत्यापन एनवलप चाहिए तो `/verify` का उपयोग करें, जब आपको जनरेटेड कार्ड markdown चाहिए तो `/card` का उपयोग करें, और जब आपको विस्तृत स्कैनर डेटा चाहिए तो `/scan` का उपयोग करें।

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

- नवीनतम संस्करण पर डिफ़ॉल्ट करता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग endpoint:

- skills
- code plugins
- bundle plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन cursor
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, legacy alias `installs`
- `category` (वैकल्पिक): plugin category filter। केवल तब समर्थित जब
  अनुरोध plugin packages (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या package endpoints with
  `family=code-plugin`/`family=bundle-plugin`) तक सीमित हो। नियंत्रित श्रेणियां और
  legacy v1 filter aliases `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात query parameters अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` fixed-family aliases बने रहते हैं।
- Skill entries skill registry द्वारा समर्थित रहती हैं और अभी भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अभी भी केवल code-plugin और bundle-plugin रिलीज़ के लिए है।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers list/search results में उन publishers के private packages देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/packages/search`

skills + plugin packages में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): query string
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin category filter। केवल तब समर्थित जब
  अनुरोध plugin packages तक सीमित हो। नियंत्रित श्रेणियां और legacy v1
  filter aliases `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात query parameters अनदेखे किए जाते हैं।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers उन publishers के private packages खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin packages में Plugin-only कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन cursor
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, legacy alias `installs`
- `category` (वैकल्पिक): plugin category filter। मौजूदा मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

Legacy v1 filter aliases read endpoints पर स्वीकार किए जाते रहते हैं:

- `mcp-tooling`, `data`, और `automation` `tools` में resolve होते हैं।
- `observability` और `deployment` `gateway` में resolve होते हैं।
- `dev-tools` `runtime` में resolve होता है।

`trending` सात-दिन का install/download leaderboard है और all-time totals का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` endpoint पर यह plugin-only है; skill catalog के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

Legacy aliases stored या author-declared category values के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

offline analysis के लिए नवीनतम public skills का bulk export।

Auth:

- API token आवश्यक है।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds lower bound।
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds upper bound।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले response से pagination cursor।

Response:

- Body: ZIP archive।
- प्रत्येक exported skill `{publisher}/{slug}/` पर rooted होती है।
- Hosted skills में नवीनतम stored version files शामिल होती हैं और उन्हें
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध किया जाता है।
- Current GitHub-backed skills जिनका scan `clean` या `suspicious` है, उनमें
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। इनमें ClawHub-hosted source files शामिल नहीं होतीं।
- प्रत्येक skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP root में शामिल होता है।
- `_errors.json` तब शामिल होता है जब individual skills या files
  export नहीं की जा सकीं।

Headers:

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
- `cursor` (वैकल्पिक): पिछली प्रतिक्रिया से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ दोनों
  Plugin परिवार हैं।

प्रतिक्रिया:

- बॉडी: ZIP आर्काइव।
- प्रत्येक एक्सपोर्ट किया गया Plugin `{family}/{packageName}/` पर रूटेड होता है।
- प्रत्येक एक्सपोर्ट किए गए Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin एक्सपोर्ट मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Plugins या फ़ाइलें एक्सपोर्ट नहीं की जा सकीं।

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

टिप्पणियां:

- `GET /api/v1/plugins` के अंतर्गत प्रलेखित legacy v1 फ़िल्टर aliases भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी digest rows द्वारा समर्थित एक वास्तविक API फ़िल्टर है,
  search-query rewrite नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पेजिनेट नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI sort controls लोड किए गए प्रासंगिकता परिणामों को फिर से क्रमबद्ध करते हैं,
  मौजूदा `/skills` browse व्यवहार से मेल खाते हुए।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

टिप्पणियां:

- Skills unified catalog में इस route के माध्यम से भी resolve हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को सॉफ्ट-डिलीट करता है।

टिप्पणियां:

- पैकेज owner, org publisher owner/admin,
  platform moderator, या platform admin के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

वर्ज़न इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

टिप्पणियां:

- निजी पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, compatibility,
verification, artifact metadata, और scan data सहित एक पैकेज वर्ज़न लौटाता है।

टिप्पणियां:

- `version.artifact.kind` पुराने-world पैकेज archives के लिए `legacy-zip` है या
  ClawPack-backed रिलीज़ के लिए `npm-pack`।
- ClawPack रिलीज़ में npm-compatible `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने clients के लिए deprecated compatibility metadata है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए ठीक ZIP bytes को hash करता है।
  आधुनिक clients को `version.artifact.sha256` का उपयोग करना चाहिए, जो canonical
  release artifact की पहचान करता है।
- scan data मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

install clients के लिए ठीक पैकेज रिलीज़ security और trust summary लौटाता है।
यह तय करने के लिए कि resolved release install की जा सकती है या नहीं, यह सार्वजनिक OpenClaw consumption surface है।

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
- `release.releaseId`, `release.version`, और `release.createdAt` उस ठीक release की पहचान करते हैं
  जिसका मूल्यांकन किया गया था।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` release artifact के लिए ज्ञात होने पर मौजूद होते हैं।
- `trust.scanStatus` scanner inputs और manual release moderation से निकाला गया effective trust status है।
- `trust.moderationState` nullable है। कोई manual release moderation मौजूद न होने पर यह `null` होता है।
- `trust.blockedFromDownload` install block signal है। OpenClaw और अन्य
  install clients को scanner या moderation fields से blocking rules फिर से निकालने के बजाय
  इस value के `true` होने पर installation block करना चाहिए।
- `trust.reasons` user-facing और audit explanation list है। Reason codes
  स्थिर, compact strings हैं जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक trust inputs अभी भी completion की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि trust summary outdated inputs से compute की गई थी और
  high-confidence allow decision से पहले इसे refresh की आवश्यकता के रूप में माना जाना चाहिए।

टिप्पणियां:

- यह endpoint version-exact है। Clients को इसे उस package version को resolve करने के बाद call करना चाहिए
  जिसे वे install करना चाहते हैं, केवल latest package metadata पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।
- यह endpoint owner/moderator moderation endpoints की तुलना में जानबूझकर संकरा है।
  यह install decision और public explanation expose करता है, reporter identities,
  report bodies, private evidence, या internal review timelines नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज वर्ज़न के लिए explicit artifact resolver metadata लौटाता है।

टिप्पणियां:

- Legacy package versions `legacy-zip` artifact और legacy ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack versions `npm-pack` artifact, npm integrity fields,
  `tarballUrl`, और legacy ZIP compatibility URL लौटाते हैं।
- यह OpenClaw resolver surface है; यह shared URL से archive format का अनुमान लगाने से बचता है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

explicit resolver path के माध्यम से version artifact डाउनलोड करता है।

टिप्पणियां:

- ClawPack versions ठीक uploaded npm-pack `.tgz` bytes stream करते हैं।
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

official OpenClaw Plugin migration rows सूचीबद्ध करने के लिए moderator endpoint।

प्रमाणीकरण:

- moderator या admin user के लिए API token आवश्यक है।

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

टिप्पणियां:

- `bundledPluginId` lowercase में normalized होता है और stable upsert key है।
- `packageName` npm-name normalized है; planned migrations के लिए package missing हो सकता है।
- यह केवल migration readiness track करता है। यह OpenClaw को mutate नहीं करता या
  ClawPacks generate नहीं करता।

### `GET /api/v1/packages/moderation/queue`

package release review queues के लिए moderator/admin endpoint।

प्रमाणीकरण:

- moderator या admin user के लिए API token आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

Status meanings:

- `open`: suspicious, malicious, pending, quarantined, revoked, या reported releases।
- `blocked`: quarantined, revoked, या malicious releases।
- `manual`: manual moderation override वाली कोई भी release।
- `all`: manual override, non-clean scan state, या package report वाली कोई भी release।

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

moderator review के लिए पैकेज report करें। Reports package-level होती हैं, वैकल्पिक रूप से
किसी version से linked। वे moderation queue को feed करती हैं लेकिन अपने-आप downloads को hide या
block नहीं करतीं; moderators को artifacts approve, quarantine, या revoke करने के लिए
release moderation का उपयोग करना चाहिए।

प्रमाणीकरण:

- API token आवश्यक है।

Request:

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

पैकेज रिपोर्ट intake के लिए moderator/admin एंडपॉइंट।

प्रमाणीकरण:

- moderator या admin उपयोगकर्ता के लिए API टोकन आवश्यक है।

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

पैकेज moderation visibility के लिए owner/moderator एंडपॉइंट।

प्रमाणीकरण:

- पैकेज owner, publisher member, moderator, या admin उपयोगकर्ता के लिए API टोकन
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

पैकेज रिपोर्ट को resolve या reopen करने के लिए moderator/admin एंडपॉइंट।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open`
पर सेट करते समय इसे छोड़ा जा सकता है। उसी auditable workflow में release moderation
लागू करने के लिए confirmed रिपोर्ट के साथ `finalAction: "quarantine"` या
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

पैकेज release review के लिए moderator/admin एंडपॉइंट।

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित अवस्थाएँ:

- `approved`: मैन्युअल रूप से reviewed और allowed।
- `quarantined`: follow-up लंबित होने तक blocked।
- `revoked`: release के पहले trusted होने के बाद blocked।

Quarantined और revoked releases artifact download routes से `403` लौटाते हैं।
हर बदलाव audit log entry लिखता है।

### `GET /api/v1/packages/{name}/file`

पैकेज फ़ाइल के लिए raw text content लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट latest release है।
- download bucket के बजाय read rate bucket का उपयोग करता है।
- Binary files `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- Pending VirusTotal scans reads को block नहीं करते; malicious releases अभी भी कहीं और withheld हो सकते हैं।
- Private packages `404` लौटाते हैं, जब तक caller owning publisher को read नहीं कर सकता।

### `GET /api/v1/packages/{name}/download`

पैकेज release के लिए legacy deterministic ZIP archive डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट latest release है।
- Skills `GET /api/v1/download` पर redirect करते हैं।
- Plugin/package archives `package/` root वाली zip files हैं ताकि पुराने OpenClaw
  clients काम करते रहें।
- यह route केवल ZIP रहता है। यह ClawPack `.tgz` files stream नहीं करता।
- Responses में resolver integrity checks के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` headers शामिल होते हैं।
- Registry-only metadata downloaded archive में inject नहीं किया जाता।
- Pending VirusTotal scans downloads को block नहीं करते; malicious releases `403` लौटाते हैं।
- Private packages `404` लौटाते हैं, जब तक caller owner न हो।

### `GET /api/npm/{package}`

ClawPack-backed package versions के लिए npm-compatible packument लौटाता है।

नोट्स:

- केवल uploaded ClawPack npm-pack tarballs वाले versions listed होते हैं।
- Legacy ZIP-only versions जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-compatible
  fields का उपयोग करते हैं ताकि users चाहें तो npm को mirror पर point कर सकें।
- Scoped package packuments `/api/npm/@scope/name` और npm के encoded
  `/api/npm/@scope%2Fname` request path, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm mirror clients के लिए exact uploaded ClawPack tarball bytes stream करता है।

नोट्स:

- download rate bucket का उपयोग करता है।
- Download headers में ClawHub SHA-256 और npm integrity/shasum metadata शामिल होते हैं।
- Moderation और private package access checks अभी भी लागू होते हैं।

### `GET /api/v1/resolve`

CLI द्वारा local fingerprint को known version पर map करने के लिए उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): bundle fingerprint का 64-char hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Hosted skill version ZIP डाउनलोड करता है, या current GitHub-backed skill के लिए GitHub source handoff लौटाता है
जिसका `clean` या `suspicious` scan हो और कोई hosted
version न हो।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver string
- `tag` (वैकल्पिक): tag name (जैसे `latest`)

नोट्स:

- अगर `version` और `tag` में से कोई भी प्रदान नहीं किया गया है, तो latest version उपयोग किया जाता है।
- Soft-deleted versions `410` लौटाते हैं।
- GitHub-backed skill handoffs bytes को proxy या mirror नहीं करते। JSON response
  में `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; scan/current state एक gate है और success
  payload metadata के रूप में शामिल नहीं होती।
- Download stats प्रति UTC दिन unique identities के रूप में गिने जाते हैं (`userId` जब API token valid हो, अन्यथा IP)।

## Auth endpoints (Bearer token)

सभी endpoints के लिए आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Token validate करता है और user handle लौटाता है।

### `POST /api/v1/skills`

नया version publish करता है।

- पसंदीदा: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`।
- `files` (storageId-based) वाला JSON body भी accepted है।
- वैकल्पिक payload field: `ownerHandle`। मौजूद होने पर, API उस
  publisher को server-side resolve करता है और actor के पास publisher access होना आवश्यक है।
- वैकल्पिक payload field: `migrateOwner`। `ownerHandle` के साथ `true` होने पर,
  existing skill उस owner पर move हो सकता है अगर actor current और target publishers दोनों पर admin/owner है।
  इस opt-in के बिना, owner changes
  reject किए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin release publish करता है।

- Bearer token auth आवश्यक है।
- `multipart/form-data` आवश्यक है।
- Allowed form fields हैं `payload`, repeated `files` blobs, या एक `clawpack`
  tarball reference। `clawpack` `.tgz` blob या upload-url flow द्वारा लौटाई गई storage id हो सकता है।
  Staged storage-id publishes में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- `files` या `clawpack` में से किसी एक का उपयोग करें, एक ही request में दोनों कभी नहीं।
- JSON bodies और caller-supplied `payload.files` / `payload.artifact`
  metadata reject किए जाते हैं।
- Direct multipart publish requests 18MB पर capped हैं। ClawPack tarballs
  120MB tarball cap तक upload-url flow का उपयोग कर सकते हैं।
- वैकल्पिक payload field: `ownerHandle`। मौजूद होने पर, केवल admins उस owner की ओर से publish कर सकते हैं।

Validation highlights:

- `family` `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin packages के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` uploads में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins के लिए `package.json`, source repo metadata, source commit
  metadata, config schema metadata, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक metadata हैं।
- केवल `openclaw` org publisher और current `openclaw` org members के
  personal publishers `official` channel पर publish कर सकते हैं।
- On-behalf publishes अभी भी target owner account के विरुद्ध official-channel eligibility validate करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

Skill को soft-delete / restore करें (owner, moderator, या admin)।

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill moderation note के रूप में stored होता है और audit log में copied होता है।
Owner-initiated soft deletes slug को 30 दिनों के लिए reserve करते हैं, फिर slug को
another publisher claim कर सकता है। जब यह expiry लागू होती है, delete response में `slugReservedUntil` शामिल होता है।
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

केवल admin। सुनिश्चित करता है कि handle के लिए org publisher मौजूद हो। अगर handle अभी भी
legacy shared user/personal publisher की ओर point करता है, तो endpoint पहले उसे org publisher में migrate करता है।
Newly-created org के लिए, `memberHandle` प्रदान करें; acting admin member के रूप में नहीं जोड़ा जाता।
`memberRole` डिफ़ॉल्ट रूप से `owner` है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authenticated self-serve org publisher creation। नया org publisher बनाता है और
caller को owner के रूप में जोड़ता है। यह endpoint existing user/personal handles को migrate नहीं करता और
publisher को trusted/official mark नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब handle पहले से publisher, user, या personal publisher द्वारा used हो, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल admin। Release publish किए बिना rightful owner के लिए root slugs और package names reserve करता है।
Package names private placeholder packages बन जाते हैं जिनमें कोई release rows नहीं होती, ताकि वही
owner बाद में उस name में real code-plugin या bundle-plugin release publish कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल admin। Convex Auth account rows edit किए बिना verified replacement GitHub OAuth principal के लिए
personal publisher recover करता है। Request में दोनों immutable GitHub
provider account ids नामित होने चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग किए जाते हैं।

यह endpoint डिफ़ॉल्ट रूप से dry-run होता है। recovery लागू करने के लिए staff द्वारा दोनों
GitHub principals के बीच continuity को स्वतंत्र रूप से verify करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब destination user के मौजूदा personal
publisher के पास skills, packages, या GitHub skill sources हों, तो recovery fail closed होती है।
Recovery recovered publisher के skills, skill slug aliases, packages, package inspector warnings,
और derived search digest rows के लिए legacy `ownerUserId` fields भी migrate करती है, ताकि
direct-owner paths नए publisher authority से मेल खाएं। recovered handle के लिए active protected-handle
reservation को भी replacement user को reassign किया जाता है, ताकि बाद की profile synchronization
former user की competing authority को restore न कर सके। प्रत्येक primary table प्रति apply transaction
100 rows तक सीमित है; बड़ी recoveries के लिए पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped हैं और rewrite किए जाने के बजाय checked के रूप में report किए जाते हैं।

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug management endpoints

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

Notes:

- दोनों endpoints को API token auth की आवश्यकता होती है और ये केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में preserve करता है।
- `merge` source listing को hide करता है और source slug को target listing पर redirect करता है।

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

किसी user को ban करें और owned skills को hard-delete करें (केवल moderator/admin)।

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

किसी user को unban करें और eligible skills को restore करें (केवल admin)।

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

unban या content restore किए बिना किसी मौजूदा ban के लिए stored reason बदलें
(केवल admin)। जब तक `dryRun` `false` न हो, dry-run डिफ़ॉल्ट है।

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

Users को list करें या search करें (केवल admin)।

Query params:

- `q` (optional): search query
- `query` (optional): `q` का alias
- `limit` (optional): max results (default 20, max 200)

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

Star (highlights) जोड़ें/हटाएं। दोनों endpoints idempotent हैं।

Responses:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI endpoints (deprecated)

पुराने CLI versions के लिए अभी भी supported:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Removal plan के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` return करता है। जो Package
publishes ClawPack tarball को stage करते हैं, उन्हें resulting storage id को
`clawpack` के रूप में और returned ticket को `clawpackUploadTicket` के रूप में भेजना होगा।

## Registry discovery (`/.well-known/clawhub.json`)

CLI site से registry/auth settings discover कर सकता है:

- `/.well-known/clawhub.json` (JSON, preferred)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो यह file serve करें (या `CLAWHUB_REGISTRY` को स्पष्ट रूप से set करें; legacy `CLAWDHUB_REGISTRY`)।
