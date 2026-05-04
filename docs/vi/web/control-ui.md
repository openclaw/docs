---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, Node, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-04T09:37:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b68b5203b369de6a3354a7e7442ee38ee790875b2d7054b0c8ec997098fd9de
    source_path: web/control-ui.md
    workflow: 16
---

Control UI là một ứng dụng đơn trang **Vite + Lit** nhỏ được Gateway phục vụ:

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
- header danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- header danh tính proxy đáng tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của bảng điều khiển giữ token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu lại. Onboarding thường tạo token gateway để xác thực bằng bí mật dùng chung trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép đôi thiết bị (lần kết nối đầu tiên)

Khi bạn kết nối với Control UI từ trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép đôi một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

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

Nếu trình duyệt thử ghép đôi lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép đôi và bạn đổi từ quyền đọc sang quyền ghi/quản trị, việc này được xử lý như một nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ hoạt động, chặn lần kết nối lại với phạm vi rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và không cần phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

<Note>
- Kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép đôi cho các phiên vận hành Control UI khi `gateway.auth.allowTailscale: true`, danh tính Tailscale xác minh thành công, và trình duyệt trình bày danh tính thiết bị của nó.
- Liên kết Tailnet trực tiếp, kết nối trình duyệt qua LAN, và hồ sơ trình duyệt không có danh tính thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, nên việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép đôi lại.

</Note>

## Danh tính cá nhân (cục bộ trên trình duyệt)

Control UI hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và avatar) được gắn vào tin nhắn gửi đi để quy thuộc trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, được giới hạn theo hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hay lưu phía máy chủ ngoài metadata tác giả transcript thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại về rỗng.

Mẫu cục bộ trên trình duyệt tương tự áp dụng cho phần ghi đè avatar trợ lý. Avatar trợ lý đã tải lên chỉ phủ lên danh tính do gateway phân giải trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn khả dụng cho các client không phải UI ghi trực tiếp vào trường này (chẳng hạn gateway theo script hoặc bảng điều khiển tùy chỉnh).

## Endpoint cấu hình runtime

Control UI lấy cài đặt runtime từ `/__openclaw/control-ui-config.json`. Endpoint đó được bảo vệ bằng cùng cơ chế xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy dữ liệu, và một lần lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, danh tính Tailscale Serve, hoặc danh tính proxy đáng tin cậy.

## Hỗ trợ ngôn ngữ

Control UI có thể tự bản địa hóa trong lần tải đầu tiên dựa trên locale của trình duyệt. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn locale nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Locale được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ locale không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã locale mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo phát hành; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề tích hợp Claw, Knot và Dash, cộng với một khe nhập tweakcn cục bộ trên trình duyệt. Để nhập chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Trình nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một khe cục bộ đó; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Những gì nó có thể làm (hiện tại)

<AccordionGroup>
  <Accordion title="Trò chuyện và đàm thoại">
    - Trò chuyện với model qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Đàm thoại qua các phiên realtime của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần có ràng buộc qua WebSocket, và các plugin giọng nói realtime chỉ backend dùng truyền tải chuyển tiếp của Gateway. Bộ chuyển tiếp giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt truyền PCM từ microphone qua RPC `talk.realtime.relay*` và gửi các lệnh gọi công cụ `openclaw_agent_consult` ngược qua `chat.send` cho model OpenClaw lớn hơn đã cấu hình.
    - Truyền trực tuyến lệnh gọi công cụ + thẻ kết quả công cụ trực tiếp trong Trò chuyện (sự kiện agent).

  </Accordion>
  <Accordion title="Kênh, thực thể, phiên, giấc mơ">
    - Kênh: tích hợp sẵn cộng với trạng thái kênh plugin đóng gói/bên ngoài, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Thực thể: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: danh sách + ghi đè model/thinking/nhanh/chi tiết/trace/reasoning theo từng phiên (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái Dreaming, nút bật/tắt, và trình đọc Nhật ký Dream (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, phê duyệt exec">
    - Công việc Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: danh sách + khả năng (`node.list`).
    - Phê duyệt exec: chỉnh sửa allowlist của gateway hoặc node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/chỉnh sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại với xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các lần ghi bao gồm bộ bảo vệ base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đã gửi đang hoạt động nhưng chưa phân giải sẽ bị từ chối trước khi ghi.
    - Schema + kết xuất biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI đã khớp, tóm tắt con trực tiếp, metadata tài liệu trên node object/wildcard/array/composition lồng nhau, cùng schema plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ khả dụng khi snapshot có vòng đi-về thô an toàn.
    - Nếu một snapshot không thể đi-về văn bản thô một cách an toàn, Control UI bắt buộc chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - "Đặt lại về bản đã lưu" trong trình chỉnh sửa JSON thô giữ nguyên hình dạng do tác giả thô tạo (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại một snapshot đã làm phẳng, để các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể đi-về an toàn.
    - Giá trị object SecretRef có cấu trúc được hiển thị chỉ đọc trong input văn bản của biểu mẫu để tránh vô tình làm hỏng object thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/model + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Control UI cùng các mục về độ phản hồi của trình duyệt cho frame hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các kiểu mục PerformanceObserver đó.
    - Nhật ký: theo dõi trực tiếp nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại, rồi thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng công việc Cron">
    - Với công việc tách biệt, mặc định gửi là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ nội bộ.
    - Các trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` đặt thành URL webhook HTTP(S) hợp lệ.
    - Với công việc phiên chính, các chế độ gửi webhook và không gửi đều khả dụng.
    - Điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè agent, tùy chọn cron chính xác/rải thời gian, ghi đè model/thinking của agent, và nút bật/tắt gửi theo nỗ lực tốt nhất.
    - Xác thực biểu mẫu nằm inline với lỗi ở cấp trường; giá trị không hợp lệ sẽ tắt nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi bearer token riêng; nếu bỏ qua, webhook được gửi mà không có header xác thực.
    - Dự phòng không còn được khuyến nghị: các công việc legacy đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay bằng `{ runId, status: "started" }` và phản hồi được phát trực tuyến qua các sự kiện `chat`.
    - Nội dung tải lên trong chat chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu trữ dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` bị giới hạn kích thước để bảo vệ UI. Khi các mục bản ghi cuộc trò chuyện quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay các tin nhắn quá khổ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý/tạo sinh được lưu bền dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua các URL phương tiện Gateway đã xác thực, vì vậy việc tải lại không phụ thuộc vào việc payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử chat.
    - `chat.history` cũng loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản trợ lý nhìn thấy được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cũng như các token điều khiển mô hình ASCII/full-width bị rò rỉ, và bỏ qua các mục trợ lý có toàn bộ văn bản nhìn thấy được chỉ là token im lặng chính xác `NO_REPLY` / `no_reply`.
    - Trong lúc gửi đang hoạt động và lần làm mới lịch sử cuối cùng, khung nhìn chat giữ các tin nhắn người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` tạm thời trả về một snapshot cũ hơn; bản ghi chuẩn sẽ thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái phân phối, còn `chat.history` được dựng lại từ bản ghi phiên bền vững. Sau các sự kiện công cụ cuối cùng, Control UI tải lại lịch sử và chỉ hợp nhất một phần đuôi lạc quan nhỏ; ranh giới bản ghi được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` thêm một ghi chú trợ lý vào bản ghi phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không có lượt chạy agent, không phân phối qua kênh).
    - Tiêu đề chat hiển thị bộ lọc agent trước bộ chọn phiên, và bộ chọn phiên được giới hạn theo agent đã chọn. Khi chuyển agent, chỉ các phiên gắn với agent đó được hiển thị và sẽ quay về phiên chính của agent đó khi chưa có phiên dashboard nào được lưu.
    - Trên chiều rộng desktop, các điều khiển chat nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi; cuộn lên, quay lại đầu trang, hoặc chạm đáy sẽ khôi phục các điều khiển.
    - Các tin nhắn chỉ có văn bản trùng lặp liên tiếp hiển thị dưới dạng một bong bóng kèm huy hiệu số lượng. Các tin nhắn mang hình ảnh, tệp đính kèm, đầu ra công cụ, hoặc bản xem trước canvas không bị thu gọn.
    - Bộ chọn mô hình và thinking trong tiêu đề chat vá phiên đang hoạt động ngay lập tức qua `sessions.patch`; chúng là các ghi đè phiên được lưu bền, không phải tùy chọn gửi chỉ dùng cho một lượt.
    - Gõ `/new` trong Control UI sẽ tạo và chuyển sang cùng phiên dashboard mới như New Chat. Gõ `/reset` giữ lại thao tác đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình chat yêu cầu khung nhìn mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cộng với các nhà cung cấp có xác thực khả dụng. Danh mục đầy đủ vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới cho thấy áp lực ngữ cảnh cao, khu vực trình soạn chat hiển thị thông báo ngữ cảnh và, ở các mức Compaction được khuyến nghị, một nút gọn chạy đường dẫn Compaction phiên thông thường. Các snapshot token cũ được ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ Talk (thời gian thực trong trình duyệt)">
    Chế độ Talk dùng một nhà cung cấp thoại thời gian thực đã đăng ký. Cấu hình OpenAI bằng `talk.provider: "openai"` cộng với `talk.providers.openai.apiKey`, hoặc cấu hình Google bằng `talk.provider: "google"` cộng với `talk.providers.google.apiKey`; cấu hình nhà cung cấp thời gian thực Voice Call vẫn có thể được tái sử dụng làm phương án dự phòng. Trình duyệt không bao giờ nhận khóa API nhà cung cấp chuẩn. OpenAI nhận một secret máy khách Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API bị ràng buộc, dùng một lần cho phiên WebSocket trình duyệt, với chỉ dẫn và khai báo công cụ được Gateway khóa vào token. Các nhà cung cấp chỉ để lộ cầu nối thời gian thực backend chạy qua transport chuyển tiếp Gateway, nên thông tin xác thực và socket nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Lời nhắc phiên Realtime được Gateway lắp ráp; `talk.realtime.session` không chấp nhận ghi đè chỉ dẫn do bên gọi cung cấp.

    Trong trình soạn Chat, điều khiển Talk là nút hình sóng cạnh nút đọc chính tả bằng microphone. Khi Talk khởi động, hàng trạng thái trình soạn hiển thị `Connecting Talk...`, sau đó `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham khảo mô hình lớn hơn đã cấu hình qua `chat.send`.

    Smoke trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt bằng token bị ràng buộc của Google Live, và adapter trình duyệt chuyển tiếp Gateway với phương tiện microphone giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi log secret.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt theo sau thông thường sẽ được đưa vào hàng đợi. Nhấp **Điều hướng** trên một tin nhắn đã xếp hàng để chèn lượt theo sau đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm từ hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy bỏ ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy bỏ mọi lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy bỏ chưa hoàn chỉnh">
    - Khi một lượt chạy bị hủy bỏ, văn bản trợ lý chưa hoàn chỉnh vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền văn bản trợ lý chưa hoàn chỉnh bị hủy bỏ vào lịch sử bản ghi khi có đầu ra được đệm.
    - Các mục được lưu bền bao gồm siêu dữ liệu hủy bỏ để bên tiêu thụ bản ghi có thể phân biệt phần hủy bỏ chưa hoàn chỉnh với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Control UI đi kèm `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt đề xuất "Install app" khi nó truy cập được. |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và lượt nhấp thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID tự động tạo dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt được lưu bền.                          |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn cố định khóa (cho triển khai nhiều host, xoay vòng secret, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Control UI dùng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi một thông báo kiểm thử tới đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS iOS (xem [Cấu hình](/vi/gateway/configuration) để biết push có relay hỗ trợ) và phương thức `push.test` hiện có, vốn nhắm tới ghép đôi di động native.
</Note>

## Embed được host

Tin nhắn trợ lý có thể hiển thị nội dung web được host nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong các embed được host.
  </Tab>
  <Tab title="scripts (mặc định)">
    Cho phép embed tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các trò chơi/widget trình duyệt tự chứa.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` lên trên `allow-scripts` cho các tài liệu cùng site cố ý cần đặc quyền mạnh hơn.
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

Các URL embed `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn cố ý muốn `[embed url="https://..."]` tải trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chiều rộng tin nhắn chat

Các tin nhắn chat được nhóm dùng max-width mặc định dễ đọc. Các triển khai màn hình rộng có thể ghi đè mà không cần vá CSS đi kèm bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi tới trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài thuần và phần trăm như `960px` hoặc `82%`, cộng với các biểu thức chiều rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Tailscale Serve tích hợp (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với các header `x-forwarded-*` của Tailscale. Với các phiên toán tử Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép đôi thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn theo các kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực shared-secret rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thuần túy chạy đua song song.

    <Warning>
    Xác thực Serve không token giả định host gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên host đó, hãy yêu cầu xác thực token/password.
    </Warning>

  </Tab>
  <Tab title="Bind vào tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Dán bí mật dùng chung tương ứng vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở dashboard qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ đã được ghi nhận:

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

    - Nó cho phép các phiên Control UI trên localhost tiếp tục mà không cần danh tính thiết bị trong các ngữ cảnh HTTP không an toàn.
    - Nó không bỏ qua các kiểm tra ghép đôi.
    - Nó không nới lỏng yêu cầu danh tính thiết bị từ xa (không phải localhost).

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
    `dangerouslyDisableDeviceAuth` tắt các kiểm tra danh tính thiết bị của Control UI và là một sự hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh chóng sau khi dùng trong tình huống khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về trusted-proxy">
    - Xác thực trusted-proxy thành công có thể cho phép các phiên Control UI của **người vận hành** không cần danh tính thiết bị.
    - Điều này **không** áp dụng cho các phiên Control UI có vai trò node.
    - Reverse proxy local loopback trên cùng máy chủ vẫn không đáp ứng xác thực trusted-proxy; xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI đi kèm với chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng nguồn gốc**, URL `data:`, và URL `blob:` được tạo cục bộ. Các URL hình ảnh từ xa `http(s)` và URL hình ảnh tương đối theo giao thức bị trình duyệt từ chối và không tạo yêu cầu mạng.

Điều này có ý nghĩa thực tế như sau:

- Avatar và hình ảnh được phục vụ dưới các đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các route avatar đã xác thực mà UI tải về và chuyển đổi thành URL `blob:` cục bộ.
- URL nội tuyến `data:image/...` vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/huy hiệu tích hợp sẵn, nên một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của người vận hành tải hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực route avatar

Khi xác thực gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về ảnh avatar cho caller đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Các yêu cầu chưa xác thực tới một trong hai route đều bị từ chối (khớp với route assistant-media cùng cấp). Điều này ngăn route avatar làm rò rỉ danh tính agent trên các máy chủ vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token gateway dưới dạng bearer header khi tải avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn tắt xác thực gateway (không được khuyến nghị trên máy chủ dùng chung), route avatar cũng trở thành không cần xác thực, phù hợp với phần còn lại của gateway.

## Xác thực route phương tiện của assistant

Khi xác thực gateway được cấu hình, bản xem trước phương tiện cục bộ của assistant dùng route hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực người vận hành Control UI thông thường. Trình duyệt gửi token gateway dưới dạng bearer header khi kiểm tra tính khả dụng.
- Phản hồi siêu dữ liệu thành công bao gồm một `mediaTicket` tồn tại ngắn hạn, được giới hạn cho đúng đường dẫn nguồn đó.
- URL hình ảnh, âm thanh, video và tài liệu do trình duyệt hiển thị dùng `mediaTicket=<ticket>` thay vì token gateway hoặc mật khẩu đang hoạt động. Vé hết hạn nhanh và không thể cấp quyền cho nguồn khác.

Điều này giữ cho việc hiển thị phương tiện thông thường tương thích với các phần tử phương tiện gốc của trình duyệt mà không đặt thông tin đăng nhập Gateway có thể tái sử dụng trong các URL phương tiện hiển thị.

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

Control UI là các tệp tĩnh; mục tiêu WebSocket có thể cấu hình và có thể khác với nguồn gốc HTTP. Điều này hữu ích khi bạn muốn chạy máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

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
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - `token` nên được truyền qua fragment URL (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi tới máy chủ, nhờ đó tránh rò rỉ qua log yêu cầu và Referer. Tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ làm phương án dự phòng, và bị loại bỏ ngay sau khi bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin đăng nhập từ cấu hình hoặc môi trường. Hãy cung cấp rõ `token` (hoặc `password`). Thiếu thông tin đăng nhập rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải local loopback phải đặt `gateway.controlUi.allowedOrigins` rõ ràng (nguồn gốc đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Khi khởi động, Gateway có thể khởi tạo các nguồn gốc cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng các nguồn gốc trình duyệt từ xa vẫn cần mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` trừ khi kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi nguồn gốc trình duyệt, không phải "khớp với bất kỳ máy chủ nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback nguồn gốc theo Host header, nhưng đây là một chế độ bảo mật nguy hiểm.

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
