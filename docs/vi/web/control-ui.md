---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, các Node, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-04-29T23:22:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: d440cb80ae194f1994fde90e58b65e6194d2f4f87534696818e3f92b2969265d
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện điều khiển là một ứng dụng một trang nhỏ dùng **Vite + Lit** do Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Ứng dụng này giao tiếp **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

Xác thực được cung cấp trong quá trình bắt tay WebSocket thông qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- tiêu đề danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- tiêu đề danh tính proxy đáng tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của dashboard giữ token cho phiên tab trình duyệt hiện tại và URL Gateway đã chọn; mật khẩu không được lưu bền vững. Quy trình onboarding thường tạo token Gateway cho xác thực bí mật dùng chung ở lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép đôi thiết bị (lần kết nối đầu tiên)

Khi bạn kết nối tới Giao diện điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép đôi một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

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

Nếu trình duyệt thử ghép đôi lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ được thay thế và một `requestId` mới sẽ được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép đôi và bạn đổi trình duyệt từ quyền đọc sang quyền ghi/quản trị, việc này được xem là nâng cấp phê duyệt, không phải tự động kết nối lại im lặng. OpenClaw giữ phê duyệt cũ hoạt động, chặn lần kết nối lại với phạm vi rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không yêu cầu phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

<Note>
- Các kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép đôi cho các phiên vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, danh tính Tailscale được xác minh, và trình duyệt trình bày danh tính thiết bị của nó.
- Các bind Tailnet trực tiếp, kết nối trình duyệt LAN, và hồ sơ trình duyệt không có danh tính thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, nên việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép đôi lại.

</Note>

## Danh tính cá nhân (cục bộ trong trình duyệt)

Giao diện điều khiển hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và avatar) gắn với tin nhắn gửi đi để ghi nhận tác giả trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, được giới hạn trong hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hoặc lưu bền vững phía máy chủ ngoài metadata tác giả bản ghi hội thoại thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại về trống.

Mẫu cục bộ trong trình duyệt tương tự áp dụng cho phần ghi đè avatar của trợ lý. Avatar trợ lý đã tải lên chỉ phủ lên danh tính do Gateway phân giải trên trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn có sẵn cho các client không phải UI ghi trực tiếp vào trường đó (chẳng hạn như gateway được viết script hoặc dashboard tùy chỉnh).

## Endpoint cấu hình runtime

Giao diện điều khiển lấy cài đặt runtime từ `/__openclaw/control-ui-config.json`. Endpoint đó được kiểm soát bằng cùng cơ chế xác thực Gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy dữ liệu, và một lần lấy dữ liệu thành công cần token/mật khẩu Gateway đã hợp lệ, danh tính Tailscale Serve, hoặc danh tính proxy đáng tin cậy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự bản địa hóa khi tải lần đầu dựa trên locale trình duyệt của bạn. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn locale nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Locale được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ quay về tiếng Anh.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề tích hợp Claw, Knot, và Dash, cùng một ô nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, mở [chủ đề tweakcn](https://tweakcn.com/themes), chọn hoặc tạo một chủ đề, bấm **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Trình nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình Gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một ô cục bộ đó; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Có thể làm gì (hiện tại)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Nói chuyện qua các phiên realtime của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt dùng một lần bị giới hạn qua WebSocket, và các Plugin giọng nói realtime chỉ chạy backend dùng transport chuyển tiếp của Gateway. Chuyển tiếp này giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt stream PCM micro qua các RPC `talk.realtime.relay*` và gửi tool call `openclaw_agent_consult` trở lại qua `chat.send` cho mô hình OpenClaw lớn hơn đã cấu hình.
    - Stream tool call + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện agent).

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kênh: tích hợp sẵn cộng với trạng thái kênh Plugin đóng gói/bên ngoài, đăng nhập QR, và cấu hình theo kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: danh sách + ghi đè mô hình/thinking/fast/verbose/trace/reasoning theo từng phiên (`sessions.list`, `sessions.patch`).
    - Dream: trạng thái dreaming, nút bật/tắt, và trình đọc Nhật ký Dream (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Tác vụ Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: danh sách + năng lực (`node.list`).
    - Phê duyệt exec: chỉnh sửa allowlist Gateway hoặc Node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các lần ghi bao gồm bộ bảo vệ base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Schema + dựng biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, metadata tài liệu trên các node đối tượng lồng nhau/wildcard/mảng/composition, cộng với schema Plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ có sẵn khi snapshot có vòng lặp thô an toàn.
    - Nếu một snapshot không thể đi vòng an toàn dưới dạng văn bản thô, Giao diện điều khiển buộc dùng chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - "Đặt lại về bản đã lưu" trong trình chỉnh sửa JSON thô giữ nguyên hình dạng do tác giả thô tạo ra (định dạng, bình luận, bố cục `$include`) thay vì render lại một snapshot đã làm phẳng, nên các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể đi vòng an toàn.
    - Giá trị đối tượng SecretRef có cấu trúc được render chỉ đọc trong ô nhập văn bản biểu mẫu để ngăn hỏng dữ liệu do vô tình chuyển đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký: tail trực tiếp nhật ký file Gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại, rồi poll `update.status` sau khi kết nối lại để xác minh phiên bản Gateway đang chạy.

  </Accordion>
  <Accordion title="Cron jobs panel notes">
    - Với tác vụ cô lập, gửi mặc định là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ nội bộ.
    - Trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành một URL Webhook HTTP(S) hợp lệ.
    - Với tác vụ phiên chính, các chế độ gửi Webhook và không gửi đều có sẵn.
    - Điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè agent, tùy chọn cron exact/stagger, ghi đè mô hình/thinking của agent, và nút bật/tắt gửi best-effort.
    - Xác thực biểu mẫu hiển thị tại chỗ với lỗi cấp trường; giá trị không hợp lệ sẽ tắt nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi bearer token chuyên dụng; nếu bỏ qua thì Webhook được gửi không kèm tiêu đề xác thực.
    - Dự phòng đã ngừng khuyến nghị: các tác vụ legacy đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi được truyền luồng qua các sự kiện `chat`.
    - Tải lên trong chat chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` bị giới hạn kích thước để an toàn cho UI. Khi các mục bản ghi hội thoại quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế các tin nhắn quá khổ bằng một phần giữ chỗ (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý/tạo sinh tạo ra được lưu bền dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại thông qua URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào các payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử chat.
    - `chat.history` cũng loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản trợ lý nhìn thấy được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), các payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ đã bị cắt ngắn), cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục trợ lý mà toàn bộ văn bản nhìn thấy được chỉ là token im lặng chính xác `NO_REPLY` / `no_reply`.
    - Trong khi một lượt gửi đang hoạt động và trong lần làm mới lịch sử cuối cùng, chế độ xem chat giữ các tin nhắn người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` tạm thời trả về một ảnh chụp cũ hơn; bản ghi hội thoại chuẩn sẽ thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - `chat.inject` thêm một ghi chú trợ lý vào bản ghi hội thoại của phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không chạy tác nhân, không gửi qua kênh).
    - Các bộ chọn mô hình và chế độ suy nghĩ ở tiêu đề chat vá phiên đang hoạt động ngay lập tức thông qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ áp dụng cho một lượt.
    - Bộ chọn mô hình chat yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó sẽ điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng các nhà cung cấp có xác thực dùng được. Danh mục đầy đủ vẫn có sẵn thông qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo mức sử dụng phiên Gateway mới cho thấy áp lực ngữ cảnh cao, khu vực trình soạn chat hiển thị thông báo ngữ cảnh và, ở các mức Compaction được khuyến nghị, một nút thu gọn chạy đường dẫn Compaction phiên thông thường. Các ảnh chụp token cũ được ẩn cho đến khi Gateway báo cáo mức sử dụng mới trở lại.

  </Accordion>
  <Accordion title="Chế độ Talk (thời gian thực trong trình duyệt)">
    Chế độ Talk sử dụng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.provider: "openai"` cộng với `talk.providers.openai.apiKey`, hoặc cấu hình Google với `talk.provider: "google"` cộng với `talk.providers.google.apiKey`; cấu hình nhà cung cấp thời gian thực Voice Call vẫn có thể được tái sử dụng làm dự phòng. Trình duyệt không bao giờ nhận khóa API nhà cung cấp tiêu chuẩn. OpenAI nhận một khóa bí mật máy khách Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API bị ràng buộc dùng một lần cho phiên WebSocket trình duyệt, với hướng dẫn và khai báo công cụ được Gateway khóa vào token. Các nhà cung cấp chỉ để lộ một cầu nối thời gian thực backend sẽ chạy qua phương tiện truyền chuyển tiếp Gateway, để thông tin xác thực và socket nhà cung cấp nằm ở phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.realtime.session` không chấp nhận ghi đè hướng dẫn do bên gọi cung cấp.

    Trong trình soạn Chat, điều khiển Talk là nút sóng bên cạnh nút đọc chính tả bằng micrô. Khi Talk bắt đầu, hàng trạng thái của trình soạn hiển thị `Connecting Talk...`, rồi `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình thông qua `chat.send`.

    Kiểm thử khói trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt bằng token bị ràng buộc của Google Live, và bộ chuyển đổi trình duyệt chuyển tiếp Gateway với phương tiện micrô giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi log bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt theo dõi thông thường sẽ được xếp hàng. Nhấp **Điều hướng** trên một tin nhắn đã xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm từ hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy bỏ ngoài luồng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy bỏ tất cả các lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần một phần khi hủy bỏ">
    - Khi một lượt chạy bị hủy bỏ, văn bản trợ lý một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền văn bản trợ lý một phần bị hủy bỏ vào lịch sử bản ghi hội thoại khi có đầu ra đã đệm.
    - Các mục được lưu bền bao gồm siêu dữ liệu hủy bỏ để người tiêu thụ bản ghi hội thoại có thể phân biệt phần một phần do hủy bỏ với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và Web Push

Control UI đi kèm một `manifest.webmanifest` và một service worker, vì vậy các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt cung cấp "Cài đặt ứng dụng" khi có thể truy cập được. |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và nhấp vào thông báo.     |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tạo tự động dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt được lưu bền.                     |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều máy chủ, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Control UI sử dụng các phương thức Gateway giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cộng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS iOS (xem [Cấu hình](/vi/gateway/configuration) cho push dựa trên chuyển tiếp) và phương thức `push.test` hiện có, vốn nhắm tới ghép nối di động gốc.
</Note>

## Nhúng được lưu trữ

Tin nhắn trợ lý có thể hiển thị nội dung web được lưu trữ nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong phần nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (default)">
    Cho phép phần nhúng tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các trò chơi/widget trình duyệt tự chứa.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` trên nền `allow-scripts` cho các tài liệu cùng trang có chủ đích cần đặc quyền mạnh hơn.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thực sự cần hành vi cùng origin. Với hầu hết trò chơi và canvas tương tác do tác nhân tạo ra, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn cố ý muốn `[embed url="https://..."]` tải các trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Tailscale Serve tích hợp (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua tiêu đề danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với tiêu đề, và chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với các tiêu đề `x-forwarded-*` của Tailscale. Với phiên người vận hành Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép nối thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn tuân theo các kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật dùng chung rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thuần túy chạy đua song song.

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

    Dán bí mật dùng chung tương ứng vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong một **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ đã ghi tài liệu:

- tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI của người vận hành thành công thông qua `gateway.auth.mode: "trusted-proxy"`
- tùy chọn phá kính khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ gateway)

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

    `allowInsecureAuth` chỉ là một nút bật/tắt tương thích cục bộ:

    - Nó cho phép các phiên Control UI localhost tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không an toàn.
    - Nó không bỏ qua kiểm tra ghép nối.
    - Nó không nới lỏng yêu cầu danh tính thiết bị từ xa (không phải localhost).

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
    `dangerouslyDisableDeviceAuth` vô hiệu hóa các kiểm tra danh tính thiết bị của Control UI và là một mức hạ cấp bảo mật nghiêm trọng. Hoàn nguyên nhanh sau khi sử dụng khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Xác thực proxy tin cậy thành công có thể cho phép các phiên Control UI **người vận hành** không cần danh tính thiết bị.
    - Điều này **không** mở rộng đến các phiên Control UI vai trò nút.
    - Reverse proxy loopback cùng máy chủ vẫn không đáp ứng xác thực proxy tin cậy; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI đi kèm chính sách `img-src` chặt chẽ: chỉ cho phép tài sản **cùng nguồn gốc**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh từ xa `http(s)` và URL hình ảnh tương đối theo giao thức bị trình duyệt từ chối và không phát sinh yêu cầu mạng.

Điều này trong thực tế có nghĩa là:

- Avatar và hình ảnh được phục vụ dưới các đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các tuyến avatar đã xác thực mà UI tải về và chuyển đổi thành URL `blob:` cục bộ.
- URL nội tuyến `data:image/...` vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay thế bằng logo/huy hiệu tích hợp sẵn, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của người vận hành tải hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực tuyến avatar

Khi xác thực gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho caller đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Các yêu cầu chưa xác thực đến một trong hai tuyến đều bị từ chối (khớp với tuyến assistant-media cùng cấp). Điều này ngăn tuyến avatar làm rò rỉ danh tính agent trên các host vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token gateway dưới dạng header bearer khi tải avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn vô hiệu hóa xác thực gateway (không được khuyến nghị trên host dùng chung), tuyến avatar cũng trở thành không cần xác thực, phù hợp với phần còn lại của Gateway.

## Xây dựng UI

Gateway phục vụ các tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

```bash
pnpm ui:build
```

Base tuyệt đối tùy chọn (khi bạn muốn URL tài sản cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Để phát triển cục bộ (máy chủ dev riêng):

```bash
pnpm ui:dev
```

Sau đó trỏ UI tới URL WS của Gateway (ví dụ `ws://127.0.0.1:18789`).

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Control UI là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với nguồn gốc HTTP. Điều này tiện lợi khi bạn muốn dùng máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

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
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy URL-encode giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - `token` nên được truyền qua fragment URL (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi đến máy chủ, giúp tránh rò rỉ qua log yêu cầu và Referer. Tham số truy vấn cũ `?token=` vẫn được nhập một lần để tương thích, nhưng chỉ làm fallback, và bị loại bỏ ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin đăng nhập từ cấu hình hoặc môi trường. Cung cấp `token` (hoặc `password`) một cách rõ ràng. Thiếu thông tin đăng nhập rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải loopback phải đặt `gateway.controlUi.allowedOrigins` rõ ràng (nguồn gốc đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Khi khởi động, Gateway có thể gieo các nguồn gốc cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và port runtime hiệu lực, nhưng nguồn gốc trình duyệt từ xa vẫn cần các mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi nguồn gốc trình duyệt, không phải "khớp với bất kỳ host nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback nguồn gốc Host-header, nhưng đây là chế độ bảo mật nguy hiểm.

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
- [WebChat](/vi/web/webchat) — giao diện chat dựa trên trình duyệt
