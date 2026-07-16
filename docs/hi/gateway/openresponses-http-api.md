---
read_when:
    - OpenResponses API का उपयोग करने वाले क्लाइंट्स का एकीकरण
    - आपको आइटम-आधारित इनपुट, क्लाइंट टूल कॉल या SSE इवेंट चाहिए
summary: Gateway से OpenResponses-संगत /v1/responses HTTP एंडपॉइंट उपलब्ध कराएँ
title: OpenResponses API
x-i18n:
    generated_at: "2026-07-16T14:54:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway एक OpenResponses-संगत `POST /v1/responses` एंडपॉइंट प्रदान कर सकता है। यह **डिफ़ॉल्ट रूप से अक्षम** होता है और Gateway के साथ अपना पोर्ट साझा करता है (WS + HTTP मल्टीप्लेक्स): `http://<gateway-host>:<port>/v1/responses`।

अनुरोध सामान्य Gateway एजेंट रन के रूप में चलते हैं (`openclaw agent` के समान कोडपाथ), इसलिए रूटिंग, अनुमतियाँ और कॉन्फ़िगरेशन आपके Gateway के अनुरूप होते हैं।

`gateway.http.endpoints.responses.enabled` से इसे सक्षम या अक्षम करें। सक्षम होने पर, यही संगतता सतह `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings`, और `POST /v1/chat/completions` भी प्रदान करती है।

## प्रमाणीकरण, सुरक्षा और रूटिंग

परिचालन व्यवहार [OpenAI Chat Completions](/hi/gateway/openai-http-api) के अनुरूप है:

- प्रमाणीकरण पथ `gateway.auth.mode` के अनुरूप है: साझा-सीक्रेट (`token`/`password`) `Authorization: Bearer <token-or-password>` का उपयोग करता है; trusted-proxy पहचान-जागरूक प्रॉक्सी हेडर का उपयोग करता है (समान-होस्ट लूपबैक प्रॉक्सी को `gateway.auth.trustedProxy.allowLoopback = true` की आवश्यकता होती है, और जब कोई `Forwarded`/`X-Forwarded-*`/`X-Real-IP` हेडर मौजूद न हो, तब `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` के माध्यम से समान-होस्ट प्रत्यक्ष फ़ॉलबैक उपलब्ध होता है); निजी इनग्रेस पर `none` को किसी प्रमाणीकरण हेडर की आवश्यकता नहीं होती। [विश्वसनीय प्रॉक्सी प्रमाणीकरण](/hi/gateway/trusted-proxy-auth) देखें।
- इस एंडपॉइंट को Gateway इंस्टेंस तक पूर्ण ऑपरेटर पहुँच मानें।
- साझा-सीक्रेट प्रमाणीकरण मोड अधिक सीमित bearer-घोषित `x-openclaw-scopes` को अनदेखा करते हैं और पूर्ण डिफ़ॉल्ट ऑपरेटर स्कोप सेट पुनर्स्थापित करते हैं: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`। इस एंडपॉइंट पर चैट टर्न को स्वामी-प्रेषक टर्न माना जाता है।
- विश्वसनीय पहचान-धारक HTTP मोड (trusted-proxy, या `gateway.auth.mode="none"`) मौजूद होने पर `x-openclaw-scopes` का पालन करते हैं, अन्यथा डिफ़ॉल्ट ऑपरेटर स्कोप सेट पर फ़ॉलबैक करते हैं। स्वामी संबंधी सिमैंटिक्स केवल तब समाप्त होते हैं, जब कॉलर स्पष्ट रूप से स्कोप सीमित करता है और `operator.admin` को छोड़ देता है।
- `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"`, या `x-openclaw-agent-id` हेडर से एजेंट चुनें।
- चुने गए एजेंट के बैकएंड मॉडल को ओवरराइड करने के लिए `x-openclaw-model` का उपयोग करें (पहचान-धारक प्रमाणीकरण पथों पर `operator.admin` आवश्यक है)।
- स्पष्ट सेशन रूटिंग के लिए `x-openclaw-session-key` का उपयोग करें (यदि यह किसी आरक्षित नेमस्पेस का उपयोग करता है, तो `400 invalid_request_error` के साथ अस्वीकार किया जाता है: `subagent:`, `cron:`, `acp:`)।
- गैर-डिफ़ॉल्ट सिंथेटिक इनग्रेस चैनल संदर्भ के लिए `x-openclaw-message-channel` का उपयोग करें।

एजेंट-लक्ष्य मॉडल, `openclaw/default`, एम्बेडिंग पास-थ्रू और बैकएंड मॉडल ओवरराइड की प्रामाणिक व्याख्या के लिए [OpenAI Chat Completions](/hi/gateway/openai-http-api#agent-first-model-contract) देखें।

[ऑपरेटर स्कोप](/hi/gateway/operator-scopes) और [सुरक्षा](/hi/gateway/security) देखें।

## सेशन व्यवहार

डिफ़ॉल्ट रूप से एंडपॉइंट **प्रति अनुरोध स्टेटलेस** होता है (हर कॉल पर एक नई सेशन कुंजी जनरेट होती है)।

यदि अनुरोध में OpenResponses की `user` स्ट्रिंग शामिल है, तो Gateway उससे एक स्थिर सेशन कुंजी प्राप्त करता है, ताकि बार-बार की गई कॉल एक एजेंट सेशन साझा कर सकें।

जब अनुरोध समान एजेंट/उपयोगकर्ता/अनुरोधित-सेशन स्कोप में रहता है (प्रमाणीकरण सब्जेक्ट, एजेंट आईडी और `x-openclaw-session-key` के आधार पर मिलान), तो `previous_response_id` पहले के रिस्पॉन्स के सेशन का पुनः उपयोग करता है।

## अनुरोध संरचना

| फ़ील्ड                                                            | समर्थन                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | स्ट्रिंग या आइटम ऑब्जेक्ट की सरणी।                                                                                               |
| `instructions`                                                   | सिस्टम प्रॉम्प्ट में मर्ज किया जाता है।                                                                                                 |
| `tools`                                                          | क्लाइंट टूल परिभाषाएँ (फ़ंक्शन टूल)।                                                                                      |
| `tool_choice`                                                    | क्लाइंट टूल को फ़िल्टर करने या आवश्यक बनाने के लिए `"auto"`, `"none"`, `"required"`, या `{ "type": "function", "name": "..." }`।                |
| `stream`                                                         | SSE स्ट्रीमिंग सक्षम करता है।                                                                                                         |
| `max_output_tokens`                                              | सर्वोत्तम-प्रयास आउटपुट सीमा (प्रदाता पर निर्भर)।                                                                                 |
| `temperature`                                                    | सर्वोत्तम-प्रयास सैंपलिंग तापमान। ChatGPT-आधारित Codex Responses बैकएंड इसे अनदेखा करता है, क्योंकि वह सर्वर-साइड की निश्चित सैंपलिंग का उपयोग करता है। |
| `top_p`                                                          | सर्वोत्तम-प्रयास न्यूक्लियस सैंपलिंग। `temperature` के समान Codex Responses संबंधी चेतावनी।                                                    |
| `user`                                                           | स्थिर सेशन रूटिंग।                                                                                                        |
| `previous_response_id`                                           | सेशन निरंतरता (ऊपर देखें)।                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | स्वीकार किए जाते हैं, लेकिन वर्तमान में अनदेखे किए जाते हैं।                                                                                                |

## आइटम (इनपुट)

### `message`

भूमिकाएँ: `system`, `developer`, `user`, `assistant`।

- `system` और `developer` सिस्टम प्रॉम्प्ट में जोड़े जाते हैं।
- सबसे हाल का `user` या `function_call_output` आइटम "वर्तमान संदेश" बन जाता है।
- संदर्भ के लिए पहले के उपयोगकर्ता/सहायक संदेश इतिहास के रूप में शामिल किए जाते हैं।

### `function_call_output` (टर्न-आधारित टूल)

टूल के परिणाम मॉडल को वापस भेजें:

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

यदि एजेंट कोई टूल कॉल करता है, तो रिस्पॉन्स एक `function_call` आउटपुट आइटम लौटाता है। टर्न जारी रखने के लिए `function_call_output` के साथ अनुवर्ती अनुरोध भेजें।

`tool_choice: "required"` और फ़ंक्शन-पिन किए गए `tool_choice` के लिए, एंडपॉइंट उजागर किए गए क्लाइंट फ़ंक्शन-टूल सेट को सीमित करता है, रनटाइम को उत्तर देने से पहले किसी क्लाइंट टूल को कॉल करने का निर्देश देता है, और यदि टर्न में मेल खाती संरचित क्लाइंट-टूल कॉल शामिल नहीं होती, तो उसे `/v1/chat/completions` अनुबंध के अनुरूप अस्वीकार कर देता है। गैर-स्ट्रीमिंग अनुरोध एक `api_error` के साथ `502` लौटाते हैं; स्ट्रीमिंग अनुरोध एक `response.failed` इवेंट उत्सर्जित करते हैं।

## इमेज (`input_image`)

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

- फ़ाइल की सामग्री को डीकोड करके उपयोगकर्ता संदेश के बजाय **सिस्टम प्रॉम्प्ट** में जोड़ा जाता है, इसलिए वह क्षणिक रहती है (सेशन इतिहास में सहेजी नहीं जाती)।
- डीकोड किए गए फ़ाइल टेक्स्ट को जोड़ने से पहले **अविश्वसनीय बाहरी सामग्री** के रूप में रैप किया जाता है, इसलिए फ़ाइल बाइट्स को विश्वसनीय निर्देश नहीं, बल्कि डेटा माना जाता है। इंजेक्ट किया गया ब्लॉक स्पष्ट सीमा मार्कर (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) और एक `Source: External` मेटाडेटा पंक्ति का उपयोग करता है। प्रॉम्प्ट बजट बचाने के लिए इसमें जानबूझकर लंबा `SECURITY NOTICE:` बैनर शामिल नहीं किया जाता; सीमा मार्कर और मेटाडेटा फिर भी लागू होते हैं।
- PDF से पहले टेक्स्ट पार्स किया जाता है। यदि बहुत कम टेक्स्ट मिलता है, तो शुरुआती पृष्ठों को रास्टराइज़ करके इमेज में बदला और मॉडल को भेजा जाता है, तथा इंजेक्ट किया गया फ़ाइल ब्लॉक `[PDF content rendered to images]` प्लेसहोल्डर का उपयोग करता है।

PDF पार्सिंग बंडल किए गए `document-extract` Plugin द्वारा प्रदान की जाती है, जो टेक्स्ट निष्कर्षण और पृष्ठ रेंडरिंग के लिए `clawpdf` तथा उसके पैकेज किए गए PDFium WebAssembly रनटाइम का उपयोग करता है।

URL फ़ेच डिफ़ॉल्ट:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (प्रति अनुरोध कुल URL-आधारित `input_file` + `input_image` भाग)
- अनुरोधों को सुरक्षित किया जाता है (DNS रिज़ॉल्यूशन, निजी IP अवरोधन, रीडायरेक्ट सीमाएँ, टाइमआउट)।
- प्रत्येक इनपुट प्रकार (`files.urlAllowlist`, `images.urlAllowlist`) के लिए वैकल्पिक होस्टनाम अनुमत-सूचियाँ समर्थित हैं: सटीक होस्ट (`"cdn.example.com"`) या वाइल्डकार्ड सबडोमेन (`"*.assets.example.com"`, शीर्ष डोमेन से मेल नहीं खाता)। खाली या अनुपस्थित अनुमत-सूचियों का अर्थ है कि कोई होस्टनाम अनुमत-सूची प्रतिबंध नहीं है।
- URL-आधारित फ़ेच पूरी तरह अक्षम करने के लिए `files.allowUrl: false` और/या `images.allowUrl: false` सेट करें।

## फ़ाइल + इमेज सीमाएँ (कॉन्फ़िगरेशन)

डिफ़ॉल्ट को `gateway.http.endpoints.responses` के अंतर्गत समायोजित किया जा सकता है:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
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

अनुपस्थित होने पर डिफ़ॉल्ट:

| कुंजी                      | डिफ़ॉल्ट   |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20MB      |
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

सुरक्षा नोट: URL अनुमति-सूचियाँ फ़ेच से पहले और रीडायरेक्ट के प्रत्येक चरण पर लागू की जाती हैं। किसी होस्टनेम को अनुमति-सूची में जोड़ने से निजी/आंतरिक IP अवरोधन को बायपास नहीं किया जाता। इंटरनेट पर उपलब्ध Gateways के लिए, ऐप-स्तरीय सुरक्षा उपायों के अतिरिक्त नेटवर्क इग्रेस नियंत्रण लागू करें। [सुरक्षा](/hi/gateway/security) देखें।

## स्ट्रीमिंग (SSE)

Server-Sent Events प्राप्त करने के लिए `stream: true` सेट करें:

- `Content-Type: text/event-stream`
- प्रत्येक इवेंट पंक्ति `event: <type>` और `data: <json>` होती है
- स्ट्रीम `data: [DONE]` के साथ समाप्त होती है

वर्तमान में उत्सर्जित इवेंट प्रकार: `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed` (त्रुटि होने पर)।

## उपयोग

जब अंतर्निहित प्रदाता टोकन की संख्याएँ रिपोर्ट करता है, तब `usage` भरा जाता है। उन गणनाओं के डाउनस्ट्रीम स्थिति/सत्र सतहों तक पहुँचने से पहले OpenClaw सामान्य OpenAI-शैली के उपनामों को सामान्यीकृत करता है, जिनमें `input_tokens` / `output_tokens` और `prompt_tokens` / `completion_tokens` शामिल हैं।

## त्रुटियाँ

त्रुटियाँ इस तरह के JSON ऑब्जेक्ट का उपयोग करती हैं:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

सामान्य मामले: `400` अमान्य अनुरोध बॉडी, `401` अनुपलब्ध/अमान्य प्रमाणीकरण, `403` अनुपलब्ध ऑपरेटर स्कोप, `405` गलत विधि, `429` प्रमाणीकरण के बहुत अधिक विफल प्रयास (`Retry-After` के साथ)।

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

- [OpenAI चैट पूर्णताएँ](/hi/gateway/openai-http-api)
- [ऑपरेटर स्कोप](/hi/gateway/operator-scopes)
- [OpenAI](/hi/providers/openai)
