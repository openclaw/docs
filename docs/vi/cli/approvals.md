---
read_when:
    - Bạn muốn chỉnh sửa các phê duyệt exec từ CLI
    - Bạn cần quản lý danh sách cho phép trên các máy chủ Gateway hoặc Node
summary: Tài liệu tham khảo CLI cho `openclaw approvals` và `openclaw exec-policy`
title: Phê duyệt
x-i18n:
    generated_at: "2026-04-29T22:29:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7403f0e35616db5baf3d1564c8c405b3883fc3e5032da9c6a19a32dba8c5fb7d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Quản lý phê duyệt exec cho **máy chủ cục bộ**, **máy chủ gateway**, hoặc **máy chủ node**.
Theo mặc định, các lệnh nhắm tới tệp phê duyệt cục bộ trên đĩa. Dùng `--gateway` để nhắm tới gateway, hoặc `--node` để nhắm tới một node cụ thể.

Bí danh: `openclaw exec-approvals`

Liên quan:

- Phê duyệt exec: [Phê duyệt exec](/vi/tools/exec-approvals)
- Các node: [Các node](/vi/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` là lệnh tiện ích cục bộ để giữ cấu hình
`tools.exec.*` được yêu cầu và tệp phê duyệt của máy chủ cục bộ đồng bộ trong một bước.

Dùng lệnh này khi bạn muốn:

- kiểm tra chính sách cục bộ được yêu cầu, tệp phê duyệt của máy chủ, và kết quả hợp nhất hiệu dụng
- áp dụng một preset cục bộ như YOLO hoặc deny-all
- đồng bộ `tools.exec.*` cục bộ và `~/.openclaw/exec-approvals.json` cục bộ

Ví dụ:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Chế độ đầu ra:

- không có `--json`: in chế độ xem bảng dễ đọc cho người dùng
- `--json`: in đầu ra có cấu trúc đọc được bằng máy

Phạm vi hiện tại:

- `exec-policy` **chỉ cục bộ**
- lệnh này cập nhật đồng thời tệp cấu hình cục bộ và tệp phê duyệt cục bộ
- lệnh này **không** đẩy chính sách tới máy chủ gateway hoặc máy chủ node
- `--host node` bị từ chối trong lệnh này vì phê duyệt exec của node được lấy từ node khi chạy và thay vào đó phải được quản lý thông qua các lệnh phê duyệt nhắm tới node
- `openclaw exec-policy show` đánh dấu các phạm vi `host=node` là do node quản lý khi chạy thay vì suy ra chính sách hiệu dụng từ tệp phê duyệt cục bộ

Nếu bạn cần chỉnh sửa trực tiếp phê duyệt của máy chủ từ xa, hãy tiếp tục dùng `openclaw approvals set --gateway`
hoặc `openclaw approvals set --node <id|name|ip>`.

## Các lệnh thường dùng

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` hiện hiển thị chính sách exec hiệu dụng cho các mục tiêu cục bộ, gateway, và node:

- chính sách `tools.exec` được yêu cầu
- chính sách trong tệp phê duyệt của máy chủ
- kết quả hiệu dụng sau khi áp dụng các quy tắc ưu tiên

Thứ tự ưu tiên là có chủ đích:

- tệp phê duyệt của máy chủ là nguồn chân lý có thể thực thi
- chính sách `tools.exec` được yêu cầu có thể thu hẹp hoặc mở rộng ý định, nhưng kết quả hiệu dụng vẫn được suy ra từ các quy tắc của máy chủ
- `--node` kết hợp tệp phê duyệt của máy chủ node với chính sách `tools.exec` của gateway, vì cả hai vẫn áp dụng khi chạy
- nếu không có cấu hình gateway, CLI quay lại ảnh chụp phê duyệt của node và ghi chú rằng không thể tính toán chính sách cuối cùng khi chạy

## Thay thế phê duyệt từ một tệp

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` chấp nhận JSON5, không chỉ JSON nghiêm ngặt. Dùng `--file` hoặc `--stdin`, không dùng cả hai.

## Ví dụ "Không bao giờ nhắc" / YOLO

Đối với máy chủ không bao giờ được dừng vì phê duyệt exec, đặt giá trị mặc định phê duyệt của máy chủ thành `full` + `off`:

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

Biến thể cho node:

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

Việc này chỉ thay đổi **tệp phê duyệt của máy chủ**. Để giữ chính sách OpenClaw được yêu cầu đồng bộ, cũng đặt:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

Lý do dùng `tools.exec.host=gateway` trong ví dụ này:

- `host=auto` vẫn có nghĩa là "dùng sandbox khi có, nếu không thì gateway".
- YOLO liên quan đến phê duyệt, không phải định tuyến.
- Nếu bạn muốn exec trên máy chủ ngay cả khi đã cấu hình sandbox, hãy chỉ định rõ lựa chọn máy chủ bằng `gateway` hoặc `/exec host=gateway`.

Điều này khớp với hành vi YOLO mặc định cho máy chủ hiện tại. Hãy siết chặt nếu bạn muốn có phê duyệt.

Lối tắt cục bộ:

```bash
openclaw exec-policy preset yolo
```

Lối tắt cục bộ đó cập nhật đồng thời cả cấu hình `tools.exec.*` cục bộ được yêu cầu và
các giá trị mặc định phê duyệt cục bộ. Về ý định, nó tương đương với thiết lập thủ công hai bước
ở trên, nhưng chỉ dành cho máy cục bộ.

## Trình trợ giúp danh sách cho phép

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Tùy chọn thường dùng

`get`, `set`, và `allowlist add|remove` đều hỗ trợ:

- `--node <id|name|ip>`
- `--gateway`
- các tùy chọn RPC node dùng chung: `--url`, `--token`, `--timeout`, `--json`

Ghi chú về nhắm mục tiêu:

- không có cờ mục tiêu nghĩa là tệp phê duyệt cục bộ trên đĩa
- `--gateway` nhắm tới tệp phê duyệt của máy chủ gateway
- `--node` nhắm tới một máy chủ node sau khi phân giải id, tên, IP, hoặc tiền tố id

`allowlist add|remove` cũng hỗ trợ:

- `--agent <id>` (mặc định là `*`)

## Ghi chú

- `--node` dùng cùng bộ phân giải như `openclaw nodes` (id, tên, ip, hoặc tiền tố id).
- `--agent` mặc định là `"*"`, áp dụng cho tất cả agent.
- Máy chủ node phải quảng bá `system.execApprovals.get/set` (ứng dụng macOS hoặc máy chủ node headless).
- Tệp phê duyệt được lưu theo từng máy chủ tại `~/.openclaw/exec-approvals.json`.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Phê duyệt exec](/vi/tools/exec-approvals)
