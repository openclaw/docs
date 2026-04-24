---
read_when:
    - العثور على الأمر الفرعي المناسب في `openclaw`
    - البحث عن العلامات العامة أو قواعد تنسيق الإخراج
summary: 'فهرس CLI في OpenClaw: قائمة الأوامر، والعلامات العامة، وروابط صفحات كل أمر على حدة'
title: مرجع CLI
x-i18n:
    generated_at: "2026-04-24T07:34:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9fec51767cf6c2a0abeb684f00877371dae3ac05ed864eff03a581976e90c1ce
    source_path: cli/index.md
    workflow: 15
---

`openclaw` هو نقطة الدخول الرئيسية إلى CLI. لكل أمر أساسي إما
صفحة مرجعية مخصصة أو يتم توثيقه مع الأمر الذي يُعد اسمًا مستعارًا له؛ يعرض هذا
الفهرس الأوامر، والعلامات العامة، وقواعد تنسيق الإخراج التي
تنطبق عبر CLI.

## صفحات الأوامر

| المجال | الأوامر |
| ------ | ------- |
| الإعداد وبدء الاستخدام | [`setup`](/ar/cli/setup) · [`onboard`](/ar/cli/onboard) · [`configure`](/ar/cli/configure) · [`config`](/ar/cli/config) · [`completion`](/ar/cli/completion) · [`doctor`](/ar/cli/doctor) · [`dashboard`](/ar/cli/dashboard) |
| إعادة التعيين وإلغاء التثبيت | [`backup`](/ar/cli/backup) · [`reset`](/ar/cli/reset) · [`uninstall`](/ar/cli/uninstall) · [`update`](/ar/cli/update) |
| المراسلة والوكلاء | [`message`](/ar/cli/message) · [`agent`](/ar/cli/agent) · [`agents`](/ar/cli/agents) · [`acp`](/ar/cli/acp) · [`mcp`](/ar/cli/mcp) |
| الصحة والجلسات | [`status`](/ar/cli/status) · [`health`](/ar/cli/health) · [`sessions`](/ar/cli/sessions) |
| Gateway والسجلات | [`gateway`](/ar/cli/gateway) · [`logs`](/ar/cli/logs) · [`system`](/ar/cli/system) |
| النماذج والاستدلال | [`models`](/ar/cli/models) · [`infer`](/ar/cli/infer) · `capability` (اسم مستعار لـ [`infer`](/ar/cli/infer)) · [`memory`](/ar/cli/memory) · [`wiki`](/ar/cli/wiki) |
| الشبكة والعُقد | [`directory`](/ar/cli/directory) · [`nodes`](/ar/cli/nodes) · [`devices`](/ar/cli/devices) · [`node`](/ar/cli/node) |
| وقت التشغيل وsandbox | [`approvals`](/ar/cli/approvals) · `exec-policy` (راجع [`approvals`](/ar/cli/approvals)) · [`sandbox`](/ar/cli/sandbox) · [`tui`](/ar/cli/tui) · `chat`/`terminal` (أسماء مستعارة لـ [`tui --local`](/ar/cli/tui)) · [`browser`](/ar/cli/browser) |
| الأتمتة | [`cron`](/ar/cli/cron) · [`tasks`](/ar/cli/tasks) · [`hooks`](/ar/cli/hooks) · [`webhooks`](/ar/cli/webhooks) |
| الاكتشاف والوثائق | [`dns`](/ar/cli/dns) · [`docs`](/ar/cli/docs) |
| الاقتران والقنوات | [`pairing`](/ar/cli/pairing) · [`qr`](/ar/cli/qr) · [`channels`](/ar/cli/channels) |
| الأمان وPlugins | [`security`](/ar/cli/security) · [`secrets`](/ar/cli/secrets) · [`skills`](/ar/cli/skills) · [`plugins`](/ar/cli/plugins) · [`proxy`](/ar/cli/proxy) |
| الأسماء المستعارة القديمة | [`daemon`](/ar/cli/daemon) (خدمة gateway) · [`clawbot`](/ar/cli/clawbot) (namespace) |
| Plugins (اختيارية) | [`voicecall`](/ar/cli/voicecall) (إذا كانت مثبتة) |

## العلامات العامة

| العلامة | الغرض |
| ------- | ----- |
| `--dev` | عزل الحالة تحت `~/.openclaw-dev` وتغيير المنافذ الافتراضية |
| `--profile <name>` | عزل الحالة تحت `~/.openclaw-<name>` |
| `--container <name>` | استهداف حاوية مسماة للتنفيذ |
| `--no-color` | تعطيل ألوان ANSI (كما يتم احترام `NO_COLOR=1`) |
| `--update` | اختصار لـ [`openclaw update`](/ar/cli/update) (لتثبيتات المصدر فقط) |
| `-V`, `--version`, `-v` | طباعة الإصدار والخروج |

## أوضاع الإخراج

- تُعرض ألوان ANSI ومؤشرات التقدم فقط في جلسات TTY.
- تُعرض الروابط التشعبية OSC-8 كرابطات قابلة للنقر حيثما كان ذلك مدعومًا؛ وإلا
  يعود CLI إلى عناوين URL العادية.
- يؤدي `--json` (وكذلك `--plain` حيثما كان مدعومًا) إلى تعطيل التنسيق للحصول على إخراج نظيف.
- تعرض الأوامر طويلة التشغيل مؤشر تقدم (OSC 9;4 عندما يكون مدعومًا).

المصدر المرجعي للألوان: `src/terminal/palette.ts`.

## شجرة الأوامر

<Accordion title="شجرة الأوامر الكاملة">

```
openclaw [--dev] [--profile <name>] <command>
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
  memory
    status
    index
    search
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

يمكن لـ Plugins إضافة أوامر إضافية على المستوى الأعلى (على سبيل المثال `openclaw voicecall`).

</Accordion>

## أوامر الشرطة المائلة في الدردشة

تدعم رسائل الدردشة أوامر `/...`. راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

أبرزها:

- `/status` — تشخيصات سريعة.
- `/trace` — أسطر تتبع/تصحيح Plugin ضمن نطاق الجلسة.
- `/config` — تغييرات إعدادات محفوظة.
- `/debug` — تجاوزات إعدادات وقت التشغيل فقط (في الذاكرة، وليس على القرص؛ تتطلب `commands.debug: true`).

## تتبع الاستخدام

يعرض `openclaw status --usage` وواجهة Control UI استخدام/حصة provider عندما
تكون بيانات اعتماد OAuth/API متاحة. تأتي البيانات مباشرةً من نقاط نهاية
استخدام provider ويتم تطبيعها إلى `X% left`. أما providers التي لديها
نوافذ استخدام حالية فهي: Anthropic وGitHub Copilot وGemini CLI وOpenAI Codex وMiniMax،
وXiaomi وz.ai.

راجع [تتبع الاستخدام](/ar/concepts/usage-tracking) للتفاصيل.

## ذو صلة

- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
- [الإعدادات](/ar/gateway/configuration)
- [البيئة](/ar/help/environment)
