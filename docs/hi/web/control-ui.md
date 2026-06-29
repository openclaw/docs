---
read_when:
    - आप Gateway को ब्राउज़र से संचालित करना चाहते हैं
    - आप SSH टनल के बिना Tailnet एक्सेस चाहते हैं
sidebarTitle: Control UI
summary: Gateway के लिए ब्राउज़र-आधारित नियंत्रण UI (चैट, गतिविधि, नोड्स, कॉन्फ़िग)
title: Control UI
x-i18n:
    generated_at: "2026-06-29T00:26:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Control UI, Gateway द्वारा सर्व की जाने वाली एक छोटी **Vite + Lit** single-page app है:

- डिफ़ॉल्ट: `http://<host>:18789/`
- वैकल्पिक prefix: `gateway.controlUi.basePath` सेट करें (जैसे `/openclaw`)

यह उसी port पर **सीधे Gateway WebSocket से** बात करता है.

## तुरंत खोलें (स्थानीय)

अगर Gateway उसी कंप्यूटर पर चल रहा है, तो खोलें:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (या [http://localhost:18789/](http://localhost:18789/))

अगर पेज लोड नहीं होता, तो पहले Gateway शुरू करें: `openclaw gateway`.

Auth WebSocket handshake के दौरान इनके माध्यम से दी जाती है:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve identity headers, जब `gateway.auth.allowTailscale: true` हो
- trusted-proxy identity headers, जब `gateway.auth.mode: "trusted-proxy"` हो

Dashboard settings panel मौजूदा browser tab session और चुने गए gateway URL के लिए token रखता है; passwords persist नहीं किए जाते. Onboarding आम तौर पर पहले connect पर shared-secret auth के लिए gateway token बनाता है, लेकिन जब `gateway.auth.mode` `"password"` हो तो password auth भी काम करता है.

## डिवाइस pairing (पहला connection)

जब आप किसी नए browser या device से Control UI से connect करते हैं, तो Gateway आम तौर पर **one-time pairing approval** मांगता है. यह unauthorized access रोकने के लिए एक security measure है.

**आपको यह दिखेगा:** "disconnected (1008): pairing required"

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

अगर browser बदली हुई auth details (role/scopes/public key) के साथ pairing retry करता है, तो पिछली pending request supersede हो जाती है और नया `requestId` बनाया जाता है. approval से पहले `openclaw devices list` फिर से चलाएं.

अगर browser पहले से paired है और आप उसे read access से write/admin access में बदलते हैं, तो इसे silent reconnect नहीं, बल्कि approval upgrade माना जाता है. OpenClaw पुरानी approval को active रखता है, broader reconnect को block करता है, और आपसे नए scope set को स्पष्ट रूप से approve करने को कहता है.

Approve होने के बाद, device याद रखा जाता है और जब तक आप उसे `openclaw devices revoke --device <id> --role <role>` से revoke नहीं करते, तब तक re-approval की जरूरत नहीं होगी. token rotation और revocation के लिए [Devices CLI](/hi/cli/devices) देखें.

`openclaw_gateway` adapter के माध्यम से connect करने वाले Paperclip agents भी वही first-run approval flow इस्तेमाल करते हैं. initial connection attempt के बाद, pending request preview करने के लिए `openclaw devices approve --latest` चलाएं, फिर approve करने के लिए printed `openclaw devices approve <requestId>` command फिर से चलाएं. remote gateway के लिए explicit `--url` और `--token` values pass करें. restarts के बीच approvals stable रखने के लिए, हर run में नई ephemeral device identity generate करने देने के बजाय Paperclip में persistent `adapterConfig.devicePrivateKeyPem` configure करें.

<Note>
- Direct local loopback browser connections (`127.0.0.1` / `localhost`) auto-approved होते हैं.
- Tailscale Serve, Control UI operator sessions के लिए pairing round trip skip कर सकता है जब `gateway.auth.allowTailscale: true` हो, Tailscale identity verify हो, और browser अपनी device identity प्रस्तुत करे.
- Direct Tailnet binds, LAN browser connects, और बिना device identity वाले browser profiles में अभी भी explicit approval चाहिए.
- हर browser profile एक unique device ID generate करता है, इसलिए browsers बदलने या browser data clear करने पर re-pairing की जरूरत होगी.

</Note>

## व्यक्तिगत identity (browser-local)

Control UI per-browser personal identity (display name और avatar) का समर्थन करता है, जो shared sessions में attribution के लिए outgoing messages से जुड़ी होती है. यह browser storage में रहती है, मौजूदा browser profile तक scoped होती है, और आपके वास्तव में भेजे गए messages पर सामान्य transcript authorship metadata से आगे दूसरे devices पर sync या server-side persist नहीं की जाती. site data clear करने या browsers बदलने पर यह खाली हो जाती है.

यही browser-local pattern assistant avatar override पर लागू होता है. Uploaded assistant avatars केवल local browser पर gateway-resolved identity को overlay करते हैं और कभी भी `config.patch` के माध्यम से round-trip नहीं करते. shared `ui.assistant.avatar` config field अभी भी उन non-UI clients के लिए उपलब्ध है जो field को सीधे लिखते हैं (जैसे scripted gateways या custom dashboards).

## Runtime config endpoint

Control UI अपनी runtime settings `/control-ui-config.json` से fetch करता है, जो gateway के Control UI base path के relative resolve होता है (उदाहरण के लिए जब UI `/__openclaw__/` के अंतर्गत served हो, तो `/__openclaw__/control-ui-config.json`). यह endpoint बाकी HTTP surface की तरह उसी gateway auth से gated है: unauthenticated browsers इसे fetch नहीं कर सकते, और successful fetch के लिए या तो पहले से valid gateway token/password, Tailscale Serve identity, या trusted-proxy identity चाहिए.

## भाषा support

Control UI first load पर आपके browser locale के आधार पर खुद को localize कर सकता है. बाद में override करने के लिए, **Overview -> Gateway Access -> Language** खोलें. locale picker Gateway Access card में होता है, Appearance के अंतर्गत नहीं.

- Supported locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Non-English translations browser में lazy-loaded होती हैं.
- चुना गया locale browser storage में save होता है और future visits पर reuse होता है.
- Missing translation keys वापस English पर fall back करती हैं.

Docs translations उसी non-English locale set के लिए generate किए जाते हैं, लेकिन docs site का built-in Mintlify language picker उन locale codes तक सीमित है जिन्हें Mintlify accept करता है. Thai (`th`) और Persian (`fa`) docs अभी भी publish repo में generate होते हैं; वे उस picker में तब तक नहीं दिख सकते जब तक Mintlify उन codes को support नहीं करता.

## Appearance themes

Appearance panel built-in Claw, Knot, और Dash themes के साथ एक browser-local tweakcn import slot रखता है. theme import करने के लिए, [tweakcn editor](https://tweakcn.com/editor/theme) खोलें, theme चुनें या बनाएं, **Share** पर click करें, और copied theme link को Appearance में paste करें. importer `https://tweakcn.com/r/themes/<id>` registry URLs, `https://tweakcn.com/editor/theme?theme=amethyst-haze` जैसे editor URLs, relative `/themes/<id>` paths, raw theme IDs, और `amethyst-haze` जैसे default theme names भी accept करता है.

Appearance में browser-local Text size setting भी शामिल है. setting बाकी Control UI preferences के साथ stored होती है, chat text, composer text, tool cards, और chat sidebars पर apply होती है, और text inputs को कम से कम 16px रखती है ताकि mobile Safari focus पर auto-zoom न करे.

Imported themes केवल मौजूदा browser profile में stored होते हैं. वे gateway config में नहीं लिखे जाते और devices के बीच sync नहीं होते. imported theme को replace करने से वही एक local slot update होता है; उसे clear करने पर, अगर imported theme selected था तो active theme वापस Claw पर switch हो जाता है.

## यह क्या कर सकता है (आज)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`) के माध्यम से model से chat करें.
    - Chat history refreshes, per-message text caps के साथ bounded recent window request करते हैं ताकि बड़ी sessions browser को chat usable होने से पहले full transcript payload render करने के लिए मजबूर न करें.
    - browser realtime sessions के माध्यम से बात करें. OpenAI direct WebRTC इस्तेमाल करता है, Google Live WebSocket पर constrained one-use browser token इस्तेमाल करता है, और backend-only realtime voice plugins Gateway relay transport इस्तेमाल करते हैं. Client-owned provider sessions `talk.client.create` से शुरू होते हैं; Gateway relay sessions `talk.session.create` से शुरू होते हैं. relay provider credentials को Gateway पर रखता है, जबकि browser microphone PCM को `talk.session.appendAudio` के माध्यम से stream करता है, Gateway policy और बड़े configured OpenClaw model के लिए `openclaw_agent_consult` provider tool calls को `talk.client.toolCall` के माध्यम से forward करता है, और active-run voice steering को `talk.client.steer` या `talk.session.steer` के माध्यम से route करता है.
    - Chat में tool calls + live tool output cards stream करें (agent events).
    - मौजूदा `session.tool` / tool event delivery से live tool activity के browser-local, redaction-first summaries वाला Activity tab.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: built-in plus bundled/external plugin channels status, QR login, और per-channel config (`channels.status`, `web.login.*`, `config.patch`).
    - Channel probe refreshes, slow provider checks finish होने तक previous snapshot visible रखते हैं, और जब probe या audit अपने UI budget से आगे जाता है तो partial snapshots labeled होते हैं.
    - Instances: presence list + refresh (`system-presence`).
    - Sessions: default रूप से configured-agent sessions list करें, stale unconfigured agent session keys से fall back करें, और per-session model/thinking/fast/verbose/trace/reasoning overrides apply करें (`sessions.list`, `sessions.patch`).
    - Dreams: dreaming status, enable/disable toggle, और Dream Diary reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron jobs: list/add/edit/run/enable/disable + run history (`cron.*`).
    - Skills: status, enable/disable, install, API key updates (`skills.*`).
    - Nodes: list + caps (`node.list`).
    - Exec approvals: `exec host=gateway/node` के लिए gateway या node allowlists + ask policy edit करें (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` देखें/edit करें (`config.get`, `config.set`).
    - MCP के पास configured servers, enablement, OAuth/filter/parallel summaries, common operator commands, और scoped `mcp` config editor के लिए dedicated settings page है.
    - validation के साथ apply + restart करें (`config.apply`) और last active session को wake करें.
    - Writes में concurrent edits clobber होने से रोकने के लिए base-hash guard शामिल है.
    - Writes (`config.set`/`config.apply`/`config.patch`) submitted config payload में refs के लिए active SecretRef resolution preflight करते हैं; unresolved active submitted refs write से पहले reject कर दिए जाते हैं.
    - Form saves, saved config से restore न हो सकने वाले stale redacted placeholders discard करते हैं, जबकि saved secrets से अभी भी map होने वाली redacted values preserve करते हैं.
    - Schema + form rendering (`config.schema` / `config.schema.lookup`, जिसमें field `title` / `description`, matched UI hints, immediate child summaries, nested object/wildcard/array/composition nodes पर docs metadata, और उपलब्ध होने पर plugin + channel schemas शामिल हैं); Raw JSON editor केवल तब उपलब्ध होता है जब snapshot में safe raw round-trip हो.
    - अगर snapshot raw text को safely round-trip नहीं कर सकता, तो Control UI उस snapshot के लिए Form mode force करता है और Raw mode disable करता है.
    - Raw JSON editor "Reset to saved", flattened snapshot re-render करने के बजाय raw-authored shape (formatting, comments, `$include` layout) preserve करता है, ताकि snapshot safely round-trip कर सके तो external edits reset के बाद भी बचें.
    - Structured SecretRef object values को form text inputs में read-only render किया जाता है ताकि accidental object-to-string corruption रोका जा सके.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status/health/models snapshots + event log + manual RPC calls (`status`, `health`, `models.list`).
    - event log में Control UI refresh/RPC timings, slow chat/config render timings, और long animation frames या long tasks के लिए browser responsiveness entries शामिल होती हैं, जब browser वे PerformanceObserver entry types expose करता है.
    - Logs: filter/export के साथ gateway file logs की live tail (`logs.tail`).
    - Update: restart report के साथ package/git update + restart चलाएं (`update.run`), फिर reconnect के बाद running gateway version verify करने के लिए `update.status` poll करें.

  </Accordion>
  <Accordion title="Cron jobs पैनल नोट्स">
    - अलग-थलग jobs के लिए, delivery डिफ़ॉल्ट रूप से announce summary होती है। यदि आप केवल-आंतरिक runs चाहते हैं, तो आप none पर स्विच कर सकते हैं।
    - announce चुने जाने पर Channel/target फ़ील्ड दिखाई देते हैं।
    - Webhook मोड `delivery.mode = "webhook"` का उपयोग करता है, जिसमें `delivery.to` को मान्य HTTP(S) webhook URL पर सेट किया जाता है।
    - main-session jobs के लिए, webhook और none delivery मोड उपलब्ध हैं।
    - उन्नत edit controls में delete-after-run, clear agent override, cron exact/stagger विकल्प, agent model/thinking overrides, और best-effort delivery toggles शामिल हैं।
    - Form validation field-level errors के साथ inline है; अमान्य मान save बटन को ठीक होने तक निष्क्रिय रखते हैं।
    - समर्पित bearer token भेजने के लिए `cron.webhookToken` सेट करें; यदि छोड़ा गया हो, तो webhook auth header के बिना भेजा जाता है।
    - अप्रचलित fallback: `cron.webhook` से स्पष्ट per-job webhook या completion delivery में `notify: true` वाले संग्रहित legacy jobs को माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।

  </Accordion>
</AccordionGroup>

## MCP पेज

समर्पित MCP पेज `mcp.servers` के अंतर्गत OpenClaw-प्रबंधित MCP servers के लिए operator view है। यह अपने आप MCP transports शुरू नहीं करता; सहेजे गए config का निरीक्षण और edit करने के लिए इसका उपयोग करें, फिर जब आपको live server proof की आवश्यकता हो तो `openclaw mcp doctor --probe` का उपयोग करें।

सामान्य workflow:

1. sidebar से **MCP** खोलें।
2. total, enabled, OAuth, और filtered server counts के लिए summary cards जाँचें।
3. transport, enablement, auth, filters, timeouts, और command hints के लिए प्रत्येक server row की समीक्षा करें।
4. जब किसी server को configured रहना चाहिए लेकिन runtime discovery से बाहर रखना हो, तो enablement toggle करें।
5. server definitions, headers, TLS/mTLS paths, OAuth metadata, tool filters, और Codex projection metadata के लिए scoped `mcp` config section edit करें।
6. config write के लिए **Save** का उपयोग करें, या जब running Gateway को बदला हुआ config लागू करना हो तो **Save & Publish** का उपयोग करें।
7. जब edited process को static diagnostics, live proof, या cached-runtime disposal की आवश्यकता हो, तो terminal से `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, या `openclaw mcp reload` चलाएँ।

पेज render करने से पहले credential-bearing URL-like values को redact करता है और command snippets में server names को quote करता है, ताकि copied commands spaces या shell metacharacters के साथ भी काम करें। पूरा CLI और config reference [MCP](/hi/cli/mcp) में है।

## Activity टैब

Activity टैब live tool activity के लिए ephemeral browser-local observer है। यह उसी Gateway `session.tool` / tool event stream से व्युत्पन्न है जो Chat tool cards को power करता है; यह कोई दूसरी Gateway event family, endpoint, durable activity store, metrics feed, या external observer stream नहीं जोड़ता।

Activity entries केवल sanitized summaries और redacted, truncated output previews रखती हैं। Tool argument values Activity state में store नहीं किए जाते; UI दिखाता है कि arguments hidden हैं और केवल argument field count record करता है। in-memory list वर्तमान browser tab का अनुसरण करती है, Control UI के भीतर navigation के दौरान बनी रहती है, और page reload, session switch, या **Clear** पर reset हो जाती है।

## Chat व्यवहार

<AccordionGroup>
  <Accordion title="भेजने और इतिहास के सिमैंटिक्स">
    - `chat.send` **नॉन-ब्लॉकिंग** है: यह तुरंत `{ runId, status: "started" }` के साथ ACK देता है और प्रतिक्रिया `chat` इवेंट्स के माध्यम से स्ट्रीम होती है। विश्वसनीय Control UI क्लाइंट्स को स्थानीय डायग्नॉस्टिक्स के लिए वैकल्पिक ACK टाइमिंग मेटाडेटा भी मिल सकता है।
    - चैट अपलोड इमेज और गैर-वीडियो फ़ाइलें स्वीकार करते हैं। इमेज मूल इमेज पथ रखती हैं; अन्य फ़ाइलें प्रबंधित मीडिया के रूप में संग्रहीत होती हैं और इतिहास में अटैचमेंट लिंक के रूप में दिखाई जाती हैं।
    - उसी `idempotencyKey` के साथ दोबारा भेजने पर, रनिंग के दौरान `{ status: "in_flight" }` और पूरा होने के बाद `{ status: "ok" }` लौटता है।
    - UI सुरक्षा के लिए `chat.history` प्रतिक्रियाएं आकार-सीमित होती हैं। जब ट्रांसक्रिप्ट प्रविष्टियां बहुत बड़ी होती हैं, Gateway लंबे टेक्स्ट फ़ील्ड को छोटा कर सकता है, भारी मेटाडेटा ब्लॉक छोड़ सकता है, और बहुत बड़े संदेशों को प्लेसहोल्डर (`[chat.history omitted: message too large]`) से बदल सकता है।
    - जब कोई दृश्यमान असिस्टेंट संदेश `chat.history` में छोटा किया गया हो, तो साइड रीडर मांग पर `sessionKey`, जरूरत होने पर सक्रिय `agentId`, और ट्रांसक्रिप्ट `messageId` के जरिए `chat.message.get` से पूर्ण प्रदर्शन-सामान्यीकृत ट्रांसक्रिप्ट प्रविष्टि ला सकता है। यदि Gateway फिर भी अधिक नहीं लौटा सकता, तो रीडर छोटे किए गए प्रीव्यू को चुपचाप दोहराने के बजाय स्पष्ट अनुपलब्ध अवस्था दिखाता है।
    - असिस्टेंट/जनरेट की गई इमेज प्रबंधित मीडिया रेफ़रेंस के रूप में स्थायी की जाती हैं और प्रमाणित Gateway मीडिया URLs के माध्यम से वापस सर्व की जाती हैं, इसलिए रीलोड कच्चे base64 इमेज पेलोड के चैट इतिहास प्रतिक्रिया में बने रहने पर निर्भर नहीं करते।
    - `chat.history` रेंडर करते समय, Control UI दृश्यमान असिस्टेंट टेक्स्ट से केवल-प्रदर्शन इनलाइन डायरेक्टिव टैग (उदाहरण के लिए `[[reply_to_*]]` और `[[audio_as_voice]]`), प्लेन-टेक्स्ट टूल-कॉल XML पेलोड (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और छोटे किए गए टूल-कॉल ब्लॉक शामिल हैं), और लीक हुए ASCII/फुल-विथ मॉडल कंट्रोल टोकन हटाता है, और उन असिस्टेंट प्रविष्टियों को छोड़ देता है जिनका पूरा दृश्यमान टेक्स्ट केवल ठीक-ठीक मौन टोकन `NO_REPLY` / `no_reply` या Heartbeat स्वीकृति टोकन `HEARTBEAT_OK` है।
    - सक्रिय भेजने और अंतिम इतिहास रिफ्रेश के दौरान, यदि `chat.history` थोड़ी देर के लिए पुराना स्नैपशॉट लौटाता है, तो चैट व्यू स्थानीय आशावादी यूज़र/असिस्टेंट संदेशों को दृश्यमान रखता है; Gateway इतिहास के बराबर आते ही canonical ट्रांसक्रिप्ट उन स्थानीय संदेशों को बदल देता है।
    - लाइव `chat` इवेंट्स डिलीवरी स्थिति हैं, जबकि `chat.history` टिकाऊ सेशन ट्रांसक्रिप्ट से फिर से बनाया जाता है। टूल-फाइनल इवेंट्स के बाद Control UI इतिहास रीलोड करता है और केवल एक छोटी आशावादी टेल मर्ज करता है; ट्रांसक्रिप्ट सीमा [WebChat](/hi/web/webchat) में दस्तावेजीकृत है।
    - `chat.inject` सेशन ट्रांसक्रिप्ट में एक असिस्टेंट नोट जोड़ता है और केवल-UI अपडेट के लिए `chat` इवेंट ब्रॉडकास्ट करता है (कोई एजेंट रन नहीं, कोई चैनल डिलीवरी नहीं)।
    - चैट हेडर सेशन पिकर से पहले एजेंट फ़िल्टर दिखाता है, और सेशन पिकर चुने गए एजेंट के दायरे में रहता है। एजेंट बदलने पर केवल उस एजेंट से जुड़े सेशन दिखते हैं और यदि उसके पास अभी तक कोई सहेजा गया डैशबोर्ड सेशन नहीं है, तो उस एजेंट के मुख्य सेशन पर fallback होता है।
    - डेस्कटॉप चौड़ाइयों पर, चैट कंट्रोल एक कॉम्पैक्ट पंक्ति में रहते हैं और ट्रांसक्रिप्ट में नीचे स्क्रोल करते समय collapse हो जाते हैं; ऊपर स्क्रोल करने, शीर्ष पर लौटने, या नीचे पहुंचने पर कंट्रोल फिर से दिखते हैं।
    - लगातार डुप्लिकेट केवल-टेक्स्ट संदेश एक गिनती बैज वाले एक बबल के रूप में रेंडर होते हैं। इमेज, अटैचमेंट, टूल आउटपुट, या कैनवास प्रीव्यू वाले संदेश collapse नहीं किए जाते।
    - चैट हेडर मॉडल और thinking पिकर `sessions.patch` के जरिए सक्रिय सेशन को तुरंत patch करते हैं; वे स्थायी सेशन overrides हैं, केवल एक-turn भेजने के विकल्प नहीं।
    - यदि आप उसी सेशन के लिए मॉडल पिकर परिवर्तन के अभी भी सेव होते समय संदेश भेजते हैं, तो composer `chat.send` कॉल करने से पहले उस सेशन patch की प्रतीक्षा करता है ताकि भेजना चुने गए मॉडल का उपयोग करे।
    - Control UI में `/new` टाइप करने से New Chat जैसा ही नया डैशबोर्ड सेशन बनता और उस पर स्विच होता है, सिवाय इसके कि जब `session.dmScope: "main"` कॉन्फ़िगर हो और वर्तमान parent एजेंट का मुख्य सेशन हो; उस स्थिति में यह मुख्य सेशन को वहीं reset करता है। `/reset` टाइप करने से वर्तमान सेशन के लिए Gateway का स्पष्ट in-place reset बना रहता है।
    - चैट मॉडल पिकर Gateway के कॉन्फ़िगर किए गए मॉडल व्यू का अनुरोध करता है। यदि `agents.defaults.models` मौजूद है, तो वही allowlist पिकर को चलाती है, जिसमें `provider/*` प्रविष्टियां भी शामिल हैं जो provider-scoped catalogs को dynamic रखती हैं। अन्यथा पिकर स्पष्ट `models.providers.*.models` प्रविष्टियां और usable auth वाले providers दिखाता है। पूरा catalog debug `models.list` RPC के माध्यम से `view: "all"` के साथ उपलब्ध रहता है।
    - जब ताज़ा Gateway सेशन usage रिपोर्ट में वर्तमान context tokens शामिल होते हैं, तो चैट composer क्षेत्र एक कॉम्पैक्ट context usage indicator दिखाता है। यह उच्च context pressure पर warning styling में बदलता है और, recommended compaction levels पर, एक कॉम्पैक्ट बटन दिखाता है जो सामान्य session compaction path चलाता है। पुराने token snapshots तब तक छिपाए जाते हैं जब तक Gateway फिर से fresh usage रिपोर्ट नहीं करता।

  </Accordion>
  <Accordion title="Talk मोड (ब्राउज़र रीयलटाइम)">
    Talk मोड एक registered realtime voice provider का उपयोग करता है। OpenAI को `talk.realtime.provider: "openai"` के साथ एक `openai` API-key auth profile, `talk.realtime.providers.openai.apiKey`, या `OPENAI_API_KEY` से कॉन्फ़िगर करें; OpenAI OAuth profiles Realtime voice कॉन्फ़िगर नहीं करते। Google को `talk.realtime.provider: "google"` के साथ `talk.realtime.providers.google.apiKey` से कॉन्फ़िगर करें। ब्राउज़र को कभी standard provider API key नहीं मिलती। OpenAI को WebRTC के लिए ephemeral Realtime client secret मिलता है। Google Live को browser WebSocket session के लिए one-use constrained Live API auth token मिलता है, जिसमें निर्देश और tool declarations Gateway द्वारा token में locked होते हैं। जो providers केवल backend realtime bridge expose करते हैं, वे Gateway relay transport के जरिए चलते हैं, इसलिए credentials और vendor sockets server-side रहते हैं जबकि browser audio authenticated Gateway RPCs से गुजरता है। Realtime session prompt Gateway द्वारा assembled होता है; `talk.client.create` caller-provided instruction overrides स्वीकार नहीं करता।

    Chat composer में Talk start/stop button के बगल में Talk options button होता है। विकल्प अगले Talk session पर लागू होते हैं और provider, transport, model, voice, reasoning effort, VAD threshold, silence duration, और prefix padding override कर सकते हैं। जब कोई विकल्प blank हो, तो Gateway उपलब्ध होने पर configured defaults या provider default का उपयोग करता है। Gateway relay चुनने से backend relay path force होता है; WebRTC चुनने से session client-owned रहता है और यदि provider browser session नहीं बना सकता, तो relay पर चुपचाप fallback करने के बजाय fail होता है।

    Chat composer में, Talk control microphone dictation button के बगल का waves button है। जब Talk शुरू होता है, composer status row पहले `Connecting Talk...`, फिर audio connected होने पर `Talk live`, या realtime tool call द्वारा configured larger model से `talk.client.toolCall` के जरिए परामर्श करते समय `Asking OpenClaw...` दिखाती है।

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` OpenAI backend WebSocket bridge, OpenAI browser WebRTC SDP exchange, Google Live constrained-token browser WebSocket setup, और fake microphone media के साथ Gateway relay browser adapter verify करता है। कमांड केवल provider status print करता है और secrets log नहीं करता।

  </Accordion>
  <Accordion title="रोकना और abort करना">
    - **Stop** पर क्लिक करें (`chat.abort` कॉल करता है)।
    - जब कोई run सक्रिय हो, सामान्य follow-ups queue होते हैं। queued संदेश पर **Steer** क्लिक करके उस follow-up को running turn में inject करें।
    - out-of-band abort करने के लिए `/stop` टाइप करें (या standalone abort phrases जैसे `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`)।
    - `chat.abort` उस session के सभी active runs abort करने के लिए `{ sessionKey }` (कोई `runId` नहीं) support करता है।

  </Accordion>
  <Accordion title="Abort partial retention">
    - जब कोई run abort होता है, partial assistant text फिर भी UI में दिखाया जा सकता है।
    - buffered output मौजूद होने पर Gateway aborted partial assistant text को transcript history में persist करता है।
    - Persisted entries में abort metadata शामिल होता है ताकि transcript consumers abort partials को normal completion output से अलग पहचान सकें।

  </Accordion>
</AccordionGroup>

## PWA install और web push

Control UI एक `manifest.webmanifest` और service worker के साथ आता है, इसलिए modern browsers इसे standalone PWA के रूप में install कर सकते हैं। Web Push Gateway को notifications के साथ installed PWA को wake करने देता है, तब भी जब tab या browser window खुली न हो।

यदि OpenClaw update के तुरंत बाद page **Protocol mismatch** दिखाता है, तो पहले `openclaw dashboard` के साथ dashboard फिर से खोलें और page को hard-refresh करें। यदि फिर भी fail हो, तो dashboard origin के लिए site data clear करें या private browser window में test करें; पुराना tab या browser service-worker cache नए Gateway के सामने pre-update Control UI bundle चलाता रह सकता है।

| सतह                                                  | यह क्या करता है                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest. पहुँच योग्य होने पर ब्राउज़र "ऐप इंस्टॉल करें" का विकल्प देते हैं। |
| `ui/public/sw.js`                                     | Service worker जो `push` ईवेंट और notification क्लिक संभालता है। |
| `push/vapid-keys.json` (OpenClaw state dir के अंतर्गत) | Web Push payloads पर हस्ताक्षर करने के लिए उपयोग की जाने वाली स्वतः-जनरेट की गई VAPID keypair। |
| `push/web-push-subscriptions.json`                    | स्थायी रूप से सहेजे गए browser subscription endpoints।             |

जब आप keys को स्थिर रखना चाहते हैं (multi-host deployments, secrets rotation, या tests के लिए), Gateway process पर env vars के माध्यम से VAPID keypair override करें:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (डिफ़ॉल्ट `https://openclaw.ai` है)

Control UI browser subscriptions को register और test करने के लिए इन scope-gated Gateway methods का उपयोग करता है:

- `push.web.vapidPublicKey` — सक्रिय VAPID public key fetch करता है।
- `push.web.subscribe` — `endpoint` और `keys.p256dh`/`keys.auth` register करता है।
- `push.web.unsubscribe` — registered endpoint हटाता है।
- `push.web.test` — caller के subscription को test notification भेजता है।

<Note>
Web Push, iOS APNS relay path (relay-backed push के लिए [कॉन्फ़िगरेशन](/hi/gateway/configuration) देखें) और मौजूदा `push.test` method से स्वतंत्र है, जो native mobile pairing को target करते हैं।
</Note>

## Hosted embeds

Assistant messages `[embed ...]` shortcode के साथ hosted web content को inline render कर सकते हैं। iframe sandbox policy `gateway.controlUi.embedSandbox` द्वारा नियंत्रित होती है:

<Tabs>
  <Tab title="strict">
    hosted embeds के अंदर script execution disabled करता है।
  </Tab>
  <Tab title="scripts (default)">
    origin isolation बनाए रखते हुए interactive embeds की अनुमति देता है; यह default है और आमतौर पर self-contained browser games/widgets के लिए पर्याप्त होता है।
  </Tab>
  <Tab title="trusted">
    same-site documents के लिए `allow-scripts` के ऊपर `allow-same-origin` जोड़ता है, जिन्हें जानबूझकर अधिक मजबूत privileges चाहिए।
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
`trusted` का उपयोग केवल तब करें जब embedded document को सचमुच same-origin behavior की आवश्यकता हो। अधिकांश agent-generated games और interactive canvases के लिए, `scripts` अधिक सुरक्षित विकल्प है।
</Warning>

Absolute external `http(s)` embed URLs default रूप से blocked रहते हैं। यदि आप जानबूझकर `[embed url="https://..."]` को third-party pages load करने देना चाहते हैं, तो `gateway.controlUi.allowExternalEmbedUrls: true` set करें।

## Chat message width

Grouped chat messages पढ़ने योग्य default max-width का उपयोग करते हैं। Wide-monitor deployments bundled CSS को patch किए बिना `gateway.controlUi.chatMessageMaxWidth` set करके इसे override कर सकते हैं:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

यह value browser तक पहुँचने से पहले validate की जाती है। Supported values में plain lengths और percentages जैसे `960px` या `82%`, साथ ही constrained `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, और `fit-content(...)` width expressions शामिल हैं।

## Tailnet access (recommended)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway को loopback पर रखें और Tailscale Serve को HTTPS के साथ उसका proxy करने दें:

    ```bash
    openclaw gateway --tailscale serve
    ```

    खोलें:

    - `https://<magicdns>/` (या आपका configured `gateway.controlUi.basePath`)

    Default रूप से, जब `gateway.auth.allowTailscale` `true` होता है, Control UI/WebSocket Serve requests Tailscale identity headers (`tailscale-user-login`) के माध्यम से authenticate कर सकते हैं। OpenClaw `x-forwarded-for` address को `tailscale whois` से resolve करके और उसे header से match करके identity verify करता है, और इन्हें केवल तब accept करता है जब request loopback पर Tailscale के `x-forwarded-*` headers के साथ आती है। Browser device identity वाले Control UI operator sessions के लिए, यह verified Serve path device-pairing round trip को भी skip करता है; device-less browsers और node-role connections अभी भी सामान्य device checks का पालन करते हैं। यदि आप Serve traffic के लिए भी explicit shared-secret credentials आवश्यक करना चाहते हैं, तो `gateway.auth.allowTailscale: false` set करें। फिर `gateway.auth.mode: "token"` या `"password"` का उपयोग करें।

    उस async Serve identity path के लिए, समान client IP और auth scope की failed auth attempts rate-limit writes से पहले serialized की जाती हैं। इसलिए समान browser से concurrent bad retries दूसरे request पर parallel में race करती हुई दो plain mismatches के बजाय `retry later` दिखा सकती हैं।

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

    Matching shared secret को UI settings में paste करें (`connect.params.auth.token` या `connect.params.auth.password` के रूप में भेजा जाता है)।

  </Tab>
</Tabs>

## Insecure HTTP

यदि आप dashboard को plain HTTP (`http://<lan-ip>` या `http://<tailscale-ip>`) पर खोलते हैं, तो browser **non-secure context** में चलता है और WebCrypto को block करता है। Default रूप से, OpenClaw device identity के बिना Control UI connections को **block** करता है।

Documented exceptions:

- `gateway.controlUi.allowInsecureAuth=true` के साथ localhost-only insecure HTTP compatibility
- `gateway.auth.mode: "trusted-proxy"` के माध्यम से सफल operator Control UI auth
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Recommended fix:** HTTPS (Tailscale Serve) का उपयोग करें या UI को locally खोलें:

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

    - यह non-secure HTTP contexts में localhost Control UI sessions को device identity के बिना आगे बढ़ने देता है।
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
    `dangerouslyDisableDeviceAuth` Control UI device identity checks को disable करता है और यह गंभीर security downgrade है। Emergency use के बाद जल्दी revert करें।
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - सफल trusted-proxy auth **operator** Control UI sessions को device identity के बिना admit कर सकता है।
    - यह node-role Control UI sessions तक extend **नहीं** होता।
    - Same-host loopback reverse proxies अभी भी trusted-proxy auth satisfy नहीं करते; [Trusted proxy auth](/hi/gateway/trusted-proxy-auth) देखें।

  </Accordion>
</AccordionGroup>

HTTPS setup guidance के लिए [Tailscale](/hi/gateway/tailscale) देखें।

## Content security policy

Control UI एक tight `img-src` policy के साथ ship होता है: केवल **same-origin** assets, `data:` URLs, और locally generated `blob:` URLs allowed हैं। Remote `http(s)` और protocol-relative image URLs browser द्वारा rejected होते हैं और network fetches issue नहीं करते।

व्यवहार में इसका अर्थ:

- Relative paths के अंतर्गत served avatars और images (उदाहरण के लिए `/avatars/<id>`) अभी भी render होते हैं, authenticated avatar routes सहित जिन्हें UI fetch करता है और local `blob:` URLs में convert करता है।
- Inline `data:image/...` URLs अभी भी render होते हैं (in-protocol payloads के लिए उपयोगी)।
- Control UI द्वारा बनाए गए local `blob:` URLs अभी भी render होते हैं।
- Channel metadata द्वारा emitted remote avatar URLs Control UI के avatar helpers पर stripped होते हैं और built-in logo/badge से replaced होते हैं, इसलिए compromised या malicious channel operator browser से arbitrary remote image fetches force नहीं कर सकता।

इस behavior को पाने के लिए आपको कुछ भी change करने की आवश्यकता नहीं है — यह हमेशा on रहता है और configurable नहीं है।

## Avatar route auth

जब gateway auth configured होता है, Control UI avatar endpoint को API के बाकी हिस्से जैसा ही gateway token चाहिए:

- `GET /avatar/<agentId>` केवल authenticated callers को avatar image return करता है। `GET /avatar/<agentId>?meta=1` उसी rule के अंतर्गत avatar metadata return करता है।
- किसी भी route पर unauthenticated requests rejected होते हैं (sibling assistant-media route से match करते हुए)। यह avatar route को उन hosts पर agent identity leak करने से रोकता है जो अन्यथा protected हैं।
- Control UI स्वयं avatars fetch करते समय gateway token को bearer header के रूप में forward करता है, और authenticated blob URLs का उपयोग करता है ताकि image dashboards में अभी भी render हो।

यदि आप gateway auth disable करते हैं (shared hosts पर recommended नहीं), तो gateway के बाकी हिस्से की तरह avatar route भी unauthenticated हो जाता है।

## Assistant media route auth

जब gateway auth configured होता है, assistant local-media previews two-step route का उपयोग करते हैं:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` को normal Control UI operator auth चाहिए। Availability check करते समय browser gateway token को bearer header के रूप में भेजता है।
- Successful metadata responses में उस exact source path तक scoped short-lived `mediaTicket` शामिल होता है।
- Browser-rendered image, audio, video, और document URLs active gateway token या password के बजाय `mediaTicket=<ticket>` का उपयोग करते हैं। Ticket जल्दी expire हो जाता है और किसी different source को authorize नहीं कर सकता।

यह browser-native media elements के साथ normal media rendering को compatible रखता है, बिना reusable gateway credentials को visible media URLs में डालने के।

## Building the UI

Gateway `dist/control-ui` से static files serve करता है। इन्हें इससे build करें:

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

## Blank Control UI page

यदि browser blank dashboard load करता है और DevTools कोई उपयोगी error नहीं दिखाता, तो किसी extension या early content script ने JavaScript module app को evaluate होने से रोका हो सकता है। Static page में plain HTML recovery panel शामिल है जो startup के बाद `<openclaw-app>` registered न होने पर दिखाई देता है।

Browser environment बदलने के बाद panel की **Try again** action का उपयोग करें, या इन checks के बाद manually reload करें:

- उन extensions को disable करें जो सभी pages में inject करते हैं, विशेषकर `<all_urls>` content scripts वाली extensions।
- Private window, clean browser profile, या कोई दूसरा browser आज़माएँ।
- Gateway running रखें और browser change के बाद वही dashboard URL verify करें।

## Debugging/testing: dev server + remote Gateway

Control UI static files है; WebSocket target configurable है और HTTP origin से अलग हो सकता है। यह तब उपयोगी है जब आप Vite dev server locally चाहते हैं लेकिन Gateway कहीं और run होता है।

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

    Optional one-time auth (यदि आवश्यक हो):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` लोड होने के बाद localStorage में संग्रहीत किया जाता है और URL से हटा दिया जाता है।
    - यदि आप `gatewayUrl` के माध्यम से पूरा `ws://` या `wss://` endpoint पास करते हैं, तो `gatewayUrl` मान को URL-encode करें ताकि ब्राउज़र query string को सही ढंग से पार्स करे।
    - जब भी संभव हो, `token` को URL fragment (`#token=...`) के माध्यम से पास किया जाना चाहिए। Fragments सर्वर को नहीं भेजे जाते, जिससे request-log और Referer leakage से बचा जाता है। Legacy `?token=` query params अभी भी compatibility के लिए एक बार imported होते हैं, लेकिन केवल fallback के रूप में, और bootstrap के तुरंत बाद हटा दिए जाते हैं।
    - `password` केवल memory में रखा जाता है।
    - जब `gatewayUrl` सेट होता है, तो UI config या environment credentials पर fallback नहीं करता। `token` (या `password`) स्पष्ट रूप से प्रदान करें। स्पष्ट credentials का न होना एक error है।
    - जब Gateway TLS (Tailscale Serve, HTTPS proxy, आदि) के पीछे हो, तो `wss://` का उपयोग करें।
    - clickjacking रोकने के लिए `gatewayUrl` केवल top-level window (embedded नहीं) में स्वीकार किया जाता है।
    - सार्वजनिक non-loopback Control UI deployments को `gateway.controlUi.allowedOrigins` स्पष्ट रूप से सेट करना होगा (पूर्ण origins)। loopback, RFC1918/link-local, `.local`, `.ts.net`, या Tailscale CGNAT hosts से private same-origin LAN/Tailnet loads Host-header fallback सक्षम किए बिना स्वीकार किए जाते हैं।
    - Gateway startup effective runtime bind और port से `http://localhost:<port>` और `http://127.0.0.1:<port>` जैसे local origins seed कर सकता है, लेकिन remote browser origins को अभी भी स्पष्ट entries चाहिए।
    - कड़े नियंत्रण वाले local testing को छोड़कर `gateway.controlUi.allowedOrigins: ["*"]` का उपयोग न करें। इसका अर्थ है किसी भी browser origin को allow करना, न कि "मैं जो भी host उपयोग कर रहा हूं उससे match करें।"
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` Host-header origin fallback mode सक्षम करता है, लेकिन यह एक खतरनाक security mode है।

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
