---
read_when:
    - एंडपॉइंट जोड़ना/बदलना
    - CLI ↔ रजिस्ट्री अनुरोधों को डीबग करना
summary: HTTP API संदर्भ (सार्वजनिक + CLI endpoints + auth).
x-i18n:
    generated_at: "2026-07-01T12:58:52Z"
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
लेगेसी `/api/...` और `/api/cli/...` संगतता के लिए बने रहते हैं (`DEPRECATIONS.md` देखें)।
OpenAPI: `/api/v1/openapi.json`.

## सार्वजनिक कैटलॉग पुनः उपयोग

तृतीय-पक्ष निर्देशिकाएँ ClawHub Skills को सूचीबद्ध या खोजने के लिए सार्वजनिक रीड एंडपॉइंट का उपयोग कर सकती हैं। कृपया परिणामों को कैश करें, `429`/`Retry-After` का सम्मान करें, उपयोगकर्ताओं को कैनोनिकल ClawHub लिस्टिंग (`https://clawhub.ai/<owner>/skills/<slug>`) पर वापस लिंक करें, और तृतीय-पक्ष साइट के लिए ClawHub समर्थन का संकेत देने से बचें। सार्वजनिक API सतह के बाहर छिपी, निजी, या मॉडरेशन-अवरुद्ध सामग्री को मिरर करने का प्रयास न करें।

वेब स्लग शॉर्टकट रजिस्ट्री परिवारों में रिज़ॉल्व होते हैं, लेकिन API क्लाइंट को रूट
प्राथमिकता को फिर से बनाने के बजाय रीड एंडपॉइंट द्वारा लौटाए गए कैनोनिकल URL
का उपयोग करना चाहिए।

## दर सीमाएँ

प्रवर्तन मॉडल:

- अनाम अनुरोध: प्रति IP लागू।
- प्रमाणित अनुरोध (मान्य Bearer token): प्रति उपयोगकर्ता बकेट लागू।
- यदि token अनुपस्थित/अमान्य है, तो व्यवहार IP प्रवर्तन पर वापस चला जाता है।
- प्रमाणित राइट एंडपॉइंट को तब सिर्फ़ `Unauthorized` नहीं लौटाना चाहिए जब
  सर्वर कारण जानता हो। अनुपस्थित token, अमान्य/रद्द token, और
  हटाए गए/प्रतिबंधित/अक्षम खाते, प्रत्येक को कार्रवाई योग्य पाठ मिलना चाहिए ताकि CLI
  क्लाइंट उपयोगकर्ताओं को बता सकें कि उन्हें क्या रोक रहा है।

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
- `RateLimit-Reset`: रीसेट तक सेकंड (देरी)
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर सटीक शेष बजट।
  शार्ड किए गए सफल अनुरोध अनुमानित वैश्विक मान लौटाने के बजाय इस हेडर को छोड़ देते हैं।
- `Retry-After`: `429` पर पुनः प्रयास से पहले प्रतीक्षा करने के सेकंड (देरी)

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
- समन्वित पुनः प्रयासों से बचने के लिए jittered backoff का उपयोग करें।
- यदि `Retry-After` अनुपस्थित है, तो `RateLimit-Reset` पर वापस जाएँ (या `X-RateLimit-Reset` से गणना करें)।

IP स्रोत:

- विश्वसनीय क्लाइंट IP हेडर, जिनमें `cf-connecting-ip` शामिल है, केवल तब उपयोग करता है जब
  डिप्लॉयमेंट विश्वसनीय फ़ॉरवर्डेड हेडर को स्पष्ट रूप से सक्षम करता है।
- ClawHub edge पर क्लाइंट IP पहचानने के लिए विश्वसनीय फ़ॉरवर्डिंग हेडर का उपयोग करता है।
- यदि कोई विश्वसनीय क्लाइंट IP उपलब्ध नहीं है, तो अनाम अनुरोध फ़ॉलबैक बकेट का उपयोग करते हैं
  जो केवल दर-सीमा प्रकार के दायरे में होते हैं। इन फ़ॉलबैक बकेट में
  कॉलर-द्वारा-प्रदान किए गए पाथ, स्लग, पैकेज नाम, संस्करण, क्वेरी स्ट्रिंग, या अन्य
  आर्टिफ़ैक्ट पैरामीटर शामिल नहीं होते।

## त्रुटि प्रतिक्रियाएँ

सार्वजनिक v1 त्रुटि प्रतिक्रियाएँ `content-type: text/plain; charset=utf-8` के साथ सादा पाठ हैं।
इसमें वैलिडेशन विफलताएँ (`400`), अनुपस्थित सार्वजनिक संसाधन (`404`), auth और
अनुमति विफलताएँ (`401`/`403`), दर सीमाएँ (`429`), और अवरुद्ध डाउनलोड शामिल हैं। क्लाइंट को
प्रतिक्रिया बॉडी को मानव-पठनीय स्ट्रिंग के रूप में पढ़ना चाहिए। अज्ञात क्वेरी पैरामीटर
संगतता के लिए अनदेखे किए जाते हैं, लेकिन अमान्य मान वाले पहचाने गए क्वेरी पैरामीटर
`400` लौटाते हैं।

## सार्वजनिक एंडपॉइंट (कोई auth नहीं)

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

- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं (embedding similarity + exact slug/name token boosts + एक छोटा popularity prior)।
- प्रासंगिकता लोकप्रियता से अधिक मज़बूत है। कोई सटीक slug या display-name token मिलान, बहुत अधिक engagement वाले ढीले मिलान से ऊपर रैंक कर सकता है।
- ASCII पाठ को शब्द और विराम-चिह्न सीमाओं पर tokenized किया जाता है। उदाहरण के लिए, `personal-map` में standalone `map` token होता है, जबकि `amap-jsapi-skill` में `amap`, `jsapi`, और `skill` होते हैं; इसलिए `map` की खोज `amap-jsapi-skill` की तुलना में `personal-map` को अधिक मज़बूत lexical match देती है।
- लोकप्रियता log-scaled और capped है। उच्च-engagement Skills कम रैंक कर सकते हैं जब क्वेरी पाठ कमज़ोर मिलान हो।
- संदिग्ध या छिपी मॉडरेशन स्थिति, कॉलर फ़िल्टर और वर्तमान मॉडरेशन स्थिति के आधार पर किसी Skill को सार्वजनिक खोज से हटा सकती है।

प्रकाशक discoverability मार्गदर्शन:

- जिन शब्दों को उपयोगकर्ता सचमुच खोजेंगे उन्हें display name, summary, और tags में रखें। standalone slug token केवल तब उपयोग करें जब वह एक स्थिर पहचान भी हो जिसे आप रखना चाहते हैं।
- केवल एक क्वेरी के पीछे भागने के लिए slug का नाम न बदलें, जब तक नया slug बेहतर दीर्घकालिक कैनोनिकल नाम न हो। पुराने slugs redirect aliases बन जाते हैं, लेकिन कैनोनिकल URL, प्रदर्शित slug, और भविष्य के search digests नए slug का उपयोग करते हैं।
- Rename aliases पुराने URL और registry के माध्यम से resolve होने वाले installs के लिए resolution संरक्षित रखते हैं, लेकिन search ranking नाम बदलने के indexed होने के बाद कैनोनिकल Skill metadata पर आधारित होती है। मौजूदा stats Skill के साथ रहते हैं।
- यदि कोई Skill अप्रत्याशित रूप से अदृश्य है, तो ranking-संबंधित metadata बदलने से पहले लॉग इन रहते हुए `clawhub inspect @owner/slug` से पहले मॉडरेशन स्थिति जाँचें।

### `GET /api/v1/skills`

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–200)
- `cursor` (वैकल्पिक): किसी भी non-`trending` sort के लिए pagination cursor
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended` (alias: `default`), `createdAt` (alias: `newest`), `downloads`, `stars` (alias: `rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर map होते हैं, `trending`
- `nonSuspiciousOnly` (वैकल्पिक): संदिग्ध (`flagged.suspicious`) Skills छिपाने के लिए `true`
- `nonSuspicious` (वैकल्पिक): `nonSuspiciousOnly` के लिए लेगेसी alias

अमान्य `sort` मान `400` लौटाते हैं।

नोट्स:

- `recommended` engagement और recency संकेतों का उपयोग करता है।
- `trending` पिछले 7 दिनों में installs के आधार पर रैंक करता है (telemetry-based)।
- `createdAt` नए-Skill crawls के लिए स्थिर है; `updated` तब बदलता है जब मौजूदा Skills फिर से प्रकाशित किए जाते हैं।
- जब `nonSuspiciousOnly=true` हो, cursor-based sorts किसी पेज पर `limit` से कम items लौटा सकते हैं क्योंकि संदिग्ध Skills पेज retrieval के बाद फ़िल्टर किए जाते हैं।
- मौजूद होने पर pagination जारी रखने के लिए `nextCursor` का उपयोग करें। छोटा पेज अपने आप में end-of-results नहीं दर्शाता।

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

- owner rename/merge flows द्वारा बनाए गए पुराने slugs कैनोनिकल Skill पर resolve होते हैं।
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

- owners और moderators छिपे हुए Skills के लिए मॉडरेशन विवरणों तक पहुँच सकते हैं।
- सार्वजनिक callers को केवल पहले से flagged visible Skills के लिए `200` मिलता है।
- सार्वजनिक callers के लिए evidence redacted होता है और owners/moderators के लिए ही raw snippets शामिल करता है।

### `POST /api/v1/skills/{slug}/report`

moderator review के लिए Skill report करें। Reports Skill-level हैं, वैकल्पिक रूप से
किसी version से linked हैं, और Skill report queue में feed करते हैं।

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

`note` `confirmed` और `dismissed` के लिए आवश्यक है; `status` को वापस `open` पर
set करते समय इसे छोड़ा जा सकता है। उसी auditable workflow में Skill को hide करने के लिए triaged
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

- `version` (वैकल्पिक): विशिष्ट version string।
- `tag` (वैकल्पिक): tagged version resolve करें (उदाहरण के लिए `latest`)।

नोट्स:

- यदि `version` या `tag` में से कोई भी प्रदान नहीं किया गया है, तो नवीनतम संस्करण का उपयोग करता है।
- सामान्यीकृत सत्यापन स्थिति और scanner-विशिष्ट विवरण शामिल करता है।
- `security.hasScanResult` केवल तब `true` होता है जब किसी scanner ने निश्चित निर्णय (`clean`, `suspicious`, या `malicious`) दिया हो।
- `moderation` नवीनतम संस्करण से निकाला गया मौजूदा skill-स्तरीय moderation snapshot है।
- किसी ऐतिहासिक संस्करण को query करते समय, `moderation` और `security` को समान संस्करण संदर्भ मानने से पहले `moderation.matchesRequestedVersion` और `moderation.sourceVersion` जांचें।

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

टिप्पणियां:

- Scan request payloads और डाउनलोड करने योग्य reports retention window के बाद scan-request store से समाप्त हो जाते हैं।
- Published scans के लिए owner/publisher management access, या platform moderator/admin authority आवश्यक है।
- Published scans केवल तब वापस लिखते हैं जब `update: true` हो और scan सफलतापूर्वक पूरा हो।
- Response `202` है, जिसमें `{ "ok": true, "scanId": "...", "jobId": "...", "status": "queued", "sourceKind": "published", "update": false, "queue": { "queuedAhead": 0, "queuedAheadIsEstimate": false, "position": 1, "running": 0, "runningIsEstimate": false, "note": "Scans are asynchronous and may take time to complete." } }` होता है।
- Scan jobs asynchronous होते हैं। Manual scan requests को सामान्य publish/backfill work से पहले प्राथमिकता दी जाती है, लेकिन completion अभी भी worker availability पर निर्भर करता है।

### `GET /api/v1/skills/-/scan/{scanId}`

Submitted scan के लिए authenticated poll endpoint।

- Queued/running/succeeded/failed status लौटाता है।
- Queued रहते समय `queue.queuedAhead` और `queue.position` लौटाता है ताकि clients दिखा सकें कि request से आगे कितने prioritized manual scans हैं। बहुत बड़ी queues bounded होती हैं और `queuedAheadIsEstimate: true` के साथ report की जाती हैं।
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

- `version` (optional): specific version string।
- `tag` (optional): tagged version resolve करें (उदाहरण के लिए `latest`)।

टिप्पणियां:

- `ok` केवल तब `true` होता है जब selected version के पास generated Skill Card हो, moderation द्वारा malware-blocked न हो, और ClawScan verification clean हो।
- Skill identity, publisher identity, और selected version metadata top-level envelope fields (`slug`, `displayName`, `publisherHandle`, `version`, `resolvedFrom`, `tag`, `createdAt`) हैं ताकि shell automation nested wrappers unpack किए बिना उन्हें पढ़ सके।
- `security` top-level ClawScan/security verdict है। Automation को `ok`, `decision`, `reasons`, और `security.status` पर key करना चाहिए।
- `security.signals` में supporting scanner evidence होता है, जैसे `staticScan`, `virusTotal`, और `skillSpector`।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- `provenance` केवल तब `server-resolved-github-import` होता है जब ClawHub ने publish या import के दौरान GitHub repo/ref/commit/path resolve और store किया हो; अन्यथा यह `unavailable` होता है।

### `POST /api/v1/skills/-/security-verdicts`

Exact skill versions के लिए current compact security verdicts लौटाता है। यह collection endpoint उन clients के लिए है जो पहले से जानते हैं कि उन्हें कौन से installed ClawHub skill versions display करने हैं, जैसे OpenClaw Control UI।

Request:

```json
{
  "items": [{ "slug": "gifgrep", "version": "1.2.3" }]
}
```

टिप्पणियां:

- `items` में 1-100 unique `{ slug, version }` pairs होने चाहिए।
- Results per item होते हैं; एक missing skill या version पूरे response को fail नहीं करता।
- Response केवल security-only है। इसमें Skill Card data, generated card status, artifact file lists, या detailed scanner payloads शामिल नहीं हैं।
- `security.signals` में केवल status-level supporting evidence होता है; full scanner details के लिए `/scan` या ClawHub security-audit page का उपयोग करें।
- `security.signals.dependencyRegistry` v1 response compatibility के लिए रखा गया है, लेकिन dependency registry existence scanner retired है और यह key हमेशा `null` होती है।
- Skill Card की अनुपस्थिति इस endpoint के `ok`, `decision`, या `reasons` को प्रभावित नहीं करती; clients को card content चाहिए होने पर installed `skill-card.md` को locally पढ़ना चाहिए।
- Single-skill Skill Card verification envelope चाहिए होने पर `/verify`, generated card markdown चाहिए होने पर `/card`, और detailed scanner data चाहिए होने पर `/scan` का उपयोग करें।

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
- code plugins
- bundle plugins

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `updated` (डिफ़ॉल्ट), `recommended`, `trending`, `downloads`, legacy alias `installs`
- `category` (वैकल्पिक): plugin कैटेगरी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin packages (`/api/v1/plugins`,
  `/api/v1/code-plugins`, `/api/v1/bundle-plugins`, या
  `family=code-plugin`/`family=bundle-plugin` वाले package endpoints) तक सीमित हो।
  नियंत्रित कैटेगरियाँ और legacy v1 फ़िल्टर aliases `GET /api/v1/plugins`
  के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`,
  `highlightedOnly`, या `sort` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- `GET /api/v1/code-plugins` और `GET /api/v1/bundle-plugins` fixed-family aliases बने रहते हैं।
- Skill entries skill registry द्वारा समर्थित रहती हैं और अब भी केवल `POST /api/v1/skills` के माध्यम से प्रकाशित की जा सकती हैं।
- `POST /api/v1/packages` अभी भी केवल code-plugin और bundle-plugin releases के लिए है।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers list/search results में उन publishers के private packages देख सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/packages/search`

skills + plugin packages में एकीकृत कैटलॉग खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `family` (वैकल्पिक): `skill`, `code-plugin`, या `bundle-plugin`
- `channel` (वैकल्पिक): `official`, `community`, या `private`
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): plugin कैटेगरी फ़िल्टर। केवल तब समर्थित जब
  अनुरोध plugin packages तक सीमित हो। नियंत्रित कैटेगरियाँ और legacy v1
  फ़िल्टर aliases `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित हैं।

नोट्स:

- `family`, `channel`, `isOfficial`, `featured`, या
  `highlightedOnly` के अमान्य मान `400` लौटाते हैं। अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- Anonymous callers केवल public package channels देखते हैं।
- Authenticated callers उन publishers के private packages खोज सकते हैं जिनसे वे संबंधित हैं।
- `channel=private` केवल वे packages लौटाता है जिन्हें authenticated caller पढ़ सकता है।

### `GET /api/v1/plugins`

code-plugin और bundle-plugin packages में Plugin-only कैटलॉग ब्राउज़।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर
- `isOfficial` (वैकल्पिक): `true` या `false`
- `sort` (वैकल्पिक): `recommended` (डिफ़ॉल्ट), `trending`, `downloads`, `updated`, legacy alias `installs`
- `category` (वैकल्पिक): plugin कैटेगरी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`.

Legacy v1 फ़िल्टर aliases read endpoints पर स्वीकार किए जाते रहते हैं:

- `mcp-tooling`, `data`, और `automation` `tools` में resolve होते हैं।
- `observability` और `deployment` `gateway` में resolve होते हैं।
- `dev-tools` `runtime` में resolve होता है।

`trending` सात-दिवसीय install/download leaderboard है और all-time totals का उपयोग नहीं करता।
एकीकृत `/api/v1/packages` endpoint पर यह plugin-only है; skill catalog के लिए
`/api/v1/skills?sort=trending` का उपयोग करें।

Legacy aliases stored या author-declared category values के रूप में स्वीकार नहीं किए जाते।

### `GET /api/v1/skills/export`

ऑफ़लाइन विश्लेषण के लिए नवीनतम public skills का bulk export।

Auth:

- API token आवश्यक।

क्वेरी पैरामीटर:

- `startDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds lower bound।
- `endDate` (आवश्यक): skill `updatedAt` के लिए Unix milliseconds upper bound।
- `limit` (वैकल्पिक): पूर्णांक (1-250), डिफ़ॉल्ट `250`।
- `cursor` (वैकल्पिक): पिछले response से पेजिनेशन कर्सर।

Response:

- Body: ZIP archive।
- प्रत्येक exported skill `{publisher}/{slug}/` पर rooted है।
- Hosted skills में latest stored version files शामिल होती हैं और वे
  `_manifest.json` में `sourceRef: "public-clawhub"` के साथ listed होती हैं।
- `clean` या `suspicious` scan वाली वर्तमान GitHub-backed skills में
  `_source_handoff.json` शामिल होता है, जिसमें `sourceRef: "public-github"`, repo, commit, path,
  content hash, और archive URL होते हैं। उनमें ClawHub-hosted source files शामिल नहीं होतीं।
- प्रत्येक skill में `_export_skill_meta.json` शामिल होता है।
- `_manifest.json` हमेशा ZIP root पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब individual skills या files
  export नहीं किए जा सके।

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
- `cursor` (वैकल्पिक): पिछली प्रतिक्रिया से पेजिनेशन कर्सर।
- `family` (वैकल्पिक): `code-plugin` या `bundle-plugin`। छोड़े जाने का अर्थ है दोनों
  Plugin families।

प्रतिक्रिया:

- बॉडी: ZIP आर्काइव।
- प्रत्येक निर्यातित Plugin `{family}/{packageName}/` पर रूट किया जाता है।
- प्रत्येक निर्यातित Plugin में नवीनतम रिलीज़ की संग्रहीत फ़ाइलें शामिल होती हैं।
- प्रति-Plugin निर्यात मेटाडेटा
  `__clawhub_export/{family}/{packageName}/plugin_meta.json` पर संग्रहीत होता है।
- `_manifest.json` हमेशा ZIP रूट पर शामिल होता है।
- `_errors.json` तब शामिल होता है जब अलग-अलग Plugins या फ़ाइलें
  निर्यात नहीं की जा सकीं।

शीर्षलेख:

- `X-Next-Cursor`
- `X-Has-More`
- `X-Total-Returned`
- `X-Date-Range`
- `X-Export-Errors`

### `GET /api/v1/plugins/search`

`code-plugin` और `bundle-plugin` पैकेजों में केवल Plugin खोज।

क्वेरी पैरामीटर:

- `q` (आवश्यक): क्वेरी स्ट्रिंग
- `limit` (वैकल्पिक): पूर्णांक (1-100)
- `isOfficial` (वैकल्पिक): `true` या `false`
- `category` (वैकल्पिक): Plugin श्रेणी फ़िल्टर। वर्तमान मान:
  `channels`, `models`, `memory`, `context`, `voice`, `media`, `web`,
  `tools`, `runtime`, `gateway`, `security`, `other`।

टिप्पणियाँ:

- `GET /api/v1/plugins` के अंतर्गत दस्तावेज़ित legacy v1 फ़िल्टर aliases भी
  स्वीकार किए जाते हैं।
- श्रेणी फ़िल्टरिंग एक वास्तविक API फ़िल्टर है, जो Plugin श्रेणी digest
  rows द्वारा समर्थित है, search-query rewrite नहीं।
- परिणाम प्रासंगिकता क्रम में लौटाए जाते हैं और वर्तमान में paginate नहीं होते।
- Plugin खोज के लिए ब्राउज़र UI sort controls लोड किए गए प्रासंगिकता परिणामों को पुनः क्रमित करते हैं,
  जो वर्तमान `/skills` browse व्यवहार से मेल खाते हैं।

### `GET /api/v1/packages/{name}`

पैकेज detail metadata लौटाता है।

टिप्पणियाँ:

- Skills unified catalog में इस route के माध्यम से भी resolve हो सकते हैं।
- Private पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `DELETE /api/v1/packages/{name}`

किसी पैकेज और सभी रिलीज़ को soft-delete करता है।

टिप्पणियाँ:

- पैकेज owner, org publisher owner/admin,
  platform moderator, या platform admin के लिए API token आवश्यक है।

### `GET /api/v1/packages/{name}/versions`

version history लौटाता है।

क्वेरी पैरामीटर:

- `limit` (वैकल्पिक): पूर्णांक (1–100)
- `cursor` (वैकल्पिक): पेजिनेशन कर्सर

टिप्पणियाँ:

- Private पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}`

एक पैकेज version लौटाता है, जिसमें file metadata, compatibility,
verification, artifact metadata, और scan data शामिल हैं।

टिप्पणियाँ:

- पुराने-विश्व package archives के लिए `version.artifact.kind` `legacy-zip` है या
  ClawPack-backed releases के लिए `npm-pack` है।
- ClawPack releases में npm-compatible `npmIntegrity`, `npmShasum`, और
  `npmTarballName` fields शामिल हैं।
- `version.sha256hash` पुराने clients के लिए deprecated compatibility metadata है। यह
  `/api/v1/packages/{name}/download` द्वारा लौटाए गए exact ZIP bytes को hash करता है।
  Modern clients को `version.artifact.sha256` का उपयोग करना चाहिए, जो
  canonical release artifact की पहचान करता है।
- scan data मौजूद होने पर `version.vtAnalysis`, `version.llmAnalysis`, और `version.staticScan`
  शामिल होते हैं।
- Private पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।

### `GET /api/v1/packages/{name}/versions/{version}/security`

install clients के लिए exact package release security और trust summary लौटाता है। यह
resolved release इंस्टॉल किया जा सकता है या नहीं तय करने के लिए public OpenClaw consumption surface है।

प्रमाणीकरण:

- Public read endpoint। किसी owner, publisher, moderator, या admin token की
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

प्रतिक्रिया fields:

- `package.name`, `package.displayName`, और `package.family`
  resolved registry package की पहचान करते हैं।
- `release.releaseId`, `release.version`, और `release.createdAt`
  evaluate की गई exact release की पहचान करते हैं।
- release artifact के लिए ज्ञात होने पर `release.artifactKind`, `release.artifactSha256`, `release.npmIntegrity`,
  `release.npmShasum`, और `release.npmTarballName` मौजूद होते हैं।
- `trust.scanStatus` scanner inputs
  और manual release moderation से निकाली गई effective trust status है।
- `trust.moderationState` nullable है। जब कोई manual release
  moderation मौजूद नहीं होता, यह `null` होता है।
- `trust.blockedFromDownload` install block signal है। OpenClaw और अन्य
  install clients को scanner या moderation fields से blocking rules पुनः निकालने के बजाय
  इस value के `true` होने पर installation block करनी चाहिए।
- `trust.reasons` user-facing और audit explanation list है। Reason codes
  स्थिर, संक्षिप्त strings होते हैं जैसे `manual:quarantined`, `scan:malicious`,
  और `package:malicious`।
- `trust.pending` का अर्थ है कि एक या अधिक trust inputs अभी भी completion की प्रतीक्षा कर रहे हैं।
- `trust.stale` का अर्थ है कि trust summary outdated inputs से compute की गई थी और
  high-confidence allow decision से पहले refresh आवश्यक मानना चाहिए।

टिप्पणियाँ:

- यह endpoint version-exact है। Clients को इसे उस package version को resolve करने के बाद call करना चाहिए
  जिसे वे install करना चाहते हैं, केवल latest package metadata पढ़ने के बाद नहीं।
- Private पैकेज `404` लौटाते हैं, जब तक caller owning publisher को पढ़ नहीं सकता।
- यह endpoint owner/moderator moderation
  endpoints से जानबूझकर संकरा है। यह install decision और public explanation expose करता है,
  reporter identities, report bodies, private evidence, या internal review
  timelines नहीं।

### `GET /api/v1/packages/{name}/versions/{version}/artifact`

किसी package version के लिए explicit artifact resolver metadata लौटाता है।

टिप्पणियाँ:

- Legacy package versions एक `legacy-zip` artifact और legacy ZIP
  `downloadUrl` लौटाते हैं।
- ClawPack versions एक `npm-pack` artifact, npm integrity fields, एक
  `tarballUrl`, और legacy ZIP compatibility URL लौटाते हैं।
- यह OpenClaw resolver surface है; यह shared URL से
  archive format का अनुमान लगाने से बचता है।

### `GET /api/v1/packages/{name}/versions/{version}/artifact/download`

explicit resolver path के माध्यम से version artifact डाउनलोड करता है।

टिप्पणियाँ:

- ClawPack versions exact uploaded npm-pack `.tgz` bytes stream करते हैं।
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

टिप्पणियाँ:

- `bundledPluginId` को lowercase में normalize किया जाता है और यह stable upsert key है।
- `packageName` npm-name normalized है; planned
  migrations के लिए package missing हो सकता है।
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

moderator review के लिए किसी package की report करें। Reports package-level होती हैं, वैकल्पिक रूप से
version से linked होती हैं। वे moderation queue को feed करती हैं लेकिन स्वयं downloads को auto-hide या
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

पैकेज रिपोर्ट इनटेक के लिए मॉडरेटर/एडमिन एंडपॉइंट.

प्रमाणीकरण:

- मॉडरेटर या एडमिन उपयोगकर्ता के लिए API टोकन आवश्यक है.

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

पैकेज मॉडरेशन दृश्यता के लिए स्वामी/मॉडरेटर एंडपॉइंट.

प्रमाणीकरण:

- पैकेज स्वामी, प्रकाशक सदस्य, मॉडरेटर, या एडमिन उपयोगकर्ता के लिए API टोकन
  आवश्यक है.

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

पैकेज रिपोर्ट हल करने या फिर से खोलने के लिए मॉडरेटर/एडमिन एंडपॉइंट.

अनुरोध:

```json
{
  "status": "confirmed",
  "note": "Reviewed and quarantined affected release.",
  "finalAction": "quarantine"
}
```

`confirmed` और `dismissed` के लिए `note` आवश्यक है; `status` को वापस `open`
पर सेट करते समय इसे छोड़ा जा सकता है. उसी ऑडिट योग्य वर्कफ़्लो में रिलीज़
मॉडरेशन लागू करने के लिए पुष्ट रिपोर्ट के साथ `finalAction: "quarantine"` या
`finalAction: "revoke"` पास करें.

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

पैकेज रिलीज़ समीक्षा के लिए मॉडरेटर/एडमिन एंडपॉइंट.

अनुरोध:

```json
{ "state": "quarantined", "reason": "Suspicious native payload." }
```

समर्थित अवस्थाएँ:

- `approved`: मैन्युअल रूप से समीक्षा की गई और अनुमति दी गई.
- `quarantined`: आगे की कार्रवाई लंबित होने तक अवरुद्ध.
- `revoked`: पहले विश्वसनीय मानी गई रिलीज़ के बाद अवरुद्ध.

क्वारंटीन की गई और निरस्त की गई रिलीज़ artifact डाउनलोड रूट से `403` लौटाती हैं.
हर बदलाव एक ऑडिट लॉग प्रविष्टि लिखता है.

### `GET /api/v1/packages/{name}/file`

पैकेज फ़ाइल के लिए कच्ची टेक्स्ट सामग्री लौटाता है.

क्वेरी पैरामीटर:

- `path` (आवश्यक)
- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ उपयोग होती है.
- डाउनलोड बकेट नहीं, रीड रेट बकेट का उपयोग करता है.
- बाइनरी फ़ाइलें `415` लौटाती हैं.
- फ़ाइल आकार सीमा: 200KB.
- लंबित VirusTotal स्कैन रीड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ फिर भी कहीं और रोकी जा सकती हैं.
- निजी पैकेज `404` लौटाते हैं जब तक कॉलर स्वामित्व वाले प्रकाशक को पढ़ नहीं सकता.

### `GET /api/v1/packages/{name}/download`

पैकेज रिलीज़ के लिए लेगेसी deterministic ZIP आर्काइव डाउनलोड करता है.

क्वेरी पैरामीटर:

- `version` (वैकल्पिक)
- `tag` (वैकल्पिक)

नोट्स:

- डिफ़ॉल्ट रूप से नवीनतम रिलीज़ उपयोग होती है.
- Skills `GET /api/v1/download` पर रीडायरेक्ट होती हैं.
- Plugin/पैकेज आर्काइव `package/` रूट वाली zip फ़ाइलें हैं ताकि पुराने OpenClaw
  क्लाइंट काम करते रहें.
- यह रूट केवल ZIP रहता है. यह ClawPack `.tgz` फ़ाइलें स्ट्रीम नहीं करता.
- resolver अखंडता जाँचों के लिए प्रतिक्रियाओं में `ETag`, `Digest`, `X-ClawHub-Artifact-Type`, और
  `X-ClawHub-Artifact-Sha256` हेडर शामिल होते हैं.
- केवल-Registry metadata डाउनलोड किए गए आर्काइव में इंजेक्ट नहीं किया जाता.
- लंबित VirusTotal स्कैन डाउनलोड को अवरुद्ध नहीं करते; दुर्भावनापूर्ण रिलीज़ `403` लौटाती हैं.
- निजी पैकेज `404` लौटाते हैं जब तक कॉलर स्वामी न हो.

### `GET /api/npm/{package}`

ClawPack-समर्थित पैकेज संस्करणों के लिए npm-संगत packument लौटाता है.

नोट्स:

- केवल अपलोड किए गए ClawPack npm-pack tarball वाले संस्करण सूचीबद्ध होते हैं.
- लेगेसी केवल-ZIP संस्करण जानबूझकर छोड़े जाते हैं.
- `dist.tarball`, `dist.integrity`, और `dist.shasum` npm-संगत
  फ़ील्ड का उपयोग करते हैं ताकि उपयोगकर्ता चाहें तो npm को mirror की ओर इंगित कर सकें.
- scoped पैकेज packuments `/api/npm/@scope/name` और npm के
  encoded `/api/npm/@scope%2Fname` अनुरोध पथ, दोनों का समर्थन करते हैं.

### `GET /api/npm/{package}/-/{tarball}.tgz`

npm mirror क्लाइंट के लिए ठीक वही अपलोड किए गए ClawPack tarball bytes स्ट्रीम करता है.

नोट्स:

- डाउनलोड रेट बकेट का उपयोग करता है.
- डाउनलोड हेडर में ClawHub SHA-256 और npm integrity/shasum metadata शामिल होते हैं.
- मॉडरेशन और निजी पैकेज एक्सेस जाँचें अब भी लागू होती हैं.

### `GET /api/v1/resolve`

CLI द्वारा स्थानीय fingerprint को ज्ञात संस्करण से मैप करने के लिए उपयोग किया जाता है.

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `hash` (आवश्यक): bundle fingerprint का 64-अक्षर hex sha256

प्रतिक्रिया:

```json
{ "slug": "gifgrep", "match": { "version": "1.2.2" }, "latestVersion": { "version": "1.2.3" } }
```

### `GET /api/v1/download`

होस्ट किया गया skill संस्करण ZIP डाउनलोड करता है, या वर्तमान GitHub-समर्थित skill
के लिए GitHub स्रोत handoff लौटाता है जिसके पास `clean` या `suspicious` स्कैन हो
और कोई होस्ट किया गया संस्करण न हो.

क्वेरी पैरामीटर:

- `slug` (आवश्यक)
- `version` (वैकल्पिक): semver string
- `tag` (वैकल्पिक): tag name (जैसे `latest`)

नोट्स:

- यदि न `version` दिया गया है न `tag`, तो नवीनतम संस्करण उपयोग होता है.
- soft-deleted संस्करण `410` लौटाते हैं.
- GitHub-समर्थित skill handoffs bytes को proxy या mirror नहीं करते. JSON प्रतिक्रिया
  में `sourceRef: "public-github"`, `repo`, `commit`, `path`, `contentHash`,
  और `archiveUrl` शामिल होते हैं; scan/current अवस्था एक gate है और सफलता
  payload metadata के रूप में शामिल नहीं होती.
- डाउनलोड आँकड़े प्रति UTC दिन अद्वितीय पहचान के रूप में गिने जाते हैं (`userId` जब API टोकन मान्य हो, अन्यथा IP).

## प्रमाणीकरण एंडपॉइंट्स (Bearer टोकन)

सभी एंडपॉइंट्स के लिए आवश्यक:

```
Authorization: Bearer clh_...
```

### `GET /api/v1/whoami`

टोकन मान्य करता है और उपयोगकर्ता handle लौटाता है.

### `POST /api/v1/skills`

नया संस्करण प्रकाशित करता है.

- प्राथमिकता: `payload` JSON + `files[]` blobs के साथ `multipart/form-data`.
- `files` (storageId-आधारित) वाली JSON body भी स्वीकार की जाती है.
- वैकल्पिक payload फ़ील्ड: `ownerHandle`. मौजूद होने पर, API उस
  publisher को server-side resolve करता है और actor के पास publisher access होना आवश्यक करता है.
- वैकल्पिक payload फ़ील्ड: `migrateOwner`. `ownerHandle` के साथ `true` होने पर, कोई
  मौजूदा skill उस owner के पास जा सकता है यदि actor वर्तमान और लक्षित publishers दोनों पर admin/owner है.
  इस opt-in के बिना, owner changes अस्वीकार किए जाते हैं.

### `POST /api/v1/packages`

code-plugin या bundle-plugin रिलीज़ प्रकाशित करता है.

- Bearer token auth आवश्यक है.
- `multipart/form-data` आवश्यक है.
- अनुमत form fields हैं `payload`, दोहराए गए `files` blobs, या एक `clawpack`
  tarball reference. `clawpack` एक `.tgz` blob या upload-url flow द्वारा लौटाया गया storage id हो सकता है.
  staged storage-id publishes में उस upload URL के साथ लौटाया गया
  `clawpackUploadTicket` भी शामिल होना चाहिए.
- या तो `files` उपयोग करें या `clawpack`, एक ही अनुरोध में दोनों कभी नहीं.
- JSON bodies और caller-supplied `payload.files` / `payload.artifact`
  metadata अस्वीकार किए जाते हैं.
- direct multipart publish requests 18MB तक सीमित हैं. ClawPack tarballs
  120MB tarball cap तक upload-url flow का उपयोग कर सकते हैं.
- वैकल्पिक payload फ़ील्ड: `ownerHandle`. मौजूद होने पर, केवल admins उस owner की ओर से प्रकाशित कर सकते हैं.

Validation highlights:

- `family` को `code-plugin` या `bundle-plugin` होना चाहिए.
- Plugin पैकेजों के लिए `openclaw.plugin.json` आवश्यक है. ClawPack `.tgz` uploads में
  यह `package/openclaw.plugin.json` पर होना चाहिए.
- Code plugins के लिए `package.json`, source repo metadata, source commit
  metadata, config schema metadata, `openclaw.compat.pluginApi`, और
  `openclaw.build.openclawVersion` आवश्यक हैं.
- `openclaw.hostTargets` और `openclaw.environment` वैकल्पिक metadata हैं.
- केवल `openclaw` org publisher और वर्तमान `openclaw` org सदस्यों के
  personal publishers `official` channel में प्रकाशित कर सकते हैं.
- on-behalf publishes अब भी target owner account के विरुद्ध official-channel eligibility validate करते हैं.

### `DELETE /api/v1/skills/{slug}` / `POST /api/v1/skills/{slug}/undelete`

skill को soft-delete / restore करें (owner, moderator, या admin).

वैकल्पिक JSON body:

```json
{ "reason": "Held for moderation pending legal review." }
```

मौजूद होने पर, `reason` को skill moderation note के रूप में संग्रहीत किया जाता है और audit log में कॉपी किया जाता है.
Owner-initiated soft deletes slug को 30 दिनों तक reserve करते हैं, फिर slug को
दूसरा publisher claim कर सकता है. जब यह expiry लागू होती है तो delete response में `slugReservedUntil` शामिल होता है.
Moderator/admin hides और security removals इस तरह expire नहीं होते.

Delete response:

```json
{ "ok": true, "slugReservedUntil": 1730000000000 }
```

Status codes:

- `200`: ok
- `401`: unauthorized
- `403`: forbidden
- `404`: skill/user नहीं मिला
- `500`: internal server error

### `POST /api/v1/users/publisher`

केवल एडमिन. किसी handle के लिए org publisher मौजूद होना सुनिश्चित करता है. यदि handle अब भी
legacy shared user/personal publisher की ओर इशारा करता है, तो endpoint पहले उसे org publisher में migrate करता है.
नए बनाए गए org के लिए, `memberHandle` दें; acting admin को member के रूप में नहीं जोड़ा जाता.
`memberRole` डिफ़ॉल्ट रूप से `owner` है.

- Body: `{ "handle": "openclaw", "displayName": "OpenClaw", "memberHandle": "alice", "memberRole": "owner", "trusted": true }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "openclaw", "created": true, "migrated": false, "trusted": true, "member": { "userId": "...", "handle": "alice", "role": "owner" } }`

### `POST /api/v1/publishers`

Authenticated self-serve org publisher creation. नया org publisher बनाता है और
caller को owner के रूप में जोड़ता है. यह endpoint मौजूदा user/personal handles को migrate नहीं करता और
publisher को trusted/official चिह्नित नहीं करता.

- Body: `{ "handle": "opik", "displayName": "Opik" }`
- Response: `{ "ok": true, "publisherId": "...", "handle": "opik", "created": true, "trusted": false }`
- जब handle पहले से किसी publisher, user, या personal publisher द्वारा उपयोग किया जा रहा हो तो `409` लौटाता है.

### `POST /api/v1/users/reserve`

केवल एडमिन. release प्रकाशित किए बिना rightful owner के लिए root slugs और package names reserve करता है.
Package names ऐसे private placeholder packages बन जाते हैं जिनमें कोई release rows नहीं होतीं, ताकि वही
owner बाद में उस name में असली code-plugin या bundle-plugin release प्रकाशित कर सके.

- Body: `{ "handle": "openclaw", "slugs": ["diffs"], "packageNames": ["@openclaw/diffs"], "reason": "reserved for official OpenClaw plugin" }`
- Response: `{ "ok": true, "succeeded": 2, "failed": 0, "results": [{ "kind": "slug", "name": "diffs", "ok": true, "action": "reserved" }] }`

### `POST /api/v1/users/publisher-recovery`

केवल एडमिन. Convex Auth account rows को edit किए बिना verified replacement GitHub OAuth principal
के लिए personal publisher recover करता है. अनुरोध में दोनों immutable GitHub
provider account ids का नाम होना चाहिए; mutable handles केवल operator-facing guard के रूप में उपयोग होते हैं.

एंडपॉइंट डिफ़ॉल्ट रूप से dry-run होता है। रिकवरी लागू करने के लिए `dryRun: false` और
`confirmIdentityVerified: true` आवश्यक हैं, जब स्टाफ दोनों GitHub principals के बीच निरंतरता को स्वतंत्र रूप से सत्यापित कर लें।
जब गंतव्य उपयोगकर्ता के मौजूदा personal
publisher के पास skills, packages या GitHub skill sources हों, तो रिकवरी fail closed होती है।
रिकवरी recovered publisher के skills,
skill slug aliases, packages, package inspector warnings और derived search digest rows के लिए legacy `ownerUserId` फ़ील्ड भी माइग्रेट करती है, ताकि
direct-owner paths नई publisher authority से मेल खाएँ। recovered handle के लिए active protected-handle
reservation भी replacement user को फिर से असाइन किया जाता है, ताकि बाद की
profile synchronization पूर्व उपयोगकर्ता की प्रतिस्पर्धी authority को पुनर्स्थापित न कर सके। प्रत्येक primary table प्रति apply transaction
100 rows तक सीमित है; बड़ी recoveries को पहले resumable owner migration का उपयोग करना होगा।
GitHub skill sources publisher-scoped हैं और rewrite किए जाने के बजाय checked के रूप में रिपोर्ट किए जाते हैं।

- Body: `{ "handle": "gingiris", "nextUserHandle": "gingiris-1031", "previousGitHubProviderAccountId": "123", "nextGitHubProviderAccountId": "456", "reason": "Verified account continuity for issue #2555", "confirmIdentityVerified": true, "dryRun": false }`
- Response: `{ "ok": true, "dryRun": false, "recovered": true, "publisherId": "...", "handle": "gingiris", "previousUser": { "userId": "...", "handle": "gingiris", "nextHandle": "gingiris-recovered", "githubProviderAccountId": "123", "authAccountCount": 1 }, "nextUser": { "userId": "...", "handle": "gingiris-1031", "nextHandle": "gingiris", "githubProviderAccountId": "456", "authAccountCount": 1 }, "retiredPersonalPublisher": null, "resourceOwnerMigration": { "limitPerTable": 100, "skills": 1, "skillSlugAliases": 1, "packages": 0, "packageInspectorWarnings": 0, "githubSourcesChecked": 1, "handleReservations": 1 }, "identityVerified": true, "reason": "Verified account continuity for issue #2555" }`

### Owner slug प्रबंधन एंडपॉइंट

- `POST /api/v1/skills/{slug}/rename`
  - Body: `{ "newSlug": "new-canonical-slug" }`
  - Response: `{ "ok": true, "slug": "new-canonical-slug", "previousSlug": "old-slug" }`
- `POST /api/v1/skills/{slug}/merge`
  - Body: `{ "targetSlug": "canonical-target-slug" }`
  - Response: `{ "ok": true, "sourceSlug": "old-slug", "targetSlug": "canonical-target-slug" }`

नोट्स:

- दोनों एंडपॉइंट के लिए API token auth आवश्यक है और वे केवल skill owner के लिए काम करते हैं।
- `rename` पिछले slug को redirect alias के रूप में सुरक्षित रखता है।
- `merge` source listing को छिपाता है और source slug को target listing पर redirect करता है।

### ownership transfer एंडपॉइंट

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

किसी मौजूदा ban के लिए stored reason को बदलें, बिना unban किए या
content restore किए (केवल admin)। जब तक `dryRun` `false` न हो, डिफ़ॉल्ट dry-run है।

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

किसी उपयोगकर्ता की role बदलें (केवल admin)।

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

उपयोगकर्ताओं को सूचीबद्ध करें या खोजें (केवल admin)।

Query params:

- `q` (वैकल्पिक): search query
- `query` (वैकल्पिक): `q` के लिए alias
- `limit` (वैकल्पिक): अधिकतम results (डिफ़ॉल्ट 20, अधिकतम 200)

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

star (highlights) जोड़ें/हटाएँ। दोनों एंडपॉइंट idempotent हैं।

Responses:

```json
{ "ok": true, "starred": true, "alreadyStarred": false }
```

```json
{ "ok": true, "unstarred": true, "alreadyUnstarred": false }
```

## Legacy CLI एंडपॉइंट (deprecated)

पुराने CLI versions के लिए अभी भी समर्थित:

- `GET /api/cli/whoami`
- `POST /api/cli/upload-url`
- `POST /api/cli/publish`
- `POST /api/cli/telemetry/install`
- `POST /api/cli/skill/delete`
- `POST /api/cli/skill/undelete`

removal plan के लिए `DEPRECATIONS.md` देखें।

`POST /api/cli/upload-url` `uploadUrl` और `uploadTicket` लौटाता है। Package
publishes जो ClawPack tarball stage करते हैं, उन्हें resulting storage id को
`clawpack` के रूप में और returned ticket को `clawpackUploadTicket` के रूप में भेजना होगा।

## Registry discovery (`/.well-known/clawhub.json`)

CLI site से registry/auth settings discover कर सकता है:

- `/.well-known/clawhub.json` (JSON, पसंदीदा)
- `/.well-known/clawdhub.json` (legacy)

Schema:

```json
{ "apiBase": "https://clawhub.ai", "authBase": "https://clawhub.ai", "minCliVersion": "0.0.5" }
```

यदि आप self-host करते हैं, तो यह file serve करें (या `CLAWHUB_REGISTRY` को स्पष्ट रूप से set करें; legacy `CLAWDHUB_REGISTRY`)।
