---
read_when:
    - API क्लाइंट बनाना
    - एंडपॉइंट या स्कीमा जोड़ना
summary: सार्वजनिक REST API (v1) का अवलोकन और परंपराएँ.
x-i18n:
    generated_at: "2026-07-02T08:15:44Z"
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

आप ClawHub की सार्वजनिक रीड API के ऊपर तृतीय-पक्ष कैटलॉग, डायरेक्टरी, या सर्च सतह बना सकते हैं। सार्वजनिक स्किल मेटाडेटा और स्किल फ़ाइलें ClawHub के स्किल लाइसेंस नियमों के तहत प्रकाशित की जाती हैं, जबकि API स्वयं रेट-लिमिटेड है और उसे जिम्मेदारी से उपयोग किया जाना चाहिए।

दिशानिर्देश:

- कैटलॉग लिस्टिंग के लिए सार्वजनिक रीड एंडपॉइंट जैसे `GET /api/v1/skills`, `GET /api/v1/search`, और `GET /api/v1/skills/{slug}` का उपयोग करें।
- प्रतिक्रियाओं को कैश करें और आक्रामक पोलिंग के बजाय `429`, `Retry-After`, और रेट-लिमिट हेडर का सम्मान करें।
- लिस्टिंग दिखाते समय कैनॉनिकल ClawHub स्किल URL से वापस लिंक करें ताकि उपयोगकर्ता स्रोत रजिस्ट्री रिकॉर्ड देख सकें।
- `https://clawhub.ai/<owner>/skills/<slug>` रूप में कैनॉनिकल पेज URL का उपयोग करें।
- यह संकेत न दें कि ClawHub तृतीय-पक्ष साइट का समर्थन, सत्यापन, या संचालन करता है।
- सार्वजनिक API फ़िल्टर या प्रमाणीकरण सीमाओं को बायपास करके छिपी हुई, निजी, या मॉडरेशन-ब्लॉक की गई सामग्री को मिरर न करें।

## प्रमाणीकरण

- सार्वजनिक रीड: कोई टोकन आवश्यक नहीं।
- राइट + खाता: `Authorization: Bearer clh_...`।

## रेट सीमाएँ

प्रमाणीकरण-जागरूक प्रवर्तन:

- अनाम अनुरोध: प्रति IP।
- प्रमाणित अनुरोध (मान्य Bearer टोकन): प्रति उपयोगकर्ता बकेट।
- अनुपलब्ध/अमान्य टोकन IP प्रवर्तन पर वापस चला जाता है।

- रीड: प्रति IP 3000/मिनट, प्रति कुंजी 12000/मिनट
- राइट: प्रति IP 300/मिनट, प्रति कुंजी 3000/मिनट
- डाउनलोड: प्रति IP 1200/मिनट, प्रति कुंजी 6000/मिनट

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
- पुनः प्रयासों में जिटर जोड़ें।

## त्रुटियाँ

- v1 त्रुटियाँ साधारण टेक्स्ट (`text/plain; charset=utf-8`) हैं, जिनमें `400`,
  `401`, `403`, `404`, `429`, और ब्लॉक किए गए डाउनलोड की प्रतिक्रियाएँ शामिल हैं।
- संगतता के लिए अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- अमान्य मानों वाले ज्ञात क्वेरी पैरामीटर `400` लौटाते हैं।

## एंडपॉइंट

सार्वजनिक रीड:

- `GET /api/v1/search?q=...`
  - वैकल्पिक फ़िल्टर: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - लेगसी उपनाम: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (डिफ़ॉल्ट), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), लेगसी इंस्टॉल उपनाम `installsCurrent`/`installs`/`installsAllTime` `downloads` पर मैप होते हैं, `trending`
  - अमान्य `sort` मान `400` लौटाते हैं
  - `cursor` गैर-`trending` सॉर्ट पर लागू होता है
  - वैकल्पिक फ़िल्टर: `nonSuspiciousOnly=true`
  - लेगसी उपनाम: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` के साथ, cursor-आधारित पेजों में `limit` से कम आइटम हो सकते हैं; जारी रखने के लिए `nextCursor` का उपयोग करें।
  - `recommended` एंगेजमेंट और हालियापन संकेतों का उपयोग करता है।
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - होस्ट की गई स्किल्स निर्धारक ZIP बाइट्स लौटाती हैं।
  - `clean` या `suspicious` स्कैन वाली वर्तमान GitHub-समर्थित स्किल्स ClawHub बाइट्स के बजाय
    JSON `public-github` हैंडऑफ़ डिस्क्रिप्टर लौटाती हैं।
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - होस्ट की गई स्किल्स संग्रहित फ़ाइलों के रूप में निर्यात की जाती हैं।
  - `clean` या `suspicious` स्कैन वाली वर्तमान GitHub-समर्थित स्किल्स
    `public-github` हैंडऑफ़ डिस्क्रिप्टर के रूप में निर्यात की जाती हैं।
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (डिफ़ॉल्ट), `recommended`, `downloads`, लेगसी उपनाम `installs`
  - अमान्य `sort` मान `400` लौटाते हैं
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (डिफ़ॉल्ट), `downloads`, `updated`, लेगसी उपनाम `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

प्रमाणीकरण आवश्यक:

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

केवल व्यवस्थापक:

- `POST /api/v1/users/reserve` किसी मालिक हैंडल के लिए रूट स्लग और निजी बिना-रिलीज़ पैकेज प्लेसहोल्डर आरक्षित करता है।

## लेगसी

लेगसी `/api/*` और `/api/cli/*` अब भी उपलब्ध हैं। `DEPRECATIONS.md` देखें।
