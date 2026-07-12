---
read_when:
    - Cấu hình phê duyệt thực thi hoặc danh sách cho phép
    - Triển khai trải nghiệm phê duyệt thực thi trong ứng dụng macOS
    - Rà soát các prompt thoát khỏi sandbox và những hệ quả của chúng
sidebarTitle: Exec approvals
summary: 'Phê duyệt thực thi trên máy chủ: các tùy chọn chính sách, danh sách cho phép và quy trình YOLO/nghiêm ngặt'
title: Phê duyệt thực thi
x-i18n:
    generated_at: "2026-07-12T08:26:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Phê duyệt thực thi là **cơ chế bảo vệ của ứng dụng đồng hành / máy chủ Node** để cho phép một tác nhân trong sandbox chạy lệnh trên máy chủ thực (`gateway` hoặc `node`). Lệnh chỉ chạy khi chính sách + danh sách cho phép + phê duyệt của người dùng (không bắt buộc) đều đồng thuận. Các phê duyệt được áp dụng **bổ sung lên trên** chính sách công cụ và cổng kiểm soát nâng quyền (chế độ nâng quyền `full` sẽ bỏ qua chúng).

Để xem tổng quan theo chế độ về `deny`, `allowlist`, `ask`, `auto`, `full`, ánh xạ Codex Guardian và quyền của bộ khung ACPX, hãy xem [Các chế độ quyền](/vi/tools/permission-modes).

<Note>
Chính sách có hiệu lực là chính sách **nghiêm ngặt hơn** giữa `tools.exec.*` và các giá trị mặc định của phê duyệt: phê duyệt chỉ có thể siết chặt mức bảo mật/yêu cầu xác nhận bắt nguồn từ cấu hình, tuyệt đối không thể nới lỏng chúng. Nếu một trường phê duyệt bị bỏ qua, giá trị `tools.exec` sẽ được sử dụng. Việc thực thi trên máy chủ cũng sử dụng trạng thái phê duyệt cục bộ trên máy đó — giá trị `ask: "always"` cục bộ của máy chủ trong tệp phê duyệt của máy chủ thực thi sẽ tiếp tục yêu cầu xác nhận ngay cả khi phiên hoặc giá trị mặc định của cấu hình yêu cầu `ask: "on-miss"`.
</Note>

## Phạm vi áp dụng

Phê duyệt thực thi được cưỡng chế cục bộ trên máy chủ thực thi:

- **Máy chủ Gateway** -> tiến trình `openclaw` trên máy Gateway.
- **Máy chủ Node** -> trình chạy Node (ứng dụng đồng hành trên macOS hoặc máy chủ Node không giao diện).

### Mô hình tin cậy

- Các bên gọi đã xác thực với Gateway được coi là người vận hành đáng tin cậy đối với Gateway đó.
- Các Node đã ghép đôi mở rộng khả năng của người vận hành đáng tin cậy đó sang máy chủ Node.
- Phê duyệt làm giảm rủi ro thực thi ngoài ý muốn, nhưng **không** phải là ranh giới xác thực theo từng người dùng hoặc chính sách hệ thống tệp chỉ đọc.
- Sau khi được phê duyệt, lệnh có thể sửa đổi tệp theo quyền của hệ thống tệp trên máy chủ hoặc sandbox đã chọn.
- Các lần chạy đã được phê duyệt trên máy chủ Node sẽ ràng buộc ngữ cảnh thực thi chuẩn tắc: thư mục làm việc, argv chính xác, liên kết môi trường khi có và đường dẫn tệp thực thi được cố định khi áp dụng.
- Đối với tập lệnh shell và các lệnh gọi trực tiếp tệp của trình thông dịch/môi trường chạy, OpenClaw cũng cố gắng ràng buộc một toán hạng tệp cục bộ cụ thể. Nếu tệp đó thay đổi sau khi được phê duyệt nhưng trước khi thực thi, lần chạy sẽ bị từ chối thay vì thực thi nội dung đã thay đổi.
- Việc ràng buộc tệp được thực hiện theo khả năng tốt nhất, không phải là mô hình hoàn chỉnh cho mọi đường dẫn nạp của trình thông dịch/môi trường chạy. Nếu không thể xác định chính xác một tệp cục bộ cụ thể, OpenClaw sẽ từ chối tạo lần chạy dựa trên phê duyệt thay vì giả vờ rằng phạm vi đã được bao phủ đầy đủ.

### Phân tách trên macOS

- **Dịch vụ máy chủ Node** chuyển tiếp `system.run` đến **ứng dụng macOS** qua IPC cục bộ.
- **Ứng dụng macOS** cưỡng chế phê duyệt và thực thi lệnh trong ngữ cảnh giao diện người dùng.

## Kiểm tra chính sách có hiệu lực

| Lệnh                                                             | Nội dung hiển thị                                                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | Chính sách được yêu cầu, các nguồn chính sách của máy chủ và kết quả có hiệu lực.         |
| `openclaw exec-policy show`                                      | Chế độ xem hợp nhất trên máy cục bộ.                                                      |
| `openclaw exec-policy set` / `preset`                            | Đồng bộ chính sách cục bộ được yêu cầu với tệp phê duyệt của máy chủ cục bộ trong một bước. |

<Note>
Các ghi đè `/exec` theo từng phiên không được bao gồm. Chạy `/exec` trong phiên liên quan để kiểm tra các giá trị mặc định hiện tại của phiên đó. Xem [ghi đè theo phiên](/vi/tools/exec#session-overrides-exec).
</Note>

Tài liệu tham khảo CLI đầy đủ (cờ, đầu ra JSON, thêm/xóa danh sách cho phép): [CLI phê duyệt](/vi/cli/approvals).

Khi một phạm vi cục bộ yêu cầu `host=node`, `exec-policy show` báo cáo phạm vi đó là do Node quản lý trong thời gian chạy thay vì coi tệp phê duyệt cục bộ là nguồn chân lý.

Nếu giao diện người dùng của ứng dụng đồng hành **không khả dụng**, mọi yêu cầu thường cần nhắc xác nhận sẽ được xử lý bằng **phương án dự phòng khi yêu cầu xác nhận** (mặc định: `deny`).

<Tip>
Các máy khách phê duyệt trò chuyện gốc có thể thiết lập sẵn các thao tác dành riêng cho kênh trên thông báo phê duyệt đang chờ xử lý. Matrix thiết lập sẵn các lối tắt bằng phản ứng (`✅` cho phép một lần, `♾️` luôn cho phép, `❌` từ chối), đồng thời vẫn giữ `/approve ...` trong thông báo làm phương án dự phòng.
</Tip>

## Cài đặt và lưu trữ

Các phê duyệt nằm trong một tệp JSON cục bộ trên máy chủ thực thi. Khi `OPENCLAW_STATE_DIR` được đặt, tệp sẽ nằm trong thư mục trạng thái đó; nếu không, tệp sử dụng thư mục trạng thái mặc định của OpenClaw:

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# nếu không
~/.openclaw/exec-approvals.json
```

Socket phê duyệt mặc định dùng cùng thư mục gốc:
`$OPENCLAW_STATE_DIR/exec-approvals.sock`, hoặc
`~/.openclaw/exec-approvals.sock` khi biến chưa được đặt.

Các bản phát hành trước 2026.6.6 luôn lưu tệp trong `~/.openclaw`. Nếu `OPENCLAW_STATE_DIR` trỏ đến nơi khác và một tệp phê duyệt vẫn còn trong thư mục mặc định, hãy chạy trực tiếp `openclaw doctor --fix` một lần để nhập tệp đó vào thư mục trạng thái (bản gốc được lưu trữ với hậu tố `.migrated`). Chế độ doctor tương tác cũng có thể xem trước và xác nhận thao tác nhập. Các lần sửa chữa tự động khi cập nhật và theo dõi Gateway tuyệt đối không nhập dữ liệu giữa các thư mục trạng thái: thư mục trạng thái tạm thời hoặc dàn dựng không được thu nhận các phê duyệt của bản cài đặt mặc định. Ranh giới tương tự áp dụng cho việc nhập `plugin-binding-approvals.json` cũ vào trạng thái SQLite dùng chung.

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

## Các tùy chọn chính sách

### `tools.exec.mode`

`tools.exec.mode` là bề mặt chính sách chuẩn hóa được ưu tiên cho việc thực thi trên máy chủ:

| Giá trị     | Hành vi                                                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | Chặn thực thi trên máy chủ.                                                                                                                                                                          |
| `allowlist` | Chỉ chạy các lệnh có trong danh sách cho phép mà không yêu cầu xác nhận.                                                                                                                              |
| `ask`       | Sử dụng chính sách danh sách cho phép và yêu cầu xác nhận khi không khớp.                                                                                                                             |
| `auto`      | Sử dụng chính sách danh sách cho phép, chạy trực tiếp các kết quả khớp xác định được và gửi các trường hợp cần phê duyệt qua trình đánh giá tự động gốc của OpenClaw trước khi chuyển sang quy trình phê duyệt của con người. |
| `full`      | Thực thi trên máy chủ mà không hiển thị yêu cầu phê duyệt.                                                                                                                                            |

`tools.exec.security` / `tools.exec.ask` cũ vẫn được hỗ trợ và tiếp tục áp dụng tại mọi phạm vi chưa đặt `mode`.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - chặn mọi yêu cầu thực thi trên máy chủ.
  - `allowlist` - chỉ cho phép các lệnh có trong danh sách cho phép.
  - `full` - cho phép mọi thứ (tương đương với nâng quyền).

Mặc định là `full` đối với máy chủ Gateway/Node; máy chủ `sandbox` mặc định dùng `deny`.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  Chính sách yêu cầu xác nhận đã cấu hình cho việc thực thi trên máy chủ. Kiểm soát hành vi nhắc phê duyệt cơ sở từ `tools.exec.ask` và các giá trị mặc định của phê duyệt trên máy chủ. Mặc định là `off`. Tham số công cụ `ask` theo từng lệnh gọi (xem [Công cụ thực thi](/vi/tools/exec#parameters)) chỉ có thể siết chặt mức cơ sở đó, và các lệnh gọi mô hình bắt nguồn từ kênh sẽ bỏ qua tham số này khi yêu cầu xác nhận có hiệu lực trên máy chủ là `off`.

- `off` - không bao giờ yêu cầu xác nhận.
- `on-miss` - chỉ yêu cầu xác nhận khi danh sách cho phép không khớp.
- `always` - yêu cầu xác nhận cho mọi lệnh. Mức tin cậy lâu dài `allow-always` **không** ngăn yêu cầu xác nhận khi chế độ yêu cầu xác nhận có hiệu lực là `always`.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  Cách xử lý khi cần hiển thị yêu cầu xác nhận nhưng không thể truy cập giao diện người dùng (hoặc yêu cầu hết thời gian chờ). Mặc định là `deny` khi bị bỏ qua.

- `deny` - chặn.
- `allowlist` - chỉ cho phép nếu khớp danh sách cho phép.
- `full` - cho phép.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  Khi là `true`, coi các hình thức đánh giá mã nội tuyến là chỉ được phép thông qua phê duyệt, ngay cả khi bản thân tệp nhị phân của trình thông dịch nằm trong danh sách cho phép. Đây là biện pháp phòng thủ nhiều lớp dành cho các trình nạp của trình thông dịch không ánh xạ rõ ràng đến một toán hạng tệp ổn định duy nhất.
</ParamField>

Các ví dụ mà chế độ nghiêm ngặt phát hiện: `python -c`, `node -e`/`--eval`/`-p`, `ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e` (cũng như các hình thức nội tuyến của `awk`, `sed`, `make`, `find -exec` và `xargs`).

Trong chế độ nghiêm ngặt, các lệnh này cần được người đánh giá hoặc người dùng phê duyệt rõ ràng. Với `tools.exec.mode: "auto"`, người đánh giá có thể cho phép một lần thực thi có rủi ro thấp khi lệnh có kế hoạch có thể cưỡng chế; nếu không, OpenClaw sẽ yêu cầu con người phê duyệt.
Các phê duyệt lệnh của `Codex app-server` đi đến phương án dự phòng dành cho người đánh giá sẽ yêu cầu con người phê duyệt vì yêu cầu phê duyệt của chúng không cung cấp tệp thực thi đã phân giải và có thể cưỡng chế.
`allow-always` không duy trì các mục danh sách cho phép mới cho lệnh đánh giá nội tuyến.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Chỉ dành cho trình bày: khi được bật, OpenClaw có thể đính kèm các đoạn lệnh bắt nguồn từ trình phân tích cú pháp để yêu cầu phê duyệt trên web có thể tô sáng các token lệnh. Tùy chọn này **không** thay đổi `security`, `ask`, việc so khớp danh sách cho phép, hành vi đánh giá nội tuyến nghiêm ngặt, chuyển tiếp phê duyệt hoặc thực thi lệnh.
</ParamField>

Đặt trên toàn cục tại `tools.exec.commandHighlighting` hoặc theo từng tác nhân tại `agents.list[].tools.exec.commandHighlighting`.

## Chế độ YOLO (không cần phê duyệt)

Để thực thi trên máy chủ mà không hiển thị yêu cầu phê duyệt, hãy mở **cả hai** lớp chính sách: chính sách thực thi được yêu cầu trong cấu hình OpenClaw (`tools.exec.*`) **và** chính sách phê duyệt cục bộ của máy chủ trong tệp phê duyệt của máy chủ thực thi.

Nếu bỏ qua, `askFallback` mặc định là `deny`. Đặt rõ ràng `askFallback` của máy chủ thành `full` khi yêu cầu phê duyệt không có giao diện người dùng cần chuyển sang cho phép.

| Lớp                   | Cài đặt YOLO                |
| --------------------- | --------------------------- |
| `tools.exec.security` | `full` trên `gateway`/`node` |
| `tools.exec.ask`      | `off`                       |
| `askFallback` máy chủ | `full`                      |

<Warning>
**Các điểm khác biệt quan trọng:**

- `tools.exec.host=auto` chọn **nơi** thực thi lệnh: sandbox khi khả dụng, nếu không thì Gateway.
- YOLO chọn **cách** phê duyệt việc thực thi trên máy chủ: `security=full` kết hợp với `ask=off`.
- YOLO **không** thêm một cổng phê duyệt riêng dựa trên suy đoán về việc làm rối lệnh hoặc một lớp từ chối kiểm tra trước tập lệnh lên trên chính sách thực thi trên máy chủ đã cấu hình.
- `auto` không biến việc định tuyến qua Gateway thành một ghi đè tự do từ phiên trong sandbox. Yêu cầu `host=node` theo từng lệnh gọi được cho phép từ `auto`; `host=gateway` chỉ được cho phép từ `auto` khi không có môi trường chạy sandbox nào đang hoạt động. Để có giá trị mặc định ổn định không phải `auto`, hãy đặt `tools.exec.host` hoặc sử dụng rõ ràng `/exec host=...`.

</Warning>

Các nhà cung cấp dựa trên CLI có chế độ quyền không tương tác riêng có thể tuân theo chính sách này. Claude CLI thêm `--permission-mode bypassPermissions` khi chính sách thực thi hiệu lực của OpenClaw là YOLO. Đối với các phiên Claude trực tiếp do OpenClaw quản lý, chính sách thực thi hiệu lực của OpenClaw có thẩm quyền cao hơn chế độ quyền gốc của Claude: YOLO chuẩn hóa các lần khởi chạy trực tiếp thành `--permission-mode bypassPermissions`, còn chính sách thực thi hiệu lực hạn chế chuẩn hóa các lần khởi chạy trực tiếp thành `--permission-mode default`, ngay cả khi các đối số thô của phần phụ trợ Claude chỉ định một chế độ khác.

Nếu muốn thiết lập thận trọng hơn, hãy siết lại chính sách thực thi của OpenClaw thành `allowlist` / `on-miss` hoặc `deny`.

### Thiết lập "không bao giờ nhắc" lâu dài trên máy chủ Gateway

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

Cập nhật cả `tools.exec.host/security/ask` cục bộ và các giá trị mặc định trong tệp phê duyệt cục bộ (bao gồm `askFallback: "full"`). Lệnh này được thiết kế chỉ dành cho cục bộ. Để thay đổi từ xa các phê duyệt trên máy chủ Gateway hoặc máy chủ Node, hãy dùng `openclaw approvals set --gateway` hoặc `openclaw approvals set --node
<id|name|ip>`.

Các cấu hình đặt sẵn tích hợp khác: `cautious` (`host=gateway`, `security=allowlist`, `ask=on-miss`, `askFallback=deny`) và `deny-all` (`host=gateway`, `security=deny`, `ask=off`, `askFallback=deny`). Áp dụng theo cùng cách:
`openclaw exec-policy preset cautious`.

Để đặt từng trường riêng lẻ thay vì toàn bộ cấu hình đặt sẵn, hãy dùng
`openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>` với bất kỳ tập con nào của các cờ đó.

### Máy chủ Node

Thay vào đó, hãy áp dụng cùng tệp phê duyệt trên Node:

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
**Các giới hạn chỉ dành cho cục bộ:**

- `openclaw exec-policy` không đồng bộ các phê duyệt của Node.
- `openclaw exec-policy set --host node` bị từ chối.
- Các phê duyệt thực thi của Node được truy xuất từ Node khi chạy, vì vậy các bản cập nhật nhắm đến Node phải dùng `openclaw approvals --node ...`.

</Note>

### Lối tắt chỉ dành cho phiên

- `/exec security=full ask=off` chỉ thay đổi phiên hiện tại.
- `/elevated full` là lối tắt khẩn cấp bỏ qua các phê duyệt thực thi chỉ khi cả chính sách được yêu cầu và tệp phê duyệt của máy chủ đều được phân giải thành `security: "full"` và `ask: "off"`. Tệp máy chủ nghiêm ngặt hơn, chẳng hạn như `ask:
"always"`, vẫn hiển thị lời nhắc.

Nếu tệp phê duyệt của máy chủ vẫn nghiêm ngặt hơn cấu hình, chính sách máy chủ nghiêm ngặt hơn vẫn được ưu tiên.

## Danh sách cho phép (theo từng tác nhân)

Danh sách cho phép được thiết lập **theo từng tác nhân**. Nếu có nhiều tác nhân, hãy chuyển sang tác nhân bạn muốn chỉnh sửa trong ứng dụng macOS. Các mẫu được đối sánh theo glob.

Mẫu có thể là glob đường dẫn tệp nhị phân đã phân giải hoặc glob tên lệnh thuần túy. Tên thuần túy chỉ khớp với các lệnh được gọi thông qua `PATH`, vì vậy `rg` có thể khớp với `/opt/homebrew/bin/rg` khi lệnh là `rg`, nhưng **không** khớp với `./rg` hoặc `/tmp/rg`. Hãy dùng glob đường dẫn để tin cậy một vị trí tệp nhị phân cụ thể.

Các mục `agents.default` cũ được di chuyển sang `agents.main` khi tải. Các chuỗi lệnh shell như `echo ok && pwd` vẫn yêu cầu mọi phân đoạn cấp cao nhất đáp ứng các quy tắc của danh sách cho phép.

Ví dụ:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### Hạn chế đối số bằng argPattern

Thêm `argPattern` khi một mục trong danh sách cho phép cần khớp với một tệp nhị phân và một cấu trúc đối số cụ thể. OpenClaw sử dụng ngữ nghĩa biểu thức chính quy ECMAScript (JavaScript) trên mọi máy chủ và đánh giá biểu thức dựa trên các đối số lệnh đã phân tích cú pháp, không bao gồm token tệp thực thi (`argv[0]`). Đối với các mục được tạo thủ công, các đối số được nối bằng một dấu cách, vì vậy hãy neo mẫu khi cần khớp chính xác.

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

Mục đó cho phép `python3 safe.py`; `python3 other.py` không khớp danh sách cho phép. Nếu cũng có một mục chỉ chứa đường dẫn cho cùng tệp nhị phân, các đối số không khớp vẫn có thể dùng mục chỉ chứa đường dẫn đó làm phương án dự phòng. Hãy bỏ mục chỉ chứa đường dẫn khi mục tiêu là giới hạn tệp nhị phân ở các đối số đã khai báo.

Các mục được lưu bởi luồng phê duyệt sử dụng định dạng dấu phân cách nội bộ để đối sánh argv chính xác. Nên dùng giao diện người dùng hoặc luồng phê duyệt để tạo lại các mục đó thay vì chỉnh sửa thủ công giá trị đã mã hóa. Nếu OpenClaw không thể phân tích cú pháp argv cho một phân đoạn lệnh, các mục có `argPattern` sẽ không khớp.

Mỗi mục trong danh sách cho phép hỗ trợ:

| Trường             | Ý nghĩa                                                   |
| ------------------ | --------------------------------------------------------- |
| `pattern`          | Glob đường dẫn tệp nhị phân đã phân giải hoặc glob tên lệnh thuần túy |
| `argPattern`       | Biểu thức chính quy argv ECMAScript tùy chọn; nếu bỏ qua thì chỉ khớp đường dẫn |
| `id`               | ID ổn định, không mang ý nghĩa nội tại; được tạo dưới dạng UUID khi không có |
| `source`           | Nguồn của mục, chẳng hạn như `allow-always`               |
| `commandText`      | Đầu vào văn bản thuần cũ; bị loại bỏ trong khi tải         |
| `lastUsedAt`       | Dấu thời gian sử dụng gần nhất                             |
| `lastUsedCommand`  | Lệnh khớp gần nhất                                         |
| `lastResolvedPath` | Đường dẫn tệp nhị phân được phân giải gần nhất             |

## Tự động cho phép CLI của Skills

Khi **Tự động cho phép CLI của Skills** (`autoAllowSkills`) được bật, các tệp thực thi được tham chiếu bởi những Skills đã biết sẽ được coi là nằm trong danh sách cho phép trên các Node (Node macOS hoặc máy chủ Node không giao diện). Cơ chế này dùng `skills.bins` qua RPC của Gateway để truy xuất danh sách tệp nhị phân của Skills. Hãy tắt tùy chọn này nếu bạn muốn danh sách cho phép thủ công nghiêm ngặt.

<Warning>
- Đây là một **danh sách cho phép tiện lợi ngầm định**, tách biệt với các mục danh sách cho phép đường dẫn thủ công.
- Tính năng này dành cho các môi trường vận hành đáng tin cậy, nơi Gateway và Node nằm trong cùng một ranh giới tin cậy.
- Nếu yêu cầu mức tin cậy tường minh nghiêm ngặt, hãy giữ `autoAllowSkills: false` và chỉ dùng các mục danh sách cho phép đường dẫn thủ công.

</Warning>

## Tệp nhị phân an toàn và chuyển tiếp phê duyệt

Để biết về các tệp nhị phân an toàn (đường dẫn nhanh chỉ dùng stdin), chi tiết liên kết trình thông dịch và cách chuyển tiếp lời nhắc phê duyệt đến Slack/Discord/Telegram (hoặc chạy chúng dưới dạng ứng dụng phê duyệt gốc), hãy xem
[Phê duyệt thực thi - nâng cao](/vi/tools/exec-approvals-advanced).

## Chỉnh sửa trong giao diện điều khiển

Dùng thẻ **Giao diện điều khiển -> Node -> Phê duyệt thực thi** để chỉnh sửa các giá trị mặc định, phần ghi đè theo từng tác nhân và danh sách cho phép. Chọn một phạm vi (Mặc định hoặc một tác nhân), điều chỉnh chính sách, thêm/xóa các mẫu danh sách cho phép, rồi nhấn **Lưu**. Giao diện hiển thị siêu dữ liệu về lần sử dụng gần nhất cho mỗi mẫu để bạn có thể giữ danh sách gọn gàng.

Bộ chọn đích chọn **Gateway** (phê duyệt cục bộ) hoặc một **Node**. Các Node phải công bố `system.execApprovals.get/set` (ứng dụng macOS hoặc máy chủ Node không giao diện). Nếu một Node chưa công bố khả năng phê duyệt thực thi, hãy chỉnh sửa trực tiếp tệp phê duyệt cục bộ của Node đó.

Một số máy chủ Node, bao gồm ứng dụng đồng hành trên Windows, sở hữu định dạng chính sách phê duyệt khác. Giao diện điều khiển hiển thị các chính sách gốc của máy chủ này ở chế độ chỉ đọc. Hãy dùng ứng dụng đồng hành hoặc `openclaw approvals set --node <id|name|ip>` với cấu trúc chính sách gốc để chỉnh sửa; xem [CLI phê duyệt](/vi/cli/approvals).

CLI: `openclaw approvals` hỗ trợ chỉnh sửa Gateway hoặc Node — xem
[CLI phê duyệt](/vi/cli/approvals).

## Luồng phê duyệt

Khi cần lời nhắc, Gateway phát `exec.approval.requested` tới các ứng dụng vận hành. Giao diện điều khiển và ứng dụng macOS xử lý yêu cầu qua `exec.approval.resolve`, sau đó Gateway chuyển tiếp yêu cầu đã được phê duyệt tới máy chủ Node.

Đối với `host=node`, yêu cầu phê duyệt bao gồm tải trọng `systemRunPlan` chuẩn tắc. Gateway dùng kế hoạch đó làm ngữ cảnh lệnh/cwd/phiên có thẩm quyền khi chuyển tiếp các yêu cầu `system.run` đã được phê duyệt:

- Đường dẫn thực thi của Node chuẩn bị trước một kế hoạch chuẩn tắc duy nhất.
- Bản ghi phê duyệt lưu trữ kế hoạch đó và siêu dữ liệu liên kết của nó.
- Sau khi được phê duyệt, lệnh gọi `system.run` cuối cùng được chuyển tiếp sẽ tái sử dụng kế hoạch đã lưu thay vì tin cậy các chỉnh sửa sau đó từ bên gọi.
- Nếu bên gọi thay đổi `command`, `rawCommand`, `cwd`, `agentId` hoặc `sessionKey` sau khi yêu cầu phê duyệt được tạo, Gateway sẽ từ chối lần chạy được chuyển tiếp do phê duyệt không khớp.

## Sự kiện hệ thống và từ chối

Vòng đời thực thi đăng một thông báo hệ thống `Exec finished` vào phiên của tác nhân sau khi Node báo cáo hoàn tất. OpenClaw cũng có thể phát thông báo đang xử lý sau khi phê duyệt được cấp và `tools.exec.approvalRunningNoticeMs` đã trôi qua (mặc định `10000`; `0` sẽ tắt tính năng này). Phê duyệt thực thi bị từ chối sẽ chấm dứt lệnh trên máy chủ: lệnh không được chạy.

- Đối với phê duyệt bất đồng bộ của tác nhân chính có phiên khởi tạo, OpenClaw đăng thông báo từ chối trở lại phiên đó dưới dạng phản hồi tiếp nối nội bộ để tác nhân có thể ngừng chờ lệnh bất đồng bộ và tránh phải sửa chữa do thiếu kết quả.
- Nếu không có phiên hoặc không thể tiếp tục phiên, OpenClaw vẫn có thể báo cáo ngắn gọn việc từ chối cho người vận hành hoặc tuyến trò chuyện trực tiếp.
- Các trường hợp từ chối đối với phiên của tác nhân phụ và Cron không được đăng trở lại phiên đó.

Các phê duyệt thực thi trên máy chủ Gateway phát cùng sự kiện vòng đời hoàn tất. Các lệnh thực thi bị ràng buộc bởi phê duyệt tái sử dụng ID phê duyệt để liên kết yêu cầu đang chờ với thông báo hoàn tất/từ chối tương ứng (`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`).

## Hệ quả

- **`full`** có quyền năng lớn; nên ưu tiên danh sách cho phép khi có thể.
- **`ask`** giúp bạn luôn nắm được tình hình trong khi vẫn cho phép phê duyệt nhanh.
- Danh sách cho phép theo từng tác nhân ngăn phê duyệt của một tác nhân ảnh hưởng sang tác nhân khác.
- Phê duyệt chỉ áp dụng cho yêu cầu thực thi trên máy chủ từ **người gửi được ủy quyền**. Người gửi không được ủy quyền không thể phát hành `/exec`.
- `/exec security=full` là tiện ích cấp phiên dành cho người vận hành được ủy quyền và được thiết kế để bỏ qua phê duyệt. Để chặn cứng hoạt động thực thi trên máy chủ, hãy đặt mức bảo mật phê duyệt thành `deny` hoặc từ chối công cụ `exec` thông qua chính sách công cụ.

## Liên quan

<CardGroup cols={2}>
  <Card title="Phê duyệt thực thi - nâng cao" href="/vi/tools/exec-approvals-advanced" icon="gear">
    Tệp nhị phân an toàn, liên kết trình thông dịch và chuyển tiếp phê duyệt tới cuộc trò chuyện.
  </Card>
  <Card title="Công cụ thực thi" href="/vi/tools/exec" icon="terminal">
    Công cụ thực thi lệnh shell.
  </Card>
  <Card title="Chế độ nâng quyền" href="/vi/tools/elevated" icon="shield-exclamation">
    Đường dẫn khẩn cấp cũng bỏ qua phê duyệt.
  </Card>
  <Card title="Cô lập" href="/vi/gateway/sandboxing" icon="box">
    Các chế độ cô lập và quyền truy cập không gian làm việc.
  </Card>
  <Card title="Bảo mật" href="/vi/gateway/security" icon="lock">
    Mô hình bảo mật và gia cố hệ thống.
  </Card>
  <Card title="Cô lập so với chính sách công cụ so với nâng quyền" href="/vi/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    Khi nào nên sử dụng từng cơ chế kiểm soát.
  </Card>
  <Card title="Skills" href="/vi/tools/skills" icon="sparkles">
    Hành vi tự động cho phép dựa trên Skills.
  </Card>
</CardGroup>
