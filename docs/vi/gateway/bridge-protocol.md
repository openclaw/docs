---
read_when:
    - Xây dựng hoặc gỡ lỗi các ứng dụng khách Node (chế độ Node iOS/Android/macOS)
    - Điều tra các lỗi ghép đôi hoặc xác thực cầu nối
    - Rà soát bề mặt Node được Gateway phơi bày
summary: 'Giao thức cầu nối lịch sử (các nút kế thừa): TCP JSONL, ghép đôi, RPC giới hạn phạm vi'
title: Giao thức cầu nối
x-i18n:
    generated_at: "2026-04-29T22:41:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: cb07ec4dab4394dd03b4c0002d6a842a9d77d12a1fc2f141f01d5a306fab1615
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Cầu nối TCP đã bị **loại bỏ**. Các bản dựng OpenClaw hiện tại không còn phân phối trình lắng nghe cầu nối và các khóa cấu hình `bridge.*` không còn nằm trong schema. Trang này chỉ được giữ lại để tham khảo lịch sử. Sử dụng [Giao thức Gateway](/vi/gateway/protocol) cho tất cả máy khách node/người vận hành.
</Warning>

## Vì sao nó từng tồn tại

- **Ranh giới bảo mật**: cầu nối chỉ phơi bày một allowlist nhỏ thay vì
  toàn bộ bề mặt API Gateway.
- **Ghép nối + danh tính node**: việc chấp nhận node do gateway sở hữu và được gắn
  với một token riêng cho từng node.
- **Trải nghiệm khám phá**: node có thể khám phá gateway qua Bonjour trên LAN, hoặc kết nối
  trực tiếp qua tailnet.
- **WS local loopback**: mặt phẳng điều khiển WS đầy đủ vẫn ở cục bộ trừ khi được tunnel qua SSH.

## Truyền tải

- TCP, mỗi dòng một đối tượng JSON (JSONL).
- TLS tùy chọn (khi `bridge.tls.enabled` là true).
- Cổng lắng nghe mặc định trong lịch sử là `18790` (các bản dựng hiện tại không khởi động
  cầu nối TCP).

Khi TLS được bật, các bản ghi TXT khám phá bao gồm `bridgeTls=1` cùng với
`bridgeTlsSha256` như một gợi ý không bí mật. Lưu ý rằng các bản ghi TXT Bonjour/mDNS
không được xác thực; máy khách không được xem fingerprint được quảng bá là một
pin có thẩm quyền nếu không có ý định rõ ràng của người dùng hoặc xác minh ngoài băng khác.

## Bắt tay + ghép nối

1. Máy khách gửi `hello` kèm metadata node + token (nếu đã được ghép nối).
2. Nếu chưa được ghép nối, gateway trả lời `error` (`NOT_PAIRED`/`UNAUTHORIZED`).
3. Máy khách gửi `pair-request`.
4. Gateway chờ phê duyệt, rồi gửi `pair-ok` và `hello-ok`.

Trong lịch sử, `hello-ok` trả về `serverName` và có thể bao gồm
`canvasHostUrl`.

## Frame

Máy khách → Gateway:

- `req` / `res`: RPC gateway có phạm vi (chat, phiên, cấu hình, tình trạng, voicewake, skills.bins)
- `event`: tín hiệu node (bản chép lời thoại, yêu cầu agent, đăng ký chat, vòng đời exec)

Gateway → Máy khách:

- `invoke` / `invoke-res`: lệnh node (`canvas.*`, `camera.*`, `screen.record`,
  `location.get`, `sms.send`)
- `event`: cập nhật chat cho các phiên đã đăng ký
- `ping` / `pong`: keepalive

Việc thực thi allowlist kế thừa từng nằm trong `src/gateway/server-bridge.ts` (đã bị loại bỏ).

## Sự kiện vòng đời exec

Node có thể phát sự kiện `exec.finished` hoặc `exec.denied` để hiển thị hoạt động system.run.
Các sự kiện này được ánh xạ thành sự kiện hệ thống trong gateway. (Node kế thừa vẫn có thể phát `exec.started`.)

Trường payload (tất cả đều tùy chọn trừ khi có ghi chú):

- `sessionKey` (bắt buộc): phiên agent nhận sự kiện hệ thống.
- `runId`: id exec duy nhất để nhóm.
- `command`: chuỗi lệnh thô hoặc đã định dạng.
- `exitCode`, `timedOut`, `success`, `output`: chi tiết hoàn tất (chỉ khi finished).
- `reason`: lý do từ chối (chỉ khi denied).

## Cách dùng tailnet trong lịch sử

- Bind cầu nối vào một IP tailnet: `bridge.bind: "tailnet"` trong
  `~/.openclaw/openclaw.json` (chỉ trong lịch sử; `bridge.*` không còn hợp lệ).
- Máy khách kết nối qua tên MagicDNS hoặc IP tailnet.
- Bonjour **không** đi qua các mạng; dùng host/port thủ công hoặc DNS‑SD diện rộng
  khi cần.

## Phiên bản hóa

Cầu nối là **v1 ngầm định** (không thương lượng min/max). Phần này chỉ là
tham khảo lịch sử; máy khách node/người vận hành hiện tại sử dụng WebSocket
[Giao thức Gateway](/vi/gateway/protocol).

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
- [Node](/vi/nodes)
