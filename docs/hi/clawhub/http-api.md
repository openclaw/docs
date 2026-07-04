---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण)।
x-i18n:
    generated_at: "2026-07-04T10:38:56Z"
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

## सार्वजनिक कैटलॉग पुनः उपयोग

तृतीय-पक्ष निर्देशिकाएं ClawHub Skills को सूचीबद्ध या खोजने के लिए सार्वजनिक read endpoints का उपयोग कर सकती हैं। कृपया परिणाम cache करें, `429`/`Retry-After` का सम्मान करें, उपयोगकर्ताओं को canonical ClawHub listing (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस link करें, और तृतीय-पक्ष site के लिए ClawHub समर्थन का संकेत देने से बचें। सार्वजनिक API surface के बाहर छिपी, निजी, या moderation-blocked सामग्री को mirror करने का प्रयास न करें।

Web slug shortcuts registry families में resolve होते हैं, लेकिन API clients को route
precedence फिर से बनाने के बजाय read endpoints द्वारा लौटाए गए canonical URLs का
उपयोग करना चाहिए।

## Rate limits

Enforcement model:

- Anonymous requests: प्रति IP enforce किए जाते हैं।
- Authenticated requests (valid Bearer token): प्रति user bucket enforce किए जाते हैं।
- यदि token missing/invalid है, तो behavior IP enforcement पर fall back करता है।
- Authenticated write endpoints को bare `Unauthorized` नहीं लौटाना चाहिए जब
  server कारण जानता हो। Missing tokens, invalid/revoked tokens, और
  deleted/banned/disabled accounts को actionable text मिलना चाहिए ताकि CLI
  clients users को बता सकें कि उन्हें क्या blocked कर रहा है।

- Read: प्रति IP 3000/min, प्रति key 12000/min
- Write: प्रति IP 300/min, प्रति key 3000/min
- Download: प्रति IP 1200/min, प्रति key 6000/min (download endpoints)

Headers:

- Legacy compatibility: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- Standardized: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

Header semantics:

- `X-RateLimit-Reset`: absolute Unix epoch seconds
- `RateLimit-Reset`: reset तक seconds (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर exact remaining budget.
  Sharded successful requests approximate global value लौटाने के बजाय इस header को omit करते हैं।
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

- Trusted client IP headers, जिनमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब
  deployment trusted forwarded headers को स्पष्ट रूप से enable करता है।
- ClawHub edge पर client IPs की पहचान करने के लिए trusted forwarding headers का उपयोग करता है।
- यदि कोई trusted client IP उपलब्ध नहीं है, तो anonymous requests fallback buckets का उपयोग करते हैं
  जो केवल rate-limit kind द्वारा scoped होते हैं। इन fallback buckets में
  caller-supplied paths, slugs, package names, versions, query strings, या अन्य
  artifact parameters शामिल नहीं होते।

## Error responses

Public v1 error responses `content-type: text/plain; charset=utf-8` के साथ plain text होते हैं।
इसमें validation failures (`400`), missing public resources (`404`), auth और
permission failures (`401`/`403`), rate limits (`429`), और blocked downloads शामिल हैं। Clients को
response body को human-readable string के रूप में पढ़ना चाहिए। Unknown query parameters
compatibility के लिए ignored होते हैं, लेकिन invalid values वाले recognized query parameters
`400` लौटाते हैं।

## Public endpoints (no auth)

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

- Results relevance order में लौटाए जाते हैं (embedding similarity + exact slug/name token boosts + छोटा popularity prior)।
- Relevance popularity से stronger है। Precise slug या display-name token match, बहुत अधिक engagement वाले looser match से ऊपर rank कर सकता है।
- ASCII text को word और punctuation boundaries पर tokenize किया जाता है। उदाहरण के लिए, `personal-map` में standalone `map` token है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में stronger lexical match मिलता है।
- Popularity log-scaled और capped है। High-engagement Skills lower rank कर सकते हैं जब query text weaker match हो।
- Suspicious या hidden moderation state, caller filters और current moderation status के आधार पर किसी Skill को public search से remove कर सकता है।

Publisher discoverability guidance:

- जिन terms को users सचमुच search करेंगे, उन्हें display name, summary, और tags में डालें। Standalone slug token केवल तब उपयोग करें जब वह stable identity भी हो जिसे आप बनाए रखना चाहते हैं।
- केवल किसी एक query का पीछा करने के लिए slug rename न करें, जब तक नया slug बेहतर long-term canonical name न हो। Old slugs redirect aliases बन जाते हैं, लेकिन canonical URL, displayed slug, और future search digests नए slug का उपयोग करते हैं।
- Rename aliases old URLs और registry के माध्यम से resolve होने वाले installs के लिए resolution preserve करते हैं, लेकिन search ranking rename indexed होने के बाद canonical Skill metadata पर आधारित होती है। Existing stats Skill के साथ रहते हैं।
- यदि कोई Skill unexpectedly invisible है, तो ranking-related metadata बदलने से पहले logged in रहते हुए `clawhub inspect @owner/slug` से moderation state पहले check करें।

### `GET /api/v1/skills`

Query params:

- `limit` (optional): integer (1–200)
- `cursor` (optional): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (optional): `updated` (default), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` map to `downloads`, `trending`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (optional): `nonSuspiciousOnly` के लिए legacy alias

Invalid `sort` values `400` लौटाते हैं।

Notes:

- `recommended` engagement और recency signals का उपयोग करता है।
- `trending` पिछले 7 दिनों के installs के आधार पर rank करता है (telemetry-based)।
- `createdAt` new-Skill crawls के लिए stable है; `updated` existing Skills republish होने पर बदलता है।
- जब `nonSuspiciousOnly=true` होता है, cursor-based sorts किसी page पर `limit` से कम items लौटा सकते हैं क्योंकि suspicious Skills page retrieval के बाद filter किए जाते हैं।
- मौजूद होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। Short page अपने आप end-of-results का मतलब नहीं है।

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

- Owner rename/merge flows द्वारा बनाए गए old slugs canonical Skill पर resolve होते हैं।
- `metadata.os`: Skill frontmatter में declared OS restrictions (e.g. `["macos"]`, `["linux"]`)। Declared न होने पर `null`।
- `metadata.systems`: Nix system targets (e.g. `["aarch64-darwin", "x86_64-linux"]`)। Declared न होने पर `null`।
- यदि Skill में कोई platform metadata नहीं है, तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब Skill flagged हो या owner इसे देख रहा हो।

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

Moderator review के लिए Skill report करें। Reports Skill-level हैं, optionally
version से linked हैं, और Skill report queue को feed करते हैं।

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

`note` `confirmed` और `dismissed` के लिए required है; `status` को वापस `open` set करते समय इसे omit किया जा सकता है। उसी auditable workflow में Skill छिपाने के लिए triaged
report के साथ `finalAction: "hide"` pass करें।

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (optional): integer
- `cursor` (optional): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Version metadata + files list लौटाता है।

- उपलब्ध होने पर, `version.security` में normalized scan verification status और scanner details
  (VirusTotal + LLM) शामिल होते हैं।

### `GET /api/v1/skills/{slug}/scan`

Skill version के लिए security scan verification details लौटाता है।

Query params:

- `version` (optional): specific version string.
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

Notes:

- यदि `version` या `tag` में से कोई भी नहीं दिया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति और स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निर्णायक verdict (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से निकला मौजूदा skill-स्तरीय moderation snapshot है।
- किसी ऐतिहासिक संस्करण को क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

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
- Response `202` होता है जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- Scan jobs asynchronous होते हैं। Manual scan requests को सामान्य publish/backfill work से पहले प्राथमिकता दी जाती है, लेकिन completion फिर भी worker availability पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

Submitted scan के लिए authenticated poll endpoint।

- queued/running/succeeded/failed status लौटाता है।
- Queued होने पर `queue.queuedAhead` और `queue.position` लौटाता है ताकि clients दिखा सकें कि request से आगे कितने prioritized manual scans हैं। बहुत बड़ी queues को bounded किया जाता है और `queuedAheadIsEstimate: true` के साथ report किया जाता है।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` sections होते हैं।
- Failed scan jobs `lastError` के साथ `status: "failed"` लौटाते हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

Authenticated report archive endpoint।

- Succeeded scan आवश्यक है; non-terminal scans `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

Submitted versions के लिए authenticated stored report archive endpoint।

- Skill या plugin के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- Exact submitted version के लिए stored scan results लौटाता है, जिसमें blocked या hidden versions भी शामिल हैं।
- `kind` का default `skill` है; plugin/package scans के लिए `kind=plugin` का उपयोग करें।
- Scan-request downloads जैसी ही ZIP shape लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

Admin-only canonical batch rescan route। यह legacy `POST /api/v1/skills/-/rescan-batch` जैसी ही payload shape स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

Admin-only canonical batch status route। यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate counters लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला Skill Card verification envelope लौटाता है।

Query params:

- `version` (optional): विशिष्ट version string।
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब selected version में generated Skill Card हो, moderation द्वारा malware-blocked न हो, और ClawScan verification clean हो।
- Skill identity, publisher identity, और selected version metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि shell automation nested wrappers unpack किए बिना उन्हें पढ़ सके।
- `security` top-level ClawScan/security verdict है। Automation को `ok`, `decision`, `reasons`, और `security.status` पर key करना चाहिए।
- `security.signals` में supporting scanner evidence होती है, जैसे `staticScan`, `virusTotal`, और `skillSpector`।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए बनाए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve और store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

Exact skill versions के लिए current compact security verdicts लौटाता है। यह
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
- Results per item होते हैं; एक missing skill या version पूरी response को fail नहीं करता।
- Response security-only है। इसमें Skill Card data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं हैं।
- `security.signals` में केवल status-level supporting evidence होती है; full scanner details के लिए `/scan` या ClawHub security-audit page का उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए बनाए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; clients को card content की आवश्यकता होने पर installed `skill-card.md` को locally पढ़ना चाहिए।
- जब आपको single-skill Skill Card verification envelope चाहिए तो `/verify` का उपयोग करें, generated card markdown चाहिए तो `/card` का, और detailed scanner data चाहिए तो `/scan` का।

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

कच्ची पाठ्य सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- नवीनतम संस्करण पर डिफ़ॉल्ट होता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग एंडपॉइंट:

- skills
- code plugins
- bundle plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, पुराना उपनाम `installs`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध Plugin पैकेजों (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले पैकेज एंडपॉइंट) तक सीमित हो। नियंत्रित श्रेणियाँ और
  पुराने v1 फ़िल्टर उपनाम `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` निश्चित-परिवार उपनाम बने रहते हैं।
- Skill प्रविष्टियाँ Skill रजिस्ट्री द्वारा समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के ज़रिए प्रकाशित की जा सकती हैं।
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
  अनुरोध Plugin पैकेजों तक सीमित हो। नियंत्रित श्रेणियाँ और पुराने v1
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
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, पुराना उपनाम `installs`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

पुराने v1 फ़िल्टर उपनाम रीड एंडपॉइंट पर स्वीकार किए जाते रहते हैं:

- `mcp-tooling`, `data`, और `automation` `tools` में हल होते हैं।
- `observability` और `deployment` `gateway` में हल होते हैं।
- `dev-tools` `runtime` में हल होता है।

`trending` सात-दिन का इंस्टॉल/डाउनलोड लीडरबोर्ड है और सर्वकालिक कुल का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` एंडपॉइंट पर यह केवल-Plugin है; Skill कैटलॉग के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

पुराने उपनाम संग्रहीत या लेखक-घोषित श्रेणी मानों के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम सार्वजनिक Skills का थोक निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): Skill `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर से पेजिनेशन कर्सर।

प्रत्युत्तर:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Skill `{publisher}/{slug}/` पर रूटेड है।
- होस्टेड Skills में नवीनतम संग्रहीत संस्करण फ़ाइलें शामिल होती हैं और
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ सूचीबद्ध होती हैं।
- `clean` या `suspicious` स्कैन वाली वर्तमान GitHub-समर्थित Skills में
  `sourceRef: "public-github"` के साथ `_source_handoff.json`, रेपो, कमिट, पाथ,
  सामग्री हैश, और आर्काइव URL शामिल होते हैं। इनमें ClawHub-होस्टेड स्रोत फ़ाइलें शामिल नहीं होतीं।
- प्रत्येक Skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- जब अलग-अलग Skills या फ़ाइलें निर्यात नहीं की जा सकीं, तो `_errors.json` शामिल होता है।

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

- `startDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड निम्न सीमा।
- `endDate` (आवश्यक): Plugin `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले उत्तर से पृष्ठांकन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ है दोनों
  Plugin परिवार।

उत्तर:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Plugin `{family}/{packageName}/` पर रूट होता है।
- प्रत्येक निर्यातित Plugin में नवीनतम रिलीज़ की संग्रहित फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहित होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Plugins या फ़ाइलें
  निर्यात नहीं की जा सकीं।

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

- `GET /api/v1/plugins` के अंतर्गत दस्तावेजीकृत लेगसी v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी डाइजेस्ट पंक्तियों पर आधारित वास्तविक API फ़िल्टर है,
  खोज-क्वेरी पुनर्लेखन नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पृष्ठांकित नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को फिर से क्रमबद्ध करते हैं,
  जो वर्तमान `/skills` ब्राउज़ व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

टिप्पणियां:

- Skills एकीकृत कैटलॉग में इस रूट से भी रिज़ॉल्व हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को सॉफ़्ट-डिलीट करता है।

टिप्पणियां:

- पैकेज स्वामी, संगठन प्रकाशक स्वामी/प्रशासक,
  प्लेटफ़ॉर्म मॉडरेटर, या प्लेटफ़ॉर्म प्रशासक के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

टिप्पणियां:

- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता,
सत्यापन, आर्टिफ़ैक्ट मेटाडेटा और स्कैन डेटा सहित एक पैकेज संस्करण लौटाता है।

टिप्पणियां:

- `version.artifact.kind` पुराने पैकेज आर्काइव के लिए `legacy-zip` या
  ClawPack-आधारित रिलीज़ के लिए `npm-pack` होता है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स को हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैननिकल रिलीज़ आर्टिफ़ैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और भरोसा सारांश लौटाता है।
यह यह तय करने के लिए सार्वजनिक OpenClaw उपभोग सतह है कि
रिज़ॉल्व की गई रिलीज़ इंस्टॉल की जा सकती है या नहीं।

प्रमाणीकरण:

- सार्वजनिक रीड एंडपॉइंट। किसी स्वामी, प्रकाशक, मॉडरेटर, या प्रशासक टोकन की
  आवश्यकता नहीं है।

उत्तर:

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

उत्तर फ़ील्ड:

- `package.name`, `package.displayName`, और `package.family` रिज़ॉल्व किए गए
  रजिस्ट्री पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt` उस
  सटीक रिलीज़ की पहचान करते हैं जिसका मूल्यांकन किया गया।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफ़ैक्ट के लिए
  ज्ञात होने पर मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैनुअल रिलीज़ मॉडरेशन से निकली
  प्रभावी भरोसा स्थिति है।
- `trust.moderationState` nullable है। जब कोई मैनुअल रिलीज़
  मॉडरेशन मौजूद नहीं होता, तो यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल ब्लॉक संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को यह मान `true` होने पर इंस्टॉलेशन ब्लॉक करना चाहिए, बजाय
  स्कैनर या मॉडरेशन फ़ील्ड से ब्लॉकिंग नियम फिर से निकालने के।
- `trust.reasons` उपयोगकर्ता-सामने और ऑडिट स्पष्टीकरण सूची है। कारण कोड
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक भरोसा इनपुट अभी भी पूर्ण होने की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि भरोसा सारांश पुराने इनपुट से गणना किया गया था और
  उच्च-विश्वास अनुमति निर्णय से पहले इसे रीफ़्रेश आवश्यक माना जाना चाहिए।

टिप्पणियां:

- यह एंडपॉइंट संस्करण-सटीक है। क्लाइंट को इसे उस पैकेज संस्करण को रिज़ॉल्व करने के बाद कॉल करना चाहिए
  जिसे वे इंस्टॉल करना चाहते हैं, केवल नवीनतम
  पैकेज मेटाडेटा पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।
- यह एंडपॉइंट जानबूझकर स्वामी/मॉडरेटर मॉडरेशन
  एंडपॉइंट से अधिक संकीर्ण है। यह इंस्टॉल निर्णय और सार्वजनिक स्पष्टीकरण उजागर करता है,
  रिपोर्टर पहचान, रिपोर्ट बॉडी, निजी साक्ष्य, या आंतरिक समीक्षा
  समयरेखाएं नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफ़ैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

टिप्पणियां:

- लेगसी पैकेज संस्करण `legacy-zip` आर्टिफ़ैक्ट और लेगसी ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण `npm-pack` आर्टिफ़ैक्ट, npm इंटीग्रिटी फ़ील्ड,
  `tarballUrl`, और लेगसी ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से
  आर्काइव प्रारूप का अनुमान लगाने से बचाता है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से संस्करण आर्टिफ़ैक्ट डाउनलोड करता है।

टिप्पणियां:

- ClawPack संस्करण सटीक अपलोड किए गए npm-pack `.tgz` बाइट्स स्ट्रीम करते हैं।
- लेगसी ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट करते हैं।
- डाउनलोड दर बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw उपभोग के लिए गणना की गई तत्परता लौटाता है।

तत्परता जांचों में शामिल हैं:

- आधिकारिक चैनल स्थिति
- नवीनतम संस्करण उपलब्धता
- ClawPack npm-pack आर्टिफ़ैक्ट उपलब्धता
- आर्टिफ़ैक्ट डाइजेस्ट
- स्रोत रिपो और कमिट उद्गम
- OpenClaw संगतता मेटाडेटा
- होस्ट लक्ष्य
- स्कैन स्थिति

उत्तर:

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

आधिकारिक OpenClaw Plugin माइग्रेशन पंक्तियां सूचीबद्ध करने के लिए मॉडरेटर एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या प्रशासक उपयोगकर्ता के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `phase` (वैकल्पिक): `planned`, `published`, `clawpack-ready`,
  `legacy-zip-only`, `metadata-ready`, `blocked`, `ready-for-openclaw`, या
  `all` (डिफ़ॉल्ट)।
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

उत्तर:

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

आधिकारिक Plugin माइग्रेशन पंक्ति बनाने या अपडेट करने के लिए प्रशासक एंडपॉइंट।

प्रमाणीकरण:

- प्रशासक उपयोगकर्ता के लिए API टोकन आवश्यक है।

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

- `bundledPluginId` को lowercase में सामान्यीकृत किया जाता है और यह स्थिर upsert कुंजी है।
- `packageName` npm-name सामान्यीकृत है; नियोजित
  माइग्रेशन के लिए पैकेज अनुपस्थित हो सकता है।
- यह केवल माइग्रेशन तत्परता ट्रैक करता है। यह OpenClaw को परिवर्तित नहीं करता या
  ClawPacks जनरेट नहीं करता।

### `GET /api/v1/packages/moderation/queue`

पैकेज रिलीज़ समीक्षा कतारों के लिए मॉडरेटर/प्रशासक एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या प्रशासक उपयोगकर्ता के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन कर्सर

स्थिति अर्थ:

- `open`: संदिग्ध, दुर्भावनापूर्ण, लंबित, क्वारंटीन, निरस्त, या रिपोर्ट की गई रिलीज़।
- `blocked`: क्वारंटीन, निरस्त, या दुर्भावनापूर्ण रिलीज़।
- `manual`: मैनुअल मॉडरेशन ओवरराइड वाली कोई भी रिलीज़।
- `all`: मैनुअल ओवरराइड, गैर-क्लीन स्कैन स्थिति, या पैकेज रिपोर्ट वाली कोई भी रिलीज़।

उत्तर:

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
किसी संस्करण से जुड़ी होती हैं। वे मॉडरेशन कतार को फ़ीड करती हैं, लेकिन स्वयं
डाउनलोड को स्वतः छिपाती या ब्लॉक नहीं करतीं; मॉडरेटर को रिलीज़ मॉडरेशन का उपयोग
आर्टिफ़ैक्ट को स्वीकृत, क्वारंटीन, या निरस्त करने के लिए करना चाहिए।

प्रमाणीकरण:

- API टोकन आवश्यक है।

अनुरोध:

```json
{ "reason": "Suspicious native binary", "version": "1.2.3" }
```

उत्तर:

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

पैकेज रिपोर्ट ग्रहण के लिए मॉडरेटर/व्यवस्थापक एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या व्यवस्थापक उपयोगकर्ता के लिए API टोकन आवश्यक है।

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

- पैकेज स्वामी, प्रकाशक सदस्य, मॉडरेटर, या व्यवस्थापक उपयोगकर्ता के लिए API
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

पैकेज रिपोर्टों को हल करने या फिर से खोलने के लिए मॉडरेटर/व्यवस्थापक एंडपॉइंट।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस
`open` पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट योग्य वर्कफ़्लो में
रिलीज़ मॉडरेशन लागू करने के लिए पुष्ट रिपोर्ट के साथ `finalAction: "quarantine"` या
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

पैकेज रिलीज़ समीक्षा के लिए मॉडरेटर/व्यवस्थापक एंडपॉइंट।

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित अवस्थाएँ:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई।
- `quarantined`: फ़ॉलो-अप लंबित रहने तक अवरुद्ध।
- `revoked`: किसी रिलीज़ पर पहले भरोसा किए जाने के बाद अवरुद्ध।

क्वारंटीन की गई और निरस्त की गई रिलीज़ आर्टिफ़ैक्ट डाउनलोड रूट से `403` लौटाती हैं।
हर बदलाव एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

किसी पैकेज फ़ाइल के लिए कच्ची टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- नवीनतम रिलीज़ पर डिफ़ॉल्ट करता है।
- डाउनलोड बकेट नहीं, रीड रेट बकेट का उपयोग करता है।
- बाइनरी फ़ाइलें `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal स्कैन पढ़ने को अवरुद्ध नहीं करते; हानिकारक रिलीज़ फिर भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/download`

किसी पैकेज रिलीज़ के लिए लेगेसी निर्धारक ZIP आर्काइव डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

टिप्पणियाँ:

- नवीनतम रिलीज़ पर डिफ़ॉल्ट करता है।
- Skills `GET /api/v1/download` पर रीडायरेक्ट होते हैं।
- प्लगइन/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें हैं ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह रूट केवल ZIP रहता है। यह ClawPack `.tgz` फ़ाइलों को स्ट्रीम नहीं करता।
- प्रतिक्रियाओं में रिज़ॉल्वर अखंडता जाँचों के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल-रजिस्ट्री मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड अवरुद्ध नहीं करते; हानिकारक रिलीज़ `403` लौटाती हैं।
- निजी पैकेज `404` लौटाते हैं जब तक कॉलर स्वामी नहीं है।

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत पैक्यूमेंट लौटाता है।

टिप्पणियाँ:

- केवल अपलोड किए गए ClawPack npm-pack टारबॉल वाले संस्करण सूचीबद्ध किए जाते हैं।
- लेगेसी केवल-ZIP संस्करण जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत
  फ़ील्ड का उपयोग करते हैं ताकि उपयोगकर्ता चाहें तो npm को मिरर की ओर इंगित कर सकें।
- स्कोप्ड पैकेज पैक्यूमेंट `/api/npm/@scope/name` और npm के
  एन्कोड किए गए `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm मिरर क्लाइंट के लिए सटीक अपलोड किए गए ClawPack टारबॉल बाइट्स स्ट्रीम करता है।

टिप्पणियाँ:

- डाउनलोड रेट बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 के साथ npm integrity/shasum मेटाडेटा शामिल होता है।
- मॉडरेशन और निजी पैकेज पहुँच जाँचें अब भी लागू होती हैं।

### `GET /api/v1/resolve`

CLI द्वारा किसी स्थानीय फ़िंगरप्रिंट को ज्ञात संस्करण से मैप करने के लिए उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): बंडल फ़िंगरप्रिंट का 64-वर्ण hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

होस्टेड कौशल संस्करण ZIP डाउनलोड करता है, या `clean` या `suspicious` स्कैन वाले और बिना होस्टेड
संस्करण वाले वर्तमान GitHub-समर्थित कौशल के लिए GitHub स्रोत हैंडऑफ़ लौटाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (जैसे `latest`)

टिप्पणियाँ:

- यदि न `version` और न `tag` दिया गया है, तो नवीनतम संस्करण उपयोग किया जाता है।
- सॉफ़्ट-डिलीट किए गए संस्करण `410` लौटाते हैं।
- GitHub-समर्थित कौशल हैंडऑफ़ बाइट्स को प्रॉक्सी या मिरर नहीं करते। JSON प्रतिक्रिया
  में `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; स्कैन/वर्तमान अवस्था एक गेट है और सफलता
  पेलोड मेटाडेटा के रूप में शामिल नहीं होती।
- डाउनलोड आँकड़े प्रति UTC दिन अद्वितीय पहचान के रूप में गिने जाते हैं (API टोकन मान्य होने पर `userId`, अन्यथा IP)।

## प्रमाणीकरण एंडपॉइंट (Bearer टोकन)

सभी एंडपॉइंट को यह चाहिए:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन सत्यापित करता है और उपयोगकर्ता हैंडल लौटाता है।

### `POST /api/v1/skills`

नया संस्करण प्रकाशित करता है।

- प्राथमिकता: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`।
- `files` (storageId-आधारित) वाला JSON body भी स्वीकार किया जाता है।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, API उस
  प्रकाशक को सर्वर-साइड रिज़ॉल्व करता है और अभिनेता के पास प्रकाशक पहुँच होना आवश्यक करता है।
- वैकल्पिक पेलोड फ़ील्ड: `migrateOwner`। `ownerHandle` के साथ `true` होने पर, कोई
  मौजूदा कौशल उस स्वामी पर जा सकता है यदि अभिनेता वर्तमान और लक्ष्य, दोनों
  प्रकाशकों पर व्यवस्थापक/स्वामी है। इस ऑप्ट-इन के बिना, स्वामी बदलाव
  अस्वीकार कर दिए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है।

- Bearer टोकन प्रमाणीकरण आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत फ़ॉर्म फ़ील्ड हैं `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  टारबॉल संदर्भ। `clawpack` `.tgz` blob या upload-url फ़्लो द्वारा लौटाई गई storage id
  हो सकती है। स्टेज किए गए storage-id प्रकाशनों में उस अपलोड URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- या तो `files` उपयोग करें या `clawpack`, एक ही अनुरोध में दोनों कभी नहीं।
- JSON bodies और कॉलर द्वारा दिए गए `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार किए जाते हैं।
- प्रत्यक्ष multipart प्रकाशन अनुरोध 18MB पर सीमित हैं। ClawPack टारबॉल
  120MB टारबॉल सीमा तक upload-url फ़्लो का उपयोग कर सकते हैं।
- वैकल्पिक पेलोड फ़ील्ड: `ownerHandle`। मौजूद होने पर, केवल व्यवस्थापक उस स्वामी की ओर से प्रकाशित कर सकते हैं।

सत्यापन मुख्य बातें:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- प्लगइन पैकेजों के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` अपलोड में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins के लिए `package.json`, स्रोत repo मेटाडेटा, स्रोत commit
  मेटाडेटा, config schema मेटाडेटा, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` org प्रकाशक और वर्तमान `openclaw` org सदस्यों के
  व्यक्तिगत प्रकाशक `official` चैनल पर प्रकाशित कर सकते हैं।
- ऑन-बहाफ प्रकाशन फिर भी लक्ष्य स्वामी खाते के विरुद्ध official-channel पात्रता सत्यापित करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

किसी कौशल को सॉफ़्ट-डिलीट / पुनर्स्थापित करें (स्वामी, मॉडरेटर, या व्यवस्थापक)।

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` कौशल मॉडरेशन नोट के रूप में संग्रहीत होता है और ऑडिट लॉग में कॉपी किया जाता है।
स्वामी-आरंभित सॉफ़्ट डिलीट slug को 30 दिनों के लिए आरक्षित रखते हैं, फिर slug को
दूसरा प्रकाशक दावा कर सकता है। जब यह समाप्ति लागू होती है, delete प्रतिक्रिया में `slugReservedUntil` शामिल होता है।
मॉडरेटर/व्यवस्थापक छिपाव और सुरक्षा हटाव इस तरह समाप्त नहीं होते।

Delete प्रतिक्रिया:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

स्थिति कोड:

- `200`: ठीक
- `401`: अनधिकृत
- `403`: निषिद्ध
- `404`: कौशल/उपयोगकर्ता नहीं मिला
- `500`: आंतरिक सर्वर त्रुटि

### `POST /api/v1/users/publisher`

केवल व्यवस्थापक। सुनिश्चित करता है कि किसी हैंडल के लिए org प्रकाशक मौजूद है। यदि हैंडल अब भी
लेगेसी साझा उपयोगकर्ता/व्यक्तिगत प्रकाशक की ओर इशारा करता है, तो एंडपॉइंट पहले उसे org प्रकाशक में माइग्रेट करता है।
नव-निर्मित org के लिए, `memberHandle` दें; कार्यरत व्यवस्थापक सदस्य के रूप में नहीं जोड़ा जाता।
`memberRole` का डिफ़ॉल्ट `owner` है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

प्रमाणित self-serve org प्रकाशक निर्माण। नया org प्रकाशक बनाता है और
कॉलर को स्वामी के रूप में जोड़ता है। यह एंडपॉइंट मौजूदा उपयोगकर्ता/व्यक्तिगत हैंडल माइग्रेट नहीं करता और
प्रकाशक को trusted/official चिह्नित नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब हैंडल पहले से किसी प्रकाशक, उपयोगकर्ता, या व्यक्तिगत प्रकाशक द्वारा उपयोग किया जा रहा हो तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल व्यवस्थापक। रिलीज़ प्रकाशित किए बिना किसी वैध स्वामी के लिए रूट slugs और पैकेज नाम आरक्षित करता है।
पैकेज नाम बिना release rows वाले निजी placeholder packages बन जाते हैं, ताकि वही
स्वामी बाद में वास्तविक code-plugin या bundle-plugin रिलीज़ उस नाम में प्रकाशित कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल व्यवस्थापक। Convex Auth account rows को संपादित किए बिना सत्यापित प्रतिस्थापन GitHub OAuth principal
के लिए व्यक्तिगत प्रकाशक पुनर्प्राप्त करता है। अनुरोध में दोनों अपरिवर्तनीय GitHub
provider account ids का नाम होना चाहिए; परिवर्तनीय हैंडल केवल operator-facing guard के रूप में उपयोग किए जाते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से dry-run पर होता है। रिकवरी लागू करने के लिए `dryRun: false` और
`confirmIdentityVerified: true` की आवश्यकता होती है, जब स्टाफ़ दोनों
GitHub principals के बीच continuity को स्वतंत्र रूप से सत्यापित कर लें। जब गंतव्य उपयोगकर्ता के मौजूदा personal
publisher के पास skills, packages, या GitHub skill sources हों, तो रिकवरी fail closed होती है।
रिकवरी recovered publisher के skills,
skill slug aliases, packages, package inspector warnings, और derived search digest rows के लिए legacy `ownerUserId` फ़ील्ड भी migrate करती है ताकि
direct-owner paths नए publisher authority से मेल खाएँ। recovered handle के लिए active protected-handle
reservation भी replacement user को फिर से असाइन किया जाता है ताकि बाद की
profile synchronization पूर्व उपयोगकर्ता की competing authority को restore न कर सके। प्रत्येक primary table
प्रति apply transaction 100 rows तक bounded है; बड़ी recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped होते हैं और rewrite किए जाने के बजाय checked के रूप में reported होते हैं।

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

- दोनों endpoints को API token auth की आवश्यकता होती है और ये केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में संरक्षित रखता है।
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

Unban किए या content restore किए बिना मौजूदा ban के लिए stored reason बदलें
(केवल admin)। जब तक `dryRun` `false` न हो, डिफ़ॉल्ट dry-run है।

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

पुराने CLI versions के लिए अभी भी supported:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Removal plan के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। Package
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
