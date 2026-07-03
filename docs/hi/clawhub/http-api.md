---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण)।
x-i18n:
    generated_at: "2026-07-03T02:46:59Z"
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

तृतीय-पक्ष डायरेक्टरियाँ ClawHub Skills को सूचीबद्ध करने या खोजने के लिए सार्वजनिक रीड endpoints का उपयोग कर सकती हैं। कृपया परिणामों को cache करें, `429`/`Retry-After` का पालन करें, उपयोगकर्ताओं को canonical ClawHub listing (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस link करें, और तृतीय-पक्ष site के लिए ClawHub के समर्थन का संकेत देने से बचें। public API surface के बाहर छिपी, निजी, या moderation-blocked सामग्री को mirror करने का प्रयास न करें।

Web slug shortcuts registry families में resolve होते हैं, लेकिन API clients को route
precedence को फिर से बनाने के बजाय read endpoints द्वारा लौटाए गए canonical URLs का उपयोग करना चाहिए।

## दर सीमाएँ

Enforcement model:

- Anonymous requests: प्रति IP लागू।
- Authenticated requests (मान्य Bearer token): प्रति user bucket लागू।
- यदि token missing/invalid है, तो behavior IP enforcement पर fallback करता है।
- Authenticated write endpoints को bare `Unauthorized` नहीं लौटाना चाहिए जब
  server को कारण पता हो। Missing tokens, invalid/revoked tokens, और
  deleted/banned/disabled accounts में से प्रत्येक को actionable text मिलना चाहिए ताकि CLI
  clients users को बता सकें कि उन्हें किसने block किया।

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
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर exact remaining budget.
  Sharded successful requests approximate global value लौटाने के बजाय इस header को omit करते हैं।
- `Retry-After`: `429` पर retry करने से पहले wait करने के seconds (delay)

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

- यदि `Retry-After` मौजूद है, तो retry से पहले उतने seconds wait करें।
- synchronized retries से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` missing है, तो `RateLimit-Reset` पर fallback करें (या `X-RateLimit-Reset` से compute करें)।

IP source:

- trusted client IP headers, जिसमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब
  deployment trusted forwarded headers को explicitly enable करता है।
- ClawHub edge पर client IPs की पहचान करने के लिए trusted forwarding headers का उपयोग करता है।
- यदि कोई trusted client IP उपलब्ध नहीं है, तो anonymous requests fallback buckets का उपयोग करते हैं
  जो केवल rate-limit kind द्वारा scoped होते हैं। इन fallback buckets में
  caller-supplied paths, slugs, package names, versions, query strings, या अन्य
  artifact parameters शामिल नहीं होते।

## Error responses

Public v1 error responses `content-type: text/plain; charset=utf-8` के साथ plain text होते हैं।
इसमें validation failures (`400`), missing public resources (`404`), auth और
permission failures (`401`/`403`), rate limits (`429`), और blocked downloads शामिल हैं। Clients
को response body को human-readable string के रूप में पढ़ना चाहिए। Unknown query parameters
compatibility के लिए ignore किए जाते हैं, लेकिन invalid values वाले recognized query parameters
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

- Results relevance order में लौटाए जाते हैं (embedding similarity + exact slug/name token boosts + small popularity prior)।
- Relevance, popularity से अधिक मजबूत है। precise slug या display-name token match बहुत stronger engagement वाले looser match से ऊपर rank कर सकता है।
- ASCII text को word और punctuation boundaries पर tokenize किया जाता है। उदाहरण के लिए, `personal-map` में standalone `map` token होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` होते हैं; इसलिए `map` search करने पर `personal-map` को `amap-jsapi-skill` की तुलना में stronger lexical match मिलता है।
- Popularity log-scaled और capped है। High-engagement Skills lower rank कर सकते हैं जब query text weaker match हो।
- Suspicious या hidden moderation state caller filters और current moderation status के आधार पर किसी Skill को public search से remove कर सकती है।

Publisher discoverability guidance:

- users सचमुच जिन terms को search करेंगे उन्हें display name, summary, और tags में रखें। standalone slug token का उपयोग केवल तब करें जब यह एक stable identity भी हो जिसे आप रखना चाहते हैं।
- केवल एक query के पीछे भागने के लिए slug rename न करें, जब तक new slug बेहतर long-term canonical name न हो। Old slugs redirect aliases बन जाते हैं, लेकिन canonical URL, displayed slug, और future search digests new slug का उपयोग करते हैं।
- Rename aliases old URLs और registry के माध्यम से resolve होने वाले installs के लिए resolution preserve करते हैं, लेकिन search ranking canonical skill metadata पर आधारित होती है जब rename indexed हो चुका हो। Existing stats Skill के साथ ही रहते हैं।
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
- `createdAt` new-skill crawls के लिए stable है; existing Skills republish होने पर `updated` बदलता है।
- जब `nonSuspiciousOnly=true` हो, cursor-based sorts page पर `limit` से कम items लौटा सकते हैं क्योंकि suspicious Skills page retrieval के बाद filter किए जाते हैं।
- मौजूद होने पर pagination continue करने के लिए `nextCursor` का उपयोग करें। short page अपने आप end-of-results नहीं दर्शाता।

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

- owner rename/merge flows द्वारा बनाए गए old slugs canonical Skill पर resolve होते हैं।
- `metadata.os`: Skill frontmatter में declared OS restrictions (जैसे `["macos"]`, `["linux"]`)। declare न होने पर `null`।
- `metadata.systems`: Nix system targets (जैसे `["aarch64-darwin", "x86_64-linux"]`)। declare न होने पर `null`।
- यदि Skill में कोई platform metadata नहीं है तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब Skill flagged हो या owner इसे देख रहा हो।

### `GET /api/v1/skills/{slug}/moderation`

structured moderation state लौटाता है।

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

moderator review के लिए Skill report करें। Reports skill-level हैं, वैकल्पिक रूप से
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

skill report intake के लिए Moderator/admin endpoint.

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

skill reports को resolve या reopen करने के लिए Moderator/admin endpoint.

Request:

```json
{ "status": "confirmed", "note": "Reviewed and hid affected version.", "finalAction": "hide" }
```

`note` `confirmed` और `dismissed` के लिए required है; `status` को वापस `open` पर
set करते समय इसे omit किया जा सकता है। उसी auditable workflow में Skill को hide करने के लिए triaged
report के साथ `finalAction: "hide"` pass करें।

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (optional): integer
- `cursor` (optional): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

version metadata + files list लौटाता है।

- `version.security` normalized scan verification status और scanner details
  (VirusTotal + LLM), उपलब्ध होने पर, शामिल करता है।

### `GET /api/v1/skills/{slug}/scan`

Skill version के लिए security scan verification details लौटाता है।

Query params:

- `version` (optional): specific version string.
- `tag` (optional): tagged version resolve करें (उदाहरण `latest`)।

Notes:

- यदि न `version` और न ही `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति और स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निर्णायक निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से व्युत्पन्न वर्तमान कौशल-स्तरीय मॉडरेशन स्नैपशॉट है।
- किसी ऐतिहासिक संस्करण को क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

### `POST /api/v1/skills/-/scan`

नई ClawScan जॉब्स के लिए प्रमाणीकृत सबमिट एंडपॉइंट।

स्थानीय अपलोड स्कैन अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले अनुरोध `410` लौटाते हैं।

प्रकाशित स्कैन JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- स्कैन अनुरोध पेलोड और डाउनलोड करने योग्य रिपोर्ट रिटेंशन विंडो के बाद scan-request स्टोर से समाप्त हो जाते हैं।
- प्रकाशित स्कैन के लिए मालिक/प्रकाशक प्रबंधन पहुंच, या प्लेटफॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- प्रकाशित स्कैन केवल तब वापस लिखते हैं जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो जाए।
- प्रतिक्रिया `202` होती है, जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- स्कैन जॉब्स असिंक्रोनस होती हैं। मैनुअल स्कैन अनुरोधों को सामान्य publish/backfill कार्य से पहले प्राथमिकता दी जाती है, लेकिन पूरा होना फिर भी वर्कर उपलब्धता पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणीकृत पोल एंडपॉइंट।

- queued/running/succeeded/failed स्थिति लौटाता है।
- queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है, ताकि क्लाइंट दिखा सकें कि अनुरोध से आगे कितने प्राथमिकता प्राप्त मैनुअल स्कैन हैं। बहुत बड़ी कतारें सीमित की जाती हैं और `queuedAheadIsEstimate: true` के साथ रिपोर्ट की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` सेक्शन होते हैं।
- विफल स्कैन जॉब्स `lastError` के साथ `status: "failed"` लौटाती हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणीकृत रिपोर्ट आर्काइव एंडपॉइंट।

- सफल स्कैन आवश्यक है; non-terminal स्कैन `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए संस्करणों के लिए प्रमाणीकृत संग्रहीत रिपोर्ट आर्काइव एंडपॉइंट।

- कौशल या Plugin के लिए मालिक/प्रकाशक प्रबंधन पहुंच, या प्लेटफॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- सटीक सबमिट किए गए संस्करण के लिए संग्रहीत स्कैन परिणाम लौटाता है, जिसमें अवरुद्ध या छिपे हुए संस्करण भी शामिल हैं।
- `kind` का डिफॉल्ट `skill` है; Plugin/package स्कैन के लिए `kind=plugin` उपयोग करें।
- scan-request डाउनलोड जैसी ही ZIP संरचना लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

केवल एडमिन के लिए canonical बैच rescan रूट। यह legacy `POST /api/v1/skills/-/rescan-batch` जैसी ही पेलोड संरचना स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

केवल एडमिन के लिए canonical बैच स्थिति रूट। यह `{ "jobIds": ["..."] }` स्वीकार करता है और legacy `POST /api/v1/skills/-/rescan-batch/status` जैसे ही aggregate counters लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला कौशल कार्ड सत्यापन envelope लौटाता है।

क्वेरी params:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किए गए संस्करण को resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब चयनित संस्करण में generated कौशल कार्ड हो, वह moderation द्वारा malware-blocked न हो, और ClawScan सत्यापन clean हो।
- कौशल पहचान, प्रकाशक पहचान, और चयनित संस्करण metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं, ताकि shell automation nested wrappers को unpack किए बिना उन्हें पढ़ सके।
- `security` top-level ClawScan/security verdict है। Automation को `ok`, `decision`, `reasons`, और `security.status` पर key off करना चाहिए।
- `security.signals` में सहायक स्कैनर evidence जैसे `staticScan`, `virusTotal`, और `skillSpector` होते हैं।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` रहती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve और store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

सटीक कौशल संस्करणों के लिए वर्तमान compact security verdicts लौटाता है। यह collection endpoint उन clients के लिए है जो पहले से जानते हैं कि उन्हें कौन से installed ClawHub कौशल versions दिखाने हैं, जैसे OpenClaw Control UI।

अनुरोध:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

नोट्स:

- `items` में 1-100 अद्वितीय `{ slug, version }` pairs होने चाहिए।
- परिणाम प्रति item होते हैं; एक missing कौशल या version पूरी response को fail नहीं करता।
- response केवल security-only है। इसमें कौशल कार्ड data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं हैं।
- `security.signals` में केवल status-level supporting evidence होता है; पूर्ण scanner details के लिए `/scan` या ClawHub security-audit page उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` रहती है।
- कौशल कार्ड की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; clients को card content की आवश्यकता होने पर installed `skill-card.md` को locally पढ़ना चाहिए।
- single-skill कौशल कार्ड verification envelope की आवश्यकता हो तो `/verify`, generated card markdown की आवश्यकता हो तो `/card`, और detailed scanner data की आवश्यकता हो तो `/scan` उपयोग करें।

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

- नवीनतम संस्करण पर डिफ़ॉल्ट करता है।
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग endpoint:

- skills
- code plugins
- bundle plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पृष्ठांकन cursor
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, legacy alias `installs`
- `category` (वैकल्पिक): plugin category filter. केवल तब समर्थित जब
  अनुरोध plugin packages तक scoped हो (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले package endpoints)। नियंत्रित categories और
  legacy v1 filter aliases `GET /api/v1/plugins` के अंतर्गत documented हैं।

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

skills + plugin packages में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): query string
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin category filter. केवल तब समर्थित जब
  अनुरोध plugin packages तक scoped हो। नियंत्रित categories और legacy v1
  filter aliases `GET /api/v1/plugins` के अंतर्गत documented हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखा किए जाते हैं।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers उन publishers के private packages खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin packages में Plugin-only कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पृष्ठांकन cursor
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, legacy alias `installs`
- `category` (वैकल्पिक): plugin category filter. वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

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

- API token आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds lower bound।
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds upper bound।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले response से pagination cursor।

Response:

- Body: ZIP archive।
- प्रत्येक exported skill `{publisher}/{slug}/` पर rooted है।
- Hosted skills में latest stored version files शामिल होती हैं और वे
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ listed होती हैं।
- `clean` या `suspicious` scan वाली वर्तमान GitHub-backed skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। इनमें ClawHub-hosted source files शामिल नहीं होतीं।
- प्रत्येक skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP root पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब individual skills या files export नहीं की जा सकीं।

Headers:

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
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़ने का अर्थ है दोनों
  Plugin परिवार।

रिस्पॉन्स:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Plugin `{family}/{packageName}/` पर रूट होता है।
- प्रत्येक निर्यातित Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- जब अलग-अलग Plugin या फ़ाइलें निर्यात नहीं की जा सकीं, तो `_errors.json`
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
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

नोट्स:

- `GET /api/v1/plugins` के तहत प्रलेखित लेगेसी v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग Plugin श्रेणी डाइजेस्ट पंक्तियों द्वारा समर्थित वास्तविक API फ़िल्टर है,
  खोज-क्वेरी पुनर्लेखन नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और अभी पेजिनेट नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को फिर से क्रमबद्ध करते हैं,
  जो वर्तमान `/skills` ब्राउज़ व्यवहार से मेल खाता है।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट्स:

- Skills एकीकृत कैटलॉग में इस रूट के माध्यम से भी रिज़ॉल्व हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

पैकेज और सभी रिलीज़ को सॉफ़्ट-डिलीट करता है।

नोट्स:

- पैकेज मालिक, org प्रकाशक मालिक/admin, प्लेटफ़ॉर्म moderator, या प्लेटफ़ॉर्म admin के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

नोट्स:

- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता, सत्यापन, आर्टिफैक्ट मेटाडेटा, और स्कैन डेटा सहित एक पैकेज संस्करण लौटाता है।

नोट्स:

- `version.artifact.kind` पुराने-विश्व पैकेज आर्काइव के लिए `legacy-zip` या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack` है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए सटीक ZIP बाइट्स को हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैनॉनिकल रिलीज़ आर्टिफैक्ट की पहचान करता है।
- स्कैन डेटा मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और विश्वास सारांश लौटाता है।
यह इस निर्णय के लिए सार्वजनिक OpenClaw उपभोग सतह है कि रिज़ॉल्व की गई रिलीज़
इंस्टॉल की जा सकती है या नहीं।

प्रमाणीकरण:

- सार्वजनिक रीड एंडपॉइंट। कोई मालिक, प्रकाशक, moderator, या admin टोकन
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
- `release.releaseId`, `release.version`, और `release.createdAt` उस सटीक
  रिलीज़ की पहचान करते हैं जिसका मूल्यांकन किया गया था।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफैक्ट के लिए ज्ञात होने पर
  मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैनुअल रिलीज़ moderation से निकाली गई
  प्रभावी विश्वास स्थिति है।
- `trust.moderationState` nullable है। जब कोई मैनुअल रिलीज़ moderation
  मौजूद नहीं होती, तो यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल ब्लॉक संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को इस मान के `true` होने पर इंस्टॉलेशन रोकना चाहिए, बजाय इसके कि
  वे स्कैनर या moderation फ़ील्ड से ब्लॉकिंग नियम दोबारा निकालें।
- `trust.reasons` उपयोगकर्ता-सामने और ऑडिट व्याख्या सूची है। कारण कोड
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं, जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक विश्वास इनपुट अभी भी पूर्णता की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि विश्वास सारांश पुराने इनपुट से गणना किया गया था और
  उच्च-विश्वास अनुमति निर्णय से पहले इसे रिफ़्रेश आवश्यक मानना चाहिए।

नोट्स:

- यह एंडपॉइंट संस्करण-सटीक है। क्लाइंट को इसे उस पैकेज संस्करण को रिज़ॉल्व करने के बाद कॉल करना चाहिए
  जिसे वे इंस्टॉल करना चाहते हैं, केवल नवीनतम पैकेज मेटाडेटा पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।
- यह एंडपॉइंट जानबूझकर मालिक/moderator moderation एंडपॉइंट से संकरा है।
  यह इंस्टॉल निर्णय और सार्वजनिक व्याख्या उजागर करता है, रिपोर्टर पहचान,
  रिपोर्ट बॉडी, निजी साक्ष्य, या आंतरिक समीक्षा समयरेखा नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

नोट्स:

- लेगेसी पैकेज संस्करण `legacy-zip` आर्टिफैक्ट और लेगेसी ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण `npm-pack` आर्टिफैक्ट, npm integrity फ़ील्ड,
  `tarballUrl`, और लेगेसी ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से आर्काइव फ़ॉर्मैट का अनुमान लगाने से बचती है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से संस्करण आर्टिफैक्ट डाउनलोड करता है।

नोट्स:

- ClawPack संस्करण अपलोड किए गए सटीक npm-pack `.tgz` बाइट्स स्ट्रीम करते हैं।
- लेगेसी ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट करते हैं।
- डाउनलोड रेट बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw उपभोग के लिए गणना की गई तैयारी लौटाता है।

तैयारी जांचें शामिल करती हैं:

- आधिकारिक चैनल स्थिति
- नवीनतम संस्करण उपलब्धता
- ClawPack npm-pack आर्टिफैक्ट उपलब्धता
- आर्टिफैक्ट डाइजेस्ट
- स्रोत repo और commit provenance
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

आधिकारिक OpenClaw Plugin migration पंक्तियां सूचीबद्ध करने के लिए moderator एंडपॉइंट।

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

आधिकारिक Plugin migration पंक्ति बनाने या अपडेट करने के लिए admin एंडपॉइंट।

प्रमाणीकरण:

- admin उपयोगकर्ता के लिए API टोकन आवश्यक है।

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
- `packageName` npm-name सामान्यीकृत है; योजनाबद्ध migrations के लिए पैकेज अनुपस्थित हो सकता है।
- यह केवल migration तैयारी ट्रैक करता है। यह OpenClaw को बदलता नहीं है या
  ClawPacks उत्पन्न नहीं करता।

### `GET /api/v1/packages/moderation/queue`

पैकेज रिलीज़ समीक्षा कतारों के लिए moderator/admin एंडपॉइंट।

प्रमाणीकरण:

- moderator या admin उपयोगकर्ता के लिए API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `status` (वैकल्पिक): `open` (डिफ़ॉल्ट), `blocked`, `manual`, या `all`
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

स्थिति अर्थ:

- `open`: suspicious, malicious, pending, quarantined, revoked, या reported रिलीज़।
- `blocked`: quarantined, revoked, या malicious रिलीज़।
- `manual`: मैनुअल moderation override वाली कोई भी रिलीज़।
- `all`: मैनुअल override, non-clean स्कैन स्थिति, या पैकेज रिपोर्ट वाली कोई भी रिलीज़।

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

moderator समीक्षा के लिए पैकेज रिपोर्ट करें। रिपोर्ट पैकेज-स्तरीय होती हैं, वैकल्पिक रूप से
किसी संस्करण से जुड़ी होती हैं। वे moderation कतार को फ़ीड करती हैं लेकिन अपने आप
डाउनलोड को छिपाती या ब्लॉक नहीं करतीं; moderators को आर्टिफैक्ट स्वीकृत, quarantine,
या revoke करने के लिए रिलीज़ moderation का उपयोग करना चाहिए।

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

मॉडरेटर/प्रशासक एंडपॉइंट, पैकेज रिपोर्ट स्वीकार करने के लिए।

प्रमाणीकरण:

- मॉडरेटर या प्रशासक उपयोगकर्ता के लिए API टोकन आवश्यक है।

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

- पैकेज स्वामी, प्रकाशक सदस्य, मॉडरेटर, या प्रशासक उपयोगकर्ता के लिए API टोकन
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

पैकेज रिपोर्ट हल करने या फिर से खोलने के लिए मॉडरेटर/प्रशासक एंडपॉइंट।

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open`
पर सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट योग्य वर्कफ़्लो में रिलीज़ मॉडरेशन
लागू करने के लिए पुष्टि की गई रिपोर्ट के साथ `finalAction: "quarantine"` या
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

पैकेज रिलीज़ समीक्षा के लिए मॉडरेटर/प्रशासक एंडपॉइंट।

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित अवस्थाएँ:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई।
- `quarantined`: फ़ॉलो-अप लंबित रहने तक ब्लॉक किया गया।
- `revoked`: किसी रिलीज़ पर पहले भरोसा किए जाने के बाद ब्लॉक किया गया।

क्वारंटीन और रद्द की गई रिलीज़ आर्टिफ़ैक्ट डाउनलोड रूट से `403` लौटाती हैं।
हर बदलाव एक ऑडिट लॉग प्रविष्टि लिखता है।

### `GET /api/v1/packages/{name}/file`

किसी पैकेज फ़ाइल के लिए कच्ची टेक्स्ट सामग्री लौटाता है।

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- डाउनलोड बकेट नहीं, रीड रेट बकेट का उपयोग करता है।
- बाइनरी फ़ाइलें `415` लौटाती हैं।
- फ़ाइल आकार सीमा: 200KB।
- लंबित VirusTotal स्कैन रीड्स को ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ अभी भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/download`

पैकेज रिलीज़ के लिए लीगेसी निर्धारक ZIP आर्काइव डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- Skills `GET /api/v1/download` पर रीडायरेक्ट करते हैं।
- Plugin/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें हैं, ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह रूट केवल ZIP रहता है। यह ClawPack `.tgz` फ़ाइलें स्ट्रीम नहीं करता।
- रिस्पॉन्स में रिज़ॉल्वर इंटीग्रिटी जाँचों के लिए `ETag`, `Digest`,
  `X-ClawHub-Artifact-Type`, और `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल-Registry मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड ब्लॉक नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी न हो।

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत packument लौटाता है।

नोट्स:

- केवल अपलोड किए गए ClawPack npm-pack tarball वाले संस्करण सूचीबद्ध होते हैं।
- लीगेसी केवल-ZIP संस्करण जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत फ़ील्ड का उपयोग करते हैं,
  ताकि उपयोगकर्ता चाहें तो npm को मिरर पर इंगित कर सकें।
- स्कोप्ड पैकेज packuments `/api/npm/@scope/name` और npm के
  एनकोडेड `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm मिरर क्लाइंट के लिए ठीक वही अपलोड किए गए ClawPack tarball बाइट्स स्ट्रीम करता है।

नोट्स:

- डाउनलोड रेट बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 के साथ npm integrity/shasum मेटाडेटा शामिल होता है।
- मॉडरेशन और निजी पैकेज एक्सेस जाँचें फिर भी लागू होती हैं।

### `GET /api/v1/resolve`

CLI द्वारा स्थानीय फ़िंगरप्रिंट को किसी ज्ञात संस्करण से मैप करने के लिए उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): बंडल फ़िंगरप्रिंट का 64-अक्षर hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

होस्ट किया गया कौशल संस्करण ZIP डाउनलोड करता है, या मौजूदा GitHub-समर्थित कौशल के लिए
GitHub स्रोत हैंडऑफ़ लौटाता है, जब उसका स्कैन `clean` या `suspicious` हो और कोई होस्ट किया गया
संस्करण न हो।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver स्ट्रिंग
- `tag` (वैकल्पिक): टैग नाम (उदा. `latest`)

नोट्स:

- यदि `version` और `tag` में से कोई भी प्रदान नहीं किया गया है, तो नवीनतम संस्करण उपयोग किया जाता है।
- सॉफ़्ट-डिलीट किए गए संस्करण `410` लौटाते हैं।
- GitHub-समर्थित कौशल हैंडऑफ़ बाइट्स को प्रॉक्सी या मिरर नहीं करते। JSON प्रतिक्रिया में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; स्कैन/मौजूदा अवस्था एक गेट है और इसे सफलता
  payload मेटाडेटा के रूप में शामिल नहीं किया जाता।
- डाउनलोड आँकड़े प्रति UTC दिन विशिष्ट पहचानों के रूप में गिने जाते हैं (`userId` जब API टोकन मान्य हो, अन्यथा IP)।

## प्रमाणीकरण एंडपॉइंट (Bearer token)

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
- वैकल्पिक payload फ़ील्ड: `ownerHandle`। मौजूद होने पर, API उस
  प्रकाशक को सर्वर-साइड रिज़ॉल्व करता है और अभिनेता के पास प्रकाशक एक्सेस होना आवश्यक है।
- वैकल्पिक payload फ़ील्ड: `migrateOwner`। `ownerHandle` के साथ `true` होने पर, कोई
  मौजूदा कौशल उस स्वामी के पास जा सकता है, यदि अभिनेता वर्तमान और लक्ष्य, दोनों
  प्रकाशकों पर प्रशासक/स्वामी है। इस opt-in के बिना, स्वामी बदलाव
  अस्वीकार किए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है।

- Bearer टोकन प्रमाणीकरण आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत form फ़ील्ड `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  tarball संदर्भ हैं। `clawpack` कोई `.tgz` blob या upload-url फ़्लो द्वारा लौटाई गई
  storage id हो सकती है। स्टेज्ड storage-id publish में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- एक ही अनुरोध में `files` या `clawpack` में से केवल एक का उपयोग करें, दोनों कभी नहीं।
- JSON bodies और कॉलर द्वारा दिए गए `payload.files` / `payload.artifact`
  मेटाडेटा अस्वीकार किए जाते हैं।
- सीधे multipart publish अनुरोध 18MB तक सीमित हैं। ClawPack tarballs
  120MB tarball सीमा तक upload-url फ़्लो का उपयोग कर सकते हैं।
- वैकल्पिक payload फ़ील्ड: `ownerHandle`। मौजूद होने पर, केवल प्रशासक उस स्वामी की ओर से प्रकाशित कर सकते हैं।

सत्यापन मुख्य बिंदु:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin पैकेजों के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` uploads में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins के लिए `package.json`, स्रोत repo मेटाडेटा, स्रोत commit
  मेटाडेटा, config schema मेटाडेटा, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` org publisher और वर्तमान `openclaw` org सदस्यों के
  व्यक्तिगत प्रकाशक `official` चैनल पर प्रकाशित कर सकते हैं।
- on-behalf publishes अब भी target owner खाते के विरुद्ध official-channel पात्रता मान्य करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

कौशल को सॉफ़्ट-डिलीट / पुनर्स्थापित करें (स्वामी, मॉडरेटर, या प्रशासक)।

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` कौशल मॉडरेशन नोट के रूप में संग्रहीत होता है और ऑडिट लॉग में कॉपी किया जाता है।
स्वामी द्वारा शुरू किए गए सॉफ़्ट deletes slug को 30 दिनों के लिए आरक्षित रखते हैं, फिर slug को
दूसरा प्रकाशक दावा कर सकता है। जब यह समाप्ति लागू होती है, delete प्रतिक्रिया में `slugReservedUntil` शामिल होता है।
मॉडरेटर/प्रशासक hides और सुरक्षा removals इस तरह समाप्त नहीं होते।

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

केवल-प्रशासक। सुनिश्चित करता है कि किसी हैंडल के लिए org publisher मौजूद हो। यदि हैंडल अब भी
legacy shared user/personal publisher की ओर इंगित करता है, तो एंडपॉइंट पहले उसे org publisher में माइग्रेट करता है।
नए बनाए गए org के लिए, `memberHandle` प्रदान करें; कार्यरत प्रशासक सदस्य के रूप में नहीं जोड़ा जाता।
`memberRole` डिफ़ॉल्ट रूप से `owner` होता है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

प्रमाणीकृत self-serve org publisher निर्माण। नया org publisher बनाता है और
कॉलर को स्वामी के रूप में जोड़ता है। यह एंडपॉइंट मौजूदा user/personal handles को माइग्रेट नहीं करता और
प्रकाशक को trusted/official के रूप में चिह्नित नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब हैंडल पहले से किसी publisher, user, या personal publisher द्वारा उपयोग किया जा रहा हो, तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल-प्रशासक। रिलीज़ प्रकाशित किए बिना किसी सही स्वामी के लिए root slugs और package names आरक्षित करता है।
Package names बिना release rows वाले निजी placeholder packages बन जाते हैं, ताकि वही
स्वामी बाद में वास्तविक code-plugin या bundle-plugin रिलीज़ को उस नाम में प्रकाशित कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल-प्रशासक। Convex Auth account rows को संपादित किए बिना सत्यापित replacement GitHub OAuth principal
के लिए personal publisher पुनर्प्राप्त करता है। अनुरोध में दोनों immutable GitHub
provider account ids का नाम होना चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग किए जाते हैं।

endpoint डिफ़ॉल्ट रूप से dry-run होता है। recovery लागू करने के लिए `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं, जब staff दोनों
GitHub principals के बीच continuity को स्वतंत्र रूप से verify कर लें। destination user's current personal
publisher के पास skills, packages, या GitHub skill sources होने पर recovery fail closed होती है।
Recovery recovered publisher's skills,
skill slug aliases, packages, package inspector warnings, और derived search digest rows के लिए legacy `ownerUserId` fields को भी migrate करती है ताकि
direct-owner paths नई publisher authority से मेल खाएँ। recovered handle के लिए active protected-handle
reservation भी replacement user को reassign किया जाता है ताकि बाद की
profile synchronization former user's competing authority को restore न कर सके। प्रत्येक primary table प्रति apply transaction
100 rows तक सीमित है; बड़े recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped होते हैं और rewritten होने के बजाय checked के रूप में report किए जाते हैं।

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug प्रबंधन endpoints

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

टिप्पणियाँ:

- दोनों endpoints के लिए API token auth आवश्यक है और वे केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` source listing को छिपाता है और source slug को target listing पर redirect करता है।

### Ownership transfer endpoints

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

मौजूदा ban के stored reason को user को unban किए बिना या
content restore किए बिना बदलें (केवल admin)। जब तक `dryRun` `false` न हो, dry-run डिफ़ॉल्ट है।

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

पुराने CLI versions के लिए अभी भी supported हैं:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Removal plan के लिए `DEPRECATIONS.md` देखें।

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

यदि आप self-host करते हैं, तो यह file serve करें (या `CLAWHUB_REGISTRY` को explicitly set करें; legacy `CLAWDHUB_REGISTRY`)।
