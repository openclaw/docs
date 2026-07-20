---
read_when:
    - OpenResponses API का उपयोग करने वाले क्लाइंट का एकीकरण
    - आपको आइटम-आधारित इनपुट, क्लाइंट टूल कॉल या SSE इवेंट चाहिए
summary: Gateway से OpenResponses-संगत /v1/responses HTTP एंडपॉइंट उपलब्ध कराएँ
title: OpenResponses API
x-i18n:
    generated_at: "2026-07-20T07:23:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5bfd6ca3bf0cecd761fde865b41a95cff3fc5681f74f31b3adae5cd2e0b0be95
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway एक OpenResponses-संगत `POST /v1/responses` एंडपॉइंट उपलब्ध करा सकता है। यह **डिफ़ॉल्ट रूप से अक्षम** होता है और Gateway के साथ अपना पोर्ट साझा करता है (WS + HTTP मल्टीप्लेक्स): `http://<gateway-host>:<port>/v1/responses`।

अनुरोध सामान्य Gateway एजेंट रन के रूप में चलते हैं (`openclaw agent` के समान कोडपाथ), इसलिए रूटिंग, अनुमतियाँ और कॉन्फ़िगरेशन आपके Gateway से मेल खाते हैं।

`gateway.http.endpoints.responses.enabled` से इसे सक्षम या अक्षम करें। सक्षम होने पर, यही संगतता सतह `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings`, और `POST /v1/chat/completions` भी उपलब्ध कराती है।

## प्रमाणीकरण, सुरक्षा और रूटिंग

परिचालन व्यवहार [OpenAI Chat Completions](/hi/gateway/openai-http-api) से मेल खाता है:

- प्रमाणीकरण पथ `gateway.auth.mode` से मेल खाता है: साझा-सीक्रेट (`token`/`password`) `Authorization: Bearer <token-or-password>` का उपयोग करता है; विश्वसनीय-प्रॉक्सी पहचान-सचेत प्रॉक्सी हेडर का उपयोग करता है (समान-होस्ट लूपबैक प्रॉक्सी को `gateway.auth.trustedProxy.allowLoopback = true` चाहिए, और जब कोई `Forwarded`/`X-Forwarded-*`/`X-Real-IP` हेडर मौजूद न हो, तब `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` के माध्यम से समान-होस्ट प्रत्यक्ष फ़ॉलबैक उपलब्ध होता है); निजी इनग्रेस पर `none` को किसी प्रमाणीकरण हेडर की आवश्यकता नहीं होती। [विश्वसनीय प्रॉक्सी प्रमाणीकरण](/hi/gateway/trusted-proxy-auth) देखें।
- एंडपॉइंट को Gateway इंस्टेंस तक पूर्ण ऑपरेटर पहुँच के रूप में मानें।
- साझा-सीक्रेट प्रमाणीकरण मोड अधिक संकीर्ण बेयरर-घोषित `x-openclaw-scopes` को अनदेखा करते हैं और पूर्ण डिफ़ॉल्ट ऑपरेटर स्कोप सेट पुनर्स्थापित करते हैं: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`। इस एंडपॉइंट पर चैट टर्न को स्वामी-प्रेषक टर्न माना जाता है।
- विश्वसनीय पहचान-युक्त HTTP मोड (विश्वसनीय-प्रॉक्सी, या `gateway.auth.mode="none"`) मौजूद होने पर `x-openclaw-scopes` का पालन करते हैं, अन्यथा ऑपरेटर के डिफ़ॉल्ट स्कोप सेट पर फ़ॉलबैक करते हैं। स्वामी अर्थवत्ता केवल तब समाप्त होती है जब कॉलर स्पष्ट रूप से स्कोप सीमित करता है और `operator.admin` को छोड़ देता है।
- एजेंट चुनने के लिए `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"`, या `x-openclaw-agent-id` हेडर का उपयोग करें।
- चुने गए एजेंट के बैकएंड मॉडल को ओवरराइड करने के लिए `x-openclaw-model` का उपयोग करें (पहचान-युक्त प्रमाणीकरण पथों पर `operator.admin` आवश्यक है)।
- स्पष्ट सत्र रूटिंग के लिए `x-openclaw-session-key` का उपयोग करें (यदि यह आरक्षित नेमस्पेस का उपयोग करता है, तो `400 invalid_request_error` के साथ अस्वीकार किया जाता है: `subagent:`, `cron:`, `acp:`)।
- गैर-डिफ़ॉल्ट सिंथेटिक इनग्रेस चैनल संदर्भ के लिए `x-openclaw-message-channel` का उपयोग करें।

एजेंट-लक्ष्य मॉडल, `openclaw/default`, एम्बेडिंग पास-थ्रू और बैकएंड मॉडल ओवरराइड की प्रामाणिक व्याख्या के लिए [OpenAI Chat Completions](/hi/gateway/openai-http-api#agent-first-model-contract) देखें।

[ऑपरेटर स्कोप](/hi/gateway/operator-scopes) और [सुरक्षा](/hi/gateway/security) देखें।

## सत्र व्यवहार

डिफ़ॉल्ट रूप से एंडपॉइंट **प्रति अनुरोध स्टेटलेस** होता है (हर कॉल पर एक नई सत्र कुंजी बनाई जाती है)।

यदि अनुरोध में OpenResponses `user` स्ट्रिंग शामिल है, तो Gateway उससे एक स्थिर सत्र कुंजी प्राप्त करता है, ताकि बार-बार की गई कॉल एक एजेंट सत्र साझा कर सकें।

जब अनुरोध समान एजेंट/उपयोगकर्ता/अनुरोधित-सत्र स्कोप के भीतर रहता है (प्रमाणीकरण विषय, एजेंट आईडी और `x-openclaw-session-key` द्वारा मिलान), तो `previous_response_id` पहले की प्रतिक्रिया के सत्र का पुनः उपयोग करता है।

## अनुरोध संरचना

| फ़ील्ड                                                            | समर्थन                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | स्ट्रिंग या आइटम ऑब्जेक्ट की सरणी।                                                                                               |
| `instructions`                                                   | सिस्टम प्रॉम्प्ट में मर्ज किया जाता है।                                                                                                 |
| `tools`                                                          | क्लाइंट टूल परिभाषाएँ (फ़ंक्शन टूल)।                                                                                      |
| `tool_choice`                                                    | क्लाइंट टूल को फ़िल्टर करने या आवश्यक बनाने के लिए `"auto"`, `"none"`, `"required"`, या `{ "type": "function", "name": "..." }`।                |
| `stream`                                                         | SSE स्ट्रीमिंग सक्षम करता है।                                                                                                         |
| `max_output_tokens`                                              | सर्वोत्तम-प्रयास आउटपुट सीमा (प्रदाता पर निर्भर)।                                                                                 |
| `temperature`                                                    | सर्वोत्तम-प्रयास सैंपलिंग तापमान। ChatGPT-आधारित Codex Responses बैकएंड इसे अनदेखा करता है, जो निश्चित सर्वर-साइड सैंपलिंग का उपयोग करता है। |
| `top_p`                                                          | सर्वोत्तम-प्रयास न्यूक्लियस सैंपलिंग। `temperature` के समान Codex Responses चेतावनी।                                                    |
| `user`                                                           | स्थिर सत्र रूटिंग।                                                                                                        |
| `previous_response_id`                                           | सत्र निरंतरता (ऊपर देखें)।                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | स्वीकार किए जाते हैं, लेकिन वर्तमान में अनदेखे किए जाते हैं।                                                                                                |

## आइटम (इनपुट)

### `message`

भूमिकाएँ: `system`, `developer`, `user`, `assistant`।

- `system` और `developer` सिस्टम प्रॉम्प्ट में जोड़े जाते हैं।
- सबसे नया `user` या `function_call_output` आइटम "वर्तमान संदेश" बन जाता है।
- संदर्भ के लिए पहले के उपयोगकर्ता/सहायक संदेश इतिहास के रूप में शामिल किए जाते हैं।

### `function_call_output` (टर्न-आधारित टूल)

टूल परिणाम मॉडल को वापस भेजें:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` और `item_reference`

स्कीमा संगतता के लिए स्वीकार किए जाते हैं, लेकिन प्रॉम्प्ट बनाते समय अनदेखे किए जाते हैं।

## टूल (क्लाइंट-साइड फ़ंक्शन टूल)

`tools: [{ type: "function", name, description?, parameters? }]` के साथ टूल प्रदान करें।

यदि एजेंट किसी टूल को कॉल करता है, तो प्रतिक्रिया एक `function_call` आउटपुट आइटम लौटाती है। टर्न जारी रखने के लिए `function_call_output` के साथ अनुवर्ती अनुरोध भेजें।

`tool_choice: "required"` और फ़ंक्शन-पिन किए गए `tool_choice` के लिए, एंडपॉइंट उजागर क्लाइंट फ़ंक्शन-टूल सेट को सीमित करता है, रनटाइम को प्रतिक्रिया देने से पहले क्लाइंट टूल कॉल करने का निर्देश देता है, और यदि टर्न में मेल खाती संरचित क्लाइंट-टूल कॉल शामिल नहीं है, तो `/v1/chat/completions` अनुबंध के अनुरूप उसे अस्वीकार कर देता है। गैर-स्ट्रीमिंग अनुरोध `api_error` के साथ `502` लौटाते हैं; स्ट्रीमिंग अनुरोध एक `response.failed` इवेंट उत्सर्जित करते हैं।

## छवियाँ (`input_image`)

base64 या URL स्रोतों का समर्थन करता है:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

अनुमत MIME प्रकार (डिफ़ॉल्ट): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`। अधिकतम आकार (डिफ़ॉल्ट): 10MB।

## फ़ाइलें (`input_file`)

base64 या URL स्रोतों का समर्थन करता है:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

अनुमत MIME प्रकार (डिफ़ॉल्ट): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`। अधिकतम आकार (डिफ़ॉल्ट): 5MB।

वर्तमान व्यवहार:

- फ़ाइल सामग्री को डीकोड करके उपयोगकर्ता संदेश के बजाय **सिस्टम प्रॉम्प्ट** में जोड़ा जाता है, इसलिए वह अस्थायी रहती है (सत्र इतिहास में स्थायी नहीं होती)।
- डीकोड किए गए फ़ाइल टेक्स्ट को जोड़ने से पहले **अविश्वसनीय बाहरी सामग्री** के रूप में लपेटा जाता है, इसलिए फ़ाइल बाइट को विश्वसनीय निर्देशों के बजाय डेटा माना जाता है। अंतःक्षेपित ब्लॉक स्पष्ट सीमा मार्कर (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) और एक `Source: External` मेटाडेटा पंक्ति का उपयोग करता है। प्रॉम्प्ट बजट बचाने के लिए यह जानबूझकर लंबे `SECURITY NOTICE:` बैनर को छोड़ देता है; सीमा मार्कर और मेटाडेटा फिर भी लागू रहते हैं।
- PDF को पहले टेक्स्ट के लिए पार्स किया जाता है। यदि बहुत कम टेक्स्ट मिलता है, तो पहले पृष्ठों को रास्टर छवियों में बदला जाता है और मॉडल को भेजा जाता है, तथा अंतःक्षेपित फ़ाइल ब्लॉक `[PDF content rendered to images]` प्लेसहोल्डर का उपयोग करता है।

PDF पार्सिंग बंडल किए गए `document-extract` Plugin द्वारा प्रदान की जाती है, जो टेक्स्ट निष्कर्षण और पृष्ठ रेंडरिंग के लिए `clawpdf` और उसके पैकेज किए गए PDFium WebAssembly रनटाइम का उपयोग करता है।

URL फ़ेच डिफ़ॉल्ट:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (प्रति अनुरोध कुल URL-आधारित `input_file` + `input_image` भाग)
- अनुरोध सुरक्षित किए जाते हैं (DNS रिज़ॉल्यूशन, निजी IP अवरोधन, रीडायरेक्ट सीमाएँ, टाइमआउट)।
- वैकल्पिक होस्टनेम अनुमतिसूचियाँ प्रत्येक इनपुट प्रकार (`files.urlAllowlist`, `images.urlAllowlist`) के लिए समर्थित हैं: सटीक होस्ट (`"cdn.example.com"`) या वाइल्डकार्ड सबडोमेन (`"*.assets.example.com"`, शीर्ष डोमेन से मेल नहीं खाता)। खाली या छोड़ी गई अनुमतिसूचियों का अर्थ है कि कोई होस्टनेम अनुमतिसूची प्रतिबंध नहीं है।
- URL-आधारित फ़ेच को पूरी तरह अक्षम करने के लिए `files.allowUrl: false` और/या `images.allowUrl: false` सेट करें।

## फ़ाइल + छवि सीमाएँ

एंडपॉइंट 20 MB की अंतर्निहित अनुरोध-बॉडी सीमा का उपयोग करता है। फ़ाइल और छवि स्रोत
नीति `gateway.http.endpoints.responses` के अंतर्गत कॉन्फ़िगर करने योग्य रहती है:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 60000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

छोड़े जाने पर डिफ़ॉल्ट:

| कुंजी                      | डिफ़ॉल्ट   |
| ------------------------ | --------- |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

HEIC/HEIF `input_image` स्रोतों को साझा OpenClaw इमेज प्रोसेसर (Rastermill) के माध्यम से प्रदाता को भेजने से पहले JPEG में सामान्यीकृत किया जाता है, जो बाहरी कोडेक समर्थन की आवश्यकता वाले प्रारूपों के लिए सिस्टम कन्वर्टर (`sips`, ImageMagick, GraphicsMagick, या ffmpeg) का फ़ॉलबैक के रूप में उपयोग करता है।

सुरक्षा नोट: URL अनुमति-सूचियाँ फ़ेच से पहले और रीडायरेक्ट के प्रत्येक चरण पर लागू की जाती हैं। किसी होस्टनाम को अनुमति-सूची में शामिल करने से निजी/आंतरिक IP अवरोधन बायपास नहीं होता। इंटरनेट पर उपलब्ध Gateways के लिए, ऐप-स्तरीय सुरक्षा उपायों के अतिरिक्त नेटवर्क इग्रेस नियंत्रण लागू करें। [सुरक्षा](/hi/gateway/security) देखें।

## स्ट्रीमिंग (SSE)

Server-Sent Events प्राप्त करने के लिए `stream: true` सेट करें:

- `Content-Type: text/event-stream`
- प्रत्येक इवेंट लाइन `event: <type>` और `data: <json>` होती है
- स्ट्रीम `data: [DONE]` के साथ समाप्त होती है

वर्तमान में उत्सर्जित इवेंट प्रकार: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (त्रुटि होने पर)।

## उपयोग

जब अंतर्निहित प्रदाता टोकन की संख्याएँ रिपोर्ट करता है, तब `usage` भरा जाता है। OpenClaw सामान्य OpenAI-शैली के उपनामों को डाउनस्ट्रीम स्थिति/सत्र सतहों तक पहुँचने से पहले सामान्यीकृत करता है, जिनमें `input_tokens` / `output_tokens` और `prompt_tokens` / `completion_tokens` शामिल हैं।

## त्रुटियाँ

त्रुटियाँ इस प्रकार के JSON ऑब्जेक्ट का उपयोग करती हैं:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

सामान्य मामले: `400` अमान्य अनुरोध बॉडी, `401` अनुपस्थित/अमान्य प्रमाणीकरण, `403` अनुपस्थित ऑपरेटर स्कोप, `405` गलत विधि, `429` प्रमाणीकरण के बहुत अधिक विफल प्रयास (`Retry-After` के साथ)।

## उदाहरण

बिना स्ट्रीमिंग के:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

स्ट्रीमिंग:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## संबंधित

- [OpenAI चैट कम्प्लीशन्स](/hi/gateway/openai-http-api)
- [ऑपरेटर स्कोप](/hi/gateway/operator-scopes)
- [OpenAI](/hi/providers/openai)
