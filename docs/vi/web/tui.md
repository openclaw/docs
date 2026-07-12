---
read_when:
    - Bạn muốn một hướng dẫn từng bước thân thiện với người mới bắt đầu về TUI
    - Bạn cần danh sách đầy đủ các tính năng, lệnh và phím tắt của TUI
summary: 'Giao diện người dùng đầu cuối (TUI): kết nối với Gateway hoặc chạy cục bộ ở chế độ nhúng'
title: TUI
x-i18n:
    generated_at: "2026-07-12T08:27:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
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

3. Nhập tin nhắn rồi nhấn Enter.

Gateway từ xa:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Dùng `--password` nếu Gateway của bạn sử dụng xác thực bằng mật khẩu.

### Chế độ cục bộ

Chạy TUI mà không cần Gateway:

```bash
openclaw chat
# hoặc
openclaw tui --local
```

- `openclaw chat` và `openclaw terminal` là bí danh của `openclaw tui --local`.
- Không thể kết hợp `--local` với `--url`, `--token` hoặc `--password`.
- Chế độ cục bộ sử dụng trực tiếp môi trường thực thi tác tử nhúng. Hầu hết công cụ cục bộ đều hoạt động, nhưng các tính năng chỉ dành cho Gateway sẽ không khả dụng.
- Lệnh `openclaw` đơn thuần (không có lệnh con) tự động chọn đích: bản cài đặt chưa được cấu hình sẽ chạy quy trình thiết lập suy luận ban đầu; cấu hình không hợp lệ sẽ mở hướng dẫn Doctor cổ điển; Gateway đã cấu hình và có thể kết nối sẽ mở trình bao TUI này ở chế độ Gateway; nếu không, mô hình cục bộ đã cấu hình sẽ mở trình bao ở chế độ cục bộ.

## Nội dung hiển thị

- Đầu trang: URL kết nối, tác tử hiện tại, phiên hiện tại.
- Nhật ký trò chuyện: tin nhắn của người dùng, phản hồi của trợ lý, thông báo hệ thống, thẻ công cụ.
- Dòng trạng thái: trạng thái kết nối/lượt chạy (đang kết nối, đang chạy, đang truyền phát, rảnh, lỗi).
- Chân trang: tác tử + phiên + mô hình + trạng thái mục tiêu + suy nghĩ/nhanh/chi tiết/truy vết/lập luận + số lượng token + gửi đi. Khi bật `tui.footer.showRemoteHost`, các kết nối Gateway từ xa cũng hiển thị máy chủ kết nối.
- Vùng nhập: trình soạn thảo văn bản có tính năng tự động hoàn thành.

## Mô hình tư duy: tác tử + phiên

- Tác tử là các slug duy nhất (ví dụ: `main`, `research`). Gateway cung cấp danh sách này.
- Các phiên thuộc về tác tử hiện tại.
- Khóa phiên được lưu dưới dạng `agent:<agentId>:<sessionKey>`.
  - Nếu nhập `/session main`, TUI sẽ mở rộng thành `agent:<currentAgent>:main`.
  - Nếu nhập `/session agent:other:main`, bạn sẽ chuyển rõ ràng sang phiên của tác tử đó.
- Phạm vi phiên:
  - `per-sender` (mặc định): mỗi tác tử có nhiều phiên.
  - `global`: TUI luôn sử dụng phiên `global` (trình chọn có thể trống).
- Tác tử và phiên hiện tại luôn hiển thị ở chân trang.
- Để hiển thị máy chủ Gateway cho các kết nối dựa trên URL không phải cục bộ, hãy chủ động bật bằng:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Giá trị mặc định là `false`. Các kết nối local loopback và kết nối cục bộ nhúng không bao giờ hiển thị nhãn máy chủ.

- Nếu phiên có [mục tiêu](/vi/tools/goal), chân trang sẽ hiển thị trạng thái rút gọn:
  `Đang theo đuổi mục tiêu`, `Mục tiêu đã tạm dừng (/goal resume)`, `Mục tiêu bị chặn (/goal resume)` hoặc `Đã đạt mục tiêu`.
- Khi khởi động mà không có `--session`, TUI ở chế độ Gateway sẽ tiếp tục phiên được chọn gần nhất cho cùng Gateway, tác tử và phạm vi phiên nếu phiên đó vẫn tồn tại. Việc truyền `--session` hoặc dùng `/session`, `/new` hay `/reset` vẫn là lựa chọn rõ ràng.

## Gửi tin nhắn + chuyển phát

- Tin nhắn luôn được gửi đến Gateway (hoặc môi trường thực thi nhúng ở chế độ cục bộ); việc chuyển phản hồi của trợ lý ngược ra nhà cung cấp trò chuyện là một bước riêng biệt và mặc định bị tắt.
- TUI là một bề mặt nguồn nội bộ tương tự WebChat, không phải kênh gửi đi đa dụng. Các bộ khung yêu cầu `tools.message` để hiển thị phản hồi có thể đáp ứng lượt TUI đang hoạt động bằng `message.send` không có đích; việc chuyển phát rõ ràng qua nhà cung cấp vẫn sử dụng các kênh được cấu hình thông thường và không bao giờ dự phòng sang `lastChannel`.
- Chế độ chuyển phát được cố định cho toàn bộ phiên TUI khi khởi chạy: bắt đầu bằng `openclaw tui --deliver` để bật. Không có lệnh gạch chéo `/deliver` hoặc nút bật/tắt trong Settings để thay đổi giữa phiên; hãy khởi động lại TUI để thay đổi.

## Trình chọn + lớp phủ

- Trình chọn mô hình: liệt kê các mô hình khả dụng và đặt giá trị ghi đè cho phiên.
- Trình chọn tác tử: chọn một tác tử khác.
- Trình chọn phiên: hiển thị tối đa 50 phiên của tác tử hiện tại được cập nhật trong 7 ngày qua. Dùng `/session <key>` để chuyển đến một phiên cũ đã biết.
- Settings (`/settings`): bật/tắt việc mở rộng đầu ra công cụ và khả năng hiển thị quá trình suy nghĩ. Bảng này không kiểm soát việc chuyển phát.

## Phím tắt

- Enter: gửi tin nhắn
- Esc: hủy lượt chạy đang hoạt động
- Ctrl+C: xóa vùng nhập (nhấn hai lần để thoát)
- Ctrl+D: thoát
- Ctrl+L: trình chọn mô hình
- Ctrl+G: trình chọn tác tử
- Ctrl+P: trình chọn phiên
- Ctrl+O: bật/tắt mở rộng đầu ra công cụ
- Ctrl+T: bật/tắt hiển thị quá trình suy nghĩ (tải lại lịch sử)

## Lệnh gạch chéo

Cốt lõi:

- `/help`
- `/status` (được chuyển tiếp đến Gateway; hiển thị bản tóm tắt phiên/mô hình)
- `/gateway-status` (bí danh `/gwstatus`; hiển thị trực tiếp trạng thái kết nối Gateway)
- `/agent <id>` (hoặc `/agents`)
- `/session <key>` (hoặc `/sessions`)
- `/model <provider/model>` (hoặc `/models`)

Điều khiển phiên:

- `/think <off|minimal|low|medium|high>` (các cấp cao hơn có thể thêm những mức như `xhigh`/`max` tùy theo mô hình)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` xóa giá trị ghi đè của phiên)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (bí danh: `/elev`)
- `/activation <mention|always>`

Vòng đời phiên:

- `/new` (tạo một phiên mới, biệt lập dưới khóa mới; không ảnh hưởng đến các máy khách TUI khác trong phiên cũ)
- `/reset` (đặt lại tại chỗ khóa phiên hiện tại)
- `/abort` (hủy lượt chạy đang hoạt động)
- `/settings`
- `/exit` (hoặc `/quit`)

Chỉ dành cho chế độ cục bộ:

- `/auth [provider]` mở luồng xác thực/đăng nhập của nhà cung cấp bên trong TUI.

Crestodian:

- `/crestodian [request]` quay lại từ TUI tác tử thông thường về cuộc trò chuyện thiết lập/sửa chữa [Crestodian](#crestodian-setup-and-repair-helper), đồng thời có thể chuyển tiếp một yêu cầu.

Các lệnh gạch chéo Gateway khác (ví dụ: `/context`) được chuyển tiếp đến Gateway và hiển thị dưới dạng đầu ra hệ thống. Xem [Lệnh gạch chéo](/vi/tools/slash-commands).

## Lệnh trình bao cục bộ

- Thêm tiền tố `!` vào một dòng để chạy lệnh trình bao cục bộ trên máy chủ TUI.
- TUI sẽ hỏi một lần trong mỗi phiên để cho phép thực thi cục bộ; nếu từ chối, `!` sẽ tiếp tục bị vô hiệu hóa trong phiên đó.
- Các lệnh chạy trong một trình bao mới, không tương tác, tại thư mục làm việc của TUI (không duy trì `cd`/môi trường).
- Các lệnh trình bao cục bộ nhận `OPENCLAW_SHELL=tui-local` trong môi trường của chúng.
- Một ký tự `!` đơn lẻ được gửi dưới dạng tin nhắn thông thường; khoảng trắng ở đầu dòng không kích hoạt thực thi cục bộ.

## Trợ lý thiết lập và sửa chữa Crestodian

Crestodian là trợ lý thiết lập/sửa chữa cấp đặc quyền cao nhất, được cung cấp dưới dạng `openclaw crestodian` sau khi mô hình mặc định đã cấu hình vượt qua kiểm tra suy luận trực tiếp. Nếu suy luận không khả dụng, lời gọi tương tác sẽ quay lại quy trình thiết lập suy luận ban đầu và quy trình tự động hóa sẽ thất bại kèm hướng dẫn sửa chữa. Crestodian chạy trong cùng trình bao TUI cục bộ với `openclaw tui --local`, được hỗ trợ bởi một tác tử AI chỉ có quyền thực hiện các thao tác có kiểu của Crestodian và phải qua bước phê duyệt:

```bash
openclaw crestodian                       # khởi động tương tác
openclaw crestodian -m "status"           # chạy một yêu cầu rồi thoát
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # áp dụng thao tác ghi cấu hình
```

- Việc ghi cấu hình lâu dài cần được phê duyệt: xác nhận tương tác hoặc truyền `--yes`.
- `--json` in phần tổng quan khởi động dưới dạng JSON thay vì bắt đầu trò chuyện.
- Từ bên trong Crestodian, yêu cầu `open-tui` (ví dụ: yêu cầu trò chuyện với tác tử thông thường) sẽ thoát Crestodian và mở TUI tác tử thông thường; dùng `/crestodian` tại đó để quay lại.

Hãy dùng chế độ cục bộ khi cấu hình hiện tại đã hợp lệ và bạn muốn tác tử nhúng kiểm tra cấu hình đó trên cùng máy, so sánh với tài liệu và hỗ trợ sửa sai lệch mà không phụ thuộc vào Gateway đang chạy.

Nếu `openclaw config validate` đã thất bại, trước tiên hãy bắt đầu bằng `openclaw configure` hoặc `openclaw doctor --fix`; `openclaw chat` vẫn cần cấu hình có thể tải được để khởi động.

Quy trình điển hình:

1. Khởi động chế độ cục bộ:

```bash
openclaw chat
```

2. Yêu cầu tác tử kiểm tra điều bạn muốn, ví dụ:

```text
So sánh cấu hình xác thực Gateway của tôi với tài liệu và đề xuất cách sửa nhỏ nhất.
```

3. Dùng các lệnh trình bao cục bộ để thu thập bằng chứng chính xác và xác thực:

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
- `openclaw config validate --json` hữu ích khi bạn muốn nhận lỗi lược đồ và lỗi SecretRef/khả năng phân giải ở dạng có cấu trúc.

## Đầu ra công cụ

- Các lệnh gọi công cụ hiển thị dưới dạng thẻ kèm đối số + kết quả.
- Ctrl+O chuyển đổi giữa chế độ xem thu gọn/mở rộng.
- Trong khi công cụ chạy, các bản cập nhật từng phần được truyền phát vào cùng thẻ.

## Màu sắc đầu cuối

- TUI giữ văn bản nội dung của trợ lý ở màu tiền cảnh mặc định của đầu cuối để cả đầu cuối nền tối và nền sáng đều dễ đọc.
- Nếu đầu cuối của bạn dùng nền sáng nhưng tính năng tự động phát hiện không chính xác, hãy đặt `OPENCLAW_THEME=light` trước khi khởi chạy `openclaw tui`.
- Để buộc sử dụng bảng màu tối ban đầu, hãy đặt `OPENCLAW_THEME=dark`.

## Lịch sử + truyền phát

- Khi kết nối, TUI tải lịch sử mới nhất (mặc định 200 tin nhắn).
- Các phản hồi truyền phát được cập nhật tại chỗ cho đến khi hoàn tất.
- TUI cũng lắng nghe các sự kiện công cụ của tác tử để hiển thị thẻ công cụ phong phú hơn.

## Chi tiết kết nối

- TUI kết nối bằng mã máy khách `openclaw-tui` trong chế độ máy khách tổng quát `ui` (cùng chế độ mà Control UI và WebChat sử dụng cho chính sách Gateway).
- Việc kết nối lại hiển thị một thông báo hệ thống; các khoảng trống sự kiện được thể hiện trong nhật ký.

## Tùy chọn

- `--local`: Chạy với môi trường thực thi tác tử nhúng cục bộ
- `--url <url>`: URL WebSocket của Gateway (mặc định lấy từ `gateway.remote.url` trong cấu hình hoặc `ws://127.0.0.1:<port>` trên local loopback)
- `--token <token>`: Token Gateway (nếu bắt buộc)
- `--password <password>`: Mật khẩu Gateway (nếu bắt buộc)
- `--tls-fingerprint <sha256>`: Dấu vân tay chứng chỉ TLS dự kiến cho Gateway `wss://` được ghim
- `--session <key>`: Khóa phiên (mặc định: `main`, hoặc `global` khi phạm vi là toàn cục)
- `--deliver`: Chuyển phản hồi của trợ lý đến nhà cung cấp (mặc định tắt)
- `--thinking <level>`: Ghi đè mức suy nghĩ khi gửi
- `--message <text>`: Gửi tin nhắn ban đầu sau khi kết nối
- `--timeout-ms <ms>`: Thời gian chờ tác tử tính bằng mili giây (mặc định lấy từ `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Số mục lịch sử cần tải (mặc định `200`)

<Warning>
Khi đặt `--url`, TUI không dự phòng sang thông tin xác thực trong cấu hình hoặc môi trường. Hãy truyền rõ ràng `--token` hoặc `--password`, cùng với `--tls-fingerprint` khi đích sử dụng chứng chỉ được ghim. Thiếu thông tin xác thực rõ ràng là một lỗi. Trong chế độ cục bộ, không truyền `--url`, `--token`, `--password` hoặc `--tls-fingerprint`.
</Warning>

## Khắc phục sự cố

Không có đầu ra sau khi gửi tin nhắn:

- Chạy `/status` trong TUI để xác nhận Gateway đã kết nối và đang rảnh/bận.
- Kiểm tra nhật ký Gateway: `openclaw logs --follow`.
- Xác nhận tác tử có thể chạy: `openclaw status` và `openclaw models status`.
- Nếu bạn mong đợi tin nhắn xuất hiện trong một kênh trò chuyện, hãy xác nhận TUI được khởi động với `--deliver` (không thể bật tính năng này sau đó nếu không khởi động lại).

## Khắc phục sự cố kết nối

- `disconnected`: bảo đảm Gateway đang chạy và `--url/--token/--password` của bạn chính xác.
- Không có tác tử trong trình chọn: kiểm tra `openclaw agents list` và cấu hình định tuyến của bạn.
- Trình chọn phiên trống: có thể bạn đang ở phạm vi toàn cục hoặc chưa có phiên nào.

## Liên quan

- [Control UI](/vi/web/control-ui) — giao diện điều khiển dựa trên web
- [Cấu hình](/vi/cli/config) — kiểm tra, xác thực và chỉnh sửa `openclaw.json`
- [Doctor](/vi/cli/doctor) — kiểm tra sửa chữa và di chuyển có hướng dẫn
- [Tham chiếu CLI](/vi/cli) — tham chiếu đầy đủ về các lệnh CLI
