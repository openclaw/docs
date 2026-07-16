---
read_when:
    - Bạn muốn tiến hành kiểm tra bảo mật nhanh đối với cấu hình/trạng thái
    - Bạn muốn áp dụng các đề xuất "khắc phục" an toàn (quyền, siết chặt các giá trị mặc định)
summary: Tài liệu tham khảo CLI cho `openclaw security` (kiểm tra và khắc phục các lỗi bảo mật phổ biến dễ mắc phải)
title: Bảo mật
x-i18n:
    generated_at: "2026-07-16T14:15:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

Công cụ bảo mật: kiểm tra cùng các bản sửa lỗi an toàn tùy chọn. Liên quan: [Bảo mật](/vi/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## Chế độ kiểm tra

Lệnh `security audit` thông thường vẫn sử dụng đường dẫn cấu hình/hệ thống tệp chỉ đọc, không tải runtime: lệnh này không phát hiện các bộ thu thập kiểm tra bảo mật của runtime Plugin, nên các lần kiểm tra thường lệ không tải runtime của mọi Plugin đã cài đặt. `--deep` bổ sung các phép thăm dò Gateway đang hoạt động theo khả năng tốt nhất và các bộ thu thập kiểm tra bảo mật do Plugin sở hữu (các trình gọi nội bộ tường minh cũng có thể chọn dùng các bộ thu thập đó khi đã có phạm vi runtime phù hợp).

Nếu xác thực bằng mật khẩu của Gateway chỉ được cung cấp khi khởi động, hãy truyền cùng giá trị đó bằng `--auth password --password <password>` để quá trình kiểm tra có thể đối chiếu với `hooks.token`.

## Nội dung kiểm tra

**Mô hình DM/tin cậy**

- Cảnh báo khi nhiều người gửi DM dùng chung phiên chính và đề xuất chế độ DM an toàn: `session.dmScope="per-channel-peer"` (hoặc `per-account-channel-peer` đối với các kênh nhiều tài khoản) cho hộp thư đến dùng chung. Đây là biện pháp tăng cường bảo mật cho môi trường hợp tác/hộp thư đến dùng chung, không phải sự cô lập dành cho các bên vận hành không tin cậy lẫn nhau; với trường hợp đó, hãy phân tách ranh giới tin cậy bằng các Gateway riêng biệt (hoặc người dùng hệ điều hành/máy chủ riêng biệt).
- Phát `security.trust_model.multi_user_heuristic` khi cấu hình cho thấy khả năng có đầu vào từ nhiều người dùng dùng chung (ví dụ: chính sách DM/nhóm mở, đích nhóm đã cấu hình hoặc quy tắc người gửi dùng ký tự đại diện) — mô hình tin cậy mặc định của OpenClaw là trợ lý cá nhân (một bên vận hành), không phải cơ chế cô lập nhiều bên thuê trong môi trường đối địch. Đối với các thiết lập nhiều người dùng dùng chung có chủ đích: hãy đặt mọi phiên trong sandbox, giới hạn quyền truy cập hệ thống tệp trong phạm vi không gian làm việc và không đưa danh tính hoặc thông tin xác thực cá nhân/riêng tư vào runtime đó.
- Cảnh báo khi dùng các mô hình nhỏ (tham số `<=300B`) mà không có sandbox, đồng thời bật các công cụ web/trình duyệt.

**Webhook/hook**

Quá trình khởi động ghi nhật ký cảnh báo bảo mật không nghiêm trọng, còn quá trình kiểm tra sẽ gắn cờ việc `hooks.token` tái sử dụng các giá trị xác thực bằng bí mật dùng chung đang hoạt động của Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`). Đồng thời cảnh báo khi:

- `hooks.token` quá ngắn
- `hooks.path="/"`
- `hooks.defaultSessionKey` chưa được đặt
- `hooks.allowedAgentIds` không bị giới hạn
- các ghi đè `sessionKey` của yêu cầu được bật
- các ghi đè được bật mà không có `hooks.allowedSessionKeyPrefixes`

Chạy `openclaw doctor --fix` để xoay vòng một `hooks.token` được lưu bền đã bị tái sử dụng, sau đó cập nhật các bên gửi hook bên ngoài để sử dụng token mới.

**Sandbox/công cụ**

- Cảnh báo khi đã cấu hình cài đặt Docker cho sandbox nhưng chế độ sandbox đang tắt.
- Cảnh báo khi `gateway.nodes.denyCommands` sử dụng các mục dạng mẫu/không xác định không có hiệu lực (chỉ khớp chính xác tên lệnh Node, không lọc văn bản shell).
- Cảnh báo khi `gateway.nodes.allowCommands` bật tường minh các lệnh Node nguy hiểm.
- Cảnh báo khi `tools.profile="minimal"` toàn cục bị các hồ sơ công cụ của tác nhân ghi đè.
- Cảnh báo khi các công cụ ghi/chỉnh sửa bị tắt nhưng `exec` vẫn khả dụng mà không có ranh giới hệ thống tệp sandbox để giới hạn.
- Cảnh báo khi DM hoặc nhóm mở làm lộ các công cụ runtime/hệ thống tệp mà không có biện pháp bảo vệ bằng sandbox/không gian làm việc.
- Cảnh báo khi các công cụ của Plugin đã cài đặt có thể truy cập được theo chính sách công cụ cho phép rộng rãi.

**Trình duyệt sandbox**

- Cảnh báo khi trình duyệt sandbox sử dụng mạng Docker `bridge` mà không có `sandbox.browser.cdpSourceRange`.
- Gắn cờ các chế độ mạng Docker nguy hiểm của sandbox, bao gồm việc tham gia không gian tên `host` và `container:*`.
- Cảnh báo khi các container Docker hiện có của trình duyệt sandbox thiếu hoặc có nhãn hàm băm lỗi thời (ví dụ: các container trước khi di chuyển thiếu `openclaw.browserConfigEpoch`) và đề xuất `openclaw sandbox recreate --browser --all`.

**Mạng/phát hiện**

- Gắn cờ `gateway.allowRealIpFallback=true` (nguy cơ giả mạo tiêu đề nếu proxy bị cấu hình sai).
- Gắn cờ `discovery.mdns.mode="full"` (rò rỉ siêu dữ liệu qua bản ghi TXT mDNS).
- Cảnh báo khi `gateway.auth.mode="none"` khiến các API HTTP của Gateway có thể truy cập mà không cần bí mật dùng chung (`/tools/invoke` cùng mọi điểm cuối `/v1/*` đã bật).

**Plugin/kênh**

- Cảnh báo khi các bản ghi cài đặt Plugin/hook dựa trên npm không được ghim phiên bản, thiếu siêu dữ liệu toàn vẹn hoặc sai lệch so với phiên bản gói hiện được cài đặt.
- Cảnh báo khi danh sách cho phép của kênh dựa vào tên/email/thẻ có thể thay đổi thay vì ID ổn định (Discord, Slack, Google Chat, Microsoft Teams, Mattermost và phạm vi IRC nếu áp dụng).

Các cài đặt có tiền tố `dangerous`/`dangerously` là các ghi đè khẩn cấp tường minh của bên vận hành; việc bật một cài đặt như vậy tự nó không cấu thành báo cáo lỗ hổng bảo mật. Để xem toàn bộ danh mục tham số nguy hiểm, hãy xem “Tóm tắt cờ không an toàn hoặc nguy hiểm” trong [Bảo mật](/vi/gateway/security).

## Hành vi của SecretRef

`security audit` phân giải các SecretRef được hỗ trợ ở chế độ chỉ đọc cho những đường dẫn đích. Nếu một SecretRef không khả dụng trong đường dẫn lệnh hiện tại, quá trình kiểm tra vẫn tiếp tục và báo cáo `secretDiagnostics` thay vì gặp sự cố. `--token` và `--password` chỉ ghi đè xác thực thăm dò sâu cho lần gọi lệnh đó; chúng không ghi lại cấu hình hoặc ánh xạ SecretRef.

## Loại trừ cảnh báo

Chấp nhận các phát hiện thường trực có chủ đích bằng `security.audit.suppressions`. Mỗi quy tắc loại trừ khớp với một `checkId` chính xác và có thể được thu hẹp bằng các chuỗi con `titleIncludes` và/hoặc `detailIncludes` không phân biệt chữ hoa chữ thường:

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

Các phát hiện bị loại trừ được xóa khỏi danh sách `summary` và `findings` đang hoạt động. Đầu ra JSON giữ chúng trong `suppressedFindings` để phục vụ khả năng kiểm tra. Khi đã cấu hình quy tắc loại trừ, đầu ra đang hoạt động cũng giữ một phát hiện thông tin `security.audit.suppressions.active` không thể loại trừ để người đọc biết rằng kết quả kiểm tra đã được lọc. Các cờ cấu hình nguy hiểm được phát riêng từng cờ dưới dạng một phát hiện, vì vậy việc chấp nhận một cờ nguy hiểm không che giấu các cờ khác đang bật có cùng checkId `config.insecure_or_dangerous_flags`.

Vì các quy tắc loại trừ có thể che giấu rủi ro thường trực, việc thêm hoặc xóa chúng thông qua các lệnh shell do tác nhân chạy cần được phê duyệt thực thi, trừ khi quá trình thực thi đã chạy với `security="full"` và `ask="off"` dành cho hoạt động tự động hóa cục bộ đáng tin cậy.

## Đầu ra JSON

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

Với `--fix --json`, đầu ra bao gồm cả hành động sửa lỗi và báo cáo cuối cùng:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## Những gì `--fix` thay đổi

Áp dụng các biện pháp khắc phục an toàn, mang tính tất định:

- chuyển các `groupPolicy="open"` phổ biến thành `groupPolicy="allowlist"` (bao gồm các biến thể tài khoản trong những kênh được hỗ trợ)
- khi chính sách nhóm WhatsApp chuyển thành `allowlist`, điền `groupAllowFrom` từ tệp `allowFrom` đã lưu nếu danh sách đó tồn tại và cấu hình chưa định nghĩa `allowFrom`
- đặt `logging.redactSensitive` từ `"off"` thành `"tools"`
- siết chặt quyền đối với trạng thái/cấu hình và các tệp nhạy cảm phổ biến (`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` và các thành phần phiên cũ)
- đồng thời siết chặt các tệp cấu hình được bao gồm có tham chiếu từ `openclaw.json`
- sử dụng `chmod` trên máy chủ POSIX và đặt lại `icacls` trên Windows

`--fix` **không**:

- xoay vòng token/mật khẩu/khóa API
- tắt công cụ (`gateway`, `cron`, `exec`, v.v.)
- thay đổi các lựa chọn về liên kết/xác thực/phạm vi tiếp xúc mạng của Gateway
- xóa hoặc ghi lại Plugin/Skills

## Liên quan

- [Tài liệu tham khảo CLI](/vi/cli)
- [Kiểm tra bảo mật](/vi/gateway/security)
