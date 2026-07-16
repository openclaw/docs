---
read_when:
    - العثور على الأمر الفرعي المناسب لـ `openclaw`
    - البحث عن العلامات العامة أو قواعد تنسيق المخرجات
summary: 'فهرس CLI لـ OpenClaw: قائمة الأوامر، والعلامات العامة، وروابط صفحات كل أمر'
title: مرجع CLI
x-i18n:
    generated_at: "2026-07-16T13:46:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` هو نقطة الدخول الرئيسية إلى CLI. لكل أمر أساسي
صفحة مرجعية مخصصة أو يُوثَّق مع الأمر الذي يُعد اسمًا مستعارًا له؛ يسرد هذا الفهرس
الأوامر والعلامات العامة وقواعد تنسيق المخرجات التي تنطبق في CLI بأكمله.

أوامر الإعداد حسب الغرض:

- `openclaw setup` و`openclaw onboard` يتحققان من الاستدلال أولًا، ثم يشغّلان OpenClaw لإعداد Gateway ومساحة العمل والقنوات والمهارات والحالة الصحية.
- `openclaw setup --baseline` ينشئ الإعدادات الأساسية ومساحة العمل من دون المرور بتدفق الإعداد الأولي الموجّه.
- `openclaw configure` يغيّر أجزاء محددة من إعداد قائم: مصادقة النموذج أو Gateway أو القنوات أو plugins أو المهارات.
- `openclaw channels add` يضبط حسابات القنوات بعد وجود الإعدادات الأساسية؛ شغّله دون علامات للإعداد الموجّه، أو مع علامات خاصة بالقنوات لاستخدامه في البرامج النصية.

## صفحات الأوامر

| المجال                         | الأوامر                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| الإعداد والتهيئة الأولية         | [`openclaw`](/cli/openclaw) · [`setup`](/ar/cli/setup) · [`onboard`](/ar/cli/onboard) · [`configure`](/ar/cli/configure) · [`config`](/ar/cli/config) · [`completion`](/ar/cli/completion) · [`doctor`](/ar/cli/doctor) · [`dashboard`](/ar/cli/dashboard) |
| إعادة الضبط والنسخ الاحتياطي والترحيل | [`backup`](/ar/cli/backup) · [`migrate`](/ar/cli/migrate) · [`reset`](/ar/cli/reset) · [`uninstall`](/ar/cli/uninstall) · [`update`](/ar/cli/update)                                                                                                 |
| المراسلة والوكلاء         | [`message`](/ar/cli/message) · [`agent`](/ar/cli/agent) · [`agents`](/ar/cli/agents) · [`attach`](/ar/cli/attach) · [`acp`](/ar/cli/acp) · [`mcp`](/ar/cli/mcp)                                                                                         |
| الحالة الصحية والجلسات          | [`status`](/ar/cli/status) · [`health`](/ar/cli/health) · [`sessions`](/ar/cli/sessions) · [`audit`](/ar/cli/audit)                                                                                                                               |
| Gateway والسجلات             | [`gateway`](/ar/cli/gateway) · [`logs`](/ar/cli/logs) · [`system`](/ar/cli/system)                                                                                                                                                             |
| النماذج والاستدلال         | [`models`](/ar/cli/models) · [`promos`](/ar/cli/promos) · [`infer`](/ar/cli/infer) · `capability` (اسم مستعار لـ [`infer`](/ar/cli/infer)) · [`memory`](/ar/cli/memory) · [`commitments`](/ar/cli/commitments) · [`wiki`](/ar/cli/wiki)                        |
| الشبكة والعُقد            | [`directory`](/ar/cli/directory) · [`nodes`](/ar/cli/nodes) · [`devices`](/ar/cli/devices) · [`node`](/ar/cli/node) · [`worker`](/cli/worker)                                                                                                     |
| بيئة التشغيل والعزل          | [`approvals`](/ar/cli/approvals) · `exec-policy` (راجع [`approvals`](/ar/cli/approvals)) · [`sandbox`](/ar/cli/sandbox) · [`tui`](/ar/cli/tui) · `chat`/`terminal` (اسمان مستعاران لـ [`tui --local`](/ar/cli/tui)) · [`browser`](/ar/cli/browser)             |
| الأتمتة                   | [`cron`](/ar/cli/cron) · [`tasks`](/ar/cli/tasks) · [`hooks`](/ar/cli/hooks) · [`webhooks`](/ar/cli/webhooks) · [`transcripts`](/ar/cli/transcripts)                                                                                                 |
| الاكتشاف والتوثيق           | [`dns`](/ar/cli/dns) · [`docs`](/ar/cli/docs)                                                                                                                                                                                               |
| الاقتران والقنوات         | [`pairing`](/ar/cli/pairing) · [`qr`](/ar/cli/qr) · [`channels`](/ar/cli/channels)                                                                                                                                                             |
| الأمان وplugins         | [`security`](/ar/cli/security) · [`secrets`](/ar/cli/secrets) · [`skills`](/ar/cli/skills) · [`plugins`](/ar/cli/plugins) · [`proxy`](/ar/cli/proxy)                                                                                                 |
| الأسماء المستعارة القديمة               | [`daemon`](/ar/cli/daemon) (خدمة Gateway) · [`clawbot`](/ar/cli/clawbot) (نطاق أسماء)                                                                                                                                                     |
| Plugins (اختيارية)           | [`path`](/ar/cli/path) · [`policy`](/ar/cli/policy) · [`voicecall`](/ar/cli/voicecall) · [`workboard`](/ar/cli/workboard) (إذا كانت مثبّتة)                                                                                                          |

## العلامات العامة

| العلامة                    | الغرض                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | عزل الحالة ضمن `~/.openclaw-dev`، واستخدام 19001 منفذًا افتراضيًا لـ Gateway، وإزاحة المنافذ المشتقة              |
| `--profile <name>`      | عزل الحالة ضمن `~/.openclaw-<name>` ‏(`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | تشغيل CLI داخل حاوية Podman/Docker قيد التشغيل باسم `<name>` (الافتراضي: متغير البيئة `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | تجاوز مستوى السجل العام لمخرجات الملف ووحدة التحكم                                                 |
| `--no-color`            | تعطيل ألوان ANSI (يُراعى أيضًا `NO_COLOR=1`)                                                    |
| `--update`              | اختصار لـ [`openclaw update`](/ar/cli/update)؛ يعمل لكل من نسخ المصدر المحلية وعمليات تثبيت الحزم    |
| `-V`، `--version`، `-v` | طباعة الإصدار والخروج                                                                                  |

## أوضاع الإخراج

- لا تُعرض ألوان ANSI ومؤشرات التقدم إلا في جلسات TTY.
- تُعرض روابط OSC-8 كروابط قابلة للنقر حيثما يكون ذلك مدعومًا؛ وإلا
  يعود CLI إلى استخدام عناوين URL عادية.
- `--json` (و`--plain` حيثما يكون مدعومًا) يعطّل التنسيق للحصول على مخرجات نظيفة.
- تعرض الأوامر طويلة التشغيل مؤشر تقدم (OSC 9;4 عند دعمه).

## لوحة الألوان

يستخدم OpenClaw لوحة ألوان مستوحاة من جراد البحر لمخرجات CLI:

| الرمز          | القيمة السداسية       | يُستخدم من أجل                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | العناوين والتسميات ومواضع الإبراز الأساسية |
| `accentBright` | `#FF7A3D` | أسماء الأوامر والتوكيد              |
| `accentDim`    | `#D14A22` | نص الإبراز الثانوي             |
| `info`         | `#FF8A5B` | القيم المعلوماتية                 |
| `success`      | `#2FBF71` | حالات النجاح                       |
| `warn`         | `#FFB020` | التحذيرات وعلامات الخيارات والبدائل    |
| `error`        | `#E23D2D` | الأخطاء وحالات الفشل                     |
| `muted`        | `#8B7F77` | تقليل الإبراز والبيانات الوصفية                |

المصدر المعتمد للوحة الألوان: `packages/terminal-core/src/palette.ts`.

## شجرة الأوامر

<Accordion title="شجرة الأوامر الكاملة">

تغطي هذه الخريطة الأوامر الأساسية وأوامرها الفرعية الرئيسية. تتطور الأوامر الفرعية
التي تضيفها plugins (على سبيل المثال ضمن `skills` و`plugins` و`wiki`)
بشكل مستقل؛ شغّل `<command> --help` للحصول على القائمة الحالية المعتمدة.

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
  infer (الاسم البديل: capability)
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
  chat (الاسم البديل: tui --local)
  terminal (الاسم البديل: tui --local)
```

يمكن للـ Plugins إضافة أوامر إضافية من المستوى الأعلى، مثل
[`openclaw workboard`](/ar/cli/workboard) أو `openclaw voicecall`.

</Accordion>

## أوامر الشرطة المائلة في الدردشة

تدعم رسائل الدردشة أوامر `/...`. راجع [أوامر الشرطة المائلة](/ar/tools/slash-commands).

أبرزها:

- `/status` - تشخيصات سريعة.
- `/trace` - أسطر تتبع/تصحيح أخطاء الـ Plugin ضمن نطاق الجلسة.
- `/config` - تغييرات إعدادات مستديمة.
- `/debug` - تجاوزات للإعدادات في وقت التشغيل فقط (في الذاكرة، وليس على القرص؛ تتطلب `commands.debug: true`).

## تتبع الاستخدام

يعرض `openclaw status --usage` وواجهة التحكم استخدام المزوّد/الحصة عند
توفر بيانات اعتماد OAuth/API. تأتي البيانات مباشرةً من نقاط نهاية استخدام
المزوّد وتُوحَّد وفق `X% left`. المزوّدون الذين لديهم نوافذ استخدام
حالية: Anthropic وGemini CLI وGitHub Copilot وMiniMax وOpenAI Codex
وXiaomi وz.ai.

راجع [تتبع الاستخدام](/ar/concepts/usage-tracking) لمزيد من التفاصيل.

## ذو صلة

- [أوامر الشرطة المائلة](/ar/tools/slash-commands)
- [الإعدادات](/ar/gateway/configuration)
- [البيئة](/ar/help/environment)
