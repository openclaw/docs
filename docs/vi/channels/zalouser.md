---
read_when:
    - Thiết lập Zalo cá nhân cho OpenClaw
    - Gỡ lỗi luồng đăng nhập hoặc nhắn tin của Zalo Personal
summary: Hỗ trợ tài khoản cá nhân Zalo qua zca-js gốc (đăng nhập bằng QR), khả năng và cấu hình
title: Zalo cá nhân
x-i18n:
    generated_at: "2026-05-02T22:17:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

Trạng thái: thử nghiệm. Tích hợp này tự động hóa **tài khoản Zalo cá nhân** thông qua `zca-js` gốc bên trong OpenClaw.

<Warning>
Đây là tích hợp không chính thức và có thể khiến tài khoản bị tạm ngưng hoặc cấm. Bạn tự chịu rủi ro khi sử dụng.
</Warning>

## Plugin đi kèm

Zalo Personal được phát hành dưới dạng Plugin đi kèm trong các bản phát hành OpenClaw hiện tại, vì vậy các bản dựng
đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc bản cài đặt tùy chỉnh loại trừ Zalo Personal,
hãy cài trực tiếp gói npm:

- Cài đặt qua CLI: `openclaw plugins install @openclaw/zalouser`
- Phiên bản cố định: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Hoặc từ một checkout mã nguồn: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Chi tiết: [Plugins](/vi/tools/plugin)

Không cần binary CLI `zca`/`openzca` bên ngoài.

## Thiết lập nhanh (người mới bắt đầu)

1. Đảm bảo Plugin Zalo Personal có sẵn.
   - Các bản phát hành OpenClaw được đóng gói hiện tại đã đi kèm Plugin này.
   - Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
2. Đăng nhập (QR, trên máy Gateway):
   - `openclaw channels login --channel zalouser`
   - Quét mã QR bằng ứng dụng Zalo trên di động.
3. Bật kênh:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Khởi động lại Gateway (hoặc hoàn tất thiết lập).
5. Quyền truy cập DM mặc định là ghép đôi; phê duyệt mã ghép đôi ở lần liên hệ đầu tiên.

## Đây là gì

- Chạy hoàn toàn trong tiến trình thông qua `zca-js`.
- Dùng trình nghe sự kiện gốc để nhận tin nhắn đến.
- Gửi phản hồi trực tiếp qua JS API (văn bản/phương tiện/liên kết).
- Được thiết kế cho các trường hợp dùng “tài khoản cá nhân” khi Zalo Bot API không khả dụng.

## Đặt tên

ID kênh là `zalouser` để thể hiện rõ rằng kênh này tự động hóa **tài khoản người dùng Zalo cá nhân** (không chính thức). Chúng tôi giữ `zalo` cho một tích hợp Zalo API chính thức có thể có trong tương lai.

## Tìm ID (thư mục)

Dùng CLI thư mục để khám phá người ngang hàng/nhóm và ID của họ:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Giới hạn

- Văn bản gửi đi được chia thành các đoạn khoảng ~2000 ký tự (giới hạn của ứng dụng Zalo).
- Truyền phát bị chặn theo mặc định.

## Kiểm soát truy cập (DM)

`channels.zalouser.dmPolicy` hỗ trợ: `pairing | allowlist | open | disabled` (mặc định: `pairing`).

`channels.zalouser.allowFrom` chấp nhận ID hoặc tên người dùng. Trong quá trình thiết lập, tên được phân giải thành ID bằng tra cứu liên hệ trong tiến trình của Plugin.

Phê duyệt qua:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Quyền truy cập nhóm (tùy chọn)

- Mặc định: `channels.zalouser.groupPolicy = "open"` (cho phép nhóm). Dùng `channels.defaults.groupPolicy` để ghi đè mặc định khi chưa đặt.
- Giới hạn vào danh sách cho phép bằng:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (khóa nên là ID nhóm ổn định; tên được phân giải thành ID khi khởi động nếu có thể)
  - `channels.zalouser.groupAllowFrom` (kiểm soát người gửi nào trong các nhóm được phép có thể kích hoạt bot)
- Chặn tất cả nhóm: `channels.zalouser.groupPolicy = "disabled"`.
- Trình hướng dẫn cấu hình có thể nhắc nhập danh sách cho phép nhóm.
- Khi khởi động, OpenClaw phân giải tên nhóm/người dùng trong danh sách cho phép thành ID và ghi log ánh xạ.
- Đối sánh danh sách cho phép nhóm mặc định chỉ dùng ID. Tên chưa phân giải bị bỏ qua khi xác thực trừ khi bật `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` là chế độ tương thích phá kính khẩn cấp, bật lại đối sánh tên nhóm có thể thay đổi.
- Nếu chưa đặt `groupAllowFrom`, runtime sẽ dùng `allowFrom` làm phương án dự phòng cho kiểm tra người gửi trong nhóm.
- Kiểm tra người gửi áp dụng cho cả tin nhắn nhóm thông thường và lệnh điều khiển (ví dụ `/new`, `/reset`).

Ví dụ:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Cổng kiểm soát nhắc đến trong nhóm

- `channels.zalouser.groups.<group>.requireMention` kiểm soát việc phản hồi trong nhóm có yêu cầu nhắc đến hay không.
- Thứ tự phân giải: ID/tên nhóm chính xác -> slug nhóm đã chuẩn hóa -> `*` -> mặc định (`true`).
- Điều này áp dụng cho cả nhóm trong danh sách cho phép và chế độ nhóm mở.
- Trích dẫn tin nhắn của bot được tính là một lượt nhắc đến ngầm định để kích hoạt nhóm.
- Các lệnh điều khiển đã được ủy quyền (ví dụ `/new`) có thể bỏ qua cổng kiểm soát nhắc đến.
- Khi một tin nhắn nhóm bị bỏ qua vì yêu cầu nhắc đến, OpenClaw lưu tin đó làm lịch sử nhóm đang chờ và đưa vào tin nhắn nhóm được xử lý tiếp theo.
- Giới hạn lịch sử nhóm mặc định là `messages.groupChat.historyLimit` (dự phòng `50`). Bạn có thể ghi đè theo từng tài khoản bằng `channels.zalouser.historyLimit`.

Ví dụ:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Nhiều tài khoản

Tài khoản ánh xạ tới các hồ sơ `zalouser` trong trạng thái OpenClaw. Ví dụ:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Đang nhập, phản ứng và xác nhận giao nhận

- OpenClaw gửi một sự kiện đang nhập trước khi gửi phản hồi (nỗ lực tối đa).
- Hành động phản ứng tin nhắn `react` được hỗ trợ cho `zalouser` trong các hành động kênh.
  - Dùng `remove: true` để xóa một emoji phản ứng cụ thể khỏi tin nhắn.
  - Ngữ nghĩa phản ứng: [Phản ứng](/vi/tools/reactions)
- Với các tin nhắn đến có siêu dữ liệu sự kiện, OpenClaw gửi xác nhận đã giao + đã xem (nỗ lực tối đa).

## Khắc phục sự cố

**Đăng nhập không được giữ lại:**

- `openclaw channels status --probe`
- Đăng nhập lại: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Danh sách cho phép/tên nhóm không phân giải được:**

- Dùng ID dạng số trong `allowFrom`/`groupAllowFrom`/`groups`, hoặc tên bạn bè/nhóm chính xác.

**Đã nâng cấp từ thiết lập cũ dựa trên CLI:**

- Gỡ bỏ mọi giả định cũ về tiến trình `zca` bên ngoài.
- Kênh hiện chạy hoàn toàn trong OpenClaw mà không cần binary CLI bên ngoài.

## Liên quan

- [Tổng quan về kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép đôi](/vi/channels/pairing) — xác thực DM và luồng ghép đôi
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và cổng kiểm soát nhắc đến
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo mật
