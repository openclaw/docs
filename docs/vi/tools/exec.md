---
read_when:
    - Sử dụng hoặc sửa đổi công cụ exec
    - Gỡ lỗi hành vi stdin hoặc TTY
summary: Cách sử dụng công cụ exec, các chế độ stdin và hỗ trợ TTY
title: Công cụ Exec
x-i18n:
    generated_at: "2026-04-29T23:18:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

Chạy các lệnh shell trong workspace. Hỗ trợ thực thi foreground + background thông qua `process`.
Nếu `process` không được cho phép, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
Các phiên background được giới hạn theo từng agent; `process` chỉ thấy các phiên từ cùng agent.

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
Tự động đưa lệnh vào background sau khoảng trễ này (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Đưa lệnh vào background ngay lập tức thay vì chờ `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Ghi đè thời gian chờ exec đã cấu hình cho lần gọi này. Chỉ đặt `timeout: 0` khi lệnh nên chạy mà không có thời gian chờ của tiến trình exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Chạy trong pseudo-terminal khi có sẵn. Dùng cho các CLI chỉ hỗ trợ TTY, agent lập trình và giao diện terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nơi thực thi. `auto` được phân giải thành `sandbox` khi runtime sandbox đang hoạt động và thành `gateway` trong các trường hợp khác.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Chế độ thực thi bắt buộc cho việc thực thi `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Hành vi nhắc phê duyệt cho việc thực thi `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/tên Node khi `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yêu cầu chế độ nâng quyền — thoát khỏi sandbox đến đường dẫn host đã cấu hình. `security=full` chỉ bị bắt buộc khi elevated được phân giải thành `full`.
</ParamField>

Ghi chú:

- `host` mặc định là `auto`: sandbox khi runtime sandbox đang hoạt động cho phiên, nếu không thì Gateway.
- `host` chỉ chấp nhận `auto`, `sandbox`, `gateway` hoặc `node`. Đây không phải bộ chọn hostname; các giá trị giống hostname bị từ chối trước khi lệnh chạy.
- `auto` là chiến lược định tuyến mặc định, không phải wildcard. `host=node` theo từng lần gọi được phép từ `auto`; `host=gateway` theo từng lần gọi chỉ được phép khi không có runtime sandbox đang hoạt động.
- Không cần cấu hình bổ sung, `host=auto` vẫn "just works": không có sandbox thì nó phân giải thành `gateway`; có sandbox đang chạy thì nó ở lại trong sandbox.
- `elevated` thoát khỏi sandbox đến đường dẫn host đã cấu hình: mặc định là `gateway`, hoặc `node` khi `tools.exec.host=node` (hoặc mặc định phiên là `host=node`). Tính năng này chỉ có sẵn khi quyền truy cập elevated được bật cho phiên/provider hiện tại.
- Phê duyệt `gateway`/`node` được điều khiển bởi `~/.openclaw/exec-approvals.json`.
- `node` yêu cầu một Node đã ghép đôi (ứng dụng companion hoặc host Node headless).
- Nếu có nhiều Node, đặt `exec.node` hoặc `tools.exec.node` để chọn một Node.
- `exec host=node` là đường dẫn thực thi shell duy nhất cho Node; wrapper cũ `nodes.run` đã bị xóa.
- `timeout` áp dụng cho foreground, background, `yieldMs`, Gateway, sandbox và thực thi `system.run` trên Node. Nếu bỏ qua, OpenClaw dùng `tools.exec.timeoutSec`; đặt rõ `timeout: 0` sẽ tắt thời gian chờ tiến trình exec cho lần gọi đó.
- Trên các host không phải Windows, exec dùng `SHELL` khi được đặt; nếu `SHELL` là `fish`, nó ưu tiên `bash` (hoặc `sh`)
  từ `PATH` để tránh các script không tương thích với fish, rồi mới fallback về `SHELL` nếu không có cái nào.
- Trên host Windows, exec ưu tiên tìm PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, rồi PATH),
  sau đó fallback về Windows PowerShell 5.1.
- Thực thi host (`gateway`/`node`) từ chối `env.PATH` và các ghi đè loader (`LD_*`/`DYLD_*`) để
  ngăn chiếm quyền binary hoặc chèn mã.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường lệnh được spawn (bao gồm thực thi PTY và sandbox) để các quy tắc shell/profile có thể phát hiện ngữ cảnh công cụ exec.
- `openclaw channels login` bị chặn khỏi `exec` vì đây là luồng xác thực kênh tương tác; hãy chạy trong terminal trên host Gateway, hoặc dùng công cụ đăng nhập gốc của kênh từ chat khi có.
- Quan trọng: sandboxing **tắt theo mặc định**. Nếu sandboxing tắt, `host=auto` ngầm định
  phân giải thành `gateway`. `host=sandbox` tường minh vẫn fail closed thay vì âm thầm
  chạy trên host Gateway. Bật sandboxing hoặc dùng `host=gateway` với phê duyệt.
- Các kiểm tra preflight của script (cho các lỗi cú pháp shell Python/Node phổ biến) chỉ kiểm tra những tệp nằm trong
  ranh giới `workdir` hiệu lực. Nếu đường dẫn script phân giải ra ngoài `workdir`, preflight sẽ bị bỏ qua cho
  tệp đó.
- Với công việc chạy lâu bắt đầu ngay bây giờ, hãy khởi động nó một lần và dựa vào đánh thức
  hoàn tất tự động khi tính năng này được bật và lệnh phát ra output hoặc thất bại.
  Dùng `process` cho log, trạng thái, input hoặc can thiệp; không mô phỏng
  lập lịch bằng vòng lặp sleep, vòng lặp timeout hoặc polling lặp lại.
- Với công việc nên xảy ra sau hoặc theo lịch, dùng Cron thay vì
  các mẫu sleep/delay của `exec`.

## Cấu hình

- `tools.exec.notifyOnExit` (mặc định: true): khi true, các phiên exec được đưa vào background sẽ xếp hàng một sự kiện hệ thống và yêu cầu Heartbeat khi thoát.
- `tools.exec.approvalRunningNoticeMs` (mặc định: 10000): phát một thông báo “đang chạy” duy nhất khi một exec có cổng phê duyệt chạy lâu hơn mức này (0 để tắt).
- `tools.exec.timeoutSec` (mặc định: 1800): thời gian chờ exec mặc định theo từng lệnh, tính bằng giây. `timeout` theo từng lần gọi sẽ ghi đè; `timeout: 0` theo từng lần gọi sẽ tắt thời gian chờ tiến trình exec.
- `tools.exec.host` (mặc định: `auto`; phân giải thành `sandbox` khi runtime sandbox đang hoạt động, nếu không thì `gateway`)
- `tools.exec.security` (mặc định: `deny` cho sandbox, `full` cho Gateway + Node khi chưa đặt)
- `tools.exec.ask` (mặc định: `off`)
- Exec trên host không cần phê duyệt là mặc định cho Gateway + Node. Nếu bạn muốn hành vi phê duyệt/allowlist, hãy siết chặt cả `tools.exec.*` và `~/.openclaw/exec-approvals.json` của host; xem [Phê duyệt Exec](/vi/tools/exec-approvals#no-approval-yolo-mode).
- YOLO đến từ các mặc định chính sách host (`security=full`, `ask=off`), không phải từ `host=auto`. Nếu muốn buộc định tuyến Gateway hoặc Node, đặt `tools.exec.host` hoặc dùng `/exec host=...`.
- Trong chế độ `security=full` cộng với `ask=off`, exec trên host tuân theo trực tiếp chính sách đã cấu hình; không có lớp tiền lọc heuristic bổ sung cho lệnh bị làm rối hoặc lớp từ chối preflight script.
- `tools.exec.node` (mặc định: chưa đặt)
- `tools.exec.strictInlineEval` (mặc định: false): khi true, các dạng eval interpreter inline như `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` và `osascript -e` luôn yêu cầu phê duyệt tường minh. `allow-always` vẫn có thể lưu các lần gọi interpreter/script lành tính, nhưng các dạng inline-eval vẫn nhắc mỗi lần.
- `tools.exec.pathPrepend`: danh sách thư mục cần thêm vào đầu `PATH` cho các lần chạy exec (chỉ Gateway + sandbox).
- `tools.exec.safeBins`: các binary an toàn chỉ dùng stdin có thể chạy mà không cần mục allowlist tường minh. Để biết chi tiết hành vi, xem [Safe bins](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: các thư mục tường minh bổ sung được tin cậy cho kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ được tự động tin cậy. Mặc định tích hợp là `/bin` và `/usr/bin`.
- `tools.exec.safeBinProfiles`: chính sách argv tùy chỉnh tùy chọn cho từng safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: hợp nhất `PATH` của login-shell vào môi trường exec. Các ghi đè `env.PATH`
  bị từ chối cho thực thi host. Bản thân daemon vẫn chạy với `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: chạy `sh -lc` (login shell) bên trong container, nên `/etc/profile` có thể đặt lại `PATH`.
  OpenClaw thêm `env.PATH` vào đầu sau khi source profile thông qua một biến env nội bộ (không nội suy shell);
  `tools.exec.pathPrepend` cũng áp dụng ở đây.
- `host=node`: chỉ các ghi đè env không bị chặn mà bạn truyền vào mới được gửi đến Node. Các ghi đè `env.PATH`
  bị từ chối cho thực thi host và bị host Node bỏ qua. Nếu bạn cần thêm mục PATH trên Node,
  hãy cấu hình môi trường dịch vụ host Node (systemd/launchd) hoặc cài công cụ vào vị trí tiêu chuẩn.

Ràng buộc Node theo agent (dùng chỉ mục danh sách agent trong cấu hình):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: tab Nodes có một panel nhỏ “Ràng buộc Node exec” cho cùng các thiết lập.

## Ghi đè phiên (`/exec`)

Dùng `/exec` để đặt mặc định **theo phiên** cho `host`, `security`, `ask` và `node`.
Gửi `/exec` không có đối số để hiển thị các giá trị hiện tại.

Ví dụ:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Mô hình ủy quyền

`/exec` chỉ được tôn trọng cho **người gửi được ủy quyền** (allowlist/ghép đôi kênh cộng với `commands.useAccessGroups`).
Nó chỉ cập nhật **trạng thái phiên** và không ghi cấu hình. Để tắt cứng exec, từ chối qua chính sách công cụ
(`tools.deny: ["exec"]` hoặc theo từng agent). Phê duyệt host vẫn áp dụng trừ khi bạn đặt tường minh
`security=full` và `ask=off`.

## Phê duyệt Exec (ứng dụng companion / host Node)

Các agent trong sandbox có thể yêu cầu phê duyệt theo từng yêu cầu trước khi `exec` chạy trên host Gateway hoặc Node.
Xem [Phê duyệt Exec](/vi/tools/exec-approvals) để biết chính sách, allowlist và luồng UI.

Khi cần phê duyệt, công cụ exec trả về ngay với
`status: "approval-pending"` và một id phê duyệt. Sau khi được phê duyệt (hoặc bị từ chối / hết thời gian),
Gateway phát các sự kiện hệ thống (`Exec finished` / `Exec denied`). Nếu lệnh vẫn
đang chạy sau `tools.exec.approvalRunningNoticeMs`, một thông báo `Exec running` duy nhất được phát.
Trên các kênh có thẻ/nút phê duyệt gốc, agent nên dựa vào
UI gốc đó trước và chỉ đưa vào lệnh `/approve` thủ công khi kết quả công cụ
nói rõ phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là
đường dẫn duy nhất.

## Allowlist + safe bins

Thực thi allowlist thủ công khớp các glob đường dẫn binary đã phân giải và các glob tên lệnh trần.
Tên trần chỉ khớp các lệnh được gọi thông qua PATH, nên `rg` có thể khớp
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng không khớp `./rg` hoặc `/tmp/rg`.
Khi `security=allowlist`, lệnh shell chỉ được tự động cho phép nếu mọi segment pipeline
đều nằm trong allowlist hoặc là safe bin. Chaining (`;`, `&&`, `||`) và redirection
bị từ chối trong chế độ allowlist trừ khi mọi segment cấp cao nhất thỏa mãn
allowlist (bao gồm safe bins). Redirection vẫn chưa được hỗ trợ.
Niềm tin bền vững `allow-always` không bỏ qua quy tắc đó: một lệnh chained vẫn yêu cầu mọi
segment cấp cao nhất khớp.

`autoAllowSkills` là một đường dẫn tiện ích riêng trong phê duyệt exec. Nó không giống với
các mục allowlist đường dẫn thủ công. Để có niềm tin tường minh nghiêm ngặt, hãy giữ `autoAllowSkills` bị tắt.

Dùng hai bộ điều khiển cho các nhiệm vụ khác nhau:

- `tools.exec.safeBins`: các bộ lọc luồng nhỏ, chỉ dùng stdin.
- `tools.exec.safeBinTrustedDirs`: các thư mục bổ sung tường minh được tin cậy cho đường dẫn executable của safe-bin.
- `tools.exec.safeBinProfiles`: chính sách argv tường minh cho safe bins tùy chỉnh.
- allowlist: niềm tin tường minh cho đường dẫn executable.

Không được xem `safeBins` là danh sách cho phép chung, và không thêm các tệp nhị phân trình thông dịch/thời gian chạy (ví dụ `python3`, `node`, `ruby`, `bash`). Nếu bạn cần chúng, hãy dùng các mục danh sách cho phép tường minh và giữ bật lời nhắc phê duyệt.
`openclaw security audit` cảnh báo khi các mục `safeBins` của trình thông dịch/thời gian chạy thiếu hồ sơ tường minh, và `openclaw doctor --fix` có thể tạo khung cho các mục `safeBinProfiles` tùy chỉnh còn thiếu.
`openclaw security audit` và `openclaw doctor` cũng cảnh báo khi bạn thêm tường minh các bin có hành vi rộng như `jq` trở lại `safeBins`.
Nếu bạn thêm trình thông dịch vào danh sách cho phép một cách tường minh, hãy bật `tools.exec.strictInlineEval` để các dạng đánh giá mã nội tuyến vẫn yêu cầu phê duyệt mới.

Để biết đầy đủ chi tiết chính sách và ví dụ, hãy xem [Phê duyệt Exec](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only) và [Safe bins so với danh sách cho phép](/vi/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ví dụ

Chạy nền trước:

```json
{ "tool": "exec", "command": "ls -la" }
```

Chạy nền + thăm dò:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Thăm dò dùng cho trạng thái theo yêu cầu, không phải các vòng lặp chờ. Nếu đánh thức khi hoàn tất tự động
được bật, lệnh có thể đánh thức phiên khi lệnh phát ra đầu ra hoặc thất bại.

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

Dán (mặc định có ngoặc):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` là một công cụ con của `exec` dành cho các chỉnh sửa nhiều tệp có cấu trúc.
Công cụ này được bật mặc định cho các mô hình OpenAI và OpenAI Codex. Chỉ dùng cấu hình
khi bạn muốn tắt công cụ hoặc giới hạn công cụ cho các mô hình cụ thể:

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

- Chỉ có sẵn cho các mô hình OpenAI/OpenAI Codex.
- Chính sách công cụ vẫn áp dụng; `allow: ["write"]` ngầm cho phép `apply_patch`.
- Cấu hình nằm dưới `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` mặc định là `true`; đặt thành `false` để tắt công cụ cho các mô hình OpenAI.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (giới hạn trong workspace). Chỉ đặt thành `false` nếu bạn cố ý muốn `apply_patch` ghi/xóa bên ngoài thư mục workspace.

## Liên quan

- [Phê duyệt Exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Sandboxing](/vi/gateway/sandboxing) — chạy lệnh trong môi trường sandbox
- [Tiến trình nền](/vi/gateway/background-process) — exec chạy dài và công cụ process
- [Bảo mật](/vi/gateway/security) — chính sách công cụ và quyền truy cập nâng cao
