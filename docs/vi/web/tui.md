---
read_when:
    - Bạn muốn một hướng dẫn từng bước thân thiện với người mới bắt đầu về TUI
    - Bạn cần danh sách đầy đủ các tính năng, lệnh và phím tắt của TUI
summary: 'Giao diện người dùng trong thiết bị đầu cuối (TUI): kết nối với Gateway hoặc chạy cục bộ ở chế độ nhúng'
title: TUI
x-i18n:
    generated_at: "2026-05-05T10:53:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b517ff434cc440aeffd8698df75d4d85c22a19e59b38a1f2383e58e1b4084ff
    source_path: web/tui.md
    workflow: 16
---

## Bắt đầu nhanh

### Chế độ Gateway

1. Khởi động Gateway.

```bash
openclaw gateway
```

2. Mở TUI.

```bash
openclaw tui
```

3. Nhập một tin nhắn và nhấn Enter.

Gateway từ xa:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Dùng `--password` nếu Gateway của bạn dùng xác thực bằng mật khẩu.

### Chế độ cục bộ

Chạy TUI mà không cần Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Ghi chú:

- `openclaw chat` và `openclaw terminal` là bí danh của `openclaw tui --local`.
- Không thể kết hợp `--local` với `--url`, `--token`, hoặc `--password`.
- Chế độ cục bộ dùng trực tiếp runtime agent nhúng. Hầu hết công cụ cục bộ đều hoạt động, nhưng các tính năng chỉ có trên Gateway sẽ không khả dụng.
- `openclaw` và `openclaw crestodian` cũng dùng shell TUI này, với Crestodian làm backend trò chuyện cho thiết lập và sửa chữa cục bộ.

## Bạn sẽ thấy gì

- Tiêu đề: URL kết nối, agent hiện tại, phiên hiện tại.
- Nhật ký trò chuyện: tin nhắn người dùng, câu trả lời của trợ lý, thông báo hệ thống, thẻ công cụ.
- Dòng trạng thái: trạng thái kết nối/lượt chạy (đang kết nối, đang chạy, đang phát luồng, rảnh, lỗi).
- Chân trang: trạng thái kết nối + agent + phiên + mô hình + think/fast/verbose/trace/reasoning + số lượng token + deliver.
- Nhập liệu: trình soạn thảo văn bản có tự động hoàn thành.

## Mô hình tinh thần: agent + phiên

- Agent là các slug duy nhất (ví dụ `main`, `research`). Gateway cung cấp danh sách này.
- Phiên thuộc về agent hiện tại.
- Khóa phiên được lưu dưới dạng `agent:<agentId>:<sessionKey>`.
  - Nếu bạn nhập `/session main`, TUI mở rộng thành `agent:<currentAgent>:main`.
  - Nếu bạn nhập `/session agent:other:main`, bạn chuyển rõ ràng sang phiên agent đó.
- Phạm vi phiên:
  - `per-sender` (mặc định): mỗi agent có nhiều phiên.
  - `global`: TUI luôn dùng phiên `global` (bộ chọn có thể trống).
- Agent + phiên hiện tại luôn hiển thị ở chân trang.
- Khi khởi động không có `--session`, TUI ở chế độ Gateway tiếp tục phiên đã chọn gần nhất cho cùng Gateway, agent và phạm vi phiên nếu phiên đó vẫn tồn tại. Việc truyền `--session`, `/session`, `/new`, hoặc `/reset` vẫn là thao tác rõ ràng.

## Gửi + phân phối

- Tin nhắn được gửi đến Gateway; phân phối đến nhà cung cấp mặc định bị tắt.
- Bật phân phối lượt trả lời:
  - `/deliver on`
  - hoặc bảng Cài đặt
  - hoặc khởi động với `openclaw tui --deliver`

## Bộ chọn + lớp phủ

- Bộ chọn mô hình: liệt kê các mô hình khả dụng và đặt ghi đè phiên.
- Bộ chọn agent: chọn một agent khác.
- Bộ chọn phiên: hiển thị tối đa 50 phiên của agent hiện tại được cập nhật trong 7 ngày qua. Dùng `/session <key>` để nhảy đến một phiên cũ đã biết.
- Cài đặt: bật/tắt phân phối, mở rộng đầu ra công cụ và khả năng hiển thị phần suy nghĩ.

## Phím tắt

- Enter: gửi tin nhắn
- Esc: hủy lượt chạy đang hoạt động
- Ctrl+C: xóa nội dung nhập (nhấn hai lần để thoát)
- Ctrl+D: thoát
- Ctrl+L: bộ chọn mô hình
- Ctrl+G: bộ chọn agent
- Ctrl+P: bộ chọn phiên
- Ctrl+O: bật/tắt mở rộng đầu ra công cụ
- Ctrl+T: bật/tắt khả năng hiển thị phần suy nghĩ (tải lại lịch sử)

## Lệnh gạch chéo

Cốt lõi:

- `/help`
- `/status`
- `/agent <id>` (hoặc `/agents`)
- `/session <key>` (hoặc `/sessions`)
- `/model <provider/model>` (hoặc `/models`)

Điều khiển phiên:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (bí danh: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Vòng đời phiên:

- `/new` hoặc `/reset` (đặt lại phiên)
- `/abort` (hủy lượt chạy đang hoạt động)
- `/settings`
- `/exit`

Chỉ chế độ cục bộ:

- `/auth [provider]` mở luồng xác thực/đăng nhập nhà cung cấp bên trong TUI.

Các lệnh gạch chéo Gateway khác (ví dụ `/context`) được chuyển tiếp đến Gateway và hiển thị dưới dạng đầu ra hệ thống. Xem [Lệnh gạch chéo](/vi/tools/slash-commands).

## Lệnh shell cục bộ

- Thêm tiền tố `!` vào một dòng để chạy lệnh shell cục bộ trên máy chủ TUI.
- TUI nhắc một lần mỗi phiên để cho phép thực thi cục bộ; từ chối sẽ giữ `!` bị tắt trong phiên.
- Lệnh chạy trong một shell mới, không tương tác, tại thư mục làm việc của TUI (không có `cd`/env bền vững).
- Lệnh shell cục bộ nhận `OPENCLAW_SHELL=tui-local` trong môi trường của chúng.
- Một ký tự `!` đơn lẻ được gửi như tin nhắn bình thường; khoảng trắng đầu dòng không kích hoạt thực thi cục bộ.

## Sửa cấu hình từ TUI cục bộ

Dùng chế độ cục bộ khi cấu hình hiện tại đã xác thực thành công và bạn muốn
agent nhúng kiểm tra cấu hình trên cùng máy, so sánh với tài liệu,
và giúp sửa sai lệch mà không phụ thuộc vào Gateway đang chạy.

Nếu `openclaw config validate` đã lỗi, hãy bắt đầu với `openclaw configure`
hoặc `openclaw doctor --fix` trước. `openclaw chat` không bỏ qua chốt chặn
cấu hình không hợp lệ.

Vòng lặp điển hình:

1. Khởi động chế độ cục bộ:

```bash
openclaw chat
```

2. Hỏi agent nội dung bạn muốn kiểm tra, ví dụ:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Dùng lệnh shell cục bộ để lấy bằng chứng và xác thực chính xác:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Áp dụng các thay đổi hẹp bằng `openclaw config set` hoặc `openclaw configure`, rồi chạy lại `!openclaw config validate`.
5. Nếu Doctor khuyến nghị di chuyển hoặc sửa chữa tự động, hãy xem lại và chạy `!openclaw doctor --fix`.

Mẹo:

- Ưu tiên `openclaw config set` hoặc `openclaw configure` thay vì tự chỉnh sửa `openclaw.json`.
- `openclaw docs "<query>"` tìm kiếm chỉ mục tài liệu trực tiếp từ cùng máy.
- `openclaw config validate --json` hữu ích khi bạn muốn lỗi lược đồ có cấu trúc và lỗi SecretRef/khả năng phân giải.

## Đầu ra công cụ

- Lượt gọi công cụ hiển thị dưới dạng thẻ với đối số + kết quả.
- Ctrl+O chuyển đổi giữa chế độ xem thu gọn/mở rộng.
- Trong khi công cụ chạy, các cập nhật một phần được phát luồng vào cùng thẻ.

## Màu terminal

- TUI giữ văn bản thân câu trả lời của trợ lý bằng màu tiền cảnh mặc định của terminal để cả terminal nền tối và nền sáng đều dễ đọc.
- Nếu terminal của bạn dùng nền sáng và tự động phát hiện bị sai, hãy đặt `OPENCLAW_THEME=light` trước khi khởi chạy `openclaw tui`.
- Để buộc dùng bảng màu tối ban đầu, hãy đặt `OPENCLAW_THEME=dark`.

## Lịch sử + phát luồng

- Khi kết nối, TUI tải lịch sử mới nhất (mặc định 200 tin nhắn).
- Phản hồi phát luồng được cập nhật tại chỗ cho đến khi hoàn tất.
- TUI cũng lắng nghe sự kiện công cụ của agent để tạo thẻ công cụ phong phú hơn.

## Chi tiết kết nối

- TUI đăng ký với Gateway dưới dạng `mode: "tui"`.
- Các lần kết nối lại hiển thị thông báo hệ thống; khoảng trống sự kiện được hiển thị trong nhật ký.

## Tùy chọn

- `--local`: Chạy với runtime agent nhúng cục bộ
- `--url <url>`: URL WebSocket Gateway (mặc định lấy từ cấu hình hoặc `ws://127.0.0.1:<port>`)
- `--token <token>`: Token Gateway (nếu bắt buộc)
- `--password <password>`: Mật khẩu Gateway (nếu bắt buộc)
- `--session <key>`: Khóa phiên (mặc định: `main`, hoặc `global` khi phạm vi là global)
- `--deliver`: Phân phối câu trả lời của trợ lý đến nhà cung cấp (mặc định tắt)
- `--thinking <level>`: Ghi đè mức suy nghĩ cho các lần gửi
- `--message <text>`: Gửi tin nhắn ban đầu sau khi kết nối
- `--timeout-ms <ms>`: Thời gian chờ agent tính bằng ms (mặc định lấy từ `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Số mục lịch sử cần tải (mặc định `200`)

<Warning>
Khi bạn đặt `--url`, TUI không quay về thông tin xác thực trong cấu hình hoặc môi trường. Hãy truyền rõ ràng `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi. Ở chế độ cục bộ, không truyền `--url`, `--token`, hoặc `--password`.
</Warning>

## Khắc phục sự cố

Không có đầu ra sau khi gửi tin nhắn:

- Chạy `/status` trong TUI để xác nhận Gateway đã kết nối và đang rảnh/bận.
- Kiểm tra nhật ký Gateway: `openclaw logs --follow`.
- Xác nhận agent có thể chạy: `openclaw status` và `openclaw models status`.
- Nếu bạn mong đợi tin nhắn trong kênh trò chuyện, hãy bật phân phối (`/deliver on` hoặc `--deliver`).

## Khắc phục sự cố kết nối

- `disconnected`: đảm bảo Gateway đang chạy và `--url/--token/--password` của bạn là chính xác.
- Không có agent trong bộ chọn: kiểm tra `openclaw agents list` và cấu hình định tuyến của bạn.
- Bộ chọn phiên trống: có thể bạn đang ở phạm vi global hoặc chưa có phiên nào.

## Liên quan

- [Giao diện điều khiển](/vi/web/control-ui) — giao diện điều khiển dựa trên web
- [Cấu hình](/vi/cli/config) — kiểm tra, xác thực và chỉnh sửa `openclaw.json`
- [Doctor](/vi/cli/doctor) — kiểm tra sửa chữa có hướng dẫn và di chuyển
- [Tham chiếu CLI](/vi/cli) — tham chiếu đầy đủ về lệnh CLI
