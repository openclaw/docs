---
read_when:
    - Thiết kế hành vi khám phá, tiếp tục hoặc lưu trữ phiên Codex
    - Thay đổi giao diện danh mục phiên gốc hoặc các RPC của Gateway
    - Mở rộng khả năng giám sát Codex trên các node được ghép cặp
summary: Kiến trúc và ranh giới sản phẩm để giám sát các phiên Codex gốc từ OpenClaw.
title: Giám sát Codex
x-i18n:
    generated_at: "2026-07-19T06:00:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e259badc8f7fdec6fa093785a1dd04394e12287ae61f00474bcd45e7b95352d
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Giám sát Codex

## Mục tiêu

Tính năng giám sát Codex cho phép người vận hành OpenClaw khám phá các phiên Codex gốc và,
khi an toàn, tạo một nhánh cục bộ thông qua giao diện Chat thông thường của OpenClaw.
Codex App Server vẫn là thành phần sở hữu luồng hội thoại và vòng lặp mô hình. OpenClaw cung cấp
danh mục đội máy, giao diện người vận hành đã xác thực, liên kết phiên và phân phối qua kênh.

Tính năng này thuộc Plugin `codex` chính thức. Không có
Plugin Supervisor riêng hoặc bản triển khai giao thức Codex thứ hai.

## Ranh giới sản phẩm

Danh mục được đăng ký bất cứ khi nào Plugin Codex đang hoạt động, trừ khi tính năng khám phá
phiên gốc bị tắt rõ ràng bằng:

```text
plugins.entries.codex.config.sessionCatalog.enabled = false
```

Bật các công cụ giám sát dành cho tác nhân bằng:

```text
plugins.entries.codex.config.supervision.enabled = true
```

Sản phẩm ban đầu hiện đang hoạt động được chủ ý giới hạn hơn kế hoạch dài hạn
cho đội máy:

- Chỉ liệt kê các luồng Codex chưa được lưu trữ.
- Nhóm các hàng cục bộ và hàng của Node đã ghép nối, được chọn tham gia theo danh tính máy chủ ổn định.
- Tạo một nhánh Chat thông thường bị khóa theo mô hình từ một luồng cục bộ trên Gateway
  đã lưu hoặc đang rảnh, khởi động luồng harness Codex đầy đủ của nhánh đó ở lượt đầu tiên, hoặc mở Chat
  đã được tạo cho một nhánh trước đó.
- Chỉ lưu trữ một luồng cục bộ trên Gateway đã lưu hoặc đang rảnh sau khi có xác nhận rõ ràng
  rằng không có trình chạy nào khác.
- Hiển thị các nguồn cục bộ đang hoạt động mà không có điều khiển tạo nhánh mới hoặc lưu trữ, đồng thời vẫn
  cho phép mở một Chat được giám sát hiện có.
- Hiển thị các hàng mới nhất theo từng máy chủ trong thanh bên chính, giữ toàn bộ danh mục trên
  trang phiên và cung cấp khả năng đọc bản chép lời có giới hạn, phân trang bằng con trỏ cho
  các hàng cục bộ và hàng của Node đã ghép nối.
- Cô lập lỗi danh mục theo từng máy chủ.

Danh mục là tập hợp chưa được lưu trữ. Một hàng trong đó vẫn có thể có
trạng thái lượt là đang rảnh, đang hoạt động, `notLoaded` hoặc lỗi.

Tính năng giám sát dành cho tác nhân vẫn yêu cầu chủ động chọn tham gia. Quy trình hướng dẫn thiết lập ban đầu cố gắng cài đặt và bật tính năng này
sau khi phát hiện thành công bản cài đặt Codex gốc và backend suy luận đã chọn
vượt qua kiểm tra trực tiếp, độc lập với backend chính mà người dùng
chọn. Tính năng giám sát chỉ được kích hoạt khi quá trình thiết lập Plugin theo cơ hội đó
thành công. Plugin bị tắt rõ ràng, lệnh chặn theo chính sách hoặc
`supervision.enabled: false` vẫn có hiệu lực quyết định đối với các công cụ giám sát, nhưng
không tắt danh mục phiên dành cho người vận hành. `sessionCatalog.enabled: false`
tắt tính năng khám phá dành cho người vận hành và các lệnh danh mục của Node đã ghép nối; trình cung cấp
và harness Codex vẫn hoạt động.

## Quyền sở hữu

Plugin `codex` sở hữu toàn bộ hành vi của Codex App Server:

- khám phá điểm cuối và vòng đời kết nối
- khởi tạo giao thức và kiểm tra phiên bản
- liệt kê, đọc, tiếp tục, lưu trữ và xử lý sự kiện của luồng
- cầu nối phê duyệt và đầu vào của người dùng
- liên kết luồng gốc với các phiên OpenClaw
- thực thi mô hình và harness chỉ dành cho Codex sau khi tiếp tục

Control UI và Gateway sử dụng dịch vụ do Plugin đó sở hữu. Chúng không đọc
trực tiếp các tệp triển khai Codex và không triển khai một ứng dụng khách App Server khác.

Cấu trúc liên kết cục bộ mặc định là:

```text
Codex Desktop -> App Server stdio riêng tư -> thư mục gốc Codex của người dùng
                                             ^
Plugin Codex của OpenClaw -> kết nối App Server giám sát
  (mặc định là stdio thư mục gốc người dùng được quản lý; các thiết lập appServer rõ ràng được tuân thủ)
  -> danh mục nguồn thụ động và đọc
  -> ghim ảnh chụp nhanh -> nhánh nguồn appServer chuẩn
  -> chèn lịch sử hiển thị và mọi lượt Chat được giám sát sau đó

Các phiên Codex thông thường của OpenClaw -> stdio thư mục gốc tác nhân được quản lý theo mặc định
  -> các luồng harness đầy đủ thông thường -> Chat OpenClaw và phân phối qua kênh
```

Việc bật giám sát không thay đổi harness Codex thông thường: theo mặc định, nó vẫn
có phạm vi theo tác nhân. Kết nối giám sát riêng mặc định
dùng stdio thư mục gốc người dùng được quản lý, vì vậy các thao tác danh mục và ảnh chụp nhanh của nó thấy được các luồng gốc
đã lưu. Các thiết lập kết nối `appServer` rõ ràng được tuân thủ. Khi
`homeScope` chưa được đặt, kết nối giám sát phân giải nó thành `"user"` cho stdio
hoặc Unix và `"agent"` cho WebSocket. Chỉ đặt `appServer.homeScope: "user"`
rõ ràng khi harness thông thường cũng cần dùng chung thư mục gốc Codex gốc.
Chat được tiếp nhận từ nhóm Codex trong thanh bên là trường hợp ngoại lệ: liên kết
giám sát riêng của Chat đó giữ các lượt đọc nguồn, việc tạo nhánh chuẩn và các lượt
sau này trên kết nối giám sát. Trạng thái trực tiếp và quyền sở hữu vẫn
cục bộ theo tiến trình; một luồng mà tiến trình giám sát của OpenClaw không biết đến là `notLoaded`
ngay cả khi Codex Desktop đang chủ động chạy luồng đó.

Codex có một daemon cục bộ chuẩn đang ở trạng thái thử nghiệm với hợp đồng
khởi động do trình cài đặt quản lý riêng. Tính năng này không được ngầm khởi động,
tuyên bố sở hữu hoặc giả định daemon đó.

## Luồng danh mục

Phương thức Gateway chung `sessions.catalog.list` điều phối đến trình cung cấp danh mục `codex`,
trình này luôn yêu cầu `archived: false` và để App Server
áp dụng giá trị mặc định cho nguồn tương tác của nó: `cli`, `vscode`, Atlas và ChatGPT. Phương thức này
kết hợp:

1. Các kết quả `thread/list` cục bộ trên Gateway từ App Server giám sát,
   mặc định dùng stdio thư mục gốc người dùng được quản lý.
2. Các kết quả `codex.appServer.threads.list.v1` từ mỗi Node đã kết nối và được chọn tham gia.

Việc chọn bản chép lời sử dụng `thread/turns/list` với `itemsView: "full"` ở cục bộ hoặc
lệnh `codex.appServer.thread.turns.list.v1` có phiên bản trên Node
đã chọn. Mỗi phản hồi chứa tối đa 20 lượt đã lưu cùng các con trỏ
tiến/lùi không trong suốt. Control UI yêu cầu các trang theo thứ tự mới nhất trước, hiển thị từng trang theo
thứ tự thời gian và chèn các trang cũ hơn vào đầu. Giao diện này không bao giờ dự phòng về
`thread/read` không giới hạn. OpenClaw cũng từ chối mọi trang mục đã tuần tự hóa lớn hơn
20 MiB trước khi trang đó có thể đi qua phương thức truyền tải của Node hoặc Gateway.

Bản triển khai Node đã ghép nối gốc trên macOS chỉ hỗ trợ giá trị chưa đặt/mặc định hoặc
`appServer.transport: "stdio"` rõ ràng với phạm vi giám sát chưa đặt/mặc định hoặc
`appServer.homeScope: "user"` rõ ràng. Nó chuyển `command`, `args`
đã cấu hình và `clearEnv` đã chuẩn hóa vào tiến trình con. Với `"unix"`, `"websocket"`
hoặc `homeScope: "agent"` rõ ràng, nó không quảng bá năng lực danh mục
lẫn lệnh; lời gọi trực tiếp cũng đóng khi lỗi. Nó tuyệt đối không được để lộ thư mục gốc
Codex của người dùng cho cấu hình có phạm vi theo tác nhân hoặc thay thế stdio cục bộ cho một
điểm cuối rõ ràng.

Phép chiếu danh mục chuẩn hóa mã định danh, tiêu đề, cwd, trạng thái, cờ chờ đang hoạt động,
dấu thời gian, nguồn, trình cung cấp mô hình, phiên bản Codex và nhánh Git. Nó
không trả về bản xem trước bản chép lời, lượt, đường dẫn triển khai, đường dẫn thư mục gốc Codex,
Git remote, SHA commit, điểm cuối thô hoặc lỗi App Server thô. Phản hồi bản chép lời
chỉ chứa trang mục App Server được yêu cầu rõ ràng và các con trỏ
không trong suốt của trang đó.

Lỗi máy chủ được giữ cục bộ trong kết quả của từng máy chủ. Một Node ngoại tuyến hoặc
App Server cục bộ không khả dụng không xóa các máy chủ lành mạnh khỏi trang. Khả năng kết nối là
thuộc tính của máy chủ, không phải trạng thái luồng: kết quả máy chủ bị lỗi không chứa hàng
phiên mới và không chiếu `offline` lên các luồng gốc.

Control UI yêu cầu các bản cập nhật danh mục tăng dần. Mỗi máy chủ cục bộ hoặc đã ghép nối
xuất hiện khi quá trình liệt kê App Server của chính nó hoàn tất; phản hồi tổng hợp vẫn là
ảnh chụp nhanh phục vụ khả năng tương thích và khôi phục. Trang hiển thị được đối soát sau khi
khả năng kết nối thay đổi, khi được lấy nét và tối đa mỗi 30 giây, với một lượt nhanh hơn
sau các thay đổi. Do đó, các phiên Codex gốc được tạo trong một ứng dụng khách khác
cuối cùng vẫn được phát hiện mà không cần nhập chúng vào kho lưu trữ OpenClaw.

Khám phá danh mục là thao tác thụ động. Việc liệt kê hoặc đọc siêu dữ liệu không được gọi
`thread/resume`, đăng ký ứng dụng khách OpenClaw nhận các yêu cầu luồng trực tiếp hoặc
trả lời một yêu cầu phê duyệt.

Tìm kiếm chỉ theo tiêu đề và không phân biệt chữ hoa chữ thường. Đối với mỗi trang danh mục được trả về,
Gateway và máy Mac đã ghép nối quét một số lượng trang gốc có giới hạn mà không chuyển
truy vấn đến App Server, vì tìm kiếm gốc cũng có thể khớp với bản xem trước bản chép lời.
Con trỏ gốc được trả về cho phép bên gọi tiếp tục quá trình quét.

## Ranh giới CLI dành cho người vận hành

Plugin đăng ký ba lệnh shell được Gateway hỗ trợ:

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` là `--url <url>`, `--token <token>`, `--timeout <ms>` và
công tắc `--expect-final` được kế thừa. Thời gian chờ mặc định của thao tác liệt kê phiên là 75,000 ms;
thao tác tiếp tục và lưu trữ mặc định là 30,000 ms;
`--expect-final` không có tác dụng bổ sung đối với các RPC đơn ngôi này. Tìm kiếm phiên
chỉ theo tiêu đề và không phân biệt chữ hoa chữ thường; mỗi phản hồi quét một chuỗi trang gốc
có giới hạn và `--cursor` tiếp tục với các kết quả cũ hơn. Giới hạn mặc định là 50 cho mỗi máy chủ
và chấp nhận từ 1 đến 100; con trỏ yêu cầu một đích `--host`
ổn định. Không lệnh nào chấp nhận
tùy chọn archived/include-archived. Chỉ `sessions` có thể nhắm đến các máy chủ đã ghép nối;
`continue` và `archive` luôn gửi `hostId: "gateway:local"`, còn thao tác lưu trữ
yêu cầu cờ xác nhận rõ ràng.

Không gian tên shell không phải là không gian tên thời gian chạy `/codex` trong Chat. Cụ thể,
`/codex sessions --host <node>` liệt kê các tệp phiên Codex CLI trên một
Node, `/codex threads` liệt kê các luồng App Server cho kết nối của cuộc hội thoại hiện tại
và `/codex resume` hoặc `/codex bind` thay đổi liên kết của cuộc hội thoại đó.
Các lệnh này không thay thế `sessions.catalog.continue` và không có
lệnh thời gian chạy `/codex continue` hoặc `/codex archive`.

## Tiếp tục cục bộ

Đối với một hàng cục bộ trên Gateway đã lưu hoặc đang rảnh, UI gọi
`sessions.catalog.continue` với `catalogId: "codex"` cùng mã định danh máy chủ và luồng.
Plugin:

1. Tái sử dụng Chat được giám sát hiện có khi nguồn đã có một Chat.
2. Nếu không, chiếu lịch sử người dùng và trợ lý có giới hạn đến hết lượt cuối cùng
   đã lưu và kết thúc trong nguồn (hoàn tất, bị gián đoạn hoặc thất bại) vào một
   Chat OpenClaw mới và ghi lại một nhánh harness đang chờ xử lý.
3. Lưu chính sách khóa mô hình chỉ dành cho Codex đang chờ xử lý, thay vì một lựa chọn
   mô hình hoặc trình cung cấp cụ thể, cùng phạm vi kết nối giám sát riêng tư, rồi
   trả về `sessionKey` của OpenClaw.

Phép chiếu lịch sử chọn phần cuối mới nhất của các thông điệp người dùng và trợ lý
có thể hiển thị, với giới hạn cứng là 200 thông điệp, tổng cộng 512 KiB văn bản UTF-8 và
64 KiB cho mỗi thông điệp. Nó thay thế đầu vào hình ảnh và hình ảnh cục bộ bằng
`[Image attachment]`, không bao giờ sao chép tải trọng hoặc đường dẫn hình ảnh, đồng thời bỏ qua phần suy luận,
lời gọi công cụ và kết quả công cụ.

UI điều hướng đến Chat thông thường bằng khóa phiên đó. Chưa có luồng harness
chuẩn nào tồn tại. Ở lượt Chat thông thường đầu tiên, harness cài đặt các trình xử lý
phê duyệt, gợi hỏi, sự kiện và phân phối Codex thực tế, sau đó:

1. Sử dụng kết nối giám sát để gọi `thread/fork` gốc mà không ghi đè mô hình
   hoặc trình cung cấp và ghim ảnh chụp nhanh nguồn đã lưu. Trạng thái
   `ConfigManager` hiện tại của Codex chọn mô hình và trình cung cấp, còn phản hồi fork
   báo cáo cặp thực tế. Nếu mô hình khác với mô hình cuối cùng được ghi lại
   trong nguồn, Codex phát cảnh báo khác biệt mô hình thông thường.
2. Trên cùng kết nối đó, khởi động luồng harness Codex đầy đủ chuẩn bằng
   `threadSource: "appServer"`, cwd, chính sách, cấu hình, môi trường của OpenClaw,
   toàn bộ bề mặt công cụ của harness OpenClaw và chính xác mô hình cùng trình cung cấp
   do fork trả về cho lần khởi động ban đầu này.
3. Chèn lịch sử người dùng và trợ lý có thể hiển thị đã được giới hạn qua kết nối đó,
   commit liên kết chuẩn mà không loại bỏ phạm vi giám sát của liên kết, chạy lượt
   và lưu trữ fork tạm thời.

Trước lượt đầu tiên, Chat là một nhánh đang chờ bị khóa với bản sao lịch sử hiển thị;
sau đó, mọi lượt của mô hình đều chạy qua luồng harness Codex chuẩn trên kết nối
giám sát. Nhánh này không phải là bản sao rollout gốc đầy đủ: phần suy luận nguồn,
lệnh gọi công cụ và kết quả công cụ được chủ ý lược bỏ. Nếu việc ghim snapshot hoặc
tạo luồng chuẩn thất bại, nhánh đang chờ vẫn có thể được thử lại. Xung đột khi liên kết,
tính năng giám sát bị tắt, hoặc kết nối giám sát không khả dụng hay không khớp sẽ khiến
hệ thống đóng khi lỗi trước khi lượt chạy, thay vì quay về harness agent-home thông thường.

Điều này đảm bảo lựa chọn do Codex sở hữu, chứ không bảo toàn mô hình lịch sử của
nguồn. Cặp được trả về từ fork được dùng để bắt đầu luồng chuẩn, và Codex duy trì
mô hình cùng nhà cung cấp gốc của luồng đó. Các lần tiếp tục sau sẽ bỏ qua phần ghi đè
mô hình và nhà cung cấp của OpenClaw, để Codex khôi phục cặp đã được duy trì.
Nếu một cơ chế điều khiển Codex gốc riêng biệt thay đổi luồng chuẩn, OpenClaw chấp nhận
lựa chọn gốc đã được duy trì đó. Mô hình OpenClaw bên ngoài và chuỗi dự phòng
không bao giờ thay thế lựa chọn này.

Các thao tác thay đổi mô hình, xóa phiên và đặt lại/tạo mới phiên đều đóng khi lỗi
đối với Chat được giám sát và khóa mô hình. Việc sửa đổi `/codex model <model>`, `/codex
bind`, `/codex resume` (bao gồm Node `--bind here`), và `/codex detach` hoặc
`/codex unbind` cũng đóng khi lỗi vì chúng thay thế hoặc xóa liên kết. Truy vấn
`/codex model` cùng `/codex fast`, `/codex permissions` và `/codex
threads` vẫn khả dụng. Công cụ agent `codex_threads` không thể gắn một
fork mới hoặc lưu trữ luồng gốc đã liên kết. Thao tác đọc chỉ danh sách và siêu dữ liệu
vẫn khả dụng; các trường bản chép lời yêu cầu `supervision.allowRawTranscripts`, còn
đổi tên, bỏ lưu trữ, fork tách rời và lưu trữ một luồng không liên quan yêu cầu
`supervision.allowWriteControls`. Không tùy chọn nào có thể thay thế liên kết đã khóa.
Nếu không, việc xóa hoặc đặt lại mục OpenClaw sẽ loại bỏ liên kết gốc và tạo hoặc
cho phép một luồng chung phía sau một phiên có vẻ là Codex.
Do đó, hoạt động bảo trì lưu giữ sẽ bảo toàn các mục bị khóa mô hình ngay cả khi chúng
vượt quá các giới hạn thông thường về tuổi, số lượng hoặc dung lượng ổ đĩa. Việc tắt
hoặc gỡ cài đặt Plugin sở hữu cũng giữ lại khóa và dấu hiệu quyền sở hữu Plugin. Chat
vẫn không khả dụng và đóng khi lỗi cho đến khi cùng Plugin đó được bật lại; quá trình
dọn dẹp không bao giờ chuyển nó thành một phiên mô hình thông thường.

Nguồn không bao giờ được tiếp tục hoặc sửa đổi bởi thao tác này. Fork tạm thời ghim
một snapshot; đó không phải là luồng tiếp tục bền vững. Việc bắt đầu một luồng harness
chuẩn riêng biệt ở lượt đầu tiên ngăn OpenClaw trở thành một trình ghi nguồn cạnh tranh
chỉ vì trạng thái cục bộ trong tiến trình không phát hiện được một lượt do Desktop sở hữu.
Bản sao lịch sử hiển thị và snapshot đã ghim có thể bỏ sót công việc chưa hoàn tất trong
một nguồn đang hoạt động. Nguồn CLI, VS Code, Atlas hoặc ChatGPT ban đầu vẫn đủ điều kiện
xuất hiện trong cả danh mục gốc lẫn danh mục OpenClaw.
Nhánh chuẩn vẫn là một luồng Codex gốc trong kho giám sát, nhưng các máy khách gốc có thể
lọc loại nguồn `appServer` của nó, vì vậy khả năng hiển thị trong Codex Desktop
không phải là một hợp đồng.

## Hành vi lưu trữ

Đối với một hàng cục bộ của Gateway đã lưu hoặc không hoạt động, `sessions.catalog.archive` với
`catalogId: "codex"` yêu cầu
`confirmNoOtherRunner: true` rõ ràng, đọc mới trạng thái cục bộ hiện tại trong tiến trình,
chỉ tiếp tục với `idle` hoặc `notLoaded`, gọi `thread/archive` gốc,
và chỉ trả về thành công sau khi Codex chấp nhận thao tác. Sau đó, hàng này rời khỏi
danh mục chưa lưu trữ.

Trạng thái đang hoạt động hoặc lỗi từ lần đọc mới sẽ từ chối lưu trữ. Một nhánh được
giám sát đang khởi tạo hoặc đang chờ từ nguồn cũng vậy: lượt Chat đầu tiên phải hiện thực
hóa nhánh chuẩn của nó trước khi nguồn có thể được lưu trữ. Một chủ sở hữu liên kết
OpenClaw đang hoạt động đã biết đối với đúng mục tiêu hoặc bất kỳ hậu duệ được tạo nào
chưa được lưu trữ cũng khiến thao tác lưu trữ bị từ chối. OpenClaw phân trang quan hệ
thử nghiệm `thread/list ancestorThreadId` của Codex và đóng khi lỗi nếu có lỗi yêu cầu hoặc phản hồi,
chu trình con trỏ hoặc luồng, hay cạn kiệt giới hạn an toàn. Thao tác lưu trữ gốc có thể
tắt công việc cha và hậu duệ đã tải, nên lưu trữ không phải là lối tắt để ngắt.
Các lệnh gọi đọc, liệt kê hậu duệ và lưu trữ không có tính nguyên tử.
Một máy khách độc lập vẫn có thể sở hữu hoặc bắt đầu công việc trên một hàng có vẻ không
hoạt động hoặc `notLoaded` ở cục bộ. Việc xác nhận không có trình chạy nào khác
bao quát các máy khách không xác định và xung đột đó cho đến khi Codex có thao tác lưu trữ
có điều kiện hoặc lease liên tiến trình.
Cấm lưu trữ trên Node đã ghép cặp.

Không có chế độ xem đã lưu trữ trong danh mục Codex. Một luồng được khôi phục bằng
`thread/unarchive` trên một bề mặt Codex khác được chủ sở hữu ủy quyền sẽ lại đủ điều kiện
xuất hiện trong danh mục chưa lưu trữ.

## An toàn của luồng đang hoạt động

Codex tuần tự hóa các thay đổi đối với một luồng giữa các máy khách của cùng một App Server,
nhưng không cung cấp lease trình chạy hoặc chủ sở hữu phê duyệt độc quyền giữa các tiến trình.
Các App Server stdio độc lập có thể nối thêm vào cùng một rollout, trong khi mỗi máy chủ
chỉ thấy trạng thái trong bộ nhớ của chính mình. Yêu cầu phê duyệt cũng có thể đến mọi bên
đăng ký của một máy chủ, với phản hồi hợp lệ đầu tiên hoàn tất yêu cầu.

Do đó:

- các máy khách danh mục thụ động không đăng ký hoặc tự động từ chối phê duyệt
- các hàng hiện được báo cáo là đang hoạt động không cung cấp nhánh mới hay Lưu trữ
- một nguồn chưa được ánh xạ trở thành nhánh lịch sử hiển thị, trong đó luồng harness
  chuẩn không bao giờ tiếp tục nguồn
- `notLoaded` được hiển thị là không rõ hoạt động và chỉ có thể được lưu trữ sau khi
  có xác nhận đầy đủ thông tin rằng không có trình chạy nào khác
- lưu trữ cục bộ yêu cầu xác nhận đó cùng một lần đọc mới `idle` hoặc `notLoaded`,
  đồng thời thừa nhận xung đột giao thức giữa thao tác đọc và lưu trữ

Ngắt và bàn giao giữa nhiều máy khách là các quyết định sản phẩm trong tương lai. Việc
hiển thị một hàng đang hoạt động không ngụ ý các tính năng đó.

## Ranh giới Node đã ghép cặp

Lệnh gọi Node hiện chỉ hỗ trợ yêu cầu/phản hồi. Nó có thể trả về an toàn siêu dữ liệu
danh mục có giới hạn và các trang lượt bản chép lời, nhưng không thể truyền luồng sự kiện
dài hạn, yêu cầu phê duyệt, lệnh gọi công cụ, thao tác hủy và các phần cập nhật của trợ lý
mà một lần chạy harness Codex yêu cầu.

Do đó, hợp đồng Node hỗ trợ danh sách và các trang lượt bản chép lời. Các hàng từ xa
vẫn có thể đọc được, nhưng **Tiếp tục** và **Lưu trữ** không khả dụng, bất kể trạng thái
không hoạt động. Một lần tiếp tục từ xa thực sự yêu cầu trình chạy phía Node và cầu nối
truyền phát bảo toàn các bất biến về phê duyệt và liên kết giống như harness cục bộ.

## Quyền

Mỗi máy tính tự nguyện bật tính năng này ở cục bộ. Việc bật Gateway không cấp quyền cho
Node khác đọc siêu dữ liệu Codex của máy. Khả năng Node phải vượt qua quy trình ghép cặp
và phê duyệt chính sách lệnh thông thường.

Việc liệt kê toàn bộ fleet và xem bản chép lời sử dụng phạm vi Gateway
`operator.write` vì chúng gọi các Node đã ghép cặp. Tiếp tục và lưu trữ cục bộ là
các thao tác của người vận hành đã xác thực và vẫn chịu kiểm tra máy chủ cùng trạng thái.

Quyền truy cập của agent tự động và MCP độc lập là riêng biệt. Các hợp đồng công cụ
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` và `codex_session_interrupt` được phát hành vẫn thuộc sở hữu
của Plugin `codex`. Khi tính năng giám sát được bật, các thao tác đọc bản chép lời
`codex_threads` thô và các trường danh sách bắt nguồn từ bản chép lời cũng yêu cầu
`supervision.allowRawTranscripts`; mọi thao tác fork, đổi tên, lưu trữ
hoặc bỏ lưu trữ `codex_threads` đều yêu cầu `supervision.allowWriteControls`.
Cả hai chính sách đều bị tắt theo mặc định.

## Khả năng tương thích

`openclaw doctor --fix` di chuyển cấu hình `plugins.entries.codex-supervisor`
đã phát hành, bao gồm các endpoint và chính sách bản chép lời/ghi, cùng các tham chiếu
cho phép/từ chối Plugin sang
`plugins.entries.codex.config.supervision`. Các giá trị đích chuẩn được chỉ định rõ ràng
được ưu tiên khi xảy ra xung đột. Mã runtime chỉ sử dụng hình dạng Plugin
`codex` chuẩn sau khi di chuyển.

Plugin chính thức giữ lại chính xác năm công cụ tương thích Supervisor:
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` và `codex_session_interrupt`. Theo mặc định, danh sách phiên chỉ gồm
các phiên đã tải; không có tham số `loaded_only`. `include_stored: true` bổ sung
các hàng chưa lưu trữ trong cơ sở dữ liệu trạng thái, được giới hạn theo từng endpoint bởi
`max_stored_sessions` (mặc định 200, phạm vi được chấp nhận từ 1 đến 1,000); các hàng đã tải
không bị giới hạn bởi cài đặt đó. Các trường bắt nguồn từ bản chép lời và thao tác đọc vẫn
được kiểm soát bởi `allowRawTranscripts`; gửi và ngắt vẫn được kiểm soát bởi `allowWriteControls`.

Thao tác gửi tương thích không bao giờ bắt đầu hoặc tiếp tục một luồng không hoạt động.
`mode: "start"` luôn bị từ chối; `"auto"` và `"steer"` chỉ điều khiển
một lượt đang hoạt động có thể đọc. Tương tự, thao tác ngắt yêu cầu một lượt đang hoạt động
có thể đọc. Việc tiếp tục luồng không hoạt động được định tuyến đến danh mục Codex gốc để
harness đầy đủ sở hữu các phê duyệt, công cụ và liên kết.
Bộ điều hợp MCP cũ độc lập phân giải chính các công cụ này từ Plugin chính thức và là
đường dẫn duy nhất tuân thủ các biến môi trường chính sách cũ được giữ lại.

Giao diện người dùng danh mục tháng 7, phương thức Gateway, khả năng Node và đăng ký CLI
chưa được phát hành dưới id Plugin cũ. Chúng được chuyển trực tiếp sang quyền sở hữu
`codex` mà không có facade runtime thứ hai.

## Công việc trong tương lai

- trình chạy truyền phát phía Node và cầu nối sự kiện để tiếp tục từ xa
- lease rõ ràng cho trình chạy và chủ sở hữu phê duyệt để bàn giao đồng thời giữa các máy khách
- lưu trữ từ xa sau khi có lease quyền sở hữu trình chạy hoặc cơ chế rào chắn tương đương
- ngắt và quan sát phiên đang hoạt động phong phú hơn
- bàn giao đã được kiểm tra giữa Codex Desktop, CLI và OpenClaw

Duyệt nội dung đã lưu trữ không thuộc thanh bên giám sát theo kế hoạch. Các bề mặt Codex
gốc vẫn là đường dẫn khôi phục cho các luồng đã lưu trữ.

## Kiểm thử chấp nhận

- Việc bật giám sát sẽ liệt kê các phiên cục bộ chưa được lưu trữ.
- Các phiên đã lưu trữ không bao giờ xuất hiện trong phản hồi danh mục hoặc giao diện người dùng.
- Các máy chủ hoạt động bình thường vẫn hiển thị khi một máy chủ khác gặp lỗi; máy chủ không khả dụng
  không trả về hàng dữ liệu mới nào thay vì tự tạo trạng thái phiên ngoại tuyến.
- Một hàng cục bộ đã lưu hoặc đang rảnh sẽ tạo một bản sao Chat với khóa
  mô hình/runtime chỉ dành cho Codex; lượt đầu tiên ghim một ảnh chụp nhanh tạm thời và khởi động
  luồng harness đầy đủ chính tắc, còn việc lặp lại Continue sẽ mở Chat hiện có.
- Lượt đầu tiên bỏ qua các giá trị ghi đè mô hình/nhà cung cấp trên nhánh ảnh chụp nhanh và ghim
  lần khởi động chính tắc vào đúng cặp do Codex trả về, ngay cả khi Codex cảnh báo
  rằng mô hình hiện tại của nó khác với mô hình được ghi nhận gần nhất của nguồn.
- Các liên kết được giám sát đang chờ xử lý và đã cam kết sử dụng kết nối giám sát để
  truy cập nguồn, tạo nhánh chính tắc và thực hiện mọi lượt sau đó; các
  phiên Codex thông thường vẫn thuộc phạm vi tác nhân.
- Các lần tiếp tục sau đó bỏ qua các giá trị ghi đè mô hình/nhà cung cấp của OpenClaw, duy trì lựa chọn
  chính tắc đã lưu của Codex, chấp nhận các thay đổi gốc riêng biệt đối với luồng đó
  và không bao giờ thay thế bằng mô hình OpenClaw bên ngoài hoặc chuỗi dự phòng.
- Việc tắt giám sát hoặc mất vòng đời liên kết/kết nối sẽ đóng khi gặp lỗi
  thay vì chuyển Chat sang harness thư mục chính của tác nhân thông thường.
- Không thể xóa Chat được giám sát và khóa mô hình trong khi Chat đó bảo vệ
  liên kết gốc.
- Chat sao chép tối đa 200 tin nhắn của người dùng và trợ lý, tổng cộng 512 KiB và
  64 KiB cho mỗi tin nhắn. Hình ảnh trở thành phần giữ chỗ; quá trình suy luận nguồn, lệnh gọi công cụ,
  kết quả công cụ, tải trọng hình ảnh và đường dẫn cục bộ không được sao chép.
- Luồng tạo nhánh không bao giờ tiếp tục luồng nguồn.
- Nguồn ban đầu vẫn đủ điều kiện xuất hiện trong cả hai danh mục. Nhánh gốc chính tắc
  sử dụng loại nguồn `appServer` và không được đảm bảo sẽ xuất hiện trong
  Codex Desktop.
- Các nguồn cục bộ đang hoạt động không thể tạo nhánh hoặc được lưu trữ; Chat được giám sát
  hiện có vẫn có thể mở.
- Các hàng không xác định được hoạt động có thể tạo nhánh mà không cần xác nhận; việc lưu trữ yêu cầu
  xác nhận rõ ràng rằng không có trình chạy nào khác.
- Không thể lưu trữ nguồn có nhánh được giám sát đang khởi tạo hoặc chờ xử lý
  cho đến khi lượt Chat đầu tiên hiện thực hóa nhánh chính tắc.
- Chủ sở hữu liên kết đang hoạt động đã biết cho chính xác đích hoặc bất kỳ hậu duệ được tạo ra nào
  chưa lưu trữ sẽ chặn việc lưu trữ; lỗi liệt kê hậu duệ sẽ đóng khi gặp lỗi, còn
  xác nhận rõ ràng vẫn chịu trách nhiệm đối với các máy khách không xác định và
  tình trạng tranh chấp giữa kiểm tra trạng thái và lưu trữ.
- Việc lưu trữ cục bộ đã được xác nhận ở trạng thái đã lưu hoặc đang rảnh sẽ xóa hàng sau khi thao tác gốc thành công.
- Các hàng của Node đã ghép nối vẫn hiển thị mà không có Continue hoặc Archive.
- Việc liệt kê thụ động không bao giờ đăng ký nhận hoặc phản hồi các yêu cầu phê duyệt luồng.
- Cấu hình Supervisor cũ được di chuyển sang cấu trúc cấu hình Codex chính tắc.
- Theo mặc định, danh sách cũ chỉ được tải; việc liệt kê các mục đã lưu tuân theo
  giới hạn riêng của từng điểm cuối và thao tác gửi tương thích không bao giờ khởi động hoặc tiếp tục một luồng đang rảnh.
