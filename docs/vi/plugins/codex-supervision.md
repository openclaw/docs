---
read_when:
    - Bạn muốn các phiên Codex Desktop hoặc CLI xuất hiện trong OpenClaw
    - Bạn cần tạo nhánh từ hoặc lưu trữ một phiên Codex cục bộ đã lưu hoặc đang không hoạt động
    - Bạn đang hiển thị các phiên Codex và lịch sử bản ghi từ các Node đã ghép nối
sidebarTitle: Codex supervision
summary: Duyệt các phiên Codex gốc chưa được lưu trữ và bản ghi được phân trang trên các Node OpenClaw
title: Giám sát các phiên Codex
x-i18n:
    generated_at: "2026-07-19T05:51:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f365e3207dff092c3dfd8f7588d60d70a16f0cce484991eb4ab3fc0bd15f8051
    source_path: plugins/codex-supervision.md
    workflow: 16
---

Giám sát Codex là một khả năng cần chủ động bật của plugin `codex` chính thức. Khả năng này
hiển thị các phiên nguồn Codex CLI, VS Code, Atlas và ChatGPT chưa được lưu trữ từ
máy tính Gateway và các máy tính đã ghép đôi có bật tính năng này trong thanh bên phiên
và ngăn Chat thông thường.

Bản phát hành đầu tiên chủ ý giới hạn phạm vi quyền sở hữu:

- Một phiên cục bộ đã lưu hoặc đang rảnh có thể tạo một Chat OpenClaw bị khóa theo mô hình từ
  lịch sử người dùng và trợ lý được duy trì, có giới hạn của phiên đó. Tin nhắn đầu tiên bắt đầu một
  nhánh rẽ ảnh chụp nhanh gốc, sau đó khởi chạy toàn bộ luồng bộ khung Codex với chính xác
  mô hình và nhà cung cấp mà Codex App Server đã chọn cho nhánh rẽ đó. Các
  lượt sau khôi phục cặp đã duy trì của luồng gốc chính tắc, trong khi
  liên kết được giám sát ngăn OpenClaw thay thế bằng runtime,
  mô hình hoặc phương án dự phòng khác. Một điều khiển Codex gốc riêng biệt vẫn có thể thay đổi
  cặp đã duy trì đó. Một nhánh đã được tạo sẽ mở Chat hiện có của nó.
- Một phiên đã lưu được phát hiện từ tiến trình Codex khác có hoạt động trực tiếp
  không xác định. Phiên đó có thể tạo nhánh hoặc chỉ có thể được lưu trữ sau khi người vận hành
  xác nhận rằng không có máy khách Codex nào khác đang sử dụng phiên.
- Một nguồn đang hoạt động vẫn hiển thị nhưng không thể tạo nhánh hoặc được lưu trữ cho đến khi
  lượt hiện tại hoàn tất. Nếu nguồn đã có Chat được giám sát, **Mở Chat**
  vẫn khả dụng.
- Một phiên trên Node đã ghép đôi cung cấp bản chép lời được duy trì thông qua các lượt đọc App Server
  có giới hạn và phân trang bằng con trỏ. Tiếp tục từ xa
  cần một cầu nối Node truyền phát trong tương lai; lưu trữ từ xa còn cần
  hợp đồng thuê quyền sở hữu trình chạy hoặc cơ chế rào chắn tương đương.
- Các phiên đã lưu trữ không được liệt kê. Một phiên cục bộ đã lưu hoặc đang rảnh chỉ có thể được
  lưu trữ sau khi người vận hành xác nhận rằng không có máy khách Codex nào khác đang sử dụng
  phiên đó.

## Trước khi bắt đầu

- Cài đặt plugin `@openclaw/codex` chính thức trên Gateway. Ứng dụng OpenClaw
  dành cho macOS có thể cài đặt plugin khi bạn bật các tính năng Codex; các bản cài đặt CLI có thể
  chạy `openclaw plugins install @openclaw/codex`.
- Cài đặt và đăng nhập vào Codex Desktop hoặc Codex CLI trên mỗi máy tính có
  phiên mà bạn muốn liệt kê.
- Ghép đôi các máy tính từ xa dưới dạng Node OpenClaw. Mỗi máy tính phải chủ động bật tính năng ở cục bộ;
  chỉ bật giám sát trên Gateway không cấp quyền cho Node khác.
- Sử dụng Gateway do chủ sở hữu kiểm soát. Tiêu đề phiên, thư mục làm việc và các nhánh Git
  có thể tiết lộ thông tin dự án nhạy cảm.

## Bật giám sát

Quy trình `openclaw onboard` có hướng dẫn và thiết lập lần chạy đầu tiên trên macOS sẽ cố gắng cài đặt và
bật giám sát Codex sau khi phát hiện bản cài đặt Codex gốc và
kích hoạt thành công backend suy luận đã chọn. Codex không cần phải là
backend chính. Tính năng giám sát sẽ khả dụng khi lần kích hoạt
plugin theo cơ hội đó thành công. Tính khả dụng của App Server được kiểm tra khi
giám sát kết nối lần đầu. Việc vô hiệu hóa rõ ràng plugin Codex hoặc chặn bằng chính sách
sẽ ngăn kích hoạt theo cơ hội, còn một thiết lập `supervision.enabled: false`
rõ ràng hiện có sẽ vô hiệu hóa các công cụ giám sát dành cho tác nhân;
danh mục người vận hành vẫn được đăng ký bất cứ khi nào plugin Codex hoạt động, trừ khi
`sessionCatalog.enabled: false` vô hiệu hóa danh mục đó. Công tắc riêng biệt này giữ nguyên
nhà cung cấp Codex, bộ khung và chính sách giám sát dành cho tác nhân, đồng thời
cũng loại bỏ các lệnh liệt kê/đọc danh mục Node đã ghép đôi khỏi máy chủ này.
Các bản cài đặt hiện có có thể bật thủ công cùng khả năng này:

Bật plugin `codex` và khả năng giám sát của plugin trong `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Nếu có `plugins.allow`, hãy bao gồm `codex`. Khởi động lại Gateway sau khi
thay đổi trạng thái kích hoạt plugin.

Khi không có thiết lập kết nối `appServer` rõ ràng, tính năng giám sát sử dụng một
kết nối giám sát stdio được quản lý riêng với thư mục Codex gốc của người dùng. Theo mặc định,
bộ khung Codex thông thường vẫn có phạm vi theo tác nhân. Điều này giúp các
phiên gốc hiển thị trong cả hai ứng dụng mà không khiến các lượt OpenClaw thông thường chia sẻ
trạng thái Codex gốc. Đặt rõ ràng `appServer.homeScope: "user"` nếu bộ khung
cũng cần chia sẻ trạng thái đó. Tính năng giám sát tuân theo các thiết lập kết nối `appServer`
rõ ràng thay vì thay thế chúng bằng mặc định thư mục người dùng cục bộ.

Một Chat được tiếp nhận từ nhóm **Codex** trong thanh bên không phải là một phiên bộ khung thông thường.
Liên kết giám sát riêng của Chat sử dụng kết nối giám sát để đọc
nguồn, tạo nhánh chính tắc, chèn lịch sử và thực hiện mọi lượt về sau. Với
kết nối cục bộ mặc định, điều này duy trì thư mục Codex gốc của người dùng, thông tin xác thực
và cấu hình nhà cung cấp mà không thay đổi mặc định cho các phiên khác.
Các Chat được tiếp nhận và theo dõi cũng tham gia vào [nhận biết trạng thái phiên](/vi/concepts/session-state).

Đối với kết nối giám sát cục bộ mặc định, kho lưu trữ được chia sẻ với các
máy khách Codex gốc. OpenClaw không giả định rằng một máy khách khác chia sẻ cùng một
tiến trình App Server đang hoạt động, và quyền sở hữu trạng thái gốc có phạm vi cục bộ theo tiến trình. Vì vậy,
OpenClaw coi luồng mà App Server giám sát của mình báo cáo là `notLoaded` là
**Đã lưu / không xác định hoạt động**, chứ không phải đang rảnh.

Áp dụng cùng tùy chọn chủ động bật trên mọi máy chủ Node không giao diện có phiên cần xuất hiện.
Ứng dụng OpenClaw gốc dành cho macOS đọc cùng thiết lập cục bộ khi quảng bá
danh mục Codex của mình đến Gateway đã ghép đôi. Danh mục máy Mac gốc đã ghép đôi đó chỉ hỗ trợ
`appServer.transport: "stdio"` mặc định hoặc rõ ràng với `appServer.homeScope: "user"` chưa đặt hoặc
được đặt rõ ràng. `command`, `args` và `clearEnv` được
tuân thủ cho tiến trình stdio đó. Nếu cấu hình Mac chọn `"unix"`,
`"websocket"` hoặc `homeScope: "agent"`, ứng dụng sẽ không quảng bá khả năng
hoặc lệnh danh mục, và một lệnh gọi trực tiếp đã lỗi thời sẽ thất bại thay vì làm lộ
thư mục Codex gốc của người dùng hoặc tạo một App Server stdio cục bộ khác.

Một lệnh Node mới được quảng bá sẽ thay đổi bề mặt lệnh được phê duyệt của Node.
Phê duyệt bản cập nhật từ máy chủ Gateway:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Các phiên Codex chưa lưu trữ cũng xuất hiện trong thanh bên chính của Control UI, được nhóm
theo máy chủ. Chọn một phiên để đọc bản chép lời được duy trì của phiên đó. Trình xem sử dụng API
`thread/turns/list` Codex mới nhất với `itemsView: "full"` và tải tối đa 20 lượt
mỗi yêu cầu; **Tải các mục bản chép lời cũ hơn** đi theo con trỏ App Server không rõ cấu trúc từ trang mới nhất.
Các trang đã tải được hiển thị theo thứ tự thời gian. Trình xem không bao giờ tải lịch sử
`thread/read` không giới hạn. Một trang vượt quá mức trần an toàn truyền tải 20 MiB sẽ thất bại
theo hướng đóng an toàn thay vì gây rủi ro cho kết nối Node hoặc Gateway.

Mở nhóm **Codex** trong thanh bên phiên thông thường. Nhóm này liệt kê cùng các phiên
được nhóm theo máy chủ. **Tải thêm phiên** nối thêm trang tiếp theo từ mỗi máy chủ
có các hàng cũ hơn, và những hàng được nối thêm đó vẫn tồn tại qua các lần làm mới định kỳ của thanh bên.
Mỗi máy chủ xuất hiện ngay khi quá trình liệt kê gốc của chính máy chủ đó ổn định. Trang đang hiển thị
được đối chiếu lại sau khi trạng thái kết nối Node thay đổi, khi lấy lại tiêu điểm và tối đa
mỗi 30 giây; một kết quả thay đổi sẽ kích hoạt lượt theo dõi nhanh hơn. Do đó, các phiên được tạo
trong Codex Desktop, CLI hoặc máy khách gốc khác sẽ xuất hiện mà không cần
tải lại toàn bộ trang. Trang đầu tiên tuân theo thứ tự cập nhật gần đây nhất của chính Codex,
vì vậy một phiên gốc mới tạo sẽ đủ điều kiện xuất hiện ngay lập tức.
Mỗi trang tìm kiếm trả về sẽ quét số lượng trang gốc có giới hạn trên mỗi máy chủ thay vì
gửi truy vấn đến App Server, vì tìm kiếm gốc cũng có thể khớp với
bản xem trước bản chép lời.

Tính khả dụng của máy chủ và trạng thái luồng là riêng biệt. **Ngoại tuyến** hoặc **Không khả dụng**
mô tả một lần làm mới máy chủ; máy chủ không khả dụng không trả về hàng phiên mới
và không đổi trạng thái gốc của luồng thành `offline`. Các hàng phiên sử dụng trạng thái Codex
như `idle`, `active`, `notLoaded` hoặc lỗi. Một máy chủ bị lỗi không
ẩn kết quả từ các máy chủ hoạt động bình thường.

Cảnh báo trên thanh bên bao gồm mã lỗi danh mục và lỗi Gateway cơ sở
an toàn. Mở **Settings > Automation > Plugins > Codex > Native Session
Discovery** để vô hiệu hóa tính năng khám phá mà không vô hiệu hóa Codex. Đối với
`NODE_LIST_FAILED`, hãy so sánh `openclaw nodes list` và **Settings > Devices**;
nguyên nhân chi tiết xác định lỗi kho ghép đôi, sổ đăng ký Node, quyền hoặc
vòng đời Gateway cần được sửa chữa.

## Sử dụng CLI dành cho người vận hành

CLI trong terminal cung cấp cùng danh mục chưa lưu trữ cũng như các hành động tạo nhánh
và lưu trữ cục bộ trên Gateway:

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

Các tùy chọn `openclaw codex sessions`:

- `--search <text>` tìm kiếm tiêu đề phiên mà không phân biệt chữ hoa chữ thường.
- `--host <id>` giới hạn phản hồi trong một máy chủ danh mục ổn định, chẳng hạn như
  `gateway:local` hoặc `node:<node-id>`.
- `--limit <count>` đặt từ 1 đến 100 hàng trên mỗi máy chủ; mặc định là 50.
- `--cursor <cursor>` tiếp tục một trang của máy chủ và do đó yêu cầu `--host`.
- `--json` in phản hồi Gateway có cấu trúc.

Cả ba lệnh đều kế thừa `--url`, `--token` và `--timeout <ms>` từ
máy khách Gateway. Thời gian chờ mặc định của việc liệt kê phiên là 75.000 ms để các
danh mục Node đã ghép đôi khởi động nguội có thể hoàn tất; thời gian chờ mặc định của thao tác tiếp tục và lưu trữ là 30.000 ms. Chúng cũng cung cấp công tắc
`--expect-final` dùng chung, công tắc này không thay đổi các RPC giám sát đơn phân này.
Mỗi lệnh yêu cầu phạm vi Gateway `operator.write`.
Đầu ra `-h, --help` tiêu chuẩn khả dụng trên từng lệnh con.
Không có tùy chọn đã lưu trữ hoặc bao gồm phiên đã lưu trữ. `sessions` có thể liệt kê các
máy chủ đã ghép đôi, nhưng `continue` và `archive` luôn nhắm đến `gateway:local`; các hàng đã ghép đôi
chỉ dùng để liệt kê. Thao tác lưu trữ luôn yêu cầu `--confirm-no-other-runner`.

Các lệnh shell này khác với các lệnh runtime `/codex` trong Chat.
`/codex threads [filter]` liệt kê các luồng App Server khả dụng cho kết nối
cuộc trò chuyện hiện tại. `/codex sessions --host <node>` liệt kê các tệp phiên Codex
CLI có thể tiếp tục trên một Node, không phải danh mục đội giám sát. `/codex
resume` và `/codex bind` đính kèm cuộc trò chuyện hiện tại thay vì tạo một
nhánh được giám sát an toàn, và Chat được giám sát bị khóa theo mô hình sẽ từ chối các
thay đổi liên kết đó. Không có lệnh runtime `/codex continue` hoặc `/codex archive`.

## Tạo nhánh từ phiên cục bộ

Chọn **Tiếp tục dưới dạng nhánh** trên một hàng đã lưu hoặc đang rảnh từ máy tính Gateway.
OpenClaw tạo một mục Chat thông thường, phản chiếu lịch sử người dùng và trợ lý có giới hạn
đến hết lượt được duy trì cuối cùng ở trạng thái kết thúc của nguồn (hoàn tất, bị gián đoạn hoặc
thất bại), ghi lại một nhánh bộ khung đang chờ xử lý và mở Chat. Bộ chọn mô hình chung
bị khóa, nhưng chưa có mô hình hoặc nhà cung cấp cụ thể nào được chọn. Nguồn
không được tiếp tục và luồng bộ khung chính tắc chưa được khởi chạy.
Việc lặp lại hành động sẽ mở Chat hiện có thay vì tạo
nhánh khác.

Bản phản chiếu giữ lại phần cuối hiển thị mới nhất đáp ứng cả ba giới hạn: tối đa 200
tin nhắn của người dùng hoặc trợ lý, tổng cộng 512 KiB văn bản UTF-8 và 64 KiB cho mỗi
tin nhắn. Tin nhắn quá lớn bị cắt ngắn kèm dấu đánh dấu, và các tin nhắn cũ hơn bị
bỏ qua khi đạt giới hạn. Đầu vào hình ảnh hoặc hình ảnh cục bộ trở thành phần giữ chỗ dạng văn bản
`[Image attachment]`; dữ liệu hình ảnh và đường dẫn cục bộ không được sao chép.

Gửi tin nhắn Chat thông thường đầu tiên để bắt đầu công việc. Harness Codex cài đặt
các trình xử lý phê duyệt, yêu cầu thông tin, sự kiện và phân phối thực tế. Harness sử dụng một
fork gốc tạm thời trên kết nối giám sát để ghim ảnh chụp nhanh nguồn mà không
cung cấp giá trị ghi đè mô hình hoặc nhà cung cấp. Codex App Server chọn cả hai từ
cấu hình gốc hiện tại và trả về lựa chọn thực tế. Trên cùng
kết nối đó, OpenClaw khởi động luồng harness đầy đủ chuẩn có nguồn `appServer`
trong cwd và theo chính sách runtime của nó với chính xác cặp được trả về đó, chèn
lịch sử hiển thị có giới hạn và lưu trữ fork tạm thời. Luồng chuẩn
có toàn bộ bề mặt công cụ harness OpenClaw. Đây là một nhánh lịch sử hiển thị, không phải
bản sao đầy đủ của rollout gốc: phần suy luận nguồn, lệnh gọi công cụ và kết quả công cụ
bị lược bỏ. Lượt này và mọi lượt sau đều duy trì trên kết nối Codex được giám sát
thay vì một runtime mô hình OpenClaw khác hoặc harness agent-home thông thường.

Lựa chọn được trả về không phải là bằng chứng về mô hình lịch sử của nguồn. Nếu
cấu hình gốc hiện tại khác với mô hình được ghi lại cho lượt cuối của nguồn,
Codex phát cảnh báo khác biệt mô hình thông thường. OpenClaw sử dụng
cặp được trả về để khởi động luồng chuẩn. Codex duy trì mô hình và nhà cung cấp
gốc của luồng chuẩn đó, đồng thời các lần tiếp tục sau vẫn giữ nguyên chúng vì
OpenClaw bỏ qua các giá trị ghi đè mô hình và nhà cung cấp. Nếu luồng chuẩn được thay đổi
thông qua một cơ chế điều khiển Codex gốc riêng biệt, OpenClaw chấp nhận
lựa chọn đã được Codex duy trì. OpenClaw không bao giờ thay thế bằng mô hình bên ngoài
hoặc chuỗi dự phòng của mình.

Chat được giám sát và khóa mô hình không thể bị xóa, chuyển đổi mô hình, sử dụng `/new`
hoặc `/reset`, gọi hành động đặt lại phiên của Gateway hay sử dụng hành động chung
**Fork phiên**. Việc thay đổi `/codex model <model>`, `/codex
bind`, `/codex resume` (bao gồm phiên Node với `--bind here`) và
`/codex detach` hoặc `/codex unbind` cũng bị từ chối vì chúng sẽ thay thế
hoặc xóa liên kết gốc đã khóa. Truy vấn `/codex model` cùng `/codex fast`,
`/codex permissions` và `/codex threads` vẫn khả dụng. Hãy bắt đầu một
phiên thông thường khác khi bạn muốn dùng mô hình khác hoặc luồng mới.

Duy trì bật chế độ giám sát cho Chat này. Nếu chế độ giám sát bị tắt hoặc
liên kết kết nối đã lưu của nó không còn khả dụng hay trở nên không nhất quán, lượt sẽ
đóng khi lỗi thay vì chuyển sang một phiên agent-home thông thường.

Việc tắt hoặc gỡ cài đặt Plugin `codex` không giải phóng quyền sở hữu đó hoặc
khiến Chat đủ điều kiện sử dụng mô hình khác. Chat đã khóa vẫn được giữ nguyên nhưng
không khả dụng; hãy cài đặt lại hoặc bật lại cùng Plugin và khởi động lại Gateway để
tiếp tục. Hành vi đóng khi lỗi có chủ đích này ngăn quá trình dọn dẹp lưu giữ hoặc
sự cố tạm thời của Plugin âm thầm khiến liên kết gốc mất chủ sở hữu.

Công cụ tác tử `codex_threads` tuân theo cùng ranh giới. Công cụ này không thể gắn một
fork khác hoặc lưu trữ luồng gốc đã liên kết của Chat. Thao tác liệt kê và đọc
chỉ siêu dữ liệu vẫn khả dụng. Việc đọc bản chép lời thô yêu cầu `allowRawTranscripts`.
Khi quyền truy cập thô bị tắt, `codex_threads` cũng từ chối tìm kiếm danh sách vì
tìm kiếm gốc bao gồm bản xem trước bản chép lời; Control UI và CLI dành cho người vận hành
vẫn cung cấp tìm kiếm chỉ theo tiêu đề có giới hạn. Đổi tên, bỏ lưu trữ, fork tách rời và
lưu trữ một luồng không liên quan và không thuộc sở hữu yêu cầu
`allowWriteControls`. Không tùy chọn nào bỏ qua liên kết đã khóa.

OpenClaw không đăng ký nhận hoặc phản hồi yêu cầu phê duyệt khi chỉ đang liệt kê
luồng nguồn hoặc hiển thị Chat đang chờ. Việc khởi động một luồng harness chuẩn riêng biệt
ở lượt đầu tiên cho phép một tiến trình Codex khác tiếp tục sở hữu
nguồn mà không tạo ra các trình ghi rollout cạnh tranh.

Nguồn CLI, VS Code, Atlas hoặc ChatGPT ban đầu vẫn hiển thị với các
máy khách gốc và danh mục OpenClaw. Nhánh chuẩn được lưu dưới dạng một
luồng Codex gốc, nhưng loại nguồn của nó là `appServer`; Codex Desktop hoặc một
máy khách gốc khác có thể lọc loại nguồn đó, vì vậy không bảo đảm bản thân nhánh
sẽ xuất hiện trong mọi chế độ xem lịch sử gốc.

Một hàng đang hoạt động do App Server của OpenClaw báo cáo không thể khởi động nhánh mới. Hãy đợi
lượt hiện tại hoàn tất rồi làm mới danh mục. Codex App Server
tuần tự hóa các thao tác thay đổi trong một tiến trình, nhưng không cung cấp trình chạy độc quyền
giữa các tiến trình hoặc lease dành cho chủ sở hữu phê duyệt.

Đối với hàng **Đã lưu / không rõ hoạt động**, bản sao Chat và thao tác ghim ảnh chụp nhanh
ở lượt đầu tiên sử dụng trạng thái của Codex đến hết lượt cuối đã được duy trì ở trạng thái kết thúc.
Luồng nguồn không được tiếp tục, ngắt hoặc lưu trữ. Nếu một tiến trình khác đang có
một lượt đang diễn ra, công việc mới nhất chưa hoàn tất của lượt đó có thể không xuất hiện trong nhánh.

## Lưu trữ một phiên cục bộ

Chọn **Lưu trữ** trên một hàng Gateway cục bộ đã lưu hoặc không hoạt động, sau đó xác nhận rằng không có
máy khách Codex hoặc trình chạy OpenClaw nào khác đang sử dụng luồng đó hoặc các luồng con
do nó tạo ra. OpenClaw đọc mới trạng thái cục bộ của tiến trình, chỉ tiếp tục đối với
`idle` hoặc `notLoaded`, gọi thao tác lưu trữ Codex gốc và xóa
phiên khỏi danh sách chưa lưu trữ. Codex gốc cũng cố gắng lưu trữ
các luồng con do luồng đó tạo ra.

Tính năng lưu trữ không khả dụng khi lần đọc mới báo cáo phiên đang hoạt động hoặc ở
trạng thái lỗi, khi phiên thuộc về một Node đã ghép nối hoặc khi một Chat được giám sát
mới tạo vẫn còn nhánh đang chờ từ nguồn đó. Hãy gửi tin nhắn đầu tiên của Chat để
hiện thực hóa nhánh chuẩn trước khi lưu trữ nguồn. Tính năng lưu trữ cũng bị chặn khi
OpenClaw biết rằng một liên kết đang hoạt động sở hữu chính xác luồng đích hoặc bất kỳ
luồng con chưa lưu trữ nào được tạo ra. OpenClaw theo dõi truy vấn luồng con Codex
thử nghiệm qua mọi trang; phản hồi không hợp lệ, yêu cầu thất bại, con trỏ hoặc luồng
lặp lại hay việc cạn giới hạn an toàn đều khiến thao tác lưu trữ bị từ chối.

Các yêu cầu đọc, liệt kê luồng con và lưu trữ không phải là một thao tác có điều kiện
duy nhất, vì vậy một lượt vẫn có thể bắt đầu giữa các yêu cầu đó. Trạng thái App Server cũng
không được chia sẻ giữa các tiến trình độc lập. Do đó, bước xác nhận là
ranh giới an toàn cho các máy khách không xác định và tình huống tranh chấp đó: hãy thoát hoặc xác minh
mọi máy khách khác trước khi xác nhận. Khôi phục một luồng đã lưu trữ bằng Codex
Desktop, Codex CLI hoặc luồng quản lý luồng gốc được chủ sở hữu cấp quyền;
luồng sẽ xuất hiện lại sau khi được bỏ lưu trữ.

```bash
codex unarchive <thread-id>
```

## Tìm hiểu giới hạn của Node đã ghép nối

Các Node đã ghép nối cung cấp các lệnh chỉ đọc có phiên bản
`codex.appServer.threads.list.v1` và
`codex.appServer.thread.turns.list.v1`. Các máy chủ Node gốc có
Codex CLI cũng cung cấp lệnh `codex.terminal.resume.v1` nằm trong danh sách cho phép.
Gateway nhận siêu dữ liệu đã chuẩn hóa và các trang bản chép lời có giới hạn
được yêu cầu rõ ràng, không bao giờ nhận các endpoint App Server thô. Việc mở một hàng trong
terminal dành cho người vận hành sẽ chạy `codex resume <thread-id>`
trên máy chủ sở hữu và chuyển tiếp PTY của lệnh đó; thao tác này không cung cấp shell đa dụng
hoặc argv do Gateway cung cấp.

Chuyển tiếp terminal không cung cấp các hợp đồng tiếp tục harness hoặc quyền sở hữu
lưu trữ. Vì vậy, các hàng từ xa vẫn hiển thị nhưng không cung cấp **Tiếp tục** hoặc
**Lưu trữ**, ngay cả khi luồng từ xa không hoạt động. Hãy sử dụng Codex trên máy tính đó
thông qua **Mở trong terminal**, hoặc sử dụng luồng tiếp tục trong tương lai có ranh giới
quyền sở hữu trình chạy an toàn.

## Siêu dữ liệu và quyền

Các hàng trong danh mục có thể bao gồm:

- mã định danh luồng và phiên
- tiêu đề và thư mục làm việc
- trạng thái hiện tại và các cờ chờ đang hoạt động
- dấu thời gian tạo, cập nhật và hoạt động
- nguồn, nhà cung cấp mô hình, phiên bản Codex CLI và nhánh Git

Phép chiếu danh mục loại trừ bản xem trước bản chép lời, các lượt, đường dẫn rollout,
đường dẫn thư mục chính của Codex, Git remote, SHA commit và lỗi App Server thô. Quyền truy cập
danh mục và đọc bản chép lời trong Control UI yêu cầu phạm vi Gateway `operator.write`
vì quá trình tổng hợp toàn bộ hệ thống sử dụng đường dẫn `node.invoke` tiêu chuẩn, mặc dù
cả hai lệnh Node đều chỉ đọc.

`supervision.allowRawTranscripts` và `supervision.allowWriteControls` chi phối
các công cụ tác tử tự chủ và MCP độc lập. Cả hai mặc định là `false`. Khi
bật chế độ giám sát, `codex_threads` loại bỏ bản xem trước bản chép lời và các lượt khỏi
kết quả liệt kê và đọc chỉ siêu dữ liệu, trừ khi bản chép lời thô được cho phép; yêu cầu
đọc có bao gồm lượt sẽ đóng khi lỗi. Mọi thao tác fork, đổi tên, lưu trữ và bỏ lưu trữ
đều yêu cầu quyền điều khiển ghi. Các tùy chọn này không kiểm soát việc xem bản chép lời
trong Control UI đã xác thực và không bỏ qua các bước kiểm tra liên kết, máy chủ, trạng thái hoặc xác nhận.

### Công cụ tương thích

Plugin `codex` chính thức giữ lại năm tên công cụ Supervisor đã phát hành cho
các máy khách tác tử và MCP độc lập hiện có:

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list` mặc định chỉ áp dụng cho dữ liệu đã tải; không có tham số `loaded_only`.
Đặt `include_stored: true` để cũng đọc các hàng đã lưu và chưa lưu trữ từ
cơ sở dữ liệu trạng thái của Codex. Giới hạn `max_stored_sessions` tùy chọn mặc định là 200
và chấp nhận từ 1 đến 1.000 hàng cho mỗi endpoint. Giới hạn này không áp dụng cho các hàng đã tải.
Nếu không có quyền truy cập bản chép lời thô, kết quả danh sách sẽ bỏ qua tên bắt nguồn từ bản chép lời,
bản xem trước và lỗi endpoint chi tiết.
`codex_session_read` yêu cầu `allowRawTranscripts`; `include_turns: true`
còn yêu cầu Codex cung cấp các lượt.

`codex_session_send` và `codex_session_interrupt` yêu cầu
`allowWriteControls`. Thao tác gửi chấp nhận `mode: "auto" | "start" | "steer"`, nhưng
`"start"` luôn bị từ chối và cả `"auto"` lẫn `"steer"` chỉ có thể điều hướng một
lượt đang hoạt động và có thể đọc. Một luồng không hoạt động bị từ chối kèm hướng dẫn sử dụng **Phiên
Codex**, nơi harness đầy đủ cài đặt các trình xử lý phê duyệt và công cụ trước khi
tiếp tục. Thao tác ngắt cũng yêu cầu một lượt đang hoạt động và có thể đọc. Các công cụ này
không tiếp tục hoặc khởi động một luồng nguồn không hoạt động.

`openclaw doctor --fix` di chuyển một mục `codex-supervisor` đã ngừng sử dụng, các trường endpoint
và quyền của mục đó cùng các tham chiếu chính sách cho phép/từ chối Plugin sang Plugin
`codex` chính thức mà không ghi đè các thiết lập chuẩn được chỉ định rõ ràng. Bộ điều hợp
MCP tương thích độc lập tiếp tục tải cùng năm công cụ từ
Plugin đó; các biến môi trường chính sách cũ chỉ áp dụng bên trong bộ điều hợp
đáng tin cậy đó.

Để biết mọi trường cấu hình giám sát, xem
[Tham chiếu harness Codex](/vi/plugins/codex-harness-reference#supervision).

## Khắc phục sự cố

**Không có phiên nào xuất hiện:** xác minh rằng `@openclaw/codex` đã được cài đặt, cả
Plugin và `supervision.enabled` đều là true, danh sách cho phép Plugin hiện tại cho phép
`codex` và các phiên chưa được lưu trữ. Khởi động lại Gateway hoặc Node sau khi
thay đổi trạng thái kích hoạt.

**Tiếp tục bị tắt:** một hàng chưa ánh xạ đang hoạt động, thuộc về một Node đã ghép nối,
máy chủ của hàng đang ngoại tuyến hoặc một hành động khác đang chờ. Các hàng Gateway cục bộ
đã lưu và không hoạt động cung cấp **Tiếp tục dưới dạng nhánh** thay vì chiếm quyền luồng chính xác
một cách không an toàn. Một hàng đã có Chat được giám sát sẽ cung cấp **Mở Chat**.

**Lưu trữ bị tắt:** tính năng lưu trữ khả dụng cho các hàng Gateway cục bộ
đã lưu/không rõ hoạt động và không hoạt động sau khi xác nhận không có trình chạy khác.
Các hàng đang hoạt động, lỗi, ngoại tuyến, thuộc Node đã ghép nối, có nhánh đang chờ và có
chủ sở hữu liên kết chính xác đã biết vẫn chỉ cho phép đọc đối với thao tác lưu trữ.

**Một phiên đã lưu trữ biến mất:** đây là hành vi dự kiến. Trang giám sát không có
chế độ xem dữ liệu đã lưu trữ. Chạy `codex unarchive <thread-id>` hoặc sử dụng Codex Desktop để hiển thị
lại phiên đó.

**Cấu hình `codex-supervisor` cũ vẫn còn:** chạy `openclaw doctor --fix`. Doctor
di chuyển mục Plugin đã ngừng sử dụng và các tham chiếu chính sách Plugin liên quan sang
`plugins.entries.codex.config.supervision` mà không ghi đè các thiết lập Codex
được chỉ định rõ ràng.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Kiến trúc giám sát Codex](/specs/codex-supervision)
- [Node](/vi/nodes)
- [Bảo mật Gateway](/vi/gateway/security)
