---
read_when:
    - Bạn muốn có hướng dẫn từng bước thân thiện với người mới bắt đầu về TUI
    - Bạn cần danh sách đầy đủ các tính năng, lệnh và phím tắt của TUI
summary: 'Giao diện người dùng đầu cuối (TUI): kết nối với Gateway hoặc chạy cục bộ ở chế độ nhúng'
title: TUI
x-i18n:
    generated_at: "2026-07-16T15:19:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
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

Dùng `--password` nếu Gateway sử dụng xác thực bằng mật khẩu.

### Chế độ cục bộ

Chạy TUI mà không cần Gateway:

```bash
openclaw chat
# hoặc
openclaw tui --local
```

- `openclaw chat` và `openclaw terminal` là bí danh của `openclaw tui --local`.
- Không thể kết hợp `--local` với `--url`, `--token` hoặc `--password`.
- Chế độ cục bộ sử dụng trực tiếp môi trường chạy tác nhân nhúng. Hầu hết công cụ cục bộ đều hoạt động, nhưng các tính năng chỉ dành cho Gateway không khả dụng.
- `openclaw` độc lập (không có lệnh con) tự động chọn đích: bản cài đặt chưa được cấu hình sẽ chạy quy trình thiết lập suy luận ban đầu; cấu hình không hợp lệ sẽ mở hướng dẫn Doctor cổ điển; Gateway đã cấu hình và có thể truy cập sẽ mở shell TUI này ở chế độ Gateway; nếu không, mô hình cục bộ đã cấu hình sẽ mở shell ở chế độ cục bộ.

## Nội dung hiển thị

- Đầu trang: URL kết nối, tác nhân hiện tại, phiên hiện tại.
- Nhật ký trò chuyện: tin nhắn của người dùng, phản hồi của trợ lý, thông báo hệ thống, thẻ công cụ.
- Dòng trạng thái: trạng thái kết nối/lượt chạy (đang kết nối, đang chạy, đang truyền trực tuyến, rảnh, lỗi).
- Chân trang: tác nhân + phiên + mô hình + trạng thái mục tiêu + suy nghĩ/nhanh/chi tiết/dấu vết/lập luận + số lượng token + gửi đi. Khi bật `tui.footer.showRemoteHost`, các kết nối Gateway từ xa cũng hiển thị máy chủ kết nối.
- Ô nhập liệu: trình soạn thảo văn bản có tính năng tự động hoàn thành.

## Mô hình tư duy: tác nhân + phiên

- Tác nhân là các slug duy nhất (ví dụ: `main`, `research`). Gateway cung cấp danh sách này.
- Các phiên thuộc về tác nhân hiện tại.
- Khóa phiên được lưu dưới dạng `agent:<agentId>:<sessionKey>`.
  - Nếu nhập `/session main`, TUI sẽ mở rộng thành `agent:<currentAgent>:main`.
  - Nếu nhập `/session agent:other:main`, bạn sẽ chuyển rõ ràng sang phiên của tác nhân đó.
- Phạm vi phiên:
  - `per-sender` (mặc định): mỗi tác nhân có nhiều phiên.
  - `global`: TUI luôn sử dụng phiên `global` (trình chọn có thể trống).
- Tác nhân và phiên hiện tại luôn hiển thị ở chân trang.
- Để hiển thị máy chủ Gateway cho các kết nối không cục bộ dựa trên URL, hãy bật tùy chọn này bằng:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Mặc định là `false`. Các kết nối loopback và kết nối cục bộ nhúng không bao giờ hiển thị nhãn máy chủ.

- Nếu phiên có [mục tiêu](/vi/tools/goal), chân trang sẽ hiển thị trạng thái thu gọn của mục tiêu:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)` hoặc `Goal achieved`.
- Khi khởi động mà không có `--session`, TUI ở chế độ Gateway sẽ tiếp tục phiên được chọn gần nhất cho cùng Gateway, tác nhân và phạm vi phiên nếu phiên đó vẫn tồn tại. Việc truyền `--session`, `/session`, `/new` hoặc `/reset` vẫn là chỉ định tường minh.

## Gửi tin nhắn + chuyển giao

- Tin nhắn luôn được gửi đến Gateway (hoặc môi trường chạy nhúng trong chế độ cục bộ); việc chuyển phản hồi của trợ lý trở lại một nhà cung cấp trò chuyện là bước riêng biệt và mặc định bị tắt.
- TUI là một bề mặt nguồn nội bộ giống WebChat, không phải kênh gửi đi dùng chung. Các bộ kiểm thử cần `tools.message` để phản hồi hiển thị có thể đáp ứng lượt TUI đang hoạt động bằng `message.send` không có đích; việc chuyển giao rõ ràng qua nhà cung cấp vẫn sử dụng các kênh được cấu hình thông thường và không bao giờ chuyển sang `lastChannel` làm phương án dự phòng.
- Chế độ chuyển giao được cố định cho toàn bộ phiên TUI khi khởi chạy: khởi động bằng `openclaw tui --deliver` để bật chế độ này. Không có lệnh gạch chéo `/deliver` hoặc nút bật/tắt trong phần Cài đặt để thay đổi giữa phiên; hãy khởi động lại TUI để thay đổi.

## Trình chọn + lớp phủ

- Trình chọn mô hình: liệt kê các mô hình khả dụng và đặt giá trị ghi đè cho phiên.
- Trình chọn tác nhân: chọn một tác nhân khác.
- Trình chọn phiên: hiển thị tối đa 50 phiên của tác nhân hiện tại đã được cập nhật trong 7 ngày qua. Dùng `/session <key>` để chuyển đến một phiên cũ hơn đã biết.
- Cài đặt (`/settings`): bật/tắt việc mở rộng đầu ra công cụ và khả năng hiển thị quá trình suy nghĩ. Bảng này không kiểm soát việc chuyển giao.

## Phím tắt

- Enter: gửi tin nhắn
- Esc: hủy lượt chạy đang hoạt động
- Ctrl+C: xóa nội dung nhập (nhấn hai lần để thoát)
- Ctrl+D: thoát
- Ctrl+L: trình chọn mô hình
- Ctrl+G: trình chọn tác nhân
- Ctrl+P: trình chọn phiên
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

Vòng đời phiên:

- `/new` (tạo một phiên mới, biệt lập dưới khóa mới; không ảnh hưởng đến các máy khách TUI khác trên phiên cũ)
- `/reset` (đặt lại khóa phiên hiện tại tại chỗ)
- `/abort` (hủy lượt chạy đang hoạt động)
- `/settings`
- `/exit` (hoặc `/quit`)

Chỉ dành cho chế độ cục bộ:

- `/auth [provider]` mở luồng xác thực/đăng nhập của nhà cung cấp bên trong TUI.

OpenClaw:

- `/openclaw [request]` đưa bạn từ TUI tác nhân thông thường trở lại cuộc trò chuyện thiết lập/sửa chữa [OpenClaw](#openclaw-setup-and-repair-helper), đồng thời có thể chuyển tiếp một yêu cầu.

Các lệnh gạch chéo Gateway khác (ví dụ: `/context`) được chuyển tiếp đến Gateway và hiển thị dưới dạng đầu ra hệ thống. Xem [Lệnh gạch chéo](/vi/tools/slash-commands).

## Lệnh shell cục bộ

- Thêm tiền tố `!` vào một dòng để chạy lệnh shell cục bộ trên máy chủ TUI.
- TUI nhắc một lần trong mỗi phiên để cho phép thực thi cục bộ; nếu từ chối, `!` sẽ bị vô hiệu hóa trong phiên đó.
- Các lệnh chạy trong một shell mới, không tương tác tại thư mục làm việc của TUI (không duy trì `cd`/môi trường).
- Các lệnh shell cục bộ nhận `OPENCLAW_SHELL=tui-local` trong môi trường của chúng.
- `!` đứng riêng được gửi dưới dạng tin nhắn thông thường; khoảng trắng ở đầu dòng không kích hoạt thực thi cục bộ.

## Trợ lý thiết lập và sửa chữa OpenClaw

OpenClaw là trợ lý thiết lập/sửa chữa vòng đặc quyền cao nhất, được cung cấp dưới dạng `openclaw setup` sau khi mô hình mặc định đã cấu hình vượt qua kiểm tra suy luận trực tiếp. Nếu không thể suy luận, lời gọi tương tác sẽ trở lại quy trình thiết lập suy luận ban đầu và quá trình tự động hóa sẽ thất bại kèm hướng dẫn sửa chữa. Trợ lý chạy trong cùng shell TUI cục bộ như `openclaw tui --local`, được hỗ trợ bởi một tác nhân AI chỉ được phép thực hiện các thao tác có kiểu của OpenClaw và phải qua phê duyệt:

```bash
openclaw setup                       # khởi động ở chế độ tương tác
openclaw setup -m "status"           # chạy một yêu cầu rồi thoát
openclaw setup -m "set default model openai/gpt-5.2" --yes   # áp dụng thao tác ghi cấu hình
```

- Các thao tác ghi cấu hình lâu dài cần được phê duyệt: xác nhận trong chế độ tương tác hoặc truyền `--yes`.
- `--json` in phần tổng quan khởi động dưới dạng JSON thay vì bắt đầu cuộc trò chuyện.
- Từ bên trong OpenClaw, một yêu cầu `open-tui` (ví dụ: yêu cầu trò chuyện với tác nhân thông thường) sẽ thoát OpenClaw và mở TUI tác nhân thông thường; dùng `/openclaw` tại đó để quay lại.

Dùng chế độ cục bộ khi cấu hình hiện tại đã hợp lệ và bạn muốn tác nhân nhúng kiểm tra cấu hình trên cùng máy, đối chiếu với tài liệu và hỗ trợ sửa sai lệch mà không phụ thuộc vào Gateway đang chạy.

Nếu `openclaw config validate` đã thất bại, trước tiên hãy bắt đầu bằng `openclaw configure` hoặc `openclaw doctor --fix`; `openclaw chat` vẫn cần một cấu hình có thể tải để khởi động.

Quy trình điển hình:

1. Khởi động chế độ cục bộ:

```bash
openclaw chat
```

2. Yêu cầu tác nhân kiểm tra nội dung mong muốn, ví dụ:

```text
So sánh cấu hình xác thực Gateway của tôi với tài liệu và đề xuất cách sửa nhỏ nhất.
```

3. Dùng các lệnh shell cục bộ để thu thập bằng chứng chính xác và xác thực:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Áp dụng các thay đổi giới hạn bằng `openclaw config set` hoặc `openclaw configure`, sau đó chạy lại `!openclaw config validate`.
5. Nếu Doctor đề xuất di chuyển hoặc sửa chữa tự động, hãy xem xét rồi chạy `!openclaw doctor --fix`.

Mẹo:

- Ưu tiên `openclaw config set` hoặc `openclaw configure` thay vì chỉnh sửa thủ công `openclaw.json`.
- `openclaw docs "<query>"` tìm kiếm chỉ mục tài liệu trực tiếp từ cùng máy.
- `openclaw config validate --json` hữu ích khi cần lược đồ có cấu trúc cùng các lỗi SecretRef/khả năng phân giải.

## Đầu ra công cụ

- Các lệnh gọi công cụ hiển thị dưới dạng thẻ chứa đối số + kết quả.
- Ctrl+O chuyển đổi giữa chế độ xem thu gọn/mở rộng.
- Trong khi công cụ chạy, các bản cập nhật từng phần được truyền trực tuyến vào cùng thẻ.

## Màu sắc thiết bị đầu cuối

- TUI giữ văn bản nội dung của trợ lý ở màu tiền cảnh mặc định của thiết bị đầu cuối để cả thiết bị đầu cuối nền tối và nền sáng đều dễ đọc.
- Nếu thiết bị đầu cuối sử dụng nền sáng và tính năng tự động phát hiện không chính xác, hãy đặt `OPENCLAW_THEME=light` trước khi khởi chạy `openclaw tui`.
- Để buộc sử dụng bảng màu tối ban đầu, hãy đặt `OPENCLAW_THEME=dark`.

## Lịch sử + truyền trực tuyến

- Khi kết nối, TUI tải lịch sử mới nhất (mặc định 200 tin nhắn).
- Các phản hồi truyền trực tuyến được cập nhật tại chỗ cho đến khi hoàn tất.
- TUI cũng lắng nghe các sự kiện công cụ của tác nhân để hiển thị thẻ công cụ phong phú hơn.

## Chi tiết kết nối

- TUI kết nối bằng ID máy khách `openclaw-tui` trong chế độ máy khách cấp cao `ui` (cùng chế độ mà Control UI và WebChat sử dụng cho chính sách Gateway).
- Khi kết nối lại, hệ thống hiển thị một thông báo; các khoảng trống sự kiện được hiển thị trong nhật ký.

## Tùy chọn

- `--local`: Chạy với runtime agent nhúng cục bộ
- `--url <url>`: URL WebSocket của Gateway (mặc định là `gateway.remote.url` từ cấu hình hoặc `ws://127.0.0.1:<port>` trên loopback)
- `--token <token>`: Token Gateway (nếu bắt buộc)
- `--password <password>`: Mật khẩu Gateway (nếu bắt buộc)
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS dự kiến cho Gateway `wss://` được ghim
- `--session <key>`: Khóa phiên (mặc định: `main`, hoặc `global` khi phạm vi là toàn cục)
- `--deliver`: Gửi phản hồi của trợ lý đến nhà cung cấp (mặc định tắt)
- `--thinking <level>`: Ghi đè mức độ suy luận khi gửi
- `--message <text>`: Gửi thông báo ban đầu sau khi kết nối
- `--timeout-ms <ms>`: Thời gian chờ của agent tính bằng ms (mặc định là `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Số mục lịch sử cần tải (mặc định `200`)

<Warning>
Khi đặt `--url`, TUI không dùng thông tin xác thực từ cấu hình hoặc môi trường làm phương án dự phòng. Hãy truyền rõ ràng `--token` hoặc `--password`, cùng với `--tls-fingerprint` khi đích sử dụng chứng chỉ được ghim. Thiếu thông tin xác thực được chỉ định rõ ràng là một lỗi. Ở chế độ cục bộ, không truyền `--url`, `--token`, `--password` hoặc `--tls-fingerprint`.
</Warning>

## Khắc phục sự cố

Không có đầu ra sau khi gửi thông báo:

- Chạy `/status` trong TUI để xác nhận Gateway đã kết nối và đang rảnh/bận.
- Kiểm tra nhật ký Gateway: `openclaw logs --follow`.
- Xác nhận agent có thể chạy: `openclaw status` và `openclaw models status`.
- Nếu bạn mong đợi thông báo trong một kênh trò chuyện, hãy xác nhận TUI đã được khởi động với `--deliver` (không thể bật tùy chọn này sau đó nếu không khởi động lại).

## Khắc phục sự cố kết nối

- `disconnected`: đảm bảo Gateway đang chạy và `--url/--token/--password` của bạn là chính xác.
- Không có agent trong bộ chọn: kiểm tra `openclaw agents list` và cấu hình định tuyến của bạn.
- Bộ chọn phiên trống: bạn có thể đang ở phạm vi toàn cục hoặc chưa có phiên nào.

## Liên quan

- [Giao diện điều khiển](/vi/web/control-ui) — giao diện điều khiển dựa trên web
- [Cấu hình](/vi/cli/config) — kiểm tra, xác thực và chỉnh sửa `openclaw.json`
- [Doctor](/vi/cli/doctor) — kiểm tra sửa chữa và di chuyển có hướng dẫn
- [Tham chiếu CLI](/vi/cli) — tham chiếu đầy đủ về các lệnh CLI
