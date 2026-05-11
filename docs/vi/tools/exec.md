---
read_when:
    - Sử dụng hoặc sửa đổi công cụ exec
    - Gỡ lỗi hành vi stdin hoặc TTY
summary: Cách dùng công cụ Exec, các chế độ stdin và hỗ trợ TTY
title: Công cụ thực thi
x-i18n:
    generated_at: "2026-05-11T20:37:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

Chạy các lệnh shell trong workspace. `exec` là một bề mặt shell có thể thay đổi trạng thái: lệnh có thể tạo, chỉnh sửa hoặc xóa tệp ở bất cứ nơi nào máy chủ hoặc hệ thống tệp sandbox đã chọn cho phép. Việc vô hiệu hóa các công cụ hệ thống tệp của OpenClaw như `write`, `edit` hoặc `apply_patch` không làm cho `exec` trở thành chỉ đọc.

Hỗ trợ thực thi foreground + background thông qua `process`. Nếu `process` không được phép, `exec` chạy đồng bộ và bỏ qua `yieldMs`/`background`.
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
Tự động chuyển lệnh sang background sau độ trễ này (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Chuyển lệnh sang background ngay lập tức thay vì chờ `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Ghi đè timeout exec đã cấu hình cho lời gọi này. Chỉ đặt `timeout: 0` khi lệnh nên chạy mà không có timeout tiến trình exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Chạy trong pseudo-terminal khi có sẵn. Dùng cho các CLI chỉ hoạt động với TTY, agent lập trình và giao diện người dùng terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Nơi thực thi. `auto` phân giải thành `sandbox` khi runtime sandbox đang hoạt động và thành `gateway` trong các trường hợp khác.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Bị bỏ qua đối với các lời gọi công cụ thông thường. Bảo mật `gateway` / `node` được kiểm soát bởi
`tools.exec.security` và `~/.openclaw/exec-approvals.json`; chế độ nâng quyền chỉ có thể
buộc `security=full` khi người vận hành cấp quyền truy cập nâng quyền một cách rõ ràng.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Hành vi nhắc phê duyệt cho thực thi `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Id/tên Node khi `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Yêu cầu chế độ nâng quyền — thoát khỏi sandbox sang đường dẫn máy chủ đã cấu hình. `security=full` chỉ bị buộc khi elevated phân giải thành `full`.
</ParamField>

Ghi chú:

- `host` mặc định là `auto`: sandbox khi runtime sandbox đang hoạt động cho phiên, nếu không thì Gateway.
- `host` chỉ chấp nhận `auto`, `sandbox`, `gateway` hoặc `node`. Nó không phải là bộ chọn hostname; các giá trị giống hostname sẽ bị từ chối trước khi lệnh chạy.
- `auto` là chiến lược định tuyến mặc định, không phải ký tự đại diện. `host=node` theo từng lời gọi được phép từ `auto`; `host=gateway` theo từng lời gọi chỉ được phép khi không có runtime sandbox nào đang hoạt động.
- Khi không có cấu hình bổ sung, `host=auto` vẫn "hoạt động ngay": không có sandbox thì nó phân giải thành `gateway`; sandbox đang chạy thì nó ở lại trong sandbox.
- `elevated` thoát khỏi sandbox sang đường dẫn máy chủ đã cấu hình: mặc định là `gateway`, hoặc `node` khi `tools.exec.host=node` (hoặc mặc định phiên là `host=node`). Nó chỉ khả dụng khi quyền truy cập nâng quyền được bật cho phiên/nhà cung cấp hiện tại.
- Các phê duyệt `gateway`/`node` được kiểm soát bởi `~/.openclaw/exec-approvals.json`.
- `node` yêu cầu một Node đã ghép nối (ứng dụng đồng hành hoặc máy chủ Node headless).
- Nếu có nhiều Node, đặt `exec.node` hoặc `tools.exec.node` để chọn một Node.
- `exec host=node` là đường dẫn thực thi shell duy nhất cho các Node; wrapper cũ `nodes.run` đã bị gỡ bỏ.
- `timeout` áp dụng cho foreground, background, `yieldMs`, Gateway, sandbox và thực thi `system.run` của Node. Nếu bỏ qua, OpenClaw dùng `tools.exec.timeoutSec`; `timeout: 0` rõ ràng sẽ tắt timeout tiến trình exec cho lời gọi đó.
- Trên các máy chủ không phải Windows, exec dùng `SHELL` khi được đặt; nếu `SHELL` là `fish`, nó ưu tiên `bash` (hoặc `sh`)
  từ `PATH` để tránh các script không tương thích với fish, rồi fallback về `SHELL` nếu không có cái nào tồn tại.
- Trên máy chủ Windows, exec ưu tiên phát hiện PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, rồi PATH),
  sau đó fallback về Windows PowerShell 5.1.
- Thực thi trên máy chủ (`gateway`/`node`) từ chối các ghi đè `env.PATH` và loader (`LD_*`/`DYLD_*`) để
  ngăn chiếm quyền nhị phân hoặc chèn mã.
- OpenClaw đặt `OPENCLAW_SHELL=exec` trong môi trường lệnh được spawn (bao gồm thực thi PTY và sandbox) để các quy tắc shell/profile có thể phát hiện ngữ cảnh công cụ exec.
- `openclaw channels login` bị chặn khỏi `exec` vì đây là luồng xác thực kênh tương tác; hãy chạy nó trong terminal trên máy chủ Gateway, hoặc dùng công cụ đăng nhập gốc của kênh từ chat khi có.
- Quan trọng: sandboxing **tắt theo mặc định**. Nếu sandboxing tắt, `host=auto` ngầm định
  phân giải thành `gateway`. `host=sandbox` rõ ràng vẫn fail closed thay vì âm thầm
  chạy trên máy chủ Gateway. Hãy bật sandboxing hoặc dùng `host=gateway` cùng phê duyệt.
- Các kiểm tra preflight script (cho các lỗi cú pháp shell Python/Node phổ biến) chỉ kiểm tra tệp bên trong
  ranh giới `workdir` hiệu dụng. Nếu đường dẫn script phân giải ra ngoài `workdir`, preflight bị bỏ qua cho
  tệp đó.
- Với công việc chạy lâu bắt đầu ngay bây giờ, hãy khởi động một lần và dựa vào cơ chế
  đánh thức khi hoàn tất tự động khi nó được bật và lệnh phát ra output hoặc thất bại.
  Dùng `process` cho log, trạng thái, input hoặc can thiệp; không mô phỏng
  lập lịch bằng vòng lặp sleep, vòng lặp timeout hoặc polling lặp lại.
- Với công việc cần diễn ra sau này hoặc theo lịch, dùng Cron thay vì
  các mẫu sleep/delay của `exec`.

## Cấu hình

- `tools.exec.notifyOnExit` (mặc định: true): khi true, các phiên exec đã chuyển sang background sẽ xếp hàng một sự kiện hệ thống và yêu cầu Heartbeat khi thoát.
- `tools.exec.approvalRunningNoticeMs` (mặc định: 10000): phát một thông báo "đang chạy" duy nhất khi exec bị chặn bởi phê duyệt chạy lâu hơn mức này (0 để tắt).
- `tools.exec.timeoutSec` (mặc định: 1800): timeout exec mặc định theo từng lệnh, tính bằng giây. `timeout` theo từng lời gọi sẽ ghi đè nó; `timeout: 0` theo từng lời gọi sẽ tắt timeout tiến trình exec.
- `tools.exec.host` (mặc định: `auto`; phân giải thành `sandbox` khi runtime sandbox đang hoạt động, nếu không thì `gateway`)
- `tools.exec.security` (mặc định: `deny` cho sandbox, `full` cho Gateway + Node khi chưa đặt)
- `tools.exec.ask` (mặc định: `off`)
- Exec trên máy chủ không cần phê duyệt là mặc định cho Gateway + Node. Nếu muốn hành vi phê duyệt/danh sách cho phép, hãy siết chặt cả `tools.exec.*` và `~/.openclaw/exec-approvals.json` của máy chủ; xem [Phê duyệt Exec](/vi/tools/exec-approvals#yolo-mode-no-approval).
- YOLO đến từ các mặc định chính sách máy chủ (`security=full`, `ask=off`), không phải từ `host=auto`. Nếu muốn buộc định tuyến Gateway hoặc Node, đặt `tools.exec.host` hoặc dùng `/exec host=...`.
- Ở chế độ `security=full` cộng với `ask=off`, exec trên máy chủ tuân theo chính sách đã cấu hình trực tiếp; không có lớp tiền lọc heuristic bổ sung để phát hiện làm rối lệnh hoặc lớp từ chối preflight script.
- `tools.exec.node` (mặc định: chưa đặt)
- `tools.exec.strictInlineEval` (mặc định: false): khi true, các dạng eval thông dịch viên inline như `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` và `osascript -e` luôn yêu cầu phê duyệt rõ ràng. `allow-always` vẫn có thể lưu giữ các lời gọi thông dịch viên/script lành tính, nhưng các dạng inline-eval vẫn nhắc mỗi lần.
- `tools.exec.commandHighlighting` (mặc định: false): khi true, lời nhắc phê duyệt có thể tô sáng các đoạn lệnh do parser suy ra trong văn bản lệnh. Đặt thành `true` toàn cục hoặc theo từng agent để bật tô sáng văn bản lệnh mà không thay đổi chính sách phê duyệt exec.
- `tools.exec.pathPrepend`: danh sách thư mục cần thêm vào đầu `PATH` cho các lần chạy exec (chỉ Gateway + sandbox).
- `tools.exec.safeBins`: các nhị phân an toàn chỉ nhận stdin có thể chạy mà không cần mục danh sách cho phép rõ ràng. Để biết chi tiết hành vi, xem [Nhị phân an toàn](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs`: các thư mục rõ ràng bổ sung được tin cậy cho kiểm tra đường dẫn `safeBins`. Các mục `PATH` không bao giờ được tự động tin cậy. Mặc định tích hợp là `/bin` và `/usr/bin`.
- `tools.exec.safeBinProfiles`: chính sách argv tùy chỉnh tùy chọn theo từng nhị phân an toàn (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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
  từ chối đối với thực thi trên máy chủ. Bản thân daemon vẫn chạy với `PATH` tối thiểu:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox`: chạy `sh -lc` (login shell) bên trong container, nên `/etc/profile` có thể đặt lại `PATH`.
  OpenClaw thêm `env.PATH` vào đầu sau khi source profile thông qua một biến môi trường nội bộ (không nội suy shell);
  `tools.exec.pathPrepend` cũng áp dụng ở đây.
- `host=node`: chỉ các ghi đè env không bị chặn mà bạn truyền vào được gửi đến Node. Các ghi đè `env.PATH` bị
  từ chối đối với thực thi trên máy chủ và bị máy chủ Node bỏ qua. Nếu cần thêm mục PATH trên Node,
  hãy cấu hình môi trường dịch vụ máy chủ Node (systemd/launchd) hoặc cài đặt công cụ ở vị trí chuẩn.

Liên kết Node theo từng agent (dùng chỉ mục danh sách agent trong cấu hình):

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Giao diện điều khiển: tab Nodes bao gồm một bảng nhỏ "Liên kết Exec node" cho cùng các thiết lập.

## Ghi đè phiên (`/exec`)

Dùng `/exec` để đặt mặc định **theo từng phiên** cho `host`, `security`, `ask` và `node`.
Gửi `/exec` không có đối số để hiển thị các giá trị hiện tại.

Ví dụ:

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Mô hình ủy quyền

`/exec` chỉ được tôn trọng cho **người gửi được ủy quyền** (danh sách cho phép/ghép nối kênh cộng với `commands.useAccessGroups`).
Nó chỉ cập nhật **trạng thái phiên** và không ghi cấu hình. Để tắt hẳn exec, hãy từ chối qua chính sách công cụ
(`tools.deny: ["exec"]` hoặc theo từng agent). Phê duyệt máy chủ vẫn áp dụng trừ khi bạn đặt rõ ràng
`security=full` và `ask=off`.

## Phê duyệt Exec (ứng dụng đồng hành / máy chủ Node)

Các agent trong sandbox có thể yêu cầu phê duyệt theo từng yêu cầu trước khi `exec` chạy trên máy chủ Gateway hoặc Node.
Xem [Phê duyệt Exec](/vi/tools/exec-approvals) để biết chính sách, danh sách cho phép và luồng UI.

Khi cần phê duyệt, công cụ exec trả về ngay lập tức với
`status: "approval-pending"` và một id phê duyệt. Sau khi được phê duyệt (hoặc bị từ chối / hết thời gian),
Gateway phát sự kiện hệ thống (`Exec finished` / `Exec denied`). Nếu lệnh vẫn
đang chạy sau `tools.exec.approvalRunningNoticeMs`, một thông báo `Exec running` duy nhất sẽ được phát.
Trên các kênh có thẻ/nút phê duyệt gốc, agent nên dựa vào UI
gốc đó trước và chỉ đưa vào lệnh `/approve` thủ công khi kết quả công cụ
nói rõ rằng phê duyệt qua chat không khả dụng hoặc phê duyệt thủ công là
đường dẫn duy nhất.

## Danh sách cho phép + nhị phân an toàn

Thực thi danh sách cho phép thủ công khớp các glob đường dẫn nhị phân đã phân giải và glob tên lệnh trần.
Tên trần chỉ khớp các lệnh được gọi thông qua PATH, nên `rg` có thể khớp
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng không khớp `./rg` hoặc `/tmp/rg`.
Khi `security=allowlist`, lệnh shell chỉ được tự động cho phép nếu mọi đoạn pipeline
đều nằm trong danh sách cho phép hoặc là nhị phân an toàn. Chaining (`;`, `&&`, `||`) và redirection
bị từ chối trong chế độ danh sách cho phép trừ khi mọi đoạn cấp cao nhất thỏa mãn
danh sách cho phép (bao gồm nhị phân an toàn). Redirection vẫn chưa được hỗ trợ.
Tin cậy bền vững `allow-always` không bỏ qua quy tắc đó: lệnh nối chuỗi vẫn yêu cầu mọi
đoạn cấp cao nhất phải khớp.

`autoAllowSkills` là một đường dẫn tiện ích riêng trong phê duyệt exec. Nó không giống với
các mục danh sách cho phép đường dẫn thủ công. Để có tin cậy rõ ràng nghiêm ngặt, hãy giữ `autoAllowSkills` bị tắt.

Dùng hai điều khiển cho các công việc khác nhau:

- `tools.exec.safeBins`: các bộ lọc luồng nhỏ, chỉ dùng stdin.
- `tools.exec.safeBinTrustedDirs`: các thư mục tin cậy bổ sung rõ ràng cho đường dẫn tệp thực thi safe-bin.
- `tools.exec.safeBinProfiles`: chính sách argv rõ ràng cho safe bin tùy chỉnh.
- danh sách cho phép: sự tin cậy rõ ràng cho đường dẫn tệp thực thi.

Đừng xem `safeBins` là một danh sách cho phép chung, và đừng thêm các tệp nhị phân trình thông dịch/runtime (ví dụ `python3`, `node`, `ruby`, `bash`). Nếu bạn cần các tệp đó, hãy dùng các mục danh sách cho phép rõ ràng và tiếp tục bật lời nhắc phê duyệt.
`openclaw security audit` cảnh báo khi các mục `safeBins` của trình thông dịch/runtime thiếu hồ sơ rõ ràng, và `openclaw doctor --fix` có thể dựng khung các mục `safeBinProfiles` tùy chỉnh còn thiếu.
`openclaw security audit` và `openclaw doctor` cũng cảnh báo khi bạn thêm rõ ràng các bin có hành vi rộng như `jq` trở lại vào `safeBins`.
Nếu bạn cho phép rõ ràng các trình thông dịch, hãy bật `tools.exec.strictInlineEval` để các dạng đánh giá mã nội tuyến vẫn cần phê duyệt mới.

Để biết đầy đủ chi tiết chính sách và ví dụ, hãy xem [Phê duyệt exec](/vi/tools/exec-approvals-advanced#safe-bins-stdin-only) và [Safe bins so với danh sách cho phép](/vi/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Thăm dò dùng để kiểm tra trạng thái theo yêu cầu, không phải vòng lặp chờ. Nếu đánh thức khi hoàn tất tự động
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

Dán (được đặt trong ngoặc theo mặc định):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` là một công cụ con của `exec` cho các chỉnh sửa nhiều tệp có cấu trúc.
Nó được bật theo mặc định cho các mô hình OpenAI và OpenAI Codex. Chỉ dùng cấu hình
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
- `deny: ["write"]` không từ chối `apply_patch`; hãy từ chối `apply_patch` rõ ràng hoặc dùng `deny: ["group:fs"]` khi các thao tác ghi bằng bản vá cũng cần bị chặn.
- Cấu hình nằm dưới `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` mặc định là `true`; đặt thành `false` để tắt công cụ cho các mô hình OpenAI.
- `tools.exec.applyPatch.workspaceOnly` mặc định là `true` (nằm trong workspace). Chỉ đặt thành `false` nếu bạn chủ ý muốn `apply_patch` ghi/xóa bên ngoài thư mục workspace.

## Liên quan

- [Phê duyệt Exec](/vi/tools/exec-approvals) — cổng phê duyệt cho lệnh shell
- [Sandboxing](/vi/gateway/sandboxing) — chạy lệnh trong môi trường sandbox
- [Tiến trình nền](/vi/gateway/background-process) — công cụ exec và process chạy lâu
- [Bảo mật](/vi/gateway/security) — chính sách công cụ và quyền truy cập nâng cao
