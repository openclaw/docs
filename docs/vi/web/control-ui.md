---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, Node, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-02T10:56:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: b49118ee964f9efb68479494d2bc1ba4029f0ec5c12fc69bd3975c3ea5082e14
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện điều khiển là một ứng dụng một trang **Vite + Lit** nhỏ do Gateway phục vụ:

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
- tiêu đề danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- tiêu đề danh tính trusted-proxy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của bảng điều khiển giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu bền vững. Onboarding thường tạo một gateway token cho xác thực bí mật dùng chung trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép đôi thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Giao diện điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép đôi một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "đã ngắt kết nối (1008): cần ghép đôi"

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

Nếu trình duyệt thử lại ghép đôi với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép đôi và bạn đổi từ quyền truy cập đọc sang quyền truy cập ghi/quản trị, thao tác này được xem là nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ hoạt động, chặn kết nối lại có phạm vi rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không cần phê duyệt lại trừ khi bạn thu hồi thiết bị bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

<Note>
- Kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép đôi cho các phiên người vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, danh tính Tailscale xác minh thành công, và trình duyệt trình bày danh tính thiết bị của nó.
- Liên kết Tailnet trực tiếp, kết nối trình duyệt LAN, và hồ sơ trình duyệt không có danh tính thiết bị vẫn cần phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép đôi lại.

</Note>

## Danh tính cá nhân (cục bộ trong trình duyệt)

Giao diện điều khiển hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và avatar) được gắn vào tin nhắn gửi đi để ghi nhận tác giả trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, được giới hạn trong hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hay lưu bền vững phía máy chủ ngoài metadata tác giả bản ghi hội thoại thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại danh tính này về trống.

Mẫu cục bộ trong trình duyệt tương tự cũng áp dụng cho ghi đè avatar trợ lý. Avatar trợ lý đã tải lên phủ lên danh tính do gateway phân giải chỉ trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn có sẵn cho các client không phải UI ghi trực tiếp vào trường này (chẳng hạn như gateway theo script hoặc bảng điều khiển tùy chỉnh).

## Endpoint cấu hình runtime

Giao diện điều khiển lấy cài đặt runtime từ `/__openclaw/control-ui-config.json`. Endpoint đó được bảo vệ bởi cùng cơ chế xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và lần lấy thành công yêu cầu một gateway token/mật khẩu đã hợp lệ, danh tính Tailscale Serve, hoặc danh tính trusted-proxy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự bản địa hóa trong lần tải đầu tiên dựa trên locale trình duyệt của bạn. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn locale nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Locale được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ locale không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã locale mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot và Dash tích hợp sẵn, cộng thêm một vị trí nhập tweakcn cục bộ trong trình duyệt. Để nhập chủ đề, mở [chủ đề tweakcn](https://tweakcn.com/themes), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Bộ nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một vị trí cục bộ đó; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Chat và Talk">
    - Chat với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Talk qua phiên thời gian thực trong trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần bị ràng buộc qua WebSocket, và Plugin giọng nói thời gian thực chỉ ở backend dùng truyền tải chuyển tiếp Gateway. Bộ chuyển tiếp giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt truyền microphone PCM qua RPC `talk.realtime.relay*` và gửi lệnh gọi công cụ `openclaw_agent_consult` ngược qua `chat.send` cho mô hình OpenClaw lớn hơn đã cấu hình.
    - Truyền trực tuyến lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Chat (sự kiện agent).

  </Accordion>
  <Accordion title="Kênh, instance, phiên, giấc mơ">
    - Kênh: trạng thái kênh tích hợp sẵn cộng với kênh Plugin đóng gói/bên ngoài, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Instance: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: danh sách + ghi đè theo từng phiên cho mô hình/thinking/nhanh/chi tiết/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái dreaming, bật/tắt, và trình đọc Nhật ký giấc mơ (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node, phê duyệt exec">
    - Tác vụ Cron: danh sách/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: danh sách + giới hạn năng lực (`node.list`).
    - Phê duyệt exec: chỉnh sửa allowlist gateway hoặc Node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại với xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Thao tác ghi bao gồm bảo vệ base-hash để ngăn ghi đè các chỉnh sửa đồng thời.
    - Thao tác ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Schema + kết xuất biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, metadata tài liệu trên các node object/wildcard/array/composition lồng nhau, cộng với schema Plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ có sẵn khi snapshot có vòng khứ hồi thô an toàn.
    - Nếu snapshot không thể đi vòng khứ hồi văn bản thô một cách an toàn, Giao diện điều khiển buộc dùng chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - "Đặt lại về đã lưu" của trình chỉnh sửa JSON thô giữ nguyên hình dạng được viết thô (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại một snapshot đã làm phẳng, vì vậy các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể đi vòng khứ hồi an toàn.
    - Giá trị object SecretRef có cấu trúc được kết xuất chỉ đọc trong input văn bản của biểu mẫu để ngăn vô tình làm hỏng object thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký: theo dõi trực tiếp nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) kèm báo cáo khởi động lại, sau đó thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng tác vụ Cron">
    - Với tác vụ tách biệt, mặc định gửi là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ nội bộ.
    - Trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` đặt thành một URL webhook HTTP(S) hợp lệ.
    - Với tác vụ phiên chính, chế độ gửi webhook và không gửi đều khả dụng.
    - Điều khiển chỉnh sửa nâng cao bao gồm xóa-sau-khi-chạy, xóa ghi đè agent, tùy chọn cron chính xác/rải thời gian, ghi đè mô hình/thinking của agent, và bật/tắt gửi best-effort.
    - Xác thực biểu mẫu hiển thị nội tuyến với lỗi cấp trường; giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi một bearer token chuyên dụng; nếu bỏ qua, webhook được gửi không có tiêu đề xác thực.
    - Dự phòng không còn khuyến nghị: các tác vụ legacy đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi Chat

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi truyền luồng qua các sự kiện `chat`.
    - Tải lên trong chat chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để an toàn cho UI. Khi các mục bản ghi hội thoại quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế các tin nhắn quá khổ bằng một phần giữ chỗ (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý/tạo sinh tạo ra được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua URL phương tiện Gateway đã xác thực, vì vậy việc tải lại không phụ thuộc vào việc payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử chat.
    - `chat.history` cũng loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản trợ lý hiển thị (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), các payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cùng các mã điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục trợ lý có toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply`.
    - Trong lúc đang gửi chủ động và khi làm mới lịch sử cuối cùng, chế độ xem chat giữ các tin nhắn người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` trong chốc lát trả về một ảnh chụp cũ hơn; bản ghi hội thoại chuẩn sẽ thay thế các tin nhắn cục bộ đó sau khi lịch sử Gateway bắt kịp.
    - `chat.inject` thêm một ghi chú trợ lý vào bản ghi hội thoại phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không chạy agent, không gửi tới kênh).
    - Bộ chọn mô hình và thinking trong tiêu đề chat vá phiên đang hoạt động ngay qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ dùng cho một lượt.
    - Gõ `/new` trong Control UI tạo và chuyển sang cùng phiên dashboard mới như New Chat. Gõ `/reset` giữ thao tác đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình chat yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, allowlist đó điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng các nhà cung cấp có xác thực dùng được. Toàn bộ danh mục vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới cho thấy áp lực ngữ cảnh cao, vùng trình soạn chat hiển thị thông báo ngữ cảnh và, ở các mức Compaction được khuyến nghị, một nút gọn chạy đường dẫn Compaction phiên thông thường. Các ảnh chụp token cũ được ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ Talk (trình duyệt realtime)">
    Chế độ Talk dùng một nhà cung cấp giọng nói realtime đã đăng ký. Cấu hình OpenAI với `talk.provider: "openai"` cùng `talk.providers.openai.apiKey`, hoặc cấu hình Google với `talk.provider: "google"` cùng `talk.providers.google.apiKey`; cấu hình nhà cung cấp realtime Voice Call vẫn có thể được dùng lại làm dự phòng. Trình duyệt không bao giờ nhận khóa API nhà cung cấp chuẩn. OpenAI nhận một bí mật máy khách Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API bị ràng buộc dùng một lần cho phiên WebSocket trình duyệt, với hướng dẫn và khai báo công cụ được Gateway khóa vào token. Các nhà cung cấp chỉ cung cấp cầu nối realtime backend sẽ chạy qua transport relay của Gateway, vì vậy thông tin xác thực và socket của nhà cung cấp nằm phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.realtime.session` không chấp nhận ghi đè hướng dẫn do bên gọi cung cấp.

    Trong trình soạn Chat, điều khiển Talk là nút sóng cạnh nút đọc chính tả microphone. Khi Talk bắt đầu, hàng trạng thái trình soạn hiển thị `Connecting Talk...`, sau đó `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ realtime đang tham vấn mô hình lớn hơn đã cấu hình qua `chat.send`.

    Kiểm thử khói live cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt Google Live bằng token ràng buộc, và bộ chuyển đổi trình duyệt relay Gateway với phương tiện microphone giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi nhật ký bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Nhấp **Stop** (gọi `chat.abort`).
    - Khi một lần chạy đang hoạt động, các câu hỏi tiếp theo thông thường sẽ vào hàng đợi. Nhấp **Steer** trên một tin nhắn đã xếp hàng để chèn câu hỏi tiếp theo đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm từ hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy bỏ ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy bỏ tất cả các lần chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy bỏ một phần">
    - Khi một lần chạy bị hủy bỏ, văn bản trợ lý một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền vững văn bản trợ lý một phần đã bị hủy bỏ vào lịch sử bản ghi hội thoại khi có đầu ra đã đệm.
    - Các mục được lưu bền vững bao gồm siêu dữ liệu hủy bỏ để bên tiêu thụ bản ghi hội thoại có thể phân biệt phần hủy bỏ một phần với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Control UI cung cấp một `manifest.webmanifest` và một service worker, vì vậy các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt đề xuất "Cài đặt ứng dụng" khi có thể truy cập. |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và nhấp vào thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo dùng để ký payload Web Push. |
| `push/web-push-subscriptions.json`                    | Endpoint đăng ký trình duyệt được lưu bền vững. |

Ghi đè cặp khóa VAPID qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều host, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Control UI dùng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi một thông báo kiểm thử tới đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn relay APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) để biết push dựa trên relay) và phương thức `push.test` hiện có, vốn nhắm tới ghép cặp di động native.
</Note>

## Nhúng được lưu trữ

Tin nhắn trợ lý có thể hiển thị nội dung web được lưu trữ nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Vô hiệu hóa thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (mặc định)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các game/widget trình duyệt tự chứa.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` bên trên `allow-scripts` cho các tài liệu cùng site chủ động cần đặc quyền mạnh hơn.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thật sự cần hành vi same-origin. Với hầu hết game và canvas tương tác do agent tạo, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ động muốn `[embed url="https://..."]` tải các trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Integrated Tailscale Serve (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với các header `x-forwarded-*` của Tailscale. Đối với các phiên toán tử Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép cặp thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn đi theo các kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật dùng chung rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Do đó, các lần thử lại sai đồng thời từ cùng một trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp đơn thuần chạy đua song song.

    <Warning>
    Xác thực Serve không token giả định host gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin có thể chạy trên host đó, hãy yêu cầu xác thực token/password.
    </Warning>

  </Tab>
  <Tab title="Bind vào tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Dán bí mật dùng chung tương ứng vào cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở dashboard qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong một **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ đã được tài liệu hóa:

- khả năng tương thích HTTP không an toàn chỉ cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI toán tử thành công qua `gateway.auth.mode: "trusted-proxy"`
- phá kính `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục được khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên host gateway)

<AccordionGroup>
  <Accordion title="Hành vi nút bật/tắt xác thực không an toàn">
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

    - Nó cho phép các phiên Control UI localhost tiếp tục mà không có danh tính thiết bị trong ngữ cảnh HTTP không an toàn.
    - Nó không bỏ qua kiểm tra ghép cặp.
    - Nó không nới lỏng yêu cầu danh tính thiết bị từ xa (không phải localhost).

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
    `dangerouslyDisableDeviceAuth` tắt kiểm tra danh tính thiết bị của Control UI và là một mức hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh chóng sau khi dùng trong trường hợp khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về proxy tin cậy">
    - Xác thực proxy tin cậy thành công có thể cho phép các phiên Control UI **operator** không có danh tính thiết bị.
    - Điều này **không** áp dụng cho các phiên Control UI với vai trò node.
    - Proxy ngược loopback cùng máy vẫn không đáp ứng xác thực proxy tin cậy; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI đi kèm chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng nguồn gốc**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh `http(s)` từ xa và URL tương đối theo giao thức bị trình duyệt từ chối và không tạo yêu cầu mạng.

Điều này có nghĩa là trong thực tế:

- Avatar và hình ảnh được phục vụ dưới các đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các route avatar đã xác thực mà UI tải về và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do metadata của kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/huy hiệu tích hợp, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của operator tải hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực route avatar

Khi xác thực Gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token Gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho caller đã xác thực. `GET /avatar/<agentId>?meta=1` trả về metadata avatar theo cùng quy tắc.
- Yêu cầu chưa xác thực tới một trong hai route đều bị từ chối (khớp với route assistant-media cùng cấp). Điều này ngăn route avatar làm rò rỉ danh tính agent trên các host vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token Gateway dưới dạng bearer header khi tải avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn tắt xác thực Gateway (không khuyến nghị trên host dùng chung), route avatar cũng trở thành chưa xác thực, nhất quán với phần còn lại của Gateway.

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

Control UI là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với nguồn gốc HTTP. Điều này hữu ích khi bạn muốn dùng máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

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
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL cho giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - Nên truyền `token` qua fragment URL (`#token=...`) khi có thể. Fragment không được gửi tới máy chủ, giúp tránh rò rỉ qua log yêu cầu và Referer. Tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ dùng làm phương án dự phòng, và bị xóa ngay sau khi bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không quay về dùng thông tin xác thực từ cấu hình hoặc môi trường. Hãy cung cấp rõ ràng `token` (hoặc `password`). Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (nguồn gốc đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Khởi động Gateway có thể gieo các nguồn gốc cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng nguồn gốc trình duyệt từ xa vẫn cần các mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó nghĩa là cho phép mọi nguồn gốc trình duyệt, không phải "khớp với bất kỳ host nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ dự phòng nguồn gốc theo Host-header, nhưng đây là chế độ bảo mật nguy hiểm.

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
- [WebChat](/vi/web/webchat) — giao diện chat dựa trên trình duyệt
