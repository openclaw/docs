---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển dựa trên trình duyệt cho Gateway (trò chuyện, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-11T20:38:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0033b2666fe76bd23d5585d05b39fdd33f8d15d4e7c16561b5cfd0e75b8d22e
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

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- tiêu đề định danh Tailscale Serve khi `gateway.auth.allowTailscale: true`
- tiêu đề định danh proxy đáng tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của bảng điều khiển giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu lâu dài. Quy trình khởi tạo thường tạo một token gateway cho xác thực bí mật dùng chung trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối đầu tiên)

Khi bạn kết nối với Giao diện điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép nối một lần**. Đây là một biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "đã ngắt kết nối (1008): yêu cầu ghép nối"

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

Nếu trình duyệt đã được ghép nối và bạn thay đổi từ quyền truy cập đọc sang quyền ghi/quản trị, việc này được xử lý như một nâng cấp phê duyệt, không phải một lần kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ hoạt động, chặn lần kết nối lại có phạm vi rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không yêu cầu phê duyệt lại trừ khi bạn thu hồi nó bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

<Note>
- Các kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua lượt ghép nối cho các phiên vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, định danh Tailscale được xác minh, và trình duyệt xuất trình định danh thiết bị của nó.
- Các bind Tailnet trực tiếp, kết nối trình duyệt LAN, và hồ sơ trình duyệt không có định danh thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

</Note>

## Định danh cá nhân (cục bộ trong trình duyệt)

Giao diện điều khiển hỗ trợ định danh cá nhân theo từng trình duyệt (tên hiển thị và avatar) gắn vào tin nhắn gửi đi để quy kết tác giả trong các phiên dùng chung. Nó nằm trong bộ nhớ trình duyệt, được giới hạn trong hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hoặc lưu lâu dài phía máy chủ ngoài siêu dữ liệu tác giả bản ghi thông thường trên những tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại nó về trống.

Cùng mẫu cục bộ trong trình duyệt áp dụng cho ghi đè avatar của trợ lý. Avatar trợ lý được tải lên chỉ phủ lên định danh do gateway phân giải trên trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn khả dụng cho các client không phải UI ghi trực tiếp vào trường này (chẳng hạn như gateway được kịch bản hóa hoặc bảng điều khiển tùy chỉnh).

## Điểm cuối cấu hình runtime

Giao diện điều khiển lấy cài đặt runtime của nó từ `/__openclaw/control-ui-config.json`. Điểm cuối đó được bảo vệ bởi cùng xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và việc lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, định danh Tailscale Serve, hoặc định danh proxy đáng tin cậy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự bản địa hóa khi tải lần đầu dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè sau này, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn ngôn ngữ nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Các bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và được dùng lại trong các lần truy cập sau.
- Các khóa dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ ngôn ngữ không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã ngôn ngữ mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo phát hành; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot và Dash tích hợp sẵn, cùng một vị trí nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Bộ nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Các chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Việc thay thế chủ đề đã nhập cập nhật một vị trí cục bộ; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Làm mới lịch sử trò chuyện yêu cầu một cửa sổ gần đây có giới hạn với giới hạn văn bản theo từng tin nhắn, để các phiên lớn không buộc trình duyệt kết xuất toàn bộ tải bản ghi trước khi cuộc trò chuyện có thể dùng được.
    - Nói chuyện qua các phiên thời gian thực của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt dùng một lần bị giới hạn qua WebSocket, và các Plugin thoại thời gian thực chỉ chạy backend dùng truyền tải chuyển tiếp Gateway. Các phiên nhà cung cấp do client sở hữu bắt đầu với `talk.client.create`; các phiên chuyển tiếp Gateway bắt đầu với `talk.session.create`. Chuyển tiếp giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt truyền PCM microphone qua `talk.session.appendAudio` và chuyển tiếp các lệnh gọi công cụ nhà cung cấp `openclaw_agent_consult` qua `talk.client.toolCall` để áp dụng chính sách Gateway và mô hình OpenClaw lớn hơn đã cấu hình.
    - Truyền trực tuyến các lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện tác tử).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kênh: trạng thái kênh Plugin tích hợp cộng với đi kèm/bên ngoài, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Làm mới thăm dò kênh giữ ảnh chụp nhanh trước đó hiển thị trong khi các kiểm tra nhà cung cấp chậm hoàn tất, và ảnh chụp nhanh một phần được gắn nhãn khi một thăm dò hoặc kiểm tra vượt quá ngân sách UI của nó.
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: mặc định liệt kê các phiên tác tử đã cấu hình, quay lui từ các khóa phiên tác tử chưa cấu hình đã cũ, và áp dụng ghi đè mô hình/suy nghĩ/nhanh/chi tiết/truy vết/lý luận theo từng phiên (`sessions.list`, `sessions.patch`).
    - Dreams: trạng thái dreaming, công tắc bật/tắt, và trình đọc Nhật ký Dream (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Công việc Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: danh sách + khả năng (`node.list`).
    - Phê duyệt exec: sửa danh sách cho phép của gateway hoặc node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại với xác thực (`config.apply`) và đánh thức phiên hoạt động cuối cùng.
    - Các lần ghi bao gồm chốt bảo vệ base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong tải cấu hình đã gửi; các ref đã gửi đang hoạt động nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Schema + kết xuất biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm trường `title` / `description`, gợi ý UI khớp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các nút object/wildcard/array/composition lồng nhau, cùng schema Plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ khả dụng khi ảnh chụp nhanh có thể đi vòng thô an toàn.
    - Nếu một ảnh chụp nhanh không thể đi vòng văn bản thô an toàn, Giao diện điều khiển buộc chế độ Biểu mẫu và tắt chế độ Thô cho ảnh chụp nhanh đó.
    - Trình chỉnh sửa JSON thô "Đặt lại về bản đã lưu" giữ nguyên hình dạng do tác giả thô tạo (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại một ảnh chụp nhanh đã làm phẳng, để các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi ảnh chụp nhanh có thể đi vòng an toàn.
    - Các giá trị object SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản biểu mẫu để ngăn lỗi vô tình làm hỏng object thành string.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Gỡ lỗi: ảnh chụp nhanh trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Giao diện điều khiển, thời gian kết xuất trò chuyện/cấu hình chậm, và các mục phản hồi trình duyệt cho khung hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các loại mục PerformanceObserver đó.
    - Nhật ký: tail trực tiếp nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại, sau đó thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Với các công việc cô lập, mặc định gửi là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ dùng nội bộ.
    - Các trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành một URL webhook HTTP(S) hợp lệ.
    - Với các công việc phiên chính, chế độ gửi webhook và không gửi đều khả dụng.
    - Điều khiển chỉnh sửa nâng cao bao gồm xóa-sau-khi-chạy, xóa ghi đè tác tử, tùy chọn cron chính xác/so le, ghi đè mô hình/suy nghĩ của tác tử, và công tắc gửi theo nỗ lực tốt nhất.
    - Xác thực biểu mẫu được hiển thị nội tuyến với lỗi cấp trường; giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi một bearer token chuyên dụng; nếu bỏ qua, webhook được gửi không có tiêu đề xác thực.
    - Phương án quay lui đã lỗi thời: các công việc cũ đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi được truyền phát qua các sự kiện `chat`.
    - Tải lên trong trò chuyện chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để an toàn cho UI. Khi các mục bản ghi hội thoại quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế các tin nhắn quá cỡ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý/tạo sinh được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - Khi hiển thị `chat.history`, Control UI loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản trợ lý thấy được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, đồng thời bỏ qua các mục trợ lý có toàn bộ văn bản thấy được chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong khi một lượt gửi đang hoạt động và lần làm mới lịch sử cuối cùng, chế độ xem trò chuyện vẫn giữ các tin nhắn người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` tạm thời trả về một ảnh chụp cũ hơn; bản ghi hội thoại chuẩn sẽ thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái phân phối, còn `chat.history` được dựng lại từ bản ghi hội thoại phiên bền vững. Sau các sự kiện kết thúc công cụ, Control UI tải lại lịch sử và chỉ hợp nhất một phần đuôi lạc quan nhỏ; ranh giới bản ghi hội thoại được ghi tài liệu trong [WebChat](/vi/web/webchat).
    - `chat.inject` thêm một ghi chú trợ lý vào bản ghi hội thoại phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không có lượt chạy tác tử, không phân phối qua kênh).
    - Tiêu đề trò chuyện hiển thị bộ lọc tác tử trước bộ chọn phiên, và bộ chọn phiên được giới hạn theo tác tử đã chọn. Chuyển tác tử chỉ hiển thị các phiên gắn với tác tử đó và quay về phiên chính của tác tử đó khi nó chưa có phiên bảng điều khiển đã lưu.
    - Trên chiều rộng máy tính để bàn, các điều khiển trò chuyện giữ trên một hàng gọn và thu gọn khi cuộn xuống bản ghi hội thoại; cuộn lên, quay lại đầu, hoặc đến cuối sẽ khôi phục các điều khiển.
    - Các tin nhắn chỉ văn bản trùng lặp liên tiếp hiển thị thành một bong bóng với huy hiệu số lượng. Tin nhắn có hình ảnh, tệp đính kèm, đầu ra công cụ, hoặc bản xem trước canvas thì không bị thu gọn.
    - Bộ chọn mô hình và suy nghĩ trong tiêu đề trò chuyện vá phiên đang hoạt động ngay lập tức qua `sessions.patch`; chúng là ghi đè phiên bền vững, không phải tùy chọn gửi chỉ cho một lượt.
    - Nếu bạn gửi tin nhắn trong khi thay đổi bộ chọn mô hình cho cùng phiên vẫn đang lưu, trình soạn thảo sẽ đợi bản vá phiên đó trước khi gọi `chat.send` để lượt gửi dùng mô hình đã chọn.
    - Gõ `/new` trong Control UI tạo và chuyển sang cùng phiên bảng điều khiển mới như New Chat, trừ khi `session.dmScope: "main"` được cấu hình và cha hiện tại là phiên chính của tác tử; trong trường hợp đó, nó đặt lại phiên chính tại chỗ. Gõ `/reset` giữ nguyên thao tác đặt lại tại chỗ tường minh của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trò chuyện yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó điều khiển bộ chọn, bao gồm các mục `provider/*` giữ cho catalog theo phạm vi nhà cung cấp luôn động. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` tường minh cùng các nhà cung cấp có xác thực dùng được. Catalog đầy đủ vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới có bao gồm token ngữ cảnh hiện tại, khu vực trình soạn thảo trò chuyện hiển thị chỉ báo sử dụng ngữ cảnh gọn. Nó chuyển sang kiểu cảnh báo khi áp lực ngữ cảnh cao và, ở các mức Compaction được khuyến nghị, hiển thị một nút gọn chạy đường dẫn Compaction phiên thông thường. Ảnh chụp token cũ được ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ trò chuyện thoại (thời gian thực trong trình duyệt)">
    Chế độ trò chuyện thoại dùng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.realtime.provider: "openai"` cộng với `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY`, hoặc hồ sơ OAuth `openai-codex`; cấu hình Google với `talk.realtime.provider: "google"` cộng với `talk.realtime.providers.google.apiKey`. Trình duyệt không bao giờ nhận khóa API nhà cung cấp tiêu chuẩn. OpenAI nhận một client secret Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API bị ràng buộc dùng một lần cho phiên WebSocket trong trình duyệt, với chỉ dẫn và khai báo công cụ được Gateway khóa vào token. Các nhà cung cấp chỉ lộ cầu nối thời gian thực phía backend sẽ chạy qua truyền tải chuyển tiếp của Gateway, nên thông tin xác thực và socket nhà cung cấp vẫn nằm phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.client.create` không chấp nhận ghi đè chỉ dẫn do bên gọi cung cấp.

    Trình soạn thảo Chat có nút tùy chọn Talk bên cạnh nút bắt đầu/dừng Talk. Các tùy chọn áp dụng cho phiên Talk tiếp theo và có thể ghi đè nhà cung cấp, truyền tải, mô hình, giọng nói, mức nỗ lực suy luận, ngưỡng VAD, thời lượng im lặng, và phần đệm tiền tố. Khi một tùy chọn để trống, Gateway dùng mặc định đã cấu hình nếu có hoặc mặc định của nhà cung cấp. Chọn chuyển tiếp Gateway buộc dùng đường dẫn chuyển tiếp backend; chọn WebRTC giữ phiên thuộc sở hữu client và sẽ lỗi thay vì âm thầm quay về chuyển tiếp nếu nhà cung cấp không thể tạo phiên trình duyệt.

    Trong trình soạn thảo Chat, điều khiển Talk là nút sóng bên cạnh nút đọc chính tả bằng micrô. Khi Talk bắt đầu, hàng trạng thái trình soạn thảo hiển thị `Connecting Talk...`, sau đó `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` trong khi một lời gọi công cụ thời gian thực đang tham khảo mô hình lớn hơn đã cấu hình qua `talk.client.toolCall`.

    Kiểm thử khói trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh cầu nối WebSocket backend OpenAI, trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt bằng token bị ràng buộc của Google Live, và bộ điều hợp trình duyệt chuyển tiếp Gateway với phương tiện micrô giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi nhật ký bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt theo dõi thông thường sẽ xếp hàng. Nhấp **Điều hướng** trên một tin nhắn đã xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm hủy độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy tất cả lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy chưa hoàn tất">
    - Khi một lượt chạy bị hủy, văn bản trợ lý chưa hoàn tất vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền vững văn bản trợ lý chưa hoàn tất bị hủy vào lịch sử bản ghi hội thoại khi có đầu ra đã đệm.
    - Các mục được lưu bền vững bao gồm siêu dữ liệu hủy để bên tiêu thụ bản ghi hội thoại có thể phân biệt phần hủy chưa hoàn tất với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Control UI cung cấp `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt cung cấp "Cài đặt ứng dụng" khi có thể truy cập. |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và lần nhấp thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID tự động tạo dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt được lưu bền vững.                          |

Ghi đè cặp khóa VAPID qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều máy chủ, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Control UI dùng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS iOS (xem [Cấu hình](/vi/gateway/configuration) để biết push có chuyển tiếp hỗ trợ) và phương thức `push.test` hiện có, vốn nhắm đến ghép nối di động gốc.
</Note>

## Nhúng được lưu trữ

Tin nhắn trợ lý có thể hiển thị nội dung web được lưu trữ trực tiếp bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="nghiêm ngặt">
    Tắt thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (mặc định)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập nguồn gốc; đây là mặc định và thường đủ cho các trò chơi/tiện ích trình duyệt độc lập.
  </Tab>
  <Tab title="tin cậy">
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
Chỉ dùng `trusted` khi tài liệu nhúng thực sự cần hành vi cùng nguồn gốc. Với hầu hết trò chơi do tác tử tạo và canvas tương tác, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ ý muốn `[embed url="https://..."]` tải các trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chiều rộng tin nhắn trò chuyện

Tin nhắn trò chuyện được nhóm dùng max-width mặc định dễ đọc. Các triển khai màn hình rộng có thể ghi đè mà không cần vá CSS đi kèm bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi đến trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài và phần trăm thuần như `960px` hoặc `82%`, cùng các biểu thức chiều rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (được khuyến nghị)

<Tabs>
  <Tab title="Tailscale Serve tích hợp (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Serve của Control UI/WebSocket có thể xác thực qua các header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và đối chiếu địa chỉ đó với header, đồng thời chỉ chấp nhận các yêu cầu này khi yêu cầu đi tới loopback với các header `x-forwarded-*` của Tailscale. Đối với các phiên toán tử Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép cặp thiết bị; các trình duyệt không có thiết bị và kết nối vai trò node vẫn đi theo các bước kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực shared-secret rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Đối với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử lại sai đồng thời từ cùng một trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp đơn thuần chạy đua song song.

    <Warning>
    Xác thực Serve không dùng token giả định rằng máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên máy chủ đó, hãy yêu cầu xác thực bằng token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Liên kết tới tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Dán shared secret tương ứng vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không bảo mật** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ đã được ghi tài liệu:

- khả năng tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI toán tử thành công qua `gateway.auth.mode: "trusted-proxy"`
- phá kính khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục được khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ gateway)

<AccordionGroup>
  <Accordion title="Hành vi công tắc xác thực không an toàn">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` chỉ là công tắc tương thích cục bộ:

    - Nó cho phép các phiên Control UI localhost tiếp tục mà không cần danh tính thiết bị trong các ngữ cảnh HTTP không bảo mật.
    - Nó không bỏ qua các kiểm tra ghép cặp.
    - Nó không nới lỏng các yêu cầu danh tính thiết bị từ xa (không phải localhost).

  </Accordion>
  <Accordion title="Chỉ dùng khi phá kính khẩn cấp">
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
    `dangerouslyDisableDeviceAuth` tắt các kiểm tra danh tính thiết bị Control UI và là một mức hạ cấp bảo mật nghiêm trọng. Hoàn tác nhanh sau khi dùng khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về proxy tin cậy">
    - Xác thực trusted-proxy thành công có thể cho phép các phiên Control UI **toán tử** không có danh tính thiết bị.
    - Điều này **không** mở rộng cho các phiên Control UI vai trò node.
    - Các proxy ngược loopback cùng máy vẫn không thỏa mãn xác thực trusted-proxy; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI được phát hành với chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng nguồn gốc**, URL `data:`, và URL `blob:` được tạo cục bộ. URL ảnh `http(s)` từ xa và URL ảnh tương đối theo giao thức bị trình duyệt từ chối và không tạo các lần fetch mạng.

Trong thực tế, điều này có nghĩa là:

- Avatar và hình ảnh được phục vụ dưới các đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các route avatar đã xác thực mà UI fetch và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay thế bằng logo/huy hiệu tích hợp sẵn, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt toán tử fetch ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực route avatar

Khi xác thực gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về ảnh avatar cho các bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Các yêu cầu chưa xác thực tới một trong hai route đều bị từ chối (khớp với route assistant-media cùng cấp). Điều này ngăn route avatar làm rò rỉ danh tính agent trên các máy chủ vốn được bảo vệ.
- Control UI tự chuyển tiếp token gateway dưới dạng header bearer khi fetch avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong bảng điều khiển.

Nếu bạn tắt xác thực gateway (không được khuyến nghị trên máy chủ dùng chung), route avatar cũng trở thành không cần xác thực, phù hợp với phần còn lại của gateway.

## Xác thực route phương tiện assistant

Khi xác thực gateway được cấu hình, bản xem trước phương tiện cục bộ của assistant dùng route hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực toán tử Control UI thông thường. Trình duyệt gửi token gateway dưới dạng header bearer khi kiểm tra tính khả dụng.
- Các phản hồi siêu dữ liệu thành công bao gồm một `mediaTicket` ngắn hạn, được giới hạn cho đúng đường dẫn nguồn đó.
- URL hình ảnh, âm thanh, video và tài liệu do trình duyệt hiển thị dùng `mediaTicket=<ticket>` thay vì token gateway hoặc mật khẩu đang hoạt động. Vé hết hạn nhanh và không thể cấp quyền cho một nguồn khác.

Điều này giữ cho việc render phương tiện thông thường tương thích với các phần tử phương tiện gốc của trình duyệt mà không đặt thông tin xác thực gateway có thể tái sử dụng trong các URL phương tiện hiển thị được.

## Xây dựng UI

Gateway phục vụ các tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

```bash
pnpm ui:build
```

Base tuyệt đối tùy chọn (khi bạn muốn URL tài nguyên cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Đối với phát triển cục bộ (máy chủ dev riêng):

```bash
pnpm ui:dev
```

Sau đó trỏ UI tới URL WS Gateway của bạn (ví dụ `ws://127.0.0.1:18789`).

## Trang Control UI trống

Nếu trình duyệt tải bảng điều khiển trống và DevTools không hiển thị lỗi hữu ích, một tiện ích mở rộng hoặc content script chạy sớm có thể đã ngăn ứng dụng mô-đun JavaScript được đánh giá. Trang tĩnh bao gồm một bảng khôi phục HTML thuần xuất hiện khi `<openclaw-app>` chưa được đăng ký sau khi khởi động.

Dùng hành động **Thử lại** của bảng sau khi thay đổi môi trường trình duyệt, hoặc tải lại thủ công sau các kiểm tra này:

- Tắt các tiện ích mở rộng chèn vào tất cả các trang, đặc biệt là các tiện ích mở rộng có content script `<all_urls>`.
- Thử cửa sổ riêng tư, hồ sơ trình duyệt sạch, hoặc trình duyệt khác.
- Giữ Gateway chạy và xác minh cùng URL bảng điều khiển sau khi thay đổi trình duyệt.

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Control UI là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với nguồn gốc HTTP. Điều này hữu ích khi bạn muốn máy chủ dev Vite chạy cục bộ nhưng Gateway chạy ở nơi khác.

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
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - `token` nên được truyền qua fragment URL (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi tới máy chủ, giúp tránh rò rỉ nhật ký yêu cầu và Referer. Các tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ như phương án dự phòng, và bị loại bỏ ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không quay lại thông tin xác thực từ cấu hình hoặc môi trường. Cung cấp `token` (hoặc `password`) một cách rõ ràng. Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không được nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải loopback phải đặt `gateway.controlUi.allowedOrigins` rõ ràng (nguồn gốc đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Khởi động Gateway có thể gieo các nguồn gốc cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng nguồn gốc trình duyệt từ xa vẫn cần các mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi nguồn gốc trình duyệt, không phải "khớp với bất cứ host nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ dự phòng nguồn gốc theo header Host, nhưng đây là chế độ bảo mật nguy hiểm.

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
- [Kiểm tra sức khỏe](/vi/gateway/health) — giám sát sức khỏe gateway
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện trò chuyện dựa trên trình duyệt
