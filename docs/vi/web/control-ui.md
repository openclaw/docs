---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, hoạt động, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-07-02T01:01:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

Control UI là một ứng dụng một trang **Vite + Lit** nhỏ được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Nó giao tiếp **trực tiếp với Gateway WebSocket** trên cùng một cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

<Note>
Trên các liên kết LAN gốc của Windows, Windows Firewall hoặc Group Policy do tổ chức quản lý vẫn có thể chặn URL LAN được quảng bá ngay cả khi `127.0.0.1` hoạt động trên máy chủ Gateway. Chạy `openclaw gateway status --deep` trên máy chủ Windows; lệnh này báo cáo các cổng có khả năng bị chặn, sai lệch hồ sơ và các quy tắc tường lửa cục bộ mà chính sách có thể bỏ qua.
</Note>

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- tiêu đề định danh Tailscale Serve khi `gateway.auth.allowTailscale: true`
- tiêu đề định danh proxy tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của dashboard giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu lại. Onboarding thường tạo một gateway token cho xác thực shared-secret ở lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép đôi thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Control UI từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép đôi một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

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

Nếu trình duyệt thử ghép đôi lại với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép đôi và bạn đổi từ quyền đọc sang quyền ghi/quản trị, việc này được coi là nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ đang hoạt động, chặn lần kết nối lại với phạm vi rộng hơn và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và sẽ không yêu cầu phê duyệt lại trừ khi bạn thu hồi thiết bị bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI Thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

Các agent Paperclip kết nối qua bộ điều hợp `openclaw_gateway` dùng cùng luồng phê duyệt lần chạy đầu tiên. Sau lần thử kết nối ban đầu, chạy `openclaw devices approve --latest` để xem trước yêu cầu đang chờ, rồi chạy lại lệnh `openclaw devices approve <requestId>` đã in ra để phê duyệt. Truyền các giá trị `--url` và `--token` rõ ràng cho một gateway từ xa. Để giữ phê duyệt ổn định qua các lần khởi động lại, hãy cấu hình `adapterConfig.devicePrivateKeyPem` bền vững trong Paperclip thay vì để nó tạo một danh tính thiết bị tạm thời mới cho mỗi lần chạy.

<Note>
- Các kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua lượt ghép đôi khứ hồi cho các phiên vận hành Control UI khi `gateway.auth.allowTailscale: true`, định danh Tailscale xác minh thành công và trình duyệt trình diện danh tính thiết bị của nó.
- Các liên kết Tailnet trực tiếp, kết nối trình duyệt LAN và hồ sơ trình duyệt không có danh tính thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép đôi lại.

</Note>

## Danh tính cá nhân (cục bộ trong trình duyệt)

Control UI hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được gắn vào các tin nhắn gửi đi để quy nguồn trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, được giới hạn theo hồ sơ trình duyệt hiện tại và không được đồng bộ sang thiết bị khác hoặc lưu bền vững phía máy chủ ngoài siêu dữ liệu tác giả bản ghi hội thoại thông thường trên các tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại danh tính này về trống.

Mẫu cục bộ trong trình duyệt tương tự áp dụng cho phần ghi đè ảnh đại diện assistant. Ảnh đại diện assistant đã tải lên chỉ phủ lên danh tính do gateway phân giải trong trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn có sẵn cho các client không phải UI ghi trực tiếp vào trường này (chẳng hạn như gateway viết bằng script hoặc dashboard tùy chỉnh).

## Điểm cuối cấu hình runtime

Control UI lấy cài đặt runtime từ `/control-ui-config.json`, được phân giải tương đối với đường dẫn cơ sở Control UI của gateway (ví dụ `/__openclaw__/control-ui-config.json` khi UI được phục vụ dưới `/__openclaw__/`). Điểm cuối đó được bảo vệ bằng cùng cơ chế xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy nó, và một lần lấy thành công yêu cầu token/mật khẩu gateway đã hợp lệ, định danh Tailscale Serve hoặc định danh proxy tin cậy.

## Hỗ trợ ngôn ngữ

Control UI có thể tự bản địa hóa trong lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè sau đó, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn locale nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Locale được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Các bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Locale đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng bộ locale không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã locale mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề Claw, Knot và Dash tích hợp sẵn, cộng thêm một ô nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, nhấp **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Trình nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô và tên chủ đề mặc định như `amethyst-haze`.

Giao diện cũng bao gồm cài đặt Cỡ chữ cục bộ trong trình duyệt. Cài đặt này được lưu cùng phần còn lại của tùy chọn Control UI, áp dụng cho văn bản trò chuyện, văn bản composer, thẻ công cụ và thanh bên trò chuyện, đồng thời giữ các ô nhập văn bản tối thiểu 16px để Safari di động không tự động phóng to khi focus.

Chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một ô cục bộ; xóa nó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Các lần làm mới lịch sử trò chuyện yêu cầu một cửa sổ gần đây có giới hạn với giới hạn văn bản theo từng tin nhắn, để các phiên lớn không buộc trình duyệt kết xuất toàn bộ tải bản ghi hội thoại trước khi trò chuyện có thể dùng được.
    - Trò chuyện thoại qua các phiên realtime của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần có ràng buộc qua WebSocket, còn các Plugin thoại realtime chỉ ở backend dùng kênh chuyển tiếp Gateway. Các phiên provider do client sở hữu bắt đầu bằng `talk.client.create`; các phiên chuyển tiếp Gateway bắt đầu bằng `talk.session.create`. Kênh chuyển tiếp giữ thông tin xác thực provider trên Gateway trong khi trình duyệt stream PCM từ micrô qua `talk.session.appendAudio`, chuyển tiếp các lệnh gọi công cụ provider `openclaw_agent_consult` qua `talk.client.toolCall` cho chính sách Gateway và mô hình OpenClaw lớn hơn đã cấu hình, đồng thời định tuyến điều hướng giọng nói của lượt chạy đang hoạt động qua `talk.client.steer` hoặc `talk.session.steer`.
    - Stream lệnh gọi công cụ + thẻ đầu ra công cụ trực tiếp trong Trò chuyện (sự kiện agent).
    - Tab Hoạt động với các bản tóm tắt hoạt động công cụ trực tiếp, cục bộ trong trình duyệt và ưu tiên biên tập ẩn, từ việc phân phối sự kiện `session.tool` / công cụ hiện có.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Kênh: trạng thái kênh tích hợp sẵn cộng với kênh Plugin đóng gói/bên ngoài, đăng nhập QR và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Các lần làm mới thăm dò kênh giữ ảnh chụp trước đó hiển thị trong khi các kiểm tra provider chậm hoàn tất, và ảnh chụp một phần được gắn nhãn khi một lượt thăm dò hoặc kiểm tra vượt quá ngân sách UI của nó.
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: mặc định liệt kê các phiên agent đã cấu hình, quay lui từ các khóa phiên agent chưa cấu hình đã cũ, và áp dụng các ghi đè mô hình/thinking/fast/verbose/trace/reasoning theo từng phiên (`sessions.list`, `sessions.patch`).
    - Dream: trạng thái Dreaming, công tắc bật/tắt và trình đọc Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Tác vụ Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Node: liệt kê + giới hạn khả năng (`node.list`).
    - Phê duyệt thực thi: chỉnh sửa danh sách cho phép gateway hoặc node + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - Xem/sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP có một trang cài đặt riêng cho các máy chủ đã cấu hình, trạng thái bật, tóm tắt OAuth/bộ lọc/song song, các lệnh vận hành phổ biến và trình chỉnh sửa cấu hình `mcp` theo phạm vi.
    - Áp dụng + khởi động lại với xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các lần ghi bao gồm một chốt bảo vệ base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Các lần lưu biểu mẫu loại bỏ những placeholder đã biên tập ẩn bị cũ không thể khôi phục từ cấu hình đã lưu, trong khi vẫn giữ các giá trị đã biên tập ẩn vẫn ánh xạ tới secret đã lưu.
    - Kết xuất schema + biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm `title` / `description` của trường, gợi ý UI đã khớp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các node object/wildcard/array/composition lồng nhau, cộng với schema Plugin + kênh khi có); trình chỉnh sửa Raw JSON chỉ có sẵn khi ảnh chụp có vòng khứ hồi thô an toàn.
    - Nếu một ảnh chụp không thể khứ hồi văn bản thô một cách an toàn, Control UI buộc dùng chế độ Biểu mẫu và vô hiệu hóa chế độ Thô cho ảnh chụp đó.
    - Trình chỉnh sửa Raw JSON "Đặt lại về bản đã lưu" giữ nguyên hình dạng do người dùng thô soạn (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại một ảnh chụp đã làm phẳng, để các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi ảnh chụp có thể khứ hồi an toàn.
    - Các giá trị đối tượng SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản biểu mẫu để ngăn hỏng dữ liệu vô tình từ đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Gỡ lỗi: ảnh chụp trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Control UI, thời gian kết xuất trò chuyện/cấu hình chậm và các mục về độ phản hồi của trình duyệt cho khung hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các loại mục PerformanceObserver đó.
    - Nhật ký: theo dõi trực tiếp nhật ký tệp gateway với lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) với báo cáo khởi động lại, rồi thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng tác vụ Cron">
    - Với các tác vụ tách biệt, phương thức gửi mặc định là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ dùng nội bộ.
    - Các trường kênh/đích xuất hiện khi thông báo được chọn.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành một URL webhook HTTP(S) hợp lệ.
    - Với các tác vụ phiên chính, các chế độ gửi webhook và không gửi đều khả dụng.
    - Các điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa ghi đè agent, tùy chọn cron chính xác/rải thời điểm, ghi đè mô hình/suy nghĩ của agent, và công tắc gửi theo nỗ lực tốt nhất.
    - Xác thực biểu mẫu hiển thị nội tuyến với lỗi ở cấp trường; các giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi một bearer token chuyên dụng; nếu bỏ qua, webhook sẽ được gửi mà không có header xác thực.
    - Phương án dự phòng đã ngừng dùng: chạy `openclaw doctor --fix` để di chuyển các tác vụ cũ đã lưu có `notify: true` từ `cron.webhook` sang webhook rõ ràng theo từng tác vụ hoặc gửi khi hoàn tất.

  </Accordion>
</AccordionGroup>

## Trang MCP

Trang MCP chuyên dụng là chế độ xem dành cho người vận hành đối với các máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Trang này không tự khởi động các transport MCP; hãy dùng nó để kiểm tra và chỉnh sửa cấu hình đã lưu, rồi dùng `openclaw mcp doctor --probe` khi bạn cần bằng chứng máy chủ trực tiếp.

Quy trình điển hình:

1. Mở **MCP** từ thanh bên.
2. Kiểm tra các thẻ tóm tắt để biết tổng số, số đã bật, OAuth, và số máy chủ đã lọc.
3. Xem lại từng hàng máy chủ để kiểm tra transport, trạng thái bật, xác thực, bộ lọc, thời gian chờ, và gợi ý lệnh.
4. Bật/tắt trạng thái bật khi một máy chủ vẫn nên được cấu hình nhưng không tham gia khám phá runtime.
5. Chỉnh sửa phần cấu hình `mcp` trong phạm vi cho định nghĩa máy chủ, header, đường dẫn TLS/mTLS, siêu dữ liệu OAuth, bộ lọc công cụ, và siêu dữ liệu chiếu Codex.
6. Dùng **Lưu** để ghi cấu hình, hoặc **Lưu & Công bố** khi Gateway đang chạy cần áp dụng cấu hình đã thay đổi.
7. Chạy `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, hoặc `openclaw mcp reload` từ terminal khi tiến trình đã chỉnh sửa cần chẩn đoán tĩnh, bằng chứng trực tiếp, hoặc loại bỏ runtime đã lưu cache.

Trang này che các giá trị giống URL có chứa thông tin xác thực trước khi hiển thị và đặt tên máy chủ trong dấu nháy ở các đoạn lệnh để các lệnh đã sao chép vẫn hoạt động với dấu cách hoặc ký tự đặc biệt của shell. Tài liệu tham chiếu đầy đủ về CLI và cấu hình nằm trong [MCP](/vi/cli/mcp).

## Thẻ Hoạt động

Thẻ Hoạt động là một trình quan sát tạm thời cục bộ trong trình duyệt cho hoạt động công cụ trực tiếp. Nó được suy ra từ cùng luồng sự kiện Gateway `session.tool` / công cụ đang cấp nguồn cho các thẻ công cụ trong Trò chuyện; nó không thêm một họ sự kiện Gateway, endpoint, kho hoạt động bền vững, nguồn cấp số liệu, hay luồng quan sát bên ngoài nào khác.

Các mục Hoạt động chỉ giữ lại phần tóm tắt đã làm sạch và bản xem trước đầu ra đã che, rút gọn. Giá trị đối số công cụ không được lưu trong trạng thái Hoạt động; UI hiển thị rằng đối số bị ẩn và chỉ ghi lại số lượng trường đối số. Danh sách trong bộ nhớ đi theo thẻ trình duyệt hiện tại, tồn tại khi điều hướng trong Control UI, và đặt lại khi tải lại trang, chuyển phiên, hoặc bấm **Xóa**.

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay bằng `{ runId, status: "started" }` và phản hồi được stream qua các sự kiện `chat`. Các client Control UI tin cậy cũng có thể nhận siêu dữ liệu thời gian ACK tùy chọn để chẩn đoán cục bộ.
    - Tải lên trong Chat chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ đường dẫn ảnh gốc; các tệp khác được lưu dưới dạng media được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` trong khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` bị giới hạn kích thước để an toàn cho UI. Khi các mục bản ghi quá lớn, Gateway có thể rút gọn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế thông điệp quá khổ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Khi một thông điệp assistant hiển thị đã bị rút gọn trong `chat.history`, trình đọc bên cạnh có thể lấy mục bản ghi đã chuẩn hóa hiển thị đầy đủ theo yêu cầu qua `chat.message.get` bằng `sessionKey`, `agentId` đang hoạt động khi cần, và `messageId` của bản ghi. Nếu Gateway vẫn không thể trả về thêm, trình đọc hiển thị trạng thái không khả dụng rõ ràng thay vì âm thầm lặp lại bản xem trước bị rút gọn.
    - Hình ảnh do assistant/tạo sinh được lưu bền vững dưới dạng tham chiếu media được quản lý và được phục vụ lại qua URL media Gateway đã xác thực, vì vậy việc tải lại không phụ thuộc vào việc payload ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - Khi render `chat.history`, Control UI loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng để hiển thị khỏi văn bản assistant thấy được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), các payload XML gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối gọi công cụ bị rút gọn), cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục assistant có toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong khi đang gửi và khi làm mới lịch sử cuối cùng, chế độ xem trò chuyện giữ các thông điệp người dùng/assistant lạc quan cục bộ ở trạng thái hiển thị nếu `chat.history` tạm thời trả về một snapshot cũ hơn; bản ghi chuẩn sẽ thay thế các thông điệp cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái gửi, còn `chat.history` được dựng lại từ bản ghi phiên bền vững. Sau các sự kiện tool-final, Control UI tải lại lịch sử và chỉ hợp nhất một đoạn đuôi lạc quan nhỏ; ranh giới bản ghi được tài liệu hóa trong [WebChat](/vi/web/webchat).
    - `chat.inject` nối thêm một ghi chú assistant vào bản ghi phiên và phát một sự kiện `chat` để cập nhật chỉ dành cho UI (không chạy agent, không gửi qua kênh).
    - Header trò chuyện hiển thị bộ lọc agent trước bộ chọn phiên, và bộ chọn phiên được giới hạn theo agent đã chọn. Chuyển agent chỉ hiển thị các phiên gắn với agent đó và quay về phiên chính của agent đó khi nó chưa có phiên dashboard nào đã lưu.
    - Trên chiều rộng desktop, các điều khiển trò chuyện nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi; cuộn lên, quay lại đầu trang, hoặc đến cuối sẽ khôi phục các điều khiển.
    - Các thông điệp chỉ có văn bản trùng lặp liên tiếp được render thành một bong bóng với huy hiệu số lượng. Những thông điệp có hình ảnh, tệp đính kèm, đầu ra công cụ, hoặc bản xem trước canvas sẽ không bị thu gọn.
    - Bộ chọn mô hình và thinking trong header trò chuyện vá phiên đang hoạt động ngay qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ cho một lượt.
    - Nếu bạn gửi thông điệp trong khi một thay đổi bộ chọn mô hình cho cùng phiên vẫn đang được lưu, trình soạn thảo sẽ đợi bản vá phiên đó trước khi gọi `chat.send` để lần gửi dùng mô hình đã chọn.
    - Gõ `/new` trong Control UI tạo và chuyển sang cùng phiên dashboard mới như Trò chuyện mới, trừ khi `session.dmScope: "main"` được cấu hình và cha hiện tại là phiên chính của agent; trong trường hợp đó, nó đặt lại phiên chính tại chỗ. Gõ `/reset` giữ thao tác đặt lại tại chỗ rõ ràng của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trò chuyện yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, allowlist đó điều khiển bộ chọn, bao gồm các mục `provider/*` giữ cho catalog theo phạm vi provider luôn động. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` rõ ràng cùng các provider có xác thực dùng được. Catalog đầy đủ vẫn khả dụng qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo sử dụng phiên Gateway mới có bao gồm token ngữ cảnh hiện tại, khu vực trình soạn thảo trò chuyện hiển thị một chỉ báo sử dụng ngữ cảnh gọn. Nó chuyển sang kiểu cảnh báo khi áp lực ngữ cảnh cao và, ở các mức Compaction được khuyến nghị, hiển thị một nút gọn chạy đường dẫn Compaction phiên thông thường. Snapshot token cũ bị ẩn cho đến khi Gateway báo cáo mức sử dụng mới lại.

  </Accordion>
  <Accordion title="Chế độ nói chuyện (realtime trình duyệt)">
    Chế độ nói chuyện dùng một provider giọng nói realtime đã đăng ký. Cấu hình OpenAI với `talk.realtime.provider: "openai"` cùng một hồ sơ xác thực khóa API `openai`, `talk.realtime.providers.openai.apiKey`, hoặc `OPENAI_API_KEY`; hồ sơ OAuth của OpenAI không cấu hình giọng nói Realtime. Cấu hình Google với `talk.realtime.provider: "google"` cùng `talk.realtime.providers.google.apiKey`. Trình duyệt không bao giờ nhận khóa API provider tiêu chuẩn. OpenAI nhận một client secret Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API dùng một lần, bị ràng buộc, cho phiên WebSocket trình duyệt, với chỉ dẫn và khai báo công cụ được Gateway khóa vào token. Các provider chỉ cung cấp cầu nối realtime backend sẽ chạy qua transport relay Gateway, nên thông tin xác thực và socket nhà cung cấp ở lại phía máy chủ trong khi âm thanh trình duyệt đi qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.client.create` không chấp nhận ghi đè chỉ dẫn do bên gọi cung cấp.

    Trình soạn thảo Chat có nút tùy chọn Talk bên cạnh nút bắt đầu/dừng Talk. Các tùy chọn áp dụng cho phiên Talk tiếp theo và có thể ghi đè provider, transport, mô hình, giọng nói, mức nỗ lực suy luận, ngưỡng VAD, thời lượng im lặng, và phần đệm tiền tố. Khi một tùy chọn để trống, Gateway dùng mặc định đã cấu hình nếu có hoặc mặc định của provider. Chọn relay Gateway buộc dùng đường dẫn relay backend; chọn WebRTC giữ phiên thuộc sở hữu client và thất bại thay vì âm thầm quay về relay nếu provider không thể tạo phiên trình duyệt.

    Trong trình soạn thảo Chat, điều khiển Talk là nút sóng bên cạnh nút đọc chính tả bằng microphone. Khi Talk bắt đầu, hàng trạng thái trình soạn thảo hiển thị `Connecting Talk...`, sau đó `Talk live` trong khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` trong khi một lệnh gọi công cụ realtime đang tham khảo mô hình lớn hơn đã cấu hình qua `talk.client.toolCall`.

    Smoke trực tiếp cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh cầu nối WebSocket backend OpenAI, trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt với token ràng buộc Google Live, và bộ chuyển đổi trình duyệt relay Gateway với media microphone giả. Lệnh chỉ in trạng thái provider và không ghi log bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Bấm **Dừng** (gọi `chat.abort`).
    - Trong khi một lần chạy đang hoạt động, các lượt theo dõi thông thường sẽ được xếp hàng. Bấm **Điều hướng** trên một thông điệp đã xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Gõ `/stop` (hoặc các cụm từ hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy bỏ ngoài luồng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy bỏ mọi lần chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy bỏ một phần">
    - Khi một lần chạy bị hủy bỏ, văn bản assistant một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu bền vững văn bản assistant một phần đã hủy bỏ vào lịch sử bản ghi khi có đầu ra đã đệm.
    - Các mục đã lưu bao gồm siêu dữ liệu hủy bỏ để các bên tiêu thụ bản ghi có thể phân biệt phần hủy bỏ một phần với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Control UI đi kèm một `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi thẻ hoặc cửa sổ trình duyệt không mở.

Nếu trang hiển thị **Giao thức không khớp** ngay sau một bản cập nhật OpenClaw, trước tiên hãy mở lại dashboard bằng `openclaw dashboard` và hard-refresh trang. Nếu vẫn lỗi, hãy xóa dữ liệu trang cho origin dashboard hoặc thử trong cửa sổ trình duyệt riêng tư; một thẻ cũ hoặc cache service-worker của trình duyệt có thể tiếp tục chạy bundle Control UI trước cập nhật với Gateway mới hơn.

| Bề mặt                                               | Chức năng                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt sẽ đề xuất "Cài đặt ứng dụng" khi có thể truy cập được.   |
| `ui/public/sw.js`                                     | Service worker xử lý các sự kiện `push` và lượt bấm vào thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID được tự động tạo, dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các điểm cuối đăng ký trình duyệt được lưu bền vững.                          |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều máy chủ, xoay vòng bí mật, hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `https://openclaw.ai`)

Control UI dùng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một điểm cuối đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử tới đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) cho push dựa trên chuyển tiếp) và phương thức `push.test` hiện có, vốn nhắm tới ghép đôi di động gốc.
</Note>

## Nhúng được lưu trữ

Tin nhắn của trợ lý có thể hiển thị nội dung web được lưu trữ nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox của iframe được điều khiển bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="scripts (default)">
    Cho phép nội dung nhúng tương tác trong khi vẫn giữ cô lập origin; đây là mặc định và thường đủ cho các trò chơi/widget trình duyệt tự chứa.
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
Chỉ dùng `trusted` khi tài liệu được nhúng thật sự cần hành vi cùng origin. Với hầu hết trò chơi do agent tạo và canvas tương tác, `scripts` là lựa chọn an toàn hơn.
</Warning>

URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ động muốn `[embed url="https://..."]` tải các trang bên thứ ba, đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chiều rộng tin nhắn chat

Các tin nhắn chat được nhóm dùng max-width mặc định dễ đọc. Các triển khai màn hình rộng có thể ghi đè mà không cần vá CSS đóng gói bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

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
  <Tab title="Integrated Tailscale Serve (preferred)">
    Giữ Gateway trên loopback và để Tailscale Serve ủy quyền nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` bạn đã cấu hình)

    Theo mặc định, các yêu cầu Serve của Control UI/WebSocket có thể xác thực qua header định danh Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh định danh bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, và chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với các header `x-forwarded-*` của Tailscale. Với phiên Control UI của người vận hành có định danh thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép đôi thiết bị; các trình duyệt không có thiết bị và kết nối vai trò node vẫn đi theo các kiểm tra thiết bị bình thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực shared secret rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn định danh Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử lại sai đồng thời từ cùng trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thuần túy chạy đua song song.

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

    Dán shared secret khớp vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu bạn mở dashboard qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** kết nối Control UI không có định danh thiết bị.

Các ngoại lệ được tài liệu hóa:

- tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI của người vận hành thành công thông qua `gateway.auth.mode: "trusted-proxy"`
- khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách sửa khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

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

    - Nó cho phép các phiên Control UI trên localhost tiếp tục mà không có định danh thiết bị trong ngữ cảnh HTTP không an toàn.
    - Nó không bỏ qua kiểm tra ghép đôi.
    - Nó không nới lỏng yêu cầu định danh thiết bị từ xa (không phải localhost).

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
    `dangerouslyDisableDeviceAuth` tắt kiểm tra định danh thiết bị Control UI và là một hạ cấp bảo mật nghiêm trọng. Hãy hoàn nguyên nhanh sau khi dùng trong tình huống khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - Xác thực trusted-proxy thành công có thể cho phép các phiên Control UI của **người vận hành** vào mà không có định danh thiết bị.
    - Điều này **không** áp dụng cho các phiên Control UI vai trò node.
    - Reverse proxy loopback cùng máy chủ vẫn không thỏa mãn xác thực trusted-proxy; xem [Xác thực trusted proxy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để được hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI được phát hành với chính sách `img-src` chặt chẽ: chỉ cho phép tài sản **cùng origin**, URL `data:`, và URL `blob:` được tạo cục bộ. URL hình ảnh `http(s)` từ xa và URL hình ảnh tương đối theo giao thức bị trình duyệt từ chối và không phát sinh yêu cầu mạng.

Điều này có nghĩa trong thực tế:

- Avatar và hình ảnh được phục vụ dưới đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn hiển thị, bao gồm các route avatar đã xác thực mà UI fetch và chuyển thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- URL avatar từ xa do metadata kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/huy hiệu tích hợp, nên một kênh bị xâm phạm hoặc độc hại không thể ép trình duyệt của người vận hành fetch hình ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không thể cấu hình.

## Xác thực route avatar

Khi xác thực gateway được cấu hình, điểm cuối avatar của Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về metadata avatar theo cùng quy tắc.
- Các yêu cầu chưa xác thực tới một trong hai route đều bị từ chối (khớp với route assistant-media cùng cấp). Điều này ngăn route avatar làm rò rỉ định danh agent trên các máy chủ vốn được bảo vệ.
- Chính Control UI chuyển tiếp token gateway dưới dạng header bearer khi fetch avatar, và dùng URL blob đã xác thực để hình ảnh vẫn hiển thị trong dashboard.

Nếu bạn tắt xác thực gateway (không khuyến nghị trên máy chủ dùng chung), route avatar cũng trở thành không xác thực, nhất quán với phần còn lại của gateway.

## Xác thực route media của trợ lý

Khi xác thực gateway được cấu hình, bản xem trước media cục bộ của trợ lý dùng route hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực người vận hành Control UI bình thường. Trình duyệt gửi token gateway dưới dạng header bearer khi kiểm tra tính khả dụng.
- Phản hồi metadata thành công bao gồm `mediaTicket` có thời hạn ngắn, giới hạn trong đúng đường dẫn nguồn đó.
- URL hình ảnh, âm thanh, video, và tài liệu do trình duyệt render dùng `mediaTicket=<ticket>` thay cho token hoặc mật khẩu gateway đang hoạt động. Ticket hết hạn nhanh và không thể cấp quyền cho nguồn khác.

Điều này giữ cho quá trình render media bình thường tương thích với các phần tử media gốc của trình duyệt mà không đưa thông tin xác thực gateway có thể tái sử dụng vào URL media nhìn thấy được.

## Xây dựng UI

Gateway phục vụ tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

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

Sau đó trỏ UI tới URL Gateway WS của bạn (ví dụ `ws://127.0.0.1:18789`).

## Trang Control UI trống

Nếu trình duyệt tải dashboard trống và DevTools không hiển thị lỗi hữu ích, một tiện ích mở rộng hoặc content script chạy sớm có thể đã ngăn ứng dụng module JavaScript được đánh giá. Trang tĩnh bao gồm một bảng khôi phục HTML thuần xuất hiện khi `<openclaw-app>` chưa được đăng ký sau khi khởi động.

Dùng hành động **Thử lại** của bảng sau khi thay đổi môi trường trình duyệt, hoặc tải lại thủ công sau các kiểm tra này:

- Tắt các tiện ích mở rộng chèn vào tất cả trang, đặc biệt là tiện ích có content script `<all_urls>`.
- Thử cửa sổ riêng tư, hồ sơ trình duyệt sạch, hoặc trình duyệt khác.
- Giữ Gateway đang chạy và xác minh cùng URL dashboard sau khi thay đổi trình duyệt.

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Control UI là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với origin HTTP. Điều này hữu ích khi bạn muốn máy chủ dev Vite cục bộ nhưng Gateway chạy ở nơi khác.

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
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn chính xác.
    - `token` nên được truyền qua phân mảnh URL (`#token=...`) bất cứ khi nào có thể. Phân mảnh không được gửi đến máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Các tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ như phương án dự phòng, và sẽ bị loại bỏ ngay sau khi bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không quay về thông tin xác thực từ cấu hình hoặc môi trường. Hãy cung cấp `token` (hoặc `password`) một cách rõ ràng. Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không được nhúng) để ngăn clickjacking.
    - Các bản triển khai Control UI công khai không phải loopback phải đặt `gateway.controlUi.allowedOrigins` một cách rõ ràng (origin đầy đủ). Các lượt tải LAN/Tailnet riêng tư cùng origin từ loopback, RFC1918/link-local, `.local`, `.ts.net`, hoặc máy chủ Tailscale CGNAT được chấp nhận mà không cần bật dự phòng theo Host-header.
    - Khi khởi động, Gateway có thể gieo các origin cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng origin trình duyệt từ xa vẫn cần các mục rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép bất kỳ origin trình duyệt nào, không phải "khớp với bất kỳ máy chủ nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ dự phòng origin theo Host-header, nhưng đây là chế độ bảo mật nguy hiểm.

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

- [Bảng điều khiển](/vi/web/dashboard) — bảng điều khiển Gateway
- [Kiểm tra tình trạng](/vi/gateway/health) — giám sát tình trạng Gateway
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện trò chuyện dựa trên trình duyệt
