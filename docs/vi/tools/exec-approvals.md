---
read_when:
    - Cấu hình phê duyệt hoặc danh sách cho phép cho exec
    - Triển khai trải nghiệm phê duyệt thực thi trong ứng dụng macOS
    - Review các prompt thoát sandbox và những hệ quả của chúng
sidebarTitle: Exec approvals
summary: 'Phê duyệt thực thi trên máy chủ: các tùy chọn chính sách, danh sách cho phép và quy trình YOLO/nghiêm ngặt'
title: Phê duyệt thực thi
x-i18n:
    generated_at: "2026-07-19T06:03:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4553f129db78cce95bfde7c4a13b95a2282f9d1ab38ba5819a0816a4fd5ea4c6
    source_path: tools/exec-approvals.md
    workflow: 16
---

Phê duyệt thực thi là **cơ chế bảo vệ của ứng dụng đồng hành / máy chủ Node** để cho phép một
tác tử trong sandbox chạy lệnh trên máy chủ thực (`gateway` hoặc `node`). Lệnh
chỉ chạy khi chính sách + danh sách cho phép + phê duyệt (tùy chọn) của người dùng đều đồng thuận.
Phê duyệt được xếp **chồng lên trên** chính sách công cụ và cổng kiểm soát đặc quyền nâng cao (chế độ đặc quyền nâng cao
`full` bỏ qua chúng).

Để xem tổng quan theo chế độ về `deny`, `allowlist`, `ask`, `auto`, `full`,
ánh xạ Codex Guardian và quyền của bộ khung ACPX, hãy xem
[Các chế độ quyền](/vi/tools/permission-modes).

<Note>
Chính sách có hiệu lực là chính sách **nghiêm ngặt hơn** giữa `tools.exec.*` và các giá trị mặc định
của phê duyệt: phê duyệt chỉ có thể siết chặt bảo mật/yêu cầu xác nhận bắt nguồn từ cấu hình, không bao giờ
nới lỏng chúng. Nếu một trường phê duyệt bị bỏ qua, giá trị `tools.exec`
sẽ được sử dụng. Thực thi trên máy chủ cũng sử dụng trạng thái phê duyệt cục bộ trên máy đó - giá trị
`ask: "always"` cục bộ của máy chủ trong tệp phê duyệt của máy chủ thực thi vẫn tiếp tục
yêu cầu xác nhận ngay cả khi giá trị mặc định của phiên hoặc cấu hình yêu cầu `ask: "on-miss"`.
</Note>

## Phạm vi áp dụng

Phê duyệt thực thi được thực thi cục bộ trên máy chủ thực thi:

- **Máy chủ Gateway** -> tiến trình `openclaw` trên máy Gateway.
- **Máy chủ Node** -> trình chạy Node (ứng dụng đồng hành macOS hoặc máy chủ Node không giao diện).

### Mô hình tin cậy

- Các bên gọi đã xác thực với Gateway là những người vận hành đáng tin cậy đối với Gateway đó.
- Các Node đã ghép cặp mở rộng năng lực của người vận hành đáng tin cậy đó sang máy chủ Node.
- Phê duyệt làm giảm rủi ro thực thi ngoài ý muốn, nhưng **không** phải là ranh giới xác thực theo từng người dùng hoặc chính sách chỉ đọc hệ thống tệp.
- Sau khi được phê duyệt, một lệnh có thể thay đổi tệp theo quyền hệ thống tệp của máy chủ hoặc sandbox đã chọn.
- Các lần chạy được phê duyệt trên máy chủ Node liên kết ngữ cảnh thực thi chuẩn tắc: cwd, argv chính xác, liên kết env khi có và đường dẫn tệp thực thi được ghim khi áp dụng.
- Đối với tập lệnh shell và việc gọi trực tiếp tệp của trình thông dịch/môi trường chạy, OpenClaw cũng cố gắng liên kết một toán hạng tệp cục bộ cụ thể. Nếu tệp đó thay đổi sau khi phê duyệt nhưng trước khi thực thi, lần chạy sẽ bị từ chối thay vì thực thi nội dung đã sai lệch.
- Liên kết tệp là nỗ lực tối đa, không phải mô hình hoàn chỉnh cho mọi đường dẫn nạp của trình thông dịch/môi trường chạy. Nếu không thể xác định chính xác một tệp cục bộ cụ thể, OpenClaw sẽ từ chối tạo lần chạy dựa trên phê duyệt thay vì giả vờ có phạm vi bảo vệ đầy đủ.

### Phân tách trên macOS

- **Dịch vụ máy chủ Node** chuyển tiếp `system.run` đến **ứng dụng macOS** qua IPC cục bộ.
- **Ứng dụng macOS** thực thi phê duyệt và chạy lệnh trong ngữ cảnh giao diện người dùng.

## Kiểm tra chính sách có hiệu lực

| Lệnh                                                          | Nội dung hiển thị                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Chính sách được yêu cầu, các nguồn chính sách máy chủ và kết quả có hiệu lực.                       |
| `openclaw exec-policy show`                                      | Chế độ xem hợp nhất trên máy cục bộ.                                                             |
| `openclaw exec-policy set` / `preset`                            | Đồng bộ hóa chính sách cục bộ được yêu cầu với tệp phê duyệt của máy chủ cục bộ trong một bước. |

<Note>
Các ghi đè `/exec` theo từng phiên không được bao gồm. Chạy `/exec` trong phiên liên quan để kiểm tra các giá trị mặc định hiện tại của phiên đó. Xem [ghi đè phiên](/vi/tools/exec#session-overrides-exec).
</Note>

Tài liệu tham khảo CLI đầy đủ (cờ, đầu ra JSON, thêm/xóa danh sách cho phép): [CLI phê duyệt](/vi/cli/approvals).

Khi một phạm vi cục bộ yêu cầu `host=node`, `exec-policy show` báo cáo
phạm vi đó là do Node quản lý trong thời gian chạy thay vì coi tệp phê duyệt
cục bộ là nguồn dữ liệu chuẩn.

Nếu giao diện người dùng của ứng dụng đồng hành **không khả dụng**, mọi yêu cầu vốn
thường cần xác nhận sẽ được giải quyết bằng **phương án dự phòng khi yêu cầu xác nhận** (mặc định: `deny`).

<Tip>
Các ứng dụng phê duyệt trò chuyện gốc có thể cung cấp sẵn các thao tác theo từng kênh trên
thông báo phê duyệt đang chờ xử lý. Matrix cung cấp sẵn các phím tắt bằng phản ứng (`✅` cho phép một lần,
`♾️` luôn cho phép, `❌` từ chối), đồng thời vẫn để `/approve ...` trong
thông báo làm phương án dự phòng.
</Tip>

## Cài đặt và lưu trữ

Phê duyệt nằm trong một tệp JSON cục bộ trên máy chủ thực thi. Khi
`OPENCLAW_STATE_DIR` được đặt, tệp sẽ nằm trong thư mục trạng thái đó;
nếu không, tệp sử dụng thư mục trạng thái mặc định của OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# nếu không
~/.openclaw/exec-approvals.json
```

Socket phê duyệt mặc định dùng cùng thư mục gốc:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, hoặc
`~/.openclaw/exec-approvals.sock` khi biến chưa được đặt.

Các thư mục trạng thái là những phạm vi tin cậy độc lập. Khi `OPENCLAW_STATE_DIR`
trỏ đến nơi khác, OpenClaw không bao giờ nhập hoặc lưu trữ
`~/.openclaw/exec-approvals.json`; hãy cấu hình phê duyệt riêng cho
thư mục trạng thái tùy chỉnh. Doctor cũng chỉ nhập
`plugin-binding-approvals.json` cũ khi nó thuộc về thư mục trạng thái
đang hoạt động.

Lược đồ mẫu:

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Các nút điều chỉnh chính sách

### `tools.exec.mode`

`tools.exec.mode` là bề mặt chính sách chuẩn hóa được ưu tiên cho thực thi trên máy chủ:

| Giá trị       | Hành vi                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Chặn thực thi trên máy chủ.                                                                                                                                                          |
| `allowlist` | Chỉ chạy các lệnh trong danh sách cho phép mà không yêu cầu xác nhận.                                                                                                                             |
| `ask`       | Sử dụng chính sách danh sách cho phép và yêu cầu xác nhận khi không khớp.                                                                                                                                   |
| `auto`      | Sử dụng chính sách danh sách cho phép, chạy trực tiếp các kết quả khớp xác định và gửi các trường hợp không được phê duyệt qua trình review tự động gốc của OpenClaw trước khi chuyển sang tuyến phê duyệt của con người. |
| `full`      | Chạy thực thi trên máy chủ mà không có lời nhắc phê duyệt.                                                                                                                                   |

Các giá trị cũ `tools.exec.security` / `tools.exec.ask` vẫn được hỗ trợ và vẫn
áp dụng ở mọi nơi mà `mode` chưa được đặt trong phạm vi đó.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - chặn tất cả yêu cầu thực thi trên máy chủ.
  - `allowlist` - chỉ cho phép các lệnh trong danh sách cho phép.
  - `full` - cho phép mọi thứ (tương đương với đặc quyền nâng cao).

Mặc định là `full` đối với máy chủ Gateway/Node; thay vào đó, máy chủ `sandbox` mặc định là
`deny`.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Chính sách yêu cầu xác nhận đã cấu hình cho thực thi trên máy chủ. Kiểm soát hành vi lời nhắc phê duyệt
  cơ sở từ `tools.exec.ask` và các giá trị mặc định phê duyệt của máy chủ.
  Mặc định là `off`. Tham số công cụ `ask` theo từng lệnh gọi (xem
  [Công cụ Exec](/vi/tools/exec#parameters)) chỉ có thể siết chặt mức cơ sở đó, và
  các lệnh gọi mô hình bắt nguồn từ kênh sẽ bỏ qua tham số này khi yêu cầu xác nhận có hiệu lực của máy chủ là `off`.

- `off` - không bao giờ nhắc.
- `on-miss` - chỉ nhắc khi danh sách cho phép không khớp.
- `always` - nhắc với mọi lệnh. Mức tin cậy lâu dài `allow-always` **không** ngăn lời nhắc khi chế độ yêu cầu xác nhận có hiệu lực là `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Cách giải quyết khi cần lời nhắc nhưng không thể truy cập giao diện người dùng (hoặc
  lời nhắc hết thời gian chờ). Mặc định là `deny` khi bị bỏ qua.

- `deny` - chặn.
- `allowlist` - chỉ cho phép nếu danh sách cho phép khớp.
- `full` - cho phép.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Khi `true`, coi các dạng đánh giá mã nội tuyến là chỉ được thực thi sau khi phê duyệt, ngay cả khi
  bản thân tệp nhị phân của trình thông dịch nằm trong danh sách cho phép. Đây là cơ chế phòng vệ nhiều lớp dành cho
  các trình nạp của trình thông dịch không thể ánh xạ rõ ràng đến một toán hạng tệp ổn định duy nhất.
</ParamField>

Ví dụ mà chế độ nghiêm ngặt phát hiện: `python -c`, `node -e`/`--eval`/`-p`,
`ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (cùng với các dạng nội tuyến
`awk`, `sed`, `make`, `find -exec` và `xargs`).

Trong chế độ nghiêm ngặt, các lệnh này cần người review hoặc phê duyệt rõ ràng. Với
`tools.exec.mode: "auto"`, người review có thể cấp phép cho một lần thực thi có rủi ro thấp khi
lệnh có kế hoạch có thể thực thi được; nếu không, OpenClaw sẽ yêu cầu con người phê duyệt.
Các phê duyệt lệnh `Codex app-server` chuyển đến phương án dự phòng của người review sẽ yêu cầu
con người vì yêu cầu phê duyệt của chúng không cung cấp tệp thực thi đã phân giải có thể thực thi được.
`allow-always` không lưu các mục danh sách cho phép mới cho lệnh đánh giá nội tuyến.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Chỉ dành cho trình bày: khi được bật, OpenClaw có thể đính kèm các khoảng lệnh
  bắt nguồn từ trình phân tích cú pháp để lời nhắc phê duyệt trên Web có thể làm nổi bật các token lệnh. Điều này
  **không** thay đổi `security`, `ask`, việc khớp danh sách cho phép, hành vi đánh giá nội tuyến nghiêm ngặt,
  chuyển tiếp phê duyệt hoặc thực thi lệnh.
</ParamField>

Đặt toàn cục trong `tools.exec.commandHighlighting` hoặc theo từng tác tử trong
`agents.list[].tools.exec.commandHighlighting`.

## Chế độ YOLO (không phê duyệt)

Để chạy thực thi trên máy chủ mà không có lời nhắc phê duyệt, hãy mở **cả hai** lớp chính sách:
chính sách thực thi được yêu cầu trong cấu hình OpenClaw (`tools.exec.*`) **và**
chính sách phê duyệt cục bộ của máy chủ trong tệp phê duyệt của máy chủ thực thi.

Giá trị `askFallback` bị bỏ qua sẽ mặc định là `deny`. Đặt rõ ràng `askFallback` của máy chủ thành `full`
khi lời nhắc phê duyệt không có giao diện người dùng cần chuyển sang cho phép.

| Lớp                 | Cài đặt YOLO               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `full` trên `gateway`/`node` |
| `tools.exec.ask`      | `off`                      |
| `askFallback` của máy chủ    | `full`                     |

<Warning>
**Các điểm khác biệt quan trọng:**

- `tools.exec.host=auto` chọn **nơi** exec chạy: trong sandbox khi khả dụng, nếu không thì trên gateway.
- YOLO chọn **cách** exec trên máy chủ được phê duyệt: `security=full` cộng với `ask=off`.
- YOLO **không** bổ sung một cổng phê duyệt riêng dựa trên phương pháp heuristic để phát hiện lệnh bị làm rối hoặc một lớp từ chối kiểm tra trước tập lệnh bên trên chính sách exec máy chủ đã cấu hình.
- `auto` không biến việc định tuyến qua gateway thành một tùy chọn ghi đè tự do từ phiên trong sandbox. Yêu cầu `host=node` cho từng lệnh gọi được phép từ `auto`; `host=gateway` chỉ được phép từ `auto` khi không có runtime sandbox nào đang hoạt động. Để có giá trị mặc định ổn định không phải auto, hãy đặt `tools.exec.host` hoặc sử dụng rõ ràng `/exec host=...`.

</Warning>

Các nhà cung cấp dựa trên CLI có chế độ quyền không tương tác riêng
có thể tuân theo chính sách này. Claude CLI thêm
`--permission-mode bypassPermissions` khi chính sách exec hiệu lực của OpenClaw
là YOLO. Đối với các phiên Claude trực tiếp do OpenClaw quản lý, chính sách
exec hiệu lực của OpenClaw có quyền quyết định cao hơn chế độ quyền gốc của Claude:
YOLO chuẩn hóa các lần khởi chạy trực tiếp thành `--permission-mode bypassPermissions`, còn
chính sách exec hiệu lực hạn chế chuẩn hóa các lần khởi chạy trực tiếp thành
`--permission-mode default`, ngay cả khi các đối số backend Claude thô chỉ định một
chế độ khác.

Nếu muốn thiết lập thận trọng hơn, hãy siết chặt chính sách exec của OpenClaw trở lại
`allowlist` / `on-miss` hoặc `deny`.

### Thiết lập "không bao giờ nhắc" cố định trên máy chủ gateway

<Steps>
  <Step title="Đặt chính sách cấu hình được yêu cầu">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="Đồng bộ tệp phê duyệt của máy chủ">
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

Cập nhật cả `tools.exec.host/security/ask` cục bộ và các giá trị mặc định của tệp
phê duyệt cục bộ (bao gồm `askFallback: "full"`). Lệnh này được chủ ý
giới hạn chỉ dùng cục bộ. Để thay đổi phê duyệt trên máy chủ gateway hoặc máy chủ node từ xa, hãy dùng
`openclaw approvals set --gateway` hoặc `openclaw approvals set --node
<id|name|ip>`.

Các preset tích hợp khác: `cautious` (`host=gateway`, `security=allowlist`,
`ask=on-miss`, `askFallback=deny`) và `deny-all` (`host=gateway`,
`security=deny`, `ask=off`, `askFallback=deny`). Áp dụng theo cùng cách:
`openclaw exec-policy preset cautious`.

Để đặt từng trường riêng lẻ thay vì toàn bộ preset, hãy dùng
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` với bất kỳ tập con nào của các cờ đó.

### Máy chủ Node

Thay vào đó, áp dụng cùng tệp phê duyệt trên node:

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
**Các giới hạn chỉ áp dụng cục bộ:**

- `openclaw exec-policy` không đồng bộ hóa phê duyệt của node.
- `openclaw exec-policy set --host node` bị từ chối.
- Phê duyệt exec của Node được lấy từ node trong thời gian chạy, vì vậy các bản cập nhật nhắm đến node phải dùng `openclaw approvals --node ...`.

</Note>

### Lối tắt chỉ dành cho phiên

- `/exec security=full ask=off` chỉ thay đổi phiên hiện tại.
- `/elevated full` là lối tắt khẩn cấp bỏ qua phê duyệt exec chỉ
  khi cả chính sách được yêu cầu và tệp phê duyệt của máy chủ đều phân giải thành
  `security: "full"` và `ask: "off"`. Tệp máy chủ nghiêm ngặt hơn, chẳng hạn như `ask:
"always"`, vẫn sẽ nhắc.

Nếu tệp phê duyệt của máy chủ vẫn nghiêm ngặt hơn cấu hình, chính sách máy chủ
nghiêm ngặt hơn vẫn được ưu tiên.

## Danh sách cho phép (theo từng tác nhân)

Danh sách cho phép áp dụng **theo từng tác nhân**. Nếu có nhiều tác nhân, hãy chuyển sang tác nhân
mà bạn đang chỉnh sửa trong ứng dụng macOS. Các mẫu được đối sánh theo glob.

Mẫu có thể là glob đường dẫn nhị phân đã phân giải hoặc glob tên lệnh thuần.
Tên thuần chỉ khớp với các lệnh được gọi thông qua `PATH`, vì vậy `rg` có thể khớp với
`/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng **không** khớp với `./rg` hoặc
`/tmp/rg`. Hãy dùng glob đường dẫn để tin cậy một vị trí tệp nhị phân cụ thể.

Các mục `agents.default` cũ được di chuyển sang `agents.main` khi tải.
Các chuỗi shell như `echo ok && pwd` vẫn yêu cầu mọi phân đoạn cấp cao nhất
đáp ứng các quy tắc của danh sách cho phép.

Ví dụ:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Hạn chế đối số bằng argPattern

Thêm `argPattern` khi một mục trong danh sách cho phép cần khớp với một tệp nhị phân và một
dạng đối số cụ thể. OpenClaw sử dụng ngữ nghĩa biểu thức chính quy
ECMAScript (JavaScript) trên mọi máy chủ và đánh giá biểu thức dựa trên
các đối số lệnh đã phân tích, không bao gồm token tệp thực thi (`argv[0]`).
Đối với các mục được tạo thủ công, các đối số được nối bằng một dấu cách, vì vậy
hãy neo mẫu khi cần khớp chính xác.

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

Mục đó cho phép `python3 safe.py`; `python3 other.py` không khớp với danh sách
cho phép. Nếu cũng có một mục chỉ theo đường dẫn cho cùng tệp nhị phân, các
đối số không khớp vẫn có thể quay về mục chỉ theo đường dẫn đó. Hãy bỏ mục chỉ theo đường dẫn
khi mục tiêu là giới hạn tệp nhị phân ở các đối số đã khai báo.

Các mục được lưu bởi luồng phê duyệt sử dụng định dạng dấu phân cách nội bộ để khớp
argv chính xác. Nên dùng giao diện người dùng hoặc luồng phê duyệt để tạo lại các mục đó
thay vì chỉnh sửa thủ công giá trị đã mã hóa. Nếu OpenClaw không thể phân tích argv
cho một phân đoạn lệnh, các mục có `argPattern` sẽ không khớp.

Mỗi mục trong danh sách cho phép hỗ trợ:

| Trường              | Ý nghĩa                                              |
| ------------------ | ---------------------------------------------------- |
| `pattern`          | Glob đường dẫn nhị phân đã phân giải hoặc glob tên lệnh thuần  |
| `argPattern`       | Biểu thức chính quy argv ECMAScript tùy chọn; nếu bỏ qua thì chỉ khớp theo đường dẫn |
| `id`               | ID bất biến ổn định; được tạo dưới dạng UUID khi không có    |
| `source`           | Nguồn của mục, chẳng hạn như `allow-always`                 |
| `commandText`      | Dữ liệu đầu vào văn bản thuần cũ; bị loại bỏ trong khi tải        |
| `lastUsedAt`       | Dấu thời gian sử dụng gần nhất                                  |
| `lastUsedCommand`  | Lệnh khớp gần nhất                            |
| `lastResolvedPath` | Đường dẫn nhị phân đã phân giải gần nhất                            |

## Tự động cho phép CLI của Skills

Khi **Tự động cho phép CLI của Skills** (`autoAllowSkills`) được bật, các tệp thực thi
được tham chiếu bởi các skill đã biết sẽ được coi là có trong danh sách cho phép trên các node (node macOS
hoặc máy chủ node không giao diện). Cơ chế này dùng `skills.bins` qua RPC của Gateway để
lấy danh sách tệp nhị phân của skill. Hãy tắt tùy chọn này nếu muốn sử dụng nghiêm ngặt
danh sách cho phép thủ công.

<Warning>
- Đây là một **danh sách cho phép tiện dụng ngầm định**, tách biệt với các mục danh sách cho phép theo đường dẫn thủ công.
- Danh sách này dành cho các môi trường vận hành đáng tin cậy, nơi Gateway và node nằm trong cùng ranh giới tin cậy.
- Nếu cần cơ chế tin cậy tường minh nghiêm ngặt, hãy giữ `autoAllowSkills: false` và chỉ dùng các mục danh sách cho phép theo đường dẫn thủ công.

</Warning>

## Tệp nhị phân an toàn và chuyển tiếp phê duyệt

Để biết về các tệp nhị phân an toàn (đường dẫn nhanh chỉ dùng stdin), chi tiết liên kết trình thông dịch và
cách chuyển tiếp lời nhắc phê duyệt đến Slack/Discord/Telegram (hoặc chạy chúng dưới dạng
máy khách phê duyệt gốc), hãy xem
[Phê duyệt exec - nâng cao](/vi/tools/exec-approvals-advanced).

## Chỉnh sửa trong giao diện điều khiển

Dùng thẻ **Control UI -> Nodes -> Exec approvals** để chỉnh sửa các giá trị mặc định,
các ghi đè theo từng tác nhân và danh sách cho phép. Chọn một phạm vi (Defaults hoặc một tác nhân),
điều chỉnh chính sách, thêm/xóa các mẫu trong danh sách cho phép, rồi chọn **Save**. Giao diện
hiển thị siêu dữ liệu sử dụng gần nhất cho từng mẫu để bạn có thể giữ danh sách gọn gàng.

Bộ chọn đích chọn **Gateway** (phê duyệt cục bộ) hoặc một **Node**.
Các node phải quảng bá `system.execApprovals.get/set` (ứng dụng macOS hoặc máy chủ
node không giao diện). Nếu một node chưa quảng bá phê duyệt exec, hãy chỉnh sửa trực tiếp
tệp phê duyệt cục bộ của node đó.

Một số máy chủ node, bao gồm ứng dụng đồng hành Windows, sở hữu định dạng chính sách
phê duyệt khác. Giao diện điều khiển hiển thị các chính sách gốc của máy chủ này ở chế độ chỉ đọc. Hãy dùng
ứng dụng đồng hành hoặc `openclaw approvals set --node <id|name|ip>` với dạng
chính sách gốc để chỉnh sửa; xem [CLI phê duyệt](/vi/cli/approvals).

CLI: `openclaw approvals` hỗ trợ chỉnh sửa gateway hoặc node - xem
[CLI phê duyệt](/vi/cli/approvals).

## Luồng phê duyệt

Khi cần lời nhắc, gateway phát
`exec.approval.requested` đến các máy khách của người vận hành. Giao diện điều khiển và ứng dụng
macOS xử lý lời nhắc đó qua `exec.approval.resolve`, sau đó gateway chuyển tiếp yêu cầu
đã phê duyệt đến máy chủ node.

Đối với `host=node`, yêu cầu phê duyệt bao gồm payload `systemRunPlan`
chuẩn tắc. Gateway dùng kế hoạch đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền
khi chuyển tiếp các yêu cầu `system.run` đã phê duyệt:

- Đường dẫn exec của node chuẩn bị trước một kế hoạch chuẩn tắc duy nhất.
- Bản ghi phê duyệt lưu trữ kế hoạch đó và siêu dữ liệu liên kết của nó.
- Sau khi được phê duyệt, lệnh gọi `system.run` được chuyển tiếp cuối cùng sẽ tái sử dụng kế hoạch đã lưu thay vì tin tưởng các chỉnh sửa sau đó của bên gọi.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc `sessionKey` sau khi yêu cầu phê duyệt được tạo, gateway sẽ từ chối lần chạy được chuyển tiếp do phê duyệt không khớp.

## Sự kiện hệ thống và từ chối

Vòng đời exec đăng thông báo hệ thống `Exec finished` vào phiên của tác nhân
sau khi node báo cáo hoàn tất. OpenClaw cũng có thể phát thông báo
đang xử lý sau khi phê duyệt được cấp và
`tools.exec.approvalRunningNoticeMs` trôi qua (mặc định `10000`, `0` sẽ tắt
tính năng này). Phê duyệt exec bị từ chối sẽ kết thúc lệnh trên máy chủ: lệnh
không chạy.

- Đối với các phê duyệt bất đồng bộ của tác nhân chính có phiên khởi nguồn, OpenClaw
  đăng quyết định từ chối trở lại phiên đó dưới dạng thông báo tiếp nối nội bộ để tác nhân
  có thể ngừng chờ lệnh bất đồng bộ và tránh phải sửa chữa do thiếu kết quả.
- Nếu không có phiên hoặc không thể tiếp tục phiên, OpenClaw vẫn có thể
  báo cáo ngắn gọn quyết định từ chối cho người vận hành hoặc qua tuyến trò chuyện trực tiếp.
- Các quyết định từ chối cho phiên tác nhân phụ và cron không được đăng trở lại
  phiên đó.

Phê duyệt exec trên máy chủ gateway phát cùng sự kiện vòng đời hoàn tất.
Các lệnh exec có cổng phê duyệt tái sử dụng ID phê duyệt để liên kết yêu cầu
đang chờ với thông báo hoàn tất/từ chối tương ứng (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Hệ quả

- **`full`** có quyền lực lớn; nên ưu tiên danh sách cho phép khi có thể.
- **`ask`** giúp bạn luôn nắm được tình hình trong khi vẫn cho phép phê duyệt nhanh.
- Danh sách cho phép theo từng tác nhân ngăn phê duyệt của một tác nhân bị rò rỉ sang tác nhân khác.
- Phê duyệt chỉ áp dụng cho các yêu cầu exec trên máy chủ từ **người gửi được ủy quyền**. Người gửi không được ủy quyền không thể gọi `/exec`.
- `/exec security=full` là tiện ích cấp phiên dành cho người vận hành được ủy quyền và chủ ý bỏ qua phê duyệt. Để chặn cứng exec trên máy chủ, hãy đặt bảo mật phê duyệt thành `deny` hoặc từ chối công cụ `exec` thông qua chính sách công cụ.

## Liên quan

<CardGroup cols={2}>
  <Card title="Phê duyệt thực thi - nâng cao" href="/vi/tools/exec-approvals-advanced" icon="gear">
    Các tệp thực thi an toàn, liên kết trình thông dịch và chuyển tiếp yêu cầu phê duyệt đến cuộc trò chuyện.
  </Card>
  <Card title="Công cụ thực thi" href="/vi/tools/exec" icon="terminal">
    Công cụ thực thi lệnh shell.
  </Card>
  <Card title="Chế độ đặc quyền" href="/vi/tools/elevated" icon="shield-exclamation">
    Lối truy cập khẩn cấp cũng bỏ qua các bước phê duyệt.
  </Card>
  <Card title="Cô lập bằng sandbox" href="/vi/gateway/sandboxing" icon="box">
    Các chế độ sandbox và quyền truy cập không gian làm việc.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security" icon="lock">
    Mô hình bảo mật và tăng cường bảo mật.
  </Card>
  <Card title="Sandbox, chính sách công cụ và chế độ đặc quyền" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Trường hợp nên sử dụng từng cơ chế kiểm soát.
  </Card>
  <Card title="Skills" href="/vi/tools/skills" icon="sparkles">
    Cơ chế tự động cho phép dựa trên Skill.
  </Card>
</CardGroup>
