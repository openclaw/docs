---
read_when:
    - Bạn đang xây dựng một ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI hoặc tiện ích mở rộng IDE giao tiếp với OpenClaw
    - Bạn đang lựa chọn giữa Gateway RPC và SDK Plugin
    - Bạn đang tích hợp với các lượt chạy tác nhân, phiên, sự kiện, phê duyệt, mô hình hoặc công cụ của Gateway
    - Bạn đang ghép nối một trình điều khiển lưu trữ với một bộ lập lịch đánh thức bên ngoài
sidebarTitle: External apps
summary: Lộ trình tích hợp hiện tại cho các ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
title: Các tích hợp Gateway cho ứng dụng bên ngoài
x-i18n:
    generated_at: "2026-07-20T14:38:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 276c6f4173197683a60770327e131e6ab2fa4d33f416ba96c170539df7246f83
    source_path: gateway/external-apps.md
    workflow: 16
---

Các ứng dụng bên ngoài giao tiếp với OpenClaw thông qua giao thức Gateway: phương thức truyền tải WebSocket
cùng các phương thức RPC. Sử dụng giao thức này khi một tập lệnh, bảng điều khiển, tác vụ CI, tiện ích mở rộng IDE
hoặc một tiến trình khác muốn bắt đầu các lượt chạy agent, truyền phát sự kiện, chờ
kết quả, hủy công việc hoặc kiểm tra tài nguyên Gateway.

<Note>
  Đối với các gói npm, ghép nối thiết bị, khôi phục kết nối lại, lịch sử, đăng ký theo dõi
  và phê duyệt, hãy bắt đầu với
  [Xây dựng ứng dụng khách Gateway](https://docs.openclaw.ai/gateway/clients). Nếu
  ứng dụng giám sát Gateway dưới dạng tiến trình con, hãy đọc thêm
  [Nhúng OpenClaw](https://docs.openclaw.ai/gateway/embedding). Trong đợt
  triển khai gói ban đầu, npm có thể trả về `E404` cho đến khi bản phát hành
  OpenClaw đầu tiên chứa gói được xuất bản.
</Note>

<Note>
  Trang này dành cho mã nằm ngoài tiến trình OpenClaw. Mã Plugin chạy
  bên trong OpenClaw nên sử dụng các đường dẫn con `openclaw/plugin-sdk/*` đã được tài liệu hóa.
</Note>

## Những gì hiện có

| Bề mặt                                                           | Trạng thái       | Mục đích sử dụng                                                                              |
| ---------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| [Hướng dẫn ứng dụng khách Gateway](https://docs.openclaw.ai/gateway/clients) | Chu kỳ phát hành | Gói npm, xác thực, kết nối lại, lịch sử, sự kiện, phê duyệt và chính sách phiên bản.           |
| [Hướng dẫn nhúng](https://docs.openclaw.ai/gateway/embedding)     | Chu kỳ phát hành | Môi trường tiến trình con, trạng thái sẵn sàng, vòng đời, khôi phục, quyền sở hữu RPC và đóng gói. |
| [Giao thức Gateway](/vi/gateway/protocol)                            | Sẵn sàng         | Phương thức truyền tải WebSocket, quy trình bắt tay kết nối, phạm vi xác thực, quản lý phiên bản giao thức và sự kiện. |
| [Tham chiếu RPC Gateway](/vi/reference/rpc)                          | Sẵn sàng         | Các phương thức Gateway hiện tại dành cho agent, phiên, tác vụ, mô hình, công cụ, hiện vật và phê duyệt. |
| [`openclaw agent`](/vi/cli/agent)                                 | Sẵn sàng         | Tích hợp tập lệnh một lần khi gọi CLI qua shell là đủ.                                        |
| [`openclaw message`](/vi/cli/message)                               | Sẵn sàng         | Gửi tin nhắn hoặc thao tác kênh từ tập lệnh.                                                  |

## Quy trình đề xuất

1. Chạy hoặc khám phá một Gateway.
2. Kết nối qua [giao thức Gateway](/vi/gateway/protocol).
3. Gọi các phương thức RPC đã được tài liệu hóa trong [tham chiếu RPC Gateway](/vi/reference/rpc).
4. Cố định phiên bản OpenClaw mà bạn kiểm thử.
5. Kiểm tra lại tham chiếu RPC khi nâng cấp OpenClaw.

Đối với các lượt chạy agent, hãy bắt đầu bằng RPC `agent` và kết hợp với `agent.wait` để nhận
kết quả cuối cùng. Đối với trạng thái hội thoại bền vững, hãy sử dụng các phương thức `sessions.*`.
Đối với tích hợp giao diện người dùng, hãy đăng ký theo dõi các sự kiện Gateway và chỉ kết xuất những
họ sự kiện mà ứng dụng hiểu.

## Tạm ngưng máy chủ theo cơ chế phối hợp

Các bộ điều khiển lưu trữ đóng băng hoặc chụp nhanh một tiến trình đang chạy có thể sử dụng
quy trình bắt tay tạm ngưng trung lập với máy chủ:

1. Dừng tiếp nhận lưu lượng vào bên ngoài do máy chủ kiểm soát.
2. Gọi `gateway.suspend.prepare` với một `requestId` ổn định và duy nhất.
3. Nếu phản hồi là `busy`, hãy tiếp tục chạy tiến trình và thử lại sau.
4. Nếu là `ready`, hãy lưu `suspensionId` được trả về, sau đó đóng băng hoặc chụp nhanh
   tiến trình trước `expiresAtMs`.
5. Sau khi rã đông hoặc nếu hủy việc tạm ngưng, hãy gọi `gateway.suspend.resume`
   với `suspensionId` đó qua WebSocket hiện có hoặc đường dẫn điều khiển Admin HTTP.

Gateway đã chuẩn bị sẽ từ chối các quy trình bắt tay WebSocket mới. Bộ điều khiển WebSocket
phải duy trì kết nối đã xác thực trong suốt thao tác của máy chủ. Nếu không thể
đảm bảo điều đó, hãy bật và sử dụng
[Plugin RPC Admin HTTP](/vi/plugins/admin-http-rpc) trước khi chuẩn bị. Nếu mất
đường dẫn điều khiển, hãy chờ thời hạn thuê hai phút hết hạn trước khi
kết nối lại; khi hết hạn, việc tiếp nhận sẽ tự động mở lại.

Hợp đồng RPC là:

- `gateway.suspend.prepare` — `operator.admin`; tham số
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; tham số
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; tham số
  `{ "suspensionId": "id-from-prepare" }`

ID được cắt bỏ khoảng trắng ở đầu và cuối, phải chứa một ký tự không phải khoảng trắng và bị giới hạn ở
128 ký tự. Kết quả chuẩn bị bận có `status: "busy"`, `reason`,
`retryAfterMs`, `activeCount` và `blockers`. Kết quả sẵn sàng có dạng sau:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Trạng thái trả về `{"status":"running"}` hoặc một kết quả sẵn sàng có `expiresAtMs`.
Tiếp tục hoạt động trả về `{"ok":true,"status":"running","resumed":true}`; lặp lại thao tác này
sau khi tiếp tục thành công sẽ trả về `resumed: false`.

ID yêu cầu cạnh tranh hoặc lỗi tạm thời khi tiếp tục bộ lập lịch sẽ trả về lỗi có thể thử lại
`UNAVAILABLE` với `retryAfterMs`. Trong quá trình khôi phục bộ lập lịch, thao tác chuẩn bị, trạng thái
và tiếp tục đều trả về lỗi đó, Gateway vẫn ở trạng thái chưa sẵn sàng và
từ chối khi có lỗi, đồng thời máy chủ không được đóng băng hoặc chụp nhanh Gateway. OpenClaw tự động thử lại
bộ lập lịch và chỉ mở lại việc tiếp nhận sau khi khôi phục thành công. ID tiếp tục không khớp
trả về `INVALID_REQUEST`. Thao tác chuẩn bị dùng chung ngân sách ghi trên mặt phẳng điều khiển của Gateway
là ba lần thử mỗi phút; hãy tuân thủ độ trễ thử lại được trả về. Các ứng dụng khách WebSocket được phân nhóm
theo thiết bị và IP. Các bộ điều khiển Admin HTTP được phân nhóm theo IP ứng dụng khách đã phân giải,
vì vậy các bộ điều khiển phía sau cùng một proxy có thể dùng chung ngân sách.

Việc chuẩn bị chỉ có thể từ chối: OpenClaw đóng việc tiếp nhận root/phiên/lệnh mới,
tạm dừng các nhịp cron tự động và kiểm tra công việc một cách đồng bộ. Nếu có bất kỳ công việc nào
đang hoạt động, OpenClaw tiếp tục bộ lập lịch và mở lại việc tiếp nhận trước khi trả về
`busy`; OpenClaw không ngắt hoặc chờ công việc đó hoàn tất. Thời hạn thuê sẵn sàng kéo dài hai
phút. Lặp lại `prepare` với cùng `requestId` sẽ gia hạn thời hạn; khi hết hạn, bộ lập lịch
được tiếp tục trước khi việc tiếp nhận mở lại.
Yêu cầu khởi động lại đến hạn trong thời hạn thuê sẵn sàng sẽ chờ đến khi thời hạn thuê
được tiếp tục; một lần khởi động lại đang diễn ra khiến thao tác chuẩn bị trả về `busy`.

Trong khi sẵn sàng, `/healthz` vẫn hoạt động và `/readyz` trả về `503`. Các phản hồi
về trạng thái sẵn sàng cục bộ hoặc đã xác thực bao gồm `gateway-draining`; các phép thăm dò từ xa
chưa xác thực chỉ nhận được `{ "ready": false }`. Phép thăm dò tình trạng HTTP,
các phương thức tạm ngưng trên kết nối WebSocket hiện có và tuyến RPC Admin HTTP đã được bật
vẫn khả dụng. Các RPC khác trả về lỗi có thể thử lại
`UNAVAILABLE`. Các tuyến HTTP tích hợp dành cho công việc người dùng và các tuyến HTTP Plugin thông thường,
bao gồm API tương thích với OpenAI, thao tác công cụ/phiên, theo dõi node và
hook đã cấu hình, trả về `503` với `error.code: "gateway_unavailable"`. Các lần nâng cấp
WebSocket mới do Plugin sở hữu cũng trả về `503`; điều này áp dụng cho quyền sở hữu thao tác nâng cấp,
không áp dụng cho công việc được thực hiện sau đó qua socket Plugin đã được thiết lập.

Quy trình bắt tay này không lưu bền vững các tin nhắn đến, dừng phương thức truyền tải kênh
của bên thứ ba hoặc kiểm soát nền tảng lưu trữ. Máy chủ phải chặn lưu lượng vào
trước khi chuẩn bị và vẫn chịu trách nhiệm đánh thức, chụp nhanh/đóng băng và
dừng. `activeCount` là tổng số công việc được theo dõi, còn `blockers`
chứa số lượng danh mục khác 0 và chi tiết tác vụ có giới hạn. Đây không phải là
rào chắn trạng thái tĩnh chung cho tiến trình. Bộ chặn `background-exec` chỉ ở dạng tổng hợp:
văn bản lệnh, ID tiến trình, đầu ra và mã định danh phiên hoặc phạm vi không bao giờ
được truyền qua giao thức. Tình trạng kênh, bảo trì, làm mới bộ nhớ đệm, các phiên
WebSocket Plugin đã thiết lập và công việc nền do Plugin sở hữu nhưng chưa đăng ký
có thể vẫn hoạt động.
Nền tảng lưu trữ phải đóng băng hoặc chụp nhanh toàn bộ cây tiến trình và hệ thống tệp của nó
một cách nhất quán; hợp đồng đầu tiên này không thể chứng minh công việc chưa đăng ký đang ở trạng thái nhàn rỗi.

<Tip>
  Đối với việc lập lịch đánh thức máy chủ, hãy giữ phần hướng đến OpenClaw trong một
  Plugin nội bộ tiến trình và chiếu các ảnh chụp nhanh đầy đủ có tính lũy đẳng sang bộ điều hợp máy chủ bên ngoài.
  Bộ điều khiển lưu trữ không nên nhập Plugin SDK hoặc tái tạo trạng thái cron
  từ các phần thay đổi của sự kiện. Xem [Chiếu cron bên ngoài an toàn
  ](/vi/plugins/hooks#safe-external-cron-projection).
</Tip>

## Mã ứng dụng và mã Plugin

Sử dụng RPC Gateway khi mã nằm ngoài OpenClaw:

- Các tập lệnh Node bắt đầu hoặc quan sát lượt chạy agent
- Các tác vụ CI gọi Gateway
- Bảng điều khiển và bảng quản trị
- Tiện ích mở rộng IDE
- Cầu nối bên ngoài không cần trở thành Plugin kênh
- Kiểm thử tích hợp với phương thức truyền tải Gateway giả lập hoặc thực

Sử dụng Plugin SDK khi mã chạy bên trong OpenClaw:

- Plugin nhà cung cấp
- Plugin kênh
- Hook công cụ hoặc vòng đời
- Plugin bộ khung agent
- Trình trợ giúp thời gian chạy đáng tin cậy

Các ứng dụng bên ngoài không nên nhập `openclaw/plugin-sdk/*`; các đường dẫn con đó dành cho
Plugin do OpenClaw tải.

## Liên quan

- [Xây dựng ứng dụng khách Gateway](https://docs.openclaw.ai/gateway/clients)
- [Nhúng OpenClaw](https://docs.openclaw.ai/gateway/embedding)
- [Giao thức Gateway](/vi/gateway/protocol)
- [Tham chiếu RPC Gateway](/vi/reference/rpc)
- [Lệnh agent CLI](/vi/cli/agent)
- [Lệnh tin nhắn CLI](/vi/cli/message)
- [Vòng lặp agent](/vi/concepts/agent-loop)
- [Môi trường thời gian chạy agent](/vi/concepts/agent-runtimes)
- [Phiên](/vi/concepts/session)
- [Tác vụ nền](/vi/automation/tasks)
- [Agent ACP](/vi/tools/acp-agents)
- [Tổng quan Plugin SDK](/vi/plugins/sdk-overview)
