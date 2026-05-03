---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển dựa trên trình duyệt cho Gateway (trò chuyện, các Node, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-05-03T10:43:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 88959ccf435b31015039bf28c3043023d99f0b953a1489986ab2d0cbd261771c
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện điều khiển là một ứng dụng một trang nhỏ bằng **Vite + Lit** được phục vụ bởi Gateway:

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

Bảng cài đặt của bảng điều khiển giữ token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu. Quy trình thiết lập ban đầu thường tạo token gateway cho xác thực bí mật dùng chung trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối đầu tiên)

Khi bạn kết nối với Giao diện điều khiển từ trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép nối một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "đã ngắt kết nối (1008): yêu cầu ghép nối"

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

Nếu trình duyệt thử lại ghép nối với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép nối và bạn đổi từ quyền đọc sang quyền ghi/quản trị, việc này được xử lý như một nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ còn hiệu lực, chặn kết nối lại với phạm vi rộng hơn và yêu cầu bạn phê duyệt rõ ràng tập phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không yêu cầu phê duyệt lại trừ khi bạn thu hồi thiết bị bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

<Note>
- Kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua lượt ghép nối cho các phiên vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, định danh Tailscale xác minh thành công và trình duyệt trình bày định danh thiết bị của nó.
- Các bind Tailnet trực tiếp, kết nối trình duyệt LAN và hồ sơ trình duyệt không có định danh thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, nên việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

</Note>

## Danh tính cá nhân (cục bộ trong trình duyệt)

Giao diện điều khiển hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được gắn vào tin nhắn gửi đi để quy trách nhiệm trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, bị giới hạn trong hồ sơ trình duyệt hiện tại và không được đồng bộ sang thiết bị khác hay lưu phía máy chủ ngoài siêu dữ liệu tác giả bản ghi thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại về trống.

Mẫu cục bộ trong trình duyệt tương tự áp dụng cho ghi đè ảnh đại diện trợ lý. Ảnh đại diện trợ lý đã tải lên chỉ phủ lên danh tính do gateway phân giải trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn có sẵn cho các client không phải UI ghi trực tiếp trường này (chẳng hạn gateway theo script hoặc bảng điều khiển tùy chỉnh).

## Điểm cuối cấu hình thời gian chạy

Giao diện điều khiển lấy cài đặt thời gian chạy từ `/__openclaw/control-ui-config.json`. Điểm cuối đó được bảo vệ bởi cùng cơ chế xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và một lần lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, định danh Tailscale Serve hoặc định danh proxy tin cậy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự bản địa hóa trong lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn ngôn ngữ nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ dự phòng về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng tập ngôn ngữ không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã ngôn ngữ mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề tích hợp Claw, Knot và Dash, cộng với một vị trí nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, mở [chủ đề tweakcn](https://tweakcn.com/themes), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Trình nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô và tên chủ đề mặc định như `amethyst-haze`.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một vị trí cục bộ; xóa chủ đề đó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Trò chuyện và nói chuyện">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Nói chuyện qua các phiên thời gian thực trong trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt dùng một lần bị ràng buộc qua WebSocket, và các plugin giọng nói thời gian thực chỉ phía backend dùng truyền tải chuyển tiếp Gateway. Truyền tải chuyển tiếp giữ thông tin xác thực của nhà cung cấp trên Gateway trong khi trình duyệt phát PCM từ micro qua RPC `talk.realtime.relay*` và gửi lệnh gọi công cụ `openclaw_agent_consult` ngược qua `chat.send` cho mô hình OpenClaw lớn hơn đã cấu hình.
    - Phát trực tuyến lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện tác tử).

  </Accordion>
  <Accordion title="Kênh, phiên bản, phiên, giấc mơ">
    - Kênh: trạng thái kênh tích hợp cộng với kênh plugin đóng gói/bên ngoài, đăng nhập QR và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: danh sách + ghi đè mô hình/suy nghĩ/nhanh/chi tiết/dấu vết/lập luận theo từng phiên (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái Dreaming, nút bật/tắt và trình đọc Nhật ký giấc mơ (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nút, phê duyệt exec">
    - Công việc Cron: liệt kê/thêm/chỉnh sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Nút: danh sách + khả năng (`node.list`).
    - Phê duyệt exec: chỉnh sửa danh sách cho phép của gateway hoặc nút + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/chỉnh sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại có xác thực (`config.apply`) và đánh thức phiên hoạt động cuối cùng.
    - Ghi bao gồm cơ chế bảo vệ băm cơ sở để ngăn ghi đè các chỉnh sửa đồng thời.
    - Ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; ref đang hoạt động đã gửi nhưng chưa phân giải sẽ bị từ chối trước khi ghi.
    - Kết xuất schema + biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các nút đối tượng lồng nhau/ký tự đại diện/mảng/thành phần, cộng với schema plugin + kênh khi có); trình chỉnh sửa Raw JSON chỉ khả dụng khi snapshot có thể khứ hồi thô an toàn.
    - Nếu một snapshot không thể khứ hồi văn bản thô an toàn, Giao diện điều khiển buộc dùng chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - "Đặt lại về đã lưu" trong trình chỉnh sửa Raw JSON giữ nguyên hình dạng do nội dung thô tạo ra (định dạng, nhận xét, bố cục `$include`) thay vì kết xuất lại snapshot đã làm phẳng, để các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể khứ hồi an toàn.
    - Giá trị đối tượng SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản biểu mẫu để ngăn lỗi vô tình làm hỏng đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/tình trạng/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký: theo dõi trực tiếp phần cuối nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại, rồi thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng công việc Cron">
    - Với công việc cô lập, mặc định phân phối là thông báo tóm tắt. Bạn có thể chuyển sang không có nếu muốn các lần chạy chỉ dùng nội bộ.
    - Trường kênh/mục tiêu xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành URL webhook HTTP(S) hợp lệ.
    - Với công việc phiên chính, có sẵn chế độ phân phối webhook và không có.
    - Điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè tác tử, tùy chọn cron chính xác/phân tán, ghi đè mô hình/suy nghĩ của tác tử và nút bật/tắt phân phối nỗ lực tối đa.
    - Xác thực biểu mẫu hiển thị nội tuyến với lỗi cấp trường; giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi bearer token chuyên dụng; nếu bỏ qua, webhook sẽ được gửi không có tiêu đề xác thực.
    - Dự phòng không dùng nữa: các công việc cũ đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`.
    - Tải lên trong trò chuyện chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để đảm bảo an toàn cho giao diện. Khi các mục bản ghi hội thoại quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế những tin nhắn quá khổ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý tạo ra được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua các URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào việc payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - `chat.history` cũng loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản trợ lý nhìn thấy được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), các payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị cắt ngắn), cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục trợ lý mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply`.
    - Trong khi một lần gửi đang hoạt động và khi làm mới lịch sử cuối cùng, khung trò chuyện vẫn giữ các tin nhắn người dùng/trợ lý cục bộ được hiển thị trước nếu `chat.history` tạm thời trả về snapshot cũ hơn; bản ghi hội thoại chuẩn thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - `chat.inject` thêm một ghi chú của trợ lý vào bản ghi hội thoại của phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho giao diện (không có lượt chạy tác tử, không gửi qua kênh).
    - Bộ chọn mô hình và suy luận ở tiêu đề trò chuyện vá phiên đang hoạt động ngay lập tức thông qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ áp dụng cho một lượt.
    - Nhập `/new` trong Giao diện điều khiển sẽ tạo và chuyển sang cùng một phiên bảng điều khiển mới như Trò chuyện mới. Nhập `/reset` giữ nguyên thao tác đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trò chuyện yêu cầu khung nhìn mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng các nhà cung cấp có xác thực dùng được. Danh mục đầy đủ vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi các báo cáo sử dụng phiên Gateway mới cho thấy áp lực ngữ cảnh cao, vùng soạn trò chuyện hiển thị thông báo ngữ cảnh và, ở các mức Compaction được khuyến nghị, một nút Compaction chạy đường dẫn Compaction phiên thông thường. Các snapshot token lỗi thời bị ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ Talk (thời gian thực trên trình duyệt)">
    Chế độ Talk dùng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.provider: "openai"` cùng `talk.providers.openai.apiKey`, hoặc cấu hình Google với `talk.provider: "google"` cùng `talk.providers.google.apiKey`; cấu hình nhà cung cấp thời gian thực cho cuộc gọi thoại vẫn có thể được dùng lại làm dự phòng. Trình duyệt không bao giờ nhận khóa API tiêu chuẩn của nhà cung cấp. OpenAI nhận một secret máy khách Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API dùng một lần và bị ràng buộc cho phiên WebSocket trên trình duyệt, với chỉ dẫn và khai báo công cụ được Gateway khóa vào token. Các nhà cung cấp chỉ cung cấp cầu nối thời gian thực phía backend chạy qua lớp truyền relay của Gateway, nên thông tin xác thực và socket nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.realtime.session` không chấp nhận ghi đè chỉ dẫn do bên gọi cung cấp.

    Trong trình soạn Trò chuyện, điều khiển Talk là nút sóng nằm cạnh nút ghi âm chính tả bằng micrô. Khi Talk khởi động, hàng trạng thái của trình soạn hiển thị `Connecting Talk...`, sau đó `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lời gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình thông qua `chat.send`.

    Smoke live cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trên trình duyệt của OpenAI, thiết lập WebSocket trình duyệt bằng token ràng buộc của Google Live, và bộ điều hợp trình duyệt relay Gateway với phương tiện micrô giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi secret vào log.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt tiếp theo thông thường sẽ được xếp hàng. Nhấp **Dẫn hướng** trên một tin nhắn đã xếp hàng để đưa lượt tiếp theo đó vào lượt đang chạy.
    - Nhập `/stop` (hoặc các cụm hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy bỏ ngoài luồng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy bỏ tất cả lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại nội dung một phần khi hủy bỏ">
    - Khi một lượt chạy bị hủy bỏ, văn bản trợ lý một phần vẫn có thể được hiển thị trong giao diện.
    - Gateway lưu bền vững văn bản trợ lý một phần đã bị hủy bỏ vào lịch sử bản ghi hội thoại khi có đầu ra đã được đệm.
    - Các mục đã lưu bao gồm siêu dữ liệu hủy bỏ để bên tiêu thụ bản ghi hội thoại có thể phân biệt phần nội dung do hủy bỏ với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và Web Push

Giao diện điều khiển cung cấp `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                               | Chức năng                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Tệp kê khai PWA. Trình duyệt cung cấp tùy chọn "Cài đặt ứng dụng" khi có thể truy cập được.   |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và lượt nhấp thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt được lưu bền vững.                          |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn cố định khóa (cho triển khai nhiều máy chủ, xoay vòng secret, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Giao diện điều khiển dùng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử tới đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn relay APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) cho push dựa trên relay) và phương thức `push.test` hiện có, vốn nhắm tới ghép nối di động gốc.
</Note>

## Nội dung nhúng được lưu trữ

Tin nhắn trợ lý có thể kết xuất nội dung web được lưu trữ nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox iframe được kiểm soát bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (mặc định)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các trò chơi/tiện ích trình duyệt tự chứa.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thực sự cần hành vi cùng origin. Với hầu hết trò chơi và canvas tương tác do tác tử tạo ra, `scripts` là lựa chọn an toàn hơn.
</Warning>

Các URL nhúng `http(s)` bên ngoài dạng tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ ý muốn `[embed url="https://..."]` tải các trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chiều rộng tin nhắn trò chuyện

Các tin nhắn trò chuyện được nhóm dùng chiều rộng tối đa mặc định dễ đọc. Các triển khai trên màn hình rộng có thể ghi đè mà không cần vá CSS đi kèm bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi tới trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài và phần trăm thuần như `960px` hoặc `82%`, cùng các biểu thức chiều rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Tailscale Serve tích hợp (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

    Theo mặc định, các yêu cầu Serve của Giao diện điều khiển/WebSocket có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp địa chỉ đó với header, đồng thời chỉ chấp nhận những yêu cầu này khi yêu cầu đi vào loopback với các header `x-forwarded-*` của Tailscale. Với các phiên vận hành Giao diện điều khiển có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép nối thiết bị; trình duyệt không có thiết bị và kết nối vai trò Node vẫn đi theo các kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật chia sẻ rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp đơn thuần chạy đua song song.

    <Warning>
    Xác thực Serve không dùng token giả định máy chủ Gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên máy chủ đó, hãy yêu cầu xác thực bằng token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Lắng nghe trên tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

    Dán bí mật chia sẻ khớp vào cài đặt giao diện (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Giao diện điều khiển không có danh tính thiết bị.

Các ngoại lệ được ghi nhận:

- khả năng tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Giao diện điều khiển của người vận hành thành công thông qua `gateway.auth.mode: "trusted-proxy"`
- ngoại lệ khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở giao diện cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ Gateway)

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
    - Nó không bỏ qua các kiểm tra ghép nối.
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
    `dangerouslyDisableDeviceAuth` vô hiệu hóa các kiểm tra danh tính thiết bị của Control UI và là một sự hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh chóng sau khi sử dụng khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về proxy tin cậy">
    - Xác thực proxy tin cậy thành công có thể cho phép các phiên Control UI của **người vận hành** mà không cần danh tính thiết bị.
    - Điều này **không** áp dụng cho các phiên Control UI có vai trò node.
    - Proxy ngược local loopback cùng máy chủ vẫn không đáp ứng xác thực proxy tin cậy; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI được phân phối với chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng origin**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh `http(s)` từ xa và URL hình ảnh tương đối theo giao thức sẽ bị trình duyệt từ chối và không tạo lượt fetch mạng.

Điều này có nghĩa là trong thực tế:

- Avatar và hình ảnh được phục vụ dưới các đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các tuyến avatar đã xác thực mà UI fetch và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do siêu dữ liệu kênh phát ra sẽ bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/huy hiệu tích hợp, nên một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của người vận hành fetch hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực tuyến avatar

Khi xác thực Gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token Gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho caller đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Các yêu cầu chưa xác thực đến một trong hai tuyến đều bị từ chối (khớp với tuyến assistant-media cùng cấp). Điều này ngăn tuyến avatar làm lộ danh tính agent trên các máy chủ vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token Gateway dưới dạng header bearer khi fetch avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn vô hiệu hóa xác thực Gateway (không khuyến nghị trên máy chủ dùng chung), tuyến avatar cũng trở thành chưa xác thực, phù hợp với phần còn lại của Gateway.

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

Control UI là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với origin HTTP. Điều này hữu ích khi bạn muốn dùng máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

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
    - `token` nên được truyền qua fragment URL (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi tới máy chủ, giúp tránh rò rỉ qua log yêu cầu và Referer. Tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ là phương án dự phòng, và bị xóa ngay sau khi bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin xác thực từ cấu hình hoặc môi trường. Hãy cung cấp rõ ràng `token` (hoặc `password`). Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (origin đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Khi khởi động, Gateway có thể seed các origin cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng origin trình duyệt từ xa vẫn cần các mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép bất kỳ origin trình duyệt nào, không phải "khớp với bất kỳ máy chủ nào tôi đang dùng."
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

- [Dashboard](/vi/web/dashboard) — dashboard Gateway
- [Kiểm tra sức khỏe](/vi/gateway/health) — giám sát sức khỏe Gateway
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện chat trên trình duyệt
