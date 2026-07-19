---
read_when:
    - Sử dụng hoặc sửa đổi công cụ exec
    - Gỡ lỗi hành vi stdin hoặc TTY
summary: Cách sử dụng công cụ exec, các chế độ stdin và hỗ trợ TTY
title: Công cụ thực thi
x-i18n:
    generated_at: "2026-07-19T05:59:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 096260e5a5a657682797c00430519f2b664bc7ae9dc682970494fd63a061f227
    source_path: tools/exec.md
    workflow: 16
---

Chạy các lệnh shell trong workspace. `exec` là một bề mặt shell có khả năng thay đổi dữ liệu: các lệnh có thể tạo, chỉnh sửa hoặc xóa tệp ở bất kỳ đâu mà hệ thống tệp của máy chủ hoặc sandbox đã chọn cho phép. Việc tắt các công cụ hệ thống tệp của OpenClaw như `write`, `edit` hoặc `apply_patch` không khiến `exec` trở thành chỉ đọc.

Hỗ trợ thực thi ở tiền cảnh và nền thông qua `process`. Nếu `process` không được phép, `exec` sẽ chạy đồng bộ và bỏ qua `yieldMs`/`background`. Các phiên nền được giới hạn theo từng agent; `process` chỉ thấy các phiên của cùng một agent.

## Tham số

<ParamField path="command" type="string" required>
Lệnh shell cần chạy.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Thư mục làm việc cho lệnh.
</ParamField>

<ParamField path="env" type="object">
Các giá trị ghi đè môi trường dạng khóa/giá trị được hợp nhất trên môi trường kế thừa.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Tự động chuyển lệnh sang chạy nền sau khoảng thời gian trì hoãn này (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Chuyển lệnh sang chạy nền ngay lập tức thay vì chờ `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Ghi đè thời gian chờ thực thi đã cấu hình cho lần gọi này, tính bằng giây. Áp dụng cho việc thực thi ở tiền cảnh, nền, `yieldMs`, gateway, sandbox và node `system.run`. `timeout: 0` vô hiệu hóa thời gian chờ của tiến trình thực thi cho lần gọi đó.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Chạy trong pseudo-terminal khi khả dụng. Dùng cho các CLI chỉ hoạt động với TTY, tác nhân lập trình và giao diện người dùng terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nơi thực thi. `auto` phân giải thành `sandbox` khi runtime sandbox đang hoạt động và thành `gateway` trong trường hợp khác.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Bị bỏ qua đối với các lệnh gọi công cụ thông thường. Bảo mật `gateway`/`node` được kiểm soát bởi `tools.exec.security` và tệp phê duyệt của máy chủ; chế độ nâng cao chỉ có thể buộc dùng `security=full` khi người vận hành cấp quyền truy cập nâng cao một cách rõ ràng.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Chế độ hỏi cơ sở lấy từ `tools.exec.ask` và các phê duyệt của máy chủ. Đối với các lệnh gọi mô hình bắt nguồn từ kênh, `ask` theo từng lệnh gọi bị bỏ qua khi chế độ hỏi hiệu lực của máy chủ là `off`; nếu không, nó chỉ có thể siết chặt thành một chế độ nghiêm ngặt hơn. Các trình gọi nội bộ/API đáng tin cậy tạo công cụ exec với giá trị `ask` tường minh không thay đổi.
</ParamField>

<ParamField path="node" type="string">
ID/tên Node khi `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yêu cầu chế độ nâng cao: thoát khỏi sandbox để vào đường dẫn máy chủ đã cấu hình. `security=full` chỉ bị buộc dùng khi chế độ nâng cao phân giải thành `full`.
</ParamField>

Lưu ý:

- `host` chỉ chấp nhận `auto`, `sandbox`, `gateway` hoặc `node`. Đây không phải là bộ chọn tên máy chủ; các giá trị giống tên máy chủ bị từ chối trước khi lệnh chạy.
- `host=node` theo từng lệnh gọi được phép từ `auto`; `host=gateway` theo từng lệnh gọi chỉ được phép khi không có runtime sandbox nào đang hoạt động.
- Khi không có cấu hình bổ sung, `host=auto` vẫn "hoạt động ngay": không có sandbox nghĩa là nó phân giải thành `gateway`; có sandbox đang hoạt động nghĩa là nó vẫn ở trong sandbox.
- `elevated` thoát khỏi sandbox để vào đường dẫn máy chủ đã cấu hình: mặc định là `gateway`, hoặc `node` khi `tools.exec.host=node` (hoặc giá trị mặc định của phiên là `host=node`). Tính năng này chỉ khả dụng khi quyền truy cập nâng cao được bật cho phiên/nhà cung cấp hiện tại.
- Các phê duyệt `gateway`/`node` được kiểm soát bởi tệp phê duyệt của máy chủ.
- `node` yêu cầu một Node đã ghép nối (ứng dụng đồng hành hoặc máy chủ Node không giao diện). Nếu có nhiều Node, hãy đặt `exec.node` hoặc `tools.exec.node` để chọn một Node.
- `exec host=node` là đường dẫn thực thi shell duy nhất cho các Node; trình bao bọc `nodes.run` cũ đã bị loại bỏ.
- Trên máy chủ không phải Windows, exec dùng `SHELL` khi được đặt; nếu `SHELL` là `fish`, nó ưu tiên `bash` (hoặc `sh`) từ `PATH` để tránh các cấu trúc bash không tương thích với fish, rồi dùng dự phòng `SHELL` nếu không có cả hai.
- Trên máy chủ Windows, exec ưu tiên phát hiện PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, rồi PATH), sau đó dùng dự phòng Windows PowerShell 5.1.
- Trên các máy chủ Gateway không phải Windows, lệnh exec của bash và zsh sử dụng ảnh chụp nhanh khởi động. OpenClaw ghi lại các bí danh/hàm có thể nạp bằng source và một tập hợp nhỏ các biến môi trường an toàn từ các tệp khởi động shell vào `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, rồi nạp ảnh chụp nhanh đó bằng source trước mỗi lệnh exec. Các biến có vẻ chứa bí mật bị loại trừ; lệnh exec trong sandbox và trên Node không sử dụng ảnh chụp nhanh này. Đặt `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` trong môi trường tiến trình Gateway để tắt đường dẫn ảnh chụp nhanh này.
- Thực thi trên máy chủ (`gateway`/`node`) từ chối `env.PATH` và các giá trị ghi đè trình nạp (`LD_*`/`DYLD_*`) để ngăn chiếm quyền điều khiển tệp nhị phân hoặc chèn mã.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường của lệnh được khởi chạy (bao gồm cả thực thi trong PTY và sandbox) để các quy tắc shell/hồ sơ có thể phát hiện ngữ cảnh của công cụ exec.
- Đối với các lần chạy bắt nguồn từ kênh, OpenClaw cũng cung cấp một tải trọng JSON danh tính người gửi/cuộc trò chuyện có phạm vi hẹp trong `OPENCLAW_CHANNEL_CONTEXT` khi kênh cung cấp các ID đó.
- `exec` không thể chạy các lệnh shell `openclaw channels login` hoặc `/approve`: `openclaw channels login` là một luồng xác thực kênh tương tác, còn `/approve` cần đi qua trình xử lý lệnh phê duyệt, không phải shell. Chạy đăng nhập kênh trong terminal trên máy chủ Gateway hoặc dùng công cụ tác nhân đăng nhập dành riêng cho kênh khi có (ví dụ: `whatsapp_login`).
- Quan trọng: sandbox **bị tắt theo mặc định**. Nếu sandbox bị tắt, `host=auto` ngầm định phân giải thành `gateway`. `host=sandbox` tường minh vẫn đóng an toàn khi thất bại thay vì âm thầm chạy trên máy chủ Gateway. Hãy bật sandbox hoặc dùng `host=gateway` kèm phê duyệt.
- Các bước kiểm tra trước khi chạy tập lệnh (đối với các lỗi cú pháp shell Python/Node thường gặp) chỉ kiểm tra các tệp bên trong ranh giới `workdir` hiệu lực. Nếu đường dẫn tập lệnh phân giải ra ngoài `workdir`, bước kiểm tra trước khi chạy sẽ bị bỏ qua đối với tệp đó. Bước kiểm tra này cũng bị bỏ qua hoàn toàn khi `host=gateway` và chính sách hiệu lực là `security=full` với `ask=off`.
- Đối với công việc chạy lâu bắt đầu ngay bây giờ, hãy khởi động một lần và dựa vào cơ chế tự động đánh thức khi hoàn tất nếu cơ chế này được bật và lệnh tạo đầu ra hoặc thất bại. Dùng `process` cho nhật ký, trạng thái, đầu vào hoặc can thiệp; không mô phỏng việc lập lịch bằng vòng lặp sleep, vòng lặp timeout hoặc thăm dò lặp lại.
- Các lệnh nền do tác nhân khởi động xuất hiện trong chế độ xem tác vụ nền trên Web, iOS và Android cho đến khi hoàn tất. Sổ cái tác vụ được hoàn tất trước khi Heartbeat hoàn thành đánh thức tác nhân lần nữa.
- Đối với công việc cần diễn ra sau hoặc theo lịch, hãy dùng cron thay cho các mẫu sleep/trì hoãn `exec`.

## Cấu hình

| Khóa                                  | Mặc định                                                | Ghi chú                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Thời gian chờ thực thi mặc định cho mỗi lệnh, tính bằng giây. `timeout` theo từng lần gọi sẽ ghi đè giá trị này; `timeout: 0` theo từng lần gọi sẽ vô hiệu hóa thời gian chờ của tiến trình thực thi.                  |
| `tools.exec.host`                    | `auto`                                                 | Phân giải thành `sandbox` khi runtime sandbox đang hoạt động, nếu không thì thành `gateway`.                                                                            |
| `tools.exec.security`                | `deny` cho sandbox, `full` cho gateway/node khi chưa đặt |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | chưa đặt                                                  | Tùy chọn chính sách đã chuẩn hóa. Xem [Chế độ](#modes) bên dưới. Không thể kết hợp với `tools.exec.security`/`tools.exec.ask`.                                      |
| `tools.exec.reviewer.model`          | mô hình chính của agent đã cấu hình                               | Ghi đè nhà cung cấp/mô hình tùy chọn cho hoạt động review `mode=auto`.                                                                                                |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Thời gian chờ cho mỗi giai đoạn chuẩn bị và hoàn tất của mô hình reviewer trước khi chuyển sang con người.                                                                  |
| `tools.exec.node`                    | chưa đặt                                                  |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Khi là true, các phiên thực thi chạy nền sẽ đưa một sự kiện hệ thống vào hàng đợi và yêu cầu Heartbeat khi thoát.                                                           |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Phát một thông báo "đang chạy" duy nhất khi tác vụ thực thi bị kiểm soát bởi phê duyệt chạy lâu hơn khoảng này (`0` sẽ vô hiệu hóa).                                                        |
| `tools.exec.strictInlineEval`        | `false`                                                | Xem [Đánh giá nội tuyến](#inline-eval-strictinlineeval).                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                                                | Khi là true, lời nhắc phê duyệt có thể làm nổi bật các đoạn lệnh được suy ra bởi trình phân tích cú pháp trong văn bản lệnh. Đặt toàn cục hoặc theo từng agent; không thay đổi chính sách phê duyệt. |
| `tools.exec.pathPrepend`             | chưa đặt                                                  | Danh sách thư mục cần thêm vào đầu `PATH` cho các lần thực thi (chỉ gateway + sandbox).                                                                        |
| `tools.exec.safeBins`                | chưa đặt                                                  | Các tệp nhị phân an toàn chỉ nhận stdin có thể chạy mà không cần mục rõ ràng trong danh sách cho phép. Xem [Tệp nhị phân an toàn](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only).         |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Các thư mục rõ ràng bổ sung được tin cậy để kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ được tự động tin cậy.                                              |
| `tools.exec.safeBinProfiles`         | chưa đặt                                                  | Chính sách argv tùy chỉnh không bắt buộc cho từng tệp nhị phân an toàn (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                                        |

Thực thi trên host không cần phê duyệt là mặc định đối với gateway và node (`security=full`, `ask=off`) — điều này đến từ các giá trị mặc định của chính sách host, không phải từ `host=auto`. Nếu muốn có hành vi phê duyệt/danh sách cho phép, hãy siết chặt cả `tools.exec.*` và tệp phê duyệt host; xem [Phê duyệt thực thi](/vi/tools/exec-approvals#yolo-mode-no-approval). Để buộc định tuyến qua gateway hoặc node bất kể trạng thái sandbox, hãy đặt `tools.exec.host` hoặc dùng `/exec host=...`.

Ví dụ:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Chế độ

`tools.exec.mode` là tùy chọn chính sách đã chuẩn hóa. Việc đặt nó sẽ suy ra `security`/`ask` và không thể kết hợp với `tools.exec.security`/`tools.exec.ask` được đặt rõ ràng.

| Chế độ        | bảo mật    | hỏi       | Hành vi                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Tác vụ thực thi bị từ chối.                                                                                                                |
| `allowlist` | `allowlist` | `off`     | Chỉ các lệnh trong danh sách cho phép/tệp nhị phân an toàn mới chạy; không hỏi về bất kỳ lệnh nào khác.                                                                 |
| `ask`       | `allowlist` | `on-miss` | Các lệnh khớp danh sách cho phép sẽ chạy trực tiếp; mọi lệnh khác đều hỏi con người.                                                                  |
| `auto`      | `allowlist` | `on-miss` | Các lệnh khớp danh sách cho phép/tệp nhị phân an toàn sẽ chạy trực tiếp; mọi lệnh khác được chuyển qua reviewer tự động gốc của OpenClaw trước khi hỏi con người. |
| `full`      | `full`      | `off`     | Không có cổng phê duyệt.                                                                                                              |

`ask`/`ask=always` vẫn luôn hỏi con người bất kể chế độ.

Phê duyệt bằng review tự động chỉ dùng một lần. Trên gateway, OpenClaw cung cấp đường dẫn tệp thực thi đã phân giải cho reviewer và ghim việc thực thi vào chính đường dẫn đó. Các lệnh không thể rút gọn thành một kế hoạch thực thi duy nhất có thể cưỡng chế — chẳng hạn như heredoc, phép mở rộng shell hoặc cách trích dẫn trình bao bọc không được hỗ trợ — sẽ chuyển sang phê duyệt của con người ngay cả khi mô hình lẽ ra cho phép chúng.

Các phê duyệt lệnh app-server của Codex chưa được quyết định bởi chính sách runtime rõ ràng hoặc chính sách gốc sẽ sử dụng tuyến phê duyệt của con người. OpenClaw không chạy reviewer thực thi đã cấu hình cho các yêu cầu này vì Codex không cung cấp tệp thực thi đã phân giải có thể cưỡng chế để ràng buộc quyết định review với lệnh mà Codex chạy.

### Đánh giá nội tuyến (`strictInlineEval`)

Khi `tools.exec.strictInlineEval` là `true`, các dạng đánh giá nội tuyến của trình thông dịch yêu cầu reviewer hoặc phê duyệt rõ ràng: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e`, cùng các dạng tương tự trong những trình thông dịch và phương tiện chuyển lệnh được hỗ trợ khác (`awk`, `find -exec`, `make`, `sed`, `xargs`, v.v.). Trong `mode=auto`, đường dẫn phê duyệt thực thi thông thường có thể cho phép reviewer tự động gốc chấp thuận một lệnh dùng một lần rõ ràng có rủi ro thấp; các lệnh gọi `system.run` trực tiếp trên node-host vẫn yêu cầu phê duyệt rõ ràng vì chúng không thể chuyển lệnh sang tuyến phê duyệt của con người. Nếu reviewer yêu cầu, yêu cầu đó sẽ được chuyển đến con người. `allow-always` vẫn có thể lưu các lệnh gọi trình thông dịch/tập lệnh lành tính, nhưng các dạng đánh giá nội tuyến không trở thành quy tắc cho phép lâu dài.

### Xử lý PATH

- `host=gateway`: hợp nhất `PATH` của login shell vào môi trường thực thi. Các giá trị ghi đè `env.PATH` bị từ chối khi thực thi trên host. Bản thân daemon vẫn chạy với một `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Để ngăn cấu hình shell của người dùng (như `~/.zshenv` hoặc `/etc/zshenv`) ghi đè các đường dẫn ưu tiên trong khi khởi động, các mục `tools.exec.pathPrepend` được thêm an toàn vào đầu `PATH` cuối cùng bên trong lệnh shell ngay trước khi thực thi.
- `host=sandbox`: chạy `sh -lc` (login shell) bên trong container, vì vậy `/etc/profile` có thể đặt lại `PATH`. OpenClaw thêm `env.PATH` vào đầu sau khi nạp hồ sơ thông qua một biến môi trường nội bộ (không nội suy shell); `tools.exec.pathPrepend` cũng áp dụng tại đây.
- `host=node`: chỉ các giá trị ghi đè môi trường không bị chặn mà bạn truyền vào mới được gửi đến node. Các giá trị ghi đè `env.PATH` bị từ chối khi thực thi trên host và bị các node host bỏ qua. Nếu cần thêm mục PATH trên node, hãy cấu hình môi trường dịch vụ của node host (systemd/launchd) hoặc cài đặt công cụ tại các vị trí tiêu chuẩn.

Liên kết node theo từng agent (dùng chỉ mục danh sách agent trong cấu hình):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: trang **Thiết bị** có một bảng nhỏ "Liên kết node thực thi" cho cùng các cài đặt.

## Ghi đè phiên (`/exec`)

Dùng `/exec` để đặt giá trị mặc định **theo từng phiên** cho `host`, `security`, `ask` và `node`. Gửi `/exec` không có đối số để hiển thị các giá trị hiện tại.

Ví dụ:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` chỉ được chấp nhận đối với **người gửi được ủy quyền** (danh sách cho phép/ghép cặp của kênh cùng với `commands.useAccessGroups`). Nó chỉ cập nhật **trạng thái phiên** và không ghi cấu hình. Người gửi bên ngoài được ủy quyền qua kênh có thể đặt các giá trị mặc định của phiên này. Các máy khách gateway/webchat nội bộ cần `operator.admin` để lưu chúng.

Để vô hiệu hóa hoàn toàn việc thực thi, hãy từ chối nó thông qua chính sách công cụ (`tools.deny: ["exec"]` hoặc theo từng agent). Phê duyệt host vẫn áp dụng trừ khi bạn đặt rõ ràng `security=full` và `ask=off`.

## Phê duyệt thực thi (ứng dụng đồng hành / node host)

Các agent trong sandbox có thể yêu cầu phê duyệt cho từng yêu cầu trước khi `exec` chạy trên gateway hoặc node host. Xem [Phê duyệt thực thi](/vi/tools/exec-approvals) để biết chính sách, danh sách cho phép và luồng UI.

Khi cần phê duyệt của con người, các luồng node-host và gateway không phải gốc sẽ trả về ngay lập tức với `status: "approval-pending"` và một mã phê duyệt. Thay vào đó, các luồng gateway của trò chuyện gốc và Web UI có thể chờ nội tuyến rồi trả về kết quả lệnh cuối cùng sau khi phê duyệt. Kết quả `approval-pending` có nghĩa là lệnh chưa bắt đầu, vì vậy cảnh báo chuyển sang chạy nền chỉ xuất hiện nếu lệnh đã phê duyệt thực sự chạy nội tuyến. Các lần chạy bất đồng bộ đã phê duyệt phát sự kiện hệ thống về tiến trình và hoàn tất lệnh (`Exec running` / `Exec finished`); các phê duyệt bị từ chối hoặc hết thời gian chờ là trạng thái kết thúc và không đánh thức phiên agent bằng sự kiện hệ thống về việc từ chối.

Trên các kênh có thẻ/nút phê duyệt gốc, agent nên ưu tiên dựa vào giao diện người dùng gốc đó và chỉ đưa vào lệnh `/approve` thủ công khi kết quả công cụ nêu rõ rằng tính năng phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là cách duy nhất.

## Danh sách cho phép + tệp nhị phân an toàn

Cơ chế thực thi danh sách cho phép thủ công đối chiếu các glob đường dẫn tệp nhị phân đã phân giải và các glob tên lệnh thuần. Tên thuần chỉ khớp với các lệnh được gọi thông qua PATH, vì vậy `rg` có thể khớp với `/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng không khớp với `./rg` hoặc `/tmp/rg`.

Khi `security=allowlist`, các lệnh shell chỉ được tự động cho phép nếu mọi phân đoạn pipeline đều nằm trong danh sách cho phép hoặc là tệp nhị phân an toàn. Phép nối chuỗi (`;`, `&&`, `||`) và chuyển hướng bị từ chối trong chế độ danh sách cho phép, trừ khi mọi phân đoạn cấp cao nhất đều đáp ứng danh sách cho phép (bao gồm cả tệp nhị phân an toàn). Chuyển hướng vẫn không được hỗ trợ. Quyền tin cậy `allow-always` lâu dài không bỏ qua quy tắc đó: một lệnh nối chuỗi vẫn yêu cầu mọi phân đoạn cấp cao nhất phải khớp.

`autoAllowSkills` là một phương thức tiện lợi riêng trong phê duyệt exec, không giống với các mục danh sách đường dẫn cho phép thủ công. Để áp dụng quyền tin cậy tường minh nghiêm ngặt, hãy giữ `autoAllowSkills` ở trạng thái tắt.

Sử dụng hai cơ chế kiểm soát cho các mục đích khác nhau:

- `tools.exec.safeBins`: các bộ lọc luồng nhỏ, chỉ dùng stdin.
- `tools.exec.safeBinTrustedDirs`: các thư mục tin cậy bổ sung được chỉ định rõ cho đường dẫn tệp thực thi của tệp nhị phân an toàn.
- `tools.exec.safeBinProfiles`: chính sách argv tường minh cho các tệp nhị phân an toàn tùy chỉnh.
- allowlist: quyền tin cậy tường minh cho các đường dẫn tệp thực thi.

Không coi `safeBins` là danh sách cho phép chung và không thêm các tệp nhị phân của trình thông dịch/môi trường chạy (ví dụ `python3`, `node`, `ruby`, `bash`). Nếu cần chúng, hãy sử dụng các mục danh sách cho phép tường minh và giữ lời nhắc phê duyệt ở trạng thái bật.

`openclaw security audit` cảnh báo khi các mục `safeBins` của trình thông dịch/môi trường chạy thiếu hồ sơ tường minh, và `openclaw doctor --fix` có thể dựng khung cho các mục `safeBinProfiles` tùy chỉnh còn thiếu. `openclaw security audit` và `openclaw doctor` cũng cảnh báo khi bạn thêm lại một cách tường minh các tệp nhị phân có hành vi rộng như `jq` vào `safeBins` (`jq` có thể đọc dữ liệu môi trường và tải mã jq từ các mô-đun hoặc tệp khởi động, vì vậy thay vào đó hãy ưu tiên các mục danh sách cho phép tường minh hoặc những lần chạy được kiểm soát bằng phê duyệt). `jq` bị từ chối với vai trò tệp nhị phân an toàn ngay cả khi được liệt kê tường minh. Nếu bạn đưa các trình thông dịch vào danh sách cho phép một cách tường minh, hãy bật `tools.exec.strictInlineEval` để các dạng đánh giá mã nội tuyến vẫn yêu cầu người review hoặc phê duyệt tường minh.

Để biết đầy đủ chi tiết chính sách và ví dụ, hãy xem [Phê duyệt exec](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only) và [Tệp nhị phân an toàn so với danh sách cho phép](/vi/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ví dụ

Tiền cảnh:

```json
{ "tool": "exec", "command": "ls -la" }
```

Nền + thăm dò:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Thăm dò dùng để kiểm tra trạng thái theo yêu cầu, không dùng cho các vòng lặp chờ. Nếu tính năng đánh thức khi tự động hoàn tất được bật, lệnh có thể đánh thức phiên khi phát sinh đầu ra hoặc thất bại.

Gửi phím (kiểu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Gửi (chỉ gửi CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Dán (mặc định dùng chế độ có dấu ngoặc):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` là một công cụ con của `exec` dành cho các chỉnh sửa nhiều tệp có cấu trúc. Công cụ này được bật theo mặc định và khả dụng với mọi nhà cung cấp mô hình; `allowModels` có thể hạn chế công cụ. Chỉ sử dụng cấu hình khi bạn muốn tắt công cụ hoặc giới hạn công cụ cho các mô hình cụ thể:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Lưu ý:

- Chính sách công cụ vẫn được áp dụng; `allow: ["write"]` ngầm cho phép `apply_patch`.
- `deny: ["write"]` không từ chối `apply_patch`; hãy từ chối `apply_patch` một cách tường minh hoặc sử dụng `deny: ["group:fs"]` khi thao tác ghi bản vá cũng cần bị chặn.
- Cấu hình nằm trong `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` mặc định là `true`; đặt thành `false` để tắt công cụ.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (giới hạn trong không gian làm việc). Chỉ đặt thành `false` nếu bạn chủ ý muốn `apply_patch` ghi/xóa bên ngoài thư mục không gian làm việc.
- `tools.exec.applyPatch.allowModels` là danh sách cho phép tùy chọn gồm các ID mô hình (dạng thô, như `gpt-5.4`, hoặc dạng đầy đủ, như `openai/gpt-5.4`). Khi được đặt, chỉ các mô hình khớp mới nhận được công cụ; khi không được đặt, mọi mô hình đều nhận được công cụ.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals) — các cổng phê duyệt cho lệnh shell
- [Cơ chế sandbox](/vi/gateway/sandboxing) — chạy lệnh trong môi trường sandbox
- [Tiến trình nền](/vi/gateway/background-process) — công cụ exec và process chạy lâu
- [Bảo mật](/vi/gateway/security) — chính sách công cụ và quyền truy cập nâng cao
