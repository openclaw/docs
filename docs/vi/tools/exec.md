---
read_when:
    - Sử dụng hoặc sửa đổi công cụ exec
    - Gỡ lỗi hành vi stdin hoặc TTY
summary: Cách sử dụng công cụ exec, các chế độ stdin và hỗ trợ TTY
title: Công cụ thực thi
x-i18n:
    generated_at: "2026-06-27T18:15:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Chạy các lệnh shell trong workspace. `exec` là một bề mặt shell có thể thay đổi trạng thái: các lệnh có thể tạo, sửa hoặc xóa tệp ở bất cứ nơi nào host đã chọn hoặc hệ thống tệp sandbox cho phép. Việc tắt các công cụ hệ thống tệp của OpenClaw như `write`, `edit` hoặc `apply_patch` không làm cho `exec` trở thành chỉ đọc.

Hỗ trợ thực thi foreground + background thông qua `process`. Nếu `process` không được cho phép, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
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
Tự động đưa lệnh xuống background sau độ trễ này (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Đưa lệnh xuống background ngay lập tức thay vì chờ `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Ghi đè thời gian chờ exec đã cấu hình cho lần gọi này. Chỉ đặt `timeout: 0` khi lệnh cần chạy mà không có thời gian chờ tiến trình exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Chạy trong pseudo-terminal khi có sẵn. Dùng cho CLI chỉ hỗ trợ TTY, coding agent và giao diện người dùng terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nơi thực thi. `auto` phân giải thành `sandbox` khi runtime sandbox đang hoạt động và thành `gateway` trong các trường hợp khác.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Bị bỏ qua đối với các lệnh gọi công cụ thông thường. Bảo mật `gateway` / `node` được kiểm soát bởi
`tools.exec.security` và tệp phê duyệt host; chế độ nâng quyền chỉ có thể
buộc `security=full` khi operator cấp quyền nâng quyền một cách rõ ràng.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Chế độ hỏi nền tảng đến từ `tools.exec.ask` và các phê duyệt host.
Đối với các lệnh gọi mô hình có nguồn gốc từ kênh, `ask` theo từng lệnh gọi bị bỏ qua khi
chế độ hỏi host hiệu lực là `off`; nếu không, nó chỉ có thể siết chặt sang một
chế độ nghiêm ngặt hơn. Các caller nội bộ/API đáng tin cậy tạo công cụ exec với
giá trị `ask` rõ ràng sẽ không thay đổi.
</ParamField>

<ParamField path="node" type="string">
ID/tên Node khi `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yêu cầu chế độ nâng quyền — thoát khỏi sandbox tới đường dẫn host đã cấu hình. `security=full` chỉ bị buộc khi elevated phân giải thành `full`.
</ParamField>

Ghi chú:

- `host` mặc định là `auto`: sandbox khi runtime sandbox đang hoạt động cho phiên, nếu không thì gateway.
- `host` chỉ chấp nhận `auto`, `sandbox`, `gateway` hoặc `node`. Nó không phải là bộ chọn hostname; các giá trị giống hostname bị từ chối trước khi lệnh chạy.
- `auto` là chiến lược định tuyến mặc định, không phải wildcard. `host=node` theo từng lệnh gọi được cho phép từ `auto`; `host=gateway` theo từng lệnh gọi chỉ được cho phép khi không có runtime sandbox nào đang hoạt động.
- `tools.exec.mode` là núm chính sách đã chuẩn hóa. Các giá trị là `deny`, `allowlist`, `ask`, `auto` và `full`. `auto` chạy trực tiếp các khớp allowlist/safe-bin xác định và định tuyến mọi trường hợp phê duyệt exec còn lại qua trình tự động review gốc của OpenClaw trước khi hỏi con người. `ask` / `ask=always` vẫn hỏi con người mọi lần.
- Khi không có cấu hình bổ sung, `host=auto` vẫn "chỉ hoạt động": không có sandbox nghĩa là nó phân giải thành `gateway`; sandbox đang chạy nghĩa là nó vẫn ở trong sandbox.
- `elevated` thoát khỏi sandbox tới đường dẫn host đã cấu hình: mặc định là `gateway`, hoặc `node` khi `tools.exec.host=node` (hoặc mặc định phiên là `host=node`). Nó chỉ khả dụng khi quyền truy cập nâng quyền được bật cho phiên/provider hiện tại.
- Các phê duyệt `gateway`/`node` được kiểm soát bởi tệp phê duyệt host.
- `node` yêu cầu một node đã ghép cặp (ứng dụng companion hoặc host node headless).
- Nếu có nhiều node, đặt `exec.node` hoặc `tools.exec.node` để chọn một node.
- `exec host=node` là đường dẫn thực thi shell duy nhất cho node; wrapper cũ `nodes.run` đã bị xóa.
- `timeout` áp dụng cho thực thi foreground, background, `yieldMs`, gateway, sandbox và node `system.run`. Nếu bỏ qua, OpenClaw dùng `tools.exec.timeoutSec`; `timeout: 0` rõ ràng sẽ tắt thời gian chờ tiến trình exec cho lần gọi đó.
- Trên host không phải Windows, exec dùng `SHELL` khi được đặt; nếu `SHELL` là `fish`, nó ưu tiên `bash` (hoặc `sh`)
  từ `PATH` để tránh các script không tương thích với fish, rồi quay về `SHELL` nếu không có cái nào tồn tại.
- Trên host Windows, exec ưu tiên khám phá PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, rồi PATH),
  sau đó quay về Windows PowerShell 5.1.
- Trên host gateway không phải Windows, các lệnh exec bash và zsh dùng snapshot khởi động. OpenClaw thu thập các
  alias/function có thể source và một tập môi trường an toàn nhỏ từ các tệp khởi động shell vào
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, rồi source snapshot đó trước mỗi lệnh exec.
  Các biến trông giống bí mật bị loại trừ; exec sandbox và node không dùng snapshot này. Đặt
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` trong môi trường tiến trình Gateway để tắt đường dẫn snapshot này.
- Thực thi host (`gateway`/`node`) từ chối `env.PATH` và các ghi đè loader (`LD_*`/`DYLD_*`) để
  ngăn chiếm quyền binary hoặc mã được chèn.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường lệnh được spawn (bao gồm thực thi PTY và sandbox) để các quy tắc shell/profile có thể phát hiện ngữ cảnh công cụ exec.
- Đối với các lần chạy có nguồn gốc từ kênh, OpenClaw cũng phơi bày payload JSON định danh sender/chat hẹp trong
  `OPENCLAW_CHANNEL_CONTEXT` khi kênh đã cung cấp các id đó.
- `openclaw channels login` bị chặn khỏi `exec` vì đây là luồng xác thực kênh tương tác; hãy chạy nó trong terminal trên host gateway, hoặc dùng công cụ đăng nhập gốc của kênh từ chat khi có.
- Quan trọng: sandboxing **tắt theo mặc định**. Nếu sandboxing tắt, `host=auto` ngầm định
  phân giải thành `gateway`. `host=sandbox` rõ ràng vẫn fail closed thay vì âm thầm
  chạy trên host gateway. Hãy bật sandboxing hoặc dùng `host=gateway` kèm phê duyệt.
- Các kiểm tra preflight script (cho các lỗi cú pháp shell Python/Node phổ biến) chỉ kiểm tra các tệp bên trong
  ranh giới `workdir` hiệu lực. Nếu đường dẫn script phân giải ra ngoài `workdir`, preflight bị bỏ qua cho
  tệp đó.
- Với công việc chạy lâu bắt đầu ngay bây giờ, hãy khởi động một lần và dựa vào
  đánh thức hoàn tất tự động khi nó được bật và lệnh phát ra output hoặc thất bại.
  Dùng `process` cho log, trạng thái, input hoặc can thiệp; không mô phỏng
  lập lịch bằng vòng lặp sleep, vòng lặp timeout hoặc polling lặp lại.
- Với công việc cần xảy ra sau hoặc theo lịch, hãy dùng Cron thay vì
  các mẫu sleep/delay bằng `exec`.

## Cấu hình

- `tools.exec.notifyOnExit` (mặc định: true): khi true, các phiên exec đã đưa xuống background sẽ đưa một sự kiện hệ thống vào hàng đợi và yêu cầu Heartbeat khi thoát.
- `tools.exec.approvalRunningNoticeMs` (mặc định: 10000): phát một thông báo "đang chạy" duy nhất khi exec bị chặn bởi phê duyệt chạy lâu hơn mức này (0 để tắt).
- `tools.exec.timeoutSec` (mặc định: 1800): thời gian chờ exec mặc định theo từng lệnh, tính bằng giây. `timeout` theo từng lệnh gọi ghi đè nó; `timeout: 0` theo từng lệnh gọi tắt thời gian chờ tiến trình exec.
- `tools.exec.host` (mặc định: `auto`; phân giải thành `sandbox` khi runtime sandbox đang hoạt động, nếu không thì `gateway`)
- `tools.exec.security` (mặc định: `deny` cho sandbox, `full` cho gateway + node khi chưa đặt)
- `tools.exec.ask` (mặc định: `off`)
- Exec host không cần phê duyệt là mặc định cho gateway + node. Nếu bạn muốn hành vi phê duyệt/allowlist, hãy siết chặt cả `tools.exec.*` và tệp phê duyệt host; xem [Phê duyệt exec](/vi/tools/exec-approvals#yolo-mode-no-approval).
- YOLO đến từ mặc định chính sách host (`security=full`, `ask=off`), không phải từ `host=auto`. Nếu bạn muốn buộc định tuyến gateway hoặc node, đặt `tools.exec.host` hoặc dùng `/exec host=...`.
- Trong chế độ `security=full` cộng với `ask=off`, exec host tuân theo trực tiếp chính sách đã cấu hình; không có lớp prefilter heuristic bổ sung để phát hiện làm rối lệnh hoặc lớp từ chối script-preflight.
- `tools.exec.node` (mặc định: chưa đặt)
- `tools.exec.strictInlineEval` (mặc định: false): khi true, các dạng eval interpreter inline như `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` và `osascript -e` yêu cầu reviewer hoặc phê duyệt rõ ràng. Trong `mode=auto`, đường dẫn phê duyệt exec thông thường có thể cho phép trình tự động review gốc chấp nhận một lệnh một lần rõ ràng có rủi ro thấp; các lệnh gọi `system.run` trực tiếp trên node-host vẫn yêu cầu phê duyệt rõ ràng vì chúng không thể chuyển lệnh cho tuyến phê duyệt của con người. Nếu reviewer yêu cầu, yêu cầu sẽ chuyển tới con người. `allow-always` vẫn có thể lưu lâu dài các lệnh gọi interpreter/script lành tính, nhưng các dạng inline-eval không trở thành quy tắc cho phép bền vững.
- `tools.exec.commandHighlighting` (mặc định: false): khi true, lời nhắc phê duyệt có thể tô sáng các đoạn lệnh do parser suy ra trong văn bản lệnh. Đặt thành `true` toàn cục hoặc theo từng agent để bật tô sáng văn bản lệnh mà không thay đổi chính sách phê duyệt exec.
- `tools.exec.pathPrepend`: danh sách thư mục cần thêm vào đầu `PATH` cho các lần chạy exec (chỉ gateway + sandbox).
- `tools.exec.safeBins`: các binary an toàn chỉ dùng stdin có thể chạy mà không cần mục allowlist rõ ràng. Để biết chi tiết hành vi, xem [Binary an toàn](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: các thư mục rõ ràng bổ sung được tin cậy cho kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ được tự động tin cậy. Mặc định tích hợp là `/bin` và `/usr/bin`.
- `tools.exec.safeBinProfiles`: chính sách argv tùy chỉnh tùy chọn theo từng safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway`: hợp nhất `PATH` của login-shell của bạn vào môi trường exec. Các ghi đè `env.PATH` bị
  từ chối đối với thực thi host. Bản thân daemon vẫn chạy với `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
    - Để ngăn cấu hình shell của người dùng (như `~/.zshenv` hoặc `/etc/zshenv`) ghi đè các đường dẫn ưu tiên trong quá trình khởi động, các mục `tools.exec.pathPrepend` được thêm an toàn vào đầu `PATH` cuối cùng bên trong lệnh shell ngay trước khi thực thi.
- `host=sandbox`: chạy `sh -lc` (login shell) bên trong container, vì vậy `/etc/profile` có thể đặt lại `PATH`.
  OpenClaw thêm `env.PATH` vào đầu sau khi source profile thông qua một biến env nội bộ (không nội suy shell);
  `tools.exec.pathPrepend` cũng áp dụng ở đây.
- `host=node`: chỉ các ghi đè env không bị chặn mà bạn truyền vào mới được gửi tới node. Các ghi đè `env.PATH` bị
  từ chối đối với thực thi host và bị host node bỏ qua. Nếu bạn cần thêm mục PATH trên một node,
  hãy cấu hình môi trường dịch vụ host node (systemd/launchd) hoặc cài công cụ vào các vị trí chuẩn.

Liên kết node theo từng agent (dùng chỉ mục danh sách agent trong cấu hình):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI: tab Nodes có một bảng nhỏ "Liên kết node exec" cho cùng các cài đặt.

## Ghi đè phiên (`/exec`)

Dùng `/exec` để đặt mặc định **theo từng phiên** cho `host`, `security`, `ask` và `node`.
Gửi `/exec` không có đối số để hiển thị các giá trị hiện tại.

Ví dụ:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Mô hình ủy quyền

`/exec` chỉ được chấp nhận cho **người gửi được ủy quyền** (allowlist/ghép đôi kênh cộng với `commands.useAccessGroups`).
Nó chỉ cập nhật **trạng thái phiên** và không ghi cấu hình. Người gửi kênh bên ngoài được ủy quyền có thể
đặt các mặc định phiên này. Các client gateway/webchat nội bộ cần `operator.admin` để lưu cố định chúng.
Để tắt cứng exec, hãy từ chối nó qua chính sách công cụ (`tools.deny: ["exec"]` hoặc theo từng agent). Phê duyệt của host
vẫn áp dụng trừ khi bạn đặt rõ ràng `security=full` và `ask=off`.

## Phê duyệt exec (ứng dụng đồng hành / Node host)

Agent trong sandbox có thể yêu cầu phê duyệt theo từng yêu cầu trước khi `exec` chạy trên gateway hoặc Node host.
Xem [Phê duyệt exec](/vi/tools/exec-approvals) để biết chính sách, allowlist và luồng UI.

Khi cần phê duyệt, công cụ exec trả về ngay lập tức với
`status: "approval-pending"` và một id phê duyệt. Sau khi được phê duyệt (hoặc bị từ chối / hết thời gian chờ),
Gateway chỉ phát ra sự kiện hệ thống về tiến trình và hoàn tất lệnh cho các lượt chạy đã được phê duyệt
(`Exec running` / `Exec finished`). Các phê duyệt bị từ chối hoặc hết thời gian chờ là trạng thái kết thúc và không
đánh thức phiên agent bằng sự kiện hệ thống từ chối.
Trên các kênh có thẻ/nút phê duyệt gốc, agent nên dựa vào
UI gốc đó trước và chỉ đưa vào lệnh `/approve` thủ công khi kết quả
công cụ nói rõ rằng phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là
đường dẫn duy nhất.

## Allowlist + binary an toàn

Việc thực thi allowlist thủ công khớp các glob đường dẫn binary đã phân giải và các glob tên lệnh trần.
Tên trần chỉ khớp các lệnh được gọi qua PATH, vì vậy `rg` có thể khớp
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng không khớp `./rg` hoặc `/tmp/rg`.
Khi `security=allowlist`, lệnh shell chỉ được tự động cho phép nếu mọi phân đoạn pipeline
đều nằm trong allowlist hoặc là binary an toàn. Việc nối lệnh (`;`, `&&`, `||`) và chuyển hướng
bị từ chối ở chế độ allowlist trừ khi mọi phân đoạn cấp cao nhất thỏa mãn
allowlist (bao gồm binary an toàn). Chuyển hướng vẫn chưa được hỗ trợ.
Niềm tin lâu dài `allow-always` không bỏ qua quy tắc đó: một lệnh được nối vẫn yêu cầu mọi
phân đoạn cấp cao nhất phải khớp.

`autoAllowSkills` là một đường dẫn tiện lợi riêng trong phê duyệt exec. Nó không giống với
các mục allowlist đường dẫn thủ công. Để có niềm tin tường minh nghiêm ngặt, hãy giữ `autoAllowSkills` bị tắt.

Dùng hai cơ chế kiểm soát cho các công việc khác nhau:

- `tools.exec.safeBins`: các bộ lọc luồng nhỏ, chỉ dùng stdin.
- `tools.exec.safeBinTrustedDirs`: các thư mục tin cậy bổ sung tường minh cho đường dẫn thực thi của binary an toàn.
- `tools.exec.safeBinProfiles`: chính sách argv tường minh cho binary an toàn tùy chỉnh.
- allowlist: niềm tin tường minh cho đường dẫn thực thi.

Không xem `safeBins` là allowlist chung, và không thêm binary trình thông dịch/runtime (ví dụ `python3`, `node`, `ruby`, `bash`). Nếu bạn cần chúng, hãy dùng các mục allowlist tường minh và giữ bật lời nhắc phê duyệt.
`openclaw security audit` cảnh báo khi các mục `safeBins` là trình thông dịch/runtime thiếu profile tường minh, và `openclaw doctor --fix` có thể scaffold các mục `safeBinProfiles` tùy chỉnh còn thiếu.
`openclaw security audit` và `openclaw doctor` cũng cảnh báo khi bạn thêm tường minh các binary có hành vi rộng như `jq` trở lại vào `safeBins`.
Nếu bạn allowlist tường minh các trình thông dịch, hãy bật `tools.exec.strictInlineEval` để các dạng eval code nội tuyến vẫn yêu cầu reviewer hoặc phê duyệt tường minh.

Để biết đầy đủ chi tiết chính sách và ví dụ, xem [Phê duyệt exec](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only) và [Binary an toàn so với allowlist](/vi/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Ví dụ

Tiền cảnh:

```json
{ "tool": "exec", "command": "ls -la" }
```

Chạy nền + thăm dò:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Thăm dò dùng để xem trạng thái theo yêu cầu, không phải vòng lặp chờ. Nếu đánh thức khi hoàn tất tự động
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

Dán (mặc định dùng bracketed paste):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` là công cụ con của `exec` cho các chỉnh sửa có cấu trúc trên nhiều tệp.
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
- `deny: ["write"]` không từ chối `apply_patch`; hãy từ chối `apply_patch` tường minh hoặc dùng `deny: ["group:fs"]` khi các thao tác ghi bằng patch cũng cần bị chặn.
- Cấu hình nằm dưới `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` mặc định là `true`; đặt thành `false` để tắt công cụ cho các mô hình OpenAI.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (nằm trong workspace). Chỉ đặt thành `false` nếu bạn cố ý muốn `apply_patch` ghi/xóa bên ngoài thư mục workspace.

## Liên quan

- [Phê duyệt exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Sandboxing](/vi/gateway/sandboxing) — chạy lệnh trong môi trường sandbox
- [Tiến trình nền](/vi/gateway/background-process) — exec chạy lâu và công cụ process
- [Bảo mật](/vi/gateway/security) — chính sách công cụ và quyền truy cập nâng cao
