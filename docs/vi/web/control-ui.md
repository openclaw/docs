---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện người dùng điều khiển dựa trên trình duyệt cho Gateway (trò chuyện, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-04T07:06:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 07fbbe1c7fec5f67a04a231e02bdf0f7d16be9c5fe188915674d71fcd69002a5
    source_path: web/control-ui.md
    workflow: 16
---

Control UI là một ứng dụng một trang nhỏ dùng **Vite + Lit**, được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Ứng dụng giao tiếp **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

Xác thực được cung cấp trong quá trình bắt tay WebSocket thông qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- các header danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- các header danh tính proxy đáng tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt dashboard giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu. Quy trình khởi tạo thường tạo một token gateway cho xác thực shared-secret ở lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép đôi thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Control UI từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép đôi một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

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

Nếu trình duyệt thử ghép đôi lại với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép đôi và bạn đổi từ quyền đọc sang quyền ghi/admin, việc này được xem là nâng cấp phê duyệt, không phải là kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ đang hoạt động, chặn kết nối lại với quyền rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không cần phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

<Note>
- Kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép đôi cho các phiên vận hành Control UI khi `gateway.auth.allowTailscale: true`, danh tính Tailscale xác minh thành công, và trình duyệt trình bày danh tính thiết bị của nó.
- Liên kết Tailnet trực tiếp, kết nối trình duyệt LAN, và hồ sơ trình duyệt không có danh tính thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép đôi lại.

</Note>

## Danh tính cá nhân (cục bộ trong trình duyệt)

Control UI hỗ trợ một danh tính cá nhân theo từng trình duyệt (tên hiển thị và avatar) được gắn vào tin nhắn gửi đi để ghi nhận tác giả trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, được giới hạn trong hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hoặc lưu phía máy chủ ngoài metadata tác giả transcript thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại danh tính này về trống.

Mẫu cục bộ trong trình duyệt tương tự cũng áp dụng cho phần ghi đè avatar của trợ lý. Avatar trợ lý đã tải lên chỉ phủ lên danh tính do gateway phân giải trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn khả dụng cho các client không phải UI ghi trực tiếp trường này (chẳng hạn gateway theo script hoặc dashboard tùy chỉnh).

## Endpoint cấu hình runtime

Control UI lấy cài đặt runtime từ `/__openclaw/control-ui-config.json`. Endpoint đó được bảo vệ bởi cùng cơ chế xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy dữ liệu, và việc lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, danh tính Tailscale Serve, hoặc danh tính proxy đáng tin cậy.

## Hỗ trợ ngôn ngữ

Control UI có thể tự bản địa hóa trong lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn ngôn ngữ nằm trong thẻ Truy cập Gateway, không nằm trong Giao diện.

- Ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Các bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ rơi về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ ngôn ngữ không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã ngôn ngữ mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot và Dash tích hợp sẵn, cùng một vị trí nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, bấm **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Trình nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Các chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một vị trí cục bộ đó; xóa chủ đề đã nhập sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Hiện có thể làm gì (hôm nay)

<AccordionGroup>
  <Accordion title="Trò chuyện và Nói chuyện">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Nói chuyện thông qua các phiên thời gian thực của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt dùng một lần có giới hạn qua WebSocket, và các plugin thoại thời gian thực chỉ chạy backend dùng truyền tải chuyển tiếp của Gateway. Bộ chuyển tiếp giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt truyền PCM micro qua các RPC `talk.realtime.relay*` và gửi các lệnh gọi công cụ `openclaw_agent_consult` ngược qua `chat.send` cho mô hình OpenClaw lớn hơn đã cấu hình.
    - Truyền phát lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện tác nhân).

  </Accordion>
  <Accordion title="Kênh, phiên bản, phiên, giấc mơ">
    - Kênh: trạng thái kênh tích hợp sẵn cùng các kênh plugin đóng gói/bên ngoài, đăng nhập QR, và cấu hình theo kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: danh sách + ghi đè theo phiên cho mô hình/suy nghĩ/nhanh/chi tiết/trace/lý luận (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái dreaming, công tắc bật/tắt, và trình đọc Nhật ký Dream (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, node, phê duyệt exec">
    - Công việc Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: liệt kê + giới hạn năng lực (`node.list`).
    - Phê duyệt exec: sửa allowlist gateway hoặc node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động cuối cùng.
    - Các lần ghi bao gồm guard base-hash để ngăn ghi đè lên các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Schema + kết xuất biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, metadata tài liệu trên các node đối tượng lồng nhau/wildcard/mảng/composition, cùng schema plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ khả dụng khi snapshot có thể round-trip thô an toàn.
    - Nếu snapshot không thể round-trip văn bản thô một cách an toàn, Control UI buộc dùng chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - Trình chỉnh sửa JSON thô "Đặt lại về bản đã lưu" giữ nguyên hình dạng do tác giả thô tạo ra (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại một snapshot đã làm phẳng, vì vậy các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể round-trip an toàn.
    - Giá trị đối tượng SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản của biểu mẫu để ngăn vô tình làm hỏng đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký: tail trực tiếp nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại, sau đó thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng công việc Cron">
    - Với công việc tách biệt, gửi mặc định là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ dùng nội bộ.
    - Các trường kênh/đích xuất hiện khi chọn thông báo.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` đặt thành URL webhook HTTP(S) hợp lệ.
    - Với công việc phiên chính, có thể dùng các chế độ gửi webhook và không gửi.
    - Điều khiển sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè tác nhân, tùy chọn cron chính xác/rải đều, ghi đè mô hình/suy nghĩ của tác nhân, và công tắc gửi theo nỗ lực tốt nhất.
    - Xác thực biểu mẫu hiển thị nội tuyến với lỗi cấp trường; giá trị không hợp lệ sẽ tắt nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi token bearer chuyên dụng; nếu bỏ qua, webhook được gửi mà không có header xác thực.
    - Dự phòng đã ngừng khuyến nghị: các công việc cũ đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`.
    - Nội dung tải lên trong trò chuyện chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để an toàn cho UI. Khi các mục bản ghi quá lớn, Gateway có thể cắt bớt các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế các tin nhắn quá khổ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý/tạo sinh được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào payload ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - `chat.history` cũng loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản trợ lý có thể nhìn thấy (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML lời gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lời gọi công cụ bị cắt ngắn), cũng như các token điều khiển mô hình ASCII/toàn độ rộng bị rò rỉ, và bỏ qua các mục trợ lý mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply`.
    - Trong khi một lượt gửi đang hoạt động và ở lần làm mới lịch sử cuối cùng, khung xem trò chuyện vẫn giữ các tin nhắn người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` trong chốc lát trả về một ảnh chụp cũ hơn; bản ghi chuẩn sẽ thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái phân phối, còn `chat.history` được dựng lại từ bản ghi phiên bền vững. Sau các sự kiện hoàn tất công cụ, Control UI tải lại lịch sử và chỉ hợp nhất một phần đuôi lạc quan nhỏ; ranh giới bản ghi được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` thêm một ghi chú trợ lý vào bản ghi phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không chạy agent, không phân phối qua kênh).
    - Bộ chọn mô hình và tư duy ở tiêu đề trò chuyện vá phiên đang hoạt động ngay lập tức qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ áp dụng cho một lượt.
    - Gõ `/new` trong Control UI sẽ tạo và chuyển sang cùng phiên bảng điều khiển mới như New Chat. Gõ `/reset` giữ cơ chế đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trò chuyện yêu cầu khung nhìn mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng những provider có xác thực dùng được. Catalog đầy đủ vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới cho thấy áp lực ngữ cảnh cao, vùng soạn trò chuyện hiển thị thông báo ngữ cảnh và, ở các mức compaction được khuyến nghị, một nút thu gọn chạy đường dẫn compaction phiên thông thường. Các ảnh chụp token cũ được ẩn cho đến khi Gateway báo cáo mức sử dụng mới trở lại.

  </Accordion>
  <Accordion title="Talk mode (browser realtime)">
    Chế độ Talk sử dụng một provider giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.provider: "openai"` cộng với `talk.providers.openai.apiKey`, hoặc cấu hình Google với `talk.provider: "google"` cộng với `talk.providers.google.apiKey`; cấu hình provider thời gian thực Voice Call vẫn có thể được tái sử dụng làm dự phòng. Trình duyệt không bao giờ nhận khóa API provider tiêu chuẩn. OpenAI nhận một bí mật client Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API bị ràng buộc, dùng một lần cho phiên WebSocket trình duyệt, với chỉ dẫn và khai báo công cụ được Gateway khóa vào token. Các provider chỉ cung cấp cầu nối thời gian thực backend sẽ chạy qua transport chuyển tiếp Gateway, nên thông tin xác thực và socket nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.realtime.session` không chấp nhận ghi đè chỉ dẫn do bên gọi cung cấp.

    Trong trình soạn Chat, điều khiển Talk là nút sóng nằm cạnh nút nhập chính tả bằng micrô. Khi Talk bắt đầu, hàng trạng thái trình soạn hiển thị `Connecting Talk...`, sau đó là `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lời gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình qua `chat.send`.

    Kiểm thử khói trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt bằng token ràng buộc Google Live, và bộ điều hợp trình duyệt chuyển tiếp Gateway với phương tiện micrô giả. Lệnh chỉ in trạng thái provider và không ghi nhật ký bí mật.

  </Accordion>
  <Accordion title="Stop and abort">
    - Nhấp **Stop** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt theo dõi thông thường sẽ vào hàng đợi. Nhấp **Steer** trên một tin nhắn trong hàng đợi để chèn lượt theo dõi đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm từ hủy độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy tất cả lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Abort partial retention">
    - Khi một lượt chạy bị hủy, phần văn bản trợ lý chưa hoàn chỉnh vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền vững văn bản trợ lý chưa hoàn chỉnh đã hủy vào lịch sử bản ghi khi có đầu ra đã được đệm.
    - Các mục được lưu bền vững bao gồm siêu dữ liệu hủy để bên tiêu thụ bản ghi có thể phân biệt phần chưa hoàn chỉnh do hủy với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và Web Push

Control UI đi kèm `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt đề xuất "Install app" khi nó có thể truy cập được. |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và nhấp vào thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tạo tự động dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt được lưu bền vững.                |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều host, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Control UI sử dụng các phương thức Gateway có phạm vi giới hạn này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cộng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS iOS (xem [Cấu hình](/vi/gateway/configuration) để biết push được hỗ trợ bởi relay) và phương thức `push.test` hiện có, vốn nhắm đến ghép đôi di động native.
</Note>

## Nhúng được lưu trữ

Tin nhắn trợ lý có thể hiển thị nội dung web được lưu trữ trực tiếp bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (default)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cách ly origin; đây là mặc định và thường đủ cho các trò chơi/tiện ích trình duyệt độc lập.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` trên nền `allow-scripts` cho tài liệu cùng site cố ý cần đặc quyền mạnh hơn.
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
Chỉ dùng `trusted` khi tài liệu nhúng thật sự cần hành vi cùng origin. Với hầu hết trò chơi và canvas tương tác do agent tạo, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ ý muốn `[embed url="https://..."]` tải trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chiều rộng tin nhắn trò chuyện

Các tin nhắn trò chuyện được nhóm dùng max-width mặc định dễ đọc. Các triển khai màn hình rộng có thể ghi đè mà không cần vá CSS đóng gói bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi tới trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài và phần trăm thuần như `960px` hoặc `82%`, cùng các biểu thức chiều rộng ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi chúng chạm loopback với các header `x-forwarded-*` của Tailscale. Với phiên toán tử Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép đôi thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn đi theo kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật dùng chung rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP client và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lần không khớp thuần chạy đua song song.

    <Warning>
    Xác thực Serve không cần token giả định host gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên host đó, hãy yêu cầu xác thực token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Dán bí mật dùng chung tương ứng vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ đã được ghi lại:

- tương thích HTTP không an toàn chỉ localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI toán tử thành công qua `gateway.auth.mode: "trusted-proxy"`
- phương án khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ Gateway)

<AccordionGroup>
  <Accordion title="Hành vi công tắc insecure-auth">
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

    - Nó cho phép phiên Control UI trên localhost tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không bảo mật.
    - Nó không bỏ qua kiểm tra ghép nối.
    - Nó không nới lỏng yêu cầu danh tính thiết bị từ xa (không phải localhost).

  </Accordion>
  <Accordion title="Chỉ dùng trong tình huống khẩn cấp">
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
    `dangerouslyDisableDeviceAuth` tắt kiểm tra danh tính thiết bị của Control UI và là mức hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh sau khi dùng trong tình huống khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về trusted-proxy">
    - Xác thực trusted-proxy thành công có thể cho phép các phiên Control UI của **operator** mà không cần danh tính thiết bị.
    - Điều này **không** mở rộng sang các phiên Control UI vai trò node.
    - Proxy ngược loopback cùng máy chủ vẫn không đáp ứng xác thực trusted-proxy; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI đi kèm chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng origin**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh `http(s)` từ xa và URL hình ảnh tương đối theo giao thức bị trình duyệt từ chối và không tạo yêu cầu mạng.

Điều này có nghĩa trong thực tế:

- Avatar và hình ảnh được phục vụ dưới đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các tuyến avatar đã xác thực mà UI tải về và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/huy hiệu tích hợp, vì vậy một kênh bị xâm phạm hoặc độc hại không thể ép trình duyệt của operator tải hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực tuyến avatar

Khi xác thực Gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token Gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Yêu cầu chưa xác thực tới một trong hai tuyến đều bị từ chối (khớp với tuyến assistant-media ngang cấp). Điều này ngăn tuyến avatar rò rỉ danh tính agent trên các máy chủ vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token Gateway dưới dạng header bearer khi tải avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn tắt xác thực Gateway (không khuyến nghị trên máy chủ dùng chung), tuyến avatar cũng trở thành không xác thực, nhất quán với phần còn lại của gateway.

## Xác thực tuyến phương tiện assistant

Khi xác thực Gateway được cấu hình, bản xem trước phương tiện cục bộ của assistant dùng tuyến hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực operator Control UI bình thường. Trình duyệt gửi token Gateway dưới dạng header bearer khi kiểm tra tính khả dụng.
- Phản hồi siêu dữ liệu thành công bao gồm `mediaTicket` ngắn hạn, bị giới hạn trong đúng đường dẫn nguồn đó.
- URL hình ảnh, âm thanh, video và tài liệu do trình duyệt hiển thị dùng `mediaTicket=<ticket>` thay vì token hoặc mật khẩu Gateway đang hoạt động. Vé hết hạn nhanh và không thể cấp quyền cho nguồn khác.

Điều này giữ cho việc hiển thị phương tiện bình thường tương thích với các phần tử phương tiện gốc của trình duyệt mà không đưa thông tin xác thực Gateway có thể tái sử dụng vào URL phương tiện hiển thị.

## Xây dựng UI

Gateway phục vụ tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

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

Control UI là các tệp tĩnh; mục tiêu WebSocket có thể cấu hình và có thể khác với origin HTTP. Điều này hữu ích khi bạn muốn dùng máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

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
    - Nếu bạn truyền endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - Nên truyền `token` qua fragment URL (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi tới máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Tham số truy vấn cũ `?token=` vẫn được nhập một lần để tương thích, nhưng chỉ như phương án dự phòng, và bị loại bỏ ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback sang thông tin xác thực từ cấu hình hoặc môi trường. Hãy cung cấp rõ ràng `token` (hoặc `password`). Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (origin đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Lúc khởi động, Gateway có thể gieo các origin cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng origin trình duyệt từ xa vẫn cần mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi origin trình duyệt, không phải "khớp với bất kỳ máy chủ nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback origin theo header Host, nhưng đây là chế độ bảo mật nguy hiểm.

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

- [Dashboard](/vi/web/dashboard) — dashboard gateway
- [Kiểm tra tình trạng](/vi/gateway/health) — giám sát tình trạng gateway
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện trò chuyện dựa trên trình duyệt
