---
read_when:
    - Cấu hình nhóm an toàn hoặc hồ sơ nhóm an toàn tùy chỉnh
    - Chuyển tiếp yêu cầu phê duyệt đến Slack/Discord/Telegram hoặc các kênh trò chuyện khác
    - Triển khai ứng dụng khách phê duyệt gốc cho một kênh
summary: 'Phê duyệt exec nâng cao: các tệp nhị phân an toàn, ràng buộc trình thông dịch, chuyển tiếp phê duyệt, phân phối gốc'
title: Phê duyệt thực thi — nâng cao
x-i18n:
    generated_at: "2026-05-06T09:32:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ffef41ccb6018c5d38e153d015e979d43a6fafbe37a4377c3fcb7c6f212186c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Chủ đề nâng cao về phê duyệt exec: đường tắt `safeBins`, ràng buộc interpreter/runtime, và chuyển tiếp phê duyệt đến các kênh chat (bao gồm phân phối native). Với chính sách lõi và luồng phê duyệt, xem [Phê duyệt exec](/vi/tools/exec-approvals).

## Bin an toàn (chỉ stdin)

`tools.exec.safeBins` định nghĩa một danh sách nhỏ các binary **chỉ stdin** (ví dụ `cut`) có thể chạy ở chế độ danh sách cho phép **mà không cần** mục danh sách cho phép rõ ràng. Bin an toàn từ chối đối số tệp dạng vị trí và token giống đường dẫn, nên chúng chỉ có thể thao tác trên luồng đầu vào. Hãy xem đây là đường tắt hẹp cho bộ lọc luồng, không phải danh sách tin cậy chung.

<Warning>
**Không** thêm binary interpreter hoặc runtime (ví dụ `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) vào `safeBins`. Nếu một lệnh có thể đánh giá mã, thực thi lệnh con, hoặc đọc tệp theo thiết kế, hãy ưu tiên các mục danh sách cho phép rõ ràng và giữ bật lời nhắc phê duyệt. Bin an toàn tùy chỉnh phải định nghĩa một hồ sơ rõ ràng trong `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bin an toàn mặc định:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` và `sort` không có trong danh sách mặc định. Nếu bạn chọn bật, hãy giữ các mục danh sách cho phép rõ ràng cho các quy trình không dùng stdin của chúng. Với `grep` ở chế độ bin an toàn, cung cấp mẫu bằng `-e`/`--regexp`; dạng mẫu vị trí bị từ chối để toán hạng tệp không thể được lén đưa vào dưới dạng đối số vị trí mơ hồ.

### Xác thực argv và cờ bị từ chối

Xác thực mang tính tất định chỉ từ hình dạng argv (không kiểm tra sự tồn tại trên hệ thống tệp của máy chủ), điều này ngăn hành vi oracle về sự tồn tại của tệp từ khác biệt cho phép/từ chối. Các tùy chọn hướng đến tệp bị từ chối với bin an toàn mặc định; tùy chọn dài được xác thực theo kiểu đóng khi lỗi (cờ không xác định và viết tắt mơ hồ bị từ chối).

Cờ bị từ chối theo hồ sơ bin an toàn:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Bin an toàn cũng buộc token argv được xử lý như **văn bản nguyên văn** tại thời điểm thực thi (không globbing và không mở rộng `$VARS`) cho các đoạn chỉ stdin, nên các mẫu như `*` hoặc `$HOME/...` không thể được dùng để lén đọc tệp.

### Thư mục binary đáng tin cậy

Bin an toàn phải được phân giải từ các thư mục binary đáng tin cậy (mặc định hệ thống cộng với `tools.exec.safeBinTrustedDirs` tùy chọn). Các mục `PATH` không bao giờ tự động được tin cậy. Thư mục đáng tin cậy mặc định được cố ý giữ tối thiểu: `/bin`, `/usr/bin`. Nếu tệp thực thi bin an toàn của bạn nằm trong các đường dẫn của trình quản lý gói/người dùng (ví dụ `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), hãy thêm chúng rõ ràng vào `tools.exec.safeBinTrustedDirs`.

### Chuỗi shell, wrapper và multiplexer

Chuỗi shell (`&&`, `||`, `;`) được cho phép khi mọi đoạn cấp cao nhất đều thỏa mãn danh sách cho phép (bao gồm bin an toàn hoặc tự động cho phép từ Skills). Chuyển hướng vẫn không được hỗ trợ trong chế độ danh sách cho phép. Thay thế lệnh (`$()` / backtick) bị từ chối trong khi phân tích danh sách cho phép, kể cả bên trong dấu nháy kép; dùng dấu nháy đơn nếu bạn cần văn bản `$()` nguyên văn.

Trên phê duyệt companion-app của macOS, văn bản shell thô chứa cú pháp điều khiển hoặc mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được xem là không khớp danh sách cho phép trừ khi chính binary shell được đưa vào danh sách cho phép.

Với shell wrapper (`bash|sh|zsh ... -c/-lc`), ghi đè env theo phạm vi yêu cầu được giảm xuống một danh sách cho phép nhỏ và rõ ràng (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Với quyết định `allow-always` trong chế độ danh sách cho phép, các wrapper điều phối đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn tệp thực thi bên trong thay vì đường dẫn wrapper. Shell multiplexer (`busybox`, `toybox`) được gỡ bọc cho applet shell (`sh`, `ash`, v.v.) theo cùng cách. Nếu một wrapper hoặc multiplexer không thể được gỡ bọc an toàn, không có mục danh sách cho phép nào được tự động lưu.

Nếu bạn đưa các interpreter như `python3` hoặc `node` vào danh sách cho phép, hãy ưu tiên `tools.exec.strictInlineEval=true` để inline eval vẫn yêu cầu phê duyệt rõ ràng. Ở chế độ nghiêm ngặt, `allow-always` vẫn có thể lưu các lệnh gọi interpreter/script lành tính, nhưng các phương tiện inline-eval không được tự động lưu.

### Bin an toàn so với danh sách cho phép

| Chủ đề | `tools.exec.safeBins` | Danh sách cho phép (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Mục tiêu | Tự động cho phép các bộ lọc stdin hẹp | Tin cậy rõ ràng các tệp thực thi cụ thể |
| Kiểu khớp | Tên tệp thực thi + chính sách argv của bin an toàn | Glob đường dẫn tệp thực thi đã phân giải, hoặc glob tên lệnh trần cho lệnh được gọi qua PATH |
| Phạm vi đối số | Bị hạn chế bởi hồ sơ bin an toàn và quy tắc token nguyên văn | Khớp đường dẫn theo mặc định; `argPattern` tùy chọn có thể hạn chế argv đã phân tích |
| Ví dụ điển hình | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, CLI tùy chỉnh |
| Cách dùng tốt nhất | Biến đổi văn bản rủi ro thấp trong pipeline | Bất kỳ công cụ nào có hành vi hoặc tác dụng phụ rộng hơn |

Vị trí cấu hình:

- `safeBins` đến từ cấu hình (`tools.exec.safeBins` hoặc `agents.list[].tools.exec.safeBins` theo từng agent).
- `safeBinTrustedDirs` đến từ cấu hình (`tools.exec.safeBinTrustedDirs` hoặc `agents.list[].tools.exec.safeBinTrustedDirs` theo từng agent).
- `safeBinProfiles` đến từ cấu hình (`tools.exec.safeBinProfiles` hoặc `agents.list[].tools.exec.safeBinProfiles` theo từng agent). Khóa hồ sơ theo từng agent ghi đè khóa toàn cục.
- Các mục danh sách cho phép nằm trong `~/.openclaw/exec-approvals.json` cục bộ trên máy chủ dưới `agents.<id>.allowlist` (hoặc qua Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` cảnh báo bằng `tools.exec.safe_bins_interpreter_unprofiled` khi bin interpreter/runtime xuất hiện trong `safeBins` mà không có hồ sơ rõ ràng.
- `openclaw doctor --fix` có thể dựng khung các mục `safeBinProfiles.<bin>` tùy chỉnh bị thiếu dưới dạng `{}` (xem lại và siết chặt sau đó). Bin interpreter/runtime không được tự động dựng khung.

Ví dụ hồ sơ tùy chỉnh:
__OC_I18N_900000__
Nếu bạn rõ ràng đưa `jq` vào `safeBins`, OpenClaw vẫn từ chối builtin `env` trong chế độ bin an toàn để `jq -n env` không thể xuất môi trường tiến trình máy chủ nếu không có đường dẫn danh sách cho phép rõ ràng hoặc lời nhắc phê duyệt.

## Lệnh interpreter/runtime

Các lần chạy interpreter/runtime có phê duyệt hậu thuẫn được cố ý giữ bảo thủ:

- Ngữ cảnh argv/cwd/env chính xác luôn được ràng buộc.
- Dạng tệp shell script trực tiếp và tệp runtime trực tiếp được ràng buộc theo nỗ lực tốt nhất với một snapshot tệp cục bộ cụ thể.
- Các dạng wrapper trình quản lý gói phổ biến vẫn phân giải về một tệp cục bộ trực tiếp (ví dụ `pnpm exec`, `pnpm node`, `npm exec`, `npx`) được gỡ bọc trước khi ràng buộc.
- Nếu OpenClaw không thể xác định chính xác một tệp cục bộ cụ thể cho lệnh interpreter/runtime (ví dụ package script, dạng eval, chuỗi loader đặc thù runtime, hoặc dạng nhiều tệp mơ hồ), thực thi có phê duyệt hậu thuẫn sẽ bị từ chối thay vì tuyên bố có bao phủ ngữ nghĩa mà nó không có.
- Với các quy trình đó, hãy ưu tiên sandboxing, một ranh giới máy chủ riêng, hoặc một danh sách cho phép rõ ràng/quy trình đầy đủ đáng tin cậy nơi người vận hành chấp nhận ngữ nghĩa runtime rộng hơn.

Khi phê duyệt là bắt buộc, công cụ exec trả về ngay với một id phê duyệt. Dùng id đó để tương quan các sự kiện hệ thống sau đó (`Exec finished` / `Exec denied`). Nếu không có quyết định nào đến trước timeout, yêu cầu được xem là hết thời gian chờ phê duyệt và được hiển thị như một lý do từ chối.

### Hành vi phân phối followup

Sau khi một exec bất đồng bộ đã được phê duyệt hoàn tất, OpenClaw gửi một lượt `agent` followup đến cùng session.

- Nếu có mục tiêu phân phối bên ngoài hợp lệ (kênh có thể phân phối cộng với mục tiêu `to`), phân phối followup dùng kênh đó.
- Trong luồng chỉ webchat hoặc session nội bộ không có mục tiêu bên ngoài, phân phối followup chỉ ở trong session (`deliver: false`).
- Nếu caller yêu cầu rõ ràng phân phối bên ngoài nghiêm ngặt mà không có kênh bên ngoài có thể phân giải, yêu cầu thất bại với `INVALID_REQUEST`.
- Nếu `bestEffortDeliver` được bật và không thể phân giải kênh bên ngoài, phân phối bị hạ cấp xuống chỉ trong session thay vì thất bại.

## Chuyển tiếp phê duyệt đến kênh chat

Bạn có thể chuyển tiếp lời nhắc phê duyệt exec đến bất kỳ kênh chat nào (bao gồm kênh Plugin) và phê duyệt chúng bằng `/approve`. Việc này dùng pipeline phân phối outbound thông thường.

Cấu hình:
__OC_I18N_900001__
Trả lời trong chat:
__OC_I18N_900002__
Lệnh `/approve` xử lý cả phê duyệt exec và phê duyệt Plugin. Nếu ID không khớp với phê duyệt exec đang chờ nào, nó tự động kiểm tra phê duyệt Plugin thay thế.

### Chuyển tiếp phê duyệt Plugin

Chuyển tiếp phê duyệt Plugin dùng cùng pipeline phân phối như phê duyệt exec nhưng có cấu hình độc lập riêng dưới `approvals.plugin`. Bật hoặc tắt một loại không ảnh hưởng đến loại còn lại.
__OC_I18N_900003__
Hình dạng cấu hình giống hệt `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter`, và `targets` hoạt động theo cùng cách.

Các kênh hỗ trợ phản hồi tương tác dùng chung hiển thị cùng các nút phê duyệt cho cả phê duyệt exec và Plugin. Các kênh không có UI tương tác dùng chung sẽ fallback về văn bản thuần với hướng dẫn `/approve`.

### Phê duyệt trong cùng chat trên mọi kênh

Khi một yêu cầu phê duyệt exec hoặc Plugin bắt nguồn từ một bề mặt chat có thể phân phối, cùng chat đó giờ đây có thể phê duyệt bằng `/approve` theo mặc định. Điều này áp dụng cho các kênh như Slack, Matrix, và Microsoft Teams bên cạnh các luồng Web UI và UI terminal hiện có.

Đường dẫn lệnh văn bản dùng chung này dùng mô hình xác thực kênh thông thường cho cuộc hội thoại đó. Nếu chat gốc đã có thể gửi lệnh và nhận phản hồi, các yêu cầu phê duyệt không còn cần một adapter phân phối native riêng chỉ để tiếp tục ở trạng thái chờ.

Discord và Telegram cũng hỗ trợ `/approve` trong cùng chat, nhưng các kênh đó vẫn dùng danh sách người phê duyệt đã phân giải của chúng để ủy quyền ngay cả khi phân phối phê duyệt native bị tắt.

Với Telegram và các client phê duyệt native khác gọi trực tiếp Gateway, fallback này được cố ý giới hạn ở lỗi "không tìm thấy phê duyệt". Một lỗi/từ chối phê duyệt exec thật sẽ không âm thầm thử lại như phê duyệt Plugin.

### Phân phối phê duyệt native

Một số kênh cũng có thể hoạt động như client phê duyệt native. Client native thêm DM cho người phê duyệt, fanout chat gốc, và UX phê duyệt tương tác đặc thù kênh lên trên luồng `/approve` dùng chung trong cùng chat.

Khi có thẻ/nút phê duyệt gốc, UI gốc đó là đường dẫn chính dành cho
tác tử. Tác tử cũng không nên lặp lại một lệnh trò chuyện thuần túy
`/approve` trùng lặp, trừ khi kết quả công cụ cho biết phê duyệt qua trò chuyện không khả dụng hoặc
phê duyệt thủ công là đường dẫn còn lại duy nhất.

Nếu một máy khách phê duyệt gốc được cấu hình nhưng không có runtime gốc nào đang hoạt động cho
kênh khởi tạo, OpenClaw vẫn giữ lời nhắc `/approve` cục bộ mang tính xác định
hiển thị. Nếu runtime gốc đang hoạt động và thử phân phối nhưng không có
đích nào nhận được thẻ, OpenClaw gửi thông báo dự phòng trong cùng cuộc trò chuyện với
lệnh `/approve <id> <decision>` chính xác để yêu cầu vẫn có thể được xử lý.

Mô hình chung:

- chính sách exec của host vẫn quyết định có cần phê duyệt exec hay không
- `approvals.exec` kiểm soát việc chuyển tiếp lời nhắc phê duyệt đến các đích trò chuyện khác
- `channels.<channel>.execApprovals` kiểm soát việc kênh đó có hoạt động như một máy khách phê duyệt gốc hay không

Máy khách phê duyệt gốc tự động bật phân phối ưu tiên DM khi tất cả điều kiện sau đúng:

- kênh hỗ trợ phân phối phê duyệt gốc
- người phê duyệt có thể được phân giải từ `execApprovals.approvers` rõ ràng hoặc danh tính
  chủ sở hữu như `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` chưa được đặt hoặc là `"auto"`

Đặt `enabled: false` để tắt rõ ràng một máy khách phê duyệt gốc. Đặt `enabled: true` để buộc
bật khi người phê duyệt phân giải được. Việc phân phối đến cuộc trò chuyện khởi tạo công khai vẫn được bật rõ ràng qua
`channels.<channel>.execApprovals.target`.

FAQ: [Tại sao có hai cấu hình phê duyệt exec cho phê duyệt qua trò chuyện?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Các máy khách phê duyệt gốc này thêm định tuyến DM và tùy chọn phân phối tới nhiều kênh trên nền
luồng `/approve` trong cùng cuộc trò chuyện dùng chung và các nút phê duyệt dùng chung.

Hành vi dùng chung:

- Slack, Matrix, Microsoft Teams và các cuộc trò chuyện có thể phân phối tương tự dùng mô hình xác thực kênh thông thường
  cho `/approve` trong cùng cuộc trò chuyện
- khi một máy khách phê duyệt gốc tự động bật, đích phân phối gốc mặc định là DM của người phê duyệt
- đối với Discord và Telegram, chỉ những người phê duyệt đã phân giải mới có thể phê duyệt hoặc từ chối
- người phê duyệt Discord có thể là rõ ràng (`execApprovals.approvers`) hoặc được suy luận từ `commands.ownerAllowFrom`
- người phê duyệt Telegram có thể là rõ ràng (`execApprovals.approvers`) hoặc được suy luận từ `commands.ownerAllowFrom`
- người phê duyệt Slack có thể là rõ ràng (`execApprovals.approvers`) hoặc được suy luận từ `commands.ownerAllowFrom`
- nút gốc của Slack giữ nguyên loại id phê duyệt, vì vậy id `plugin:` có thể phân giải phê duyệt Plugin
  mà không cần lớp dự phòng cục bộ thứ hai của Slack
- định tuyến DM/kênh gốc của Matrix và lối tắt phản ứng xử lý cả phê duyệt exec và Plugin;
  việc ủy quyền Plugin vẫn đến từ `channels.matrix.dm.allowFrom`
- lời nhắc gốc của Matrix bao gồm nội dung sự kiện tùy chỉnh `com.openclaw.approval` trên sự kiện lời nhắc đầu tiên
  để các máy khách Matrix nhận biết OpenClaw có thể đọc trạng thái phê duyệt có cấu trúc trong khi máy khách tiêu chuẩn
  vẫn giữ dự phòng `/approve` dạng văn bản thuần
- người yêu cầu không cần phải là người phê duyệt
- cuộc trò chuyện khởi tạo có thể phê duyệt trực tiếp bằng `/approve` khi cuộc trò chuyện đó đã hỗ trợ lệnh và trả lời
- nút phê duyệt gốc của Discord định tuyến theo loại id phê duyệt: id `plugin:` đi
  thẳng đến phê duyệt Plugin, mọi thứ khác đi đến phê duyệt exec
- nút phê duyệt gốc của Telegram tuân theo cùng cơ chế dự phòng exec-sang-Plugin có giới hạn như `/approve`
- khi `target` gốc bật phân phối đến cuộc trò chuyện khởi tạo, lời nhắc phê duyệt bao gồm văn bản lệnh
- phê duyệt exec đang chờ hết hạn sau 30 phút theo mặc định
- nếu không có UI của người vận hành hoặc máy khách phê duyệt đã cấu hình nào có thể chấp nhận yêu cầu, lời nhắc sẽ quay về `askFallback`

Các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory` dùng định tuyến
chủ sở hữu riêng tư cho lời nhắc phê duyệt và kết quả cuối cùng. OpenClaw trước tiên thử một tuyến riêng tư trên
cùng bề mặt nơi chủ sở hữu chạy lệnh. Nếu bề mặt đó không có tuyến chủ sở hữu riêng tư, nó sẽ
quay về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, nên một lệnh nhóm Discord
vẫn có thể gửi phê duyệt và kết quả đến DM Telegram của chủ sở hữu khi Telegram là
giao diện riêng tư chính đã cấu hình. Cuộc trò chuyện nhóm chỉ nhận một xác nhận ngắn.

Telegram mặc định gửi đến DM của người phê duyệt (`target: "dm"`). Bạn có thể chuyển sang `channel` hoặc `both` khi
muốn lời nhắc phê duyệt cũng xuất hiện trong cuộc trò chuyện/chủ đề Telegram khởi tạo. Đối với chủ đề diễn đàn Telegram,
OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và phần tiếp nối sau phê duyệt.

Xem:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Luồng IPC trên macOS
__OC_I18N_900004__
Ghi chú bảo mật:

- Chế độ Unix socket `0600`, token được lưu trong `exec-approvals.json`.
- Kiểm tra peer cùng UID.
- Thử thách/phản hồi (nonce + token HMAC + hash yêu cầu) + TTL ngắn.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals) — chính sách lõi và luồng phê duyệt
- [Công cụ exec](/vi/tools/exec)
- [Chế độ đặc quyền](/vi/tools/elevated)
- [Skills](/vi/tools/skills) — hành vi tự động cho phép được hỗ trợ bởi skill
