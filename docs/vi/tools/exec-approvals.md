---
read_when:
    - Cấu hình phê duyệt exec hoặc danh sách cho phép
    - Triển khai trải nghiệm phê duyệt exec trong ứng dụng macOS
    - Đánh giá các prompt thoát sandbox và tác động của chúng
sidebarTitle: Exec approvals
summary: 'Phê duyệt thực thi trên máy chủ: tùy chọn chính sách, danh sách cho phép và quy trình YOLO/nghiêm ngặt'
title: Phê duyệt thực thi
x-i18n:
    generated_at: "2026-05-10T19:53:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b1a9649161440bca445e318654b9a48a54ae1dbbca42349ac94b13ecc9fbfbd
    source_path: tools/exec-approvals.md
    workflow: 16
---

Phê duyệt exec là **hàng rào bảo vệ của ứng dụng đồng hành / máy chủ node** để cho phép
một agent trong sandbox chạy lệnh trên máy chủ thật (`gateway` hoặc `node`). Một
khóa liên động an toàn: lệnh chỉ được phép khi policy + allowlist +
phê duyệt người dùng (tùy chọn) đều đồng ý. Phê duyệt exec xếp **bên trên**
tool policy và cổng kiểm soát nâng quyền (trừ khi elevated được đặt thành `full`, khi đó
bỏ qua phê duyệt).

<Note>
Policy hiệu lực là phần **nghiêm ngặt hơn** giữa `tools.exec.*` và giá trị mặc định
của approvals; nếu một trường approvals bị bỏ qua, giá trị `tools.exec` sẽ được
dùng. Host exec cũng dùng trạng thái phê duyệt cục bộ trên máy đó - một
`ask: "always"` cục bộ của máy chủ trong `~/.openclaw/exec-approvals.json` sẽ tiếp tục
nhắc xác nhận ngay cả khi giá trị mặc định của phiên hoặc cấu hình yêu cầu `ask: "on-miss"`.
</Note>

## Kiểm tra policy hiệu lực

| Lệnh                                                             | Nội dung hiển thị                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Policy được yêu cầu, nguồn policy của máy chủ, và kết quả hiệu lực.                    |
| `openclaw exec-policy show`                                      | Chế độ xem hợp nhất trên máy cục bộ.                                                    |
| `openclaw exec-policy set` / `preset`                            | Đồng bộ policy được yêu cầu cục bộ với tệp phê duyệt máy chủ cục bộ trong một bước.    |

Khi một phạm vi cục bộ yêu cầu `host=node`, `exec-policy show` báo cáo
phạm vi đó là do node quản lý lúc runtime thay vì giả vờ rằng tệp
approvals cục bộ là nguồn chân lý.

Nếu UI của ứng dụng đồng hành **không khả dụng**, mọi yêu cầu vốn
thường sẽ nhắc xác nhận được xử lý bằng **ask fallback** (mặc định: `deny`).

<Tip>
Các máy khách phê duyệt chat native có thể gieo các tiện ích dành riêng cho kênh trên
thông báo phê duyệt đang chờ. Ví dụ, Matrix gieo các lối tắt phản ứng
(`✅` cho phép một lần, `❌` từ chối, `♾️` luôn cho phép) trong khi vẫn để
các lệnh `/approve ...` trong thông báo làm phương án dự phòng.
</Tip>

## Phạm vi áp dụng

Phê duyệt exec được thực thi cục bộ trên máy chủ thực thi:

- **Gateway host** → tiến trình `openclaw` trên máy Gateway.
- **Node host** → trình chạy node (ứng dụng đồng hành macOS hoặc máy chủ node headless).

### Mô hình tin cậy

- Các caller đã xác thực với Gateway được tin cậy là operator cho Gateway đó.
- Các node đã ghép cặp mở rộng năng lực operator được tin cậy đó sang máy chủ node.
- Phê duyệt exec giảm rủi ro thực thi ngoài ý muốn, nhưng **không** phải là ranh giới xác thực theo từng người dùng hoặc policy hệ thống tệp chỉ đọc.
- Sau khi được phê duyệt, một lệnh có thể thay đổi tệp theo quyền hệ thống tệp của máy chủ hoặc sandbox đã chọn.
- Các lượt chạy trên node host đã được phê duyệt ràng buộc ngữ cảnh thực thi chính tắc: cwd chính tắc, argv chính xác, ràng buộc env khi có, và đường dẫn thực thi đã ghim khi áp dụng.
- Với shell script và các lời gọi trực tiếp tệp interpreter/runtime, OpenClaw cũng cố ràng buộc một toán hạng tệp cục bộ cụ thể. Nếu tệp đã ràng buộc đó thay đổi sau khi phê duyệt nhưng trước khi thực thi, lượt chạy bị từ chối thay vì thực thi nội dung đã trôi lệch.
- Ràng buộc tệp có chủ ý là nỗ lực tốt nhất, **không** phải là một mô hình ngữ nghĩa đầy đủ cho mọi đường dẫn loader interpreter/runtime. Nếu chế độ phê duyệt không thể xác định chính xác một tệp cục bộ cụ thể để ràng buộc, nó sẽ từ chối tạo lượt chạy dựa trên phê duyệt thay vì giả vờ có độ bao phủ đầy đủ.

### Tách biệt trên macOS

- **Dịch vụ node host** chuyển tiếp `system.run` tới **ứng dụng macOS** qua IPC cục bộ.
- **Ứng dụng macOS** thực thi approvals và chạy lệnh trong ngữ cảnh UI.

## Cài đặt và lưu trữ

Approvals nằm trong một tệp JSON cục bộ trên máy chủ thực thi:

```text
~/.openclaw/exec-approvals.json
```

Ví dụ schema:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Núm chỉnh policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - chặn mọi yêu cầu host exec.
  - `allowlist` - chỉ cho phép các lệnh nằm trong allowlist.
  - `full` - cho phép tất cả (tương đương elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - không bao giờ nhắc.
  - `on-miss` - chỉ nhắc khi allowlist không khớp.
  - `always` - nhắc trên mọi lệnh. Tin cậy bền vững `allow-always` **không** chặn lời nhắc khi chế độ ask hiệu lực là `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Cách xử lý khi cần lời nhắc nhưng không thể truy cập UI.

- `deny` - chặn.
- `allowlist` - chỉ cho phép nếu allowlist khớp.
- `full` - cho phép.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Khi `true`, OpenClaw xem các dạng inline code-eval là chỉ được chạy khi có phê duyệt
  ngay cả khi chính binary interpreter đã nằm trong allowlist. Đây là phòng thủ theo chiều sâu
  cho các loader interpreter không ánh xạ gọn vào một toán hạng tệp ổn định
  duy nhất.
</ParamField>

Ví dụ mà chế độ strict bắt được:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Trong chế độ strict, các lệnh này vẫn cần phê duyệt rõ ràng, và
`allow-always` không tự động lưu các mục allowlist mới cho chúng.

## Chế độ YOLO (không phê duyệt)

Nếu bạn muốn host exec chạy mà không có lời nhắc phê duyệt, bạn phải mở
**cả hai** lớp policy - policy exec được yêu cầu trong cấu hình OpenClaw
(`tools.exec.*`) **và** policy phê duyệt cục bộ của máy chủ trong
`~/.openclaw/exec-approvals.json`.

YOLO là hành vi mặc định của máy chủ trừ khi bạn chủ động siết chặt:

| Lớp                  | Cài đặt YOLO               |
| -------------------- | -------------------------- |
| `tools.exec.security` | `full` trên `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Các điểm khác biệt quan trọng:**

- `tools.exec.host=auto` chọn exec chạy **ở đâu**: sandbox khi khả dụng, nếu không thì gateway.
- YOLO chọn host exec được phê duyệt **như thế nào**: `security=full` cộng với `ask=off`.
- Trong chế độ YOLO, OpenClaw **không** thêm một cổng phê duyệt heuristic riêng cho lệnh bị làm rối hoặc một lớp từ chối script-preflight bên trên policy host exec đã cấu hình.
- `auto` không biến định tuyến gateway thành quyền ghi đè tự do từ một phiên trong sandbox. Yêu cầu `host=node` theo từng lần gọi được phép từ `auto`; `host=gateway` chỉ được phép từ `auto` khi không có sandbox runtime nào đang hoạt động. Để có mặc định ổn định không phải auto, hãy đặt `tools.exec.host` hoặc dùng `/exec host=...` rõ ràng.

</Warning>

Các provider dựa trên CLI có cung cấp chế độ quyền không tương tác riêng
có thể tuân theo policy này. Claude CLI thêm
`--permission-mode bypassPermissions` khi policy exec được yêu cầu của OpenClaw
là YOLO. Ghi đè hành vi backend đó bằng các đối số Claude rõ ràng
trong `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
ví dụ `--permission-mode default`, `acceptEdits`, hoặc
`bypassPermissions`.

Nếu bạn muốn một thiết lập thận trọng hơn, hãy siết một trong hai lớp trở lại
`allowlist` / `on-miss` hoặc `deny`.

### Thiết lập "không bao giờ nhắc" bền vững cho gateway-host

<Steps>
  <Step title="Đặt policy cấu hình được yêu cầu">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Khớp tệp phê duyệt của máy chủ">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### Lối tắt cục bộ

```bash
openclaw exec-policy preset yolo
```

Lối tắt cục bộ đó cập nhật cả hai:

- `tools.exec.host/security/ask` cục bộ.
- Giá trị mặc định cục bộ trong `~/.openclaw/exec-approvals.json`.

Nó có chủ ý chỉ áp dụng cục bộ. Để thay đổi approvals của gateway-host hoặc node-host
từ xa, dùng `openclaw approvals set --gateway` hoặc
`openclaw approvals set --node <id|name|ip>`.

### Node host

Với một node host, hãy áp dụng cùng tệp approvals trên node đó:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**Giới hạn chỉ cục bộ:**

- `openclaw exec-policy` không đồng bộ approvals của node.
- `openclaw exec-policy set --host node` bị từ chối.
- Phê duyệt node exec được lấy từ node lúc runtime, vì vậy các cập nhật nhắm tới node phải dùng `openclaw approvals --node ...`.

</Note>

### Lối tắt chỉ cho phiên

- `/exec security=full ask=off` chỉ thay đổi phiên hiện tại.
- `/elevated full` là lối tắt phá kính khẩn cấp cũng bỏ qua phê duyệt exec cho phiên đó.

Nếu tệp approvals của máy chủ vẫn nghiêm ngặt hơn cấu hình, policy máy chủ
nghiêm ngặt hơn vẫn thắng.

## Allowlist (theo agent)

Allowlists là **theo từng agent**. Nếu có nhiều agent, hãy chuyển agent
bạn đang chỉnh sửa trong ứng dụng macOS. Patterns là các khớp glob.

Patterns có thể là glob đường dẫn binary đã phân giải hoặc glob tên lệnh trần.
Tên trần chỉ khớp các lệnh được gọi qua `PATH`, vì vậy `rg` có thể khớp
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng **không** khớp `./rg` hoặc
`/tmp/rg`. Dùng glob đường dẫn khi bạn muốn tin cậy một vị trí binary
cụ thể.

Các mục `agents.default` cũ được di trú sang `agents.main` khi tải.
Các chuỗi shell như `echo ok && pwd` vẫn cần mọi phân đoạn cấp cao nhất
thỏa mãn quy tắc allowlist.

Ví dụ:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Hạn chế đối số bằng argPattern

Thêm `argPattern` khi một mục allowlist nên khớp một binary và một
hình dạng đối số cụ thể. OpenClaw đánh giá biểu thức chính quy
trên các đối số lệnh đã phân tích, không gồm token thực thi
(`argv[0]`). Với các mục viết tay, đối số được nối bằng một
dấu cách đơn, vì vậy hãy neo pattern khi bạn cần khớp chính xác.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

Mục đó cho phép `python3 safe.py`; `python3 other.py` là một lần trượt allowlist.
Nếu cũng có một mục chỉ-đường-dẫn cho cùng binary, các đối số không khớp
vẫn có thể rơi về mục chỉ-đường-dẫn đó. Bỏ qua mục chỉ-đường-dẫn khi
mục tiêu là hạn chế binary vào các đối số đã khai báo.

Các mục được lưu bởi luồng phê duyệt có thể dùng định dạng dấu phân cách nội bộ để
khớp argv chính xác. Ưu tiên UI hoặc luồng phê duyệt để tái tạo các
mục đó thay vì chỉnh tay giá trị đã mã hóa. Nếu OpenClaw không thể
phân tích argv cho một phân đoạn lệnh, các mục có `argPattern` sẽ không khớp.

Mỗi mục allowlist hỗ trợ:

| Trường             | Ý nghĩa                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob đường dẫn binary đã phân giải hoặc glob tên lệnh trần    |
| `argPattern`       | Regex argv tùy chọn; các mục bị bỏ qua chỉ khớp theo đường dẫn |
| `id`               | UUID ổn định dùng cho danh tính UI                            |
| `source`           | Nguồn mục, chẳng hạn như `allow-always`                       |
| `commandText`      | Văn bản lệnh được ghi lại khi một luồng phê duyệt tạo mục      |
| `lastUsedAt`       | Dấu thời gian lần dùng gần nhất                               |
| `lastUsedCommand`  | Lệnh gần nhất đã khớp                                         |
| `lastResolvedPath` | Đường dẫn binary đã phân giải gần nhất                        |

## Tự động cho phép CLI của skill

Khi bật **Tự động cho phép CLI của skill**, các executable được tham chiếu bởi
các skill đã biết được xem là nằm trong allowlist trên các Node (Node macOS hoặc máy chủ
Node headless). Tính năng này dùng `skills.bins` qua Gateway RPC để lấy
danh sách bin của skill. Tắt tùy chọn này nếu bạn muốn allowlist thủ công nghiêm ngặt.

<Warning>
- Đây là một **allowlist tiện lợi ngầm định**, tách biệt với các mục allowlist đường dẫn thủ công.
- Nó dành cho các môi trường operator đáng tin cậy, nơi Gateway và Node nằm trong cùng một ranh giới tin cậy.
- Nếu bạn cần độ tin cậy tường minh nghiêm ngặt, hãy giữ `autoAllowSkills: false` và chỉ dùng các mục allowlist đường dẫn thủ công.

</Warning>

## Bin an toàn và chuyển tiếp phê duyệt

Đối với bin an toàn (fast-path chỉ dùng stdin), chi tiết binding interpreter, và
cách chuyển tiếp lời nhắc phê duyệt đến Slack/Discord/Telegram (hoặc chạy chúng như
client phê duyệt native), xem
[Phê duyệt exec - nâng cao](/vi/tools/exec-approvals-advanced).

## Chỉnh sửa UI điều khiển

Dùng thẻ **UI điều khiển → Node → Phê duyệt exec** để chỉnh sửa mặc định,
ghi đè theo từng agent và allowlist. Chọn một phạm vi (Mặc định hoặc một agent),
tinh chỉnh policy, thêm/xóa các mẫu allowlist, rồi **Lưu**. UI
hiển thị metadata lần dùng gần nhất cho từng mẫu để bạn có thể giữ danh sách gọn gàng.

Bộ chọn mục tiêu chọn **Gateway** (phê duyệt cục bộ) hoặc một **Node**.
Node phải quảng bá `system.execApprovals.get/set` (ứng dụng macOS hoặc
máy chủ Node headless). Nếu một Node chưa quảng bá phê duyệt exec,
hãy chỉnh sửa trực tiếp `~/.openclaw/exec-approvals.json` cục bộ của nó.

CLI: `openclaw approvals` hỗ trợ chỉnh sửa Gateway hoặc Node - xem
[CLI phê duyệt](/vi/cli/approvals).

## Luồng phê duyệt

Khi cần lời nhắc, gateway phát sóng
`exec.approval.requested` đến các client operator. UI điều khiển và ứng dụng macOS
xử lý nó qua `exec.approval.resolve`, sau đó gateway chuyển tiếp yêu cầu
đã phê duyệt đến máy chủ Node.

Đối với `host=node`, yêu cầu phê duyệt bao gồm payload `systemRunPlan`
chuẩn hóa. Gateway dùng plan đó làm ngữ cảnh
command/cwd/session có thẩm quyền khi chuyển tiếp các yêu cầu `system.run`
đã phê duyệt.

Điều đó quan trọng đối với độ trễ phê duyệt async:

- Đường dẫn exec của Node chuẩn bị trước một plan chuẩn hóa.
- Bản ghi phê duyệt lưu plan đó và metadata binding của nó.
- Sau khi được phê duyệt, lệnh gọi `system.run` được chuyển tiếp cuối cùng tái sử dụng plan đã lưu thay vì tin vào các chỉnh sửa sau đó của caller.
- Nếu caller thay đổi `command`, `rawCommand`, `cwd`, `agentId`, hoặc `sessionKey` sau khi yêu cầu phê duyệt được tạo, gateway sẽ từ chối lượt chạy được chuyển tiếp do phê duyệt không khớp.

## Sự kiện hệ thống

Vòng đời exec được hiển thị dưới dạng thông báo hệ thống:

- `Exec running` (chỉ khi lệnh vượt quá ngưỡng thông báo đang chạy).
- `Exec finished`.
- `Exec denied`.

Các thông báo này được đăng vào session của agent sau khi Node báo cáo sự kiện.
Phê duyệt exec do Gateway-host phát ra cùng các sự kiện vòng đời khi
lệnh kết thúc (và tùy chọn khi chạy lâu hơn ngưỡng).
Các exec bị chặn bởi phê duyệt tái sử dụng id phê duyệt làm `runId` trong các
thông báo này để dễ tương quan.

## Hành vi khi phê duyệt bị từ chối

Khi một phê duyệt exec async bị từ chối, OpenClaw ngăn agent
tái sử dụng output từ bất kỳ lượt chạy trước đó nào của cùng lệnh trong session.
Lý do từ chối được truyền kèm hướng dẫn rõ ràng rằng không có output lệnh
nào khả dụng, điều này ngăn agent tuyên bố có output mới hoặc
lặp lại lệnh bị từ chối với kết quả cũ từ một lượt chạy thành công trước đó.

## Hệ quả

- **`full`** rất mạnh; ưu tiên allowlist khi có thể.
- **`ask`** giữ bạn trong vòng kiểm soát trong khi vẫn cho phép phê duyệt nhanh.
- Allowlist theo từng agent ngăn phê duyệt của một agent lan sang các agent khác.
- Phê duyệt chỉ áp dụng cho yêu cầu exec trên host từ **sender được ủy quyền**. Sender không được ủy quyền không thể phát hành `/exec`.
- `/exec security=full` là tiện ích cấp session cho operator được ủy quyền và bỏ qua phê duyệt theo thiết kế. Để chặn cứng exec trên host, đặt bảo mật phê duyệt thành `deny` hoặc từ chối công cụ `exec` qua tool policy.

## Liên quan

<CardGroup cols={2}>
  <Card title="Phê duyệt exec - nâng cao" href="/vi/tools/exec-approvals-advanced" icon="gear">
    Bin an toàn, binding interpreter và chuyển tiếp phê duyệt đến chat.
  </Card>
  <Card title="Công cụ exec" href="/vi/tools/exec" icon="terminal">
    Công cụ thực thi lệnh shell.
  </Card>
  <Card title="Chế độ nâng quyền" href="/vi/tools/elevated" icon="shield-exclamation">
    Đường dẫn break-glass cũng bỏ qua phê duyệt.
  </Card>
  <Card title="Cách ly sandbox" href="/vi/gateway/sandboxing" icon="box">
    Chế độ sandbox và quyền truy cập workspace.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security" icon="lock">
    Mô hình bảo mật và gia cố.
  </Card>
  <Card title="Sandbox so với tool policy so với nâng quyền" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Khi nào nên dùng từng biện pháp kiểm soát.
  </Card>
  <Card title="Skills" href="/vi/tools/skills" icon="sparkles">
    Hành vi tự động cho phép dựa trên skill.
  </Card>
</CardGroup>
