---
read_when:
    - Xây dựng hoặc gỡ lỗi các máy khách Node (chế độ Node trên iOS/Android/macOS)
    - Điều tra lỗi ghép nối hoặc xác thực cầu nối
    - Rà soát bề mặt Node do Gateway phơi bày
summary: 'Giao thức cầu nối lịch sử (nút cũ): TCP JSONL, ghép đôi, RPC có phạm vi'
title: Giao thức cầu nối
x-i18n:
    generated_at: "2026-05-06T17:55:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: f84c4b5c344d880d4283eebd8596e8b5b0aad5cae747694784011deb1547db30
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Cầu nối TCP đã bị **gỡ bỏ**. Các bản dựng OpenClaw hiện tại không phân phối trình lắng nghe cầu nối và các khóa cấu hình `bridge.*` không còn nằm trong schema. Trang này chỉ được giữ lại để tham khảo lịch sử. Hãy dùng [Giao thức Gateway](/vi/gateway/protocol) cho tất cả máy khách node/người vận hành.
</Warning>

## Vì sao nó từng tồn tại

- **Ranh giới bảo mật**: cầu nối chỉ phơi bày một danh sách cho phép nhỏ thay vì
  toàn bộ bề mặt API Gateway.
- **Ghép đôi + danh tính node**: việc tiếp nhận node do Gateway sở hữu và gắn
  với một token riêng cho từng node.
- **Trải nghiệm khám phá**: node có thể khám phá Gateway qua Bonjour trên LAN, hoặc kết nối
  trực tiếp qua tailnet.
- **Loopback WS**: mặt phẳng điều khiển WS đầy đủ vẫn ở local loopback trừ khi được tạo đường hầm qua SSH.

## Truyền tải

- TCP, mỗi dòng một đối tượng JSON (JSONL).
- TLS tùy chọn (khi `bridge.tls.enabled` là true).
- Cổng lắng nghe mặc định trong lịch sử là `18790` (các bản dựng hiện tại không khởi động
  cầu nối TCP).

Khi bật TLS, bản ghi TXT khám phá bao gồm `bridgeTls=1` cùng với
`bridgeTlsSha256` như một gợi ý không bí mật. Lưu ý rằng bản ghi TXT Bonjour/mDNS
không được xác thực; máy khách không được xem fingerprint được quảng bá là một
pin có thẩm quyền nếu không có chủ đích rõ ràng của người dùng hoặc xác minh ngoài băng khác.

## Bắt tay + ghép đôi

1. Máy khách gửi `hello` với siêu dữ liệu node + token (nếu đã ghép đôi).
2. Nếu chưa ghép đôi, Gateway trả lời `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Máy khách gửi `pair-request`.
4. Gateway chờ phê duyệt, rồi gửi `pair-ok` và `hello-ok`.

Trong lịch sử, `hello-ok` trả về `serverName` và có thể bao gồm
`canvasHostUrl`.

## Khung

Máy khách → Gateway:

- `req` / `res`: RPC Gateway có phạm vi (chat, sessions, config, health, voicewake, skills.bins)
- `event`: tín hiệu node (bản ghi giọng nói, yêu cầu agent, đăng ký theo dõi chat, vòng đời exec)

Gateway → Máy khách:

- `invoke` / `invoke-res`: lệnh node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: cập nhật chat cho các phiên đã đăng ký theo dõi
- `ping` / `pong`: duy trì kết nối

Việc thực thi danh sách cho phép cũ từng nằm trong `src/gateway/server-bridge.ts` (đã gỡ bỏ).

## Sự kiện vòng đời exec

Node có thể phát sự kiện `exec.finished` hoặc `exec.denied` để hiển thị hoạt động system.run.
Các sự kiện này được ánh xạ thành sự kiện hệ thống trong Gateway. (Node cũ vẫn có thể phát `exec.started`.)

Trường payload (tất cả đều là tùy chọn trừ khi được nêu rõ):

- `sessionKey` (bắt buộc): phiên agent sẽ nhận sự kiện hệ thống.
- `runId`: id exec duy nhất để nhóm.
- `command`: chuỗi lệnh thô hoặc đã định dạng.
- `exitCode`, `timedOut`, `success`, `output`: chi tiết hoàn tất (chỉ finished).
- `reason`: lý do từ chối (chỉ denied).

## Cách dùng tailnet trong lịch sử

- Liên kết cầu nối với IP tailnet: `bridge.bind: "tailnet"` trong
  `~/.openclaw/openclaw.json` (chỉ trong lịch sử; `bridge.*` không còn hợp lệ).
- Máy khách kết nối qua tên MagicDNS hoặc IP tailnet.
- Bonjour **không** đi xuyên mạng; dùng host/cổng thủ công hoặc DNS-SD diện rộng
  khi cần.

## Phiên bản hóa

Cầu nối từng là **v1 ngầm định** (không thương lượng min/max). Phần này
chỉ là tài liệu tham khảo lịch sử; máy khách node/người vận hành hiện tại dùng WebSocket
[Giao thức Gateway](/vi/gateway/protocol).

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
- [Node](/vi/nodes)
