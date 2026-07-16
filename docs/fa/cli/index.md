---
read_when:
    - یافتن زیرفرمان مناسب `openclaw`
    - جست‌وجوی پرچم‌های سراسری یا قواعد سبک‌دهی خروجی
summary: 'فهرست CLI ‏OpenClaw: فهرست فرمان‌ها، پرچم‌های سراسری و پیوندها به صفحه‌های هر فرمان'
title: مرجع CLI
x-i18n:
    generated_at: "2026-07-16T15:48:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` نقطهٔ ورود اصلی CLI است. هر فرمان هسته صفحهٔ مرجع اختصاصی دارد
یا همراه با فرمانی که نام مستعار آن است مستند شده است؛ این نمایه فرمان‌ها،
پرچم‌های سراسری و قواعد سبک‌دهی خروجی را فهرست می‌کند که در سراسر CLI اعمال می‌شوند.

فرمان‌های راه‌اندازی بر اساس هدف:

- `openclaw setup` و `openclaw onboard` ابتدا استنتاج را تأیید می‌کنند، سپس OpenClaw را برای راه‌اندازی Gateway، فضای کاری، کانال‌ها، Skills و سلامت آغاز می‌کنند.
- `openclaw setup --baseline` پیکربندی پایه و فضای کاری را بدون طی‌کردن فرایند هدایت‌شدهٔ آغاز به کار ایجاد می‌کند.
- `openclaw configure` بخش‌های مشخصی از یک راه‌اندازی موجود را تغییر می‌دهد: احراز هویت مدل، Gateway، کانال‌ها، Pluginها یا Skills.
- `openclaw channels add` پس از ایجاد پیکربندی پایه، حساب‌های کانال را پیکربندی می‌کند؛ برای راه‌اندازی هدایت‌شده بدون پرچم اجرا کنید، یا برای اسکریپت‌ها از پرچم‌های مختص کانال استفاده کنید.

## صفحات فرمان

| حوزه                         | فرمان‌ها                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| راه‌اندازی و آغاز به کار         | [`openclaw`](/cli/openclaw) · [`setup`](/fa/cli/setup) · [`onboard`](/fa/cli/onboard) · [`configure`](/fa/cli/configure) · [`config`](/fa/cli/config) · [`completion`](/fa/cli/completion) · [`doctor`](/fa/cli/doctor) · [`dashboard`](/fa/cli/dashboard) |
| بازنشانی، پشتیبان‌گیری و مهاجرت | [`backup`](/fa/cli/backup) · [`migrate`](/fa/cli/migrate) · [`reset`](/fa/cli/reset) · [`uninstall`](/fa/cli/uninstall) · [`update`](/fa/cli/update)                                                                                                 |
| پیام‌رسانی و عامل‌ها         | [`message`](/fa/cli/message) · [`agent`](/fa/cli/agent) · [`agents`](/fa/cli/agents) · [`attach`](/fa/cli/attach) · [`acp`](/fa/cli/acp) · [`mcp`](/fa/cli/mcp)                                                                                         |
| سلامت و نشست‌ها          | [`status`](/fa/cli/status) · [`health`](/fa/cli/health) · [`sessions`](/fa/cli/sessions) · [`audit`](/fa/cli/audit)                                                                                                                               |
| Gateway و گزارش‌ها             | [`gateway`](/fa/cli/gateway) · [`logs`](/fa/cli/logs) · [`system`](/fa/cli/system)                                                                                                                                                             |
| مدل‌ها و استنتاج         | [`models`](/fa/cli/models) · [`promos`](/fa/cli/promos) · [`infer`](/fa/cli/infer) · `capability` (نام مستعار [`infer`](/fa/cli/infer)) · [`memory`](/fa/cli/memory) · [`commitments`](/fa/cli/commitments) · [`wiki`](/fa/cli/wiki)                        |
| شبکه و Nodeها            | [`directory`](/fa/cli/directory) · [`nodes`](/fa/cli/nodes) · [`devices`](/fa/cli/devices) · [`node`](/fa/cli/node) · [`worker`](/cli/worker)                                                                                                     |
| زمان اجرا و سندباکس          | [`approvals`](/fa/cli/approvals) · `exec-policy` (نگاه کنید به [`approvals`](/fa/cli/approvals)) · [`sandbox`](/fa/cli/sandbox) · [`tui`](/fa/cli/tui) · `chat`/`terminal` (نام‌های مستعار [`tui --local`](/fa/cli/tui)) · [`browser`](/fa/cli/browser)             |
| خودکارسازی                   | [`cron`](/fa/cli/cron) · [`tasks`](/fa/cli/tasks) · [`hooks`](/fa/cli/hooks) · [`webhooks`](/fa/cli/webhooks) · [`transcripts`](/fa/cli/transcripts)                                                                                                 |
| کشف و مستندات           | [`dns`](/fa/cli/dns) · [`docs`](/fa/cli/docs)                                                                                                                                                                                               |
| جفت‌سازی و کانال‌ها         | [`pairing`](/fa/cli/pairing) · [`qr`](/fa/cli/qr) · [`channels`](/fa/cli/channels)                                                                                                                                                             |
| امنیت و Pluginها         | [`security`](/fa/cli/security) · [`secrets`](/fa/cli/secrets) · [`skills`](/fa/cli/skills) · [`plugins`](/fa/cli/plugins) · [`proxy`](/fa/cli/proxy)                                                                                                 |
| نام‌های مستعار قدیمی               | [`daemon`](/fa/cli/daemon) (سرویس Gateway) · [`clawbot`](/fa/cli/clawbot) (فضای نام)                                                                                                                                                     |
| Pluginها (اختیاری)           | [`path`](/fa/cli/path) · [`policy`](/fa/cli/policy) · [`voicecall`](/fa/cli/voicecall) · [`workboard`](/fa/cli/workboard) (در صورت نصب‌بودن)                                                                                                          |

## پرچم‌های سراسری

| پرچم                    | هدف                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | جداسازی وضعیت در `~/.openclaw-dev`، تنظیم درگاه پیش‌فرض Gateway روی 19001 و جابه‌جایی درگاه‌های مشتق‌شده              |
| `--profile <name>`      | جداسازی وضعیت در `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | اجرای CLI درون یک کانتینر در حال اجرای Podman/Docker با نام `<name>` (پیش‌فرض: متغیر محیطی `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | بازنویسی سطح گزارش‌گیری سراسری برای خروجی فایل و کنسول                                                 |
| `--no-color`            | غیرفعال‌کردن رنگ‌های ANSI (`NO_COLOR=1` نیز رعایت می‌شود)                                                    |
| `--update`              | شکل کوتاه [`openclaw update`](/fa/cli/update)؛ هم برای نسخه‌های بررسی‌شده از منبع و هم نصب‌های بسته کار می‌کند    |
| `-V`, `--version`, `-v` | چاپ نسخه و خروج                                                                                  |

## حالت‌های خروجی

- رنگ‌های ANSI و نشانگرهای پیشرفت فقط در نشست‌های TTY نمایش داده می‌شوند.
- پیوندهای OSC-8 در محیط‌های پشتیبانی‌شده به‌صورت پیوندهای قابل‌کلیک نمایش داده می‌شوند؛ در غیر این صورت،
  CLI از URLهای ساده استفاده می‌کند.
- `--json` (و `--plain` در محیط‌های پشتیبانی‌شده) سبک‌دهی را برای خروجی تمیز غیرفعال می‌کند.
- فرمان‌های طولانی‌مدت یک نشانگر پیشرفت نمایش می‌دهند (OSC 9;4 در صورت پشتیبانی).

## پالت رنگ

OpenClaw برای خروجی CLI از یک پالت خرچنگی استفاده می‌کند:

| توکن          | هگز       | کاربرد                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | عنوان‌ها، برچسب‌ها، برجسته‌سازی‌های اصلی |
| `accentBright` | `#FF7A3D` | نام فرمان‌ها، تأکید              |
| `accentDim`    | `#D14A22` | متن برجستهٔ ثانویه             |
| `info`         | `#FF8A5B` | مقادیر اطلاعاتی                 |
| `success`      | `#2FBF71` | وضعیت‌های موفقیت                       |
| `warn`         | `#FFB020` | هشدارها، پرچم‌های گزینه، مسیرهای جایگزین    |
| `error`        | `#E23D2D` | خطاها، شکست‌ها                     |
| `muted`        | `#8B7F77` | کم‌رنگ‌سازی، فراداده                |

منبع حقیقت پالت: `packages/terminal-core/src/palette.ts`.

## درخت فرمان

<Accordion title="درخت کامل فرمان‌ها">

این نگاشت فرمان‌های هسته و زیرفرمان‌های اصلی آن‌ها را پوشش می‌دهد. زیرفرمان‌های
افزوده‌شده توسط Plugin (برای مثال زیر `skills`، `plugins` و `wiki`) به‌طور
مستقل تکامل می‌یابند؛ برای دریافت فهرست معتبر و جاری، `<command> --help` را اجرا کنید.

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

Pluginها می‌توانند فرمان‌های سطح‌بالای دیگری، مانند
[`openclaw workboard`](/fa/cli/workboard) یا `openclaw voicecall`، اضافه کنند.

</Accordion>

## فرمان‌های اسلش چت

پیام‌های چت از فرمان‌های `/...` پشتیبانی می‌کنند. [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

نکات برجسته:

- `/status` - عیب‌یابی سریع.
- `/trace` - خطوط ردیابی/اشکال‌زدایی Plugin در محدودهٔ نشست.
- `/config` - تغییرات پایدار پیکربندی.
- `/debug` - بازنویسی‌های پیکربندی فقط برای زمان اجرا (در حافظه، نه روی دیسک؛ نیازمند `commands.debug: true`).

## ردیابی مصرف

`openclaw status --usage` و رابط Control UI، در صورت دردسترس‌بودن اعتبارنامه‌های OAuth/API،
میزان مصرف/سهمیهٔ ارائه‌دهنده را نمایش می‌دهند. داده‌ها مستقیماً از نقاط پایانی مصرف
ارائه‌دهنده دریافت و به `X% left` نرمال‌سازی می‌شوند. ارائه‌دهندگانی که پنجره‌های
مصرف فعلی دارند: Anthropic، Gemini CLI، GitHub Copilot، MiniMax، OpenAI Codex،
Xiaomi و z.ai.

برای جزئیات، [ردیابی مصرف](/fa/concepts/usage-tracking) را ببینید.

## مرتبط

- [فرمان‌های اسلش](/fa/tools/slash-commands)
- [پیکربندی](/fa/gateway/configuration)
- [محیط](/fa/help/environment)
