---
read_when: Finding which docs page covers a topic before reading the page
summary: OpenClaw दस्तावेज़ पृष्ठों के लिए जनरेट किया गया शीर्षक मानचित्र
title: दस्तावेज़ मानचित्र
x-i18n:
    generated_at: "2026-07-01T12:59:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9942f57ca1e0a9ae1a0fc8a766c0a0d1429856dc906bb5acb60eda38f927b607
    source_path: docs_map.md
    workflow: 16
---

# OpenClaw दस्तावेज़ मैप

यह फ़ाइल एजेंटों को दस्तावेज़ीकरण ट्री में नेविगेट करने में मदद करने के लिए `docs/**/*.md` और `docs/**/*.mdx` शीर्षकों से जनरेट की गई है।
इसे हाथ से संपादित न करें; `pnpm docs:map:gen` चलाएँ।

## agent-runtime-architecture.md

- Route: /agent-runtime-architecture
- Headings:
  - H2: Runtime लेआउट
  - H2: सीमाएँ
  - H2: Manifests
  - H2: Runtime चयन
  - H2: संबंधित

## announcements/bluebubbles-imessage.md

- Route: /announcements/bluebubbles-imessage
- Headings:
  - H1: BlueBubbles हटाना और imsg iMessage पथ
  - H2: क्या बदला
  - H2: क्या करें
  - H2: माइग्रेशन नोट्स
  - H2: यह भी देखें

## auth-credential-semantics.md

- Route: /auth-credential-semantics
- Headings:
  - H2: स्थिर probe कारण कोड
  - H2: Token credentials
  - H3: पात्रता नियम
  - H3: Resolution नियम
  - H2: Agent copy portability
  - H2: केवल-config auth routes
  - H2: Explicit auth order filtering
  - H2: Probe target resolution
  - H2: External CLI credential discovery
  - H2: OAuth SecretRef Policy Guard
  - H2: Legacy-Compatible Messaging
  - H2: संबंधित

## automation/auth-monitoring.md

- Route: /automation/auth-monitoring
- Headings:
  - H2: संबंधित

## automation/clawflow.md

- Route: /automation/clawflow
- Headings:
  - H2: संबंधित

## automation/cron-jobs.md

- Route: /automation/cron-jobs
- Headings:
  - H2: त्वरित शुरुआत
  - H2: cron कैसे काम करता है
  - H2: Schedule प्रकार
  - H3: महीने के दिन और सप्ताह के दिन OR logic का उपयोग करते हैं
  - H2: Execution styles
  - H3: Command payloads
  - H3: अलग-थलग jobs के लिए payload विकल्प
  - H2: Delivery और output
  - H2: Output भाषा
  - H2: CLI उदाहरण
  - H2: Webhooks
  - H3: Authentication
  - H2: Gmail PubSub integration
  - H3: Wizard setup (अनुशंसित)
  - H3: Gateway auto-start
  - H3: Manual one-time setup
  - H3: Gmail model override
  - H2: Jobs प्रबंधित करना
  - H2: Configuration
  - H2: Troubleshooting
  - H3: Command ladder
  - H2: संबंधित

## automation/cron-vs-heartbeat.md

- Route: /automation/cron-vs-heartbeat
- Headings:
  - H2: संबंधित

## automation/gmail-pubsub.md

- Route: /automation/gmail-pubsub
- Headings:
  - H2: संबंधित

## automation/hooks.md

- Route: /automation/hooks
- Headings:
  - H2: सही surface चुनें
  - H2: त्वरित शुरुआत
  - H2: Event प्रकार
  - H2: Hooks लिखना
  - H3: Hook संरचना
  - H3: HOOK.md format
  - H3: Handler implementation
  - H3: Event context highlights
  - H2: Hook discovery
  - H3: Hook packs
  - H2: Bundled hooks
  - H3: session-memory विवरण
  - H3: bootstrap-extra-files config
  - H3: command-logger विवरण
  - H3: compaction-notifier विवरण
  - H3: boot-md विवरण
  - H2: Plugin hooks
  - H2: Configuration
  - H2: CLI reference
  - H2: Best practices
  - H2: Troubleshooting
  - H3: Hook नहीं मिला
  - H3: Hook eligible नहीं है
  - H3: Hook execute नहीं हो रहा है
  - H2: संबंधित

## automation/index.md

- Route: /automation
- Headings:
  - H2: त्वरित निर्णय मार्गदर्शिका
  - H3: Scheduled Tasks (Cron) बनाम Heartbeat
  - H2: मुख्य concepts
  - H3: Scheduled tasks (cron)
  - H3: Tasks
  - H3: अनुमानित commitments
  - H3: Task Flow
  - H3: Standing orders
  - H3: Hooks
  - H3: Heartbeat
  - H2: वे साथ में कैसे काम करते हैं
  - H2: संबंधित

## automation/poll.md

- Route: /automation/poll
- Headings:
  - H2: संबंधित

## automation/standing-orders.md

- Route: /automation/standing-orders
- Headings:
  - H2: Standing orders क्यों
  - H2: वे कैसे काम करते हैं
  - H2: Standing order की anatomy
  - H2: Standing orders और cron jobs
  - H2: उदाहरण
  - H3: उदाहरण 1: content और social media (साप्ताहिक चक्र)
  - H3: उदाहरण 2: finance operations (event-triggered)
  - H3: उदाहरण 3: monitoring और alerts (continuous)
  - H2: Execute-verify-report pattern
  - H2: Multi-program architecture
  - H2: Best practices
  - H3: करें
  - H3: बचें
  - H2: संबंधित

## automation/taskflow.md

- Route: /automation/taskflow
- Headings:
  - H2: Task Flow कब उपयोग करें
  - H2: Reliable scheduled workflow pattern
  - H2: Sync modes
  - H3: Managed mode
  - H3: Mirrored mode
  - H2: Durable state और revision tracking
  - H2: Cancel behavior
  - H2: CLI commands
  - H2: Flows tasks से कैसे संबंधित हैं
  - H2: संबंधित

## automation/tasks.md

- Route: /automation/tasks
- Headings:
  - H2: संक्षेप में
  - H2: त्वरित शुरुआत
  - H2: Task क्या बनाता है
  - H2: Task lifecycle
  - H2: Delivery और notifications
  - H3: Notification policies
  - H2: CLI reference
  - H2: Chat task board (/tasks)
  - H2: Status integration (task pressure)
  - H2: Storage और maintenance
  - H3: Tasks कहाँ रहते हैं
  - H3: Automatic maintenance
  - H2: Tasks अन्य systems से कैसे संबंधित हैं
  - H2: संबंधित

## automation/troubleshooting.md

- Route: /automation/troubleshooting
- Headings:
  - H2: संबंधित

## automation/webhook.md

- Route: /automation/webhook
- Headings:
  - H2: संबंधित

## brave-search.md

- Route: /brave-search
- Headings:
  - H2: संबंधित

## channels/access-groups.md

- Route: /channels/access-groups
- Headings:
  - H2: Static message sender groups
  - H2: Allowlists से reference groups
  - H2: Supported message-channel paths
  - H2: Plugin diagnostics
  - H2: Discord channel audiences
  - H2: Security notes
  - H2: Troubleshooting

## channels/ambient-room-events.md

- Route: /channels/ambient-room-events
- Headings:
  - H2: अनुशंसित setup
  - H2: क्या बदलता है
  - H2: Discord उदाहरण
  - H2: Slack उदाहरण
  - H2: Telegram उदाहरण
  - H2: Agent specific policy
  - H2: Visible reply modes
  - H2: History
  - H2: Troubleshooting
  - H2: संबंधित

## channels/bot-loop-protection.md

- Route: /channels/bot-loop-protection
- Headings:
  - H1: Bot loop protection
  - H2: Defaults
  - H2: Shared defaults configure करें
  - H2: हर channel या account के लिए override करें
  - H2: Channel support

## channels/broadcast-groups.md

- Route: /channels/broadcast-groups
- Headings:
  - H2: अवलोकन
  - H2: Use cases
  - H2: Configuration
  - H3: Basic setup
  - H3: Processing strategy
  - H3: Complete example
  - H2: यह कैसे काम करता है
  - H3: Message flow
  - H3: Session isolation
  - H3: उदाहरण: isolated sessions
  - H2: Best practices
  - H2: Compatibility
  - H3: Providers
  - H3: Routing
  - H2: Troubleshooting
  - H2: उदाहरण
  - H2: API reference
  - H3: Config schema
  - H3: Fields
  - H2: Limitations
  - H2: Future enhancements
  - H2: संबंधित

## channels/channel-routing.md

- Route: /channels/channel-routing
- Headings:
  - H1: Channels और routing
  - H2: Key terms
  - H2: Outbound target prefixes
  - H2: Session key shapes (उदाहरण)
  - H2: Main DM route pinning
  - H2: Guarded inbound recording
  - H2: Routing rules (agent कैसे चुना जाता है)
  - H2: Broadcast groups (कई agents चलाएँ)
  - H2: Config overview
  - H2: Session storage
  - H2: WebChat behavior
  - H2: Reply context
  - H2: संबंधित

## channels/clickclack.md

- Route: /channels/clickclack
- Headings:
  - H2: त्वरित setup
  - H2: Multiple bots
  - H2: Targets
  - H2: Permissions
  - H2: Troubleshooting

## channels/discord.md

- Route: /channels/discord
- Headings:
  - H2: त्वरित setup
  - H2: अनुशंसित: guild workspace setup करें
  - H2: Runtime model
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
  - H3: Voice में users का अनुसरण करें
  - H3: Voice messages
  - H2: Troubleshooting
  - H2: Configuration reference
  - H2: Safety और operations
  - H2: संबंधित

## channels/feishu.md

- Route: /channels/feishu
- Headings:
  - H2: त्वरित शुरुआत
  - H2: Access control
  - H3: Direct messages
  - H3: Group chats
  - H2: Group configuration examples
  - H3: सभी groups allow करें, @mention आवश्यक नहीं
  - H3: सभी groups allow करें, फिर भी @mention आवश्यक रखें
  - H3: केवल specific groups allow करें
  - H3: Group के भीतर senders restrict करें
  - H2: Group/user IDs प्राप्त करें
  - H3: Group IDs (chatid, format: ocxxx)
  - H3: User IDs (openid, format: ouxxx)
  - H2: Common commands
  - H2: Troubleshooting
  - H3: Bot group chats में respond नहीं करता
  - H3: Bot messages receive नहीं करता
  - H3: QR setup Feishu mobile app में react नहीं करता
  - H3: App Secret leak हो गया
  - H2: Advanced configuration
  - H3: Multiple accounts
  - H3: Message limits
  - H3: Streaming
  - H3: Quota optimization
  - H3: ACP sessions
  - H4: Persistent ACP binding
  - H4: Chat से ACP spawn करें
  - H3: Multi-agent routing
  - H2: Per-user agent isolation (Dynamic Agent Creation)
  - H3: त्वरित setup
  - H3: यह कैसे काम करता है
  - H3: Configuration options
  - H3: Session scope
  - H3: Typical multi-user deployment
  - H3: Verification
  - H3: Notes
  - H2: Configuration reference
  - H2: Supported message types
  - H3: Receive
  - H3: Send
  - H3: Threads और replies
  - H2: संबंधित

## channels/googlechat.md

- Route: /channels/googlechat
- Headings:
  - H2: Install
  - H2: त्वरित setup (beginner)
  - H2: Google Chat में जोड़ें
  - H2: Public URL (केवल-Webhook)
  - H3: विकल्प A: Tailscale Funnel (अनुशंसित)
  - H3: विकल्प B: Reverse Proxy (Caddy)
  - H3: विकल्प C: Cloudflare Tunnel
  - H2: यह कैसे काम करता है
  - H2: Targets
  - H2: Config highlights
  - H2: Troubleshooting
  - H3: 405 Method Not Allowed
  - H3: Other issues
  - H2: संबंधित

## channels/group-messages.md

- Route: /channels/group-messages
- Headings:
  - H2: Behavior
  - H2: Config example (WhatsApp)
  - H3: Activation command (केवल-owner)
  - H2: कैसे उपयोग करें
  - H2: Testing / verification
  - H2: Known considerations
  - H2: संबंधित

## channels/groups.md

- Route: /channels/groups
- Headings:
  - H2: Beginner intro (2 मिनट)
  - H2: Visible replies
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

- Route: /channels/imessage-from-bluebubbles
- Headings:
  - H2: Migration checklist
  - H2: यह migration कब उचित है
  - H2: imsg क्या करता है
  - H2: शुरू करने से पहले
  - H2: Config translation
  - H2: Group registry footgun
  - H2: Step-by-step
  - H2: Action parity at a glance
  - H2: Pairing, sessions, और ACP bindings
  - H2: कोई rollback channel नहीं
  - H2: संबंधित

## channels/imessage.md

- Route: /channels/imessage
- Headings:
  - H2: त्वरित setup
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
  - H3: Scenarios और agent क्या देखता है
  - H2: Bridge या gateway restart के बाद inbound recovery
  - H3: Operator-visible signal
  - H3: Migration
  - H2: Troubleshooting
  - H2: Configuration reference pointers
  - H2: संबंधित

## channels/index.md

- Route: /channels
- Headings:
  - H2: Delivery notes
  - H2: Supported channels
  - H2: Notes

## channels/irc.md

- Route: /channels/irc
- Headings:
  - H2: त्वरित शुरुआत
  - H2: Security defaults
  - H2: Access control
  - H3: Common gotcha: allowFrom DMs के लिए है, channels के लिए नहीं
  - H2: Reply triggering (mentions)
  - H2: Security note (public channels के लिए अनुशंसित)
  - H3: Channel में सभी के लिए same tools
  - H3: Sender के अनुसार अलग tools (owner को अधिक power मिलती है)
  - H2: NickServ
  - H2: Environment variables
  - H2: Troubleshooting
  - H2: संबंधित

## channels/line.md

- मार्ग: /channels/line
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: सेटअप
  - H2: कॉन्फ़िगर करें
  - H2: एक्सेस नियंत्रण
  - H2: संदेश व्यवहार
  - H2: चैनल डेटा (समृद्ध संदेश)
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
  - H2: अनुशंसित अपग्रेड फ़्लो
  - H2: एन्क्रिप्टेड माइग्रेशन कैसे काम करता है
  - H2: सामान्य संदेश और उनका अर्थ
  - H3: अपग्रेड और डिटेक्शन संदेश
  - H3: एन्क्रिप्टेड-स्टेट रिकवरी संदेश
  - H3: मैन्युअल रिकवरी संदेश
  - H3: कस्टम Plugin इंस्टॉल संदेश
  - H2: यदि एन्क्रिप्टेड इतिहास फिर भी वापस नहीं आता
  - H2: यदि आप भविष्य के संदेशों के लिए नए सिरे से शुरू करना चाहते हैं
  - H2: संबंधित

## channels/matrix-presentation.md

- मार्ग: /channels/matrix-presentation
- शीर्षक:
  - H2: इवेंट सामग्री
  - H2: फ़ॉलबैक व्यवहार
  - H2: समर्थित ब्लॉक
  - H2: इंटरैक्शन
  - H2: अनुमोदन मेटाडेटा से संबंध
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
  - H3: न्यूनतम कॉन्फ़िग
  - H3: ऑटो-जॉइन
  - H3: Allowlist लक्ष्य फ़ॉर्मैट
  - H3: खाता ID सामान्यीकरण
  - H3: कैश किए गए क्रेडेंशियल
  - H3: पर्यावरण चर
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H2: स्ट्रीमिंग पूर्वावलोकन
  - H2: वॉइस संदेश
  - H2: अनुमोदन मेटाडेटा
  - H3: शांत फ़ाइनलाइज़्ड पूर्वावलोकनों के लिए सेल्फ़-होस्टेड पुश नियम
  - H2: बॉट-से-बॉट रूम
  - H2: एन्क्रिप्शन और सत्यापन
  - H3: एन्क्रिप्शन सक्षम करें
  - H3: स्थिति और ट्रस्ट संकेत
  - H3: इस डिवाइस को रिकवरी कुंजी से सत्यापित करें
  - H3: क्रॉस-साइनिंग बूटस्ट्रैप या रिपेयर करें
  - H3: रूम-की बैकअप
  - H3: सत्यापनों को सूचीबद्ध करना, अनुरोध करना और उनका जवाब देना
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
  - H2: Matrix ट्रैफ़िक को प्रॉक्सी करना
  - H2: लक्ष्य रिज़ॉल्यूशन
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H3: खाता और कनेक्शन
  - H3: एन्क्रिप्शन
  - H3: एक्सेस और नीति
  - H3: रिप्लाई व्यवहार
  - H3: प्रतिक्रिया सेटिंग्स
  - H3: टूलिंग और प्रति-रूम ओवरराइड
  - H3: Exec अनुमोदन सेटिंग्स
  - H2: संबंधित

## channels/mattermost.md

- मार्ग: /channels/mattermost
- शीर्षक:
  - H2: इंस्टॉल करें
  - H2: त्वरित सेटअप
  - H2: नेटिव स्लैश कमांड
  - H2: पर्यावरण चर (डिफ़ॉल्ट खाता)
  - H2: चैट मोड
  - H2: थ्रेडिंग और सेशन
  - H2: एक्सेस नियंत्रण (DM)
  - H2: चैनल (समूह)
  - H2: आउटबाउंड डिलीवरी के लक्ष्य
  - H2: DM चैनल रीट्राई
  - H2: पूर्वावलोकन स्ट्रीमिंग
  - H2: प्रतिक्रियाएँ (संदेश टूल)
  - H2: इंटरैक्टिव बटन (संदेश टूल)
  - H3: डायरेक्ट API इंटीग्रेशन (बाहरी स्क्रिप्ट)
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
  - H2: कॉन्फ़िग राइट्स
  - H2: एक्सेस नियंत्रण (DM + समूह)
  - H3: यह कैसे काम करता है
  - H3: चरण 1: Azure Bot बनाएँ
  - H3: चरण 2: क्रेडेंशियल प्राप्त करें
  - H3: चरण 3: Messaging Endpoint कॉन्फ़िगर करें
  - H3: चरण 4: Teams Channel सक्षम करें
  - H3: चरण 5: Teams App Manifest बनाएँ
  - H3: चरण 6: OpenClaw कॉन्फ़िगर करें
  - H3: चरण 7: Gateway चलाएँ
  - H2: फ़ेडरेटेड प्रमाणीकरण (सर्टिफ़िकेट और मैनेज्ड आइडेंटिटी)
  - H3: विकल्प A: सर्टिफ़िकेट-आधारित प्रमाणीकरण
  - H3: विकल्प B: Azure Managed Identity
  - H3: AKS Workload Identity सेटअप
  - H3: Auth प्रकार तुलना
  - H2: स्थानीय डेवलपमेंट (टनलिंग)
  - H2: Bot का परीक्षण
  - H2: पर्यावरण चर
  - H2: सदस्य जानकारी एक्शन
  - H2: इतिहास संदर्भ
  - H2: वर्तमान Teams RSC अनुमतियाँ (मैनिफ़ेस्ट)
  - H2: उदाहरण Teams मैनिफ़ेस्ट (रेडैक्टेड)
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
  - H3: रिज़ॉल्यूशन प्राथमिकता
  - H3: थ्रेड संदर्भ संरक्षण
  - H2: अटैचमेंट और चित्र
  - H2: समूह चैट में फ़ाइलें भेजना
  - H3: समूह चैट के लिए SharePoint क्यों चाहिए
  - H3: सेटअप
  - H3: शेयरिंग व्यवहार
  - H3: फ़ॉलबैक व्यवहार
  - H3: फ़ाइलें संग्रहित स्थान
  - H2: पोल (Adaptive Cards)
  - H2: प्रेज़ेंटेशन कार्ड
  - H2: लक्ष्य फ़ॉर्मैट
  - H2: प्रोएक्टिव मैसेजिंग
  - H2: टीम और चैनल ID (सामान्य चूक)
  - H2: निजी चैनल
  - H2: समस्या निवारण
  - H3: सामान्य समस्याएँ
  - H3: मैनिफ़ेस्ट अपलोड त्रुटियाँ
  - H3: RSC अनुमतियाँ काम नहीं कर रहीं
  - H2: संदर्भ
  - H2: संबंधित

## channels/nextcloud-talk.md

- मार्ग: /channels/nextcloud-talk
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: नोट्स
  - H2: एक्सेस नियंत्रण (DM)
  - H2: रूम (समूह)
  - H2: क्षमताएँ
  - H2: कॉन्फ़िगरेशन संदर्भ (Nextcloud Talk)
  - H2: संबंधित

## channels/nostr.md

- मार्ग: /channels/nostr
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
  - H2: परीक्षण
  - H3: स्थानीय रिले
  - H3: मैन्युअल परीक्षण
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
  - H2: 1) DM पेयरिंग (इनबाउंड चैट एक्सेस)
  - H3: भेजने वाले को अनुमोदित करें
  - H3: पुन: उपयोग योग्य भेजने वाले समूह
  - H3: स्टेट कहाँ रहता है
  - H2: 2) Node डिवाइस पेयरिंग (iOS/Android/macOS/headless नोड)
  - H3: Telegram के माध्यम से पेयर करें (iOS के लिए अनुशंसित)
  - H3: Node डिवाइस को अनुमोदित करें
  - H3: वैकल्पिक trusted-CIDR Node ऑटो-अप्रूव
  - H3: Node पेयरिंग स्टेट स्टोरेज
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
  - H2: QR-कोड ऑनबोर्डिंग
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
  - H2: कॉन्फ़िग राइट्स
  - H2: नंबर मॉडल (महत्वपूर्ण)
  - H2: सेटअप पथ A: मौजूदा Signal खाते को लिंक करें (QR)
  - H2: सेटअप पथ B: समर्पित बॉट नंबर रजिस्टर करें (SMS, Linux)
  - H2: बाहरी डेमन मोड (httpUrl)
  - H2: कंटेनर मोड (bbernhard/signal-cli-rest-api)
  - H2: एक्सेस नियंत्रण (DM + समूह)
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

- मार्ग: /channels/slack
- शीर्षक:
  - H2: Socket Mode या HTTP Request URLs चुनना
  - H3: रिले मोड
  - H2: इंस्टॉल करें
  - H2: त्वरित सेटअप
  - H2: Socket Mode ट्रांसपोर्ट ट्यूनिंग
  - H2: मैनिफ़ेस्ट और स्कोप चेकलिस्ट
  - H3: अतिरिक्त मैनिफ़ेस्ट सेटिंग्स
  - H2: टोकन मॉडल
  - H2: एक्शन और गेट
  - H2: एक्सेस नियंत्रण और रूटिंग
  - H2: थ्रेडिंग, सेशन, और रिप्लाई टैग
  - H2: Ack प्रतिक्रियाएँ
  - H3: Emoji (ackReaction)
  - H3: स्कोप (messages.ackReactionScope)
  - H2: टेक्स्ट स्ट्रीमिंग
  - H2: टाइपिंग प्रतिक्रिया फ़ॉलबैक
  - H2: मीडिया, चंकिंग, और डिलीवरी
  - H2: कमांड और स्लैश व्यवहार
  - H2: इंटरैक्टिव जवाब
  - H3: Plugin-स्वामित्व वाले मोडल सबमिशन
  - H2: Slack में नेटिव अनुमोदन
  - H2: इवेंट और ऑपरेशनल व्यवहार
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: समस्या निवारण
  - H2: अटैचमेंट विज़न संदर्भ
  - H3: समर्थित मीडिया प्रकार
  - H3: इनबाउंड पाइपलाइन
  - H3: थ्रेड-रूट अटैचमेंट इनहेरिटेंस
  - H3: मल्टी-अटैचमेंट हैंडलिंग
  - H3: आकार, डाउनलोड, और मॉडल सीमाएँ
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
  - H3: पर्यावरण चर
  - H3: SecretRef auth टोकन
  - H3: Allowlist-केवल निजी नंबर
  - H3: Messaging Service भेजने वाला
  - H3: डिफ़ॉल्ट आउटबाउंड लक्ष्य
  - H2: एक्सेस नियंत्रण
  - H2: SMS भेजना
  - H2: सेटअप सत्यापित करें
  - H3: macOS iMessage/SMS से एंड-टू-एंड परीक्षण
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
  - H2: पर्यावरण चर
  - H2: DM नीति और एक्सेस नियंत्रण
  - H2: आउटबाउंड डिलीवरी
  - H2: मल्टी-अकाउंट
  - H2: सुरक्षा नोट्स
  - H2: समस्या निवारण
  - H2: संबंधित

## channels/telegram.md

- मार्ग: /channels/telegram
- शीर्षक:
  - H2: त्वरित सेटअप
  - H2: Telegram साइड सेटिंग्स
  - H2: एक्सेस नियंत्रण और सक्रियण
  - H3: समूह बॉट पहचान
  - H2: रनटाइम व्यवहार
  - H2: फीचर संदर्भ
  - H2: त्रुटि रिप्लाई नियंत्रण
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: संबंधित

## channels/tlon.md

- मार्ग: /channels/tlon
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: सेटअप
  - H2: निजी/LAN शिप
  - H2: समूह चैनल
  - H2: एक्सेस नियंत्रण
  - H2: स्वामी और अनुमोदन प्रणाली
  - H2: ऑटो-अक्सेप्ट सेटिंग्स
  - H2: डिलीवरी लक्ष्य (CLI/cron)
  - H2: बंडल किया गया skill
  - H2: क्षमताएँ
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: नोट्स
  - H2: संबंधित

## channels/troubleshooting.md

- मार्ग: /channels/troubleshooting
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
  - H3: बॉट कॉन्फ़िगर करें
  - H3: अभिगम नियंत्रण (अनुशंसित)
  - H2: टोकन रिफ्रेश (वैकल्पिक)
  - H2: बहु-खाता समर्थन
  - H2: अभिगम नियंत्रण
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन
  - H3: खाता कॉन्फ़िगरेशन
  - H3: प्रदाता विकल्प
  - H2: टूल कार्रवाइयाँ
  - H2: सुरक्षा और संचालन
  - H2: सीमाएँ
  - H2: संबंधित

## channels/wechat.md

- मार्ग: /channels/wechat
- शीर्षक:
  - H2: नामकरण
  - H2: यह कैसे काम करता है
  - H2: इंस्टॉल करें
  - H2: लॉगिन
  - H2: अभिगम नियंत्रण
  - H2: संगतता
  - H2: साइडकार प्रक्रिया
  - H2: समस्या निवारण
  - H2: संबंधित दस्तावेज़

## channels/whatsapp.md

- मार्ग: /channels/whatsapp
- शीर्षक:
  - H2: इंस्टॉल करें (मांग पर)
  - H2: त्वरित सेटअप
  - H2: डिप्लॉयमेंट पैटर्न
  - H2: रनटाइम मॉडल
  - H2: स्वीकृति प्रॉम्प्ट
  - H2: Plugin हुक और गोपनीयता
  - H2: अभिगम नियंत्रण और सक्रियण
  - H2: कॉन्फ़िगर किए गए ACP बाइंडिंग
  - H2: निजी-नंबर और स्वयं-चैट व्यवहार
  - H2: संदेश सामान्यीकरण और संदर्भ
  - H2: डिलीवरी, चंकिंग और मीडिया
  - H2: जवाब उद्धरण
  - H2: प्रतिक्रिया स्तर
  - H2: पावती प्रतिक्रियाएँ
  - H2: लाइफ़साइकल स्थिति प्रतिक्रियाएँ
  - H2: बहु-खाता और क्रेडेंशियल
  - H2: टूल, कार्रवाइयाँ, और कॉन्फ़िगरेशन लिखना
  - H2: समस्या निवारण
  - H2: सिस्टम प्रॉम्प्ट
  - H2: कॉन्फ़िगरेशन संदर्भ संकेतक
  - H2: संबंधित

## channels/yuanbao.md

- मार्ग: /channels/yuanbao
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: इंटरैक्टिव सेटअप (विकल्प)
  - H2: अभिगम नियंत्रण
  - H3: सीधे संदेश
  - H3: समूह चैट
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H3: खुली DM नीति के साथ बुनियादी सेटअप
  - H3: DM को विशिष्ट उपयोगकर्ताओं तक सीमित करें
  - H3: समूहों में @mention आवश्यकता अक्षम करें
  - H3: आउटबाउंड संदेश डिलीवरी अनुकूलित करें
  - H3: मर्ज-टेक्स्ट रणनीति ट्यून करें
  - H2: सामान्य कमांड
  - H2: समस्या निवारण
  - H3: बॉट समूह चैट में जवाब नहीं देता
  - H3: बॉट संदेश प्राप्त नहीं करता
  - H3: बॉट खाली या फ़ॉलबैक जवाब भेजता है
  - H3: App Secret लीक हो गया
  - H2: उन्नत कॉन्फ़िगरेशन
  - H3: कई खाते
  - H3: संदेश सीमाएँ
  - H3: स्ट्रीमिंग
  - H3: समूह चैट इतिहास संदर्भ
  - H3: रिप्लाई-टू मोड
  - H3: Markdown संकेत इंजेक्शन
  - H3: डीबग मोड
  - H3: बहु-एजेंट रूटिंग
  - H2: कॉन्फ़िगरेशन संदर्भ
  - H2: समर्थित संदेश प्रकार
  - H3: प्राप्त करें
  - H3: भेजें
  - H3: थ्रेड और जवाब
  - H2: संबंधित

## channels/zalo.md

- मार्ग: /channels/zalo
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: सेटअप (तेज़ पथ)
  - H3: 1) बॉट टोकन बनाएँ (Zalo Bot Platform)
  - H3: 2) टोकन कॉन्फ़िगर करें (env या config)
  - H2: यह कैसे काम करता है (व्यवहार)
  - H2: सीमाएँ
  - H2: अभिगम नियंत्रण (DMs)
  - H3: DM अभिगम
  - H2: अभिगम नियंत्रण (समूह)
  - H2: लॉन्ग-पोलिंग बनाम Webhook
  - H2: समर्थित संदेश प्रकार
  - H2: क्षमताएँ
  - H2: डिलीवरी लक्ष्य (CLI/cron)
  - H2: समस्या निवारण
  - H2: कॉन्फ़िगरेशन संदर्भ (Zalo)
  - H2: संबंधित

## channels/zaloclawbot.md

- मार्ग: /channels/zaloclawbot
- शीर्षक:
  - H2: संगतता
  - H2: पूर्वापेक्षाएँ
  - H2: ऑनबोर्ड के साथ इंस्टॉल करें (अनुशंसित)
  - H2: मैनुअल इंस्टॉलेशन
  - H3: 1. Plugin इंस्टॉल करें
  - H3: 2. config में Plugin सक्षम करें
  - H3: 3. QR कोड जनरेट करें और लॉगिन करें
  - H3: 4. gateway पुनः शुरू करें
  - H2: यह कैसे काम करता है
  - H2: आंतरिक कार्यप्रणाली
  - H2: समस्या निवारण

## channels/zalouser.md

- मार्ग: /channels/zalouser
- शीर्षक:
  - H2: बंडल किया गया Plugin
  - H2: त्वरित सेटअप (शुरुआती)
  - H2: यह क्या है
  - H2: नामकरण
  - H2: ID खोजना (निर्देशिका)
  - H2: सीमाएँ
  - H2: अभिगम नियंत्रण (DMs)
  - H2: समूह अभिगम (वैकल्पिक)
  - H3: समूह उल्लेख गेटिंग
  - H2: बहु-खाता
  - H2: पर्यावरण चर
  - H2: टाइपिंग, प्रतिक्रियाएँ, और डिलीवरी पावती
  - H2: समस्या निवारण
  - H2: संबंधित

## ci.md

- मार्ग: /ci
- शीर्षक:
  - H2: पाइपलाइन अवलोकन
  - H2: फ़ेल-फ़ास्ट क्रम
  - H2: PR संदर्भ और प्रमाण
  - H2: दायरा और रूटिंग
  - H2: ClawSweeper गतिविधि अग्रेषण
  - H2: मैनुअल dispatches
  - H2: रनर
  - H2: रनर पंजीकरण बजट
  - H2: स्थानीय समकक्ष
  - H2: OpenClaw Performance
  - H2: पूर्ण रिलीज़ सत्यापन
  - H2: लाइव और E2E शार्ड
  - H2: पैकेज स्वीकृति
  - H3: जॉब
  - H3: उम्मीदवार स्रोत
  - H3: सुइट प्रोफ़ाइल
  - H3: लेगेसी संगतता विंडो
  - H3: उदाहरण
  - H2: इंस्टॉल स्मोक
  - H2: स्थानीय Docker E2E
  - H3: ट्यून करने योग्य पैरामीटर
  - H3: पुन: प्रयोज्य लाइव/E2E वर्कफ़्लो
  - H3: रिलीज़-पथ चंक
  - H2: Plugin प्री-रिलीज़
  - H2: QA लैब
  - H2: CodeQL
  - H3: सुरक्षा श्रेणियाँ
  - H3: प्लेटफ़ॉर्म-विशिष्ट सुरक्षा शार्ड
  - H3: महत्वपूर्ण गुणवत्ता श्रेणियाँ
  - H2: रखरखाव वर्कफ़्लो
  - H3: Docs Agent
  - H3: Test Performance Agent
  - H3: मर्ज के बाद डुप्लिकेट PR
  - H2: स्थानीय चेक गेट और बदली हुई रूटिंग
  - H2: Testbox सत्यापन
  - H2: संबंधित

## clawhub/cli.md

- मार्ग: /clawhub/cli
- शीर्षक:
  - H1: ClawHub CLI
  - H2: खोजें और इंस्टॉल करें
  - H2: प्रकाशित करें और बनाए रखें
  - H2: संबंधित

## clawhub/publishing.md

- मार्ग: /clawhub/publishing
- शीर्षक:
  - H1: ClawHub पर प्रकाशन
  - H2: मालिक
  - H2: Skills
  - H2: Plugins
  - H2: रिलीज़ प्रवाह
  - H2: FAQ
  - H3: पैकेज scope चयनित मालिक से मेल खाना चाहिए

## cli/acp.md

- मार्ग: /cli/acp
- शीर्षक:
  - H2: यह क्या नहीं है
  - H2: संगतता मैट्रिक्स
  - H2: ज्ञात सीमाएँ
  - H2: उपयोग
  - H2: ACP क्लाइंट (डीबग)
  - H2: प्रोटोकॉल स्मोक टेस्टिंग
  - H2: इसका उपयोग कैसे करें
  - H2: एजेंट चुनना
  - H2: acpx से उपयोग करें (Codex, Claude, अन्य ACP क्लाइंट)
  - H2: Zed एडिटर सेटअप
  - H2: सेशन मैपिंग
  - H2: विकल्प
  - H3: acp क्लाइंट विकल्प
  - H2: संबंधित

## cli/agent.md

- मार्ग: /cli/agent
- शीर्षक:
  - H1: openclaw agent
  - H2: विकल्प
  - H2: उदाहरण
  - H2: नोट्स
  - H2: JSON डिलीवरी स्थिति
  - H2: संबंधित

## cli/agents.md

- मार्ग: /cli/agents
- शीर्षक:
  - H1: openclaw agents
  - H2: उदाहरण
  - H2: रूटिंग बाइंडिंग
  - H3: --bind प्रारूप
  - H3: बाइंडिंग scope व्यवहार
  - H2: कमांड सतह
  - H3: agents
  - H3: agents list
  - H3: agents add [name]
  - H3: agents bindings
  - H3: agents bind
  - H3: agents unbind
  - H3: agents delete
  - H2: पहचान फ़ाइलें
  - H2: पहचान सेट करें
  - H2: संबंधित

## cli/approvals.md

- मार्ग: /cli/approvals
- शीर्षक:
  - H1: openclaw approvals
  - H2: openclaw exec-policy
  - H2: सामान्य कमांड
  - H2: किसी फ़ाइल से स्वीकृतियाँ बदलें
  - H2: "कभी प्रॉम्प्ट न करें" / YOLO उदाहरण
  - H2: Allowlist हेल्पर
  - H2: सामान्य विकल्प
  - H2: नोट्स
  - H2: संबंधित

## cli/backup.md

- मार्ग: /cli/backup
- शीर्षक:
  - H1: openclaw backup
  - H2: नोट्स
  - H2: किसका बैकअप लिया जाता है
  - H2: अमान्य config व्यवहार
  - H2: आकार और प्रदर्शन
  - H2: संबंधित

## cli/browser.md

- मार्ग: /cli/browser
- शीर्षक:
  - H1: openclaw browser
  - H2: सामान्य फ़्लैग
  - H2: त्वरित शुरुआत (स्थानीय)
  - H2: त्वरित समस्या निवारण
  - H2: लाइफ़साइकल
  - H2: यदि कमांड मौजूद नहीं है
  - H2: प्रोफ़ाइल
  - H2: टैब
  - H2: स्नैपशॉट / स्क्रीनशॉट / कार्रवाइयाँ
  - H2: स्थिति और स्टोरेज
  - H2: डीबगिंग
  - H2: MCP के जरिए मौजूदा Chrome
  - H2: रिमोट ब्राउज़र नियंत्रण (node होस्ट प्रॉक्सी)
  - H2: संबंधित

## cli/channels.md

- मार्ग: /cli/channels
- शीर्षक:
  - H1: openclaw channels
  - H2: सामान्य कमांड
  - H2: स्थिति / क्षमताएँ / resolve / लॉग
  - H2: खाते जोड़ें / हटाएँ
  - H2: लॉगिन और लॉगआउट (इंटरैक्टिव)
  - H2: समस्या निवारण
  - H2: क्षमता probe
  - H2: नामों को ID में resolve करें
  - H2: संबंधित

## cli/clawbot.md

- मार्ग: /cli/clawbot
- शीर्षक:
  - H1: openclaw clawbot
  - H2: माइग्रेशन
  - H2: संबंधित

## cli/commitments.md

- मार्ग: /cli/commitments
- शीर्षक:
  - H2: उपयोग
  - H2: विकल्प
  - H2: उदाहरण
  - H2: आउटपुट
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
  - H2: रूट विकल्प
  - H2: उदाहरण
  - H3: config schema
  - H3: पथ
  - H2: मान
  - H2: config set मोड
  - H2: config patch
  - H2: प्रदाता बिल्डर फ़्लैग
  - H2: ड्राई रन
  - H3: JSON आउटपुट आकार
  - H2: लिखने की सुरक्षा
  - H2: उपकमांड
  - H2: सत्यापित करें
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
  - H2: सुरक्षित स्टार्टअप
  - H2: संचालन और स्वीकृति
  - H2: सेटअप बूटस्ट्रैप
  - H2: मॉडल-सहायित प्लानर
  - H2: किसी एजेंट पर स्विच करना
  - H2: संदेश बचाव मोड
  - H2: संबंधित

## cli/cron.md

- मार्ग: /cli/cron
- शीर्षक:
  - H1: openclaw cron
  - H2: जॉब जल्दी बनाएँ
  - H2: सेशन
  - H2: डिलीवरी
  - H3: डिलीवरी स्वामित्व
  - H3: विफलता डिलीवरी
  - H2: शेड्यूलिंग
  - H3: वन-शॉट जॉब
  - H3: आवर्ती जॉब
  - H3: मैनुअल रन
  - H2: मॉडल
  - H3: अलग-थलग cron मॉडल प्राथमिकता
  - H3: तेज़ मोड
  - H3: लाइव मॉडल स्विच पुनःप्रयास
  - H2: रन आउटपुट और अस्वीकृतियाँ
  - H3: बासी पावती दमन
  - H3: साइलेंट टोकन दमन
  - H3: संरचित अस्वीकृतियाँ
  - H2: रिटेंशन
  - H2: पुराने जॉब माइग्रेट करना
  - H2: सामान्य संपादन
  - H2: सामान्य एडमिन कमांड
  - H2: संबंधित

## cli/daemon.md

- मार्ग: /cli/daemon
- शीर्षक:
  - H1: openclaw daemon
  - H2: उपयोग
  - H2: उपकमांड
  - H2: सामान्य विकल्प
  - H2: प्राथमिकता दें
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
  - H2: कमांड
  - H3: openclaw devices list
  - H3: openclaw devices remove
  - H3: openclaw devices clear --yes [--pending]
  - H3: openclaw devices approve [requestId] [--latest]
  - H2: Paperclip / openclawgateway पहली-बार स्वीकृति
  - H3: openclaw devices reject
  - H3: openclaw devices rotate --device --role [--scope ]
  - H3: openclaw devices revoke --device --role
  - H2: सामान्य विकल्प
  - H2: नोट्स
  - H2: टोकन drift रिकवरी चेकलिस्ट
  - H2: संबंधित

## cli/directory.md

- मार्ग: /cli/directory
- शीर्षक:
  - H1: openclaw directory
  - H2: सामान्य फ़्लैग
  - H2: नोट्स
  - H2: message send के साथ परिणामों का उपयोग
  - H2: ID प्रारूप (चैनल के अनुसार)
  - H2: स्वयं ("me")
  - H2: पीयर (संपर्क/उपयोगकर्ता)
  - H2: समूह
  - H2: संबंधित

## cli/dns.md

- मार्ग: /cli/dns
- शीर्षक:
  - H1: openclaw dns
  - H2: सेटअप
  - H2: dns setup
  - H2: संबंधित

## cli/docs.md

- मार्ग: /cli/docs
- शीर्षक:
  - H1: openclaw docs
  - H2: उपयोग
  - H2: उदाहरण
  - H2: यह कैसे काम करता है
  - H2: आउटपुट
  - H2: निकास कोड
  - H2: संबंधित

## cli/doctor.md

- मार्ग: /cli/doctor
- शीर्षक:
  - H1: openclaw doctor
  - H2: इसका उपयोग क्यों करें
  - H2: उदाहरण
  - H2: विकल्प
  - H2: लिंट मोड
  - H2: संरचित स्वास्थ्य जाँच
  - H2: जाँच चयन
  - H2: अपग्रेड के बाद का मोड
  - H2: macOS: launchctl env ओवरराइड
  - H2: संबंधित

## cli/flows.md

- मार्ग: /cli/flows
- शीर्षक:
  - H1: openclaw tasks flow
  - H2: उपकमांड
  - H3: स्थिति फ़िल्टर मान
  - H2: उदाहरण
  - H2: संबंधित

## cli/gateway.md

- मार्ग: /cli/gateway
- शीर्षक:
  - H2: Gateway चलाएँ
  - H3: विकल्प
  - H2: Gateway पुनः शुरू करें
  - H3: Gateway प्रोफ़ाइलिंग
  - H2: चल रहे Gateway से क्वेरी करें
  - H3: gateway health
  - H3: gateway usage-cost
  - H3: gateway stability
  - H3: gateway diagnostics export
  - H3: gateway status
  - H3: gateway probe
  - H4: SSH पर रिमोट (Mac ऐप समानता)
  - H3: gateway call
  - H2: Gateway सेवा प्रबंधित करें
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

- Route: /cli/hooks
- शीर्षक:
  - H1: openclaw hooks
  - H2: सभी हुक सूचीबद्ध करें
  - H2: हुक जानकारी प्राप्त करें
  - H2: हुक पात्रता जांचें
  - H2: एक Hook सक्षम करें
  - H2: एक Hook अक्षम करें
  - H2: नोट्स
  - H2: हुक पैक इंस्टॉल करें
  - H2: हुक पैक अपडेट करें
  - H2: बंडल किए गए हुक
  - H3: session-memory
  - H3: bootstrap-extra-files
  - H3: command-logger
  - H3: boot-md
  - H2: संबंधित

## cli/index.md

- Route: /cli
- शीर्षक:
  - H2: कमांड पेज
  - H2: वैश्विक फ्लैग
  - H2: आउटपुट मोड
  - H2: कमांड ट्री
  - H2: चैट स्लैश कमांड
  - H2: उपयोग ट्रैकिंग
  - H2: संबंधित

## cli/infer.md

- Route: /cli/infer
- शीर्षक:
  - H2: infer को skill में बदलें
  - H2: infer क्यों उपयोग करें
  - H2: कमांड ट्री
  - H2: सामान्य कार्य
  - H2: व्यवहार
  - H2: मॉडल
  - H2: इमेज
  - H2: ऑडियो
  - H2: TTS
  - H2: वीडियो
  - H2: वेब
  - H2: एम्बेडिंग
  - H2: JSON आउटपुट
  - H2: सामान्य गलतियां
  - H2: नोट्स
  - H2: संबंधित

## cli/logs.md

- Route: /cli/logs
- शीर्षक:
  - H1: openclaw logs
  - H2: विकल्प
  - H2: साझा Gateway RPC विकल्प
  - H2: उदाहरण
  - H2: नोट्स
  - H2: संबंधित

## cli/mcp.md

- Route: /cli/mcp
- शीर्षक:
  - H2: सही MCP पथ चुनें
  - H2: MCP सर्वर के रूप में OpenClaw
  - H3: serve कब उपयोग करें
  - H3: यह कैसे काम करता है
  - H3: क्लाइंट मोड चुनें
  - H3: serve क्या उजागर करता है
  - H3: उपयोग
  - H3: ब्रिज टूल
  - H3: इवेंट मॉडल
  - H3: Claude चैनल सूचनाएं
  - H3: MCP क्लाइंट कॉन्फिग
  - H3: विकल्प
  - H3: सुरक्षा और भरोसे की सीमा
  - H3: परीक्षण
  - H3: समस्या निवारण
  - H2: MCP क्लाइंट रजिस्ट्री के रूप में OpenClaw
  - H3: सहेजी गई MCP सर्वर परिभाषाएं
  - H3: सामान्य सर्वर रेसिपी
  - H3: JSON आउटपुट आकार
  - H3: Stdio ट्रांसपोर्ट
  - H3: SSE / HTTP ट्रांसपोर्ट
  - H3: OAuth वर्कफ़्लो
  - H3: Streamable HTTP ट्रांसपोर्ट
  - H2: Control UI
  - H2: मौजूदा सीमाएं
  - H2: संबंधित

## cli/memory.md

- Route: /cli/memory
- शीर्षक:
  - H1: openclaw memory
  - H2: उदाहरण
  - H2: विकल्प
  - H2: Dreaming
  - H2: संबंधित

## cli/message.md

- Route: /cli/message
- शीर्षक:
  - H1: openclaw message
  - H2: उपयोग
  - H2: सामान्य फ्लैग
  - H2: SecretRef व्यवहार
  - H2: कार्रवाइयां
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

- Route: /cli/migrate
- शीर्षक:
  - H1: openclaw migrate
  - H2: कमांड
  - H2: सुरक्षा मॉडल
  - H2: Claude प्रोवाइडर
  - H3: Claude क्या इम्पोर्ट करता है
  - H3: आर्काइव और मैन्युअल-समीक्षा स्थिति
  - H2: Codex प्रोवाइडर
  - H3: Codex क्या इम्पोर्ट करता है
  - H3: मैन्युअल-समीक्षा Codex स्थिति
  - H2: Hermes प्रोवाइडर
  - H3: Hermes क्या इम्पोर्ट करता है
  - H3: समर्थित .env कुंजियां
  - H3: केवल-आर्काइव स्थिति
  - H3: लागू करने के बाद
  - H2: Plugin अनुबंध
  - H2: ऑनबोर्डिंग इंटीग्रेशन
  - H2: संबंधित

## cli/models.md

- Route: /cli/models
- शीर्षक:
  - H1: openclaw models
  - H2: सामान्य कमांड
  - H3: मॉडल स्कैन
  - H3: मॉडल स्थिति
  - H2: उपनाम + फ़ॉलबैक
  - H2: ऑथ प्रोफाइल
  - H2: संबंधित

## cli/node.md

- Route: /cli/node
- शीर्षक:
  - H1: openclaw node
  - H2: node होस्ट क्यों उपयोग करें?
  - H2: ब्राउज़र प्रॉक्सी (शून्य-कॉन्फिग)
  - H2: रन (फ़ोरग्राउंड)
  - H2: node होस्ट के लिए Gateway ऑथ
  - H2: सेवा (बैकग्राउंड)
  - H2: पेयरिंग
  - H2: Exec अनुमोदन
  - H2: संबंधित

## cli/nodes.md

- Route: /cli/nodes
- शीर्षक:
  - H1: openclaw nodes
  - H2: सामान्य कमांड
  - H2: इनवोक
  - H2: संबंधित

## cli/onboard.md

- Route: /cli/onboard
- शीर्षक:
  - H1: openclaw onboard
  - H2: संबंधित गाइड
  - H2: उदाहरण
  - H2: लोकेल
  - H3: गैर-इंटरैक्टिव Z.AI एंडपॉइंट विकल्प
  - H2: अतिरिक्त गैर-इंटरैक्टिव फ्लैग
  - H2: फ़्लो नोट्स
  - H2: सामान्य फ़ॉलो-अप कमांड

## cli/pairing.md

- Route: /cli/pairing
- शीर्षक:
  - H1: openclaw pairing
  - H2: कमांड
  - H2: pairing list
  - H2: pairing approve
  - H2: नोट्स
  - H2: संबंधित

## cli/path.md

- Route: /cli/path
- शीर्षक:
  - H1: openclaw path
  - H2: इसे क्यों उपयोग करें
  - H2: इसका उपयोग कैसे किया जाता है
  - H2: यह कैसे काम करता है
  - H2: सबकमांड
  - H2: वैश्विक फ्लैग
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
  - H3: resolve
  - H3: find
  - H3: set
  - H3: validate
  - H3: emit
  - H2: एग्ज़िट कोड
  - H2: आउटपुट मोड
  - H2: नोट्स
  - H2: संबंधित

## cli/plugins.md

- Route: /cli/plugins
- शीर्षक:
  - H2: कमांड
  - H3: लेखक
  - H3: प्रोवाइडर स्कैफ़ोल्ड
  - H3: इंस्टॉल
  - H4: Marketplace शॉर्टहैंड
  - H3: सूची
  - H3: Plugin इंडेक्स
  - H3: अनइंस्टॉल
  - H3: अपडेट
  - H3: निरीक्षण
  - H3: Doctor
  - H3: रजिस्ट्री
  - H3: Marketplace
  - H2: संबंधित

## cli/policy.md

- Route: /cli/policy
- शीर्षक:
  - H1: openclaw policy
  - H2: क्विक स्टार्ट
  - H3: पॉलिसी नियम संदर्भ
  - H4: स्कोप्ड ओवरले
  - H4: चैनल
  - H4: MCP सर्वर
  - H4: मॉडल प्रोवाइडर
  - H4: नेटवर्क
  - H4: इनग्रेस और चैनल पहुंच
  - H4: Gateway
  - H4: एजेंट वर्कस्पेस
  - H4: सैंडबॉक्स स्थिति
  - H4: डेटा हैंडलिंग
  - H4: सीक्रेट
  - H4: Exec अनुमोदन
  - H4: ऑथ प्रोफाइल
  - H4: टूल मेटाडेटा
  - H4: टूल स्थिति
  - H2: पॉलिसी कॉन्फिगर करें
  - H2: पॉलिसी स्थिति स्वीकार करें
  - H2: निष्कर्ष
  - H2: मरम्मत
  - H2: एग्ज़िट कोड
  - H2: संबंधित

## cli/proxy.md

- Route: /cli/proxy
- शीर्षक:
  - H1: openclaw proxy
  - H2: कमांड
  - H2: वैलिडेट
  - H2: क्वेरी प्रीसेट
  - H2: नोट्स
  - H2: संबंधित

## cli/qr.md

- Route: /cli/qr
- शीर्षक:
  - H1: openclaw qr
  - H2: उपयोग
  - H2: विकल्प
  - H2: नोट्स
  - H2: संबंधित

## cli/reset.md

- Route: /cli/reset
- शीर्षक:
  - H1: openclaw reset
  - H2: संबंधित

## cli/sandbox.md

- Route: /cli/sandbox
- शीर्षक:
  - H2: अवलोकन
  - H2: कमांड
  - H3: openclaw sandbox explain
  - H3: openclaw sandbox list
  - H3: openclaw sandbox recreate
  - H2: उपयोग के मामले
  - H3: Docker इमेज अपडेट करने के बाद
  - H3: सैंडबॉक्स कॉन्फिगरेशन बदलने के बाद
  - H3: SSH लक्ष्य या SSH ऑथ सामग्री बदलने के बाद
  - H3: OpenShell स्रोत, पॉलिसी, या मोड बदलने के बाद
  - H3: setupCommand बदलने के बाद
  - H3: केवल किसी विशिष्ट एजेंट के लिए
  - H2: इसकी आवश्यकता क्यों है
  - H2: रजिस्ट्री माइग्रेशन
  - H2: कॉन्फिगरेशन
  - H2: संबंधित

## cli/secrets.md

- Route: /cli/secrets
- शीर्षक:
  - H1: openclaw secrets
  - H2: रनटाइम स्नैपशॉट फिर से लोड करें
  - H2: ऑडिट
  - H2: कॉन्फिगर करें (इंटरैक्टिव हेल्पर)
  - H2: सहेजी गई योजना लागू करें
  - H2: रोलबैक बैकअप क्यों नहीं
  - H2: उदाहरण
  - H2: संबंधित

## cli/security.md

- Route: /cli/security
- शीर्षक:
  - H1: openclaw security
  - H2: ऑडिट
  - H2: JSON आउटपुट
  - H2: --fix क्या बदलता है
  - H2: संबंधित

## cli/sessions.md

- Route: /cli/sessions
- शीर्षक:
  - H1: openclaw sessions
  - H2: क्लीनअप रखरखाव
  - H2: सत्र Compact करें
  - H3: sessions.compact RPC
  - H2: संबंधित

## cli/setup.md

- Route: /cli/setup
- शीर्षक:
  - H1: openclaw setup
  - H2: विकल्प
  - H3: बेसलाइन मोड
  - H2: उदाहरण
  - H2: नोट्स
  - H2: संबंधित

## cli/skills.md

- Route: /cli/skills
- शीर्षक:
  - H1: openclaw skills
  - H2: कमांड
  - H2: Skill Workshop
  - H2: संबंधित

## cli/status.md

- Route: /cli/status
- शीर्षक:
  - H2: संबंधित

## cli/system.md

- Route: /cli/system
- शीर्षक:
  - H1: openclaw system
  - H2: सामान्य कमांड
  - H2: system event
  - H2: system heartbeat last|enable|disable
  - H2: system presence
  - H2: नोट्स
  - H2: संबंधित

## cli/tasks.md

- Route: /cli/tasks
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

- Route: /cli/transcripts
- शीर्षक:
  - H1: openclaw transcripts
  - H2: कमांड
  - H2: आउटपुट
  - H2: प्रति दिन कई मीटिंग
  - H2: अनुपलब्ध सारांश
  - H2: कॉन्फिगरेशन

## cli/tui.md

- Route: /cli/tui
- शीर्षक:
  - H1: openclaw tui
  - H2: विकल्प
  - H2: उदाहरण
  - H2: कॉन्फिग मरम्मत लूप
  - H2: संबंधित

## cli/uninstall.md

- Route: /cli/uninstall
- शीर्षक:
  - H1: openclaw uninstall
  - H2: संबंधित

## cli/update.md

- Route: /cli/update
- शीर्षक:
  - H1: openclaw update
  - H2: उपयोग
  - H2: विकल्प
  - H2: update status
  - H2: update repair
  - H2: update wizard
  - H2: यह क्या करता है
  - H3: कंट्रोल-प्लेन प्रतिक्रिया आकार
  - H2: Git चेकआउट फ़्लो
  - H3: चैनल चयन
  - H3: अपडेट चरण
  - H2: --update शॉर्टहैंड
  - H2: संबंधित

## cli/voicecall.md

- Route: /cli/voicecall
- शीर्षक:
  - H1: openclaw voicecall
  - H2: सबकमांड
  - H2: सेटअप और स्मोक
  - H3: setup
  - H3: smoke
  - H2: कॉल लाइफ़साइकल
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
  - H2: Webhook उजागर करना
  - H3: expose
  - H2: संबंधित

## cli/webhooks.md

- Route: /cli/webhooks
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

- Route: /cli/wiki
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
  - H2: कॉन्फिगरेशन टाई-इन
  - H2: संबंधित

## cli/workboard.md

- Route: /cli/workboard
- शीर्षक:
  - H2: उपयोग
  - H2: list
  - H2: create
  - H2: show
  - H2: dispatch
  - H2: स्लैश कमांड समानता
  - H2: अनुमतियां
  - H2: समस्या निवारण
  - H3: कोई कार्ड दिखाई नहीं देता
  - H3: Dispatch Data-Only कहता है
  - H3: Dispatch कुछ शुरू नहीं करता
  - H2: संबंधित

## concepts/active-memory.md

- Route: /concepts/active-memory
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: गति संबंधी सुझाव
  - H3: Cerebras सेटअप
  - H2: इसे कैसे देखें
  - H2: सत्र टॉगल
  - H2: यह कब चलता है
  - H2: सत्र प्रकार
  - H2: यह कहां चलता है
  - H2: इसे क्यों उपयोग करें
  - H2: यह कैसे काम करता है
  - H2: क्वेरी मोड
  - H2: प्रॉम्प्ट शैलियां
  - H2: मॉडल फ़ॉलबैक पॉलिसी
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
  - H2: संबंधित पेज

## concepts/agent-loop.md

- Route: /concepts/agent-loop
- शीर्षक:
  - H2: एंट्री पॉइंट
  - H2: यह कैसे काम करता है (उच्च-स्तर)
  - H2: क्यूइंग + कंकरेंसी
  - H2: सत्र + वर्कस्पेस तैयारी
  - H2: प्रॉम्प्ट असेंबली + सिस्टम प्रॉम्प्ट
  - H2: हुक पॉइंट (जहां आप इंटरसेप्ट कर सकते हैं)
  - H3: आंतरिक हुक (Gateway हुक)
  - H3: Plugin हुक (एजेंट + Gateway लाइफ़साइकल)
  - H2: स्ट्रीमिंग + आंशिक जवाब
  - H2: टूल निष्पादन + मैसेजिंग टूल
  - H2: जवाब आकार देना + सप्रेशन
  - H2: Compaction + पुनः प्रयास
  - H2: इवेंट स्ट्रीम (आज)
  - H2: चैट चैनल हैंडलिंग
  - H2: टाइमआउट
  - H2: चीज़ें कहां जल्दी समाप्त हो सकती हैं
  - H2: संबंधित

## concepts/agent-runtimes.md

- Route: /concepts/agent-runtimes
- शीर्षक:
  - H2: Codex सतहें
  - H2: रनटाइम स्वामित्व
  - H2: रनटाइम चयन
  - H2: GitHub Copilot एजेंट रनटाइम
  - H2: संगतता अनुबंध
  - H2: स्थिति लेबल
  - H2: संबंधित

## concepts/agent-workspace.md

- Route: /concepts/agent-workspace
- शीर्षक:
  - H2: डिफ़ॉल्ट स्थान
  - H2: अतिरिक्त वर्कस्पेस फ़ोल्डर
  - H2: वर्कस्पेस फ़ाइल मैप
  - H2: वर्कस्पेस में क्या नहीं है
  - H2: Git बैकअप (अनुशंसित, निजी)
  - H2: सीक्रेट कमिट न करें
  - H2: वर्कस्पेस को नई मशीन पर ले जाना
  - H2: उन्नत नोट्स
  - H2: संबंधित

## concepts/agent.md

- रूट: /concepts/agent
- शीर्षक:
  - H2: वर्कस्पेस (आवश्यक)
  - H2: बूटस्ट्रैप फ़ाइलें (इंजेक्ट की गई)
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
  - H2: घटक और फ़्लो
  - H3: Gateway (daemon)
  - H3: क्लाइंट (mac ऐप / CLI / वेब एडमिन)
  - H3: नोड्स (macOS / iOS / Android / हेडलेस)
  - H3: WebChat
  - H2: कनेक्शन जीवनचक्र (एकल क्लाइंट)
  - H2: वायर प्रोटोकॉल (सारांश)
  - H2: पेयरिंग + स्थानीय भरोसा
  - H2: प्रोटोकॉल टाइपिंग और कोडजन
  - H2: रिमोट एक्सेस
  - H2: ऑपरेशंस स्नैपशॉट
  - H2: अपरिवर्तनीयताएँ
  - H2: संबंधित

## concepts/channel-docking.md

- रूट: /concepts/channel-docking
- शीर्षक:
  - H2: उदाहरण
  - H2: इसका उपयोग क्यों करें
  - H2: आवश्यक कॉन्फ़िग
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
  - H3: आइडेंटिफ़ायर संरक्षण
  - H3: सक्रिय ट्रांसक्रिप्ट बाइट गार्ड
  - H3: उत्तराधिकारी ट्रांसक्रिप्ट
  - H3: Compaction सूचनाएँ
  - H3: मेमरी फ्लश
  - H2: प्लग करने योग्य Compaction प्रदाता
  - H2: Compaction बनाम प्रूनिंग
  - H2: समस्या निवारण
  - H2: संबंधित

## concepts/context-engine.md

- रूट: /concepts/context-engine
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
  - H2: Compaction और मेमरी से संबंध
  - H2: सुझाव
  - H2: संबंधित

## concepts/context.md

- रूट: /concepts/context
- शीर्षक:
  - H2: त्वरित शुरुआत (कॉन्टेक्स्ट निरीक्षण करें)
  - H2: उदाहरण आउटपुट
  - H3: /context list
  - H3: /context detail
  - H3: /context map
  - H2: कॉन्टेक्स्ट विंडो में क्या गिना जाता है
  - H2: OpenClaw सिस्टम प्रॉम्प्ट कैसे बनाता है
  - H2: इंजेक्ट की गई वर्कस्पेस फ़ाइलें (प्रोजेक्ट कॉन्टेक्स्ट)
  - H2: Skills: इंजेक्ट की गई बनाम मांग पर लोड की गई
  - H2: टूल्स: दो लागतें होती हैं
  - H2: कमांड, निर्देश, और "इनलाइन शॉर्टकट"
  - H2: सत्र, Compaction, और प्रूनिंग (क्या बना रहता है)
  - H2: /context वास्तव में क्या रिपोर्ट करता है
  - H2: संबंधित

## concepts/delegate-architecture.md

- रूट: /concepts/delegate-architecture
- शीर्षक:
  - H2: डेलीगेट क्या है?
  - H2: डेलीगेट क्यों?
  - H2: क्षमता स्तर
  - H3: स्तर 1: केवल-पढ़ें + ड्राफ़्ट
  - H3: स्तर 2: प्रतिनिधि के रूप में भेजें
  - H3: स्तर 3: सक्रिय
  - H2: पूर्वापेक्षाएँ: अलगाव और हार्डनिंग
  - H3: कठोर अवरोध (गैर-परक्राम्य)
  - H3: टूल प्रतिबंध
  - H3: सैंडबॉक्स अलगाव
  - H3: ऑडिट ट्रेल
  - H2: डेलीगेट सेट अप करना
  - H3: 1. डेलीगेट एजेंट बनाएँ
  - H3: 2. आइडेंटिटी प्रदाता डेलीगेशन कॉन्फ़िगर करें
  - H4: Microsoft 365
  - H4: Google Workspace
  - H3: 3. डेलीगेट को चैनलों से बाँधें
  - H3: 4. डेलीगेट एजेंट में क्रेडेंशियल जोड़ें
  - H2: उदाहरण: संगठनात्मक सहायक
  - H2: स्केलिंग पैटर्न
  - H2: संबंधित

## concepts/dreaming.md

- रूट: /concepts/dreaming
- शीर्षक:
  - H2: Dreaming क्या लिखता है
  - H2: फ़ेज़ मॉडल
  - H2: सत्र ट्रांसक्रिप्ट इनजेशन
  - H2: ड्रीम डायरी
  - H2: गहरे रैंकिंग सिग्नल
  - H2: QA शैडो ट्रायल रिपोर्ट कवरेज
  - H2: शेड्यूलिंग
  - H2: त्वरित शुरुआत
  - H2: स्लैश कमांड
  - H2: CLI वर्कफ़्लो
  - H2: मुख्य डिफ़ॉल्ट
  - H2: ड्रीम्स UI
  - H2: Dreaming कभी नहीं चलता: स्थिति अवरोधित दिखाती है
  - H2: संबंधित

## concepts/experimental-features.md

- रूट: /concepts/experimental-features
- शीर्षक:
  - H2: वर्तमान में दस्तावेज़ित फ़्लैग
  - H2: स्थानीय मॉडल लीन मोड
  - H3: ये तीन टूल क्यों
  - H3: इसे कब चालू करें
  - H3: इसे कब बंद रखें
  - H3: सक्षम करें
  - H2: प्रयोगात्मक का अर्थ छिपा हुआ नहीं है
  - H2: संबंधित

## concepts/features.md

- रूट: /concepts/features
- शीर्षक:
  - H2: मुख्य बिंदु
  - H2: पूरी सूची
  - H2: संबंधित

## concepts/mantis-slack-desktop-runbook.md

- रूट: /concepts/mantis-slack-desktop-runbook
- शीर्षक:
  - H2: स्टोरेज मॉडल
  - H2: GitHub डिस्पैच
  - H2: स्थानीय CLI
  - H2: हाइड्रेट मोड
  - H2: समय व्याख्या
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
  - H2: GitHub आर्टिफ़ैक्ट और PR टिप्पणियाँ
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
  - H2: टेबल हैंडलिंग
  - H2: चंकिंग नियम
  - H2: लिंक नीति
  - H2: स्पॉइलर
  - H2: चैनल फ़ॉर्मैटर कैसे जोड़ें या अपडेट करें
  - H2: सामान्य उलझनें
  - H2: संबंधित

## concepts/memory-builtin.md

- रूट: /concepts/memory-builtin
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

- रूट: /concepts/memory-honcho
- शीर्षक:
  - H2: यह क्या प्रदान करता है
  - H2: उपलब्ध टूल
  - H2: शुरुआत करना
  - H2: कॉन्फ़िगरेशन
  - H2: मौजूदा मेमरी माइग्रेट करना
  - H2: यह कैसे काम करता है
  - H2: Honcho बनाम बिल्टइन मेमरी
  - H2: CLI कमांड
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/memory-qmd.md

- रूट: /concepts/memory-qmd
- शीर्षक:
  - H2: यह बिल्टइन से अधिक क्या जोड़ता है
  - H2: शुरुआत करना
  - H3: पूर्वापेक्षाएँ
  - H3: सक्षम करें
  - H2: साइडकार कैसे काम करता है
  - H2: खोज प्रदर्शन और संगतता
  - H2: मॉडल ओवरराइड
  - H2: अतिरिक्त पथ इंडेक्स करना
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
  - H2: त्वरित शुरुआत
  - H2: समर्थित प्रदाता
  - H2: खोज कैसे काम करती है
  - H2: खोज गुणवत्ता सुधारना
  - H3: समयगत क्षय
  - H3: MMR (विविधता)
  - H3: दोनों सक्षम करें
  - H2: मल्टीमॉडल मेमरी
  - H2: सत्र मेमरी खोज
  - H2: समस्या निवारण
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/memory.md

- रूट: /concepts/memory
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: क्या कहाँ जाता है
  - H2: कार्रवाई-संवेदनशील मेमरी
  - H2: अनुमानित प्रतिबद्धताएँ
  - H2: मेमरी टूल
  - H2: मेमरी Wiki सहायक Plugin
  - H2: मेमरी खोज
  - H2: मेमरी बैकएंड
  - H2: नॉलेज विकी लेयर
  - H2: स्वचालित मेमरी फ्लश
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
  - H2: संदेश शब्द
  - H3: संदेश
  - H3: लक्ष्य
  - H3: संबंध
  - H3: मूल
  - H3: रसीद
  - H2: प्राप्ति कॉन्टेक्स्ट
  - H2: भेजने का कॉन्टेक्स्ट
  - H2: लाइव कॉन्टेक्स्ट
  - H2: अडैप्टर सतह
  - H2: सार्वजनिक SDK कटौती
  - H2: चैनल इनबाउंड से संबंध
  - H2: संगतता गार्डरेल
  - H2: आंतरिक स्टोरेज
  - H2: विफलता वर्ग
  - H2: चैनल मैपिंग
  - H2: माइग्रेशन योजना
  - H3: फ़ेज़ 1: आंतरिक संदेश डोमेन
  - H3: फ़ेज़ 2: टिकाऊ भेजने का कोर
  - H3: फ़ेज़ 3: चैनल इनबाउंड ब्रिज
  - H3: फ़ेज़ 4: तैयार डिस्पैचर ब्रिज
  - H3: फ़ेज़ 5: एकीकृत लाइव जीवनचक्र
  - H3: फ़ेज़ 6: सार्वजनिक SDK
  - H3: फ़ेज़ 7: सभी प्रेषक
  - H3: फ़ेज़ 8: Turn-नामित संगतता हटाएँ
  - H2: परीक्षण योजना
  - H2: खुले प्रश्न
  - H2: स्वीकृति मानदंड
  - H2: संबंधित

## concepts/messages.md

- रूट: /concepts/messages
- शीर्षक:
  - H2: संदेश फ़्लो (उच्च स्तर)
  - H2: इनबाउंड डीड्यूप
  - H2: इनबाउंड डिबाउंसिंग
  - H2: सत्र और डिवाइस
  - H2: टूल परिणाम मेटाडेटा
  - H2: इनबाउंड बॉडी और इतिहास कॉन्टेक्स्ट
  - H2: क्यूइंग और फ़ॉलोअप
  - H2: चैनल रन स्वामित्व
  - H2: स्ट्रीमिंग, चंकिंग, और बैचिंग
  - H2: रीजनिंग दृश्यता और टोकन
  - H2: प्रीफ़िक्स, थ्रेडिंग, और जवाब
  - H2: मौन जवाब
  - H2: संबंधित

## concepts/model-failover.md

- रूट: /concepts/model-failover
- शीर्षक:
  - H2: रनटाइम फ़्लो
  - H2: चयन स्रोत नीति
  - H2: ऑथ विफलता स्किप कैश
  - H2: उपयोगकर्ता-दृश्य फ़ॉलबैक सूचनाएँ
  - H2: ऑथ स्टोरेज (कुंजियाँ + OAuth)
  - H2: प्रोफ़ाइल ID
  - H2: रोटेशन क्रम
  - H3: सत्र स्टिकीनेस (कैश-अनुकूल)
  - H3: OpenAI Codex सदस्यता प्लस API-कुंजी बैकअप
  - H2: कूलडाउन
  - H2: बिलिंग निष्क्रिय करती है
  - H2: मॉडल फ़ॉलबैक
  - H3: उम्मीदवार श्रृंखला नियम
  - H3: कौन सी त्रुटियाँ फ़ॉलबैक आगे बढ़ाती हैं
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
  - H4: जानने योग्य विशिष्टताएँ
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
  - H3: स्थानीय प्रॉक्सी (LM Studio, vLLM, LiteLLM, आदि)
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
  - H3: सुरक्षित अलाउलिस्ट संपादन
  - H2: "मॉडल अनुमत नहीं है" (और जवाब क्यों रुक जाते हैं)
  - H2: चैट में मॉडल स्विच करना (/model)
  - H2: CLI कमांड
  - H3: models list
  - H3: models status
  - H2: स्कैनिंग (OpenRouter मुफ़्त मॉडल)
  - H2: मॉडल रजिस्ट्री (models.json)
  - H2: संबंधित

## concepts/multi-agent.md

- रूट: /concepts/multi-agent
- शीर्षक:
  - H2: "एक एजेंट" क्या है?
  - H2: पथ (त्वरित मानचित्र)
  - H3: एकल-एजेंट मोड (डिफ़ॉल्ट)
  - H2: एजेंट हेल्पर
  - H2: त्वरित शुरुआत
  - H2: अनेक एजेंट = अनेक लोग, अनेक व्यक्तित्व
  - H2: क्रॉस-एजेंट QMD मेमरी खोज
  - H2: एक WhatsApp नंबर, अनेक लोग (DM विभाजन)
  - H2: रूटिंग नियम (संदेश एजेंट कैसे चुनते हैं)
  - H2: अनेक खाते / फ़ोन नंबर
  - H2: अवधारणाएँ
  - H2: प्लेटफ़ॉर्म उदाहरण
  - H2: सामान्य पैटर्न
  - H2: प्रति-एजेंट सैंडबॉक्स और टूल कॉन्फ़िगरेशन
  - H2: संबंधित

## concepts/oauth.md

- रूट: /concepts/oauth
- शीर्षक:
  - H2: टोकन सिंक (यह क्यों मौजूद है)
  - H2: स्टोरेज (टोकन कहाँ रहते हैं)
  - H2: Anthropic लेगेसी टोकन संगतता
  - H2: Anthropic Claude CLI माइग्रेशन
  - H2: OAuth एक्सचेंज (लॉगिन कैसे काम करता है)
  - H3: Anthropic setup-token
  - H3: OpenAI Codex (ChatGPT OAuth)
  - H2: रिफ़्रेश + समाप्ति
  - H2: अनेक खाते (प्रोफ़ाइल) + रूटिंग
  - H3: 1) पसंदीदा: अलग एजेंट
  - H3: 2) उन्नत: एक एजेंट में अनेक प्रोफ़ाइल
  - H2: संबंधित

## concepts/parallel-specialist-lanes.md

- रूट: /concepts/parallel-specialist-lanes
- शीर्षक:
  - H2: मूल सिद्धांत
  - H2: अनुशंसित रोलआउट
  - H3: चरण 1: लेन अनुबंध + पृष्ठभूमि में भारी काम
  - H3: चरण 2: प्राथमिकता और समवर्ती नियंत्रण
  - H3: चरण 3: समन्वयक / ट्रैफिक कंट्रोलर
  - H2: न्यूनतम लेन अनुबंध टेम्पलेट
  - H2: संबंधित

## concepts/personal-agent-benchmark-pack.md

- रूट: /concepts/personal-agent-benchmark-pack
- शीर्षक:
  - H2: परिदृश्य
  - H2: गोपनीयता मॉडल
  - H2: पैक का विस्तार

## concepts/presence.md

- रूट: /concepts/presence
- शीर्षक:
  - H2: उपस्थिति फ़ील्ड (क्या दिखाई देता है)
  - H2: उत्पादक (उपस्थिति कहाँ से आती है)
  - H3: 1) Gateway स्वयं प्रविष्टि
  - H3: 2) WebSocket कनेक्ट
  - H4: एकबारगी CLI कमांड क्यों दिखाई नहीं देते
  - H3: 3) सिस्टम-इवेंट बीकन
  - H3: 4) Node कनेक्ट करता है (भूमिका: node)
  - H2: मर्ज + डीडुप नियम (instanceId क्यों मायने रखता है)
  - H2: TTL और सीमित आकार
  - H2: रिमोट/टनल चेतावनी (loopback IP)
  - H2: उपभोक्ता
  - H3: macOS इंस्टेंस टैब
  - H2: डीबगिंग सुझाव
  - H2: संबंधित

## concepts/progress-drafts.md

- रूट: /concepts/progress-drafts
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: उपयोगकर्ता क्या देखते हैं
  - H2: मोड चुनें
  - H2: लेबल कॉन्फ़िगर करें
  - H2: प्रगति लाइनों को नियंत्रित करें
  - H2: चैनल व्यवहार
  - H2: अंतिम रूप देना
  - H2: समस्या निवारण
  - H2: संबंधित

## concepts/qa-e2e-automation.md

- रूट: /concepts/qa-e2e-automation
- शीर्षक:
  - H2: कमांड सतह
  - H2: ऑपरेटर प्रवाह
  - H2: लाइव ट्रांसपोर्ट कवरेज
  - H2: Telegram, Discord, Slack, और WhatsApp QA संदर्भ
  - H3: साझा CLI फ़्लैग
  - H3: Telegram QA
  - H3: Discord QA
  - H3: Slack QA
  - H4: Slack वर्कस्पेस सेट अप करना
  - H3: WhatsApp QA
  - H3: Convex क्रेडेंशियल पूल
  - H2: रेपो-समर्थित सीड
  - H2: प्रदाता मॉक लेन
  - H2: ट्रांसपोर्ट अडैप्टर
  - H3: चैनल जोड़ना
  - H3: परिदृश्य हेल्पर नाम
  - H2: रिपोर्टिंग
  - H2: संबंधित दस्तावेज़

## concepts/qa-matrix.md

- रूट: /concepts/qa-matrix
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: लेन क्या करती है
  - H2: CLI
  - H3: सामान्य फ़्लैग
  - H3: प्रदाता फ़्लैग
  - H2: प्रोफ़ाइल
  - H2: परिदृश्य
  - H2: पर्यावरण चर
  - H2: आउटपुट आर्टिफ़ैक्ट
  - H2: ट्रायेज सुझाव
  - H2: लाइव ट्रांसपोर्ट अनुबंध
  - H2: संबंधित

## concepts/queue-steering.md

- रूट: /concepts/queue-steering
- शीर्षक:
  - H2: रनटाइम सीमा
  - H2: मोड
  - H2: बर्स्ट उदाहरण
  - H2: दायरा
  - H2: डिबाउंस
  - H2: संबंधित

## concepts/queue.md

- रूट: /concepts/queue
- शीर्षक:
  - H2: क्यों
  - H2: यह कैसे काम करता है
  - H2: डिफ़ॉल्ट
  - H2: क्यू मोड
  - H2: क्यू विकल्प
  - H2: स्टीयर और स्ट्रीमिंग
  - H2: प्राथमिकता क्रम
  - H2: प्रति-सत्र ओवरराइड
  - H2: दायरा और गारंटी
  - H2: समस्या निवारण
  - H2: संबंधित

## concepts/retry.md

- रूट: /concepts/retry
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

- रूट: /concepts/session-pruning
- शीर्षक:
  - H2: यह क्यों मायने रखता है
  - H2: यह कैसे काम करता है
  - H2: लेगेसी इमेज सफ़ाई
  - H2: स्मार्ट डिफ़ॉल्ट
  - H2: सक्षम या अक्षम करें
  - H2: प्रूनिंग बनाम Compaction
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/session-tool.md

- रूट: /concepts/session-tool
- शीर्षक:
  - H2: उपलब्ध टूल
  - H2: सत्रों को सूचीबद्ध करना और पढ़ना
  - H2: क्रॉस-सत्र संदेश भेजना
  - H2: स्थिति और ऑर्केस्ट्रेशन हेल्पर
  - H2: उप-एजेंट स्पॉन करना
  - H2: दृश्यता
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/session.md

- रूट: /concepts/session
- शीर्षक:
  - H2: संदेश कैसे रूट किए जाते हैं
  - H2: DM अलगाव
  - H3: Dock लिंक किए गए चैनल
  - H2: सत्र जीवनचक्र
  - H2: स्थिति कहाँ रहती है
  - H2: सत्र रखरखाव
  - H2: सत्रों का निरीक्षण
  - H2: आगे पढ़ें
  - H2: संबंधित

## concepts/soul.md

- रूट: /concepts/soul
- शीर्षक:
  - H2: SOUL.md में क्या होना चाहिए
  - H2: यह क्यों काम करता है
  - H2: Molty प्रॉम्प्ट
  - H2: अच्छा कैसा दिखता है
  - H2: एक चेतावनी
  - H2: संबंधित

## concepts/streaming.md

- रूट: /concepts/streaming
- शीर्षक:
  - H2: ब्लॉक स्ट्रीमिंग (चैनल संदेश)
  - H3: ब्लॉक स्ट्रीमिंग के साथ मीडिया डिलीवरी
  - H2: चंकिंग एल्गोरिदम (निचली/ऊपरी सीमाएँ)
  - H2: कोअलेसिंग (स्ट्रीम किए गए ब्लॉक मर्ज करें)
  - H2: ब्लॉक के बीच मानव-जैसी गति
  - H2: "चंक स्ट्रीम करें या सब कुछ"
  - H2: प्रीव्यू स्ट्रीमिंग मोड
  - H3: चैनल मैपिंग
  - H3: रनटाइम व्यवहार
  - H3: टूल-प्रगति प्रीव्यू अपडेट
  - H3: टिप्पणी प्रगति लेन
  - H2: संबंधित

## concepts/system-prompt.md

- रूट: /concepts/system-prompt
- शीर्षक:
  - H2: संरचना
  - H2: प्रॉम्प्ट मोड
  - H2: प्रॉम्प्ट स्नैपशॉट
  - H2: वर्कस्पेस बूटस्ट्रैप इंजेक्शन
  - H2: समय प्रबंधन
  - H2: Skills
  - H2: दस्तावेज़ीकरण
  - H2: संबंधित

## concepts/timezone.md

- रूट: /concepts/timezone
- शीर्षक:
  - H2: तीन टाइमज़ोन सतहें
  - H2: उपयोगकर्ता टाइमज़ोन सेट करना
  - H2: कब ओवरराइड करें
  - H2: संबंधित

## concepts/typebox.md

- रूट: /concepts/typebox
- शीर्षक:
  - H2: मानसिक मॉडल (30 सेकंड)
  - H2: स्कीमा कहाँ रहते हैं
  - H2: वर्तमान पाइपलाइन
  - H2: रनटाइम पर स्कीमा कैसे उपयोग होते हैं
  - H2: उदाहरण फ़्रेम
  - H2: न्यूनतम क्लाइंट (Node.js)
  - H2: कार्य किया हुआ उदाहरण: एक मेथड शुरू से अंत तक जोड़ें
  - H2: Swift कोडजन व्यवहार
  - H2: वर्शनिंग + संगतता
  - H2: स्कीमा पैटर्न और परंपराएँ
  - H2: लाइव स्कीमा JSON
  - H2: जब आप स्कीमा बदलते हैं
  - H2: संबंधित

## concepts/typing-indicators.md

- रूट: /concepts/typing-indicators
- शीर्षक:
  - H2: डिफ़ॉल्ट
  - H2: मोड
  - H2: कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: संबंधित

## concepts/usage-tracking.md

- रूट: /concepts/usage-tracking
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

- रूट: /date-time
- शीर्षक:
  - H2: संदेश एनवेलप (डिफ़ॉल्ट रूप से स्थानीय)
  - H3: उदाहरण
  - H2: सिस्टम प्रॉम्प्ट: वर्तमान तारीख और समय
  - H2: सिस्टम इवेंट लाइनें (डिफ़ॉल्ट रूप से स्थानीय)
  - H3: उपयोगकर्ता टाइमज़ोन + फ़ॉर्मैट कॉन्फ़िगर करें
  - H2: समय फ़ॉर्मैट पहचान (ऑटो)
  - H2: टूल पेलोड + कनेक्टर (कच्चा प्रदाता समय + सामान्यीकृत फ़ील्ड)
  - H2: संबंधित दस्तावेज़

## debug/node-issue.md

- रूट: /debug/node-issue
- शीर्षक:
  - H1: Node + tsx "\\name is not a function" क्रैश
  - H2: सारांश
  - H2: पर्यावरण
  - H2: पुनरुत्पादन (केवल Node)
  - H2: रेपो में न्यूनतम पुनरुत्पादन
  - H2: Node वर्शन जाँच
  - H2: नोट्स / परिकल्पना
  - H2: रिग्रेशन इतिहास
  - H2: वर्कअराउंड
  - H2: संदर्भ
  - H2: अगले कदम
  - H2: संबंधित

## diagnostics/flags.md

- रूट: /diagnostics/flags
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: कॉन्फ़िग के ज़रिए सक्षम करें
  - H2: env ओवरराइड (एकबारगी)
  - H2: प्रोफ़ाइलिंग फ़्लैग
  - H2: टाइमलाइन आर्टिफ़ैक्ट
  - H2: लॉग कहाँ जाते हैं
  - H2: लॉग निकालें
  - H2: नोट्स
  - H2: संबंधित

## gateway/authentication.md

- रूट: /gateway/authentication
- शीर्षक:
  - H2: अनुशंसित सेटअप (API कुंजी, कोई भी प्रदाता)
  - H2: Anthropic: Claude CLI और टोकन संगतता
  - H2: Anthropic नोट
  - H2: मॉडल auth स्थिति जाँचना
  - H2: API कुंजी रोटेशन व्यवहार (gateway)
  - H2: gateway चलते समय प्रदाता auth हटाना
  - H2: कौन सा क्रेडेंशियल उपयोग हो, इसे नियंत्रित करना
  - H3: OpenAI और लेगेसी openai-codex id
  - H3: लॉगिन के दौरान (CLI)
  - H3: प्रति-सत्र (चैट कमांड)
  - H3: प्रति-एजेंट (CLI ओवरराइड)
  - H2: समस्या निवारण
  - H3: "कोई क्रेडेंशियल नहीं मिला"
  - H3: टोकन समाप्त होने वाला/समाप्त
  - H2: संबंधित

## gateway/background-process.md

- रूट: /gateway/background-process
- शीर्षक:
  - H2: exec टूल
  - H2: चाइल्ड प्रोसेस ब्रिजिंग
  - H2: process टूल
  - H2: उदाहरण
  - H2: संबंधित

## gateway/bonjour.md

- रूट: /gateway/bonjour
- शीर्षक:
  - H2: Tailscale पर वाइड-एरिया Bonjour (Unicast DNS-SD)
  - H3: Gateway कॉन्फ़िग (अनुशंसित)
  - H3: एकबारगी DNS सर्वर सेटअप (gateway होस्ट)
  - H3: Tailscale DNS सेटिंग्स
  - H3: Gateway लिसनर सुरक्षा (अनुशंसित)
  - H2: क्या विज्ञापित होता है
  - H2: सेवा प्रकार
  - H2: TXT कुंजियाँ (गैर-गुप्त संकेत)
  - H2: macOS पर डीबगिंग
  - H2: Gateway लॉग में डीबगिंग
  - H2: iOS node पर डीबगिंग
  - H2: Bonjour कब सक्षम करें
  - H2: Bonjour कब अक्षम करें
  - H2: Docker सावधानियाँ
  - H2: अक्षम Bonjour का समस्या निवारण
  - H2: सामान्य विफलता मोड
  - H2: एस्केप किए गए इंस्टेंस नाम (\032)
  - H2: सक्षम करना / अक्षम करना / कॉन्फ़िगरेशन
  - H2: संबंधित दस्तावेज़

## gateway/bridge-protocol.md

- रूट: /gateway/bridge-protocol
- शीर्षक:
  - H2: यह क्यों मौजूद था
  - H2: ट्रांसपोर्ट
  - H2: हैंडशेक + पेयरिंग
  - H2: फ़्रेम
  - H2: Exec जीवनचक्र इवेंट
  - H2: ऐतिहासिक tailnet उपयोग
  - H2: वर्शनिंग
  - H2: संबंधित

## gateway/cli-backends.md

- रूट: /gateway/cli-backends
- शीर्षक:
  - H2: शुरुआती लोगों के लिए त्वरित शुरुआत
  - H2: इसे फ़ॉलबैक के रूप में उपयोग करना
  - H2: कॉन्फ़िगरेशन अवलोकन
  - H3: उदाहरण कॉन्फ़िगरेशन
  - H2: यह कैसे काम करता है
  - H2: सत्र
  - H2: claude-cli सत्रों से फ़ॉलबैक प्रील्यूड
  - H2: इमेज (पास-थ्रू)
  - H2: इनपुट / आउटपुट
  - H2: डिफ़ॉल्ट (Plugin-स्वामित्व)
  - H2: Plugin-स्वामित्व वाले डिफ़ॉल्ट
  - H2: नेटिव compaction स्वामित्व
  - H2: MCP ओवरले बंडल करें
  - H2: इतिहास कैप फिर से सीड करें
  - H2: सीमाएँ
  - H2: समस्या निवारण
  - H2: संबंधित

## gateway/config-agents.md

- रूट: /gateway/config-agents
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
  - H3: टाइपिंग संकेतक
  - H3: agents.defaults.sandbox
  - H3: agents.list (प्रति-एजेंट ओवरराइड)
  - H2: मल्टी-एजेंट रूटिंग
  - H3: बाइंडिंग मैच फ़ील्ड
  - H3: प्रति-एजेंट एक्सेस प्रोफ़ाइल
  - H2: सत्र
  - H2: संदेश
  - H3: प्रतिक्रिया उपसर्ग
  - H3: Ack प्रतिक्रिया
  - H3: इनबाउंड डिबाउंस
  - H3: TTS (टेक्स्ट-टू-स्पीच)
  - H2: बात
  - H2: संबंधित

## gateway/config-channels.md

- रूट: /gateway/config-channels
- शीर्षक:
  - H2: चैनल
  - H3: DM और समूह एक्सेस
  - H3: चैनल मॉडल ओवरराइड
  - H3: चैनल डिफ़ॉल्ट और heartbeat
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
  - H4: सेल्फ-चैट मोड
  - H3: कमांड (चैट कमांड हैंडलिंग)
  - H2: संबंधित

## gateway/config-tools.md

- रूट: /gateway/config-tools
- शीर्षक:
  - H2: टूल्स
  - H3: टूल प्रोफ़ाइल
  - H3: टूल समूह
  - H3: सैंडबॉक्स टूल नीति के भीतर MCP और Plugin टूल्स
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
  - H3: न्यूनतम आवश्यक
  - H3: अनुशंसित स्टार्टर
  - H2: विस्तृत उदाहरण (मुख्य विकल्प)
  - H3: सिमलिंक किया गया सिबलिंग skill repo
  - H2: सामान्य पैटर्न
  - H3: एक ओवरराइड के साथ साझा skill baseline
  - H3: मल्टी-प्लेटफ़ॉर्म सेटअप
  - H3: विश्वसनीय Node नेटवर्क auto-approval
  - H3: सुरक्षित DM मोड (साझा इनबॉक्स / multi-user DMs)
  - H3: Anthropic API key + MiniMax fallback
  - H3: कार्य bot (restricted access)
  - H3: केवल स्थानीय मॉडल
  - H2: सुझाव
  - H2: संबंधित

## gateway/configuration-reference.md

- रूट: /gateway/configuration-reference
- शीर्षक:
  - H2: चैनल
  - H2: एजेंट डिफ़ॉल्ट, multi-agent, sessions, और messages
  - H2: टूल्स और कस्टम प्रदाता
  - H2: मॉडल
  - H2: MCP
  - H2: Skills
  - H2: Plugins
  - H3: Codex harness plugin config
  - H2: Commitments
  - H2: ब्राउज़र
  - H2: UI
  - H2: Gateway
  - H3: OpenAI-compatible endpoints
  - H3: Multi-instance isolation
  - H3: gateway.tls
  - H3: gateway.reload
  - H2: Hooks
  - H3: Gmail integration
  - H2: Canvas plugin host
  - H2: Discovery
  - H3: mDNS (Bonjour)
  - H3: Wide-area (DNS-SD)
  - H2: Environment
  - H3: env (inline env vars)
  - H3: Env var substitution
  - H2: Secrets
  - H3: SecretRef
  - H3: Supported credential surface
  - H3: Secret providers config
  - H2: Auth storage
  - H3: auth.cooldowns
  - H2: Logging
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
  - H2: Media model template variables
  - H2: Config includes ($include)
  - H2: संबंधित

## gateway/configuration.md

- रूट: /gateway/configuration
- शीर्षक:
  - H2: न्यूनतम कॉन्फ़िग
  - H2: कॉन्फ़िग संपादित करना
  - H2: सख्त वैलिडेशन
  - H2: सामान्य कार्य
  - H2: कॉन्फ़िग hot reload
  - H3: Reload मोड
  - H3: क्या hot-apply होता है बनाम किसे restart चाहिए
  - H3: Reload planning
  - H2: Config RPC (programmatic updates)
  - H2: Environment variables
  - H2: पूरा संदर्भ
  - H2: संबंधित

## gateway/diagnostics.md

- रूट: /gateway/diagnostics
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: चैट कमांड
  - H2: export में क्या शामिल है
  - H2: Privacy model
  - H2: Stability recorder
  - H2: उपयोगी विकल्प
  - H2: diagnostics अक्षम करें
  - H2: संबंधित

## gateway/discovery.md

- रूट: /gateway/discovery
- शीर्षक:
  - H2: शब्दावली
  - H2: हम direct और SSH दोनों क्यों रखते हैं
  - H2: Discovery inputs (clients कैसे जानें कि gateway कहाँ है)
  - H3: 1) Bonjour / DNS-SD discovery
  - H4: Service beacon details
  - H3: 2) Tailnet (cross-network)
  - H3: 3) Manual / SSH target
  - H2: Transport selection (client policy)
  - H2: Pairing + auth (direct transport)
  - H2: component के अनुसार ज़िम्मेदारियाँ
  - H2: संबंधित

## gateway/doctor.md

- रूट: /gateway/doctor
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: Headless और automation मोड
  - H2: Read-only lint mode
  - H2: यह क्या करता है (सारांश)
  - H2: Dreams UI backfill और reset
  - H2: विस्तृत व्यवहार और rationale
  - H2: संबंधित

## gateway/external-apps.md

- रूट: /gateway/external-apps
- शीर्षक:
  - H2: आज क्या उपलब्ध है
  - H2: अनुशंसित पथ
  - H2: App code बनाम plugin code
  - H2: संबंधित

## gateway/gateway-lock.md

- रूट: /gateway/gateway-lock
- शीर्षक:
  - H2: क्यों
  - H2: Mechanism
  - H2: Error surface
  - H2: Operational notes
  - H2: संबंधित

## gateway/health.md

- रूट: /gateway/health
- शीर्षक:
  - H2: त्वरित जाँचें
  - H2: गहन diagnostics
  - H2: Health monitor config
  - H2: Uptime monitoring
  - H3: Monitoring service setup examples
  - H2: जब कुछ विफल हो
  - H2: समर्पित "health" command
  - H2: संबंधित

## gateway/heartbeat.md

- रूट: /gateway/heartbeat
- शीर्षक:
  - H2: त्वरित शुरुआत (शुरुआती)
  - H2: डिफ़ॉल्ट
  - H2: Heartbeat prompt किसलिए है
  - H2: Response contract
  - H2: कॉन्फ़िग
  - H3: Scope और precedence
  - H3: Per-agent heartbeats
  - H3: Active hours example
  - H3: 24/7 setup
  - H3: Multi-account example
  - H3: Field notes
  - H2: Delivery behavior
  - H2: Visibility controls
  - H3: प्रत्येक flag क्या करता है
  - H3: Per-channel बनाम per-account examples
  - H3: Common patterns
  - H2: HEARTBEAT.md (optional)
  - H3: tasks: blocks
  - H3: क्या agent HEARTBEAT.md अपडेट कर सकता है?
  - H2: Manual wake (on-demand)
  - H2: Reasoning delivery (optional)
  - H2: Cost awareness
  - H2: heartbeat के बाद context overflow
  - H2: संबंधित

## gateway/index.md

- रूट: /gateway
- शीर्षक:
  - H2: 5-minute local startup
  - H2: Runtime model
  - H2: OpenAI-compatible endpoints
  - H3: Port और bind precedence
  - H3: Hot reload modes
  - H2: Operator command set
  - H2: Multiple gateways (same host)
  - H2: Remote access
  - H2: Supervision और service lifecycle
  - H2: Dev profile quick path
  - H2: Protocol quick reference (operator view)
  - H2: Operational checks
  - H3: Liveness
  - H3: Readiness
  - H3: Gap recovery
  - H2: Common failure signatures
  - H2: Safety guarantees
  - H2: संबंधित

## gateway/local-model-services.md

- रूट: /gateway/local-model-services
- शीर्षक:
  - H2: यह कैसे काम करता है
  - H2: Config shape
  - H2: Fields
  - H2: Inferrs example
  - H2: ds4 example
  - H2: Operational notes
  - H2: संबंधित

## gateway/local-models.md

- रूट: /gateway/local-models
- शीर्षक:
  - H2: Hardware floor
  - H2: backend चुनें
  - H2: अनुशंसित: LM Studio + बड़ा स्थानीय मॉडल (Responses API)
  - H3: Hybrid config: hosted primary, local fallback
  - H3: Local-first with hosted safety net
  - H3: Regional hosting / data routing
  - H2: अन्य OpenAI-compatible local proxies
  - H2: छोटे या अधिक सख्त backends
  - H2: Troubleshooting
  - H2: संबंधित

## gateway/logging.md

- रूट: /gateway/logging
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

- रूट: /gateway/multiple-gateways
- शीर्षक:
  - H2: सर्वोत्तम अनुशंसित सेटअप
  - H2: Rescue-Bot Quickstart
  - H2: यह क्यों काम करता है
  - H2: What --profile rescue onboard Changes
  - H2: सामान्य multi-gateway setup
  - H2: Isolation checklist
  - H2: Port mapping (derived)
  - H2: Browser/CDP notes (common footgun)
  - H2: Manual env example
  - H2: त्वरित जाँचें
  - H2: संबंधित

## gateway/network-model.md

- रूट: /gateway/network-model
- शीर्षक:
  - H2: संबंधित

## gateway/openai-http-api.md

- रूट: /gateway/openai-http-api
- शीर्षक:
  - H2: Authentication
  - H2: Security boundary (important)
  - H2: इस endpoint का उपयोग कब करें
  - H2: Agent-first model contract
  - H2: endpoint सक्षम करना
  - H2: endpoint अक्षम करना
  - H2: Session behavior
  - H2: यह surface क्यों महत्वपूर्ण है
  - H2: Model list और agent routing
  - H2: Streaming (SSE)
  - H2: Chat tool contract
  - H3: समर्थित request fields
  - H3: असमर्थित variants
  - H3: Non-streaming tool response shape
  - H3: Streaming tool response shape
  - H3: Tool follow-up loop
  - H2: Open WebUI quick setup
  - H2: Examples
  - H2: संबंधित

## gateway/openresponses-http-api.md

- रूट: /gateway/openresponses-http-api
- शीर्षक:
  - H2: Authentication, security, और routing
  - H2: Session behavior
  - H2: Request shape (supported)
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
  - H2: Examples
  - H2: संबंधित

## gateway/openshell.md

- रूट: /gateway/openshell
- शीर्षक:
  - H2: Prerequisites
  - H2: त्वरित शुरुआत
  - H2: Workspace modes
  - H3: mirror
  - H3: remote
  - H3: mode चुनना
  - H2: Configuration reference
  - H2: Examples
  - H3: Minimal remote setup
  - H3: Mirror mode with GPU
  - H3: custom gateway के साथ per-agent OpenShell
  - H2: Lifecycle management
  - H3: कब दोबारा बनाएँ
  - H2: Security hardening
  - H2: Current limitations
  - H2: यह कैसे काम करता है
  - H2: संबंधित

## gateway/opentelemetry.md

- रूट: /gateway/opentelemetry
- शीर्षक:
  - H2: यह साथ में कैसे फिट होता है
  - H2: त्वरित शुरुआत
  - H2: Signals exported
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
  - H2: exporter के बिना
  - H2: Disable
  - H2: संबंधित

## gateway/operator-scopes.md

- रूट: /gateway/operator-scopes
- शीर्षक:
  - H2: Roles
  - H2: Scope levels
  - H2: Method scope केवल पहला gate है
  - H2: Device pairing approvals
  - H2: Node pairing approvals
  - H2: Shared-secret auth

## gateway/pairing.md

- रूट: /gateway/pairing
- शीर्षक:
  - H2: Concepts
  - H2: pairing कैसे काम करता है
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

- रूट: /gateway/prometheus
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: Metrics exported
  - H2: Label policy
  - H2: PromQL recipes
  - H2: Prometheus और OpenTelemetry export के बीच चयन
  - H2: Troubleshooting
  - H2: संबंधित

## gateway/protocol.md

- रूट: /gateway/protocol
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
  - H1: Remote Gateway के साथ OpenClaw.app चलाना
  - H2: Overview
  - H2: त्वरित सेटअप
  - H3: Step 1: SSH Config जोड़ें
  - H3: Step 2: SSH Key कॉपी करें
  - H3: Step 3: Remote Gateway Auth कॉन्फ़िगर करें
  - H3: Step 4: SSH Tunnel शुरू करें
  - H3: Step 5: OpenClaw.app restart करें
  - H2: Login पर Auto-Start Tunnel
  - H3: PLIST file बनाएँ
  - H3: Launch Agent लोड करें
  - H2: Troubleshooting
  - H2: यह कैसे काम करता है
  - H2: संबंधित

## gateway/remote.md

- मार्ग: /gateway/remote
- शीर्षक:
  - H2: मूल विचार
  - H2: सामान्य VPN और tailnet सेटअप
  - H3: आपके tailnet में हमेशा चालू Gateway
  - H3: होम डेस्कटॉप Gateway चलाता है
  - H3: लैपटॉप Gateway चलाता है
  - H2: कमांड प्रवाह (क्या कहां चलता है)
  - H2: SSH टनल (CLI + टूल)
  - H2: CLI रिमोट डिफ़ॉल्ट
  - H2: क्रेडेंशियल प्राथमिकता
  - H2: चैट UI रिमोट एक्सेस
  - H2: macOS ऐप रिमोट मोड
  - H2: सुरक्षा नियम (रिमोट/VPN)
  - H3: macOS: LaunchAgent के जरिए स्थायी SSH टनल
  - H4: चरण 1: SSH कॉन्फ़िग जोड़ें
  - H4: चरण 2: SSH कुंजी कॉपी करें (एक बार)
  - H4: चरण 3: gateway टोकन कॉन्फ़िगर करें
  - H4: चरण 4: LaunchAgent बनाएं
  - H4: चरण 5: LaunchAgent लोड करें
  - H4: समस्या निवारण
  - H2: संबंधित

## gateway/sandbox-vs-tool-policy-vs-elevated.md

- मार्ग: /gateway/sandbox-vs-tool-policy-vs-elevated
- शीर्षक:
  - H2: त्वरित डीबग
  - H2: सैंडबॉक्स: टूल कहां चलते हैं
  - H3: Bind mounts (सुरक्षा त्वरित जांच)
  - H2: टूल नीति: कौन से टूल मौजूद हैं/कॉल किए जा सकते हैं
  - H3: टूल समूह (शॉर्टहैंड)
  - H2: उन्नत: केवल exec "होस्ट पर चलाएं"
  - H2: सामान्य "sandbox jail" सुधार
  - H3: "टूल X sandbox tool policy द्वारा अवरुद्ध"
  - H3: "मुझे लगा यह main था, फिर यह sandboxed क्यों है?"
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
  - H2: कस्टम bind mounts
  - H2: इमेज और सेटअप
  - H2: setupCommand (एक बार का कंटेनर सेटअप)
  - H2: टूल नीति और escape hatches
  - H2: मल्टी-एजेंट ओवरराइड
  - H2: न्यूनतम सक्षम उदाहरण
  - H2: संबंधित

## gateway/secrets-plan-contract.md

- मार्ग: /gateway/secrets-plan-contract
- शीर्षक:
  - H2: प्लान फ़ाइल का आकार
  - H2: प्रदाता upserts और deletes
  - H2: समर्थित लक्ष्य दायरा
  - H2: लक्ष्य प्रकार व्यवहार
  - H2: पथ सत्यापन नियम
  - H2: विफलता व्यवहार
  - H2: Exec प्रदाता सहमति व्यवहार
  - H2: रनटाइम और ऑडिट दायरा नोट्स
  - H2: ऑपरेटर जांच
  - H2: संबंधित दस्तावेज़

## gateway/secrets.md

- मार्ग: /gateway/secrets
- शीर्षक:
  - H2: लक्ष्य और रनटाइम मॉडल
  - H2: एजेंट-एक्सेस सीमा
  - H2: सक्रिय-सतह फ़िल्टरिंग
  - H2: Gateway प्रमाणीकरण सतह डायग्नोस्टिक्स
  - H2: ऑनबोर्डिंग संदर्भ प्रीफ्लाइट
  - H2: SecretRef अनुबंध
  - H2: प्रदाता कॉन्फ़िग
  - H2: फ़ाइल-समर्थित API कुंजियां
  - H2: Exec एकीकरण उदाहरण
  - H2: MCP सर्वर पर्यावरण चर
  - H2: Sandbox SSH प्रमाणीकरण सामग्री
  - H2: समर्थित क्रेडेंशियल सतह
  - H2: आवश्यक व्यवहार और प्राथमिकता
  - H2: सक्रियण ट्रिगर
  - H2: कमजोर और पुनर्प्राप्त सिग्नल
  - H2: कमांड-पथ समाधान
  - H2: ऑडिट और कॉन्फ़िगर वर्कफ़्लो
  - H2: एक-तरफ़ा सुरक्षा नीति
  - H2: लेगेसी प्रमाणीकरण संगतता नोट्स
  - H2: Web UI नोट
  - H2: संबंधित

## gateway/security/audit-checks.md

- मार्ग: /gateway/security/audit-checks
- शीर्षक:
  - H2: संबंधित

## gateway/security/exposure-runbook.md

- मार्ग: /gateway/security/exposure-runbook
- शीर्षक:
  - H2: एक्सपोज़र पैटर्न चुनें
  - H2: प्री-फ्लाइट इन्वेंटरी
  - H2: बेसलाइन जांच
  - H2: न्यूनतम सुरक्षित बेसलाइन
  - H2: DM और समूह एक्सपोज़र
  - H2: रिवर्स प्रॉक्सी जांच
  - H2: टूल और सैंडबॉक्स समीक्षा
  - H2: बदलाव के बाद सत्यापन
  - H2: रोलबैक प्लान
  - H2: समीक्षा चेकलिस्ट

## gateway/security/index.md

- मार्ग: /gateway/security
- शीर्षक:
  - H2: पहले दायरा: निजी सहायक सुरक्षा मॉडल
  - H2: त्वरित जांच: openclaw security audit
  - H3: प्रकाशित पैकेज dependency lock
  - H3: डिप्लॉयमेंट और होस्ट trust
  - H3: सुरक्षित फ़ाइल संचालन
  - H3: साझा Slack वर्कस्पेस: वास्तविक जोखिम
  - H3: कंपनी-साझा एजेंट: स्वीकार्य पैटर्न
  - H2: Gateway और node trust अवधारणा
  - H2: Trust boundary matrix
  - H2: डिज़ाइन के अनुसार कमजोरियां नहीं
  - H2: 60 सेकंड में कठोर बेसलाइन
  - H2: साझा इनबॉक्स त्वरित नियम
  - H2: संदर्भ दृश्यता मॉडल
  - H2: ऑडिट क्या जांचता है (उच्च स्तर)
  - H2: क्रेडेंशियल भंडारण मानचित्र
  - H2: सुरक्षा ऑडिट चेकलिस्ट
  - H2: सुरक्षा ऑडिट शब्दावली
  - H2: HTTP पर Control UI
  - H2: असुरक्षित या खतरनाक flags सारांश
  - H2: रिवर्स प्रॉक्सी कॉन्फ़िगरेशन
  - H2: HSTS और origin नोट्स
  - H2: स्थानीय session logs डिस्क पर रहते हैं
  - H2: Node निष्पादन (system.run)
  - H2: डायनेमिक Skills (watcher / remote nodes)
  - H2: खतरा मॉडल
  - H2: मूल अवधारणा: बुद्धिमत्ता से पहले एक्सेस नियंत्रण
  - H2: कमांड प्राधिकरण मॉडल
  - H2: Control plane tools जोखिम
  - H2: Plugins
  - H2: DM एक्सेस मॉडल: pairing, allowlist, open, disabled
  - H2: DM session isolation (multi-user mode)
  - H3: सुरक्षित DM मोड (अनुशंसित)
  - H2: DMs और समूहों के लिए allowlists
  - H2: Prompt injection (यह क्या है, क्यों महत्वपूर्ण है)
  - H2: बाहरी सामग्री special-token sanitization
  - H2: असुरक्षित बाहरी सामग्री bypass flags
  - H3: Prompt injection के लिए सार्वजनिक DMs आवश्यक नहीं
  - H3: स्व-होस्टेड LLM बैकएंड
  - H3: मॉडल क्षमता (सुरक्षा नोट)
  - H2: समूहों में reasoning और verbose output
  - H2: कॉन्फ़िगरेशन hardening उदाहरण
  - H3: फ़ाइल अनुमतियां
  - H3: नेटवर्क एक्सपोज़र (bind, port, firewall)
  - H3: UFW के साथ Docker port publishing
  - H3: mDNS/Bonjour discovery
  - H3: Gateway WebSocket लॉक डाउन करें (स्थानीय प्रमाणीकरण)
  - H3: Tailscale Serve identity headers
  - H3: node host के जरिए ब्राउज़र नियंत्रण (अनुशंसित)
  - H3: डिस्क पर secrets
  - H3: वर्कस्पेस .env फ़ाइलें
  - H3: Logs और transcripts (redaction और retention)
  - H3: DMs: डिफ़ॉल्ट रूप से pairing
  - H3: समूह: हर जगह उल्लेख आवश्यक
  - H3: अलग नंबर (WhatsApp, Signal, Telegram)
  - H3: केवल-पठन मोड (sandbox और tools के जरिए)
  - H3: सुरक्षित बेसलाइन (कॉपी/पेस्ट)
  - H2: Sandboxing (अनुशंसित)
  - H3: उप-एजेंट delegation guardrail
  - H2: ब्राउज़र नियंत्रण जोखिम
  - H3: ब्राउज़र SSRF नीति (डिफ़ॉल्ट रूप से सख्त)
  - H2: प्रति-एजेंट एक्सेस प्रोफ़ाइल (multi-agent)
  - H3: उदाहरण: पूर्ण एक्सेस (कोई sandbox नहीं)
  - H3: उदाहरण: केवल-पठन tools + केवल-पठन वर्कस्पेस
  - H3: उदाहरण: कोई filesystem/shell एक्सेस नहीं (provider messaging allowed)
  - H2: घटना प्रतिक्रिया
  - H3: सीमित करें
  - H3: रोटेट करें (यदि secrets लीक हुए हों तो compromise मानें)
  - H3: ऑडिट
  - H3: रिपोर्ट के लिए एकत्र करें
  - H2: Secret scanning
  - H2: सुरक्षा मुद्दों की रिपोर्टिंग

## gateway/security/secure-file-operations.md

- मार्ग: /gateway/security/secure-file-operations
- शीर्षक:
  - H2: डिफ़ॉल्ट: कोई Python helper नहीं
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
  - H2: प्रमाणीकरण
  - H2: कॉन्फ़िग उदाहरण
  - H3: केवल-tailnet (Serve)
  - H3: केवल-tailnet (Tailnet IP से bind करें)
  - H3: सार्वजनिक इंटरनेट (Funnel + साझा पासवर्ड)
  - H2: CLI उदाहरण
  - H2: नोट्स
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
  - H2: नीति + routing व्यवहार
  - H2: प्रतिक्रियाएं
  - H2: उदाहरण
  - H2: संबंधित

## gateway/troubleshooting.md

- मार्ग: /gateway/troubleshooting
- शीर्षक:
  - H2: कमांड सीढ़ी
  - H2: अपडेट के बाद
  - H2: split brain installs और newer config guard
  - H2: रोलबैक के बाद protocol mismatch
  - H2: path escape के रूप में Skill symlink छोड़ा गया
  - H2: लंबे संदर्भ के लिए Anthropic 429 अतिरिक्त उपयोग आवश्यक
  - H2: upstream 403 blocked responses
  - H2: स्थानीय OpenAI-compatible backend सीधे probes पास करता है लेकिन agent runs विफल होते हैं
  - H2: कोई उत्तर नहीं
  - H2: Dashboard control UI connectivity
  - H3: Auth detail codes quick map
  - H2: Gateway service नहीं चल रही
  - H2: macOS gateway चुपचाप जवाब देना बंद करता है, फिर dashboard छूने पर फिर शुरू होता है
  - H2: अधिक मेमोरी उपयोग के दौरान Gateway exits
  - H2: Gateway ने अमान्य config अस्वीकार किया
  - H2: Gateway probe warnings
  - H2: Channel connected, messages not flowing
  - H2: Cron और Heartbeat delivery
  - H2: Node paired, tool fails
  - H2: Browser tool fails
  - H2: यदि आपने अपग्रेड किया और कुछ अचानक टूट गया
  - H2: संबंधित

## gateway/trusted-proxy-auth.md

- मार्ग: /gateway/trusted-proxy-auth
- शीर्षक:
  - H2: कब उपयोग करें
  - H2: कब उपयोग न करें
  - H2: यह कैसे काम करता है
  - H2: Control UI pairing behavior
  - H2: कॉन्फ़िगरेशन
  - H3: कॉन्फ़िगरेशन संदर्भ
  - H2: TLS termination और HSTS
  - H3: रोलआउट मार्गदर्शन
  - H2: Proxy setup examples
  - H2: Mixed token configuration
  - H2: Operator scopes header
  - H2: सुरक्षा चेकलिस्ट
  - H2: सुरक्षा ऑडिट
  - H2: समस्या निवारण
  - H2: token auth से migration
  - H2: संबंधित

## help/debugging.md

- मार्ग: /help/debugging
- शीर्षक:
  - H2: Runtime debug overrides
  - H2: Session trace output
  - H2: Plugin lifecycle trace
  - H2: CLI startup and command profiling
  - H2: Gateway watch mode
  - H2: Dev profile + dev gateway (--dev)
  - H2: Raw stream logging (OpenClaw)
  - H2: Raw OpenAI-compatible chunk logging
  - H2: सुरक्षा नोट्स
  - H2: VSCode में डीबगिंग
  - H3: सेटअप
  - H3: नोट्स
  - H2: संबंधित

## help/environment.md

- मार्ग: /help/environment
- शीर्षक:
  - H2: प्राथमिकता (सबसे अधिक → सबसे कम)
  - H2: प्रदाता क्रेडेंशियल और वर्कस्पेस .env
  - H2: Config env block
  - H2: Shell env import
  - H2: Exec shell snapshots
  - H2: Runtime-injected env vars
  - H2: UI env vars
  - H2: Config में env var substitution
  - H2: Secret refs बनाम ${ENV} strings
  - H2: Path-related env vars
  - H2: Logging
  - H3: OPENCLAWHOME
  - H2: nvm users: webfetch TLS failures
  - H2: Legacy environment variables
  - H2: संबंधित

## help/faq-first-run.md

- मार्ग: /help/faq-first-run
- शीर्षक:
  - H2: त्वरित शुरुआत और पहली बार सेटअप
  - H2: संबंधित

## help/faq-models.md

- मार्ग: /help/faq-models
- शीर्षक:
  - H2: मॉडल: defaults, selection, aliases, switching
  - H2: Model failover और "All models failed"
  - H2: Auth profiles: वे क्या हैं और उन्हें कैसे प्रबंधित करें
  - H2: संबंधित

## help/faq.md

- मार्ग: /help/faq
- शीर्षक:
  - H2: यदि कुछ टूटा हो तो पहले 60 सेकंड
  - H2: त्वरित शुरुआत और पहली बार सेटअप
  - H2: OpenClaw क्या है?
  - H2: Skills और automation
  - H2: Sandboxing और memory
  - H2: चीज़ें डिस्क पर कहां रहती हैं
  - H2: Config basics
  - H2: Remote gateways और nodes
  - H2: Env vars और .env loading
  - H2: Sessions और multiple chats
  - H2: Models, failover, और auth profiles
  - H2: Gateway: ports, "already running", और remote mode
  - H2: Logging और debugging
  - H2: Media और attachments
  - H2: Security और access control
  - H2: Chat commands, aborting tasks, और "it will not stop"
  - H2: विविध
  - H2: संबंधित

## help/index.md

- मार्ग: /help
- शीर्षक:
  - H2: FAQ
  - H2: Diagnostics
  - H2: Testing
  - H2: Community और meta

## help/scripts.md

- मार्ग: /help/scripts
- शीर्षक:
  - H2: Conventions
  - H2: Auth monitoring scripts
  - H2: GitHub read helper
  - H2: Scripts जोड़ते समय
  - H2: संबंधित

## help/testing-live.md

- मार्ग: /help/testing-live
- शीर्षक:
  - H2: लाइव: स्थानीय स्मोक कमांड
  - H2: लाइव: Android Node क्षमता स्वीप
  - H2: लाइव: मॉडल स्मोक (प्रोफ़ाइल कुंजियाँ)
  - H3: परत 1: प्रत्यक्ष मॉडल पूर्णता (बिना Gateway)
  - H3: परत 2: Gateway + dev एजेंट स्मोक ("@openclaw" वास्तव में क्या करता है)
  - H2: लाइव: CLI बैकएंड स्मोक (Claude, Gemini, या अन्य स्थानीय CLIs)
  - H2: लाइव: APNs HTTP/2 प्रॉक्सी पहुंच-योग्यता
  - H2: लाइव: ACP बाइंड स्मोक (/acp spawn ... --bind here)
  - H2: लाइव: Codex ऐप-सर्वर हार्नेस स्मोक
  - H3: अनुशंसित लाइव रेसिपी
  - H2: लाइव: मॉडल मैट्रिक्स (हम क्या कवर करते हैं)
  - H3: आधुनिक स्मोक सेट (टूल कॉलिंग + इमेज)
  - H3: बेसलाइन: टूल कॉलिंग (Read + वैकल्पिक Exec)
  - H3: विज़न: इमेज भेजना (अटैचमेंट → मल्टीमॉडल संदेश)
  - H3: एग्रीगेटर / वैकल्पिक Gateway
  - H2: क्रेडेंशियल (कभी कमिट न करें)
  - H2: Deepgram लाइव (ऑडियो ट्रांसक्रिप्शन)
  - H2: BytePlus कोडिंग प्लान लाइव
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
  - H2: विकास के दौरान स्थानीय प्रमाण
  - H2: Docker लेन
  - H2: पैकेज स्वीकृति
  - H2: रिलीज़ डिफ़ॉल्ट
  - H2: लेगेसी संगतता
  - H2: कवरेज जोड़ना
  - H2: विफलता ट्रायेज

## help/testing.md

- मार्ग: /help/testing
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: टेस्ट अस्थायी डायरेक्टरी
  - H2: QA-विशिष्ट रनर
  - H3: Convex के माध्यम से साझा Telegram क्रेडेंशियल (v1)
  - H3: QA में चैनल जोड़ना
  - H2: टेस्ट सूट (क्या कहाँ चलता है)
  - H3: यूनिट / इंटीग्रेशन (डिफ़ॉल्ट)
  - H3: स्थिरता (Gateway)
  - H3: E2E (रेपो एग्रीगेट)
  - H3: E2E (Gateway स्मोक)
  - H3: E2E (Control UI मॉक्ड ब्राउज़र)
  - H3: E2E: OpenShell बैकएंड स्मोक
  - H3: लाइव (वास्तविक प्रोवाइडर + वास्तविक मॉडल)
  - H2: मुझे कौन-सा सूट चलाना चाहिए?
  - H2: लाइव (नेटवर्क को छूने वाले) टेस्ट
  - H2: Docker रनर (वैकल्पिक "Linux में काम करता है" जांच)
  - H2: डॉक्स सैनिटी
  - H2: ऑफ़लाइन रिग्रेशन (CI-सुरक्षित)
  - H2: एजेंट विश्वसनीयता मूल्यांकन (Skills)
  - H2: कॉन्ट्रैक्ट टेस्ट (plugin और चैनल आकार)
  - H3: कमांड
  - H3: चैनल कॉन्ट्रैक्ट
  - H3: प्रोवाइडर स्थिति कॉन्ट्रैक्ट
  - H3: प्रोवाइडर कॉन्ट्रैक्ट
  - H3: कब चलाएँ
  - H2: रिग्रेशन जोड़ना (मार्गदर्शन)
  - H2: संबंधित

## help/troubleshooting.md

- मार्ग: /help/troubleshooting
- शीर्षक:
  - H2: पहले 60 सेकंड
  - H2: असिस्टेंट सीमित लगता है या टूल गायब हैं
  - H2: Anthropic लंबा कॉन्टेक्स्ट 429
  - H2: स्थानीय OpenAI-संगत बैकएंड सीधे काम करता है लेकिन OpenClaw में विफल होता है
  - H2: Plugin इंस्टॉल गायब openclaw extensions के साथ विफल होता है
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
  - H2: त्वरित शुरुआत
  - H2: डैशबोर्ड
  - H2: कॉन्फ़िगरेशन (वैकल्पिक)
  - H2: यहाँ से शुरू करें
  - H2: और जानें

## install/ansible.md

- मार्ग: /install/ansible
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: आपको क्या मिलता है
  - H2: त्वरित शुरुआत
  - H2: क्या इंस्टॉल होता है
  - H2: इंस्टॉल के बाद सेटअप
  - H3: त्वरित कमांड
  - H2: सुरक्षा आर्किटेक्चर
  - H2: मैन्युअल इंस्टॉलेशन
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
  - H3: Web UI और पेयरिंग
  - H3: सेटअप और रखरखाव
  - H3: यूटिलिटी
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
  - H2: वर्तमान स्थिति जांचना
  - H2: टैगिंग सर्वोत्तम अभ्यास
  - H2: macOS ऐप उपलब्धता
  - H2: संबंधित

## install/digitalocean.md

- मार्ग: /install/digitalocean
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: सेटअप
  - H2: परसिस्टेंस और बैकअप
  - H2: 1 GB RAM सुझाव
  - H2: समस्या निवारण
  - H2: अगले चरण
  - H2: संबंधित

## install/docker-vm-runtime.md

- मार्ग: /install/docker-vm-runtime
- शीर्षक:
  - H2: आवश्यक बाइनरी इमेज में बेक करें
  - H2: बिल्ड और लॉन्च
  - H2: क्या कहाँ परसिस्ट रहता है
  - H2: अपडेट
  - H2: संबंधित

## install/docker.md

- मार्ग: /install/docker
- शीर्षक:
  - H2: क्या Docker मेरे लिए सही है?
  - H2: पूर्वापेक्षाएँ
  - H2: कंटेनरीकृत Gateway
  - H3: मैन्युअल फ़्लो
  - H3: एनवायरनमेंट वैरिएबल
  - H3: ऑब्ज़र्वेबिलिटी
  - H3: हेल्थ चेक
  - H3: LAN बनाम loopback
  - H3: होस्ट स्थानीय प्रोवाइडर
  - H3: Docker में Claude CLI बैकएंड
  - H3: Bonjour / mDNS
  - H3: स्टोरेज और परसिस्टेंस
  - H3: शेल हेल्पर (वैकल्पिक)
  - H3: VPS पर चला रहे हैं?
  - H2: एजेंट सैंडबॉक्स
  - H3: त्वरित सक्षम करें
  - H2: समस्या निवारण
  - H2: संबंधित

## install/exe-dev.md

- मार्ग: /install/exe-dev
- शीर्षक:
  - H2: शुरुआती त्वरित पथ
  - H2: आपको क्या चाहिए
  - H2: Shelley के साथ स्वचालित इंस्टॉल
  - H2: मैन्युअल इंस्टॉलेशन
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
  - H2: शुरुआती त्वरित पथ
  - H2: समस्या निवारण
  - H3: "ऐप अपेक्षित पते पर नहीं सुन रहा है"
  - H3: हेल्थ चेक विफल / कनेक्शन अस्वीकार
  - H3: OOM / मेमोरी समस्याएँ
  - H3: Gateway लॉक समस्याएँ
  - H3: कॉन्फ़िग पढ़ा नहीं जा रहा
  - H3: SSH के माध्यम से कॉन्फ़िग लिखना
  - H3: स्टेट परसिस्ट नहीं हो रहा
  - H2: अपडेट
  - H3: मशीन कमांड अपडेट करना
  - H2: निजी डिप्लॉयमेंट (कठोर)
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

- मार्ग: /install/gcp
- शीर्षक:
  - H2: हम क्या कर रहे हैं (सरल शब्दों में)?
  - H2: त्वरित पथ (अनुभवी ऑपरेटर)
  - H2: आपको क्या चाहिए
  - H2: समस्या निवारण
  - H2: सर्विस अकाउंट (सुरक्षा सर्वोत्तम अभ्यास)
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
  - H3: स्थानीय प्रीफ़िक्स इंस्टॉलर (install-cli.sh)
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
  - H2: त्वरित शुरुआत
  - H2: Kind के साथ स्थानीय परीक्षण
  - H2: चरण दर चरण
  - H3: 1) डिप्लॉय करें
  - H3: 2) Gateway एक्सेस करें
  - H2: क्या डिप्लॉय होता है
  - H2: कस्टमाइज़ेशन
  - H3: एजेंट निर्देश
  - H3: Gateway कॉन्फ़िग
  - H3: प्रोवाइडर जोड़ें
  - H3: कस्टम नेमस्पेस
  - H3: कस्टम इमेज
  - H3: पोर्ट-फ़ॉरवर्ड से आगे एक्सपोज़ करें
  - H2: फिर से डिप्लॉय करें
  - H2: टियरडाउन
  - H2: आर्किटेक्चर नोट्स
  - H2: फ़ाइल संरचना
  - H2: संबंधित

## install/macos-vm.md

- मार्ग: /install/macos-vm
- शीर्षक:
  - H2: अनुशंसित डिफ़ॉल्ट (अधिकांश उपयोगकर्ता)
  - H2: macOS VM विकल्प
  - H3: आपके Apple Silicon Mac पर स्थानीय VM (Lume)
  - H3: होस्टेड Mac प्रोवाइडर (क्लाउड)
  - H2: त्वरित पथ (Lume, अनुभवी उपयोगकर्ता)
  - H2: आपको क्या चाहिए (Lume)
  - H2: 1) Lume इंस्टॉल करें
  - H2: 2) macOS VM बनाएँ
  - H2: 3) Setup Assistant पूरा करें
  - H2: 4) VM IP पता प्राप्त करें
  - H2: 5) VM में SSH करें
  - H2: 6) OpenClaw इंस्टॉल करें
  - H2: 7) चैनल कॉन्फ़िगर करें
  - H2: 8) VM को headless चलाएँ
  - H2: बोनस: iMessage इंटीग्रेशन
  - H2: गोल्डन इमेज सेव करें
  - H2: 24/7 चलाना
  - H2: समस्या निवारण
  - H2: संबंधित डॉक्स

## install/migrating-claude.md

- मार्ग: /install/migrating-claude
- शीर्षक:
  - H2: इम्पोर्ट करने के दो तरीके
  - H2: क्या इम्पोर्ट होता है
  - H2: क्या केवल आर्काइव रहता है
  - H2: स्रोत चयन
  - H2: अनुशंसित फ़्लो
  - H2: कॉन्फ़्लिक्ट संभालना
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
  - H2: कॉन्फ़्लिक्ट संभालना
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
  - H3: सामान्य समस्याएँ
  - H3: सत्यापन चेकलिस्ट
  - H2: किसी plugin को उसी स्थान पर अपग्रेड करें
  - H2: संबंधित

## install/nix.md

- मार्ग: /install/nix
- शीर्षक:
  - H2: आपको क्या मिलता है
  - H2: त्वरित शुरुआत
  - H2: Nix-मोड रनटाइम व्यवहार
  - H3: Nix मोड में क्या बदलता है
  - H3: कॉन्फ़िग और स्टेट पथ
  - H3: सर्विस PATH खोज
  - H2: संबंधित

## install/node.md

- मार्ग: /install/node
- शीर्षक:
  - H2: अपना संस्करण जांचें
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
  - H2: परसिस्टेंस और बैकअप
  - H2: फ़ॉलबैक: SSH टनल
  - H2: समस्या निवारण
  - H2: अगले चरण
  - H2: संबंधित

## install/podman.md

- मार्ग: /install/podman
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: त्वरित शुरुआत
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
  - H3: वैरिएबल
  - H2: चैनल कनेक्ट करें
  - H2: बैकअप और माइग्रेशन
  - H2: अगले चरण

## install/raspberry-pi.md

- रूट: /install/raspberry-pi
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

- रूट: /install/render
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
  - H3: सेवा शुरू नहीं होगी
  - H3: धीमे कोल्ड स्टार्ट (मुफ्त टियर)
  - H3: रीडिप्लॉय के बाद डेटा हानि
  - H3: Health check विफलताएँ
  - H2: अगले चरण

## install/uninstall.md

- रूट: /install/uninstall
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

- रूट: /install/updating
- शीर्षक:
  - H2: अनुशंसित: openclaw update
  - H2: npm और git इंस्टॉल के बीच स्विच करें
  - H2: विकल्प: इंस्टॉलर फिर से चलाएँ
  - H2: विकल्प: मैनुअल npm, pnpm, या bun
  - H3: उन्नत npm इंस्टॉल विषय
  - H2: Auto-updater
  - H2: अपडेट करने के बाद
  - H3: doctor चलाएँ
  - H3: gateway को पुनरारंभ करें
  - H3: सत्यापित करें
  - H2: रोलबैक
  - H3: किसी संस्करण को पिन करें (npm)
  - H3: किसी कमिट को पिन करें (स्रोत)
  - H2: यदि आप अटक गए हैं
  - H2: संबंधित

## install/upstash.md

- रूट: /install/upstash
- शीर्षक:
  - H2: पूर्वापेक्षाएँ
  - H2: Box बनाएँ
  - H2: SSH टनल के साथ कनेक्ट करें
  - H2: OpenClaw इंस्टॉल करें
  - H2: ऑनबोर्डिंग चलाएँ
  - H2: Gateway शुरू करें
  - H2: Auto-restart
  - H2: समस्या निवारण
  - H2: संबंधित

## logging.md

- रूट: /logging
- शीर्षक:
  - H2: लॉग कहाँ रहते हैं
  - H2: लॉग कैसे पढ़ें
  - H3: CLI: लाइव tail (अनुशंसित)
  - H3: Control UI (वेब)
  - H3: केवल-चैनल लॉग
  - H2: लॉग प्रारूप
  - H3: फ़ाइल लॉग (JSONL)
  - H3: Console आउटपुट
  - H3: Gateway WebSocket लॉग
  - H2: लॉगिंग कॉन्फ़िगर करना
  - H3: लॉग स्तर
  - H3: लक्षित मॉडल ट्रांसपोर्ट डायग्नॉस्टिक्स
  - H3: ट्रेस सहसंबंध
  - H3: मॉडल कॉल आकार और समय
  - H3: Console शैलियाँ
  - H3: रिडैक्शन
  - H2: डायग्नॉस्टिक्स और OpenTelemetry
  - H2: समस्या निवारण सुझाव
  - H2: संबंधित

## maturity/scorecard.md

- रूट: /maturity/scorecard
- शीर्षक:
  - H1: परिपक्वता स्कोरकार्ड
  - H2: यह पेज किस लिए है
  - H2: एक नज़र में
  - H2: स्कोर बैंड
  - H2: Surface explorer
  - H2: QA साक्ष्य सारांश
  - H3: क्षेत्र के अनुसार तैयारी

## maturity/taxonomy.md

- रूट: /maturity/taxonomy
- शीर्षक:
  - H1: परिपक्वता टैक्सोनॉमी
  - H2: यह पेज कैसे पढ़ें
  - H2: परिपक्वता स्तर
  - H2: उत्पाद क्षेत्र
  - H2: विवरण
  - H3: Core
  - H3: Platform
  - H3: Channel
  - H3: Provider और टूल

## network.md

- रूट: /network
- शीर्षक:
  - H2: Core मॉडल
  - H2: पेयरिंग + पहचान
  - H2: डिस्कवरी + ट्रांसपोर्ट
  - H2: Nodes + ट्रांसपोर्ट
  - H2: सुरक्षा
  - H2: संबंधित

## nodes/audio.md

- रूट: /nodes/audio
- शीर्षक:
  - H2: क्या काम करता है
  - H2: Auto-detection (डिफ़ॉल्ट)
  - H2: कॉन्फ़िग उदाहरण
  - H3: Provider + CLI fallback (OpenAI + Whisper CLI)
  - H3: Scope gating के साथ केवल-Provider
  - H3: केवल-Provider (Deepgram)
  - H3: केवल-Provider (Mistral Voxtral)
  - H3: केवल-Provider (SenseAudio)
  - H3: ट्रांसक्रिप्ट को चैट में echo करें (opt-in)
  - H2: नोट्स और सीमाएँ
  - H3: Proxy environment समर्थन
  - H2: समूहों में मेंशन पहचान
  - H2: सावधानियाँ
  - H2: संबंधित

## nodes/camera.md

- रूट: /nodes/camera
- शीर्षक:
  - H2: iOS node
  - H3: उपयोगकर्ता सेटिंग (डिफ़ॉल्ट रूप से चालू)
  - H3: कमांड (Gateway node.invoke के माध्यम से)
  - H3: Foreground आवश्यकता
  - H3: CLI helper
  - H2: Android node
  - H3: Android उपयोगकर्ता सेटिंग (डिफ़ॉल्ट रूप से चालू)
  - H3: अनुमतियाँ
  - H3: Android foreground आवश्यकता
  - H3: Android कमांड (Gateway node.invoke के माध्यम से)
  - H3: Payload guard
  - H2: macOS ऐप
  - H3: उपयोगकर्ता सेटिंग (डिफ़ॉल्ट रूप से बंद)
  - H3: CLI helper (node invoke)
  - H2: सुरक्षा + व्यावहारिक सीमाएँ
  - H2: macOS स्क्रीन वीडियो (OS-स्तर)
  - H2: संबंधित

## nodes/images.md

- रूट: /nodes/images
- शीर्षक:
  - H2: लक्ष्य
  - H2: CLI Surface
  - H2: WhatsApp Web चैनल व्यवहार
  - H2: Auto-Reply Pipeline
  - H2: Inbound Media To Commands
  - H2: सीमाएँ और त्रुटियाँ
  - H2: परीक्षणों के लिए नोट्स
  - H2: संबंधित

## nodes/index.md

- रूट: /nodes
- शीर्षक:
  - H2: पेयरिंग + स्थिति
  - H2: रिमोट node host (system.run)
  - H3: क्या कहाँ चलता है
  - H3: node host शुरू करें (foreground)
  - H3: SSH टनल के माध्यम से रिमोट gateway (loopback bind)
  - H3: node host शुरू करें (सेवा)
  - H3: पेयर + नाम
  - H3: कमांड को allowlist करें
  - H3: exec को node पर पॉइंट करें
  - H2: कमांड invoke करना
  - H2: कमांड नीति
  - H2: कॉन्फ़िग (openclaw.json)
  - H2: स्क्रीनशॉट (canvas snapshots)
  - H3: Canvas controls
  - H3: A2UI (Canvas)
  - H2: फ़ोटो + वीडियो (node camera)
  - H2: स्क्रीन रिकॉर्डिंग (nodes)
  - H2: स्थान (nodes)
  - H2: SMS (Android nodes)
  - H2: Android डिवाइस + निजी डेटा कमांड
  - H2: सिस्टम कमांड (node host / mac node)
  - H2: Exec node binding
  - H2: अनुमतियों का मानचित्र
  - H2: Headless node host (cross-platform)
  - H2: Mac node mode

## nodes/location-command.md

- रूट: /nodes/location-command
- शीर्षक:
  - H2: TL;DR
  - H2: selector क्यों (सिर्फ़ switch नहीं)
  - H2: सेटिंग्स मॉडल
  - H2: अनुमतियों की मैपिंग (node.permissions)
  - H2: कमांड: location.get
  - H2: पृष्ठभूमि व्यवहार
  - H2: मॉडल/टूलिंग इंटीग्रेशन
  - H2: UX कॉपी (सुझाई गई)
  - H2: संबंधित

## nodes/media-understanding.md

- रूट: /nodes/media-understanding
- शीर्षक:
  - H2: लक्ष्य
  - H2: उच्च-स्तरीय व्यवहार
  - H2: कॉन्फ़िग अवलोकन
  - H3: मॉडल प्रविष्टियाँ
  - H3: Provider credentials (apiKey)
  - H2: डिफ़ॉल्ट और सीमाएँ
  - H3: मीडिया समझ को auto-detect करें (डिफ़ॉल्ट)
  - H3: Proxy environment समर्थन (provider मॉडल)
  - H2: क्षमताएँ (वैकल्पिक)
  - H2: Provider support matrix (OpenClaw integrations)
  - H2: मॉडल चयन मार्गदर्शन
  - H2: Attachment policy
  - H2: कॉन्फ़िग उदाहरण
  - H2: स्थिति आउटपुट
  - H2: नोट्स
  - H2: संबंधित

## nodes/talk.md

- रूट: /nodes/talk
- शीर्षक:
  - H2: व्यवहार (macOS)
  - H2: उत्तरों में voice directives
  - H2: कॉन्फ़िग (/.openclaw/openclaw.json)
  - H2: macOS UI
  - H2: Android UI
  - H2: नोट्स
  - H2: संबंधित

## nodes/troubleshooting.md

- रूट: /nodes/troubleshooting
- शीर्षक:
  - H2: कमांड ladder
  - H2: Foreground आवश्यकताएँ
  - H2: अनुमतियाँ matrix
  - H2: पेयरिंग बनाम अनुमोदन
  - H2: सामान्य node त्रुटि कोड
  - H2: तेज़ रिकवरी loop
  - H2: संबंधित

## nodes/voicewake.md

- रूट: /nodes/voicewake
- शीर्षक:
  - H2: स्टोरेज (Gateway host)
  - H2: प्रोटोकॉल
  - H3: मेथड
  - H3: रूटिंग मेथड (trigger → target)
  - H3: इवेंट
  - H2: क्लाइंट व्यवहार
  - H3: macOS ऐप
  - H3: iOS node
  - H3: Android node
  - H2: संबंधित

## openclaw-agent-runtime.md

- रूट: /openclaw-agent-runtime
- शीर्षक:
  - H2: Type checking और linting
  - H2: Agent Runtime Tests चलाना
  - H2: मैनुअल परीक्षण
  - H2: Clean slate reset
  - H2: संदर्भ
  - H2: संबंधित

## perplexity.md

- रूट: /perplexity
- शीर्षक:
  - H2: संबंधित

## plan/codex-context-engine-harness.md

- रूट: /plan/codex-context-engine-harness
- शीर्षक:
  - H2: स्थिति
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: मौजूदा आर्किटेक्चर
  - H2: मौजूदा अंतर
  - H2: वांछित व्यवहार
  - H2: डिज़ाइन बाधाएँ
  - H3: Codex app-server मूल thread state के लिए canonical रहता है
  - H3: Context engine assembly को Codex inputs में प्रोजेक्ट किया जाना चाहिए
  - H3: Prompt-cache stability मायने रखती है
  - H3: Runtime selection semantics नहीं बदलते
  - H2: कार्यान्वयन योजना
  - H3: 1. पुन: उपयोग योग्य context-engine attempt helpers निर्यात या स्थानांतरित करें
  - H3: 2. Codex context projection helper जोड़ें
  - H3: 3. Codex thread startup से पहले bootstrap वायर करें
  - H3: 4. thread/start / thread/resume और turn/start से पहले assemble वायर करें
  - H3: 5. prompt-cache stable formatting सुरक्षित रखें
  - H3: 6. transcript mirroring के बाद post-turn वायर करें
  - H3: 7. usage और prompt-cache runtime context को normalize करें
  - H3: 8. Compaction नीति
  - H4: /compact और explicit OpenClaw compaction
  - H4: In-turn Codex native contextCompaction events
  - H3: 9. Session reset और binding behavior
  - H3: 10. Error handling
  - H2: परीक्षण योजना
  - H3: Unit tests
  - H3: अपडेट करने के लिए मौजूदा परीक्षण
  - H3: Integration / live tests
  - H2: Observability
  - H2: Migration / compatibility
  - H2: खुले प्रश्न
  - H2: स्वीकृति मानदंड

## plan/ui-channels.md

- रूट: /plan/ui-channels
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
  - H2: परीक्षण
  - H2: खुले प्रश्न
  - H2: संबंधित

## platforms/android.md

- रूट: /platforms/android
- शीर्षक:
  - H2: समर्थन snapshot
  - H2: सिस्टम नियंत्रण
  - H2: कनेक्शन रनबुक
  - H3: पूर्वापेक्षाएँ
  - H3: 1) Gateway शुरू करें
  - H3: 2) डिस्कवरी सत्यापित करें (वैकल्पिक)
  - H4: Tailnet (Vienna ⇄ London) discovery via unicast DNS-SD
  - H3: 3) Android से कनेक्ट करें
  - H3: Presence alive beacons
  - H3: 4) पेयरिंग अनुमोदित करें (CLI)
  - H3: 5) सत्यापित करें कि node कनेक्ट है
  - H3: 6) चैट + इतिहास
  - H3: 7) Canvas + camera
  - H4: Gateway Canvas Host (वेब सामग्री के लिए अनुशंसित)
  - H3: 8) Voice + विस्तारित Android command surface
  - H2: Assistant entrypoints
  - H2: Notification forwarding
  - H2: संबंधित

## platforms/digitalocean.md

- रूट: /platforms/digitalocean
- शीर्षक:
  - H2: संबंधित

## platforms/easyrunner.md

- रूट: /platforms/easyrunner
- शीर्षक:
  - H2: शुरू करने से पहले
  - H2: Compose app
  - H2: OpenClaw कॉन्फ़िगर करें
  - H2: सत्यापित करें
  - H2: अपडेट और बैकअप
  - H2: समस्या निवारण

## platforms/index.md

- रूट: /platforms
- शीर्षक:
  - H2: अपना OS चुनें
  - H2: VPS और होस्टिंग
  - H2: सामान्य लिंक
  - H2: Gateway service install (CLI)
  - H2: संबंधित

## platforms/ios.md

- रूट: /platforms/ios
- शीर्षक:
  - H2: यह क्या करता है
  - H2: आवश्यकताएँ
  - H2: त्वरित शुरुआत (pair + connect)
  - H2: आधिकारिक builds के लिए relay-backed push
  - H2: Background alive beacons
  - H2: Authentication और trust flow
  - H2: Discovery paths
  - H3: Bonjour (LAN)
  - H3: Tailnet (cross-network)
  - H3: Manual host/port
  - H2: Canvas + A2UI
  - H2: Computer Use relationship
  - H3: Canvas eval / snapshot
  - H2: Voice wake + talk mode
  - H2: सामान्य त्रुटियाँ
  - H2: संबंधित दस्तावेज़

## platforms/linux.md

- रूट: /platforms/linux
- शीर्षक:
  - H2: शुरुआती लोगों के लिए त्वरित रास्ता (VPS)
  - H2: इंस्टॉल करें
  - H2: Gateway
  - H2: Gateway service install (CLI)
  - H2: सिस्टम नियंत्रण (systemd user unit)
  - H2: Memory pressure और OOM kills
  - H2: संबंधित

## platforms/mac/bundled-gateway.md

- रूट: /platforms/mac/bundled-gateway
- शीर्षक:
  - H2: CLI इंस्टॉल करें (local mode के लिए आवश्यक)
  - H2: Launchd (Gateway as LaunchAgent)
  - H2: संस्करण संगतता
  - H2: macOS पर state directory
  - H2: ऐप कनेक्टिविटी डीबग करें
  - H2: Smoke check
  - H2: संबंधित

## platforms/mac/canvas.md

- रूट: /platforms/mac/canvas
- शीर्षक:
  - H2: Canvas कहाँ रहता है
  - H2: Panel behavior
  - H2: Agent API surface
  - H2: Canvas में A2UI
  - H3: A2UI commands (v0.8)
  - H2: Canvas से agent runs trigger करना
  - H2: सुरक्षा नोट्स
  - H2: संबंधित

## platforms/mac/child-process.md

- रूट: /platforms/mac/child-process
- शीर्षक:
  - H2: डिफ़ॉल्ट व्यवहार (launchd)
  - H2: Unsigned dev builds
  - H2: Attach-only mode
  - H2: Remote mode
  - H2: हम launchd को क्यों प्राथमिकता देते हैं
  - H2: संबंधित

## platforms/mac/dev-setup.md

- मार्ग: /platforms/mac/dev-setup
- शीर्षक:
  - H1: macOS डेवलपर सेटअप
  - H2: पूर्वापेक्षाएँ
  - H2: 1. निर्भरताएँ इंस्टॉल करें
  - H2: 2. ऐप बनाएँ और पैकेज करें
  - H2: 3. CLI इंस्टॉल करें
  - H2: समस्या निवारण
  - H3: बिल्ड विफल: टूलचेन या SDK बेमेल
  - H3: अनुमति देने पर ऐप क्रैश होता है
  - H3: Gateway "Starting..." पर अनिश्चितकाल तक रहता है
  - H2: संबंधित

## platforms/mac/health.md

- मार्ग: /platforms/mac/health
- शीर्षक:
  - H1: macOS पर हेल्थ चेक
  - H2: मेनू बार
  - H2: सेटिंग्स
  - H2: प्रोब कैसे काम करता है
  - H2: संदेह होने पर
  - H2: संबंधित

## platforms/mac/icon.md

- मार्ग: /platforms/mac/icon
- शीर्षक:
  - H1: मेनू बार आइकन अवस्थाएँ
  - H2: संबंधित

## platforms/mac/logging.md

- मार्ग: /platforms/mac/logging
- शीर्षक:
  - H1: लॉगिंग (macOS)
  - H2: रोलिंग डायग्नॉस्टिक्स फ़ाइल लॉग (डीबग पेन)
  - H2: macOS पर यूनिफ़ाइड लॉगिंग निजी डेटा
  - H2: OpenClaw (ai.openclaw) के लिए सक्षम करें
  - H2: डीबगिंग के बाद अक्षम करें
  - H2: संबंधित

## platforms/mac/menu-bar.md

- मार्ग: /platforms/mac/menu-bar
- शीर्षक:
  - H2: क्या दिखाया जाता है
  - H2: अवस्था मॉडल
  - H2: IconState enum (Swift)
  - H3: ActivityKind → glyph
  - H3: विज़ुअल मैपिंग
  - H2: संदर्भ सबमेनू
  - H2: स्थिति पंक्ति पाठ (मेनू)
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
  - H2: नोटिफ़िकेशन ध्वनियाँ
  - H2: संबंधित

## platforms/mac/signing.md

- मार्ग: /platforms/mac/signing
- शीर्षक:
  - H1: mac साइनिंग (डीबग बिल्ड)
  - H2: उपयोग
  - H3: एड-हॉक साइनिंग नोट
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
  - H1: वॉइस ओवरले लाइफ़सायकल (macOS)
  - H2: वर्तमान आशय
  - H2: लागू किया गया (9 दिसंबर, 2025)
  - H2: अगले चरण
  - H2: डीबगिंग चेकलिस्ट
  - H2: माइग्रेशन चरण (सुझाए गए)
  - H2: संबंधित

## platforms/mac/voicewake.md

- मार्ग: /platforms/mac/voicewake
- शीर्षक:
  - H1: वॉइस वेक और पुश-टू-टॉक
  - H2: आवश्यकताएँ
  - H2: मोड
  - H2: रनटाइम व्यवहार (वेक-वर्ड)
  - H2: लाइफ़सायकल इनवेरिएंट
  - H2: स्टिकी ओवरले विफलता मोड (पिछला)
  - H2: पुश-टू-टॉक विवरण
  - H2: उपयोगकर्ता-दृश्य सेटिंग्स
  - H2: फ़ॉरवर्डिंग व्यवहार
  - H2: फ़ॉरवर्डिंग पेलोड
  - H2: त्वरित सत्यापन
  - H2: संबंधित

## platforms/mac/webchat.md

- मार्ग: /platforms/mac/webchat
- शीर्षक:
  - H2: लॉन्च और डीबगिंग
  - H2: यह कैसे जुड़ा है
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
  - H2: WSL सेवाओं को LAN पर एक्सपोज़ करें
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
  - H2: कार्य किया हुआ उदाहरण: इमेज जनरेशन
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
  - H3: मैनिफ़ेस्ट-फ़र्स्ट व्यवहार
  - H3: Plugin कैश सीमा
  - H2: रजिस्ट्री मॉडल
  - H2: वार्तालाप बाइंडिंग कॉलबैक
  - H2: प्रदाता रनटाइम हुक
  - H3: हुक क्रम और उपयोग
  - H3: प्रदाता उदाहरण
  - H3: बिल्ट-इन उदाहरण
  - H2: रनटाइम हेल्पर
  - H3: api.runtime.imageGeneration
  - H2: Gateway HTTP रूट
  - H2: Plugin SDK इम्पोर्ट पथ
  - H2: संदेश टूल स्कीमा
  - H2: चैनल लक्ष्य रिज़ॉल्यूशन
  - H2: कॉन्फ़िग-समर्थित डायरेक्टरी
  - H2: प्रदाता कैटलॉग
  - H2: रीड-ओनली चैनल निरीक्षण
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
  - H3: लेगेसी हुक
  - H3: संगतता संकेत
  - H2: आर्किटेक्चर अवलोकन
  - H3: Plugin मेटाडेटा स्नैपशॉट और लुकअप टेबल
  - H3: सक्रियण योजना
  - H3: चैनल Plugin और साझा संदेश टूल
  - H2: क्षमता स्वामित्व मॉडल
  - H3: क्षमता लेयरिंग
  - H3: मल्टी-क्षमता कंपनी Plugin उदाहरण
  - H3: क्षमता उदाहरण: वीडियो समझ
  - H2: अनुबंध और प्रवर्तन
  - H3: अनुबंध में क्या शामिल होता है
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
  - H3: पता चला लेकिन निष्पादित नहीं किया गया
  - H2: बंडल फ़ॉर्मैट
  - H2: पहचान प्राथमिकता
  - H2: रनटाइम निर्भरताएँ और क्लीनअप
  - H2: सुरक्षा
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/cli-backend-plugins.md

- मार्ग: /plugins/cli-backend-plugins
- शीर्षक:
  - H2: Plugin किसका स्वामी है
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
  - H2: सैंडबॉक्स्ड नेटिव निष्पादन
  - H2: प्रमाणीकरण और वातावरण आइसोलेशन
  - H2: डायनामिक टूल
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
  - H2: दृश्य उत्तर और Heartbeat
  - H2: हुक सीमाएँ
  - H2: V1 समर्थन अनुबंध
  - H2: नेटिव अनुमतियाँ और MCP elicitations
  - H2: कतार स्टीयरिंग
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
  - H2: डिप्लॉयमेंट पैटर्न
  - H3: बेसिक Codex डिप्लॉयमेंट
  - H3: मिश्रित प्रदाता डिप्लॉयमेंट
  - H3: फ़ेल-क्लोज़्ड Codex डिप्लॉयमेंट
  - H2: ऐप-सर्वर नीति
  - H2: कमांड और डायग्नॉस्टिक्स
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
  - H2: विनाशकारी कार्रवाई नीति
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
  - H2: Plugin निरीक्षक पैकेज
  - H3: मेंटेनर स्वीकृति लेन
  - H2: डेप्रिकेशन नीति
  - H2: वर्तमान संगतता क्षेत्र
  - H3: WhatsApp इनबाउंड कॉलबैक फ़्लैट एलियस
  - H3: WhatsApp इनबाउंड एडमिशन फ़ील्ड
  - H2: रिलीज़ नोट्स

## plugins/copilot.md

- मार्ग: /plugins/copilot
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: Plugin इंस्टॉल
  - H2: क्विकस्टार्ट
  - H2: समर्थित प्रदाता
  - H2: BYOK
  - H2: Auth
  - H2: कॉन्फ़िगरेशन सतह
  - H2: Compaction
  - H2: ट्रांसक्रिप्ट मिररिंग
  - H2: अतिरिक्त प्रश्न (/btw)
  - H2: Doctor
  - H2: सीमाएँ
  - H2: अनुमतियाँ और askuser
  - H3: सेशन-स्तर GitHub टोकन
  - H2: संबंधित

## plugins/dependency-resolution.md

- मार्ग: /plugins/dependency-resolution
- शीर्षक:
  - H2: ज़िम्मेदारी विभाजन
  - H2: इंस्टॉल रूट
  - H2: स्थानीय Plugin
  - H2: स्टार्टअप और रीलोड
  - H2: बंडल किए गए Plugin
  - H2: लेगेसी क्लीनअप

## plugins/google-meet.md

- मार्ग: /plugins/google-meet
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H3: स्थानीय Gateway + Parallels Chrome
  - H2: इंस्टॉल नोट्स
  - H2: ट्रांसपोर्ट
  - H3: Chrome
  - H3: Twilio
  - H2: OAuth और पूर्व-जांच
  - H3: Google क्रेडेंशियल बनाएं
  - H3: रिफ्रेश टोकन मिंट करें
  - H3: doctor से OAuth सत्यापित करें
  - H2: कॉन्फ़िगरेशन
  - H2: औज़ार
  - H2: एजेंट और bidi मोड
  - H2: लाइव टेस्ट चेकलिस्ट
  - H2: समस्या निवारण
  - H3: एजेंट Google Meet औज़ार नहीं देख सकता
  - H3: कोई कनेक्टेड Google Meet-सक्षम नोड नहीं
  - H3: ब्राउज़र खुलता है लेकिन एजेंट शामिल नहीं हो सकता
  - H3: मीटिंग बनाना विफल होता है
  - H3: एजेंट शामिल होता है लेकिन बोलता नहीं
  - H3: Twilio सेटअप जांच विफल होती है
  - H3: Twilio कॉल शुरू होती है लेकिन मीटिंग में कभी प्रवेश नहीं करती
  - H2: नोट्स
  - H2: संबंधित

## plugins/hooks.md

- मार्ग: /plugins/hooks
- शीर्षक:
  - H2: त्वरित शुरुआत
  - H2: हुक कैटलॉग
  - H2: रनटाइम हुक डीबग करें
  - H2: औज़ार कॉल नीति
  - H3: Exec environment हुक
  - H3: औज़ार परिणाम स्थायित्व
  - H2: प्रॉम्प्ट और मॉडल हुक
  - H3: सेशन एक्सटेंशन और अगले-टर्न इंजेक्शन
  - H2: संदेश हुक
  - H2: इंस्टॉल हुक
  - H2: Gateway जीवनचक्र
  - H2: आगामी डिप्रिकेशन
  - H2: संबंधित

## plugins/install-overrides.md

- मार्ग: /plugins/install-overrides
- शीर्षक:
  - H2: वातावरण
  - H2: व्यवहार
  - H2: पैकेज E2E

## plugins/llama-cpp.md

- मार्ग: /plugins/llama-cpp
- शीर्षक:
  - H2: कॉन्फ़िगरेशन
  - H2: नेटिव रनटाइम

## plugins/manage-plugins.md

- मार्ग: /plugins/manage-plugins
- शीर्षक:
  - H2: plugins सूचीबद्ध करें और खोजें
  - H2: plugins इंस्टॉल करें
  - H2: पुनः शुरू करें और निरीक्षण करें
  - H2: plugins अपडेट करें
  - H2: plugins अनइंस्टॉल करें
  - H2: स्रोत चुनें
  - H2: plugins प्रकाशित करें
  - H2: संबंधित

## plugins/manifest.md

- मार्ग: /plugins/manifest
- शीर्षक:
  - H2: यह फ़ाइल क्या करती है
  - H2: न्यूनतम उदाहरण
  - H2: समृद्ध उदाहरण
  - H2: शीर्ष-स्तरीय फ़ील्ड संदर्भ
  - H2: जनरेशन provider मेटाडेटा संदर्भ
  - H2: औज़ार मेटाडेटा संदर्भ
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
  - H3: OpenClaw Provider Index
  - H2: Manifest बनाम package.json
  - H3: package.json फ़ील्ड जो discovery को प्रभावित करते हैं
  - H2: Discovery प्राथमिकता (डुप्लीकेट plugin ids)
  - H2: JSON Schema आवश्यकताएं
  - H2: वैलिडेशन व्यवहार
  - H2: नोट्स
  - H2: संबंधित

## plugins/memory-lancedb.md

- मार्ग: /plugins/memory-lancedb
- शीर्षक:
  - H2: इंस्टॉलेशन
  - H2: त्वरित शुरुआत
  - H2: Provider-समर्थित embeddings
  - H2: Ollama embeddings
  - H2: OpenAI-संगत providers
  - H2: Recall और capture सीमाएं
  - H2: कमांड
  - H2: स्टोरेज
  - H2: रनटाइम निर्भरताएं
  - H2: समस्या निवारण
  - H3: इनपुट लंबाई context length से अधिक है
  - H3: असमर्थित embedding मॉडल
  - H3: Plugin लोड होता है लेकिन कोई memories दिखाई नहीं देतीं
  - H2: संबंधित

## plugins/memory-wiki.md

- मार्ग: /plugins/memory-wiki
- शीर्षक:
  - H2: यह क्या जोड़ता है
  - H2: यह memory के साथ कैसे फिट होता है
  - H2: अनुशंसित hybrid pattern
  - H2: Vault मोड
  - H3: isolated
  - H3: bridge
  - H3: unsafe-local
  - H2: Vault लेआउट
  - H2: Open Knowledge Format imports
  - H2: संरचित claims और evidence
  - H2: एजेंट-फ़ेसिंग entity metadata
  - H2: Compile pipeline
  - H2: डैशबोर्ड और health reports
  - H2: Search और retrieval
  - H2: एजेंट औज़ार
  - H2: प्रॉम्प्ट और context व्यवहार
  - H2: कॉन्फ़िगरेशन
  - H3: उदाहरण: QMD + bridge मोड
  - H2: CLI
  - H2: Obsidian समर्थन
  - H2: अनुशंसित workflow
  - H2: संबंधित दस्तावेज़

## plugins/message-presentation.md

- मार्ग: /plugins/message-presentation
- शीर्षक:
  - H2: Contract
  - H2: Producer उदाहरण
  - H2: Renderer contract
  - H2: Core render flow
  - H2: Degradation rules
  - H2: Provider mapping
  - H2: Presentation बनाम InteractiveReply
  - H2: Delivery pin
  - H2: Plugin author checklist
  - H2: संबंधित दस्तावेज़

## plugins/oc-path.md

- मार्ग: /plugins/oc-path
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

- मार्ग: /plugins/plugin-inventory
- शीर्षक:
  - H1: Plugin inventory
  - H2: परिभाषाएं
  - H2: Plugin इंस्टॉल करें
  - H2: Core npm package
  - H2: आधिकारिक बाहरी पैकेज
  - H2: केवल source checkout

## plugins/plugin-permission-requests.md

- मार्ग: /plugins/plugin-permission-requests
- शीर्षक:
  - H2: सही gate चुनें
  - H2: औज़ार कॉल से पहले approval का अनुरोध करें
  - H2: निर्णय व्यवहार
  - H2: approval prompts रूट करें
  - H2: Codex native permissions
  - H2: समस्या निवारण
  - H2: संबंधित

## plugins/reference.md

- मार्ग: /plugins/reference
- शीर्षक:
  - H1: Plugin संदर्भ

## plugins/reference/acpx.md

- मार्ग: /plugins/reference/acpx
- शीर्षक:
  - H1: ACPx Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/admin-http-rpc.md

- मार्ग: /plugins/reference/admin-http-rpc
- शीर्षक:
  - H1: Admin Http Rpc Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/alibaba.md

- मार्ग: /plugins/reference/alibaba
- शीर्षक:
  - H1: Alibaba Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/amazon-bedrock-mantle.md

- मार्ग: /plugins/reference/amazon-bedrock-mantle
- शीर्षक:
  - H1: Amazon Bedrock Mantle Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/amazon-bedrock.md

- मार्ग: /plugins/reference/amazon-bedrock
- शीर्षक:
  - H1: Amazon Bedrock Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/anthropic-vertex.md

- मार्ग: /plugins/reference/anthropic-vertex
- शीर्षक:
  - H1: Anthropic Vertex Plugin
  - H2: वितरण
  - H2: सतह
  - H2: Claude Fable 5

## plugins/reference/anthropic.md

- मार्ग: /plugins/reference/anthropic
- शीर्षक:
  - H1: Anthropic Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/arcee.md

- मार्ग: /plugins/reference/arcee
- शीर्षक:
  - H1: Arcee Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/azure-speech.md

- मार्ग: /plugins/reference/azure-speech
- शीर्षक:
  - H1: Azure Speech Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/bonjour.md

- मार्ग: /plugins/reference/bonjour
- शीर्षक:
  - H1: Bonjour Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/brave.md

- मार्ग: /plugins/reference/brave
- शीर्षक:
  - H1: Brave Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/browser.md

- मार्ग: /plugins/reference/browser
- शीर्षक:
  - H1: Browser Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/byteplus.md

- मार्ग: /plugins/reference/byteplus
- शीर्षक:
  - H1: BytePlus Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/canvas.md

- मार्ग: /plugins/reference/canvas
- शीर्षक:
  - H1: Canvas Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/cerebras.md

- मार्ग: /plugins/reference/cerebras
- शीर्षक:
  - H1: Cerebras Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/chutes.md

- मार्ग: /plugins/reference/chutes
- शीर्षक:
  - H1: Chutes Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/clickclack.md

- मार्ग: /plugins/reference/clickclack
- शीर्षक:
  - H1: Clickclack Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/cloudflare-ai-gateway.md

- मार्ग: /plugins/reference/cloudflare-ai-gateway
- शीर्षक:
  - H1: Cloudflare AI Gateway Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/codex-supervisor.md

- मार्ग: /plugins/reference/codex-supervisor
- शीर्षक:
  - H1: Codex Supervisor Plugin
  - H2: वितरण
  - H2: सतह
  - H2: सेशन सूचीकरण

## plugins/reference/codex.md

- मार्ग: /plugins/reference/codex
- शीर्षक:
  - H1: Codex Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/cohere.md

- मार्ग: /plugins/reference/cohere
- शीर्षक:
  - H1: Cohere Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/comfy.md

- मार्ग: /plugins/reference/comfy
- शीर्षक:
  - H1: ComfyUI Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/copilot-proxy.md

- मार्ग: /plugins/reference/copilot-proxy
- शीर्षक:
  - H1: Copilot Proxy Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/copilot.md

- मार्ग: /plugins/reference/copilot
- शीर्षक:
  - H1: Copilot Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/deepgram.md

- मार्ग: /plugins/reference/deepgram
- शीर्षक:
  - H1: Deepgram Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/deepinfra.md

- मार्ग: /plugins/reference/deepinfra
- शीर्षक:
  - H1: DeepInfra Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/deepseek.md

- मार्ग: /plugins/reference/deepseek
- शीर्षक:
  - H1: DeepSeek Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/diagnostics-otel.md

- मार्ग: /plugins/reference/diagnostics-otel
- शीर्षक:
  - H1: Diagnostics OpenTelemetry Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/diagnostics-prometheus.md

- मार्ग: /plugins/reference/diagnostics-prometheus
- शीर्षक:
  - H1: Diagnostics Prometheus Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/diffs-language-pack.md

- मार्ग: /plugins/reference/diffs-language-pack
- शीर्षक:
  - H1: Diffs Language Pack Plugin
  - H2: वितरण
  - H2: सतह
  - H2: जोड़ी गई भाषाएं

## plugins/reference/diffs.md

- मार्ग: /plugins/reference/diffs
- शीर्षक:
  - H1: Diffs Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/discord.md

- मार्ग: /plugins/reference/discord
- शीर्षक:
  - H1: Discord Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/document-extract.md

- मार्ग: /plugins/reference/document-extract
- शीर्षक:
  - H1: Document Extract Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/duckduckgo.md

- मार्ग: /plugins/reference/duckduckgo
- शीर्षक:
  - H1: DuckDuckGo Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/elevenlabs.md

- मार्ग: /plugins/reference/elevenlabs
- शीर्षक:
  - H1: Elevenlabs Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/exa.md

- मार्ग: /plugins/reference/exa
- शीर्षक:
  - H1: Exa Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/fal.md

- मार्ग: /plugins/reference/fal
- शीर्षक:
  - H1: fal Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/feishu.md

- मार्ग: /plugins/reference/feishu
- शीर्षक:
  - H1: Feishu Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/file-transfer.md

- मार्ग: /plugins/reference/file-transfer
- शीर्षक:
  - H1: File Transfer Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/firecrawl.md

- मार्ग: /plugins/reference/firecrawl
- शीर्षक:
  - H1: Firecrawl Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/fireworks.md

- मार्ग: /plugins/reference/fireworks
- शीर्षक:
  - H1: Fireworks Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/github-copilot.md

- मार्ग: /plugins/reference/github-copilot
- शीर्षक:
  - H1: GitHub Copilot Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/gmi.md

- मार्ग: /plugins/reference/gmi
- शीर्षक:
  - H1: Gmi Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/google-meet.md

- मार्ग: /plugins/reference/google-meet
- शीर्षक:
  - H1: Google Meet Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/google.md

- मार्ग: /plugins/reference/google
- शीर्षक:
  - H1: Google Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/googlechat.md

- मार्ग: /plugins/reference/googlechat
- शीर्षक:
  - H1: Google Chat Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/gradium.md

- मार्ग: /plugins/reference/gradium
- शीर्षक:
  - H1: Gradium Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/groq.md

- मार्ग: /plugins/reference/groq
- शीर्षक:
  - H1: Groq Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/huggingface.md

- मार्ग: /plugins/reference/huggingface
- शीर्षक:
  - H1: Hugging Face Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/imessage.md

- मार्ग: /plugins/reference/imessage
- शीर्षक:
  - H1: iMessage Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/inworld.md

- मार्ग: /plugins/reference/inworld
- शीर्षक:
  - H1: Inworld Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/irc.md

- मार्ग: /plugins/reference/irc
- शीर्षक:
  - H1: IRC Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/kilocode.md

- मार्ग: /plugins/reference/kilocode
- शीर्षक:
  - H1: Kilocode Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/kimi.md

- मार्ग: /plugins/reference/kimi
- शीर्षक:
  - H1: Kimi Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/line.md

- मार्ग: /plugins/reference/line
- शीर्षक:
  - H1: LINE Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/litellm.md

- मार्ग: /plugins/reference/litellm
- शीर्षक:
  - H1: LiteLLM Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/llama-cpp.md

- मार्ग: /plugins/reference/llama-cpp
- शीर्षक:
  - H1: Llama Cpp Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/llm-task.md

- मार्ग: /plugins/reference/llm-task
- शीर्षक:
  - H1: LLM Task Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/lmstudio.md

- मार्ग: /plugins/reference/lmstudio
- शीर्षक:
  - H1: LM Studio Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/lobster.md

- मार्ग: /plugins/reference/lobster
- शीर्षक:
  - H1: Lobster Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/matrix.md

- मार्ग: /plugins/reference/matrix
- शीर्षक:
  - H1: Matrix Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/mattermost.md

- मार्ग: /plugins/reference/mattermost
- शीर्षक:
  - H1: Mattermost Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/memory-core.md

- मार्ग: /plugins/reference/memory-core
- शीर्षक:
  - H1: Memory Core Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/memory-lancedb.md

- मार्ग: /plugins/reference/memory-lancedb
- शीर्षक:
  - H1: Memory Lancedb Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/memory-wiki.md

- मार्ग: /plugins/reference/memory-wiki
- शीर्षक:
  - H1: Memory Wiki Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/microsoft-foundry.md

- मार्ग: /plugins/reference/microsoft-foundry
- शीर्षक:
  - H1: Microsoft Foundry Plugin
  - H2: वितरण
  - H2: सतह
  - H2: आवश्यकताएँ
  - H2: चैट मॉडल
  - H2: MAI छवि निर्माण
  - H2: समस्या निवारण

## plugins/reference/microsoft.md

- मार्ग: /plugins/reference/microsoft
- शीर्षक:
  - H1: Microsoft Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/migrate-claude.md

- मार्ग: /plugins/reference/migrate-claude
- शीर्षक:
  - H1: Claude माइग्रेट करें Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/migrate-hermes.md

- मार्ग: /plugins/reference/migrate-hermes
- शीर्षक:
  - H1: Hermes माइग्रेट करें Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/minimax.md

- मार्ग: /plugins/reference/minimax
- शीर्षक:
  - H1: MiniMax Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/mistral.md

- मार्ग: /plugins/reference/mistral
- शीर्षक:
  - H1: Mistral Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/moonshot.md

- मार्ग: /plugins/reference/moonshot
- शीर्षक:
  - H1: Moonshot Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/msteams.md

- मार्ग: /plugins/reference/msteams
- शीर्षक:
  - H1: Microsoft Teams Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/nextcloud-talk.md

- मार्ग: /plugins/reference/nextcloud-talk
- शीर्षक:
  - H1: Nextcloud Talk Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/nostr.md

- मार्ग: /plugins/reference/nostr
- शीर्षक:
  - H1: Nostr Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/novita.md

- मार्ग: /plugins/reference/novita
- शीर्षक:
  - H1: Novita Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/nvidia.md

- मार्ग: /plugins/reference/nvidia
- शीर्षक:
  - H1: NVIDIA Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/oc-path.md

- मार्ग: /plugins/reference/oc-path
- शीर्षक:
  - H1: Oc Path Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/ollama.md

- मार्ग: /plugins/reference/ollama
- शीर्षक:
  - H1: Ollama Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/open-prose.md

- मार्ग: /plugins/reference/open-prose
- शीर्षक:
  - H1: Open Prose Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/openai.md

- मार्ग: /plugins/reference/openai
- शीर्षक:
  - H1: OpenAI Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/opencode-go.md

- मार्ग: /plugins/reference/opencode-go
- शीर्षक:
  - H1: OpenCode Go Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/opencode.md

- मार्ग: /plugins/reference/opencode
- शीर्षक:
  - H1: OpenCode Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/openrouter.md

- मार्ग: /plugins/reference/openrouter
- शीर्षक:
  - H1: OpenRouter Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/openshell.md

- मार्ग: /plugins/reference/openshell
- शीर्षक:
  - H1: Openshell Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/perplexity.md

- मार्ग: /plugins/reference/perplexity
- शीर्षक:
  - H1: Perplexity Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/pixverse.md

- मार्ग: /plugins/reference/pixverse
- शीर्षक:
  - H1: PixVerse Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/policy.md

- मार्ग: /plugins/reference/policy
- शीर्षक:
  - H1: Policy Plugin
  - H2: वितरण
  - H2: सतह
  - H2: व्यवहार
  - H2: संबंधित दस्तावेज़

## plugins/reference/qa-channel.md

- मार्ग: /plugins/reference/qa-channel
- शीर्षक:
  - H1: QA Channel Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/qa-lab.md

- मार्ग: /plugins/reference/qa-lab
- शीर्षक:
  - H1: QA Lab Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/qa-matrix.md

- मार्ग: /plugins/reference/qa-matrix
- शीर्षक:
  - H1: QA Matrix Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/qianfan.md

- मार्ग: /plugins/reference/qianfan
- शीर्षक:
  - H1: Qianfan Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/qqbot.md

- मार्ग: /plugins/reference/qqbot
- शीर्षक:
  - H1: QQ Bot Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/qwen.md

- मार्ग: /plugins/reference/qwen
- शीर्षक:
  - H1: Qwen Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/raft.md

- मार्ग: /plugins/reference/raft
- शीर्षक:
  - H1: Raft Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/runway.md

- मार्ग: /plugins/reference/runway
- शीर्षक:
  - H1: Runway Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/searxng.md

- मार्ग: /plugins/reference/searxng
- शीर्षक:
  - H1: SearXNG Plugin
  - H2: वितरण
  - H2: सतह

## plugins/reference/senseaudio.md

- मार्ग: /plugins/reference/senseaudio
- शीर्षक:
  - H1: Senseaudio Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/sglang.md

- मार्ग: /plugins/reference/sglang
- शीर्षक:
  - H1: SGLang Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/signal.md

- मार्ग: /plugins/reference/signal
- शीर्षक:
  - H1: Signal Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/slack.md

- मार्ग: /plugins/reference/slack
- शीर्षक:
  - H1: Slack Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/sms.md

- मार्ग: /plugins/reference/sms
- शीर्षक:
  - H1: Sms Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/stepfun.md

- मार्ग: /plugins/reference/stepfun
- शीर्षक:
  - H1: StepFun Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/synology-chat.md

- मार्ग: /plugins/reference/synology-chat
- शीर्षक:
  - H1: Synology Chat Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/synthetic.md

- मार्ग: /plugins/reference/synthetic
- शीर्षक:
  - H1: Synthetic Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tavily.md

- मार्ग: /plugins/reference/tavily
- शीर्षक:
  - H1: Tavily Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/telegram.md

- मार्ग: /plugins/reference/telegram
- शीर्षक:
  - H1: Telegram Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tencent.md

- मार्ग: /plugins/reference/tencent
- शीर्षक:
  - H1: Tencent Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tlon.md

- मार्ग: /plugins/reference/tlon
- शीर्षक:
  - H1: Tlon Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/together.md

- मार्ग: /plugins/reference/together
- शीर्षक:
  - H1: Together Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tokenjuice.md

- मार्ग: /plugins/reference/tokenjuice
- शीर्षक:
  - H1: Tokenjuice Plugin
  - H2: वितरण
  - H2: सतह
  - H2: संबंधित दस्तावेज़

## plugins/reference/tts-local-cli.md

- मार्ग: /plugins/reference/tts-local-cli
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
  - H2: हार्नेस का उपयोग कब करें
  - H2: core के पास अब भी क्या रहता है
  - H2: हार्नेस पंजीकृत करें
  - H2: चयन नीति
  - H2: प्रदाता और हार्नेस युग्मन
  - H3: टूल-परिणाम middleware
  - H3: टर्मिनल परिणाम वर्गीकरण
  - H3: एजेंट-अंत साइड इफ़ेक्ट
  - H3: उपयोगकर्ता इनपुट और टूल सतहें
  - H3: नेटिव Codex हार्नेस मोड
  - H2: रनटाइम कठोरता
  - H2: नेटिव सत्र और transcript mirror
  - H2: टूल और मीडिया परिणाम
  - H2: वर्तमान सीमाएँ
  - H2: संबंधित

## plugins/sdk-channel-inbound.md

- मार्ग: /plugins/sdk-channel-inbound
- शीर्षक:
  - H2: core सहायक
  - H2: माइग्रेशन

## plugins/sdk-channel-ingress.md

- मार्ग: /plugins/sdk-channel-ingress
- शीर्षक:
  - H1: चैनल ingress API
  - H2: रनटाइम resolver
  - H2: परिणाम
  - H2: एक्सेस समूह
  - H2: इवेंट मोड
  - H2: रूट और सक्रियण
  - H2: संपादन
  - H2: सत्यापन

## plugins/sdk-channel-message.md

- मार्ग: /plugins/sdk-channel-message
- शीर्षक: कोई नहीं

## plugins/sdk-channel-outbound.md

- मार्ग: /plugins/sdk-channel-outbound
- शीर्षक:
  - H2: adapter
  - H2: मौजूदा outbound adapter
  - H2: टिकाऊ sends
  - H2: संगतता dispatch

## plugins/sdk-channel-plugins.md

- मार्ग: /plugins/sdk-channel-plugins
- शीर्षक:
  - H2: चैनल Plugin कैसे काम करते हैं
  - H2: अनुमोदन और चैनल क्षमताएँ
  - H2: inbound mention नीति
  - H2: walkthrough
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
  - H2: Talk और रीयलटाइम वॉइस माइग्रेशन योजना
  - H2: संगतता नीति
  - H2: माइग्रेट कैसे करें
  - H2: इंपोर्ट पथ संदर्भ
  - H2: सक्रिय deprecations
  - H2: हटाने की समयरेखा
  - H2: चेतावनियों को अस्थायी रूप से दबाना
  - H2: संबंधित

## plugins/sdk-overview.md

- मार्ग: /plugins/sdk-overview
- शीर्षक:
  - H2: इंपोर्ट परंपरा
  - H2: subpath संदर्भ
  - H2: पंजीकरण API
  - H3: क्षमता पंजीकरण
  - H3: टूल और कमांड
  - H3: अवसंरचना
  - H3: workflow Plugin के लिए host hooks
  - H3: Gateway discovery पंजीकरण
  - H3: CLI पंजीकरण metadata
  - H3: CLI backend पंजीकरण
  - H3: विशिष्ट slots
  - H3: अप्रचलित memory embedding adapters
  - H3: इवेंट और lifecycle
  - H3: hook निर्णय semantics
  - H3: API object fields
  - H2: आंतरिक module परंपरा
  - H2: संबंधित

## plugins/sdk-provider-plugins.md

- मार्ग: /plugins/sdk-provider-plugins
- शीर्षक:
  - H2: walkthrough
  - H2: ClawHub पर प्रकाशित करें
  - H2: फ़ाइल संरचना
  - H2: catalog क्रम संदर्भ
  - H2: अगले चरण
  - H2: संबंधित

## plugins/sdk-runtime.md

- मार्ग: /plugins/sdk-runtime
- शीर्षक:
  - H2: config लोडिंग और writes
  - H2: पुन: उपयोग योग्य रनटाइम utilities
  - H2: रनटाइम namespaces
  - H2: रनटाइम references संग्रहीत करना
  - H2: अन्य शीर्ष-स्तरीय api fields
  - H2: संबंधित

## plugins/sdk-setup.md

- मार्ग: /plugins/sdk-setup
- शीर्षक:
  - H2: पैकेज metadata
  - H3: openclaw fields
  - H3: openclaw.channel
  - H3: openclaw.install
  - H3: स्थगित full load
  - H2: Plugin manifest
  - H2: ClawHub प्रकाशन
  - H2: setup entry
  - H3: संकीर्ण setup helper imports
  - H3: चैनल-स्वामित्व वाला single-account promotion
  - H2: config schema
  - H3: चैनल config schemas बनाना
  - H2: setup wizards
  - H2: प्रकाशित करना और इंस्टॉल करना
  - H2: संबंधित

## plugins/sdk-subpaths.md

- मार्ग: /plugins/sdk-subpaths
- शीर्षक:
  - H2: Plugin entry
  - H3: अप्रचलित संगतता और test helpers
  - H3: आरक्षित bundled Plugin helper subpaths
  - H2: संबंधित

## plugins/sdk-testing.md

- मार्ग: /plugins/sdk-testing
- शीर्षक:
  - H2: test utilities
  - H3: उपलब्ध exports
  - H3: types
  - H2: target resolution का परीक्षण
  - H2: परीक्षण पैटर्न
  - H3: पंजीकरण contracts का परीक्षण
  - H3: रनटाइम config access का परीक्षण
  - H3: चैनल Plugin का unit testing
  - H3: प्रदाता Plugin का unit testing
  - H3: Plugin रनटाइम को mock करना
  - H3: per-instance stubs के साथ परीक्षण
  - H2: contract tests (in-repo Plugin)
  - H3: scoped tests चलाना
  - H2: lint enforcement (in-repo Plugin)
  - H2: test configuration
  - H2: संबंधित

## plugins/tool-plugins.md

- मार्ग: /plugins/tool-plugins
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: quickstart
  - H2: टूल लिखें
  - H2: वैकल्पिक और factory tools
  - H2: return values
  - H2: configuration
  - H2: generated metadata
  - H2: पैकेज metadata
  - H2: CI में validate करें
  - H2: स्थानीय रूप से install और inspect करें
  - H2: प्रकाशित करें
  - H2: समस्या निवारण
  - H3: plugin entry नहीं मिला: ./dist/index.js
  - H3: plugin entry defineToolPlugin metadata expose नहीं करता
  - H3: openclaw.plugin.json generated metadata पुराना है
  - H3: package.json openclaw.extensions में ./dist/index.js शामिल होना चाहिए
  - H3: package 'typebox' नहीं मिल सकता
  - H3: install के बाद टूल दिखाई नहीं देता
  - H2: यह भी देखें

## plugins/voice-call.md

- मार्ग: /plugins/voice-call
- शीर्षक:
  - H2: quick start
  - H2: configuration
  - H2: सत्र scope
  - H2: रीयलटाइम वॉइस वार्तालाप
  - H3: टूल नीति
  - H3: एजेंट वॉइस context
  - H3: रीयलटाइम प्रदाता उदाहरण
  - H2: streaming transcription
  - H3: streaming प्रदाता उदाहरण
  - H2: कॉल के लिए TTS
  - H3: TTS उदाहरण
  - H2: inbound calls
  - H3: प्रति-नंबर routing
  - H3: बोली गई आउटपुट contract
  - H3: वार्तालाप startup behavior
  - H3: Twilio stream disconnect grace
  - H2: stale call reaper
  - H2: Webhook सुरक्षा
  - H2: CLI
  - H2: एजेंट टूल
  - H2: Gateway RPC
  - H2: समस्या निवारण
  - H3: setup webhook exposure में विफल होता है
  - H3: प्रदाता credentials विफल होते हैं
  - H3: कॉल शुरू होते हैं लेकिन प्रदाता webhooks नहीं आते
  - H3: signature verification विफल होता है
  - H3: Google Meet Twilio joins विफल होते हैं
  - H3: रीयलटाइम कॉल में speech नहीं है
  - H2: संबंधित

## plugins/webhooks.md

- मार्ग: /plugins/webhooks
- शीर्षक:
  - H2: यह कहाँ चलता है
  - H2: routes configure करें
  - H2: सुरक्षा मॉडल
  - H2: request format
  - H2: समर्थित actions
  - H3: createflow
  - H3: runtask
  - H2: response shape
  - H2: संबंधित दस्तावेज़

## plugins/workboard.md

- मार्ग: /plugins/workboard
- शीर्षक:
  - H2: डिफ़ॉल्ट स्थिति
  - H2: cards में क्या होता है
  - H2: card executions और tasks
  - H2: एजेंट समन्वय
  - H3: dispatch worker चयन
  - H3: worker prompt और lifecycle
  - H3: dispatch entry points
  - H2: CLI और slash command
  - H2: session lifecycle sync
  - H2: dashboard workflow
  - H2: अनुमतियाँ
  - H2: configuration
  - H2: समस्या निवारण
  - H3: tab कहता है कि Workboard अनुपलब्ध है
  - H3: cards save नहीं होते
  - H3: card शुरू करने पर अपेक्षित session नहीं खुलता
  - H3: dispatch worker शुरू नहीं करता
  - H2: संबंधित

## plugins/zalouser.md

- मार्ग: /plugins/zalouser
- शीर्षक:
  - H2: नामकरण
  - H2: यह कहाँ चलता है
  - H2: install
  - H3: विकल्प A: npm से install करें
  - H3: विकल्प B: स्थानीय folder (dev) से install करें
  - H2: config
  - H2: CLI
  - H2: एजेंट टूल
  - H2: संबंधित

## prose.md

- मार्ग: /prose
- शीर्षक:
  - H2: install
  - H2: slash command
  - H2: यह क्या कर सकता है
  - H2: उदाहरण: समानांतर शोध और synthesis
  - H2: OpenClaw रनटाइम mapping
  - H2: फ़ाइल locations
  - H2: state backends
  - H2: सुरक्षा
  - H2: संबंधित

## providers/alibaba.md

- मार्ग: /providers/alibaba
- शीर्षक:
  - H2: शुरू करना
  - H2: built-in Wan models
  - H2: क्षमताएँ और सीमाएँ
  - H2: उन्नत configuration
  - H2: संबंधित

## providers/anthropic.md

- मार्ग: /providers/anthropic
- शीर्षक:
  - H2: शुरू करना
  - H2: thinking defaults (Claude Fable 5, 4.8, और 4.6)
  - H2: prompt caching
  - H2: उन्नत configuration
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/arcee.md

- मार्ग: /providers/arcee
- शीर्षक:
  - H2: Plugin install करें
  - H2: शुरू करना
  - H2: non-interactive setup
  - H2: built-in catalog
  - H2: समर्थित features
  - H2: संबंधित

## providers/azure-speech.md

- मार्ग: /providers/azure-speech
- शीर्षक:
  - H2: शुरू करना
  - H2: configuration options
  - H2: नोट्स
  - H2: संबंधित

## providers/bedrock-mantle.md

- मार्ग: /providers/bedrock-mantle
- शीर्षक:
  - H2: शुरू करना
  - H2: automatic model discovery
  - H3: समर्थित regions
  - H2: manual configuration
  - H2: उन्नत configuration
  - H2: संबंधित

## providers/bedrock.md

- मार्ग: /providers/bedrock
- शीर्षक:
  - H2: शुरू करना
  - H2: automatic model discovery
  - H2: quick setup (AWS path)
  - H2: उन्नत configuration
  - H2: संबंधित

## providers/cerebras.md

- मार्ग: /providers/cerebras
- शीर्षक:
  - H2: Plugin install करें
  - H2: शुरू करना
  - H2: non-interactive setup
  - H2: built-in catalog
  - H2: manual config
  - H2: संबंधित

## providers/chutes.md

- मार्ग: /providers/chutes
- शीर्षक:
  - H2: Plugin install करें
  - H2: शुरू करना
  - H2: discovery behavior
  - H2: default aliases
  - H2: built-in starter catalog
  - H2: config example
  - H2: संबंधित

## providers/claude-max-api-proxy.md

- मार्ग: /providers/claude-max-api-proxy
- शीर्षक:
  - H2: इसका उपयोग क्यों करें?
  - H2: यह कैसे काम करता है
  - H2: शुरू करना
  - H2: अंतर्निहित कैटलॉग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: संबंधित

## providers/cloudflare-ai-gateway.md

- मार्ग: /providers/cloudflare-ai-gateway
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: गैर-इंटरैक्टिव उदाहरण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/cohere.md

- मार्ग: /providers/cohere
- शीर्षक:
  - H2: शुरू करें
  - H2: केवल-पर्यावरण सेटअप
  - H2: संबंधित

## providers/comfy.md

- मार्ग: /providers/comfy
- शीर्षक:
  - H2: यह क्या समर्थित करता है
  - H2: शुरू करना
  - H2: कॉन्फ़िगरेशन
  - H3: साझा कुंजियाँ
  - H3: प्रति-क्षमता कुंजियाँ
  - H2: वर्कफ़्लो विवरण
  - H2: संबंधित

## providers/deepgram.md

- मार्ग: /providers/deepgram
- शीर्षक:
  - H2: शुरू करना
  - H2: कॉन्फ़िगरेशन विकल्प
  - H2: वॉइस कॉल स्ट्रीमिंग STT
  - H2: नोट्स
  - H2: संबंधित

## providers/deepinfra.md

- मार्ग: /providers/deepinfra
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

- मार्ग: /providers/deepseek
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: अंतर्निहित कैटलॉग
  - H2: सोच और टूल
  - H2: लाइव परीक्षण
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/ds4.md

- मार्ग: /providers/ds4
- शीर्षक:
  - H2: आवश्यकताएँ
  - H2: क्विकस्टार्ट
  - H2: पूरा कॉन्फ़िग
  - H2: मांग पर स्टार्टअप
  - H2: Think Max
  - H2: परीक्षण
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/elevenlabs.md

- मार्ग: /providers/elevenlabs
- शीर्षक:
  - H2: प्रमाणीकरण
  - H2: टेक्स्ट-टू-स्पीच
  - H2: स्पीच-टू-टेक्स्ट
  - H2: स्ट्रीमिंग STT
  - H2: संबंधित

## providers/fal.md

- मार्ग: /providers/fal
- शीर्षक:
  - H2: शुरू करना
  - H2: इमेज जनरेशन
  - H2: वीडियो जनरेशन
  - H2: संगीत जनरेशन
  - H2: संबंधित

## providers/fireworks.md

- मार्ग: /providers/fireworks
- शीर्षक:
  - H2: शुरू करना
  - H2: गैर-इंटरैक्टिव सेटअप
  - H2: अंतर्निहित कैटलॉग
  - H2: कस्टम Fireworks मॉडल IDs
  - H2: संबंधित

## providers/github-copilot.md

- मार्ग: /providers/github-copilot
- शीर्षक:
  - H2: OpenClaw में Copilot उपयोग करने के तीन तरीके
  - H2: वैकल्पिक फ़्लैग
  - H2: गैर-इंटरैक्टिव ऑनबोर्डिंग
  - H2: मेमोरी खोज एम्बेडिंग
  - H3: कॉन्फ़िग
  - H3: यह कैसे काम करता है
  - H2: संबंधित

## providers/gmi.md

- मार्ग: /providers/gmi
- शीर्षक:
  - H2: सेटअप
  - H2: डिफ़ॉल्ट
  - H2: GMI कब चुनें
  - H2: मॉडल
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/google.md

- मार्ग: /providers/google
- शीर्षक:
  - H2: शुरू करना
  - H2: क्षमताएँ
  - H2: वेब खोज
  - H2: इमेज जनरेशन
  - H2: वीडियो जनरेशन
  - H2: संगीत जनरेशन
  - H2: टेक्स्ट-टू-स्पीच
  - H2: रीयलटाइम वॉइस
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/gradium.md

- मार्ग: /providers/gradium
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: सेटअप
  - H2: कॉन्फ़िग
  - H2: वॉइस
  - H3: प्रति-संदेश वॉइस ओवरराइड
  - H2: आउटपुट
  - H2: स्वतः-चयन क्रम
  - H2: संबंधित

## providers/groq.md

- मार्ग: /providers/groq
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H3: कॉन्फ़िग फ़ाइल उदाहरण
  - H2: अंतर्निहित कैटलॉग
  - H2: रीजनिंग मॉडल
  - H2: ऑडियो ट्रांसक्रिप्शन
  - H2: संबंधित

## providers/huggingface.md

- मार्ग: /providers/huggingface
- शीर्षक:
  - H2: शुरू करना
  - H3: गैर-इंटरैक्टिव सेटअप
  - H2: मॉडल IDs
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/index.md

- मार्ग: /providers
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: प्रदाता दस्तावेज़
  - H2: साझा अवलोकन पृष्ठ
  - H2: ट्रांसक्रिप्शन प्रदाता
  - H2: समुदाय टूल

## providers/inferrs.md

- मार्ग: /providers/inferrs
- शीर्षक:
  - H2: शुरू करना
  - H2: पूरा कॉन्फ़िग उदाहरण
  - H2: मांग पर स्टार्टअप
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/inworld.md

- मार्ग: /providers/inworld
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: कॉन्फ़िगरेशन विकल्प
  - H2: नोट्स
  - H2: संबंधित

## providers/kilocode.md

- मार्ग: /providers/kilocode
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: डिफ़ॉल्ट मॉडल
  - H2: अंतर्निहित कैटलॉग
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/litellm.md

- मार्ग: /providers/litellm
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: कॉन्फ़िगरेशन
  - H3: पर्यावरण चर
  - H3: कॉन्फ़िग फ़ाइल
  - H2: उन्नत कॉन्फ़िगरेशन
  - H3: इमेज जनरेशन
  - H2: संबंधित

## providers/lmstudio.md

- मार्ग: /providers/lmstudio
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: गैर-इंटरैक्टिव ऑनबोर्डिंग
  - H2: कॉन्फ़िगरेशन
  - H3: स्ट्रीमिंग उपयोग संगतता
  - H3: सोच संगतता
  - H3: स्पष्ट कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H3: LM Studio नहीं मिला
  - H3: प्रमाणीकरण त्रुटियाँ (HTTP 401)
  - H3: जस्ट-इन-टाइम मॉडल लोडिंग
  - H3: LAN या tailnet LM Studio होस्ट
  - H2: संबंधित

## providers/minimax.md

- मार्ग: /providers/minimax
- शीर्षक:
  - H2: अंतर्निहित कैटलॉग
  - H2: शुरू करना
  - H2: openclaw configure के ज़रिए कॉन्फ़िगर करें
  - H2: क्षमताएँ
  - H3: इमेज जनरेशन
  - H3: टेक्स्ट-टू-स्पीच
  - H3: संगीत जनरेशन
  - H3: वीडियो जनरेशन
  - H3: इमेज समझ
  - H3: वेब खोज
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/mistral.md

- मार्ग: /providers/mistral
- शीर्षक:
  - H2: शुरू करना
  - H2: अंतर्निहित LLM कैटलॉग
  - H2: ऑडियो ट्रांसक्रिप्शन (Voxtral)
  - H2: वॉइस कॉल स्ट्रीमिंग STT
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/models.md

- मार्ग: /providers/models
- शीर्षक:
  - H2: क्विक स्टार्ट (दो चरण)
  - H2: समर्थित प्रदाता (स्टार्टर सेट)
  - H2: अतिरिक्त प्रदाता वैरिएंट
  - H2: संबंधित

## providers/moonshot.md

- मार्ग: /providers/moonshot
- शीर्षक:
  - H2: अंतर्निहित मॉडल कैटलॉग
  - H2: शुरू करना
  - H2: Kimi वेब खोज
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/novita.md

- मार्ग: /providers/novita
- शीर्षक:
  - H2: सेटअप
  - H2: डिफ़ॉल्ट
  - H2: Novita कब चुनें
  - H2: मॉडल
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/nvidia.md

- मार्ग: /providers/nvidia
- शीर्षक:
  - H2: शुरू करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: विशेष कैटलॉग
  - H2: Nemotron 3 Ultra
  - H2: बंडल फ़ॉलबैक कैटलॉग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/ollama-cloud.md

- मार्ग: /providers/ollama-cloud
- शीर्षक:
  - H2: सेटअप
  - H2: डिफ़ॉल्ट
  - H2: Ollama Cloud कब चुनें
  - H2: मॉडल
  - H2: लाइव परीक्षण
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/ollama.md

- मार्ग: /providers/ollama
- शीर्षक:
  - H2: प्रमाणीकरण नियम
  - H2: शुरू करना
  - H2: Cloud मॉडल
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

- मार्ग: /providers/openai
- शीर्षक:
  - H2: त्वरित चुनाव
  - H2: नामकरण मैप
  - H2: GPT-5.6 सीमित प्रीव्यू
  - H2: OpenClaw फ़ीचर कवरेज
  - H2: मेमोरी एम्बेडिंग
  - H2: शुरू करना
  - H2: मूल Codex ऐप-सर्वर प्रमाणीकरण
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

- मार्ग: /providers/opencode-go
- शीर्षक:
  - H2: अंतर्निहित कैटलॉग
  - H2: शुरू करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/opencode.md

- मार्ग: /providers/opencode
- शीर्षक:
  - H2: शुरू करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: अंतर्निहित कैटलॉग
  - H3: Zen
  - H3: Go
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/openrouter.md

- मार्ग: /providers/openrouter
- शीर्षक:
  - H2: शुरू करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: मॉडल संदर्भ
  - H2: इमेज जनरेशन
  - H2: वीडियो जनरेशन
  - H2: संगीत जनरेशन
  - H2: टेक्स्ट-टू-स्पीच
  - H2: स्पीच-टू-टेक्स्ट (इनबाउंड ऑडियो)
  - H2: Fusion राउटर
  - H2: प्रमाणीकरण और हेडर
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/perplexity-provider.md

- मार्ग: /providers/perplexity-provider
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: खोज मोड
  - H2: मूल API फ़िल्टरिंग
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/pixverse.md

- मार्ग: /providers/pixverse
- शीर्षक:
  - H2: शुरू करना
  - H2: समर्थित मोड और मॉडल
  - H2: प्रदाता विकल्प
  - H2: कॉन्फ़िगरेशन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/qianfan.md

- मार्ग: /providers/qianfan
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: अंतर्निहित कैटलॉग
  - H2: कॉन्फ़िग उदाहरण
  - H2: संबंधित

## providers/qwen-oauth.md

- मार्ग: /providers/qwen-oauth
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

- मार्ग: /providers/qwen
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: शुरू करना
  - H2: प्लान प्रकार और एंडपॉइंट
  - H2: अंतर्निहित कैटलॉग
  - H2: Thinking Controls
  - H2: मल्टीमॉडल ऐड-ऑन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/runway.md

- मार्ग: /providers/runway
- शीर्षक:
  - H2: शुरू करना
  - H2: समर्थित मोड और मॉडल
  - H2: कॉन्फ़िगरेशन
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/senseaudio.md

- मार्ग: /providers/senseaudio
- शीर्षक:
  - H2: शुरू करना
  - H2: विकल्प
  - H2: संबंधित

## providers/sglang.md

- मार्ग: /providers/sglang
- शीर्षक:
  - H2: शुरू करना
  - H2: मॉडल खोज (अंतर्निहित प्रदाता)
  - H2: स्पष्ट कॉन्फ़िगरेशन (मैनुअल मॉडल)
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/stepfun.md

- मार्ग: /providers/stepfun
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: क्षेत्र और एंडपॉइंट अवलोकन
  - H2: अंतर्निहित कैटलॉग
  - H2: शुरू करना
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/synthetic.md

- मार्ग: /providers/synthetic
- शीर्षक:
  - H2: शुरू करना
  - H2: कॉन्फ़िग उदाहरण
  - H2: अंतर्निहित कैटलॉग
  - H2: संबंधित

## providers/tencent.md

- मार्ग: /providers/tencent
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: गैर-इंटरैक्टिव सेटअप
  - H2: अंतर्निहित कैटलॉग
  - H2: स्तरित मूल्य निर्धारण
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/together.md

- मार्ग: /providers/together
- शीर्षक:
  - H2: शुरू करना
  - H3: गैर-इंटरैक्टिव उदाहरण
  - H2: अंतर्निहित कैटलॉग
  - H2: वीडियो जनरेशन
  - H2: संबंधित

## providers/venice.md

- मार्ग: /providers/venice
- शीर्षक:
  - H2: OpenClaw में Venice क्यों
  - H2: गोपनीयता मोड
  - H2: फ़ीचर
  - H2: शुरू करना
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

- मार्ग: /providers/vercel-ai-gateway
- शीर्षक:
  - H2: शुरू करना
  - H2: गैर-इंटरैक्टिव उदाहरण
  - H2: मॉडल ID शॉर्टहैंड
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: संबंधित

## providers/vllm.md

- मार्ग: /providers/vllm
- शीर्षक:
  - H2: शुरू करना
  - H2: मॉडल खोज (अंतर्निहित प्रदाता)
  - H2: स्पष्ट कॉन्फ़िगरेशन (मैनुअल मॉडल)
  - H2: उन्नत कॉन्फ़िगरेशन
  - H2: समस्या निवारण
  - H2: संबंधित

## providers/volcengine.md

- रूट: /providers/volcengine
- शीर्षक:
  - H2: शुरू करना
  - H2: Providers और endpoints
  - H2: अंतर्निहित catalog
  - H2: टेक्स्ट-टू-स्पीच
  - H2: उन्नत configuration
  - H2: संबंधित

## providers/vydra.md

- रूट: /providers/vydra
- शीर्षक:
  - H2: सेटअप
  - H2: क्षमताएं
  - H2: संबंधित

## providers/xai.md

- रूट: /providers/xai
- शीर्षक:
  - H2: अपना setup path चुनें
  - H2: OAuth troubleshooting
  - H2: अंतर्निहित catalog
  - H2: OpenClaw feature coverage
  - H3: Fast-mode mappings
  - H3: Legacy compatibility aliases
  - H2: Features
  - H2: Live testing
  - H2: संबंधित

## providers/xiaomi.md

- रूट: /providers/xiaomi
- शीर्षक:
  - H2: शुरू करना
  - H2: Pay-as-you-go catalog
  - H2: Token Plan catalog
  - H2: टेक्स्ट-टू-स्पीच
  - H2: Config example
  - H2: संबंधित

## providers/zai.md

- रूट: /providers/zai
- शीर्षक:
  - H2: GLM models
  - H2: शुरू करना
  - H2: Config example
  - H2: अंतर्निहित catalog
  - H2: उन्नत configuration
  - H2: संबंधित

## refactor/access.md

- रूट: /refactor/access
- शीर्षक: कोई नहीं

## refactor/acp.md

- रूट: /refactor/acp
- शीर्षक:
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: Target Model
  - H3: Gateway Instance Identity
  - H3: ACP Session Ownership
  - H3: ACPX Process Leases
  - H2: Lifecycle Controller
  - H2: Wrapper Contract
  - H2: Session Visibility Contract
  - H2: Migration Plan
  - H3: Phase 1: Add Identity And Leases
  - H3: Phase 2: Lease-First Cleanup
  - H3: Phase 3: Lease-First Startup Reaping
  - H3: Phase 4: Session Ownership Rows
  - H3: Phase 5: Remove Legacy Heuristics
  - H2: Tests
  - H2: Compatibility Notes
  - H2: Success Criteria

## refactor/canvas.md

- रूट: /refactor/canvas
- शीर्षक:
  - H1: Canvas plugin refactor
  - H2: लक्ष्य
  - H2: गैर-लक्ष्य
  - H2: Current branch state
  - H2: Target shape
  - H2: Migration steps
  - H2: Audit checklist
  - H2: Verification commands

## refactor/database-first.md

- रूट: /refactor/database-first
- शीर्षक:
  - H1: Database-First State Refactor
  - H2: निर्णय
  - H2: Hard Contract
  - H2: Goal state and progress
  - H3: Hard goal
  - H3: Goal states
  - H3: Current state
  - H3: Remaining work
  - H3: Do not regress
  - H2: Code-Read Assumptions
  - H2: Code-Read Findings
  - H2: Current Code Shape
  - H2: Target Schema Shape
  - H2: Doctor Migration Shape
  - H2: Migration Inventory
  - H2: Migration Plan
  - H3: Phase 0: Freeze The Boundary
  - H3: Phase 1: Finish The Global Control Plane
  - H3: Phase 2: Introduce Per-Agent Databases
  - H3: Phase 3: Replace Session Store APIs
  - H3: Phase 4: Move Transcripts, ACP Streams, Trajectories, And VFS
  - H3: Phase 5: Backup, Restore, Vacuum, And Verify
  - H3: Phase 6: Worker Runtime
  - H3: Phase 7: Delete The Old World
  - H2: Backup And Restore
  - H2: Runtime Refactor Plan
  - H2: Performance Rules
  - H2: Static Bans
  - H2: Done Criteria

## refactor/ingress-core.md

- रूट: /refactor/ingress-core
- शीर्षक:
  - H1: Ingress core deletion plan
  - H2: Budget
  - H2: Diagnosis
  - H2: Hotspots
  - H2: Current Code Read
  - H2: Boundary
  - H2: Acceptance Rule
  - H2: Work Packages
  - H2: Deletion Waves
  - H2: Do Not Move
  - H2: Verification
  - H2: Exit Criteria

## reference/AGENTS.default.md

- रूट: /reference/AGENTS.default
- शीर्षक:
  - H2: पहला रन (अनुशंसित)
  - H2: सुरक्षा defaults
  - H2: Existing solutions preflight
  - H2: Session start (required)
  - H2: Soul (required)
  - H2: Shared spaces (recommended)
  - H2: Memory system (recommended)
  - H2: Tools और skills
  - H2: Backup tip (recommended)
  - H2: OpenClaw क्या करता है
  - H2: Core skills (Settings → Skills में सक्षम करें)
  - H2: Usage notes
  - H2: संबंधित

## reference/RELEASING.md

- रूट: /reference/RELEASING
- शीर्षक:
  - H2: Version naming
  - H2: Release cadence
  - H2: Release operator checklist
  - H2: Stable main closeout
  - H2: Release preflight
  - H2: Release test boxes
  - H3: Vitest
  - H3: Docker
  - H3: QA Lab
  - H3: Package
  - H2: Release publish automation
  - H2: NPM workflow inputs
  - H2: Stable npm release sequence
  - H2: Public references
  - H2: संबंधित

## reference/api-usage-costs.md

- रूट: /reference/api-usage-costs
- शीर्षक:
  - H2: लागत कहां दिखाई देती है (chat + CLI)
  - H2: keys कैसे खोजी जाती हैं
  - H2: वे features जो keys खर्च कर सकते हैं
  - H3: 1) Core model responses (chat + tools)
  - H3: 2) Media understanding (audio/image/video)
  - H3: 3) Image and video generation
  - H3: 4) Memory embeddings + semantic search
  - H3: 5) Web search tool
  - H3: 5) Web fetch tool (Firecrawl)
  - H3: 6) Provider usage snapshots (status/health)
  - H3: 7) Compaction safeguard summarization
  - H3: 8) Model scan / probe
  - H3: 9) Talk (speech)
  - H3: 10) Skills (third-party APIs)
  - H2: संबंधित

## reference/application-modernization-plan.md

- रूट: /reference/application-modernization-plan
- शीर्षक:
  - H2: लक्ष्य
  - H2: सिद्धांत
  - H2: Phase 1: Baseline audit
  - H2: Phase 2: Product and UX cleanup
  - H2: Phase 3: Frontend architecture tightening
  - H2: Phase 4: Performance and reliability
  - H2: Phase 5: Type, contract, and test hardening
  - H2: Phase 6: Documentation and release readiness
  - H2: Recommended first slice
  - H2: Frontend skill update

## reference/code-mode.md

- रूट: /reference/code-mode
- शीर्षक:
  - H2: यह क्या है?
  - H2: यह अच्छा क्यों है?
  - H2: इसे कैसे सक्षम करें
  - H2: Technical tour
  - H2: Runtime status
  - H2: Scope
  - H2: Terms
  - H2: Configuration
  - H2: Activation
  - H2: Model-visible tools
  - H2: exec
  - H2: wait
  - H2: Guest runtime API
  - H2: Internal namespaces
  - H3: Registry lifecycle
  - H3: Registration shape
  - H3: Ownership and visibility
  - H3: Scope serialization rules
  - H3: Prompts
  - H3: Cleanup
  - H3: Test checklist
  - H2: Output API
  - H2: Tool catalog
  - H2: Tool Search interaction
  - H2: Tool names and collisions
  - H2: Nested tool execution
  - H2: Runtime state
  - H2: QuickJS-WASI runtime
  - H2: TypeScript
  - H2: Security boundary
  - H2: Error codes
  - H2: Telemetry
  - H2: Debugging
  - H2: Implementation layout
  - H2: Validation checklist
  - H2: E2E test plan
  - H2: संबंधित

## reference/credits.md

- रूट: /reference/credits
- शीर्षक:
  - H2: नाम
  - H2: श्रेय
  - H2: Core contributors
  - H2: License
  - H2: संबंधित

## reference/device-models.md

- रूट: /reference/device-models
- शीर्षक:
  - H2: Data source
  - H2: Updating the database
  - H2: संबंधित

## reference/full-release-validation.md

- रूट: /reference/full-release-validation
- शीर्षक:
  - H2: Top-level stages
  - H2: Release checks stages
  - H2: Docker release-path chunks
  - H2: Release profiles
  - H2: Full-only additions
  - H2: Focused reruns
  - H2: Evidence to keep
  - H2: Workflow files

## reference/memory-config.md

- रूट: /reference/memory-config
- शीर्षक:
  - H2: Provider selection
  - H3: Custom provider ids
  - H3: API key resolution
  - H2: Remote endpoint config
  - H2: Provider-specific config
  - H3: Inline embedding timeout
  - H2: Hybrid search config
  - H3: Full example
  - H2: Additional memory paths
  - H2: Multimodal memory (Gemini)
  - H2: Embedding cache
  - H2: Batch indexing
  - H2: Session memory search (experimental)
  - H2: SQLite vector acceleration (sqlite-vec)
  - H2: Index storage
  - H2: QMD backend config
  - H3: Full QMD example
  - H2: Dreaming
  - H3: User settings
  - H3: Example
  - H2: संबंधित

## reference/prompt-caching.md

- रूट: /reference/prompt-caching
- शीर्षक:
  - H2: Primary knobs
  - H3: cacheRetention (global default, model, and per-agent)
  - H3: contextPruning.mode: "cache-ttl"
  - H3: Heartbeat keep-warm
  - H2: Provider behavior
  - H3: Anthropic (direct API)
  - H3: OpenAI (direct API)
  - H3: Anthropic Vertex
  - H3: Amazon Bedrock
  - H3: OpenRouter models
  - H3: Other providers
  - H3: Google Gemini direct API
  - H3: Gemini CLI usage
  - H2: System-prompt cache boundary
  - H2: OpenClaw cache-stability guards
  - H2: Tuning patterns
  - H3: Mixed traffic (recommended default)
  - H3: Cost-first baseline
  - H2: Cache diagnostics
  - H2: Live regression tests
  - H3: Anthropic live expectations
  - H3: OpenAI live expectations
  - H3: diagnostics.cacheTrace config
  - H3: Env toggles (one-off debugging)
  - H3: What to inspect
  - H2: Quick troubleshooting
  - H2: संबंधित

## reference/release-performance-sweep.md

- रूट: /reference/release-performance-sweep
- शीर्षक:
  - H2: Snapshot
  - H2: Install Footprint Timeline
  - H2: What Changed In 5.28
  - H2: Headline Numbers
  - H3: Install footprint
  - H3: npm package size
  - H2: Kova agent turn summary
  - H2: Source probes
  - H2: Install footprint audit
  - H3: Shrinkwrap boundary
  - H2: Supply-chain interpretation

## reference/rich-output-protocol.md

- रूट: /reference/rich-output-protocol
- शीर्षक:
  - H2: [embed ...]
  - H2: Stored rendering shape
  - H2: संबंधित

## reference/rpc.md

- रूट: /reference/rpc
- शीर्षक:
  - H2: Pattern A: HTTP daemon (signal-cli)
  - H2: Pattern B: stdio child process (imsg)
  - H2: Adapter guidelines
  - H2: संबंधित

## reference/secret-placeholder-conventions.md

- रूट: /reference/secret-placeholder-conventions
- शीर्षक:
  - H1: Secret placeholder conventions
  - H2: Recommended style
  - H2: Avoid these patterns in docs
  - H2: Example

## reference/secretref-credential-surface.md

- रूट: /reference/secretref-credential-surface
- शीर्षक:
  - H2: Supported credentials
  - H3: openclaw.json targets (secrets configure + secrets apply + secrets audit)
  - H3: auth-profiles.json targets (secrets configure + secrets apply + secrets audit)
  - H2: Unsupported credentials
  - H2: संबंधित

## reference/session-management-compaction.md

- रूट: /reference/session-management-compaction
- शीर्षक:
  - H2: Source of truth: the Gateway
  - H2: Two persistence layers
  - H2: On-disk locations
  - H2: Store maintenance and disk controls
  - H2: Cron sessions and run logs
  - H2: Session keys (sessionKey)
  - H2: Session ids (sessionId)
  - H2: Session store schema (sessions.json)
  - H2: Transcript structure (.jsonl)
  - H2: Context windows vs tracked tokens
  - H2: Compaction: what it is
  - H2: Compaction chunk boundaries and tool pairing
  - H2: When auto-compaction happens (OpenClaw runtime)
  - H2: Compaction settings (reserveTokens, keepRecentTokens)
  - H2: Pluggable compaction providers
  - H2: User-visible surfaces
  - H2: Silent housekeeping (NOREPLY)
  - H2: Pre-compaction "memory flush" (implemented)
  - H2: Troubleshooting checklist
  - H2: संबंधित

## reference/templates/AGENTS.dev.md

- रूट: /reference/templates/AGENTS.dev
- शीर्षक:
  - H1: AGENTS.md - OpenClaw Workspace
  - H2: First run (one-time)
  - H2: Backup tip (recommended)
  - H2: Safety defaults
  - H2: Existing solutions preflight
  - H2: Daily memory (recommended)
  - H2: Heartbeats (optional)
  - H2: Customize
  - H2: C-3PO Origin Memory
  - H3: Birth Day: 2026-01-09
  - H3: Core Truths (from Clawd)
  - H2: संबंधित

## reference/templates/BOOT.md

- रूट: /reference/templates/BOOT
- शीर्षक:
  - H1: BOOT.md
  - H2: संबंधित

## reference/templates/BOOTSTRAP.md

- रूट: /reference/templates/BOOTSTRAP
- शीर्षक:
  - H1: BOOTSTRAP.md - Hello, World
  - H2: The Conversation
  - H2: After You Know Who You Are
  - H2: Connect (Optional)
  - H2: When you are done
  - H2: संबंधित

## reference/templates/HEARTBEAT.md

- रूट: /reference/templates/HEARTBEAT
- शीर्षक:
  - H1: HEARTBEAT.md template
  - H2: संबंधित

## reference/templates/IDENTITY.dev.md

- रूट: /reference/templates/IDENTITY.dev
- शीर्षक:
  - H1: IDENTITY.md - Agent Identity
  - H2: Role
  - H2: Soul
  - H2: Relationship with Clawd
  - H2: Quirks
  - H2: Catchphrase
  - H2: संबंधित

## reference/templates/IDENTITY.md

- रूट: /reference/templates/IDENTITY
- शीर्षक:
  - H1: IDENTITY.md - Who Am I?
  - H2: संबंधित

## reference/templates/SOUL.dev.md

- मार्ग: /reference/templates/SOUL.dev
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

- रूट: /tools/acp-agents-setup
- शीर्षक:
  - H2: acpx हार्नेस समर्थन (वर्तमान)
  - H2: आवश्यक कॉन्फिग
  - H2: acpx बैकएंड के लिए Plugin सेटअप
  - H3: acpx कमांड और संस्करण कॉन्फिगरेशन
  - H3: स्वचालित डिपेंडेंसी इंस्टॉल
  - H3: Plugin टूल्स MCP ब्रिज
  - H3: OpenClaw टूल्स MCP ब्रिज
  - H3: रनटाइम ऑपरेशन टाइमआउट कॉन्फिगरेशन
  - H3: हेल्थ प्रोब एजेंट कॉन्फिगरेशन
  - H2: अनुमति कॉन्फिगरेशन
  - H3: permissionMode
  - H3: nonInteractivePermissions
  - H3: कॉन्फिगरेशन
  - H2: संबंधित

## tools/acp-agents.md

- रूट: /tools/acp-agents
- शीर्षक:
  - H2: मुझे कौन-सा पेज चाहिए?
  - H2: क्या यह बिना अतिरिक्त सेटअप के काम करता है?
  - H2: समर्थित हार्नेस लक्ष्य
  - H2: ऑपरेटर रनबुक
  - H2: ACP बनाम सब-एजेंट
  - H2: ACP Claude Code कैसे चलाता है
  - H2: बाउंड सेशन
  - H3: मानसिक मॉडल
  - H3: मौजूदा बातचीत बाइंड
  - H2: स्थायी चैनल बाइंडिंग
  - H3: बाइंडिंग मॉडल
  - H3: प्रति एजेंट रनटाइम डिफॉल्ट
  - H3: उदाहरण
  - H3: व्यवहार
  - H2: ACP सेशन शुरू करें
  - H3: sessionsspawn पैरामीटर
  - H2: स्पॉन बाइंड और थ्रेड मोड
  - H2: डिलीवरी मॉडल
  - H2: सैंडबॉक्स संगतता
  - H2: सेशन लक्ष्य समाधान
  - H2: ACP नियंत्रण
  - H3: रनटाइम विकल्प मैपिंग
  - H2: acpx हार्नेस, Plugin सेटअप, और अनुमतियां
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/agent-send.md

- रूट: /tools/agent-send
- शीर्षक:
  - H2: क्विक स्टार्ट
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
  - H2: कॉन्फिग उदाहरण
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
  - H2: CLI क्विक रेफरेंस
  - H2: स्नैपशॉट और रेफ
  - H2: प्रतीक्षा पावर-अप
  - H2: डीबग वर्कफ़्लो
  - H2: JSON आउटपुट
  - H2: स्टेट और एनवायरनमेंट नॉब
  - H2: सुरक्षा और गोपनीयता
  - H2: संबंधित

## tools/browser-linux-troubleshooting.md

- रूट: /tools/browser-linux-troubleshooting
- शीर्षक:
  - H2: समस्या: "Failed to start Chrome CDP on port 18800"
  - H3: मूल कारण
  - H3: समाधान 1: Google Chrome इंस्टॉल करें (अनुशंसित)
  - H3: समाधान 2: Snap Chromium को Attach-Only Mode के साथ उपयोग करें
  - H3: सत्यापित करना कि ब्राउज़र काम करता है
  - H3: कॉन्फिग रेफरेंस
  - H3: समस्या: "No Chrome tabs found for profile=\"user\""
  - H2: संबंधित

## tools/browser-login.md

- रूट: /tools/browser-login
- शीर्षक:
  - H2: मैनुअल लॉगिन (अनुशंसित)
  - H2: कौन-सी Chrome प्रोफ़ाइल उपयोग होती है?
  - H2: X/Twitter: अनुशंसित फ्लो
  - H2: सैंडबॉक्सिंग + होस्ट ब्राउज़र एक्सेस
  - H2: संबंधित

## tools/browser-wsl2-windows-remote-cdp-troubleshooting.md

- रूट: /tools/browser-wsl2-windows-remote-cdp-troubleshooting
- शीर्षक:
  - H2: पहले सही ब्राउज़र मोड चुनें
  - H3: विकल्प 1: WSL2 से Windows तक रॉ रिमोट CDP
  - H3: विकल्प 2: होस्ट-लोकल Chrome MCP
  - H2: कार्यशील आर्किटेक्चर
  - H2: यह सेटअप भ्रमित क्यों करता है
  - H2: Control UI के लिए महत्वपूर्ण नियम
  - H2: परतों में सत्यापित करें
  - H3: परत 1: सत्यापित करें कि Chrome Windows पर CDP सर्व कर रहा है
  - H3: परत 2: सत्यापित करें कि WSL2 उस Windows एंडपॉइंट तक पहुंच सकता है
  - H3: परत 3: सही ब्राउज़र प्रोफ़ाइल कॉन्फिगर करें
  - H3: परत 4: Control UI परत को अलग से सत्यापित करें
  - H3: परत 5: एंड-टू-एंड ब्राउज़र नियंत्रण सत्यापित करें
  - H2: आम भ्रामक त्रुटियां
  - H2: तेज़ ट्रायेज चेकलिस्ट
  - H2: व्यावहारिक निष्कर्ष
  - H2: संबंधित

## tools/browser.md

- रूट: /tools/browser
- शीर्षक:
  - H2: आपको क्या मिलता है
  - H2: क्विक स्टार्ट
  - H2: Plugin नियंत्रण
  - H2: एजेंट मार्गदर्शन
  - H2: ब्राउज़र कमांड या टूल अनुपस्थित
  - H2: प्रोफ़ाइल: openclaw बनाम user
  - H2: कॉन्फिगरेशन
  - H3: स्क्रीनशॉट विज़न (केवल-पाठ मॉडल समर्थन)
  - H2: Brave या कोई अन्य Chromium-आधारित ब्राउज़र उपयोग करें
  - H2: लोकल बनाम रिमोट नियंत्रण
  - H2: Node ब्राउज़र प्रॉक्सी (शून्य-कॉन्फिग डिफॉल्ट)
  - H2: Browserless (होस्टेड रिमोट CDP)
  - H3: उसी होस्ट पर Browserless Docker
  - H2: डायरेक्ट WebSocket CDP प्रदाता
  - H3: Browserbase
  - H3: Notte
  - H2: सुरक्षा
  - H2: प्रोफ़ाइल (मल्टी-ब्राउज़र)
  - H2: Chrome DevTools MCP के ज़रिए मौजूदा सेशन
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
  - H2: सरफेस व्यवहार
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
  - H2: त्रुटियां
  - H2: सीमाएं
  - H2: संबंधित

## tools/creating-skills.md

- रूट: /tools/creating-skills
- शीर्षक:
  - H2: अपना पहला skill बनाएं
  - H2: SKILL.md रेफरेंस
  - H3: आवश्यक फ़ील्ड
  - H3: वैकल्पिक frontmatter कुंजियां
  - H3: {baseDir} का उपयोग
  - H2: सशर्त सक्रियण जोड़ना
  - H2: Skill Workshop के ज़रिए प्रस्ताव करें
  - H2: ClawHub पर प्रकाशित करना
  - H2: श्रेष्ठ अभ्यास
  - H2: संबंधित

## tools/diffs.md

- रूट: /tools/diffs
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: बिल्ट-इन सिस्टम मार्गदर्शन अक्षम करें
  - H2: सामान्य एजेंट वर्कफ़्लो
  - H2: इनपुट उदाहरण
  - H2: टूल इनपुट रेफरेंस
  - H2: सिंटैक्स हाइलाइटिंग
  - H2: आउटपुट विवरण कॉन्ट्रैक्ट
  - H2: संकुचित अपरिवर्तित सेक्शन
  - H2: Plugin डिफॉल्ट
  - H3: स्थायी व्यूअर URL कॉन्फिग
  - H2: सुरक्षा कॉन्फिग
  - H2: आर्टिफैक्ट लाइफ़साइकल और स्टोरेज
  - H2: व्यूअर URL और नेटवर्क व्यवहार
  - H2: सुरक्षा मॉडल
  - H2: फ़ाइल मोड के लिए ब्राउज़र आवश्यकताएं
  - H2: समस्या निवारण
  - H2: संचालन मार्गदर्शन
  - H2: संबंधित

## tools/duckduckgo-search.md

- रूट: /tools/duckduckgo-search
- शीर्षक:
  - H2: सेटअप
  - H2: कॉन्फिग
  - H2: टूल पैरामीटर
  - H2: नोट्स
  - H2: संबंधित

## tools/elevated.md

- रूट: /tools/elevated
- शीर्षक:
  - H2: निर्देश
  - H2: यह कैसे काम करता है
  - H2: समाधान क्रम
  - H2: उपलब्धता और allowlist
  - H2: elevated क्या नियंत्रित नहीं करता
  - H2: संबंधित

## tools/exa-search.md

- रूट: /tools/exa-search
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: API कुंजी प्राप्त करें
  - H2: कॉन्फिग
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
  - H3: Argv सत्यापन और अस्वीकृत फ्लैग
  - H3: विश्वसनीय बाइनरी डायरेक्टरी
  - H3: शेल चेनिंग, रैपर, और मल्टीप्लेक्सर
  - H3: सुरक्षित बिन बनाम allowlist
  - H2: इंटरप्रेटर/रनटाइम कमांड
  - H3: फ़ॉलोअप डिलीवरी व्यवहार
  - H2: चैट चैनलों को अनुमोदन फ़ॉरवर्डिंग
  - H3: Plugin अनुमोदन फ़ॉरवर्डिंग
  - H3: किसी भी चैनल पर समान-चैट अनुमोदन
  - H3: नेटिव अनुमोदन डिलीवरी
  - H3: macOS IPC फ्लो
  - H2: FAQ
  - H3: अनुमोदन लक्ष्य पर accountId और threadId कब उपयोग किए जाएंगे?
  - H3: जब अनुमोदन किसी सेशन को भेजे जाते हैं, तो क्या उस सेशन में कोई भी उन्हें अनुमोदित कर सकता है?
  - H2: संबंधित

## tools/exec-approvals.md

- रूट: /tools/exec-approvals
- शीर्षक:
  - H2: प्रभावी नीति का निरीक्षण
  - H2: यह कहां लागू होता है
  - H3: ट्रस्ट मॉडल
  - H3: macOS विभाजन
  - H2: सेटिंग और स्टोरेज
  - H2: नीति नॉब
  - H3: tools.exec.mode
  - H3: exec.security
  - H3: exec.ask
  - H3: askFallback
  - H3: tools.exec.strictInlineEval
  - H3: tools.exec.commandHighlighting
  - H2: YOLO मोड (बिना अनुमोदन)
  - H3: स्थायी gateway-host "never prompt" सेटअप
  - H3: लोकल शॉर्टकट
  - H3: Node होस्ट
  - H3: केवल-सेशन शॉर्टकट
  - H2: Allowlist (प्रति एजेंट)
  - H3: argPattern के साथ आर्ग्युमेंट प्रतिबंधित करना
  - H2: skill CLI को ऑटो-अलाउ करें
  - H2: सुरक्षित बिन और अनुमोदन फ़ॉरवर्डिंग
  - H2: Control UI संपादन
  - H2: अनुमोदन फ्लो
  - H2: सिस्टम इवेंट
  - H2: अस्वीकृत अनुमोदन व्यवहार
  - H2: निहितार्थ
  - H2: संबंधित

## tools/exec.md

- रूट: /tools/exec
- शीर्षक:
  - H2: पैरामीटर
  - H2: कॉन्फिग
  - H3: PATH हैंडलिंग
  - H2: सेशन ओवरराइड (/exec)
  - H2: प्राधिकरण मॉडल
  - H2: Exec अनुमोदन (कम्पैनियन ऐप / node होस्ट)
  - H2: Allowlist + सुरक्षित बिन
  - H2: उदाहरण
  - H2: applypatch
  - H2: संबंधित

## tools/firecrawl.md

- रूट: /tools/firecrawl
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: बिना कुंजी webfetch और API कुंजियां
  - H2: Firecrawl खोज कॉन्फिगर करें
  - H2: Firecrawl webfetch फ़ॉलबैक कॉन्फिगर करें
  - H3: सेल्फ-होस्टेड Firecrawl
  - H2: Firecrawl Plugin टूल्स
  - H3: firecrawlsearch
  - H3: firecrawlscrape
  - H2: Stealth / बॉट परिहार
  - H2: webfetch Firecrawl का उपयोग कैसे करता है
  - H2: संबंधित

## tools/gemini-search.md

- रूट: /tools/gemini-search
- शीर्षक:
  - H2: API कुंजी प्राप्त करें
  - H2: कॉन्फिग
  - H2: यह कैसे काम करता है
  - H2: समर्थित पैरामीटर
  - H2: मॉडल चयन
  - H2: बेस URL ओवरराइड
  - H2: संबंधित

## tools/goal.md

- रूट: /tools/goal
- शीर्षक:
  - H1: लक्ष्य
  - H2: क्विक स्टार्ट
  - H2: लक्ष्य किसलिए हैं
  - H2: कमांड रेफरेंस
  - H2: स्थितियां
  - H2: टोकन बजट
  - H2: मॉडल टूल्स
  - H2: TUI
  - H2: चैनल व्यवहार
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/grok-search.md

- रूट: /tools/grok-search
- शीर्षक:
  - H2: ऑनबोर्डिंग और कॉन्फिगर
  - H2: साइन इन करें या API कुंजी प्राप्त करें
  - H2: कॉन्फिग
  - H2: यह कैसे काम करता है
  - H2: समर्थित पैरामीटर
  - H2: बेस URL ओवरराइड
  - H2: संबंधित

## tools/image-generation.md

- रूट: /tools/image-generation
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: सामान्य रूट
  - H2: समर्थित प्रदाता
  - H2: प्रदाता क्षमताएं
  - H2: टूल पैरामीटर
  - H2: कॉन्फिगरेशन
  - H3: मॉडल चयन
  - H3: प्रदाता चयन क्रम
  - H3: इमेज संपादन
  - H2: प्रदाता गहन विवरण
  - H2: उदाहरण
  - H2: संबंधित

## tools/index.md

- रूट: /tools
- शीर्षक:
  - H2: यहां से शुरू करें
  - H2: टूल्स, skills, या plugins चुनें
  - H2: बिल्ट-इन टूल श्रेणियां
  - H2: Plugin-प्रदान किए गए टूल्स
  - H2: एक्सेस और अनुमोदन कॉन्फिगर करें
  - H2: क्षमताएं विस्तारित करें
  - H2: अनुपस्थित टूल्स का समस्या निवारण
  - H2: संबंधित

## tools/kimi-search.md

- रूट: /tools/kimi-search
- शीर्षक:
  - H2: API कुंजी प्राप्त करें
  - H2: कॉन्फिग
  - H2: यह कैसे काम करता है
  - H2: समर्थित पैरामीटर
  - H2: संबंधित

## tools/llm-task.md

- रूट: /tools/llm-task
- शीर्षक:
  - H2: Plugin सक्षम करें
  - H2: कॉन्फिग (वैकल्पिक)
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
  - H2: सादे प्रोग्राम के बजाय DSL क्यों?
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
  - H2: आउटपुट एनवलप
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
  - H2: कॉन्फिगरेशन ब्लॉक
  - H3: फ़ील्ड व्यवहार
  - H2: अनुशंसित सेटअप
  - H2: पोस्ट-Compaction गार्ड
  - H2: लॉग और अपेक्षित व्यवहार
  - H2: संबंधित

## tools/media-overview.md

- रूट: /tools/media-overview
- शीर्षक:
  - H2: क्षमताएं
  - H2: प्रदाता क्षमता मैट्रिक्स
  - H2: असिंक्रोनस बनाम सिंक्रोनस
  - H2: स्पीच-टू-टेक्स्ट और वॉयस कॉल
  - H2: प्रदाता मैपिंग (विक्रेता सतहों में कैसे बंटते हैं)
  - H2: संबंधित

## tools/minimax-search.md

- रूट: /tools/minimax-search
- शीर्षक:
  - H2: Token Plan क्रेडेंशियल प्राप्त करें
  - H2: कॉन्फ़िगरेशन
  - H2: क्षेत्र चयन
  - H2: समर्थित पैरामीटर
  - H2: संबंधित

## tools/multi-agent-sandbox-tools.md

- रूट: /tools/multi-agent-sandbox-tools
- शीर्षक:
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H2: कॉन्फ़िगरेशन प्राथमिकता
  - H3: Sandbox कॉन्फ़िगरेशन
  - H3: टूल प्रतिबंध
  - H2: एकल एजेंट से माइग्रेशन
  - H2: टूल प्रतिबंध उदाहरण
  - H2: सामान्य चूक: "non-main"
  - H2: परीक्षण
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/music-generation.md

- रूट: /tools/music-generation
- शीर्षक:
  - H2: क्विक स्टार्ट
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
  - H2: कॉन्फ़िगरेशन
  - H2: नोट्स
  - H2: संबंधित

## tools/parallel-search.md

- रूट: /tools/parallel-search
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: API कुंजी (भुगतान वाला प्रदाता)
  - H2: कॉन्फ़िगरेशन
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
  - H2: कॉन्फ़िगरेशन
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
  - H2: ACPX हार्नेस अनुमतियां
  - H2: मोड चुनना
  - H2: संबंधित

## tools/perplexity-search.md

- रूट: /tools/perplexity-search
- शीर्षक:
  - H2: Plugin इंस्टॉल करें
  - H2: Perplexity API कुंजी प्राप्त करना
  - H2: OpenRouter संगतता
  - H2: कॉन्फ़िगरेशन उदाहरण
  - H3: नेटिव Perplexity Search API
  - H3: OpenRouter / Sonar संगतता
  - H2: कुंजी कहां सेट करें
  - H2: टूल पैरामीटर
  - H3: डोमेन फ़िल्टर नियम
  - H2: नोट्स
  - H2: संबंधित

## tools/plugin.md

- रूट: /tools/plugin
- शीर्षक:
  - H2: आवश्यकताएं
  - H2: क्विक स्टार्ट
  - H2: कॉन्फ़िगरेशन
  - H3: इंस्टॉल स्रोत चुनें
  - H3: ऑपरेटर इंस्टॉल नीति
  - H3: Plugin नीति कॉन्फ़िगर करें
  - H2: Plugin प्रारूपों को समझें
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
  - H2: कॉन्फ़िगरेशन
  - H2: पर्यावरण चर
  - H2: Plugin कॉन्फ़िगरेशन संदर्भ
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
  - H2: समर्थन फ़ाइलें
  - H2: एजेंट टूल
  - H2: स्वीकृति और स्वायत्तता
  - H2: Gateway विधियां
  - H2: स्टोरेज
  - H2: सीमाएं
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/skills-config.md

- रूट: /tools/skills-config
- शीर्षक:
  - H2: लोडिंग (skills.load)
  - H2: इंस्टॉल (skills.install)
  - H2: ऑपरेटर इंस्टॉल नीति (security.installPolicy)
  - H2: बंडल Skills allowlist
  - H2: प्रति-Skill प्रविष्टियां (skills.entries)
  - H2: एजेंट allowlists (agents)
  - H2: वर्कशॉप (skills.workshop)
  - H2: Symlink किए गए Skill रूट
  - H2: Sandboxed Skills और env vars
  - H2: लोडिंग क्रम रिमाइंडर
  - H2: संबंधित

## tools/skills.md

- रूट: /tools/skills
- शीर्षक:
  - H2: लोडिंग क्रम
  - H2: प्रति-एजेंट बनाम साझा Skills
  - H2: एजेंट allowlists
  - H2: Plugins और Skills
  - H2: Skill Workshop
  - H2: ClawHub से इंस्टॉल करना
  - H2: सुरक्षा
  - H2: SKILL.md प्रारूप
  - H3: वैकल्पिक frontmatter कुंजियां
  - H2: गेटिंग
  - H3: इंस्टॉलर विनिर्देश
  - H2: कॉन्फ़िगरेशन ओवरराइड
  - H2: पर्यावरण इंजेक्शन
  - H2: स्नैपशॉट और रिफ्रेश
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
  - H3: बंडल Plugin कमांड
  - H3: Skill कमांड
  - H2: /tools — एजेंट अभी क्या उपयोग कर सकता है
  - H2: /model — मॉडल चयन
  - H2: /config — ऑन-डिस्क कॉन्फ़िगरेशन लेखन
  - H2: /mcp — MCP सर्वर कॉन्फ़िगरेशन
  - H2: /debug — केवल-runtime ओवरराइड
  - H2: /plugins — Plugin प्रबंधन
  - H2: /trace — Plugin ट्रेस आउटपुट
  - H2: /btw — साइड प्रश्न
  - H2: सतह नोट्स
  - H2: प्रदाता उपयोग और स्थिति
  - H2: संबंधित

## tools/steer.md

- रूट: /tools/steer
- शीर्षक:
  - H2: वर्तमान सत्र
  - H2: Steer बनाम queue
  - H2: उप-एजेंट
  - H2: ACP सत्र
  - H2: संबंधित

## tools/subagents.md

- रूट: /tools/subagents
- शीर्षक:
  - H2: Slash command
  - H3: Thread binding controls
  - H3: Spawn behavior
  - H2: Context modes
  - H2: टूल: sessionsspawn
  - H3: Delegation prompt mode
  - H3: टूल पैरामीटर
  - H3: Task names and targeting
  - H2: टूल: sessionsyield
  - H2: टूल: subagents
  - H2: Thread-bound sessions
  - H3: Thread supporting channels
  - H3: Quick flow
  - H3: Manual controls
  - H3: Config switches
  - H3: Allowlist
  - H3: Discovery
  - H3: Auto-archive
  - H2: Nested sub-agents
  - H3: Depth levels
  - H3: Announce chain
  - H3: Tool policy by depth
  - H3: Per-agent spawn limit
  - H3: Cascade stop
  - H2: Authentication
  - H2: Announce
  - H3: Announce context
  - H3: Stats line
  - H3: Why prefer sessionshistory
  - H2: Tool policy
  - H3: Override via config
  - H2: Concurrency
  - H2: Liveness and recovery
  - H2: Stopping
  - H2: Limitations
  - H2: संबंधित

## tools/tavily.md

- रूट: /tools/tavily
- शीर्षक:
  - H2: शुरुआत करना
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
  - H2: एजेंट द्वारा लागू करना
  - H2: तेज मोड (/fast)
  - H2: विस्तृत निर्देश (/verbose या /v)
  - H2: Plugin ट्रेस निर्देश (/trace)
  - H2: Reasoning दृश्यता (/reasoning)
  - H2: संबंधित
  - H2: Heartbeats
  - H2: वेब चैट UI
  - H2: प्रदाता प्रोफ़ाइल

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
  - H2: टर्न कैसे चलता है
  - H2: मोड
  - H2: यह क्यों मौजूद है
  - H2: API
  - H2: Runtime boundary
  - H2: कॉन्फ़िगरेशन
  - H2: Prompt and telemetry
  - H2: E2E validation
  - H2: Failure behavior
  - H2: संबंधित

## tools/trajectory.md

- रूट: /tools/trajectory
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: पहुंच
  - H2: क्या रिकॉर्ड किया जाता है
  - H2: बंडल फ़ाइलें
  - H2: कैप्चर स्थान
  - H2: कैप्चर अक्षम करें
  - H2: फ्लश टाइमआउट ट्यून करें
  - H2: गोपनीयता और सीमाएं
  - H2: समस्या निवारण
  - H2: संबंधित

## tools/tts.md

- रूट: /tools/tts
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: समर्थित प्रदाता
  - H2: कॉन्फ़िगरेशन
  - H3: प्रति-एजेंट वॉइस ओवरराइड
  - H2: व्यक्तित्व
  - H3: न्यूनतम व्यक्तित्व
  - H3: पूर्ण व्यक्तित्व (प्रदाता-तटस्थ प्रॉम्प्ट)
  - H3: व्यक्तित्व समाधान
  - H3: प्रदाता व्यक्तित्व प्रॉम्प्ट का उपयोग कैसे करते हैं
  - H3: फ़ॉलबैक नीति
  - H2: मॉडल-चालित निर्देश
  - H2: Slash commands
  - H2: प्रति-उपयोगकर्ता प्राथमिकताएं
  - H2: आउटपुट प्रारूप (निश्चित)
  - H2: Auto-TTS व्यवहार
  - H2: चैनल के अनुसार आउटपुट प्रारूप
  - H2: फ़ील्ड संदर्भ
  - H2: एजेंट टूल
  - H2: Gateway RPC
  - H2: सेवा लिंक
  - H2: संबंधित

## tools/video-generation.md

- रूट: /tools/video-generation
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: असिंक्रोनस जनरेशन कैसे काम करता है
  - H3: कार्य जीवनचक्र
  - H2: समर्थित प्रदाता
  - H3: क्षमता मैट्रिक्स
  - H2: टूल पैरामीटर
  - H3: आवश्यक
  - H3: सामग्री इनपुट
  - H3: शैली नियंत्रण
  - H3: उन्नत
  - H4: फ़ॉलबैक और typed विकल्प
  - H2: कार्रवाइयां
  - H2: मॉडल चयन
  - H2: प्रदाता नोट्स
  - H2: प्रदाता क्षमता मोड
  - H2: लाइव परीक्षण
  - H2: कॉन्फ़िगरेशन
  - H2: संबंधित

## tools/web-fetch.md

- रूट: /tools/web-fetch
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: टूल पैरामीटर
  - H2: यह कैसे काम करता है
  - H2: प्रगति अपडेट
  - H2: कॉन्फ़िगरेशन
  - H2: Firecrawl फ़ॉलबैक
  - H2: विश्वसनीय env प्रॉक्सी
  - H2: सीमाएं और सुरक्षा
  - H2: टूल प्रोफ़ाइल
  - H2: संबंधित

## tools/web.md

- रूट: /tools/web
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H2: प्रदाता चुनना
  - H3: प्रदाता तुलना
  - H2: ऑटो-डिटेक्शन
  - H2: नेटिव OpenAI वेब खोज
  - H2: नेटिव Codex वेब खोज
  - H2: नेटवर्क सुरक्षा
  - H2: वेब खोज सेट करना
  - H2: कॉन्फ़िगरेशन
  - H3: API कुंजियां संग्रहीत करना
  - H2: टूल पैरामीटर
  - H2: xsearch
  - H3: xsearch कॉन्फ़िगरेशन
  - H3: xsearch पैरामीटर
  - H3: xsearch उदाहरण
  - H2: उदाहरण
  - H2: टूल प्रोफ़ाइल
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
  - H2: पहले व्यवस्थापक पहुंच को मजबूत करें
  - H2: VPS पर साझा कंपनी एजेंट
  - H2: VPS के साथ नोड्स का उपयोग करना
  - H2: छोटे VM और ARM होस्ट के लिए स्टार्टअप ट्यूनिंग
  - H3: systemd ट्यूनिंग चेकलिस्ट (वैकल्पिक)
  - H2: संबंधित

## web/control-ui.md

- रूट: /web/control-ui
- शीर्षक:
  - H2: क्विक ओपन (स्थानीय)
  - H2: डिवाइस पेयरिंग (पहला कनेक्शन)
  - H2: व्यक्तिगत पहचान (ब्राउज़र-स्थानीय)
  - H2: Runtime config endpoint
  - H2: भाषा समर्थन
  - H2: Appearance themes
  - H2: यह क्या कर सकता है (आज)
  - H2: MCP पेज
  - H2: Activity tab
  - H2: Chat behavior
  - H2: PWA इंस्टॉल और वेब पुश
  - H2: Hosted embeds
  - H2: चैट संदेश चौड़ाई
  - H2: Tailnet एक्सेस (अनुशंसित)
  - H2: असुरक्षित HTTP
  - H2: Content security policy
  - H2: Avatar route auth
  - H2: Assistant media route auth
  - H2: UI बनाना
  - H2: खाली Control UI पेज
  - H2: Debugging/testing: dev server + remote Gateway
  - H2: संबंधित

## web/dashboard.md

- रूट: /web/dashboard
- शीर्षक:
  - H2: Fast path (अनुशंसित)
  - H2: Auth basics (स्थानीय बनाम रिमोट)
  - H2: अगर आपको "unauthorized" / 1008 दिखे
  - H2: संबंधित

## web/index.md

- रूट: /web
- शीर्षक:
  - H2: Webhooks
  - H2: Admin HTTP RPC
  - H2: कॉन्फ़िगरेशन (डिफ़ॉल्ट-ऑन)
  - H2: Tailscale एक्सेस
  - H3: Integrated Serve (अनुशंसित)
  - H3: Tailnet bind + token
  - H3: सार्वजनिक इंटरनेट (Funnel)
  - H2: सुरक्षा नोट्स
  - H2: UI बनाना

## web/tui.md

- रूट: /web/tui
- शीर्षक:
  - H2: क्विक स्टार्ट
  - H3: Gateway मोड
  - H3: स्थानीय मोड
  - H2: आपको क्या दिखाई देता है
  - H2: मानसिक मॉडल: एजेंट + सत्र
  - H2: भेजना + डिलीवरी
  - H2: पिकर + ओवरले
  - H2: कीबोर्ड शॉर्टकट
  - H2: Slash commands
  - H2: स्थानीय शेल कमांड
  - H2: स्थानीय TUI से कॉन्फ़िगरेशन सुधारें
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
  - H2: क्विक स्टार्ट
  - H2: यह कैसे काम करता है (व्यवहार)
  - H3: ट्रांसक्रिप्ट और डिलीवरी मॉडल
  - H2: Control UI एजेंट टूल्स पैनल
  - H2: रिमोट उपयोग
  - H2: कॉन्फ़िगरेशन संदर्भ (WebChat)
  - H2: संबंधित
