---
read_when:
    - Sử dụng hoặc sửa đổi công cụ exec
    - Gỡ lỗi hành vi stdin hoặc TTY
summary: Cách sử dụng công cụ exec, các chế độ stdin và hỗ trợ TTY
title: Công cụ thực thi
x-i18n:
    generated_at: "2026-05-06T09:32:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9892f030f1eeb83ca0cebac462c469e5f9f000763e4c96d62d82b819f98c3084
    source_path: tools/exec.md
    workflow: 16
---

Chạy các lệnh shell trong workspace. Hỗ trợ thực thi foreground + background thông qua `process`.
Nếu `process` bị cấm, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
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
Tự động đưa lệnh vào background sau độ trễ này (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Đưa lệnh vào background ngay lập tức thay vì chờ `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Ghi đè thời gian chờ exec đã cấu hình cho lệnh gọi này. Chỉ đặt `timeout: 0` khi lệnh nên chạy mà không có thời gian chờ của tiến trình exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Chạy trong pseudo-terminal khi khả dụng. Dùng cho các CLI chỉ hỗ trợ TTY, coding agent và UI terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nơi thực thi. `auto` phân giải thành `sandbox` khi runtime sandbox đang hoạt động và thành `gateway` trong các trường hợp khác.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Chế độ thực thi chính sách cho thực thi `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Hành vi lời nhắc phê duyệt cho thực thi `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Id/tên Node khi `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yêu cầu chế độ elevated — thoát khỏi sandbox sang đường dẫn host đã cấu hình. `security=full` chỉ bị ép buộc khi elevated phân giải thành `full`.
</ParamField>

Ghi chú:

- `host` mặc định là `auto`: sandbox khi runtime sandbox đang hoạt động cho phiên, nếu không thì gateway.
- `host` chỉ chấp nhận `auto`, `sandbox`, `gateway` hoặc `node`. Nó không phải bộ chọn hostname; các giá trị giống hostname bị từ chối trước khi lệnh chạy.
- `auto` là chiến lược định tuyến mặc định, không phải ký tự đại diện. `host=node` theo từng lệnh gọi được phép từ `auto`; `host=gateway` theo từng lệnh gọi chỉ được phép khi không có runtime sandbox nào đang hoạt động.
- Không cần cấu hình bổ sung, `host=auto` vẫn "chỉ hoạt động": không có sandbox thì phân giải thành `gateway`; sandbox đang chạy thì vẫn ở trong sandbox.
- `elevated` thoát khỏi sandbox sang đường dẫn host đã cấu hình: mặc định là `gateway`, hoặc `node` khi `tools.exec.host=node` (hoặc mặc định phiên là `host=node`). Tính năng này chỉ khả dụng khi quyền truy cập elevated được bật cho phiên/provider hiện tại.
- Các phê duyệt `gateway`/`node` được kiểm soát bởi `~/.openclaw/exec-approvals.json`.
- `node` yêu cầu một node đã ghép đôi (ứng dụng companion hoặc host node headless).
- Nếu có nhiều node khả dụng, đặt `exec.node` hoặc `tools.exec.node` để chọn một node.
- `exec host=node` là đường dẫn thực thi shell duy nhất cho node; wrapper `nodes.run` cũ đã bị gỡ bỏ.
- `timeout` áp dụng cho thực thi foreground, background, `yieldMs`, gateway, sandbox và node `system.run`. Nếu bỏ qua, OpenClaw dùng `tools.exec.timeoutSec`; `timeout: 0` rõ ràng sẽ tắt thời gian chờ tiến trình exec cho lệnh gọi đó.
- Trên các host không phải Windows, exec dùng `SHELL` khi được đặt; nếu `SHELL` là `fish`, nó ưu tiên `bash` (hoặc `sh`)
  từ `PATH` để tránh các script không tương thích với fish, rồi quay lại `SHELL` nếu không có cái nào.
- Trên các host Windows, exec ưu tiên phát hiện PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, rồi PATH),
  sau đó quay lại Windows PowerShell 5.1.
- Thực thi trên host (`gateway`/`node`) từ chối các ghi đè `env.PATH` và loader (`LD_*`/`DYLD_*`) để
  ngăn chiếm quyền binary hoặc chèn mã.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường lệnh được spawn (bao gồm thực thi PTY và sandbox) để các quy tắc shell/profile có thể phát hiện ngữ cảnh công cụ exec.
- `openclaw channels login` bị chặn khỏi `exec` vì đây là luồng xác thực kênh tương tác; hãy chạy nó trong terminal trên host gateway, hoặc dùng công cụ đăng nhập gốc của kênh từ chat khi có.
- Quan trọng: sandboxing **tắt theo mặc định**. Nếu sandboxing tắt, `host=auto` ngầm định
  phân giải thành `gateway`. `host=sandbox` rõ ràng vẫn thất bại đóng thay vì âm thầm
  chạy trên host gateway. Hãy bật sandboxing hoặc dùng `host=gateway` kèm phê duyệt.
- Các kiểm tra preflight của script (cho những lỗi cú pháp shell Python/Node thường gặp) chỉ kiểm tra các tệp bên trong
  ranh giới `workdir` hiệu dụng. Nếu một đường dẫn script phân giải ra ngoài `workdir`, preflight bị bỏ qua cho
  tệp đó.
- Với công việc chạy lâu bắt đầu ngay bây giờ, hãy khởi động một lần và dựa vào cơ chế
  đánh thức hoàn tất tự động khi nó được bật và lệnh phát ra output hoặc thất bại.
  Dùng `process` cho log, trạng thái, input hoặc can thiệp; không mô phỏng
  lập lịch bằng vòng lặp sleep, vòng lặp timeout hoặc polling lặp lại.
- Với công việc nên xảy ra sau hoặc theo lịch, dùng cron thay vì
  các mẫu sleep/delay của `exec`.

## Cấu hình

- `tools.exec.notifyOnExit` (mặc định: true): khi true, các phiên exec đã đưa vào background sẽ xếp hàng một sự kiện hệ thống và yêu cầu Heartbeat khi thoát.
- `tools.exec.approvalRunningNoticeMs` (mặc định: 10000): phát một thông báo "running" duy nhất khi một exec bị chặn bởi phê duyệt chạy lâu hơn mức này (0 để tắt).
- `tools.exec.timeoutSec` (mặc định: 1800): thời gian chờ exec mặc định theo từng lệnh, tính bằng giây. `timeout` theo từng lệnh gọi ghi đè nó; `timeout: 0` theo từng lệnh gọi tắt thời gian chờ tiến trình exec.
- `tools.exec.host` (mặc định: `auto`; phân giải thành `sandbox` khi runtime sandbox đang hoạt động, nếu không thì `gateway`)
- `tools.exec.security` (mặc định: `deny` cho sandbox, `full` cho gateway + node khi chưa đặt)
- `tools.exec.ask` (mặc định: `off`)
- Exec trên host không cần phê duyệt là mặc định cho gateway + node. Nếu bạn muốn hành vi phê duyệt/allowlist, hãy siết chặt cả `tools.exec.*` và `~/.openclaw/exec-approvals.json` của host; xem [Phê duyệt exec](/vi/tools/exec-approvals#yolo-mode-no-approval).
- YOLO đến từ mặc định chính sách host (`security=full`, `ask=off`), không phải từ `host=auto`. Nếu bạn muốn buộc định tuyến gateway hoặc node, đặt `tools.exec.host` hoặc dùng `/exec host=...`.
- Trong chế độ `security=full` cộng với `ask=off`, exec trên host tuân theo chính sách đã cấu hình trực tiếp; không có lớp lọc trước heuristic bổ sung cho lệnh bị làm rối hoặc lớp từ chối preflight script.
- `tools.exec.node` (mặc định: chưa đặt)
- `tools.exec.strictInlineEval` (mặc định: false): khi true, các dạng eval trình thông dịch inline như `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` và `osascript -e` luôn yêu cầu phê duyệt rõ ràng. `allow-always` vẫn có thể lưu lâu dài các lời gọi trình thông dịch/script lành tính, nhưng các dạng inline-eval vẫn nhắc mỗi lần.
- `tools.exec.pathPrepend`: danh sách thư mục để thêm vào đầu `PATH` cho các lần chạy exec (chỉ gateway + sandbox).
- `tools.exec.safeBins`: các binary an toàn chỉ dùng stdin có thể chạy mà không cần mục allowlist rõ ràng. Để biết chi tiết hành vi, xem [Safe bins](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: các thư mục rõ ràng bổ sung được tin cậy cho kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ tự động được tin cậy. Mặc định tích hợp sẵn là `/bin` và `/usr/bin`.
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
  bị từ chối cho thực thi trên host. Bản thân daemon vẫn chạy với `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: chạy `sh -lc` (login shell) bên trong container, nên `/etc/profile` có thể đặt lại `PATH`.
  OpenClaw thêm `env.PATH` vào đầu sau khi nạp profile thông qua biến env nội bộ (không nội suy shell);
  `tools.exec.pathPrepend` cũng áp dụng ở đây.
- `host=node`: chỉ các ghi đè env không bị chặn mà bạn truyền vào mới được gửi tới node. Các ghi đè `env.PATH`
  bị từ chối cho thực thi trên host và bị các host node bỏ qua. Nếu bạn cần thêm mục PATH trên một node,
  hãy cấu hình môi trường dịch vụ host node (systemd/launchd) hoặc cài đặt công cụ vào các vị trí chuẩn.

Ràng buộc node theo từng agent (dùng chỉ mục danh sách agent trong config):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: tab Nodes có một panel nhỏ "Ràng buộc node exec" cho cùng các cài đặt.

## Ghi đè phiên (`/exec`)

Dùng `/exec` để đặt mặc định **theo từng phiên** cho `host`, `security`, `ask` và `node`.
Gửi `/exec` không kèm đối số để hiển thị các giá trị hiện tại.

Ví dụ:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Mô hình ủy quyền

`/exec` chỉ được tôn trọng với **người gửi được ủy quyền** (allowlist/ghép đôi kênh cộng với `commands.useAccessGroups`).
Nó chỉ cập nhật **trạng thái phiên** và không ghi config. Để tắt cứng exec, từ chối nó qua chính sách công cụ
(`tools.deny: ["exec"]` hoặc theo từng agent). Phê duyệt host vẫn áp dụng trừ khi bạn đặt rõ ràng
`security=full` và `ask=off`.

## Phê duyệt exec (ứng dụng companion / host node)

Các agent được sandbox có thể yêu cầu phê duyệt theo từng yêu cầu trước khi `exec` chạy trên host gateway hoặc node.
Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết chính sách, allowlist và luồng UI.

Khi cần phê duyệt, công cụ exec trả về ngay lập tức với
`status: "approval-pending"` và một id phê duyệt. Sau khi được phê duyệt (hoặc bị từ chối / hết thời gian),
Gateway phát các sự kiện hệ thống (`Exec finished` / `Exec denied`). Nếu lệnh vẫn
đang chạy sau `tools.exec.approvalRunningNoticeMs`, một thông báo `Exec running` duy nhất được phát.
Trên các kênh có thẻ/nút phê duyệt gốc, agent nên dựa vào
UI gốc đó trước và chỉ đưa vào lệnh `/approve` thủ công khi kết quả
công cụ nói rõ rằng phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là
đường dẫn duy nhất.

## Allowlist + safe bins

Thực thi allowlist thủ công khớp với các glob đường dẫn binary đã phân giải và các glob tên lệnh trần.
Tên trần chỉ khớp với các lệnh được gọi thông qua PATH, nên `rg` có thể khớp với
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng không khớp `./rg` hoặc `/tmp/rg`.
Khi `security=allowlist`, các lệnh shell chỉ được tự động cho phép nếu mọi phân đoạn pipeline
đều nằm trong allowlist hoặc là safe bin. Chaining (`;`, `&&`, `||`) và redirection
bị từ chối ở chế độ allowlist trừ khi mọi phân đoạn cấp cao nhất thỏa mãn
allowlist (bao gồm safe bins). Redirection vẫn chưa được hỗ trợ.
Tin cậy `allow-always` lâu bền không bỏ qua quy tắc đó: một lệnh chained vẫn yêu cầu mọi
phân đoạn cấp cao nhất phải khớp.

`autoAllowSkills` là một đường dẫn tiện lợi riêng trong phê duyệt exec. Nó không giống với
các mục allowlist đường dẫn thủ công. Để có tin cậy rõ ràng nghiêm ngặt, hãy giữ `autoAllowSkills` tắt.

Dùng hai nhóm kiểm soát cho các công việc khác nhau:

- `tools.exec.safeBins`: các bộ lọc luồng nhỏ, chỉ dùng stdin.
- `tools.exec.safeBinTrustedDirs`: các thư mục bổ sung rõ ràng được tin cậy cho đường dẫn thực thi safe-bin.
- `tools.exec.safeBinProfiles`: chính sách argv rõ ràng cho safe bins tùy chỉnh.
- allowlist: tin cậy rõ ràng cho các đường dẫn thực thi.

Không xem `safeBins` là danh sách cho phép chung chung, và không thêm các nhị phân trình thông dịch/runtime (ví dụ `python3`, `node`, `ruby`, `bash`). Nếu bạn cần các mục đó, hãy dùng các mục danh sách cho phép tường minh và giữ bật lời nhắc phê duyệt.
`openclaw security audit` cảnh báo khi các mục `safeBins` của trình thông dịch/runtime thiếu hồ sơ tường minh, và `openclaw doctor --fix` có thể dựng khung các mục `safeBinProfiles` tùy chỉnh còn thiếu.
`openclaw security audit` và `openclaw doctor` cũng cảnh báo khi bạn thêm tường minh các bin có hành vi rộng như `jq` trở lại vào `safeBins`.
Nếu bạn cho phép tường minh các trình thông dịch, hãy bật `tools.exec.strictInlineEval` để các dạng đánh giá mã nội tuyến vẫn yêu cầu phê duyệt mới.

Để biết đầy đủ chi tiết chính sách và ví dụ, xem [Phê duyệt exec](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only) và [Safe bins so với danh sách cho phép](/vi/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ví dụ

Nền trước:

```json
{ "tool": "exec", "command": "ls -la" }
```

Nền sau + thăm dò:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Thăm dò dùng để xem trạng thái theo yêu cầu, không phải cho các vòng lặp chờ. Nếu đánh thức khi hoàn tất tự động
được bật, lệnh có thể đánh thức phiên khi nó phát ra đầu ra hoặc thất bại.

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

`apply_patch` là một công cụ con của `exec` dành cho các chỉnh sửa nhiều tệp có cấu trúc.
Nó được bật mặc định cho các mô hình OpenAI và OpenAI Codex. Chỉ dùng cấu hình
khi bạn muốn tắt nó hoặc giới hạn nó cho các mô hình cụ thể:

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
- `deny: ["write"]` không chặn `apply_patch`; hãy chặn `apply_patch` tường minh hoặc dùng `deny: ["group:fs"]` khi các thao tác ghi bằng bản vá cũng cần bị chặn.
- Cấu hình nằm trong `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` mặc định là `true`; đặt thành `false` để tắt công cụ cho các mô hình OpenAI.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (giới hạn trong workspace). Chỉ đặt thành `false` nếu bạn cố ý muốn `apply_patch` ghi/xóa bên ngoài thư mục workspace.

## Liên quan

- [Phê duyệt Exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Cơ chế sandbox](/vi/gateway/sandboxing) — chạy lệnh trong môi trường sandbox
- [Tiến trình nền](/vi/gateway/background-process) — công cụ exec và process chạy lâu
- [Bảo mật](/vi/gateway/security) — chính sách công cụ và quyền truy cập nâng cao
