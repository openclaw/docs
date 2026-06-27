---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, hoạt động, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-06-27T18:20:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện Điều khiển là một ứng dụng một trang **Vite + Lit** nhỏ được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ `/openclaw`)

Nó giao tiếp **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- các tiêu đề danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- các tiêu đề danh tính proxy đáng tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt dashboard giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu lâu dài. Onboarding thường tạo một token gateway cho xác thực bí mật dùng chung ở lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép đôi thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Giao diện Điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép đôi một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

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

Nếu trình duyệt đã được ghép đôi và bạn đổi nó từ quyền đọc sang quyền ghi/quản trị, việc này được xem là nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ hoạt động, chặn lần kết nối lại có phạm vi rộng hơn và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và không cần phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

Các tác nhân Paperclip kết nối qua bộ chuyển đổi `openclaw_gateway` dùng cùng luồng phê duyệt lần chạy đầu tiên. Sau lần thử kết nối ban đầu, chạy `openclaw devices approve --latest` để xem trước yêu cầu đang chờ, rồi chạy lại lệnh `openclaw devices approve <requestId>` được in ra để phê duyệt. Truyền các giá trị `--url` và `--token` rõ ràng cho gateway từ xa. Để giữ phê duyệt ổn định qua các lần khởi động lại, hãy cấu hình một `adapterConfig.devicePrivateKeyPem` bền vững trong Paperclip thay vì để nó tạo danh tính thiết bị tạm thời mới ở mỗi lần chạy.

<Note>
- Các kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép đôi cho các phiên vận hành Giao diện Điều khiển khi `gateway.auth.allowTailscale: true`, danh tính Tailscale xác minh thành công và trình duyệt trình bày danh tính thiết bị của nó.
- Các bind Tailnet trực tiếp, kết nối trình duyệt LAN và hồ sơ trình duyệt không có danh tính thiết bị vẫn cần phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, nên việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép đôi lại.

</Note>

## Danh tính cá nhân (cục bộ trong trình duyệt)

Giao diện Điều khiển hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được gắn vào tin nhắn gửi đi để quy kết trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, bị giới hạn trong hồ sơ trình duyệt hiện tại và không được đồng bộ sang thiết bị khác hay lưu bền vững phía máy chủ ngoài metadata tác giả bản ghi bình thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại nó về trống.

Cùng mẫu cục bộ trong trình duyệt cũng áp dụng cho ghi đè ảnh đại diện trợ lý. Ảnh đại diện trợ lý đã tải lên chỉ phủ lên danh tính do gateway phân giải trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn có sẵn cho các client không phải UI ghi trực tiếp vào trường này (chẳng hạn gateway theo script hoặc dashboard tùy chỉnh).

## Điểm cuối cấu hình runtime

Giao diện Điều khiển lấy cài đặt runtime từ `/control-ui-config.json`, được phân giải tương đối với đường dẫn cơ sở Giao diện Điều khiển của gateway (ví dụ `/__openclaw__/control-ui-config.json` khi UI được phục vụ dưới `/__openclaw__/`). Điểm cuối đó được bảo vệ bởi cùng xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và một lần lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, danh tính Tailscale Serve hoặc danh tính proxy đáng tin cậy.

## Hỗ trợ ngôn ngữ

Giao diện Điều khiển có thể tự bản địa hóa ở lần tải đầu tiên dựa trên locale của trình duyệt. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn locale nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Locale được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại ở các lần truy cập sau.
- Khóa dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ locale không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã locale mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot và Dash tích hợp, cùng một ô nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Bộ nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô và tên chủ đề mặc định như `amethyst-haze`.

Giao diện cũng bao gồm cài đặt Cỡ chữ cục bộ trong trình duyệt. Cài đặt này được lưu cùng phần còn lại của tùy chọn Giao diện Điều khiển, áp dụng cho văn bản trò chuyện, văn bản trình soạn, thẻ công cụ và thanh bên trò chuyện, đồng thời giữ trường nhập văn bản tối thiểu 16px để Safari di động không tự động phóng to khi focus.

Các chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay chủ đề đã nhập sẽ cập nhật một ô cục bộ; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Trò chuyện và Nói chuyện">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Làm mới lịch sử trò chuyện yêu cầu một cửa sổ gần đây có giới hạn với giới hạn văn bản theo từng tin nhắn để các phiên lớn không buộc trình duyệt kết xuất toàn bộ payload bản ghi trước khi cuộc trò chuyện dùng được.
    - Nói chuyện qua các phiên realtime của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt dùng một lần bị ràng buộc qua WebSocket, và các plugin giọng nói realtime chỉ backend dùng giao vận chuyển tiếp Gateway. Phiên provider do client sở hữu bắt đầu bằng `talk.client.create`; phiên chuyển tiếp Gateway bắt đầu bằng `talk.session.create`. Bộ chuyển tiếp giữ thông tin xác thực provider trên Gateway trong khi trình duyệt truyền PCM microphone qua `talk.session.appendAudio`, chuyển tiếp lệnh gọi công cụ provider `openclaw_agent_consult` qua `talk.client.toolCall` cho chính sách Gateway và mô hình OpenClaw lớn hơn đã cấu hình, đồng thời định tuyến điều hướng giọng nói của lần chạy đang hoạt động qua `talk.client.steer` hoặc `talk.session.steer`.
    - Phát trực tuyến lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện tác nhân).
    - Tab Hoạt động với tóm tắt cục bộ trong trình duyệt, ưu tiên biên tập che giấu, về hoạt động công cụ trực tiếp từ cơ chế gửi `session.tool` / sự kiện công cụ hiện có.

  </Accordion>
  <Accordion title="Kênh, phiên bản, phiên, giấc mơ">
    - Kênh: trạng thái kênh tích hợp cùng plugin kênh đi kèm/bên ngoài, đăng nhập QR và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Làm mới dò kênh giữ ảnh chụp trước đó hiển thị trong khi các kiểm tra provider chậm hoàn tất, và ảnh chụp một phần được gắn nhãn khi một lần dò hoặc kiểm tra vượt quá ngân sách UI.
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: mặc định liệt kê các phiên tác nhân đã cấu hình, quay về từ khóa phiên tác nhân chưa cấu hình bị cũ, và áp dụng ghi đè mô hình/thinking/fast/verbose/trace/reasoning theo từng phiên (`sessions.list`, `sessions.patch`).
    - Giấc mơ: trạng thái dreaming, công tắc bật/tắt và trình đọc Nhật ký Giấc mơ (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, kỹ năng, nút, phê duyệt exec">
    - Tác vụ Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Nút: liệt kê + giới hạn năng lực (`node.list`).
    - Phê duyệt exec: sửa allowlist gateway hoặc nút + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP có trang cài đặt riêng cho máy chủ đã cấu hình, trạng thái bật, tóm tắt OAuth/bộ lọc/song song, lệnh vận hành phổ biến và trình chỉnh sửa cấu hình `mcp` có phạm vi.
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Ghi bao gồm bảo vệ base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các thao tác ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Lưu biểu mẫu loại bỏ placeholder đã biên tập cũ không thể khôi phục từ cấu hình đã lưu trong khi vẫn giữ các giá trị đã biên tập vẫn ánh xạ tới bí mật đã lưu.
    - Schema + kết xuất biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI khớp, tóm tắt con trực tiếp, metadata tài liệu trên các nút đối tượng lồng nhau/wildcard/mảng/composition, cùng schema plugin + kênh khi có); trình chỉnh sửa Raw JSON chỉ có sẵn khi ảnh chụp có vòng đi-về thô an toàn.
    - Nếu một ảnh chụp không thể đi-về văn bản thô an toàn, Giao diện Điều khiển buộc chế độ Biểu mẫu và tắt chế độ Thô cho ảnh chụp đó.
    - Trình chỉnh sửa Raw JSON "Đặt lại về bản đã lưu" giữ nguyên hình dạng do tác giả thô tạo (định dạng, bình luận, bố cục `$include`) thay vì kết xuất lại ảnh chụp đã làm phẳng, để các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi ảnh chụp có thể đi-về an toàn.
    - Giá trị đối tượng SecretRef có cấu trúc được kết xuất chỉ đọc trong trường nhập văn bản biểu mẫu để ngăn hỏng dữ liệu ngoài ý muốn từ đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: ảnh chụp trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Giao diện Điều khiển, thời gian kết xuất trò chuyện/cấu hình chậm và các mục về độ phản hồi của trình duyệt cho khung hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các kiểu mục PerformanceObserver đó.
    - Nhật ký: tail trực tiếp nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) kèm báo cáo khởi động lại, rồi thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng tác vụ Cron">
    - Với các tác vụ cô lập, mặc định phân phối là thông báo bản tóm tắt. Bạn có thể chuyển sang none nếu muốn các lượt chạy chỉ dùng nội bộ.
    - Các trường kênh/đích xuất hiện khi announce được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành URL webhook HTTP(S) hợp lệ.
    - Với các tác vụ phiên chính, có thể dùng chế độ phân phối webhook và none.
    - Các điều khiển chỉnh sửa nâng cao bao gồm delete-after-run, xóa ghi đè agent, tùy chọn cron exact/stagger, ghi đè model/thinking của agent, và nút bật/tắt phân phối best-effort.
    - Xác thực biểu mẫu hiển thị nội tuyến với lỗi ở cấp trường; các giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi bearer token chuyên dụng; nếu bỏ qua, webhook được gửi mà không có header xác thực.
    - Dự phòng đã ngừng dùng: chạy `openclaw doctor --fix` để di chuyển các tác vụ cũ đã lưu có `notify: true` từ `cron.webhook` sang webhook theo từng tác vụ hoặc phân phối hoàn tất rõ ràng.

  </Accordion>
</AccordionGroup>

## Trang MCP

Trang MCP chuyên dụng là chế độ xem dành cho người vận hành đối với các máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Trang này không tự khởi động các transport MCP; hãy dùng nó để kiểm tra và chỉnh sửa cấu hình đã lưu, rồi dùng `openclaw mcp doctor --probe` khi bạn cần bằng chứng máy chủ đang hoạt động.

Quy trình điển hình:

1. Mở **MCP** từ thanh bên.
2. Kiểm tra các thẻ tóm tắt về tổng số máy chủ, số đã bật, OAuth, và số máy chủ đã lọc.
3. Xem từng hàng máy chủ về transport, trạng thái bật, xác thực, bộ lọc, timeout, và gợi ý lệnh.
4. Bật/tắt trạng thái bật khi một máy chủ cần vẫn được cấu hình nhưng không tham gia khám phá runtime.
5. Chỉnh sửa phần cấu hình `mcp` có phạm vi cho định nghĩa máy chủ, header, đường dẫn TLS/mTLS, siêu dữ liệu OAuth, bộ lọc công cụ, và siêu dữ liệu chiếu Codex.
6. Dùng **Lưu** để ghi cấu hình, hoặc **Lưu & Phát hành** khi Gateway đang chạy cần áp dụng cấu hình đã thay đổi.
7. Chạy `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, hoặc `openclaw mcp reload` từ terminal khi tiến trình đã chỉnh sửa cần chẩn đoán tĩnh, bằng chứng trực tiếp, hoặc loại bỏ runtime đã cache.

Trang này che các giá trị dạng URL chứa thông tin xác thực trước khi hiển thị và đặt tên máy chủ trong dấu nháy ở các đoạn lệnh để lệnh đã sao chép vẫn hoạt động với khoảng trắng hoặc ký tự đặc biệt của shell. Tài liệu tham chiếu CLI và cấu hình đầy đủ nằm trong [MCP](/vi/cli/mcp).

## Tab Hoạt động

Tab Hoạt động là trình quan sát tạm thời, cục bộ trong trình duyệt cho hoạt động công cụ trực tiếp. Nó được dẫn xuất từ cùng luồng sự kiện Gateway `session.tool` / công cụ đang cấp nguồn cho các thẻ công cụ Chat; nó không thêm họ sự kiện Gateway, endpoint, kho hoạt động bền vững, nguồn metrics, hay luồng quan sát bên ngoài nào khác.

Các mục Hoạt động chỉ giữ bản tóm tắt đã làm sạch và bản xem trước đầu ra đã che, bị cắt ngắn. Giá trị đối số công cụ không được lưu trong trạng thái Hoạt động; UI cho biết đối số bị ẩn và chỉ ghi lại số lượng trường đối số. Danh sách trong bộ nhớ đi theo tab trình duyệt hiện tại, tồn tại khi điều hướng trong Control UI, và đặt lại khi tải lại trang, đổi phiên, hoặc bấm **Xóa**.

## Hành vi Chat

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay bằng `{ runId, status: "started" }` và phản hồi được stream qua các sự kiện `chat`. Các client Control UI tin cậy cũng có thể nhận siêu dữ liệu thời gian ACK tùy chọn cho chẩn đoán cục bộ.
    - Tải lên trong Chat chấp nhận hình ảnh cộng với tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng media được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` bị giới hạn kích thước để bảo vệ UI. Khi các mục bản ghi quá lớn, Gateway có thể cắt ngắn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thông điệp quá cỡ bằng placeholder (`[chat.history omitted: message too large]`).
    - Khi một thông điệp assistant hiển thị bị cắt ngắn trong `chat.history`, trình đọc bên có thể lấy mục bản ghi đầy đủ đã chuẩn hóa hiển thị theo yêu cầu qua `chat.message.get` bằng `sessionKey`, `agentId` đang hoạt động khi cần, và `messageId` của bản ghi. Nếu Gateway vẫn không thể trả về thêm, trình đọc hiển thị trạng thái không khả dụng rõ ràng thay vì lặng lẽ lặp lại bản xem trước bị cắt ngắn.
    - Hình ảnh do assistant/tạo ra được lưu bền vững dưới dạng tham chiếu media được quản lý và phục vụ lại qua URL media Gateway đã xác thực, nên việc tải lại không phụ thuộc vào payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử chat.
    - Khi render `chat.history`, Control UI loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản assistant thấy được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML cuộc gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối cuộc gọi công cụ bị cắt ngắn), cùng token điều khiển model ASCII/full-width bị rò rỉ, và bỏ qua các mục assistant mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong khi đang gửi và khi làm mới lịch sử cuối cùng, chế độ xem chat giữ các thông điệp user/assistant lạc quan cục bộ hiển thị nếu `chat.history` tạm thời trả về snapshot cũ hơn; bản ghi chính tắc thay thế các thông điệp cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái phân phối, còn `chat.history` được dựng lại từ bản ghi phiên bền vững. Sau các sự kiện tool-final, Control UI tải lại lịch sử và chỉ hợp nhất một đuôi lạc quan nhỏ; ranh giới bản ghi được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` thêm một ghi chú assistant vào bản ghi phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không có lượt chạy agent, không phân phối kênh).
    - Header chat hiển thị bộ lọc agent trước bộ chọn phiên, và bộ chọn phiên được giới hạn theo agent đã chọn. Đổi agent chỉ hiển thị các phiên gắn với agent đó và quay về phiên chính của agent đó khi nó chưa có phiên dashboard đã lưu.
    - Ở chiều rộng desktop, các điều khiển chat nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi; cuộn lên, trở lại đầu trang, hoặc chạm đáy sẽ khôi phục các điều khiển.
    - Các thông điệp chỉ có văn bản trùng lặp liên tiếp được render thành một bong bóng với huy hiệu số lượng. Thông điệp có hình ảnh, tệp đính kèm, đầu ra công cụ, hoặc bản xem trước canvas thì không bị thu gọn.
    - Bộ chọn model và thinking trong header chat vá phiên đang hoạt động ngay qua `sessions.patch`; chúng là ghi đè phiên bền vững, không phải tùy chọn gửi chỉ cho một lượt.
    - Nếu bạn gửi thông điệp trong khi thay đổi bộ chọn model cho cùng phiên vẫn đang lưu, composer sẽ chờ bản vá phiên đó trước khi gọi `chat.send` để lượt gửi dùng model đã chọn.
    - Gõ `/new` trong Control UI sẽ tạo và chuyển sang cùng phiên dashboard mới như New Chat, trừ khi `session.dmScope: "main"` được cấu hình và parent hiện tại là phiên chính của agent; trong trường hợp đó, nó đặt lại phiên chính tại chỗ. Gõ `/reset` giữ thao tác đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn model chat yêu cầu chế độ xem model đã cấu hình của Gateway. Nếu có `agents.defaults.models`, allowlist đó điều khiển bộ chọn, bao gồm các mục `provider/*` giữ catalog theo phạm vi provider ở dạng động. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cộng với các provider có xác thực dùng được. Catalog đầy đủ vẫn có sẵn qua RPC debug `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới có token ngữ cảnh hiện tại, khu vực composer chat hiển thị chỉ báo sử dụng ngữ cảnh gọn. Chỉ báo chuyển sang kiểu cảnh báo khi áp lực ngữ cảnh cao và, ở mức Compaction khuyến nghị, hiển thị nút gọn chạy đường dẫn Compaction phiên bình thường. Snapshot token cũ bị ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ Talk (realtime trong trình duyệt)">
    Chế độ Talk dùng một provider giọng nói realtime đã đăng ký. Cấu hình OpenAI với `talk.realtime.provider: "openai"` cộng với hồ sơ xác thực API-key `openai`, `talk.realtime.providers.openai.apiKey`, hoặc `OPENAI_API_KEY`; hồ sơ OpenAI OAuth không cấu hình giọng nói Realtime. Cấu hình Google với `talk.realtime.provider: "google"` cộng với `talk.realtime.providers.google.apiKey`. Trình duyệt không bao giờ nhận API key provider tiêu chuẩn. OpenAI nhận client secret Realtime tạm thời cho WebRTC. Google Live nhận token xác thực Live API giới hạn dùng một lần cho phiên WebSocket trong trình duyệt, với chỉ dẫn và khai báo công cụ được Gateway khóa vào token. Các provider chỉ cung cấp cầu nối realtime backend chạy qua transport relay Gateway, nên thông tin xác thực và socket của nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.client.create` không chấp nhận ghi đè chỉ dẫn do caller cung cấp.

    Composer Chat có nút tùy chọn Talk bên cạnh nút bắt đầu/dừng Talk. Các tùy chọn áp dụng cho phiên Talk tiếp theo và có thể ghi đè provider, transport, model, voice, reasoning effort, ngưỡng VAD, thời lượng im lặng, và phần đệm tiền tố. Khi một tùy chọn trống, Gateway dùng mặc định đã cấu hình nếu có hoặc mặc định của provider. Chọn Gateway relay buộc dùng đường dẫn relay backend; chọn WebRTC giữ phiên thuộc sở hữu client và thất bại thay vì lặng lẽ rơi về relay nếu provider không thể tạo phiên trình duyệt.

    Trong composer Chat, điều khiển Talk là nút sóng cạnh nút đọc chính tả bằng microphone. Khi Talk bắt đầu, hàng trạng thái composer hiển thị `Connecting Talk...`, sau đó `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một cuộc gọi công cụ realtime đang tham khảo model lớn hơn đã cấu hình qua `talk.client.toolCall`.

    Smoke trực tiếp dành cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh cầu nối WebSocket backend OpenAI, trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt bằng token giới hạn Google Live, và bộ chuyển đổi trình duyệt Gateway relay với media microphone giả. Lệnh chỉ in trạng thái provider và không ghi log bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Bấm **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt theo dõi thông thường sẽ vào hàng đợi. Bấm **Điều hướng** trên một thông điệp đang xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy bỏ ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy bỏ tất cả lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy bỏ">
    - Khi một lượt chạy bị hủy bỏ, văn bản assistant một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền vững văn bản assistant một phần đã bị hủy bỏ vào lịch sử bản ghi khi có đầu ra đã đệm.
    - Các mục đã lưu bền vững bao gồm siêu dữ liệu hủy bỏ để người tiêu thụ bản ghi có thể phân biệt phần hủy bỏ với đầu ra hoàn tất bình thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Control UI đi kèm `manifest.webmanifest` và service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

Nếu trang hiển thị **Protocol mismatch** ngay sau một bản cập nhật OpenClaw, trước tiên hãy mở lại dashboard bằng `openclaw dashboard` và hard-refresh trang. Nếu vẫn lỗi, hãy xóa dữ liệu trang cho origin dashboard hoặc kiểm tra trong cửa sổ trình duyệt riêng tư; một tab cũ hoặc cache service-worker của trình duyệt có thể tiếp tục chạy bundle Control UI trước cập nhật với Gateway mới hơn.

| Bề mặt                                               | Chức năng                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt hiển thị tùy chọn "Cài đặt ứng dụng" khi có thể truy cập được.   |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và lượt nhấp thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt đã được lưu bền vững.                          |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn cố định khóa (cho triển khai nhiều máy chủ, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `https://openclaw.ai`)

Control UI dùng các phương thức Gateway được giới hạn theo scope này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn relay APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) cho push dựa trên relay) và phương thức `push.test` hiện có, vốn nhắm tới ghép nối di động gốc.
</Note>

## Nội dung nhúng được lưu trữ

Tin nhắn trợ lý có thể hiển thị nội dung web được lưu trữ trực tiếp bằng shortcode `[embed ...]`. Chính sách sandbox iframe được kiểm soát bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (default)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các trò chơi/tiện ích trình duyệt tự chứa.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` bên cạnh `allow-scripts` cho tài liệu cùng site cố ý cần đặc quyền mạnh hơn.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thật sự cần hành vi same-origin. Với hầu hết trò chơi và canvas tương tác do agent tạo, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` tuyệt đối bên ngoài vẫn bị chặn theo mặc định. Nếu bạn cố ý muốn `[embed url="https://..."]` tải các trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

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

Giá trị được xác thực trước khi đến trình duyệt. Các giá trị được hỗ trợ gồm độ dài và phần trăm thuần như `960px` hoặc `82%`, cùng các biểu thức chiều rộng có ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, và `fit-content(...)`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với header `x-forwarded-*` của Tailscale. Với phiên operator Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép nối thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn theo các kiểm tra thiết bị bình thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực shared-secret rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và scope xác thực được tuần tự hóa trước khi ghi rate-limit. Vì vậy, các lần thử sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thuần chạy song song.

    <Warning>
    Xác thực Serve không token giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên máy chủ đó, hãy yêu cầu xác thực token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Sau đó mở:

    - `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

    Dán shared secret tương ứng vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không bảo mật

Nếu bạn mở dashboard qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không bảo mật** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ được ghi nhận:

- tương thích HTTP không bảo mật chỉ cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực operator Control UI thành công qua `gateway.auth.mode: "trusted-proxy"`
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục được khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên máy chủ gateway)

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

    - Nó cho phép phiên Control UI localhost tiếp tục mà không có danh tính thiết bị trong ngữ cảnh HTTP không bảo mật.
    - Nó không bỏ qua kiểm tra ghép nối.
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
    `dangerouslyDisableDeviceAuth` tắt kiểm tra danh tính thiết bị Control UI và là một mức hạ cấp bảo mật nghiêm trọng. Hoàn nguyên nhanh sau khi dùng trong khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Xác thực trusted-proxy thành công có thể cho phép phiên Control UI **operator** không có danh tính thiết bị.
    - Điều này **không** mở rộng sang phiên Control UI vai trò node.
    - Các reverse proxy loopback cùng máy vẫn không thỏa mãn xác thực trusted-proxy; xem [Xác thực proxy tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để được hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI được phát hành với chính sách `img-src` chặt chẽ: chỉ cho phép tài nguyên **same-origin**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh `http(s)` từ xa và URL hình ảnh tương đối theo giao thức bị trình duyệt từ chối và không phát sinh lượt fetch mạng.

Điều này có nghĩa trong thực tế:

- Avatar và hình ảnh được phục vụ dưới đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các route avatar đã xác thực mà UI fetch và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do metadata kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/badge tích hợp, nên một kênh bị xâm phạm hoặc độc hại không thể ép trình duyệt operator fetch hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực route avatar

Khi xác thực gateway được cấu hình, endpoint avatar của Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về metadata avatar theo cùng quy tắc.
- Yêu cầu chưa xác thực tới một trong hai route đều bị từ chối (khớp với route assistant-media cùng cấp). Điều này ngăn route avatar rò rỉ danh tính agent trên các máy chủ vốn được bảo vệ.
- Bản thân Control UI chuyển tiếp token gateway dưới dạng bearer header khi fetch avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn tắt xác thực gateway (không khuyến nghị trên máy chủ dùng chung), route avatar cũng trở thành chưa xác thực, phù hợp với phần còn lại của gateway.

## Xác thực route media trợ lý

Khi xác thực gateway được cấu hình, bản xem trước media cục bộ của trợ lý dùng route hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực operator Control UI bình thường. Trình duyệt gửi token gateway dưới dạng bearer header khi kiểm tra tính khả dụng.
- Phản hồi metadata thành công bao gồm một `mediaTicket` ngắn hạn được giới hạn cho đúng đường dẫn nguồn đó.
- URL hình ảnh, âm thanh, video và tài liệu được trình duyệt render dùng `mediaTicket=<ticket>` thay vì token hoặc mật khẩu gateway đang hoạt động. Ticket hết hạn nhanh và không thể ủy quyền cho nguồn khác.

Điều này giữ cho việc render media bình thường tương thích với phần tử media gốc của trình duyệt mà không đặt thông tin xác thực gateway có thể tái sử dụng trong URL media hiển thị.

## Xây dựng UI

Gateway phục vụ tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

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

## Trang Control UI trống

Nếu trình duyệt tải dashboard trống và DevTools không hiển thị lỗi hữu ích, một extension hoặc content script chạy sớm có thể đã ngăn ứng dụng module JavaScript được đánh giá. Trang tĩnh bao gồm một bảng khôi phục HTML thuần xuất hiện khi `<openclaw-app>` chưa được đăng ký sau khi khởi động.

Dùng hành động **Thử lại** của bảng sau khi thay đổi môi trường trình duyệt, hoặc tải lại thủ công sau các kiểm tra này:

- Tắt extension chèn vào tất cả trang, đặc biệt là extension có content script `<all_urls>`.
- Thử cửa sổ riêng tư, hồ sơ trình duyệt sạch, hoặc trình duyệt khác.
- Giữ Gateway đang chạy và xác minh cùng URL dashboard sau khi thay đổi trình duyệt.

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Control UI là các tệp tĩnh; mục tiêu WebSocket có thể cấu hình và có thể khác với origin HTTP. Điều này tiện lợi khi bạn muốn máy chủ dev Vite chạy cục bộ nhưng Gateway chạy ở nơi khác.

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
  <Accordion title="Ghi chú">
    - `gatewayUrl` được lưu trong localStorage sau khi tải và bị xóa khỏi URL.
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL cho giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - `token` nên được truyền qua fragment của URL (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi đến máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Các tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ làm dự phòng, và bị loại bỏ ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin xác thực từ cấu hình hoặc môi trường. Hãy cung cấp `token` (hoặc `password`) một cách tường minh. Thiếu thông tin xác thực tường minh là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không được nhúng) để ngăn clickjacking.
    - Các triển khai Control UI công khai không phải loopback phải đặt `gateway.controlUi.allowedOrigins` một cách tường minh (origin đầy đủ). Các lượt tải LAN/Tailnet riêng tư cùng origin từ loopback, RFC1918/link-local, `.local`, `.ts.net`, hoặc máy chủ Tailscale CGNAT được chấp nhận mà không cần bật fallback Host-header.
    - Khi khởi động, Gateway có thể gieo các origin cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng các origin trình duyệt từ xa vẫn cần mục nhập tường minh.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` trừ khi kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi origin trình duyệt, không phải "khớp với bất kỳ host nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback origin Host-header, nhưng đây là một chế độ bảo mật nguy hiểm.

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

- [Dashboard](/vi/web/dashboard) — bảng điều khiển gateway
- [Health Checks](/vi/gateway/health) — giám sát sức khỏe gateway
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện trò chuyện dựa trên trình duyệt
