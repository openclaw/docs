---
read_when:
    - OpenResponses API का उपयोग करने वाले क्लाइंट्स का एकीकरण
    - आपको आइटम-आधारित इनपुट, क्लाइंट टूल कॉल, या SSE इवेंट चाहिए
summary: Gateway से OpenResponses-संगत /v1/responses HTTP एंडपॉइंट एक्सपोज़ करें
title: OpenResponses API
x-i18n:
    generated_at: "2026-06-28T23:10:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw का Gateway OpenResponses-संगत `POST /v1/responses` एंडपॉइंट सर्व कर सकता है.

यह एंडपॉइंट **डिफ़ॉल्ट रूप से अक्षम** है. पहले इसे कॉन्फ़िग में सक्षम करें.

- `POST /v1/responses`
- Gateway जैसा ही पोर्ट (WS + HTTP मल्टीप्लेक्स): `http://<gateway-host>:<port>/v1/responses`

अंदरूनी तौर पर, अनुरोध सामान्य Gateway एजेंट रन के रूप में निष्पादित होते हैं (`openclaw agent` जैसा ही कोडपाथ), इसलिए रूटिंग/अनुमतियां/कॉन्फ़िग आपके Gateway से मेल खाते हैं.

## प्रमाणीकरण, सुरक्षा, और रूटिंग

ऑपरेशनल व्यवहार [OpenAI Chat Completions](/hi/gateway/openai-http-api) से मेल खाता है:

- मिलते-जुलते Gateway HTTP प्रमाणीकरण पथ का उपयोग करें:
  - साझा-गुप्त प्रमाणीकरण (`gateway.auth.mode="token"` या `"password"`): `Authorization: Bearer <token-or-password>`
  - विश्वसनीय-प्रॉक्सी प्रमाणीकरण (`gateway.auth.mode="trusted-proxy"`): कॉन्फ़िगर किए गए विश्वसनीय प्रॉक्सी स्रोत से पहचान-जागरूक प्रॉक्सी हेडर; same-host लूपबैक प्रॉक्सी के लिए स्पष्ट `gateway.auth.trustedProxy.allowLoopback = true` चाहिए
  - विश्वसनीय-प्रॉक्सी स्थानीय सीधा फ़ॉलबैक: बिना `Forwarded`, `X-Forwarded-*`, या `X-Real-IP` हेडर वाले same-host कॉलर `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` का उपयोग कर सकते हैं
  - निजी-इनग्रेस खुला प्रमाणीकरण (`gateway.auth.mode="none"`): कोई प्रमाणीकरण हेडर नहीं
- एंडपॉइंट को Gateway इंस्टेंस के लिए पूर्ण ऑपरेटर एक्सेस मानें
- साझा-गुप्त प्रमाणीकरण मोड (`token` और `password`) के लिए, संकरे bearer-घोषित `x-openclaw-scopes` मानों को अनदेखा करें और सामान्य पूर्ण ऑपरेटर डिफ़ॉल्ट वापस लाएं
- विश्वसनीय पहचान-युक्त HTTP मोड के लिए (उदाहरण के लिए विश्वसनीय प्रॉक्सी प्रमाणीकरण या `gateway.auth.mode="none"`), मौजूद होने पर `x-openclaw-scopes` का सम्मान करें और अन्यथा सामान्य ऑपरेटर डिफ़ॉल्ट स्कोप सेट पर फ़ॉलबैक करें
- एजेंट चुनें `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, या `x-openclaw-agent-id` से
- जब आप चुने गए एजेंट के बैकएंड मॉडल को ओवरराइड करना चाहते हैं, तो `x-openclaw-model` का उपयोग करें
- स्पष्ट सत्र रूटिंग के लिए `x-openclaw-session-key` का उपयोग करें
- जब आप गैर-डिफ़ॉल्ट कृत्रिम इनग्रेस चैनल संदर्भ चाहते हैं, तो `x-openclaw-message-channel` का उपयोग करें

प्रमाणीकरण मैट्रिक्स:

- `gateway.auth.mode="token"` या `"password"` + `Authorization: Bearer ...`
  - साझा Gateway ऑपरेटर गुप्त के कब्जे को सिद्ध करता है
  - संकरे `x-openclaw-scopes` को अनदेखा करता है
  - पूर्ण डिफ़ॉल्ट ऑपरेटर स्कोप सेट वापस लाता है:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - इस एंडपॉइंट पर चैट टर्न को स्वामी-प्रेषक टर्न मानता है
- विश्वसनीय पहचान-युक्त HTTP मोड (उदाहरण के लिए विश्वसनीय प्रॉक्सी प्रमाणीकरण, या निजी इनग्रेस पर `gateway.auth.mode="none"`)
  - हेडर मौजूद होने पर `x-openclaw-scopes` का सम्मान करते हैं
  - हेडर अनुपस्थित होने पर सामान्य ऑपरेटर डिफ़ॉल्ट स्कोप सेट पर फ़ॉलबैक करते हैं
  - स्वामी semantics केवल तब खोते हैं जब कॉलर स्पष्ट रूप से स्कोप संकरे करता है और `operator.admin` छोड़ देता है

इस एंडपॉइंट को `gateway.http.endpoints.responses.enabled` से सक्षम या अक्षम करें.

उसी संगतता सतह में यह भी शामिल है:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

एजेंट-लक्षित मॉडल, `openclaw/default`, embeddings पास-थ्रू, और बैकएंड मॉडल ओवरराइड कैसे साथ काम करते हैं, इसकी canonical व्याख्या के लिए [OpenAI Chat Completions](/hi/gateway/openai-http-api#agent-first-model-contract) और [मॉडल सूची और एजेंट रूटिंग](/hi/gateway/openai-http-api#model-list-and-agent-routing) देखें.

## सत्र व्यवहार

डिफ़ॉल्ट रूप से एंडपॉइंट **प्रति अनुरोध stateless** है (हर कॉल में नई सत्र कुंजी बनती है).

यदि अनुरोध में OpenResponses `user` स्ट्रिंग शामिल है, तो Gateway उससे स्थिर सत्र कुंजी निकालता है, ताकि दोहराई गई कॉल एजेंट सत्र साझा कर सकें.

## अनुरोध आकार (समर्थित)

अनुरोध item-आधारित इनपुट के साथ OpenResponses API का पालन करता है. वर्तमान समर्थन:

- `input`: स्ट्रिंग या item ऑब्जेक्ट की array.
- `instructions`: सिस्टम prompt में merge किया जाता है.
- `tools`: client tool परिभाषाएं (function tools).
- `tool_choice`: client tools को फ़िल्टर या आवश्यक करने के लिए `"auto"`, `"none"`, `"required"`, या `{ "type": "function", "name": "..." }`.
- `stream`: SSE streaming सक्षम करता है.
- `max_output_tokens`: best-effort output सीमा (provider पर निर्भर).
- `temperature`: provider को forward किया गया best-effort sampling temperature. ChatGPT-आधारित Codex Responses backend द्वारा अनदेखा किया जाता है, जो fixed server-side sampling का उपयोग करता है.
- `top_p`: provider को forward किया गया best-effort nucleus sampling. `temperature` जैसी ही Codex Responses सावधानी लागू है.
- `user`: स्थिर सत्र रूटिंग.

स्वीकार किए जाते हैं लेकिन **वर्तमान में अनदेखे** हैं:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

समर्थित:

- `previous_response_id`: जब अनुरोध उसी एजेंट/user/अनुरोधित-सत्र scope में रहता है, OpenClaw पहले के response सत्र को फिर से उपयोग करता है.

## Items (इनपुट)

### `message`

भूमिकाएं: `system`, `developer`, `user`, `assistant`.

- `system` और `developer` सिस्टम prompt में जोड़े जाते हैं.
- सबसे हाल का `user` या `function_call_output` item "वर्तमान संदेश" बनता है.
- पहले के user/assistant संदेश संदर्भ के लिए history के रूप में शामिल किए जाते हैं.

### `function_call_output` (turn-आधारित tools)

Tool परिणाम model को वापस भेजें:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` और `item_reference`

Schema संगतता के लिए स्वीकार किए जाते हैं, लेकिन prompt बनाते समय अनदेखे किए जाते हैं.

## Tools (client-side function tools)

Tools `tools: [{ type: "function", name, description?, parameters? }]` से दें.

यदि एजेंट किसी tool को call करने का निर्णय लेता है, तो response `function_call` output item लौटाता है.
फिर आप turn जारी रखने के लिए `function_call_output` के साथ follow-up अनुरोध भेजते हैं.

`tool_choice: "required"` और function-pinned `tool_choice` के लिए, endpoint exposed client function-tool set को संकरा करता है, runtime को response देने से पहले client tool call करने का निर्देश देता है, और यदि turn में matching structured client-tool call शामिल नहीं है तो उसे reject करता है. यह contract caller-supplied HTTP `tools` list पर लागू होता है, हर internal OpenClaw agent tool पर नहीं. Non-streaming अनुरोध `api_error` के साथ `502` लौटाते हैं; streaming अनुरोध `response.failed` event emit करते हैं. यह `/v1/chat/completions` contract से मेल खाता है.

## Images (`input_image`)

base64 या URL sources समर्थित हैं:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

अनुमत MIME types (वर्तमान): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
अधिकतम आकार (वर्तमान): 10MB.

## Files (`input_file`)

base64 या URL sources समर्थित हैं:

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

अनुमत MIME types (वर्तमान): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

अधिकतम आकार (वर्तमान): 5MB.

वर्तमान व्यवहार:

- File content decode किया जाता है और **system prompt** में जोड़ा जाता है, user message में नहीं,
  इसलिए यह ephemeral रहता है (session history में persist नहीं होता).
- Decoded file text को जोड़े जाने से पहले **untrusted external content** के रूप में wrap किया जाता है,
  इसलिए file bytes को data माना जाता है, trusted instructions नहीं.
- Injected block स्पष्ट boundary markers जैसे
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` का उपयोग करता है और
  `Source: External` metadata line शामिल करता है.
- यह file-input path prompt budget बचाने के लिए लंबे `SECURITY NOTICE:` banner को जानबूझकर छोड़ता है; boundary markers और metadata फिर भी मौजूद रहते हैं.
- PDFs को पहले text के लिए parse किया जाता है. यदि कम text मिलता है, तो पहले pages images में rasterize किए जाते हैं और model को दिए जाते हैं, और injected file block
  placeholder `[PDF content rendered to images]` का उपयोग करता है.

PDF parsing bundled `document-extract` Plugin द्वारा दी जाती है, जो text extraction और page rendering के लिए `clawpdf` और उसके packaged PDFium WebAssembly runtime का उपयोग करता है.

URL fetch defaults:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (प्रति अनुरोध कुल URL-based `input_file` + `input_image` parts)
- अनुरोध सुरक्षित रखे जाते हैं (DNS resolution, private IP blocking, redirect caps, timeouts).
- Optional hostname allowlists प्रति input type समर्थित हैं (`files.urlAllowlist`, `images.urlAllowlist`).
  - Exact host: `"cdn.example.com"`
  - Wildcard subdomains: `"*.assets.example.com"` (apex से match नहीं करता)
  - खाली या छोड़ी गई allowlists का अर्थ है कोई hostname allowlist restriction नहीं.
- URL-based fetches को पूरी तरह अक्षम करने के लिए, `files.allowUrl: false` और/या `images.allowUrl: false` set करें.

## File + image limits (config)

Defaults को `gateway.http.endpoints.responses` के अंतर्गत tune किया जा सकता है:

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
            maxChars: 200000,
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

छोड़े जाने पर defaults:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- HEIC/HEIF `input_image` sources तब स्वीकार किए जाते हैं जब system converter उपलब्ध हो और provider delivery से पहले JPEG में normalize किए जाते हैं. समर्थित converters macOS `sips`, ImageMagick, GraphicsMagick, या ffmpeg हैं.

सुरक्षा नोट:

- URL allowlists fetch से पहले और redirect hops पर enforce की जाती हैं.
- किसी hostname को allowlist करना private/internal IP blocking को bypass नहीं करता.
- internet-exposed gateways के लिए, app-level guards के अतिरिक्त network egress controls लागू करें.
  [Security](/hi/gateway/security) देखें.

## Streaming (SSE)

Server-Sent Events (SSE) प्राप्त करने के लिए `stream: true` set करें:

- `Content-Type: text/event-stream`
- प्रत्येक event line `event: <type>` और `data: <json>` होती है
- Stream `data: [DONE]` से समाप्त होती है

वर्तमान में emitted event types:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (error पर)

## उपयोग

जब underlying provider token counts report करता है, तब `usage` populate होता है.
OpenClaw उन counters के downstream status/session surfaces तक पहुंचने से पहले common OpenAI-style aliases normalize करता है, जिनमें `input_tokens` / `output_tokens`
और `prompt_tokens` / `completion_tokens` शामिल हैं.

## Errors

Errors ऐसा JSON object उपयोग करते हैं:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

सामान्य मामले:

- `401` missing/invalid auth
- `400` invalid request body
- `405` wrong method

## Examples

Non-streaming:

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

Streaming:

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
- [OpenAI](/hi/providers/openai)
