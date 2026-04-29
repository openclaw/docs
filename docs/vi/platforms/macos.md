---
read_when:
    - Triển khai các tính năng ứng dụng macOS
    - Thay đổi vòng đời Gateway hoặc cầu nối Node trên macOS
summary: Ứng dụng đồng hành OpenClaw cho macOS (thanh menu + bộ trung gian Gateway)
title: ứng dụng macOS
x-i18n:
    generated_at: "2026-04-29T22:58:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

Ứng dụng macOS là **ứng dụng đồng hành trên thanh menu** cho OpenClaw. Ứng dụng này sở hữu các quyền,
quản lý/gắn vào Gateway cục bộ (launchd hoặc thủ công), và cung cấp các khả năng
của macOS cho agent dưới dạng một Node.

## Ứng dụng làm gì

- Hiển thị thông báo gốc và trạng thái trên thanh menu.
- Sở hữu các lời nhắc TCC (Thông báo, Trợ năng, Ghi màn hình, Micrô,
  Nhận dạng giọng nói, Tự động hóa/AppleScript).
- Chạy hoặc kết nối tới Gateway (cục bộ hoặc từ xa).
- Cung cấp các công cụ chỉ có trên macOS (Canvas, Camera, Screen Recording, `system.run`).
- Khởi động dịch vụ máy chủ Node cục bộ ở chế độ **từ xa** (launchd), và dừng dịch vụ đó ở chế độ **cục bộ**.
- Tùy chọn lưu trữ **PeekabooBridge** cho tự động hóa UI.
- Cài đặt CLI toàn cục (`openclaw`) khi được yêu cầu qua npm, pnpm, hoặc bun (ứng dụng ưu tiên npm, rồi pnpm, rồi bun; Node vẫn là runtime Gateway được khuyến nghị).

## Chế độ cục bộ và từ xa

- **Cục bộ** (mặc định): ứng dụng gắn vào một Gateway cục bộ đang chạy nếu có;
  nếu không, ứng dụng bật dịch vụ launchd qua `openclaw gateway install`.
- **Từ xa**: ứng dụng kết nối tới Gateway qua SSH/Tailscale và không bao giờ khởi động
  một tiến trình cục bộ.
  Ứng dụng khởi động **dịch vụ máy chủ Node** cục bộ để Gateway từ xa có thể truy cập máy Mac này.
  Ứng dụng không tạo Gateway làm tiến trình con.
  Việc khám phá Gateway hiện ưu tiên tên Tailscale MagicDNS hơn IP tailnet thô,
  nên ứng dụng Mac khôi phục đáng tin cậy hơn khi IP tailnet thay đổi.

## Điều khiển launchd

Ứng dụng quản lý LaunchAgent theo từng người dùng có nhãn `ai.openclaw.gateway`
(hoặc `ai.openclaw.<profile>` khi dùng `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` cũ vẫn được dỡ tải).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Thay nhãn bằng `ai.openclaw.<profile>` khi chạy một profile có tên.

Nếu LaunchAgent chưa được cài đặt, hãy bật từ ứng dụng hoặc chạy
`openclaw gateway install`.

## Khả năng của Node (mac)

Ứng dụng macOS trình bày chính nó như một Node. Các lệnh phổ biến:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Màn hình: `screen.snapshot`, `screen.record`
- Hệ thống: `system.run`, `system.notify`

Node báo cáo một bản đồ `permissions` để agent có thể quyết định điều gì được phép.

Dịch vụ Node + IPC của ứng dụng:

- Khi dịch vụ máy chủ Node headless đang chạy (chế độ từ xa), dịch vụ này kết nối tới Gateway WS dưới dạng một Node.
- `system.run` thực thi trong ứng dụng macOS (ngữ cảnh UI/TCC) qua một Unix socket cục bộ; lời nhắc + đầu ra vẫn ở trong ứng dụng.

Sơ đồ (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Phê duyệt thực thi (system.run)

`system.run` được điều khiển bởi **Phê duyệt thực thi** trong ứng dụng macOS (Cài đặt → Phê duyệt thực thi).
Bảo mật + hỏi + allowlist được lưu cục bộ trên máy Mac tại:

```
~/.openclaw/exec-approvals.json
```

Ví dụ:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Ghi chú:

- Các mục `allowlist` là mẫu glob cho đường dẫn nhị phân đã phân giải, hoặc tên lệnh trần cho các lệnh được gọi qua PATH.
- Văn bản lệnh shell thô chứa cú pháp điều khiển hoặc mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được xem là một lần trượt allowlist và yêu cầu phê duyệt rõ ràng (hoặc thêm nhị phân shell vào allowlist).
- Chọn “Luôn cho phép” trong lời nhắc sẽ thêm lệnh đó vào allowlist.
- Các ghi đè môi trường của `system.run` được lọc (loại bỏ `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) rồi được hợp nhất với môi trường của ứng dụng.
- Với các trình bao bọc shell (`bash|sh|zsh ... -c/-lc`), các ghi đè môi trường theo phạm vi yêu cầu được rút gọn thành một allowlist nhỏ, rõ ràng (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Với các quyết định luôn cho phép trong chế độ allowlist, các trình bao bọc điều phối đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn executable bên trong thay vì đường dẫn trình bao bọc. Nếu việc gỡ bao không an toàn, sẽ không có mục allowlist nào được lưu tự động.

## Liên kết sâu

Ứng dụng đăng ký scheme URL `openclaw://` cho các hành động cục bộ.

### `openclaw://agent`

Kích hoạt một yêu cầu `agent` của Gateway.
__OC_I18N_900004__
Tham số truy vấn:

- `message` (bắt buộc)
- `sessionKey` (tùy chọn)
- `thinking` (tùy chọn)
- `deliver` / `to` / `channel` (tùy chọn)
- `timeoutSeconds` (tùy chọn)
- `key` (khóa chế độ không cần giám sát tùy chọn)

An toàn:

- Không có `key`, ứng dụng nhắc xác nhận.
- Không có `key`, ứng dụng áp dụng giới hạn thông điệp ngắn cho lời nhắc xác nhận và bỏ qua `deliver` / `to` / `channel`.
- Với một `key` hợp lệ, lần chạy là không cần giám sát (dành cho tự động hóa cá nhân).

## Luồng thiết lập ban đầu (thông thường)

1. Cài đặt và khởi chạy **OpenClaw.app**.
2. Hoàn tất danh sách kiểm tra quyền (lời nhắc TCC).
3. Đảm bảo chế độ **Cục bộ** đang hoạt động và Gateway đang chạy.
4. Cài đặt CLI nếu bạn muốn truy cập từ terminal.

## Vị trí thư mục trạng thái (macOS)

Tránh đặt thư mục trạng thái OpenClaw của bạn trong iCloud hoặc các thư mục đồng bộ đám mây khác.
Các đường dẫn được hỗ trợ bởi đồng bộ hóa có thể thêm độ trễ và đôi khi gây ra tranh chấp khóa tệp/đồng bộ cho
phiên và thông tin xác thực.

Ưu tiên một đường dẫn trạng thái cục bộ không đồng bộ như:
__OC_I18N_900005__
Nếu `openclaw doctor` phát hiện trạng thái nằm dưới:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

nó sẽ cảnh báo và khuyến nghị chuyển lại về một đường dẫn cục bộ.

## Quy trình build & phát triển (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (hoặc Xcode)
- Đóng gói ứng dụng: `scripts/package-mac-app.sh`

## Gỡ lỗi kết nối Gateway (CLI macOS)

Dùng CLI gỡ lỗi để thực hiện cùng logic bắt tay và khám phá Gateway WebSocket
mà ứng dụng macOS dùng, mà không cần khởi chạy ứng dụng.
__OC_I18N_900006__
Tùy chọn kết nối:

- `--url <ws://host:port>`: ghi đè cấu hình
- `--mode <local|remote>`: phân giải từ cấu hình (mặc định: cấu hình hoặc cục bộ)
- `--probe`: buộc probe tình trạng mới
- `--timeout <ms>`: thời gian chờ yêu cầu (mặc định: `15000`)
- `--json`: đầu ra có cấu trúc để so sánh khác biệt

Tùy chọn khám phá:

- `--include-local`: bao gồm các Gateway vốn sẽ bị lọc là “cục bộ”
- `--timeout <ms>`: cửa sổ khám phá tổng thể (mặc định: `2000`)
- `--json`: đầu ra có cấu trúc để so sánh khác biệt

<Tip>
So sánh với `openclaw gateway discover --json` để xem pipeline khám phá của ứng dụng macOS (`local.` cộng với miền diện rộng đã cấu hình, kèm các fallback diện rộng và Tailscale Serve) có khác với khám phá dựa trên `dns-sd` của Node CLI hay không.
</Tip>

## Hệ thống kết nối từ xa (đường hầm SSH)

Khi ứng dụng macOS chạy ở chế độ **Từ xa**, ứng dụng mở một đường hầm SSH để các
thành phần UI cục bộ có thể nói chuyện với Gateway từ xa như thể Gateway đó ở localhost.

### Đường hầm điều khiển (cổng WebSocket của Gateway)

- **Mục đích:** kiểm tra tình trạng, trạng thái, Web Chat, cấu hình, và các lệnh gọi mặt phẳng điều khiển khác.
- **Cổng cục bộ:** cổng Gateway (mặc định `18789`), luôn ổn định.
- **Cổng từ xa:** cùng cổng Gateway trên máy chủ từ xa.
- **Hành vi:** không có cổng cục bộ ngẫu nhiên; ứng dụng tái sử dụng một đường hầm khỏe mạnh hiện có
  hoặc khởi động lại nếu cần.
- **Dạng SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` với BatchMode +
  ExitOnForwardFailure + các tùy chọn keepalive.
- **Báo cáo IP:** đường hầm SSH dùng loopback, nên gateway sẽ thấy IP của Node
  là `127.0.0.1`. Dùng phương thức truyền **Trực tiếp (ws/wss)** nếu bạn muốn IP client thật
  xuất hiện (xem [truy cập từ xa macOS](/vi/platforms/mac/remote)).

Để biết các bước thiết lập, xem [truy cập từ xa macOS](/vi/platforms/mac/remote). Để biết chi tiết
giao thức, xem [giao thức Gateway](/vi/gateway/protocol).

## Tài liệu liên quan

- [Runbook Gateway](/vi/gateway)
- [Gateway (macOS)](/vi/platforms/mac/bundled-gateway)
- [Quyền macOS](/vi/platforms/mac/permissions)
- [Canvas](/vi/platforms/mac/canvas)
