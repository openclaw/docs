---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, các Node, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-07T13:26:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9ef19392f0d14aef9373e4469789f5916250f76038c8c81fe8a932c47913ca8
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện điều khiển là một ứng dụng một trang **Vite + Lit** nhỏ được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Nó giao tiếp **trực tiếp với Gateway WebSocket** trên cùng một cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- tiêu đề định danh Tailscale Serve khi `gateway.auth.allowTailscale: true`
- tiêu đề định danh proxy tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của bảng điều khiển giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu bền vững. Quy trình thiết lập ban đầu thường tạo một token gateway cho xác thực bí mật chia sẻ trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Giao diện điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép nối một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "đã ngắt kết nối (1008): cần ghép nối"

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Nếu trình duyệt thử lại ghép nối với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép nối và bạn đổi nó từ quyền đọc sang quyền ghi/quản trị, việc này được xử lý như một nâng cấp phê duyệt, không phải một lần kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ hoạt động, chặn lần kết nối lại với quyền rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không cần phê duyệt lại trừ khi bạn thu hồi nó bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

<Note>
- Các kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép nối cho các phiên vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, định danh Tailscale xác minh thành công, và trình duyệt xuất trình định danh thiết bị của nó.
- Các bind Tailnet trực tiếp, kết nối trình duyệt LAN, và hồ sơ trình duyệt không có định danh thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

</Note>

## Danh tính cá nhân (cục bộ trong trình duyệt)

Giao diện điều khiển hỗ trợ một danh tính cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được gắn vào tin nhắn gửi đi để quy kết trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, được giới hạn trong hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hoặc lưu bền vững phía máy chủ ngoài siêu dữ liệu tác giả bản ghi hội thoại thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại danh tính này về trống.

Mẫu cục bộ trong trình duyệt tương tự áp dụng cho ghi đè ảnh đại diện trợ lý. Ảnh đại diện trợ lý đã tải lên chỉ phủ lên danh tính do gateway phân giải trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn có sẵn cho các client không phải UI ghi trực tiếp vào trường này (chẳng hạn gateway theo script hoặc bảng điều khiển tùy chỉnh).

## Endpoint cấu hình runtime

Giao diện điều khiển lấy cài đặt runtime của nó từ `/__openclaw/control-ui-config.json`. Endpoint đó được bảo vệ bằng cùng xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và một lần lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, định danh Tailscale Serve, hoặc định danh proxy tin cậy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể bản địa hóa chính nó trong lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn locale nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Locale được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Các bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ locale không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã locale mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot, và Dash tích hợp sẵn, cùng một khe nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, và dán liên kết chủ đề đã sao chép vào Giao diện. Trình nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Các chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một khe cục bộ; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Các lần làm mới lịch sử trò chuyện yêu cầu một cửa sổ gần đây có giới hạn với giới hạn văn bản theo từng tin nhắn để các phiên lớn không buộc trình duyệt phải render toàn bộ payload bản ghi hội thoại trước khi phần trò chuyện có thể dùng được.
    - Đàm thoại qua các phiên thời gian thực của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần có ràng buộc qua WebSocket, và các Plugin giọng nói thời gian thực chỉ backend dùng transport relay của Gateway. Các phiên provider do client sở hữu bắt đầu bằng `talk.client.create`; các phiên relay Gateway bắt đầu bằng `talk.session.create`. Relay giữ thông tin xác thực provider trên Gateway trong khi trình duyệt stream PCM microphone qua `talk.session.appendAudio` và chuyển tiếp các lệnh gọi công cụ provider `openclaw_agent_consult` qua `talk.client.toolCall` cho chính sách Gateway và mô hình OpenClaw được cấu hình lớn hơn.
    - Stream lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện agent).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kênh: trạng thái các kênh tích hợp sẵn cộng với kênh Plugin đóng gói/bên ngoài, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Các lần làm mới thăm dò kênh giữ ảnh chụp nhanh trước đó hiển thị trong khi các kiểm tra provider chậm hoàn tất, và ảnh chụp nhanh một phần được gắn nhãn khi một lần thăm dò hoặc kiểm toán vượt quá ngân sách UI của nó.
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: mặc định liệt kê các phiên agent đã cấu hình, quay về từ khóa phiên agent chưa cấu hình đã cũ, và áp dụng ghi đè mô hình/suy nghĩ/nhanh/chi tiết/trace/reasoning theo từng phiên (`sessions.list`, `sessions.patch`).
    - Dream: trạng thái dreaming, công tắc bật/tắt, và trình đọc Nhật ký Dream (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Tác vụ Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: liệt kê + khả năng (`node.list`).
    - Phê duyệt exec: chỉnh sửa danh sách cho phép gateway hoặc node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại với xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các lần ghi bao gồm một guard base-hash để ngăn ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đã gửi đang hoạt động nhưng chưa phân giải được sẽ bị từ chối trước khi ghi.
    - Schema + render biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các node object/wildcard/array/composition lồng nhau, cộng với schema Plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ khả dụng khi ảnh chụp nhanh có thể đi vòng thô an toàn.
    - Nếu một ảnh chụp nhanh không thể đi vòng văn bản thô một cách an toàn, Giao diện điều khiển buộc chế độ Biểu mẫu và vô hiệu hóa chế độ Thô cho ảnh chụp nhanh đó.
    - Trình chỉnh sửa JSON thô "Đặt lại về bản đã lưu" giữ nguyên hình dạng do phần thô tạo ra (định dạng, bình luận, bố cục `$include`) thay vì render lại một ảnh chụp nhanh đã làm phẳng, vì vậy các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi ảnh chụp nhanh có thể đi vòng an toàn.
    - Các giá trị đối tượng SecretRef có cấu trúc được render chỉ đọc trong các ô nhập văn bản của biểu mẫu để ngăn vô tình làm hỏng từ đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Gỡ lỗi: ảnh chụp nhanh trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Giao diện điều khiển, thời gian render trò chuyện/cấu hình chậm, và các mục phản hồi trình duyệt cho khung hình hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các loại mục PerformanceObserver đó.
    - Nhật ký: tail trực tiếp nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại, sau đó thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Với các tác vụ cô lập, mặc định phân phối là thông báo tóm tắt. Bạn có thể chuyển sang không có nếu muốn các lần chạy chỉ nội bộ.
    - Các trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành URL webhook HTTP(S) hợp lệ.
    - Với các tác vụ phiên chính, các chế độ phân phối webhook và không có đều khả dụng.
    - Điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè agent, tùy chọn cron chính xác/so le, ghi đè mô hình/suy nghĩ agent, và công tắc phân phối best-effort.
    - Xác thực biểu mẫu nằm nội tuyến với lỗi theo từng trường; giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi một bearer token chuyên dụng; nếu bỏ qua, webhook được gửi mà không có tiêu đề xác thực.
    - Fallback không còn khuyến nghị: các tác vụ legacy đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` là **không chặn**: nó xác nhận ngay lập tức với `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`.
    - Tải lên trong trò chuyện chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu trữ dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` trong khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để bảo đảm an toàn cho UI. Khi các mục bản ghi trò chuyện quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế thông điệp quá khổ bằng một phần giữ chỗ (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý tạo ra được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - Khi hiển thị `chat.history`, Control UI loại bỏ khỏi văn bản trợ lý hiển thị các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, đồng thời bỏ qua các mục trợ lý có toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong khi có lượt gửi đang hoạt động và lần làm mới lịch sử cuối cùng, chế độ xem trò chuyện giữ các thông điệp người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` trong chốc lát trả về một ảnh chụp cũ hơn; bản ghi chính tắc thay thế các thông điệp cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái phân phối, còn `chat.history` được dựng lại từ bản ghi phiên bền vững. Sau các sự kiện công cụ cuối cùng, Control UI tải lại lịch sử và chỉ hợp nhất một đoạn đuôi lạc quan nhỏ; ranh giới bản ghi được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` nối thêm một ghi chú trợ lý vào bản ghi phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không chạy agent, không phân phối kênh).
    - Tiêu đề trò chuyện hiển thị bộ lọc agent trước bộ chọn phiên, và bộ chọn phiên được giới hạn theo agent đã chọn. Chuyển agent chỉ hiển thị các phiên gắn với agent đó và quay về phiên chính của agent đó khi nó chưa có phiên dashboard đã lưu.
    - Trên độ rộng desktop, các điều khiển trò chuyện nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi; cuộn lên, quay lại đầu trang, hoặc chạm đáy sẽ khôi phục các điều khiển.
    - Các thông điệp chỉ có văn bản trùng lặp liên tiếp hiển thị thành một bong bóng với huy hiệu số lượng. Các thông điệp mang hình ảnh, tệp đính kèm, đầu ra công cụ, hoặc bản xem trước canvas sẽ không bị gộp.
    - Bộ chọn mô hình và chế độ suy nghĩ trong tiêu đề trò chuyện vá phiên đang hoạt động ngay lập tức thông qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ cho một lượt.
    - Gõ `/new` trong Control UI sẽ tạo và chuyển sang cùng một phiên dashboard mới như Trò chuyện mới. Gõ `/reset` giữ cơ chế đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trò chuyện yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cộng với các nhà cung cấp có xác thực dùng được. Danh mục đầy đủ vẫn khả dụng qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới có bao gồm token ngữ cảnh hiện tại, khu vực trình soạn trò chuyện hiển thị một chỉ báo sử dụng ngữ cảnh gọn. Nó chuyển sang kiểu cảnh báo khi áp lực ngữ cảnh cao và, ở các mức Compaction được khuyến nghị, hiển thị một nút gọn chạy đường dẫn Compaction phiên bình thường. Ảnh chụp token cũ bị ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Chế độ Talk sử dụng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.realtime.provider: "openai"` cộng với `talk.realtime.providers.openai.apiKey`, hoặc cấu hình Google với `talk.realtime.provider: "google"` cộng với `talk.realtime.providers.google.apiKey`. Trình duyệt không bao giờ nhận khóa API nhà cung cấp tiêu chuẩn. OpenAI nhận một bí mật máy khách Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API bị ràng buộc, dùng một lần cho phiên WebSocket của trình duyệt, với chỉ dẫn và khai báo công cụ được Gateway khóa vào token. Các nhà cung cấp chỉ cung cấp cầu nối thời gian thực backend sẽ chạy qua truyền tải chuyển tiếp Gateway, nên thông tin xác thực và socket nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh trình duyệt di chuyển qua các RPC Gateway đã xác thực. Lời nhắc phiên Realtime được Gateway lắp ráp; `talk.client.create` không chấp nhận ghi đè chỉ dẫn do bên gọi cung cấp.

    Trong trình soạn Chat, điều khiển Talk là nút sóng bên cạnh nút đọc chính tả bằng micrô. Khi Talk bắt đầu, hàng trạng thái của trình soạn hiển thị `Connecting Talk...`, sau đó là `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình thông qua `talk.client.toolCall`.

    Kiểm thử khói trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trình duyệt của OpenAI, thiết lập WebSocket trình duyệt bằng token bị ràng buộc của Google Live, và bộ chuyển đổi trình duyệt chuyển tiếp Gateway với phương tiện micrô giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi nhật ký bí mật.

  </Accordion>
  <Accordion title="Stop and abort">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Trong khi một lượt chạy đang hoạt động, các lượt theo dõi bình thường sẽ được xếp hàng. Nhấp **Điều hướng** trên một thông điệp đã xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm hủy độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy ngoài luồng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy tất cả các lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Khi một lượt chạy bị hủy, văn bản trợ lý một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền vững văn bản trợ lý một phần đã bị hủy vào lịch sử bản ghi khi có đầu ra đã đệm.
    - Các mục được lưu bền vững bao gồm siêu dữ liệu hủy để người tiêu thụ bản ghi có thể phân biệt phần bị hủy với đầu ra hoàn tất bình thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Control UI cung cấp một `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt đề xuất "Cài đặt ứng dụng" khi có thể truy cập được. |
| `ui/public/sw.js`                                     | Service worker xử lý sự kiện `push` và nhấp vào thông báo.         |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo dùng để ký payload Web Push.        |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt được lưu bền vững.                |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều máy chủ, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Control UI sử dụng các phương thức Gateway có giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cộng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) cho push dựa trên chuyển tiếp) và phương thức `push.test` hiện có, vốn nhắm đến ghép nối di động native.
</Note>

## Nhúng được lưu trữ

Thông điệp trợ lý có thể hiển thị nội dung web được lưu trữ nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (default)">
    Cho phép nhúng tương tác trong khi vẫn giữ cách ly origin; đây là mặc định và thường đủ cho các trò chơi/tiện ích trình duyệt khép kín.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` bên trên `allow-scripts` cho các tài liệu cùng site cố ý cần đặc quyền mạnh hơn.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thực sự cần hành vi cùng origin. Với hầu hết trò chơi do agent tạo và canvas tương tác, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn cố ý muốn `[embed url="https://..."]` tải các trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Độ rộng thông điệp trò chuyện

Các thông điệp trò chuyện được nhóm sử dụng max-width mặc định dễ đọc. Các triển khai màn hình rộng có thể ghi đè mà không cần vá CSS đi kèm bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi đến trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài thuần và phần trăm như `960px` hoặc `82%`, cộng với các biểu thức độ rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (được khuyến nghị)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Giữ Gateway trên local loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua header định danh Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh định danh bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp địa chỉ đó với header, đồng thời chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào local loopback với các header `x-forwarded-*` của Tailscale. Với các phiên người vận hành Control UI có định danh thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép nối thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn tuân theo kiểm tra thiết bị bình thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật dùng chung rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn định danh Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực sẽ được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử lại sai đồng thời từ cùng một trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lần không khớp thuần túy chạy song song.

    <Warning>
    Xác thực Serve không cần token giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên máy chủ đó, hãy yêu cầu xác thực bằng token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Dán khóa bí mật dùng chung tương ứng vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không bảo mật** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ đã được ghi lại:

- khả năng tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI của người vận hành thành công thông qua `gateway.auth.mode: "trusted-proxy"`
- tùy chọn khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục được khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ Gateway)

<AccordionGroup>
  <Accordion title="Hành vi của nút bật/tắt xác thực không an toàn">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` chỉ là một tùy chọn tương thích cục bộ:

    - Nó cho phép các phiên Control UI trên localhost tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không bảo mật.
    - Nó không bỏ qua các kiểm tra ghép nối.
    - Nó không nới lỏng các yêu cầu danh tính thiết bị từ xa (không phải localhost).

  </Accordion>
  <Accordion title="Chỉ dùng trong trường hợp khẩn cấp">
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
    `dangerouslyDisableDeviceAuth` tắt các kiểm tra danh tính thiết bị của Control UI và là một mức hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh chóng sau khi dùng khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về trusted-proxy">
    - Xác thực trusted-proxy thành công có thể cho phép các phiên Control UI của **người vận hành** không cần danh tính thiết bị.
    - Điều này **không** áp dụng cho các phiên Control UI thuộc vai trò node.
    - Các reverse proxy local loopback cùng máy chủ vẫn không đáp ứng xác thực trusted-proxy; xem [Xác thực trusted proxy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI đi kèm chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng nguồn**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh `http(s)` từ xa và tương đối theo giao thức sẽ bị trình duyệt từ chối và không tạo yêu cầu mạng.

Điều này có nghĩa là:

- Avatar và hình ảnh được phục vụ dưới các đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các tuyến avatar có xác thực mà UI tải về rồi chuyển đổi thành URL `blob:` cục bộ.
- URL nội tuyến `data:image/...` vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do metadata kênh phát ra sẽ bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/huy hiệu tích hợp, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của người vận hành tải hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực tuyến avatar

Khi xác thực gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về metadata avatar theo cùng quy tắc.
- Yêu cầu chưa xác thực tới một trong hai tuyến đều bị từ chối (khớp với tuyến assistant-media cùng cấp). Điều này ngăn tuyến avatar làm lộ danh tính agent trên các máy chủ vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token gateway dưới dạng header bearer khi tải avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong bảng điều khiển.

Nếu bạn tắt xác thực gateway (không được khuyến nghị trên máy chủ dùng chung), tuyến avatar cũng trở thành không cần xác thực, phù hợp với phần còn lại của gateway.

## Xác thực tuyến media của assistant

Khi xác thực gateway được cấu hình, bản xem trước media cục bộ của assistant dùng một tuyến hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực người vận hành Control UI thông thường. Trình duyệt gửi token gateway dưới dạng header bearer khi kiểm tra tính khả dụng.
- Phản hồi metadata thành công bao gồm một `mediaTicket` ngắn hạn, chỉ áp dụng cho đúng đường dẫn nguồn đó.
- URL hình ảnh, âm thanh, video và tài liệu do trình duyệt hiển thị dùng `mediaTicket=<ticket>` thay vì token hoặc mật khẩu gateway đang hoạt động. Vé hết hạn nhanh và không thể cấp quyền cho một nguồn khác.

Điều này giữ cho việc hiển thị media thông thường tương thích với các phần tử media gốc của trình duyệt mà không đưa thông tin đăng nhập gateway có thể tái sử dụng vào URL media hiển thị.

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

Sau đó trỏ UI tới URL WS của Gateway (ví dụ `ws://127.0.0.1:18789`).

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Control UI là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với nguồn HTTP. Điều này hữu ích khi bạn muốn chạy máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

<Steps>
  <Step title="Khởi động máy chủ dev UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Mở với gatewayUrl">
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
  <Accordion title="Ghi chú">
    - `gatewayUrl` được lưu trong localStorage sau khi tải và bị xóa khỏi URL.
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL cho giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - Nên truyền `token` qua fragment URL (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi tới máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Tham số truy vấn cũ `?token=` vẫn được nhập một lần để tương thích, nhưng chỉ như phương án dự phòng, và bị xóa ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin đăng nhập từ cấu hình hoặc môi trường. Hãy cung cấp rõ ràng `token` (hoặc `password`). Thiếu thông tin đăng nhập rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (nguồn đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Khi khởi động, Gateway có thể khởi tạo sẵn các nguồn cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng các nguồn trình duyệt từ xa vẫn cần mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép bất kỳ nguồn trình duyệt nào, không phải "khớp với bất kỳ máy chủ nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback nguồn theo Host-header, nhưng đây là một chế độ bảo mật nguy hiểm.

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

- [Bảng điều khiển](/vi/web/dashboard) — bảng điều khiển gateway
- [Kiểm tra tình trạng](/vi/gateway/health) — giám sát tình trạng gateway
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện trò chuyện trên trình duyệt
