---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển dựa trên trình duyệt cho Gateway (trò chuyện, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-02T20:58:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện điều khiển là một ứng dụng một trang **Vite + Lit** nhỏ được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Ứng dụng này giao tiếp **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- tiêu đề danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- tiêu đề danh tính trusted-proxy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt dashboard giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu giữ. Onboarding thường tạo một token gateway cho xác thực bí mật dùng chung trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Giao diện điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép nối một lần**. Đây là một biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "đã ngắt kết nối (1008): cần ghép nối"

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

Nếu trình duyệt thử ghép nối lại với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép nối và bạn đổi trình duyệt đó từ quyền đọc sang quyền ghi/quản trị, việc này được coi là nâng cấp phê duyệt, không phải tự động kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ còn hiệu lực, chặn lần kết nối lại với phạm vi rộng hơn, và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và không cần phê duyệt lại trừ khi bạn thu hồi thiết bị bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI thiết bị](/vi/cli/devices) để biết về xoay vòng và thu hồi token.

<Note>
- Kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép nối cho các phiên vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, danh tính Tailscale được xác minh, và trình duyệt xuất trình danh tính thiết bị của nó.
- Liên kết Tailnet trực tiếp, kết nối trình duyệt LAN, và hồ sơ trình duyệt không có danh tính thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, nên việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

</Note>

## Danh tính cá nhân (cục bộ trong trình duyệt)

Giao diện điều khiển hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) gắn vào tin nhắn gửi đi để quy kết tác giả trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, giới hạn trong hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hoặc lưu giữ phía máy chủ ngoài metadata tác giả transcript thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại danh tính này về trống.

Mẫu cục bộ trong trình duyệt tương tự áp dụng cho ghi đè ảnh đại diện của trợ lý. Ảnh đại diện trợ lý được tải lên chỉ phủ lên danh tính do gateway phân giải trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn khả dụng cho các client không phải UI ghi trực tiếp trường này (chẳng hạn như gateway theo script hoặc dashboard tùy chỉnh).

## Endpoint cấu hình runtime

Giao diện điều khiển lấy cài đặt runtime từ `/__openclaw/control-ui-config.json`. Endpoint đó được kiểm soát bởi cùng xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy dữ liệu từ đó, và một lần lấy dữ liệu thành công yêu cầu token/mật khẩu gateway đã hợp lệ, danh tính Tailscale Serve, hoặc danh tính trusted-proxy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự bản địa hóa trong lần tải đầu tiên dựa trên locale của trình duyệt. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn locale nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Locale được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Các bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ locale không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã locale mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot, và Dash tích hợp, cộng với một ô nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, mở [chủ đề tweakcn](https://tweakcn.com/themes), chọn hoặc tạo một chủ đề, bấm **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Bộ nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Các chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một ô cục bộ; xóa ô đó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Những việc có thể làm (hiện nay)

<AccordionGroup>
  <Accordion title="Trò chuyện và đàm thoại">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Đàm thoại thông qua phiên realtime của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt dùng một lần bị giới hạn qua WebSocket, và các Plugin giọng nói realtime chỉ backend dùng kênh chuyển tiếp của Gateway. Kênh chuyển tiếp giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt stream PCM từ micrô qua RPC `talk.realtime.relay*` và gửi lệnh gọi công cụ `openclaw_agent_consult` ngược qua `chat.send` cho mô hình OpenClaw lớn hơn đã cấu hình.
    - Stream lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện tác tử).

  </Accordion>
  <Accordion title="Kênh, instance, phiên, giấc mơ">
    - Kênh: trạng thái kênh tích hợp cộng với kênh Plugin đóng gói/bên ngoài, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Instance: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: danh sách + ghi đè theo từng phiên cho mô hình/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái dreaming, nút bật/tắt, và trình đọc Nhật ký giấc mơ (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, phê duyệt exec">
    - Công việc Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: danh sách + khả năng (`node.list`).
    - Phê duyệt exec: chỉnh sửa danh sách cho phép gateway hoặc node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động cuối cùng.
    - Các thao tác ghi bao gồm bộ bảo vệ base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các thao tác ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Schema + kết xuất biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, metadata tài liệu trên các node đối tượng lồng nhau/wildcard/mảng/composition, cộng với schema Plugin + kênh khi khả dụng); trình chỉnh sửa JSON thô chỉ khả dụng khi snapshot có khả năng vòng lặp thô an toàn.
    - Nếu snapshot không thể vòng lặp văn bản thô một cách an toàn, Giao diện điều khiển buộc dùng chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - "Đặt lại về đã lưu" của trình chỉnh sửa JSON thô giữ nguyên hình dạng do tác giả thô tạo ra (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại một snapshot đã làm phẳng, nên các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể vòng lặp an toàn.
    - Giá trị đối tượng SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản biểu mẫu để ngăn vô tình làm hỏng đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, log, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Log: theo dõi trực tiếp log tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại, sau đó thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng công việc Cron">
    - Với công việc cô lập, mặc định gửi thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ nội bộ.
    - Các trường kênh/mục tiêu xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành một URL webhook HTTP(S) hợp lệ.
    - Với công việc phiên chính, các chế độ gửi webhook và không gửi đều khả dụng.
    - Điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè tác tử, tùy chọn cron exact/stagger, ghi đè mô hình/thinking của tác tử, và nút bật/tắt gửi theo nỗ lực tối đa.
    - Xác thực biểu mẫu hiển thị nội tuyến với lỗi cấp trường; giá trị không hợp lệ sẽ tắt nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi token bearer chuyên dụng; nếu bỏ qua thì webhook được gửi không có tiêu đề xác thực.
    - Phương án dự phòng không được khuyến nghị: công việc legacy đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay bằng `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`.
    - Tải lên trong trò chuyện chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để bảo đảm an toàn cho UI. Khi các mục bản ghi quá lớn, Gateway có thể cắt bớt các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế thông điệp quá khổ bằng một phần giữ chỗ (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý/tạo sinh được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua các URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào việc payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - `chat.history` cũng loại bỏ khỏi văn bản trợ lý hiển thị các thẻ chỉ thị nội tuyến chỉ dùng cho hiển thị (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ đã bị cắt bớt), cũng như các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục trợ lý mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply`.
    - Trong khi một lượt gửi đang hoạt động và khi làm mới lịch sử cuối cùng, chế độ xem trò chuyện giữ các thông điệp người dùng/trợ lý cục bộ lạc quan hiển thị nếu `chat.history` tạm thời trả về một snapshot cũ hơn; bản ghi chuẩn sẽ thay thế các thông điệp cục bộ đó khi lịch sử Gateway bắt kịp.
    - `chat.inject` thêm một ghi chú trợ lý vào bản ghi phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không có lượt chạy agent, không gửi qua kênh).
    - Bộ chọn mô hình và suy nghĩ ở tiêu đề trò chuyện vá phiên hoạt động ngay lập tức thông qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ áp dụng cho một lượt.
    - Gõ `/new` trong Giao diện điều khiển tạo và chuyển sang cùng phiên bảng điều khiển mới như Trò chuyện mới. Gõ `/reset` giữ cơ chế đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trò chuyện yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó sẽ điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng các nhà cung cấp có xác thực dùng được. Toàn bộ danh mục vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới cho thấy áp lực ngữ cảnh cao, khu vực trình soạn trò chuyện hiển thị thông báo ngữ cảnh và, ở các mức Compaction được khuyến nghị, một nút thu gọn chạy đường dẫn Compaction phiên thông thường. Các snapshot token cũ bị ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ trò chuyện thoại (thời gian thực trong trình duyệt)">
    Chế độ trò chuyện thoại sử dụng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI bằng `talk.provider: "openai"` cộng với `talk.providers.openai.apiKey`, hoặc cấu hình Google bằng `talk.provider: "google"` cộng với `talk.providers.google.apiKey`; cấu hình nhà cung cấp thời gian thực Voice Call vẫn có thể được tái sử dụng làm phương án dự phòng. Trình duyệt không bao giờ nhận khóa API nhà cung cấp tiêu chuẩn. OpenAI nhận một bí mật máy khách Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API dùng một lần có ràng buộc cho phiên WebSocket trình duyệt, với chỉ dẫn và khai báo công cụ được Gateway khóa vào token. Các nhà cung cấp chỉ cung cấp cầu nối thời gian thực phía backend sẽ chạy qua truyền tải chuyển tiếp Gateway, để thông tin xác thực và socket nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Lời nhắc phiên Realtime được Gateway lắp ráp; `talk.realtime.session` không chấp nhận ghi đè chỉ dẫn do bên gọi cung cấp.

    Trong trình soạn Trò chuyện, điều khiển Trò chuyện thoại là nút sóng cạnh nút đọc chính tả bằng micrô. Khi Trò chuyện thoại bắt đầu, hàng trạng thái của trình soạn hiển thị `Connecting Talk...`, rồi `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình thông qua `chat.send`.

    Kiểm thử khói live cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trình duyệt của OpenAI, thiết lập WebSocket trình duyệt bằng token ràng buộc của Google Live, và bộ điều hợp trình duyệt chuyển tiếp Gateway với phương tiện micrô giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi log bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các phản hồi tiếp theo thông thường sẽ được đưa vào hàng đợi. Nhấp **Điều hướng** trên một thông điệp đang xếp hàng để chèn phản hồi tiếp theo đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm hủy độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy tất cả lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy bỏ một phần">
    - Khi một lượt chạy bị hủy, văn bản trợ lý một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền vững văn bản trợ lý một phần đã bị hủy vào lịch sử bản ghi khi có đầu ra đã được đệm.
    - Các mục được lưu bền vững bao gồm siêu dữ liệu hủy để bên tiêu thụ bản ghi có thể phân biệt phần hủy bỏ một phần với đầu ra hoàn tất bình thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Giao diện điều khiển đi kèm một `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó dưới dạng một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                                | Chức năng                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt đề xuất "Cài đặt ứng dụng" khi có thể truy cập. |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và lượt nhấp thông báo.    |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt đã lưu bền vững.                  |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều máy chủ, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Giao diện điều khiển sử dụng các phương thức Gateway có giới hạn phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) để biết push dựa trên chuyển tiếp) và phương thức `push.test` hiện có, vốn nhắm đến ghép đôi di động gốc.
</Note>

## Nhúng được lưu trữ

Thông điệp trợ lý có thể kết xuất nội dung web được lưu trữ trực tiếp bằng shortcode `[embed ...]`. Chính sách sandbox iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="nghiêm ngặt">
    Tắt thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (mặc định)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các trò chơi/widget trình duyệt độc lập.
  </Tab>
  <Tab title="đáng tin cậy">
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
Chỉ dùng `trusted` khi tài liệu được nhúng thực sự cần hành vi cùng origin. Với hầu hết trò chơi và canvas tương tác do agent tạo, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` tuyệt đối bên ngoài vẫn bị chặn theo mặc định. Nếu bạn chủ ý muốn `[embed url="https://..."]` tải các trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

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

Giá trị được xác thực trước khi đến trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài và phần trăm thuần như `960px` hoặc `82%`, cùng các biểu thức độ rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Tailscale Serve tích hợp (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Serve của Giao diện điều khiển/WebSocket có thể xác thực qua header định danh Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh định danh bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với các header `x-forwarded-*` của Tailscale. Với các phiên vận hành Giao diện điều khiển có định danh thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép đôi thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn đi theo các kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật dùng chung rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn định danh Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thuần chạy song song.

    <Warning>
    Xác thực Serve không cần token giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin có thể chạy trên máy chủ đó, hãy yêu cầu xác thực token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Gắn vào tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Dán bí mật dùng chung khớp vào cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** kết nối Giao diện điều khiển không có định danh thiết bị.

Các ngoại lệ đã được ghi tài liệu:

- tương thích HTTP không an toàn chỉ cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Giao diện điều khiển cho operator thành công thông qua `gateway.auth.mode: "trusted-proxy"`
- tùy chọn phá kính `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

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

    `allowInsecureAuth` chỉ là nút bật/tắt tương thích cục bộ:

    - Nó cho phép các phiên Control UI trên localhost tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không bảo mật.
    - Nó không bỏ qua các kiểm tra ghép đôi.
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
    `dangerouslyDisableDeviceAuth` tắt các kiểm tra danh tính thiết bị của Control UI và là một mức hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh chóng sau khi dùng khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về proxy đáng tin cậy">
    - Xác thực proxy đáng tin cậy thành công có thể cho phép các phiên Control UI của **người vận hành** mà không cần danh tính thiết bị.
    - Điều này **không** áp dụng cho các phiên Control UI với vai trò node.
    - Các proxy ngược local loopback cùng máy chủ vẫn không đáp ứng xác thực proxy đáng tin cậy; xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI đi kèm với chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng nguồn**, URL `data:`, và URL `blob:` được tạo cục bộ. Các URL hình ảnh từ xa dạng `http(s)` và URL hình ảnh tương đối theo giao thức sẽ bị trình duyệt từ chối và không tạo yêu cầu mạng.

Ý nghĩa trong thực tế:

- Avatar và hình ảnh được phục vụ dưới các đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các tuyến avatar đã xác thực mà UI tìm nạp và chuyển đổi thành URL `blob:` cục bộ.
- URL nội tuyến `data:image/...` vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra sẽ bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/huy hiệu tích hợp, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của người vận hành tìm nạp hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn được bật và không thể cấu hình.

## Xác thực tuyến avatar

Khi xác thực gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Các yêu cầu chưa xác thực đến một trong hai tuyến đều bị từ chối (khớp với tuyến assistant-media cùng cấp). Điều này ngăn tuyến avatar làm rò rỉ danh tính agent trên các máy chủ vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token gateway dưới dạng bearer header khi tìm nạp avatar, và dùng các URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn tắt xác thực gateway (không khuyến nghị trên máy chủ dùng chung), tuyến avatar cũng trở thành không cần xác thực, phù hợp với phần còn lại của gateway.

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

Sau đó trỏ UI đến URL Gateway WS của bạn (ví dụ `ws://127.0.0.1:18789`).

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Control UI là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với nguồn HTTP. Điều này hữu ích khi bạn muốn chạy máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

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
    - `token` nên được truyền qua fragment URL (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi đến máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Các tham số truy vấn cũ `?token=` vẫn được nhập một lần để tương thích, nhưng chỉ như phương án dự phòng, và bị loại bỏ ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không dùng dự phòng thông tin xác thực từ cấu hình hoặc môi trường. Hãy cung cấp `token` (hoặc `password`) rõ ràng. Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải loopback phải đặt `gateway.controlUi.allowedOrigins` rõ ràng (nguồn đầy đủ). Điều này bao gồm cả các thiết lập dev từ xa.
    - Khi khởi động, Gateway có thể gieo các nguồn cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime có hiệu lực, nhưng các nguồn trình duyệt từ xa vẫn cần mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi nguồn trình duyệt, không phải "khớp với bất kỳ host nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ dự phòng nguồn theo Host header, nhưng đây là chế độ bảo mật nguy hiểm.

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
