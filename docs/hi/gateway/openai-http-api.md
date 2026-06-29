---
read_when:
    - OpenAI Chat Completions की अपेक्षा करने वाले टूल्स को एकीकृत करना
summary: Gateway से OpenAI-संगत /v1/chat/completions HTTP endpoint उपलब्ध कराएँ
title: OpenAI चैट कम्प्लीशन्स
x-i18n:
    generated_at: "2026-06-28T23:10:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw का Gateway एक छोटा OpenAI-संगत Chat Completions endpoint सेवा दे सकता है.

यह endpoint **डिफ़ॉल्ट रूप से अक्षम** है. पहले इसे कॉन्फ़िग में सक्षम करें.

- `POST /v1/chat/completions`
- Gateway जैसा ही पोर्ट (WS + HTTP multiplex): `http://<gateway-host>:<port>/v1/chat/completions`

जब Gateway की OpenAI-संगत HTTP सतह सक्षम होती है, तो यह इन्हें भी सेवा देता है:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

अंदरूनी रूप से, अनुरोध सामान्य Gateway एजेंट रन के रूप में निष्पादित होते हैं (`openclaw agent` जैसा वही codepath), इसलिए routing/permissions/config आपके Gateway से मेल खाते हैं.

## प्रमाणीकरण

Gateway auth कॉन्फ़िगरेशन का उपयोग करता है.

सामान्य HTTP auth पथ:

- साझा-गुप्त auth (`gateway.auth.mode="token"` या `"password"`):
  `Authorization: Bearer <token-or-password>`
- विश्वसनीय पहचान-युक्त HTTP auth (`gateway.auth.mode="trusted-proxy"`):
  कॉन्फ़िगर किए गए identity-aware proxy के माध्यम से रूट करें और उसे आवश्यक
  identity headers इंजेक्ट करने दें
- private-ingress खुला auth (`gateway.auth.mode="none"`):
  कोई auth header आवश्यक नहीं

नोट्स:

- जब `gateway.auth.mode="token"` हो, तो `gateway.auth.token` (या `OPENCLAW_GATEWAY_TOKEN`) का उपयोग करें.
- जब `gateway.auth.mode="password"` हो, तो `gateway.auth.password` (या `OPENCLAW_GATEWAY_PASSWORD`) का उपयोग करें.
- जब `gateway.auth.mode="trusted-proxy"` हो, तो HTTP अनुरोध किसी
  कॉन्फ़िगर किए गए trusted proxy स्रोत से आना चाहिए; same-host loopback proxies के लिए स्पष्ट
  `gateway.auth.trustedProxy.allowLoopback = true` आवश्यक है.
- Proxy को बायपास करने वाले आंतरिक same-host callers
  स्थानीय direct fallback के रूप में `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  का उपयोग कर सकते हैं. कोई भी `Forwarded`, `X-Forwarded-*`, या `X-Real-IP` header evidence
  अनुरोध को इसके बजाय trusted-proxy पथ पर रखता है.
- यदि `gateway.auth.rateLimit` कॉन्फ़िगर है और बहुत अधिक auth विफलताएँ होती हैं, तो endpoint `Retry-After` के साथ `429` लौटाता है.

## सुरक्षा सीमा (महत्वपूर्ण)

इस endpoint को gateway instance के लिए **पूर्ण operator-access** सतह मानें.

- यहाँ HTTP bearer auth कोई संकीर्ण per-user scope मॉडल नहीं है.
- इस endpoint के लिए मान्य Gateway token/password को owner/operator credential जैसा माना जाना चाहिए.
- अनुरोध trusted operator actions जैसे ही control-plane agent path से चलते हैं.
- इस endpoint पर कोई अलग non-owner/per-user tool सीमा नहीं है; जब कोई caller यहाँ Gateway auth पास कर लेता है, तो OpenClaw उस caller को इस gateway के लिए trusted operator मानता है.
- साझा-गुप्त auth modes (`token` और `password`) के लिए, endpoint सामान्य पूर्ण operator defaults को पुनर्स्थापित करता है, भले ही caller संकीर्ण `x-openclaw-scopes` header भेजे.
- विश्वसनीय पहचान-युक्त HTTP modes (उदाहरण के लिए trusted proxy auth या `gateway.auth.mode="none"`) मौजूद होने पर `x-openclaw-scopes` का सम्मान करते हैं और अन्यथा सामान्य operator default scope set पर लौटते हैं.
- यदि लक्ष्य agent policy sensitive tools की अनुमति देती है, तो यह endpoint उनका उपयोग कर सकता है.
- इस endpoint को केवल loopback/tailnet/private ingress पर रखें; इसे सीधे public internet पर expose न करें.

Auth matrix:

- `gateway.auth.mode="token"` या `"password"` + `Authorization: Bearer ...`
  - साझा gateway operator secret के possession को साबित करता है
  - संकीर्ण `x-openclaw-scopes` को अनदेखा करता है
  - पूर्ण default operator scope set को पुनर्स्थापित करता है:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - इस endpoint पर chat turns को owner-sender turns मानता है
- विश्वसनीय पहचान-युक्त HTTP modes (उदाहरण के लिए trusted proxy auth, या private ingress पर `gateway.auth.mode="none"`)
  - किसी बाहरी trusted identity या deployment boundary को authenticate करते हैं
  - header मौजूद होने पर `x-openclaw-scopes` का सम्मान करते हैं
  - header अनुपस्थित होने पर सामान्य operator default scope set पर लौटते हैं
  - owner semantics केवल तब खोते हैं जब caller स्पष्ट रूप से scopes को संकीर्ण करता है और `operator.admin` छोड़ देता है
  - owner-level request controls जैसे `x-openclaw-model` के लिए `operator.admin` आवश्यक है

[Security](/hi/gateway/security) और [Remote access](/hi/gateway/remote) देखें.

## इस endpoint का उपयोग कब करें

जब आप किसी मौजूदा gateway के साथ tooling या trusted app-side backend integrate कर रहे हों और gateway operator credentials को सुरक्षित रूप से रख सकते हों, तब `/v1/chat/completions` का उपयोग करें.

- जब आपका integration उसी gateway के लिए बस एक और operator/client surface हो, तो नया built-in channel जोड़ने के बजाय इसे प्राथमिकता दें.
- Native mobile clients के लिए जो सीधे remote gateway से connect करते हैं, [WebChat](/hi/web/webchat) या [Gateway Protocol](/hi/gateway/protocol) को प्राथमिकता दें और paired-device bootstrap/device-token flow लागू करें ताकि device को shared HTTP token/password की आवश्यकता न हो.
- जब आप किसी बाहरी messaging network को उसके अपने users, rooms, webhook delivery, या outbound transport के साथ integrate कर रहे हों, तब इसके बजाय channel plugin बनाएँ. [Building plugins](/hi/plugins/building-plugins) देखें.

## Agent-first model contract

OpenClaw, OpenAI `model` field को raw provider model id नहीं, बल्कि **agent target** मानता है.

- `model: "openclaw"` कॉन्फ़िगर किए गए default agent पर route करता है.
- `model: "openclaw/default"` भी कॉन्फ़िगर किए गए default agent पर route करता है.
- `model: "openclaw/<agentId>"` किसी विशिष्ट agent पर route करता है.

वैकल्पिक request headers:

- `x-openclaw-model: <provider/model-or-bare-id>` चुने गए agent के लिए backend model override करता है. Shared-secret bearer callers इस header का उपयोग कर सकते हैं. Identity-bearing callers, जैसे trusted-proxy या `x-openclaw-scopes` वाले private no-auth ingress requests, को `operator.admin` चाहिए; write-only callers को `403 missing scope: operator.admin` मिलता है.
- `x-openclaw-agent-id: <agentId>` compatibility override के रूप में समर्थित बना रहता है.
- `x-openclaw-session-key: <sessionKey>` session routing को स्पष्ट रूप से नियंत्रित करता है. मान को `subagent:`, `cron:`, या `acp:` जैसे reserved internal session namespaces का उपयोग नहीं करना चाहिए; ऐसे अनुरोध `400 invalid_request_error` के साथ अस्वीकार किए जाते हैं.
- `x-openclaw-message-channel: <channel>` channel-aware prompts और policies के लिए synthetic ingress channel context सेट करता है.

Compatibility aliases अभी भी स्वीकार किए जाते हैं:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## Endpoint सक्षम करना

`gateway.http.endpoints.chatCompletions.enabled` को `true` पर सेट करें:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## Endpoint अक्षम करना

`gateway.http.endpoints.chatCompletions.enabled` को `false` पर सेट करें:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## Session behavior

डिफ़ॉल्ट रूप से endpoint **प्रति अनुरोध stateless** है (हर call में नई session key generate होती है).

यदि अनुरोध में OpenAI `user` string शामिल है, तो Gateway उससे stable session key derive करता है, ताकि repeated calls एक agent session साझा कर सकें.

Custom apps के लिए, सबसे सुरक्षित default है कि प्रति conversation thread वही `user` value reuse करें. Account-level identifiers से बचें, जब तक आप स्पष्ट रूप से कई conversations या devices को एक OpenClaw session साझा कराना न चाहते हों. `x-openclaw-session-key` का उपयोग केवल तब करें जब आपको कई clients या threads में explicit routing control चाहिए, और application-owned keys चुनें जो `subagent:`, `cron:`, या `acp:` जैसे reserved internal namespaces से शुरू न हों.

## यह सतह क्यों मायने रखती है

यह self-hosted frontends और tooling के लिए सबसे अधिक leverage वाला compatibility set है:

- अधिकांश Open WebUI, LobeChat, और LibreChat setups `/v1/models` की अपेक्षा करते हैं.
- कई RAG systems `/v1/embeddings` की अपेक्षा करते हैं.
- मौजूदा OpenAI chat clients आमतौर पर `/v1/chat/completions` से शुरू कर सकते हैं.
- अधिक agent-native clients बढ़ती संख्या में `/v1/responses` को प्राथमिकता देते हैं.

## Model list और agent routing

<AccordionGroup>
  <Accordion title="`/v1/models` क्या लौटाता है?">
    एक OpenClaw agent-target list.

    लौटाए गए ids `openclaw`, `openclaw/default`, और `openclaw/<agentId>` entries हैं.
    इन्हें सीधे OpenAI `model` values के रूप में उपयोग करें.

  </Accordion>
  <Accordion title="क्या `/v1/models` agents या sub-agents सूचीबद्ध करता है?">
    यह top-level agent targets सूचीबद्ध करता है, backend provider models नहीं और sub-agents नहीं.

    Sub-agents internal execution topology बने रहते हैं. वे pseudo-models के रूप में दिखाई नहीं देते.

  </Accordion>
  <Accordion title="`openclaw/default` क्यों शामिल है?">
    `openclaw/default` कॉन्फ़िगर किए गए default agent का stable alias है.

    इसका मतलब है कि clients एक predictable id का उपयोग जारी रख सकते हैं, भले ही environments के बीच वास्तविक default agent id बदल जाए.

  </Accordion>
  <Accordion title="मैं backend model को कैसे override करूँ?">
    `x-openclaw-model` का उपयोग करें. यह owner-level override है: यह Gateway shared-secret bearer token/password path के साथ काम करता है, और trusted proxy auth जैसे identity-bearing HTTP paths पर `operator.admin` की आवश्यकता होती है.

    उदाहरण:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    यदि आप इसे छोड़ देते हैं, तो चुना गया agent अपने सामान्य configured model choice के साथ चलता है.

  </Accordion>
  <Accordion title="Embeddings इस contract में कैसे fit होते हैं?">
    `/v1/embeddings` वही agent-target `model` ids उपयोग करता है.

    `model: "openclaw/default"` या `model: "openclaw/<agentId>"` का उपयोग करें.
    जब आपको कोई विशिष्ट embedding model चाहिए, तो उसे shared-secret caller या `operator.admin` वाले identity-bearing caller से `x-openclaw-model` में भेजें.
    उस header के बिना, अनुरोध चुने गए agent के सामान्य embedding setup से होकर गुजरता है.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

Server-Sent Events (SSE) प्राप्त करने के लिए `stream: true` सेट करें:

- `Content-Type: text/event-stream`
- हर event line `data: <json>` है
- Stream `data: [DONE]` के साथ समाप्त होता है

## Chat tool contract

`/v1/chat/completions` सामान्य OpenAI Chat clients के साथ compatible function-tool subset का समर्थन करता है.

### समर्थित request fields

- `tools`: `{ "type": "function", "function": { ... } }` की array
- `tool_choice`: `"auto"`, `"none"`, `"required"`, या `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` follow-up turns
- `messages[*].tool_call_id` tool results को prior tool call से वापस bind करने के लिए
- `max_completion_tokens`: number; total completion tokens (reasoning tokens शामिल) के लिए per-call cap. वर्तमान OpenAI Chat Completions field name; जब `max_completion_tokens` और `max_tokens` दोनों भेजे जाएँ तो preferred.
- `max_tokens`: number; backwards compatibility के लिए legacy alias स्वीकार किया जाता है. जब `max_completion_tokens` भी मौजूद हो तो ignored.
- `temperature`: number; best-effort sampling temperature agent stream-param channel के माध्यम से upstream provider को forward किया जाता है.
- `top_p`: number; best-effort nucleus sampling agent stream-param channel के माध्यम से upstream provider को forward किया जाता है.
- `frequency_penalty`: number; best-effort frequency penalty agent stream-param channel के माध्यम से upstream provider को forward किया जाता है. Validated range: -2.0 से 2.0. Out-of-range values के लिए `400 invalid_request_error` लौटाता है.
- `presence_penalty`: number; best-effort presence penalty agent stream-param channel के माध्यम से upstream provider को forward किया जाता है. Validated range: -2.0 से 2.0. Out-of-range values के लिए `400 invalid_request_error` लौटाता है.
- `seed`: number (integer); best-effort seed agent stream-param channel के माध्यम से upstream provider को forward किया जाता है. Non-integer values के लिए `400 invalid_request_error` लौटाता है.
- `stop`: string या 4 strings तक की array; best-effort stop sequences agent stream-param channel के माध्यम से upstream provider को forward किए जाते हैं. 4 से अधिक sequences या non-string/empty entries के लिए `400 invalid_request_error` लौटाता है.

जब कोई भी token-cap फ़ील्ड सेट किया जाता है, तो मान एजेंट stream-param चैनल के माध्यम से अपस्ट्रीम प्रदाता को भेजा जाता है। अपस्ट्रीम प्रदाता को भेजे गए वास्तविक वायर फ़ील्ड का नाम प्रदाता ट्रांसपोर्ट चुनता है: OpenAI-परिवार एंडपॉइंट के लिए `max_completion_tokens`, और उन प्रदाताओं के लिए `max_tokens` जो केवल विरासती नाम स्वीकार करते हैं (जैसे Mistral और Chutes)। सैंपलिंग फ़ील्ड (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) वही stream-param चैनल अपनाते हैं; ChatGPT-आधारित Codex Responses बैकएंड उन्हें सर्वर-साइड हटा देता है क्योंकि वह निश्चित सैंपलिंग का उपयोग करता है। `stop` भी stream-param चैनल पर चलता है और ट्रांसपोर्ट के stop फ़ील्ड से मैप होता है (Chat Completions बैकएंड के लिए `stop`, Anthropic के लिए `stop_sequences`); OpenAI Responses API में stop पैरामीटर नहीं है, इसलिए Responses-समर्थित मॉडलों पर `stop` लागू नहीं होता।

### असमर्थित वैरिएंट

एंडपॉइंट असमर्थित टूल वैरिएंट के लिए `400 invalid_request_error` लौटाता है, जिनमें शामिल हैं:

- गैर-ऐरे `tools`
- गैर-फ़ंक्शन टूल प्रविष्टियां
- अनुपस्थित `tool.function.name`
- `tool_choice` वैरिएंट जैसे `allowed_tools` और `custom`
- `tool_choice.function.name` मान जो दिए गए `tools` से मेल नहीं खाते

`tool_choice: "required"` और फ़ंक्शन-पिन किए गए `tool_choice` के लिए, एंडपॉइंट प्रदर्शित क्लाइंट फ़ंक्शन-टूल सेट को सीमित करता है, रनटाइम को प्रतिक्रिया देने से पहले क्लाइंट टूल कॉल करने का निर्देश देता है, और यदि एजेंट प्रतिक्रिया में मेल खाती संरचित क्लाइंट-टूल कॉल शामिल नहीं है तो त्रुटि लौटाता है। यह अनुबंध कॉलर द्वारा दी गई HTTP `tools` सूची पर लागू होता है, हर आंतरिक OpenClaw एजेंट टूल पर नहीं।

### नॉन-स्ट्रीमिंग टूल प्रतिक्रिया आकार

जब एजेंट टूल कॉल करने का निर्णय लेता है, तो प्रतिक्रिया यह उपयोग करती है:

- `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` प्रविष्टियां इनके साथ:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (JSON string)

टूल कॉल से पहले की असिस्टेंट टिप्पणी `choices[0].message.content` में लौटाई जाती है (संभवतः खाली)।

### स्ट्रीमिंग टूल प्रतिक्रिया आकार

जब `stream: true` हो, तो टूल कॉल incremental SSE chunks के रूप में उत्सर्जित होते हैं:

- प्रारंभिक assistant role delta
- वैकल्पिक असिस्टेंट टिप्पणी deltas
- एक या अधिक `delta.tool_calls` chunks जो टूल पहचान और argument fragments ले जाते हैं
- `finish_reason: "tool_calls"` के साथ अंतिम chunk
- `data: [DONE]`

यदि `stream_options.include_usage=true` हो, तो `[DONE]` से पहले एक trailing usage chunk उत्सर्जित होता है।

### टूल फॉलो-अप लूप

`tool_calls` प्राप्त करने के बाद, क्लाइंट को अनुरोधित फ़ंक्शन चलाने चाहिए और एक फॉलो-अप अनुरोध भेजना चाहिए जिसमें शामिल हो:

- पिछला assistant tool-call message
- मेल खाते `tool_call_id` के साथ एक या अधिक `role: "tool"` messages

यह gateway एजेंट रन को वही reasoning loop जारी रखने और अंतिम असिस्टेंट उत्तर बनाने देता है।

## Open WebUI त्वरित सेटअप

बुनियादी Open WebUI कनेक्शन के लिए:

- Base URL: `http://127.0.0.1:18789/v1`
- macOS पर Docker base URL: `http://host.docker.internal:18789/v1`
- API key: आपका Gateway bearer token
- Model: `openclaw/default`

अपेक्षित व्यवहार:

- `GET /v1/models` को `openclaw/default` सूचीबद्ध करना चाहिए
- Open WebUI को chat model id के रूप में `openclaw/default` का उपयोग करना चाहिए
- यदि आप उस एजेंट के लिए कोई विशिष्ट बैकएंड प्रदाता/मॉडल चाहते हैं, तो एजेंट का सामान्य डिफ़ॉल्ट मॉडल सेट करें या shared-secret caller या `operator.admin` वाले identity-bearing caller से `x-openclaw-model` भेजें

त्वरित स्मोक परीक्षण:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

यदि वह `openclaw/default` लौटाता है, तो अधिकांश Open WebUI सेटअप उसी base URL और token से कनेक्ट हो सकते हैं।

## उदाहरण

एक ऐप वार्तालाप के लिए स्थिर सत्र:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

उस वार्तालाप के लिए वही एजेंट सत्र जारी रखने हेतु बाद की कॉल में वही `user` मान दोबारा उपयोग करें।

नॉन-स्ट्रीमिंग:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

स्ट्रीमिंग:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

मॉडल सूचीबद्ध करें:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

एक मॉडल प्राप्त करें:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

Embeddings बनाएं:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

नोट्स:

- `/v1/models` OpenClaw एजेंट targets लौटाता है, raw provider catalogs नहीं।
- `openclaw/default` हमेशा मौजूद होता है ताकि एक स्थिर id सभी environments में काम करे।
- Backend provider/model overrides `x-openclaw-model` में होते हैं, OpenAI `model` फ़ील्ड में नहीं। identity-bearing HTTP auth paths पर, इस header के लिए `operator.admin` आवश्यक है।
- `/v1/embeddings` `input` को string या strings की array के रूप में support करता है।

## संबंधित

- [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration-reference)
- [OpenAI](/hi/providers/openai)
