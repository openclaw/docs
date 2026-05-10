---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển dựa trên trình duyệt cho Gateway (trò chuyện, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-10T19:56:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb158d1b6b92b7097fe7ba8d61aee5d6c6e67a8d45fc2cb2514c555ef3e52d81
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện Điều khiển là một ứng dụng một trang **Vite + Lit** nhỏ do Gateway phục vụ:

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

Bảng cài đặt dashboard giữ token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu bền vững. Onboarding thường tạo một token gateway để xác thực bằng bí mật chung trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Giao diện Điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép nối một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Liệt kê yêu cầu đang chờ">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Phê duyệt theo ID yêu cầu">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Nếu trình duyệt thử ghép nối lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép nối và bạn đổi từ quyền đọc sang quyền ghi/quản trị, việc này được xem là nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ đang hoạt động, chặn kết nối lại với phạm vi rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không yêu cầu phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết về xoay vòng và thu hồi token.

<Note>
- Các kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép nối cho các phiên vận hành Giao diện Điều khiển khi `gateway.auth.allowTailscale: true`, định danh Tailscale xác minh thành công, và trình duyệt xuất trình định danh thiết bị của nó.
- Các bind Tailnet trực tiếp, kết nối trình duyệt LAN, và hồ sơ trình duyệt không có định danh thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, nên việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

</Note>

## Định danh cá nhân (cục bộ trên trình duyệt)

Giao diện Điều khiển hỗ trợ định danh cá nhân theo từng trình duyệt (tên hiển thị và avatar) gắn vào tin nhắn gửi đi để ghi nhận tác giả trong các phiên dùng chung. Định danh này nằm trong bộ nhớ trình duyệt, được giới hạn trong hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hay lưu bền vững phía máy chủ ngoài siêu dữ liệu tác giả bản ghi thông thường trên các tin nhắn bạn thực sự gửi. Việc xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại nó về trống.

Mẫu cục bộ trên trình duyệt tương tự áp dụng cho ghi đè avatar trợ lý. Avatar trợ lý được tải lên chỉ phủ lên định danh do gateway phân giải trên trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn khả dụng cho các máy khách không phải UI ghi trực tiếp vào trường này (chẳng hạn gateway được viết script hoặc dashboard tùy chỉnh).

## Endpoint cấu hình runtime

Giao diện Điều khiển lấy cài đặt runtime từ `/__openclaw/control-ui-config.json`. Endpoint đó được bảo vệ bởi cùng xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và lần lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, định danh Tailscale Serve, hoặc định danh proxy tin cậy.

## Hỗ trợ ngôn ngữ

Giao diện Điều khiển có thể tự bản địa hóa trong lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn ngôn ngữ nằm trong thẻ Truy cập Gateway, không nằm trong Giao diện.

- Ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Bản dịch không phải tiếng Anh được lazy-load trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng tập ngôn ngữ không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã ngôn ngữ mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo phát hành; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot, và Dash tích hợp, cùng một ô nhập tweakcn cục bộ trên trình duyệt. Để nhập chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, và dán liên kết chủ đề đã sao chép vào Giao diện. Bộ nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một ô cục bộ đó; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Trò chuyện và Nói chuyện">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Làm mới lịch sử trò chuyện yêu cầu một cửa sổ gần đây có giới hạn với giới hạn văn bản theo từng tin nhắn, để các phiên lớn không buộc trình duyệt render toàn bộ payload bản ghi trước khi trò chuyện trở nên dùng được.
    - Nói chuyện qua các phiên realtime của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt dùng một lần có giới hạn qua WebSocket, và các Plugin giọng nói realtime chỉ backend dùng truyền tải chuyển tiếp của Gateway. Các phiên provider do máy khách sở hữu bắt đầu bằng `talk.client.create`; các phiên chuyển tiếp Gateway bắt đầu bằng `talk.session.create`. Chuyển tiếp giữ thông tin xác thực provider trên Gateway trong khi trình duyệt stream PCM micro qua `talk.session.appendAudio` và chuyển tiếp các lệnh gọi công cụ provider `openclaw_agent_consult` qua `talk.client.toolCall` để áp dụng chính sách Gateway và mô hình OpenClaw lớn hơn đã cấu hình.
    - Stream lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện agent).

  </Accordion>
  <Accordion title="Kênh, instance, phiên, giấc mơ">
    - Kênh: trạng thái kênh Plugin tích hợp cộng với Plugin đi kèm/bên ngoài, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Làm mới probe kênh giữ snapshot trước đó hiển thị trong khi kiểm tra provider chậm hoàn tất, và snapshot một phần được gắn nhãn khi một probe hoặc kiểm toán vượt quá ngân sách UI của nó.
    - Instance: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: liệt kê phiên agent đã cấu hình theo mặc định, quay lui từ các khóa phiên agent chưa cấu hình đã cũ, và áp dụng ghi đè mô hình/thinking/fast/verbose/trace/reasoning theo từng phiên (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái dreaming, công tắc bật/tắt, và trình đọc Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, phê duyệt exec">
    - Công việc Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: liệt kê + khả năng (`node.list`).
    - Phê duyệt exec: sửa danh sách cho phép gateway hoặc node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các lần ghi bao gồm bộ bảo vệ base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Schema + render biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các node object/wildcard/array/composition lồng nhau, cộng với schema Plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ khả dụng khi snapshot có thể round-trip thô an toàn.
    - Nếu một snapshot không thể round-trip văn bản thô an toàn, Giao diện Điều khiển buộc chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - Trình chỉnh sửa JSON thô "Đặt lại về bản đã lưu" giữ nguyên hình dạng do người viết thô tạo (định dạng, bình luận, bố cục `$include`) thay vì render lại một snapshot đã làm phẳng, nên các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể round-trip an toàn.
    - Giá trị object SecretRef có cấu trúc được render chỉ đọc trong ô nhập văn bản biểu mẫu để tránh vô tình làm hỏng object thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Giao diện Điều khiển, thời gian render trò chuyện/cấu hình chậm, và mục phản hồi trình duyệt cho frame hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các loại mục PerformanceObserver đó.
    - Nhật ký: tail trực tiếp nhật ký file gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) kèm báo cáo khởi động lại, sau đó poll `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng công việc Cron">
    - Với các công việc tách biệt, mặc định gửi là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ nội bộ.
    - Trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` đặt thành một URL webhook HTTP(S) hợp lệ.
    - Với các công việc phiên chính, các chế độ gửi webhook và không gửi đều khả dụng.
    - Điều khiển chỉnh sửa nâng cao bao gồm xóa-sau-khi-chạy, xóa ghi đè agent, tùy chọn cron chính xác/so le, ghi đè mô hình/thinking của agent, và công tắc gửi best-effort.
    - Xác thực biểu mẫu nằm nội tuyến với lỗi cấp trường; giá trị không hợp lệ sẽ tắt nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi token bearer chuyên dụng; nếu bỏ qua, webhook được gửi không có tiêu đề xác thực.
    - Dự phòng đã ngừng khuyến nghị: các công việc legacy đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: xác nhận ngay với `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`.
    - Tải lên trong chat chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` bị giới hạn kích thước để bảo đảm an toàn cho UI. Khi các mục bản ghi hội thoại quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng và thay thế các tin nhắn quá khổ bằng một phần giữ chỗ (`[chat.history omitted: message too large]`).
    - Hình ảnh do assistant/tạo sinh được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua các URL phương tiện Gateway đã xác thực, vì vậy việc tải lại không phụ thuộc vào việc payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử chat.
    - Khi hiển thị `chat.history`, Control UI loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản assistant thấy được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cũng như các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục assistant mà toàn bộ văn bản thấy được chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong khi một lượt gửi đang hoạt động và khi làm mới lịch sử cuối cùng, chế độ xem chat giữ các tin nhắn người dùng/assistant lạc quan cục bộ hiển thị nếu `chat.history` thoáng trả về một ảnh chụp cũ hơn; bản ghi hội thoại chuẩn sẽ thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái phân phối, còn `chat.history` được dựng lại từ bản ghi hội thoại phiên bền vững. Sau các sự kiện kết thúc công cụ, Control UI tải lại lịch sử và chỉ hợp nhất một phần đuôi lạc quan nhỏ; ranh giới bản ghi hội thoại được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` thêm một ghi chú assistant vào bản ghi hội thoại phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không chạy agent, không phân phối kênh).
    - Tiêu đề chat hiển thị bộ lọc agent trước bộ chọn phiên, và bộ chọn phiên được giới hạn theo agent đã chọn. Chuyển agent chỉ hiển thị các phiên gắn với agent đó và quay về phiên chính của agent đó khi nó chưa có phiên dashboard đã lưu nào.
    - Trên chiều rộng desktop, các điều khiển chat nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi hội thoại; cuộn lên, quay lại đầu trang hoặc tới cuối trang sẽ khôi phục các điều khiển.
    - Các tin nhắn chỉ có văn bản trùng lặp liên tiếp được hiển thị thành một bong bóng với huy hiệu số lượng. Tin nhắn mang hình ảnh, tệp đính kèm, đầu ra công cụ hoặc bản xem trước canvas sẽ không bị thu gọn.
    - Bộ chọn mô hình và thinking trong tiêu đề chat vá phiên đang hoạt động ngay lập tức thông qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ dùng cho một lượt.
    - Nếu bạn gửi tin nhắn trong khi một thay đổi bộ chọn mô hình cho cùng phiên vẫn đang lưu, trình soạn thảo sẽ chờ bản vá phiên đó trước khi gọi `chat.send` để lượt gửi dùng mô hình đã chọn.
    - Gõ `/new` trong Control UI sẽ tạo và chuyển sang cùng một phiên dashboard mới như New Chat, trừ khi `session.dmScope: "main"` được cấu hình và phiên cha hiện tại là phiên chính của agent; trong trường hợp đó, nó đặt lại phiên chính tại chỗ. Gõ `/reset` giữ nguyên thao tác đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình chat yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó sẽ điều khiển bộ chọn, bao gồm các mục `provider/*` giữ cho danh mục theo phạm vi provider luôn động. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng các provider có xác thực khả dụng. Danh mục đầy đủ vẫn có sẵn thông qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo mức sử dụng phiên Gateway mới có bao gồm token ngữ cảnh hiện tại, vùng trình soạn thảo chat hiển thị một chỉ báo mức sử dụng ngữ cảnh gọn. Nó chuyển sang kiểu cảnh báo khi áp lực ngữ cảnh cao và, ở các mức Compaction được khuyến nghị, hiển thị một nút gọn chạy đường dẫn Compaction phiên thông thường. Ảnh chụp token cũ bị ẩn cho tới khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ trò chuyện thoại (thời gian thực trong trình duyệt)">
    Chế độ trò chuyện thoại sử dụng một provider giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.realtime.provider: "openai"` cùng với `talk.realtime.providers.openai.apiKey`, `OPENAI_API_KEY`, hoặc một hồ sơ OAuth `openai-codex`; cấu hình Google với `talk.realtime.provider: "google"` cùng với `talk.realtime.providers.google.apiKey`. Trình duyệt không bao giờ nhận khóa API provider tiêu chuẩn. OpenAI nhận một khóa bí mật client Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API bị ràng buộc dùng một lần cho phiên WebSocket trình duyệt, với hướng dẫn và khai báo công cụ được Gateway khóa vào token. Các provider chỉ cung cấp cầu nối thời gian thực backend chạy qua transport chuyển tiếp của Gateway, để thông tin xác thực và socket nhà cung cấp nằm ở phía server trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Lời nhắc phiên Realtime được Gateway lắp ráp; `talk.client.create` không chấp nhận các ghi đè hướng dẫn do bên gọi cung cấp.

    Trình soạn thảo Chat có một nút tùy chọn Talk bên cạnh nút bắt đầu/dừng Talk. Các tùy chọn áp dụng cho phiên Talk tiếp theo và có thể ghi đè provider, transport, mô hình, giọng nói, mức nỗ lực suy luận, ngưỡng VAD, thời lượng im lặng và phần đệm tiền tố. Khi một tùy chọn để trống, Gateway dùng các mặc định đã cấu hình nếu có, hoặc mặc định của provider. Chọn Gateway relay buộc dùng đường dẫn chuyển tiếp backend; chọn WebRTC giữ phiên do client sở hữu và sẽ lỗi thay vì âm thầm quay về relay nếu provider không thể tạo phiên trình duyệt.

    Trong trình soạn thảo Chat, điều khiển Talk là nút sóng nằm cạnh nút chính tả bằng micro. Khi Talk bắt đầu, hàng trạng thái trình soạn thảo hiển thị `Connecting Talk...`, sau đó là `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình thông qua `talk.client.toolCall`.

    Kiểm thử khói trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh cầu nối WebSocket backend OpenAI, trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt bằng token bị ràng buộc của Google Live và bộ chuyển đổi trình duyệt Gateway relay với phương tiện micro giả. Lệnh chỉ in trạng thái provider và không ghi log bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Bấm **Stop** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các phản hồi tiếp theo thông thường sẽ được xếp hàng. Bấm **Steer** trên một tin nhắn đã xếp hàng để chèn phản hồi tiếp theo đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy bỏ ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy bỏ tất cả các lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy bỏ một phần">
    - Khi một lượt chạy bị hủy bỏ, văn bản assistant một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền vững văn bản assistant một phần đã bị hủy bỏ vào lịch sử bản ghi hội thoại khi có đầu ra đã được đệm.
    - Các mục được lưu bền vững bao gồm siêu dữ liệu hủy bỏ để bên tiêu thụ bản ghi hội thoại có thể phân biệt các phần hủy bỏ một phần với đầu ra hoàn tất bình thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và Web Push

Control UI đi kèm một `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt đề xuất "Install app" khi có thể truy cập. |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và lượt bấm thông báo.     |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo, dùng để ký payload Web Push.      |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt được lưu bền vững.                |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều host, xoay vòng bí mật hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Control UI dùng các phương thức Gateway được giới hạn theo phạm vi sau để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi một thông báo kiểm thử tới đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn relay APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) để biết push dựa trên relay) và phương thức `push.test` hiện có, vốn nhắm tới ghép đôi di động gốc.
</Note>

## Bản nhúng được lưu trữ

Tin nhắn của trợ lý có thể hiển thị nội dung web được lưu trữ ngay trong dòng bằng shortcode `[embed ...]`. Chính sách sandbox của iframe được kiểm soát bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong các bản nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (default)">
    Cho phép các bản nhúng tương tác trong khi vẫn giữ cách ly origin; đây là mặc định và thường đủ cho các trò chơi/widget trình duyệt độc lập.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thật sự cần hành vi cùng origin. Với hầu hết trò chơi và canvas tương tác do tác tử tạo, `scripts` là lựa chọn an toàn hơn.
</Warning>

Các URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ ý muốn `[embed url="https://..."]` tải các trang của bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chiều rộng tin nhắn trò chuyện

Các tin nhắn trò chuyện được nhóm dùng chiều rộng tối đa mặc định dễ đọc. Các triển khai trên màn hình rộng có thể ghi đè giá trị này mà không cần vá CSS đi kèm bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi tới trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài và phần trăm thuần như `960px` hoặc `82%`, cùng với các biểu thức chiều rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` và `fit-content(...)`.

## Truy cập Tailnet (khuyến nghị)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua tiêu đề danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` bằng `tailscale whois` và đối chiếu với tiêu đề, đồng thời chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với các tiêu đề `x-forwarded-*` của Tailscale. Đối với các phiên người vận hành Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép đôi thiết bị; các trình duyệt không có thiết bị và kết nối vai trò node vẫn đi theo các bước kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực shared-secret rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng một IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử sai đồng thời từ cùng một trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thông thường chạy đua song song.

    <Warning>
    Xác thực Serve không token giả định máy chủ Gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên máy chủ đó, hãy yêu cầu xác thực token/mật khẩu.
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

Nếu bạn mở dashboard qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ đã được ghi tài liệu:

- khả năng tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI của người vận hành thành công qua `gateway.auth.mode: "trusted-proxy"`
- phương án khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

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

    `allowInsecureAuth` chỉ là nút bật/tắt tương thích cục bộ:

    - Nó cho phép các phiên Control UI trên localhost tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không an toàn.
    - Nó không bỏ qua các bước kiểm tra ghép đôi.
    - Nó không nới lỏng các yêu cầu danh tính thiết bị từ xa (không phải localhost).

  </Accordion>
  <Accordion title="Chỉ dùng khi khẩn cấp">
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
    `dangerouslyDisableDeviceAuth` vô hiệu hóa các bước kiểm tra danh tính thiết bị của Control UI và là một mức hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh sau khi dùng trong trường hợp khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về trusted-proxy">
    - Xác thực trusted-proxy thành công có thể cho phép các phiên Control UI của **người vận hành** không có danh tính thiết bị.
    - Điều này **không** mở rộng cho các phiên Control UI vai trò node.
    - Các reverse proxy loopback cùng máy chủ vẫn không đáp ứng xác thực trusted-proxy; xem [Xác thực trusted proxy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI được phát hành với chính sách `img-src` chặt chẽ: chỉ cho phép tài sản **cùng nguồn**, URL `data:`, và URL `blob:` được tạo cục bộ. Các URL hình ảnh `http(s)` từ xa và URL hình ảnh tương đối giao thức bị trình duyệt từ chối và không tạo yêu cầu mạng.

Ý nghĩa trong thực tế:

- Avatar và hình ảnh được phục vụ dưới đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các tuyến avatar đã xác thực mà UI tìm nạp và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/huy hiệu tích hợp, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của người vận hành tìm nạp hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không cấu hình được.

## Xác thực tuyến avatar

Khi xác thực Gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token Gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Các yêu cầu chưa xác thực tới một trong hai tuyến đều bị từ chối (khớp với tuyến assistant-media ngang hàng). Điều này ngăn tuyến avatar làm rò rỉ danh tính agent trên các máy chủ vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token Gateway dưới dạng tiêu đề bearer khi tìm nạp avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn tắt xác thực Gateway (không khuyến nghị trên máy chủ dùng chung), tuyến avatar cũng trở thành không xác thực, phù hợp với phần còn lại của Gateway.

## Xác thực tuyến phương tiện của trợ lý

Khi xác thực Gateway được cấu hình, bản xem trước phương tiện cục bộ của trợ lý dùng tuyến hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực người vận hành Control UI thông thường. Trình duyệt gửi token Gateway dưới dạng tiêu đề bearer khi kiểm tra tính khả dụng.
- Phản hồi siêu dữ liệu thành công bao gồm `mediaTicket` ngắn hạn được giới hạn trong đúng đường dẫn nguồn đó.
- URL hình ảnh, âm thanh, video và tài liệu do trình duyệt hiển thị dùng `mediaTicket=<ticket>` thay vì token hoặc mật khẩu Gateway đang hoạt động. Ticket hết hạn nhanh và không thể ủy quyền cho nguồn khác.

Điều này giữ cho việc hiển thị phương tiện thông thường tương thích với các phần tử phương tiện gốc của trình duyệt mà không đưa thông tin xác thực Gateway có thể tái sử dụng vào các URL phương tiện có thể nhìn thấy.

## Xây dựng UI

Gateway phục vụ các tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

```bash
pnpm ui:build
```

Base tuyệt đối tùy chọn (khi bạn muốn URL tài sản cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Cho phát triển cục bộ (máy chủ dev riêng):

```bash
pnpm ui:dev
```

Sau đó trỏ UI tới URL WS của Gateway (ví dụ `ws://127.0.0.1:18789`).

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Control UI là các tệp tĩnh; mục tiêu WebSocket có thể cấu hình và có thể khác với nguồn HTTP. Điều này hữu ích khi bạn muốn dùng máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

<Steps>
  <Step title="Khởi động máy chủ dev UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Mở bằng gatewayUrl">
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
    - Nếu bạn truyền endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy URL-encode giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn đúng cách.
    - `token` nên được truyền qua fragment URL (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi tới máy chủ, nhờ đó tránh rò rỉ qua nhật ký yêu cầu và Referer. Tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ làm dự phòng, và bị loại bỏ ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin xác thực từ cấu hình hoặc môi trường. Hãy cung cấp rõ ràng `token` (hoặc `password`). Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (nguồn đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Khi khởi động, Gateway có thể seed các nguồn cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và port runtime hiệu dụng, nhưng các nguồn trình duyệt từ xa vẫn cần mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi nguồn trình duyệt, không phải "khớp với bất kỳ máy chủ nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback nguồn theo tiêu đề Host, nhưng đây là một chế độ bảo mật nguy hiểm.

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

- [Dashboard](/vi/web/dashboard) — dashboard Gateway
- [Kiểm tra sức khỏe](/vi/gateway/health) — giám sát sức khỏe Gateway
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện trò chuyện dựa trên trình duyệt
