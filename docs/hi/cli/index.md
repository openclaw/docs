---
read_when:
    - सही `openclaw` सबकमांड ढूँढना
    - वैश्विक फ़्लैग या आउटपुट शैली-निर्धारण नियम खोजना
summary: 'OpenClaw CLI अनुक्रमणिका: कमांड सूची, वैश्विक फ़्लैग और प्रत्येक कमांड के पृष्ठों के लिंक'
title: CLI संदर्भ
x-i18n:
    generated_at: "2026-07-16T13:59:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` मुख्य CLI प्रवेश बिंदु है। प्रत्येक मुख्य कमांड का एक समर्पित
संदर्भ पृष्ठ है या उसका दस्तावेज़ीकरण उस कमांड के साथ किया गया है जिसका वह उपनाम है; यह अनुक्रमणिका
उन कमांड, वैश्विक फ़्लैग और आउटपुट शैली नियमों को सूचीबद्ध करती है जो पूरे CLI पर लागू होते हैं।

उद्देश्य के अनुसार सेटअप कमांड:

- `openclaw setup` और `openclaw onboard` पहले इन्फ़रेंस सत्यापित करते हैं, फिर Gateway, कार्यस्थान, चैनल, Skills और स्वास्थ्य सेटअप के लिए OpenClaw प्रारंभ करते हैं।
- `openclaw setup --baseline` निर्देशित ऑनबोर्डिंग प्रवाह से गुज़रे बिना आधारभूत कॉन्फ़िगरेशन और कार्यस्थान बनाता है।
- `openclaw configure` मौजूदा सेटअप के लक्षित भागों को बदलता है: मॉडल प्रमाणीकरण, Gateway, चैनल, plugins या Skills।
- `openclaw channels add` आधारभूत सेटअप मौजूद होने के बाद चैनल खाते कॉन्फ़िगर करता है; निर्देशित सेटअप के लिए इसे फ़्लैग के बिना, या स्क्रिप्ट के लिए चैनल-विशिष्ट फ़्लैग के साथ चलाएँ।

## कमांड पृष्ठ

| क्षेत्र                         | कमांड                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| सेटअप और ऑनबोर्डिंग         | [`openclaw`](/cli/openclaw) · [`setup`](/hi/cli/setup) · [`onboard`](/hi/cli/onboard) · [`configure`](/hi/cli/configure) · [`config`](/hi/cli/config) · [`completion`](/hi/cli/completion) · [`doctor`](/hi/cli/doctor) · [`dashboard`](/hi/cli/dashboard) |
| रीसेट, बैकअप और माइग्रेशन | [`backup`](/hi/cli/backup) · [`migrate`](/hi/cli/migrate) · [`reset`](/hi/cli/reset) · [`uninstall`](/hi/cli/uninstall) · [`update`](/hi/cli/update)                                                                                                 |
| संदेश और एजेंट         | [`message`](/hi/cli/message) · [`agent`](/hi/cli/agent) · [`agents`](/hi/cli/agents) · [`attach`](/hi/cli/attach) · [`acp`](/hi/cli/acp) · [`mcp`](/hi/cli/mcp)                                                                                         |
| स्वास्थ्य और सत्र          | [`status`](/hi/cli/status) · [`health`](/hi/cli/health) · [`sessions`](/hi/cli/sessions) · [`audit`](/cli/audit)                                                                                                                               |
| Gateway और लॉग             | [`gateway`](/hi/cli/gateway) · [`logs`](/hi/cli/logs) · [`system`](/hi/cli/system)                                                                                                                                                             |
| मॉडल और इन्फ़रेंस         | [`models`](/hi/cli/models) · [`promos`](/cli/promos) · [`infer`](/hi/cli/infer) · `capability` ([`infer`](/hi/cli/infer) का उपनाम) · [`memory`](/hi/cli/memory) · [`commitments`](/hi/cli/commitments) · [`wiki`](/hi/cli/wiki)                        |
| नेटवर्क और Node            | [`directory`](/hi/cli/directory) · [`nodes`](/hi/cli/nodes) · [`devices`](/hi/cli/devices) · [`node`](/hi/cli/node) · [`worker`](/cli/worker)                                                                                                     |
| रनटाइम और सैंडबॉक्स          | [`approvals`](/hi/cli/approvals) · `exec-policy` ([`approvals`](/hi/cli/approvals) देखें) · [`sandbox`](/hi/cli/sandbox) · [`tui`](/hi/cli/tui) · `chat`/`terminal` ([`tui --local`](/hi/cli/tui) के उपनाम) · [`browser`](/hi/cli/browser)             |
| स्वचालन                   | [`cron`](/hi/cli/cron) · [`tasks`](/hi/cli/tasks) · [`hooks`](/hi/cli/hooks) · [`webhooks`](/hi/cli/webhooks) · [`transcripts`](/hi/cli/transcripts)                                                                                                 |
| खोज और दस्तावेज़           | [`dns`](/hi/cli/dns) · [`docs`](/hi/cli/docs)                                                                                                                                                                                               |
| पेयरिंग और चैनल         | [`pairing`](/hi/cli/pairing) · [`qr`](/hi/cli/qr) · [`channels`](/hi/cli/channels)                                                                                                                                                             |
| सुरक्षा और plugins         | [`security`](/hi/cli/security) · [`secrets`](/hi/cli/secrets) · [`skills`](/hi/cli/skills) · [`plugins`](/hi/cli/plugins) · [`proxy`](/hi/cli/proxy)                                                                                                 |
| पुराने उपनाम               | [`daemon`](/hi/cli/daemon) (Gateway सेवा) · [`clawbot`](/hi/cli/clawbot) (नेमस्पेस)                                                                                                                                                     |
| Plugins (वैकल्पिक)           | [`path`](/hi/cli/path) · [`policy`](/hi/cli/policy) · [`voicecall`](/hi/cli/voicecall) · [`workboard`](/hi/cli/workboard) (यदि इंस्टॉल हो)                                                                                                          |

## वैश्विक फ़्लैग

| फ़्लैग                    | उद्देश्य                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | स्थिति को `~/.openclaw-dev` के अंतर्गत पृथक करें, डिफ़ॉल्ट Gateway पोर्ट 19001 रखें और व्युत्पन्न पोर्ट स्थानांतरित करें              |
| `--profile <name>`      | स्थिति को `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`) के अंतर्गत पृथक करें                  |
| `--container <name>`    | CLI को `<name>` नामक चल रहे Podman/Docker कंटेनर के भीतर चलाएँ (डिफ़ॉल्ट: env `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | फ़ाइल + कंसोल आउटपुट के लिए वैश्विक लॉग स्तर को ओवरराइड करें                                                 |
| `--no-color`            | ANSI रंग अक्षम करें (`NO_COLOR=1` का भी पालन किया जाता है)                                                    |
| `--update`              | [`openclaw update`](/hi/cli/update) का संक्षिप्त रूप; स्रोत चेकआउट और पैकेज इंस्टॉलेशन दोनों के लिए काम करता है    |
| `-V`, `--version`, `-v` | संस्करण प्रिंट करके बाहर निकलें                                                                                  |

## आउटपुट मोड

- ANSI रंग और प्रगति संकेतक केवल TTY सत्रों में रेंडर होते हैं।
- जहाँ समर्थित हों, वहाँ OSC-8 हाइपरलिंक क्लिक करने योग्य लिंक के रूप में रेंडर होते हैं; अन्यथा
  CLI सामान्य URL का उपयोग करता है।
- `--json` (और जहाँ समर्थित हो वहाँ `--plain`) साफ़ आउटपुट के लिए शैली अक्षम करता है।
- लंबे समय तक चलने वाले कमांड प्रगति संकेतक दिखाते हैं (समर्थित होने पर OSC 9;4)।

## रंग पैलेट

OpenClaw CLI आउटपुट के लिए लॉब्स्टर पैलेट का उपयोग करता है:

| टोकन          | हेक्स       | इसके लिए उपयोग होता है                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | शीर्षक, लेबल, प्राथमिक हाइलाइट |
| `accentBright` | `#FF7A3D` | कमांड नाम, बलाघात              |
| `accentDim`    | `#D14A22` | द्वितीयक हाइलाइट टेक्स्ट             |
| `info`         | `#FF8A5B` | सूचनात्मक मान                 |
| `success`      | `#2FBF71` | सफलता स्थितियाँ                       |
| `warn`         | `#FFB020` | चेतावनियाँ, विकल्प फ़्लैग, फ़ॉलबैक    |
| `error`        | `#E23D2D` | त्रुटियाँ, विफलताएँ                     |
| `muted`        | `#8B7F77` | कम बलाघात, मेटाडेटा                |

पैलेट का प्रामाणिक स्रोत: `packages/terminal-core/src/palette.ts`।

## कमांड ट्री

<Accordion title="संपूर्ण कमांड ट्री">

यह मानचित्र मुख्य कमांड और उनके प्राथमिक उपकमांड को शामिल करता है। Plugin द्वारा जोड़े गए
उपकमांड (उदाहरण के लिए `skills`, `plugins`, और `wiki` के अंतर्गत) स्वतंत्र रूप से
विकसित होते हैं; प्रामाणिक, वर्तमान सूची के लिए `<command> --help` चलाएँ।

```
openclaw [--dev] [--profile <name>] <command>
  openclaw
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
  migrate
    list
    plan <provider>
    apply <provider>
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
    repair
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
    verify
    workshop list|inspect|propose-create|propose-update|revise|apply|reject|quarantine
    list
    info
    check
  plugins
    list
    search
    inspect
    install
    uninstall
    update
    enable
    disable
    doctor
    build
    validate
    init
    registry
    marketplace list|entries|refresh
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
    compile
    lint
    ingest
    okf import
    search
    get
    apply synthesis|metadata
    bridge import
    unsafe-local import
    chatgpt import|rollback
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
  attach
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
  audit
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
    stability
    diagnostics export
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
    auth list|add|login|setup-token|paste-token|paste-api-key|login-github-copilot
    auth order get|set|clear
  promos
    list
    claim <slug>
  infer (alias: capability)
    list
    inspect
    model run|list|inspect|providers|auth login|logout|status
    image generate|edit|describe|describe-many|providers
    audio transcribe|providers
    tts convert|voices|personas|providers|status|enable|disable|set-provider|set-persona
    video generate|describe|providers
    web search|fetch|providers
    embedding create|providers
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
  worker
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

मुख्य विशेषताएँ:

- `/status` - त्वरित निदान।
- `/trace` - सत्र-सीमित Plugin ट्रेस/डीबग पंक्तियाँ।
- `/config` - स्थायी कॉन्फ़िगरेशन परिवर्तन।
- `/debug` - केवल रनटाइम कॉन्फ़िगरेशन ओवरराइड (मेमोरी में, डिस्क पर नहीं; `commands.debug: true` आवश्यक है)।

## उपयोग ट्रैकिंग

OAuth/API क्रेडेंशियल उपलब्ध होने पर `openclaw status --usage` और नियंत्रण UI, प्रदाता के उपयोग/कोटा को प्रदर्शित करते हैं। डेटा सीधे प्रदाता के उपयोग
एंडपॉइंट से आता है और इसे `X% left` में सामान्यीकृत किया जाता है। वर्तमान उपयोग
अवधियों वाले प्रदाता: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi और z.ai।

विवरण के लिए [उपयोग ट्रैकिंग](/hi/concepts/usage-tracking) देखें।

## संबंधित

- [स्लैश कमांड](/hi/tools/slash-commands)
- [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- [परिवेश](/hi/help/environment)
