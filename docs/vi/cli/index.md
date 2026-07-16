---
read_when:
    - Tìm đúng lệnh con `openclaw`
    - Tra cứu các cờ toàn cục hoặc quy tắc định dạng đầu ra
summary: 'Chỉ mục CLI OpenClaw: danh sách lệnh, cờ toàn cục và liên kết đến các trang dành riêng cho từng lệnh'
title: Tham chiếu CLI
x-i18n:
    generated_at: "2026-07-16T14:14:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22a2e85d4ba33aff3ad369eb3c73b07b4cbe4401c9c5c294180e2629dd2cbaa2
    source_path: cli/index.md
    workflow: 16
---

`openclaw` là điểm vào CLI chính. Mỗi lệnh cốt lõi có một trang
tham chiếu riêng hoặc được ghi lại cùng với lệnh mà nó đặt bí danh; mục lục này liệt kê
các lệnh, cờ toàn cục và quy tắc định kiểu đầu ra áp dụng trên toàn CLI.

Các lệnh thiết lập theo mục đích:

- `openclaw setup` và `openclaw onboard` trước tiên xác minh khả năng suy luận, sau đó khởi động OpenClaw để thiết lập Gateway, không gian làm việc, kênh, kỹ năng và tình trạng hoạt động.
- `openclaw setup --baseline` tạo cấu hình cơ sở và không gian làm việc mà không thực hiện quy trình hướng dẫn bắt đầu sử dụng.
- `openclaw configure` thay đổi các phần cụ thể của một thiết lập hiện có: xác thực mô hình, Gateway, kênh, plugin hoặc kỹ năng.
- `openclaw channels add` cấu hình tài khoản kênh sau khi đã có cấu hình cơ sở; chạy không có cờ để thiết lập theo hướng dẫn hoặc dùng các cờ dành riêng cho kênh trong tập lệnh.

## Các trang lệnh

| Khu vực                         | Lệnh                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thiết lập và bắt đầu sử dụng         | [`openclaw`](/cli/openclaw) · [`setup`](/vi/cli/setup) · [`onboard`](/vi/cli/onboard) · [`configure`](/vi/cli/configure) · [`config`](/vi/cli/config) · [`completion`](/vi/cli/completion) · [`doctor`](/vi/cli/doctor) · [`dashboard`](/vi/cli/dashboard) |
| Đặt lại, sao lưu và di chuyển | [`backup`](/vi/cli/backup) · [`migrate`](/vi/cli/migrate) · [`reset`](/vi/cli/reset) · [`uninstall`](/vi/cli/uninstall) · [`update`](/vi/cli/update)                                                                                                 |
| Nhắn tin và tác tử         | [`message`](/vi/cli/message) · [`agent`](/vi/cli/agent) · [`agents`](/vi/cli/agents) · [`attach`](/vi/cli/attach) · [`acp`](/vi/cli/acp) · [`mcp`](/vi/cli/mcp)                                                                                         |
| Tình trạng hoạt động và phiên          | [`status`](/vi/cli/status) · [`health`](/vi/cli/health) · [`sessions`](/vi/cli/sessions) · [`audit`](/vi/cli/audit)                                                                                                                               |
| Gateway và nhật ký             | [`gateway`](/vi/cli/gateway) · [`logs`](/vi/cli/logs) · [`system`](/vi/cli/system)                                                                                                                                                             |
| Mô hình và suy luận         | [`models`](/vi/cli/models) · [`promos`](/vi/cli/promos) · [`infer`](/vi/cli/infer) · `capability` (bí danh của [`infer`](/vi/cli/infer)) · [`memory`](/vi/cli/memory) · [`commitments`](/vi/cli/commitments) · [`wiki`](/vi/cli/wiki)                        |
| Mạng và các Node            | [`directory`](/vi/cli/directory) · [`nodes`](/vi/cli/nodes) · [`devices`](/vi/cli/devices) · [`node`](/vi/cli/node) · [`worker`](/cli/worker)                                                                                                     |
| Môi trường chạy và sandbox          | [`approvals`](/vi/cli/approvals) · `exec-policy` (xem [`approvals`](/vi/cli/approvals)) · [`sandbox`](/vi/cli/sandbox) · [`tui`](/vi/cli/tui) · `chat`/`terminal` (bí danh của [`tui --local`](/vi/cli/tui)) · [`browser`](/vi/cli/browser)             |
| Tự động hóa                   | [`cron`](/vi/cli/cron) · [`tasks`](/vi/cli/tasks) · [`hooks`](/vi/cli/hooks) · [`webhooks`](/vi/cli/webhooks) · [`transcripts`](/vi/cli/transcripts)                                                                                                 |
| Khám phá và tài liệu           | [`dns`](/vi/cli/dns) · [`docs`](/vi/cli/docs)                                                                                                                                                                                               |
| Ghép nối và kênh         | [`pairing`](/vi/cli/pairing) · [`qr`](/vi/cli/qr) · [`channels`](/vi/cli/channels)                                                                                                                                                             |
| Bảo mật và plugin         | [`security`](/vi/cli/security) · [`secrets`](/vi/cli/secrets) · [`skills`](/vi/cli/skills) · [`plugins`](/vi/cli/plugins) · [`proxy`](/vi/cli/proxy)                                                                                                 |
| Bí danh cũ               | [`daemon`](/vi/cli/daemon) (dịch vụ Gateway) · [`clawbot`](/vi/cli/clawbot) (không gian tên)                                                                                                                                                     |
| Plugin (tùy chọn)           | [`path`](/vi/cli/path) · [`policy`](/vi/cli/policy) · [`voicecall`](/vi/cli/voicecall) · [`workboard`](/vi/cli/workboard) (nếu đã cài đặt)                                                                                                          |

## Cờ toàn cục

| Cờ                    | Mục đích                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `--dev`                 | Cô lập trạng thái trong `~/.openclaw-dev`, đặt cổng Gateway mặc định là 19001 và dịch chuyển các cổng dẫn xuất              |
| `--profile <name>`      | Cô lập trạng thái trong `~/.openclaw-<name>` (`OPENCLAW_STATE_DIR`/`OPENCLAW_CONFIG_PATH`)                  |
| `--container <name>`    | Chạy CLI bên trong một vùng chứa Podman/Docker đang chạy có tên `<name>` (mặc định: biến môi trường `OPENCLAW_CONTAINER`) |
| `--log-level <level>`   | Ghi đè mức nhật ký toàn cục cho đầu ra tệp + bảng điều khiển                                                 |
| `--no-color`            | Tắt màu ANSI (`NO_COLOR=1` cũng được áp dụng)                                                    |
| `--update`              | Dạng viết tắt của [`openclaw update`](/vi/cli/update); hoạt động cho cả bản sao mã nguồn và bản cài đặt gói    |
| `-V`, `--version`, `-v` | In phiên bản và thoát                                                                                  |

## Chế độ đầu ra

- Màu ANSI và chỉ báo tiến trình chỉ hiển thị trong các phiên TTY.
- Siêu liên kết OSC-8 hiển thị dưới dạng liên kết có thể nhấp ở nơi được hỗ trợ; nếu không,
  CLI sẽ dùng URL dạng văn bản thuần.
- `--json` (và `--plain` ở nơi được hỗ trợ) tắt định kiểu để có đầu ra gọn gàng.
- Các lệnh chạy lâu hiển thị chỉ báo tiến trình (OSC 9;4 khi được hỗ trợ).

## Bảng màu

OpenClaw sử dụng bảng màu tôm hùm cho đầu ra CLI:

| Mã màu          | Hex       | Dùng cho                             |
| -------------- | --------- | ------------------------------------ |
| `accent`       | `#FF5A2D` | Tiêu đề, nhãn, phần làm nổi bật chính |
| `accentBright` | `#FF7A3D` | Tên lệnh, nội dung nhấn mạnh              |
| `accentDim`    | `#D14A22` | Văn bản làm nổi bật phụ             |
| `info`         | `#FF8A5B` | Giá trị thông tin                 |
| `success`      | `#2FBF71` | Trạng thái thành công                       |
| `warn`         | `#FFB020` | Cảnh báo, cờ tùy chọn, phương án dự phòng    |
| `error`        | `#E23D2D` | Lỗi, thất bại                     |
| `muted`        | `#8B7F77` | Giảm nhấn mạnh, siêu dữ liệu                |

Nguồn chính xác của bảng màu: `packages/terminal-core/src/palette.ts`.

## Cây lệnh

<Accordion title="Cây lệnh đầy đủ">

Sơ đồ này bao quát các lệnh cốt lõi và những lệnh con chính của chúng. Các lệnh con
do plugin bổ sung (ví dụ trong `skills`, `plugins` và `wiki`) phát triển
độc lập; chạy `<command> --help` để xem danh sách hiện hành có thẩm quyền.

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

Các Plugin có thể thêm những lệnh cấp cao nhất khác, chẳng hạn như
[`openclaw workboard`](/vi/cli/workboard) hoặc `openclaw voicecall`.

</Accordion>

## Lệnh gạch chéo trong trò chuyện

Tin nhắn trò chuyện hỗ trợ các lệnh `/...`. Xem [lệnh gạch chéo](/vi/tools/slash-commands).

Các điểm nổi bật:

- `/status` - chẩn đoán nhanh.
- `/trace` - các dòng theo dõi/gỡ lỗi Plugin trong phạm vi phiên.
- `/config` - các thay đổi cấu hình được lưu trữ lâu dài.
- `/debug` - ghi đè cấu hình chỉ trong thời gian chạy (trong bộ nhớ, không ghi vào đĩa; yêu cầu `commands.debug: true`).

## Theo dõi mức sử dụng

`openclaw status --usage` và giao diện Control UI hiển thị mức sử dụng/hạn ngạch của nhà cung cấp khi
có thông tin xác thực OAuth/API. Dữ liệu được lấy trực tiếp từ các điểm cuối theo dõi mức sử dụng
của nhà cung cấp và được chuẩn hóa thành `X% left`. Các nhà cung cấp có cửa sổ mức sử dụng
hiện tại: Anthropic, Gemini CLI, GitHub Copilot, MiniMax, OpenAI Codex,
Xiaomi và z.ai.

Xem [Theo dõi mức sử dụng](/vi/concepts/usage-tracking) để biết chi tiết.

## Liên quan

- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [Cấu hình](/vi/gateway/configuration)
- [Môi trường](/vi/help/environment)
