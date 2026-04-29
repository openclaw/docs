---
read_when:
    - Bạn chạy openclaw không kèm lệnh nào và muốn tìm hiểu Crestodian
    - Bạn cần một cách an toàn khi không có cấu hình để kiểm tra hoặc sửa chữa OpenClaw
    - Bạn đang thiết kế hoặc kích hoạt chế độ cứu hộ cho kênh tin nhắn
summary: Tài liệu tham chiếu CLI và mô hình bảo mật cho Crestodian, trình trợ giúp thiết lập và sửa chữa an toàn khi không có cấu hình
title: Crestodian
x-i18n:
    generated_at: "2026-04-29T22:31:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian là trợ lý thiết lập cục bộ, sửa chữa và cấu hình của OpenClaw. Nó được
thiết kế để vẫn có thể truy cập khi đường dẫn tác tử thông thường bị hỏng.

Chạy `openclaw` mà không có lệnh sẽ khởi động Crestodian trong một terminal tương tác.
Chạy `openclaw crestodian` sẽ khởi động rõ ràng cùng trợ lý đó.

## Những gì Crestodian hiển thị

Khi khởi động, Crestodian tương tác mở cùng TUI shell được dùng bởi
`openclaw tui`, với backend trò chuyện Crestodian. Nhật ký trò chuyện bắt đầu bằng một
lời chào ngắn:

- khi nào nên khởi động Crestodian
- mô hình hoặc đường dẫn bộ lập kế hoạch tất định mà Crestodian thực sự đang dùng
- tính hợp lệ của cấu hình và tác tử mặc định
- khả năng tiếp cận Gateway từ lần dò khởi động đầu tiên
- hành động gỡ lỗi tiếp theo mà Crestodian có thể thực hiện

Nó không xuất bí mật hoặc tải các lệnh CLI của Plugin chỉ để khởi động. TUI
vẫn cung cấp header, nhật ký trò chuyện, dòng trạng thái, footer, tự động hoàn thành,
và điều khiển trình soạn thảo thông thường.

Dùng `status` để xem bản kiểm kê chi tiết với đường dẫn cấu hình, đường dẫn docs/source,
các lần dò CLI cục bộ, sự hiện diện của khóa API, tác tử, mô hình và chi tiết Gateway.

Crestodian dùng cùng cơ chế khám phá tham chiếu OpenClaw như các tác tử thông thường. Trong một Git checkout,
nó tự trỏ đến `docs/` cục bộ và cây mã nguồn cục bộ. Trong bản cài đặt gói npm, nó
dùng tài liệu được đóng gói kèm và liên kết tới
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), kèm hướng dẫn rõ ràng
để xem lại mã nguồn bất cứ khi nào tài liệu chưa đủ.

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
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Khởi động an toàn

Đường dẫn khởi động của Crestodian được cố ý giữ nhỏ. Nó có thể chạy khi:

- thiếu `openclaw.json`
- `openclaw.json` không hợp lệ
- Gateway đang ngừng hoạt động
- không thể đăng ký lệnh Plugin
- chưa cấu hình tác tử nào

`openclaw --help` và `openclaw --version` vẫn dùng các đường dẫn nhanh thông thường.
`openclaw` không tương tác thoát với một thông báo ngắn thay vì in trợ giúp gốc,
vì sản phẩm không có lệnh là Crestodian.

## Thao tác và phê duyệt

Crestodian dùng các thao tác có kiểu thay vì chỉnh sửa cấu hình tùy ý.

Các thao tác chỉ đọc có thể chạy ngay:

- hiển thị tổng quan
- liệt kê tác tử
- hiển thị trạng thái mô hình/backend
- chạy kiểm tra trạng thái hoặc sức khỏe
- kiểm tra khả năng tiếp cận Gateway
- chạy doctor mà không sửa tương tác
- xác thực cấu hình
- hiển thị đường dẫn nhật ký kiểm toán

Các thao tác bền vững yêu cầu phê duyệt qua hội thoại trong chế độ tương tác trừ khi
bạn truyền `--yes` cho một lệnh trực tiếp:

- ghi cấu hình
- chạy `config set`
- đặt các giá trị SecretRef được hỗ trợ thông qua `config set-ref`
- chạy bootstrap thiết lập/onboarding
- thay đổi mô hình mặc định
- khởi động, dừng hoặc khởi động lại Gateway
- tạo tác tử
- chạy các sửa chữa doctor ghi lại cấu hình hoặc trạng thái

Các lần ghi đã áp dụng được ghi lại trong:

```text
~/.openclaw/audit/crestodian.jsonl
```

Việc khám phá không được kiểm toán. Chỉ các thao tác đã áp dụng và các lần ghi mới được ghi nhật ký.

`openclaw onboard --modern` khởi động Crestodian dưới dạng bản xem trước onboarding hiện đại.
`openclaw onboard` thuần vẫn chạy onboarding cổ điển.

## Bootstrap thiết lập

`setup` là bootstrap onboarding ưu tiên trò chuyện. Nó chỉ ghi thông qua các
thao tác cấu hình có kiểu và hỏi phê duyệt trước.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Khi chưa cấu hình mô hình nào, setup chọn backend dùng được đầu tiên theo thứ tự này
và cho bạn biết nó đã chọn gì:

- mô hình rõ ràng hiện có, nếu đã được cấu hình
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Nếu không có backend nào khả dụng, setup vẫn ghi workspace mặc định và để
mô hình chưa đặt. Cài đặt hoặc đăng nhập vào Codex/Claude Code, hoặc cung cấp
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, rồi chạy lại setup.

## Bộ lập kế hoạch có mô hình hỗ trợ

Crestodian luôn khởi động ở chế độ tất định. Với các lệnh mơ hồ mà bộ phân tích cú pháp
tất định không hiểu, Crestodian cục bộ có thể thực hiện một lượt lập kế hoạch có giới hạn
thông qua các đường dẫn runtime thông thường của OpenClaw. Trước tiên nó dùng
mô hình OpenClaw đã cấu hình. Nếu chưa có mô hình đã cấu hình nào dùng được, nó có thể
fallback sang các runtime cục bộ đã có trên máy:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` with `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Bộ lập kế hoạch có mô hình hỗ trợ không thể trực tiếp thay đổi cấu hình. Nó phải dịch
yêu cầu thành một trong các lệnh có kiểu của Crestodian, sau đó áp dụng các quy tắc
phê duyệt và kiểm toán thông thường. Crestodian in mô hình nó đã dùng và lệnh
được diễn giải trước khi chạy bất cứ thứ gì. Các lượt fallback lập kế hoạch không có cấu hình là
tạm thời, bị tắt công cụ ở nơi runtime hỗ trợ, và dùng workspace/session
tạm thời.

Chế độ cứu hộ qua kênh tin nhắn không dùng bộ lập kế hoạch có mô hình hỗ trợ. Cứu hộ từ xa
vẫn tất định để đường dẫn tác tử thông thường bị hỏng hoặc bị xâm phạm không thể
được dùng làm trình chỉnh sửa cấu hình.

## Chuyển sang tác tử

Dùng bộ chọn bằng ngôn ngữ tự nhiên để rời Crestodian và mở TUI thông thường:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, và `openclaw terminal` vẫn mở trực tiếp TUI
tác tử thông thường. Chúng không khởi động Crestodian.

Sau khi chuyển vào TUI thông thường, dùng `/crestodian` để quay lại Crestodian.
Bạn có thể kèm theo một yêu cầu tiếp nối:

```text
/crestodian
/crestodian restart gateway
```

Các lần chuyển tác tử bên trong TUI để lại một dấu vết cho biết `/crestodian` có sẵn.

## Chế độ cứu hộ qua tin nhắn

Chế độ cứu hộ qua tin nhắn là điểm vào kênh tin nhắn cho Crestodian. Nó dành cho
trường hợp tác tử thông thường của bạn đã chết, nhưng một kênh tin cậy như WhatsApp
vẫn nhận lệnh.

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

Việc tạo tác tử cũng có thể được đưa vào hàng đợi từ prompt cục bộ hoặc chế độ cứu hộ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Chế độ cứu hộ từ xa là một bề mặt quản trị. Nó phải được đối xử như sửa chữa cấu hình
từ xa, không phải như trò chuyện thông thường.

Hợp đồng bảo mật cho cứu hộ từ xa:

- Tắt khi sandboxing đang hoạt động. Nếu một tác tử/session đang bị sandbox,
  Crestodian phải từ chối cứu hộ từ xa và giải thích rằng cần sửa chữa bằng CLI cục bộ.
- Trạng thái hiệu lực mặc định là `auto`: chỉ cho phép cứu hộ từ xa trong vận hành YOLO
  tin cậy, nơi runtime đã có quyền cục bộ không bị sandbox.
- Yêu cầu danh tính chủ sở hữu rõ ràng. Cứu hộ không được chấp nhận quy tắc người gửi
  wildcard, chính sách nhóm mở, Webhook chưa xác thực, hoặc kênh ẩn danh.
- Mặc định chỉ DM chủ sở hữu. Cứu hộ nhóm/kênh yêu cầu opt-in rõ ràng.
- Cứu hộ từ xa không thể mở TUI cục bộ hoặc chuyển vào một session tác tử
  tương tác. Dùng `openclaw` cục bộ để bàn giao tác tử.
- Các lần ghi bền vững vẫn yêu cầu phê duyệt, kể cả trong chế độ cứu hộ.
- Kiểm toán mọi thao tác cứu hộ đã áp dụng. Cứu hộ qua kênh tin nhắn ghi lại metadata
  kênh, tài khoản, người gửi và địa chỉ nguồn. Các thao tác thay đổi cấu hình cũng
  ghi lại hash cấu hình trước và sau.
- Không bao giờ lặp lại bí mật. Kiểm tra SecretRef nên báo cáo tính khả dụng, không phải
  giá trị.
- Nếu Gateway còn sống, ưu tiên các thao tác có kiểu của Gateway. Nếu Gateway
  đã chết, chỉ dùng bề mặt sửa chữa cục bộ tối thiểu không phụ thuộc vào vòng lặp
  tác tử thông thường.

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
  sandboxing tắt.
- `false`: không bao giờ cho phép cứu hộ qua kênh tin nhắn.
- `true`: cho phép rõ ràng cứu hộ khi các kiểm tra chủ sở hữu/kênh đạt. Điều này
  vẫn không được bỏ qua việc từ chối sandboxing.

Tư thế YOLO `"auto"` mặc định là:

- chế độ sandbox phân giải thành `off`
- `tools.exec.security` phân giải thành `full`
- `tools.exec.ask` phân giải thành `off`

Cứu hộ từ xa được bao phủ bởi lane Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Fallback bộ lập kế hoạch cục bộ không có cấu hình được bao phủ bởi:

```bash
pnpm test:docker:crestodian-planner
```

Một smoke bề mặt lệnh kênh live opt-in kiểm tra `/crestodian status` cùng một
vòng phê duyệt bền vững thông qua trình xử lý cứu hộ:

```bash
pnpm test:live:crestodian-rescue-channel
```

Thiết lập mới không có cấu hình thông qua Crestodian được bao phủ bởi:

```bash
pnpm test:docker:crestodian-first-run
```

Lane đó bắt đầu với một thư mục trạng thái trống, định tuyến `openclaw` trần tới Crestodian,
đặt mô hình mặc định, tạo một tác tử bổ sung, cấu hình Discord thông qua
việc bật Plugin cùng token SecretRef, xác thực cấu hình, và kiểm tra nhật ký kiểm toán.
QA Lab cũng có một kịch bản dựa trên repo cho cùng luồng Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/cli/doctor)
- [TUI](/vi/cli/tui)
- [Sandbox](/vi/cli/sandbox)
- [Bảo mật](/vi/cli/security)
