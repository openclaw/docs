---
read_when:
    - Cấu hình bin an toàn hoặc hồ sơ bin an toàn tùy chỉnh
    - Chuyển tiếp các phê duyệt đến Slack/Discord/Telegram hoặc các kênh trò chuyện khác
    - Triển khai ứng dụng khách phê duyệt gốc cho một kênh
summary: 'Phê duyệt exec nâng cao: nhị phân an toàn, ràng buộc trình thông dịch, chuyển tiếp phê duyệt, phân phối gốc'
title: Phê duyệt thực thi — nâng cao
x-i18n:
    generated_at: "2026-05-07T01:54:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Các chủ đề nâng cao về phê duyệt exec: đường tắt `safeBins`, liên kết trình thông dịch/runtime
và chuyển tiếp phê duyệt đến các kênh chat (bao gồm chuyển phát gốc).
Để biết chính sách cốt lõi và luồng phê duyệt, xem [Phê duyệt exec](/vi/tools/exec-approvals).

## Bin an toàn (chỉ stdin)

`tools.exec.safeBins` định nghĩa một danh sách nhỏ các binary **chỉ stdin** (ví dụ
`cut`) có thể chạy ở chế độ danh sách cho phép **mà không cần** mục danh sách cho phép
tường minh. Bin an toàn từ chối tham số tệp dạng vị trí và token giống đường dẫn, nên chúng
chỉ có thể thao tác trên luồng đầu vào. Hãy xem đây là một đường tắt hẹp cho
bộ lọc luồng, không phải danh sách tin cậy chung.

<Warning>
**Không** thêm binary trình thông dịch hoặc runtime (ví dụ `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) vào `safeBins`. Nếu một lệnh có thể đánh giá mã,
thực thi lệnh con hoặc đọc tệp theo thiết kế, hãy ưu tiên các mục danh sách cho phép tường minh
và giữ bật lời nhắc phê duyệt. Bin an toàn tùy chỉnh phải định nghĩa một
hồ sơ tường minh trong `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bin an toàn mặc định:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` và `sort` không nằm trong danh sách mặc định. Nếu bạn chọn tham gia, hãy giữ các mục
danh sách cho phép tường minh cho quy trình không dùng stdin của chúng. Với `grep` ở chế độ bin an toàn,
hãy cung cấp mẫu bằng `-e`/`--regexp`; dạng mẫu vị trí bị từ chối
để toán hạng tệp không thể được đưa lén vào như tham số vị trí mơ hồ.

### Xác thực argv và cờ bị từ chối

Việc xác thực có tính xác định chỉ từ hình dạng argv (không kiểm tra sự tồn tại của hệ thống tệp
máy chủ), giúp ngăn hành vi oracle về sự tồn tại của tệp từ khác biệt cho phép/từ chối.
Các tùy chọn hướng tệp bị từ chối cho bin an toàn mặc định; tùy chọn dài
được xác thực theo kiểu đóng khi lỗi (cờ không xác định và viết tắt mơ hồ đều
bị từ chối).

Cờ bị từ chối theo hồ sơ bin an toàn:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bin an toàn cũng buộc token argv được xử lý như **văn bản nguyên văn** tại thời điểm thực thi
(không globbing và không mở rộng `$VARS`) cho các đoạn chỉ stdin, nên các mẫu
như `*` hoặc `$HOME/...` không thể được dùng để đưa lén thao tác đọc tệp.

### Thư mục binary tin cậy

Bin an toàn phải được phân giải từ các thư mục binary tin cậy (mặc định hệ thống cộng với
`tools.exec.safeBinTrustedDirs` tùy chọn). Các mục `PATH` không bao giờ tự động được tin cậy.
Thư mục tin cậy mặc định được giữ tối thiểu có chủ ý: `/bin`, `/usr/bin`. Nếu
tệp thực thi bin an toàn của bạn nằm trong đường dẫn trình quản lý gói/người dùng (ví dụ
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), hãy thêm chúng
tường minh vào `tools.exec.safeBinTrustedDirs`.

### Nối lệnh shell, wrapper và multiplexer

Nối lệnh shell (`&&`, `||`, `;`) được cho phép khi mọi đoạn cấp cao nhất
thỏa mãn danh sách cho phép (bao gồm bin an toàn hoặc tự động cho phép của skill). Chuyển hướng
vẫn không được hỗ trợ ở chế độ danh sách cho phép. Thay thế lệnh (`$()` / backtick) bị
từ chối trong quá trình phân tích danh sách cho phép, kể cả bên trong dấu nháy kép; dùng dấu nháy đơn
nếu bạn cần văn bản `$()` nguyên văn.

Trên phê duyệt qua ứng dụng đồng hành macOS, văn bản shell thô chứa cú pháp điều khiển hoặc
mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được
xem là không khớp danh sách cho phép trừ khi chính binary shell đó nằm trong danh sách cho phép.

Với wrapper shell (`bash|sh|zsh ... -c/-lc`), ghi đè env theo phạm vi yêu cầu được
giảm xuống một danh sách cho phép nhỏ và tường minh (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Với quyết định `allow-always` ở chế độ danh sách cho phép, các wrapper điều phối đã biết (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn tệp thực thi bên trong thay vì
đường dẫn wrapper. Multiplexer shell (`busybox`, `toybox`) được mở gói cho
applet shell (`sh`, `ash`, v.v.) theo cùng cách. Nếu không thể mở gói wrapper hoặc multiplexer
một cách an toàn, sẽ không có mục danh sách cho phép nào được tự động lưu.

Nếu bạn đưa các trình thông dịch như `python3` hoặc `node` vào danh sách cho phép, hãy ưu tiên
`tools.exec.strictInlineEval=true` để eval nội tuyến vẫn yêu cầu một phê duyệt
tường minh. Ở chế độ nghiêm ngặt, `allow-always` vẫn có thể lưu các lệnh gọi
trình thông dịch/script lành tính, nhưng các phương tiện mang inline-eval không được tự động
lưu.

### Bin an toàn so với danh sách cho phép

| Chủ đề           | `tools.exec.safeBins`                                  | Danh sách cho phép (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Mục tiêu         | Tự động cho phép các bộ lọc stdin hẹp                  | Tin cậy tường minh các tệp thực thi cụ thể                                          |
| Kiểu khớp        | Tên tệp thực thi + chính sách argv bin an toàn         | Glob đường dẫn tệp thực thi đã phân giải, hoặc glob tên lệnh trần cho lệnh gọi qua PATH |
| Phạm vi tham số  | Bị giới hạn bởi hồ sơ bin an toàn và quy tắc token nguyên văn | Khớp đường dẫn theo mặc định; `argPattern` tùy chọn có thể giới hạn argv đã phân tích |
| Ví dụ điển hình  | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI tùy chỉnh                                     |
| Cách dùng tốt nhất | Biến đổi văn bản rủi ro thấp trong pipeline            | Bất kỳ công cụ nào có hành vi hoặc tác dụng phụ rộng hơn                             |

Vị trí cấu hình:

- `safeBins` đến từ cấu hình (`tools.exec.safeBins` hoặc `agents.list[].tools.exec.safeBins` theo từng agent).
- `safeBinTrustedDirs` đến từ cấu hình (`tools.exec.safeBinTrustedDirs` hoặc `agents.list[].tools.exec.safeBinTrustedDirs` theo từng agent).
- `safeBinProfiles` đến từ cấu hình (`tools.exec.safeBinProfiles` hoặc `agents.list[].tools.exec.safeBinProfiles` theo từng agent). Khóa hồ sơ theo từng agent ghi đè khóa toàn cục.
- Các mục danh sách cho phép nằm trong `~/.openclaw/exec-approvals.json` cục bộ trên máy chủ dưới `agents.<id>.allowlist` (hoặc qua Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` cảnh báo bằng `tools.exec.safe_bins_interpreter_unprofiled` khi bin trình thông dịch/runtime xuất hiện trong `safeBins` mà không có hồ sơ tường minh.
- `openclaw doctor --fix` có thể dựng khung cho các mục `safeBinProfiles.<bin>` tùy chỉnh bị thiếu dưới dạng `{}` (xem xét và siết chặt sau). Bin trình thông dịch/runtime không được tự động dựng khung.

Ví dụ hồ sơ tùy chỉnh:
__OC_I18N_900000__
Nếu bạn đưa `jq` vào `safeBins` một cách tường minh, OpenClaw vẫn từ chối builtin `env` ở chế độ bin an toàn
để `jq -n env` không thể dump môi trường tiến trình máy chủ mà không có đường dẫn danh sách cho phép
hoặc lời nhắc phê duyệt tường minh.

## Lệnh trình thông dịch/runtime

Các lần chạy trình thông dịch/runtime có phê duyệt hậu thuẫn được giữ thận trọng có chủ ý:

- Ngữ cảnh argv/cwd/env chính xác luôn được liên kết.
- Dạng tệp script shell trực tiếp và tệp runtime trực tiếp được liên kết theo nỗ lực tốt nhất với một snapshot tệp cục bộ cụ thể.
- Các dạng wrapper trình quản lý gói phổ biến vẫn phân giải đến một tệp cục bộ trực tiếp (ví dụ
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) được mở gói trước khi liên kết.
- Nếu OpenClaw không thể xác định đúng một tệp cục bộ cụ thể cho một lệnh trình thông dịch/runtime
  (ví dụ script gói, dạng eval, chuỗi loader dành riêng cho runtime hoặc dạng nhiều tệp mơ hồ),
  thực thi có phê duyệt hậu thuẫn sẽ bị từ chối thay vì tuyên bố phạm vi ngữ nghĩa mà nó không có.
- Với các quy trình đó, hãy ưu tiên sandboxing, ranh giới máy chủ riêng, hoặc một danh sách cho phép/quy trình đầy đủ
  được tin cậy tường minh, nơi operator chấp nhận ngữ nghĩa runtime rộng hơn.

Khi cần phê duyệt, công cụ exec trả về ngay với một id phê duyệt. Dùng id đó để
liên hệ các sự kiện hệ thống sau đó (`Exec finished` / `Exec denied`). Nếu không có quyết định trước
thời gian chờ, yêu cầu được xem là hết thời gian chờ phê duyệt và được hiển thị như một lý do từ chối.

### Hành vi chuyển phát tiếp theo

Sau khi một exec bất đồng bộ đã được phê duyệt hoàn tất, OpenClaw gửi một lượt `agent` tiếp theo đến cùng phiên.

- Nếu tồn tại mục tiêu chuyển phát bên ngoài hợp lệ (kênh có thể chuyển phát cộng với đích `to`), chuyển phát tiếp theo dùng kênh đó.
- Trong luồng chỉ webchat hoặc phiên nội bộ không có mục tiêu bên ngoài, chuyển phát tiếp theo chỉ ở trong phiên (`deliver: false`).
- Nếu caller yêu cầu tường minh chuyển phát bên ngoài nghiêm ngặt nhưng không có kênh bên ngoài có thể phân giải, yêu cầu thất bại với `INVALID_REQUEST`.
- Nếu `bestEffortDeliver` được bật và không thể phân giải kênh bên ngoài, chuyển phát được hạ cấp thành chỉ trong phiên thay vì thất bại.

## Chuyển tiếp phê duyệt đến kênh chat

Bạn có thể chuyển tiếp lời nhắc phê duyệt exec đến bất kỳ kênh chat nào (bao gồm kênh Plugin) và phê duyệt
chúng bằng `/approve`. Việc này dùng pipeline chuyển phát ra ngoài thông thường.

Cấu hình:
__OC_I18N_900001__
Trả lời trong chat:
__OC_I18N_900002__
Lệnh `/approve` xử lý cả phê duyệt exec và phê duyệt Plugin. Nếu ID không khớp với một phê duyệt exec đang chờ, nó tự động kiểm tra phê duyệt Plugin thay thế.

### Chuyển tiếp phê duyệt Plugin

Chuyển tiếp phê duyệt Plugin dùng cùng pipeline chuyển phát như phê duyệt exec nhưng có
cấu hình độc lập riêng dưới `approvals.plugin`. Bật hoặc tắt một bên không ảnh hưởng đến bên kia.
__OC_I18N_900003__
Hình dạng cấu hình giống hệt `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` và `targets` hoạt động theo cùng cách.

Các kênh hỗ trợ phản hồi tương tác dùng chung hiển thị cùng các nút phê duyệt cho cả phê duyệt exec và
Plugin. Các kênh không có UI tương tác dùng chung sẽ quay về văn bản thuần với hướng dẫn `/approve`.
Yêu cầu phê duyệt Plugin có thể giới hạn các quyết định sẵn có. Bề mặt phê duyệt dùng tập quyết định
đã khai báo của yêu cầu, và Gateway từ chối các nỗ lực gửi một quyết định chưa được cung cấp.

### Phê duyệt trong cùng chat trên mọi kênh

Khi một yêu cầu phê duyệt exec hoặc Plugin bắt nguồn từ một bề mặt chat có thể chuyển phát, cùng chat đó
giờ có thể phê duyệt bằng `/approve` theo mặc định. Điều này áp dụng cho các kênh như Slack, Matrix và
Microsoft Teams ngoài các luồng Web UI và terminal UI hiện có.

Đường dẫn lệnh văn bản dùng chung này dùng mô hình auth kênh thông thường cho cuộc trò chuyện đó. Nếu chat
khởi nguồn đã có thể gửi lệnh và nhận phản hồi, yêu cầu phê duyệt không còn cần một
adapter chuyển phát gốc riêng chỉ để duy trì trạng thái đang chờ.

Discord và Telegram cũng hỗ trợ `/approve` trong cùng chat, nhưng các kênh đó vẫn dùng
danh sách người phê duyệt đã phân giải của chúng để ủy quyền ngay cả khi chuyển phát phê duyệt gốc bị tắt.

Với Telegram và các client phê duyệt gốc khác gọi trực tiếp Gateway,
cơ chế dự phòng này được giới hạn có chủ ý trong lỗi "không tìm thấy phê duyệt". Một lỗi/từ chối
phê duyệt exec thực sự không âm thầm thử lại như phê duyệt Plugin.

### Chuyển phát phê duyệt gốc

Một số kênh cũng có thể hoạt động như ứng dụng khách phê duyệt gốc. Ứng dụng khách gốc thêm DM cho người phê duyệt, phân phối tới cuộc trò chuyện gốc, và UX phê duyệt tương tác riêng theo kênh bên trên luồng `/approve` dùng chung trong cùng cuộc trò chuyện.

Khi có thẻ/nút phê duyệt gốc, UI gốc đó là đường dẫn chính dành cho tác nhân. Tác nhân không nên đồng thời lặp lại một lệnh `/approve` dạng trò chuyện thuần túy trùng lặp, trừ khi kết quả công cụ cho biết phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất còn lại.

Nếu một ứng dụng khách phê duyệt gốc đã được cấu hình nhưng không có runtime gốc nào đang hoạt động cho kênh khởi tạo, OpenClaw vẫn giữ lời nhắc `/approve` cục bộ, tất định ở trạng thái hiển thị. Nếu runtime gốc đang hoạt động và thử gửi nhưng không mục tiêu nào nhận được thẻ, OpenClaw gửi một thông báo dự phòng trong cùng cuộc trò chuyện với lệnh `/approve <id> <decision>` chính xác để yêu cầu vẫn có thể được xử lý.

Mô hình chung:

- chính sách exec của host vẫn quyết định liệu có cần phê duyệt exec hay không
- `approvals.exec` kiểm soát việc chuyển tiếp lời nhắc phê duyệt tới các đích trò chuyện khác
- `channels.<channel>.execApprovals` kiểm soát liệu kênh đó có hoạt động như một ứng dụng khách phê duyệt gốc hay không

Ứng dụng khách phê duyệt gốc tự động bật gửi ưu tiên DM khi tất cả điều kiện sau là đúng:

- kênh hỗ trợ gửi phê duyệt gốc
- người phê duyệt có thể được phân giải từ `execApprovals.approvers` tường minh hoặc danh tính chủ sở hữu như `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` chưa được đặt hoặc là `"auto"`

Đặt `enabled: false` để tắt rõ ràng một ứng dụng khách phê duyệt gốc. Đặt `enabled: true` để buộc bật khi phân giải được người phê duyệt. Việc gửi tới cuộc trò chuyện gốc công khai vẫn tường minh thông qua `channels.<channel>.execApprovals.target`.

Câu hỏi thường gặp: [Tại sao có hai cấu hình phê duyệt exec cho phê duyệt qua trò chuyện?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Các ứng dụng khách phê duyệt gốc này thêm định tuyến DM và phân phối tùy chọn tới kênh bên trên luồng `/approve` dùng chung trong cùng cuộc trò chuyện và các nút phê duyệt dùng chung.

Hành vi dùng chung:

- Slack, Matrix, Microsoft Teams, và các cuộc trò chuyện có thể gửi tương tự dùng mô hình xác thực kênh thông thường cho `/approve` trong cùng cuộc trò chuyện
- khi một ứng dụng khách phê duyệt gốc tự động bật, mục tiêu gửi gốc mặc định là DM của người phê duyệt
- với Discord và Telegram, chỉ người phê duyệt đã được phân giải mới có thể phê duyệt hoặc từ chối
- người phê duyệt Discord có thể là tường minh (`execApprovals.approvers`) hoặc được suy ra từ `commands.ownerAllowFrom`
- người phê duyệt Telegram có thể là tường minh (`execApprovals.approvers`) hoặc được suy ra từ `commands.ownerAllowFrom`
- người phê duyệt Slack có thể là tường minh (`execApprovals.approvers`) hoặc được suy ra từ `commands.ownerAllowFrom`
- nút gốc của Slack giữ nguyên loại id phê duyệt, vì vậy các id `plugin:` có thể phân giải phê duyệt Plugin mà không cần lớp dự phòng Slack-cục bộ thứ hai
- định tuyến DM/kênh gốc và lối tắt phản ứng của Matrix xử lý cả phê duyệt exec và Plugin; ủy quyền Plugin vẫn đến từ `channels.matrix.dm.allowFrom`
- lời nhắc gốc của Matrix bao gồm nội dung sự kiện tùy chỉnh `com.openclaw.approval` trên sự kiện lời nhắc đầu tiên để ứng dụng khách Matrix nhận biết OpenClaw có thể đọc trạng thái phê duyệt có cấu trúc, trong khi ứng dụng khách tiêu chuẩn vẫn giữ dự phòng `/approve` dạng văn bản thuần túy
- người yêu cầu không cần phải là người phê duyệt
- cuộc trò chuyện khởi tạo có thể phê duyệt trực tiếp bằng `/approve` khi cuộc trò chuyện đó đã hỗ trợ lệnh và trả lời
- nút phê duyệt gốc của Discord định tuyến theo loại id phê duyệt: id `plugin:` đi thẳng tới phê duyệt Plugin, mọi thứ khác đi tới phê duyệt exec
- nút phê duyệt gốc của Telegram tuân theo cùng dự phòng exec-sang-Plugin có giới hạn như `/approve`
- khi `target` gốc bật gửi tới cuộc trò chuyện gốc, lời nhắc phê duyệt sẽ bao gồm văn bản lệnh
- các phê duyệt exec đang chờ hết hạn sau 30 phút theo mặc định
- nếu không có UI vận hành hoặc ứng dụng khách phê duyệt đã cấu hình nào có thể chấp nhận yêu cầu, lời nhắc sẽ dự phòng về `askFallback`

Các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory` dùng định tuyến chủ sở hữu riêng tư cho lời nhắc phê duyệt và kết quả cuối cùng. OpenClaw trước tiên thử một tuyến riêng tư trên cùng bề mặt nơi chủ sở hữu chạy lệnh. Nếu bề mặt đó không có tuyến chủ sở hữu riêng tư, nó dự phòng về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, vì vậy một lệnh nhóm Discord vẫn có thể gửi phê duyệt và kết quả tới DM Telegram của chủ sở hữu khi Telegram là giao diện riêng tư chính đã cấu hình. Cuộc trò chuyện nhóm chỉ nhận một xác nhận ngắn.

Telegram mặc định dùng DM của người phê duyệt (`target: "dm"`). Bạn có thể chuyển sang `channel` hoặc `both` khi muốn lời nhắc phê duyệt cũng xuất hiện trong cuộc trò chuyện/chủ đề Telegram khởi tạo. Với chủ đề diễn đàn Telegram, OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và phần theo dõi sau phê duyệt.

Xem:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Luồng IPC trên macOS
__OC_I18N_900004__
Ghi chú bảo mật:

- Chế độ Unix socket `0600`, token được lưu trong `exec-approvals.json`.
- Kiểm tra peer cùng UID.
- Challenge/response (nonce + token HMAC + hash yêu cầu) + TTL ngắn.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals) — chính sách cốt lõi và luồng phê duyệt
- [Công cụ exec](/vi/tools/exec)
- [Chế độ nâng quyền](/vi/tools/elevated)
- [Skills](/vi/tools/skills) — hành vi tự động cho phép dựa trên skill
