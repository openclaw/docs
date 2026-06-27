---
read_when:
    - Cấu hình phê duyệt exec hoặc danh sách cho phép
    - Triển khai trải nghiệm phê duyệt exec trong ứng dụng macOS
    - Rà soát các prompt thoát sandbox và tác động của chúng
sidebarTitle: Exec approvals
summary: 'Phê duyệt thực thi trên máy chủ: nút chính sách, danh sách cho phép và quy trình làm việc YOLO/nghiêm ngặt'
title: Phê duyệt thực thi
x-i18n:
    generated_at: "2026-06-27T18:15:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a4a5c9c56da458fdb25d5fe698df305af17188695d8befc1d4cfd8e8333e96
    source_path: tools/exec-approvals.md
    workflow: 16
---

Phê duyệt exec là **lan can bảo vệ của ứng dụng đồng hành / máy chủ node** để cho phép
một agent trong sandbox chạy lệnh trên máy chủ thật (`gateway` hoặc `node`). Một
khóa liên động an toàn: lệnh chỉ được cho phép khi policy + allowlist +
(phê duyệt tùy chọn của người dùng) đều đồng ý. Phê duyệt exec xếp **ở trên**
tool policy và elevated gating (trừ khi elevated được đặt thành `full`, khi đó
bỏ qua phê duyệt).

Để xem tổng quan theo chế độ về `deny`, `allowlist`, `ask`, `auto`, `full`,
ánh xạ Codex Guardian, và quyền harness ACPX, xem
[Các chế độ quyền](/vi/tools/permission-modes).

<Note>
Policy có hiệu lực là policy **nghiêm ngặt hơn** giữa `tools.exec.*` và giá trị
mặc định của phê duyệt; nếu một trường phê duyệt bị bỏ qua, giá trị `tools.exec`
được dùng. Host exec cũng dùng trạng thái phê duyệt cục bộ trên máy đó - một
`ask: "always"` cục bộ trên máy chủ trong tệp phê duyệt của máy chủ thực thi sẽ tiếp tục
nhắc ngay cả khi mặc định phiên hoặc cấu hình yêu cầu `ask: "on-miss"`.
</Note>

## Kiểm tra policy có hiệu lực

| Lệnh                                                             | Nội dung hiển thị                                                                      |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Policy được yêu cầu, nguồn policy của máy chủ, và kết quả có hiệu lực.                 |
| `openclaw exec-policy show`                                      | Dạng xem đã hợp nhất trên máy cục bộ.                                                   |
| `openclaw exec-policy set` / `preset`                            | Đồng bộ policy được yêu cầu cục bộ với tệp phê duyệt máy chủ cục bộ trong một bước.    |

Khi một phạm vi cục bộ yêu cầu `host=node`, `exec-policy show` báo cáo
phạm vi đó là do node quản lý khi chạy thay vì giả vờ rằng tệp
phê duyệt cục bộ là nguồn sự thật.

Nếu UI ứng dụng đồng hành **không khả dụng**, mọi yêu cầu vốn
thường sẽ nhắc đều được giải quyết bằng **ask fallback** (mặc định: `deny`).

<Tip>
Các client phê duyệt chat native có thể gieo các tiện ích theo kênh trên
thông báo phê duyệt đang chờ. Ví dụ, Matrix gieo các lối tắt reaction
(`✅` cho phép một lần, `❌` từ chối, `♾️` luôn cho phép) trong khi vẫn để lại
các lệnh `/approve ...` trong thông báo làm phương án dự phòng.
</Tip>

## Phạm vi áp dụng

Phê duyệt exec được thực thi cục bộ trên máy chủ thực thi:

- **Máy chủ Gateway** → tiến trình `openclaw` trên máy gateway.
- **Máy chủ node** → node runner (ứng dụng đồng hành macOS hoặc máy chủ node headless).

### Mô hình tin cậy

- Các caller đã xác thực với Gateway là operator đáng tin cậy cho Gateway đó.
- Các node đã ghép cặp mở rộng năng lực operator đáng tin cậy đó lên máy chủ node.
- Phê duyệt exec giảm rủi ro thực thi ngoài ý muốn, nhưng **không** phải là ranh giới xác thực theo người dùng hoặc policy chỉ đọc hệ thống tệp.
- Sau khi được phê duyệt, một lệnh có thể thay đổi tệp theo quyền hệ thống tệp của máy chủ hoặc sandbox đã chọn.
- Các lượt chạy trên máy chủ node đã phê duyệt ràng buộc ngữ cảnh thực thi chuẩn: cwd chuẩn, argv chính xác, ràng buộc env khi có, và đường dẫn executable được ghim khi áp dụng.
- Với shell script và các lời gọi tệp interpreter/runtime trực tiếp, OpenClaw cũng cố gắng ràng buộc một toán hạng tệp cục bộ cụ thể. Nếu tệp đã ràng buộc đó thay đổi sau khi phê duyệt nhưng trước khi thực thi, lượt chạy bị từ chối thay vì thực thi nội dung đã trôi lệch.
- Ràng buộc tệp được chủ ý triển khai theo kiểu nỗ lực tốt nhất, **không** phải là mô hình ngữ nghĩa hoàn chỉnh của mọi đường dẫn loader interpreter/runtime. Nếu chế độ phê duyệt không thể xác định đúng một tệp cục bộ cụ thể để ràng buộc, nó từ chối tạo lượt chạy dựa trên phê duyệt thay vì giả vờ có phạm vi bao phủ đầy đủ.

### Phân tách trên macOS

- **Dịch vụ máy chủ node** chuyển tiếp `system.run` đến **ứng dụng macOS** qua IPC cục bộ.
- **Ứng dụng macOS** thực thi phê duyệt và chạy lệnh trong ngữ cảnh UI.

## Cài đặt và lưu trữ

Phê duyệt nằm trong một tệp JSON cục bộ trên máy chủ thực thi. Khi
`OPENCLAW_STATE_DIR` được đặt, tệp đi theo thư mục state đó;
nếu không, nó dùng thư mục state mặc định của OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# otherwise
~/.openclaw/exec-approvals.json
```

Socket phê duyệt mặc định đi theo cùng root:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, hoặc
`~/.openclaw/exec-approvals.sock` khi biến chưa được đặt.

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

## Núm policy

### `tools.exec.mode`

`tools.exec.mode` là bề mặt policy đã chuẩn hóa được ưu tiên cho host exec.
Các giá trị là:

- `deny` - chặn host exec.
- `allowlist` - chỉ chạy các lệnh trong allowlist mà không hỏi.
- `ask` - dùng policy allowlist và hỏi khi không khớp.
- `auto` - dùng policy allowlist, chạy trực tiếp các kết quả khớp xác định được, và gửi các lần thiếu phê duyệt qua reviewer tự động native của OpenClaw trước khi rơi về tuyến phê duyệt của con người.
- `full` - chạy host exec mà không có lời nhắc phê duyệt.

`tools.exec.security` / `tools.exec.ask` cũ vẫn được hỗ trợ và vẫn thắng
khi được đặt ở phạm vi phiên hoặc agent hẹp hơn.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - chặn mọi yêu cầu host exec.
  - `allowlist` - chỉ cho phép các lệnh trong allowlist.
  - `full` - cho phép mọi thứ (tương đương elevated).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Policy hỏi được cấu hình cho host exec. Kiểm soát hành vi lời nhắc
  phê duyệt cơ sở từ `tools.exec.ask` và mặc định phê duyệt máy chủ. Tham số
  tool `ask` theo từng lệnh gọi (xem [Tool exec](/vi/tools/exec#parameters))
  chỉ có thể làm cơ sở đó nghiêm ngặt hơn, và các lệnh gọi model có nguồn gốc kênh sẽ bỏ qua nó
  khi ask máy chủ có hiệu lực là `off`.

- `off` - không bao giờ nhắc.
- `on-miss` - chỉ nhắc khi allowlist không khớp.
- `always` - nhắc trên mọi lệnh. Tin cậy bền vững `allow-always` **không** chặn lời nhắc khi chế độ ask có hiệu lực là `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Cách giải quyết khi cần lời nhắc nhưng không có UI nào có thể truy cập. Nếu trường này
  bị bỏ qua, OpenClaw mặc định là `deny`.

- `deny` - chặn.
- `allowlist` - chỉ cho phép nếu allowlist khớp.
- `full` - cho phép.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Khi là `true`, OpenClaw xem các dạng code-eval inline là chỉ được chạy sau phê duyệt
  ngay cả khi binary interpreter đã nằm trong allowlist. Đây là phòng thủ nhiều lớp
  cho các loader interpreter không ánh xạ rõ ràng tới một toán hạng tệp ổn định.
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
`allow-always` không tự động lưu các mục allowlist mới cho chúng.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Chỉ kiểm soát phần trình bày trong lời nhắc phê duyệt exec. Khi bật,
  OpenClaw có thể đính kèm các đoạn lệnh do parser suy ra để lời nhắc phê duyệt
  trên Web có thể tô sáng token lệnh. Đặt thành `true` để bật
  tô sáng văn bản lệnh.
</ParamField>

Cài đặt này **không** thay đổi `security`, `ask`, cách khớp allowlist,
hành vi strict inline-eval, chuyển tiếp phê duyệt, hoặc thực thi lệnh.
Có thể đặt toàn cục dưới `tools.exec.commandHighlighting` hoặc theo từng
agent dưới `agents.list[].tools.exec.commandHighlighting`.

## Chế độ YOLO (không phê duyệt)

Nếu muốn host exec chạy mà không có lời nhắc phê duyệt, bạn phải mở
**cả hai** lớp policy - policy exec được yêu cầu trong cấu hình OpenClaw
(`tools.exec.*`) **và** policy phê duyệt cục bộ của máy chủ trong
tệp phê duyệt của máy chủ thực thi.

OpenClaw mặc định `askFallback` bị bỏ qua thành `deny`. Đặt
`askFallback` của máy chủ thành `full` một cách rõ ràng khi lời nhắc phê duyệt không có UI
nên rơi về cho phép.

| Lớp                  | Cài đặt YOLO              |
| -------------------- | ------------------------- |
| `tools.exec.security` | `full` trên `gateway`/`node` |
| `tools.exec.ask`      | `off`                     |
| Host `askFallback`    | `full`                    |

<Warning>
**Các điểm khác biệt quan trọng:**

- `tools.exec.host=auto` chọn **nơi** exec chạy: sandbox khi khả dụng, nếu không thì gateway.
- YOLO chọn **cách** host exec được phê duyệt: `security=full` cộng với `ask=off`.
- Trong chế độ YOLO, OpenClaw **không** thêm một cổng phê duyệt heuristic riêng cho lệnh bị làm rối hoặc lớp từ chối preflight script lên trên policy host exec đã cấu hình.
- `auto` không biến định tuyến gateway thành một quyền ghi đè miễn phí từ phiên trong sandbox. Yêu cầu theo từng lệnh gọi `host=node` được phép từ `auto`; `host=gateway` chỉ được phép từ `auto` khi không có runtime sandbox nào đang hoạt động. Để có mặc định không phải auto ổn định, đặt `tools.exec.host` hoặc dùng `/exec host=...` rõ ràng.

</Warning>

Các provider dựa trên CLI phơi bày chế độ quyền không tương tác riêng
có thể đi theo policy này. Claude CLI thêm
`--permission-mode bypassPermissions` khi policy exec có hiệu lực của OpenClaw
là YOLO. Với các phiên live Claude do OpenClaw quản lý, policy exec có hiệu lực
của OpenClaw có thẩm quyền hơn chế độ quyền native của Claude:
YOLO chuẩn hóa các lần khởi chạy live thành `--permission-mode bypassPermissions`, và
policy exec có hiệu lực hạn chế chuẩn hóa các lần khởi chạy live thành
`--permission-mode default`, ngay cả khi args backend Claude thô chỉ định một
chế độ khác.

Nếu muốn thiết lập thận trọng hơn, siết policy exec của OpenClaw lại thành
`allowlist` / `on-miss` hoặc `deny`.

### Thiết lập “không bao giờ nhắc” bền vững cho máy chủ gateway

<Steps>
  <Step title="Đặt policy cấu hình được yêu cầu">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Khớp tệp phê duyệt máy chủ">
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
- Mặc định tệp phê duyệt cục bộ, bao gồm `askFallback: "full"`.

Nó được chủ ý giới hạn cho cục bộ. Để thay đổi phê duyệt máy chủ gateway hoặc
máy chủ node từ xa, dùng `openclaw approvals set --gateway` hoặc
`openclaw approvals set --node <id|name|ip>`.

### Máy chủ node

Với máy chủ node, áp dụng cùng tệp phê duyệt trên node đó thay thế:

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
- Phê duyệt exec của node được lấy từ node khi chạy, vì vậy các cập nhật nhắm vào node phải dùng `openclaw approvals --node ...`.

</Note>

### Lối tắt chỉ cho phiên

- `/exec security=full ask=off` chỉ thay đổi phiên hiện tại.
- `/elevated full` là lối tắt khẩn cấp bỏ qua phê duyệt exec chỉ khi
  cả chính sách được yêu cầu và tệp phê duyệt của host đều phân giải thành
  `security: "full"` và `ask: "off"`. Tệp host nghiêm ngặt hơn, chẳng hạn
  `ask: "always"`, vẫn sẽ nhắc xác nhận.

Nếu tệp phê duyệt của host vẫn nghiêm ngặt hơn cấu hình, chính sách host
nghiêm ngặt hơn vẫn thắng.

## Danh sách cho phép (theo từng agent)

Danh sách cho phép là **theo từng agent**. Nếu có nhiều agent, hãy chuyển
agent bạn đang chỉnh sửa trong ứng dụng macOS. Các mẫu là kết quả khớp glob.

Mẫu có thể là glob đường dẫn binary đã phân giải hoặc glob tên lệnh trần.
Tên trần chỉ khớp các lệnh được gọi thông qua `PATH`, nên `rg` có thể khớp
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng **không** khớp `./rg` hoặc
`/tmp/rg`. Dùng glob đường dẫn khi bạn muốn tin cậy một vị trí binary cụ thể.

Các mục `agents.default` cũ được di chuyển sang `agents.main` khi tải.
Chuỗi shell như `echo ok && pwd` vẫn cần mọi phân đoạn cấp cao nhất
thỏa mãn quy tắc danh sách cho phép.

Ví dụ:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Hạn chế đối số bằng argPattern

Thêm `argPattern` khi một mục danh sách cho phép cần khớp một binary và một
dạng đối số cụ thể. OpenClaw đánh giá biểu thức chính quy trên các đối số
lệnh đã phân tích, không bao gồm token thực thi (`argv[0]`). Với các mục
được viết thủ công, đối số được nối bằng một dấu cách, vì vậy hãy neo mẫu
khi bạn cần khớp chính xác.

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

Mục đó cho phép `python3 safe.py`; `python3 other.py` là một lần trượt
danh sách cho phép. Nếu cũng có một mục chỉ theo đường dẫn cho cùng binary,
các đối số không khớp vẫn có thể rơi về mục chỉ theo đường dẫn đó. Bỏ mục
chỉ theo đường dẫn khi mục tiêu là hạn chế binary vào các đối số đã khai báo.

Các mục được lưu bởi luồng phê duyệt có thể dùng một định dạng phân tách
nội bộ để khớp argv chính xác. Ưu tiên dùng UI hoặc luồng phê duyệt để tạo
lại các mục đó thay vì chỉnh sửa thủ công giá trị đã mã hóa. Nếu OpenClaw
không thể phân tích argv cho một phân đoạn lệnh, các mục có `argPattern`
sẽ không khớp.

Mỗi mục danh sách cho phép hỗ trợ:

| Trường             | Ý nghĩa                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | Glob đường dẫn binary đã phân giải hoặc glob tên lệnh trần    |
| `argPattern`       | Regex argv tùy chọn; mục bị bỏ qua là chỉ theo đường dẫn      |
| `id`               | UUID ổn định dùng cho định danh UI                            |
| `source`           | Nguồn mục, chẳng hạn `allow-always`                           |
| `commandText`      | Văn bản lệnh được ghi lại khi luồng phê duyệt tạo mục         |
| `lastUsedAt`       | Dấu thời gian sử dụng gần nhất                                |
| `lastUsedCommand`  | Lệnh gần nhất đã khớp                                         |
| `lastResolvedPath` | Đường dẫn binary được phân giải gần nhất                      |

## Tự động cho phép CLI của Skills

Khi bật **Tự động cho phép CLI của Skills**, các tệp thực thi được tham chiếu
bởi Skills đã biết được coi là nằm trong danh sách cho phép trên Node (Node
macOS hoặc host Node headless). Cơ chế này dùng `skills.bins` qua Gateway RPC
để lấy danh sách bin của skill. Tắt tùy chọn này nếu bạn muốn danh sách cho
phép thủ công nghiêm ngặt.

<Warning>
- Đây là một **danh sách cho phép tiện lợi ngầm định**, tách biệt với các mục danh sách cho phép đường dẫn thủ công.
- Nó dành cho các môi trường vận hành đáng tin cậy, nơi Gateway và Node nằm trong cùng ranh giới tin cậy.
- Nếu bạn cần tin cậy tường minh nghiêm ngặt, hãy giữ `autoAllowSkills: false` và chỉ dùng các mục danh sách cho phép đường dẫn thủ công.

</Warning>

## Bin an toàn và chuyển tiếp phê duyệt

Để biết về bin an toàn (đường dẫn nhanh chỉ dùng stdin), chi tiết binding
trình thông dịch, và cách chuyển tiếp lời nhắc phê duyệt tới Slack/Discord/Telegram
(hoặc chạy chúng như client phê duyệt native), xem
[Phê duyệt exec - nâng cao](/vi/tools/exec-approvals-advanced).

## Chỉnh sửa Control UI

Dùng thẻ **Control UI → Nodes → Exec approvals** để chỉnh sửa mặc định,
ghi đè theo từng agent và danh sách cho phép. Chọn một phạm vi (Mặc định
hoặc một agent), tinh chỉnh chính sách, thêm/xóa mẫu danh sách cho phép,
rồi **Lưu**. UI hiển thị metadata sử dụng gần nhất theo từng mẫu để bạn
có thể giữ danh sách gọn gàng.

Bộ chọn mục tiêu chọn **Gateway** (phê duyệt local) hoặc một **Node**.
Node phải quảng bá `system.execApprovals.get/set` (ứng dụng macOS hoặc
host Node headless). Nếu một Node chưa quảng bá phê duyệt exec, hãy chỉnh
sửa trực tiếp tệp phê duyệt local của nó.

CLI: `openclaw approvals` hỗ trợ chỉnh sửa gateway hoặc node - xem
[CLI phê duyệt](/vi/cli/approvals).

## Luồng phê duyệt

Khi cần lời nhắc, gateway phát sóng
`exec.approval.requested` tới các client vận hành. Control UI và ứng dụng
macOS phân giải nó qua `exec.approval.resolve`, sau đó gateway chuyển tiếp
yêu cầu đã được phê duyệt tới host Node.

Với `host=node`, yêu cầu phê duyệt bao gồm payload `systemRunPlan` chuẩn.
Gateway dùng kế hoạch đó làm ngữ cảnh command/cwd/session có thẩm quyền khi
chuyển tiếp các yêu cầu `system.run` đã được phê duyệt.

Điều đó quan trọng với độ trễ phê duyệt async:

- Đường dẫn exec của Node chuẩn bị trước một kế hoạch chuẩn duy nhất.
- Bản ghi phê duyệt lưu kế hoạch đó và metadata binding của nó.
- Sau khi được phê duyệt, lệnh gọi `system.run` được chuyển tiếp cuối cùng dùng lại kế hoạch đã lưu thay vì tin các chỉnh sửa sau đó của caller.
- Nếu caller thay đổi `command`, `rawCommand`, `cwd`, `agentId`, hoặc `sessionKey` sau khi yêu cầu phê duyệt được tạo, gateway từ chối lần chạy được chuyển tiếp vì phê duyệt không khớp.

## Sự kiện hệ thống

Vòng đời exec được hiển thị dưới dạng thông báo hệ thống:

- `Exec running` (chỉ khi lệnh vượt quá ngưỡng thông báo đang chạy).
- `Exec finished`.

Các thông báo này được đăng vào phiên của agent sau khi Node báo cáo sự kiện.
Phê duyệt exec bị từ chối là trạng thái kết thúc đối với chính lệnh host:
lệnh không chạy. Với phê duyệt async của agent chính có phiên gốc, OpenClaw
đăng việc từ chối trở lại phiên đó dưới dạng followup nội bộ để agent có thể
ngừng chờ lệnh async và tránh sửa lỗi thiếu kết quả. Nếu không có phiên hoặc
không thể tiếp tục phiên, OpenClaw vẫn có thể báo cáo từ chối ngắn gọn cho
operator hoặc tuyến trò chuyện trực tiếp. Từ chối cho phiên subagent không
được đăng trở lại subagent.
Phê duyệt exec do Gateway host phát ra cùng các sự kiện vòng đời khi lệnh
kết thúc (và tùy chọn khi chạy lâu hơn ngưỡng). Exec được chặn bởi phê duyệt
dùng lại id phê duyệt làm `runId` trong các thông báo này để dễ đối chiếu.

## Hành vi khi phê duyệt bị từ chối

Khi một phê duyệt exec async bị từ chối, OpenClaw coi lệnh host là đã kết
thúc và fail-closed. Với phiên agent chính, việc từ chối được gửi dưới dạng
followup phiên nội bộ cho agent biết lệnh async không chạy. Điều đó giữ tính
liên tục của transcript mà không lộ đầu ra lệnh cũ. Nếu không thể gửi tới
phiên, OpenClaw rơi về thông báo từ chối ngắn gọn cho operator hoặc trò
chuyện trực tiếp khi có tuyến an toàn.

## Hệ quả

- **`full`** rất mạnh; ưu tiên danh sách cho phép khi có thể.
- **`ask`** giữ bạn trong vòng kiểm soát trong khi vẫn cho phép phê duyệt nhanh.
- Danh sách cho phép theo từng agent ngăn phê duyệt của một agent rò rỉ sang agent khác.
- Phê duyệt chỉ áp dụng cho yêu cầu exec host từ **người gửi được ủy quyền**. Người gửi không được ủy quyền không thể phát hành `/exec`.
- `/exec security=full` là tiện ích cấp phiên cho operator được ủy quyền và bỏ qua phê duyệt theo thiết kế. Để chặn cứng exec host, đặt bảo mật phê duyệt thành `deny` hoặc từ chối công cụ `exec` qua chính sách công cụ.

## Liên quan

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/vi/tools/exec-approvals-advanced" icon="gear">
    Bin an toàn, binding trình thông dịch, và chuyển tiếp phê duyệt tới trò chuyện.
  </Card>
  <Card title="Exec tool" href="/vi/tools/exec" icon="terminal">
    Công cụ thực thi lệnh shell.
  </Card>
  <Card title="Elevated mode" href="/vi/tools/elevated" icon="shield-exclamation">
    Đường dẫn khẩn cấp cũng bỏ qua phê duyệt.
  </Card>
  <Card title="Sandboxing" href="/vi/gateway/sandboxing" icon="box">
    Chế độ sandbox và quyền truy cập workspace.
  </Card>
  <Card title="Security" href="/vi/gateway/security" icon="lock">
    Mô hình bảo mật và gia cố.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Khi nào nên dùng từng cơ chế kiểm soát.
  </Card>
  <Card title="Skills" href="/vi/tools/skills" icon="sparkles">
    Hành vi tự động cho phép dựa trên Skills.
  </Card>
</CardGroup>
