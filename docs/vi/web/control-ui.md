---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện người dùng điều khiển trên trình duyệt cho Gateway (trò chuyện, Node, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-04-30T00:07:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
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
- tiêu đề danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- tiêu đề danh tính proxy đáng tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt dashboard giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu giữ. Quy trình thiết lập ban đầu thường tạo token gateway cho xác thực bí mật dùng chung ở lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Giao diện điều khiển từ trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép nối một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

**Bạn sẽ thấy:** "đã ngắt kết nối (1008): cần ghép nối"

<Steps>
  <Step title="Liệt kê các yêu cầu đang chờ">
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

Nếu trình duyệt thử lại ghép nối với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép nối và bạn đổi từ quyền đọc sang quyền ghi/quản trị, việc này được xử lý như một nâng cấp phê duyệt, không phải là kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ vẫn hoạt động, chặn lần kết nối lại với quyền rộng hơn, và yêu cầu bạn phê duyệt rõ ràng tập phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không cần phê duyệt lại trừ khi bạn thu hồi thiết bị bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI thiết bị](/vi/cli/devices) để biết về xoay vòng token và thu hồi.

<Note>
- Các kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép nối cho các phiên vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, danh tính Tailscale được xác minh, và trình duyệt trình bày danh tính thiết bị của nó.
- Các liên kết Tailnet trực tiếp, kết nối trình duyệt LAN, và hồ sơ trình duyệt không có danh tính thiết bị vẫn cần phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

</Note>

## Danh tính cá nhân (cục bộ trong trình duyệt)

Giao diện điều khiển hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được gắn vào tin nhắn gửi đi để ghi nhận tác giả trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, được giới hạn trong hồ sơ trình duyệt hiện tại, và không được đồng bộ sang thiết bị khác hoặc lưu giữ phía máy chủ ngoài siêu dữ liệu tác giả bản ghi hội thoại thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại thành trống.

Mẫu cục bộ trong trình duyệt tương tự cũng áp dụng cho phần ghi đè ảnh đại diện trợ lý. Ảnh đại diện trợ lý đã tải lên phủ lên danh tính được gateway phân giải chỉ trên trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn có sẵn cho các máy khách không phải UI ghi trực tiếp vào trường này (như gateway theo kịch bản hoặc dashboard tùy chỉnh).

## Endpoint cấu hình runtime

Giao diện điều khiển lấy cài đặt runtime từ `/__openclaw/control-ui-config.json`. Endpoint đó được bảo vệ bởi cùng cơ chế xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và việc lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, danh tính Tailscale Serve, hoặc danh tính proxy đáng tin cậy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự bản địa hóa ở lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè sau này, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn ngôn ngữ nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Các bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại ở các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng tập ngôn ngữ không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của site tài liệu bị giới hạn ở các mã ngôn ngữ mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot và Dash tích hợp sẵn, cộng với một vị trí nhập tweakcn cục bộ trong trình duyệt. Để nhập chủ đề, mở [chủ đề tweakcn](https://tweakcn.com/themes), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Bộ nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô, và tên chủ đề mặc định như `amethyst-haze`.

Các chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một vị trí cục bộ; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Trò chuyện và nói chuyện">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Nói chuyện qua các phiên thời gian thực của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần bị ràng buộc qua WebSocket, và các plugin giọng nói thời gian thực chỉ chạy ở backend dùng truyền tải chuyển tiếp của Gateway. Bộ chuyển tiếp giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt phát PCM từ micrô qua các RPC `talk.realtime.relay*` và gửi các lệnh gọi công cụ `openclaw_agent_consult` trở lại qua `chat.send` cho mô hình OpenClaw lớn hơn đã cấu hình.
    - Truyền trực tuyến các lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện agent).

  </Accordion>
  <Accordion title="Kênh, phiên bản, phiên, giấc mơ">
    - Kênh: trạng thái các kênh tích hợp sẵn cộng với kênh plugin đi kèm/bên ngoài, đăng nhập QR, và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: danh sách + ghi đè mô hình/suy nghĩ/nhanh/chi tiết/truy vết/lập luận theo từng phiên (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái dreaming, công tắc bật/tắt, và trình đọc Nhật ký giấc mơ (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, node, phê duyệt exec">
    - Tác vụ Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: danh sách + khả năng (`node.list`).
    - Phê duyệt exec: sửa allowlist gateway hoặc node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các lần ghi bao gồm bộ bảo vệ base-hash để ngăn ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đã gửi đang hoạt động nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Schema + dựng biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các node đối tượng lồng nhau/ký tự đại diện/mảng/tổ hợp, cộng với schema plugin + kênh khi có); trình chỉnh sửa Raw JSON chỉ khả dụng khi snapshot có thể đi vòng thô an toàn.
    - Nếu một snapshot không thể đi vòng văn bản thô an toàn, Giao diện điều khiển buộc dùng chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - "Đặt lại về đã lưu" của trình chỉnh sửa Raw JSON giữ nguyên hình dạng do thô tạo ra (định dạng, chú thích, bố cục `$include`) thay vì dựng lại snapshot đã làm phẳng, để các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể đi vòng an toàn.
    - Các giá trị đối tượng SecretRef có cấu trúc được hiển thị chỉ đọc trong ô nhập văn bản của biểu mẫu để ngăn vô tình làm hỏng từ đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký: tail trực tiếp nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại, rồi poll `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng tác vụ Cron">
    - Với tác vụ cô lập, mặc định phân phối là thông báo tóm tắt. Bạn có thể chuyển sang không có nếu muốn chỉ chạy nội bộ.
    - Các trường kênh/mục tiêu xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành URL webhook HTTP(S) hợp lệ.
    - Với tác vụ phiên chính, có thể dùng các chế độ phân phối webhook và không có.
    - Điều khiển sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè agent, tùy chọn cron chính xác/rải thời gian, ghi đè mô hình/suy nghĩ của agent, và công tắc phân phối nỗ lực tối đa.
    - Xác thực biểu mẫu hiển thị nội tuyến với lỗi theo từng trường; giá trị không hợp lệ sẽ tắt nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi token bearer chuyên dụng; nếu bỏ qua, webhook được gửi không có tiêu đề xác thực.
    - Dự phòng không còn khuyến nghị: các tác vụ kế thừa đã lưu với `notify: true` vẫn có thể dùng `cron.webhook` cho đến khi được di chuyển.

  </Accordion>
</AccordionGroup>

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi được truyền trực tuyến qua các sự kiện `chat`.
    - Nội dung tải lên trong trò chuyện chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` trong khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để an toàn cho UI. Khi các mục transcript quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế các tin nhắn quá khổ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Hình ảnh do trợ lý/tạo sinh tạo ra được lưu bền dưới dạng tham chiếu phương tiện được quản lý và được phục vụ lại qua các URL phương tiện Gateway đã xác thực, nên việc tải lại không phụ thuộc vào payload ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - `chat.history` cũng loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản trợ lý hiển thị được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị cắt ngắn), cùng các mã thông báo điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục trợ lý có toàn bộ văn bản hiển thị chỉ là đúng mã thông báo im lặng `NO_REPLY` / `no_reply`.
    - Trong khi một lượt gửi đang hoạt động và trong lần làm mới lịch sử cuối cùng, khung trò chuyện vẫn giữ các tin nhắn người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` tạm thời trả về một snapshot cũ hơn; transcript chuẩn sẽ thay thế các tin nhắn cục bộ đó khi lịch sử Gateway bắt kịp.
    - `chat.inject` nối thêm một ghi chú trợ lý vào transcript phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không có lượt chạy tác nhân, không gửi qua kênh).
    - Các bộ chọn mô hình và mức suy luận ở đầu khung trò chuyện vá phiên đang hoạt động ngay lập tức qua `sessions.patch`; chúng là ghi đè phiên được lưu bền, không phải tùy chọn gửi chỉ áp dụng cho một lượt.
    - Bộ chọn mô hình trò chuyện yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó điều khiển bộ chọn. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` tường minh cộng với các nhà cung cấp có xác thực dùng được. Danh mục đầy đủ vẫn có sẵn qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi các báo cáo sử dụng phiên Gateway mới cho thấy áp lực ngữ cảnh cao, vùng soạn trò chuyện hiển thị thông báo ngữ cảnh và, ở các mức Compaction được khuyến nghị, một nút Compaction chạy đường dẫn Compaction phiên thông thường. Các snapshot mã thông báo cũ bị ẩn cho đến khi Gateway báo cáo mức sử dụng mới trở lại.

  </Accordion>
  <Accordion title="Chế độ Talk (thời gian thực trên trình duyệt)">
    Chế độ Talk sử dụng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI với `talk.provider: "openai"` cộng với `talk.providers.openai.apiKey`, hoặc cấu hình Google với `talk.provider: "google"` cộng với `talk.providers.google.apiKey`; cấu hình nhà cung cấp thời gian thực Voice Call vẫn có thể được tái sử dụng làm dự phòng. Trình duyệt không bao giờ nhận khóa API nhà cung cấp tiêu chuẩn. OpenAI nhận một bí mật máy khách Realtime tạm thời cho WebRTC. Google Live nhận một mã thông báo xác thực Live API bị ràng buộc, dùng một lần cho phiên WebSocket trình duyệt, với chỉ dẫn và khai báo công cụ được Gateway khóa vào mã thông báo. Các nhà cung cấp chỉ cung cấp cầu nối thời gian thực phía máy chủ sẽ chạy qua phương tiện truyền relay của Gateway, nên thông tin xác thực và socket của nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.realtime.session` không chấp nhận ghi đè chỉ dẫn do bên gọi cung cấp.

    Trong trình soạn trò chuyện, điều khiển Talk là nút sóng nằm cạnh nút đọc chính tả bằng micro. Khi Talk bắt đầu, hàng trạng thái của trình soạn hiển thị `Connecting Talk...`, sau đó là `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình qua `chat.send`.

    Kiểm thử smoke trực tiếp dành cho người bảo trì: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt bằng mã thông báo ràng buộc của Google Live, và bộ chuyển đổi trình duyệt relay Gateway với phương tiện micro giả lập. Lệnh chỉ in trạng thái nhà cung cấp và không ghi bí mật vào nhật ký.

  </Accordion>
  <Accordion title="Dừng và hủy">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt theo dõi thông thường sẽ được xếp hàng. Nhấp **Điều hướng** trên một tin nhắn đã xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Nhập `/stop` (hoặc các cụm từ hủy độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy ngoài luồng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy tất cả các lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Lưu giữ phần nội dung khi hủy">
    - Khi một lượt chạy bị hủy, phần văn bản trợ lý chưa hoàn chỉnh vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền phần văn bản trợ lý chưa hoàn chỉnh đã bị hủy vào lịch sử transcript khi có đầu ra được đệm.
    - Các mục được lưu bền bao gồm siêu dữ liệu hủy để trình tiêu thụ transcript có thể phân biệt phần nội dung hủy chưa hoàn chỉnh với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và Web Push

Control UI cung cấp `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

| Bề mặt                                               | Chức năng                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt đề xuất "Cài đặt ứng dụng" sau khi có thể truy cập được.   |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và lượt nhấp thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo, dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các điểm cuối đăng ký trình duyệt được lưu bền.                          |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn cố định khóa (cho triển khai nhiều máy chủ, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `mailto:openclaw@localhost`)

Control UI sử dụng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cộng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một điểm cuối đã đăng ký.
- `push.web.test` — gửi một thông báo kiểm thử đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn relay APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) để biết push dựa trên relay) và phương thức `push.test` hiện có, vốn nhắm tới ghép đôi di động native.
</Note>

## Nội dung nhúng được lưu trữ

Tin nhắn trợ lý có thể kết xuất nội dung web được lưu trữ nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox của iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi tập lệnh bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (mặc định)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập nguồn gốc; đây là mặc định và thường đủ cho các trò chơi/tiện ích trình duyệt tự chứa.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thật sự cần hành vi cùng nguồn gốc. Với hầu hết trò chơi do tác nhân tạo và các canvas tương tác, `scripts` là lựa chọn an toàn hơn.
</Warning>

Các URL nhúng `http(s)` bên ngoài dạng tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ ý muốn `[embed url="https://..."]` tải các trang của bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Tailscale Serve tích hợp (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Serve của Control UI/WebSocket có thể xác thực qua header định danh Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh định danh bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi yêu cầu chạm tới loopback với các header `x-forwarded-*` của Tailscale. Với các phiên vận hành Control UI có định danh thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép đôi thiết bị; các trình duyệt không có thiết bị và kết nối vai trò Node vẫn đi theo các kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật chia sẻ tường minh ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn định danh Serve bất đồng bộ đó, các lần thử xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử lại sai đồng thời từ cùng một trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp đơn thuần chạy đua song song.

    <Warning>
    Xác thực Serve không cần token giả định máy chủ Gateway là đáng tin cậy. Nếu mã cục bộ không tin cậy có thể chạy trên máy chủ đó, hãy yêu cầu xác thực token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Lắng nghe trên tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Dán bí mật chia sẻ tương ứng vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở bảng điều khiển qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong một **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Control UI không có định danh thiết bị.

Các ngoại lệ đã được ghi tài liệu:

- khả năng tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI vận hành thành công qua `gateway.auth.mode: "trusted-proxy"`
- ngoại lệ khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ Gateway)

<AccordionGroup>
  <Accordion title="Hành vi bật/tắt xác thực không an toàn">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` chỉ là một công tắc tương thích cục bộ:

    - Nó cho phép các phiên Control UI trên localhost tiếp tục mà không cần định danh thiết bị trong các ngữ cảnh HTTP không an toàn.
    - Nó không bỏ qua kiểm tra ghép đôi.
    - Nó không nới lỏng yêu cầu định danh thiết bị từ xa (không phải localhost).

  </Accordion>
  <Accordion title="Chỉ dùng khẩn cấp">
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
    `dangerouslyDisableDeviceAuth` tắt các bước kiểm tra danh tính thiết bị của Control UI và là mức hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh chóng sau khi dùng trong trường hợp khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú về trusted-proxy">
    - Xác thực trusted-proxy thành công có thể cho phép các phiên Control UI **operator** không có danh tính thiết bị.
    - Điều này **không** mở rộng sang các phiên Control UI vai trò node.
    - Reverse proxy loopback cùng máy vẫn không đáp ứng xác thực trusted-proxy; xem [Xác thực trusted proxy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI đi kèm chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **cùng nguồn gốc**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh `http(s)` từ xa và URL hình ảnh tương đối theo giao thức bị trình duyệt từ chối và không phát sinh lượt tải mạng.

Điều này có nghĩa trong thực tế:

- Avatar và hình ảnh được phục vụ dưới đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các tuyến avatar đã xác thực mà UI tải và chuyển đổi thành URL `blob:` cục bộ.
- URL nội tuyến `data:image/...` vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do metadata kênh phát ra sẽ bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/badge tích hợp sẵn, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của operator tải hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực tuyến avatar

Khi xác thực Gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token Gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho caller đã xác thực. `GET /avatar/<agentId>?meta=1` trả về metadata avatar theo cùng quy tắc.
- Yêu cầu chưa xác thực tới một trong hai tuyến đều bị từ chối (khớp với tuyến assistant-media cùng cấp). Điều này ngăn tuyến avatar làm lộ danh tính agent trên các host vốn được bảo vệ.
- Control UI tự chuyển tiếp token Gateway dưới dạng header bearer khi tải avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn tắt xác thực Gateway (không khuyến nghị trên host dùng chung), tuyến avatar cũng trở thành không cần xác thực, phù hợp với phần còn lại của Gateway.

## Xây dựng UI

Gateway phục vụ tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

```bash
pnpm ui:build
```

Base tuyệt đối tùy chọn (khi bạn muốn URL tài nguyên cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Để phát triển cục bộ (dev server riêng):

```bash
pnpm ui:dev
```

Sau đó trỏ UI tới URL WS của Gateway (ví dụ `ws://127.0.0.1:18789`).

## Gỡ lỗi/kiểm thử: dev server + Gateway từ xa

Control UI là các tệp tĩnh; mục tiêu WebSocket có thể cấu hình và có thể khác với nguồn gốc HTTP. Điều này hữu ích khi bạn muốn dùng Vite dev server cục bộ nhưng Gateway chạy ở nơi khác.

<Steps>
  <Step title="Khởi động UI dev server">
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
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn đúng cách.
    - `token` nên được truyền qua URL fragment (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi tới server, giúp tránh rò rỉ qua request-log và Referer. Tham số truy vấn `?token=` legacy vẫn được nhập một lần để tương thích, nhưng chỉ là fallback, và bị loại bỏ ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin đăng nhập từ cấu hình hoặc môi trường. Hãy cung cấp `token` (hoặc `password`) một cách rõ ràng. Thiếu thông tin đăng nhập rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (origin đầy đủ). Điều này bao gồm các thiết lập dev từ xa.
    - Khi khởi động, Gateway có thể seed các origin cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng origin trình duyệt từ xa vẫn cần mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi origin trình duyệt, không phải "khớp với bất kỳ host nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback origin theo header Host, nhưng đây là một chế độ bảo mật nguy hiểm.

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
- [Health Checks](/vi/gateway/health) — giám sát sức khỏe Gateway
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện chat trên trình duyệt
