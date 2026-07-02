---
read_when:
    - सही `openclaw` उपकमांड ढूँढना
    - वैश्विक फ़्लैग या आउटपुट स्टाइलिंग नियम देखना
summary: 'OpenClaw CLI अनुक्रमणिका: आदेश सूची, वैश्विक फ़्लैग, और प्रति-आदेश पृष्ठों के लिंक'
title: CLI संदर्भ
x-i18n:
    generated_at: "2026-07-02T00:56:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 627ccd257834e9bc8cacf2f2ac4600530ff4aa1132d2c34fcb0922b29a1facce
    source_path: cli/index.md
    workflow: 16
---

`openclaw` मुख्य CLI प्रवेश बिंदु है। प्रत्येक मुख्य कमांड के लिए या तो एक
समर्पित संदर्भ पेज है या वह उस कमांड के साथ दस्तावेज़ित है जिसका वह alias है; यह
इंडेक्स कमांड, वैश्विक flags, और आउटपुट styling नियम सूचीबद्ध करता है जो
पूरे CLI पर लागू होते हैं।

setup कमांड को उद्देश्य के अनुसार उपयोग करें:

- `openclaw setup` और `openclaw onboard` gateway, model auth, workspace, channels, skills, और health के लिए पूरा निर्देशित first-run path चलाते हैं।
- `openclaw setup --baseline` निर्देशित onboarding flow से गुज़रे बिना baseline config और workspace बनाता है।
- `openclaw configure` मौजूदा setup के लक्षित हिस्से बदलता है, जैसे model auth, gateway, channels, plugins, या skills।
- `openclaw channels add` baseline मौजूद होने के बाद channel accounts configure करता है; निर्देशित channel setup के लिए इसे बिना flags चलाएं या scripts के लिए channel-specific flags के साथ।

## कमांड पेज

| क्षेत्र                | कमांड                                                                                                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Setup और onboarding | [`crestodian`](/hi/cli/crestodian) · [`setup`](/hi/cli/setup) · [`onboard`](/hi/cli/onboard) · [`configure`](/hi/cli/configure) · [`config`](/hi/cli/config) · [`completion`](/hi/cli/completion) · [`doctor`](/hi/cli/doctor) · [`dashboard`](/hi/cli/dashboard) |
| Reset और uninstall  | [`backup`](/hi/cli/backup) · [`reset`](/hi/cli/reset) · [`uninstall`](/hi/cli/uninstall) · [`update`](/hi/cli/update)                                                                                                                                 |
| Messaging और agents | [`message`](/hi/cli/message) · [`agent`](/hi/cli/agent) · [`agents`](/hi/cli/agents) · [`attach`](/cli/attach) · [`acp`](/hi/cli/acp) · [`mcp`](/hi/cli/mcp)                                                                                             |
| Health और sessions  | [`status`](/hi/cli/status) · [`health`](/hi/cli/health) · [`sessions`](/hi/cli/sessions)                                                                                                                                                           |
| Gateway और logs     | [`gateway`](/hi/cli/gateway) · [`logs`](/hi/cli/logs) · [`system`](/hi/cli/system)                                                                                                                                                                 |
| Models और inference | [`models`](/hi/cli/models) · [`infer`](/hi/cli/infer) · `capability` ([`infer`](/hi/cli/infer) के लिए alias) · [`memory`](/hi/cli/memory) · [`commitments`](/hi/cli/commitments) · [`wiki`](/hi/cli/wiki)                                                      |
| Network और nodes    | [`directory`](/hi/cli/directory) · [`nodes`](/hi/cli/nodes) · [`devices`](/hi/cli/devices) · [`node`](/hi/cli/node)                                                                                                                                   |
| Runtime और sandbox  | [`approvals`](/hi/cli/approvals) · `exec-policy` ([`approvals`](/hi/cli/approvals) देखें) · [`sandbox`](/hi/cli/sandbox) · [`tui`](/hi/cli/tui) · `chat`/`terminal` ([`tui --local`](/hi/cli/tui) के लिए aliases) · [`browser`](/hi/cli/browser)                 |
| Automation           | [`cron`](/hi/cli/cron) · [`tasks`](/hi/cli/tasks) · [`hooks`](/hi/cli/hooks) · [`webhooks`](/hi/cli/webhooks) · [`transcripts`](/hi/cli/transcripts)                                                                                                     |
| Discovery और docs   | [`dns`](/hi/cli/dns) · [`docs`](/hi/cli/docs)                                                                                                                                                                                                   |
| Pairing और channels | [`pairing`](/hi/cli/pairing) · [`qr`](/hi/cli/qr) · [`channels`](/hi/cli/channels)                                                                                                                                                                 |
| Security और plugins | [`security`](/hi/cli/security) · [`secrets`](/hi/cli/secrets) · [`skills`](/hi/cli/skills) · [`plugins`](/hi/cli/plugins) · [`proxy`](/hi/cli/proxy)                                                                                                     |
| Legacy aliases       | [`daemon`](/hi/cli/daemon) (gateway service) · [`clawbot`](/hi/cli/clawbot) (namespace)                                                                                                                                                         |
| Plugins (वैकल्पिक)   | [`path`](/hi/cli/path) · [`policy`](/hi/cli/policy) · [`voicecall`](/hi/cli/voicecall) · [`workboard`](/hi/cli/workboard) (यदि install हो)                                                                                                              |

## वैश्विक flags

| Flag                    | उद्देश्य                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | state को `~/.openclaw-dev` के अंतर्गत isolate करें और default ports shift करें         |
| `--profile <name>`      | state को `~/.openclaw-<name>` के अंतर्गत isolate करें                              |
| `--container <name>`    | execution के लिए किसी named container को target करें                                |
| `--no-color`            | ANSI colors अक्षम करें (`NO_COLOR=1` का भी सम्मान किया जाता है)                  |
| `--update`              | [`openclaw update`](/hi/cli/update) के लिए shorthand (केवल source installs) |
| `-V`, `--version`, `-v` | version print करें और exit करें                                                |

## आउटपुट modes

- ANSI colors और progress indicators केवल TTY sessions में render होते हैं।
- OSC-8 hyperlinks समर्थित जगहों पर clickable links के रूप में render होते हैं; अन्यथा
  CLI plain URLs पर fall back करता है।
- `--json` (और जहां समर्थित हो `--plain`) clean output के लिए styling अक्षम करता है।
- लंबे समय तक चलने वाली commands progress indicator दिखाती हैं (समर्थित होने पर OSC 9;4)।

Palette source of truth: `src/terminal/palette.ts`.

## कमांड tree

<Accordion title="पूरा command tree">

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

Plugins अतिरिक्त top-level commands जोड़ सकते हैं, जैसे
[`openclaw workboard`](/hi/cli/workboard) या `openclaw voicecall`.

</Accordion>

## Chat slash commands

Chat messages `/...` commands का समर्थन करते हैं। [slash commands](/hi/tools/slash-commands) देखें।

मुख्य बातें:

- `/status` — त्वरित diagnostics।
- `/trace` — session-scoped plugin trace/debug lines।
- `/config` — persisted config changes।
- `/debug` — runtime-only config overrides (memory, disk नहीं; `commands.debug: true` आवश्यक है)।

## Usage tracking

OAuth/API credentials उपलब्ध होने पर `openclaw status --usage` और Control UI provider usage/quota दिखाते हैं। डेटा सीधे provider usage
endpoints से आता है और `X% left` में normalize किया जाता है। मौजूदा usage
windows वाले providers: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi, और z.ai।

विवरण के लिए [Usage tracking](/hi/concepts/usage-tracking) देखें।

## संबंधित

- [Slash commands](/hi/tools/slash-commands)
- [Configuration](/hi/gateway/configuration)
- [Environment](/hi/help/environment)
