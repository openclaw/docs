---
read_when:
    - आप Gateway को ब्राउज़र से संचालित करना चाहते हैं
    - आप SSH टनल के बिना Tailnet एक्सेस चाहते हैं
sidebarTitle: Control UI
summary: Gateway के लिए ब्राउज़र-आधारित नियंत्रण UI (चैट, गतिविधि, नोड्स, कॉन्फ़िगरेशन)
title: नियंत्रण UI
x-i18n:
    generated_at: "2026-07-02T00:56:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway द्वारा सर्व किया जाने वाला एक छोटा **Vite + Lit** सिंगल-पेज ऐप है:

- डिफ़ॉल्ट: `http://<host>:18789/`
- वैकल्पिक प्रीफ़िक्स: `gateway.controlUi.basePath` सेट करें (उदा. `/openclaw`)

यह उसी पोर्ट पर **सीधे Gateway WebSocket से** बात करता है।

## जल्दी खोलें (स्थानीय)

यदि Gateway उसी कंप्यूटर पर चल रहा है, तो खोलें:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (या [http://localhost:18789/](http://localhost:18789/))

यदि पेज लोड नहीं होता, तो पहले Gateway शुरू करें: `openclaw gateway`.

<Note>
नेटिव Windows LAN बाइंड पर, Windows Firewall या संगठन-प्रबंधित Group Policy अब भी विज्ञापित LAN URL को ब्लॉक कर सकती है, भले ही Gateway होस्ट पर `127.0.0.1` काम करता हो। Windows होस्ट पर `openclaw gateway status --deep` चलाएँ; यह संभावित रूप से ब्लॉक किए गए पोर्ट, प्रोफ़ाइल असंगतियाँ, और स्थानीय फ़ायरवॉल नियम रिपोर्ट करता है जिन्हें नीति अनदेखा कर सकती है।
</Note>

Auth WebSocket हैंडशेक के दौरान इनके माध्यम से दी जाती है:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve पहचान हेडर जब `gateway.auth.allowTailscale: true` हो
- विश्वसनीय-प्रॉक्सी पहचान हेडर जब `gateway.auth.mode: "trusted-proxy"` हो

डैशबोर्ड सेटिंग्स पैनल मौजूदा ब्राउज़र टैब सत्र और चुने गए gateway URL के लिए एक टोकन रखता है; पासवर्ड स्थायी रूप से सहेजे नहीं जाते। ऑनबोर्डिंग आमतौर पर पहले कनेक्ट पर साझा-सीक्रेट auth के लिए gateway टोकन बनाती है, लेकिन जब `gateway.auth.mode` `"password"` हो तो पासवर्ड auth भी काम करता है।

## डिवाइस पेयरिंग (पहला कनेक्शन)

जब आप किसी नए ब्राउज़र या डिवाइस से Control UI से कनेक्ट करते हैं, तो Gateway आमतौर पर **एक-बार की पेयरिंग स्वीकृति** मांगता है। यह अनधिकृत पहुंच रोकने का सुरक्षा उपाय है।

**आप यह देखेंगे:** "disconnected (1008): pairing required"

<Steps>
  <Step title="लंबित अनुरोध सूचीबद्ध करें">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="अनुरोध ID से स्वीकृत करें">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

यदि ब्राउज़र बदले हुए auth विवरणों (role/scopes/public key) के साथ पेयरिंग दोबारा आज़माता है, तो पिछला लंबित अनुरोध supersede हो जाता है और नया `requestId` बनाया जाता है। स्वीकृति से पहले `openclaw devices list` दोबारा चलाएँ।

यदि ब्राउज़र पहले से पेयर है और आप उसे read पहुंच से write/admin पहुंच में बदलते हैं, तो इसे approval upgrade माना जाता है, चुपचाप reconnect नहीं। OpenClaw पुरानी स्वीकृति सक्रिय रखता है, व्यापक reconnect को रोकता है, और आपको नए scope सेट को स्पष्ट रूप से स्वीकृत करने को कहता है।

स्वीकृत होने के बाद, डिवाइस याद रखा जाता है और फिर से स्वीकृति की आवश्यकता नहीं होगी, जब तक आप इसे `openclaw devices revoke --device <id> --role <role>` से revoke न करें। टोकन रोटेशन और revocation के लिए [Devices CLI](/hi/cli/devices) देखें।

`openclaw_gateway` adapter के माध्यम से कनेक्ट होने वाले Paperclip agents भी वही first-run approval flow उपयोग करते हैं। शुरुआती कनेक्शन प्रयास के बाद, लंबित अनुरोध का preview देखने के लिए `openclaw devices approve --latest` चलाएँ, फिर उसे स्वीकृत करने के लिए प्रिंट किया गया `openclaw devices approve <requestId>` कमांड दोबारा चलाएँ। remote gateway के लिए स्पष्ट `--url` और `--token` मान पास करें। restarts के बीच approvals स्थिर रखने के लिए, हर run में नई ephemeral device identity बनने देने के बजाय Paperclip में persistent `adapterConfig.devicePrivateKeyPem` कॉन्फ़िगर करें।

<Note>
- सीधे local loopback ब्राउज़र कनेक्शन (`127.0.0.1` / `localhost`) अपने-आप स्वीकृत होते हैं।
- Tailscale Serve, Control UI operator sessions के लिए pairing round trip छोड़ सकता है जब `gateway.auth.allowTailscale: true` हो, Tailscale identity verify हो, और ब्राउज़र अपनी device identity प्रस्तुत करे।
- सीधे Tailnet binds, LAN ब्राउज़र connects, और device identity के बिना ब्राउज़र profiles में अभी भी स्पष्ट स्वीकृति चाहिए।
- हर ब्राउज़र profile एक unique device ID बनाता है, इसलिए ब्राउज़र बदलने या browser data साफ़ करने पर फिर से pairing करनी होगी।

</Note>

## व्यक्तिगत पहचान (browser-local)

Control UI प्रति-ब्राउज़र व्यक्तिगत पहचान (display name और avatar) का समर्थन करता है, जो साझा sessions में attribution के लिए outgoing messages से जुड़ती है। यह browser storage में रहती है, मौजूदा browser profile तक scoped होती है, और आपके वास्तव में भेजे गए messages पर सामान्य transcript authorship metadata से आगे अन्य devices पर sync या server-side persist नहीं होती। site data साफ़ करने या ब्राउज़र बदलने पर यह खाली हो जाती है।

assistant avatar override पर भी वही browser-local pattern लागू होता है। uploaded assistant avatars केवल local browser में gateway-resolved identity को overlay करते हैं और कभी भी `config.patch` के माध्यम से round-trip नहीं करते। shared `ui.assistant.avatar` config field अब भी उन non-UI clients के लिए उपलब्ध है जो field को सीधे लिखते हैं (जैसे scripted gateways या custom dashboards)।

## Runtime config endpoint

Control UI अपनी runtime settings `/control-ui-config.json` से fetch करता है, जिसे gateway के Control UI base path के relative resolve किया जाता है (उदाहरण के लिए जब UI `/__openclaw__/` के अंतर्गत served हो तो `/__openclaw__/control-ui-config.json`)। वह endpoint बाकी HTTP surface की तरह ही gateway auth से gated है: unauthenticated browsers इसे fetch नहीं कर सकते, और successful fetch के लिए या तो पहले से valid gateway token/password, Tailscale Serve identity, या trusted-proxy identity चाहिए।

## भाषा समर्थन

Control UI पहले load पर आपके browser locale के आधार पर स्वयं को localize कर सकता है। बाद में इसे override करने के लिए, **Overview -> Gateway Access -> Language** खोलें। locale picker Gateway Access कार्ड में होता है, Appearance के अंतर्गत नहीं।

- समर्थित locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Non-English translations ब्राउज़र में lazy-loaded होती हैं।
- चुना गया locale browser storage में सहेजा जाता है और future visits पर फिर से उपयोग होता है।
- Missing translation keys English पर fall back करती हैं।

Docs translations उसी non-English locale set के लिए generated होती हैं, लेकिन docs site का built-in Mintlify language picker उन locale codes तक सीमित है जिन्हें Mintlify स्वीकार करता है। Thai (`th`) और Persian (`fa`) docs अब भी publish repo में generated होते हैं; वे उस picker में तब तक दिखाई नहीं दे सकते जब तक Mintlify उन codes का समर्थन न करे।

## Appearance themes

Appearance panel built-in Claw, Knot, और Dash themes, साथ ही एक browser-local tweakcn import slot रखता है। theme import करने के लिए, [tweakcn editor](https://tweakcn.com/editor/theme) खोलें, कोई theme चुनें या बनाएँ, **Share** पर क्लिक करें, और copied theme link को Appearance में paste करें। importer `https://tweakcn.com/r/themes/<id>` registry URLs, `https://tweakcn.com/editor/theme?theme=amethyst-haze` जैसे editor URLs, relative `/themes/<id>` paths, raw theme IDs, और `amethyst-haze` जैसे default theme names भी स्वीकार करता है।

Appearance में browser-local Text size setting भी शामिल है। यह setting बाकी Control UI preferences के साथ stored होती है, chat text, composer text, tool cards, और chat sidebars पर लागू होती है, और text inputs को कम से कम 16px रखती है ताकि mobile Safari focus पर auto-zoom न करे।

Imported themes केवल मौजूदा browser profile में stored होती हैं। वे gateway config में नहीं लिखी जातीं और devices के बीच sync नहीं होतीं। imported theme को replace करने से एक local slot update होता है; उसे clear करने से active theme वापस Claw पर switch हो जाती है यदि imported theme selected थी।

## यह क्या कर सकता है (आज)

<AccordionGroup>
  <Accordion title="Chat और Talk">
    - Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`) के माध्यम से model से chat करें।
    - Chat history refreshes प्रति-message text caps के साथ bounded recent window मांगते हैं ताकि बड़े sessions browser को chat usable होने से पहले full transcript payload render करने के लिए मजबूर न करें।
    - browser realtime sessions के माध्यम से बात करें। OpenAI direct WebRTC उपयोग करता है, Google Live WebSocket पर constrained one-use browser token उपयोग करता है, और backend-only realtime voice plugins Gateway relay transport उपयोग करते हैं। Client-owned provider sessions `talk.client.create` से शुरू होते हैं; Gateway relay sessions `talk.session.create` से शुरू होते हैं। relay provider credentials को Gateway पर रखता है जबकि browser `talk.session.appendAudio` के माध्यम से microphone PCM stream करता है, Gateway policy और बड़े configured OpenClaw model के लिए `openclaw_agent_consult` provider tool calls को `talk.client.toolCall` के माध्यम से forward करता है, और active-run voice steering को `talk.client.steer` या `talk.session.steer` के माध्यम से route करता है।
    - Chat में tool calls + live tool output cards stream करें (agent events)।
    - मौजूदा `session.tool` / tool event delivery से live tool activity के browser-local, redaction-first summaries वाला Activity tab।

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: built-in plus bundled/external plugin channels status, QR login, और per-channel config (`channels.status`, `web.login.*`, `config.patch`)।
    - Channel probe refreshes पिछले snapshot को visible रखते हैं जबकि slow provider checks finish होते हैं, और probe या audit अपने UI budget से आगे जाने पर partial snapshots labeled होते हैं।
    - Instances: presence list + refresh (`system-presence`)।
    - Sessions: default रूप से configured-agent sessions list करें, stale unconfigured agent session keys से fall back करें, और per-session model/thinking/fast/verbose/trace/reasoning overrides apply करें (`sessions.list`, `sessions.patch`)।
    - Dreams: dreaming status, enable/disable toggle, और Dream Diary reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)।

  </Accordion>
  <Accordion title="Cron, Skills, Node, exec approvals">
    - Cron jobs: list/add/edit/run/enable/disable + run history (`cron.*`)।
    - Skills: status, enable/disable, install, API key updates (`skills.*`)।
    - Node: list + caps (`node.list`)।
    - Exec approvals: gateway या node allowlists + `exec host=gateway/node` के लिए ask policy edit करें (`exec.approvals.*`)।

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` देखें/edit करें (`config.get`, `config.set`)।
    - MCP के पास configured servers, enablement, OAuth/filter/parallel summaries, common operator commands, और scoped `mcp` config editor के लिए dedicated settings page है।
    - validation के साथ apply + restart करें (`config.apply`) और last active session को wake करें।
    - Writes में concurrent edits clobber होने से रोकने के लिए base-hash guard शामिल होता है।
    - Writes (`config.set`/`config.apply`/`config.patch`) submitted config payload में refs के लिए active SecretRef resolution preflight करते हैं; unresolved active submitted refs write से पहले reject कर दिए जाते हैं।
    - Form saves stale redacted placeholders discard करते हैं जिन्हें saved config से restore नहीं किया जा सकता, जबकि redacted values preserve करते हैं जो अब भी saved secrets से map होती हैं।
    - Schema + form rendering (`config.schema` / `config.schema.lookup`, जिसमें field `title` / `description`, matched UI hints, immediate child summaries, nested object/wildcard/array/composition nodes पर docs metadata, साथ ही plugin + channel schemas जब उपलब्ध हों शामिल हैं); Raw JSON editor केवल तब उपलब्ध होता है जब snapshot के पास safe raw round-trip हो।
    - यदि कोई snapshot raw text को सुरक्षित रूप से round-trip नहीं कर सकता, तो Control UI उस snapshot के लिए Form mode force करता है और Raw mode disable करता है।
    - Raw JSON editor "Reset to saved" flattened snapshot फिर से render करने के बजाय raw-authored shape (formatting, comments, `$include` layout) preserve करता है, ताकि snapshot safe round-trip कर सके तो external edits reset के बाद भी बचें।
    - Structured SecretRef object values form text inputs में read-only rendered होते हैं ताकि accidental object-to-string corruption रोकी जा सके।

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status/health/models snapshots + event log + manual RPC calls (`status`, `health`, `models.list`)।
    - event log में Control UI refresh/RPC timings, slow chat/config render timings, और long animation frames या long tasks के लिए browser responsiveness entries शामिल होती हैं जब browser वे PerformanceObserver entry types expose करता है।
    - Logs: filter/export के साथ gateway file logs की live tail (`logs.tail`)।
    - Update: restart report के साथ package/git update + restart चलाएँ (`update.run`), फिर reconnect के बाद running gateway version verify करने के लिए `update.status` poll करें।

  </Accordion>
  <Accordion title="Cron जॉब्स पैनल नोट्स">
    - अलग-थलग जॉब्स के लिए, डिलीवरी डिफ़ॉल्ट रूप से सारांश की घोषणा करती है। अगर आप केवल-आंतरिक रन चाहते हैं, तो आप इसे none पर स्विच कर सकते हैं।
    - announce चुने जाने पर Channel/target फ़ील्ड दिखाई देते हैं।
    - Webhook मोड `delivery.mode = "webhook"` का उपयोग करता है, जिसमें `delivery.to` को एक मान्य HTTP(S) webhook URL पर सेट किया जाता है।
    - मुख्य-सेशन जॉब्स के लिए, webhook और none डिलीवरी मोड उपलब्ध हैं।
    - उन्नत संपादन नियंत्रणों में delete-after-run, एजेंट ओवरराइड साफ़ करना, cron exact/stagger विकल्प, एजेंट मॉडल/थिंकिंग ओवरराइड, और best-effort डिलीवरी टॉगल शामिल हैं।
    - फ़ॉर्म वैलिडेशन फ़ील्ड-स्तरीय त्रुटियों के साथ इनलाइन है; अमान्य मान ठीक होने तक सेव बटन को अक्षम कर देते हैं।
    - समर्पित bearer token भेजने के लिए `cron.webhookToken` सेट करें; अगर छोड़ा गया है, तो webhook बिना auth header के भेजा जाता है।
    - अप्रचलित fallback: `cron.webhook` से `notify: true` वाले संग्रहीत legacy jobs को स्पष्ट प्रति-जॉब webhook या completion delivery में माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।

  </Accordion>
</AccordionGroup>

## MCP पेज

समर्पित MCP पेज `mcp.servers` के अंतर्गत OpenClaw-प्रबंधित MCP सर्वरों के लिए एक ऑपरेटर दृश्य है। यह MCP transports को स्वयं शुरू नहीं करता; सेव किए गए config का निरीक्षण और संपादन करने के लिए इसका उपयोग करें, फिर जब आपको लाइव सर्वर प्रमाण चाहिए, तो `openclaw mcp doctor --probe` का उपयोग करें।

सामान्य वर्कफ़्लो:

1. साइडबार से **MCP** खोलें।
2. कुल, enabled, OAuth, और filtered server गिनतियों के लिए सारांश कार्ड जाँचें।
3. transport, enablement, auth, filters, timeouts, और command hints के लिए प्रत्येक server row की समीक्षा करें।
4. जब किसी सर्वर को configured रहना चाहिए लेकिन runtime discovery से बाहर रहना चाहिए, तो enablement टॉगल करें।
5. server definitions, headers, TLS/mTLS paths, OAuth metadata, tool filters, और Codex projection metadata के लिए scoped `mcp` config section संपादित करें।
6. config write के लिए **Save** का उपयोग करें, या जब चल रहे Gateway को बदला हुआ config लागू करना चाहिए, तो **Save & Publish** का उपयोग करें।
7. जब संपादित process को static diagnostics, live proof, या cached-runtime disposal चाहिए, तो terminal से `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, या `openclaw mcp reload` चलाएँ।

पेज render करने से पहले credential-bearing URL-जैसे मानों को redact करता है और command snippets में server names को quote करता है ताकि कॉपी किए गए commands spaces या shell metacharacters के साथ भी काम करें। पूरा CLI और config reference [MCP](/hi/cli/mcp) में है।

## Activity टैब

Activity टैब लाइव tool activity के लिए ephemeral browser-local observer है। यह उसी Gateway `session.tool` / tool event stream से निकला है जो Chat tool cards को power करता है; यह कोई और Gateway event family, endpoint, durable activity store, metrics feed, या external observer stream नहीं जोड़ता।

Activity entries केवल sanitized summaries और redacted, truncated output previews रखती हैं। Tool argument values Activity state में stored नहीं होते; UI दिखाता है कि arguments hidden हैं और केवल argument field count record करता है। in-memory list current browser tab का अनुसरण करती है, Control UI के भीतर navigation में बनी रहती है, और page reload, session switch, या **Clear** पर reset हो जाती है।

## Chat व्यवहार

<AccordionGroup>
  <Accordion title="Send और history semantics">
    - `chat.send` **non-blocking** है: यह तुरंत `{ runId, status: "started" }` के साथ ack करता है और response `chat` events के माध्यम से stream होता है। Trusted Control UI clients local diagnostics के लिए optional ACK timing metadata भी प्राप्त कर सकते हैं।
    - Chat uploads images और non-video files स्वीकार करते हैं। Images native image path रखती हैं; अन्य files managed media के रूप में stored होती हैं और history में attachment links के रूप में दिखाई जाती हैं।
    - वही `idempotencyKey` के साथ दोबारा भेजने पर, running होने के दौरान `{ status: "in_flight" }`, और completion के बाद `{ status: "ok" }` लौटता है।
    - `chat.history` responses UI safety के लिए size-bounded हैं। जब transcript entries बहुत बड़ी होती हैं, Gateway long text fields को truncate कर सकता है, heavy metadata blocks को omit कर सकता है, और oversized messages को placeholder (`[chat.history omitted: message too large]`) से replace कर सकता है।
    - जब visible assistant message `chat.history` में truncated था, side reader demand पर `sessionKey`, जरूरत पड़ने पर active `agentId`, और transcript `messageId` के माध्यम से `chat.message.get` से full display-normalized transcript entry fetch कर सकता है। अगर Gateway अभी भी अधिक नहीं लौटा सकता, तो reader truncated preview को silently repeat करने के बजाय explicit unavailable state दिखाता है।
    - Assistant/generated images managed media references के रूप में persisted होती हैं और authenticated Gateway media URLs के माध्यम से वापस served होती हैं, इसलिए reloads chat history response में raw base64 image payloads बने रहने पर निर्भर नहीं होते।
    - `chat.history` render करते समय, Control UI visible assistant text से display-only inline directive tags (उदाहरण के लिए `[[reply_to_*]]` और `[[audio_as_voice]]`), plain-text tool-call XML payloads (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और truncated tool-call blocks सहित), और leaked ASCII/full-width model control tokens को strips करता है, और उन assistant entries को omit करता है जिनका पूरा visible text केवल exact silent token `NO_REPLY` / `no_reply` या heartbeat acknowledgement token `HEARTBEAT_OK` है।
    - active send और final history refresh के दौरान, अगर `chat.history` briefly older snapshot लौटाता है, तो chat view local optimistic user/assistant messages को visible रखता है; Gateway history catch up होने पर canonical transcript उन local messages को replace करता है।
    - Live `chat` events delivery state हैं, जबकि `chat.history` durable session transcript से rebuilt है। tool-final events के बाद Control UI history reload करता है और केवल small optimistic tail merge करता है; transcript boundary [WebChat](/hi/web/webchat) में documented है।
    - `chat.inject` session transcript में assistant note append करता है और UI-only updates के लिए `chat` event broadcast करता है (कोई agent run नहीं, कोई channel delivery नहीं)।
    - chat header session picker से पहले agent filter दिखाता है, और session picker selected agent द्वारा scoped होता है। agents switch करने पर केवल उस agent से tied sessions दिखते हैं और अगर उसके पास अभी saved dashboard sessions नहीं हैं, तो उस agent के main session पर fallback होता है।
    - desktop widths पर, chat controls एक compact row पर रहते हैं और transcript में नीचे scroll करते समय collapse हो जाते हैं; ऊपर scroll करने, top पर लौटने, या bottom तक पहुँचने पर controls restore हो जाते हैं।
    - लगातार duplicate text-only messages count badge के साथ एक bubble के रूप में render होते हैं। Images, attachments, tool output, या canvas previews वाले messages uncollapsed छोड़े जाते हैं।
    - chat header model और thinking pickers active session को तुरंत `sessions.patch` के माध्यम से patch करते हैं; वे persistent session overrides हैं, one-turn-only send options नहीं।
    - अगर आप उसी session के लिए model picker change अभी saving होते हुए message भेजते हैं, तो composer `chat.send` call करने से पहले उस session patch की प्रतीक्षा करता है ताकि send selected model का उपयोग करे।
    - Control UI में `/new` टाइप करने से New Chat जैसा ही fresh dashboard session बनता है और उस पर switch होता है, सिवाय जब `session.dmScope: "main"` configured हो और current parent agent का main session हो; उस स्थिति में यह main session को जगह पर reset करता है। `/reset` टाइप करने से current session के लिए Gateway का explicit in-place reset बना रहता है।
    - chat model picker Gateway का configured model view request करता है। अगर `agents.defaults.models` मौजूद है, तो वह allowlist picker को drive करती है, जिसमें `provider/*` entries भी शामिल हैं जो provider-scoped catalogs को dynamic रखती हैं। अन्यथा picker explicit `models.providers.*.models` entries और usable auth वाले providers दिखाता है। full catalog debug `models.list` RPC के माध्यम से `view: "all"` के साथ available रहता है।
    - जब fresh Gateway session usage reports में current context tokens शामिल होते हैं, तो chat composer area compact context usage indicator दिखाता है। high context pressure पर यह warning styling में switch करता है और recommended compaction levels पर, normal session compaction path चलाने वाला compact button दिखाता है। Stale token snapshots तब तक hidden रहते हैं जब तक Gateway फिर से fresh usage report नहीं करता।

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Talk mode registered realtime voice provider का उपयोग करता है। OpenAI को `talk.realtime.provider: "openai"` के साथ `openai` API-key auth profile, `talk.realtime.providers.openai.apiKey`, या `OPENAI_API_KEY` से configure करें; OpenAI OAuth profiles Realtime voice configure नहीं करते। Google को `talk.realtime.provider: "google"` और `talk.realtime.providers.google.apiKey` के साथ configure करें। browser को कभी standard provider API key नहीं मिलती। OpenAI WebRTC के लिए ephemeral Realtime client secret प्राप्त करता है। Google Live browser WebSocket session के लिए one-use constrained Live API auth token प्राप्त करता है, जिसमें instructions और tool declarations Gateway द्वारा token में locked होते हैं। जो Providers केवल backend realtime bridge expose करते हैं, वे Gateway relay transport के माध्यम से चलते हैं, इसलिए credentials और vendor sockets server-side रहते हैं जबकि browser audio authenticated Gateway RPCs के माध्यम से चलता है। Realtime session prompt Gateway द्वारा assembled होता है; `talk.client.create` caller-provided instruction overrides स्वीकार नहीं करता।

    Chat composer में Talk start/stop button के बगल में Talk options button शामिल है। options अगले Talk session पर लागू होते हैं और provider, transport, model, voice, reasoning effort, VAD threshold, silence duration, और prefix padding को override कर सकते हैं। जब कोई option blank हो, तो Gateway जहाँ उपलब्ध हो configured defaults या provider default का उपयोग करता है। Gateway relay चुनने से backend relay path forced होता है; WebRTC चुनने से session client-owned रहता है और अगर provider browser session नहीं बना सकता तो silently relay पर fallback करने के बजाय fail होता है।

    Chat composer में, Talk control microphone dictation button के बगल का waves button है। जब Talk शुरू होता है, composer status row `Connecting Talk...`, फिर audio connected होने पर `Talk live`, या realtime tool call `talk.client.toolCall` के माध्यम से configured larger model से consult कर रहा हो तो `Asking OpenClaw...` दिखाती है।

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` OpenAI backend WebSocket bridge, OpenAI browser WebRTC SDP exchange, Google Live constrained-token browser WebSocket setup, और fake microphone media के साथ Gateway relay browser adapter को verify करता है। command केवल provider status print करता है और secrets log नहीं करता।

  </Accordion>
  <Accordion title="Stop और abort">
    - **Stop** क्लिक करें (`chat.abort` call करता है)।
    - run active होने पर, normal follow-ups queue होते हैं। queued message पर **Steer** क्लिक करके उस follow-up को running turn में inject करें।
    - out-of-band abort करने के लिए `/stop` टाइप करें (या standalone abort phrases जैसे `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`)।
    - `chat.abort` उस session के सभी active runs abort करने के लिए `{ sessionKey }` (कोई `runId` नहीं) support करता है।

  </Accordion>
  <Accordion title="Abort partial retention">
    - जब run abort होता है, partial assistant text अभी भी UI में दिखाया जा सकता है।
    - buffered output मौजूद होने पर Gateway aborted partial assistant text को transcript history में persist करता है।
    - persisted entries में abort metadata शामिल होता है ताकि transcript consumers abort partials को normal completion output से अलग पहचान सकें।

  </Accordion>
</AccordionGroup>

## PWA install और web push

Control UI एक `manifest.webmanifest` और service worker ship करता है, इसलिए modern browsers इसे standalone PWA के रूप में install कर सकते हैं। Web Push Gateway को notifications के साथ installed PWA जगाने देता है, तब भी जब tab या browser window खुली न हो।

अगर OpenClaw update के तुरंत बाद page **Protocol mismatch** दिखाता है, तो पहले dashboard को `openclaw dashboard` से फिर से खोलें और page hard-refresh करें। अगर यह अभी भी fail होता है, तो dashboard origin के लिए site data clear करें या private browser window में test करें; old tab या browser service-worker cache newer Gateway के विरुद्ध pre-update Control UI bundle चलाता रह सकता है।

| सतह                                                  | यह क्या करती है                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA मैनिफेस्ट। इसके पहुंच योग्य होते ही ब्राउज़र "Install app" की पेशकश करते हैं। |
| `ui/public/sw.js`                                     | सर्विस वर्कर जो `push` इवेंट और सूचना क्लिक संभालता है। |
| `push/vapid-keys.json` (OpenClaw स्टेट dir के अंतर्गत) | Web Push पेलोड पर हस्ताक्षर करने के लिए उपयोग की जाने वाली अपने-आप बनी VAPID कीपेयर। |
| `push/web-push-subscriptions.json`                    | सहेजे गए ब्राउज़र सब्सक्रिप्शन endpoints।                          |

जब आप keys को पिन करना चाहते हैं (मल्टी-होस्ट deployments, secrets rotation, या tests के लिए), Gateway प्रक्रिया पर env vars के जरिए VAPID कीपेयर को ओवरराइड करें:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (डिफ़ॉल्ट `https://openclaw.ai` है)

Control UI ब्राउज़र सब्सक्रिप्शन को रजिस्टर और टेस्ट करने के लिए इन scope-gated Gateway methods का उपयोग करता है:

- `push.web.vapidPublicKey` — सक्रिय VAPID public key लाता है।
- `push.web.subscribe` — `endpoint` और `keys.p256dh`/`keys.auth` रजिस्टर करता है।
- `push.web.unsubscribe` — रजिस्टर्ड endpoint हटाता है।
- `push.web.test` — कॉलर के subscription को test notification भेजता है।

<Note>
Web Push, iOS APNS relay path (relay-backed push के लिए [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें) और मौजूदा `push.test` method से स्वतंत्र है, जो native mobile pairing को target करते हैं।
</Note>

## होस्टेड एम्बेड

Assistant संदेश `[embed ...]` shortcode के साथ hosted web content को inline render कर सकते हैं। iframe sandbox policy `gateway.controlUi.embedSandbox` से नियंत्रित होती है:

<Tabs>
  <Tab title="strict">
    hosted embeds के अंदर script execution निष्क्रिय करता है।
  </Tab>
  <Tab title="scripts (default)">
    origin isolation बनाए रखते हुए interactive embeds की अनुमति देता है; यह डिफ़ॉल्ट है और आम तौर पर self-contained browser games/widgets के लिए पर्याप्त होता है।
  </Tab>
  <Tab title="trusted">
    same-site documents के लिए `allow-scripts` के ऊपर `allow-same-origin` जोड़ता है, जिन्हें जानबूझकर मजबूत privileges की जरूरत होती है।
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
`trusted` का उपयोग केवल तब करें जब embedded document को सचमुच same-origin behavior की जरूरत हो। अधिकतर agent-generated games और interactive canvases के लिए, `scripts` अधिक सुरक्षित विकल्प है।
</Warning>

Absolute external `http(s)` embed URLs डिफ़ॉल्ट रूप से blocked रहते हैं। यदि आप जानबूझकर चाहते हैं कि `[embed url="https://..."]` third-party pages load करे, तो `gateway.controlUi.allowExternalEmbedUrls: true` सेट करें।

## Chat message width

Grouped chat messages readable default max-width का उपयोग करते हैं। Wide-monitor deployments bundled CSS patch किए बिना इसे `gateway.controlUi.chatMessageMaxWidth` सेट करके override कर सकते हैं:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

ब्राउज़र तक पहुंचने से पहले value validate की जाती है। समर्थित values में plain lengths और percentages जैसे `960px` या `82%`, साथ ही constrained `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, और `fit-content(...)` width expressions शामिल हैं।

## Tailnet access (अनुशंसित)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway को loopback पर रखें और Tailscale Serve को HTTPS के साथ इसे proxy करने दें:

    ```bash
    openclaw gateway --tailscale serve
    ```

    खोलें:

    - `https://<magicdns>/` (या आपका configured `gateway.controlUi.basePath`)

    डिफ़ॉल्ट रूप से, जब `gateway.auth.allowTailscale` `true` होता है, Control UI/WebSocket Serve requests Tailscale identity headers (`tailscale-user-login`) के जरिए authenticate कर सकते हैं। OpenClaw `x-forwarded-for` address को `tailscale whois` के साथ resolve करके और उसे header से match करके identity verify करता है, और इन्हें केवल तब स्वीकार करता है जब request loopback पर Tailscale के `x-forwarded-*` headers के साथ आती है। ब्राउज़र device identity वाली Control UI operator sessions के लिए, यह verified Serve path device-pairing round trip भी skip करता है; device-less browsers और node-role connections अब भी सामान्य device checks follow करते हैं। यदि आप Serve traffic के लिए भी explicit shared-secret credentials require करना चाहते हैं, तो `gateway.auth.allowTailscale: false` सेट करें। फिर `gateway.auth.mode: "token"` या `"password"` का उपयोग करें।

    उस async Serve identity path के लिए, समान client IP और auth scope के failed auth attempts rate-limit writes से पहले serialized होते हैं। इसलिए समान browser से concurrent bad retries दूसरे request पर parallel में race करते हुए दो plain mismatches के बजाय `retry later` दिखा सकते हैं।

    <Warning>
    Tokenless Serve auth मानता है कि gateway host trusted है। यदि उस host पर untrusted local code चल सकता है, तो token/password auth require करें।
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    फिर खोलें:

    - `http://<tailscale-ip>:18789/` (या आपका configured `gateway.controlUi.basePath`)

    Matching shared secret को UI settings में paste करें (`connect.params.auth.token` या `connect.params.auth.password` के रूप में भेजा गया)।

  </Tab>
</Tabs>

## असुरक्षित HTTP

यदि आप dashboard को plain HTTP (`http://<lan-ip>` या `http://<tailscale-ip>`) पर खोलते हैं, तो browser **non-secure context** में चलता है और WebCrypto को block करता है। डिफ़ॉल्ट रूप से, OpenClaw device identity के बिना Control UI connections को **block** करता है।

दस्तावेजीकृत exceptions:

- `gateway.controlUi.allowInsecureAuth=true` के साथ localhost-only insecure HTTP compatibility
- `gateway.auth.mode: "trusted-proxy"` के जरिए successful operator Control UI auth
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**अनुशंसित समाधान:** HTTPS (Tailscale Serve) का उपयोग करें या UI को locally खोलें:

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
    `dangerouslyDisableDeviceAuth` Control UI device identity checks को निष्क्रिय करता है और यह गंभीर security downgrade है। emergency use के बाद जल्दी revert करें।
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Successful trusted-proxy auth **operator** Control UI sessions को device identity के बिना admit कर सकता है।
    - यह node-role Control UI sessions तक extend **नहीं** होता।
    - Same-host loopback reverse proxies अब भी trusted-proxy auth satisfy नहीं करते; [Trusted proxy auth](/hi/gateway/trusted-proxy-auth) देखें।

  </Accordion>
</AccordionGroup>

HTTPS setup guidance के लिए [Tailscale](/hi/gateway/tailscale) देखें।

## Content security policy

Control UI एक tight `img-src` policy के साथ ship होता है: केवल **same-origin** assets, `data:` URLs, और locally generated `blob:` URLs की अनुमति है। Remote `http(s)` और protocol-relative image URLs browser द्वारा rejected होते हैं और network fetches issue नहीं करते।

व्यवहार में इसका मतलब:

- Relative paths के अंतर्गत serve किए गए avatars और images (उदाहरण के लिए `/avatars/<id>`) अब भी render होते हैं, जिनमें authenticated avatar routes भी शामिल हैं जिन्हें UI fetch करके local `blob:` URLs में बदलता है।
- Inline `data:image/...` URLs अब भी render होते हैं (in-protocol payloads के लिए उपयोगी)।
- Control UI द्वारा बनाए गए local `blob:` URLs अब भी render होते हैं।
- Channel metadata द्वारा emitted remote avatar URLs Control UI के avatar helpers पर stripped होते हैं और built-in logo/badge से replace किए जाते हैं, इसलिए compromised या malicious channel operator browser से arbitrary remote image fetches force नहीं कर सकता।

इस behavior को पाने के लिए आपको कुछ भी बदलने की जरूरत नहीं है — यह हमेशा on है और configurable नहीं है।

## Avatar route auth

जब gateway auth configured होता है, Control UI avatar endpoint को बाकी API जैसा ही gateway token चाहिए:

- `GET /avatar/<agentId>` avatar image केवल authenticated callers को return करता है। `GET /avatar/<agentId>?meta=1` इसी rule के अंतर्गत avatar metadata return करता है।
- किसी भी route पर unauthenticated requests rejected होती हैं (sibling assistant-media route से match करते हुए)। यह avatar route को उन hosts पर agent identity leak करने से रोकता है जो अन्यथा protected हैं।
- Control UI खुद avatars fetch करते समय gateway token को bearer header के रूप में forward करता है, और authenticated blob URLs का उपयोग करता है ताकि image dashboards में अब भी render हो।

यदि आप gateway auth disable करते हैं (shared hosts पर अनुशंसित नहीं), तो gateway के बाकी हिस्से की तरह avatar route भी unauthenticated हो जाता है।

## Assistant media route auth

जब gateway auth configured होता है, assistant local-media previews two-step route का उपयोग करते हैं:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` को normal Control UI operator auth चाहिए। Availability check करते समय browser gateway token को bearer header के रूप में भेजता है।
- Successful metadata responses में उस exact source path तक scoped short-lived `mediaTicket` शामिल होता है।
- Browser-rendered image, audio, video, और document URLs active gateway token या password के बजाय `mediaTicket=<ticket>` का उपयोग करते हैं। Ticket जल्दी expire हो जाता है और किसी different source को authorize नहीं कर सकता।

यह reusable gateway credentials को visible media URLs में डाले बिना normal media rendering को browser-native media elements के साथ compatible रखता है।

## UI बनाना

Gateway `dist/control-ui` से static files serve करता है। इन्हें इसके साथ build करें:

```bash
pnpm ui:build
```

Optional absolute base (जब आप fixed asset URLs चाहते हैं):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Local development के लिए (separate dev server):

```bash
pnpm ui:dev
```

फिर UI को अपने Gateway WS URL (जैसे `ws://127.0.0.1:18789`) पर point करें।

## खाली Control UI page

यदि browser blank dashboard load करता है और DevTools कोई उपयोगी error नहीं दिखाता, तो किसी extension या early content script ने JavaScript module app को evaluate होने से रोका हो सकता है। Static page में plain HTML recovery panel शामिल है जो startup के बाद `<openclaw-app>` registered नहीं होने पर दिखाई देता है।

Browser environment बदलने के बाद panel की **Try again** action का उपयोग करें, या इन checks के बाद manually reload करें:

- उन extensions को disable करें जो सभी pages में inject करते हैं, खासकर `<all_urls>` content scripts वाले extensions।
- Private window, clean browser profile, या दूसरा browser आजमाएं।
- Gateway running रखें और browser change के बाद वही dashboard URL verify करें।

## Debugging/testing: dev server + remote Gateway

Control UI static files है; WebSocket target configurable है और HTTP origin से अलग हो सकता है। यह तब उपयोगी है जब आप Vite dev server locally चाहते हैं लेकिन Gateway कहीं और चलता है।

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Optional one-time auth (यदि जरूरत हो):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` लोड होने के बाद localStorage में संग्रहीत किया जाता है और URL से हटा दिया जाता है।
    - यदि आप `gatewayUrl` के माध्यम से पूरा `ws://` या `wss://` endpoint पास करते हैं, तो `gatewayUrl` मान को URL-encode करें ताकि browser query string को सही ढंग से parse करे।
    - जब भी संभव हो, `token` को URL fragment (`#token=...`) के माध्यम से पास किया जाना चाहिए। Fragments server को नहीं भेजे जाते, जिससे request-log और Referer leakage से बचाव होता है। Legacy `?token=` query params अभी भी compatibility के लिए एक बार import किए जाते हैं, लेकिन केवल fallback के रूप में, और bootstrap के तुरंत बाद हटा दिए जाते हैं।
    - `password` केवल memory में रखा जाता है।
    - जब `gatewayUrl` set होता है, तो UI config या environment credentials पर fallback नहीं करता। `token` (या `password`) स्पष्ट रूप से दें। स्पष्ट credentials का न होना error है।
    - जब Gateway TLS (Tailscale Serve, HTTPS proxy, आदि) के पीछे हो, तो `wss://` का उपयोग करें।
    - clickjacking रोकने के लिए `gatewayUrl` केवल top-level window (embedded नहीं) में स्वीकार किया जाता है।
    - Public non-loopback Control UI deployments को `gateway.controlUi.allowedOrigins` स्पष्ट रूप से set करना होगा (full origins)। loopback, RFC1918/link-local, `.local`, `.ts.net`, या Tailscale CGNAT hosts से private same-origin LAN/Tailnet loads Host-header fallback enable किए बिना स्वीकार किए जाते हैं।
    - Gateway startup effective runtime bind और port से `http://localhost:<port>` और `http://127.0.0.1:<port>` जैसे local origins seed कर सकता है, लेकिन remote browser origins को फिर भी स्पष्ट entries चाहिए।
    - tightly controlled local testing को छोड़कर `gateway.controlUi.allowedOrigins: ["*"]` का उपयोग न करें। इसका अर्थ है किसी भी browser origin को allow करना, न कि "मैं जो भी host उपयोग कर रहा हूं, उससे match करें।"
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` Host-header origin fallback mode enable करता है, लेकिन यह एक खतरनाक security mode है।

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

- [Dashboard](/hi/web/dashboard) — gateway dashboard
- [Health Checks](/hi/gateway/health) — gateway health monitoring
- [TUI](/hi/web/tui) — terminal user interface
- [WebChat](/hi/web/webchat) — browser-based chat interface
