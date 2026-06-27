---
read_when:
    - Bạn muốn chạy một cuộc kiểm tra bảo mật nhanh trên cấu hình/trạng thái
    - Bạn muốn áp dụng các đề xuất “sửa lỗi” an toàn (quyền, siết chặt các giá trị mặc định)
summary: Tham chiếu CLI cho `openclaw security` (kiểm tra và khắc phục các lỗi cấu hình bảo mật phổ biến)
title: Bảo mật
x-i18n:
    generated_at: "2026-06-27T17:20:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

`security audit` thông thường chỉ chạy trên đường dẫn cấu hình nguội/hệ thống tệp/chỉ đọc. Theo mặc định, nó không phát hiện các bộ thu thập bảo mật thời gian chạy của Plugin, nên các lần kiểm tra định kỳ không tải mọi thời gian chạy Plugin đã cài đặt. Dùng `--deep` để bao gồm các phép thăm dò Gateway trực tiếp theo best-effort và các bộ thu thập kiểm tra bảo mật do Plugin sở hữu; các caller nội bộ tường minh cũng có thể chọn dùng các bộ thu thập do Plugin sở hữu đó khi chúng đã có phạm vi thời gian chạy phù hợp.

Kiểm tra cảnh báo khi nhiều người gửi DM dùng chung phiên chính và khuyến nghị **chế độ DM bảo mật**: `session.dmScope="per-channel-peer"` (hoặc `per-account-channel-peer` cho các kênh nhiều tài khoản) cho hộp thư đến dùng chung.
Điều này nhằm tăng cường an toàn cho hộp thư đến hợp tác/dùng chung. Một Gateway duy nhất được dùng chung bởi các operator không tin cậy lẫn nhau/đối kháng không phải là thiết lập được khuyến nghị; hãy tách ranh giới tin cậy bằng các gateway riêng (hoặc người dùng/máy chủ hệ điều hành riêng).
Nó cũng phát ra `security.trust_model.multi_user_heuristic` khi cấu hình gợi ý khả năng có lối vào nhiều người dùng dùng chung (ví dụ chính sách DM/nhóm mở, mục tiêu nhóm đã cấu hình, hoặc quy tắc người gửi ký tự đại diện), và nhắc bạn rằng OpenClaw mặc định là mô hình tin cậy trợ lý cá nhân.
Với các thiết lập nhiều người dùng có chủ đích, hướng dẫn kiểm tra là sandbox tất cả phiên, giữ quyền truy cập hệ thống tệp trong phạm vi workspace, và không đặt danh tính hoặc thông tin xác thực cá nhân/riêng tư trên thời gian chạy đó.
Nó cũng cảnh báo khi các mô hình nhỏ (`<=300B`) được dùng mà không có sandboxing và có bật công cụ web/trình duyệt.
Với lối vào webhook, lúc khởi động sẽ ghi cảnh báo bảo mật không gây lỗi và kiểm tra sẽ gắn cờ việc `hooks.token` tái sử dụng các giá trị xác thực shared-secret Gateway đang hoạt động, bao gồm `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` và `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. Nó cũng cảnh báo khi:

- `hooks.token` ngắn
- `hooks.path="/"`
- `hooks.defaultSessionKey` chưa được đặt
- `hooks.allowedAgentIds` không bị giới hạn
- các ghi đè `sessionKey` trong yêu cầu được bật
- ghi đè được bật mà không có `hooks.allowedSessionKeyPrefixes`

Nếu xác thực bằng mật khẩu Gateway chỉ được cung cấp lúc khởi động, hãy truyền cùng giá trị đó cho `openclaw security audit --auth password --password <password>` để kiểm tra có thể so sánh nó với `hooks.token`.
Chạy `openclaw doctor --fix` để xoay vòng `hooks.token` đã lưu bền vững đang bị tái sử dụng, rồi cập nhật các bên gửi hook bên ngoài để dùng token hook mới.

Nó cũng cảnh báo khi thiết lập Docker sandbox được cấu hình trong khi chế độ sandbox đang tắt, khi `gateway.nodes.denyCommands` dùng các mục dạng mẫu/không xác định không hiệu quả (chỉ so khớp chính xác tên lệnh node, không lọc văn bản shell), khi `gateway.nodes.allowCommands` bật tường minh các lệnh node nguy hiểm, khi `tools.profile="minimal"` toàn cục bị ghi đè bởi hồ sơ công cụ của agent, khi công cụ ghi/chỉnh sửa bị tắt nhưng `exec` vẫn khả dụng mà không có ranh giới hệ thống tệp sandbox ràng buộc, khi DM hoặc nhóm mở phơi bày công cụ thời gian chạy/hệ thống tệp mà không có bảo vệ sandbox/workspace, và khi công cụ Plugin đã cài đặt có thể truy cập được dưới chính sách công cụ quá rộng.
Nó cũng gắn cờ `gateway.allowRealIpFallback=true` (rủi ro giả mạo header nếu proxy bị cấu hình sai) và `discovery.mdns.mode="full"` (rò rỉ siêu dữ liệu qua bản ghi mDNS TXT).
Nó cũng cảnh báo khi trình duyệt sandbox dùng mạng Docker `bridge` mà không có `sandbox.browser.cdpSourceRange`.
Nó cũng gắn cờ các chế độ mạng Docker sandbox nguy hiểm (bao gồm `host` và các phép nối namespace `container:*`).
Nó cũng cảnh báo khi các container Docker trình duyệt sandbox hiện có thiếu nhãn băm hoặc có nhãn băm cũ (ví dụ container trước di trú thiếu `openclaw.browserConfigEpoch`) và khuyến nghị `openclaw sandbox recreate --browser --all`.
Nó cũng cảnh báo khi bản ghi cài đặt Plugin/hook dựa trên npm không được ghim, thiếu siêu dữ liệu integrity, hoặc lệch với phiên bản gói hiện đang cài đặt.
Nó cảnh báo khi danh sách cho phép của kênh dựa vào tên/email/thẻ có thể thay đổi thay vì ID ổn định (Discord, Slack, Google Chat, Microsoft Teams, Mattermost, phạm vi IRC khi áp dụng).
Nó cảnh báo khi `gateway.auth.mode="none"` để các API HTTP của Gateway có thể truy cập mà không có shared secret (`/tools/invoke` cộng với mọi endpoint `/v1/*` đã bật).
Các thiết lập có tiền tố `dangerous`/`dangerously` là ghi đè break-glass tường minh của operator; việc bật một thiết lập, tự nó, không phải là báo cáo lỗ hổng bảo mật.
Để xem danh mục tham số nguy hiểm đầy đủ, hãy xem phần "Tóm tắt cờ không an toàn hoặc nguy hiểm" trong [Bảo mật](/vi/gateway/security).

Các phát hiện tồn tại có chủ đích có thể được chấp nhận bằng `security.audit.suppressions`.
Mỗi suppression khớp một `checkId` chính xác và có thể được thu hẹp bằng các chuỗi con không phân biệt chữ hoa/thường
`titleIncludes` và/hoặc `detailIncludes`:

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

Các phát hiện đã suppression sẽ bị xóa khỏi `summary` đang hoạt động và danh sách `findings`.
Đầu ra JSON giữ chúng trong `suppressedFindings` để có thể kiểm toán.
Khi suppression được cấu hình, đầu ra hoạt động cũng giữ một phát hiện thông tin không thể suppression
`security.audit.suppressions.active` để người đọc biết rằng kết quả kiểm tra
đã được lọc. Các cờ cấu hình nguy hiểm được phát ra mỗi cờ một phát hiện, nên
việc chấp nhận một cờ nguy hiểm không che giấu các cờ đã bật khác dùng chung
cùng `checkId` `config.insecure_or_dangerous_flags`.
Vì suppression có thể che giấu rủi ro tồn tại, việc thêm hoặc xóa chúng thông qua
lệnh shell chạy bởi agent yêu cầu phê duyệt exec, trừ khi exec đã chạy
với `security="full"` và `ask="off"` cho tự động hóa cục bộ đáng tin cậy.

Hành vi SecretRef:

- `security audit` phân giải các SecretRef được hỗ trợ ở chế độ chỉ đọc cho các đường dẫn mục tiêu của nó.
- Nếu một SecretRef không khả dụng trong đường dẫn lệnh hiện tại, kiểm tra tiếp tục và báo cáo `secretDiagnostics` (thay vì bị crash).
- `--token` và `--password` chỉ ghi đè xác thực deep-probe cho lần gọi lệnh đó; chúng không ghi lại cấu hình hoặc ánh xạ SecretRef.

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

## Những gì `--fix` thay đổi

`--fix` áp dụng các biện pháp khắc phục an toàn, xác định:

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
- thay đổi các lựa chọn bind/xác thực/phơi bày mạng của gateway
- xóa hoặc ghi lại plugins/skills

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Kiểm tra bảo mật](/vi/gateway/security)
