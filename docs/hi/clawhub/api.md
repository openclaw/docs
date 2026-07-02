---
read_when:
    - API क्लाइंट बनाना
    - एंडपॉइंट या स्कीमा जोड़ना
summary: सार्वजनिक REST API (v1) का अवलोकन और परंपराएँ.
x-i18n:
    generated_at: "2026-07-02T17:37:19Z"
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

## सार्वजनिक कैटलॉग पुनः उपयोग

आप ClawHub के सार्वजनिक रीड API के ऊपर तृतीय-पक्ष कैटलॉग, डायरेक्टरी या खोज सतह बना सकते हैं। सार्वजनिक skill मेटाडेटा और skill फ़ाइलें ClawHub के skill लाइसेंस नियमों के तहत प्रकाशित की जाती हैं, जबकि API स्वयं दर-सीमित है और इसका जिम्मेदारी से उपयोग किया जाना चाहिए।

दिशानिर्देश:

- कैटलॉग सूचियों के लिए सार्वजनिक रीड एंडपॉइंट जैसे `GET /api/v1/skills`, `GET /api/v1/search`, और `GET /api/v1/skills/{slug}` का उपयोग करें।
- प्रतिक्रियाओं को कैश करें और आक्रामक पोलिंग करने के बजाय `429`, `Retry-After`, और rate-limit हेडरों का सम्मान करें।
- सूचियां दिखाते समय कैनोनिकल ClawHub skill URL पर वापस लिंक करें ताकि उपयोगकर्ता स्रोत रजिस्ट्री रिकॉर्ड देख सकें।
- कैनोनिकल पेज URL को `https://clawhub.ai/<owner>/skills/<slug>` रूप में उपयोग करें।
- यह संकेत न दें कि ClawHub तृतीय-पक्ष साइट का समर्थन, सत्यापन या संचालन करता है।
- सार्वजनिक API फ़िल्टरों या auth सीमाओं को बायपास करके छिपी, निजी या moderation-अवरुद्ध सामग्री को मिरर न करें।

## Auth

- सार्वजनिक रीड: कोई टोकन आवश्यक नहीं।
- लेखन + खाता: `Authorization: Bearer clh_...`।

## दर सीमाएं

Auth-जागरूक प्रवर्तन:

- अनाम अनुरोध: प्रति IP।
- प्रमाणित अनुरोध (मान्य Bearer टोकन): प्रति उपयोगकर्ता बकेट।
- अनुपस्थित/अमान्य टोकन IP प्रवर्तन पर वापस जाता है।

- रीड: 3000/min प्रति IP, 12000/min प्रति key
- लेखन: 300/min प्रति IP, 3000/min प्रति key
- डाउनलोड: 1200/min प्रति IP, 6000/min प्रति key

हेडर: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`X-RateLimit-Remaining`, `RateLimit-Remaining`, और `Retry-After` को `429` पर शामिल किया जाता है।

अर्थ:

- `X-RateLimit-Reset`: Unix epoch सेकंड (पूर्ण रीसेट समय)
- `RateLimit-Reset`: रीसेट तक विलंब सेकंड
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: मौजूद होने पर सटीक बचा हुआ बजट; शार्ड किए गए सफल अनुरोध अनुमानित वैश्विक मान लौटाने के बजाय इसे छोड़ देते हैं
- `Retry-After`: `429` पर प्रतीक्षा करने के लिए विलंब सेकंड

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

क्लाइंट हैंडलिंग:

- मौजूद होने पर `Retry-After` को प्राथमिकता दें।
- अन्यथा `RateLimit-Reset` का उपयोग करें या `X-RateLimit-Reset` से विलंब निकालें।
- retries में jitter जोड़ें।

## त्रुटियां

- v1 त्रुटियां सादा पाठ (`text/plain; charset=utf-8`) हैं, जिनमें `400`, `401`, `403`, `404`, `429`, और अवरुद्ध-डाउनलोड प्रतिक्रियाएं शामिल हैं।
- अज्ञात query parameters को compatibility के लिए अनदेखा किया जाता है।
- अमान्य मानों वाले ज्ञात query parameters `400` लौटाते हैं।

## एंडपॉइंट

सार्वजनिक रीड:

- `GET /api/v1/search?q=...`
  - वैकल्पिक फ़िल्टर: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - विरासत alias: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (डिफ़ॉल्ट), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), विरासत install aliases `installsCurrent`/`installs`/`installsAllTime` `downloads` पर मैप होते हैं, `trending`
  - अमान्य `sort` मान `400` लौटाते हैं
  - `cursor` non-`trending` sorts पर लागू होता है
  - वैकल्पिक फ़िल्टर: `nonSuspiciousOnly=true`
  - विरासत alias: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` के साथ, cursor-आधारित पेजों में `limit` से कम आइटम हो सकते हैं; जारी रखने के लिए `nextCursor` का उपयोग करें।
  - `recommended` engagement और recency संकेतों का उपयोग करता है।
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - Hosted skills नियतात्मक ZIP bytes लौटाते हैं।
  - `clean` या `suspicious` scan वाले वर्तमान GitHub-backed skills ClawHub bytes के बजाय JSON `public-github` handoff descriptor लौटाते हैं।
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - Hosted skills संग्रहीत फ़ाइलों के रूप में export किए जाते हैं।
  - `clean` या `suspicious` scan वाले वर्तमान GitHub-backed skills `public-github` handoff descriptors के रूप में export किए जाते हैं।
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (डिफ़ॉल्ट), `recommended`, `downloads`, विरासत alias `installs`
  - अमान्य `sort` मान `400` लौटाते हैं
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (डिफ़ॉल्ट), `downloads`, `updated`, विरासत alias `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

Auth आवश्यक:

- `POST /api/v1/skills` (प्रकाशित करें, multipart बेहतर)
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

केवल admin:

- `POST /api/v1/users/reserve` किसी owner handle के लिए root slugs और निजी no-release package placeholders आरक्षित करता है।

## विरासत

विरासत `/api/*` और `/api/cli/*` अभी भी उपलब्ध हैं। `DEPRECATIONS.md` देखें।
