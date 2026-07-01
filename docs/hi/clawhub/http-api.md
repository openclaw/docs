---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण).
x-i18n:
    generated_at: "2026-07-01T20:19:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

मूल URL: `https://clawhub.ai` (डिफ़ॉल्ट).

सभी v1 पथ `/api/v1/...` के अंतर्गत हैं।
पुराने `/api/...` और `/api/cli/...` संगतता के लिए बने रहते हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`.

## सार्वजनिक कैटलॉग पुनः उपयोग

तृतीय-पक्ष निर्देशिकाएं ClawHub कौशलों को सूचीबद्ध या खोजने के लिए सार्वजनिक रीड एंडपॉइंट का उपयोग कर सकती हैं। कृपया परिणाम कैश करें, `429`/`Retry-After` का सम्मान करें, उपयोगकर्ताओं को कैननिकल ClawHub सूची (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और यह संकेत देने से बचें कि ClawHub तृतीय-पक्ष साइट का समर्थन करता है। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन-द्वारा-अवरुद्ध सामग्री को मिरर करने का प्रयास न करें।

वेब slug शॉर्टकट registry families में resolve होते हैं, लेकिन API क्लाइंट को route precedence
दोबारा बनाने के बजाय read endpoints द्वारा लौटाए गए कैननिकल URLs का उपयोग करना चाहिए।

## दर सीमाएं

लागू करने का मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer token): प्रति user bucket लागू।
- यदि token अनुपस्थित/अमान्य है, तो व्यवहार वापस IP enforcement पर चला जाता है।
- प्रमाणित write endpoints को केवल `Unauthorized` नहीं लौटाना चाहिए जब
  server कारण जानता हो। अनुपस्थित tokens, अमान्य/निरस्त tokens, और
  हटाए गए/प्रतिबंधित/अक्षम खातों में से प्रत्येक को कार्रवाई योग्य text मिलना चाहिए ताकि CLI
  clients उपयोगकर्ताओं को बता सकें कि उन्हें किसने रोका।

- Read: 3000/min प्रति IP, 12000/min प्रति key
- Write: 300/min प्रति IP, 3000/min प्रति key
- Download: 1200/min प्रति IP, 6000/min प्रति key (download endpoints)

Headers:

- Legacy संगतता: `X-RateLimit-Limit`, `X-RateLimit-Reset`
- मानकीकृत: `RateLimit-Limit`, `RateLimit-Reset`
- `429` पर: `X-RateLimit-Remaining: 0` और `RateLimit-Remaining: 0`
- `429` पर: `Retry-After`

Header semantics:

- `X-RateLimit-Reset`: पूर्ण Unix epoch seconds
- `RateLimit-Reset`: reset तक seconds (delay)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: उपस्थित होने पर ठीक बचा हुआ budget.
  Sharded सफल अनुरोध approximate global value लौटाने के बजाय इस header को छोड़ देते हैं।
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

Client मार्गदर्शन:

- यदि `Retry-After` मौजूद है, तो retry से पहले उतने seconds प्रतीक्षा करें।
- synchronized retries से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` पर fallback करें (या `X-RateLimit-Reset` से compute करें)।

IP स्रोत:

- trusted client IP headers, जिसमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब
  deployment स्पष्ट रूप से trusted forwarded headers सक्षम करता है।
- ClawHub edge पर client IPs की पहचान के लिए trusted forwarding headers का उपयोग करता है।
- यदि कोई trusted client IP उपलब्ध नहीं है, तो anonymous requests fallback buckets का उपयोग करते हैं
  जो केवल rate-limit kind द्वारा scoped होते हैं। इन fallback buckets में
  caller-supplied paths, slugs, package names, versions, query strings, या अन्य
  artifact parameters शामिल नहीं होते।

## Error responses

Public v1 error responses `content-type: text/plain; charset=utf-8` के साथ plain text होते हैं।
इसमें validation failures (`400`), missing public resources (`404`), auth और
permission failures (`401`/`403`), rate limits (`429`), और blocked downloads शामिल हैं। Clients को
response body को human-readable string के रूप में पढ़ना चाहिए। Unknown query parameters को
संगतता के लिए ignore किया जाता है, लेकिन invalid values वाले recognized query parameters
`400` लौटाते हैं।

## सार्वजनिक endpoints (auth नहीं)

### `GET /api/v1/search`

Query params:

- `q` (required): query string
- `limit` (optional): integer
- `highlightedOnly` (optional): highlighted skills तक filter करने के लिए `true`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) skills छिपाने के लिए `true`
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
- Relevance popularity से अधिक मजबूत है। एक precise slug या display-name token match, बहुत stronger engagement वाले looser match से ऊपर rank कर सकता है।
- ASCII text को word और punctuation boundaries पर tokenize किया जाता है। उदाहरण के लिए, `personal-map` में standalone `map` token होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` होते हैं; इसलिए `map` खोजने पर `personal-map` को `amap-jsapi-skill` की तुलना में stronger lexical match मिलता है।
- Popularity log-scaled और capped है। query text का match कमजोर होने पर high-engagement skills lower rank कर सकते हैं।
- Suspicious या hidden moderation state, caller filters और current moderation status के आधार पर किसी skill को public search से हटा सकता है।

Publisher discoverability guidance:

- display name, summary, और tags में वे terms डालें जिन्हें users सचमुच search करेंगे। standalone slug token का उपयोग केवल तब करें जब वह एक stable identity भी हो जिसे आप रखना चाहते हैं।
- केवल एक query को chase करने के लिए slug rename न करें, जब तक नया slug बेहतर long-term canonical name न हो। पुराने slugs redirect aliases बन जाते हैं, लेकिन canonical URL, displayed slug, और future search digests नया slug उपयोग करते हैं।
- Rename aliases पुराने URLs और registry के माध्यम से resolve होने वाले installs के लिए resolution सुरक्षित रखते हैं, लेकिन search ranking rename index होने के बाद canonical skill metadata पर आधारित होती है। Existing stats skill के साथ रहते हैं।
- यदि कोई skill अप्रत्याशित रूप से invisible है, तो ranking-related metadata बदलने से पहले logged in रहते हुए `clawhub inspect @owner/slug` से moderation state पहले check करें।

### `GET /api/v1/skills`

Query params:

- `limit` (optional): integer (1–200)
- `cursor` (optional): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (optional): `updated` (default), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` map to `downloads`, `trending`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) skills छिपाने के लिए `true`
- `nonSuspicious` (optional): `nonSuspiciousOnly` के लिए legacy alias

Invalid `sort` values `400` लौटाते हैं।

Notes:

- `recommended` engagement और recency signals का उपयोग करता है।
- `trending` पिछले 7 दिनों के installs के आधार पर rank करता है (telemetry-based)।
- `createdAt` new-skill crawls के लिए stable है; existing skills republish होने पर `updated` बदलता है।
- जब `nonSuspiciousOnly=true` होता है, तो cursor-based sorts किसी page पर `limit` items से कम लौटा सकते हैं क्योंकि suspicious skills page retrieval के बाद filtered होते हैं।
- उपस्थित होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। Short page अपने आप end-of-results नहीं बताता।

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

- owner rename/merge flows द्वारा बनाए गए पुराने slugs canonical skill पर resolve होते हैं।
- `metadata.os`: skill frontmatter में घोषित OS restrictions (उदा. `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix system targets (उदा. `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि skill में कोई platform metadata नहीं है तो `metadata` `null` होता है।
- `moderation` केवल तब शामिल होता है जब skill flagged हो या owner उसे देख रहा हो।

### `GET /api/v1/skills/{slug}/moderation`

संरचित moderation state लौटाता है।

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
- Public callers केवल already-flagged visible skills के लिए `200` प्राप्त करते हैं।
- Evidence public callers के लिए redacted होता है और केवल owners/moderators के लिए raw snippets शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

Moderator review के लिए skill report करें। Reports skill-level हैं, वैकल्पिक रूप से
किसी version से linked होते हैं, और skill report queue को feed करते हैं।

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

Skill reports को resolve या reopen करने के लिए moderator/admin endpoint.

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` `confirmed` और `dismissed` के लिए required है; `status` वापस `open` पर
set करते समय इसे omit किया जा सकता है। उसी auditable workflow में skill को hide करने के लिए triaged
report के साथ `finalAction: "hide"` pass करें।

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (optional): integer
- `cursor` (optional): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Version metadata + files list लौटाता है।

- `version.security` उपलब्ध होने पर normalized scan verification status और scanner details
  (VirusTotal + LLM) शामिल करता है।

### `GET /api/v1/skills/{slug}/scan`

Skill version के लिए security scan verification details लौटाता है।

Query params:

- `version` (optional): specific version string.
- `tag` (optional): tagged version resolve करें (उदाहरण `latest`)।

Notes:

- यदि `version` और `tag` में से कोई भी प्रदान नहीं किया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति के साथ स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निर्णायक verdict (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से व्युत्पन्न वर्तमान skill-स्तरीय moderation स्नैपशॉट है।
- ऐतिहासिक संस्करण क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नई ClawScan जॉब के लिए प्रमाणीकृत सबमिट endpoint।

स्थानीय upload स्कैन अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले अनुरोध `410` लौटाते हैं।

प्रकाशित स्कैन JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- स्कैन अनुरोध payloads और डाउनलोड योग्य रिपोर्टें retention window के बाद scan-request store से समाप्त हो जाती हैं।
- प्रकाशित स्कैन के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- प्रकाशित स्कैन केवल तब वापस लिखते हैं जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो।
- Response `202` है जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- स्कैन जॉब asynchronous होती हैं। Manual scan requests को सामान्य publish/backfill work से पहले प्राथमिकता दी जाती है, लेकिन completion अब भी worker availability पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणीकृत poll endpoint।

- queued/running/succeeded/failed स्थिति लौटाता है।
- queued रहने के दौरान `queue.queuedAhead` और `queue.position` लौटाता है ताकि clients दिखा सकें कि अनुरोध से आगे कितने prioritized manual scans हैं। बहुत बड़ी queues bounded होती हैं और `queuedAheadIsEstimate: true` के साथ रिपोर्ट की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` sections शामिल होते हैं।
- Failed scan jobs `lastError` के साथ `status: "failed"` लौटाती हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणीकृत report archive endpoint।

- सफल scan आवश्यक है; non-terminal scans `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए versions के लिए प्रमाणीकृत stored report archive endpoint।

- skill या plugin के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- exact submitted version के stored scan results लौटाता है, जिनमें blocked या hidden versions भी शामिल हैं।
- `kind` default रूप से `skill` होता है; plugin/package scans के लिए `kind=plugin` का उपयोग करें।
- scan-request downloads जैसा ही ZIP shape लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

Admin-only canonical batch rescan route। यह legacy `POST /api/v1/skills/-/rescan-batch` जैसा ही payload shape स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

Admin-only canonical batch status route। यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate counters लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया गया Skill Card verification envelope लौटाता है।

Query params:

- `version` (optional): specific version string।
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब selected version के पास generated Skill Card हो, moderation द्वारा malware-blocked न हो, और ClawScan verification clean हो।
- Skill identity, publisher identity, और selected version metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि shell automation nested wrappers unpack किए बिना उन्हें पढ़ सके।
- `security` top-level ClawScan/security verdict है। Automation को `ok`, `decision`, `reasons`, और `security.status` पर key off करना चाहिए।
- `security.signals` में `staticScan`, `virusTotal`, और `skillSpector` जैसे supporting scanner evidence शामिल होते हैं।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve और store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

exact skill versions के लिए current compact security verdicts लौटाता है। यह collection endpoint उन clients के लिए है जो पहले से जानते हैं कि उन्हें कौन से installed ClawHub skill versions display करने हैं, जैसे OpenClaw Control UI।

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
- `security.signals` में केवल status-level supporting evidence शामिल है; full scanner details के लिए `/scan` या ClawHub security-audit page का उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; card content की आवश्यकता होने पर clients को installed `skill-card.md` स्थानीय रूप से पढ़ना चाहिए।
- single-skill Skill Card verification envelope चाहिए तो `/verify` का उपयोग करें, generated card markdown चाहिए तो `/card`, और detailed scanner data चाहिए तो `/scan`।

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

- डिफ़ॉल्ट रूप से नवीनतम संस्करण का उपयोग करता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग endpoint:

- Skills
- code plugins
- bundle plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): pagination cursor
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, legacy alias `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  request plugin packages (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या package endpoints with
  `family=code-plugin`/`family=bundle-plugin`) तक सीमित हो। नियंत्रित श्रेणियां और
  legacy v1 filter aliases `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखा किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` fixed-family aliases बने रहते हैं।
- Skill entries skill registry द्वारा समर्थित रहती हैं और अभी भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अभी भी केवल code-plugin और bundle-plugin releases के लिए है।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers list/search results में उन publishers के private packages देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/packages/search`

Skills + plugin packages में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): query string
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। केवल तब समर्थित जब
  request plugin packages तक सीमित हो। नियंत्रित श्रेणियां और legacy v1
  filter aliases `GET /api/v1/plugins` के अंतर्गत प्रलेखित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखा किए जाते हैं।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers उन publishers के private packages खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin packages में Plugin-only कैटलॉग browse।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): pagination cursor
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, legacy alias `installs`
- `category` (वैकल्पिक): plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

Legacy v1 filter aliases read endpoints पर स्वीकार किए जाते रहते हैं:

- `mcp-tooling`, `data`, और `automation` `tools` में resolve होते हैं।
- `observability` और `deployment` `gateway` में resolve होते हैं।
- `dev-tools` `runtime` में resolve होता है।

`trending` सात-दिन का install/download leaderboard है और all-time totals का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` endpoint पर यह plugin-only है; skill catalog के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

Legacy aliases को stored या author-declared category values के रूप में स्वीकार नहीं किया जाता।

### `GET /api/v1/skills/export`

offline analysis के लिए नवीनतम public Skills का bulk export।

प्रमाणीकरण:

- API token आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds lower bound।
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds upper bound।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले response से pagination cursor।

प्रतिक्रिया:

- Body: ZIP archive।
- हर exported skill `{publisher}/{slug}/` पर rooted होता है।
- Hosted skills में latest stored version files शामिल होती हैं और वे
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ listed होती हैं।
- `clean` या `suspicious` scan वाले current GitHub-backed skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। इनमें ClawHub-hosted source files शामिल नहीं होतीं।
- हर skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP root पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब individual skills या files
  export नहीं की जा सकीं।

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
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ है दोनों
  Plugin परिवार।

प्रतिक्रिया:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यात किया गया Plugin `{family}/{packageName}/` पर रूट होता है।
- प्रत्येक निर्यात किए गए Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Plugin या फ़ाइलें
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
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। मौजूदा मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

नोट्स:

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित legacy v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग एक वास्तविक API फ़िल्टर है, जो Plugin श्रेणी डाइजेस्ट
  पंक्तियों द्वारा समर्थित है, न कि खोज-क्वेरी पुनर्लेखन।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में पेजिनेट नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को पुनः क्रमित करते हैं,
  जो मौजूदा `/skills` ब्राउज़ व्यवहार से मेल खाता है।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट्स:

- Skills एकीकृत कैटलॉग में इस रूट के माध्यम से भी रिज़ॉल्व हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को सॉफ्ट-डिलीट करता है।

नोट्स:

- पैकेज मालिक, किसी org प्रकाशक मालिक/admin, platform moderator, या platform admin के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

नोट्स:

- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता, सत्यापन, आर्टिफ़ैक्ट मेटाडेटा, और स्कैन डेटा सहित एक पैकेज संस्करण लौटाता है।

नोट्स:

- पुराने-विश्व पैकेज आर्काइव के लिए `version.artifact.kind` `legacy-zip` होता है या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack`।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स को हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  canonical रिलीज़ आर्टिफ़ैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल किए जाते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और भरोसा सारांश लौटाता है। यह तय करने के लिए कि
कोई रिज़ॉल्व की गई रिलीज़ इंस्टॉल की जा सकती है या नहीं, यह सार्वजनिक OpenClaw उपभोग सतह है।

प्रमाणीकरण:

- सार्वजनिक पढ़ने वाला एंडपॉइंट। कोई owner, publisher, moderator, या admin टोकन
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

- `package.name`, `package.displayName`, और `package.family` रिज़ॉल्व किए गए
  registry पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt` उस
  सटीक रिलीज़ की पहचान करते हैं जिसका मूल्यांकन किया गया था।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफ़ैक्ट के लिए ज्ञात होने पर मौजूद होते हैं।
- `trust.scanStatus` scanner inputs और manual release moderation से निकाली गई प्रभावी trust status है।
- `trust.moderationState` nullable है। जब कोई manual release
  moderation मौजूद नहीं होता, तो यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल ब्लॉक संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को scanner या moderation फ़ील्ड से blocking rules फिर से निकालने के बजाय
  यह मान `true` होने पर इंस्टॉलेशन ब्लॉक करना चाहिए।
- `trust.reasons` उपयोगकर्ता-दृश्य और audit explanation सूची है। reason codes
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक trust inputs अभी भी completion की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि trust summary outdated inputs से computed था और
  high-confidence allow decision से पहले refresh आवश्यक माना जाना चाहिए।

नोट्स:

- यह एंडपॉइंट version-exact है। क्लाइंट को इसे उस पैकेज संस्करण को रिज़ॉल्व करने के बाद कॉल करना चाहिए जिसे
  वे इंस्टॉल करना चाहते हैं, न कि केवल नवीनतम
  पैकेज मेटाडेटा पढ़ने के बाद।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर मालिक प्रकाशक को पढ़ नहीं सकता।
- यह एंडपॉइंट owner/moderator moderation
  एंडपॉइंट की तुलना में जानबूझकर संकरा है। यह इंस्टॉल निर्णय और सार्वजनिक स्पष्टीकरण दिखाता है,
  न कि reporter identities, report bodies, private evidence, या internal review
  timelines।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफ़ैक्ट resolver metadata लौटाता है।

नोट्स:

- Legacy पैकेज संस्करण `legacy-zip` आर्टिफ़ैक्ट और legacy ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण `npm-pack` आर्टिफ़ैक्ट, npm integrity फ़ील्ड, एक
  `tarballUrl`, और legacy ZIP compatibility URL लौटाते हैं।
- यह OpenClaw resolver surface है; यह shared URL से archive format का अनुमान लगाने से बचाता है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट resolver path के माध्यम से version artifact डाउनलोड करता है।

नोट्स:

- ClawPack संस्करण exact uploaded npm-pack `.tgz` bytes stream करते हैं।
- Legacy ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर redirect करते हैं।
- download rate bucket का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw consumption के लिए computed readiness लौटाता है।

Readiness checks में शामिल हैं:

- official channel status
- latest version availability
- ClawPack npm-pack artifact availability
- artifact digest
- source repo and commit provenance
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

आधिकारिक OpenClaw Plugin migration rows सूचीबद्ध करने के लिए moderator endpoint।

प्रमाणीकरण:

- moderator या admin user के लिए API टोकन आवश्यक है।

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

official Plugin migration row बनाने या अपडेट करने के लिए admin endpoint।

प्रमाणीकरण:

- admin user के लिए API टोकन आवश्यक है।

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

- `bundledPluginId` को lowercase में normalized किया जाता है और यह stable upsert key है।
- `packageName` npm-name normalized है; planned
  migrations के लिए पैकेज अनुपस्थित हो सकता है।
- यह केवल migration readiness ट्रैक करता है। यह OpenClaw को mutate नहीं करता या
  ClawPacks generate नहीं करता।

### `GET /api/v1/packages/moderation/queue`

package release review queues के लिए moderator/admin endpoint।

प्रमाणीकरण:

- moderator या admin user के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

स्थिति अर्थ:

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

moderator review के लिए किसी पैकेज की रिपोर्ट करें। रिपोर्ट package-level होती हैं, वैकल्पिक रूप से
किसी version से linked होती हैं। वे moderation queue को feed करती हैं, लेकिन स्वयं से downloads को
auto-hide या block नहीं करतीं; moderators को artifacts को
approve, quarantine, या revoke करने के लिए release moderation का उपयोग करना चाहिए।

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

मॉडरेटर/admin उपयोगकर्ता के लिए पैकेज रिपोर्ट इंटेक एंडपॉइंट।

प्रमाणीकरण:

- मॉडरेटर या admin उपयोगकर्ता के लिए API टोकन आवश्यक है।

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

पैकेज मॉडरेशन दृश्यता के लिए owner/moderator एंडपॉइंट।

प्रमाणीकरण:

- पैकेज owner, publisher सदस्य, मॉडरेटर, या admin उपयोगकर्ता के लिए API टोकन
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

पैकेज रिपोर्ट हल करने या फिर से खोलने के लिए मॉडरेटर/admin एंडपॉइंट।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`note` `confirmed` और `dismissed` के लिए आवश्यक है; `status` को वापस `open`
पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट योग्य वर्कफ़्लो में रिलीज़
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

पैकेज रिलीज़ समीक्षा के लिए मॉडरेटर/admin एंडपॉइंट।

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित स्थितियां:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई।
- `quarantined`: फ़ॉलो-अप लंबित रहने तक ब्लॉक किया गया।
- `revoked`: किसी रिलीज़ पर पहले भरोसा किए जाने के बाद ब्लॉक किया गया।

क्वारंटीन की गई और रद्द की गई रिलीज़ artifact डाउनलोड रूट से `403` लौटाती हैं।
हर बदलाव एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

किसी पैकेज फ़ाइल के लिए कच्ची टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- डाउनलोड बकेट नहीं, read rate बकेट का उपयोग करता है।
- बाइनरी फ़ाइलें `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal स्कैन reads को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ फिर भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कि कॉलर owning publisher को पढ़ न सके।

### `GET /api/v1/packages/{name}/download`

किसी पैकेज रिलीज़ के लिए legacy deterministic ZIP archive डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- Skills `GET /api/v1/download` पर redirect करती हैं।
- Plugin/package archives ऐसी zip फ़ाइलें हैं जिनमें `package/` root होता है ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह route केवल ZIP रहता है। यह ClawPack `.tgz` फ़ाइलें stream नहीं करता।
- Responses में resolver integrity checks के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` headers शामिल होते हैं।
- Registry-only metadata डाउनलोड किए गए archive में inject नहीं किया जाता।
- लंबित VirusTotal scans downloads को block नहीं करते; दुर्भावनापूर्ण releases `403` लौटाती हैं।
- निजी packages `404` लौटाते हैं, जब तक कि caller owner न हो।

### `GET /api/npm/{package}`

ClawPack-backed package versions के लिए npm-compatible packument लौटाता है।

नोट्स:

- केवल uploaded ClawPack npm-pack tarballs वाले versions listed होते हैं।
- Legacy ZIP-only versions को जानबूझकर छोड़ा गया है।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-compatible
  fields का उपयोग करते हैं ताकि users चाहें तो npm को mirror की ओर point कर सकें।
- Scoped package packuments `/api/npm/@scope/name` और npm के
  encoded `/api/npm/@scope%2Fname` request path दोनों को support करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm mirror clients के लिए ठीक uploaded ClawPack tarball bytes stream करता है।

नोट्स:

- download rate bucket का उपयोग करता है।
- Download headers में ClawHub SHA-256 के साथ npm integrity/shasum metadata शामिल होता है।
- Moderation और private package access checks अब भी लागू होते हैं।

### `GET /api/v1/resolve`

CLI द्वारा local fingerprint को किसी ज्ञात version से map करने के लिए उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): bundle fingerprint का 64-char hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

Hosted skill version ZIP डाउनलोड करता है, या `clean` या `suspicious` scan और बिना hosted
version वाली current GitHub-backed skill के लिए GitHub source handoff लौटाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver string
- `tag` (वैकल्पिक): tag name (उदा. `latest`)

नोट्स:

- यदि न `version` और न `tag` दिया गया है, तो नवीनतम version उपयोग किया जाता है।
- Soft-deleted versions `410` लौटाते हैं।
- GitHub-backed skill handoffs bytes को proxy या mirror नहीं करते। JSON response में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; scan/current state एक gate है और success
  payload metadata के रूप में शामिल नहीं होती।
- Download stats प्रति UTC day unique identities के रूप में गिने जाते हैं (`userId` जब API token valid हो, अन्यथा IP)।

## Auth endpoints (Bearer token)

सभी endpoints को यह आवश्यक है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

Token validate करता है और user handle लौटाता है।

### `POST /api/v1/skills`

नया version publish करता है।

- Preferred: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`।
- `files` (storageId-based) वाला JSON body भी accepted है।
- वैकल्पिक payload field: `ownerHandle`। मौजूद होने पर, API उस
  publisher को server-side resolve करता है और actor के पास publisher access होना आवश्यक करता है।
- वैकल्पिक payload field: `migrateOwner`। `ownerHandle` के साथ `true` होने पर, कोई
  मौजूदा skill उस owner पर move हो सकती है यदि actor वर्तमान और target publishers दोनों पर admin/owner है।
  इस opt-in के बिना, owner changes
  rejected होते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin release publish करता है।

- Bearer token auth आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत form fields हैं `payload`, repeated `files` blobs, या एक `clawpack`
  tarball reference। `clawpack` `.tgz` blob हो सकता है या upload-url flow द्वारा लौटाया गया storage id।
  Staged storage-id publishes में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- `files` या `clawpack` में से किसी एक का उपयोग करें, same request में दोनों कभी नहीं।
- JSON bodies और caller-supplied `payload.files` / `payload.artifact`
  metadata rejected हैं।
- Direct multipart publish requests 18MB तक capped हैं। ClawPack tarballs
  upload-url flow का उपयोग 120MB tarball cap तक कर सकते हैं।
- वैकल्पिक payload field: `ownerHandle`। मौजूद होने पर, केवल admins उस owner की ओर से publish कर सकते हैं।

Validation highlights:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin packages के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` uploads में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins के लिए `package.json`, source repo metadata, source commit
  metadata, config schema metadata, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक metadata हैं।
- केवल `openclaw` org publisher और current `openclaw` org members के
  personal publishers `official` channel में publish कर सकते हैं।
- On-behalf publishes अब भी target owner account के against official-channel eligibility validate करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

किसी skill को soft-delete / restore करता है (owner, moderator, या admin)।

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` skill moderation note के रूप में stored होता है और audit log में copied होता है।
Owner-initiated soft deletes slug को 30 दिनों के लिए reserve करते हैं, फिर slug को
दूसरा publisher claim कर सकता है। जब यह expiry लागू होती है तो delete response में `slugReservedUntil` शामिल होता है।
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

केवल admin। किसी handle के लिए org publisher मौजूद होना सुनिश्चित करता है। यदि handle अब भी
legacy shared user/personal publisher की ओर point करता है, तो endpoint पहले उसे org publisher में migrate करता है।
नए बनाए गए org के लिए, `memberHandle` दें; acting admin को member के रूप में नहीं जोड़ा जाता।
`memberRole` default रूप से `owner` होता है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authenticated self-serve org publisher creation। नया org publisher बनाता है और
caller को owner के रूप में जोड़ता है। यह endpoint मौजूदा user/personal handles को migrate नहीं करता और
publisher को trusted/official mark नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब handle पहले से किसी publisher, user, या personal publisher द्वारा used हो, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल admin। Release publish किए बिना rightful owner के लिए root slugs और package names reserve करता है।
Package names बिना release rows वाले private placeholder packages बन जाते हैं, ताकि वही
owner बाद में उस name में वास्तविक code-plugin या bundle-plugin release publish कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल admin। Convex Auth account rows edit किए बिना verified replacement GitHub OAuth principal
के लिए personal publisher recover करता है। Request में दोनों immutable GitHub
provider account ids का नाम होना चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग होते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से ड्राई-रन होता है। रिकवरी लागू करने के लिए स्टाफ़ द्वारा दोनों
GitHub principals के बीच निरंतरता स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब गंतव्य उपयोगकर्ता के मौजूदा व्यक्तिगत
प्रकाशक के पास Skills, packages, या GitHub skill sources हों, तो रिकवरी बंद अवस्था में विफल होती है।
रिकवरी पुनर्प्राप्त प्रकाशक के Skills, skill slug aliases, packages, package inspector warnings, और व्युत्पन्न search digest rows के लिए पुराने `ownerUserId` फ़ील्ड भी माइग्रेट करती है, ताकि
प्रत्यक्ष-स्वामी पथ नए प्रकाशक अधिकार से मेल खाएँ। पुनर्प्राप्त handle के लिए सक्रिय protected-handle
आरक्षण भी replacement user को फिर से असाइन किया जाता है, ताकि बाद की
profile synchronization पूर्व उपयोगकर्ता के प्रतिस्पर्धी अधिकार को पुनर्स्थापित न कर सके। प्रत्येक प्राथमिक तालिका
प्रति apply transaction 100 rows तक सीमित है; बड़ी रिकवरी के लिए पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped होते हैं और उन्हें फिर से लिखने के बजाय checked के रूप में रिपोर्ट किया जाता है।

- बॉडी: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- प्रतिक्रिया: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### स्वामी slug प्रबंधन एंडपॉइंट

- `POST /api/v1/skills/{slug}/rename`
  - बॉडी: `{ "newSlug": "new-canonical-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - बॉडी: `{ "targetSlug": "canonical-target-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

नोट:

- दोनों एंडपॉइंट के लिए API token auth आवश्यक है और वे केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` स्रोत listing को छिपाता है और source slug को target listing पर redirect करता है।

### स्वामित्व transfer एंडपॉइंट

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

किसी उपयोगकर्ता को ban करें और owned skills को hard-delete करें (केवल moderator/admin).

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

किसी उपयोगकर्ता को unban करें और eligible skills को restore करें (केवल admin).

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

किसी मौजूदा ban के लिए संग्रहीत reason बदलें, बिना unban किए या
content restore किए (केवल admin). जब तक `dryRun` `false` न हो, डिफ़ॉल्ट रूप से ड्राई-रन होता है।

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

किसी उपयोगकर्ता की भूमिका बदलें (केवल admin).

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

उपयोगकर्ताओं की सूची दिखाएँ या खोजें (केवल admin).

Query params:

- `q` (वैकल्पिक): search query
- `query` (वैकल्पिक): `q` के लिए alias
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

## पुराने CLI एंडपॉइंट (deprecated)

पुराने CLI संस्करणों के लिए अब भी समर्थित:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

हटाने की योजना के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। जो Package
publishes ClawPack tarball को stage करते हैं, उन्हें परिणामी storage id को
`clawpack` के रूप में और लौटाए गए ticket को `clawpackUploadTicket` के रूप में भेजना होगा।

## Registry discovery (`/.well-known/clawhub.json`)

CLI साइट से registry/auth settings खोज सकता है:

- `/.well-known/clawhub.json` (JSON, अनुशंसित)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो यह फ़ाइल serve करें (या `CLAWHUB_REGISTRY` स्पष्ट रूप से सेट करें; legacy `CLAWDHUB_REGISTRY`).
