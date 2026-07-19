---
read_when:
    - Bạn muốn chỉnh sửa các phê duyệt thực thi từ CLI
    - Bạn cần quản lý danh sách cho phép trên các máy chủ Gateway hoặc Node
    - Bạn cần liệt kê hoặc xử lý một yêu cầu phê duyệt đang chờ mà không có giao diện trò chuyện
summary: Tài liệu tham khảo CLI cho `openclaw approvals` và `openclaw exec-policy`
title: Phê duyệt
x-i18n:
    generated_at: "2026-07-19T16:52:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 739d9521dc625571affe1590d5bb2511560029ac6f007b2a422f0606bdb90059
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

Quản lý phê duyệt thực thi cho **máy cục bộ**, **máy Gateway** hoặc **máy Node**. Khi không có cờ đích, các lệnh đọc/ghi tệp phê duyệt cục bộ trên đĩa. Dùng `--gateway` để nhắm đến Gateway hoặc `--node <id|name|ip>` để nhắm đến một Node cụ thể.

Bí danh: `openclaw exec-approvals`

Liên quan: [Phê duyệt thực thi](/vi/tools/exec-approvals), [Các Node](/vi/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` là lệnh tiện ích **chỉ dành cho cục bộ**, giúp đồng bộ cấu hình `tools.exec.*` được yêu cầu và tệp phê duyệt của máy cục bộ chỉ trong một bước:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

Các cấu hình đặt trước (`yolo`, `cautious`, `deny-all`) áp dụng đồng thời `host`, `security`, `ask` và `askFallback`. `set` chỉ áp dụng các cờ bạn truyền; mỗi giá trị được chấp nhận đều được xác thực (`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

Phạm vi:

- Cập nhật đồng thời tệp cấu hình cục bộ và tệp phê duyệt cục bộ; không đẩy chính sách đến Gateway hoặc máy Node.
- `--host node` bị từ chối: phê duyệt thực thi của Node được truy xuất từ Node trong thời gian chạy, vì vậy `exec-policy` cục bộ không thể đồng bộ chúng. Thay vào đó, hãy dùng `openclaw approvals set --node <id|name|ip>`.
- `exec-policy show` đánh dấu các phạm vi `host=node` là do Node quản lý trong thời gian chạy thay vì suy ra chính sách hiệu lực từ tệp phê duyệt cục bộ.

Đối với phê duyệt trên máy từ xa, hãy dùng trực tiếp `openclaw approvals set --gateway` hoặc `openclaw approvals set --node <id|name|ip>`.

## Các lệnh thường dùng

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
openclaw approvals pending
openclaw approvals resolve <id> <allow-once|allow-always|deny>
```

`get` hiển thị chính sách thực thi hiệu lực cho đích: chính sách `tools.exec` được yêu cầu, chính sách trong tệp phê duyệt của máy và kết quả hiệu lực sau khi hợp nhất. Các Node có chính sách gốc của máy, chẳng hạn như ứng dụng đồng hành trên Windows, hiển thị trực tiếp chính sách đó thay vì áp dụng phép tính chính sách từ tệp phê duyệt của OpenClaw.

Đối với các Node dựa trên tệp, chế độ xem hợp nhất yêu cầu ảnh chụp nhanh chính sách đã được máy phân giải. Các Node cũ hơn hiển thị chính sách hiệu lực là không khả dụng thay vì giả định rằng chính sách được yêu cầu của Gateway cũng áp dụng trên máy.

<Note>
Các ghi đè `/exec` theo phiên không được bao gồm. Chạy `/exec` trong phiên liên quan để kiểm tra các giá trị mặc định hiện tại của phiên đó.
</Note>

Thứ tự ưu tiên:

- Tệp phê duyệt của máy là nguồn sự thật có thể thực thi.
- Chính sách `tools.exec` được yêu cầu có thể thu hẹp hoặc mở rộng ý định, nhưng kết quả hiệu lực được suy ra từ các quy tắc của máy.
- `--node` kết hợp tệp phê duyệt của máy Node với chính sách `tools.exec` của Gateway (cả hai đều áp dụng trong thời gian chạy).
- Nếu cấu hình Gateway không khả dụng, CLI quay về dùng ảnh chụp nhanh phê duyệt của Node và ghi chú rằng không thể tính toán chính sách thời gian chạy cuối cùng.

## Phê duyệt đang chờ xử lý

Liệt kê các phê duyệt thực thi, Plugin và tác nhân hệ thống OpenClaw đang chờ xử lý từ Gateway:

```bash
openclaw approvals pending
openclaw approvals pending --json
```

Việc liệt kê đầy đủ và luồng `resolve` tương ứng trên toàn bộ phạm vi vận hành sử dụng `operator.admin` vì nếu không, các bản ghi phê duyệt vẫn giữ bộ lọc theo người yêu cầu/người review. Quá trình phân giải cũng yêu cầu phạm vi `operator.approvals` chuyên dụng. Quyền cấp tiêu chuẩn cho người vận hành CLI bao gồm cả hai phạm vi; máy khách bên thứ ba bị hạn chế không nên yêu cầu quyền quản trị chỉ để mô phỏng lệnh này.

Đầu ra dành cho người đọc hiển thị loại phê duyệt, thông tin quy thuộc tác nhân/phiên, tuổi của yêu cầu, thời gian còn lại trước khi hết hạn, lệnh hoặc nội dung tóm tắt đã rút gọn và token mã định danh `id64_<base64url>` trung lập với shell. Một khối `Full request text` luôn xuất hiện sau bảng thu gọn, chứa mọi token đầy đủ và yêu cầu được thoát ký tự mà không mất dữ liệu, nhờ đó việc rút gọn theo chiều rộng thiết bị đầu cuối không thể che mất hậu tố hoặc token cần thiết để phân giải. Sao chép token đầy đủ vào `resolve`. Các ký tự thiết bị đầu cuối không an toàn trong những trường khác được hiển thị dưới dạng chuỗi thoát Unicode nhìn thấy được. Đầu ra JSON trả về các mục đã chuẩn hóa trong `approvals`, đồng thời giữ nguyên các giá trị thô ban đầu `id`, `summary`, `createdAtMs` và `expiresAtMs` cho tập lệnh; các mã định danh thô vẫn được `resolve` chấp nhận, trừ khi chúng sử dụng tiền tố token hiển thị dành riêng `id64_`.

Nếu một giá trị `id64_` được cung cấp khớp cả với một mã định danh thô theo nghĩa đen lẫn token hiển thị đã giải mã của một phê duyệt khác, CLI sẽ từ chối vì không rõ nghĩa thay vì mạo hiểm phân giải nhầm yêu cầu.

Phân giải một phê duyệt bằng mã định danh đầy đủ của nó:

```bash
openclaw approvals resolve <id> allow-once
openclaw approvals resolve <id> allow-always
openclaw approvals resolve <id> deny --reason "Không được dự kiến trong thời gian bảo trì"
```

CLI đọc bản ghi phê duyệt hợp nhất để xác định loại, kiểm tra quyết định được yêu cầu dựa trên các quyết định mà bản ghi cho phép, sau đó gọi trình phân giải hợp nhất. Quyết định thành công đầu tiên thoát với `0`. Việc lặp lại quyết định đã ghi cũng thoát với `0` và báo cáo `already resolved (same decision)`. Quyết định xung đột, phê duyệt bị thiếu, phê duyệt đã hết hạn hoặc quyết định không khả dụng cho loại phê duyệt đó sẽ in lỗi rõ ràng và thoát với mã khác không.

`--reason` thêm ghi chú cục bộ vào thông báo xác nhận của CLI. Bản ghi phê duyệt Gateway hiện tại không có trường lý do phân giải dạng văn bản tự do, vì vậy ghi chú này không được lưu trữ lâu dài hoặc gửi đến các bề mặt phê duyệt khác.

## Thay thế phê duyệt từ một tệp

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` chấp nhận JSON5, không chỉ JSON nghiêm ngặt. Chỉ dùng một trong hai: `--file` hoặc `--stdin`.

Các Node Windows gốc của máy sử dụng cấu trúc chính sách riêng:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI đọc hàm băm hiện tại của Node trước rồi gửi cùng bản cập nhật, nhờ đó các chỉnh sửa cục bộ đồng thời bị từ chối thay vì bị ghi đè. `rules` là bắt buộc vì thao tác này thay thế toàn bộ danh sách quy tắc của Node; `defaultAction` là tùy chọn. Không thể cấu hình từ xa một Node báo cáo rằng chính sách gốc của nó đang bị vô hiệu hóa; trước tiên hãy bật hoặc cấu hình chính sách trên máy đó. Các chính sách gốc của máy không hỗ trợ các trình trợ giúp `allowlist add|remove`.

## Ví dụ "Không bao giờ nhắc" / YOLO

Đặt giá trị mặc định phê duyệt của máy thành `full` + `off` cho máy không bao giờ được dừng lại vì phê duyệt thực thi:

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

Đối với các Node cung cấp tệp phê duyệt OpenClaw, hãy dùng cùng nội dung với `openclaw approvals set --node <id|name|ip> --stdin`. Các Node gốc của máy yêu cầu cấu trúc dành riêng cho chủ sở hữu như trình bày ở trên.

Thao tác này chỉ thay đổi **tệp phê duyệt của máy**. Để giữ cho chính sách OpenClaw được yêu cầu luôn đồng bộ, hãy đặt thêm:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

`tools.exec.host=gateway` được chỉ định rõ ràng ở đây vì `host=auto` vẫn có nghĩa là "dùng sandbox khi khả dụng, nếu không thì dùng Gateway": YOLO liên quan đến phê duyệt, không phải định tuyến. Dùng `gateway` (hoặc `/exec host=gateway`) khi bạn muốn thực thi trên máy ngay cả khi đã cấu hình sandbox.

Khi bỏ qua, `askFallback` mặc định là `deny`. Đặt rõ `askFallback: "full"` khi nâng cấp một máy không có giao diện người dùng cần duy trì hành vi không bao giờ nhắc.

Lối tắt cục bộ cho cùng mục đích, chỉ trên máy cục bộ:

```bash
openclaw exec-policy preset yolo
```

## Trình trợ giúp danh sách cho phép

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## Các tùy chọn thường dùng

`get`, `set` và `allowlist add|remove` đều hỗ trợ:

- `--node <id|name|ip>` (phân giải mã định danh, tên, IP hoặc tiền tố mã định danh; dùng cùng trình phân giải như `openclaw nodes`)
- `--gateway`
- các tùy chọn RPC Node dùng chung: `--url`, `--token`, `--timeout`, `--json`

Không có cờ đích nghĩa là dùng tệp phê duyệt cục bộ trên đĩa.

`allowlist add|remove` cũng hỗ trợ `--agent <id>` (mặc định là `"*"`, áp dụng cho tất cả tác nhân).

`pending` và `resolve` luôn dùng Gateway vì các yêu cầu đang chờ xử lý là trạng thái trực tiếp của Gateway. Chúng hỗ trợ các tùy chọn kết nối Gateway dùng chung `--url`, `--token` và `--timeout`; `pending` cũng hỗ trợ `--json`.

## Ghi chú

- Máy Node phải công bố `system.execApprovals.get/set` (ứng dụng macOS, máy Node không giao diện hoặc ứng dụng đồng hành Windows).
- Các tệp phê duyệt được lưu theo từng máy trong thư mục trạng thái OpenClaw: `$OPENCLAW_STATE_DIR/exec-approvals.json`, hoặc `~/.openclaw/exec-approvals.json` khi biến không được đặt.

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Phê duyệt thực thi](/vi/tools/exec-approvals)
