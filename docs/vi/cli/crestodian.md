---
read_when:
    - Bạn đã hoàn tất việc thiết lập suy luận và muốn Crestodian cấu hình phần còn lại
    - Bạn cần kiểm tra hoặc sửa chữa OpenClaw bằng tác nhân thiết lập cục bộ
    - Bạn đang thiết kế hoặc bật chế độ cứu hộ cho kênh nhắn tin
summary: Tài liệu tham khảo CLI và mô hình bảo mật cho trình trợ giúp thiết lập và sửa chữa Crestodian sử dụng suy luận làm nền tảng
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T07:47:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian hội thoại là tác nhân thiết lập cục bộ, sửa chữa và cấu hình của OpenClaw. Nó chỉ khởi động sau khi mô hình mặc định có hiệu lực hoàn tất một lượt tương tác thực tế. Các bản cài đặt mới thiết lập khả năng suy luận trước; cấu hình sai định dạng vẫn đi theo quy trình doctor cổ điển.

## Khi nào Crestodian khởi động

Chạy `openclaw` mà không có lệnh con sẽ định tuyến dựa trên trạng thái cấu hình:

- Thiếu cấu hình hoặc cấu hình tồn tại nhưng không có thiết lập do người dùng tạo (trống hoặc chỉ có các khóa `$schema`/`meta`): bắt đầu quy trình làm quen có hướng dẫn với bước xác minh AI trực tiếp.
- Cấu hình tồn tại nhưng không vượt qua bước xác thực: bắt đầu quy trình làm quen cổ điển, báo cáo các vấn đề và hướng dẫn bạn đến `openclaw doctor`.
- Cấu hình tồn tại và hợp lệ: mở TUI tác nhân thông thường. Nếu có thể kết nối đến Gateway đã cấu hình và tác nhân mặc định của Gateway có mô hình, giao diện đó sẽ được mở trực tiếp mà không cần quy trình làm quen hoặc Crestodian. Sau này, hãy dùng `/crestodian` trong TUI hoặc chạy trực tiếp `openclaw crestodian` để mở Crestodian.

Khi chạy `openclaw crestodian`, hệ thống trước tiên kiểm thử trực tiếp mô hình mặc định đã cấu hình. Một lượt tương tác thành công sẽ khởi động Crestodian. Nếu xảy ra lỗi trong chế độ tương tác, hệ thống sẽ mở quy trình thiết lập suy luận có hướng dẫn và chuyển sang Crestodian sau khi một phương án vượt qua kiểm thử. Các yêu cầu một lần, JSON và những yêu cầu không tương tác khác sẽ thất bại với hướng dẫn chạy `openclaw onboard` khi không có khả năng suy luận. `openclaw --help` và `openclaw --version` vẫn sử dụng các đường dẫn nhanh thông thường.

Khi chạy `openclaw` đơn lẻ ở chế độ không tương tác (không có TTY), chương trình thoát với một thông báo ngắn thay vì in trợ giúp gốc: thông báo chỉ đến quy trình làm quen không tương tác đối với bản cài đặt mới hoặc không hợp lệ, hoặc đến `openclaw agent --local ...` khi cấu hình hợp lệ.

`openclaw onboard --modern` vẫn là bí danh tương thích cho Crestodian nhưng sử dụng cùng cổng kiểm tra suy luận: khả năng suy luận hoạt động sẽ mở cuộc trò chuyện, lỗi trong chế độ tương tác sẽ bắt đầu quy trình thiết lập suy luận có hướng dẫn, còn lỗi trong chế độ không tương tác sẽ thoát với hướng dẫn làm quen. `openclaw onboard --classic` mở trình hướng dẫn đầy đủ theo từng bước.

## Nội dung Crestodian hiển thị

Crestodian tương tác mở cùng một lớp vỏ TUI như `openclaw tui`, với phần phụ trợ trò chuyện Crestodian. Lời chào khi khởi động bao gồm:

- tính hợp lệ của cấu hình và tác nhân mặc định
- mô hình đã xác minh mà Crestodian đang sử dụng
- khả năng kết nối đến Gateway từ lần thăm dò khởi động đầu tiên
- hành động gỡ lỗi được khuyến nghị tiếp theo

Crestodian không kết xuất bí mật hoặc tải các lệnh CLI của Plugin chỉ để khởi động.

Dùng `status` để xem danh mục chi tiết: đường dẫn cấu hình, đường dẫn tài liệu/mã nguồn, các lần thăm dò CLI cục bộ, sự hiện diện của khóa/token, các tác nhân, mô hình và thông tin chi tiết về Gateway.

Crestodian sử dụng cùng cơ chế khám phá tài liệu tham chiếu như các tác nhân thông thường: trong một bản sao làm việc Git, nó trỏ đến `docs/` cục bộ và cây mã nguồn; trong bản cài đặt npm, nó sử dụng tài liệu đi kèm và liên kết đến [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), đồng thời hướng dẫn kiểm tra mã nguồn khi tài liệu chưa đủ.

## Ví dụ

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Bên trong TUI Crestodian:

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

Crestodian sử dụng các thao tác có kiểu thay vì chỉnh sửa cấu hình tùy ý.

Các thao tác chỉ đọc được thực hiện ngay lập tức: hiển thị tổng quan, liệt kê tác nhân, liệt kê các Plugin đã cài đặt, tìm kiếm Plugin trên ClawHub, hiển thị trạng thái mô hình/phần phụ trợ, chạy kiểm tra trạng thái/tình trạng, kiểm tra khả năng kết nối đến Gateway, chạy doctor mà không sửa chữa tương tác, xác thực cấu hình và hiển thị đường dẫn nhật ký kiểm toán.

Việc bắt đầu thiết lập kênh có hướng dẫn (`connect telegram`) cũng được thực hiện ngay lập tức. Trình hướng dẫn của nó thu thập các câu trả lời rõ ràng và chịu trách nhiệm về các thao tác ghi phát sinh.

Các thao tác có tính lâu dài yêu cầu phê duyệt trong cuộc trò chuyện (hoặc `--yes` đối với lệnh trực tiếp): ghi cấu hình, `config set`, `config set-ref`, khởi tạo thiết lập/quy trình làm quen, thay đổi mô hình mặc định, khởi động/dừng/khởi động lại Gateway, tạo tác nhân và cài đặt Plugin.

Không thể sửa chữa bằng doctor bên trong Crestodian vì thao tác đó có thể viết lại nhà cung cấp, phương thức xác thực hoặc tuyến suy luận của tác nhân mặc định đang vận hành phiên này. Hãy thoát Crestodian và chạy `openclaw doctor --fix` trong terminal. `doctor` ở chế độ chỉ đọc vẫn khả dụng bên trong Crestodian.

Các tác nhân mới kế thừa tuyến suy luận mặc định đã được xác minh trực tiếp. ID tác nhân `crestodian` được dành riêng cho quản gia ảo đặc quyền và không thể được tạo như một tác nhân thông thường.

`config set` và `config set-ref` không thể thay đổi trạng thái tuyến suy luận, bao gồm thông tin xác thực của nhà cung cấp suy luận, `auth.*` cấp cao nhất, danh mục mô hình, phần phụ trợ CLI, tuyến mô hình mặc định/theo từng tác nhân, tham số/công cụ của tác nhân hoặc `tools.*` gốc. Các thao tác ghi thô bên dưới `env.*`, `secrets.*`, `plugins.*` và `$include` cũng bị từ chối vì chúng có thể thay thế cơ chế phân giải thông tin xác thực hoặc kích hoạt nhà cung cấp. Xác thực Gateway và kênh vẫn là các bề mặt cấu hình thông thường. Hãy sử dụng quy trình Plugin/kênh có kiểu và `set default model <provider/model>` cho một tuyến đã được cấu hình; hệ thống kiểm thử trực tiếp tuyến đó trước khi lưu. Để cấu hình hoặc sửa chữa quyền truy cập nhà cung cấp/xác thực, hãy thoát Crestodian và chạy `openclaw onboard`.

Việc gỡ cài đặt Plugin bị từ chối bên trong Crestodian vì xóa một Plugin nhà cung cấp có thể vô hiệu hóa tuyến suy luận đang vận hành phiên này. Hãy thoát Crestodian và chạy `openclaw plugins uninstall <id>` từ terminal.

Bạn có thể phê duyệt bằng lời của mình: các câu trả lời rõ ràng ("có", "được", "tiếp tục đi", "bây giờ thì không") được phân giải từ một danh sách đóng có tính xác định. Khi tuyến đã cấu hình hỗ trợ một lệnh gọi hoàn tất riêng biệt, các câu trả lời khác có thể được phân loại chỉ dựa trên tin nhắn của bạn và đề xuất đang chờ xử lý — tuyệt đối không phải bởi chính mô hình hội thoại, vì mô hình không thể tự phê duyệt. Các câu trả lời không thể phân loại hoặc mơ hồ sẽ giữ đề xuất ở trạng thái chờ và cuộc trò chuyện sẽ hỏi lại.

Các thao tác ghi đã áp dụng được ghi lại trong `~/.openclaw/audit/crestodian.jsonl`. Hoạt động khám phá không được kiểm toán; chỉ các thao tác và thao tác ghi đã áp dụng mới được ghi lại.

Quá trình thiết lập kênh có thể chạy dưới dạng cuộc trò chuyện được lưu trữ cho đến khi gặp một bí mật. TUI Crestodian cục bộ không chấp nhận các câu trả lời nhạy cảm trong trình hướng dẫn vì nội dung nhập vào cuộc trò chuyện trong terminal có thể nhìn thấy được. Nó cung cấp ngay `open channel wizard`, chuyển kênh đã chọn sang trình hướng dẫn terminal có che nội dung; bạn cũng có thể chạy `openclaw channels add --channel <channel>` sau.

### Chuyển sang thiết lập kênh có che nội dung

Cuộc trò chuyện cục bộ có thể chuyển quyền điều khiển sang trình hướng dẫn kênh có che nội dung:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` mở quá trình thiết lập kênh có che nội dung sau khi TUI trò chuyện đóng. Trước tiên, hãy dùng `channel info <channel>` để xem nhãn kênh, trạng thái thiết lập, phần tóm tắt điều kiện tiên quyết và liên kết tài liệu.

Crestodian tuyệt đối không thay đổi quyền truy cập nhà cung cấp/xác thực từ bên trong chính phiên của mình: phiên này vốn đã phụ thuộc vào tuyến suy luận đó. Đối với việc thiết lập hoặc sửa chữa nhà cung cấp mô hình, `configure model provider` trả về hướng dẫn thoát/chạy quy trình làm quen mà không khởi động trình hướng dẫn hoặc ghi cấu hình. Hãy thoát Crestodian và chạy `openclaw onboard`; quy trình làm quen chuẩn bị thông tin xác thực và chỉ lưu một tuyến hoàn tất thành công một lượt tương tác trực tiếp thực tế. Khởi động lại Crestodian sau khi quy trình làm quen thành công.

## Khởi tạo thiết lập

`setup` cấu hình phần trạng thái không gian làm việc và Gateway còn lại sau khi quy trình làm quen có hướng dẫn đã thiết lập khả năng suy luận. Nó chỉ ghi thông qua các thao tác cấu hình có kiểu và yêu cầu phê duyệt trước.

```text
setup
setup workspace ~/Projects/work
```

`setup` giữ nguyên mô hình có hiệu lực đã được xác minh. Nó không cấu hình hoặc thay thế khả năng suy luận.

Nếu thiếu khả năng suy luận hoặc kiểm tra trực tiếp thất bại, hãy rời Crestodian và chạy `openclaw onboard`. Quy trình làm quen có hướng dẫn phát hiện các mô hình đã cấu hình, khóa API và CLI cục bộ đã xác thực, yêu cầu từng phương án đưa ra một câu trả lời thực tế và chỉ lưu tuyến vượt qua kiểm thử. Crestodian khởi động ngay sau ranh giới đó và sau đó có thể cấu hình không gian làm việc, Gateway, kênh, tác nhân, Plugin và các tính năng tùy chọn khác.

Ứng dụng macOS bỏ qua hoàn toàn trình tự này khi kết nối được đến một Gateway đã cấu hình mà tác nhân mặc định đã có mô hình được cấu hình; ứng dụng mở giao diện tác nhân thông thường.
Đối với Gateway mới hoặc chưa hoàn chỉnh, ứng dụng điều khiển trình tự suy luận thông qua các phương thức Gateway `crestodian.setup.detect` và `crestodian.setup.activate`: detect liệt kê mọi phần phụ trợ ứng viên mà nó tìm thấy, activate kiểm thử trực tiếp một ứng viên (một lượt hoàn tất thực tế với yêu cầu "reply with OK") và chỉ lưu mô hình, thông tin xác thực cùng trạng thái nhà cung cấp/môi trường chạy cần thiết cho tuyến đó sau khi kiểm thử thành công. Các giá trị mặc định của không gian làm việc và Gateway vẫn được để lại cho Crestodian. Một ứng viên thất bại tuyệt đối không thay đổi cấu hình; ứng dụng tự động đi xuống trình tự và cuối cùng cung cấp bước nhập khóa/token thủ công, được điền từ các Plugin nhà cung cấp suy luận văn bản đang hoạt động của Gateway. Nhà cung cấp được chọn sở hữu mô hình khởi đầu và cấu hình của mình, còn thông tin xác thực được xác minh theo cùng cách trước khi lưu.

Cơ chế giám sát Codex và các tính năng Plugin tùy chọn khác nằm ngoài giao dịch kích hoạt suy luận này. Chỉ cấu hình chúng sau khi khả năng suy luận hoạt động và Crestodian đã khởi động; chính sách Plugin hiện có và các lựa chọn rõ ràng về việc không dùng giám sát vẫn được giữ nguyên trong quá trình thiết lập suy luận.

## Hội thoại AI

Cuộc hội thoại tự do của Crestodian tương tác chạy qua cùng vòng lặp tác nhân như các tác nhân OpenClaw thông thường, nhưng bị giới hạn ở một công cụ thẩm quyền OpenClaw cấp vòng không duy nhất là `crestodian`, công cụ này bao bọc các thao tác có kiểu. Các hành động đọc được thực hiện tự do, các thay đổi yêu cầu bạn phê duyệt trong cuộc trò chuyện cho chính xác thao tác đó (xem phần Thao tác và phê duyệt), đồng thời mọi thao tác ghi đã áp dụng đều được kiểm toán và xác thực lại. Phiên tác nhân được duy trì, vì vậy Crestodian có bộ nhớ nhiều lượt thực sự. Nếu tuyến suy luận đã xác minh sau đó ngừng hoạt động, hãy quay lại `openclaw onboard` và sửa chữa tuyến trước khi tiếp tục.

Máy chủ không phân tích các yêu cầu ngôn ngữ tự nhiên thành thao tác. Các tin nhắn tự do — bao gồm văn bản trông giống lệnh và những câu hỏi như "tại sao gateway của tôi dừng hoạt động?" — được chuyển đến AI, AI có thể ánh xạ yêu cầu sang một thao tác có kiểu thông qua công cụ `crestodian`.

Khi một thay đổi đang chờ xử lý, chỉ các cụm từ phê duyệt hoặc từ chối rõ ràng trong một danh sách đóng mới được phân giải mà không cần suy luận. Sự đồng ý mơ hồ được chuyển đến một lệnh gọi hoàn tất riêng biệt đã cấu hình và nếu không thể phân giải thì sẽ từ chối theo nguyên tắc an toàn. Các trường có cấu trúc trong trình hướng dẫn và thao tác điều hướng máy chủ chính xác là các điều khiển giao diện người dùng, không phải cơ chế phân tích thao tác từ ngôn ngữ tự nhiên. Một ngoại lệ đặc biệt quan trọng về vệ sinh bí mật là: một lệnh `config set` chính xác trên đường dẫn nhạy cảm (token, khóa, mật khẩu) tuyệt đối không được chuyển đến mô hình. Máy chủ tạo một đề xuất đã che thông tin và giá trị đó được che trong lịch sử mà AI có thể nhìn thấy. Đối với bí mật, nên dùng `config set-ref <path> env <ENV_VAR>`.

Chế độ cứu hộ qua kênh nhắn tin tuyệt đối không sử dụng bộ lập kế hoạch có hỗ trợ của mô hình. Quá trình cứu hộ từ xa luôn có tính xác định để một tuyến tác nhân thông thường bị hỏng hoặc xâm phạm không thể được sử dụng như trình chỉnh sửa cấu hình.

### Mô hình tin cậy của bộ kiểm thử CLI

Các môi trường chạy nhúng và bộ kiểm thử máy chủ ứng dụng Codex áp dụng trực tiếp giới hạn vòng không: lượt chạy mang theo danh sách cho phép công cụ của OpenClaw chỉ gồm công cụ `crestodian`. Đối với Codex, OpenClaw cũng vô hiệu hóa các bề mặt môi trường, thực thi gốc, đa tác nhân, mục tiêu, ứng dụng/Plugin, Skills/MCP, tìm kiếm web và `request_user_input` cho lượt chạy đó. Codex vẫn chèn tiện ích gốc không có khả năng tác động `update_plan`; tiện ích này có thể cập nhật danh sách kiểm tra tạm thời của mô hình nhưng không thể ghi tệp hoặc cấu hình OpenClaw. Các bộ kiểm thử CLI không sử dụng danh sách cho phép của OpenClaw, vì vậy Crestodian chỉ chấp nhận những phần phụ trợ có hợp đồng lựa chọn công cụ riêng có thể chứng minh cùng một giới hạn:

- Các backend có thể lựa chọn, bao gồm Claude Code, khởi chạy với danh sách công cụ gốc trống và một công cụ MCP là `crestodian`. Cấu hình MCP do Claude tạo được áp dụng với `--strict-mcp-config`, vì vậy không có máy chủ MCP nào khác được nạp.
- Các backend khai báo không có công cụ gốc sẽ nhận cùng một máy chủ MCP Crestodian chuyên dụng.
- Các backend có công cụ gốc luôn bật hoặc không xác định sẽ đóng an toàn trước khi suy luận; chúng không thể lưu trữ một phiên Crestodian.

Chỉ các phiên Crestodian mới nhận được máy chủ MCP crestodian; các lượt chạy tác nhân thông thường không bao giờ thấy công cụ này. Vì vậy, các backend CLI có thể lựa chọn/không có công cụ gốc và các mô hình dùng khóa API thực thi vòng lặp đúng một công cụ theo nghĩa đen. Các mô hình máy chủ ứng dụng Codex thực thi một công cụ thẩm quyền OpenClaw duy nhất cùng tiện ích lập kế hoạch gốc không hoạt động. Trong cả ba trường hợp, các thao tác ghi thiết lập vẫn bị giới hạn trong hợp đồng phê duyệt đã được kiểm toán của Crestodian.

Gemini CLI vẫn khả dụng cho các tác nhân thông thường, nhưng không thể thực thi phép thăm dò không dùng công cụ mà cổng suy luận yêu cầu, vì vậy không thể lưu trữ Crestodian.

## Chuyển sang một tác nhân

Dùng bộ chọn bằng ngôn ngữ tự nhiên để rời Crestodian và mở TUI thông thường:

```text
trò chuyện với tác nhân
trò chuyện với tác nhân công việc
chuyển sang tác nhân chính
```

`openclaw tui`, `openclaw chat` và `openclaw terminal` mở trực tiếp TUI tác nhân thông thường; chúng không khởi động Crestodian. Sau khi chuyển sang TUI thông thường, `/crestodian` sẽ quay lại Crestodian, tùy chọn kèm theo một yêu cầu tiếp nối:

```text
/crestodian
/crestodian restart gateway
```

## Chế độ cứu hộ tin nhắn

Chế độ cứu hộ tin nhắn là điểm vào Crestodian qua kênh nhắn tin: hãy dùng chế độ này khi tác nhân thông thường của bạn đã ngừng hoạt động nhưng một kênh đáng tin cậy (ví dụ WhatsApp) vẫn nhận được lệnh.

Đây là một trình xử lý lệnh khẩn cấp có tính xác định, không phải tác nhân Crestodian hội thoại. Nó không khởi tạo một thiết lập mới hoặc nới lỏng cổng suy luận cho trò chuyện Crestodian.

Lệnh được hỗ trợ: `/crestodian <request>`. Cứu hộ chỉ chấp nhận đúng ngữ pháp lệnh được nhập — ngôn ngữ tự nhiên bị từ chối kèm gợi ý, không bao giờ được đoán thành một thao tác và không bao giờ tham vấn mô hình.

```text
Bạn, trong tin nhắn riêng đáng tin cậy của chủ sở hữu: /crestodian status
OpenClaw: Chế độ cứu hộ Crestodian. Gateway có thể truy cập: không. Cấu hình hợp lệ: không.
Bạn: /crestodian restart gateway
OpenClaw: Kế hoạch: khởi động lại Gateway. Trả lời /crestodian yes để áp dụng.
Bạn: /crestodian yes
OpenClaw: Đã áp dụng. Đã ghi mục kiểm toán.
```

Việc tạo tác nhân cũng có thể được đưa vào hàng đợi cục bộ hoặc qua cứu hộ:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

Việc tạo tác nhân chỉ có thể chỉ định mô hình mặc định hiện tại đã được xác minh trực tiếp. Bỏ qua mô hình để kế thừa tuyến đó.

Cứu hộ từ xa là một bề mặt quản trị và phải được xử lý như sửa chữa cấu hình từ xa, không phải trò chuyện thông thường.

Hợp đồng bảo mật cho cứu hộ từ xa:

- Bị vô hiệu hóa khi cơ chế hộp cát đang hoạt động cho tác nhân/phiên; Crestodian từ chối cứu hộ từ xa và hướng người dùng đến sửa chữa bằng CLI cục bộ.
- Trạng thái hiệu lực mặc định là `auto`: chỉ cho phép cứu hộ từ xa trong chế độ vận hành YOLO đáng tin cậy, khi môi trường chạy đã có thẩm quyền cục bộ không bị hộp cát giới hạn (`tools.exec.security` phân giải thành `full` và `tools.exec.ask` phân giải thành `off`, với chế độ hộp cát là `off`).
- Yêu cầu danh tính chủ sở hữu rõ ràng; không cho phép quy tắc người gửi ký tự đại diện, chính sách nhóm mở, Webhook chưa xác thực hoặc kênh ẩn danh.
- Theo mặc định, chỉ cho phép tin nhắn riêng của chủ sở hữu; cứu hộ qua nhóm/kênh cần được bật rõ ràng.
- Tìm kiếm và liệt kê Plugin chỉ có quyền đọc. Việc cài đặt Plugin luôn chỉ được thực hiện cục bộ (bị chặn trong cứu hộ, ngay cả khi được bật ở nơi khác) vì thao tác này tải xuống mã thực thi. Việc gỡ cài đặt Plugin bị từ chối trong cả Crestodian cục bộ lẫn cứu hộ; hãy chạy `openclaw plugins uninstall <id>` từ thiết bị đầu cuối.
- Cứu hộ từ xa không thể mở TUI cục bộ hoặc chuyển sang phiên tác nhân tương tác; hãy dùng `openclaw` cục bộ để bàn giao cho tác nhân.
- Các thao tác ghi bền vững vẫn cần được phê duyệt, kể cả trong chế độ cứu hộ.
- Mọi thao tác cứu hộ đã áp dụng đều được kiểm toán. Cứu hộ qua kênh nhắn tin ghi lại kênh, tài khoản, người gửi và siêu dữ liệu địa chỉ nguồn; các thao tác thay đổi cấu hình cũng ghi lại hàm băm cấu hình trước và sau.
- Bí mật không bao giờ được hiển thị lại. Việc kiểm tra SecretRef chỉ báo cáo tính khả dụng, không báo cáo giá trị.
- Nếu Gateway đang hoạt động, cứu hộ ưu tiên các thao tác có kiểu của Gateway; nếu Gateway đã ngừng hoạt động, cứu hộ chỉ dùng bề mặt sửa chữa cục bộ tối thiểu không phụ thuộc vào vòng lặp tác nhân thông thường.

Cấu trúc cấu hình:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (mặc định) chỉ cho phép cứu hộ khi môi trường chạy hiệu lực ở chế độ YOLO và cơ chế hộp cát đã tắt; `false` không bao giờ cho phép cứu hộ qua kênh nhắn tin; `true` cho phép cứu hộ một cách rõ ràng khi các bước kiểm tra chủ sở hữu/kênh đạt yêu cầu (vẫn chịu quy tắc từ chối khi có cơ chế hộp cát).
- `ownerDmOnly`: giới hạn cứu hộ trong tin nhắn trực tiếp của chủ sở hữu. Mặc định là `true`.
- `pendingTtlMinutes`: khoảng thời gian một thao tác ghi cứu hộ đang chờ vẫn được mở để phê duyệt bằng `/crestodian yes` trước khi hết hạn. Mặc định là `15`.

Cứu hộ từ xa được bao phủ bởi luồng Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Một kiểm tra nhanh bề mặt lệnh kênh trực tiếp cần chủ động bật sẽ kiểm tra `/crestodian status` cùng một vòng khứ hồi phê duyệt bền vững thông qua trình xử lý cứu hộ:

```bash
pnpm test:live:crestodian-rescue-channel
```

Thiết lập một lần đã đóng gói và được bảo vệ bằng cổng suy luận được bao phủ bởi:

```bash
pnpm test:docker:crestodian-first-run
```

Luồng CLI đóng gói đó bắt đầu với thư mục trạng thái trống và chứng minh Crestodian đóng an toàn khi không có suy luận. Sau đó, luồng kiểm thử và kích hoạt Claude giả thông qua mô-đun kích hoạt đóng gói. Chỉ sau đó một yêu cầu gần đúng mới đến được bộ lập kế hoạch và được phân giải thành thiết lập có kiểu, tiếp theo là các lệnh một lần để tạo một tác nhân bổ sung, cấu hình Discord thông qua việc bật Plugin cùng SecretRef của mã thông báo, xác thực cấu hình và kiểm tra nhật ký kiểm toán. Luồng này cung cấp bằng chứng hỗ trợ cho cổng/thao tác; nó không thực thi quy trình tiếp nhận tương tác hoặc cuộc hội thoại tác nhân/công cụ/phê duyệt của Crestodian. Kịch bản QA Lab bên dưới chuyển hướng đến cùng luồng Docker:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Doctor](/vi/cli/doctor)
- [TUI](/vi/cli/tui)
- [Hộp cát](/vi/cli/sandbox)
- [Bảo mật](/vi/cli/security)
