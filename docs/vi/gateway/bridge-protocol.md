---
read_when:
    - Xây dựng hoặc gỡ lỗi các ứng dụng khách Node (chế độ Node trên iOS/Android/macOS)
    - Điều tra lỗi xác thực khi ghép nối hoặc xác thực cầu nối
    - Kiểm tra bề mặt Node được Gateway công khai
summary: 'Giao thức cầu nối lịch sử (các nút kế thừa): TCP JSONL, ghép cặp, RPC có phạm vi'
title: Giao thức cầu nối
x-i18n:
    generated_at: "2026-05-07T13:16:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc906ca3a8a4ebef9b39c53187bcb4d06b287875b8e8748a168812f9a52e6152
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Cầu nối TCP đã bị **gỡ bỏ**. Các bản dựng OpenClaw hiện tại không phát hành trình lắng nghe cầu nối và các khóa cấu hình `bridge.*` không còn nằm trong schema. Trang này chỉ được giữ lại để tham khảo lịch sử. Sử dụng [Gateway Protocol](/vi/gateway/protocol) cho tất cả các máy khách node/operator.
</Warning>

## Vì sao nó từng tồn tại

- **Ranh giới bảo mật**: cầu nối chỉ mở một danh sách cho phép nhỏ thay vì
  toàn bộ bề mặt API Gateway.
- **Ghép nối + danh tính node**: việc tiếp nhận node do Gateway sở hữu và được gắn
  với token theo từng node.
- **UX khám phá**: các node có thể khám phá Gateway qua Bonjour trên LAN, hoặc kết nối
  trực tiếp qua tailnet.
- **Loopback WS**: mặt phẳng điều khiển WS đầy đủ vẫn ở local trừ khi được tạo đường hầm qua SSH.

## Truyền tải

- TCP, mỗi dòng một đối tượng JSON (JSONL).
- TLS tùy chọn (khi `bridge.tls.enabled` là true).
- Cổng lắng nghe mặc định trước đây là `18790` (các bản dựng hiện tại không khởi động
  cầu nối TCP).

Khi TLS được bật, các bản ghi TXT khám phá bao gồm `bridgeTls=1` cùng với
`bridgeTlsSha256` như một gợi ý không bí mật. Lưu ý rằng các bản ghi TXT Bonjour/mDNS
không được xác thực; máy khách không được xem fingerprint được quảng bá là một
pin có thẩm quyền nếu không có chủ ý rõ ràng của người dùng hoặc xác minh ngoài băng tần khác.

## Bắt tay + ghép nối

1. Máy khách gửi `hello` kèm metadata node + token (nếu đã ghép nối).
2. Nếu chưa ghép nối, Gateway trả lời `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Máy khách gửi `pair-request`.
4. Gateway chờ phê duyệt, sau đó gửi `pair-ok` và `hello-ok`.

Trước đây, `hello-ok` trả về `serverName`; các bề mặt Plugin được lưu trữ hiện nay
được quảng bá qua `pluginSurfaceUrls`. Canvas/A2UI sử dụng
`pluginSurfaceUrls.canvas`; bí danh `canvasHostUrl` đã ngừng dùng không thuộc
giao thức đã tái cấu trúc.

## Khung

Máy khách → Gateway:

- `req` / `res`: RPC Gateway có phạm vi (chat, phiên, cấu hình, sức khỏe, voicewake, skills.bins)
- `event`: tín hiệu node (bản ghi giọng nói, yêu cầu agent, đăng ký chat, vòng đời exec)

Gateway → Máy khách:

- `invoke` / `invoke-res`: lệnh node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: cập nhật chat cho các phiên đã đăng ký
- `ping` / `pong`: keepalive

Việc thực thi danh sách cho phép legacy từng nằm trong `src/gateway/server-bridge.ts` (đã gỡ bỏ).

## Sự kiện vòng đời exec

Các node có thể phát sự kiện `exec.finished` hoặc `exec.denied` để hiển thị hoạt động system.run.
Các sự kiện này được ánh xạ thành sự kiện hệ thống trong Gateway. (Các node legacy vẫn có thể phát `exec.started`.)

Trường payload (tất cả đều tùy chọn trừ khi có ghi chú):

- `sessionKey` (bắt buộc): phiên agent sẽ nhận sự kiện hệ thống.
- `runId`: id exec duy nhất để gom nhóm.
- `command`: chuỗi lệnh thô hoặc đã định dạng.
- `exitCode`, `timedOut`, `success`, `output`: chi tiết hoàn tất (chỉ với finished).
- `reason`: lý do từ chối (chỉ với denied).

## Cách dùng tailnet trước đây

- Gắn cầu nối vào một IP tailnet: `bridge.bind: "tailnet"` trong
  `~/.openclaw/openclaw.json` (chỉ là lịch sử; `bridge.*` không còn hợp lệ).
- Máy khách kết nối qua tên MagicDNS hoặc IP tailnet.
- Bonjour **không** đi xuyên mạng; dùng host/port thủ công hoặc wide-area DNS-SD
  khi cần.

## Phiên bản hóa

Cầu nối là **v1 ngầm định** (không thương lượng min/max). Phần này chỉ để
tham khảo lịch sử; các máy khách node/operator hiện tại sử dụng WebSocket
[Gateway Protocol](/vi/gateway/protocol).

## Liên quan

- [Gateway protocol](/vi/gateway/protocol)
- [Nodes](/vi/nodes)
