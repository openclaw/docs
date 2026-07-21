---
read_when:
    - ค้นหาคำสั่งย่อย `openclaw` ที่เหมาะสม
    - การค้นหาแฟล็กส่วนกลางหรือกฎการจัดรูปแบบเอาต์พุต
summary: 'ดัชนี CLI ของ OpenClaw: รายการคำสั่ง แฟล็กส่วนกลาง และลิงก์ไปยังหน้าของแต่ละคำสั่ง'
title: เอกสารอ้างอิง CLI
x-i18n:
    generated_at: "2026-07-21T15:17:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 0f9694ac6a50a646862edda79d218786808a2e6008eaf9abdac0e634d373c1f7
    source_path: cli/index.md
    workflow: 16
---

`openclaw` เป็นจุดเริ่มต้นหลักของ CLI แต่ละคำสั่งหลักมี
หน้าอ้างอิงเฉพาะ หรือมีเอกสารอยู่ร่วมกับคำสั่งที่เป็นชื่อแทน ดัชนีนี้แสดง
คำสั่ง แฟล็กส่วนกลาง และกฎการจัดรูปแบบเอาต์พุตที่ใช้กับ CLI ทั้งหมด

คำสั่งตั้งค่าแบ่งตามวัตถุประสงค์:

- `openclaw setup` และ `openclaw onboard` ตรวจสอบการอนุมานก่อน จากนั้นเริ่ม OpenClaw เพื่อตั้งค่า Gateway, เวิร์กสเปซ, ช่องทาง, Skills และสถานะระบบ
- `openclaw setup --baseline` สร้างการกำหนดค่าพื้นฐานและเวิร์กสเปซโดยไม่ดำเนินตามขั้นตอนเริ่มต้นใช้งานแบบมีคำแนะนำ
- `openclaw configure` เปลี่ยนแปลงส่วนที่เจาะจงของการตั้งค่าที่มีอยู่ ได้แก่ การยืนยันตัวตนของโมเดล, Gateway, ช่องทาง, plugins หรือ Skills
- `openclaw channels add` กำหนดค่าบัญชีช่องทางหลังจากมีการตั้งค่าพื้นฐานแล้ว หากเลือกเฉพาะช่องทางจะใช้การตั้งค่าแบบมีคำแนะนำ ส่วนแฟล็กบัญชี ข้อมูลประจำตัว หรือการกำหนดค่าช่องทางจะใช้เส้นทางโดยตรงสำหรับสคริปต์

## หน้าคำสั่ง

| พื้นที่                         | คำสั่ง                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การตั้งค่าและการเริ่มต้นใช้งาน         | [`openclaw`](/th/cli/openclaw) · [`setup`](/th/cli/setup) · [`onboard`](/th/cli/onboard) · [`configure`](/th/cli/configure) · [`config`](/th/cli/config) · [`completion`](/th/cli/completion) · [`doctor`](/th/cli/doctor) · [`dashboard`](/th/cli/dashboard) |
| การรีเซ็ต การสำรองข้อมูล และการย้ายข้อมูล | [`backup`](/th/cli/backup) · [`migrate`](/th/cli/migrate) · [`reset`](/th/cli/reset) · [`uninstall`](/th/cli/uninstall) · [`update`](/th/cli/update)                                                                                                 |
| การรับส่งข้อความและเอเจนต์         | [`message`](/th/cli/message) · [`agent`](/th/cli/agent) · [`agents`](/th/cli/agents) · [`attach`](/th/cli/attach) · [`acp`](/th/cli/acp) · [`mcp`](/th/cli/mcp)                                                                                         |
| สถานะระบบและเซสชัน          | [`status`](/th/cli/status) · [`health`](/th/cli/health) · [`sessions`](/th/cli/sessions) · [`audit`](/th/cli/audit)                                                                                                                               |
| Gateway และบันทึก             | [`gateway`](/th/cli/gateway) · [`logs`](/th/cli/logs) · [`system`](/th/cli/system)                                                                                                                                                             |
| โมเดลและการอนุมาน         | [`models`](/th/cli/models) · [`promos`](/th/cli/promos) · [`infer`](/th/cli/infer) · `capability` (ชื่อแทนของ [`infer`](/th/cli/infer)) · [`memory`](/th/cli/memory) · [`commitments`](/th/cli/commitments) · [`wiki`](/th/cli/wiki)                        |
| เครือข่ายและ Node            | [`directory`](/th/cli/directory) · [`nodes`](/th/cli/nodes) · [`devices`](/th/cli/devices) · [`node`](/th/cli/node) · [`worker`](/th/cli/worker)                                                                                                     |
| รันไทม์และแซนด์บ็อกซ์          | [`approvals`](/th/cli/approvals) · `exec-policy` (ดู [`approvals`](/th/cli/approvals)) · [`sandbox`](/th/cli/sandbox) · [`tui`](/th/cli/tui) · `chat`/`terminal` (ชื่อแทนของ [`tui --local`](/th/cli/tui)) · [`browser`](/th/cli/browser)             |
| ระบบอัตโนมัติ                   | [`cron`](/th/cli/cron) · [`tasks`](/th/cli/tasks) · [`hooks`](/th/cli/hooks) · [`webhooks`](/th/cli/webhooks) · [`transcripts`](/th/cli/transcripts)                                                                                                 |
| การค้นหาและเอกสาร           | [`dns`](/th/cli/dns) · [`docs`](/th/cli/docs)                                                                                                                                                                                               |
| การจับคู่และช่องทาง         | [`pairing`](/th/cli/pairing) · [`qr`](/th/cli/qr) · [`channels`](/th/cli/channels)                                                                                                                                                             |
| ความปลอดภัยและ plugins         | [`security`](/th/cli/security) · [`secrets`](/th/cli/secrets) · [`skills`](/th/cli/skills) · [`plugins`](/th/cli/plugins) · [`proxy`](/th/cli/proxy)                                                                                                 |
| ชื่อแทนแบบเดิม               | [`daemon`](/th/cli/daemon) (บริการ Gateway) · [`clawbot`](/th/cli/clawbot) (เนมสเปซ)                                                                                                                                                     |
| Plugins (ไม่บังคับ)           | [`path`](/th/cli/path) · [`policy`](/th/cli/policy) · [`voicecall`](/th/cli/voicecall) · [`workboard`](/th/cli/workboard) (หากติดตั้งแล้ว)                                                                                                          |

## แฟล็กส่วนกลาง

| แฟล็ก                    | วัตถุประสงค์                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | แยกสถานะไว้ภายใต้ `~/.openclaw-dev` ใช้พอร์ต Gateway เริ่มต้น 19001 และเลื่อนพอร์ตที่คำนวณต่อเนื่องจากพอร์ตดังกล่าว              |
| `--profile <name>`      | แยกสถานะไว้ภายใต้ `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | เรียกใช้ CLI ภายในคอนเทนเนอร์ Podman/Docker ที่กำลังทำงานและมีชื่อว่า `<name>` (ค่าเริ่มต้น: env `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | แทนที่ระดับบันทึกส่วนกลางสำหรับเอาต์พุตไปยังไฟล์และคอนโซล                                                 |
| `--no-color`            | ปิดใช้สี ANSI (`NO_COLOR=1` จะได้รับการรองรับด้วย)                                                    |
| `--update`              | รูปแบบย่อของ [`openclaw update`](/th/cli/update) ใช้ได้ทั้งกับเช็กเอาต์ซอร์สและการติดตั้งแพ็กเกจ    |
| `-V`, `--version`, `-v` | แสดงเวอร์ชันและออก                                                                                  |

## โหมดเอาต์พุต

- สี ANSI และตัวบ่งชี้ความคืบหน้าจะแสดงผลเฉพาะในเซสชัน TTY
- ไฮเปอร์ลิงก์ OSC-8 จะแสดงเป็นลิงก์ที่คลิกได้ในระบบที่รองรับ มิฉะนั้น
  CLI จะใช้ URL แบบข้อความธรรมดาแทน
- `--json` (และ `--plain` ในระบบที่รองรับ) ปิดการจัดรูปแบบเพื่อให้ได้เอาต์พุตที่เรียบง่าย
- คำสั่งที่ทำงานเป็นเวลานานจะแสดงตัวบ่งชี้ความคืบหน้า (OSC 9;4 ในระบบที่รองรับ)

## ชุดสี

OpenClaw ใช้ชุดสีกุ้งล็อบสเตอร์สำหรับเอาต์พุต CLI:

| โทเค็น          | Hex       | ใช้สำหรับ                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | หัวเรื่อง ป้ายกำกับ และการเน้นหลัก |
| `accentBright` | `#FF7A3D` | ชื่อคำสั่งและการเน้น              |
| `accentDim`    | `#D14A22` | ข้อความเน้นรอง             |
| `info`         | `#FF8A5B` | ค่าข้อมูล                 |
| `success`      | `#2FBF71` | สถานะสำเร็จ                       |
| `warn`         | `#FFB020` | คำเตือน แฟล็กตัวเลือก และค่าทดแทน    |
| `error`        | `#E23D2D` | ข้อผิดพลาดและความล้มเหลว                     |
| `muted`        | `#8B7F77` | การลดความเด่นและข้อมูลเมตา                |

แหล่งข้อมูลอ้างอิงหลักของชุดสี: `packages/terminal-core/src/palette.ts`

## โครงสร้างคำสั่ง

<Accordion title="โครงสร้างคำสั่งทั้งหมด">

แผนผังนี้ครอบคลุมคำสั่งหลักและคำสั่งย่อยหลัก คำสั่งย่อยที่ Plugin เพิ่ม
(เช่น ภายใต้ `skills`, `plugins` และ `wiki`) พัฒนา
อย่างเป็นอิสระ เรียกใช้ `<command> --help` เพื่อดูรายการปัจจุบันที่เป็นแหล่งข้อมูลอ้างอิงหลัก

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

Plugin สามารถเพิ่มคำสั่งระดับบนสุดเพิ่มเติมได้ เช่น
[`openclaw workboard`](/th/cli/workboard) หรือ `openclaw voicecall`

</Accordion>

## คำสั่งเครื่องหมายทับในแชต

ข้อความแชตรองรับคำสั่ง `/...` โปรดดู[คำสั่งเครื่องหมายทับ](/th/tools/slash-commands)

จุดเด่น:

- `/status` - การวินิจฉัยอย่างรวดเร็ว
- `/trace` - บรรทัดการติดตาม/ดีบัก Plugin ที่จำกัดขอบเขตเฉพาะเซสชัน
- `/config` - การเปลี่ยนแปลงการกำหนดค่าที่บันทึกถาวร
- `/debug` - การแทนที่การกำหนดค่าเฉพาะขณะรันไทม์ (อยู่ในหน่วยความจำ ไม่ใช่บนดิสก์ และต้องใช้ `commands.debug: true`)

## การติดตามการใช้งาน

`openclaw status --usage` และ Control UI แสดงการใช้งาน/โควตาของผู้ให้บริการเมื่อ
มีข้อมูลประจำตัว OAuth/API ข้อมูลมาจากปลายทางการใช้งานของผู้ให้บริการโดยตรง
และได้รับการปรับให้อยู่ในรูปแบบ `X% left` ผู้ให้บริการที่มีกรอบเวลาการใช้งานปัจจุบัน
ได้แก่ Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi และ z.ai

โปรดดูรายละเอียดที่[การติดตามการใช้งาน](/th/concepts/usage-tracking)

## ที่เกี่ยวข้อง

- [คำสั่งเครื่องหมายทับ](/th/tools/slash-commands)
- [การกำหนดค่า](/th/gateway/configuration)
- [สภาพแวดล้อม](/th/help/environment)
