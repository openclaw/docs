---
read_when:
    - Bạn chạy openclaw mà không kèm lệnh nào và muốn hiểu Crestodian
    - Bạn cần một cách an toàn khi không có cấu hình để kiểm tra hoặc sửa chữa OpenClaw
    - Bạn đang thiết kế hoặc kích hoạt chế độ cứu hộ cho kênh nhắn tin
summary: Tham chiếu CLI và mô hình bảo mật cho Crestodian, trình trợ giúp thiết lập và sửa chữa an toàn khi không cần cấu hình
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T10:36:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian là trình trợ giúp thiết lập cục bộ, sửa chữa và cấu hình của OpenClaw. Công cụ này được thiết kế để vẫn có thể truy cập khi đường dẫn agent thông thường bị hỏng.

Chạy `openclaw` mà không có lệnh sẽ khởi động Crestodian trong terminal tương tác. Chạy `openclaw crestodian` sẽ khởi động rõ ràng cùng trình trợ giúp đó.

## Crestodian hiển thị gì

Khi khởi động, Crestodian tương tác mở cùng shell TUI được dùng bởi `openclaw tui`, với backend trò chuyện Crestodian. Nhật ký trò chuyện bắt đầu bằng một lời chào ngắn:

- khi nào nên khởi động Crestodian
- mô hình hoặc đường dẫn bộ lập kế hoạch xác định mà Crestodian thực sự đang dùng
- tính hợp lệ của cấu hình và agent mặc định
- khả năng kết nối Gateway từ lần dò khởi động đầu tiên
- hành động gỡ lỗi tiếp theo mà Crestodian có thể thực hiện

Công cụ này không xuất bí mật hoặc tải các lệnh CLI của Plugin chỉ để khởi động. TUI vẫn cung cấp header, nhật ký trò chuyện, dòng trạng thái, footer, tự động hoàn thành và các điều khiển trình soạn thảo thông thường.

Dùng `status` để xem bản kiểm kê chi tiết với đường dẫn cấu hình, đường dẫn tài liệu/nguồn, các phép dò CLI cục bộ, sự hiện diện của khóa API, agent, mô hình và chi tiết Gateway.

Crestodian dùng cùng cơ chế khám phá tham chiếu OpenClaw như các agent thông thường. Trong một bản checkout Git, nó tự trỏ đến `docs/` cục bộ và cây nguồn cục bộ. Trong bản cài đặt gói npm, nó dùng tài liệu đi kèm gói và liên kết đến [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), kèm hướng dẫn rõ ràng để xem lại mã nguồn bất cứ khi nào tài liệu không đủ.

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

Đường dẫn khởi động của Crestodian được cố ý giữ nhỏ gọn. Nó có thể chạy khi:

- thiếu `openclaw.json`
- `openclaw.json` không hợp lệ
- Gateway ngừng hoạt động
- không thể đăng ký lệnh Plugin
- chưa có agent nào được cấu hình

`openclaw --help` và `openclaw --version` vẫn dùng các đường dẫn nhanh thông thường. `openclaw` không tương tác thoát với một thông báo ngắn thay vì in trợ giúp gốc, vì sản phẩm không lệnh là Crestodian.

## Thao tác và phê duyệt

Crestodian dùng các thao tác có kiểu thay vì chỉnh sửa cấu hình tùy tiện.

Các thao tác chỉ đọc có thể chạy ngay:

- hiển thị tổng quan
- liệt kê agent
- liệt kê các Plugin đã cài đặt
- tìm kiếm Plugin ClawHub
- hiển thị trạng thái mô hình/backend
- chạy kiểm tra trạng thái hoặc sức khỏe
- kiểm tra khả năng kết nối Gateway
- chạy doctor mà không có sửa chữa tương tác
- xác thực cấu hình
- hiển thị đường dẫn nhật ký kiểm toán

Các thao tác bền vững yêu cầu phê duyệt qua hội thoại trong chế độ tương tác, trừ khi bạn truyền `--yes` cho một lệnh trực tiếp:

- ghi cấu hình
- chạy `config set`
- đặt các giá trị SecretRef được hỗ trợ thông qua `config set-ref`
- chạy bootstrap thiết lập/onboarding
- thay đổi mô hình mặc định
- khởi động, dừng hoặc khởi động lại Gateway
- tạo agent
- cài đặt Plugin từ ClawHub hoặc npm
- gỡ cài đặt Plugin
- chạy các sửa chữa doctor ghi lại cấu hình hoặc trạng thái

Các lần ghi đã áp dụng được ghi lại trong:

```text
~/.openclaw/audit/crestodian.jsonl
```

Khám phá không được kiểm toán. Chỉ các thao tác và lần ghi đã áp dụng được ghi nhật ký.

`openclaw onboard --modern` khởi động Crestodian dưới dạng bản xem trước onboarding hiện đại. `openclaw onboard` thuần vẫn chạy onboarding cổ điển.

## Bootstrap thiết lập

`setup` là bootstrap onboarding ưu tiên trò chuyện. Nó chỉ ghi thông qua các thao tác cấu hình có kiểu và yêu cầu phê duyệt trước.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Khi chưa cấu hình mô hình, thiết lập chọn backend dùng được đầu tiên theo thứ tự này và cho bạn biết nó đã chọn gì:

- mô hình rõ ràng hiện có, nếu đã được cấu hình
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

Nếu không có tùy chọn nào khả dụng, thiết lập vẫn ghi workspace mặc định và để mô hình chưa được đặt. Cài đặt hoặc đăng nhập vào Codex/Claude Code, hoặc cung cấp `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, rồi chạy lại thiết lập.

## Bộ lập kế hoạch có hỗ trợ mô hình

Crestodian luôn khởi động ở chế độ xác định. Với các lệnh mơ hồ mà bộ phân tích cú pháp xác định không hiểu, Crestodian cục bộ có thể thực hiện một lượt lập kế hoạch có giới hạn thông qua các đường dẫn runtime thông thường của OpenClaw. Trước tiên nó dùng mô hình OpenClaw đã cấu hình. Nếu chưa có mô hình đã cấu hình nào dùng được, nó có thể fallback về các runtime cục bộ đã có trên máy:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` với `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

Bộ lập kế hoạch có hỗ trợ mô hình không thể trực tiếp thay đổi cấu hình. Nó phải dịch yêu cầu thành một trong các lệnh có kiểu của Crestodian, sau đó các quy tắc phê duyệt và kiểm toán thông thường sẽ áp dụng. Crestodian in mô hình đã dùng và lệnh đã diễn giải trước khi chạy bất cứ thứ gì. Các lượt lập kế hoạch fallback không có cấu hình là tạm thời, bị tắt công cụ ở nơi runtime hỗ trợ, và dùng workspace/phiên tạm thời.

Chế độ cứu hộ qua kênh tin nhắn không dùng bộ lập kế hoạch có hỗ trợ mô hình. Cứu hộ từ xa vẫn mang tính xác định để đường dẫn agent thông thường bị hỏng hoặc bị xâm phạm không thể được dùng làm trình chỉnh sửa cấu hình.

## Chuyển sang agent

Dùng bộ chọn ngôn ngữ tự nhiên để rời Crestodian và mở TUI thông thường:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` và `openclaw terminal` vẫn mở trực tiếp TUI agent thông thường. Chúng không khởi động Crestodian.

Sau khi chuyển vào TUI thông thường, dùng `/crestodian` để quay lại Crestodian. Bạn có thể kèm theo một yêu cầu tiếp nối:

```text
/crestodian
/crestodian restart gateway
```

Các lần chuyển agent bên trong TUI để lại dấu vết cho biết `/crestodian` có sẵn.

## Chế độ cứu hộ qua tin nhắn

Chế độ cứu hộ qua tin nhắn là điểm vào kênh tin nhắn cho Crestodian. Nó dành cho trường hợp agent thông thường của bạn đã chết, nhưng một kênh đáng tin cậy như WhatsApp vẫn nhận lệnh.

Lệnh văn bản được hỗ trợ:

- `/crestodian <request>`

Luồng của người vận hành:

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

Chế độ cứu hộ từ xa là một bề mặt quản trị. Nó phải được xử lý như sửa chữa cấu hình từ xa, không phải như trò chuyện thông thường.

Hợp đồng bảo mật cho cứu hộ từ xa:

- Bị vô hiệu hóa khi sandboxing đang hoạt động. Nếu một agent/phiên đang bị sandbox, Crestodian phải từ chối cứu hộ từ xa và giải thích rằng cần sửa chữa bằng CLI cục bộ.
- Trạng thái hiệu lực mặc định là `auto`: chỉ cho phép cứu hộ từ xa trong thao tác YOLO đáng tin cậy, nơi runtime đã có quyền cục bộ không sandbox.
- Yêu cầu danh tính chủ sở hữu rõ ràng. Cứu hộ không được chấp nhận quy tắc người gửi wildcard, chính sách nhóm mở, Webhook chưa xác thực hoặc kênh ẩn danh.
- Mặc định chỉ DM của chủ sở hữu. Cứu hộ qua nhóm/kênh yêu cầu bật rõ ràng.
- Tìm kiếm và liệt kê Plugin là chỉ đọc. Theo mặc định, cài đặt Plugin chỉ ở cục bộ vì thao tác này tải xuống mã thực thi. Gỡ cài đặt Plugin có thể được cho phép như một thao tác sửa chữa đã phê duyệt khi chính sách cứu hộ cho phép các lần ghi bền vững.
- Cứu hộ từ xa không thể mở TUI cục bộ hoặc chuyển vào một phiên agent tương tác. Dùng `openclaw` cục bộ để bàn giao agent.
- Các lần ghi bền vững vẫn yêu cầu phê duyệt, ngay cả trong chế độ cứu hộ.
- Kiểm toán mọi thao tác cứu hộ đã áp dụng. Cứu hộ qua kênh tin nhắn ghi lại metadata kênh, tài khoản, người gửi và địa chỉ nguồn. Các thao tác làm thay đổi cấu hình cũng ghi lại hash cấu hình trước và sau.
- Không bao giờ echo bí mật. Kiểm tra SecretRef nên báo cáo tính khả dụng, không báo cáo giá trị.
- Nếu Gateway còn sống, ưu tiên các thao tác có kiểu của Gateway. Nếu Gateway đã chết, chỉ dùng bề mặt sửa chữa cục bộ tối thiểu không phụ thuộc vào vòng lặp agent thông thường.

Hình dạng cấu hình:

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

- `"auto"`: mặc định. Chỉ cho phép khi runtime hiệu lực là YOLO và sandboxing tắt.
- `false`: không bao giờ cho phép cứu hộ qua kênh tin nhắn.
- `true`: cho phép cứu hộ rõ ràng khi các kiểm tra chủ sở hữu/kênh đạt. Điều này vẫn không được bỏ qua từ chối sandboxing.

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

Một smoke bề mặt lệnh kênh trực tiếp tùy chọn kiểm tra `/crestodian status` cộng với một vòng phê duyệt bền vững thông qua trình xử lý cứu hộ:

```bash
pnpm test:live:crestodian-rescue-channel
```

Thiết lập không có cấu hình mới thông qua Crestodian được bao phủ bởi:

```bash
pnpm test:docker:crestodian-first-run
```

Lane đó bắt đầu với một thư mục trạng thái trống, định tuyến `openclaw` thuần đến Crestodian, đặt mô hình mặc định, tạo một agent bổ sung, cấu hình Discord thông qua bật Plugin cộng với SecretRef token, xác thực cấu hình và kiểm tra nhật ký kiểm toán. QA Lab cũng có một kịch bản dựa trên repo cho cùng luồng Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/cli/doctor)
- [TUI](/vi/cli/tui)
- [Sandbox](/vi/cli/sandbox)
- [Bảo mật](/vi/cli/security)
