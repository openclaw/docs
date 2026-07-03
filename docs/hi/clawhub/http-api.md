---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों की डीबगिंग
summary: HTTP API संदर्भ (सार्वजनिक + CLI एंडपॉइंट + प्रमाणीकरण)।
x-i18n:
    generated_at: "2026-07-03T15:25:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8926327c9d81d535c5683dad55b8e0aff704261f17c2b17c95bd7026bb31887d
    source_path: clawhub/http-api.md
    workflow: 16
---

# HTTP API

मूल URL: `https://clawhub.ai` (डिफ़ॉल्ट).

सभी v1 पाथ `/api/v1/...` के अंतर्गत हैं।
लेगेसी `/api/...` और `/api/cli/...` संगतता के लिए बने हुए हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`.

## सार्वजनिक कैटलॉग पुन: उपयोग

तृतीय-पक्ष डायरेक्टरी ClawHub Skills को सूचीबद्ध करने या खोजने के लिए सार्वजनिक रीड endpoints का उपयोग कर सकती हैं। कृपया परिणाम cache करें, `429`/`Retry-After` का सम्मान करें, उपयोगकर्ताओं को कैननिकल ClawHub listing (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस link करें, और तृतीय-पक्ष साइट के लिए ClawHub endorsement का संकेत देने से बचें। सार्वजनिक API surface के बाहर छिपी, private, या moderation-blocked content को mirror करने का प्रयास न करें।

Web slug shortcuts registry families में resolve होते हैं, लेकिन API clients को route
precedence को फिर से बनाने के बजाय read endpoints द्वारा लौटाए गए canonical URLs
का उपयोग करना चाहिए।

## दर सीमाएँ

प्रवर्तन मॉडल:

- Anonymous requests: प्रति IP लागू।
- Authenticated requests (मान्य Bearer token): प्रति user bucket लागू।
- यदि token missing/invalid है, तो behavior IP enforcement पर fallback करता है।
- Authenticated write endpoints को bare `Unauthorized` return नहीं करना चाहिए जब
  server को कारण पता हो। Missing tokens, invalid/revoked tokens, और
  deleted/banned/disabled accounts में से हर एक को actionable text मिलना चाहिए ताकि CLI
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

- यदि `Retry-After` मौजूद है, retry से पहले उतने seconds wait करें।
- synchronized retries से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` missing है, तो `RateLimit-Reset` पर fallback करें (या `X-RateLimit-Reset` से compute करें)।

IP source:

- trusted client IP headers, जिनमें `cf-connecting-ip` भी शामिल है, केवल तब उपयोग करता है जब
  deployment स्पष्ट रूप से trusted forwarded headers सक्षम करता है।
- ClawHub edge पर client IPs की पहचान करने के लिए trusted forwarding headers का उपयोग करता है।
- यदि कोई trusted client IP उपलब्ध नहीं है, anonymous requests fallback buckets का उपयोग करती हैं
  जो केवल rate-limit kind द्वारा scoped होती हैं। इन fallback buckets में
  caller-supplied paths, slugs, package names, versions, query strings, या अन्य
  artifact parameters शामिल नहीं होते।

## Error responses

Public v1 error responses plain text हैं, `content-type: text/plain; charset=utf-8` के साथ।
इसमें validation failures (`400`), missing public resources (`404`), auth और
permission failures (`401`/`403`), rate limits (`429`), और blocked downloads शामिल हैं। Clients
को response body को human-readable string के रूप में read करना चाहिए। Unknown query parameters को
compatibility के लिए ignore किया जाता है, लेकिन invalid values वाले recognized query parameters
`400` return करते हैं।

## Public endpoints (no auth)

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

- Results relevance order में return किए जाते हैं (embedding similarity + exact slug/name token boosts + छोटा popularity prior)।
- Relevance popularity से अधिक मजबूत है। Precise slug या display-name token match, बहुत stronger engagement वाले looser match से ऊपर rank कर सकता है।
- ASCII text को word और punctuation boundaries पर tokenized किया जाता है। उदाहरण के लिए, `personal-map` में standalone `map` token है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` हैं; इसलिए `map` search करने पर `personal-map` को `amap-jsapi-skill` की तुलना में stronger lexical match मिलता है।
- Popularity log-scaled और capped होती है। High-engagement skills lower rank कर सकती हैं जब query text weaker match हो।
- Suspicious या hidden moderation state caller filters और current moderation status के आधार पर public search से skill को remove कर सकती है।

Publisher discoverability guidance:

- display name, summary, और tags में वे terms डालें जिन्हें users सचमुच search करेंगे। Standalone slug token का उपयोग केवल तब करें जब वह एक stable identity भी हो जिसे आप रखना चाहते हैं।
- केवल एक query को chase करने के लिए slug rename न करें, जब तक नया slug बेहतर long-term canonical name न हो। Old slugs redirect aliases बन जाते हैं, लेकिन canonical URL, displayed slug, और future search digests नया slug उपयोग करते हैं।
- Rename aliases old URLs और registry के माध्यम से resolve होने वाले installs के लिए resolution preserve करते हैं, लेकिन search ranking canonical skill metadata पर आधारित होती है, जब rename indexed हो चुका हो। Existing stats skill के साथ रहते हैं।
- यदि कोई skill unexpectedly invisible है, ranking-related metadata बदलने से पहले logged in रहते हुए `clawhub inspect @owner/slug` से moderation state पहले check करें।

### `GET /api/v1/skills`

Query params:

- `limit` (optional): integer (1–200)
- `cursor` (optional): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (optional): `updated` (default), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर map होते हैं, `trending`
- `nonSuspiciousOnly` (optional): suspicious (`flagged.suspicious`) skills छिपाने के लिए `true`
- `nonSuspicious` (optional): `nonSuspiciousOnly` के लिए legacy alias

Invalid `sort` values `400` return करते हैं।

Notes:

- `recommended` engagement और recency signals का उपयोग करता है।
- `trending` पिछले 7 दिनों में installs के आधार पर rank करता है (telemetry-based)।
- `createdAt` new-skill crawls के लिए stable है; `updated` existing skills republish होने पर बदलता है।
- जब `nonSuspiciousOnly=true` हो, cursor-based sorts किसी page पर `limit` से कम items return कर सकते हैं क्योंकि suspicious skills page retrieval के बाद filtered होती हैं।
- मौजूद होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। Short page अपने आप end-of-results नहीं बताता।

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
- `metadata.os`: skill frontmatter में घोषित OS restrictions (जैसे `["macos"]`, `["linux"]`)। घोषित न होने पर `null`।
- `metadata.systems`: Nix system targets (जैसे `["aarch64-darwin", "x86_64-linux"]`)। घोषित न होने पर `null`।
- यदि skill में कोई platform metadata नहीं है तो `metadata` `null` है।
- `moderation` केवल तब शामिल होता है जब skill flagged हो या owner उसे देख रहा हो।

### `GET /api/v1/skills/{slug}/moderation`

Structured moderation state return करता है।

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
- Public callers को केवल already-flagged visible skills के लिए `200` मिलता है।
- Evidence public callers के लिए redacted होती है और केवल owners/moderators के लिए raw snippets शामिल करती है।

### `POST /api/v1/skills/{slug}/report`

Moderator review के लिए skill report करें। Reports skill-level होते हैं, वैकल्पिक रूप से
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
set करते समय इसे omit किया जा सकता है। उसी auditable workflow में skill को hide करने के लिए triaged
report के साथ `finalAction: "hide"` pass करें।

### `GET /api/v1/skills/{slug}/versions`

Query params:

- `limit` (optional): integer
- `cursor` (optional): pagination cursor

### `GET /api/v1/skills/{slug}/versions/{version}`

Version metadata + files list return करता है।

- उपलब्ध होने पर `version.security` में normalized scan verification status और scanner details
  (VirusTotal + LLM) शामिल होते हैं।

### `GET /api/v1/skills/{slug}/scan`

Skill version के लिए security scan verification details return करता है।

Query params:

- `version` (optional): specific version string।
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

Notes:

- यदि न `version` और न ही `tag` दिया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति और स्कैनर-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी स्कैनर ने निर्णायक निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से प्राप्त वर्तमान कौशल-स्तर मॉडरेशन स्नैपशॉट है।
- ऐतिहासिक संस्करण क्वेरी करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जाँचें।

### `POST /api/v1/skills/-/scan`

नए ClawScan जॉब्स के लिए प्रमाणित सबमिट एंडपॉइंट।

स्थानीय अपलोड स्कैन अब समर्थित नहीं हैं। `multipart/form-data` या `{ "source": { "kind": "upload" } }` का उपयोग करने वाले अनुरोध `410` लौटाते हैं।

प्रकाशित स्कैन JSON का उपयोग करते हैं:

```json
{
  "source": { "kind": "published", "slug": "gifgrep", "version": "1.2.3" },
  "update": false
}
```

नोट्स:

- स्कैन अनुरोध पेलोड और डाउनलोड योग्य रिपोर्टें अवधारण अवधि के बाद स्कैन-अनुरोध स्टोर से समाप्त हो जाती हैं।
- प्रकाशित स्कैन के लिए स्वामी/प्रकाशक प्रबंधन पहुँच, या प्लेटफ़ॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- प्रकाशित स्कैन केवल तब वापस लिखते हैं जब `update: true` हो और स्कैन सफलतापूर्वक पूरा हो।
- प्रतिक्रिया `202` होती है, जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- स्कैन जॉब्स असिंक्रोनस होते हैं। मैनुअल स्कैन अनुरोधों को सामान्य प्रकाशन/बैकफ़िल कार्य से आगे प्राथमिकता दी जाती है, लेकिन पूरा होना फिर भी वर्कर उपलब्धता पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

सबमिट किए गए स्कैन के लिए प्रमाणित पोल एंडपॉइंट।

- queued/running/succeeded/failed स्थिति लौटाता है।
- queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है ताकि क्लाइंट दिखा सकें कि अनुरोध से पहले कितने प्राथमिकता वाले मैनुअल स्कैन हैं। बहुत बड़ी कतारें सीमित की जाती हैं और `queuedAheadIsEstimate: true` के साथ रिपोर्ट की जाती हैं।
- उपलब्ध होने पर, `report` में `clawscan`, `skillspector`, `staticAnalysis`, और `virustotal` अनुभाग होते हैं।
- विफल स्कैन जॉब्स `lastError` के साथ `status: "failed"` लौटाते हैं।

### `GET /api/v1/skills/-/scan/{scanId}/download`

प्रमाणित रिपोर्ट आर्काइव एंडपॉइंट।

- सफल स्कैन आवश्यक है; नॉन-टर्मिनल स्कैन `409` लौटाते हैं।
- `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json`, और `README.md` के साथ ZIP लौटाता है।

### `GET /api/v1/skills/-/scan/download/{name}?version=<version>&kind=skill|plugin`

सबमिट किए गए संस्करणों के लिए प्रमाणित संग्रहित रिपोर्ट आर्काइव एंडपॉइंट।

- कौशल या Plugin पर स्वामी/प्रकाशक प्रबंधन पहुँच, या प्लेटफ़ॉर्म मॉडरेटर/एडमिन अधिकार आवश्यक हैं।
- सटीक सबमिट किए गए संस्करण के लिए संग्रहित स्कैन परिणाम लौटाता है, जिसमें अवरुद्ध या छिपे हुए संस्करण भी शामिल हैं।
- `kind` का डिफ़ॉल्ट `skill` है; plugin/package स्कैन के लिए `kind=plugin` का उपयोग करें।
- स्कैन-अनुरोध डाउनलोड जैसी ही ZIP संरचना लौटाता है।

### `POST /api/v1/skills/-/scan/batch`

केवल एडमिन के लिए कैनॉनिकल बैच रीस्कैन रूट। यह पुराने `POST /api/v1/skills/-/rescan-batch` जैसी ही पेलोड संरचना स्वीकार करता है।

### `POST /api/v1/skills/-/scan/batch/status`

केवल एडमिन के लिए कैनॉनिकल बैच स्थिति रूट। यह `{ "jobIds": ["..."] }` स्वीकार करता है और पुराने `POST /api/v1/skills/-/rescan-batch/status` जैसे ही समेकित काउंटर लौटाता है।

### `GET /api/v1/skills/{slug}/verify`

`clawhub skill verify` द्वारा उपयोग किया जाने वाला Skill Card सत्यापन एनवलप लौटाता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक): विशिष्ट संस्करण स्ट्रिंग।
- `tag` (वैकल्पिक): टैग किए गए संस्करण को रिज़ॉल्व करें (उदाहरण के लिए `latest`)।

नोट्स:

- `ok` केवल तब `true` होता है जब चयनित संस्करण में जनरेट किया गया Skill Card हो, वह मॉडरेशन द्वारा मैलवेयर-अवरुद्ध न हो, और ClawScan सत्यापन clean हो।
- कौशल पहचान, प्रकाशक पहचान, और चयनित संस्करण मेटाडेटा शीर्ष-स्तरीय एनवलप फ़ील्ड (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि shell automation उन्हें नेस्टेड wrappers अनपैक किए बिना पढ़ सके।
- `security` शीर्ष-स्तरीय ClawScan/security निर्णय है। ऑटोमेशन को `ok`, `decision`, `reasons`, और `security.status` पर आधारित होना चाहिए।
- `security.signals` में सहायक स्कैनर प्रमाण होता है, जैसे `staticScan`, `virusTotal`, और `skillSpector`।
- `security.signals.dependencyRegistry` v1 प्रतिक्रिया संगतता के लिए बनाए रखा गया है, लेकिन dependency registry existence scanner सेवानिवृत्त हो चुका है और यह कुंजी हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path को रिज़ॉल्व और संग्रहित किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

सटीक कौशल संस्करणों के लिए वर्तमान संक्षिप्त security verdicts लौटाता है। यह collection endpoint उन क्लाइंट्स के लिए है जिन्हें पहले से पता है कि उन्हें कौन से इंस्टॉल किए गए ClawHub कौशल संस्करण दिखाने हैं, जैसे OpenClaw Control UI।

अनुरोध:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

नोट्स:

- `items` में 1-100 अद्वितीय `{ slug, version }` जोड़े होने चाहिए।
- परिणाम प्रति आइटम होते हैं; एक अनुपस्थित कौशल या संस्करण पूरी प्रतिक्रिया को विफल नहीं करता।
- प्रतिक्रिया केवल सुरक्षा-संबंधी है। इसमें Skill Card डेटा, जनरेट की गई कार्ड स्थिति, artifact file lists, या विस्तृत scanner payloads शामिल नहीं हैं।
- `security.signals` में केवल स्थिति-स्तर का सहायक प्रमाण होता है; पूर्ण scanner विवरणों के लिए `/scan` या ClawHub security-audit पेज का उपयोग करें।
- `security.signals.dependencyRegistry` v1 प्रतिक्रिया संगतता के लिए बनाए रखा गया है, लेकिन dependency registry existence scanner सेवानिवृत्त हो चुका है और यह कुंजी हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; जब क्लाइंट्स को कार्ड सामग्री चाहिए, तो उन्हें इंस्टॉल किया गया `skill-card.md` स्थानीय रूप से पढ़ना चाहिए।
- जब आपको single-skill Skill Card verification envelope चाहिए तो `/verify` का उपयोग करें, generated card markdown चाहिए तो `/card` का उपयोग करें, और detailed scanner data चाहिए तो `/scan` का उपयोग करें।

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
- फ़ाइल आकार सीमा: 200KB।

### `GET /api/v1/packages`

इनके लिए एकीकृत कैटलॉग endpoint:

- skills
- code plugins
- bundle plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): integer (1–100)
- `cursor` (वैकल्पिक): pagination cursor
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, legacy alias `installs`
- `category` (वैकल्पिक): plugin category filter। केवल तब समर्थित जब
  request plugin packages (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या package endpoints with
  `family=code-plugin`/`family=bundle-plugin`) तक scoped हो। Controlled categories और
  legacy v1 filter aliases `GET /api/v1/plugins` के अंतर्गत documented हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` fixed-family aliases बने रहते हैं।
- Skill entries skill registry द्वारा backed रहती हैं और अभी भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अभी भी केवल code-plugin और bundle-plugin releases के लिए है।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers list/search results में उन publishers के private packages देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/packages/search`

skills + plugin packages में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): query string
- `limit` (वैकल्पिक): integer (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin category filter। केवल तब समर्थित जब
  request plugin packages तक scoped हो। Controlled categories और legacy v1
  filter aliases `GET /api/v1/plugins` के अंतर्गत documented हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers उन publishers के private packages खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin packages में Plugin-only कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): integer (1-100)
- `cursor` (वैकल्पिक): pagination cursor
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, legacy alias `installs`
- `category` (वैकल्पिक): plugin category filter। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

Legacy v1 filter aliases read endpoints पर स्वीकार किए जाते रहेंगे:

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
- `limit` (वैकल्पिक): integer (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले response से pagination cursor।

Response:

- Body: ZIP archive।
- प्रत्येक exported skill `{publisher}/{slug}/` पर rooted है।
- Hosted skills में latest stored version files शामिल होती हैं और
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ listed होती हैं।
- `clean` या `suspicious` scan वाली current GitHub-backed skills में
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

ऑफलाइन विश्लेषण के लिए नवीनतम सार्वजनिक प्लगइन रिलीज़ का बल्क निर्यात।

प्रमाणीकरण:

- API टोकन आवश्यक है।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): प्लगइन `updatedAt` के लिए Unix मिलीसेकंड निचली सीमा।
- `endDate` (आवश्यक): प्लगइन `updatedAt` के लिए Unix मिलीसेकंड ऊपरी सीमा।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले प्रत्युत्तर से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ दोनों
  प्लगइन परिवार हैं।

प्रत्युत्तर:

- बॉडी: ZIP आर्काइव।
- हर निर्यात किया गया प्लगइन `{family}/{packageName}/` पर रूट किया जाता है।
- हर निर्यात किए गए प्लगइन में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-प्लगइन निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट में शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग प्लगइन या फ़ाइलें निर्यात नहीं की जा
  सकीं।

हेडर:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

code-plugin और bundle-plugin पैकेजों में केवल-प्लगइन खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): प्लगइन श्रेणी फ़िल्टर। मौजूदा मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

नोट्स:

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित लेगेसी v1 फ़िल्टर उपनाम भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग प्लगइन श्रेणी डाइजेस्ट
  पंक्तियों द्वारा समर्थित वास्तविक API फ़िल्टर है, कोई खोज-क्वेरी रीराइट नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और अभी पेजिनेट नहीं होते।
- प्लगइन खोज के लिए ब्राउज़र UI सॉर्ट नियंत्रण लोड किए गए प्रासंगिकता परिणामों को फिर से क्रमबद्ध करते हैं,
  जो मौजूदा `/skills` ब्राउज़ व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज विवरण मेटाडेटा लौटाता है।

नोट्स:

- Skills एकीकृत कैटलॉग में इस रूट के माध्यम से भी रिज़ॉल्व हो सकते हैं।
- निजी पैकेज `404` लौटाते हैं जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

एक पैकेज और सभी रिलीज़ को सॉफ्ट-डिलीट करता है।

नोट्स:

- पैकेज स्वामी, संगठन प्रकाशक स्वामी/एडमिन, प्लेटफ़ॉर्म मॉडरेटर, या प्लेटफ़ॉर्म एडमिन के लिए API टोकन आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

संस्करण इतिहास लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

नोट्स:

- निजी पैकेज `404` लौटाते हैं जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

फ़ाइल मेटाडेटा, संगतता,
सत्यापन, आर्टिफैक्ट मेटाडेटा, और स्कैन डेटा सहित एक पैकेज संस्करण लौटाता है।

नोट्स:

- `version.artifact.kind` पुराने पैकेज आर्काइव के लिए `legacy-zip` या
  ClawPack-समर्थित रिलीज़ के लिए `npm-pack` होता है।
- ClawPack रिलीज़ में npm-संगत `npmIntegrity`, `npmShasum`, और
  `npmTarballName` फ़ील्ड शामिल होते हैं।
- `version.sha256hash` पुराने क्लाइंट के लिए अप्रचलित संगतता मेटाडेटा है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए ठीक ZIP बाइट्स को हैश करता है।
  आधुनिक क्लाइंट को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  कैननिकल रिलीज़ आर्टिफैक्ट की पहचान करता है।
- `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan` तब
  शामिल होते हैं जब स्कैन डेटा मौजूद होता है।
- निजी पैकेज `404` लौटाते हैं जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

इंस्टॉल क्लाइंट के लिए सटीक पैकेज रिलीज़ सुरक्षा और भरोसा सारांश लौटाता है।
यह यह तय करने के लिए सार्वजनिक OpenClaw उपभोग सतह है कि कोई
रिज़ॉल्व की गई रिलीज़ इंस्टॉल की जा सकती है या नहीं।

प्रमाणीकरण:

- सार्वजनिक रीड एंडपॉइंट। कोई स्वामी, प्रकाशक, मॉडरेटर, या एडमिन टोकन
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

- `package.name`, `package.displayName`, और `package.family` रिज़ॉल्व किए गए
  रजिस्ट्री पैकेज की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt` उस सटीक
  रिलीज़ की पहचान करते हैं जिसका मूल्यांकन किया गया था।
- `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` रिलीज़ आर्टिफैक्ट के लिए
  ज्ञात होने पर मौजूद होते हैं।
- `trust.scanStatus` स्कैनर इनपुट और मैन्युअल रिलीज़ मॉडरेशन से निकाली गई
  प्रभावी भरोसा स्थिति है।
- `trust.moderationState` nullable है। जब कोई मैन्युअल रिलीज़
  मॉडरेशन मौजूद नहीं होता, तो यह `null` होता है।
- `trust.blockedFromDownload` इंस्टॉल ब्लॉक संकेत है। OpenClaw और अन्य
  इंस्टॉल क्लाइंट को यह मान `true` होने पर स्कैनर या मॉडरेशन फ़ील्ड से
  ब्लॉकिंग नियम दोबारा निकालने के बजाय इंस्टॉलेशन ब्लॉक करना चाहिए।
- `trust.reasons` उपयोगकर्ता-दिखने वाली और ऑडिट व्याख्या सूची है। कारण कोड
  स्थिर, संक्षिप्त स्ट्रिंग होते हैं जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक भरोसा इनपुट अभी भी पूर्णता की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि भरोसा सारांश पुराने इनपुट से गणना किया गया था और
  उच्च-विश्वास allow निर्णय से पहले इसे रीफ्रेश की आवश्यकता के रूप में माना जाना चाहिए।

नोट्स:

- यह एंडपॉइंट संस्करण-सटीक है। क्लाइंट को इसे उस पैकेज संस्करण को रिज़ॉल्व करने के बाद कॉल करना चाहिए
  जिसे वे इंस्टॉल करना चाहते हैं, केवल नवीनतम पैकेज मेटाडेटा पढ़ने के बाद नहीं।
- निजी पैकेज `404` लौटाते हैं जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।
- यह एंडपॉइंट स्वामी/मॉडरेटर मॉडरेशन
  एंडपॉइंट की तुलना में जानबूझकर संकरा है। यह इंस्टॉल निर्णय और सार्वजनिक व्याख्या को उजागर करता है,
  रिपोर्टर पहचान, रिपोर्ट बॉडी, निजी प्रमाण, या आंतरिक समीक्षा
  टाइमलाइन को नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी पैकेज संस्करण के लिए स्पष्ट आर्टिफैक्ट रिज़ॉल्वर मेटाडेटा लौटाता है।

नोट्स:

- लेगेसी पैकेज संस्करण `legacy-zip` आर्टिफैक्ट और लेगेसी ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack संस्करण `npm-pack` आर्टिफैक्ट, npm integrity फ़ील्ड,
  `tarballUrl`, और लेगेसी ZIP संगतता URL लौटाते हैं।
- यह OpenClaw रिज़ॉल्वर सतह है; यह साझा URL से
  आर्काइव फ़ॉर्मेट का अनुमान लगाने से बचती है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

स्पष्ट रिज़ॉल्वर पथ के माध्यम से संस्करण आर्टिफैक्ट डाउनलोड करता है।

नोट्स:

- ClawPack संस्करण अपलोड किए गए ठीक npm-pack `.tgz` बाइट्स स्ट्रीम करते हैं।
- लेगेसी ZIP संस्करण `/api/v1/packages/{name}/download?version=` पर रीडायरेक्ट करते हैं।
- डाउनलोड दर बकेट का उपयोग करता है।

### `GET /api/v1/packages/{name}/readiness`

भविष्य के OpenClaw उपभोग के लिए गणना की गई तैयारी लौटाता है।

तैयारी जांचें कवर करती हैं:

- आधिकारिक चैनल स्थिति
- नवीनतम संस्करण उपलब्धता
- ClawPack npm-pack आर्टिफैक्ट उपलब्धता
- आर्टिफैक्ट डाइजेस्ट
- स्रोत रिपो और कमिट उद्गम
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

आधिकारिक OpenClaw प्लगइन माइग्रेशन पंक्तियां सूचीबद्ध करने के लिए मॉडरेटर एंडपॉइंट।

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

आधिकारिक प्लगइन माइग्रेशन पंक्ति बनाने या अपडेट करने के लिए एडमिन एंडपॉइंट।

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
- `packageName` npm-name सामान्यीकृत है; नियोजित
  माइग्रेशन के लिए पैकेज अनुपस्थित हो सकता है।
- यह केवल माइग्रेशन तैयारी को ट्रैक करता है। यह OpenClaw को परिवर्तित नहीं करता या
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

- `open`: संदिग्ध, दुर्भावनापूर्ण, लंबित, क्वारंटीन, निरस्त, या रिपोर्ट की गई रिलीज़।
- `blocked`: क्वारंटीन, निरस्त, या दुर्भावनापूर्ण रिलीज़।
- `manual`: मैन्युअल मॉडरेशन ओवरराइड वाली कोई भी रिलीज़।
- `all`: मैन्युअल ओवरराइड, non-clean स्कैन स्थिति, या पैकेज रिपोर्ट वाली कोई भी रिलीज़।

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

मॉडरेटर समीक्षा के लिए पैकेज रिपोर्ट करें। रिपोर्ट पैकेज-स्तर की होती हैं, वैकल्पिक रूप से
किसी संस्करण से लिंक की जाती हैं। वे मॉडरेशन कतार में जाती हैं लेकिन स्वयं
डाउनलोड को auto-hide या ब्लॉक नहीं करतीं; मॉडरेटर को आर्टिफैक्ट को
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

पैकेज रिपोर्ट स्वीकार करने के लिए मॉडरेटर/admin endpoint.

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

पैकेज मॉडरेशन दृश्यता के लिए स्वामी/मॉडरेटर endpoint.

प्रमाणीकरण:

- पैकेज स्वामी, प्रकाशक सदस्य, मॉडरेटर, या admin उपयोगकर्ता के लिए API टोकन
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

पैकेज रिपोर्ट हल करने या फिर से खोलने के लिए मॉडरेटर/admin endpoint.

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open` पर
सेट करते समय इसे छोड़ा जा सकता है। उसी ऑडिट-योग्य वर्कफ़्लो में रिलीज़ मॉडरेशन लागू करने के लिए
पुष्ट रिपोर्ट के साथ `finalAction: "quarantine"` या `finalAction: "revoke"` पास करें।

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

पैकेज रिलीज़ समीक्षा के लिए मॉडरेटर/admin endpoint.

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित स्थितियां:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई।
- `quarantined`: फ़ॉलो-अप लंबित होने तक अवरुद्ध।
- `revoked`: किसी रिलीज़ पर पहले भरोसा किए जाने के बाद अवरुद्ध।

क्वारंटीन की गई और निरस्त रिलीज़ artifact डाउनलोड रूट से `403` लौटाती हैं।
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
- फ़ाइल आकार सीमा: 200KB.
- लंबित VirusTotal स्कैन रीड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ अभी भी कहीं और रोकी जा सकती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी प्रकाशक को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/download`

किसी पैकेज रिलीज़ के लिए legacy deterministic ZIP आर्काइव डाउनलोड करता है।

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ का उपयोग करता है।
- Skills `GET /api/v1/download` पर रीडायरेक्ट करती हैं।
- Plugin/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें हैं, ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें।
- यह रूट केवल ZIP रहता है। यह ClawPack `.tgz` फ़ाइलें स्ट्रीम नहीं करता।
- प्रतिक्रियाओं में resolver integrity checks के लिए `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं।
- केवल-Registry मेटाडेटा डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता।
- लंबित VirusTotal स्कैन डाउनलोड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं।
- निजी पैकेज `404` लौटाते हैं, जब तक कॉलर स्वामी न हो।

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत packument लौटाता है।

नोट्स:

- केवल अपलोड किए गए ClawPack npm-pack tarballs वाले संस्करण सूचीबद्ध होते हैं।
- legacy ZIP-only संस्करण जानबूझकर छोड़े जाते हैं।
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत
  फ़ील्ड का उपयोग करते हैं ताकि उपयोगकर्ता चाहें तो npm को mirror पर इंगित कर सकें।
- Scoped पैकेज packuments `/api/npm/@scope/name` और npm के
  encoded `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं।

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm mirror क्लाइंट के लिए ठीक वही अपलोड किए गए ClawPack tarball bytes स्ट्रीम करता है।

नोट्स:

- डाउनलोड रेट बकेट का उपयोग करता है।
- डाउनलोड हेडर में ClawHub SHA-256 और npm integrity/shasum मेटाडेटा शामिल होते हैं।
- मॉडरेशन और निजी पैकेज एक्सेस जांचें अभी भी लागू होती हैं।

### `GET /api/v1/resolve`

CLI द्वारा local fingerprint को ज्ञात संस्करण से मैप करने के लिए उपयोग किया जाता है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): bundle fingerprint का 64-अक्षर hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

किसी hosted skill version ZIP को डाउनलोड करता है, या किसी
current GitHub-backed skill के लिए GitHub source handoff लौटाता है जिसके पास `clean` या `suspicious` स्कैन है और कोई hosted
version नहीं है।

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver string
- `tag` (वैकल्पिक): टैग नाम (उदा. `latest`)

नोट्स:

- यदि `version` और `tag` में से कोई भी प्रदान नहीं किया गया है, तो नवीनतम संस्करण उपयोग किया जाता है।
- Soft-deleted versions `410` लौटाते हैं।
- GitHub-backed skill handoffs bytes को proxy या mirror नहीं करते। JSON प्रतिक्रिया में
  `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; scan/current state एक gate है और इसे सफलता
  payload metadata के रूप में शामिल नहीं किया जाता।
- डाउनलोड आंकड़े प्रति UTC दिन unique identities के रूप में गिने जाते हैं (`userId` जब API टोकन मान्य हो, अन्यथा IP)।

## प्रमाणीकरण endpoints (Bearer token)

सभी endpoints को आवश्यकता होती है:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन को मान्य करता है और उपयोगकर्ता handle लौटाता है।

### `POST /api/v1/skills`

एक नया संस्करण प्रकाशित करता है।

- प्राथमिकता: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`.
- `files` (storageId-based) वाली JSON body भी स्वीकार की जाती है।
- वैकल्पिक payload फ़ील्ड: `ownerHandle`. मौजूद होने पर, API उस
  publisher को server-side resolve करता है और actor के पास publisher access होना आवश्यक है।
- वैकल्पिक payload फ़ील्ड: `migrateOwner`. `ownerHandle` के साथ `true` होने पर,
  actor मौजूदा और लक्ष्य publishers दोनों पर admin/owner हो तो
  कोई existing skill उस owner पर जा सकती है। इस opt-in के बिना, owner changes
  अस्वीकार किए जाते हैं।

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है।

- Bearer token auth आवश्यक है।
- `multipart/form-data` आवश्यक है।
- अनुमत form fields हैं `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  tarball reference. `clawpack` कोई `.tgz` blob या upload-url flow द्वारा लौटाई गई storage id हो सकती है।
  Staged storage-id publishes में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए।
- एक ही अनुरोध में `files` या `clawpack` में से किसी एक का उपयोग करें, दोनों का कभी नहीं।
- JSON bodies और caller-supplied `payload.files` / `payload.artifact`
  metadata अस्वीकार किए जाते हैं।
- Direct multipart publish requests 18MB पर capped हैं। ClawPack tarballs
  upload-url flow का उपयोग 120MB tarball cap तक कर सकते हैं।
- वैकल्पिक payload फ़ील्ड: `ownerHandle`. मौजूद होने पर, केवल admins उस owner की ओर से प्रकाशित कर सकते हैं।

Validation highlights:

- `family` `code-plugin` या `bundle-plugin` होना चाहिए।
- Plugin पैकेजों के लिए `openclaw.plugin.json` आवश्यक है। ClawPack `.tgz` uploads में
  यह `package/openclaw.plugin.json` पर होना चाहिए।
- Code plugins के लिए `package.json`, source repo metadata, source commit
  metadata, config schema metadata, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं।
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक मेटाडेटा हैं।
- केवल `openclaw` org publisher और वर्तमान `openclaw` org सदस्यों के
  personal publishers `official` channel पर प्रकाशित कर सकते हैं।
- On-behalf publishes अब भी target owner account के विरुद्ध official-channel eligibility validate करते हैं।

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

किसी skill को soft-delete / restore करें (owner, moderator, या admin).

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` को skill moderation note के रूप में संग्रहीत किया जाता है और audit log में कॉपी किया जाता है।
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

केवल admin. किसी handle के लिए org publisher मौजूद होना सुनिश्चित करता है। यदि handle अभी भी
legacy shared user/personal publisher की ओर इशारा करता है, तो endpoint पहले उसे org publisher में migrate करता है।
नए बनाए गए org के लिए, `memberHandle` प्रदान करें; acting admin को member के रूप में नहीं जोड़ा जाता।
`memberRole` डिफ़ॉल्ट रूप से `owner` होता है।

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authenticated self-serve org publisher creation. नया org publisher बनाता है और
caller को owner के रूप में जोड़ता है। यह endpoint मौजूदा user/personal handles migrate नहीं करता और
publisher को trusted/official mark नहीं करता।

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब handle पहले से किसी publisher, user, या personal publisher द्वारा उपयोग किया जा रहा हो तो `409` लौटाता है।

### `POST /api/v1/users/reserve`

केवल admin. रिलीज़ प्रकाशित किए बिना rightful owner के लिए root slugs और package names reserve करता है।
Package names बिना release rows वाले private placeholder packages बन जाते हैं, ताकि वही
owner बाद में वास्तविक code-plugin या bundle-plugin release को उस नाम में प्रकाशित कर सके।

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल admin. Convex Auth account rows संपादित किए बिना verified replacement GitHub OAuth principal
के लिए personal publisher recover करता है। अनुरोध में दोनों immutable GitHub
provider account ids का नाम होना चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग किए जाते हैं।

एंडपॉइंट डिफ़ॉल्ट रूप से ड्राई-रन होता है। रिकवरी लागू करने के लिए कर्मचारियों द्वारा दोनों
GitHub principals के बीच निरंतरता स्वतंत्र रूप से सत्यापित करने के बाद `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं। जब गंतव्य उपयोगकर्ता के वर्तमान निजी
प्रकाशक के पास Skills, packages, या GitHub skill sources हों, तो रिकवरी बंद अवस्था में विफल होती है।
रिकवरी, पुनर्प्राप्त प्रकाशक के Skills, skill slug aliases, packages, package inspector warnings,
और derived search digest rows के लिए legacy `ownerUserId` फ़ील्ड भी माइग्रेट करती है ताकि
direct-owner paths नए publisher authority से मेल खाएँ। पुनर्प्राप्त handle के लिए सक्रिय protected-handle
reservation भी replacement user को फिर से असाइन किया जाता है ताकि बाद की
profile synchronization पूर्व उपयोगकर्ता की प्रतिस्पर्धी authority को बहाल न कर सके। प्रत्येक primary table
प्रति apply transaction 100 rows तक सीमित है; बड़ी recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped होते हैं और rewrite किए जाने के बजाय checked के रूप में रिपोर्ट किए जाते हैं।

- बॉडी: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- प्रतिक्रिया: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug management endpoints

- `POST /api/v1/skills/{slug}/rename`
  - बॉडी: `{ "newSlug": "new-canonical-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - बॉडी: `{ "targetSlug": "canonical-target-slug" }`
  - प्रतिक्रिया: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

नोट्स:

- दोनों endpoints को API token auth की आवश्यकता होती है और ये केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` source listing को छिपाता है और source slug को target listing पर redirect करता है।

### स्वामित्व स्थानांतरण endpoints

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

किसी उपयोगकर्ता को unban करें और पात्र Skills restore करें (केवल admin).

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

Unban किए बिना या content restore किए बिना मौजूदा ban का stored reason बदलें
(केवल admin). जब तक `dryRun` `false` न हो, यह डिफ़ॉल्ट रूप से dry-run होता है।

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

उपयोगकर्ताओं की सूची दें या खोजें (केवल admin).

Query params:

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

Star जोड़ें/हटाएँ (highlights). दोनों endpoints idempotent हैं।

प्रतिक्रियाएँ:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI endpoints (deprecated)

पुराने CLI versions के लिए अब भी समर्थित:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

Removal plan के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। ऐसे Package
publishes जो ClawPack tarball stage करते हैं, उन्हें परिणामी storage id को
`clawpack` और लौटाए गए ticket को `clawpackUploadTicket` के रूप में भेजना होगा।

## Registry discovery (`/.well-known/clawhub.json`)

CLI site से registry/auth settings discover कर सकता है:

- `/.well-known/clawhub.json` (JSON, preferred)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो यह file serve करें (या `CLAWHUB_REGISTRY` स्पष्ट रूप से set करें; legacy `CLAWDHUB_REGISTRY`).
