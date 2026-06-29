---
read_when:
    - आपको नियंत्रण UI में कानबान-शैली का कार्यबोर्ड चाहिए
    - आप बंडल किए गए Workboard Plugin को सक्षम या अक्षम कर रहे हैं
    - आप बाहरी प्रोजेक्ट मैनेजर के बिना नियोजित एजेंट कार्य को ट्रैक करना चाहते हैं
summary: एजेंट-स्वामित्व वाले कार्ड और सत्र हैंडऑफ़ के लिए वैकल्पिक डैशबोर्ड वर्कबोर्ड
title: Workboard Plugin
x-i18n:
    generated_at: "2026-06-28T23:55:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: caca6263b4ee08b36816ef6acdef506499c66b4d27f4f75551ac7784b2bf3324
    source_path: plugins/workboard.md
    workflow: 16
---

Workboard Plugin [Control UI](/hi/web/control-ui) में एक वैकल्पिक Kanban-शैली बोर्ड जोड़ता है। इसका उपयोग एजेंट-आकार के कार्य कार्ड इकट्ठा करने, उन्हें एजेंटों को असाइन करने, और लिंक किए गए पृष्ठभूमि कार्य, रन, और डैशबोर्ड सत्र को एक कार्ड से ट्रैक करने के लिए करें.

Workboard जानबूझकर छोटा है। यह OpenClaw Gateway के लिए स्थानीय संचालन कार्य ट्रैक करता है; यह GitHub Issues, Linear, Jira, या अन्य टीम प्रोजेक्ट प्रबंधन प्रणालियों का विकल्प नहीं है।

## डिफ़ॉल्ट स्थिति

Workboard एक बंडल किया गया Plugin है और डिफ़ॉल्ट रूप से अक्षम रहता है जब तक आप इसे Plugin कॉन्फ़िग में सक्षम नहीं करते।

इसे इस तरह सक्षम करें:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

फिर डैशबोर्ड खोलें:

```bash
openclaw dashboard
```

Workboard टैब डैशबोर्ड नेविगेशन में दिखाई देता है। यदि टैब दिखाई दे रहा है लेकिन Plugin अक्षम है या `plugins.allow` / `plugins.deny` से अवरुद्ध है, तो व्यू स्थानीय कार्ड डेटा के बजाय Plugin-अनुपलब्ध स्थिति दिखाता है।

## कार्ड में क्या होता है

हर कार्ड यह संग्रहीत करता है:

- शीर्षक और नोट्स
- स्थिति: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`,
  `review`, `blocked`, या `done`
- प्राथमिकता: `low`, `normal`, `high`, या `urgent`
- लेबल
- वैकल्पिक एजेंट आईडी
- वैकल्पिक लिंक किया गया कार्य, रन, सत्र, या स्रोत URL
- कार्ड से शुरू किए गए Codex या Claude रन के लिए वैकल्पिक निष्पादन मेटाडेटा
- प्रयासों, टिप्पणियों, लिंक, प्रमाण, आर्टिफैक्ट, ऑटोमेशन,
  अटैचमेंट, वर्कर लॉग, वर्कर प्रोटोकॉल स्थिति, दावों, डायग्नॉस्टिक्स,
  सूचनाओं, टेम्पलेट्स, आर्काइव स्थिति, और पुराने-सत्र पहचान के लिए संक्षिप्त मेटाडेटा
- हाल के कार्ड इवेंट जैसे बनाए गए, मूव किए गए, लिंक किए गए, दावा किए गए, Heartbeat,
  प्रयास, प्रमाण, आर्टिफैक्ट, डायग्नॉस्टिक, सूचना, डिस्पैच, आर्काइव, पुराने,
  या एजेंट-अपडेट किए गए बदलाव

कार्ड Plugin की Gateway स्थिति में संग्रहीत होते हैं। वे Gateway स्थिति डायरेक्टरी के लिए स्थानीय होते हैं और उस Gateway की बाकी OpenClaw स्थिति के साथ चलते हैं।

Workboard प्रति-कार्ड संक्षिप्त मेटाडेटा रखता है ताकि ऑपरेटर लिंक किए गए सत्र को खोले बिना देख सकें कि कार्ड बोर्ड से कैसे गुजरा। इवेंट, प्रयास सारांश, प्रमाण स्निपेट, संबंधित लिंक, टिप्पणियां, आर्काइव मार्कर, और पुराने-सत्र मार्कर जानबूझकर स्थानीय मेटाडेटा हैं; वे सत्र ट्रांसक्रिप्ट या GitHub issue इतिहास का विकल्प नहीं हैं।

## कार्ड निष्पादन और कार्य

बिना लिंक वाले कार्ड कार्ड से काम शुरू कर सकते हैं। स्वायत्त शुरुआत Gateway के कार्य-ट्रैक किए गए एजेंट रन पथ का उपयोग करती है, फिर Workboard परिणामी कार्य, रन आईडी, और सत्र कुंजी को वापस कार्ड से लिंक करता है। शुरुआत Gateway के कॉन्फ़िगर किए गए डिफ़ॉल्ट एजेंट और मॉडल का उपयोग करती है। Codex और Claude क्रियाएं वैकल्पिक स्पष्ट मॉडल विकल्प हैं:

- Run Codex या Run Claude कार्य-समर्थित एजेंट रन शुरू करता है, कार्ड
  प्रॉम्प्ट भेजता है, और कार्ड को `running` चिह्नित करता है।
- Open Codex या Open Claude कार्ड प्रॉम्प्ट भेजे बिना या कार्ड को मूव किए बिना
  एक लिंक किया गया डैशबोर्ड सत्र बनाता है, ताकि आप बोर्ड से जुड़े रहते हुए मैन्युअल रूप से काम कर सकें।

निष्पादन मेटाडेटा चयनित इंजन, मोड, मॉडल रेफ, सत्र कुंजी,
रन आईडी, उपलब्ध होने पर कार्य आईडी, और कार्ड पर लाइफसाइकल स्थिति संग्रहीत करता है। Codex
निष्पादन `openai/gpt-5.5` का उपयोग करते हैं; Claude निष्पादन
`anthropic/claude-sonnet-4-6` का उपयोग करते हैं।

हर लिंक किया गया निष्पादन उसी कार्ड रिकॉर्ड पर एक प्रयास सारांश भी दर्ज करता है।
प्रयास सारांश इंजन, मोड, मॉडल, रन आईडी, टाइमस्टैम्प, स्थिति,
और रोलिंग विफलता संख्या रखता है ताकि बार-बार की विफलताएं बोर्ड पर दिखाई देती रहें।

डैशबोर्ड Gateway कार्य लेजर से कार्य स्थिति रीफ्रेश करता है और कार्य आईडी, रन आईडी, या लिंक की गई सत्र कुंजी से कार्यों को कार्ड से मिलाता है। यदि कोई कार्य कतार में है या चल रहा है, तो कार्ड लाइफसाइकल सक्रिय कार्य स्थिति दिखाता है। यदि कार्य पूरा होता है, विफल होता है, टाइम आउट होता है, या रद्द होता है, तो कार्ड लाइफसाइकल लिंक किए गए सत्रों वाली समान लाइफसाइकल सिंक का उपयोग करके समीक्षा या अवरुद्ध स्थिति की ओर बढ़ती है।

## एजेंट समन्वय

Workboard बोर्ड-सचेत वर्कफ़्लो के लिए वैकल्पिक एजेंट टूल भी उपलब्ध कराता है:

- `workboard_list` दावा और डायग्नॉस्टिक स्थिति वाले संक्षिप्त कार्ड सूचीबद्ध करता है, वैकल्पिक बोर्ड फ़िल्टर के साथ।
- `workboard_read` एक कार्ड और नोट्स, प्रयासों, टिप्पणियों, लिंक, प्रमाण, आर्टिफैक्ट, पैरेंट परिणामों, हाल के असाइनी कार्य, और सक्रिय डायग्नॉस्टिक्स से बना सीमित वर्कर संदर्भ लौटाता है।
- `workboard_create` वैकल्पिक पैरेंट्स, टेनेंट, skills,
  बोर्ड, वर्कस्पेस मेटाडेटा, idempotency कुंजी, रनटाइम सीमा, और retry बजट के साथ कार्ड बनाता है।
- `workboard_link` पैरेंट कार्ड को चाइल्ड कार्ड से लिंक करता है। चिल्ड्रेन `todo`
  में रहते हैं जब तक हर पैरेंट `done` तक नहीं पहुंचता; फिर डिस्पैच प्रमोशन उन्हें `ready` में मूव करता है।
- `workboard_claim` कॉल करने वाले एजेंट के लिए कार्ड पर दावा करता है और बैकलॉग, todo,
  या ready कार्ड को `running` में मूव करता है।
- `workboard_heartbeat` लंबे रन के दौरान दावा Heartbeat रीफ्रेश करता है।
- `workboard_release` पूरा होने, विराम, या हैंडऑफ के बाद दावा रिलीज़ करता है और
  कार्ड को अगली स्थिति में मूव कर सकता है।
- `workboard_complete` और `workboard_block` अंतिम सारांशों, प्रमाण, आर्टिफैक्ट, बनाए-गए-कार्ड मैनिफेस्ट, और अवरोधक कारणों के लिए संरचित लाइफसाइकल टूल हैं। बनाए-गए-कार्ड मैनिफेस्ट में पूरे किए गए कार्ड से वापस लिंक किए गए कार्ड का संदर्भ होना चाहिए, जिससे काल्पनिक चिल्ड्रेन सारांशों से बाहर रहते हैं।
- `workboard_attachment_add`, `workboard_attachment_read`, और
  `workboard_attachment_delete` छोटे कार्ड अटैचमेंट Plugin SQLite
  स्थिति में संग्रहीत करते हैं, उन्हें कार्ड पर इंडेक्स करते हैं, और वर्कर संदर्भ में उपलब्ध कराते हैं।
- `workboard_worker_log` और `workboard_protocol_violation` वर्कर लॉग
  पंक्तियां दर्ज करते हैं और जब कोई स्वचालित वर्कर `workboard_complete` या `workboard_block` कॉल किए बिना रुकता है तो कार्ड ब्लॉक करते हैं।
- `workboard_board_create`, `workboard_board_archive`, और
  `workboard_board_delete` डिस्प्ले नाम, विवरण, आर्काइव स्थिति, और डिफ़ॉल्ट वर्कस्पेस जैसे स्थायी बोर्ड मेटाडेटा प्रबंधित करते हैं।
- `workboard_runs` कार्ड पर संग्रहीत स्थायी रन-प्रयास इतिहास लौटाता है।
- `workboard_specify` किसी मोटे triage या backlog कार्ड को स्पष्ट
  `todo` कार्ड में बदलता है और विनिर्देश सारांश कार्ड पर दर्ज करता है।
- `workboard_decompose` पैरेंट orchestration कार्ड को लिंक किए गए चिल्ड्रेन में फैलाता है,
  बोर्ड और टेनेंट मेटाडेटा विरासत में देता है, और बनाए-गए-कार्ड मैनिफेस्ट के साथ पैरेंट को पूरा कर सकता है।
- `workboard_notify_subscribe`, `workboard_notify_list`,
  `workboard_notify_events`, `workboard_notify_advance`, और
  `workboard_notify_unsubscribe` Plugin स्थिति में सूचना सदस्यताएं प्रबंधित करते हैं। इवेंट रीड replay-safe हैं; advance टूल टिकाऊ कर्सर को आगे बढ़ाता है ताकि कॉलर पूर्ण, विफल, या पुराने कार्ड इवेंट खोए बिना या दोबारा पढ़े बिना फिर से शुरू कर सकें।
- `workboard_boards`, `workboard_stats`, `workboard_promote`,
  `workboard_reassign`, `workboard_reclaim`, `workboard_comment`,
  `workboard_proof`, `workboard_unblock`, और `workboard_dispatch` एजेंट को
  बोर्ड नेमस्पेस निरीक्षण करने, कतार आंकड़े देखने, अटके काम को पुनर्प्राप्त करने, हैंडऑफ
  नोट्स जोड़ने, प्रमाण या आर्टिफैक्ट संदर्भ जोड़ने, अवरुद्ध काम को वापस `todo` में मूव करने,
  और dependency promotion या stale-claim cleanup को नज करने देते हैं।

दावा किए गए कार्ड अन्य एजेंटों से एजेंट-टूल mutations अस्वीकार करते हैं जब तक कॉलर के पास `workboard_claim` से लौटाया गया claim token न हो। डैशबोर्ड ऑपरेटर अब भी सामान्य Gateway RPC सतह का उपयोग करते हैं और कार्ड रिकवर या फिर से असाइन कर सकते हैं।

Workboard टिकाऊ बोर्ड डेटा को OpenClaw स्थिति डायरेक्टरी के अंतर्गत Plugin-स्वामित्व वाले relational SQLite डेटाबेस में संग्रहीत करता है। बोर्ड, कार्ड, लेबल, लाइफसाइकल इवेंट,
रन प्रयास, टिप्पणियां, dependency links, प्रमाण, आर्टिफैक्ट संदर्भ,
अटैचमेंट मेटाडेटा और blobs, डायग्नॉस्टिक्स, सूचनाएं, वर्कर लॉग,
प्रोटोकॉल स्थिति, और सदस्यताएं Plugin key-value entries के बजाय Workboard तालिकाओं में स्थायी की जाती हैं। कार्ड export अब भी अटैचमेंट blob सामग्री inline किए बिना बोर्ड narrative को सुरक्षित रखता है।

`.28` रिलीज़ में Workboard का उपयोग करने वाले इंस्टॉलेशन shipped legacy plugin-state namespaces
(`workboard.cards`, `workboard.boards`, और `workboard.notify`) को relational database में migrate करने के लिए
`openclaw doctor --fix` चला सकते हैं। यदि legacy `workboard.attachments` namespace मौजूद है,
तो doctor उन attachment blobs को भी migrate करता है।

Workboard डायग्नॉस्टिक्स स्थानीय कार्ड मेटाडेटा से गणना किए जाते हैं। अंतर्निहित checks
उन असाइन किए गए कार्ड को flag करते हैं जो बहुत लंबे समय तक प्रतीक्षा करते हैं, हालिया Heartbeat के बिना running cards,
ध्यान मांगने वाले blocked cards, repeated failures, proof के बिना done cards,
और running cards जिनके पास केवल loose session link है।

Dispatch जानबूझकर Gateway-local है। यह मनमाने operating
system processes spawn नहीं करता; सामान्य OpenClaw subagent sessions अब भी execution के स्वामी हैं। Dispatch action dependency-ready cards को promote करता है, ready cards पर dispatch metadata record करता है, expired claims या timed-out runs को block करता है, board-configured
triage cards को orchestration candidates के रूप में mark करता है, फिर ready cards की छोटी batch claim करता है और Gateway subagent runtime के माध्यम से worker runs शुरू करता है। Assigned
cards `agent:<id>:subagent:workboard-*` worker session keys का उपयोग करते हैं; unassigned
cards unscoped `subagent:workboard-*` keys का उपयोग करते हैं ताकि Gateway अब भी configured default agent resolve करे। Workers को bounded card context और वह claim token मिलता है जिसकी उन्हें Workboard tools के माध्यम से card को heartbeat, complete, या block करने के लिए आवश्यकता होती है।

### Dispatch worker चयन

हर dispatch pass डिफ़ॉल्ट रूप से अधिकतम तीन workers शुरू करता है। Ready cards को
priority, position, और creation time के अनुसार order किया जाता है, फिर duplicate active ownership से बचने के लिए filter किया जाता है। एक dispatch उसी pass में किसी दिए गए owner या
agent के लिए केवल एक card शुरू करता है, और उन owners को skip करता है जिनके पास board पर पहले से running या review work है।

Archived cards, active claims वाले cards, और `ready` status के बिना cards
worker starts के लिए select नहीं किए जाते। वे फिर भी dispatch के data side से प्रभावित हो सकते हैं जब stale claims, dependency promotion, या timeout cleanup लागू होता है।

### Worker prompt और lifecycle

Worker prompt में card title, bounded notes और context,
assigned board, और Workboard worker protocol शामिल होता है। इसमें claim
owner और claim token भी शामिल होता है ताकि worker किसी अन्य actor द्वारा card take over किए बिना `workboard_heartbeat`,
`workboard_complete`, या `workboard_block` call कर सके।

जब worker सफलतापूर्वक शुरू होता है, Workboard session key, run id,
engine, mode, model label, status, और worker log को card पर store करता है। Session key
board और card के लिए deterministic है, जिससे repeated dispatches unrelated sessions बनाने के बजाय उसी worker lane पर वापस route होते हैं।

यदि card claim होने के बाद worker शुरू नहीं किया जा सकता, तो Workboard
card को block करता है, claim clear करता है, run-start failure record करता है, और worker log
line append करता है। यह failure dashboard, CLI JSON, agent tools, और card
diagnostics में visible है।

### Dispatch entry points

Ready-card worker starts इनसे हो सकते हैं:

- dashboard dispatch action
- `openclaw workboard dispatch`
- command-capable channel पर `/workboard dispatch`

तीनों entry points Gateway उपलब्ध होने पर Gateway subagent runtime का उपयोग करते हैं। CLI में एक extra operator fallback है: यदि Gateway offline है या
Workboard dispatch method expose नहीं करता और कोई explicit `--url` या
`--token` target provide नहीं किया गया, तो यह local SQLite
state के विरुद्ध data-only dispatch चलाता है। वह fallback dependencies promote कर सकता है, stale claims clean कर सकता है, और timed-out runs block कर सकता है, लेकिन workers शुरू नहीं कर सकता।

Board metadata में `autoDecompose`,
`autoDecomposePerDispatch`, `defaultAssignee`, और `orchestratorProfile` जैसी orchestration settings शामिल हो सकती हैं।
OpenClaw orchestration intent record करता है और उसे worker context में expose करता है; वास्तविक specification और decomposition अब भी सामान्य
Workboard tools के माध्यम से होता है।

## CLI और slash command

Plugin एक root CLI command register करता है:

```bash
openclaw workboard list
openclaw workboard create "Fix stale card lifecycle" --priority high --labels bug,workboard
openclaw workboard show <card-id>
openclaw workboard dispatch
```

`openclaw workboard dispatch` चल रहे Gateway को कॉल करता है ताकि worker शुरू होने पर
dashboard जैसा ही subagent runtime इस्तेमाल हो। अगर Gateway उपलब्ध नहीं है, तो यह
data-only dispatch पर वापस चला जाता है ताकि dependency promotion, stale-claim cleanup, और
timeout blocking फिर भी चल सकें। Auth, permission, और validation failures फिर भी
command errors के रूप में दिखते हैं, जैसे explicit `--url` या `--token`
targets के failures भी।

`/workboard` slash command वही compact operator path support करता है:
`/workboard list`, `/workboard show <card-id>`, `/workboard create <title>`, और
`/workboard dispatch`। List और show authorized command senders के लिए read operations
हैं। Create और dispatch के लिए chat surfaces पर owner status या `operator.write`
या `operator.admin` वाला Gateway client चाहिए।

command flags, JSON output, Gateway fallback behavior, unambiguous id-prefix handling,
dispatch selection rules, और troubleshooting के लिए [Workboard CLI](/hi/cli/workboard) देखें।

## Session lifecycle sync

Cards को existing dashboard sessions से या card से काम शुरू करने पर बने session से
link किया जा सकता है। Linked cards session lifecycle inline दिखाते हैं:
running, stale, linked idle, done, failed, या missing।

अगर linked session missing है, तो card context के लिए linked रहता है और फिर भी
start controls देता है ताकि आप fresh dashboard session में काम restart कर सकें।
अगर active linked session recent activity report करना बंद कर देता है, तो Workboard
card को stale mark करता है और marker को card metadata के रूप में store करता है जब तक
lifecycle उसे clear नहीं कर देता।

आप Sessions tab से Add to Workboard के साथ existing dashboard session भी capture कर
सकते हैं। Card उस session से linked होता है, session label या recent user prompt को
title के रूप में इस्तेमाल करता है, और chat history उपलब्ध होने पर recent user prompt
plus latest assistant response से notes seed करता है।

जब card अभी भी active work state में हो, Workboard linked session को follow करता है:

- active linked session -> `running`
- completed linked session -> `review`
- failed, killed, timed out, या aborted linked session -> `blocked`

Manual review states जीतते हैं। अगर आप card को `review`, `blocked`, या `done` में
move करते हैं, तो Workboard उस card को auto-moving करना बंद कर देता है जब तक आप उसे
वापस `todo` या `running` में move नहीं करते।

## Dashboard workflow

1. Control UI में Workboard tab खोलें।
2. title, notes, priority, labels, optional agent, और optional linked session के साथ card बनाएं।
3. या existing session के लिए Sessions खोलें और Add to Workboard चुनें।
4. card को columns के बीच drag करें या card पर compact status control focus करें
   और उसका menu या ArrowLeft/ArrowRight इस्तेमाल करें।
5. dashboard session create या reuse करने के लिए card से काम शुरू करें।
6. agent के काम करते समय card से linked session खोलें।
7. lifecycle sync को running work को review या blocked में move करने दें, फिर accepted होने पर
   card को manually done में move करें।

Card शुरू करना normal Gateway sessions इस्तेमाल करता है। Workboard Plugin सिर्फ
card metadata और links store करता है; conversation transcript, model selection, और run
lifecycle regular session system के owned रहते हैं।

Live linked card पर Stop इस्तेमाल करके active session run abort करें। Workboard उस
card को `blocked` mark करता है ताकि वह follow-up के लिए visible रहे।

New cards bugfixes, docs, releases, PR reviews, या plugin work के लिए Workboard
templates से शुरू हो सकते हैं। Templates title, notes, labels, और priority prefill
करते हैं, और selected template id card metadata के रूप में store होती है।

## Permissions

Plugin Gateway RPC methods को `workboard.*` namespace के तहत register करता है:

- `workboard.cards.list` के लिए `operator.read` चाहिए
- `workboard.cards.export` के लिए `operator.read` चाहिए
- `workboard.cards.diagnostics` के लिए `operator.read` चाहिए
- `workboard.cards.diagnostics.refresh` के लिए `operator.write` चाहिए
- attachment list/get और notification event reads के लिए `operator.read` चाहिए
- notification cursor advancement के लिए `operator.write` चाहिए
- create, update, move, delete, comment, link, dependency link, proof, artifact,
  attachment add/delete, worker log, protocol violation, claim, heartbeat,
  release, complete, block, unblock, dispatch, bulk, और archive methods के लिए
  `operator.write` चाहिए

Read-only operator access से connected browsers board inspect कर सकते हैं लेकिन
cards mutate नहीं कर सकते।

## Configuration

आज Workboard में कोई plugin-specific config नहीं है। Standard plugin entry से इसे
enable या disable करें:

```json5
{
  plugins: {
    entries: {
      workboard: {
        enabled: true,
        config: {},
      },
    },
  },
}
```

इसे फिर से disable करें:

```bash
openclaw plugins disable workboard
openclaw gateway restart
```

## Troubleshooting

### Tab कहता है कि Workboard unavailable है

Plugin policy check करें:

```bash
openclaw plugins inspect workboard --runtime --json
```

अगर `plugins.allow` configured है, तो उस allowlist में `workboard` जोड़ें। अगर
`plugins.deny` में `workboard` है, तो Plugin enable करने से पहले उसे remove करें।

### Cards save नहीं होते

Confirm करें कि browser connection के पास `operator.write` access है। Read-only operator
sessions cards list कर सकते हैं लेकिन उन्हें create, edit, move, या delete नहीं कर सकते।

### Card शुरू करने पर expected session नहीं खुलता

Workboard normal dashboard sessions के links बनाता है। Card का agent id
और linked session check करें, फिर actual run state inspect करने के लिए Sessions या Chat view खोलें।

### Dispatch worker start नहीं करता

Confirm करें कि active claim के बिना कम से कम एक `ready` card है:

```bash
openclaw workboard list --status ready
```

अगर CLI data-only dispatch report करता है, तो Gateway start या restart करें और retry करें।
Data-only dispatch local board state update करता है लेकिन subagent worker
runs शुरू नहीं कर सकता।

Cards तब भी skipped हो सकते हैं जब same owner या agent के लिए कोई दूसरा card
already running हो या review का wait कर रहा हो। Same owner के लिए और work dispatch करने से पहले
उस active work को complete, block, या release करें।

## Related

- [Control UI](/hi/web/control-ui)
- [Workboard CLI](/hi/cli/workboard)
- [Plugins](/hi/tools/plugin)
- [Plugins manage करें](/hi/plugins/manage-plugins)
- [Sessions](/hi/concepts/session)
