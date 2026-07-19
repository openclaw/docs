---
read_when:
    - Bạn đã hoàn tất thiết lập suy luận và muốn OpenClaw cấu hình phần còn lại
    - Bạn cần kiểm tra hoặc sửa chữa OpenClaw bằng tác nhân thiết lập cục bộ
    - Bạn đang thiết kế hoặc bật chế độ cứu hộ cho kênh nhắn tin
summary: Tài liệu tham khảo CLI và mô hình bảo mật cho trình trợ giúp thiết lập và sửa chữa OpenClaw dựa trên suy luận
title: Tác nhân thiết lập OpenClaw
x-i18n:
    generated_at: "2026-07-19T16:52:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 32643eb24cd010c1018908f78d901ebdcac9ef13f7c639e48a5ba7be5913a1d5
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw đi kèm một tác nhân hệ thống tích hợp sẵn — tác nhân này tự xưng là "OpenClaw" — để
thiết lập, sửa chữa và cấu hình cục bộ (trước đây gọi là Crestodian). Tác nhân chỉ khởi động sau khi mô hình mặc định có hiệu lực hoàn thành một lượt thực tế.
Các bản cài đặt mới sẽ thiết lập khả năng suy luận trước; cấu hình không hợp lệ vẫn đi theo
luồng doctor cổ điển.

## Khi nào tác nhân khởi động

Chạy `openclaw` mà không có lệnh con sẽ định tuyến dựa trên trạng thái cấu hình:

- Thiếu cấu hình hoặc cấu hình tồn tại nhưng không có thiết lập do người dùng tạo (trống hoặc chỉ có các khóa `$schema`/`meta`): bắt đầu quy trình tiếp nhận có hướng dẫn kèm xác minh AI trực tiếp.
- Cấu hình tồn tại nhưng không vượt qua bước xác thực: bắt đầu quy trình tiếp nhận cổ điển, báo cáo các vấn đề và hướng dẫn bạn đến `openclaw doctor`.
- Cấu hình tồn tại và hợp lệ: mở TUI tác nhân thông thường. Một Gateway đã cấu hình,
  có thể truy cập được và có tác nhân mặc định được gán mô hình sẽ chuyển thẳng đến giao diện đó
  mà không qua quy trình tiếp nhận hoặc OpenClaw. Dùng `/openclaw` trong TUI hoặc chạy
  trực tiếp `openclaw setup` để truy cập OpenClaw sau.

Trước tiên, chạy `openclaw setup` sẽ kiểm thử trực tiếp mô hình mặc định đã cấu hình. Một lượt thành công sẽ khởi động OpenClaw. Nếu thất bại trong chế độ tương tác, hệ thống sẽ mở phần thiết lập suy luận có hướng dẫn và chuyển giao cho OpenClaw sau khi một ứng viên vượt qua kiểm thử. Các yêu cầu một lần, JSON và không tương tác khác sẽ thất bại kèm hướng dẫn chạy `openclaw onboard` khi không có khả năng suy luận. `openclaw --help` và `openclaw --version` vẫn giữ các đường dẫn nhanh thông thường.

Lệnh `openclaw` trần ở chế độ không tương tác (không có TTY) sẽ thoát với một thông báo ngắn thay vì in phần trợ giúp gốc: thông báo này trỏ đến quy trình tiếp nhận không tương tác đối với bản cài đặt mới hoặc không hợp lệ, hoặc đến `openclaw agent --local ...` khi cấu hình hợp lệ.

`openclaw onboard --modern` vẫn là bí danh tương thích cho OpenClaw nhưng sử dụng cùng cổng kiểm tra suy luận: khả năng suy luận hoạt động sẽ mở cuộc trò chuyện, lỗi trong chế độ tương tác sẽ bắt đầu thiết lập suy luận có hướng dẫn, còn lỗi trong chế độ không tương tác sẽ thoát kèm hướng dẫn tiếp nhận. `openclaw onboard --classic` mở trình hướng dẫn từng bước đầy đủ.

## Nội dung OpenClaw hiển thị

OpenClaw tương tác mở cùng lớp vỏ TUI như `openclaw tui`, với phần phụ trợ trò chuyện OpenClaw. Lời chào khi khởi động bao gồm:

- tính hợp lệ của cấu hình và tác nhân mặc định
- mô hình đã xác minh mà OpenClaw đang sử dụng
- khả năng truy cập Gateway từ lần thăm dò khởi động đầu tiên
- hành động gỡ lỗi được đề xuất tiếp theo

OpenClaw không kết xuất bí mật hoặc tải các lệnh CLI của plugin chỉ để khởi động.

Dùng `status` để xem danh mục chi tiết: đường dẫn cấu hình, đường dẫn tài liệu/mã nguồn, các phép thăm dò CLI cục bộ, sự hiện diện của khóa/token, tác nhân, mô hình và thông tin Gateway.

OpenClaw sử dụng cùng cơ chế khám phá tài liệu tham chiếu như các tác nhân thông thường: trong bản checkout Git, nó trỏ đến `docs/` cục bộ và cây mã nguồn; trong bản cài đặt npm, nó sử dụng tài liệu đi kèm và liên kết đến [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), kèm hướng dẫn kiểm tra mã nguồn khi tài liệu chưa đủ.

## Ví dụ

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "models"
openclaw setup --message "validate config"
openclaw setup --message "setup workspace ~/Projects/work" --yes
openclaw setup --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Bên trong TUI OpenClaw:

```text
trạng thái
tình trạng
doctor
xác thực cấu hình
thiết lập
thiết lập không gian làm việc ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
trạng thái gateway
khởi động lại gateway
tác nhân
tạo tác nhân work với không gian làm việc ~/Projects/work
mô hình
cấu hình nhà cung cấp mô hình
đặt mô hình mặc định openai/gpt-5.6
kênh
thông tin kênh slack
kết nối slack
mở trình hướng dẫn kênh cho slack
danh sách plugin
tìm kiếm plugin slack
plugin install clawhub:openclaw-codex-app-server
trò chuyện với tác nhân work
trò chuyện với tác nhân cho ~/Projects/work
kiểm tra
thoát
```

## Thao tác và phê duyệt

OpenClaw sử dụng các thao tác có kiểu thay vì chỉnh sửa cấu hình tùy ý.

Các thao tác chỉ đọc chạy ngay lập tức: hiển thị tổng quan, liệt kê tác nhân, liệt kê plugin đã cài đặt, tìm kiếm plugin ClawHub, hiển thị trạng thái mô hình/phần phụ trợ, chạy kiểm tra trạng thái/tình trạng, kiểm tra khả năng truy cập Gateway, chạy doctor mà không áp dụng bản sửa tương tác, xác thực cấu hình, hiển thị đường dẫn nhật ký kiểm tra.

Việc bắt đầu thiết lập kênh có hướng dẫn (`connect telegram`) cũng chạy ngay lập tức. Trình hướng dẫn thu thập các câu trả lời rõ ràng và chịu trách nhiệm về các thao tác ghi kết quả.

Các thao tác lâu dài yêu cầu phê duyệt qua hội thoại (hoặc `--yes` đối với lệnh trực tiếp): ghi cấu hình, `config set`, `config set-ref`, khởi tạo thiết lập/tiếp nhận, thay đổi mô hình mặc định, khởi động/dừng/khởi động lại Gateway, tạo tác nhân và cài đặt plugin.

Không thể sửa chữa bằng Doctor bên trong OpenClaw vì các thao tác này có thể ghi lại nhà cung cấp, thông tin xác thực hoặc tuyến suy luận của tác nhân mặc định đang vận hành phiên. Thoát OpenClaw và chạy `openclaw doctor --fix` trong terminal. `doctor` chỉ đọc vẫn khả dụng bên trong OpenClaw.

Các tác nhân mới kế thừa tuyến suy luận mặc định đã được xác minh trực tiếp. Các mã định danh tác nhân `openclaw` và `crestodian` được dành riêng cho tác nhân hệ thống và không thể được tạo như tác nhân thông thường. Mã định danh đã ngừng sử dụng vẫn bị chặn để cấu hình cũ không thể chiếm dụng nó.

`config set` và `config set-ref` có thể thay đổi mọi thiết lập mà người dùng có thể thay đổi,
với một danh sách từ chối ngắn chỉ dành cho con người: `$include`, `auth.*`, `env.*`, `models.*`
và `secrets.*` tiếp tục bị từ chối vì chúng chứa dữ liệu thông tin xác thực,
cơ chế bao gồm cấu hình thay thế hoặc các định nghĩa nhà cung cấp/danh mục dùng cho
định tuyến suy luận. Bản thân định tuyến suy luận cũng được bảo vệ: các tuyến mô hình
mặc định (các trường mô hình/tham số/runtime của `agents.defaults`) và các trường định tuyến
của bất kỳ tác nhân nào hỗ trợ tuyến mặc định đang hoạt động đều bị từ chối, cũng như các trường
danh tính/cấu trúc liên kết của tác nhân (`id`, `agentDir`, `default`). Các trường định tuyến của
tác nhân khác vẫn có thể ghi sau khi được phê duyệt. Xác thực Gateway và kênh vẫn là
các bề mặt cấu hình thông thường. Dùng `set default model <provider/model>` cho một
tuyến đã được cấu hình; thao tác này kiểm thử trực tiếp tuyến trước khi lưu. Để
cấu hình hoặc sửa chữa quyền truy cập nhà cung cấp/xác thực, hãy thoát OpenClaw và chạy
`openclaw onboard`.

Các thao tác ghi `plugins.entries.<id>.*` (bật/tắt/cấu hình plugin đã cài đặt)
được cho phép trừ khi plugin đó hỗ trợ tuyến suy luận đang hoạt động. Nguồn cài đặt
plugin và chính sách tải vẫn giữ ranh giới tin cậy trong quy trình
cài đặt plugin có kiểu. Việc gỡ cài đặt plugin hỗ trợ tuyến cũng
bị từ chối vì cùng lý do; hãy thoát OpenClaw và chạy
`openclaw plugins uninstall <id>` từ terminal.

Phê duyệt được đưa ra bằng lời của bạn: các câu trả lời không nhập nhằng ("có", "được", "tiến hành đi", "chưa phải lúc này") được phân giải từ một danh sách đóng có tính tất định. Khi tuyến đã cấu hình hỗ trợ một lệnh gọi hoàn thành riêng biệt, các câu trả lời khác chỉ có thể được phân loại dựa trên tin nhắn của bạn và đề xuất đang chờ xử lý — tuyệt đối không phải bởi chính mô hình hội thoại, vì mô hình không thể tự phê duyệt. Các câu trả lời không thể phân loại hoặc nhập nhằng sẽ giữ đề xuất ở trạng thái chờ và cuộc hội thoại sẽ hỏi lại.

### Lịch sử thay đổi

Trang Ask OpenClaw có thể hiển thị các thao tác tác nhân hệ thống đã áp dụng gần đây, các
quá trình di chuyển của Doctor, thao tác ghi cấu hình từ Settings và CLI, cùng các chỉnh sửa thủ công đối với
`openclaw.json`. Nhật ký cấu hình phát hiện các chỉnh sửa bên ngoài trong lúc Gateway
đang theo dõi, trong một thao tác ghi do OpenClaw sở hữu hoặc vào lần khởi động tiếp theo sau một
chỉnh sửa ngoại tuyến.

Lịch sử được lưu trữ trong bảng `diagnostic_events` của cơ sở dữ liệu
`~/.openclaw/state/openclaw.sqlite` dùng chung, dưới các phạm vi `system-agent-audit`
và `config-audit`. Mỗi phạm vi lưu giữ 50.000 bản ghi mới nhất.
Các thao tác khám phá và chỉ đọc không được đưa vào. Bí mật không bao giờ xuất hiện trong
lịch sử thay đổi; các bản ghi nhật ký cấu hình chứa những đường dẫn đã thay đổi thay vì giá trị
cấu hình, còn việc so sánh giá trị sử dụng dấu vân tay được bảo vệ.

Việc thiết lập kênh có thể chạy dưới dạng cuộc hội thoại được lưu trữ cho đến khi gặp dữ liệu bí mật. TUI
OpenClaw cục bộ không chấp nhận các câu trả lời nhạy cảm trong trình hướng dẫn vì dữ liệu nhập
trò chuyện trên terminal có thể nhìn thấy. Nó cung cấp `open channel wizard` ngay lập tức, mang theo
kênh đã chọn vào trình hướng dẫn terminal có che giấu; bạn cũng có thể chạy
`openclaw channels add --channel <channel>` sau.

### Chuyển sang thiết lập kênh có che giấu

Cuộc trò chuyện cục bộ có thể chuyển quyền điều khiển sang trình hướng dẫn kênh có che giấu:

```text
mở trình hướng dẫn kênh cho slack
thông tin kênh slack
```

`open channel wizard for <channel>` mở phần thiết lập kênh có che giấu sau khi TUI
trò chuyện đóng. Trước tiên, dùng `channel info <channel>` để xem nhãn kênh, trạng thái
thiết lập, bản tóm tắt điều kiện tiên quyết và liên kết tài liệu.

OpenClaw không bao giờ thay đổi quyền truy cập nhà cung cấp/xác thực từ bên trong phiên của chính nó:
phiên đã phụ thuộc vào tuyến suy luận đó. Đối với việc thiết lập hoặc
sửa chữa nhà cung cấp mô hình, `configure model provider` trả về hướng dẫn thoát/tiếp nhận mà không
khởi động trình hướng dẫn hoặc ghi cấu hình. Hãy thoát OpenClaw và chạy `openclaw
onboard`; quy trình tiếp nhận chuẩn bị thông tin xác thực và chỉ lưu tuyến
hoàn thành một lượt trực tiếp thực tế. Khởi động lại OpenClaw sau khi tiếp nhận thành công.

## Khởi tạo thiết lập

`setup` cấu hình trạng thái không gian làm việc và Gateway còn lại sau khi quy trình tiếp nhận có hướng dẫn đã thiết lập khả năng suy luận. Thao tác này chỉ ghi thông qua các thao tác cấu hình có kiểu và yêu cầu phê duyệt trước.

```text
thiết lập
thiết lập không gian làm việc ~/Projects/work
```

`setup` giữ nguyên mô hình có hiệu lực đã xác minh. Nó không cấu hình hoặc
thay thế khả năng suy luận.

Nếu thiếu khả năng suy luận hoặc kiểm tra trực tiếp thất bại, hãy rời OpenClaw và chạy `openclaw onboard`. Quy trình tiếp nhận có hướng dẫn phát hiện các mô hình đã cấu hình, khóa API và CLI cục bộ đã xác thực, yêu cầu từng ứng viên đưa ra câu trả lời thực tế và chỉ lưu tuyến vượt qua kiểm thử. OpenClaw khởi động ngay sau ranh giới đó và sau đó có thể cấu hình không gian làm việc, Gateway, kênh, tác nhân, plugin và các tính năng tùy chọn khác.

Ứng dụng macOS bỏ qua hoàn toàn chuỗi bước này khi truy cập một Gateway đã cấu hình
có tác nhân mặc định đã được gán mô hình; ứng dụng mở giao diện
tác nhân thông thường.
Đối với Gateway mới hoặc chưa hoàn chỉnh, ứng dụng điều khiển chuỗi suy luận thông qua
các phương thức Gateway `openclaw.setup.detect` và `openclaw.setup.activate`:
detect liệt kê mọi phần phụ trợ ứng viên tìm thấy, activate kiểm thử trực tiếp một
ứng viên (một lượt hoàn thành thực tế theo yêu cầu "reply with OK") và chỉ lưu mô hình,
thông tin xác thực cùng trạng thái nhà cung cấp/runtime cần thiết cho tuyến đó sau khi kiểm thử thành công. Các giá trị mặc định của không gian làm việc và Gateway vẫn dành cho OpenClaw. Ứng viên thất bại
không bao giờ thay đổi cấu hình; ứng dụng tự động đi xuống chuỗi và cuối cùng
cung cấp bước nhập khóa/token thủ công được điền từ các plugin nhà cung cấp
suy luận văn bản đang hoạt động của Gateway. Nhà cung cấp được chọn sở hữu mô hình
khởi đầu và cấu hình của mình, còn thông tin xác thực được xác minh theo cùng cách trước khi lưu.

Tính năng giám sát Codex và các tính năng plugin tùy chọn khác nằm ngoài giao dịch
kích hoạt suy luận này. Chỉ cấu hình chúng sau khi khả năng suy luận
hoạt động và OpenClaw đã khởi động; chính sách plugin hiện có và các lựa chọn
tắt giám sát rõ ràng vẫn không bị thay đổi trong quá trình thiết lập suy luận.

## Hội thoại AI

Cuộc hội thoại tự do trong OpenClaw tương tác chạy qua cùng vòng lặp tác nhân như các tác nhân OpenClaw thông thường, nhưng bị giới hạn ở một công cụ thẩm quyền OpenClaw cấp ring-zero duy nhất, `openclaw`, dùng để bao bọc các thao tác có kiểu. Các hành động đọc chạy tự do, thao tác thay đổi yêu cầu bạn phê duyệt qua hội thoại cho chính xác thao tác đó (xem phần Thao tác và phê duyệt), và mọi thao tác ghi đã áp dụng đều được kiểm tra và xác thực lại. Phiên tác nhân được duy trì nên OpenClaw có bộ nhớ nhiều lượt thực sự. Nếu tuyến suy luận đã xác minh sau đó ngừng hoạt động, hãy quay lại `openclaw onboard` và sửa chữa trước khi tiếp tục.

Máy chủ không phân tích các yêu cầu bằng ngôn ngữ tự nhiên thành thao tác. Các tin nhắn
tự do — bao gồm văn bản trông giống lệnh và các câu hỏi như "tại sao gateway của tôi
dừng hoạt động?" — được gửi đến AI, nơi có thể ánh xạ yêu cầu thành thao tác có kiểu
thông qua công cụ `openclaw`.

Khi có một thao tác thay đổi đang chờ xử lý, chỉ các cụm từ phê duyệt hoặc từ chối rõ ràng từ một
danh sách đóng mới được phân giải mà không suy diễn. Sự đồng ý mơ hồ được chuyển đến một
lần gọi hoàn tất được cấu hình riêng và nếu không thì sẽ từ chối theo mặc định. Các trường
trình hướng dẫn có cấu trúc và thao tác điều hướng máy chủ chính xác là các điều khiển UI, không phải hoạt động phân tích
ngôn ngữ tự nhiên. Một ngoại lệ về vệ sinh bí mật đặc biệt quan trọng: một
`config set` chính xác trên đường dẫn nhạy cảm (token, khóa, mật khẩu) không bao giờ đến
mô hình. Máy chủ tạo một đề xuất đã biên tập, và giá trị được che trong
lịch sử mà AI có thể nhìn thấy. Ưu tiên `config set-ref <path> env <ENV_VAR>` cho bí mật.

Chế độ cứu hộ qua kênh tin nhắn không bao giờ sử dụng trình lập kế hoạch được mô hình hỗ trợ. Cứu hộ từ xa luôn mang tính xác định để đường dẫn agent thông thường bị hỏng hoặc bị xâm phạm không thể được dùng làm trình chỉnh sửa cấu hình.

### Mô hình tin cậy của bộ khung CLI

Các runtime nhúng và bộ khung app-server Codex thực thi trực tiếp
hạn chế vòng số không: lượt chạy mang theo danh sách cho phép công cụ OpenClaw chỉ gồm
công cụ `openclaw`. Đối với Codex, OpenClaw cũng vô hiệu hóa các môi trường, thực thi
gốc, đa agent, mục tiêu, ứng dụng/plugin, skill/MCP, tìm kiếm web và các bề mặt
`request_user_input` cho lượt chạy đó. Codex vẫn chèn tiện ích gốc `update_plan` bất hoạt
của mình; tiện ích này có thể cập nhật danh sách kiểm tra tạm thời của mô hình nhưng không thể ghi tệp
hoặc cấu hình OpenClaw. Các bộ khung CLI không sử dụng danh sách cho phép của OpenClaw,
vì vậy OpenClaw chỉ chấp nhận các backend có hợp đồng lựa chọn công cụ riêng có thể chứng minh
cùng hạn chế đó:

- Các backend có thể lựa chọn, bao gồm Claude Code, khởi chạy với phần lựa chọn công cụ gốc
  trống và một công cụ MCP, `openclaw`. Cấu hình MCP được tạo của Claude được
  áp dụng bằng `--strict-mcp-config`, nên không máy chủ MCP nào khác được tải.
- Các backend khai báo không có công cụ gốc nhận cùng máy chủ MCP OpenClaw
  chuyên dụng.
- Các backend có công cụ gốc luôn bật hoặc không xác định sẽ từ chối theo mặc định trước khi suy luận; chúng
  không thể lưu trữ một phiên OpenClaw.

Chỉ các phiên OpenClaw mới nhận máy chủ MCP openclaw; các lượt chạy agent thông thường
không bao giờ thấy công cụ này. Do đó, các backend CLI có thể lựa chọn/không có công cụ gốc và các mô hình dùng khóa API
thực thi vòng lặp đúng một công cụ. Các mô hình app-server Codex thực thi
một công cụ thẩm quyền OpenClaw duy nhất cùng tiện ích lập kế hoạch gốc bất hoạt. Trong cả
ba trường hợp, thao tác ghi thiết lập vẫn bị giới hạn trong hợp đồng phê duyệt đã kiểm toán
của OpenClaw.

Gemini CLI vẫn khả dụng cho các agent thông thường, nhưng không thể thực thi
phép thăm dò không công cụ mà cổng suy luận yêu cầu, nên không thể lưu trữ OpenClaw.

## Chuyển sang một agent

Dùng bộ chọn bằng ngôn ngữ tự nhiên để rời OpenClaw và mở TUI thông thường:

```text
nói chuyện với agent
nói chuyện với agent công việc
chuyển sang agent chính
```

`openclaw tui`, `openclaw chat` và `openclaw terminal` mở trực tiếp TUI agent thông thường; chúng không khởi động OpenClaw. Sau khi chuyển vào TUI thông thường, `/openclaw` quay lại OpenClaw, tùy chọn kèm yêu cầu tiếp theo:

```text
/openclaw
/openclaw khởi động lại gateway
```

## Chế độ cứu hộ qua tin nhắn

Chế độ cứu hộ qua tin nhắn là điểm vào qua kênh tin nhắn cho OpenClaw: dùng chế độ này khi agent thông thường không hoạt động nhưng một kênh đáng tin cậy (ví dụ WhatsApp) vẫn nhận được lệnh.

Đây là trình xử lý lệnh khẩn cấp mang tính xác định, không phải agent OpenClaw
đàm thoại. Nó không khởi tạo một thiết lập mới hoặc nới lỏng cổng suy luận
cho cuộc trò chuyện OpenClaw.

Lệnh được hỗ trợ: `/openclaw <request>`. Cứu hộ chỉ chấp nhận đúng ngữ pháp lệnh đã nhập — ngôn ngữ tự nhiên bị từ chối kèm gợi ý, không bao giờ bị đoán thành một thao tác và không bao giờ tham vấn mô hình.

```text
Bạn, trong DM đáng tin cậy của chủ sở hữu: /openclaw status
OpenClaw: Chế độ cứu hộ OpenClaw. Có thể kết nối Gateway: không. Cấu hình hợp lệ: không.
Bạn: /openclaw restart gateway
OpenClaw: Kế hoạch: khởi động lại Gateway. Trả lời /openclaw yes để áp dụng.
Bạn: /openclaw yes
OpenClaw: Đã áp dụng. Đã ghi mục kiểm toán.
```

Việc tạo agent cũng có thể được xếp hàng cục bộ hoặc qua cứu hộ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

Việc tạo agent chỉ có thể nêu tên mô hình mặc định hiện tại đã được xác minh trực tiếp. Bỏ qua
mô hình để kế thừa tuyến đó.

Cứu hộ từ xa là một bề mặt quản trị và phải được xử lý như sửa chữa cấu hình từ xa, không phải trò chuyện thông thường.

Hợp đồng bảo mật cho cứu hộ từ xa:

- Bị vô hiệu hóa khi sandbox đang hoạt động cho agent/phiên; OpenClaw từ chối cứu hộ từ xa và hướng đến sửa chữa bằng CLI cục bộ.
- Trạng thái hiệu lực mặc định là `auto`: chỉ cho phép cứu hộ từ xa trong hoạt động YOLO đáng tin cậy, nơi runtime đã có thẩm quyền cục bộ không bị sandbox (`tools.exec.security` phân giải thành `full` và `tools.exec.ask` phân giải thành `off`, với chế độ sandbox `off`).
- Yêu cầu danh tính chủ sở hữu rõ ràng; không có quy tắc người gửi ký tự đại diện, chính sách nhóm mở, webhook chưa xác thực hoặc kênh ẩn danh.
- Theo mặc định chỉ dành cho DM của chủ sở hữu; cứu hộ qua nhóm/kênh cần chủ động bật rõ ràng.
- Tìm kiếm và liệt kê Plugin chỉ có quyền đọc. Cài đặt Plugin luôn chỉ thực hiện cục bộ (bị chặn trong cứu hộ, ngay cả khi được bật theo cách khác) vì thao tác này tải xuống mã thực thi. Gỡ cài đặt Plugin bị từ chối trong cả OpenClaw cục bộ lẫn cứu hộ; chạy `openclaw plugins uninstall <id>` từ terminal.
- Cứu hộ từ xa không thể mở TUI cục bộ hoặc chuyển sang phiên agent tương tác; dùng `openclaw` cục bộ để bàn giao agent.
- Các thao tác ghi bền vững vẫn cần phê duyệt, ngay cả trong chế độ cứu hộ.
- Các phê duyệt đang chờ chỉ dùng được một lần. Mọi lệnh cứu hộ mới hơn cho cùng tài khoản, kênh và người gửi đều thu hồi kế hoạch cũ hơn; thực thi thất bại cũng tiêu thụ phê duyệt, vì vậy hãy gửi lại lệnh để thử lại.
- Mọi thao tác cứu hộ đã áp dụng đều được kiểm toán. Cứu hộ qua kênh tin nhắn ghi lại siêu dữ liệu kênh, tài khoản, người gửi và địa chỉ nguồn; các thao tác thay đổi cấu hình cũng ghi lại hàm băm cấu hình trước và sau.
- Bí mật không bao giờ được hiển thị lại. Việc kiểm tra SecretRef báo cáo tính khả dụng, không báo cáo giá trị.
- Nếu Gateway đang hoạt động, cứu hộ ưu tiên các thao tác có kiểu của Gateway; nếu Gateway không hoạt động, cứu hộ chỉ sử dụng bề mặt sửa chữa cục bộ tối thiểu không phụ thuộc vào vòng lặp agent thông thường.

Hình dạng cấu hình:

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (mặc định) chỉ cho phép cứu hộ khi runtime hiệu lực là YOLO và sandbox bị tắt; `false` không bao giờ cho phép cứu hộ qua kênh tin nhắn; `true` cho phép rõ ràng cứu hộ khi các bước kiểm tra chủ sở hữu/kênh đạt yêu cầu (vẫn chịu quy tắc từ chối do sandbox).
- `ownerDmOnly`: giới hạn cứu hộ trong tin nhắn trực tiếp của chủ sở hữu. Mặc định `true`.
- `pendingTtlMinutes`: khoảng thời gian một thao tác ghi cứu hộ đang chờ vẫn mở để phê duyệt `/openclaw yes` trước khi hết hạn. Mặc định `15`.

`openclaw doctor --fix` di chuyển khối cấu hình `crestodian` cũ sang
`systemAgent`. Runtime chỉ đọc khối chuẩn tắc.

Cứu hộ từ xa được bao phủ bởi làn Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Một phép kiểm tra nhanh bề mặt lệnh kênh trực tiếp cần chủ động bật kiểm tra `/openclaw status` cùng một vòng khứ hồi phê duyệt bền vững qua trình xử lý cứu hộ:

```bash
pnpm test:live:system-agent-rescue-channel
```

Thiết lập một lần được đóng gói có cổng suy luận được bao phủ bởi:

```bash
pnpm test:docker:system-agent-first-run
```

Làn CLI đóng gói đó bắt đầu với thư mục trạng thái trống và chứng minh OpenClaw
từ chối theo mặc định khi không có suy luận. Sau đó, nó kiểm thử và kích hoạt Claude giả thông qua
mô-đun kích hoạt đóng gói. Chỉ sau đó, một yêu cầu mơ hồ mới đến được
trình lập kế hoạch và phân giải thành thiết lập có kiểu, tiếp theo là các lệnh một lần để tạo
một agent bổ sung, cấu hình Discord thông qua việc bật Plugin cùng token
SecretRef, xác thực cấu hình và kiểm tra nhật ký kiểm toán. Làn này là bằng chứng hỗ trợ
cho cổng/thao tác; nó không thực hiện quy trình làm quen tương tác hoặc cuộc hội thoại
agent/công cụ/phê duyệt của OpenClaw. Kịch bản QA Lab dưới đây chuyển hướng
đến cùng làn Docker:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/cli/doctor)
- [TUI](/vi/cli/tui)
- [Sandbox](/vi/cli/sandbox)
- [Bảo mật](/vi/cli/security)
