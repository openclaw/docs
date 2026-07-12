---
read_when:
    - Thiết lập Zalo Cá nhân cho OpenClaw
    - Gỡ lỗi quy trình đăng nhập hoặc nhắn tin của Zalo Personal
summary: Hỗ trợ tài khoản Zalo cá nhân thông qua zca-js gốc (đăng nhập bằng mã QR), các tính năng và cấu hình
title: Zalo cá nhân
x-i18n:
    generated_at: "2026-07-12T07:47:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Trạng thái: thử nghiệm. Tích hợp này tự động hóa một **tài khoản Zalo cá nhân** thông qua `zca-js` gốc, ngay trong tiến trình, không cần tệp nhị phân CLI bên ngoài.

<Warning>
Đây là một tích hợp không chính thức và có thể khiến tài khoản bị đình chỉ hoặc cấm. Bạn tự chịu rủi ro khi sử dụng.
</Warning>

## Cài đặt

Zalo Personal là một plugin bên ngoài chính thức, không được đóng gói trong lõi. Hãy cài đặt trước khi sử dụng:

```bash
openclaw plugins install @openclaw/zalouser
```

- Ghim phiên bản: `openclaw plugins install @openclaw/zalouser@<version>`
- Từ bản sao mã nguồn đã checkout: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Chi tiết: [Plugin](/vi/tools/plugin)

## Thiết lập nhanh

1. Cài đặt plugin (ở trên).
2. Đăng nhập (bằng mã QR, trên máy chạy Gateway):
   - `openclaw channels login --channel zalouser`
   - Quét mã QR bằng ứng dụng Zalo trên thiết bị di động.
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
5. Quyền truy cập tin nhắn trực tiếp mặc định sử dụng ghép nối; hãy phê duyệt mã ghép nối trong lần liên hệ đầu tiên.

## Đây là gì

- Chạy hoàn toàn trong tiến trình thông qua thư viện `zca-js` (không cần tệp nhị phân `zca`/`openzca` bên ngoài).
- Sử dụng các trình lắng nghe sự kiện gốc (`message`, `error`) để nhận tin nhắn đến.
- Gửi phản hồi trực tiếp thông qua API JS (văn bản/phương tiện/liên kết).
- Được thiết kế cho các trường hợp sử dụng "tài khoản cá nhân" khi không có Zalo Bot API.

## Quy ước đặt tên

ID kênh là `zalouser` để thể hiện rõ rằng tích hợp này tự động hóa một **tài khoản người dùng Zalo cá nhân** (không chính thức). `zalo` được dành riêng cho một tích hợp API Zalo chính thức có thể xuất hiện trong tương lai.

## Tìm ID (danh bạ)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Giới hạn

- Văn bản gửi đi được chia thành các đoạn dài tối đa 2000 ký tự (giới hạn của ứng dụng Zalo).
- Không hỗ trợ truyền phát trực tiếp.

## Kiểm soát quyền truy cập (tin nhắn trực tiếp)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: `pairing`).

`channels.zalouser.allowFrom` nên sử dụng ID người dùng Zalo ổn định. Trường này cũng có thể tham chiếu các nhóm truy cập người gửi tĩnh (`accessGroup:<name>`). Trong quá trình thiết lập tương tác, tên đã nhập có thể được phân giải thành ID bằng chức năng tra cứu liên hệ trong tiến trình của plugin.

Nếu tên thô vẫn còn trong cấu hình, quá trình khởi động chỉ phân giải tên đó khi `channels.zalouser.dangerouslyAllowNameMatching: true` được bật. Nếu không chủ động bật tùy chọn này, việc kiểm tra người gửi khi chạy chỉ dựa trên ID và các tên thô sẽ bị bỏ qua khi cấp quyền.

Phê duyệt bằng:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Quyền truy cập nhóm (tùy chọn)

- Mặc định: `channels.zalouser.groupPolicy = "allowlist"` (các nhóm cần có mục rõ ràng trong danh sách cho phép).
- Mở tất cả các nhóm: `channels.zalouser.groupPolicy = "open"`.
- Chặn tất cả các nhóm: `channels.zalouser.groupPolicy = "disabled"`.
- Với `groupPolicy = "allowlist"`:
  - Các khóa trong `channels.zalouser.groups` nên là ID nhóm ổn định; tên chỉ được phân giải thành ID khi khởi động nếu `channels.zalouser.dangerouslyAllowNameMatching: true` được bật.
  - `channels.zalouser.groupAllowFrom` kiểm soát những người gửi nào trong các nhóm được phép có thể kích hoạt bot; có thể tham chiếu các nhóm truy cập người gửi tĩnh bằng `accessGroup:<name>`.
- Trình hướng dẫn cấu hình có thể yêu cầu nhập danh sách nhóm được phép.
- Theo mặc định, việc đối chiếu danh sách nhóm được phép chỉ dựa trên ID. Các tên chưa phân giải sẽ bị bỏ qua khi xác thực, trừ khi `channels.zalouser.dangerouslyAllowNameMatching: true` được bật.
- `channels.zalouser.dangerouslyAllowNameMatching: true` là chế độ tương thích khẩn cấp, bật lại khả năng phân giải tên có thể thay đổi khi khởi động và đối chiếu tên nhóm trong thời gian chạy.
- `groupAllowFrom` **không** dự phòng về `allowFrom` đối với tin nhắn nhóm thông thường: nếu để trống trường này trong một nhóm thuộc danh sách cho phép, mọi người gửi đều có thể truy cập nhóm đó. Các lệnh điều khiển đã được cấp quyền (ví dụ `/new`) là ngoại lệ; việc kiểm tra người gửi lệnh sẽ dự phòng về `allowFrom` khi `groupAllowFrom` để trống.

Ví dụ:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` là tên trường cũ; cấu hình hiện tại sử dụng `enabled`. `openclaw doctor --fix` tự động di chuyển `allow` sang `enabled`.
</Note>

### Yêu cầu đề cập trong nhóm

- `channels.zalouser.groups.<group>.requireMention` kiểm soát việc phản hồi trong nhóm có yêu cầu đề cập hay không.
- Thứ tự phân giải: ID nhóm -> bí danh `group:<id>` -> tên/slug của nhóm (các ứng viên dựa trên tên chỉ áp dụng khi `dangerouslyAllowNameMatching: true`) -> `*` -> mặc định (`true`).
- Áp dụng cho cả các nhóm thuộc danh sách cho phép và chế độ nhóm mở.
- Trích dẫn tin nhắn của bot được tính là một lượt đề cập ngầm để kích hoạt trong nhóm.
- Các lệnh điều khiển đã được cấp quyền (ví dụ `/new`) có thể bỏ qua yêu cầu đề cập.
- Khi một tin nhắn nhóm bị bỏ qua do yêu cầu đề cập, OpenClaw lưu tin nhắn đó dưới dạng lịch sử nhóm đang chờ và đưa nó vào tin nhắn nhóm được xử lý tiếp theo.
- Giới hạn lịch sử nhóm: `channels.zalouser.historyLimit`, sau đó là `messages.groupChat.historyLimit`, rồi giá trị dự phòng `50`.

Ví dụ:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## Nhiều tài khoản

Các tài khoản ánh xạ tới hồ sơ `zalouser` trong trạng thái OpenClaw. Ví dụ:

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

Việc chọn hồ sơ cũng có thể dựa trên các biến môi trường:

| Biến               | Mục đích                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Tên hồ sơ cần dùng khi không đặt `profile` trong cấu hình kênh hoặc tài khoản.                   |
| `ZCA_PROFILE`      | Giá trị dự phòng cũ, chỉ được dùng khi chưa đặt `ZALOUSER_PROFILE`.                              |

Tên hồ sơ chọn thông tin xác thực đăng nhập Zalo đã lưu trong trạng thái OpenClaw. Thứ tự phân giải:

1. `profile` được chỉ định rõ trong cấu hình.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. ID tài khoản đối với tài khoản không mặc định, hoặc `default` đối với tài khoản mặc định.

Đối với thiết lập nhiều tài khoản, nên đặt `profile` cho từng tài khoản trong cấu hình để một biến môi trường không khiến nhiều tài khoản dùng chung một phiên đăng nhập.

## Trạng thái đang nhập, cảm xúc và xác nhận gửi

- OpenClaw gửi sự kiện đang nhập trước khi gửi phản hồi (trong phạm vi khả năng tốt nhất).
- Hành động cảm xúc tin nhắn `react` được hỗ trợ cho `zalouser` trong các hành động của kênh.
  - Sử dụng `remove: true` để xóa một emoji cảm xúc cụ thể khỏi tin nhắn.
  - Ngữ nghĩa cảm xúc: [Cảm xúc](/vi/tools/reactions)
- Đối với tin nhắn đến có chứa siêu dữ liệu sự kiện, OpenClaw gửi xác nhận đã chuyển + đã xem (trong phạm vi khả năng tốt nhất).

## Khắc phục sự cố

**Trạng thái đăng nhập không được duy trì:**

- `openclaw channels status --probe`
- Đăng nhập lại: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Tên trong danh sách cho phép/tên nhóm không được phân giải:**

- Sử dụng ID dạng số trong `allowFrom`/`groupAllowFrom` và ID nhóm ổn định trong `groups`. Nếu bạn chủ đích cần sử dụng chính xác tên bạn bè/nhóm, hãy bật `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Đã nâng cấp từ thiết lập cũ dựa trên `zca`/CLI bên ngoài:**

- Loại bỏ mọi giả định về tiến trình `zca` bên ngoài; giờ đây kênh chạy hoàn toàn trong tiến trình thông qua `zca-js`, không cần tệp nhị phân CLI bên ngoài.

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - quy trình xác thực và ghép nối tin nhắn trực tiếp
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và yêu cầu đề cập
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình truy cập và tăng cường bảo mật
