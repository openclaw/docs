---
read_when:
    - การค้นหาคำสั่งย่อย `openclaw` ที่เหมาะสม
    - ค้นหาแฟล็กส่วนกลางหรือกฎการจัดรูปแบบเอาต์พุต
summary: 'ดัชนี CLI ของ OpenClaw: รายการคำสั่ง แฟล็กส่วนกลาง และลิงก์ไปยังหน้าของแต่ละคำสั่ง'
title: ข้อมูลอ้างอิง CLI
x-i18n:
    generated_at: "2026-04-30T09:43:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 522e0f156b919946756de6b933bb0a08374507401bf8639312daf52781927f33
    source_path: cli/index.md
    workflow: 16
---

`openclaw` คือจุดเข้าใช้งานหลักของ CLI คำสั่งหลักแต่ละคำสั่งมีหน้าข้อมูลอ้างอิงเฉพาะ หรือมีเอกสารอยู่กับคำสั่งที่เป็น alias ของมัน ดัชนีนี้แสดงรายการคำสั่ง แฟล็กส่วนกลาง และกฎการจัดรูปแบบเอาต์พุตที่ใช้ทั่วทั้ง CLI

## หน้าคำสั่ง

| พื้นที่ | คำสั่ง |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การตั้งค่าและการเริ่มใช้งาน | [`crestodian`](/th/cli/crestodian) · [`setup`](/th/cli/setup) · [`onboard`](/th/cli/onboard) · [`configure`](/th/cli/configure) · [`config`](/th/cli/config) · [`completion`](/th/cli/completion) · [`doctor`](/th/cli/doctor) · [`dashboard`](/th/cli/dashboard) |
| รีเซ็ตและถอนการติดตั้ง | [`backup`](/th/cli/backup) · [`reset`](/th/cli/reset) · [`uninstall`](/th/cli/uninstall) · [`update`](/th/cli/update) |
| การรับส่งข้อความและเอเจนต์ | [`message`](/th/cli/message) · [`agent`](/th/cli/agent) · [`agents`](/th/cli/agents) · [`acp`](/th/cli/acp) · [`mcp`](/th/cli/mcp) |
| สุขภาพระบบและเซสชัน | [`status`](/th/cli/status) · [`health`](/th/cli/health) · [`sessions`](/th/cli/sessions) |
| Gateway และล็อก | [`gateway`](/th/cli/gateway) · [`logs`](/th/cli/logs) · [`system`](/th/cli/system) |
| โมเดลและการอนุมาน | [`models`](/th/cli/models) · [`infer`](/th/cli/infer) · `capability` (alias สำหรับ [`infer`](/th/cli/infer)) · [`memory`](/th/cli/memory) · [`commitments`](/th/cli/commitments) · [`wiki`](/th/cli/wiki) |
| เครือข่ายและโหนด | [`directory`](/th/cli/directory) · [`nodes`](/th/cli/nodes) · [`devices`](/th/cli/devices) · [`node`](/th/cli/node) |
| รันไทม์และแซนด์บ็อกซ์ | [`approvals`](/th/cli/approvals) · `exec-policy` (ดู [`approvals`](/th/cli/approvals)) · [`sandbox`](/th/cli/sandbox) · [`tui`](/th/cli/tui) · `chat`/`terminal` (alias สำหรับ [`tui --local`](/th/cli/tui)) · [`browser`](/th/cli/browser) |
| ระบบอัตโนมัติ | [`cron`](/th/cli/cron) · [`tasks`](/th/cli/tasks) · [`hooks`](/th/cli/hooks) · [`webhooks`](/th/cli/webhooks) |
| การค้นพบและเอกสาร | [`dns`](/th/cli/dns) · [`docs`](/th/cli/docs) |
| การจับคู่และช่องทาง | [`pairing`](/th/cli/pairing) · [`qr`](/th/cli/qr) · [`channels`](/th/cli/channels) |
| ความปลอดภัยและ Plugins | [`security`](/th/cli/security) · [`secrets`](/th/cli/secrets) · [`skills`](/th/cli/skills) · [`plugins`](/th/cli/plugins) · [`proxy`](/th/cli/proxy) |
| Alias แบบเดิม | [`daemon`](/th/cli/daemon) (บริการ Gateway) · [`clawbot`](/th/cli/clawbot) (namespace) |
| Plugins (ไม่บังคับ) | [`voicecall`](/th/cli/voicecall) (หากติดตั้งแล้ว) |

## แฟล็กส่วนกลาง

| แฟล็ก | วัตถุประสงค์ |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev` | แยกสถานะไว้ใต้ `~/.openclaw-dev` และเลื่อนพอร์ตเริ่มต้น |
| `--profile <name>` | แยกสถานะไว้ใต้ `~/.openclaw-<name>` |
| `--container <name>` | ระบุคอนเทนเนอร์ที่มีชื่อสำหรับการดำเนินการ |
| `--no-color` | ปิดใช้สี ANSI (`NO_COLOR=1` ก็ได้รับการเคารพเช่นกัน) |
| `--update` | รูปย่อสำหรับ [`openclaw update`](/th/cli/update) (เฉพาะการติดตั้งจากซอร์ส) |
| `-V`, `--version`, `-v` | พิมพ์เวอร์ชันแล้วออก |

## โหมดเอาต์พุต

- สี ANSI และตัวบ่งชี้ความคืบหน้าจะแสดงผลเฉพาะในเซสชัน TTY
- ไฮเปอร์ลิงก์ OSC-8 จะแสดงเป็นลิงก์ที่คลิกได้ในที่ที่รองรับ ไม่เช่นนั้น CLI จะย้อนกลับไปใช้ URL แบบข้อความธรรมดา
- `--json` (และ `--plain` ในที่ที่รองรับ) จะปิดการจัดรูปแบบเพื่อให้ได้เอาต์พุตที่สะอาด
- คำสั่งที่ทำงานนานจะแสดงตัวบ่งชี้ความคืบหน้า (OSC 9;4 เมื่อรองรับ)

แหล่งความจริงของพาเลตต์: `src/terminal/palette.ts`.

## ต้นไม้คำสั่ง

<Accordion title="ต้นไม้คำสั่งทั้งหมด">

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

Plugins สามารถเพิ่มคำสั่งระดับบนสุดเพิ่มเติมได้ (เช่น `openclaw voicecall`)

</Accordion>

## คำสั่ง slash ในแชต

ข้อความแชตรองรับคำสั่ง `/...` ดู [คำสั่ง slash](/th/tools/slash-commands)

จุดเด่น:

- `/status` — การวินิจฉัยอย่างรวดเร็ว
- `/trace` — บรรทัด trace/debug ของ Plugin ที่จำกัดขอบเขตตามเซสชัน
- `/config` — การเปลี่ยนแปลง config ที่บันทึกคงอยู่
- `/debug` — การแทนที่ config เฉพาะรันไทม์ (หน่วยความจำ ไม่ใช่ดิสก์ ต้องใช้ `commands.debug: true`)

## การติดตามการใช้งาน

`openclaw status --usage` และ Control UI จะแสดงการใช้งาน/โควตาของผู้ให้บริการเมื่อมีข้อมูลรับรอง OAuth/API ข้อมูลมาจาก endpoints การใช้งานของผู้ให้บริการโดยตรง และถูกทำให้เป็นมาตรฐานเป็น `X% left` ผู้ให้บริการที่มีหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi และ z.ai

ดูรายละเอียดที่ [การติดตามการใช้งาน](/th/concepts/usage-tracking)

## ที่เกี่ยวข้อง

- [คำสั่ง slash](/th/tools/slash-commands)
- [การกำหนดค่า](/th/gateway/configuration)
- [สภาพแวดล้อม](/th/help/environment)
