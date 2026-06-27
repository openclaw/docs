---
read_when:
    - Bạn chạy openclaw mà không có lệnh nào sau khi thiết lập và muốn hiểu Crestodian
    - Bạn cần một cách an toàn không cần cấu hình để kiểm tra hoặc sửa chữa OpenClaw
    - Bạn đang thiết kế hoặc bật chế độ cứu hộ kênh nhắn tin
summary: Tham chiếu CLI và mô hình bảo mật cho Crestodian, trình trợ giúp thiết lập và sửa chữa an toàn không cần cấu hình
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:17:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian là trình trợ giúp thiết lập cục bộ, sửa chữa và cấu hình của OpenClaw. Nó được
thiết kế để vẫn có thể truy cập được khi đường dẫn tác tử thông thường bị hỏng.

Chạy `openclaw` mà không có lệnh sẽ khởi động quy trình hướng dẫn ban đầu kiểu cổ điển trước khi
tệp cấu hình đang hoạt động bị thiếu hoặc không có thiết lập do người dùng tạo (trống hoặc
chỉ có siêu dữ liệu). Sau khi tệp cấu hình đã có thiết lập do người dùng tạo, chạy `openclaw`
mà không có lệnh sẽ khởi động Crestodian trong một terminal tương tác. Chạy
`openclaw crestodian` sẽ khởi động rõ ràng cùng trình trợ giúp đó.

## Crestodian hiển thị gì

Khi khởi động, Crestodian tương tác mở cùng shell TUI được dùng bởi
`openclaw tui`, với phần phụ trợ trò chuyện Crestodian. Nhật ký trò chuyện bắt đầu bằng một lời
chào ngắn:

- khi nào nên khởi động Crestodian
- mô hình hoặc đường dẫn bộ lập kế hoạch xác định mà Crestodian thực sự đang dùng
- tính hợp lệ của cấu hình và tác tử mặc định
- khả năng truy cập Gateway từ lần thăm dò khởi động đầu tiên
- hành động gỡ lỗi tiếp theo mà Crestodian có thể thực hiện

Nó không xuất bí mật hoặc tải các lệnh CLI của Plugin chỉ để khởi động. TUI
vẫn cung cấp phần đầu trang, nhật ký trò chuyện, dòng trạng thái, chân trang, tự động hoàn thành
và các điều khiển trình soạn thảo thông thường.

Dùng `status` để xem kiểm kê chi tiết với đường dẫn cấu hình, đường dẫn tài liệu/nguồn,
các phép thăm dò CLI cục bộ, sự hiện diện của khóa API, tác tử, mô hình và chi tiết Gateway.

Crestodian dùng cùng cơ chế khám phá tham chiếu OpenClaw như các tác tử thông thường. Trong một checkout Git,
nó tự trỏ tới `docs/` cục bộ và cây nguồn cục bộ. Trong bản cài đặt gói npm, nó
dùng tài liệu được đóng gói kèm và liên kết tới
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), với hướng dẫn rõ ràng
rằng hãy xem lại nguồn bất cứ khi nào tài liệu chưa đủ.

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
- Gateway ngừng hoạt động
- không thể đăng ký lệnh Plugin
- chưa có tác tử nào được cấu hình

`openclaw --help` và `openclaw --version` vẫn dùng các đường dẫn nhanh thông thường.
`openclaw` trần ở chế độ không tương tác thoát với một thông báo ngắn thay vì in
trợ giúp gốc. Trên bản cài đặt mới, thông báo trỏ tới hướng dẫn ban đầu không tương tác;
sau khi thiết lập, nó trỏ tới các lệnh Crestodian một lần.

## Thao tác và phê duyệt

Crestodian dùng các thao tác có kiểu thay vì chỉnh sửa cấu hình tùy tiện.

Các thao tác chỉ đọc có thể chạy ngay:

- hiển thị tổng quan
- liệt kê tác tử
- liệt kê các Plugin đã cài đặt
- tìm kiếm Plugin ClawHub
- hiển thị trạng thái mô hình/phần phụ trợ
- chạy kiểm tra trạng thái hoặc sức khỏe
- kiểm tra khả năng truy cập Gateway
- chạy doctor mà không có sửa chữa tương tác
- xác thực cấu hình
- hiển thị đường dẫn nhật ký kiểm toán

Các thao tác bền vững yêu cầu phê duyệt qua hội thoại trong chế độ tương tác, trừ khi
bạn truyền `--yes` cho một lệnh trực tiếp:

- ghi cấu hình
- chạy `config set`
- đặt các giá trị SecretRef được hỗ trợ thông qua `config set-ref`
- chạy bootstrap thiết lập/hướng dẫn ban đầu
- thay đổi mô hình mặc định
- khởi động, dừng hoặc khởi động lại Gateway
- tạo tác tử
- cài đặt Plugin từ ClawHub hoặc npm
- gỡ cài đặt Plugin
- chạy các sửa chữa doctor có ghi lại cấu hình hoặc trạng thái

Các lần ghi đã áp dụng được ghi lại trong:

```text
~/.openclaw/audit/crestodian.jsonl
```

Khám phá không được kiểm toán. Chỉ các thao tác đã áp dụng và các lần ghi mới được ghi nhật ký.

`openclaw onboard --modern` khởi động Crestodian như bản xem trước hướng dẫn ban đầu hiện đại.
`openclaw onboard` thuần vẫn chạy hướng dẫn ban đầu kiểu cổ điển.

## Bootstrap thiết lập

`setup` là bootstrap hướng dẫn ban đầu ưu tiên trò chuyện. Nó chỉ ghi thông qua các thao tác
cấu hình có kiểu và hỏi phê duyệt trước.

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

Khi chưa có mô hình nào được cấu hình, thiết lập chọn phần phụ trợ dùng được đầu tiên theo
thứ tự này và cho bạn biết nó đã chọn gì:

- mô hình rõ ràng hiện có, nếu đã được cấu hình
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> `openai/gpt-5.5` thông qua harness máy chủ ứng dụng Codex

Nếu không có cái nào khả dụng, thiết lập vẫn ghi không gian làm việc mặc định và để
mô hình chưa được đặt. Cài đặt hoặc đăng nhập vào Codex/Claude Code, hoặc cung cấp
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, rồi chạy lại thiết lập.

## Bộ lập kế hoạch được mô hình hỗ trợ

Crestodian luôn khởi động ở chế độ xác định. Với các lệnh mơ hồ mà
bộ phân tích cú pháp xác định không hiểu, Crestodian cục bộ có thể thực hiện một lượt
lập kế hoạch có giới hạn thông qua các đường dẫn runtime thông thường của OpenClaw. Trước tiên nó dùng
mô hình OpenClaw đã cấu hình. Nếu chưa có mô hình đã cấu hình nào dùng được, nó có thể
dự phòng sang các runtime cục bộ đã có trên máy:

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- Harness máy chủ ứng dụng Codex: `openai/gpt-5.5`

Bộ lập kế hoạch được mô hình hỗ trợ không thể trực tiếp sửa đổi cấu hình. Nó phải chuyển yêu cầu
thành một trong các lệnh có kiểu của Crestodian, sau đó các quy tắc phê duyệt và
kiểm toán thông thường sẽ áp dụng. Crestodian in mô hình nó đã dùng và lệnh đã diễn giải
trước khi chạy bất cứ thứ gì. Các lượt bộ lập kế hoạch dự phòng không cần cấu hình là
tạm thời, bị tắt công cụ ở nơi runtime hỗ trợ, và dùng một
không gian làm việc/phiên tạm thời.

Chế độ cứu hộ kênh tin nhắn không dùng bộ lập kế hoạch được mô hình hỗ trợ. Cứu hộ từ xa
vẫn mang tính xác định để đường dẫn tác tử thông thường bị hỏng hoặc bị xâm phạm không thể
được dùng làm trình chỉnh sửa cấu hình.

## Chuyển sang một tác tử

Dùng bộ chọn ngôn ngữ tự nhiên để rời Crestodian và mở TUI thông thường:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` và `openclaw terminal` vẫn mở trực tiếp TUI
tác tử thông thường. Chúng không khởi động Crestodian.

Sau khi chuyển vào TUI thông thường, dùng `/crestodian` để quay lại Crestodian.
Bạn có thể kèm theo một yêu cầu tiếp nối:

```text
/crestodian
/crestodian restart gateway
```

Các lần chuyển tác tử bên trong TUI để lại một dấu nhắc rằng `/crestodian` khả dụng.

## Chế độ cứu hộ tin nhắn

Chế độ cứu hộ tin nhắn là điểm vào kênh tin nhắn cho Crestodian. Nó dành cho
trường hợp tác tử thông thường của bạn đã chết, nhưng một kênh đáng tin cậy như WhatsApp
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

Việc tạo tác tử cũng có thể được xếp hàng từ lời nhắc cục bộ hoặc chế độ cứu hộ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

Chế độ cứu hộ từ xa là một bề mặt quản trị. Nó phải được xử lý như sửa chữa cấu hình từ xa,
không phải như trò chuyện thông thường.

Hợp đồng bảo mật cho cứu hộ từ xa:

- Bị tắt khi sandboxing đang hoạt động. Nếu một tác tử/phiên đang bị sandbox,
  Crestodian phải từ chối cứu hộ từ xa và giải thích rằng cần sửa chữa bằng CLI cục bộ.
- Trạng thái hiệu lực mặc định là `auto`: chỉ cho phép cứu hộ từ xa trong vận hành YOLO
  đáng tin cậy, nơi runtime đã có quyền cục bộ không bị sandbox.
- Yêu cầu một danh tính chủ sở hữu rõ ràng. Cứu hộ không được chấp nhận quy tắc người gửi
  ký tự đại diện, chính sách nhóm mở, Webhook chưa xác thực hoặc kênh ẩn danh.
- Mặc định chỉ DM của chủ sở hữu. Cứu hộ nhóm/kênh yêu cầu bật rõ ràng.
- Tìm kiếm và liệt kê Plugin là chỉ đọc. Cài đặt Plugin mặc định chỉ cục bộ
  vì nó tải xuống mã thực thi. Gỡ cài đặt Plugin có thể được cho phép như một
  thao tác sửa chữa đã phê duyệt khi chính sách cứu hộ cho phép ghi bền vững.
- Cứu hộ từ xa không thể mở TUI cục bộ hoặc chuyển vào một phiên tác tử tương tác.
  Dùng `openclaw` cục bộ để bàn giao tác tử.
- Các lần ghi bền vững vẫn yêu cầu phê duyệt, ngay cả trong chế độ cứu hộ.
- Kiểm toán mọi thao tác cứu hộ đã áp dụng. Cứu hộ kênh tin nhắn ghi lại siêu dữ liệu
  kênh, tài khoản, người gửi và địa chỉ nguồn. Các thao tác sửa đổi cấu hình cũng
  ghi lại hàm băm cấu hình trước và sau.
- Không bao giờ lặp lại bí mật. Kiểm tra SecretRef nên báo cáo tính khả dụng, không phải
  giá trị.
- Nếu Gateway còn sống, ưu tiên các thao tác có kiểu của Gateway. Nếu Gateway đã chết,
  chỉ dùng bề mặt sửa chữa cục bộ tối thiểu không phụ thuộc vào vòng lặp tác tử
  thông thường.

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

- `"auto"`: mặc định. Chỉ cho phép khi runtime hiệu lực là YOLO và
  sandboxing tắt.
- `false`: không bao giờ cho phép cứu hộ kênh tin nhắn.
- `true`: cho phép rõ ràng cứu hộ khi các kiểm tra chủ sở hữu/kênh đạt. Điều này
  vẫn không được bỏ qua việc từ chối do sandboxing.

Tư thế YOLO `"auto"` mặc định là:

- chế độ sandbox phân giải thành `off`
- `tools.exec.security` phân giải thành `full`
- `tools.exec.ask` phân giải thành `off`

Cứu hộ từ xa được bao phủ bởi làn Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Dự phòng bộ lập kế hoạch cục bộ không cần cấu hình được bao phủ bởi:

```bash
pnpm test:docker:crestodian-planner
```

Một smoke bề mặt lệnh kênh trực tiếp có chọn tham gia kiểm tra `/crestodian status` cộng với một
vòng phê duyệt bền vững đi qua trình xử lý cứu hộ:

```bash
pnpm test:live:crestodian-rescue-channel
```

Thiết lập không cần cấu hình thông qua các lệnh Crestodian rõ ràng được bao phủ bởi:

```bash
pnpm test:docker:crestodian-first-run
```

Làn đó bắt đầu với một thư mục trạng thái trống, xác minh điểm vào Crestodian onboard hiện đại,
đặt mô hình mặc định, tạo thêm một tác tử, cấu hình
Discord thông qua việc bật Plugin cùng SecretRef token, xác thực cấu hình và
kiểm tra nhật ký kiểm toán. QA Lab cũng có một kịch bản dựa trên repo cho cùng luồng Ring 0:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/cli/doctor)
- [TUI](/vi/cli/tui)
- [Sandbox](/vi/cli/sandbox)
- [Bảo mật](/vi/cli/security)
