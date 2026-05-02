---
read_when:
    - Bạn muốn chạy một bản kiểm tra bảo mật nhanh trên cấu hình/trạng thái
    - Bạn muốn áp dụng các đề xuất “khắc phục” an toàn (quyền, siết chặt các giá trị mặc định)
summary: Tài liệu tham khảo CLI cho `openclaw security` (kiểm tra và khắc phục các lỗi bảo mật thường gặp)
title: Bảo mật
x-i18n:
    generated_at: "2026-05-02T10:37:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 44eb50368cb54441782a7c4e20fab24d0488b80c9a1eedf8e1eb31dc8d7a9cf6
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Công cụ bảo mật (kiểm tra + bản sửa tùy chọn).

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

Lệnh `security audit` thông thường chỉ chạy trên đường dẫn cấu hình/hệ thống tệp/chỉ đọc lạnh. Mặc định lệnh này không khám phá các bộ thu thập bảo mật thời gian chạy của Plugin, vì vậy các lượt kiểm tra thường lệ không tải mọi thời gian chạy Plugin đã cài đặt. Dùng `--deep` để bao gồm các phép dò Gateway trực tiếp theo nỗ lực tối đa và các bộ thu thập kiểm tra bảo mật do Plugin sở hữu; các trình gọi nội bộ tường minh cũng có thể chọn tham gia các bộ thu thập do Plugin sở hữu đó khi chúng đã có phạm vi thời gian chạy phù hợp.

Lượt kiểm tra cảnh báo khi nhiều người gửi tin nhắn trực tiếp dùng chung phiên chính và khuyến nghị **chế độ tin nhắn trực tiếp bảo mật**: `session.dmScope="per-channel-peer"` (hoặc `per-account-channel-peer` cho các kênh nhiều tài khoản) cho hộp thư đến dùng chung.
Điều này nhằm tăng cứng hộp thư đến hợp tác/dùng chung. Một Gateway duy nhất dùng chung bởi các toán tử không tin cậy lẫn nhau/đối nghịch không phải là thiết lập được khuyến nghị; hãy tách ranh giới tin cậy bằng các gateway riêng (hoặc người dùng/máy chủ hệ điều hành riêng).
Lệnh cũng phát ra `security.trust_model.multi_user_heuristic` khi cấu hình cho thấy khả năng có đầu vào từ nhiều người dùng dùng chung (ví dụ chính sách tin nhắn trực tiếp/nhóm mở, mục tiêu nhóm đã cấu hình, hoặc quy tắc người gửi ký tự đại diện), và nhắc rằng theo mặc định OpenClaw là mô hình tin cậy trợ lý cá nhân.
Với các thiết lập nhiều người dùng có chủ đích, hướng dẫn kiểm tra là đặt tất cả phiên vào sandbox, giữ quyền truy cập hệ thống tệp trong phạm vi workspace, và không đặt danh tính hoặc thông tin xác thực cá nhân/riêng tư trên thời gian chạy đó.
Lệnh cũng cảnh báo khi dùng mô hình nhỏ (`<=300B`) mà không có sandbox và bật công cụ web/trình duyệt.
Đối với đầu vào Webhook, lệnh cảnh báo khi `hooks.token` dùng lại token Gateway, khi `hooks.token` ngắn, khi `hooks.path="/"`, khi chưa đặt `hooks.defaultSessionKey`, khi `hooks.allowedAgentIds` không bị giới hạn, khi bật ghi đè `sessionKey` theo yêu cầu, và khi bật ghi đè mà không có `hooks.allowedSessionKeyPrefixes`.
Lệnh cũng cảnh báo khi cấu hình thiết lập Docker sandbox trong khi chế độ sandbox đang tắt, khi `gateway.nodes.denyCommands` dùng các mục giống mẫu/không xác định không hiệu quả (chỉ khớp chính xác tên lệnh node, không lọc văn bản shell), khi `gateway.nodes.allowCommands` bật tường minh các lệnh node nguy hiểm, khi `tools.profile="minimal"` toàn cục bị hồ sơ công cụ của agent ghi đè, khi nhóm mở để lộ công cụ thời gian chạy/hệ thống tệp mà không có bảo vệ sandbox/workspace, và khi công cụ Plugin đã cài đặt có thể truy cập được dưới chính sách công cụ dễ dãi.
Lệnh cũng gắn cờ `gateway.allowRealIpFallback=true` (rủi ro giả mạo header nếu proxy cấu hình sai) và `discovery.mdns.mode="full"` (rò rỉ siêu dữ liệu qua bản ghi mDNS TXT).
Lệnh cũng cảnh báo khi trình duyệt sandbox dùng mạng Docker `bridge` mà không có `sandbox.browser.cdpSourceRange`.
Lệnh cũng gắn cờ các chế độ mạng Docker sandbox nguy hiểm (bao gồm `host` và các phép nối không gian tên `container:*`).
Lệnh cũng cảnh báo khi các container Docker trình duyệt sandbox hiện có thiếu nhãn băm hoặc có nhãn băm cũ (ví dụ container trước di trú thiếu `openclaw.browserConfigEpoch`) và khuyến nghị `openclaw sandbox recreate --browser --all`.
Lệnh cũng cảnh báo khi bản ghi cài đặt Plugin/hook dựa trên npm không được ghim, thiếu siêu dữ liệu toàn vẹn, hoặc lệch so với phiên bản gói hiện đang cài đặt.
Lệnh cảnh báo khi danh sách cho phép của kênh dựa vào tên/email/thẻ có thể thay đổi thay vì ID ổn định (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, phạm vi IRC khi áp dụng).
Lệnh cảnh báo khi `gateway.auth.mode="none"` khiến các API HTTP của Gateway có thể truy cập mà không có bí mật dùng chung (`/tools/invoke` cùng bất kỳ endpoint `/v1/*` nào đã bật).
Các thiết lập có tiền tố `dangerous`/`dangerously` là ghi đè phá kính tường minh của toán tử; việc bật một thiết lập như vậy tự thân không phải là báo cáo lỗ hổng bảo mật.
Để xem toàn bộ danh mục tham số nguy hiểm, hãy xem phần "Tóm tắt cờ không an toàn hoặc nguy hiểm" trong [Bảo mật](/vi/gateway/security).

Hành vi SecretRef:

- `security audit` phân giải các SecretRef được hỗ trợ ở chế độ chỉ đọc cho các đường dẫn được nhắm mục tiêu.
- Nếu một SecretRef không khả dụng trong đường dẫn lệnh hiện tại, lượt kiểm tra tiếp tục và báo cáo `secretDiagnostics` (thay vì gặp lỗi sập).
- `--token` và `--password` chỉ ghi đè xác thực dò sâu cho lần gọi lệnh đó; chúng không ghi lại cấu hình hoặc ánh xạ SecretRef.

## Đầu ra JSON

Dùng `--json` cho kiểm tra CI/chính sách:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Nếu kết hợp `--fix` và `--json`, đầu ra bao gồm cả hành động sửa và báo cáo cuối cùng:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix` thay đổi gì

`--fix` áp dụng các biện pháp khắc phục an toàn, xác định:

- đổi `groupPolicy="open"` phổ biến thành `groupPolicy="allowlist"` (bao gồm các biến thể tài khoản trong các kênh được hỗ trợ)
- khi chính sách nhóm WhatsApp chuyển sang `allowlist`, gieo `groupAllowFrom` từ
  tệp `allowFrom` đã lưu khi danh sách đó tồn tại và cấu hình chưa
  định nghĩa `allowFrom`
- đặt `logging.redactSensitive` từ `"off"` thành `"tools"`
- siết chặt quyền cho tệp trạng thái/cấu hình và các tệp nhạy cảm phổ biến
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, phiên
  `*.jsonl`)
- cũng siết chặt các tệp include cấu hình được tham chiếu từ `openclaw.json`
- dùng `chmod` trên máy chủ POSIX và đặt lại `icacls` trên Windows

`--fix` **không**:

- xoay vòng token/mật khẩu/khóa API
- tắt công cụ (`gateway`, `cron`, `exec`, v.v.)
- thay đổi lựa chọn bind/xác thực/phơi bày mạng của gateway
- xóa hoặc ghi lại Plugin/Skills

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Kiểm tra bảo mật](/vi/gateway/security)
