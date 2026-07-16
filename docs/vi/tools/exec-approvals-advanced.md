---
read_when:
    - Cấu hình các tệp nhị phân an toàn hoặc hồ sơ tệp nhị phân an toàn tùy chỉnh
    - Chuyển tiếp yêu cầu phê duyệt đến Slack/Discord/Telegram hoặc các kênh trò chuyện khác
    - Triển khai ứng dụng khách phê duyệt gốc cho một kênh
summary: 'Phê duyệt exec nâng cao: các tệp nhị phân an toàn, liên kết trình thông dịch, chuyển tiếp phê duyệt, phân phối gốc'
title: Phê duyệt thực thi — nâng cao
x-i18n:
    generated_at: "2026-07-16T15:12:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Các chủ đề nâng cao về phê duyệt exec: đường dẫn nhanh `safeBins`, liên kết trình thông dịch/môi trường thực thi
và chuyển tiếp phê duyệt đến các kênh trò chuyện (bao gồm phân phối gốc).
Để biết chính sách cốt lõi và luồng phê duyệt, hãy xem [Phê duyệt exec](/vi/tools/exec-approvals).

## Các tệp nhị phân an toàn (chỉ stdin)

`tools.exec.safeBins` chỉ định các tệp nhị phân **chỉ stdin** (ví dụ: `cut`) chạy
ở chế độ danh sách cho phép **mà không cần** mục danh sách cho phép rõ ràng. Các tệp nhị phân an toàn từ chối
đối số tệp theo vị trí và token có dạng đường dẫn, vì vậy chúng chỉ có thể thao tác trên
luồng đầu vào. Hãy coi đây là đường dẫn nhanh có phạm vi hẹp dành cho bộ lọc luồng, không phải
danh sách tin cậy chung.

<Warning>
**Không** thêm tệp nhị phân của trình thông dịch hoặc môi trường thực thi (ví dụ: `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) vào `safeBins`. Nếu một lệnh theo thiết kế có thể đánh giá mã,
thực thi lệnh con hoặc đọc tệp, hãy ưu tiên các mục danh sách cho phép rõ ràng
và duy trì lời nhắc phê duyệt. Tệp nhị phân an toàn tùy chỉnh phải xác định một
hồ sơ rõ ràng trong `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Các tệp nhị phân an toàn mặc định:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` và `sort` không nằm trong danh sách mặc định. Nếu chọn tham gia, hãy giữ các mục
danh sách cho phép rõ ràng cho quy trình không dùng stdin của chúng. Với `grep` ở chế độ tệp nhị phân an toàn,
hãy cung cấp mẫu bằng `-e`/`--regexp`; dạng mẫu theo vị trí bị từ chối
để không thể ngụy trang toán hạng tệp thành đối số theo vị trí không rõ nghĩa.

### Xác thực argv và các cờ bị từ chối

Việc xác thực chỉ được xác định theo hình dạng argv (không kiểm tra sự tồn tại
trên hệ thống tệp của máy chủ), nhờ đó ngăn hành vi dùng khác biệt cho phép/từ chối
làm phép thử sự tồn tại của tệp. Các tùy chọn hướng đến tệp bị từ chối đối với tệp nhị phân an toàn mặc định; các
tùy chọn dài được xác thực theo nguyên tắc đóng khi lỗi (cờ không xác định và dạng viết tắt không rõ nghĩa
bị từ chối). Các cờ boolean chỉ đọc được nhận dạng của tệp nhị phân mặc định (ví dụ:
`wc -l`, `tr -d`, `uniq -c`) được chấp nhận, còn các cờ ngắn không được nhận dạng vẫn
đóng khi lỗi và chuyển sang phê duyệt thủ công.

Các cờ bị từ chối theo hồ sơ tệp nhị phân an toàn:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail`: `--follow`, `--retry`, `-F`, `-f`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Các tệp nhị phân an toàn cũng buộc token argv được xử lý như **văn bản nguyên nghĩa** tại thời điểm thực thi
(không mở rộng ký tự đại diện và không mở rộng `$VARS`) đối với các phân đoạn chỉ stdin, vì vậy
không thể dùng các mẫu như `*` hoặc `$HOME/...` để ngụy trang thao tác đọc tệp. `awk`,
`sed` và `jq` luôn bị từ chối làm tệp nhị phân an toàn vì ngữ nghĩa của chúng không thể được
xác thực là chỉ dùng stdin: `jq` có thể đọc dữ liệu môi trường và tải mã jq từ
mô-đun hoặc tệp khởi động. Thay vì dùng `safeBins`, hãy sử dụng mục danh sách cho phép rõ ràng hoặc lời nhắc phê duyệt cho
các công cụ đó.

### Thư mục tệp nhị phân đáng tin cậy

Tệp nhị phân an toàn phải được phân giải từ các thư mục tệp nhị phân đáng tin cậy (mặc định hệ thống cộng với
`tools.exec.safeBinTrustedDirs` tùy chọn). Các mục `PATH` không bao giờ được tự động tin cậy.
Các thư mục đáng tin cậy mặc định được cố ý giới hạn tối thiểu: `/bin`, `/usr/bin`. Nếu
tệp thực thi an toàn nằm trong đường dẫn của trình quản lý gói/người dùng (ví dụ:
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), hãy thêm chúng
một cách rõ ràng vào `tools.exec.safeBinTrustedDirs`.

### Nối chuỗi shell, trình bao bọc và bộ ghép kênh

Việc nối chuỗi shell (`&&`, `||`, `;`) được cho phép khi mọi phân đoạn cấp cao nhất
đều đáp ứng danh sách cho phép (bao gồm tệp nhị phân an toàn hoặc tự động cho phép theo skill). Chuyển hướng
vẫn không được hỗ trợ ở chế độ danh sách cho phép. Phép thay thế lệnh (`$()` / dấu huyền) bị
từ chối trong quá trình phân tích danh sách cho phép, kể cả bên trong dấu ngoặc kép; hãy dùng dấu
nháy đơn nếu cần văn bản `$()` nguyên nghĩa.

Đối với phê duyệt từ ứng dụng đồng hành trên macOS, văn bản shell thô có chứa cú pháp điều khiển hoặc
mở rộng shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) được
coi là không khớp danh sách cho phép, trừ khi chính tệp nhị phân shell nằm trong danh sách cho phép.

Đối với trình bao bọc shell (`bash|sh|zsh ... -c/-lc`), các giá trị ghi đè môi trường theo phạm vi yêu cầu được
rút gọn thành một danh sách cho phép nhỏ và rõ ràng (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Đối với các quyết định `allow-always` ở chế độ danh sách cho phép, trình bao bọc điều phối trong suốt
(ví dụ: `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) lưu đường dẫn
của tệp thực thi bên trong thay vì đường dẫn trình bao bọc. Bộ ghép kênh shell
(`busybox`, `toybox`) được tháo bọc cho các applet shell (`sh`, `ash`, v.v.) theo
cùng cách. Nếu không thể tháo bọc an toàn một trình bao bọc hoặc bộ ghép kênh, sẽ không có mục danh sách cho phép nào
được tự động lưu.

Nếu đưa các trình thông dịch như `python3` hoặc `node` vào danh sách cho phép, hãy ưu tiên
`tools.exec.strictInlineEval=true` để việc đánh giá nội tuyến vẫn yêu cầu
phê duyệt rõ ràng. Ở chế độ nghiêm ngặt, `allow-always` vẫn có thể lưu các lệnh gọi
trình thông dịch/tập lệnh vô hại, nhưng các phương thức mang nội dung đánh giá nội tuyến không được tự động
lưu.

### Tệp nhị phân an toàn so với danh sách cho phép

| Chủ đề           | `tools.exec.safeBins`                                       | Danh sách cho phép (`exec-approvals.json`)                                                        |
| ---------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Mục tiêu         | Tự động cho phép các bộ lọc stdin có phạm vi hẹp          | Tin cậy rõ ràng các tệp thực thi cụ thể                                                        |
| Kiểu khớp        | Tên tệp thực thi + chính sách argv của tệp nhị phân an toàn | Glob đường dẫn tệp thực thi đã phân giải hoặc glob tên lệnh trần cho lệnh được gọi qua PATH    |
| Phạm vi đối số   | Bị giới hạn bởi hồ sơ tệp nhị phân an toàn và quy tắc token nguyên nghĩa | Mặc định khớp đường dẫn; `argPattern` tùy chọn có thể giới hạn argv đã phân tích |
| Ví dụ điển hình  | `head`, `tail`, `tr`, `wc`                                  | `jq`, `python3`, `node`, `ffmpeg`, CLI tùy chỉnh                                  |
| Cách dùng tốt nhất | Chuyển đổi văn bản rủi ro thấp trong pipeline           | Bất kỳ công cụ nào có hành vi hoặc tác dụng phụ rộng hơn                                       |

Vị trí cấu hình:

- `safeBins` lấy từ cấu hình (`tools.exec.safeBins` hoặc `agents.list[].tools.exec.safeBins` theo từng tác nhân).
- `safeBinTrustedDirs` lấy từ cấu hình (`tools.exec.safeBinTrustedDirs` hoặc `agents.list[].tools.exec.safeBinTrustedDirs` theo từng tác nhân).
- `safeBinProfiles` lấy từ cấu hình (`tools.exec.safeBinProfiles` hoặc `agents.list[].tools.exec.safeBinProfiles` theo từng tác nhân). Các khóa hồ sơ theo từng tác nhân ghi đè khóa toàn cục.
- Các mục danh sách cho phép nằm trong tệp phê duyệt cục bộ của máy chủ tại `agents.<id>.allowlist` (hoặc qua Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` cảnh báo bằng `tools.exec.safe_bins_interpreter_unprofiled` khi tệp nhị phân của trình thông dịch/môi trường thực thi xuất hiện trong `safeBins` mà không có hồ sơ rõ ràng.
- `openclaw doctor --fix` có thể tạo khung cho các mục `safeBinProfiles.<bin>` tùy chỉnh còn thiếu dưới dạng `{}` (sau đó hãy xem xét và siết chặt). Tệp nhị phân của trình thông dịch/môi trường thực thi không được tự động tạo khung.

Ví dụ hồ sơ tùy chỉnh:

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

## Lệnh trình thông dịch/môi trường thực thi

Các lần chạy trình thông dịch/môi trường thực thi dựa trên phê duyệt được cố ý xử lý thận trọng:

- Ngữ cảnh argv/cwd/env chính xác luôn được liên kết.
- Các dạng tệp môi trường thực thi trực tiếp và tập lệnh shell trực tiếp được liên kết theo nỗ lực tốt nhất với một ảnh chụp nhanh
  của tệp cục bộ cụ thể.
- Các dạng trình bao bọc phổ biến của trình quản lý gói vẫn phân giải thành một tệp cục bộ trực tiếp (ví dụ:
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) được tháo bọc trước khi liên kết.
- Nếu OpenClaw không thể xác định chính xác một tệp cục bộ cụ thể cho lệnh trình thông dịch/môi trường thực thi
  (ví dụ: tập lệnh gói, dạng đánh giá, chuỗi trình nạp đặc thù của môi trường thực thi hoặc dạng nhiều tệp
  không rõ nghĩa), thao tác thực thi dựa trên phê duyệt sẽ bị từ chối thay vì tuyên bố bao quát ngữ nghĩa
  mà hệ thống thực tế không có.
- Đối với các quy trình đó, hãy ưu tiên sandbox, ranh giới máy chủ riêng biệt hoặc quy trình đầy đủ/danh sách cho phép
  đáng tin cậy rõ ràng, trong đó người vận hành chấp nhận ngữ nghĩa rộng hơn của môi trường thực thi.

Khi yêu cầu phê duyệt, công cụ exec trả về ngay một mã phê duyệt. Hãy dùng mã đó để
đối chiếu các sự kiện hệ thống của lần chạy đã được phê duyệt về sau (`Exec finished` và `Exec running` khi được cấu hình).
Nếu không có quyết định trước khi hết thời gian chờ, yêu cầu được coi là hết thời gian chờ phê duyệt và
được hiển thị dưới dạng từ chối lệnh máy chủ ở trạng thái kết thúc. Đối với phê duyệt bất đồng bộ của tác nhân chính có phiên
khởi tạo, OpenClaw cũng tiếp tục phiên đó bằng một lượt theo dõi nội bộ để tác nhân nhận biết rằng
lệnh chưa chạy, thay vì về sau cố khắc phục một kết quả bị thiếu. Theo mặc định, các phê duyệt exec đang chờ sẽ hết hạn
sau 30 phút.

### Hành vi phân phối lượt theo dõi

Sau khi một lệnh exec bất đồng bộ đã được phê duyệt hoàn tất, OpenClaw gửi một lượt `agent` theo dõi đến cùng phiên.
Các phê duyệt bất đồng bộ bị từ chối sử dụng cùng đường dẫn theo dõi của phiên chính để gửi trạng thái từ chối, nhưng chúng
không đăng ký chuyển giao môi trường thực thi nâng quyền và không chạy lệnh. Các trường hợp từ chối không có phiên chính
có thể tiếp tục sẽ bị bỏ qua hoặc được báo cáo qua một tuyến trực tiếp an toàn nếu có.

- Nếu tồn tại đích phân phối bên ngoài hợp lệ (kênh có thể phân phối cùng đích `to`), lượt theo dõi được phân phối qua kênh đó.
- Trong các luồng chỉ dùng webchat hoặc phiên nội bộ không có đích bên ngoài, việc phân phối lượt theo dõi chỉ diễn ra trong phiên (`deliver: false`).
- Nếu bên gọi yêu cầu rõ ràng phân phối bên ngoài nghiêm ngặt nhưng không thể phân giải kênh bên ngoài, yêu cầu sẽ thất bại với `INVALID_REQUEST`.
- Nếu `bestEffortDeliver` được bật và không thể phân giải kênh bên ngoài, việc phân phối sẽ được hạ xuống chỉ trong phiên thay vì thất bại.

## Chuyển tiếp phê duyệt đến các kênh trò chuyện

Bạn có thể chuyển tiếp lời nhắc phê duyệt exec đến bất kỳ kênh trò chuyện nào (bao gồm các kênh Plugin) và phê duyệt
chúng bằng `/approve`. Tính năng này sử dụng pipeline phân phối đi thông thường.

Cấu hình:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session", // "session" | "targets" | "both"
      agentFilter: ["main"],
      sessionFilter: ["discord"], // substring or regex
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

Lệnh `/approve` xử lý cả phê duyệt exec lẫn phê duyệt plugin. Nếu ID không khớp với một phê duyệt exec đang chờ, lệnh sẽ tự động kiểm tra phê duyệt plugin. Cơ chế dự phòng này chỉ giới hạn ở lỗi "không tìm thấy phê duyệt"; trường hợp từ chối/lỗi phê duyệt exec thực sự sẽ không âm thầm thử lại dưới dạng phê duyệt plugin.

### Chuyển tiếp phê duyệt plugin

Việc chuyển tiếp phê duyệt plugin sử dụng cùng quy trình phân phối như phê duyệt exec nhưng có
cấu hình độc lập riêng tại `approvals.plugin`. Bật hoặc tắt loại này không ảnh hưởng đến loại kia.
Để biết hành vi khi phát triển plugin, các trường yêu cầu và ngữ nghĩa quyết định, hãy xem
[Yêu cầu quyền của plugin](/plugins/plugin-permission-requests).

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

Các kênh hỗ trợ phản hồi tương tác dùng chung sẽ hiển thị cùng các nút phê duyệt cho cả phê duyệt
exec và plugin. Các kênh không có giao diện tương tác dùng chung sẽ chuyển về văn bản thuần với hướng dẫn
`/approve`. Yêu cầu phê duyệt plugin có thể giới hạn các quyết định khả dụng: bề mặt phê duyệt sử dụng
tập hợp quyết định do yêu cầu khai báo, và Gateway từ chối những lần gửi quyết định không
được cung cấp.

### Phê duyệt trong cùng cuộc trò chuyện trên mọi kênh

Khi một yêu cầu phê duyệt exec hoặc plugin bắt nguồn từ một bề mặt trò chuyện có thể phân phối, cuộc trò chuyện đó
có thể phê duyệt yêu cầu bằng `/approve` theo mặc định. Điều này áp dụng cho Slack, Matrix, Microsoft Teams và
các cuộc trò chuyện có thể phân phối tương tự, ngoài các luồng Web UI và giao diện đầu cuối hiện có, sử dụng
mô hình xác thực kênh thông thường cho cuộc hội thoại đó. Nếu cuộc trò chuyện nguồn đã có thể gửi lệnh
và nhận phản hồi, yêu cầu phê duyệt không còn cần một bộ điều hợp phân phối gốc riêng chỉ để
duy trì trạng thái chờ.

Discord, Telegram và bot QQ cũng hỗ trợ `/approve` trong cùng cuộc trò chuyện, nhưng các kênh này vẫn sử dụng
danh sách người phê duyệt đã phân giải để ủy quyền ngay cả khi phân phối phê duyệt gốc bị tắt.

### Phân phối phê duyệt gốc

Một số kênh cũng có thể hoạt động như các máy khách phê duyệt gốc: Discord, Slack, Telegram, Matrix và bot QQ.
Máy khách gốc bổ sung tin nhắn trực tiếp cho người phê duyệt, phát tán đến cuộc trò chuyện nguồn và trải nghiệm phê duyệt tương tác dành riêng cho kênh
trên luồng `/approve` dùng chung trong cùng cuộc trò chuyện.

Khi có thẻ/nút phê duyệt gốc, giao diện gốc đó là đường dẫn chính dành cho agent.
Agent không nên đồng thời lặp lại lệnh trò chuyện thuần `/approve` trùng lặp, trừ khi kết quả công cụ cho biết
phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là đường dẫn duy nhất còn lại.

Nếu một máy khách phê duyệt gốc được cấu hình nhưng không có runtime gốc nào đang hoạt động cho
kênh nguồn, OpenClaw giữ lời nhắc `/approve` xác định cục bộ ở trạng thái hiển thị. Nếu runtime gốc
đang hoạt động và thử phân phối nhưng không đích nào nhận được thẻ, OpenClaw gửi một thông báo dự phòng
trong cùng cuộc trò chuyện kèm lệnh `/approve <id> <decision>` chính xác để yêu cầu vẫn có thể được xử lý.

Mô hình chung:

- chính sách exec của máy chủ vẫn quyết định có yêu cầu phê duyệt exec hay không
- `approvals.exec` kiểm soát việc chuyển tiếp lời nhắc phê duyệt đến các đích trò chuyện khác
- `channels.<channel>.execApprovals` kiểm soát việc bật các máy khách gốc dành riêng cho kênh như Discord, Slack, Telegram, bot QQ
  và các kênh tương tự
- phê duyệt plugin Slack có thể sử dụng máy khách phê duyệt gốc của Slack khi yêu cầu bắt nguồn từ Slack
  và phân giải được người phê duyệt plugin Slack; `approvals.plugin` cũng có thể định tuyến phê duyệt plugin đến các phiên
  hoặc đích Slack ngay cả khi phê duyệt exec Slack bị tắt
- thẻ phê duyệt gốc của Google Chat xử lý phê duyệt exec và plugin bắt nguồn từ không gian
  hoặc luồng Google Chat khi phân giải được người phê duyệt `users/<id>` ổn định từ `dm.allowFrom` hoặc
  `defaultTo`; chúng không sử dụng sự kiện phản ứng để đưa ra quyết định
- việc phân phối phê duyệt bằng phản ứng trên WhatsApp và Signal được kiểm soát bởi `approvals.exec` và
  `approvals.plugin`; chúng không có khối `channels.<channel>.execApprovals`

Máy khách phê duyệt gốc tự động bật chế độ ưu tiên tin nhắn trực tiếp khi tất cả các điều kiện sau đều đúng:

- kênh hỗ trợ phân phối phê duyệt gốc
- có thể phân giải người phê duyệt từ `execApprovals.approvers` tường minh hoặc danh tính
  chủ sở hữu như `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` chưa được đặt hoặc là `"auto"`

Đặt `enabled: false` để tắt rõ ràng một máy khách phê duyệt gốc. Đặt `enabled: true` để buộc
bật khi phân giải được người phê duyệt. Việc phân phối công khai đến cuộc trò chuyện nguồn vẫn phải được bật tường minh qua
`channels.<channel>.execApprovals.target`. Khi `target` gốc bật phân phối đến cuộc trò chuyện nguồn,
lời nhắc phê duyệt sẽ bao gồm văn bản lệnh.

Câu hỏi thường gặp: [Tại sao có hai cấu hình phê duyệt exec cho phê duyệt qua trò chuyện?](/help/faq-first-run)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`
- Bot QQ: `channels.qqbot.execApprovals.*`
- Google Chat: cấu hình người phê duyệt ổn định bằng `channels.googlechat.dm.allowFrom` hoặc
  `channels.googlechat.defaultTo`; không yêu cầu khối `execApprovals`
- WhatsApp: sử dụng `approvals.exec` và `approvals.plugin` để định tuyến lời nhắc phê duyệt đến WhatsApp
- Signal: sử dụng `approvals.exec` và `approvals.plugin` để định tuyến lời nhắc phê duyệt đến Signal

Định tuyến dành riêng cho máy khách gốc:

- Telegram mặc định gửi tin nhắn trực tiếp cho người phê duyệt (`target: "dm"`). Chuyển sang `channel` hoặc `both` để đồng thời hiển thị
  lời nhắc phê duyệt trong cuộc trò chuyện/chủ đề Telegram nguồn. Đối với các chủ đề diễn đàn Telegram, OpenClaw
  giữ nguyên chủ đề cho lời nhắc phê duyệt và thông báo tiếp theo sau khi phê duyệt.
- Người phê duyệt Discord và Telegram có thể được chỉ định tường minh (`execApprovals.approvers`) hoặc suy ra từ
  `commands.ownerAllowFrom`; chỉ người phê duyệt đã phân giải mới có thể phê duyệt hoặc từ chối.
- Người phê duyệt Slack có thể được chỉ định tường minh (`execApprovals.approvers`) hoặc suy ra từ
  `commands.ownerAllowFrom`. Tin nhắn trực tiếp phê duyệt plugin Slack sử dụng người phê duyệt plugin Slack từ `allowFrom`
  và định tuyến mặc định của tài khoản, không sử dụng người phê duyệt exec Slack. Các nút gốc của Slack giữ nguyên loại ID phê duyệt,
  vì vậy ID `plugin:` có thể xử lý phê duyệt plugin mà không cần lớp dự phòng cục bộ Slack thứ hai.
- Thẻ gốc Google Chat giữ lại phương án dự phòng thủ công `/approve` trong văn bản tin nhắn, nhưng lệnh gọi lại
  của nút thẻ chỉ mang token hành động không rõ nghĩa; ID phê duyệt và quyết định được khôi phục từ
  trạng thái chờ phía máy chủ.
- Phê duyệt bằng emoji trên WhatsApp xử lý cả lời nhắc exec và plugin khi họ chuyển tiếp cấp cao nhất
  tương ứng định tuyến đến WhatsApp. Lời nhắc có nguồn gốc gốc được liên kết trực tiếp; phân phối chế độ đích dùng chung
  liên kết cùng siêu dữ liệu phê duyệt có kiểu với biên nhận tin nhắn WhatsApp được chấp nhận.
- Phê duyệt bằng phản ứng trên Signal chỉ xử lý cả lời nhắc exec và plugin khi họ chuyển tiếp cấp cao nhất
  tương ứng được bật và định tuyến đến Signal. Phê duyệt exec Signal trực tiếp trong cùng cuộc trò chuyện có thể
  ẩn phương án dự phòng `/approve` cục bộ mà không cần người phê duyệt tường minh; việc phân giải phản ứng Signal
  vẫn yêu cầu người phê duyệt Signal tường minh từ `channels.signal.allowFrom` hoặc `defaultTo`.
- Định tuyến tin nhắn trực tiếp/kênh gốc và lối tắt phản ứng của Matrix xử lý cả phê duyệt exec và plugin;
  việc ủy quyền plugin vẫn đến từ `channels.matrix.dm.allowFrom`. Lời nhắc gốc Matrix
  bao gồm nội dung sự kiện tùy chỉnh `com.openclaw.approval` trong sự kiện lời nhắc đầu tiên để các máy khách Matrix
  nhận biết OpenClaw có thể đọc trạng thái phê duyệt có cấu trúc, trong khi các máy khách tiêu chuẩn giữ phương án dự phòng
  văn bản thuần `/approve`.
- Các nút phê duyệt gốc của Discord và Telegram mang một loại chủ sở hữu exec hoặc plugin tường minh trong
  dữ liệu lệnh gọi lại riêng tư của lớp vận chuyển và chỉ phân giải chủ sở hữu đó. Các điều khiển `/approve` cũ không có
  loại vẫn là một đường dẫn tương thích có giới hạn: chúng chỉ thử các loại chủ sở hữu mà tác nhân có thể phê duyệt,
  chỉ tiếp tục sau kết quả không tìm thấy phê duyệt và không bao giờ suy ra quyền sở hữu từ ID phê duyệt.
- Người yêu cầu không cần phải là người phê duyệt.
- Nếu không có giao diện người vận hành hoặc máy khách phê duyệt đã cấu hình nào có thể chấp nhận yêu cầu, lời nhắc sẽ chuyển về
  `askFallback`.

Các lệnh nhóm nhạy cảm chỉ dành cho chủ sở hữu như `/diagnostics` và `/export-trajectory` sử dụng định tuyến
riêng tư của chủ sở hữu cho lời nhắc phê duyệt và kết quả cuối cùng. Trước tiên, OpenClaw thử một tuyến riêng tư trên
chính bề mặt nơi chủ sở hữu đã chạy lệnh. Nếu bề mặt đó không có tuyến riêng tư dành cho chủ sở hữu, hệ thống sẽ chuyển
sang tuyến chủ sở hữu khả dụng đầu tiên từ `commands.ownerAllowFrom`, vì vậy một lệnh nhóm Discord
vẫn có thể gửi phê duyệt và kết quả đến tin nhắn trực tiếp Telegram của chủ sở hữu khi Telegram là giao diện
riêng tư chính đã cấu hình. Cuộc trò chuyện nhóm chỉ nhận được một xác nhận ngắn.

Xem:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [Bot QQ](/channels/qqbot)

### Ứng dụng di động chính thức dành cho người vận hành

Các ứng dụng iOS và Android chính thức cũng có thể xem xét những phê duyệt exec đang chờ
do Gateway sở hữu khi sử dụng kết nối `operator.admin`, hoặc khi thiết bị
`operator.approvals` đã ghép đôi của chúng được yêu cầu nhắm đến một cách tường minh. Chúng đọc
cùng bản ghi bền vững đã được làm sạch mà
Control UI sử dụng, gửi quyết định có nhận biết loại và hiển thị kết quả
câu trả lời đầu tiên chính tắc của Gateway. Apple Watch phản chiếu các lời nhắc phê duyệt này thông qua
iPhone đã ghép đôi, với các hành động cho phép một lần và từ chối. Chế độ Gateway trực tiếp của Watch
không xem xét phê duyệt.

Việc mất xác nhận phân giải không làm cho lựa chọn đã gửi trở thành quyết định có thẩm quyền:
ứng dụng vô hiệu hóa các điều khiển và đọc lại bản ghi. Nếu một bề mặt khác
đã thắng, ứng dụng hiển thị quyết định đã ghi nhận đó. Lời nhắc đang chờ vẫn được ràng buộc với
Gateway đã phát hành chúng, vì vậy việc chuyển Gateway đang hoạt động không thể chuyển hướng một
ID phê duyệt cũ.

### Luồng IPC macOS

```
Gateway -> Dịch vụ Node (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Ứng dụng Mac (UI + phê duyệt + system.run)
```

Ghi chú bảo mật:

- Chế độ socket Unix `0600`, token được lưu trong `exec-approvals.json`.
- Kiểm tra bên ngang hàng cùng UID.
- Thử thách/phản hồi (nonce + token HMAC + hàm băm yêu cầu) + TTL ngắn.

## Câu hỏi thường gặp

### Khi nào `accountId` và `threadId` được sử dụng trên một đích phê duyệt?

Sử dụng `accountId` khi kênh có nhiều danh tính được cấu hình và lời nhắc phê duyệt phải
được gửi qua một tài khoản cụ thể. Sử dụng `threadId` khi đích hỗ trợ chủ đề hoặc
luồng và lời nhắc cần nằm trong luồng đó thay vì cuộc trò chuyện cấp cao nhất.

Một trường hợp Telegram cụ thể là siêu nhóm vận hành có các chủ đề diễn đàn và hai tài khoản
bot Telegram. Giá trị `to` chỉ định siêu nhóm, `accountId` chọn tài khoản bot và `threadId`
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
          name: "Primary bot",
          botToken: "env:TELEGRAM_PRIMARY_BOT_TOKEN",
        },
        "ops-bot": {
          name: "Operations bot",
          botToken: "env:TELEGRAM_OPS_BOT_TOKEN",
        },
      },
    },
  },
}
```

Với thiết lập đó, các phê duyệt exec được chuyển tiếp sẽ do tài khoản Telegram `ops-bot` đăng vào chủ đề
`77` của cuộc trò chuyện `-1001234567890`. Đích không có `accountId` sẽ sử dụng tài khoản mặc định của kênh, còn
đích không có `threadId` sẽ đăng lên đích cấp cao nhất.

### Khi phê duyệt được gửi đến một phiên, bất kỳ ai trong phiên đó đều có thể phê duyệt không?

Không. Việc gửi đến phiên chỉ kiểm soát vị trí lời nhắc xuất hiện. Bản thân việc đó không cấp quyền phê duyệt cho mọi
người tham gia cuộc trò chuyện đó.

Đối với `/approve` chung trong cùng cuộc trò chuyện, người gửi phải đã được cấp quyền sử dụng lệnh trong phiên
kênh đó. Nếu kênh cung cấp rõ danh sách người có quyền phê duyệt, những người này có thể cấp phép cho
hành động `/approve` ngay cả khi họ không được cấp quyền sử dụng lệnh trong phiên đó.

Một số kênh nghiêm ngặt hơn. Tin nhắn trực tiếp phê duyệt gốc của Discord, Telegram, Matrix, Slack và các
ứng dụng phê duyệt gốc tương tự sử dụng danh sách người phê duyệt đã phân giải để cấp quyền phê duyệt. Ví dụ:
một lời nhắc phê duyệt trong chủ đề diễn đàn Telegram có thể hiển thị với mọi người trong chủ đề, nhưng chỉ các ID người dùng
Telegram dạng số được phân giải từ `channels.telegram.execApprovals.approvers` hoặc
`commands.ownerAllowFrom` mới có thể phê duyệt hoặc từ chối.

## Liên quan

- [Phê duyệt thực thi](/vi/tools/exec-approvals) — chính sách cốt lõi và luồng phê duyệt
- [Công cụ thực thi](/vi/tools/exec)
- [Chế độ nâng cao](/vi/tools/elevated)
- [Skills](/vi/tools/skills) — hành vi tự động cho phép dựa trên skill
