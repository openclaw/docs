---
read_when:
    - Bạn muốn vận hành Gateway từ trình duyệt
    - Bạn muốn truy cập Tailnet mà không cần đường hầm SSH
sidebarTitle: Control UI
summary: Giao diện điều khiển trên trình duyệt cho Gateway (trò chuyện, hoạt động, các Node, cấu hình)
title: Giao diện điều khiển
x-i18n:
    generated_at: "2026-07-19T17:04:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b6d17673b0a2f02ddf4f6fa0b33ccd1e5db9967833961260d93a1f141dc95981
    source_path: web/control-ui.md
    workflow: 16
---

Control UI là một ứng dụng một trang nhỏ dùng **Vite + Lit**, được Gateway phục vụ:

- mặc định: `http://<host>:18789/`
- tiền tố tùy chọn: đặt `gateway.controlUi.basePath` (ví dụ: `/openclaw`)

Ứng dụng giao tiếp **trực tiếp với Gateway WebSocket** trên cùng một cổng.

## Mở nhanh (cục bộ)

Nếu Gateway đang chạy trên cùng máy tính, hãy mở [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (hoặc [http://localhost:18789/](http://localhost:18789/)).

Nếu trang không tải được, trước tiên hãy khởi động Gateway: `openclaw gateway`.

<Note>
Trên các liên kết LAN gốc của Windows, Windows Firewall hoặc Group Policy do tổ chức quản lý vẫn có thể chặn URL LAN được công bố, ngay cả khi `127.0.0.1` hoạt động trên máy chủ Gateway. Chạy `openclaw gateway status --deep` trên máy chủ Windows; lệnh này báo cáo các cổng có khả năng bị chặn, cấu hình mạng không khớp và các quy tắc tường lửa cục bộ mà chính sách có thể bỏ qua.
</Note>

Thông tin xác thực được cung cấp trong quá trình bắt tay WebSocket thông qua:

- `connect.params.auth.token`
- `connect.params.auth.password`
- các tiêu đề danh tính Tailscale Serve khi `gateway.auth.allowTailscale: true`
- các tiêu đề danh tính proxy tin cậy khi `gateway.auth.mode: "trusted-proxy"`

Bảng cài đặt của bảng điều khiển lưu token cho phiên tab trình duyệt hiện tại và URL gateway đã chọn; mật khẩu không được lưu lâu dài. Quy trình thiết lập ban đầu thường tạo token gateway để xác thực bằng bí mật dùng chung trong lần kết nối đầu tiên, nhưng xác thực bằng mật khẩu cũng hoạt động khi `gateway.auth.mode` là `"password"`.

## Ghép nối thiết bị (kết nối lần đầu)

Kết nối từ trình duyệt hoặc thiết bị mới thường yêu cầu **phê duyệt ghép nối một lần**, được hiển thị dưới dạng `disconnected (1008): pairing required`.

<Steps>
  <Step title="Liệt kê các yêu cầu đang chờ">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Phê duyệt theo ID yêu cầu">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Nếu trình duyệt thử lại việc ghép nối với thông tin xác thực đã thay đổi (vai trò/phạm vi/khóa công khai), yêu cầu đang chờ trước đó sẽ bị thay thế và một `requestId` mới được tạo; hãy chạy lại `openclaw devices list` trước khi phê duyệt.

Việc chuyển một trình duyệt đã ghép nối từ quyền đọc sang quyền ghi/quản trị được xem là nâng cấp phê duyệt, không phải tự động kết nối lại: OpenClaw giữ phê duyệt cũ ở trạng thái hoạt động, chặn lần kết nối lại có quyền rộng hơn và yêu cầu bạn phê duyệt rõ ràng bộ phạm vi mới.

Sau khi được phê duyệt, thiết bị sẽ được ghi nhớ và không cần phê duyệt lại, trừ khi bạn thu hồi thiết bị bằng `openclaw devices revoke --device <id> --role <role>`. Xem [CLI thiết bị](/vi/cli/devices) để biết về xoay vòng token, thu hồi và luồng phê duyệt lần chạy đầu tiên của Paperclip / `openclaw_gateway`.

<Note>
- Các kết nối trình duyệt loopback cục bộ trực tiếp (`127.0.0.1` / `localhost`) được tự động phê duyệt.
- Tailscale Serve có thể bỏ qua lượt ghép nối cho các phiên vận hành Control UI khi `gateway.auth.allowTailscale: true`, danh tính Tailscale được xác minh và trình duyệt cung cấp danh tính thiết bị. Các trình duyệt không có danh tính thiết bị và kết nối có vai trò node vẫn tuân theo quy trình kiểm tra thiết bị thông thường.
- Các liên kết Tailnet trực tiếp, kết nối trình duyệt qua LAN và hồ sơ trình duyệt không có danh tính thiết bị vẫn yêu cầu phê duyệt rõ ràng.
- Mỗi hồ sơ trình duyệt tạo một ID thiết bị duy nhất, vì vậy việc chuyển trình duyệt hoặc xóa dữ liệu trình duyệt yêu cầu ghép nối lại.

</Note>

## Ghép nối thiết bị di động

Quản trị viên đã ghép nối có thể tạo mã QR kết nối iOS/Android mà không cần mở terminal:

<Steps>
  <Step title="Mở ghép nối thiết bị di động">
    Chọn **Devices**, sau đó nhấp vào **Pair mobile device** trong thẻ **Devices**.
  </Step>
  <Step title="Kết nối điện thoại">
    Trong ứng dụng di động OpenClaw, mở **Settings** → **Gateway** và quét mã QR. Thay vào đó, bạn có thể sao chép và dán mã thiết lập.
  </Step>
  <Step title="Xác nhận kết nối">
    Ứng dụng iOS/Android chính thức sẽ tự động kết nối. Nếu **Pending approval** hiển thị một yêu cầu, hãy xem xét vai trò và phạm vi của yêu cầu đó trước khi phê duyệt.
  </Step>
</Steps>

Việc tạo mã thiết lập yêu cầu `operator.admin`; nút này bị vô hiệu hóa đối với các phiên không có quyền đó. Mã thiết lập chứa thông tin xác thực khởi tạo có thời hạn ngắn, vì vậy hãy bảo vệ mã QR và mã đã sao chép như mật khẩu trong thời gian chúng còn hiệu lực. Để ghép nối từ xa, Gateway phải phân giải thành `wss://` (ví dụ: thông qua Tailscale Serve/Funnel); `ws://` thuần túy chỉ giới hạn ở địa chỉ loopback và LAN riêng. Xem [Ghép nối](/vi/channels/pairing#pair-from-the-control-ui-recommended) để biết đầy đủ chi tiết về bảo mật và phương án dự phòng.

## Danh tính cá nhân (cục bộ trong trình duyệt)

Control UI hỗ trợ danh tính cá nhân theo từng trình duyệt (tên hiển thị và ảnh đại diện) được đính kèm vào tin nhắn gửi đi để xác định nguồn trong các phiên dùng chung. Danh tính này nằm trong bộ nhớ trình duyệt, chỉ áp dụng cho hồ sơ trình duyệt hiện tại, không được đồng bộ với các thiết bị khác hoặc lưu lâu dài ở phía máy chủ ngoài siêu dữ liệu tác giả bản ghi thông thường trên các tin nhắn bạn gửi. Việc xóa dữ liệu trang web hoặc chuyển trình duyệt sẽ đặt lại danh tính về trống.

Ghi đè ảnh đại diện của trợ lý tuân theo cùng mô hình cục bộ trong trình duyệt: các ghi đè đã tải lên sẽ phủ lên danh tính do gateway phân giải ở cục bộ và không bao giờ được gửi khứ hồi qua `config.patch`. Trường cấu hình dùng chung `ui.assistant.avatar` vẫn khả dụng cho các máy khách không dùng UI ghi trực tiếp vào trường này.

## Điểm cuối cấu hình thời gian chạy

Control UI lấy cài đặt thời gian chạy từ `/control-ui-config.json`, được phân giải tương đối với đường dẫn cơ sở Control UI của gateway (ví dụ: `/__openclaw__/control-ui-config.json` dưới đường dẫn cơ sở `/__openclaw__/`). Điểm cuối này được bảo vệ bằng cùng cơ chế xác thực gateway như phần còn lại của bề mặt HTTP: trình duyệt chưa xác thực không thể truy xuất điểm cuối, và việc truy xuất thành công yêu cầu token/mật khẩu gateway hợp lệ, danh tính Tailscale Serve hoặc danh tính proxy tin cậy.

## Trạng thái máy chủ Gateway

Mở **Settings → General** để xem thẻ **Gateway Host** với máy Gateway, địa chỉ LAN, hệ điều hành, môi trường thời gian chạy, thời gian hoạt động, tải CPU, bộ nhớ và dung lượng đĩa của volume trạng thái. Thẻ làm mới mỗi 10 giây khi hiển thị thông qua Gateway RPC `system.info`, yêu cầu phạm vi `operator.read`. Các Gateway cũ hơn và kết nối không có phạm vi đó sẽ không hiển thị thẻ.

## Hỗ trợ ngôn ngữ

Control UI tự bản địa hóa trong lần tải đầu tiên dựa trên ngôn ngữ của trình duyệt. Để ghi đè sau đó, hãy mở **Settings -> General -> Language** (bộ chọn nằm trên trang General, không nằm trong Appearance).

- Các ngôn ngữ được hỗ trợ: `en`, `ar`, `de`, `es`, `fa`, `fr`, `hi`, `id`, `it`, `ja-JP`, `ko`, `nl`, `pl`, `pt-BR`, `ru`, `th`, `tr`, `uk`, `vi`, `zh-CN`, `zh-TW`
- Các bản dịch không phải tiếng Anh được tải trì hoãn trong trình duyệt.
- Ngôn ngữ đã chọn được lưu trong bộ nhớ trình duyệt và tái sử dụng trong các lần truy cập sau.
- Các khóa bản dịch bị thiếu sẽ dùng tiếng Anh làm phương án dự phòng.

Bản dịch tài liệu được tạo cho cùng tập hợp ngôn ngữ không phải tiếng Anh, nhưng bộ chọn ngôn ngữ Mintlify tích hợp sẵn trên trang tài liệu chỉ liệt kê các mã ngôn ngữ được Mintlify chấp nhận. Tài liệu tiếng Thái (`th`) và tiếng Ba Tư (`fa`) vẫn được tạo trong kho lưu trữ xuất bản; chúng có thể chưa xuất hiện trong bộ chọn đó cho đến khi Mintlify hỗ trợ các mã này.

## Chủ đề giao diện

Bảng Appearance có các chủ đề Claw, Knot và Dash tích hợp sẵn (Claw là mặc định), cùng một vị trí nhập tweakcn cục bộ trong trình duyệt. Để nhập một chủ đề, hãy mở [trình chỉnh sửa tweakcn](https://tweakcn.com/editor/theme), chọn hoặc tạo một chủ đề, nhấp vào **Share**, rồi dán liên kết đã sao chép vào Appearance. Trình nhập cũng chấp nhận các URL registry `https://tweakcn.com/r/themes/<id>`, URL trình chỉnh sửa như `https://tweakcn.com/editor/theme?theme=amethyst-haze`, đường dẫn `/themes/<id>` tương đối, ID chủ đề thô và tên chủ đề mặc định như `amethyst-haze`.

Các chủ đề đã nhập chỉ được lưu trong hồ sơ trình duyệt hiện tại; chúng không được ghi vào cấu hình gateway và không đồng bộ giữa các thiết bị. Việc thay thế chủ đề đã nhập sẽ cập nhật vị trí cục bộ duy nhất; việc xóa chủ đề đó sẽ chuyển về Claw nếu chủ đề đã nhập đang hoạt động.

Appearance cũng có cài đặt Text size. Cài đặt này áp dụng cho văn bản trò chuyện, văn bản trong trình soạn thảo, thẻ công cụ và thanh bên trò chuyện, đồng thời giữ kích thước trường nhập văn bản ít nhất là 16px để Safari trên thiết bị di động không tự động thu phóng khi trường được lấy nét.

Chủ đề, chế độ chủ đề, kích thước văn bản, ngôn ngữ và tùy chọn hiển thị trò chuyện được đồng bộ qua cấu hình gateway (`ui.prefs`), vì vậy chúng theo bạn trên các thiết bị và các tác nhân có thể thay đổi chúng thông qua cổng phê duyệt — các máy khách đã kết nối áp dụng thay đổi trực tiếp qua thông báo `config.changed` của gateway. Mỗi trình duyệt giữ một bản sao cục bộ để khởi động tức thì; các máy khách không thể ghi cấu hình (phạm vi người xem, ngoại tuyến) giữ các thay đổi cục bộ trên thiết bị. Xem [Tham chiếu cấu hình](/vi/gateway/configuration-reference#ui).

## Chăm sóc hệ thống OpenClaw

Mở **OpenClaw** trong thanh bên để trò chuyện với tác nhân thiết lập và sửa chữa hệ thống. Ngoài quy trình thiết lập ban đầu, trang này có thể hiển thị tối đa một chip sự kiện có thể bỏ qua trong mỗi lượt truy cập. Trang không phản hồi lưu lượng Gateway thông thường và chỉ phản ứng với các bản chụp tình trạng báo cáo trình tải lại cấu hình bị vô hiệu hóa, một kênh đã cấu hình bị ngắt kết nối/suy giảm, một lần thăm dò kênh thất bại hoặc thông tin xác thực kênh không khả dụng. Một sự kiện mới hơn chỉ thay thế chip đang chờ khi sự kiện đó nghiêm trọng hơn; việc bỏ qua hoặc sử dụng chip sẽ tắt lời nhắc sự kiện trong lượt truy cập đó. Việc nhấp vào chip gửi câu hỏi chẩn đoán của chip dưới dạng tin nhắn `openclaw.chat` thực sự, vì vậy bản ghi sẽ lưu yêu cầu và OpenClaw thực hiện chẩn đoán. Quy trình thiết lập ban đầu không bao giờ hiển thị các chip sự kiện này.

## Quản lý Plugin

Mở **Plugins** trong thanh bên hoặc sử dụng `/settings/plugins` tương đối với
đường dẫn cơ sở Control UI đã cấu hình để duyệt và quản lý các Plugin mà không rời khỏi
Control UI. Ví dụ: đường dẫn cơ sở `/openclaw` sử dụng
`/openclaw/settings/plugins`. Trang này luôn khả dụng, ngay cả khi mọi
Plugin tùy chọn đều bị vô hiệu hóa.

Plugins là một trung tâm có bốn thẻ: **Installed** và **Discover** quản lý mã Plugin
tại `/settings/plugins`, **Skills** lưu trình quản lý kỹ năng theo từng tác nhân tại
`/skills`, và **Workshop** lưu quy trình review đề xuất Skill Workshop tại
`/skills/workshop`. Mỗi thẻ giữ URL riêng, và thanh bên hiển thị
một mục Plugins duy nhất cho tất cả các thẻ.

Thẻ **Installed** hiển thị toàn bộ kho cục bộ được nhóm theo danh mục, kèm
số liệu tổng quan. Mỗi hàng mở một chế độ xem chi tiết; menu mục bổ sung (`…`) của hàng
cho phép bật hoặc tắt Plugin và cung cấp tùy chọn **Remove** cho các Plugin được cài đặt bên ngoài.
Thẻ này cũng liệt kê các [máy chủ MCP](/vi/cli/mcp) đã cấu hình và hỗ trợ thêm, vô hiệu hóa
và xóa chúng ngay tại chỗ. Các điều khiển máy chủ tương tự nằm tại **Settings → MCP**.
Thẻ **Discover** là cửa hàng: các Plugin nổi bật đi kèm OpenClaw,
các Plugin chính thức bên ngoài và trình kết nối MCP một lần nhấp cho các dịch vụ phổ biến.
Việc nhập vào hộp tìm kiếm sẽ truy vấn
[ClawHub](https://clawhub.ai/plugins) ngay tại chỗ và thêm một phần **From ClawHub**
với số lượt tải xuống và huy hiệu xác minh nguồn. Các liên kết sâu có thể
trỏ trực tiếp đến cửa hàng bằng `/settings/plugins?tab=discover`.

Thẻ **Skills** lưu báo cáo trạng thái kỹ năng, nút bật/tắt, mục nhập khóa API
và tìm kiếm kỹ năng ClawHub ngay tại chỗ, giới hạn trong tác nhân đã chọn. Thẻ
**Workshop** lưu bảng Skill Workshop và luồng review Today cho
[các đề xuất kỹ năng](/vi/tools/skill-workshop). **Find skill ideas** review một
cửa sổ giới hạn gồm các phiên đáng kể từ mới nhất đến cũ nhất và để lại mọi kết quả dưới dạng
đề xuất đang chờ. Bảng hiển thị phạm vi bao phủ tích lũy; **Scan earlier work**
tiếp tục từ con trỏ đã lưu lâu dài, sau đó trở thành **Scan new work** sau khi
đã duyệt hết lịch sử cũ hơn. Việc review lịch sử thủ công hoạt động khi tính năng tự học
tự động bị vô hiệu hóa và sử dụng mô hình đã cấu hình của tác nhân được chọn.

Các Plugin đi kèm đã có sẵn trên Gateway và hiển thị **Enable** hoặc
**Disable** thay vì **Install**. Ví dụ: Workboard đi kèm
OpenClaw nhưng bị vô hiệu hóa theo mặc định, vì vậy hành động của Plugin này là **Enable**. Các Plugin được đóng gói sẵn
không thể bị xóa, chỉ có thể bị vô hiệu hóa.

Việc đọc danh mục và tìm kiếm ClawHub yêu cầu `operator.read`. Việc cài đặt,
bật, tắt hoặc gỡ bỏ plugin và thay đổi máy chủ MCP yêu cầu
`operator.admin`; các thao tác đó vẫn bị vô hiệu hóa đối với người vận hành chỉ có quyền đọc.

Các lượt cài đặt ClawHub được thực hiện thông qua Gateway và tuân theo cùng các bước kiểm tra
về độ tin cậy, tính toàn vẹn và chính sách cài đặt plugin như các lượt cài đặt khác qua Gateway. Việc cài đặt
hoặc gỡ bỏ mã plugin yêu cầu khởi động lại Gateway. Việc bật hoặc tắt một
plugin đã cài đặt có thể có hiệu lực mà không cần khởi động lại khi plugin và môi trường chạy
Gateway hiện tại hỗ trợ; nếu không, giao diện người dùng sẽ thông báo rằng cần
khởi động lại. Các trình kết nối MCP dựa trên OAuth cần thực hiện một lần
`openclaw mcp login <name>` từ CLI sau khi được thêm.

Trang này chủ ý tập trung vào kiểm kê, khám phá, cài đặt, kích hoạt
và gỡ bỏ. Sử dụng [`openclaw plugins`](/vi/cli/plugins) cho các nguồn npm, git hoặc
đường dẫn cục bộ tùy ý, các bản cập nhật và cấu hình plugin nâng cao.

## Ứng dụng và tiện ích mở rộng

Mở **Ứng dụng** từ menu **Thêm** của thanh bên, bảng lệnh hoặc
menu tác nhân trên thanh bên (**Tải ứng dụng**), hoặc sử dụng `/apps` tương đối so với
đường dẫn cơ sở đã cấu hình của giao diện điều khiển. Trang này tập hợp các liên kết cài đặt cho mọi
bề mặt đồng hành của OpenClaw: ứng dụng [iOS](/vi/platforms/ios) và
[Android](/vi/platforms/android), các ứng dụng đồng hành Apple Watch và Wear OS
đi kèm, ứng dụng máy tính [macOS](/vi/platforms/macos), [Windows](/vi/platforms/windows)
và [Linux](/vi/platforms/linux), [tiện ích mở rộng Chrome](/vi/tools/chrome-extension),
trung tâm Plugin trong ứng dụng với [ClawHub](https://clawhub.ai), cùng cộng đồng Discord và tài liệu.

## Điều hướng thanh bên

Thanh bên tổ chức mọi thứ xoay quanh tác nhân. Hàng danh tính ở trên cùng là tác nhân đang hoạt động; bên dưới, phần **Trang** bắt đầu bằng **Trang chủ** — phiên chính liên tục của tác nhân, có huy hiệu thể hiện trạng thái chưa đọc hoặc đang chạy — tiếp theo là các đích đã ghim (mặc định là **Mức sử dụng**, **Tự động hóa** và **Plugin**). Nút tùy chỉnh trên tiêu đề Trang mở một menu chứa mọi đích khác, bao gồm các thẻ do plugin cung cấp, cùng **Chỉnh sửa mục đã ghim**; nhấp chuột phải vào vùng điều hướng sẽ mở trực tiếp trình chỉnh sửa ghim. Danh sách phiên bên dưới được chia thành các vùng: **Luồng** cho các phiên trò chuyện của tác nhân (phiên chính nằm sau Trang chủ; các phiên do nó tạo xuất hiện ở đây dưới dạng luồng cấp cao nhất và các luồng có tên hiển thị không kèm tiền tố loại), **Nhóm** cho các cuộc trò chuyện nhóm và phòng, và **Lập trình** cho các phiên được liên kết với worktree được quản lý hoặc node thực thi (các hàng hiển thị một dòng `repo ⎇ branch` cùng máy chủ của node), các phiên harness dựa trên ACP và các danh mục CLI Codex/Claude. Lập trình được thu gọn trong lần chạy đầu tiên và ghi nhớ lựa chọn của bạn; tiêu đề khi thu gọn vẫn giữ số lượng thực và hiển thị chỉ báo đang chạy trong khi các phiên bên trong hoạt động. Các nhóm tùy chỉnh (`category` của phiên) và các hàng **Đã ghim** nằm phía trên Luồng, đồng thời việc gán phiên vào nhóm tùy chỉnh luôn được ưu tiên hơn phân loại vùng tự động. Tiêu đề Luồng chứa nút điều khiển sắp xếp (Đã tạo hoặc Cập nhật gần nhất, cùng nút bật/tắt Nhóm theo) và dấu **+** để mở trang Phiên mới. Việc mở một phiên sẽ di chuyển phần tô sáng lựa chọn mà không sắp xếp lại các hàng. Các phiên cha có lượt chạy con gần đây hiển thị nút mở rộng và số lượng phiên con; mở rộng để kiểm tra các phiên con lồng nhau, trạng thái trực tiếp hoặc kết thúc và môi trường chạy mà không rời thanh bên. Việc chọn một phiên con sẽ mở cuộc trò chuyện của phiên đó và tự động hiển thị đường dẫn tổ tiên. Các hàng con không tham gia nhóm gốc, ghim, kéo, chọn nhiều và phân trang; các vùng đã thu gọn không chiếm hạn mức trang hiển thị. Các phiên có hoạt động mới kể từ lần đọc gần nhất hiển thị dấu chấm chưa đọc và việc mở phiên sẽ đánh dấu là đã đọc. Trạng thái vòng đời của worker đám mây sử dụng huy hiệu hình địa cầu; các phiên cục bộ và được thu hồi không hiển thị huy hiệu vị trí vì thực thi cục bộ là mặc định. Mỗi hàng phiên gốc có menu ngữ cảnh (nút ba chấm dọc hoặc nhấp chuột phải) với Ghim/Bỏ ghim, Đánh dấu là chưa đọc/đã đọc, Đổi tên, Phân nhánh, Chuyển vào nhóm (bao gồm Nhóm mới và Xóa khỏi nhóm), Lưu trữ và Xóa; bố cục cảm ứng luôn hiển thị các nút ghim và menu trực tiếp. Nhấp Cmd/Ctrl sẽ chuyển đổi các hàng gốc vào chế độ chọn nhiều và nhấp Shift sẽ mở rộng lựa chọn theo thứ tự đang hiển thị; sau đó, việc mở menu trên một hàng đã chọn sẽ cung cấp các thao tác hàng loạt (Đánh dấu N là chưa đọc/đã đọc, Chuyển N vào nhóm, Lưu trữ N, Xóa N) áp dụng cho mọi phiên đã chọn, với một lần xác nhận duy nhất khi xóa hàng loạt. Kéo một phiên gốc vào **Đã ghim** để ghim hoặc vào một nhóm tùy chỉnh để di chuyển. Tiêu đề nhóm tùy chỉnh có thể được thu gọn, mở rộng hoặc kéo để sắp xếp lại; tên nhóm và thứ tự của chúng được lưu trong gateway (`sessions.groups.*`), nên chúng được đồng bộ giữa các trình duyệt, trong khi trạng thái thu gọn vẫn nằm trong hồ sơ trình duyệt. Tiêu đề nhóm cũng có menu (nút ba chấm dọc hoặc nhấp chuột phải) với Đổi tên nhóm, Nhóm mới và Xóa nhóm; việc đổi tên hoặc xóa nhóm sẽ cập nhật mọi phiên thành viên ở phía máy chủ, bao gồm cả các phiên đã lưu trữ, và việc xóa nhóm sẽ giữ lại các phiên rồi chuyển chúng về Luồng.

## Trang phiên mới

Dấu **+** trong tiêu đề danh sách phiên của thanh bên mở một bản nháp toàn trang tại `/new`: không có gì được tạo cho đến khi bạn gửi tin nhắn đầu tiên. Hàng đích phía trên hộp tin nhắn chọn nơi phiên hoạt động: tác nhân (trong thiết lập đa tác nhân), nơi chạy lệnh thực thi (**Gateway · local** hoặc một node đã ghép đôi cung cấp `system.run`; yêu cầu `operator.admin`), thư mục (mặc định là không gian làm việc của tác nhân; các đường dẫn Gateway tuyệt đối khác yêu cầu `operator.admin` và một worktree), cùng nút bật/tắt **Worktree** tùy chọn với bộ chọn nhánh cơ sở (dựa trên `worktrees.branches`, nên không diễn ra thao tác fetch) và tên worktree tùy chọn (nhánh trở thành `openclaw/<name>`). Chân trình soạn thảo chọn mô hình và mức suy luận cho phiên mới, đồng thời các lượt khởi chạy trên đám mây lưu cả hai lựa chọn trước khi điều phối phiên đến worker. Nút duyệt trên chip thư mục mở trình chọn thư mục nội tuyến dựa trên phương thức `fs.listDir` chỉ dành cho quản trị viên. Cấp cao nhất của trình chọn hiển thị Gateway và mọi node đã biết; các node ngoại tuyến và node không hỗ trợ duyệt thư mục vẫn hiển thị nhưng bị vô hiệu hóa. Việc chọn Gateway bắt đầu từ thư mục hiện tại hoặc thư mục chính của Gateway. Việc chọn một node có khả năng phù hợp sẽ duyệt hệ thống tệp trên máy chủ của node đó, liên kết lệnh thực thi với node và sử dụng trực tiếp đường dẫn node tuyệt đối đã chọn (các worktree được quản lý vẫn chỉ khả dụng trên Gateway). Việc gửi sẽ gọi `sessions.create` cùng tin nhắn đầu tiên, vì vậy lượt chạy bắt đầu trong cùng một vòng khứ hồi và giao diện người dùng chuyển đến cuộc trò chuyện của phiên mới. Nếu Gateway tạo phiên nhưng từ chối lần gửi đầu tiên đó, cuộc trò chuyện sẽ giữ lại lời nhắc và lỗi sau khi tải lại; **Thử lại** gửi nội dung qua phiên đã được tạo thay vì tạo một phiên khác.

Trong **Cài đặt**, thanh bên chuyên dụng bắt đầu bằng trường **Tìm kiếm cài đặt** để nhanh chóng tìm các phần cài đặt.

Trường **Tìm kiếm** ở đầu thanh bên mở bảng lệnh (⌘K). Việc nhấp vào hàng danh tính tác nhân ở đầu thanh bên sẽ mở menu tác nhân; **Trang chủ** mở phiên chính. Khi có nội dung cần xử lý — các tác vụ cron bị lỗi hoặc quá hạn, thông tin xác thực mô hình sắp hết hạn hoặc đã hết hạn — các chip chú ý nhỏ gọn xuất hiện phía trên chân thanh bên và dẫn đến trang sở hữu khi được nhấp. Hàng danh tính hiển thị ảnh đại diện của tác nhân (hình ảnh danh tính hoặc emoji), tên, dấu chấm kết nối và phụ đề trực tiếp. Nhấp vào đó sẽ mở menu tác nhân: trình chuyển đổi tác nhân (trong thiết lập đa tác nhân), "Tác nhân này có thể làm gì?", **Cài đặt tác nhân**, **Cài đặt**, ghép đôi thiết bị di động, **Tài liệu**, chip bản dựng và nút bật/tắt chế độ màu. Danh sách có hơn mười tác nhân sẽ có trường lọc và liệt kê các tác nhân đã ghim trước; ghim hoặc bỏ ghim tác nhân từ trang cài đặt Tác nhân, với tập hợp đã ghim được lưu trong hồ sơ trình duyệt. Việc chọn một tác nhân sẽ giới hạn Trò chuyện cùng Mức sử dụng, Tự động hóa, Tác vụ, Bảng công việc và Phiên theo tác nhân đó. Mỗi trang đã giới hạn phạm vi cung cấp nút điều khiển **Tác nhân** với **Tất cả tác nhân** để thoát phạm vi; thao tác này mở rộng phạm vi trang dùng chung mà không thay đổi tác nhân trò chuyện cụ thể, trong khi các liên kết phiên trực tiếp vẫn mở đúng đích. Trang cài đặt Tác nhân giữ lựa chọn `?agent=` riêng và không tuân theo phạm vi trang dùng chung. Thanh chân trang chứa logo sản phẩm, chip bản dựng, dấu chấm kết nối gateway và lối tắt Cài đặt. Khi gateway chạy từ bản checkout mã nguồn trên một nhánh khác `main`, chân trang cũng hiển thị tên nhánh đó bằng màu đỏ để có thể nhận biết ngay gateway không phải bản phát hành (các bản cài đặt phát hành không bao giờ hiển thị tên này). Shift-Command-Comma mở **Cài đặt** mà không ghi đè phím tắt Command-Comma của trình duyệt. Tiêu đề thanh bên cũng chứa nút thu gọn (⌘B); việc thu gọn sẽ ẩn hoàn toàn thanh bên để tạo không gian làm việc toàn chiều rộng và nút mở rộng nổi (hoặc ⌘B) sẽ đưa thanh bên trở lại; thay vào đó, ứng dụng macOS tích hợp nút này trực tiếp vào thanh tiêu đề. Thanh bên là thành phần điều hướng duy nhất trên máy tính, không có thanh trên cùng. Các khung nhìn hẹp thay thanh bên bằng ngăn trượt phủ, nằm sau một hàng tiêu đề nhỏ gọn chứa nút bật/tắt ngăn, thương hiệu và ô tìm kiếm bảng lệnh; trên điện thoại, Trò chuyện tích hợp hàng điều hướng đó vào thanh tiêu đề, với các nút menu và tìm kiếm bên cạnh tiêu đề phiên. Trong ứng dụng macOS, hàng tiêu đề riêng kết hợp khoảng trống dành cho thanh tiêu đề thành một dải nhỏ gọn duy nhất bên cạnh các nút điều khiển cửa sổ. Điều hướng sử dụng lịch sử trình duyệt thông thường, vì vậy các nút quay lại/tiến của trình duyệt có thể duyệt qua lịch sử; ứng dụng macOS bổ sung nút bật/tắt thanh bên nguyên bản bên cạnh các nút điều khiển cửa sổ cùng cử chỉ vuốt trên bàn di chuột, với các nút quay lại/tiến ở cạnh phải của thanh bên khi thanh được mở rộng và các nút tìm kiếm nguyên bản (bảng lệnh) cùng tạo phiên mới khi thanh được thu gọn.

Các phê duyệt đang chờ xử lý cũng tạo một chip chú ý phía trên chân thanh bên;
chọn chip đó để mở trang Phê duyệt sở hữu nó.

## Những gì hệ thống có thể làm (hiện tại)

<AccordionGroup>
  <Accordion title="Trò chuyện và Đàm thoại">
    - Trò chuyện với mô hình qua Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Các lần làm mới lịch sử trò chuyện yêu cầu một cửa sổ gần đây có giới hạn với giới hạn văn bản cho từng tin nhắn, vì vậy các phiên lớn không buộc trình duyệt phải kết xuất toàn bộ tải trọng bản ghi trước khi có thể sử dụng tính năng trò chuyện.
    - Khi di chuột qua hoặc dùng bàn phím đưa tiêu điểm vào liên kết công khai đến vấn đề hoặc pull request trên GitHub, trạng thái, tiêu đề, tác giả, hoạt động gần đây, bình luận và thống kê thay đổi của liên kết đó sẽ được hiển thị. Gateway đã kết nối tìm nạp và lưu vào bộ nhớ đệm siêu dữ liệu công khai mà không thay đổi đích liên kết, kể cả khi giao diện người dùng sử dụng Gateway từ xa. Gateway sử dụng `GH_TOKEN` hoặc `GITHUB_TOKEN` khi khả dụng, sau khi xác nhận kho lưu trữ là công khai; nếu không, Gateway sử dụng API ẩn danh của GitHub với thời gian lưu vào bộ nhớ đệm lâu hơn.
    - Đàm thoại qua các phiên thời gian thực trên trình duyệt. OpenAI sử dụng WebRTC trực tiếp, Google Live sử dụng mã thông báo trình duyệt dùng một lần có giới hạn qua WebSocket, còn các plugin giọng nói thời gian thực chỉ dành cho backend sử dụng phương thức truyền chuyển tiếp của Gateway. Các phiên trình duyệt hỗ trợ video có thể chọn camera cục bộ trên thiết bị trong Settings hoặc chuyển đổi camera từ bản xem trước trực tiếp; trình duyệt chụp các khung hình JPEG cho nhà cung cấp thời gian thực mà không truyền phát video từ camera qua Gateway. Các phiên nhà cung cấp do máy khách sở hữu bắt đầu bằng `talk.client.create`; các phiên chuyển tiếp qua Gateway bắt đầu bằng `talk.session.create`. Cơ chế chuyển tiếp giữ thông tin xác thực của nhà cung cấp trên Gateway trong khi trình duyệt truyền phát âm thanh PCM từ micrô qua `talk.session.appendAudio`, chuyển tiếp các lệnh gọi công cụ của nhà cung cấp `openclaw_agent_consult` qua `talk.client.toolCall` để áp dụng chính sách Gateway và mô hình OpenClaw lớn hơn đã cấu hình, đồng thời định tuyến việc điều khiển bằng giọng nói đối với lượt chạy đang hoạt động qua `talk.client.steer` hoặc `talk.session.steer`.
    - Truyền phát các lệnh gọi công cụ và thẻ đầu ra công cụ trực tiếp trong phần Trò chuyện (sự kiện tác nhân). Hoạt động của công cụ được kết xuất thành các hàng phù hợp với từng loại: lệnh shell hiển thị lệnh được tô sáng cú pháp cùng đầu ra theo kiểu thiết bị đầu cuối; các lệnh gọi chỉnh sửa và ghi được hỗ trợ hiển thị các bản diff nội tuyến có giới hạn, số dòng khi có và thống kê `+added -removed`; các lệnh gọi liên tiếp được thu gọn thành bản tóm tắt như "Đã chạy 13 lệnh, đọc 6 tệp, chỉnh sửa 9 tệp". Khi một lượt chạy đang diễn ra, lệnh gọi mới nhất đang chạy sẽ đặt tên cho tiêu đề nhóm. Mở rộng một hàng để kiểm tra các đối số còn lại và đầu ra thô.
    - Tiêu đề mục đích do AI tạo, không bắt buộc, dành cho các lệnh gọi công cụ phức tạp (lệnh shell dài, công cụ plugin có nhiều đối số), được bật bằng `gateway.controlUi.toolTitles: true` (mặc định tắt). Tiêu đề đến từ phương thức `chat.toolTitles` theo lô thông qua cơ chế định tuyến mô hình tiện ích tiêu chuẩn — một `utilityModel` tường minh (nhà cung cấp do người vận hành chọn, tương tự các tác vụ tiện ích khác), nếu không thì dùng mặc định mô hình nhỏ đã khai báo của nhà cung cấp phiên — và được lưu vào bộ nhớ đệm phía Gateway theo từng tác nhân. Khi tùy chọn tham gia bị tắt hoặc không có mô hình chi phí thấp nào có thể sử dụng, các hàng giữ nguyên nhãn xác định của chúng và không có lệnh gọi mô hình nào diễn ra.
    - Bắt đầu hoặc loại bỏ các tác vụ tiếp nối tạm thời do mô hình đề xuất; các đề xuất được chấp nhận sẽ mở một phiên cây làm việc được quản lý mới với lời nhắc được đề xuất.
    - Thẻ Hoạt động cung cấp các bản tóm tắt cục bộ trong trình duyệt, ưu tiên biên tập ẩn thông tin, về hoạt động công cụ trực tiếp từ cơ chế phân phối sự kiện `session.tool` / công cụ hiện có.

  </Accordion>
  <Accordion title="Kênh, phiên, bộ nhớ">
    - Kênh: trạng thái các kênh tích hợp sẵn cùng các kênh plugin đi kèm/bên ngoài, đăng nhập bằng mã QR và cấu hình theo từng kênh (`channels.status`, `web.login.*`, `config.patch`).
    - Các lần làm mới hoạt động thăm dò kênh giữ ảnh chụp nhanh trước đó hiển thị trong khi các bước kiểm tra nhà cung cấp chậm hoàn tất, đồng thời gắn nhãn các ảnh chụp nhanh một phần khi hoạt động thăm dò hoặc kiểm tra vượt quá ngân sách giao diện người dùng.
    - Luồng (một trang không gian làm việc tại `/sessions`, với thẻ **Cây làm việc** bên cạnh): mặc định liệt kê các phiên của tác nhân đã cấu hình, ghim các phiên thường dùng, đổi tên, lưu trữ hoặc khôi phục các phiên không hoạt động, dự phòng từ các khóa phiên tác nhân chưa cấu hình đã lỗi thời và áp dụng các chế độ ghi đè mô hình/suy nghĩ/nhanh/chi tiết/theo dõi/lập luận theo từng phiên (`sessions.list`, `sessions.patch`). Các phiên đã ghim được sắp xếp phía trên các phiên chưa ghim gần đây; các phiên đã lưu trữ nằm trong chế độ xem lưu trữ của trang Luồng và vẫn giữ bản ghi. Các hàng hiển thị một dấu chấm chưa đọc cho những phiên có hoạt động kể từ lần đọc gần nhất, với các hành động đánh dấu chưa đọc/đã đọc (`sessions.patch { unread }`) và hành động Phân nhánh để phân nhánh bản ghi sang một phiên mới (`sessions.create { parentSessionKey, fork: true }`). Các ô tổng quan phía trên bảng tóm tắt danh sách đã tải (số phiên, lượt chạy trực tiếp, phiên chưa đọc, tổng số token), mỗi hàng có một ký hiệu loại kèm dấu chấm lượt chạy trực tiếp, trạng thái được kết xuất dưới dạng dấu chấm đơn giản kèm nhãn, còn cột Token hiển thị đồng hồ mức sử dụng cửa sổ ngữ cảnh khi phiên báo cáo kích thước token và ngữ cảnh. Các hành động quản lý hàng nằm trong menu riêng của từng hàng (nút ba chấm dọc hoặc nhấp chuột phải), phản chiếu menu phiên của thanh bên; ngăn kéo hàng hiển thị môi trường chạy tác nhân và thời lượng chạy cùng các chi tiết phiên khác.
    - Danh mục thanh bên Claude và Codex gốc truyền phát từng máy chủ một, sau đó đối soát khi kết nối Node thay đổi, khi trang nhận tiêu điểm và tối đa 30 giây một lần trong lúc hiển thị. Các thay đổi danh mục kích hoạt một lượt tiếp nối nhanh hơn, nhờ đó các phiên được tạo trong công cụ gốc xuất hiện mà không cần tải lại giao diện điều khiển.
    - Nhóm phiên: điều khiển Group by sắp xếp bảng phiên thành các phần theo nhóm tùy chỉnh, kênh, loại, tác nhân hoặc ngày. Các nhóm tùy chỉnh được duy trì theo từng phiên qua `sessions.patch` (`category`), vì vậy các phiên được bắt đầu từ kênh nhắn tin (Discord, Telegram, WhatsApp, ...) cũng có thể được phân loại; gán nhóm bằng cách kéo hàng vào một phần hoặc dùng bộ chọn nhóm theo từng hàng, và tạo nhóm bằng hành động New group.
    - Bộ nhớ (một thẻ trên trang Tác nhân, có phạm vi theo tác nhân đã chọn): trạng thái Dreaming, nút bật/tắt và trình đọc Nhật ký Giấc mơ (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
    - Nhập bộ nhớ (`/memory-import`, truy cập từ thẻ Bộ nhớ trên trang Tác nhân): xem trước và sao chép bộ nhớ tự động cục bộ của Claude Code, bộ nhớ hợp nhất của Codex hoặc các tệp bộ nhớ Hermes vào không gian làm việc của tác nhân đã chọn (`migrations.memory.plan`, `migrations.memory.apply`).
    - Đề nghị nhập bộ nhớ trong quá trình làm quen: khi giao diện điều khiển mở ở chế độ làm quen (`?onboarding=1`, được ứng dụng đồng hành Linux sử dụng sau lần cài đặt đầu tiên), một hộp thoại một trang đề nghị nhập các bộ nhớ được phát hiện bằng cùng luồng lập kế hoạch/áp dụng; nếu bỏ qua, trang cài đặt vẫn là điểm truy cập sau này.

  </Accordion>
  <Accordion title="Cron, tác vụ, plugin, Skills, thiết bị, phê duyệt thực thi">
    - Tự động hóa (công việc cron): các thẻ thống kê (số lượng quy trình tự động hóa, số lượng đang lỗi, trạng thái bộ lập lịch, lần đánh thức tiếp theo) phía trên nút chuyển thẻ Tự động hóa/Lịch sử chạy; thẻ Tự động hóa liệt kê các công việc trong bảng có thể lọc (Tất cả/Đang hoạt động/Tạm dừng, tìm kiếm, bộ lọc lịch biểu và lần chạy gần nhất, menu hành động theo từng hàng) cùng các đề xuất khởi đầu phía dưới, còn thẻ Lịch sử chạy hiển thị các lượt chạy gần đây trên tất cả quy trình tự động hóa (`cron.*`).
    - Tác vụ: sổ theo dõi trực tiếp các tác vụ nền đang hoạt động và gần đây, kèm phiên liên kết và khả năng hủy (`tasks.*`). Thanh Tác vụ nền của phần Trò chuyện nhóm công việc đang chạy và đã hoàn tất; chọn một hàng để kiểm tra lời nhắc có giới hạn cùng đầu ra hoặc bản tóm tắt lỗi.
    - Plugin: duyệt danh sách đã cài đặt và cửa hàng tuyển chọn, tìm kiếm ClawHub, cài đặt và gỡ bỏ mã plugin, đồng thời bật hoặc tắt các plugin đã cài đặt (`plugins.*`); các hàng máy chủ MCP chỉnh sửa `mcp.servers` thông qua các phương thức cấu hình.
    - Skills: trạng thái, bật/tắt, cài đặt, cập nhật khóa API (`skills.*`).
    - Thiết bị: một danh mục hợp nhất các bản ghi thiết bị đã ghép nối, danh mục Node và trạng thái hiện diện trực tiếp (`device.pair.list`, `node.list`, `system-presence`). Máy chủ Gateway được ghim đầu tiên; các máy khách đã ghép nối hiển thị trạng thái kết nối, vai trò, token, khả năng và lệnh. Các ghép nối trùng lặp được thu gọn thành một nhóm có thể mở rộng và **Dọn dẹp N mục lỗi thời** xóa hàng loạt các bản trùng lặp ngoại tuyến được quản trị viên xác nhận, vốn đã được tự động phê duyệt (cục bộ im lặng, CIDR đáng tin cậy hoặc được xác minh bằng SSH) hoặc có trước nguồn gốc phê duyệt. Có thể xóa các mục nhập (`node.pair.remove`, `device.pair.remove`), xử lý trực tiếp việc ghép nối thiết bị và phê duyệt lại Node (`device.pair.*`, `node.pair.approve`/`reject`), đồng thời tạo mã thiết lập di động từ cùng một thẻ.
    - Phê duyệt thực thi: chỉnh sửa danh sách cho phép của Gateway hoặc Node và chính sách hỏi cho `exec host=gateway/node` (`exec.approvals.*`).

  </Accordion>
  <Accordion title="Cấu hình">
    - Xem/chỉnh sửa `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Điều hướng cài đặt nhóm các trang theo mức độ cần chú ý: Tổng quan, Giao diện và Thông báo ở trên cùng; Kết nối (Kết nối, Kênh, Liên lạc, Thiết bị); Tác nhân & Công cụ (Tác nhân, AI & Tác nhân, Nhà cung cấp mô hình, MCP, Tự động hóa, Phòng thí nghiệm); Quyền riêng tư & Bảo mật (Bảo mật, Phê duyệt); và Hệ thống (Hạ tầng, Nâng cao, Gỡ lỗi, Nhật ký, Giới thiệu). Tổng quan là một trung tâm tinh gọn với các giá trị mặc định của mô hình, ngôn ngữ và số liệu thống kê máy chủ Gateway; mọi cài đặt khác chỉ nằm trên đúng một trang.
    - Quyền riêng tư & Bảo mật: các hàng được tuyển chọn cho xác thực Gateway, chính sách thực thi, bật trình duyệt, hồ sơ công cụ, xác thực thiết bị và ghép nối thiết bị di động, nằm phía trên các phần dựa trên lược đồ `security`/`approvals`.
    - Phê duyệt bao gồm lịch sử 30 ngày, mới nhất trước, cho các yêu cầu thực thi, Plugin và tác nhân hệ thống đã được xử lý. Lọc theo loại hoặc chuyển qua các trang hàng cũ hơn để xem lại quyết định, lý do, phiên nguồn và thông tin người xử lý được Gateway ghi lại.
    - Phòng thí nghiệm cung cấp các công tắc thử nghiệm đã phát hành. Chế độ mã là mục hiện tại và lưu `tools.codeMode.enabled` ngay lập tức; các thử nghiệm chưa phát hành không xuất hiện hoặc ghi các khóa cấu hình mang tính phỏng đoán.
    - Thông báo: trạng thái web push của trình duyệt, đăng ký/hủy đăng ký và gửi thử nghiệm.
    - Nâng cao: mọi phần cấu hình chưa có trang chuyên biệt, cùng trình chỉnh sửa JSON5 thô (trước đây là chế độ Nâng cao của trang Tổng quan).
    - Thiết lập mô hình (`/settings/model-setup`) là trang con của Nhà cung cấp mô hình, được mở từ phần đầu trang.
    - Tác nhân: một trang cài đặt (**Cài đặt → Tác nhân**, `/settings/agents`) với các thẻ riêng cho từng tác nhân (Tổng quan, Tệp, Công cụ, Skills, Kênh, Tự động hóa, Bộ nhớ). Thẻ Tổng quan chỉnh sửa danh tính của tác nhân — tên hiển thị, emoji và ảnh đại diện được giảm kích thước cũng như giới hạn dung lượng trong trình duyệt trước `agents.update`. Khi lưu, các trường danh tính đã cấu hình được lưu trữ và phản chiếu sang `IDENTITY.md` của không gian làm việc; các giá trị đã cấu hình được ưu tiên hơn các chỉnh sửa thủ công đối với cùng trường trong tệp.
    - Hồ sơ: một trang cài đặt hiển thị danh tính của tác nhân mặc định cùng số liệu thống kê sử dụng toàn thời gian — tổng số token trọn đời, ngày cao điểm, phiên dài nhất, chuỗi ngày hoạt động, bản đồ nhiệt token trong một năm, các công cụ hàng đầu và điểm nổi bật theo kênh (`usage.cost`, `sessions.usage`).
    - MCP có trang cài đặt chuyên biệt với các hàng máy chủ (phương thức truyền tải, trạng thái bật, tóm tắt OAuth/bộ lọc/song song), các điều khiển trực tiếp để thêm/bật/tắt/xóa, các lệnh vận hành thường dùng và trình chỉnh sửa cấu hình `mcp` theo phạm vi. Trang Plugin vẫn là nơi dành cho các trình kết nối một cú nhấp và tính năng khám phá.
    - Nhà cung cấp mô hình: một trang cài đặt liệt kê mọi nhà cung cấp mô hình đã cấu hình cùng biểu tượng thương hiệu, trạng thái xác thực (`models.authStatus`), tính khả dụng của mô hình (`models.list`), dữ liệu trực tiếp về gói/hạn mức/thanh toán khi nhà cung cấp báo cáo (`usage.status`) và chi tiêu phiên cục bộ trong 30 ngày qua (`sessions.usage`). Thao tác Làm mới đọc lại trạng thái thông tin xác thực và mức sử dụng của nhà cung cấp.
    - Kết nối: một trang cài đặt (trong **Kết nối**) quản lý liên kết Gateway riêng của bảng điều khiển — URL WebSocket, token Gateway, mật khẩu và khóa phiên mặc định — cùng ảnh chụp nhanh lần bắt tay gần nhất (trạng thái, thời gian hoạt động, khoảng nhịp, lần làm mới kênh gần nhất). Cổng đăng nhập ngoại tuyến xử lý trường hợp mất kết nối; trang này chỉnh sửa kết nối khi đang kết nối.
    - Áp dụng và khởi động lại kèm xác thực (`config.apply`), sau đó đánh thức phiên hoạt động gần nhất.
    - Các thao tác ghi có cơ chế bảo vệ bằng hàm băm cơ sở để tránh ghi đè các chỉnh sửa đồng thời.
    - Các thao tác ghi (`config.set`/`config.apply`/`config.patch`) kiểm tra trước việc phân giải SecretRef đang hoạt động cho các tham chiếu trong tải trọng cấu hình đã gửi; các tham chiếu đang hoạt động, đã gửi nhưng không thể phân giải sẽ bị từ chối trước khi ghi.
    - Khi lưu biểu mẫu, các phần giữ chỗ đã che giấu nhưng lỗi thời và không thể khôi phục từ cấu hình đã lưu sẽ bị loại bỏ, trong khi các giá trị đã che giấu vẫn ánh xạ tới bí mật đã lưu sẽ được giữ nguyên.
    - Lược đồ và phần kết xuất biểu mẫu đến từ `config.schema` / `config.schema.lookup`, bao gồm `title`/`description` của trường, các gợi ý giao diện người dùng phù hợp, phần tóm tắt phần tử con trực tiếp, siêu dữ liệu tài liệu trên các nút đối tượng lồng nhau/ký tự đại diện/mảng/thành phần, cùng lược đồ Plugin và kênh khi có. Trình chỉnh sửa JSON thô chỉ khả dụng khi ảnh chụp nhanh có thể khứ hồi dữ liệu thô một cách an toàn; nếu không, Giao diện điều khiển buộc sử dụng chế độ Biểu mẫu.
    - Tùy chọn "Đặt lại về bản đã lưu" của trình chỉnh sửa JSON thô giữ nguyên hình dạng do dữ liệu thô xác định (định dạng, chú thích, bố cục `$include`) thay vì kết xuất lại ảnh chụp nhanh đã làm phẳng, nhờ đó các chỉnh sửa bên ngoài vẫn tồn tại sau khi đặt lại nếu ảnh chụp nhanh có thể khứ hồi an toàn.
    - Các giá trị đối tượng SecretRef có cấu trúc được kết xuất chỉ đọc trong ô nhập văn bản của biểu mẫu để ngăn hỏng dữ liệu do vô tình chuyển đối tượng thành chuỗi.

  </Accordion>
  <Accordion title="Mức sử dụng">
    - Phân tích token và chi phí ước tính lấy từ phiên được tách biệt với việc tính phí của nhà cung cấp.
    - Các thẻ nhà cung cấp gọi `usage.status` và hiển thị trực tiếp tên gói, cửa sổ hạn mức, số dư, chi tiêu và ngân sách do các Plugin nhà cung cấp đã cấu hình báo cáo.
    - Lỗi truy vấn mức sử dụng của nhà cung cấp không chặn bảng điều khiển phiên/chi phí; các thẻ nhà cung cấp không khả dụng sẽ hiển thị trạng thái lỗi riêng.

  </Accordion>
  <Accordion title="Gỡ lỗi, nhật ký, cập nhật">
    - Gỡ lỗi: ảnh chụp nhanh trạng thái/tình trạng/mô hình, nhật ký sự kiện và các lệnh gọi RPC thủ công (`status`, `health`, `models.list`).
    - Nhật ký sự kiện bao gồm thời gian làm mới/gọi RPC của Giao diện điều khiển, thời gian kết xuất trò chuyện/cấu hình bị chậm và các mục về khả năng phản hồi của trình duyệt đối với khung hình hoạt ảnh dài hoặc tác vụ dài khi trình duyệt cung cấp các loại mục PerformanceObserver đó.
    - Nhật ký: theo dõi trực tiếp phần cuối của nhật ký tệp Gateway, có chức năng lọc/xuất (`logs.tail`).
    - Cập nhật: chạy cập nhật gói/git và khởi động lại (`update.run`) kèm báo cáo khởi động lại, sau đó thăm dò `update.status` sau khi kết nối lại để xác minh phiên bản Gateway đang chạy.

  </Accordion>
  <Accordion title="Ghi chú về bảng Tự động hóa">
    - Việc chọn một hàng sẽ mở chế độ xem chi tiết toàn trang với công tắc Hoạt động/Tạm dừng và Chạy ngay trong phần đầu trang (chạy nếu đến hạn, sao chép và xóa nằm trong trình đơn); thẻ Cài đặt chỉnh sửa trực tiếp tác vụ tự động hóa (lời nhắc, chi tiết, tần suất, các giá trị ghi đè nâng cao), còn thẻ Lịch sử chạy hiển thị các lần chạy của tác vụ tự động hóa đó.
    - Các tác vụ tự động hóa khởi đầu bên dưới bảng điền sẵn biểu mẫu tạo với lời nhắc và lịch biểu có thể chỉnh sửa.
    - Đối với tác vụ cô lập, phương thức phân phối mặc định là thông báo phần tóm tắt; chuyển sang không phân phối cho các lần chạy chỉ dùng nội bộ.
    - Các trường kênh/đích xuất hiện khi chọn thông báo.
    - Chế độ Webhook sử dụng `delivery.mode = "webhook"` với `delivery.to` được đặt thành URL Webhook HTTP(S) hợp lệ.
    - Đối với tác vụ trong phiên chính, có thể dùng chế độ phân phối qua Webhook hoặc không phân phối.
    - Các điều khiển chỉnh sửa nâng cao bao gồm xóa sau khi chạy, xóa giá trị ghi đè tác nhân, các tùy chọn cron chính xác/rải đều, giá trị ghi đè mô hình/suy luận của tác nhân và công tắc phân phối theo nỗ lực tối đa.
    - Xác thực biểu mẫu diễn ra trực tiếp với lỗi theo từng trường; các giá trị không hợp lệ vô hiệu hóa nút lưu cho đến khi được sửa.
    - Đặt `cron.webhookToken` để gửi một bearer token chuyên dụng; nếu bỏ qua, Webhook sẽ được gửi mà không có tiêu đề xác thực.
    - `cron.webhook` là cơ chế dự phòng cũ đã ngừng sử dụng và bị quy trình xác thực cấu hình hiện tại từ chối. Chạy `openclaw doctor --fix` để di chuyển các công việc đã lưu vẫn sử dụng `notify: true` sang phương thức phân phối Webhook hoặc hoàn tất rõ ràng cho từng công việc và xóa khóa cũ.

  </Accordion>
</AccordionGroup>

## Nhập bộ nhớ của trợ lý

Mở **Cài đặt** → **Nhập bộ nhớ** để đưa bộ nhớ Codex hoặc Claude Code cục bộ
vào một tác nhân OpenClaw. Gateway tự phát hiện bộ nhớ cục bộ được hỗ trợ trên
máy chủ của mình, vì vậy Giao diện điều khiển từ xa nhập dữ liệu từ máy tính Gateway thay vì
máy tính chạy trình duyệt.

1. Chọn tác nhân đích.
2. Xem lại các bộ sưu tập nguồn và tên tệp Markdown đã phát hiện. Nội dung tệp
   không được gửi trong phản hồi kế hoạch hoặc hiển thị trên trang.
3. Chọn các bộ sưu tập cần nhập rồi xác nhận. Thao tác Áp dụng dựng lại kế hoạch trước khi
   ghi để các lựa chọn lỗi thời bị từ chối an toàn.
4. Nếu tệp đã tồn tại, hãy bật **Thay thế dữ liệu nhập hiện có**, làm mới
   bản xem trước rồi xác nhận thay thế.

Codex chỉ nhập `MEMORY.md` và `memory_summary.md` đã hợp nhất của nó. Claude
Code nhập Markdown từ các thư mục bộ nhớ tự động của dự án và một
`autoMemoryDirectory` đã cấu hình; trang này không nhập phiên, cài đặt, hướng dẫn hoặc
thông tin xác thực. Các tệp được sao chép vào bên dưới `memory/imports/` trong
không gian làm việc đã chọn, nơi Plugin bộ nhớ đang hoạt động có thể lập chỉ mục chúng. Các nguồn
không bao giờ bị thay đổi.

Việc lập kế hoạch và áp dụng yêu cầu `operator.admin`. Mỗi lần áp dụng tạo một bản sao lưu
OpenClaw đã xác minh khi có trạng thái, ghi báo cáo di chuyển đã che giấu và giữ
bản sao lưu ở cấp mục trước khi thay thế các tệp đích hiện có. Xem
[Tổng quan về bộ nhớ](/vi/concepts/memory#import-from-coding-assistants) để biết đường dẫn và
hành vi truy hồi.

## Trang MCP

Trang MCP chuyên biệt là chế độ xem dành cho người vận hành đối với các máy chủ MCP do OpenClaw quản lý trong `mcp.servers`. Trang này không tự khởi động phương thức truyền tải MCP; hãy dùng nó để kiểm tra và chỉnh sửa cấu hình đã lưu, sau đó dùng `openclaw mcp doctor --probe` khi cần bằng chứng máy chủ trực tiếp.

Quy trình làm việc điển hình:

1. Mở **MCP** từ thanh bên.
2. Kiểm tra các thẻ tóm tắt để biết tổng số máy chủ, số máy chủ đã bật, dùng OAuth và được lọc.
3. Xem lại từng hàng máy chủ về phương thức truyền tải, trạng thái bật, xác thực, bộ lọc, thời gian chờ và gợi ý lệnh.
4. Thêm, bật, tắt hoặc xóa máy chủ trực tiếp trên trang MCP. Dùng trang **Plugin** cho các trình kết nối một cú nhấp và tính năng khám phá.
5. Chỉnh sửa phần cấu hình `mcp` theo phạm vi cho định nghĩa máy chủ, tiêu đề, đường dẫn TLS/mTLS, siêu dữ liệu OAuth, bộ lọc công cụ và siêu dữ liệu ánh xạ Codex.
6. Dùng **Lưu** để ghi cấu hình hoặc **Lưu & Phát hành** khi Gateway đang chạy cần áp dụng cấu hình đã thay đổi.
7. Chạy `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` hoặc `openclaw mcp reload` từ thiết bị đầu cuối để chẩn đoán tĩnh, kiểm chứng trực tiếp hoặc loại bỏ môi trường chạy đã lưu đệm.

Trang này che giấu các giá trị dạng URL chứa thông tin xác thực trước khi kết xuất và đặt tên máy chủ trong dấu nháy ở các đoạn lệnh để lệnh đã sao chép vẫn hoạt động với khoảng trắng hoặc siêu ký tự shell. Tài liệu tham khảo đầy đủ về CLI và cấu hình: [MCP](/vi/cli/mcp).

## Thẻ Hoạt động

Thẻ Hoạt động nằm trong **Cài đặt › Hệ thống**, cạnh Nhật ký và Gỡ lỗi. Đây là trình quan sát tạm thời, cục bộ trong trình duyệt cho hoạt động công cụ trực tiếp, được dẫn xuất từ cùng luồng sự kiện công cụ / `session.tool` của Gateway dùng để vận hành các thẻ công cụ Trò chuyện. Nó không thêm một họ sự kiện Gateway, điểm cuối, kho lưu trữ hoạt động bền vững, nguồn cấp số liệu hay luồng quan sát bên ngoài nào khác.

Các mục Hoạt động chỉ giữ phần tóm tắt đã làm sạch và bản xem trước đầu ra đã che giấu, cắt ngắn. Giá trị đối số công cụ không được lưu trong trạng thái Hoạt động; giao diện người dùng cho biết các đối số bị ẩn và chỉ ghi số lượng trường đối số. Danh sách trong bộ nhớ đi theo thẻ trình duyệt hiện tại, tồn tại khi điều hướng trong Giao diện điều khiển và được đặt lại khi tải lại trang, chuyển phiên hoặc chọn **Xóa**.

## Thiết bị đầu cuối của người vận hành

Thiết bị đầu cuối có thể gắn vào giao diện dành cho người vận hành bị tắt theo mặc định. Để bật, hãy đặt `gateway.terminal.enabled: true` và khởi động lại Gateway. Thiết bị đầu cuối yêu cầu kết nối `operator.admin` và mở một PTY máy chủ trong không gian làm việc của tác nhân đang hoạt động. Các thẻ mới đi theo tác nhân trò chuyện hiện được chọn.

<Warning>
Terminal là shell máy chủ không bị giới hạn và kế thừa môi trường tiến trình Gateway. Chỉ bật terminal cho các đợt triển khai do người vận hành đáng tin cậy quản lý. OpenClaw từ chối các phiên terminal đối với agent có `sandbox.mode: "all"`; việc chuyển một agent đang hoạt động sang chế độ đó sẽ đóng các phiên terminal hiện có và đang thực thi của agent đó.
</Warning>

Dùng **Ctrl + backtick** để bật hoặc tắt bảng neo. Bố cục hỗ trợ neo ở dưới cùng và bên phải, tự thay đổi kích thước theo khung nhìn của trình duyệt và duy trì nhiều tab shell. Xem [cấu hình Gateway](/vi/gateway/configuration-reference#gateway) để biết `gateway.terminal.enabled` và tùy chọn ghi đè `gateway.terminal.shell`.

Các agent không chạy trong sandbox và được chủ sở hữu cấp quyền có thể dùng công cụ `terminal` cho công việc kéo dài hoặc có tính tương tác mà người vận hành cần theo dõi. Mỗi lần gọi công cụ có thể mở, đọc, ghi, thay đổi kích thước, đóng hoặc liệt kê các PTY gateway thuộc riêng agent đó. Theo mặc định, phiên mới sẽ mở một tab Control UI cùng đính kèm để agent và người vận hành chia sẻ đầu ra, đồng thời cả hai đều có thể nhập hoặc thay đổi kích thước. Quyền truy cập của agent được giới hạn chính xác theo phiên: agent không thể đọc hoặc điều khiển terminal do người vận hành tạo hay terminal được mở bởi một phiên agent khác.

Kéo một hoặc nhiều tệp vào terminal đang hoạt động hoặc dùng nút kẹp giấy để chọn tệp. OpenClaw đưa từng tệp vào vùng tạm trên máy sở hữu PTY và dán các đường dẫn tuyệt đối đã được trích dẫn an toàn cho shell tại con trỏ; hệ thống không bao giờ nhấn Enter hoặc thực thi nội dung nhập. Một chỉ báo lô thu gọn hiển thị tệp hiện tại và số lượng đã hoàn tất. Thao tác hủy sẽ dừng phần còn lại của lô mà không dán đường dẫn; một lần truyền thất bại vẫn hiển thị để bạn có thể thử lại từ tệp đó mà không cần tải lên lại các tệp đã hoàn tất. Hình ảnh, PDF, tệp lưu trữ và các loại tệp khác được chấp nhận với dung lượng tối đa 16 MiB mỗi tệp. Các tệp tạm sử dụng một thư mục tạm riêng của hệ thống trên máy chủ POSIX (chế độ thư mục `0700`, chế độ tệp `0600`) hoặc một thư mục nằm trong ranh giới ACL của hồ sơ người dùng trên Windows, cùng bộ hẹn giờ dọn dẹp sau 24 giờ; vì vậy, hãy di chuyển hoặc sao chép mọi nội dung cần giữ lại.

Tính năng chèn đường dẫn hỗ trợ PowerShell, `cmd.exe` và các shell POSIX được nhận dạng (`sh`, Bash, Dash, Ash, Ksh, Zsh và Fish), bao gồm Git Bash trên Windows. Các shell ghi đè khác bị từ chối vì không thể suy luận quy tắc trích dẫn của chúng một cách an toàn; hãy chạy Gateway bên trong WSL để có terminal WSL gốc và đường dẫn tải lên Linux. Các đường dẫn `cmd.exe` chứa `%` hoặc `!` cũng bị từ chối vì shell đó mở rộng các ký tự này ngay cả bên trong dấu ngoặc kép.

Các phiên Codex và Claude Code được phát hiện trong thanh bên phiên có thể mở bằng CLI gốc ngay trong cùng bảng terminal. Trong **Settings › Chat**, đặt **Open Codex/Claude threads in** thành **Terminal** để thao tác nhấp thông thường vào một hàng sẽ mở `codex resume` hoặc `claude --resume`; trình xem OpenClaw chỉ đọc vẫn là mặc định. Menu khi nhấp chuột phải hoặc menu dấu ba chấm của một hàng luôn cung cấp cả hai lựa chọn, và tiêu đề trình xem có **Open in terminal** khi phiên đó đủ điều kiện.

Điều kiện hợp lệ được xác định theo từng phiên và từng máy chủ. Các phiên cục bộ của Gateway khởi chạy lệnh tiếp tục do nhà cung cấp sở hữu trên máy chủ Gateway. Các phiên của node đã ghép nối khởi chạy một lệnh nhà cung cấp trong danh sách cho phép trên node sở hữu và chỉ chuyển tiếp đầu ra, đầu vào cùng các sự kiện thay đổi kích thước của PTY đó; cơ chế này không làm lộ shell node tổng quát hoặc chấp nhận các lệnh do trình duyệt cung cấp. Việc tải tệp lên sử dụng lệnh node `terminal.upload` riêng biệt có giới hạn kích thước và vẫn được ràng buộc với phiên terminal đã mở. Phê duyệt nâng cấp ghép nối node khi lệnh đó xuất hiện lần đầu. Các node không quảng bá lệnh tiếp tục terminal tương ứng, bao gồm các cầu nối worker nhúng không hỗ trợ truyền song công, vẫn cung cấp trình xem và hiển thị rằng không thể mở terminal; các node cũ hơn vẫn có thể chạy terminal nhưng không thể nhận tệp được kéo vào.

Các phiên thuộc sở hữu kết nối vẫn tồn tại sau khi ngắt kết nối: thao tác tải lại trang, máy tính xách tay chuyển sang chế độ ngủ hoặc sự cố mạng chập chờn sẽ tách phiên trên Gateway thay vì kết thúc phiên, và cùng tab trình duyệt đó sẽ đính kèm lại khi kết nối được khôi phục, đồng thời phát lại đầu ra gần đây. Các phiên thuộc sở hữu kết nối đã tách sẽ bị kết thúc sau `gateway.terminal.detachedSessionTimeoutSeconds` (mặc định 300 giây; `0` khôi phục hành vi kết thúc khi ngắt kết nối). Việc đính kèm một trong các phiên này vẫn hoạt động theo kiểu tiếp quản của tmux.

Các phiên thuộc sở hữu của agent không bị ràng buộc với kết nối trình duyệt. `terminal.attach` thêm từng trình duyệt làm trình xem mà không tiếp quản quyền sở hữu, và việc đóng tab trình xem chỉ tách trình duyệt đó. PTY vẫn tồn tại cho đến khi agent sở hữu đóng nó, tiến trình của nó thoát, chính sách vô hiệu hóa nó hoặc Gateway tắt. `terminal.list` đánh dấu từng mục là thuộc sở hữu kết nối hoặc agent, và `terminal.text` cho phép một kết nối quản trị đọc đầu ra văn bản thuần gần đây mà không cần đính kèm.

Terminal cũng có sẵn dưới dạng tài liệu toàn màn hình chỉ chứa terminal tại `/?view=terminal`. Các ứng dụng iOS và Android nhúng trang này vào màn hình Terminal, tái sử dụng thông tin xác thực gateway đã lưu; tính khả dụng tuân theo cùng cổng `gateway.terminal.enabled` và `operator.admin`, và trang sẽ hiển thị thông báo khi Gateway được kết nối không cung cấp terminal.

## Bảng trình duyệt

Control UI tích hợp một bảng trình duyệt có thể neo, hiển thị trình duyệt do Gateway điều khiển (cũng là trình duyệt mà các agent điều khiển thông qua [công cụ trình duyệt](/vi/tools/browser-control)) trong bất kỳ trình duyệt web thông thường nào — không cần webview gốc. Bảng xuất hiện khi Gateway được kết nối quảng bá `browser.request` cho một kết nối `operator.admin`; nút hình quả địa cầu trong thanh không gian làm việc của luồng sẽ bật hoặc tắt bảng này. Bảng hiển thị ảnh chụp trực tiếp của trang cùng các tab, thanh URL có thể chỉnh sửa, các nút quay lại/tiến tới/tải lại và mở trong trình duyệt của bạn, có thể neo bên phải hoặc phía dưới, đồng thời chuyển tiếp thao tác nhấp, cuộn bánh xe và nhập văn bản cơ bản đến trang từ xa.

Hai chế độ chụp đóng gói ngữ cảnh trang cho agent:

- **Chú thích (bút chì)**: vẽ đánh dấu tự do lên trang. **Gửi đến cuộc trò chuyện** kết hợp các nét vẽ vào ảnh chụp màn hình, đính kèm hình ảnh vào trình soạn thảo cuộc trò chuyện đang hoạt động và điền sẵn lời nhắc mô tả URL, tiêu đề của trang cùng từng vùng được đánh dấu để agent biết chính xác nội dung bạn đã khoanh.
- **Kiểm tra (con trỏ)**: di chuột để xem phần tử bên dưới con trỏ (bộ chọn, tên hỗ trợ tiếp cận, vai trò, kích thước); nhấp để gửi thông tin chi tiết của phần tử đó cùng ảnh chụp màn hình được tô sáng qua cùng luồng trình soạn thảo. Chế độ Kiểm tra, cuộn bánh xe và quay lại/tiến tới cần `browser.evaluateEnabled` (được bật theo mặc định).

Ứng dụng macOS giữ thanh bên trình duyệt liên kết gốc cho các liên kết được nhấp trong bảng điều khiển; bảng trình duyệt cũng hoạt động tại đó và là cách chú thích trang trên mọi nền tảng khác.

## Hành vi trò chuyện

<AccordionGroup>
  <Accordion title="Send and history semantics">
    - `chat.send` là **không chặn**: phương thức này xác nhận ngay bằng `{ runId, status: "started" }` và phản hồi được truyền phát qua các sự kiện `chat`. Các ứng dụng Control UI đáng tin cậy cũng có thể nhận siêu dữ liệu thời gian ACK tùy chọn để chẩn đoán cục bộ.
    - Tính năng tải lên trong Chat chấp nhận hình ảnh cùng các tệp không phải video. Hình ảnh giữ nguyên đường dẫn hình ảnh gốc; các tệp khác được lưu dưới dạng phương tiện được quản lý và hiển thị trong lịch sử dưới dạng liên kết tệp đính kèm.
    - Gửi lại với cùng `idempotencyKey` sẽ trả về `{ status: "in_flight" }` khi đang chạy và `{ status: "ok" }` sau khi hoàn tất.
    - Các phản hồi `chat.history` được giới hạn kích thước để bảo đảm an toàn cho giao diện người dùng. Khi các mục bản ghi hội thoại quá lớn, Gateway có thể cắt bớt các trường văn bản dài, bỏ qua các khối siêu dữ liệu nặng và thay thế các tin nhắn quá khổ bằng một phần giữ chỗ (`[chat.history omitted: message too large]`).
    - Khi một tin nhắn trợ lý hiển thị bị cắt bớt trong `chat.history`, trình đọc bên cạnh có thể tìm nạp mục bản ghi hội thoại đầy đủ đã được chuẩn hóa để hiển thị theo yêu cầu thông qua `chat.message.get` bằng `sessionKey`, `agentId` đang hoạt động khi cần và `messageId` của bản ghi hội thoại. Nếu Gateway vẫn không thể trả về thêm nội dung, trình đọc sẽ hiển thị rõ trạng thái không khả dụng thay vì âm thầm lặp lại bản xem trước đã bị cắt bớt.
    - Hình ảnh do trợ lý tạo được lưu bền vững dưới dạng tham chiếu phương tiện được quản lý và phân phối lại qua các URL phương tiện Gateway có xác thực, vì vậy việc tải lại không phụ thuộc vào các tải trọng hình ảnh base64 thô còn tồn tại trong phản hồi lịch sử trò chuyện.
    - Khi kết xuất `chat.history`, Control UI loại bỏ khỏi văn bản trợ lý hiển thị các thẻ chỉ thị nội tuyến chỉ dùng cho hiển thị (ví dụ `[[reply_to_*]]` và `[[audio_as_voice]]`), các tải trọng XML lệnh gọi công cụ ở dạng văn bản thuần túy (bao gồm `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` và các khối lệnh gọi công cụ bị cắt bớt), cũng như các token điều khiển mô hình ASCII/toàn chiều bị rò rỉ. Giao diện bỏ qua các mục trợ lý có toàn bộ văn bản hiển thị chỉ là token im lặng chính xác `NO_REPLY` / `no_reply` hoặc token xác nhận Heartbeat `HEARTBEAT_OK`.
    - Trong lúc một lượt gửi đang hoạt động và khi làm mới lịch sử lần cuối, chế độ xem trò chuyện vẫn hiển thị các tin nhắn người dùng/trợ lý lạc quan cục bộ nếu `chat.history` tạm thời trả về một ảnh chụp nhanh cũ hơn; bản ghi hội thoại chính tắc sẽ thay thế các tin nhắn cục bộ đó sau khi lịch sử Gateway bắt kịp.
    - Các sự kiện `chat` trực tiếp là trạng thái phân phối, còn `chat.history` được dựng lại từ bản ghi hội thoại phiên bền vững. Sau các sự kiện hoàn tất công cụ, Control UI tải lại lịch sử và chỉ hợp nhất một phần đuôi lạc quan nhỏ; ranh giới bản ghi hội thoại được ghi lại trong [WebChat](/vi/web/webchat).
    - `chat.inject` nối thêm một ghi chú của trợ lý vào bản ghi hội thoại phiên và phát một sự kiện `chat` cho các bản cập nhật chỉ dành cho giao diện người dùng (không chạy tác nhân, không phân phối qua kênh).
    - Thanh bên liệt kê mọi phiên đang hoạt động đã tải theo phần tác nhân và các nhóm Đã ghim/kênh/công việc/tùy chỉnh/Trò chuyện, với một thao tác Phiên mới duy nhất để mở hộp thoại bản nháp. Việc mở một hàng hiển thị chỉ di chuyển phần tô sáng. Có thể thả phiên vào Đã ghim để ghim, hoặc vào một nhóm tùy chỉnh hay Trò chuyện để di chuyển; các nhóm tùy chỉnh có thể thu gọn và sắp xếp lại bằng thao tác kéo, tên và thứ tự nhóm được đồng bộ qua Gateway, còn trạng thái thu gọn được lưu trong trình duyệt. Một phiên bảng điều khiển mới sẽ nhận bất đồng bộ một tiêu đề ngắn gọn được tạo từ tin nhắn không phải lệnh đầu tiên; tên được đặt rõ ràng sẽ không bao giờ bị thay thế. Đặt `agents.defaults.utilityModel` (hoặc `agents.list[].utilityModel`) để định tuyến lệnh gọi mô hình riêng biệt này đến một mô hình có chi phí thấp hơn. Việc mở rộng phần của tác nhân khác cho phép duyệt các phiên của tác nhân đó mà không rời khỏi cuộc trò chuyện đang mở.
    - Tìm kiếm luồng nằm trong bảng lệnh (⌘K hoặc trường Tìm kiếm ở đầu thanh bên): việc nhập truy vấn sẽ duyệt qua một số lượng hữu hạn các trang khớp trên nhiều tác nhân, lọc các hàng con/Cron nội bộ và liệt kê các kết quả hiển thị bên cạnh các lệnh điều hướng. Trang Luồng vẫn giữ danh sách đầy đủ có thể tìm kiếm cùng các bộ lọc.
    - Mỗi hàng trên thanh bên giữ quyền truy cập ghim trực tiếp cùng một menu ngữ cảnh đầy đủ cho trạng thái chưa đọc, đổi tên, phân nhánh, nhóm, lưu trữ và xóa. Các hàng được chọn nhiều mục (Cmd/Ctrl-nhấp, Shift-nhấp để chọn phạm vi) có một menu hàng loạt bao gồm trạng thái chưa đọc, nhóm, lưu trữ và xóa; thao tác lưu trữ/xóa hàng loạt vẫn bị vô hiệu hóa trừ khi mọi phiên đã chọn đều có thể lưu trữ. Không thể lưu trữ một lượt chạy đang hoạt động và phiên chính của tác nhân. Khi lưu trữ hoặc xóa phiên đang được chọn, Chat sẽ chuyển về phiên chính của tác nhân đó.
    - Trong ứng dụng macOS, biểu tượng OpenClaw sử dụng dải thanh tiêu đề gốc vốn để trống cạnh các nút điều khiển cửa sổ thay vì chiếm một hàng trên thanh bên.
    - Ở độ rộng màn hình máy tính, các nút điều khiển trò chuyện nằm trên một hàng gọn và thu gọn khi cuộn xuống bản ghi hội thoại; cuộn lên, trở về đầu hoặc đến cuối sẽ khôi phục các nút điều khiển.
    - Các tin nhắn liên tiếp trùng lặp chỉ chứa văn bản được kết xuất thành một bong bóng với huy hiệu số lượng. Các tin nhắn có hình ảnh, tệp đính kèm, đầu ra công cụ hoặc bản xem trước canvas sẽ không bị thu gộp.
    - Các bong bóng tin nhắn người dùng có các thao tác với bản ghi hội thoại: nút tua lại khi di chuột (cửa sổ bật lên xác nhận với tùy chọn "Don't ask again") cùng với **Tua lại đến đây** và **Phân nhánh từ đây** khi nhấp chuột phải. Tua lại trỏ phiên về trạng thái ngay trước tin nhắn đó và đưa văn bản của tin nhắn trở lại trình soạn thảo để chỉnh sửa rồi gửi lại (`sessions.rewind`, `operator.admin`); phân nhánh tạo một phiên mới từ tiền tố đường dẫn đang hoạt động trước tin nhắn, mở phiên đó và điền sẵn cùng văn bản vào trình soạn thảo (`sessions.fork`, `operator.write`). Cả hai thao tác đều bị vô hiệu hóa kèm chú giải công cụ giải thích khi tác nhân đang làm việc, chỉ áp dụng cho các tin nhắn người dùng đã được lưu bền vững và bị từ chối đối với các phiên có cuộc hội thoại do một bộ khung tác nhân bên ngoài sở hữu. Tua lại chỉ di chuyển ngữ cảnh trò chuyện — các tệp và tác dụng phụ khác của công cụ không được hoàn nguyên — và bản ghi hội thoại trước khi tua lại vẫn được bảo tồn trong kho phiên chỉ cho phép nối thêm. Khi kho đó chứa nhiều nhánh bản ghi hội thoại, thanh tiêu đề trò chuyện hiển thị menu nhánh với tin nhắn mới nhất, số lượng tin nhắn và độ gần đây của từng nhánh; việc chọn một nhánh không hoạt động sẽ chuyển phiên hiện tại trở lại đường dẫn được bảo tồn đó (`sessions.branches.list`, `operator.read`; `sessions.branches.switch`, `operator.admin`). Tính năng chuyển nhánh cũng không khả dụng khi tác nhân đang làm việc, và việc chọn nhánh vốn đã hoạt động là lỗi không thực hiện thao tác có kiểu tại ranh giới RPC. Thao tác ẩn riêng biệt trên bong bóng người dùng chỉ ẩn tin nhắn trong trình duyệt hiện tại; tin nhắn vẫn nằm trong bản ghi hội thoại và tác nhân vẫn nhìn thấy nó.
    - Khi thư mục làm việc của một phiên nằm trên nhánh không mặc định của kho lưu trữ GitHub, chế độ xem trò chuyện ghim các thẻ pull request phía trên trình soạn thảo: số PR, kho lưu trữ, nhánh, số lượng thay đổi, một nhãn CI và trạng thái bản nháp/đã hợp nhất/đã đóng, mỗi mục đều liên kết đến PR. Hàng hiển thị tối đa hai thẻ — các PR trực tiếp (đang mở/bản nháp) trước — và nút "Hiển thị thêm" sẽ hiển thị lịch sử đã hợp nhất/đã đóng đang bị thu gọn. Nhãn CI mở một cửa sổ bật lên nhỏ để giám sát CI với số lượng kiểm tra đã đạt/thất bại/đang chạy/đã bỏ qua và một liên kết đến trang kiểm tra của PR. Việc phát hiện chạy phía máy chủ thông qua `controlUi.sessionPullRequests`, sử dụng lại `GH_TOKEN`/`GITHUB_TOKEN` của Gateway khi được đặt. Khi đạt giới hạn tốc độ API GitHub, các thẻ giữ trạng thái đã biết gần nhất và hiển thị cảnh báo rằng trạng thái có thể đã lỗi thời; việc đóng một thẻ sẽ ẩn thẻ đó cho phiên ấy trong hồ sơ trình duyệt hiện tại. Trước khi có bất kỳ PR nào, hàng sẽ hiển thị chính nhánh — kho lưu trữ, tên nhánh và kích thước +/− của phần thay đổi so với cơ sở hợp nhất của nhánh mặc định (công việc đã commit và chưa commit). Khi nhánh đã đẩy có các commit để so sánh, hàng sẽ thêm nút Tạo PR để mở trang tạo pull request mới của GitHub; trước đó, một phiên có các tệp đã thay đổi (đã commit, chưa commit hoặc chưa được theo dõi) vẫn có hàng này nhưng không có nút. Hàng sẽ tự ẩn khi có một PR đang mở hoặc ở dạng bản nháp. Hàng nhánh chỉ lấy dữ liệu từ git cục bộ, vì vậy vẫn khả dụng khi GitHub bị giới hạn tốc độ và mang cùng cảnh báo trạng thái lỗi thời, do không thể tin cậy kết quả "không tìm thấy PR" cho đến khi giới hạn được đặt lại.
    - Bảng thay đổi của phiên hiển thị những gì thư mục làm việc của phiên thực sự đã thay đổi: nút nhánh trên thanh không gian làm việc hoặc thanh tiêu đề trò chuyện mở bảng chi tiết với phần thay đổi theo từng tệp của công việc trên nhánh, chưa commit và chưa được theo dõi so với cơ sở hợp nhất nhánh mặc định của thư mục làm việc — dấu chấm trạng thái, mũi tên đổi tên, số lượng +/− theo từng tệp, các tệp có thể thu gọn và các dấu "N dòng không thay đổi" giữa các đoạn thay đổi. Các phần thay đổi được tính toán phía máy chủ thông qua phương thức Gateway `sessions.diff` (phạm vi `operator.read`); các tệp nhị phân và quá khổ được hạ cấp thành các mục chỉ có số liệu thống kê, và nút chỉ xuất hiện khi Gateway được kết nối quảng bá `sessions.diff`.
    - Mỗi khung Chat đều có một thanh tiêu đề. Nhấp vào tiêu đề phiên để đổi tên; thẻ không gian làm việc sao chép đường dẫn thư mục làm việc hoặc nhánh và có thể hiển thị các không gian làm việc Gateway cục bộ trong trình quản lý tệp của máy chủ. Các phiên từ xa và phiên Node thực thi vẫn giữ các thao tác sao chép nhưng ẩn thao tác hiển thị.
    - Thanh không gian làm việc của luồng trong mỗi khung Chat liệt kê các tệp luồng, tệp dự án và hiện vật. Theo mặc định, thanh được neo vào cạnh phải của khung; kéo tiêu đề của thanh (hoặc dùng nút neo) để chuyển xuống dưới, và lựa chọn này được lưu trong hồ sơ trình duyệt hiện tại. Thanh đã thu gọn hoàn toàn không chiếm không gian: mở lại bằng ⇧⌘B hoặc nút bật/tắt tệp trên thanh tiêu đề, nút này có huy hiệu số lượng tệp đã thay đổi. Bảng chi tiết riêng dành cho tệp, công cụ và Canvas không bị ảnh hưởng.
    - Việc nhấp vào tham chiếu tệp trong trò chuyện, đường dẫn tệp trong thẻ công cụ đọc/chỉnh sửa/ghi đã mở rộng hoặc một hàng tệp trong thanh không gian làm việc sẽ mở bảng chi tiết tệp: chế độ xem mã dựa trên CodeMirror với tô sáng cú pháp, số dòng, chuyển đến dòng, tìm kiếm trong tệp, thao tác sao chép và menu mở trong trình soạn thảo bên ngoài. Khi Gateway quảng bá `sessions.files.set` cho một kết nối `operator.admin`, bảng sẽ thêm chế độ Chỉnh sửa với tính năng theo dõi thay đổi chưa lưu và lưu bằng Cmd/Ctrl-S; các bản nháp chưa lưu vẫn tồn tại qua thao tác điều hướng tệp, bảng và phiên trong thẻ trình duyệt hiện tại cho đến khi được lưu hoặc loại bỏ rõ ràng. Các lần lưu sử dụng cơ chế so sánh và hoán đổi dựa trên hàm băm nội dung do `sessions.files.get` trả về: nếu tệp đã thay đổi trên đĩa kể từ khi được tải (ví dụ do tác nhân tiếp tục làm việc), bảng sẽ hiển thị thông báo xung đột với các thao tác Reload (lấy nội dung mới nhất) và Overwrite (giữ bản chỉnh sửa cục bộ). Các thao tác ghi đi qua cùng các cơ chế bảo vệ không gian làm việc an toàn cho hệ thống tệp như thao tác đọc — giới hạn đường dẫn, từ chối liên kết tượng trưng/liên kết cứng và giới hạn UTF-8 256 KB — đồng thời chỉ ghi đè các tệp hiện có; trình soạn thảo không bao giờ tạo hoặc xóa tệp.
    - Thanh tác vụ nền trong mỗi khung Chat liệt kê các tác vụ nền và tác nhân con của tác nhân hiện tại (`tasks.list` được giới hạn phạm vi theo tác nhân, duy trì cập nhật trực tiếp bằng các sự kiện `task`): công việc đang chạy hiển thị bộ đếm thời gian đã trôi qua trực tiếp, số lần sử dụng công cụ, công cụ hiện đang được sử dụng và nút điều khiển dừng; phần hoàn tất có thể thu gọn bổ sung thời lượng chạy; và liên kết Xem bản ghi hội thoại mở phiên con của tác vụ trong khung. Mở thanh bằng nút bật/tắt hoạt động trên thanh tiêu đề; ảnh chụp nhanh tác vụ được tải sớm, vì vậy nút này hiển thị huy hiệu số lượng đang chạy mà không cần mở thanh trước. Trang Tác vụ vẫn là sổ cái đầy đủ trên tất cả tác nhân.
    - Thanh không gian làm việc, thanh tác vụ nền và bảng chi tiết thích ứng theo chiều rộng riêng của từng khung thay vì theo cửa sổ: trong khung hẹp hoặc cửa sổ nhỏ gọn, cả hai thanh đều hiển thị dưới dạng các dải phía dưới (các nút điều khiển neo bên bị ẩn cho đến khi khung rộng hơn; thanh không gian làm việc được ưu tiên chiếm vị trí bên khi chỉ đủ chỗ cho một cột), còn bảng chi tiết xếp chồng bên dưới luồng với tay nắm thay đổi kích thước theo chiều ngang thay vì dùng chung hàng với luồng. Các vùng hiển thị có kích thước điện thoại vẫn mở bảng chi tiết toàn màn hình.
    - Các bộ chọn mô hình và chế độ suy luận trong tiêu đề trò chuyện cập nhật ngay phiên đang hoạt động thông qua `sessions.patch`; đây là các thiết lập ghi đè phiên được duy trì lâu dài, không phải tùy chọn gửi chỉ áp dụng cho một lượt.
    - **Chế độ xem chia đôi:** mở chế độ này từ thanh tiêu đề trò chuyện (bên cạnh các nút bật/tắt phần khác biệt của luồng, tác vụ nền và tệp của luồng), sau đó chia ngăn đang hoạt động sang phải hoặc xuống dưới thành số lượng ngăn vừa với màn hình. Mỗi ngăn có luồng, bản ghi hội thoại, trình soạn thảo và luồng công cụ riêng.
    - Các agent có công cụ `screen` có thể yêu cầu những thay đổi tương tự đối với ngăn, thanh bên, terminal, trình duyệt, tiêu điểm và thao tác điều hướng khi một Control UI có khả năng tương ứng đang được kết nối. Giao thức v1 áp dụng lệnh cho mọi Control UI có khả năng tương ứng đang được kết nối; xem [Màn hình](/vi/tools/screen).
    - Kéo một phiên từ thanh bên vào khu vực trò chuyện để mở phiên đó trong một ngăn. Bản xem trước vị trí thả dạng động lướt giữa các vùng và ghi nhãn kết quả — "Chia đôi" trên đúng nửa mà ngăn mới sẽ chiếm, "Mở tại đây" trên toàn bộ một ngăn — và thao tác thả cũng hoạt động trong chế độ một ngăn.
    - Ngăn chia đôi đang hoạt động quyết định mục được chọn trên thanh bên và URL. Thanh tiêu đề của ngăn bổ sung các nút điều khiển chia và đóng; các đường phân cách cho phép đổi kích thước cột và các ngăn xếp chồng, đồng thời trình duyệt lưu bố cục cục bộ qua các lần tải lại.
    - Trên màn hình hẹp, chế độ xem chia đôi giữ nguyên bố cục nhưng chỉ hiển thị ngăn đang hoạt động, bao gồm cả tiêu đề của ngăn với nút điều khiển đóng.
    - Nếu bạn gửi tin nhắn trong khi thay đổi từ bộ chọn mô hình cho cùng phiên vẫn đang được lưu, trình soạn thảo sẽ chờ bản vá phiên đó hoàn tất trước khi gọi `chat.send` để tin nhắn sử dụng mô hình đã chọn.
    - Nhập `/new` sẽ tạo và chuyển sang cùng một phiên dashboard mới như New Chat, trừ khi `session.dmScope: "main"` được cấu hình và phiên cha hiện tại là phiên chính của agent; khi đó, thao tác này đặt lại phiên chính ngay tại chỗ. Nhập `/reset` vẫn sử dụng thao tác đặt lại ngay tại chỗ tường minh của Gateway cho phiên hiện tại.
    - Bộ chọn mô hình trong trò chuyện yêu cầu chế độ xem mô hình đã cấu hình của Gateway. Nếu `agents.defaults.modelPolicy.allow` không rỗng, chính sách đó sẽ điều khiển bộ chọn, bao gồm các mục `provider/*` giúp danh mục theo phạm vi nhà cung cấp luôn được cập nhật động. Nếu không, bộ chọn sẽ hiển thị các mục đã cấu hình cùng những nhà cung cấp có thông tin xác thực sử dụng được; bí danh và cài đặt trong `agents.defaults.models` không giới hạn bộ chọn. Danh mục đầy đủ vẫn có thể truy cập qua RPC gỡ lỗi `models.list` với `view: "all"`.
    - Khi báo cáo mới về mức sử dụng phiên của Gateway có chứa số token ngữ cảnh hiện tại, thanh công cụ của trình soạn thảo trò chuyện sẽ hiển thị một vòng tròn nhỏ thể hiện tỷ lệ phần trăm ngữ cảnh đã sử dụng. Mở vòng tròn để xem cửa sổ ngữ cảnh hiện tại, số token của lượt chạy gần nhất và tổng chi phí ước tính, danh tính nhà cung cấp/mô hình, cũng như bảng phân tích chi phí đầu vào/đầu ra/bộ nhớ đệm của phản hồi mới nhất từ nhà cung cấp khi được báo cáo. Vòng tròn chuyển sang kiểu cảnh báo khi áp lực ngữ cảnh cao và ở các mức Compaction được khuyến nghị, hiển thị một nút nhỏ gọn để chạy quy trình Compaction phiên thông thường. Các ảnh chụp nhanh token đã cũ sẽ bị ẩn cho đến khi Gateway báo cáo lại dữ liệu sử dụng mới.

  </Accordion>
  <Accordion title="Chế độ trò chuyện (thời gian thực trên trình duyệt)">
    Chế độ trò chuyện sử dụng một nhà cung cấp giọng nói thời gian thực đã đăng ký. Cấu hình OpenAI bằng `talk.realtime.provider: "openai"` cùng với một hồ sơ khóa API `openai`, `talk.realtime.providers.openai.apiKey` hoặc `OPENAI_API_KEY`. OpenAI Realtime sử dụng Platform API công khai và yêu cầu khóa Platform API; thông tin đăng nhập OAuth của Codex không đáp ứng giao diện này. Cấu hình Google bằng `talk.realtime.provider: "google"` cùng với `talk.realtime.providers.google.apiKey`. Trình duyệt không bao giờ nhận khóa API tiêu chuẩn của nhà cung cấp: OpenAI nhận một bí mật máy khách Realtime tạm thời cho WebRTC, còn Google Live nhận một mã thông báo xác thực Live API dùng một lần và bị giới hạn cho phiên WebSocket trên trình duyệt, trong đó các chỉ dẫn và khai báo công cụ được Gateway khóa vào mã thông báo. Các nhà cung cấp chỉ cung cấp cầu nối thời gian thực phía backend sẽ chạy qua phương thức truyền chuyển tiếp của Gateway, nhờ đó thông tin xác thực và socket của nhà cung cấp vẫn ở phía máy chủ trong khi âm thanh của trình duyệt được truyền qua các RPC Gateway đã xác thực. Lời nhắc của phiên Realtime được Gateway tập hợp; `talk.client.create` không chấp nhận các chỉ dẫn ghi đè do bên gọi cung cấp.

    Các giá trị mặc định lâu dài cho nhà cung cấp, mô hình, giọng nói, phương thức truyền, mức độ suy luận, ngưỡng VAD chính xác, thời lượng im lặng và khoảng đệm tiền tố nằm trong **Settings → Communications → Talk**; việc thay đổi chúng yêu cầu quyền truy cập `operator.admin`. Việc cấu hình chuyển tiếp Gateway sẽ buộc sử dụng đường dẫn chuyển tiếp phía backend; cấu hình WebRTC giữ phiên thuộc quyền sở hữu của máy khách và sẽ thất bại thay vì âm thầm chuyển sang chuyển tiếp nếu nhà cung cấp không thể tạo phiên trình duyệt.

    Nút điều khiển Talk chính là nút micrô trên thanh công cụ của trình soạn thảo. Dấu mũi tên của nút này liệt kê **System default** và mọi micrô mà trình duyệt cung cấp, bao gồm đầu vào USB, Bluetooth và ảo. ID thiết bị đã chọn chỉ được lưu cục bộ trong trình duyệt và không bao giờ được gửi đến Gateway; nếu chính xác thiết bị đó biến mất, Talk sẽ yêu cầu bạn chọn đầu vào khác thay vì âm thầm ghi âm từ một micrô khác. Khi Talk đang hoạt động, nút micrô trở thành một nút dạng viên thuốc hiển thị đồng hồ đo mức đầu vào trực tiếp; nhấp vào đó sẽ dừng đầu vào giọng nói, còn di chuột qua sẽ hiển thị biểu tượng dừng. Trình đọc màn hình thông báo `Connecting voice input...`, `Listening...` hoặc `Asking OpenClaw...` trong khi một lệnh gọi công cụ thời gian thực đang tham vấn mô hình lớn hơn đã cấu hình thông qua `talk.client.toolCall`. Việc dừng phản hồi đang chạy của tác nhân vẫn sử dụng một nút điều khiển hình vuông **Stop** riêng biệt bên cạnh nút dạng viên thuốc.

    **Video Talk** khả dụng cho các phiên OpenAI Realtime WebRTC và Google Live trên trình duyệt. Nhấp vào nút camera, cho phép truy cập camera và micrô, rồi xác nhận bản xem trước cục bộ. OpenAI gửi một khung JPEG có kích thước giới hạn qua kênh dữ liệu trình duyệt khi `describe_view` yêu cầu ngữ cảnh hình ảnh. Google Live gửi trực tiếp các khung JPEG có kích thước giới hạn từ trình duyệt đến nhà cung cấp với mức tối đa được hỗ trợ là một khung hình mỗi giây và phản hồi các lệnh gọi hàm `describe_view` bằng trạng thái luồng camera. Các khung hình camera không bao giờ đi qua Gateway. Việc dừng Talk sẽ đóng bản xem trước và giải phóng cả hai luồng phương tiện. Xem [các khả năng của Live API](https://ai.google.dev/gemini-api/docs/live-api/capabilities#video) và [hướng dẫn gọi hàm](https://ai.google.dev/gemini-api/docs/live-api/tools) của Google để biết các hợp đồng giao tiếp của nhà cung cấp.

    Kiểm tra nhanh trực tiếp dành cho người bảo trì: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` xác minh cầu nối WebSocket backend của OpenAI, quá trình trao đổi SDP WebRTC trên trình duyệt của OpenAI, thiết lập trình duyệt bằng mã thông báo giới hạn của Google Live với một khung JPEG và vòng khứ hồi hàm `describe_view`, cũng như bộ chuyển đổi trình duyệt chuyển tiếp Gateway với phương tiện micrô giả. Lệnh chỉ in trạng thái nhà cung cấp và không ghi nhật ký bí mật.

  </Accordion>
  <Accordion title="Dừng và hủy bỏ">
    - Nhấp vào **Stop** (gọi `chat.abort`).
    - Trong khi một lượt chạy đang hoạt động, các yêu cầu tiếp theo thông thường sử dụng chế độ `messages.queue` có hiệu lực của Gateway. `steer` đưa nội dung vào lượt đang chạy; các chế độ khác giữ cơ chế phân phối hàng đợi lâu dài của trình duyệt. Khi việc điều hướng bị từ chối, nội dung cũng được chuyển về hàng đợi đó. Nhấp vào **Steer** trên một tin nhắn đang chờ để đưa tin nhắn đó vào theo cách thủ công.
    - **Settings → Appearance → Chat → Follow-ups while the agent is working** có thể ghi đè giá trị mặc định của máy chủ cho trình duyệt hiện tại. Trang này đánh dấu rõ một giá trị ghi đè và cung cấp **Reset to server default**. `Steer into the active run` gửi các yêu cầu tiếp theo ngay lập tức, còn `Queue until the run ends` giữ chúng lại cho đến khi lượt chạy kết thúc.
    - Nhập `/stop` (hoặc các cụm từ hủy bỏ độc lập như `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) để hủy bỏ ngoài băng.
    - `chat.abort` hỗ trợ `{ sessionKey }` (không có `runId`) để hủy bỏ tất cả lượt chạy đang hoạt động của phiên đó.

  </Accordion>
  <Accordion title="Giữ lại nội dung một phần khi hủy bỏ">
    - Khi một lượt chạy bị hủy bỏ, phần văn bản chưa hoàn chỉnh của trợ lý vẫn có thể được hiển thị trong giao diện người dùng.
    - Gateway lưu phần văn bản chưa hoàn chỉnh bị hủy bỏ của trợ lý vào lịch sử bản chép lời khi có đầu ra trong bộ đệm.
    - Các mục đã lưu bao gồm siêu dữ liệu hủy bỏ để trình sử dụng bản chép lời có thể phân biệt nội dung chưa hoàn chỉnh do hủy bỏ với đầu ra hoàn tất thông thường.

  </Accordion>
</AccordionGroup>

## Mất kết nối và kết nối lại

Sau khi phiên được thiết lập, việc mất kết nối Gateway không khiến bạn bị đăng xuất. Bảng điều khiển
vẫn hiển thị với một nhãn nổi màu hổ phách "Mất kết nối Gateway — Đang kết nối lại…" bên dưới thanh
trên cùng trong khi máy khách tự động thử lại với thời gian chờ tăng dần (từ 800 ms đến tối đa 15 giây). Các bản cập nhật trực tiếp và
thao tác thời gian thực/phiên sẽ tạm dừng cho đến khi kết nối trở lại; **Thử lại ngay** trong nhãn sẽ buộc thực hiện
một lần thử ngay lập tức. Nội dung trò chuyện vẫn có thể chỉnh sửa: các lần gửi văn bản và tệp đính kèm thông thường được lưu trong
bộ nhớ trình duyệt theo phạm vi Gateway/phiên của thẻ hiện tại, được hiển thị là đang chờ kết nối lại và được gửi
tự động khi Gateway hoạt động trở lại. Các nút điều khiển trực tiếp và lệnh gạch chéo vẫn không khả dụng khi
ngoại tuyến.

Khi trình duyệt này đã có thông tin xác thực (mã thông báo/mật khẩu đã cấu hình hoặc mã thông báo thiết bị
đã được phê duyệt), lần mở đầu tiên và các lần tải lại sẽ hiển thị một biểu tượng OpenClaw động nhỏ trong khi kết nối
được thiết lập thay vì chớp hiển thị cổng đăng nhập. Cổng đăng nhập chỉ xuất hiện khi chưa lưu thông tin xác thực
hoặc khi Gateway chủ động từ chối chúng (mã thông báo/mật khẩu không hợp lệ, ghép nối đã bị thu hồi) —
những trạng thái cần bạn nhập thông tin thay vì chờ đợi.

## Cài đặt PWA và thông báo đẩy web

Control UI đi kèm một `manifest.webmanifest` và một service worker, vì vậy các trình duyệt hiện đại có thể cài đặt nó dưới dạng PWA độc lập. Web Push cho phép Gateway đánh thức PWA đã cài đặt bằng thông báo ngay cả khi thẻ hoặc cửa sổ trình duyệt không mở.

Trong ứng dụng macOS, trang cài đặt Notifications hiển thị quyền thông báo gốc của ứng dụng thay vì thông báo đẩy của trình duyệt vì ứng dụng phân phối thông báo theo cách gốc.

Nếu trang hiển thị **Protocol mismatch** ngay sau khi cập nhật OpenClaw, trước tiên hãy mở lại bảng điều khiển bằng `openclaw dashboard` và làm mới hoàn toàn. Nếu vẫn không thành công, hãy xóa dữ liệu trang web cho nguồn gốc của bảng điều khiển hoặc thử trong cửa sổ trình duyệt riêng tư; một thẻ cũ hoặc bộ nhớ đệm service worker của trình duyệt có thể tiếp tục chạy gói Control UI trước cập nhật với Gateway mới hơn.

| Bề mặt                                            | Chức năng                                                                 |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                   | Tệp kê khai PWA. Trình duyệt cung cấp "Install app" khi tệp này có thể truy cập được.             |
| `ui/public/sw.js`                                  | Service worker xử lý các sự kiện `push` và thao tác nhấp vào thông báo.           |
| `state/openclaw.sqlite` → `web_push_vapid_keys`    | Cặp khóa VAPID được tự động tạo dùng để ký các tải trọng Web Push.                 |
| `state/openclaw.sqlite` → `web_push_subscriptions` | Các điểm cuối đăng ký, khóa và dấu thời gian đăng ký của trình duyệt được lưu lâu dài. |

Dữ liệu nâng cấp từ các kho `push/vapid-keys.json` và `push/web-push-subscriptions.json` đã ngừng sử dụng được `openclaw doctor --fix` nhập. Hãy dừng Gateway trước khi chạy thao tác sửa chữa đó để một tiến trình cũ không thể tạo lại trạng thái đã ngừng sử dụng trong quá trình nhập. Chạy thao tác sửa chữa trước khi sử dụng Web Push sau khi nâng cấp; việc đăng ký, phân phối, xóa và phân giải khóa sẽ từ chối tiếp tục khi vẫn còn nguồn đã ngừng sử dụng hoặc một yêu cầu Doctor bị gián đoạn. Runtime Gateway chỉ đọc và ghi SQLite.

Ghi đè cặp khóa VAPID thông qua các biến môi trường trên tiến trình Gateway khi bạn muốn cố định khóa (triển khai nhiều máy chủ, xoay vòng bí mật hoặc kiểm thử):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (mặc định là `https://openclaw.ai`)

Control UI sử dụng các phương thức Gateway có giới hạn phạm vi sau để đăng ký và kiểm thử các đăng ký trình duyệt:

- `push.web.vapidPublicKey` lấy khóa công khai VAPID đang hoạt động.
- `push.web.subscribe` đăng ký một `endpoint` cùng với `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` xóa một điểm cuối đã đăng ký.
- `push.web.test` gửi thông báo kiểm thử đến đăng ký của bên gọi.

<Note>
Web Push độc lập với đường dẫn chuyển tiếp APNS của iOS (xem [Cấu hình](/vi/gateway/configuration) để biết thông báo đẩy dựa trên chuyển tiếp) và phương thức `push.test`, vốn nhắm đến việc ghép nối thiết bị di động gốc.
</Note>

## Nội dung nhúng được lưu trữ

Tin nhắn của trợ lý có thể hiển thị nội dung web được lưu trữ ngay trong dòng bằng mã ngắn `[embed ...]`. Chính sách sandbox của iframe được kiểm soát bởi `gateway.controlUi.embedSandbox`:

Công cụ [`show_widget`](/vi/tools/show-widget) cốt lõi hiển thị SVG hoặc HTML khép kín trực tiếp từ một lệnh gọi công cụ. Trình duyệt và các máy khách trò chuyện gốc được hỗ trợ quảng bá khả năng Gateway `inline-widgets`, và tài liệu Canvas thu được vẫn khả dụng khi lịch sử trò chuyện được tải lại. Discord Activities cung cấp cùng tên công cụ trên Discord; các lượt chạy bắt nguồn từ kênh khác không nhận được công cụ này.

<Tabs>
  <Tab title="nghiêm ngặt">
    Vô hiệu hóa việc thực thi tập lệnh bên trong nội dung nhúng được lưu trữ.
  </Tab>
  <Tab title="tập lệnh (mặc định)">
    Cho phép nội dung nhúng tương tác trong khi vẫn duy trì cô lập nguồn gốc; thường đủ cho các trò chơi/tiện ích trình duyệt khép kín.
  </Tab>
  <Tab title="đáng tin cậy">
    Thêm `allow-same-origin` bên trên `allow-scripts` cho các tài liệu cùng trang web chủ đích cần đặc quyền mạnh hơn.
  </Tab>
</Tabs>

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
Chỉ sử dụng `trusted` khi tài liệu nhúng thực sự cần hành vi cùng nguồn gốc. Đối với hầu hết trò chơi và canvas tương tác do tác nhân tạo, `scripts` là lựa chọn an toàn hơn.
</Warning>

Theo mặc định, các URL nhúng `http(s)` tuyệt đối bên ngoài vẫn bị chặn. Để cho phép `[embed url="https://..."]` tải các trang của bên thứ ba, hãy đặt `gateway.controlUi.allowExternalEmbedUrls: true`.

## Chiều rộng tin nhắn trò chuyện

Bản chép lời trò chuyện sử dụng một khung dễ đọc được căn giữa và thẳng hàng với trình soạn thảo. Đầu ra của trợ lý và công cụ được căn trái, trong khi bong bóng của người dùng được căn phải bên trong khung đó. Các triển khai trên màn hình rộng có thể ghi đè chiều rộng bản chép lời mà không cần vá CSS đi kèm bằng cách đặt `gateway.controlUi.chatMessageMaxWidth`:

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

Giá trị được xác thực trước khi đến trình duyệt. Các dạng được hỗ trợ bao gồm độ dài thuần túy và tỷ lệ phần trăm như `960px` hoặc `82%`, cùng với các biểu thức chiều rộng `min(...)`, `max(...)`, `clamp(...)`, `calc(...)` và `fit-content(...)` có ràng buộc.

## Truy cập Tailnet (khuyến nghị)

<Tabs>
  <Tab title="Tailscale Serve tích hợp (ưu tiên)">
    Giữ Gateway trên loopback và để Tailscale Serve làm proxy cho Gateway bằng HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Mở `https://<magicdns>/` (hoặc `gateway.controlUi.basePath` đã cấu hình của bạn).

    Theo mặc định, các yêu cầu Control UI/WebSocket Serve có thể xác thực qua tiêu đề danh tính Tailscale (`tailscale-user-login`) khi `gateway.auth.allowTailscale` là `true`. OpenClaw xác minh danh tính bằng cách phân giải địa chỉ `x-forwarded-for` với `tailscale whois` và đối chiếu địa chỉ đó với tiêu đề, đồng thời chỉ chấp nhận các tiêu đề này khi yêu cầu đến loopback với các tiêu đề `x-forwarded-*` của Tailscale. Đối với các phiên người vận hành Control UI có danh tính thiết bị trình duyệt, đường dẫn Serve đã xác minh này cũng bỏ qua vòng khứ hồi ghép nối thiết bị; các trình duyệt không có thiết bị và kết nối có vai trò node vẫn tuân theo quy trình kiểm tra thiết bị thông thường. Đặt `gateway.auth.allowTailscale: false` nếu muốn yêu cầu thông tin xác thực bằng bí mật dùng chung rõ ràng ngay cả với lưu lượng Serve, sau đó sử dụng `gateway.auth.mode: "token"` hoặc `"password"`.

    Đối với đường dẫn danh tính Serve bất đồng bộ đó, các lần thử xác thực thất bại cho cùng một IP máy khách và phạm vi xác thực được tuần tự hóa trước khi ghi giới hạn tốc độ. Vì vậy, các lần thử lại đồng thời với thông tin sai từ cùng một trình duyệt có thể hiển thị `retry later` ở yêu cầu thứ hai thay vì hai lỗi không khớp thông thường chạy đua song song.

    <Warning>
    Xác thực Serve không cần token giả định máy chủ gateway là đáng tin cậy. Nếu mã cục bộ không đáng tin cậy có thể chạy trên máy chủ đó, hãy yêu cầu xác thực bằng token/mật khẩu.
    </Warning>

  </Tab>
  <Tab title="Liên kết với tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Mở `http://<tailscale-ip>:18789/` (hoặc `gateway.controlUi.basePath` đã cấu hình).

    Dán bí mật dùng chung tương ứng vào phần cài đặt UI (được gửi dưới dạng `connect.params.auth.token` hoặc `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP không an toàn

Nếu mở bảng điều khiển qua HTTP thuần túy (`http://<lan-ip>` hoặc `http://<tailscale-ip>`), trình duyệt chạy trong **ngữ cảnh không an toàn** và chặn WebCrypto. Theo mặc định, OpenClaw **chặn** các kết nối Control UI không có danh tính thiết bị.

Các ngoại lệ được ghi trong tài liệu:

- khả năng tương thích HTTP không an toàn chỉ dành cho localhost với `gateway.controlUi.allowInsecureAuth=true`
- xác thực Control UI của người vận hành thành công thông qua `gateway.auth.mode: "trusted-proxy"`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` dùng trong tình huống khẩn cấp

**Cách khắc phục được khuyến nghị:** sử dụng HTTPS (Tailscale Serve) hoặc mở UI cục bộ tại `https://<magicdns>/` (Serve) hoặc `http://127.0.0.1:18789/` (trên máy chủ gateway).

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

    `allowInsecureAuth` chỉ là nút bật/tắt khả năng tương thích cục bộ:

    - Nó cho phép các phiên Control UI trên localhost tiếp tục mà không cần danh tính thiết bị trong ngữ cảnh HTTP không an toàn.
    - Nó không bỏ qua các bước kiểm tra ghép nối.
    - Nó không nới lỏng yêu cầu về danh tính thiết bị từ xa (không phải localhost).

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
    `dangerouslyDisableDeviceAuth` vô hiệu hóa việc kiểm tra danh tính thiết bị của Control UI và làm suy giảm nghiêm trọng mức độ bảo mật. Hãy hoàn nguyên nhanh chóng sau khi sử dụng trong trường hợp khẩn cấp.
    </Warning>

  </Accordion>
  <Accordion title="Lưu ý về proxy đáng tin cậy">
    - Xác thực proxy đáng tin cậy thành công có thể cho phép các phiên Control UI của **người vận hành** không có danh tính thiết bị.
    - Điều này **không** áp dụng cho các phiên Control UI có vai trò node.
    - Các proxy ngược loopback trên cùng máy chủ vẫn không đáp ứng yêu cầu xác thực proxy đáng tin cậy; xem [Xác thực proxy đáng tin cậy](/vi/gateway/trusted-proxy-auth).

  </Accordion>
</AccordionGroup>

Xem [Tailscale](/vi/gateway/tailscale) để biết hướng dẫn thiết lập HTTPS.

## Chính sách bảo mật nội dung

Control UI đi kèm chính sách `img-src` nghiêm ngặt: chỉ cho phép các tài nguyên **cùng nguồn**, URL `data:` và URL `blob:` được tạo cục bộ. Trình duyệt từ chối URL hình ảnh `http(s)` từ xa và URL hình ảnh tương đối theo giao thức, đồng thời không bao giờ gửi yêu cầu tìm nạp qua mạng.

Trong thực tế:

- Ảnh đại diện và hình ảnh được phân phối qua các đường dẫn tương đối (ví dụ: `/avatars/<id>`) vẫn hiển thị, bao gồm các tuyến ảnh đại diện có xác thực mà UI tìm nạp và chuyển đổi thành URL `blob:` cục bộ.
- URL `data:image/...` nội tuyến vẫn hiển thị.
- URL `blob:` cục bộ do Control UI tạo vẫn hiển thị.
- Ảnh đại diện trong bản xem trước liên kết GitHub được Gateway tìm nạp từ máy chủ ảnh đại diện cố định của GitHub và trả về dưới dạng URL `data:` có giới hạn; trình duyệt của người vận hành không bao giờ liên hệ với máy chủ ảnh đại diện từ xa.
- Các URL ảnh đại diện từ xa do siêu dữ liệu kênh phát ra sẽ bị loại bỏ tại các trình trợ giúp ảnh đại diện của Control UI và được thay bằng logo/huy hiệu tích hợp, vì vậy một kênh bị xâm phạm hoặc độc hại không thể buộc trình duyệt của người vận hành tùy ý tìm nạp hình ảnh từ xa.

Tính năng này luôn được bật và không thể cấu hình.

## Xác thực tuyến ảnh đại diện

Khi xác thực gateway được cấu hình, điểm cuối ảnh đại diện của Control UI yêu cầu cùng token gateway như phần còn lại của API:

- `GET /avatar/<agentId>` chỉ trả về hình ảnh đại diện cho các bên gọi đã xác thực. `GET /avatar/<agentId>?meta=1` trả về siêu dữ liệu ảnh đại diện theo cùng quy tắc.
- Các yêu cầu chưa xác thực đến một trong hai tuyến đều bị từ chối (phù hợp với tuyến phương tiện trợ lý cùng cấp), vì vậy tuyến ảnh đại diện không thể làm rò rỉ danh tính tác nhân trên các máy chủ vốn được bảo vệ.
- Control UI chuyển tiếp token gateway dưới dạng tiêu đề bearer khi tìm nạp ảnh đại diện và sử dụng URL blob đã xác thực để hình ảnh vẫn hiển thị trong bảng điều khiển.

Nếu vô hiệu hóa xác thực gateway (không nên làm trên máy chủ dùng chung), tuyến ảnh đại diện cũng sẽ không yêu cầu xác thực, phù hợp với phần còn lại của gateway.

## Xác thực tuyến phương tiện trợ lý

Khi xác thực gateway được cấu hình, bản xem trước phương tiện cục bộ của trợ lý sử dụng tuyến gồm hai bước:

- `GET /__openclaw__/assistant-media?meta=1&source=<path>` yêu cầu xác thực người vận hành Control UI thông thường; trình duyệt gửi token gateway dưới dạng tiêu đề bearer khi kiểm tra tính khả dụng.
- Các phản hồi siêu dữ liệu thành công bao gồm một `mediaTicket` tồn tại trong thời gian ngắn, có phạm vi giới hạn ở chính xác đường dẫn nguồn đó.
- Các URL hình ảnh, âm thanh, video và tài liệu do trình duyệt hiển thị sử dụng `mediaTicket=<ticket>` thay cho token hoặc mật khẩu gateway đang hoạt động. Vé này hết hạn nhanh chóng và không thể cấp quyền cho một nguồn khác.

Cách này giúp việc hiển thị phương tiện tương thích với các phần tử phương tiện gốc của trình duyệt mà không đưa thông tin xác thực gateway có thể tái sử dụng vào các URL phương tiện hiển thị công khai.

## Liên kết phê duyệt

Thông báo phê duyệt dành cho người vận hành có thể liên kết sâu đến một tài liệu phê duyệt độc lập được phân phối trong không gian tên `${controlUiBasePath}/approve/{approvalId}` dành riêng (ví dụ: `/approve/<approvalId>` hoặc `/openclaw/approve/<approvalId>` khi đã cấu hình đường dẫn cơ sở). URL ổn định trong suốt thời gian tồn tại của yêu cầu phê duyệt và có thể được chuyển tiếp an toàn giữa các thiết bị của bạn: URL xác định yêu cầu phê duyệt nhưng không bao giờ cấp quyền phê duyệt.

- Không gian tên một phân đoạn `/approve/<approvalId>` được Gateway dành riêng trước các tuyến HTTP của Plugin cho **tất cả** phương thức HTTP, vì vậy tuyến của Plugin không bao giờ có thể che khuất hoặc chặn tài liệu phê duyệt.
- Việc mở tài liệu phê duyệt yêu cầu cùng phương thức xác thực gateway như phần còn lại của Control UI (token/mật khẩu, danh tính Tailscale Serve hoặc danh tính proxy đáng tin cậy); thông tin xác thực không bao giờ là một phần của URL phê duyệt.
- Khi việc phân phối Control UI bị vô hiệu hóa, các yêu cầu đến không gian tên sẽ trả về `404` thay vì chuyển tiếp đến các trình xử lý Plugin.
- Việc đăng nhập trên tài liệu phê duyệt chỉ tồn tại tạm thời cho trang đó: nó không ghi đè lựa chọn gateway hoặc cài đặt mà Control UI đầy đủ đã lưu trong cùng trình duyệt.

Gateway phân phối các tệp tĩnh từ `dist/control-ui`:

```bash
pnpm ui:build
```

Đường dẫn cơ sở tuyệt đối tùy chọn (URL tài nguyên cố định):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Phát triển cục bộ (máy chủ phát triển riêng biệt):

```bash
pnpm ui:dev
```

Sau đó trỏ UI đến URL WS của Gateway (ví dụ: `ws://127.0.0.1:18789`).

## Trang Control UI trống

Nếu trình duyệt tải một bảng điều khiển trống và DevTools không hiển thị lỗi hữu ích nào, một tiện ích mở rộng hoặc tập lệnh nội dung chạy sớm có thể đã ngăn ứng dụng mô-đun JavaScript được thực thi. Trang tĩnh có một bảng khôi phục HTML thuần túy xuất hiện khi `<openclaw-app>` không được đăng ký sau khi khởi động.

Sử dụng thao tác **Try again** của bảng sau khi thay đổi môi trường trình duyệt hoặc tải lại thủ công sau các bước kiểm tra sau:

- Vô hiệu hóa các tiện ích mở rộng chèn mã vào tất cả các trang, đặc biệt là các tiện ích có tập lệnh nội dung `<all_urls>`.
- Thử cửa sổ riêng tư, hồ sơ trình duyệt sạch hoặc một trình duyệt khác.
- Giữ Gateway hoạt động và xác minh lại cùng URL bảng điều khiển sau khi thay đổi trình duyệt.

## Gỡ lỗi/kiểm thử: máy chủ phát triển + Gateway từ xa

Control UI gồm các tệp tĩnh; đích WebSocket có thể cấu hình và có thể khác với nguồn HTTP. Điều này hữu ích khi muốn chạy máy chủ phát triển Vite cục bộ nhưng Gateway chạy ở nơi khác.

<Steps>
  <Step title="Khởi động máy chủ phát triển UI">
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
  <Accordion title="Lưu ý">
    - `gatewayUrl` được lưu trong localStorage sau khi tải và bị xóa khỏi URL.
    - Nếu truyền một điểm cuối `ws://` hoặc `wss://` đầy đủ qua `gatewayUrl`, hãy mã hóa URL cho giá trị để trình duyệt phân tích cú pháp chuỗi truy vấn chính xác.
    - `token` nên được truyền qua đoạn URL (`#token=...`) bất cứ khi nào có thể. Các đoạn URL không được gửi đến máy chủ, nhờ đó tránh rò rỉ qua nhật ký yêu cầu và Referer. Các tham số truy vấn `?token=` cũ vẫn được nhập một lần để đảm bảo khả năng tương thích, nhưng chỉ dưới dạng phương án dự phòng và sẽ bị loại bỏ ngay sau khi khởi tạo.
    - `password` chỉ được lưu trong bộ nhớ.
    - Khi `gatewayUrl` được đặt, UI không dùng dự phòng thông tin xác thực từ cấu hình hoặc môi trường. Hãy cung cấp rõ ràng `token` (hoặc `password`); thiếu thông tin xác thực rõ ràng là một lỗi.
    - Sử dụng `wss://` khi Gateway nằm sau TLS (Tailscale Serve, proxy HTTPS, v.v.).
    - `gatewayUrl` chỉ được chấp nhận trong cửa sổ cấp cao nhất (không được nhúng) để ngăn clickjacking.
    - Các triển khai Control UI công khai không phải loopback phải đặt rõ ràng `gateway.controlUi.allowedOrigins` (nguồn đầy đủ). Các lượt tải LAN/Tailnet riêng tư cùng nguồn từ loopback, RFC1918/link-local, `.local`, `.ts.net` hoặc máy chủ CGNAT Tailscale được chấp nhận mà không cần bật phương án dự phòng dựa trên tiêu đề Host.
    - Khi khởi động, Gateway có thể khởi tạo các nguồn cục bộ như `http://localhost:<port>` và `http://127.0.0.1:<port>` từ địa chỉ liên kết và cổng thời gian chạy hiệu lực, nhưng các nguồn trình duyệt từ xa vẫn cần mục nhập rõ ràng.
    - Không sử dụng `gateway.controlUi.allowedOrigins: ["*"]` ngoại trừ kiểm thử cục bộ được kiểm soát chặt chẽ; giá trị này có nghĩa là cho phép mọi nguồn trình duyệt, không phải "khớp với bất kỳ máy chủ nào tôi đang sử dụng".
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` bật chế độ dự phòng nguồn dựa trên tiêu đề Host, nhưng đây là một chế độ bảo mật nguy hiểm.

  </Accordion>
</AccordionGroup>

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

- [Bảng điều khiển](/vi/web/dashboard) — bảng điều khiển gateway
- [Kiểm tra tình trạng](/vi/gateway/health) — giám sát tình trạng gateway
- [TUI](/vi/web/tui) — giao diện người dùng đầu cuối
- [WebChat](/vi/web/webchat) — giao diện trò chuyện trên trình duyệt
