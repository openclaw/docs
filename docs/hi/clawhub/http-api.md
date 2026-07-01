---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डिबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण).
x-i18n:
    generated_at: "2026-07-01T15:23:25Z"
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

तृतीय-पक्ष निर्देशिकाएं ClawHub skills को सूचीबद्ध करने या खोजने के लिए सार्वजनिक रीड एंडपॉइंट्स का उपयोग कर सकती हैं। कृपया परिणामों को कैश करें, `429`/`Retry-After` का पालन करें, उपयोगकर्ताओं को कैननिकल ClawHub लिस्टिंग (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और तृतीय-पक्ष साइट के लिए ClawHub अनुमोदन का संकेत देने से बचें। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन-ब्लॉक की गई सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट registry families में resolve होते हैं, लेकिन API clients को route
precedence को फिर से बनाने के बजाय read endpoints द्वारा लौटाए गए canonical URLs का उपयोग करना चाहिए।

## दर सीमाएं

Enforcement model:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer token): प्रति user bucket लागू।
- यदि token अनुपस्थित/अमान्य है, तो व्यवहार IP enforcement पर वापस जाता है।
- प्रमाणित write endpoints को bare `Unauthorized` नहीं लौटाना चाहिए जब
  server कारण जानता हो। Missing tokens, invalid/revoked tokens, और
  deleted/banned/disabled accounts में से प्रत्येक को actionable text मिलना चाहिए ताकि CLI
  clients उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- Read: प्रति IP 3000/min, प्रति key 12000/min
- Write: प्रति IP 300/min, प्रति key 3000/min
- Download: प्रति IP 1200/min, प्रति key 6000/min (download endpoints)

Headers:

- लेगेसी संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

Header semantics:

- `X-RateLimit-Reset`: absolute Unix epoch seconds
- `RateLimit-Reset`: reset तक seconds (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर exact remaining budget.
  Sharded successful requests approximate global value लौटाने के बजाय इस header को omit करते हैं।
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

- यदि `Retry-After` मौजूद है, तो retry करने से पहले उतने seconds प्रतीक्षा करें।
- synchronized retries से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` पर fallback करें (या `X-RateLimit-Reset` से compute करें)।

IP source:

- trusted client IP headers, जिसमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब
  deployment स्पष्ट रूप से trusted forwarded headers सक्षम करता है।
- ClawHub edge पर client IPs की पहचान करने के लिए trusted forwarding headers का उपयोग करता है।
- यदि कोई trusted client IP उपलब्ध नहीं है, तो anonymous requests fallback buckets का उपयोग करते हैं
  जो केवल rate-limit kind से scoped होते हैं। इन fallback buckets में
  caller-supplied paths, slugs, package names, versions, query strings, या अन्य
  artifact parameters शामिल नहीं होते।

## त्रुटि responses

सार्वजनिक v1 error responses `content-type: text/plain; charset=utf-8` के साथ plain text हैं।
इसमें validation failures (`400`), missing public resources (`404`), auth और
permission failures (`401`/`403`), rate limits (`429`), और blocked downloads शामिल हैं। Clients
को response body को human-readable string के रूप में पढ़ना चाहिए। Unknown query parameters
संगतता के लिए ignored होते हैं, लेकिन invalid values वाले recognized query parameters
`400` लौटाते हैं।

## सार्वजनिक endpoints (कोई auth नहीं)

### `GET /api/v1/search`

Query params:

- `q` (आवश्यक): query string
- `limit` (वैकल्पिक): integer
- `highlightedOnly` (वैकल्पिक): highlighted skills तक filter करने के लिए `true`
- `nonSuspiciousOnly` (वैकल्पिक): suspicious (`flagged.suspicious`) skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए legacy alias

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

- Results relevance order में लौटाए जाते हैं (embedding similarity + exact slug/name token boosts + small popularity prior).
- Relevance popularity से stronger है। Precise slug या display-name token match, अधिक stronger engagement वाले looser match से ऊपर rank कर सकता है।
- ASCII text को word और punctuation boundaries पर tokenized किया जाता है। उदाहरण के लिए, `personal-map` में standalone `map` token होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` होते हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में stronger lexical match मिलता है।
- Popularity log-scaled और capped है। High-engagement skills कम rank कर सकते हैं जब query text weaker match हो।
- Suspicious या hidden moderation state caller filters और current moderation status के आधार पर किसी skill को public search से हटा सकता है।

Publisher discoverability guidance:

- उन terms को display name, summary, और tags में रखें जिन्हें users सचमुच search करेंगे। Standalone slug token केवल तब उपयोग करें जब वह एक stable identity भी हो जिसे आप रखना चाहते हैं।
- केवल एक query को chase करने के लिए slug rename न करें, जब तक नया slug बेहतर long-term canonical name न हो। पुराने slugs redirect aliases बन जाते हैं, लेकिन canonical URL, displayed slug, और future search digests नया slug उपयोग करते हैं।
- Rename aliases पुराने URLs और registry के माध्यम से resolve होने वाले installs के लिए resolution preserve करते हैं, लेकिन rename indexed होने के बाद search ranking canonical skill metadata पर आधारित होती है। Existing stats skill के साथ रहते हैं।
- यदि कोई skill अप्रत्याशित रूप से invisible है, तो ranking-related metadata बदलने से पहले logged in रहते हुए `clawhub inspect @owner/slug` से moderation state पहले check करें।

### `GET /api/v1/skills`

Query params:

- `limit` (वैकल्पिक): integer (1–200)
- `cursor` (वैकल्पिक): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर map होते हैं, `trending`
- `nonSuspiciousOnly` (वैकल्पिक): suspicious (`flagged.suspicious`) skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए legacy alias

Invalid `sort` values `400` लौटाते हैं।

Notes:

- `recommended` engagement और recency signals का उपयोग करता है।
- `trending` पिछले 7 दिनों में installs के आधार पर rank करता है (telemetry-based).
- `createdAt` new-skill crawls के लिए stable है; `updated` तब बदलता है जब existing skills republished होते हैं।
- जब `nonSuspiciousOnly=true` हो, cursor-based sorts किसी page पर `limit` items से कम लौटा सकते हैं क्योंकि suspicious skills page retrieval के बाद filtered होते हैं।
- मौजूद होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। Short page अपने आप end-of-results नहीं दर्शाता।

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
- `metadata.os`: skill frontmatter में declared OS restrictions (जैसे `["macos"]`, `["linux"]`). declared न होने पर `null`.
- `metadata.systems`: Nix system targets (जैसे `["aarch64-darwin", "x86_64-linux"]`). declared न होने पर `null`.
- यदि skill में कोई platform metadata नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब skill flagged हो या owner उसे देख रहा हो।

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

- Owners और moderators hidden skills के लिए moderation details access कर सकते हैं।
- Public callers को पहले से flagged visible skills के लिए ही `200` मिलता है।
- Evidence public callers के लिए redacted होता है और केवल owners/moderators के लिए raw snippets शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

Moderator review के लिए skill report करें। Reports skill-level हैं, वैकल्पिक रूप से
version से linked हैं, और skill report queue को feed करते हैं।

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

Skill report intake के लिए moderator/admin endpoint.

Query params:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `confirmed`, `dismissed`, या `all`
- `limit` (वैकल्पिक): integer (1-200)
- `cursor` (वैकल्पिक): pagination cursor

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

Skill reports को resolve या reopen करने के लिए moderator/admin endpoint.

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` `confirmed` और `dismissed` के लिए आवश्यक है; `status` को वापस `open` पर
set करते समय इसे omit किया जा सकता है। उसी auditable workflow में skill छिपाने के लिए triaged
report के साथ `finalAction: "hide"` pass करें।

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (वैकल्पिक): integer
- `cursor` (वैकल्पिक): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Version metadata + files list लौटाता है।

- `version.security` में normalized scan verification status और scanner details
  (VirusTotal + LLM), उपलब्ध होने पर, शामिल हैं।

### `GET /api/v1/skills/{slug}/scan`

Skill version के लिए security scan verification details लौटाता है।

Query params:

- `version` (वैकल्पिक): specific version string.
- `tag` (वैकल्पिक): tagged version resolve करें (उदाहरण के लिए `latest`).

Notes:

- यदि न तो `version` और न ही `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग करता है.
- सामान्यीकृत सत्यापन स्थिति और स्कैनर-विशिष्ट विवरण शामिल करता है.
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निश्चित निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो.
- `moderation` नवीनतम संस्करण से प्राप्त मौजूदा स्किल-स्तरीय मॉडरेशन स्नैपशॉट है.
- किसी ऐतिहासिक संस्करण को क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें.

### `POST /api/v1/skills/-/scan`

नए ClawScan जॉब के लिए प्रमाणित सबमिट endpoint.

स्थानीय अपलोड स्कैन अब समर्थित नहीं हैं. `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले अनुरोध `410` लौटाते हैं.

प्रकाशित स्कैन JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- स्कैन अनुरोध payloads और डाउनलोड करने योग्य रिपोर्ट retention window के बाद scan-request store से समाप्त हो जाते हैं.
- प्रकाशित स्कैन के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है.
- प्रकाशित स्कैन केवल तब वापस लिखते हैं जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो.
- प्रतिक्रिया `202` होती है, `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` के साथ.
- स्कैन जॉब asynchronous होते हैं. मैनुअल स्कैन अनुरोधों को सामान्य publish/backfill कार्य से पहले प्राथमिकता दी जाती है, लेकिन completion अब भी worker availability पर निर्भर करता है.

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणित poll endpoint.

- queued/running/succeeded/failed स्थिति लौटाता है.
- queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है ताकि clients दिखा सकें कि अनुरोध से आगे कितने prioritized manual scans हैं. बहुत बड़ी queues bounded होती हैं और `queuedAheadIsEstimate: true` के साथ रिपोर्ट की जाती हैं.
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` sections होते हैं.
- विफल scan jobs `lastError` के साथ `status: "failed"` लौटाते हैं.

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणित report archive endpoint.

- सफल scan आवश्यक है; non-terminal scans `409` लौटाते हैं.
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है.

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए versions के लिए प्रमाणित stored report archive endpoint.

- skill या Plugin के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है.
- exact submitted version के stored scan results लौटाता है, जिनमें blocked या hidden versions शामिल हैं.
- `kind` का default `skill` है; plugin/package scans के लिए `kind=plugin` का उपयोग करें.
- scan-request downloads जैसा ही ZIP आकार लौटाता है.

### `POST /api/v1/skills/-/scan/batch`

Admin-only canonical batch rescan route. यह legacy `POST /api/v1/skills/-/rescan-batch` जैसा ही payload shape स्वीकार करता है.

### `POST /api/v1/skills/-/scan/batch/status`

Admin-only canonical batch status route. यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate counters लौटाता है.

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया गया Skill Card verification envelope लौटाता है.

Query params:

- `version` (optional): specific version string.
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`).

नोट्स:

- `ok` केवल तब `true` होता है जब selected version के पास generated Skill Card हो, वह moderation द्वारा malware-blocked न हो, और ClawScan verification clean हो.
- Skill identity, publisher identity, और selected version metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि shell automation उन्हें nested wrappers unpack किए बिना पढ़ सके.
- `security` top-level ClawScan/security verdict है. Automation को `ok`, `decision`, `reasons`, और `security.status` के आधार पर key करना चाहिए.
- `security.signals` में supporting scanner evidence होता है, जैसे `staticScan`, `virusTotal`, और `skillSpector`.
- `security.signals.dependencyRegistry` v1 response compatibility के लिए retained है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है.
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve और store किया हो; अन्यथा यह `unavailable` होता है.

### `POST /api/v1/skills/-/security-verdicts`

exact skill versions के लिए current compact security verdicts लौटाता है. यह collection endpoint उन clients के लिए है जिन्हें पहले से पता है कि उन्हें कौन से installed ClawHub skill versions दिखाने हैं, जैसे OpenClaw Control UI.

Request:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

नोट्स:

- `items` में 1-100 unique `{ slug, version }` pairs होने चाहिए.
- Results प्रति item होते हैं; एक missing skill या version पूरी response को fail नहीं करता.
- response केवल security-only है. इसमें Skill Card data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं हैं.
- `security.signals` में केवल status-level supporting evidence होता है; full scanner details के लिए `/scan` या ClawHub security-audit page का उपयोग करें.
- `security.signals.dependencyRegistry` v1 response compatibility के लिए retained है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है.
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; जब clients को card content चाहिए, उन्हें installed `skill-card.md` locally पढ़ना चाहिए.
- जब आपको single-skill Skill Card verification envelope चाहिए तो `/verify`, generated card markdown चाहिए तो `/card`, और detailed scanner data चाहिए तो `/scan` का उपयोग करें.

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

- नवीनतम संस्करण पर डिफ़ॉल्ट होता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग endpoint:

- skills
- कोड plugins
- बंडल plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन cursor
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, legacy alias `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin packages तक सीमित हो (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले package endpoints)। नियंत्रित श्रेणियां और
  legacy v1 फ़िल्टर alias `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` fixed-family aliases बने रहते हैं।
- Skill entries skill registry द्वारा समर्थित रहती हैं और अभी भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अभी भी केवल code-plugin और bundle-plugin रिलीज़ के लिए है।
- अनाम callers केवल सार्वजनिक package channels देखते हैं।
- प्रमाणित callers list/search परिणामों में उन publishers के private packages देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें प्रमाणित caller पढ़ सकता है।

### `GET /api/v1/packages/search`

skills + plugin packages में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी string
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin packages तक सीमित हो। नियंत्रित श्रेणियां और legacy v1
  फ़िल्टर aliases `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- अनाम callers केवल सार्वजनिक package channels देखते हैं।
- प्रमाणित callers उन publishers के private packages खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें प्रमाणित caller पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin packages में Plugin-only कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन cursor
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, legacy alias `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Legacy v1 फ़िल्टर aliases read endpoints पर स्वीकार किए जाते रहेंगे:

- `mcp-tooling`, `data`, और `automation` `tools` में resolve होते हैं।
- `observability` और `deployment` `gateway` में resolve होते हैं।
- `dev-tools` `runtime` में resolve होता है।

`trending` सात-दिन का install/download leaderboard है और all-time totals का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` endpoint पर यह plugin-only है; skill कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

Legacy aliases संग्रहीत या लेखक-घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक skills का bulk export।

Auth:

- API token आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds निचली सीमा।
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले response से pagination cursor।

Response:

- Body: ZIP archive।
- हर exported skill `{publisher}/{slug}/` पर rooted है।
- Hosted skills में latest stored version files शामिल होती हैं और उन्हें
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ listed किया जाता है।
- `clean` या `suspicious` scan वाली current GitHub-backed skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। इनमें ClawHub-hosted source files शामिल नहीं होतीं।
- हर skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP root में शामिल होता है।
- `_errors.json` तब शामिल होता है जब individual skills या files export नहीं किए जा सके।

Headers:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Plugin रिलीज़ का थोक निर्यात।

प्रामाणीकरण:

- API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़ने का अर्थ दोनों
  Plugin परिवार हैं।

प्रत्युत्तर:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Plugin `{family}/{packageName}/` पर रूटेड होता है।
- प्रत्येक निर्यातित Plugin में नवीनतम रिलीज़ की संग्रहित फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहित होता है।
- `_manifest.json` हमेशा ZIP रूट में शामिल होता है।
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

नोट्स:

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित legacy v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी digest पंक्तियों द्वारा समर्थित वास्तविक API
  फ़िल्टर है, search-query rewrite नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पेजिनेट नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI sort controls लोड किए गए प्रासंगिकता परिणामों को
  पुनःक्रमित करते हैं, जो मौजूदा `/skills` browse व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट्स:

- Skills unified catalog में इस रूट के माध्यम से भी resolve हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर owning publisher को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को soft-delete करता है।

नोट्स:

- पैकेज owner, org publisher owner/admin, platform moderator, या platform admin के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

नोट्स:

- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, compatibility, verification, artifact metadata, और scan data सहित एक पैकेज संस्करण लौटाता है।

नोट्स:

- `version.artifact.kind` old-world package archives के लिए `legacy-zip` या
  ClawPack-backed रिलीज़ के लिए `npm-pack` होता है।
- ClawPack रिलीज़ में npm-compatible `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने clients के लिए deprecated compatibility metadata है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP bytes को hash करता है।
  आधुनिक clients को `version.artifact.sha256` का उपयोग करना चाहिए, जो canonical
  release artifact की पहचान करता है।
- scan data मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

install clients के लिए सटीक पैकेज रिलीज़ सुरक्षा और trust summary लौटाता है। यह यह तय करने के लिए सार्वजनिक OpenClaw consumption surface है कि कोई
resolved release install की जा सकती है या नहीं।

प्रामाणीकरण:

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

- `package.name`, `package.displayName`, और `package.family` resolved registry package की
  पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt` उस सटीक रिलीज़ की
  पहचान करते हैं जिसका मूल्यांकन किया गया।
- रिलीज़ artifact के लिए ज्ञात होने पर `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` मौजूद होते हैं।
- `trust.scanStatus` scanner inputs और manual release moderation से derived प्रभावी trust status है।
- `trust.moderationState` nullable है। manual release
  moderation मौजूद न होने पर यह `null` होता है।
- `trust.blockedFromDownload` install block signal है। OpenClaw और अन्य
  install clients को scanner या moderation fields से blocking rules दोबारा derive करने के बजाय
  यह मान `true` होने पर installation block करनी चाहिए।
- `trust.reasons` user-facing और audit explanation list है। Reason codes
  स्थिर, compact strings हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक trust inputs अभी completion की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि trust summary outdated inputs से computed थी और
  high-confidence allow decision से पहले इसे refresh की आवश्यकता के रूप में माना जाना चाहिए।

नोट्स:

- यह endpoint version-exact है। Clients को जिस package version को वे install करना चाहते हैं, उसे resolve करने के बाद इसे call करना चाहिए, केवल latest
  package metadata पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर owning publisher को पढ़ नहीं सकता।
- यह endpoint owner/moderator moderation
  endpoints से जानबूझकर संकरा है। यह install decision और public explanation को expose करता है, reporter identities, report bodies, private evidence, या internal review
  timelines को नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट artifact resolver metadata लौटाता है।

नोट्स:

- Legacy package versions एक `legacy-zip` artifact और legacy ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack versions एक `npm-pack` artifact, npm integrity fields, एक
  `tarballUrl`, और legacy ZIP compatibility URL लौटाते हैं।
- यह OpenClaw resolver surface है; यह shared URL से archive format का अनुमान लगाने से बचता है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट resolver path के माध्यम से version artifact डाउनलोड करता है।

नोट्स:

- ClawPack versions सटीक uploaded npm-pack `.tgz` bytes stream करते हैं।
- Legacy ZIP versions `/api/v1/packages/{name}/download?version=` पर redirect करते हैं।
- download rate bucket का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw consumption के लिए computed readiness लौटाता है।

Readiness checks कवर करते हैं:

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

प्रामाणीकरण:

- moderator या admin user के लिए API token आवश्यक है।

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

official Plugin migration row बनाने या अपडेट करने के लिए admin endpoint।

प्रामाणीकरण:

- admin user के लिए API token आवश्यक है।

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

- `bundledPluginId` lowercase में normalized होता है और stable upsert key है।
- `packageName` npm-name normalized है; planned
  migrations के लिए पैकेज missing हो सकता है।
- यह केवल migration readiness track करता है। यह OpenClaw को mutate नहीं करता या
  ClawPacks generate नहीं करता।

### `GET /api/v1/packages/moderation/queue`

package release review queues के लिए moderator/admin endpoint।

प्रामाणीकरण:

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

moderator review के लिए पैकेज report करें। Reports package-level होते हैं, वैकल्पिक रूप से
किसी version से linked। वे moderation queue को feed करते हैं लेकिन स्वयं downloads को auto-hide या
block नहीं करते; moderators को artifacts approve, quarantine, या revoke करने के लिए release moderation का उपयोग करना चाहिए।

प्रामाणीकरण:

- API token आवश्यक है।

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

पैकेज रिपोर्ट इनटेक के लिए मॉडरेटर/एडमिन एंडपॉइंट।

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

पैकेज मॉडरेशन दृश्यता के लिए ओनर/मॉडरेटर एंडपॉइंट।

प्रमाणीकरण:

- पैकेज ओनर, पब्लिशर सदस्य, मॉडरेटर, या एडमिन उपयोगकर्ता के लिए API टोकन
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

पैकेज रिपोर्ट हल करने या फिर से खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open`
पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट-योग्य वर्कफ़्लो में रिलीज़
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
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित अवस्थाएँ:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई।
- `quarantined`: फ़ॉलो-अप लंबित होने तक ब्लॉक किया गया।
- `revoked`: किसी रिलीज़ को पहले भरोसेमंद मानने के बाद ब्लॉक किया गया।

क्वारंटीन और निरस्त रिलीज़ आर्टिफैक्ट डाउनलोड रूट से `403` लौटाती हैं।
हर बदलाव एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

पैकेज फ़ाइल के लिए रॉ टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- डाउनलोड बकेट नहीं, रीड रेट बकेट का उपयोग करता है।
- बाइनरी फ़ाइलें `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal स्कैन रीड को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ फिर भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी पब्लिशर को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/download`

पैकेज रिलीज़ के लिए लेगेसी नियतात्मक ZIP आर्काइव डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- Skills `GET /api/v1/download` पर रीडायरेक्ट होती हैं।
- Plugin/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें होती हैं ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह रूट केवल ZIP रहता है। यह ClawPack `.tgz` फ़ाइलें स्ट्रीम नहीं करता।
- प्रतिक्रियाओं में रिज़ॉल्वर इंटेग्रिटी जाँचों के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल-रजिस्ट्री मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर ओनर न हो।

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

npm मिरर क्लाइंट के लिए ठीक वही अपलोड किए गए ClawPack टारबॉल बाइट्स स्ट्रीम करता है।

टिप्पणियाँ:

- डाउनलोड रेट बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 और npm इंटेग्रिटी/shasum मेटाडेटा शामिल होता है।
- मॉडरेशन और निजी पैकेज एक्सेस जाँचें अब भी लागू होती हैं।

### `GET /api/v1/resolve`

CLI द्वारा स्थानीय फ़िंगरप्रिंट को ज्ञात संस्करण से मैप करने के लिए उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): बंडल फ़िंगरप्रिंट का 64-अक्षरीय hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

होस्ट किया गया skill संस्करण ZIP डाउनलोड करता है, या मौजूदा GitHub-समर्थित skill के लिए
GitHub स्रोत हैंडऑफ़ लौटाता है, जिसके पास `clean` या `suspicious` स्कैन हो और कोई होस्ट किया गया
संस्करण न हो।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (जैसे `latest`)

टिप्पणियाँ:

- यदि न `version` और न `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग होता है।
- सॉफ्ट-डिलीट किए गए संस्करण `410` लौटाते हैं।
- GitHub-समर्थित skill हैंडऑफ़ बाइट्स को प्रॉक्सी या मिरर नहीं करते। JSON प्रतिक्रिया में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; स्कैन/वर्तमान अवस्था एक गेट है और सफलता
  पेलोड मेटाडेटा के रूप में शामिल नहीं होती।
- डाउनलोड आँकड़े प्रति UTC दिन अद्वितीय पहचान के रूप में गिने जाते हैं (API टोकन मान्य होने पर `userId`, अन्यथा IP)।

## प्रमाणीकरण एंडपॉइंट (बेयरर टोकन)

सभी एंडपॉइंट के लिए आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन मान्य करता है और उपयोगकर्ता हैंडल लौटाता है।

### `POST /api/v1/skills`

नया संस्करण प्रकाशित करता है।

- पसंदीदा: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`।
- `files` (storageId-आधारित) वाला JSON body भी स्वीकार किया जाता है।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, API उस
  पब्लिशर को सर्वर-साइड रिज़ॉल्व करता है और अभिनेता के पास पब्लिशर एक्सेस होना आवश्यक करता है।
- वैकल्पिक पेलोड फ़ील्ड: `migrateOwner`। `ownerHandle` के साथ `true` होने पर,
  मौजूदा skill उस ओनर के पास जा सकती है यदि अभिनेता वर्तमान और लक्ष्य, दोनों
  पब्लिशर पर एडमिन/ओनर है। इस ऑप्ट-इन के बिना, ओनर बदलाव
  अस्वीकार किए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है।

- Bearer टोकन प्रमाणीकरण आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत फ़ॉर्म फ़ील्ड `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  टारबॉल संदर्भ हैं। `clawpack` `.tgz` blob या upload-url फ़्लो द्वारा लौटाई गई
  storage id हो सकता है। स्टेज्ड storage-id पब्लिश में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- एक ही अनुरोध में या तो `files` या `clawpack` उपयोग करें, दोनों कभी नहीं।
- JSON bodies और कॉलर-द्वारा दिए गए `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार किए जाते हैं।
- डायरेक्ट multipart publish अनुरोध 18MB तक सीमित हैं। ClawPack टारबॉल
  upload-url फ़्लो का उपयोग 120MB टारबॉल सीमा तक कर सकते हैं।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, केवल एडमिन उस ओनर की ओर से प्रकाशित कर सकते हैं।

मान्यकरण मुख्य बिंदु:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin पैकेजों के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` अपलोड में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins के लिए `package.json`, स्रोत repo मेटाडेटा, स्रोत commit
  मेटाडेटा, config schema मेटाडेटा, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` org पब्लिशर और मौजूदा `openclaw` org सदस्यों के
  निजी पब्लिशर `official` चैनल पर प्रकाशित कर सकते हैं।
- ऑन-बहाफ पब्लिश अभी भी लक्ष्य ओनर खाते के विरुद्ध official-channel पात्रता मान्य करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill को सॉफ्ट-डिलीट / पुनर्स्थापित करें (ओनर, मॉडरेटर, या एडमिन)।

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill मॉडरेशन नोट के रूप में संग्रहीत होता है और ऑडिट लॉग में कॉपी किया जाता है।
ओनर-आरंभित सॉफ्ट डिलीट slug को 30 दिनों के लिए आरक्षित रखते हैं, फिर slug को
दूसरा पब्लिशर दावा कर सकता है। यह समाप्ति लागू होने पर delete प्रतिक्रिया में `slugReservedUntil` शामिल होता है।
मॉडरेटर/एडमिन छिपाने और सुरक्षा हटाने इस तरह समाप्त नहीं होते।

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

केवल एडमिन। किसी हैंडल के लिए org पब्लिशर मौजूद होना सुनिश्चित करता है। यदि हैंडल अभी भी
लेगेसी साझा उपयोगकर्ता/निजी पब्लिशर की ओर इंगित करता है, तो एंडपॉइंट पहले उसे org पब्लिशर में माइग्रेट करता है।
नए बनाए गए org के लिए, `memberHandle` दें; कार्यरत एडमिन को सदस्य के रूप में नहीं जोड़ा जाता।
`memberRole` डिफ़ॉल्ट रूप से `owner` होता है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

प्रमाणीकृत self-serve org पब्लिशर निर्माण। नया org पब्लिशर बनाता है और
कॉलर को ओनर के रूप में जोड़ता है। यह एंडपॉइंट मौजूदा उपयोगकर्ता/निजी हैंडल माइग्रेट नहीं करता और
पब्लिशर को trusted/official के रूप में चिह्नित नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब हैंडल पहले से किसी पब्लिशर, उपयोगकर्ता, या निजी पब्लिशर द्वारा उपयोग किया जा रहा हो, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल एडमिन। रिलीज़ प्रकाशित किए बिना सही ओनर के लिए रूट slugs और पैकेज नाम आरक्षित करता है।
पैकेज नाम बिना रिलीज़ rows वाले निजी placeholder पैकेज बन जाते हैं, ताकि वही
ओनर बाद में वास्तविक code-plugin या bundle-plugin रिलीज़ उस नाम में प्रकाशित कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल एडमिन। Convex Auth account rows संपादित किए बिना सत्यापित replacement GitHub OAuth principal
के लिए निजी पब्लिशर पुनर्प्राप्त करता है। अनुरोध में दोनों immutable GitHub
provider account ids का नाम होना चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग होते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से dry-run होता है। रिकवरी लागू करने के लिए स्टाफ द्वारा दोनों GitHub principals के बीच निरंतरता को स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब गंतव्य उपयोगकर्ता के वर्तमान व्यक्तिगत
publisher के पास skills, packages, या GitHub skill sources हों, तो रिकवरी fail closed होती है।
रिकवरी, recovered publisher के skills,
skill slug aliases, packages, package inspector warnings, और derived search digest rows के लिए legacy `ownerUserId` फ़ील्ड भी माइग्रेट करती है, ताकि
direct-owner paths नए publisher authority से मेल खाएँ। recovered handle के लिए सक्रिय protected-handle
reservation भी replacement user को पुनः असाइन किया जाता है, ताकि बाद में
profile synchronization पूर्व उपयोगकर्ता की competing authority को restore न कर सके। प्रत्येक primary table प्रति apply transaction
100 rows तक सीमित है; बड़ी recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped हैं और rewrite किए जाने के बजाय checked के रूप में रिपोर्ट किए जाते हैं।

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug management endpoints

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

टिप्पणियाँ:

- दोनों endpoints को API token auth की आवश्यकता होती है और ये केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` source listing को छिपाता है और source slug को target listing पर redirect करता है।

### स्वामित्व स्थानांतरण endpoints

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

किसी मौजूदा ban के लिए stored reason को unban किए बिना या
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

उपयोगकर्ता role बदलें (केवल admin)।

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

उपयोगकर्ताओं को list या search करें (केवल admin)।

Query params:

- `q` (optional): search query
- `query` (optional): `q` के लिए alias
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

star (highlights) जोड़ें/हटाएँ। दोनों endpoints idempotent हैं।

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

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। जो Package
publishes ClawPack tarball stage करते हैं, उन्हें resulting storage id को
`clawpack` के रूप में और returned ticket को `clawpackUploadTicket` के रूप में भेजना होगा।

## Registry discovery (`/.well-known/clawhub.json`)

CLI site से registry/auth settings discover कर सकता है:

- `/.well-known/clawhub.json` (JSON, preferred)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो यह file serve करें (या `CLAWHUB_REGISTRY` को explicit रूप से set करें; legacy `CLAWDHUB_REGISTRY`)।
