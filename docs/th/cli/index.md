---
read_when:
    - การค้นหา subcommand ของ `openclaw` ที่เหมาะสม
    - การค้นหาแฟลก global หรือกฎการจัดรูปแบบเอาต์พุต
summary: 'ดัชนี CLI ของ OpenClaw: รายการคำสั่ง แฟลก global และลิงก์ไปยังหน้าแยกของแต่ละคำสั่ง'
title: เอกสารอ้างอิง CLI
x-i18n:
    generated_at: "2026-04-23T10:15:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ccf909596d6d4936fadecfa3a98d7bc24fd18d6ec828ec91bd524019565c54b
    source_path: cli/index.md
    workflow: 15
---

# เอกสารอ้างอิง CLI

`openclaw` คือจุดเริ่มต้นหลักของ CLI คำสั่งหลักแต่ละคำสั่งจะมีทั้ง
หน้าอ้างอิงเฉพาะของตนเอง หรือมีเอกสารประกอบอยู่กับคำสั่งที่เป็น alias;
ดัชนีนี้จะแสดงรายการคำสั่ง แฟลก global และกฎการจัดรูปแบบเอาต์พุตที่
ใช้ร่วมกันทั้ง CLI

## หน้าคำสั่ง

| หมวดหมู่               | คำสั่ง                                                                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การตั้งค่าและการเริ่มต้นใช้งาน | [`setup`](/th/cli/setup) · [`onboard`](/th/cli/onboard) · [`configure`](/th/cli/configure) · [`config`](/th/cli/config) · [`completion`](/th/cli/completion) · [`doctor`](/th/cli/doctor) · [`dashboard`](/th/cli/dashboard)                   |
| การรีเซ็ตและถอนการติดตั้ง | [`backup`](/th/cli/backup) · [`reset`](/th/cli/reset) · [`uninstall`](/th/cli/uninstall) · [`update`](/th/cli/update)                                                                                                                    |
| การส่งข้อความและ agent   | [`message`](/th/cli/message) · [`agent`](/th/cli/agent) · [`agents`](/th/cli/agents) · [`acp`](/th/cli/acp) · [`mcp`](/th/cli/mcp)                                                                                                          |
| สถานะระบบและเซสชัน     | [`status`](/th/cli/status) · [`health`](/th/cli/health) · [`sessions`](/th/cli/sessions)                                                                                                                                              |
| Gateway และบันทึก      | [`gateway`](/th/cli/gateway) · [`logs`](/th/cli/logs) · [`system`](/th/cli/system)                                                                                                                                                    |
| โมเดลและการอนุมาน      | [`models`](/th/cli/models) · [`infer`](/th/cli/infer) · `capability` (alias ของ [`infer`](/th/cli/infer)) · [`memory`](/th/cli/memory) · [`wiki`](/th/cli/wiki)                                                                          |
| เครือข่ายและ Node      | [`directory`](/th/cli/directory) · [`nodes`](/th/cli/nodes) · [`devices`](/th/cli/devices) · [`node`](/th/cli/node)                                                                                                                      |
| รันไทม์และ sandbox     | [`approvals`](/th/cli/approvals) · `exec-policy` (ดู [`approvals`](/th/cli/approvals)) · [`sandbox`](/th/cli/sandbox) · [`tui`](/th/cli/tui) · `chat`/`terminal` (alias ของ [`tui --local`](/th/cli/tui)) · [`browser`](/th/cli/browser) |
| ระบบอัตโนมัติ          | [`cron`](/th/cli/cron) · [`tasks`](/th/cli/tasks) · [`hooks`](/th/cli/hooks) · [`webhooks`](/th/cli/webhooks)                                                                                                                            |
| การค้นหาและเอกสาร      | [`dns`](/th/cli/dns) · [`docs`](/th/cli/docs)                                                                                                                                                                                      |
| การจับคู่และช่องทาง    | [`pairing`](/th/cli/pairing) · [`qr`](/th/cli/qr) · [`channels`](/th/cli/channels)                                                                                                                                                    |
| ความปลอดภัยและ Plugins | [`security`](/th/cli/security) · [`secrets`](/th/cli/secrets) · [`skills`](/th/cli/skills) · [`plugins`](/th/cli/plugins) · [`proxy`](/th/cli/proxy)                                                                                      |
| alias แบบเดิม         | [`daemon`](/th/cli/daemon) (บริการ gateway) · [`clawbot`](/th/cli/clawbot) (namespace)                                                                                                                                            |
| Plugins (ไม่บังคับ)    | [`voicecall`](/th/cli/voicecall) (หากติดตั้ง)                                                                                                                                                                                   |

## แฟลก global

| แฟลก                   | จุดประสงค์                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| `--dev`                | แยก state ไว้ใต้ `~/.openclaw-dev` และเปลี่ยนพอร์ตค่าเริ่มต้น        |
| `--profile <name>`     | แยก state ไว้ใต้ `~/.openclaw-<name>`                                 |
| `--container <name>`   | กำหนดเป้าหมายเป็น container ที่มีชื่อสำหรับการรัน                    |
| `--no-color`           | ปิดสี ANSI (`NO_COLOR=1` ก็รองรับเช่นกัน)                            |
| `--update`             | ชื่อย่อของ [`openclaw update`](/th/cli/update) (เฉพาะการติดตั้งจาก source) |
| `-V`, `--version`, `-v` | แสดงเวอร์ชันแล้วออก                                                   |

## โหมดเอาต์พุต

- สี ANSI และตัวบ่งชี้ความคืบหน้าจะแสดงผลเฉพาะในเซสชัน TTY
- ลิงก์ OSC-8 จะแสดงเป็นลิงก์ที่คลิกได้เมื่อรองรับ; มิฉะนั้น
  CLI จะ fallback ไปใช้ URL แบบข้อความล้วน
- `--json` (และ `--plain` เมื่อรองรับ) จะปิดการจัดรูปแบบเพื่อให้ได้เอาต์พุตที่สะอาด
- คำสั่งที่ทำงานนานจะแสดงตัวบ่งชี้ความคืบหน้า (OSC 9;4 เมื่อรองรับ)

แหล่งอ้างอิงหลักของชุดสี: `src/terminal/palette.ts`

## ผังคำสั่ง

<Accordion title="ผังคำสั่งทั้งหมด">

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

Plugins สามารถเพิ่มคำสั่งระดับบนสุดเพิ่มเติมได้ (เช่น `openclaw voicecall`)

</Accordion>

## คำสั่ง slash ในแชต

ข้อความแชตรองรับคำสั่ง `/...` ดู [slash commands](/th/tools/slash-commands)

ไฮไลต์:

- `/status` — การวินิจฉัยอย่างรวดเร็ว
- `/trace` — บรรทัด trace/debug ของ Plugin ระดับเซสชัน
- `/config` — การเปลี่ยนแปลง config แบบคงอยู่
- `/debug` — การ override config แบบเฉพาะรันไทม์ (อยู่ในหน่วยความจำ ไม่ใช่ดิสก์; ต้องใช้ `commands.debug: true`)

## การติดตามการใช้งาน

`openclaw status --usage` และ Control UI จะแสดงการใช้งาน/โควตาของ provider เมื่อ
มีข้อมูลรับรอง OAuth/API ข้อมูลมาจากปลายทางการใช้งานของ provider โดยตรง
และถูกทำ normalization เป็น `X% left` provider ที่มีหน้าต่างการใช้งาน
ปัจจุบันได้แก่: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi และ z.ai

ดูรายละเอียดได้ที่ [Usage tracking](/th/concepts/usage-tracking)

## ที่เกี่ยวข้อง

- [Slash commands](/th/tools/slash-commands)
- [Configuration](/th/gateway/configuration)
- [Environment](/th/help/environment)
