---
read_when:
    - आप ब्राउज़र से Gateway संचालित करना चाहते हैं
    - आप SSH टनल के बिना Tailnet एक्सेस चाहते हैं
sidebarTitle: Control UI
summary: Gateway के लिए ब्राउज़र-आधारित नियंत्रण UI (चैट, गतिविधि, नोड्स, कॉन्फ़िगरेशन)
title: नियंत्रण UI
x-i18n:
    generated_at: "2026-07-04T20:34:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway द्वारा सर्व किया जाने वाला एक छोटा **Vite + Lit** single-page app है:

- डिफ़ॉल्ट: `http://<host>:18789/`
- वैकल्पिक प्रिफ़िक्स: `gateway.controlUi.basePath` सेट करें (जैसे `/openclaw`)

यह उसी पोर्ट पर **सीधे Gateway WebSocket से** बात करता है।

## तुरंत खोलें (स्थानीय)

अगर Gateway उसी कंप्यूटर पर चल रहा है, तो खोलें:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (या [http://localhost:18789/](http://localhost:18789/))

अगर पेज लोड नहीं होता, तो पहले Gateway शुरू करें: `openclaw gateway`.

<Note>
नेटिव Windows LAN binds पर, Windows Firewall या संगठन-प्रबंधित Group Policy अब भी विज्ञापित LAN URL को ब्लॉक कर सकती है, भले ही Gateway होस्ट पर `127.0.0.1` काम करता हो। Windows होस्ट पर `openclaw gateway status --deep` चलाएं; यह संभावित रूप से ब्लॉक किए गए पोर्ट, प्रोफ़ाइल mismatch, और स्थानीय फ़ायरवॉल नियम रिपोर्ट करता है जिन्हें policy अनदेखा कर सकती है।
</Note>

Auth, WebSocket handshake के दौरान इनके माध्यम से दी जाती है:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve identity headers जब `gateway.auth.allowTailscale: true`
- trusted-proxy identity headers जब `gateway.auth.mode: "trusted-proxy"`

dashboard settings panel वर्तमान browser tab session और चुने गए gateway URL के लिए token रखता है; passwords persist नहीं किए जाते। Onboarding आमतौर पर पहले connect पर shared-secret auth के लिए gateway token generate करता है, लेकिन `gateway.auth.mode` `"password"` होने पर password auth भी काम करता है।

## Device pairing (पहला connection)

जब आप किसी नए browser या device से Control UI से connect करते हैं, तो Gateway आमतौर पर **one-time pairing approval** मांगता है। यह unauthorized access रोकने के लिए एक security measure है।

**आपको क्या दिखेगा:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Pending requests सूचीबद्ध करें">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Request ID से approve करें">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

अगर browser बदले हुए auth details (role/scopes/public key) के साथ pairing retry करता है, तो पिछली pending request supersede हो जाती है और एक नया `requestId` बनाया जाता है। Approval से पहले `openclaw devices list` फिर से चलाएं।

अगर browser पहले से paired है और आप उसे read access से write/admin access में बदलते हैं, तो इसे approval upgrade माना जाता है, silent reconnect नहीं। OpenClaw पुरानी approval active रखता है, broader reconnect को block करता है, और आपसे नए scope set को स्पष्ट रूप से approve करने को कहता है।

Approve हो जाने के बाद device याद रखा जाता है और दोबारा approval की जरूरत नहीं होगी, जब तक आप उसे `openclaw devices revoke --device <id> --role <role>` से revoke न करें। Token rotation और revocation के लिए [Devices CLI](/hi/cli/devices) देखें।

`openclaw_gateway` adapter के माध्यम से connect करने वाले Paperclip agents वही first-run approval flow इस्तेमाल करते हैं। शुरुआती connection attempt के बाद, pending request preview करने के लिए `openclaw devices approve --latest` चलाएं, फिर उसे approve करने के लिए printed `openclaw devices approve <requestId>` command दोबारा चलाएं। Remote gateway के लिए स्पष्ट `--url` और `--token` values पास करें। Restarts के बीच approvals स्थिर रखने के लिए, हर run में नई ephemeral device identity generate करने देने के बजाय Paperclip में persistent `adapterConfig.devicePrivateKeyPem` configure करें।

<Note>
- Direct local loopback browser connections (`127.0.0.1` / `localhost`) auto-approved हैं।
- Tailscale Serve, Control UI operator sessions के लिए pairing round trip skip कर सकता है जब `gateway.auth.allowTailscale: true` हो, Tailscale identity verify हो, और browser अपनी device identity present करे।
- Direct Tailnet binds, LAN browser connects, और device identity के बिना browser profiles को अब भी explicit approval चाहिए।
- हर browser profile एक unique device ID generate करता है, इसलिए browsers बदलने या browser data clear करने पर re-pairing की जरूरत होगी।

</Note>

## Mobile device pair करें

पहले से paired administrator, terminal खोले बिना iOS/Android connection QR बना सकता है:

<Steps>
  <Step title="Mobile pairing खोलें">
    **Nodes** चुनें, फिर **Devices** card में **Pair mobile device** पर click करें।
  </Step>
  <Step title="Phone connect करें">
    OpenClaw mobile app में, **Settings** → **Gateway** खोलें और QR
    code scan करें। इसके बजाय आप setup code copy और paste कर सकते हैं।
  </Step>
  <Step title="Connection confirm करें">
    Official iOS/Android app अपने आप connect करता है। अगर **Devices** कोई
    pending request दिखाता है, तो approve करने से पहले उसका role और scopes review करें।
  </Step>
</Steps>

Setup code बनाने के लिए `operator.admin` चाहिए; इसके बिना sessions के लिए button disabled रहता है। Setup code में short-lived bootstrap credential होता है, इसलिए QR और copied code को valid रहने तक password की तरह संभालें। Remote pairing के लिए, Gateway को `wss://` पर resolve होना चाहिए (उदाहरण के लिए, Tailscale Serve/Funnel के माध्यम से); plain `ws://` केवल loopback और private LAN addresses तक सीमित है। पूरी security और fallback details के लिए [Pairing](/hi/channels/pairing#pair-from-the-control-ui-recommended) देखें।

## Personal identity (browser-local)

Control UI, shared sessions में attribution के लिए outgoing messages से जुड़ी per-browser personal identity (display name और avatar) support करता है। यह browser storage में रहती है, current browser profile तक scoped होती है, और आपके actual भेजे गए messages पर normal transcript authorship metadata से आगे other devices पर sync नहीं होती या server-side persist नहीं होती। Site data clear करने या browsers बदलने पर यह empty reset हो जाती है।

यही browser-local pattern assistant avatar override पर लागू होता है। Uploaded assistant avatars, local browser पर ही gateway-resolved identity को overlay करते हैं और `config.patch` के माध्यम से कभी round-trip नहीं करते। Shared `ui.assistant.avatar` config field अब भी non-UI clients के लिए available है जो field को सीधे लिखते हैं (जैसे scripted gateways या custom dashboards)।

## Runtime config endpoint

Control UI अपनी runtime settings `/control-ui-config.json` से fetch करता है, जो gateway के Control UI base path के relative resolve होता है (उदाहरण के लिए `/__openclaw__/control-ui-config.json` जब UI `/__openclaw__/` के अंतर्गत served हो)। यह endpoint HTTP surface के बाकी हिस्से जैसी ही gateway auth से gated है: unauthenticated browsers इसे fetch नहीं कर सकते, और successful fetch के लिए या तो पहले से valid gateway token/password, Tailscale Serve identity, या trusted-proxy identity चाहिए।

## Language support

Control UI पहली load पर आपके browser locale के आधार पर खुद को localize कर सकता है। बाद में override करने के लिए, **Overview -> Gateway Access -> Language** खोलें। Locale picker Gateway Access card में रहता है, Appearance के नीचे नहीं।

- Supported locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Non-English translations browser में lazy-loaded होती हैं।
- Selected locale browser storage में saved होता है और future visits पर reused होता है।
- Missing translation keys English पर fall back करती हैं।

Docs translations उसी non-English locale set के लिए generate की जाती हैं, लेकिन docs site का built-in Mintlify language picker केवल उन locale codes तक सीमित है जिन्हें Mintlify accept करता है। Thai (`th`) और Persian (`fa`) docs अब भी publish repo में generated होती हैं; वे उस picker में तब तक appear नहीं हो सकतीं जब तक Mintlify उन codes को support न करे।

## Appearance themes

Appearance panel built-in Claw, Knot, और Dash themes, plus एक browser-local tweakcn import slot रखता है। Theme import करने के लिए, [tweakcn editor](https://tweakcn.com/editor/theme) खोलें, theme चुनें या बनाएं, **Share** पर click करें, और copied theme link को Appearance में paste करें। Importer `https://tweakcn.com/r/themes/<id>` registry URLs, `https://tweakcn.com/editor/theme?theme=amethyst-haze` जैसे editor URLs, relative `/themes/<id>` paths, raw theme IDs, और `amethyst-haze` जैसे default theme names भी accept करता है।

Appearance में browser-local Text size setting भी शामिल है। यह setting Control UI preferences के बाकी हिस्से के साथ stored होती है, chat text, composer text, tool cards, और chat sidebars पर apply होती है, और text inputs को कम से कम 16px रखती है ताकि mobile Safari focus पर auto-zoom न करे।

Imported themes केवल current browser profile में stored होती हैं। वे gateway config में नहीं लिखी जातीं और devices के बीच sync नहीं होतीं। Imported theme को replace करने से one local slot update होता है; उसे clear करने पर active theme वापस Claw पर switch हो जाती है अगर imported theme selected थी।

## यह क्या कर सकता है (आज)

<AccordionGroup>
  <Accordion title="Chat और Talk">
    - Gateway WS के माध्यम से model से chat करें (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)।
    - Chat history refreshes per-message text caps के साथ bounded recent window request करते हैं, ताकि बड़े sessions browser को chat usable होने से पहले full transcript payload render करने के लिए मजबूर न करें।
    - Browser realtime sessions के माध्यम से talk करें। OpenAI direct WebRTC इस्तेमाल करता है, Google Live WebSocket पर constrained one-use browser token इस्तेमाल करता है, और backend-only realtime voice plugins Gateway relay transport इस्तेमाल करते हैं। Client-owned provider sessions `talk.client.create` से start होते हैं; Gateway relay sessions `talk.session.create` से start होते हैं। Relay provider credentials को Gateway पर रखता है जबकि browser microphone PCM को `talk.session.appendAudio` के माध्यम से stream करता है, `openclaw_agent_consult` provider tool calls को Gateway policy और बड़े configured OpenClaw model के लिए `talk.client.toolCall` के माध्यम से forward करता है, और active-run voice steering को `talk.client.steer` या `talk.session.steer` के माध्यम से route करता है।
    - Chat में tool calls + live tool output cards stream करें (agent events)।
    - Existing `session.tool` / tool event delivery से live tool activity की browser-local, redaction-first summaries वाला Activity tab।

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: built-in plus bundled/external plugin channels status, QR login, और per-channel config (`channels.status`, `web.login.*`, `config.patch`)।
    - Channel probe refreshes slow provider checks finish होने तक previous snapshot visible रखते हैं, और probe या audit अपने UI budget से exceed होने पर partial snapshots labeled होते हैं।
    - Instances: presence list + refresh (`system-presence`)।
    - Sessions: default रूप से configured-agent sessions सूचीबद्ध करें, frequent sessions pin करें, उनका नाम बदलें, inactive sessions archive या restore करें, stale unconfigured agent session keys से fall back करें, और per-session model/thinking/fast/verbose/trace/reasoning overrides apply करें (`sessions.list`, `sessions.patch`)। Pinned sessions recent unpinned sessions से ऊपर sort होते हैं; archived sessions Sessions page के archived view में रहते हैं और अपने transcripts रखते हैं।
    - Dreams: dreaming status, enable/disable toggle, और Dream Diary reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)।

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron jobs: list/add/edit/run/enable/disable + run history (`cron.*`)।
    - Skills: status, enable/disable, install, API key updates (`skills.*`)।
    - Nodes: list + caps (`node.list`), mobile setup codes बनाएं, और device pairing approve करें (`device.pair.*`)।
    - Exec approvals: gateway या node allowlists edit करें + `exec host=gateway/node` के लिए ask policy (`exec.approvals.*`)।

  </Accordion>
  <Accordion title="कॉन्फ़िग">
    - `~/.openclaw/openclaw.json` देखें/संपादित करें (`config.get`, `config.set`)।
    - MCP में कॉन्फ़िगर किए गए सर्वरों, सक्षमकरण, OAuth/फ़िल्टर/समानांतर सारांशों, सामान्य ऑपरेटर कमांडों, और स्कोप किए गए `mcp` कॉन्फ़िग संपादक के लिए एक समर्पित सेटिंग पेज है।
    - सत्यापन के साथ लागू करें + पुनरारंभ करें (`config.apply`) और अंतिम सक्रिय सत्र को जगाएं।
    - समकालिक संपादनों को ओवरराइट होने से रोकने के लिए लिखाई में base-hash guard शामिल होता है।
    - लिखाई (`config.set`/`config.apply`/`config.patch`) सबमिट किए गए कॉन्फ़िग payload में refs के लिए सक्रिय SecretRef resolution का preflight करती है; अनसुलझे सक्रिय सबमिट किए गए refs लिखाई से पहले अस्वीकार कर दिए जाते हैं।
    - फ़ॉर्म सेव ऐसे पुराने redacted placeholders को हटाते हैं जिन्हें सेव किए गए कॉन्फ़िग से पुनर्स्थापित नहीं किया जा सकता, जबकि उन redacted मानों को सुरक्षित रखते हैं जो अब भी सेव किए गए secrets से मैप होते हैं।
    - Schema + फ़ॉर्म rendering (`config.schema` / `config.schema.lookup`, जिसमें field `title` / `description`, मेल खाते UI hints, तत्काल child summaries, nested object/wildcard/array/composition nodes पर docs metadata, साथ ही उपलब्ध होने पर plugin + channel schemas शामिल हैं); Raw JSON editor केवल तब उपलब्ध होता है जब snapshot में सुरक्षित raw round-trip हो।
    - यदि कोई snapshot raw text को सुरक्षित रूप से round-trip नहीं कर सकता, तो Control UI उस snapshot के लिए Form mode लागू करता है और Raw mode अक्षम करता है।
    - Raw JSON editor "सेव किए गए पर रीसेट करें" flattened snapshot को फिर से render करने के बजाय raw-authored shape (formatting, comments, `$include` layout) को सुरक्षित रखता है, इसलिए जब snapshot सुरक्षित रूप से round-trip कर सकता है तो बाहरी संपादन reset के बाद भी बने रहते हैं।
    - Structured SecretRef object values को form text inputs में read-only render किया जाता है ताकि आकस्मिक object-to-string corruption रोका जा सके।

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status/health/models snapshots + event log + manual RPC calls (`status`, `health`, `models.list`)।
    - event log में Control UI refresh/RPC timings, slow chat/config render timings, और जब browser उन PerformanceObserver entry types को expose करता है तब long animation frames या long tasks के लिए browser responsiveness entries शामिल होती हैं।
    - Logs: filter/export के साथ Gateway file logs की live tail (`logs.tail`)।
    - Update: restart report के साथ package/git update + restart (`update.run`) चलाएं, फिर reconnect के बाद `update.status` poll करके running Gateway version सत्यापित करें।

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - isolated jobs के लिए, delivery का default announce summary होता है। यदि आप internal-only runs चाहते हैं तो none पर स्विच कर सकते हैं।
    - announce चुने जाने पर channel/target fields दिखाई देते हैं।
    - Webhook mode `delivery.mode = "webhook"` का उपयोग करता है, जिसमें `delivery.to` एक वैध HTTP(S) webhook URL पर set होता है।
    - main-session jobs के लिए, webhook और none delivery modes उपलब्ध हैं।
    - Advanced edit controls में delete-after-run, clear agent override, cron exact/stagger options, agent model/thinking overrides, और best-effort delivery toggles शामिल हैं।
    - Form validation field-level errors के साथ inline है; invalid values save button को ठीक होने तक disable कर देते हैं।
    - समर्पित bearer token भेजने के लिए `cron.webhookToken` set करें; यदि छोड़ा गया हो तो webhook auth header के बिना भेजा जाता है।
    - Deprecated fallback: `notify: true` वाले stored legacy jobs को `cron.webhook` से explicit per-job webhook या completion delivery में migrate करने के लिए `openclaw doctor --fix` चलाएं।

  </Accordion>
</AccordionGroup>

## MCP पेज

समर्पित MCP पेज `mcp.servers` के अंतर्गत OpenClaw-managed MCP servers के लिए एक operator view है। यह अपने आप MCP transports शुरू नहीं करता; saved config को inspect और edit करने के लिए इसका उपयोग करें, फिर जब live server proof चाहिए हो तो `openclaw mcp doctor --probe` का उपयोग करें।

सामान्य workflow:

1. sidebar से **MCP** खोलें।
2. total, enabled, OAuth, और filtered server counts के लिए summary cards जांचें।
3. transport, enablement, auth, filters, timeouts, और command hints के लिए प्रत्येक server row देखें।
4. जब कोई server configured रहना चाहिए लेकिन runtime discovery से बाहर रहना चाहिए, तो enablement toggle करें।
5. server definitions, headers, TLS/mTLS paths, OAuth metadata, tool filters, और Codex projection metadata के लिए scoped `mcp` config section संपादित करें।
6. config write के लिए **Save** का उपयोग करें, या जब running Gateway को बदला हुआ config लागू करना चाहिए तो **Save & Publish** का उपयोग करें।
7. जब edited process को static diagnostics, live proof, या cached-runtime disposal चाहिए हो, तो terminal से `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, या `openclaw mcp reload` चलाएं।

पेज rendering से पहले credential-bearing URL-like values को redact करता है और command snippets में server names को quote करता है ताकि copied commands spaces या shell metacharacters के साथ भी काम करें। पूरा CLI और config reference [MCP](/hi/cli/mcp) में है।

## Activity tab

Activity tab live tool activity के लिए एक ephemeral browser-local observer है। यह उसी Gateway `session.tool` / tool event stream से निकला है जो Chat tool cards को चलाता है; यह कोई दूसरी Gateway event family, endpoint, durable activity store, metrics feed, या external observer stream नहीं जोड़ता।

Activity entries केवल sanitized summaries और redacted, truncated output previews रखती हैं। Tool argument values Activity state में store नहीं किए जाते; UI दिखाता है कि arguments hidden हैं और केवल argument field count record करता है। in-memory list current browser tab का अनुसरण करती है, Control UI के भीतर navigation के दौरान बची रहती है, और page reload, session switch, या **Clear** पर reset होती है।

## Chat व्यवहार

<AccordionGroup>
  <Accordion title="Send और history semantics">
    - `chat.send` **non-blocking** है: यह `{ runId, status: "started" }` के साथ तुरंत ack करता है और response `chat` events के माध्यम से stream होता है। Trusted Control UI clients local diagnostics के लिए optional ACK timing metadata भी receive कर सकते हैं।
    - Chat uploads images के साथ non-video files स्वीकार करते हैं। Images native image path रखती हैं; अन्य files managed media के रूप में store होती हैं और history में attachment links के रूप में दिखाई जाती हैं।
    - उसी `idempotencyKey` के साथ दोबारा भेजने पर running के दौरान `{ status: "in_flight" }`, और completion के बाद `{ status: "ok" }` लौटता है।
    - `chat.history` responses UI safety के लिए size-bounded हैं। जब transcript entries बहुत बड़ी होती हैं, Gateway लंबे text fields को truncate कर सकता है, भारी metadata blocks छोड़ सकता है, और oversized messages को placeholder (`[chat.history omitted: message too large]`) से बदल सकता है।
    - जब कोई visible assistant message `chat.history` में truncated था, तो side reader जरूरत पड़ने पर `sessionKey`, जरूरत होने पर active `agentId`, और transcript `messageId` द्वारा `chat.message.get` के माध्यम से पूरा display-normalized transcript entry fetch कर सकता है। यदि Gateway अब भी अधिक नहीं लौटा सकता, तो reader truncated preview को चुपचाप दोहराने के बजाय explicit unavailable state दिखाता है।
    - Assistant/generated images managed media references के रूप में persist की जाती हैं और authenticated Gateway media URLs के माध्यम से वापस serve की जाती हैं, इसलिए reloads raw base64 image payloads के chat history response में बने रहने पर निर्भर नहीं करते।
    - `chat.history` render करते समय, Control UI visible assistant text से display-only inline directive tags (उदाहरण के लिए `[[reply_to_*]]` और `[[audio_as_voice]]`), plain-text tool-call XML payloads (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और truncated tool-call blocks शामिल हैं), और leaked ASCII/full-width model control tokens हटाता है, और उन assistant entries को छोड़ देता है जिनका पूरा visible text केवल exact silent token `NO_REPLY` / `no_reply` या heartbeat acknowledgement token `HEARTBEAT_OK` है।
    - active send और final history refresh के दौरान, यदि `chat.history` थोड़ी देर के लिए पुराना snapshot लौटाता है तो chat view local optimistic user/assistant messages को visible रखता है; Gateway history के catch up होते ही canonical transcript उन local messages को replace कर देता है।
    - Live `chat` events delivery state हैं, जबकि `chat.history` durable session transcript से rebuild होता है। tool-final events के बाद Control UI history reload करता है और केवल एक छोटी optimistic tail merge करता है; transcript boundary [WebChat](/hi/web/webchat) में documented है।
    - `chat.inject` session transcript में assistant note append करता है और UI-only updates के लिए `chat` event broadcast करता है (कोई agent run नहीं, कोई channel delivery नहीं)।
    - sidebar recent sessions को New Session action, All Sessions link, और session search button के साथ list करता है जो full session picker खोलता है (selected agent द्वारा scoped, search और pagination के साथ)। agents switch करने पर केवल उस agent से जुड़े sessions दिखते हैं और यदि उसके पास अभी saved dashboard sessions नहीं हैं तो उस agent के main session पर fall back होता है।
    - प्रत्येक session-picker row session को rename, pin, या archive कर सकती है। active run और agent का main session archive नहीं किया जा सकता। currently selected session को archive करने पर Chat वापस उस agent के main session पर switch हो जाता है।
    - desktop widths पर, chat controls एक compact row में रहते हैं और transcript में नीचे scroll करते समय collapse हो जाते हैं; ऊपर scroll करने, top पर लौटने, या bottom तक पहुंचने पर controls restore हो जाते हैं।
    - लगातार duplicate text-only messages count badge के साथ एक bubble के रूप में render होते हैं। Images, attachments, tool output, या canvas previews रखने वाले messages uncollapsed छोड़े जाते हैं।
    - chat header model और thinking pickers active session को तुरंत `sessions.patch` के माध्यम से patch करते हैं; वे persistent session overrides हैं, one-turn-only send options नहीं।
    - यदि आप उसी session के लिए model picker change save होते समय message भेजते हैं, तो composer `chat.send` call करने से पहले उस session patch की प्रतीक्षा करता है ताकि send selected model का उपयोग करे।
    - Control UI में `/new` type करने पर New Chat जैसी ही fresh dashboard session बनती है और switch होती है, सिवाय इसके कि जब `session.dmScope: "main"` configured हो और current parent agent का main session हो; उस स्थिति में यह main session को in place reset करता है। `/reset` type करने पर current session के लिए Gateway का explicit in-place reset बना रहता है।
    - chat model picker Gateway का configured model view request करता है। यदि `agents.defaults.models` मौजूद है, तो वह allowlist picker को drive करती है, जिसमें `provider/*` entries शामिल हैं जो provider-scoped catalogs को dynamic रखती हैं। अन्यथा picker explicit `models.providers.*.models` entries और usable auth वाले providers दिखाता है। पूरा catalog debug `models.list` RPC के माध्यम से `view: "all"` के साथ उपलब्ध रहता है।
    - जब fresh Gateway session usage reports में current context tokens शामिल होते हैं, तो chat composer toolbar used percentage के साथ एक छोटा context usage ring दिखाता है; पूरा token detail उसके tooltip में रहता है। high context pressure पर ring warning styling में switch होता है और recommended Compaction levels पर एक compact button दिखाता है जो normal session Compaction path चलाता है। Stale token snapshots तब तक hidden रहते हैं जब तक Gateway फिर से fresh usage report नहीं करता।

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Talk mode एक registered realtime voice provider का उपयोग करता है। OpenAI को `talk.realtime.provider: "openai"` के साथ एक `openai` API-key auth profile, `talk.realtime.providers.openai.apiKey`, या `OPENAI_API_KEY` से configure करें; OpenAI OAuth profiles Realtime voice configure नहीं करते। Google को `talk.realtime.provider: "google"` के साथ `talk.realtime.providers.google.apiKey` से configure करें। browser को कभी standard provider API key नहीं मिलती। OpenAI WebRTC के लिए एक ephemeral Realtime client secret receive करता है। Google Live browser WebSocket session के लिए one-use constrained Live API auth token receive करता है, जिसमें instructions और tool declarations Gateway द्वारा token में locked होते हैं। वे providers जो केवल backend realtime bridge expose करते हैं, Gateway relay transport के माध्यम से चलते हैं, इसलिए credentials और vendor sockets server-side रहते हैं जबकि browser audio authenticated Gateway RPCs के माध्यम से चलता है। Realtime session prompt Gateway द्वारा assembled होता है; `talk.client.create` caller-provided instruction overrides स्वीकार नहीं करता।

    चैट कंपोज़र में बातचीत शुरू/बंद बटन के बगल में बातचीत विकल्प बटन शामिल होता है। ये विकल्प अगले बातचीत सत्र पर लागू होते हैं और प्रदाता, ट्रांसपोर्ट, मॉडल, आवाज़, रीजनिंग प्रयास, VAD थ्रेशोल्ड, मौन अवधि, और प्रीफ़िक्स पैडिंग को ओवरराइड कर सकते हैं। जब कोई विकल्प खाली होता है, तो Gateway जहाँ उपलब्ध हो वहाँ कॉन्फ़िगर किए गए डिफ़ॉल्ट या प्रदाता डिफ़ॉल्ट का उपयोग करता है। Gateway रिले चुनने से बैकएंड रिले पथ बाध्य होता है; WebRTC चुनने से सत्र क्लाइंट-स्वामित्व वाला रहता है और यदि प्रदाता ब्राउज़र सत्र नहीं बना सकता, तो चुपचाप रिले पर वापस जाने के बजाय विफल हो जाता है।

    चैट कंपोज़र में, बातचीत नियंत्रण माइक्रोफ़ोन डिक्टेशन बटन के बगल वाला तरंगों का बटन है। जब बातचीत शुरू होती है, तो कंपोज़र स्थिति पंक्ति ऑडियो कनेक्ट होने तक `Connecting Talk...`, फिर `Talk live`, या रियलटाइम टूल कॉल के `talk.client.toolCall` के माध्यम से कॉन्फ़िगर किए गए बड़े मॉडल से परामर्श करते समय `Asking OpenClaw...` दिखाती है।

    मेंटेनर लाइव स्मोक: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` OpenAI बैकएंड WebSocket ब्रिज, OpenAI ब्राउज़र WebRTC SDP एक्सचेंज, Google Live सीमित-टोकन ब्राउज़र WebSocket सेटअप, और नकली माइक्रोफ़ोन मीडिया के साथ Gateway रिले ब्राउज़र अडैप्टर सत्यापित करता है। कमांड केवल प्रदाता स्थिति प्रिंट करता है और रहस्य लॉग नहीं करता।

  </Accordion>
  <Accordion title="Stop and abort">
    - **Stop** पर क्लिक करें (`chat.abort` कॉल करता है)।
    - जब कोई रन सक्रिय हो, सामान्य फ़ॉलो-अप कतार में जाते हैं। कतारबद्ध संदेश पर **Steer** क्लिक करके उस फ़ॉलो-अप को चल रहे टर्न में इंजेक्ट करें।
    - आउट-ऑफ़-बैंड निरस्त करने के लिए `/stop` टाइप करें (या `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` जैसे स्वतंत्र abort वाक्यांश)।
    - `chat.abort` उस सत्र के सभी सक्रिय रन निरस्त करने के लिए `{ sessionKey }` (बिना `runId`) का समर्थन करता है।

  </Accordion>
  <Accordion title="Abort partial retention">
    - जब कोई रन निरस्त होता है, तब भी आंशिक सहायक टेक्स्ट UI में दिखाया जा सकता है।
    - buffered आउटपुट मौजूद होने पर Gateway निरस्त किए गए आंशिक सहायक टेक्स्ट को ट्रांसक्रिप्ट इतिहास में स्थायी करता है।
    - स्थायी प्रविष्टियों में abort मेटाडेटा शामिल होता है, ताकि ट्रांसक्रिप्ट उपभोक्ता abort partials को सामान्य completion आउटपुट से अलग पहचान सकें।

  </Accordion>
</AccordionGroup>

## PWA इंस्टॉल और वेब पुश

Control UI में `manifest.webmanifest` और एक सर्विस वर्कर शामिल होता है, इसलिए आधुनिक ब्राउज़र इसे standalone PWA के रूप में इंस्टॉल कर सकते हैं। Web Push Gateway को सूचनाओं के साथ इंस्टॉल किए गए PWA को जगाने देता है, भले ही टैब या ब्राउज़र विंडो खुली न हो।

यदि OpenClaw अपडेट के तुरंत बाद पेज **Protocol mismatch** दिखाता है, तो पहले `openclaw dashboard` के साथ डैशबोर्ड दोबारा खोलें और पेज को hard-refresh करें। यदि फिर भी विफलता रहे, तो डैशबोर्ड origin के लिए साइट डेटा साफ़ करें या निजी ब्राउज़र विंडो में परीक्षण करें; कोई पुराना टैब या ब्राउज़र service-worker cache नए Gateway के विरुद्ध pre-update Control UI bundle चलाता रह सकता है।

| सतह                                                  | यह क्या करता है                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest. पहुँच योग्य होने पर ब्राउज़र "ऐप इंस्टॉल करें" पेश करते हैं। |
| `ui/public/sw.js`                                     | सर्विस वर्कर जो `push` इवेंट और सूचना क्लिक संभालता है। |
| `push/vapid-keys.json` (OpenClaw state dir के अंतर्गत) | Web Push payloads पर हस्ताक्षर करने के लिए उपयोग की जाने वाली auto-generated VAPID keypair। |
| `push/web-push-subscriptions.json`                    | स्थायी किए गए ब्राउज़र subscription endpoints। |

जब आप कुंजियाँ स्थिर रखना चाहते हैं (multi-host deployments, secrets rotation, या tests के लिए), Gateway प्रक्रिया पर env vars के माध्यम से VAPID keypair ओवरराइड करें:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (डिफ़ॉल्ट `https://openclaw.ai` है)

Control UI ब्राउज़र subscriptions रजिस्टर और टेस्ट करने के लिए इन scope-gated Gateway methods का उपयोग करता है:

- `push.web.vapidPublicKey` — सक्रिय VAPID public key लाता है।
- `push.web.subscribe` — `endpoint` और `keys.p256dh`/`keys.auth` रजिस्टर करता है।
- `push.web.unsubscribe` — रजिस्टर किया गया endpoint हटाता है।
- `push.web.test` — caller के subscription को test notification भेजता है।

<Note>
Web Push iOS APNS relay path (relay-backed push के लिए [Configuration](/hi/gateway/configuration) देखें) और मौजूदा `push.test` method से स्वतंत्र है, जो native mobile pairing को target करते हैं।
</Note>

## Hosted embeds

Assistant messages `[embed ...]` shortcode के साथ hosted web content inline render कर सकते हैं। iframe sandbox policy `gateway.controlUi.embedSandbox` द्वारा नियंत्रित होती है:

<Tabs>
  <Tab title="strict">
    hosted embeds के भीतर script execution अक्षम करता है।
  </Tab>
  <Tab title="scripts (default)">
    origin isolation बनाए रखते हुए interactive embeds की अनुमति देता है; यह डिफ़ॉल्ट है और आमतौर पर self-contained browser games/widgets के लिए पर्याप्त होता है।
  </Tab>
  <Tab title="trusted">
    same-site documents के लिए `allow-scripts` के ऊपर `allow-same-origin` जोड़ता है जिन्हें जानबूझकर मजबूत privileges चाहिए।
  </Tab>
</Tabs>

उदाहरण:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
`trusted` का उपयोग केवल तब करें जब embedded document को सचमुच same-origin behavior चाहिए। अधिकतर agent-generated games और interactive canvases के लिए, `scripts` अधिक सुरक्षित विकल्प है।
</Warning>

Absolute external `http(s)` embed URLs डिफ़ॉल्ट रूप से blocked रहते हैं। यदि आप जानबूझकर `[embed url="https://..."]` को third-party pages load करने देना चाहते हैं, तो `gateway.controlUi.allowExternalEmbedUrls: true` सेट करें।

## चैट संदेश चौड़ाई

Grouped chat messages एक पढ़ने योग्य default max-width का उपयोग करते हैं। Wide-monitor deployments bundled CSS patch किए बिना `gateway.controlUi.chatMessageMaxWidth` सेट करके इसे ओवरराइड कर सकते हैं:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

ब्राउज़र तक पहुँचने से पहले मान validated होता है। समर्थित मानों में plain lengths और percentages जैसे `960px` या `82%`, साथ ही constrained `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, और `fit-content(...)` width expressions शामिल हैं।

## Tailnet पहुँच (अनुशंसित)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway को loopback पर रखें और Tailscale Serve को HTTPS के साथ इसे proxy करने दें:

    ```bash
    openclaw gateway --tailscale serve
    ```

    खोलें:

    - `https://<magicdns>/` (या आपका configured `gateway.controlUi.basePath`)

    डिफ़ॉल्ट रूप से, जब `gateway.auth.allowTailscale` `true` हो, Control UI/WebSocket Serve requests Tailscale identity headers (`tailscale-user-login`) के माध्यम से authenticate कर सकते हैं। OpenClaw `x-forwarded-for` address को `tailscale whois` के साथ resolve करके और उसे header से match करके identity सत्यापित करता है, और इन्हें केवल तब स्वीकार करता है जब request loopback पर Tailscale के `x-forwarded-*` headers के साथ hit करती है। ब्राउज़र device identity वाले Control UI operator sessions के लिए, यह verified Serve path device-pairing round trip भी छोड़ देता है; device-less browsers और node-role connections फिर भी normal device checks का पालन करते हैं। यदि आप Serve traffic के लिए भी explicit shared-secret credentials आवश्यक करना चाहते हैं, तो `gateway.auth.allowTailscale: false` सेट करें। फिर `gateway.auth.mode: "token"` या `"password"` का उपयोग करें।

    उस async Serve identity path के लिए, समान client IP और auth scope के failed auth attempts rate-limit writes से पहले serialized होते हैं। इसलिए उसी ब्राउज़र से concurrent bad retries दूसरे request पर parallel में race करते हुए दो plain mismatches के बजाय `retry later` दिखा सकते हैं।

    <Warning>
    Tokenless Serve auth मानता है कि gateway host trusted है। यदि उस host पर untrusted local code चल सकता है, तो token/password auth आवश्यक करें।
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    फिर खोलें:

    - `http://<tailscale-ip>:18789/` (या आपका configured `gateway.controlUi.basePath`)

    matching shared secret को UI settings में paste करें (`connect.params.auth.token` या `connect.params.auth.password` के रूप में भेजा गया)।

  </Tab>
</Tabs>

## असुरक्षित HTTP

यदि आप plain HTTP (`http://<lan-ip>` या `http://<tailscale-ip>`) पर dashboard खोलते हैं, तो ब्राउज़र **non-secure context** में चलता है और WebCrypto को block करता है। डिफ़ॉल्ट रूप से, OpenClaw device identity के बिना Control UI connections को **blocks** करता है।

Documented exceptions:

- `gateway.controlUi.allowInsecureAuth=true` के साथ localhost-only insecure HTTP compatibility
- `gateway.auth.mode: "trusted-proxy"` के माध्यम से सफल operator Control UI auth
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**अनुशंसित सुधार:** HTTPS (Tailscale Serve) का उपयोग करें या UI को locally खोलें:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway host पर)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` केवल local compatibility toggle है:

    - यह localhost Control UI sessions को non-secure HTTP contexts में device identity के बिना आगे बढ़ने देता है।
    - यह pairing checks को bypass नहीं करता।
    - यह remote (non-localhost) device identity requirements को relax नहीं करता।

  </Accordion>
  <Accordion title="Break-glass only">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` Control UI device identity checks को अक्षम करता है और यह गंभीर security downgrade है। emergency use के बाद जल्दी revert करें।
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - सफल trusted-proxy auth **operator** Control UI sessions को device identity के बिना admit कर सकता है।
    - यह node-role Control UI sessions तक extend नहीं होता।
    - Same-host loopback reverse proxies फिर भी trusted-proxy auth satisfy नहीं करते; [Trusted proxy auth](/hi/gateway/trusted-proxy-auth) देखें।

  </Accordion>
</AccordionGroup>

HTTPS setup guidance के लिए [Tailscale](/hi/gateway/tailscale) देखें।

## Content security policy

Control UI एक tight `img-src` policy के साथ ship होता है: केवल **same-origin** assets, `data:` URLs, और locally generated `blob:` URLs allowed हैं। Remote `http(s)` और protocol-relative image URLs ब्राउज़र द्वारा rejected होते हैं और network fetches issue नहीं करते।

व्यवहार में इसका अर्थ:

- Relative paths के अंतर्गत served avatars और images (उदाहरण के लिए `/avatars/<id>`) अभी भी render होते हैं, authenticated avatar routes सहित जिन्हें UI fetch करके local `blob:` URLs में convert करता है।
- Inline `data:image/...` URLs अभी भी render होते हैं (in-protocol payloads के लिए उपयोगी)।
- Control UI द्वारा बनाए गए local `blob:` URLs अभी भी render होते हैं।
- Channel metadata द्वारा emitted remote avatar URLs Control UI के avatar helpers पर stripped होते हैं और built-in logo/badge से replace किए जाते हैं, इसलिए compromised या malicious channel operator browser से arbitrary remote image fetches force नहीं कर सकता।

यह behavior पाने के लिए आपको कुछ बदलने की आवश्यकता नहीं है — यह हमेशा on रहता है और configurable नहीं है।

## Avatar route auth

जब gateway auth configured हो, तो Control UI avatar endpoint को बाकी API जैसा ही gateway token चाहिए:

- `GET /avatar/<agentId>` केवल authenticated callers को avatar image लौटाता है। `GET /avatar/<agentId>?meta=1` उसी rule के तहत avatar metadata लौटाता है।
- किसी भी route पर unauthenticated requests rejected होती हैं (sibling assistant-media route से matching)। इससे avatar route उन hosts पर agent identity leak करने से बचता है जो अन्यथा protected हैं।
- Control UI स्वयं avatars fetch करते समय gateway token को bearer header के रूप में forward करता है, और authenticated blob URLs का उपयोग करता है ताकि image dashboards में फिर भी render हो।

यदि आप gateway auth को अक्षम करते हैं (साझा होस्ट पर अनुशंसित नहीं), तो avatar route भी Gateway के बाकी हिस्से की तरह अप्रमाणित हो जाता है।

## Assistant मीडिया route auth

जब gateway auth कॉन्फ़िगर किया जाता है, तो assistant local-media previews दो-चरण route का उपयोग करते हैं:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` के लिए सामान्य Control UI operator auth आवश्यक है। उपलब्धता जांचते समय ब्राउज़र Gateway token को bearer header के रूप में भेजता है।
- सफल metadata प्रतिक्रियाओं में एक अल्पकालिक `mediaTicket` शामिल होता है, जो ठीक उसी source path तक सीमित होता है।
- ब्राउज़र में रेंडर किए गए image, audio, video, और document URLs सक्रिय Gateway token या password के बजाय `mediaTicket=<ticket>` का उपयोग करते हैं। ticket जल्दी समाप्त हो जाता है और किसी अलग source को अधिकृत नहीं कर सकता।

इससे सामान्य media rendering ब्राउज़र-native media elements के साथ संगत रहती है, बिना reusable Gateway credentials को दिखाई देने वाले media URLs में डाले।

## UI बनाना

Gateway `dist/control-ui` से static files serve करता है। उन्हें इससे बनाएं:

```bash
pnpm ui:build
```

वैकल्पिक absolute base (जब आप fixed asset URLs चाहते हों):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

स्थानीय development के लिए (अलग dev server):

```bash
pnpm ui:dev
```

फिर UI को अपने Gateway WS URL पर point करें (जैसे `ws://127.0.0.1:18789`)।

## खाली Control UI पेज

यदि ब्राउज़र खाली dashboard लोड करता है और DevTools कोई उपयोगी error नहीं दिखाता, तो किसी extension या early content script ने JavaScript module app को evaluate होने से रोका हो सकता है। static page में एक plain HTML recovery panel शामिल है, जो startup के बाद `<openclaw-app>` registered न होने पर दिखाई देता है।

ब्राउज़र environment बदलने के बाद panel की **फिर कोशिश करें** action का उपयोग करें, या इन checks के बाद manually reload करें:

- उन extensions को अक्षम करें जो सभी pages में inject करते हैं, खासकर `<all_urls>` content scripts वाली extensions।
- private window, clean browser profile, या कोई दूसरा browser आज़माएं।
- Gateway चालू रखें और browser change के बाद वही dashboard URL verify करें।

## Debugging/testing: dev server + remote Gateway

Control UI static files है; WebSocket target configurable है और HTTP origin से अलग हो सकता है। यह तब उपयोगी है जब आप Vite dev server स्थानीय रूप से चाहते हैं लेकिन Gateway कहीं और चल रहा हो।

<Steps>
  <Step title="UI dev server शुरू करें">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl के साथ खोलें">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    वैकल्पिक one-time auth (यदि आवश्यक हो):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="नोट्स">
    - `gatewayUrl` load के बाद localStorage में stored होता है और URL से हटा दिया जाता है।
    - यदि आप `gatewayUrl` के माध्यम से पूरा `ws://` या `wss://` endpoint pass करते हैं, तो `gatewayUrl` value को URL-encode करें ताकि browser query string को सही ढंग से parse करे।
    - जब भी संभव हो, `token` को URL fragment (`#token=...`) के माध्यम से pass करना चाहिए। fragments server को नहीं भेजे जाते, जिससे request-log और Referer leakage से बचाव होता है। Legacy `?token=` query params compatibility के लिए अभी भी एक बार imported होते हैं, लेकिन केवल fallback के रूप में, और bootstrap के तुरंत बाद strip कर दिए जाते हैं।
    - `password` केवल memory में रखा जाता है।
    - जब `gatewayUrl` set होता है, तो UI config या environment credentials पर fall back नहीं करता। `token` (या `password`) स्पष्ट रूप से provide करें। explicit credentials का missing होना error है।
    - जब Gateway TLS के पीछे हो (Tailscale Serve, HTTPS proxy, आदि), तो `wss://` का उपयोग करें।
    - `gatewayUrl` केवल top-level window में accepted है (embedded नहीं), ताकि clickjacking रोकी जा सके।
    - Public non-loopback Control UI deployments को `gateway.controlUi.allowedOrigins` स्पष्ट रूप से set करना होगा (full origins)। loopback, RFC1918/link-local, `.local`, `.ts.net`, या Tailscale CGNAT hosts से private same-origin LAN/Tailnet loads Host-header fallback enable किए बिना accepted हैं।
    - Gateway startup effective runtime bind और port से `http://localhost:<port>` और `http://127.0.0.1:<port>` जैसे local origins seed कर सकता है, लेकिन remote browser origins को अभी भी explicit entries चाहिए।
    - tightly controlled local testing को छोड़कर `gateway.controlUi.allowedOrigins: ["*"]` का उपयोग न करें। इसका अर्थ है किसी भी browser origin को allow करना, न कि "मैं जिस भी host का उपयोग कर रहा हूं, उससे match करें।"
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` Host-header origin fallback mode enable करता है, लेकिन यह खतरनाक security mode है।

  </Accordion>
</AccordionGroup>

उदाहरण:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Remote access setup विवरण: [Remote access](/hi/gateway/remote).

## संबंधित

- [Dashboard](/hi/web/dashboard) — Gateway dashboard
- [Health Checks](/hi/gateway/health) — Gateway health monitoring
- [TUI](/hi/web/tui) — terminal user interface
- [WebChat](/hi/web/webchat) — browser-based chat interface
