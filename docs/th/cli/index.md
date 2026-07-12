---
read_when:
    - การค้นหาคำสั่งย่อย `openclaw` ที่เหมาะสม
    - การค้นหาแฟล็กส่วนกลางหรือกฎการจัดรูปแบบเอาต์พุต
summary: 'ดัชนี CLI ของ OpenClaw: รายการคำสั่ง แฟล็กส่วนกลาง และลิงก์ไปยังหน้าของแต่ละคำสั่ง'
title: ข้อมูลอ้างอิง CLI
x-i18n:
    generated_at: "2026-07-12T16:00:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 91dce0026e177c0f0664f7a3dbe286630dcaec68b1abf2d4640e090f965515f3
    source_path: cli/index.md
    workflow: 16
---

`openclaw` เป็นจุดเริ่มต้นหลักของ CLI คำสั่งหลักแต่ละคำสั่งมีหน้าอ้างอิงเฉพาะ
หรือมีเอกสารกำกับไว้กับคำสั่งที่คำสั่งนั้นใช้นามแฝง ดัชนีนี้แสดงรายการ
คำสั่ง แฟล็กส่วนกลาง และกฎการจัดรูปแบบเอาต์พุตที่ใช้ทั่วทั้ง CLI

คำสั่งตั้งค่าตามวัตถุประสงค์:

- `openclaw setup` และ `openclaw onboard` ตรวจสอบการอนุมานก่อน จากนั้นเริ่ม Crestodian เพื่อตั้งค่า Gateway, พื้นที่ทำงาน, ช่องทาง, Skills และสถานะความพร้อมใช้งาน
- `openclaw setup --baseline` สร้างการกำหนดค่าพื้นฐานและพื้นที่ทำงานโดยไม่ดำเนินตามขั้นตอนการเริ่มต้นใช้งานแบบมีคำแนะนำ
- `openclaw configure` เปลี่ยนแปลงเฉพาะส่วนของการตั้งค่าที่มีอยู่ ได้แก่ การยืนยันตัวตนของโมเดล, Gateway, ช่องทาง, Plugin หรือ Skills
- `openclaw channels add` กำหนดค่าบัญชีช่องทางหลังจากมีค่าพื้นฐานแล้ว เรียกใช้โดยไม่มีแฟล็กสำหรับการตั้งค่าแบบมีคำแนะนำ หรือใช้แฟล็กเฉพาะช่องทางสำหรับสคริปต์

## หน้าคำสั่ง

| พื้นที่                         | คำสั่ง                                                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| การตั้งค่าและการเริ่มต้นใช้งาน         | [`crestodian`](/th/cli/crestodian) · [`setup`](/th/cli/setup) · [`onboard`](/th/cli/onboard) · [`configure`](/th/cli/configure) · [`config`](/th/cli/config) · [`completion`](/th/cli/completion) · [`doctor`](/th/cli/doctor) · [`dashboard`](/th/cli/dashboard) |
| การรีเซ็ต การสำรองข้อมูล และการย้ายข้อมูล | [`backup`](/th/cli/backup) · [`migrate`](/th/cli/migrate) · [`reset`](/th/cli/reset) · [`uninstall`](/th/cli/uninstall) · [`update`](/th/cli/update)                                                                                                     |
| การรับส่งข้อความและเอเจนต์         | [`message`](/th/cli/message) · [`agent`](/th/cli/agent) · [`agents`](/th/cli/agents) · [`attach`](/th/cli/attach) · [`acp`](/th/cli/acp) · [`mcp`](/th/cli/mcp)                                                                                             |
| สถานะความพร้อมใช้งานและเซสชัน          | [`status`](/th/cli/status) · [`health`](/th/cli/health) · [`sessions`](/th/cli/sessions) · [`audit`](/cli/audit)                                                                                                                                   |
| Gateway และบันทึกเหตุการณ์             | [`gateway`](/th/cli/gateway) · [`logs`](/th/cli/logs) · [`system`](/th/cli/system)                                                                                                                                                                 |
| โมเดลและการอนุมาน         | [`models`](/th/cli/models) · [`promos`](/th/cli/promos) · [`infer`](/th/cli/infer) · `capability` (นามแฝงของ [`infer`](/th/cli/infer)) · [`memory`](/th/cli/memory) · [`commitments`](/th/cli/commitments) · [`wiki`](/th/cli/wiki)                            |
| เครือข่ายและ Node            | [`directory`](/th/cli/directory) · [`nodes`](/th/cli/nodes) · [`devices`](/th/cli/devices) · [`node`](/th/cli/node)                                                                                                                                   |
| รันไทม์และแซนด์บ็อกซ์          | [`approvals`](/th/cli/approvals) · `exec-policy` (ดู [`approvals`](/th/cli/approvals)) · [`sandbox`](/th/cli/sandbox) · [`tui`](/th/cli/tui) · `chat`/`terminal` (นามแฝงของ [`tui --local`](/th/cli/tui)) · [`browser`](/th/cli/browser)                 |
| ระบบอัตโนมัติ                   | [`cron`](/th/cli/cron) · [`tasks`](/th/cli/tasks) · [`hooks`](/th/cli/hooks) · [`webhooks`](/th/cli/webhooks) · [`transcripts`](/th/cli/transcripts)                                                                                                     |
| การค้นหาและเอกสาร           | [`dns`](/th/cli/dns) · [`docs`](/th/cli/docs)                                                                                                                                                                                                   |
| การจับคู่และช่องทาง         | [`pairing`](/th/cli/pairing) · [`qr`](/th/cli/qr) · [`channels`](/th/cli/channels)                                                                                                                                                                 |
| ความปลอดภัยและ Plugin         | [`security`](/th/cli/security) · [`secrets`](/th/cli/secrets) · [`skills`](/th/cli/skills) · [`plugins`](/th/cli/plugins) · [`proxy`](/th/cli/proxy)                                                                                                     |
| นามแฝงเดิม               | [`daemon`](/th/cli/daemon) (บริการ Gateway) · [`clawbot`](/th/cli/clawbot) (เนมสเปซ)                                                                                                                                                         |
| Plugin (ไม่บังคับ)           | [`path`](/th/cli/path) · [`policy`](/th/cli/policy) · [`voicecall`](/th/cli/voicecall) · [`workboard`](/th/cli/workboard) (หากติดตั้งแล้ว)                                                                                                              |

## แฟล็กส่วนกลาง

| แฟล็ก                    | วัตถุประสงค์                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | แยกสถานะไว้ภายใต้ `~/.openclaw-dev` ใช้พอร์ต Gateway เริ่มต้น 19001 และเลื่อนพอร์ตที่คำนวณต่อเนื่อง              |
| `--profile <name>`      | แยกสถานะไว้ภายใต้ `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | เรียกใช้ CLI ภายในคอนเทนเนอร์ Podman/Docker ที่กำลังทำงานและมีชื่อว่า `<name>` (ค่าเริ่มต้น: env `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | แทนที่ระดับบันทึกเหตุการณ์ส่วนกลางสำหรับเอาต์พุตไฟล์และคอนโซล                                                 |
| `--no-color`            | ปิดใช้งานสี ANSI (รองรับ `NO_COLOR=1` เช่นกัน)                                                    |
| `--update`              | รูปแบบย่อของ [`openclaw update`](/th/cli/update) ใช้ได้ทั้งกับการเช็กเอาต์ซอร์สและการติดตั้งแพ็กเกจ    |
| `-V`, `--version`, `-v` | แสดงเวอร์ชันและออก                                                                                  |

## โหมดเอาต์พุต

- สี ANSI และตัวบ่งชี้ความคืบหน้าจะแสดงเฉพาะในเซสชัน TTY
- ไฮเปอร์ลิงก์ OSC-8 จะแสดงเป็นลิงก์ที่คลิกได้ในระบบที่รองรับ มิฉะนั้น
  CLI จะใช้ URL แบบข้อความธรรมดาแทน
- `--json` (และ `--plain` ในส่วนที่รองรับ) จะปิดการจัดรูปแบบเพื่อให้ได้เอาต์พุตที่สะอาด
- คำสั่งที่ทำงานเป็นเวลานานจะแสดงตัวบ่งชี้ความคืบหน้า (OSC 9;4 เมื่อรองรับ)

## จานสี

OpenClaw ใช้จานสีแบบล็อบสเตอร์สำหรับเอาต์พุต CLI:

| โทเค็น          | เลขฐานสิบหก       | ใช้สำหรับ                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | หัวข้อ ป้ายกำกับ และการเน้นหลัก |
| `accentBright` | `#FF7A3D` | ชื่อคำสั่งและการเน้น              |
| `accentDim`    | `#D14A22` | ข้อความเน้นรอง             |
| `info`         | `#FF8A5B` | ค่าข้อมูล                 |
| `success`      | `#2FBF71` | สถานะสำเร็จ                       |
| `warn`         | `#FFB020` | คำเตือน แฟล็กตัวเลือก และทางเลือกสำรอง    |
| `error`        | `#E23D2D` | ข้อผิดพลาดและความล้มเหลว                     |
| `muted`        | `#8B7F77` | การลดความเด่นและเมทาดาทา                |

แหล่งข้อมูลจริงของจานสี: `packages/terminal-core/src/palette.ts`

## แผนผังคำสั่ง

<Accordion title="แผนผังคำสั่งทั้งหมด">

แผนผังนี้ครอบคลุมคำสั่งหลักและคำสั่งย่อยหลัก คำสั่งย่อยที่เพิ่มโดย Plugin
(เช่น ภายใต้ `skills`, `plugins` และ `wiki`) มีการพัฒนา
อย่างเป็นอิสระ เรียกใช้ `<command> --help` เพื่อดูรายการปัจจุบันที่เป็นแหล่งข้อมูลหลัก

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

คำสั่งสำคัญ:

- `/status` - การวินิจฉัยอย่างรวดเร็ว
- `/trace` - บรรทัดการติดตาม/ดีบักของ Plugin ซึ่งจำกัดขอบเขตเฉพาะเซสชัน
- `/config` - การเปลี่ยนแปลงการกำหนดค่าที่บันทึกไว้อย่างถาวร
- `/debug` - การแทนที่การกำหนดค่าสำหรับรันไทม์เท่านั้น (อยู่ในหน่วยความจำ ไม่ใช่บนดิสก์ และต้องกำหนด `commands.debug: true`)

## การติดตามการใช้งาน

`openclaw status --usage` และส่วนติดต่อผู้ใช้ควบคุมจะแสดงการใช้งาน/โควตาของผู้ให้บริการเมื่อ
มีข้อมูลรับรอง OAuth/API ข้อมูลมาจากเอนด์พอยต์การใช้งาน
ของผู้ให้บริการโดยตรง และถูกปรับให้อยู่ในรูปแบบ `X% left` ผู้ให้บริการที่มี
ช่วงเวลาการใช้งานในปัจจุบัน ได้แก่ Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi และ z.ai

โปรดดูรายละเอียดที่[การติดตามการใช้งาน](/th/concepts/usage-tracking)

## เนื้อหาที่เกี่ยวข้อง

- [คำสั่งเครื่องหมายทับ](/th/tools/slash-commands)
- [การกำหนดค่า](/th/gateway/configuration)
- [สภาพแวดล้อม](/th/help/environment)
