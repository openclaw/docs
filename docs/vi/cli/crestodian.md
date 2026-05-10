---
read_when:
    - Bạn chạy openclaw không kèm lệnh nào và muốn hiểu Crestodian
    - Bạn cần một cách an toàn không phụ thuộc vào cấu hình để kiểm tra hoặc sửa chữa OpenClaw
    - Bạn đang thiết kế hoặc bật chế độ cứu hộ kênh nhắn tin
summary: Tài liệu tham chiếu CLI và mô hình bảo mật cho Crestodian, trình trợ giúp thiết lập và sửa chữa an toàn khi không cần cấu hình
title: Crestodian
x-i18n:
    generated_at: "2026-05-10T19:27:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9124629ed8d4df00b8d4bee683bae3d336b7fadfa5a4fc8d84fb5e51be540fb
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian là trình trợ giúp thiết lập cục bộ, sửa chữa và cấu hình của OpenClaw. Công cụ này được
thiết kế để vẫn có thể truy cập được khi đường dẫn agent thông thường bị hỏng.

Chạy `openclaw` mà không có lệnh sẽ khởi động Crestodian trong terminal tương tác.
Chạy `openclaw crestodian` sẽ khởi động rõ ràng cùng trình trợ giúp đó.

## Crestodian hiển thị những gì

Khi khởi động, Crestodian tương tác mở cùng shell TUI được dùng bởi
`openclaw tui`, với backend chat của Crestodian. Nhật ký chat bắt đầu bằng một lời
chào ngắn:

- khi nào nên khởi động Crestodian
- model hoặc đường dẫn bộ lập kế hoạch xác định mà Crestodian thực sự đang dùng
- tính hợp lệ của cấu hình và agent mặc định
- khả năng truy cập Gateway từ lần thăm dò khởi động đầu tiên
- hành động gỡ lỗi tiếp theo mà Crestodian có thể thực hiện

Nó không đổ secrets hoặc tải các lệnh CLI của Plugin chỉ để khởi động. TUI
vẫn cung cấp header, nhật ký chat, dòng trạng thái, footer, autocomplete,
và các điều khiển trình soạn thảo thông thường.

Dùng `status` để xem bản kiểm kê chi tiết với đường dẫn cấu hình, đường dẫn docs/source,
các thăm dò CLI cục bộ, sự hiện diện của khóa API, agents, model, và chi tiết Gateway.

Crestodian dùng cùng cơ chế khám phá tham chiếu OpenClaw như các agent thông thường. Trong một Git checkout,
nó trỏ chính nó đến `docs/` cục bộ và cây mã nguồn cục bộ. Trong bản cài đặt gói npm, nó
dùng tài liệu được đóng gói kèm và liên kết đến
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), với hướng dẫn rõ ràng
rằng cần xem lại mã nguồn bất cứ khi nào tài liệu chưa đủ.

## Ví dụ

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

Bên trong TUI của Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Khởi động an toàn

Đường dẫn khởi động của Crestodian được cố ý giữ nhỏ. Nó có thể chạy khi:

- thiếu `openclaw.json`
- `openclaw.json` không hợp lệ
- Gateway đang tắt
- đăng ký lệnh Plugin không khả dụng
- chưa có agent nào được cấu hình

`openclaw --help` và `openclaw --version` vẫn dùng các đường dẫn nhanh thông thường.
`openclaw` không tương tác thoát với một thông báo ngắn thay vì in trợ giúp gốc,
vì sản phẩm không lệnh là Crestodian.

## Thao tác và phê duyệt

Crestodian dùng các thao tác có kiểu thay vì chỉnh sửa cấu hình tùy tiện.

Các thao tác chỉ đọc có thể chạy ngay:

- hiển thị tổng quan
- liệt kê agents
- liệt kê các plugins đã cài đặt
- tìm kiếm plugins ClawHub
- hiển thị trạng thái model/backend
- chạy kiểm tra trạng thái hoặc sức khỏe
- kiểm tra khả năng truy cập Gateway
- chạy doctor mà không có sửa chữa tương tác
- xác thực cấu hình
- hiển thị đường dẫn audit-log

Các thao tác bền vững yêu cầu phê duyệt qua hội thoại trong chế độ tương tác trừ khi
bạn truyền `--yes` cho một lệnh trực tiếp:

- ghi cấu hình
- chạy `config set`
- đặt các giá trị SecretRef được hỗ trợ thông qua `config set-ref`
- chạy bootstrap thiết lập/onboarding
- thay đổi model mặc định
- khởi động, dừng hoặc khởi động lại Gateway
- tạo agents
- cài đặt plugins từ ClawHub hoặc npm
- gỡ cài đặt plugins
- chạy các sửa chữa doctor ghi lại cấu hình hoặc trạng thái

Các lần ghi đã áp dụng được ghi lại trong:

```text
~/.openclaw/audit/crestodian.jsonl
```

Khám phá không được audit. Chỉ các thao tác đã áp dụng và các lần ghi mới được ghi nhật ký.

`openclaw onboard --modern` khởi động Crestodian dưới dạng bản xem trước onboarding hiện đại.
`openclaw onboard` thuần vẫn chạy onboarding cổ điển.

## Bootstrap thiết lập

`setup` là bootstrap onboarding ưu tiên chat. Nó chỉ ghi thông qua các thao tác
cấu hình có kiểu và hỏi phê duyệt trước.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Khi chưa có model nào được cấu hình, setup chọn backend dùng được đầu tiên theo
thứ tự này và cho bạn biết nó đã chọn gì:

- model rõ ràng hiện có, nếu đã được cấu hình
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Nếu không có backend nào khả dụng, setup vẫn ghi workspace mặc định và để
model chưa được đặt. Cài đặt hoặc đăng nhập vào Codex/Claude Code, hoặc cung cấp
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, rồi chạy lại setup.

## Bộ lập kế hoạch được model hỗ trợ

Crestodian luôn khởi động ở chế độ xác định. Với các lệnh mơ hồ mà bộ phân tích
xác định không hiểu, Crestodian cục bộ có thể thực hiện một lượt lập kế hoạch có giới hạn
thông qua các đường dẫn runtime thông thường của OpenClaw. Trước tiên nó dùng
model OpenClaw đã cấu hình. Nếu chưa có model đã cấu hình nào dùng được, nó có thể
dự phòng sang các runtime cục bộ đã có trên máy:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

Bộ lập kế hoạch được model hỗ trợ không thể trực tiếp thay đổi cấu hình. Nó phải dịch
yêu cầu thành một trong các lệnh có kiểu của Crestodian, sau đó các quy tắc phê duyệt và
audit thông thường sẽ áp dụng. Crestodian in model mà nó đã dùng và lệnh đã diễn giải
trước khi chạy bất cứ thứ gì. Các lượt lập kế hoạch dự phòng không có cấu hình là
tạm thời, bị tắt công cụ ở nơi runtime hỗ trợ, và dùng workspace/session
tạm thời.

Chế độ cứu hộ qua kênh nhắn tin không dùng bộ lập kế hoạch được model hỗ trợ. Cứu hộ từ xa
vẫn xác định để đường dẫn agent thông thường bị hỏng hoặc bị xâm phạm không thể
được dùng làm trình chỉnh sửa cấu hình.

## Chuyển sang agent

Dùng bộ chọn bằng ngôn ngữ tự nhiên để rời Crestodian và mở TUI thông thường:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, và `openclaw terminal` vẫn mở trực tiếp
TUI agent thông thường. Chúng không khởi động Crestodian.

Sau khi chuyển vào TUI thông thường, dùng `/crestodian` để quay lại Crestodian.
Bạn có thể kèm một yêu cầu tiếp theo:

```text
/crestodian
/crestodian restart gateway
```

Các lần chuyển agent bên trong TUI để lại một dấu vết cho biết `/crestodian` khả dụng.

## Chế độ cứu hộ qua tin nhắn

Chế độ cứu hộ qua tin nhắn là điểm vào kênh nhắn tin cho Crestodian. Nó dành cho
trường hợp agent thông thường của bạn đã chết, nhưng một kênh đáng tin cậy như WhatsApp
vẫn nhận được lệnh.

Lệnh văn bản được hỗ trợ:

- `/crestodian <request>`

Luồng vận hành:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

Việc tạo agent cũng có thể được đưa vào hàng đợi từ prompt cục bộ hoặc chế độ cứu hộ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Chế độ cứu hộ từ xa là một bề mặt quản trị. Nó phải được xử lý như sửa chữa cấu hình
từ xa, không giống chat thông thường.

Hợp đồng bảo mật cho cứu hộ từ xa:

- Bị tắt khi sandboxing đang hoạt động. Nếu một agent/session đang bị sandbox,
  Crestodian phải từ chối cứu hộ từ xa và giải thích rằng cần sửa chữa bằng CLI cục bộ.
- Trạng thái hiệu lực mặc định là `auto`: chỉ cho phép cứu hộ từ xa trong vận hành YOLO
  đáng tin cậy, nơi runtime đã có quyền cục bộ không sandbox.
- Yêu cầu danh tính owner rõ ràng. Cứu hộ không được chấp nhận các quy tắc người gửi
  wildcard, chính sách nhóm mở, webhooks chưa xác thực, hoặc kênh ẩn danh.
- Mặc định chỉ owner DMs. Cứu hộ trong group/channel yêu cầu opt-in rõ ràng.
- Tìm kiếm và liệt kê Plugin là chỉ đọc. Cài đặt Plugin mặc định chỉ cục bộ
  vì nó tải mã thực thi. Gỡ cài đặt Plugin có thể được cho phép như một
  thao tác sửa chữa đã phê duyệt khi chính sách cứu hộ cho phép ghi bền vững.
- Cứu hộ từ xa không thể mở TUI cục bộ hoặc chuyển vào một phiên agent
  tương tác. Dùng `openclaw` cục bộ để bàn giao agent.
- Các lần ghi bền vững vẫn yêu cầu phê duyệt, ngay cả trong chế độ cứu hộ.
- Audit mọi thao tác cứu hộ đã áp dụng. Cứu hộ qua kênh nhắn tin ghi lại metadata về kênh,
  tài khoản, người gửi, và địa chỉ nguồn. Các thao tác thay đổi cấu hình cũng
  ghi lại hash cấu hình trước và sau.
- Không bao giờ lặp lại secrets. Kiểm tra SecretRef nên báo cáo tính sẵn có, không phải
  giá trị.
- Nếu Gateway còn sống, ưu tiên các thao tác có kiểu qua Gateway. Nếu Gateway đã chết,
  chỉ dùng bề mặt sửa chữa cục bộ tối thiểu không phụ thuộc vào vòng lặp agent
  thông thường.

Dạng cấu hình:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` nên chấp nhận:

- `"auto"`: mặc định. Chỉ cho phép khi runtime hiệu lực là YOLO và
  sandboxing đang tắt.
- `false`: không bao giờ cho phép cứu hộ qua kênh nhắn tin.
- `true`: cho phép rõ ràng cứu hộ khi các kiểm tra owner/channel đạt yêu cầu. Điều này
  vẫn không được bỏ qua lệnh từ chối do sandboxing.

Tư thế YOLO `"auto"` mặc định là:

- sandbox mode phân giải thành `off`
- `tools.exec.security` phân giải thành `full`
- `tools.exec.ask` phân giải thành `off`

Cứu hộ từ xa được bao phủ bởi Docker lane:

```bash
pnpm test:docker:crestodian-rescue
```

Dự phòng bộ lập kế hoạch cục bộ không có cấu hình được bao phủ bởi:

```bash
pnpm test:docker:crestodian-planner
```

Một kiểm tra khói opt-in trên bề mặt lệnh kênh live kiểm tra `/crestodian status` cộng với một
vòng phê duyệt bền vững thông qua handler cứu hộ:

```bash
pnpm test:live:crestodian-rescue-channel
```

Thiết lập mới không có cấu hình thông qua Crestodian được bao phủ bởi:

```bash
pnpm test:docker:crestodian-first-run
```

Lane đó bắt đầu với một thư mục trạng thái trống, định tuyến `openclaw` trần đến Crestodian,
đặt model mặc định, tạo thêm một agent, cấu hình Discord thông qua
bật Plugin cộng với token SecretRef, xác thực cấu hình, và kiểm tra audit
log. QA Lab cũng có một kịch bản dựa trên repo cho cùng luồng Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/cli/doctor)
- [TUI](/vi/cli/tui)
- [Sandbox](/vi/cli/sandbox)
- [Bảo mật](/vi/cli/security)
