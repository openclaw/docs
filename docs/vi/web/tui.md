---
read_when:
    - Bạn muốn một hướng dẫn từng bước thân thiện với người mới bắt đầu về TUI
    - Bạn cần danh sách đầy đủ các tính năng, lệnh và phím tắt của TUI
summary: 'Giao diện người dùng trên terminal (TUI): kết nối với Gateway hoặc chạy cục bộ ở chế độ nhúng'
title: TUI
x-i18n:
    generated_at: "2026-06-27T18:21:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
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

Chạy TUI không cần Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Ghi chú:

- `openclaw chat` và `openclaw terminal` là bí danh cho `openclaw tui --local`.
- Không thể kết hợp `--local` với `--url`, `--token`, hoặc `--password`.
- Chế độ cục bộ dùng trực tiếp runtime agent nhúng. Hầu hết công cụ cục bộ hoạt động, nhưng các tính năng chỉ dành cho Gateway sẽ không khả dụng.
- Sau khi một tệp cấu hình đã có các thiết lập được tạo, `openclaw` và `openclaw crestodian` cũng dùng shell TUI này, với Crestodian làm backend chat cài đặt và sửa chữa cục bộ.

## Bạn sẽ thấy gì

- Đầu trang: URL kết nối, agent hiện tại, phiên hiện tại.
- Nhật ký chat: tin nhắn người dùng, phản hồi assistant, thông báo hệ thống, thẻ công cụ.
- Dòng trạng thái: trạng thái kết nối/lượt chạy (đang kết nối, đang chạy, đang stream, rảnh, lỗi).
- Chân trang: agent + phiên + mô hình + trạng thái mục tiêu + think/fast/verbose/trace/reasoning + số lượng token + gửi đi. Khi `tui.footer.showRemoteHost` được bật, các kết nối Gateway từ xa cũng hiển thị máy chủ kết nối.
- Nhập liệu: trình soạn thảo văn bản có tự động hoàn thành.

## Mô hình tư duy: agent + phiên

- Agent là các slug duy nhất (ví dụ `main`, `research`). Gateway cung cấp danh sách này.
- Phiên thuộc về agent hiện tại.
- Khóa phiên được lưu dưới dạng `agent:<agentId>:<sessionKey>`.
  - Nếu bạn nhập `/session main`, TUI mở rộng thành `agent:<currentAgent>:main`.
  - Nếu bạn nhập `/session agent:other:main`, bạn chuyển rõ ràng sang phiên agent đó.
- Phạm vi phiên:
  - `per-sender` (mặc định): mỗi agent có nhiều phiên.
  - `global`: TUI luôn dùng phiên `global` (bộ chọn có thể trống).
- Agent + phiên hiện tại luôn hiển thị ở chân trang.
- Để hiển thị máy chủ Gateway cho các kết nối không cục bộ dựa trên URL, hãy bật tùy chọn bằng:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Các kết nối loopback và cục bộ nhúng không bao giờ hiển thị nhãn máy chủ.

- Nếu phiên có một [mục tiêu](/vi/tools/goal), chân trang hiển thị trạng thái rút gọn của nó
  như `Pursuing goal`, `Goal paused (/goal resume)`, hoặc
  `Goal achieved`.
- Khi khởi động không có `--session`, TUI ở chế độ gateway tiếp tục phiên được chọn gần nhất cho cùng gateway, agent và phạm vi phiên nếu phiên đó vẫn tồn tại. Truyền `--session`, `/session`, `/new`, hoặc `/reset` vẫn là thao tác rõ ràng.

## Gửi + phân phối

- Tin nhắn được gửi tới Gateway; việc phân phối tới provider mặc định tắt.
- TUI là một bề mặt nguồn nội bộ như WebChat, không phải một kênh gửi đi chung. Các harness yêu cầu `tools.message` cho phản hồi hiển thị có thể đáp ứng lượt TUI đang hoạt động bằng `message.send` không có đích; việc phân phối rõ ràng tới provider vẫn dùng các kênh đã cấu hình bình thường và không bao giờ quay về `lastChannel`.
- Bật phân phối lượt:
  - `/deliver on`
  - hoặc bảng Settings
  - hoặc khởi động với `openclaw tui --deliver`

## Bộ chọn + lớp phủ

- Bộ chọn mô hình: liệt kê các mô hình khả dụng và đặt ghi đè cho phiên.
- Bộ chọn agent: chọn một agent khác.
- Bộ chọn phiên: hiển thị tối đa 50 phiên cho agent hiện tại được cập nhật trong 7 ngày gần nhất. Dùng `/session <key>` để nhảy tới một phiên cũ đã biết.
- Settings: bật/tắt phân phối, mở rộng đầu ra công cụ, và hiển thị suy nghĩ.

## Phím tắt

- Enter: gửi tin nhắn
- Esc: hủy lượt chạy đang hoạt động
- Ctrl+C: xóa nhập liệu (nhấn hai lần để thoát)
- Ctrl+D: thoát
- Ctrl+L: bộ chọn mô hình
- Ctrl+G: bộ chọn agent
- Ctrl+P: bộ chọn phiên
- Ctrl+O: bật/tắt mở rộng đầu ra công cụ
- Ctrl+T: bật/tắt hiển thị suy nghĩ (tải lại lịch sử)

## Lệnh slash

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
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` xóa ghi đè của phiên)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (bí danh: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Vòng đời phiên:

- `/new` hoặc `/reset` (đặt lại phiên)
- `/abort` (hủy lượt chạy đang hoạt động)
- `/settings`
- `/exit`

Chỉ dành cho chế độ cục bộ:

- `/auth [provider]` mở luồng xác thực/đăng nhập provider bên trong TUI.

Các lệnh slash Gateway khác (ví dụ, `/context`) được chuyển tiếp tới Gateway và hiển thị dưới dạng đầu ra hệ thống. Xem [Lệnh slash](/vi/tools/slash-commands).

## Lệnh shell cục bộ

- Thêm tiền tố `!` vào một dòng để chạy lệnh shell cục bộ trên máy chủ TUI.
- TUI hỏi một lần mỗi phiên để cho phép thực thi cục bộ; nếu từ chối, `!` vẫn bị tắt cho phiên đó.
- Lệnh chạy trong một shell mới, không tương tác, trong thư mục làm việc của TUI (không có `cd`/env duy trì).
- Lệnh shell cục bộ nhận `OPENCLAW_SHELL=tui-local` trong môi trường của chúng.
- Một ký tự `!` đơn lẻ được gửi như tin nhắn bình thường; khoảng trắng đầu dòng không kích hoạt thực thi cục bộ.

## Sửa cấu hình từ TUI cục bộ

Dùng chế độ cục bộ khi cấu hình hiện tại đã xác thực hợp lệ và bạn muốn
agent nhúng kiểm tra nó trên cùng máy, so sánh với tài liệu,
và giúp sửa lệch cấu hình mà không phụ thuộc vào Gateway đang chạy.

Nếu `openclaw config validate` đã thất bại, hãy bắt đầu bằng `openclaw configure`
hoặc `openclaw doctor --fix` trước. `openclaw chat` không bỏ qua chốt chặn cấu hình
không hợp lệ.

Vòng lặp điển hình:

1. Khởi động chế độ cục bộ:

```bash
openclaw chat
```

2. Hỏi agent điều bạn muốn kiểm tra, ví dụ:

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

4. Áp dụng thay đổi hẹp bằng `openclaw config set` hoặc `openclaw configure`, rồi chạy lại `!openclaw config validate`.
5. Nếu Doctor đề xuất một migration hoặc sửa chữa tự động, hãy xem lại và chạy `!openclaw doctor --fix`.

Mẹo:

- Ưu tiên `openclaw config set` hoặc `openclaw configure` thay vì chỉnh tay `openclaw.json`.
- `openclaw docs "<query>"` tìm kiếm chỉ mục tài liệu trực tiếp từ cùng máy.
- `openclaw config validate --json` hữu ích khi bạn muốn lỗi schema có cấu trúc và lỗi SecretRef/khả năng phân giải.

## Đầu ra công cụ

- Lệnh gọi công cụ hiển thị dưới dạng thẻ với đối số + kết quả.
- Ctrl+O chuyển đổi giữa chế độ xem thu gọn/mở rộng.
- Khi công cụ chạy, các cập nhật một phần được stream vào cùng thẻ.

## Màu terminal

- TUI giữ văn bản thân phản hồi của assistant ở màu chữ mặc định của terminal để cả terminal nền tối và nền sáng đều dễ đọc.
- Nếu terminal của bạn dùng nền sáng và tự phát hiện sai, đặt `OPENCLAW_THEME=light` trước khi khởi chạy `openclaw tui`.
- Để buộc dùng bảng màu tối ban đầu, đặt `OPENCLAW_THEME=dark`.

## Lịch sử + streaming

- Khi kết nối, TUI tải lịch sử mới nhất (mặc định 200 tin nhắn).
- Phản hồi streaming cập nhật tại chỗ cho đến khi hoàn tất.
- TUI cũng lắng nghe sự kiện công cụ của agent để tạo thẻ công cụ phong phú hơn.

## Chi tiết kết nối

- TUI đăng ký với Gateway dưới dạng `mode: "tui"`.
- Kết nối lại hiển thị một thông báo hệ thống; khoảng trống sự kiện được hiển thị trong nhật ký.

## Tùy chọn

- `--local`: Chạy với runtime agent nhúng cục bộ
- `--url <url>`: URL WebSocket của Gateway (mặc định theo cấu hình hoặc `ws://127.0.0.1:<port>`)
- `--token <token>`: Token Gateway (nếu bắt buộc)
- `--password <password>`: Mật khẩu Gateway (nếu bắt buộc)
- `--session <key>`: Khóa phiên (mặc định: `main`, hoặc `global` khi phạm vi là global)
- `--deliver`: Phân phối phản hồi assistant tới provider (mặc định tắt)
- `--thinking <level>`: Ghi đè mức suy nghĩ cho các lần gửi
- `--message <text>`: Gửi một tin nhắn ban đầu sau khi kết nối
- `--timeout-ms <ms>`: Thời gian chờ agent theo mili giây (mặc định theo `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Số mục lịch sử cần tải (mặc định `200`)

<Warning>
Khi bạn đặt `--url`, TUI không quay về thông tin xác thực trong cấu hình hoặc môi trường. Hãy truyền rõ ràng `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi. Trong chế độ cục bộ, đừng truyền `--url`, `--token`, hoặc `--password`.
</Warning>

## Khắc phục sự cố

Không có đầu ra sau khi gửi tin nhắn:

- Chạy `/status` trong TUI để xác nhận Gateway đã kết nối và đang rảnh/bận.
- Kiểm tra nhật ký Gateway: `openclaw logs --follow`.
- Xác nhận agent có thể chạy: `openclaw status` và `openclaw models status`.
- Nếu bạn mong đợi tin nhắn trong một kênh chat, hãy bật phân phối (`/deliver on` hoặc `--deliver`).

## Khắc phục sự cố kết nối

- `disconnected`: đảm bảo Gateway đang chạy và `--url/--token/--password` của bạn chính xác.
- Không có agent trong bộ chọn: kiểm tra `openclaw agents list` và cấu hình định tuyến của bạn.
- Bộ chọn phiên trống: bạn có thể đang ở phạm vi global hoặc chưa có phiên nào.

## Liên quan

- [Control UI](/vi/web/control-ui) — giao diện điều khiển dựa trên web
- [Config](/vi/cli/config) — kiểm tra, xác thực, và chỉnh sửa `openclaw.json`
- [Doctor](/vi/cli/doctor) — kiểm tra sửa chữa và migration có hướng dẫn
- [Tài liệu tham khảo CLI](/vi/cli) — tài liệu tham khảo đầy đủ về lệnh CLI
