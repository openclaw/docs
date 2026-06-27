---
read_when:
    - Thiết lập Zalo Personal cho OpenClaw
    - Gỡ lỗi đăng nhập hoặc luồng tin nhắn Zalo Personal
summary: Hỗ trợ tài khoản cá nhân Zalo thông qua zca-js gốc (đăng nhập bằng QR), các khả năng và cấu hình
title: Zalo cá nhân
x-i18n:
    generated_at: "2026-06-27T17:13:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

Trạng thái: thử nghiệm. Tích hợp này tự động hóa **tài khoản Zalo cá nhân** thông qua `zca-js` gốc bên trong OpenClaw.

<Warning>
Đây là một tích hợp không chính thức và có thể khiến tài khoản bị đình chỉ hoặc cấm. Tự chịu rủi ro khi sử dụng.
</Warning>

## Plugin được đóng gói sẵn

Zalo Personal được phát hành dưới dạng Plugin được đóng gói sẵn trong các bản phát hành OpenClaw hiện tại, nên các bản dựng
đóng gói thông thường không cần cài đặt riêng.

Nếu bạn đang dùng bản dựng cũ hơn hoặc một bản cài đặt tùy chỉnh loại trừ Zalo Personal,
hãy cài đặt trực tiếp gói npm:

- Cài đặt qua CLI: `openclaw plugins install @openclaw/zalouser`
- Phiên bản được ghim: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Hoặc từ một checkout mã nguồn: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Chi tiết: [Plugins](/vi/tools/plugin)

Không cần binary CLI `zca`/`openzca` bên ngoài.

## Thiết lập nhanh (người mới bắt đầu)

1. Đảm bảo Plugin Zalo Personal có sẵn.
   - Các bản phát hành OpenClaw đóng gói hiện tại đã bao gồm Plugin này.
   - Các bản cài đặt cũ hơn/tùy chỉnh có thể thêm thủ công bằng các lệnh ở trên.
2. Đăng nhập (QR, trên máy Gateway):
   - `openclaw channels login --channel zalouser`
   - Quét mã QR bằng ứng dụng Zalo di động.
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
5. Quyền truy cập DM mặc định dùng ghép cặp; phê duyệt mã ghép cặp khi liên hệ lần đầu.

## Đây là gì

- Chạy hoàn toàn trong tiến trình thông qua `zca-js`.
- Dùng trình lắng nghe sự kiện gốc để nhận tin nhắn đến.
- Gửi trả lời trực tiếp qua JS API (văn bản/phương tiện/liên kết).
- Được thiết kế cho các trường hợp dùng "tài khoản cá nhân" khi Zalo Bot API không có sẵn.

## Đặt tên

ID kênh là `zalouser` để thể hiện rõ rằng kênh này tự động hóa một **tài khoản người dùng Zalo cá nhân** (không chính thức). Chúng tôi giữ `zalo` dành riêng cho một tích hợp Zalo API chính thức có thể có trong tương lai.

## Tìm ID (danh bạ)

Dùng CLI danh bạ để khám phá các đối tượng ngang hàng/nhóm và ID của họ:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Giới hạn

- Văn bản gửi đi được chia thành các đoạn khoảng ~2000 ký tự (giới hạn của ứng dụng Zalo).
- Streaming bị chặn theo mặc định.

## Kiểm soát truy cập (DM)

`channels.zalouser.dmPolicy` hỗ trợ: `pairing | allowlist | open | disabled` (mặc định: `pairing`).

`channels.zalouser.allowFrom` nên dùng ID người dùng Zalo ổn định. Nó cũng có thể tham chiếu các nhóm truy cập người gửi tĩnh (`accessGroup:<name>`). Trong quá trình thiết lập tương tác, các tên đã nhập có thể được phân giải thành ID bằng tra cứu liên hệ trong tiến trình của Plugin.

Nếu một tên thô vẫn còn trong cấu hình, khi khởi động chỉ phân giải tên đó khi đã bật `channels.zalouser.dangerouslyAllowNameMatching: true`. Nếu không chọn tham gia, kiểm tra người gửi trong runtime chỉ dùng ID và các tên thô bị bỏ qua khi cấp quyền.

Phê duyệt bằng:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Truy cập nhóm (tùy chọn)

- Mặc định: `channels.zalouser.groupPolicy = "open"` (cho phép nhóm). Dùng `channels.defaults.groupPolicy` để ghi đè mặc định khi chưa đặt.
- Giới hạn vào danh sách cho phép bằng:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (khóa nên là ID nhóm ổn định; tên chỉ được phân giải thành ID khi khởi động nếu đã bật `channels.zalouser.dangerouslyAllowNameMatching: true`)
  - `channels.zalouser.groupAllowFrom` (kiểm soát người gửi nào trong các nhóm được phép có thể kích hoạt bot; có thể tham chiếu các nhóm truy cập người gửi tĩnh bằng `accessGroup:<name>`)
- Chặn tất cả nhóm: `channels.zalouser.groupPolicy = "disabled"`.
- Trình hướng dẫn cấu hình có thể nhắc nhập danh sách cho phép cho nhóm.
- Khi khởi động, OpenClaw phân giải tên nhóm/người dùng trong danh sách cho phép thành ID và chỉ ghi log ánh xạ khi đã bật `channels.zalouser.dangerouslyAllowNameMatching: true`.
- Khớp danh sách cho phép của nhóm mặc định chỉ dùng ID. Các tên chưa phân giải bị bỏ qua khi xác thực trừ khi đã bật `channels.zalouser.dangerouslyAllowNameMatching: true`.
- `channels.zalouser.dangerouslyAllowNameMatching: true` là chế độ tương thích phá kính khẩn cấp, bật lại phân giải tên có thể thay đổi khi khởi động và khớp tên nhóm trong runtime.
- Nếu chưa đặt `groupAllowFrom`, runtime sẽ dùng dự phòng `allowFrom` cho các kiểm tra người gửi trong nhóm.
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

### Kiểm soát yêu cầu nhắc trong nhóm

- `channels.zalouser.groups.<group>.requireMention` kiểm soát việc trả lời trong nhóm có yêu cầu một lượt nhắc hay không.
- Thứ tự phân giải: ID/tên nhóm chính xác -> slug nhóm đã chuẩn hóa -> `*` -> mặc định (`true`).
- Điều này áp dụng cho cả nhóm trong danh sách cho phép và chế độ nhóm mở.
- Trích dẫn tin nhắn của bot được tính là một lượt nhắc ngầm định để kích hoạt nhóm.
- Các lệnh điều khiển đã được cấp quyền (ví dụ `/new`) có thể bỏ qua kiểm soát yêu cầu nhắc.
- Khi một tin nhắn nhóm bị bỏ qua vì yêu cầu lượt nhắc, OpenClaw lưu nó dưới dạng lịch sử nhóm đang chờ và đưa vào tin nhắn nhóm được xử lý tiếp theo.
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

Tài khoản ánh xạ tới hồ sơ `zalouser` trong trạng thái OpenClaw. Ví dụ:

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

## Biến môi trường

Plugin Zalo Personal cũng có thể đọc lựa chọn hồ sơ từ biến môi trường:

- `ZALOUSER_PROFILE`: tên hồ sơ cần dùng khi không đặt `profile` trong cấu hình kênh hoặc tài khoản.
- `ZCA_PROFILE`: tên hồ sơ dự phòng kế thừa, chỉ dùng khi chưa đặt `ZALOUSER_PROFILE`.

Tên hồ sơ chọn thông tin đăng nhập Zalo đã lưu trong trạng thái OpenClaw. Thứ tự phân giải là:

1. `profile` rõ ràng trong cấu hình.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. ID tài khoản cho tài khoản không mặc định, hoặc `default` cho tài khoản mặc định.

Đối với thiết lập nhiều tài khoản, nên đặt `profile` trên từng tài khoản trong cấu hình để
một biến môi trường không khiến nhiều tài khoản dùng chung cùng một phiên
đăng nhập.

## Nhập liệu, phản ứng và xác nhận giao hàng

- OpenClaw gửi một sự kiện đang nhập trước khi phát một trả lời (nỗ lực tối đa).
- Hành động phản ứng tin nhắn `react` được hỗ trợ cho `zalouser` trong hành động kênh.
  - Dùng `remove: true` để xóa một emoji phản ứng cụ thể khỏi tin nhắn.
  - Ngữ nghĩa phản ứng: [Phản ứng](/vi/tools/reactions)
- Đối với tin nhắn đến có bao gồm siêu dữ liệu sự kiện, OpenClaw gửi xác nhận đã giao + đã xem (nỗ lực tối đa).

## Khắc phục sự cố

**Đăng nhập không được giữ lại:**

- `openclaw channels status --probe`
- Đăng nhập lại: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Tên trong danh sách cho phép/nhóm không phân giải được:**

- Dùng ID số trong `allowFrom`/`groupAllowFrom` và ID nhóm ổn định trong `groups`. Nếu bạn cố ý cần tên bạn bè/nhóm chính xác, hãy bật `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Đã nâng cấp từ thiết lập cũ dựa trên CLI:**

- Xóa mọi giả định cũ về tiến trình `zca` bên ngoài.
- Kênh hiện chạy hoàn toàn trong OpenClaw mà không cần binary CLI bên ngoài.

## Liên quan

- [Tổng quan kênh](/vi/channels) — tất cả kênh được hỗ trợ
- [Ghép cặp](/vi/channels/pairing) — xác thực DM và luồng ghép cặp
- [Nhóm](/vi/channels/groups) — hành vi trò chuyện nhóm và kiểm soát yêu cầu nhắc
- [Định tuyến kênh](/vi/channels/channel-routing) — định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) — mô hình truy cập và tăng cường bảo vệ
