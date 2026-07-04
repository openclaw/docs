---
read_when:
    - एंडपॉइंट्स जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डिबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण).
x-i18n:
    generated_at: "2026-07-04T20:31:22Z"
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

## सार्वजनिक कैटलॉग का पुन: उपयोग

तृतीय-पक्ष डायरेक्टरियाँ ClawHub Skills को सूचीबद्ध या खोजने के लिए सार्वजनिक रीड एंडपॉइंट्स का उपयोग कर सकती हैं। कृपया परिणाम कैश करें, `429`/`Retry-After` का सम्मान करें, उपयोगकर्ताओं को कैननिकल ClawHub लिस्टिंग (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और यह संकेत देने से बचें कि ClawHub तृतीय-पक्ष साइट का समर्थन करता है। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन द्वारा अवरुद्ध सामग्री को मिरर करने का प्रयास न करें।

वेब slug शॉर्टकट रजिस्ट्री परिवारों में resolve होते हैं, लेकिन API क्लाइंट्स को route
precedence को फिर से बनाने के बजाय रीड एंडपॉइंट्स द्वारा लौटाए गए कैननिकल URLs का उपयोग करना चाहिए।

## रेट सीमाएँ

लागू करने का मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer token): प्रति उपयोगकर्ता bucket लागू।
- यदि token अनुपस्थित/अमान्य है, तो व्यवहार IP enforcement पर वापस जाता है।
- प्रमाणित write endpoints को bare `Unauthorized` नहीं लौटाना चाहिए जब
  server को कारण पता हो। अनुपस्थित tokens, अमान्य/revoked tokens, और
  deleted/banned/disabled accounts में से प्रत्येक को actionable text मिलना चाहिए ताकि CLI
  clients उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- Read: 3000/min प्रति IP, 12000/min प्रति key
- Write: 300/min प्रति IP, 3000/min प्रति key
- Download: 1200/min प्रति IP, 6000/min प्रति key (download endpoints)

Headers:

- लेगेसी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

Header semantics:

- `X-RateLimit-Reset`: absolute Unix epoch seconds
- `RateLimit-Reset`: reset तक seconds (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर exact remaining budget.
  Sharded सफल requests approximate global value लौटाने के बजाय इस header को omit करते हैं।
- `Retry-After`: `429` पर retry से पहले प्रतीक्षा करने के seconds (delay)

उदाहरण `429` response:

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

- यदि `Retry-After` मौजूद है, तो retry से पहले उतने seconds प्रतीक्षा करें।
- synchronized retries से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` पर fallback करें (या `X-RateLimit-Reset` से compute करें)।

IP source:

- trusted client IP headers, जिनमें `cf-connecting-ip` शामिल है, का उपयोग केवल तब करता है जब
  deployment trusted forwarded headers को स्पष्ट रूप से enable करता है।
- ClawHub edge पर client IPs पहचानने के लिए trusted forwarding headers का उपयोग करता है।
- यदि कोई trusted client IP उपलब्ध नहीं है, तो anonymous requests fallback buckets का उपयोग करते हैं
  जो केवल rate-limit kind द्वारा scoped होते हैं। इन fallback buckets में
  caller-supplied paths, slugs, package names, versions, query strings, या अन्य
  artifact parameters शामिल नहीं होते।

## Error responses

Public v1 error responses `content-type: text/plain; charset=utf-8` के साथ plain text होते हैं।
इसमें validation failures (`400`), missing public resources (`404`), auth और
permission failures (`401`/`403`), rate limits (`429`), और blocked downloads शामिल हैं। Clients
को response body को human-readable string के रूप में पढ़ना चाहिए। Unknown query parameters को
compatibility के लिए ignore किया जाता है, लेकिन invalid values वाले recognized query parameters
`400` लौटाते हैं।

## Public endpoints (auth नहीं)

### `GET /api/v1/search`

Query params:

- `q` (required): query string
- `limit` (optional): integer
- `highlightedOnly` (optional): highlighted Skills तक filter करने के लिए `true`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) Skills छिपाने के लिए `true`
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

- Results relevance order में लौटाए जाते हैं (embedding similarity + exact slug/name token boosts + एक छोटा popularity prior)।
- Relevance popularity से अधिक मजबूत है। precise slug या display-name token match, बहुत अधिक engagement वाले looser match से ऊपर rank कर सकता है।
- ASCII text को word और punctuation boundaries पर tokenize किया जाता है। उदाहरण के लिए, `personal-map` में standalone `map` token होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` होते हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में अधिक मजबूत lexical match मिलता है।
- Popularity log-scaled और capped है। High-engagement Skills lower rank कर सकते हैं जब query text weaker match हो।
- Suspicious या hidden moderation state caller filters और current moderation status के आधार पर किसी Skill को public search से हटा सकता है।

Publisher discoverability guidance:

- वे terms display name, summary, और tags में रखें जिन्हें users सचमुच search करेंगे। standalone slug token का उपयोग केवल तब करें जब वह भी एक stable identity हो जिसे आप बनाए रखना चाहते हैं।
- केवल एक query को chase करने के लिए slug rename न करें, जब तक नया slug बेहतर long-term canonical name न हो। पुराने slugs redirect aliases बन जाते हैं, लेकिन canonical URL, displayed slug, और future search digests नए slug का उपयोग करते हैं।
- Rename aliases पुराने URLs और registry के माध्यम से resolve होने वाले installs के लिए resolution बनाए रखते हैं, लेकिन rename index होने के बाद search ranking canonical Skill metadata पर आधारित होती है। Existing stats Skill के साथ रहती हैं।
- यदि कोई Skill अप्रत्याशित रूप से invisible है, तो ranking-related metadata बदलने से पहले logged in रहते हुए `clawhub inspect @owner/slug` से moderation state पहले जाँचें।

### `GET /api/v1/skills`

Query params:

- `limit` (optional): integer (1–200)
- `cursor` (optional): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (optional): `updated` (default), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर map होते हैं, `trending`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (optional): `nonSuspiciousOnly` के लिए legacy alias

Invalid `sort` values `400` लौटाते हैं।

Notes:

- `recommended` engagement और recency signals का उपयोग करता है।
- `trending` पिछले 7 दिनों में installs के आधार पर rank करता है (telemetry-based)।
- `createdAt` new-skill crawls के लिए stable है; `updated` तब बदलता है जब existing Skills republish होते हैं।
- जब `nonSuspiciousOnly=true` हो, cursor-based sorts किसी page पर `limit` items से कम लौटा सकते हैं क्योंकि suspicious Skills page retrieval के बाद filter होते हैं।
- मौजूद होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। short page अपने आप end-of-results नहीं बताता।

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

- owner rename/merge flows द्वारा बनाए गए पुराने slugs canonical Skill पर resolve होते हैं।
- `metadata.os`: Skill frontmatter में घोषित OS restrictions (जैसे `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix system targets (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि Skill में कोई platform metadata नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब Skill flagged हो या owner उसे देख रहा हो।

### `GET /api/v1/skills/{slug}/moderation`

Structured moderation state लौटाता है।

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

- Owners और moderators hidden Skills के लिए moderation details access कर सकते हैं।
- Public callers को केवल already-flagged visible Skills के लिए `200` मिलता है।
- Evidence public callers के लिए redacted होता है और केवल owners/moderators के लिए raw snippets शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

moderator review के लिए Skill report करें। Reports Skill-level होते हैं, optional रूप से
किसी version से linked होते हैं, और Skill report queue को feed करते हैं।

Auth:

- API token आवश्यक है।

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

Skill report intake के लिए moderator/admin endpoint।

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

Skill reports resolve या reopen करने के लिए moderator/admin endpoint।

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` `confirmed` और `dismissed` के लिए required है; `status` को वापस `open` पर
set करते समय इसे omit किया जा सकता है। triaged report के साथ `finalAction: "hide"` pass करें ताकि
उसी auditable workflow में Skill hide हो जाए।

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (optional): integer
- `cursor` (optional): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

version metadata + files list लौटाता है।

- `version.security` normalized scan verification status और scanner details
  (VirusTotal + LLM) शामिल करता है, जब उपलब्ध हो।

### `GET /api/v1/skills/{slug}/scan`

किसी Skill version के लिए security scan verification details लौटाता है।

Query params:

- `version` (optional): specific version string.
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

Notes:

- यदि `version` या `tag` में से कोई भी प्रदान नहीं किया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति और scanner-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी scanner ने कोई निश्चित verdict (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से लिया गया मौजूदा skill-स्तरीय moderation snapshot है।
- किसी ऐतिहासिक संस्करण को query करते समय, `moderation` और `security` को समान version context मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नए ClawScan jobs के लिए authenticated submit endpoint।

Local upload scans अब supported नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाली requests `410` लौटाती हैं।

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
- Response `202` होता है, जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- Scan jobs asynchronous होते हैं। Manual scan requests को सामान्य publish/backfill work से पहले प्राथमिकता दी जाती है, लेकिन completion फिर भी worker availability पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

Submitted scan के लिए authenticated poll endpoint।

- Queued/running/succeeded/failed status लौटाता है।
- Queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है, ताकि clients दिखा सकें कि request से आगे कितने prioritized manual scans हैं। बहुत बड़ी queues bounded होती हैं और `queuedAheadIsEstimate: true` के साथ report की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` sections शामिल होते हैं।
- Failed scan jobs `lastError` के साथ `status: "failed"` लौटाते हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

Authenticated report archive endpoint।

- Succeeded scan आवश्यक है; non-terminal scans `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` वाली ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Submitted versions के लिए authenticated stored report archive endpoint।

- Skill या Plugin के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- Exact submitted version के लिए stored scan results लौटाता है, जिसमें blocked या hidden versions भी शामिल हैं।
- `kind` default रूप से `skill` होता है; plugin/package scans के लिए `kind=plugin` का उपयोग करें।
- Scan-request downloads जैसी ही ZIP shape लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

Admin-only canonical batch rescan route। यह legacy `POST /api/v1/skills/-/rescan-batch` जैसी ही payload shape स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

Admin-only canonical batch status route। यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate counters लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला Skill Card verification envelope लौटाता है।

Query params:

- `version` (वैकल्पिक): specific version string।
- `tag` (वैकल्पिक): tagged version resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब selected version में generated Skill Card हो, वह moderation द्वारा malware-blocked न हो, और ClawScan verification clean हो।
- Skill identity, publisher identity, और selected version metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं, ताकि shell automation nested wrappers unpack किए बिना उन्हें पढ़ सके।
- `security` top-level ClawScan/security verdict है। Automation को `ok`, `decision`, `reasons`, और `security.status` के आधार पर काम करना चाहिए।
- `security.signals` में supporting scanner evidence जैसे `staticScan`, `virusTotal`, और `skillSpector` शामिल होते हैं।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए retained है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve और store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

Exact skill versions के लिए मौजूदा compact security verdicts लौटाता है। यह
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
- Results per item होते हैं; एक missing skill या version पूरे response को fail नहीं करता।
- Response केवल security-only है। इसमें Skill Card data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं हैं।
- `security.signals` में केवल status-level supporting evidence शामिल होता है; full scanner details के लिए `/scan` या ClawHub security-audit page का उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए retained है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; clients को card content की आवश्यकता होने पर installed `skill-card.md` locally पढ़ना चाहिए।
- जब आपको single-skill Skill Card verification envelope चाहिए तो `/verify` का उपयोग करें, generated card markdown चाहिए तो `/card` का, और detailed scanner data चाहिए तो `/scan` का उपयोग करें।

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

रॉ टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- नवीनतम संस्करण पर डिफ़ॉल्ट होता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग endpoint:

- Skills
- code Plugins
- bundle Plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): pagination cursor
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, legacy alias `installs`
- `category` (वैकल्पिक): Plugin category filter. केवल तब समर्थित जब
  request Plugin packages (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या package endpoints जिनमें
  `family=code-plugin`/`family=bundle-plugin` हो) तक सीमित हो। Controlled categories और
  legacy v1 filter aliases `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात query parameters अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` fixed-family aliases बने रहते हैं।
- Skill entries skill registry से समर्थित रहती हैं और अभी भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अभी भी केवल code-plugin और bundle-plugin releases के लिए है।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers list/search results में उन publishers के private packages देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/packages/search`

Skills + Plugin packages में एकीकृत कैटलॉग search.

क्वेरी पैरामीटर:

- `q` (आवश्यक): query string
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): Plugin category filter. केवल तब समर्थित जब
  request Plugin packages तक सीमित हो। Controlled categories और legacy v1
  filter aliases `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात query parameters अनदेखे किए जाते हैं।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers उन publishers के private packages खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin packages में केवल-Plugin कैटलॉग browse.

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): pagination cursor
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, legacy alias `installs`
- `category` (वैकल्पिक): Plugin category filter. वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Legacy v1 filter aliases read endpoints पर स्वीकार किए जाते रहते हैं:

- `mcp-tooling`, `data`, और `automation` `tools` में resolve होते हैं।
- `observability` और `deployment` `gateway` में resolve होते हैं।
- `dev-tools` `runtime` में resolve होता है।

`trending` सात-दिन का install/download leaderboard है और all-time totals का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` endpoint पर यह केवल-Plugin है; skill catalog के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

Legacy aliases stored या author-declared category values के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

offline analysis के लिए नवीनतम public Skills का bulk export.

Auth:

- API token आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds lower bound.
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds upper bound.
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`.
- `cursor` (वैकल्पिक): पिछले response से pagination cursor.

Response:

- Body: ZIP archive.
- प्रत्येक exported skill `{publisher}/{slug}/` पर rooted होता है।
- Hosted skills में नवीनतम stored version files शामिल होती हैं और उन्हें
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध किया जाता है।
- `clean` या `suspicious` scan वाले वर्तमान GitHub-backed skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। इनमें ClawHub-hosted source files शामिल नहीं होतीं।
- प्रत्येक skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP root पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब individual skills या files
  export नहीं की जा सकीं।

Headers:

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

- `startDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ है दोनों
  Plugin परिवार।

प्रत्युत्तर:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Plugin `{family}/{packageName}/` पर रूट होता है।
- प्रत्येक निर्यातित Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट में शामिल होता है।
- जब अलग-अलग Plugin या फ़ाइलें निर्यात नहीं की जा सकीं, तो `_errors.json` शामिल होता है।

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

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ीकृत पुराने v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी डाइजेस्ट पंक्तियों द्वारा समर्थित वास्तविक API फ़िल्टर है,
  कोई खोज-क्वेरी पुनर्लेखन नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पेजिनेट नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को फिर से क्रमित करते हैं,
  जो वर्तमान `/skills` ब्राउज़ व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

टिप्पणियां:

- Skills एकीकृत कैटलॉग में इस रूट के माध्यम से भी हल हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामित्व रखने वाले प्रकाशक को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को सॉफ़्ट-डिलीट करता है।

टिप्पणियां:

- पैकेज स्वामी, संगठन प्रकाशक स्वामी/एडमिन, प्लेटफ़ॉर्म मॉडरेटर, या प्लेटफ़ॉर्म एडमिन के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

टिप्पणियां:

- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामित्व रखने वाले प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता, सत्यापन, आर्टिफ़ैक्ट मेटाडेटा, और स्कैन डेटा सहित एक पैकेज संस्करण लौटाता है।

टिप्पणियां:

- `version.artifact.kind` पुराने-जगत के पैकेज आर्काइव के लिए `legacy-zip` है या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack`।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए पदावनत संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स को हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैनोनिकल रिलीज़ आर्टिफ़ैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामित्व रखने वाले प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और भरोसा सारांश लौटाता है।
यह यह तय करने के लिए सार्वजनिक OpenClaw उपभोग सतह है कि कोई हल की गई रिलीज़
इंस्टॉल की जा सकती है या नहीं।

प्रमाणीकरण:

- सार्वजनिक पढ़ने वाला एंडपॉइंट। कोई स्वामी, प्रकाशक, मॉडरेटर, या एडमिन टोकन
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

- `package.name`, `package.displayName`, और `package.family` हल किए गए
  रजिस्ट्री पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt`
  मूल्यांकित की गई सटीक रिलीज़ की पहचान करते हैं।
- रिलीज़ आर्टिफ़ैक्ट के लिए ज्ञात होने पर `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैनुअल रिलीज़ मॉडरेशन से व्युत्पन्न प्रभावी भरोसा स्थिति है।
- `trust.moderationState` nullable है। जब कोई मैनुअल रिलीज़
  मॉडरेशन मौजूद नहीं होता, तो यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल अवरोध संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को, स्कैनर या मॉडरेशन फ़ील्ड से अवरोध नियमों को फिर से निकालने के बजाय,
  इस मान के `true` होने पर इंस्टॉलेशन को रोकना चाहिए।
- `trust.reasons` उपयोगकर्ता-सामने और ऑडिट व्याख्या सूची है। कारण कोड
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक भरोसा इनपुट अभी भी पूर्णता की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि भरोसा सारांश पुराने इनपुट से गणना किया गया था और
  उच्च-विश्वास allow निर्णय से पहले इसे रीफ़्रेश आवश्यक माना जाना चाहिए।

टिप्पणियां:

- यह एंडपॉइंट संस्करण-सटीक है। क्लाइंट को इसे उस पैकेज संस्करण को हल करने के बाद कॉल करना चाहिए
  जिसे वे इंस्टॉल करना चाहते हैं, न कि केवल नवीनतम
  पैकेज मेटाडेटा पढ़ने के बाद।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामित्व रखने वाले प्रकाशक को पढ़ नहीं सकता।
- यह एंडपॉइंट जानबूझकर स्वामी/मॉडरेटर मॉडरेशन
  एंडपॉइंट से संकरा है। यह इंस्टॉल निर्णय और सार्वजनिक व्याख्या उजागर करता है,
  रिपोर्टर पहचान, रिपोर्ट बॉडी, निजी साक्ष्य, या आंतरिक समीक्षा
  टाइमलाइन नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफ़ैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

टिप्पणियां:

- लेगेसी पैकेज संस्करण एक `legacy-zip` आर्टिफ़ैक्ट और लेगेसी ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण एक `npm-pack` आर्टिफ़ैक्ट, npm integrity फ़ील्ड, एक
  `tarballUrl`, और लेगेसी ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से
  आर्काइव फ़ॉर्मैट का अनुमान लगाने से बचती है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से संस्करण आर्टिफ़ैक्ट डाउनलोड करता है।

टिप्पणियां:

- ClawPack संस्करण सटीक अपलोड किए गए npm-pack `.tgz` बाइट्स स्ट्रीम करते हैं।
- लेगेसी ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट करते हैं।
- डाउनलोड दर बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw उपभोग के लिए गणना की गई तत्परता लौटाता है।

तत्परता जांचें कवर करती हैं:

- आधिकारिक चैनल स्थिति
- नवीनतम संस्करण उपलब्धता
- ClawPack npm-pack आर्टिफ़ैक्ट उपलब्धता
- आर्टिफ़ैक्ट डाइजेस्ट
- स्रोत रेपो और कमिट उत्पत्ति
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
- यह केवल माइग्रेशन तत्परता को ट्रैक करता है। यह OpenClaw को परिवर्तित नहीं करता या
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

- `open`: संदिग्ध, दुर्भावनापूर्ण, लंबित, क्वारंटीन, निरस्त, या रिपोर्ट की गई रिलीज़।
- `blocked`: क्वारंटीन, निरस्त, या दुर्भावनापूर्ण रिलीज़।
- `manual`: मैनुअल मॉडरेशन ओवरराइड वाली कोई भी रिलीज़।
- `all`: मैनुअल ओवरराइड, non-clean स्कैन स्थिति, या पैकेज रिपोर्ट वाली कोई भी रिलीज़।

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
किसी संस्करण से लिंक की जाती हैं। वे मॉडरेशन कतार को फ़ीड करती हैं लेकिन अपने आप
डाउनलोड को auto-hide या ब्लॉक नहीं करतीं; मॉडरेटर को आर्टिफ़ैक्ट को
स्वीकृत, क्वारंटीन, या निरस्त करने के लिए रिलीज़ मॉडरेशन का उपयोग करना चाहिए।

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

मॉडरेटर/एडमिन endpoint, package report intake के लिए।

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता के लिए API token आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन cursor

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

package moderation दृश्यता के लिए owner/moderator endpoint।

प्रमाणीकरण:

- package owner, publisher member, moderator, या
  admin user के लिए API token आवश्यक है।

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

package reports को resolve या reopen करने के लिए moderator/admin endpoint।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open` पर
सेट करते समय इसे छोड़ा जा सकता है। उसी auditable workflow में release moderation लागू करने के लिए
confirmed report के साथ `finalAction: "quarantine"` या
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

package release review के लिए moderator/admin endpoint।

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित states:

- `approved`: मैन्युअल रूप से review किया गया और अनुमति दी गई।
- `quarantined`: follow-up लंबित रहने तक blocked।
- `revoked`: किसी release के पहले trusted होने के बाद blocked।

Quarantined और revoked releases artifact download routes से `403` लौटाते हैं।
हर बदलाव audit log entry लिखता है।

### `GET /api/v1/packages/{name}/file`

package file के लिए raw text content लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- latest release पर डिफ़ॉल्ट होता है।
- download bucket नहीं, read rate bucket का उपयोग करता है।
- Binary files `415` लौटाती हैं।
- File size limit: 200KB।
- Pending VirusTotal scans reads को block नहीं करते; malicious releases फिर भी कहीं और रोकी जा सकती हैं।
- Private packages `404` लौटाते हैं जब तक caller owning publisher को read नहीं कर सकता।

### `GET /api/v1/packages/{name}/download`

package release के लिए legacy deterministic ZIP archive download करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- latest release पर डिफ़ॉल्ट होता है।
- Skills `GET /api/v1/download` पर redirect करते हैं।
- Plugin/package archives zip files होती हैं जिनमें `package/` root होता है ताकि पुराने OpenClaw
  clients काम करते रहें।
- यह route ZIP-only रहता है। यह ClawPack `.tgz` files stream नहीं करता।
- Responses में resolver integrity checks के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` headers शामिल होते हैं।
- Registry-only metadata downloaded archive में inject नहीं किया जाता।
- Pending VirusTotal scans downloads को block नहीं करते; malicious releases `403` लौटाती हैं।
- Private packages `404` लौटाते हैं जब तक caller owner न हो।

### `GET /api/npm/{package}`

ClawPack-backed package versions के लिए npm-compatible packument लौटाता है।

नोट्स:

- केवल uploaded ClawPack npm-pack tarballs वाले versions listed होते हैं।
- Legacy ZIP-only versions जानबूझकर omitted हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-compatible
  fields का उपयोग करते हैं ताकि users चाहें तो npm को mirror पर point कर सकें।
- Scoped package packuments `/api/npm/@scope/name` और npm के
  encoded `/api/npm/@scope%2Fname` request path, दोनों को support करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm mirror clients के लिए exact uploaded ClawPack tarball bytes stream करता है।

नोट्स:

- download rate bucket का उपयोग करता है।
- Download headers में ClawHub SHA-256 और npm integrity/shasum metadata शामिल होता है।
- Moderation और private package access checks अभी भी लागू होते हैं।

### `GET /api/v1/resolve`

local fingerprint को known version पर map करने के लिए CLI द्वारा उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): bundle fingerprint का 64-char hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

hosted skill version ZIP download करता है, या `clean` या `suspicious` scan और बिना hosted
version वाले current GitHub-backed skill के लिए GitHub source handoff लौटाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver string
- `tag` (वैकल्पिक): tag name (जैसे `latest`)

नोट्स:

- यदि `version` और `tag` में से कोई भी provided नहीं है, तो latest version उपयोग किया जाता है।
- Soft-deleted versions `410` लौटाते हैं।
- GitHub-backed skill handoffs bytes को proxy या mirror नहीं करते। JSON response में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; scan/current state एक gate है और success
  payload metadata के रूप में शामिल नहीं होती।
- Download stats प्रति UTC day unique identities के रूप में counted हैं (`userId` जब API token valid हो, अन्यथा IP)।

## प्रमाणीकरण endpoints (Bearer token)

सभी endpoints को आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

token validate करता है और user handle लौटाता है।

### `POST /api/v1/skills`

नया version publish करता है।

- Preferred: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`।
- `files` (storageId-based) वाला JSON body भी accepted है।
- वैकल्पिक payload field: `ownerHandle`। मौजूद होने पर, API उस
  publisher को server-side resolve करता है और actor के पास publisher access होना आवश्यक है।
- वैकल्पिक payload field: `migrateOwner`। `ownerHandle` के साथ `true` होने पर,
  यदि actor current और target publishers दोनों पर admin/owner है, तो existing skill उस owner पर move हो सकता है।
  इस opt-in के बिना, owner changes
  rejected हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin release publish करता है।

- Bearer token auth आवश्यक है।
- `multipart/form-data` आवश्यक है।
- Allowed form fields हैं `payload`, repeated `files` blobs, या एक `clawpack`
  tarball reference। `clawpack` एक `.tgz` blob या
  upload-url flow द्वारा returned storage id हो सकता है। Staged storage-id publishes में उस upload URL के साथ returned
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- उसी request में `files` या `clawpack` में से एक का उपयोग करें, दोनों का कभी नहीं।
- JSON bodies और caller-supplied `payload.files` / `payload.artifact`
  metadata rejected हैं।
- Direct multipart publish requests 18MB पर capped हैं। ClawPack tarballs
  120MB tarball cap तक upload-url flow का उपयोग कर सकते हैं।
- वैकल्पिक payload field: `ownerHandle`। मौजूद होने पर, केवल admins उस owner की ओर से publish कर सकते हैं।

Validation highlights:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin packages को `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` uploads में
  इसे `package/openclaw.plugin.json` पर contain करना चाहिए।
- Code plugins को `package.json`, source repo metadata, source commit
  metadata, config schema metadata, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक metadata हैं।
- केवल `openclaw` org publisher और current `openclaw` org members के
  personal publishers `official` channel पर publish कर सकते हैं।
- On-behalf publishes अब भी target owner account के विरुद्ध official-channel eligibility validate करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill को soft-delete / restore करें (owner, moderator, या admin)।

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill moderation note के रूप में stored होता है और audit log में copied होता है।
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

Admin-only। किसी handle के लिए org publisher मौजूद होना सुनिश्चित करता है। यदि handle अभी भी
legacy shared user/personal publisher की ओर point करता है, तो endpoint पहले उसे org publisher में migrate करता है।
Newly-created org के लिए, `memberHandle` दें; acting admin को member के रूप में add नहीं किया जाता।
`memberRole` डिफ़ॉल्ट रूप से `owner` होता है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authenticated self-serve org publisher creation। नया org publisher बनाता है और
caller को owner के रूप में add करता है। यह endpoint existing user/personal handles को migrate नहीं करता और
publisher को trusted/official mark नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब handle पहले से किसी publisher, user, या personal publisher द्वारा used हो, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

Admin-only। release publish किए बिना rightful owner के लिए root slugs और package names reserve करता है।
Package names बिना release rows वाले private placeholder packages बन जाते हैं, ताकि वही
owner बाद में real code-plugin या bundle-plugin release को उस name में publish कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

Admin-only। Convex Auth account rows edit किए बिना verified replacement GitHub OAuth principal
के लिए personal publisher recover करता है। Request में दोनों immutable GitHub
provider account ids बताने होंगे; mutable handles केवल operator-facing guard के रूप में used होते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से ड्राई-रन होता है। रिकवरी लागू करने के लिए स्टाफ़ द्वारा दोनों GitHub principals के बीच निरंतरता स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब गंतव्य उपयोगकर्ता के मौजूदा व्यक्तिगत
publisher के पास skills, packages, या GitHub skill sources हों, तो रिकवरी fail closed होती है।
रिकवरी, पुनर्प्राप्त publisher के skills, skill slug aliases, packages, package inspector warnings, और derived search digest rows के लिए legacy `ownerUserId` फ़ील्ड भी माइग्रेट करती है ताकि
direct-owner paths नए publisher authority से मेल खाएँ। पुनर्प्राप्त handle के लिए सक्रिय protected-handle
reservation भी replacement user को फिर से सौंपा जाता है ताकि बाद का
profile synchronization पूर्व उपयोगकर्ता की competing authority को restore न कर सके। प्रत्येक primary table प्रति apply transaction
100 rows तक सीमित है; बड़ी recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped हैं और उन्हें rewrite करने के बजाय checked के रूप में report किया जाता है।

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug management endpoints

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

नोट्स:

- दोनों endpoints के लिए API token auth आवश्यक है और ये केवल skill owner के लिए काम करते हैं।
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

किसी उपयोगकर्ता को unban करें और eligible skills को restore करें (केवल admin)।

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

किसी मौजूदा ban के stored reason को unban किए बिना या
content restore किए बिना बदलें (केवल admin)। जब तक `dryRun` `false` न हो, डिफ़ॉल्ट dry-run होता है।

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

Users की सूची दें या खोजें (केवल admin)।

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

एक star (highlights) जोड़ें/हटाएँ। दोनों endpoints idempotent हैं।

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

removal plan के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। ऐसे Package
publishes जो ClawPack tarball stage करते हैं, उन्हें परिणामी storage id को
`clawpack` के रूप में और लौटाए गए ticket को `clawpackUploadTicket` के रूप में भेजना होगा।

## Registry discovery (`/.well-known/clawhub.json`)

CLI site से registry/auth settings discover कर सकता है:

- `/.well-known/clawhub.json` (JSON, preferred)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो इस file को serve करें (या `CLAWHUB_REGISTRY` explicitly set करें; legacy `CLAWDHUB_REGISTRY`)।
