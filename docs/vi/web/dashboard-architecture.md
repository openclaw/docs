---
read_when:
    - Triển khai hoặc review tính năng bảng điều khiển phiên (các bảng)
    - Thay đổi dịch vụ lưu trữ tiện ích, cầu nối tiện ích hoặc bộ nhớ bảng
summary: 'Bảng điều khiển phiên: kiến trúc và kế hoạch triển khai (thiết kế kỹ thuật, trước GA)'
title: Kiến trúc bảng điều khiển
x-i18n:
    generated_at: "2026-07-19T06:07:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 472b6a9268f552f56b7aaa3ceecaa99e15722188f10d703d3321e9d60166904f
    source_path: web/dashboard-architecture.md
    workflow: 16
---

<Note>
Tài liệu thiết kế kỹ thuật cho tính năng bảng điều khiển phiên, được viết trước và
trong quá trình triển khai. Đây là nguồn thông tin chuẩn cho việc xây dựng. Khi
tính năng được phát hành, `/web/dashboard` trở thành trang dành cho người dùng và trang này vẫn
là tài liệu tham chiếu kiến trúc.
</Note>

## Tầm nhìn

Hiện nay, làm việc với một agent là tương tác qua luồng văn bản. Bảng điều khiển biến nó thành một
bàn làm việc: agent kết xuất các widget trực tiếp, có tính tương tác; người dùng ghim chúng lên
một bề mặt cố định; khung chat được neo sang bên cạnh (hoặc ẩn đi) và nội dung chính là
bảng. Bạn chuyển từ "trò chuyện với agent" sang "vận hành bảng điều khiển mà
agent đã xây dựng cho bạn" mà không bao giờ phải rời khỏi phiên.

Các nguyên tắc:

- **Bảng là một giao diện của phiên, không phải một đối tượng mới.** Mỗi phiên (luồng)
  có hai giao diện: bản chép lời và bảng. Phiên không có widget nào được ghim
  là phiên chat thông thường. Ghim một widget thì bảng sẽ tồn tại. Bảng kế thừa
  danh tính, quyền sở hữu của agent, tên, trạng thái ghim và vòng đời của
  phiên. Không có `dashboard_create`, không có sổ đăng ký bảng, không có mô hình ACL riêng.
- **Tính tương đương của agent.** Mọi thao tác người dùng có thể thực hiện trên bảng, agent đều có thể thực hiện
  bằng công cụ: thêm/cập nhật/xóa widget, sắp xếp chúng, quản lý tab, chuyển
  tab đang hiển thị, neo hoặc ẩn khung chat.
- **Thuần bản địa, không nhúng.** Bảng sử dụng các thành phần Lit trong shell của Control UI
  (cùng hệ thống thiết kế với phần còn lại của ứng dụng). Chỉ _nội dung_ widget
  được cách ly trong iframe. Không có thanh URL, không có giao diện trình duyệt.
- **Bề mặt agent nhỏ gọn.** Widget được định địa chỉ bằng tên ổn định và được cập nhật
  tại chỗ. Bố cục là lưới linh hoạt tự động thu gọn; agent chỉ định kích thước và
  điểm neo, không bao giờ dùng pixel hoặc tọa độ.
- **Khả năng thay vì mức độ tin cậy.** Mã widget là HTML/JS tùy ý do agent tạo
  trong một sandbox nghiêm ngặt. Phạm vi truy cập (dữ liệu Gateway, hành động, mạng) chỉ tồn tại thông qua
  một bản kê khai khả năng đã khai báo và được người vận hành cấp quyền.

## Khái niệm

| Khái niệm             | Định nghĩa                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phiên (luồng)    | Phiên Gateway hiện có, được định danh bằng `sessionKey` ổn định. Thuộc quyền sở hữu của một agent.                                                                                        |
| Bảng               | Giao diện widget của một phiên. Tồn tại khi và chỉ khi phiên có widget/tab. Tồn tại sau `/new`/`/reset` (gắn với `sessionKey`, không phải bản chép lời).                 |
| Tab                 | Một trang trình bày của bảng: các widget, cách sắp xếp và trạng thái neo khung chat (`left`/`right`/`bottom`/`hidden`). Bảng bắt đầu với một tab ngầm định. |
| Widget              | Chương trình HTML/JS có tên, được cách ly và thuộc sở hữu của phiên. Được định địa chỉ bằng `sessionKey` + `name`. Được cập nhật tại chỗ theo tên.                                              |
| Bản kê khai khả năng | Khai báo phạm vi truy cập theo từng widget: `data` (liên kết đọc), `actions` (các động từ trong danh sách cho phép), `prompt` (gửi đến phiên), `net` (các nguồn gốc được phép).                      |
| Ghim (widget)        | Di chuyển một widget trong bản chép lời lên bảng của phiên (qua chức năng giao diện người dùng hoặc đối số công cụ của agent). Bỏ ghim sẽ xóa nó khỏi bảng.                                         |
| Ghim (phiên)       | Cơ chế ghim phiên hiện có trong thanh bên. Phiên được ghim có bảng sẽ mở ở giao diện bảng.                                                                      |

## Luồng trải nghiệm người dùng

- **Chuyển đổi:** agent gọi `show_widget` trong bất kỳ cuộc chat nào → widget được kết xuất nội tuyến
  trong bản chép lời chính xác như hiện nay → khi di chuột sẽ hiển thị **Ghim vào bảng điều khiển** → widget
  xuất hiện trên bảng của phiên. Agent có thể truyền `pin: true` để thực hiện tương tự.
- **Chế độ xem bảng:** phiên có bảng sẽ có nút chuyển đổi giao diện (Chat / Bảng điều khiển).
  Chế độ xem bảng = dải tab (chỉ khi có >1 tab) + lưới linh hoạt + khung chat được neo.
  Khung neo chat có thể thay đổi kích thước, di chuyển (trái/phải/dưới) và thu gọn chính xác
  như thanh bên. Trạng thái neo được ghi nhớ theo từng tab.
- **Kéo:** người dùng kéo các widget; lưới tự động thu gọn (widget nổi lên trên, các phần tử lân cận
  tự sắp xếp lại). Thay đổi kích thước bằng tay cầm sẽ khớp theo các mức kích thước. Không bố trí theo pixel — áp dụng cho
  tất cả mọi người.
- **Cảnh báo đặt lại:** `/new` / `/reset` trên phiên có bảng sẽ yêu cầu
  xác nhận trong giao diện web ("ngữ cảnh được đặt lại, bảng điều khiển vẫn được giữ") và giữ lại
  bảng.
- **Thanh bên:** các phiên được ghim sẽ hiển thị giao diện bảng nếu có.
  Bảng của phiên Home là "bảng điều khiển agent" mặc định.
- **Tương tác** (ba cấp, xem bên dưới): sự kiện trạng thái thầm lặng, lượt gửi
  lời nhắc hiển thị công khai và trình kích hoạt tự động hóa.

## Các cấp tương tác

1. **Sự kiện trạng thái (mặc định).** Các tương tác trên giao diện widget mà mô hình cần biết
   nhưng không cần phản hồi. `bridge.emitState({...})` nối thêm một thông báo
   phiên có cấu trúc (cùng cơ chế với thông báo hoạt động nhóm). Không có lượt agent nào được
   bắt đầu; mô hình sẽ thấy các thông báo được tích lũy trong lần chạy tiếp theo.
2. **Lời nhắc (trò chuyện rõ ràng).** `bridge.sendPrompt(text)` — yêu cầu người dùng
   kích hoạt; gửi một tin nhắn hiển thị công khai của người dùng vào phiên (khung chat được neo
   sẽ hiển thị tin nhắn đó). Có giới hạn tần suất; mỗi lượt gửi đều được người dùng xác nhận, trừ khi widget có
   quyền khả năng `prompt`.
3. **Tự động hóa.** `bridge.runAction(name, args)` — kích hoạt một hành động
   được khai báo trong bản kê khai. Tập động từ ban đầu: `cron.trigger` (chạy ngay một tác vụ Cron hiện có) và
   `binding.refresh`. Các tác vụ Cron vốn đã chạy trong các phiên chạy độc lập, hiển thị công khai
   và có thể sử dụng mô hình rẻ hơn: đó là hướng "mô hình nhỏ vận hành widget".
   Không có phiên ẩn ở bất kỳ đâu.

## Mô hình và dịch vụ lưu trữ widget

HTML/JS của widget do agent tạo (thường qua `show_widget`), được bao bọc
trong shell tài liệu tiêu chuẩn (meta CSP, trình báo cáo kích thước, trình khởi động cầu nối) và
được kết xuất trong `<iframe sandbox="allow-scripts">` (không bao giờ là `allow-same-origin`).

- **Widget nội tuyến (bản chép lời)** giữ nguyên pipeline tài liệu canvas hiện tại:
  được ghi trong thư mục trạng thái, do Gateway phục vụ, được dọn dẹp theo phạm vi, không cần
  phê duyệt (theo thiết kế, chúng không có khả năng — lượt gửi lời nhắc được người dùng xác nhận).
- **Widget trên bảng** là trạng thái phiên: các byte nằm trong DB SQLite
  của agent sở hữu (`board_widgets`), được phục vụ bởi một tuyến Gateway lõi
  (`/__openclaw__/board/<agentId>/<sessionKey>/<name>/`) đọc DB.
  Việc ghim widget trong bản chép lời sẽ sao chép các byte. Giới hạn: 256 KB cho mỗi widget,
  48 widget cho mỗi bảng.
- **Cập nhật tại chỗ:** phát lại widget có cùng `name` sẽ thay thế
  các byte, tăng `revision`, phát quảng bá `board.changed`, và các chế độ xem trực tiếp chỉ tải lại
  iframe đó.
- **Đóng băng byte:** các khả năng đã cấp được liên kết với mã sha256 của các byte
  widget. Việc thay đổi byte chỉ giữ các quyền `data`/`net`/`actions` nếu bản sửa đổi mới
  khai báo một tập con của bản kê khai đã được cấp; bản kê khai mở rộng sẽ
  yêu cầu lại người vận hành.

### Widget lưu trữ nội dung; ứng dụng MCP là một loại nội dung

**Widget là thành phần nguyên thủy của OpenClaw**: ô bảng có tên, được ghim, có kích thước,
thuộc sở hữu của phiên và có bản ghi cấp quyền. Nội dung kết xuất bên trong là một
loại nội dung:

- `html` — do agent tạo qua `show_widget`, các byte nằm trong bộ nhớ bảng.
- `mcp-app` — chế độ xem ứng dụng MCP của bên thứ ba (tài nguyên `ui://` từ một máy chủ
  đã cấu hình) được lưu trữ bên trong ô widget.

Ứng dụng MCP không định nghĩa mô hình widget; widget được bổ sung khả năng lưu trữ
chúng. Danh tính, vị trí, trạng thái ghim, quyền cấp và API dành cho tác giả vẫn
thuộc về OpenClaw — vì vậy mã `show_widget` vẫn ngắn gọn như hiện nay và không bao giờ
cần biết đặc tả MCP Apps tồn tại.

Cơ sở hạ tầng dùng chung bên dưới (đây là nơi diễn ra sự đơn giản hóa):

- **Một máy chủ sandbox.** Các widget `html` được kết xuất qua cùng một
  pipeline được gia cố đã đi kèm với ứng dụng MCP (iframe kép trên nguồn gốc sandbox
  chuyên dụng, CSP theo từng widget được khai báo và giải mã theo cơ chế từ chối khi lỗi), thay vì một
  máy chủ iframe tùy biến thứ hai. Proxy nhận HTML theo giá trị, nên nội dung cục bộ là
  trường hợp tự nhiên.
- **Một mô hình ủy quyền.** Phạm vi truy cập của widget là một danh sách cho phép đã được cấp,
  bất kể loại nào: đối với widget `html`, các công cụ máy chủ; đối với widget `mcp-app`,
  các công cụ mà ứng dụng có thể thấy từ máy chủ (thông qua cơ chế `allowedAppToolNames`
  hiện có, được duy trì bền vững theo từng widget thay vì theo từng lượt tạo).
- **Công cụ máy chủ cho widget `html`** (được cung cấp qua cầu nối widget, được kiểm tra
  dựa trên quyền cấp):
  - `openclaw.prompt.send` — cấp 2; được định tuyến qua trình soạn thảo hiển thị công khai,
    yêu cầu người dùng xác nhận trừ khi đã được cấp quyền
  - `openclaw.state.emit` — thông báo phiên cấp 1 (được hợp nhất, giới hạn kích thước)
  - `openclaw.data.read` — các liên kết chỉ đọc có tham số (tập RPC đọc
    trong danh sách cho phép hiện có), được phân giải ở phía Gateway
  - `openclaw.cron.trigger` — tự động hóa cấp 3
- **`net` = CSP.** Phạm vi truy cập mạng sử dụng khai báo CSP theo từng widget
  đã được phát hành (`connect-src` nguồn gốc) — widget thời tiết tự cập nhật
  tìm nạp API trực tiếp từ sandbox, không có sự tham gia của Gateway.
- **Quyền cấp.** Widget không khai báo gì sẽ được kết xuất ngay lập tức (được cách ly,
  `default-src 'none'`, từng lượt gửi lời nhắc được xác nhận riêng) — cùng mức độ tin cậy như
  các widget chat nội tuyến hiện nay. Các công cụ/nguồn gốc được khai báo sẽ đặt widget vào
  `pending` trên bảng: một thẻ giữ chỗ liệt kê chúng bằng ngôn ngữ dễ hiểu với
  thao tác một chạm **Cho phép**/**Từ chối**. Quyền cấp được áp dụng theo tên widget; đối với widget `html`,
  chúng được đóng băng theo byte (sha256), và byte thay đổi chỉ giữ quyền cấp nếu
  phần khai báo được thu hẹp.
- **Lớp tương thích dành cho tác giả.** Trình bao tài liệu chèn
  `window.openclaw.sendPrompt/emitState/read/call` làm API ổn định dành cho tác giả;
  việc phương thức vận chuyển bên dưới là kênh của chúng ta hay AppBridge
  là chi tiết nội bộ mà tác giả widget không bao giờ nhìn thấy. Báo cáo kích thước và token
  giao diện sử dụng cùng cầu nối.

### Hiển thị bản chép lời: một thẻ widget

Cách hiển thị nội tuyến được hợp nhất theo thành phần nguyên thủy widget. Khi kết quả công cụ mang theo giao diện người dùng —
đầu ra `show_widget` hoặc kết quả công cụ MCP có tài nguyên ứng dụng — hệ thống
hiện thực hóa một **widget tạm thời, được đặt tên tự động** (phạm vi phiên, được dọn dẹp) và
bản chép lời kết xuất một thẻ widget duy nhất, điều phối theo loại nội dung.
Cơ chế tự động hiển thị ứng dụng MCP vẫn chính xác như đặc tả yêu cầu (không cần thêm công sức từ mô hình);
về bản chất, bên dưới nó _là_ một widget. Điều này xóa các trường hợp đặc biệt `mcpApp`
song song trong quá trình kết xuất chat (kiểm soát theo bề mặt, loại bỏ trùng lặp riêng), cung cấp cho mọi
giao diện nội tuyến cùng một chức năng ghim và biến sổ đăng ký widget thành đường dẫn chính
để mở lại (tái dựng bằng cách quét bản chép lời vẫn là phương án dự phòng cho lịch sử
chưa từng được ghim). Máy chủ độc lập chỉ đọc có phiếu truy cập trùng lặp với bảng ở vai trò
bề mặt mở lại bền vững — là ứng viên hợp nhất cần đánh giá trong T6, không
được giả định trước.

Kết hợp: v1 sử dụng vị trí liền kề trong lưới (widget chrome của agent nằm cạnh widget ứng dụng trên
một tab). v2 bổ sung **vùng ứng dụng do máy chủ quản lý** — HTML widget của agent khai báo một
vùng và máy chủ kết hợp chế độ xem ứng dụng thực dưới dạng một sandbox ngang hàng.
Ứng dụng không bao giờ kết xuất bên trong iframe của agent: việc lồng ghép sẽ phá vỡ danh tính
cầu nối và cho phép che phủ/clickjack giao diện ứng dụng đã được cấp quyền, vì vậy vùng này là một
hợp đồng bố cục, không phải nội dung nhúng.

### Widget có nguồn từ máy chủ (ứng dụng MCP được ghim)

Với máy chủ hợp nhất, việc ghim một ứng dụng MCP của bên thứ ba chỉ là một tiện ích có
nội dung được tìm nạp từ máy chủ thay vì được lưu trữ: `board_widgets` giữ
bộ mô tả (`serverName`, `toolName`, `uiResourceUri`, nguồn gốc
`toolCallId` + `sessionKey`) thay vì các byte HTML, và bảng sẽ cấp lại
hợp đồng thuê chế độ xem sau TTL 10 phút của lượt trò chuyện (tìm nạp lại tài nguyên
`ui://` khi bị lỗi thời). Các chế độ xem ứng dụng MCP nội tuyến trong trò chuyện có cùng
tùy chọn **Ghim vào bảng điều khiển** như các tiện ích của agent. Theo thiết kế, các chế độ xem
được mở lại hiện chỉ có quyền đọc; các ứng dụng được ghim cần duy trì khả năng tương tác sẽ nhận
một quyền cấp lâu dài đối với các công cụ hiển thị với ứng dụng của máy chủ (danh sách cho phép
tường minh được hiển thị cho người vận hành khi ghim), tách biệt khỏi lượt cấp quyền. Các mục ghim
không được cấp quyền vẫn chỉ có quyền đọc — nhưng vẫn hữu ích cho các bảng điều khiển hiển thị.
v1 ghim vào bảng của phiên nguồn; việc ghim giữa các phiên cần một trình môi giới hợp đồng thuê
và phải chờ. Phối hợp với pull request đang mở #109807 (`ui/message`
định tuyến trình soạn thảo, truyền giao diện/kích thước).

## Bố cục: lưới linh hoạt

12 cột, chiều cao hàng cố định, **tự động thu gọn** (trọng lực hướng lên, đẩy sang bên khi
kéo — ngữ nghĩa gridstack, được triển khai nguyên bản; phép toán lưới vẫn thuần túy và
không phụ thuộc DOM). Trạng thái bố cục tiện ích theo từng thẻ: `{ name, w (1-12), h (rows) }` cộng với
thứ tự. Từ vựng của agent:

- `size`: `sm` (3×3) · `md` (6×4) · `lg` (8×6) · `xl` (12×8) · `full`
  (thẻ chỉ có một tiện ích)
- `after: <widgetName>` điểm neo thứ tự tùy chọn; bỏ qua = thêm vào cuối
- Người dùng tự do kéo/thay đổi kích thước; cùng mô hình thứ tự+kích thước được bảo toàn qua khứ hồi.

## Mô hình dữ liệu (DB theo từng agent)

Các bảng mới trong `agents/<agentId>/agent/openclaw-agent.sqlite`
(**yêu cầu tăng phiên bản lược đồ DB của agent — cần người vận hành phê duyệt
trước khi thay đổi này được đưa vào**):

```sql
CREATE TABLE board_tabs (
  session_key TEXT NOT NULL,
  tab_id      TEXT NOT NULL,           -- slug
  title       TEXT NOT NULL,
  position    INTEGER NOT NULL,
  chat_dock   TEXT NOT NULL DEFAULT 'right',  -- left|right|bottom|hidden
  created_by  TEXT NOT NULL,           -- 'user' | 'agent'
  PRIMARY KEY (session_key, tab_id)
) STRICT;

CREATE TABLE board_widgets (
  session_key  TEXT NOT NULL,
  name         TEXT NOT NULL,          -- stable widget name
  tab_id       TEXT NOT NULL,
  title        TEXT,
  html         BLOB NOT NULL,          -- wrapped document source
  sha256       TEXT NOT NULL,
  revision     INTEGER NOT NULL,
  size_w       INTEGER NOT NULL,
  size_h       INTEGER NOT NULL,
  position     INTEGER NOT NULL,       -- order within tab (auto-compact input)
  manifest     TEXT NOT NULL DEFAULT '{}',  -- capability manifest JSON
  grant_state  TEXT NOT NULL DEFAULT 'none', -- none|pending|granted|rejected
  granted_sha  TEXT,                   -- byte-frozen grant
  created_by   TEXT NOT NULL,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  PRIMARY KEY (session_key, name)
) STRICT;
```

Bảng tồn tại = có bất kỳ hàng nào cho `sessionKey`. Xóa một phiên sẽ xóa các
hàng bảng tương ứng. `/new`/`/reset` không tác động đến chúng.

## Bề mặt giao thức

Các RPC (bảng phương thức lõi, lược đồ typebox trong `gateway-protocol`):

- `board.get { sessionKey }` → các thẻ + siêu dữ liệu tiện ích (không có byte) — `operator.read`
- `board.update { sessionKey, ops[] }` — CRUD/sắp xếp lại thẻ, di chuyển/thay đổi kích thước/
  xóa/bỏ ghim tiện ích, trạng thái vùng neo, đưa thẻ vào tiêu điểm — `operator.write`
- `board.widget.put { sessionKey, name, html, manifest, placement }` —
  `operator.write` (đường dẫn công cụ agent và đường dẫn ghim)
- `board.widget.grant { sessionKey, name, decision }` — `operator.approvals`
- `board.event { sessionKey, widget, payload }` — tiếp nhận sự kiện trạng thái cấp 1 —
  `operator.write`

Các sự kiện (trong `EVENT_SCOPE_GUARDS`, phạm vi đọc):

- `board.changed { sessionKey, revision, widget? }` — trạng thái đã lưu thay đổi;
  UI tìm nạp lại (và tải lại một iframe khi có `widget`).
- `board.command { sessionKey, command }` — điều khiển UI tạm thời (agent chuyển
  thẻ đang hiển thị, bật/tắt vùng neo trò chuyện) — mẫu `ui.command`.

Các byte tiện ích được phục vụ qua bề mặt HTTP đã xác thực, không phải socket.

## Công cụ agent

Tổng cộng ba công cụ (thuộc lõi, luôn được đăng ký; việc kết xuất bị ràng buộc bởi
khả năng máy khách `inline-widgets` như hiện tại):

- `show_widget { title, widget_code, name?, pin?, size?, tab?, after?,
capabilities? }` — tạo/cập nhật theo tên; `pin` đặt tiện ích lên bảng.
  Khi không có `name`/`pin`, công cụ hoạt động chính xác như hiện tại (nội tuyến, tạm thời).
- `dashboard { action, ... }` — các thao tác quản lý bảng: `read`, `tab_create`,
  `tab_update`, `tab_delete`, `tabs_reorder`, `widget_move`, `widget_remove`,
  `unpin`, `focus_tab`, `set_chat_dock`.
- Các công cụ `cron` hiện có bao phủ cấp tự động hóa; không cần công cụ mới.

Mô tả công cụ hướng dẫn từ vựng về kích thước/điểm neo và mô hình phân cấp. Agent
được thông báo về các sự kiện cấp 1 của người dùng qua thông báo phiên, ví dụ:
`[dashboard] user clicked "Refresh" on widget weather (tab main)`.

## Nội dung được thay thế

- **`extensions/workspaces` bị xóa.** Đây là tính năng thử nghiệm, `enabledByDefault:
false`, chưa từng có trong bản phát hành ổn định (xuất hiện lần đầu trong các bản beta 2026.7.2). Không
  di chuyển dữ liệu; một quy tắc doctor xóa `<stateDir>/workspaces/` lỗi thời nếu có.
  Các ý tưởng được tận dụng: phép toán lưới thuần túy, mô hình bảo mật cầu nối (khởi tạo
  cổng, ràng buộc liên kết, giới hạn tốc độ), phê duyệt đóng băng theo byte.
- **Việc lưu trữ tiện ích chuyển từ `extensions/canvas` sang lõi.** Kho tài liệu canvas,
  trình bao bọc tài liệu, phục vụ HTTP và công cụ `show_widget` trở thành thành phần lõi
  (`src/canvas/`); plugin giữ công cụ điều khiển node-canvas (`canvas`) và
  A2UI. Quảng bá `pluginSurfaceUrls["canvas"]` và các đường dẫn
  `/__openclaw__/canvas` là hợp đồng máy khách nguyên bản đã phát hành và vẫn
  ổn định. Các phiên Discord giữ biến thể `show_widget` thuộc sở hữu của Discord.
- **WorkBoard không thay đổi** (việc tích hợp là một chương trình tiếp nối).

## Ngoài phạm vi (chương trình này)

- Chia sẻ bảng nhiều người dùng/ACL (trong tương lai; sẽ được cung cấp thông qua chia sẻ phiên).
- Kết xuất bảng nguyên bản trên macOS/iOS (các nền tảng này có bảng ở bất cứ nơi nào
  nhúng Control UI; đường dẫn tiện ích nội tuyến không thay đổi).
- Các tiện ích dữ liệu tích hợp sẵn (thẻ phiên/mức sử dụng/cron) — cầu nối khả năng cùng
  các tiện ích do agent tạo bao phủ v1; sổ đăng ký loại tích hợp sẵn có thể được bổ sung sau.
- WorkBoard trên bảng điều khiển.

## Kế hoạch triển khai

Các worktree độc lập, được xây dựng bằng Codex, review+đưa vào tuần tự. Đưa vào rồi sửa.

| #   | Nhánh                                | Phạm vi                                                                                                                                                                            | Phụ thuộc                        |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T1  | `claude/dashboard-remove-workspaces` | Xóa plugin workspaces + UI + tài liệu + khóa i18n; quy tắc dọn dẹp doctor                                                                                                          | —                                |
| T2  | `claude/dashboard-canvas-core`       | Chuyển việc lưu trữ tiện ích + `show_widget` vào lõi; plugin canvas giữ công cụ node; không thay đổi hành vi                                                                      | —                                |
| T3  | `claude/dashboard-domain`            | Các bảng DB của agent (tăng phiên bản lược đồ), RPC + sự kiện `board.*`, công cụ `dashboard`, đối số ghim/tên/manifest `show_widget`, thông báo cấp 1, đặt lại nhưng giữ bảng | T2                               |
| T4  | `claude/dashboard-ui`                | Giao diện bảng + thanh thẻ + lưới tự động thu gọn linh hoạt + vùng neo trò chuyện (trái/phải/dưới/ẩn) + tùy chọn ghim bản chép lời + giao diện bảng ở thanh bên + xác nhận đặt lại       | T3 (mô phỏng trước qua fixture phát triển) |
| T5  | `claude/dashboard-capabilities`      | Kho/UI quyền cấp + đóng băng byte; chuyển các tiện ích `html` sang máy chủ sandbox dùng chung; công cụ máy chủ (`openclaw.prompt.send/state.emit/data.read/cron.trigger`); CSP `net`; shim tạo nội dung | T3, T4                           |
| T7  | `claude/dashboard-mcp-apps`          | Loại nội dung `mcp-app`: tùy chọn ghim trên các chế độ xem ứng dụng nội tuyến, lưu trữ bộ mô tả, cấp lại/làm mới hợp đồng thuê, quyền cấp công cụ máy chủ lâu dài (tái sử dụng máy chủ MCP Apps đã phát hành) | T3, T4                           |
| T6  | hoàn thiện                           | E2E trực tiếp trên một gateway tạm thời (khóa thật), ảnh chụp màn hình, bản sửa lỗi, viết lại `/web/dashboard` hướng đến người dùng, review bật theo mặc định                         | tất cả                           |

Xác thực theo quy tắc của repo: vitest tập trung chạy cục bộ, toàn bộ các cổng kiểm tra trên
Crabbox/Testbox, `$autoreview` trước mỗi lần đưa vào, bằng chứng trực tiếp cho T6.
