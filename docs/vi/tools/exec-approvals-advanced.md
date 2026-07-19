---
read_when:
    - Cấu hình các tệp nhị phân an toàn hoặc hồ sơ tệp nhị phân an toàn tùy chỉnh
    - Chuyển tiếp yêu cầu phê duyệt đến Slack/Discord/Telegram hoặc các kênh trò chuyện khác
    - Triển khai ứng dụng phê duyệt gốc cho một kênh
summary: 'Phê duyệt exec nâng cao: các tệp nhị phân an toàn, liên kết trình thông dịch, chuyển tiếp phê duyệt, phân phối gốc'
title: Phê duyệt thực thi — nâng cao
x-i18n:
    generated_at: "2026-07-19T17:11:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 628f695f2a005d537b11966bab7f6626aa87d473b1f1d5d72319a57aa7d9b24c
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Các chủ đề nâng cao về phê duyệt thực thi: đường xử lý nhanh `safeBins`, liên kết trình thông dịch/môi trường chạy
và chuyển tiếp phê duyệt đến các kênh trò chuyện (bao gồm phân phối gốc).
Để biết chính sách cốt lõi và luồng phê duyệt, hãy xem [Phê duyệt thực thi](/vi/tools/exec-approvals).

## Tệp nhị phân an toàn (chỉ stdin)

`tools.exec.safeBins` chỉ định các tệp nhị phân **chỉ stdin** (ví dụ `cut`) chạy
ở chế độ danh sách cho phép **mà không cần** mục nhập danh sách cho phép tường minh. Các tệp nhị phân an toàn từ chối
đối số tệp theo vị trí và token có dạng đường dẫn, nên chúng chỉ có thể xử lý
luồng đầu vào. Hãy coi đây là một đường xử lý nhanh có phạm vi hẹp dành cho bộ lọc luồng, không phải
danh sách tin cậy dùng chung.

<Warning>
**Không** thêm các tệp nhị phân của trình thông dịch hoặc môi trường chạy (ví dụ `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) vào `safeBins`. Nếu một lệnh theo thiết kế có thể đánh giá mã,
thực thi lệnh con hoặc đọc tệp, hãy ưu tiên các mục nhập danh sách cho phép tường minh
và duy trì lời nhắc phê duyệt. Tệp nhị phân an toàn tùy chỉnh phải định nghĩa một
hồ sơ tường minh trong `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Các tệp nhị phân an toàn mặc định:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` và `sort` không có trong danh sách mặc định. Nếu bạn chọn bật, hãy giữ các mục nhập
danh sách cho phép tường minh cho những quy trình không dùng stdin của chúng. Với `grep` ở chế độ tệp nhị phân an toàn,
hãy cung cấp mẫu bằng `-e`/`--regexp`; dạng mẫu theo vị trí bị từ chối
để toán hạng tệp không thể bị trà trộn dưới dạng đối số vị trí mơ hồ.

### Xác thực argv và các cờ bị từ chối

Quá trình xác thực chỉ được xác định từ cấu trúc argv (không kiểm tra sự tồn tại
trên hệ thống tệp của máy chủ), qua đó ngăn hành vi thăm dò sự tồn tại của tệp dựa trên
khác biệt cho phép/từ chối. Các tùy chọn hướng đến tệp bị từ chối đối với tệp nhị phân an toàn mặc định; các
tùy chọn dài được xác thực theo nguyên tắc đóng khi thất bại (các cờ không xác định và dạng viết tắt mơ hồ đều
bị từ chối). Các cờ boolean chỉ đọc được nhận diện của tệp nhị phân mặc định (ví dụ
`wc -l`, `tr -d`, `uniq -c`) được chấp nhận, trong khi các cờ ngắn không được nhận diện vẫn
đóng khi thất bại và chuyển sang phê duyệt thủ công.

Các cờ bị từ chối theo hồ sơ tệp nhị phân an toàn:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Các tệp nhị phân an toàn cũng buộc token argv được xử lý như **văn bản nguyên dạng** tại thời điểm thực thi
(không mở rộng ký tự đại diện và không mở rộng `$VARS`) đối với các phân đoạn chỉ stdin, nên
các mẫu như `*` hoặc `$HOME/...` không thể được dùng để trà trộn thao tác đọc tệp. `awk`,
`sed` và `jq` luôn bị từ chối làm tệp nhị phân an toàn vì ngữ nghĩa của chúng không thể được
xác thực là chỉ stdin: `jq` có thể đọc dữ liệu môi trường và nạp mã jq từ
mô-đun hoặc tệp khởi động. Thay vì `safeBins`, hãy dùng một mục nhập danh sách cho phép tường minh hoặc lời nhắc phê duyệt cho
các công cụ đó.

### Thư mục tệp nhị phân đáng tin cậy

Các tệp nhị phân an toàn phải được phân giải từ thư mục tệp nhị phân đáng tin cậy (mặc định hệ thống cộng với
`tools.exec.safeBinTrustedDirs` tùy chọn). Các mục nhập `PATH` không bao giờ tự động được tin cậy.
Các thư mục đáng tin cậy mặc định được chủ ý giữ ở mức tối thiểu: `/bin`, `/usr/bin`. Nếu
tệp thực thi an toàn của bạn nằm trong đường dẫn của trình quản lý gói/người dùng (ví dụ
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), hãy thêm chúng
một cách tường minh vào `tools.exec.safeBinTrustedDirs`.

### Chuỗi lệnh shell, trình bao bọc và bộ ghép kênh

Chuỗi lệnh shell (`&&`, `||`, `;`) được cho phép khi mọi phân đoạn cấp cao nhất
đều đáp ứng danh sách cho phép (bao gồm tệp nhị phân an toàn hoặc cơ chế tự động cho phép của skill). Chuyển hướng
vẫn không được hỗ trợ ở chế độ danh sách cho phép. Phép thay thế lệnh (`$()` / dấu nháy ngược)
bị từ chối trong quá trình phân tích danh sách cho phép, kể cả bên trong dấu ngoặc kép; hãy dùng dấu
nháy đơn nếu bạn cần văn bản `$()` nguyên dạng.

Đối với phê duyệt qua ứng dụng đồng hành trên macOS, văn bản shell thô chứa cú pháp điều khiển hoặc
mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được
xử lý như không khớp danh sách cho phép, trừ khi chính tệp nhị phân shell nằm trong danh sách cho phép.

Đối với trình bao bọc shell (`bash|sh|zsh ... -c/-lc`), các giá trị ghi đè môi trường theo phạm vi yêu cầu được
thu gọn thành một danh sách cho phép tường minh nhỏ (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Đối với các quyết định `allow-always` ở chế độ danh sách cho phép, các trình bao bọc điều phối trong suốt
(ví dụ `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn
tệp thực thi bên trong thay vì đường dẫn trình bao bọc. Các bộ ghép kênh shell
(`busybox`, `toybox`) được tháo bọc cho các applet shell (`sh`, `ash`, v.v.) theo
cùng cách. Nếu không thể tháo bọc an toàn một trình bao bọc hoặc bộ ghép kênh, hệ thống sẽ không tự động
lưu mục nhập danh sách cho phép.

Nếu bạn đưa các trình thông dịch như `python3` hoặc `node` vào danh sách cho phép, hãy ưu tiên
`tools.exec.strictInlineEval=true` để việc đánh giá nội tuyến vẫn yêu cầu phê duyệt
tường minh. Ở chế độ nghiêm ngặt, `allow-always` vẫn có thể lưu các
lời gọi trình thông dịch/tập lệnh vô hại, nhưng các phương tiện mang nội dung đánh giá nội tuyến sẽ không tự động được lưu.

### Tệp nhị phân an toàn so với danh sách cho phép

| Chủ đề           | `tools.exec.safeBins`                                             | Danh sách cho phép (`exec-approvals.json`)                                                        |
| ---------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Mục tiêu         | Tự động cho phép các bộ lọc stdin có phạm vi hẹp               | Tin cậy tường minh các tệp thực thi cụ thể                                                     |
| Kiểu khớp        | Tên tệp thực thi + chính sách argv của tệp nhị phân an toàn    | Glob đường dẫn tệp thực thi đã phân giải hoặc glob tên lệnh trần cho lệnh được gọi qua PATH     |
| Phạm vi đối số   | Bị giới hạn bởi hồ sơ tệp nhị phân an toàn và quy tắc token nguyên dạng | Mặc định khớp đường dẫn; `argPattern` tùy chọn có thể giới hạn argv đã phân tích     |
| Ví dụ điển hình  | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, các CLI tùy chỉnh |
| Cách dùng phù hợp nhất | Các phép biến đổi văn bản ít rủi ro trong pipeline       | Bất kỳ công cụ nào có hành vi hoặc tác dụng phụ rộng hơn                                       |

Vị trí cấu hình:

- `safeBins` lấy từ cấu hình (`tools.exec.safeBins` hoặc `agents.list[].tools.exec.safeBins` theo từng agent).
- `safeBinTrustedDirs` lấy từ cấu hình (`tools.exec.safeBinTrustedDirs` hoặc `agents.list[].tools.exec.safeBinTrustedDirs` theo từng agent).
- `safeBinProfiles` lấy từ cấu hình (`tools.exec.safeBinProfiles` hoặc `agents.list[].tools.exec.safeBinProfiles` theo từng agent). Khóa hồ sơ theo từng agent ghi đè khóa toàn cục.
- các mục nhập danh sách cho phép nằm trong tệp phê duyệt cục bộ của máy chủ tại `agents.<id>.allowlist` (hoặc qua Giao diện điều khiển / `openclaw approvals allowlist ...`).
- `openclaw security audit` cảnh báo bằng `tools.exec.safe_bins_interpreter_unprofiled` khi tệp nhị phân của trình thông dịch/môi trường chạy xuất hiện trong `safeBins` mà không có hồ sơ tường minh.
- `openclaw doctor --fix` có thể tạo khung cho các mục nhập `safeBinProfiles.<bin>` tùy chỉnh còn thiếu dưới dạng `{}` (sau đó hãy xem xét và siết chặt). Tệp nhị phân của trình thông dịch/môi trường chạy không được tự động tạo khung.

Ví dụ về hồ sơ tùy chỉnh:

```json5
{
  tools: {
    exec: {
      safeBins: ["myfilter"],
      safeBinProfiles: {
        myfilter: {
          minPositional: 0,
          maxPositional: 0,
          allowedValueFlags: ["-n", "--limit"],
          deniedFlags: ["-f", "--file", "-c", "--command"],
        },
      },
    },
  },
}
```

## Lệnh trình thông dịch/môi trường chạy

Các lần chạy trình thông dịch/môi trường chạy dựa trên phê duyệt được chủ ý xử lý thận trọng:

- Ngữ cảnh argv/cwd/env chính xác luôn được liên kết.
- Các dạng tệp tập lệnh shell trực tiếp và tệp môi trường chạy trực tiếp được liên kết theo cơ chế nỗ lực tối đa với một ảnh chụp nhanh
  của tệp cục bộ cụ thể.
- Các dạng trình bao bọc trình quản lý gói phổ biến vẫn phân giải thành một tệp cục bộ trực tiếp (ví dụ
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) được tháo bọc trước khi liên kết.
- Nếu OpenClaw không thể xác định chính xác một tệp cục bộ cụ thể cho lệnh trình thông dịch/môi trường chạy
  (ví dụ tập lệnh gói, dạng đánh giá, chuỗi trình nạp dành riêng cho môi trường chạy hoặc dạng nhiều tệp
  mơ hồ), quá trình thực thi dựa trên phê duyệt sẽ bị từ chối thay vì tuyên bố phạm vi ngữ nghĩa mà nó không
  có.
- Đối với các quy trình đó, hãy ưu tiên cơ chế hộp cát, một ranh giới máy chủ riêng biệt hoặc một quy trình đầy đủ/danh sách cho phép
  đáng tin cậy tường minh, trong đó người vận hành chấp nhận ngữ nghĩa rộng hơn của môi trường chạy.

Khi cần phê duyệt, công cụ exec trả về ngay lập tức cùng một id phê duyệt. Hãy dùng id đó để
đối chiếu các sự kiện hệ thống của lần chạy đã được phê duyệt sau này (`Exec finished` và `Exec running` khi được cấu hình).
Nếu không có quyết định trước khi hết thời gian chờ, yêu cầu được coi là phê duyệt hết thời gian chờ và
được hiển thị dưới dạng từ chối lệnh máy chủ ở trạng thái kết thúc. Đối với phê duyệt bất đồng bộ của agent chính có phiên khởi nguồn,
OpenClaw cũng tiếp tục phiên đó bằng một lượt theo dõi nội bộ để agent nhận biết rằng
lệnh không chạy, thay vì sau đó cố khắc phục một kết quả bị thiếu. Các phê duyệt thực thi đang chờ
mặc định hết hạn sau 30 phút.

### Hành vi phân phối lượt theo dõi

Sau khi một lần thực thi bất đồng bộ đã được phê duyệt hoàn tất, OpenClaw gửi một lượt theo dõi `agent` đến cùng phiên.
Các phê duyệt bất đồng bộ bị từ chối sử dụng cùng đường dẫn theo dõi của phiên chính cho trạng thái từ chối, nhưng chúng
không đăng ký chuyển giao môi trường chạy đặc quyền và không chạy lệnh. Các trường hợp từ chối không có
phiên chính có thể tiếp tục sẽ bị bỏ qua hoặc được báo cáo qua một tuyến trực tiếp an toàn nếu có.

- Nếu có đích phân phối bên ngoài hợp lệ (kênh có thể phân phối cộng với đích `to`), lượt theo dõi sẽ được phân phối qua kênh đó.
- Trong các luồng chỉ dùng webchat hoặc phiên nội bộ không có đích bên ngoài, việc phân phối lượt theo dõi chỉ diễn ra trong phiên (`deliver: false`).
- Nếu bên gọi yêu cầu tường minh việc phân phối nghiêm ngặt ra bên ngoài nhưng không có kênh bên ngoài nào có thể phân giải, yêu cầu sẽ thất bại với `INVALID_REQUEST`.
- Nếu `bestEffortDeliver` được bật và không thể phân giải kênh bên ngoài, việc phân phối sẽ được hạ xuống chỉ trong phiên thay vì thất bại.

## Phạm vi tối thiểu cho ứng dụng khách bên thứ ba

Việc phân giải phê duyệt của Gateway được bảo vệ bởi phạm vi chuyên biệt `operator.approvals`. Điều này áp dụng cho cả phương thức dành riêng cho chủ sở hữu `exec.approval.resolve` và phương thức không phụ thuộc loại `approval.resolve`; `operator.write` không bao hàm phạm vi này. Bảng điều khiển và các tích hợp chỉ nên yêu cầu những phạm vi cần thiết cho các phương thức mà chúng sử dụng. Hãy coi quyền truy cập phân giải phê duyệt là thẩm quyền ở cấp độ thực thi từ xa và chỉ cấp `operator.approvals` một cách có chủ đích, ngay cả khi ứng dụng khách chỉ hiển thị một giao diện phê duyệt nhỏ.

## Chuyển tiếp phê duyệt đến các kênh trò chuyện

Bạn có thể chuyển tiếp lời nhắc phê duyệt exec đến bất kỳ kênh trò chuyện nào (bao gồm cả các kênh Plugin) và phê duyệt
chúng bằng `/approve`. Cơ chế này sử dụng pipeline gửi đi thông thường.

Cấu hình:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // chuỗi con hoặc biểu thức chính quy
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Trả lời trong cuộc trò chuyện:

```
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Lệnh `/approve` xử lý cả phê duyệt exec lẫn phê duyệt Plugin. Nếu ID không khớp với một phê duyệt exec đang chờ, lệnh sẽ tự động kiểm tra các phê duyệt Plugin. Cơ chế dự phòng này chỉ áp dụng cho lỗi "không tìm thấy phê duyệt"; một lần từ chối/lỗi phê duyệt exec thực sự sẽ không âm thầm thử lại dưới dạng phê duyệt Plugin.

### Chuyển tiếp phê duyệt Plugin

Cơ chế chuyển tiếp phê duyệt Plugin sử dụng cùng pipeline gửi như phê duyệt exec nhưng có cấu hình
độc lập riêng trong `approvals.plugin`. Việc bật hoặc tắt một loại không ảnh hưởng đến loại còn lại.
Để biết hành vi khi tạo Plugin, các trường yêu cầu và ngữ nghĩa quyết định, hãy xem
[Yêu cầu quyền của Plugin](/plugins/plugin-permission-requests).

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [
        { channel: "slack", to: "U12345678" },
        { channel: "telegram", to: "123456789" },
      ],
    },
  },
}
```

Cấu trúc cấu hình giống hệt `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` và `targets` hoạt động theo cùng một cách.

Các kênh hỗ trợ phản hồi tương tác dùng chung sẽ hiển thị cùng các nút phê duyệt cho cả phê duyệt exec
lẫn phê duyệt Plugin. Các kênh không có giao diện tương tác dùng chung sẽ chuyển sang văn bản thuần kèm hướng dẫn
`/approve`. Yêu cầu phê duyệt Plugin có thể giới hạn các quyết định khả dụng: giao diện phê duyệt sử dụng
tập quyết định được khai báo trong yêu cầu, và Gateway từ chối mọi lần gửi quyết định không
được cung cấp.

### Phê duyệt ngay trong cuộc trò chuyện trên mọi kênh

Khi một yêu cầu phê duyệt exec hoặc Plugin bắt nguồn từ một giao diện trò chuyện có thể gửi nhận, chính cuộc trò chuyện đó
có thể phê duyệt yêu cầu bằng `/approve` theo mặc định. Điều này áp dụng cho Slack, Matrix, Microsoft Teams và
các cuộc trò chuyện có khả năng gửi nhận tương tự, bên cạnh các luồng giao diện web và giao diện đầu cuối hiện có, bằng
mô hình xác thực kênh thông thường cho cuộc hội thoại đó. Nếu cuộc trò chuyện ban đầu đã có thể gửi lệnh
và nhận phản hồi, yêu cầu phê duyệt không còn cần một bộ điều hợp gửi gốc riêng chỉ để
duy trì trạng thái chờ.

Discord, Telegram và QQ bot cũng hỗ trợ `/approve` ngay trong cuộc trò chuyện, nhưng các kênh này vẫn sử dụng
danh sách người phê duyệt đã phân giải để ủy quyền, ngay cả khi tính năng gửi phê duyệt gốc bị tắt.

### Gửi phê duyệt gốc

Một số kênh cũng có thể hoạt động như ứng dụng phê duyệt gốc: Discord, Slack, Telegram, Matrix và QQ bot.
Ứng dụng gốc bổ sung tin nhắn trực tiếp đến người phê duyệt, phân phối đến cuộc trò chuyện nguồn và trải nghiệm phê duyệt tương tác dành riêng cho kênh,
trên nền luồng `/approve` dùng chung ngay trong cuộc trò chuyện.

Khi có thẻ/nút phê duyệt gốc, giao diện gốc đó là phương thức chính dành cho agent.
Agent không nên đồng thời lặp lại một lệnh `/approve` dạng văn bản thuần trong cuộc trò chuyện, trừ khi kết quả công cụ cho biết
không thể phê duyệt qua cuộc trò chuyện hoặc phê duyệt thủ công là phương thức duy nhất còn lại.

Nếu một ứng dụng phê duyệt gốc đã được cấu hình nhưng không có runtime gốc nào đang hoạt động cho
kênh nguồn, OpenClaw vẫn hiển thị lời nhắc `/approve` cục bộ có tính xác định. Nếu runtime gốc đang
hoạt động và cố gửi nhưng không mục tiêu nào nhận được thẻ, OpenClaw sẽ gửi một thông báo dự phòng
ngay trong cuộc trò chuyện kèm lệnh `/approve <id> <decision>` chính xác để yêu cầu vẫn có thể được xử lý.

Mô hình chung:

- chính sách exec của máy chủ vẫn quyết định có cần phê duyệt exec hay không
- `approvals.exec` kiểm soát việc chuyển tiếp lời nhắc phê duyệt đến các đích trò chuyện khác
- `channels.<channel>.execApprovals` kiểm soát việc có bật các ứng dụng gốc dành riêng cho kênh như Discord, Slack, Telegram, QQ bot
  và các ứng dụng tương tự hay không
- phê duyệt Plugin trên Slack có thể sử dụng ứng dụng phê duyệt gốc của Slack khi yêu cầu đến từ Slack
  và phân giải được người phê duyệt Plugin trên Slack; `approvals.plugin` cũng có thể định tuyến phê duyệt Plugin đến các phiên
  hoặc mục tiêu Slack ngay cả khi phê duyệt exec trên Slack bị tắt
- thẻ phê duyệt gốc của Google Chat xử lý các phê duyệt exec và Plugin bắt nguồn từ không gian hoặc chuỗi hội thoại
  Google Chat khi phân giải được người phê duyệt `users/<id>` ổn định từ `dm.allowFrom` hoặc
  `defaultTo`; chúng không sử dụng sự kiện phản ứng để đưa ra quyết định
- việc gửi phê duyệt bằng phản ứng trên WhatsApp và Signal được kiểm soát bởi `approvals.exec` và
  `approvals.plugin`; chúng không có khối `channels.<channel>.execApprovals`

Ứng dụng phê duyệt gốc tự động bật chế độ ưu tiên tin nhắn trực tiếp khi tất cả điều kiện sau đều đúng:

- kênh hỗ trợ gửi phê duyệt gốc
- có thể phân giải người phê duyệt từ `execApprovals.approvers` rõ ràng hoặc danh tính
  chủ sở hữu như `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` chưa được đặt hoặc là `"auto"`

Đặt `enabled: false` để tắt rõ ràng một ứng dụng phê duyệt gốc. Đặt `enabled: true` để buộc
bật ứng dụng đó khi phân giải được người phê duyệt. Việc gửi công khai đến cuộc trò chuyện nguồn vẫn phải được chỉ định rõ qua
`channels.<channel>.execApprovals.target`. Khi `target` gốc bật việc gửi đến cuộc trò chuyện nguồn,
lời nhắc phê duyệt sẽ bao gồm văn bản lệnh.

Câu hỏi thường gặp: [Tại sao có hai cấu hình phê duyệt exec cho việc phê duyệt qua trò chuyện?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- QQ bot: `channels.qqbot.execApprovals.*`
- Google Chat: cấu hình người phê duyệt ổn định bằng `channels.googlechat.dm.allowFrom` hoặc
  `channels.googlechat.defaultTo`; không cần khối `execApprovals`
- WhatsApp: sử dụng `approvals.exec` và `approvals.plugin` để định tuyến lời nhắc phê duyệt đến WhatsApp
- Signal: sử dụng `approvals.exec` và `approvals.plugin` để định tuyến lời nhắc phê duyệt đến Signal

Định tuyến dành riêng cho ứng dụng gốc:

- Telegram mặc định gửi tin nhắn trực tiếp đến người phê duyệt (`target: "dm"`). Chuyển sang `channel` hoặc `both` để đồng thời hiển thị
  lời nhắc phê duyệt trong cuộc trò chuyện/chủ đề Telegram nguồn. Với chủ đề diễn đàn Telegram, OpenClaw
  giữ nguyên chủ đề cho lời nhắc phê duyệt và phản hồi tiếp theo sau khi phê duyệt.
- người phê duyệt trên Discord và Telegram có thể được chỉ định rõ (`execApprovals.approvers`) hoặc suy ra từ
  `commands.ownerAllowFrom`; chỉ người phê duyệt đã phân giải mới có thể phê duyệt hoặc từ chối.
- người phê duyệt trên Slack có thể được chỉ định rõ (`execApprovals.approvers`) hoặc suy ra từ
  `commands.ownerAllowFrom`. Tin nhắn trực tiếp phê duyệt Plugin trên Slack sử dụng người phê duyệt Plugin trên Slack từ `allowFrom`
  và định tuyến mặc định của tài khoản, không dùng người phê duyệt exec trên Slack. Các nút gốc của Slack giữ nguyên loại ID phê duyệt,
  vì vậy ID `plugin:` có thể xử lý phê duyệt Plugin mà không cần tầng dự phòng cục bộ thứ hai của Slack.
- thẻ gốc của Google Chat giữ lại phương án dự phòng thủ công `/approve` trong văn bản tin nhắn, nhưng lệnh gọi lại
  từ nút trên thẻ chỉ mang token hành động không rõ nghĩa; ID phê duyệt và quyết định được khôi phục từ
  trạng thái chờ phía máy chủ.
- phê duyệt bằng biểu tượng cảm xúc trên WhatsApp xử lý cả lời nhắc exec lẫn Plugin khi nhóm chuyển tiếp cấp cao nhất tương ứng
  định tuyến đến WhatsApp. Lời nhắc có nguồn gốc gốc được liên kết trực tiếp; việc gửi dùng chung ở chế độ mục tiêu
  liên kết cùng siêu dữ liệu phê duyệt có kiểu với biên nhận tin nhắn WhatsApp được chấp nhận.
- phê duyệt bằng phản ứng trên Signal chỉ xử lý cả lời nhắc exec lẫn Plugin khi nhóm chuyển tiếp cấp cao nhất tương ứng
  được bật và định tuyến đến Signal. Phê duyệt exec trực tiếp ngay trong cuộc trò chuyện Signal có thể
  ẩn phương án dự phòng `/approve` cục bộ mà không cần người phê duyệt rõ ràng; việc xử lý phản ứng Signal
  vẫn yêu cầu người phê duyệt Signal được chỉ định rõ từ `channels.signal.allowFrom` hoặc `defaultTo`.
- định tuyến tin nhắn trực tiếp/kênh gốc và phím tắt phản ứng của Matrix xử lý cả phê duyệt exec lẫn Plugin;
  quyền phê duyệt Plugin vẫn lấy từ `channels.matrix.dm.allowFrom`. Lời nhắc gốc của Matrix
  bao gồm nội dung sự kiện tùy chỉnh `com.openclaw.approval` trong sự kiện nhắc đầu tiên để các ứng dụng Matrix
  nhận biết OpenClaw có thể đọc trạng thái phê duyệt có cấu trúc, trong khi ứng dụng tiêu chuẩn vẫn giữ phương án dự phòng
  `/approve` dạng văn bản thuần.
- các nút phê duyệt gốc của Discord và Telegram mang loại chủ sở hữu exec hoặc Plugin rõ ràng trong
  dữ liệu lệnh gọi lại riêng tư của lớp vận chuyển và chỉ xử lý chủ sở hữu đó. Các điều khiển `/approve` cũ không có
  loại vẫn là một đường dẫn tương thích có giới hạn: chúng chỉ thử các loại chủ sở hữu mà tác nhân được phép phê duyệt,
  chỉ tiếp tục sau kết quả không tìm thấy phê duyệt và không bao giờ suy ra quyền sở hữu từ ID phê duyệt.
- người yêu cầu không cần phải là người phê duyệt.
- nếu không giao diện điều hành hoặc ứng dụng phê duyệt đã cấu hình nào có thể tiếp nhận yêu cầu, lời nhắc sẽ chuyển sang
  `askFallback`.

Các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory` sử dụng
định tuyến riêng tư của chủ sở hữu cho lời nhắc phê duyệt và kết quả cuối cùng. Trước tiên, OpenClaw thử một tuyến riêng tư trên
chính giao diện nơi chủ sở hữu chạy lệnh. Nếu giao diện đó không có tuyến riêng tư dành cho chủ sở hữu, hệ thống sẽ chuyển
sang tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, vì vậy một lệnh nhóm Discord
vẫn có thể gửi yêu cầu phê duyệt và kết quả đến tin nhắn trực tiếp Telegram của chủ sở hữu khi Telegram là
giao diện riêng tư chính đã cấu hình. Cuộc trò chuyện nhóm chỉ nhận được một xác nhận ngắn.

Xem:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Ứng dụng điều hành di động chính thức

Các ứng dụng iOS và Android chính thức cũng có thể xem xét những phê duyệt exec đang chờ do Gateway sở hữu
khi sử dụng kết nối `operator.admin`, hoặc khi thiết bị `operator.approvals` đã ghép đôi của chúng
được yêu cầu nhắm đến một cách rõ ràng. Chúng đọc cùng bản ghi bền vững đã được làm sạch mà
giao diện điều khiển sử dụng, gửi quyết định có nhận biết loại và hiển thị kết quả
câu trả lời đầu tiên chuẩn của Gateway. Apple Watch phản chiếu các lời nhắc phê duyệt này thông qua
iPhone đã ghép đôi, với các hành động cho phép một lần và từ chối. Chế độ Gateway trực tiếp trên Watch
không xem xét phê duyệt.

Việc mất xác nhận xử lý không khiến lựa chọn đã gửi trở thành lựa chọn có thẩm quyền:
ứng dụng vô hiệu hóa các điều khiển và đọc lại bản ghi. Nếu một giao diện khác đã thắng,
ứng dụng sẽ hiển thị quyết định đã được ghi lại đó. Lời nhắc đang chờ vẫn được liên kết với
Gateway đã phát hành chúng, vì vậy việc chuyển Gateway đang hoạt động không thể chuyển hướng một
ID phê duyệt cũ.

### Luồng IPC trên macOS

```
Gateway -> Dịch vụ Node (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Ứng dụng Mac (giao diện + phê duyệt + system.run)
```

Lưu ý bảo mật:

- chế độ socket Unix `0600`, token được lưu trong `exec-approvals.json`.
- kiểm tra phía ngang hàng cùng UID.
- thử thách/phản hồi (nonce + token HMAC + hàm băm yêu cầu) + TTL ngắn.

## Câu hỏi thường gặp

### Khi nào `accountId` và `threadId` được dùng trên một mục tiêu phê duyệt?

Sử dụng `accountId` khi kênh có nhiều danh tính đã cấu hình và lời nhắc phê duyệt phải
được gửi qua một tài khoản cụ thể. Sử dụng `threadId` khi đích hỗ trợ chủ đề hoặc
chuỗi hội thoại và lời nhắc cần nằm trong chuỗi đó thay vì cuộc trò chuyện cấp cao nhất.

Một trường hợp Telegram cụ thể là siêu nhóm vận hành có các chủ đề diễn đàn và hai tài khoản bot
Telegram. Giá trị `to` xác định siêu nhóm, `accountId` chọn tài khoản bot và `threadId`
chọn chủ đề diễn đàn:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "targets",
      targets: [
        {
          channel: "telegram",
          to: "-1001234567890",
          accountId: "ops-bot",
          threadId: "77",
        },
      ],
    },
  },
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Bot chính",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Bot vận hành",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

Với thiết lập đó, các yêu cầu phê duyệt exec được chuyển tiếp sẽ do tài khoản Telegram `ops-bot` đăng vào chủ đề
`77` của cuộc trò chuyện `-1001234567890`. Một đích không có `accountId` sẽ sử dụng tài khoản mặc định của kênh, còn
một đích không có `threadId` sẽ đăng vào đích cấp cao nhất.

### Khi yêu cầu phê duyệt được gửi đến một phiên, có phải bất kỳ ai trong phiên đó cũng có thể phê duyệt không?

Không. Việc gửi đến phiên chỉ kiểm soát vị trí lời nhắc xuất hiện. Bản thân việc này không cấp quyền cho mọi
người tham gia cuộc trò chuyện đó phê duyệt.

Đối với `/approve` chung trong cùng cuộc trò chuyện, người gửi phải được cấp quyền sử dụng lệnh trong phiên
kênh đó từ trước. Nếu kênh cung cấp danh sách người có quyền phê duyệt rõ ràng, những người này có thể cho phép
hành động `/approve` ngay cả khi họ không được cấp quyền sử dụng lệnh trong phiên đó.

Một số kênh áp dụng quy định nghiêm ngặt hơn. Discord, Telegram, Matrix, DM phê duyệt gốc của Slack và các
ứng dụng phê duyệt gốc tương tự sử dụng danh sách người phê duyệt đã phân giải để cấp quyền phê duyệt. Ví dụ:
lời nhắc phê duyệt trong chủ đề diễn đàn Telegram có thể hiển thị với mọi người trong chủ đề, nhưng chỉ các ID
người dùng Telegram dạng số được phân giải từ `channels.telegram.execApprovals.approvers` hoặc
`commands.ownerAllowFrom` mới có thể phê duyệt hoặc từ chối.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals) — chính sách cốt lõi và luồng phê duyệt
- [Công cụ exec](/vi/tools/exec)
- [Chế độ nâng cao](/vi/tools/elevated)
- [Skills](/vi/tools/skills) — hành vi tự động cho phép dựa trên skill
