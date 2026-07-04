---
read_when:
    - आप Gateway को ब्राउज़र से संचालित करना चाहते हैं
    - आप SSH टनल के बिना Tailnet एक्सेस चाहते हैं
sidebarTitle: Control UI
summary: Gateway के लिए ब्राउज़र-आधारित नियंत्रण UI (चैट, गतिविधि, नोड्स, कॉन्फ़िगरेशन)
title: Control UI
x-i18n:
    generated_at: "2026-07-04T18:00:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway द्वारा परोसा जाने वाला एक छोटा **Vite + Lit** single-page app है:

- डिफ़ॉल्ट: `http://<host>:18789/`
- वैकल्पिक prefix: `gateway.controlUi.basePath` सेट करें (जैसे `/openclaw`)

यह उसी port पर **सीधे Gateway WebSocket से** बात करता है।

## तुरंत खोलें (local)

अगर Gateway उसी computer पर चल रहा है, तो खोलें:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (या [http://localhost:18789/](http://localhost:18789/))

अगर page load नहीं होता, तो पहले Gateway शुरू करें: `openclaw gateway`.

<Note>
native Windows LAN binds पर, Windows Firewall या organization-managed Group Policy अब भी advertised LAN URL को block कर सकती है, भले ही Gateway host पर `127.0.0.1` काम करता हो। Windows host पर `openclaw gateway status --deep` चलाएँ; यह संभावित रूप से blocked ports, profile mismatches, और local firewall rules की रिपोर्ट करता है जिन्हें policy ignore कर सकती है।
</Note>

Auth WebSocket handshake के दौरान इनके ज़रिए दिया जाता है:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve identity headers जब `gateway.auth.allowTailscale: true` हो
- trusted-proxy identity headers जब `gateway.auth.mode: "trusted-proxy"` हो

dashboard settings panel current browser tab session और चुने गए gateway URL के लिए token रखता है; passwords persist नहीं किए जाते। onboarding आमतौर पर first connect पर shared-secret auth के लिए gateway token generate करता है, लेकिन जब `gateway.auth.mode` `"password"` हो, तब password auth भी काम करता है।

## Device pairing (पहला connection)

जब आप नए browser या device से Control UI से connect करते हैं, तो Gateway आमतौर पर **one-time pairing approval** मांगता है। यह unauthorized access रोकने के लिए security measure है।

**आपको यह दिखेगा:** "disconnected (1008): pairing required"

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

अगर browser बदले हुए auth details (role/scopes/public key) के साथ pairing retry करता है, तो पिछला pending request supersede हो जाता है और नया `requestId` बनता है। approval से पहले `openclaw devices list` फिर से चलाएँ।

अगर browser पहले से paired है और आप उसे read access से write/admin access में बदलते हैं, तो इसे approval upgrade माना जाता है, silent reconnect नहीं। OpenClaw पुरानी approval को active रखता है, broader reconnect को block करता है, और आपसे नए scope set को स्पष्ट रूप से approve करने के लिए कहता है।

approve हो जाने के बाद device याद रखा जाता है और दोबारा approval की ज़रूरत नहीं होगी, जब तक आप उसे `openclaw devices revoke --device <id> --role <role>` से revoke नहीं करते। token rotation और revocation के लिए [Devices CLI](/hi/cli/devices) देखें।

`openclaw_gateway` adapter के ज़रिए connect करने वाले Paperclip agents भी वही first-run approval flow इस्तेमाल करते हैं। initial connection attempt के बाद, pending request preview करने के लिए `openclaw devices approve --latest` चलाएँ, फिर उसे approve करने के लिए printed `openclaw devices approve <requestId>` command फिर से चलाएँ। remote gateway के लिए explicit `--url` और `--token` values पास करें। restarts के across approvals stable रखने के लिए, Paperclip में persistent `adapterConfig.devicePrivateKeyPem` configure करें, बजाय इसके कि वह हर run में नई ephemeral device identity generate करे।

<Note>
- Direct local loopback browser connections (`127.0.0.1` / `localhost`) auto-approved होते हैं।
- Tailscale Serve Control UI operator sessions के लिए pairing round trip skip कर सकता है, जब `gateway.auth.allowTailscale: true` हो, Tailscale identity verify हो, और browser अपनी device identity present करे।
- Direct Tailnet binds, LAN browser connects, और device identity के बिना browser profiles को अब भी explicit approval की ज़रूरत होती है।
- हर browser profile एक unique device ID generate करता है, इसलिए browsers switch करने या browser data clear करने पर re-pairing की ज़रूरत होगी।

</Note>

## Mobile device pair करें

पहले से paired administrator terminal खोले बिना iOS/Android connection QR बना सकता है:

<Steps>
  <Step title="Mobile pairing खोलें">
    **Nodes** चुनें, फिर **Devices** card में **Pair mobile device** पर click करें।
  </Step>
  <Step title="Phone connect करें">
    OpenClaw mobile app में, **Settings** → **Gateway** खोलें और QR
    code scan करें। इसके बजाय आप setup code copy और paste कर सकते हैं।
  </Step>
  <Step title="Connection confirm करें">
    official iOS/Android app automatically connect करता है। अगर **Devices** कोई
    pending request दिखाता है, तो approve करने से पहले उसका role और scopes review करें।
  </Step>
</Steps>

setup code बनाने के लिए `operator.admin` चाहिए; जिन sessions में यह नहीं है, उनके लिए button disabled रहता है। setup code में short-lived bootstrap credential होता है, इसलिए QR और copied code को valid रहने तक password की तरह संभालें। remote pairing के लिए, Gateway को `wss://` पर resolve होना चाहिए (उदाहरण के लिए, Tailscale Serve/Funnel के ज़रिए); plain `ws://` loopback और private LAN addresses तक सीमित है। पूरी security और fallback details के लिए [Pairing](/hi/channels/pairing#pair-from-the-control-ui-recommended) देखें।

## Personal identity (browser-local)

Control UI shared sessions में attribution के लिए outgoing messages से जुड़ी per-browser personal identity (display name और avatar) support करता है। यह browser storage में रहती है, current browser profile तक scoped है, और आप जो messages वास्तव में send करते हैं उन पर normal transcript authorship metadata से आगे other devices पर sync नहीं होती या server-side persist नहीं होती। site data clear करने या browsers switch करने पर यह empty पर reset हो जाती है।

यही browser-local pattern assistant avatar override पर लागू होता है। Uploaded assistant avatars केवल local browser पर gateway-resolved identity को overlay करते हैं और कभी `config.patch` के through round-trip नहीं करते। shared `ui.assistant.avatar` config field अब भी non-UI clients के लिए available है जो field को सीधे write करते हैं (जैसे scripted gateways या custom dashboards)।

## Runtime config endpoint

Control UI अपनी runtime settings `/control-ui-config.json` से fetch करता है, जिसे gateway के Control UI base path के relative resolve किया जाता है (उदाहरण के लिए `/__openclaw__/control-ui-config.json` जब UI `/__openclaw__/` के तहत serve होता है)। यह endpoint HTTP surface के बाकी हिस्से की तरह उसी gateway auth से gated है: unauthenticated browsers इसे fetch नहीं कर सकते, और successful fetch के लिए या तो पहले से valid gateway token/password, Tailscale Serve identity, या trusted-proxy identity चाहिए।

## Language support

Control UI first load पर आपके browser locale के आधार पर खुद को localize कर सकता है। बाद में override करने के लिए, **Overview -> Gateway Access -> Language** खोलें। locale picker Gateway Access card में रहता है, Appearance के तहत नहीं।

- Supported locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Non-English translations browser में lazy-loaded होते हैं।
- चुना गया locale browser storage में save होता है और future visits पर reused होता है।
- Missing translation keys English पर fall back करते हैं।

Docs translations उसी non-English locale set के लिए generated होते हैं, लेकिन docs site का built-in Mintlify language picker Mintlify द्वारा accepted locale codes तक सीमित है। Thai (`th`) और Persian (`fa`) docs अब भी publish repo में generated होते हैं; वे उस picker में तब तक appear नहीं हो सकते जब तक Mintlify उन codes को support नहीं करता।

## Appearance themes

Appearance panel built-in Claw, Knot, और Dash themes, plus एक browser-local tweakcn import slot रखता है। theme import करने के लिए, [tweakcn editor](https://tweakcn.com/editor/theme) खोलें, theme चुनें या बनाएँ, **Share** पर click करें, और copied theme link को Appearance में paste करें। importer `https://tweakcn.com/r/themes/<id>` registry URLs, `https://tweakcn.com/editor/theme?theme=amethyst-haze` जैसे editor URLs, relative `/themes/<id>` paths, raw theme IDs, और `amethyst-haze` जैसे default theme names भी accept करता है।

Appearance में browser-local Text size setting भी शामिल है। यह setting बाकी Control UI preferences के साथ stored होती है, chat text, composer text, tool cards, और chat sidebars पर apply होती है, और text inputs को कम से कम 16px रखती है ताकि mobile Safari focus पर auto-zoom न करे।

Imported themes केवल current browser profile में stored होते हैं। वे gateway config में नहीं लिखे जाते और devices के across sync नहीं होते। imported theme को replace करने से one local slot update होता है; उसे clear करने पर active theme वापस Claw पर switch हो जाती है, अगर imported theme selected था।

## यह क्या कर सकता है (आज)

<AccordionGroup>
  <Accordion title="Chat और Talk">
    - Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`) के ज़रिए model से chat करें।
    - Chat history refreshes per-message text caps के साथ bounded recent window request करते हैं ताकि बड़े sessions browser को chat usable होने से पहले full transcript payload render करने के लिए force न करें।
    - browser realtime sessions के through talk करें। OpenAI direct WebRTC इस्तेमाल करता है, Google Live WebSocket पर constrained one-use browser token इस्तेमाल करता है, और backend-only realtime voice plugins Gateway relay transport इस्तेमाल करते हैं। Client-owned provider sessions `talk.client.create` से start होते हैं; Gateway relay sessions `talk.session.create` से start होते हैं। relay provider credentials को Gateway पर रखता है जबकि browser `talk.session.appendAudio` के through microphone PCM stream करता है, Gateway policy और बड़े configured OpenClaw model के लिए `openclaw_agent_consult` provider tool calls को `talk.client.toolCall` के through forward करता है, और active-run voice steering को `talk.client.steer` या `talk.session.steer` के through route करता है।
    - Chat में tool calls + live tool output cards stream करें (agent events)।
    - existing `session.tool` / tool event delivery से live tool activity के browser-local, redaction-first summaries वाला Activity tab।

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: built-in plus bundled/external plugin channels status, QR login, और per-channel config (`channels.status`, `web.login.*`, `config.patch`)।
    - Channel probe refreshes previous snapshot को visible रखते हैं जबकि slow provider checks finish होते हैं, और जब probe या audit अपने UI budget से exceed करता है तो partial snapshots labeled होते हैं।
    - Instances: presence list + refresh (`system-presence`)।
    - Sessions: default रूप से configured-agent sessions list करें, stale unconfigured agent session keys से fall back करें, और per-session model/thinking/fast/verbose/trace/reasoning overrides apply करें (`sessions.list`, `sessions.patch`)।
    - Dreams: dreaming status, enable/disable toggle, और Dream Diary reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)।

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron jobs: list/add/edit/run/enable/disable + run history (`cron.*`)।
    - Skills: status, enable/disable, install, API key updates (`skills.*`)।
    - Nodes: list + caps (`node.list`), mobile setup codes create करें, और device pairing approve करें (`device.pair.*`)।
    - Exec approvals: gateway या node allowlists edit करें + `exec host=gateway/node` के लिए ask policy (`exec.approvals.*`)।

  </Accordion>
  <Accordion title="कॉन्फ़िगरेशन">
    - `~/.openclaw/openclaw.json` देखें/संपादित करें (`config.get`, `config.set`)।
    - MCP में कॉन्फ़िगर किए गए सर्वरों, सक्षमकरण, OAuth/फ़िल्टर/समानांतर सारांशों, सामान्य ऑपरेटर कमांडों, और स्कोप किए गए `mcp` कॉन्फ़िगरेशन एडिटर के लिए एक समर्पित सेटिंग पेज है।
    - सत्यापन के साथ लागू करें + पुनः आरंभ करें (`config.apply`) और अंतिम सक्रिय सत्र को जगाएँ।
    - लेखनों में समवर्ती संपादनों को ओवरराइट होने से रोकने के लिए base-hash गार्ड शामिल होता है।
    - लेखन (`config.set`/`config.apply`/`config.patch`) सबमिट किए गए कॉन्फ़िगरेशन पेलोड में refs के लिए सक्रिय SecretRef समाधान को पहले से जाँचते हैं; अनसुलझे सक्रिय सबमिट किए गए refs को लेखन से पहले अस्वीकार कर दिया जाता है।
    - फ़ॉर्म सेव ऐसे पुराने redacted placeholders को हटा देते हैं जिन्हें सहेजे गए कॉन्फ़िगरेशन से बहाल नहीं किया जा सकता, जबकि वे redacted मान सुरक्षित रखते हैं जो अभी भी सहेजे गए secrets से मैप होते हैं।
    - स्कीमा + फ़ॉर्म रेंडरिंग (`config.schema` / `config.schema.lookup`, जिसमें फ़ील्ड `title` / `description`, मेल खाते UI संकेत, तत्काल child summaries, nested object/wildcard/array/composition nodes पर docs metadata, साथ ही उपलब्ध होने पर plugin + channel schemas शामिल हैं); Raw JSON एडिटर केवल तब उपलब्ध होता है जब snapshot में सुरक्षित raw round-trip हो।
    - यदि कोई snapshot raw text को सुरक्षित रूप से round-trip नहीं कर सकता, तो Control UI उस snapshot के लिए Form मोड को बाध्य करता है और Raw मोड को अक्षम कर देता है।
    - Raw JSON एडिटर "सहेजे गए पर रीसेट करें" flattened snapshot को फिर से render करने के बजाय raw-authored आकार (formatting, comments, `$include` layout) को सुरक्षित रखता है, ताकि snapshot सुरक्षित रूप से round-trip कर सके तो बाहरी संपादन reset के बाद भी बने रहें।
    - Structured SecretRef object values को फ़ॉर्म text inputs में read-only render किया जाता है ताकि आकस्मिक object-to-string corruption रोकी जा सके।

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status/health/models snapshots + event log + manual RPC calls (`status`, `health`, `models.list`)।
    - event log में Control UI refresh/RPC timings, धीमे chat/config render timings, और browser responsiveness entries शामिल हैं, जब browser उन PerformanceObserver entry types को उजागर करता है तो लंबे animation frames या long tasks के लिए।
    - Logs: filter/export के साथ gateway file logs की live tail (`logs.tail`)।
    - Update: restart report के साथ package/git update + restart (`update.run`) चलाएँ, फिर reconnect के बाद `update.status` poll करें ताकि running gateway version सत्यापित हो सके।

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - isolated jobs के लिए, delivery डिफ़ॉल्ट रूप से announce summary होती है। यदि आप internal-only runs चाहते हैं तो none पर स्विच कर सकते हैं।
    - announce selected होने पर channel/target fields दिखाई देते हैं।
    - Webhook mode `delivery.mode = "webhook"` का उपयोग करता है, जिसमें `delivery.to` एक वैध HTTP(S) webhook URL पर सेट होता है।
    - main-session jobs के लिए, webhook और none delivery modes उपलब्ध हैं।
    - Advanced edit controls में delete-after-run, clear agent override, cron exact/stagger options, agent model/thinking overrides, और best-effort delivery toggles शामिल हैं।
    - Form validation field-level errors के साथ inline है; invalid values save button को ठीक होने तक disable करते हैं।
    - एक dedicated bearer token भेजने के लिए `cron.webhookToken` सेट करें; यदि छोड़ दिया जाए तो webhook बिना auth header के भेजा जाता है।
    - Deprecated fallback: `notify: true` वाले stored legacy jobs को `cron.webhook` से explicit per-job webhook या completion delivery में migrate करने के लिए `openclaw doctor --fix` चलाएँ।

  </Accordion>
</AccordionGroup>

## MCP पेज

समर्पित MCP पेज `mcp.servers` के अंतर्गत OpenClaw-managed MCP servers के लिए operator view है। यह स्वयं MCP transports शुरू नहीं करता; saved config की जाँच और संपादन के लिए इसका उपयोग करें, फिर जब live server proof चाहिए हो तो `openclaw mcp doctor --probe` का उपयोग करें।

सामान्य workflow:

1. sidebar से **MCP** खोलें।
2. total, enabled, OAuth, और filtered server counts के लिए summary cards जाँचें।
3. प्रत्येक server row में transport, enablement, auth, filters, timeouts, और command hints की समीक्षा करें।
4. जब कोई server configured रहना चाहिए लेकिन runtime discovery से बाहर रहना चाहिए, तो enablement toggle करें।
5. server definitions, headers, TLS/mTLS paths, OAuth metadata, tool filters, और Codex projection metadata के लिए scoped `mcp` config section संपादित करें।
6. config write के लिए **सहेजें**, या जब running Gateway को बदला हुआ config लागू करना चाहिए तो **सहेजें और प्रकाशित करें** का उपयोग करें।
7. edited process को static diagnostics, live proof, या cached-runtime disposal चाहिए होने पर terminal से `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, या `openclaw mcp reload` चलाएँ।

यह पेज rendering से पहले credential-bearing URL-like values को redact करता है और command snippets में server names को quote करता है ताकि copied commands spaces या shell metacharacters के साथ भी काम करें। पूरा CLI और config reference [MCP](/hi/cli/mcp) में है।

## Activity tab

Activity tab live tool activity के लिए ephemeral browser-local observer है। यह उसी Gateway `session.tool` / tool event stream से derived है जो Chat tool cards को power करता है; यह कोई दूसरा Gateway event family, endpoint, durable activity store, metrics feed, या external observer stream नहीं जोड़ता।

Activity entries केवल sanitized summaries और redacted, truncated output previews रखती हैं। Tool argument values Activity state में stored नहीं होते; UI दिखाता है कि arguments hidden हैं और केवल argument field count record करता है। in-memory list current browser tab का अनुसरण करती है, Control UI के भीतर navigation में बनी रहती है, और page reload, session switch, या **Clear** पर reset हो जाती है।

## Chat behavior

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` **non-blocking** है: यह `{ runId, status: "started" }` के साथ तुरंत ack करता है और response `chat` events के ज़रिए stream होता है। Trusted Control UI clients को local diagnostics के लिए optional ACK timing metadata भी मिल सकता है।
    - Chat uploads images और non-video files स्वीकार करते हैं। Images native image path रखती हैं; अन्य files managed media के रूप में stored होती हैं और history में attachment links के रूप में दिखाई जाती हैं।
    - उसी `idempotencyKey` के साथ re-send करने पर running के दौरान `{ status: "in_flight" }`, और completion के बाद `{ status: "ok" }` लौटता है।
    - `chat.history` responses UI safety के लिए size-bounded होते हैं। जब transcript entries बहुत बड़ी होती हैं, Gateway लंबे text fields truncate कर सकता है, heavy metadata blocks omit कर सकता है, और oversized messages को placeholder (`[chat.history omitted: message too large]`) से replace कर सकता है।
    - जब visible assistant message `chat.history` में truncated था, side reader `sessionKey`, जरूरत होने पर active `agentId`, और transcript `messageId` द्वारा `chat.message.get` के माध्यम से demand पर full display-normalized transcript entry fetch कर सकता है। यदि Gateway फिर भी अधिक नहीं लौटा सकता, तो reader truncated preview को silently repeat करने के बजाय explicit unavailable state दिखाता है।
    - Assistant/generated images managed media references के रूप में persisted होती हैं और authenticated Gateway media URLs के माध्यम से वापस serve की जाती हैं, इसलिए reloads chat history response में raw base64 image payloads बने रहने पर depend नहीं करते।
    - `chat.history` render करते समय, Control UI visible assistant text से display-only inline directive tags (उदाहरण के लिए `[[reply_to_*]]` और `[[audio_as_voice]]`), plain-text tool-call XML payloads (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और truncated tool-call blocks शामिल हैं), और leaked ASCII/full-width model control tokens हटाता है, और assistant entries omit करता है जिनका पूरा visible text केवल exact silent token `NO_REPLY` / `no_reply` या heartbeat acknowledgement token `HEARTBEAT_OK` है।
    - active send और final history refresh के दौरान, chat view local optimistic user/assistant messages को visible रखता है यदि `chat.history` थोड़ी देर के लिए पुराना snapshot लौटाता है; canonical transcript उन local messages को replace करता है जब Gateway history catch up कर लेती है।
    - Live `chat` events delivery state हैं, जबकि `chat.history` durable session transcript से rebuilt होता है। tool-final events के बाद Control UI history reload करता है और केवल एक small optimistic tail merge करता है; transcript boundary [WebChat](/hi/web/webchat) में documented है।
    - `chat.inject` session transcript में assistant note append करता है और UI-only updates के लिए `chat` event broadcast करता है (कोई agent run नहीं, कोई channel delivery नहीं)।
    - sidebar recent sessions को New Session action, All Sessions link, और session search button के साथ list करता है, जो full session picker खोलता है (selected agent के scope में, search और pagination के साथ)। agents switch करने पर केवल उस agent से जुड़े sessions दिखाई देते हैं और जब अभी तक उसके कोई saved dashboard sessions नहीं हैं तो वह उस agent के main session पर fallback करता है।
    - desktop widths पर, chat controls एक compact row में रहते हैं और transcript में नीचे scroll करते समय collapse हो जाते हैं; ऊपर scroll करने, top पर लौटने, या bottom तक पहुँचने पर controls restore हो जाते हैं।
    - लगातार duplicate text-only messages count badge वाले एक bubble के रूप में render होते हैं। Images, attachments, tool output, या canvas previews वाले messages uncollapsed छोड़े जाते हैं।
    - chat header model और thinking pickers active session को `sessions.patch` के माध्यम से तुरंत patch करते हैं; वे persistent session overrides हैं, one-turn-only send options नहीं।
    - यदि आप उसी session के लिए model picker change अभी save हो रहा हो तब message भेजते हैं, तो composer `chat.send` call करने से पहले उस session patch का इंतज़ार करता है ताकि send selected model का उपयोग करे।
    - Control UI में `/new` type करने पर New Chat जैसी ही fresh dashboard session बनती है और उस पर switch होता है, सिवाय इसके कि जब `session.dmScope: "main"` configured हो और current parent agent का main session हो; उस स्थिति में यह main session को उसी जगह reset करता है। `/reset` type करने पर current session के लिए Gateway का explicit in-place reset बना रहता है।
    - chat model picker Gateway के configured model view का अनुरोध करता है। यदि `agents.defaults.models` मौजूद है, तो वह allowlist picker को drive करती है, जिसमें `provider/*` entries शामिल हैं जो provider-scoped catalogs को dynamic रखती हैं। अन्यथा picker explicit `models.providers.*.models` entries plus usable auth वाले providers दिखाता है। full catalog debug `models.list` RPC के ज़रिए `view: "all"` के साथ उपलब्ध रहता है।
    - जब fresh Gateway session usage reports current context tokens शामिल करते हैं, तो chat composer toolbar used percentage के साथ छोटा context usage ring दिखाता है; full token detail उसके tooltip में रहता है। उच्च context pressure पर ring warning styling में बदलता है और recommended compaction levels पर एक compact button दिखाता है जो normal session compaction path चलाता है। Stale token snapshots तब तक hidden रहते हैं जब तक Gateway फिर से fresh usage report न करे।

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Talk mode registered realtime voice provider का उपयोग करता है। OpenAI को `talk.realtime.provider: "openai"` plus एक `openai` API-key auth profile, `talk.realtime.providers.openai.apiKey`, या `OPENAI_API_KEY` के साथ configure करें; OpenAI OAuth profiles Realtime voice configure नहीं करते। Google को `talk.realtime.provider: "google"` plus `talk.realtime.providers.google.apiKey` के साथ configure करें। browser को कभी standard provider API key नहीं मिलती। OpenAI WebRTC के लिए ephemeral Realtime client secret प्राप्त करता है। Google Live browser WebSocket session के लिए one-use constrained Live API auth token प्राप्त करता है, जिसमें instructions और tool declarations Gateway द्वारा token में locked होते हैं। केवल backend realtime bridge expose करने वाले providers Gateway relay transport के माध्यम से चलते हैं, इसलिए credentials और vendor sockets server-side रहते हैं जबकि browser audio authenticated Gateway RPCs के माध्यम से move करता है। Realtime session prompt Gateway द्वारा assemble किया जाता है; `talk.client.create` caller-provided instruction overrides स्वीकार नहीं करता।

    Chat कंपोज़र में Talk शुरू/बंद बटन के बगल में Talk विकल्प बटन शामिल है। विकल्प अगले Talk सत्र पर लागू होते हैं और provider, transport, model, voice, reasoning effort, VAD threshold, silence duration, और prefix padding को override कर सकते हैं। जब कोई विकल्प खाली होता है, तो Gateway उपलब्ध होने पर कॉन्फ़िगर किए गए default या provider default का उपयोग करता है। Gateway relay चुनने से backend relay पथ मजबूर होता है; WebRTC चुनने से सत्र client-owned रहता है और यदि provider browser session नहीं बना सकता, तो relay पर चुपचाप fallback करने के बजाय विफल होता है।

    Chat कंपोज़र में, Talk control microphone dictation button के बगल वाला waves button है। जब Talk शुरू होता है, तो composer status row पहले `Connecting Talk...`, फिर audio connected होने पर `Talk live`, या realtime tool call द्वारा `talk.client.toolCall` के माध्यम से configured larger model से परामर्श करते समय `Asking OpenClaw...` दिखाती है।

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` OpenAI backend WebSocket bridge, OpenAI browser WebRTC SDP exchange, Google Live constrained-token browser WebSocket setup, और fake microphone media के साथ Gateway relay browser adapter को verify करता है। command केवल provider status print करता है और secrets log नहीं करता।

  </Accordion>
  <Accordion title="रोकें और abort करें">
    - **Stop** पर click करें (`chat.abort` call करता है)।
    - जब कोई run active हो, तो सामान्य follow-ups queue होते हैं। running turn में वह follow-up inject करने के लिए queued message पर **Steer** click करें।
    - out-of-band abort करने के लिए `/stop` type करें (या standalone abort phrases जैसे `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`)।
    - `chat.abort` उस session के सभी active runs abort करने के लिए `{ sessionKey }` support करता है (`runId` नहीं)।

  </Accordion>
  <Accordion title="Abort partial retention">
    - जब कोई run abort किया जाता है, तब भी partial assistant text UI में दिखाया जा सकता है।
    - buffered output मौजूद होने पर Gateway aborted partial assistant text को transcript history में persist करता है।
    - persisted entries में abort metadata शामिल होता है ताकि transcript consumers abort partials को normal completion output से अलग पहचान सकें।

  </Accordion>
</AccordionGroup>

## PWA install और web push

Control UI एक `manifest.webmanifest` और service worker के साथ आता है, इसलिए modern browsers इसे standalone PWA के रूप में install कर सकते हैं। Web Push Gateway को tab या browser window open न होने पर भी installed PWA को notifications के साथ wake करने देता है।

यदि OpenClaw update के तुरंत बाद page **Protocol mismatch** दिखाता है, तो पहले `openclaw dashboard` के साथ dashboard दोबारा खोलें और page को hard-refresh करें। यदि फिर भी विफल हो, तो dashboard origin के लिए site data clear करें या private browser window में test करें; पुराना tab या browser service-worker cache newer Gateway के विरुद्ध pre-update Control UI bundle चलाता रह सकता है।

| Surface                                               | यह क्या करता है                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest। reachable होने पर browsers "ऐप install करें" offer करते हैं। |
| `ui/public/sw.js`                                     | service worker जो `push` events और notification clicks handle करता है। |
| `push/vapid-keys.json` (OpenClaw state dir के अंदर) | Web Push payloads sign करने के लिए auto-generated VAPID keypair।       |
| `push/web-push-subscriptions.json`                    | persisted browser subscription endpoints।                          |

जब आप keys pin करना चाहते हैं (multi-host deployments, secrets rotation, या tests के लिए), तो Gateway process पर env vars के माध्यम से VAPID keypair override करें:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (default `https://openclaw.ai` है)

Control UI browser subscriptions register और test करने के लिए ये scope-gated Gateway methods use करता है:

- `push.web.vapidPublicKey` — active VAPID public key fetch करता है।
- `push.web.subscribe` — `endpoint` के साथ `keys.p256dh`/`keys.auth` register करता है।
- `push.web.unsubscribe` — registered endpoint remove करता है।
- `push.web.test` — caller की subscription को test notification भेजता है।

<Note>
Web Push iOS APNS relay path से स्वतंत्र है (relay-backed push के लिए [Configuration](/hi/gateway/configuration) देखें) और मौजूदा `push.test` method से भी, जो native mobile pairing को target करता है।
</Note>

## Hosted embeds

Assistant messages `[embed ...]` shortcode के साथ hosted web content inline render कर सकते हैं। iframe sandbox policy `gateway.controlUi.embedSandbox` से controlled होती है:

<Tabs>
  <Tab title="strict">
    hosted embeds के अंदर script execution disable करता है।
  </Tab>
  <Tab title="scripts (default)">
    origin isolation बनाए रखते हुए interactive embeds allow करता है; यह default है और self-contained browser games/widgets के लिए आम तौर पर पर्याप्त है।
  </Tab>
  <Tab title="trusted">
    same-site documents के लिए `allow-scripts` के ऊपर `allow-same-origin` जोड़ता है जिन्हें जानबूझकर stronger privileges की ज़रूरत होती है।
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
`trusted` केवल तब use करें जब embedded document को वास्तव में same-origin behavior की ज़रूरत हो। अधिकांश agent-generated games और interactive canvases के लिए, `scripts` अधिक सुरक्षित विकल्प है।
</Warning>

Absolute external `http(s)` embed URLs default रूप से blocked रहते हैं। यदि आप जानबूझकर `[embed url="https://..."]` को third-party pages load करने देना चाहते हैं, तो `gateway.controlUi.allowExternalEmbedUrls: true` set करें।

## Chat message width

Grouped chat messages एक readable default max-width use करते हैं। Wide-monitor deployments bundled CSS patch किए बिना `gateway.controlUi.chatMessageMaxWidth` set करके इसे override कर सकते हैं:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Browser तक पहुंचने से पहले value validate की जाती है। Supported values में plain lengths और percentages जैसे `960px` या `82%`, साथ ही constrained `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, और `fit-content(...)` width expressions शामिल हैं।

## Tailnet access (recommended)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway को loopback पर रखें और Tailscale Serve को HTTPS के साथ इसे proxy करने दें:

    ```bash
    openclaw gateway --tailscale serve
    ```

    खोलें:

    - `https://<magicdns>/` (या आपका configured `gateway.controlUi.basePath`)

    Default रूप से, Control UI/WebSocket Serve requests Tailscale identity headers (`tailscale-user-login`) के माध्यम से authenticate कर सकते हैं जब `gateway.auth.allowTailscale` `true` हो। OpenClaw `x-forwarded-for` address को `tailscale whois` से resolve करके और उसे header से match करके identity verify करता है, और इन्हें केवल तब accept करता है जब request loopback पर Tailscale के `x-forwarded-*` headers के साथ hit करती है। Browser device identity वाले Control UI operator sessions के लिए, यह verified Serve path device-pairing round trip भी skip करता है; device-less browsers और node-role connections अभी भी normal device checks follow करते हैं। यदि आप Serve traffic के लिए भी explicit shared-secret credentials require करना चाहते हैं, तो `gateway.auth.allowTailscale: false` set करें। फिर `gateway.auth.mode: "token"` या `"password"` use करें।

    उस async Serve identity path के लिए, same client IP और auth scope के failed auth attempts rate-limit writes से पहले serialized होते हैं। इसलिए same browser से concurrent bad retries second request पर parallel में racing करने वाले दो plain mismatches के बजाय `retry later` दिखा सकते हैं।

    <Warning>
    Tokenless Serve auth मानता है कि gateway host trusted है। यदि उस host पर untrusted local code चल सकता है, तो token/password auth require करें।
    </Warning>

  </Tab>
  <Tab title="tailnet + token से bind करें">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    फिर खोलें:

    - `http://<tailscale-ip>:18789/` (या आपका configured `gateway.controlUi.basePath`)

    matching shared secret को UI settings में paste करें (`connect.params.auth.token` या `connect.params.auth.password` के रूप में भेजा जाता है)।

  </Tab>
</Tabs>

## Insecure HTTP

यदि आप dashboard को plain HTTP (`http://<lan-ip>` या `http://<tailscale-ip>`) पर खोलते हैं, तो browser **non-secure context** में चलता है और WebCrypto block करता है। Default रूप से, OpenClaw device identity के बिना Control UI connections **block** करता है।

Documented exceptions:

- `gateway.controlUi.allowInsecureAuth=true` के साथ localhost-only insecure HTTP compatibility
- `gateway.auth.mode: "trusted-proxy"` के माध्यम से successful operator Control UI auth
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Recommended fix:** HTTPS (Tailscale Serve) use करें या UI locally खोलें:

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

    - यह non-secure HTTP contexts में localhost Control UI sessions को device identity के बिना proceed करने देता है।
    - यह pairing checks bypass नहीं करता।
    - यह remote (non-localhost) device identity requirements को relax नहीं करता।

  </Accordion>
  <Accordion title="केवल break-glass">
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
    `dangerouslyDisableDeviceAuth` Control UI device identity checks disable करता है और यह गंभीर security downgrade है। emergency use के बाद जल्दी revert करें।
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Successful trusted-proxy auth **operator** Control UI sessions को device identity के बिना admit कर सकता है।
    - यह node-role Control UI sessions तक extend **नहीं** होता।
    - Same-host loopback reverse proxies अभी भी trusted-proxy auth satisfy नहीं करते; [Trusted proxy auth](/hi/gateway/trusted-proxy-auth) देखें।

  </Accordion>
</AccordionGroup>

HTTPS setup guidance के लिए [Tailscale](/hi/gateway/tailscale) देखें।

## Content security policy

Control UI tight `img-src` policy के साथ आता है: केवल **same-origin** assets, `data:` URLs, और locally generated `blob:` URLs allowed हैं। Remote `http(s)` और protocol-relative image URLs browser द्वारा reject किए जाते हैं और network fetches issue नहीं करते।

व्यवहार में इसका मतलब:

- Relative paths के तहत served avatars और images (उदाहरण के लिए `/avatars/<id>`) अभी भी render होते हैं, authenticated avatar routes सहित जिन्हें UI fetch करता है और local `blob:` URLs में convert करता है।
- Inline `data:image/...` URLs अभी भी render होते हैं (in-protocol payloads के लिए useful)।
- Control UI द्वारा बनाए गए local `blob:` URLs अभी भी render होते हैं।
- Channel metadata द्वारा emitted remote avatar URLs Control UI के avatar helpers पर stripped कर दिए जाते हैं और built-in logo/badge से replace होते हैं, इसलिए compromised या malicious channel operator browser से arbitrary remote image fetches force नहीं कर सकता।

यह behavior पाने के लिए आपको कुछ भी बदलने की ज़रूरत नहीं है — यह हमेशा on है और configurable नहीं है।

## Avatar route auth

जब gateway auth configured होता है, तो Control UI avatar endpoint को बाकी API जैसा ही gateway token चाहिए:

- `GET /avatar/<agentId>` avatar image केवल authenticated callers को return करता है। `GET /avatar/<agentId>?meta=1` उसी rule के तहत avatar metadata return करता है।
- दोनों routes पर unauthenticated requests reject की जाती हैं (sibling assistant-media route से matching)। यह avatar route को otherwise protected hosts पर agent identity leak करने से रोकता है।
- Control UI खुद avatars fetch करते समय gateway token को bearer header के रूप में forward करता है, और authenticated blob URLs use करता है ताकि image dashboards में अभी भी render हो।

यदि आप gateway auth अक्षम करते हैं (shared hosts पर अनुशंसित नहीं), तो avatar route भी बाकी gateway की तरह अनधिकृत हो जाता है।

## Assistant media route auth

जब gateway auth कॉन्फ़िगर किया जाता है, assistant local-media पूर्वावलोकन दो-चरण वाले route का उपयोग करते हैं:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` के लिए सामान्य Control UI operator auth आवश्यक है। उपलब्धता जांचते समय browser Gateway token को bearer header के रूप में भेजता है।
- सफल metadata responses में उस सटीक source path तक सीमित अल्प-आयु वाला `mediaTicket` शामिल होता है।
- Browser-rendered image, audio, video, और document URLs सक्रिय Gateway token या password के बजाय `mediaTicket=<ticket>` का उपयोग करते हैं। ticket जल्दी समाप्त हो जाता है और किसी अलग source को अधिकृत नहीं कर सकता।

यह सामान्य media rendering को browser-native media elements के साथ संगत रखता है, बिना पुनः उपयोग योग्य Gateway credentials को दिखने वाले media URLs में डाले।

## UI बनाना

Gateway `dist/control-ui` से static files serve करता है। उन्हें इससे build करें:

```bash
pnpm ui:build
```

वैकल्पिक absolute base (जब आप fixed asset URLs चाहते हैं):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Local development के लिए (अलग dev server):

```bash
pnpm ui:dev
```

फिर UI को अपने Gateway WS URL पर point करें (उदा. `ws://127.0.0.1:18789`)।

## खाली Control UI page

यदि browser खाली dashboard load करता है और DevTools कोई उपयोगी error नहीं दिखाता, तो किसी extension या early content script ने JavaScript module app को evaluate होने से रोका हो सकता है। static page में एक plain HTML recovery panel शामिल है, जो startup के बाद `<openclaw-app>` registered न होने पर दिखाई देता है।

Browser environment बदलने के बाद panel की **फिर प्रयास करें** action का उपयोग करें, या इन checks के बाद manually reload करें:

- उन extensions को अक्षम करें जो सभी pages में inject करते हैं, विशेष रूप से `<all_urls>` content scripts वाले extensions।
- private window, साफ browser profile, या दूसरा browser आजमाएं।
- Gateway को चलाते रहें और browser change के बाद वही dashboard URL verify करें।

## Debugging/testing: dev server + remote Gateway

Control UI static files हैं; WebSocket target configurable है और HTTP origin से अलग हो सकता है। यह तब उपयोगी है जब आप Vite dev server local चलाना चाहते हैं लेकिन Gateway कहीं और चलता है।

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
    - जब भी संभव हो, `token` को URL fragment (`#token=...`) के माध्यम से pass करना चाहिए। Fragments server को नहीं भेजे जाते, जिससे request-log और Referer leakage से बचाव होता है। Legacy `?token=` query params अभी भी compatibility के लिए एक बार imported होते हैं, लेकिन केवल fallback के रूप में, और bootstrap के तुरंत बाद strip कर दिए जाते हैं।
    - `password` केवल memory में रखा जाता है।
    - जब `gatewayUrl` set होता है, UI config या environment credentials पर fall back नहीं करता। `token` (या `password`) स्पष्ट रूप से दें। स्पष्ट credentials न होना error है।
    - जब Gateway TLS के पीछे हो (Tailscale Serve, HTTPS proxy, आदि), तो `wss://` का उपयोग करें।
    - `gatewayUrl` केवल top-level window में accepted है (embedded नहीं), ताकि clickjacking रोका जा सके।
    - Public non-loopback Control UI deployments को `gateway.controlUi.allowedOrigins` स्पष्ट रूप से set करना होगा (full origins)। loopback, RFC1918/link-local, `.local`, `.ts.net`, या Tailscale CGNAT hosts से Private same-origin LAN/Tailnet loads Host-header fallback enable किए बिना accepted हैं।
    - Gateway startup effective runtime bind और port से `http://localhost:<port>` और `http://127.0.0.1:<port>` जैसे local origins seed कर सकता है, लेकिन remote browser origins को अभी भी explicit entries चाहिए।
    - tightly controlled local testing को छोड़कर `gateway.controlUi.allowedOrigins: ["*"]` का उपयोग न करें। इसका अर्थ है किसी भी browser origin को allow करना, न कि "मैं जिस host का उपयोग कर रहा हूं उससे match करें।"
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
