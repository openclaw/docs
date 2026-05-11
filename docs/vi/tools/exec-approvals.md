---
read_when:
    - Cấu hình phê duyệt exec hoặc danh sách cho phép
    - Triển khai trải nghiệm người dùng phê duyệt exec trong ứng dụng macOS
    - Rà soát các lời nhắc thoát khỏi môi trường hộp cát và những hệ quả của chúng
sidebarTitle: Exec approvals
summary: 'Phê duyệt thực thi trên máy chủ: các tùy chọn điều chỉnh chính sách, danh sách cho phép và quy trình làm việc YOLO/nghiêm ngặt'
title: Phê duyệt thực thi
x-i18n:
    generated_at: "2026-05-11T20:37:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Phê duyệt exec là **lan can bảo vệ của ứng dụng đồng hành / host node** để cho phép
một tác nhân trong sandbox chạy lệnh trên một host thật (`gateway` hoặc `node`). Một
khóa liên động an toàn: lệnh chỉ được phép khi policy + allowlist +
(phê duyệt người dùng tùy chọn) đều đồng ý. Phê duyệt exec xếp **chồng lên trên**
policy công cụ và cổng elevated (trừ khi elevated được đặt thành `full`, khi đó
bỏ qua phê duyệt).

<Note>
Policy hiệu lực là policy **nghiêm ngặt hơn** giữa `tools.exec.*` và mặc định
phê duyệt; nếu một trường phê duyệt bị bỏ qua, giá trị `tools.exec` sẽ được
dùng. Host exec cũng dùng trạng thái phê duyệt cục bộ trên máy đó - một
`ask: "always"` cục bộ của host trong `~/.openclaw/exec-approvals.json` sẽ tiếp tục
nhắc ngay cả khi phiên hoặc mặc định cấu hình yêu cầu `ask: "on-miss"`.
</Note>

## Kiểm tra policy hiệu lực

| Lệnh                                                             | Nội dung hiển thị                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Policy được yêu cầu, nguồn policy của host, và kết quả hiệu lực.                       |
| `openclaw exec-policy show`                                      | Chế độ xem đã hợp nhất trên máy cục bộ.                                                |
| `openclaw exec-policy set` / `preset`                            | Đồng bộ hóa policy được yêu cầu cục bộ với tệp phê duyệt host cục bộ trong một bước.  |

Khi một phạm vi cục bộ yêu cầu `host=node`, `exec-policy show` báo cáo
phạm vi đó là do node quản lý khi chạy thay vì giả vờ rằng tệp phê duyệt
cục bộ là nguồn sự thật.

Nếu giao diện ứng dụng đồng hành **không khả dụng**, mọi yêu cầu thường
sẽ nhắc đều được giải quyết bằng **ask fallback** (mặc định: `deny`).

<Tip>
Các client phê duyệt chat native có thể gieo các tiện ích theo từng kênh vào
tin nhắn phê duyệt đang chờ. Ví dụ, Matrix gieo các lối tắt phản ứng
(`✅` cho phép một lần, `❌` từ chối, `♾️` luôn cho phép) trong khi vẫn để lại
các lệnh `/approve ...` trong tin nhắn làm phương án dự phòng.
</Tip>

## Nơi áp dụng

Phê duyệt exec được thực thi cục bộ trên host thực thi:

- **Host Gateway** → tiến trình `openclaw` trên máy gateway.
- **Host node** → trình chạy node (ứng dụng đồng hành macOS hoặc host node headless).

### Mô hình tin cậy

- Các caller đã xác thực qua Gateway là operator đáng tin cậy cho Gateway đó.
- Các node đã ghép đôi mở rộng năng lực operator đáng tin cậy đó lên host node.
- Phê duyệt exec giảm rủi ro thực thi ngoài ý muốn, nhưng **không** phải là ranh giới xác thực theo từng người dùng hay policy filesystem chỉ đọc.
- Sau khi được phê duyệt, một lệnh có thể thay đổi tệp theo quyền host hoặc sandbox filesystem đã chọn.
- Các lần chạy trên host node đã được phê duyệt ràng buộc ngữ cảnh thực thi chuẩn: cwd chuẩn, argv chính xác, ràng buộc env khi có, và đường dẫn executable được ghim khi áp dụng.
- Với shell script và các lệnh gọi tệp trực tiếp qua interpreter/runtime, OpenClaw cũng cố gắng ràng buộc một toán hạng tệp cục bộ cụ thể. Nếu tệp đã ràng buộc đó thay đổi sau khi phê duyệt nhưng trước khi thực thi, lần chạy bị từ chối thay vì thực thi nội dung đã lệch.
- Ràng buộc tệp cố ý là nỗ lực tốt nhất, **không** phải mô hình ngữ nghĩa hoàn chỉnh cho mọi đường dẫn loader interpreter/runtime. Nếu chế độ phê duyệt không thể xác định chính xác một tệp cục bộ cụ thể để ràng buộc, nó từ chối tạo một lần chạy được phê duyệt hậu thuẫn thay vì giả vờ có độ bao phủ đầy đủ.

### Tách biệt trên macOS

- **Dịch vụ host node** chuyển tiếp `system.run` đến **ứng dụng macOS** qua IPC cục bộ.
- **Ứng dụng macOS** thực thi phê duyệt và chạy lệnh trong ngữ cảnh giao diện.

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

## Núm policy

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - chặn tất cả yêu cầu host exec.
  - `allowlist` - chỉ cho phép các lệnh có trong allowlist.
  - `full` - cho phép mọi thứ (tương đương elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - không bao giờ nhắc.
  - `on-miss` - chỉ nhắc khi allowlist không khớp.
  - `always` - nhắc trên mọi lệnh. Tin cậy bền vững `allow-always` **không** triệt tiêu lời nhắc khi chế độ ask hiệu lực là `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Cách giải quyết khi cần nhắc nhưng không thể truy cập giao diện.

- `deny` - chặn.
- `allowlist` - chỉ cho phép nếu allowlist khớp.
- `full` - cho phép.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Khi là `true`, OpenClaw coi các dạng eval mã inline là chỉ được phê duyệt,
  ngay cả khi chính binary interpreter đã nằm trong allowlist. Phòng thủ theo chiều sâu
  cho các loader interpreter không ánh xạ gọn vào một toán hạng tệp
  ổn định.
</ParamField>

Ví dụ mà chế độ nghiêm ngặt bắt được:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Trong chế độ nghiêm ngặt, các lệnh này vẫn cần phê duyệt rõ ràng, và
`allow-always` không tự động lưu bền các mục allowlist mới cho chúng.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Chỉ kiểm soát cách trình bày trong lời nhắc phê duyệt exec. Khi bật,
  OpenClaw có thể đính kèm các span lệnh suy ra từ parser để lời nhắc
  phê duyệt Web có thể tô sáng token lệnh. Đặt thành `true` để bật
  tô sáng văn bản lệnh.
</ParamField>

Cài đặt này **không** thay đổi `security`, `ask`, so khớp allowlist,
hành vi strict inline-eval, chuyển tiếp phê duyệt, hay thực thi lệnh.
Có thể đặt toàn cục dưới `tools.exec.commandHighlighting` hoặc theo từng
tác nhân dưới `agents.list[].tools.exec.commandHighlighting`.

## Chế độ YOLO (không phê duyệt)

Nếu muốn host exec chạy mà không có lời nhắc phê duyệt, bạn phải mở
**cả hai** lớp policy - policy exec được yêu cầu trong cấu hình OpenClaw
(`tools.exec.*`) **và** policy phê duyệt cục bộ của host trong
`~/.openclaw/exec-approvals.json`.

YOLO là hành vi mặc định của host trừ khi bạn siết chặt rõ ràng:

| Lớp                   | Cài đặt YOLO              |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` trên `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| Host `askFallback`    | `full`                     |

<Warning>
**Các điểm khác biệt quan trọng:**

- `tools.exec.host=auto` chọn exec chạy **ở đâu**: sandbox khi khả dụng, nếu không thì gateway.
- YOLO chọn host exec được phê duyệt **như thế nào**: `security=full` cộng với `ask=off`.
- Trong chế độ YOLO, OpenClaw **không** thêm một cổng phê duyệt che giấu lệnh theo heuristic riêng hoặc lớp từ chối script-preflight lên trên policy host exec đã cấu hình.
- `auto` không biến định tuyến gateway thành một override tự do từ một phiên sandbox. Yêu cầu theo từng lệnh gọi `host=node` được cho phép từ `auto`; `host=gateway` chỉ được cho phép từ `auto` khi không có runtime sandbox nào đang hoạt động. Để có mặc định ổn định không phải auto, đặt `tools.exec.host` hoặc dùng `/exec host=...` rõ ràng.

</Warning>

Các provider dựa trên CLI có cung cấp chế độ quyền không tương tác riêng
có thể tuân theo policy này. Claude CLI thêm
`--permission-mode bypassPermissions` khi policy exec được yêu cầu của OpenClaw
là YOLO. Ghi đè hành vi backend đó bằng các đối số Claude rõ ràng
dưới `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` -
ví dụ `--permission-mode default`, `acceptEdits`, hoặc
`bypassPermissions`.

Nếu muốn thiết lập bảo thủ hơn, hãy siết một trong hai lớp trở lại
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
  <Step title="Khớp tệp phê duyệt của host">
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
- Mặc định `~/.openclaw/exec-approvals.json` cục bộ.

Nó cố ý chỉ áp dụng cục bộ. Để thay đổi phê duyệt gateway-host hoặc node-host
từ xa, dùng `openclaw approvals set --gateway` hoặc
`openclaw approvals set --node <id|name|ip>`.

### Host node

Với host node, áp dụng cùng tệp phê duyệt trên node đó thay vào đó:

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

- `openclaw exec-policy` không đồng bộ hóa phê duyệt node.
- `openclaw exec-policy set --host node` bị từ chối.
- Phê duyệt exec của node được lấy từ node khi chạy, vì vậy các cập nhật nhắm đến node phải dùng `openclaw approvals --node ...`.

</Note>

### Lối tắt chỉ cho phiên

- `/exec security=full ask=off` chỉ thay đổi phiên hiện tại.
- `/elevated full` là lối tắt phá kính khẩn cấp cũng bỏ qua phê duyệt exec cho phiên đó.

Nếu tệp phê duyệt host vẫn nghiêm ngặt hơn cấu hình, policy host nghiêm ngặt hơn
vẫn thắng.

## Allowlist (theo tác nhân)

Allowlist là **theo tác nhân**. Nếu có nhiều tác nhân, hãy chuyển tác nhân
bạn đang chỉnh sửa trong ứng dụng macOS. Pattern là so khớp glob.

Pattern có thể là glob đường dẫn binary đã phân giải hoặc glob tên lệnh trần.
Tên trần chỉ khớp các lệnh được gọi qua `PATH`, nên `rg` có thể khớp
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng **không** khớp `./rg` hoặc
`/tmp/rg`. Dùng glob đường dẫn khi bạn muốn tin cậy một vị trí binary
cụ thể.

Các mục `agents.default` cũ được di trú sang `agents.main` khi tải.
Các chuỗi shell như `echo ok && pwd` vẫn cần mọi đoạn cấp cao nhất
thỏa mãn quy tắc allowlist.

Ví dụ:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Giới hạn đối số bằng argPattern

Thêm `argPattern` khi một mục allowlist cần khớp một binary và một
hình dạng đối số cụ thể. OpenClaw đánh giá biểu thức chính quy
trên các đối số lệnh đã phân tích, loại trừ token executable
(`argv[0]`). Với các mục viết tay, đối số được nối bằng một
dấu cách đơn, vì vậy hãy neo pattern khi cần khớp chính xác.

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

Mục đó cho phép `python3 safe.py`; `python3 other.py` là một allowlist
miss. Nếu một mục chỉ theo đường dẫn cho cùng binary cũng có mặt, các đối số
không khớp vẫn có thể fallback về mục chỉ theo đường dẫn đó. Bỏ qua mục chỉ theo
đường dẫn khi mục tiêu là giới hạn binary ở các đối số đã khai báo.

Các mục được lưu bởi luồng phê duyệt có thể dùng định dạng dấu phân tách nội bộ để
khớp argv chính xác. Ưu tiên dùng UI hoặc luồng phê duyệt để tạo lại các
mục đó thay vì chỉnh sửa thủ công giá trị đã mã hóa. Nếu OpenClaw không thể
phân tích argv cho một đoạn lệnh, các mục có `argPattern` sẽ không khớp.

Mỗi mục allowlist hỗ trợ:

| Trường             | Ý nghĩa                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob đường dẫn nhị phân đã phân giải hoặc glob tên lệnh trần |
| `argPattern`       | Regex argv tùy chọn; các mục bị bỏ qua chỉ theo đường dẫn     |
| `id`               | UUID ổn định dùng cho định danh UI                            |
| `source`           | Nguồn mục, chẳng hạn như `allow-always`                       |
| `commandText`      | Văn bản lệnh được ghi lại khi luồng phê duyệt tạo mục         |
| `lastUsedAt`       | Dấu thời gian lần dùng gần nhất                               |
| `lastUsedCommand`  | Lệnh gần nhất đã khớp                                         |
| `lastResolvedPath` | Đường dẫn nhị phân đã phân giải gần nhất                      |

## Tự động cho phép CLI của skill

Khi bật **Tự động cho phép CLI của skill**, các tệp thực thi được tham chiếu bởi
những skill đã biết được xem là nằm trong allowlist trên các Node (Node macOS hoặc máy chủ
Node không giao diện). Cơ chế này dùng `skills.bins` qua Gateway RPC để lấy
danh sách bin của skill. Tắt tùy chọn này nếu bạn muốn allowlist thủ công nghiêm ngặt.

<Warning>
- Đây là một **allowlist tiện lợi ngầm định**, tách biệt với các mục allowlist đường dẫn thủ công.
- Cơ chế này dành cho môi trường vận hành đáng tin cậy, nơi Gateway và Node nằm trong cùng ranh giới tin cậy.
- Nếu bạn yêu cầu sự tin cậy tường minh nghiêm ngặt, hãy giữ `autoAllowSkills: false` và chỉ dùng các mục allowlist đường dẫn thủ công.

</Warning>

## Bin an toàn và chuyển tiếp phê duyệt

Để biết về bin an toàn (đường dẫn nhanh chỉ dùng stdin), chi tiết ràng buộc trình thông dịch và
cách chuyển tiếp lời nhắc phê duyệt tới Slack/Discord/Telegram (hoặc chạy chúng dưới dạng
máy khách phê duyệt gốc), xem
[Phê duyệt exec - nâng cao](/vi/tools/exec-approvals-advanced).

## Chỉnh sửa UI điều khiển

Dùng thẻ **UI điều khiển → Node → Phê duyệt exec** để chỉnh sửa mặc định,
ghi đè theo agent và allowlist. Chọn một phạm vi (Mặc định hoặc một agent),
điều chỉnh chính sách, thêm/xóa mẫu allowlist, rồi **Lưu**. UI
hiển thị siêu dữ liệu lần dùng gần nhất theo từng mẫu để bạn có thể giữ danh sách gọn gàng.

Bộ chọn mục tiêu chọn **Gateway** (phê duyệt cục bộ) hoặc một **Node**.
Node phải quảng bá `system.execApprovals.get/set` (ứng dụng macOS hoặc
máy chủ Node không giao diện). Nếu một Node chưa quảng bá phê duyệt exec,
hãy chỉnh sửa trực tiếp `~/.openclaw/exec-approvals.json` cục bộ của Node đó.

CLI: `openclaw approvals` hỗ trợ chỉnh sửa Gateway hoặc Node - xem
[CLI phê duyệt](/vi/cli/approvals).

## Luồng phê duyệt

Khi cần lời nhắc, Gateway phát
`exec.approval.requested` tới các máy khách vận hành. UI điều khiển và ứng dụng macOS
giải quyết yêu cầu qua `exec.approval.resolve`, sau đó Gateway chuyển tiếp
yêu cầu đã được phê duyệt tới máy chủ Node.

Với `host=node`, yêu cầu phê duyệt bao gồm payload `systemRunPlan`
chuẩn tắc. Gateway dùng kế hoạch đó làm ngữ cảnh
command/cwd/session có thẩm quyền khi chuyển tiếp các yêu cầu `system.run`
đã được phê duyệt.

Điều đó quan trọng đối với độ trễ phê duyệt bất đồng bộ:

- Đường dẫn exec của Node chuẩn bị trước một kế hoạch chuẩn tắc duy nhất.
- Bản ghi phê duyệt lưu kế hoạch đó và siêu dữ liệu ràng buộc của nó.
- Sau khi được phê duyệt, lệnh gọi `system.run` được chuyển tiếp cuối cùng sẽ tái sử dụng kế hoạch đã lưu thay vì tin vào các chỉnh sửa sau đó của bên gọi.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc `sessionKey` sau khi yêu cầu phê duyệt được tạo, Gateway sẽ từ chối lần chạy được chuyển tiếp vì phê duyệt không khớp.

## Sự kiện hệ thống

Vòng đời exec được hiển thị dưới dạng thông báo hệ thống:

- `Exec running` (chỉ khi lệnh vượt quá ngưỡng thông báo đang chạy).
- `Exec finished`.
- `Exec denied`.

Các thông báo này được đăng vào phiên của agent sau khi Node báo cáo sự kiện.
Phê duyệt exec do Gateway lưu trữ phát cùng các sự kiện vòng đời khi
lệnh hoàn tất (và tùy chọn khi chạy lâu hơn ngưỡng).
Các exec có cổng phê duyệt tái sử dụng id phê duyệt làm `runId` trong những
thông báo này để dễ đối chiếu.

## Hành vi khi phê duyệt bị từ chối

Khi một phê duyệt exec bất đồng bộ bị từ chối, OpenClaw ngăn agent
tái sử dụng đầu ra từ bất kỳ lần chạy trước nào của cùng lệnh trong phiên.
Lý do từ chối được truyền kèm hướng dẫn tường minh rằng không có đầu ra lệnh
nào khả dụng, điều này ngăn agent tuyên bố có đầu ra mới hoặc
lặp lại lệnh bị từ chối bằng kết quả cũ từ một lần chạy thành công trước đó.

## Hàm ý

- **`full`** rất mạnh; ưu tiên dùng allowlist khi có thể.
- **`ask`** giữ bạn trong vòng kiểm soát trong khi vẫn cho phép phê duyệt nhanh.
- Allowlist theo agent ngăn phê duyệt của một agent rò rỉ sang agent khác.
- Phê duyệt chỉ áp dụng cho yêu cầu exec trên máy chủ từ **người gửi được ủy quyền**. Người gửi không được ủy quyền không thể phát hành `/exec`.
- `/exec security=full` là tiện ích cấp phiên cho các vận hành viên được ủy quyền và bỏ qua phê duyệt theo thiết kế. Để chặn cứng exec trên máy chủ, hãy đặt bảo mật phê duyệt thành `deny` hoặc từ chối công cụ `exec` qua chính sách công cụ.

## Liên quan

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/vi/tools/exec-approvals-advanced" icon="gear">
    Bin an toàn, ràng buộc trình thông dịch và chuyển tiếp phê duyệt tới chat.
  </Card>
  <Card title="Exec tool" href="/vi/tools/exec" icon="terminal">
    Công cụ thực thi lệnh shell.
  </Card>
  <Card title="Elevated mode" href="/vi/tools/elevated" icon="shield-exclamation">
    Đường dẫn phá kính khẩn cấp cũng bỏ qua phê duyệt.
  </Card>
  <Card title="Sandboxing" href="/vi/gateway/sandboxing" icon="box">
    Chế độ sandbox và quyền truy cập workspace.
  </Card>
  <Card title="Security" href="/vi/gateway/security" icon="lock">
    Mô hình bảo mật và tăng cường bảo vệ.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Khi nào nên dùng từng biện pháp kiểm soát.
  </Card>
  <Card title="Skills" href="/vi/tools/skills" icon="sparkles">
    Hành vi tự động cho phép dựa trên skill.
  </Card>
</CardGroup>
