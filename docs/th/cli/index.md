---
read_when:
    - การค้นหา subcommand ที่เหมาะสมของ `openclaw`
    - การค้นหาแฟล็กระดับโกลบอลหรือกฎการจัดรูปแบบเอาต์พุต
summary: 'ดัชนี CLI ของ OpenClaw: รายการคำสั่ง แฟล็กระดับโกลบอล และลิงก์ไปยังหน้าของแต่ละคำสั่ง'
title: เอกสารอ้างอิง CLI
x-i18n:
    generated_at: "2026-04-25T13:44:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b8a61396b8ec7f57d15988d40b09f90458745bbb29e90bd387134aa032214853
    source_path: cli/index.md
    workflow: 15
---

`openclaw` คือจุดเริ่มต้นหลักของ CLI แต่ละคำสั่งหลักจะมีทั้ง
หน้าเอกสารอ้างอิงเฉพาะ หรือมีเอกสารกำกับไว้พร้อมกับคำสั่งที่มันเป็น alias; ดัชนีนี้แสดงรายการคำสั่ง แฟล็กระดับโกลบอล และกฎการจัดรูปแบบเอาต์พุตที่ใช้ทั่วทั้ง CLI

## หน้าคำสั่ง

| ส่วน                 | คำสั่ง                                                                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การตั้งค่าและเริ่มต้นใช้งาน | [`crestodian`](/th/cli/crestodian) · [`setup`](/th/cli/setup) · [`onboard`](/th/cli/onboard) · [`configure`](/th/cli/configure) · [`config`](/th/cli/config) · [`completion`](/th/cli/completion) · [`doctor`](/th/cli/doctor) · [`dashboard`](/th/cli/dashboard) |
| รีเซ็ตและถอนการติดตั้ง  | [`backup`](/th/cli/backup) · [`reset`](/th/cli/reset) · [`uninstall`](/th/cli/uninstall) · [`update`](/th/cli/update)                                                                                                                               |
| การส่งข้อความและเอเจนต์ | [`message`](/th/cli/message) · [`agent`](/th/cli/agent) · [`agents`](/th/cli/agents) · [`acp`](/th/cli/acp) · [`mcp`](/th/cli/mcp)                                                                                                                     |
| สุขภาพระบบและเซสชัน   | [`status`](/th/cli/status) · [`health`](/th/cli/health) · [`sessions`](/th/cli/sessions)                                                                                                                                                         |
| Gateway และล็อก      | [`gateway`](/th/cli/gateway) · [`logs`](/th/cli/logs) · [`system`](/th/cli/system)                                                                                                                                                               |
| Models และการอนุมาน  | [`models`](/th/cli/models) · [`infer`](/th/cli/infer) · `capability` (alias ของ [`infer`](/th/cli/infer)) · [`memory`](/th/cli/memory) · [`wiki`](/th/cli/wiki)                                                                                       |
| เครือข่ายและโหนด     | [`directory`](/th/cli/directory) · [`nodes`](/th/cli/nodes) · [`devices`](/th/cli/devices) · [`node`](/th/cli/node)                                                                                                                                 |
| รันไทม์และ sandbox   | [`approvals`](/th/cli/approvals) · `exec-policy` (ดู [`approvals`](/th/cli/approvals)) · [`sandbox`](/th/cli/sandbox) · [`tui`](/th/cli/tui) · `chat`/`terminal` (aliases ของ [`tui --local`](/th/cli/tui)) · [`browser`](/th/cli/browser)              |
| Automation           | [`cron`](/th/cli/cron) · [`tasks`](/th/cli/tasks) · [`hooks`](/th/cli/hooks) · [`webhooks`](/th/cli/webhooks)                                                                                                                                       |
| การค้นหาและเอกสาร    | [`dns`](/th/cli/dns) · [`docs`](/th/cli/docs)                                                                                                                                                                                                  |
| Pairing และช่องทาง   | [`pairing`](/th/cli/pairing) · [`qr`](/th/cli/qr) · [`channels`](/th/cli/channels)                                                                                                                                                               |
| ความปลอดภัยและ Plugins | [`security`](/th/cli/security) · [`secrets`](/th/cli/secrets) · [`skills`](/th/cli/skills) · [`plugins`](/th/cli/plugins) · [`proxy`](/th/cli/proxy)                                                                                                  |
| alias แบบเดิม        | [`daemon`](/th/cli/daemon) (บริการ gateway) · [`clawbot`](/th/cli/clawbot) (namespace)                                                                                                                                                        |
| Plugins (ไม่บังคับ)   | [`voicecall`](/th/cli/voicecall) (หากติดตั้ง)                                                                                                                                                                                               |

## แฟล็กระดับโกลบอล

| แฟล็ก                   | วัตถุประสงค์                                                         |
| ----------------------- | -------------------------------------------------------------------- |
| `--dev`                 | แยกสถานะไว้ใต้ `~/.openclaw-dev` และเปลี่ยนพอร์ตค่าเริ่มต้น        |
| `--profile <name>`      | แยกสถานะไว้ใต้ `~/.openclaw-<name>`                                  |
| `--container <name>`    | ระบุ container ที่มีชื่อสำหรับการรัน                                 |
| `--no-color`            | ปิด ANSI colors (`NO_COLOR=1` ก็จะถูกใช้ด้วย)                        |
| `--update`              | รูปแบบย่อของ [`openclaw update`](/th/cli/update) (เฉพาะการติดตั้งจาก source) |
| `-V`, `--version`, `-v` | พิมพ์เวอร์ชันแล้วออก                                                  |

## โหมดเอาต์พุต

- ANSI colors และตัวบ่งชี้ความคืบหน้าจะแสดงผลเฉพาะในเซสชัน TTY
- ไฮเปอร์ลิงก์ OSC-8 จะแสดงเป็นลิงก์ที่คลิกได้เมื่อรองรับ; มิฉะนั้น
  CLI จะ fallback ไปใช้ URL แบบข้อความล้วน
- `--json` (และ `--plain` หากรองรับ) จะปิดการจัดรูปแบบเพื่อให้ได้เอาต์พุตที่สะอาด
- คำสั่งที่ใช้เวลานานจะแสดงตัวบ่งชี้ความคืบหน้า (OSC 9;4 หากรองรับ)

แหล่งอ้างอิงหลักของชุดสี: `src/terminal/palette.ts`

## แผนผังคำสั่ง

<Accordion title="แผนผังคำสั่งแบบเต็ม">

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

Plugins สามารถเพิ่มคำสั่งระดับบนสุดเพิ่มเติมได้ (เช่น `openclaw voicecall`)

</Accordion>

## คำสั่ง slash ในแชต

ข้อความแชตรองรับคำสั่ง `/...` ดู [slash commands](/th/tools/slash-commands)

ตัวอย่างเด่น:

- `/status` — การวินิจฉัยอย่างรวดเร็ว
- `/trace` — บรรทัด trace/debug ของ Plugin ที่อยู่ในขอบเขตเซสชัน
- `/config` — การเปลี่ยนแปลง config ที่คงอยู่
- `/debug` — การแทนที่ config เฉพาะรันไทม์ (อยู่ในหน่วยความจำ ไม่เขียนลงดิสก์; ต้องใช้ `commands.debug: true`)

## การติดตามการใช้งาน

`openclaw status --usage` และ Control UI จะแสดงการใช้งาน/โควตาของ provider เมื่อ
มีข้อมูลรับรอง OAuth/API ข้อมูลมาจากเอ็นด์พอยต์การใช้งานของ provider โดยตรง
และถูกทำให้เป็นมาตรฐานเป็น `X% left` Providers ที่มีหน้าต่างการใช้งาน
ปัจจุบัน ได้แก่ Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi และ z.ai

ดู [Usage tracking](/th/concepts/usage-tracking) สำหรับรายละเอียด

## ที่เกี่ยวข้อง

- [Slash commands](/th/tools/slash-commands)
- [Configuration](/th/gateway/configuration)
- [Environment](/th/help/environment)
