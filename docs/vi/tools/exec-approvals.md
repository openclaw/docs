---
read_when:
    - Cấu hình phê duyệt thực thi hoặc danh sách cho phép
    - Triển khai UX phê duyệt exec trong ứng dụng macOS
    - Đang xem xét các lời nhắc thoát khỏi môi trường cách ly và những hệ quả của chúng
sidebarTitle: Exec approvals
summary: 'Phê duyệt thực thi trên host: các tùy chọn điều chỉnh chính sách, danh sách cho phép và quy trình làm việc YOLO/nghiêm ngặt'
title: Phê duyệt thực thi
x-i18n:
    generated_at: "2026-05-06T09:33:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec approvals là **cơ chế bảo vệ của ứng dụng đồng hành / Node host** để cho phép
agent trong sandbox chạy lệnh trên host thật (`gateway` hoặc `node`). Đây là
khóa liên động an toàn: lệnh chỉ được phép khi policy + allowlist +
tùy chọn user approval cùng đồng ý. Exec approvals xếp **chồng lên trên**
tool policy và elevated gating (trừ khi elevated được đặt thành `full`, khi đó
bỏ qua approvals).

<Note>
Policy hiệu lực là policy **nghiêm ngặt hơn** giữa `tools.exec.*` và các giá trị
mặc định của approvals; nếu một trường approvals bị bỏ qua, giá trị `tools.exec`
sẽ được dùng. Host exec cũng dùng trạng thái approvals cục bộ trên máy đó - một
`ask: "always"` cục bộ của host trong `~/.openclaw/exec-approvals.json` sẽ tiếp tục
nhắc, ngay cả khi session hoặc giá trị mặc định trong config yêu cầu `ask: "on-miss"`.
</Note>

## Kiểm tra policy hiệu lực

| Lệnh                                                             | Nội dung hiển thị                                                                       |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Policy được yêu cầu, nguồn policy của host, và kết quả hiệu lực.                       |
| `openclaw exec-policy show`                                      | Dạng xem đã hợp nhất trên máy cục bộ.                                                   |
| `openclaw exec-policy set` / `preset`                            | Đồng bộ policy được yêu cầu cục bộ với tệp approvals của host cục bộ trong một bước. |

Khi một scope cục bộ yêu cầu `host=node`, `exec-policy show` báo cáo scope đó
là do node quản lý lúc runtime thay vì giả vờ tệp approvals cục bộ là nguồn sự thật.

Nếu UI của ứng dụng đồng hành **không khả dụng**, mọi yêu cầu vốn bình thường
sẽ nhắc đều được xử lý bằng **ask fallback** (mặc định: `deny`).

<Tip>
Các client phê duyệt chat native có thể tạo sẵn các tiện ích theo kênh trên
thông báo phê duyệt đang chờ. Ví dụ, Matrix tạo sẵn phím tắt reaction
(`✅` cho phép một lần, `❌` từ chối, `♾️` luôn cho phép) trong khi vẫn giữ
các lệnh `/approve ...` trong thông báo làm phương án dự phòng.
</Tip>

## Nơi áp dụng

Exec approvals được thực thi cục bộ trên host thực thi:

- **Gateway host** → tiến trình `openclaw` trên máy gateway.
- **Node host** → trình chạy node (ứng dụng đồng hành macOS hoặc Node host headless).

### Mô hình tin cậy

- Caller đã xác thực qua Gateway là operator được tin cậy cho Gateway đó.
- Các node đã ghép cặp mở rộng năng lực operator được tin cậy đó lên Node host.
- Exec approvals giảm rủi ro thực thi vô tình, nhưng **không** phải ranh giới xác thực theo từng user.
- Các lượt chạy Node host đã được phê duyệt ràng buộc ngữ cảnh thực thi chuẩn: cwd chuẩn, argv chính xác, ràng buộc env khi có, và đường dẫn executable được ghim khi áp dụng.
- Với shell script và các invocation trực tiếp tới tệp interpreter/runtime, OpenClaw cũng cố gắng ràng buộc một toán hạng tệp cục bộ cụ thể. Nếu tệp đã ràng buộc đó thay đổi sau khi phê duyệt nhưng trước khi thực thi, lượt chạy sẽ bị từ chối thay vì thực thi nội dung đã lệch.
- Ràng buộc tệp là cơ chế best-effort có chủ ý, **không** phải mô hình ngữ nghĩa hoàn chỉnh cho mọi đường dẫn loader của interpreter/runtime. Nếu chế độ phê duyệt không thể xác định đúng một tệp cục bộ cụ thể để ràng buộc, nó sẽ từ chối tạo lượt chạy dựa trên phê duyệt thay vì giả vờ có độ bao phủ đầy đủ.

### Tách trên macOS

- **Dịch vụ Node host** chuyển tiếp `system.run` tới **ứng dụng macOS** qua IPC cục bộ.
- **Ứng dụng macOS** thực thi approvals và chạy lệnh trong ngữ cảnh UI.

## Cài đặt và lưu trữ

Approvals nằm trong một tệp JSON cục bộ trên host thực thi:

```text
~/.openclaw/exec-approvals.json
```

Schema ví dụ:

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
  - `allowlist` - chỉ cho phép các lệnh có trong allowlist.
  - `full` - cho phép mọi thứ (tương đương elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - không bao giờ nhắc.
  - `on-miss` - chỉ nhắc khi allowlist không khớp.
  - `always` - nhắc trên mọi lệnh. Tin cậy lâu dài `allow-always` **không** ngăn nhắc khi chế độ ask hiệu lực là `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Cách xử lý khi cần prompt nhưng không thể truy cập UI.

- `deny` - chặn.
- `allowlist` - chỉ cho phép nếu allowlist khớp.
- `full` - cho phép.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Khi là `true`, OpenClaw coi các dạng inline code-eval là chỉ được chạy sau phê duyệt,
  ngay cả khi chính binary interpreter đã có trong allowlist. Đây là lớp phòng vệ bổ sung
  cho các loader interpreter không ánh xạ gọn vào một toán hạng tệp ổn định.
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

## Chế độ YOLO (không cần phê duyệt)

Nếu bạn muốn host exec chạy mà không có prompt phê duyệt, bạn phải mở
**cả hai** lớp policy - policy exec được yêu cầu trong config OpenClaw
(`tools.exec.*`) **và** policy approvals cục bộ của host trong
`~/.openclaw/exec-approvals.json`.

YOLO là hành vi mặc định của host trừ khi bạn siết chặt rõ ràng:

| Lớp                  | Cài đặt YOLO               |
| -------------------- | -------------------------- |
| `tools.exec.security` | `full` trên `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Các điểm khác biệt quan trọng:**

- `tools.exec.host=auto` chọn exec chạy **ở đâu**: sandbox khi khả dụng, nếu không thì gateway.
- YOLO chọn host exec được phê duyệt **như thế nào**: `security=full` cộng với `ask=off`.
- Trong chế độ YOLO, OpenClaw **không** thêm một gate phê duyệt heuristic riêng cho lệnh bị làm rối hoặc lớp từ chối script-preflight ở trên policy host exec đã cấu hình.
- `auto` không biến định tuyến gateway thành một override miễn phí từ session trong sandbox. Một yêu cầu theo từng lời gọi `host=node` được phép từ `auto`; `host=gateway` chỉ được phép từ `auto` khi không có sandbox runtime đang hoạt động. Để có mặc định ổn định không phải auto, đặt `tools.exec.host` hoặc dùng `/exec host=...` rõ ràng.

</Warning>

Các provider dựa trên CLI có chế độ quyền không tương tác riêng
có thể tuân theo policy này. Claude CLI thêm
`--permission-mode bypassPermissions` khi policy exec được yêu cầu của OpenClaw
là YOLO. Ghi đè hành vi backend đó bằng các đối số Claude rõ ràng
trong `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
ví dụ `--permission-mode default`, `acceptEdits`, hoặc
`bypassPermissions`.

Nếu bạn muốn cấu hình thận trọng hơn, siết một trong hai lớp lại thành
`allowlist` / `on-miss` hoặc `deny`.

### Thiết lập Gateway host "không bao giờ nhắc" bền vững

<Steps>
  <Step title="Đặt policy config được yêu cầu">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Khớp tệp approvals của host">
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
- Các giá trị mặc định cục bộ trong `~/.openclaw/exec-approvals.json`.

Nó cố ý chỉ áp dụng cục bộ. Để thay đổi approvals của Gateway host hoặc
Node host từ xa, dùng `openclaw approvals set --gateway` hoặc
`openclaw approvals set --node <id|name|ip>`.

### Node host

Với Node host, thay vào đó áp dụng cùng tệp approvals trên node đó:

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
- Exec approvals của node được lấy từ node lúc runtime, vì vậy các cập nhật nhắm tới node phải dùng `openclaw approvals --node ...`.

</Note>

### Lối tắt chỉ cho session

- `/exec security=full ask=off` chỉ thay đổi session hiện tại.
- `/elevated full` là lối tắt khẩn cấp cũng bỏ qua exec approvals cho session đó.

Nếu tệp approvals của host vẫn nghiêm ngặt hơn config, policy nghiêm ngặt hơn của host
vẫn thắng.

## Allowlist (theo agent)

Allowlists là **theo từng agent**. Nếu có nhiều agent, hãy chuyển agent
bạn đang chỉnh sửa trong ứng dụng macOS. Patterns là các kết quả khớp glob.

Patterns có thể là glob đường dẫn binary đã phân giải hoặc glob tên lệnh trần.
Tên trần chỉ khớp các lệnh được gọi qua `PATH`, vì vậy `rg` có thể khớp
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng **không** khớp `./rg` hoặc
`/tmp/rg`. Dùng glob đường dẫn khi bạn muốn tin cậy một vị trí binary cụ thể.

Các mục `agents.default` cũ được migrate sang `agents.main` khi tải.
Các chuỗi shell như `echo ok && pwd` vẫn cần mọi segment cấp cao nhất
thỏa mãn quy tắc allowlist.

Ví dụ:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Hạn chế đối số bằng argPattern

Thêm `argPattern` khi một mục allowlist cần khớp một binary và một
hình dạng đối số cụ thể. OpenClaw đánh giá biểu thức chính quy
trên các đối số lệnh đã parse, loại trừ token executable
(`argv[0]`). Với các mục viết thủ công, đối số được nối bằng một
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

Mục đó cho phép `python3 safe.py`; `python3 other.py` là allowlist
miss. Nếu cũng có một mục chỉ theo đường dẫn cho cùng binary, các đối số
không khớp vẫn có thể fallback về mục chỉ theo đường dẫn đó. Bỏ qua mục chỉ theo đường dẫn
khi mục tiêu là hạn chế binary vào các đối số đã khai báo.

Các mục được lưu bởi luồng phê duyệt có thể dùng định dạng dấu phân tách nội bộ để
khớp argv chính xác. Ưu tiên UI hoặc luồng phê duyệt để tạo lại các
mục đó thay vì chỉnh sửa thủ công giá trị đã mã hóa. Nếu OpenClaw không thể
parse argv cho một segment lệnh, các mục có `argPattern` sẽ không khớp.

Mỗi mục allowlist hỗ trợ:

| Trường            | Ý nghĩa                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob đường dẫn nhị phân đã phân giải hoặc glob tên lệnh trần |
| `argPattern`       | Regex argv tùy chọn; các mục bị bỏ qua chỉ khớp theo đường dẫn |
| `id`               | UUID ổn định dùng cho định danh UI                            |
| `source`           | Nguồn mục nhập, chẳng hạn như `allow-always`                  |
| `commandText`      | Văn bản lệnh được ghi lại khi luồng phê duyệt tạo mục nhập    |
| `lastUsedAt`       | Dấu thời gian lần dùng gần nhất                               |
| `lastUsedCommand`  | Lệnh gần nhất đã khớp                                         |
| `lastResolvedPath` | Đường dẫn nhị phân đã phân giải gần nhất                      |

## Tự động cho phép CLI của Skills

Khi bật **Tự động cho phép CLI của Skills**, các tệp thực thi được tham chiếu bởi
Skills đã biết sẽ được coi là nằm trong allowlist trên các node (node macOS hoặc
máy chủ node headless). Tính năng này dùng `skills.bins` qua Gateway RPC để lấy
danh sách bin của Skills. Tắt tùy chọn này nếu bạn muốn dùng allowlist thủ công nghiêm ngặt.

<Warning>
- Đây là một **allowlist tiện ích ngầm định**, tách biệt với các mục allowlist đường dẫn thủ công.
- Tính năng này dành cho các môi trường vận hành đáng tin cậy, nơi Gateway và node nằm trong cùng ranh giới tin cậy.
- Nếu bạn yêu cầu tin cậy tường minh nghiêm ngặt, hãy giữ `autoAllowSkills: false` và chỉ dùng các mục allowlist đường dẫn thủ công.

</Warning>

## Bin an toàn và chuyển tiếp phê duyệt

Để biết về bin an toàn (đường nhanh chỉ dùng stdin), chi tiết liên kết trình thông dịch và
cách chuyển tiếp lời nhắc phê duyệt đến Slack/Discord/Telegram (hoặc chạy chúng như
ứng dụng phê duyệt gốc), xem
[Phê duyệt exec - nâng cao](/vi/tools/exec-approvals-advanced).

## Chỉnh sửa trong Control UI

Dùng thẻ **Control UI → Nodes → Exec approvals** để chỉnh sửa mặc định,
ghi đè theo từng agent và allowlist. Chọn một phạm vi (Mặc định hoặc một agent),
điều chỉnh chính sách, thêm/xóa mẫu allowlist, rồi **Lưu**. UI
hiển thị siêu dữ liệu lần dùng gần nhất theo từng mẫu để bạn có thể giữ danh sách gọn gàng.

Bộ chọn mục tiêu chọn **Gateway** (phê duyệt cục bộ) hoặc một **Node**.
Node phải quảng bá `system.execApprovals.get/set` (ứng dụng macOS hoặc
máy chủ node headless). Nếu một node chưa quảng bá phê duyệt exec,
hãy chỉnh sửa trực tiếp `~/.openclaw/exec-approvals.json` cục bộ của node đó.

CLI: `openclaw approvals` hỗ trợ chỉnh sửa gateway hoặc node - xem
[CLI phê duyệt](/vi/cli/approvals).

## Luồng phê duyệt

Khi cần lời nhắc, gateway phát
`exec.approval.requested` đến các ứng dụng khách vận hành. Control UI và ứng dụng macOS
xử lý lời nhắc qua `exec.approval.resolve`, sau đó gateway chuyển tiếp yêu cầu
đã được phê duyệt đến máy chủ node.

Đối với `host=node`, yêu cầu phê duyệt bao gồm payload `systemRunPlan`
chuẩn tắc. Gateway dùng kế hoạch đó làm ngữ cảnh
command/cwd/session có thẩm quyền khi chuyển tiếp các yêu cầu `system.run`
đã được phê duyệt.

Điều đó quan trọng với độ trễ phê duyệt bất đồng bộ:

- Đường exec của node chuẩn bị trước một kế hoạch chuẩn tắc.
- Bản ghi phê duyệt lưu kế hoạch đó và siêu dữ liệu liên kết của nó.
- Sau khi được phê duyệt, lệnh gọi `system.run` cuối cùng được chuyển tiếp sẽ dùng lại kế hoạch đã lưu thay vì tin vào các chỉnh sửa sau đó của bên gọi.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc `sessionKey` sau khi yêu cầu phê duyệt được tạo, gateway sẽ từ chối lượt chạy được chuyển tiếp vì phê duyệt không khớp.

## Sự kiện hệ thống

Vòng đời exec được hiển thị dưới dạng thông báo hệ thống:

- `Exec running` (chỉ khi lệnh vượt quá ngưỡng thông báo đang chạy).
- `Exec finished`.
- `Exec denied`.

Các thông báo này được đăng vào phiên của agent sau khi node báo cáo sự kiện.
Phê duyệt exec do Gateway lưu trữ phát ra cùng các sự kiện vòng đời khi
lệnh kết thúc (và tùy chọn khi chạy lâu hơn ngưỡng).
Các exec được chặn bởi phê duyệt dùng lại id phê duyệt làm `runId` trong các
thông báo này để dễ đối chiếu.

## Hành vi khi phê duyệt bị từ chối

Khi một phê duyệt exec bất đồng bộ bị từ chối, OpenClaw ngăn agent
dùng lại đầu ra từ bất kỳ lượt chạy trước đó nào của cùng lệnh trong phiên.
Lý do từ chối được truyền kèm hướng dẫn tường minh rằng không có đầu ra lệnh
khả dụng, điều này ngăn agent tuyên bố có đầu ra mới hoặc
lặp lại lệnh bị từ chối với kết quả cũ từ một lượt chạy thành công trước đó.

## Hệ quả

- **`full`** rất mạnh; ưu tiên allowlist khi có thể.
- **`ask`** giữ bạn trong vòng kiểm soát trong khi vẫn cho phép phê duyệt nhanh.
- Allowlist theo từng agent ngăn phê duyệt của một agent rò rỉ sang agent khác.
- Phê duyệt chỉ áp dụng cho các yêu cầu exec trên host từ **người gửi được ủy quyền**. Người gửi không được ủy quyền không thể phát hành `/exec`.
- `/exec security=full` là tiện ích cấp phiên cho người vận hành được ủy quyền và bỏ qua phê duyệt theo thiết kế. Để chặn cứng exec trên host, đặt bảo mật phê duyệt thành `deny` hoặc từ chối công cụ `exec` qua chính sách công cụ.

## Liên quan

<CardGroup cols={2}>
  <Card title="Phê duyệt exec - nâng cao" href="/vi/tools/exec-approvals-advanced" icon="gear">
    Bin an toàn, liên kết trình thông dịch và chuyển tiếp phê duyệt đến trò chuyện.
  </Card>
  <Card title="Công cụ exec" href="/vi/tools/exec" icon="terminal">
    Công cụ thực thi lệnh shell.
  </Card>
  <Card title="Chế độ nâng cao" href="/vi/tools/elevated" icon="shield-exclamation">
    Đường xử lý khẩn cấp cũng bỏ qua phê duyệt.
  </Card>
  <Card title="Sandboxing" href="/vi/gateway/sandboxing" icon="box">
    Chế độ sandbox và quyền truy cập workspace.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security" icon="lock">
    Mô hình bảo mật và gia cố.
  </Card>
  <Card title="Sandbox so với chính sách công cụ so với nâng cao" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Khi nào nên dùng từng cơ chế kiểm soát.
  </Card>
  <Card title="Skills" href="/vi/tools/skills" icon="sparkles">
    Hành vi tự động cho phép dựa trên Skills.
  </Card>
</CardGroup>
