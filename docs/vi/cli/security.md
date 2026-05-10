---
read_when:
    - Bạn muốn chạy một đợt kiểm tra bảo mật nhanh trên cấu hình/trạng thái
    - Bạn muốn áp dụng các đề xuất "fix" an toàn (quyền, thắt chặt các giá trị mặc định)
summary: Tài liệu tham khảo CLI cho `openclaw security` (kiểm tra và sửa các lỗi bảo mật dễ mắc thường gặp)
title: Bảo mật
x-i18n:
    generated_at: "2026-05-10T19:28:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Công cụ bảo mật (kiểm tra + các bản khắc phục tùy chọn).

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

Lệnh `security audit` thông thường nằm trên đường dẫn cấu hình/tệp hệ thống/chỉ đọc nguội. Theo mặc định, lệnh này không phát hiện các bộ thu thập bảo mật runtime của plugin, nên các lần kiểm tra thường lệ không tải mọi runtime của plugin đã cài đặt. Dùng `--deep` để bao gồm các phép thăm dò Gateway trực tiếp theo nỗ lực tối đa và các bộ thu thập kiểm tra bảo mật do plugin sở hữu; các trình gọi nội bộ rõ ràng cũng có thể chọn dùng các bộ thu thập do plugin sở hữu đó khi chúng đã có phạm vi runtime phù hợp.

Bản kiểm tra cảnh báo khi nhiều người gửi DM chia sẻ phiên chính và khuyến nghị **chế độ DM an toàn**: `session.dmScope="per-channel-peer"` (hoặc `per-account-channel-peer` cho các kênh nhiều tài khoản) đối với hộp thư đến dùng chung.
Điều này dùng để gia cố hộp thư đến hợp tác/dùng chung. Một Gateway duy nhất được chia sẻ bởi các người vận hành không tin cậy lẫn nhau/có tính đối kháng không phải là thiết lập được khuyến nghị; hãy tách ranh giới tin cậy bằng các gateway riêng biệt (hoặc người dùng/máy chủ hệ điều hành riêng biệt).
Nó cũng phát ra `security.trust_model.multi_user_heuristic` khi cấu hình cho thấy khả năng có luồng vào từ người dùng dùng chung (ví dụ chính sách DM/nhóm mở, mục tiêu nhóm đã cấu hình, hoặc quy tắc người gửi ký tự đại diện), và nhắc bạn rằng theo mặc định OpenClaw là mô hình tin cậy trợ lý cá nhân.
Đối với các thiết lập nhiều người dùng có chủ đích, hướng dẫn kiểm tra là sandbox tất cả phiên, giữ quyền truy cập hệ thống tệp trong phạm vi workspace, và không đặt danh tính hoặc thông tin đăng nhập cá nhân/riêng tư trên runtime đó.
Nó cũng cảnh báo khi các mô hình nhỏ (`<=300B`) được dùng mà không có sandboxing và khi các công cụ web/trình duyệt được bật.
Đối với luồng vào webhook, nó cảnh báo khi `hooks.token` dùng lại token của Gateway, khi `hooks.token` ngắn, khi `hooks.path="/"`, khi `hooks.defaultSessionKey` chưa được đặt, khi `hooks.allowedAgentIds` không bị giới hạn, khi ghi đè `sessionKey` của yêu cầu được bật, và khi ghi đè được bật mà không có `hooks.allowedSessionKeyPrefixes`.
Nó cũng cảnh báo khi cài đặt Docker sandbox được cấu hình trong khi chế độ sandbox đang tắt, khi `gateway.nodes.denyCommands` dùng các mục giống mẫu/không xác định và không hiệu quả (chỉ khớp chính xác tên lệnh node, không lọc văn bản shell), khi `gateway.nodes.allowCommands` bật rõ ràng các lệnh node nguy hiểm, khi `tools.profile="minimal"` toàn cục bị ghi đè bởi hồ sơ công cụ của agent, khi công cụ ghi/chỉnh sửa bị tắt nhưng `exec` vẫn khả dụng mà không có ranh giới hệ thống tệp sandbox ràng buộc, khi các nhóm mở phơi bày công cụ runtime/hệ thống tệp mà không có lớp bảo vệ sandbox/workspace, và khi các công cụ plugin đã cài đặt có thể truy cập được dưới chính sách công cụ dễ dãi.
Nó cũng gắn cờ `gateway.allowRealIpFallback=true` (rủi ro giả mạo header nếu proxy bị cấu hình sai) và `discovery.mdns.mode="full"` (rò rỉ siêu dữ liệu qua bản ghi mDNS TXT).
Nó cũng cảnh báo khi trình duyệt sandbox dùng mạng Docker `bridge` mà không có `sandbox.browser.cdpSourceRange`.
Nó cũng gắn cờ các chế độ mạng Docker sandbox nguy hiểm (bao gồm `host` và các phép nối namespace `container:*`).
Nó cũng cảnh báo khi các container Docker trình duyệt sandbox hiện có bị thiếu nhãn hash hoặc có nhãn hash cũ (ví dụ container trước di trú thiếu `openclaw.browserConfigEpoch`) và khuyến nghị `openclaw sandbox recreate --browser --all`.
Nó cũng cảnh báo khi các bản ghi cài đặt plugin/hook dựa trên npm không được ghim phiên bản, thiếu siêu dữ liệu toàn vẹn, hoặc lệch so với phiên bản gói hiện đang cài đặt.
Nó cảnh báo khi danh sách cho phép của kênh dựa vào tên/email/thẻ có thể thay đổi thay vì ID ổn định (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, phạm vi IRC khi áp dụng).
Nó cảnh báo khi `gateway.auth.mode="none"` khiến các API HTTP của Gateway có thể truy cập mà không có bí mật dùng chung (`/tools/invoke` cùng mọi điểm cuối `/v1/*` đã bật).
Các cài đặt có tiền tố `dangerous`/`dangerously` là các ghi đè vận hành phá kính rõ ràng; việc bật một cài đặt như vậy tự thân không phải là báo cáo lỗ hổng bảo mật.
Để xem đầy đủ danh mục tham số nguy hiểm, hãy xem phần "Tóm tắt cờ không an toàn hoặc nguy hiểm" trong [Bảo mật](/vi/gateway/security).

Hành vi SecretRef:

- `security audit` phân giải các SecretRef được hỗ trợ ở chế độ chỉ đọc cho các đường dẫn được nhắm mục tiêu.
- Nếu một SecretRef không khả dụng trong đường dẫn lệnh hiện tại, quá trình kiểm tra tiếp tục và báo cáo `secretDiagnostics` (thay vì gặp sự cố).
- `--token` và `--password` chỉ ghi đè xác thực thăm dò sâu cho lần gọi lệnh đó; chúng không ghi lại cấu hình hoặc ánh xạ SecretRef.

## Đầu ra JSON

Dùng `--json` cho kiểm tra CI/chính sách:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Nếu kết hợp `--fix` và `--json`, đầu ra bao gồm cả hành động khắc phục và báo cáo cuối cùng:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Những gì `--fix` thay đổi

`--fix` áp dụng các biện pháp khắc phục an toàn, tất định:

- chuyển `groupPolicy="open"` phổ biến thành `groupPolicy="allowlist"` (bao gồm các biến thể tài khoản trong các kênh được hỗ trợ)
- khi chính sách nhóm WhatsApp chuyển sang `allowlist`, gieo `groupAllowFrom` từ
  tệp `allowFrom` đã lưu khi danh sách đó tồn tại và cấu hình chưa
  định nghĩa `allowFrom`
- đặt `logging.redactSensitive` từ `"off"` thành `"tools"`
- siết chặt quyền cho trạng thái/cấu hình và các tệp nhạy cảm phổ biến
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, phiên
  `*.jsonl`)
- cũng siết chặt các tệp include cấu hình được tham chiếu từ `openclaw.json`
- dùng `chmod` trên máy chủ POSIX và đặt lại `icacls` trên Windows

`--fix` **không**:

- xoay vòng token/mật khẩu/API key
- tắt công cụ (`gateway`, `cron`, `exec`, v.v.)
- thay đổi lựa chọn bind/xác thực/phơi bày mạng của gateway
- xóa hoặc ghi lại plugin/skills

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Kiểm tra bảo mật](/vi/gateway/security)
