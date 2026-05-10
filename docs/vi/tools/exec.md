---
read_when:
    - Sử dụng hoặc sửa đổi công cụ exec
    - Gỡ lỗi hành vi của stdin hoặc TTY
summary: Cách sử dụng công cụ exec, các chế độ stdin và hỗ trợ TTY
title: Công cụ Exec
x-i18n:
    generated_at: "2026-05-10T19:53:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 445b09c1c6cdc1998c1c2a6b1223fdef438011413d246c4de0de0436465b448f
    source_path: tools/exec.md
    workflow: 16
---

Chạy lệnh shell trong không gian làm việc. `exec` là một bề mặt shell có thể thay đổi trạng thái: lệnh có thể tạo, sửa hoặc xóa tệp ở bất kỳ nơi nào máy chủ hoặc hệ thống tệp sandbox đã chọn cho phép. Việc tắt các công cụ hệ thống tệp của OpenClaw như `write`, `edit`, hoặc `apply_patch` không làm cho `exec` trở thành chỉ đọc.

Hỗ trợ thực thi tiền cảnh + nền thông qua `process`. Nếu `process` không được phép, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
Các phiên nền được giới hạn theo từng tác nhân; `process` chỉ thấy các phiên từ cùng tác nhân.

## Tham số

<ParamField path="command" type="string" required>
Lệnh shell cần chạy.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Thư mục làm việc cho lệnh.
</ParamField>

<ParamField path="env" type="object">
Các ghi đè môi trường dạng khóa/giá trị được hợp nhất lên trên môi trường kế thừa.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Tự động chuyển lệnh sang nền sau độ trễ này (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Đưa lệnh vào nền ngay lập tức thay vì chờ `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Ghi đè thời gian chờ exec đã cấu hình cho lần gọi này. Chỉ đặt `timeout: 0` khi lệnh cần chạy mà không có thời gian chờ tiến trình exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Chạy trong giả terminal khi có sẵn. Dùng cho các CLI chỉ chạy với TTY, tác nhân lập trình và giao diện người dùng terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nơi thực thi. `auto` phân giải thành `sandbox` khi runtime sandbox đang hoạt động và thành `gateway` trong các trường hợp khác.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Chế độ thực thi chính sách cho thực thi `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Hành vi nhắc phê duyệt cho thực thi `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/tên Node khi `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yêu cầu chế độ nâng quyền — thoát khỏi sandbox sang đường dẫn máy chủ đã cấu hình. `security=full` chỉ bị ép buộc khi elevated phân giải thành `full`.
</ParamField>

Ghi chú:

- `host` mặc định là `auto`: sandbox khi runtime sandbox đang hoạt động cho phiên, nếu không thì gateway.
- `host` chỉ chấp nhận `auto`, `sandbox`, `gateway`, hoặc `node`. Nó không phải bộ chọn tên máy chủ; các giá trị giống tên máy chủ sẽ bị từ chối trước khi lệnh chạy.
- `auto` là chiến lược định tuyến mặc định, không phải ký tự đại diện. `host=node` theo từng lần gọi được phép từ `auto`; `host=gateway` theo từng lần gọi chỉ được phép khi không có runtime sandbox nào đang hoạt động.
- Khi không có cấu hình bổ sung, `host=auto` vẫn "cứ thế hoạt động": không có sandbox thì phân giải thành `gateway`; có sandbox đang chạy thì vẫn ở trong sandbox.
- `elevated` thoát khỏi sandbox sang đường dẫn máy chủ đã cấu hình: mặc định là `gateway`, hoặc `node` khi `tools.exec.host=node` (hoặc mặc định phiên là `host=node`). Nó chỉ khả dụng khi quyền truy cập nâng quyền được bật cho phiên/nhà cung cấp hiện tại.
- Các phê duyệt `gateway`/`node` được kiểm soát bởi `~/.openclaw/exec-approvals.json`.
- `node` yêu cầu một Node đã ghép đôi (ứng dụng đồng hành hoặc máy chủ Node không giao diện).
- Nếu có nhiều Node, đặt `exec.node` hoặc `tools.exec.node` để chọn một Node.
- `exec host=node` là đường dẫn thực thi shell duy nhất cho Node; wrapper cũ `nodes.run` đã bị xóa.
- `timeout` áp dụng cho thực thi tiền cảnh, nền, `yieldMs`, gateway, sandbox và `system.run` của Node. Nếu bỏ qua, OpenClaw dùng `tools.exec.timeoutSec`; `timeout: 0` rõ ràng sẽ tắt thời gian chờ tiến trình exec cho lần gọi đó.
- Trên máy chủ không phải Windows, exec dùng `SHELL` khi được đặt; nếu `SHELL` là `fish`, nó ưu tiên `bash` (hoặc `sh`)
  từ `PATH` để tránh các script không tương thích với fish, rồi quay lại `SHELL` nếu không có cái nào tồn tại.
- Trên máy chủ Windows, exec ưu tiên khám phá PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, rồi PATH),
  sau đó quay lại Windows PowerShell 5.1.
- Thực thi trên máy chủ (`gateway`/`node`) từ chối ghi đè `env.PATH` và ghi đè trình nạp (`LD_*`/`DYLD_*`) để
  ngăn chiếm quyền nhị phân hoặc mã bị chèn.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường lệnh được spawn (bao gồm thực thi PTY và sandbox) để các quy tắc shell/profile có thể phát hiện ngữ cảnh công cụ exec.
- `openclaw channels login` bị chặn khỏi `exec` vì đây là luồng xác thực kênh tương tác; hãy chạy nó trong terminal trên máy chủ gateway, hoặc dùng công cụ đăng nhập gốc của kênh từ chat khi có.
- Quan trọng: sandboxing **tắt theo mặc định**. Nếu sandboxing tắt, `host=auto` ngầm định
  phân giải thành `gateway`. `host=sandbox` rõ ràng vẫn thất bại đóng thay vì âm thầm
  chạy trên máy chủ gateway. Bật sandboxing hoặc dùng `host=gateway` với phê duyệt.
- Các kiểm tra trước khi chạy script (cho lỗi cú pháp shell Python/Node phổ biến) chỉ kiểm tra các tệp bên trong
  ranh giới `workdir` hiệu lực. Nếu đường dẫn script phân giải ra ngoài `workdir`, bước kiểm tra trước sẽ bị bỏ qua cho
  tệp đó.
- Với công việc chạy lâu bắt đầu ngay bây giờ, hãy khởi động một lần và dựa vào cơ chế đánh thức
  khi hoàn tất tự động khi nó được bật và lệnh phát ra output hoặc thất bại.
  Dùng `process` cho log, trạng thái, input, hoặc can thiệp; không mô phỏng
  lập lịch bằng vòng lặp sleep, vòng lặp timeout, hoặc polling lặp lại.
- Với công việc cần diễn ra sau hoặc theo lịch, dùng cron thay vì
  các mẫu sleep/delay của `exec`.

## Cấu hình

- `tools.exec.notifyOnExit` (mặc định: true): khi true, các phiên exec chạy nền sẽ xếp hàng một sự kiện hệ thống và yêu cầu Heartbeat khi thoát.
- `tools.exec.approvalRunningNoticeMs` (mặc định: 10000): phát một thông báo "đang chạy" duy nhất khi exec bị chặn bởi phê duyệt chạy lâu hơn mức này (0 để tắt).
- `tools.exec.timeoutSec` (mặc định: 1800): thời gian chờ exec mặc định theo từng lệnh tính bằng giây. `timeout` theo từng lần gọi sẽ ghi đè giá trị này; `timeout: 0` theo từng lần gọi sẽ tắt thời gian chờ tiến trình exec.
- `tools.exec.host` (mặc định: `auto`; phân giải thành `sandbox` khi runtime sandbox đang hoạt động, nếu không thì `gateway`)
- `tools.exec.security` (mặc định: `deny` cho sandbox, `full` cho gateway + node khi chưa đặt)
- `tools.exec.ask` (mặc định: `off`)
- Exec trên máy chủ không cần phê duyệt là mặc định cho gateway + node. Nếu bạn muốn hành vi phê duyệt/allowlist, hãy siết chặt cả `tools.exec.*` và `~/.openclaw/exec-approvals.json` của máy chủ; xem [Phê duyệt exec](/vi/tools/exec-approvals#yolo-mode-no-approval).
- YOLO đến từ mặc định chính sách máy chủ (`security=full`, `ask=off`), không phải từ `host=auto`. Nếu bạn muốn ép định tuyến gateway hoặc node, đặt `tools.exec.host` hoặc dùng `/exec host=...`.
- Trong chế độ `security=full` cộng với `ask=off`, exec trên máy chủ tuân theo trực tiếp chính sách đã cấu hình; không có lớp tiền lọc heuristic bổ sung cho lệnh bị làm rối hoặc lớp từ chối kiểm tra trước script.
- `tools.exec.node` (mặc định: chưa đặt)
- `tools.exec.strictInlineEval` (mặc định: false): khi true, các dạng eval thông dịch viên inline như `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, và `osascript -e` luôn yêu cầu phê duyệt rõ ràng. `allow-always` vẫn có thể lưu lâu dài các lần gọi thông dịch viên/script lành tính, nhưng các dạng inline-eval vẫn nhắc mỗi lần.
- `tools.exec.pathPrepend`: danh sách thư mục để thêm vào đầu `PATH` cho các lần chạy exec (chỉ gateway + sandbox).
- `tools.exec.safeBins`: các nhị phân an toàn chỉ dùng stdin có thể chạy mà không cần mục allowlist rõ ràng. Để biết chi tiết hành vi, xem [Nhị phân an toàn](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: các thư mục rõ ràng bổ sung được tin cậy cho kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ được tự động tin cậy. Mặc định tích hợp là `/bin` và `/usr/bin`.
- `tools.exec.safeBinProfiles`: chính sách argv tùy chỉnh tùy chọn cho từng nhị phân an toàn (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

### Xử lý PATH

- `host=gateway`: hợp nhất `PATH` của login shell vào môi trường exec. Các ghi đè `env.PATH` bị
  từ chối cho thực thi trên máy chủ. Bản thân daemon vẫn chạy với `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: chạy `sh -lc` (login shell) bên trong container, vì vậy `/etc/profile` có thể đặt lại `PATH`.
  OpenClaw thêm `env.PATH` vào đầu sau khi nạp profile thông qua biến môi trường nội bộ (không nội suy shell);
  `tools.exec.pathPrepend` cũng áp dụng ở đây.
- `host=node`: chỉ các ghi đè env không bị chặn mà bạn truyền vào mới được gửi tới Node. Các ghi đè `env.PATH` bị
  từ chối cho thực thi trên máy chủ và bị máy chủ Node bỏ qua. Nếu bạn cần thêm mục PATH trên một Node,
  hãy cấu hình môi trường dịch vụ máy chủ Node (systemd/launchd) hoặc cài đặt công cụ ở vị trí chuẩn.

Liên kết Node theo từng tác nhân (dùng chỉ mục danh sách tác nhân trong cấu hình):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Giao diện điều khiển: tab Nodes bao gồm một bảng nhỏ "Liên kết Node exec" cho cùng các cài đặt.

## Ghi đè phiên (`/exec`)

Dùng `/exec` để đặt mặc định **theo từng phiên** cho `host`, `security`, `ask`, và `node`.
Gửi `/exec` không có đối số để hiển thị các giá trị hiện tại.

Ví dụ:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Mô hình ủy quyền

`/exec` chỉ được tôn trọng cho **người gửi được ủy quyền** (allowlist/ghép đôi kênh cộng với `commands.useAccessGroups`).
Nó chỉ cập nhật **trạng thái phiên** và không ghi cấu hình. Để tắt cứng exec, hãy từ chối nó qua chính sách công cụ
(`tools.deny: ["exec"]` hoặc theo từng tác nhân). Phê duyệt máy chủ vẫn áp dụng trừ khi bạn đặt rõ ràng
`security=full` và `ask=off`.

## Phê duyệt exec (ứng dụng đồng hành / máy chủ Node)

Các tác nhân trong sandbox có thể yêu cầu phê duyệt theo từng yêu cầu trước khi `exec` chạy trên máy chủ gateway hoặc Node.
Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết chính sách, allowlist và luồng giao diện người dùng.

Khi cần phê duyệt, công cụ exec trả về ngay lập tức với
`status: "approval-pending"` và một ID phê duyệt. Sau khi được phê duyệt (hoặc bị từ chối / hết thời gian),
Gateway phát sự kiện hệ thống (`Exec finished` / `Exec denied`). Nếu lệnh vẫn
đang chạy sau `tools.exec.approvalRunningNoticeMs`, một thông báo `Exec running` duy nhất sẽ được phát.
Trên các kênh có thẻ/nút phê duyệt gốc, tác nhân nên dựa vào
giao diện người dùng gốc đó trước và chỉ bao gồm lệnh `/approve` thủ công khi kết quả công cụ
nói rõ rằng phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là
đường dẫn duy nhất.

## Allowlist + nhị phân an toàn

Thực thi allowlist thủ công khớp với các glob đường dẫn nhị phân đã phân giải và glob tên lệnh trần.
Tên trần chỉ khớp với lệnh được gọi thông qua PATH, vì vậy `rg` có thể khớp với
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng không khớp với `./rg` hoặc `/tmp/rg`.
Khi `security=allowlist`, lệnh shell chỉ được tự động cho phép nếu mọi phân đoạn pipeline
đều nằm trong allowlist hoặc là nhị phân an toàn. Chuỗi lệnh (`;`, `&&`, `||`) và chuyển hướng
bị từ chối trong chế độ allowlist trừ khi mọi phân đoạn cấp cao nhất thỏa mãn
allowlist (bao gồm nhị phân an toàn). Chuyển hướng vẫn chưa được hỗ trợ.
Tin cậy lâu dài `allow-always` không vượt qua quy tắc đó: một chuỗi lệnh vẫn yêu cầu mọi
phân đoạn cấp cao nhất khớp.

`autoAllowSkills` là một đường dẫn tiện lợi riêng trong phê duyệt exec. Nó không giống với
các mục allowlist đường dẫn thủ công. Để có tin cậy rõ ràng nghiêm ngặt, hãy giữ `autoAllowSkills` bị tắt.

Dùng hai điều khiển cho các công việc khác nhau:

- `tools.exec.safeBins`: các bộ lọc luồng nhỏ, chỉ dùng stdin.
- `tools.exec.safeBinTrustedDirs`: các thư mục tin cậy bổ sung rõ ràng cho đường dẫn thực thi nhị phân an toàn.
- `tools.exec.safeBinProfiles`: chính sách argv rõ ràng cho nhị phân an toàn tùy chỉnh.
- allowlist: tin cậy rõ ràng cho đường dẫn thực thi.

Không xem `safeBins` là danh sách cho phép chung, và không thêm các binary trình thông dịch/runtime (ví dụ `python3`, `node`, `ruby`, `bash`). Nếu bạn cần những binary đó, hãy dùng các mục danh sách cho phép tường minh và luôn bật lời nhắc phê duyệt.
`openclaw security audit` cảnh báo khi các mục `safeBins` của trình thông dịch/runtime thiếu hồ sơ tường minh, và `openclaw doctor --fix` có thể dựng khung cho các mục `safeBinProfiles` tùy chỉnh còn thiếu.
`openclaw security audit` và `openclaw doctor` cũng cảnh báo khi bạn thêm tường minh các binary có hành vi rộng như `jq` trở lại `safeBins`.
Nếu bạn đưa trình thông dịch vào danh sách cho phép một cách tường minh, hãy bật `tools.exec.strictInlineEval` để các dạng đánh giá mã nội tuyến vẫn yêu cầu phê duyệt mới.

Để xem đầy đủ chi tiết chính sách và ví dụ, hãy xem [Phê duyệt exec](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only) và [Safe bins so với danh sách cho phép](/vi/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ví dụ

Chạy ở foreground:

```json
{ "tool": "exec", "command": "ls -la" }
```

Chạy nền + thăm dò:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Thăm dò dùng để xem trạng thái theo yêu cầu, không phải cho các vòng lặp chờ. Nếu đánh thức khi hoàn tất tự động
được bật, lệnh có thể đánh thức phiên khi phát ra đầu ra hoặc thất bại.

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

Dán (mặc định có bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` là một subtool của `exec` cho các chỉnh sửa nhiều tệp có cấu trúc.
Nó được bật theo mặc định cho các mô hình OpenAI và OpenAI Codex. Chỉ dùng cấu hình
khi bạn muốn tắt nó hoặc giới hạn nó ở các mô hình cụ thể:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Ghi chú:

- Chỉ khả dụng cho các mô hình OpenAI/OpenAI Codex.
- Chính sách công cụ vẫn áp dụng; `allow: ["write"]` ngầm cho phép `apply_patch`.
- `deny: ["write"]` không từ chối `apply_patch`; hãy từ chối `apply_patch` một cách tường minh hoặc dùng `deny: ["group:fs"]` khi các thao tác ghi bản vá cũng cần bị chặn.
- Cấu hình nằm dưới `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` mặc định là `true`; đặt thành `false` để tắt công cụ cho các mô hình OpenAI.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (nằm trong workspace). Chỉ đặt thành `false` nếu bạn chủ ý muốn `apply_patch` ghi/xóa bên ngoài thư mục workspace.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals) — các cổng phê duyệt cho lệnh shell
- [Sandboxing](/vi/gateway/sandboxing) — chạy lệnh trong môi trường sandbox
- [Tiến trình nền](/vi/gateway/background-process) — exec chạy lâu và công cụ process
- [Bảo mật](/vi/gateway/security) — chính sách công cụ và quyền truy cập nâng cao
