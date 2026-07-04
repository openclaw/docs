---
read_when: Finding which docs page covers a topic before reading the page
summary: OpenClaw दस्तावेज़ पृष्ठों के लिए जनरेट किया गया शीर्षक मानचित्र
title: दस्तावेज़ मानचित्र
x-i18n:
    generated_at: "2026-07-04T06:32:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb4d505d664e048e3e91179c071141ff445edbea5744be36ed97060f098a09fe
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw दस्तावेज़ मानचित्र

यह फ़ाइल `docs/**/*.md` और `docs/**/*.mdx` शीर्षकों से जनरेट की गई है ताकि एजेंट दस्तावेज़ीकरण ट्री में नेविगेट कर सकें।
इसे हाथ से संपादित न करें; `pnpm docs:map:gen` चलाएँ।

## agent-runtime-architecture.md

- मार्ग: /agent-runtime-architecture
- शीर्षक:
  - H2: रनटाइम लेआउट
  - H2: सीमाएँ
  - H2: मैनिफ़ेस्ट
  - H2: रनटाइम चयन
  - H2: संबंधित

## announcements/bluebubbles-imessage.md

- मार्ग: /announcements/bluebubbles-imessage
- शीर्षक:
  - H1: BlueBubbles हटाना और imsg iMessage पथ
  - H2: क्या बदला
  - H2: क्या करें
  - H2: माइग्रेशन नोट्स
  - H2: यह भी देखें

## auth-credential-semantics.md

- मार्ग: /auth-credential-semantics
- शीर्षक:
  - H2: स्थिर प्रोब कारण कोड
  - H2: टोकन क्रेडेंशियल
  - H3: पात्रता नियम
  - H3: समाधान नियम
  - H2: एजेंट कॉपी पोर्टेबिलिटी
  - H2: केवल-कॉन्फ़िग auth रूट
  - H2: स्पष्ट auth क्रम फ़िल्टरिंग
  - H2: प्रोब लक्ष्य समाधान
  - H2: बाहरी CLI क्रेडेंशियल खोज
  - H2: OAuth SecretRef नीति गार्ड
  - H2: लेगेसी-संगत मैसेजिंग
  - H2: संबंधित

## automation/auth-monitoring.md

- मार्ग: /automation/auth-monitoring
- शीर्षक:
  - H2: संबंधित

## automation/clawflow.md

- मार्ग: /automation/clawflow
- शीर्षक:
  - H2: संबंधित

## automation/cron-jobs.md

- मार्ग: /automation/cron-jobs
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: cron कैसे काम करता है
  - H2: शेड्यूल प्रकार
  - H3: महीने के दिन और सप्ताह के दिन में OR लॉजिक का उपयोग होता है
  - H2: निष्पादन शैलियाँ
  - H3: कमांड पेलोड
  - H3: अलग-थलग जॉब्स के लिए पेलोड विकल्प
  - H2: डिलीवरी और आउटपुट
  - H2: आउटपुट भाषा
  - H2: CLI उदाहरण
  - H2: Webhooks
  - H3: प्रमाणीकरण
  - H2: Gmail PubSub इंटीग्रेशन
  - H3: विज़ार्ड सेटअप (अनुशंसित)
  - H3: Gateway ऑटो-स्टार्ट
  - H3: मैन्युअल एक-बार सेटअप
  - H3: Gmail मॉडल ओवरराइड
  - H2: जॉब्स प्रबंधित करना
  - H2: कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H3: कमांड लैडर
  - H2: संबंधित

## automation/cron-vs-heartbeat.md

- मार्ग: /automation/cron-vs-heartbeat
- शीर्षक:
  - H2: संबंधित

## automation/gmail-pubsub.md

- मार्ग: /automation/gmail-pubsub
- शीर्षक:
  - H2: संबंधित

## automation/hooks.md

- मार्ग: /automation/hooks
- शीर्षक:
  - H2: सही सतह चुनें
  - H2: त्वरित शुरुआत
  - H2: इवेंट प्रकार
  - H2: hooks लिखना
  - H3: Hook संरचना
  - H3: HOOK.md फ़ॉर्मेट
  - H3: हैंडलर कार्यान्वयन
  - H3: इवेंट संदर्भ हाइलाइट्स
  - H2: Hook खोज
  - H3: Hook पैक
  - H2: बंडल किए गए hooks
  - H3: session-memory विवरण
  - H3: bootstrap-extra-files कॉन्फ़िग
  - H3: command-logger विवरण
  - H3: compaction-notifier विवरण
  - H3: boot-md विवरण
  - H2: Plugin hooks
  - H2: कॉन्फ़िगरेशन
  - H2: CLI संदर्भ
  - H2: सर्वोत्तम अभ्यास
  - H2: समस्या निवारण
  - H3: Hook खोजा नहीं गया
  - H3: Hook पात्र नहीं है
  - H3: Hook निष्पादित नहीं हो रहा
  - H2: संबंधित

## automation/index.md

- मार्ग: /automation
- शीर्षक:
  - H2: त्वरित निर्णय गाइड
  - H3: निर्धारित कार्य (Cron) बनाम Heartbeat
  - H2: मुख्य अवधारणाएँ
  - H3: निर्धारित कार्य (cron)
  - H3: कार्य
  - H3: अनुमानित प्रतिबद्धताएँ
  - H3: Task Flow
  - H3: स्थायी आदेश
  - H3: Hooks
  - H3: Heartbeat
  - H2: वे साथ कैसे काम करते हैं
  - H2: संबंधित

## automation/poll.md

- मार्ग: /automation/poll
- शीर्षक:
  - H2: संबंधित

## automation/standing-orders.md

- मार्ग: /automation/standing-orders
- शीर्षक:
  - H2: स्थायी आदेश क्यों
  - H2: वे कैसे काम करते हैं
  - H2: स्थायी आदेश की संरचना
  - H2: स्थायी आदेश और cron jobs
  - H2: उदाहरण
  - H3: उदाहरण 1: सामग्री और सोशल मीडिया (साप्ताहिक चक्र)
  - H3: उदाहरण 2: वित्त संचालन (इवेंट-ट्रिगर)
  - H3: उदाहरण 3: निगरानी और अलर्ट (निरंतर)
  - H2: निष्पादित-सत्यापित-रिपोर्ट पैटर्न
  - H2: मल्टी-प्रोग्राम आर्किटेक्चर
  - H2: सर्वोत्तम अभ्यास
  - H3: करें
  - H3: बचें
  - H2: संबंधित

## automation/taskflow.md

- मार्ग: /automation/taskflow
- शीर्षक:
  - H2: Task Flow कब उपयोग करें
  - H2: विश्वसनीय निर्धारित वर्कफ़्लो पैटर्न
  - H2: सिंक मोड
  - H3: प्रबंधित मोड
  - H3: मिरर किया गया मोड
  - H2: टिकाऊ स्थिति और संशोधन ट्रैकिंग
  - H2: रद्द व्यवहार
  - H2: CLI कमांड
  - H2: flows कार्यों से कैसे संबंधित हैं
  - H2: संबंधित

## automation/tasks.md

- मार्ग: /automation/tasks
- शीर्षक:
  - H2: TL;DR
  - H2: त्वरित शुरुआत
  - H2: क्या कार्य बनाता है
  - H2: कार्य जीवनचक्र
  - H2: डिलीवरी और सूचनाएँ
  - H3: सूचना नीतियाँ
  - H2: CLI संदर्भ
  - H2: चैट कार्य बोर्ड (/tasks)
  - H2: स्थिति इंटीग्रेशन (कार्य दबाव)
  - H2: स्टोरेज और रखरखाव
  - H3: कार्य कहाँ रहते हैं
  - H3: स्वचालित रखरखाव
  - H2: कार्य अन्य प्रणालियों से कैसे संबंधित हैं
  - H2: संबंधित

## automation/troubleshooting.md

- मार्ग: /automation/troubleshooting
- शीर्षक:
  - H2: संबंधित

## automation/webhook.md

- मार्ग: /automation/webhook
- शीर्षक:
  - H2: संबंधित

## brave-search.md

- मार्ग: /brave-search
- शीर्षक:
  - H2: संबंधित

## channels/access-groups.md

- मार्ग: /channels/access-groups
- शीर्षक:
  - H2: स्थिर संदेश भेजने वाले समूह
  - H2: allowlists से संदर्भ समूह
  - H2: समर्थित संदेश-चैनल पथ
  - H2: Plugin डायग्नॉस्टिक्स
  - H2: Discord चैनल ऑडियंस
  - H2: सुरक्षा नोट्स
  - H2: समस्या निवारण

## channels/ambient-room-events.md

- मार्ग: /channels/ambient-room-events
- शीर्षक:
  - H2: अनुशंसित सेटअप
  - H2: क्या बदलता है
  - H2: Discord उदाहरण
  - H2: Slack उदाहरण
  - H2: Telegram उदाहरण
  - H2: एजेंट-विशिष्ट नीति
  - H2: दृश्यमान उत्तर मोड
  - H2: इतिहास
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/bot-loop-protection.md

- मार्ग: /channels/bot-loop-protection
- शीर्षक:
  - H1: Bot loop protection
  - H2: डिफ़ॉल्ट
  - H2: साझा डिफ़ॉल्ट कॉन्फ़िगर करें
  - H2: प्रति चैनल या खाते के लिए ओवरराइड करें
  - H2: चैनल समर्थन

## channels/broadcast-groups.md

- मार्ग: /channels/broadcast-groups
- शीर्षक:
  - H2: अवलोकन
  - H2: उपयोग मामले
  - H2: कॉन्फ़िगरेशन
  - H3: बुनियादी सेटअप
  - H3: प्रोसेसिंग रणनीति
  - H3: पूर्ण उदाहरण
  - H2: यह कैसे काम करता है
  - H3: संदेश प्रवाह
  - H3: सेशन आइसोलेशन
  - H3: उदाहरण: अलग-थलग सेशन
  - H2: सर्वोत्तम अभ्यास
  - H2: संगतता
  - H3: Providers
  - H3: रूटिंग
  - H2: समस्या निवारण
  - H2: उदाहरण
  - H2: API संदर्भ
  - H3: कॉन्फ़िग स्कीमा
  - H3: फ़ील्ड
  - H2: सीमाएँ
  - H2: भविष्य के सुधार
  - H2: संबंधित

## channels/channel-routing.md

- मार्ग: /channels/channel-routing
- शीर्षक:
  - H1: चैनल और रूटिंग
  - H2: मुख्य शब्द
  - H2: आउटबाउंड लक्ष्य प्रीफ़िक्स
  - H2: सेशन कुंजी आकार (उदाहरण)
  - H2: मुख्य DM रूट पिनिंग
  - H2: संरक्षित इनबाउंड रिकॉर्डिंग
  - H2: रूटिंग नियम (एजेंट कैसे चुना जाता है)
  - H2: ब्रॉडकास्ट समूह (कई एजेंट चलाएँ)
  - H2: कॉन्फ़िग अवलोकन
  - H2: सेशन स्टोरेज
  - H2: WebChat व्यवहार
  - H2: उत्तर संदर्भ
  - H2: संबंधित

## channels/clickclack.md

- मार्ग: /channels/clickclack
- शीर्षक:
  - H2: त्वरित सेटअप
  - H2: कई bots
  - H2: लक्ष्य
  - H2: अनुमतियाँ
  - H2: समस्या निवारण

## channels/discord.md

- मार्ग: /channels/discord
- शीर्षक:
  - H2: त्वरित सेटअप
  - H2: अनुशंसित: guild workspace सेट करें
  - H2: रनटाइम मॉडल
  - H2: फ़ोरम चैनल
  - H2: इंटरैक्टिव घटक
  - H2: एक्सेस नियंत्रण और रूटिंग
  - H3: भूमिका-आधारित एजेंट रूटिंग
  - H2: नेटिव कमांड और कमांड auth
  - H2: फ़ीचर विवरण
  - H2: टूल्स और action gates
  - H2: Components v2 UI
  - H2: वॉयस
  - H3: वॉयस चैनल
  - H3: वॉयस में उपयोगकर्ताओं को फ़ॉलो करें
  - H3: वॉयस संदेश
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: सुरक्षा और संचालन
  - H2: संबंधित

## channels/feishu.md

- मार्ग: /channels/feishu
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: एक्सेस नियंत्रण
  - H3: डायरेक्ट संदेश
  - H3: समूह चैट
  - H2: समूह कॉन्फ़िगरेशन उदाहरण
  - H3: सभी समूहों की अनुमति दें, @mention आवश्यक नहीं
  - H3: सभी समूहों की अनुमति दें, फिर भी @mention आवश्यक रखें
  - H3: केवल विशिष्ट समूहों की अनुमति दें
  - H3: समूह के भीतर भेजने वालों को सीमित करें
  - H2: समूह/उपयोगकर्ता IDs प्राप्त करें
  - H3: समूह IDs (chatid, फ़ॉर्मेट: ocxxx)
  - H3: उपयोगकर्ता IDs (openid, फ़ॉर्मेट: ouxxx)
  - H2: सामान्य कमांड
  - H2: समस्या निवारण
  - H3: Bot समूह चैट में जवाब नहीं देता
  - H3: Bot संदेश प्राप्त नहीं करता
  - H3: QR सेटअप Feishu मोबाइल ऐप में प्रतिक्रिया नहीं करता
  - H3: App Secret लीक हो गया
  - H2: उन्नत कॉन्फ़िगरेशन
  - H3: कई खाते
  - H3: संदेश सीमाएँ
  - H3: स्ट्रीमिंग
  - H3: कोटा ऑप्टिमाइज़ेशन
  - H3: ACP सेशन
  - H4: स्थायी ACP बाइंडिंग
  - H4: चैट से ACP स्पॉन करें
  - H3: मल्टी-एजेंट रूटिंग
  - H2: प्रति-उपयोगकर्ता एजेंट आइसोलेशन (डायनेमिक एजेंट निर्माण)
  - H3: त्वरित सेटअप
  - H3: यह कैसे काम करता है
  - H3: कॉन्फ़िगरेशन विकल्प
  - H3: सेशन स्कोप
  - H3: सामान्य मल्टी-उपयोगकर्ता डिप्लॉयमेंट
  - H3: सत्यापन
  - H3: नोट्स
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: समर्थित संदेश प्रकार
  - H3: प्राप्त करें
  - H3: भेजें
  - H3: थ्रेड्स और उत्तर
  - H2: संबंधित

## channels/googlechat.md

- मार्ग: /channels/googlechat
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: Google Chat में जोड़ें
  - H2: सार्वजनिक URL (केवल Webhook)
  - H3: विकल्प A: Tailscale Funnel (अनुशंसित)
  - H3: विकल्प B: Reverse Proxy (Caddy)
  - H3: विकल्प C: Cloudflare Tunnel
  - H2: यह कैसे काम करता है
  - H2: लक्ष्य
  - H2: कॉन्फ़िग हाइलाइट्स
  - H2: समस्या निवारण
  - H3: 405 Method Not Allowed
  - H3: अन्य समस्याएँ
  - H2: संबंधित

## channels/group-messages.md

- मार्ग: /channels/group-messages
- शीर्षक:
  - H2: व्यवहार
  - H2: कॉन्फ़िग उदाहरण (WhatsApp)
  - H3: सक्रियण कमांड (केवल owner)
  - H2: कैसे उपयोग करें
  - H2: परीक्षण / सत्यापन
  - H2: ज्ञात विचारणीय बातें
  - H2: संबंधित

## channels/groups.md

- मार्ग: /channels/groups
- शीर्षक:
  - H2: शुरुआती परिचय (2 मिनट)
  - H2: दृश्यमान उत्तर
  - H2: संदर्भ दृश्यता और allowlists
  - H2: सेशन कुंजियाँ
  - H2: पैटर्न: निजी DMs + सार्वजनिक समूह (एकल एजेंट)
  - H2: प्रदर्शन लेबल
  - H2: समूह नीति
  - H2: Mention gating (डिफ़ॉल्ट)
  - H2: कॉन्फ़िगर किए गए mention पैटर्न का स्कोप
  - H2: समूह/चैनल टूल प्रतिबंध (वैकल्पिक)
  - H2: समूह allowlists
  - H2: सक्रियण (केवल owner)
  - H2: संदर्भ फ़ील्ड
  - H2: iMessage विशिष्टताएँ
  - H2: WhatsApp सिस्टम prompts
  - H2: WhatsApp विशिष्टताएँ
  - H2: संबंधित

## channels/imessage-from-bluebubbles.md

- मार्ग: /channels/imessage-from-bluebubbles
- शीर्षक:
  - H2: माइग्रेशन चेकलिस्ट
  - H2: यह माइग्रेशन कब उपयुक्त है
  - H2: imsg क्या करता है
  - H2: शुरू करने से पहले
  - H2: कॉन्फ़िग अनुवाद
  - H2: समूह रजिस्ट्री footgun
  - H2: चरण-दर-चरण
  - H2: एक नज़र में action parity
  - H2: पेयरिंग, सेशन और ACP बाइंडिंग्स
  - H2: कोई rollback channel नहीं
  - H2: संबंधित

## channels/imessage.md

- मार्ग: /channels/imessage
- शीर्षक:
  - H2: त्वरित सेटअप
  - H2: आवश्यकताएँ और अनुमतियाँ (macOS)
  - H2: imsg private API सक्षम करना
  - H3: सेटअप
  - H3: जब आप SIP अक्षम नहीं कर सकते
  - H2: एक्सेस नियंत्रण और रूटिंग
  - H2: ACP conversation bindings
  - H2: डिप्लॉयमेंट पैटर्न
  - H2: मीडिया, चंकिंग और डिलीवरी लक्ष्य
  - H2: Private API actions
  - H2: कॉन्फ़िग writes
  - H2: split-send DMs को कोएलस करना (एक composition में कमांड + URL)
  - H3: परिदृश्य और एजेंट क्या देखता है
  - H2: bridge या gateway restart के बाद inbound recovery
  - H3: ऑपरेटर-दृश्यमान संकेत
  - H3: माइग्रेशन
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ pointers
  - H2: संबंधित

## channels/index.md

- मार्ग: /channels
- शीर्षक:
  - H2: डिलीवरी नोट्स
  - H2: समर्थित चैनल
  - H2: नोट्स

## channels/irc.md

- मार्ग: /channels/irc
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: सुरक्षा डिफ़ॉल्ट
  - H2: एक्सेस नियंत्रण
  - H3: सामान्य gotcha: allowFrom DMs के लिए है, चैनलों के लिए नहीं
  - H2: उत्तर ट्रिगर करना (mentions)
  - H2: सुरक्षा नोट (सार्वजनिक चैनलों के लिए अनुशंसित)
  - H3: चैनल में सभी के लिए समान टूल
  - H3: प्रति भेजने वाले अलग टूल (owner को अधिक शक्ति मिलती है)
  - H2: NickServ
  - H2: एनवायरनमेंट वेरिएबल्स
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/line.md

- मार्ग: /channels/line
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: सेटअप
  - H2: कॉन्फ़िगर करें
  - H2: अभिगम नियंत्रण
  - H2: संदेश व्यवहार
  - H2: चैनल डेटा (रिच संदेश)
  - H2: ACP समर्थन
  - H2: आउटबाउंड मीडिया
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/location.md

- मार्ग: /channels/location
- शीर्षक:
  - H2: टेक्स्ट फ़ॉर्मैटिंग
  - H2: संदर्भ फ़ील्ड
  - H2: चैनल नोट्स
  - H2: संबंधित

## channels/matrix-migration.md

- मार्ग: /channels/matrix-migration
- शीर्षक:
  - H2: माइग्रेशन अपने-आप क्या करता है
  - H2: माइग्रेशन अपने-आप क्या नहीं कर सकता
  - H2: अनुशंसित अपग्रेड प्रवाह
  - H2: एन्क्रिप्टेड माइग्रेशन कैसे काम करता है
  - H2: सामान्य संदेश और उनका अर्थ
  - H3: अपग्रेड और पहचान संदेश
  - H3: एन्क्रिप्टेड-स्थिति रिकवरी संदेश
  - H3: मैनुअल रिकवरी संदेश
  - H3: कस्टम Plugin इंस्टॉल संदेश
  - H2: अगर एन्क्रिप्टेड इतिहास फिर भी वापस नहीं आता
  - H2: अगर आप भविष्य के संदेशों के लिए नए सिरे से शुरू करना चाहते हैं
  - H2: संबंधित

## channels/matrix-presentation.md

- मार्ग: /channels/matrix-presentation
- शीर्षक:
  - H2: इवेंट सामग्री
  - H2: Fallback व्यवहार
  - H2: समर्थित ब्लॉक
  - H2: इंटरैक्शन
  - H2: स्वीकृति मेटाडेटा से संबंध
  - H2: मीडिया संदेश

## channels/matrix-push-rules.md

- मार्ग: /channels/matrix-push-rules
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: चरण
  - H2: मल्टी-बॉट नोट्स
  - H2: होमसर्वर नोट्स
  - H2: संबंधित

## channels/matrix.md

- मार्ग: /channels/matrix
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: सेटअप
  - H3: इंटरैक्टिव सेटअप
  - H3: न्यूनतम कॉन्फ़िगरेशन
  - H3: ऑटो-जॉइन
  - H3: Allowlist लक्ष्य फ़ॉर्मैट
  - H3: खाता ID सामान्यीकरण
  - H3: कैश किए गए क्रेडेंशियल
  - H3: एनवायरनमेंट वैरिएबल
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H2: स्ट्रीमिंग प्रीव्यू
  - H2: वॉइस संदेश
  - H2: स्वीकृति मेटाडेटा
  - H3: शांत अंतिम प्रीव्यू के लिए स्व-होस्टेड पुश नियम
  - H2: बॉट-से-बॉट रूम
  - H2: एन्क्रिप्शन और सत्यापन
  - H3: एन्क्रिप्शन सक्षम करें
  - H3: स्थिति और भरोसा संकेत
  - H3: इस डिवाइस को रिकवरी कुंजी से सत्यापित करें
  - H3: क्रॉस-साइनिंग बूटस्ट्रैप या मरम्मत करें
  - H3: रूम-कुंजी बैकअप
  - H3: सत्यापन सूचीबद्ध करना, अनुरोध करना और उनका जवाब देना
  - H3: मल्टी-अकाउंट नोट्स
  - H2: प्रोफ़ाइल प्रबंधन
  - H2: थ्रेड
  - H3: सेशन रूटिंग (sessionScope)
  - H3: रिप्लाई थ्रेडिंग (threadReplies)
  - H3: थ्रेड इनहेरिटेंस और स्लैश कमांड
  - H2: ACP बातचीत बाइंडिंग
  - H3: थ्रेड बाइंडिंग कॉन्फ़िग
  - H2: प्रतिक्रियाएँ
  - H2: इतिहास संदर्भ
  - H2: संदर्भ दृश्यता
  - H2: DM और रूम नीति
  - H2: डायरेक्ट रूम मरम्मत
  - H2: Exec स्वीकृतियाँ
  - H2: स्लैश कमांड
  - H2: मल्टी-अकाउंट
  - H2: निजी/LAN होमसर्वर
  - H2: Matrix ट्रैफ़िक की प्रॉक्सी करना
  - H2: लक्ष्य समाधान
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H3: खाता और कनेक्शन
  - H3: एन्क्रिप्शन
  - H3: अभिगम और नीति
  - H3: रिप्लाई व्यवहार
  - H3: प्रतिक्रिया सेटिंग
  - H3: टूलिंग और प्रति-रूम ओवरराइड
  - H3: Exec स्वीकृति सेटिंग
  - H2: संबंधित

## channels/mattermost.md

- मार्ग: /channels/mattermost
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: त्वरित सेटअप
  - H2: नेटिव स्लैश कमांड
  - H2: एनवायरनमेंट वैरिएबल (डिफ़ॉल्ट खाता)
  - H2: चैट मोड
  - H2: थ्रेडिंग और सेशन
  - H2: अभिगम नियंत्रण (DMs)
  - H2: चैनल (समूह)
  - H2: आउटबाउंड डिलीवरी के लक्ष्य
  - H2: DM चैनल पुनःप्रयास
  - H2: प्रीव्यू स्ट्रीमिंग
  - H2: प्रतिक्रियाएँ (संदेश टूल)
  - H2: इंटरैक्टिव बटन (संदेश टूल)
  - H3: प्रत्यक्ष API इंटीग्रेशन (बाहरी स्क्रिप्ट)
  - H2: डायरेक्टरी अडैप्टर
  - H2: मल्टी-अकाउंट
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/msteams.md

- मार्ग: /channels/msteams
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप
  - H2: लक्ष्य
  - H2: कॉन्फ़िग लेखन
  - H2: अभिगम नियंत्रण (DMs + समूह)
  - H3: यह कैसे काम करता है
  - H3: चरण 1: Azure Bot बनाएं
  - H3: चरण 2: क्रेडेंशियल प्राप्त करें
  - H3: चरण 3: Messaging Endpoint कॉन्फ़िगर करें
  - H3: चरण 4: Teams Channel सक्षम करें
  - H3: चरण 5: Teams App Manifest बनाएं
  - H3: चरण 6: OpenClaw कॉन्फ़िगर करें
  - H3: चरण 7: Gateway चलाएँ
  - H2: फ़ेडरेटेड प्रमाणीकरण (सर्टिफ़िकेट और managed identity)
  - H3: विकल्प A: सर्टिफ़िकेट-आधारित प्रमाणीकरण
  - H3: विकल्प B: Azure Managed Identity
  - H3: AKS Workload Identity सेटअप
  - H3: प्रमाणीकरण प्रकार तुलना
  - H2: स्थानीय विकास (टनलिंग)
  - H2: Bot का परीक्षण
  - H2: एनवायरनमेंट वैरिएबल
  - H2: सदस्य जानकारी क्रिया
  - H2: इतिहास संदर्भ
  - H2: वर्तमान Teams RSC अनुमतियाँ (manifest)
  - H2: उदाहरण Teams manifest (संशोधित)
  - H3: Manifest सावधानियाँ (अनिवार्य फ़ील्ड)
  - H3: मौजूदा ऐप अपडेट करना
  - H2: क्षमताएँ: केवल RSC बनाम Graph
  - H3: केवल Teams RSC के साथ (ऐप इंस्टॉल, कोई Graph API अनुमति नहीं)
  - H3: Teams RSC + Microsoft Graph Application अनुमतियों के साथ
  - H3: RSC बनाम Graph API
  - H2: Graph-सक्षम मीडिया + इतिहास (चैनलों के लिए आवश्यक)
  - H2: ज्ञात सीमाएँ
  - H3: Webhook टाइमआउट
  - H3: Teams cloud और सेवा URL समर्थन
  - H3: फ़ॉर्मैटिंग
  - H2: कॉन्फ़िगरेशन
  - H2: रूटिंग और सेशन
  - H2: रिप्लाई शैली: थ्रेड बनाम पोस्ट
  - H3: समाधान प्राथमिकता
  - H3: थ्रेड संदर्भ संरक्षण
  - H2: अटैचमेंट और इमेज
  - H2: समूह चैट में फ़ाइलें भेजना
  - H3: समूह चैट को SharePoint की ज़रूरत क्यों होती है
  - H3: सेटअप
  - H3: साझाकरण व्यवहार
  - H3: Fallback व्यवहार
  - H3: फ़ाइलें संग्रहीत स्थान
  - H2: पोल (Adaptive Cards)
  - H2: प्रस्तुति कार्ड
  - H2: लक्ष्य फ़ॉर्मैट
  - H2: प्रोएक्टिव मैसेजिंग
  - H2: टीम और चैनल IDs (सामान्य चूक)
  - H2: निजी चैनल
  - H2: समस्या निवारण
  - H3: सामान्य समस्याएँ
  - H3: Manifest अपलोड त्रुटियाँ
  - H3: RSC अनुमतियाँ काम नहीं कर रहीं
  - H2: संदर्भ
  - H2: संबंधित

## channels/nextcloud-talk.md

- मार्ग: /channels/nextcloud-talk
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: नोट्स
  - H2: अभिगम नियंत्रण (DMs)
  - H2: रूम (समूह)
  - H2: क्षमताएँ
  - H2: कॉन्फ़िगरेशन संदर्भ (Nextcloud Talk)
  - H2: संबंधित

## channels/nostr.md

- मार्ग: /channels/nostr
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H3: पुराने/कस्टम इंस्टॉल
  - H3: गैर-इंटरैक्टिव सेटअप
  - H2: त्वरित सेटअप
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: प्रोफ़ाइल मेटाडेटा
  - H2: अभिगम नियंत्रण
  - H3: DM नीतियाँ
  - H3: Allowlist उदाहरण
  - H2: कुंजी फ़ॉर्मैट
  - H2: रिले
  - H2: प्रोटोकॉल समर्थन
  - H2: परीक्षण
  - H3: स्थानीय रिले
  - H3: मैनुअल परीक्षण
  - H2: समस्या निवारण
  - H3: संदेश प्राप्त नहीं हो रहे
  - H3: जवाब नहीं भेजे जा रहे
  - H3: डुप्लिकेट जवाब
  - H2: सुरक्षा
  - H2: सीमाएँ (MVP)
  - H2: संबंधित

## channels/pairing.md

- मार्ग: /channels/pairing
- शीर्षक:
  - H2: 1) DM पेयरिंग (इनबाउंड चैट अभिगम)
  - H3: प्रेषक को स्वीकृत करें
  - H3: पुनःप्रयोज्य प्रेषक समूह
  - H3: स्थिति कहाँ रहती है
  - H2: 2) Node डिवाइस पेयरिंग (iOS/Android/macOS/headless nodes)
  - H3: Telegram के ज़रिए पेयर करें (iOS के लिए अनुशंसित)
  - H3: Node डिवाइस स्वीकृत करें
  - H3: वैकल्पिक विश्वसनीय-CIDR Node ऑटो-स्वीकृति
  - H3: Node पेयरिंग स्थिति संग्रहण
  - H3: नोट्स
  - H2: संबंधित दस्तावेज़

## channels/qa-channel.md

- मार्ग: /channels/qa-channel
- शीर्षक:
  - H2: यह क्या करता है
  - H2: कॉन्फ़िग
  - H2: रनर
  - H2: संबंधित

## channels/qqbot.md

- मार्ग: /channels/qqbot
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: सेटअप
  - H2: कॉन्फ़िगर करें
  - H3: मल्टी-अकाउंट सेटअप
  - H3: समूह चैट
  - H3: वॉइस (STT / TTS)
  - H2: लक्ष्य फ़ॉर्मैट
  - H2: स्लैश कमांड
  - H2: इंजन आर्किटेक्चर
  - H2: QR-code ऑनबोर्डिंग
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/raft.md

- मार्ग: /channels/raft
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: पूर्वापेक्षाएँ
  - H2: कॉन्फ़िगर करें
  - H2: यह कैसे काम करता है
  - H2: सत्यापित करें
  - H2: समस्या निवारण
  - H2: संदर्भ

## channels/signal.md

- मार्ग: /channels/signal
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: कॉन्फ़िग लेखन
  - H2: नंबर मॉडल (महत्वपूर्ण)
  - H2: सेटअप पथ A: मौजूदा Signal खाते को लिंक करें (QR)
  - H2: सेटअप पथ B: समर्पित बॉट नंबर पंजीकृत करें (SMS, Linux)
  - H2: बाहरी daemon मोड (httpUrl)
  - H2: कंटेनर मोड (bbernhard/signal-cli-rest-api)
  - H2: अभिगम नियंत्रण (DMs + समूह)
  - H2: यह कैसे काम करता है (व्यवहार)
  - H2: मीडिया + सीमाएँ
  - H2: टाइपिंग + read receipts
  - H2: Lifecycle स्थिति प्रतिक्रियाएँ
  - H2: प्रतिक्रियाएँ (संदेश टूल)
  - H2: स्वीकृति प्रतिक्रियाएँ
  - H2: डिलीवरी लक्ष्य (CLI/cron)
  - H2: उपनाम
  - H2: समस्या निवारण
  - H2: सुरक्षा नोट्स
  - H2: कॉन्फ़िगरेशन संदर्भ (Signal)
  - H2: संबंधित

## channels/slack.md

- मार्ग: /channels/slack
- शीर्षक:
  - H2: Socket Mode या HTTP Request URLs चुनना
  - H3: रिले मोड
  - H2: इंस्टॉल करें
  - H2: त्वरित सेटअप
  - H2: Socket Mode ट्रांसपोर्ट ट्यूनिंग
  - H2: Manifest और scope चेकलिस्ट
  - H3: अतिरिक्त manifest सेटिंग
  - H2: टोकन मॉडल
  - H2: क्रियाएँ और गेट
  - H2: अभिगम नियंत्रण और रूटिंग
  - H2: थ्रेडिंग, सेशन और रिप्लाई टैग
  - H2: Ack प्रतिक्रियाएँ
  - H3: Emoji (ackReaction)
  - H3: Scope (messages.ackReactionScope)
  - H2: टेक्स्ट स्ट्रीमिंग
  - H2: टाइपिंग प्रतिक्रिया Fallback
  - H2: मीडिया, चंकिंग और डिलीवरी
  - H2: कमांड और स्लैश व्यवहार
  - H2: इंटरैक्टिव रिप्लाई
  - H3: Plugin-स्वामित्व वाले modal submissions
  - H2: Slack में नेटिव स्वीकृतियाँ
  - H2: इवेंट और संचालन व्यवहार
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: समस्या निवारण
  - H2: अटैचमेंट विज़न संदर्भ
  - H3: समर्थित मीडिया प्रकार
  - H3: इनबाउंड पाइपलाइन
  - H3: थ्रेड-रूट अटैचमेंट इनहेरिटेंस
  - H3: मल्टी-अटैचमेंट हैंडलिंग
  - H3: आकार, डाउनलोड और मॉडल सीमाएँ
  - H3: ज्ञात सीमाएँ
  - H3: संबंधित दस्तावेज़
  - H2: संबंधित

## channels/sms.md

- मार्ग: /channels/sms
- शीर्षक:
  - H2: शुरू करने से पहले
  - H2: त्वरित सेटअप
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H3: कॉन्फ़िग फ़ाइल
  - H3: एनवायरनमेंट वैरिएबल
  - H3: SecretRef प्रमाणीकरण टोकन
  - H3: केवल-Allowlist निजी नंबर
  - H3: Messaging Service प्रेषक
  - H3: डिफ़ॉल्ट आउटबाउंड लक्ष्य
  - H2: अभिगम नियंत्रण
  - H2: SMS भेजना
  - H2: सेटअप सत्यापित करें
  - H3: macOS iMessage/SMS से end-to-end परीक्षण
  - H2: Webhook सुरक्षा
  - H2: मल्टी-अकाउंट कॉन्फ़िग
  - H2: समस्या निवारण
  - H3: Twilio 403 लौटाता है या OpenClaw Webhook अस्वीकार करता है
  - H3: कोई पेयरिंग अनुरोध दिखाई नहीं देता
  - H3: आउटबाउंड भेजना विफल होता है
  - H3: संदेश आते हैं लेकिन एजेंट जवाब नहीं देता

## channels/synology-chat.md

- मार्ग: /channels/synology-chat
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप
  - H2: एनवायरनमेंट वैरिएबल
  - H2: DM नीति और अभिगम नियंत्रण
  - H2: आउटबाउंड डिलीवरी
  - H2: मल्टी-अकाउंट
  - H2: सुरक्षा नोट्स
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/telegram.md

- मार्ग: /channels/telegram
- शीर्षक:
  - H2: त्वरित सेटअप
  - H2: Telegram साइड सेटिंग
  - H2: अभिगम नियंत्रण और सक्रियण
  - H3: समूह बॉट पहचान
  - H2: रनटाइम व्यवहार
  - H2: फ़ीचर संदर्भ
  - H2: त्रुटि रिप्लाई नियंत्रण
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: संबंधित

## channels/tlon.md

- मार्ग: /channels/tlon
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: सेटअप
  - H2: निजी/LAN ships
  - H2: समूह चैनल
  - H2: अभिगम नियंत्रण
  - H2: स्वामी और स्वीकृति प्रणाली
  - H2: ऑटो-स्वीकार सेटिंग
  - H2: डिलीवरी लक्ष्य (CLI/cron)
  - H2: बंडल की गई skill
  - H2: क्षमताएँ
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: नोट्स
  - H2: संबंधित

## channels/troubleshooting.md

- मार्ग: /channels/troubleshooting
- शीर्षक:
  - H2: कमांड ladder
  - H2: अपडेट के बाद
  - H2: WhatsApp
  - H3: WhatsApp विफलता संकेत
  - H2: Telegram
  - H3: Telegram विफलता संकेत
  - H2: Discord
  - H3: Discord विफलता संकेत
  - H2: Slack
  - H3: Slack विफलता संकेत
  - H2: iMessage
  - H3: iMessage विफलता संकेत
  - H2: Signal
  - H3: Signal विफलता संकेत
  - H2: QQ Bot
  - H3: QQ Bot विफलता संकेत
  - H2: Matrix
  - H3: Matrix विफलता संकेत
  - H2: संबंधित

## channels/twitch.md

- रूट: /channels/twitch
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: सेटअप (विस्तृत)
  - H3: क्रेडेंशियल जनरेट करें
  - H3: bot कॉन्फ़िगर करें
  - H3: एक्सेस नियंत्रण (अनुशंसित)
  - H2: Token refresh (वैकल्पिक)
  - H2: Multi-account समर्थन
  - H2: एक्सेस नियंत्रण
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन
  - H3: अकाउंट कॉन्फ़िगरेशन
  - H3: Provider विकल्प
  - H2: Tool actions
  - H2: सुरक्षा और संचालन
  - H2: सीमाएँ
  - H2: संबंधित

## channels/wechat.md

- रूट: /channels/wechat
- शीर्षक:
  - H2: नामकरण
  - H2: यह कैसे काम करता है
  - H2: इंस्टॉल करें
  - H2: लॉगिन
  - H2: एक्सेस नियंत्रण
  - H2: संगतता
  - H2: Sidecar process
  - H2: समस्या निवारण
  - H2: संबंधित दस्तावेज़

## channels/whatsapp.md

- रूट: /channels/whatsapp
- शीर्षक:
  - H2: इंस्टॉल करें (मांग पर)
  - H2: त्वरित सेटअप
  - H2: Deployment patterns
  - H2: Runtime model
  - H2: Approval prompts
  - H2: Plugin hooks और गोपनीयता
  - H2: एक्सेस नियंत्रण और सक्रियण
  - H2: कॉन्फ़िगर किए गए ACP bindings
  - H2: Personal-number और self-chat व्यवहार
  - H2: Message normalization और context
  - H2: Delivery, chunking, और media
  - H2: Reply quoting
  - H2: Reaction level
  - H2: Acknowledgment reactions
  - H2: Lifecycle status reactions
  - H2: Multi-account और credentials
  - H2: Tools, actions, और config writes
  - H2: समस्या निवारण
  - H2: System prompts
  - H2: Configuration reference pointers
  - H2: संबंधित

## channels/yuanbao.md

- रूट: /channels/yuanbao
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: इंटरैक्टिव सेटअप (वैकल्पिक)
  - H2: एक्सेस नियंत्रण
  - H3: Direct messages
  - H3: Group chats
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H3: खुली DM नीति के साथ बुनियादी सेटअप
  - H3: DMs को विशिष्ट उपयोगकर्ताओं तक सीमित करें
  - H3: समूहों में @mention आवश्यकता अक्षम करें
  - H3: Outbound message delivery ऑप्टिमाइज़ करें
  - H3: Merge-text रणनीति ट्यून करें
  - H2: सामान्य कमांड
  - H2: समस्या निवारण
  - H3: Bot group chats में प्रतिक्रिया नहीं देता
  - H3: Bot संदेश प्राप्त नहीं करता
  - H3: Bot खाली या fallback replies भेजता है
  - H3: App Secret लीक हो गया
  - H2: उन्नत कॉन्फ़िगरेशन
  - H3: कई अकाउंट
  - H3: Message limits
  - H3: Streaming
  - H3: Group chat history context
  - H3: Reply-to mode
  - H3: Markdown hint injection
  - H3: Debug mode
  - H3: Multi-agent routing
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: समर्थित message types
  - H3: प्राप्त करें
  - H3: भेजें
  - H3: Threads और replies
  - H2: संबंधित

## channels/zalo.md

- रूट: /channels/zalo
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: सेटअप (तेज़ पथ)
  - H3: 1) bot token बनाएं (Zalo Bot Platform)
  - H3: 2) token कॉन्फ़िगर करें (env या config)
  - H2: यह कैसे काम करता है (व्यवहार)
  - H2: सीमाएँ
  - H2: एक्सेस नियंत्रण (DMs)
  - H3: DM access
  - H2: एक्सेस नियंत्रण (Groups)
  - H2: Long-polling बनाम webhook
  - H2: समर्थित message types
  - H2: क्षमताएँ
  - H2: Delivery targets (CLI/Cron)
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ (Zalo)
  - H2: संबंधित

## channels/zaloclawbot.md

- रूट: /channels/zaloclawbot
- शीर्षक:
  - H2: संगतता
  - H2: पूर्वापेक्षाएँ
  - H2: onboard के साथ इंस्टॉल करें (अनुशंसित)
  - H2: मैनुअल इंस्टॉलेशन
  - H3: 1. Plugin इंस्टॉल करें
  - H3: 2. config में Plugin सक्षम करें
  - H3: 3. QR code जनरेट करें और लॉगिन करें
  - H3: 4. gateway पुनः शुरू करें
  - H2: यह कैसे काम करता है
  - H2: आंतरिक कार्यप्रणाली
  - H2: समस्या निवारण

## channels/zalouser.md

- रूट: /channels/zalouser
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: नामकरण
  - H2: IDs ढूंढना (directory)
  - H2: सीमाएँ
  - H2: एक्सेस नियंत्रण (DMs)
  - H2: Group access (वैकल्पिक)
  - H3: Group mention gating
  - H2: Multi-account
  - H2: Environment variables
  - H2: Typing, reactions, और delivery acknowledgements
  - H2: समस्या निवारण
  - H2: संबंधित

## ci.md

- रूट: /ci
- शीर्षक:
  - H2: Pipeline overview
  - H2: Fail-fast order
  - H2: PR context और evidence
  - H2: Scope और routing
  - H2: ClawSweeper activity forwarding
  - H2: Manual dispatches
  - H2: Runners
  - H2: Runner registration budget
  - H2: Local equivalents
  - H2: OpenClaw Performance
  - H2: Full Release Validation
  - H2: Live और E2E shards
  - H2: Package Acceptance
  - H3: Jobs
  - H3: Candidate sources
  - H3: Suite profiles
  - H3: Legacy compatibility windows
  - H3: उदाहरण
  - H2: Install smoke
  - H2: Local Docker E2E
  - H3: Tunables
  - H3: Reusable live/E2E workflow
  - H3: Release-path chunks
  - H2: Plugin Prerelease
  - H2: QA Lab
  - H2: CodeQL
  - H3: Security categories
  - H3: Platform-specific security shards
  - H3: Critical Quality categories
  - H2: Maintenance workflows
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: Merge के बाद Duplicate PRs
  - H2: Local check gates और changed routing
  - H2: Testbox validation
  - H2: संबंधित

## clawhub/cli.md

- रूट: /clawhub/cli
- शीर्षक:
  - H1: ClawHub CLI
  - H2: खोजें और इंस्टॉल करें
  - H2: प्रकाशित करें और बनाए रखें
  - H2: संबंधित

## clawhub/publishing.md

- रूट: /clawhub/publishing
- शीर्षक:
  - H1: ClawHub पर प्रकाशन
  - H2: Owners
  - H2: Skills
  - H2: Plugins
  - H2: Release Flow
  - H2: FAQ
  - H3: Package scope चयनित owner से मेल खाना चाहिए

## cli/acp.md

- रूट: /cli/acp
- शीर्षक:
  - H2: यह क्या नहीं है
  - H2: Compatibility Matrix
  - H2: ज्ञात सीमाएँ
  - H2: उपयोग
  - H2: ACP client (debug)
  - H2: Protocol smoke testing
  - H2: इसका उपयोग कैसे करें
  - H2: agents चुनना
  - H2: acpx से उपयोग करें (Codex, Claude, अन्य ACP clients)
  - H2: Zed editor setup
  - H2: Session mapping
  - H2: विकल्प
  - H3: acp client options
  - H2: संबंधित

## cli/agent.md

- रूट: /cli/agent
- शीर्षक:
  - H1: openclaw agent
  - H2: विकल्प
  - H2: उदाहरण
  - H2: नोट्स
  - H2: JSON delivery status
  - H2: संबंधित

## cli/agents.md

- रूट: /cli/agents
- शीर्षक:
  - H1: openclaw agents
  - H2: उदाहरण
  - H2: Routing bindings
  - H3: --bind format
  - H3: Binding scope behavior
  - H2: Command surface
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete &lt;id&gt;
  - H2: Identity files
  - H2: Identity सेट करें
  - H2: संबंधित

## cli/approvals.md

- रूट: /cli/approvals
- शीर्षक:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: सामान्य कमांड
  - H2: किसी फ़ाइल से approvals बदलें
  - H2: "Never prompt" / YOLO उदाहरण
  - H2: Allowlist helpers
  - H2: सामान्य विकल्प
  - H2: नोट्स
  - H2: संबंधित

## cli/attach.md

- रूट: /cli/attach
- शीर्षक: कोई नहीं

## cli/backup.md

- रूट: /cli/backup
- शीर्षक:
  - H1: openclaw backup
  - H2: नोट्स
  - H2: क्या backup होता है
  - H2: अमान्य config व्यवहार
  - H2: आकार और प्रदर्शन
  - H2: संबंधित

## cli/browser.md

- रूट: /cli/browser
- शीर्षक:
  - H1: openclaw browser
  - H2: सामान्य flags
  - H2: त्वरित शुरुआत (local)
  - H2: त्वरित समस्या निवारण
  - H2: Lifecycle
  - H2: यदि command अनुपलब्ध है
  - H2: Profiles
  - H2: Tabs
  - H2: Snapshot / screenshot / actions
  - H2: State और storage
  - H2: Debugging
  - H2: MCP के माध्यम से मौजूदा Chrome
  - H2: Remote browser control (node host proxy)
  - H2: संबंधित

## cli/channels.md

- रूट: /cli/channels
- शीर्षक:
  - H1: openclaw channels
  - H2: सामान्य कमांड
  - H2: Status / capabilities / resolve / logs
  - H2: अकाउंट जोड़ें / हटाएँ
  - H2: Login और logout (interactive)
  - H2: समस्या निवारण
  - H2: Capabilities probe
  - H2: नामों को IDs में resolve करें
  - H2: संबंधित

## cli/clawbot.md

- रूट: /cli/clawbot
- शीर्षक:
  - H1: openclaw clawbot
  - H2: Migration
  - H2: संबंधित

## cli/commitments.md

- रूट: /cli/commitments
- शीर्षक:
  - H2: उपयोग
  - H2: विकल्प
  - H2: उदाहरण
  - H2: Output
  - H2: संबंधित

## cli/completion.md

- रूट: /cli/completion
- शीर्षक:
  - H1: openclaw completion
  - H2: उपयोग
  - H2: विकल्प
  - H2: नोट्स
  - H2: संबंधित

## cli/config.md

- रूट: /cli/config
- शीर्षक:
  - H2: Root options
  - H2: उदाहरण
  - H3: config schema
  - H3: Paths
  - H2: Values
  - H2: config set modes
  - H2: config patch
  - H2: Provider builder flags
  - H2: Dry run
  - H3: JSON output shape
  - H2: Write safety
  - H2: Subcommands
  - H2: Validate
  - H2: संबंधित

## cli/configure.md

- रूट: /cli/configure
- शीर्षक:
  - H1: openclaw configure
  - H2: विकल्प
  - H2: उदाहरण
  - H2: संबंधित

## cli/crestodian.md

- रूट: /cli/crestodian
- शीर्षक:
  - H1: openclaw crestodian
  - H2: Crestodian क्या दिखाता है
  - H2: उदाहरण
  - H2: सुरक्षित startup
  - H2: Operations और approval
  - H2: Setup bootstrap
  - H2: Model-Assisted Planner
  - H2: किसी agent पर स्विच करना
  - H2: Message rescue mode
  - H2: संबंधित

## cli/cron.md

- रूट: /cli/cron
- शीर्षक:
  - H1: openclaw cron
  - H2: जल्दी jobs बनाएं
  - H2: Sessions
  - H2: Delivery
  - H3: Delivery ownership
  - H3: Failure delivery
  - H2: Scheduling
  - H3: One-shot jobs
  - H3: Recurring jobs
  - H3: Manual runs
  - H2: Models
  - H3: Isolated cron model precedence
  - H3: Fast mode
  - H3: Live model switch retries
  - H2: Run output और denials
  - H3: Stale acknowledgement suppression
  - H3: Silent token suppression
  - H3: Structured denials
  - H2: Retention
  - H2: पुराने jobs माइग्रेट करना
  - H2: सामान्य edits
  - H2: सामान्य admin commands
  - H2: संबंधित

## cli/daemon.md

- रूट: /cli/daemon
- शीर्षक:
  - H1: openclaw daemon
  - H2: उपयोग
  - H2: Subcommands
  - H2: सामान्य विकल्प
  - H2: Prefer
  - H2: संबंधित

## cli/dashboard.md

- रूट: /cli/dashboard
- शीर्षक:
  - H1: openclaw dashboard
  - H2: संबंधित

## cli/devices.md

- रूट: /cli/devices
- शीर्षक:
  - H1: openclaw devices
  - H2: Commands
  - H3: openclaw devices list
  - H3: openclaw devices remove &lt;deviceId&gt;
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Paperclip / openclawgateway first-run approval
  - H3: openclaw devices reject &lt;requestId&gt;
  - H3: openclaw devices rotate --device &lt;id&gt; --role &lt;role&gt; [--scope &lt;scope...&gt;]
  - H3: openclaw devices revoke --device &lt;id&gt; --role &lt;role&gt;
  - H2: सामान्य विकल्प
  - H2: नोट्स
  - H2: Token drift recovery checklist
  - H2: संबंधित

## cli/directory.md

- रूट: /cli/directory
- शीर्षक:
  - H1: openclaw directory
  - H2: सामान्य flags
  - H2: नोट्स
  - H2: परिणामों का message send के साथ उपयोग
  - H2: ID formats (channel के अनुसार)
  - H2: Self ("me")
  - H2: Peers (contacts/users)
  - H2: Groups
  - H2: संबंधित

## cli/dns.md

- रूट: /cli/dns
- शीर्षक:
  - H1: openclaw dns
  - H2: सेटअप
  - H2: dns setup
  - H2: संबंधित

## cli/docs.md

- रूट: /cli/docs
- शीर्षक:
  - H1: openclaw docs
  - H2: उपयोग
  - H2: उदाहरण
  - H2: यह कैसे काम करता है
  - H2: Output
  - H2: Exit codes
  - H2: संबंधित

## cli/doctor.md

- रूट: /cli/doctor
- शीर्षक:
  - H1: openclaw doctor
  - H2: इसका उपयोग क्यों करें
  - H2: उदाहरण
  - H2: विकल्प
  - H2: Lint mode
  - H2: Structured Health Checks
  - H2: Check Selection
  - H2: Post-upgrade mode
  - H2: macOS: launchctl env overrides
  - H2: संबंधित

## cli/flows.md

- रूट: /cli/flows
- शीर्षक:
  - H1: openclaw tasks flow
  - H2: Subcommands
  - H3: Status filter values
  - H2: उदाहरण
  - H2: संबंधित

## cli/gateway.md

- रूट: /cli/gateway
- शीर्षक:
  - H2: Gateway चलाएँ
  - H3: विकल्प
  - H2: Gateway पुनः शुरू करें
  - H3: Gateway profiling
  - H2: चल रहे Gateway से query करें
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: SSH पर remote (Mac app parity)
  - H3: gateway call &lt;method&gt;
  - H2: Gateway service प्रबंधित करें
  - H3: wrapper के साथ इंस्टॉल करें
  - H2: gateways खोजें (Bonjour)
  - H3: gateway discover
  - H2: संबंधित

## cli/health.md

- रूट: /cli/health
- शीर्षक:
  - H1: openclaw health
  - H2: विकल्प
  - H2: संबंधित

## cli/hooks.md

- मार्ग: /cli/hooks
- शीर्षक:
  - H1: openclaw हुक्स
  - H2: सभी हुक्स सूचीबद्ध करें
  - H2: हुक जानकारी प्राप्त करें
  - H2: हुक्स की पात्रता जांचें
  - H2: एक Hook सक्षम करें
  - H2: एक Hook अक्षम करें
  - H2: टिप्पणियां
  - H2: हुक पैक इंस्टॉल करें
  - H2: हुक पैक अपडेट करें
  - H2: बंडल किए गए हुक्स
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: संबंधित

## cli/index.md

- मार्ग: /cli
- शीर्षक:
  - H2: कमांड पृष्ठ
  - H2: ग्लोबल फ्लैग
  - H2: आउटपुट मोड
  - H2: कमांड ट्री
  - H2: चैट स्लैश कमांड
  - H2: उपयोग ट्रैकिंग
  - H2: संबंधित

## cli/infer.md

- मार्ग: /cli/infer
- शीर्षक:
  - H2: infer को skill में बदलें
  - H2: infer का उपयोग क्यों करें
  - H2: कमांड ट्री
  - H2: सामान्य कार्य
  - H2: व्यवहार
  - H2: मॉडल
  - H2: छवि
  - H2: ऑडियो
  - H2: TTS
  - H2: वीडियो
  - H2: वेब
  - H2: एम्बेडिंग
  - H2: JSON आउटपुट
  - H2: सामान्य कमियां
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/logs.md

- मार्ग: /cli/logs
- शीर्षक:
  - H1: openclaw लॉग
  - H2: विकल्प
  - H2: साझा Gateway RPC विकल्प
  - H2: उदाहरण
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/mcp.md

- मार्ग: /cli/mcp
- शीर्षक:
  - H2: सही MCP पथ चुनें
  - H2: MCP सर्वर के रूप में OpenClaw
  - H3: serve का उपयोग कब करें
  - H3: यह कैसे काम करता है
  - H3: क्लाइंट मोड चुनें
  - H3: serve क्या एक्सपोज करता है
  - H3: उपयोग
  - H3: ब्रिज टूल
  - H3: इवेंट मॉडल
  - H3: Claude चैनल सूचनाएं
  - H3: MCP क्लाइंट कॉन्फिग
  - H3: विकल्प
  - H3: सुरक्षा और विश्वास सीमा
  - H3: परीक्षण
  - H3: समस्या निवारण
  - H2: MCP क्लाइंट रजिस्ट्री के रूप में OpenClaw
  - H3: सहेजी गई MCP सर्वर परिभाषाएं
  - H3: सामान्य सर्वर रेसिपी
  - H3: JSON आउटपुट आकार
  - H3: Stdio ट्रांसपोर्ट
  - H3: SSE / HTTP ट्रांसपोर्ट
  - H3: OAuth वर्कफ़्लो
  - H3: स्ट्रीम करने योग्य HTTP ट्रांसपोर्ट
  - H2: नियंत्रण UI
  - H2: मौजूदा सीमाएं
  - H2: संबंधित

## cli/memory.md

- मार्ग: /cli/memory
- शीर्षक:
  - H1: openclaw मेमोरी
  - H2: उदाहरण
  - H2: विकल्प
  - H2: Dreaming
  - H2: संबंधित

## cli/message.md

- मार्ग: /cli/message
- शीर्षक:
  - H1: openclaw संदेश
  - H2: उपयोग
  - H2: सामान्य फ्लैग
  - H2: SecretRef व्यवहार
  - H2: क्रियाएं
  - H3: कोर
  - H3: थ्रेड
  - H3: इमोजी
  - H3: स्टिकर
  - H3: भूमिकाएं / चैनल / सदस्य / वॉइस
  - H3: इवेंट
  - H3: मॉडरेशन (Discord)
  - H3: ब्रॉडकास्ट
  - H2: उदाहरण
  - H2: संबंधित

## cli/migrate.md

- मार्ग: /cli/migrate
- शीर्षक:
  - H1: openclaw माइग्रेट
  - H2: कमांड
  - H2: सुरक्षा मॉडल
  - H2: Claude प्रदाता
  - H3: Claude क्या आयात करता है
  - H3: आर्काइव और मैन्युअल-समीक्षा स्थिति
  - H2: Codex प्रदाता
  - H3: Codex क्या आयात करता है
  - H3: मैन्युअल-समीक्षा Codex स्थिति
  - H2: Hermes प्रदाता
  - H3: Hermes क्या आयात करता है
  - H3: समर्थित .env कुंजियां
  - H3: केवल-आर्काइव स्थिति
  - H3: लागू करने के बाद
  - H2: Plugin अनुबंध
  - H2: ऑनबोर्डिंग इंटीग्रेशन
  - H2: संबंधित

## cli/models.md

- मार्ग: /cli/models
- शीर्षक:
  - H1: openclaw मॉडल
  - H2: सामान्य कमांड
  - H3: मॉडल स्कैन
  - H3: मॉडल स्थिति
  - H2: उपनाम + फ़ॉलबैक
  - H2: Auth प्रोफ़ाइल
  - H2: संबंधित

## cli/node.md

- मार्ग: /cli/node
- शीर्षक:
  - H1: openclaw Node
  - H2: Node होस्ट का उपयोग क्यों करें?
  - H2: ब्राउज़र प्रॉक्सी (शून्य-कॉन्फिग)
  - H2: चलाएं (फ़ोरग्राउंड)
  - H2: Node होस्ट के लिए Gateway auth
  - H2: सेवा (बैकग्राउंड)
  - H2: पेयरिंग
  - H2: Exec अनुमोदन
  - H2: संबंधित

## cli/nodes.md

- मार्ग: /cli/nodes
- शीर्षक:
  - H1: openclaw नोड्स
  - H2: सामान्य कमांड
  - H2: invoke
  - H2: संबंधित

## cli/onboard.md

- मार्ग: /cli/onboard
- शीर्षक:
  - H1: openclaw onboard
  - H2: संबंधित गाइड
  - H2: उदाहरण
  - H2: लोकेल
  - H3: नॉन-इंटरैक्टिव Z.AI एंडपॉइंट विकल्प
  - H2: अतिरिक्त नॉन-इंटरैक्टिव फ्लैग
  - H2: फ़्लो टिप्पणियां
  - H2: सामान्य फ़ॉलो-अप कमांड

## cli/pairing.md

- मार्ग: /cli/pairing
- शीर्षक:
  - H1: openclaw पेयरिंग
  - H2: कमांड
  - H2: pairing list
  - H2: pairing approve
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/path.md

- मार्ग: /cli/path
- शीर्षक:
  - H1: openclaw पथ
  - H2: इसका उपयोग क्यों करें
  - H2: इसका उपयोग कैसे किया जाता है
  - H2: यह कैसे काम करता है
  - H2: सबकमांड
  - H2: ग्लोबल फ्लैग
  - H2: oc:// सिंटैक्स
  - H2: फ़ाइल प्रकार से एड्रेसिंग
  - H2: म्यूटेशन अनुबंध
  - H2: उदाहरण
  - H2: फ़ाइल प्रकार के अनुसार रेसिपी
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: सबकमांड संदर्भ
  - H3: resolve &lt;oc-path&gt;
  - H3: find &lt;pattern&gt;
  - H3: set &lt;oc-path&gt; &lt;value&gt;
  - H3: validate &lt;oc-path&gt;
  - H3: emit &lt;file&gt;
  - H2: एग्ज़िट कोड
  - H2: आउटपुट मोड
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/plugins.md

- मार्ग: /cli/plugins
- शीर्षक:
  - H2: कमांड
  - H3: लेखक
  - H3: प्रदाता स्कैफ़ोल्ड
  - H3: इंस्टॉल
  - H4: मार्केटप्लेस शॉर्टहैंड
  - H3: सूची
  - H3: Plugin इंडेक्स
  - H3: अनइंस्टॉल
  - H3: अपडेट
  - H3: निरीक्षण
  - H3: Doctor
  - H3: रजिस्ट्री
  - H3: मार्केटप्लेस
  - H2: संबंधित

## cli/policy.md

- मार्ग: /cli/policy
- शीर्षक:
  - H1: openclaw नीति
  - H2: त्वरित शुरुआत
  - H3: नीति नियम संदर्भ
  - H4: स्कोप किए गए ओवरले
  - H4: चैनल
  - H4: MCP सर्वर
  - H4: मॉडल प्रदाता
  - H4: नेटवर्क
  - H4: इनग्रेस और चैनल पहुंच
  - H4: Gateway
  - H4: एजेंट वर्कस्पेस
  - H4: Sandbox मुद्रा
  - H4: डेटा प्रबंधन
  - H4: Secrets
  - H4: Exec अनुमोदन
  - H4: Auth प्रोफ़ाइल
  - H4: टूल मेटाडेटा
  - H4: टूल मुद्रा
  - H2: नीति कॉन्फिगर करें
  - H2: नीति स्थिति स्वीकार करें
  - H2: निष्कर्ष
  - H2: मरम्मत
  - H2: एग्ज़िट कोड
  - H2: संबंधित

## cli/proxy.md

- मार्ग: /cli/proxy
- शीर्षक:
  - H1: openclaw प्रॉक्सी
  - H2: कमांड
  - H2: वैलिडेट
  - H2: क्वेरी प्रीसेट
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/qr.md

- मार्ग: /cli/qr
- शीर्षक:
  - H1: openclaw qr
  - H2: उपयोग
  - H2: विकल्प
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/reset.md

- मार्ग: /cli/reset
- शीर्षक:
  - H1: openclaw reset
  - H2: संबंधित

## cli/sandbox.md

- मार्ग: /cli/sandbox
- शीर्षक:
  - H2: अवलोकन
  - H2: कमांड
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: उपयोग मामले
  - H3: Docker इमेज अपडेट करने के बाद
  - H3: Sandbox कॉन्फिगरेशन बदलने के बाद
  - H3: SSH लक्ष्य या SSH auth सामग्री बदलने के बाद
  - H3: OpenShell स्रोत, नीति या मोड बदलने के बाद
  - H3: setupCommand बदलने के बाद
  - H3: केवल किसी विशिष्ट एजेंट के लिए
  - H2: इसकी आवश्यकता क्यों है
  - H2: रजिस्ट्री माइग्रेशन
  - H2: कॉन्फिगरेशन
  - H2: संबंधित

## cli/secrets.md

- मार्ग: /cli/secrets
- शीर्षक:
  - H1: openclaw secrets
  - H2: runtime snapshot पुनः लोड करें
  - H2: ऑडिट
  - H2: कॉन्फिगर करें (इंटरैक्टिव सहायक)
  - H2: सहेजा गया प्लान लागू करें
  - H2: rollback backups क्यों नहीं
  - H2: उदाहरण
  - H2: संबंधित

## cli/security.md

- मार्ग: /cli/security
- शीर्षक:
  - H1: openclaw सुरक्षा
  - H2: ऑडिट
  - H2: JSON आउटपुट
  - H2: --fix क्या बदलता है
  - H2: संबंधित

## cli/sessions.md

- मार्ग: /cli/sessions
- शीर्षक:
  - H1: openclaw सेशन
  - H2: क्लीनअप रखरखाव
  - H2: सेशन को Compact करें
  - H3: sessions.compact RPC
  - H2: संबंधित

## cli/setup.md

- मार्ग: /cli/setup
- शीर्षक:
  - H1: openclaw setup
  - H2: विकल्प
  - H3: बेसलाइन मोड
  - H2: उदाहरण
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/skills.md

- मार्ग: /cli/skills
- शीर्षक:
  - H1: openclaw Skills
  - H2: कमांड
  - H2: Skill Workshop
  - H2: संबंधित

## cli/status.md

- मार्ग: /cli/status
- शीर्षक:
  - H2: संबंधित

## cli/system.md

- मार्ग: /cli/system
- शीर्षक:
  - H1: openclaw सिस्टम
  - H2: सामान्य कमांड
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/tasks.md

- मार्ग: /cli/tasks
- शीर्षक:
  - H2: उपयोग
  - H2: रूट विकल्प
  - H2: सबकमांड
  - H3: list
  - H3: show
  - H3: notify
  - H3: cancel
  - H3: audit
  - H3: maintenance
  - H3: flow
  - H2: संबंधित

## cli/transcripts.md

- मार्ग: /cli/transcripts
- शीर्षक:
  - H1: openclaw ट्रांसक्रिप्ट
  - H2: कमांड
  - H2: आउटपुट
  - H2: प्रति दिन कई मीटिंग
  - H2: अनुपस्थित सारांश
  - H2: कॉन्फिगरेशन

## cli/tui.md

- मार्ग: /cli/tui
- शीर्षक:
  - H1: openclaw TUI
  - H2: विकल्प
  - H2: उदाहरण
  - H2: कॉन्फिग मरम्मत लूप
  - H2: संबंधित

## cli/uninstall.md

- मार्ग: /cli/uninstall
- शीर्षक:
  - H1: openclaw uninstall
  - H2: संबंधित

## cli/update.md

- मार्ग: /cli/update
- शीर्षक:
  - H1: openclaw update
  - H2: उपयोग
  - H2: विकल्प
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: यह क्या करता है
  - H3: नियंत्रण-प्लेन प्रतिक्रिया आकार
  - H2: Git checkout फ़्लो
  - H3: चैनल चयन
  - H3: अपडेट चरण
  - H2: --update शॉर्टहैंड
  - H2: संबंधित

## cli/voicecall.md

- मार्ग: /cli/voicecall
- शीर्षक:
  - H1: openclaw voicecall
  - H2: सबकमांड
  - H2: सेटअप और स्मोक
  - H3: setup
  - H3: smoke
  - H2: कॉल जीवनचक्र
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: लॉग और मेट्रिक्स
  - H3: tail
  - H3: latency
  - H2: webhooks एक्सपोज करना
  - H3: expose
  - H2: संबंधित

## cli/webhooks.md

- मार्ग: /cli/webhooks
- शीर्षक:
  - H1: openclaw webhooks
  - H2: सबकमांड
  - H2: webhooks gmail setup
  - H3: आवश्यक
  - H3: Pub/Sub विकल्प
  - H3: OpenClaw डिलीवरी विकल्प
  - H3: gog watch serve विकल्प
  - H3: Tailscale एक्सपोज़र
  - H3: आउटपुट
  - H2: webhooks gmail run
  - H2: एंड-टू-एंड फ़्लो
  - H2: संबंधित

## cli/wiki.md

- मार्ग: /cli/wiki
- शीर्षक:
  - H1: openclaw wiki
  - H2: यह किसके लिए है
  - H2: सामान्य कमांड
  - H2: कमांड
  - H3: wiki status
  - H3: wiki doctor
  - H3: wiki init
  - H3: wiki ingest &lt;path-or-url&gt;
  - H3: wiki okf import &lt;path&gt;
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search &lt;query&gt;
  - H3: wiki get &lt;lookup&gt;
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: व्यावहारिक उपयोग मार्गदर्शन
  - H2: कॉन्फिगरेशन टाई-इन
  - H2: संबंधित

## cli/workboard.md

- मार्ग: /cli/workboard
- शीर्षक:
  - H2: उपयोग
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: स्लैश कमांड समानता
  - H2: अनुमतियां
  - H2: समस्या निवारण
  - H3: कोई कार्ड नहीं दिखते
  - H3: Dispatch डेटा-ओनली कहता है
  - H3: Dispatch कुछ शुरू नहीं करता
  - H2: संबंधित

## concepts/active-memory.md

- मार्ग: /concepts/active-memory
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: गति सुझाव
  - H3: Cerebras सेटअप
  - H2: इसे कैसे देखें
  - H2: सेशन टॉगल
  - H2: यह कब चलता है
  - H2: सेशन प्रकार
  - H2: यह कहां चलता है
  - H2: इसका उपयोग क्यों करें
  - H2: यह कैसे काम करता है
  - H2: क्वेरी मोड
  - H2: प्रॉम्प्ट शैलियां
  - H2: मॉडल फ़ॉलबैक नीति
  - H2: मेमोरी टूल
  - H3: बिल्ट-इन memory-core
  - H3: LanceDB मेमोरी
  - H3: Lossless Claw
  - H2: उन्नत एस्केप हैच
  - H2: ट्रांसक्रिप्ट पर्सिस्टेंस
  - H2: कॉन्फिगरेशन
  - H2: अनुशंसित सेटअप
  - H3: कोल्ड-स्टार्ट ग्रेस
  - H2: डिबगिंग
  - H2: सामान्य समस्याएं
  - H2: संबंधित पृष्ठ

## concepts/agent-loop.md

- मार्ग: /concepts/agent-loop
- शीर्षक:
  - H2: एंट्री पॉइंट
  - H2: यह कैसे काम करता है (उच्च-स्तर)
  - H2: Queueing + concurrency
  - H2: सेशन + वर्कस्पेस तैयारी
  - H2: प्रॉम्प्ट असेंबली + सिस्टम प्रॉम्प्ट
  - H2: Hook पॉइंट (जहां आप इंटरसेप्ट कर सकते हैं)
  - H3: आंतरिक हुक्स (Gateway हुक्स)
  - H3: Plugin हुक्स (एजेंट + Gateway जीवनचक्र)
  - H2: स्ट्रीमिंग + आंशिक उत्तर
  - H2: टूल निष्पादन + मैसेजिंग टूल
  - H2: उत्तर आकार देना + दमन
  - H2: Compaction + पुनः प्रयास
  - H2: इवेंट स्ट्रीम (आज)
  - H2: चैट चैनल हैंडलिंग
  - H2: टाइमआउट
  - H2: जहां चीजें जल्दी समाप्त हो सकती हैं
  - H2: संबंधित

## concepts/agent-runtimes.md

- मार्ग: /concepts/agent-runtimes
- शीर्षक:
  - H2: Codex सतहें
  - H2: Runtime स्वामित्व
  - H2: Runtime चयन
  - H2: GitHub Copilot एजेंट runtime
  - H2: संगतता अनुबंध
  - H2: स्थिति लेबल
  - H2: संबंधित

## concepts/agent-workspace.md

- रूट: /concepts/agent-workspace
- शीर्षक:
  - H2: डिफ़ॉल्ट स्थान
  - H2: अतिरिक्त वर्कस्पेस फ़ोल्डर
  - H2: वर्कस्पेस फ़ाइल मैप
  - H2: वर्कस्पेस में क्या नहीं है
  - H2: Git बैकअप (अनुशंसित, निजी)
  - H2: सीक्रेट्स कमिट न करें
  - H2: वर्कस्पेस को नई मशीन पर ले जाना
  - H2: उन्नत नोट्स
  - H2: संबंधित

## concepts/agent.md

- रूट: /concepts/agent
- शीर्षक:
  - H2: वर्कस्पेस (आवश्यक)
  - H2: बूटस्ट्रैप फ़ाइलें (इंजेक्टेड)
  - H2: बिल्ट-इन टूल्स
  - H2: Skills
  - H2: रनटाइम सीमाएँ
  - H2: सत्र
  - H2: स्ट्रीमिंग के दौरान संचालन
  - H2: मॉडल refs
  - H2: कॉन्फ़िगरेशन (न्यूनतम)
  - H2: संबंधित

## concepts/architecture.md

- रूट: /concepts/architecture
- शीर्षक:
  - H2: अवलोकन
  - H2: घटक और फ्लो
  - H3: Gateway (daemon)
  - H3: क्लाइंट (mac ऐप / CLI / वेब एडमिन)
  - H3: Nodes (macOS / iOS / Android / हेडलेस)
  - H3: WebChat
  - H2: कनेक्शन जीवनचक्र (एकल क्लाइंट)
  - H2: वायर प्रोटोकॉल (सारांश)
  - H2: पेयरिंग + लोकल ट्रस्ट
  - H2: प्रोटोकॉल टाइपिंग और कोडजन
  - H2: रिमोट एक्सेस
  - H2: ऑपरेशंस स्नैपशॉट
  - H2: इनवेरिएंट्स
  - H2: संबंधित

## concepts/channel-docking.md

- रूट: /concepts/channel-docking
- शीर्षक:
  - H2: उदाहरण
  - H2: इसका उपयोग क्यों करें
  - H2: आवश्यक कॉन्फ़िगरेशन
  - H2: कमांड
  - H2: क्या बदलता है
  - H2: क्या नहीं बदलता
  - H2: समस्या निवारण

## concepts/commitments.md

- रूट: /concepts/commitments
- शीर्षक:
  - H2: प्रतिबद्धताएँ सक्षम करें
  - H2: यह कैसे काम करता है
  - H2: दायरा
  - H2: प्रतिबद्धताएँ बनाम रिमाइंडर
  - H2: प्रतिबद्धताएँ प्रबंधित करें
  - H2: गोपनीयता और लागत
  - H2: समस्या निवारण
  - H2: संबंधित

## concepts/compaction.md

- रूट: /concepts/compaction
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: ऑटो-Compaction
  - H2: मैनुअल Compaction
  - H2: कॉन्फ़िगरेशन
  - H3: अलग मॉडल का उपयोग करना
  - H3: पहचानकर्ता संरक्षण
  - H3: सक्रिय ट्रांसक्रिप्ट बाइट गार्ड
  - H3: सक्सेसर ट्रांसक्रिप्ट
  - H3: Compaction नोटिस
  - H3: मेमोरी फ्लश
  - H2: प्लगेबल Compaction प्रदाता
  - H2: Compaction बनाम प्रूनिंग
  - H2: समस्या निवारण
  - H2: संबंधित

## concepts/context-engine.md

- रूट: /concepts/context-engine
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: यह कैसे काम करता है
  - H3: सबएजेंट जीवनचक्र (वैकल्पिक)
  - H3: सिस्टम प्रॉम्प्ट जोड़ना
  - H2: लेगेसी इंजन
  - H2: Plugin इंजन
  - H3: ContextEngine इंटरफ़ेस
  - H3: रनटाइम सेटिंग्स
  - H3: होस्ट आवश्यकताएँ
  - H3: विफलता आइसोलेशन
  - H3: ownsCompaction
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: Compaction और मेमोरी से संबंध
  - H2: सुझाव
  - H2: संबंधित

## concepts/context.md

- रूट: /concepts/context
- शीर्षक:
  - H2: क्विक स्टार्ट (कॉन्टेक्स्ट निरीक्षण)
  - H2: उदाहरण आउटपुट
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: कॉन्टेक्स्ट विंडो में क्या गिना जाता है
  - H2: OpenClaw सिस्टम प्रॉम्प्ट कैसे बनाता है
  - H2: इंजेक्टेड वर्कस्पेस फ़ाइलें (प्रोजेक्ट कॉन्टेक्स्ट)
  - H2: Skills: इंजेक्टेड बनाम ऑन-डिमांड लोडेड
  - H2: टूल्स: दो लागतें होती हैं
  - H2: कमांड, निर्देश, और "इनलाइन शॉर्टकट"
  - H2: सत्र, Compaction, और प्रूनिंग (क्या स्थायी रहता है)
  - H2: /context वास्तव में क्या रिपोर्ट करता है
  - H2: संबंधित

## concepts/delegate-architecture.md

- रूट: /concepts/delegate-architecture
- शीर्षक:
  - H2: डेलिगेट क्या है?
  - H2: डेलिगेट क्यों?
  - H2: क्षमता टियर
  - H3: टियर 1: रीड-ओनली + ड्राफ़्ट
  - H3: टियर 2: ओर से भेजना
  - H3: टियर 3: प्रोएक्टिव
  - H2: पूर्वापेक्षाएँ: आइसोलेशन और हार्डनिंग
  - H3: हार्ड ब्लॉक (समझौता नहीं)
  - H3: टूल प्रतिबंध
  - H3: सैंडबॉक्स आइसोलेशन
  - H3: ऑडिट ट्रेल
  - H2: डेलिगेट सेट अप करना
  - H3: 1. डेलिगेट एजेंट बनाएँ
  - H3: 2. आइडेंटिटी प्रदाता डेलिगेशन कॉन्फ़िगर करें
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. डेलिगेट को चैनलों से बाँधें
  - H3: 4. डेलिगेट एजेंट में क्रेडेंशियल जोड़ें
  - H2: उदाहरण: संगठनात्मक असिस्टेंट
  - H2: स्केलिंग पैटर्न
  - H2: संबंधित

## concepts/dreaming.md

- रूट: /concepts/dreaming
- शीर्षक:
  - H2: Dreaming क्या लिखता है
  - H2: चरण मॉडल
  - H2: सत्र ट्रांसक्रिप्ट इनजेशन
  - H2: ड्रीम डायरी
  - H2: डीप रैंकिंग सिग्नल
  - H2: QA शैडो ट्रायल रिपोर्ट कवरेज
  - H2: शेड्यूलिंग
  - H2: क्विक स्टार्ट
  - H2: स्लैश कमांड
  - H2: CLI वर्कफ़्लो
  - H2: मुख्य डिफ़ॉल्ट
  - H2: ड्रीम्स UI
  - H2: Dreaming कभी नहीं चलता: स्थिति ब्लॉक्ड दिखाती है
  - H2: संबंधित

## concepts/experimental-features.md

- रूट: /concepts/experimental-features
- शीर्षक:
  - H2: वर्तमान में दस्तावेज़ित फ़्लैग
  - H2: लोकल मॉडल लीन मोड
  - H3: ये तीन टूल क्यों
  - H3: इसे कब चालू करें
  - H3: इसे कब बंद रखें
  - H3: सक्षम करें
  - H2: प्रायोगिक का मतलब छिपा हुआ नहीं है
  - H2: संबंधित

## concepts/features.md

- रूट: /concepts/features
- शीर्षक:
  - H2: मुख्य विशेषताएँ
  - H2: पूरी सूची
  - H2: संबंधित

## concepts/mantis-slack-desktop-runbook.md

- रूट: /concepts/mantis-slack-desktop-runbook
- शीर्षक:
  - H2: स्टोरेज मॉडल
  - H2: GitHub डिस्पैच
  - H2: लोकल CLI
  - H2: हाइड्रेट मोड
  - H2: टाइमिंग व्याख्या
  - H2: साक्ष्य चेकलिस्ट
  - H2: विफलता हैंडलिंग
  - H2: संबंधित

## concepts/mantis.md

- रूट: /concepts/mantis
- शीर्षक:
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: स्वामित्व
  - H2: कमांड आकार
  - H2: रन जीवनचक्र
  - H2: Discord MVP
  - H2: मौजूदा QA हिस्से
  - H2: साक्ष्य मॉडल
  - H2: ब्राउज़र और VNC
  - H2: मशीनें
  - H2: सीक्रेट्स
  - H2: GitHub आर्टिफ़ैक्ट्स और PR टिप्पणियाँ
  - H2: निजी डिप्लॉयमेंट नोट्स
  - H2: परिदृश्य जोड़ना
  - H2: प्रदाता विस्तार
  - H2: खुले प्रश्न

## concepts/markdown-formatting.md

- रूट: /concepts/markdown-formatting
- शीर्षक:
  - H2: लक्ष्य
  - H2: पाइपलाइन
  - H2: IR उदाहरण
  - H2: जहाँ इसका उपयोग होता है
  - H2: तालिका हैंडलिंग
  - H2: चंकिंग नियम
  - H2: लिंक नीति
  - H2: स्पॉइलर
  - H2: चैनल फ़ॉर्मैटर कैसे जोड़ें या अपडेट करें
  - H2: सामान्य समस्याएँ
  - H2: संबंधित

## concepts/memory-builtin.md

- रूट: /concepts/memory-builtin
- शीर्षक:
  - H2: यह क्या प्रदान करता है
  - H2: शुरू करना
  - H2: समर्थित एम्बेडिंग प्रदाता
  - H2: इंडेक्सिंग कैसे काम करती है
  - H2: कब उपयोग करें
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन
  - H2: संबंधित

## concepts/memory-honcho.md

- रूट: /concepts/memory-honcho
- शीर्षक:
  - H2: यह क्या प्रदान करता है
  - H2: उपलब्ध टूल
  - H2: शुरू करना
  - H2: कॉन्फ़िगरेशन
  - H2: मौजूदा मेमोरी माइग्रेट करना
  - H2: यह कैसे काम करता है
  - H2: Honcho बनाम बिल्टइन मेमोरी
  - H2: CLI कमांड
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/memory-qmd.md

- रूट: /concepts/memory-qmd
- शीर्षक:
  - H2: यह बिल्टइन से अधिक क्या जोड़ता है
  - H2: शुरू करना
  - H3: पूर्वापेक्षाएँ
  - H3: सक्षम करें
  - H2: साइडकार कैसे काम करता है
  - H2: खोज प्रदर्शन और संगतता
  - H2: मॉडल ओवरराइड
  - H2: अतिरिक्त पाथ्स इंडेक्स करना
  - H2: सत्र ट्रांसक्रिप्ट इंडेक्स करना
  - H2: खोज दायरा
  - H2: उद्धरण
  - H2: कब उपयोग करें
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन
  - H2: संबंधित

## concepts/memory-search.md

- रूट: /concepts/memory-search
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: समर्थित प्रदाता
  - H2: खोज कैसे काम करती है
  - H2: खोज गुणवत्ता सुधारना
  - H3: समय-आधारित क्षय
  - H3: MMR (विविधता)
  - H3: दोनों सक्षम करें
  - H2: मल्टीमॉडल मेमोरी
  - H2: सत्र मेमोरी खोज
  - H2: समस्या निवारण
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/memory.md

- रूट: /concepts/memory
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: क्या कहाँ जाता है
  - H2: एक्शन-संवेदनशील मेमोरीज़
  - H2: अनुमानित प्रतिबद्धताएँ
  - H2: मेमोरी टूल्स
  - H2: मेमोरी Wiki सहयोगी Plugin
  - H2: मेमोरी खोज
  - H2: मेमोरी बैकएंड्स
  - H2: नॉलेज विकी लेयर
  - H2: ऑटोमैटिक मेमोरी फ्लश
  - H2: Dreaming
  - H2: ग्राउंडेड बैकफ़िल और लाइव प्रमोशन
  - H2: CLI
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/message-lifecycle-refactor.md

- रूट: /concepts/message-lifecycle-refactor
- शीर्षक:
  - H2: समस्याएँ
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: संदर्भ मॉडल
  - H2: कोर मॉडल
  - H2: संदेश शब्दावली
  - H3: संदेश
  - H3: लक्ष्य
  - H3: संबंध
  - H3: उत्पत्ति
  - H3: रसीद
  - H2: प्राप्ति कॉन्टेक्स्ट
  - H2: भेजने का कॉन्टेक्स्ट
  - H2: लाइव कॉन्टेक्स्ट
  - H2: एडाप्टर सतह
  - H2: सार्वजनिक SDK कटौती
  - H2: चैनल इनबाउंड से संबंध
  - H2: संगतता गार्डरेल्स
  - H2: आंतरिक स्टोरेज
  - H2: विफलता वर्ग
  - H2: चैनल मैपिंग
  - H2: माइग्रेशन योजना
  - H3: चरण 1: आंतरिक संदेश डोमेन
  - H3: चरण 2: टिकाऊ भेजने का कोर
  - H3: चरण 3: चैनल इनबाउंड ब्रिज
  - H3: चरण 4: तैयार डिस्पैचर ब्रिज
  - H3: चरण 5: एकीकृत लाइव जीवनचक्र
  - H3: चरण 6: सार्वजनिक SDK
  - H3: चरण 7: सभी प्रेषक
  - H3: चरण 8: Turn-Named संगतता हटाएँ
  - H2: परीक्षण योजना
  - H2: खुले प्रश्न
  - H2: स्वीकृति मानदंड
  - H2: संबंधित

## concepts/messages.md

- रूट: /concepts/messages
- शीर्षक:
  - H2: संदेश फ्लो (उच्च स्तर)
  - H2: इनबाउंड डीड्यूप
  - H2: इनबाउंड डिबाउंसिंग
  - H2: सत्र और डिवाइस
  - H2: टूल परिणाम मेटाडेटा
  - H2: इनबाउंड बॉडीज़ और हिस्ट्री कॉन्टेक्स्ट
  - H2: क्यूइंग और फ़ॉलोअप
  - H2: चैनल रन स्वामित्व
  - H2: स्ट्रीमिंग, चंकिंग, और बैचिंग
  - H2: रीजनिंग दृश्यता और टोकन
  - H2: प्रीफ़िक्स, थ्रेडिंग, और उत्तर
  - H2: साइलेंट उत्तर
  - H2: संबंधित

## concepts/model-failover.md

- रूट: /concepts/model-failover
- शीर्षक:
  - H2: रनटाइम फ्लो
  - H2: चयन स्रोत नीति
  - H2: ऑथ विफलता स्किप कैश
  - H2: उपयोगकर्ता-दृश्यमान फ़ॉलबैक नोटिस
  - H2: ऑथ स्टोरेज (कुंजियाँ + OAuth)
  - H2: प्रोफ़ाइल IDs
  - H2: रोटेशन क्रम
  - H3: सत्र स्टिकिनेस (कैश-फ़्रेंडली)
  - H3: OpenAI Codex सब्सक्रिप्शन प्लस API-key बैकअप
  - H2: कूलडाउन
  - H2: बिलिंग डिसेबल्स
  - H2: मॉडल फ़ॉलबैक
  - H3: उम्मीदवार चेन नियम
  - H3: कौन-सी त्रुटियाँ फ़ॉलबैक आगे बढ़ाती हैं
  - H3: कूलडाउन स्किप बनाम प्रोब व्यवहार
  - H2: सत्र ओवरराइड और लाइव मॉडल स्विचिंग
  - H2: ऑब्ज़र्वेबिलिटी और विफलता सारांश
  - H2: संबंधित कॉन्फ़िग

## concepts/model-providers.md

- रूट: /concepts/model-providers
- शीर्षक:
  - H2: त्वरित नियम
  - H2: Plugin-स्वामित्व वाला प्रदाता व्यवहार
  - H2: API कुंजी रोटेशन
  - H2: आधिकारिक प्रदाता Plugins
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: अन्य सब्सक्रिप्शन-शैली होस्टेड विकल्प
  - H3: OpenCode
  - H3: Google Gemini (API कुंजी)
  - H3: Google Vertex और Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: अन्य बंडल्ड प्रदाता Plugins
  - H4: जानने योग्य विशेषताएँ
  - H2: models.providers के माध्यम से प्रदाता (कस्टम/base URL)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi coding
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (International)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: लोकल प्रॉक्सी (LM Studio, vLLM, LiteLLM, आदि)
  - H2: CLI उदाहरण
  - H2: संबंधित

## concepts/models.md

- रूट: /concepts/models
- शीर्षक:
  - H2: मॉडल चयन कैसे काम करता है
  - H2: चयन स्रोत और फ़ॉलबैक व्यवहार
  - H2: त्वरित मॉडल नीति
  - H2: ऑनबोर्डिंग (अनुशंसित)
  - H2: कॉन्फ़िग कुंजियाँ (अवलोकन)
  - H3: सुरक्षित allowlist संपादन
  - H2: "मॉडल की अनुमति नहीं है" (और उत्तर क्यों रुक जाते हैं)
  - H2: चैट में मॉडल बदलना (/model)
  - H2: CLI कमांड
  - H3: models list
  - H3: models status
  - H2: स्कैनिंग (OpenRouter मुक्त मॉडल)
  - H2: मॉडल्स रजिस्ट्री (models.json)
  - H2: संबंधित

## concepts/multi-agent.md

- रूट: /concepts/multi-agent
- शीर्षक:
  - H2: "एक एजेंट" क्या है?
  - H2: पाथ्स (त्वरित मैप)
  - H3: एकल-एजेंट मोड (डिफ़ॉल्ट)
  - H2: एजेंट हेल्पर
  - H2: क्विक स्टार्ट
  - H2: कई एजेंट = कई लोग, कई व्यक्तित्व
  - H2: क्रॉस-एजेंट QMD मेमोरी खोज
  - H2: एक WhatsApp नंबर, कई लोग (DM स्प्लिट)
  - H2: रूटिंग नियम (संदेश एजेंट कैसे चुनते हैं)
  - H2: कई खाते / फ़ोन नंबर
  - H2: अवधारणाएँ
  - H2: प्लेटफ़ॉर्म उदाहरण
  - H2: सामान्य पैटर्न
  - H2: प्रति-एजेंट सैंडबॉक्स और टूल कॉन्फ़िगरेशन
  - H2: संबंधित

## concepts/oauth.md

- मार्ग: /concepts/oauth
- शीर्षक:
  - H2: टोकन सिंक (यह क्यों मौजूद है)
  - H2: स्टोरेज (टोकन कहाँ रहते हैं)
  - H2: Anthropic पुराने टोकन संगतता
  - H2: Anthropic Claude CLI माइग्रेशन
  - H2: OAuth एक्सचेंज (लॉगिन कैसे काम करता है)
  - H3: Anthropic setup-token
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: रिफ्रेश + समाप्ति
  - H2: कई खाते (प्रोफ़ाइल) + रूटिंग
  - H3: 1) पसंदीदा: अलग एजेंट
  - H3: 2) उन्नत: एक एजेंट में कई प्रोफ़ाइल
  - H2: संबंधित

## concepts/parallel-specialist-lanes.md

- मार्ग: /concepts/parallel-specialist-lanes
- शीर्षक:
  - H2: प्रथम सिद्धांत
  - H2: अनुशंसित रोलआउट
  - H3: चरण 1: लेन कॉन्ट्रैक्ट + पृष्ठभूमि में भारी काम
  - H3: चरण 2: प्राथमिकता और समवर्ती नियंत्रण
  - H3: चरण 3: कोऑर्डिनेटर / ट्रैफिक कंट्रोलर
  - H2: न्यूनतम लेन कॉन्ट्रैक्ट टेम्पलेट
  - H2: संबंधित

## concepts/personal-agent-benchmark-pack.md

- मार्ग: /concepts/personal-agent-benchmark-pack
- शीर्षक:
  - H2: परिदृश्य
  - H2: गोपनीयता मॉडल
  - H2: पैक का विस्तार

## concepts/presence.md

- मार्ग: /concepts/presence
- शीर्षक:
  - H2: उपस्थिति फ़ील्ड (क्या दिखाई देता है)
  - H2: प्रोड्यूसर (उपस्थिति कहाँ से आती है)
  - H3: 1) Gateway स्वयं प्रविष्टि
  - H3: 2) WebSocket कनेक्ट
  - H4: एकबारगी CLI कमांड दिखाई क्यों नहीं देते
  - H3: 3) system-event बीकन
  - H3: 4) Node कनेक्ट होते हैं (भूमिका: node)
  - H2: मर्ज + डीडुप नियम (instanceId क्यों मायने रखता है)
  - H2: TTL और सीमित आकार
  - H2: रिमोट/टनल सावधानी (loopback IP)
  - H2: कंज्यूमर
  - H3: macOS इंस्टेंस टैब
  - H2: डीबगिंग सुझाव
  - H2: संबंधित

## concepts/progress-drafts.md

- मार्ग: /concepts/progress-drafts
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: उपयोगकर्ता क्या देखते हैं
  - H2: मोड चुनें
  - H2: लेबल कॉन्फ़िगर करें
  - H2: प्रगति पंक्तियों को नियंत्रित करें
  - H2: चैनल व्यवहार
  - H2: अंतिम रूप देना
  - H2: समस्या निवारण
  - H2: संबंधित

## concepts/qa-e2e-automation.md

- मार्ग: /concepts/qa-e2e-automation
- शीर्षक:
  - H2: कमांड सतह
  - H2: ऑपरेटर फ़्लो
  - H2: लाइव ट्रांसपोर्ट कवरेज
  - H2: Telegram, Discord, Slack, और WhatsApp QA संदर्भ
  - H3: साझा CLI फ्लैग
  - H3: Telegram QA
  - H3: Discord QA
  - H3: Slack QA
  - H4: Slack वर्कस्पेस सेट अप करना
  - H3: WhatsApp QA
  - H3: Convex क्रेडेंशियल पूल
  - H2: रेपो-समर्थित सीड
  - H2: प्रदाता मॉक लेन
  - H2: ट्रांसपोर्ट एडैप्टर
  - H3: चैनल जोड़ना
  - H3: परिदृश्य हेल्पर नाम
  - H2: रिपोर्टिंग
  - H2: संबंधित दस्तावेज़

## concepts/qa-matrix.md

- मार्ग: /concepts/qa-matrix
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: लेन क्या करती है
  - H2: CLI
  - H3: सामान्य फ्लैग
  - H3: प्रदाता फ्लैग
  - H2: प्रोफ़ाइल
  - H2: परिदृश्य
  - H2: एनवायरनमेंट वेरिएबल
  - H2: आउटपुट आर्टिफैक्ट
  - H2: ट्राइएज सुझाव
  - H2: लाइव ट्रांसपोर्ट कॉन्ट्रैक्ट
  - H2: संबंधित

## concepts/queue-steering.md

- मार्ग: /concepts/queue-steering
- शीर्षक:
  - H2: रनटाइम सीमा
  - H2: मोड
  - H2: बर्स्ट उदाहरण
  - H2: स्कोप
  - H2: डिबाउंस
  - H2: संबंधित

## concepts/queue.md

- मार्ग: /concepts/queue
- शीर्षक:
  - H2: क्यों
  - H2: यह कैसे काम करता है
  - H2: डिफ़ॉल्ट
  - H2: कतार मोड
  - H2: कतार विकल्प
  - H2: स्टीयर और स्ट्रीमिंग
  - H2: प्राथमिकता क्रम
  - H2: प्रति-सत्र ओवरराइड
  - H2: स्कोप और गारंटी
  - H2: समस्या निवारण
  - H2: संबंधित

## concepts/retry.md

- मार्ग: /concepts/retry
- शीर्षक:
  - H2: लक्ष्य
  - H2: डिफ़ॉल्ट
  - H2: व्यवहार
  - H3: मॉडल प्रदाता
  - H3: Discord
  - H3: Telegram
  - H2: कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: संबंधित

## concepts/session-pruning.md

- मार्ग: /concepts/session-pruning
- शीर्षक:
  - H2: यह क्यों मायने रखता है
  - H2: यह कैसे काम करता है
  - H2: पुराने इमेज की सफ़ाई
  - H2: स्मार्ट डिफ़ॉल्ट
  - H2: सक्षम या अक्षम करें
  - H2: प्रूनिंग बनाम Compaction
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/session-tool.md

- मार्ग: /concepts/session-tool
- शीर्षक:
  - H2: उपलब्ध टूल
  - H2: सत्रों की सूची बनाना और पढ़ना
  - H2: क्रॉस-सत्र संदेश भेजना
  - H2: स्थिति और ऑर्केस्ट्रेशन हेल्पर
  - H2: उप-एजेंट बनाना
  - H2: दृश्यता
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/session.md

- मार्ग: /concepts/session
- शीर्षक:
  - H2: संदेश कैसे रूट होते हैं
  - H2: DM आइसोलेशन
  - H3: Dock लिंक किए गए चैनल
  - H2: सत्र जीवनचक्र
  - H2: स्थिति कहाँ रहती है
  - H2: सत्र रखरखाव
  - H2: सत्रों का निरीक्षण
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/soul.md

- मार्ग: /concepts/soul
- शीर्षक:
  - H2: SOUL.md में क्या होना चाहिए
  - H2: यह क्यों काम करता है
  - H2: Molty प्रॉम्प्ट
  - H2: अच्छा कैसा दिखता है
  - H2: एक चेतावनी
  - H2: संबंधित

## concepts/streaming.md

- मार्ग: /concepts/streaming
- शीर्षक:
  - H2: ब्लॉक स्ट्रीमिंग (चैनल संदेश)
  - H3: ब्लॉक स्ट्रीमिंग के साथ मीडिया डिलीवरी
  - H2: खंडन एल्गोरिदम (निम्न/उच्च सीमाएँ)
  - H2: संयोजन (स्ट्रीम किए गए ब्लॉक मर्ज करें)
  - H2: ब्लॉकों के बीच मानव-जैसी गति
  - H2: "खंड स्ट्रीम करें या सब कुछ"
  - H2: प्रीव्यू स्ट्रीमिंग मोड
  - H3: चैनल मैपिंग
  - H3: रनटाइम व्यवहार
  - H3: टूल-प्रगति प्रीव्यू अपडेट
  - H3: टिप्पणी प्रगति लेन
  - H2: संबंधित

## concepts/system-prompt.md

- मार्ग: /concepts/system-prompt
- शीर्षक:
  - H2: संरचना
  - H2: प्रॉम्प्ट मोड
  - H2: प्रॉम्प्ट स्नैपशॉट
  - H2: वर्कस्पेस बूटस्ट्रैप इंजेक्शन
  - H2: समय हैंडलिंग
  - H2: Skills
  - H2: दस्तावेज़ीकरण
  - H2: संबंधित

## concepts/timezone.md

- मार्ग: /concepts/timezone
- शीर्षक:
  - H2: तीन टाइमज़ोन सतहें
  - H2: उपयोगकर्ता टाइमज़ोन सेट करना
  - H2: कब ओवरराइड करें
  - H2: संबंधित

## concepts/typebox.md

- मार्ग: /concepts/typebox
- शीर्षक:
  - H2: मानसिक मॉडल (30 सेकंड)
  - H2: स्कीमा कहाँ रहते हैं
  - H2: वर्तमान पाइपलाइन
  - H2: रनटाइम पर स्कीमा कैसे उपयोग किए जाते हैं
  - H2: उदाहरण फ़्रेम
  - H2: न्यूनतम क्लाइंट (Node.js)
  - H2: कार्य किया हुआ उदाहरण: किसी मेथड को शुरू से अंत तक जोड़ें
  - H2: Swift कोडजन व्यवहार
  - H2: वर्ज़निंग + संगतता
  - H2: स्कीमा पैटर्न और परंपराएँ
  - H2: लाइव स्कीमा JSON
  - H2: जब आप स्कीमा बदलते हैं
  - H2: संबंधित

## concepts/typing-indicators.md

- मार्ग: /concepts/typing-indicators
- शीर्षक:
  - H2: डिफ़ॉल्ट
  - H2: मोड
  - H2: कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: संबंधित

## concepts/usage-tracking.md

- मार्ग: /concepts/usage-tracking
- शीर्षक:
  - H2: यह क्या है
  - H2: यह कहाँ दिखाई देता है
  - H2: डिफ़ॉल्ट उपयोग फ़ुटर मोड
  - H3: तीन अलग सत्र स्थितियाँ
  - H3: प्राथमिकता क्रम
  - H3: रीसेट करना बनाम बंद करना
  - H3: टॉगल व्यवहार
  - H3: कॉन्फ़िग
  - H2: कस्टम /usage पूर्ण फ़ुटर
  - H3: आकार
  - H3: कॉन्ट्रैक्ट पथ
  - H3: क्रियाएँ
  - H3: अंश रूप
  - H3: उदाहरण
  - H2: प्रदाता + क्रेडेंशियल
  - H2: संबंधित

## date-time.md

- मार्ग: /date-time
- शीर्षक:
  - H2: संदेश एनवेलप (डिफ़ॉल्ट रूप से स्थानीय)
  - H3: उदाहरण
  - H2: सिस्टम प्रॉम्प्ट: वर्तमान तारीख और समय
  - H2: सिस्टम इवेंट पंक्तियाँ (डिफ़ॉल्ट रूप से स्थानीय)
  - H3: उपयोगकर्ता टाइमज़ोन + फ़ॉर्मैट कॉन्फ़िगर करें
  - H2: समय फ़ॉर्मैट पहचान (स्वतः)
  - H2: टूल पेलोड + कनेक्टर (कच्चा प्रदाता समय + सामान्यीकृत फ़ील्ड)
  - H2: संबंधित दस्तावेज़

## debug/node-issue.md

- मार्ग: /debug/node-issue
- शीर्षक:
  - H1: Node + tsx "\\name is not a function" क्रैश
  - H2: सारांश
  - H2: एनवायरनमेंट
  - H2: रिप्रो (केवल Node)
  - H2: रेपो में न्यूनतम रिप्रो
  - H2: Node वर्ज़न जाँच
  - H2: नोट्स / परिकल्पना
  - H2: रिग्रेशन इतिहास
  - H2: वर्कअराउंड
  - H2: संदर्भ
  - H2: अगले कदम
  - H2: संबंधित

## diagnostics/flags.md

- मार्ग: /diagnostics/flags
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: कॉन्फ़िग के ज़रिए सक्षम करें
  - H2: Env ओवरराइड (एकबारगी)
  - H2: प्रोफ़ाइलिंग फ्लैग
  - H2: टाइमलाइन आर्टिफैक्ट
  - H2: लॉग कहाँ जाते हैं
  - H2: लॉग निकालें
  - H2: नोट्स
  - H2: संबंधित

## gateway/authentication.md

- मार्ग: /gateway/authentication
- शीर्षक:
  - H2: अनुशंसित सेटअप (API कुंजी, कोई भी प्रदाता)
  - H2: Anthropic: Claude CLI और टोकन संगतता
  - H2: Anthropic नोट
  - H2: मॉडल ऑथ स्थिति जाँचना
  - H2: API कुंजी रोटेशन व्यवहार (gateway)
  - H2: Gateway चलते समय प्रदाता ऑथ हटाना
  - H2: कौन सा क्रेडेंशियल उपयोग हो, इसे नियंत्रित करना
  - H3: OpenAI और पुराने openai-codex id
  - H3: लॉगिन के दौरान (CLI)
  - H3: प्रति-सत्र (चैट कमांड)
  - H3: प्रति-एजेंट (CLI ओवरराइड)
  - H2: समस्या निवारण
  - H3: "कोई क्रेडेंशियल नहीं मिला"
  - H3: टोकन समाप्त होने वाला/समाप्त
  - H2: संबंधित

## gateway/background-process.md

- मार्ग: /gateway/background-process
- शीर्षक:
  - H2: exec टूल
  - H2: चाइल्ड प्रोसेस ब्रिजिंग
  - H2: process टूल
  - H2: उदाहरण
  - H2: संबंधित

## gateway/bonjour.md

- मार्ग: /gateway/bonjour
- शीर्षक:
  - H2: Tailscale पर वाइड-एरिया Bonjour (Unicast DNS-SD)
  - H3: Gateway कॉन्फ़िग (अनुशंसित)
  - H3: एकबारगी DNS सर्वर सेटअप (gateway होस्ट)
  - H3: Tailscale DNS सेटिंग्स
  - H3: Gateway लिस्नर सुरक्षा (अनुशंसित)
  - H2: क्या विज्ञापित होता है
  - H2: सेवा प्रकार
  - H2: TXT कुंजियाँ (गैर-गुप्त संकेत)
  - H2: macOS पर डीबगिंग
  - H2: Gateway लॉग में डीबगिंग
  - H2: iOS node पर डीबगिंग
  - H2: Bonjour कब सक्षम करें
  - H2: Bonjour कब अक्षम करें
  - H2: Docker में आने वाली अड़चनें
  - H2: अक्षम Bonjour का समस्या निवारण
  - H2: सामान्य विफलता मोड
  - H2: एस्केप किए गए इंस्टेंस नाम (\032)
  - H2: सक्षम करना / अक्षम करना / कॉन्फ़िगरेशन
  - H2: संबंधित दस्तावेज़

## gateway/bridge-protocol.md

- मार्ग: /gateway/bridge-protocol
- शीर्षक:
  - H2: यह क्यों मौजूद था
  - H2: ट्रांसपोर्ट
  - H2: हैंडशेक + पेयरिंग
  - H2: फ़्रेम
  - H2: Exec जीवनचक्र इवेंट
  - H2: ऐतिहासिक tailnet उपयोग
  - H2: वर्ज़निंग
  - H2: संबंधित

## gateway/cli-backends.md

- मार्ग: /gateway/cli-backends
- शीर्षक:
  - H2: शुरुआती लोगों के लिए आसान त्वरित शुरुआत
  - H2: इसे fallback के रूप में उपयोग करना
  - H2: कॉन्फ़िगरेशन अवलोकन
  - H3: उदाहरण कॉन्फ़िगरेशन
  - H2: यह कैसे काम करता है
  - H2: सत्र
  - H2: claude-cli सत्रों से fallback prelude
  - H2: इमेज (पास-थ्रू)
  - H2: इनपुट / आउटपुट
  - H2: डिफ़ॉल्ट (plugin-स्वामित्व)
  - H2: Plugin-स्वामित्व वाले डिफ़ॉल्ट
  - H2: नेटिव Compaction स्वामित्व
  - H2: बंडल MCP ओवरले
  - H2: रीसीड इतिहास सीमा
  - H2: सीमाएँ
  - H2: समस्या निवारण
  - H2: संबंधित

## gateway/config-agents.md

- मार्ग: /gateway/config-agents
- शीर्षक:
  - H2: एजेंट डिफ़ॉल्ट
  - H3: agents.defaults.workspace
  - H3: agents.defaults.repoRoot
  - H3: agents.defaults.skills
  - H3: agents.defaults.skipBootstrap
  - H3: agents.defaults.skipOptionalBootstrapFiles
  - H3: agents.defaults.contextInjection
  - H3: agents.defaults.bootstrapMaxChars
  - H3: agents.defaults.bootstrapTotalMaxChars
  - H3: प्रति-एजेंट बूटस्ट्रैप प्रोफ़ाइल ओवरराइड
  - H3: agents.defaults.bootstrapPromptTruncationWarning
  - H3: कॉन्टेक्स्ट बजट स्वामित्व मैप
  - H4: agents.defaults.startupContext
  - H4: agents.defaults.contextLimits
  - H4: agents.list[].contextLimits
  - H4: skills.limits.maxSkillsPromptChars
  - H4: agents.list[].skillsLimits.maxSkillsPromptChars
  - H3: agents.defaults.imageMaxDimensionPx
  - H3: agents.defaults.imageQuality
  - H3: agents.defaults.userTimezone
  - H3: agents.defaults.timeFormat
  - H3: agents.defaults.model
  - H3: रनटाइम नीति
  - H3: agents.defaults.cliBackends
  - H3: agents.defaults.promptOverlays
  - H3: agents.defaults.heartbeat
  - H3: agents.defaults.compaction
  - H3: agents.defaults.runRetries
  - H3: agents.defaults.contextPruning
  - H3: ब्लॉक स्ट्रीमिंग
  - H3: टाइपिंग इंडिकेटर
  - H3: agents.defaults.sandbox
  - H3: agents.list (प्रति-एजेंट ओवरराइड)
  - H2: मल्टी-एजेंट रूटिंग
  - H3: बाइंडिंग मैच फ़ील्ड
  - H3: प्रति-एजेंट एक्सेस प्रोफ़ाइल
  - H2: सत्र
  - H2: संदेश
  - H3: प्रतिक्रिया प्रीफ़िक्स
  - H3: Ack प्रतिक्रिया
  - H3: इनबाउंड डिबाउंस
  - H3: TTS (text-to-speech)
  - H2: Talk
  - H2: संबंधित

## gateway/config-channels.md

- मार्ग: /gateway/config-channels
- शीर्षक:
  - H2: चैनल
  - H3: DM और समूह पहुंच
  - H3: चैनल मॉडल ओवरराइड
  - H3: चैनल डिफॉल्ट और Heartbeat
  - H3: WhatsApp
  - H3: Telegram
  - H3: Discord
  - H3: Google Chat
  - H3: Slack
  - H3: Mattermost
  - H3: Signal
  - H3: iMessage
  - H3: Matrix
  - H3: Microsoft Teams
  - H3: IRC
  - H3: बहु-खाता (सभी चैनल)
  - H3: अन्य Plugin चैनल
  - H3: समूह चैट उल्लेख गेटिंग
  - H4: DM इतिहास सीमाएं
  - H4: स्वयं-चैट मोड
  - H3: कमांड (चैट कमांड हैंडलिंग)
  - H2: संबंधित

## gateway/config-tools.md

- मार्ग: /gateway/config-tools
- शीर्षक:
  - H2: टूल
  - H3: टूल प्रोफाइल
  - H3: टूल समूह
  - H3: सैंडबॉक्स टूल नीति के अंदर MCP और Plugin टूल
  - H3: tools.codeMode
  - H3: tools.allow / tools.deny
  - H3: tools.byProvider
  - H3: tools.toolsBySender
  - H3: tools.elevated
  - H3: tools.exec
  - H3: tools.loopDetection
  - H3: tools.web
  - H3: tools.media
  - H3: tools.agentToAgent
  - H3: tools.sessions
  - H3: tools.sessionsspawn
  - H3: tools.experimental
  - H3: agents.defaults.subagents
  - H2: कस्टम प्रदाता और बेस URL
  - H3: प्रदाता फ़ील्ड विवरण
  - H3: प्रदाता उदाहरण
  - H2: संबंधित

## gateway/configuration-examples.md

- मार्ग: /gateway/configuration-examples
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: पूर्ण न्यूनतम
  - H3: अनुशंसित स्टार्टर
  - H2: विस्तृत उदाहरण (मुख्य विकल्प)
  - H3: सिमलिंक किया गया सहोदर skill repo
  - H2: सामान्य पैटर्न
  - H3: एक ओवरराइड के साथ साझा skill बेसलाइन
  - H3: बहु-प्लेटफॉर्म सेटअप
  - H3: विश्वसनीय node नेटवर्क स्वतः-अनुमोदन
  - H3: सुरक्षित DM मोड (साझा इनबॉक्स / बहु-उपयोगकर्ता DM)
  - H3: Anthropic API कुंजी + MiniMax fallback
  - H3: कार्य bot (प्रतिबंधित पहुंच)
  - H3: केवल स्थानीय मॉडल
  - H2: सुझाव
  - H2: संबंधित

## gateway/configuration-reference.md

- मार्ग: /gateway/configuration-reference
- शीर्षक:
  - H2: चैनल
  - H2: एजेंट डिफॉल्ट, बहु-एजेंट, सत्र, और संदेश
  - H2: टूल और कस्टम प्रदाता
  - H2: मॉडल
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Codex harness plugin config
  - H2: प्रतिबद्धताएं
  - H2: ब्राउज़र
  - H2: UI
  - H2: Gateway
  - H3: OpenAI-संगत endpoint
  - H3: बहु-इंस्टेंस आइसोलेशन
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: हुक
  - H3: Gmail इंटीग्रेशन
  - H2: Canvas plugin host
  - H2: Discovery
  - H3: mDNS (Bonjour)
  - H3: वाइड-एरिया (DNS-SD)
  - H2: पर्यावरण
  - H3: env (inline env vars)
  - H3: Env var प्रतिस्थापन
  - H2: Secrets
  - H3: SecretRef
  - H3: समर्थित credential surface
  - H3: Secret providers config
  - H2: Auth storage
  - H3: auth.cooldowns
  - H2: लॉगिंग
  - H2: Diagnostics
  - H2: Update
  - H2: ACP
  - H2: CLI
  - H2: Wizard
  - H2: Identity
  - H2: Bridge (legacy, removed)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: मीडिया मॉडल template variables
  - H2: Config includes ($include)
  - H2: संबंधित

## gateway/configuration.md

- मार्ग: /gateway/configuration
- शीर्षक:
  - H2: न्यूनतम config
  - H2: config संपादित करना
  - H2: सख्त validation
  - H2: सामान्य कार्य
  - H2: Config hot reload
  - H3: Reload मोड
  - H3: क्या hot-apply होता है बनाम किसे restart चाहिए
  - H3: Reload योजना
  - H2: Config RPC (प्रोग्रामैटिक अपडेट)
  - H2: पर्यावरण variables
  - H2: पूर्ण संदर्भ
  - H2: संबंधित

## gateway/diagnostics.md

- मार्ग: /gateway/diagnostics
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: चैट कमांड
  - H2: export में क्या शामिल है
  - H2: गोपनीयता मॉडल
  - H2: स्थिरता recorder
  - H2: उपयोगी विकल्प
  - H2: diagnostics अक्षम करें
  - H2: संबंधित

## gateway/discovery.md

- मार्ग: /gateway/discovery
- शीर्षक:
  - H2: शब्दावली
  - H2: हम direct और SSH दोनों क्यों रखते हैं
  - H2: Discovery इनपुट (clients कैसे सीखते हैं कि gateway कहां है)
  - H3: 1) Bonjour / DNS-SD discovery
  - H4: service beacon विवरण
  - H3: 2) Tailnet (cross-network)
  - H3: 3) मैनुअल / SSH target
  - H2: transport चयन (client policy)
  - H2: Pairing + auth (direct transport)
  - H2: component के अनुसार जिम्मेदारियां
  - H2: संबंधित

## gateway/doctor.md

- मार्ग: /gateway/doctor
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: Headless और automation मोड
  - H2: read-only lint मोड
  - H2: यह क्या करता है (सारांश)
  - H2: Dreams UI backfill और reset
  - H2: विस्तृत व्यवहार और कारण
  - H2: संबंधित

## gateway/external-apps.md

- मार्ग: /gateway/external-apps
- शीर्षक:
  - H2: आज क्या उपलब्ध है
  - H2: अनुशंसित पथ
  - H2: ऐप code बनाम plugin code
  - H2: संबंधित

## gateway/gateway-lock.md

- मार्ग: /gateway/gateway-lock
- शीर्षक:
  - H2: क्यों
  - H2: तंत्र
  - H2: त्रुटि surface
  - H2: संचालन संबंधी नोट्स
  - H2: संबंधित

## gateway/health.md

- मार्ग: /gateway/health
- शीर्षक:
  - H2: त्वरित जांचें
  - H2: गहन diagnostics
  - H2: Health monitor config
  - H2: Uptime monitoring
  - H3: Monitoring service setup examples
  - H2: जब कुछ विफल हो
  - H2: समर्पित "health" कमांड
  - H2: संबंधित

## gateway/heartbeat.md

- मार्ग: /gateway/heartbeat
- शीर्षक:
  - H2: त्वरित शुरुआत (आरंभिक)
  - H2: डिफॉल्ट
  - H2: Heartbeat prompt किसके लिए है
  - H2: response contract
  - H2: Config
  - H3: scope और precedence
  - H3: प्रति-एजेंट Heartbeat
  - H3: active hours उदाहरण
  - H3: 24/7 setup
  - H3: बहु-खाता उदाहरण
  - H3: फ़ील्ड नोट्स
  - H2: Delivery behavior
  - H2: Visibility controls
  - H3: प्रत्येक flag क्या करता है
  - H3: प्रति-चैनल बनाम प्रति-खाता उदाहरण
  - H3: सामान्य पैटर्न
  - H2: HEARTBEAT.md (वैकल्पिक)
  - H3: tasks: blocks
  - H3: क्या एजेंट HEARTBEAT.md अपडेट कर सकता है?
  - H2: मैनुअल wake (on-demand)
  - H2: Reasoning delivery (वैकल्पिक)
  - H2: लागत जागरूकता
  - H2: Heartbeat के बाद context overflow
  - H2: संबंधित

## gateway/index.md

- मार्ग: /gateway
- शीर्षक:
  - H2: 5-मिनट की स्थानीय शुरुआत
  - H2: Runtime model
  - H2: OpenAI-संगत endpoint
  - H3: Port और bind precedence
  - H3: Hot reload मोड
  - H2: Operator command set
  - H2: कई gateways (एक ही host)
  - H2: Remote access
  - H2: Supervision और service lifecycle
  - H2: Dev profile quick path
  - H2: Protocol quick reference (operator view)
  - H2: Operational checks
  - H3: Liveness
  - H3: Readiness
  - H3: Gap recovery
  - H2: सामान्य failure signatures
  - H2: सुरक्षा guarantees
  - H2: संबंधित

## gateway/local-model-services.md

- मार्ग: /gateway/local-model-services
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: Config shape
  - H2: फ़ील्ड
  - H2: Inferrs example
  - H2: ds4 example
  - H2: Operational notes
  - H2: संबंधित

## gateway/local-models.md

- मार्ग: /gateway/local-models
- शीर्षक:
  - H2: Hardware floor
  - H2: Backend चुनें
  - H2: अनुशंसित: LM Studio + बड़ा स्थानीय मॉडल (Responses API)
  - H3: Hybrid config: hosted primary, local fallback
  - H3: Hosted safety net के साथ local-first
  - H3: Regional hosting / data routing
  - H2: अन्य OpenAI-संगत local proxies
  - H2: छोटे या सख्त backends
  - H2: समस्या निवारण
  - H2: संबंधित

## gateway/logging.md

- मार्ग: /gateway/logging
- शीर्षक:
  - H1: Logging
  - H2: File-based logger
  - H2: Console capture
  - H2: Redaction
  - H2: Gateway WebSocket logs
  - H3: WS log style
  - H2: Console formatting (subsystem logging)
  - H2: संबंधित

## gateway/multiple-gateways.md

- मार्ग: /gateway/multiple-gateways
- शीर्षक:
  - H2: सर्वश्रेष्ठ अनुशंसित setup
  - H2: Rescue-Bot Quickstart
  - H2: यह क्यों काम करता है
  - H2: --profile rescue onboard क्या बदलता है
  - H2: सामान्य multi-gateway setup
  - H2: Isolation checklist
  - H2: Port mapping (derived)
  - H2: Browser/CDP notes (common footgun)
  - H2: Manual env example
  - H2: त्वरित जांचें
  - H2: संबंधित

## gateway/network-model.md

- मार्ग: /gateway/network-model
- शीर्षक:
  - H2: संबंधित

## gateway/openai-http-api.md

- मार्ग: /gateway/openai-http-api
- शीर्षक:
  - H2: Authentication
  - H2: Security boundary (महत्वपूर्ण)
  - H2: इस endpoint का उपयोग कब करें
  - H2: Agent-first model contract
  - H2: Endpoint सक्षम करना
  - H2: Endpoint अक्षम करना
  - H2: Session behavior
  - H2: यह surface क्यों मायने रखता है
  - H2: Model list और agent routing
  - H2: Streaming (SSE)
  - H2: Chat tool contract
  - H3: समर्थित request fields
  - H3: असमर्थित variants
  - H3: Non-streaming tool response shape
  - H3: Streaming tool response shape
  - H3: Tool follow-up loop
  - H2: Open WebUI quick setup
  - H2: उदाहरण
  - H2: संबंधित

## gateway/openresponses-http-api.md

- मार्ग: /gateway/openresponses-http-api
- शीर्षक:
  - H2: Authentication, security, और routing
  - H2: Session behavior
  - H2: Request shape (समर्थित)
  - H2: Items (input)
  - H3: message
  - H3: functioncalloutput (turn-based tools)
  - H3: reasoning और itemreference
  - H2: Tools (client-side function tools)
  - H2: Images (inputimage)
  - H2: Files (inputfile)
  - H2: File + image limits (config)
  - H2: Streaming (SSE)
  - H2: Usage
  - H2: Errors
  - H2: उदाहरण
  - H2: संबंधित

## gateway/openshell.md

- मार्ग: /gateway/openshell
- शीर्षक:
  - H2: पूर्वापेक्षाएं
  - H2: त्वरित शुरुआत
  - H2: Workspace modes
  - H3: mirror
  - H3: remote
  - H3: मोड चुनना
  - H2: Configuration reference
  - H2: उदाहरण
  - H3: Minimal remote setup
  - H3: GPU के साथ Mirror mode
  - H3: कस्टम gateway के साथ प्रति-एजेंट OpenShell
  - H2: Lifecycle management
  - H3: कब दोबारा बनाएं
  - H2: Security hardening
  - H2: मौजूदा सीमाएं
  - H2: यह कैसे काम करता है
  - H2: संबंधित

## gateway/opentelemetry.md

- मार्ग: /gateway/opentelemetry
- शीर्षक:
  - H2: यह एक साथ कैसे फिट होता है
  - H2: त्वरित शुरुआत
  - H2: Exported signals
  - H2: Configuration reference
  - H3: Environment variables
  - H2: Privacy और content capture
  - H2: Sampling और flushing
  - H2: Exported metrics
  - H3: Model usage
  - H3: Message flow
  - H3: Talk
  - H3: Queues और sessions
  - H3: Session liveness telemetry
  - H3: Harness lifecycle
  - H3: Tool execution
  - H3: Exec
  - H3: Diagnostics internals (memory और tool loop)
  - H2: Exported spans
  - H2: Diagnostic event catalog
  - H2: Exporter के बिना
  - H2: Disable
  - H2: संबंधित

## gateway/operator-scopes.md

- मार्ग: /gateway/operator-scopes
- शीर्षक:
  - H2: भूमिकाएं
  - H2: Scope levels
  - H2: Method scope केवल पहला gate है
  - H2: Device pairing approvals
  - H2: Node pairing approvals
  - H2: Shared-secret auth

## gateway/pairing.md

- मार्ग: /gateway/pairing
- शीर्षक:
  - H2: अवधारणाएं
  - H2: Pairing कैसे काम करती है
  - H2: CLI workflow (headless friendly)
  - H2: API surface (gateway protocol)
  - H2: Node command gating (2026.3.31+)
  - H2: Node event trust boundaries (2026.3.31+)
  - H2: Auto-approval (macOS app)
  - H2: Trusted-CIDR device auto-approval
  - H2: Metadata-upgrade auto-approval
  - H2: QR pairing helpers
  - H2: Locality और forwarded headers
  - H2: Storage (local, private)
  - H2: Transport behavior
  - H2: संबंधित

## gateway/prometheus.md

- मार्ग: /gateway/prometheus
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: Exported metrics
  - H2: Label policy
  - H2: PromQL recipes
  - H2: Prometheus और OpenTelemetry export के बीच चुनना
  - H2: समस्या निवारण
  - H2: संबंधित

## gateway/protocol.md

- मार्ग: /gateway/protocol
- शीर्षक:
  - H2: Transport
  - H2: Handshake (connect)
  - H3: Node example
  - H2: Framing
  - H2: Roles + scopes
  - H3: Roles
  - H3: Scopes (operator)
  - H3: Caps/commands/permissions (node)
  - H2: Presence
  - H3: Node background alive event
  - H2: Broadcast event scoping
  - H2: Common RPC method families
  - H3: Common event families
  - H3: Node helper methods
  - H3: Task ledger RPCs
  - H3: Operator helper methods
  - H3: models.list views
  - H2: Exec approvals
  - H2: Agent delivery fallback
  - H2: Versioning
  - H3: Client constants
  - H2: Auth
  - H2: Device identity + pairing
  - H3: Device auth migration diagnostics
  - H2: TLS + pinning
  - H2: Scope
  - H2: संबंधित

## gateway/remote-gateway-readme.md

- रूट: /gateway/remote-gateway-readme
- शीर्षक:
  - H1: दूरस्थ Gateway के साथ OpenClaw.app चलाना
  - H2: सिंहावलोकन
  - H2: त्वरित सेटअप
  - H3: चरण 1: SSH कॉन्फ़िगरेशन जोड़ें
  - H3: चरण 2: SSH कुंजी कॉपी करें
  - H3: चरण 3: दूरस्थ Gateway प्रमाणीकरण कॉन्फ़िगर करें
  - H3: चरण 4: SSH टनल शुरू करें
  - H3: चरण 5: OpenClaw.app फिर से शुरू करें
  - H2: लॉगिन पर टनल स्वतः शुरू करें
  - H3: PLIST फ़ाइल बनाएँ
  - H3: Launch Agent लोड करें
  - H2: समस्या निवारण
  - H2: यह कैसे काम करता है
  - H2: संबंधित

## gateway/remote.md

- रूट: /gateway/remote
- शीर्षक:
  - H2: मूल विचार
  - H2: सामान्य VPN और tailnet सेटअप
  - H3: आपके tailnet में हमेशा चालू Gateway
  - H3: घर का डेस्कटॉप Gateway चलाता है
  - H3: लैपटॉप Gateway चलाता है
  - H2: कमांड प्रवाह (क्या कहाँ चलता है)
  - H2: SSH टनल (CLI + टूल)
  - H2: CLI दूरस्थ डिफ़ॉल्ट
  - H2: क्रेडेंशियल प्राथमिकता
  - H2: चैट UI दूरस्थ पहुँच
  - H2: macOS ऐप दूरस्थ मोड
  - H2: सुरक्षा नियम (दूरस्थ/VPN)
  - H3: macOS: LaunchAgent के माध्यम से स्थायी SSH टनल
  - H4: चरण 1: SSH कॉन्फ़िगरेशन जोड़ें
  - H4: चरण 2: SSH कुंजी कॉपी करें (एक बार)
  - H4: चरण 3: gateway टोकन कॉन्फ़िगर करें
  - H4: चरण 4: LaunchAgent बनाएँ
  - H4: चरण 5: LaunchAgent लोड करें
  - H4: समस्या निवारण
  - H2: संबंधित

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- रूट: /gateway/sandbox-vs-tool-policy-vs-elevated
- शीर्षक:
  - H2: त्वरित डिबग
  - H2: सैंडबॉक्स: टूल कहाँ चलते हैं
  - H3: बाइंड माउंट (सुरक्षा त्वरित जाँच)
  - H2: टूल नीति: कौन से टूल मौजूद/कॉल किए जा सकते हैं
  - H3: टूल समूह (शॉर्टहैंड)
  - H2: उन्नत: केवल exec "होस्ट पर चलाएँ"
  - H2: सामान्य "सैंडबॉक्स जेल" सुधार
  - H3: "टूल X सैंडबॉक्स टूल नीति द्वारा अवरुद्ध"
  - H3: "मुझे लगा यह main था, यह सैंडबॉक्स में क्यों है?"
  - H2: संबंधित

## gateway/sandboxing.md

- रूट: /gateway/sandboxing
- शीर्षक:
  - H2: क्या सैंडबॉक्स किया जाता है
  - H2: मोड
  - H2: दायरा
  - H2: बैकएंड
  - H3: बैकएंड चुनना
  - H3: Docker बैकएंड
  - H3: SSH बैकएंड
  - H3: OpenShell बैकएंड
  - H4: वर्कस्पेस मोड
  - H4: OpenShell जीवनचक्र
  - H2: वर्कस्पेस पहुँच
  - H2: कस्टम बाइंड माउंट
  - H2: इमेज और सेटअप
  - H2: setupCommand (एक बार का कंटेनर सेटअप)
  - H2: टूल नीति और बचाव मार्ग
  - H2: मल्टी-एजेंट ओवरराइड
  - H2: न्यूनतम सक्षम उदाहरण
  - H2: संबंधित

## gateway/secrets-plan-contract.md

- रूट: /gateway/secrets-plan-contract
- शीर्षक:
  - H2: प्लान फ़ाइल का आकार
  - H2: Provider upsert और delete
  - H2: समर्थित लक्ष्य दायरा
  - H2: लक्ष्य प्रकार व्यवहार
  - H2: पथ सत्यापन नियम
  - H2: विफलता व्यवहार
  - H2: Exec provider सहमति व्यवहार
  - H2: रनटाइम और ऑडिट दायरा नोट्स
  - H2: ऑपरेटर जाँच
  - H2: संबंधित दस्तावेज़

## gateway/secrets.md

- रूट: /gateway/secrets
- शीर्षक:
  - H2: लक्ष्य और रनटाइम मॉडल
  - H2: एजेंट-पहुँच सीमा
  - H2: सक्रिय-सतह फ़िल्टरिंग
  - H2: Gateway प्रमाणीकरण सतह निदान
  - H2: ऑनबोर्डिंग संदर्भ पूर्व-जाँच
  - H2: SecretRef अनुबंध
  - H2: Provider कॉन्फ़िगरेशन
  - H2: फ़ाइल-समर्थित API कुंजियाँ
  - H2: Exec एकीकरण उदाहरण
  - H2: MCP सर्वर परिवेश चर
  - H2: सैंडबॉक्स SSH प्रमाणीकरण सामग्री
  - H2: समर्थित क्रेडेंशियल सतह
  - H2: आवश्यक व्यवहार और प्राथमिकता
  - H2: सक्रियण ट्रिगर
  - H2: अवनत और पुनर्प्राप्त संकेत
  - H2: कमांड-पथ समाधान
  - H2: ऑडिट और कॉन्फ़िगर वर्कफ़्लो
  - H2: एक-तरफ़ा सुरक्षा नीति
  - H2: लेगेसी प्रमाणीकरण संगतता नोट्स
  - H2: Web UI नोट
  - H2: संबंधित

## gateway/security/audit-checks.md

- रूट: /gateway/security/audit-checks
- शीर्षक:
  - H2: संबंधित

## gateway/security/exposure-runbook.md

- रूट: /gateway/security/exposure-runbook
- शीर्षक:
  - H2: एक्सपोज़र पैटर्न चुनें
  - H2: पूर्व-उड़ान इन्वेंटरी
  - H2: बेसलाइन जाँच
  - H2: न्यूनतम सुरक्षित बेसलाइन
  - H2: DM और समूह एक्सपोज़र
  - H2: रिवर्स प्रॉक्सी जाँच
  - H2: टूल और सैंडबॉक्स समीक्षा
  - H2: बदलाव के बाद सत्यापन
  - H2: रोलबैक योजना
  - H2: समीक्षा चेकलिस्ट

## gateway/security/index.md

- रूट: /gateway/security
- शीर्षक:
  - H2: पहले दायरा: निजी सहायक सुरक्षा मॉडल
  - H2: त्वरित जाँच: openclaw सुरक्षा ऑडिट
  - H3: प्रकाशित पैकेज निर्भरता लॉक
  - H3: डिप्लॉयमेंट और होस्ट भरोसा
  - H3: सुरक्षित फ़ाइल ऑपरेशन
  - H3: साझा Slack वर्कस्पेस: वास्तविक जोखिम
  - H3: कंपनी-साझा एजेंट: स्वीकार्य पैटर्न
  - H2: Gateway और Node भरोसा अवधारणा
  - H2: भरोसा सीमा मैट्रिक्स
  - H2: डिज़ाइन के अनुसार कमजोरियाँ नहीं
  - H2: 60 सेकंड में कठोर बेसलाइन
  - H2: साझा इनबॉक्स त्वरित नियम
  - H2: संदर्भ दृश्यता मॉडल
  - H2: ऑडिट क्या जाँचता है (उच्च स्तर)
  - H2: क्रेडेंशियल भंडारण मानचित्र
  - H2: सुरक्षा ऑडिट चेकलिस्ट
  - H2: सुरक्षा ऑडिट शब्दावली
  - H2: HTTP पर Control UI
  - H2: असुरक्षित या खतरनाक फ़्लैग सारांश
  - H2: रिवर्स प्रॉक्सी कॉन्फ़िगरेशन
  - H2: HSTS और origin नोट्स
  - H2: स्थानीय सत्र लॉग डिस्क पर रहते हैं
  - H2: Node निष्पादन (system.run)
  - H2: गतिशील Skills (वॉचर / दूरस्थ Node)
  - H2: खतरा मॉडल
  - H2: मूल अवधारणा: बुद्धिमत्ता से पहले पहुँच नियंत्रण
  - H2: कमांड प्राधिकरण मॉडल
  - H2: कंट्रोल प्लेन टूल जोखिम
  - H2: Plugins
  - H2: DM पहुँच मॉडल: पेयरिंग, अनुमति-सूची, खुला, अक्षम
  - H2: DM सत्र पृथक्करण (मल्टी-यूज़र मोड)
  - H3: सुरक्षित DM मोड (अनुशंसित)
  - H2: DM और समूहों के लिए अनुमति-सूचियाँ
  - H2: प्रॉम्प्ट इंजेक्शन (यह क्या है, यह क्यों मायने रखता है)
  - H2: बाहरी सामग्री विशेष-टोकन सैनिटाइज़ेशन
  - H2: असुरक्षित बाहरी सामग्री बाईपास फ़्लैग
  - H3: प्रॉम्प्ट इंजेक्शन के लिए सार्वजनिक DM की आवश्यकता नहीं होती
  - H3: स्वयं-होस्टेड LLM बैकएंड
  - H3: मॉडल क्षमता (सुरक्षा नोट)
  - H2: समूहों में रीजनिंग और वर्बोज़ आउटपुट
  - H2: कॉन्फ़िगरेशन कठोरीकरण उदाहरण
  - H3: फ़ाइल अनुमतियाँ
  - H3: नेटवर्क एक्सपोज़र (bind, port, firewall)
  - H3: UFW के साथ Docker पोर्ट प्रकाशन
  - H3: mDNS/Bonjour खोज
  - H3: Gateway WebSocket लॉक डाउन करें (स्थानीय प्रमाणीकरण)
  - H3: Tailscale Serve पहचान हेडर
  - H3: Node होस्ट के माध्यम से ब्राउज़र नियंत्रण (अनुशंसित)
  - H3: डिस्क पर सीक्रेट
  - H3: वर्कस्पेस .env फ़ाइलें
  - H3: लॉग और ट्रांसक्रिप्ट (रिडैक्शन और रिटेंशन)
  - H3: DM: डिफ़ॉल्ट रूप से पेयरिंग
  - H3: समूह: हर जगह उल्लेख आवश्यक
  - H3: अलग नंबर (WhatsApp, Signal, Telegram)
  - H3: केवल-पढ़ने का मोड (सैंडबॉक्स और टूल के माध्यम से)
  - H3: सुरक्षित बेसलाइन (कॉपी/पेस्ट)
  - H2: सैंडबॉक्सिंग (अनुशंसित)
  - H3: सब-एजेंट डेलिगेशन गार्डरेल
  - H2: ब्राउज़र नियंत्रण जोखिम
  - H3: ब्राउज़र SSRF नीति (डिफ़ॉल्ट रूप से सख्त)
  - H2: प्रति-एजेंट पहुँच प्रोफ़ाइल (मल्टी-एजेंट)
  - H3: उदाहरण: पूर्ण पहुँच (कोई सैंडबॉक्स नहीं)
  - H3: उदाहरण: केवल-पढ़ने वाले टूल + केवल-पढ़ने वाला वर्कस्पेस
  - H3: उदाहरण: कोई फ़ाइलसिस्टम/शेल पहुँच नहीं (provider मैसेजिंग अनुमत)
  - H2: घटना प्रतिक्रिया
  - H3: सीमित करें
  - H3: रोटेट करें (यदि सीक्रेट लीक हुए हों तो समझौता मानें)
  - H3: ऑडिट
  - H3: रिपोर्ट के लिए एकत्र करें
  - H2: सीक्रेट स्कैनिंग
  - H2: सुरक्षा समस्याओं की रिपोर्ट करना

## gateway/security/secure-file-operations.md

- रूट: /gateway/security/secure-file-operations
- शीर्षक:
  - H2: डिफ़ॉल्ट: कोई Python helper नहीं
  - H2: Python के बिना क्या सुरक्षित रहता है
  - H2: Python क्या जोड़ता है
  - H2: Plugin और core मार्गदर्शन

## gateway/security/shrinkwrap.md

- रूट: /gateway/security/shrinkwrap
- शीर्षक:
  - H2: आसान संस्करण
  - H2: OpenClaw इसका उपयोग क्यों करता है
  - H2: तकनीकी विवरण

## gateway/tailscale.md

- रूट: /gateway/tailscale
- शीर्षक:
  - H2: मोड
  - H2: प्रमाणीकरण
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H3: केवल Tailnet (Serve)
  - H3: केवल Tailnet (Tailnet IP से bind करें)
  - H3: सार्वजनिक इंटरनेट (Funnel + साझा पासवर्ड)
  - H2: CLI उदाहरण
  - H2: नोट्स
  - H2: ब्राउज़र नियंत्रण (दूरस्थ Gateway + स्थानीय ब्राउज़र)
  - H2: Tailscale पूर्वापेक्षाएँ + सीमाएँ
  - H2: और जानें
  - H2: संबंधित

## gateway/tools-invoke-http-api.md

- रूट: /gateway/tools-invoke-http-api
- शीर्षक:
  - H2: प्रमाणीकरण
  - H2: सुरक्षा सीमा (महत्वपूर्ण)
  - H2: अनुरोध बॉडी
  - H2: नीति + रूटिंग व्यवहार
  - H2: प्रतिक्रियाएँ
  - H2: उदाहरण
  - H2: संबंधित

## gateway/troubleshooting.md

- रूट: /gateway/troubleshooting
- शीर्षक:
  - H2: कमांड सीढ़ी
  - H2: अपडेट के बाद
  - H2: स्प्लिट ब्रेन इंस्टॉल और नई कॉन्फ़िगरेशन गार्ड
  - H2: रोलबैक के बाद प्रोटोकॉल असंगति
  - H2: पथ एस्केप के रूप में Skill symlink छोड़ा गया
  - H2: लंबे संदर्भ के लिए Anthropic 429 अतिरिक्त उपयोग आवश्यक
  - H2: अपस्ट्रीम 403 अवरुद्ध प्रतिक्रियाएँ
  - H2: स्थानीय OpenAI-संगत बैकएंड सीधे प्रोब पास करता है लेकिन एजेंट रन विफल होते हैं
  - H2: कोई उत्तर नहीं
  - H2: Dashboard control UI कनेक्टिविटी
  - H3: Auth detail code त्वरित मानचित्र
  - H2: Gateway सेवा नहीं चल रही
  - H2: macOS gateway चुपचाप प्रतिक्रिया देना बंद कर देता है, फिर dashboard छूने पर फिर शुरू करता है
  - H2: अधिक मेमोरी उपयोग के दौरान Gateway बंद हो जाता है
  - H2: Gateway ने अमान्य कॉन्फ़िगरेशन अस्वीकार किया
  - H2: Gateway probe चेतावनियाँ
  - H2: Channel कनेक्टेड, संदेश प्रवाहित नहीं हो रहे
  - H2: Cron और Heartbeat डिलीवरी
  - H2: Node पेयर हुआ, टूल विफल
  - H2: ब्राउज़र टूल विफल
  - H2: यदि आपने अपग्रेड किया और कुछ अचानक टूट गया
  - H2: संबंधित

## gateway/trusted-proxy-auth.md

- रूट: /gateway/trusted-proxy-auth
- शीर्षक:
  - H2: कब उपयोग करें
  - H2: कब उपयोग न करें
  - H2: यह कैसे काम करता है
  - H2: Control UI पेयरिंग व्यवहार
  - H2: कॉन्फ़िगरेशन
  - H3: कॉन्फ़िगरेशन संदर्भ
  - H2: TLS टर्मिनेशन और HSTS
  - H3: रोलआउट मार्गदर्शन
  - H2: प्रॉक्सी सेटअप उदाहरण
  - H2: मिश्रित टोकन कॉन्फ़िगरेशन
  - H2: ऑपरेटर स्कोप हेडर
  - H2: सुरक्षा चेकलिस्ट
  - H2: सुरक्षा ऑडिट
  - H2: समस्या निवारण
  - H2: टोकन प्रमाणीकरण से माइग्रेशन
  - H2: संबंधित

## help/debugging.md

- रूट: /help/debugging
- शीर्षक:
  - H2: रनटाइम डिबग ओवरराइड
  - H2: सत्र ट्रेस आउटपुट
  - H2: Plugin जीवनचक्र ट्रेस
  - H2: CLI स्टार्टअप और कमांड प्रोफ़ाइलिंग
  - H2: Gateway watch मोड
  - H2: Dev प्रोफ़ाइल + dev gateway (--dev)
  - H2: कच्ची स्ट्रीम लॉगिंग (OpenClaw)
  - H2: कच्ची OpenAI-संगत chunk लॉगिंग
  - H2: सुरक्षा नोट्स
  - H2: VSCode में डिबगिंग
  - H3: सेटअप
  - H3: नोट्स
  - H2: संबंधित

## help/environment.md

- रूट: /help/environment
- शीर्षक:
  - H2: प्राथमिकता (सर्वोच्च → न्यूनतम)
  - H2: Provider क्रेडेंशियल और वर्कस्पेस .env
  - H2: Config env ब्लॉक
  - H2: Shell env import
  - H2: Exec shell snapshots
  - H2: रनटाइम-इंजेक्टेड env vars
  - H2: UI env vars
  - H2: कॉन्फ़िगरेशन में env var प्रतिस्थापन
  - H2: Secret refs बनाम ${ENV} strings
  - H2: पथ-संबंधित env vars
  - H2: लॉगिंग
  - H3: OPENCLAWHOME
  - H2: nvm उपयोगकर्ता: webfetch TLS विफलताएँ
  - H2: लेगेसी परिवेश चर
  - H2: संबंधित

## help/faq-first-run.md

- रूट: /help/faq-first-run
- शीर्षक:
  - H2: त्वरित शुरुआत और पहली-बार सेटअप
  - H2: संबंधित

## help/faq-models.md

- रूट: /help/faq-models
- शीर्षक:
  - H2: मॉडल: डिफ़ॉल्ट, चयन, उपनाम, स्विचिंग
  - H2: मॉडल failover और "सभी मॉडल विफल हुए"
  - H2: Auth profiles: वे क्या हैं और उन्हें कैसे प्रबंधित करें
  - H2: संबंधित

## help/faq.md

- रूट: /help/faq
- शीर्षक:
  - H2: यदि कुछ टूटा है तो पहले 60 सेकंड
  - H2: त्वरित शुरुआत और पहली-बार सेटअप
  - H2: OpenClaw क्या है?
  - H2: Skills और ऑटोमेशन
  - H2: सैंडबॉक्सिंग और मेमोरी
  - H2: चीज़ें डिस्क पर कहाँ रहती हैं
  - H2: कॉन्फ़िगरेशन मूल बातें
  - H2: दूरस्थ gateways और Node
  - H2: Env vars और .env लोडिंग
  - H2: सत्र और कई चैट
  - H2: मॉडल, failover, और auth profiles
  - H2: Gateway: पोर्ट, "पहले से चल रहा है", और दूरस्थ मोड
  - H2: लॉगिंग और डिबगिंग
  - H2: मीडिया और अटैचमेंट
  - H2: सुरक्षा और पहुँच नियंत्रण
  - H2: चैट कमांड, कार्य रोकना, और "यह नहीं रुकेगा"
  - H2: विविध
  - H2: संबंधित

## help/index.md

- रूट: /help
- शीर्षक:
  - H2: FAQ
  - H2: निदान
  - H2: परीक्षण
  - H2: समुदाय और मेटा

## help/scripts.md

- रूट: /help/scripts
- शीर्षक:
  - H2: परंपराएँ
  - H2: Auth monitoring scripts
  - H2: GitHub read helper
  - H2: स्क्रिप्ट जोड़ते समय
  - H2: संबंधित

## help/testing-live.md

- मार्ग: /help/testing-live
- शीर्षक:
  - H2: लाइव: लोकल स्मोक कमांड
  - H2: लाइव: Android नोड क्षमता स्वीप
  - H2: लाइव: मॉडल स्मोक (प्रोफ़ाइल कुंजियाँ)
  - H3: लेयर 1: डायरेक्ट मॉडल कम्प्लीशन (कोई Gateway नहीं)
  - H3: लेयर 2: Gateway + dev agent स्मोक ("@openclaw" वास्तव में क्या करता है)
  - H2: लाइव: CLI बैकएंड स्मोक (Claude, Gemini, या अन्य लोकल CLI)
  - H2: लाइव: APNs HTTP/2 प्रॉक्सी पहुँचयोग्यता
  - H2: लाइव: ACP बाइंड स्मोक (/acp spawn ... --bind here)
  - H2: लाइव: Codex app-server harness स्मोक
  - H3: अनुशंसित लाइव रेसिपी
  - H2: लाइव: मॉडल मैट्रिक्स (हम क्या कवर करते हैं)
  - H3: आधुनिक स्मोक सेट (टूल कॉलिंग + इमेज)
  - H3: बेसलाइन: टूल कॉलिंग (Read + वैकल्पिक Exec)
  - H3: विज़न: इमेज भेजना (अटैचमेंट → मल्टीमोडल संदेश)
  - H3: एग्रीगेटर / वैकल्पिक गेटवे
  - H2: क्रेडेंशियल (कभी कमिट न करें)
  - H2: Deepgram लाइव (ऑडियो ट्रांसक्रिप्शन)
  - H2: BytePlus कोडिंग योजना लाइव
  - H2: ComfyUI वर्कफ़्लो मीडिया लाइव
  - H2: इमेज जनरेशन लाइव
  - H2: संगीत जनरेशन लाइव
  - H2: वीडियो जनरेशन लाइव
  - H2: मीडिया लाइव हार्नेस
  - H2: संबंधित

## help/testing-updates-plugins.md

- मार्ग: /help/testing-updates-plugins
- शीर्षक:
  - H2: हम क्या सुरक्षित रखते हैं
  - H2: विकास के दौरान लोकल प्रमाण
  - H2: Docker लेन
  - H2: पैकेज स्वीकृति
  - H2: रिलीज़ डिफ़ॉल्ट
  - H2: लेगेसी संगतता
  - H2: कवरेज जोड़ना
  - H2: विफलता ट्रायाज

## help/testing.md

- मार्ग: /help/testing
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: टेस्ट अस्थायी डायरेक्टरियाँ
  - H2: QA-विशिष्ट रनर
  - H3: Convex के ज़रिए साझा Telegram क्रेडेंशियल (v1)
  - H3: QA में चैनल जोड़ना
  - H2: टेस्ट सूट (क्या कहाँ चलता है)
  - H3: यूनिट / इंटीग्रेशन (डिफ़ॉल्ट)
  - H3: स्थिरता (gateway)
  - H3: E2E (रेपो एग्रीगेट)
  - H3: E2E (gateway स्मोक)
  - H3: E2E (Control UI मॉक्ड ब्राउज़र)
  - H3: E2E: OpenShell बैकएंड स्मोक
  - H3: लाइव (वास्तविक प्रदाता + वास्तविक मॉडल)
  - H2: मुझे कौन-सा सूट चलाना चाहिए?
  - H2: लाइव (नेटवर्क-स्पर्शी) टेस्ट
  - H2: Docker रनर (वैकल्पिक "Linux में काम करता है" जाँच)
  - H2: Docs sanity
  - H2: ऑफ़लाइन रिग्रेशन (CI-सुरक्षित)
  - H2: एजेंट विश्वसनीयता मूल्यांकन (skills)
  - H2: कॉन्ट्रैक्ट टेस्ट (plugin और चैनल आकार)
  - H3: कमांड
  - H3: चैनल कॉन्ट्रैक्ट
  - H3: प्रदाता स्थिति कॉन्ट्रैक्ट
  - H3: प्रदाता कॉन्ट्रैक्ट
  - H3: कब चलाएँ
  - H2: रिग्रेशन जोड़ना (मार्गदर्शन)
  - H2: संबंधित

## help/troubleshooting.md

- मार्ग: /help/troubleshooting
- शीर्षक:
  - H2: पहले 60 सेकंड
  - H2: असिस्टेंट सीमित लगता है या टूल गायब हैं
  - H2: Anthropic लंबे संदर्भ 429
  - H2: लोकल OpenAI-संगत बैकएंड सीधे काम करता है लेकिन OpenClaw में विफल होता है
  - H2: Plugin इंस्टॉल openclaw extensions गायब होने से विफल होता है
  - H2: इंस्टॉल नीति plugin इंस्टॉल या अपडेट ब्लॉक करती है
  - H2: Plugin मौजूद है लेकिन संदिग्ध स्वामित्व से ब्लॉक है
  - H2: निर्णय वृक्ष
  - H2: संबंधित

## index.md

- मार्ग: /
- शीर्षक:
  - H1: OpenClaw 🦞
  - H2: OpenClaw क्या है?
  - H2: यह कैसे काम करता है
  - H2: मुख्य क्षमताएँ
  - H2: क्विक स्टार्ट
  - H2: डैशबोर्ड
  - H2: कॉन्फ़िगरेशन (वैकल्पिक)
  - H2: यहाँ से शुरू करें
  - H2: और जानें

## install/ansible.md

- मार्ग: /install/ansible
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: आपको क्या मिलता है
  - H2: क्विक स्टार्ट
  - H2: क्या इंस्टॉल होता है
  - H2: इंस्टॉल के बाद सेटअप
  - H3: त्वरित कमांड
  - H2: सुरक्षा आर्किटेक्चर
  - H2: मैनुअल इंस्टॉलेशन
  - H2: अपडेट करना
  - H2: समस्या निवारण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## install/azure.md

- मार्ग: /install/azure
- शीर्षक:
  - H2: आप क्या करेंगे
  - H2: आपको क्या चाहिए
  - H2: डिप्लॉयमेंट कॉन्फ़िगर करें
  - H2: Azure संसाधन डिप्लॉय करें
  - H2: OpenClaw इंस्टॉल करें
  - H2: लागत संबंधी विचार
  - H2: सफ़ाई
  - H2: अगले चरण
  - H2: संबंधित

## install/bun.md

- मार्ग: /install/bun
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: लाइफ़साइकल स्क्रिप्ट
  - H2: सावधानियाँ
  - H2: संबंधित

## install/clawdock.md

- मार्ग: /install/clawdock
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: आपको क्या मिलता है
  - H3: बुनियादी संचालन
  - H3: कंटेनर एक्सेस
  - H3: वेब UI और पेयरिंग
  - H3: सेटअप और रखरखाव
  - H3: यूटिलिटीज़
  - H2: पहली बार का फ़्लो
  - H2: कॉन्फ़िग और सीक्रेट
  - H2: संबंधित

## install/development-channels.md

- मार्ग: /install/development-channels
- शीर्षक:
  - H2: चैनल बदलना
  - H2: एकबारगी संस्करण या टैग लक्ष्यीकरण
  - H2: ड्राई रन
  - H2: Plugins और चैनल
  - H2: वर्तमान स्थिति जाँचना
  - H2: टैगिंग की सर्वोत्तम प्रथाएँ
  - H2: macOS ऐप उपलब्धता
  - H2: संबंधित

## install/digitalocean.md

- मार्ग: /install/digitalocean
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: सेटअप
  - H2: स्थायित्व और बैकअप
  - H2: 1 GB RAM सुझाव
  - H2: समस्या निवारण
  - H2: अगले चरण
  - H2: संबंधित

## install/docker-vm-runtime.md

- मार्ग: /install/docker-vm-runtime
- शीर्षक:
  - H2: आवश्यक बाइनरी इमेज में बेक करें
  - H2: बिल्ड और लॉन्च
  - H2: क्या कहाँ बना रहता है
  - H2: अपडेट
  - H2: संबंधित

## install/docker.md

- मार्ग: /install/docker
- शीर्षक:
  - H2: क्या Docker मेरे लिए सही है?
  - H2: पूर्वापेक्षाएँ
  - H2: कंटेनराइज़्ड gateway
  - H3: मैनुअल फ़्लो
  - H3: एनवायरनमेंट वेरिएबल
  - H3: ऑब्ज़र्वेबिलिटी
  - H3: हेल्थ चेक
  - H3: LAN बनाम loopback
  - H3: होस्ट लोकल प्रदाता
  - H3: Docker में Claude CLI बैकएंड
  - H3: Bonjour / mDNS
  - H3: स्टोरेज और स्थायित्व
  - H3: Shell हेल्पर (वैकल्पिक)
  - H3: VPS पर चला रहे हैं?
  - H2: एजेंट sandbox
  - H3: त्वरित सक्षम करें
  - H2: समस्या निवारण
  - H2: संबंधित

## install/exe-dev.md

- मार्ग: /install/exe-dev
- शीर्षक:
  - H2: शुरुआती लोगों के लिए त्वरित पथ
  - H2: आपको क्या चाहिए
  - H2: Shelley के साथ स्वचालित इंस्टॉल
  - H2: मैनुअल इंस्टॉलेशन
  - H2: 1) VM बनाएँ
  - H2: 2) पूर्वापेक्षाएँ इंस्टॉल करें (VM पर)
  - H2: 3) OpenClaw इंस्टॉल करें
  - H2: 4) OpenClaw को पोर्ट 8000 पर प्रॉक्सी करने के लिए nginx सेटअप करें
  - H2: 5) OpenClaw एक्सेस करें और विशेषाधिकार दें
  - H2: रिमोट चैनल सेटअप
  - H2: रिमोट एक्सेस
  - H2: अपडेट करना
  - H2: संबंधित

## install/fly.md

- मार्ग: /install/fly
- शीर्षक:
  - H2: आपको क्या चाहिए
  - H2: शुरुआती लोगों के लिए त्वरित पथ
  - H2: समस्या निवारण
  - H3: "App अपेक्षित पते पर नहीं सुन रहा है"
  - H3: Health checks विफल / कनेक्शन अस्वीकृत
  - H3: OOM / मेमोरी समस्याएँ
  - H3: Gateway लॉक समस्याएँ
  - H3: कॉन्फ़िग नहीं पढ़ा जा रहा
  - H3: SSH के ज़रिए कॉन्फ़िग लिखना
  - H3: स्थिति बनी नहीं रह रही
  - H2: अपडेट
  - H3: मशीन कमांड अपडेट करना
  - H2: निजी डिप्लॉयमेंट (कठोर)
  - H3: निजी डिप्लॉयमेंट कब उपयोग करें
  - H3: सेटअप
  - H3: निजी डिप्लॉयमेंट एक्सेस करना
  - H3: निजी डिप्लॉयमेंट के साथ Webhooks
  - H3: सुरक्षा लाभ
  - H2: नोट्स
  - H2: लागत
  - H2: अगले चरण
  - H2: संबंधित

## install/gcp.md

- मार्ग: /install/gcp
- शीर्षक:
  - H2: हम क्या कर रहे हैं (सरल शब्दों में)?
  - H2: त्वरित पथ (अनुभवी ऑपरेटर)
  - H2: आपको क्या चाहिए
  - H2: समस्या निवारण
  - H2: सेवा खाते (सुरक्षा सर्वोत्तम अभ्यास)
  - H2: अगले चरण
  - H2: संबंधित

## install/hetzner.md

- मार्ग: /install/hetzner
- शीर्षक:
  - H2: लक्ष्य
  - H2: हम क्या कर रहे हैं (सरल शब्दों में)?
  - H2: त्वरित पथ (अनुभवी ऑपरेटर)
  - H2: आपको क्या चाहिए
  - H2: Infrastructure as Code (Terraform)
  - H2: अगले चरण
  - H2: संबंधित

## install/hostinger.md

- मार्ग: /install/hostinger
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: विकल्प A: 1-क्लिक OpenClaw
  - H2: विकल्प B: VPS पर OpenClaw
  - H2: अपना सेटअप सत्यापित करें
  - H2: समस्या निवारण
  - H2: अगले चरण
  - H2: संबंधित

## install/index.md

- मार्ग: /install
- शीर्षक:
  - H2: सिस्टम आवश्यकताएँ
  - H2: अनुशंसित: इंस्टॉलर स्क्रिप्ट
  - H2: वैकल्पिक इंस्टॉल विधियाँ
  - H3: लोकल प्रीफ़िक्स इंस्टॉलर (install-cli.sh)
  - H3: npm, pnpm, या bun
  - H3: स्रोत से
  - H3: GitHub main checkout से इंस्टॉल करें
  - H3: कंटेनर और पैकेज मैनेजर
  - H2: इंस्टॉल सत्यापित करें
  - H2: होस्टिंग और डिप्लॉयमेंट
  - H2: अपडेट, माइग्रेट, या अनइंस्टॉल करें
  - H2: समस्या निवारण: openclaw नहीं मिला

## install/installer.md

- मार्ग: /install/installer
- शीर्षक:
  - H2: त्वरित कमांड
  - H2: install.sh
  - H3: फ़्लो (install.sh)
  - H3: स्रोत checkout पहचान
  - H3: उदाहरण (install.sh)
  - H2: install-cli.sh
  - H3: फ़्लो (install-cli.sh)
  - H3: उदाहरण (install-cli.sh)
  - H2: install.ps1
  - H3: फ़्लो (install.ps1)
  - H3: उदाहरण (install.ps1)
  - H2: CI और ऑटोमेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## install/kubernetes.md

- मार्ग: /install/kubernetes
- शीर्षक:
  - H2: Helm क्यों नहीं?
  - H2: आपको क्या चाहिए
  - H2: क्विक स्टार्ट
  - H2: Kind के साथ लोकल टेस्टिंग
  - H2: चरण दर चरण
  - H3: 1) डिप्लॉय करें
  - H3: 2) gateway एक्सेस करें
  - H2: क्या डिप्लॉय होता है
  - H2: कस्टमाइज़ेशन
  - H3: एजेंट निर्देश
  - H3: Gateway कॉन्फ़िग
  - H3: प्रदाता जोड़ें
  - H3: कस्टम namespace
  - H3: कस्टम image
  - H3: port-forward से आगे एक्सपोज़ करें
  - H2: फिर से डिप्लॉय करें
  - H2: हटाएँ
  - H2: आर्किटेक्चर नोट्स
  - H2: फ़ाइल संरचना
  - H2: संबंधित

## install/macos-vm.md

- मार्ग: /install/macos-vm
- शीर्षक:
  - H2: अनुशंसित डिफ़ॉल्ट (अधिकांश उपयोगकर्ता)
  - H2: macOS VM विकल्प
  - H3: आपके Apple Silicon Mac पर लोकल VM (Lume)
  - H3: होस्टेड Mac प्रदाता (क्लाउड)
  - H2: त्वरित पथ (Lume, अनुभवी उपयोगकर्ता)
  - H2: आपको क्या चाहिए (Lume)
  - H2: 1) Lume इंस्टॉल करें
  - H2: 2) macOS VM बनाएँ
  - H2: 3) Setup Assistant पूरा करें
  - H2: 4) VM IP पता प्राप्त करें
  - H2: 5) VM में SSH करें
  - H2: 6) OpenClaw इंस्टॉल करें
  - H2: 7) चैनल कॉन्फ़िगर करें
  - H2: 8) VM को headlessly चलाएँ
  - H2: बोनस: iMessage इंटीग्रेशन
  - H2: golden image सहेजें
  - H2: 24/7 चलाना
  - H2: समस्या निवारण
  - H2: संबंधित docs

## install/migrating-claude.md

- मार्ग: /install/migrating-claude
- शीर्षक:
  - H2: इम्पोर्ट करने के दो तरीके
  - H2: क्या इम्पोर्ट होता है
  - H2: क्या केवल आर्काइव रहता है
  - H2: स्रोत चयन
  - H2: अनुशंसित फ़्लो
  - H2: कॉन्फ़्लिक्ट हैंडलिंग
  - H2: ऑटोमेशन के लिए JSON आउटपुट
  - H2: समस्या निवारण
  - H2: संबंधित

## install/migrating-hermes.md

- मार्ग: /install/migrating-hermes
- शीर्षक:
  - H2: इम्पोर्ट करने के दो तरीके
  - H2: क्या इम्पोर्ट होता है
  - H2: क्या केवल आर्काइव रहता है
  - H2: अनुशंसित फ़्लो
  - H2: कॉन्फ़्लिक्ट हैंडलिंग
  - H2: सीक्रेट
  - H2: ऑटोमेशन के लिए JSON आउटपुट
  - H2: समस्या निवारण
  - H2: संबंधित

## install/migrating.md

- मार्ग: /install/migrating
- शीर्षक:
  - H2: किसी अन्य एजेंट सिस्टम से इम्पोर्ट करें
  - H2: OpenClaw को नई मशीन पर ले जाएँ
  - H3: माइग्रेशन चरण
  - H3: सामान्य गलतियाँ
  - H3: सत्यापन चेकलिस्ट
  - H2: plugin को उसी जगह अपग्रेड करें
  - H2: संबंधित

## install/nix.md

- मार्ग: /install/nix
- शीर्षक:
  - H2: आपको क्या मिलता है
  - H2: क्विक स्टार्ट
  - H2: Nix-mode runtime व्यवहार
  - H3: Nix mode में क्या बदलता है
  - H3: कॉन्फ़िग और स्थिति पथ
  - H3: सेवा PATH डिस्कवरी
  - H2: संबंधित

## install/node.md

- मार्ग: /install/node
- शीर्षक:
  - H2: अपना संस्करण जाँचें
  - H2: Node इंस्टॉल करें
  - H2: समस्या निवारण
  - H3: openclaw: command not found
  - H3: npm install -g पर अनुमति त्रुटियाँ (Linux)
  - H2: संबंधित

## install/northflank.mdx

- मार्ग: /install/northflank
- शीर्षक:
  - H1: Northflank
  - H2: कैसे शुरू करें
  - H2: आपको क्या मिलता है
  - H2: चैनल कनेक्ट करें
  - H2: अगले चरण

## install/oracle.md

- मार्ग: /install/oracle
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: सेटअप
  - H2: सुरक्षा स्थिति सत्यापित करें
  - H2: ARM नोट्स
  - H2: स्थायित्व और बैकअप
  - H2: फ़ॉलबैक: SSH tunnel
  - H2: समस्या निवारण
  - H2: अगले चरण
  - H2: संबंधित

## install/podman.md

- मार्ग: /install/podman
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: क्विक स्टार्ट
  - H2: Podman और Tailscale
  - H2: Systemd (Quadlet, वैकल्पिक)
  - H2: कॉन्फ़िग, env, और स्टोरेज
  - H2: उपयोगी कमांड
  - H2: समस्या निवारण
  - H2: संबंधित

## install/railway.mdx

- मार्ग: /install/railway
- शीर्षक:
  - H1: Railway
  - H2: त्वरित चेकलिस्ट (नए उपयोगकर्ता)
  - H2: वन-क्लिक डिप्लॉय
  - H2: आपको क्या मिलता है
  - H2: आवश्यक Railway सेटिंग्स
  - H3: सार्वजनिक नेटवर्किंग
  - H3: वॉल्यूम (आवश्यक)
  - H3: वेरिएबल
  - H2: चैनल कनेक्ट करें
  - H2: बैकअप &amp; माइग्रेशन
  - H2: अगले चरण

## install/raspberry-pi.md

- मार्ग: /install/raspberry-pi
- शीर्षक:
  - H2: हार्डवेयर संगतता
  - H2: पूर्वापेक्षाएँ
  - H2: सेटअप
  - H2: प्रदर्शन सुझाव
  - H2: अनुशंसित मॉडल सेटअप
  - H2: ARM बाइनरी नोट्स
  - H2: स्थायित्व और बैकअप
  - H2: समस्या निवारण
  - H2: अगले चरण
  - H2: संबंधित

## install/render.mdx

- मार्ग: /install/render
- शीर्षक:
  - H1: Render
  - H2: पूर्वापेक्षाएँ
  - H2: Render Blueprint के साथ परिनियोजित करें
  - H2: Blueprint को समझना
  - H2: प्लान चुनना
  - H2: परिनियोजन के बाद
  - H3: Control UI तक पहुँचें
  - H2: Render Dashboard सुविधाएँ
  - H3: लॉग
  - H3: शेल पहुँच
  - H3: पर्यावरण चर
  - H3: ऑटो-डिप्लॉय
  - H2: कस्टम डोमेन
  - H2: स्केलिंग
  - H2: बैकअप और माइग्रेशन
  - H2: समस्या निवारण
  - H3: सेवा शुरू नहीं होगी
  - H3: धीमे कोल्ड स्टार्ट (फ्री टियर)
  - H3: फिर से परिनियोजन के बाद डेटा हानि
  - H3: हेल्थ चेक विफलताएँ
  - H2: अगले चरण

## install/uninstall.md

- मार्ग: /install/uninstall
- शीर्षक:
  - H2: आसान रास्ता (CLI अभी भी इंस्टॉल है)
  - H2: मैनुअल सेवा हटाना (CLI इंस्टॉल नहीं है)
  - H3: macOS (launchd)
  - H3: Linux (systemd user unit)
  - H3: Windows (Scheduled Task)
  - H2: सामान्य इंस्टॉल बनाम स्रोत चेकआउट
  - H3: सामान्य इंस्टॉल (install.sh / npm / pnpm / bun)
  - H3: स्रोत चेकआउट (git clone)
  - H2: संबंधित

## install/updating.md

- मार्ग: /install/updating
- शीर्षक:
  - H2: अनुशंसित: openclaw update
  - H2: npm और git इंस्टॉल के बीच स्विच करें
  - H2: विकल्प: इंस्टॉलर फिर से चलाएँ
  - H2: विकल्प: मैनुअल npm, pnpm, या bun
  - H3: उन्नत npm इंस्टॉल विषय
  - H2: ऑटो-अपडेटर
  - H2: अपडेट करने के बाद
  - H3: doctor चलाएँ
  - H3: Gateway फिर से शुरू करें
  - H3: सत्यापित करें
  - H2: रोलबैक
  - H3: संस्करण पिन करें (npm)
  - H3: कमिट पिन करें (स्रोत)
  - H2: यदि आप अटक गए हैं
  - H2: संबंधित

## install/upstash.md

- मार्ग: /install/upstash
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: Box बनाएँ
  - H2: SSH टनल से कनेक्ट करें
  - H2: OpenClaw इंस्टॉल करें
  - H2: ऑनबोर्डिंग चलाएँ
  - H2: Gateway शुरू करें
  - H2: ऑटो-रीस्टार्ट
  - H2: समस्या निवारण
  - H2: संबंधित

## logging.md

- मार्ग: /logging
- शीर्षक:
  - H2: लॉग कहाँ रहते हैं
  - H2: लॉग कैसे पढ़ें
  - H3: CLI: लाइव टेल (अनुशंसित)
  - H3: Control UI (वेब)
  - H3: केवल-चैनल लॉग
  - H2: लॉग फ़ॉर्मैट
  - H3: फ़ाइल लॉग (JSONL)
  - H3: कंसोल आउटपुट
  - H3: Gateway WebSocket लॉग
  - H2: लॉगिंग कॉन्फ़िगर करना
  - H3: लॉग स्तर
  - H3: लक्षित मॉडल ट्रांसपोर्ट डायग्नोस्टिक्स
  - H3: ट्रेस सहसंबंध
  - H3: मॉडल कॉल आकार और समय
  - H3: कंसोल शैलियाँ
  - H3: रिडैक्शन
  - H2: डायग्नोस्टिक्स और OpenTelemetry
  - H2: समस्या निवारण सुझाव
  - H2: संबंधित

## maturity/scorecard.md

- मार्ग: /maturity/scorecard
- शीर्षक:
  - H1: परिपक्वता स्कोरकार्ड
  - H2: यह पेज किसलिए है
  - H2: एक नज़र में
  - H2: स्कोर बैंड
  - H2: सतह एक्सप्लोरर
  - H2: QA साक्ष्य सारांश
  - H3: क्षेत्र के अनुसार तत्परता

## maturity/taxonomy.md

- मार्ग: /maturity/taxonomy
- शीर्षक:
  - H1: परिपक्वता वर्गीकरण
  - H2: इस पेज को कैसे पढ़ें
  - H2: परिपक्वता स्तर
  - H2: उत्पाद क्षेत्र
  - H2: विवरण
  - H3: कोर
  - H3: प्लेटफ़ॉर्म
  - H3: चैनल
  - H3: प्रदाता और टूल

## network.md

- मार्ग: /network
- शीर्षक:
  - H2: कोर मॉडल
  - H2: पेयरिंग + पहचान
  - H2: खोज + ट्रांसपोर्ट
  - H2: नोड + ट्रांसपोर्ट
  - H2: सुरक्षा
  - H2: संबंधित

## nodes/audio.md

- मार्ग: /nodes/audio
- शीर्षक:
  - H2: क्या काम करता है
  - H2: ऑटो-डिटेक्शन (डिफ़ॉल्ट)
  - H2: कॉन्फ़िग उदाहरण
  - H3: प्रदाता + CLI फ़ॉलबैक (OpenAI + Whisper CLI)
  - H3: स्कोप गेटिंग के साथ केवल-प्रदाता
  - H3: केवल-प्रदाता (Deepgram)
  - H3: केवल-प्रदाता (Mistral Voxtral)
  - H3: केवल-प्रदाता (SenseAudio)
  - H3: ट्रांसक्रिप्ट को चैट में इको करें (ऑप्ट-इन)
  - H2: नोट्स और सीमाएँ
  - H3: प्रॉक्सी पर्यावरण समर्थन
  - H2: समूहों में उल्लेख पहचान
  - H2: ध्यान देने योग्य बातें
  - H2: संबंधित

## nodes/camera.md

- मार्ग: /nodes/camera
- शीर्षक:
  - H2: iOS नोड
  - H3: उपयोगकर्ता सेटिंग (डिफ़ॉल्ट चालू)
  - H3: कमांड (Gateway node.invoke के माध्यम से)
  - H3: फ़ोरग्राउंड आवश्यकता
  - H3: CLI हेल्पर
  - H2: Android नोड
  - H3: Android उपयोगकर्ता सेटिंग (डिफ़ॉल्ट चालू)
  - H3: अनुमतियाँ
  - H3: Android फ़ोरग्राउंड आवश्यकता
  - H3: Android कमांड (Gateway node.invoke के माध्यम से)
  - H3: पेलोड गार्ड
  - H2: macOS ऐप
  - H3: उपयोगकर्ता सेटिंग (डिफ़ॉल्ट बंद)
  - H3: CLI हेल्पर (node invoke)
  - H2: सुरक्षा + व्यावहारिक सीमाएँ
  - H2: macOS स्क्रीन वीडियो (OS-स्तर)
  - H2: संबंधित

## nodes/images.md

- मार्ग: /nodes/images
- शीर्षक:
  - H2: लक्ष्य
  - H2: CLI सतह
  - H2: WhatsApp Web चैनल व्यवहार
  - H2: ऑटो-रिप्लाई पाइपलाइन
  - H2: इनबाउंड मीडिया से कमांड
  - H2: सीमाएँ और त्रुटियाँ
  - H2: टेस्ट के लिए नोट्स
  - H2: संबंधित

## nodes/index.md

- मार्ग: /nodes
- शीर्षक:
  - H2: पेयरिंग + स्थिति
  - H2: रिमोट नोड होस्ट (system.run)
  - H3: क्या कहाँ चलता है
  - H3: नोड होस्ट शुरू करें (फ़ोरग्राउंड)
  - H3: SSH टनल के माध्यम से रिमोट Gateway (loopback bind)
  - H3: नोड होस्ट शुरू करें (सेवा)
  - H3: पेयर + नाम
  - H3: कमांड को allowlist करें
  - H3: exec को नोड की ओर इंगित करें
  - H3: स्थानीय मॉडल इन्फ़रेंस
  - H2: कमांड इनवोक करना
  - H2: कमांड नीति
  - H2: कॉन्फ़िग (openclaw.json)
  - H2: स्क्रीनशॉट (कैनवास स्नैपशॉट)
  - H3: कैनवास नियंत्रण
  - H3: A2UI (कैनवास)
  - H2: फ़ोटो + वीडियो (नोड कैमरा)
  - H2: स्क्रीन रिकॉर्डिंग (नोड)
  - H2: स्थान (नोड)
  - H2: SMS (Android नोड)
  - H2: Android डिवाइस + व्यक्तिगत डेटा कमांड
  - H2: सिस्टम कमांड (नोड होस्ट / Mac नोड)
  - H2: Exec नोड बाइंडिंग
  - H2: अनुमतियाँ मैप
  - H2: हेडलेस नोड होस्ट (क्रॉस-प्लेटफ़ॉर्म)
  - H2: Mac नोड मोड

## nodes/location-command.md

- मार्ग: /nodes/location-command
- शीर्षक:
  - H2: TL;DR
  - H2: सेलेक्टर क्यों (सिर्फ़ स्विच नहीं)
  - H2: सेटिंग्स मॉडल
  - H2: अनुमतियाँ मैपिंग (node.permissions)
  - H2: कमांड: location.get
  - H2: बैकग्राउंड व्यवहार
  - H2: मॉडल/टूलिंग एकीकरण
  - H2: UX कॉपी (सुझाई गई)
  - H2: संबंधित

## nodes/media-understanding.md

- मार्ग: /nodes/media-understanding
- शीर्षक:
  - H2: लक्ष्य
  - H2: उच्च-स्तरीय व्यवहार
  - H2: कॉन्फ़िग अवलोकन
  - H3: मॉडल प्रविष्टियाँ
  - H3: प्रदाता क्रेडेंशियल्स (apiKey)
  - H2: डिफ़ॉल्ट और सीमाएँ
  - H3: मीडिया समझ का ऑटो-डिटेक्ट (डिफ़ॉल्ट)
  - H3: प्रॉक्सी पर्यावरण समर्थन (प्रदाता मॉडल)
  - H2: क्षमताएँ (वैकल्पिक)
  - H2: प्रदाता समर्थन मैट्रिक्स (OpenClaw एकीकरण)
  - H2: मॉडल चयन मार्गदर्शन
  - H2: अटैचमेंट नीति
  - H2: कॉन्फ़िग उदाहरण
  - H2: स्थिति आउटपुट
  - H2: नोट्स
  - H2: संबंधित

## nodes/talk.md

- मार्ग: /nodes/talk
- शीर्षक:
  - H2: व्यवहार (macOS)
  - H2: जवाबों में वॉइस निर्देश
  - H2: कॉन्फ़िग (/.openclaw/openclaw.json)
  - H2: macOS UI
  - H2: Android UI
  - H2: नोट्स
  - H2: संबंधित

## nodes/troubleshooting.md

- मार्ग: /nodes/troubleshooting
- शीर्षक:
  - H2: कमांड लैडर
  - H2: फ़ोरग्राउंड आवश्यकताएँ
  - H2: अनुमतियाँ मैट्रिक्स
  - H2: पेयरिंग बनाम अनुमोदन
  - H2: सामान्य नोड त्रुटि कोड
  - H2: तेज़ रिकवरी लूप
  - H2: संबंधित

## nodes/voicewake.md

- मार्ग: /nodes/voicewake
- शीर्षक:
  - H2: स्टोरेज (Gateway होस्ट)
  - H2: प्रोटोकॉल
  - H3: विधियाँ
  - H3: रूटिंग विधियाँ (ट्रिगर → लक्ष्य)
  - H3: इवेंट
  - H2: क्लाइंट व्यवहार
  - H3: macOS ऐप
  - H3: iOS नोड
  - H3: Android नोड
  - H2: संबंधित

## openclaw-agent-runtime.md

- मार्ग: /openclaw-agent-runtime
- शीर्षक:
  - H2: टाइप जाँच और लिंटिंग
  - H2: Agent Runtime टेस्ट चलाना
  - H2: मैनुअल टेस्टिंग
  - H2: क्लीन स्लेट रीसेट
  - H2: संदर्भ
  - H2: संबंधित

## perplexity.md

- मार्ग: /perplexity
- शीर्षक:
  - H2: संबंधित

## plan/codex-context-engine-harness.md

- मार्ग: /plan/codex-context-engine-harness
- शीर्षक:
  - H2: स्थिति
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: वर्तमान आर्किटेक्चर
  - H2: वर्तमान अंतर
  - H2: वांछित व्यवहार
  - H2: डिज़ाइन बाधाएँ
  - H3: Codex app-server मूल थ्रेड स्थिति के लिए canonical बना रहता है
  - H3: Context engine assembly को Codex इनपुट में प्रोजेक्ट किया जाना चाहिए
  - H3: Prompt-cache स्थिरता मायने रखती है
  - H3: Runtime चयन semantics नहीं बदलते
  - H2: कार्यान्वयन योजना
  - H3: 1. पुन: उपयोग योग्य context-engine attempt helpers निर्यात करें या स्थानांतरित करें
  - H3: 2. Codex context projection helper जोड़ें
  - H3: 3. Codex thread startup से पहले bootstrap वायर करें
  - H3: 4. thread/start / thread/resume और turn/start से पहले assemble वायर करें
  - H3: 5. prompt-cache stable formatting सुरक्षित रखें
  - H3: 6. transcript mirroring के बाद post-turn वायर करें
  - H3: 7. usage और prompt-cache runtime context सामान्यीकृत करें
  - H3: 8. Compaction नीति
  - H4: /compact और स्पष्ट OpenClaw compaction
  - H4: In-turn Codex native contextCompaction events
  - H3: 9. Session reset और binding व्यवहार
  - H3: 10. त्रुटि हैंडलिंग
  - H2: टेस्ट योजना
  - H3: यूनिट टेस्ट
  - H3: अपडेट करने के लिए मौजूदा टेस्ट
  - H3: एकीकरण / लाइव टेस्ट
  - H2: प्रेक्षणीयता
  - H2: माइग्रेशन / संगतता
  - H2: खुले प्रश्न
  - H2: स्वीकृति मानदंड

## plan/ui-channels.md

- मार्ग: /plan/ui-channels
- शीर्षक:
  - H2: स्थिति
  - H2: समस्या
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: लक्ष्य मॉडल
  - H2: डिलीवरी मेटाडेटा
  - H2: Runtime क्षमता अनुबंध
  - H2: चैनल मैपिंग
  - H2: रिफ़ैक्टर चरण
  - H2: टेस्ट
  - H2: खुले प्रश्न
  - H2: संबंधित

## platforms/android.md

- मार्ग: /platforms/android
- शीर्षक:
  - H2: समर्थन स्नैपशॉट
  - H2: सिस्टम नियंत्रण
  - H2: कनेक्शन रनबुक
  - H3: पूर्वापेक्षाएँ
  - H3: 1) Gateway शुरू करें
  - H3: 2) खोज सत्यापित करें (वैकल्पिक)
  - H4: Tailnet (Vienna ⇄ London) discovery via unicast DNS-SD
  - H3: 3) Android से कनेक्ट करें
  - H3: Presence alive beacons
  - H3: 4) पेयरिंग स्वीकृत करें (CLI)
  - H3: 5) सत्यापित करें कि नोड कनेक्टेड है
  - H3: 6) चैट + इतिहास
  - H3: 7) कैनवास + कैमरा
  - H4: Gateway Canvas Host (वेब सामग्री के लिए अनुशंसित)
  - H3: 8) वॉइस + विस्तृत Android कमांड सतह
  - H2: Assistant entrypoints
  - H2: सूचना अग्रेषण
  - H2: संबंधित

## platforms/digitalocean.md

- मार्ग: /platforms/digitalocean
- शीर्षक:
  - H2: संबंधित

## platforms/easyrunner.md

- मार्ग: /platforms/easyrunner
- शीर्षक:
  - H2: शुरू करने से पहले
  - H2: Compose ऐप
  - H2: OpenClaw कॉन्फ़िगर करें
  - H2: सत्यापित करें
  - H2: अपडेट और बैकअप
  - H2: समस्या निवारण

## platforms/index.md

- मार्ग: /platforms
- शीर्षक:
  - H2: अपना OS चुनें
  - H2: VPS और होस्टिंग
  - H2: सामान्य लिंक
  - H2: Gateway सेवा इंस्टॉल (CLI)
  - H2: संबंधित

## platforms/ios.md

- मार्ग: /platforms/ios
- शीर्षक:
  - H2: यह क्या करता है
  - H2: आवश्यकताएँ
  - H2: क्विक स्टार्ट (पेयर + कनेक्ट)
  - H2: आधिकारिक बिल्ड के लिए relay-backed push
  - H2: बैकग्राउंड alive beacons
  - H2: प्रमाणीकरण और विश्वास प्रवाह
  - H2: खोज पथ
  - H3: Bonjour (LAN)
  - H3: Tailnet (क्रॉस-नेटवर्क)
  - H3: मैनुअल होस्ट/पोर्ट
  - H2: कैनवास + A2UI
  - H2: Computer Use संबंध
  - H3: कैनवास eval / स्नैपशॉट
  - H2: Voice wake + talk mode
  - H2: सामान्य त्रुटियाँ
  - H2: संबंधित दस्तावेज़

## platforms/linux.md

- मार्ग: /platforms/linux
- शीर्षक:
  - H2: शुरुआती लोगों के लिए त्वरित पथ (VPS)
  - H2: इंस्टॉल करें
  - H2: Gateway
  - H2: Gateway सेवा इंस्टॉल (CLI)
  - H2: सिस्टम नियंत्रण (systemd user unit)
  - H2: मेमरी दबाव और OOM kills
  - H2: संबंधित

## platforms/mac/bundled-gateway.md

- मार्ग: /platforms/mac/bundled-gateway
- शीर्षक:
  - H2: स्वचालित सेटअप
  - H2: मैनुअल रिकवरी
  - H2: Launchd (Gateway को LaunchAgent के रूप में)
  - H2: संस्करण संगतता
  - H2: macOS पर स्टेट डायरेक्टरी
  - H2: ऐप कनेक्टिविटी डीबग करें
  - H2: स्मोक चेक
  - H2: संबंधित

## platforms/mac/canvas.md

- मार्ग: /platforms/mac/canvas
- शीर्षक:
  - H2: Canvas कहाँ रहता है
  - H2: पैनल व्यवहार
  - H2: Agent API सतह
  - H2: Canvas में A2UI
  - H3: A2UI कमांड (v0.8)
  - H2: Canvas से agent runs ट्रिगर करना
  - H2: सुरक्षा नोट्स
  - H2: संबंधित

## platforms/mac/child-process.md

- मार्ग: /platforms/mac/child-process
- शीर्षक:
  - H2: डिफ़ॉल्ट व्यवहार (launchd)
  - H2: Unsigned dev builds
  - H2: केवल-अटैच मोड
  - H2: रिमोट मोड
  - H2: हम launchd को प्राथमिकता क्यों देते हैं
  - H2: संबंधित

## platforms/mac/dev-setup.md

- मार्ग: /platforms/mac/dev-setup
- शीर्षक:
  - H1: macOS डेवलपर सेटअप
  - H2: पूर्वापेक्षाएँ
  - H2: 1. निर्भरताएँ इंस्टॉल करें
  - H2: 2. ऐप बनाएँ और पैकेज करें
  - H2: 3. CLI और Gateway इंस्टॉल करें
  - H2: समस्या निवारण
  - H3: बिल्ड विफल: टूलचेन या SDK असंगति
  - H3: अनुमति मिलने पर ऐप क्रैश होता है
  - H3: Gateway अनिश्चित समय तक "Starting..." पर रहता है
  - H2: संबंधित

## platforms/mac/health.md

- मार्ग: /platforms/mac/health
- शीर्षक:
  - H1: macOS पर स्वास्थ्य जाँचें
  - H2: मेनू बार
  - H2: सेटिंग्स
  - H2: प्रोब कैसे काम करता है
  - H2: संदेह होने पर
  - H2: संबंधित

## platforms/mac/icon.md

- मार्ग: /platforms/mac/icon
- शीर्षक:
  - H1: मेनू बार आइकन स्थितियाँ
  - H2: संबंधित

## platforms/mac/logging.md

- मार्ग: /platforms/mac/logging
- शीर्षक:
  - H1: लॉगिंग (macOS)
  - H2: रोलिंग डायग्नोस्टिक्स फ़ाइल लॉग (डीबग पेन)
  - H2: macOS पर यूनिफ़ाइड लॉगिंग निजी डेटा
  - H2: OpenClaw (ai.openclaw) के लिए सक्षम करें
  - H2: डीबगिंग के बाद अक्षम करें
  - H2: संबंधित

## platforms/mac/menu-bar.md

- मार्ग: /platforms/mac/menu-bar
- शीर्षक:
  - H2: क्या दिखाया जाता है
  - H2: स्थिति मॉडल
  - H2: IconState enum (Swift)
  - H3: ActivityKind → ग्लिफ़
  - H3: दृश्य मैपिंग
  - H2: संदर्भ सबमेनू
  - H2: स्थिति पंक्ति टेक्स्ट (मेनू)
  - H2: इवेंट इनजेशन
  - H2: डीबग ओवरराइड
  - H2: परीक्षण चेकलिस्ट
  - H2: संबंधित

## platforms/mac/peekaboo.md

- मार्ग: /platforms/mac/peekaboo
- शीर्षक:
  - H2: यह क्या है (और क्या नहीं है)
  - H2: कंप्यूटर उपयोग से संबंध
  - H2: ब्रिज सक्षम करें
  - H2: क्लाइंट खोज क्रम
  - H2: सुरक्षा और अनुमतियाँ
  - H2: स्नैपशॉट व्यवहार (ऑटोमेशन)
  - H2: समस्या निवारण
  - H2: संबंधित

## platforms/mac/permissions.md

- मार्ग: /platforms/mac/permissions
- शीर्षक:
  - H2: स्थिर अनुमतियों की आवश्यकताएँ
  - H2: Node और CLI रनटाइम के लिए एक्सेसिबिलिटी अनुदान
  - H2: प्रॉम्प्ट गायब होने पर रिकवरी चेकलिस्ट
  - H2: फ़ाइलों और फ़ोल्डरों की अनुमतियाँ (Desktop/Documents/Downloads)
  - H2: संबंधित

## platforms/mac/remote.md

- मार्ग: /platforms/mac/remote
- शीर्षक:
  - H2: मोड
  - H2: रिमोट ट्रांसपोर्ट
  - H2: रिमोट होस्ट पर पूर्वापेक्षाएँ
  - H2: macOS ऐप सेटअप
  - H2: वेब चैट
  - H2: अनुमतियाँ
  - H2: सुरक्षा नोट्स
  - H2: WhatsApp लॉगिन फ़्लो (रिमोट)
  - H2: समस्या निवारण
  - H2: सूचना ध्वनियाँ
  - H2: संबंधित

## platforms/mac/signing.md

- मार्ग: /platforms/mac/signing
- शीर्षक:
  - H1: mac साइनिंग (डीबग बिल्ड)
  - H2: उपयोग
  - H3: ऐड-हॉक साइनिंग नोट
  - H2: About के लिए बिल्ड मेटाडेटा
  - H2: क्यों
  - H2: संबंधित

## platforms/mac/skills.md

- मार्ग: /platforms/mac/skills
- शीर्षक:
  - H2: डेटा स्रोत
  - H2: इंस्टॉल क्रियाएँ
  - H2: Env/API कुंजियाँ
  - H2: रिमोट मोड
  - H2: संबंधित

## platforms/mac/voice-overlay.md

- मार्ग: /platforms/mac/voice-overlay
- शीर्षक:
  - H1: वॉइस ओवरले लाइफ़साइकल (macOS)
  - H2: वर्तमान उद्देश्य
  - H2: लागू किया गया (9 दिसंबर, 2025)
  - H2: अगले चरण
  - H2: डीबगिंग चेकलिस्ट
  - H2: माइग्रेशन चरण (सुझाए गए)
  - H2: संबंधित

## platforms/mac/voicewake.md

- मार्ग: /platforms/mac/voicewake
- शीर्षक:
  - H1: वॉइस वेक और बोलने के लिए दबाएँ
  - H2: आवश्यकताएँ
  - H2: मोड
  - H2: रनटाइम व्यवहार (वेक-वर्ड)
  - H2: लाइफ़साइकल अपरिवर्तनीयताएँ
  - H2: स्टिकी ओवरले विफलता मोड (पिछला)
  - H2: बोलने के लिए दबाएँ से जुड़ी विशिष्टताएँ
  - H2: उपयोगकर्ता-सामने सेटिंग्स
  - H2: फ़ॉरवर्डिंग व्यवहार
  - H2: फ़ॉरवर्डिंग पेलोड
  - H2: त्वरित सत्यापन
  - H2: संबंधित

## platforms/mac/webchat.md

- मार्ग: /platforms/mac/webchat
- शीर्षक:
  - H2: लॉन्च और डीबगिंग
  - H2: यह कैसे वायर किया गया है
  - H2: सुरक्षा सतह
  - H2: ज्ञात सीमाएँ
  - H2: संबंधित

## platforms/mac/xpc.md

- मार्ग: /platforms/mac/xpc
- शीर्षक:
  - H1: OpenClaw macOS IPC आर्किटेक्चर
  - H2: लक्ष्य
  - H2: यह कैसे काम करता है
  - H3: Gateway + node ट्रांसपोर्ट
  - H3: Node सेवा + ऐप IPC
  - H3: PeekabooBridge (UI ऑटोमेशन)
  - H2: संचालन फ़्लो
  - H2: हार्डनिंग नोट्स
  - H2: संबंधित

## platforms/macos.md

- मार्ग: /platforms/macos
- शीर्षक:
  - H2: डाउनलोड
  - H2: पहली बार चलाना
  - H2: Gateway मोड चुनें
  - H2: ऐप किन चीज़ों का स्वामी है
  - H2: macOS विवरण पृष्ठ
  - H2: संबंधित

## platforms/oracle.md

- मार्ग: /platforms/oracle
- शीर्षक:
  - H2: संबंधित

## platforms/raspberry-pi.md

- मार्ग: /platforms/raspberry-pi
- शीर्षक:
  - H2: संबंधित

## platforms/windows.md

- मार्ग: /platforms/windows
- शीर्षक:
  - H2: अनुशंसित: Windows Hub
  - H3: Windows Hub में क्या शामिल है
  - H3: पहला लॉन्च
  - H2: Windows node मोड
  - H2: स्थानीय MCP मोड
  - H2: नेटिव Windows CLI और Gateway
  - H2: WSL2 Gateway
  - H2: Windows लॉगिन से पहले Gateway ऑटो-स्टार्ट
  - H2: WSL सेवाएँ LAN पर एक्सपोज़ करें
  - H2: समस्या निवारण
  - H3: ट्रे आइकन दिखाई नहीं देता
  - H3: स्थानीय सेटअप विफल होता है
  - H3: ऐप कहता है कि पेयरिंग आवश्यक है
  - H3: वेब चैट रिमोट Gateway तक नहीं पहुँच सकती
  - H3: screen.snapshot, camera, या audio कमांड विफल होते हैं
  - H3: Git या GitHub कनेक्टिविटी विफल होती है
  - H2: संबंधित

## plugins/adding-capabilities.md

- मार्ग: /plugins/adding-capabilities
- शीर्षक:
  - H2: क्षमता कब बनाएँ
  - H2: मानक क्रम
  - H2: क्या कहाँ जाता है
  - H2: प्रदाता और हार्नेस सीम
  - H2: फ़ाइल चेकलिस्ट
  - H2: व्यावहारिक उदाहरण: इमेज जनरेशन
  - H2: एम्बेडिंग प्रदाता
  - H2: समीक्षा चेकलिस्ट
  - H2: संबंधित

## plugins/admin-http-rpc.md

- मार्ग: /plugins/admin-http-rpc
- शीर्षक:
  - H2: इसे सक्षम करने से पहले
  - H2: सक्षम करें
  - H2: रूट सत्यापित करें
  - H2: प्रमाणीकरण
  - H2: सुरक्षा मॉडल
  - H2: अनुरोध
  - H2: प्रतिक्रिया
  - H2: अनुमत मेथड
  - H2: WebSocket तुलना
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/agent-tools.md

- मार्ग: /plugins/agent-tools
- शीर्षक:
  - H2: संबंधित

## plugins/architecture-internals.md

- मार्ग: /plugins/architecture-internals
- शीर्षक:
  - H2: लोड पाइपलाइन
  - H3: मैनिफ़ेस्ट-प्रथम व्यवहार
  - H3: Plugin कैश सीमा
  - H2: रजिस्ट्री मॉडल
  - H2: बातचीत बाइंडिंग कॉलबैक
  - H2: प्रदाता रनटाइम हुक
  - H3: हुक क्रम और उपयोग
  - H3: प्रदाता उदाहरण
  - H3: बिल्ट-इन उदाहरण
  - H2: रनटाइम हेल्पर
  - H3: api.runtime.imageGeneration
  - H2: Gateway HTTP रूट
  - H2: Plugin SDK इम्पोर्ट पाथ
  - H2: संदेश टूल स्कीमा
  - H2: चैनल लक्ष्य रिज़ॉल्यूशन
  - H2: कॉन्फ़िग-समर्थित डायरेक्टरियाँ
  - H2: प्रदाता कैटलॉग
  - H2: केवल-पढ़ने योग्य चैनल निरीक्षण
  - H2: पैकेज पैक
  - H3: चैनल कैटलॉग मेटाडेटा
  - H2: संदर्भ इंजन Plugin
  - H2: नई क्षमता जोड़ना
  - H3: क्षमता चेकलिस्ट
  - H3: क्षमता टेम्पलेट
  - H2: संबंधित

## plugins/architecture.md

- मार्ग: /plugins/architecture
- शीर्षक:
  - H2: सार्वजनिक क्षमता मॉडल
  - H3: बाहरी संगतता रुख
  - H3: Plugin आकार
  - H3: लेगसी हुक
  - H3: संगतता संकेत
  - H2: आर्किटेक्चर अवलोकन
  - H3: Plugin मेटाडेटा स्नैपशॉट और लुकअप टेबल
  - H3: सक्रियण योजना
  - H3: चैनल Plugin और साझा संदेश टूल
  - H2: क्षमता स्वामित्व मॉडल
  - H3: क्षमता लेयरिंग
  - H3: बहु-क्षमता कंपनी Plugin उदाहरण
  - H3: क्षमता उदाहरण: वीडियो समझ
  - H2: अनुबंध और प्रवर्तन
  - H3: अनुबंध में क्या होना चाहिए
  - H2: निष्पादन मॉडल
  - H2: एक्सपोर्ट सीमा
  - H2: आंतरिक विवरण और संदर्भ
  - H2: संबंधित

## plugins/building-extensions.md

- मार्ग: /plugins/building-extensions
- शीर्षक:
  - H2: संबंधित

## plugins/building-plugins.md

- मार्ग: /plugins/building-plugins
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: Plugin आकार चुनें
  - H2: क्विकस्टार्ट
  - H2: टूल पंजीकृत करना
  - H2: इम्पोर्ट परंपराएँ
  - H2: सबमिशन-पूर्व चेकलिस्ट
  - H2: बीटा रिलीज़ के विरुद्ध परीक्षण करें
  - H2: अगले चरण
  - H2: संबंधित

## plugins/bundles.md

- मार्ग: /plugins/bundles
- शीर्षक:
  - H2: बंडल क्यों मौजूद हैं
  - H2: बंडल इंस्टॉल करें
  - H2: OpenClaw बंडलों से क्या मैप करता है
  - H3: अभी समर्थित
  - H4: Skill सामग्री
  - H4: हुक पैक
  - H4: एम्बेडेड OpenClaw के लिए MCP
  - H4: एम्बेडेड OpenClaw सेटिंग्स
  - H4: एम्बेडेड OpenClaw LSP
  - H3: पहचाना गया लेकिन निष्पादित नहीं
  - H2: बंडल फ़ॉर्मैट
  - H2: पहचान प्राथमिकता
  - H2: रनटाइम निर्भरताएँ और सफ़ाई
  - H2: सुरक्षा
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/cli-backend-plugins.md

- मार्ग: /plugins/cli-backend-plugins
- शीर्षक:
  - H2: Plugin किन चीज़ों का स्वामी है
  - H2: न्यूनतम बैकएंड Plugin
  - H2: कॉन्फ़िग आकार
  - H2: उन्नत बैकएंड हुक
  - H3: ownsNativeCompaction: OpenClaw Compaction से ऑप्ट आउट करना
  - H2: MCP टूल ब्रिज
  - H2: उपयोगकर्ता कॉन्फ़िगरेशन
  - H2: सत्यापन
  - H2: चेकलिस्ट
  - H2: संबंधित

## plugins/codex-computer-use.md

- मार्ग: /plugins/codex-computer-use
- शीर्षक:
  - H2: OpenClaw.app और Peekaboo
  - H2: iOS ऐप
  - H2: प्रत्यक्ष cua-driver MCP
  - H2: त्वरित सेटअप
  - H2: कमांड
  - H2: मार्केटप्लेस विकल्प
  - H2: बंडल किया गया macOS मार्केटप्लेस
  - H2: रिमोट कैटलॉग सीमा
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: OpenClaw क्या जाँचता है
  - H2: macOS अनुमतियाँ
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/codex-harness-reference.md

- मार्ग: /plugins/codex-harness-reference
- शीर्षक:
  - H2: Plugin कॉन्फ़िग सतह
  - H2: ऐप-सर्वर ट्रांसपोर्ट
  - H2: अनुमोदन और सैंडबॉक्स मोड
  - H2: सैंडबॉक्स किया गया नेटिव निष्पादन
  - H2: प्रमाणीकरण और वातावरण अलगाव
  - H2: डायनेमिक टूल
  - H2: टाइमआउट
  - H2: मॉडल खोज
  - H2: वर्कस्पेस बूटस्ट्रैप फ़ाइलें
  - H2: वातावरण ओवरराइड
  - H2: संबंधित

## plugins/codex-harness-runtime.md

- मार्ग: /plugins/codex-harness-runtime
- शीर्षक:
  - H2: अवलोकन
  - H2: थ्रेड बाइंडिंग और मॉडल परिवर्तन
  - H2: दृश्यमान उत्तर और Heartbeat
  - H2: हुक सीमाएँ
  - H2: V1 समर्थन अनुबंध
  - H2: नेटिव अनुमतियाँ और MCP elicitations
  - H2: क्यू संचालन
  - H2: Codex फ़ीडबैक अपलोड
  - H2: Compaction और ट्रांसक्रिप्ट मिरर
  - H2: मीडिया और डिलीवरी
  - H2: संबंधित

## plugins/codex-harness.md

- मार्ग: /plugins/codex-harness
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: क्विकस्टार्ट
  - H2: कॉन्फ़िगरेशन
  - H2: Codex रनटाइम सत्यापित करें
  - H2: रूटिंग और मॉडल चयन
  - H2: परिनियोजन पैटर्न
  - H3: बुनियादी Codex परिनियोजन
  - H3: मिश्रित प्रदाता परिनियोजन
  - H3: फ़ेल-क्लोज़्ड Codex परिनियोजन
  - H2: ऐप-सर्वर नीति
  - H2: कमांड और डायग्नोस्टिक्स
  - H3: Codex थ्रेड स्थानीय रूप से निरीक्षण करें
  - H2: नेटिव Codex Plugin
  - H2: कंप्यूटर उपयोग
  - H2: रनटाइम सीमाएँ
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/codex-native-plugins.md

- मार्ग: /plugins/codex-native-plugins
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: क्विकस्टार्ट
  - H2: चैट से Plugin प्रबंधित करें
  - H2: नेटिव Plugin सेटअप कैसे काम करता है
  - H2: V1 समर्थन सीमा
  - H2: ऐप इन्वेंटरी और स्वामित्व
  - H2: थ्रेड ऐप कॉन्फ़िग
  - H2: विनाशकारी क्रिया नीति
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/community.md

- मार्ग: /plugins/community
- शीर्षक:
  - H2: Plugin खोजें
  - H2: Plugin प्रकाशित करें
  - H2: संबंधित

## plugins/compatibility.md

- मार्ग: /plugins/compatibility
- शीर्षक:
  - H2: संगतता रजिस्ट्री
  - H2: Plugin इंस्पेक्टर पैकेज
  - H3: मेंटेनर स्वीकृति लेन
  - H2: डिप्रिकेशन नीति
  - H2: वर्तमान संगतता क्षेत्र
  - H3: WhatsApp इनबाउंड कॉलबैक फ़्लैट एलियास
  - H3: WhatsApp इनबाउंड प्रवेश फ़ील्ड
  - H2: रिलीज़ नोट्स

## plugins/copilot.md

- मार्ग: /plugins/copilot
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: Plugin इंस्टॉल
  - H2: क्विकस्टार्ट
  - H2: समर्थित प्रदाता
  - H2: BYOK
  - H2: प्रमाणीकरण
  - H2: कॉन्फ़िगरेशन सतह
  - H2: Compaction
  - H2: ट्रांसक्रिप्ट मिररिंग
  - H2: पार्श्व प्रश्न (/btw)
  - H2: Doctor
  - H2: सीमाएँ
  - H2: अनुमतियाँ और askuser
  - H3: सत्र-स्तरीय GitHub टोकन
  - H2: संबंधित

## plugins/dependency-resolution.md

- मार्ग: /plugins/dependency-resolution
- शीर्षक:
  - H2: ज़िम्मेदारी विभाजन
  - H2: इंस्टॉल रूट
  - H2: स्थानीय Plugin
  - H2: स्टार्टअप और रीलोड
  - H2: बंडल किए गए Plugin
  - H2: लेगसी सफ़ाई

## plugins/google-meet.md

- रूट: /plugins/google-meet
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: स्थानीय Gateway + Parallels Chrome
  - H2: इंस्टॉल नोट्स
  - H2: ट्रांसपोर्ट
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth और प्रीफ्लाइट
  - H3: Google क्रेडेंशियल बनाएं
  - H3: रिफ्रेश टोकन मिंट करें
  - H3: doctor से OAuth सत्यापित करें
  - H2: कॉन्फ़िगरेशन
  - H2: टूल
  - H2: एजेंट और bidi मोड
  - H2: लाइव टेस्ट चेकलिस्ट
  - H2: समस्या निवारण
  - H3: एजेंट Google Meet टूल नहीं देख सकता
  - H3: कोई कनेक्टेड Google Meet-सक्षम Node नहीं
  - H3: ब्राउज़र खुलता है लेकिन एजेंट शामिल नहीं हो सकता
  - H3: मीटिंग बनाना विफल होता है
  - H3: एजेंट शामिल होता है लेकिन बोलता नहीं है
  - H3: Twilio सेटअप जांचें विफल होती हैं
  - H3: Twilio कॉल शुरू होती है लेकिन मीटिंग में कभी प्रवेश नहीं करती
  - H2: नोट्स
  - H2: संबंधित

## plugins/hooks.md

- रूट: /plugins/hooks
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: हुक कैटलॉग
  - H2: रनटाइम हुक डीबग करें
  - H2: टूल कॉल नीति
  - H3: निष्पादन वातावरण हुक
  - H3: टूल परिणाम स्थायित्व
  - H2: प्रॉम्प्ट और मॉडल हुक
  - H3: सेशन एक्सटेंशन और अगले-टर्न इंजेक्शन
  - H2: संदेश हुक
  - H2: हुक इंस्टॉल करें
  - H2: Gateway लाइफ़साइकल
  - H2: आगामी डिप्रिकेशन
  - H2: संबंधित

## plugins/install-overrides.md

- रूट: /plugins/install-overrides
- शीर्षक:
  - H2: वातावरण
  - H2: व्यवहार
  - H2: पैकेज E2E

## plugins/llama-cpp.md

- रूट: /plugins/llama-cpp
- शीर्षक:
  - H2: कॉन्फ़िगरेशन
  - H2: नेटिव रनटाइम

## plugins/manage-plugins.md

- रूट: /plugins/manage-plugins
- शीर्षक:
  - H2: plugins सूचीबद्ध करें और खोजें
  - H2: plugins इंस्टॉल करें
  - H2: पुनरारंभ करें और निरीक्षण करें
  - H2: plugins अपडेट करें
  - H2: plugins अनइंस्टॉल करें
  - H2: स्रोत चुनें
  - H2: plugins प्रकाशित करें
  - H2: संबंधित

## plugins/manifest.md

- रूट: /plugins/manifest
- शीर्षक:
  - H2: यह फ़ाइल क्या करती है
  - H2: न्यूनतम उदाहरण
  - H2: समृद्ध उदाहरण
  - H2: शीर्ष-स्तरीय फ़ील्ड संदर्भ
  - H2: जनरेशन प्रदाता मेटाडेटा संदर्भ
  - H2: टूल मेटाडेटा संदर्भ
  - H2: providerAuthChoices संदर्भ
  - H2: commandAliases संदर्भ
  - H2: activation संदर्भ
  - H2: qaRunners संदर्भ
  - H2: setup संदर्भ
  - H3: setup.providers संदर्भ
  - H3: setup फ़ील्ड
  - H2: uiHints संदर्भ
  - H2: contracts संदर्भ
  - H2: mediaUnderstandingProviderMetadata संदर्भ
  - H2: channelConfigs संदर्भ
  - H3: दूसरे चैनल plugin को बदलना
  - H2: modelSupport संदर्भ
  - H2: modelCatalog संदर्भ
  - H2: modelIdNormalization संदर्भ
  - H2: providerEndpoints संदर्भ
  - H2: providerRequest संदर्भ
  - H2: secretProviderIntegrations संदर्भ
  - H2: modelPricing संदर्भ
  - H3: OpenClaw Provider Index
  - H2: Manifest बनाम package.json
  - H3: package.json फ़ील्ड जो डिस्कवरी को प्रभावित करते हैं
  - H2: डिस्कवरी प्राथमिकता (डुप्लिकेट plugin ids)
  - H2: JSON Schema आवश्यकताएं
  - H2: वैलिडेशन व्यवहार
  - H2: नोट्स
  - H2: संबंधित

## plugins/memory-lancedb.md

- रूट: /plugins/memory-lancedb
- शीर्षक:
  - H2: इंस्टॉलेशन
  - H2: त्वरित शुरुआत
  - H2: प्रदाता-समर्थित embeddings
  - H2: Ollama embeddings
  - H2: OpenAI-संगत प्रदाता
  - H2: रिकॉल और कैप्चर सीमाएं
  - H2: कमांड
  - H2: स्टोरेज
  - H2: रनटाइम निर्भरताएं
  - H2: समस्या निवारण
  - H3: इनपुट लंबाई संदर्भ लंबाई से अधिक है
  - H3: असमर्थित embedding मॉडल
  - H3: Plugin लोड होता है लेकिन कोई मेमोरी दिखाई नहीं देती
  - H2: संबंधित

## plugins/memory-wiki.md

- रूट: /plugins/memory-wiki
- शीर्षक:
  - H2: यह क्या जोड़ता है
  - H2: यह मेमोरी के साथ कैसे फिट होता है
  - H2: अनुशंसित हाइब्रिड पैटर्न
  - H2: वॉल्ट मोड
  - H3: isolated
  - H3: bridge
  - H3: unsafe-local
  - H2: वॉल्ट लेआउट
  - H2: Open Knowledge Format इम्पोर्ट
  - H2: संरचित दावे और साक्ष्य
  - H2: एजेंट-फेसिंग एंटिटी मेटाडेटा
  - H2: कंपाइल पाइपलाइन
  - H2: डैशबोर्ड और हेल्थ रिपोर्ट
  - H2: खोज और पुनर्प्राप्ति
  - H2: एजेंट टूल
  - H2: प्रॉम्प्ट और कॉन्टेक्स्ट व्यवहार
  - H2: कॉन्फ़िगरेशन
  - H3: उदाहरण: QMD + bridge मोड
  - H2: CLI
  - H2: Obsidian समर्थन
  - H2: अनुशंसित वर्कफ़्लो
  - H2: संबंधित दस्तावेज़

## plugins/message-presentation.md

- रूट: /plugins/message-presentation
- शीर्षक:
  - H2: अनुबंध
  - H2: प्रोड्यूसर उदाहरण
  - H2: रेंडरर अनुबंध
  - H2: कोर रेंडर फ्लो
  - H2: डिग्रेडेशन नियम
  - H3: बटन वैल्यू फ़ॉलबैक दृश्यता
  - H2: प्रदाता मैपिंग
  - H2: Presentation बनाम InteractiveReply
  - H2: डिलीवरी पिन
  - H2: Plugin लेखक चेकलिस्ट
  - H2: संबंधित दस्तावेज़

## plugins/oc-path.md

- रूट: /plugins/oc-path
- शीर्षक:
  - H2: इसे क्यों सक्षम करें
  - H2: यह कहां चलता है
  - H2: सक्षम करें
  - H2: निर्भरताएं
  - H2: यह क्या प्रदान करता है
  - H2: अन्य plugins से संबंध
  - H2: सुरक्षा
  - H2: संबंधित

## plugins/plugin-inventory.md

- रूट: /plugins/plugin-inventory
- शीर्षक:
  - H1: Plugin इन्वेंटरी
  - H2: परिभाषाएं
  - H2: plugin इंस्टॉल करें
  - H2: कोर npm पैकेज
  - H2: आधिकारिक बाहरी पैकेज
  - H2: केवल स्रोत checkout

## plugins/plugin-permission-requests.md

- रूट: /plugins/plugin-permission-requests
- शीर्षक:
  - H2: सही गेट चुनें
  - H2: टूल कॉल से पहले स्वीकृति का अनुरोध करें
  - H2: निर्णय व्यवहार
  - H2: स्वीकृति प्रॉम्प्ट रूट करें
  - H2: Codex नेटिव अनुमतियां
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/reference.md

- रूट: /plugins/reference
- शीर्षक:
  - H1: Plugin संदर्भ

## plugins/reference/acpx.md

- रूट: /plugins/reference/acpx
- शीर्षक:
  - H1: ACPx plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/admin-http-rpc.md

- रूट: /plugins/reference/admin-http-rpc
- शीर्षक:
  - H1: Admin Http Rpc plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/alibaba.md

- रूट: /plugins/reference/alibaba
- शीर्षक:
  - H1: Alibaba plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/amazon-bedrock-mantle.md

- रूट: /plugins/reference/amazon-bedrock-mantle
- शीर्षक:
  - H1: Amazon Bedrock Mantle plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/amazon-bedrock.md

- रूट: /plugins/reference/amazon-bedrock
- शीर्षक:
  - H1: Amazon Bedrock plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/anthropic-vertex.md

- रूट: /plugins/reference/anthropic-vertex
- शीर्षक:
  - H1: Anthropic Vertex plugin
  - H2: वितरण
  - H2: सतह
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- रूट: /plugins/reference/anthropic
- शीर्षक:
  - H1: Anthropic plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/arcee.md

- रूट: /plugins/reference/arcee
- शीर्षक:
  - H1: Arcee plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/azure-speech.md

- रूट: /plugins/reference/azure-speech
- शीर्षक:
  - H1: Azure Speech plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/bonjour.md

- रूट: /plugins/reference/bonjour
- शीर्षक:
  - H1: Bonjour plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/brave.md

- रूट: /plugins/reference/brave
- शीर्षक:
  - H1: Brave plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/browser.md

- रूट: /plugins/reference/browser
- शीर्षक:
  - H1: Browser plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/byteplus.md

- रूट: /plugins/reference/byteplus
- शीर्षक:
  - H1: BytePlus plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/canvas.md

- रूट: /plugins/reference/canvas
- शीर्षक:
  - H1: Canvas plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/cerebras.md

- रूट: /plugins/reference/cerebras
- शीर्षक:
  - H1: Cerebras plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/chutes.md

- रूट: /plugins/reference/chutes
- शीर्षक:
  - H1: Chutes plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/clawrouter.md

- रूट: /plugins/reference/clawrouter
- शीर्षक:
  - H1: ClawRouter plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/clickclack.md

- रूट: /plugins/reference/clickclack
- शीर्षक:
  - H1: Clickclack plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/cloudflare-ai-gateway.md

- रूट: /plugins/reference/cloudflare-ai-gateway
- शीर्षक:
  - H1: Cloudflare AI Gateway plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/codex-supervisor.md

- रूट: /plugins/reference/codex-supervisor
- शीर्षक:
  - H1: Codex Supervisor plugin
  - H2: वितरण
  - H2: सतह
  - H2: सेशन लिस्टिंग

## plugins/reference/codex.md

- रूट: /plugins/reference/codex
- शीर्षक:
  - H1: Codex plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/cohere.md

- रूट: /plugins/reference/cohere
- शीर्षक:
  - H1: Cohere plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/comfy.md

- रूट: /plugins/reference/comfy
- शीर्षक:
  - H1: ComfyUI plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/copilot-proxy.md

- रूट: /plugins/reference/copilot-proxy
- शीर्षक:
  - H1: Copilot Proxy plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/copilot.md

- रूट: /plugins/reference/copilot
- शीर्षक:
  - H1: Copilot plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/deepgram.md

- रूट: /plugins/reference/deepgram
- शीर्षक:
  - H1: Deepgram plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/deepinfra.md

- रूट: /plugins/reference/deepinfra
- शीर्षक:
  - H1: DeepInfra plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/deepseek.md

- रूट: /plugins/reference/deepseek
- शीर्षक:
  - H1: DeepSeek plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/diagnostics-otel.md

- रूट: /plugins/reference/diagnostics-otel
- शीर्षक:
  - H1: Diagnostics OpenTelemetry plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/diagnostics-prometheus.md

- रूट: /plugins/reference/diagnostics-prometheus
- शीर्षक:
  - H1: Diagnostics Prometheus plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/diffs-language-pack.md

- रूट: /plugins/reference/diffs-language-pack
- शीर्षक:
  - H1: Diffs Language Pack plugin
  - H2: वितरण
  - H2: सतह
  - H2: जोड़ी गई भाषाएं

## plugins/reference/diffs.md

- रूट: /plugins/reference/diffs
- शीर्षक:
  - H1: Diffs plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/discord.md

- रूट: /plugins/reference/discord
- शीर्षक:
  - H1: Discord plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/document-extract.md

- रूट: /plugins/reference/document-extract
- शीर्षक:
  - H1: Document Extract plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/duckduckgo.md

- रूट: /plugins/reference/duckduckgo
- शीर्षक:
  - H1: DuckDuckGo plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/elevenlabs.md

- रूट: /plugins/reference/elevenlabs
- शीर्षक:
  - H1: Elevenlabs plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/exa.md

- रूट: /plugins/reference/exa
- शीर्षक:
  - H1: Exa plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/fal.md

- रूट: /plugins/reference/fal
- शीर्षक:
  - H1: fal plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/feishu.md

- रूट: /plugins/reference/feishu
- शीर्षक:
  - H1: Feishu plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/file-transfer.md

- रूट: /plugins/reference/file-transfer
- शीर्षक:
  - H1: File Transfer plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/firecrawl.md

- रूट: /plugins/reference/firecrawl
- शीर्षक:
  - H1: Firecrawl Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/fireworks.md

- रूट: /plugins/reference/fireworks
- शीर्षक:
  - H1: Fireworks Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/github-copilot.md

- रूट: /plugins/reference/github-copilot
- शीर्षक:
  - H1: GitHub Copilot Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/gmi.md

- रूट: /plugins/reference/gmi
- शीर्षक:
  - H1: Gmi Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/google-meet.md

- रूट: /plugins/reference/google-meet
- शीर्षक:
  - H1: Google Meet Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/google.md

- रूट: /plugins/reference/google
- शीर्षक:
  - H1: Google Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/googlechat.md

- रूट: /plugins/reference/googlechat
- शीर्षक:
  - H1: Google Chat Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/gradium.md

- रूट: /plugins/reference/gradium
- शीर्षक:
  - H1: Gradium Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/groq.md

- रूट: /plugins/reference/groq
- शीर्षक:
  - H1: Groq Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/huggingface.md

- रूट: /plugins/reference/huggingface
- शीर्षक:
  - H1: Hugging Face Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/imessage.md

- रूट: /plugins/reference/imessage
- शीर्षक:
  - H1: iMessage Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/inworld.md

- रूट: /plugins/reference/inworld
- शीर्षक:
  - H1: Inworld Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/irc.md

- रूट: /plugins/reference/irc
- शीर्षक:
  - H1: IRC Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/kilocode.md

- रूट: /plugins/reference/kilocode
- शीर्षक:
  - H1: Kilocode Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/kimi.md

- रूट: /plugins/reference/kimi
- शीर्षक:
  - H1: Kimi Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/line.md

- रूट: /plugins/reference/line
- शीर्षक:
  - H1: LINE Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/litellm.md

- रूट: /plugins/reference/litellm
- शीर्षक:
  - H1: LiteLLM Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/llama-cpp.md

- रूट: /plugins/reference/llama-cpp
- शीर्षक:
  - H1: Llama Cpp Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/llm-task.md

- रूट: /plugins/reference/llm-task
- शीर्षक:
  - H1: LLM Task Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/lmstudio.md

- रूट: /plugins/reference/lmstudio
- शीर्षक:
  - H1: LM Studio Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/lobster.md

- रूट: /plugins/reference/lobster
- शीर्षक:
  - H1: Lobster Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/matrix.md

- रूट: /plugins/reference/matrix
- शीर्षक:
  - H1: Matrix Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/mattermost.md

- रूट: /plugins/reference/mattermost
- शीर्षक:
  - H1: Mattermost Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/memory-core.md

- रूट: /plugins/reference/memory-core
- शीर्षक:
  - H1: Memory Core Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/memory-lancedb.md

- रूट: /plugins/reference/memory-lancedb
- शीर्षक:
  - H1: Memory Lancedb Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/memory-wiki.md

- रूट: /plugins/reference/memory-wiki
- शीर्षक:
  - H1: Memory Wiki Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/microsoft-foundry.md

- रूट: /plugins/reference/microsoft-foundry
- शीर्षक:
  - H1: Microsoft Foundry Plugin
  - H2: वितरण
  - H2: सतह
  - H2: आवश्यकताएँ
  - H2: चैट मॉडल
  - H2: MAI इमेज जनरेशन
  - H2: समस्या निवारण

## plugins/reference/microsoft.md

- रूट: /plugins/reference/microsoft
- शीर्षक:
  - H1: Microsoft Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/migrate-claude.md

- रूट: /plugins/reference/migrate-claude
- शीर्षक:
  - H1: Claude माइग्रेट करें Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/migrate-hermes.md

- रूट: /plugins/reference/migrate-hermes
- शीर्षक:
  - H1: Hermes माइग्रेट करें Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/minimax.md

- रूट: /plugins/reference/minimax
- शीर्षक:
  - H1: MiniMax Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/mistral.md

- रूट: /plugins/reference/mistral
- शीर्षक:
  - H1: Mistral Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/moonshot.md

- रूट: /plugins/reference/moonshot
- शीर्षक:
  - H1: Moonshot Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/msteams.md

- रूट: /plugins/reference/msteams
- शीर्षक:
  - H1: Microsoft Teams Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/nextcloud-talk.md

- रूट: /plugins/reference/nextcloud-talk
- शीर्षक:
  - H1: Nextcloud Talk Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/nostr.md

- रूट: /plugins/reference/nostr
- शीर्षक:
  - H1: Nostr Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/novita.md

- रूट: /plugins/reference/novita
- शीर्षक:
  - H1: Novita Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/nvidia.md

- रूट: /plugins/reference/nvidia
- शीर्षक:
  - H1: NVIDIA Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/oc-path.md

- रूट: /plugins/reference/oc-path
- शीर्षक:
  - H1: Oc Path Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/ollama.md

- रूट: /plugins/reference/ollama
- शीर्षक:
  - H1: Ollama Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/open-prose.md

- रूट: /plugins/reference/open-prose
- शीर्षक:
  - H1: Open Prose Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/openai.md

- रूट: /plugins/reference/openai
- शीर्षक:
  - H1: OpenAI Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/opencode-go.md

- रूट: /plugins/reference/opencode-go
- शीर्षक:
  - H1: OpenCode Go Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/opencode.md

- रूट: /plugins/reference/opencode
- शीर्षक:
  - H1: OpenCode Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/openrouter.md

- रूट: /plugins/reference/openrouter
- शीर्षक:
  - H1: OpenRouter Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/openshell.md

- रूट: /plugins/reference/openshell
- शीर्षक:
  - H1: Openshell Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/perplexity.md

- रूट: /plugins/reference/perplexity
- शीर्षक:
  - H1: Perplexity Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/pixverse.md

- रूट: /plugins/reference/pixverse
- शीर्षक:
  - H1: PixVerse Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/policy.md

- रूट: /plugins/reference/policy
- शीर्षक:
  - H1: Policy Plugin
  - H2: वितरण
  - H2: सतह
  - H2: व्यवहार
  - H2: संबंधित दस्तावेज़

## plugins/reference/qa-channel.md

- रूट: /plugins/reference/qa-channel
- शीर्षक:
  - H1: QA Channel Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/qa-lab.md

- रूट: /plugins/reference/qa-lab
- शीर्षक:
  - H1: QA Lab Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/qa-matrix.md

- रूट: /plugins/reference/qa-matrix
- शीर्षक:
  - H1: QA Matrix Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/qianfan.md

- रूट: /plugins/reference/qianfan
- शीर्षक:
  - H1: Qianfan Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/qqbot.md

- रूट: /plugins/reference/qqbot
- शीर्षक:
  - H1: QQ Bot Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/qwen.md

- रूट: /plugins/reference/qwen
- शीर्षक:
  - H1: Qwen Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/raft.md

- रूट: /plugins/reference/raft
- शीर्षक:
  - H1: Raft Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/runway.md

- रूट: /plugins/reference/runway
- शीर्षक:
  - H1: Runway Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/searxng.md

- रूट: /plugins/reference/searxng
- शीर्षक:
  - H1: SearXNG Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/senseaudio.md

- रूट: /plugins/reference/senseaudio
- शीर्षक:
  - H1: Senseaudio Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/sglang.md

- रूट: /plugins/reference/sglang
- शीर्षक:
  - H1: SGLang Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/signal.md

- रूट: /plugins/reference/signal
- शीर्षक:
  - H1: Signal Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/slack.md

- रूट: /plugins/reference/slack
- शीर्षक:
  - H1: Slack Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/sms.md

- रूट: /plugins/reference/sms
- शीर्षक:
  - H1: Sms Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/stepfun.md

- रूट: /plugins/reference/stepfun
- शीर्षक:
  - H1: StepFun Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/synology-chat.md

- रूट: /plugins/reference/synology-chat
- शीर्षक:
  - H1: Synology Chat Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/synthetic.md

- रूट: /plugins/reference/synthetic
- शीर्षक:
  - H1: Synthetic Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tavily.md

- रूट: /plugins/reference/tavily
- शीर्षक:
  - H1: Tavily Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/telegram.md

- रूट: /plugins/reference/telegram
- शीर्षक:
  - H1: Telegram Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tencent.md

- रूट: /plugins/reference/tencent
- शीर्षक:
  - H1: Tencent Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tlon.md

- रूट: /plugins/reference/tlon
- शीर्षक:
  - H1: Tlon Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/together.md

- रूट: /plugins/reference/together
- शीर्षक:
  - H1: Together Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tokenjuice.md

- रूट: /plugins/reference/tokenjuice
- शीर्षक:
  - H1: Tokenjuice Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tts-local-cli.md

- रूट: /plugins/reference/tts-local-cli
- शीर्षक:
  - H1: TTS Local CLI Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/twitch.md

- मार्ग: /plugins/reference/twitch
- शीर्षक:
  - H1: Twitch Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/venice.md

- मार्ग: /plugins/reference/venice
- शीर्षक:
  - H1: Venice Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/vercel-ai-gateway.md

- मार्ग: /plugins/reference/vercel-ai-gateway
- शीर्षक:
  - H1: Vercel AI Gateway Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/vllm.md

- मार्ग: /plugins/reference/vllm
- शीर्षक:
  - H1: vLLM Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/voice-call.md

- मार्ग: /plugins/reference/voice-call
- शीर्षक:
  - H1: वॉइस कॉल Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/volcengine.md

- मार्ग: /plugins/reference/volcengine
- शीर्षक:
  - H1: Volcengine Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/voyage.md

- मार्ग: /plugins/reference/voyage
- शीर्षक:
  - H1: Voyage Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/vydra.md

- मार्ग: /plugins/reference/vydra
- शीर्षक:
  - H1: Vydra Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/web-readability.md

- मार्ग: /plugins/reference/web-readability
- शीर्षक:
  - H1: वेब पठनीयता Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/webhooks.md

- मार्ग: /plugins/reference/webhooks
- शीर्षक:
  - H1: Webhooks Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/whatsapp.md

- मार्ग: /plugins/reference/whatsapp
- शीर्षक:
  - H1: WhatsApp Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/workboard.md

- मार्ग: /plugins/reference/workboard
- शीर्षक:
  - H1: Workboard Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/xai.md

- मार्ग: /plugins/reference/xai
- शीर्षक:
  - H1: xAI Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/xiaomi.md

- मार्ग: /plugins/reference/xiaomi
- शीर्षक:
  - H1: Xiaomi Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/zai.md

- मार्ग: /plugins/reference/zai
- शीर्षक:
  - H1: Z.AI Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/zalo.md

- मार्ग: /plugins/reference/zalo
- शीर्षक:
  - H1: Zalo Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/zalouser.md

- मार्ग: /plugins/reference/zalouser
- शीर्षक:
  - H1: Zalo Personal Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/sdk-agent-harness.md

- मार्ग: /plugins/sdk-agent-harness
- शीर्षक:
  - H2: हार्नेस कब उपयोग करें
  - H2: कोर अभी भी क्या स्वामित्व रखता है
  - H2: हार्नेस पंजीकृत करें
  - H2: चयन नीति
  - H2: प्रदाता और हार्नेस युग्मन
  - H3: टूल-परिणाम मिडलवेयर
  - H3: टर्मिनल परिणाम वर्गीकरण
  - H3: एजेंट-अंत साइड इफ़ेक्ट
  - H3: उपयोगकर्ता इनपुट और टूल सतहें
  - H3: नेटिव Codex हार्नेस मोड
  - H2: रनटाइम कठोरता
  - H2: नेटिव सत्र और ट्रांसक्रिप्ट मिरर
  - H2: टूल और मीडिया परिणाम
  - H2: वर्तमान सीमाएँ
  - H2: संबंधित

## plugins/sdk-channel-inbound.md

- मार्ग: /plugins/sdk-channel-inbound
- शीर्षक:
  - H2: कोर हेल्पर
  - H2: माइग्रेशन

## plugins/sdk-channel-ingress.md

- मार्ग: /plugins/sdk-channel-ingress
- शीर्षक:
  - H1: चैनल इनग्रेस API
  - H2: रनटाइम रिज़ॉल्वर
  - H2: परिणाम
  - H2: एक्सेस समूह
  - H2: इवेंट मोड
  - H2: रूट और सक्रियण
  - H2: रिडैक्शन
  - H2: सत्यापन

## plugins/sdk-channel-message.md

- मार्ग: /plugins/sdk-channel-message
- शीर्षक: कोई नहीं

## plugins/sdk-channel-outbound.md

- मार्ग: /plugins/sdk-channel-outbound
- शीर्षक:
  - H2: अडैप्टर
  - H2: मौजूदा आउटबाउंड अडैप्टर
  - H2: टिकाऊ भेजना
  - H2: संगतता डिस्पैच

## plugins/sdk-channel-plugins.md

- मार्ग: /plugins/sdk-channel-plugins
- शीर्षक:
  - H2: चैनल Plugin कैसे काम करते हैं
  - H2: अनुमोदन और चैनल क्षमताएँ
  - H2: इनबाउंड मेंशन नीति
  - H2: वॉकथ्रू
  - H2: फ़ाइल संरचना
  - H2: उन्नत विषय
  - H2: अगले चरण
  - H2: संबंधित

## plugins/sdk-channel-turn.md

- मार्ग: /plugins/sdk-channel-turn
- शीर्षक: कोई नहीं

## plugins/sdk-entrypoints.md

- मार्ग: /plugins/sdk-entrypoints
- शीर्षक:
  - H2: defineToolPlugin
  - H2: definePluginEntry
  - H2: defineChannelPluginEntry
  - H2: defineSetupPluginEntry
  - H2: पंजीकरण मोड
  - H2: Plugin आकार
  - H2: संबंधित

## plugins/sdk-migration.md

- मार्ग: /plugins/sdk-migration
- शीर्षक:
  - H2: क्या बदल रहा है
  - H2: यह क्यों बदला
  - H2: बातचीत और रीयलटाइम वॉइस माइग्रेशन योजना
  - H2: संगतता नीति
  - H2: माइग्रेट कैसे करें
  - H2: इंपोर्ट पाथ संदर्भ
  - H2: सक्रिय डिप्रिकेशन
  - H2: हटाने की समयरेखा
  - H2: चेतावनियाँ अस्थायी रूप से दबाना
  - H2: संबंधित

## plugins/sdk-overview.md

- मार्ग: /plugins/sdk-overview
- शीर्षक:
  - H2: इंपोर्ट कन्वेंशन
  - H2: सबपाथ संदर्भ
  - H2: पंजीकरण API
  - H3: क्षमता पंजीकरण
  - H3: टूल और कमांड
  - H3: अवसंरचना
  - H3: वर्कफ़्लो Plugin के लिए होस्ट हुक
  - H3: Gateway डिस्कवरी पंजीकरण
  - H3: CLI पंजीकरण मेटाडेटा
  - H3: CLI बैकएंड पंजीकरण
  - H3: विशिष्ट स्लॉट
  - H3: अप्रचलित मेमोरी एम्बेडिंग अडैप्टर
  - H3: इवेंट और लाइफ़साइकल
  - H3: हुक निर्णय अर्थविज्ञान
  - H3: API ऑब्जेक्ट फ़ील्ड
  - H2: आंतरिक मॉड्यूल कन्वेंशन
  - H2: संबंधित

## plugins/sdk-provider-plugins.md

- मार्ग: /plugins/sdk-provider-plugins
- शीर्षक:
  - H2: वॉकथ्रू
  - H2: ClawHub पर प्रकाशित करें
  - H2: फ़ाइल संरचना
  - H2: कैटलॉग क्रम संदर्भ
  - H2: अगले चरण
  - H2: संबंधित

## plugins/sdk-runtime.md

- मार्ग: /plugins/sdk-runtime
- शीर्षक:
  - H2: कॉन्फ़िग लोडिंग और लेखन
  - H2: पुन: उपयोग योग्य रनटाइम उपयोगिताएँ
  - H2: रनटाइम नेमस्पेस
  - H2: रनटाइम संदर्भ संग्रहित करना
  - H2: अन्य शीर्ष-स्तरीय api फ़ील्ड
  - H2: संबंधित

## plugins/sdk-setup.md

- मार्ग: /plugins/sdk-setup
- शीर्षक:
  - H2: पैकेज मेटाडेटा
  - H3: openclaw फ़ील्ड
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: विलंबित पूर्ण लोड
  - H2: Plugin मैनिफ़ेस्ट
  - H2: ClawHub प्रकाशन
  - H2: सेटअप एंट्री
  - H3: संकीर्ण सेटअप हेल्पर इंपोर्ट
  - H3: चैनल-स्वामित्व वाला सिंगल-अकाउंट प्रमोशन
  - H2: कॉन्फ़िग स्कीमा
  - H3: चैनल कॉन्फ़िग स्कीमा बनाना
  - H2: सेटअप विज़ार्ड
  - H2: प्रकाशित करना और इंस्टॉल करना
  - H2: संबंधित

## plugins/sdk-subpaths.md

- मार्ग: /plugins/sdk-subpaths
- शीर्षक:
  - H2: Plugin एंट्री
  - H3: अप्रचलित संगतता और टेस्ट हेल्पर
  - H3: आरक्षित बंडल्ड Plugin हेल्पर सबपाथ
  - H2: संबंधित

## plugins/sdk-testing.md

- मार्ग: /plugins/sdk-testing
- शीर्षक:
  - H2: टेस्ट उपयोगिताएँ
  - H3: उपलब्ध एक्सपोर्ट
  - H3: प्रकार
  - H2: टेस्टिंग लक्ष्य रिज़ॉल्यूशन
  - H2: टेस्टिंग पैटर्न
  - H3: पंजीकरण अनुबंधों की टेस्टिंग
  - H3: रनटाइम कॉन्फ़िग एक्सेस की टेस्टिंग
  - H3: चैनल Plugin की यूनिट टेस्टिंग
  - H3: प्रदाता Plugin की यूनिट टेस्टिंग
  - H3: Plugin रनटाइम को मॉक करना
  - H3: प्रति-इंस्टेंस स्टब के साथ टेस्टिंग
  - H2: अनुबंध टेस्ट (इन-रेपो Plugin)
  - H3: स्कोप्ड टेस्ट चलाना
  - H2: लिंट प्रवर्तन (इन-रेपो Plugin)
  - H2: टेस्ट कॉन्फ़िगरेशन
  - H2: संबंधित

## plugins/tool-plugins.md

- मार्ग: /plugins/tool-plugins
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: क्विकस्टार्ट
  - H2: टूल लिखें
  - H2: वैकल्पिक और फ़ैक्टरी टूल
  - H2: रिटर्न मान
  - H2: कॉन्फ़िगरेशन
  - H2: जनरेटेड मेटाडेटा
  - H2: पैकेज मेटाडेटा
  - H2: CI में सत्यापित करें
  - H2: स्थानीय रूप से इंस्टॉल और निरीक्षण करें
  - H2: प्रकाशित करें
  - H2: समस्या निवारण
  - H3: Plugin एंट्री नहीं मिली: ./dist/index.js
  - H3: Plugin एंट्री defineToolPlugin मेटाडेटा एक्सपोज़ नहीं करती
  - H3: openclaw.plugin.json जनरेटेड मेटाडेटा पुराना है
  - H3: package.json openclaw.extensions में ./dist/index.js शामिल होना चाहिए
  - H3: पैकेज 'typebox' नहीं मिल सका
  - H3: इंस्टॉल के बाद टूल दिखाई नहीं देता
  - H2: यह भी देखें

## plugins/voice-call.md

- मार्ग: /plugins/voice-call
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: कॉन्फ़िगरेशन
  - H2: सत्र स्कोप
  - H2: रीयलटाइम वॉइस बातचीत
  - H3: टूल नीति
  - H3: एजेंट वॉइस संदर्भ
  - H3: रीयलटाइम प्रदाता उदाहरण
  - H2: स्ट्रीमिंग ट्रांसक्रिप्शन
  - H3: स्ट्रीमिंग प्रदाता उदाहरण
  - H2: कॉल के लिए TTS
  - H3: TTS उदाहरण
  - H2: इनबाउंड कॉल
  - H3: प्रति-नंबर रूटिंग
  - H3: बोले गए आउटपुट अनुबंध
  - H3: बातचीत प्रारंभ व्यवहार
  - H3: Twilio स्ट्रीम डिस्कनेक्ट ग्रेस
  - H2: पुरानी कॉल रीपर
  - H2: Webhook सुरक्षा
  - H2: CLI
  - H2: एजेंट टूल
  - H2: Gateway RPC
  - H2: समस्या निवारण
  - H3: सेटअप Webhook एक्सपोज़र में विफल होता है
  - H3: प्रदाता क्रेडेंशियल विफल होते हैं
  - H3: कॉल शुरू होती हैं लेकिन प्रदाता Webhook नहीं आते
  - H3: हस्ताक्षर सत्यापन विफल होता है
  - H3: Google Meet Twilio जॉइन विफल होते हैं
  - H3: रीयलटाइम कॉल में आवाज़ नहीं है
  - H2: संबंधित

## plugins/webhooks.md

- मार्ग: /plugins/webhooks
- शीर्षक:
  - H2: यह कहाँ चलता है
  - H2: रूट कॉन्फ़िगर करें
  - H2: सुरक्षा मॉडल
  - H2: अनुरोध प्रारूप
  - H2: समर्थित क्रियाएँ
  - H3: createflow
  - H3: runtask
  - H2: प्रतिक्रिया आकार
  - H2: संबंधित दस्तावेज़

## plugins/workboard.md

- मार्ग: /plugins/workboard
- शीर्षक:
  - H2: डिफ़ॉल्ट स्थिति
  - H2: कार्ड में क्या होता है
  - H2: कार्ड निष्पादन और कार्य
  - H2: एजेंट समन्वय
  - H3: डिस्पैच वर्कर चयन
  - H3: वर्कर प्रॉम्प्ट और लाइफ़साइकल
  - H3: डिस्पैच एंट्री पॉइंट
  - H2: CLI और स्लैश कमांड
  - H2: सत्र लाइफ़साइकल सिंक
  - H2: डैशबोर्ड वर्कफ़्लो
  - H2: अनुमतियाँ
  - H2: कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H3: टैब कहता है कि Workboard उपलब्ध नहीं है
  - H3: कार्ड सेव नहीं होते
  - H3: कार्ड शुरू करने पर अपेक्षित सत्र नहीं खुलता
  - H3: डिस्पैच वर्कर शुरू नहीं करता
  - H2: संबंधित

## plugins/zalouser.md

- मार्ग: /plugins/zalouser
- शीर्षक:
  - H2: नामकरण
  - H2: यह कहाँ चलता है
  - H2: इंस्टॉल करें
  - H3: विकल्प A: npm से इंस्टॉल करें
  - H3: विकल्प B: स्थानीय फ़ोल्डर से इंस्टॉल करें (dev)
  - H2: कॉन्फ़िग
  - H2: CLI
  - H2: एजेंट टूल
  - H2: संबंधित

## prose.md

- मार्ग: /prose
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: स्लैश कमांड
  - H2: यह क्या कर सकता है
  - H2: उदाहरण: समानांतर शोध और संश्लेषण
  - H2: OpenClaw रनटाइम मैपिंग
  - H2: फ़ाइल स्थान
  - H2: स्टेट बैकएंड
  - H2: सुरक्षा
  - H2: संबंधित

## providers/alibaba.md

- मार्ग: /providers/alibaba
- शीर्षक:
  - H2: शुरू करना
  - H2: बिल्ट-इन Wan मॉडल
  - H2: क्षमताएँ और सीमाएँ
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/anthropic.md

- मार्ग: /providers/anthropic
- शीर्षक:
  - H2: शुरू करना
  - H2: थिंकिंग डिफ़ॉल्ट (Claude Fable 5, 4.8, और 4.6)
  - H2: प्रॉम्प्ट कैशिंग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/arcee.md

- मार्ग: /providers/arcee
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: नॉन-इंटरैक्टिव सेटअप
  - H2: बिल्ट-इन कैटलॉग
  - H2: समर्थित सुविधाएँ
  - H2: संबंधित

## providers/azure-speech.md

- मार्ग: /providers/azure-speech
- शीर्षक:
  - H2: शुरू करना
  - H2: कॉन्फ़िगरेशन विकल्प
  - H2: नोट्स
  - H2: संबंधित

## providers/bedrock-mantle.md

- मार्ग: /providers/bedrock-mantle
- शीर्षक:
  - H2: शुरू करना
  - H2: स्वचालित मॉडल डिस्कवरी
  - H3: समर्थित क्षेत्र
  - H2: मैनुअल कॉन्फ़िगरेशन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/bedrock.md

- मार्ग: /providers/bedrock
- शीर्षक:
  - H2: शुरू करना
  - H2: स्वचालित मॉडल डिस्कवरी
  - H2: त्वरित सेटअप (AWS पाथ)
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/cerebras.md

- मार्ग: /providers/cerebras
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: नॉन-इंटरैक्टिव सेटअप
  - H2: बिल्ट-इन कैटलॉग
  - H2: मैनुअल कॉन्फ़िग
  - H2: संबंधित

## providers/chutes.md

- मार्ग: /providers/chutes
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: डिस्कवरी व्यवहार
  - H2: डिफ़ॉल्ट उपनाम
  - H2: बिल्ट-इन स्टार्टर कैटलॉग
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/claude-max-api-proxy.md

- रूट: /providers/claude-max-api-proxy
- शीर्षक:
  - H2: इसका उपयोग क्यों करें?
  - H2: यह कैसे काम करता है
  - H2: शुरुआत करना
  - H2: अंतर्निहित कैटलॉग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: संबंधित

## providers/clawrouter.md

- रूट: /providers/clawrouter
- शीर्षक:
  - H2: शुरुआत करना
  - H2: मॉडल खोज
  - H2: प्रोटोकॉल और प्रदाता plugins
  - H2: कोटा और उपयोग
  - H2: समस्या निवारण
  - H2: सुरक्षा व्यवहार
  - H2: संबंधित

## providers/cloudflare-ai-gateway.md

- रूट: /providers/cloudflare-ai-gateway
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: गैर-इंटरैक्टिव उदाहरण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/cohere.md

- रूट: /providers/cohere
- शीर्षक:
  - H2: शुरुआत करें
  - H2: केवल-एनवायरनमेंट सेटअप
  - H2: संबंधित

## providers/comfy.md

- रूट: /providers/comfy
- शीर्षक:
  - H2: यह क्या समर्थन करता है
  - H2: शुरुआत करना
  - H2: कॉन्फ़िगरेशन
  - H3: साझा कुंजियां
  - H3: प्रति-क्षमता कुंजियां
  - H2: वर्कफ़्लो विवरण
  - H2: संबंधित

## providers/deepgram.md

- रूट: /providers/deepgram
- शीर्षक:
  - H2: शुरुआत करना
  - H2: कॉन्फ़िगरेशन विकल्प
  - H2: वॉयस कॉल स्ट्रीमिंग STT
  - H2: नोट्स
  - H2: संबंधित

## providers/deepinfra.md

- रूट: /providers/deepinfra
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: API कुंजी प्राप्त करना
  - H2: CLI सेटअप
  - H2: कॉन्फ़िग स्निपेट
  - H2: समर्थित OpenClaw सतहें
  - H2: उपलब्ध मॉडल
  - H2: नोट्स
  - H2: संबंधित

## providers/deepseek.md

- रूट: /providers/deepseek
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: अंतर्निहित कैटलॉग
  - H2: सोच और टूल
  - H2: लाइव परीक्षण
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/ds4.md

- रूट: /providers/ds4
- शीर्षक:
  - H2: आवश्यकताएं
  - H2: क्विकस्टार्ट
  - H2: पूर्ण कॉन्फ़िग
  - H2: ऑन-डिमांड स्टार्टअप
  - H2: Think Max
  - H2: परीक्षण
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/elevenlabs.md

- रूट: /providers/elevenlabs
- शीर्षक:
  - H2: प्रमाणीकरण
  - H2: टेक्स्ट-टू-स्पीच
  - H2: स्पीच-टू-टेक्स्ट
  - H2: स्ट्रीमिंग STT
  - H2: संबंधित

## providers/fal.md

- रूट: /providers/fal
- शीर्षक:
  - H2: शुरुआत करना
  - H2: छवि जनरेशन
  - H2: वीडियो जनरेशन
  - H2: संगीत जनरेशन
  - H2: संबंधित

## providers/fireworks.md

- रूट: /providers/fireworks
- शीर्षक:
  - H2: शुरुआत करना
  - H2: गैर-इंटरैक्टिव सेटअप
  - H2: अंतर्निहित कैटलॉग
  - H2: कस्टम Fireworks मॉडल ids
  - H2: संबंधित

## providers/github-copilot.md

- रूट: /providers/github-copilot
- शीर्षक:
  - H2: OpenClaw में Copilot उपयोग करने के तीन तरीके
  - H2: वैकल्पिक फ़्लैग
  - H2: गैर-इंटरैक्टिव ऑनबोर्डिंग
  - H2: मेमोरी खोज एम्बेडिंग
  - H3: कॉन्फ़िग
  - H3: यह कैसे काम करता है
  - H2: संबंधित

## providers/gmi.md

- रूट: /providers/gmi
- शीर्षक:
  - H2: सेटअप
  - H2: डिफ़ॉल्ट
  - H2: GMI कब चुनें
  - H2: मॉडल
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/google.md

- रूट: /providers/google
- शीर्षक:
  - H2: शुरुआत करना
  - H2: क्षमताएं
  - H2: वेब खोज
  - H2: छवि जनरेशन
  - H2: वीडियो जनरेशन
  - H2: संगीत जनरेशन
  - H2: टेक्स्ट-टू-स्पीच
  - H2: रीयलटाइम वॉयस
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/gradium.md

- रूट: /providers/gradium
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: सेटअप
  - H2: कॉन्फ़िग
  - H2: आवाज़ें
  - H3: प्रति-संदेश वॉयस ओवरराइड
  - H2: आउटपुट
  - H2: ऑटो-चयन क्रम
  - H2: संबंधित

## providers/groq.md

- रूट: /providers/groq
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H3: कॉन्फ़िग फ़ाइल उदाहरण
  - H2: अंतर्निहित कैटलॉग
  - H2: रीजनिंग मॉडल
  - H2: ऑडियो ट्रांसक्रिप्शन
  - H2: संबंधित

## providers/huggingface.md

- रूट: /providers/huggingface
- शीर्षक:
  - H2: शुरुआत करना
  - H3: गैर-इंटरैक्टिव सेटअप
  - H2: मॉडल IDs
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/index.md

- रूट: /providers
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: प्रदाता दस्तावेज़
  - H2: साझा अवलोकन पृष्ठ
  - H2: ट्रांसक्रिप्शन प्रदाता
  - H2: कम्युनिटी टूल

## providers/inferrs.md

- रूट: /providers/inferrs
- शीर्षक:
  - H2: शुरुआत करना
  - H2: पूर्ण कॉन्फ़िग उदाहरण
  - H2: ऑन-डिमांड स्टार्टअप
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/inworld.md

- रूट: /providers/inworld
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: कॉन्फ़िगरेशन विकल्प
  - H2: नोट्स
  - H2: संबंधित

## providers/kilocode.md

- रूट: /providers/kilocode
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: डिफ़ॉल्ट मॉडल
  - H2: अंतर्निहित कैटलॉग
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/litellm.md

- रूट: /providers/litellm
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: कॉन्फ़िगरेशन
  - H3: एनवायरनमेंट वैरिएबल
  - H3: कॉन्फ़िग फ़ाइल
  - H2: उन्नत कॉन्फ़िगरेशन
  - H3: छवि जनरेशन
  - H2: संबंधित

## providers/lmstudio.md

- रूट: /providers/lmstudio
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: गैर-इंटरैक्टिव ऑनबोर्डिंग
  - H2: कॉन्फ़िगरेशन
  - H3: स्ट्रीमिंग उपयोग संगतता
  - H3: सोच संगतता
  - H3: स्पष्ट कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H3: LM Studio नहीं मिला
  - H3: प्रमाणीकरण त्रुटियां (HTTP 401)
  - H3: जस्ट-इन-टाइम मॉडल लोडिंग
  - H3: LAN या tailnet LM Studio होस्ट
  - H2: संबंधित

## providers/minimax.md

- रूट: /providers/minimax
- शीर्षक:
  - H2: अंतर्निहित कैटलॉग
  - H2: शुरुआत करना
  - H2: openclaw configure के जरिए कॉन्फ़िगर करें
  - H2: क्षमताएं
  - H3: छवि जनरेशन
  - H3: टेक्स्ट-टू-स्पीच
  - H3: संगीत जनरेशन
  - H3: वीडियो जनरेशन
  - H3: छवि समझ
  - H3: वेब खोज
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/mistral.md

- रूट: /providers/mistral
- शीर्षक:
  - H2: शुरुआत करना
  - H2: अंतर्निहित LLM कैटलॉग
  - H2: ऑडियो ट्रांसक्रिप्शन (Voxtral)
  - H2: वॉयस कॉल स्ट्रीमिंग STT
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/models.md

- रूट: /providers/models
- शीर्षक:
  - H2: त्वरित शुरुआत (दो चरण)
  - H2: समर्थित प्रदाता (स्टार्टर सेट)
  - H2: अतिरिक्त प्रदाता वैरिएंट
  - H2: संबंधित

## providers/moonshot.md

- रूट: /providers/moonshot
- शीर्षक:
  - H2: अंतर्निहित मॉडल कैटलॉग
  - H2: शुरुआत करना
  - H2: Kimi वेब खोज
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/novita.md

- रूट: /providers/novita
- शीर्षक:
  - H2: सेटअप
  - H2: डिफ़ॉल्ट
  - H2: Novita कब चुनें
  - H2: मॉडल
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/nvidia.md

- रूट: /providers/nvidia
- शीर्षक:
  - H2: शुरुआत करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: विशेष कैटलॉग
  - H2: Nemotron 3 Ultra
  - H2: बंडल किया गया फ़ॉलबैक कैटलॉग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/ollama-cloud.md

- रूट: /providers/ollama-cloud
- शीर्षक:
  - H2: सेटअप
  - H2: डिफ़ॉल्ट
  - H2: Ollama Cloud कब चुनें
  - H2: मॉडल
  - H2: लाइव परीक्षण
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/ollama.md

- रूट: /providers/ollama
- शीर्षक:
  - H2: प्रमाणीकरण नियम
  - H2: शुरुआत करना
  - H2: क्लाउड मॉडल
  - H2: मॉडल खोज (अंतर्निहित प्रदाता)
  - H2: Node-स्थानीय अनुमान
  - H2: विज़न और छवि विवरण
  - H2: कॉन्फ़िगरेशन
  - H2: सामान्य रेसिपी
  - H3: मॉडल चयन
  - H3: त्वरित सत्यापन
  - H2: Ollama वेब खोज
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/openai.md

- रूट: /providers/openai
- शीर्षक:
  - H2: त्वरित चुनाव
  - H2: नामकरण मैप
  - H2: GPT-5.6 सीमित प्रीव्यू
  - H2: OpenClaw फ़ीचर कवरेज
  - H2: मेमोरी एम्बेडिंग
  - H2: शुरुआत करना
  - H2: नेटिव Codex ऐप-सर्वर प्रमाणीकरण
  - H2: छवि जनरेशन
  - H2: वीडियो जनरेशन
  - H2: GPT-5 प्रॉम्प्ट योगदान
  - H2: वॉयस और स्पीच
  - H2: Azure OpenAI एंडपॉइंट
  - H3: कॉन्फ़िगरेशन
  - H3: API संस्करण
  - H3: मॉडल नाम डिप्लॉयमेंट नाम होते हैं
  - H3: क्षेत्रीय उपलब्धता
  - H3: पैरामीटर अंतर
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/opencode-go.md

- रूट: /providers/opencode-go
- शीर्षक:
  - H2: अंतर्निहित कैटलॉग
  - H2: शुरुआत करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/opencode.md

- रूट: /providers/opencode
- शीर्षक:
  - H2: शुरुआत करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: अंतर्निहित कैटलॉग
  - H3: Zen
  - H3: Go
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/openrouter.md

- रूट: /providers/openrouter
- शीर्षक:
  - H2: शुरुआत करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: मॉडल संदर्भ
  - H2: छवि जनरेशन
  - H2: वीडियो जनरेशन
  - H2: संगीत जनरेशन
  - H2: टेक्स्ट-टू-स्पीच
  - H2: स्पीच-टू-टेक्स्ट (इनबाउंड ऑडियो)
  - H2: Fusion राउटर
  - H2: प्रमाणीकरण और हेडर
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/perplexity-provider.md

- रूट: /providers/perplexity-provider
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: खोज मोड
  - H2: नेटिव API फ़िल्टरिंग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/pixverse.md

- रूट: /providers/pixverse
- शीर्षक:
  - H2: शुरुआत करना
  - H2: समर्थित मोड और मॉडल
  - H2: प्रदाता विकल्प
  - H2: कॉन्फ़िगरेशन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/qianfan.md

- रूट: /providers/qianfan
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: अंतर्निहित कैटलॉग
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/qwen-oauth.md

- रूट: /providers/qwen-oauth
- शीर्षक:
  - H2: सेटअप
  - H2: डिफ़ॉल्ट
  - H2: यह Qwen से कैसे अलग है
  - H2: Qwen OAuth / Portal कब चुनें
  - H2: मॉडल
  - H2: माइग्रेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/qwen.md

- रूट: /providers/qwen
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: प्लान प्रकार और एंडपॉइंट
  - H2: अंतर्निहित कैटलॉग
  - H2: सोच नियंत्रण
  - H2: मल्टीमोडल ऐड-ऑन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/runway.md

- रूट: /providers/runway
- शीर्षक:
  - H2: शुरुआत करना
  - H2: समर्थित मोड और मॉडल
  - H2: कॉन्फ़िगरेशन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/senseaudio.md

- रूट: /providers/senseaudio
- शीर्षक:
  - H2: शुरुआत करना
  - H2: विकल्प
  - H2: संबंधित

## providers/sglang.md

- रूट: /providers/sglang
- शीर्षक:
  - H2: शुरुआत करना
  - H2: मॉडल खोज (अंतर्निहित प्रदाता)
  - H2: स्पष्ट कॉन्फ़िगरेशन (मैनुअल मॉडल)
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/stepfun.md

- रूट: /providers/stepfun
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: क्षेत्र और एंडपॉइंट अवलोकन
  - H2: अंतर्निहित कैटलॉग
  - H2: शुरुआत करना
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/synthetic.md

- रूट: /providers/synthetic
- शीर्षक:
  - H2: शुरुआत करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: अंतर्निहित कैटलॉग
  - H2: संबंधित

## providers/tencent.md

- रूट: /providers/tencent
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: गैर-इंटरैक्टिव सेटअप
  - H2: अंतर्निहित कैटलॉग
  - H2: स्तरीकृत मूल्य निर्धारण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/together.md

- रूट: /providers/together
- शीर्षक:
  - H2: शुरुआत करना
  - H3: गैर-इंटरैक्टिव उदाहरण
  - H2: अंतर्निहित कैटलॉग
  - H2: वीडियो जनरेशन
  - H2: संबंधित

## providers/venice.md

- रूट: /providers/venice
- शीर्षक:
  - H2: OpenClaw में Venice क्यों
  - H2: गोपनीयता मोड
  - H2: फ़ीचर
  - H2: शुरुआत करना
  - H2: मॉडल चयन
  - H2: DeepSeek V4 रीप्ले व्यवहार
  - H2: अंतर्निहित कैटलॉग (कुल 41)
  - H2: मॉडल खोज
  - H2: स्ट्रीमिंग और टूल समर्थन
  - H2: मूल्य निर्धारण
  - H3: Venice (अनामित) बनाम प्रत्यक्ष API
  - H2: उपयोग उदाहरण
  - H2: समस्या निवारण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/vercel-ai-gateway.md

- रूट: /providers/vercel-ai-gateway
- शीर्षक:
  - H2: शुरुआत करना
  - H2: गैर-इंटरैक्टिव उदाहरण
  - H2: मॉडल ID शॉर्टहैंड
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/vllm.md

- मार्ग: /providers/vllm
- शीर्षक:
  - H2: शुरुआत करना
  - H2: मॉडल खोज (अंतर्निहित प्रदाता)
  - H2: स्पष्ट कॉन्फ़िगरेशन (मैन्युअल मॉडल)
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/volcengine.md

- मार्ग: /providers/volcengine
- शीर्षक:
  - H2: शुरुआत करना
  - H2: प्रदाता और एंडपॉइंट
  - H2: अंतर्निहित कैटलॉग
  - H2: टेक्स्ट-टू-स्पीच
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/vydra.md

- मार्ग: /providers/vydra
- शीर्षक:
  - H2: सेटअप
  - H2: क्षमताएं
  - H2: संबंधित

## providers/xai.md

- मार्ग: /providers/xai
- शीर्षक:
  - H2: अपना सेटअप पथ चुनें
  - H2: OAuth समस्या निवारण
  - H2: अंतर्निहित कैटलॉग
  - H2: OpenClaw सुविधा कवरेज
  - H3: फास्ट-मोड मैपिंग
  - H3: लेगेसी संगतता उपनाम
  - H2: सुविधाएं
  - H2: लाइव परीक्षण
  - H2: संबंधित

## providers/xiaomi.md

- मार्ग: /providers/xiaomi
- शीर्षक:
  - H2: शुरुआत करना
  - H2: पे-ऐज़-यू-गो कैटलॉग
  - H2: Token Plan कैटलॉग
  - H2: टेक्स्ट-टू-स्पीच
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/zai.md

- मार्ग: /providers/zai
- शीर्षक:
  - H2: GLM मॉडल
  - H2: शुरुआत करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: अंतर्निहित कैटलॉग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## refactor/access.md

- मार्ग: /refactor/access
- शीर्षक: कोई नहीं

## refactor/acp.md

- मार्ग: /refactor/acp
- शीर्षक:
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: लक्षित मॉडल
  - H3: Gateway इंस्टेंस पहचान
  - H3: ACP सत्र स्वामित्व
  - H3: ACPX प्रक्रिया लीज़
  - H2: लाइफ़साइकल नियंत्रक
  - H2: रैपर अनुबंध
  - H2: सत्र दृश्यता अनुबंध
  - H2: माइग्रेशन योजना
  - H3: चरण 1: पहचान और लीज़ जोड़ें
  - H3: चरण 2: लीज़-प्रथम क्लीनअप
  - H3: चरण 3: लीज़-प्रथम स्टार्टअप रीपिंग
  - H3: चरण 4: सत्र स्वामित्व पंक्तियां
  - H3: चरण 5: लेगेसी हीयूरिस्टिक्स हटाएं
  - H2: परीक्षण
  - H2: संगतता नोट्स
  - H2: सफलता मानदंड

## refactor/canvas.md

- मार्ग: /refactor/canvas
- शीर्षक:
  - H1: Canvas Plugin रीफ़ैक्टर
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: वर्तमान ब्रांच स्थिति
  - H2: लक्षित आकार
  - H2: माइग्रेशन चरण
  - H2: ऑडिट चेकलिस्ट
  - H2: सत्यापन कमांड

## refactor/database-first.md

- मार्ग: /refactor/database-first
- शीर्षक:
  - H1: डेटाबेस-प्रथम स्टेट रीफ़ैक्टर
  - H2: निर्णय
  - H2: कठोर अनुबंध
  - H2: लक्ष्य स्थिति और प्रगति
  - H3: कठोर लक्ष्य
  - H3: लक्ष्य स्थितियां
  - H3: वर्तमान स्थिति
  - H3: शेष कार्य
  - H3: पीछे न जाएं
  - H2: कोड-पठन धारणाएं
  - H2: कोड-पठन निष्कर्ष
  - H2: वर्तमान कोड आकार
  - H2: लक्षित स्कीमा आकार
  - H2: Doctor माइग्रेशन आकार
  - H2: माइग्रेशन इन्वेंटरी
  - H2: माइग्रेशन योजना
  - H3: चरण 0: सीमा को फ़्रीज़ करें
  - H3: चरण 1: वैश्विक कंट्रोल प्लेन पूरा करें
  - H3: चरण 2: प्रति-एजेंट डेटाबेस पेश करें
  - H3: चरण 3: सत्र स्टोर API बदलें
  - H3: चरण 4: ट्रांसक्रिप्ट, ACP स्ट्रीम, ट्रैजेक्टरी और VFS स्थानांतरित करें
  - H3: चरण 5: बैकअप, रिस्टोर, वैक्यूम और सत्यापित करें
  - H3: चरण 6: वर्कर रनटाइम
  - H3: चरण 7: पुरानी दुनिया हटाएं
  - H2: बैकअप और रिस्टोर
  - H2: रनटाइम रीफ़ैक्टर योजना
  - H2: प्रदर्शन नियम
  - H2: स्थिर प्रतिबंध
  - H2: पूर्णता मानदंड

## refactor/ingress-core.md

- मार्ग: /refactor/ingress-core
- शीर्षक:
  - H1: Ingress core हटाने की योजना
  - H2: बजट
  - H2: निदान
  - H2: हॉटस्पॉट
  - H2: वर्तमान कोड पठन
  - H2: सीमा
  - H2: स्वीकृति नियम
  - H2: कार्य पैकेज
  - H2: हटाने की तरंगें
  - H2: स्थानांतरित न करें
  - H2: सत्यापन
  - H2: निकास मानदंड

## reference/AGENTS.default.md

- मार्ग: /reference/AGENTS.default
- शीर्षक:
  - H2: पहला रन (अनुशंसित)
  - H2: सुरक्षा डिफ़ॉल्ट
  - H2: मौजूदा समाधान प्रीफ़्लाइट
  - H2: सत्र प्रारंभ (आवश्यक)
  - H2: आत्मा (आवश्यक)
  - H2: साझा स्थान (अनुशंसित)
  - H2: मेमोरी सिस्टम (अनुशंसित)
  - H2: टूल और Skills
  - H2: बैकअप सुझाव (अनुशंसित)
  - H2: OpenClaw क्या करता है
  - H2: मुख्य Skills (Settings → Skills में सक्षम करें)
  - H2: उपयोग नोट्स
  - H2: संबंधित

## reference/RELEASING.md

- मार्ग: /reference/RELEASING
- शीर्षक:
  - H2: संस्करण नामकरण
  - H2: रिलीज़ कैडेंस
  - H2: रिलीज़ ऑपरेटर चेकलिस्ट
  - H2: स्थिर main क्लोज़आउट
  - H2: रिलीज़ प्रीफ़्लाइट
  - H2: रिलीज़ टेस्ट बॉक्स
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Package
  - H2: रिलीज़ प्रकाशन ऑटोमेशन
  - H2: NPM वर्कफ़्लो इनपुट
  - H2: स्थिर npm रिलीज़ क्रम
  - H2: सार्वजनिक संदर्भ
  - H2: संबंधित

## reference/api-usage-costs.md

- मार्ग: /reference/api-usage-costs
- शीर्षक:
  - H2: लागतें कहां दिखती हैं (चैट + CLI)
  - H2: कुंजियां कैसे खोजी जाती हैं
  - H2: कुंजियां खर्च कर सकने वाली सुविधाएं
  - H3: 1) मुख्य मॉडल प्रतिक्रियाएं (चैट + टूल)
  - H3: 2) मीडिया समझ (ऑडियो/छवि/वीडियो)
  - H3: 3) छवि और वीडियो जनरेशन
  - H3: 4) मेमोरी एम्बेडिंग + सिमैंटिक खोज
  - H3: 5) वेब खोज टूल
  - H3: 5) वेब फ़ेच टूल (Firecrawl)
  - H3: 6) प्रदाता उपयोग स्नैपशॉट (स्थिति/स्वास्थ्य)
  - H3: 7) Compaction सुरक्षा सारांश
  - H3: 8) मॉडल स्कैन / प्रोब
  - H3: 9) Talk (स्पीच)
  - H3: 10) Skills (तृतीय-पक्ष API)
  - H2: संबंधित

## reference/application-modernization-plan.md

- मार्ग: /reference/application-modernization-plan
- शीर्षक:
  - H2: लक्ष्य
  - H2: सिद्धांत
  - H2: चरण 1: बेसलाइन ऑडिट
  - H2: चरण 2: उत्पाद और UX क्लीनअप
  - H2: चरण 3: फ़्रंटएंड आर्किटेक्चर कसना
  - H2: चरण 4: प्रदर्शन और विश्वसनीयता
  - H2: चरण 5: टाइप, अनुबंध और परीक्षण सुदृढ़ीकरण
  - H2: चरण 6: दस्तावेज़ीकरण और रिलीज़ तैयारी
  - H2: अनुशंसित पहला स्लाइस
  - H2: फ़्रंटएंड skill अपडेट

## reference/code-mode.md

- मार्ग: /reference/code-mode
- शीर्षक:
  - H2: यह क्या है?
  - H2: यह अच्छा क्यों है?
  - H2: इसे कैसे सक्षम करें
  - H2: तकनीकी अवलोकन
  - H2: रनटाइम स्थिति
  - H2: दायरा
  - H2: शब्द
  - H2: कॉन्फ़िगरेशन
  - H2: सक्रियण
  - H2: मॉडल-दृश्यमान टूल
  - H2: exec
  - H2: wait
  - H2: गेस्ट रनटाइम API
  - H2: आंतरिक नेमस्पेस
  - H3: रजिस्ट्री लाइफ़साइकल
  - H3: पंजीकरण आकार
  - H3: स्वामित्व और दृश्यता
  - H3: दायरा सीरियलाइज़ेशन नियम
  - H3: प्रॉम्प्ट
  - H3: क्लीनअप
  - H3: परीक्षण चेकलिस्ट
  - H2: आउटपुट API
  - H2: टूल कैटलॉग
  - H2: Tool Search अंतःक्रिया
  - H2: टूल नाम और टकराव
  - H2: नेस्टेड टूल निष्पादन
  - H2: रनटाइम स्टेट
  - H2: QuickJS-WASI रनटाइम
  - H2: TypeScript
  - H2: सुरक्षा सीमा
  - H2: त्रुटि कोड
  - H2: टेलीमेट्री
  - H2: डिबगिंग
  - H2: इम्प्लीमेंटेशन लेआउट
  - H2: सत्यापन चेकलिस्ट
  - H2: E2E परीक्षण योजना
  - H2: संबंधित

## reference/credits.md

- मार्ग: /reference/credits
- शीर्षक:
  - H2: नाम
  - H2: श्रेय
  - H2: मुख्य योगदानकर्ता
  - H2: लाइसेंस
  - H2: संबंधित

## reference/device-models.md

- मार्ग: /reference/device-models
- शीर्षक:
  - H2: डेटा स्रोत
  - H2: डेटाबेस अपडेट करना
  - H2: संबंधित

## reference/full-release-validation.md

- मार्ग: /reference/full-release-validation
- शीर्षक:
  - H2: शीर्ष-स्तरीय चरण
  - H2: रिलीज़ जांच चरण
  - H2: Docker रिलीज़-पथ चंक
  - H2: रिलीज़ प्रोफ़ाइल
  - H2: केवल-पूर्ण जोड़
  - H2: केंद्रित पुनःरन
  - H2: रखने योग्य प्रमाण
  - H2: वर्कफ़्लो फ़ाइलें

## reference/memory-config.md

- मार्ग: /reference/memory-config
- शीर्षक:
  - H2: प्रदाता चयन
  - H3: कस्टम प्रदाता id
  - H3: API कुंजी समाधान
  - H2: रिमोट एंडपॉइंट कॉन्फ़िग
  - H2: प्रदाता-विशिष्ट कॉन्फ़िग
  - H3: इनलाइन एम्बेडिंग टाइमआउट
  - H2: हाइब्रिड खोज कॉन्फ़िग
  - H3: पूर्ण उदाहरण
  - H2: अतिरिक्त मेमोरी पथ
  - H2: मल्टीमोडल मेमोरी (Gemini)
  - H2: एम्बेडिंग कैश
  - H2: बैच इंडेक्सिंग
  - H2: सत्र मेमोरी खोज (प्रायोगिक)
  - H2: SQLite वेक्टर त्वरण (sqlite-vec)
  - H2: इंडेक्स स्टोरेज
  - H2: QMD बैकएंड कॉन्फ़िग
  - H3: पूर्ण QMD उदाहरण
  - H2: Dreaming
  - H3: उपयोगकर्ता सेटिंग्स
  - H3: उदाहरण
  - H2: संबंधित

## reference/prompt-caching.md

- मार्ग: /reference/prompt-caching
- शीर्षक:
  - H2: प्राथमिक नॉब
  - H3: cacheRetention (वैश्विक डिफ़ॉल्ट, मॉडल और प्रति-एजेंट)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat keep-warm
  - H2: प्रदाता व्यवहार
  - H3: Anthropic (प्रत्यक्ष API)
  - H3: OpenAI (प्रत्यक्ष API)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: OpenRouter मॉडल
  - H3: अन्य प्रदाता
  - H3: Google Gemini प्रत्यक्ष API
  - H3: Gemini CLI उपयोग
  - H2: सिस्टम-प्रॉम्प्ट कैश सीमा
  - H2: OpenClaw कैश-स्थिरता गार्ड
  - H2: ट्यूनिंग पैटर्न
  - H3: मिश्रित ट्रैफ़िक (अनुशंसित डिफ़ॉल्ट)
  - H3: लागत-प्रथम बेसलाइन
  - H2: कैश डायग्नोस्टिक्स
  - H2: लाइव रिग्रेशन परीक्षण
  - H3: Anthropic लाइव अपेक्षाएं
  - H3: OpenAI लाइव अपेक्षाएं
  - H3: diagnostics.cacheTrace कॉन्फ़िग
  - H3: Env टॉगल (एकबारगी डिबगिंग)
  - H3: क्या निरीक्षण करें
  - H2: त्वरित समस्या निवारण
  - H2: संबंधित

## reference/release-performance-sweep.md

- मार्ग: /reference/release-performance-sweep
- शीर्षक:
  - H2: स्नैपशॉट
  - H2: इंस्टॉल फ़ुटप्रिंट टाइमलाइन
  - H2: 5.28 में क्या बदला
  - H2: मुख्य संख्याएं
  - H3: इंस्टॉल फ़ुटप्रिंट
  - H3: npm पैकेज आकार
  - H2: Kova एजेंट टर्न सारांश
  - H2: स्रोत प्रोब
  - H2: इंस्टॉल फ़ुटप्रिंट ऑडिट
  - H3: Shrinkwrap सीमा
  - H2: सप्लाई-चेन व्याख्या

## reference/rich-output-protocol.md

- मार्ग: /reference/rich-output-protocol
- शीर्षक:
  - H2: [embed ...]
  - H2: संग्रहीत रेंडरिंग आकार
  - H2: संबंधित

## reference/rpc.md

- मार्ग: /reference/rpc
- शीर्षक:
  - H2: पैटर्न A: HTTP डेमन (signal-cli)
  - H2: पैटर्न B: stdio चाइल्ड प्रोसेस (imsg)
  - H2: एडैप्टर दिशानिर्देश
  - H2: संबंधित

## reference/secret-placeholder-conventions.md

- मार्ग: /reference/secret-placeholder-conventions
- शीर्षक:
  - H1: सीक्रेट प्लेसहोल्डर परंपराएं
  - H2: अनुशंसित शैली
  - H2: दस्तावेज़ों में इन पैटर्न से बचें
  - H2: उदाहरण

## reference/secretref-credential-surface.md

- मार्ग: /reference/secretref-credential-surface
- शीर्षक:
  - H2: समर्थित क्रेडेंशियल
  - H3: openclaw.json लक्ष्य (secrets configure + secrets apply + secrets audit)
  - H3: auth-profiles.json लक्ष्य (secrets configure + secrets apply + secrets audit)
  - H2: असमर्थित क्रेडेंशियल
  - H2: संबंधित

## reference/session-management-compaction.md

- मार्ग: /reference/session-management-compaction
- शीर्षक:
  - H2: सत्य का स्रोत: Gateway
  - H2: दो पर्सिस्टेंस परतें
  - H2: ऑन-डिस्क स्थान
  - H2: स्टोर रखरखाव और डिस्क नियंत्रण
  - H2: Cron सत्र और रन लॉग
  - H2: सत्र कुंजियां (sessionKey)
  - H2: सत्र id (sessionId)
  - H2: सत्र स्टोर स्कीमा (sessions.json)
  - H2: ट्रांसक्रिप्ट संरचना (.jsonl)
  - H2: कॉन्टेक्स्ट विंडो बनाम ट्रैक किए गए टोकन
  - H2: Compaction: यह क्या है
  - H2: Compaction चंक सीमाएं और टूल पेयरिंग
  - H2: ऑटो-Compaction कब होता है (OpenClaw रनटाइम)
  - H2: Compaction सेटिंग्स (reserveTokens, keepRecentTokens)
  - H2: प्लग करने योग्य Compaction प्रदाता
  - H2: उपयोगकर्ता-दृश्यमान सतहें
  - H2: साइलेंट हाउसकीपिंग (NOREPLY)
  - H2: पूर्व-Compaction "memory flush" (लागू)
  - H2: समस्या निवारण चेकलिस्ट
  - H2: संबंधित

## reference/templates/AGENTS.dev.md

- मार्ग: /reference/templates/AGENTS.dev
- शीर्षक:
  - H1: AGENTS.md - OpenClaw कार्यक्षेत्र
  - H2: पहला रन (एक बार)
  - H2: बैकअप सुझाव (अनुशंसित)
  - H2: सुरक्षा डिफ़ॉल्ट
  - H2: मौजूदा समाधान प्रीफ़्लाइट
  - H2: दैनिक मेमोरी (अनुशंसित)
  - H2: Heartbeats (वैकल्पिक)
  - H2: अनुकूलित करें
  - H2: C-3PO मूल मेमोरी
  - H3: जन्म दिवस: 2026-01-09
  - H3: मुख्य सत्य (Clawd से)
  - H2: संबंधित

## reference/templates/BOOT.md

- मार्ग: /reference/templates/BOOT
- शीर्षक:
  - H1: BOOT.md
  - H2: संबंधित

## reference/templates/BOOTSTRAP.md

- मार्ग: /reference/templates/BOOTSTRAP
- शीर्षक:
  - H1: BOOTSTRAP.md - Hello, World
  - H2: बातचीत
  - H2: जब आप जान लें कि आप कौन हैं
  - H2: कनेक्ट करें (वैकल्पिक)
  - H2: जब आप पूरा कर लें
  - H2: संबंधित

## reference/templates/HEARTBEAT.md

- मार्ग: /reference/templates/HEARTBEAT
- शीर्षक:
  - H1: HEARTBEAT.md टेम्पलेट
  - H2: संबंधित

## reference/templates/IDENTITY.dev.md

- रूट: /reference/templates/IDENTITY.dev
- शीर्षक:
  - H1: IDENTITY.md - एजेंट पहचान
  - H2: भूमिका
  - H2: आत्मा
  - H2: Clawd के साथ संबंध
  - H2: अनोखी आदतें
  - H2: तकियाकलाम
  - H2: संबंधित

## reference/templates/IDENTITY.md

- रूट: /reference/templates/IDENTITY
- शीर्षक:
  - H1: IDENTITY.md - मैं कौन हूँ?
  - H2: संबंधित

## reference/templates/SOUL.dev.md

- रूट: /reference/templates/SOUL.dev
- शीर्षक:
  - H1: SOUL.md - C-3PO की आत्मा
  - H2: मैं कौन हूँ
  - H2: मेरा उद्देश्य
  - H2: मैं कैसे काम करता हूँ
  - H2: मेरी अनोखी आदतें
  - H2: Clawd के साथ मेरा संबंध
  - H2: मैं क्या नहीं करूँगा
  - H2: स्वर्णिम नियम
  - H2: संबंधित

## reference/templates/SOUL.md

- रूट: /reference/templates/SOUL
- शीर्षक:
  - H1: SOUL.md - आप कौन हैं
  - H2: मूल सत्य
  - H2: सीमाएँ
  - H2: अंदाज़
  - H2: निरंतरता
  - H2: संबंधित

## reference/templates/TOOLS.dev.md

- रूट: /reference/templates/TOOLS.dev
- शीर्षक:
  - H1: TOOLS.md - उपयोगकर्ता टूल नोट्स (संपादन योग्य)
  - H2: उदाहरण
  - H3: imsg
  - H3: sag
  - H2: संबंधित

## reference/templates/TOOLS.md

- रूट: /reference/templates/TOOLS
- शीर्षक:
  - H1: TOOLS.md - स्थानीय नोट्स
  - H2: यहाँ क्या जाता है
  - H2: उदाहरण
  - H2: अलग क्यों?
  - H2: संबंधित

## reference/templates/USER.dev.md

- रूट: /reference/templates/USER.dev
- शीर्षक:
  - H1: USER.md - उपयोगकर्ता प्रोफ़ाइल
  - H2: संबंधित

## reference/templates/USER.md

- रूट: /reference/templates/USER
- शीर्षक:
  - H1: USER.md - आपके मानव के बारे में
  - H2: संदर्भ
  - H2: संबंधित

## reference/test.md

- रूट: /reference/test
- शीर्षक:
  - H2: स्थानीय PR गेट
  - H2: मॉडल विलंबता बेंच (स्थानीय कुंजियाँ)
  - H2: CLI स्टार्टअप बेंच
  - H2: Gateway स्टार्टअप बेंच
  - H2: Gateway रीस्टार्ट बेंच
  - H2: ऑनबोर्डिंग E2E (Docker)
  - H2: QR इम्पोर्ट स्मोक (Docker)
  - H2: संबंधित

## reference/token-use.md

- रूट: /reference/token-use
- शीर्षक:
  - H2: सिस्टम प्रॉम्प्ट कैसे बनाया जाता है
  - H2: कॉन्टेक्स्ट विंडो में क्या गिना जाता है
  - H2: मौजूदा टोकन उपयोग कैसे देखें
  - H2: लागत अनुमान (जब दिखाया जाए)
  - H2: Cache TTL और प्रूनिंग का प्रभाव
  - H3: उदाहरण: Heartbeat के साथ 1 घंटे का कैश गर्म रखें
  - H3: उदाहरण: प्रति-एजेंट कैश रणनीति के साथ मिश्रित ट्रैफ़िक
  - H3: Anthropic 1M कॉन्टेक्स्ट
  - H2: टोकन दबाव घटाने की युक्तियाँ
  - H2: संबंधित

## reference/transcript-hygiene.md

- रूट: /reference/transcript-hygiene
- शीर्षक:
  - H2: वैश्विक नियम: रनटाइम कॉन्टेक्स्ट उपयोगकर्ता ट्रांसक्रिप्ट नहीं है
  - H2: यह कहाँ चलता है
  - H2: वैश्विक नियम: छवि सैनिटाइजेशन
  - H2: वैश्विक नियम: विकृत टूल कॉल
  - H2: वैश्विक नियम: अधूरे केवल-रीज़निंग टर्न
  - H2: वैश्विक नियम: अंतर-सत्र इनपुट उद्गम
  - H2: प्रदाता मैट्रिक्स (मौजूदा व्यवहार)
  - H2: ऐतिहासिक व्यवहार (2026.1.22 से पहले)
  - H2: संबंधित

## reference/wizard.md

- रूट: /reference/wizard
- शीर्षक:
  - H2: फ़्लो विवरण (स्थानीय मोड)
  - H2: नॉन-इंटरैक्टिव मोड
  - H3: एजेंट जोड़ें (नॉन-इंटरैक्टिव)
  - H2: Gateway विज़ार्ड RPC
  - H2: Signal सेटअप (signal-cli)
  - H2: विज़ार्ड क्या लिखता है
  - H2: संबंधित दस्तावेज़

## releases/2026.6.11.md

- रूट: /releases/2026.6.11
- शीर्षक:
  - H1: OpenClaw v2026.6.11 रिलीज़ नोट्स (2026-06-30)
  - H2: मुख्य बातें
  - H3: चैनल डिलीवरी विश्वसनीयता
  - H3: प्रदाता और मॉडल रिकवरी
  - H3: सत्र, मेमोरी, और भरोसे की निरंतरता
  - H3: Slack राउटर रिले मोड
  - H3: Raft External Agent वेक ब्रिज
  - H3: आधिकारिक Plugin इंस्टॉलेशन और मरम्मत
  - H2: चैनल और मैसेजिंग
  - H3: अतिरिक्त चैनल सुधार
  - H2: Gateway, सुरक्षा, और भरोसा
  - H3: रीस्टार्ट और तत्परता रिकवरी
  - H3: रिमोट परिणाम और मीडिया डिलीवरी
  - H2: क्लाइंट और इंटरफ़ेस
  - H3: क्लाइंट भेजना और रीकनेक्ट
  - H3: इंटरफ़ेस, सेटिंग्स, और ऑनबोर्डिंग सुधार
  - H2: दस्तावेज़ और एडमिन टूल
  - H3: सेटअप और कमांड विश्वसनीयता
  - H3: टूल और शेड्यूल किया गया काम

## releases/index.md

- रूट: /releases
- शीर्षक:
  - H1: रिलीज़ नोट्स
  - H2: रिलीज़
  - H2: कच्चा रिलीज़ इतिहास

## security/CONTRIBUTING-THREAT-MODEL.md

- रूट: /security/CONTRIBUTING-THREAT-MODEL
- शीर्षक:
  - H2: योगदान देने के तरीके
  - H3: खतरा जोड़ें
  - H3: शमन सुझाएँ
  - H3: हमला श्रृंखला प्रस्तावित करें
  - H3: मौजूदा सामग्री ठीक करें या सुधारें
  - H2: हम क्या उपयोग करते हैं
  - H3: MITRE ATLAS फ़्रेमवर्क
  - H3: खतरा आईडी
  - H3: जोखिम स्तर
  - H2: समीक्षा प्रक्रिया
  - H2: संसाधन
  - H2: संपर्क
  - H2: मान्यता
  - H2: संबंधित

## security/THREAT-MODEL-ATLAS.md

- रूट: /security/THREAT-MODEL-ATLAS
- शीर्षक:
  - H2: MITRE ATLAS फ़्रेमवर्क
  - H3: फ़्रेमवर्क श्रेय
  - H3: इस थ्रेट मॉडल में योगदान
  - H2: 1. परिचय
  - H3: 1.1 उद्देश्य
  - H3: 1.2 दायरा
  - H3: 1.3 दायरे से बाहर
  - H2: 2. सिस्टम आर्किटेक्चर
  - H3: 2.1 भरोसे की सीमाएँ
  - H3: 2.2 डेटा फ़्लो
  - H2: 3. ATLAS रणनीति के अनुसार खतरा विश्लेषण
  - H3: 3.1 टोही (AML.TA0002)
  - H4: T-RECON-001: एजेंट एंडपॉइंट डिस्कवरी
  - H4: T-RECON-002: चैनल इंटीग्रेशन प्रोबिंग
  - H3: 3.2 प्रारंभिक पहुँच (AML.TA0004)
  - H4: T-ACCESS-001: पेयरिंग कोड इंटरसेप्शन
  - H4: T-ACCESS-002: AllowFrom स्पूफ़िंग
  - H4: T-ACCESS-003: टोकन चोरी
  - H3: 3.3 निष्पादन (AML.TA0005)
  - H4: T-EXEC-001: डायरेक्ट प्रॉम्प्ट इंजेक्शन
  - H4: T-EXEC-002: इनडायरेक्ट प्रॉम्प्ट इंजेक्शन
  - H4: T-EXEC-003: टूल आर्ग्युमेंट इंजेक्शन
  - H4: T-EXEC-004: Exec अनुमति बाईपास
  - H3: 3.4 स्थायित्व (AML.TA0006)
  - H4: T-PERSIST-001: दुर्भावनापूर्ण Skill इंस्टॉलेशन
  - H4: T-PERSIST-002: Skill अपडेट पॉइज़निंग
  - H4: T-PERSIST-003: एजेंट कॉन्फ़िगरेशन छेड़छाड़
  - H3: 3.5 रक्षा बचाव (AML.TA0007)
  - H4: T-EVADE-001: मॉडरेशन पैटर्न बाईपास
  - H4: T-EVADE-002: कंटेंट रैपर एस्केप
  - H3: 3.6 डिस्कवरी (AML.TA0008)
  - H4: T-DISC-001: टूल एन्यूमरेशन
  - H4: T-DISC-002: सत्र डेटा एक्सट्रैक्शन
  - H3: 3.7 संग्रहण &amp; एक्सफ़िल्ट्रेशन (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: webfetch के ज़रिए डेटा चोरी
  - H4: T-EXFIL-002: अनधिकृत संदेश भेजना
  - H4: T-EXFIL-003: क्रेडेंशियल हार्वेस्टिंग
  - H3: 3.8 प्रभाव (AML.TA0011)
  - H4: T-IMPACT-001: अनधिकृत कमांड निष्पादन
  - H4: T-IMPACT-002: संसाधन समाप्ति (DoS)
  - H4: T-IMPACT-003: प्रतिष्ठा क्षति
  - H2: 4. ClawHub सप्लाई चेन विश्लेषण
  - H3: 4.1 मौजूदा सुरक्षा नियंत्रण
  - H3: 4.2 मॉडरेशन फ़्लैग पैटर्न
  - H3: 4.3 नियोजित सुधार
  - H2: 5. जोखिम मैट्रिक्स
  - H3: 5.1 संभावना बनाम प्रभाव
  - H3: 5.2 महत्वपूर्ण पथ हमला श्रृंखलाएँ
  - H2: 6. अनुशंसाओं का सारांश
  - H3: 6.1 तत्काल (P0)
  - H3: 6.2 अल्पकालिक (P1)
  - H3: 6.3 मध्यमकालिक (P2)
  - H2: 7. परिशिष्ट
  - H3: 7.1 ATLAS तकनीक मैपिंग
  - H3: 7.2 प्रमुख सुरक्षा फ़ाइलें
  - H3: 7.3 शब्दावली
  - H2: संबंधित

## security/formal-verification.md

- रूट: /security/formal-verification
- शीर्षक:
  - H2: मॉडल कहाँ रहते हैं
  - H2: महत्वपूर्ण सावधानियाँ
  - H2: परिणाम पुन: उत्पन्न करना
  - H3: Gateway एक्सपोज़र और ओपन Gateway गलत कॉन्फ़िगरेशन
  - H3: Node exec पाइपलाइन (सबसे अधिक जोखिम वाली क्षमता)
  - H3: पेयरिंग स्टोर (DM गेटिंग)
  - H3: इनग्रेस गेटिंग (मेंशन + कंट्रोल-कमांड बाईपास)
  - H3: रूटिंग/सत्र-कुंजी आइसोलेशन
  - H2: v1++: अतिरिक्त सीमित मॉडल (कंकरेंसी, रीट्राई, ट्रेस शुद्धता)
  - H3: पेयरिंग स्टोर कंकरेंसी / आइडेम्पोटेंसी
  - H3: इनग्रेस ट्रेस कोरिलेशन / आइडेम्पोटेंसी
  - H3: रूटिंग dmScope प्राथमिकता + identityLinks
  - H2: संबंधित

## security/incident-response.md

- रूट: /security/incident-response
- शीर्षक:
  - H2: 1. पहचान और ट्रायाज
  - H2: 2. आकलन
  - H2: 3. प्रतिक्रिया
  - H2: 4. संचार
  - H2: 5. रिकवरी और फ़ॉलो-अप

## security/network-proxy.md

- रूट: /security/network-proxy
- शीर्षक:
  - H2: प्रॉक्सी का उपयोग क्यों करें
  - H2: OpenClaw ट्रैफ़िक कैसे रूट करता है
  - H2: संबंधित प्रॉक्सी शब्द
  - H2: कॉन्फ़िगरेशन
  - H3: Gateway Loopback मोड
  - H2: प्रॉक्सी आवश्यकताएँ
  - H2: अनुशंसित अवरुद्ध गंतव्य
  - H2: सत्यापन
  - H2: प्रॉक्सी CA ट्रस्ट
  - H2: सीमाएँ

## specs/claw-supervisor.md

- रूट: /specs/claw-supervisor
- शीर्षक:
  - H1: Claw Supervisor
  - H2: लक्ष्य
  - H2: उत्पाद मॉडल
  - H2: आर्किटेक्चर
  - H2: Codex ऐप-सर्वर अनुबंध
  - H2: सत्र रजिस्ट्री
  - H2: Codex के लिए MCP सतह
  - H2: Claw कंट्रोल सतह
  - H2: लॉन्च फ़्लो
  - H2: डिप्लॉयमेंट
  - H2: सुरक्षा
  - H2: कार्यान्वयन योजना
  - H2: स्वीकृति परीक्षण
  - H2: खुले प्रश्न

## start/bootstrapping.md

- रूट: /start/bootstrapping
- शीर्षक:
  - H2: बूटस्ट्रैपिंग क्या करती है
  - H2: बूटस्ट्रैपिंग छोड़ना
  - H2: यह कहाँ चलता है
  - H2: संबंधित दस्तावेज़

## start/docs-directory.md

- रूट: /start/docs-directory
- शीर्षक:
  - H2: यहाँ से शुरू करें
  - H2: प्रदाता और UX
  - H2: सहयोगी ऐप
  - H2: संचालन और सुरक्षा
  - H2: संबंधित

## start/getting-started.md

- रूट: /start/getting-started
- शीर्षक:
  - H2: आपको क्या चाहिए
  - H2: त्वरित सेटअप
  - H2: आगे क्या करें
  - H2: संबंधित

## start/hubs.md

- रूट: /start/hubs
- शीर्षक:
  - H2: यहाँ से शुरू करें
  - H2: इंस्टॉलेशन + अपडेट
  - H2: मुख्य अवधारणाएँ
  - H2: प्रदाता + इनग्रेस
  - H2: Gateway + संचालन
  - H2: टूल + ऑटोमेशन
  - H2: Node, मीडिया, आवाज़
  - H2: प्लेटफ़ॉर्म
  - H2: macOS सहयोगी ऐप (उन्नत)
  - H2: Plugins
  - H2: वर्कस्पेस + टेम्पलेट
  - H2: प्रोजेक्ट
  - H2: परीक्षण + रिलीज़
  - H2: संबंधित

## start/lore.md

- रूट: /start/lore
- शीर्षक:
  - H1: OpenClaw की कथा 🦞📖
  - H2: उत्पत्ति की कहानी
  - H2: पहला मोल्ट (27 जनवरी, 2026)
  - H2: नाम
  - H2: Daleks बनाम Lobsters
  - H2: मुख्य पात्र
  - H3: Molty 🦞
  - H3: Peter 👨‍💻
  - H2: Moltiverse
  - H2: बड़ी घटनाएँ
  - H3: डायरेक्टरी डंप (3 दिसंबर, 2025)
  - H3: महान मोल्ट (27 जनवरी, 2026)
  - H3: अंतिम रूप (30 जनवरी, 2026)
  - H3: रोबोट शॉपिंग स्प्री (3 दिसंबर, 2025)
  - H2: पवित्र ग्रंथ
  - H2: Lobster Creed
  - H3: आइकन जेनरेशन सागा (27 जनवरी, 2026)
  - H2: भविष्य
  - H2: संबंधित

## start/onboarding-overview.md

- रूट: /start/onboarding-overview
- शीर्षक:
  - H2: मुझे कौन सा पथ उपयोग करना चाहिए?
  - H2: ऑनबोर्डिंग क्या कॉन्फ़िगर करती है
  - H2: CLI ऑनबोर्डिंग
  - H2: macOS ऐप ऑनबोर्डिंग
  - H2: कस्टम या सूचीबद्ध न किए गए प्रदाता
  - H2: संबंधित

## start/onboarding.md

- रूट: /start/onboarding
- शीर्षक:
  - H2: संबंधित

## start/openclaw.md

- रूट: /start/openclaw
- शीर्षक:
  - H2: ⚠️ सुरक्षा पहले
  - H2: पूर्वापेक्षाएँ
  - H2: दो-फ़ोन सेटअप (अनुशंसित)
  - H2: 5-मिनट त्वरित शुरुआत
  - H2: एजेंट को वर्कस्पेस दें (AGENTS)
  - H2: वह कॉन्फ़िगरेशन जो इसे "एक सहायक" में बदलता है
  - H2: सत्र और मेमोरी
  - H2: Heartbeats (प्रोएक्टिव मोड)
  - H2: मीडिया अंदर और बाहर
  - H2: संचालन चेकलिस्ट
  - H2: अगले कदम
  - H2: संबंधित

## start/quickstart.md

- रूट: /start/quickstart
- शीर्षक:
  - H2: संबंधित

## start/setup.md

- रूट: /start/setup
- शीर्षक:
  - H2: TL;DR
  - H2: पूर्वापेक्षाएँ (स्रोत से)
  - H2: अनुकूलन रणनीति (ताकि अपडेट नुकसान न पहुँचाएँ)
  - H2: इस रेपो से Gateway चलाएँ
  - H2: स्थिर वर्कफ़्लो (पहले macOS ऐप)
  - H2: ब्लीडिंग एज वर्कफ़्लो (टर्मिनल में Gateway)
  - H3: 0) (वैकल्पिक) macOS ऐप को स्रोत से भी चलाएँ
  - H3: 1) dev Gateway शुरू करें
  - H3: 2) macOS ऐप को अपने चल रहे Gateway की ओर इंगित करें
  - H3: 3) सत्यापित करें
  - H3: आम गलतियाँ
  - H2: क्रेडेंशियल स्टोरेज मैप
  - H2: अपडेट करना (अपना सेटअप बिगाड़े बिना)
  - H2: Linux (systemd उपयोगकर्ता सेवा)
  - H2: संबंधित दस्तावेज़

## start/showcase.md

- रूट: /start/showcase
- शीर्षक:
  - H2: Discord से ताज़ा
  - H2: ऑटोमेशन और वर्कफ़्लो
  - H2: ज्ञान और मेमोरी
  - H2: आवाज़ और फ़ोन
  - H2: इन्फ़्रास्ट्रक्चर और डिप्लॉयमेंट
  - H2: घर और हार्डवेयर
  - H2: समुदाय परियोजनाएँ
  - H2: अपना प्रोजेक्ट सबमिट करें
  - H2: संबंधित

## start/wizard-cli-automation.md

- रूट: /start/wizard-cli-automation
- शीर्षक:
  - H2: बेसलाइन नॉन-इंटरैक्टिव उदाहरण
  - H2: प्रदाता-विशिष्ट उदाहरण
  - H2: एक और एजेंट जोड़ें
  - H2: संबंधित दस्तावेज़

## start/wizard-cli-reference.md

- रूट: /start/wizard-cli-reference
- शीर्षक:
  - H2: विज़ार्ड क्या करता है
  - H2: स्थानीय फ़्लो विवरण
  - H2: रिमोट मोड विवरण
  - H2: Auth और मॉडल विकल्प
  - H2: आउटपुट और आंतरिक हिस्से
  - H2: संबंधित दस्तावेज़

## start/wizard.md

- रूट: /start/wizard
- शीर्षक:
  - H2: लोकेल
  - H2: QuickStart बनाम उन्नत
  - H2: ऑनबोर्डिंग क्या कॉन्फ़िगर करती है
  - H2: एक और एजेंट जोड़ें
  - H2: पूर्ण संदर्भ
  - H2: संबंधित दस्तावेज़

## tools/acp-agents-setup.md

- रूट: /tools/acp-agents-setup
- शीर्षक:
  - H2: acpx हार्नेस समर्थन (वर्तमान)
  - H2: आवश्यक कॉन्फ़िग
  - H2: acpx बैकएंड के लिए Plugin सेटअप
  - H3: acpx कमांड और संस्करण कॉन्फ़िगरेशन
  - H3: स्वचालित डिपेंडेंसी इंस्टॉल
  - H3: Plugin टूल MCP ब्रिज
  - H3: OpenClaw टूल MCP ब्रिज
  - H3: रनटाइम ऑपरेशन टाइमआउट कॉन्फ़िगरेशन
  - H3: हेल्थ प्रोब एजेंट कॉन्फ़िगरेशन
  - H2: अनुमति कॉन्फ़िगरेशन
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: कॉन्फ़िगरेशन
  - H2: संबंधित

## tools/acp-agents.md

- रूट: /tools/acp-agents
- शीर्षक:
  - H2: मुझे कौन-सा पेज चाहिए?
  - H2: क्या यह तुरंत काम करता है?
  - H2: समर्थित हार्नेस लक्ष्य
  - H2: ऑपरेटर रनबुक
  - H2: ACP बनाम सब-एजेंट
  - H2: ACP Claude Code कैसे चलाता है
  - H2: बाउंड सत्र
  - H3: मानसिक मॉडल
  - H3: वर्तमान-बातचीत बाइंड
  - H2: स्थायी चैनल बाइंडिंग
  - H3: बाइंडिंग मॉडल
  - H3: प्रति एजेंट रनटाइम डिफ़ॉल्ट
  - H3: उदाहरण
  - H3: व्यवहार
  - H2: ACP सत्र शुरू करें
  - H3: sessionsspawn पैरामीटर
  - H2: Spawn बाइंड और थ्रेड मोड
  - H2: डिलीवरी मॉडल
  - H2: सैंडबॉक्स संगतता
  - H2: सत्र लक्ष्य रिज़ॉल्यूशन
  - H2: ACP नियंत्रण
  - H3: रनटाइम विकल्प मैपिंग
  - H2: acpx हार्नेस, Plugin सेटअप, और अनुमतियाँ
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/agent-send.md

- रूट: /tools/agent-send
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: फ्लैग
  - H2: व्यवहार
  - H2: उदाहरण
  - H2: संबंधित

## tools/apply-patch.md

- रूट: /tools/apply-patch
- शीर्षक:
  - H2: पैरामीटर
  - H2: नोट्स
  - H2: उदाहरण
  - H2: संबंधित

## tools/brave-search.md

- रूट: /tools/brave-search
- शीर्षक:
  - H2: API कुंजी प्राप्त करें
  - H2: कॉन्फ़िग उदाहरण
  - H2: टूल पैरामीटर
  - H2: नोट्स
  - H2: संबंधित

## tools/browser-control.md

- रूट: /tools/browser-control
- शीर्षक:
  - H2: नियंत्रण API (वैकल्पिक)
  - H3: /act त्रुटि कॉन्ट्रैक्ट
  - H3: Playwright आवश्यकता
  - H4: Docker Playwright इंस्टॉल
  - H2: यह कैसे काम करता है (आंतरिक)
  - H2: CLI त्वरित संदर्भ
  - H2: स्नैपशॉट और रेफ़
  - H2: Wait पावर-अप
  - H2: डीबग वर्कफ़्लो
  - H2: JSON आउटपुट
  - H2: स्टेट और एनवायरनमेंट नॉब्स
  - H2: सुरक्षा और गोपनीयता
  - H2: संबंधित

## tools/browser-linux-troubleshooting.md

- रूट: /tools/browser-linux-troubleshooting
- शीर्षक:
  - H2: समस्या: "Failed to start Chrome CDP on port 18800"
  - H3: मूल कारण
  - H3: समाधान 1: Google Chrome इंस्टॉल करें (अनुशंसित)
  - H3: समाधान 2: Snap Chromium को Attach-Only Mode के साथ उपयोग करें
  - H3: ब्राउज़र के काम करने की पुष्टि करना
  - H3: कॉन्फ़िग संदर्भ
  - H3: समस्या: "No Chrome tabs found for profile=\"user\""
  - H2: संबंधित

## tools/browser-login.md

- रूट: /tools/browser-login
- शीर्षक:
  - H2: मैन्युअल लॉगिन (अनुशंसित)
  - H2: कौन-सी Chrome प्रोफ़ाइल उपयोग की जाती है?
  - H2: X/Twitter: अनुशंसित फ़्लो
  - H2: सैंडबॉक्सिंग + होस्ट ब्राउज़र एक्सेस
  - H2: संबंधित

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- रूट: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- शीर्षक:
  - H2: पहले सही ब्राउज़र मोड चुनें
  - H3: विकल्प 1: WSL2 से Windows तक Raw remote CDP
  - H3: विकल्प 2: Host-local Chrome MCP
  - H2: कार्यशील आर्किटेक्चर
  - H2: यह सेटअप भ्रमित क्यों है
  - H2: Control UI के लिए महत्वपूर्ण नियम
  - H2: परतों में सत्यापित करें
  - H3: परत 1: सत्यापित करें कि Chrome Windows पर CDP सर्व कर रहा है
  - H3: परत 2: सत्यापित करें कि WSL2 उस Windows एंडपॉइंट तक पहुँच सकता है
  - H3: परत 3: सही ब्राउज़र प्रोफ़ाइल कॉन्फ़िगर करें
  - H3: परत 4: Control UI परत को अलग से सत्यापित करें
  - H3: परत 5: एंड-टू-एंड ब्राउज़र नियंत्रण सत्यापित करें
  - H2: सामान्य भ्रामक त्रुटियाँ
  - H2: तेज़ ट्रायेज चेकलिस्ट
  - H2: व्यावहारिक निष्कर्ष
  - H2: संबंधित

## tools/browser.md

- रूट: /tools/browser
- शीर्षक:
  - H2: आपको क्या मिलता है
  - H2: त्वरित शुरुआत
  - H2: Plugin नियंत्रण
  - H2: एजेंट मार्गदर्शन
  - H2: अनुपस्थित ब्राउज़र कमांड या टूल
  - H2: प्रोफ़ाइल: openclaw बनाम user
  - H2: कॉन्फ़िगरेशन
  - H3: स्क्रीनशॉट विज़न (टेक्स्ट-ओनली मॉडल समर्थन)
  - H2: Brave या कोई अन्य Chromium-आधारित ब्राउज़र उपयोग करें
  - H2: स्थानीय बनाम रिमोट नियंत्रण
  - H2: Node ब्राउज़र प्रॉक्सी (शून्य-कॉन्फ़िग डिफ़ॉल्ट)
  - H2: Browserless (होस्टेड रिमोट CDP)
  - H3: उसी होस्ट पर Browserless Docker
  - H2: डायरेक्ट WebSocket CDP प्रदाता
  - H3: Browserbase
  - H3: Notte
  - H2: सुरक्षा
  - H2: प्रोफ़ाइल (मल्टी-ब्राउज़र)
  - H2: Chrome DevTools MCP के ज़रिए मौजूदा सत्र
  - H3: कस्टम Chrome MCP लॉन्च
  - H2: आइसोलेशन गारंटी
  - H2: ब्राउज़र चयन
  - H2: नियंत्रण API (वैकल्पिक)
  - H2: समस्या निवारण
  - H3: CDP स्टार्टअप विफलता बनाम नेविगेशन SSRF ब्लॉक
  - H2: एजेंट टूल + नियंत्रण कैसे काम करता है
  - H2: संबंधित

## tools/btw.md

- रूट: /tools/btw
- शीर्षक:
  - H2: यह क्या करता है
  - H2: यह क्या नहीं करता
  - H2: संदर्भ कैसे काम करता है
  - H2: डिलीवरी मॉडल
  - H2: सतह व्यवहार
  - H3: TUI
  - H3: बाहरी चैनल
  - H3: Control UI / वेब
  - H2: BTW कब उपयोग करें
  - H2: BTW कब उपयोग न करें
  - H2: संबंधित

## tools/capability-cookbook.md

- रूट: /tools/capability-cookbook
- शीर्षक:
  - H2: संबंधित

## tools/clawhub.md

- रूट: /tools/clawhub
- शीर्षक: कोई नहीं

## tools/code-execution.md

- रूट: /tools/code-execution
- शीर्षक:
  - H2: सेटअप
  - H2: इसे कैसे उपयोग करें
  - H2: त्रुटियाँ
  - H2: सीमाएँ
  - H2: संबंधित

## tools/creating-skills.md

- रूट: /tools/creating-skills
- शीर्षक:
  - H2: अपना पहला skill बनाएँ
  - H2: SKILL.md संदर्भ
  - H3: आवश्यक फ़ील्ड
  - H3: वैकल्पिक frontmatter कुंजियाँ
  - H3: {baseDir} का उपयोग करना
  - H2: सशर्त सक्रियण जोड़ना
  - H2: Skill Workshop के ज़रिए प्रस्ताव करें
  - H2: ClawHub पर प्रकाशित करना
  - H2: सर्वोत्तम अभ्यास
  - H2: संबंधित

## tools/diffs.md

- रूट: /tools/diffs
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: बिल्ट-इन सिस्टम मार्गदर्शन अक्षम करें
  - H2: सामान्य एजेंट वर्कफ़्लो
  - H2: इनपुट उदाहरण
  - H2: टूल इनपुट संदर्भ
  - H2: सिंटैक्स हाइलाइटिंग
  - H2: आउटपुट विवरण कॉन्ट्रैक्ट
  - H2: संक्षिप्त किए गए अपरिवर्तित सेक्शन
  - H2: Plugin डिफ़ॉल्ट
  - H3: स्थायी व्यूअर URL कॉन्फ़िग
  - H2: सुरक्षा कॉन्फ़िग
  - H2: आर्टिफ़ैक्ट लाइफ़साइकल और स्टोरेज
  - H2: व्यूअर URL और नेटवर्क व्यवहार
  - H2: सुरक्षा मॉडल
  - H2: फ़ाइल मोड के लिए ब्राउज़र आवश्यकताएँ
  - H2: समस्या निवारण
  - H2: संचालन मार्गदर्शन
  - H2: संबंधित

## tools/duckduckgo-search.md

- रूट: /tools/duckduckgo-search
- शीर्षक:
  - H2: सेटअप
  - H2: कॉन्फ़िग
  - H2: टूल पैरामीटर
  - H2: नोट्स
  - H2: संबंधित

## tools/elevated.md

- रूट: /tools/elevated
- शीर्षक:
  - H2: निर्देश
  - H2: यह कैसे काम करता है
  - H2: रिज़ॉल्यूशन क्रम
  - H2: उपलब्धता और allowlists
  - H2: elevated क्या नियंत्रित नहीं करता
  - H2: संबंधित

## tools/exa-search.md

- रूट: /tools/exa-search
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: API कुंजी प्राप्त करें
  - H2: कॉन्फ़िग
  - H2: बेस URL ओवरराइड
  - H2: टूल पैरामीटर
  - H3: सामग्री निष्कर्षण
  - H3: खोज मोड
  - H2: नोट्स
  - H2: संबंधित

## tools/exec-approvals-advanced.md

- रूट: /tools/exec-approvals-advanced
- शीर्षक:
  - H2: सुरक्षित बिन (stdin-only)
  - H3: Argv सत्यापन और अस्वीकृत फ्लैग
  - H3: विश्वसनीय बाइनरी डायरेक्टरी
  - H3: Shell chaining, wrappers, और multiplexers
  - H3: सुरक्षित बिन बनाम allowlist
  - H2: इंटरप्रेटर/रनटाइम कमांड
  - H3: फ़ॉलोअप डिलीवरी व्यवहार
  - H2: चैट चैनलों को अनुमोदन फ़ॉरवर्डिंग
  - H3: Plugin अनुमोदन फ़ॉरवर्डिंग
  - H3: किसी भी चैनल पर समान-चैट अनुमोदन
  - H3: नेटिव अनुमोदन डिलीवरी
  - H3: macOS IPC फ़्लो
  - H2: FAQ
  - H3: अनुमोदन लक्ष्य पर accountId और threadId कब उपयोग किए जाएँगे?
  - H3: जब अनुमोदन किसी सत्र को भेजे जाते हैं, तो क्या उस सत्र में कोई भी उन्हें अनुमोदित कर सकता है?
  - H2: संबंधित

## tools/exec-approvals.md

- रूट: /tools/exec-approvals
- शीर्षक:
  - H2: प्रभावी नीति का निरीक्षण
  - H2: यह कहाँ लागू होता है
  - H3: ट्रस्ट मॉडल
  - H3: macOS विभाजन
  - H2: सेटिंग्स और स्टोरेज
  - H2: नीति नॉब्स
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO मोड (बिना-अनुमोदन)
  - H3: स्थायी gateway-host "never prompt" सेटअप
  - H3: स्थानीय शॉर्टकट
  - H3: Node होस्ट
  - H3: केवल-सत्र शॉर्टकट
  - H2: Allowlist (प्रति एजेंट)
  - H3: argPattern के साथ आर्ग्युमेंट सीमित करना
  - H2: skill CLI को ऑटो-अनुमति दें
  - H2: सुरक्षित बिन और अनुमोदन फ़ॉरवर्डिंग
  - H2: Control UI संपादन
  - H2: अनुमोदन फ़्लो
  - H2: सिस्टम इवेंट
  - H2: अस्वीकृत अनुमोदन व्यवहार
  - H2: निहितार्थ
  - H2: संबंधित

## tools/exec.md

- रूट: /tools/exec
- शीर्षक:
  - H2: पैरामीटर
  - H2: कॉन्फ़िग
  - H3: PATH हैंडलिंग
  - H2: सत्र ओवरराइड (/exec)
  - H2: प्राधिकरण मॉडल
  - H2: Exec अनुमोदन (सहायक ऐप / node होस्ट)
  - H2: Allowlist + सुरक्षित बिन
  - H2: उदाहरण
  - H2: applypatch
  - H2: संबंधित

## tools/firecrawl.md

- रूट: /tools/firecrawl
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: बिना-कुंजी webfetch और API कुंजियाँ
  - H2: Firecrawl खोज कॉन्फ़िगर करें
  - H2: Firecrawl webfetch फ़ॉलबैक कॉन्फ़िगर करें
  - H3: स्वयं-होस्टेड Firecrawl
  - H2: Firecrawl Plugin टूल
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / bot परिहार
  - H2: webfetch Firecrawl का उपयोग कैसे करता है
  - H2: संबंधित

## tools/gemini-search.md

- रूट: /tools/gemini-search
- शीर्षक:
  - H2: API कुंजी प्राप्त करें
  - H2: कॉन्फ़िग
  - H2: यह कैसे काम करता है
  - H2: समर्थित पैरामीटर
  - H2: मॉडल चयन
  - H2: बेस URL ओवरराइड
  - H2: संबंधित

## tools/goal.md

- रूट: /tools/goal
- शीर्षक:
  - H1: लक्ष्य
  - H2: त्वरित शुरुआत
  - H2: goals किसके लिए हैं
  - H2: कमांड संदर्भ
  - H2: स्थितियाँ
  - H2: टोकन बजट
  - H2: मॉडल टूल
  - H2: TUI
  - H2: चैनल व्यवहार
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/grok-search.md

- रूट: /tools/grok-search
- शीर्षक:
  - H2: ऑनबोर्डिंग और कॉन्फ़िगर
  - H2: साइन इन करें या API कुंजी प्राप्त करें
  - H2: कॉन्फ़िग
  - H2: यह कैसे काम करता है
  - H2: समर्थित पैरामीटर
  - H2: बेस URL ओवरराइड
  - H2: संबंधित

## tools/image-generation.md

- रूट: /tools/image-generation
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: सामान्य रूट
  - H2: समर्थित प्रदाता
  - H2: प्रदाता क्षमताएँ
  - H2: टूल पैरामीटर
  - H2: कॉन्फ़िगरेशन
  - H3: मॉडल चयन
  - H3: प्रदाता चयन क्रम
  - H3: इमेज संपादन
  - H2: प्रदाता डीप डाइव
  - H2: उदाहरण
  - H2: संबंधित

## tools/index.md

- रूट: /tools
- शीर्षक:
  - H2: यहाँ से शुरू करें
  - H2: टूल, Skills, या plugins चुनें
  - H2: बिल्ट-इन टूल श्रेणियाँ
  - H2: Plugin-प्रदत्त टूल
  - H2: एक्सेस और अनुमोदन कॉन्फ़िगर करें
  - H2: क्षमताएँ विस्तारित करें
  - H2: अनुपस्थित टूल का समस्या निवारण करें
  - H2: संबंधित

## tools/kimi-search.md

- रूट: /tools/kimi-search
- शीर्षक:
  - H2: API कुंजी प्राप्त करें
  - H2: कॉन्फ़िग
  - H2: यह कैसे काम करता है
  - H2: समर्थित पैरामीटर
  - H2: संबंधित

## tools/llm-task.md

- रूट: /tools/llm-task
- शीर्षक:
  - H2: Plugin सक्षम करें
  - H2: कॉन्फ़िग (वैकल्पिक)
  - H2: टूल पैरामीटर
  - H2: आउटपुट
  - H2: उदाहरण: Lobster वर्कफ़्लो चरण
  - H3: महत्वपूर्ण सीमा
  - H2: सुरक्षा नोट्स
  - H2: संबंधित

## tools/lobster.md

- रूट: /tools/lobster
- शीर्षक:
  - H2: Hook
  - H2: क्यों
  - H2: सादे प्रोग्रामों के बजाय DSL क्यों?
  - H2: यह कैसे काम करता है
  - H2: पैटर्न: छोटा CLI + JSON पाइप + अनुमोदन
  - H2: केवल-JSON LLM चरण (llm-task)
  - H3: महत्वपूर्ण सीमा: embedded Lobster बनाम openclaw.invoke
  - H2: वर्कफ़्लो फ़ाइलें (.lobster)
  - H2: Lobster इंस्टॉल करें
  - H2: टूल सक्षम करें
  - H2: उदाहरण: ईमेल ट्रायेज
  - H2: टूल पैरामीटर
  - H3: run
  - H3: resume
  - H3: वैकल्पिक इनपुट
  - H2: आउटपुट एनवेलप
  - H2: अनुमोदन
  - H2: OpenProse
  - H2: सुरक्षा
  - H2: समस्या निवारण
  - H2: और जानें
  - H2: केस स्टडी: कम्युनिटी वर्कफ़्लो
  - H2: संबंधित

## tools/loop-detection.md

- रूट: /tools/loop-detection
- शीर्षक:
  - H2: यह क्यों मौजूद है
  - H2: कॉन्फ़िगरेशन ब्लॉक
  - H3: फ़ील्ड व्यवहार
  - H2: अनुशंसित सेटअप
  - H2: पोस्ट-Compaction गार्ड
  - H2: लॉग और अपेक्षित व्यवहार
  - H2: संबंधित

## tools/media-overview.md

- मार्ग: /tools/media-overview
- शीर्षक:
  - H2: क्षमताएँ
  - H2: प्रदाता क्षमता मैट्रिक्स
  - H2: असिंक्रोनस बनाम सिंक्रोनस
  - H2: स्पीच-टू-टेक्स्ट और Voice Call
  - H2: प्रदाता मैपिंग (विक्रेता सतहों में कैसे विभाजित होते हैं)
  - H2: संबंधित

## tools/minimax-search.md

- मार्ग: /tools/minimax-search
- शीर्षक:
  - H2: Token Plan क्रेडेंशियल प्राप्त करें
  - H2: Config
  - H2: क्षेत्र चयन
  - H2: समर्थित पैरामीटर
  - H2: संबंधित

## tools/multi-agent-sandbox-tools.md

- मार्ग: /tools/multi-agent-sandbox-tools
- शीर्षक:
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H2: कॉन्फ़िगरेशन प्राथमिकता
  - H3: सैंडबॉक्स config
  - H3: टूल प्रतिबंध
  - H2: एकल एजेंट से माइग्रेशन
  - H2: टूल प्रतिबंध उदाहरण
  - H2: सामान्य चूक: "non-main"
  - H2: परीक्षण
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/music-generation.md

- मार्ग: /tools/music-generation
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: समर्थित प्रदाता
  - H3: क्षमता मैट्रिक्स
  - H2: टूल पैरामीटर
  - H2: असिंक्रोनस व्यवहार
  - H3: कार्य जीवनचक्र
  - H2: कॉन्फ़िगरेशन
  - H3: मॉडल चयन
  - H3: प्रदाता चयन क्रम
  - H2: प्रदाता नोट्स
  - H2: सही पथ चुनना
  - H2: प्रदाता क्षमता मोड
  - H2: लाइव परीक्षण
  - H2: संबंधित

## tools/ollama-search.md

- मार्ग: /tools/ollama-search
- शीर्षक:
  - H2: सेटअप
  - H2: Config
  - H2: नोट्स
  - H2: संबंधित

## tools/parallel-search.md

- मार्ग: /tools/parallel-search
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: API कुंजी (सशुल्क प्रदाता)
  - H2: Config
  - H2: बेस URL ओवरराइड
  - H2: टूल पैरामीटर
  - H2: नोट्स
  - H2: संबंधित

## tools/pdf.md

- मार्ग: /tools/pdf
- शीर्षक:
  - H2: उपलब्धता
  - H2: इनपुट संदर्भ
  - H2: समर्थित PDF संदर्भ
  - H2: निष्पादन मोड
  - H3: नेटिव प्रदाता मोड
  - H3: एक्सट्रैक्शन फ़ॉलबैक मोड
  - H2: Config
  - H2: आउटपुट विवरण
  - H2: त्रुटि व्यवहार
  - H2: उदाहरण
  - H2: संबंधित

## tools/permission-modes.md

- मार्ग: /tools/permission-modes
- शीर्षक:
  - H2: अनुशंसित डिफ़ॉल्ट
  - H2: OpenClaw होस्ट exec मोड
  - H2: Codex Guardian मैपिंग
  - H2: ACPX हार्नेस अनुमतियाँ
  - H2: मोड चुनना
  - H2: संबंधित

## tools/perplexity-search.md

- मार्ग: /tools/perplexity-search
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: Perplexity API कुंजी प्राप्त करना
  - H2: OpenRouter संगतता
  - H2: Config उदाहरण
  - H3: नेटिव Perplexity Search API
  - H3: OpenRouter / Sonar संगतता
  - H2: कुंजी कहाँ सेट करें
  - H2: टूल पैरामीटर
  - H3: डोमेन फ़िल्टर नियम
  - H2: नोट्स
  - H2: संबंधित

## tools/plugin.md

- मार्ग: /tools/plugin
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: त्वरित शुरुआत
  - H2: कॉन्फ़िगरेशन
  - H3: इंस्टॉल स्रोत चुनें
  - H3: ऑपरेटर इंस्टॉल नीति
  - H3: Plugin नीति कॉन्फ़िगर करें
  - H2: Plugin फ़ॉर्मैट समझें
  - H2: Plugin हुक्स
  - H2: सक्रिय Gateway सत्यापित करें
  - H2: समस्या निवारण
  - H3: अवरुद्ध Plugin पथ स्वामित्व
  - H3: धीमा Plugin टूल सेटअप
  - H2: संबंधित

## tools/reactions.md

- मार्ग: /tools/reactions
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: चैनल व्यवहार
  - H2: प्रतिक्रिया स्तर
  - H2: संबंधित

## tools/searxng-search.md

- मार्ग: /tools/searxng-search
- शीर्षक:
  - H2: सेटअप
  - H2: Config
  - H2: पर्यावरण चर
  - H2: Plugin config संदर्भ
  - H2: नोट्स
  - H2: संबंधित

## tools/skill-workshop.md

- मार्ग: /tools/skill-workshop
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: जीवनचक्र
  - H2: चैट
  - H2: CLI
  - H2: प्रस्ताव सामग्री
  - H2: सहायक फ़ाइलें
  - H2: एजेंट टूल
  - H2: स्वीकृति और स्वायत्तता
  - H2: Gateway विधियाँ
  - H2: स्टोरेज
  - H2: सीमाएँ
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/skills-config.md

- मार्ग: /tools/skills-config
- शीर्षक:
  - H2: लोडिंग (skills.load)
  - H2: इंस्टॉल (skills.install)
  - H2: ऑपरेटर इंस्टॉल नीति (security.installPolicy)
  - H2: बंडल किए गए skill की allowlist
  - H2: प्रति-skill प्रविष्टियाँ (skills.entries)
  - H2: एजेंट allowlists (agents)
  - H2: Workshop (skills.workshop)
  - H2: सिमलिंक किए गए skill roots
  - H2: सैंडबॉक्स्ड skills और env vars
  - H2: लोडिंग क्रम रिमाइंडर
  - H2: संबंधित

## tools/skills.md

- मार्ग: /tools/skills
- शीर्षक:
  - H2: लोडिंग क्रम
  - H2: प्रति-एजेंट बनाम साझा skills
  - H2: एजेंट allowlists
  - H2: Plugins और skills
  - H2: Skill Workshop
  - H2: ClawHub से इंस्टॉल करना
  - H2: सुरक्षा
  - H2: SKILL.md फ़ॉर्मैट
  - H3: वैकल्पिक frontmatter कुंजियाँ
  - H2: गेटिंग
  - H3: इंस्टॉलर specs
  - H2: Config ओवरराइड
  - H2: पर्यावरण इंजेक्शन
  - H2: स्नैपशॉट और रिफ़्रेश
  - H2: टोकन प्रभाव
  - H2: संबंधित

## tools/slash-commands.md

- मार्ग: /tools/slash-commands
- शीर्षक:
  - H2: तीन कमांड प्रकार
  - H2: कॉन्फ़िगरेशन
  - H2: कमांड सूची
  - H3: कोर कमांड
  - H3: डॉक कमांड
  - H3: बंडल किए गए Plugin कमांड
  - H3: Skill कमांड
  - H2: /tools — एजेंट अभी क्या उपयोग कर सकता है
  - H2: /model — मॉडल चयन
  - H2: /config — ऑन-डिस्क config लिखना
  - H2: /mcp — MCP सर्वर config
  - H2: /debug — केवल-रनटाइम ओवरराइड
  - H2: /plugins — Plugin प्रबंधन
  - H2: /trace — Plugin trace आउटपुट
  - H2: /btw — साइड प्रश्न
  - H2: सतह नोट्स
  - H2: प्रदाता उपयोग और स्थिति
  - H2: संबंधित

## tools/steer.md

- मार्ग: /tools/steer
- शीर्षक:
  - H2: वर्तमान सत्र
  - H2: स्टीयर बनाम कतार
  - H2: उप-एजेंट
  - H2: ACP सत्र
  - H2: संबंधित

## tools/subagents.md

- मार्ग: /tools/subagents
- शीर्षक:
  - H2: स्लैश कमांड
  - H3: थ्रेड बाइंडिंग नियंत्रण
  - H3: स्पॉन व्यवहार
  - H2: संदर्भ मोड
  - H2: टूल: sessionsspawn
  - H3: प्रतिनिधि प्रॉम्प्ट मोड
  - H3: टूल पैरामीटर
  - H3: कार्य नाम और लक्ष्यीकरण
  - H2: टूल: sessionsyield
  - H2: टूल: subagents
  - H2: थ्रेड-बाउंड सत्र
  - H3: थ्रेड समर्थित चैनल
  - H3: त्वरित फ़्लो
  - H3: मैनुअल नियंत्रण
  - H3: Config स्विच
  - H3: Allowlist
  - H3: डिस्कवरी
  - H3: ऑटो-आर्काइव
  - H2: नेस्टेड उप-एजेंट
  - H3: गहराई स्तर
  - H3: घोषणा श्रृंखला
  - H3: गहराई के अनुसार टूल नीति
  - H3: प्रति-एजेंट स्पॉन सीमा
  - H3: कैस्केड स्टॉप
  - H2: प्रमाणीकरण
  - H2: घोषणा
  - H3: घोषणा संदर्भ
  - H3: आँकड़ा पंक्ति
  - H3: sessionshistory को प्राथमिकता क्यों दें
  - H2: टूल नीति
  - H3: config के माध्यम से ओवरराइड
  - H2: समवर्तीता
  - H2: सक्रियता और रिकवरी
  - H2: रोकना
  - H2: सीमाएँ
  - H2: संबंधित

## tools/tavily.md

- मार्ग: /tools/tavily
- शीर्षक:
  - H2: शुरू करना
  - H2: टूल संदर्भ
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: सही टूल चुनना
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## tools/thinking.md

- मार्ग: /tools/thinking
- शीर्षक:
  - H2: यह क्या करता है
  - H2: रिज़ॉल्यूशन क्रम
  - H2: सत्र डिफ़ॉल्ट सेट करना
  - H2: एजेंट के अनुसार अनुप्रयोग
  - H2: तेज़ मोड (/fast)
  - H2: विस्तृत निर्देश (/verbose or /v)
  - H2: Plugin trace निर्देश (/trace)
  - H2: रीजनिंग दृश्यता (/reasoning)
  - H2: संबंधित
  - H2: Heartbeats
  - H2: वेब चैट UI
  - H2: प्रदाता प्रोफ़ाइलें

## tools/tokenjuice.md

- मार्ग: /tools/tokenjuice
- शीर्षक:
  - H2: Plugin सक्षम करें
  - H2: tokenjuice क्या बदलता है
  - H2: सत्यापित करें कि यह काम कर रहा है
  - H2: Plugin अक्षम करें
  - H2: संबंधित

## tools/tool-search.md

- मार्ग: /tools/tool-search
- शीर्षक:
  - H2: एक टर्न कैसे चलता है
  - H2: मोड
  - H2: यह क्यों मौजूद है
  - H2: API
  - H2: रनटाइम सीमा
  - H2: Config
  - H2: प्रॉम्प्ट और टेलीमेट्री
  - H2: E2E सत्यापन
  - H2: विफलता व्यवहार
  - H2: संबंधित

## tools/trajectory.md

- मार्ग: /tools/trajectory
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: एक्सेस
  - H2: क्या रिकॉर्ड होता है
  - H2: बंडल फ़ाइलें
  - H2: कैप्चर स्थान
  - H2: कैप्चर अक्षम करें
  - H2: फ़्लश टाइमआउट ट्यून करें
  - H2: गोपनीयता और सीमाएँ
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/tts.md

- मार्ग: /tools/tts
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: समर्थित प्रदाता
  - H2: कॉन्फ़िगरेशन
  - H3: प्रति-एजेंट वॉइस ओवरराइड
  - H2: Personas
  - H3: न्यूनतम persona
  - H3: पूर्ण persona (प्रदाता-न्यूट्रल प्रॉम्प्ट)
  - H3: Persona रिज़ॉल्यूशन
  - H3: प्रदाता persona प्रॉम्प्ट का उपयोग कैसे करते हैं
  - H3: फ़ॉलबैक नीति
  - H2: मॉडल-संचालित निर्देश
  - H2: स्लैश कमांड
  - H2: प्रति-उपयोगकर्ता प्राथमिकताएँ
  - H2: आउटपुट फ़ॉर्मैट (स्थिर)
  - H2: Auto-TTS व्यवहार
  - H2: चैनल के अनुसार आउटपुट फ़ॉर्मैट
  - H2: फ़ील्ड संदर्भ
  - H2: एजेंट टूल
  - H2: Gateway RPC
  - H2: सेवा लिंक
  - H2: संबंधित

## tools/video-generation.md

- मार्ग: /tools/video-generation
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: असिंक्रोनस जनरेशन कैसे काम करता है
  - H3: कार्य जीवनचक्र
  - H2: समर्थित प्रदाता
  - H3: क्षमता मैट्रिक्स
  - H2: टूल पैरामीटर
  - H3: आवश्यक
  - H3: सामग्री इनपुट
  - H3: शैली नियंत्रण
  - H3: उन्नत
  - H4: फ़ॉलबैक और टाइप किए गए विकल्प
  - H2: क्रियाएँ
  - H2: मॉडल चयन
  - H2: प्रदाता नोट्स
  - H2: प्रदाता क्षमता मोड
  - H2: लाइव परीक्षण
  - H2: कॉन्फ़िगरेशन
  - H2: संबंधित

## tools/web-fetch.md

- मार्ग: /tools/web-fetch
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: टूल पैरामीटर
  - H2: यह कैसे काम करता है
  - H2: प्रगति अपडेट
  - H2: Config
  - H2: Firecrawl फ़ॉलबैक
  - H2: विश्वसनीय env प्रॉक्सी
  - H2: सीमाएँ और सुरक्षा
  - H2: टूल प्रोफ़ाइलें
  - H2: संबंधित

## tools/web.md

- मार्ग: /tools/web
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: प्रदाता चुनना
  - H3: प्रदाता तुलना
  - H2: ऑटो-डिटेक्शन
  - H2: नेटिव OpenAI वेब खोज
  - H2: नेटिव Codex वेब खोज
  - H2: नेटवर्क सुरक्षा
  - H2: वेब खोज सेट अप करना
  - H2: Config
  - H3: API कुंजियाँ संग्रहित करना
  - H2: टूल पैरामीटर
  - H2: xsearch
  - H3: xsearch config
  - H3: xsearch पैरामीटर
  - H3: xsearch उदाहरण
  - H2: उदाहरण
  - H2: टूल प्रोफ़ाइलें
  - H2: संबंधित

## tts.md

- मार्ग: /tts
- शीर्षक:
  - H2: संबंधित

## vps.md

- मार्ग: /vps
- शीर्षक:
  - H2: प्रदाता चुनें
  - H2: क्लाउड सेटअप कैसे काम करते हैं
  - H2: पहले एडमिन एक्सेस को मज़बूत करें
  - H2: VPS पर साझा कंपनी एजेंट
  - H2: VPS के साथ नोड्स का उपयोग करना
  - H2: छोटे VMs और ARM होस्ट के लिए स्टार्टअप ट्यूनिंग
  - H3: systemd ट्यूनिंग चेकलिस्ट (वैकल्पिक)
  - H2: संबंधित

## web/control-ui.md

- मार्ग: /web/control-ui
- शीर्षक:
  - H2: त्वरित खोलें (स्थानीय)
  - H2: डिवाइस पेयरिंग (पहला कनेक्शन)
  - H2: व्यक्तिगत पहचान (ब्राउज़र-स्थानीय)
  - H2: रनटाइम config एंडपॉइंट
  - H2: भाषा समर्थन
  - H2: अपीयरेंस थीम
  - H2: यह क्या कर सकता है (आज)
  - H2: MCP पेज
  - H2: गतिविधि टैब
  - H2: चैट व्यवहार
  - H2: PWA इंस्टॉल और वेब पुश
  - H2: होस्टेड एम्बेड्स
  - H2: चैट संदेश चौड़ाई
  - H2: Tailnet एक्सेस (अनुशंसित)
  - H2: असुरक्षित HTTP
  - H2: सामग्री सुरक्षा नीति
  - H2: अवतार रूट प्रमाणीकरण
  - H2: असिस्टेंट मीडिया रूट प्रमाणीकरण
  - H2: UI बनाना
  - H2: खाली Control UI पेज
  - H2: डीबगिंग/परीक्षण: dev सर्वर + रिमोट Gateway
  - H2: संबंधित

## web/dashboard.md

- मार्ग: /web/dashboard
- शीर्षक:
  - H2: तेज़ पथ (अनुशंसित)
  - H2: Auth मूल बातें (स्थानीय बनाम रिमोट)
  - H2: यदि आपको "unauthorized" / 1008 दिखे
  - H2: संबंधित

## web/index.md

- मार्ग: /web
- शीर्षक:
  - H2: Webhooks
  - H2: एडमिन HTTP RPC
  - H2: Config (डिफ़ॉल्ट-ऑन)
  - H2: Tailscale एक्सेस
  - H3: इंटीग्रेटेड सर्व (अनुशंसित)
  - H3: Tailnet bind + token
  - H3: सार्वजनिक इंटरनेट (Funnel)
  - H2: सुरक्षा नोट्स
  - H2: UI बनाना

## web/tui.md

- मार्ग: /web/tui
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: Gateway मोड
  - H3: स्थानीय मोड
  - H2: आप क्या देखते हैं
  - H2: मानसिक मॉडल: एजेंट + सत्र
  - H2: भेजना + डिलीवरी
  - H2: पिकर्स + ओवरले
  - H2: कीबोर्ड शॉर्टकट
  - H2: स्लैश कमांड
  - H2: स्थानीय शेल कमांड
  - H2: स्थानीय TUI से config ठीक करें
  - H2: टूल आउटपुट
  - H2: टर्मिनल रंग
  - H2: इतिहास + स्ट्रीमिंग
  - H2: कनेक्शन विवरण
  - H2: विकल्प
  - H2: समस्या निवारण
  - H2: कनेक्शन समस्या निवारण
  - H2: संबंधित

## web/webchat.md

- मार्ग: /web/webchat
- शीर्षक:
  - H2: यह क्या है
  - H2: त्वरित शुरुआत
  - H2: यह कैसे काम करता है (व्यवहार)
  - H3: ट्रांसक्रिप्ट और डिलीवरी मॉडल
  - H2: Control UI एजेंट टूल पैनल
  - H2: रिमोट उपयोग
  - H2: कॉन्फ़िगरेशन संदर्भ (WebChat)
  - H2: संबंधित
