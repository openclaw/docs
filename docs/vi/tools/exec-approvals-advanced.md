---
read_when:
    - Cấu hình safe bin hoặc hồ sơ safe-bin tùy chỉnh
    - Chuyển tiếp phê duyệt đến Slack/Discord/Telegram hoặc các kênh trò chuyện khác
    - Triển khai một trình khách phê duyệt gốc cho một kênh
summary: 'Phê duyệt exec nâng cao: bin an toàn, ràng buộc trình thông dịch, chuyển tiếp phê duyệt, phân phối gốc'
title: Phê duyệt thực thi — nâng cao
x-i18n:
    generated_at: "2026-06-27T18:15:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Các chủ đề nâng cao về phê duyệt exec: đường xử lý nhanh `safeBins`, liên kết interpreter/runtime
và chuyển tiếp phê duyệt đến các kênh chat (bao gồm phân phối gốc).
Để xem chính sách cốt lõi và luồng phê duyệt, hãy xem [Phê duyệt exec](/vi/tools/exec-approvals).

## Bin an toàn (chỉ stdin)

`tools.exec.safeBins` định nghĩa một danh sách nhỏ các binary **chỉ stdin** (ví dụ
`cut`) có thể chạy ở chế độ danh sách cho phép **mà không cần** mục danh sách cho phép
rõ ràng. Bin an toàn từ chối đối số tệp theo vị trí và token giống đường dẫn, nên chúng
chỉ có thể thao tác trên luồng đầu vào. Hãy xem đây là một đường xử lý nhanh hẹp cho
bộ lọc luồng, không phải danh sách tin cậy chung.

<Warning>
**Không** thêm binary interpreter hoặc runtime (ví dụ `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) vào `safeBins`. Nếu một lệnh có thể đánh giá mã,
thực thi lệnh con, hoặc đọc tệp theo thiết kế, hãy ưu tiên các mục danh sách cho phép
rõ ràng và giữ bật lời nhắc phê duyệt. Bin an toàn tùy chỉnh phải định nghĩa một
profile rõ ràng trong `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bin an toàn mặc định:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` và `sort` không nằm trong danh sách mặc định. Nếu bạn chọn bật, hãy giữ các
mục danh sách cho phép rõ ràng cho những quy trình không dùng stdin của chúng. Với `grep` ở chế độ safe-bin,
hãy cung cấp mẫu bằng `-e`/`--regexp`; dạng mẫu theo vị trí bị từ chối
để toán hạng tệp không thể bị lén đưa vào dưới dạng đối số vị trí mơ hồ.

### Xác thực argv và cờ bị từ chối

Xác thực là xác định chỉ từ hình dạng argv (không kiểm tra sự tồn tại của hệ thống tệp máy chủ),
điều này ngăn hành vi oracle tồn tại tệp từ các khác biệt cho phép/từ chối.
Các tùy chọn hướng tệp bị từ chối cho bin an toàn mặc định; tùy chọn dài
được xác thực theo kiểu đóng khi lỗi (cờ không xác định và viết tắt mơ hồ đều
bị từ chối).

Cờ bị từ chối theo profile bin an toàn:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bin an toàn cũng buộc token argv được xử lý như **văn bản literal** khi thực thi
(không glob và không mở rộng `$VARS`) cho các đoạn chỉ stdin, nên các mẫu
như `*` hoặc `$HOME/...` không thể được dùng để lén đọc tệp.

### Thư mục binary tin cậy

Bin an toàn phải phân giải từ các thư mục binary tin cậy (mặc định hệ thống cộng với
`tools.exec.safeBinTrustedDirs` tùy chọn). Các mục `PATH` không bao giờ được tự động tin cậy.
Thư mục tin cậy mặc định được cố ý giữ tối thiểu: `/bin`, `/usr/bin`. Nếu
tệp thực thi safe-bin của bạn nằm trong đường dẫn của trình quản lý gói/người dùng (ví dụ
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), hãy thêm chúng
rõ ràng vào `tools.exec.safeBinTrustedDirs`.

### Chuỗi shell, wrapper và multiplexer

Chuỗi shell (`&&`, `||`, `;`) được cho phép khi mọi đoạn cấp cao nhất
thỏa mãn danh sách cho phép (bao gồm bin an toàn hoặc tự động cho phép của Skills). Chuyển hướng
vẫn không được hỗ trợ trong chế độ danh sách cho phép. Thay thế lệnh (`$()` / backticks) bị
từ chối trong quá trình phân tích danh sách cho phép, kể cả bên trong dấu nháy kép; dùng dấu nháy đơn
nếu bạn cần văn bản literal `$()`.

Trên phê duyệt companion-app của macOS, văn bản shell thô chứa cú pháp điều khiển hoặc
mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được
xem là không khớp danh sách cho phép trừ khi chính binary shell đó nằm trong danh sách cho phép.

Với shell wrapper (`bash|sh|zsh ... -c/-lc`), ghi đè env theo phạm vi yêu cầu được
giảm xuống một danh sách cho phép nhỏ rõ ràng (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Đối với quyết định `allow-always` ở chế độ danh sách cho phép, các wrapper điều phối đã biết (`env`,
`flock`, `nice`, `nohup`, `stdbuf`, `timeout`) sẽ lưu đường dẫn tệp thực thi bên trong
thay vì đường dẫn wrapper. Shell multiplexer (`busybox`, `toybox`) được
gỡ bọc cho các applet shell (`sh`, `ash`, v.v.) theo cùng cách. Nếu một wrapper hoặc
multiplexer không thể được gỡ bọc an toàn, không có mục danh sách cho phép nào được lưu
tự động.

Nếu bạn đưa interpreter như `python3` hoặc `node` vào danh sách cho phép, hãy ưu tiên
`tools.exec.strictInlineEval=true` để inline eval vẫn yêu cầu phê duyệt rõ ràng.
Ở chế độ strict, `allow-always` vẫn có thể lưu các lần gọi interpreter/script lành tính,
nhưng các carrier inline-eval không được tự động lưu.

### Bin an toàn so với danh sách cho phép

| Chủ đề | `tools.exec.safeBins` | Danh sách cho phép (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Mục tiêu | Tự động cho phép các bộ lọc stdin hẹp | Tin cậy rõ ràng các tệp thực thi cụ thể |
| Loại khớp | Tên tệp thực thi + chính sách argv safe-bin | Glob đường dẫn tệp thực thi đã phân giải, hoặc glob tên lệnh trần cho các lệnh được gọi qua PATH |
| Phạm vi đối số | Bị giới hạn bởi profile safe-bin và quy tắc token literal | Mặc định khớp đường dẫn; `argPattern` tùy chọn có thể giới hạn argv đã phân tích |
| Ví dụ điển hình | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, CLI tùy chỉnh |
| Cách dùng tốt nhất | Chuyển đổi văn bản rủi ro thấp trong pipeline | Bất kỳ công cụ nào có hành vi hoặc tác dụng phụ rộng hơn |

Vị trí cấu hình:

- `safeBins` đến từ cấu hình (`tools.exec.safeBins` hoặc `agents.list[].tools.exec.safeBins` theo từng agent).
- `safeBinTrustedDirs` đến từ cấu hình (`tools.exec.safeBinTrustedDirs` hoặc `agents.list[].tools.exec.safeBinTrustedDirs` theo từng agent).
- `safeBinProfiles` đến từ cấu hình (`tools.exec.safeBinProfiles` hoặc `agents.list[].tools.exec.safeBinProfiles` theo từng agent). Khóa profile theo từng agent ghi đè khóa toàn cục.
- Các mục danh sách cho phép nằm trong tệp phê duyệt cục bộ trên máy chủ dưới `agents.<id>.allowlist` (hoặc qua Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` cảnh báo bằng `tools.exec.safe_bins_interpreter_unprofiled` khi bin interpreter/runtime xuất hiện trong `safeBins` mà không có profile rõ ràng.
- `openclaw doctor --fix` có thể dựng khung các mục `safeBinProfiles.<bin>` tùy chỉnh còn thiếu dưới dạng `{}` (hãy xem lại và siết chặt sau đó). Bin interpreter/runtime không được tự động dựng khung.

Ví dụ profile tùy chỉnh:
__OC_I18N_900000__
Nếu bạn rõ ràng chọn đưa `jq` vào `safeBins`, OpenClaw vẫn từ chối builtin `env` trong chế độ safe-bin
để `jq -n env` không thể xuất môi trường tiến trình máy chủ nếu không có đường dẫn danh sách cho phép rõ ràng
hoặc lời nhắc phê duyệt.

## Lệnh interpreter/runtime

Các lần chạy interpreter/runtime dựa trên phê duyệt được cố ý thiết kế thận trọng:

- Ngữ cảnh argv/cwd/env chính xác luôn được liên kết.
- Dạng tệp shell script trực tiếp và tệp runtime trực tiếp được liên kết theo nỗ lực tốt nhất với một snapshot tệp cục bộ cụ thể.
- Các dạng wrapper trình quản lý gói phổ biến vẫn phân giải thành một tệp cục bộ trực tiếp (ví dụ
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) được gỡ bọc trước khi liên kết.
- Nếu OpenClaw không thể xác định đúng một tệp cục bộ cụ thể cho lệnh interpreter/runtime
  (ví dụ package scripts, dạng eval, chuỗi loader riêng của runtime, hoặc dạng nhiều tệp mơ hồ),
  thực thi dựa trên phê duyệt bị từ chối thay vì tuyên bố phạm vi ngữ nghĩa mà nó không có.
- Với các quy trình đó, hãy ưu tiên sandboxing, một ranh giới máy chủ riêng, hoặc một danh sách cho phép/quy trình đầy đủ tin cậy rõ ràng nơi operator chấp nhận ngữ nghĩa runtime rộng hơn.

Khi cần phê duyệt, công cụ exec trả về ngay với một id phê duyệt. Dùng id đó để
liên kết các sự kiện hệ thống chạy đã phê duyệt sau này (`Exec finished`, và `Exec running` khi được cấu hình).
Nếu không có quyết định nào đến trước thời gian chờ, yêu cầu được xem là hết thời gian chờ phê duyệt và
được hiển thị như một từ chối lệnh máy chủ ở trạng thái cuối. Với phê duyệt bất đồng bộ của main-agent có
phiên nguồn, OpenClaw cũng tiếp tục phiên đó bằng một followup nội bộ để agent quan sát rằng
lệnh không chạy thay vì sau đó sửa một kết quả bị thiếu.

### Hành vi phân phối followup

Sau khi một exec bất đồng bộ đã phê duyệt hoàn tất, OpenClaw gửi một lượt `agent` followup đến cùng phiên.
Phê duyệt bất đồng bộ bị từ chối dùng cùng đường followup phiên chính cho trạng thái từ chối, nhưng chúng
không đăng ký handoff runtime nâng quyền và không chạy lệnh. Từ chối không có phiên chính có thể tiếp tục
sẽ bị chặn hoặc được báo cáo qua một tuyến trực tiếp an toàn khi có.

- Nếu tồn tại mục tiêu phân phối bên ngoài hợp lệ (kênh có thể phân phối cộng với mục tiêu `to`), phân phối followup dùng kênh đó.
- Trong luồng chỉ webchat hoặc phiên nội bộ không có mục tiêu bên ngoài, phân phối followup chỉ ở trong phiên (`deliver: false`).
- Nếu caller yêu cầu rõ ràng phân phối bên ngoài nghiêm ngặt nhưng không có kênh bên ngoài có thể phân giải, yêu cầu thất bại với `INVALID_REQUEST`.
- Nếu `bestEffortDeliver` được bật và không thể phân giải kênh bên ngoài, phân phối được hạ cấp xuống chỉ trong phiên thay vì thất bại.

## Chuyển tiếp phê duyệt đến kênh chat

Bạn có thể chuyển tiếp lời nhắc phê duyệt exec đến bất kỳ kênh chat nào (bao gồm kênh Plugin) và phê duyệt
chúng bằng `/approve`. Cơ chế này dùng pipeline phân phối đi thông thường.

Cấu hình:
__OC_I18N_900001__
Trả lời trong chat:
__OC_I18N_900002__
Lệnh `/approve` xử lý cả phê duyệt exec và phê duyệt Plugin. Nếu ID không khớp với một phê duyệt exec đang chờ, nó tự động kiểm tra phê duyệt Plugin thay thế.

### Chuyển tiếp phê duyệt Plugin

Chuyển tiếp phê duyệt Plugin dùng cùng pipeline phân phối như phê duyệt exec nhưng có
cấu hình độc lập riêng dưới `approvals.plugin`. Bật hoặc tắt một loại không ảnh hưởng đến loại còn lại.
Để biết hành vi khi tác giả Plugin, các trường yêu cầu và ngữ nghĩa quyết định, hãy xem
[Yêu cầu quyền Plugin](/plugins/plugin-permission-requests).
__OC_I18N_900003__
Hình dạng cấu hình giống hệt `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` và `targets` hoạt động theo cùng cách.

Các kênh hỗ trợ phản hồi tương tác dùng chung sẽ hiển thị cùng các nút phê duyệt cho cả phê duyệt exec và
Plugin. Các kênh không có UI tương tác dùng chung sẽ chuyển về văn bản thuần với hướng dẫn `/approve`.
Yêu cầu phê duyệt Plugin có thể giới hạn các quyết định khả dụng. Bề mặt phê duyệt dùng tập quyết định
được khai báo của yêu cầu, và Gateway từ chối các nỗ lực gửi một quyết định không được cung cấp.

### Phê duyệt trong cùng chat trên bất kỳ kênh nào

Khi yêu cầu phê duyệt exec hoặc Plugin bắt nguồn từ một bề mặt chat có thể phân phối, cùng chat đó
giờ có thể phê duyệt bằng `/approve` theo mặc định. Điều này áp dụng cho các kênh như Slack, Matrix và
Microsoft Teams ngoài các luồng Web UI và terminal UI hiện có.

Đường dẫn lệnh văn bản dùng chung này sử dụng mô hình xác thực kênh bình thường cho cuộc hội thoại đó. Nếu cuộc trò chuyện khởi tạo đã có thể gửi lệnh và nhận phản hồi, các yêu cầu phê duyệt không còn cần một bộ chuyển đổi phân phối native riêng chỉ để tiếp tục ở trạng thái chờ.

Discord và Telegram cũng hỗ trợ `/approve` trong cùng cuộc trò chuyện, nhưng các kênh đó vẫn dùng danh sách người phê duyệt đã phân giải để ủy quyền ngay cả khi phân phối phê duyệt native bị tắt.

Đối với Telegram và các client phê duyệt native khác gọi trực tiếp Gateway, phương án dự phòng này được giới hạn có chủ ý ở các lỗi "không tìm thấy phê duyệt". Một lỗi/từ chối phê duyệt exec thực sự sẽ không âm thầm thử lại như một phê duyệt plugin.

### Phân phối phê duyệt native

Một số kênh cũng có thể hoạt động như các client phê duyệt native. Client native bổ sung DM cho người phê duyệt, phân phối đến cuộc trò chuyện gốc và UX phê duyệt tương tác riêng theo kênh bên trên luồng `/approve` dùng chung trong cùng cuộc trò chuyện.

Khi thẻ/nút phê duyệt native khả dụng, UI native đó là đường dẫn chính đối diện agent. Agent không nên đồng thời lặp lại một lệnh `/approve` dạng chat thuần trùng lặp trừ khi kết quả công cụ cho biết phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất còn lại.

Nếu một client phê duyệt native được cấu hình nhưng không có runtime native nào đang hoạt động cho kênh khởi tạo, OpenClaw vẫn giữ prompt `/approve` cục bộ, xác định được hiển thị. Nếu runtime native đang hoạt động và cố gắng phân phối nhưng không có đích nào nhận được thẻ, OpenClaw gửi một thông báo dự phòng trong cùng cuộc trò chuyện kèm lệnh `/approve <id> <decision>` chính xác để yêu cầu vẫn có thể được xử lý.

Mô hình chung:

- chính sách exec của host vẫn quyết định liệu có cần phê duyệt exec hay không
- `approvals.exec` kiểm soát việc chuyển tiếp prompt phê duyệt đến các đích chat khác
- `channels.<channel>.execApprovals` kiểm soát việc bật các client native riêng theo kênh như Discord, Slack, Telegram và tương tự
- Phê duyệt Plugin Slack có thể dùng client phê duyệt native của Slack khi yêu cầu đến từ Slack và người phê duyệt Plugin Slack được phân giải; `approvals.plugin` cũng có thể định tuyến phê duyệt Plugin đến các phiên hoặc đích Slack ngay cả khi phê duyệt exec Slack bị tắt
- Thẻ phê duyệt native của Google Chat xử lý phê duyệt exec và Plugin bắt nguồn từ không gian hoặc chuỗi Google Chat khi người phê duyệt `users/<id>` ổn định được phân giải từ `dm.allowFrom` hoặc `defaultTo`; chúng không dùng sự kiện reaction để quyết định
- Phân phối phê duyệt bằng reaction của WhatsApp và Signal được kiểm soát bởi `approvals.exec` và `approvals.plugin`; chúng không có khối `channels.<channel>.execApprovals`

Client phê duyệt native tự động bật phân phối ưu tiên DM khi tất cả điều sau là đúng:

- kênh hỗ trợ phân phối phê duyệt native
- có thể phân giải người phê duyệt từ `execApprovals.approvers` tường minh hoặc danh tính owner như `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` chưa được đặt hoặc là `"auto"`

Đặt `enabled: false` để tắt rõ ràng một client phê duyệt native. Đặt `enabled: true` để buộc bật khi người phê duyệt được phân giải. Phân phối công khai đến cuộc trò chuyện gốc vẫn tường minh thông qua `channels.<channel>.execApprovals.target`.

FAQ: [Tại sao có hai cấu hình phê duyệt exec cho phê duyệt qua chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Google Chat: cấu hình người phê duyệt ổn định bằng `channels.googlechat.dm.allowFrom` hoặc `channels.googlechat.defaultTo`; không cần khối `execApprovals`
- WhatsApp: dùng `approvals.exec` và `approvals.plugin` để định tuyến prompt phê duyệt đến WhatsApp
- Signal: dùng `approvals.exec` và `approvals.plugin` để định tuyến prompt phê duyệt đến Signal

Các client phê duyệt native này bổ sung định tuyến DM và phân phối kênh tùy chọn bên trên luồng `/approve` dùng chung trong cùng cuộc trò chuyện và các nút phê duyệt dùng chung.

Hành vi dùng chung:

- Slack, Matrix, Microsoft Teams và các cuộc trò chuyện có thể phân phối tương tự dùng mô hình xác thực kênh bình thường cho `/approve` trong cùng cuộc trò chuyện
- khi một client phê duyệt native tự động bật, đích phân phối native mặc định là DM của người phê duyệt
- với Discord và Telegram, chỉ những người phê duyệt đã phân giải mới có thể phê duyệt hoặc từ chối
- người phê duyệt Discord có thể là tường minh (`execApprovals.approvers`) hoặc được suy ra từ `commands.ownerAllowFrom`
- người phê duyệt Telegram có thể là tường minh (`execApprovals.approvers`) hoặc được suy ra từ `commands.ownerAllowFrom`
- người phê duyệt Slack có thể là tường minh (`execApprovals.approvers`) hoặc được suy ra từ `commands.ownerAllowFrom`
- DM phê duyệt Plugin Slack dùng người phê duyệt Plugin Slack từ `allowFrom` và định tuyến mặc định của tài khoản, không phải người phê duyệt exec Slack
- nút native của Slack giữ nguyên loại id phê duyệt, vì vậy id `plugin:` có thể xử lý phê duyệt Plugin mà không cần một lớp dự phòng cục bộ Slack thứ hai
- thẻ native của Google Chat giữ phương án dự phòng `/approve` thủ công trong văn bản tin nhắn, nhưng callback của nút thẻ chỉ mang token hành động mờ; id phê duyệt và quyết định được khôi phục từ trạng thái chờ phía máy chủ
- phê duyệt bằng emoji của WhatsApp xử lý cả prompt exec và Plugin chỉ khi nhóm chuyển tiếp cấp cao nhất tương ứng được bật và định tuyến đến WhatsApp; chuyển tiếp WhatsApp chỉ theo đích vẫn nằm trên đường dẫn chuyển tiếp dùng chung trừ khi nó khớp cùng đích gốc native
- phê duyệt bằng reaction của Signal xử lý cả prompt exec và Plugin chỉ khi nhóm chuyển tiếp cấp cao nhất tương ứng được bật và định tuyến đến Signal. Phê duyệt exec Signal trực tiếp trong cùng cuộc trò chuyện có thể ẩn phương án dự phòng `/approve` cục bộ mà không cần người phê duyệt tường minh; việc phân giải reaction Signal vẫn yêu cầu người phê duyệt Signal tường minh từ `channels.signal.allowFrom` hoặc `defaultTo`.
- định tuyến DM/kênh native của Matrix và phím tắt reaction xử lý cả phê duyệt exec và Plugin; ủy quyền Plugin vẫn đến từ `channels.matrix.dm.allowFrom`
- prompt native của Matrix bao gồm nội dung sự kiện tùy chỉnh `com.openclaw.approval` trên sự kiện prompt đầu tiên để các client Matrix nhận biết OpenClaw có thể đọc trạng thái phê duyệt có cấu trúc trong khi client mặc định vẫn giữ phương án dự phòng `/approve` dạng văn bản thuần
- người yêu cầu không cần là người phê duyệt
- cuộc trò chuyện khởi tạo có thể phê duyệt trực tiếp bằng `/approve` khi cuộc trò chuyện đó đã hỗ trợ lệnh và phản hồi
- nút phê duyệt native của Discord định tuyến theo loại id phê duyệt: id `plugin:` đi thẳng đến phê duyệt Plugin, mọi thứ khác đi đến phê duyệt exec
- nút phê duyệt native của Telegram tuân theo cùng phương án dự phòng exec-sang-Plugin có giới hạn như `/approve`
- khi `target` native bật phân phối đến cuộc trò chuyện gốc, prompt phê duyệt bao gồm văn bản lệnh
- phê duyệt exec đang chờ hết hạn sau 30 phút theo mặc định
- nếu không có UI operator hoặc client phê duyệt đã cấu hình nào có thể chấp nhận yêu cầu, prompt sẽ rơi về `askFallback`

Các lệnh nhóm nhạy cảm chỉ dành cho owner như `/diagnostics` và `/export-trajectory` dùng định tuyến owner riêng tư cho prompt phê duyệt và kết quả cuối cùng. OpenClaw trước tiên thử một tuyến riêng tư trên cùng bề mặt nơi owner chạy lệnh. Nếu bề mặt đó không có tuyến owner riêng tư, nó rơi về tuyến owner khả dụng đầu tiên từ `commands.ownerAllowFrom`, vì vậy một lệnh nhóm Discord vẫn có thể gửi phê duyệt và kết quả đến DM Telegram của owner khi Telegram là giao diện riêng tư chính đã cấu hình. Cuộc trò chuyện nhóm chỉ nhận một xác nhận ngắn.

Telegram mặc định dùng DM của người phê duyệt (`target: "dm"`). Bạn có thể chuyển sang `channel` hoặc `both` khi muốn prompt phê duyệt cũng xuất hiện trong cuộc trò chuyện/chủ đề Telegram khởi tạo. Với các chủ đề diễn đàn Telegram, OpenClaw giữ nguyên chủ đề cho prompt phê duyệt và phần theo dõi sau phê duyệt.

Xem:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Luồng IPC trên macOS
__OC_I18N_900004__
Ghi chú bảo mật:

- Chế độ Unix socket `0600`, token được lưu trong `exec-approvals.json`.
- Kiểm tra peer cùng UID.
- Challenge/response (nonce + HMAC token + request hash) + TTL ngắn.

## FAQ

### Khi nào `accountId` và `threadId` được dùng trên một đích phê duyệt?

Dùng `accountId` khi kênh có nhiều danh tính đã cấu hình và prompt phê duyệt phải đi ra qua một tài khoản cụ thể. Dùng `threadId` khi đích hỗ trợ chủ đề hoặc chuỗi và prompt nên ở trong chuỗi đó thay vì cuộc trò chuyện cấp cao nhất.

Một trường hợp Telegram cụ thể là một supergroup vận hành có các chủ đề diễn đàn và hai tài khoản bot Telegram. Giá trị `to` đặt tên supergroup, `accountId` chọn tài khoản bot và `threadId` chọn chủ đề diễn đàn:
__OC_I18N_900005__
Với thiết lập đó, các phê duyệt exec được chuyển tiếp sẽ được đăng bởi tài khoản Telegram `ops-bot` vào chủ đề `77` của cuộc trò chuyện `-1001234567890`. Một đích không có `accountId` dùng tài khoản mặc định của kênh, và một đích không có `threadId` đăng đến đích cấp cao nhất.

### Khi phê duyệt được gửi đến một phiên, bất kỳ ai trong phiên đó có thể phê duyệt không?

Không. Phân phối theo phiên chỉ kiểm soát nơi prompt xuất hiện. Bản thân nó không ủy quyền cho mọi người tham gia cuộc trò chuyện đó phê duyệt.

Đối với `/approve` chung trong cùng cuộc trò chuyện, người gửi đã phải được ủy quyền cho lệnh trong phiên kênh đó. Nếu kênh cung cấp người phê duyệt phê duyệt tường minh, những người phê duyệt đó có thể ủy quyền hành động `/approve` ngay cả khi họ không được ủy quyền lệnh trong phiên đó theo cách khác.

Một số kênh nghiêm ngặt hơn. Discord, Telegram, Matrix, DM phê duyệt native của Slack và các client phê duyệt native tương tự dùng danh sách người phê duyệt đã phân giải của chúng để ủy quyền phê duyệt. Ví dụ, một prompt phê duyệt trong chủ đề diễn đàn Telegram có thể hiển thị với mọi người trong chủ đề, nhưng chỉ các ID người dùng Telegram dạng số được phân giải từ `channels.telegram.execApprovals.approvers` hoặc `commands.ownerAllowFrom` mới có thể phê duyệt hoặc từ chối.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals) — chính sách lõi và luồng phê duyệt
- [Công cụ exec](/vi/tools/exec)
- [Chế độ nâng quyền](/vi/tools/elevated)
- [Skills](/vi/tools/skills) — hành vi tự động cho phép dựa trên skill
