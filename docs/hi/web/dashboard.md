---
read_when:
    - डैशबोर्ड प्रमाणीकरण या एक्सपोज़र मोड बदलना
summary: Gateway डैशबोर्ड (Control UI) की पहुंच और प्रमाणीकरण
title: डैशबोर्ड
x-i18n:
    generated_at: "2026-06-29T00:26:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07e11c1f71e6691ee053192e238a3b48568f81c3180e6b5f8e21b6874417e57e
    source_path: web/dashboard.md
    workflow: 16
---

Gateway डैशबोर्ड वह ब्राउज़र Control UI है जो डिफ़ॉल्ट रूप से `/` पर सर्व किया जाता है
(`gateway.controlUi.basePath` से ओवरराइड करें).

त्वरित खोलना (स्थानीय Gateway):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (या [http://localhost:18789/](http://localhost:18789/))
- `gateway.tls.enabled: true` के साथ, WebSocket endpoint के लिए `https://127.0.0.1:18789/` और
  `wss://127.0.0.1:18789` का उपयोग करें.

मुख्य संदर्भ:

- उपयोग और UI क्षमताओं के लिए [Control UI](/hi/web/control-ui).
- Serve/Funnel automation के लिए [Tailscale](/hi/gateway/tailscale).
- bind modes और सुरक्षा नोट्स के लिए [वेब सतहें](/hi/web).

Authentication कॉन्फ़िगर किए गए gateway auth path के माध्यम से WebSocket handshake पर लागू होता है:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve identity headers जब `gateway.auth.allowTailscale: true`
- trusted-proxy identity headers जब `gateway.auth.mode: "trusted-proxy"`

[Gateway configuration](/hi/gateway/configuration) में `gateway.auth` देखें.

सुरक्षा नोट: Control UI एक **admin surface** है (chat, config, exec approvals).
इसे सार्वजनिक रूप से expose न करें. UI वर्तमान browser tab session और चुने गए gateway URL के लिए dashboard URL tokens को sessionStorage में रखता है, और load के बाद उन्हें URL से हटा देता है.
localhost, Tailscale Serve, या SSH tunnel को प्राथमिकता दें.

## तेज़ पथ (अनुशंसित)

- Onboarding के बाद, CLI dashboard को auto-open करता है और एक clean (non-tokenized) link print करता है.
- कभी भी फिर से खोलें: `openclaw dashboard` (link copy करता है, संभव हो तो browser खोलता है, headless होने पर SSH hint दिखाता है).
- यदि clipboard और browser delivery fail हो जाए, तब भी `openclaw dashboard` clean URL print करता है और आपको URL fragment key `token` के रूप में `OPENCLAW_GATEWAY_TOKEN` या `gateway.auth.token` से token का उपयोग करने को कहता है; यह logs में token values print नहीं करता.
- यदि UI shared-secret auth के लिए prompt करे, तो configured token या password को Control UI settings में paste करें.

## Auth basics (local बनाम remote)

- **Localhost**: `http://127.0.0.1:18789/` खोलें.
- **Gateway TLS**: जब `gateway.tls.enabled: true`, dashboard/status links `https://` का उपयोग करते हैं और Control UI WebSocket links `wss://` का उपयोग करते हैं.
- **Shared-secret token source**: `gateway.auth.token` (या
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` one-time bootstrap के लिए इसे URL fragment के माध्यम से pass कर सकता है, और Control UI इसे localStorage के बजाय वर्तमान browser tab session और चुने गए gateway URL के लिए sessionStorage में रखता है.
- यदि `gateway.auth.token` SecretRef-managed है, तो `openclaw dashboard`
  design के अनुसार एक non-tokenized URL print/copy/open करता है. यह externally managed tokens को shell logs, clipboard history, या browser-launch arguments में expose होने से बचाता है.
- यदि `gateway.auth.token` SecretRef के रूप में configured है और आपकी current shell में unresolved है, तो `openclaw dashboard` फिर भी एक non-tokenized URL और actionable auth setup guidance print करता है.
- **Shared-secret password**: configured `gateway.auth.password` (या
  `OPENCLAW_GATEWAY_PASSWORD`) का उपयोग करें. Dashboard reloads के बीच passwords persist नहीं करता.
- **Identity-bearing modes**: Tailscale Serve identity headers के माध्यम से Control UI/WebSocket auth को satisfy कर सकता है जब `gateway.auth.allowTailscale: true`, और एक non-loopback identity-aware reverse proxy
  `gateway.auth.mode: "trusted-proxy"` को satisfy कर सकता है. इन modes में dashboard को WebSocket के लिए pasted shared secret की आवश्यकता नहीं होती.
- **Localhost नहीं**: Tailscale Serve, non-loopback shared-secret bind, `gateway.auth.mode: "trusted-proxy"` के साथ non-loopback identity-aware reverse proxy, या SSH tunnel का उपयोग करें. HTTP APIs तब भी shared-secret auth का उपयोग करते हैं जब तक आप जानबूझकर private-ingress
  `gateway.auth.mode: "none"` या trusted-proxy HTTP auth नहीं चलाते. [वेब सतहें](/hi/web) देखें.

<a id="if-you-see-unauthorized-1008"></a>

## यदि आपको "unauthorized" / 1008 दिखे

- सुनिश्चित करें कि gateway reachable है (local: `openclaw status`; remote: SSH tunnel `ssh -N -L 18789:127.0.0.1:18789 user@host` फिर `http://127.0.0.1:18789/` खोलें).
- `AUTH_TOKEN_MISMATCH` के लिए, clients cached device token के साथ एक trusted retry कर सकते हैं जब gateway retry hints return करता है. वह cached-token retry token के cached approved scopes को reuse करता है; explicit `deviceToken` / explicit `scopes` callers अपना requested scope set रखते हैं. यदि उस retry के बाद भी auth fail हो, तो token drift को manually resolve करें.
- `AUTH_SCOPE_MISMATCH` के लिए, device token पहचाना गया था लेकिन उसमें dashboard के requested scopes नहीं हैं; shared gateway token rotate करने के बजाय requested scope contract को re-pair या approve करें.
- उस retry path के बाहर, connect auth precedence पहले explicit shared token/password है, फिर explicit `deviceToken`, फिर stored device token, फिर bootstrap token.
- async Tailscale Serve Control UI path पर, उसी `{scope, ip}` के लिए failed attempts को failed-auth limiter द्वारा record किए जाने से पहले serialized किया जाता है, इसलिए दूसरा concurrent bad retry पहले से ही `retry later` दिखा सकता है.
- token drift repair steps के लिए, [Token drift recovery checklist](/hi/cli/devices#token-drift-recovery-checklist) का पालन करें.
- gateway host से shared secret retrieve या supply करें:
  - Token: `openclaw config get gateway.auth.token`
  - Password: configured `gateway.auth.password` या
    `OPENCLAW_GATEWAY_PASSWORD` resolve करें
  - SecretRef-managed token: external secret provider resolve करें या इस shell में
    `OPENCLAW_GATEWAY_TOKEN` export करें, फिर `openclaw dashboard` दोबारा चलाएं
  - कोई shared secret configured नहीं: `openclaw doctor --generate-gateway-token`
- Dashboard settings में, token या password को auth field में paste करें,
  फिर connect करें.
- UI language picker **Overview -> Gateway Access -> Language** में है.
  यह access card का हिस्सा है, Appearance section का नहीं.

## संबंधित

- [Control UI](/hi/web/control-ui)
- [WebChat](/hi/web/webchat)
