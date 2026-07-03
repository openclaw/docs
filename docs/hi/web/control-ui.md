---
read_when:
    - आप Gateway को ब्राउज़र से संचालित करना चाहते हैं
    - आप SSH टनल के बिना Tailnet एक्सेस चाहते हैं
sidebarTitle: Control UI
summary: Gateway के लिए ब्राउज़र-आधारित नियंत्रण UI (चैट, गतिविधि, नोड्स, कॉन्फ़िगरेशन)
title: नियंत्रण उपयोगकर्ता इंटरफ़ेस
x-i18n:
    generated_at: "2026-07-03T09:39:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI Gateway द्वारा परोसा जाने वाला एक छोटा **Vite + Lit** सिंगल-पेज ऐप है:

- डिफ़ॉल्ट: `http://<host>:18789/`
- वैकल्पिक प्रीफ़िक्स: `gateway.controlUi.basePath` सेट करें (जैसे `/openclaw`)

यह उसी पोर्ट पर **सीधे Gateway WebSocket से** बात करता है।

## तुरंत खोलें (स्थानीय)

अगर Gateway उसी कंप्यूटर पर चल रहा है, तो खोलें:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (या [http://localhost:18789/](http://localhost:18789/))

अगर पेज लोड नहीं होता, तो पहले Gateway शुरू करें: `openclaw gateway`.

<Note>
नेटिव Windows LAN बाइंड पर, Windows Firewall या संगठन-प्रबंधित Group Policy अभी भी विज्ञापित LAN URL को ब्लॉक कर सकती है, भले ही Gateway होस्ट पर `127.0.0.1` काम करे। Windows होस्ट पर `openclaw gateway status --deep` चलाएँ; यह संभावित रूप से ब्लॉक किए गए पोर्ट, प्रोफ़ाइल बेमेल, और स्थानीय फ़ायरवॉल नियमों की रिपोर्ट करता है जिन्हें नीति अनदेखा कर सकती है।
</Note>

Auth WebSocket हैंडशेक के दौरान इनके ज़रिए दिया जाता है:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Tailscale Serve पहचान हेडर, जब `gateway.auth.allowTailscale: true`
- विश्वसनीय-प्रॉक्सी पहचान हेडर, जब `gateway.auth.mode: "trusted-proxy"`

डैशबोर्ड सेटिंग्स पैनल मौजूदा ब्राउज़र टैब सत्र और चुने गए Gateway URL के लिए एक टोकन रखता है; पासवर्ड सहेजे नहीं जाते। ऑनबोर्डिंग आमतौर पर पहले कनेक्ट पर साझा-सीक्रेट auth के लिए Gateway टोकन बनाती है, लेकिन जब `gateway.auth.mode` `"password"` हो तो पासवर्ड auth भी काम करता है।

## डिवाइस पेयरिंग (पहला कनेक्शन)

जब आप किसी नए ब्राउज़र या डिवाइस से Control UI से कनेक्ट करते हैं, तो Gateway आमतौर पर **एक-बार की पेयरिंग स्वीकृति** मांगता है। यह अनधिकृत पहुँच रोकने के लिए सुरक्षा उपाय है।

**आपको यह दिखेगा:** "disconnected (1008): pairing required"

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

अगर ब्राउज़र बदले हुए auth विवरणों (role/scopes/public key) के साथ पेयरिंग फिर से आज़माता है, तो पिछला लंबित अनुरोध प्रतिस्थापित हो जाता है और नया `requestId` बनाया जाता है। स्वीकृति से पहले `openclaw devices list` फिर चलाएँ।

अगर ब्राउज़र पहले से पेयर है और आप उसे read पहुँच से write/admin पहुँच में बदलते हैं, तो इसे स्वीकृति अपग्रेड माना जाता है, मौन रीकनेक्ट नहीं। OpenClaw पुरानी स्वीकृति सक्रिय रखता है, व्यापक रीकनेक्ट को ब्लॉक करता है, और आपसे नए scope सेट को स्पष्ट रूप से स्वीकृत करने को कहता है।

स्वीकृत होने के बाद, डिवाइस याद रखा जाता है और तब तक फिर से स्वीकृति नहीं माँगेगा जब तक आप उसे `openclaw devices revoke --device <id> --role <role>` से रद्द नहीं करते। टोकन रोटेशन और रद्दीकरण के लिए [डिवाइस CLI](/hi/cli/devices) देखें।

`openclaw_gateway` एडाप्टर से कनेक्ट करने वाले Paperclip एजेंट वही पहली-बार स्वीकृति प्रवाह इस्तेमाल करते हैं। शुरुआती कनेक्शन प्रयास के बाद, लंबित अनुरोध का पूर्वावलोकन करने के लिए `openclaw devices approve --latest` चलाएँ, फिर उसे स्वीकृत करने के लिए छपा हुआ `openclaw devices approve <requestId>` कमांड दोबारा चलाएँ। रिमोट Gateway के लिए स्पष्ट `--url` और `--token` मान पास करें। रीस्टार्ट के बीच स्वीकृतियाँ स्थिर रखने के लिए, हर रन पर नई अस्थायी डिवाइस पहचान बनवाने के बजाय Paperclip में स्थायी `adapterConfig.devicePrivateKeyPem` कॉन्फ़िगर करें।

<Note>
- सीधे local loopback ब्राउज़र कनेक्शन (`127.0.0.1` / `localhost`) अपने आप स्वीकृत हो जाते हैं।
- Tailscale Serve Control UI ऑपरेटर सत्रों के लिए पेयरिंग राउंड ट्रिप छोड़ सकता है जब `gateway.auth.allowTailscale: true` हो, Tailscale पहचान सत्यापित हो, और ब्राउज़र अपनी डिवाइस पहचान प्रस्तुत करे।
- सीधे Tailnet बाइंड, LAN ब्राउज़र कनेक्ट, और बिना डिवाइस पहचान वाले ब्राउज़र प्रोफ़ाइल अभी भी स्पष्ट स्वीकृति मांगते हैं।
- हर ब्राउज़र प्रोफ़ाइल एक अद्वितीय डिवाइस ID बनाती है, इसलिए ब्राउज़र बदलने या ब्राउज़र डेटा साफ़ करने पर फिर से पेयरिंग करनी होगी।

</Note>

## व्यक्तिगत पहचान (ब्राउज़र-स्थानीय)

Control UI हर ब्राउज़र के लिए एक व्यक्तिगत पहचान (डिस्प्ले नाम और अवतार) का समर्थन करता है, जिसे साझा सत्रों में श्रेय देने के लिए आउटगोइंग संदेशों से जोड़ा जाता है। यह ब्राउज़र स्टोरेज में रहती है, मौजूदा ब्राउज़र प्रोफ़ाइल तक सीमित होती है, और आपके वास्तविक रूप से भेजे गए संदेशों पर सामान्य ट्रांसक्रिप्ट लेखकत्व मेटाडेटा से आगे अन्य डिवाइसों पर सिंक या सर्वर-साइड सहेजी नहीं जाती। साइट डेटा साफ़ करने या ब्राउज़र बदलने पर यह खाली हो जाती है।

यही ब्राउज़र-स्थानीय पैटर्न असिस्टेंट अवतार ओवरराइड पर लागू होता है। अपलोड किए गए असिस्टेंट अवतार स्थानीय ब्राउज़र में ही Gateway-रिज़ॉल्व की गई पहचान पर ओवरले होते हैं और कभी भी `config.patch` के ज़रिए राउंड-ट्रिप नहीं करते। साझा `ui.assistant.avatar` कॉन्फ़िग फ़ील्ड अभी भी उन non-UI क्लाइंट के लिए उपलब्ध है जो फ़ील्ड को सीधे लिखते हैं (जैसे स्क्रिप्टेड Gateway या कस्टम डैशबोर्ड)।

## रनटाइम कॉन्फ़िग एंडपॉइंट

Control UI अपनी रनटाइम सेटिंग्स `/control-ui-config.json` से लाता है, जिसे Gateway के Control UI बेस पाथ के सापेक्ष रिज़ॉल्व किया जाता है (उदाहरण के लिए `/__openclaw__/control-ui-config.json` जब UI `/__openclaw__/` के तहत परोसा जाता है)। यह एंडपॉइंट बाकी HTTP सतह की तरह उसी Gateway auth से सुरक्षित है: अनधिकृत ब्राउज़र इसे ला नहीं सकते, और सफल fetch के लिए या तो पहले से वैध Gateway टोकन/पासवर्ड, Tailscale Serve पहचान, या विश्वसनीय-प्रॉक्सी पहचान चाहिए।

## भाषा समर्थन

Control UI पहली बार लोड होने पर आपके ब्राउज़र locale के आधार पर खुद को स्थानीयकृत कर सकता है। बाद में इसे ओवरराइड करने के लिए **Overview -> Gateway Access -> Language** खोलें। locale पिकर Gateway Access कार्ड में रहता है, Appearance के तहत नहीं।

- समर्थित locale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- गैर-अंग्रेज़ी अनुवाद ब्राउज़र में lazy-loaded होते हैं।
- चुना गया locale ब्राउज़र स्टोरेज में सहेजा जाता है और भविष्य की विज़िट में फिर इस्तेमाल होता है।
- गुम अनुवाद कुंजियाँ अंग्रेज़ी पर वापस चली जाती हैं।

Docs अनुवाद उसी गैर-अंग्रेज़ी locale सेट के लिए बनाए जाते हैं, लेकिन docs साइट का अंतर्निहित Mintlify भाषा पिकर उन locale कोड तक सीमित है जिन्हें Mintlify स्वीकार करता है। Thai (`th`) और Persian (`fa`) docs अभी भी publish repo में बनाए जाते हैं; वे उस पिकर में तब तक दिखाई नहीं दे सकते जब तक Mintlify उन कोड का समर्थन न करे।

## Appearance थीम

Appearance पैनल अंतर्निहित Claw, Knot, और Dash थीम, साथ ही एक ब्राउज़र-स्थानीय tweakcn import स्लॉट रखता है। थीम import करने के लिए, [tweakcn editor](https://tweakcn.com/editor/theme) खोलें, कोई थीम चुनें या बनाएँ, **Share** क्लिक करें, और कॉपी किया गया थीम लिंक Appearance में पेस्ट करें। importer `https://tweakcn.com/r/themes/<id>` रजिस्ट्री URL, `https://tweakcn.com/editor/theme?theme=amethyst-haze` जैसे editor URL, सापेक्ष `/themes/<id>` पाथ, कच्चे theme ID, और `amethyst-haze` जैसे डिफ़ॉल्ट theme नाम भी स्वीकार करता है।

Appearance में एक ब्राउज़र-स्थानीय Text size सेटिंग भी शामिल है। सेटिंग बाकी Control UI प्राथमिकताओं के साथ सहेजी जाती है, chat टेक्स्ट, composer टेक्स्ट, tool कार्ड, और chat साइडबार पर लागू होती है, और टेक्स्ट इनपुट को कम से कम 16px रखती है ताकि mobile Safari focus पर auto-zoom न करे।

Import की गई थीम केवल मौजूदा ब्राउज़र प्रोफ़ाइल में सहेजी जाती हैं। वे Gateway कॉन्फ़िग में नहीं लिखी जातीं और डिवाइसों के बीच सिंक नहीं होतीं। Import की गई थीम को बदलना उसी एक स्थानीय स्लॉट को अपडेट करता है; उसे साफ़ करने पर सक्रिय थीम वापस Claw पर चली जाती है, अगर import की गई थीम चुनी गई थी।

## यह क्या कर सकता है (आज)

<AccordionGroup>
  <Accordion title="Chat और Talk">
    - Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`) के ज़रिए मॉडल से chat करें।
    - Chat इतिहास रीफ़्रेश प्रति-संदेश टेक्स्ट सीमा के साथ एक सीमित हालिया विंडो मांगते हैं ताकि बड़े सत्र chat उपयोगी बनने से पहले ब्राउज़र को पूरा ट्रांसक्रिप्ट payload render करने पर मजबूर न करें।
    - ब्राउज़र realtime सत्रों से talk करें। OpenAI direct WebRTC इस्तेमाल करता है, Google Live WebSocket पर सीमित one-use ब्राउज़र टोकन इस्तेमाल करता है, और backend-only realtime voice plugins Gateway relay transport इस्तेमाल करते हैं। क्लाइंट-स्वामित्व वाले provider सत्र `talk.client.create` से शुरू होते हैं; Gateway relay सत्र `talk.session.create` से शुरू होते हैं। relay provider credentials को Gateway पर रखता है जबकि ब्राउज़र `talk.session.appendAudio` के ज़रिए microphone PCM stream करता है, Gateway नीति और बड़े कॉन्फ़िगर किए गए OpenClaw मॉडल के लिए `talk.client.toolCall` के ज़रिए `openclaw_agent_consult` provider tool calls को forward करता है, और active-run voice steering को `talk.client.steer` या `talk.session.steer` के ज़रिए route करता है।
    - Chat में tool calls + live tool output cards stream करें (agent events)।
    - मौजूदा `session.tool` / tool event delivery से live tool activity के ब्राउज़र-स्थानीय, redaction-first सारांशों वाला Activity tab।

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: built-in और bundled/external plugin channels status, QR login, और per-channel config (`channels.status`, `web.login.*`, `config.patch`)।
    - Channel probe रीफ़्रेश पिछले snapshot को visible रखते हैं जबकि धीमे provider checks पूरे होते हैं, और probe या audit अपने UI budget से अधिक होने पर partial snapshots को label किया जाता है।
    - Instances: presence list + refresh (`system-presence`)।
    - Sessions: डिफ़ॉल्ट रूप से configured-agent sessions सूचीबद्ध करें, stale unconfigured agent session keys से fallback करें, और per-session model/thinking/fast/verbose/trace/reasoning overrides लागू करें (`sessions.list`, `sessions.patch`)।
    - Dreams: Dreaming status, enable/disable toggle, और Dream Diary reader (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)।

  </Accordion>
  <Accordion title="Cron, Skills, Node, exec approvals">
    - Cron jobs: list/add/edit/run/enable/disable + run history (`cron.*`)।
    - Skills: status, enable/disable, install, API key updates (`skills.*`)।
    - Node: list + caps (`node.list`)।
    - Exec approvals: `exec host=gateway/node` के लिए gateway या node allowlists + ask policy edit करें (`exec.approvals.*`)।

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` देखें/edit करें (`config.get`, `config.set`)।
    - MCP के पास configured servers, enablement, OAuth/filter/parallel summaries, सामान्य operator commands, और scoped `mcp` config editor के लिए dedicated settings page है।
    - validation के साथ apply + restart करें (`config.apply`) और last active session को wake करें।
    - Writes में concurrent edits को clobber होने से रोकने के लिए base-hash guard शामिल है।
    - Writes (`config.set`/`config.apply`/`config.patch`) submitted config payload में refs के लिए active SecretRef resolution की preflight करते हैं; unresolved active submitted refs write से पहले reject कर दिए जाते हैं।
    - Form saves stale redacted placeholders को discard करते हैं जिन्हें saved config से restore नहीं किया जा सकता, जबकि वे redacted values preserve करते हैं जो अभी भी saved secrets से map होती हैं।
    - Schema + form rendering (`config.schema` / `config.schema.lookup`, जिसमें field `title` / `description`, matched UI hints, immediate child summaries, nested object/wildcard/array/composition nodes पर docs metadata, साथ ही उपलब्ध होने पर plugin + channel schemas शामिल हैं); Raw JSON editor केवल तब उपलब्ध होता है जब snapshot में safe raw round-trip हो।
    - अगर कोई snapshot raw text को सुरक्षित रूप से round-trip नहीं कर सकता, तो Control UI उस snapshot के लिए Form mode को force करता है और Raw mode को disable कर देता है।
    - Raw JSON editor "Reset to saved" flattened snapshot को फिर से render करने के बजाय raw-authored shape (formatting, comments, `$include` layout) को preserve करता है, ताकि snapshot सुरक्षित रूप से round-trip कर सके तो external edits reset के बाद भी बचें।
    - Structured SecretRef object values को form text inputs में read-only render किया जाता है ताकि accidental object-to-string corruption रोकी जा सके।

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status/health/models snapshots + event log + manual RPC calls (`status`, `health`, `models.list`)।
    - event log में Control UI refresh/RPC timings, slow chat/config render timings, और browser responsiveness entries शामिल होती हैं, long animation frames या long tasks के लिए जब browser वे PerformanceObserver entry types expose करता है।
    - Logs: filter/export के साथ gateway file logs की live tail (`logs.tail`)।
    - Update: restart report के साथ package/git update + restart चलाएँ (`update.run`), फिर reconnect के बाद running gateway version verify करने के लिए `update.status` poll करें।

  </Accordion>
  <Accordion title="Cron जॉब्स पैनल नोट्स">
    - अलग-थलग जॉब्स के लिए, डिलीवरी डिफ़ॉल्ट रूप से सारांश घोषित करने पर रहती है। यदि आप केवल-आंतरिक रन चाहते हैं, तो आप इसे none पर बदल सकते हैं।
    - announce चुने जाने पर Channel/target फ़ील्ड दिखाई देते हैं।
    - Webhook मोड `delivery.mode = "webhook"` का उपयोग करता है, जिसमें `delivery.to` को किसी मान्य HTTP(S) Webhook URL पर सेट किया जाता है।
    - main-session जॉब्स के लिए, Webhook और none डिलीवरी मोड उपलब्ध हैं।
    - उन्नत संपादन नियंत्रणों में delete-after-run, clear agent override, Cron exact/stagger विकल्प, एजेंट मॉडल/thinking overrides, और best-effort delivery toggles शामिल हैं।
    - फ़ॉर्म सत्यापन फ़ील्ड-स्तरीय त्रुटियों के साथ inline है; अमान्य मान ठीक होने तक save बटन को अक्षम रखते हैं।
    - समर्पित bearer token भेजने के लिए `cron.webhookToken` सेट करें; यदि छोड़ा गया हो, तो Webhook auth header के बिना भेजा जाता है।
    - अप्रचलित fallback: `cron.webhook` से स्पष्ट प्रति-जॉब Webhook या completion delivery में `notify: true` वाले संग्रहीत legacy jobs माइग्रेट करने के लिए `openclaw doctor --fix` चलाएँ।

  </Accordion>
</AccordionGroup>

## MCP पेज

समर्पित MCP पेज `mcp.servers` के तहत OpenClaw-प्रबंधित MCP सर्वरों के लिए operator view है। यह स्वयं MCP transports शुरू नहीं करता; सहेजे गए config का निरीक्षण और संपादन करने के लिए इसका उपयोग करें, फिर जब आपको live server proof चाहिए हो तो `openclaw mcp doctor --probe` का उपयोग करें।

सामान्य workflow:

1. sidebar से **MCP** खोलें।
2. total, enabled, OAuth, और filtered server counts के लिए summary cards जाँचें।
3. transport, enablement, auth, filters, timeouts, और command hints के लिए प्रत्येक server row की समीक्षा करें।
4. जब किसी server को configured रखना हो लेकिन runtime discovery से बाहर रखना हो, तो enablement toggle करें।
5. server definitions, headers, TLS/mTLS paths, OAuth metadata, tool filters, और Codex projection metadata के लिए scoped `mcp` config section संपादित करें।
6. config write के लिए **Save** का उपयोग करें, या जब running Gateway को बदला हुआ config लागू करना हो तो **Save & Publish** का उपयोग करें।
7. जब संपादित process को static diagnostics, live proof, या cached-runtime disposal चाहिए हो, तो terminal से `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, या `openclaw mcp reload` चलाएँ।

पेज credential-bearing URL-जैसे मानों को render करने से पहले redact करता है और command snippets में server names को quote करता है, ताकि copy किए गए commands spaces या shell metacharacters के साथ भी काम करें। पूरा CLI और config reference [MCP](/hi/cli/mcp) में है।

## Activity टैब

Activity टैब live tool activity के लिए ephemeral browser-local observer है। यह उसी Gateway `session.tool` / tool event stream से निकला है जो Chat tool cards को चलाता है; यह कोई और Gateway event family, endpoint, durable activity store, metrics feed, या external observer stream नहीं जोड़ता।

Activity entries केवल sanitized summaries और redacted, truncated output previews रखती हैं। Tool argument values Activity state में stored नहीं होते; UI दिखाता है कि arguments hidden हैं और केवल argument field count record करता है। In-memory list वर्तमान browser tab का अनुसरण करती है, Control UI के भीतर navigation के दौरान बनी रहती है, और page reload, session switch, या **Clear** पर reset होती है।

## Chat व्यवहार

<AccordionGroup>
  <Accordion title="Send और history semantics">
    - `chat.send` **non-blocking** है: यह `{ runId, status: "started" }` के साथ तुरंत ack करता है और response `chat` events के माध्यम से stream होता है। Trusted Control UI clients local diagnostics के लिए optional ACK timing metadata भी प्राप्त कर सकते हैं।
    - Chat uploads images और non-video files स्वीकार करते हैं। Images native image path बनाए रखते हैं; अन्य files managed media के रूप में stored होती हैं और history में attachment links के रूप में दिखाई जाती हैं।
    - उसी `idempotencyKey` के साथ फिर से भेजने पर running के दौरान `{ status: "in_flight" }`, और completion के बाद `{ status: "ok" }` लौटता है।
    - `chat.history` responses UI safety के लिए size-bounded होते हैं। जब transcript entries बहुत बड़ी होती हैं, Gateway लंबे text fields truncate कर सकता है, भारी metadata blocks omit कर सकता है, और oversized messages को placeholder (`[chat.history omitted: message too large]`) से बदल सकता है।
    - जब visible assistant message `chat.history` में truncate हुआ हो, तो side reader ज़रूरत पर `sessionKey`, आवश्यकता होने पर active `agentId`, और transcript `messageId` के ज़रिए `chat.message.get` से पूरा display-normalized transcript entry fetch कर सकता है। यदि Gateway फिर भी और नहीं लौटा सकता, तो reader truncated preview को silently repeat करने के बजाय explicit unavailable state दिखाता है।
    - Assistant/generated images managed media references के रूप में persisted होती हैं और authenticated Gateway media URLs के माध्यम से वापस serve होती हैं, इसलिए reloads chat history response में raw base64 image payloads बने रहने पर निर्भर नहीं करते।
    - `chat.history` render करते समय, Control UI visible assistant text से display-only inline directive tags (उदाहरण के लिए `[[reply_to_*]]` और `[[audio_as_voice]]`), plain-text tool-call XML payloads (जिसमें `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, और truncated tool-call blocks शामिल हैं), और leaked ASCII/full-width model control tokens हटाता है, और ऐसी assistant entries omit करता है जिनका पूरा visible text केवल exact silent token `NO_REPLY` / `no_reply` या heartbeat acknowledgement token `HEARTBEAT_OK` हो।
    - active send और final history refresh के दौरान, यदि `chat.history` थोड़े समय के लिए पुराना snapshot लौटाता है, तो chat view local optimistic user/assistant messages visible रखता है; Gateway history catch up होने पर canonical transcript उन local messages को replace कर देता है।
    - Live `chat` events delivery state हैं, जबकि `chat.history` durable session transcript से rebuilt होता है। tool-final events के बाद Control UI history reload करता है और केवल छोटा optimistic tail merge करता है; transcript boundary [WebChat](/hi/web/webchat) में documented है।
    - `chat.inject` session transcript में assistant note append करता है और UI-only updates के लिए `chat` event broadcast करता है (कोई agent run नहीं, कोई channel delivery नहीं)।
    - sidebar recent sessions को New Session action, All Sessions link, और session search button के साथ list करता है जो full session picker खोलता है (selected agent के scope में, search और pagination के साथ)। agents switch करने पर केवल उस agent से जुड़े sessions दिखते हैं और यदि उसके पास अभी तक saved dashboard sessions नहीं हैं, तो उस agent के main session पर fallback होता है।
    - desktop widths पर, chat controls एक compact row में रहते हैं और transcript में नीचे scroll करते समय collapse हो जाते हैं; ऊपर scroll करने, top पर लौटने, या bottom तक पहुँचने पर controls restore होते हैं।
    - लगातार duplicate text-only messages count badge के साथ एक bubble के रूप में render होते हैं। Images, attachments, tool output, या canvas previews वाले messages uncollapsed छोड़े जाते हैं।
    - chat header model और thinking pickers active session को तुरंत `sessions.patch` के माध्यम से patch करते हैं; वे persistent session overrides हैं, one-turn-only send options नहीं।
    - यदि आप उसी session के लिए model picker change अभी save हो रहा हो तब message भेजते हैं, तो composer `chat.send` call करने से पहले उस session patch का इंतज़ार करता है ताकि send selected model का उपयोग करे।
    - Control UI में `/new` type करने से New Chat जैसा ही fresh dashboard session create और switch होता है, सिवाय तब जब `session.dmScope: "main"` configured हो और current parent agent का main session हो; उस स्थिति में यह main session को in place reset करता है। `/reset` type करने से current session के लिए Gateway का explicit in-place reset बना रहता है।
    - chat model picker Gateway का configured model view request करता है। यदि `agents.defaults.models` मौजूद है, तो वही allowlist picker को चलाती है, जिसमें `provider/*` entries शामिल हैं जो provider-scoped catalogs को dynamic रखती हैं। अन्यथा picker explicit `models.providers.*.models` entries और usable auth वाले providers दिखाता है। पूरा catalog debug `models.list` RPC के माध्यम से `view: "all"` के साथ उपलब्ध रहता है।
    - जब fresh Gateway session usage reports में current context tokens शामिल हों, तो chat composer toolbar used percentage के साथ छोटा context usage ring दिखाता है; पूरा token detail उसके tooltip में रहता है। ring high context pressure पर warning styling में बदलता है और recommended compaction levels पर compact button दिखाता है जो normal session compaction path चलाता है। stale token snapshots तब तक hidden रहते हैं जब तक Gateway फिर से fresh usage report नहीं करता।

  </Accordion>
  <Accordion title="Talk मोड (browser realtime)">
    Talk मोड registered realtime voice provider का उपयोग करता है। OpenAI को `talk.realtime.provider: "openai"` और `openai` API-key auth profile, `talk.realtime.providers.openai.apiKey`, या `OPENAI_API_KEY` के साथ configure करें; OpenAI OAuth profiles Realtime voice configure नहीं करते। Google को `talk.realtime.provider: "google"` और `talk.realtime.providers.google.apiKey` के साथ configure करें। browser को कभी standard provider API key नहीं मिलती। OpenAI WebRTC के लिए ephemeral Realtime client secret प्राप्त करता है। Google Live browser WebSocket session के लिए one-use constrained Live API auth token प्राप्त करता है, जिसमें instructions और tool declarations Gateway द्वारा token में locked होते हैं। जो providers केवल backend realtime bridge expose करते हैं, वे Gateway relay transport के माध्यम से चलते हैं, इसलिए credentials और vendor sockets server-side रहते हैं जबकि browser audio authenticated Gateway RPCs से गुजरता है। Realtime session prompt Gateway द्वारा assembled होता है; `talk.client.create` caller-provided instruction overrides स्वीकार नहीं करता।

    Chat composer में Talk start/stop button के बगल में Talk options button शामिल है। options अगले Talk session पर लागू होते हैं और provider, transport, model, voice, reasoning effort, VAD threshold, silence duration, और prefix padding override कर सकते हैं। जब कोई option blank हो, तो Gateway उपलब्ध होने पर configured defaults या provider default का उपयोग करता है। Gateway relay चुनना backend relay path को force करता है; WebRTC चुनना session को client-owned रखता है और यदि provider browser session create नहीं कर सकता, तो relay पर silently fallback करने के बजाय fail करता है।

    Chat composer में, Talk control microphone dictation button के बगल में waves button है। जब Talk शुरू होता है, तो composer status row `Connecting Talk...`, फिर audio connected रहते हुए `Talk live`, या realtime tool call के `talk.client.toolCall` के माध्यम से configured larger model से consult करते समय `Asking OpenClaw...` दिखाता है।

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` OpenAI backend WebSocket bridge, OpenAI browser WebRTC SDP exchange, Google Live constrained-token browser WebSocket setup, और fake microphone media के साथ Gateway relay browser adapter verify करता है। command केवल provider status print करता है और secrets log नहीं करता।

  </Accordion>
  <Accordion title="Stop और abort">
    - **Stop** क्लिक करें (`chat.abort` call करता है)।
    - जब run active हो, normal follow-ups queue होते हैं। queued message पर **Steer** क्लिक करके उस follow-up को running turn में inject करें।
    - out-of-band abort करने के लिए `/stop` type करें (या standalone abort phrases जैसे `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`)।
    - `chat.abort` उस session के सभी active runs abort करने के लिए `{ sessionKey }` (कोई `runId` नहीं) support करता है।

  </Accordion>
  <Accordion title="Abort partial retention">
    - जब कोई run abort होता है, partial assistant text फिर भी UI में दिखाया जा सकता है।
    - buffered output मौजूद होने पर Gateway aborted partial assistant text को transcript history में persist करता है।
    - persisted entries में abort metadata शामिल होता है ताकि transcript consumers abort partials को normal completion output से अलग पहचान सकें।

  </Accordion>
</AccordionGroup>

## PWA install और web push

Control UI एक `manifest.webmanifest` और service worker ship करता है, इसलिए modern browsers इसे standalone PWA के रूप में install कर सकते हैं। Web Push Gateway को installed PWA को notifications के साथ wake करने देता है, तब भी जब tab या browser window खुली न हो।

यदि OpenClaw अपडेट के तुरंत बाद पेज **Protocol mismatch** दिखाता है, तो पहले `openclaw dashboard` से dashboard फिर से खोलें और पेज को hard-refresh करें। यदि यह फिर भी विफल हो, तो dashboard origin के लिए site data साफ करें या निजी browser window में परीक्षण करें; कोई पुराना tab या browser service-worker cache नए Gateway के विरुद्ध pre-update Control UI bundle चलाता रह सकता है।

| सतह                                                  | यह क्या करता है                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest. Browsers "Install app" तब दिखाते हैं जब यह पहुंच योग्य हो। |
| `ui/public/sw.js`                                     | Service worker जो `push` events और notification clicks संभालता है। |
| `push/vapid-keys.json` (OpenClaw state dir के अंतर्गत) | Web Push payloads पर हस्ताक्षर करने के लिए उपयोग की गई auto-generated VAPID keypair। |
| `push/web-push-subscriptions.json`                    | Persisted browser subscription endpoints.                          |

जब आप keys pin करना चाहते हैं (multi-host deployments, secrets rotation, या tests के लिए), तो Gateway process पर env vars के माध्यम से VAPID keypair override करें:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (defaults to `https://openclaw.ai`)

Control UI browser subscriptions register और test करने के लिए इन scope-gated Gateway methods का उपयोग करता है:

- `push.web.vapidPublicKey` — सक्रिय VAPID public key fetch करता है।
- `push.web.subscribe` — `endpoint` के साथ `keys.p256dh`/`keys.auth` register करता है।
- `push.web.unsubscribe` — registered endpoint हटाता है।
- `push.web.test` — caller की subscription को test notification भेजता है।

<Note>
Web Push iOS APNS relay path (relay-backed push के लिए [Configuration](/hi/gateway/configuration) देखें) और मौजूदा `push.test` method से स्वतंत्र है, जो native mobile pairing को target करते हैं।
</Note>

## Hosted embeds

Assistant messages `[embed ...]` shortcode के साथ hosted web content inline render कर सकते हैं। iframe sandbox policy `gateway.controlUi.embedSandbox` द्वारा नियंत्रित होती है:

<Tabs>
  <Tab title="strict">
    Hosted embeds के भीतर script execution disable करता है।
  </Tab>
  <Tab title="scripts (default)">
    Origin isolation बनाए रखते हुए interactive embeds allow करता है; यह default है और आमतौर पर self-contained browser games/widgets के लिए पर्याप्त होता है।
  </Tab>
  <Tab title="trusted">
    Same-site documents के लिए `allow-scripts` के ऊपर `allow-same-origin` जोड़ता है जिन्हें जानबूझकर stronger privileges चाहिए।
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
`trusted` केवल तब उपयोग करें जब embedded document को वास्तव में same-origin behavior चाहिए। अधिकांश agent-generated games और interactive canvases के लिए, `scripts` अधिक सुरक्षित विकल्प है।
</Warning>

Absolute external `http(s)` embed URLs default रूप से blocked रहते हैं। यदि आप जानबूझकर `[embed url="https://..."]` को third-party pages load करने देना चाहते हैं, तो `gateway.controlUi.allowExternalEmbedUrls: true` set करें।

## Chat message width

Grouped chat messages readable default max-width का उपयोग करते हैं। Wide-monitor deployments bundled CSS patch किए बिना `gateway.controlUi.chatMessageMaxWidth` set करके इसे override कर सकते हैं:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Value browser तक पहुंचने से पहले validate की जाती है। Supported values में plain lengths और percentages जैसे `960px` या `82%`, साथ ही constrained `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, और `fit-content(...)` width expressions शामिल हैं।

## Tailnet access (recommended)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway को loopback पर रखें और Tailscale Serve को HTTPS के साथ इसे proxy करने दें:

    ```bash
    openclaw gateway --tailscale serve
    ```

    खोलें:

    - `https://<magicdns>/` (या आपका configured `gateway.controlUi.basePath`)

    Default रूप से, Control UI/WebSocket Serve requests Tailscale identity headers (`tailscale-user-login`) के माध्यम से authenticate कर सकते हैं जब `gateway.auth.allowTailscale` `true` हो। OpenClaw `x-forwarded-for` address को `tailscale whois` से resolve करके और उसे header से match करके identity verify करता है, और इन्हें केवल तब स्वीकार करता है जब request Tailscale के `x-forwarded-*` headers के साथ loopback पर hit करती है। Browser device identity वाले Control UI operator sessions के लिए, यह verified Serve path device-pairing round trip को भी skip करता है; device-less browsers और node-role connections अभी भी सामान्य device checks का पालन करते हैं। यदि आप Serve traffic के लिए भी explicit shared-secret credentials require करना चाहते हैं, तो `gateway.auth.allowTailscale: false` set करें। फिर `gateway.auth.mode: "token"` या `"password"` उपयोग करें।

    उस async Serve identity path के लिए, same client IP और auth scope के failed auth attempts rate-limit writes से पहले serialized होते हैं। इसलिए same browser से concurrent bad retries दूसरे request पर parallel में race करते हुए दो plain mismatches के बजाय `retry later` दिखा सकते हैं।

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

## Insecure HTTP

यदि आप dashboard को plain HTTP (`http://<lan-ip>` या `http://<tailscale-ip>`) पर खोलते हैं, तो browser **non-secure context** में चलता है और WebCrypto block करता है। Default रूप से, OpenClaw device identity के बिना Control UI connections **block** करता है।

Documented exceptions:

- `gateway.controlUi.allowInsecureAuth=true` के साथ localhost-only insecure HTTP compatibility
- `gateway.auth.mode: "trusted-proxy"` के माध्यम से successful operator Control UI auth
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Recommended fix:** HTTPS (Tailscale Serve) उपयोग करें या UI locally खोलें:

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
    - यह pairing checks bypass नहीं करता।
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
    `dangerouslyDisableDeviceAuth` Control UI device identity checks disable करता है और यह गंभीर security downgrade है। Emergency use के बाद जल्दी revert करें।
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

Control UI tight `img-src` policy के साथ ship होता है: केवल **same-origin** assets, `data:` URLs, और locally generated `blob:` URLs allow हैं। Remote `http(s)` और protocol-relative image URLs browser द्वारा reject किए जाते हैं और network fetches issue नहीं करते।

Practical रूप में इसका अर्थ:

- Relative paths के अंतर्गत served avatars और images (उदाहरण के लिए `/avatars/<id>`) अभी भी render होते हैं, authenticated avatar routes सहित जिन्हें UI fetch करता है और local `blob:` URLs में convert करता है।
- Inline `data:image/...` URLs अभी भी render होते हैं (in-protocol payloads के लिए उपयोगी)।
- Control UI द्वारा बनाए गए local `blob:` URLs अभी भी render होते हैं।
- Channel metadata द्वारा emitted remote avatar URLs Control UI के avatar helpers पर strip कर दिए जाते हैं और built-in logo/badge से replace किए जाते हैं, इसलिए compromised या malicious channel operator browser से arbitrary remote image fetches force नहीं कर सकता।

इस behavior को पाने के लिए आपको कुछ भी बदलने की जरूरत नहीं है — यह हमेशा on रहता है और configurable नहीं है।

## Avatar route auth

जब gateway auth configured हो, Control UI avatar endpoint को बाकी API जैसे same gateway token की आवश्यकता होती है:

- `GET /avatar/<agentId>` केवल authenticated callers को avatar image return करता है। `GET /avatar/<agentId>?meta=1` same rule के अंतर्गत avatar metadata return करता है।
- किसी भी route पर unauthenticated requests reject की जाती हैं (sibling assistant-media route से matching)। यह avatar route को ऐसे hosts पर agent identity leak करने से रोकता है जो अन्यथा protected हैं।
- Control UI खुद avatars fetch करते समय gateway token को bearer header के रूप में forward करता है, और authenticated blob URLs का उपयोग करता है ताकि image dashboards में अब भी render हो।

यदि आप gateway auth disable करते हैं (shared hosts पर recommended नहीं), तो बाकी gateway की तरह avatar route भी unauthenticated हो जाता है।

## Assistant media route auth

जब gateway auth configured हो, assistant local-media previews two-step route का उपयोग करते हैं:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` को normal Control UI operator auth चाहिए। Availability check करते समय browser gateway token को bearer header के रूप में भेजता है।
- Successful metadata responses में उस exact source path तक scoped short-lived `mediaTicket` शामिल होता है।
- Browser-rendered image, audio, video, और document URLs active gateway token या password के बजाय `mediaTicket=<ticket>` का उपयोग करते हैं। Ticket जल्दी expire होता है और अलग source authorize नहीं कर सकता।

यह reusable gateway credentials को visible media URLs में डाले बिना normal media rendering को browser-native media elements के साथ compatible रखता है।

## Building the UI

Gateway `dist/control-ui` से static files serve करता है। इन्हें इस command से build करें:

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

फिर UI को अपने Gateway WS URL की ओर point करें (जैसे `ws://127.0.0.1:18789`)।

## Blank Control UI page

यदि browser blank dashboard load करता है और DevTools कोई उपयोगी error नहीं दिखाता, तो किसी extension या early content script ने JavaScript module app को evaluate होने से रोका हो सकता है। Static page में एक plain HTML recovery panel शामिल है जो startup के बाद `<openclaw-app>` register न होने पर दिखाई देता है।

Browser environment बदलने के बाद panel की **Try again** action का उपयोग करें, या इन checks के बाद manually reload करें:

- सभी pages में inject करने वाले extensions disable करें, खासकर `<all_urls>` content scripts वाले extensions।
- Private window, clean browser profile, या दूसरा browser try करें।
- Gateway running रखें और browser change के बाद same dashboard URL verify करें।

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

    Optional one-time auth (यदि needed हो):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="टिप्पणियाँ">
    - `gatewayUrl` लोड होने के बाद localStorage में संग्रहीत होता है और URL से हटा दिया जाता है।
    - अगर आप `gatewayUrl` के जरिए पूरा `ws://` या `wss://` endpoint पास करते हैं, तो `gatewayUrl` मान को URL-encode करें ताकि ब्राउज़र query string को सही ढंग से पार्स करे।
    - जब भी संभव हो, `token` को URL fragment (`#token=...`) के जरिए पास किया जाना चाहिए। Fragments सर्वर को नहीं भेजे जाते, जिससे request-log और Referer leakage से बचाव होता है। Legacy `?token=` query params अभी भी संगतता के लिए एक बार import किए जाते हैं, लेकिन केवल fallback के रूप में, और bootstrap के तुरंत बाद हटा दिए जाते हैं।
    - `password` केवल memory में रखा जाता है।
    - जब `gatewayUrl` सेट होता है, तो UI config या environment credentials पर fallback नहीं करता। `token` (या `password`) स्पष्ट रूप से दें। स्पष्ट credentials न होना एक error है।
    - जब Gateway TLS (Tailscale Serve, HTTPS proxy, आदि) के पीछे हो, तो `wss://` का उपयोग करें।
    - clickjacking रोकने के लिए `gatewayUrl` केवल top-level window (embedded नहीं) में स्वीकार किया जाता है।
    - सार्वजनिक non-loopback Control UI deployments को `gateway.controlUi.allowedOrigins` स्पष्ट रूप से सेट करना होगा (full origins)। loopback, RFC1918/link-local, `.local`, `.ts.net`, या Tailscale CGNAT hosts से private same-origin LAN/Tailnet loads Host-header fallback सक्षम किए बिना स्वीकार किए जाते हैं।
    - Gateway startup effective runtime bind और port से `http://localhost:<port>` और `http://127.0.0.1:<port>` जैसे local origins seed कर सकता है, लेकिन remote browser origins को फिर भी स्पष्ट entries चाहिए।
    - कड़े नियंत्रण वाले local testing को छोड़कर `gateway.controlUi.allowedOrigins: ["*"]` का उपयोग न करें। इसका मतलब किसी भी browser origin को अनुमति देना है, न कि "मैं जिस भी host का उपयोग कर रहा हूं उससे match करें।"
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

Remote access setup details: [रिमोट एक्सेस](/hi/gateway/remote).

## संबंधित

- [डैशबोर्ड](/hi/web/dashboard) — gateway dashboard
- [स्वास्थ्य जांच](/hi/gateway/health) — gateway health monitoring
- [TUI](/hi/web/tui) — terminal user interface
- [WebChat](/hi/web/webchat) — browser-based chat interface
