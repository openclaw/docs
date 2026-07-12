---
read_when:
    - Bạn muốn chỉnh sửa các phê duyệt thực thi từ CLI
    - Bạn cần quản lý danh sách cho phép trên các máy chủ Gateway hoặc Node
summary: Tài liệu tham khảo CLI cho `openclaw approvals` và `openclaw exec-policy`
title: Phê duyệt
x-i18n:
    generated_at: "2026-07-12T07:43:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Quản lý phê duyệt thực thi cho **máy cục bộ**, **máy Gateway** hoặc **máy Node**. Khi không có cờ đích, các lệnh đọc/ghi tệp phê duyệt cục bộ trên đĩa. Dùng `--gateway` để nhắm đến Gateway hoặc `--node <id|name|ip>` để nhắm đến một Node cụ thể.

Bí danh: `openclaw exec-approvals`

Liên quan: [Phê duyệt thực thi](/vi/tools/exec-approvals), [Các Node](/vi/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` là lệnh tiện ích **chỉ dành cho máy cục bộ**, giúp đồng bộ cấu hình `tools.exec.*` được yêu cầu và tệp phê duyệt của máy cục bộ chỉ trong một bước:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Các bộ thiết lập sẵn (`yolo`, `cautious`, `deny-all`) áp dụng đồng thời `host`, `security`, `ask` và `askFallback`. `set` chỉ áp dụng các cờ bạn truyền vào; mỗi giá trị được chấp nhận đều được xác thực (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Phạm vi:

- Cập nhật đồng thời tệp cấu hình cục bộ và tệp phê duyệt cục bộ; không đẩy chính sách đến Gateway hoặc máy Node.
- `--host node` bị từ chối: phê duyệt thực thi của Node được lấy từ Node trong thời gian chạy, vì vậy `exec-policy` cục bộ không thể đồng bộ chúng. Thay vào đó, hãy dùng `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` đánh dấu các phạm vi `host=node` là do Node quản lý trong thời gian chạy, thay vì suy ra chính sách có hiệu lực từ tệp phê duyệt cục bộ.

Đối với phê duyệt trên máy từ xa, hãy dùng trực tiếp `openclaw approvals set --gateway` hoặc `openclaw approvals set --node <id|name|ip>`.

## Các lệnh thường dùng

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` hiển thị chính sách thực thi có hiệu lực cho đích: chính sách `tools.exec` được yêu cầu, chính sách trong tệp phê duyệt của máy và kết quả có hiệu lực sau khi hợp nhất. Các Node có chính sách gốc của máy, chẳng hạn như ứng dụng đồng hành trên Windows, sẽ hiển thị trực tiếp chính sách đó thay vì áp dụng phép tính chính sách từ tệp phê duyệt của OpenClaw.

Đối với các Node sử dụng tệp, chế độ xem hợp nhất yêu cầu một ảnh chụp chính sách đã được phân giải trên máy. Các Node cũ hơn hiển thị chính sách có hiệu lực là không khả dụng, thay vì giả định rằng chính sách được yêu cầu của Gateway cũng áp dụng trên máy.

<Note>
Các ghi đè `/exec` theo từng phiên không được bao gồm. Hãy chạy `/exec` trong phiên liên quan để kiểm tra các giá trị mặc định hiện tại của phiên đó.
</Note>

Thứ tự ưu tiên:

- Tệp phê duyệt của máy là nguồn thông tin chuẩn có thể thực thi.
- Chính sách `tools.exec` được yêu cầu có thể thu hẹp hoặc mở rộng ý định, nhưng kết quả có hiệu lực được suy ra từ các quy tắc của máy.
- `--node` kết hợp tệp phê duyệt của máy Node với chính sách `tools.exec` của Gateway (cả hai đều áp dụng trong thời gian chạy).
- Nếu không có cấu hình Gateway, CLI sẽ dùng ảnh chụp phê duyệt của Node làm phương án dự phòng và ghi chú rằng không thể tính toán chính sách cuối cùng trong thời gian chạy.

## Thay thế phê duyệt từ một tệp

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` chấp nhận JSON5, không chỉ JSON nghiêm ngặt. Chỉ dùng một trong hai tùy chọn `--file` hoặc `--stdin`, không dùng đồng thời cả hai.

Các Node Windows dùng chính sách gốc của máy có cấu trúc chính sách riêng:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

Trước tiên, CLI đọc giá trị băm hiện tại của Node rồi gửi kèm giá trị đó trong bản cập nhật, nhờ vậy các chỉnh sửa cục bộ đồng thời sẽ bị từ chối thay vì bị ghi đè. `rules` là bắt buộc vì thao tác này thay thế toàn bộ danh sách quy tắc của Node; `defaultAction` là tùy chọn. Không thể cấu hình từ xa một Node báo cáo rằng chính sách gốc của nó đã bị vô hiệu hóa; trước tiên, hãy bật hoặc cấu hình chính sách trên máy đó. Các chính sách gốc của máy không hỗ trợ các tiện ích `allowlist add|remove`.

## Ví dụ "Không bao giờ nhắc" / YOLO

Đặt giá trị mặc định phê duyệt của máy thành `full` + `off` cho một máy không bao giờ được dừng lại để chờ phê duyệt thực thi:

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

Đối với các Node cung cấp tệp phê duyệt OpenClaw, hãy dùng cùng nội dung với `openclaw approvals set --node <id|name|ip> --stdin`. Các Node dùng chính sách gốc của máy yêu cầu cấu trúc riêng theo chủ sở hữu như minh họa ở trên.

Thao tác này chỉ thay đổi **tệp phê duyệt của máy**. Để giữ cho chính sách OpenClaw được yêu cầu đồng bộ, hãy đặt thêm:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` được chỉ định rõ ở đây vì `host=auto` vẫn có nghĩa là "dùng sandbox khi khả dụng, nếu không thì dùng Gateway": YOLO liên quan đến phê duyệt, không phải định tuyến. Dùng `gateway` (hoặc `/exec host=gateway`) khi bạn muốn thực thi trên máy ngay cả khi đã cấu hình sandbox.

Nếu bỏ qua `askFallback`, giá trị mặc định là `deny`. Hãy đặt rõ `askFallback: "full"` khi nâng cấp một máy không có giao diện người dùng cần duy trì hành vi không bao giờ nhắc.

Lối tắt cục bộ cho cùng mục đích, chỉ trên máy cục bộ:

```bash
openclaw exec-policy preset yolo
```

## Tiện ích danh sách cho phép

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Các tùy chọn thường dùng

`get`, `set` và `allowlist add|remove` đều hỗ trợ:

- `--node <id|name|ip>` (phân giải mã định danh, tên, địa chỉ IP hoặc tiền tố mã định danh; dùng cùng bộ phân giải như `openclaw nodes`)
- `--gateway`
- các tùy chọn RPC Node dùng chung: `--url`, `--token`, `--timeout`, `--json`

Không có cờ đích nghĩa là sử dụng tệp phê duyệt cục bộ trên đĩa.

`allowlist add|remove` cũng hỗ trợ `--agent <id>` (mặc định là `"*"`, áp dụng cho tất cả tác tử).

## Ghi chú

- Máy Node phải công bố `system.execApprovals.get/set` (ứng dụng macOS, máy Node không giao diện hoặc ứng dụng đồng hành trên Windows).
- Các tệp phê duyệt được lưu riêng theo từng máy trong thư mục trạng thái OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json`, hoặc `~/.openclaw/exec-approvals.json` khi biến chưa được đặt.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Phê duyệt thực thi](/vi/tools/exec-approvals)
