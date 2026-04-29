---
read_when:
    - Tìm lệnh con `openclaw` phù hợp
    - Tra cứu các cờ toàn cục hoặc quy tắc định kiểu đầu ra
summary: 'Chỉ mục OpenClaw CLI: danh sách lệnh, cờ toàn cục và liên kết đến các trang riêng cho từng lệnh'
title: Tài liệu tham chiếu CLI
x-i18n:
    generated_at: "2026-04-29T22:32:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 522e0f156b919946756de6b933bb0a08374507401bf8639312daf52781927f33
    source_path: cli/index.md
    workflow: 16
---

`openclaw` là điểm vào CLI chính. Mỗi lệnh lõi có một trang tham chiếu riêng hoặc được ghi tài liệu cùng với lệnh mà nó làm bí danh; mục lục này liệt kê các lệnh, các cờ toàn cục và các quy tắc định kiểu đầu ra áp dụng trên toàn CLI.

## Trang lệnh

| Khu vực                    | Lệnh                                                                                                                                                                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thiết lập và nhập môn      | [`crestodian`](/vi/cli/crestodian) · [`setup`](/vi/cli/setup) · [`onboard`](/vi/cli/onboard) · [`configure`](/vi/cli/configure) · [`config`](/vi/cli/config) · [`completion`](/vi/cli/completion) · [`doctor`](/vi/cli/doctor) · [`dashboard`](/vi/cli/dashboard) |
| Đặt lại và gỡ cài đặt      | [`backup`](/vi/cli/backup) · [`reset`](/vi/cli/reset) · [`uninstall`](/vi/cli/uninstall) · [`update`](/vi/cli/update)                                                                                                                                 |
| Nhắn tin và tác tử         | [`message`](/vi/cli/message) · [`agent`](/vi/cli/agent) · [`agents`](/vi/cli/agents) · [`acp`](/vi/cli/acp) · [`mcp`](/vi/cli/mcp)                                                                                                                       |
| Sức khỏe và phiên          | [`status`](/vi/cli/status) · [`health`](/vi/cli/health) · [`sessions`](/vi/cli/sessions)                                                                                                                                                           |
| Gateway và nhật ký         | [`gateway`](/vi/cli/gateway) · [`logs`](/vi/cli/logs) · [`system`](/vi/cli/system)                                                                                                                                                                 |
| Mô hình và suy luận        | [`models`](/vi/cli/models) · [`infer`](/vi/cli/infer) · `capability` (bí danh cho [`infer`](/vi/cli/infer)) · [`memory`](/vi/cli/memory) · [`commitments`](/vi/cli/commitments) · [`wiki`](/vi/cli/wiki)                                                    |
| Mạng và Node               | [`directory`](/vi/cli/directory) · [`nodes`](/vi/cli/nodes) · [`devices`](/vi/cli/devices) · [`node`](/vi/cli/node)                                                                                                                                   |
| Runtime và sandbox         | [`approvals`](/vi/cli/approvals) · `exec-policy` (xem [`approvals`](/vi/cli/approvals)) · [`sandbox`](/vi/cli/sandbox) · [`tui`](/vi/cli/tui) · `chat`/`terminal` (bí danh cho [`tui --local`](/vi/cli/tui)) · [`browser`](/vi/cli/browser)                 |
| Tự động hóa                | [`cron`](/vi/cli/cron) · [`tasks`](/vi/cli/tasks) · [`hooks`](/vi/cli/hooks) · [`webhooks`](/vi/cli/webhooks)                                                                                                                                         |
| Khám phá và tài liệu       | [`dns`](/vi/cli/dns) · [`docs`](/vi/cli/docs)                                                                                                                                                                                                   |
| Ghép nối và kênh           | [`pairing`](/vi/cli/pairing) · [`qr`](/vi/cli/qr) · [`channels`](/vi/cli/channels)                                                                                                                                                                 |
| Bảo mật và Plugin          | [`security`](/vi/cli/security) · [`secrets`](/vi/cli/secrets) · [`skills`](/vi/cli/skills) · [`plugins`](/vi/cli/plugins) · [`proxy`](/vi/cli/proxy)                                                                                                     |
| Bí danh kế thừa            | [`daemon`](/vi/cli/daemon) (dịch vụ Gateway) · [`clawbot`](/vi/cli/clawbot) (không gian tên)                                                                                                                                                    |
| Plugin (tùy chọn)          | [`voicecall`](/vi/cli/voicecall) (nếu đã cài đặt)                                                                                                                                                                                            |

## Cờ toàn cục

| Cờ                      | Mục đích                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| `--dev`                 | Cô lập trạng thái trong `~/.openclaw-dev` và dịch chuyển các cổng mặc định |
| `--profile <name>`      | Cô lập trạng thái trong `~/.openclaw-<name>`                          |
| `--container <name>`    | Nhắm đến một container được đặt tên để thực thi                       |
| `--no-color`            | Tắt màu ANSI (`NO_COLOR=1` cũng được tôn trọng)                       |
| `--update`              | Viết tắt cho [`openclaw update`](/vi/cli/update) (chỉ với bản cài từ nguồn) |
| `-V`, `--version`, `-v` | In phiên bản và thoát                                                 |

## Chế độ đầu ra

- Màu ANSI và chỉ báo tiến trình chỉ hiển thị trong các phiên TTY.
- Siêu liên kết OSC-8 hiển thị dưới dạng liên kết có thể nhấp khi được hỗ trợ; nếu không, CLI sẽ chuyển về URL thuần.
- `--json` (và `--plain` khi được hỗ trợ) tắt định kiểu để có đầu ra sạch.
- Các lệnh chạy lâu hiển thị chỉ báo tiến trình (OSC 9;4 khi được hỗ trợ).

Nguồn chuẩn của bảng màu: `src/terminal/palette.ts`.

## Cây lệnh

<Accordion title="Cây lệnh đầy đủ">

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

Plugin có thể thêm các lệnh cấp cao nhất bổ sung (ví dụ `openclaw voicecall`).

</Accordion>

## Lệnh gạch chéo trong chat

Tin nhắn chat hỗ trợ các lệnh `/...`. Xem [lệnh gạch chéo](/vi/tools/slash-commands).

Điểm nổi bật:

- `/status` — chẩn đoán nhanh.
- `/trace` — các dòng truy vết/gỡ lỗi Plugin trong phạm vi phiên.
- `/config` — thay đổi cấu hình được lưu bền vững.
- `/debug` — ghi đè cấu hình chỉ trong runtime (trong bộ nhớ, không ghi ra đĩa; yêu cầu `commands.debug: true`).

## Theo dõi mức sử dụng

`openclaw status --usage` và Control UI hiển thị mức sử dụng/hạn mức của nhà cung cấp khi có thông tin xác thực OAuth/API. Dữ liệu đến trực tiếp từ các endpoint mức sử dụng của nhà cung cấp và được chuẩn hóa thành `X% left`. Các nhà cung cấp có cửa sổ mức sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI, OpenAI Codex, MiniMax, Xiaomi và z.ai.

Xem [Theo dõi mức sử dụng](/vi/concepts/usage-tracking) để biết chi tiết.

## Liên quan

- [Lệnh gạch chéo](/vi/tools/slash-commands)
- [Cấu hình](/vi/gateway/configuration)
- [Môi trường](/vi/help/environment)
