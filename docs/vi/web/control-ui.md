---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-04T02:26:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: c890d83da2c296b600e4b5a00a538f37e6bd54da31fbe62113ecd6177b15626e
    source_path: web/control-ui.md
    workflow: 16
---

Control UI là một ứng dụng một trang **Vite + Lit** nhỏ được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Ứng dụng giao tiếp **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- các tiêu đề định danh Tailscale Serve khi `gateway.auth.allowTailscale: true`
- các tiêu đề định danh proxy tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt dashboard giữ một token cho phiên tab trình duyệt hiện tại và URL Gateway đã chọn; mật khẩu không được lưu lâu dài. Onboarding thường tạo một token Gateway cho xác thực bí mật dùng chung trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Control UI từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép nối một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "disconnected (1008): pairing required"

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

Nếu trình duyệt thử ghép nối lại với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới sẽ được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép nối và bạn đổi từ quyền đọc sang quyền ghi/quản trị, việc này được xử lý như một nâng cấp phê duyệt, không phải một lần kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ hoạt động, chặn lần kết nối lại với quyền rộng hơn, và yêu cầu bạn phê duyệt rõ ràng tập phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không cần phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết về xoay vòng và thu hồi token.

<Note>
- Kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép nối cho các phiên vận hành Control UI khi `gateway.auth.allowTailscale: true`, định danh Tailscale được xác minh, và trình duyệt trình bày định danh thiết bị của nó.
- Các bind Tailnet trực tiếp, kết nối trình duyệt LAN, và hồ sơ trình duyệt không có định danh thiết bị vẫn cần phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

</Note>

## Định danh cá nhân (cục bộ trong trình duyệt)

Control UI hỗ trợ định danh cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được gắn vào tin nhắn gửi đi để quy trách nhiệm trong các phiên dùng chung. Định danh này nằm trong bộ nhớ trình duyệt, được giới hạn theo hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hoặc lưu lâu dài phía máy chủ ngoài siêu dữ liệu tác giả transcript thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại thành trống.

Mẫu cục bộ trong trình duyệt tương tự áp dụng cho ghi đè ảnh đại diện trợ lý. Ảnh đại diện trợ lý đã tải lên chỉ phủ lên định danh do Gateway phân giải trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn khả dụng cho các máy khách không phải UI ghi trực tiếp vào trường này (chẳng hạn các Gateway được script hóa hoặc dashboard tùy chỉnh).

## Endpoint cấu hình runtime

Control UI lấy cài đặt runtime từ `/__openclaw/control-ui-config.json`. Endpoint đó được bảo vệ bằng cùng xác thực Gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và một lần lấy thành công cần có token/mật khẩu Gateway đã hợp lệ, định danh Tailscale Serve, hoặc định danh proxy tin cậy.

## Hỗ trợ ngôn ngữ

Control UI có thể bản địa hóa chính nó trong lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn locale nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Locale được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Các bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng tập locale không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã locale mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot, và Dash tích hợp, cộng với một khe nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, mở [chủ đề tweakcn](https://tweakcn.com/themes), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Trình nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL editor như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình Gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một khe cục bộ đó; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Nói chuyện qua các phiên thời gian thực của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần bị ràng buộc qua WebSocket, và các Plugin thoại thời gian thực chỉ ở backend dùng transport chuyển tiếp của Gateway. Chuyển tiếp giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt stream PCM microphone qua các RPC `talk.realtime.relay*` và gửi lệnh gọi công cụ `openclaw_agent_consult` trở lại qua `chat.send` cho mô hình OpenClaw lớn hơn đã cấu hình.
    - Stream lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Chat (sự kiện agent).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kênh: trạng thái kênh tích hợp cộng với kênh Plugin đi kèm/bên ngoài, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: danh sách + ghi đè mô hình/suy nghĩ/nhanh/dài dòng/trace/reasoning theo từng phiên (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái dreaming, công tắc bật/tắt, và trình đọc Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Tác vụ Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: danh sách + năng lực (`node.list`).
    - Phê duyệt exec: sửa danh sách cho phép Gateway hoặc Node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các lần ghi bao gồm bảo vệ base-hash để ngăn ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đã gửi đang hoạt động nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Schema + kết xuất biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các nút object/wildcard/array/composition lồng nhau, cộng với schema Plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ khả dụng khi snapshot có vòng khứ hồi thô an toàn.
    - Nếu một snapshot không thể thực hiện vòng khứ hồi văn bản thô an toàn, Control UI buộc chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - Trình chỉnh sửa JSON thô "Đặt lại về đã lưu" giữ nguyên hình dạng do người dùng soạn thô (định dạng, nhận xét, bố cục `$include`) thay vì kết xuất lại một snapshot đã làm phẳng, để các chỉnh sửa bên ngoài vẫn sống sót sau khi đặt lại khi snapshot có thể thực hiện vòng khứ hồi an toàn.
    - Giá trị object SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản biểu mẫu để tránh vô tình làm hỏng object thành chuỗi.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký: tail trực tiếp nhật ký tệp Gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) kèm báo cáo khởi động lại, sau đó thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản Gateway đang chạy.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Với tác vụ cô lập, cách gửi mặc định là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ dùng nội bộ.
    - Trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành một URL Webhook HTTP(S) hợp lệ.
    - Với tác vụ phiên chính, chế độ gửi Webhook và không gửi đều khả dụng.
    - Điều khiển sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè agent, tùy chọn cron chính xác/so le, ghi đè mô hình/suy nghĩ của agent, và công tắc gửi nỗ lực tối đa.
    - Xác thực biểu mẫu hiển thị nội tuyến với lỗi cấp trường; giá trị không hợp lệ sẽ tắt nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi một bearer token riêng; nếu bỏ qua, Webhook được gửi mà không có tiêu đề xác thực.
    - Dự phòng không còn khuyến nghị: các tác vụ cũ đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi Chat

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi truyền luồng qua các sự kiện `chat`.
    - Các lượt tải lên trong trò chuyện chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để an toàn cho UI. Khi các mục bản ghi quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng và thay thế các tin nhắn quá lớn bằng một phần giữ chỗ (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý/tạo sinh được lưu bền dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào việc tải trọng hình ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - `chat.history` cũng loại bỏ các thẻ chỉ thị nội tuyến chỉ để hiển thị khỏi văn bản trợ lý nhìn thấy được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), tải trọng XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục trợ lý có toàn bộ văn bản nhìn thấy được chỉ là token im lặng chính xác `NO_REPLY` / `no_reply`.
    - Trong khi đang gửi hoạt động và ở lần làm mới lịch sử cuối cùng, chế độ xem trò chuyện vẫn giữ các tin nhắn người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` tạm thời trả về một ảnh chụp cũ hơn; bản ghi chuẩn sẽ thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái phân phối, còn `chat.history` được dựng lại từ bản ghi phiên bền vững. Sau các sự kiện công cụ cuối cùng, Giao diện điều khiển tải lại lịch sử và chỉ hợp nhất một phần đuôi lạc quan nhỏ; ranh giới bản ghi được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` thêm một ghi chú trợ lý vào bản ghi phiên và phát sóng một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không chạy tác nhân, không phân phối kênh).
    - Các bộ chọn mô hình và tư duy trong tiêu đề trò chuyện vá phiên đang hoạt động ngay lập tức qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ cho một lượt.
    - Gõ `/new` trong Giao diện điều khiển sẽ tạo và chuyển sang cùng phiên bảng điều khiển mới như New Chat. Gõ `/reset` giữ thao tác đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trò chuyện yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng các nhà cung cấp có xác thực dùng được. Danh mục đầy đủ vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới cho thấy áp lực ngữ cảnh cao, khu vực soạn trò chuyện hiển thị thông báo ngữ cảnh và, ở các mức compaction được khuyến nghị, một nút thu gọn chạy đường dẫn compaction phiên thông thường. Các ảnh chụp token cũ được ẩn cho đến khi Gateway báo cáo mức sử dụng mới lại.

  </Accordion>
  <Accordion title="Chế độ nói (thời gian thực trên trình duyệt)">
    Chế độ nói sử dụng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.provider: "openai"` cùng `talk.providers.openai.apiKey`, hoặc cấu hình Google với `talk.provider: "google"` cùng `talk.providers.google.apiKey`; cấu hình nhà cung cấp thời gian thực Voice Call vẫn có thể được tái sử dụng làm phương án dự phòng. Trình duyệt không bao giờ nhận khóa API nhà cung cấp chuẩn. OpenAI nhận một bí mật máy khách Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API dùng một lần và bị ràng buộc cho phiên WebSocket trên trình duyệt, với hướng dẫn và khai báo công cụ được Gateway khóa vào token. Các nhà cung cấp chỉ phơi bày cầu nối thời gian thực phía backend sẽ chạy qua transport chuyển tiếp Gateway, để thông tin xác thực và socket của nhà cung cấp nằm ở phía máy chủ trong khi âm thanh trình duyệt di chuyển qua các RPC Gateway đã xác thực. Lời nhắc phiên Realtime được Gateway lắp ghép; `talk.realtime.session` không chấp nhận ghi đè hướng dẫn do bên gọi cung cấp.

    Trong trình soạn Trò chuyện, điều khiển Nói là nút sóng nằm cạnh nút đọc chính tả qua microphone. Khi Nói bắt đầu, hàng trạng thái của trình soạn hiển thị `Connecting Talk...`, sau đó `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình qua `chat.send`.

    Kiểm thử khói trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trên trình duyệt của OpenAI, thiết lập WebSocket trình duyệt bằng token ràng buộc của Google Live, và bộ chuyển đổi trình duyệt chuyển tiếp Gateway với phương tiện microphone giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi nhật ký bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các phản hồi tiếp theo thông thường sẽ được xếp hàng. Nhấp **Điều hướng** trên một tin nhắn đã xếp hàng để chèn phản hồi tiếp theo đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm hủy độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy tất cả lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy một phần">
    - Khi một lượt chạy bị hủy, văn bản trợ lý một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền văn bản trợ lý một phần đã hủy vào lịch sử bản ghi khi có đầu ra được đệm.
    - Các mục được lưu bền bao gồm siêu dữ liệu hủy để bên tiêu thụ bản ghi có thể phân biệt các phần hủy một phần với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Giao diện điều khiển đi kèm `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt đề xuất "Cài đặt ứng dụng" khi truy cập được. |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và nhấp vào thông báo.      |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID tự động tạo dùng để ký tải trọng Web Push.           |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt được lưu bền.                      |

Ghi đè cặp khóa VAPID qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều máy chủ, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Giao diện điều khiển sử dụng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) cho push dựa trên chuyển tiếp) và phương thức `push.test` hiện có, vốn nhắm tới ghép nối di động native.
</Note>

## Nhúng được lưu trữ

Tin nhắn trợ lý có thể kết xuất nội dung web được lưu trữ nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong các nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (mặc định)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các trò chơi/widget trình duyệt tự chứa.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` phía trên `allow-scripts` cho các tài liệu cùng site cố ý cần đặc quyền mạnh hơn.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thực sự cần hành vi cùng origin. Với hầu hết trò chơi và canvas tương tác do tác nhân tạo, `scripts` là lựa chọn an toàn hơn.
</Warning>

Các URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ ý muốn `[embed url="https://..."]` tải trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Độ rộng tin nhắn trò chuyện

Các tin nhắn trò chuyện được nhóm dùng độ rộng tối đa mặc định dễ đọc. Các triển khai màn hình rộng có thể ghi đè mà không cần vá CSS đóng gói bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi tới trình duyệt. Các giá trị được hỗ trợ gồm độ dài và phần trăm đơn giản như `960px` hoặc `82%`, cùng các biểu thức độ rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Tailscale Serve tích hợp (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó qua HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Serve của Giao diện điều khiển/WebSocket có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với các header `x-forwarded-*` của Tailscale. Với các phiên người vận hành Giao diện điều khiển có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua lượt ghép nối thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn theo các kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật dùng chung rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lần không khớp đơn thuần chạy đua song song.

    <Warning>
    Xác thực Serve không token giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên máy chủ đó, hãy yêu cầu xác thực token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Bind tới tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Dán bí mật dùng chung tương ứng vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Giao diện điều khiển không có danh tính thiết bị.

Các ngoại lệ đã ghi lại:

- khả năng tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Giao diện điều khiển của người vận hành thành công qua `gateway.auth.mode: "trusted-proxy"`
- phương án khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở giao diện cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ gateway)

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

    - Nó cho phép các phiên Giao diện điều khiển localhost tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không bảo mật.
    - Nó không bỏ qua các kiểm tra ghép đôi.
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
    `dangerouslyDisableDeviceAuth` tắt các kiểm tra danh tính thiết bị của Giao diện điều khiển và là một mức hạ cấp bảo mật nghiêm trọng. Hoàn nguyên nhanh sau khi dùng trong tình huống khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về trusted-proxy">
    - Xác thực trusted-proxy thành công có thể cho phép các phiên Giao diện điều khiển **operator** không có danh tính thiết bị.
    - Điều này **không** áp dụng cho các phiên Giao diện điều khiển vai trò node.
    - Các proxy ngược loopback cùng máy chủ vẫn không đáp ứng xác thực trusted-proxy; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Giao diện điều khiển đi kèm chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng nguồn gốc**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh `http(s)` từ xa và URL hình ảnh tương đối theo giao thức bị trình duyệt từ chối và không phát sinh lượt tải qua mạng.

Điều này có nghĩa là trong thực tế:

- Avatar và hình ảnh được phục vụ theo đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các tuyến avatar đã xác thực mà giao diện tìm nạp và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Giao diện điều khiển tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra bị loại bỏ tại các trình trợ giúp avatar của Giao diện điều khiển và được thay bằng logo/huy hiệu tích hợp sẵn, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của operator tải hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực tuyến avatar

Khi xác thực gateway được cấu hình, endpoint avatar của Giao diện điều khiển yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Yêu cầu chưa xác thực tới một trong hai tuyến đều bị từ chối (khớp với tuyến assistant-media cùng cấp). Điều này ngăn tuyến avatar làm rò rỉ danh tính agent trên các máy chủ vốn được bảo vệ.
- Bản thân Giao diện điều khiển chuyển tiếp token gateway dưới dạng header bearer khi tìm nạp avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn tắt xác thực gateway (không khuyến nghị trên máy chủ dùng chung), tuyến avatar cũng trở thành chưa xác thực, nhất quán với phần còn lại của gateway.

## Xây dựng giao diện

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

Sau đó trỏ giao diện tới URL Gateway WS của bạn (ví dụ `ws://127.0.0.1:18789`).

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Giao diện điều khiển là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với nguồn gốc HTTP. Điều này tiện khi bạn muốn dùng máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

<Steps>
  <Step title="Khởi động máy chủ dev của giao diện">
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
    - Nên truyền `token` qua mảnh URL (`#token=...`) bất cứ khi nào có thể. Mảnh không được gửi tới máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ như phương án dự phòng, và bị loại bỏ ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, giao diện không dùng dự phòng thông tin xác thực từ cấu hình hoặc môi trường. Cung cấp rõ ràng `token` (hoặc `password`). Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway đứng sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Giao diện điều khiển không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (nguồn gốc đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Quá trình khởi động Gateway có thể seed các nguồn gốc cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng nguồn gốc trình duyệt từ xa vẫn cần các mục rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi nguồn gốc trình duyệt, không phải "khớp với bất kỳ máy chủ nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ dự phòng nguồn gốc theo header Host, nhưng đây là một chế độ bảo mật nguy hiểm.

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
