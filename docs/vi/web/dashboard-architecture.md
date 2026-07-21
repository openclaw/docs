---
read_when:
    - Triển khai hoặc review tính năng bảng điều khiển phiên (các bảng)
    - Thay đổi dịch vụ lưu trữ tiện ích, cầu nối tiện ích hoặc bộ nhớ bảng
summary: 'Bảng điều khiển phiên: kiến trúc và kế hoạch triển khai (thiết kế kỹ thuật, trước GA)'
title: Kiến trúc bảng điều khiển
x-i18n:
    generated_at: "2026-07-21T13:35:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a7c5da94ec19add55c6b7b530f0c17509a027e97fb301469ce48f520b325c169
    source_path: web/dashboard-architecture.md
    workflow: 16
---

<Note>
Tài liệu thiết kế kỹ thuật cho tính năng bảng điều khiển phiên, được viết trước và
trong quá trình triển khai. Đây là nguồn thông tin chuẩn cho việc xây dựng. Khi
tính năng được phát hành, `/web/dashboard` trở thành trang dành cho người dùng và trang này vẫn
được giữ làm tài liệu tham chiếu kiến trúc.
</Note>

## Tầm nhìn

Hiện nay, làm việc với một tác tử là làm việc với một luồng văn bản. Bảng điều khiển biến nó thành một
bàn làm việc: tác tử kết xuất các tiện ích tương tác theo thời gian thực; người dùng ghim chúng lên
một bề mặt bền vững; khung trò chuyện được neo sang bên cạnh (hoặc ẩn đi) và nội dung chính là
bảng. Bạn chuyển từ "trò chuyện với tác tử" sang "vận hành bảng điều khiển mà
tác tử đã xây dựng cho bạn" mà không bao giờ phải rời khỏi phiên.

Nguyên tắc:

- **Bảng là một giao diện của phiên, không phải một đối tượng mới.** Mỗi phiên (luồng)
  có hai giao diện: bản ghi hội thoại và bảng. Phiên không có tiện ích nào được ghim
  chỉ là cuộc trò chuyện thông thường. Ghim một tiện ích và bảng sẽ tồn tại. Bảng kế thừa
  danh tính, quyền sở hữu của tác tử, tên, trạng thái ghim và vòng đời của
  phiên. Không có `dashboard_create`, không có sổ đăng ký bảng, không có mô hình ACL riêng.
- **Tính tương đương của tác tử.** Mọi thao tác người dùng có thể thực hiện trên bảng, tác tử đều có thể thực hiện
  bằng công cụ: thêm/cập nhật/xóa tiện ích, sắp xếp chúng, quản lý thẻ, chuyển
  thẻ đang hiển thị, neo hoặc ẩn khung trò chuyện.
- **Gốc, không nhúng.** Bảng là các thành phần Lit trong lớp vỏ Control UI
  (cùng hệ thống thiết kế với phần còn lại của ứng dụng). Chỉ _nội dung_ tiện ích
  mới được cách ly trong iframe. Không có thanh URL, không có giao diện trình duyệt.
- **Bề mặt tác tử nhỏ gọn.** Tiện ích được định địa chỉ bằng tên ổn định và được cập nhật
  tại chỗ. Bố cục là lưới linh hoạt tự động thu gọn; tác tử chỉ định kích thước và
  điểm neo, không bao giờ chỉ định pixel hoặc tọa độ.
- **Năng lực thay vì niềm tin.** Mã tiện ích là HTML/JS tùy ý do tác tử tạo
  trong một hộp cát nghiêm ngặt. Phạm vi truy cập (dữ liệu Gateway, hành động, mạng) chỉ tồn tại thông qua
  bản kê khai năng lực đã khai báo và được người vận hành cấp quyền.

## Khái niệm

| Khái niệm           | Định nghĩa                                                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Phiên (luồng)       | Phiên Gateway hiện có, được định danh bằng `sessionKey` ổn định. Thuộc sở hữu của một tác tử.                                                                                        |
| Bảng                | Giao diện tiện ích của một phiên. Chỉ tồn tại khi phiên có tiện ích/thẻ. Tồn tại sau `/new`/`/reset` (gắn với `sessionKey`, không phải bản ghi hội thoại).                 |
| Thẻ                 | Một trang trình bày của bảng: gồm những tiện ích nào, cách sắp xếp của chúng và trạng thái neo khung trò chuyện (`left`/`right`/`bottom`/`hidden`). Bảng bắt đầu với một thẻ ngầm định. |
| Tiện ích            | Chương trình HTML/JS có tên, được cách ly và thuộc sở hữu của phiên. Được định địa chỉ bằng `sessionKey` + `name`. Được cập nhật tại chỗ theo tên.                                              |
| Bản kê khai năng lực | Khai báo phạm vi truy cập theo từng tiện ích: `data` (liên kết chỉ đọc), `actions` (các động từ trong danh sách cho phép), `prompt` (gửi đến phiên), `net` (các nguồn gốc được phép).                      |
| Ghim (tiện ích)     | Di chuyển một tiện ích trong bản ghi hội thoại lên bảng của phiên (thao tác giao diện người dùng hoặc đối số công cụ của tác tử). Bỏ ghim sẽ xóa tiện ích khỏi bảng.                                         |
| Ghim (phiên)        | Cơ chế ghim phiên hiện có trong thanh bên. Phiên được ghim có bảng sẽ mở ở giao diện bảng.                                                                      |

## Luồng UX

- **Chuyển cấp:** tác tử gọi `show_widget` trong bất kỳ cuộc trò chuyện nào → tiện ích được kết xuất nội tuyến
  trong bản ghi hội thoại giống hệt hiện nay → di chuột sẽ hiển thị **Ghim vào bảng điều khiển** → tiện ích
  xuất hiện trên bảng của phiên. Tác tử có thể truyền `pin: true` để thực hiện tương tự.
- **Chế độ xem bảng:** phiên có bảng sẽ có nút chuyển đổi giao diện (Trò chuyện / Bảng điều khiển).
  Chế độ xem bảng = dải thẻ (chỉ khi có >1 thẻ) + lưới linh hoạt + khung trò chuyện được neo.
  Khung neo trò chuyện có thể đổi kích thước, di chuyển (trái/phải/dưới) và thu gọn giống hệt
  thanh bên. Trạng thái neo được ghi nhớ theo từng thẻ.
- **Kéo:** người dùng kéo các tiện ích; lưới tự động thu gọn (tiện ích nổi lên trên, các tiện ích lân cận
  tự sắp xếp lại). Đổi kích thước bằng tay cầm sẽ căn theo các mức kích thước. Không định vị theo pixel — áp dụng cho
  tất cả mọi người.
- **Cảnh báo đặt lại:** `/new` / `/reset` trên phiên có bảng sẽ yêu cầu
  xác nhận trong giao diện web ("ngữ cảnh được đặt lại, bảng điều khiển vẫn được giữ") và giữ lại
  bảng.
- **Thanh bên:** các phiên được ghim sẽ kết xuất giao diện bảng khi có bảng.
  Bảng của phiên Trang chủ là "bảng điều khiển tác tử" mặc định.
- **Tương tác** (ba cấp, xem bên dưới): sự kiện trạng thái im lặng, lượt gửi
  lời nhắc hiển thị và trình kích hoạt tự động hóa.

## Các cấp tương tác

1. **Sự kiện trạng thái (mặc định).** Các tương tác giao diện tiện ích mà mô hình cần biết
   nhưng không cần phản hồi. `bridge.emitState({...})` nối thêm một thông báo phiên có cấu trúc
   (cùng cơ chế với thông báo hoạt động nhóm). Không bắt đầu lượt tác tử;
   mô hình sẽ thấy các thông báo đã tích lũy trong lần chạy tiếp theo.
2. **Lời nhắc (trò chuyện tường minh).** `bridge.sendPrompt(text)` — yêu cầu người dùng
   kích hoạt; gửi một tin nhắn người dùng hiển thị vào phiên (khung trò chuyện được neo
   sẽ hiển thị tin nhắn đó). Có giới hạn tốc độ; mỗi lượt gửi đều được người dùng xác nhận trừ khi tiện ích có
   quyền năng lực `prompt`.
3. **Tự động hóa.** `bridge.runAction(name, args)` — kích hoạt một
   hành động được khai báo trong bản kê khai. Tập động từ ban đầu: `cron.trigger` (chạy ngay một tác vụ Cron hiện có) và
   `binding.refresh`. Các tác vụ Cron vốn đã chạy trong các phiên chạy riêng biệt, hiển thị
   và có thể sử dụng mô hình rẻ hơn: đó là con đường "mô hình nhỏ vận hành tiện ích".
   Không có phiên ẩn ở bất kỳ đâu.

## Mô hình và dịch vụ lưu trữ tiện ích

HTML/JS của tiện ích do tác tử tạo (thường thông qua `show_widget`), được bao bọc
trong lớp vỏ tài liệu tiêu chuẩn (thẻ meta CSP, trình báo cáo kích thước, bộ khởi tạo cầu nối) và
được kết xuất trong `<iframe sandbox="allow-scripts">` (không bao giờ trong `allow-same-origin`).

- **Tiện ích nội tuyến (bản ghi hội thoại)** giữ nguyên pipeline tài liệu canvas hiện tại:
  được ghi trong thư mục trạng thái, được Gateway phục vụ, được dọn theo phạm vi, không cần
  phê duyệt (theo thiết kế, chúng không có năng lực — lượt gửi lời nhắc được người dùng xác nhận).
- **Tiện ích bảng** là trạng thái phiên: các byte nằm trong DB SQLite của tác tử sở hữu
  (`board_widgets`), được phục vụ bởi một tuyến Gateway lõi
  (`/__openclaw__/board/<agentId>/<sessionKey>/<name>/`) đọc DB.
  Việc ghim một tiện ích trong bản ghi hội thoại sẽ sao chép các byte. Giới hạn: 256 KB cho mỗi tiện ích,
  48 tiện ích cho mỗi bảng.
- **Cập nhật tại chỗ:** phát lại một tiện ích có cùng `name` sẽ thay thế
  các byte, tăng `revision`, phát `board.changed`, và các chế độ xem đang hoạt động chỉ tải lại
  iframe đó.
- **Đóng băng byte:** các năng lực đã cấp được liên kết với sha256 của các byte tiện ích.
  Việc thay đổi byte chỉ giữ lại quyền `data`/`net`/`actions` nếu bản sửa đổi mới
  khai báo một tập con của bản kê khai đã được cấp; bản kê khai được mở rộng sẽ
  nhắc lại người vận hành.

### Tiện ích lưu trữ nội dung; ứng dụng MCP là một loại nội dung

**Tiện ích là thành phần nguyên thủy của OpenClaw**: ô bảng có tên, được ghim, có kích thước,
thuộc sở hữu của phiên và có bản ghi cấp quyền. Nội dung được kết xuất bên trong là một
loại nội dung:

- `html` — do tác tử tạo thông qua `show_widget`, các byte nằm trong bộ nhớ bảng.
- `mcp-app` — chế độ xem ứng dụng MCP của bên thứ ba (tài nguyên `ui://` từ máy chủ
  đã cấu hình) được lưu trữ bên trong ô tiện ích.

Ứng dụng MCP không định nghĩa mô hình tiện ích; tiện ích được bổ sung khả năng lưu trữ
chúng. Danh tính, vị trí, trạng thái ghim, quyền cấp và API dành cho tác giả vẫn
thuộc về OpenClaw — vì vậy mã `show_widget` vẫn ngắn gọn như hiện nay và không bao giờ
cần biết đặc tả MCP Apps tồn tại.

Hạ tầng dùng chung bên dưới (đây là nơi sự đơn giản hóa được áp dụng):

- **Một máy chủ hộp cát.** Tiện ích `html` được kết xuất thông qua cùng pipeline đã gia cố
  được phát hành cùng các ứng dụng MCP (iframe kép trên nguồn gốc hộp cát chuyên dụng,
  CSP theo từng tiện ích được khai báo và giải mã theo cơ chế đóng khi lỗi) thay vì một
  máy chủ iframe chuyên biệt thứ hai. Proxy nhận HTML theo giá trị, vì vậy nội dung cục bộ là
  trường hợp tự nhiên.
- **Một mô hình ủy quyền.** Phạm vi truy cập của tiện ích là một danh sách cho phép đã được cấp,
  bất kể loại của nó: đối với tiện ích `html`, các công cụ máy chủ; đối với tiện ích `mcp-app`,
  các công cụ mà ứng dụng của máy chủ có thể thấy (thông qua cơ chế `allowedAppToolNames`
  hiện có, được duy trì lâu dài theo từng tiện ích thay vì theo từng lần chạy tạo).
- **Công cụ máy chủ cho tiện ích `html`** (được cung cấp qua cầu nối tiện ích, được kiểm tra
  theo quyền cấp):
  - `openclaw.prompt.send` — cấp 2; được định tuyến qua trình soạn thảo hiển thị,
    được người dùng xác nhận trừ khi đã được cấp quyền
  - `openclaw.state.emit` — thông báo phiên cấp 1 (được gộp, giới hạn kích thước)
  - `openclaw.data.read` — các liên kết chỉ đọc được tham số hóa (tập RPC đọc
    trong danh sách cho phép hiện có), được phân giải phía Gateway
  - `openclaw.cron.trigger` — tự động hóa cấp 3
- **`net` = CSP.** Phạm vi truy cập mạng sử dụng khai báo CSP theo từng tiện ích
  đã được phát hành (`connect-src` nguồn gốc) — tiện ích thời tiết tự cập nhật
  tìm nạp API trực tiếp từ hộp cát, không có sự tham gia của Gateway.
- **Quyền cấp.** Tiện ích không khai báo gì sẽ được kết xuất ngay lập tức (được cách ly,
  `default-src 'none'`, từng lượt gửi lời nhắc được xác nhận riêng) — cùng mức độ tin cậy với
  các tiện ích trò chuyện nội tuyến hiện nay. Các công cụ/nguồn gốc đã khai báo đưa tiện ích vào
  `pending` trên bảng: một thẻ giữ chỗ liệt kê chúng theo cách con người có thể đọc, với thao tác một chạm
  **Cho phép**/**Từ chối**. Quyền cấp áp dụng theo tên tiện ích; đối với tiện ích `html`,
  chúng được đóng băng theo byte (sha256), và các byte thay đổi chỉ giữ quyền cấp nếu
  khai báo đã thu hẹp.
- **Lớp tương thích cho tác giả.** Lớp bao tài liệu chèn `window.openclaw.prompt`,
  `window.openclaw.state`, `window.openclaw.data` và `window.openclaw.cron`
  làm API ổn định dành cho tác giả. Các lệnh gọi bảng điều khiển dùng chung một kênh yêu cầu
  được liên kết với vé chế độ xem; báo cáo kích thước và token chủ đề vẫn là các thông báo
  máy chủ riêng biệt.

### Khai báo năng lực của Plugin

Các Plugin đã bật có thể mở rộng máy chủ tiện ích thông qua `dashboard.dataBindings`
và `dashboard.actionVerbs` trong `openclaw.plugin.json`. ID cục bộ của Plugin trở thành
tên quyền cấp có tiền tố là ID Plugin, chẳng hạn như `workboard.cards.list` và
`workboard.dispatch`; `%` và `.` trong đoạn ID Plugin được thoát để một
cách phân chia Plugin/ID cục bộ khác không thể kế thừa cùng quyền cấp đã lưu. Trong quá trình
đăng ký Plugin, OpenClaw xác minh rằng mọi liên kết đều nhắm đến một RPC
được cùng Plugin đăng ký bằng `operator.read` và mọi hành động đều nhắm đến một RPC
được đăng ký bằng `operator.write`; khai báo không hợp lệ khiến quá trình tải Plugin thất bại. Sổ đăng ký đã xác thực
chỉ được xây dựng lại khi vòng đời Plugin thay đổi, trong khi quyền cấp tiện ích
vẫn áp dụng theo từng tiện ích và được liên kết với cả byte lẫn bản sửa đổi.

### Hạn chế còn lại đã được mô hình hóa: kênh dữ liệu WebRTC

CSP của hộp cát phát ra chỉ thị `webrtc 'block'` được đề xuất, nhưng
[tập chỉ thị CSP hiện tại của Chromium](https://chromium.googlesource.com/chromium/src/+/main/services/network/public/mojom/content_security_policy.mojom#95)
không triển khai chỉ thị này. Do đó, các tiện ích có thể lập trình có thể sử dụng kênh dữ liệu
WebRTC để truyền dữ liệu ra ngoài trong Chromium hiện tại. Hạn chế tương tự đã được phát hành cho
các tiện ích trò chuyện nội tuyến và máy chủ MCP Apps trên `main`.

**Đánh đổi được chấp nhận:** OpenClaw không chặn các widget có thể lập trình dựa trên
phần tồn dư này. Nội dung widget chỉ có quyền truy cập vào dữ liệu nhạy cảm của OpenClaw thông qua
một capability `data:read` được người vận hành cấp và cố định theo từng byte, còn sandbox
Permissions Policy chặn quyền truy cập camera và micrô. Biện pháp bảo vệ API DOM là
cơ chế phòng thủ nhiều lớp theo nỗ lực tối đa, không phải ranh giới bảo mật, và thuộc về
công việc tăng cường bảo mật tiếp theo.

### Hiển thị bản ghi hội thoại: một thẻ widget

Hiển thị nội tuyến được hợp nhất trên primitive widget. Khi kết quả công cụ mang theo UI —
đầu ra `show_widget` hoặc kết quả công cụ MCP có tài nguyên ứng dụng — hệ thống
hiện thực hóa một **widget tạm thời, được tự động đặt tên** (giới hạn trong phiên, được dọn bỏ) và
bản ghi hội thoại hiển thị một thẻ widget duy nhất, phân nhánh theo loại nội dung.
Cơ chế tự động hiển thị ứng dụng MCP vẫn hoàn toàn đúng như đặc tả mong đợi (không phát sinh thêm công việc cho mô hình);
bên dưới, nó đơn giản _chính là_ một widget. Cách này loại bỏ các trường hợp đặc biệt `mcpApp`
song song trong quá trình kết xuất trò chuyện (kiểm soát theo bề mặt, chống trùng lặp riêng), cung cấp cho mọi
UI nội tuyến cùng một thao tác ghim và biến sổ đăng ký widget thành
đường dẫn chính để mở lại (tái dựng bằng cách quét bản ghi hội thoại vẫn là phương án dự phòng cho
lịch sử chưa từng được ghim). Máy chủ độc lập chỉ đọc dùng phiếu truy cập có phần chức năng trùng với board dưới vai trò
bề mặt mở lại lâu dài — đây là ứng viên hợp nhất cần đánh giá trong T6, không được
mặc định coi là sẽ hợp nhất.

Bố cục kết hợp: v1 sử dụng các ô lưới liền kề (widget giao diện agent nằm cạnh widget ứng dụng trên
một tab). v2 bổ sung **các vùng ứng dụng do máy chủ quản lý** — HTML của widget agent khai báo một
vùng dành sẵn và máy chủ ghép chế độ xem ứng dụng thực thành một sandbox ngang hàng.
Ứng dụng không bao giờ kết xuất bên trong iframe của agent: việc lồng nhau sẽ phá vỡ
định danh cầu nối và cho phép phủ lớp/clickjack UI ứng dụng đã được cấp quyền, vì vậy vùng dành sẵn là một
hợp đồng bố cục, không phải nội dung nhúng.

### Widget lấy từ máy chủ (ứng dụng MCP đã ghim)

Với máy chủ hợp nhất, việc ghim ứng dụng MCP của bên thứ ba đơn giản là tạo một widget có
nội dung được truy xuất từ máy chủ thay vì được lưu trữ: `board_widgets` giữ lại
bộ mô tả (`serverName`, `toolName`, `uiResourceUri`, `toolCallId` +
`sessionKey` nguồn) thay vì các byte HTML, và board cấp lại hợp đồng thuê chế độ xem
sau TTL 10 phút của lượt trò chuyện (truy xuất lại tài nguyên `ui://`
khi đã cũ). Các chế độ xem ứng dụng MCP nội tuyến trong trò chuyện có cùng thao tác **Ghim vào bảng điều khiển**
như widget agent. Theo thiết kế hiện tại, các chế độ xem được mở lại chỉ có quyền đọc;
những ứng dụng đã ghim cần duy trì khả năng tương tác sẽ nhận một quyền cấp lâu dài đối với các công cụ
hiển thị cho ứng dụng của máy chủ (danh sách cho phép rõ ràng được hiển thị cho người vận hành khi ghim), tách biệt
khỏi lượt chạy cấp quyền. Các mục ghim chưa được cấp quyền vẫn ở chế độ chỉ đọc — vẫn hữu ích cho
các bảng điều khiển hiển thị. v1 ghim vào board của phiên nguồn; việc ghim
chéo phiên cần một trình môi giới hợp đồng thuê và phải chờ. Phối hợp với pull request đang mở #109807 (định tuyến
trình soạn thảo `ui/message`, truyền giao diện/kích thước).

### Tích hợp WorkBoard

Chương trình tích hợp WorkBoard giữ cho các thẻ và board thuộc quyền sở hữu của plugin, đồng thời liên kết các thẻ đã được điều phối trở lại board của phiên tương ứng thông qua `sessionKey` và `runId` hiện có, cung cấp các nguồn cấp và hoạt động điều phối WorkBoard qua các liên kết và hành động do plugin khai báo, đồng thời kết hợp những kết quả đó với các loại widget `html` và `mcp-app` hiện có thay vì đưa vào một loại widget dành riêng cho WorkBoard.

## Bố cục: lưới linh hoạt

12 cột, chiều cao hàng cố định, **tự động thu gọn** (dồn lên trên, đẩy sang bên khi
kéo — ngữ nghĩa gridstack, được triển khai nguyên bản; phép toán lưới vẫn thuần túy và
không phụ thuộc DOM). Trạng thái bố cục widget theo từng tab: `{ name, w (1-12), h (rows) }` cùng với
thứ tự. Từ vựng của agent:

- `size`: `sm` (3×3) · `md` (6×4) · `lg` (8×6) · `xl` (12×8) · `full`
  (tab một widget)
- `after: <widgetName>` điểm neo thứ tự tùy chọn; bỏ qua = nối thêm
- Người dùng tự do kéo/thay đổi kích thước; cùng một mô hình thứ tự+kích thước được tuần hoàn hai chiều.

## Mô hình dữ liệu (DB theo từng agent)

Các bảng mới trong `agents/<agentId>/agent/openclaw-agent.sqlite`
(**yêu cầu tăng phiên bản schema của DB agent — cần người vận hành phê duyệt
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

Board tồn tại khi có bất kỳ hàng nào cho `sessionKey`. Việc xóa một phiên sẽ xóa các
hàng board của phiên đó. `/new`/`/reset` không tác động đến chúng.

## Bề mặt giao thức

RPC (bảng phương thức cốt lõi, các schema typebox trong `gateway-protocol`):

- `board.get { sessionKey }` → các tab + siêu dữ liệu widget (không có byte) — `operator.read`
- `board.update { sessionKey, ops[] }` — CRUD/sắp xếp lại tab, di chuyển/đổi kích thước/
  xóa/bỏ ghim widget, trạng thái dock, tab được lấy nét — `operator.write`
- `board.widget.put { sessionKey, name, html, manifest, placement }` —
  `operator.write` (đường dẫn công cụ agent và đường dẫn ghim)
- `board.widget.grant { sessionKey, name, decision }` — `operator.approvals`
- `board.event { ticket, payload }` — tiếp nhận sự kiện trạng thái bậc 1 gắn với ticket;
  cấu trúc `{ sessionKey, widget, payload }` cũ dành cho máy chủ đáng tin cậy vẫn được giữ nguyên —
  `operator.write`
- `board.prompt.authorize { ticket }` — trả về liệu thao tác gửi prompt hiển thị
  có còn cần xác nhận cho từng lần nhấp hay không — `operator.read`
- `board.data.read { ticket, bindingId, params? }` — phân giải liên kết đọc phía gateway
  cho lõi hoặc plugin đang hoạt động thuộc danh sách cho phép — `operator.read`
- `board.action { ticket, action, ... }` — điều phối tự động hóa theo đúng quyền cấp
  thông qua đường dẫn chạy ngay cron hiện có hoặc động từ hành động đã xác thực
  của một plugin đang hoạt động — `operator.write`

Sự kiện (trong `EVENT_SCOPE_GUARDS`, phạm vi đọc):

- `board.changed { sessionKey, revision, widget? }` — trạng thái được lưu bền vững đã thay đổi;
  UI tìm nạp lại (và tải lại một iframe khi có `widget`).
- `board.command { sessionKey, command }` — điều khiển UI tạm thời (agent chuyển
  tab hiển thị, bật/tắt dock trò chuyện) — mẫu `ui.command`.

Các byte của widget được phân phối qua bề mặt HTTP đã xác thực, không phải socket.

## Công cụ agent

Tổng cộng ba công cụ (thuộc lõi, luôn được đăng ký; việc kết xuất phụ thuộc vào
khả năng máy khách `inline-widgets` như hiện nay):

- `show_widget { title, widget_code, name?, pin?, size?, tab?, after?,
capabilities? }` — tạo/cập nhật theo tên; `pin` đặt widget lên bảng.
  Khi không có `name`/`pin`, công cụ hoạt động chính xác như hiện nay (nội tuyến, tạm thời).
- `dashboard { action, ... }` — các động từ quản lý bảng: `read`, `tab_create`,
  `tab_update`, `tab_delete`, `tabs_reorder`, `widget_move`, `widget_remove`,
  `unpin`, `focus_tab`, `set_chat_dock`.
- Các công cụ `cron` hiện có đáp ứng bậc tự động hóa; không cần công cụ mới.

Mô tả công cụ hướng dẫn từ vựng về kích thước/điểm neo và mô hình phân bậc. Agent
được thông báo về các sự kiện bậc 1 của người dùng qua thông báo phiên, ví dụ:
`[dashboard] user clicked "Refresh" on widget weather (tab main)`.

## Nội dung được thay thế

- **`extensions/workspaces` bị xóa.** Tính năng thử nghiệm, `enabledByDefault:
false`, chưa từng có trong bản phát hành ổn định (xuất hiện lần đầu trong các bản beta 2026.7.2). Không
  di chuyển dữ liệu; một quy tắc doctor xóa `<stateDir>/workspaces/` cũ nếu có.
  Các ý tưởng được tận dụng: phép toán lưới thuần túy, mô hình bảo mật cầu nối (khởi tạo cổng,
  kiểm soát liên kết, giới hạn tốc độ), phê duyệt với byte được cố định.
- **Dịch vụ lưu trữ widget được chuyển từ `extensions/canvas` vào lõi.** Kho
  tài liệu canvas, trình bao tài liệu, dịch vụ HTTP và công cụ `show_widget` trở thành thành phần lõi
  (`src/canvas/`); plugin giữ lại công cụ điều khiển node-canvas (`canvas`) và
  A2UI. Quảng bá `pluginSurfaceUrls["canvas"]` và
  các đường dẫn `/__openclaw__/canvas` là hợp đồng máy khách gốc đã phát hành và vẫn
  ổn định. Các phiên Discord giữ lại biến thể `show_widget` do Discord sở hữu.

## Ngoài phạm vi (chương trình này)

- Chia sẻ bảng/ACL giữa nhiều người dùng (trong tương lai; sẽ được cung cấp qua tính năng chia sẻ phiên).
- Kết xuất bảng gốc trên macOS/iOS (có sẵn ở mọi nơi chúng nhúng
  Control UI; đường dẫn widget nội tuyến không thay đổi).
- Các widget dữ liệu tích hợp sẵn (thẻ phiên/mức sử dụng/cron) — cầu nối khả năng cùng
  các widget do agent tạo đáp ứng v1; sổ đăng ký loại tích hợp sẵn có thể được bổ sung sau.

## Kế hoạch triển khai

Các worktree độc lập, được xây dựng bằng Codex, review+land tuần tự. Land rồi sửa.

| #   | Nhánh                                | Phạm vi                                                                                                                                                                            | Phụ thuộc                        |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| T1  | `claude/dashboard-remove-workspaces` | Xóa plugin workspaces + UI + tài liệu + khóa i18n; quy tắc dọn dẹp doctor                                                                                                          | —                                |
| T2  | `claude/dashboard-canvas-core`       | Đưa dịch vụ lưu trữ widget + `show_widget` vào lõi; plugin canvas giữ lại công cụ node; không thay đổi hành vi                                                                    | —                                |
| T3  | `claude/dashboard-domain`            | Các bảng DB của agent (tăng phiên bản schema), RPC `board.*` + sự kiện, công cụ `dashboard`, đối số ghim/tên/manifest `show_widget`, thông báo bậc 1, đặt lại nhưng giữ bảng | T2                               |
| T4  | `claude/dashboard-ui`                | Giao diện bảng + dải tab + lưới tự động thu gọn linh hoạt + dock trò chuyện (trái/phải/dưới/ẩn) + chức năng ghim bản chép lời + giao diện bảng ở thanh bên + xác nhận đặt lại          | T3 (ưu tiên mock qua fixture phát triển) |
| T5  | `claude/dashboard-capabilities`      | Kho/UI quyền cấp + cố định byte; chuyển các widget `html` sang máy chủ sandbox dùng chung; công cụ máy chủ (`openclaw.prompt.send/state.emit/data.read/cron.trigger`); CSP `net`; shim biên soạn | T3, T4                           |
| T7  | `claude/dashboard-mcp-apps`          | Loại nội dung `mcp-app`: chức năng ghim trên các chế độ xem ứng dụng nội tuyến, lưu trữ bộ mô tả, cấp lại/làm mới lease, quyền cấp công cụ máy chủ bền vững (tái sử dụng máy chủ MCP Apps đã phát hành) | T3, T4                           |
| T6  | hoàn thiện                           | E2E trực tiếp trên một gateway tạm (khóa thật), ảnh chụp màn hình, sửa lỗi, viết lại `/web/dashboard` tập trung vào người dùng, review việc bật theo mặc định                        | tất cả                           |

Xác thực theo quy tắc của kho lưu trữ: chạy vitest tập trung cục bộ, chạy đầy đủ các cổng kiểm tra trên
Crabbox/Testbox, `$autoreview` trước mỗi lần land, bằng chứng trực tiếp cho T6.
