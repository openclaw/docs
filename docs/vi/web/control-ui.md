---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, hoạt động, nút, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-07-04T20:36:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

Giao diện điều khiển là một ứng dụng một trang nhỏ dùng **Vite + Lit** do Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ `/openclaw`)

Nó giao tiếp **trực tiếp với Gateway WebSocket** trên cùng cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/))

Nếu trang không tải được, hãy khởi động Gateway trước: `openclaw gateway`.

<Note>
Trên các liên kết LAN gốc của Windows, Windows Firewall hoặc Group Policy do tổ chức quản lý vẫn có thể chặn URL LAN được quảng bá ngay cả khi `127.0.0.1` hoạt động trên máy chủ Gateway. Chạy `openclaw gateway status --deep` trên máy Windows; lệnh này báo cáo các cổng có khả năng bị chặn, sai lệch hồ sơ và quy tắc tường lửa cục bộ mà chính sách có thể bỏ qua.
</Note>

Xác thực được cung cấp trong quá trình bắt tay WebSocket qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- tiêu đề danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- tiêu đề danh tính proxy tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của bảng điều khiển giữ một token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu bền vững. Quy trình thiết lập ban đầu thường tạo một gateway token cho xác thực bí mật dùng chung trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối đầu tiên)

Khi bạn kết nối tới Giao diện điều khiển từ một trình duyệt hoặc thiết bị mới, Gateway thường yêu cầu **phê duyệt ghép nối một lần**. Đây là biện pháp bảo mật để ngăn truy cập trái phép.

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

Nếu trình duyệt thử lại việc ghép nối với chi tiết xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo. Chạy lại `openclaw devices list` trước khi phê duyệt.

Nếu trình duyệt đã được ghép nối và bạn đổi từ quyền đọc sang quyền ghi/quản trị, việc này được xem là nâng cấp phê duyệt, không phải kết nối lại âm thầm. OpenClaw giữ phê duyệt cũ hoạt động, chặn lần kết nối lại với quyền rộng hơn và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và không cần phê duyệt lại trừ khi bạn thu hồi bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI thiết bị](/vi/cli/devices) để biết cách xoay vòng và thu hồi token.

Các tác nhân Paperclip kết nối qua adapter `openclaw_gateway` sử dụng cùng luồng phê duyệt lần chạy đầu tiên. Sau lần thử kết nối ban đầu, chạy `openclaw devices approve --latest` để xem trước yêu cầu đang chờ, rồi chạy lại lệnh `openclaw devices approve <requestId>` được in ra để phê duyệt. Truyền rõ ràng các giá trị `--url` và `--token` cho gateway từ xa. Để giữ phê duyệt ổn định qua các lần khởi động lại, hãy cấu hình `adapterConfig.devicePrivateKeyPem` bền vững trong Paperclip thay vì để nó tạo danh tính thiết bị tạm thời mới ở mỗi lần chạy.

<Note>
- Kết nối trình duyệt local loopback trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua vòng ghép nối cho các phiên vận hành Giao diện điều khiển khi `gateway.auth.allowTailscale: true`, danh tính Tailscale được xác minh và trình duyệt xuất trình danh tính thiết bị của nó.
- Các liên kết Tailnet trực tiếp, kết nối trình duyệt LAN và hồ sơ trình duyệt không có danh tính thiết bị vẫn cần phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy việc đổi trình duyệt hoặc xóa dữ liệu trình duyệt sẽ yêu cầu ghép nối lại.

</Note>

## Ghép nối thiết bị di động

Một quản trị viên đã được ghép nối có thể tạo QR kết nối iOS/Android mà không cần
mở terminal:

<Steps>
  <Step title="Mở ghép nối di động">
    Chọn **Nút**, rồi bấm **Ghép nối thiết bị di động** trong thẻ **Thiết bị**.
  </Step>
  <Step title="Kết nối điện thoại">
    Trong ứng dụng di động OpenClaw, mở **Cài đặt** → **Gateway** và quét mã QR.
    Bạn cũng có thể sao chép và dán mã thiết lập.
  </Step>
  <Step title="Xác nhận kết nối">
    Ứng dụng iOS/Android chính thức tự động kết nối. Nếu **Thiết bị** hiển thị
    một yêu cầu đang chờ, hãy xem lại vai trò và phạm vi của yêu cầu trước khi phê duyệt.
  </Step>
</Steps>

Việc tạo mã thiết lập yêu cầu `operator.admin`; nút này bị tắt đối với
các phiên không có quyền đó. Mã thiết lập chứa thông tin xác thực khởi động ngắn hạn,
vì vậy hãy xử lý QR và mã đã sao chép như mật khẩu trong thời gian chúng còn hiệu lực. Đối với
ghép nối từ xa, Gateway phải phân giải thành `wss://` (ví dụ, thông qua Tailscale
Serve/Funnel); `ws://` thuần túy bị giới hạn cho loopback và địa chỉ LAN riêng.
Xem [Ghép nối](/vi/channels/pairing#pair-from-the-control-ui-recommended) để biết
đầy đủ chi tiết về bảo mật và phương án dự phòng.

## Danh tính cá nhân (cục bộ trong trình duyệt)

Giao diện điều khiển hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được gắn vào tin nhắn gửi đi để ghi nhận tác giả trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, được giới hạn theo hồ sơ trình duyệt hiện tại và không được đồng bộ sang thiết bị khác hay lưu bền vững phía máy chủ ngoài metadata tác giả bản ghi thông thường trên những tin nhắn bạn thực sự gửi. Xóa dữ liệu trang hoặc đổi trình duyệt sẽ đặt lại danh tính này về trống.

Mẫu cục bộ trong trình duyệt tương tự áp dụng cho phần ghi đè ảnh đại diện của trợ lý. Ảnh đại diện trợ lý đã tải lên chỉ phủ lên danh tính do gateway phân giải trên trình duyệt cục bộ và không bao giờ đi vòng qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn khả dụng cho các client không phải UI ghi trực tiếp trường này (chẳng hạn gateway theo script hoặc bảng điều khiển tùy chỉnh).

## Endpoint cấu hình runtime

Giao diện điều khiển lấy cài đặt runtime từ `/control-ui-config.json`, được phân giải tương đối với đường dẫn cơ sở Giao diện điều khiển của gateway (ví dụ `/__openclaw__/control-ui-config.json` khi UI được phục vụ dưới `/__openclaw__/`). Endpoint đó được bảo vệ bởi cùng xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể lấy endpoint này, và một lần lấy thành công yêu cầu gateway token/mật khẩu đã hợp lệ, danh tính Tailscale Serve, hoặc danh tính proxy tin cậy.

## Hỗ trợ ngôn ngữ

Giao diện điều khiển có thể tự bản địa hóa trong lần tải đầu tiên dựa trên ngôn ngữ trình duyệt của bạn. Để ghi đè về sau, mở **Tổng quan -> Truy cập Gateway -> Ngôn ngữ**. Bộ chọn ngôn ngữ nằm trong thẻ Truy cập Gateway, không nằm dưới Giao diện.

- Ngôn ngữ được hỗ trợ: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- Các bản dịch không phải tiếng Anh được tải lười trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và dùng lại trong các lần truy cập sau.
- Khóa bản dịch bị thiếu sẽ quay về tiếng Anh.

Bản dịch tài liệu được tạo cho cùng tập ngôn ngữ không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp của trang tài liệu bị giới hạn ở các mã ngôn ngữ mà Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong repo xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Giao diện giữ các chủ đề tích hợp Claw, Knot và Dash, cộng thêm một vị trí nhập tweakcn cục bộ trong trình duyệt. Để nhập chủ đề, mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, bấm **Chia sẻ**, rồi dán liên kết chủ đề đã sao chép vào Giao diện. Bộ nhập cũng chấp nhận URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn tương đối `/themes/<id>`, ID chủ đề thô và tên chủ đề mặc định như `amethyst-haze`.

Giao diện cũng bao gồm cài đặt Kích thước văn bản cục bộ trong trình duyệt. Cài đặt này được lưu cùng phần còn lại của tùy chọn Giao diện điều khiển, áp dụng cho văn bản chat, văn bản trình soạn, thẻ công cụ và thanh bên chat, đồng thời giữ ô nhập văn bản tối thiểu 16px để Safari di động không tự động phóng to khi focus.

Các chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại. Chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Thay thế chủ đề đã nhập sẽ cập nhật một vị trí cục bộ; xóa vị trí đó sẽ chuyển chủ đề đang hoạt động về Claw nếu chủ đề đã nhập đang được chọn.

## Nó có thể làm gì (hiện nay)

<AccordionGroup>
  <Accordion title="Chat và Talk">
    - Chat với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Các lần làm mới lịch sử chat yêu cầu một cửa sổ gần đây có giới hạn với giới hạn văn bản theo từng tin nhắn để các phiên lớn không buộc trình duyệt render toàn bộ payload bản ghi trước khi chat có thể dùng được.
    - Talk qua các phiên thời gian thực của trình duyệt. OpenAI dùng WebRTC trực tiếp, Google Live dùng token trình duyệt một lần có ràng buộc qua WebSocket, và các Plugin thoại thời gian thực chỉ chạy backend dùng phương tiện chuyển tiếp Gateway. Các phiên nhà cung cấp do client sở hữu bắt đầu bằng `talk.client.create`; các phiên chuyển tiếp Gateway bắt đầu bằng `talk.session.create`. Bộ chuyển tiếp giữ thông tin xác thực nhà cung cấp trên Gateway trong khi trình duyệt stream PCM micro qua `talk.session.appendAudio`, chuyển tiếp lời gọi công cụ nhà cung cấp `openclaw_agent_consult` qua `talk.client.toolCall` cho chính sách Gateway và mô hình OpenClaw lớn hơn đã cấu hình, đồng thời định tuyến điều hướng thoại của lượt chạy đang hoạt động qua `talk.client.steer` hoặc `talk.session.steer`.
    - Stream lời gọi công cụ + thẻ kết quả công cụ trực tiếp trong Chat (sự kiện tác nhân).
    - Tab Hoạt động với các tóm tắt cục bộ trong trình duyệt, ưu tiên biên tập ẩn dữ liệu, về hoạt động công cụ trực tiếp từ cơ chế phân phối `session.tool` / sự kiện công cụ hiện có.

  </Accordion>
  <Accordion title="Kênh, phiên bản, phiên, giấc mơ">
    - Kênh: trạng thái kênh Plugin tích hợp sẵn cộng với Plugin đi kèm/bên ngoài, đăng nhập QR và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Các lần làm mới thăm dò kênh giữ ảnh chụp trước đó hiển thị trong khi các kiểm tra nhà cung cấp chậm hoàn tất, và ảnh chụp một phần được gắn nhãn khi một lần thăm dò hoặc kiểm tra vượt quá ngân sách UI.
    - Phiên bản: danh sách hiện diện + làm mới (`system-presence`).
    - Phiên: mặc định liệt kê các phiên tác nhân đã cấu hình, ghim các phiên thường dùng, đổi tên, lưu trữ hoặc khôi phục các phiên không hoạt động, dự phòng từ khóa phiên tác nhân chưa cấu hình đã cũ, và áp dụng ghi đè mô hình/thinking/fast/verbose/trace/reasoning theo từng phiên (`sessions.list`, `sessions.patch`). Phiên đã ghim được sắp xếp trên các phiên gần đây chưa ghim; phiên đã lưu trữ nằm trong chế độ xem lưu trữ của trang Phiên và giữ bản ghi của chúng.
    - Giấc mơ: trạng thái Dreaming, bật/tắt và trình đọc Nhật ký giấc mơ (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, nút, phê duyệt exec">
    - Tác vụ Cron: liệt kê/thêm/sửa/chạy/bật/tắt + lịch sử chạy (`cron.*`).
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Nút: liệt kê + khả năng (`node.list`), tạo mã thiết lập di động và phê duyệt ghép nối thiết bị (`device.pair.*`).
    - Phê duyệt exec: chỉnh sửa danh sách cho phép của gateway hoặc nút + chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/chỉnh sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - MCP có một trang cài đặt chuyên dụng cho các máy chủ đã cấu hình, trạng thái bật, tóm tắt OAuth/bộ lọc/song song, các lệnh vận hành phổ biến và trình chỉnh sửa cấu hình `mcp` theo phạm vi.
    - Áp dụng + khởi động lại kèm xác thực (`config.apply`) và đánh thức phiên hoạt động gần nhất.
    - Các lần ghi bao gồm một cơ chế bảo vệ base-hash để tránh ghi đè các chỉnh sửa đồng thời.
    - Các lần ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các ref trong payload cấu hình đã gửi; các ref đang hoạt động đã gửi nhưng không phân giải được sẽ bị từ chối trước khi ghi.
    - Các lần lưu biểu mẫu loại bỏ những placeholder đã biên tập cũ không thể khôi phục từ cấu hình đã lưu, đồng thời giữ lại các giá trị đã biên tập vẫn ánh xạ tới secret đã lưu.
    - Kết xuất schema + biểu mẫu (`config.schema` / `config.schema.lookup`, bao gồm trường `title` / `description`, gợi ý UI khớp, tóm tắt con trực tiếp, siêu dữ liệu tài liệu trên các nút object/wildcard/array/composition lồng nhau, cùng với schema Plugin + kênh khi có); trình chỉnh sửa JSON thô chỉ khả dụng khi snapshot có thể đi vòng khứ hồi thô an toàn.
    - Nếu một snapshot không thể đi vòng khứ hồi văn bản thô an toàn, Control UI buộc dùng chế độ Biểu mẫu và tắt chế độ Thô cho snapshot đó.
    - Trong trình chỉnh sửa JSON thô, "Đặt lại về bản đã lưu" giữ nguyên hình dạng do người dùng viết thô (định dạng, bình luận, bố cục `$include`) thay vì kết xuất lại một snapshot đã làm phẳng, để các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại khi snapshot có thể đi vòng khứ hồi an toàn.
    - Các giá trị object SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản của biểu mẫu để ngăn hỏng dữ liệu ngoài ý muốn khi chuyển object thành chuỗi.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: snapshot trạng thái/sức khỏe/mô hình + nhật ký sự kiện + lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/RPC của Control UI, thời gian kết xuất trò chuyện/cấu hình chậm, và các mục về độ phản hồi của trình duyệt cho khung hình hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các loại mục PerformanceObserver đó.
    - Nhật ký: theo dõi trực tiếp nhật ký tệp của gateway với bộ lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật package/git + khởi động lại (`update.run`) kèm báo cáo khởi động lại, rồi thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú bảng Cron jobs">
    - Với các tác vụ cô lập, cách gửi mặc định là thông báo tóm tắt. Bạn có thể chuyển sang không gửi nếu muốn các lần chạy chỉ dùng nội bộ.
    - Các trường kênh/đích xuất hiện khi chọn thông báo.
    - Chế độ Webhook dùng `delivery.mode = "webhook"` với `delivery.to` được đặt thành một URL webhook HTTP(S) hợp lệ.
    - Với các tác vụ phiên chính, các chế độ gửi webhook và không gửi đều khả dụng.
    - Các điều khiển chỉnh sửa nâng cao bao gồm xóa-sau-khi-chạy, xóa ghi đè agent, tùy chọn cron chính xác/lệch pha, ghi đè mô hình/thinking của agent, và công tắc gửi best-effort.
    - Xác thực biểu mẫu hiển thị tại chỗ với lỗi theo từng trường; giá trị không hợp lệ sẽ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi một bearer token chuyên dụng; nếu bỏ qua, webhook sẽ được gửi không kèm header xác thực.
    - Phương án dự phòng đã ngừng dùng: chạy `openclaw doctor --fix` để di chuyển các tác vụ cũ đã lưu có `notify: true` từ `cron.webhook` sang webhook theo từng tác vụ hoặc gửi khi hoàn tất một cách tường minh.

  </Accordion>
</AccordionGroup>

## Trang MCP

Trang MCP chuyên dụng là chế độ xem dành cho người vận hành đối với các máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Trang này không tự khởi động transport MCP; hãy dùng nó để kiểm tra và chỉnh sửa cấu hình đã lưu, rồi dùng `openclaw mcp doctor --probe` khi bạn cần bằng chứng máy chủ trực tiếp.

Quy trình thông thường:

1. Mở **MCP** từ thanh bên.
2. Kiểm tra các thẻ tóm tắt để biết tổng số, số đã bật, OAuth và số máy chủ đã lọc.
3. Xem lại từng hàng máy chủ về transport, trạng thái bật, xác thực, bộ lọc, thời gian chờ và gợi ý lệnh.
4. Bật/tắt trạng thái bật khi một máy chủ cần tiếp tục được cấu hình nhưng không tham gia khám phá runtime.
5. Chỉnh sửa phần cấu hình `mcp` theo phạm vi cho định nghĩa máy chủ, header, đường dẫn TLS/mTLS, siêu dữ liệu OAuth, bộ lọc công cụ và siêu dữ liệu chiếu Codex.
6. Dùng **Lưu** để ghi cấu hình, hoặc **Lưu & Xuất bản** khi Gateway đang chạy cần áp dụng cấu hình đã thay đổi.
7. Chạy `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, hoặc `openclaw mcp reload` từ terminal khi tiến trình đã chỉnh sửa cần chẩn đoán tĩnh, bằng chứng trực tiếp hoặc loại bỏ runtime đã lưu cache.

Trang này biên tập các giá trị dạng URL có chứa thông tin đăng nhập trước khi kết xuất và đặt tên máy chủ trong dấu nháy ở các đoạn lệnh để lệnh đã sao chép vẫn hoạt động với khoảng trắng hoặc siêu ký tự shell. Tham chiếu CLI và cấu hình đầy đủ nằm trong [MCP](/vi/cli/mcp).

## Thẻ Hoạt động

Thẻ Hoạt động là trình quan sát tạm thời cục bộ trong trình duyệt cho hoạt động công cụ trực tiếp. Nó được suy ra từ cùng luồng sự kiện Gateway `session.tool` / công cụ đang cấp nguồn cho các thẻ công cụ trong Trò chuyện; nó không thêm họ sự kiện Gateway, endpoint, kho hoạt động bền vững, nguồn cấp số liệu hay luồng quan sát bên ngoài nào khác.

Các mục Hoạt động chỉ giữ tóm tắt đã làm sạch và bản xem trước đầu ra đã biên tập, rút gọn. Giá trị đối số công cụ không được lưu trong trạng thái Hoạt động; UI hiển thị rằng đối số bị ẩn và chỉ ghi lại số lượng trường đối số. Danh sách trong bộ nhớ đi theo thẻ trình duyệt hiện tại, tồn tại qua điều hướng trong Control UI, và đặt lại khi tải lại trang, chuyển phiên hoặc **Xóa**.

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Ngữ nghĩa gửi và lịch sử">
    - `chat.send` là **không chặn**: nó xác nhận ngay với `{ runId, status: "started" }` và phản hồi được truyền qua các sự kiện `chat`. Các client Control UI đáng tin cậy cũng có thể nhận siêu dữ liệu thời gian ACK tùy chọn cho chẩn đoán cục bộ.
    - Tải lên trong trò chuyện chấp nhận hình ảnh cùng với các tệp không phải video. Hình ảnh giữ đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng media được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` trả về `{ status: "in_flight" }` khi đang chạy, và `{ status: "ok" }` sau khi hoàn tất.
    - Phản hồi `chat.history` được giới hạn kích thước để đảm bảo an toàn cho UI. Khi các mục bản ghi hội thoại quá lớn, Gateway có thể rút gọn các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng, và thay thế thông điệp quá cỡ bằng một placeholder (`[chat.history omitted: message too large]`).
    - Khi một thông điệp trợ lý hiển thị đã bị rút gọn trong `chat.history`, trình đọc bên có thể lấy mục bản ghi hội thoại đầy đủ đã chuẩn hóa hiển thị theo yêu cầu thông qua `chat.message.get` bằng `sessionKey`, `agentId` đang hoạt động khi cần, và `messageId` trong bản ghi hội thoại. Nếu Gateway vẫn không thể trả về thêm nội dung, trình đọc hiển thị trạng thái không khả dụng rõ ràng thay vì âm thầm lặp lại bản xem trước đã rút gọn.
    - Hình ảnh do trợ lý/tạo sinh được lưu bền vững dưới dạng tham chiếu media được quản lý và được phục vụ lại qua URL media Gateway đã xác thực, vì vậy việc tải lại không phụ thuộc vào payload hình ảnh base64 thô còn nằm trong phản hồi lịch sử trò chuyện.
    - Khi kết xuất `chat.history`, Control UI loại bỏ các thẻ chỉ thị nội tuyến chỉ dùng cho hiển thị khỏi văn bản trợ lý nhìn thấy được (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), payload XML lệnh gọi công cụ dạng văn bản thuần (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, và các khối lệnh gọi công cụ bị rút gọn), cùng các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ, và bỏ qua các mục trợ lý mà toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong khi đang gửi và ở lần làm mới lịch sử cuối cùng, chế độ xem trò chuyện vẫn giữ các thông điệp người dùng/trợ lý lạc quan cục bộ hiển thị nếu `chat.history` tạm thời trả về một snapshot cũ hơn; bản ghi hội thoại chính thức sẽ thay thế các thông điệp cục bộ đó khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái gửi, còn `chat.history` được xây dựng lại từ bản ghi hội thoại phiên bền vững. Sau các sự kiện công cụ cuối cùng, Control UI tải lại lịch sử và chỉ hợp nhất một phần đuôi lạc quan nhỏ; ranh giới bản ghi hội thoại được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` nối thêm một ghi chú trợ lý vào bản ghi hội thoại phiên và phát một sự kiện `chat` cho các cập nhật chỉ dành cho UI (không chạy agent, không gửi qua kênh).
    - Thanh bên liệt kê các phiên gần đây với hành động Phiên mới, liên kết Tất cả phiên, và nút tìm kiếm phiên mở bộ chọn phiên đầy đủ (theo phạm vi agent đã chọn, có tìm kiếm và phân trang). Chuyển agent chỉ hiển thị các phiên gắn với agent đó và quay về phiên chính của agent đó khi agent chưa có phiên dashboard nào đã lưu.
    - Mỗi hàng trong bộ chọn phiên có thể đổi tên, ghim hoặc lưu trữ phiên. Một lần chạy đang hoạt động và phiên chính của agent không thể được lưu trữ. Lưu trữ phiên đang được chọn sẽ chuyển Trò chuyện trở lại phiên chính của agent đó.
    - Ở độ rộng desktop, các điều khiển trò chuyện nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi hội thoại; cuộn lên, quay lại đầu trang hoặc tới cuối trang sẽ khôi phục các điều khiển.
    - Các thông điệp liên tiếp trùng lặp chỉ có văn bản được kết xuất thành một bong bóng với huy hiệu số lượng. Các thông điệp có hình ảnh, tệp đính kèm, đầu ra công cụ hoặc bản xem trước canvas sẽ không bị thu gọn.
    - Bộ chọn mô hình và thinking ở header trò chuyện vá phiên đang hoạt động ngay lập tức qua `sessions.patch`; chúng là các ghi đè phiên bền vững, không phải tùy chọn gửi chỉ dùng một lượt.
    - Nếu bạn gửi thông điệp trong khi thay đổi bộ chọn mô hình cho cùng phiên vẫn đang lưu, composer sẽ đợi bản vá phiên đó trước khi gọi `chat.send` để lần gửi dùng mô hình đã chọn.
    - Gõ `/new` trong Control UI tạo và chuyển sang cùng phiên dashboard mới như Trò chuyện mới, trừ khi `session.dmScope: "main"` được cấu hình và parent hiện tại là phiên chính của agent; trong trường hợp đó, nó đặt lại phiên chính tại chỗ. Gõ `/reset` giữ cơ chế đặt lại tại chỗ tường minh của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trò chuyện yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu có `agents.defaults.models`, danh sách cho phép đó điều khiển bộ chọn, bao gồm các mục `provider/*` giữ cho catalog theo phạm vi provider vẫn động. Nếu không, bộ chọn hiển thị các mục `models.providers.*.models` tường minh cùng với các provider có xác thực dùng được. Catalog đầy đủ vẫn khả dụng qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi các báo cáo sử dụng phiên Gateway mới có bao gồm token ngữ cảnh hiện tại, thanh công cụ composer trò chuyện hiển thị một vòng nhỏ về mức sử dụng ngữ cảnh với phần trăm đã dùng; chi tiết token đầy đủ nằm trong tooltip. Vòng này chuyển sang kiểu cảnh báo khi áp lực ngữ cảnh cao và, ở các mức Compaction được khuyến nghị, hiển thị một nút gọn chạy đường dẫn Compaction phiên bình thường. Snapshot token cũ bị ẩn cho đến khi Gateway báo cáo lại mức sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ nói (realtime trong trình duyệt)">
    Chế độ nói dùng một provider giọng nói realtime đã đăng ký. Cấu hình OpenAI với `talk.realtime.provider: "openai"` cùng với hồ sơ xác thực khóa API `openai`, `talk.realtime.providers.openai.apiKey`, hoặc `OPENAI_API_KEY`; hồ sơ OAuth của OpenAI không cấu hình giọng nói Realtime. Cấu hình Google với `talk.realtime.provider: "google"` cùng với `talk.realtime.providers.google.apiKey`. Trình duyệt không bao giờ nhận khóa API provider chuẩn. OpenAI nhận một secret client Realtime tạm thời cho WebRTC. Google Live nhận một token xác thực Live API dùng một lần có ràng buộc cho phiên WebSocket của trình duyệt, với hướng dẫn và khai báo công cụ được Gateway khóa vào token. Các provider chỉ cung cấp cầu nối realtime backend sẽ chạy qua transport chuyển tiếp Gateway, để thông tin đăng nhập và socket của nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh trình duyệt di chuyển qua các RPC Gateway đã xác thực. Prompt phiên Realtime được Gateway lắp ráp; `talk.client.create` không chấp nhận ghi đè chỉ dẫn do caller cung cấp.

    Trình soạn Chat có nút tùy chọn Talk bên cạnh nút bắt đầu/dừng Talk. Các tùy chọn áp dụng cho phiên Talk tiếp theo và có thể ghi đè nhà cung cấp, phương thức truyền tải, mô hình, giọng nói, mức nỗ lực suy luận, ngưỡng VAD, thời lượng im lặng và phần đệm tiền tố. Khi một tùy chọn để trống, Gateway dùng các mặc định đã cấu hình nếu có, hoặc mặc định của nhà cung cấp. Chọn Gateway relay sẽ buộc dùng đường dẫn relay ở backend; chọn WebRTC giữ phiên do client sở hữu và sẽ thất bại thay vì âm thầm chuyển về relay nếu nhà cung cấp không thể tạo phiên trình duyệt.

    Trong trình soạn Chat, điều khiển Talk là nút hình sóng bên cạnh nút đọc chính tả bằng micro. Khi Talk bắt đầu, hàng trạng thái của trình soạn hiển thị `Connecting Talk...`, sau đó là `Talk live` khi âm thanh đã kết nối, hoặc `Asking OpenClaw...` khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình thông qua `talk.client.toolCall`.

    Smoke live cho maintainer: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh cầu nối WebSocket backend OpenAI, trao đổi SDP WebRTC trình duyệt OpenAI, thiết lập WebSocket trình duyệt Google Live với token bị ràng buộc, và bộ chuyển đổi trình duyệt Gateway relay với phương tiện micro giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi log bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Nhấp **Dừng** (gọi `chat.abort`).
    - Khi một lượt chạy đang hoạt động, các lượt theo dõi bình thường sẽ được đưa vào hàng đợi. Nhấp **Điều hướng** trên một tin nhắn đang xếp hàng để chèn lượt theo dõi đó vào lượt đang chạy.
    - Nhập `/stop` (hoặc các cụm từ hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy bỏ ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy bỏ tất cả lượt chạy đang hoạt động cho phiên đó.

  </Accordion>
  <Accordion title="Giữ lại phần hủy bỏ">
    - Khi một lượt chạy bị hủy bỏ, văn bản trợ lý một phần vẫn có thể được hiển thị trong UI.
    - Gateway lưu văn bản trợ lý một phần đã bị hủy bỏ vào lịch sử bản ghi khi có đầu ra đã được đệm.
    - Các mục đã lưu bao gồm siêu dữ liệu hủy bỏ để bên tiêu thụ bản ghi có thể phân biệt phần hủy bỏ với đầu ra hoàn tất bình thường.

  </Accordion>
</AccordionGroup>

## Cài đặt PWA và web push

Control UI đi kèm `manifest.webmanifest` và một service worker, nên các trình duyệt hiện đại có thể cài đặt nó như một PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi tab hoặc cửa sổ trình duyệt không mở.

Nếu trang hiển thị **Protocol mismatch** ngay sau khi cập nhật OpenClaw, trước tiên hãy mở lại dashboard bằng `openclaw dashboard` và hard-refresh trang. Nếu vẫn lỗi, hãy xóa dữ liệu site cho origin của dashboard hoặc thử trong cửa sổ trình duyệt riêng tư; một tab cũ hoặc cache service-worker của trình duyệt có thể tiếp tục chạy bundle Control UI trước cập nhật với Gateway mới hơn.

| Bề mặt                                               | Chức năng                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | Manifest PWA. Trình duyệt sẽ đề xuất "Cài đặt ứng dụng" khi có thể truy cập.   |
| `ui/public/sw.js`                                     | Service worker xử lý sự kiện `push` và các lần nhấp thông báo. |
| `push/vapid-keys.json` (trong thư mục trạng thái OpenClaw) | Cặp khóa VAPID tự động tạo dùng để ký payload Web Push.       |
| `push/web-push-subscriptions.json`                    | Các endpoint đăng ký trình duyệt đã lưu.                          |

Ghi đè cặp khóa VAPID thông qua biến môi trường trên tiến trình Gateway khi bạn muốn ghim khóa (cho triển khai nhiều host, xoay vòng bí mật hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `https://openclaw.ai`)

Control UI dùng các phương thức Gateway được giới hạn theo phạm vi này để đăng ký và kiểm thử các đăng ký trình duyệt:

- `push.web.vapidPublicKey` — lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` — đăng ký một `endpoint` cùng `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — xóa một endpoint đã đăng ký.
- `push.web.test` — gửi thông báo kiểm thử tới đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn relay APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) cho push dựa trên relay) và phương thức `push.test` hiện có, vốn nhắm tới ghép nối di động native.
</Note>

## Nhúng được host

Tin nhắn trợ lý có thể render nội dung web được host nội tuyến bằng shortcode `[embed ...]`. Chính sách sandbox iframe được kiểm soát bởi `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Tắt thực thi script bên trong các phần nhúng được host.
  </Tab>
  <Tab title="scripts (default)">
    Cho phép phần nhúng tương tác trong khi vẫn giữ cách ly origin; đây là mặc định và thường đủ cho các trò chơi/widget trình duyệt tự chứa.
  </Tab>
  <Tab title="trusted">
    Thêm `allow-same-origin` trên `allow-scripts` cho các tài liệu cùng site chủ động cần đặc quyền mạnh hơn.
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

URL nhúng `http(s)` bên ngoài tuyệt đối vẫn bị chặn theo mặc định. Nếu bạn chủ động muốn `[embed url="https://..."]` tải các trang bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chiều rộng tin nhắn Chat

Các tin nhắn Chat được nhóm dùng max-width mặc định dễ đọc. Triển khai trên màn hình rộng có thể ghi đè mà không cần vá CSS đi kèm bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi tới trình duyệt. Các giá trị được hỗ trợ bao gồm độ dài thuần và phần trăm như `960px` hoặc `82%`, cùng các biểu thức chiều rộng bị ràng buộc `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` và `fit-content(...)`.

## Truy cập tailnet (khuyến nghị)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Giữ Gateway trên loopback và để Tailscale Serve proxy nó bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở:

    - `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn)

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua header danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và khớp nó với header, đồng thời chỉ chấp nhận các yêu cầu này khi yêu cầu đi vào loopback với header `x-forwarded-*` của Tailscale. Với phiên operator Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng ghép nối thiết bị; trình duyệt không có thiết bị và kết nối vai trò node vẫn theo các bước kiểm tra thiết bị bình thường. Đặt `gateway.auth.allowTailscale: false` nếu bạn muốn yêu cầu thông tin xác thực bí mật dùng chung rõ ràng ngay cả với lưu lượng Serve. Sau đó dùng `gateway.auth.mode: "token"` hoặc `"password"`.

    Với đường dẫn danh tính Serve bất đồng bộ đó, các lần xác thực thất bại cho cùng IP client và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử lại sai đồng thời từ cùng một trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp đơn thuần chạy đua song song.

    <Warning>
    Xác thực Serve không token giả định host gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên host đó, hãy yêu cầu xác thực token/password.
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

Nếu bạn mở dashboard qua HTTP thuần (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không bảo mật** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ được tài liệu hóa:

- Tương thích HTTP không an toàn chỉ cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- Xác thực operator Control UI thành công thông qua `gateway.auth.mode: "trusted-proxy"`
- Phương án khẩn cấp `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Cách khắc phục khuyến nghị:** dùng HTTPS (Tailscale Serve) hoặc mở UI cục bộ:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (trên host gateway)

<AccordionGroup>
  <Accordion title="Hành vi công tắc xác thực không an toàn">
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

    - Nó cho phép các phiên localhost Control UI tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không bảo mật.
    - Nó không bỏ qua kiểm tra ghép nối.
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
    `dangerouslyDisableDeviceAuth` tắt kiểm tra danh tính thiết bị Control UI và là một hạ cấp bảo mật nghiêm trọng. Hoàn nguyên nhanh sau khi dùng trong trường hợp khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Ghi chú trusted-proxy">
    - Xác thực trusted-proxy thành công có thể cho phép phiên Control UI **operator** không cần danh tính thiết bị.
    - Điều này **không** mở rộng sang các phiên Control UI vai trò node.
    - Reverse proxy loopback cùng host vẫn không thỏa mãn xác thực trusted-proxy; xem [Xác thực trusted proxy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI đi kèm chính sách `img-src` chặt chẽ: chỉ cho phép tài sản **cùng origin**, URL `data:`, và URL `blob:` được tạo cục bộ. URL ảnh từ xa `http(s)` và URL ảnh tương đối theo giao thức bị trình duyệt từ chối và không phát sinh fetch mạng.

Ý nghĩa trong thực tế:

- Avatar và ảnh được phục vụ dưới đường dẫn tương đối (ví dụ `/avatars/<id>`) vẫn render, bao gồm các route avatar đã xác thực mà UI fetch rồi chuyển đổi thành URL `blob:` cục bộ.
- URL nội tuyến `data:image/...` vẫn render (hữu ích cho payload trong giao thức).
- URL `blob:` cục bộ do Control UI tạo vẫn render.
- URL avatar từ xa do siêu dữ liệu kênh phát ra bị loại bỏ tại các helper avatar của Control UI và được thay bằng logo/badge tích hợp, nên một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt operator fetch ảnh từ xa tùy ý.

Bạn không cần thay đổi gì để có hành vi này — nó luôn bật và không cấu hình được.

## Xác thực route avatar

Khi xác thực gateway được cấu hình, endpoint avatar Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về ảnh avatar cho bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu avatar theo cùng quy tắc.
- Các yêu cầu chưa xác thực tới một trong hai route đều bị từ chối (khớp với route assistant-media cùng cấp). Điều này ngăn route avatar làm rò rỉ danh tính agent trên các host vốn được bảo vệ.
- Chính Control UI chuyển tiếp token gateway dưới dạng bearer header khi fetch avatar, và dùng URL blob đã xác thực để ảnh vẫn render trong dashboard.

Nếu bạn tắt xác thực Gateway (không khuyến nghị trên máy chủ dùng chung), tuyến avatar cũng sẽ không còn yêu cầu xác thực, phù hợp với phần còn lại của Gateway.

## Xác thực tuyến phương tiện của trợ lý

Khi xác thực Gateway được cấu hình, bản xem trước phương tiện cục bộ của trợ lý dùng tuyến hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực người vận hành Control UI thông thường. Trình duyệt gửi mã thông báo Gateway dưới dạng bearer header khi kiểm tra tính khả dụng.
- Phản hồi metadata thành công bao gồm một `mediaTicket` ngắn hạn, được giới hạn trong đúng đường dẫn nguồn đó.
- URL hình ảnh, âm thanh, video và tài liệu do trình duyệt hiển thị dùng `mediaTicket=<ticket>` thay vì mã thông báo hoặc mật khẩu Gateway đang hoạt động. Vé hết hạn nhanh và không thể cấp quyền cho nguồn khác.

Cách này giữ việc hiển thị phương tiện thông thường tương thích với các phần tử phương tiện gốc của trình duyệt mà không đặt thông tin xác thực Gateway có thể tái sử dụng trong các URL phương tiện hiển thị.

## Xây dựng UI

Gateway phục vụ các tệp tĩnh từ `dist/control-ui`. Xây dựng chúng bằng:

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

Sau đó trỏ UI đến URL Gateway WS của bạn (ví dụ: `ws://127.0.0.1:18789`).

## Trang Control UI trống

Nếu trình duyệt tải một bảng điều khiển trống và DevTools không hiển thị lỗi hữu ích, một tiện ích mở rộng hoặc content script chạy sớm có thể đã ngăn ứng dụng mô-đun JavaScript được đánh giá. Trang tĩnh bao gồm một bảng khôi phục HTML thuần xuất hiện khi `<openclaw-app>` chưa được đăng ký sau khi khởi động.

Dùng hành động **Thử lại** của bảng sau khi thay đổi môi trường trình duyệt, hoặc tải lại thủ công sau các bước kiểm tra này:

- Tắt các tiện ích mở rộng chèn vào mọi trang, đặc biệt là các tiện ích mở rộng có content script `<all_urls>`.
- Thử cửa sổ riêng tư, hồ sơ trình duyệt sạch hoặc trình duyệt khác.
- Giữ Gateway đang chạy và xác minh cùng URL bảng điều khiển sau khi thay đổi trình duyệt.

## Gỡ lỗi/kiểm thử: máy chủ dev + Gateway từ xa

Control UI là các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với origin HTTP. Điều này tiện lợi khi bạn muốn máy chủ dev Vite chạy cục bộ nhưng Gateway chạy ở nơi khác.

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
    - Nếu bạn truyền một endpoint `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy URL-encode giá trị `gatewayUrl` để trình duyệt phân tích chuỗi truy vấn đúng cách.
    - `token` nên được truyền qua URL fragment (`#token=...`) bất cứ khi nào có thể. Fragment không được gửi đến máy chủ, giúp tránh rò rỉ qua nhật ký yêu cầu và Referer. Tham số truy vấn `?token=` cũ vẫn được nhập một lần để tương thích, nhưng chỉ là phương án dự phòng và được loại bỏ ngay sau bootstrap.
    - `password` chỉ được giữ trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không fallback về thông tin xác thực từ cấu hình hoặc môi trường. Cung cấp rõ ràng `token` (hoặc `password`). Thiếu thông tin xác thực rõ ràng là lỗi.
    - Dùng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không nhúng) để ngăn clickjacking.
    - Các triển khai Control UI công khai không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (origin đầy đủ). Các lượt tải LAN/Tailnet riêng tư cùng origin từ loopback, RFC1918/link-local, `.local`, `.ts.net`, hoặc máy chủ Tailscale CGNAT được chấp nhận mà không cần bật fallback Host-header.
    - Khởi động Gateway có thể seed các origin cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ bind và cổng runtime hiệu lực, nhưng origin trình duyệt từ xa vẫn cần mục nhập rõ ràng.
    - Không dùng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ. Nó có nghĩa là cho phép mọi origin trình duyệt, không phải "khớp với bất kỳ host nào tôi đang dùng."
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ fallback origin Host-header, nhưng đây là chế độ bảo mật nguy hiểm.

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
- [Kiểm tra sức khỏe](/vi/gateway/health) — giám sát sức khỏe Gateway
- [TUI](/vi/web/tui) — giao diện người dùng terminal
- [WebChat](/vi/web/webchat) — giao diện trò chuyện dựa trên trình duyệt
