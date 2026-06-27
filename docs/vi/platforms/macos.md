---
read_when:
    - Triển khai các tính năng ứng dụng macOS
    - Thay đổi vòng đời gateway hoặc cầu nối node trên macOS
summary: Ứng dụng đồng hành macOS của OpenClaw (thanh menu + bộ môi giới Gateway)
title: ứng dụng macOS
x-i18n:
    generated_at: "2026-06-27T17:42:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

Ứng dụng macOS là **ứng dụng đồng hành trên thanh menu** cho OpenClaw. Ứng dụng này sở hữu quyền,
quản lý/kết nối cục bộ với Gateway (launchd hoặc thủ công), và cung cấp các
năng lực macOS cho agent dưới dạng một Node.

## Chức năng

- Hiển thị thông báo gốc và trạng thái trên thanh menu.
- Sở hữu các lời nhắc TCC (Thông báo, Trợ năng, Ghi màn hình, Microphone,
  Nhận dạng giọng nói, Tự động hóa/AppleScript).
- Chạy hoặc kết nối tới Gateway (cục bộ hoặc từ xa).
- Cung cấp các công cụ chỉ có trên macOS (Canvas, Camera, Screen Recording, `system.run`).
- Khởi động dịch vụ máy chủ Node cục bộ ở chế độ **từ xa** (launchd), và dừng dịch vụ đó ở chế độ **cục bộ**.
- Tùy chọn lưu trữ **PeekabooBridge** cho tự động hóa UI.
- Cài đặt CLI toàn cục (`openclaw`) theo yêu cầu qua npm, pnpm, hoặc bun (ứng dụng ưu tiên npm, sau đó pnpm, rồi bun; Node vẫn là runtime Gateway được khuyến nghị).

## Chế độ cục bộ và từ xa

- **Cục bộ** (mặc định): ứng dụng kết nối với Gateway cục bộ đang chạy nếu có;
  nếu không, ứng dụng bật dịch vụ launchd qua `openclaw gateway install`.
- **Từ xa**: ứng dụng kết nối tới Gateway qua SSH/Tailscale và không bao giờ khởi động
  một tiến trình cục bộ.
  Ứng dụng khởi động **dịch vụ máy chủ Node** cục bộ để Gateway từ xa có thể truy cập máy Mac này.
  Ứng dụng không sinh Gateway làm tiến trình con.
  Việc khám phá Gateway hiện ưu tiên tên Tailscale MagicDNS hơn IP tailnet thô,
  nên ứng dụng Mac khôi phục đáng tin cậy hơn khi IP tailnet thay đổi.

## Điều khiển launchd

Ứng dụng quản lý LaunchAgent theo người dùng có nhãn `ai.openclaw.gateway`
(hoặc `ai.openclaw.<profile>` khi dùng `--profile`/`OPENCLAW_PROFILE`; `com.openclaw.*` cũ vẫn được unload).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Thay nhãn bằng `ai.openclaw.<profile>` khi chạy một profile có tên.

Nếu LaunchAgent chưa được cài đặt, hãy bật nó từ ứng dụng hoặc chạy
`openclaw gateway install`.

Nếu Gateway liên tục biến mất trong vài phút đến vài giờ và chỉ tiếp tục khi bạn chạm vào Control UI hoặc SSH vào máy chủ, hãy xem ghi chú khắc phục sự cố về macOS Maintenance Sleep / sự cố `ENETDOWN` và cổng bảo vệ respawn của launchd trong [Khắc phục sự cố Gateway](/vi/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## Năng lực Node (Mac)

Ứng dụng macOS tự trình diện như một Node. Các lệnh thường dùng:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Screen: `screen.snapshot`, `screen.record`
- System: `system.run`, `system.notify`

Node báo cáo một bản đồ `permissions` để agent có thể quyết định điều gì được phép.

Dịch vụ Node + IPC ứng dụng:

- Khi dịch vụ máy chủ Node không giao diện đang chạy (chế độ từ xa), nó kết nối tới Gateway WS như một Node.
- `system.run` thực thi trong ứng dụng macOS (ngữ cảnh UI/TCC) qua một socket Unix cục bộ; lời nhắc + đầu ra vẫn nằm trong ứng dụng.

Sơ đồ (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Phê duyệt thực thi (system.run)

`system.run` được điều khiển bởi **Phê duyệt thực thi** trong ứng dụng macOS (Cài đặt → Phê duyệt thực thi).
Bảo mật + hỏi + allowlist được lưu cục bộ trên máy Mac trong:

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
- Văn bản lệnh shell thô có chứa cú pháp điều khiển hoặc mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được coi là trượt allowlist và yêu cầu phê duyệt rõ ràng (hoặc allowlist nhị phân shell).
- Chọn "Luôn cho phép" trong lời nhắc sẽ thêm lệnh đó vào allowlist.
- Ghi đè môi trường của `system.run` được lọc (loại bỏ `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) rồi được hợp nhất với môi trường của ứng dụng.
- Với các shell wrapper (`bash|sh|zsh ... -c/-lc`), ghi đè môi trường theo phạm vi yêu cầu được rút gọn còn một allowlist nhỏ rõ ràng (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Với quyết định luôn cho phép trong chế độ allowlist, các wrapper điều phối đã biết (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn thực thi bên trong thay vì đường dẫn wrapper. Nếu việc gỡ wrapper không an toàn, không có mục allowlist nào được lưu tự động.

## Deep link

Ứng dụng đăng ký lược đồ URL `openclaw://` cho các hành động cục bộ.

### `openclaw://agent`

Kích hoạt một yêu cầu `agent` của Gateway.
__OC_I18N_900004__
Tham số truy vấn:

- `message` (bắt buộc)
- `sessionKey` (tùy chọn)
- `thinking` (tùy chọn)
- `deliver` / `to` / `channel` (tùy chọn)
- `timeoutSeconds` (tùy chọn)
- `key` (khóa chế độ không giám sát tùy chọn)

An toàn:

- Không có `key`, ứng dụng sẽ nhắc xác nhận.
- Không có `key`, ứng dụng áp dụng giới hạn tin nhắn ngắn cho lời nhắc xác nhận và bỏ qua `deliver` / `to` / `channel`.
- Với `key` hợp lệ, lần chạy sẽ không cần giám sát (dành cho tự động hóa cá nhân).

## Luồng thiết lập ban đầu (điển hình)

1. Cài đặt và khởi chạy **OpenClaw.app**.
2. Hoàn tất danh sách kiểm tra quyền (lời nhắc TCC).
3. Đảm bảo chế độ **Cục bộ** đang hoạt động và Gateway đang chạy.
4. Cài đặt CLI nếu bạn muốn truy cập từ terminal.

## Vị trí thư mục trạng thái (macOS)

Tránh đặt thư mục trạng thái OpenClaw của bạn trong iCloud hoặc các thư mục được đồng bộ hóa đám mây khác.
Đường dẫn có đồng bộ hóa có thể tăng độ trễ và đôi khi gây tranh chấp khóa tệp/đồng bộ hóa cho
phiên và thông tin xác thực.

Ưu tiên một đường dẫn trạng thái cục bộ không đồng bộ hóa, chẳng hạn:
__OC_I18N_900005__
Nếu `openclaw doctor` phát hiện trạng thái nằm dưới:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

nó sẽ cảnh báo và khuyến nghị chuyển lại về đường dẫn cục bộ.

## Quy trình build và phát triển (gốc)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (hoặc Xcode)
- Đóng gói ứng dụng: `scripts/package-mac-app.sh`

## Gỡ lỗi kết nối Gateway (CLI macOS)

Dùng CLI gỡ lỗi để kiểm tra cùng logic bắt tay Gateway WebSocket và khám phá
mà ứng dụng macOS dùng, không cần khởi chạy ứng dụng.
__OC_I18N_900006__
Tùy chọn kết nối:

- `--url <ws://host:port>`: ghi đè cấu hình
- `--mode <local|remote>`: phân giải từ cấu hình (mặc định: cấu hình hoặc cục bộ)
- `--probe`: buộc thăm dò sức khỏe mới
- `--timeout <ms>`: thời gian chờ yêu cầu (mặc định: `15000`)
- `--json`: đầu ra có cấu trúc để so sánh khác biệt

Tùy chọn khám phá:

- `--include-local`: bao gồm các Gateway sẽ bị lọc là "cục bộ"
- `--timeout <ms>`: cửa sổ khám phá tổng thể (mặc định: `2000`)
- `--json`: đầu ra có cấu trúc để so sánh khác biệt

<Tip>
So sánh với `openclaw gateway discover --json` để xem pipeline khám phá của ứng dụng macOS (`local.` cộng với miền diện rộng đã cấu hình, kèm fallback diện rộng và Tailscale Serve) có khác với khám phá dựa trên `dns-sd` của Node CLI hay không.
</Tip>

## Hệ thống kết nối từ xa (đường hầm SSH)

Khi ứng dụng macOS chạy ở chế độ **Từ xa**, nó mở một đường hầm SSH để các thành phần UI
cục bộ có thể giao tiếp với Gateway từ xa như thể Gateway ở trên localhost.

### Đường hầm điều khiển (cổng Gateway WebSocket)

- **Mục đích:** kiểm tra sức khỏe, trạng thái, Web Chat, cấu hình, và các lệnh gọi control-plane khác.
- **Cổng cục bộ:** cổng Gateway (mặc định `18789`), luôn ổn định.
- **Cổng từ xa:** cùng cổng Gateway trên máy chủ từ xa.
- **Hành vi:** không có cổng cục bộ ngẫu nhiên; ứng dụng tái sử dụng đường hầm khỏe mạnh hiện có
  hoặc khởi động lại nếu cần.
- **Dạng SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` với BatchMode +
  ExitOnForwardFailure + tùy chọn keepalive.
- **Báo cáo IP:** đường hầm SSH dùng loopback, nên Gateway sẽ thấy IP Node
  là `127.0.0.1`. Dùng phương thức vận chuyển **Trực tiếp (ws/wss)** nếu bạn muốn IP máy khách thật
  xuất hiện (xem [Truy cập từ xa macOS](/vi/platforms/mac/remote)).

Để biết các bước thiết lập, xem [Truy cập từ xa macOS](/vi/platforms/mac/remote). Để biết chi tiết
giao thức, xem [Giao thức Gateway](/vi/gateway/protocol).

## Tài liệu liên quan

- [Sổ tay vận hành Gateway](/vi/gateway)
- [Gateway (macOS)](/vi/platforms/mac/bundled-gateway)
- [Quyền macOS](/vi/platforms/mac/permissions)
- [Canvas](/vi/platforms/mac/canvas)
