---
read_when:
    - Bạn muốn chạy kiểm tra bảo mật nhanh đối với cấu hình/trạng thái
    - Bạn muốn áp dụng các đề xuất "sửa lỗi" an toàn (quyền, siết chặt các giá trị mặc định)
summary: Tài liệu tham khảo CLI cho `openclaw security` (kiểm tra và khắc phục các lỗi bảo mật thường gặp)
title: Bảo mật
x-i18n:
    generated_at: "2026-05-06T17:54:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e70c9ea085bc9c0edebe801e4feb876d1cb776848d693e9699f4d238fc9b60f
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Công cụ bảo mật (kiểm tra + bản sửa lỗi tùy chọn).

Liên quan:

- Hướng dẫn bảo mật: [Bảo mật](/vi/gateway/security)

## Kiểm tra

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

`security audit` thuần túy chỉ đi theo đường dẫn cấu hình/hệ thống tệp/chỉ đọc lạnh. Theo mặc định, lệnh này không phát hiện các bộ thu thập bảo mật runtime của Plugin, vì vậy các lần kiểm tra thường lệ không tải runtime của mọi Plugin đã cài đặt. Dùng `--deep` để bao gồm các phép thăm dò Gateway trực tiếp theo kiểu nỗ lực tối đa và các bộ thu thập kiểm tra bảo mật do Plugin sở hữu; các trình gọi nội bộ tường minh cũng có thể chọn dùng các bộ thu thập do Plugin sở hữu đó khi chúng đã có phạm vi runtime phù hợp.

Kiểm tra sẽ cảnh báo khi nhiều người gửi DM dùng chung phiên chính và khuyến nghị **chế độ DM bảo mật**: `session.dmScope="per-channel-peer"` (hoặc `per-account-channel-peer` cho các kênh nhiều tài khoản) đối với hộp thư đến dùng chung.
Điều này nhằm tăng cường bảo mật cho hộp thư đến hợp tác/dùng chung. Một Gateway duy nhất được chia sẻ bởi các người vận hành không tin cậy lẫn nhau/có tính đối kháng không phải là thiết lập được khuyến nghị; hãy tách ranh giới tin cậy bằng các Gateway riêng (hoặc người dùng/máy chủ hệ điều hành riêng).
Lệnh cũng phát ra `security.trust_model.multi_user_heuristic` khi cấu hình gợi ý khả năng có luồng vào từ nhiều người dùng dùng chung (ví dụ chính sách DM/nhóm mở, mục tiêu nhóm đã cấu hình, hoặc quy tắc người gửi ký tự đại diện), và nhắc bạn rằng OpenClaw mặc định là mô hình tin cậy trợ lý cá nhân.
Đối với các thiết lập nhiều người dùng có chủ ý, hướng dẫn kiểm tra là sandbox tất cả các phiên, giữ quyền truy cập hệ thống tệp trong phạm vi workspace, và không đặt danh tính hoặc thông tin xác thực cá nhân/riêng tư trên runtime đó.
Lệnh cũng cảnh báo khi các mô hình nhỏ (`<=300B`) được dùng mà không có sandboxing và có bật công cụ web/trình duyệt.
Đối với luồng vào Webhook, lệnh cảnh báo khi `hooks.token` dùng lại token Gateway, khi `hooks.token` ngắn, khi `hooks.path="/"`, khi `hooks.defaultSessionKey` chưa đặt, khi `hooks.allowedAgentIds` không bị giới hạn, khi bật ghi đè `sessionKey` của yêu cầu, và khi bật ghi đè mà không có `hooks.allowedSessionKeyPrefixes`.
Lệnh cũng cảnh báo khi thiết lập Docker sandbox được cấu hình trong khi chế độ sandbox tắt, khi `gateway.nodes.denyCommands` dùng các mục không hiệu quả giống mẫu/không xác định (chỉ khớp chính xác tên lệnh node, không lọc văn bản shell), khi `gateway.nodes.allowCommands` bật rõ ràng các lệnh node nguy hiểm, khi `tools.profile="minimal"` toàn cục bị ghi đè bởi hồ sơ công cụ của tác nhân, khi các nhóm mở để lộ công cụ runtime/hệ thống tệp mà không có biện pháp bảo vệ sandbox/workspace, và khi công cụ Plugin đã cài đặt có thể truy cập được dưới chính sách công cụ dễ dãi.
Lệnh cũng gắn cờ `gateway.allowRealIpFallback=true` (rủi ro giả mạo header nếu proxy bị cấu hình sai) và `discovery.mdns.mode="full"` (rò rỉ siêu dữ liệu qua bản ghi TXT mDNS).
Lệnh cũng cảnh báo khi trình duyệt sandbox dùng mạng Docker `bridge` mà không có `sandbox.browser.cdpSourceRange`.
Lệnh cũng gắn cờ các chế độ mạng Docker sandbox nguy hiểm (bao gồm `host` và tham gia namespace `container:*`).
Lệnh cũng cảnh báo khi các container Docker trình duyệt sandbox hiện có bị thiếu/có nhãn hash cũ (ví dụ container trước di trú thiếu `openclaw.browserConfigEpoch`) và khuyến nghị `openclaw sandbox recreate --browser --all`.
Lệnh cũng cảnh báo khi bản ghi cài đặt Plugin/hook dựa trên npm không được ghim, thiếu siêu dữ liệu toàn vẹn, hoặc lệch khỏi phiên bản gói hiện đang cài đặt.
Lệnh cảnh báo khi danh sách cho phép kênh dựa vào tên/email/thẻ có thể thay đổi thay vì ID ổn định (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, phạm vi IRC khi áp dụng).
Lệnh cảnh báo khi `gateway.auth.mode="none"` khiến API HTTP của Gateway có thể truy cập mà không có bí mật dùng chung (`/tools/invoke` cùng mọi endpoint `/v1/*` đã bật).
Các thiết lập có tiền tố `dangerous`/`dangerously` là các ghi đè vận hành phá kính tường minh; chỉ riêng việc bật một thiết lập như vậy không phải là báo cáo lỗ hổng bảo mật.
Để xem đầy đủ danh mục tham số nguy hiểm, hãy xem phần "Tóm tắt cờ không an toàn hoặc nguy hiểm" trong [Bảo mật](/vi/gateway/security).

Hành vi SecretRef:

- `security audit` phân giải các SecretRef được hỗ trợ ở chế độ chỉ đọc cho các đường dẫn mục tiêu của nó.
- Nếu một SecretRef không khả dụng trong đường dẫn lệnh hiện tại, kiểm tra vẫn tiếp tục và báo cáo `secretDiagnostics` (thay vì bị crash).
- `--token` và `--password` chỉ ghi đè xác thực thăm dò sâu cho lần gọi lệnh đó; chúng không ghi lại cấu hình hoặc ánh xạ SecretRef.

## Đầu ra JSON

Dùng `--json` cho kiểm tra CI/chính sách:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Nếu kết hợp `--fix` và `--json`, đầu ra bao gồm cả hành động sửa lỗi và báo cáo cuối cùng:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Những gì `--fix` thay đổi

`--fix` áp dụng các biện pháp khắc phục an toàn, xác định:

- đổi `groupPolicy="open"` phổ biến thành `groupPolicy="allowlist"` (bao gồm các biến thể tài khoản trong các kênh được hỗ trợ)
- khi chính sách nhóm WhatsApp đổi thành `allowlist`, khởi tạo `groupAllowFrom` từ
  tệp `allowFrom` đã lưu khi danh sách đó tồn tại và cấu hình chưa
  định nghĩa `allowFrom`
- đặt `logging.redactSensitive` từ `"off"` thành `"tools"`
- siết chặt quyền cho trạng thái/cấu hình và các tệp nhạy cảm phổ biến
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, phiên
  `*.jsonl`)
- cũng siết chặt các tệp include cấu hình được tham chiếu từ `openclaw.json`
- dùng `chmod` trên máy POSIX và reset `icacls` trên Windows

`--fix` **không**:

- xoay vòng token/mật khẩu/API key
- tắt công cụ (`gateway`, `cron`, `exec`, v.v.)
- thay đổi lựa chọn bind/xác thực/phơi bày mạng của Gateway
- xóa hoặc ghi lại plugins/skills

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Kiểm tra bảo mật](/vi/gateway/security)
