---
read_when:
    - Bạn đang xây dựng một ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI hoặc tiện ích mở rộng IDE giao tiếp với OpenClaw
    - Bạn đang lựa chọn giữa RPC của Gateway và SDK Plugin
    - Bạn đang tích hợp với các lượt chạy tác tử, phiên, sự kiện, phê duyệt, mô hình hoặc công cụ của Gateway
    - Bạn đang ghép nối một bộ điều khiển lưu trữ với một bộ lập lịch đánh thức bên ngoài
sidebarTitle: External apps
summary: Lộ trình tích hợp hiện tại dành cho các ứng dụng bên ngoài, tập lệnh, bảng điều khiển, tác vụ CI và tiện ích mở rộng IDE
title: Các tích hợp Gateway cho ứng dụng bên ngoài
x-i18n:
    generated_at: "2026-07-12T07:53:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Các ứng dụng bên ngoài giao tiếp với OpenClaw thông qua giao thức Gateway: phương thức truyền tải WebSocket cùng các phương thức RPC. Hãy sử dụng giao thức này khi một tập lệnh, bảng điều khiển, tác vụ CI, tiện ích mở rộng IDE hoặc tiến trình khác muốn bắt đầu lượt chạy của tác nhân, truyền phát sự kiện, chờ kết quả, hủy công việc hoặc kiểm tra tài nguyên Gateway.

<Warning>
  Hiện chưa có gói ứng dụng khách npm công khai. Không thêm tên gói ứng dụng
  khách OpenClaw làm phần phụ thuộc của ứng dụng cho đến khi ghi chú phát hành
  công bố một gói đã được phát hành và trang này có hướng dẫn cài đặt.
</Warning>

<Note>
  Trang này dành cho mã nằm ngoài tiến trình OpenClaw. Thay vào đó, mã Plugin
  chạy bên trong OpenClaw nên sử dụng các đường dẫn con `openclaw/plugin-sdk/*`
  đã được ghi trong tài liệu.
</Note>

## Những gì hiện có

| Bề mặt                                 | Trạng thái | Dùng cho                                                                                                      |
| -------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| [Giao thức Gateway](/vi/gateway/protocol) | Sẵn sàng   | Phương thức truyền tải WebSocket, quy trình bắt tay kết nối, phạm vi xác thực, lập phiên bản giao thức và sự kiện. |
| [Tham chiếu RPC Gateway](/vi/reference/rpc) | Sẵn sàng | Các phương thức Gateway hiện tại dành cho tác nhân, phiên, tác vụ, mô hình, công cụ, hiện vật và phê duyệt.   |
| [`openclaw agent`](/vi/cli/agent)         | Sẵn sàng   | Tích hợp tập lệnh dùng một lần khi gọi CLI qua shell là đủ.                                                   |
| [`openclaw message`](/vi/cli/message)     | Sẵn sàng   | Gửi tin nhắn hoặc thao tác kênh từ tập lệnh.                                                                  |

Một gói thư viện ứng dụng khách trong tương lai đang được phát triển nội bộ,
nhưng chưa phải là bề mặt cài đặt công khai. Hãy coi đây là chi tiết triển khai
xem trước cho đến khi một bản phát hành công bố gói đã phát hành và có phiên bản.

## Lộ trình đề xuất

1. Chạy hoặc khám phá một Gateway.
2. Kết nối qua [giao thức Gateway](/vi/gateway/protocol).
3. Gọi các phương thức RPC đã được ghi trong [tham chiếu RPC Gateway](/vi/reference/rpc).
4. Cố định phiên bản OpenClaw mà bạn kiểm thử.
5. Kiểm tra lại tham chiếu RPC khi nâng cấp OpenClaw.

Đối với các lượt chạy của tác nhân, hãy bắt đầu bằng RPC `agent` và kết hợp với
`agent.wait` để nhận kết quả kết thúc. Đối với trạng thái hội thoại bền vững,
hãy sử dụng các phương thức `sessions.*`. Đối với tích hợp giao diện người dùng,
hãy đăng ký nhận sự kiện Gateway và chỉ kết xuất các họ sự kiện mà ứng dụng của
bạn hiểu.

## Tạm ngưng máy chủ theo cơ chế phối hợp

Các bộ điều khiển lưu trữ đóng băng hoặc chụp nhanh một tiến trình đang chạy có
thể sử dụng quy trình bắt tay tạm ngưng trung lập với máy chủ:

1. Ngừng tiếp nhận lưu lượng vào bên ngoài do máy chủ kiểm soát.
2. Gọi `gateway.suspend.prepare` với `requestId` ổn định và duy nhất.
3. Nếu phản hồi là `busy`, tiếp tục để tiến trình chạy và thử lại sau.
4. Nếu phản hồi là `ready`, lưu `suspensionId` được trả về, sau đó đóng băng
   hoặc chụp nhanh tiến trình trước `expiresAtMs`.
5. Sau khi rã đông hoặc nếu hủy việc tạm ngưng, hãy gọi
   `gateway.suspend.resume` với `suspensionId` đó qua WebSocket hiện có hoặc
   đường điều khiển HTTP quản trị.

Gateway đã được chuẩn bị sẽ từ chối các quy trình bắt tay WebSocket mới. Bộ điều
khiển WebSocket phải duy trì kết nối đã xác thực trong suốt thao tác trên máy
chủ. Nếu không thể bảo đảm điều đó, hãy bật và sử dụng
[Plugin RPC HTTP quản trị](/vi/plugins/admin-http-rpc) trước khi chuẩn bị. Nếu mất
đường điều khiển, hãy chờ hợp đồng thuê hai phút hết hạn trước khi kết nối lại;
khi hết hạn, việc tiếp nhận sẽ tự động mở lại.

Hợp đồng RPC như sau:

- `gateway.suspend.prepare` — `operator.admin`; tham số
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; tham số
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; tham số
  `{ "suspensionId": "id-from-prepare" }`

Các mã định danh được loại bỏ khoảng trắng ở đầu và cuối, phải chứa một ký tự
không phải khoảng trắng và bị giới hạn ở 128 ký tự. Kết quả chuẩn bị đang bận
có `status: "busy"`, `reason`, `retryAfterMs`, `activeCount` và `blockers`.
Kết quả sẵn sàng có cấu trúc sau:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Trạng thái trả về `{"status":"running"}` hoặc kết quả sẵn sàng có
`expiresAtMs`. Tiếp tục trả về
`{"ok":true,"status":"running","resumed":true}`; việc lặp lại sau khi tiếp tục
thành công sẽ trả về `resumed: false`.

Một mã yêu cầu cạnh tranh hoặc lỗi tạm thời khi tiếp tục bộ lập lịch sẽ trả về
`UNAVAILABLE` có thể thử lại cùng `retryAfterMs`. Trong quá trình khôi phục bộ
lập lịch, cả chuẩn bị, trạng thái và tiếp tục đều trả về lỗi đó, Gateway vẫn
không sẵn sàng và đóng khi lỗi, đồng thời máy chủ không được đóng băng hoặc chụp
nhanh Gateway. OpenClaw tự động thử lại bộ lập lịch và chỉ mở lại việc tiếp nhận
sau khi khôi phục thành công. Mã tiếp tục không khớp sẽ trả về
`INVALID_REQUEST`. Thao tác chuẩn bị dùng chung hạn mức ghi của mặt phẳng điều
khiển Gateway là ba lần thử mỗi phút; hãy tuân thủ độ trễ thử lại được trả về.
Các ứng dụng khách WebSocket được phân nhóm theo thiết bị và IP. Các bộ điều
khiển HTTP quản trị được phân nhóm theo IP ứng dụng khách đã phân giải, vì vậy
các bộ điều khiển phía sau cùng một proxy có thể dùng chung hạn mức.

Việc chuẩn bị chỉ có thể từ chối: OpenClaw đóng việc tiếp nhận mới đối với
gốc/phiên/lệnh, tạm dừng các nhịp cron tự động và kiểm tra công việc một cách
đồng bộ. Nếu có bất kỳ hoạt động nào đang diễn ra, OpenClaw tiếp tục bộ lập lịch
và mở lại việc tiếp nhận trước khi trả về `busy`; OpenClaw không ngắt hoặc tháo
cạn công việc đó. Một hợp đồng thuê sẵn sàng kéo dài hai phút. Việc lặp lại
`prepare` với cùng `requestId` sẽ gia hạn hợp đồng; khi hết hạn, bộ lập lịch
được tiếp tục trước khi mở lại việc tiếp nhận.
Việc phát tín hiệu khởi động lại đến hạn trong thời gian hợp đồng thuê sẵn sàng
sẽ chờ cho đến khi hợp đồng được tiếp tục; một lượt khởi động lại đang diễn ra
khiến thao tác chuẩn bị trả về `busy`.

Trong trạng thái sẵn sàng, `/healthz` vẫn hoạt động và `/readyz` trả về `503`.
Phản hồi về mức độ sẵn sàng cục bộ hoặc đã xác thực bao gồm
`gateway-draining`; các phép thăm dò từ xa chưa xác thực chỉ nhận được
`{ "ready": false }`. Phép thăm dò tình trạng HTTP, các phương thức tạm ngưng
trên kết nối WebSocket hiện có và tuyến RPC HTTP quản trị đã được bật trước đó
vẫn khả dụng. Các RPC khác trả về `UNAVAILABLE` có thể thử lại. Các tuyến HTTP
tích hợp xử lý công việc của người dùng và các tuyến HTTP Plugin thông thường,
bao gồm API tương thích với OpenAI, thao tác công cụ/phiên, theo dõi Node và các
hook đã cấu hình, trả về `503` với `error.code: "gateway_unavailable"`. Các yêu
cầu nâng cấp WebSocket mới do Plugin sở hữu cũng trả về `503`; điều này bao quát
quyền sở hữu thao tác nâng cấp, không bao quát công việc được thực hiện sau đó
qua một socket Plugin đã được thiết lập.

Quy trình bắt tay này không lưu bền vững các tin nhắn đến, không dừng phương
thức truyền tải kênh của bên thứ ba và không kiểm soát nền tảng lưu trữ. Máy chủ
phải chặn lưu lượng vào trước khi chuẩn bị và vẫn chịu trách nhiệm về việc đánh
thức, chụp nhanh/đóng băng và dừng. `activeCount` là tổng số công việc được theo
dõi, còn `blockers` chứa số lượng danh mục khác không và thông tin tác vụ có
giới hạn. Đây không phải là rào cản buộc tiến trình nói chung phải tĩnh hoàn
toàn. Trình chặn `background-exec` chỉ mang tính tổng hợp: văn bản lệnh, mã tiến
trình, đầu ra và mã định danh phiên hoặc phạm vi không bao giờ đi qua giao thức.
Tình trạng kênh, bảo trì, làm mới bộ nhớ đệm, các phiên WebSocket Plugin đã được
thiết lập và công việc nền chưa đăng ký do Plugin sở hữu vẫn có thể hoạt động.
Nền tảng lưu trữ phải đóng băng hoặc chụp nhanh toàn bộ cây tiến trình và hệ
thống tệp của tiến trình đó một cách nhất quán; hợp đồng ban đầu này không thể
chứng minh công việc chưa đăng ký đang ở trạng thái nhàn rỗi.

<Tip>
  Để lập lịch đánh thức máy chủ, hãy giữ phần hướng tới OpenClaw trong một
  Plugin nội tiến trình và chiếu các bản chụp nhanh đầy đủ có tính lũy đẳng sang
  bộ điều hợp máy chủ bên ngoài. Bộ điều khiển lưu trữ không nên nhập Plugin SDK
  hoặc tái tạo trạng thái cron từ các phần thay đổi sự kiện. Xem [Chiếu cron bên
  ngoài an toàn](/vi/plugins/hooks#safe-external-cron-projection).
</Tip>

## Mã ứng dụng và mã Plugin

Sử dụng RPC Gateway khi mã nằm ngoài OpenClaw:

- Tập lệnh Node bắt đầu hoặc quan sát các lượt chạy của tác nhân
- Tác vụ CI gọi một Gateway
- bảng điều khiển và bảng quản trị
- tiện ích mở rộng IDE
- cầu nối bên ngoài không cần trở thành Plugin kênh
- kiểm thử tích hợp với phương thức truyền tải Gateway giả lập hoặc thực

Sử dụng Plugin SDK khi mã chạy bên trong OpenClaw:

- Plugin nhà cung cấp
- Plugin kênh
- hook công cụ hoặc vòng đời
- Plugin bộ khung tác nhân
- trình trợ giúp thời gian chạy đáng tin cậy

Các ứng dụng bên ngoài không nên nhập `openclaw/plugin-sdk/*`; các đường dẫn con
đó dành cho các Plugin do OpenClaw tải.

## Liên quan

- [Giao thức Gateway](/vi/gateway/protocol)
- [Tham chiếu RPC Gateway](/vi/reference/rpc)
- [Lệnh tác nhân CLI](/vi/cli/agent)
- [Lệnh tin nhắn CLI](/vi/cli/message)
- [Vòng lặp tác nhân](/vi/concepts/agent-loop)
- [Môi trường chạy tác nhân](/vi/concepts/agent-runtimes)
- [Phiên](/vi/concepts/session)
- [Tác vụ nền](/vi/automation/tasks)
- [Tác nhân ACP](/vi/tools/acp-agents)
- [Tổng quan về Plugin SDK](/vi/plugins/sdk-overview)
