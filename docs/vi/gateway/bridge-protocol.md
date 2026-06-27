---
read_when:
    - Xây dựng hoặc gỡ lỗi các máy khách node (chế độ node iOS/Android/macOS)
    - Đang điều tra lỗi ghép nối hoặc lỗi xác thực bridge
    - Kiểm tra bề mặt Node được Gateway phơi bày
summary: 'Giao thức cầu nối lịch sử (nút cũ): TCP JSONL, ghép cặp, RPC có phạm vi'
title: Giao thức cầu nối
x-i18n:
    generated_at: "2026-06-27T17:27:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 485d18f94b731018c6e0df493068b0b6aceff9afba6bebf1350db63c04cee98c
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Cầu nối TCP đã bị **gỡ bỏ**. Các bản dựng OpenClaw hiện tại không phát hành trình nghe cầu nối và các khóa cấu hình `bridge.*` không còn nằm trong schema. Trang này chỉ được giữ lại để tham khảo lịch sử. Hãy dùng [Giao thức Gateway](/vi/gateway/protocol) cho tất cả client nút/người vận hành.
</Warning>

## Vì sao nó từng tồn tại

- **Ranh giới bảo mật**: cầu nối phơi bày một danh sách cho phép nhỏ thay vì
  toàn bộ bề mặt API Gateway.
- **Ghép cặp + danh tính nút**: việc chấp nhận nút do Gateway sở hữu và gắn với
  token riêng cho từng nút.
- **UX khám phá**: các nút có thể khám phá Gateway qua Bonjour trên LAN, hoặc kết nối
  trực tiếp qua tailnet.
- **WS vòng lặp cục bộ**: mặt phẳng điều khiển WS đầy đủ vẫn ở cục bộ trừ khi được tạo đường hầm qua SSH.

## Truyền tải

- TCP, mỗi dòng một đối tượng JSON (JSONL).
- TLS tùy chọn (khi `bridge.tls.enabled` là true).
- Cổng trình nghe mặc định trước đây là `18790` (các bản dựng hiện tại không khởi động
  cầu nối TCP).

Khi TLS được bật, bản ghi TXT khám phá bao gồm `bridgeTls=1` cùng với
`bridgeTlsSha256` làm gợi ý không bí mật. Lưu ý rằng bản ghi TXT Bonjour/mDNS
không được xác thực; client không được xem vân tay được quảng bá là ghim có thẩm quyền
nếu không có chủ ý rõ ràng của người dùng hoặc cách xác minh ngoài băng khác.

## Bắt tay + ghép cặp

1. Client gửi `hello` với siêu dữ liệu nút + token (nếu đã ghép cặp).
2. Nếu chưa ghép cặp, Gateway trả lời `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Client gửi `pair-request`.
4. Gateway chờ phê duyệt, rồi gửi `pair-ok` và `hello-ok`.

Trước đây, `hello-ok` trả về `serverName`; các bề mặt plugin được lưu trữ hiện được
quảng bá qua `pluginSurfaceUrls`. Canvas/A2UI dùng
`pluginSurfaceUrls.canvas`; alias không còn dùng `canvasHostUrl` không thuộc
giao thức đã được tái cấu trúc.

## Khung

Client → Gateway:

- `req` / `res`: RPC Gateway có phạm vi (chat, sessions, config, health, voicewake, skills.bins)
- `event`: tín hiệu nút (bản chép lời giọng nói, yêu cầu agent, đăng ký chat, vòng đời exec)

Gateway → Client:

- `invoke` / `invoke-res`: lệnh nút (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: cập nhật chat cho các phiên đã đăng ký
- `ping` / `pong`: keepalive

Việc thực thi danh sách cho phép cũ từng nằm trong `src/gateway/server-bridge.ts` (đã gỡ bỏ).

## Sự kiện vòng đời exec

Các nút có thể phát sự kiện `exec.finished` để hiển thị hoạt động `system.run` đã hoàn tất.
Các sự kiện này được ánh xạ thành sự kiện hệ thống trong Gateway. (Các nút cũ vẫn có thể phát `exec.started`.)
Các nút có thể phát `exec.denied` cho các lần thử `system.run` bị từ chối; Gateway chấp nhận
sự kiện này như một từ chối kết thúc và không đưa sự kiện hệ thống vào hàng đợi hoặc đánh thức công việc agent.

Trường payload (tất cả đều tùy chọn trừ khi được ghi chú):

- `sessionKey` (bắt buộc): phiên agent để tương quan sự kiện và, đối với
  `exec.finished`, chuyển phát sự kiện hệ thống.
- `runId`: id exec duy nhất để gom nhóm.
- `command`: chuỗi lệnh thô hoặc đã định dạng.
- `exitCode`, `timedOut`, `success`, `output`: chi tiết hoàn tất (chỉ khi đã hoàn tất).
- `reason`: lý do từ chối (chỉ khi bị từ chối).

## Cách dùng tailnet trước đây

- Bind cầu nối vào IP tailnet: `bridge.bind: "tailnet"` trong
  `~/.openclaw/openclaw.json` (chỉ là lịch sử; `bridge.*` không còn hợp lệ).
- Client kết nối qua tên MagicDNS hoặc IP tailnet.
- Bonjour **không** đi qua các mạng; dùng host/cổng thủ công hoặc DNS-SD diện rộng
  khi cần.

## Phiên bản hóa

Cầu nối là **v1 ngầm định** (không đàm phán min/max). Phần này chỉ là
tham khảo lịch sử; các client nút/người vận hành hiện tại dùng WebSocket
[Giao thức Gateway](/vi/gateway/protocol).

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
- [Nút](/vi/nodes)
