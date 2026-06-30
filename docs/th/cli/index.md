---
read_when:
    - การค้นหาคำสั่งย่อย `openclaw` ที่เหมาะสม
    - การค้นหาแฟล็กส่วนกลางหรือกฎการจัดรูปแบบผลลัพธ์
summary: 'ดัชนี OpenClaw CLI: รายการคำสั่ง แฟล็กส่วนกลาง และลิงก์ไปยังหน้าสำหรับแต่ละคำสั่ง'
title: เอกสารอ้างอิง CLI
x-i18n:
    generated_at: "2026-06-30T22:40:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5102afd4cfe8be5ec45b352cf714f0ecc965bbe03f6a1c3c1b22aa409cde7b9
    source_path: cli/index.md
    workflow: 16
---

`openclaw` คือจุดเข้าใช้งานหลักของ CLI คำสั่งหลักแต่ละคำสั่งมีหน้าอ้างอิงเฉพาะ
หรือมีเอกสารกำกับไว้กับคำสั่งที่เป็น alias ของมัน ดัชนีนี้แสดงรายการคำสั่ง
แฟล็กส่วนกลาง และกฎการจัดรูปแบบผลลัพธ์ที่ใช้ทั่วทั้ง CLI

ใช้คำสั่งตั้งค่าตามเจตนา:

- `openclaw setup` และ `openclaw onboard` เรียกใช้เส้นทางเริ่มต้นครั้งแรกแบบมีคำแนะนำเต็มรูปแบบสำหรับ Gateway, การยืนยันตัวตนของโมเดล, workspace, ช่องทาง, Skills และสถานะสุขภาพ
- `openclaw setup --baseline` สร้าง config พื้นฐานและ workspace โดยไม่พาเดินผ่าน flow onboarding แบบมีคำแนะนำ
- `openclaw configure` เปลี่ยนส่วนที่เจาะจงของการตั้งค่าที่มีอยู่ เช่น การยืนยันตัวตนของโมเดล, Gateway, ช่องทาง, Plugin หรือ Skills
- `openclaw channels add` กำหนดค่าบัญชีช่องทางหลังจากมี baseline แล้ว เรียกใช้โดยไม่มีแฟล็กสำหรับการตั้งค่าช่องทางแบบมีคำแนะนำ หรือใช้แฟล็กเฉพาะช่องทางสำหรับสคริปต์

## หน้าคำสั่ง

| พื้นที่                 | คำสั่ง                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การตั้งค่าและ onboarding | [`crestodian`](/th/cli/crestodian) · [`setup`](/th/cli/setup) · [`onboard`](/th/cli/onboard) · [`configure`](/th/cli/configure) · [`config`](/th/cli/config) · [`completion`](/th/cli/completion) · [`doctor`](/th/cli/doctor) · [`dashboard`](/th/cli/dashboard) |
| รีเซ็ตและถอนการติดตั้ง  | [`backup`](/th/cli/backup) · [`reset`](/th/cli/reset) · [`uninstall`](/th/cli/uninstall) · [`update`](/th/cli/update)                                                                                                                                 |
| การรับส่งข้อความและ agent | [`message`](/th/cli/message) · [`agent`](/th/cli/agent) · [`agents`](/th/cli/agents) · [`acp`](/th/cli/acp) · [`mcp`](/th/cli/mcp)                                                                                                                       |
| สถานะสุขภาพและเซสชัน  | [`status`](/th/cli/status) · [`health`](/th/cli/health) · [`sessions`](/th/cli/sessions)                                                                                                                                                           |
| Gateway และบันทึก     | [`gateway`](/th/cli/gateway) · [`logs`](/th/cli/logs) · [`system`](/th/cli/system)                                                                                                                                                                 |
| โมเดลและ inference | [`models`](/th/cli/models) · [`infer`](/th/cli/infer) · `capability` (alias สำหรับ [`infer`](/th/cli/infer)) · [`memory`](/th/cli/memory) · [`commitments`](/th/cli/commitments) · [`wiki`](/th/cli/wiki)                                                      |
| เครือข่ายและโหนด    | [`directory`](/th/cli/directory) · [`nodes`](/th/cli/nodes) · [`devices`](/th/cli/devices) · [`node`](/th/cli/node)                                                                                                                                   |
| Runtime และ sandbox  | [`approvals`](/th/cli/approvals) · `exec-policy` (ดู [`approvals`](/th/cli/approvals)) · [`sandbox`](/th/cli/sandbox) · [`tui`](/th/cli/tui) · `chat`/`terminal` (alias สำหรับ [`tui --local`](/th/cli/tui)) · [`browser`](/th/cli/browser)                 |
| Automation           | [`cron`](/th/cli/cron) · [`tasks`](/th/cli/tasks) · [`hooks`](/th/cli/hooks) · [`webhooks`](/th/cli/webhooks) · [`transcripts`](/th/cli/transcripts)                                                                                                     |
| การค้นพบและเอกสาร   | [`dns`](/th/cli/dns) · [`docs`](/th/cli/docs)                                                                                                                                                                                                   |
| การจับคู่และช่องทาง | [`pairing`](/th/cli/pairing) · [`qr`](/th/cli/qr) · [`channels`](/th/cli/channels)                                                                                                                                                                 |
| ความปลอดภัยและ Plugin | [`security`](/th/cli/security) · [`secrets`](/th/cli/secrets) · [`skills`](/th/cli/skills) · [`plugins`](/th/cli/plugins) · [`proxy`](/th/cli/proxy)                                                                                                     |
| Alias เดิม       | [`daemon`](/th/cli/daemon) (บริการ Gateway) · [`clawbot`](/th/cli/clawbot) (namespace)                                                                                                                                                         |
| Plugin (ไม่บังคับ)   | [`path`](/th/cli/path) · [`policy`](/th/cli/policy) · [`voicecall`](/th/cli/voicecall) · [`workboard`](/th/cli/workboard) (หากติดตั้งแล้ว)                                                                                                              |

## แฟล็กส่วนกลาง

| แฟล็ก                    | วัตถุประสงค์                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | แยก state ไว้ใต้ `~/.openclaw-dev` และเลื่อน port เริ่มต้น         |
| `--profile <name>`      | แยก state ไว้ใต้ `~/.openclaw-<name>`                              |
| `--container <name>`    | กำหนดเป้าหมาย container ที่มีชื่อสำหรับการเรียกใช้                                |
| `--no-color`            | ปิดใช้งานสี ANSI (`NO_COLOR=1` ก็ได้รับการรองรับด้วย)                  |
| `--update`              | รูปย่อสำหรับ [`openclaw update`](/th/cli/update) (เฉพาะการติดตั้งจาก source) |
| `-V`, `--version`, `-v` | พิมพ์เวอร์ชันแล้วออก                                                |

## โหมดผลลัพธ์

- สี ANSI และตัวบ่งชี้ความคืบหน้าจะแสดงผลเฉพาะในเซสชัน TTY
- ไฮเปอร์ลิงก์ OSC-8 จะแสดงเป็นลิงก์ที่คลิกได้เมื่อรองรับ มิฉะนั้น
  CLI จะถอยกลับไปใช้ URL แบบธรรมดา
- `--json` (และ `--plain` เมื่อรองรับ) จะปิดการจัดรูปแบบเพื่อให้ผลลัพธ์สะอาด
- คำสั่งที่รันเป็นเวลานานจะแสดงตัวบ่งชี้ความคืบหน้า (OSC 9;4 เมื่อรองรับ)

แหล่งความจริงของ palette: `src/terminal/palette.ts`.

## ผังคำสั่ง

<Accordion title="ผังคำสั่งแบบเต็ม">

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

Plugin สามารถเพิ่มคำสั่งระดับบนสุดเพิ่มเติมได้ เช่น
[`openclaw workboard`](/th/cli/workboard) หรือ `openclaw voicecall`.

</Accordion>

## คำสั่ง slash ของแชท

ข้อความแชทรองรับคำสั่ง `/...` ดู [คำสั่ง slash](/th/tools/slash-commands)

จุดเด่น:

- `/status` — การวินิจฉัยอย่างรวดเร็ว
- `/trace` — บรรทัด trace/debug ของ Plugin ที่จำกัดตามเซสชัน
- `/config` — การเปลี่ยนแปลง config ที่บันทึกถาวร
- `/debug` — การ override config เฉพาะ runtime (หน่วยความจำ ไม่ใช่ดิสก์ ต้องมี `commands.debug: true`)

## การติดตามการใช้งาน

`openclaw status --usage` และ Control UI แสดงการใช้งาน/โควตาของ provider เมื่อมีข้อมูลรับรอง
OAuth/API ข้อมูลมาจาก endpoint การใช้งานของ provider โดยตรง
และถูก normalize เป็น `X% left` Provider ที่มีหน้าต่างการใช้งานปัจจุบัน:
Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax,
Xiaomi และ z.ai.

ดู [การติดตามการใช้งาน](/th/concepts/usage-tracking) สำหรับรายละเอียด

## ที่เกี่ยวข้อง

- [คำสั่ง slash](/th/tools/slash-commands)
- [การกำหนดค่า](/th/gateway/configuration)
- [สภาพแวดล้อม](/th/help/environment)
