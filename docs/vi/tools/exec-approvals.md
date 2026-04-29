---
read_when:
    - Cấu hình phê duyệt exec hoặc danh sách cho phép
    - Triển khai UX phê duyệt exec trong ứng dụng macOS
    - Đánh giá các lời nhắc thoát khỏi hộp cát và hệ quả của chúng
sidebarTitle: Exec approvals
summary: 'Phê duyệt thực thi trên máy chủ: tùy chọn điều chỉnh chính sách, danh sách cho phép và quy trình làm việc YOLO/strict'
title: Phê duyệt thực thi
x-i18n:
    generated_at: "2026-04-29T23:18:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71c16d0e547c4dd42a351d37e37e97b681a062cd496d5e0cba923b54c8f5b0e9
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec approvals là **lan can bảo vệ của ứng dụng đồng hành / node host** để cho phép
một tác nhân trong sandbox chạy lệnh trên host thật (`gateway` hoặc `node`). Đây là
một khóa liên động an toàn: lệnh chỉ được phép khi chính sách + danh sách cho phép +
(phần tùy chọn) phê duyệt của người dùng đều đồng ý. Exec approvals được xếp **bên trên**
chính sách công cụ và cổng nâng quyền (trừ khi nâng quyền được đặt thành `full`, khi đó
sẽ bỏ qua phê duyệt).

<Note>
Chính sách hiệu lực là chính sách **nghiêm ngặt hơn** giữa `tools.exec.*` và các
mặc định phê duyệt; nếu một trường phê duyệt bị bỏ qua, giá trị `tools.exec` sẽ được
dùng. Host exec cũng dùng trạng thái phê duyệt cục bộ trên máy đó — một
`ask: "always"` cục bộ của host trong `~/.openclaw/exec-approvals.json` vẫn tiếp tục
nhắc ngay cả khi mặc định phiên hoặc cấu hình yêu cầu `ask: "on-miss"`.
</Note>

## Kiểm tra chính sách hiệu lực

| Lệnh                                                             | Nội dung hiển thị                                                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Chính sách được yêu cầu, các nguồn chính sách của host, và kết quả hiệu lực.           |
| `openclaw exec-policy show`                                      | Khung nhìn đã hợp nhất trên máy cục bộ.                                                 |
| `openclaw exec-policy set` / `preset`                            | Đồng bộ hóa chính sách cục bộ được yêu cầu với tệp phê duyệt host cục bộ trong một bước. |

Khi một phạm vi cục bộ yêu cầu `host=node`, `exec-policy show` báo cáo
phạm vi đó là do node quản lý lúc chạy thay vì giả vờ rằng tệp phê duyệt
cục bộ là nguồn sự thật.

Nếu UI ứng dụng đồng hành **không khả dụng**, mọi yêu cầu vốn thường sẽ
nhắc đều được giải quyết bằng **dự phòng khi hỏi** (mặc định: `deny`).

<Tip>
Các client phê duyệt chat gốc có thể gieo sẵn các tiện ích theo kênh trên
thông báo phê duyệt đang chờ. Ví dụ, Matrix gieo sẵn lối tắt phản ứng
(`✅` cho phép một lần, `❌` từ chối, `♾️` luôn cho phép) trong khi vẫn để lại
các lệnh `/approve ...` trong thông báo làm phương án dự phòng.
</Tip>

## Nơi áp dụng

Exec approvals được thực thi cục bộ trên host thực thi:

- **Gateway host** → tiến trình `openclaw` trên máy Gateway.
- **Node host** → node runner (ứng dụng đồng hành macOS hoặc node host headless).

### Mô hình tin cậy

- Các caller đã xác thực qua Gateway là operator đáng tin cậy cho Gateway đó.
- Các node đã ghép cặp mở rộng khả năng operator đáng tin cậy đó sang node host.
- Exec approvals giảm rủi ro thực thi ngoài ý muốn, nhưng **không** phải là ranh giới xác thực theo từng người dùng.
- Các lần chạy trên node-host đã được phê duyệt sẽ ràng buộc ngữ cảnh thực thi chuẩn: cwd chuẩn, argv chính xác, ràng buộc env khi có, và đường dẫn executable được ghim khi áp dụng.
- Với shell script và các lần gọi tệp interpreter/runtime trực tiếp, OpenClaw cũng cố ràng buộc một toán hạng tệp cục bộ cụ thể. Nếu tệp đã ràng buộc đó thay đổi sau khi phê duyệt nhưng trước khi thực thi, lần chạy sẽ bị từ chối thay vì thực thi nội dung đã trôi lệch.
- Ràng buộc tệp là nỗ lực tối đa có chủ ý, **không** phải là mô hình ngữ nghĩa hoàn chỉnh cho mọi đường dẫn loader của interpreter/runtime. Nếu chế độ phê duyệt không thể xác định đúng một tệp cục bộ cụ thể để ràng buộc, nó từ chối tạo một lần chạy dựa trên phê duyệt thay vì giả vờ có độ bao phủ đầy đủ.

### Phân tách macOS

- **Dịch vụ node host** chuyển tiếp `system.run` đến **ứng dụng macOS** qua IPC cục bộ.
- **Ứng dụng macOS** thực thi phê duyệt và chạy lệnh trong ngữ cảnh UI.

## Cài đặt và lưu trữ

Phê duyệt nằm trong một tệp JSON cục bộ trên host thực thi:

```text
~/.openclaw/exec-approvals.json
```

Lược đồ ví dụ:

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

## Núm chính sách

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` — chặn mọi yêu cầu host exec.
  - `allowlist` — chỉ cho phép các lệnh trong danh sách cho phép.
  - `full` — cho phép mọi thứ (tương đương với nâng quyền).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` — không bao giờ nhắc.
  - `on-miss` — chỉ nhắc khi danh sách cho phép không khớp.
  - `always` — nhắc trên mọi lệnh. Niềm tin bền vững `allow-always` **không** chặn lời nhắc khi chế độ hỏi hiệu lực là `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Cách giải quyết khi cần nhắc nhưng không có UI nào truy cập được.

- `deny` — chặn.
- `allowlist` — chỉ cho phép nếu danh sách cho phép khớp.
- `full` — cho phép.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Khi là `true`, OpenClaw xem các dạng eval mã nội tuyến là chỉ được phê duyệt
  ngay cả khi chính binary interpreter đã nằm trong danh sách cho phép. Đây là
  phòng thủ theo chiều sâu cho các loader interpreter không ánh xạ gọn gàng đến
  một toán hạng tệp ổn định.
</ParamField>

Các ví dụ mà chế độ nghiêm ngặt bắt được:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Trong chế độ nghiêm ngặt, các lệnh này vẫn cần phê duyệt rõ ràng, và
`allow-always` không tự động lưu các mục danh sách cho phép mới cho chúng.

## Chế độ YOLO (không phê duyệt)

Nếu bạn muốn host exec chạy mà không có lời nhắc phê duyệt, bạn phải mở
**cả hai** lớp chính sách — chính sách exec được yêu cầu trong cấu hình
OpenClaw (`tools.exec.*`) **và** chính sách phê duyệt cục bộ của host trong
`~/.openclaw/exec-approvals.json`.

YOLO là hành vi mặc định của host trừ khi bạn siết chặt rõ ràng:

| Lớp                  | Cài đặt YOLO               |
| -------------------- | -------------------------- |
| `tools.exec.security` | `full` trên `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Các khác biệt quan trọng:**

- `tools.exec.host=auto` chọn exec chạy **ở đâu**: sandbox khi khả dụng, nếu không thì Gateway.
- YOLO chọn host exec được phê duyệt **như thế nào**: `security=full` cộng với `ask=off`.
- Trong chế độ YOLO, OpenClaw **không** thêm một cổng phê duyệt che giấu lệnh theo heuristic riêng hoặc lớp từ chối tiền kiểm script lên trên chính sách host exec đã cấu hình.
- `auto` không biến định tuyến Gateway thành một ghi đè tự do từ phiên trong sandbox. Yêu cầu theo từng lần gọi `host=node` được cho phép từ `auto`; `host=gateway` chỉ được cho phép từ `auto` khi không có runtime sandbox nào đang hoạt động. Để có mặc định ổn định không phải auto, hãy đặt `tools.exec.host` hoặc dùng `/exec host=...` rõ ràng.

</Warning>

Các provider dựa trên CLI có chế độ quyền không tương tác riêng có thể
tuân theo chính sách này. Claude CLI thêm
`--permission-mode bypassPermissions` khi chính sách exec được yêu cầu của
OpenClaw là YOLO. Ghi đè hành vi backend đó bằng các đối số Claude rõ ràng
trong `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` —
ví dụ `--permission-mode default`, `acceptEdits`, hoặc
`bypassPermissions`.

Nếu bạn muốn thiết lập thận trọng hơn, hãy siết một trong hai lớp trở lại
`allowlist` / `on-miss` hoặc `deny`.

### Thiết lập Gateway-host bền vững "không bao giờ nhắc"

<Steps>
  <Step title="Set the requested config policy">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Match the host approvals file">
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
- Các mặc định `~/.openclaw/exec-approvals.json` cục bộ.

Nó cố ý chỉ áp dụng cục bộ. Để thay đổi phê duyệt Gateway-host hoặc node-host
từ xa, dùng `openclaw approvals set --gateway` hoặc
`openclaw approvals set --node <id|name|ip>`.

### Node host

Với node host, hãy áp dụng cùng tệp phê duyệt trên node đó thay vào đó:

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

- `openclaw exec-policy` không đồng bộ phê duyệt node.
- `openclaw exec-policy set --host node` bị từ chối.
- Exec approvals của node được lấy từ node lúc chạy, vì vậy các cập nhật nhắm đến node phải dùng `openclaw approvals --node ...`.

</Note>

### Lối tắt chỉ cho phiên

- `/exec security=full ask=off` chỉ thay đổi phiên hiện tại.
- `/elevated full` là lối tắt phá kính khẩn cấp cũng bỏ qua exec approvals cho phiên đó.

Nếu tệp phê duyệt của host vẫn nghiêm ngặt hơn cấu hình, chính sách host
nghiêm ngặt hơn vẫn thắng.

## Danh sách cho phép (theo tác nhân)

Danh sách cho phép là **theo từng tác nhân**. Nếu có nhiều tác nhân, hãy chuyển
tác nhân bạn đang chỉnh sửa trong ứng dụng macOS. Mẫu là các khớp glob.

Mẫu có thể là glob đường dẫn binary đã phân giải hoặc glob tên lệnh trần.
Tên trần chỉ khớp các lệnh được gọi qua `PATH`, nên `rg` có thể khớp
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng **không** khớp `./rg` hoặc
`/tmp/rg`. Dùng glob đường dẫn khi bạn muốn tin cậy một vị trí binary cụ thể.

Các mục `agents.default` cũ được di chuyển sang `agents.main` khi tải.
Các chuỗi shell như `echo ok && pwd` vẫn cần mọi phân đoạn cấp cao nhất
thỏa mãn quy tắc danh sách cho phép.

Ví dụ:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Mỗi mục danh sách cho phép theo dõi:

| Trường             | Ý nghĩa                         |
| ------------------ | -------------------------------- |
| `id`               | UUID ổn định dùng cho danh tính UI |
| `lastUsedAt`       | Dấu thời gian lần dùng gần nhất  |
| `lastUsedCommand`  | Lệnh gần nhất đã khớp            |
| `lastResolvedPath` | Đường dẫn binary được phân giải gần nhất |

## Tự động cho phép CLI của skill

Khi **Tự động cho phép CLI của skill** được bật, các executable được tham chiếu bởi
Skills đã biết được xem là nằm trong danh sách cho phép trên node (node macOS hoặc
node host headless). Việc này dùng `skills.bins` qua Gateway RPC để lấy danh sách
bin của skill. Tắt tùy chọn này nếu bạn muốn danh sách cho phép thủ công nghiêm ngặt.

<Warning>
- Đây là **danh sách cho phép tiện lợi ngầm định**, tách biệt với các mục danh sách cho phép đường dẫn thủ công.
- Nó dành cho môi trường operator đáng tin cậy nơi Gateway và node nằm trong cùng ranh giới tin cậy.
- Nếu bạn cần niềm tin rõ ràng nghiêm ngặt, hãy giữ `autoAllowSkills: false` và chỉ dùng các mục danh sách cho phép đường dẫn thủ công.

</Warning>

## Safe bins và chuyển tiếp phê duyệt

Để biết về safe bins (đường nhanh chỉ dùng stdin), chi tiết ràng buộc interpreter, và
cách chuyển tiếp lời nhắc phê duyệt đến Slack/Discord/Telegram (hoặc chạy chúng dưới dạng
client phê duyệt gốc), xem
[Exec approvals — nâng cao](/vi/tools/exec-approvals-advanced).

## Chỉnh sửa Control UI

Dùng thẻ **Control UI → Nodes → Exec approvals** để chỉnh sửa mặc định,
ghi đè theo tác nhân, và danh sách cho phép. Chọn một phạm vi (Defaults hoặc một tác nhân),
tinh chỉnh chính sách, thêm/xóa mẫu danh sách cho phép, rồi **Save**. UI
hiển thị metadata lần dùng gần nhất theo từng mẫu để bạn có thể giữ danh sách gọn gàng.

Bộ chọn đích chọn **Gateway** (phê duyệt cục bộ) hoặc một **Node**.
Các Node phải quảng bá `system.execApprovals.get/set` (ứng dụng macOS hoặc
host node không giao diện). Nếu một node chưa quảng bá phê duyệt exec,
hãy chỉnh trực tiếp tệp `~/.openclaw/exec-approvals.json` cục bộ của nó.

CLI: `openclaw approvals` hỗ trợ chỉnh sửa Gateway hoặc node — xem
[CLI phê duyệt](/vi/cli/approvals).

## Luồng phê duyệt

Khi cần lời nhắc, Gateway sẽ phát sóng
`exec.approval.requested` tới các máy khách của người vận hành. Control UI và ứng dụng macOS
xử lý yêu cầu đó qua `exec.approval.resolve`, sau đó Gateway chuyển tiếp
yêu cầu đã được phê duyệt tới host node.

Với `host=node`, yêu cầu phê duyệt bao gồm payload `systemRunPlan`
chuẩn tắc. Gateway dùng kế hoạch đó làm ngữ cảnh
command/cwd/session có thẩm quyền khi chuyển tiếp các yêu cầu `system.run`
đã được phê duyệt.

Điều đó quan trọng đối với độ trễ phê duyệt bất đồng bộ:

- Đường dẫn exec của node chuẩn bị trước một kế hoạch chuẩn tắc duy nhất.
- Bản ghi phê duyệt lưu kế hoạch đó và siêu dữ liệu liên kết của nó.
- Sau khi được phê duyệt, lệnh gọi `system.run` cuối cùng được chuyển tiếp sẽ tái sử dụng kế hoạch đã lưu thay vì tin vào các chỉnh sửa sau đó của bên gọi.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId`, hoặc `sessionKey` sau khi yêu cầu phê duyệt được tạo, Gateway sẽ từ chối lần chạy được chuyển tiếp vì phê duyệt không khớp.

## Sự kiện hệ thống

Vòng đời exec được hiển thị dưới dạng thông báo hệ thống:

- `Exec running` (chỉ khi lệnh vượt quá ngưỡng thông báo đang chạy).
- `Exec finished`.
- `Exec denied`.

Các thông báo này được đăng vào phiên của agent sau khi node báo cáo sự kiện.
Phê duyệt exec do Gateway host phát ra cùng các sự kiện vòng đời khi
lệnh hoàn tất (và tùy chọn khi chạy lâu hơn ngưỡng).
Các exec có cổng phê duyệt tái sử dụng id phê duyệt làm `runId` trong các
thông báo này để dễ đối chiếu.

## Hành vi khi phê duyệt bị từ chối

Khi một phê duyệt exec bất đồng bộ bị từ chối, OpenClaw ngăn agent
tái sử dụng đầu ra từ bất kỳ lần chạy trước nào của cùng lệnh trong phiên.
Lý do từ chối được truyền kèm hướng dẫn rõ ràng rằng không có đầu ra lệnh
nào khả dụng, điều này ngăn agent tuyên bố có đầu ra mới hoặc
lặp lại lệnh bị từ chối bằng kết quả cũ từ một lần chạy thành công trước đó.

## Hệ quả

- **`full`** rất mạnh; ưu tiên danh sách cho phép khi có thể.
- **`ask`** giúp bạn vẫn tham gia vào vòng xử lý trong khi vẫn cho phép phê duyệt nhanh.
- Danh sách cho phép theo từng agent ngăn phê duyệt của một agent rò rỉ sang agent khác.
- Phê duyệt chỉ áp dụng cho yêu cầu exec của host từ **bên gửi được ủy quyền**. Bên gửi không được ủy quyền không thể phát hành `/exec`.
- `/exec security=full` là tiện ích cấp phiên dành cho người vận hành được ủy quyền và bỏ qua phê duyệt theo thiết kế. Để chặn cứng exec của host, hãy đặt bảo mật phê duyệt thành `deny` hoặc từ chối công cụ `exec` qua chính sách công cụ.

## Liên quan

<CardGroup cols={2}>
  <Card title="Phê duyệt exec — nâng cao" href="/vi/tools/exec-approvals-advanced" icon="gear">
    Bin an toàn, liên kết trình thông dịch và chuyển tiếp phê duyệt tới chat.
  </Card>
  <Card title="Công cụ exec" href="/vi/tools/exec" icon="terminal">
    Công cụ thực thi lệnh shell.
  </Card>
  <Card title="Chế độ đặc quyền" href="/vi/tools/elevated" icon="shield-exclamation">
    Cơ chế khẩn cấp cũng bỏ qua phê duyệt.
  </Card>
  <Card title="Sandboxing" href="/vi/gateway/sandboxing" icon="box">
    Chế độ sandbox và quyền truy cập workspace.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security" icon="lock">
    Mô hình bảo mật và gia cố.
  </Card>
  <Card title="Sandbox so với chính sách công cụ so với elevated" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Khi nào nên dùng từng biện pháp kiểm soát.
  </Card>
  <Card title="Skills" href="/vi/tools/skills" icon="sparkles">
    Hành vi tự động cho phép được hỗ trợ bởi Skills.
  </Card>
</CardGroup>
