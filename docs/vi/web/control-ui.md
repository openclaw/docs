---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển dựa trên trình duyệt cho Gateway (trò chuyện, hoạt động, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-07-04T18:06:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00575a4633b192b6121145476c3b15b6b68cfd177322f409cacbb7ef331d09d
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện điều khiển là một ứng dụng một trang **Vite + Lit** nhỏ được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Nó giao tiếp **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

<Note>
Trên các bind LAN gốc của Windows, Windows Firewall hoặc Group Policy do tổ chức quản lý vẫn có thể chặn URL LAN được quảng bá ngay cả khi `127.0.0.1` hoạt động trên máy chủ Gateway. Chạy `openclaw gateway status --deep` trên máy chủ Windows; lệnh này báo cáo các cổng có khả năng bị chặn, cấu hình mạng không khớp và các quy tắc tường lửa cục bộ mà chính sách có thể bỏ qua.
</Note>

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- header danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- header danh tính trusted-proxy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của dashboard giữ token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu bền. Onboarding thường tạo token gateway cho xác thực shared-secret trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép đôi thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Giao diện điều khiển từ trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép đôi một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "disconnected (1008): pairing required"

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

Nếu trình duyệt thử ghép đôi lại với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới sẽ được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép đôi và bạn đổi từ quyền đọc sang quyền ghi/admin, thao tác này được xem là nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ đang hoạt động, chặn lần kết nối lại với quyền rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không cần phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết xoay vòng và thu hồi token.

Các agent Paperclip kết nối qua adapter `openclaw_gateway` dùng cùng luồng phê duyệt lần chạy đầu tiên. Sau lần thử kết nối ban đầu, chạy `openclaw devices approve --latest` để xem trước yêu cầu đang chờ, rồi chạy lại lệnh `openclaw devices approve <requestId>` đã in ra để phê duyệt. Truyền rõ các giá trị `--url` và `--token` cho gateway từ xa. Để giữ phê duyệt ổn định qua các lần khởi động lại, hãy cấu hình `adapterConfig.devicePrivateKeyPem` bền vững trong Paperclip thay vì để nó tạo danh tính thiết bị tạm thời mới ở mỗi lần chạy.

<Note>
- Kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép đôi cho các phiên vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, danh tính Tailscale được xác minh, và trình duyệt trình danh tính thiết bị của nó.
- Bind Tailnet trực tiếp, kết nối trình duyệt LAN, và cấu hình trình duyệt không có danh tính thiết bị vẫn cần phê duyệt rõ ràng.
- Mỗi cấu hình trình duyệt tạo một ID thiết bị duy nhất, nên việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép đôi lại.

</Note>

## Ghép đôi thiết bị di động

Một quản trị viên đã được ghép đôi có thể tạo QR kết nối iOS/Android mà không cần
mở terminal:

<Steps>
  <Step title="Mở ghép đôi di động">
    Chọn **Nút**, rồi nhấp **Ghép đôi thiết bị di động** trong thẻ **Thiết bị**.
  </Step>
  <Step title="Kết nối điện thoại">
    Trong ứng dụng di động OpenClaw, mở **Cài đặt** → **Gateway** và quét mã QR
    code. Bạn cũng có thể sao chép và dán mã thiết lập.
  </Step>
  <Step title="Xác nhận kết nối">
    Ứng dụng iOS/Android chính thức tự động kết nối. Nếu **Thiết bị** hiển thị một
    yêu cầu đang chờ, hãy xem lại vai trò và phạm vi của yêu cầu đó trước khi phê duyệt.
  </Step>
</Steps>

Tạo mã thiết lập yêu cầu `operator.admin`; nút này bị vô hiệu hóa đối với
các phiên không có quyền đó. Mã thiết lập chứa thông tin xác thực bootstrap ngắn hạn,
vì vậy hãy xem QR và mã đã sao chép như mật khẩu khi chúng còn hiệu lực. Đối với ghép đôi
từ xa, Gateway phải phân giải thành `wss://` (ví dụ, thông qua Tailscale
Serve/Funnel); `ws://` thuần chỉ giới hạn ở loopback và địa chỉ LAN riêng.
Xem [Ghép đôi](/vi/channels/pairing#pair-from-the-control-ui-recommended) để biết
đầy đủ chi tiết bảo mật và phương án dự phòng.

## Danh tính cá nhân (cục bộ trong trình duyệt)

Giao diện điều khiển hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và avatar) được gắn vào tin nhắn gửi đi để quy kết trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, được giới hạn trong cấu hình trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hay lưu bền phía máy chủ ngoài metadata tác giả transcript thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại danh tính này về trống.

Mẫu cục bộ trong trình duyệt tương tự áp dụng cho ghi đè avatar trợ lý. Avatar trợ lý đã tải lên chỉ phủ lên danh tính do gateway phân giải trên trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn có sẵn cho các client không phải UI ghi trực tiếp trường này (chẳng hạn gateway được script hóa hoặc dashboard tùy chỉnh).

## Endpoint cấu hình runtime

Giao diện điều khiển lấy cài đặt runtime từ `/control-ui-config.json`, được phân giải tương đối với đường dẫn cơ sở của Giao diện điều khiển trên gateway (ví dụ `/__openclaw__/control-ui-config.json` khi UI được phục vụ dưới `/__openclaw__/`). Endpoint đó được bảo vệ bằng cùng xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và việc lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, danh tính Tailscale Serve, hoặc danh tính trusted-proxy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự bản địa hóa trong lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn ngôn ngữ nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại ở các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng tập ngôn ngữ không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã ngôn ngữ Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot, và Dash tích hợp, cùng một ô nhập tweakcn cục bộ trong trình duyệt. Để nhập chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Bộ nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Giao diện cũng bao gồm cài đặt Cỡ chữ cục bộ trong trình duyệt. Cài đặt này được lưu cùng phần còn lại của tùy chọn Giao diện điều khiển, áp dụng cho văn bản trò chuyện, văn bản composer, thẻ công cụ, và thanh bên trò chuyện, đồng thời giữ ô nhập văn bản tối thiểu 16px để Safari di động không tự động phóng to khi focus.

Chủ đề đã nhập chỉ được lưu trong cấu hình trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay chủ đề đã nhập sẽ cập nhật ô cục bộ duy nhất; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Những gì nó có thể làm (hiện tại)

<AccordionGroup>
  <Accordion title="Trò chuyện và nói chuyện">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Các lần làm mới lịch sử trò chuyện yêu cầu một cửa sổ gần đây có giới hạn với giới hạn văn bản theo từng tin nhắn để các phiên lớn không buộc trình duyệt render toàn bộ payload transcript trước khi trò chuyện có thể sử dụng được.
    - Nói chuyện qua phiên realtime của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần bị giới hạn qua WebSocket, và các Plugin giọng nói realtime chỉ backend dùng transport relay của Gateway. Phiên provider do client sở hữu bắt đầu bằng `talk.client.create`; phiên relay Gateway bắt đầu bằng `talk.session.create`. Relay giữ thông tin xác thực provider trên Gateway trong khi trình duyệt stream PCM từ micro qua `talk.session.appendAudio`, chuyển tiếp lệnh gọi công cụ provider `openclaw_agent_consult` qua `talk.client.toolCall` cho chính sách Gateway và mô hình OpenClaw đã cấu hình lớn hơn, đồng thời định tuyến điều hướng giọng nói của lượt chạy đang hoạt động qua `talk.client.steer` hoặc `talk.session.steer`.
    - Stream lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện agent).
    - Tab Hoạt động với tóm tắt cục bộ trong trình duyệt, ưu tiên biên tập ẩn thông tin, về hoạt động công cụ trực tiếp từ việc gửi `session.tool` / sự kiện công cụ hiện có.

  </Accordion>
  <Accordion title="Kênh, instance, phiên, dream">
    - Kênh: trạng thái kênh Plugin tích hợp cộng với bundled/external, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Các lần làm mới probe kênh giữ snapshot trước đó hiển thị trong khi kiểm tra provider chậm hoàn tất, và snapshot một phần được gắn nhãn khi probe hoặc audit vượt quá ngân sách UI của nó.
    - Instance: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: mặc định liệt kê phiên agent đã cấu hình, quay về từ các khóa phiên agent chưa cấu hình đã cũ, và áp dụng ghi đè mô hình/thinking/fast/verbose/trace/reasoning theo từng phiên (`sessions.list`, `sessions.patch`).
    - Dream: trạng thái dreaming, nút bật/tắt, và trình đọc Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nút, phê duyệt exec">
    - Công việc Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Nút: liệt kê + giới hạn năng lực (`node.list`), tạo mã thiết lập di động, và phê duyệt ghép đôi thiết bị (`device.pair.*`).
    - Phê duyệt exec: sửa allowlist gateway hoặc nút + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/chỉnh sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP có một trang cài đặt riêng cho các máy chủ đã cấu hình, trạng thái bật, tóm tắt OAuth/bộ lọc/song song, các lệnh vận hành phổ biến và trình chỉnh sửa cấu hình `mcp` theo phạm vi.
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các thao tác ghi bao gồm một chốt chặn base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các thao tác ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Lưu biểu mẫu sẽ loại bỏ các placeholder đã biên tập lỗi thời không thể khôi phục từ cấu hình đã lưu, đồng thời giữ lại các giá trị đã biên tập vẫn ánh xạ tới các bí mật đã lưu.
    - Kết xuất schema + biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, các gợi ý UI khớp, tóm tắt con trực tiếp, metadata tài liệu trên các nút đối tượng lồng nhau/ký tự đại diện/mảng/composition, cộng với schema Plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ khả dụng khi snapshot có vòng khứ hồi thô an toàn.
    - Nếu một snapshot không thể khứ hồi văn bản thô một cách an toàn, Control UI buộc dùng chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - Trình chỉnh sửa JSON thô "Đặt lại về bản đã lưu" giữ nguyên hình dạng do người dùng viết thô (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại một snapshot đã làm phẳng, để các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể khứ hồi an toàn.
    - Các giá trị đối tượng SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản của biểu mẫu để tránh vô tình làm hỏng từ đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Control UI, thời gian kết xuất chat/cấu hình chậm và các mục về độ phản hồi của trình duyệt cho khung hình động dài hoặc tác vụ dài khi trình duyệt cung cấp các kiểu mục PerformanceObserver đó.
    - Nhật ký: theo dõi trực tiếp nhật ký tệp Gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) kèm báo cáo khởi động lại, rồi thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản Gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng Cron jobs">
    - Với các job cô lập, mặc định gửi là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ dùng nội bộ.
    - Các trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` đặt thành một URL webhook HTTP(S) hợp lệ.
    - Với các job phiên chính, có sẵn chế độ gửi webhook và không gửi.
    - Các điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè agent, tùy chọn cron chính xác/so le, ghi đè mô hình/suy nghĩ của agent và các công tắc gửi theo nỗ lực tối đa.
    - Xác thực biểu mẫu nằm nội tuyến với lỗi cấp trường; giá trị không hợp lệ sẽ tắt nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi một bearer token riêng; nếu bỏ qua, webhook sẽ được gửi không có header xác thực.
    - Dự phòng không còn dùng: chạy `openclaw doctor --fix` để di chuyển các job cũ đã lưu có `notify: true` từ `cron.webhook` sang webhook theo từng job rõ ràng hoặc gửi khi hoàn tất.

  </Accordion>
</AccordionGroup>

## Trang MCP

Trang MCP riêng là chế độ xem dành cho người vận hành đối với các máy chủ MCP do OpenClaw quản lý dưới `mcp.servers`. Nó không tự khởi động các transport MCP; hãy dùng nó để kiểm tra và chỉnh sửa cấu hình đã lưu, rồi dùng `openclaw mcp doctor --probe` khi bạn cần bằng chứng máy chủ trực tiếp.

Quy trình điển hình:

1. Mở **MCP** từ thanh bên.
2. Kiểm tra các thẻ tóm tắt về tổng số máy chủ, số đã bật, OAuth và số máy chủ đã lọc.
3. Xem lại từng hàng máy chủ về transport, trạng thái bật, xác thực, bộ lọc, thời gian chờ và gợi ý lệnh.
4. Bật/tắt trạng thái bật khi một máy chủ vẫn cần được cấu hình nhưng không tham gia khám phá runtime.
5. Chỉnh sửa phần cấu hình `mcp` theo phạm vi cho định nghĩa máy chủ, header, đường dẫn TLS/mTLS, metadata OAuth, bộ lọc công cụ và metadata projection Codex.
6. Dùng **Lưu** để ghi cấu hình, hoặc **Lưu & Công bố** khi Gateway đang chạy cần áp dụng cấu hình đã thay đổi.
7. Chạy `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, hoặc `openclaw mcp reload` từ terminal khi tiến trình đã chỉnh sửa cần chẩn đoán tĩnh, bằng chứng trực tiếp hoặc giải phóng runtime đã lưu trong bộ nhớ đệm.

Trang này biên tập các giá trị giống URL có chứa thông tin xác thực trước khi kết xuất và đặt tên máy chủ trong ngoặc trích dẫn trong các snippet lệnh để các lệnh đã sao chép vẫn hoạt động với khoảng trắng hoặc siêu ký tự shell. Tham chiếu CLI và cấu hình đầy đủ nằm trong [MCP](/vi/cli/mcp).

## Thẻ Hoạt động

Thẻ Hoạt động là một trình quan sát tạm thời cục bộ trong trình duyệt cho hoạt động công cụ trực tiếp. Nó được suy ra từ cùng luồng sự kiện Gateway `session.tool` / công cụ đang cấp nguồn cho thẻ công cụ Chat; nó không thêm họ sự kiện Gateway, endpoint, kho hoạt động bền vững, nguồn cấp metrics hoặc luồng quan sát bên ngoài nào khác.

Các mục Hoạt động chỉ giữ lại tóm tắt đã làm sạch và bản xem trước đầu ra đã biên tập, bị cắt ngắn. Giá trị đối số công cụ không được lưu trong trạng thái Hoạt động; UI hiển thị rằng đối số bị ẩn và chỉ ghi lại số lượng trường đối số. Danh sách trong bộ nhớ đi theo thẻ trình duyệt hiện tại, tồn tại qua điều hướng trong Control UI và đặt lại khi tải lại trang, chuyển phiên hoặc **Xóa**.

## Hành vi Chat

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó ACK ngay lập tức với `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`. Các client Control UI đáng tin cậy cũng có thể nhận metadata thời gian ACK tùy chọn cho chẩn đoán cục bộ.
    - Tải lên Chat chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn ảnh gốc; các tệp khác được lưu dưới dạng media được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` bị giới hạn kích thước để đảm bảo an toàn UI. Khi các mục bản ghi quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối metadata nặng và thay thế tin nhắn quá khổ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Khi một tin nhắn assistant hiển thị bị cắt ngắn trong `chat.history`, trình đọc bên có thể lấy mục bản ghi đầy đủ đã chuẩn hóa hiển thị theo yêu cầu qua `chat.message.get` bằng `sessionKey`, `agentId` đang hoạt động khi cần, và `messageId` của bản ghi. Nếu Gateway vẫn không thể trả về nhiều hơn, trình đọc hiển thị trạng thái không khả dụng rõ ràng thay vì âm thầm lặp lại bản xem trước đã cắt ngắn.
    - Hình ảnh do assistant/tạo ra được duy trì dưới dạng tham chiếu media được quản lý và phục vụ lại qua URL media Gateway đã xác thực, vì vậy việc tải lại không phụ thuộc vào payload ảnh base64 thô còn nằm trong phản hồi lịch sử chat.
    - Khi kết xuất `chat.history`, Control UI loại bỏ các thẻ chỉ thị inline chỉ dành cho hiển thị khỏi văn bản assistant hiển thị (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn), cũng như các token điều khiển mô hình ASCII/full-width bị rò rỉ, đồng thời bỏ qua các mục assistant mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong lúc đang gửi và lần làm mới lịch sử cuối cùng, chế độ xem chat giữ các tin nhắn người dùng/assistant lạc quan cục bộ hiển thị nếu `chat.history` tạm thời trả về một snapshot cũ hơn; bản ghi chuẩn sẽ thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái gửi, còn `chat.history` được dựng lại từ bản ghi phiên bền vững. Sau các sự kiện tool-final, Control UI tải lại lịch sử và chỉ hợp nhất một đuôi lạc quan nhỏ; ranh giới bản ghi được ghi trong [WebChat](/vi/web/webchat).
    - `chat.inject` nối thêm một ghi chú assistant vào bản ghi phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không chạy agent, không gửi qua kênh).
    - Thanh bên liệt kê các phiên gần đây với hành động Phiên mới, liên kết Tất cả phiên và nút tìm kiếm phiên mở bộ chọn phiên đầy đủ (theo phạm vi agent đã chọn, có tìm kiếm và phân trang). Chuyển agent chỉ hiển thị các phiên gắn với agent đó và quay về phiên chính của agent đó khi chưa có phiên dashboard nào đã lưu.
    - Trên chiều rộng desktop, các điều khiển chat nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi; cuộn lên, quay lại đầu trang hoặc chạm đáy sẽ khôi phục các điều khiển.
    - Các tin nhắn liên tiếp trùng lặp chỉ có văn bản được kết xuất thành một bong bóng với huy hiệu số lượng. Tin nhắn có hình ảnh, tệp đính kèm, đầu ra công cụ hoặc bản xem trước canvas sẽ không bị thu gọn.
    - Bộ chọn mô hình và thinking ở header chat vá phiên hoạt động ngay lập tức qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ cho một lượt.
    - Nếu bạn gửi tin nhắn trong khi thay đổi bộ chọn mô hình cho cùng phiên vẫn đang lưu, composer sẽ chờ bản vá phiên đó trước khi gọi `chat.send` để lượt gửi dùng mô hình đã chọn.
    - Nhập `/new` trong Control UI tạo và chuyển sang cùng phiên dashboard mới như Chat mới, ngoại trừ khi `session.dmScope: "main"` được cấu hình và parent hiện tại là phiên chính của agent; trong trường hợp đó, nó đặt lại phiên chính tại chỗ. Nhập `/reset` giữ thao tác đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình chat yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, allowlist đó điều khiển bộ chọn, bao gồm các mục `provider/*` giúp catalog theo phạm vi provider luôn động. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng các provider có xác thực dùng được. Catalog đầy đủ vẫn khả dụng qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới bao gồm token ngữ cảnh hiện tại, thanh công cụ composer chat hiển thị một vòng sử dụng ngữ cảnh nhỏ với phần trăm đã dùng; chi tiết token đầy đủ nằm trong tooltip của nó. Vòng chuyển sang kiểu cảnh báo khi áp lực ngữ cảnh cao và, ở các mức Compaction được khuyến nghị, hiển thị một nút nhỏ gọn chạy đường dẫn Compaction phiên thông thường. Snapshot token cũ bị ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ Talk (realtime trong trình duyệt)">
    Chế độ Talk sử dụng một provider giọng nói realtime đã đăng ký. Cấu hình OpenAI với `talk.realtime.provider: "openai"` cộng với hồ sơ xác thực API key `openai`, `talk.realtime.providers.openai.apiKey`, hoặc `OPENAI_API_KEY`; hồ sơ OAuth OpenAI không cấu hình giọng nói Realtime. Cấu hình Google với `talk.realtime.provider: "google"` cộng với `talk.realtime.providers.google.apiKey`. Trình duyệt không bao giờ nhận API key provider tiêu chuẩn. OpenAI nhận một client secret Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API dùng một lần có ràng buộc cho phiên WebSocket trình duyệt, với hướng dẫn và khai báo công cụ được Gateway khóa vào token. Các provider chỉ cung cấp cầu nối realtime backend sẽ chạy qua transport chuyển tiếp Gateway, vì vậy thông tin xác thực và socket nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime do Gateway lắp ráp; `talk.client.create` không chấp nhận ghi đè chỉ dẫn do caller cung cấp.

    Trình soạn Chat có nút tùy chọn Nói chuyện bên cạnh nút bắt đầu/dừng Nói chuyện. Các tùy chọn áp dụng cho phiên Nói chuyện tiếp theo và có thể ghi đè nhà cung cấp, phương thức truyền tải, mô hình, giọng nói, mức nỗ lực suy luận, ngưỡng VAD, thời lượng im lặng và phần đệm tiền tố. Khi một tùy chọn để trống, Gateway dùng các mặc định đã cấu hình nếu có hoặc mặc định của nhà cung cấp. Chọn chuyển tiếp Gateway sẽ buộc dùng đường dẫn chuyển tiếp backend; chọn WebRTC giữ phiên thuộc sở hữu của client và sẽ thất bại thay vì âm thầm quay về chuyển tiếp nếu nhà cung cấp không thể tạo phiên trình duyệt.

    Trong trình soạn Chat, điều khiển Nói chuyện là nút sóng bên cạnh nút đọc chính tả bằng micrô. Khi Nói chuyện bắt đầu, hàng trạng thái của trình soạn hiển thị `Connecting Talk...`, sau đó là `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình thông qua `talk.client.toolCall`.

    Kiểm thử nhanh trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh cầu nối WebSocket backend OpenAI, trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt Google Live với token bị giới hạn, và bộ chuyển đổi trình duyệt chuyển tiếp Gateway với phương tiện micrô giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi log bí mật.

  </Accordion>
  <Accordion title="Stop and abort">
    - Nhấp **Stop** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt theo dõi thông thường sẽ được đưa vào hàng đợi. Nhấp **Steer** trên một tin nhắn đã xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Nhập `/stop` (hoặc các cụm hủy độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy tất cả các lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Khi một lượt chạy bị hủy, phần văn bản trợ lý chưa hoàn chỉnh vẫn có thể được hiển thị trong UI.
    - Gateway lưu phần văn bản trợ lý chưa hoàn chỉnh của lượt bị hủy vào lịch sử bản ghi khi có đầu ra đã được đệm.
    - Các mục được lưu bao gồm siêu dữ liệu hủy để bên tiêu thụ bản ghi có thể phân biệt phần chưa hoàn chỉnh do hủy với đầu ra hoàn tất bình thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và đẩy web

Control UI cung cấp `manifest.webmanifest` và một service worker, vì vậy các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

Nếu trang hiển thị **Protocol mismatch** ngay sau một bản cập nhật OpenClaw, trước tiên hãy mở lại bảng điều khiển bằng `openclaw dashboard` và làm mới cứng trang. Nếu vẫn thất bại, hãy xóa dữ liệu trang web cho origin của bảng điều khiển hoặc kiểm thử trong cửa sổ trình duyệt riêng tư; một tab cũ hoặc bộ nhớ đệm service-worker của trình duyệt có thể tiếp tục chạy gói Control UI trước cập nhật với Gateway mới hơn.

| Bề mặt                                               | Chức năng                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt sẽ đề xuất "Install app" khi có thể truy cập được.   |
| `ui/public/sw.js`                                     | Service worker xử lý sự kiện `push` và nhấp vào thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID tự động tạo dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt đã được lưu.                          |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn cố định khóa (cho triển khai nhiều host, xoay vòng bí mật hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `https://openclaw.ai`)

Control UI dùng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi một thông báo kiểm thử tới đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS iOS (xem [Cấu hình](/vi/gateway/configuration) để biết push dựa trên chuyển tiếp) và phương thức `push.test` hiện có, vốn nhắm tới ghép đôi thiết bị di động gốc.
</Note>

## Nhúng được host

Tin nhắn trợ lý có thể hiển thị nội dung web được host nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong nội dung nhúng được host.
  </Tab>
  <Tab title="scripts (default)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các trò chơi/widget trình duyệt tự chứa.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` bên trên `allow-scripts` cho các tài liệu cùng site chủ ý cần đặc quyền mạnh hơn.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thật sự cần hành vi cùng origin. Với hầu hết trò chơi do agent tạo và canvas tương tác, `scripts` là lựa chọn an toàn hơn.
</Warning>

Các URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ ý muốn `[embed url="https://..."]` tải trang của bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chiều rộng tin nhắn Chat

Các tin nhắn Chat được nhóm dùng max-width mặc định dễ đọc. Triển khai trên màn hình rộng có thể ghi đè mà không cần vá CSS đi kèm bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi tới trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài và phần trăm thuần như `960px` hoặc `82%`, cùng các biểu thức chiều rộng bị ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

    Theo mặc định, các yêu cầu Serve Control UI/WebSocket có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi yêu cầu đi tới loopback với các header `x-forwarded-*` của Tailscale. Với phiên operator Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép đôi thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn theo các kiểm tra thiết bị bình thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật chia sẻ rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP client và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thuần chạy đua song song.

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

    Dán bí mật chia sẻ khớp vào cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không bảo mật** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ đã được ghi tài liệu:

- tương thích HTTP không an toàn chỉ cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI operator thành công qua `gateway.auth.mode: "trusted-proxy"`
- phương án khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` chỉ là một nút bật/tắt tương thích cục bộ:

    - Nó cho phép các phiên Control UI localhost tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không bảo mật.
    - Nó không bỏ qua kiểm tra ghép đôi.
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
    `dangerouslyDisableDeviceAuth` tắt kiểm tra danh tính thiết bị Control UI và là một hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh sau khi dùng trong tình huống khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Xác thực trusted-proxy thành công có thể cho phép phiên Control UI **operator** không cần danh tính thiết bị.
    - Điều này **không** mở rộng tới các phiên Control UI vai trò node.
    - Reverse proxy loopback cùng host vẫn không đáp ứng xác thực trusted-proxy; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI được cung cấp với chính sách `img-src` chặt chẽ: chỉ cho phép tài sản **cùng origin**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh `http(s)` từ xa và URL hình ảnh tương đối theo giao thức bị trình duyệt từ chối và không phát sinh truy xuất mạng.

Điều này có nghĩa trong thực tế:

- Avatar và hình ảnh được phục vụ dưới đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các route avatar đã xác thực mà UI truy xuất và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/huy hiệu tích hợp sẵn, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt operator truy xuất hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực route avatar

Khi xác thực gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Yêu cầu chưa xác thực tới một trong hai route đều bị từ chối (khớp với route assistant-media cùng cấp). Điều này ngăn route avatar làm rò rỉ danh tính agent trên các host vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token gateway dưới dạng bearer header khi truy xuất avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong bảng điều khiển.

Nếu bạn tắt xác thực Gateway (không khuyến nghị trên máy chủ dùng chung), tuyến avatar cũng sẽ không cần xác thực, nhất quán với phần còn lại của Gateway.

## Xác thực tuyến media của trợ lý

Khi xác thực Gateway được cấu hình, bản xem trước media cục bộ của trợ lý dùng một tuyến hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực toán tử Control UI thông thường. Trình duyệt gửi token Gateway dưới dạng header bearer khi kiểm tra tính khả dụng.
- Phản hồi siêu dữ liệu thành công bao gồm một `mediaTicket` ngắn hạn, giới hạn trong đúng đường dẫn nguồn đó.
- URL hình ảnh, âm thanh, video và tài liệu do trình duyệt hiển thị dùng `mediaTicket=<ticket>` thay vì token hoặc mật khẩu Gateway đang hoạt động. Ticket hết hạn nhanh và không thể cấp quyền cho một nguồn khác.

Điều này giữ cho việc hiển thị media thông thường tương thích với các phần tử media gốc của trình duyệt mà không đưa thông tin đăng nhập Gateway có thể tái sử dụng vào các URL media hiển thị.

## Xây dựng UI

Gateway phục vụ các tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

```bash
pnpm ui:build
```

Base tuyệt đối tùy chọn (khi bạn muốn URL tài nguyên cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Để phát triển cục bộ (máy chủ dev riêng):

```bash
pnpm ui:dev
```

Sau đó trỏ UI đến URL Gateway WS của bạn (ví dụ: `ws://127.0.0.1:18789`).

## Trang Control UI trống

Nếu trình duyệt tải một bảng điều khiển trống và DevTools không hiển thị lỗi hữu ích nào, một tiện ích mở rộng hoặc content script chạy sớm có thể đã ngăn ứng dụng module JavaScript được đánh giá. Trang tĩnh bao gồm một bảng khôi phục HTML thuần xuất hiện khi `<openclaw-app>` chưa được đăng ký sau khi khởi động.

Dùng hành động **Thử lại** của bảng sau khi thay đổi môi trường trình duyệt, hoặc tải lại thủ công sau các bước kiểm tra này:

- Tắt các tiện ích mở rộng chèn vào mọi trang, đặc biệt là các tiện ích mở rộng có content script `<all_urls>`.
- Thử cửa sổ riêng tư, hồ sơ trình duyệt sạch hoặc một trình duyệt khác.
- Giữ Gateway đang chạy và xác minh cùng URL bảng điều khiển sau khi thay đổi trình duyệt.

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Control UI là các tệp tĩnh; mục tiêu WebSocket có thể cấu hình và có thể khác với origin HTTP. Điều này hữu ích khi bạn muốn dùng máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

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
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy URL-encode giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn đúng cách.
    - Nên truyền `token` qua URL fragment (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi đến máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Tham số truy vấn cũ `?token=` vẫn được nhập một lần để tương thích, nhưng chỉ như một phương án dự phòng, và bị xóa ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin đăng nhập từ cấu hình hoặc môi trường. Cung cấp `token` (hoặc `password`) một cách tường minh. Thiếu thông tin đăng nhập tường minh là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI công khai không phải loopback phải đặt `gateway.controlUi.allowedOrigins` một cách tường minh (origin đầy đủ). Các lần tải LAN/Tailnet riêng tư cùng origin từ loopback, RFC1918/link-local, `.local`, `.ts.net` hoặc máy chủ Tailscale CGNAT được chấp nhận mà không cần bật fallback Host-header.
    - Khởi động Gateway có thể gieo các origin cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu dụng, nhưng origin trình duyệt từ xa vẫn cần các mục nhập tường minh.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi origin trình duyệt, không phải "khớp với bất kỳ host nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback origin Host-header, nhưng đây là một chế độ bảo mật nguy hiểm.

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
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện trò chuyện dựa trên trình duyệt
