---
read_when:
    - Cấu hình các bin an toàn hoặc hồ sơ bin an toàn tùy chỉnh
    - Chuyển tiếp các phê duyệt đến Slack/Discord/Telegram hoặc các kênh trò chuyện khác
    - Triển khai ứng dụng khách phê duyệt gốc cho một kênh
summary: 'Phê duyệt exec nâng cao: tệp thực thi an toàn, ràng buộc trình thông dịch, chuyển tiếp phê duyệt, phân phối gốc'
title: Phê duyệt thực thi — nâng cao
x-i18n:
    generated_at: "2026-04-29T23:18:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Chủ đề nâng cao về phê duyệt exec: đường tắt `safeBins`, liên kết interpreter/runtime và chuyển tiếp phê duyệt đến các kênh chat (bao gồm cả phân phối gốc). Để biết chính sách lõi và luồng phê duyệt, xem [Phê duyệt exec](/vi/tools/exec-approvals).

## Binary an toàn (chỉ stdin)

`tools.exec.safeBins` định nghĩa một danh sách nhỏ các binary **chỉ stdin** (ví dụ `cut`) có thể chạy ở chế độ danh sách cho phép **mà không cần** mục danh sách cho phép rõ ràng. Binary an toàn từ chối đối số tệp theo vị trí và token giống đường dẫn, nên chúng chỉ có thể thao tác trên luồng đầu vào. Hãy xem đây là một đường tắt hẹp cho các bộ lọc luồng, không phải danh sách tin cậy chung.

<Warning>
**Không** thêm binary interpreter hoặc runtime (ví dụ `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) vào `safeBins`. Nếu một lệnh có thể đánh giá mã, thực thi lệnh con hoặc đọc tệp theo thiết kế, hãy ưu tiên các mục danh sách cho phép rõ ràng và giữ bật lời nhắc phê duyệt. Binary an toàn tùy chỉnh phải định nghĩa một hồ sơ rõ ràng trong `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binary an toàn mặc định:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` và `sort` không nằm trong danh sách mặc định. Nếu bạn chọn bật chúng, hãy giữ các mục danh sách cho phép rõ ràng cho các quy trình không dùng stdin của chúng. Với `grep` ở chế độ binary an toàn, hãy cung cấp mẫu bằng `-e`/`--regexp`; dạng mẫu theo vị trí bị từ chối để toán hạng tệp không thể được lén đưa vào dưới dạng đối số vị trí mơ hồ.

### Xác thực argv và cờ bị từ chối

Việc xác thực mang tính xác định chỉ từ hình dạng argv (không kiểm tra sự tồn tại của hệ thống tệp trên máy chủ), giúp ngăn hành vi oracle về sự tồn tại của tệp từ khác biệt cho phép/từ chối. Các tùy chọn hướng tệp bị từ chối đối với binary an toàn mặc định; tùy chọn dài được xác thực theo kiểu đóng khi lỗi (cờ không xác định và viết tắt mơ hồ đều bị từ chối).

Cờ bị từ chối theo hồ sơ binary an toàn:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Binary an toàn cũng buộc token argv được xử lý như **văn bản nguyên văn** tại thời điểm thực thi (không mở rộng glob và không mở rộng `$VARS`) cho các đoạn chỉ stdin, nên các mẫu như `*` hoặc `$HOME/...` không thể được dùng để lén đọc tệp.

### Thư mục binary đáng tin cậy

Binary an toàn phải phân giải từ các thư mục binary đáng tin cậy (mặc định hệ thống cộng với `tools.exec.safeBinTrustedDirs` tùy chọn). Các mục `PATH` không bao giờ được tự động tin cậy. Thư mục đáng tin cậy mặc định được cố ý giữ tối thiểu: `/bin`, `/usr/bin`. Nếu executable binary an toàn của bạn nằm trong đường dẫn trình quản lý gói/người dùng (ví dụ `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), hãy thêm chúng rõ ràng vào `tools.exec.safeBinTrustedDirs`.

### Nối chuỗi shell, wrapper và multiplexer

Nối chuỗi shell (`&&`, `||`, `;`) được cho phép khi mọi đoạn cấp cao nhất thỏa danh sách cho phép (bao gồm binary an toàn hoặc tự động cho phép từ Skills). Chuyển hướng vẫn không được hỗ trợ ở chế độ danh sách cho phép. Thay thế lệnh (`$()` / backtick) bị từ chối trong quá trình phân tích danh sách cho phép, kể cả bên trong dấu ngoặc kép; dùng dấu nháy đơn nếu bạn cần văn bản `$()` nguyên văn.

Trên phê duyệt qua ứng dụng đồng hành macOS, văn bản shell thô chứa cú pháp điều khiển hoặc mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được xem là không khớp danh sách cho phép trừ khi chính binary shell đó được đưa vào danh sách cho phép.

Với wrapper shell (`bash|sh|zsh ... -c/-lc`), ghi đè env theo phạm vi yêu cầu được giảm xuống một danh sách cho phép rõ ràng nhỏ (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Với quyết định `allow-always` ở chế độ danh sách cho phép, các wrapper điều phối đã biết (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) sẽ lưu đường dẫn executable bên trong thay vì đường dẫn wrapper. Multiplexer shell (`busybox`, `toybox`) được bóc tách cho applet shell (`sh`, `ash`, v.v.) theo cùng cách. Nếu không thể bóc tách wrapper hoặc multiplexer một cách an toàn, sẽ không có mục danh sách cho phép nào được tự động lưu.

Nếu bạn đưa interpreter như `python3` hoặc `node` vào danh sách cho phép, hãy ưu tiên `tools.exec.strictInlineEval=true` để inline eval vẫn yêu cầu phê duyệt rõ ràng. Ở chế độ nghiêm ngặt, `allow-always` vẫn có thể lưu các lệnh gọi interpreter/script lành tính, nhưng các phương tiện mang inline-eval sẽ không được tự động lưu.

### Binary an toàn so với danh sách cho phép

| Chủ đề | `tools.exec.safeBins` | Danh sách cho phép (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Mục tiêu | Tự động cho phép các bộ lọc stdin hẹp | Tin cậy rõ ràng các executable cụ thể |
| Kiểu khớp | Tên executable + chính sách argv của binary an toàn | Glob đường dẫn executable đã phân giải, hoặc glob tên lệnh trần cho các lệnh được gọi qua PATH |
| Phạm vi đối số | Bị giới hạn bởi hồ sơ binary an toàn và quy tắc token nguyên văn | Chỉ khớp đường dẫn; đối số còn lại là trách nhiệm của bạn |
| Ví dụ điển hình | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, CLI tùy chỉnh |
| Cách dùng tốt nhất | Biến đổi văn bản rủi ro thấp trong pipeline | Bất kỳ công cụ nào có hành vi rộng hơn hoặc có tác dụng phụ |

Vị trí cấu hình:

- `safeBins` đến từ cấu hình (`tools.exec.safeBins` hoặc `agents.list[].tools.exec.safeBins` theo từng agent).
- `safeBinTrustedDirs` đến từ cấu hình (`tools.exec.safeBinTrustedDirs` hoặc `agents.list[].tools.exec.safeBinTrustedDirs` theo từng agent).
- `safeBinProfiles` đến từ cấu hình (`tools.exec.safeBinProfiles` hoặc `agents.list[].tools.exec.safeBinProfiles` theo từng agent). Khóa hồ sơ theo từng agent ghi đè khóa toàn cục.
- Mục danh sách cho phép nằm trong `~/.openclaw/exec-approvals.json` cục bộ trên máy chủ dưới `agents.<id>.allowlist` (hoặc qua Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` cảnh báo bằng `tools.exec.safe_bins_interpreter_unprofiled` khi binary interpreter/runtime xuất hiện trong `safeBins` mà không có hồ sơ rõ ràng.
- `openclaw doctor --fix` có thể tạo khung cho các mục `safeBinProfiles.<bin>` tùy chỉnh còn thiếu dưới dạng `{}` (xem lại và siết chặt sau). Binary interpreter/runtime không được tự động tạo khung.

Ví dụ hồ sơ tùy chỉnh:
__OC_I18N_900000__
Nếu bạn chọn rõ ràng đưa `jq` vào `safeBins`, OpenClaw vẫn từ chối builtin `env` ở chế độ binary an toàn để `jq -n env` không thể đổ môi trường tiến trình máy chủ nếu không có đường dẫn danh sách cho phép rõ ràng hoặc lời nhắc phê duyệt.

## Lệnh interpreter/runtime

Các lần chạy interpreter/runtime dựa trên phê duyệt được cố ý giữ bảo thủ:

- Ngữ cảnh argv/cwd/env chính xác luôn được liên kết.
- Dạng tệp script shell trực tiếp và tệp runtime trực tiếp được liên kết hết sức có thể với một ảnh chụp tệp cục bộ cụ thể.
- Các dạng wrapper trình quản lý gói phổ biến vẫn phân giải về một tệp cục bộ trực tiếp (ví dụ `pnpm exec`, `pnpm node`, `npm exec`, `npx`) được bóc tách trước khi liên kết.
- Nếu OpenClaw không thể xác định đúng một tệp cục bộ cụ thể cho lệnh interpreter/runtime (ví dụ script gói, dạng eval, chuỗi loader đặc thù runtime hoặc dạng nhiều tệp mơ hồ), thực thi dựa trên phê duyệt sẽ bị từ chối thay vì tuyên bố phạm vi ngữ nghĩa mà nó không có.
- Với các quy trình đó, hãy ưu tiên sandboxing, một ranh giới máy chủ riêng biệt hoặc một danh sách cho phép/quy trình đầy đủ được tin cậy rõ ràng, nơi operator chấp nhận ngữ nghĩa runtime rộng hơn.

Khi cần phê duyệt, công cụ exec trả về ngay lập tức với một ID phê duyệt. Dùng ID đó để đối chiếu các sự kiện hệ thống về sau (`Exec finished` / `Exec denied`). Nếu không có quyết định nào đến trước thời gian chờ, yêu cầu được xử lý là hết thời gian chờ phê duyệt và được hiển thị như một lý do từ chối.

### Hành vi phân phối followup

Sau khi một exec bất đồng bộ đã được phê duyệt hoàn tất, OpenClaw gửi một lượt `agent` followup đến cùng phiên.

- Nếu tồn tại mục tiêu phân phối bên ngoài hợp lệ (kênh có thể phân phối cộng với mục tiêu `to`), phân phối followup dùng kênh đó.
- Trong các luồng chỉ webchat hoặc phiên nội bộ không có mục tiêu bên ngoài, phân phối followup chỉ ở trong phiên (`deliver: false`).
- Nếu caller yêu cầu rõ ràng phân phối bên ngoài nghiêm ngặt nhưng không có kênh bên ngoài có thể phân giải, yêu cầu thất bại với `INVALID_REQUEST`.
- Nếu `bestEffortDeliver` được bật và không thể phân giải kênh bên ngoài, phân phối được hạ cấp thành chỉ trong phiên thay vì thất bại.

## Chuyển tiếp phê duyệt đến kênh chat

Bạn có thể chuyển tiếp lời nhắc phê duyệt exec đến bất kỳ kênh chat nào (bao gồm cả kênh Plugin) và phê duyệt chúng bằng `/approve`. Cơ chế này dùng pipeline phân phối outbound thông thường.

Cấu hình:
__OC_I18N_900001__
Trả lời trong chat:
__OC_I18N_900002__
Lệnh `/approve` xử lý cả phê duyệt exec và phê duyệt Plugin. Nếu ID không khớp với phê duyệt exec đang chờ, lệnh sẽ tự động kiểm tra phê duyệt Plugin thay thế.

### Chuyển tiếp phê duyệt Plugin

Chuyển tiếp phê duyệt Plugin dùng cùng pipeline phân phối như phê duyệt exec nhưng có cấu hình độc lập riêng dưới `approvals.plugin`. Bật hoặc tắt một loại không ảnh hưởng đến loại còn lại.
__OC_I18N_900003__
Hình dạng cấu hình giống hệt `approvals.exec`: `enabled`, `mode`, `agentFilter`, `sessionFilter` và `targets` hoạt động theo cùng cách.

Các kênh hỗ trợ trả lời tương tác dùng chung sẽ hiển thị cùng các nút phê duyệt cho cả phê duyệt exec và Plugin. Các kênh không có UI tương tác dùng chung sẽ fallback về văn bản thuần với hướng dẫn `/approve`.

### Phê duyệt trong cùng chat trên mọi kênh

Khi một yêu cầu phê duyệt exec hoặc Plugin bắt nguồn từ một bề mặt chat có thể phân phối, cùng chat đó hiện có thể phê duyệt bằng `/approve` theo mặc định. Điều này áp dụng cho các kênh như Slack, Matrix và Microsoft Teams bên cạnh các luồng Web UI và terminal UI hiện có.

Đường dẫn lệnh văn bản dùng chung này sử dụng mô hình xác thực kênh thông thường cho cuộc trò chuyện đó. Nếu chat gốc đã có thể gửi lệnh và nhận trả lời, yêu cầu phê duyệt không còn cần một bộ điều hợp phân phối gốc riêng chỉ để giữ trạng thái chờ.

Discord và Telegram cũng hỗ trợ `/approve` trong cùng chat, nhưng các kênh đó vẫn dùng danh sách người phê duyệt đã phân giải để ủy quyền ngay cả khi phân phối phê duyệt gốc bị tắt.

Với Telegram và các client phê duyệt gốc khác gọi Gateway trực tiếp, fallback này được cố ý giới hạn trong các lỗi "không tìm thấy phê duyệt". Một lỗi/từ chối phê duyệt exec thật sự sẽ không âm thầm thử lại như một phê duyệt Plugin.

### Phân phối phê duyệt gốc

Một số kênh cũng có thể hoạt động như client phê duyệt gốc. Client gốc thêm DM cho người phê duyệt, fanout đến chat nguồn và UX phê duyệt tương tác đặc thù kênh ở bên trên luồng `/approve` trong cùng chat dùng chung.

Khi có thẻ/nút phê duyệt gốc, UI gốc đó là đường dẫn chính dành cho agent. Agent không nên lặp lại một lệnh chat thuần `/approve` trùng lặp, trừ khi kết quả công cụ cho biết không có phê duyệt qua chat hoặc phê duyệt thủ công là đường dẫn duy nhất còn lại.

Nếu một client phê duyệt gốc được cấu hình nhưng không có runtime gốc nào đang hoạt động cho kênh khởi nguồn, OpenClaw vẫn giữ lời nhắc `/approve` tất định cục bộ hiển thị. Nếu runtime gốc đang hoạt động và cố gắng gửi nhưng không mục tiêu nào nhận được thẻ, OpenClaw gửi một thông báo dự phòng trong cùng cuộc chat với lệnh chính xác `/approve <id> <decision>` để yêu cầu vẫn có thể được xử lý.

Mô hình chung:

- chính sách host exec vẫn quyết định có cần phê duyệt exec hay không
- `approvals.exec` kiểm soát việc chuyển tiếp lời nhắc phê duyệt đến các đích chat khác
- `channels.<channel>.execApprovals` kiểm soát việc kênh đó có đóng vai trò là client phê duyệt gốc hay không

Client phê duyệt gốc tự động bật gửi DM trước khi tất cả điều sau là đúng:

- kênh hỗ trợ gửi phê duyệt gốc
- người phê duyệt có thể được phân giải từ `execApprovals.approvers` rõ ràng hoặc danh tính chủ sở hữu như `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` chưa được đặt hoặc là `"auto"`

Đặt `enabled: false` để tắt rõ ràng một client phê duyệt gốc. Đặt `enabled: true` để buộc bật khi người phê duyệt phân giải được. Gửi đến chat khởi nguồn công khai vẫn được đặt rõ ràng thông qua `channels.<channel>.execApprovals.target`.

Câu hỏi thường gặp: [Tại sao có hai cấu hình phê duyệt exec cho phê duyệt qua chat?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Các client phê duyệt gốc này thêm định tuyến DM và fanout kênh tùy chọn bên trên luồng `/approve` cùng chat dùng chung và các nút phê duyệt dùng chung.

Hành vi dùng chung:

- Slack, Matrix, Microsoft Teams và các chat có thể gửi tương tự dùng mô hình xác thực kênh thông thường cho `/approve` cùng chat
- khi một client phê duyệt gốc tự động bật, đích gửi gốc mặc định là DM của người phê duyệt
- với Discord và Telegram, chỉ người phê duyệt đã phân giải mới có thể phê duyệt hoặc từ chối
- người phê duyệt Discord có thể được đặt rõ ràng (`execApprovals.approvers`) hoặc suy ra từ `commands.ownerAllowFrom`
- người phê duyệt Telegram có thể được đặt rõ ràng (`execApprovals.approvers`) hoặc suy ra từ `commands.ownerAllowFrom`
- người phê duyệt Slack có thể được đặt rõ ràng (`execApprovals.approvers`) hoặc suy ra từ `commands.ownerAllowFrom`
- nút gốc của Slack giữ nguyên loại id phê duyệt, nên id `plugin:` có thể phân giải phê duyệt Plugin mà không cần lớp dự phòng Slack-cục bộ thứ hai
- định tuyến DM/kênh gốc của Matrix và lối tắt reaction xử lý cả phê duyệt exec lẫn Plugin; ủy quyền Plugin vẫn đến từ `channels.matrix.dm.allowFrom`
- lời nhắc gốc của Matrix bao gồm nội dung sự kiện tùy chỉnh `com.openclaw.approval` trên sự kiện lời nhắc đầu tiên để các client Matrix nhận biết OpenClaw có thể đọc trạng thái phê duyệt có cấu trúc, trong khi client chuẩn vẫn giữ dự phòng `/approve` dạng văn bản thuần
- người yêu cầu không cần là người phê duyệt
- chat khởi nguồn có thể phê duyệt trực tiếp bằng `/approve` khi chat đó đã hỗ trợ lệnh và phản hồi
- nút phê duyệt Discord gốc định tuyến theo loại id phê duyệt: id `plugin:` đi thẳng đến phê duyệt Plugin, mọi thứ khác đi đến phê duyệt exec
- nút phê duyệt Telegram gốc tuân theo cùng cơ chế dự phòng exec-sang-Plugin có giới hạn như `/approve`
- khi `target` gốc bật gửi đến chat khởi nguồn, lời nhắc phê duyệt bao gồm văn bản lệnh
- phê duyệt exec đang chờ hết hạn sau 30 phút theo mặc định
- nếu không UI điều hành hoặc client phê duyệt đã cấu hình nào có thể chấp nhận yêu cầu, lời nhắc sẽ quay về `askFallback`

Các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory` dùng định tuyến chủ sở hữu riêng tư cho lời nhắc phê duyệt và kết quả cuối cùng. OpenClaw trước tiên thử một tuyến riêng tư trên cùng bề mặt nơi chủ sở hữu chạy lệnh. Nếu bề mặt đó không có tuyến chủ sở hữu riêng tư, nó quay về tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, nên một lệnh nhóm Discord vẫn có thể gửi phê duyệt và kết quả đến DM Telegram của chủ sở hữu khi Telegram là giao diện riêng tư chính đã cấu hình. Chat nhóm chỉ nhận được một xác nhận ngắn.

Telegram mặc định dùng DM của người phê duyệt (`target: "dm"`). Bạn có thể chuyển sang `channel` hoặc `both` khi muốn lời nhắc phê duyệt cũng xuất hiện trong chat/chủ đề Telegram khởi nguồn. Với chủ đề diễn đàn Telegram, OpenClaw giữ nguyên chủ đề cho lời nhắc phê duyệt và phản hồi tiếp theo sau phê duyệt.

Xem:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Luồng IPC macOS
__OC_I18N_900004__
Ghi chú bảo mật:

- Chế độ Unix socket `0600`, token được lưu trong `exec-approvals.json`.
- Kiểm tra peer cùng UID.
- Thử thách/phản hồi (nonce + token HMAC + hash yêu cầu) + TTL ngắn.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals) — chính sách cốt lõi và luồng phê duyệt
- [Công cụ exec](/vi/tools/exec)
- [Chế độ nâng quyền](/vi/tools/elevated)
- [Skills](/vi/tools/skills) — hành vi tự động cho phép dựa trên Skills
