---
read_when:
    - Điều tra mã máy khách Node cũ hoặc nhật ký ghép nối đã lưu trữ
    - Kiểm tra những gì giao diện node cũ từng cung cấp
summary: 'Giao thức cầu nối trước đây (các node cũ): TCP JSONL, ghép nối, RPC theo phạm vi'
title: Giao thức cầu nối
x-i18n:
    generated_at: "2026-07-12T07:56:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e8b69c59f2170439f0e7b139bf5bbdb429d7c9d8dde7b36cd64aab63939c95d
    source_path: gateway/bridge-protocol.md
    workflow: 16
---

<Warning>
Cầu nối TCP đã bị **loại bỏ**. Các bản dựng OpenClaw hiện tại không cung cấp trình lắng nghe cầu nối và các khóa cấu hình `bridge.*` không còn trong lược đồ. Trang này chỉ dùng làm tài liệu tham khảo lịch sử. Hãy sử dụng [giao thức Gateway](/vi/gateway/protocol) cho tất cả máy khách Node/người vận hành.
</Warning>

## Lý do từng tồn tại

- **Ranh giới bảo mật**: chỉ cung cấp một danh sách cho phép nhỏ thay vì toàn bộ bề mặt API của Gateway.
- **Ghép cặp + danh tính Node**: việc tiếp nhận Node do Gateway quản lý và gắn với token riêng cho từng Node.
- **Trải nghiệm khám phá**: các Node có thể khám phá Gateway qua Bonjour trên mạng LAN hoặc kết nối trực tiếp qua tailnet.
- **WebSocket local loopback**: toàn bộ mặt phẳng điều khiển WebSocket được giữ cục bộ, trừ khi được tạo đường hầm qua SSH.

## Truyền tải

- TCP, mỗi dòng một đối tượng JSON (JSONL).
- TLS tùy chọn (`bridge.tls.enabled: true`).
- Cổng lắng nghe mặc định là `18790`.

Khi TLS được bật, các bản ghi TXT khám phá bao gồm `bridgeTls=1` cùng với `bridgeTlsSha256` làm gợi ý không bí mật. Các bản ghi TXT Bonjour/mDNS không được xác thực; máy khách không thể coi dấu vân tay được quảng bá là mã ghim có thẩm quyền nếu không có phương thức xác minh ngoài băng khác.

## Bắt tay và ghép cặp

1. Máy khách gửi `hello` kèm siêu dữ liệu Node và token (nếu đã ghép cặp).
2. Nếu chưa ghép cặp, Gateway phản hồi `error` (`NOT_PAIRED` / `UNAUTHORIZED`).
3. Máy khách gửi `pair-request`.
4. Gateway chờ phê duyệt, sau đó gửi `pair-ok` và `hello-ok`.

Trước đây, `hello-ok` trả về `serverName`; các bề mặt Plugin được lưu trữ hiện được quảng bá qua `pluginSurfaceUrls` trên giao thức Gateway hiện tại (Canvas/A2UI sử dụng `pluginSurfaceUrls.canvas`).

## Khung

Từ máy khách đến Gateway:

- `req` / `res`: RPC Gateway có phạm vi giới hạn (trò chuyện, phiên, cấu hình, tình trạng, đánh thức bằng giọng nói, skills.bins).
- `event`: tín hiệu Node (bản chép lời giọng nói, yêu cầu tác tử, đăng ký nhận trò chuyện, vòng đời thực thi).

Từ Gateway đến máy khách:

- `invoke` / `invoke-res`: lệnh Node (`canvas.*`, `camera.*`, `screen.record`, `location.get`, `sms.send`).
- `event`: cập nhật trò chuyện cho các phiên đã đăng ký.
- `ping` / `pong`: duy trì kết nối.

Việc thực thi danh sách cho phép từng nằm trong `src/gateway/server-bridge.ts` (đã loại bỏ).

## Sự kiện vòng đời thực thi

Các Node phát `exec.finished` để hiển thị hoạt động `system.run` đã hoàn tất, được Gateway ánh xạ thành sự kiện hệ thống (các Node cũ cũng có thể phát `exec.started`). `exec.denied` đánh dấu một lần thử `system.run` bị từ chối là trạng thái từ chối kết thúc mà không xếp hàng sự kiện hệ thống hoặc đánh thức công việc của tác tử.

Các trường dữ liệu tải (tất cả đều tùy chọn trừ khi có ghi chú):

| Trường                           | Ghi chú                                                                                                     |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `sessionKey`                     | Bắt buộc. Phiên tác tử để tương quan sự kiện và, đối với `exec.finished`, chuyển phát sự kiện hệ thống.     |
| `runId`                          | Mã định danh thực thi duy nhất để nhóm.                                                                     |
| `command`                        | Chuỗi lệnh thô hoặc đã định dạng.                                                                           |
| `exitCode`, `timedOut`, `output` | Chi tiết hoàn tất (chỉ khi đã hoàn tất).                                                                    |
| `reason`                         | Lý do từ chối (chỉ khi bị từ chối).                                                                         |

## Cách sử dụng tailnet trước đây

- Liên kết cầu nối với một địa chỉ IP tailnet: `bridge.bind: "tailnet"` trong `~/.openclaw/openclaw.json` (chỉ mang tính lịch sử; `bridge.*` không còn là cấu hình hợp lệ).
- Máy khách kết nối qua tên MagicDNS hoặc địa chỉ IP tailnet.
- Bonjour không hoạt động xuyên mạng; nếu không, cần DNS-SD diện rộng hoặc máy chủ/cổng được chỉ định thủ công.

## Quản lý phiên bản

Cầu nối ngầm định là phiên bản 1, không có thương lượng phiên bản tối thiểu/tối đa. Các máy khách Node/người vận hành hiện tại sử dụng [giao thức Gateway](/vi/gateway/protocol) WebSocket, có thương lượng phạm vi phiên bản giao thức.

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
- [Các Node](/vi/nodes)
