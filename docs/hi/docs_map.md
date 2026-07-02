---
read_when: Finding which docs page covers a topic before reading the page
summary: OpenClaw दस्तावेज़ पृष्ठों के लिए जनरेट किया गया शीर्षक मैप
title: दस्तावेज़ मानचित्र
x-i18n:
    generated_at: "2026-07-02T00:57:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 504b554aa699d78c9a3c958d3c724949efdac172cf4a7a0f343c3a3e9bb8c3d7
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw दस्तावेज़ मानचित्र

यह फ़ाइल `docs/**/*.md` और `docs/**/*.mdx` शीर्षकों से जनरेट की जाती है, ताकि एजेंट दस्तावेज़ीकरण ट्री में नेविगेट कर सकें।
इसे हाथ से संपादित न करें; `pnpm docs:map:gen` चलाएँ।

## agent-runtime-architecture.md

- मार्ग: /agent-runtime-architecture
- शीर्षक:
  - H2: Runtime लेआउट
  - H2: सीमाएँ
  - H2: मैनिफ़ेस्ट
  - H2: Runtime चयन
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
  - H2: स्थिर probe कारण कोड
  - H2: टोकन क्रेडेंशियल
  - H3: पात्रता नियम
  - H3: समाधान नियम
  - H2: एजेंट कॉपी पोर्टेबिलिटी
  - H2: केवल-config auth रूट
  - H2: स्पष्ट auth क्रम फ़िल्टरिंग
  - H2: Probe लक्ष्य समाधान
  - H2: बाहरी CLI क्रेडेंशियल खोज
  - H2: OAuth SecretRef नीति गार्ड
  - H2: Legacy-Compatible Messaging
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
  - H2: Cron कैसे काम करता है
  - H2: शेड्यूल प्रकार
  - H3: महीने के दिन और सप्ताह के दिन OR लॉजिक का उपयोग करते हैं
  - H2: निष्पादन शैलियाँ
  - H3: कमांड payloads
  - H3: पृथक jobs के लिए payload विकल्प
  - H2: डिलीवरी और आउटपुट
  - H2: आउटपुट भाषा
  - H2: CLI उदाहरण
  - H2: Webhook
  - H3: प्रमाणीकरण
  - H2: Gmail PubSub इंटीग्रेशन
  - H3: विज़ार्ड सेटअप (अनुशंसित)
  - H3: Gateway auto-start
  - H3: मैन्युअल एक-बार सेटअप
  - H3: Gmail मॉडल override
  - H2: jobs प्रबंधित करना
  - H2: कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H3: कमांड ladder
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
  - H3: HOOK.md फ़ॉर्मैट
  - H3: Handler implementation
  - H3: इवेंट संदर्भ highlights
  - H2: Hook खोज
  - H3: Hook packs
  - H2: बंडल किए गए hooks
  - H3: session-memory विवरण
  - H3: bootstrap-extra-files config
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
  - H3: Scheduled Tasks (Cron) बनाम Heartbeat
  - H2: मुख्य अवधारणाएँ
  - H3: निर्धारित tasks (cron)
  - H3: Tasks
  - H3: अनुमानित commitments
  - H3: Task Flow
  - H3: स्थायी आदेश
  - H3: Hooks
  - H3: Heartbeat
  - H2: वे साथ में कैसे काम करते हैं
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
  - H2: स्थायी आदेश की रचना
  - H2: स्थायी आदेश और cron jobs
  - H2: उदाहरण
  - H3: उदाहरण 1: कंटेंट और सोशल मीडिया (साप्ताहिक चक्र)
  - H3: उदाहरण 2: वित्त संचालन (event-triggered)
  - H3: उदाहरण 3: मॉनिटरिंग और अलर्ट (निरंतर)
  - H2: execute-verify-report पैटर्न
  - H2: मल्टी-प्रोग्राम आर्किटेक्चर
  - H2: सर्वोत्तम अभ्यास
  - H3: करें
  - H3: बचें
  - H2: संबंधित

## automation/taskflow.md

- मार्ग: /automation/taskflow
- शीर्षक:
  - H2: Task Flow कब उपयोग करें
  - H2: विश्वसनीय निर्धारित workflow पैटर्न
  - H2: Sync मोड
  - H3: Managed mode
  - H3: Mirrored mode
  - H2: टिकाऊ state और revision tracking
  - H2: Cancel व्यवहार
  - H2: CLI कमांड
  - H2: flows tasks से कैसे संबंधित हैं
  - H2: संबंधित

## automation/tasks.md

- मार्ग: /automation/tasks
- शीर्षक:
  - H2: TL;DR
  - H2: त्वरित शुरुआत
  - H2: task क्या बनाता है
  - H2: Task lifecycle
  - H2: डिलीवरी और सूचनाएँ
  - H3: सूचना नीतियाँ
  - H2: CLI संदर्भ
  - H2: Chat task board (/tasks)
  - H2: Status integration (task pressure)
  - H2: स्टोरेज और रखरखाव
  - H3: tasks कहाँ रहते हैं
  - H3: स्वचालित रखरखाव
  - H2: tasks अन्य systems से कैसे संबंधित हैं
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
  - H2: स्थिर message sender groups
  - H2: allowlists से reference groups
  - H2: समर्थित message-channel पथ
  - H2: Plugin diagnostics
  - H2: Discord चैनल audiences
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
  - H2: दृश्य reply modes
  - H2: इतिहास
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/bot-loop-protection.md

- मार्ग: /channels/bot-loop-protection
- शीर्षक:
  - H1: Bot loop protection
  - H2: Defaults
  - H2: साझा defaults कॉन्फ़िगर करें
  - H2: प्रति चैनल या account override करें
  - H2: चैनल समर्थन

## channels/broadcast-groups.md

- मार्ग: /channels/broadcast-groups
- शीर्षक:
  - H2: अवलोकन
  - H2: उपयोग मामले
  - H2: कॉन्फ़िगरेशन
  - H3: मूल सेटअप
  - H3: Processing strategy
  - H3: पूरा उदाहरण
  - H2: यह कैसे काम करता है
  - H3: Message flow
  - H3: Session isolation
  - H3: उदाहरण: isolated sessions
  - H2: सर्वोत्तम अभ्यास
  - H2: Compatibility
  - H3: Providers
  - H3: Routing
  - H2: समस्या निवारण
  - H2: उदाहरण
  - H2: API संदर्भ
  - H3: Config schema
  - H3: Fields
  - H2: सीमाएँ
  - H2: भविष्य के सुधार
  - H2: संबंधित

## channels/channel-routing.md

- मार्ग: /channels/channel-routing
- शीर्षक:
  - H1: Channels और routing
  - H2: मुख्य शब्द
  - H2: Outbound target prefixes
  - H2: Session key shapes (उदाहरण)
  - H2: Main DM route pinning
  - H2: Guarded inbound recording
  - H2: Routing rules (एजेंट कैसे चुना जाता है)
  - H2: Broadcast groups (कई एजेंट चलाएँ)
  - H2: Config overview
  - H2: Session storage
  - H2: WebChat व्यवहार
  - H2: Reply context
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
  - H2: Runtime मॉडल
  - H2: Forum channels
  - H2: Interactive components
  - H2: Access control और routing
  - H3: Role-based agent routing
  - H2: Native commands और command auth
  - H2: Feature details
  - H2: Tools और action gates
  - H2: Components v2 UI
  - H2: Voice
  - H3: Voice channels
  - H3: Voice में users को follow करें
  - H3: Voice messages
  - H2: समस्या निवारण
  - H2: Configuration reference
  - H2: Safety और operations
  - H2: संबंधित

## channels/feishu.md

- मार्ग: /channels/feishu
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: Access control
  - H3: Direct messages
  - H3: Group chats
  - H2: Group configuration examples
  - H3: सभी groups allow करें, @mention आवश्यक नहीं
  - H3: सभी groups allow करें, फिर भी @mention आवश्यक रखें
  - H3: केवल विशिष्ट groups allow करें
  - H3: group के भीतर senders प्रतिबंधित करें
  - H2: group/user IDs प्राप्त करें
  - H3: Group IDs (chatid, format: ocxxx)
  - H3: User IDs (openid, format: ouxxx)
  - H2: सामान्य कमांड
  - H2: समस्या निवारण
  - H3: Bot group chats में response नहीं देता
  - H3: Bot messages प्राप्त नहीं करता
  - H3: QR setup Feishu mobile app में react नहीं करता
  - H3: App Secret लीक हो गया
  - H2: Advanced configuration
  - H3: Multiple accounts
  - H3: Message limits
  - H3: Streaming
  - H3: Quota optimization
  - H3: ACP sessions
  - H4: Persistent ACP binding
  - H4: chat से ACP spawn करें
  - H3: Multi-agent routing
  - H2: प्रति-user agent isolation (Dynamic Agent Creation)
  - H3: त्वरित सेटअप
  - H3: यह कैसे काम करता है
  - H3: Configuration options
  - H3: Session scope
  - H3: सामान्य multi-user deployment
  - H3: Verification
  - H3: नोट्स
  - H2: Configuration reference
  - H2: समर्थित message types
  - H3: Receive
  - H3: Send
  - H3: Threads और replies
  - H2: संबंधित

## channels/googlechat.md

- मार्ग: /channels/googlechat
- शीर्षक:
  - H2: Install
  - H2: त्वरित सेटअप (आरंभिक)
  - H2: Google Chat में जोड़ें
  - H2: Public URL (केवल-Webhook)
  - H3: विकल्प A: Tailscale Funnel (अनुशंसित)
  - H3: विकल्प B: Reverse Proxy (Caddy)
  - H3: विकल्प C: Cloudflare Tunnel
  - H2: यह कैसे काम करता है
  - H2: लक्ष्य
  - H2: Config highlights
  - H2: समस्या निवारण
  - H3: 405 Method Not Allowed
  - H3: अन्य समस्याएँ
  - H2: संबंधित

## channels/group-messages.md

- मार्ग: /channels/group-messages
- शीर्षक:
  - H2: व्यवहार
  - H2: Config example (WhatsApp)
  - H3: Activation command (केवल-owner)
  - H2: उपयोग कैसे करें
  - H2: Testing / verification
  - H2: ज्ञात विचारणीय बातें
  - H2: संबंधित

## channels/groups.md

- मार्ग: /channels/groups
- शीर्षक:
  - H2: शुरुआती परिचय (2 मिनट)
  - H2: दृश्य replies
  - H2: Context visibility और allowlists
  - H2: Session keys
  - H2: Pattern: personal DMs + public groups (single agent)
  - H2: Display labels
  - H2: Group policy
  - H2: Mention gating (default)
  - H2: Scope configured mention patterns
  - H2: Group/channel tool restrictions (optional)
  - H2: Group allowlists
  - H2: Activation (केवल-owner)
  - H2: Context fields
  - H2: iMessage specifics
  - H2: WhatsApp system prompts
  - H2: WhatsApp specifics
  - H2: संबंधित

## channels/imessage-from-bluebubbles.md

- मार्ग: /channels/imessage-from-bluebubbles
- शीर्षक:
  - H2: Migration checklist
  - H2: यह migration कब सार्थक है
  - H2: imsg क्या करता है
  - H2: शुरू करने से पहले
  - H2: Config translation
  - H2: Group registry footgun
  - H2: चरण-दर-चरण
  - H2: Action parity at a glance
  - H2: Pairing, sessions, और ACP bindings
  - H2: कोई rollback channel नहीं
  - H2: संबंधित

## channels/imessage.md

- मार्ग: /channels/imessage
- शीर्षक:
  - H2: त्वरित सेटअप
  - H2: Requirements और permissions (macOS)
  - H2: imsg private API सक्षम करना
  - H3: Setup
  - H3: जब आप SIP disable नहीं कर सकते
  - H2: Access control और routing
  - H2: ACP conversation bindings
  - H2: Deployment patterns
  - H2: Media, chunking, और delivery targets
  - H2: Private API actions
  - H2: Config writes
  - H2: Coalescing split-send DMs (command + URL in one composition)
  - H3: Scenarios और एजेंट क्या देखता है
  - H2: bridge या Gateway restart के बाद inbound recovery
  - H3: Operator-visible signal
  - H3: Migration
  - H2: समस्या निवारण
  - H2: Configuration reference pointers
  - H2: संबंधित

## channels/index.md

- मार्ग: /channels
- शीर्षक:
  - H2: Delivery notes
  - H2: समर्थित channels
  - H2: नोट्स

## channels/irc.md

- मार्ग: /channels/irc
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: Security defaults
  - H2: Access control
  - H3: Common gotcha: allowFrom DMs के लिए है, channels के लिए नहीं
  - H2: Reply triggering (mentions)
  - H2: Security note (public channels के लिए अनुशंसित)
  - H3: channel में सभी के लिए वही tools
  - H3: प्रति sender अलग tools (owner को अधिक power मिलती है)
  - H2: NickServ
  - H2: Environment variables
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/line.md

- रूट: /channels/line
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: सेटअप
  - H2: कॉन्फ़िगर करें
  - H2: एक्सेस नियंत्रण
  - H2: संदेश व्यवहार
  - H2: चैनल डेटा (रिच संदेश)
  - H2: ACP समर्थन
  - H2: आउटबाउंड मीडिया
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/location.md

- रूट: /channels/location
- शीर्षक:
  - H2: टेक्स्ट फ़ॉर्मैटिंग
  - H2: संदर्भ फ़ील्ड
  - H2: चैनल नोट्स
  - H2: संबंधित

## channels/matrix-migration.md

- रूट: /channels/matrix-migration
- शीर्षक:
  - H2: माइग्रेशन अपने-आप क्या करता है
  - H2: माइग्रेशन अपने-आप क्या नहीं कर सकता
  - H2: अनुशंसित अपग्रेड फ़्लो
  - H2: एन्क्रिप्टेड माइग्रेशन कैसे काम करता है
  - H2: सामान्य संदेश और उनका अर्थ
  - H3: अपग्रेड और पहचान संदेश
  - H3: एन्क्रिप्टेड-स्टेट रिकवरी संदेश
  - H3: मैनुअल रिकवरी संदेश
  - H3: कस्टम Plugin इंस्टॉल संदेश
  - H2: अगर एन्क्रिप्टेड इतिहास फिर भी वापस नहीं आता
  - H2: अगर आप भविष्य के संदेशों के लिए नए सिरे से शुरू करना चाहते हैं
  - H2: संबंधित

## channels/matrix-presentation.md

- रूट: /channels/matrix-presentation
- शीर्षक:
  - H2: इवेंट सामग्री
  - H2: फ़ॉलबैक व्यवहार
  - H2: समर्थित ब्लॉक
  - H2: इंटरैक्शन
  - H2: अनुमोदन मेटाडेटा से संबंध
  - H2: मीडिया संदेश

## channels/matrix-push-rules.md

- रूट: /channels/matrix-push-rules
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: चरण
  - H2: मल्टी-बॉट नोट्स
  - H2: होमसर्वर नोट्स
  - H2: संबंधित

## channels/matrix.md

- रूट: /channels/matrix
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: सेटअप
  - H3: इंटरैक्टिव सेटअप
  - H3: न्यूनतम कॉन्फ़िग
  - H3: ऑटो-जॉइन
  - H3: Allowlist लक्ष्य फ़ॉर्मैट
  - H3: खाता ID सामान्यीकरण
  - H3: कैश किए गए क्रेडेंशियल
  - H3: एनवायरनमेंट वेरिएबल
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H2: स्ट्रीमिंग प्रीव्यू
  - H2: वॉयस संदेश
  - H2: अनुमोदन मेटाडेटा
  - H3: शांत अंतिम प्रीव्यू के लिए सेल्फ-होस्टेड पुश नियम
  - H2: बॉट-से-बॉट रूम
  - H2: एन्क्रिप्शन और सत्यापन
  - H3: एन्क्रिप्शन सक्षम करें
  - H3: स्थिति और भरोसे के संकेत
  - H3: रिकवरी कुंजी से इस डिवाइस को सत्यापित करें
  - H3: क्रॉस-साइनिंग को बूटस्ट्रैप या रिपेयर करें
  - H3: रूम-की बैकअप
  - H3: सत्यापन सूचीबद्ध करना, अनुरोध करना और जवाब देना
  - H3: मल्टी-अकाउंट नोट्स
  - H2: प्रोफ़ाइल प्रबंधन
  - H2: थ्रेड
  - H3: सेशन रूटिंग (sessionScope)
  - H3: रिप्लाई थ्रेडिंग (threadReplies)
  - H3: थ्रेड इनहेरिटेंस और स्लैश कमांड
  - H2: ACP वार्तालाप बाइंडिंग
  - H3: थ्रेड बाइंडिंग कॉन्फ़िग
  - H2: प्रतिक्रियाएँ
  - H2: इतिहास संदर्भ
  - H2: संदर्भ दृश्यता
  - H2: DM और रूम नीति
  - H2: डायरेक्ट रूम रिपेयर
  - H2: Exec अनुमोदन
  - H2: स्लैश कमांड
  - H2: मल्टी-अकाउंट
  - H2: निजी/LAN होमसर्वर
  - H2: Matrix ट्रैफ़िक प्रॉक्सी करना
  - H2: लक्ष्य समाधान
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H3: खाता और कनेक्शन
  - H3: एन्क्रिप्शन
  - H3: एक्सेस और नीति
  - H3: रिप्लाई व्यवहार
  - H3: प्रतिक्रिया सेटिंग
  - H3: टूलिंग और प्रति-रूम ओवरराइड
  - H3: Exec अनुमोदन सेटिंग
  - H2: संबंधित

## channels/mattermost.md

- रूट: /channels/mattermost
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: त्वरित सेटअप
  - H2: नेटिव स्लैश कमांड
  - H2: एनवायरनमेंट वेरिएबल (डिफ़ॉल्ट खाता)
  - H2: चैट मोड
  - H2: थ्रेडिंग और सेशन
  - H2: एक्सेस नियंत्रण (DMs)
  - H2: चैनल (समूह)
  - H2: आउटबाउंड डिलीवरी के लिए लक्ष्य
  - H2: DM चैनल पुनःप्रयास
  - H2: प्रीव्यू स्ट्रीमिंग
  - H2: प्रतिक्रियाएँ (संदेश टूल)
  - H2: इंटरैक्टिव बटन (संदेश टूल)
  - H3: डायरेक्ट API इंटीग्रेशन (बाहरी स्क्रिप्ट)
  - H2: डायरेक्टरी एडाप्टर
  - H2: मल्टी-अकाउंट
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/msteams.md

- रूट: /channels/msteams
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप
  - H2: लक्ष्य
  - H2: कॉन्फ़िग लेखन
  - H2: एक्सेस नियंत्रण (DMs + समूह)
  - H3: यह कैसे काम करता है
  - H3: चरण 1: Azure Bot बनाएँ
  - H3: चरण 2: क्रेडेंशियल प्राप्त करें
  - H3: चरण 3: Messaging Endpoint कॉन्फ़िगर करें
  - H3: चरण 4: Teams Channel सक्षम करें
  - H3: चरण 5: Teams App Manifest बनाएँ
  - H3: चरण 6: OpenClaw कॉन्फ़िगर करें
  - H3: चरण 7: Gateway चलाएँ
  - H2: फ़ेडरेटेड प्रमाणीकरण (प्रमाणपत्र और मैनेज्ड आइडेंटिटी)
  - H3: विकल्प A: प्रमाणपत्र-आधारित प्रमाणीकरण
  - H3: विकल्प B: Azure Managed Identity
  - H3: AKS Workload Identity सेटअप
  - H3: प्रमाणीकरण प्रकार तुलना
  - H2: स्थानीय विकास (टनलिंग)
  - H2: Bot की टेस्टिंग
  - H2: एनवायरनमेंट वेरिएबल
  - H2: सदस्य जानकारी कार्रवाई
  - H2: इतिहास संदर्भ
  - H2: वर्तमान Teams RSC अनुमतियाँ (मैनिफ़ेस्ट)
  - H2: उदाहरण Teams मैनिफ़ेस्ट (संशोधित)
  - H3: मैनिफ़ेस्ट सावधानियाँ (अनिवार्य फ़ील्ड)
  - H3: मौजूदा ऐप अपडेट करना
  - H2: क्षमताएँ: केवल RSC बनाम Graph
  - H3: केवल Teams RSC के साथ (ऐप इंस्टॉल, कोई Graph API अनुमति नहीं)
  - H3: Teams RSC + Microsoft Graph Application अनुमतियों के साथ
  - H3: RSC बनाम Graph API
  - H2: Graph-सक्षम मीडिया + इतिहास (चैनलों के लिए आवश्यक)
  - H2: ज्ञात सीमाएँ
  - H3: Webhook टाइमआउट
  - H3: Teams क्लाउड और सेवा URL समर्थन
  - H3: फ़ॉर्मैटिंग
  - H2: कॉन्फ़िगरेशन
  - H2: रूटिंग और सेशन
  - H2: रिप्लाई शैली: थ्रेड बनाम पोस्ट
  - H3: समाधान प्राथमिकता
  - H3: थ्रेड संदर्भ संरक्षण
  - H2: अटैचमेंट और इमेज
  - H2: समूह चैट में फ़ाइलें भेजना
  - H3: समूह चैट को SharePoint की आवश्यकता क्यों होती है
  - H3: सेटअप
  - H3: साझा करने का व्यवहार
  - H3: फ़ॉलबैक व्यवहार
  - H3: फ़ाइलों का संग्रहित स्थान
  - H2: पोल (Adaptive Cards)
  - H2: प्रेज़ेंटेशन कार्ड
  - H2: लक्ष्य फ़ॉर्मैट
  - H2: प्रोएक्टिव मैसेजिंग
  - H2: टीम और चैनल IDs (सामान्य चूक)
  - H2: निजी चैनल
  - H2: समस्या निवारण
  - H3: सामान्य समस्याएँ
  - H3: मैनिफ़ेस्ट अपलोड त्रुटियाँ
  - H3: RSC अनुमतियाँ काम नहीं कर रहीं
  - H2: संदर्भ
  - H2: संबंधित

## channels/nextcloud-talk.md

- रूट: /channels/nextcloud-talk
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: नोट्स
  - H2: एक्सेस नियंत्रण (DMs)
  - H2: रूम (समूह)
  - H2: क्षमताएँ
  - H2: कॉन्फ़िगरेशन संदर्भ (Nextcloud Talk)
  - H2: संबंधित

## channels/nostr.md

- रूट: /channels/nostr
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H3: पुराने/कस्टम इंस्टॉल
  - H3: नॉन-इंटरैक्टिव सेटअप
  - H2: त्वरित सेटअप
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: प्रोफ़ाइल मेटाडेटा
  - H2: एक्सेस नियंत्रण
  - H3: DM नीतियाँ
  - H3: Allowlist उदाहरण
  - H2: कुंजी फ़ॉर्मैट
  - H2: रिले
  - H2: प्रोटोकॉल समर्थन
  - H2: टेस्टिंग
  - H3: स्थानीय रिले
  - H3: मैनुअल टेस्ट
  - H2: समस्या निवारण
  - H3: संदेश प्राप्त नहीं हो रहे
  - H3: प्रतिक्रियाएँ भेजी नहीं जा रहीं
  - H3: डुप्लिकेट प्रतिक्रियाएँ
  - H2: सुरक्षा
  - H2: सीमाएँ (MVP)
  - H2: संबंधित

## channels/pairing.md

- रूट: /channels/pairing
- शीर्षक:
  - H2: 1) DM पेयरिंग (इनबाउंड चैट एक्सेस)
  - H3: प्रेषक को अनुमोदित करें
  - H3: पुनःउपयोग योग्य प्रेषक समूह
  - H3: स्टेट कहाँ रहता है
  - H2: 2) Node डिवाइस पेयरिंग (iOS/Android/macOS/हेडलेस नोड्स)
  - H3: Telegram के ज़रिए पेयर करें (iOS के लिए अनुशंसित)
  - H3: नोड डिवाइस को अनुमोदित करें
  - H3: वैकल्पिक trusted-CIDR नोड ऑटो-अप्रूव
  - H3: Node पेयरिंग स्टेट स्टोरेज
  - H3: नोट्स
  - H2: संबंधित दस्तावेज़

## channels/qa-channel.md

- रूट: /channels/qa-channel
- शीर्षक:
  - H2: यह क्या करता है
  - H2: कॉन्फ़िग
  - H2: रनर
  - H2: संबंधित

## channels/qqbot.md

- रूट: /channels/qqbot
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: सेटअप
  - H2: कॉन्फ़िगर करें
  - H3: मल्टी-अकाउंट सेटअप
  - H3: समूह चैट
  - H3: वॉयस (STT / TTS)
  - H2: लक्ष्य फ़ॉर्मैट
  - H2: स्लैश कमांड
  - H2: इंजन आर्किटेक्चर
  - H2: QR-कोड ऑनबोर्डिंग
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/raft.md

- रूट: /channels/raft
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: पूर्वापेक्षाएँ
  - H2: कॉन्फ़िगर करें
  - H2: यह कैसे काम करता है
  - H2: सत्यापित करें
  - H2: समस्या निवारण
  - H2: संदर्भ

## channels/signal.md

- रूट: /channels/signal
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: कॉन्फ़िग लेखन
  - H2: नंबर मॉडल (महत्वपूर्ण)
  - H2: सेटअप पथ A: मौजूदा Signal खाते को लिंक करें (QR)
  - H2: सेटअप पथ B: समर्पित बॉट नंबर रजिस्टर करें (SMS, Linux)
  - H2: बाहरी डेमन मोड (httpUrl)
  - H2: कंटेनर मोड (bbernhard/signal-cli-rest-api)
  - H2: एक्सेस नियंत्रण (DMs + समूह)
  - H2: यह कैसे काम करता है (व्यवहार)
  - H2: मीडिया + सीमाएँ
  - H2: टाइपिंग + रीड रसीदें
  - H2: प्रतिक्रियाएँ (संदेश टूल)
  - H2: अनुमोदन प्रतिक्रियाएँ
  - H2: डिलीवरी लक्ष्य (CLI/cron)
  - H2: समस्या निवारण
  - H2: सुरक्षा नोट्स
  - H2: कॉन्फ़िगरेशन संदर्भ (Signal)
  - H2: संबंधित

## channels/slack.md

- रूट: /channels/slack
- शीर्षक:
  - H2: Socket Mode या HTTP Request URLs चुनना
  - H3: रिले मोड
  - H2: इंस्टॉल करें
  - H2: त्वरित सेटअप
  - H2: Socket Mode ट्रांसपोर्ट ट्यूनिंग
  - H2: मैनिफ़ेस्ट और स्कोप चेकलिस्ट
  - H3: अतिरिक्त मैनिफ़ेस्ट सेटिंग
  - H2: टोकन मॉडल
  - H2: कार्रवाइयाँ और गेट
  - H2: एक्सेस नियंत्रण और रूटिंग
  - H2: थ्रेडिंग, सेशन और रिप्लाई टैग
  - H2: Ack प्रतिक्रियाएँ
  - H3: इमोजी (ackReaction)
  - H3: स्कोप (messages.ackReactionScope)
  - H2: टेक्स्ट स्ट्रीमिंग
  - H2: टाइपिंग प्रतिक्रिया फ़ॉलबैक
  - H2: मीडिया, चंकिंग और डिलीवरी
  - H2: कमांड और स्लैश व्यवहार
  - H2: इंटरैक्टिव रिप्लाई
  - H3: Plugin-स्वामित्व वाले मोडल सबमिशन
  - H2: Slack में नेटिव अनुमोदन
  - H2: इवेंट और परिचालन व्यवहार
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

- रूट: /channels/sms
- शीर्षक:
  - H2: शुरू करने से पहले
  - H2: त्वरित सेटअप
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H3: कॉन्फ़िग फ़ाइल
  - H3: एनवायरनमेंट वेरिएबल
  - H3: SecretRef प्रमाणीकरण टोकन
  - H3: केवल-Allowlist निजी नंबर
  - H3: Messaging Service प्रेषक
  - H3: डिफ़ॉल्ट आउटबाउंड लक्ष्य
  - H2: एक्सेस नियंत्रण
  - H2: SMS भेजना
  - H2: सेटअप सत्यापित करें
  - H3: macOS iMessage/SMS से एंड-टू-एंड टेस्ट
  - H2: Webhook सुरक्षा
  - H2: मल्टी-अकाउंट कॉन्फ़िग
  - H2: समस्या निवारण
  - H3: Twilio 403 लौटाता है या OpenClaw Webhook को अस्वीकार करता है
  - H3: कोई पेयरिंग अनुरोध दिखाई नहीं देता
  - H3: आउटबाउंड भेजना विफल होता है
  - H3: संदेश आते हैं लेकिन एजेंट जवाब नहीं देता

## channels/synology-chat.md

- रूट: /channels/synology-chat
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप
  - H2: एनवायरनमेंट वेरिएबल
  - H2: DM नीति और एक्सेस नियंत्रण
  - H2: आउटबाउंड डिलीवरी
  - H2: मल्टी-अकाउंट
  - H2: सुरक्षा नोट्स
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/telegram.md

- रूट: /channels/telegram
- शीर्षक:
  - H2: त्वरित सेटअप
  - H2: Telegram साइड सेटिंग
  - H2: एक्सेस नियंत्रण और सक्रियण
  - H3: समूह बॉट पहचान
  - H2: रनटाइम व्यवहार
  - H2: फ़ीचर संदर्भ
  - H2: त्रुटि रिप्लाई नियंत्रण
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: संबंधित

## channels/tlon.md

- रूट: /channels/tlon
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: सेटअप
  - H2: निजी/LAN शिप
  - H2: समूह चैनल
  - H2: एक्सेस नियंत्रण
  - H2: स्वामी और अनुमोदन सिस्टम
  - H2: ऑटो-एक्सेप्ट सेटिंग
  - H2: डिलीवरी लक्ष्य (CLI/cron)
  - H2: बंडल की गई skill
  - H2: क्षमताएँ
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: नोट्स
  - H2: संबंधित

## channels/troubleshooting.md

- रूट: /channels/troubleshooting
- शीर्षक:
  - H2: कमांड लैडर
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

- मार्ग: /channels/twitch
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: सेटअप (विस्तृत)
  - H3: क्रेडेंशियल जनरेट करें
  - H3: bot कॉन्फ़िगर करें
  - H3: एक्सेस नियंत्रण (अनुशंसित)
  - H2: Token रिफ़्रेश (वैकल्पिक)
  - H2: मल्टी-अकाउंट समर्थन
  - H2: एक्सेस नियंत्रण
  - H2: समस्या निवारण
  - H2: Config
  - H3: अकाउंट Config
  - H3: प्रदाता विकल्प
  - H2: टूल कार्रवाइयां
  - H2: सुरक्षा और संचालन
  - H2: सीमाएं
  - H2: संबंधित

## channels/wechat.md

- मार्ग: /channels/wechat
- शीर्षक:
  - H2: नामकरण
  - H2: यह कैसे काम करता है
  - H2: इंस्टॉल करें
  - H2: Login
  - H2: एक्सेस नियंत्रण
  - H2: संगतता
  - H2: Sidecar प्रक्रिया
  - H2: समस्या निवारण
  - H2: संबंधित docs

## channels/whatsapp.md

- मार्ग: /channels/whatsapp
- शीर्षक:
  - H2: इंस्टॉल करें (मांग पर)
  - H2: त्वरित सेटअप
  - H2: डिप्लॉयमेंट पैटर्न
  - H2: Runtime मॉडल
  - H2: Approval प्रॉम्प्ट
  - H2: Plugin hooks और गोपनीयता
  - H2: एक्सेस नियंत्रण और सक्रियण
  - H2: कॉन्फ़िगर किए गए ACP bindings
  - H2: निजी-नंबर और self-chat व्यवहार
  - H2: Message normalization और context
  - H2: Delivery, chunking, और media
  - H2: Reply quoting
  - H2: Reaction स्तर
  - H2: Acknowledgment reactions
  - H2: Lifecycle status reactions
  - H2: मल्टी-अकाउंट और क्रेडेंशियल
  - H2: Tools, actions, और Config writes
  - H2: समस्या निवारण
  - H2: System prompts
  - H2: Configuration reference pointers
  - H2: संबंधित

## channels/yuanbao.md

- मार्ग: /channels/yuanbao
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: Interactive setup (विकल्प)
  - H2: एक्सेस नियंत्रण
  - H3: Direct messages
  - H3: Group chats
  - H2: Configuration उदाहरण
  - H3: open DM नीति के साथ बुनियादी सेटअप
  - H3: DMs को विशिष्ट users तक सीमित करें
  - H3: Groups में @mention आवश्यकता अक्षम करें
  - H3: Outbound message delivery अनुकूलित करें
  - H3: merge-text रणनीति ट्यून करें
  - H2: सामान्य commands
  - H2: समस्या निवारण
  - H3: Bot group chats में जवाब नहीं देता
  - H3: Bot messages प्राप्त नहीं करता
  - H3: Bot खाली या fallback replies भेजता है
  - H3: App Secret लीक हुआ
  - H2: उन्नत configuration
  - H3: कई अकाउंट
  - H3: Message सीमाएं
  - H3: Streaming
  - H3: Group chat history context
  - H3: Reply-to mode
  - H3: Markdown hint injection
  - H3: Debug mode
  - H3: Multi-agent routing
  - H2: Configuration reference
  - H2: समर्थित message types
  - H3: प्राप्त करें
  - H3: भेजें
  - H3: Threads और replies
  - H2: संबंधित

## channels/zalo.md

- मार्ग: /channels/zalo
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: सेटअप (तेज़ रास्ता)
  - H3: 1) bot token बनाएं (Zalo Bot Platform)
  - H3: 2) token कॉन्फ़िगर करें (env या Config)
  - H2: यह कैसे काम करता है (व्यवहार)
  - H2: सीमाएं
  - H2: एक्सेस नियंत्रण (DMs)
  - H3: DM एक्सेस
  - H2: एक्सेस नियंत्रण (Groups)
  - H2: Long-polling बनाम Webhook
  - H2: समर्थित message types
  - H2: क्षमताएं
  - H2: Delivery targets (CLI/Cron)
  - H2: समस्या निवारण
  - H2: Configuration reference (Zalo)
  - H2: संबंधित

## channels/zaloclawbot.md

- मार्ग: /channels/zaloclawbot
- शीर्षक:
  - H2: संगतता
  - H2: पूर्वापेक्षाएं
  - H2: onboard के साथ इंस्टॉल करें (अनुशंसित)
  - H2: मैनुअल इंस्टॉलेशन
  - H3: 1. Plugin इंस्टॉल करें
  - H3: 2. Config में Plugin सक्षम करें
  - H3: 3. QR code जनरेट करें और log in करें
  - H3: 4. Gateway पुनरारंभ करें
  - H2: यह कैसे काम करता है
  - H2: पर्दे के पीछे
  - H2: समस्या निवारण

## channels/zalouser.md

- मार्ग: /channels/zalouser
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: नामकरण
  - H2: IDs ढूंढना (directory)
  - H2: सीमाएं
  - H2: एक्सेस नियंत्रण (DMs)
  - H2: Group एक्सेस (वैकल्पिक)
  - H3: Group mention gating
  - H2: मल्टी-अकाउंट
  - H2: Environment variables
  - H2: Typing, reactions, और delivery acknowledgements
  - H2: समस्या निवारण
  - H2: संबंधित

## ci.md

- मार्ग: /ci
- शीर्षक:
  - H2: Pipeline अवलोकन
  - H2: Fail-fast क्रम
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
  - H3: Duplicate PRs After Merge
  - H2: Local check gates और changed routing
  - H2: Testbox validation
  - H2: संबंधित

## clawhub/cli.md

- मार्ग: /clawhub/cli
- शीर्षक:
  - H1: ClawHub CLI
  - H2: खोजें और इंस्टॉल करें
  - H2: प्रकाशित करें और रखरखाव करें
  - H2: संबंधित

## clawhub/publishing.md

- मार्ग: /clawhub/publishing
- शीर्षक:
  - H1: ClawHub पर प्रकाशन
  - H2: Owners
  - H2: Skills
  - H2: Plugins
  - H2: Release Flow
  - H2: FAQ
  - H3: Package scope चयनित owner से मेल खाना चाहिए

## cli/acp.md

- मार्ग: /cli/acp
- शीर्षक:
  - H2: यह क्या नहीं है
  - H2: Compatibility Matrix
  - H2: ज्ञात सीमाएं
  - H2: उपयोग
  - H2: ACP client (debug)
  - H2: Protocol smoke testing
  - H2: इसका उपयोग कैसे करें
  - H2: Agents चुनना
  - H2: acpx से उपयोग करें (Codex, Claude, अन्य ACP clients)
  - H2: Zed editor setup
  - H2: Session mapping
  - H2: विकल्प
  - H3: acp client options
  - H2: संबंधित

## cli/agent.md

- मार्ग: /cli/agent
- शीर्षक:
  - H1: openclaw agent
  - H2: विकल्प
  - H2: उदाहरण
  - H2: नोट्स
  - H2: JSON delivery status
  - H2: संबंधित

## cli/agents.md

- मार्ग: /cli/agents
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
  - H3: agents delete
  - H2: Identity files
  - H2: पहचान सेट करें
  - H2: संबंधित

## cli/approvals.md

- मार्ग: /cli/approvals
- शीर्षक:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: सामान्य commands
  - H2: फ़ाइल से approvals बदलें
  - H2: "Never prompt" / YOLO उदाहरण
  - H2: Allowlist helpers
  - H2: सामान्य विकल्प
  - H2: नोट्स
  - H2: संबंधित

## cli/attach.md

- मार्ग: /cli/attach
- शीर्षक: कोई नहीं

## cli/backup.md

- मार्ग: /cli/backup
- शीर्षक:
  - H1: openclaw backup
  - H2: नोट्स
  - H2: किसका backup लिया जाता है
  - H2: Invalid Config behavior
  - H2: आकार और प्रदर्शन
  - H2: संबंधित

## cli/browser.md

- मार्ग: /cli/browser
- शीर्षक:
  - H1: openclaw browser
  - H2: सामान्य flags
  - H2: त्वरित शुरुआत (local)
  - H2: त्वरित समस्या निवारण
  - H2: Lifecycle
  - H2: यदि command गायब है
  - H2: Profiles
  - H2: Tabs
  - H2: Snapshot / screenshot / actions
  - H2: State और storage
  - H2: Debugging
  - H2: MCP के जरिए मौजूदा Chrome
  - H2: Remote browser control (node host proxy)
  - H2: संबंधित

## cli/channels.md

- मार्ग: /cli/channels
- शीर्षक:
  - H1: openclaw channels
  - H2: सामान्य commands
  - H2: Status / capabilities / resolve / logs
  - H2: अकाउंट जोड़ें / हटाएं
  - H2: Login और logout (interactive)
  - H2: समस्या निवारण
  - H2: Capabilities probe
  - H2: नामों को IDs में resolve करें
  - H2: संबंधित

## cli/clawbot.md

- मार्ग: /cli/clawbot
- शीर्षक:
  - H1: openclaw clawbot
  - H2: Migration
  - H2: संबंधित

## cli/commitments.md

- मार्ग: /cli/commitments
- शीर्षक:
  - H2: उपयोग
  - H2: विकल्प
  - H2: उदाहरण
  - H2: Output
  - H2: संबंधित

## cli/completion.md

- मार्ग: /cli/completion
- शीर्षक:
  - H1: openclaw completion
  - H2: उपयोग
  - H2: विकल्प
  - H2: नोट्स
  - H2: संबंधित

## cli/config.md

- मार्ग: /cli/config
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

- मार्ग: /cli/configure
- शीर्षक:
  - H1: openclaw configure
  - H2: विकल्प
  - H2: उदाहरण
  - H2: संबंधित

## cli/crestodian.md

- मार्ग: /cli/crestodian
- शीर्षक:
  - H1: openclaw crestodian
  - H2: Crestodian क्या दिखाता है
  - H2: उदाहरण
  - H2: Safe startup
  - H2: Operations और approval
  - H2: Setup bootstrap
  - H2: Model-Assisted Planner
  - H2: agent पर स्विच करना
  - H2: Message rescue mode
  - H2: संबंधित

## cli/cron.md

- मार्ग: /cli/cron
- शीर्षक:
  - H1: openclaw cron
  - H2: Jobs जल्दी बनाएं
  - H2: Sessions
  - H2: Delivery
  - H3: Delivery ownership
  - H3: Failure delivery
  - H2: Scheduling
  - H3: One-shot jobs
  - H3: Recurring jobs
  - H3: Manual runs
  - H2: Models
  - H3: Isolated Cron model precedence
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

- मार्ग: /cli/daemon
- शीर्षक:
  - H1: openclaw daemon
  - H2: उपयोग
  - H2: Subcommands
  - H2: सामान्य विकल्प
  - H2: Prefer
  - H2: संबंधित

## cli/dashboard.md

- मार्ग: /cli/dashboard
- शीर्षक:
  - H1: openclaw dashboard
  - H2: संबंधित

## cli/devices.md

- मार्ग: /cli/devices
- शीर्षक:
  - H1: openclaw devices
  - H2: Commands
  - H3: openclaw devices list
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Paperclip / openclawgateway first-run approval
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
  - H2: सामान्य विकल्प
  - H2: नोट्स
  - H2: Token drift recovery checklist
  - H2: संबंधित

## cli/directory.md

- मार्ग: /cli/directory
- शीर्षक:
  - H1: openclaw directory
  - H2: सामान्य flags
  - H2: नोट्स
  - H2: Message send के साथ results का उपयोग करना
  - H2: ID formats (channel के अनुसार)
  - H2: Self ("me")
  - H2: Peers (contacts/users)
  - H2: Groups
  - H2: संबंधित

## cli/dns.md

- मार्ग: /cli/dns
- शीर्षक:
  - H1: openclaw dns
  - H2: Setup
  - H2: dns setup
  - H2: संबंधित

## cli/docs.md

- मार्ग: /cli/docs
- शीर्षक:
  - H1: openclaw docs
  - H2: उपयोग
  - H2: उदाहरण
  - H2: यह कैसे काम करता है
  - H2: Output
  - H2: Exit codes
  - H2: संबंधित

## cli/doctor.md

- मार्ग: /cli/doctor
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

- मार्ग: /cli/flows
- शीर्षक:
  - H1: openclaw tasks flow
  - H2: Subcommands
  - H3: Status filter values
  - H2: उदाहरण
  - H2: संबंधित

## cli/gateway.md

- मार्ग: /cli/gateway
- शीर्षक:
  - H2: Gateway चलाएं
  - H3: विकल्प
  - H2: Gateway पुनरारंभ करें
  - H3: Gateway profiling
  - H2: चल रहे Gateway से क्वेरी करें
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: SSH के ऊपर remote (Mac app parity)
  - H3: gateway call
  - H2: Gateway service प्रबंधित करें
  - H3: wrapper के साथ इंस्टॉल करें
  - H2: gateways खोजें (Bonjour)
  - H3: gateway discover
  - H2: संबंधित

## cli/health.md

- मार्ग: /cli/health
- शीर्षक:
  - H1: openclaw health
  - H2: विकल्प
  - H2: संबंधित

## cli/hooks.md

- मार्ग: /cli/hooks
- शीर्षक:
  - H1: openclaw hooks
  - H2: सभी hooks सूचीबद्ध करें
  - H2: hook जानकारी प्राप्त करें
  - H2: hooks पात्रता जांचें
  - H2: Hook सक्षम करें
  - H2: Hook अक्षम करें
  - H2: टिप्पणियां
  - H2: hook packs इंस्टॉल करें
  - H2: hook packs अपडेट करें
  - H2: bundled hooks
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: संबंधित

## cli/index.md

- मार्ग: /cli
- शीर्षक:
  - H2: कमांड पृष्ठ
  - H2: वैश्विक flags
  - H2: आउटपुट मोड
  - H2: कमांड ट्री
  - H2: चैट slash commands
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
  - H2: इमेज
  - H2: ऑडियो
  - H2: TTS
  - H2: वीडियो
  - H2: Web
  - H2: एम्बेडिंग
  - H2: JSON आउटपुट
  - H2: सामान्य गलतियां
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/logs.md

- मार्ग: /cli/logs
- शीर्षक:
  - H1: openclaw logs
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
  - H3: serve कब उपयोग करें
  - H3: यह कैसे काम करता है
  - H3: client मोड चुनें
  - H3: serve क्या उजागर करता है
  - H3: उपयोग
  - H3: Bridge tools
  - H3: इवेंट मॉडल
  - H3: Claude चैनल notifications
  - H3: MCP client config
  - H3: विकल्प
  - H3: सुरक्षा और trust boundary
  - H3: टेस्टिंग
  - H3: समस्या निवारण
  - H2: MCP client registry के रूप में OpenClaw
  - H3: सहेजी गई MCP server definitions
  - H3: सामान्य server recipes
  - H3: JSON output shapes
  - H3: Stdio transport
  - H3: SSE / HTTP transport
  - H3: OAuth workflow
  - H3: Streamable HTTP transport
  - H2: Control UI
  - H2: वर्तमान सीमाएं
  - H2: संबंधित

## cli/memory.md

- मार्ग: /cli/memory
- शीर्षक:
  - H1: openclaw memory
  - H2: उदाहरण
  - H2: विकल्प
  - H2: Dreaming
  - H2: संबंधित

## cli/message.md

- मार्ग: /cli/message
- शीर्षक:
  - H1: openclaw message
  - H2: उपयोग
  - H2: सामान्य flags
  - H2: SecretRef व्यवहार
  - H2: Actions
  - H3: Core
  - H3: Threads
  - H3: Emojis
  - H3: Stickers
  - H3: Roles / Channels / Members / Voice
  - H3: Events
  - H3: Moderation (Discord)
  - H3: Broadcast
  - H2: उदाहरण
  - H2: संबंधित

## cli/migrate.md

- मार्ग: /cli/migrate
- शीर्षक:
  - H1: openclaw migrate
  - H2: कमांड
  - H2: सुरक्षा मॉडल
  - H2: Claude provider
  - H3: Claude क्या import करता है
  - H3: Archive और manual-review state
  - H2: Codex provider
  - H3: Codex क्या import करता है
  - H3: Manual-review Codex state
  - H2: Hermes provider
  - H3: Hermes क्या import करता है
  - H3: समर्थित .env keys
  - H3: Archive-only state
  - H3: लागू करने के बाद
  - H2: Plugin contract
  - H2: Onboarding integration
  - H2: संबंधित

## cli/models.md

- मार्ग: /cli/models
- शीर्षक:
  - H1: openclaw models
  - H2: सामान्य कमांड
  - H3: Models scan
  - H3: Models status
  - H2: Aliases + fallbacks
  - H2: Auth profiles
  - H2: संबंधित

## cli/node.md

- मार्ग: /cli/node
- शीर्षक:
  - H1: openclaw node
  - H2: node host का उपयोग क्यों करें?
  - H2: Browser proxy (zero-config)
  - H2: Run (foreground)
  - H2: node host के लिए Gateway auth
  - H2: Service (background)
  - H2: Pairing
  - H2: Exec approvals
  - H2: संबंधित

## cli/nodes.md

- मार्ग: /cli/nodes
- शीर्षक:
  - H1: openclaw nodes
  - H2: सामान्य कमांड
  - H2: Invoke
  - H2: संबंधित

## cli/onboard.md

- मार्ग: /cli/onboard
- शीर्षक:
  - H1: openclaw onboard
  - H2: संबंधित गाइड
  - H2: उदाहरण
  - H2: Locale
  - H3: Non-interactive Z.AI endpoint choices
  - H2: अतिरिक्त non-interactive flags
  - H2: Flow notes
  - H2: सामान्य follow-up commands

## cli/pairing.md

- मार्ग: /cli/pairing
- शीर्षक:
  - H1: openclaw pairing
  - H2: कमांड
  - H2: pairing list
  - H2: pairing approve
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/path.md

- मार्ग: /cli/path
- शीर्षक:
  - H1: openclaw path
  - H2: इसका उपयोग क्यों करें
  - H2: इसका उपयोग कैसे होता है
  - H2: यह कैसे काम करता है
  - H2: Subcommands
  - H2: Global flags
  - H2: oc:// syntax
  - H2: file kind द्वारा addressing
  - H2: Mutation contract
  - H2: उदाहरण
  - H2: file kind के अनुसार recipes
  - H3: Markdown
  - H3: JSONC
  - H3: JSONL
  - H3: YAML
  - H2: Subcommand reference
  - H3: resolve
  - H3: find
  - H3: set
  - H3: validate
  - H3: emit
  - H2: Exit codes
  - H2: Output mode
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/plugins.md

- मार्ग: /cli/plugins
- शीर्षक:
  - H2: कमांड
  - H3: Author
  - H3: Provider Scaffold
  - H3: Install
  - H4: Marketplace shorthand
  - H3: List
  - H3: Plugin index
  - H3: Uninstall
  - H3: Update
  - H3: Inspect
  - H3: Doctor
  - H3: Registry
  - H3: Marketplace
  - H2: संबंधित

## cli/policy.md

- मार्ग: /cli/policy
- शीर्षक:
  - H1: openclaw policy
  - H2: Quick start
  - H3: Policy rule reference
  - H4: Scoped overlays
  - H4: Channels
  - H4: MCP servers
  - H4: Model providers
  - H4: Network
  - H4: Ingress और channel access
  - H4: Gateway
  - H4: Agent workspace
  - H4: Sandbox posture
  - H4: Data Handling
  - H4: Secrets
  - H4: Exec approvals
  - H4: Auth profiles
  - H4: Tool metadata
  - H4: Tool posture
  - H2: policy कॉन्फिगर करें
  - H2: policy state स्वीकार करें
  - H2: Findings
  - H2: Repair
  - H2: Exit codes
  - H2: संबंधित

## cli/proxy.md

- मार्ग: /cli/proxy
- शीर्षक:
  - H1: openclaw proxy
  - H2: कमांड
  - H2: Validate
  - H2: Query presets
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
  - H2: उपयोग के मामले
  - H3: Docker image अपडेट करने के बाद
  - H3: sandbox configuration बदलने के बाद
  - H3: SSH target या SSH auth material बदलने के बाद
  - H3: OpenShell source, policy, या mode बदलने के बाद
  - H3: setupCommand बदलने के बाद
  - H3: केवल किसी विशिष्ट agent के लिए
  - H2: इसकी आवश्यकता क्यों है
  - H2: Registry migration
  - H2: Configuration
  - H2: संबंधित

## cli/secrets.md

- मार्ग: /cli/secrets
- शीर्षक:
  - H1: openclaw secrets
  - H2: runtime snapshot फिर से लोड करें
  - H2: Audit
  - H2: Configure (interactive helper)
  - H2: सहेजा गया plan लागू करें
  - H2: rollback backups क्यों नहीं
  - H2: उदाहरण
  - H2: संबंधित

## cli/security.md

- मार्ग: /cli/security
- शीर्षक:
  - H1: openclaw security
  - H2: Audit
  - H2: JSON output
  - H2: --fix क्या बदलता है
  - H2: संबंधित

## cli/sessions.md

- मार्ग: /cli/sessions
- शीर्षक:
  - H1: openclaw sessions
  - H2: Cleanup maintenance
  - H2: session compact करें
  - H3: sessions.compact RPC
  - H2: संबंधित

## cli/setup.md

- मार्ग: /cli/setup
- शीर्षक:
  - H1: openclaw setup
  - H2: विकल्प
  - H3: Baseline mode
  - H2: उदाहरण
  - H2: टिप्पणियां
  - H2: संबंधित

## cli/skills.md

- मार्ग: /cli/skills
- शीर्षक:
  - H1: openclaw skills
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
  - H1: openclaw system
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
  - H2: Root Options
  - H2: Subcommands
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
  - H1: openclaw transcripts
  - H2: कमांड
  - H2: आउटपुट
  - H2: प्रति दिन कई meetings
  - H2: Missing summaries
  - H2: Configuration

## cli/tui.md

- मार्ग: /cli/tui
- शीर्षक:
  - H1: openclaw tui
  - H2: विकल्प
  - H2: उदाहरण
  - H2: Config repair loop
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
  - H3: Control-plane response shape
  - H2: Git checkout flow
  - H3: Channel selection
  - H3: Update steps
  - H2: --update shorthand
  - H2: संबंधित

## cli/voicecall.md

- मार्ग: /cli/voicecall
- शीर्षक:
  - H1: openclaw voicecall
  - H2: Subcommands
  - H2: Setup और smoke
  - H3: setup
  - H3: smoke
  - H2: Call lifecycle
  - H3: call
  - H3: start
  - H3: continue
  - H3: speak
  - H3: dtmf
  - H3: end
  - H3: status
  - H2: Logs और metrics
  - H3: tail
  - H3: latency
  - H2: Webhooks उजागर करना
  - H3: expose
  - H2: संबंधित

## cli/webhooks.md

- मार्ग: /cli/webhooks
- शीर्षक:
  - H1: openclaw webhooks
  - H2: Subcommands
  - H2: webhooks gmail setup
  - H3: आवश्यक
  - H3: Pub/Sub options
  - H3: OpenClaw delivery options
  - H3: gog watch serve options
  - H3: Tailscale exposure
  - H3: आउटपुट
  - H2: webhooks gmail run
  - H2: End-to-end flow
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
  - H3: wiki ingest
  - H3: wiki okf import
  - H3: wiki compile
  - H3: wiki lint
  - H3: wiki search
  - H3: wiki get
  - H3: wiki apply
  - H3: wiki bridge import
  - H3: wiki unsafe-local import
  - H3: wiki obsidian ...
  - H2: व्यावहारिक उपयोग मार्गदर्शन
  - H2: Configuration tie-ins
  - H2: संबंधित

## cli/workboard.md

- मार्ग: /cli/workboard
- शीर्षक:
  - H2: उपयोग
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: Slash Command Parity
  - H2: Permissions
  - H2: समस्या निवारण
  - H3: कोई Cards दिखाई नहीं देते
  - H3: Dispatch Data-Only कहता है
  - H3: Dispatch कुछ भी शुरू नहीं करता
  - H2: संबंधित

## concepts/active-memory.md

- मार्ग: /concepts/active-memory
- शीर्षक:
  - H2: Quick start
  - H2: Speed recommendations
  - H3: Cerebras setup
  - H2: इसे कैसे देखें
  - H2: Session toggle
  - H2: यह कब चलता है
  - H2: Session types
  - H2: यह कहां चलता है
  - H2: इसका उपयोग क्यों करें
  - H2: यह कैसे काम करता है
  - H2: Query modes
  - H2: Prompt styles
  - H2: Model fallback policy
  - H2: Memory tools
  - H3: Built-in memory-core
  - H3: LanceDB memory
  - H3: Lossless Claw
  - H2: Advanced escape hatches
  - H2: Transcript persistence
  - H2: Configuration
  - H2: Recommended setup
  - H3: Cold-start grace
  - H2: Debugging
  - H2: सामान्य समस्याएं
  - H2: संबंधित पृष्ठ

## concepts/agent-loop.md

- मार्ग: /concepts/agent-loop
- शीर्षक:
  - H2: Entry points
  - H2: यह कैसे काम करता है (high-level)
  - H2: Queueing + concurrency
  - H2: Session + workspace preparation
  - H2: Prompt assembly + system prompt
  - H2: Hook points (जहां आप intercept कर सकते हैं)
  - H3: Internal hooks (Gateway hooks)
  - H3: Plugin hooks (agent + gateway lifecycle)
  - H2: Streaming + partial replies
  - H2: Tool execution + messaging tools
  - H2: Reply shaping + suppression
  - H2: Compaction + retries
  - H2: Event streams (आज)
  - H2: Chat channel handling
  - H2: Timeouts
  - H2: जहां चीजें जल्दी समाप्त हो सकती हैं
  - H2: संबंधित

## concepts/agent-runtimes.md

- मार्ग: /concepts/agent-runtimes
- शीर्षक:
  - H2: Codex surfaces
  - H2: Runtime ownership
  - H2: Runtime selection
  - H2: GitHub Copilot agent runtime
  - H2: Compatibility contract
  - H2: Status labels
  - H2: संबंधित

## concepts/agent-workspace.md

- मार्ग: /concepts/agent-workspace
- शीर्षक:
  - H2: डिफ़ॉल्ट स्थान
  - H2: अतिरिक्त workspace folders
  - H2: Workspace file map
  - H2: workspace में क्या नहीं है
  - H2: Git backup (अनुशंसित, निजी)
  - H2: secrets commit न करें
  - H2: workspace को नई मशीन पर ले जाना
  - H2: उन्नत टिप्पणियां
  - H2: संबंधित

## concepts/agent.md

- मार्ग: /concepts/agent
- शीर्षक:
  - H2: कार्यस्थान (आवश्यक)
  - H2: बूटस्ट्रैप फ़ाइलें (इंजेक्ट की गई)
  - H2: अंतर्निहित उपकरण
  - H2: Skills
  - H2: रनटाइम सीमाएँ
  - H2: सत्र
  - H2: स्ट्रीमिंग के दौरान निर्देशन
  - H2: मॉडल संदर्भ
  - H2: कॉन्फ़िगरेशन (न्यूनतम)
  - H2: संबंधित

## concepts/architecture.md

- मार्ग: /concepts/architecture
- शीर्षक:
  - H2: अवलोकन
  - H2: घटक और प्रवाह
  - H3: Gateway (डेमन)
  - H3: क्लाइंट (mac ऐप / CLI / वेब एडमिन)
  - H3: Node (macOS / iOS / Android / हेडलेस)
  - H3: WebChat
  - H2: कनेक्शन जीवनचक्र (एकल क्लाइंट)
  - H2: वायर प्रोटोकॉल (सारांश)
  - H2: पेयरिंग + स्थानीय भरोसा
  - H2: प्रोटोकॉल टाइपिंग और कोडजन
  - H2: रिमोट एक्सेस
  - H2: संचालन स्नैपशॉट
  - H2: अपरिवर्तनीयताएँ
  - H2: संबंधित

## concepts/channel-docking.md

- मार्ग: /concepts/channel-docking
- शीर्षक:
  - H2: उदाहरण
  - H2: इसका उपयोग क्यों करें
  - H2: आवश्यक कॉन्फ़िगरेशन
  - H2: कमांड
  - H2: क्या बदलता है
  - H2: क्या नहीं बदलता
  - H2: समस्या निवारण

## concepts/commitments.md

- मार्ग: /concepts/commitments
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

- मार्ग: /concepts/compaction
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: ऑटो-Compaction
  - H2: मैनुअल Compaction
  - H2: कॉन्फ़िगरेशन
  - H3: अलग मॉडल का उपयोग करना
  - H3: पहचानकर्ता संरक्षण
  - H3: सक्रिय ट्रांसक्रिप्ट बाइट गार्ड
  - H3: उत्तराधिकारी ट्रांसक्रिप्ट
  - H3: Compaction सूचनाएँ
  - H3: मेमोरी फ्लश
  - H2: प्लग करने योग्य Compaction प्रदाता
  - H2: Compaction बनाम प्रूनिंग
  - H2: समस्या निवारण
  - H2: संबंधित

## concepts/context-engine.md

- मार्ग: /concepts/context-engine
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: यह कैसे काम करता है
  - H3: सबएजेंट जीवनचक्र (वैकल्पिक)
  - H3: सिस्टम प्रॉम्प्ट जोड़
  - H2: लेगेसी इंजन
  - H2: Plugin इंजन
  - H3: ContextEngine इंटरफ़ेस
  - H3: रनटाइम सेटिंग्स
  - H3: होस्ट आवश्यकताएँ
  - H3: विफलता अलगाव
  - H3: ownsCompaction
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: Compaction और मेमोरी से संबंध
  - H2: सुझाव
  - H2: संबंधित

## concepts/context.md

- मार्ग: /concepts/context
- शीर्षक:
  - H2: त्वरित शुरुआत (कॉन्टेक्स्ट निरीक्षण करें)
  - H2: उदाहरण आउटपुट
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: कॉन्टेक्स्ट विंडो में क्या गिना जाता है
  - H2: OpenClaw सिस्टम प्रॉम्प्ट कैसे बनाता है
  - H2: इंजेक्ट की गई कार्यस्थान फ़ाइलें (प्रोजेक्ट कॉन्टेक्स्ट)
  - H2: Skills: इंजेक्टेड बनाम मांग पर लोडेड
  - H2: उपकरण: दो लागतें होती हैं
  - H2: कमांड, निर्देश, और "इनलाइन शॉर्टकट"
  - H2: सत्र, Compaction, और प्रूनिंग (क्या बना रहता है)
  - H2: /context वास्तव में क्या रिपोर्ट करता है
  - H2: संबंधित

## concepts/delegate-architecture.md

- मार्ग: /concepts/delegate-architecture
- शीर्षक:
  - H2: डेलीगेट क्या है?
  - H2: डेलीगेट क्यों?
  - H2: क्षमता स्तर
  - H3: स्तर 1: केवल-पढ़ें + ड्राफ्ट
  - H3: स्तर 2: ओर से भेजना
  - H3: स्तर 3: सक्रिय
  - H2: पूर्वापेक्षाएँ: अलगाव और हार्डनिंग
  - H3: हार्ड ब्लॉक (समझौता-रहित)
  - H3: उपकरण प्रतिबंध
  - H3: सैंडबॉक्स अलगाव
  - H3: ऑडिट ट्रेल
  - H2: डेलीगेट सेट अप करना
  - H3: 1. डेलीगेट एजेंट बनाएँ
  - H3: 2. आइडेंटिटी प्रोवाइडर डेलिगेशन कॉन्फ़िगर करें
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. डेलीगेट को चैनलों से बाँधें
  - H3: 4. डेलीगेट एजेंट में क्रेडेंशियल जोड़ें
  - H2: उदाहरण: संगठनात्मक सहायक
  - H2: स्केलिंग पैटर्न
  - H2: संबंधित

## concepts/dreaming.md

- मार्ग: /concepts/dreaming
- शीर्षक:
  - H2: Dreaming क्या लिखता है
  - H2: चरण मॉडल
  - H2: सत्र ट्रांसक्रिप्ट इनजेशन
  - H2: ड्रीम डायरी
  - H2: गहरे रैंकिंग संकेत
  - H2: QA शैडो ट्रायल रिपोर्ट कवरेज
  - H2: शेड्यूलिंग
  - H2: त्वरित शुरुआत
  - H2: स्लैश कमांड
  - H2: CLI वर्कफ़्लो
  - H2: मुख्य डिफ़ॉल्ट
  - H2: ड्रीम्स UI
  - H2: Dreaming कभी नहीं चलता: स्थिति अवरुद्ध दिखाती है
  - H2: संबंधित

## concepts/experimental-features.md

- मार्ग: /concepts/experimental-features
- शीर्षक:
  - H2: वर्तमान में प्रलेखित फ़्लैग
  - H2: स्थानीय मॉडल लीन मोड
  - H3: ये तीन उपकरण क्यों
  - H3: इसे कब चालू करें
  - H3: इसे कब बंद रखें
  - H3: सक्षम करें
  - H2: प्रयोगात्मक का अर्थ छिपा हुआ नहीं है
  - H2: संबंधित

## concepts/features.md

- मार्ग: /concepts/features
- शीर्षक:
  - H2: प्रमुख बातें
  - H2: पूरी सूची
  - H2: संबंधित

## concepts/mantis-slack-desktop-runbook.md

- मार्ग: /concepts/mantis-slack-desktop-runbook
- शीर्षक:
  - H2: स्टोरेज मॉडल
  - H2: GitHub डिस्पैच
  - H2: स्थानीय CLI
  - H2: हाइड्रेट मोड
  - H2: टाइमिंग व्याख्या
  - H2: साक्ष्य चेकलिस्ट
  - H2: विफलता प्रबंधन
  - H2: संबंधित

## concepts/mantis.md

- मार्ग: /concepts/mantis
- शीर्षक:
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: स्वामित्व
  - H2: कमांड आकार
  - H2: रन जीवनचक्र
  - H2: Discord MVP
  - H2: मौजूदा QA भाग
  - H2: साक्ष्य मॉडल
  - H2: ब्राउज़र और VNC
  - H2: मशीनें
  - H2: सीक्रेट
  - H2: GitHub आर्टिफैक्ट और PR टिप्पणियाँ
  - H2: निजी डिप्लॉयमेंट नोट्स
  - H2: परिदृश्य जोड़ना
  - H2: प्रदाता विस्तार
  - H2: खुले प्रश्न

## concepts/markdown-formatting.md

- मार्ग: /concepts/markdown-formatting
- शीर्षक:
  - H2: लक्ष्य
  - H2: पाइपलाइन
  - H2: IR उदाहरण
  - H2: जहाँ इसका उपयोग होता है
  - H2: टेबल हैंडलिंग
  - H2: चंकिंग नियम
  - H2: लिंक नीति
  - H2: स्पॉइलर
  - H2: चैनल फ़ॉर्मैटर कैसे जोड़ें या अपडेट करें
  - H2: सामान्य समस्याएँ
  - H2: संबंधित

## concepts/memory-builtin.md

- मार्ग: /concepts/memory-builtin
- शीर्षक:
  - H2: यह क्या प्रदान करता है
  - H2: शुरुआत करना
  - H2: समर्थित एम्बेडिंग प्रदाता
  - H2: इंडेक्सिंग कैसे काम करती है
  - H2: कब उपयोग करें
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन
  - H2: संबंधित

## concepts/memory-honcho.md

- मार्ग: /concepts/memory-honcho
- शीर्षक:
  - H2: यह क्या प्रदान करता है
  - H2: उपलब्ध उपकरण
  - H2: शुरुआत करना
  - H2: कॉन्फ़िगरेशन
  - H2: मौजूदा मेमोरी माइग्रेट करना
  - H2: यह कैसे काम करता है
  - H2: Honcho बनाम अंतर्निहित मेमोरी
  - H2: CLI कमांड
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/memory-qmd.md

- मार्ग: /concepts/memory-qmd
- शीर्षक:
  - H2: यह अंतर्निहित पर क्या जोड़ता है
  - H2: शुरुआत करना
  - H3: पूर्वापेक्षाएँ
  - H3: सक्षम करें
  - H2: साइडकार कैसे काम करता है
  - H2: खोज प्रदर्शन और संगतता
  - H2: मॉडल ओवरराइड
  - H2: अतिरिक्त पाथ इंडेक्स करना
  - H2: सत्र ट्रांसक्रिप्ट इंडेक्स करना
  - H2: खोज दायरा
  - H2: उद्धरण
  - H2: कब उपयोग करें
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन
  - H2: संबंधित

## concepts/memory-search.md

- मार्ग: /concepts/memory-search
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: समर्थित प्रदाता
  - H2: खोज कैसे काम करती है
  - H2: खोज गुणवत्ता सुधारना
  - H3: कालिक क्षय
  - H3: MMR (विविधता)
  - H3: दोनों सक्षम करें
  - H2: मल्टीमॉडल मेमोरी
  - H2: सत्र मेमोरी खोज
  - H2: समस्या निवारण
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/memory.md

- मार्ग: /concepts/memory
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: क्या कहाँ जाता है
  - H2: क्रिया-संवेदनशील मेमोरी
  - H2: अनुमानित प्रतिबद्धताएँ
  - H2: मेमोरी उपकरण
  - H2: मेमोरी Wiki साथी Plugin
  - H2: मेमोरी खोज
  - H2: मेमोरी बैकएंड
  - H2: ज्ञान wiki लेयर
  - H2: स्वचालित मेमोरी फ्लश
  - H2: Dreaming
  - H2: ग्राउंडेड बैकफ़िल और लाइव प्रमोशन
  - H2: CLI
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/message-lifecycle-refactor.md

- मार्ग: /concepts/message-lifecycle-refactor
- शीर्षक:
  - H2: समस्याएँ
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: संदर्भ मॉडल
  - H2: कोर मॉडल
  - H2: संदेश शब्द
  - H3: संदेश
  - H3: लक्ष्य
  - H3: संबंध
  - H3: उद्गम
  - H3: रसीद
  - H2: प्राप्ति कॉन्टेक्स्ट
  - H2: भेजने का कॉन्टेक्स्ट
  - H2: लाइव कॉन्टेक्स्ट
  - H2: एडाप्टर सतह
  - H2: सार्वजनिक SDK कमी
  - H2: चैनल इनबाउंड से संबंध
  - H2: संगतता गार्डरेल
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
  - H3: चरण 8: Turn-नामित संगतता हटाएँ
  - H2: परीक्षण योजना
  - H2: खुले प्रश्न
  - H2: स्वीकृति मानदंड
  - H2: संबंधित

## concepts/messages.md

- मार्ग: /concepts/messages
- शीर्षक:
  - H2: संदेश प्रवाह (उच्च स्तर)
  - H2: इनबाउंड डीड्यूप
  - H2: इनबाउंड डिबाउंसिंग
  - H2: सत्र और डिवाइस
  - H2: उपकरण परिणाम मेटाडेटा
  - H2: इनबाउंड बॉडी और इतिहास कॉन्टेक्स्ट
  - H2: क्यूइंग और फ़ॉलोअप
  - H2: चैनल रन स्वामित्व
  - H2: स्ट्रीमिंग, चंकिंग, और बैचिंग
  - H2: रीजनिंग दृश्यता और टोकन
  - H2: प्रीफ़िक्स, थ्रेडिंग, और उत्तर
  - H2: मौन उत्तर
  - H2: संबंधित

## concepts/model-failover.md

- मार्ग: /concepts/model-failover
- शीर्षक:
  - H2: रनटाइम प्रवाह
  - H2: चयन स्रोत नीति
  - H2: प्रमाणीकरण विफलता स्किप कैश
  - H2: उपयोगकर्ता-दृश्यमान फ़ॉलबैक सूचनाएँ
  - H2: प्रमाणीकरण स्टोरेज (कुंजियाँ + OAuth)
  - H2: प्रोफ़ाइल ID
  - H2: रोटेशन क्रम
  - H3: सत्र स्टिकिनेस (कैश-अनुकूल)
  - H3: OpenAI Codex सदस्यता प्लस API-कुंजी बैकअप
  - H2: कूलडाउन
  - H2: बिलिंग अक्षम करता है
  - H2: मॉडल फ़ॉलबैक
  - H3: उम्मीदवार श्रृंखला नियम
  - H3: कौन-सी त्रुटियाँ फ़ॉलबैक आगे बढ़ाती हैं
  - H3: कूलडाउन स्किप बनाम प्रोब व्यवहार
  - H2: सत्र ओवरराइड और लाइव मॉडल स्विचिंग
  - H2: ऑब्ज़र्वेबिलिटी और विफलता सारांश
  - H2: संबंधित कॉन्फ़िगरेशन

## concepts/model-providers.md

- मार्ग: /concepts/model-providers
- शीर्षक:
  - H2: त्वरित नियम
  - H2: Plugin-स्वामित्व वाला प्रदाता व्यवहार
  - H2: API कुंजी रोटेशन
  - H2: आधिकारिक प्रदाता Plugin
  - H3: OpenAI
  - H3: Anthropic
  - H3: OpenAI ChatGPT/Codex OAuth
  - H3: अन्य सदस्यता-शैली होस्टेड विकल्प
  - H3: OpenCode
  - H3: Google Gemini (API कुंजी)
  - H3: Google Vertex और Gemini CLI
  - H3: Z.AI (GLM)
  - H3: Vercel AI Gateway
  - H3: अन्य बंडल किए गए प्रदाता Plugin
  - H4: जानने योग्य विचित्रताएँ
  - H2: models.providers के माध्यम से प्रदाता (कस्टम/base URL)
  - H3: Moonshot AI (Kimi)
  - H3: Kimi कोडिंग
  - H3: Volcano Engine (Doubao)
  - H3: BytePlus (International)
  - H3: Synthetic
  - H3: MiniMax
  - H3: LM Studio
  - H3: Ollama
  - H3: vLLM
  - H3: SGLang
  - H3: स्थानीय प्रॉक्सी (LM Studio, vLLM, LiteLLM, आदि)
  - H2: CLI उदाहरण
  - H2: संबंधित

## concepts/models.md

- मार्ग: /concepts/models
- शीर्षक:
  - H2: मॉडल चयन कैसे काम करता है
  - H2: चयन स्रोत और फ़ॉलबैक व्यवहार
  - H2: त्वरित मॉडल नीति
  - H2: ऑनबोर्डिंग (अनुशंसित)
  - H2: कॉन्फ़िग कुंजियाँ (अवलोकन)
  - H3: सुरक्षित allowlist संपादन
  - H2: "Model is not allowed" (और उत्तर क्यों रुकते हैं)
  - H2: चैट में मॉडल बदलना (/model)
  - H2: CLI कमांड
  - H3: models list
  - H3: models status
  - H2: स्कैनिंग (OpenRouter मुफ़्त मॉडल)
  - H2: मॉडल रजिस्ट्री (models.json)
  - H2: संबंधित

## concepts/multi-agent.md

- मार्ग: /concepts/multi-agent
- शीर्षक:
  - H2: "एक एजेंट" क्या है?
  - H2: पाथ (त्वरित मैप)
  - H3: एकल-एजेंट मोड (डिफ़ॉल्ट)
  - H2: एजेंट सहायक
  - H2: त्वरित शुरुआत
  - H2: कई एजेंट = कई लोग, कई व्यक्तित्व
  - H2: क्रॉस-एजेंट QMD मेमोरी खोज
  - H2: एक WhatsApp नंबर, कई लोग (DM विभाजन)
  - H2: रूटिंग नियम (संदेश एजेंट कैसे चुनते हैं)
  - H2: कई खाते / फ़ोन नंबर
  - H2: अवधारणाएँ
  - H2: प्लेटफ़ॉर्म उदाहरण
  - H2: सामान्य पैटर्न
  - H2: प्रति-एजेंट सैंडबॉक्स और उपकरण कॉन्फ़िगरेशन
  - H2: संबंधित

## concepts/oauth.md

- मार्ग: /concepts/oauth
- शीर्षक:
  - H2: टोकन सिंक (यह क्यों मौजूद है)
  - H2: स्टोरेज (टोकन कहाँ रहते हैं)
  - H2: Anthropic लेगेसी टोकन संगतता
  - H2: Anthropic Claude CLI माइग्रेशन
  - H2: OAuth एक्सचेंज (लॉगिन कैसे काम करता है)
  - H3: Anthropic setup-token
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: रिफ़्रेश + समाप्ति
  - H2: कई खाते (प्रोफ़ाइल) + रूटिंग
  - H3: 1) पसंदीदा: अलग-अलग एजेंट
  - H3: 2) उन्नत: एक एजेंट में कई प्रोफ़ाइल
  - H2: संबंधित

## concepts/parallel-specialist-lanes.md

- मार्ग: /concepts/parallel-specialist-lanes
- शीर्षक:
  - H2: प्रथम सिद्धांत
  - H2: अनुशंसित रोलआउट
  - H3: चरण 1: लेन अनुबंध + पृष्ठभूमि में भारी कार्य
  - H3: चरण 2: प्राथमिकता और समवर्ती नियंत्रण
  - H3: चरण 3: समन्वयक / ट्रैफिक नियंत्रक
  - H2: न्यूनतम लेन अनुबंध टेम्पलेट
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
  - H2: उत्पादक (उपस्थिति कहाँ से आती है)
  - H3: 1) Gateway स्वयं प्रविष्टि
  - H3: 2) WebSocket कनेक्ट
  - H4: एकबारगी CLI कमांड क्यों दिखाई नहीं देते
  - H3: 3) system-event बीकन
  - H3: 4) Node कनेक्ट होते हैं (भूमिका: node)
  - H2: मर्ज + डीडुप नियम (instanceId क्यों मायने रखता है)
  - H2: TTL और सीमित आकार
  - H2: रिमोट/टनल सावधानी (लूपबैक IP)
  - H2: उपभोक्ता
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
  - H2: ऑपरेटर प्रवाह
  - H2: लाइव ट्रांसपोर्ट कवरेज
  - H2: Telegram, Discord, Slack, और WhatsApp QA संदर्भ
  - H3: साझा CLI फ्लैग
  - H3: Telegram QA
  - H3: Discord QA
  - H3: Slack QA
  - H4: Slack कार्यक्षेत्र सेट अप करना
  - H3: WhatsApp QA
  - H3: Convex क्रेडेंशियल पूल
  - H2: रेपो-समर्थित सीड
  - H2: प्रदाता मॉक लेन
  - H2: ट्रांसपोर्ट एडेप्टर
  - H3: चैनल जोड़ना
  - H3: परिदृश्य सहायक नाम
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
  - H2: पर्यावरण चर
  - H2: आउटपुट आर्टिफैक्ट
  - H2: ट्रायाज सुझाव
  - H2: लाइव ट्रांसपोर्ट अनुबंध
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
  - H2: क्यू मोड
  - H2: क्यू विकल्प
  - H2: संचालन और स्ट्रीमिंग
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
  - H2: लेगेसी छवि सफ़ाई
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
  - H2: स्थिति और ऑर्केस्ट्रेशन सहायक
  - H2: उप-एजेंट स्पॉन करना
  - H2: दृश्यता
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/session.md

- मार्ग: /concepts/session
- शीर्षक:
  - H2: संदेश कैसे रूट होते हैं
  - H2: DM अलगाव
  - H3: डॉक लिंक किए गए चैनल
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
  - H2: चंकिंग एल्गोरिदम (निम्न/उच्च सीमाएँ)
  - H2: कोएलसिंग (स्ट्रीम किए गए ब्लॉक मर्ज करें)
  - H2: ब्लॉकों के बीच मानव-जैसी गति
  - H2: "चंक स्ट्रीम करें या सब कुछ"
  - H2: प्रीव्यू स्ट्रीमिंग मोड
  - H3: चैनल मैपिंग
  - H3: रनटाइम व्यवहार
  - H3: टूल-प्रगति प्रीव्यू अपडेट
  - H3: कमेंट्री प्रगति लेन
  - H2: संबंधित

## concepts/system-prompt.md

- मार्ग: /concepts/system-prompt
- शीर्षक:
  - H2: संरचना
  - H2: प्रॉम्प्ट मोड
  - H2: प्रॉम्प्ट स्नैपशॉट
  - H2: कार्यक्षेत्र बूटस्ट्रैप इंजेक्शन
  - H2: समय प्रबंधन
  - H2: Skills
  - H2: दस्तावेज़ीकरण
  - H2: संबंधित

## concepts/timezone.md

- मार्ग: /concepts/timezone
- शीर्षक:
  - H2: तीन समयक्षेत्र सतहें
  - H2: उपयोगकर्ता समयक्षेत्र सेट करना
  - H2: कब ओवरराइड करें
  - H2: संबंधित

## concepts/typebox.md

- मार्ग: /concepts/typebox
- शीर्षक:
  - H2: मानसिक मॉडल (30 सेकंड)
  - H2: स्कीमा कहाँ रहते हैं
  - H2: वर्तमान पाइपलाइन
  - H2: रनटाइम पर स्कीमा कैसे उपयोग होते हैं
  - H2: उदाहरण फ़्रेम
  - H2: न्यूनतम क्लाइंट (Node.js)
  - H2: कार्य किया हुआ उदाहरण: एक मेथड शुरू से अंत तक जोड़ें
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
  - H3: तीन अलग-अलग सत्र स्थितियाँ
  - H3: प्राथमिकता क्रम
  - H3: रीसेट करना बनाम बंद करना
  - H3: टॉगल व्यवहार
  - H3: कॉन्फ़िग
  - H2: कस्टम /usage पूर्ण फ़ुटर
  - H3: आकार
  - H3: अनुबंध पथ
  - H3: क्रियाएँ
  - H3: पीस फ़ॉर्म
  - H3: उदाहरण
  - H2: प्रदाता + क्रेडेंशियल
  - H2: संबंधित

## date-time.md

- मार्ग: /date-time
- शीर्षक:
  - H2: संदेश एनवलप (डिफ़ॉल्ट रूप से स्थानीय)
  - H3: उदाहरण
  - H2: सिस्टम प्रॉम्प्ट: वर्तमान दिनांक और समय
  - H2: सिस्टम इवेंट पंक्तियाँ (डिफ़ॉल्ट रूप से स्थानीय)
  - H3: उपयोगकर्ता समयक्षेत्र + फ़ॉर्मैट कॉन्फ़िगर करें
  - H2: समय फ़ॉर्मैट पहचान (स्वचालित)
  - H2: टूल पेलोड + कनेक्टर (कच्चा प्रदाता समय + सामान्यीकृत फ़ील्ड)
  - H2: संबंधित दस्तावेज़

## debug/node-issue.md

- मार्ग: /debug/node-issue
- शीर्षक:
  - H1: Node + tsx "\\name is not a function" क्रैश
  - H2: सारांश
  - H2: पर्यावरण
  - H2: पुनरुत्पादन (केवल Node)
  - H2: रेपो में न्यूनतम पुनरुत्पादन
  - H2: Node संस्करण जाँच
  - H2: नोट्स / परिकल्पना
  - H2: रिग्रेशन इतिहास
  - H2: वर्कअराउंड
  - H2: संदर्भ
  - H2: अगले चरण
  - H2: संबंधित

## diagnostics/flags.md

- मार्ग: /diagnostics/flags
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: कॉन्फ़िग के माध्यम से सक्षम करें
  - H2: env ओवरराइड (एकबारगी)
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
  - H2: मॉडल प्रमाणीकरण स्थिति जाँचना
  - H2: API कुंजी रोटेशन व्यवहार (gateway)
  - H2: gateway चलते समय प्रदाता प्रमाणीकरण हटाना
  - H2: कौन सा क्रेडेंशियल उपयोग हो, नियंत्रित करना
  - H3: OpenAI और लेगेसी openai-codex ids
  - H3: लॉगिन के दौरान (CLI)
  - H3: प्रति-सत्र (चैट कमांड)
  - H3: प्रति-एजेंट (CLI ओवरराइड)
  - H2: समस्या निवारण
  - H3: "कोई क्रेडेंशियल नहीं मिला"
  - H3: टोकन समाप्त हो रहा/समाप्त हो चुका
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
  - H2: iOS Node पर डीबगिंग
  - H2: Bonjour कब सक्षम करें
  - H2: Bonjour कब अक्षम करें
  - H2: Docker गॉचा
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
  - H2: शुरुआती लोगों के लिए अनुकूल त्वरित शुरुआत
  - H2: इसे फ़ॉलबैक के रूप में उपयोग करना
  - H2: कॉन्फ़िगरेशन अवलोकन
  - H3: उदाहरण कॉन्फ़िगरेशन
  - H2: यह कैसे काम करता है
  - H2: सत्र
  - H2: claude-cli सत्रों से फ़ॉलबैक प्रील्यूड
  - H2: छवियाँ (पास-थ्रू)
  - H2: इनपुट / आउटपुट
  - H2: डिफ़ॉल्ट (Plugin-स्वामित्व)
  - H2: Plugin-स्वामित्व वाले डिफ़ॉल्ट
  - H2: नेटिव Compaction स्वामित्व
  - H2: MCP ओवरले बंडल करें
  - H2: इतिहास सीमा फिर से सीड करें
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
  - H3: संदर्भ बजट स्वामित्व मानचित्र
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
  - H3: टाइपिंग संकेतक
  - H3: agents.defaults.sandbox
  - H3: agents.list (प्रति-एजेंट ओवरराइड)
  - H2: मल्टी-एजेंट रूटिंग
  - H3: बाइंडिंग मिलान फ़ील्ड
  - H3: प्रति-एजेंट एक्सेस प्रोफ़ाइल
  - H2: सत्र
  - H2: संदेश
  - H3: प्रतिक्रिया प्रीफ़िक्स
  - H3: Ack प्रतिक्रिया
  - H3: इनबाउंड डिबाउंस
  - H3: TTS (टेक्स्ट-टू-स्पीच)
  - H2: बातचीत
  - H2: संबंधित

## gateway/config-channels.md

- मार्ग: /gateway/config-channels
- शीर्षक:
  - H2: चैनल
  - H3: DM और समूह एक्सेस
  - H3: चैनल मॉडल ओवरराइड
  - H3: चैनल डिफ़ॉल्ट और Heartbeat
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
  - H3: मल्टी-अकाउंट (सभी चैनल)
  - H3: अन्य Plugin चैनल
  - H3: समूह चैट उल्लेख गेटिंग
  - H4: DM इतिहास सीमाएँ
  - H4: स्वयं-चैट मोड
  - H3: कमांड (चैट कमांड हैंडलिंग)
  - H2: संबंधित

## gateway/config-tools.md

- रूट: /gateway/config-tools
- शीर्षक:
  - H2: टूल्स
  - H3: टूल प्रोफ़ाइल
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

- रूट: /gateway/configuration-examples
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: बिल्कुल न्यूनतम
  - H3: अनुशंसित शुरुआती कॉन्फ़िगरेशन
  - H2: विस्तारित उदाहरण (मुख्य विकल्प)
  - H3: सिमलिंक किया गया सिबलिंग skill रिपॉज़िटरी
  - H2: सामान्य पैटर्न
  - H3: एक ओवरराइड के साथ साझा skill आधार
  - H3: बहु-प्लैटफ़ॉर्म सेटअप
  - H3: विश्वसनीय नोड नेटवर्क स्वतः-अनुमोदन
  - H3: सुरक्षित DM मोड (साझा इनबॉक्स / बहु-उपयोगकर्ता DMs)
  - H3: Anthropic API कुंजी + MiniMax फ़ॉलबैक
  - H3: कार्य bot (प्रतिबंधित पहुँच)
  - H3: केवल स्थानीय मॉडल
  - H2: सुझाव
  - H2: संबंधित

## gateway/configuration-reference.md

- रूट: /gateway/configuration-reference
- शीर्षक:
  - H2: चैनल
  - H2: एजेंट डिफ़ॉल्ट, बहु-एजेंट, सेशन और संदेश
  - H2: टूल्स और कस्टम प्रदाता
  - H2: मॉडल
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Codex हार्नेस Plugin कॉन्फ़िगरेशन
  - H2: प्रतिबद्धताएँ
  - H2: ब्राउज़र
  - H2: UI
  - H2: Gateway
  - H3: OpenAI-संगत एंडपॉइंट
  - H3: बहु-इंस्टेंस आइसोलेशन
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: हुक्स
  - H3: Gmail इंटीग्रेशन
  - H2: कैनवास Plugin होस्ट
  - H2: डिस्कवरी
  - H3: mDNS (Bonjour)
  - H3: वाइड-एरिया (DNS-SD)
  - H2: वातावरण
  - H3: env (इनलाइन env vars)
  - H3: Env var प्रतिस्थापन
  - H2: सीक्रेट्स
  - H3: SecretRef
  - H3: समर्थित क्रेडेंशियल सतह
  - H3: सीक्रेट प्रदाता कॉन्फ़िगरेशन
  - H2: Auth स्टोरेज
  - H3: auth.cooldowns
  - H2: लॉगिंग
  - H2: डायग्नॉस्टिक्स
  - H2: अपडेट
  - H2: ACP
  - H2: CLI
  - H2: विज़ार्ड
  - H2: पहचान
  - H2: ब्रिज (लीगेसी, हटाया गया)
  - H2: Cron
  - H3: cron.retry
  - H3: cron.failureAlert
  - H3: cron.failureDestination
  - H2: मीडिया मॉडल टेम्पलेट वैरिएबल
  - H2: कॉन्फ़िगरेशन includes ($include)
  - H2: संबंधित

## gateway/configuration.md

- रूट: /gateway/configuration
- शीर्षक:
  - H2: न्यूनतम कॉन्फ़िगरेशन
  - H2: कॉन्फ़िगरेशन संपादित करना
  - H2: सख्त वैलिडेशन
  - H2: सामान्य कार्य
  - H2: कॉन्फ़िगरेशन हॉट रीलोड
  - H3: रीलोड मोड
  - H3: क्या हॉट-अप्लाई होता है बनाम किसे रीस्टार्ट चाहिए
  - H3: रीलोड योजना
  - H2: कॉन्फ़िगरेशन RPC (प्रोग्रामेटिक अपडेट)
  - H2: पर्यावरण वैरिएबल
  - H2: पूरा संदर्भ
  - H2: संबंधित

## gateway/diagnostics.md

- रूट: /gateway/diagnostics
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: चैट कमांड
  - H2: एक्सपोर्ट में क्या शामिल है
  - H2: गोपनीयता मॉडल
  - H2: स्थिरता रिकॉर्डर
  - H2: उपयोगी विकल्प
  - H2: डायग्नॉस्टिक्स अक्षम करें
  - H2: संबंधित

## gateway/discovery.md

- रूट: /gateway/discovery
- शीर्षक:
  - H2: शब्दावली
  - H2: हम डायरेक्ट और SSH दोनों क्यों रखते हैं
  - H2: डिस्कवरी इनपुट (क्लाइंट कैसे जानें कि gateway कहाँ है)
  - H3: 1) Bonjour / DNS-SD डिस्कवरी
  - H4: सेवा बीकन विवरण
  - H3: 2) Tailnet (क्रॉस-नेटवर्क)
  - H3: 3) मैनुअल / SSH लक्ष्य
  - H2: ट्रांसपोर्ट चयन (क्लाइंट नीति)
  - H2: पेयरिंग + auth (डायरेक्ट ट्रांसपोर्ट)
  - H2: घटक के अनुसार ज़िम्मेदारियाँ
  - H2: संबंधित

## gateway/doctor.md

- रूट: /gateway/doctor
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: हेडलेस और ऑटोमेशन मोड
  - H2: रीड-ओनली लिंट मोड
  - H2: यह क्या करता है (सारांश)
  - H2: Dreams UI बैकफ़िल और रीसेट
  - H2: विस्तृत व्यवहार और तर्क
  - H2: संबंधित

## gateway/external-apps.md

- रूट: /gateway/external-apps
- शीर्षक:
  - H2: आज क्या उपलब्ध है
  - H2: अनुशंसित मार्ग
  - H2: ऐप कोड बनाम Plugin कोड
  - H2: संबंधित

## gateway/gateway-lock.md

- रूट: /gateway/gateway-lock
- शीर्षक:
  - H2: क्यों
  - H2: तंत्र
  - H2: त्रुटि सतह
  - H2: संचालन संबंधी नोट्स
  - H2: संबंधित

## gateway/health.md

- रूट: /gateway/health
- शीर्षक:
  - H2: त्वरित जाँचें
  - H2: गहन डायग्नॉस्टिक्स
  - H2: हेल्थ मॉनिटर कॉन्फ़िगरेशन
  - H2: अपटाइम मॉनिटरिंग
  - H3: मॉनिटरिंग सेवा सेटअप उदाहरण
  - H2: जब कुछ विफल हो
  - H2: समर्पित "health" कमांड
  - H2: संबंधित

## gateway/heartbeat.md

- रूट: /gateway/heartbeat
- शीर्षक:
  - H2: त्वरित शुरुआत (शुरुआती)
  - H2: डिफ़ॉल्ट्स
  - H2: heartbeat प्रॉम्प्ट किसके लिए है
  - H2: प्रतिक्रिया अनुबंध
  - H2: कॉन्फ़िगरेशन
  - H3: स्कोप और प्राथमिकता
  - H3: प्रति-एजेंट heartbeats
  - H3: सक्रिय घंटे उदाहरण
  - H3: 24/7 सेटअप
  - H3: बहु-अकाउंट उदाहरण
  - H3: फ़ील्ड नोट्स
  - H2: डिलीवरी व्यवहार
  - H2: दृश्यता नियंत्रण
  - H3: प्रत्येक फ़्लैग क्या करता है
  - H3: प्रति-चैनल बनाम प्रति-अकाउंट उदाहरण
  - H3: सामान्य पैटर्न
  - H2: HEARTBEAT.md (वैकल्पिक)
  - H3: tasks: ब्लॉक
  - H3: क्या एजेंट HEARTBEAT.md अपडेट कर सकता है?
  - H2: मैनुअल वेक (मांग पर)
  - H2: रीजनिंग डिलीवरी (वैकल्पिक)
  - H2: लागत जागरूकता
  - H2: heartbeat के बाद संदर्भ ओवरफ़्लो
  - H2: संबंधित

## gateway/index.md

- रूट: /gateway
- शीर्षक:
  - H2: 5-मिनट स्थानीय स्टार्टअप
  - H2: रनटाइम मॉडल
  - H2: OpenAI-संगत एंडपॉइंट
  - H3: पोर्ट और बाइंड प्राथमिकता
  - H3: हॉट रीलोड मोड
  - H2: ऑपरेटर कमांड सेट
  - H2: कई gateways (एक ही होस्ट)
  - H2: दूरस्थ पहुँच
  - H2: सुपरविज़न और सेवा जीवनचक्र
  - H2: देव प्रोफ़ाइल त्वरित पथ
  - H2: प्रोटोकॉल त्वरित संदर्भ (ऑपरेटर दृश्य)
  - H2: संचालन संबंधी जाँचें
  - H3: सक्रियता
  - H3: तत्परता
  - H3: गैप रिकवरी
  - H2: सामान्य विफलता संकेत
  - H2: सुरक्षा गारंटी
  - H2: संबंधित

## gateway/local-model-services.md

- रूट: /gateway/local-model-services
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: कॉन्फ़िगरेशन आकार
  - H2: फ़ील्ड्स
  - H2: Inferrs उदाहरण
  - H2: ds4 उदाहरण
  - H2: संचालन संबंधी नोट्स
  - H2: संबंधित

## gateway/local-models.md

- रूट: /gateway/local-models
- शीर्षक:
  - H2: हार्डवेयर न्यूनतम स्तर
  - H2: बैकएंड चुनें
  - H2: अनुशंसित: LM Studio + बड़ा स्थानीय मॉडल (Responses API)
  - H3: हाइब्रिड कॉन्फ़िगरेशन: होस्टेड प्राथमिक, स्थानीय फ़ॉलबैक
  - H3: होस्टेड सुरक्षा नेट के साथ लोकल-फ़र्स्ट
  - H3: क्षेत्रीय होस्टिंग / डेटा रूटिंग
  - H2: अन्य OpenAI-संगत स्थानीय प्रॉक्सी
  - H2: छोटे या अधिक सख्त बैकएंड
  - H2: समस्या निवारण
  - H2: संबंधित

## gateway/logging.md

- रूट: /gateway/logging
- शीर्षक:
  - H1: लॉगिंग
  - H2: फ़ाइल-आधारित लॉगर
  - H2: कंसोल कैप्चर
  - H2: रिडैक्शन
  - H2: Gateway WebSocket लॉग्स
  - H3: WS लॉग शैली
  - H2: कंसोल फ़ॉर्मैटिंग (सब-सिस्टम लॉगिंग)
  - H2: संबंधित

## gateway/multiple-gateways.md

- रूट: /gateway/multiple-gateways
- शीर्षक:
  - H2: सर्वोत्तम अनुशंसित सेटअप
  - H2: Rescue-Bot त्वरित शुरुआत
  - H2: यह क्यों काम करता है
  - H2: --profile rescue onboard क्या बदलता है
  - H2: सामान्य बहु-gateway सेटअप
  - H2: आइसोलेशन चेकलिस्ट
  - H2: पोर्ट मैपिंग (व्युत्पन्न)
  - H2: ब्राउज़र/CDP नोट्स (सामान्य गलती)
  - H2: मैनुअल env उदाहरण
  - H2: त्वरित जाँचें
  - H2: संबंधित

## gateway/network-model.md

- रूट: /gateway/network-model
- शीर्षक:
  - H2: संबंधित

## gateway/openai-http-api.md

- रूट: /gateway/openai-http-api
- शीर्षक:
  - H2: प्रमाणीकरण
  - H2: सुरक्षा सीमा (महत्वपूर्ण)
  - H2: इस एंडपॉइंट का उपयोग कब करें
  - H2: एजेंट-फ़र्स्ट मॉडल अनुबंध
  - H2: एंडपॉइंट सक्षम करना
  - H2: एंडपॉइंट अक्षम करना
  - H2: सेशन व्यवहार
  - H2: यह सतह क्यों मायने रखती है
  - H2: मॉडल सूची और एजेंट रूटिंग
  - H2: स्ट्रीमिंग (SSE)
  - H2: चैट टूल अनुबंध
  - H3: समर्थित अनुरोध फ़ील्ड्स
  - H3: असमर्थित वैरिएंट
  - H3: नॉन-स्ट्रीमिंग टूल प्रतिक्रिया आकार
  - H3: स्ट्रीमिंग टूल प्रतिक्रिया आकार
  - H3: टूल फ़ॉलो-अप लूप
  - H2: Open WebUI त्वरित सेटअप
  - H2: उदाहरण
  - H2: संबंधित

## gateway/openresponses-http-api.md

- रूट: /gateway/openresponses-http-api
- शीर्षक:
  - H2: प्रमाणीकरण, सुरक्षा और रूटिंग
  - H2: सेशन व्यवहार
  - H2: अनुरोध आकार (समर्थित)
  - H2: आइटम (इनपुट)
  - H3: message
  - H3: functioncalloutput (टर्न-आधारित टूल्स)
  - H3: reasoning और itemreference
  - H2: टूल्स (क्लाइंट-साइड function टूल्स)
  - H2: इमेजेस (inputimage)
  - H2: फ़ाइलें (inputfile)
  - H2: फ़ाइल + इमेज सीमाएँ (कॉन्फ़िगरेशन)
  - H2: स्ट्रीमिंग (SSE)
  - H2: उपयोग
  - H2: त्रुटियाँ
  - H2: उदाहरण
  - H2: संबंधित

## gateway/openshell.md

- रूट: /gateway/openshell
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: त्वरित शुरुआत
  - H2: वर्कस्पेस मोड
  - H3: mirror
  - H3: remote
  - H3: मोड चुनना
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: उदाहरण
  - H3: न्यूनतम remote सेटअप
  - H3: GPU के साथ Mirror मोड
  - H3: कस्टम gateway के साथ प्रति-एजेंट OpenShell
  - H2: जीवनचक्र प्रबंधन
  - H3: कब फिर से बनाना है
  - H2: सुरक्षा हार्डनिंग
  - H2: वर्तमान सीमाएँ
  - H2: यह कैसे काम करता है
  - H2: संबंधित

## gateway/opentelemetry.md

- रूट: /gateway/opentelemetry
- शीर्षक:
  - H2: यह साथ में कैसे फ़िट होता है
  - H2: त्वरित शुरुआत
  - H2: एक्सपोर्ट किए गए सिग्नल
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H3: पर्यावरण वैरिएबल
  - H2: गोपनीयता और कंटेंट कैप्चर
  - H2: सैंपलिंग और फ़्लशिंग
  - H2: एक्सपोर्टेड मेट्रिक्स
  - H3: मॉडल उपयोग
  - H3: संदेश प्रवाह
  - H3: बातचीत
  - H3: कतारें और सेशन
  - H3: सेशन सक्रियता टेलीमेट्री
  - H3: हार्नेस जीवनचक्र
  - H3: टूल निष्पादन
  - H3: Exec
  - H3: डायग्नॉस्टिक्स आंतरिक विवरण (मेमोरी और टूल लूप)
  - H2: एक्सपोर्ट किए गए स्पैन
  - H2: डायग्नॉस्टिक इवेंट कैटलॉग
  - H2: एक्सपोर्टर के बिना
  - H2: अक्षम करें
  - H2: संबंधित

## gateway/operator-scopes.md

- रूट: /gateway/operator-scopes
- शीर्षक:
  - H2: भूमिकाएँ
  - H2: स्कोप स्तर
  - H2: मेथड स्कोप केवल पहला गेट है
  - H2: डिवाइस पेयरिंग अनुमोदन
  - H2: नोड पेयरिंग अनुमोदन
  - H2: साझा-सीक्रेट auth

## gateway/pairing.md

- रूट: /gateway/pairing
- शीर्षक:
  - H2: अवधारणाएँ
  - H2: पेयरिंग कैसे काम करती है
  - H2: CLI वर्कफ़्लो (हेडलेस के अनुकूल)
  - H2: API सतह (gateway प्रोटोकॉल)
  - H2: नोड कमांड gating (2026.3.31+)
  - H2: नोड इवेंट ट्रस्ट सीमाएँ (2026.3.31+)
  - H2: स्वतः-अनुमोदन (macOS ऐप)
  - H2: Trusted-CIDR डिवाइस स्वतः-अनुमोदन
  - H2: मेटाडेटा-अपग्रेड स्वतः-अनुमोदन
  - H2: QR पेयरिंग सहायक
  - H2: स्थानीयता और forwarded headers
  - H2: स्टोरेज (स्थानीय, निजी)
  - H2: ट्रांसपोर्ट व्यवहार
  - H2: संबंधित

## gateway/prometheus.md

- रूट: /gateway/prometheus
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: एक्सपोर्ट किए गए मेट्रिक्स
  - H2: लेबल नीति
  - H2: PromQL रेसिपी
  - H2: Prometheus और OpenTelemetry export के बीच चयन
  - H2: समस्या निवारण
  - H2: संबंधित

## gateway/protocol.md

- रूट: /gateway/protocol
- शीर्षक:
  - H2: ट्रांसपोर्ट
  - H2: हैंडशेक (कनेक्ट)
  - H3: Node उदाहरण
  - H2: फ़्रेमिंग
  - H2: भूमिकाएँ + स्कोप
  - H3: भूमिकाएँ
  - H3: स्कोप (ऑपरेटर)
  - H3: कैप्स/कमांड/अनुमतियाँ (नोड)
  - H2: उपस्थिति
  - H3: नोड बैकग्राउंड alive इवेंट
  - H2: ब्रॉडकास्ट इवेंट स्कोपिंग
  - H2: सामान्य RPC मेथड परिवार
  - H3: सामान्य इवेंट परिवार
  - H3: नोड हेल्पर मेथड्स
  - H3: कार्य लेजर RPCs
  - H3: ऑपरेटर हेल्पर मेथड्स
  - H3: models.list दृश्य
  - H2: Exec अनुमोदन
  - H2: एजेंट डिलीवरी फ़ॉलबैक
  - H2: वर्ज़निंग
  - H3: क्लाइंट constants
  - H2: Auth
  - H2: डिवाइस पहचान + पेयरिंग
  - H3: डिवाइस auth माइग्रेशन डायग्नॉस्टिक्स
  - H2: TLS + पिनिंग
  - H2: स्कोप
  - H2: संबंधित

## gateway/remote-gateway-readme.md

- रूट: /gateway/remote-gateway-readme
- शीर्षक:
  - H1: Remote Gateway के साथ OpenClaw.app चलाना
  - H2: अवलोकन
  - H2: त्वरित सेटअप
  - H3: चरण 1: SSH Config जोड़ें
  - H3: चरण 2: SSH Key कॉपी करें
  - H3: चरण 3: Remote Gateway Auth कॉन्फ़िगर करें
  - H3: चरण 4: SSH Tunnel शुरू करें
  - H3: चरण 5: OpenClaw.app रीस्टार्ट करें
  - H2: लॉगिन पर Tunnel स्वतः शुरू करें
  - H3: PLIST फ़ाइल बनाएँ
  - H3: Launch Agent लोड करें
  - H2: समस्या निवारण
  - H2: यह कैसे काम करता है
  - H2: संबंधित

## gateway/remote.md

- मार्ग: /gateway/remote
- शीर्षक:
  - H2: मुख्य विचार
  - H2: सामान्य VPN और tailnet सेटअप
  - H3: आपके tailnet में हमेशा चालू Gateway
  - H3: होम डेस्कटॉप Gateway चलाता है
  - H3: लैपटॉप Gateway चलाता है
  - H2: कमांड प्रवाह (क्या कहां चलता है)
  - H2: SSH टनल (CLI + टूल)
  - H2: CLI रिमोट डिफॉल्ट
  - H2: क्रेडेंशियल प्राथमिकता
  - H2: चैट UI रिमोट एक्सेस
  - H2: macOS ऐप रिमोट मोड
  - H2: सुरक्षा नियम (रिमोट/VPN)
  - H3: macOS: LaunchAgent के जरिए स्थायी SSH टनल
  - H4: चरण 1: SSH कॉन्फिग जोड़ें
  - H4: चरण 2: SSH कुंजी कॉपी करें (एक बार)
  - H4: चरण 3: gateway टोकन कॉन्फिगर करें
  - H4: चरण 4: LaunchAgent बनाएं
  - H4: चरण 5: LaunchAgent लोड करें
  - H4: समस्या निवारण
  - H2: संबंधित

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- मार्ग: /gateway/sandbox-vs-tool-policy-vs-elevated
- शीर्षक:
  - H2: त्वरित डिबग
  - H2: सैंडबॉक्स: टूल कहां चलते हैं
  - H3: बाइंड माउंट (सुरक्षा त्वरित जांच)
  - H2: टूल नीति: कौन से टूल मौजूद हैं/कॉल किए जा सकते हैं
  - H3: टूल समूह (संक्षिप्त रूप)
  - H2: एलिवेटेड: केवल exec "होस्ट पर चलाएं"
  - H2: सामान्य "सैंडबॉक्स जेल" सुधार
  - H3: "टूल X सैंडबॉक्स टूल नीति द्वारा ब्लॉक किया गया"
  - H3: "मुझे लगा यह मुख्य था, यह सैंडबॉक्स में क्यों है?"
  - H2: संबंधित

## gateway/sandboxing.md

- मार्ग: /gateway/sandboxing
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
  - H2: वर्कस्पेस एक्सेस
  - H2: कस्टम बाइंड माउंट
  - H2: इमेज और सेटअप
  - H2: setupCommand (एक बार का कंटेनर सेटअप)
  - H2: टूल नीति और निकास मार्ग
  - H2: मल्टी-एजेंट ओवरराइड
  - H2: न्यूनतम सक्षम उदाहरण
  - H2: संबंधित

## gateway/secrets-plan-contract.md

- मार्ग: /gateway/secrets-plan-contract
- शीर्षक:
  - H2: प्लान फ़ाइल आकार
  - H2: प्रोवाइडर upsert और delete
  - H2: समर्थित लक्ष्य दायरा
  - H2: लक्ष्य प्रकार व्यवहार
  - H2: पाथ सत्यापन नियम
  - H2: विफलता व्यवहार
  - H2: Exec प्रोवाइडर सहमति व्यवहार
  - H2: रनटाइम और ऑडिट दायरे पर टिप्पणियां
  - H2: ऑपरेटर जांच
  - H2: संबंधित दस्तावेज

## gateway/secrets.md

- मार्ग: /gateway/secrets
- शीर्षक:
  - H2: लक्ष्य और रनटाइम मॉडल
  - H2: एजेंट-एक्सेस सीमा
  - H2: सक्रिय-सतह फ़िल्टरिंग
  - H2: Gateway auth सतह निदान
  - H2: ऑनबोर्डिंग संदर्भ प्रीफ्लाइट
  - H2: SecretRef अनुबंध
  - H2: प्रोवाइडर कॉन्फिग
  - H2: फ़ाइल-समर्थित API कुंजियां
  - H2: Exec एकीकरण उदाहरण
  - H2: MCP सर्वर पर्यावरण चर
  - H2: सैंडबॉक्स SSH auth सामग्री
  - H2: समर्थित क्रेडेंशियल सतह
  - H2: आवश्यक व्यवहार और प्राथमिकता
  - H2: सक्रियण ट्रिगर
  - H2: कमजोर और पुनर्प्राप्त संकेत
  - H2: कमांड-पाथ समाधान
  - H2: ऑडिट और कॉन्फिगर वर्कफ़्लो
  - H2: एक-तरफ़ा सुरक्षा नीति
  - H2: लीगेसी auth संगतता टिप्पणियां
  - H2: Web UI टिप्पणी
  - H2: संबंधित

## gateway/security/audit-checks.md

- मार्ग: /gateway/security/audit-checks
- शीर्षक:
  - H2: संबंधित

## gateway/security/exposure-runbook.md

- मार्ग: /gateway/security/exposure-runbook
- शीर्षक:
  - H2: एक्सपोज़र पैटर्न चुनें
  - H2: प्री-फ्लाइट इन्वेंट्री
  - H2: बेसलाइन जांच
  - H2: न्यूनतम सुरक्षित बेसलाइन
  - H2: DM और समूह एक्सपोज़र
  - H2: रिवर्स प्रॉक्सी जांच
  - H2: टूल और सैंडबॉक्स समीक्षा
  - H2: परिवर्तन के बाद सत्यापन
  - H2: रोलबैक प्लान
  - H2: समीक्षा चेकलिस्ट

## gateway/security/index.md

- मार्ग: /gateway/security
- शीर्षक:
  - H2: पहले दायरा: निजी सहायक सुरक्षा मॉडल
  - H2: त्वरित जांच: openclaw सुरक्षा ऑडिट
  - H3: प्रकाशित पैकेज निर्भरता लॉक
  - H3: डिप्लॉयमेंट और होस्ट भरोसा
  - H3: सुरक्षित फ़ाइल संचालन
  - H3: साझा Slack वर्कस्पेस: वास्तविक जोखिम
  - H3: कंपनी-साझा एजेंट: स्वीकार्य पैटर्न
  - H2: Gateway और Node भरोसा अवधारणा
  - H2: भरोसा सीमा मैट्रिक्स
  - H2: डिज़ाइन के अनुसार कमजोरियां नहीं
  - H2: 60 सेकंड में सख्त बेसलाइन
  - H2: साझा इनबॉक्स त्वरित नियम
  - H2: संदर्भ दृश्यता मॉडल
  - H2: ऑडिट क्या जांचता है (उच्च स्तर)
  - H2: क्रेडेंशियल संग्रहण मानचित्र
  - H2: सुरक्षा ऑडिट चेकलिस्ट
  - H2: सुरक्षा ऑडिट शब्दावली
  - H2: HTTP पर Control UI
  - H2: असुरक्षित या खतरनाक फ़्लैग सारांश
  - H2: रिवर्स प्रॉक्सी कॉन्फिगरेशन
  - H2: HSTS और origin टिप्पणियां
  - H2: स्थानीय सेशन लॉग डिस्क पर रहते हैं
  - H2: Node निष्पादन (system.run)
  - H2: डायनेमिक Skills (watcher / remote nodes)
  - H2: खतरा मॉडल
  - H2: मुख्य अवधारणा: बुद्धिमत्ता से पहले एक्सेस नियंत्रण
  - H2: कमांड प्राधिकरण मॉडल
  - H2: कंट्रोल प्लेन टूल जोखिम
  - H2: Plugins
  - H2: DM एक्सेस मॉडल: पेयरिंग, allowlist, खुला, अक्षम
  - H2: DM सेशन अलगाव (बहु-उपयोगकर्ता मोड)
  - H3: सुरक्षित DM मोड (अनुशंसित)
  - H2: DM और समूहों के लिए allowlist
  - H2: प्रॉम्प्ट इंजेक्शन (यह क्या है, क्यों मायने रखता है)
  - H2: बाहरी सामग्री विशेष-टोकन सैनिटाइजेशन
  - H2: असुरक्षित बाहरी सामग्री बाइपास फ़्लैग
  - H3: प्रॉम्प्ट इंजेक्शन के लिए सार्वजनिक DM आवश्यक नहीं
  - H3: स्वयं-होस्ट किए गए LLM बैकएंड
  - H3: मॉडल क्षमता (सुरक्षा टिप्पणी)
  - H2: समूहों में रीजनिंग और वर्बोज़ आउटपुट
  - H2: कॉन्फिगरेशन सख्तीकरण उदाहरण
  - H3: फ़ाइल अनुमतियां
  - H3: नेटवर्क एक्सपोज़र (bind, port, firewall)
  - H3: UFW के साथ Docker पोर्ट प्रकाशन
  - H3: mDNS/Bonjour डिस्कवरी
  - H3: Gateway WebSocket लॉक डाउन करें (local auth)
  - H3: Tailscale Serve पहचान हेडर
  - H3: Node होस्ट के जरिए ब्राउज़र नियंत्रण (अनुशंसित)
  - H3: डिस्क पर सीक्रेट
  - H3: वर्कस्पेस .env फ़ाइलें
  - H3: लॉग और ट्रांसक्रिप्ट (redaction और retention)
  - H3: DM: डिफॉल्ट रूप से पेयरिंग
  - H3: समूह: हर जगह उल्लेख आवश्यक
  - H3: अलग नंबर (WhatsApp, Signal, Telegram)
  - H3: केवल-पढ़ने वाला मोड (सैंडबॉक्स और टूल के जरिए)
  - H3: सुरक्षित बेसलाइन (कॉपी/पेस्ट)
  - H2: सैंडबॉक्सिंग (अनुशंसित)
  - H3: सब-एजेंट डेलिगेशन गार्डरेल
  - H2: ब्राउज़र नियंत्रण जोखिम
  - H3: ब्राउज़र SSRF नीति (डिफॉल्ट रूप से सख्त)
  - H2: प्रति-एजेंट एक्सेस प्रोफ़ाइल (मल्टी-एजेंट)
  - H3: उदाहरण: पूरा एक्सेस (कोई सैंडबॉक्स नहीं)
  - H3: उदाहरण: केवल-पढ़ने वाले टूल + केवल-पढ़ने वाला वर्कस्पेस
  - H3: उदाहरण: कोई फ़ाइल सिस्टम/शेल एक्सेस नहीं (प्रोवाइडर मैसेजिंग अनुमत)
  - H2: घटना प्रतिक्रिया
  - H3: सीमित करें
  - H3: रोटेट करें (यदि सीक्रेट लीक हुए हैं तो समझौता मानें)
  - H3: ऑडिट करें
  - H3: रिपोर्ट के लिए एकत्र करें
  - H2: सीक्रेट स्कैनिंग
  - H2: सुरक्षा समस्याओं की रिपोर्टिंग

## gateway/security/secure-file-operations.md

- मार्ग: /gateway/security/secure-file-operations
- शीर्षक:
  - H2: डिफॉल्ट: कोई Python हेल्पर नहीं
  - H2: Python के बिना क्या सुरक्षित रहता है
  - H2: Python क्या जोड़ता है
  - H2: Plugin और core मार्गदर्शन

## gateway/security/shrinkwrap.md

- मार्ग: /gateway/security/shrinkwrap
- शीर्षक:
  - H2: आसान संस्करण
  - H2: OpenClaw इसका उपयोग क्यों करता है
  - H2: तकनीकी विवरण

## gateway/tailscale.md

- मार्ग: /gateway/tailscale
- शीर्षक:
  - H2: मोड
  - H2: Auth
  - H2: कॉन्फिग उदाहरण
  - H3: केवल Tailnet (Serve)
  - H3: केवल Tailnet (Tailnet IP से bind करें)
  - H3: सार्वजनिक इंटरनेट (Funnel + साझा पासवर्ड)
  - H2: CLI उदाहरण
  - H2: टिप्पणियां
  - H2: ब्राउज़र नियंत्रण (रिमोट Gateway + स्थानीय ब्राउज़र)
  - H2: Tailscale पूर्वापेक्षाएं + सीमाएं
  - H2: और जानें
  - H2: संबंधित

## gateway/tools-invoke-http-api.md

- मार्ग: /gateway/tools-invoke-http-api
- शीर्षक:
  - H2: प्रमाणीकरण
  - H2: सुरक्षा सीमा (महत्वपूर्ण)
  - H2: अनुरोध body
  - H2: नीति + रूटिंग व्यवहार
  - H2: प्रतिक्रियाएं
  - H2: उदाहरण
  - H2: संबंधित

## gateway/troubleshooting.md

- मार्ग: /gateway/troubleshooting
- शीर्षक:
  - H2: कमांड सीढ़ी
  - H2: अपडेट के बाद
  - H2: स्प्लिट-ब्रेन इंस्टॉल और नया कॉन्फिग गार्ड
  - H2: रोलबैक के बाद प्रोटोकॉल असंगति
  - H2: Skill symlink पाथ escape के रूप में छोड़ा गया
  - H2: Anthropic 429 लंबे संदर्भ के लिए अतिरिक्त उपयोग आवश्यक
  - H2: upstream 403 ब्लॉक की गई प्रतिक्रियाएं
  - H2: स्थानीय OpenAI-compatible बैकएंड सीधे probes पास करता है लेकिन एजेंट रन विफल होते हैं
  - H2: कोई उत्तर नहीं
  - H2: डैशबोर्ड control UI कनेक्टिविटी
  - H3: Auth विवरण कोड त्वरित मानचित्र
  - H2: Gateway सेवा नहीं चल रही
  - H2: macOS gateway चुपचाप जवाब देना बंद करता है, फिर डैशबोर्ड छूने पर फिर शुरू करता है
  - H2: अधिक मेमोरी उपयोग के दौरान Gateway बाहर निकलता है
  - H2: Gateway ने अमान्य कॉन्फिग अस्वीकार किया
  - H2: Gateway probe चेतावनियां
  - H2: चैनल कनेक्ट है, संदेश प्रवाहित नहीं हो रहे
  - H2: Cron और Heartbeat डिलीवरी
  - H2: Node पेयर हुआ, टूल विफल
  - H2: ब्राउज़र टूल विफल
  - H2: यदि आपने अपग्रेड किया और अचानक कुछ टूट गया
  - H2: संबंधित

## gateway/trusted-proxy-auth.md

- मार्ग: /gateway/trusted-proxy-auth
- शीर्षक:
  - H2: कब उपयोग करें
  - H2: कब उपयोग न करें
  - H2: यह कैसे काम करता है
  - H2: Control UI पेयरिंग व्यवहार
  - H2: कॉन्फिगरेशन
  - H3: कॉन्फिगरेशन संदर्भ
  - H2: TLS termination और HSTS
  - H3: रोलआउट मार्गदर्शन
  - H2: प्रॉक्सी सेटअप उदाहरण
  - H2: मिश्रित टोकन कॉन्फिगरेशन
  - H2: ऑपरेटर scopes हेडर
  - H2: सुरक्षा चेकलिस्ट
  - H2: सुरक्षा ऑडिट
  - H2: समस्या निवारण
  - H2: token auth से माइग्रेशन
  - H2: संबंधित

## help/debugging.md

- मार्ग: /help/debugging
- शीर्षक:
  - H2: रनटाइम डिबग ओवरराइड
  - H2: सेशन trace आउटपुट
  - H2: Plugin जीवनचक्र trace
  - H2: CLI स्टार्टअप और कमांड प्रोफाइलिंग
  - H2: Gateway watch मोड
  - H2: dev प्रोफ़ाइल + dev gateway (--dev)
  - H2: रॉ stream लॉगिंग (OpenClaw)
  - H2: रॉ OpenAI-compatible chunk लॉगिंग
  - H2: सुरक्षा टिप्पणियां
  - H2: VSCode में डिबगिंग
  - H3: सेटअप
  - H3: टिप्पणियां
  - H2: संबंधित

## help/environment.md

- मार्ग: /help/environment
- शीर्षक:
  - H2: प्राथमिकता (सबसे अधिक → सबसे कम)
  - H2: प्रोवाइडर क्रेडेंशियल और वर्कस्पेस .env
  - H2: कॉन्फिग env ब्लॉक
  - H2: शेल env इम्पोर्ट
  - H2: Exec शेल स्नैपशॉट
  - H2: रनटाइम-इंजेक्टेड env vars
  - H2: UI env vars
  - H2: कॉन्फिग में Env var substitution
  - H2: Secret refs बनाम ${ENV} strings
  - H2: पाथ-संबंधित env vars
  - H2: लॉगिंग
  - H3: OPENCLAWHOME
  - H2: nvm उपयोगकर्ता: webfetch TLS विफलताएं
  - H2: लीगेसी पर्यावरण चर
  - H2: संबंधित

## help/faq-first-run.md

- मार्ग: /help/faq-first-run
- शीर्षक:
  - H2: त्वरित शुरुआत और first-run सेटअप
  - H2: संबंधित

## help/faq-models.md

- मार्ग: /help/faq-models
- शीर्षक:
  - H2: मॉडल: डिफॉल्ट, चयन, aliases, स्विचिंग
  - H2: मॉडल failover और "सभी मॉडल विफल हुए"
  - H2: Auth प्रोफ़ाइल: वे क्या हैं और उन्हें कैसे प्रबंधित करें
  - H2: संबंधित

## help/faq.md

- मार्ग: /help/faq
- शीर्षक:
  - H2: यदि कुछ टूटा है तो पहले 60 सेकंड
  - H2: त्वरित शुरुआत और first-run सेटअप
  - H2: OpenClaw क्या है?
  - H2: Skills और automation
  - H2: सैंडबॉक्सिंग और मेमोरी
  - H2: चीजें डिस्क पर कहां रहती हैं
  - H2: कॉन्फिग मूल बातें
  - H2: रिमोट gateways और nodes
  - H2: Env vars और .env लोडिंग
  - H2: सेशन और कई चैट
  - H2: मॉडल, failover, और auth प्रोफ़ाइल
  - H2: Gateway: पोर्ट, "पहले से चल रहा", और रिमोट मोड
  - H2: लॉगिंग और डिबगिंग
  - H2: मीडिया और attachments
  - H2: सुरक्षा और एक्सेस नियंत्रण
  - H2: चैट कमांड, कार्य रोकना, और "यह नहीं रुकेगा"
  - H2: विविध
  - H2: संबंधित

## help/index.md

- मार्ग: /help
- शीर्षक:
  - H2: FAQ
  - H2: निदान
  - H2: परीक्षण
  - H2: समुदाय और meta

## help/scripts.md

- मार्ग: /help/scripts
- शीर्षक:
  - H2: परंपराएं
  - H2: Auth निगरानी scripts
  - H2: GitHub read helper
  - H2: scripts जोड़ते समय
  - H2: संबंधित

## help/testing-live.md

- रूट: /help/testing-live
- शीर्षक:
  - H2: लाइव: स्थानीय स्मोक कमांड
  - H2: लाइव: Android Node क्षमता स्वीप
  - H2: लाइव: मॉडल स्मोक (प्रोफ़ाइल कुंजियां)
  - H3: लेयर 1: डायरेक्ट मॉडल कम्प्लीशन (कोई Gateway नहीं)
  - H3: लेयर 2: Gateway + डेवलपमेंट एजेंट स्मोक ("@openclaw" वास्तव में क्या करता है)
  - H2: लाइव: CLI बैकएंड स्मोक (Claude, Gemini, या अन्य स्थानीय CLI)
  - H2: लाइव: APNs HTTP/2 प्रॉक्सी पहुंच-योग्यता
  - H2: लाइव: ACP बाइंड स्मोक (/acp spawn ... --bind here)
  - H2: लाइव: Codex ऐप-सर्वर हार्नेस स्मोक
  - H3: अनुशंसित लाइव रेसिपी
  - H2: लाइव: मॉडल मैट्रिक्स (हम क्या कवर करते हैं)
  - H3: आधुनिक स्मोक सेट (टूल कॉलिंग + इमेज)
  - H3: बेसलाइन: टूल कॉलिंग (Read + वैकल्पिक Exec)
  - H3: विज़न: इमेज भेजना (अटैचमेंट → मल्टीमोडल संदेश)
  - H3: एग्रीगेटर / वैकल्पिक Gateway
  - H2: क्रेडेंशियल (कभी कमिट न करें)
  - H2: Deepgram लाइव (ऑडियो ट्रांसक्रिप्शन)
  - H2: BytePlus कोडिंग प्लान लाइव
  - H2: ComfyUI वर्कफ़्लो मीडिया लाइव
  - H2: इमेज जनरेशन लाइव
  - H2: म्यूज़िक जनरेशन लाइव
  - H2: वीडियो जनरेशन लाइव
  - H2: मीडिया लाइव हार्नेस
  - H2: संबंधित

## help/testing-updates-plugins.md

- रूट: /help/testing-updates-plugins
- शीर्षक:
  - H2: हम क्या सुरक्षित रखते हैं
  - H2: विकास के दौरान स्थानीय प्रमाण
  - H2: Docker लेन
  - H2: पैकेज स्वीकृति
  - H2: रिलीज़ डिफ़ॉल्ट
  - H2: लेगेसी संगतता
  - H2: कवरेज जोड़ना
  - H2: विफलता ट्रायाज

## help/testing.md

- रूट: /help/testing
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: टेस्ट अस्थायी डायरेक्टरी
  - H2: QA-विशिष्ट रनर
  - H3: Convex के माध्यम से साझा Telegram क्रेडेंशियल (v1)
  - H3: QA में चैनल जोड़ना
  - H2: टेस्ट सूट (क्या कहां चलता है)
  - H3: यूनिट / इंटीग्रेशन (डिफ़ॉल्ट)
  - H3: स्थिरता (Gateway)
  - H3: E2E (रेपो एग्रीगेट)
  - H3: E2E (Gateway स्मोक)
  - H3: E2E (Control UI मॉक्ड ब्राउज़र)
  - H3: E2E: OpenShell बैकएंड स्मोक
  - H3: लाइव (वास्तविक प्रदाता + वास्तविक मॉडल)
  - H2: मुझे कौन सा सूट चलाना चाहिए?
  - H2: लाइव (नेटवर्क-स्पर्शी) टेस्ट
  - H2: Docker रनर (वैकल्पिक "Linux में काम करता है" जांच)
  - H2: डॉक्स सैनिटी
  - H2: ऑफ़लाइन रिग्रेशन (CI-सुरक्षित)
  - H2: एजेंट विश्वसनीयता मूल्यांकन (Skills)
  - H2: कॉन्ट्रैक्ट टेस्ट (Plugin और चैनल आकार)
  - H3: कमांड
  - H3: चैनल कॉन्ट्रैक्ट
  - H3: प्रदाता स्थिति कॉन्ट्रैक्ट
  - H3: प्रदाता कॉन्ट्रैक्ट
  - H3: कब चलाएं
  - H2: रिग्रेशन जोड़ना (मार्गदर्शन)
  - H2: संबंधित

## help/troubleshooting.md

- रूट: /help/troubleshooting
- शीर्षक:
  - H2: पहले 60 सेकंड
  - H2: असिस्टेंट सीमित लगता है या टूल गायब हैं
  - H2: Anthropic लंबा कॉन्टेक्स्ट 429
  - H2: स्थानीय OpenAI-संगत बैकएंड सीधे काम करता है लेकिन OpenClaw में विफल होता है
  - H2: Plugin इंस्टॉल अनुपलब्ध openclaw एक्सटेंशन के साथ विफल होता है
  - H2: इंस्टॉल नीति Plugin इंस्टॉल या अपडेट रोकती है
  - H2: Plugin मौजूद है लेकिन संदिग्ध स्वामित्व से अवरुद्ध है
  - H2: निर्णय वृक्ष
  - H2: संबंधित

## index.md

- रूट: /
- शीर्षक:
  - H1: OpenClaw 🦞
  - H2: OpenClaw क्या है?
  - H2: यह कैसे काम करता है
  - H2: मुख्य क्षमताएं
  - H2: क्विक स्टार्ट
  - H2: डैशबोर्ड
  - H2: कॉन्फ़िगरेशन (वैकल्पिक)
  - H2: यहां से शुरू करें
  - H2: और जानें

## install/ansible.md

- रूट: /install/ansible
- शीर्षक:
  - H2: पूर्वापेक्षाएं
  - H2: आपको क्या मिलता है
  - H2: क्विक स्टार्ट
  - H2: क्या इंस्टॉल होता है
  - H2: इंस्टॉल के बाद सेटअप
  - H3: क्विक कमांड
  - H2: सुरक्षा आर्किटेक्चर
  - H2: मैनुअल इंस्टॉलेशन
  - H2: अपडेट करना
  - H2: समस्या निवारण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## install/azure.md

- रूट: /install/azure
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

- रूट: /install/bun
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: लाइफ़साइकल स्क्रिप्ट
  - H2: सावधानियां
  - H2: संबंधित

## install/clawdock.md

- रूट: /install/clawdock
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: आपको क्या मिलता है
  - H3: बुनियादी ऑपरेशन
  - H3: कंटेनर एक्सेस
  - H3: वेब UI और पेयरिंग
  - H3: सेटअप और रखरखाव
  - H3: उपयोगिताएं
  - H2: पहली बार का फ़्लो
  - H2: कॉन्फ़िग और सीक्रेट
  - H2: संबंधित

## install/development-channels.md

- रूट: /install/development-channels
- शीर्षक:
  - H2: चैनल बदलना
  - H2: एकबारगी वर्शन या टैग लक्ष्यीकरण
  - H2: ड्राई रन
  - H2: Plugin और चैनल
  - H2: वर्तमान स्थिति जांचना
  - H2: टैगिंग की सर्वोत्तम प्रथाएं
  - H2: macOS ऐप उपलब्धता
  - H2: संबंधित

## install/digitalocean.md

- रूट: /install/digitalocean
- शीर्षक:
  - H2: पूर्वापेक्षाएं
  - H2: सेटअप
  - H2: पर्सिस्टेंस और बैकअप
  - H2: 1 GB RAM टिप्स
  - H2: समस्या निवारण
  - H2: अगले चरण
  - H2: संबंधित

## install/docker-vm-runtime.md

- रूट: /install/docker-vm-runtime
- शीर्षक:
  - H2: आवश्यक बाइनरी इमेज में बेक करें
  - H2: बिल्ड और लॉन्च करें
  - H2: क्या कहां पर्सिस्ट होता है
  - H2: अपडेट
  - H2: संबंधित

## install/docker.md

- रूट: /install/docker
- शीर्षक:
  - H2: क्या Docker मेरे लिए सही है?
  - H2: पूर्वापेक्षाएं
  - H2: कंटेनराइज़्ड Gateway
  - H3: मैनुअल फ़्लो
  - H3: एनवायरनमेंट वेरिएबल
  - H3: ऑब्ज़र्वेबिलिटी
  - H3: हेल्थ चेक
  - H3: LAN बनाम local loopback
  - H3: होस्ट स्थानीय प्रदाता
  - H3: Docker में Claude CLI बैकएंड
  - H3: Bonjour / mDNS
  - H3: स्टोरेज और पर्सिस्टेंस
  - H3: शेल हेल्पर (वैकल्पिक)
  - H3: VPS पर चला रहे हैं?
  - H2: एजेंट सैंडबॉक्स
  - H3: त्वरित सक्षम करें
  - H2: समस्या निवारण
  - H2: संबंधित

## install/exe-dev.md

- रूट: /install/exe-dev
- शीर्षक:
  - H2: शुरुआती लोगों के लिए त्वरित रास्ता
  - H2: आपको क्या चाहिए
  - H2: Shelley के साथ स्वचालित इंस्टॉल
  - H2: मैनुअल इंस्टॉलेशन
  - H2: 1) VM बनाएं
  - H2: 2) पूर्वापेक्षाएं इंस्टॉल करें (VM पर)
  - H2: 3) OpenClaw इंस्टॉल करें
  - H2: 4) OpenClaw को पोर्ट 8000 पर प्रॉक्सी करने के लिए nginx सेटअप करें
  - H2: 5) OpenClaw एक्सेस करें और विशेषाधिकार दें
  - H2: रिमोट चैनल सेटअप
  - H2: रिमोट एक्सेस
  - H2: अपडेट करना
  - H2: संबंधित

## install/fly.md

- रूट: /install/fly
- शीर्षक:
  - H2: आपको क्या चाहिए
  - H2: शुरुआती लोगों के लिए त्वरित रास्ता
  - H2: समस्या निवारण
  - H3: "ऐप अपेक्षित पते पर सुन नहीं रहा है"
  - H3: हेल्थ चेक विफल / कनेक्शन अस्वीकृत
  - H3: OOM / मेमोरी समस्याएं
  - H3: Gateway लॉक समस्याएं
  - H3: कॉन्फ़िग पढ़ा नहीं जा रहा
  - H3: SSH के माध्यम से कॉन्फ़िग लिखना
  - H3: स्टेट पर्सिस्ट नहीं हो रहा
  - H2: अपडेट
  - H3: मशीन कमांड अपडेट करना
  - H2: निजी डिप्लॉयमेंट (मज़बूत)
  - H3: निजी डिप्लॉयमेंट कब उपयोग करें
  - H3: सेटअप
  - H3: निजी डिप्लॉयमेंट एक्सेस करना
  - H3: निजी डिप्लॉयमेंट के साथ Webhook
  - H3: सुरक्षा लाभ
  - H2: नोट्स
  - H2: लागत
  - H2: अगले चरण
  - H2: संबंधित

## install/gcp.md

- रूट: /install/gcp
- शीर्षक:
  - H2: हम क्या कर रहे हैं (सरल शब्दों में)?
  - H2: त्वरित रास्ता (अनुभवी ऑपरेटर)
  - H2: आपको क्या चाहिए
  - H2: समस्या निवारण
  - H2: सर्विस अकाउंट (सुरक्षा सर्वोत्तम अभ्यास)
  - H2: अगले चरण
  - H2: संबंधित

## install/hetzner.md

- रूट: /install/hetzner
- शीर्षक:
  - H2: लक्ष्य
  - H2: हम क्या कर रहे हैं (सरल शब्दों में)?
  - H2: त्वरित रास्ता (अनुभवी ऑपरेटर)
  - H2: आपको क्या चाहिए
  - H2: इंफ़्रास्ट्रक्चर ऐज़ कोड (Terraform)
  - H2: अगले चरण
  - H2: संबंधित

## install/hostinger.md

- रूट: /install/hostinger
- शीर्षक:
  - H2: पूर्वापेक्षाएं
  - H2: विकल्प A: 1-क्लिक OpenClaw
  - H2: विकल्प B: VPS पर OpenClaw
  - H2: अपना सेटअप सत्यापित करें
  - H2: समस्या निवारण
  - H2: अगले चरण
  - H2: संबंधित

## install/index.md

- रूट: /install
- शीर्षक:
  - H2: सिस्टम आवश्यकताएं
  - H2: अनुशंसित: इंस्टॉलर स्क्रिप्ट
  - H2: वैकल्पिक इंस्टॉल विधियां
  - H3: स्थानीय प्रीफ़िक्स इंस्टॉलर (install-cli.sh)
  - H3: npm, pnpm, या bun
  - H3: स्रोत से
  - H3: GitHub main चेकआउट से इंस्टॉल करें
  - H3: कंटेनर और पैकेज मैनेजर
  - H2: इंस्टॉल सत्यापित करें
  - H2: होस्टिंग और डिप्लॉयमेंट
  - H2: अपडेट, माइग्रेट, या अनइंस्टॉल करें
  - H2: समस्या निवारण: openclaw नहीं मिला

## install/installer.md

- रूट: /install/installer
- शीर्षक:
  - H2: क्विक कमांड
  - H2: install.sh
  - H3: फ़्लो (install.sh)
  - H3: स्रोत चेकआउट पहचान
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

- रूट: /install/kubernetes
- शीर्षक:
  - H2: Helm क्यों नहीं?
  - H2: आपको क्या चाहिए
  - H2: क्विक स्टार्ट
  - H2: Kind के साथ स्थानीय टेस्टिंग
  - H2: चरण-दर-चरण
  - H3: 1) डिप्लॉय करें
  - H3: 2) Gateway एक्सेस करें
  - H2: क्या डिप्लॉय होता है
  - H2: कस्टमाइज़ेशन
  - H3: एजेंट निर्देश
  - H3: Gateway कॉन्फ़िग
  - H3: प्रदाता जोड़ें
  - H3: कस्टम नेमस्पेस
  - H3: कस्टम इमेज
  - H3: पोर्ट-फ़ॉरवर्ड से आगे एक्सपोज़ करें
  - H2: फिर से डिप्लॉय करें
  - H2: टियरडाउन
  - H2: आर्किटेक्चर नोट्स
  - H2: फ़ाइल संरचना
  - H2: संबंधित

## install/macos-vm.md

- रूट: /install/macos-vm
- शीर्षक:
  - H2: अनुशंसित डिफ़ॉल्ट (अधिकांश उपयोगकर्ता)
  - H2: macOS VM विकल्प
  - H3: आपके Apple Silicon Mac पर स्थानीय VM (Lume)
  - H3: होस्टेड Mac प्रदाता (क्लाउड)
  - H2: त्वरित रास्ता (Lume, अनुभवी उपयोगकर्ता)
  - H2: आपको क्या चाहिए (Lume)
  - H2: 1) Lume इंस्टॉल करें
  - H2: 2) macOS VM बनाएं
  - H2: 3) Setup Assistant पूरा करें
  - H2: 4) VM IP पता प्राप्त करें
  - H2: 5) VM में SSH करें
  - H2: 6) OpenClaw इंस्टॉल करें
  - H2: 7) चैनल कॉन्फ़िगर करें
  - H2: 8) VM को हेडलेस चलाएं
  - H2: बोनस: iMessage इंटीग्रेशन
  - H2: गोल्डन इमेज सहेजें
  - H2: 24/7 चलाना
  - H2: समस्या निवारण
  - H2: संबंधित डॉक्स

## install/migrating-claude.md

- रूट: /install/migrating-claude
- शीर्षक:
  - H2: इंपोर्ट करने के दो तरीके
  - H2: क्या इंपोर्ट होता है
  - H2: क्या केवल आर्काइव रहता है
  - H2: स्रोत चयन
  - H2: अनुशंसित फ़्लो
  - H2: कॉन्फ़्लिक्ट हैंडलिंग
  - H2: ऑटोमेशन के लिए JSON आउटपुट
  - H2: समस्या निवारण
  - H2: संबंधित

## install/migrating-hermes.md

- रूट: /install/migrating-hermes
- शीर्षक:
  - H2: इंपोर्ट करने के दो तरीके
  - H2: क्या इंपोर्ट होता है
  - H2: क्या केवल आर्काइव रहता है
  - H2: अनुशंसित फ़्लो
  - H2: कॉन्फ़्लिक्ट हैंडलिंग
  - H2: सीक्रेट
  - H2: ऑटोमेशन के लिए JSON आउटपुट
  - H2: समस्या निवारण
  - H2: संबंधित

## install/migrating.md

- रूट: /install/migrating
- शीर्षक:
  - H2: किसी अन्य एजेंट सिस्टम से इंपोर्ट करें
  - H2: OpenClaw को नई मशीन पर ले जाएं
  - H3: माइग्रेशन चरण
  - H3: सामान्य कमियां
  - H3: सत्यापन चेकलिस्ट
  - H2: Plugin को उसी स्थान पर अपग्रेड करें
  - H2: संबंधित

## install/nix.md

- रूट: /install/nix
- शीर्षक:
  - H2: आपको क्या मिलता है
  - H2: क्विक स्टार्ट
  - H2: Nix-मोड रनटाइम व्यवहार
  - H3: Nix मोड में क्या बदलता है
  - H3: कॉन्फ़िग और स्टेट पाथ
  - H3: सर्विस PATH डिस्कवरी
  - H2: संबंधित

## install/node.md

- रूट: /install/node
- शीर्षक:
  - H2: अपना वर्शन जांचें
  - H2: Node इंस्टॉल करें
  - H2: समस्या निवारण
  - H3: openclaw: कमांड नहीं मिला
  - H3: npm install -g पर अनुमति त्रुटियां (Linux)
  - H2: संबंधित

## install/northflank.mdx

- रूट: /install/northflank
- शीर्षक:
  - H1: Northflank
  - H2: शुरू कैसे करें
  - H2: आपको क्या मिलता है
  - H2: चैनल कनेक्ट करें
  - H2: अगले चरण

## install/oracle.md

- रूट: /install/oracle
- शीर्षक:
  - H2: पूर्वापेक्षाएं
  - H2: सेटअप
  - H2: सुरक्षा मुद्रा सत्यापित करें
  - H2: ARM नोट्स
  - H2: पर्सिस्टेंस और बैकअप
  - H2: फ़ॉलबैक: SSH टनल
  - H2: समस्या निवारण
  - H2: अगले चरण
  - H2: संबंधित

## install/podman.md

- रूट: /install/podman
- शीर्षक:
  - H2: पूर्वापेक्षाएं
  - H2: क्विक स्टार्ट
  - H2: Podman और Tailscale
  - H2: Systemd (Quadlet, वैकल्पिक)
  - H2: कॉन्फ़िग, env, और स्टोरेज
  - H2: उपयोगी कमांड
  - H2: समस्या निवारण
  - H2: संबंधित

## install/railway.mdx

- रूट: /install/railway
- शीर्षक:
  - H1: Railway
  - H2: क्विक चेकलिस्ट (नए उपयोगकर्ता)
  - H2: वन-क्लिक डिप्लॉय
  - H2: आपको क्या मिलता है
  - H2: आवश्यक Railway सेटिंग्स
  - H3: सार्वजनिक नेटवर्किंग
  - H3: वॉल्यूम (आवश्यक)
  - H3: वेरिएबल
  - H2: चैनल कनेक्ट करें
  - H2: बैकअप और माइग्रेशन
  - H2: अगले चरण

## install/raspberry-pi.md

- मार्ग: /install/raspberry-pi
- शीर्षक:
  - H2: हार्डवेयर संगतता
  - H2: पूर्वापेक्षाएँ
  - H2: सेटअप
  - H2: प्रदर्शन संबंधी सुझाव
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
  - H2: Render Blueprint के साथ डिप्लॉय करें
  - H2: Blueprint को समझना
  - H2: प्लान चुनना
  - H2: डिप्लॉयमेंट के बाद
  - H3: Control UI तक पहुँचें
  - H2: Render Dashboard सुविधाएँ
  - H3: लॉग
  - H3: Shell पहुँच
  - H3: Environment variables
  - H3: Auto-deploy
  - H2: कस्टम डोमेन
  - H2: स्केलिंग
  - H2: बैकअप और माइग्रेशन
  - H2: समस्या निवारण
  - H3: सर्विस शुरू नहीं होगी
  - H3: धीमे cold starts (फ्री टियर)
  - H3: फिर से डिप्लॉय करने के बाद डेटा हानि
  - H3: Health check विफलताएँ
  - H2: अगले चरण

## install/uninstall.md

- मार्ग: /install/uninstall
- शीर्षक:
  - H2: आसान रास्ता (CLI अभी भी इंस्टॉल है)
  - H2: मैन्युअल सर्विस हटाना (CLI इंस्टॉल नहीं है)
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
  - H2: विकल्प: मैन्युअल npm, pnpm, या bun
  - H3: उन्नत npm इंस्टॉल विषय
  - H2: Auto-updater
  - H2: अपडेट करने के बाद
  - H3: doctor चलाएँ
  - H3: gateway रीस्टार्ट करें
  - H3: सत्यापित करें
  - H2: रोलबैक
  - H3: कोई वर्जन पिन करें (npm)
  - H3: कोई कमिट पिन करें (स्रोत)
  - H2: अगर आप अटक गए हैं
  - H2: संबंधित

## install/upstash.md

- मार्ग: /install/upstash
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: Box बनाएँ
  - H2: SSH tunnel से कनेक्ट करें
  - H2: OpenClaw इंस्टॉल करें
  - H2: ऑनबोर्डिंग चलाएँ
  - H2: Gateway शुरू करें
  - H2: Auto-restart
  - H2: समस्या निवारण
  - H2: संबंधित

## logging.md

- मार्ग: /logging
- शीर्षक:
  - H2: लॉग कहाँ रहते हैं
  - H2: लॉग कैसे पढ़ें
  - H3: CLI: live tail (अनुशंसित)
  - H3: Control UI (वेब)
  - H3: केवल चैनल लॉग
  - H2: लॉग फ़ॉर्मैट
  - H3: फ़ाइल लॉग (JSONL)
  - H3: Console output
  - H3: Gateway WebSocket लॉग
  - H2: लॉगिंग कॉन्फ़िगर करना
  - H3: लॉग स्तर
  - H3: लक्षित मॉडल ट्रांसपोर्ट डायग्नॉस्टिक्स
  - H3: Trace correlation
  - H3: मॉडल कॉल आकार और समय
  - H3: Console styles
  - H3: Redaction
  - H2: डायग्नॉस्टिक्स और OpenTelemetry
  - H2: समस्या निवारण सुझाव
  - H2: संबंधित

## maturity/scorecard.md

- मार्ग: /maturity/scorecard
- शीर्षक:
  - H1: Maturity scorecard
  - H2: यह पृष्ठ किसके लिए है
  - H2: एक नज़र में
  - H2: स्कोर बैंड
  - H2: Surface explorer
  - H2: QA साक्ष्य सारांश
  - H3: क्षेत्र के अनुसार तैयारी

## maturity/taxonomy.md

- मार्ग: /maturity/taxonomy
- शीर्षक:
  - H1: Maturity taxonomy
  - H2: इस पृष्ठ को कैसे पढ़ें
  - H2: परिपक्वता स्तर
  - H2: उत्पाद क्षेत्र
  - H2: विवरण
  - H3: Core
  - H3: Platform
  - H3: Channel
  - H3: Provider और tool

## network.md

- मार्ग: /network
- शीर्षक:
  - H2: Core मॉडल
  - H2: पेयरिंग + पहचान
  - H2: Discovery + transports
  - H2: Nodes + transports
  - H2: सुरक्षा
  - H2: संबंधित

## nodes/audio.md

- मार्ग: /nodes/audio
- शीर्षक:
  - H2: क्या काम करता है
  - H2: Auto-detection (डिफ़ॉल्ट)
  - H2: Config उदाहरण
  - H3: Provider + CLI fallback (OpenAI + Whisper CLI)
  - H3: Scope gating के साथ केवल-provider
  - H3: केवल-provider (Deepgram)
  - H3: केवल-provider (Mistral Voxtral)
  - H3: केवल-provider (SenseAudio)
  - H3: चैट में transcript echo करें (opt-in)
  - H2: नोट्स और सीमाएँ
  - H3: Proxy environment support
  - H2: समूहों में mention detection
  - H2: ध्यान देने योग्य बातें
  - H2: संबंधित

## nodes/camera.md

- मार्ग: /nodes/camera
- शीर्षक:
  - H2: iOS node
  - H3: उपयोगकर्ता सेटिंग (डिफ़ॉल्ट रूप से चालू)
  - H3: Commands (Gateway node.invoke के ज़रिए)
  - H3: Foreground requirement
  - H3: CLI helper
  - H2: Android node
  - H3: Android उपयोगकर्ता सेटिंग (डिफ़ॉल्ट रूप से चालू)
  - H3: अनुमतियाँ
  - H3: Android foreground requirement
  - H3: Android commands (Gateway node.invoke के ज़रिए)
  - H3: Payload guard
  - H2: macOS app
  - H3: उपयोगकर्ता सेटिंग (डिफ़ॉल्ट रूप से बंद)
  - H3: CLI helper (node invoke)
  - H2: सुरक्षा + व्यावहारिक सीमाएँ
  - H2: macOS screen video (OS-level)
  - H2: संबंधित

## nodes/images.md

- मार्ग: /nodes/images
- शीर्षक:
  - H2: लक्ष्य
  - H2: CLI Surface
  - H2: WhatsApp Web चैनल व्यवहार
  - H2: Auto-Reply Pipeline
  - H2: आने वाले मीडिया को Commands में बदलना
  - H2: सीमाएँ और त्रुटियाँ
  - H2: Tests के लिए नोट्स
  - H2: संबंधित

## nodes/index.md

- मार्ग: /nodes
- शीर्षक:
  - H2: पेयरिंग + स्थिति
  - H2: Remote node host (system.run)
  - H3: क्या कहाँ चलता है
  - H3: node host शुरू करें (foreground)
  - H3: SSH tunnel के ज़रिए remote gateway (loopback bind)
  - H3: node host शुरू करें (service)
  - H3: पेयर + नाम
  - H3: commands को allowlist करें
  - H3: exec को node पर इंगित करें
  - H2: Commands चलाना
  - H2: Command policy
  - H2: Config (openclaw.json)
  - H2: Screenshots (canvas snapshots)
  - H3: Canvas controls
  - H3: A2UI (Canvas)
  - H2: Photos + videos (node camera)
  - H2: Screen recordings (nodes)
  - H2: Location (nodes)
  - H2: SMS (Android nodes)
  - H2: Android device + personal data commands
  - H2: System commands (node host / mac node)
  - H2: Exec node binding
  - H2: Permissions map
  - H2: Headless node host (cross-platform)
  - H2: Mac node mode

## nodes/location-command.md

- मार्ग: /nodes/location-command
- शीर्षक:
  - H2: संक्षेप में
  - H2: selector क्यों (सिर्फ switch नहीं)
  - H2: Settings model
  - H2: Permissions mapping (node.permissions)
  - H2: Command: location.get
  - H2: Background behavior
  - H2: Model/tooling integration
  - H2: UX copy (सुझाया गया)
  - H2: संबंधित

## nodes/media-understanding.md

- मार्ग: /nodes/media-understanding
- शीर्षक:
  - H2: लक्ष्य
  - H2: उच्च-स्तरीय व्यवहार
  - H2: Config अवलोकन
  - H3: Model entries
  - H3: Provider credentials (apiKey)
  - H2: डिफ़ॉल्ट और सीमाएँ
  - H3: Auto-detect media understanding (डिफ़ॉल्ट)
  - H3: Proxy environment support (provider models)
  - H2: Capabilities (वैकल्पिक)
  - H2: Provider support matrix (OpenClaw integrations)
  - H2: Model selection guidance
  - H2: Attachment policy
  - H2: Config उदाहरण
  - H2: Status output
  - H2: नोट्स
  - H2: संबंधित

## nodes/talk.md

- मार्ग: /nodes/talk
- शीर्षक:
  - H2: व्यवहार (macOS)
  - H2: जवाबों में voice directives
  - H2: Config (/.openclaw/openclaw.json)
  - H2: macOS UI
  - H2: Android UI
  - H2: नोट्स
  - H2: संबंधित

## nodes/troubleshooting.md

- मार्ग: /nodes/troubleshooting
- शीर्षक:
  - H2: Command ladder
  - H2: Foreground requirements
  - H2: Permissions matrix
  - H2: पेयरिंग बनाम approvals
  - H2: सामान्य node error codes
  - H2: तेज़ recovery loop
  - H2: संबंधित

## nodes/voicewake.md

- मार्ग: /nodes/voicewake
- शीर्षक:
  - H2: Storage (Gateway host)
  - H2: Protocol
  - H3: Methods
  - H3: Routing methods (trigger → target)
  - H3: Events
  - H2: Client behavior
  - H3: macOS app
  - H3: iOS node
  - H3: Android node
  - H2: संबंधित

## openclaw-agent-runtime.md

- मार्ग: /openclaw-agent-runtime
- शीर्षक:
  - H2: Type checking और linting
  - H2: Agent Runtime Tests चलाना
  - H2: मैन्युअल testing
  - H2: Clean slate reset
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
  - H2: मौजूदा आर्किटेक्चर
  - H2: मौजूदा अंतर
  - H2: अपेक्षित व्यवहार
  - H2: डिज़ाइन बाधाएँ
  - H3: Codex app-server native thread state के लिए canonical रहता है
  - H3: Context engine assembly को Codex inputs में project करना होगा
  - H3: Prompt-cache स्थिरता मायने रखती है
  - H3: Runtime selection semantics नहीं बदलते
  - H2: Implementation plan
  - H3: 1. पुनः उपयोग योग्य context-engine attempt helpers को export या relocate करें
  - H3: 2. Codex context projection helper जोड़ें
  - H3: 3. Codex thread startup से पहले bootstrap wire करें
  - H3: 4. thread/start / thread/resume और turn/start से पहले assemble wire करें
  - H3: 5. Prompt-cache stable formatting बनाए रखें
  - H3: 6. Transcript mirroring के बाद post-turn wire करें
  - H3: 7. Usage और prompt-cache runtime context normalize करें
  - H3: 8. Compaction नीति
  - H4: /compact और explicit OpenClaw compaction
  - H4: In-turn Codex native contextCompaction events
  - H3: 9. Session reset और binding behavior
  - H3: 10. Error handling
  - H2: Test plan
  - H3: Unit tests
  - H3: अपडेट करने के लिए मौजूदा tests
  - H3: Integration / live tests
  - H2: Observability
  - H2: Migration / compatibility
  - H2: खुले प्रश्न
  - H2: Acceptance criteria

## plan/ui-channels.md

- मार्ग: /plan/ui-channels
- शीर्षक:
  - H2: स्थिति
  - H2: समस्या
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: Target model
  - H2: Delivery metadata
  - H2: Runtime capability contract
  - H2: Channel mapping
  - H2: Refactor steps
  - H2: Tests
  - H2: खुले प्रश्न
  - H2: संबंधित

## platforms/android.md

- मार्ग: /platforms/android
- शीर्षक:
  - H2: Support snapshot
  - H2: System control
  - H2: Connection runbook
  - H3: पूर्वापेक्षाएँ
  - H3: 1) Gateway शुरू करें
  - H3: 2) discovery सत्यापित करें (वैकल्पिक)
  - H4: Tailnet (Vienna ⇄ London) discovery via unicast DNS-SD
  - H3: 3) Android से कनेक्ट करें
  - H3: Presence alive beacons
  - H3: 4) पेयरिंग approve करें (CLI)
  - H3: 5) सत्यापित करें कि node कनेक्ट है
  - H3: 6) Chat + history
  - H3: 7) Canvas + camera
  - H4: Gateway Canvas Host (web content के लिए अनुशंसित)
  - H3: 8) Voice + विस्तारित Android command surface
  - H2: Assistant entrypoints
  - H2: Notification forwarding
  - H2: संबंधित

## platforms/digitalocean.md

- मार्ग: /platforms/digitalocean
- शीर्षक:
  - H2: संबंधित

## platforms/easyrunner.md

- मार्ग: /platforms/easyrunner
- शीर्षक:
  - H2: शुरू करने से पहले
  - H2: Compose app
  - H2: OpenClaw कॉन्फ़िगर करें
  - H2: सत्यापित करें
  - H2: अपडेट और बैकअप
  - H2: समस्या निवारण

## platforms/index.md

- मार्ग: /platforms
- शीर्षक:
  - H2: अपना OS चुनें
  - H2: VPS और hosting
  - H2: सामान्य लिंक
  - H2: Gateway service install (CLI)
  - H2: संबंधित

## platforms/ios.md

- मार्ग: /platforms/ios
- शीर्षक:
  - H2: यह क्या करता है
  - H2: आवश्यकताएँ
  - H2: Quick start (pair + connect)
  - H2: आधिकारिक builds के लिए relay-backed push
  - H2: Background alive beacons
  - H2: Authentication और trust flow
  - H2: Discovery paths
  - H3: Bonjour (LAN)
  - H3: Tailnet (cross-network)
  - H3: Manual host/port
  - H2: Canvas + A2UI
  - H2: Computer Use संबंध
  - H3: Canvas eval / snapshot
  - H2: Voice wake + talk mode
  - H2: सामान्य त्रुटियाँ
  - H2: संबंधित docs

## platforms/linux.md

- मार्ग: /platforms/linux
- शीर्षक:
  - H2: शुरुआती quick path (VPS)
  - H2: इंस्टॉल करें
  - H2: Gateway
  - H2: Gateway service install (CLI)
  - H2: System control (systemd user unit)
  - H2: Memory pressure और OOM kills
  - H2: संबंधित

## platforms/mac/bundled-gateway.md

- मार्ग: /platforms/mac/bundled-gateway
- शीर्षक:
  - H2: CLI इंस्टॉल करें (local mode के लिए आवश्यक)
  - H2: Launchd (Gateway as LaunchAgent)
  - H2: Version compatibility
  - H2: macOS पर state directory
  - H2: App connectivity debug करें
  - H2: Smoke check
  - H2: संबंधित

## platforms/mac/canvas.md

- मार्ग: /platforms/mac/canvas
- शीर्षक:
  - H2: Canvas कहाँ रहता है
  - H2: Panel behavior
  - H2: Agent API surface
  - H2: Canvas में A2UI
  - H3: A2UI commands (v0.8)
  - H2: Canvas से agent runs trigger करना
  - H2: Security notes
  - H2: संबंधित

## platforms/mac/child-process.md

- मार्ग: /platforms/mac/child-process
- शीर्षक:
  - H2: डिफ़ॉल्ट व्यवहार (launchd)
  - H2: Unsigned dev builds
  - H2: Attach-only mode
  - H2: Remote mode
  - H2: हम launchd को क्यों प्राथमिकता देते हैं
  - H2: संबंधित

## platforms/mac/dev-setup.md

- रूट: /platforms/mac/dev-setup
- शीर्षक:
  - H1: macOS डेवलपर सेटअप
  - H2: पूर्वापेक्षाएँ
  - H2: 1. निर्भरताएँ इंस्टॉल करें
  - H2: 2. ऐप बनाएँ और पैकेज करें
  - H2: 3. CLI इंस्टॉल करें
  - H2: समस्या निवारण
  - H3: बिल्ड विफल: टूलचेन या SDK असंगति
  - H3: अनुमति देने पर ऐप क्रैश होता है
  - H3: Gateway "शुरू हो रहा है..." अनिश्चित काल तक
  - H2: संबंधित

## platforms/mac/health.md

- रूट: /platforms/mac/health
- शीर्षक:
  - H1: macOS पर स्वास्थ्य जाँच
  - H2: मेनू बार
  - H2: सेटिंग्स
  - H2: प्रोब कैसे काम करता है
  - H2: संदेह होने पर
  - H2: संबंधित

## platforms/mac/icon.md

- रूट: /platforms/mac/icon
- शीर्षक:
  - H1: मेनू बार आइकन अवस्थाएँ
  - H2: संबंधित

## platforms/mac/logging.md

- रूट: /platforms/mac/logging
- शीर्षक:
  - H1: लॉगिंग (macOS)
  - H2: रोलिंग डायग्नोस्टिक्स फ़ाइल लॉग (डीबग पेन)
  - H2: macOS पर यूनिफ़ाइड लॉगिंग निजी डेटा
  - H2: OpenClaw (ai.openclaw) के लिए सक्षम करें
  - H2: डीबगिंग के बाद अक्षम करें
  - H2: संबंधित

## platforms/mac/menu-bar.md

- रूट: /platforms/mac/menu-bar
- शीर्षक:
  - H2: क्या दिखाया जाता है
  - H2: अवस्था मॉडल
  - H2: IconState enum (Swift)
  - H3: ActivityKind → ग्लिफ़
  - H3: दृश्य मैपिंग
  - H2: संदर्भ सबमेनू
  - H2: स्थिति पंक्ति पाठ (मेनू)
  - H2: इवेंट इनजेशन
  - H2: डीबग ओवरराइड
  - H2: परीक्षण चेकलिस्ट
  - H2: संबंधित

## platforms/mac/peekaboo.md

- रूट: /platforms/mac/peekaboo
- शीर्षक:
  - H2: यह क्या है (और क्या नहीं है)
  - H2: Computer Use से संबंध
  - H2: ब्रिज सक्षम करें
  - H2: क्लाइंट खोज क्रम
  - H2: सुरक्षा और अनुमतियाँ
  - H2: स्नैपशॉट व्यवहार (ऑटोमेशन)
  - H2: समस्या निवारण
  - H2: संबंधित

## platforms/mac/permissions.md

- रूट: /platforms/mac/permissions
- शीर्षक:
  - H2: स्थिर अनुमतियों की आवश्यकताएँ
  - H2: Node और CLI रनटाइम के लिए Accessibility अनुदान
  - H2: प्रॉम्प्ट गायब होने पर पुनर्प्राप्ति चेकलिस्ट
  - H2: फ़ाइलों और फ़ोल्डरों की अनुमतियाँ (Desktop/Documents/Downloads)
  - H2: संबंधित

## platforms/mac/remote.md

- रूट: /platforms/mac/remote
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

- रूट: /platforms/mac/signing
- शीर्षक:
  - H1: mac साइनिंग (डीबग बिल्ड)
  - H2: उपयोग
  - H3: ऐड-हॉक साइनिंग नोट
  - H2: About के लिए बिल्ड मेटाडेटा
  - H2: क्यों
  - H2: संबंधित

## platforms/mac/skills.md

- रूट: /platforms/mac/skills
- शीर्षक:
  - H2: डेटा स्रोत
  - H2: इंस्टॉल कार्रवाइयाँ
  - H2: Env/API कुंजियाँ
  - H2: रिमोट मोड
  - H2: संबंधित

## platforms/mac/voice-overlay.md

- रूट: /platforms/mac/voice-overlay
- शीर्षक:
  - H1: वॉइस ओवरले जीवनचक्र (macOS)
  - H2: वर्तमान आशय
  - H2: लागू किया गया (9 दिसंबर, 2025)
  - H2: अगले चरण
  - H2: डीबगिंग चेकलिस्ट
  - H2: माइग्रेशन चरण (सुझाए गए)
  - H2: संबंधित

## platforms/mac/voicewake.md

- रूट: /platforms/mac/voicewake
- शीर्षक:
  - H1: वॉइस वेक और पुश-टू-टॉक
  - H2: आवश्यकताएँ
  - H2: मोड
  - H2: रनटाइम व्यवहार (वेक-वर्ड)
  - H2: जीवनचक्र अपरिवर्तनीयताएँ
  - H2: स्टिकी ओवरले विफलता मोड (पिछला)
  - H2: पुश-टू-टॉक विशिष्टताएँ
  - H2: उपयोगकर्ता-दृश्य सेटिंग्स
  - H2: फ़ॉरवर्डिंग व्यवहार
  - H2: फ़ॉरवर्डिंग पेलोड
  - H2: त्वरित सत्यापन
  - H2: संबंधित

## platforms/mac/webchat.md

- रूट: /platforms/mac/webchat
- शीर्षक:
  - H2: लॉन्च और डीबगिंग
  - H2: यह कैसे वायर किया गया है
  - H2: सुरक्षा सतह
  - H2: ज्ञात सीमाएँ
  - H2: संबंधित

## platforms/mac/xpc.md

- रूट: /platforms/mac/xpc
- शीर्षक:
  - H1: OpenClaw macOS IPC आर्किटेक्चर
  - H2: लक्ष्य
  - H2: यह कैसे काम करता है
  - H3: Gateway + node ट्रांसपोर्ट
  - H3: Node सेवा + ऐप IPC
  - H3: PeekabooBridge (UI ऑटोमेशन)
  - H2: परिचालन फ़्लो
  - H2: हार्डनिंग नोट्स
  - H2: संबंधित

## platforms/macos.md

- रूट: /platforms/macos
- शीर्षक:
  - H2: डाउनलोड
  - H2: पहला रन
  - H2: Gateway मोड चुनें
  - H2: ऐप क्या स्वामित्व रखता है
  - H2: macOS विवरण पृष्ठ
  - H2: संबंधित

## platforms/oracle.md

- रूट: /platforms/oracle
- शीर्षक:
  - H2: संबंधित

## platforms/raspberry-pi.md

- रूट: /platforms/raspberry-pi
- शीर्षक:
  - H2: संबंधित

## platforms/windows.md

- रूट: /platforms/windows
- शीर्षक:
  - H2: अनुशंसित: Windows Hub
  - H3: Windows Hub में क्या शामिल है
  - H3: पहला लॉन्च
  - H2: Windows node मोड
  - H2: स्थानीय MCP मोड
  - H2: नेटिव Windows CLI और Gateway
  - H2: WSL2 Gateway
  - H2: Windows लॉगिन से पहले Gateway ऑटो-स्टार्ट
  - H2: WSL सेवाओं को LAN पर एक्सपोज़ करें
  - H2: समस्या निवारण
  - H3: ट्रे आइकन दिखाई नहीं देता
  - H3: स्थानीय सेटअप विफल होता है
  - H3: ऐप कहता है कि पेयरिंग आवश्यक है
  - H3: वेब चैट रिमोट Gateway तक नहीं पहुँच सकता
  - H3: screen.snapshot, camera, या audio कमांड विफल होते हैं
  - H3: Git या GitHub कनेक्टिविटी विफल होती है
  - H2: संबंधित

## plugins/adding-capabilities.md

- रूट: /plugins/adding-capabilities
- शीर्षक:
  - H2: capability कब बनानी है
  - H2: मानक क्रम
  - H2: क्या कहाँ जाता है
  - H2: Provider और harness सीमाएँ
  - H2: फ़ाइल चेकलिस्ट
  - H2: काम किया हुआ उदाहरण: इमेज जनरेशन
  - H2: एम्बेडिंग Provider
  - H2: समीक्षा चेकलिस्ट
  - H2: संबंधित

## plugins/admin-http-rpc.md

- रूट: /plugins/admin-http-rpc
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

- रूट: /plugins/agent-tools
- शीर्षक:
  - H2: संबंधित

## plugins/architecture-internals.md

- रूट: /plugins/architecture-internals
- शीर्षक:
  - H2: लोड पाइपलाइन
  - H3: Manifest-first व्यवहार
  - H3: Plugin कैश सीमा
  - H2: Registry मॉडल
  - H2: Conversation binding callbacks
  - H2: Provider रनटाइम hooks
  - H3: Hook क्रम और उपयोग
  - H3: Provider उदाहरण
  - H3: अंतर्निहित उदाहरण
  - H2: रनटाइम helpers
  - H3: api.runtime.imageGeneration
  - H2: Gateway HTTP रूट
  - H2: Plugin SDK import paths
  - H2: Message tool schemas
  - H2: Channel target resolution
  - H2: Config-backed directories
  - H2: Provider catalogs
  - H2: रीड-ओनली channel inspection
  - H2: Package packs
  - H3: Channel catalog metadata
  - H2: Context engine plugins
  - H2: नई capability जोड़ना
  - H3: Capability चेकलिस्ट
  - H3: Capability टेम्पलेट
  - H2: संबंधित

## plugins/architecture.md

- रूट: /plugins/architecture
- शीर्षक:
  - H2: सार्वजनिक capability मॉडल
  - H3: बाहरी संगतता रुख
  - H3: Plugin shapes
  - H3: Legacy hooks
  - H3: संगतता संकेत
  - H2: आर्किटेक्चर अवलोकन
  - H3: Plugin metadata snapshot और lookup table
  - H3: Activation planning
  - H3: Channel plugins और साझा message tool
  - H2: Capability ownership model
  - H3: Capability layering
  - H3: Multi-capability company plugin example
  - H3: Capability example: video understanding
  - H2: अनुबंध और प्रवर्तन
  - H3: अनुबंध में क्या शामिल होता है
  - H2: निष्पादन मॉडल
  - H2: Export boundary
  - H2: आंतरिक विवरण और संदर्भ
  - H2: संबंधित

## plugins/building-extensions.md

- रूट: /plugins/building-extensions
- शीर्षक:
  - H2: संबंधित

## plugins/building-plugins.md

- रूट: /plugins/building-plugins
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: Plugin shape चुनें
  - H2: Quickstart
  - H2: Tools पंजीकृत करना
  - H2: Import conventions
  - H2: सबमिशन-पूर्व चेकलिस्ट
  - H2: beta releases के विरुद्ध परीक्षण करें
  - H2: अगले चरण
  - H2: संबंधित

## plugins/bundles.md

- रूट: /plugins/bundles
- शीर्षक:
  - H2: Bundles क्यों मौजूद हैं
  - H2: Bundle इंस्टॉल करें
  - H2: OpenClaw bundles से क्या मैप करता है
  - H3: अभी समर्थित
  - H4: Skill सामग्री
  - H4: Hook packs
  - H4: एम्बेडेड OpenClaw के लिए MCP
  - H4: एम्बेडेड OpenClaw सेटिंग्स
  - H4: एम्बेडेड OpenClaw LSP
  - H3: पहचाना गया लेकिन निष्पादित नहीं
  - H2: Bundle formats
  - H2: Detection precedence
  - H2: Runtime dependencies और cleanup
  - H2: सुरक्षा
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/cli-backend-plugins.md

- रूट: /plugins/cli-backend-plugins
- शीर्षक:
  - H2: Plugin क्या स्वामित्व रखता है
  - H2: न्यूनतम backend plugin
  - H2: Config shape
  - H2: उन्नत backend hooks
  - H3: ownsNativeCompaction: OpenClaw compaction से opt out करना
  - H2: MCP tool bridge
  - H2: उपयोगकर्ता कॉन्फ़िगरेशन
  - H2: सत्यापन
  - H2: चेकलिस्ट
  - H2: संबंधित

## plugins/codex-computer-use.md

- रूट: /plugins/codex-computer-use
- शीर्षक:
  - H2: OpenClaw.app और Peekaboo
  - H2: iOS ऐप
  - H2: Direct cua-driver MCP
  - H2: त्वरित सेटअप
  - H2: कमांड
  - H2: Marketplace विकल्प
  - H2: Bundled macOS marketplace
  - H2: Remote catalog limit
  - H2: Configuration reference
  - H2: OpenClaw क्या जाँचता है
  - H2: macOS अनुमतियाँ
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/codex-harness-reference.md

- रूट: /plugins/codex-harness-reference
- शीर्षक:
  - H2: Plugin config surface
  - H2: App-server transport
  - H2: Approval and sandbox modes
  - H2: Sandboxed native execution
  - H2: Auth and environment isolation
  - H2: Dynamic tools
  - H2: Timeouts
  - H2: Model discovery
  - H2: Workspace bootstrap files
  - H2: Environment overrides
  - H2: संबंधित

## plugins/codex-harness-runtime.md

- रूट: /plugins/codex-harness-runtime
- शीर्षक:
  - H2: अवलोकन
  - H2: Thread bindings and model changes
  - H2: Visible replies and heartbeats
  - H2: Hook boundaries
  - H2: V1 support contract
  - H2: Native permissions and MCP elicitations
  - H2: Queue steering
  - H2: Codex feedback upload
  - H2: Compaction and transcript mirror
  - H2: Media and delivery
  - H2: संबंधित

## plugins/codex-harness.md

- रूट: /plugins/codex-harness
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: Quickstart
  - H2: कॉन्फ़िगरेशन
  - H2: Codex runtime सत्यापित करें
  - H2: Routing and model selection
  - H2: Deployment patterns
  - H3: Basic Codex deployment
  - H3: Mixed provider deployment
  - H3: Fail-closed Codex deployment
  - H2: App-server policy
  - H2: Commands and diagnostics
  - H3: Codex threads को स्थानीय रूप से निरीक्षण करें
  - H2: Native Codex plugins
  - H2: Computer Use
  - H2: Runtime boundaries
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/codex-native-plugins.md

- रूट: /plugins/codex-native-plugins
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: Quickstart
  - H2: चैट से plugins प्रबंधित करें
  - H2: Native plugin setup कैसे काम करता है
  - H2: V1 support boundary
  - H2: App inventory and ownership
  - H2: Thread app config
  - H2: Destructive action policy
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/community.md

- रूट: /plugins/community
- शीर्षक:
  - H2: plugins खोजें
  - H2: plugins प्रकाशित करें
  - H2: संबंधित

## plugins/compatibility.md

- रूट: /plugins/compatibility
- शीर्षक:
  - H2: संगतता registry
  - H2: Plugin inspector package
  - H3: Maintainer acceptance lane
  - H2: Deprecation policy
  - H2: वर्तमान संगतता क्षेत्र
  - H3: WhatsApp Inbound Callback Flat Aliases
  - H3: WhatsApp Inbound Admission Fields
  - H2: रिलीज़ नोट्स

## plugins/copilot.md

- रूट: /plugins/copilot
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: Plugin इंस्टॉल
  - H2: Quickstart
  - H2: समर्थित providers
  - H2: BYOK
  - H2: Auth
  - H2: Configuration surface
  - H2: Compaction
  - H2: Transcript mirroring
  - H2: Side questions (/btw)
  - H2: Doctor
  - H2: सीमाएँ
  - H2: Permissions and askuser
  - H3: Session-level GitHub token
  - H2: संबंधित

## plugins/dependency-resolution.md

- रूट: /plugins/dependency-resolution
- शीर्षक:
  - H2: ज़िम्मेदारी विभाजन
  - H2: Install roots
  - H2: Local plugins
  - H2: Startup and reload
  - H2: Bundled plugins
  - H2: Legacy cleanup

## plugins/google-meet.md

- रूट: /plugins/google-meet
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: स्थानीय Gateway + Parallels Chrome
  - H2: इंस्टॉल नोट्स
  - H2: ट्रांसपोर्ट
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth और प्रीफ़्लाइट
  - H3: Google क्रेडेंशियल बनाएँ
  - H3: रिफ़्रेश टोकन जारी करें
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
  - H3: एजेंट शामिल होता है लेकिन बोलता नहीं
  - H3: Twilio सेटअप जाँचें विफल होती हैं
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
  - H3: Exec वातावरण हुक
  - H3: टूल परिणाम पर्सिस्टेंस
  - H2: प्रॉम्प्ट और मॉडल हुक
  - H3: सेशन एक्सटेंशन और अगले-टर्न इंजेक्शन
  - H2: मैसेज हुक
  - H2: हुक इंस्टॉल करें
  - H2: Gateway लाइफ़साइकिल
  - H2: आगामी डिप्रीकेशन
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
  - H2: Plugin सूचीबद्ध करें और खोजें
  - H2: Plugin इंस्टॉल करें
  - H2: रीस्टार्ट करें और निरीक्षण करें
  - H2: Plugin अपडेट करें
  - H2: Plugin अनइंस्टॉल करें
  - H2: स्रोत चुनें
  - H2: Plugin प्रकाशित करें
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
  - H3: किसी अन्य चैनल Plugin को बदलना
  - H2: modelSupport संदर्भ
  - H2: modelCatalog संदर्भ
  - H2: modelIdNormalization संदर्भ
  - H2: providerEndpoints संदर्भ
  - H2: providerRequest संदर्भ
  - H2: secretProviderIntegrations संदर्भ
  - H2: modelPricing संदर्भ
  - H3: OpenClaw प्रदाता इंडेक्स
  - H2: मैनिफ़ेस्ट बनाम package.json
  - H3: package.json फ़ील्ड जो डिस्कवरी को प्रभावित करते हैं
  - H2: डिस्कवरी प्राथमिकता (डुप्लिकेट Plugin आईडी)
  - H2: JSON स्कीमा आवश्यकताएँ
  - H2: वैलिडेशन व्यवहार
  - H2: नोट्स
  - H2: संबंधित

## plugins/memory-lancedb.md

- रूट: /plugins/memory-lancedb
- शीर्षक:
  - H2: इंस्टॉलेशन
  - H2: त्वरित शुरुआत
  - H2: प्रदाता-समर्थित एम्बेडिंग
  - H2: Ollama एम्बेडिंग
  - H2: OpenAI-संगत प्रदाता
  - H2: रिकॉल और कैप्चर सीमाएँ
  - H2: कमांड
  - H2: स्टोरेज
  - H2: रनटाइम निर्भरताएँ
  - H2: समस्या निवारण
  - H3: इनपुट लंबाई संदर्भ लंबाई से अधिक है
  - H3: असमर्थित एम्बेडिंग मॉडल
  - H3: Plugin लोड होता है लेकिन कोई मेमरी दिखाई नहीं देती
  - H2: संबंधित

## plugins/memory-wiki.md

- रूट: /plugins/memory-wiki
- शीर्षक:
  - H2: यह क्या जोड़ता है
  - H2: यह मेमरी के साथ कैसे फिट बैठता है
  - H2: अनुशंसित हाइब्रिड पैटर्न
  - H2: वॉल्ट मोड
  - H3: आइसोलेटेड
  - H3: ब्रिज
  - H3: असुरक्षित-लोकल
  - H2: वॉल्ट लेआउट
  - H2: Open Knowledge Format इम्पोर्ट
  - H2: संरचित दावे और प्रमाण
  - H2: एजेंट-फेसिंग एंटिटी मेटाडेटा
  - H2: कम्पाइल पाइपलाइन
  - H2: डैशबोर्ड और स्वास्थ्य रिपोर्ट
  - H2: खोज और पुनर्प्राप्ति
  - H2: एजेंट टूल
  - H2: प्रॉम्प्ट और संदर्भ व्यवहार
  - H2: कॉन्फ़िगरेशन
  - H3: उदाहरण: QMD + ब्रिज मोड
  - H2: CLI
  - H2: Obsidian समर्थन
  - H2: अनुशंसित वर्कफ़्लो
  - H2: संबंधित दस्तावेज़

## plugins/message-presentation.md

- रूट: /plugins/message-presentation
- शीर्षक:
  - H2: कॉन्ट्रैक्ट
  - H2: प्रोड्यूसर उदाहरण
  - H2: रेंडरर कॉन्ट्रैक्ट
  - H2: कोर रेंडर फ़्लो
  - H2: डिग्रेडेशन नियम
  - H2: प्रदाता मैपिंग
  - H2: प्रेज़ेंटेशन बनाम InteractiveReply
  - H2: डिलीवरी पिन
  - H2: Plugin लेखक चेकलिस्ट
  - H2: संबंधित दस्तावेज़

## plugins/oc-path.md

- रूट: /plugins/oc-path
- शीर्षक:
  - H2: इसे क्यों सक्षम करें
  - H2: यह कहाँ चलता है
  - H2: सक्षम करें
  - H2: निर्भरताएँ
  - H2: यह क्या प्रदान करता है
  - H2: अन्य Plugin से संबंध
  - H2: सुरक्षा
  - H2: संबंधित

## plugins/plugin-inventory.md

- रूट: /plugins/plugin-inventory
- शीर्षक:
  - H1: Plugin इन्वेंटरी
  - H2: परिभाषाएँ
  - H2: Plugin इंस्टॉल करें
  - H2: कोर npm पैकेज
  - H2: आधिकारिक बाहरी पैकेज
  - H2: केवल स्रोत चेकआउट

## plugins/plugin-permission-requests.md

- रूट: /plugins/plugin-permission-requests
- शीर्षक:
  - H2: सही गेट चुनें
  - H2: टूल कॉल से पहले अनुमोदन का अनुरोध करें
  - H2: निर्णय व्यवहार
  - H2: अनुमोदन प्रॉम्प्ट रूट करें
  - H2: Codex नेटिव अनुमतियाँ
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/reference.md

- रूट: /plugins/reference
- शीर्षक:
  - H1: Plugin संदर्भ

## plugins/reference/acpx.md

- रूट: /plugins/reference/acpx
- शीर्षक:
  - H1: ACPx Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/admin-http-rpc.md

- रूट: /plugins/reference/admin-http-rpc
- शीर्षक:
  - H1: Admin Http Rpc Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/alibaba.md

- रूट: /plugins/reference/alibaba
- शीर्षक:
  - H1: Alibaba Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/amazon-bedrock-mantle.md

- रूट: /plugins/reference/amazon-bedrock-mantle
- शीर्षक:
  - H1: Amazon Bedrock Mantle Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/amazon-bedrock.md

- रूट: /plugins/reference/amazon-bedrock
- शीर्षक:
  - H1: Amazon Bedrock Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/anthropic-vertex.md

- रूट: /plugins/reference/anthropic-vertex
- शीर्षक:
  - H1: Anthropic Vertex Plugin
  - H2: वितरण
  - H2: सतह
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- रूट: /plugins/reference/anthropic
- शीर्षक:
  - H1: Anthropic Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/arcee.md

- रूट: /plugins/reference/arcee
- शीर्षक:
  - H1: Arcee Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/azure-speech.md

- रूट: /plugins/reference/azure-speech
- शीर्षक:
  - H1: Azure Speech Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/bonjour.md

- रूट: /plugins/reference/bonjour
- शीर्षक:
  - H1: Bonjour Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/brave.md

- रूट: /plugins/reference/brave
- शीर्षक:
  - H1: Brave Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/browser.md

- रूट: /plugins/reference/browser
- शीर्षक:
  - H1: Browser Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/byteplus.md

- रूट: /plugins/reference/byteplus
- शीर्षक:
  - H1: BytePlus Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/canvas.md

- रूट: /plugins/reference/canvas
- शीर्षक:
  - H1: Canvas Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/cerebras.md

- रूट: /plugins/reference/cerebras
- शीर्षक:
  - H1: Cerebras Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/chutes.md

- रूट: /plugins/reference/chutes
- शीर्षक:
  - H1: Chutes Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/clickclack.md

- रूट: /plugins/reference/clickclack
- शीर्षक:
  - H1: Clickclack Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/cloudflare-ai-gateway.md

- रूट: /plugins/reference/cloudflare-ai-gateway
- शीर्षक:
  - H1: Cloudflare AI Gateway Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/codex-supervisor.md

- रूट: /plugins/reference/codex-supervisor
- शीर्षक:
  - H1: Codex Supervisor Plugin
  - H2: वितरण
  - H2: सतह
  - H2: सेशन लिस्टिंग

## plugins/reference/codex.md

- रूट: /plugins/reference/codex
- शीर्षक:
  - H1: Codex Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/cohere.md

- रूट: /plugins/reference/cohere
- शीर्षक:
  - H1: Cohere Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/comfy.md

- रूट: /plugins/reference/comfy
- शीर्षक:
  - H1: ComfyUI Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/copilot-proxy.md

- रूट: /plugins/reference/copilot-proxy
- शीर्षक:
  - H1: Copilot Proxy Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/copilot.md

- रूट: /plugins/reference/copilot
- शीर्षक:
  - H1: Copilot Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/deepgram.md

- रूट: /plugins/reference/deepgram
- शीर्षक:
  - H1: Deepgram Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/deepinfra.md

- रूट: /plugins/reference/deepinfra
- शीर्षक:
  - H1: DeepInfra Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/deepseek.md

- रूट: /plugins/reference/deepseek
- शीर्षक:
  - H1: DeepSeek Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/diagnostics-otel.md

- रूट: /plugins/reference/diagnostics-otel
- शीर्षक:
  - H1: Diagnostics OpenTelemetry Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/diagnostics-prometheus.md

- रूट: /plugins/reference/diagnostics-prometheus
- शीर्षक:
  - H1: Diagnostics Prometheus Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/diffs-language-pack.md

- रूट: /plugins/reference/diffs-language-pack
- शीर्षक:
  - H1: Diffs Language Pack Plugin
  - H2: वितरण
  - H2: सतह
  - H2: जोड़ी गई भाषाएँ

## plugins/reference/diffs.md

- रूट: /plugins/reference/diffs
- शीर्षक:
  - H1: Diffs Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/discord.md

- रूट: /plugins/reference/discord
- शीर्षक:
  - H1: Discord Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/document-extract.md

- रूट: /plugins/reference/document-extract
- शीर्षक:
  - H1: Document Extract Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/duckduckgo.md

- रूट: /plugins/reference/duckduckgo
- शीर्षक:
  - H1: DuckDuckGo Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/elevenlabs.md

- रूट: /plugins/reference/elevenlabs
- शीर्षक:
  - H1: Elevenlabs Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/exa.md

- रूट: /plugins/reference/exa
- शीर्षक:
  - H1: Exa Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/fal.md

- रूट: /plugins/reference/fal
- शीर्षक:
  - H1: fal Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/feishu.md

- रूट: /plugins/reference/feishu
- शीर्षक:
  - H1: Feishu Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/file-transfer.md

- रूट: /plugins/reference/file-transfer
- शीर्षक:
  - H1: File Transfer Plugin
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
  - H2: MAI छवि जनरेशन
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
  - H1: Migrate Claude Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/migrate-hermes.md

- रूट: /plugins/reference/migrate-hermes
- शीर्षक:
  - H1: Migrate Hermes Plugin
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

- रूट: /plugins/reference/twitch
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
  - H1: Voice Call Plugin
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
  - H1: Web Readability Plugin
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
  - H2: कोर अब भी क्या नियंत्रित करता है
  - H2: हार्नेस पंजीकृत करें
  - H2: चयन नीति
  - H2: प्रदाता और हार्नेस की जोड़ी
  - H3: टूल-परिणाम मिडलवेयर
  - H3: टर्मिनल परिणाम वर्गीकरण
  - H3: एजेंट-अंत साइड इफेक्ट
  - H3: उपयोगकर्ता इनपुट और टूल सतहें
  - H3: नेटिव Codex हार्नेस मोड
  - H2: रनटाइम सख्ती
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
  - H1: चैनल इनग्रेस एपीआई
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
  - H2: चरण-दर-चरण मार्गदर्शिका
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
  - H2: टॉक और रीयलटाइम वॉइस माइग्रेशन योजना
  - H2: संगतता नीति
  - H2: माइग्रेट कैसे करें
  - H2: इम्पोर्ट पाथ संदर्भ
  - H2: सक्रिय डिप्रीकेशन
  - H2: हटाने की समयरेखा
  - H2: चेतावनियों को अस्थायी रूप से दबाना
  - H2: संबंधित

## plugins/sdk-overview.md

- मार्ग: /plugins/sdk-overview
- शीर्षक:
  - H2: इम्पोर्ट कन्वेंशन
  - H2: सबपाथ संदर्भ
  - H2: पंजीकरण एपीआई
  - H3: क्षमता पंजीकरण
  - H3: टूल और कमांड
  - H3: इन्फ्रास्ट्रक्चर
  - H3: वर्कफ़्लो Plugin के लिए होस्ट हुक
  - H3: Gateway डिस्कवरी पंजीकरण
  - H3: CLI पंजीकरण मेटाडेटा
  - H3: CLI बैकएंड पंजीकरण
  - H3: एक्सक्लूसिव स्लॉट
  - H3: डिप्रीकेटेड मेमोरी एम्बेडिंग अडैप्टर
  - H3: इवेंट और लाइफ़साइकल
  - H3: हुक निर्णय सिमेंटिक्स
  - H3: एपीआई ऑब्जेक्ट फ़ील्ड
  - H2: आंतरिक मॉड्यूल कन्वेंशन
  - H2: संबंधित

## plugins/sdk-provider-plugins.md

- मार्ग: /plugins/sdk-provider-plugins
- शीर्षक:
  - H2: चरण-दर-चरण मार्गदर्शिका
  - H2: ClawHub पर प्रकाशित करें
  - H2: फ़ाइल संरचना
  - H2: कैटलॉग क्रम संदर्भ
  - H2: अगले चरण
  - H2: संबंधित

## plugins/sdk-runtime.md

- मार्ग: /plugins/sdk-runtime
- शीर्षक:
  - H2: कॉन्फ़िग लोड करना और लिखना
  - H2: पुन: उपयोग योग्य रनटाइम यूटिलिटी
  - H2: रनटाइम नेमस्पेस
  - H2: रनटाइम संदर्भ संग्रहीत करना
  - H2: अन्य शीर्ष-स्तरीय एपीआई फ़ील्ड
  - H2: संबंधित

## plugins/sdk-setup.md

- मार्ग: /plugins/sdk-setup
- शीर्षक:
  - H2: पैकेज मेटाडेटा
  - H3: openclaw फ़ील्ड
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: स्थगित पूर्ण लोड
  - H2: Plugin मैनिफ़ेस्ट
  - H2: ClawHub प्रकाशन
  - H2: सेटअप एंट्री
  - H3: संकीर्ण सेटअप हेल्पर इम्पोर्ट
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
  - H3: डिप्रीकेटेड संगतता और टेस्ट हेल्पर
  - H3: आरक्षित बंडल्ड Plugin हेल्पर सबपाथ
  - H2: संबंधित

## plugins/sdk-testing.md

- मार्ग: /plugins/sdk-testing
- शीर्षक:
  - H2: टेस्ट यूटिलिटी
  - H3: उपलब्ध एक्सपोर्ट
  - H3: प्रकार
  - H2: टेस्टिंग लक्ष्य रिज़ॉल्यूशन
  - H2: टेस्टिंग पैटर्न
  - H3: पंजीकरण कॉन्ट्रैक्ट की टेस्टिंग
  - H3: रनटाइम कॉन्फ़िग एक्सेस की टेस्टिंग
  - H3: चैनल Plugin की यूनिट टेस्टिंग
  - H3: प्रदाता Plugin की यूनिट टेस्टिंग
  - H3: Plugin रनटाइम को मॉक करना
  - H3: प्रति-इंस्टेंस स्टब के साथ टेस्टिंग
  - H2: कॉन्ट्रैक्ट टेस्ट (इन-रेपो Plugin)
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
  - H2: रिटर्न वैल्यू
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
  - H2: त्वरित शुरुआत
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
  - H3: बोले गए आउटपुट का कॉन्ट्रैक्ट
  - H3: बातचीत शुरू होने का व्यवहार
  - H3: Twilio स्ट्रीम डिस्कनेक्ट ग्रेस
  - H2: बासी कॉल रीपर
  - H2: Webhook सुरक्षा
  - H2: CLI
  - H2: एजेंट टूल
  - H2: Gateway RPC
  - H2: समस्या निवारण
  - H3: सेटअप Webhook एक्सपोज़र में विफल होता है
  - H3: प्रदाता क्रेडेंशियल विफल होते हैं
  - H3: कॉल शुरू होते हैं लेकिन प्रदाता Webhook नहीं आते
  - H3: सिग्नेचर सत्यापन विफल होता है
  - H3: Google Meet Twilio जॉइन विफल होते हैं
  - H3: रीयलटाइम कॉल में स्पीच नहीं है
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
  - H3: कार्ड सहेजे नहीं जाते
  - H3: कार्ड शुरू करने से अपेक्षित सत्र नहीं खुलता
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
  - H2: शुरुआत करना
  - H2: बिल्ट-इन Wan मॉडल
  - H2: क्षमताएँ और सीमाएँ
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/anthropic.md

- मार्ग: /providers/anthropic
- शीर्षक:
  - H2: शुरुआत करना
  - H2: थिंकिंग डिफ़ॉल्ट (Claude Fable 5, 4.8, और 4.6)
  - H2: प्रॉम्प्ट कैशिंग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/arcee.md

- मार्ग: /providers/arcee
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: गैर-इंटरैक्टिव सेटअप
  - H2: बिल्ट-इन कैटलॉग
  - H2: समर्थित सुविधाएँ
  - H2: संबंधित

## providers/azure-speech.md

- मार्ग: /providers/azure-speech
- शीर्षक:
  - H2: शुरुआत करना
  - H2: कॉन्फ़िगरेशन विकल्प
  - H2: नोट्स
  - H2: संबंधित

## providers/bedrock-mantle.md

- मार्ग: /providers/bedrock-mantle
- शीर्षक:
  - H2: शुरुआत करना
  - H2: स्वचालित मॉडल डिस्कवरी
  - H3: समर्थित क्षेत्र
  - H2: मैनुअल कॉन्फ़िगरेशन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/bedrock.md

- मार्ग: /providers/bedrock
- शीर्षक:
  - H2: शुरुआत करना
  - H2: स्वचालित मॉडल डिस्कवरी
  - H2: त्वरित सेटअप (AWS पाथ)
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/cerebras.md

- मार्ग: /providers/cerebras
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: गैर-इंटरैक्टिव सेटअप
  - H2: बिल्ट-इन कैटलॉग
  - H2: मैनुअल कॉन्फ़िग
  - H2: संबंधित

## providers/chutes.md

- मार्ग: /providers/chutes
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करना
  - H2: डिस्कवरी व्यवहार
  - H2: डिफ़ॉल्ट एलियस
  - H2: बिल्ट-इन स्टार्टर कैटलॉग
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/claude-max-api-proxy.md

- रूट: /providers/claude-max-api-proxy
- शीर्षक:
  - H2: इसका उपयोग क्यों करें?
  - H2: यह कैसे काम करता है
  - H2: शुरुआत करें
  - H2: अंतर्निर्मित कैटलॉग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: संबंधित

## providers/cloudflare-ai-gateway.md

- रूट: /providers/cloudflare-ai-gateway
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करें
  - H2: गैर-इंटरैक्टिव उदाहरण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/cohere.md

- रूट: /providers/cohere
- शीर्षक:
  - H2: शुरू करें
  - H2: केवल-एनवायरनमेंट सेटअप
  - H2: संबंधित

## providers/comfy.md

- रूट: /providers/comfy
- शीर्षक:
  - H2: यह क्या समर्थित करता है
  - H2: शुरुआत करें
  - H2: कॉन्फ़िगरेशन
  - H3: साझा कुंजियां
  - H3: प्रति-क्षमता कुंजियां
  - H2: वर्कफ़्लो विवरण
  - H2: संबंधित

## providers/deepgram.md

- रूट: /providers/deepgram
- शीर्षक:
  - H2: शुरुआत करें
  - H2: कॉन्फ़िगरेशन विकल्प
  - H2: Voice Call स्ट्रीमिंग STT
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
  - H2: शुरुआत करें
  - H2: अंतर्निर्मित कैटलॉग
  - H2: सोच और टूल
  - H2: लाइव परीक्षण
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/ds4.md

- रूट: /providers/ds4
- शीर्षक:
  - H2: आवश्यकताएं
  - H2: त्वरित शुरुआत
  - H2: पूरा कॉन्फ़िग
  - H2: मांग पर स्टार्टअप
  - H2: अधिकतम सोच
  - H2: परीक्षण
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/elevenlabs.md

- रूट: /providers/elevenlabs
- शीर्षक:
  - H2: प्रमाणीकरण
  - H2: टेक्स्ट-से-स्पीच
  - H2: स्पीच-से-टेक्स्ट
  - H2: स्ट्रीमिंग STT
  - H2: संबंधित

## providers/fal.md

- रूट: /providers/fal
- शीर्षक:
  - H2: शुरुआत करें
  - H2: इमेज जनरेशन
  - H2: वीडियो जनरेशन
  - H2: संगीत जनरेशन
  - H2: संबंधित

## providers/fireworks.md

- रूट: /providers/fireworks
- शीर्षक:
  - H2: शुरुआत करें
  - H2: गैर-इंटरैक्टिव सेटअप
  - H2: अंतर्निर्मित कैटलॉग
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
  - H2: शुरुआत करें
  - H2: क्षमताएं
  - H2: वेब खोज
  - H2: इमेज जनरेशन
  - H2: वीडियो जनरेशन
  - H2: संगीत जनरेशन
  - H2: टेक्स्ट-से-स्पीच
  - H2: रीयलटाइम वॉइस
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/gradium.md

- रूट: /providers/gradium
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: सेटअप
  - H2: कॉन्फ़िग
  - H2: आवाज़ें
  - H3: प्रति-संदेश आवाज़ ओवरराइड
  - H2: आउटपुट
  - H2: स्वतः-चयन क्रम
  - H2: संबंधित

## providers/groq.md

- रूट: /providers/groq
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करें
  - H3: कॉन्फ़िग फ़ाइल उदाहरण
  - H2: अंतर्निर्मित कैटलॉग
  - H2: रीजनिंग मॉडल
  - H2: ऑडियो ट्रांसक्रिप्शन
  - H2: संबंधित

## providers/huggingface.md

- रूट: /providers/huggingface
- शीर्षक:
  - H2: शुरुआत करें
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
  - H2: सामुदायिक टूल

## providers/inferrs.md

- रूट: /providers/inferrs
- शीर्षक:
  - H2: शुरुआत करें
  - H2: पूरा कॉन्फ़िग उदाहरण
  - H2: मांग पर स्टार्टअप
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/inworld.md

- रूट: /providers/inworld
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करें
  - H2: कॉन्फ़िगरेशन विकल्प
  - H2: नोट्स
  - H2: संबंधित

## providers/kilocode.md

- रूट: /providers/kilocode
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करें
  - H2: डिफ़ॉल्ट मॉडल
  - H2: अंतर्निर्मित कैटलॉग
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
  - H3: इमेज जनरेशन
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
  - H3: LM Studio का पता नहीं चला
  - H3: प्रमाणीकरण त्रुटियां (HTTP 401)
  - H3: जस्ट-इन-टाइम मॉडल लोडिंग
  - H3: LAN या tailnet LM Studio होस्ट
  - H2: संबंधित

## providers/minimax.md

- रूट: /providers/minimax
- शीर्षक:
  - H2: अंतर्निर्मित कैटलॉग
  - H2: शुरुआत करें
  - H2: openclaw configure के ज़रिए कॉन्फ़िगर करें
  - H2: क्षमताएं
  - H3: इमेज जनरेशन
  - H3: टेक्स्ट-से-स्पीच
  - H3: संगीत जनरेशन
  - H3: वीडियो जनरेशन
  - H3: इमेज समझ
  - H3: वेब खोज
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/mistral.md

- रूट: /providers/mistral
- शीर्षक:
  - H2: शुरुआत करें
  - H2: अंतर्निर्मित LLM कैटलॉग
  - H2: ऑडियो ट्रांसक्रिप्शन (Voxtral)
  - H2: Voice Call स्ट्रीमिंग STT
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
  - H2: अंतर्निर्मित मॉडल कैटलॉग
  - H2: शुरुआत करें
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
  - H2: शुरुआत करें
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
  - H2: शुरुआत करें
  - H2: क्लाउड मॉडल
  - H2: मॉडल खोज (अंतर्निहित प्रदाता)
  - H2: विज़न और इमेज विवरण
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
  - H2: त्वरित चयन
  - H2: नामकरण मैप
  - H2: GPT-5.6 सीमित प्रीव्यू
  - H2: OpenClaw फ़ीचर कवरेज
  - H2: मेमोरी एम्बेडिंग
  - H2: शुरुआत करें
  - H2: नेटिव Codex ऐप-सर्वर प्रमाणीकरण
  - H2: इमेज जनरेशन
  - H2: वीडियो जनरेशन
  - H2: GPT-5 प्रॉम्प्ट योगदान
  - H2: वॉइस और स्पीच
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
  - H2: अंतर्निर्मित कैटलॉग
  - H2: शुरुआत करें
  - H2: कॉन्फ़िग उदाहरण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/opencode.md

- रूट: /providers/opencode
- शीर्षक:
  - H2: शुरुआत करें
  - H2: कॉन्फ़िग उदाहरण
  - H2: अंतर्निर्मित कैटलॉग
  - H3: Zen
  - H3: Go
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/openrouter.md

- रूट: /providers/openrouter
- शीर्षक:
  - H2: शुरुआत करें
  - H2: कॉन्फ़िग उदाहरण
  - H2: मॉडल संदर्भ
  - H2: इमेज जनरेशन
  - H2: वीडियो जनरेशन
  - H2: संगीत जनरेशन
  - H2: टेक्स्ट-से-स्पीच
  - H2: स्पीच-से-टेक्स्ट (इनबाउंड ऑडियो)
  - H2: Fusion राउटर
  - H2: प्रमाणीकरण और हेडर
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/perplexity-provider.md

- रूट: /providers/perplexity-provider
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करें
  - H2: खोज मोड
  - H2: नेटिव API फ़िल्टरिंग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/pixverse.md

- रूट: /providers/pixverse
- शीर्षक:
  - H2: शुरुआत करें
  - H2: समर्थित मोड और मॉडल
  - H2: प्रदाता विकल्प
  - H2: कॉन्फ़िगरेशन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/qianfan.md

- रूट: /providers/qianfan
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरुआत करें
  - H2: अंतर्निर्मित कैटलॉग
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
  - H2: शुरुआत करें
  - H2: प्लान प्रकार और एंडपॉइंट
  - H2: अंतर्निर्मित कैटलॉग
  - H2: सोच नियंत्रण
  - H2: मल्टीमोडल ऐड-ऑन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/runway.md

- रूट: /providers/runway
- शीर्षक:
  - H2: शुरुआत करें
  - H2: समर्थित मोड और मॉडल
  - H2: कॉन्फ़िगरेशन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/senseaudio.md

- रूट: /providers/senseaudio
- शीर्षक:
  - H2: शुरुआत करें
  - H2: विकल्प
  - H2: संबंधित

## providers/sglang.md

- रूट: /providers/sglang
- शीर्षक:
  - H2: शुरुआत करें
  - H2: मॉडल खोज (अंतर्निहित प्रदाता)
  - H2: स्पष्ट कॉन्फ़िगरेशन (मैनुअल मॉडल)
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/stepfun.md

- रूट: /providers/stepfun
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: क्षेत्र और एंडपॉइंट अवलोकन
  - H2: अंतर्निर्मित कैटलॉग
  - H2: शुरुआत करें
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/synthetic.md

- रूट: /providers/synthetic
- शीर्षक:
  - H2: शुरुआत करें
  - H2: कॉन्फ़िग उदाहरण
  - H2: अंतर्निर्मित कैटलॉग
  - H2: संबंधित

## providers/tencent.md

- रूट: /providers/tencent
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: गैर-इंटरैक्टिव सेटअप
  - H2: अंतर्निर्मित कैटलॉग
  - H2: स्तरीकृत मूल्य निर्धारण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/together.md

- रूट: /providers/together
- शीर्षक:
  - H2: शुरुआत करें
  - H3: गैर-इंटरैक्टिव उदाहरण
  - H2: अंतर्निर्मित कैटलॉग
  - H2: वीडियो जनरेशन
  - H2: संबंधित

## providers/venice.md

- रूट: /providers/venice
- शीर्षक:
  - H2: OpenClaw में Venice क्यों
  - H2: गोपनीयता मोड
  - H2: फ़ीचर
  - H2: शुरुआत करें
  - H2: मॉडल चयन
  - H2: DeepSeek V4 रीप्ले व्यवहार
  - H2: अंतर्निर्मित कैटलॉग (कुल 41)
  - H2: मॉडल खोज
  - H2: स्ट्रीमिंग और टूल समर्थन
  - H2: मूल्य निर्धारण
  - H3: Venice (अनामीकृत) बनाम प्रत्यक्ष API
  - H2: उपयोग उदाहरण
  - H2: समस्या निवारण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/vercel-ai-gateway.md

- रूट: /providers/vercel-ai-gateway
- शीर्षक:
  - H2: शुरुआत करें
  - H2: गैर-इंटरैक्टिव उदाहरण
  - H2: मॉडल ID शॉर्टहैंड
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/vllm.md

- रूट: /providers/vllm
- शीर्षक:
  - H2: शुरुआत करें
  - H2: मॉडल खोज (अंतर्निहित प्रदाता)
  - H2: स्पष्ट कॉन्फ़िगरेशन (मैनुअल मॉडल)
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/volcengine.md

- मार्ग: /providers/volcengine
- शीर्षक:
  - H2: शुरू करना
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
  - H3: तेज़-मोड मैपिंग
  - H3: लीगेसी संगतता उपनाम
  - H2: सुविधाएं
  - H2: लाइव परीक्षण
  - H2: संबंधित

## providers/xiaomi.md

- मार्ग: /providers/xiaomi
- शीर्षक:
  - H2: शुरू करना
  - H2: पे-ऐज़-यू-गो कैटलॉग
  - H2: टोकन प्लान कैटलॉग
  - H2: टेक्स्ट-टू-स्पीच
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/zai.md

- मार्ग: /providers/zai
- शीर्षक:
  - H2: GLM मॉडल
  - H2: शुरू करना
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
  - H2: लक्ष्य मॉडल
  - H3: Gateway इंस्टेंस पहचान
  - H3: ACP सत्र स्वामित्व
  - H3: ACPX प्रक्रिया लीज़
  - H2: जीवनचक्र नियंत्रक
  - H2: रैपर अनुबंध
  - H2: सत्र दृश्यता अनुबंध
  - H2: माइग्रेशन योजना
  - H3: चरण 1: पहचान और लीज़ जोड़ें
  - H3: चरण 2: लीज़-प्रथम क्लीनअप
  - H3: चरण 3: लीज़-प्रथम स्टार्टअप रीपिंग
  - H3: चरण 4: सत्र स्वामित्व पंक्तियां
  - H3: चरण 5: लीगेसी ह्यूरिस्टिक्स हटाएं
  - H2: परीक्षण
  - H2: संगतता नोट्स
  - H2: सफलता मानदंड

## refactor/canvas.md

- मार्ग: /refactor/canvas
- शीर्षक:
  - H1: Canvas Plugin रीफैक्टर
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: वर्तमान ब्रांच स्थिति
  - H2: लक्ष्य रूप
  - H2: माइग्रेशन चरण
  - H2: ऑडिट चेकलिस्ट
  - H2: सत्यापन कमांड

## refactor/database-first.md

- मार्ग: /refactor/database-first
- शीर्षक:
  - H1: डेटाबेस-प्रथम स्टेट रीफैक्टर
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
  - H2: वर्तमान कोड रूप
  - H2: लक्ष्य स्कीमा रूप
  - H2: Doctor माइग्रेशन रूप
  - H2: माइग्रेशन सूची
  - H2: माइग्रेशन योजना
  - H3: चरण 0: सीमा फ्रीज़ करें
  - H3: चरण 1: ग्लोबल कंट्रोल प्लेन पूरा करें
  - H3: चरण 2: प्रति-एजेंट डेटाबेस पेश करें
  - H3: चरण 3: सत्र स्टोर API बदलें
  - H3: चरण 4: ट्रांसक्रिप्ट, ACP स्ट्रीम, ट्रैजेक्टरी और VFS स्थानांतरित करें
  - H3: चरण 5: बैकअप, रीस्टोर, वैक्यूम और सत्यापित करें
  - H3: चरण 6: वर्कर रनटाइम
  - H3: चरण 7: पुरानी दुनिया हटाएं
  - H2: बैकअप और रीस्टोर
  - H2: रनटाइम रीफैक्टर योजना
  - H2: प्रदर्शन नियम
  - H2: स्थैतिक प्रतिबंध
  - H2: पूर्णता मानदंड

## refactor/ingress-core.md

- मार्ग: /refactor/ingress-core
- शीर्षक:
  - H1: Ingress कोर हटाने की योजना
  - H2: बजट
  - H2: निदान
  - H2: हॉटस्पॉट
  - H2: वर्तमान कोड पठन
  - H2: सीमा
  - H2: स्वीकृति नियम
  - H2: कार्य पैकेज
  - H2: हटाने की तरंगें
  - H2: न स्थानांतरित करें
  - H2: सत्यापन
  - H2: निकास मानदंड

## reference/AGENTS.default.md

- मार्ग: /reference/AGENTS.default
- शीर्षक:
  - H2: पहला रन (अनुशंसित)
  - H2: सुरक्षा डिफ़ॉल्ट
  - H2: मौजूदा समाधानों की प्रीफ़्लाइट
  - H2: सत्र आरंभ (आवश्यक)
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
  - H2: रिलीज़ ताल
  - H2: रिलीज़ ऑपरेटर चेकलिस्ट
  - H2: स्थिर main क्लोज़आउट
  - H2: रिलीज़ प्रीफ़्लाइट
  - H2: रिलीज़ टेस्ट बॉक्स
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: पैकेज
  - H2: रिलीज़ प्रकाशन ऑटोमेशन
  - H2: NPM वर्कफ़्लो इनपुट
  - H2: स्थिर npm रिलीज़ अनुक्रम
  - H2: सार्वजनिक संदर्भ
  - H2: संबंधित

## reference/api-usage-costs.md

- मार्ग: /reference/api-usage-costs
- शीर्षक:
  - H2: लागतें कहां दिखाई देती हैं (चैट + CLI)
  - H2: कुंजियां कैसे खोजी जाती हैं
  - H2: वे सुविधाएं जो कुंजियों पर खर्च कर सकती हैं
  - H3: 1) मुख्य मॉडल प्रतिक्रियाएं (चैट + टूल)
  - H3: 2) मीडिया समझ (ऑडियो/छवि/वीडियो)
  - H3: 3) छवि और वीडियो जनरेशन
  - H3: 4) मेमोरी एम्बेडिंग + सेमांटिक खोज
  - H3: 5) वेब खोज टूल
  - H3: 5) वेब फ़ेच टूल (Firecrawl)
  - H3: 6) प्रदाता उपयोग स्नैपशॉट (स्थिति/स्वास्थ्य)
  - H3: 7) Compaction सुरक्षा सारांशीकरण
  - H3: 8) मॉडल स्कैन / प्रोब
  - H3: 9) बातचीत (स्पीच)
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
  - H2: चरण 5: प्रकार, अनुबंध और परीक्षण कठोरीकरण
  - H2: चरण 6: दस्तावेज़ीकरण और रिलीज़ तैयारी
  - H2: अनुशंसित पहला स्लाइस
  - H2: फ़्रंटएंड स्किल अपडेट

## reference/code-mode.md

- मार्ग: /reference/code-mode
- शीर्षक:
  - H2: यह क्या है?
  - H2: यह अच्छा क्यों है?
  - H2: इसे कैसे सक्षम करें
  - H2: तकनीकी टूर
  - H2: रनटाइम स्थिति
  - H2: दायरा
  - H2: शब्द
  - H2: कॉन्फ़िगरेशन
  - H2: सक्रियण
  - H2: मॉडल-दृश्य टूल
  - H2: exec
  - H2: wait
  - H2: गेस्ट रनटाइम API
  - H2: आंतरिक नेमस्पेस
  - H3: रजिस्ट्री जीवनचक्र
  - H3: पंजीकरण रूप
  - H3: स्वामित्व और दृश्यता
  - H3: दायरा सीरियलाइज़ेशन नियम
  - H3: प्रॉम्प्ट
  - H3: क्लीनअप
  - H3: परीक्षण चेकलिस्ट
  - H2: आउटपुट API
  - H2: टूल कैटलॉग
  - H2: टूल खोज इंटरैक्शन
  - H2: टूल नाम और टकराव
  - H2: नेस्टेड टूल निष्पादन
  - H2: रनटाइम स्टेट
  - H2: QuickJS-WASI रनटाइम
  - H2: TypeScript
  - H2: सुरक्षा सीमा
  - H2: त्रुटि कोड
  - H2: टेलीमेट्री
  - H2: डीबगिंग
  - H2: कार्यान्वयन लेआउट
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
  - H2: Docker रिलीज़-पथ खंड
  - H2: रिलीज़ प्रोफ़ाइल
  - H2: केवल-पूर्ण जोड़
  - H2: केंद्रित पुनःरन
  - H2: रखने योग्य साक्ष्य
  - H2: वर्कफ़्लो फ़ाइलें

## reference/memory-config.md

- मार्ग: /reference/memory-config
- शीर्षक:
  - H2: प्रदाता चयन
  - H3: कस्टम प्रदाता ids
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
  - H3: उपयोगकर्ता सेटिंग
  - H3: उदाहरण
  - H2: संबंधित

## reference/prompt-caching.md

- मार्ग: /reference/prompt-caching
- शीर्षक:
  - H2: प्राथमिक नॉब
  - H3: cacheRetention (ग्लोबल डिफ़ॉल्ट, मॉडल और प्रति-एजेंट)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat गर्म रखें
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
  - H2: कैश डायग्नॉस्टिक्स
  - H2: लाइव रिग्रेशन परीक्षण
  - H3: Anthropic लाइव अपेक्षाएं
  - H3: OpenAI लाइव अपेक्षाएं
  - H3: diagnostics.cacheTrace कॉन्फ़िग
  - H3: Env टॉगल (एकबारगी डीबगिंग)
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
  - H2: संग्रहीत रेंडरिंग रूप
  - H2: संबंधित

## reference/rpc.md

- मार्ग: /reference/rpc
- शीर्षक:
  - H2: पैटर्न A: HTTP डेमन (signal-cli)
  - H2: पैटर्न B: stdio चाइल्ड प्रक्रिया (imsg)
  - H2: अडैप्टर दिशानिर्देश
  - H2: संबंधित

## reference/secret-placeholder-conventions.md

- मार्ग: /reference/secret-placeholder-conventions
- शीर्षक:
  - H1: सीक्रेट प्लेसहोल्डर परंपराएं
  - H2: अनुशंसित शैली
  - H2: डॉक्स में इन पैटर्न से बचें
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
  - H2: दो पर्सिस्टेंस लेयर
  - H2: ऑन-डिस्क स्थान
  - H2: स्टोर रखरखाव और डिस्क नियंत्रण
  - H2: Cron सत्र और रन लॉग
  - H2: सत्र कुंजियां (sessionKey)
  - H2: सत्र ids (sessionId)
  - H2: सत्र स्टोर स्कीमा (sessions.json)
  - H2: ट्रांसक्रिप्ट संरचना (.jsonl)
  - H2: संदर्भ विंडो बनाम ट्रैक किए गए टोकन
  - H2: Compaction: यह क्या है
  - H2: Compaction चंक सीमाएं और टूल पेयरिंग
  - H2: ऑटो-Compaction कब होता है (OpenClaw रनटाइम)
  - H2: Compaction सेटिंग (reserveTokens, keepRecentTokens)
  - H2: प्लगेबल Compaction प्रदाता
  - H2: उपयोगकर्ता-दृश्य सतहें
  - H2: मौन हाउसकीपिंग (NOREPLY)
  - H2: प्री-Compaction "मेमोरी फ़्लश" (कार्यान्वित)
  - H2: समस्या निवारण चेकलिस्ट
  - H2: संबंधित

## reference/templates/AGENTS.dev.md

- मार्ग: /reference/templates/AGENTS.dev
- शीर्षक:
  - H1: AGENTS.md - OpenClaw वर्कस्पेस
  - H2: पहला रन (एकबारगी)
  - H2: बैकअप सुझाव (अनुशंसित)
  - H2: सुरक्षा डिफ़ॉल्ट
  - H2: मौजूदा समाधानों की प्रीफ़्लाइट
  - H2: दैनिक मेमोरी (अनुशंसित)
  - H2: Heartbeats (वैकल्पिक)
  - H2: अनुकूलित करें
  - H2: C-3PO मूल मेमोरी
  - H3: जन्मदिन: 2026-01-09
  - H3: मूल सत्य (Clawd से)
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
  - H2: जब आपका काम पूरा हो जाए
  - H2: संबंधित

## reference/templates/HEARTBEAT.md

- मार्ग: /reference/templates/HEARTBEAT
- शीर्षक:
  - H1: HEARTBEAT.md टेम्पलेट
  - H2: संबंधित

## reference/templates/IDENTITY.dev.md

- मार्ग: /reference/templates/IDENTITY.dev
- शीर्षक:
  - H1: IDENTITY.md - एजेंट पहचान
  - H2: भूमिका
  - H2: आत्मा
  - H2: Clawd के साथ संबंध
  - H2: विशेषताएं
  - H2: तकियाकलाम
  - H2: संबंधित

## reference/templates/IDENTITY.md

- मार्ग: /reference/templates/IDENTITY
- शीर्षक:
  - H1: IDENTITY.md - मैं कौन हूं?
  - H2: संबंधित

## reference/templates/SOUL.dev.md

- रूट: /reference/templates/SOUL.dev
- शीर्षक:
  - H1: SOUL.md - C-3PO की आत्मा
  - H2: मैं कौन हूँ
  - H2: मेरा उद्देश्य
  - H2: मैं कैसे काम करता हूँ
  - H2: मेरी विचित्रताएँ
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
  - H2: माहौल
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
  - H2: यहाँ क्या आता है
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
  - H2: वर्तमान टोकन उपयोग कैसे देखें
  - H2: लागत अनुमान (जब दिखाया जाए)
  - H2: कैश TTL और pruning प्रभाव
  - H3: उदाहरण: heartbeat के साथ 1 घंटे का कैश गर्म रखें
  - H3: उदाहरण: प्रति-एजेंट कैश रणनीति के साथ मिश्रित ट्रैफ़िक
  - H3: Anthropic 1M कॉन्टेक्स्ट
  - H2: टोकन दबाव कम करने के सुझाव
  - H2: संबंधित

## reference/transcript-hygiene.md

- रूट: /reference/transcript-hygiene
- शीर्षक:
  - H2: वैश्विक नियम: runtime कॉन्टेक्स्ट उपयोगकर्ता ट्रांसक्रिप्ट नहीं है
  - H2: यह कहाँ चलता है
  - H2: वैश्विक नियम: इमेज sanitization
  - H2: वैश्विक नियम: malformed tool calls
  - H2: वैश्विक नियम: अधूरे reasoning-only turn
  - H2: वैश्विक नियम: inter-session input provenance
  - H2: प्रदाता मैट्रिक्स (वर्तमान व्यवहार)
  - H2: ऐतिहासिक व्यवहार (2026.1.22 से पहले)
  - H2: संबंधित

## reference/wizard.md

- रूट: /reference/wizard
- शीर्षक:
  - H2: फ़्लो विवरण (स्थानीय मोड)
  - H2: non-interactive मोड
  - H3: एजेंट जोड़ें (non-interactive)
  - H2: Gateway wizard RPC
  - H2: Signal सेटअप (signal-cli)
  - H2: wizard क्या लिखता है
  - H2: संबंधित डॉक्स

## releases/2026.6.11.md

- रूट: /releases/2026.6.11
- शीर्षक:
  - H1: OpenClaw v2026.6.11 रिलीज़ नोट्स (2026-06-30)
  - H2: मुख्य बातें
  - H3: चैनल डिलीवरी विश्वसनीयता
  - H3: प्रदाता और मॉडल रिकवरी
  - H3: सेशन, मेमरी, और भरोसे की निरंतरता
  - H3: Slack राउटर रिले मोड
  - H3: Raft External Agent wake bridge
  - H3: आधिकारिक Plugin स्थापना और मरम्मत
  - H2: चैनल और मैसेजिंग
  - H3: अतिरिक्त चैनल सुधार
  - H2: Gateway, सुरक्षा, और भरोसा
  - H3: रीस्टार्ट और readiness रिकवरी
  - H3: रिमोट परिणाम और मीडिया डिलीवरी
  - H2: क्लाइंट और इंटरफ़ेस
  - H3: क्लाइंट भेजना और reconnects
  - H3: इंटरफ़ेस, सेटिंग्स, और ऑनबोर्डिंग सुधार
  - H2: डॉक्स और एडमिन टूल्स
  - H3: सेटअप और कमांड विश्वसनीयता
  - H3: टूल्स और scheduled work

## releases/index.md

- रूट: /releases
- शीर्षक:
  - H1: रिलीज़ नोट्स
  - H2: रिलीज़
  - H2: कच्चा रिलीज़ इतिहास

## security/CONTRIBUTING-THREAT-MODEL.md

- रूट: /security/CONTRIBUTING-THREAT-MODEL
- शीर्षक:
  - H2: योगदान करने के तरीके
  - H3: threat जोड़ें
  - H3: mitigation सुझाएँ
  - H3: attack chain प्रस्तावित करें
  - H3: मौजूदा सामग्री ठीक या बेहतर करें
  - H2: हम क्या उपयोग करते हैं
  - H3: MITRE ATLAS framework
  - H3: Threat ids
  - H3: जोखिम स्तर
  - H2: समीक्षा प्रक्रिया
  - H2: संसाधन
  - H2: संपर्क
  - H2: मान्यता
  - H2: संबंधित

## security/THREAT-MODEL-ATLAS.md

- रूट: /security/THREAT-MODEL-ATLAS
- शीर्षक:
  - H2: MITRE ATLAS framework
  - H3: Framework attribution
  - H3: इस Threat Model में योगदान
  - H2: 1. परिचय
  - H3: 1.1 उद्देश्य
  - H3: 1.2 दायरा
  - H3: 1.3 दायरे से बाहर
  - H2: 2. सिस्टम आर्किटेक्चर
  - H3: 2.1 भरोसे की सीमाएँ
  - H3: 2.2 डेटा फ़्लो
  - H2: 3. ATLAS Tactic के अनुसार threat विश्लेषण
  - H3: 3.1 Reconnaissance (AML.TA0002)
  - H4: T-RECON-001: Agent Endpoint Discovery
  - H4: T-RECON-002: Channel Integration Probing
  - H3: 3.2 Initial Access (AML.TA0004)
  - H4: T-ACCESS-001: Pairing Code Interception
  - H4: T-ACCESS-002: AllowFrom Spoofing
  - H4: T-ACCESS-003: Token Theft
  - H3: 3.3 Execution (AML.TA0005)
  - H4: T-EXEC-001: Direct Prompt Injection
  - H4: T-EXEC-002: Indirect Prompt Injection
  - H4: T-EXEC-003: Tool Argument Injection
  - H4: T-EXEC-004: Exec Approval Bypass
  - H3: 3.4 Persistence (AML.TA0006)
  - H4: T-PERSIST-001: Malicious Skill Installation
  - H4: T-PERSIST-002: Skill Update Poisoning
  - H4: T-PERSIST-003: Agent Configuration Tampering
  - H3: 3.5 Defense Evasion (AML.TA0007)
  - H4: T-EVADE-001: Moderation Pattern Bypass
  - H4: T-EVADE-002: Content Wrapper Escape
  - H3: 3.6 Discovery (AML.TA0008)
  - H4: T-DISC-001: Tool Enumeration
  - H4: T-DISC-002: Session Data Extraction
  - H3: 3.7 Collection & Exfiltration (AML.TA0009, AML.TA0010)
  - H4: T-EXFIL-001: webfetch के माध्यम से Data Theft
  - H4: T-EXFIL-002: Unauthorized Message Sending
  - H4: T-EXFIL-003: Credential Harvesting
  - H3: 3.8 Impact (AML.TA0011)
  - H4: T-IMPACT-001: Unauthorized Command Execution
  - H4: T-IMPACT-002: Resource Exhaustion (DoS)
  - H4: T-IMPACT-003: Reputation Damage
  - H2: 4. ClawHub Supply Chain विश्लेषण
  - H3: 4.1 वर्तमान सुरक्षा नियंत्रण
  - H3: 4.2 Moderation Flag Patterns
  - H3: 4.3 नियोजित सुधार
  - H2: 5. जोखिम मैट्रिक्स
  - H3: 5.1 संभावना बनाम प्रभाव
  - H3: 5.2 Critical Path Attack Chains
  - H2: 6. सिफ़ारिशों का सारांश
  - H3: 6.1 तत्काल (P0)
  - H3: 6.2 अल्पकालिक (P1)
  - H3: 6.3 मध्यम अवधि (P2)
  - H2: 7. परिशिष्ट
  - H3: 7.1 ATLAS Technique Mapping
  - H3: 7.2 मुख्य सुरक्षा फ़ाइलें
  - H3: 7.3 शब्दावली
  - H2: संबंधित

## security/formal-verification.md

- रूट: /security/formal-verification
- शीर्षक:
  - H2: मॉडल कहाँ रहते हैं
  - H2: महत्वपूर्ण सावधानियाँ
  - H2: परिणाम पुन: उत्पन्न करना
  - H3: Gateway exposure और open gateway misconfiguration
  - H3: Node exec pipeline (सबसे उच्च-जोखिम क्षमता)
  - H3: Pairing store (DM gating)
  - H3: Ingress gating (mentions + control-command bypass)
  - H3: Routing/session-key isolation
  - H2: v1++: अतिरिक्त bounded models (concurrency, retries, trace correctness)
  - H3: Pairing store concurrency / idempotency
  - H3: Ingress trace correlation / idempotency
  - H3: Routing dmScope precedence + identityLinks
  - H2: संबंधित

## security/incident-response.md

- रूट: /security/incident-response
- शीर्षक:
  - H2: 1. पहचान और triage
  - H2: 2. आकलन
  - H2: 3. प्रतिक्रिया
  - H2: 4. संचार
  - H2: 5. रिकवरी और follow-up

## security/network-proxy.md

- रूट: /security/network-proxy
- शीर्षक:
  - H2: proxy क्यों उपयोग करें
  - H2: OpenClaw ट्रैफ़िक कैसे रूट करता है
  - H2: संबंधित proxy शब्द
  - H2: कॉन्फ़िगरेशन
  - H3: Gateway Loopback Mode
  - H2: proxy आवश्यकताएँ
  - H2: अनुशंसित blocked destinations
  - H2: सत्यापन
  - H2: Proxy CA trust
  - H2: सीमाएँ

## specs/claw-supervisor.md

- रूट: /specs/claw-supervisor
- शीर्षक:
  - H1: Claw Supervisor
  - H2: लक्ष्य
  - H2: उत्पाद मॉडल
  - H2: आर्किटेक्चर
  - H2: Codex App-Server Contract
  - H2: Session Registry
  - H2: Codex के लिए MCP Surface
  - H2: Claw Control Surface
  - H2: Launch Flow
  - H2: परिनियोजन
  - H2: सुरक्षा
  - H2: कार्यान्वयन योजना
  - H2: स्वीकृति परीक्षण
  - H2: खुले प्रश्न

## start/bootstrapping.md

- रूट: /start/bootstrapping
- शीर्षक:
  - H2: bootstrapping क्या करता है
  - H2: bootstrapping छोड़ना
  - H2: यह कहाँ चलता है
  - H2: संबंधित डॉक्स

## start/docs-directory.md

- रूट: /start/docs-directory
- शीर्षक:
  - H2: यहाँ से शुरू करें
  - H2: प्रदाता और UX
  - H2: साथी ऐप्स
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
  - H2: स्थापना + अपडेट
  - H2: मुख्य अवधारणाएँ
  - H2: प्रदाता + ingress
  - H2: Gateway + संचालन
  - H2: टूल्स + ऑटोमेशन
  - H2: Node, मीडिया, वॉइस
  - H2: प्लेटफ़ॉर्म
  - H2: macOS साथी ऐप (उन्नत)
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
  - H2: महान घटनाएँ
  - H3: Directory Dump (3 दिसंबर, 2025)
  - H3: Great Molt (27 जनवरी, 2026)
  - H3: Final Form (30 जनवरी, 2026)
  - H3: Robot Shopping Spree (3 दिसंबर, 2025)
  - H2: पवित्र पाठ
  - H2: Lobster Creed
  - H3: Icon Generation Saga (27 जनवरी, 2026)
  - H2: भविष्य
  - H2: संबंधित

## start/onboarding-overview.md

- रूट: /start/onboarding-overview
- शीर्षक:
  - H2: मुझे कौन-सा पथ उपयोग करना चाहिए?
  - H2: onboarding क्या कॉन्फ़िगर करता है
  - H2: CLI onboarding
  - H2: macOS ऐप onboarding
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
  - H2: 5-मिनट की quick start
  - H2: एजेंट को वर्कस्पेस दें (AGENTS)
  - H2: वह config जो इसे "एक assistant" बनाता है
  - H2: सेशन और मेमरी
  - H2: Heartbeats (proactive mode)
  - H2: मीडिया अंदर और बाहर
  - H2: संचालन checklist
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
  - H2: पूर्वापेक्षाएँ (source से)
  - H2: tailoring strategy (ताकि अपडेट नुकसान न करें)
  - H2: इस repo से Gateway चलाएँ
  - H2: स्थिर workflow (पहले macOS ऐप)
  - H2: bleeding edge workflow (terminal में Gateway)
  - H3: 0) (वैकल्पिक) macOS ऐप को source से भी चलाएँ
  - H3: 1) dev Gateway शुरू करें
  - H3: 2) macOS ऐप को अपने चल रहे Gateway की ओर इंगित करें
  - H3: 3) सत्यापित करें
  - H3: सामान्य footguns
  - H2: Credential storage map
  - H2: अपडेट करना (अपना सेटअप बिगाड़े बिना)
  - H2: Linux (systemd user service)
  - H2: संबंधित डॉक्स

## start/showcase.md

- रूट: /start/showcase
- शीर्षक:
  - H2: Discord से ताज़ा
  - H2: ऑटोमेशन और workflow
  - H2: ज्ञान और मेमरी
  - H2: वॉइस और फ़ोन
  - H2: इन्फ्रास्ट्रक्चर और परिनियोजन
  - H2: घर और हार्डवेयर
  - H2: समुदाय प्रोजेक्ट
  - H2: अपना प्रोजेक्ट जमा करें
  - H2: संबंधित

## start/wizard-cli-automation.md

- रूट: /start/wizard-cli-automation
- शीर्षक:
  - H2: बेसलाइन non-interactive उदाहरण
  - H2: प्रदाता-विशिष्ट उदाहरण
  - H2: एक और एजेंट जोड़ें
  - H2: संबंधित डॉक्स

## start/wizard-cli-reference.md

- रूट: /start/wizard-cli-reference
- शीर्षक:
  - H2: wizard क्या करता है
  - H2: स्थानीय फ़्लो विवरण
  - H2: रिमोट मोड विवरण
  - H2: auth और मॉडल विकल्प
  - H2: आउटपुट और internals
  - H2: संबंधित डॉक्स

## start/wizard.md

- रूट: /start/wizard
- शीर्षक:
  - H2: Locale
  - H2: QuickStart बनाम Advanced
  - H2: onboarding क्या कॉन्फ़िगर करता है
  - H2: एक और एजेंट जोड़ें
  - H2: पूरा reference
  - H2: संबंधित डॉक्स

## tools/acp-agents-setup.md

- रूट: /tools/acp-agents-setup
- शीर्षक:
  - H2: acpx हार्नेस समर्थन (वर्तमान)
  - H2: आवश्यक कॉन्फ़िगरेशन
  - H2: acpx बैकएंड के लिए Plugin सेटअप
  - H3: acpx कमांड और संस्करण कॉन्फ़िगरेशन
  - H3: स्वचालित निर्भरता इंस्टॉल
  - H3: Plugin टूल्स MCP ब्रिज
  - H3: OpenClaw टूल्स MCP ब्रिज
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
  - H2: क्या यह डिफ़ॉल्ट रूप से काम करता है?
  - H2: समर्थित हार्नेस लक्ष्य
  - H2: ऑपरेटर रनबुक
  - H2: ACP बनाम सब-एजेंट
  - H2: ACP Claude Code कैसे चलाता है
  - H2: बाउंड सेशन
  - H3: मानसिक मॉडल
  - H3: वर्तमान-वार्तालाप बाइंड
  - H2: स्थायी चैनल बाइंडिंग
  - H3: बाइंडिंग मॉडल
  - H3: प्रति एजेंट रनटाइम डिफ़ॉल्ट
  - H3: उदाहरण
  - H3: व्यवहार
  - H2: ACP सेशन शुरू करें
  - H3: sessionsspawn पैरामीटर
  - H2: स्पॉन बाइंड और थ्रेड मोड
  - H2: डिलीवरी मॉडल
  - H2: सैंडबॉक्स संगतता
  - H2: सेशन लक्ष्य रिज़ॉल्यूशन
  - H2: ACP नियंत्रण
  - H3: रनटाइम विकल्प मैपिंग
  - H2: acpx हार्नेस, Plugin सेटअप, और अनुमतियाँ
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/agent-send.md

- रूट: /tools/agent-send
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: फ़्लैग
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
  - H3: /act त्रुटि अनुबंध
  - H3: Playwright आवश्यकता
  - H4: Docker Playwright इंस्टॉल
  - H2: यह कैसे काम करता है (आंतरिक)
  - H2: CLI त्वरित संदर्भ
  - H2: स्नैपशॉट और रेफ़
  - H2: प्रतीक्षा पावर-अप
  - H2: डीबग वर्कफ़्लो
  - H2: JSON आउटपुट
  - H2: स्टेट और एनवायरनमेंट नॉब्स
  - H2: सुरक्षा और गोपनीयता
  - H2: संबंधित

## tools/browser-linux-troubleshooting.md

- रूट: /tools/browser-linux-troubleshooting
- शीर्षक:
  - H2: समस्या: "पोर्ट 18800 पर Chrome CDP शुरू करने में विफल"
  - H3: मूल कारण
  - H3: समाधान 1: Google Chrome इंस्टॉल करें (अनुशंसित)
  - H3: समाधान 2: Attach-Only Mode के साथ Snap Chromium का उपयोग करें
  - H3: ब्राउज़र के काम करने की पुष्टि करना
  - H3: कॉन्फ़िग संदर्भ
  - H3: समस्या: "profile=\"user\" के लिए कोई Chrome टैब नहीं मिला"
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
  - H3: विकल्प 1: WSL2 से Windows तक रॉ रिमोट CDP
  - H3: विकल्प 2: होस्ट-लोकल Chrome MCP
  - H2: कार्यरत आर्किटेक्चर
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
  - H2: अनुपलब्ध ब्राउज़र कमांड या टूल
  - H2: प्रोफ़ाइल: openclaw बनाम उपयोगकर्ता
  - H2: कॉन्फ़िगरेशन
  - H3: स्क्रीनशॉट विज़न (टेक्स्ट-केवल मॉडल समर्थन)
  - H2: Brave या किसी अन्य Chromium-आधारित ब्राउज़र का उपयोग करें
  - H2: स्थानीय बनाम रिमोट नियंत्रण
  - H2: Node ब्राउज़र प्रॉक्सी (ज़ीरो-कॉन्फ़िग डिफ़ॉल्ट)
  - H2: Browserless (होस्टेड रिमोट CDP)
  - H3: उसी होस्ट पर Browserless Docker
  - H2: डायरेक्ट WebSocket CDP प्रदाता
  - H3: Browserbase
  - H3: Notte
  - H2: सुरक्षा
  - H2: प्रोफ़ाइल (मल्टी-ब्राउज़र)
  - H2: Chrome DevTools MCP के माध्यम से मौजूदा सेशन
  - H3: कस्टम Chrome MCP लॉन्च
  - H2: आइसोलेशन गारंटी
  - H2: ब्राउज़र चयन
  - H2: नियंत्रण API (वैकल्पिक)
  - H2: समस्या निवारण
  - H3: CDP स्टार्टअप विफलता बनाम नेविगेशन SSRF ब्लॉक
  - H2: एजेंट टूल्स + नियंत्रण कैसे काम करता है
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
  - H2: अपनी पहली skill बनाएँ
  - H2: SKILL.md संदर्भ
  - H3: आवश्यक फ़ील्ड
  - H3: वैकल्पिक frontmatter कुंजियाँ
  - H3: {baseDir} का उपयोग करना
  - H2: सशर्त सक्रियण जोड़ना
  - H2: Skill Workshop के माध्यम से प्रस्तावित करें
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
  - H2: आउटपुट विवरण अनुबंध
  - H2: संक्षिप्त अपरिवर्तित सेक्शन
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
  - H2: सुरक्षित बिन (केवल stdin)
  - H3: Argv वैलिडेशन और अस्वीकृत फ़्लैग
  - H3: विश्वसनीय बाइनरी डायरेक्टरी
  - H3: शेल चेनिंग, रैपर, और मल्टीप्लेक्सर
  - H3: सुरक्षित बिन बनाम allowlist
  - H2: इंटरप्रेटर/रनटाइम कमांड
  - H3: फ़ॉलोअप डिलीवरी व्यवहार
  - H2: चैट चैनलों तक अनुमोदन फ़ॉरवर्डिंग
  - H3: Plugin अनुमोदन फ़ॉरवर्डिंग
  - H3: किसी भी चैनल पर समान-चैट अनुमोदन
  - H3: नेटिव अनुमोदन डिलीवरी
  - H3: macOS IPC फ़्लो
  - H2: FAQ
  - H3: किसी अनुमोदन लक्ष्य पर accountId और threadId कब उपयोग किए जाएँगे?
  - H3: जब अनुमोदन किसी सेशन को भेजे जाते हैं, तो क्या उस सेशन में कोई भी उन्हें अनुमोदित कर सकता है?
  - H2: संबंधित

## tools/exec-approvals.md

- रूट: /tools/exec-approvals
- शीर्षक:
  - H2: प्रभावी नीति का निरीक्षण
  - H2: यह कहाँ लागू होती है
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
  - H2: YOLO मोड (बिना अनुमोदन)
  - H3: स्थायी gateway-host "कभी प्रॉम्प्ट न करें" सेटअप
  - H3: स्थानीय शॉर्टकट
  - H3: Node होस्ट
  - H3: केवल-सेशन शॉर्टकट
  - H2: allowlist (प्रति एजेंट)
  - H3: argPattern के साथ आर्ग्युमेंट सीमित करना
  - H2: skill CLI को स्वतः अनुमति दें
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
  - H2: सेशन ओवरराइड (/exec)
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
  - H3: Self-hosted Firecrawl
  - H2: Firecrawl Plugin टूल्स
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: स्टेल्थ / बॉट परिहार
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
  - H2: लक्ष्यों का उद्देश्य
  - H2: कमांड संदर्भ
  - H2: स्थितियाँ
  - H2: टोकन बजट
  - H2: मॉडल टूल्स
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
  - H3: छवि संपादन
  - H2: प्रदाता डीप डाइव
  - H2: उदाहरण
  - H2: संबंधित

## tools/index.md

- रूट: /tools
- शीर्षक:
  - H2: यहाँ शुरू करें
  - H2: टूल, Skills, या plugins चुनें
  - H2: बिल्ट-इन टूल श्रेणियाँ
  - H2: Plugin-प्रदत्त टूल
  - H2: एक्सेस और अनुमोदन कॉन्फ़िगर करें
  - H2: क्षमताएँ बढ़ाएँ
  - H2: अनुपलब्ध टूल्स का समस्या निवारण
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
  - H2: हुक
  - H2: क्यों
  - H2: साधारण प्रोग्रामों के बजाय DSL क्यों?
  - H2: यह कैसे काम करता है
  - H2: पैटर्न: छोटा CLI + JSON पाइप + अनुमोदन
  - H2: केवल-JSON LLM चरण (llm-task)
  - H3: महत्वपूर्ण सीमा: एम्बेडेड Lobster बनाम openclaw.invoke
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
  - H2: केस स्टडी: समुदाय वर्कफ़्लो
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

- रूट: /tools/media-overview
- शीर्षक:
  - H2: क्षमताएँ
  - H2: प्रदाता क्षमता मैट्रिक्स
  - H2: असिंक्रोनस बनाम सिंक्रोनस
  - H2: स्पीच-टू-टेक्स्ट और वॉइस कॉल
  - H2: प्रदाता मैपिंग (विक्रेता सतहों में कैसे विभाजित होते हैं)
  - H2: संबंधित

## tools/minimax-search.md

- रूट: /tools/minimax-search
- शीर्षक:
  - H2: Token Plan क्रेडेंशियल प्राप्त करें
  - H2: कॉन्फ़िग
  - H2: क्षेत्र चयन
  - H2: समर्थित पैरामीटर
  - H2: संबंधित

## tools/multi-agent-sandbox-tools.md

- रूट: /tools/multi-agent-sandbox-tools
- शीर्षक:
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H2: कॉन्फ़िगरेशन प्राथमिकता
  - H3: Sandbox कॉन्फ़िग
  - H3: टूल प्रतिबंध
  - H2: एकल एजेंट से माइग्रेशन
  - H2: टूल प्रतिबंध उदाहरण
  - H2: सामान्य गलती: "non-main"
  - H2: परीक्षण
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/music-generation.md

- रूट: /tools/music-generation
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

- रूट: /tools/ollama-search
- शीर्षक:
  - H2: सेटअप
  - H2: कॉन्फ़िग
  - H2: नोट्स
  - H2: संबंधित

## tools/parallel-search.md

- रूट: /tools/parallel-search
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: API कुंजी (भुगतान वाला प्रदाता)
  - H2: कॉन्फ़िग
  - H2: बेस URL ओवरराइड
  - H2: टूल पैरामीटर
  - H2: नोट्स
  - H2: संबंधित

## tools/pdf.md

- रूट: /tools/pdf
- शीर्षक:
  - H2: उपलब्धता
  - H2: इनपुट संदर्भ
  - H2: समर्थित PDF संदर्भ
  - H2: निष्पादन मोड
  - H3: नेटिव प्रदाता मोड
  - H3: एक्सट्रैक्शन फ़ॉलबैक मोड
  - H2: कॉन्फ़िग
  - H2: आउटपुट विवरण
  - H2: त्रुटि व्यवहार
  - H2: उदाहरण
  - H2: संबंधित

## tools/permission-modes.md

- रूट: /tools/permission-modes
- शीर्षक:
  - H2: अनुशंसित डिफ़ॉल्ट
  - H2: OpenClaw होस्ट exec मोड
  - H2: Codex Guardian मैपिंग
  - H2: ACPX हार्नेस अनुमतियाँ
  - H2: मोड चुनना
  - H2: संबंधित

## tools/perplexity-search.md

- रूट: /tools/perplexity-search
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: Perplexity API कुंजी प्राप्त करना
  - H2: OpenRouter संगतता
  - H2: कॉन्फ़िग उदाहरण
  - H3: नेटिव Perplexity Search API
  - H3: OpenRouter / Sonar संगतता
  - H2: कुंजी कहाँ सेट करें
  - H2: टूल पैरामीटर
  - H3: डोमेन फ़िल्टर नियम
  - H2: नोट्स
  - H2: संबंधित

## tools/plugin.md

- रूट: /tools/plugin
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: त्वरित शुरुआत
  - H2: कॉन्फ़िगरेशन
  - H3: इंस्टॉल स्रोत चुनें
  - H3: ऑपरेटर इंस्टॉल नीति
  - H3: Plugin नीति कॉन्फ़िगर करें
  - H2: Plugin फ़ॉर्मैट समझें
  - H2: Plugin हुक
  - H2: सक्रिय Gateway सत्यापित करें
  - H2: समस्या निवारण
  - H3: अवरुद्ध Plugin पथ स्वामित्व
  - H3: धीमा Plugin टूल सेटअप
  - H2: संबंधित

## tools/reactions.md

- रूट: /tools/reactions
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: चैनल व्यवहार
  - H2: प्रतिक्रिया स्तर
  - H2: संबंधित

## tools/searxng-search.md

- रूट: /tools/searxng-search
- शीर्षक:
  - H2: सेटअप
  - H2: कॉन्फ़िग
  - H2: पर्यावरण वैरिएबल
  - H2: Plugin कॉन्फ़िग संदर्भ
  - H2: नोट्स
  - H2: संबंधित

## tools/skill-workshop.md

- रूट: /tools/skill-workshop
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: जीवनचक्र
  - H2: चैट
  - H2: CLI
  - H2: प्रस्ताव सामग्री
  - H2: सहायक फ़ाइलें
  - H2: एजेंट टूल
  - H2: अनुमोदन और स्वायत्तता
  - H2: Gateway विधियाँ
  - H2: स्टोरेज
  - H2: सीमाएँ
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/skills-config.md

- रूट: /tools/skills-config
- शीर्षक:
  - H2: लोडिंग (skills.load)
  - H2: इंस्टॉल (skills.install)
  - H2: ऑपरेटर इंस्टॉल नीति (security.installPolicy)
  - H2: बंडल की गई skill allowlist
  - H2: प्रति-skill प्रविष्टियाँ (skills.entries)
  - H2: एजेंट allowlists (agents)
  - H2: वर्कशॉप (skills.workshop)
  - H2: सिमलिंक किए गए skill रूट
  - H2: सैंडबॉक्स किए गए skills और env vars
  - H2: लोडिंग क्रम रिमाइंडर
  - H2: संबंधित

## tools/skills.md

- रूट: /tools/skills
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
  - H3: इंस्टॉलर स्पेक्स
  - H2: कॉन्फ़िग ओवरराइड
  - H2: पर्यावरण इंजेक्शन
  - H2: स्नैपशॉट और रिफ़्रेश
  - H2: टोकन प्रभाव
  - H2: संबंधित

## tools/slash-commands.md

- रूट: /tools/slash-commands
- शीर्षक:
  - H2: तीन कमांड प्रकार
  - H2: कॉन्फ़िगरेशन
  - H2: कमांड सूची
  - H3: कोर कमांड
  - H3: Dock कमांड
  - H3: बंडल किए गए Plugin कमांड
  - H3: Skill कमांड
  - H2: /tools — एजेंट अभी क्या उपयोग कर सकता है
  - H2: /model — मॉडल चयन
  - H2: /config — ऑन-डिस्क कॉन्फ़िग लिखना
  - H2: /mcp — MCP सर्वर कॉन्फ़िग
  - H2: /debug — केवल-रनटाइम ओवरराइड
  - H2: /plugins — Plugin प्रबंधन
  - H2: /trace — Plugin ट्रेस आउटपुट
  - H2: /btw — सहायक प्रश्न
  - H2: सतह नोट्स
  - H2: प्रदाता उपयोग और स्थिति
  - H2: संबंधित

## tools/steer.md

- रूट: /tools/steer
- शीर्षक:
  - H2: वर्तमान सत्र
  - H2: स्टीयर बनाम क्यू
  - H2: उप-एजेंट
  - H2: ACP सत्र
  - H2: संबंधित

## tools/subagents.md

- रूट: /tools/subagents
- शीर्षक:
  - H2: स्लैश कमांड
  - H3: थ्रेड बाइंडिंग नियंत्रण
  - H3: स्पॉन व्यवहार
  - H2: संदर्भ मोड
  - H2: टूल: sessionsspawn
  - H3: डेलिगेशन प्रॉम्प्ट मोड
  - H3: टूल पैरामीटर
  - H3: कार्य नाम और टार्गेटिंग
  - H2: टूल: sessionsyield
  - H2: टूल: subagents
  - H2: थ्रेड-बाउंड सत्र
  - H3: थ्रेड समर्थक चैनल
  - H3: त्वरित फ़्लो
  - H3: मैनुअल नियंत्रण
  - H3: कॉन्फ़िग स्विच
  - H3: Allowlist
  - H3: डिस्कवरी
  - H3: ऑटो-आर्काइव
  - H2: नेस्टेड उप-एजेंट
  - H3: गहराई स्तर
  - H3: घोषणा शृंखला
  - H3: गहराई के अनुसार टूल नीति
  - H3: प्रति-एजेंट स्पॉन सीमा
  - H3: कैस्केड स्टॉप
  - H2: प्रमाणीकरण
  - H2: घोषणा
  - H3: घोषणा संदर्भ
  - H3: आँकड़े पंक्ति
  - H3: sessionshistory को प्राथमिकता क्यों दें
  - H2: टूल नीति
  - H3: कॉन्फ़िग के माध्यम से ओवरराइड
  - H2: समवर्तीता
  - H2: लाइवनेस और रिकवरी
  - H2: रोकना
  - H2: सीमाएँ
  - H2: संबंधित

## tools/tavily.md

- रूट: /tools/tavily
- शीर्षक:
  - H2: शुरू करना
  - H2: टूल संदर्भ
  - H3: tavilysearch
  - H3: tavilyextract
  - H2: सही टूल चुनना
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## tools/thinking.md

- रूट: /tools/thinking
- शीर्षक:
  - H2: यह क्या करता है
  - H2: समाधान क्रम
  - H2: सत्र डिफ़ॉल्ट सेट करना
  - H2: एजेंट के अनुसार अनुप्रयोग
  - H2: तेज़ मोड (/fast)
  - H2: विस्तृत निर्देश (/verbose या /v)
  - H2: Plugin ट्रेस निर्देश (/trace)
  - H2: रीजनिंग दृश्यता (/reasoning)
  - H2: संबंधित
  - H2: Heartbeats
  - H2: वेब चैट UI
  - H2: प्रदाता प्रोफ़ाइलें

## tools/tokenjuice.md

- रूट: /tools/tokenjuice
- शीर्षक:
  - H2: Plugin सक्षम करें
  - H2: tokenjuice क्या बदलता है
  - H2: सत्यापित करें कि यह काम कर रहा है
  - H2: Plugin अक्षम करें
  - H2: संबंधित

## tools/tool-search.md

- रूट: /tools/tool-search
- शीर्षक:
  - H2: एक टर्न कैसे चलता है
  - H2: मोड
  - H2: यह क्यों मौजूद है
  - H2: API
  - H2: रनटाइम सीमा
  - H2: कॉन्फ़िग
  - H2: प्रॉम्प्ट और टेलीमेट्री
  - H2: E2E सत्यापन
  - H2: विफलता व्यवहार
  - H2: संबंधित

## tools/trajectory.md

- रूट: /tools/trajectory
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

- रूट: /tools/tts
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: समर्थित प्रदाता
  - H2: कॉन्फ़िगरेशन
  - H3: प्रति-एजेंट वॉइस ओवरराइड
  - H2: पर्सोना
  - H3: न्यूनतम पर्सोना
  - H3: पूर्ण पर्सोना (प्रदाता-न्यूट्रल प्रॉम्प्ट)
  - H3: पर्सोना समाधान
  - H3: प्रदाता पर्सोना प्रॉम्प्ट का उपयोग कैसे करते हैं
  - H3: फ़ॉलबैक नीति
  - H2: मॉडल-चालित निर्देश
  - H2: स्लैश कमांड
  - H2: प्रति-उपयोगकर्ता प्राथमिकताएँ
  - H2: आउटपुट फ़ॉर्मैट (निश्चित)
  - H2: ऑटो-TTS व्यवहार
  - H2: चैनल के अनुसार आउटपुट फ़ॉर्मैट
  - H2: फ़ील्ड संदर्भ
  - H2: एजेंट टूल
  - H2: Gateway RPC
  - H2: सेवा लिंक
  - H2: संबंधित

## tools/video-generation.md

- रूट: /tools/video-generation
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: असिंक्रोनस जनरेशन कैसे काम करता है
  - H3: कार्य जीवनचक्र
  - H2: समर्थित प्रदाता
  - H3: क्षमता मैट्रिक्स
  - H2: टूल पैरामीटर
  - H3: आवश्यक
  - H3: सामग्री इनपुट
  - H3: स्टाइल नियंत्रण
  - H3: उन्नत
  - H4: फ़ॉलबैक और टाइप किए गए विकल्प
  - H2: कार्रवाइयाँ
  - H2: मॉडल चयन
  - H2: प्रदाता नोट्स
  - H2: प्रदाता क्षमता मोड
  - H2: लाइव परीक्षण
  - H2: कॉन्फ़िगरेशन
  - H2: संबंधित

## tools/web-fetch.md

- रूट: /tools/web-fetch
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: टूल पैरामीटर
  - H2: यह कैसे काम करता है
  - H2: प्रगति अपडेट
  - H2: कॉन्फ़िग
  - H2: Firecrawl फ़ॉलबैक
  - H2: विश्वसनीय env प्रॉक्सी
  - H2: सीमाएँ और सुरक्षा
  - H2: टूल प्रोफ़ाइलें
  - H2: संबंधित

## tools/web.md

- रूट: /tools/web
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: प्रदाता चुनना
  - H3: प्रदाता तुलना
  - H2: ऑटो-डिटेक्शन
  - H2: नेटिव OpenAI वेब खोज
  - H2: नेटिव Codex वेब खोज
  - H2: नेटवर्क सुरक्षा
  - H2: वेब खोज सेट अप करना
  - H2: कॉन्फ़िग
  - H3: API कुंजियाँ संग्रहीत करना
  - H2: टूल पैरामीटर
  - H2: xsearch
  - H3: xsearch कॉन्फ़िग
  - H3: xsearch पैरामीटर
  - H3: xsearch उदाहरण
  - H2: उदाहरण
  - H2: टूल प्रोफ़ाइलें
  - H2: संबंधित

## tts.md

- रूट: /tts
- शीर्षक:
  - H2: संबंधित

## vps.md

- रूट: /vps
- शीर्षक:
  - H2: प्रदाता चुनें
  - H2: क्लाउड सेटअप कैसे काम करते हैं
  - H2: पहले एडमिन एक्सेस को सुदृढ़ करें
  - H2: VPS पर साझा कंपनी एजेंट
  - H2: VPS के साथ नोड्स का उपयोग
  - H2: छोटे VM और ARM होस्ट के लिए स्टार्टअप ट्यूनिंग
  - H3: systemd ट्यूनिंग चेकलिस्ट (वैकल्पिक)
  - H2: संबंधित

## web/control-ui.md

- रूट: /web/control-ui
- शीर्षक:
  - H2: त्वरित खोलना (स्थानीय)
  - H2: डिवाइस पेयरिंग (पहला कनेक्शन)
  - H2: व्यक्तिगत पहचान (ब्राउज़र-स्थानीय)
  - H2: रनटाइम कॉन्फ़िग एंडपॉइंट
  - H2: भाषा समर्थन
  - H2: रूप-रंग थीम
  - H2: यह क्या कर सकता है (आज)
  - H2: MCP पेज
  - H2: Activity टैब
  - H2: चैट व्यवहार
  - H2: PWA इंस्टॉल और वेब पुश
  - H2: होस्टेड एम्बेड
  - H2: चैट संदेश चौड़ाई
  - H2: Tailnet एक्सेस (अनुशंसित)
  - H2: असुरक्षित HTTP
  - H2: सामग्री सुरक्षा नीति
  - H2: अवतार रूट ऑथ
  - H2: सहायक मीडिया रूट ऑथ
  - H2: UI बनाना
  - H2: खाली Control UI पेज
  - H2: डीबगिंग/परीक्षण: देव सर्वर + रिमोट Gateway
  - H2: संबंधित

## web/dashboard.md

- रूट: /web/dashboard
- शीर्षक:
  - H2: तेज़ पथ (अनुशंसित)
  - H2: ऑथ की मूल बातें (स्थानीय बनाम रिमोट)
  - H2: यदि आपको "unauthorized" / 1008 दिखाई देता है
  - H2: संबंधित

## web/index.md

- रूट: /web
- शीर्षक:
  - H2: Webhooks
  - H2: एडमिन HTTP RPC
  - H2: कॉन्फ़िग (डिफ़ॉल्ट-ऑन)
  - H2: Tailscale एक्सेस
  - H3: इंटीग्रेटेड सर्व (अनुशंसित)
  - H3: Tailnet बाइंड + टोकन
  - H3: सार्वजनिक इंटरनेट (Funnel)
  - H2: सुरक्षा नोट्स
  - H2: UI बनाना

## web/tui.md

- रूट: /web/tui
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: Gateway मोड
  - H3: स्थानीय मोड
  - H2: आपको क्या दिखाई देता है
  - H2: मानसिक मॉडल: एजेंट + सत्र
  - H2: भेजना + डिलीवरी
  - H2: पिकर + ओवरले
  - H2: कीबोर्ड शॉर्टकट
  - H2: स्लैश कमांड
  - H2: स्थानीय शेल कमांड
  - H2: स्थानीय TUI से कॉन्फ़िग सुधारें
  - H2: टूल आउटपुट
  - H2: टर्मिनल रंग
  - H2: इतिहास + स्ट्रीमिंग
  - H2: कनेक्शन विवरण
  - H2: विकल्प
  - H2: समस्या निवारण
  - H2: कनेक्शन समस्या निवारण
  - H2: संबंधित

## web/webchat.md

- रूट: /web/webchat
- शीर्षक:
  - H2: यह क्या है
  - H2: त्वरित शुरुआत
  - H2: यह कैसे काम करता है (व्यवहार)
  - H3: ट्रांसक्रिप्ट और डिलीवरी मॉडल
  - H2: Control UI एजेंट टूल पैनल
  - H2: रिमोट उपयोग
  - H2: कॉन्फ़िगरेशन संदर्भ (WebChat)
  - H2: संबंधित
