---
read_when:
    - Chọn auto, ask, allowlist, full hoặc deny cho quyền thực thi lệnh
    - Cấu hình phê duyệt do Codex Guardian xem xét thông qua tools.exec.mode
    - So sánh phê duyệt thực thi của OpenClaw với quyền của bộ khung ACPX
summary: Các chế độ quyền cho việc thực thi trên máy chủ, phê duyệt của Codex Guardian và các phiên harness ACPX
title: Chế độ quyền hạn
x-i18n:
    generated_at: "2026-07-12T08:25:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

Các chế độ quyền quyết định mức thẩm quyền mà một tác tử có trước khi chạy lệnh trên máy chủ, ghi tệp hoặc yêu cầu cơ chế thực thi phía sau cấp thêm quyền truy cập.

<Note>
  Chế độ quyền tách biệt với `tools.exec.host=auto`. `tools.exec.host`
  chọn nơi lệnh được chạy. `tools.exec.mode` chọn cách phê duyệt việc thực thi
  trên máy chủ.
</Note>

## Mặc định được khuyến nghị

Dùng `auto` cho các tác tử lập trình cần quyền truy cập máy chủ hữu ích mà không biến mọi trường hợp không khớp thành lời nhắc cho người dùng:

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

Sau đó xác minh chính sách có hiệu lực:

```bash
openclaw exec-policy show
```

## Các chế độ thực thi trên máy chủ của OpenClaw

`tools.exec.mode` là bề mặt chính sách đã chuẩn hóa cho `exec` trên máy chủ. Mỗi chế độ được phân giải thành một cặp `security` (mức nghiêm ngặt của danh sách cho phép) và `ask` (nhắc khi không khớp) nền tảng:

| Chế độ      | security / ask          | Hành vi                                                                                                        | Sử dụng khi                                                   |
| ----------- | ----------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `deny`      | `deny` / `off`          | Chặn hoàn toàn việc thực thi trên máy chủ.                                                                     | Không cho phép lệnh nào trên máy chủ.                          |
| `allowlist` | `allowlist` / `off`     | Chỉ chạy các lệnh trong danh sách cho phép; âm thầm từ chối các trường hợp không khớp.                          | Bạn có một tập lệnh đã biết là an toàn.                        |
| `ask`       | `allowlist` / `on-miss` | Chạy các lệnh khớp danh sách cho phép; hỏi người dùng khi không khớp.                                           | Con người cần xem xét mọi lệnh mới.                            |
| `auto`      | `allowlist` / `on-miss` | Chạy các lệnh khớp danh sách cho phép; gửi trường hợp không khớp qua bước tự động xét duyệt trước khi chuyển sang phê duyệt của con người. | Các phiên lập trình cần quyền truy cập thực tế có kiểm soát.   |
| `full`      | `full` / `off`          | Thực thi trên máy chủ mà không cần lời nhắc.                                                                    | Máy chủ/phiên đáng tin cậy này nên bỏ qua các cổng phê duyệt.  |

`ask` và `auto` dùng chung các thiết lập danh sách cho phép/yêu cầu phê duyệt; `auto` còn bật trình tự động xét duyệt tích hợp, tự quyết định các trường hợp không khớp và chỉ chuyển sang tuyến phê duyệt của con người đã cấu hình khi không thể phê duyệt một cách an toàn.

Để biết đầy đủ về chính sách thực thi trên máy chủ, tệp phê duyệt cục bộ, lược đồ danh sách cho phép, các chương trình nhị phân an toàn và hành vi chuyển tiếp, hãy xem [Phê duyệt thực thi](/vi/tools/exec-approvals).

## Ánh xạ Codex Guardian

Đối với các phiên máy chủ ứng dụng Codex gốc, `tools.exec.mode: "auto"` hướng Codex đến cơ chế phê duyệt do Guardian xét duyệt khi các yêu cầu Codex cục bộ cho phép. Các giá trị kết quả điển hình:

| Trường Codex         | Giá trị điển hình |
| -------------------- | ----------------- |
| `approvalPolicy`     | `on-request`      |
| `approvalsReviewer`  | `auto_review`     |
| `sandbox`            | `workspace-write` |

Chế độ `auto` áp đặt chính sách này lên mọi cấu hình ghi đè hộp cát/phê duyệt của Codex, vì vậy chế độ này không duy trì các tổ hợp cũ không an toàn như `approvalPolicy: "never"` cùng với `sandbox: "danger-full-access"`. `tools.exec.mode: "deny"` và `"allowlist"` chặn hoàn toàn việc thực thi cục bộ của máy chủ ứng dụng Codex. Chỉ dùng `tools.exec.mode: "full"` khi bạn chủ ý muốn trạng thái không cần phê duyệt.

Để biết chi tiết về thiết lập máy chủ ứng dụng, thứ tự xác thực và môi trường chạy Codex gốc, hãy xem [Cơ chế thực thi Codex](/vi/plugins/codex-harness).

## Quyền của cơ chế thực thi ACPX

Các phiên ACPX không có tính tương tác, vì vậy chúng không thể nhấp vào lời nhắc cấp quyền trên TTY. ACPX dùng các thiết lập riêng ở cấp cơ chế thực thi trong `plugins.entries.acpx.config`:

| Thiết lập                   | Giá trị         | Ý nghĩa                                             |
| --------------------------- | --------------- | --------------------------------------------------- |
| `permissionMode`            | `approve-reads` | Chỉ tự động phê duyệt thao tác đọc.                  |
| `permissionMode`            | `approve-all`   | Tự động phê duyệt thao tác ghi và các lệnh shell.    |
| `permissionMode`            | `deny-all`      | Từ chối mọi lời nhắc cấp quyền.                      |
| `nonInteractivePermissions` | `fail`          | Hủy bỏ khi cần hiển thị lời nhắc.                    |
| `nonInteractivePermissions` | `deny`          | Từ chối lời nhắc và tiếp tục khi có thể.             |

Thiết lập quyền ACPX riêng biệt với phê duyệt thực thi của OpenClaw:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

Dùng `approve-all` làm tùy chọn khẩn cấp của ACPX tương đương với một phiên cơ chế thực thi không hiển thị lời nhắc. Để biết chi tiết thiết lập và các chế độ lỗi, hãy xem [Thiết lập tác tử ACP](/vi/tools/acp-agents-setup#permission-configuration).

## Chọn chế độ

| Mục tiêu                                           | Cấu hình                                                     |
| -------------------------------------------------- | ------------------------------------------------------------ |
| Chặn hoàn toàn các lệnh trên máy chủ                | `tools.exec.mode: "deny"`                                    |
| Chỉ cho phép chạy các lệnh đã biết là an toàn       | `tools.exec.mode: "allowlist"`                               |
| Hỏi người dùng với mọi dạng lệnh mới                | `tools.exec.mode: "ask"`                                     |
| Dùng tính năng tự động xét duyệt của Codex/OpenClaw trước khi hỏi con người | `tools.exec.mode: "auto"`                    |
| Bỏ qua hoàn toàn phê duyệt thực thi trên máy chủ    | `tools.exec.mode: "full"` cùng với tệp phê duyệt máy chủ tương ứng |
| Cho phép các phiên ACPX không tương tác ghi/thực thi | `plugins.entries.acpx.config.permissionMode: "approve-all"`  |

Nếu lệnh vẫn hiển thị lời nhắc hoặc thất bại sau khi thay đổi chế độ, hãy kiểm tra cả hai lớp:

```bash
openclaw approvals get
openclaw exec-policy show
```

Việc thực thi trên máy chủ sử dụng kết quả nghiêm ngặt hơn giữa cấu hình OpenClaw và tệp phê duyệt cục bộ trên máy chủ. Quyền của cơ chế thực thi ACPX không nới lỏng phê duyệt thực thi trên máy chủ, và phê duyệt thực thi trên máy chủ không nới lỏng lời nhắc của cơ chế thực thi ACPX.

## Liên quan

- [Phê duyệt thực thi](/vi/tools/exec-approvals)
- [Phê duyệt thực thi - nâng cao](/vi/tools/exec-approvals-advanced)
- [Cơ chế thực thi Codex](/vi/plugins/codex-harness)
- [Thiết lập tác tử ACP](/vi/tools/acp-agents-setup#permission-configuration)
