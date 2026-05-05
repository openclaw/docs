---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-05T06:20:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: d249559d26ef8d257a14b104a797442e9fbb67a8ab31c7fcc9eaa4127f29c933
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện điều khiển là một ứng dụng đơn trang nhỏ dùng **Vite + Lit** được phục vụ bởi Gateway:

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
- tiêu đề định danh proxy tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của bảng điều khiển giữ một token cho phiên tab trình duyệt hiện tại và URL Gateway đã chọn; mật khẩu không được lưu. Quy trình thiết lập ban đầu thường tạo một token Gateway cho xác thực bí mật dùng chung ở lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép đôi thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Giao diện điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép đôi một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "đã ngắt kết nối (1008): yêu cầu ghép đôi"

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

Nếu trình duyệt thử lại ghép đôi với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép đôi và bạn đổi từ quyền đọc sang quyền ghi/quản trị, việc này được xử lý như một nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ còn hiệu lực, chặn lần kết nối lại với phạm vi rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không cần phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

<Note>
- Kết nối trình duyệt qua local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép đôi cho phiên vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, định danh Tailscale xác minh thành công, và trình duyệt trình bày định danh thiết bị của nó.
- Liên kết Tailnet trực tiếp, kết nối trình duyệt qua LAN, và hồ sơ trình duyệt không có định danh thiết bị vẫn cần phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị riêng, nên việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép đôi lại.

</Note>

## Định danh cá nhân (cục bộ theo trình duyệt)

Giao diện điều khiển hỗ trợ một định danh cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được gắn vào tin nhắn gửi đi để ghi nhận tác giả trong các phiên dùng chung. Định danh này nằm trong bộ nhớ trình duyệt, được giới hạn theo hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hoặc lưu phía máy chủ ngoài siêu dữ liệu tác giả bản ghi thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại nó về trống.

Mẫu cục bộ theo trình duyệt tương tự áp dụng cho phần ghi đè ảnh đại diện trợ lý. Ảnh đại diện trợ lý được tải lên sẽ phủ lên định danh do Gateway phân giải chỉ trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn có sẵn cho các máy khách không phải UI ghi trực tiếp trường này (chẳng hạn Gateway theo kịch bản hoặc bảng điều khiển tùy chỉnh).

## Endpoint cấu hình thời gian chạy

Giao diện điều khiển lấy cài đặt thời gian chạy từ `/__openclaw/control-ui-config.json`. Endpoint đó được bảo vệ bởi cùng cơ chế xác thực Gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và một lần lấy thành công yêu cầu token/mật khẩu Gateway đã hợp lệ, định danh Tailscale Serve, hoặc định danh proxy tin cậy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự bản địa hóa trong lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè về sau, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn ngôn ngữ nằm trong thẻ Truy cập Gateway, không nằm trong Giao diện.

- Ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại ở các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ ngôn ngữ không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã ngôn ngữ mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề tích hợp Claw, Knot, và Dash, cùng một khe nhập tweakcn cục bộ theo trình duyệt. Để nhập một chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Trình nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình Gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một khe cục bộ; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Trò chuyện và nói chuyện">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Nói chuyện qua các phiên thời gian thực của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần bị ràng buộc qua WebSocket, và các Plugin thoại thời gian thực chỉ ở backend dùng transport chuyển tiếp của Gateway. Relay giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt truyền microphone PCM qua RPC `talk.realtime.relay*` và gửi lệnh gọi công cụ `openclaw_agent_consult` trở lại qua `chat.send` cho mô hình OpenClaw lớn hơn đã cấu hình.
    - Truyền trực tuyến lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện tác tử).

  </Accordion>
  <Accordion title="Kênh, phiên bản, phiên, giấc mơ">
    - Kênh: tích hợp sẵn cùng trạng thái kênh Plugin đi kèm/bên ngoài, đăng nhập QR, và cấu hình theo kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: danh sách + ghi đè mô hình/suy nghĩ/nhanh/chi tiết/truy vết/lập luận theo từng phiên (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái Dreaming, bật/tắt, và trình đọc Nhật ký giấc mơ (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, node, phê duyệt exec">
    - Tác vụ Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: liệt kê + khả năng (`node.list`).
    - Phê duyệt exec: sửa allowlist Gateway hoặc node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các lần ghi bao gồm bộ bảo vệ base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; ref đang hoạt động đã gửi nhưng chưa phân giải sẽ bị từ chối trước khi ghi.
    - Kết xuất schema + biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI phù hợp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các node đối tượng lồng nhau/ký tự đại diện/mảng/thành phần, cùng schema Plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ có sẵn khi snapshot có vòng khứ hồi thô an toàn.
    - Nếu một snapshot không thể thực hiện vòng khứ hồi văn bản thô an toàn, Giao diện điều khiển buộc dùng chế độ Biểu mẫu và vô hiệu hóa chế độ Thô cho snapshot đó.
    - "Đặt lại về bản đã lưu" của trình chỉnh sửa JSON thô giữ nguyên hình dạng do tác giả thô tạo (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại một snapshot đã làm phẳng, nên chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể thực hiện vòng khứ hồi an toàn.
    - Các giá trị đối tượng SecretRef có cấu trúc được hiển thị chỉ đọc trong ô nhập văn bản của biểu mẫu để ngăn vô tình làm hỏng đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Giao diện điều khiển cùng các mục về độ phản hồi của trình duyệt cho khung hình hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các loại mục PerformanceObserver đó.
    - Nhật ký: tail trực tiếp nhật ký tệp Gateway với bộ lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) kèm báo cáo khởi động lại, rồi thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản Gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng tác vụ Cron">
    - Với tác vụ biệt lập, phương thức gửi mặc định là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ dùng nội bộ.
    - Trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` đặt thành một URL Webhook HTTP(S) hợp lệ.
    - Với tác vụ phiên chính, có sẵn chế độ gửi Webhook và không gửi.
    - Điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè tác tử, tùy chọn cron chính xác/rải đều, ghi đè mô hình/suy nghĩ của tác tử, và bật/tắt gửi nỗ lực tối đa.
    - Xác thực biểu mẫu là nội tuyến với lỗi cấp trường; giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi token bearer chuyên dụng; nếu bỏ qua, Webhook được gửi không có tiêu đề xác thực.
    - Dự phòng không khuyến nghị: tác vụ cũ đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`.
    - Tải lên trong trò chuyện chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để bảo đảm an toàn cho UI. Khi các mục bản ghi trò chuyện quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay các tin nhắn quá khổ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý/tạo sinh được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào việc payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - Khi kết xuất `chat.history`, Control UI loại bỏ khỏi văn bản trợ lý hiển thị các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML lời gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lời gọi công cụ bị cắt ngắn), cũng như các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, đồng thời bỏ qua các mục trợ lý mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong khi một lượt gửi đang hoạt động và trong lần làm mới lịch sử cuối cùng, chế độ xem trò chuyện giữ các tin nhắn người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` thoáng trả về một ảnh chụp cũ hơn; bản ghi trò chuyện chuẩn sẽ thay thế các tin nhắn cục bộ đó sau khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái phân phối, còn `chat.history` được dựng lại từ bản ghi phiên bền vững. Sau các sự kiện tool-final, Control UI tải lại lịch sử và chỉ hợp nhất một phần đuôi lạc quan nhỏ; ranh giới bản ghi trò chuyện được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` nối thêm một ghi chú trợ lý vào bản ghi phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không có lượt chạy tác tử, không phân phối qua kênh).
    - Tiêu đề trò chuyện hiển thị bộ lọc tác tử trước bộ chọn phiên, và bộ chọn phiên được giới hạn theo tác tử đã chọn. Chuyển tác tử chỉ hiển thị các phiên gắn với tác tử đó và quay về phiên chính của tác tử đó khi nó chưa có phiên bảng điều khiển đã lưu nào.
    - Trên độ rộng desktop, các điều khiển trò chuyện nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi trò chuyện; cuộn lên, quay lại đầu trang, hoặc chạm đáy sẽ khôi phục các điều khiển.
    - Các tin nhắn chỉ có văn bản trùng lặp liên tiếp được kết xuất thành một bong bóng với huy hiệu số lượng. Tin nhắn có hình ảnh, tệp đính kèm, đầu ra công cụ, hoặc bản xem trước canvas không bị gộp.
    - Bộ chọn mô hình và chế độ suy nghĩ ở tiêu đề trò chuyện vá phiên đang hoạt động ngay lập tức qua `sessions.patch`; chúng là ghi đè phiên bền vững, không phải tùy chọn gửi chỉ cho một lượt.
    - Nhập `/new` trong Control UI sẽ tạo và chuyển sang cùng phiên bảng điều khiển mới như New Chat. Nhập `/reset` giữ thao tác đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trò chuyện yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng các nhà cung cấp có xác thực khả dụng. Danh mục đầy đủ vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới cho thấy áp lực ngữ cảnh cao, khu vực trình soạn trò chuyện hiển thị thông báo ngữ cảnh và, ở các mức Compaction được khuyến nghị, một nút gọn chạy đường dẫn Compaction phiên thông thường. Các ảnh chụp nhanh token cũ được ẩn cho đến khi Gateway báo cáo mức sử dụng mới trở lại.

  </Accordion>
  <Accordion title="Chế độ trò chuyện thoại (thời gian thực trong trình duyệt)">
    Chế độ trò chuyện thoại dùng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.provider: "openai"` cộng với `talk.providers.openai.apiKey`, hoặc cấu hình Google với `talk.provider: "google"` cộng với `talk.providers.google.apiKey`; cấu hình nhà cung cấp thời gian thực Voice Call vẫn có thể được tái sử dụng làm phương án dự phòng. Trình duyệt không bao giờ nhận khóa API nhà cung cấp tiêu chuẩn. OpenAI nhận một Realtime client secret tạm thời cho WebRTC. Google Live nhận một token xác thực Live API giới hạn dùng một lần cho phiên WebSocket trình duyệt, với hướng dẫn và khai báo công cụ được Gateway khóa vào token. Những nhà cung cấp chỉ phơi bày cầu nối thời gian thực backend chạy qua vận chuyển chuyển tiếp Gateway, vì vậy thông tin xác thực và socket của nhà cung cấp ở phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime do Gateway lắp ráp; `talk.realtime.session` không chấp nhận ghi đè hướng dẫn do bên gọi cung cấp.

    Trong trình soạn Chat, điều khiển Talk là nút sóng cạnh nút đọc chính tả bằng microphone. Khi Talk bắt đầu, hàng trạng thái trình soạn hiển thị `Connecting Talk...`, rồi `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` trong khi một lời gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình qua `chat.send`.

    Kiểm thử khói trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt Google Live bằng token giới hạn, và bộ điều hợp trình duyệt chuyển tiếp Gateway với phương tiện microphone giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi nhật ký bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt theo dõi thông thường sẽ được xếp hàng. Nhấp **Điều hướng** trên một tin nhắn đã xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Nhập `/stop` (hoặc các cụm từ hủy độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy tất cả lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy một phần">
    - Khi một lượt chạy bị hủy, văn bản trợ lý một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền vững văn bản trợ lý một phần bị hủy vào lịch sử bản ghi trò chuyện khi có đầu ra đã đệm.
    - Các mục được lưu bền vững bao gồm siêu dữ liệu hủy để người tiêu thụ bản ghi trò chuyện có thể phân biệt phần hủy một phần với đầu ra hoàn tất bình thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và Web Push

Control UI đi kèm một `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt đề xuất "Cài đặt ứng dụng" khi nó có thể truy cập được. |
| `ui/public/sw.js`                                     | Service worker xử lý sự kiện `push` và các lần nhấp thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo dùng để ký payload Web Push. |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt được lưu bền vững. |

Ghi đè cặp khóa VAPID qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều máy chủ, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Control UI dùng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi một thông báo kiểm thử tới đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS iOS (xem [Cấu hình](/vi/gateway/configuration) cho push dựa trên chuyển tiếp) và phương thức `push.test` hiện có, vốn nhắm tới ghép đôi di động gốc.
</Note>

## Nhúng được lưu trữ

Tin nhắn trợ lý có thể kết xuất nội dung web được lưu trữ nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="nghiêm ngặt">
    Tắt thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="script (mặc định)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cách ly origin; đây là mặc định và thường đủ cho các trò chơi/widget trình duyệt tự chứa.
  </Tab>
  <Tab title="đáng tin cậy">
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
Chỉ dùng `trusted` khi tài liệu được nhúng thật sự cần hành vi cùng origin. Với hầu hết trò chơi do tác tử tạo và canvas tương tác, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ ý muốn `[embed url="https://..."]` tải các trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Độ rộng tin nhắn trò chuyện

Tin nhắn trò chuyện được nhóm dùng max-width mặc định dễ đọc. Các triển khai màn hình rộng có thể ghi đè nó mà không cần vá CSS đóng gói bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi tới trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài thuần và phần trăm như `960px` hoặc `82%`, cùng các biểu thức độ rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (được khuyến nghị)

<Tabs>
  <Tab title="Tailscale Serve tích hợp (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, đồng thời chỉ chấp nhận các yêu cầu này khi yêu cầu chạm loopback với các header `x-forwarded-*` của Tailscale. Với các phiên người vận hành Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép đôi thiết bị; trình duyệt không có thiết bị và kết nối vai trò nút vẫn tuân theo các kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực shared-secret rõ ràng ngay cả cho lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thuần chạy đua song song.

    <Warning>
    Xác thực Serve không token giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên máy chủ đó, hãy yêu cầu xác thực token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Liên kết với tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Dán shared secret khớp vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối UI điều khiển không có danh tính thiết bị.

Các ngoại lệ đã được ghi tài liệu:

- khả năng tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực UI điều khiển của operator thành công thông qua `gateway.auth.mode: "trusted-proxy"`
- tùy chọn khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục được khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ Gateway)

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

    `allowInsecureAuth` chỉ là công tắc tương thích cục bộ:

    - Nó cho phép các phiên UI điều khiển trên localhost tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không an toàn.
    - Nó không bỏ qua các bước kiểm tra ghép nối.
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
    `dangerouslyDisableDeviceAuth` tắt các bước kiểm tra danh tính thiết bị của UI điều khiển và là một mức hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh chóng sau khi dùng trong tình huống khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Xác thực trusted-proxy thành công có thể cho phép các phiên UI điều khiển của **operator** không cần danh tính thiết bị.
    - Điều này **không** áp dụng cho các phiên UI điều khiển với vai trò node.
    - Reverse proxy local loopback cùng máy vẫn không đáp ứng xác thực trusted-proxy; xem [Xác thực trusted proxy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

UI điều khiển được phát hành với chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng nguồn gốc**, URL `data:`, và URL `blob:` được tạo cục bộ. URL ảnh `http(s)` từ xa và URL ảnh tương đối theo giao thức bị trình duyệt từ chối và không phát sinh lượt tải mạng.

Điều này có nghĩa là trong thực tế:

- Avatar và hình ảnh được phục vụ dưới đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm cả các route avatar đã xác thực mà UI tải và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do UI điều khiển tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra sẽ bị loại bỏ tại các helper avatar của UI điều khiển và được thay bằng logo/huy hiệu tích hợp sẵn, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của operator tải ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực route avatar

Khi xác thực gateway được cấu hình, endpoint avatar của UI điều khiển yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về ảnh avatar cho caller đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Các yêu cầu chưa xác thực tới một trong hai route đều bị từ chối (khớp với route assistant-media cùng cấp). Điều này ngăn route avatar làm rò rỉ danh tính agent trên các máy chủ vốn được bảo vệ.
- Bản thân UI điều khiển chuyển tiếp token gateway dưới dạng bearer header khi tải avatar, và dùng URL blob đã xác thực để ảnh vẫn hiển thị trong bảng điều khiển.

Nếu bạn tắt xác thực gateway (không được khuyến nghị trên máy chủ dùng chung), route avatar cũng trở thành không cần xác thực, phù hợp với phần còn lại của gateway.

## Xác thực route media của assistant

Khi xác thực gateway được cấu hình, bản xem trước local-media của assistant dùng một route hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực operator UI điều khiển thông thường. Trình duyệt gửi token gateway dưới dạng bearer header khi kiểm tra tính sẵn có.
- Phản hồi siêu dữ liệu thành công bao gồm một `mediaTicket` ngắn hạn, được giới hạn cho đúng đường dẫn nguồn đó.
- URL ảnh, âm thanh, video và tài liệu do trình duyệt hiển thị dùng `mediaTicket=<ticket>` thay vì token hoặc mật khẩu gateway đang hoạt động. Vé hết hạn nhanh và không thể cấp quyền cho nguồn khác.

Điều này giữ cho việc hiển thị media thông thường tương thích với các phần tử media gốc của trình duyệt mà không đặt thông tin đăng nhập gateway có thể tái sử dụng trong URL media nhìn thấy được.

## Xây dựng UI

Gateway phục vụ các tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

```bash
pnpm ui:build
```

Base tuyệt đối tùy chọn (khi bạn muốn URL tài nguyên cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Cho phát triển cục bộ (máy chủ dev riêng):

```bash
pnpm ui:dev
```

Sau đó trỏ UI tới URL Gateway WS của bạn (ví dụ `ws://127.0.0.1:18789`).

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

UI điều khiển là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với origin HTTP. Điều này hữu ích khi bạn muốn máy chủ dev Vite chạy cục bộ nhưng Gateway chạy ở nơi khác.

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
    - `gatewayUrl` được lưu trong localStorage sau khi tải và được xóa khỏi URL.
    - Nếu bạn truyền endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy URL-encode giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - `token` nên được truyền qua URL fragment (`#token=...`) khi có thể. Fragment không được gửi tới máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ dùng làm fallback và bị loại bỏ ngay sau khi bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin đăng nhập từ cấu hình hoặc môi trường. Hãy cung cấp `token` (hoặc `password`) rõ ràng. Thiếu thông tin đăng nhập rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai UI điều khiển không phải loopback phải đặt `gateway.controlUi.allowedOrigins` rõ ràng (origin đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Khi khởi động, Gateway có thể gieo sẵn các origin cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng origin trình duyệt từ xa vẫn cần mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi origin trình duyệt, không phải "khớp với bất kỳ máy chủ nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback origin theo Host-header, nhưng đây là chế độ bảo mật nguy hiểm.

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
- [TUI](/vi/web/tui) — giao diện người dùng trong terminal
- [WebChat](/vi/web/webchat) — giao diện trò chuyện dựa trên trình duyệt
