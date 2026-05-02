---
read_when:
    - Bạn muốn một hướng dẫn từng bước dễ hiểu cho người mới bắt đầu về TUI
    - Bạn cần danh sách đầy đủ các tính năng, lệnh và phím tắt của TUI
summary: 'Giao diện đầu cuối (TUI): kết nối với Gateway hoặc chạy cục bộ ở chế độ nhúng'
title: TUI
x-i18n:
    generated_at: "2026-05-02T10:56:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
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

- `openclaw chat` và `openclaw terminal` là bí danh cho `openclaw tui --local`.
- Không thể kết hợp `--local` với `--url`, `--token`, hoặc `--password`.
- Chế độ cục bộ dùng trực tiếp môi trường chạy tác nhân nhúng. Hầu hết công cụ cục bộ hoạt động, nhưng các tính năng chỉ dành cho Gateway sẽ không khả dụng.
- `openclaw` và `openclaw crestodian` cũng dùng lớp vỏ TUI này, với Crestodian làm backend trò chuyện thiết lập và sửa chữa cục bộ.

## Những gì bạn thấy

- Tiêu đề: URL kết nối, tác nhân hiện tại, phiên hiện tại.
- Nhật ký trò chuyện: tin nhắn người dùng, phản hồi của trợ lý, thông báo hệ thống, thẻ công cụ.
- Dòng trạng thái: trạng thái kết nối/lượt chạy (đang kết nối, đang chạy, đang truyền luồng, rảnh, lỗi).
- Chân trang: trạng thái kết nối + tác nhân + phiên + mô hình + think/fast/verbose/trace/reasoning + số lượng token + deliver.
- Đầu vào: trình soạn thảo văn bản có tự động hoàn tất.

## Mô hình tư duy: tác nhân + phiên

- Tác nhân là các slug duy nhất (ví dụ `main`, `research`). Gateway cung cấp danh sách này.
- Phiên thuộc về tác nhân hiện tại.
- Khóa phiên được lưu dưới dạng `agent:<agentId>:<sessionKey>`.
  - Nếu bạn nhập `/session main`, TUI mở rộng thành `agent:<currentAgent>:main`.
  - Nếu bạn nhập `/session agent:other:main`, bạn chuyển rõ ràng sang phiên tác nhân đó.
- Phạm vi phiên:
  - `per-sender` (mặc định): mỗi tác nhân có nhiều phiên.
  - `global`: TUI luôn dùng phiên `global` (bộ chọn có thể trống).
- Tác nhân + phiên hiện tại luôn hiển thị ở chân trang.
- Khi khởi động không có `--session`, TUI ở chế độ Gateway tiếp tục phiên được chọn gần nhất cho cùng Gateway, tác nhân và phạm vi phiên nếu phiên đó vẫn tồn tại. Việc truyền `--session`, `/session`, `/new`, hoặc `/reset` vẫn là thao tác rõ ràng.

## Gửi + phân phối

- Tin nhắn được gửi đến Gateway; phân phối đến nhà cung cấp bị tắt theo mặc định.
- Bật phân phối lượt trả lời:
  - `/deliver on`
  - hoặc bảng Cài đặt
  - hoặc khởi động bằng `openclaw tui --deliver`

## Bộ chọn + lớp phủ

- Bộ chọn mô hình: liệt kê các mô hình khả dụng và đặt ghi đè phiên.
- Bộ chọn tác nhân: chọn tác nhân khác.
- Bộ chọn phiên: chỉ hiển thị các phiên cho tác nhân hiện tại.
- Cài đặt: bật/tắt phân phối, mở rộng đầu ra công cụ và khả năng hiển thị suy nghĩ.

## Phím tắt

- Enter: gửi tin nhắn
- Esc: hủy lượt chạy đang hoạt động
- Ctrl+C: xóa đầu vào (nhấn hai lần để thoát)
- Ctrl+D: thoát
- Ctrl+L: bộ chọn mô hình
- Ctrl+G: bộ chọn tác nhân
- Ctrl+P: bộ chọn phiên
- Ctrl+O: bật/tắt mở rộng đầu ra công cụ
- Ctrl+T: bật/tắt khả năng hiển thị suy nghĩ (tải lại lịch sử)

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

Chỉ dành cho chế độ cục bộ:

- `/auth [provider]` mở luồng xác thực/đăng nhập của nhà cung cấp bên trong TUI.

Các lệnh gạch chéo Gateway khác (ví dụ `/context`) được chuyển tiếp đến Gateway và hiển thị dưới dạng đầu ra hệ thống. Xem [Lệnh gạch chéo](/vi/tools/slash-commands).

## Lệnh shell cục bộ

- Thêm tiền tố `!` vào một dòng để chạy lệnh shell cục bộ trên máy chủ TUI.
- TUI nhắc một lần mỗi phiên để cho phép thực thi cục bộ; từ chối sẽ giữ `!` bị tắt cho phiên đó.
- Lệnh chạy trong một shell mới, không tương tác tại thư mục làm việc của TUI (không có `cd`/env liên tục).
- Lệnh shell cục bộ nhận `OPENCLAW_SHELL=tui-local` trong môi trường của chúng.
- Một ký tự `!` đơn lẻ được gửi như một tin nhắn bình thường; khoảng trắng đầu dòng không kích hoạt thực thi cục bộ.

## Sửa cấu hình từ TUI cục bộ

Dùng chế độ cục bộ khi cấu hình hiện tại đã xác thực thành công và bạn muốn tác nhân nhúng kiểm tra nó trên cùng máy, so sánh với tài liệu và giúp sửa sai lệch mà không phụ thuộc vào Gateway đang chạy.

Nếu `openclaw config validate` đã thất bại, hãy bắt đầu bằng `openclaw configure` hoặc `openclaw doctor --fix` trước. `openclaw chat` không bỏ qua cơ chế chặn cấu hình không hợp lệ.

Vòng lặp điển hình:

1. Khởi động chế độ cục bộ:

```bash
openclaw chat
```

2. Yêu cầu tác nhân kiểm tra điều bạn muốn, ví dụ:

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
5. Nếu Doctor đề xuất một lần di trú hoặc sửa chữa tự động, hãy xem xét đề xuất đó và chạy `!openclaw doctor --fix`.

Mẹo:

- Ưu tiên `openclaw config set` hoặc `openclaw configure` thay vì tự sửa `openclaw.json`.
- `openclaw docs "<query>"` tìm kiếm chỉ mục tài liệu trực tiếp từ cùng máy.
- `openclaw config validate --json` hữu ích khi bạn muốn lỗi lược đồ có cấu trúc và lỗi SecretRef/khả năng phân giải.

## Đầu ra công cụ

- Lệnh gọi công cụ hiển thị dưới dạng thẻ với đối số + kết quả.
- Ctrl+O chuyển đổi giữa chế độ xem thu gọn/mở rộng.
- Khi công cụ chạy, các cập nhật từng phần được truyền luồng vào cùng thẻ.

## Màu terminal

- TUI giữ văn bản thân phản hồi của trợ lý ở màu chữ mặc định của terminal để cả terminal nền tối và nền sáng đều dễ đọc.
- Nếu terminal của bạn dùng nền sáng và tự động phát hiện bị sai, hãy đặt `OPENCLAW_THEME=light` trước khi khởi chạy `openclaw tui`.
- Để buộc dùng bảng màu tối gốc thay vào đó, hãy đặt `OPENCLAW_THEME=dark`.

## Lịch sử + truyền luồng

- Khi kết nối, TUI tải lịch sử mới nhất (mặc định 200 tin nhắn).
- Phản hồi truyền luồng được cập nhật tại chỗ cho đến khi hoàn tất.
- TUI cũng lắng nghe sự kiện công cụ của tác nhân để tạo thẻ công cụ giàu thông tin hơn.

## Chi tiết kết nối

- TUI đăng ký với Gateway dưới dạng `mode: "tui"`.
- Các lần kết nối lại hiển thị thông báo hệ thống; khoảng trống sự kiện được hiển thị trong nhật ký.

## Tùy chọn

- `--local`: Chạy với môi trường chạy tác nhân nhúng cục bộ
- `--url <url>`: URL WebSocket của Gateway (mặc định theo cấu hình hoặc `ws://127.0.0.1:<port>`)
- `--token <token>`: Token Gateway (nếu bắt buộc)
- `--password <password>`: Mật khẩu Gateway (nếu bắt buộc)
- `--session <key>`: Khóa phiên (mặc định: `main`, hoặc `global` khi phạm vi là global)
- `--deliver`: Phân phối phản hồi của trợ lý đến nhà cung cấp (mặc định tắt)
- `--thinking <level>`: Ghi đè mức suy nghĩ khi gửi
- `--message <text>`: Gửi tin nhắn ban đầu sau khi kết nối
- `--timeout-ms <ms>`: Thời gian chờ của tác nhân tính bằng mili giây (mặc định theo `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Số mục lịch sử cần tải (mặc định `200`)

<Warning>
Khi bạn đặt `--url`, TUI không quay về thông tin xác thực từ cấu hình hoặc môi trường. Hãy truyền rõ ràng `--token` hoặc `--password`. Thiếu thông tin xác thực rõ ràng là lỗi. Ở chế độ cục bộ, không truyền `--url`, `--token`, hoặc `--password`.
</Warning>

## Khắc phục sự cố

Không có đầu ra sau khi gửi tin nhắn:

- Chạy `/status` trong TUI để xác nhận Gateway đã kết nối và đang rảnh/bận.
- Kiểm tra nhật ký Gateway: `openclaw logs --follow`.
- Xác nhận tác nhân có thể chạy: `openclaw status` và `openclaw models status`.
- Nếu bạn mong đợi tin nhắn trong một kênh trò chuyện, hãy bật phân phối (`/deliver on` hoặc `--deliver`).

## Khắc phục sự cố kết nối

- `disconnected`: đảm bảo Gateway đang chạy và `--url/--token/--password` của bạn là chính xác.
- Không có tác nhân trong bộ chọn: kiểm tra `openclaw agents list` và cấu hình định tuyến của bạn.
- Bộ chọn phiên trống: bạn có thể đang ở phạm vi global hoặc chưa có phiên nào.

## Liên quan

- [Giao diện điều khiển](/vi/web/control-ui) — giao diện điều khiển trên web
- [Cấu hình](/vi/cli/config) — kiểm tra, xác thực và chỉnh sửa `openclaw.json`
- [Doctor](/vi/cli/doctor) — kiểm tra sửa chữa có hướng dẫn và di trú
- [Tham chiếu CLI](/vi/cli) — tham chiếu đầy đủ về lệnh CLI
