---
read_when:
    - Bạn muốn chạy kiểm tra bảo mật nhanh đối với cấu hình/trạng thái
    - Bạn muốn áp dụng các đề xuất “sửa lỗi” an toàn (quyền, siết chặt các giá trị mặc định)
summary: Tài liệu tham chiếu CLI cho `openclaw security` (rà soát và khắc phục các cạm bẫy bảo mật phổ biến)
title: Bảo mật
x-i18n:
    generated_at: "2026-04-29T22:34:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4c15f2111cac2492aa331e5217dd18de169c8b6440f103e3009e059a06d81f6
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Công cụ bảo mật (kiểm tra + các bản sửa lỗi tùy chọn).

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

Quá trình kiểm tra cảnh báo khi nhiều người gửi DM dùng chung phiên chính và khuyến nghị **chế độ DM bảo mật**: `session.dmScope="per-channel-peer"` (hoặc `per-account-channel-peer` cho các kênh nhiều tài khoản) đối với hộp thư đến dùng chung.
Điều này nhằm gia cố hộp thư đến hợp tác/dùng chung. Một Gateway duy nhất được chia sẻ bởi các người vận hành không tin cậy lẫn nhau hoặc có tính đối địch không phải là thiết lập được khuyến nghị; hãy tách ranh giới tin cậy bằng các gateway riêng (hoặc người dùng/hệ điều hành/máy chủ riêng).
Nó cũng phát ra `security.trust_model.multi_user_heuristic` khi cấu hình cho thấy có khả năng có lối vào từ nhiều người dùng chung (ví dụ chính sách DM/nhóm mở, mục tiêu nhóm đã cấu hình, hoặc quy tắc người gửi wildcard), và nhắc bạn rằng OpenClaw mặc định là mô hình tin cậy trợ lý cá nhân.
Với các thiết lập nhiều người dùng chung có chủ ý, hướng dẫn kiểm tra là sandbox tất cả phiên, giữ quyền truy cập hệ thống tệp trong phạm vi workspace, và không đưa danh tính hoặc thông tin xác thực cá nhân/riêng tư vào runtime đó.
Nó cũng cảnh báo khi các mô hình nhỏ (`<=300B`) được dùng mà không có sandbox và bật công cụ web/trình duyệt.
Với lối vào Webhook, nó cảnh báo khi `hooks.token` tái sử dụng token Gateway, khi `hooks.token` ngắn, khi `hooks.path="/"`, khi `hooks.defaultSessionKey` chưa được đặt, khi `hooks.allowedAgentIds` không bị giới hạn, khi cho phép ghi đè `sessionKey` của yêu cầu, và khi bật ghi đè mà không có `hooks.allowedSessionKeyPrefixes`.
Nó cũng cảnh báo khi cài đặt Docker sandbox được cấu hình trong lúc chế độ sandbox đang tắt, khi `gateway.nodes.denyCommands` dùng các mục dạng mẫu/không xác định không hiệu quả (chỉ khớp chính xác tên lệnh node, không lọc văn bản shell), khi `gateway.nodes.allowCommands` bật rõ ràng các lệnh node nguy hiểm, khi `tools.profile="minimal"` toàn cục bị ghi đè bởi hồ sơ công cụ của agent, khi nhóm mở phơi bày công cụ runtime/hệ thống tệp mà không có lớp bảo vệ sandbox/workspace, và khi công cụ Plugin đã cài đặt có thể truy cập được dưới chính sách công cụ dễ dãi.
Nó cũng gắn cờ `gateway.allowRealIpFallback=true` (rủi ro giả mạo header nếu proxy bị cấu hình sai) và `discovery.mdns.mode="full"` (rò rỉ siêu dữ liệu qua bản ghi mDNS TXT).
Nó cũng cảnh báo khi trình duyệt sandbox dùng mạng Docker `bridge` mà không có `sandbox.browser.cdpSourceRange`.
Nó cũng gắn cờ các chế độ mạng Docker sandbox nguy hiểm (bao gồm `host` và các lần tham gia namespace `container:*`).
Nó cũng cảnh báo khi các container Docker trình duyệt sandbox hiện có thiếu nhãn hash hoặc có nhãn hash cũ (ví dụ container trước di chuyển thiếu `openclaw.browserConfigEpoch`) và khuyến nghị `openclaw sandbox recreate --browser --all`.
Nó cũng cảnh báo khi bản ghi cài đặt Plugin/hook dựa trên npm không được ghim phiên bản, thiếu siêu dữ liệu toàn vẹn, hoặc lệch so với phiên bản gói hiện đang cài đặt.
Nó cảnh báo khi danh sách cho phép của kênh dựa vào tên/email/thẻ có thể thay đổi thay vì ID ổn định (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, phạm vi IRC khi áp dụng).
Nó cảnh báo khi `gateway.auth.mode="none"` khiến API HTTP của Gateway có thể truy cập mà không có bí mật dùng chung (`/tools/invoke` cùng bất kỳ endpoint `/v1/*` nào được bật).
Các cài đặt có tiền tố `dangerous`/`dangerously` là các ghi đè vận hành phá kính rõ ràng; việc bật một cài đặt như vậy tự nó không phải là báo cáo lỗ hổng bảo mật.
Để xem đầy đủ danh mục tham số nguy hiểm, hãy xem mục "Tóm tắt các cờ không an toàn hoặc nguy hiểm" trong [Bảo mật](/vi/gateway/security).

Hành vi SecretRef:

- `security audit` phân giải các SecretRef được hỗ trợ ở chế độ chỉ đọc cho các đường dẫn được nhắm mục tiêu.
- Nếu một SecretRef không khả dụng trong đường dẫn lệnh hiện tại, quá trình kiểm tra tiếp tục và báo cáo `secretDiagnostics` (thay vì bị crash).
- `--token` và `--password` chỉ ghi đè xác thực thăm dò sâu cho lần gọi lệnh đó; chúng không viết lại cấu hình hoặc ánh xạ SecretRef.

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

## `--fix` thay đổi những gì

`--fix` áp dụng các biện pháp khắc phục an toàn, xác định được:

- chuyển `groupPolicy="open"` phổ biến thành `groupPolicy="allowlist"` (bao gồm các biến thể tài khoản trong những kênh được hỗ trợ)
- khi chính sách nhóm WhatsApp chuyển thành `allowlist`, khởi tạo `groupAllowFrom` từ
  tệp `allowFrom` đã lưu khi danh sách đó tồn tại và cấu hình chưa
  định nghĩa `allowFrom`
- đặt `logging.redactSensitive` từ `"off"` thành `"tools"`
- siết chặt quyền cho state/config và các tệp nhạy cảm phổ biến
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, phiên
  `*.jsonl`)
- cũng siết chặt các tệp include cấu hình được tham chiếu từ `openclaw.json`
- dùng `chmod` trên máy chủ POSIX và đặt lại `icacls` trên Windows

`--fix` **không**:

- xoay vòng token/mật khẩu/API key
- tắt công cụ (`gateway`, `cron`, `exec`, v.v.)
- thay đổi lựa chọn bind/auth/phơi bày mạng của gateway
- xóa hoặc viết lại Plugin/Skills

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Kiểm tra bảo mật](/vi/gateway/security)
