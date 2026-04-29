---
read_when:
    - یافتن زیر‌فرمان مناسب `openclaw`
    - جست‌وجوی پرچم‌های سراسری یا قواعد سبک‌دهی خروجی
summary: 'نمایه OpenClaw CLI: فهرست دستورها، پرچم‌های سراسری، و پیوندها به صفحه‌های مربوط به هر دستور'
title: مرجع CLI
x-i18n:
    generated_at: "2026-04-29T22:36:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 522e0f156b919946756de6b933bb0a08374507401bf8639312daf52781927f33
    source_path: cli/index.md
    workflow: 16
---

`openclaw` نقطهٔ ورود اصلی CLI است. هر فرمان هسته‌ای یا یک صفحهٔ مرجع
اختصاصی دارد یا همراه با فرمانی که برای آن alias است مستند شده است؛ این
نمایه فرمان‌ها، پرچم‌های سراسری و قواعد سبک‌دهی خروجی را که در سراسر CLI
اعمال می‌شوند فهرست می‌کند.

## صفحه‌های فرمان

| حوزه                 | فرمان‌ها                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| راه‌اندازی و شروع به کار | [`crestodian`](/fa/cli/crestodian) · [`setup`](/fa/cli/setup) · [`onboard`](/fa/cli/onboard) · [`configure`](/fa/cli/configure) · [`config`](/fa/cli/config) · [`completion`](/fa/cli/completion) · [`doctor`](/fa/cli/doctor) · [`dashboard`](/fa/cli/dashboard) |
| بازنشانی و حذف نصب  | [`backup`](/fa/cli/backup) · [`reset`](/fa/cli/reset) · [`uninstall`](/fa/cli/uninstall) · [`update`](/fa/cli/update)                                                                                                                                 |
| پیام‌رسانی و عامل‌ها | [`message`](/fa/cli/message) · [`agent`](/fa/cli/agent) · [`agents`](/fa/cli/agents) · [`acp`](/fa/cli/acp) · [`mcp`](/fa/cli/mcp)                                                                                                                       |
| سلامت و نشست‌ها  | [`status`](/fa/cli/status) · [`health`](/fa/cli/health) · [`sessions`](/fa/cli/sessions)                                                                                                                                                           |
| Gateway و گزارش‌ها     | [`gateway`](/fa/cli/gateway) · [`logs`](/fa/cli/logs) · [`system`](/fa/cli/system)                                                                                                                                                                 |
| مدل‌ها و استنتاج | [`models`](/fa/cli/models) · [`infer`](/fa/cli/infer) · `capability` (alias برای [`infer`](/fa/cli/infer)) · [`memory`](/fa/cli/memory) · [`commitments`](/fa/cli/commitments) · [`wiki`](/fa/cli/wiki)                                                      |
| شبکه و Nodeها    | [`directory`](/fa/cli/directory) · [`nodes`](/fa/cli/nodes) · [`devices`](/fa/cli/devices) · [`node`](/fa/cli/node)                                                                                                                                   |
| زمان اجرا و sandbox  | [`approvals`](/fa/cli/approvals) · `exec-policy` (ببینید [`approvals`](/fa/cli/approvals)) · [`sandbox`](/fa/cli/sandbox) · [`tui`](/fa/cli/tui) · `chat`/`terminal` (aliasها برای [`tui --local`](/fa/cli/tui)) · [`browser`](/fa/cli/browser)                 |
| خودکارسازی           | [`cron`](/fa/cli/cron) · [`tasks`](/fa/cli/tasks) · [`hooks`](/fa/cli/hooks) · [`webhooks`](/fa/cli/webhooks)                                                                                                                                         |
| کشف و مستندات   | [`dns`](/fa/cli/dns) · [`docs`](/fa/cli/docs)                                                                                                                                                                                                   |
| جفت‌سازی و کانال‌ها | [`pairing`](/fa/cli/pairing) · [`qr`](/fa/cli/qr) · [`channels`](/fa/cli/channels)                                                                                                                                                                 |
| امنیت و Pluginها | [`security`](/fa/cli/security) · [`secrets`](/fa/cli/secrets) · [`skills`](/fa/cli/skills) · [`plugins`](/fa/cli/plugins) · [`proxy`](/fa/cli/proxy)                                                                                                     |
| aliasهای قدیمی       | [`daemon`](/fa/cli/daemon) (سرویس Gateway) · [`clawbot`](/fa/cli/clawbot) (فضای نام)                                                                                                                                                         |
| Pluginها (اختیاری)   | [`voicecall`](/fa/cli/voicecall) (در صورت نصب بودن)                                                                                                                                                                                              |

## پرچم‌های سراسری

| پرچم                    | هدف                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | وضعیت را زیر `~/.openclaw-dev` جدا می‌کند و پورت‌های پیش‌فرض را تغییر می‌دهد         |
| `--profile <name>`      | وضعیت را زیر `~/.openclaw-<name>` جدا می‌کند                              |
| `--container <name>`    | یک کانتینر نام‌گذاری‌شده را برای اجرا هدف می‌گیرد                                |
| `--no-color`            | رنگ‌های ANSI را غیرفعال می‌کند (`NO_COLOR=1` نیز رعایت می‌شود)                  |
| `--update`              | کوتاه‌نویسی برای [`openclaw update`](/fa/cli/update) (فقط نصب‌های منبعی) |
| `-V`, `--version`, `-v` | نسخه را چاپ می‌کند و خارج می‌شود                                                |

## حالت‌های خروجی

- رنگ‌های ANSI و نشانگرهای پیشرفت فقط در نشست‌های TTY رندر می‌شوند.
- پیوندهای OSC-8 در جاهایی که پشتیبانی شوند به‌صورت پیوندهای قابل کلیک رندر می‌شوند؛ در غیر این صورت
  CLI به URLهای ساده بازمی‌گردد.
- `--json` (و `--plain` در جاهایی که پشتیبانی شود) سبک‌دهی را برای خروجی تمیز غیرفعال می‌کند.
- فرمان‌های طولانی‌مدت یک نشانگر پیشرفت نمایش می‌دهند (OSC 9;4 در صورت پشتیبانی).

منبع حقیقت پالت: `src/terminal/palette.ts`.

## درخت فرمان

<Accordion title="درخت کامل فرمان">

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
  memory
    status
    index
    search
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

Pluginها می‌توانند فرمان‌های سطح بالای بیشتری اضافه کنند (برای مثال `openclaw voicecall`).

</Accordion>

## فرمان‌های اسلش چت

پیام‌های چت از فرمان‌های `/...` پشتیبانی می‌کنند. [فرمان‌های اسلش](/fa/tools/slash-commands) را ببینید.

نکات برجسته:

- `/status` — عیب‌یابی سریع.
- `/trace` — خطوط trace/debug Plugin در محدودهٔ نشست.
- `/config` — تغییرات پیکربندی پایدارشده.
- `/debug` — overrideهای پیکربندی فقط زمان اجرا (در حافظه، نه دیسک؛ به `commands.debug: true` نیاز دارد).

## رهگیری مصرف

`openclaw status --usage` و Control UI میزان مصرف/سهمیهٔ provider را زمانی که
اعتبارنامه‌های OAuth/API در دسترس باشند نمایش می‌دهند. داده‌ها مستقیماً از endpointهای مصرف provider
می‌آیند و به `X% left` نرمال‌سازی می‌شوند. Providerهایی با پنجره‌های مصرف فعلی:
Anthropic، GitHub Copilot، Gemini CLI، OpenAI Codex، MiniMax،
Xiaomi و z.ai.

برای جزئیات، [رهگیری مصرف](/fa/concepts/usage-tracking) را ببینید.

## مرتبط

- [فرمان‌های اسلش](/fa/tools/slash-commands)
- [پیکربندی](/fa/gateway/configuration)
- [محیط](/fa/help/environment)
