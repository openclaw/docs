---
read_when:
    - सही `openclaw` उपकमांड ढूँढना
    - वैश्विक फ़्लैग या आउटपुट शैली नियम देखना
summary: 'OpenClaw CLI अनुक्रमणिका: कमांड सूची, वैश्विक फ़्लैग, और प्रति-कमांड पृष्ठों के लिंक'
title: CLI संदर्भ
x-i18n:
    generated_at: "2026-06-28T22:49:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7075c072fed0abf0ffa126bde01042adaf94f8ba4dffa9fef6dc99a6ab34eb43
    source_path: cli/index.md
    workflow: 16
---

`openclaw` मुख्य CLI प्रवेश बिंदु है। प्रत्येक कोर कमांड का या तो एक
समर्पित संदर्भ पृष्ठ है या उसे उस कमांड के साथ दस्तावेजीकृत किया गया है जिसका वह उपनाम है; यह
अनुक्रमणिका कमांड, वैश्विक फ़्लैग, और आउटपुट स्टाइलिंग नियम सूचीबद्ध करती है जो
पूरे CLI पर लागू होते हैं।

सेटअप कमांड का उपयोग उद्देश्य के अनुसार करें:

- `openclaw setup` पूर्ण निर्देशित ऑनबोर्डिंग प्रवाह से गुज़रे बिना आधारभूत कॉन्फ़िग और कार्यक्षेत्र बनाता है।
- `openclaw onboard` gateway, मॉडल auth, कार्यक्षेत्र, चैनल, Skills, और स्वास्थ्य के लिए पूर्ण निर्देशित प्रथम-रन पथ है।
- `openclaw configure` मौजूदा सेटअप के लक्षित हिस्सों को बदलता है, जैसे मॉडल auth, gateway, चैनल, plugins, या skills।
- `openclaw channels add` आधारभूत सेटअप मौजूद होने के बाद चैनल खातों को कॉन्फ़िगर करता है; निर्देशित चैनल सेटअप के लिए इसे बिना फ़्लैग चलाएँ या स्क्रिप्ट के लिए चैनल-विशिष्ट फ़्लैग के साथ चलाएँ।

## कमांड पृष्ठ

| क्षेत्र                 | कमांड                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| सेटअप और ऑनबोर्डिंग | [`crestodian`](/hi/cli/crestodian) · [`setup`](/hi/cli/setup) · [`onboard`](/hi/cli/onboard) · [`configure`](/hi/cli/configure) · [`config`](/hi/cli/config) · [`completion`](/hi/cli/completion) · [`doctor`](/hi/cli/doctor) · [`dashboard`](/hi/cli/dashboard) |
| रीसेट और अनइंस्टॉल  | [`backup`](/hi/cli/backup) · [`reset`](/hi/cli/reset) · [`uninstall`](/hi/cli/uninstall) · [`update`](/hi/cli/update)                                                                                                                                 |
| मैसेजिंग और एजेंट | [`message`](/hi/cli/message) · [`agent`](/hi/cli/agent) · [`agents`](/hi/cli/agents) · [`acp`](/hi/cli/acp) · [`mcp`](/hi/cli/mcp)                                                                                                                       |
| स्वास्थ्य और सेशन  | [`status`](/hi/cli/status) · [`health`](/hi/cli/health) · [`sessions`](/hi/cli/sessions)                                                                                                                                                           |
| Gateway और लॉग     | [`gateway`](/hi/cli/gateway) · [`logs`](/hi/cli/logs) · [`system`](/hi/cli/system)                                                                                                                                                                 |
| मॉडल और अनुमान | [`models`](/hi/cli/models) · [`infer`](/hi/cli/infer) · `capability` ([`infer`](/hi/cli/infer) का उपनाम) · [`memory`](/hi/cli/memory) · [`commitments`](/hi/cli/commitments) · [`wiki`](/hi/cli/wiki)                                                      |
| नेटवर्क और नोड    | [`directory`](/hi/cli/directory) · [`nodes`](/hi/cli/nodes) · [`devices`](/hi/cli/devices) · [`node`](/hi/cli/node)                                                                                                                                   |
| रनटाइम और sandbox  | [`approvals`](/hi/cli/approvals) · `exec-policy` ([`approvals`](/hi/cli/approvals) देखें) · [`sandbox`](/hi/cli/sandbox) · [`tui`](/hi/cli/tui) · `chat`/`terminal` ([`tui --local`](/hi/cli/tui) के उपनाम) · [`browser`](/hi/cli/browser)                 |
| स्वचालन           | [`cron`](/hi/cli/cron) · [`tasks`](/hi/cli/tasks) · [`hooks`](/hi/cli/hooks) · [`webhooks`](/hi/cli/webhooks) · [`transcripts`](/hi/cli/transcripts)                                                                                                     |
| खोज और दस्तावेज़   | [`dns`](/hi/cli/dns) · [`docs`](/hi/cli/docs)                                                                                                                                                                                                   |
| पेयरिंग और चैनल | [`pairing`](/hi/cli/pairing) · [`qr`](/hi/cli/qr) · [`channels`](/hi/cli/channels)                                                                                                                                                                 |
| सुरक्षा और plugins | [`security`](/hi/cli/security) · [`secrets`](/hi/cli/secrets) · [`skills`](/hi/cli/skills) · [`plugins`](/hi/cli/plugins) · [`proxy`](/hi/cli/proxy)                                                                                                     |
| पुराने उपनाम       | [`daemon`](/hi/cli/daemon) (gateway सेवा) · [`clawbot`](/hi/cli/clawbot) (namespace)                                                                                                                                                         |
| Plugins (वैकल्पिक)   | [`path`](/hi/cli/path) · [`policy`](/hi/cli/policy) · [`voicecall`](/hi/cli/voicecall) · [`workboard`](/hi/cli/workboard) (यदि इंस्टॉल हो)                                                                                                              |

## वैश्विक फ़्लैग

| फ़्लैग                    | उद्देश्य                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | स्थिति को `~/.openclaw-dev` के अंतर्गत अलग करता है और डिफ़ॉल्ट पोर्ट बदलता है         |
| `--profile <name>`      | स्थिति को `~/.openclaw-<name>` के अंतर्गत अलग करता है                              |
| `--container <name>`    | निष्पादन के लिए किसी नामित कंटेनर को लक्षित करता है                                |
| `--no-color`            | ANSI रंग अक्षम करता है (`NO_COLOR=1` का भी सम्मान किया जाता है)                  |
| `--update`              | [`openclaw update`](/hi/cli/update) के लिए संक्षिप्त रूप (केवल स्रोत इंस्टॉल) |
| `-V`, `--version`, `-v` | संस्करण प्रिंट करके बाहर निकलता है                                                |

## आउटपुट मोड

- ANSI रंग और प्रगति संकेतक केवल TTY सेशन में रेंडर होते हैं।
- OSC-8 हाइपरलिंक जहाँ समर्थित हों वहाँ क्लिक करने योग्य लिंक के रूप में रेंडर होते हैं; अन्यथा
  CLI साधारण URL पर वापस आ जाता है।
- `--json` (और जहाँ समर्थित हो वहाँ `--plain`) साफ़ आउटपुट के लिए स्टाइलिंग अक्षम करता है।
- लंबे समय तक चलने वाले कमांड प्रगति संकेतक दिखाते हैं (समर्थित होने पर OSC 9;4)।

पैलेट का आधिकारिक स्रोत: `src/terminal/palette.ts`।

## कमांड ट्री

<Accordion title="Full command tree">

```
openclaw [--dev] [--profile <name>] <command>
  crestodian
  setup
  onboard
  configure
  config
    get
    set
    unset
    file
    schema
    validate
  completion
  doctor
  dashboard
  backup
    create
    verify
  security
    audit
  secrets
    reload
    audit
    configure
    apply
  reset
  uninstall
  update
    wizard
    status
  channels
    list
    status
    capabilities
    resolve
    logs
    add
    remove
    login
    logout
  directory
    self
    peers list
    groups list|members
  skills
    search
    install
    update
    list
    info
    check
  plugins
    list
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    marketplace list
  workboard
    list
    create
    show
    dispatch
  memory
    status
    index
    search
  transcripts
    list
    show
    path
  path
    resolve
    find
    set
    validate
    emit
  commitments
    list
    dismiss
  wiki
    status
    doctor
    init
    ingest
    compile
    lint
    search
    get
    apply
    bridge import
    unsafe-local import
    obsidian status|search|open|command|daily
  message
    send
    broadcast
    poll
    react
    reactions
    read
    edit
    delete
    pin
    unpin
    pins
    permissions
    search
    thread create|list|reply
    emoji list|upload
    sticker send|upload
    role info|add|remove
    channel info|list
    member info
    voice status
    event list|create
    timeout
    kick
    ban
  agent
  agents
    list
    add
    delete
    bindings
    bind
    unbind
    set-identity
  acp
  mcp
    serve
    list
    show
    set
    unset
  status
  health
  sessions
    cleanup
  tasks
    list
    audit
    maintenance
    show
    notify
    cancel
    flow list|show|cancel
  gateway
    call
    usage-cost
    health
    status
    probe
    discover
    install
    uninstall
    start
    stop
    restart
    run
  daemon
    status
    install
    uninstall
    start
    stop
    restart
  logs
  system
    event
    heartbeat last|enable|disable
    presence
  models
    list
    status
    set
    set-image
    aliases list|add|remove
    fallbacks list|add|remove|clear
    image-fallbacks list|add|remove|clear
    scan
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|providers|status|enable|disable|set-provider
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
    auth add|login|login-github-copilot|setup-token|paste-token
    auth order get|set|clear
  sandbox
    list
    recreate
    explain
  cron
    status
    list
    get
    add
    edit
    rm
    enable
    disable
    runs
    run
  nodes
    status
    describe
    list
    pending
    approve
    reject
    rename
    invoke
    notify
    push
    canvas snapshot|present|hide|navigate|eval
    canvas a2ui push|reset
    camera list|snap|clip
    screen record
    location get
  devices
    list
    remove
    clear
    approve
    reject
    rotate
    revoke
  node
    run
    status
    install
    uninstall
    stop
    restart
  approvals
    get
    set
    allowlist add|remove
  exec-policy
    show
    preset
    set
  browser
    status
    start
    stop
    reset-profile
    tabs
    open
    focus
    close
    profiles
    create-profile
    delete-profile
    screenshot
    snapshot
    navigate
    resize
    click
    type
    press
    hover
    drag
    select
    upload
    fill
    dialog
    wait
    evaluate
    console
    pdf
  hooks
    list
    info
    check
    enable
    disable
    install
    update
  webhooks
    gmail setup|run
  proxy
    start
    run
    coverage
    sessions
    query
    blob
    purge
  pairing
    list
    approve
  qr
  clawbot
    qr
  docs
  dns
    setup
  tui
  chat (alias: tui --local)
  terminal (alias: tui --local)
```

Plugins अतिरिक्त शीर्ष-स्तरीय कमांड जोड़ सकते हैं, जैसे
[`openclaw workboard`](/hi/cli/workboard) या `openclaw voicecall`।

</Accordion>

## चैट स्लैश कमांड

चैट संदेश `/...` कमांड का समर्थन करते हैं। [स्लैश कमांड](/hi/tools/slash-commands) देखें।

मुख्य बिंदु:

- `/status` — त्वरित निदान।
- `/trace` — सेशन-स्कोप वाली plugin trace/debug पंक्तियाँ।
- `/config` — सहेजे गए कॉन्फ़िग परिवर्तन।
- `/debug` — केवल रनटाइम कॉन्फ़िग ओवरराइड (मेमोरी, डिस्क नहीं; `commands.debug: true` आवश्यक है)।

## उपयोग ट्रैकिंग

OAuth/API क्रेडेंशियल उपलब्ध होने पर `openclaw status --usage` और Control UI प्रदाता उपयोग/quota दिखाते हैं। डेटा सीधे प्रदाता उपयोग
endpoints से आता है और `X% left` में सामान्यीकृत किया जाता है। मौजूदा उपयोग
विंडो वाले प्रदाता: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi, और z.ai।

विवरण के लिए [उपयोग ट्रैकिंग](/hi/concepts/usage-tracking) देखें।

## संबंधित

- [स्लैश कमांड](/hi/tools/slash-commands)
- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [Environment](/hi/help/environment)
