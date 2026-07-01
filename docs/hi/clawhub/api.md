---
read_when:
    - API क्लाइंट बनाना
    - एंडपॉइंट या स्कीमा जोड़ना
summary: सार्वजनिक REST API (v1) का अवलोकन और परंपराएँ।
x-i18n:
    generated_at: "2026-07-01T20:19:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

आधार: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## सार्वजनिक कैटलॉग पुन: उपयोग

आप ClawHub के सार्वजनिक read API के ऊपर कोई तृतीय-पक्ष कैटलॉग, डायरेक्टरी, या खोज सतह बना सकते हैं। सार्वजनिक skill मेटाडेटा और skill फाइलें ClawHub के skill लाइसेंस नियमों के तहत प्रकाशित की जाती हैं, जबकि API स्वयं rate-limited है और इसका जिम्मेदारी से उपयोग किया जाना चाहिए।

दिशानिर्देश:

- कैटलॉग सूचियों के लिए सार्वजनिक read endpoints जैसे `GET /api/v1/skills`, `GET /api/v1/search`, और `GET /api/v1/skills/{slug}` का उपयोग करें।
- प्रतिक्रियाओं को cache करें और आक्रामक polling करने के बजाय `429`, `Retry-After`, और rate-limit headers का सम्मान करें।
- सूचियां दिखाते समय canonical ClawHub skill URL पर वापस link करें ताकि उपयोगकर्ता source registry record की जांच कर सकें।
- `https://clawhub.ai/<owner>/skills/<slug>` रूप में canonical page URLs का उपयोग करें।
- यह संकेत न दें कि ClawHub तृतीय-पक्ष site का समर्थन, सत्यापन, या संचालन करता है।
- public API filters या auth boundaries को bypass करके hidden, private, या moderation-blocked content को mirror न करें।

## Auth

- सार्वजनिक read: कोई token आवश्यक नहीं।
- Write + account: `Authorization: Bearer clh_...`.

## Rate limits

Auth-aware enforcement:

- Anonymous requests: प्रति IP.
- Authenticated requests (valid Bearer token): प्रति user bucket.
- Missing/invalid token IP enforcement पर fallback करता है।

- Read: 3000/min प्रति IP, 12000/min प्रति key
- Write: 300/min प्रति IP, 3000/min प्रति key
- Download: 1200/min प्रति IP, 6000/min प्रति key

Headers: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining`, और `Retry-After` `429` पर शामिल होते हैं।

Semantics:

- `X-RateLimit-Reset`: Unix epoch seconds (absolute reset time)
- `RateLimit-Reset`: reset तक delay seconds
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर सटीक शेष budget; sharded successful requests approximate global value लौटाने के बजाय इसे omit करते हैं
- `Retry-After`: `429` पर प्रतीक्षा करने के लिए delay seconds

उदाहरण `429`:

```http
HTTP/2 429
x-ratelimit-limit: 20
x-ratelimit-remaining: 0
x-ratelimit-reset: 1771404540
ratelimit-limit: 20
ratelimit-remaining: 0
ratelimit-reset: 34
retry-after: 34
```

Client handling:

- मौजूद होने पर `Retry-After` को प्राथमिकता दें।
- अन्यथा `RateLimit-Reset` का उपयोग करें या `X-RateLimit-Reset` से delay derive करें।
- retries में jitter जोड़ें।

## Errors

- v1 errors plain text (`text/plain; charset=utf-8`) हैं, जिनमें `400`,
  `401`, `403`, `404`, `429`, और blocked-download responses शामिल हैं।
- compatibility के लिए unknown query parameters को ignore किया जाता है।
- invalid values वाले known query parameters `400` लौटाते हैं।

## Endpoints

Public read:

- `GET /api/v1/search?q=...`
  - Optional filters: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - Legacy alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (default), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), legacy install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर map होते हैं, `trending`
  - invalid `sort` values `400` लौटाते हैं
  - `cursor` non-`trending` sorts पर लागू होता है
  - Optional filter: `nonSuspiciousOnly=true`
  - Legacy alias: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` के साथ, cursor-based pages में `limit` items से कम हो सकते हैं; जारी रखने के लिए `nextCursor` का उपयोग करें।
  - `recommended` engagement और recency signals का उपयोग करता है।
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Hosted skills deterministic ZIP bytes लौटाते हैं।
  - `clean` या `suspicious` scan वाले current GitHub-backed skills ClawHub bytes के बजाय JSON `public-github` handoff descriptor लौटाते हैं।
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Hosted skills stored files के रूप में export होते हैं।
  - `clean` या `suspicious` scan वाले current GitHub-backed skills `public-github` handoff descriptors के रूप में export होते हैं।
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (default), `recommended`, `downloads`, legacy alias `installs`
  - Invalid `sort` values `400` लौटाते हैं
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (default), `downloads`, `updated`, legacy alias `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Auth required:

- `POST /api/v1/skills` (publish, multipart preferred)
- `DELETE /api/v1/skills/{slug}`
- `DELETE /api/v1/packages/{name}`
- `POST /api/v1/skills/{slug}/undelete`
- `POST /api/v1/packages/{name}/undelete`
- `POST /api/v1/skills/{slug}/rename`
- `POST /api/v1/skills/{slug}/merge`
- `POST /api/v1/skills/{slug}/transfer`
- `POST /api/v1/packages/{name}/transfer`
- `POST /api/v1/skills/{slug}/transfer/accept`
- `POST /api/v1/skills/{slug}/transfer/reject`
- `POST /api/v1/skills/{slug}/transfer/cancel`
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
- `GET /api/v1/plugins/export?startDate=&endDate=&limit=&cursor=&family=`
- `GET /api/v1/transfers/incoming`
- `GET /api/v1/transfers/outgoing`
- `GET /api/v1/whoami`

केवल Admin:

- `POST /api/v1/users/reserve` किसी owner handle के लिए root slugs और private no-release package placeholders reserve करता है।

## Legacy

Legacy `/api/*` और `/api/cli/*` अभी भी उपलब्ध हैं। `DEPRECATIONS.md` देखें।
