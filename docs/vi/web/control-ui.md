---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, hoạt động, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-07-03T09:45:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b23d0e2aeefc3b746f1ab51cd9049135e2695ab77cf5cbb5eab6ec0df90f011d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI là một ứng dụng một trang **Vite + Lit** nhỏ được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ `/openclaw`)

Nó giao tiếp **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

<Note>
Trên các liên kết LAN gốc của Windows, Windows Firewall hoặc Group Policy do tổ chức quản lý vẫn có thể chặn URL LAN được quảng bá ngay cả khi `127.0.0.1` hoạt động trên máy chủ Gateway. Chạy `openclaw gateway status --deep` trên máy chủ Windows; lệnh này báo cáo các cổng có khả năng bị chặn, sai lệch hồ sơ, và các quy tắc tường lửa cục bộ mà chính sách có thể bỏ qua.
</Note>

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- tiêu đề định danh Tailscale Serve khi `gateway.auth.allowTailscale: true`
- tiêu đề định danh proxy tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt dashboard giữ token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu bền vững. Onboarding thường tạo token gateway cho xác thực bí mật chia sẻ ở lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Control UI từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép nối một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "đã ngắt kết nối (1008): yêu cầu ghép nối"

<Steps>
  <Step title="Liệt kê yêu cầu đang chờ">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Phê duyệt bằng ID yêu cầu">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Nếu trình duyệt thử lại ghép nối với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép nối và bạn đổi từ quyền đọc sang quyền ghi/quản trị, việc này được xem là nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ vẫn hoạt động, chặn lần kết nối lại có phạm vi rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và không cần phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

Các tác nhân Paperclip kết nối qua adapter `openclaw_gateway` dùng cùng luồng phê duyệt lần chạy đầu tiên. Sau lần thử kết nối ban đầu, chạy `openclaw devices approve --latest` để xem trước yêu cầu đang chờ, rồi chạy lại lệnh `openclaw devices approve <requestId>` được in ra để phê duyệt. Truyền các giá trị `--url` và `--token` rõ ràng cho gateway từ xa. Để giữ phê duyệt ổn định qua các lần khởi động lại, cấu hình `adapterConfig.devicePrivateKeyPem` bền vững trong Paperclip thay vì để nó tạo định danh thiết bị tạm thời mới ở mỗi lần chạy.

<Note>
- Các kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép nối cho phiên vận hành Control UI khi `gateway.auth.allowTailscale: true`, định danh Tailscale được xác minh, và trình duyệt trình bày định danh thiết bị của nó.
- Các liên kết Tailnet trực tiếp, kết nối trình duyệt qua LAN, và hồ sơ trình duyệt không có định danh thiết bị vẫn cần phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

</Note>

## Định danh cá nhân (cục bộ theo trình duyệt)

Control UI hỗ trợ định danh cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được gắn vào tin nhắn gửi đi để quy trách nhiệm trong các phiên dùng chung. Định danh này nằm trong bộ nhớ trình duyệt, giới hạn theo hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hoặc lưu bền vững phía máy chủ ngoài siêu dữ liệu tác giả bản ghi hội thoại thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại định danh này về trống.

Cùng mẫu cục bộ theo trình duyệt cũng áp dụng cho phần ghi đè ảnh đại diện trợ lý. Ảnh đại diện trợ lý đã tải lên chỉ phủ lên định danh do gateway phân giải trên trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn khả dụng cho các máy khách không phải UI ghi trực tiếp vào trường này (chẳng hạn gateway theo script hoặc dashboard tùy chỉnh).

## Endpoint cấu hình runtime

Control UI lấy cài đặt runtime từ `/control-ui-config.json`, được phân giải tương đối với đường dẫn cơ sở Control UI của gateway (ví dụ `/__openclaw__/control-ui-config.json` khi UI được phục vụ dưới `/__openclaw__/`). Endpoint đó được kiểm soát bởi cùng cơ chế xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và một lần lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, định danh Tailscale Serve, hoặc định danh proxy tin cậy.

## Hỗ trợ ngôn ngữ

Control UI có thể tự bản địa hóa ở lần tải đầu tiên dựa trên locale của trình duyệt. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn locale nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Locale được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại ở các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ locale không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã locale mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề tích hợp sẵn Claw, Knot, và Dash, cộng với một ô nhập tweakcn cục bộ theo trình duyệt. Để nhập một chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo chủ đề, nhấp **Chia sẻ**, và dán liên kết chủ đề đã sao chép vào Giao diện. Bộ nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Giao diện cũng bao gồm cài đặt Cỡ chữ cục bộ theo trình duyệt. Cài đặt này được lưu cùng phần còn lại của tùy chọn Control UI, áp dụng cho văn bản chat, văn bản trình soạn, thẻ công cụ, và thanh bên chat, đồng thời giữ ô nhập văn bản tối thiểu 16px để Safari trên di động không tự động phóng to khi focus.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một ô cục bộ; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện tại)

<AccordionGroup>
  <Accordion title="Chat và Trò chuyện thoại">
    - Chat với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Làm mới lịch sử chat yêu cầu một cửa sổ gần đây có giới hạn với giới hạn văn bản theo từng tin nhắn để các phiên lớn không buộc trình duyệt kết xuất toàn bộ tải bản ghi hội thoại trước khi chat có thể dùng được.
    - Trò chuyện thoại qua phiên thời gian thực của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần bị ràng buộc qua WebSocket, và các plugin thoại thời gian thực chỉ phía backend dùng truyền tải chuyển tiếp của Gateway. Phiên nhà cung cấp do máy khách sở hữu bắt đầu bằng `talk.client.create`; phiên chuyển tiếp Gateway bắt đầu bằng `talk.session.create`. Bộ chuyển tiếp giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt truyền PCM micrô qua `talk.session.appendAudio`, chuyển tiếp các lệnh gọi công cụ nhà cung cấp `openclaw_agent_consult` qua `talk.client.toolCall` cho chính sách Gateway và mô hình OpenClaw lớn hơn đã cấu hình, đồng thời định tuyến điều hướng bằng giọng nói của lần chạy đang hoạt động qua `talk.client.steer` hoặc `talk.session.steer`.
    - Truyền trực tuyến lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Chat (sự kiện tác nhân).
    - Tab Hoạt động với tóm tắt cục bộ theo trình duyệt, ưu tiên biên tập ẩn, về hoạt động công cụ trực tiếp từ cơ chế phân phối `session.tool` / sự kiện công cụ hiện có.

  </Accordion>
  <Accordion title="Kênh, phiên bản, phiên, giấc mơ">
    - Kênh: trạng thái kênh plugin tích hợp sẵn cộng với plugin đóng gói/bên ngoài, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Các lần làm mới dò kênh giữ ảnh chụp nhanh trước đó hiển thị trong khi kiểm tra nhà cung cấp chậm hoàn tất, và ảnh chụp nhanh một phần được gắn nhãn khi một lần dò hoặc kiểm tra vượt quá ngân sách UI của nó.
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: mặc định liệt kê các phiên tác nhân đã cấu hình, quay về từ các khóa phiên tác nhân chưa cấu hình đã cũ, và áp dụng ghi đè theo từng phiên cho mô hình/suy nghĩ/nhanh/chi tiết/truy vết/lập luận (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái dreaming, công tắc bật/tắt, và trình đọc Nhật ký Giấc mơ (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nút, phê duyệt exec">
    - Công việc Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Nút: liệt kê + giới hạn năng lực (`node.list`).
    - Phê duyệt exec: chỉnh allowlist gateway hoặc nút + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP có trang cài đặt riêng cho các máy chủ đã cấu hình, bật/tắt, tóm tắt OAuth/bộ lọc/song song, lệnh vận hành phổ biến, và trình chỉnh sửa cấu hình `mcp` theo phạm vi.
    - Áp dụng + khởi động lại với xác thực (`config.apply`) và đánh thức phiên hoạt động cuối cùng.
    - Ghi bao gồm một bộ bảo vệ hash cơ sở để ngăn ghi đè các chỉnh sửa đồng thời.
    - Ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong tải cấu hình đã gửi; ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Lưu biểu mẫu loại bỏ các placeholder đã biên tập ẩn bị cũ không thể khôi phục từ cấu hình đã lưu trong khi vẫn giữ các giá trị đã biên tập ẩn còn ánh xạ tới bí mật đã lưu.
    - Schema + kết xuất biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm trường `title` / `description`, gợi ý UI khớp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các nút đối tượng lồng nhau/wildcard/mảng/thành phần, cộng với schema plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ khả dụng khi ảnh chụp nhanh có thể đi vòng thô an toàn.
    - Nếu một ảnh chụp nhanh không thể đi vòng văn bản thô an toàn, Control UI bắt buộc chế độ Biểu mẫu và tắt chế độ Thô cho ảnh chụp nhanh đó.
    - Trình chỉnh sửa JSON thô "Đặt lại về đã lưu" giữ nguyên hình dạng do tác giả thô tạo (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại một ảnh chụp nhanh đã làm phẳng, để các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi ảnh chụp nhanh có thể đi vòng an toàn.
    - Giá trị đối tượng SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản biểu mẫu để ngăn vô tình làm hỏng đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: ảnh chụp nhanh trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Control UI, thời gian kết xuất chat/cấu hình chậm, và các mục về khả năng phản hồi của trình duyệt cho khung hình hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các loại mục PerformanceObserver đó.
    - Nhật ký: tail trực tiếp nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật gói/git + khởi động lại (`update.run`) với báo cáo khởi động lại, rồi thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú về bảng tác vụ Cron">
    - Với các tác vụ cô lập, mặc định gửi là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ dùng nội bộ.
    - Các trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành một URL webhook HTTP(S) hợp lệ.
    - Với các tác vụ phiên chính, có sẵn các chế độ gửi webhook và không gửi.
    - Các điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè tác tử, tùy chọn cron chính xác/dàn trải, ghi đè mô hình/suy luận của tác tử, và công tắc gửi theo nỗ lực tối đa.
    - Xác thực biểu mẫu hiển thị trực tiếp với lỗi ở cấp trường; các giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi một bearer token chuyên dụng; nếu bỏ qua, webhook được gửi mà không có header xác thực.
    - Phương án dự phòng đã ngừng dùng: chạy `openclaw doctor --fix` để di chuyển các tác vụ cũ đã lưu có `notify: true` từ `cron.webhook` sang webhook theo từng tác vụ hoặc gửi khi hoàn tất một cách tường minh.

  </Accordion>
</AccordionGroup>

## Trang MCP

Trang MCP chuyên dụng là giao diện dành cho người vận hành để quản lý các máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Trang này không tự khởi động các MCP transport; hãy dùng trang để kiểm tra và chỉnh sửa cấu hình đã lưu, sau đó dùng `openclaw mcp doctor --probe` khi bạn cần bằng chứng máy chủ trực tiếp.

Quy trình điển hình:

1. Mở **MCP** từ thanh bên.
2. Kiểm tra các thẻ tóm tắt để xem tổng số, số đã bật, OAuth và số máy chủ đã lọc.
3. Xem từng hàng máy chủ về transport, trạng thái bật, xác thực, bộ lọc, thời gian chờ và gợi ý lệnh.
4. Bật/tắt trạng thái hoạt động khi một máy chủ cần giữ cấu hình nhưng không tham gia quá trình phát hiện lúc chạy.
5. Chỉnh sửa phần cấu hình `mcp` theo phạm vi cho định nghĩa máy chủ, header, đường dẫn TLS/mTLS, siêu dữ liệu OAuth, bộ lọc công cụ và siêu dữ liệu chiếu Codex.
6. Dùng **Lưu** để ghi cấu hình, hoặc **Lưu & Xuất bản** khi Gateway đang chạy cần áp dụng cấu hình đã thay đổi.
7. Chạy `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, hoặc `openclaw mcp reload` từ terminal khi tiến trình đã chỉnh sửa cần chẩn đoán tĩnh, bằng chứng trực tiếp hoặc giải phóng runtime đã lưu trong bộ nhớ đệm.

Trang này che các giá trị dạng URL chứa thông tin xác thực trước khi hiển thị và đặt tên máy chủ trong dấu nháy trong các đoạn lệnh để các lệnh đã sao chép vẫn hoạt động với khoảng trắng hoặc siêu ký tự shell. Tham chiếu CLI và cấu hình đầy đủ nằm trong [MCP](/vi/cli/mcp).

## Thẻ Hoạt động

Thẻ Hoạt động là trình quan sát tạm thời cục bộ trong trình duyệt cho hoạt động công cụ trực tiếp. Thẻ này được dẫn xuất từ cùng luồng sự kiện Gateway `session.tool` / công cụ dùng để cấp nguồn cho thẻ công cụ Chat; nó không thêm họ sự kiện Gateway, endpoint, kho hoạt động bền vững, nguồn cấp chỉ số hoặc luồng quan sát bên ngoài nào khác.

Các mục Hoạt động chỉ giữ bản tóm tắt đã làm sạch và bản xem trước đầu ra đã che, bị cắt ngắn. Giá trị đối số công cụ không được lưu trong trạng thái Hoạt động; giao diện cho biết đối số bị ẩn và chỉ ghi lại số trường đối số. Danh sách trong bộ nhớ đi theo thẻ trình duyệt hiện tại, tồn tại qua điều hướng trong Control UI, và đặt lại khi tải lại trang, chuyển phiên hoặc bấm **Xóa**.

## Hành vi Chat

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`. Các máy khách Control UI đáng tin cậy cũng có thể nhận siêu dữ liệu thời gian ACK tùy chọn để chẩn đoán cục bộ.
    - Tải lên trong Chat chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để bảo đảm an toàn cho giao diện. Khi các mục bản ghi quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế các tin nhắn quá khổ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Khi một tin nhắn trợ lý hiển thị đã bị cắt ngắn trong `chat.history`, trình đọc bên có thể lấy mục bản ghi đầy đủ đã chuẩn hóa để hiển thị theo yêu cầu thông qua `chat.message.get` bằng `sessionKey`, `agentId` đang hoạt động khi cần, và `messageId` của bản ghi. Nếu Gateway vẫn không thể trả về thêm nội dung, trình đọc hiển thị trạng thái không khả dụng rõ ràng thay vì âm thầm lặp lại bản xem trước bị cắt ngắn.
    - Hình ảnh do trợ lý/tạo sinh được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử chat.
    - Khi kết xuất `chat.history`, Control UI loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng cho hiển thị khỏi văn bản trợ lý hiển thị (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cũng như các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục trợ lý mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong lúc gửi đang hoạt động và lần làm mới lịch sử cuối cùng, chế độ xem chat giữ các tin nhắn người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` tạm thời trả về một snapshot cũ hơn; bản ghi chuẩn sẽ thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái gửi, trong khi `chat.history` được dựng lại từ bản ghi phiên bền vững. Sau các sự kiện kết thúc công cụ, Control UI tải lại lịch sử và chỉ hợp nhất một phần đuôi lạc quan nhỏ; ranh giới bản ghi được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` thêm một ghi chú trợ lý vào bản ghi phiên và phát một sự kiện `chat` để cập nhật chỉ trong giao diện (không chạy tác tử, không gửi qua kênh).
    - Thanh bên liệt kê các phiên gần đây với hành động Phiên mới, liên kết Tất cả phiên, và nút tìm kiếm phiên mở bộ chọn phiên đầy đủ (được giới hạn theo tác tử đã chọn, có tìm kiếm và phân trang). Khi chuyển tác tử, chỉ các phiên gắn với tác tử đó được hiển thị và sẽ quay về phiên chính của tác tử đó nếu chưa có phiên dashboard nào đã lưu.
    - Trên chiều rộng desktop, các điều khiển chat nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi; cuộn lên, quay lại đầu trang hoặc đến cuối sẽ khôi phục các điều khiển.
    - Các tin nhắn chỉ có văn bản trùng lặp liên tiếp được hiển thị thành một bong bóng với huy hiệu số lượng. Các tin nhắn có hình ảnh, tệp đính kèm, đầu ra công cụ hoặc bản xem trước canvas sẽ không bị thu gọn.
    - Bộ chọn mô hình và suy luận ở header chat vá phiên đang hoạt động ngay lập tức thông qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ dùng cho một lượt.
    - Nếu bạn gửi tin nhắn trong khi thay đổi bộ chọn mô hình cho cùng phiên vẫn đang được lưu, trình soạn thảo sẽ chờ bản vá phiên đó trước khi gọi `chat.send` để lần gửi dùng mô hình đã chọn.
    - Gõ `/new` trong Control UI sẽ tạo và chuyển sang cùng một phiên dashboard mới như Chat mới, trừ khi `session.dmScope: "main"` được cấu hình và phiên cha hiện tại là phiên chính của tác tử; trong trường hợp đó, nó đặt lại phiên chính tại chỗ. Gõ `/reset` giữ cơ chế đặt lại tại chỗ tường minh của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình chat yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, allowlist đó điều khiển bộ chọn, bao gồm các mục `provider/*` giữ cho catalog theo phạm vi nhà cung cấp luôn động. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` tường minh cùng các nhà cung cấp có xác thực khả dụng. Catalog đầy đủ vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi các báo cáo sử dụng phiên Gateway mới bao gồm token ngữ cảnh hiện tại, thanh công cụ trình soạn thảo chat hiển thị một vòng nhỏ về mức sử dụng ngữ cảnh với phần trăm đã dùng; chi tiết token đầy đủ nằm trong tooltip của nó. Vòng này chuyển sang kiểu cảnh báo khi áp lực ngữ cảnh cao và, ở các mức Compaction được khuyến nghị, hiển thị một nút gọn chạy đường dẫn Compaction phiên thông thường. Các snapshot token cũ bị ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ Talk (thời gian thực trên trình duyệt)">
    Chế độ Talk dùng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.realtime.provider: "openai"` cùng một hồ sơ xác thực khóa API `openai`, `talk.realtime.providers.openai.apiKey`, hoặc `OPENAI_API_KEY`; hồ sơ OAuth của OpenAI không cấu hình giọng nói Realtime. Cấu hình Google với `talk.realtime.provider: "google"` cùng `talk.realtime.providers.google.apiKey`. Trình duyệt không bao giờ nhận khóa API nhà cung cấp tiêu chuẩn. OpenAI nhận một client secret Realtime tạm thời cho WebRTC. Google Live nhận token xác thực Live API bị ràng buộc dùng một lần cho phiên WebSocket trình duyệt, với hướng dẫn và khai báo công cụ được Gateway khóa vào token. Các nhà cung cấp chỉ phơi bày cầu nối thời gian thực backend chạy qua transport chuyển tiếp Gateway, để thông tin xác thực và socket của nhà cung cấp ở phía máy chủ trong khi âm thanh trình duyệt di chuyển qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.client.create` không chấp nhận ghi đè hướng dẫn do bên gọi cung cấp.

    Trình soạn thảo Chat bao gồm nút tùy chọn Talk bên cạnh nút bắt đầu/dừng Talk. Các tùy chọn áp dụng cho phiên Talk tiếp theo và có thể ghi đè nhà cung cấp, transport, mô hình, giọng, mức nỗ lực suy luận, ngưỡng VAD, thời lượng im lặng và phần đệm tiền tố. Khi một tùy chọn để trống, Gateway dùng mặc định đã cấu hình nếu có hoặc mặc định của nhà cung cấp. Chọn chuyển tiếp Gateway buộc dùng đường dẫn chuyển tiếp backend; chọn WebRTC giữ phiên do máy khách sở hữu và sẽ thất bại thay vì âm thầm quay về chuyển tiếp nếu nhà cung cấp không thể tạo phiên trình duyệt.

    Trong trình soạn thảo Chat, điều khiển Talk là nút sóng cạnh nút đọc chính tả bằng micrô. Khi Talk bắt đầu, hàng trạng thái của trình soạn thảo hiển thị `Connecting Talk...`, sau đó `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình thông qua `talk.client.toolCall`.

    Kiểm thử khói trực tiếp cho người bảo trì: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh cầu nối WebSocket backend OpenAI, trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt bằng token bị ràng buộc Google Live, và bộ chuyển đổi trình duyệt chuyển tiếp Gateway với phương tiện micrô giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi log bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lần chạy đang hoạt động, các lượt theo dõi thông thường sẽ xếp hàng. Nhấp **Điều hướng** trên một tin nhắn đã xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy ngoài luồng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy tất cả các lần chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại một phần khi hủy bỏ">
    - Khi một lần chạy bị hủy bỏ, văn bản trợ lý một phần vẫn có thể được hiển thị trong giao diện.
    - Gateway lưu bền vững văn bản trợ lý một phần đã bị hủy bỏ vào lịch sử bản ghi khi có đầu ra đã được đệm.
    - Các mục đã lưu bền vững bao gồm siêu dữ liệu hủy bỏ để trình tiêu thụ bản ghi có thể phân biệt phần hủy bỏ một phần với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Control UI cung cấp `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó dưới dạng PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi thẻ hoặc cửa sổ trình duyệt không mở.

Nếu trang hiển thị **Không khớp giao thức** ngay sau khi cập nhật OpenClaw, trước tiên hãy mở lại bảng điều khiển bằng `openclaw dashboard` và làm mới cứng trang. Nếu vẫn lỗi, hãy xóa dữ liệu trang cho origin của bảng điều khiển hoặc thử trong cửa sổ trình duyệt riêng tư; một thẻ cũ hoặc bộ nhớ đệm service-worker của trình duyệt có thể tiếp tục chạy gói giao diện điều khiển trước cập nhật với Gateway mới hơn.

| Bề mặt                                               | Chức năng                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Tệp kê khai PWA. Trình duyệt đề xuất "Cài đặt ứng dụng" sau khi có thể truy cập.   |
| `ui/public/sw.js`                                     | Service worker xử lý sự kiện `push` và nhấp vào thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo, dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt đã được lưu bền vững.                          |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn cố định khóa (cho triển khai nhiều host, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `https://openclaw.ai`)

Giao diện điều khiển dùng các phương thức Gateway được giới hạn theo scope này để đăng ký và kiểm thử các đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo thử nghiệm đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn relay APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) để biết push dựa trên relay) và phương thức `push.test` hiện có, vốn nhắm đến ghép cặp di động native.
</Note>

## Nội dung nhúng được lưu trữ

Tin nhắn trợ lý có thể hiển thị nội dung web được lưu trữ ngay trong dòng bằng shortcode `[embed ...]`. Chính sách sandbox của iframe được kiểm soát bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (default)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các trò chơi/tiện ích trình duyệt tự chứa.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` bên trên `allow-scripts` cho tài liệu cùng site cố ý cần đặc quyền mạnh hơn.
  </Tab>
</Tabs>

Ví dụ:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Chỉ dùng `trusted` khi tài liệu được nhúng thật sự cần hành vi cùng origin. Với hầu hết trò chơi và canvas tương tác do agent tạo, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` tuyệt đối bên ngoài vẫn bị chặn theo mặc định. Nếu bạn cố ý muốn `[embed url="https://..."]` tải trang của bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Độ rộng tin nhắn chat

Các tin nhắn chat được nhóm dùng max-width mặc định dễ đọc. Triển khai trên màn hình rộng có thể ghi đè giá trị này mà không cần vá CSS đi kèm bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi đến trình duyệt. Các giá trị được hỗ trợ gồm độ dài và phần trăm thuần như `960px` hoặc `82%`, cùng các biểu thức độ rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Giữ Gateway trên local loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

    Theo mặc định, các yêu cầu Serve của giao diện điều khiển/WebSocket có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với các header `x-forwarded-*` của Tailscale. Với phiên operator của giao diện điều khiển có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép cặp thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn theo các kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực shared-secret rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP client và scope xác thực được tuần tự hóa trước khi ghi rate-limit. Vì vậy, các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thuần chạy đua song song.

    <Warning>
    Xác thực Serve không token giả định host gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên host đó, hãy yêu cầu xác thực token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

    Dán shared secret khớp vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** kết nối giao diện điều khiển không có danh tính thiết bị.

Các ngoại lệ được ghi tài liệu:

- tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực giao diện điều khiển operator thành công qua `gateway.auth.mode: "trusted-proxy"`
- phá kính khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách sửa khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên host gateway)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` chỉ là nút bật/tắt tương thích cục bộ:

    - Nó cho phép phiên giao diện điều khiển localhost tiếp tục mà không có danh tính thiết bị trong ngữ cảnh HTTP không an toàn.
    - Nó không bỏ qua kiểm tra ghép cặp.
    - Nó không nới lỏng yêu cầu danh tính thiết bị từ xa (không phải localhost).

  </Accordion>
  <Accordion title="Break-glass only">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` tắt kiểm tra danh tính thiết bị của giao diện điều khiển và là một hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh sau khi dùng khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Xác thực trusted-proxy thành công có thể cho phép phiên giao diện điều khiển **operator** không cần danh tính thiết bị.
    - Điều này **không** áp dụng cho phiên giao diện điều khiển vai trò node.
    - Reverse proxy loopback cùng host vẫn không thỏa mãn xác thực trusted-proxy; xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Giao diện điều khiển được phát hành với chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **same-origin**, URL `data:`, và URL `blob:` được tạo cục bộ. URL ảnh `http(s)` từ xa và URL ảnh tương đối theo giao thức bị trình duyệt từ chối và không phát sinh lượt fetch mạng.

Ý nghĩa thực tế:

- Avatar và ảnh được phục vụ dưới đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các route avatar đã xác thực mà UI fetch và chuyển thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do giao diện điều khiển tạo vẫn hiển thị.
- URL avatar từ xa do metadata kênh phát ra bị loại bỏ tại helper avatar của giao diện điều khiển và được thay bằng logo/huy hiệu tích hợp, nên một kênh bị xâm phạm hoặc độc hại không thể ép trình duyệt operator fetch ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không cấu hình được.

## Xác thực route avatar

Khi xác thực gateway được cấu hình, endpoint avatar của giao diện điều khiển yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về metadata avatar theo cùng quy tắc.
- Yêu cầu chưa xác thực đến một trong hai route đều bị từ chối (khớp với route assistant-media cùng cấp). Điều này ngăn route avatar làm rò rỉ danh tính agent trên các host vốn được bảo vệ.
- Bản thân giao diện điều khiển chuyển tiếp token gateway dưới dạng bearer header khi fetch avatar, và dùng URL blob đã xác thực để ảnh vẫn hiển thị trong bảng điều khiển.

Nếu bạn tắt xác thực gateway (không khuyến nghị trên host dùng chung), route avatar cũng trở thành không xác thực, phù hợp với phần còn lại của gateway.

## Xác thực route media của trợ lý

Khi xác thực gateway được cấu hình, bản xem trước media cục bộ của trợ lý dùng route hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực operator giao diện điều khiển thông thường. Trình duyệt gửi token gateway dưới dạng bearer header khi kiểm tra khả dụng.
- Phản hồi metadata thành công bao gồm một `mediaTicket` tồn tại ngắn hạn, được giới hạn cho đúng đường dẫn nguồn đó.
- URL ảnh, âm thanh, video và tài liệu được trình duyệt hiển thị dùng `mediaTicket=<ticket>` thay vì token hoặc mật khẩu gateway đang hoạt động. Vé hết hạn nhanh và không thể cấp quyền cho nguồn khác.

Điều này giữ cho việc hiển thị media thông thường tương thích với phần tử media native của trình duyệt mà không đặt thông tin xác thực gateway có thể tái sử dụng vào URL media hiển thị.

## Xây dựng UI

Gateway phục vụ tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

```bash
pnpm ui:build
```

Base tuyệt đối tùy chọn (khi bạn muốn URL tài nguyên cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Cho phát triển cục bộ (dev server riêng):

```bash
pnpm ui:dev
```

Sau đó trỏ UI đến URL WS của Gateway (ví dụ `ws://127.0.0.1:18789`).

## Trang giao diện điều khiển trống

Nếu trình duyệt tải bảng điều khiển trống và DevTools không hiển thị lỗi hữu ích, một tiện ích mở rộng hoặc content script chạy sớm có thể đã ngăn ứng dụng mô-đun JavaScript được đánh giá. Trang tĩnh bao gồm một panel khôi phục HTML thuần xuất hiện khi `<openclaw-app>` chưa được đăng ký sau khi khởi động.

Dùng thao tác **Thử lại** của panel sau khi thay đổi môi trường trình duyệt, hoặc tải lại thủ công sau các kiểm tra này:

- Tắt tiện ích mở rộng chèn vào mọi trang, đặc biệt là tiện ích có content script `<all_urls>`.
- Thử cửa sổ riêng tư, hồ sơ trình duyệt sạch, hoặc trình duyệt khác.
- Giữ Gateway chạy và xác minh cùng URL bảng điều khiển sau khi thay đổi trình duyệt.

## Gỡ lỗi/kiểm thử: dev server + Gateway từ xa

Giao diện điều khiển là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác origin HTTP. Điều này tiện khi bạn muốn dùng Vite dev server cục bộ nhưng Gateway chạy ở nơi khác.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    Xác thực một lần tùy chọn (nếu cần):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl` được lưu trong localStorage sau khi tải và bị xóa khỏi URL.
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - Nên truyền `token` qua phân mảnh URL (`#token=...`) bất cứ khi nào có thể. Phân mảnh không được gửi đến máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Các tham số truy vấn cũ `?token=` vẫn được nhập một lần để tương thích, nhưng chỉ như phương án dự phòng, và bị loại bỏ ngay sau khi khởi động ban đầu.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không quay về dùng thông tin xác thực từ cấu hình hoặc môi trường. Hãy cung cấp rõ ràng `token` (hoặc `password`). Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không được nhúng) để ngăn clickjacking.
    - Các triển khai Control UI công khai không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (origin đầy đủ). Các lượt tải LAN/Tailnet riêng tư cùng origin từ loopback, RFC1918/link-local, `.local`, `.ts.net`, hoặc máy chủ Tailscale CGNAT được chấp nhận mà không cần bật phương án dự phòng Host-header.
    - Khi khởi động, Gateway có thể gieo các origin cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu dụng, nhưng origin của trình duyệt từ xa vẫn cần các mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Điều đó có nghĩa là cho phép mọi origin trình duyệt, không phải "khớp với bất kỳ host nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ phương án dự phòng origin Host-header, nhưng đây là một chế độ bảo mật nguy hiểm.

  </Accordion>
</AccordionGroup>

Ví dụ:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Chi tiết thiết lập truy cập từ xa: [Truy cập từ xa](/vi/gateway/remote).

## Liên quan

- [Bảng điều khiển](/vi/web/dashboard) — bảng điều khiển Gateway
- [Kiểm tra tình trạng](/vi/gateway/health) — giám sát tình trạng Gateway
- [TUI](/vi/web/tui) — giao diện người dùng đầu cuối
- [WebChat](/vi/web/webchat) — giao diện trò chuyện trên trình duyệt
