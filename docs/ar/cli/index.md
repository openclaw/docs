---
read_when:
    - العثور على الأمر الفرعي `openclaw` المناسب
    - البحث عن العلامات العامة أو قواعد تنسيق المخرجات
summary: 'فهرس OpenClaw CLI: قائمة الأوامر، والرايات العامة، وروابط إلى صفحات كل أمر.'
title: مرجع CLI
x-i18n:
    generated_at: "2026-06-27T17:21:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7075c072fed0abf0ffa126bde01042adaf94f8ba4dffa9fef6dc99a6ab34eb43
    source_path: cli/index.md
    workflow: 16
---

`openclaw` هو نقطة الدخول الرئيسية لـ CLI. لكل أمر أساسي صفحة مرجعية مخصصة أو موثق مع الأمر الذي يعمل كاسم بديل له؛ يسرد هذا الفهرس الأوامر، والرايات العامة، وقواعد تنسيق المخرجات التي تنطبق عبر CLI.

استخدم أوامر الإعداد بحسب الغرض:

- ينشئ `openclaw setup` الإعداد الأساسي ومساحة العمل من دون المرور عبر تدفق التهيئة الإرشادي الكامل.
- `openclaw onboard` هو مسار التشغيل الأول الإرشادي الكامل لـ Gateway، ومصادقة النموذج، ومساحة العمل، والقنوات، وSkills، والصحة.
- يغير `openclaw configure` أجزاء محددة من إعداد قائم، مثل مصادقة النموذج، أو Gateway، أو القنوات، أو Plugins، أو Skills.
- يهيئ `openclaw channels add` حسابات القنوات بعد وجود الأساس؛ شغله من دون رايات لإعداد القناة إرشاديا أو مع رايات خاصة بالقناة للسكربتات.

## صفحات الأوامر

| المجال                 | الأوامر                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الإعداد والتهيئة | [`crestodian`](/ar/cli/crestodian) · [`setup`](/ar/cli/setup) · [`onboard`](/ar/cli/onboard) · [`configure`](/ar/cli/configure) · [`config`](/ar/cli/config) · [`completion`](/ar/cli/completion) · [`doctor`](/ar/cli/doctor) · [`dashboard`](/ar/cli/dashboard) |
| إعادة الضبط وإلغاء التثبيت  | [`backup`](/ar/cli/backup) · [`reset`](/ar/cli/reset) · [`uninstall`](/ar/cli/uninstall) · [`update`](/ar/cli/update)                                                                                                                                 |
| المراسلة والوكلاء | [`message`](/ar/cli/message) · [`agent`](/ar/cli/agent) · [`agents`](/ar/cli/agents) · [`acp`](/ar/cli/acp) · [`mcp`](/ar/cli/mcp)                                                                                                                       |
| الصحة والجلسات  | [`status`](/ar/cli/status) · [`health`](/ar/cli/health) · [`sessions`](/ar/cli/sessions)                                                                                                                                                           |
| Gateway والسجلات     | [`gateway`](/ar/cli/gateway) · [`logs`](/ar/cli/logs) · [`system`](/ar/cli/system)                                                                                                                                                                 |
| النماذج والاستدلال | [`models`](/ar/cli/models) · [`infer`](/ar/cli/infer) · `capability` (اسم بديل لـ [`infer`](/ar/cli/infer)) · [`memory`](/ar/cli/memory) · [`commitments`](/ar/cli/commitments) · [`wiki`](/ar/cli/wiki)                                                      |
| الشبكة والعقد    | [`directory`](/ar/cli/directory) · [`nodes`](/ar/cli/nodes) · [`devices`](/ar/cli/devices) · [`node`](/ar/cli/node)                                                                                                                                   |
| وقت التشغيل وبيئة العزل  | [`approvals`](/ar/cli/approvals) · `exec-policy` (راجع [`approvals`](/ar/cli/approvals)) · [`sandbox`](/ar/cli/sandbox) · [`tui`](/ar/cli/tui) · `chat`/`terminal` (أسماء بديلة لـ [`tui --local`](/ar/cli/tui)) · [`browser`](/ar/cli/browser)                 |
| الأتمتة           | [`cron`](/ar/cli/cron) · [`tasks`](/ar/cli/tasks) · [`hooks`](/ar/cli/hooks) · [`webhooks`](/ar/cli/webhooks) · [`transcripts`](/ar/cli/transcripts)                                                                                                     |
| الاكتشاف والوثائق   | [`dns`](/ar/cli/dns) · [`docs`](/ar/cli/docs)                                                                                                                                                                                                   |
| الاقتران والقنوات | [`pairing`](/ar/cli/pairing) · [`qr`](/ar/cli/qr) · [`channels`](/ar/cli/channels)                                                                                                                                                                 |
| الأمان وPlugins | [`security`](/ar/cli/security) · [`secrets`](/ar/cli/secrets) · [`skills`](/ar/cli/skills) · [`plugins`](/ar/cli/plugins) · [`proxy`](/ar/cli/proxy)                                                                                                     |
| الأسماء البديلة القديمة       | [`daemon`](/ar/cli/daemon) (خدمة Gateway) · [`clawbot`](/ar/cli/clawbot) (نطاق أسماء)                                                                                                                                                         |
| Plugins (اختيارية)   | [`path`](/ar/cli/path) · [`policy`](/ar/cli/policy) · [`voicecall`](/ar/cli/voicecall) · [`workboard`](/ar/cli/workboard) (إذا كان مثبتا)                                                                                                              |

## الرايات العامة

| الراية                    | الغرض                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | يعزل الحالة ضمن `~/.openclaw-dev` ويغير المنافذ الافتراضية         |
| `--profile <name>`      | يعزل الحالة ضمن `~/.openclaw-<name>`                              |
| `--container <name>`    | يستهدف حاوية مسماة للتنفيذ                                |
| `--no-color`            | يعطل ألوان ANSI (يتم احترام `NO_COLOR=1` أيضا)                  |
| `--update`              | اختصار لـ [`openclaw update`](/ar/cli/update) (لتثبيتات المصدر فقط) |
| `-V`, `--version`, `-v` | يطبع الإصدار ويخرج                                                |

## أوضاع المخرجات

- لا تظهر ألوان ANSI ومؤشرات التقدم إلا في جلسات TTY.
- تظهر روابط OSC-8 التشعبية كروابط قابلة للنقر حيثما كان ذلك مدعوما؛ وإلا يعود
  CLI إلى عناوين URL النصية العادية.
- يعطل `--json` (و`--plain` حيثما كان مدعوما) التنسيق للحصول على مخرجات نظيفة.
- تعرض الأوامر طويلة التشغيل مؤشر تقدم (OSC 9;4 عند دعمه).

مصدر الحقيقة للوحة الألوان: `src/terminal/palette.ts`.

## شجرة الأوامر

<Accordion title="شجرة الأوامر الكاملة">

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

يمكن لـ Plugins إضافة أوامر علوية إضافية، مثل
[`openclaw workboard`](/ar/cli/workboard) أو `openclaw voicecall`.

</Accordion>

## أوامر الشرطة المائلة في الدردشة

تدعم رسائل الدردشة أوامر `/...`. راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

أبرزها:

- `/status` — تشخيصات سريعة.
- `/trace` — أسطر تتبع/تصحيح أخطاء Plugin على مستوى الجلسة.
- `/config` — تغييرات إعداد محفوظة.
- `/debug` — تجاوزات إعدادات وقت التشغيل فقط (في الذاكرة، لا على القرص؛ يتطلب `commands.debug: true`).

## تتبع الاستخدام

يعرض `openclaw status --usage` وواجهة Control UI استخدام/حصة المزود عندما
تتوفر بيانات اعتماد OAuth/API. تأتي البيانات مباشرة من نقاط نهاية استخدام
المزود وتتم معايرتها إلى `X% left`. المزودون الذين لديهم نوافذ استخدام
حالية: Anthropic، GitHub Copilot، Gemini CLI، OpenAI Codex، MiniMax،
Xiaomi، وz.ai.

راجع [تتبع الاستخدام](/ar/concepts/usage-tracking) للتفاصيل.

## ذو صلة

- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
- [الإعداد](/ar/gateway/configuration)
- [البيئة](/ar/help/environment)
