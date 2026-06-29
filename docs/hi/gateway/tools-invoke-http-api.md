---
read_when:
    - पूर्ण agent turn चलाए बिना tools को कॉल करना
    - ऐसे ऑटोमेशन बनाना जिन्हें टूल नीति प्रवर्तन की आवश्यकता हो
summary: Gateway HTTP एंडपॉइंट के माध्यम से किसी एक टूल को सीधे चलाएँ
title: उपकरण API को कॉल करते हैं
x-i18n:
    generated_at: "2026-06-28T23:15:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw का Gateway किसी एक टूल को सीधे invoke करने के लिए एक सरल HTTP endpoint expose करता है। यह हमेशा enabled रहता है और Gateway प्रमाणीकरण के साथ टूल नीति का उपयोग करता है। OpenAI-compatible `/v1/*` surface की तरह, shared-secret bearer प्रमाणीकरण को पूरे gateway के लिए trusted operator access माना जाता है।

- `POST /tools/invoke`
- Gateway जैसा ही port (WS + HTTP multiplex): `http://<gateway-host>:<port>/tools/invoke`

Default अधिकतम payload आकार 2 MB है।

## प्रमाणीकरण

Gateway auth configuration का उपयोग करता है।

सामान्य HTTP auth paths:

- shared-secret auth (`gateway.auth.mode="token"` या `"password"`):
  `Authorization: Bearer <token-or-password>`
- trusted identity-bearing HTTP auth (`gateway.auth.mode="trusted-proxy"`):
  configured identity-aware proxy के माध्यम से route करें और उसे आवश्यक
  identity headers inject करने दें
- private-ingress open auth (`gateway.auth.mode="none"`):
  कोई auth header आवश्यक नहीं

नोट्स:

- जब `gateway.auth.mode="token"` हो, तो `gateway.auth.token` (या `OPENCLAW_GATEWAY_TOKEN`) का उपयोग करें।
- जब `gateway.auth.mode="password"` हो, तो `gateway.auth.password` (या `OPENCLAW_GATEWAY_PASSWORD`) का उपयोग करें।
- जब `gateway.auth.mode="trusted-proxy"` हो, तो HTTP request को configured
  trusted proxy source से आना चाहिए; same-host loopback proxies के लिए explicit
  `gateway.auth.trustedProxy.allowLoopback = true` आवश्यक है।
- Internal same-host callers जो proxy को bypass करते हैं, वे local direct
  fallback के रूप में `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` का
  उपयोग कर सकते हैं। कोई भी `Forwarded`, `X-Forwarded-*`, या `X-Real-IP` header evidence
  request को इसके बजाय trusted-proxy path पर रखता है।
- यदि `gateway.auth.rateLimit` configured है और बहुत अधिक auth failures होते हैं, तो endpoint `Retry-After` के साथ `429` लौटाता है।

## सुरक्षा सीमा (महत्वपूर्ण)

इस endpoint को gateway instance के लिए **पूर्ण operator-access** surface मानें।

- यहां HTTP bearer auth कोई संकीर्ण per-user scope model नहीं है।
- इस endpoint के लिए valid Gateway token/password को owner/operator credential जैसा माना जाना चाहिए।
- shared-secret auth modes (`token` और `password`) के लिए, endpoint normal full operator defaults restore करता है, भले ही caller एक संकरा `x-openclaw-scopes` header भेजे।
- Shared-secret auth इस endpoint पर direct tool invokes को owner-sender turns भी मानता है।
- Trusted identity-bearing HTTP modes (उदाहरण के लिए trusted proxy auth या private ingress पर `gateway.auth.mode="none"`) मौजूद होने पर `x-openclaw-scopes` का सम्मान करते हैं और अन्यथा normal operator default scope set पर fall back करते हैं।
- इस endpoint को केवल loopback/tailnet/private ingress पर रखें; इसे सीधे public internet पर expose न करें।

Auth matrix:

- `gateway.auth.mode="token"` या `"password"` + `Authorization: Bearer ...`
  - shared gateway operator secret के possession को prove करता है
  - संकरे `x-openclaw-scopes` को ignore करता है
  - full default operator scope set restore करता है:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - इस endpoint पर direct tool invokes को owner-sender turns मानता है
- trusted identity-bearing HTTP modes (उदाहरण के लिए trusted proxy auth, या private ingress पर `gateway.auth.mode="none"`)
  - किसी outer trusted identity या deployment boundary को authenticate करते हैं
  - header मौजूद होने पर `x-openclaw-scopes` का सम्मान करते हैं
  - header अनुपस्थित होने पर normal operator default scope set पर fall back करते हैं
  - owner semantics केवल तब खोते हैं जब caller स्पष्ट रूप से scopes को narrow करता है और `operator.admin` को omit करता है

## Request body

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Fields:

- `tool` (string, आवश्यक): invoke करने के लिए टूल नाम।
- `action` (string, वैकल्पिक): यदि tool schema `action` को support करता है और args payload ने इसे omit किया है, तो args में mapped किया जाता है।
- `args` (object, वैकल्पिक): tool-specific arguments।
- `sessionKey` (string, वैकल्पिक): target session key। यदि omit किया गया है या `"main"` है, तो Gateway configured main session key का उपयोग करता है (`session.mainKey` और default agent का सम्मान करता है, या global scope में `global`)।
- `dryRun` (boolean, वैकल्पिक): future use के लिए reserved; अभी ignored है।

## Policy + routing behavior

Tool availability को Gateway agents द्वारा उपयोग की जाने वाली same policy chain से filter किया जाता है:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- group policies (यदि session key किसी group या channel पर map होती है)
- subagent policy (subagent session key के साथ invoke करते समय)

यदि कोई टूल policy द्वारा allowed नहीं है, तो endpoint **404** लौटाता है।

महत्वपूर्ण boundary notes:

- Exec approvals operator guardrails हैं, इस HTTP endpoint के लिए कोई separate authorization boundary नहीं। यदि कोई टूल यहां Gateway auth + tool policy के माध्यम से reachable है, तो `/tools/invoke` कोई extra per-call approval prompt नहीं जोड़ता।
- यदि `exec` यहां reachable है, तो इसे mutating shell surface मानें। `write`, `edit`, `apply_patch`, या HTTP filesystem-write tools को deny करना shell execution को read-only नहीं बनाता।
- Gateway bearer credentials को untrusted callers के साथ share न करें। यदि आपको trust boundaries के बीच separation चाहिए, तो separate gateways चलाएं (और ideally separate OS users/hosts)।

Gateway HTTP default रूप से hard deny list भी apply करता है (भले ही session policy टूल allow करती हो):

- `exec` - direct command execution (RCE surface)
- `spawn` - arbitrary child process creation (RCE surface)
- `shell` - shell command execution (RCE surface)
- `fs_write` - host पर arbitrary file mutation
- `fs_delete` - host पर arbitrary file deletion
- `fs_move` - host पर arbitrary file move/rename
- `apply_patch` - patch application arbitrary files rewrite कर सकता है
- `sessions_spawn` - session orchestration; agents को remotely spawn करना RCE है
- `sessions_send` - cross-session message injection
- `cron` - persistent automation control plane
- `gateway` - gateway control plane; HTTP के माध्यम से reconfiguration रोकता है
- `nodes` - node command relay paired hosts पर system.run तक पहुंच सकता है
- `whatsapp_login` - terminal QR scan की आवश्यकता वाला interactive setup; HTTP पर hangs

आप `gateway.tools` के माध्यम से इस deny list को customize कर सकते हैं:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` exposure override है, scope upgrade नहीं। Identity-bearing HTTP modes में, `cron`, `gateway`, और `nodes` उन callers के लिए unavailable रहते हैं जिनके पास owner/admin identity (`operator.admin`) नहीं है, भले ही वे `gateway.tools.allow` में listed हों। Shared-secret bearer auth अभी भी ऊपर दिए गए full trusted-operator rule का पालन करता है।

Group policies को context resolve करने में मदद करने के लिए, आप optionally set कर सकते हैं:

- `x-openclaw-message-channel: <channel>` (उदाहरण: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (जब multiple accounts मौजूद हों)

## Responses

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (invalid request या tool input error)
- `401` → unauthorized
- `429` → auth rate-limited (`Retry-After` set)
- `404` → tool available नहीं है (not found या allowlisted नहीं)
- `405` → method allowed नहीं है
- `500` → `{ ok: false, error: { type, message } }` (unexpected tool execution error; sanitized message)

## उदाहरण

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## संबंधित

- [Gateway protocol](/hi/gateway/protocol)
- [Tools and plugins](/hi/tools)
