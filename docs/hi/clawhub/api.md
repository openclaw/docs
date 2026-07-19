---
read_when:
    - API क्लाइंट बनाना
    - एंडपॉइंट या स्कीमा जोड़ना
summary: सार्वजनिक REST API (v1) का अवलोकन और प्रचलन।
x-i18n:
    generated_at: "2026-07-19T08:13:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 31b0051506912d2aa0d724ed7b6542e09ef16dc92998ddbdd3e379f783954436
    source_path: clawhub/api.md
    workflow: 16
---

# API v1

आधार: `https://clawhub.ai`

OpenAPI: `/api/v1/openapi.json`

## सार्वजनिक कैटलॉग का पुनः उपयोग

आप ClawHub के सार्वजनिक रीड API के आधार पर तृतीय-पक्ष कैटलॉग, डायरेक्टरी या खोज इंटरफ़ेस बना सकते हैं। सार्वजनिक Skills मेटाडेटा और Skills फ़ाइलें ClawHub के Skills लाइसेंस नियमों के अंतर्गत प्रकाशित की जाती हैं, जबकि API पर अनुरोध-दर सीमा लागू है और इसका उपयोग ज़िम्मेदारी से किया जाना चाहिए।

दिशानिर्देश:

- कैटलॉग सूचियों के लिए `GET /api/v1/skills`, `GET /api/v1/search`, और `GET /api/v1/skills/{slug}` जैसे सार्वजनिक रीड एंडपॉइंट का उपयोग करें।
- आक्रामक रूप से पोलिंग करने के बजाय प्रतिक्रियाओं को कैश करें और `429`, `Retry-After`, तथा अनुरोध-दर सीमा हेडर का पालन करें।
- सूचियाँ प्रदर्शित करते समय प्रामाणिक ClawHub Skills URL का लिंक दें, ताकि उपयोगकर्ता स्रोत रजिस्ट्री रिकॉर्ड देख सकें।
- `https://clawhub.ai/<owner>/skills/<slug>` प्रारूप में प्रामाणिक पृष्ठ URL का उपयोग करें।
- ऐसा संकेत न दें कि ClawHub तृतीय-पक्ष साइट का समर्थन, सत्यापन या संचालन करता है।
- सार्वजनिक API फ़िल्टर या प्रमाणीकरण सीमाओं को बायपास करके छिपी हुई, निजी या मॉडरेशन द्वारा अवरुद्ध सामग्री की प्रतिलिपि न बनाएँ।

## प्रमाणीकरण

- सार्वजनिक रीड: किसी टोकन की आवश्यकता नहीं है।
- राइट + खाता: `Authorization: Bearer clh_...`।

## अनुरोध-दर सीमाएँ

प्रमाणीकरण-सजग प्रवर्तन:

- अनाम अनुरोध: प्रति IP।
- प्रमाणित अनुरोध (मान्य Bearer टोकन): प्रति उपयोगकर्ता बकेट।
- अनुपस्थित/अमान्य टोकन के लिए IP प्रवर्तन लागू होता है।

- रीड: प्रति IP 3000/मिनट, प्रति कुंजी 12000/मिनट
- राइट: प्रति IP 300/मिनट, प्रति कुंजी 3000/मिनट
- डाउनलोड: प्रति IP 1200/मिनट, प्रति कुंजी 6000/मिनट

हेडर: `X-RateLimit-Limit`, `X-RateLimit-Reset`, `RateLimit-Limit`, `RateLimit-Reset`;
`429` पर `X-RateLimit-Remaining`, `RateLimit-Remaining`, और `Retry-After` शामिल होते हैं।

अर्थ:

- `X-RateLimit-Reset`: Unix epoch सेकंड (पूर्ण रीसेट समय)
- `RateLimit-Reset`: रीसेट होने तक विलंब के सेकंड
- `X-RateLimit-Remaining` / `RateLimit-Remaining`: उपलब्ध होने पर शेष सटीक सीमा; शार्ड किए गए सफल अनुरोध अनुमानित वैश्विक मान लौटाने के बजाय इसे छोड़ देते हैं
- `Retry-After`: `429` पर प्रतीक्षा के लिए विलंब के सेकंड

`429` का उदाहरण:

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

क्लाइंट प्रबंधन:

- उपलब्ध होने पर `Retry-After` को प्राथमिकता दें।
- अन्यथा `RateLimit-Reset` का उपयोग करें या `X-RateLimit-Reset` से विलंब निर्धारित करें।
- पुनः प्रयासों में जिटर जोड़ें।

## त्रुटियाँ

- v1 त्रुटियाँ सादा टेक्स्ट (`text/plain; charset=utf-8`) होती हैं, जिनमें `400`,
  `401`, `403`, `404`, `429`, और अवरुद्ध-डाउनलोड प्रतिक्रियाएँ शामिल हैं।
- संगतता के लिए अज्ञात क्वेरी पैरामीटर अनदेखे किए जाते हैं।
- अमान्य मान वाले ज्ञात क्वेरी पैरामीटर `400` लौटाते हैं।

## एंडपॉइंट

सार्वजनिक रीड:

- `GET /api/v1/search?q=...`
  - वैकल्पिक फ़िल्टर: `highlightedOnly=true`, `nonSuspiciousOnly=true`
  - पुराना उपनाम: `nonSuspicious=true`
- `GET /api/v1/skills?limit=&cursor=&sort=`
  - `sort`: `updated` (डिफ़ॉल्ट), `recommended` (`default`), `createdAt` (`newest`), `downloads`, `stars` (`rating`), पुराने इंस्टॉल उपनाम `installsCurrent`/`installs`/`installsAllTime`, `downloads`, `trending` से मैप होते हैं
  - अमान्य `sort` मान `400` लौटाते हैं
  - `cursor`, गैर-`trending` सॉर्ट पर लागू होता है
  - वैकल्पिक फ़िल्टर: `nonSuspiciousOnly=true`
  - पुराना उपनाम: `nonSuspicious=true`
  - `nonSuspiciousOnly=true` के साथ, कर्सर-आधारित पृष्ठों में `limit` से कम आइटम हो सकते हैं; जारी रखने के लिए `nextCursor` का उपयोग करें।
  - `recommended` सहभागिता और नवीनता संकेतों का उपयोग करता है।
- `GET /api/v1/skills/{slug}`
- `GET /api/v1/skills/{slug}/moderation`
- `GET /api/v1/skills/{slug}/versions?limit=&cursor=`
- `GET /api/v1/skills/{slug}/versions/{version}`
- `GET /api/v1/skills/{slug}/scan?version=&tag=`
- `GET /api/v1/skills/{slug}/file?path=&version=&tag=`
- `GET /api/v1/resolve?slug=&hash=`
- `GET /api/v1/download?slug=&version=&tag=`
  - होस्ट किए गए Skills नियतात्मक ZIP बाइट लौटाते हैं।
  - `clean` या `suspicious` स्कैन वाले वर्तमान GitHub-समर्थित Skills, ClawHub बाइट के बजाय
    JSON `public-github` हैंडऑफ़ डिस्क्रिप्टर लौटाते हैं।
- `GET /api/v1/skills/export?startDate=&endDate=&limit=&cursor=`
  - होस्ट किए गए Skills संग्रहीत फ़ाइलों के रूप में निर्यात किए जाते हैं।
  - `clean` या `suspicious` स्कैन वाले वर्तमान GitHub-समर्थित Skills को
    `public-github` हैंडऑफ़ डिस्क्रिप्टर के रूप में निर्यात किया जाता है।
- `GET /api/v1/packages?limit=&cursor=&sort=`
  - `sort`: `updated` (डिफ़ॉल्ट), `recommended`, `downloads`, पुराना उपनाम `installs`
  - अमान्य `sort` मान `400` लौटाते हैं
- `GET /api/v1/plugins?limit=&cursor=&sort=`
  - `sort`: `recommended` (डिफ़ॉल्ट), `downloads`, `updated`, पुराना उपनाम `installs`
- `GET /api/v1/plugins/search?q=...`
- `GET /api/v1/packages/{name}/versions/{version}/artifact`
- `GET /api/v1/packages/{name}/versions/{version}/security`
- `GET /api/v1/packages/{name}/versions/{version}/artifact/download`
- `GET /api/npm/{package}`
- `GET /api/npm/{package}/-/{tarball}.tgz`

प्रमाणीकरण आवश्यक:

- `POST /api/v1/skills` (प्रकाशित करें, multipart को प्राथमिकता)
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

केवल एडमिन:

- `POST /api/v1/users/reserve` स्वामी हैंडल के लिए रूट स्लग और निजी, रिलीज़-रहित पैकेज प्लेसहोल्डर आरक्षित करता है।

## पुराना

पुराने `/api/*` और `/api/cli/*` अभी भी उपलब्ध हैं। `DEPRECATIONS.md` देखें।
