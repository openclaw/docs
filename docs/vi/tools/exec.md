---
read_when:
    - Sử dụng hoặc sửa đổi công cụ exec
    - Gỡ lỗi hành vi của stdin hoặc TTY
summary: Cách sử dụng công cụ exec, các chế độ stdin và hỗ trợ TTY
title: Công cụ thực thi
x-i18n:
    generated_at: "2026-07-16T15:52:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Chạy các lệnh shell trong không gian làm việc. `exec` là một bề mặt shell có khả năng thay đổi: các lệnh có thể tạo, chỉnh sửa hoặc xóa tệp ở bất kỳ vị trí nào mà hệ thống tệp của máy chủ hoặc sandbox đã chọn cho phép. Việc vô hiệu hóa các công cụ hệ thống tệp của OpenClaw như `write`, `edit` hoặc `apply_patch` không làm cho `exec` trở thành chỉ đọc.

Hỗ trợ thực thi ở tiền cảnh và nền thông qua `process`. Nếu `process` không được phép, `exec` sẽ chạy đồng bộ và bỏ qua `yieldMs`/`background`. Các phiên nền được giới hạn theo từng agent; `process` chỉ thấy các phiên từ cùng agent.

## Tham số

<ParamField path="command" type="string" required>
Lệnh shell cần chạy.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Thư mục làm việc cho lệnh.
</ParamField>

<ParamField path="env" type="object">
Các giá trị ghi đè môi trường theo cặp khóa/giá trị được hợp nhất lên trên môi trường kế thừa.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Tự động chuyển lệnh sang chạy nền sau khoảng trì hoãn này (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Chuyển lệnh sang chạy nền ngay lập tức thay vì chờ `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Ghi đè thời gian chờ thực thi đã cấu hình cho lần gọi này, tính bằng giây. Áp dụng cho việc thực thi ở tiền cảnh, nền, `yieldMs`, Gateway, sandbox và Node `system.run`. `timeout: 0` vô hiệu hóa thời gian chờ của tiến trình thực thi cho lần gọi đó.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Chạy trong giả thiết bị đầu cuối khi khả dụng. Sử dụng cho các CLI chỉ hỗ trợ TTY, tác nhân lập trình và giao diện người dùng đầu cuối.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nơi thực thi. `auto` được phân giải thành `sandbox` khi môi trường chạy sandbox đang hoạt động và thành `gateway` trong trường hợp ngược lại.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Bị bỏ qua đối với các lệnh gọi công cụ thông thường. Bảo mật `gateway`/`node` được kiểm soát bởi `tools.exec.security` và tệp phê duyệt của máy chủ; chế độ nâng cao chỉ có thể buộc sử dụng `security=full` khi người vận hành cấp quyền truy cập nâng cao một cách rõ ràng.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Chế độ yêu cầu xác nhận cơ sở lấy từ `tools.exec.ask` và các phê duyệt của máy chủ. Đối với các lệnh gọi mô hình bắt nguồn từ kênh, `ask` theo từng lệnh gọi bị bỏ qua khi chế độ yêu cầu xác nhận hiệu lực của máy chủ là `off`; nếu không, nó chỉ có thể được tăng cường thành một chế độ nghiêm ngặt hơn. Các trình gọi nội bộ/API đáng tin cậy tạo công cụ thực thi với giá trị `ask` rõ ràng không thay đổi.
</ParamField>

<ParamField path="node" type="string">
Id/tên Node khi `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yêu cầu chế độ nâng cao: thoát khỏi sandbox sang đường dẫn máy chủ đã cấu hình. `security=full` chỉ bị buộc sử dụng khi chế độ nâng cao được phân giải thành `full`.
</ParamField>

Lưu ý:

- `host` chỉ chấp nhận `auto`, `sandbox`, `gateway` hoặc `node`. Đây không phải là bộ chọn tên máy chủ; các giá trị giống tên máy chủ bị từ chối trước khi lệnh chạy.
- `host=node` theo từng lệnh gọi được phép từ `auto`; `host=gateway` theo từng lệnh gọi chỉ được phép khi không có môi trường chạy sandbox nào đang hoạt động.
- Khi không có cấu hình bổ sung, `host=auto` vẫn "hoạt động ngay": không có sandbox nghĩa là nó được phân giải thành `gateway`; khi có sandbox đang hoạt động, nó vẫn ở trong sandbox.
- `elevated` thoát khỏi sandbox sang đường dẫn máy chủ đã cấu hình: mặc định là `gateway`, hoặc `node` khi `tools.exec.host=node` (hoặc giá trị mặc định của phiên là `host=node`). Tùy chọn này chỉ khả dụng khi quyền truy cập nâng cao được bật cho phiên/nhà cung cấp hiện tại.
- Các phê duyệt `gateway`/`node` được kiểm soát bởi tệp phê duyệt của máy chủ.
- `node` yêu cầu một Node đã ghép nối (ứng dụng đồng hành hoặc máy chủ Node không giao diện). Nếu có nhiều Node, hãy đặt `exec.node` hoặc `tools.exec.node` để chọn một Node.
- `exec host=node` là đường dẫn thực thi shell duy nhất cho các Node; trình bao bọc `nodes.run` cũ đã bị loại bỏ.
- Trên các máy chủ không chạy Windows, exec sử dụng `SHELL` khi được đặt; nếu `SHELL` là `fish`, exec ưu tiên `bash` (hoặc `sh`) từ `PATH` để tránh cú pháp bash không tương thích với fish, rồi chuyển dự phòng sang `SHELL` nếu không có tùy chọn nào tồn tại.
- Trên các máy chủ Windows, exec ưu tiên phát hiện PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, sau đó là PATH), rồi chuyển dự phòng sang Windows PowerShell 5.1.
- Trên các máy chủ Gateway không chạy Windows, các lệnh exec của bash và zsh sử dụng một bản chụp nhanh khởi động. OpenClaw thu thập các bí danh/hàm có thể nạp bằng lệnh source và một tập hợp nhỏ các biến môi trường an toàn từ các tệp khởi động shell vào `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, rồi nạp bản chụp nhanh đó bằng lệnh source trước mỗi lệnh exec. Các biến có vẻ chứa thông tin bí mật bị loại trừ; exec trong sandbox và Node không sử dụng bản chụp nhanh này. Đặt `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` trong môi trường tiến trình Gateway để tắt đường dẫn bản chụp nhanh này.
- Thực thi trên máy chủ (`gateway`/`node`) từ chối `env.PATH` và các ghi đè trình nạp (`LD_*`/`DYLD_*`) để ngăn việc chiếm quyền điều khiển tệp nhị phân hoặc chèn mã.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường của lệnh được sinh ra (bao gồm cả thực thi PTY và sandbox) để các quy tắc shell/hồ sơ có thể phát hiện ngữ cảnh của công cụ exec.
- Đối với các lần chạy bắt nguồn từ kênh, OpenClaw cũng cung cấp một tải trọng JSON hẹp về danh tính người gửi/cuộc trò chuyện trong `OPENCLAW_CHANNEL_CONTEXT` khi kênh cung cấp các id đó.
- `exec` không thể chạy các lệnh shell `openclaw channels login` hoặc `/approve`: `openclaw channels login` là luồng xác thực kênh tương tác, còn `/approve` cần đi qua trình xử lý lệnh phê duyệt chứ không phải shell. Chạy đăng nhập kênh trong một thiết bị đầu cuối trên máy chủ Gateway hoặc sử dụng công cụ tác nhân đăng nhập dành riêng cho kênh khi có sẵn (ví dụ: `whatsapp_login`).
- Quan trọng: sandbox **bị tắt theo mặc định**. Nếu sandbox bị tắt, `host=auto` ngầm định được phân giải thành `gateway`. `host=sandbox` rõ ràng vẫn từ chối an toàn thay vì âm thầm chạy trên máy chủ Gateway. Hãy bật sandbox hoặc sử dụng `host=gateway` với các phê duyệt.
- Các bước kiểm tra trước khi chạy tập lệnh (đối với các lỗi cú pháp shell Python/Node thường gặp) chỉ kiểm tra các tệp bên trong ranh giới `workdir` hiệu lực. Nếu đường dẫn tập lệnh được phân giải ra ngoài `workdir`, bước kiểm tra trước khi chạy sẽ bị bỏ qua đối với tệp đó. Bước kiểm tra trước khi chạy cũng bị bỏ qua hoàn toàn khi `host=gateway` và chính sách hiệu lực là `security=full` với `ask=off`.
- Đối với công việc chạy dài bắt đầu ngay bây giờ, hãy khởi động một lần và dựa vào cơ chế đánh thức tự động khi hoàn tất nếu cơ chế này được bật và lệnh tạo đầu ra hoặc thất bại. Sử dụng `process` cho nhật ký, trạng thái, đầu vào hoặc can thiệp; không mô phỏng việc lập lịch bằng vòng lặp sleep, vòng lặp hết thời gian chờ hoặc thăm dò lặp lại.
- Đối với công việc cần diễn ra sau hoặc theo lịch, hãy sử dụng cron thay vì các mẫu sleep/trì hoãn `exec`.

## Cấu hình

| Khóa                                  | Mặc định                                                | Ghi chú                                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Thời gian chờ thực thi mặc định cho mỗi lệnh, tính bằng giây. `timeout` của từng lần gọi sẽ ghi đè giá trị này; `timeout: 0` của từng lần gọi sẽ vô hiệu hóa thời gian chờ của tiến trình thực thi.                  |
| `tools.exec.host`                    | `auto`                                                 | Được phân giải thành `sandbox` khi môi trường chạy sandbox đang hoạt động, nếu không thì thành `gateway`.                                                                            |
| `tools.exec.security`                | `deny` cho sandbox, `full` cho gateway/node khi chưa đặt |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | chưa đặt                                                  | Núm điều khiển chính sách đã chuẩn hóa. Xem [Chế độ](#modes) bên dưới. Không thể kết hợp với `tools.exec.security`/`tools.exec.ask`.                                      |
| `tools.exec.reviewer.model`          | mô hình chính của tác tử đã cấu hình                               | Giá trị ghi đè nhà cung cấp/mô hình tùy chọn cho quy trình đánh giá `mode=auto`.                                                                                                |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Thời gian chờ cho mỗi giai đoạn chuẩn bị và hoàn tất của mô hình đánh giá trước khi chuyển sang con người.                                                                  |
| `tools.exec.node`                    | chưa đặt                                                  |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Khi là true, các phiên thực thi chạy nền sẽ xếp một sự kiện hệ thống vào hàng đợi và yêu cầu Heartbeat khi thoát.                                                           |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Phát một thông báo "đang chạy" duy nhất khi một tác vụ thực thi bị kiểm soát bằng phê duyệt chạy lâu hơn khoảng thời gian này (`0` sẽ vô hiệu hóa).                                                        |
| `tools.exec.strictInlineEval`        | `false`                                                | Xem [Đánh giá nội tuyến](#inline-eval-strictinlineeval).                                                                                                       |
| `tools.exec.commandHighlighting`     | `false`                                                | Khi là true, lời nhắc phê duyệt có thể làm nổi bật các đoạn lệnh do bộ phân tích cú pháp suy ra trong văn bản lệnh. Có thể đặt trên toàn hệ thống hoặc cho từng tác tử; không thay đổi chính sách phê duyệt. |
| `tools.exec.pathPrepend`             | chưa đặt                                                  | Danh sách thư mục cần thêm vào đầu `PATH` cho các lần thực thi (chỉ gateway + sandbox).                                                                        |
| `tools.exec.safeBins`                | chưa đặt                                                  | Các tệp nhị phân an toàn chỉ nhận stdin có thể chạy mà không cần mục riêng trong danh sách cho phép. Xem [Tệp nhị phân an toàn](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only).         |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Các thư mục bổ sung được tin cậy rõ ràng cho việc kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ được tự động tin cậy.                                              |
| `tools.exec.safeBinProfiles`         | chưa đặt                                                  | Chính sách argv tùy chỉnh không bắt buộc cho từng tệp nhị phân an toàn (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                                        |

Thực thi trên máy chủ không cần phê duyệt là mặc định cho gateway và node (`security=full`, `ask=off`) — thiết lập này bắt nguồn từ các giá trị mặc định của chính sách máy chủ, không phải từ `host=auto`. Nếu muốn có hành vi phê duyệt/danh sách cho phép, hãy siết chặt cả `tools.exec.*` lẫn tệp phê duyệt của máy chủ; xem [Phê duyệt thực thi](/vi/tools/exec-approvals#yolo-mode-no-approval). Để buộc định tuyến qua gateway hoặc node bất kể trạng thái sandbox, hãy đặt `tools.exec.host` hoặc sử dụng `/exec host=...`.

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

`tools.exec.mode` là núm điều khiển chính sách đã chuẩn hóa. Việc đặt giá trị này sẽ suy ra `security`/`ask` và không thể kết hợp với `tools.exec.security`/`tools.exec.ask` được chỉ định rõ ràng.

| Chế độ        | bảo mật    | hỏi       | Hành vi                                                                                                                       |
| ----------- | ----------- | --------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `deny`      | `deny`      | `off`     | Tác vụ thực thi bị từ chối.                                                                                                                |
| `allowlist` | `allowlist` | `off`     | Chỉ các lệnh trong danh sách cho phép/lệnh thuộc tệp nhị phân an toàn mới chạy; không hỏi về bất kỳ lệnh nào khác.                                                                 |
| `ask`       | `allowlist` | `on-miss` | Các lệnh khớp danh sách cho phép chạy trực tiếp; mọi lệnh khác đều hỏi con người.                                                                  |
| `auto`      | `allowlist` | `on-miss` | Các lệnh khớp danh sách cho phép/tệp nhị phân an toàn chạy trực tiếp; mọi lệnh khác được chuyển qua trình tự động đánh giá gốc của OpenClaw trước khi hỏi con người. |
| `full`      | `full`      | `off`     | Không có cổng phê duyệt.                                                                                                              |

`ask`/`ask=always` vẫn luôn hỏi con người bất kể chế độ.

Phê duyệt bằng đánh giá tự động chỉ dùng một lần. Trên gateway, OpenClaw cung cấp đường dẫn tệp thực thi đã phân giải cho trình đánh giá và ghim việc thực thi vào chính đường dẫn đó. Các lệnh không thể rút gọn thành một kế hoạch thực thi duy nhất có thể cưỡng chế—chẳng hạn như heredoc, phép mở rộng shell hoặc cách đặt dấu ngoặc kép cho wrapper không được hỗ trợ—sẽ chuyển sang phê duyệt của con người ngay cả khi mô hình lẽ ra sẽ cho phép chúng.

Các yêu cầu phê duyệt lệnh của Codex app-server chưa được quyết định bởi chính sách rõ ràng của môi trường chạy hoặc chính sách gốc sẽ sử dụng quy trình phê duyệt của con người. OpenClaw không chạy trình đánh giá tác vụ thực thi đã cấu hình cho các yêu cầu này vì Codex không cung cấp tệp thực thi đã phân giải có thể cưỡng chế để ràng buộc quyết định đánh giá với lệnh mà Codex chạy.

### Đánh giá nội tuyến (`strictInlineEval`)

Khi `tools.exec.strictInlineEval` là `true`, các dạng đánh giá nội tuyến của trình thông dịch yêu cầu trình đánh giá hoặc phê duyệt rõ ràng: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e`, cùng các dạng tương tự trên những trình thông dịch và phương tiện mang lệnh được hỗ trợ khác (`awk`, `find -exec`, `make`, `sed`, `xargs`, v.v.). Trong `mode=auto`, quy trình phê duyệt thực thi thông thường có thể cho phép trình tự động đánh giá gốc chấp thuận một lệnh dùng một lần có mức rủi ro thấp rõ ràng; các lệnh gọi `system.run` trực tiếp trên máy chủ node vẫn yêu cầu phê duyệt rõ ràng vì chúng không thể chuyển lệnh đến quy trình phê duyệt của con người. Nếu trình đánh giá yêu cầu, yêu cầu sẽ được chuyển đến con người. `allow-always` vẫn có thể lưu các lệnh gọi trình thông dịch/tập lệnh lành tính, nhưng các dạng đánh giá nội tuyến không trở thành quy tắc cho phép lâu dài.

### Xử lý PATH

- `host=gateway`: hợp nhất `PATH` của shell đăng nhập vào môi trường thực thi. Các giá trị ghi đè `env.PATH` bị từ chối khi thực thi trên máy chủ. Bản thân daemon vẫn chạy với `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Để ngăn cấu hình shell của người dùng (như `~/.zshenv` hoặc `/etc/zshenv`) ghi đè các đường dẫn ưu tiên trong khi khởi động, các mục `tools.exec.pathPrepend` được thêm an toàn vào đầu `PATH` cuối cùng bên trong lệnh shell ngay trước khi thực thi.
- `host=sandbox`: chạy `sh -lc` (shell đăng nhập) bên trong bộ chứa, vì vậy `/etc/profile` có thể đặt lại `PATH`. OpenClaw thêm `env.PATH` vào đầu sau khi nạp hồ sơ thông qua một biến môi trường nội bộ (không có phép nội suy shell); `tools.exec.pathPrepend` cũng áp dụng tại đây.
- `host=node`: chỉ các giá trị ghi đè môi trường không bị chặn mà bạn truyền vào mới được gửi đến node. Các giá trị ghi đè `env.PATH` bị từ chối khi thực thi trên máy chủ và bị máy chủ node bỏ qua. Nếu cần thêm các mục PATH trên node, hãy cấu hình môi trường dịch vụ của máy chủ node (systemd/launchd) hoặc cài đặt công cụ tại các vị trí tiêu chuẩn.

Liên kết node cho từng tác tử (sử dụng chỉ mục danh sách tác tử trong cấu hình):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Giao diện điều khiển: trang **Thiết bị** có một bảng nhỏ "Liên kết node thực thi" dành cho cùng các thiết lập này.

## Giá trị ghi đè phiên (`/exec`)

Sử dụng `/exec` để đặt giá trị mặc định **theo từng phiên** cho `host`, `security`, `ask` và `node`. Gửi `/exec` không kèm đối số để hiển thị các giá trị hiện tại.

Ví dụ:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` chỉ được chấp nhận đối với **người gửi được ủy quyền** (danh sách cho phép/ghép nối của kênh cùng với `commands.useAccessGroups`). Lệnh này chỉ cập nhật **trạng thái phiên** và không ghi cấu hình. Người gửi được ủy quyền từ kênh bên ngoài có thể đặt các giá trị mặc định của phiên này. Các máy khách gateway/webchat nội bộ cần `operator.admin` để duy trì chúng.

Để vô hiệu hóa hoàn toàn tác vụ thực thi, hãy từ chối nó thông qua chính sách công cụ (`tools.deny: ["exec"]` hoặc theo từng tác tử). Các phê duyệt của máy chủ vẫn áp dụng trừ khi bạn đặt rõ ràng `security=full` và `ask=off`.

## Phê duyệt thực thi (ứng dụng đồng hành / máy chủ node)

Các tác tử trong sandbox có thể yêu cầu phê duyệt theo từng yêu cầu trước khi `exec` chạy trên gateway hoặc máy chủ node. Xem [Phê duyệt thực thi](/vi/tools/exec-approvals) để biết chính sách, danh sách cho phép và quy trình giao diện người dùng.

Khi cần phê duyệt của con người, các luồng máy chủ node và gateway không phải gốc sẽ trả về ngay lập tức với `status: "approval-pending"` và một mã phê duyệt. Thay vào đó, các luồng trò chuyện gốc và gateway của giao diện Web có thể chờ nội tuyến rồi trả về kết quả lệnh cuối cùng sau khi được phê duyệt. Kết quả `approval-pending` có nghĩa là lệnh chưa khởi chạy, vì vậy cảnh báo chuyển sang phương án dự phòng ở tiền cảnh chỉ xuất hiện nếu lệnh đã phê duyệt thực sự chạy nội tuyến. Các lần chạy bất đồng bộ đã được phê duyệt sẽ phát sự kiện hệ thống về tiến trình và hoàn tất lệnh (`Exec running` / `Exec finished`); các phê duyệt bị từ chối hoặc hết thời gian chờ là trạng thái kết thúc và không đánh thức phiên tác tử bằng sự kiện hệ thống thông báo từ chối.

Trên các kênh có thẻ/nút phê duyệt gốc, tác nhân nên ưu tiên dựa vào giao diện người dùng gốc đó và chỉ đưa vào lệnh `/approve` thủ công khi kết quả công cụ nêu rõ rằng phê duyệt qua trò chuyện không khả dụng hoặc phê duyệt thủ công là con đường duy nhất.

## Danh sách cho phép + các tệp nhị phân an toàn

Việc thực thi danh sách cho phép thủ công đối sánh các mẫu glob của đường dẫn tệp nhị phân đã phân giải và các mẫu glob chỉ chứa tên lệnh. Tên đơn thuần chỉ khớp với các lệnh được gọi thông qua PATH, vì vậy `rg` có thể khớp với `/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng không khớp với `./rg` hoặc `/tmp/rg`.

Khi `security=allowlist`, các lệnh shell chỉ được tự động cho phép nếu mọi phân đoạn pipeline đều có trong danh sách cho phép hoặc là tệp nhị phân an toàn. Việc nối chuỗi (`;`, `&&`, `||`) và chuyển hướng bị từ chối trong chế độ danh sách cho phép, trừ khi mọi phân đoạn cấp cao nhất đều đáp ứng danh sách cho phép (bao gồm cả các tệp nhị phân an toàn). Chuyển hướng vẫn không được hỗ trợ. Mức tin cậy `allow-always` lâu dài không bỏ qua quy tắc đó: một lệnh nối chuỗi vẫn yêu cầu mọi phân đoạn cấp cao nhất phải khớp.

`autoAllowSkills` là một cơ chế tiện lợi riêng biệt trong phê duyệt exec, không giống với các mục danh sách cho phép đường dẫn thủ công. Để áp dụng mức tin cậy rõ ràng và nghiêm ngặt, hãy giữ `autoAllowSkills` ở trạng thái tắt.

Sử dụng các chế độ kiểm soát sau cho những mục đích khác nhau:

- `tools.exec.safeBins`: các bộ lọc luồng nhỏ, chỉ dùng stdin.
- `tools.exec.safeBinTrustedDirs`: các thư mục tin cậy bổ sung được chỉ định rõ ràng cho đường dẫn tệp thực thi của tệp nhị phân an toàn.
- `tools.exec.safeBinProfiles`: chính sách argv rõ ràng cho các tệp nhị phân an toàn tùy chỉnh.
- allowlist: mức tin cậy rõ ràng cho các đường dẫn tệp thực thi.

Không coi `safeBins` là một danh sách cho phép chung và không thêm các tệp nhị phân của trình thông dịch/môi trường chạy (ví dụ: `python3`, `node`, `ruby`, `bash`). Nếu cần những tệp này, hãy sử dụng các mục danh sách cho phép rõ ràng và duy trì bật lời nhắc phê duyệt.

`openclaw security audit` cảnh báo khi các mục `safeBins` của trình thông dịch/môi trường chạy thiếu hồ sơ rõ ràng, còn `openclaw doctor --fix` có thể tạo khung cho các mục `safeBinProfiles` tùy chỉnh còn thiếu. `openclaw security audit` và `openclaw doctor` cũng cảnh báo khi bạn thêm lại một cách rõ ràng các tệp nhị phân có hành vi rộng như `jq` vào `safeBins` (`jq` có thể đọc dữ liệu môi trường và nạp mã jq từ các mô-đun hoặc tệp khởi động, vì vậy thay vào đó nên ưu tiên các mục danh sách cho phép rõ ràng hoặc các lần chạy có cổng phê duyệt). `jq` bị từ chối với tư cách là tệp nhị phân an toàn ngay cả khi được liệt kê rõ ràng. Nếu bạn đưa trình thông dịch vào danh sách cho phép một cách rõ ràng, hãy bật `tools.exec.strictInlineEval` để các dạng đánh giá mã nội tuyến vẫn yêu cầu người đánh giá hoặc phê duyệt rõ ràng.

Để biết đầy đủ chi tiết chính sách và ví dụ, hãy xem [Phê duyệt exec](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only) và [Tệp nhị phân an toàn so với danh sách cho phép](/vi/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ví dụ

Chạy tiền cảnh:

```json
{ "tool": "exec", "command": "ls -la" }
```

Chạy nền + thăm dò:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Thăm dò dùng để kiểm tra trạng thái theo yêu cầu, không dùng cho các vòng lặp chờ. Nếu tính năng đánh thức khi tự động hoàn tất được bật, lệnh có thể đánh thức phiên khi phát ra đầu ra hoặc thất bại.

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

Dán (mặc định có dấu ngoặc bao quanh):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` là một công cụ con của `exec` dành cho các chỉnh sửa nhiều tệp có cấu trúc. Công cụ này được bật theo mặc định và khả dụng cho mọi nhà cung cấp mô hình; `allowModels` có thể hạn chế công cụ này. Chỉ sử dụng cấu hình khi bạn muốn tắt công cụ hoặc giới hạn công cụ cho các mô hình cụ thể:

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
- `deny: ["write"]` không từ chối `apply_patch`; hãy từ chối rõ ràng `apply_patch` hoặc sử dụng `deny: ["group:fs"]` khi việc ghi bản vá cũng cần bị chặn.
- Cấu hình nằm trong `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` mặc định là `true`; đặt thành `false` để tắt công cụ.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (nằm trong không gian làm việc). Chỉ đặt thành `false` nếu bạn cố ý muốn `apply_patch` ghi/xóa bên ngoài thư mục không gian làm việc.
- `tools.exec.applyPatch.allowModels` là danh sách cho phép tùy chọn gồm các ID mô hình (dạng thô, như `gpt-5.4`, hoặc dạng đầy đủ, như `openai/gpt-5.4`). Khi được đặt, chỉ các mô hình khớp mới nhận được công cụ; khi không được đặt, mọi mô hình đều nhận được công cụ.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals) — các cổng phê duyệt cho lệnh shell
- [Cô lập](/vi/gateway/sandboxing) — chạy lệnh trong các môi trường cô lập
- [Tiến trình nền](/vi/gateway/background-process) — công cụ exec và process chạy dài hạn
- [Bảo mật](/vi/gateway/security) — chính sách công cụ và quyền truy cập nâng cao
