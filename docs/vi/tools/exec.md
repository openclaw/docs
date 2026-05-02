---
read_when:
    - Sử dụng hoặc sửa đổi công cụ exec
    - Gỡ lỗi hành vi stdin hoặc TTY
summary: Cách sử dụng công cụ exec, các chế độ stdin và hỗ trợ TTY
title: Công cụ thực thi
x-i18n:
    generated_at: "2026-05-02T22:22:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
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
Đưa lệnh vào background ngay thay vì chờ `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Ghi đè thời gian chờ exec đã cấu hình cho lần gọi này. Chỉ đặt `timeout: 0` khi lệnh nên chạy mà không có thời gian chờ tiến trình exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Chạy trong giả terminal khi có sẵn. Dùng cho các CLI chỉ hỗ trợ TTY, coding agent và giao diện người dùng terminal.
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
ID/tên node khi `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yêu cầu chế độ nâng quyền — thoát khỏi sandbox sang đường dẫn host đã cấu hình. `security=full` chỉ bị ép buộc khi elevated phân giải thành `full`.
</ParamField>

Ghi chú:

- `host` mặc định là `auto`: sandbox khi runtime sandbox đang hoạt động cho phiên, nếu không thì gateway.
- `host` chỉ chấp nhận `auto`, `sandbox`, `gateway` hoặc `node`. Đây không phải là bộ chọn hostname; các giá trị giống hostname bị từ chối trước khi lệnh chạy.
- `auto` là chiến lược định tuyến mặc định, không phải ký tự đại diện. `host=node` theo từng lần gọi được phép từ `auto`; `host=gateway` theo từng lần gọi chỉ được phép khi không có runtime sandbox nào đang hoạt động.
- Khi không có cấu hình bổ sung, `host=auto` vẫn "hoạt động ngay": không có sandbox nghĩa là phân giải thành `gateway`; sandbox đang chạy nghĩa là vẫn ở trong sandbox.
- `elevated` thoát khỏi sandbox sang đường dẫn host đã cấu hình: mặc định là `gateway`, hoặc `node` khi `tools.exec.host=node` (hoặc mặc định của phiên là `host=node`). Tùy chọn này chỉ khả dụng khi quyền truy cập elevated được bật cho phiên/nhà cung cấp hiện tại.
- Phê duyệt `gateway`/`node` được kiểm soát bởi `~/.openclaw/exec-approvals.json`.
- `node` yêu cầu một node đã ghép nối (ứng dụng đồng hành hoặc node host headless).
- Nếu có nhiều node, đặt `exec.node` hoặc `tools.exec.node` để chọn một node.
- `exec host=node` là đường dẫn thực thi shell duy nhất cho node; wrapper `nodes.run` cũ đã bị loại bỏ.
- `timeout` áp dụng cho thực thi foreground, background, `yieldMs`, gateway, sandbox và node `system.run`. Nếu bỏ qua, OpenClaw dùng `tools.exec.timeoutSec`; `timeout: 0` rõ ràng sẽ tắt thời gian chờ tiến trình exec cho lần gọi đó.
- Trên host không phải Windows, exec dùng `SHELL` khi được đặt; nếu `SHELL` là `fish`, nó ưu tiên `bash` (hoặc `sh`)
  từ `PATH` để tránh các script không tương thích với fish, rồi quay lại `SHELL` nếu không có cái nào tồn tại.
- Trên host Windows, exec ưu tiên phát hiện PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, rồi PATH),
  sau đó quay lại Windows PowerShell 5.1.
- Thực thi host (`gateway`/`node`) từ chối ghi đè `env.PATH` và ghi đè loader (`LD_*`/`DYLD_*`) để
  ngăn chặn chiếm quyền nhị phân hoặc mã được chèn.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường lệnh được sinh ra (bao gồm thực thi PTY và sandbox) để quy tắc shell/profile có thể phát hiện ngữ cảnh công cụ exec.
- `openclaw channels login` bị chặn khỏi `exec` vì đây là luồng xác thực kênh tương tác; hãy chạy nó trong terminal trên gateway host, hoặc dùng công cụ đăng nhập gốc của kênh từ chat khi có.
- Quan trọng: sandboxing **tắt theo mặc định**. Nếu sandboxing tắt, `host=auto` ngầm định
  phân giải thành `gateway`. `host=sandbox` rõ ràng vẫn fail closed thay vì âm thầm
  chạy trên gateway host. Bật sandboxing hoặc dùng `host=gateway` với phê duyệt.
- Kiểm tra preflight script (cho các lỗi cú pháp shell Python/Node phổ biến) chỉ kiểm tra tệp bên trong
  ranh giới `workdir` hiệu lực. Nếu đường dẫn script phân giải ra ngoài `workdir`, preflight sẽ bị bỏ qua cho
  tệp đó.
- Với công việc chạy lâu bắt đầu ngay bây giờ, hãy khởi động một lần và dựa vào đánh thức
  hoàn tất tự động khi tính năng này được bật và lệnh phát ra output hoặc thất bại.
  Dùng `process` cho nhật ký, trạng thái, input hoặc can thiệp; không mô phỏng
  lập lịch bằng vòng lặp sleep, vòng lặp timeout hoặc polling lặp lại.
- Với công việc nên xảy ra sau hoặc theo lịch, dùng cron thay vì
  các mẫu sleep/delay bằng `exec`.

## Cấu hình

- `tools.exec.notifyOnExit` (mặc định: true): khi true, các phiên exec đã đưa vào background sẽ xếp hàng một sự kiện hệ thống và yêu cầu Heartbeat khi thoát.
- `tools.exec.approvalRunningNoticeMs` (mặc định: 10000): phát một thông báo “đang chạy” duy nhất khi exec bị cổng phê duyệt chạy lâu hơn giá trị này (0 để tắt).
- `tools.exec.timeoutSec` (mặc định: 1800): thời gian chờ exec mặc định theo từng lệnh, tính bằng giây. `timeout` theo từng lần gọi sẽ ghi đè; `timeout: 0` theo từng lần gọi sẽ tắt thời gian chờ tiến trình exec.
- `tools.exec.host` (mặc định: `auto`; phân giải thành `sandbox` khi runtime sandbox đang hoạt động, nếu không thì `gateway`)
- `tools.exec.security` (mặc định: `deny` cho sandbox, `full` cho gateway + node khi chưa đặt)
- `tools.exec.ask` (mặc định: `off`)
- Exec host không cần phê duyệt là mặc định cho gateway + node. Nếu bạn muốn hành vi phê duyệt/allowlist, hãy siết chặt cả `tools.exec.*` và `~/.openclaw/exec-approvals.json` của host; xem [Phê duyệt exec](/vi/tools/exec-approvals#yolo-mode-no-approval).
- YOLO đến từ mặc định chính sách host (`security=full`, `ask=off`), không phải từ `host=auto`. Nếu bạn muốn ép định tuyến gateway hoặc node, đặt `tools.exec.host` hoặc dùng `/exec host=...`.
- Ở chế độ `security=full` cộng với `ask=off`, host exec tuân theo trực tiếp chính sách đã cấu hình; không có lớp lọc trước heuristic bổ sung cho lệnh bị làm rối hoặc lớp từ chối script-preflight.
- `tools.exec.node` (mặc định: chưa đặt)
- `tools.exec.strictInlineEval` (mặc định: false): khi true, các dạng eval trình thông dịch inline như `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` và `osascript -e` luôn yêu cầu phê duyệt rõ ràng. `allow-always` vẫn có thể lưu lâu dài các lần gọi trình thông dịch/script lành tính, nhưng các dạng inline-eval vẫn nhắc mỗi lần.
- `tools.exec.pathPrepend`: danh sách thư mục để thêm vào đầu `PATH` cho các lần chạy exec (chỉ gateway + sandbox).
- `tools.exec.safeBins`: các nhị phân an toàn chỉ nhận stdin có thể chạy mà không cần mục allowlist rõ ràng. Để biết chi tiết hành vi, xem [Safe bins](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: các thư mục rõ ràng bổ sung được tin cậy cho kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ được tự động tin cậy. Mặc định tích hợp sẵn là `/bin` và `/usr/bin`.
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

- `host=gateway`: hợp nhất `PATH` của login shell của bạn vào môi trường exec. Ghi đè `env.PATH`
  bị từ chối đối với thực thi host. Bản thân daemon vẫn chạy với `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: chạy `sh -lc` (login shell) bên trong container, vì vậy `/etc/profile` có thể đặt lại `PATH`.
  OpenClaw thêm `env.PATH` vào đầu sau khi source profile thông qua một biến env nội bộ (không nội suy shell);
  `tools.exec.pathPrepend` cũng áp dụng ở đây.
- `host=node`: chỉ các ghi đè env không bị chặn mà bạn truyền vào mới được gửi đến node. Ghi đè `env.PATH`
  bị từ chối đối với thực thi host và bị node host bỏ qua. Nếu bạn cần thêm mục PATH trên node,
  hãy cấu hình môi trường dịch vụ node host (systemd/launchd) hoặc cài đặt công cụ ở các vị trí chuẩn.

Liên kết node theo từng agent (dùng chỉ mục danh sách agent trong cấu hình):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI: tab Nodes bao gồm một panel nhỏ “Liên kết node exec” cho cùng các cài đặt.

## Ghi đè phiên (`/exec`)

Dùng `/exec` để đặt mặc định **theo từng phiên** cho `host`, `security`, `ask` và `node`.
Gửi `/exec` không có đối số để hiển thị các giá trị hiện tại.

Ví dụ:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Mô hình ủy quyền

`/exec` chỉ được tôn trọng cho **người gửi được ủy quyền** (allowlist/ghép nối kênh cộng với `commands.useAccessGroups`).
Nó chỉ cập nhật **trạng thái phiên** và không ghi cấu hình. Để tắt cứng exec, hãy từ chối nó qua chính sách công cụ
(`tools.deny: ["exec"]` hoặc theo từng agent). Phê duyệt host vẫn áp dụng trừ khi bạn đặt rõ ràng
`security=full` và `ask=off`.

## Phê duyệt exec (ứng dụng đồng hành / node host)

Các agent trong sandbox có thể yêu cầu phê duyệt theo từng yêu cầu trước khi `exec` chạy trên gateway hoặc node host.
Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết chính sách, allowlist và luồng UI.

Khi yêu cầu phê duyệt, công cụ exec trả về ngay với
`status: "approval-pending"` và một approval id. Sau khi được phê duyệt (hoặc bị từ chối / hết thời gian),
Gateway phát ra sự kiện hệ thống (`Exec finished` / `Exec denied`). Nếu lệnh vẫn
đang chạy sau `tools.exec.approvalRunningNoticeMs`, một thông báo `Exec running` duy nhất được phát.
Trên các kênh có thẻ/nút phê duyệt gốc, agent nên dựa vào
UI gốc đó trước và chỉ bao gồm lệnh `/approve` thủ công khi kết quả
công cụ nói rõ phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là
đường dẫn duy nhất.

## Allowlist + safe bins

Thực thi allowlist thủ công khớp với các glob đường dẫn nhị phân đã phân giải và các glob tên lệnh trần.
Tên trần chỉ khớp các lệnh được gọi thông qua PATH, vì vậy `rg` có thể khớp
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng không khớp `./rg` hoặc `/tmp/rg`.
Khi `security=allowlist`, lệnh shell chỉ được tự động cho phép nếu mọi phân đoạn pipeline
đều nằm trong allowlist hoặc là safe bin. Chuỗi lệnh (`;`, `&&`, `||`) và chuyển hướng
bị từ chối trong chế độ allowlist trừ khi mọi phân đoạn cấp cao nhất thỏa mãn
allowlist (bao gồm safe bins). Chuyển hướng vẫn chưa được hỗ trợ.
Niềm tin `allow-always` bền vững không bỏ qua quy tắc đó: một lệnh dạng chuỗi vẫn yêu cầu mọi
phân đoạn cấp cao nhất khớp.

`autoAllowSkills` là một đường dẫn tiện lợi riêng trong phê duyệt exec. Nó không giống với
các mục allowlist đường dẫn thủ công. Để có niềm tin rõ ràng nghiêm ngặt, hãy giữ `autoAllowSkills` bị tắt.

Dùng hai điều khiển cho các công việc khác nhau:

- `tools.exec.safeBins`: các bộ lọc stream nhỏ, chỉ nhận stdin.
- `tools.exec.safeBinTrustedDirs`: các thư mục bổ sung được tin cậy rõ ràng cho đường dẫn thực thi safe-bin.
- `tools.exec.safeBinProfiles`: chính sách argv rõ ràng cho safe bin tùy chỉnh.
- allowlist: niềm tin rõ ràng cho đường dẫn thực thi.

Không coi `safeBins` là một danh sách cho phép chung, và không thêm các binary thông dịch/runtime (ví dụ `python3`, `node`, `ruby`, `bash`). Nếu bạn cần các mục đó, hãy dùng các mục danh sách cho phép tường minh và giữ bật lời nhắc phê duyệt.
`openclaw security audit` cảnh báo khi các mục `safeBins` thông dịch/runtime thiếu hồ sơ tường minh, và `openclaw doctor --fix` có thể dựng khung các mục `safeBinProfiles` tùy chỉnh còn thiếu.
`openclaw security audit` và `openclaw doctor` cũng cảnh báo khi bạn thêm tường minh các bin có hành vi rộng như `jq` trở lại `safeBins`.
Nếu bạn đưa các trình thông dịch vào danh sách cho phép một cách tường minh, hãy bật `tools.exec.strictInlineEval` để các dạng đánh giá mã inline vẫn yêu cầu phê duyệt mới.

Để biết đầy đủ chi tiết chính sách và ví dụ, xem [Phê duyệt exec](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only) và [Safe bins so với danh sách cho phép](/vi/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Thăm dò dùng để lấy trạng thái theo yêu cầu, không phải các vòng lặp chờ. Nếu đánh thức khi hoàn tất tự động
được bật, lệnh có thể đánh thức phiên khi nó phát ra đầu ra hoặc thất bại.

Gửi phím (kiểu tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Submit (chỉ gửi CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Dán (mặc định có bracketed):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` là một công cụ con của `exec` để chỉnh sửa nhiều tệp có cấu trúc.
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
- Cấu hình nằm dưới `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` mặc định là `true`; đặt thành `false` để tắt công cụ này cho các mô hình OpenAI.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (giới hạn trong workspace). Chỉ đặt thành `false` nếu bạn cố ý muốn `apply_patch` ghi/xóa bên ngoài thư mục workspace.

## Liên quan

- [Phê duyệt Exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Sandboxing](/vi/gateway/sandboxing) — chạy lệnh trong môi trường sandbox
- [Tiến trình nền](/vi/gateway/background-process) — exec chạy lâu và công cụ process
- [Bảo mật](/vi/gateway/security) — chính sách công cụ và quyền truy cập nâng cao
