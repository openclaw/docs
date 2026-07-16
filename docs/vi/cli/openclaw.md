---
read_when:
    - Bạn đã hoàn tất thiết lập suy luận và muốn OpenClaw cấu hình phần còn lại
    - Bạn cần kiểm tra hoặc sửa chữa OpenClaw bằng tác nhân thiết lập cục bộ
    - Bạn đang thiết kế hoặc bật chế độ cứu hộ cho kênh nhắn tin
summary: Tham chiếu CLI và mô hình bảo mật cho trình trợ giúp thiết lập và sửa chữa OpenClaw dựa trên suy luận
title: Tác nhân thiết lập OpenClaw
x-i18n:
    generated_at: "2026-07-16T15:06:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw đi kèm một tác nhân hệ thống tích hợp sẵn — tác nhân này giao tiếp với tên "OpenClaw" — để
thiết lập, sửa chữa và cấu hình cục bộ (trước đây gọi là Crestodian). Tác nhân chỉ khởi động sau khi mô hình mặc định có hiệu lực hoàn tất một lượt thực sự.
Bản cài đặt mới sẽ thiết lập suy luận trước; cấu hình sai định dạng vẫn đi theo
luồng doctor cổ điển.

## Khi nào tác nhân khởi động

Việc chạy `openclaw` mà không có lệnh con sẽ định tuyến dựa trên trạng thái cấu hình:

- Thiếu cấu hình hoặc cấu hình tồn tại nhưng không có thiết lập do người dùng tạo (trống hoặc chỉ có các khóa `$schema`/`meta`): bắt đầu quy trình làm quen có hướng dẫn với bước xác minh AI trực tiếp.
- Cấu hình tồn tại nhưng không vượt qua bước xác thực: bắt đầu quy trình làm quen cổ điển, báo cáo các vấn đề và hướng dẫn bạn đến `openclaw doctor`.
- Cấu hình tồn tại và hợp lệ: mở TUI tác nhân thông thường. Một Gateway đã cấu hình và có thể truy cập, với tác nhân mặc định đã có mô hình, sẽ chuyển thẳng đến giao diện đó
  mà không qua quy trình làm quen hoặc OpenClaw. Dùng `/openclaw` trong TUI hoặc chạy
  trực tiếp `openclaw setup` để truy cập OpenClaw sau.

Việc chạy `openclaw setup` trước tiên sẽ kiểm thử trực tiếp mô hình mặc định đã cấu hình. Một lượt thành công sẽ khởi động OpenClaw. Nếu có lỗi trong chế độ tương tác, hệ thống sẽ mở quy trình thiết lập suy luận có hướng dẫn và chuyển sang OpenClaw sau khi một ứng viên vượt qua kiểm thử. Các yêu cầu một lần, JSON và những yêu cầu không tương tác khác sẽ thất bại kèm hướng dẫn chạy `openclaw onboard` khi suy luận không khả dụng. `openclaw --help` và `openclaw --version` vẫn giữ các luồng nhanh thông thường.

Lệnh `openclaw` trần trong chế độ không tương tác (không có TTY) sẽ thoát với một thông báo ngắn thay vì in phần trợ giúp gốc: thông báo này trỏ đến quy trình làm quen không tương tác trên bản cài đặt mới hoặc không hợp lệ, hoặc đến `openclaw agent --local ...` khi cấu hình hợp lệ.

`openclaw onboard --modern` vẫn là bí danh tương thích cho OpenClaw nhưng sử dụng cùng cổng kiểm tra suy luận: suy luận hoạt động sẽ mở cuộc trò chuyện, lỗi trong chế độ tương tác sẽ bắt đầu quy trình thiết lập suy luận có hướng dẫn, còn lỗi trong chế độ không tương tác sẽ thoát kèm hướng dẫn làm quen. `openclaw onboard --classic` mở trình hướng dẫn đầy đủ theo từng bước.

## Nội dung OpenClaw hiển thị

OpenClaw tương tác mở cùng một lớp vỏ TUI như `openclaw tui`, với phần phụ trợ trò chuyện OpenClaw. Lời chào khi khởi động bao gồm:

- tính hợp lệ của cấu hình và tác nhân mặc định
- mô hình đã xác minh mà OpenClaw đang sử dụng
- khả năng truy cập Gateway từ lần thăm dò khởi động đầu tiên
- hành động gỡ lỗi tiếp theo được đề xuất

OpenClaw không xuất hàng loạt bí mật hoặc tải các lệnh CLI của plugin chỉ để khởi động.

Dùng `status` để xem bản kiểm kê chi tiết: đường dẫn cấu hình, đường dẫn tài liệu/mã nguồn, các phép thăm dò CLI cục bộ, sự hiện diện của khóa/token, tác nhân, mô hình và thông tin chi tiết về Gateway.

OpenClaw sử dụng cùng cơ chế khám phá tài liệu tham chiếu như các tác nhân thông thường: trong một bản checkout Git, nó trỏ đến `docs/` cục bộ và cây mã nguồn; trong bản cài đặt npm, nó sử dụng tài liệu đi kèm và liên kết đến [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), kèm hướng dẫn kiểm tra mã nguồn khi tài liệu chưa đủ.

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
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Thao tác và phê duyệt

OpenClaw sử dụng các thao tác có kiểu thay vì chỉnh sửa cấu hình tùy tiện.

Các thao tác chỉ đọc được thực thi ngay lập tức: hiển thị tổng quan, liệt kê tác nhân, liệt kê các plugin đã cài đặt, tìm kiếm plugin ClawHub, hiển thị trạng thái mô hình/phần phụ trợ, chạy kiểm tra trạng thái/tình trạng, kiểm tra khả năng truy cập Gateway, chạy doctor mà không sửa lỗi tương tác, xác thực cấu hình, hiển thị đường dẫn nhật ký kiểm toán.

Việc bắt đầu thiết lập kênh có hướng dẫn (`connect telegram`) cũng được thực thi ngay lập tức. Trình hướng dẫn của quy trình này thu thập câu trả lời rõ ràng và chịu trách nhiệm cho các thao tác ghi phát sinh.

Các thao tác lâu dài yêu cầu phê duyệt qua hội thoại (hoặc `--yes` đối với lệnh trực tiếp): ghi cấu hình, `config set`, `config set-ref`, khởi tạo thiết lập/quy trình làm quen, thay đổi mô hình mặc định, khởi động/dừng/khởi động lại Gateway, tạo tác nhân và cài đặt plugin.

Các sửa chữa của doctor không khả dụng bên trong OpenClaw vì chúng có thể ghi lại nhà cung cấp, xác thực hoặc tuyến suy luận của tác nhân mặc định đang vận hành phiên. Thoát OpenClaw và chạy `openclaw doctor --fix` trong terminal. Lệnh chỉ đọc `doctor` vẫn khả dụng bên trong OpenClaw.

Tác nhân mới kế thừa tuyến suy luận mặc định đã được xác minh trực tiếp. Các ID tác nhân `openclaw` và `crestodian` được dành riêng cho tác nhân hệ thống và không thể được tạo như tác nhân thông thường. ID đã ngừng sử dụng vẫn bị chặn để cấu hình cũ không thể chiếm dụng ID đó.

`config set` và `config set-ref` không thể thay đổi trạng thái tuyến suy luận,
bao gồm thông tin xác thực của nhà cung cấp suy luận, `auth.*` cấp cao nhất, danh mục mô hình,
phần phụ trợ CLI, tuyến mô hình mặc định/theo tác nhân, tham số/công cụ tác nhân hoặc
`tools.*` gốc. Các thao tác ghi thô dưới `env.*`, `secrets.*`, `plugins.*` và `$include`
cũng bị từ chối vì chúng có thể thay thế cơ chế phân giải thông tin xác thực hoặc kích hoạt
nhà cung cấp. Xác thực Gateway và kênh vẫn là các bề mặt cấu hình thông thường. Sử dụng quy trình plugin/kênh có kiểu và
`set default model <provider/model>` cho tuyến đã
được cấu hình; hệ thống sẽ kiểm thử trực tiếp tuyến trước khi lưu. Để cấu hình hoặc
sửa chữa quyền truy cập nhà cung cấp/xác thực, hãy thoát OpenClaw và chạy `openclaw onboard`.

Việc gỡ cài đặt plugin bị từ chối bên trong OpenClaw vì xóa plugin
nhà cung cấp có thể vô hiệu hóa tuyến suy luận đang vận hành phiên. Thoát OpenClaw
và chạy `openclaw plugins uninstall <id>` từ terminal.

Bạn phê duyệt bằng lời của chính mình: các câu trả lời rõ ràng ("có", "được", "tiếp tục đi", "chưa phải lúc này") được phân giải từ một danh sách đóng và xác định. Khi tuyến đã cấu hình hỗ trợ một lệnh gọi hoàn thành riêng biệt, các câu trả lời khác chỉ có thể được phân loại dựa trên thông điệp của bạn và đề xuất đang chờ xử lý — tuyệt đối không phải bởi chính mô hình hội thoại, vì mô hình không thể tự phê duyệt. Các câu trả lời không phân loại được hoặc mơ hồ sẽ khiến đề xuất tiếp tục chờ xử lý và cuộc hội thoại sẽ hỏi lại.

Các thao tác ghi đã áp dụng được ghi lại trong `~/.openclaw/audit/system-agent.jsonl`. Hoạt động khám phá không được kiểm toán; chỉ các thao tác và thao tác ghi đã áp dụng mới được kiểm toán.

Quy trình thiết lập kênh có thể diễn ra dưới dạng hội thoại được lưu trữ cho đến khi gặp một bí mật. TUI OpenClaw
cục bộ không chấp nhận các câu trả lời nhạy cảm cho trình hướng dẫn vì dữ liệu nhập
trò chuyện trong terminal có thể nhìn thấy. TUI cung cấp ngay `open channel wizard`, mang
kênh đã chọn sang trình hướng dẫn terminal có che dữ liệu; bạn cũng có thể chạy
`openclaw channels add --channel <channel>` sau.

### Chuyển sang thiết lập kênh có che dữ liệu

Cuộc trò chuyện cục bộ có thể chuyển quyền điều khiển cho trình hướng dẫn kênh có che dữ liệu:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` mở quy trình thiết lập kênh có che dữ liệu sau khi TUI
trò chuyện đóng. Trước tiên, hãy dùng `channel info <channel>` để xem nhãn kênh, trạng thái
thiết lập, phần tóm tắt điều kiện tiên quyết và liên kết tài liệu.

OpenClaw không bao giờ thay đổi quyền truy cập nhà cung cấp/xác thực từ bên trong chính phiên của nó: phiên
đã phụ thuộc vào tuyến suy luận đó. Đối với việc thiết lập hoặc
sửa chữa nhà cung cấp mô hình, `configure model provider` trả về hướng dẫn thoát/làm quen mà không
khởi động trình hướng dẫn hoặc ghi cấu hình. Thoát OpenClaw và chạy `openclaw
onboard`; quy trình làm quen chuẩn bị thông tin xác thực và chỉ lưu tuyến
hoàn tất thành công một lượt trực tiếp thực sự. Khởi động lại OpenClaw sau khi quy trình làm quen thành công.

## Khởi tạo thiết lập

`setup` cấu hình không gian làm việc và trạng thái Gateway còn lại sau khi quy trình làm quen có hướng dẫn đã thiết lập suy luận. Lệnh này chỉ ghi thông qua các thao tác cấu hình có kiểu và yêu cầu phê duyệt trước.

```text
setup
setup workspace ~/Projects/work
```

`setup` giữ nguyên mô hình hiệu lực đã xác minh. Lệnh này không cấu hình hoặc
thay thế suy luận.

Nếu thiếu suy luận hoặc kiểm tra trực tiếp thất bại, hãy rời OpenClaw và chạy `openclaw onboard`. Quy trình làm quen có hướng dẫn phát hiện các mô hình đã cấu hình, khóa API và CLI cục bộ đã xác thực, yêu cầu từng ứng viên tạo một phản hồi thực sự và chỉ lưu tuyến vượt qua kiểm thử. OpenClaw khởi động ngay sau ranh giới đó, rồi có thể cấu hình không gian làm việc, Gateway, kênh, tác nhân, plugin và các tính năng tùy chọn khác.

Ứng dụng macOS bỏ qua hoàn toàn chuỗi bước này khi kết nối được với một Gateway đã cấu hình
mà tác nhân mặc định đã có mô hình được cấu hình; ứng dụng sẽ mở giao diện
tác nhân thông thường.
Đối với Gateway mới hoặc chưa hoàn chỉnh, ứng dụng điều khiển chuỗi suy luận thông qua
các phương thức Gateway `openclaw.setup.detect` và `openclaw.setup.activate`:
detect liệt kê mọi phần phụ trợ ứng viên tìm thấy, activate kiểm thử trực tiếp một
ứng viên (một lần hoàn thành thực sự "reply with OK") và chỉ lưu mô hình,
thông tin xác thực cùng trạng thái nhà cung cấp/runtime cần thiết cho tuyến đó sau khi kiểm thử thành công. Các giá trị mặc định của không gian làm việc và Gateway vẫn dành cho OpenClaw. Ứng viên thất bại
không bao giờ thay đổi cấu hình; ứng dụng tự động duyệt xuống chuỗi và cuối cùng
cung cấp bước nhập khóa/token thủ công, được điền từ các plugin nhà cung cấp
suy luận văn bản đang hoạt động của Gateway. Nhà cung cấp được chọn sở hữu mô hình
khởi đầu và cấu hình của mình, đồng thời thông tin xác thực được xác minh theo cùng cách trước khi lưu.

Tính năng giám sát Codex và các tính năng plugin tùy chọn khác nằm ngoài
giao dịch kích hoạt suy luận này. Chỉ cấu hình chúng sau khi suy luận
hoạt động và OpenClaw đã khởi động; chính sách plugin hiện có cùng các lựa chọn
từ chối giám sát rõ ràng vẫn không bị thay đổi trong quá trình thiết lập suy luận.

## Hội thoại AI

Hội thoại tự do trong OpenClaw tương tác chạy qua cùng vòng lặp tác nhân như các tác nhân OpenClaw thông thường, nhưng bị giới hạn ở một công cụ thẩm quyền OpenClaw cấp ring-zero là `openclaw`, công cụ này bao bọc các thao tác có kiểu. Các hành động đọc được thực thi tự do, các thay đổi yêu cầu bạn phê duyệt qua hội thoại cho chính xác thao tác đó (xem Thao tác và phê duyệt), và mọi thao tác ghi đã áp dụng đều được kiểm toán và xác thực lại. Phiên tác nhân được duy trì, vì vậy OpenClaw có bộ nhớ đa lượt thực sự. Nếu tuyến suy luận đã xác minh sau đó ngừng hoạt động, hãy quay lại `openclaw onboard` và sửa chữa trước khi tiếp tục.

Máy chủ không phân tích yêu cầu ngôn ngữ tự nhiên thành thao tác. Các thông điệp
tự do — bao gồm văn bản trông giống lệnh và các câu hỏi như "tại sao
gateway của tôi dừng hoạt động?" — được gửi đến AI, AI có thể ánh xạ yêu cầu sang một thao tác có kiểu
thông qua công cụ `openclaw`.

Khi một thay đổi đang chờ xử lý, chỉ các cụm từ phê duyệt hoặc từ chối rõ ràng trong
một danh sách đóng mới được phân giải mà không cần suy luận. Sự đồng thuận mơ hồ được gửi đến một
lệnh gọi hoàn thành đã cấu hình riêng biệt và nếu không thành công thì sẽ từ chối theo hướng an toàn. Các
trường có cấu trúc trong trình hướng dẫn và thao tác điều hướng máy chủ chính xác là các điều khiển giao diện người dùng, không phải cơ chế phân tích
thao tác bằng ngôn ngữ tự nhiên. Một ngoại lệ về vệ sinh bí mật đặc biệt quan trọng: một
`config set` chính xác trên đường dẫn nhạy cảm (token, khóa, mật khẩu) không bao giờ đến
mô hình. Máy chủ tạo một đề xuất đã biên tập và giá trị được che trong
lịch sử mà AI có thể nhìn thấy. Ưu tiên `config set-ref <path> env <ENV_VAR>` cho bí mật.

Chế độ cứu hộ qua kênh tin nhắn không bao giờ sử dụng bộ lập kế hoạch có hỗ trợ của mô hình. Hoạt động cứu hộ từ xa luôn mang tính xác định để một đường dẫn tác nhân thông thường bị hỏng hoặc xâm phạm không thể được dùng làm trình chỉnh sửa cấu hình.

### Mô hình tin cậy của bộ kiểm thử CLI

Các runtime nhúng và bộ kiểm thử app-server Codex thực thi trực tiếp giới hạn ring-zero: lượt chạy mang theo danh sách cho phép công cụ OpenClaw chỉ gồm công cụ `openclaw`. Đối với Codex, OpenClaw cũng vô hiệu hóa các bề mặt môi trường, thực thi gốc, đa tác tử, mục tiêu, ứng dụng/plugin, skill/MCP, tìm kiếm web và `request_user_input` cho lượt chạy đó. Codex vẫn chèn tiện ích gốc bất hoạt `update_plan`; tiện ích này có thể cập nhật danh sách kiểm tra tạm thời của mô hình nhưng không thể ghi tệp hoặc cấu hình OpenClaw. Các bộ kiểm thử CLI không sử dụng danh sách cho phép của OpenClaw, vì vậy OpenClaw chỉ chấp nhận những backend có hợp đồng lựa chọn công cụ riêng có thể chứng minh cùng một giới hạn:

- Các backend có thể lựa chọn, bao gồm Claude Code, khởi chạy với lựa chọn công cụ gốc trống và một công cụ MCP, `openclaw`. Cấu hình MCP được tạo của Claude được áp dụng bằng `--strict-mcp-config`, nên không có máy chủ MCP nào khác được tải.
- Các backend khai báo không có công cụ gốc sẽ nhận cùng một máy chủ MCP OpenClaw chuyên dụng.
- Các backend có công cụ gốc luôn bật hoặc không xác định sẽ từ chối an toàn trước khi suy luận; chúng không thể lưu trữ một phiên OpenClaw.

Chỉ các phiên OpenClaw mới nhận được máy chủ MCP openclaw; các lượt chạy tác tử thông thường không bao giờ thấy công cụ này. Vì vậy, các backend CLI có thể lựa chọn/không có công cụ gốc và các mô hình dùng khóa API thực thi vòng lặp đúng một công cụ theo nghĩa đen. Các mô hình app-server Codex thực thi một công cụ thẩm quyền OpenClaw duy nhất cùng với tiện ích lập kế hoạch gốc bất hoạt. Trong cả ba trường hợp, thao tác ghi thiết lập vẫn bị giới hạn trong hợp đồng phê duyệt đã được kiểm toán của OpenClaw.

Gemini CLI vẫn dùng được cho các tác tử thông thường, nhưng không thể thực thi phép thăm dò không công cụ mà cổng suy luận yêu cầu, nên không thể lưu trữ OpenClaw.

## Chuyển sang một tác tử

Dùng bộ chọn bằng ngôn ngữ tự nhiên để rời OpenClaw và mở TUI thông thường:

```text
trò chuyện với tác tử
trò chuyện với tác tử công việc
chuyển sang tác tử chính
```

`openclaw tui`, `openclaw chat` và `openclaw terminal` mở trực tiếp TUI tác tử thông thường; chúng không khởi động OpenClaw. Sau khi chuyển sang TUI thông thường, `/openclaw` quay lại OpenClaw, có thể kèm theo một yêu cầu tiếp nối:

```text
/openclaw
/openclaw restart gateway
```

## Chế độ cứu hộ qua tin nhắn

Chế độ cứu hộ qua tin nhắn là điểm vào từ kênh nhắn tin dành cho OpenClaw: dùng chế độ này khi tác tử thông thường ngừng hoạt động nhưng một kênh đáng tin cậy (ví dụ WhatsApp) vẫn nhận được lệnh.

Đây là trình xử lý lệnh khẩn cấp có tính xác định, không phải tác tử OpenClaw hội thoại. Nó không khởi tạo một thiết lập mới hoặc nới lỏng cổng suy luận cho cuộc trò chuyện OpenClaw.

Lệnh được hỗ trợ: `/openclaw <request>`. Cứu hộ chỉ chấp nhận đúng ngữ pháp lệnh được nhập — ngôn ngữ tự nhiên bị từ chối kèm gợi ý, không bao giờ bị suy đoán thành một thao tác và không mô hình nào được tham vấn.

```text
Bạn, trong tin nhắn trực tiếp đáng tin cậy của chủ sở hữu: /openclaw status
OpenClaw: Chế độ cứu hộ OpenClaw. Có thể kết nối Gateway: không. Cấu hình hợp lệ: không.
Bạn: /openclaw restart gateway
OpenClaw: Kế hoạch: khởi động lại Gateway. Trả lời /openclaw yes để áp dụng.
Bạn: /openclaw yes
OpenClaw: Đã áp dụng. Đã ghi mục kiểm toán.
```

Cũng có thể xếp hàng việc tạo tác tử cục bộ hoặc qua cứu hộ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

Khi tạo tác tử, chỉ có thể chỉ định mô hình mặc định hiện tại đã được xác minh trực tiếp. Bỏ qua mô hình để kế thừa tuyến đó.

Cứu hộ từ xa là một bề mặt quản trị và phải được xử lý như sửa chữa cấu hình từ xa, không phải trò chuyện thông thường.

Hợp đồng bảo mật cho cứu hộ từ xa:

- Bị vô hiệu hóa khi sandbox đang hoạt động cho tác tử/phiên; OpenClaw từ chối cứu hộ từ xa và hướng đến sửa chữa bằng CLI cục bộ.
- Trạng thái hiệu lực mặc định là `auto`: chỉ cho phép cứu hộ từ xa trong chế độ vận hành YOLO đáng tin cậy, khi runtime đã có thẩm quyền cục bộ không bị sandbox giới hạn (`tools.exec.security` phân giải thành `full` và `tools.exec.ask` phân giải thành `off`, với chế độ sandbox `off`).
- Yêu cầu danh tính chủ sở hữu rõ ràng; không cho phép quy tắc người gửi ký tự đại diện, chính sách nhóm mở, Webhook chưa xác thực hoặc kênh ẩn danh.
- Theo mặc định chỉ cho phép tin nhắn trực tiếp của chủ sở hữu; cứu hộ trong nhóm/kênh cần được chủ động bật rõ ràng.
- Tìm kiếm và liệt kê plugin chỉ có quyền đọc. Việc cài đặt plugin luôn chỉ được thực hiện cục bộ (bị chặn trong cứu hộ, ngay cả khi được bật theo cách khác) vì thao tác này tải xuống mã thực thi. Việc gỡ cài đặt plugin bị từ chối trong cả OpenClaw cục bộ lẫn chế độ cứu hộ; chạy `openclaw plugins uninstall <id>` từ terminal.
- Cứu hộ từ xa không thể mở TUI cục bộ hoặc chuyển sang phiên tác tử tương tác; dùng `openclaw` cục bộ để bàn giao cho tác tử.
- Các thao tác ghi bền vững vẫn cần được phê duyệt, kể cả trong chế độ cứu hộ.
- Các phê duyệt đang chờ chỉ dùng được một lần. Bất kỳ lệnh cứu hộ nào mới hơn cho cùng tài khoản, kênh và người gửi đều thu hồi kế hoạch cũ; thực thi thất bại cũng tiêu thụ phê duyệt, vì vậy hãy gửi lại lệnh để thử lại.
- Mọi thao tác cứu hộ đã áp dụng đều được kiểm toán. Cứu hộ qua kênh nhắn tin ghi lại siêu dữ liệu về kênh, tài khoản, người gửi và địa chỉ nguồn; các thao tác thay đổi cấu hình cũng ghi lại hàm băm cấu hình trước và sau.
- Các bí mật không bao giờ được hiển thị lại. Việc kiểm tra SecretRef chỉ báo cáo tính khả dụng, không báo cáo giá trị.
- Nếu Gateway đang hoạt động, cứu hộ ưu tiên các thao tác có kiểu của Gateway; nếu Gateway ngừng hoạt động, cứu hộ chỉ dùng bề mặt sửa chữa cục bộ tối thiểu không phụ thuộc vào vòng lặp tác tử thông thường.

Dạng cấu hình:

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

- `enabled`: `"auto"` (mặc định) chỉ cho phép cứu hộ khi runtime hiệu lực là YOLO và sandbox đang tắt; `false` không bao giờ cho phép cứu hộ qua kênh nhắn tin; `true` cho phép cứu hộ một cách rõ ràng khi các bước kiểm tra chủ sở hữu/kênh đạt yêu cầu (vẫn chịu sự từ chối khi sandbox đang hoạt động).
- `ownerDmOnly`: giới hạn cứu hộ trong tin nhắn trực tiếp của chủ sở hữu. Mặc định `true`.
- `pendingTtlMinutes`: khoảng thời gian một thao tác ghi cứu hộ đang chờ vẫn mở để được phê duyệt bằng `/openclaw yes` trước khi hết hạn. Mặc định `15`.

`openclaw doctor --fix` di chuyển khối cấu hình cũ `crestodian` sang
`systemAgent`. Runtime chỉ đọc khối chuẩn tắc.

Cứu hộ từ xa được bao phủ bởi lane Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Một phép kiểm tra nhanh bề mặt lệnh kênh trực tiếp cần chủ động bật sẽ kiểm tra `/openclaw status` cùng với một vòng phê duyệt bền vững hoàn chỉnh thông qua trình xử lý cứu hộ:

```bash
pnpm test:live:system-agent-rescue-channel
```

Thiết lập một lần dạng đóng gói có cổng suy luận được bao phủ bởi:

```bash
pnpm test:docker:system-agent-first-run
```

Lane CLI đóng gói đó bắt đầu với thư mục trạng thái trống và chứng minh OpenClaw từ chối an toàn khi không có suy luận. Sau đó, nó kiểm thử và kích hoạt Claude giả thông qua mô-đun kích hoạt đã đóng gói. Chỉ sau đó, một yêu cầu mơ hồ mới đến được trình lập kế hoạch và được phân giải thành thiết lập có kiểu, tiếp theo là các lệnh một lần để tạo thêm một tác tử, cấu hình Discord thông qua việc bật plugin cùng SecretRef cho token, xác thực cấu hình và kiểm tra nhật ký kiểm toán. Lane này cung cấp bằng chứng hỗ trợ cho cổng/thao tác; nó không thực thi quy trình làm quen tương tác hoặc cuộc hội thoại về tác tử/công cụ/phê duyệt của OpenClaw. Kịch bản QA Lab dưới đây chuyển hướng đến cùng lane Docker:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/cli/doctor)
- [TUI](/vi/cli/tui)
- [Sandbox](/vi/cli/sandbox)
- [Bảo mật](/vi/cli/security)
