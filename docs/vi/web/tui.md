---
read_when:
    - Bạn muốn hướng dẫn từng bước về TUI dành cho người mới bắt đầu
    - Bạn cần danh sách đầy đủ các tính năng, lệnh và phím tắt của TUI
summary: 'Giao diện người dùng đầu cuối (TUI): kết nối với Gateway hoặc chạy cục bộ ở chế độ nhúng'
title: TUI
x-i18n:
    generated_at: "2026-07-19T17:11:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dc4dc5e2a408b5097b3615283b5a4590e8b55bccb15c26d8e38ab2c84b902f4a
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

3. Nhập tin nhắn và nhấn Enter.

Gateway từ xa:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Sử dụng `--password` nếu Gateway của bạn sử dụng xác thực bằng mật khẩu.

### Chế độ cục bộ

Chạy TUI mà không cần Gateway:

```bash
openclaw chat
# hoặc
openclaw tui --local
```

- `openclaw chat` và `openclaw terminal` là bí danh của `openclaw tui --local`.
- `--local` không thể kết hợp với `--url`, `--token` hoặc `--password`.
- Chế độ cục bộ sử dụng trực tiếp runtime agent nhúng. Hầu hết công cụ cục bộ đều hoạt động, nhưng các tính năng chỉ dành cho Gateway không khả dụng.
- Lệnh `openclaw` đơn thuần (không có lệnh con) tự động chọn một đích: bản cài đặt chưa cấu hình sẽ chạy quy trình hướng dẫn suy luận; cấu hình không hợp lệ sẽ mở hướng dẫn Doctor cổ điển; Gateway đã cấu hình và có thể truy cập sẽ mở shell TUI này ở chế độ Gateway; nếu không, mô hình cục bộ đã cấu hình sẽ mở shell ở chế độ cục bộ.

## Nội dung hiển thị

- Đầu trang: URL kết nối, agent hiện tại, phiên hiện tại.
- Nhật ký trò chuyện: tin nhắn người dùng, phản hồi của trợ lý, thông báo hệ thống, thẻ công cụ.
- Dòng trạng thái: trạng thái kết nối/lượt chạy (đang kết nối, đang chạy, đang truyền trực tuyến, rảnh, lỗi).
- Chân trang: agent + phiên + mô hình + trạng thái mục tiêu + suy nghĩ/nhanh/chi tiết/theo dõi/lập luận + số lượng token + gửi đi.
- Đầu vào: trình soạn thảo văn bản có tính năng tự động hoàn thành.

## Mô hình tư duy: agent + phiên

- Agent là các slug duy nhất (ví dụ: `main`, `research`). Gateway cung cấp danh sách này.
- Các phiên thuộc về agent hiện tại.
- Khóa phiên được lưu dưới dạng `agent:<agentId>:<sessionKey>`.
  - Nếu bạn nhập `/session main`, TUI sẽ mở rộng thành `agent:<currentAgent>:main`.
  - Nếu bạn nhập `/session agent:other:main`, bạn sẽ chuyển rõ ràng sang phiên của agent đó.
- Phạm vi phiên:
  - `per-sender` (mặc định): mỗi agent có nhiều phiên.
  - `global`: TUI luôn sử dụng phiên `global` (bộ chọn có thể trống).
- Agent và phiên hiện tại luôn hiển thị trong chân trang.
- Nếu phiên có [mục tiêu](/vi/tools/goal), chân trang sẽ hiển thị trạng thái thu gọn:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` hoặc `Goal achieved`.
- Khi khởi động mà không có `--session`, TUI ở chế độ Gateway sẽ tiếp tục phiên được chọn gần nhất cho cùng Gateway, agent và phạm vi phiên nếu phiên đó vẫn tồn tại. Việc truyền `--session`, `/session`, `/new` hoặc `/reset` vẫn là lựa chọn rõ ràng.

## Gửi tin nhắn + chuyển giao

- Tin nhắn luôn được gửi đến Gateway (hoặc runtime nhúng ở chế độ cục bộ); việc chuyển phản hồi của trợ lý trở lại nhà cung cấp trò chuyện là một bước riêng biệt và mặc định bị tắt.
- TUI là một bề mặt nguồn nội bộ giống WebChat, không phải kênh gửi đi đa dụng. Các harness yêu cầu `tools.message` để hiển thị phản hồi có thể đáp ứng lượt TUI đang hoạt động bằng `message.send` không có đích; việc chuyển giao rõ ràng qua nhà cung cấp vẫn sử dụng các kênh được cấu hình thông thường và không bao giờ chuyển dự phòng sang `lastChannel`.
- Thiết lập chuyển giao được cố định cho toàn bộ phiên TUI khi khởi chạy: khởi động bằng `openclaw tui --deliver` để bật. Không có lệnh gạch chéo `/deliver` hoặc nút bật/tắt trong Cài đặt để thay đổi giữa phiên; hãy khởi động lại TUI để thay đổi.

## Bộ chọn + lớp phủ

- Bộ chọn mô hình: liệt kê các mô hình khả dụng và đặt giá trị ghi đè cho phiên.
- Bộ chọn agent: chọn một agent khác.
- Bộ chọn phiên: hiển thị tối đa 50 phiên của agent hiện tại được cập nhật trong 7 ngày qua. Sử dụng `/session <key>` để chuyển đến một phiên cũ đã biết.
- Cài đặt (`/settings`): bật/tắt việc mở rộng đầu ra công cụ và khả năng hiển thị quá trình suy nghĩ. Bảng này không kiểm soát việc chuyển giao.

## Phím tắt

- Enter: gửi tin nhắn
- Esc: hủy lượt chạy đang hoạt động
- Ctrl+C: xóa nội dung đầu vào (nhấn hai lần để thoát)
- Ctrl+D: thoát
- Ctrl+L: bộ chọn mô hình
- Ctrl+G: bộ chọn agent
- Ctrl+P: bộ chọn phiên
- Ctrl+O: bật/tắt việc mở rộng đầu ra công cụ
- Ctrl+T: bật/tắt khả năng hiển thị quá trình suy nghĩ (tải lại lịch sử)

## Lệnh gạch chéo

Cốt lõi:

- `/help`
- `/status` (được chuyển tiếp đến Gateway; hiển thị tóm tắt phiên/mô hình)
- `/gateway-status` (bí danh `/gwstatus`; hiển thị trực tiếp trạng thái kết nối Gateway)
- `/agent <id>` (hoặc `/agents`)
- `/session <key>` (hoặc `/sessions`)
- `/model <provider/model>` (hoặc `/models`)

Điều khiển phiên:

- `/think <off|minimal|low|medium|high>` (các cấp cao hơn có thể bổ sung những mức như `xhigh`/`max` tùy theo mô hình)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` xóa giá trị ghi đè của phiên)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (bí danh: `/elev`)
- `/activation <mention|always>`
- `/queue <steer|followup|collect|interrupt> [debounce:<duration>] [cap:<n>] [drop:<summarize|old|new>]`
- `/queue default` (hoặc `/queue reset`) xóa giá trị ghi đè của phiên

Vòng đời phiên:

- `/new` (tạo một phiên mới, biệt lập dưới một khóa mới; không ảnh hưởng đến các máy khách TUI khác trên phiên cũ)
- `/reset` (đặt lại khóa phiên hiện tại tại chỗ)
- `/abort` (hủy lượt chạy đang hoạt động)
- `/settings`
- `/exit` (hoặc `/quit`)

Chỉ dành cho chế độ cục bộ:

- `/auth [provider]` mở luồng xác thực/đăng nhập nhà cung cấp bên trong TUI.

Chế độ cục bộ triển khai các chế độ hàng đợi tương tự bên trong runtime nhúng. Một
lời nhắc giữa lượt chạy tuân theo chính sách `/queue` của phiên: `steer` chèn khi
runtime có thể tiếp nhận, `followup` chờ một lượt riêng, `collect` kết hợp
các lời nhắc đang chờ và `interrupt` dừng lượt chạy hiện tại trước khi bắt đầu lượt
mới. `/steer <message>` rõ ràng chỉ dành cho Gateway; hãy sử dụng `/queue steer` cùng một
tin nhắn thông thường trong chế độ cục bộ.

OpenClaw:

- `/openclaw [request]` quay lại từ TUI agent thông thường về cuộc trò chuyện thiết lập/sửa chữa [OpenClaw](#openclaw-setup-and-repair-helper), đồng thời có thể chuyển tiếp một yêu cầu.

Các lệnh gạch chéo Gateway khác (ví dụ: `/context`) được chuyển tiếp đến Gateway và hiển thị dưới dạng đầu ra hệ thống. Xem [Lệnh gạch chéo](/vi/tools/slash-commands).

## Lệnh shell cục bộ

- Thêm tiền tố `!` vào một dòng để chạy lệnh shell cục bộ trên máy chủ TUI.
- TUI nhắc một lần trong mỗi phiên để cho phép thực thi cục bộ; nếu từ chối, `!` sẽ vẫn bị vô hiệu hóa trong phiên.
- Các lệnh chạy trong một shell mới, không tương tác tại thư mục làm việc của TUI (không duy trì `cd`/môi trường).
- Các lệnh shell cục bộ nhận `OPENCLAW_SHELL=tui-local` trong môi trường của chúng.
- Một `!` đứng riêng được gửi dưới dạng tin nhắn thông thường; khoảng trắng ở đầu dòng không kích hoạt thực thi cục bộ.

## Trợ lý thiết lập và sửa chữa OpenClaw

OpenClaw là trợ lý thiết lập/sửa chữa cấp ring-zero, được cung cấp dưới dạng `openclaw setup` sau khi mô hình mặc định đã cấu hình vượt qua kiểm tra suy luận trực tiếp. Nếu suy luận không khả dụng, một lần gọi tương tác sẽ quay lại quy trình hướng dẫn suy luận và quá trình tự động hóa sẽ thất bại kèm hướng dẫn sửa chữa. Trợ lý chạy bên trong cùng shell TUI cục bộ như `openclaw tui --local`, được hỗ trợ bởi một agent AI chỉ được phép thực hiện các thao tác có kiểu của OpenClaw và yêu cầu phê duyệt:

```bash
openclaw setup                       # khởi động ở chế độ tương tác
openclaw setup -m "status"           # chạy một yêu cầu rồi thoát
openclaw setup -m "set default model openai/gpt-5.2" --yes   # áp dụng thao tác ghi cấu hình
```

- Các thao tác ghi cấu hình lâu dài cần được phê duyệt: xác nhận tương tác hoặc truyền `--yes`.
- `--json` in phần tổng quan khởi động dưới dạng JSON thay vì bắt đầu cuộc trò chuyện.
- Từ bên trong OpenClaw, một yêu cầu `open-tui` (ví dụ: yêu cầu trò chuyện với một agent thông thường) sẽ thoát OpenClaw và mở TUI agent thông thường; sử dụng `/openclaw` tại đó để quay lại.

Sử dụng chế độ cục bộ khi cấu hình hiện tại đã hợp lệ và bạn muốn agent nhúng kiểm tra cấu hình đó trên cùng máy, so sánh với tài liệu và hỗ trợ sửa chữa sai lệch mà không phụ thuộc vào một Gateway đang chạy.

Nếu `openclaw config validate` đã gặp lỗi, trước tiên hãy bắt đầu bằng `openclaw configure` hoặc `openclaw doctor --fix`; `openclaw chat` vẫn cần một cấu hình có thể tải để khởi động.

Quy trình điển hình:

1. Khởi động chế độ cục bộ:

```bash
openclaw chat
```

2. Yêu cầu agent kiểm tra nội dung bạn muốn, ví dụ:

```text
So sánh cấu hình xác thực Gateway của tôi với tài liệu và đề xuất cách khắc phục nhỏ nhất.
```

3. Sử dụng các lệnh shell cục bộ để thu thập bằng chứng chính xác và xác thực:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Áp dụng các thay đổi có phạm vi hẹp bằng `openclaw config set` hoặc `openclaw configure`, sau đó chạy lại `!openclaw config validate`.
5. Nếu Doctor đề xuất di chuyển hoặc sửa chữa tự động, hãy xem xét đề xuất rồi chạy `!openclaw doctor --fix`.

Mẹo:

- Ưu tiên `openclaw config set` hoặc `openclaw configure` thay vì chỉnh sửa thủ công `openclaw.json`.
- `openclaw docs "<query>"` tìm kiếm chỉ mục tài liệu trực tiếp từ cùng máy.
- `openclaw config validate --json` hữu ích khi bạn cần lược đồ có cấu trúc và các lỗi SecretRef/khả năng phân giải.

## Đầu ra công cụ

- Các lệnh gọi công cụ hiển thị dưới dạng thẻ với đối số + kết quả.
- Ctrl+O chuyển đổi giữa chế độ xem thu gọn/mở rộng.
- Trong khi công cụ chạy, các bản cập nhật từng phần được truyền trực tuyến vào cùng thẻ.

## Màu sắc thiết bị đầu cuối

- TUI giữ văn bản nội dung của trợ lý theo màu tiền cảnh mặc định của thiết bị đầu cuối để cả thiết bị đầu cuối nền tối lẫn nền sáng đều dễ đọc.
- Nếu thiết bị đầu cuối của bạn sử dụng nền sáng và tính năng tự động phát hiện không chính xác, hãy đặt `OPENCLAW_THEME=light` trước khi khởi chạy `openclaw tui`.
- Để buộc sử dụng bảng màu tối ban đầu, hãy đặt `OPENCLAW_THEME=dark`.

## Lịch sử + truyền trực tuyến

- Khi kết nối, TUI tải lịch sử mới nhất (mặc định 200 tin nhắn).
- Các phản hồi truyền trực tuyến được cập nhật tại chỗ cho đến khi hoàn tất.
- TUI cũng lắng nghe các sự kiện công cụ của agent để cung cấp thẻ công cụ phong phú hơn.

## Chi tiết kết nối

- TUI kết nối bằng ID máy khách `openclaw-tui` trong chế độ máy khách tổng quát `ui` (cùng chế độ mà Control UI và WebChat sử dụng cho chính sách Gateway).
- Các lần kết nối lại hiển thị thông báo hệ thống; khoảng trống sự kiện được hiển thị trong nhật ký.

## Tùy chọn

- `--local`: Chạy với môi trường thực thi tác nhân nhúng cục bộ
- `--url <url>`: URL WebSocket của Gateway (mặc định là `gateway.remote.url` từ cấu hình hoặc `ws://127.0.0.1:<port>` trên địa chỉ loopback)
- `--token <token>`: Token Gateway (nếu bắt buộc)
- `--password <password>`: Mật khẩu Gateway (nếu bắt buộc)
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS dự kiến cho Gateway `wss://` được ghim
- `--session <key>`: Khóa phiên (mặc định: `main` hoặc `global` khi phạm vi là toàn cục)
- `--deliver`: Gửi câu trả lời của trợ lý đến nhà cung cấp (mặc định tắt)
- `--thinking <level>`: Ghi đè mức độ suy luận khi gửi
- `--message <text>`: Gửi thông điệp ban đầu sau khi kết nối
- `--timeout-ms <ms>`: Thời gian chờ của tác nhân tính bằng ms (mặc định là `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Số mục lịch sử cần tải (mặc định `200`)

<Warning>
Khi đặt `--url`, TUI không dùng thông tin xác thực từ cấu hình hoặc môi trường làm phương án dự phòng. Hãy truyền rõ ràng `--token` hoặc `--password`, cùng với `--tls-fingerprint` khi đích sử dụng chứng chỉ được ghim. Thiếu thông tin xác thực được chỉ định rõ ràng là một lỗi. Trong chế độ cục bộ, không truyền `--url`, `--token`, `--password` hoặc `--tls-fingerprint`.
</Warning>

## Khắc phục sự cố

Không có đầu ra sau khi gửi thông điệp:

- Chạy `/status` trong TUI để xác nhận Gateway đã kết nối và đang rảnh/bận.
- Kiểm tra nhật ký Gateway: `openclaw logs --follow`.
- Xác nhận tác nhân có thể chạy: `openclaw status` và `openclaw models status`.
- Nếu bạn mong đợi thông điệp trong một kênh trò chuyện, hãy xác nhận TUI đã được khởi động với `--deliver` (không thể bật tùy chọn này sau đó nếu không khởi động lại).

## Khắc phục sự cố kết nối

- `disconnected`: bảo đảm Gateway đang chạy và `--url/--token/--password` của bạn là chính xác.
- Không có tác nhân trong trình chọn: kiểm tra `openclaw agents list` và cấu hình định tuyến của bạn.
- Trình chọn phiên trống: có thể bạn đang ở phạm vi toàn cục hoặc chưa có phiên nào.

## Liên quan

- [Giao diện điều khiển](/vi/web/control-ui) — giao diện điều khiển trên nền web
- [Cấu hình](/vi/cli/config) — kiểm tra, xác thực và chỉnh sửa `openclaw.json`
- [Doctor](/vi/cli/doctor) — quy trình sửa chữa có hướng dẫn và kiểm tra di chuyển
- [Tài liệu tham khảo CLI](/vi/cli) — tài liệu tham khảo đầy đủ về các lệnh CLI
