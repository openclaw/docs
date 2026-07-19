---
read_when:
    - Thiết lập Zalo Personal cho OpenClaw
    - Gỡ lỗi quy trình đăng nhập hoặc nhắn tin của Zalo Personal
summary: Hỗ trợ tài khoản Zalo cá nhân qua zca-js gốc (đăng nhập bằng mã QR), các khả năng và cấu hình
title: Zalo cá nhân
x-i18n:
    generated_at: "2026-07-19T05:44:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 09cecad1a9a5b34b932c5e68e2b3164b360fb6af1dcd2fd5b5979d1b2a1bd62b
    source_path: channels/zalouser.md
    workflow: 16
---

Trạng thái: thử nghiệm. Tích hợp này tự động hóa một **tài khoản Zalo cá nhân** thông qua `zca-js` gốc, chạy trong cùng tiến trình, không cần tệp nhị phân CLI bên ngoài.

<Warning>
Đây là tích hợp không chính thức và có thể khiến tài khoản bị đình chỉ hoặc cấm. Bạn tự chịu rủi ro khi sử dụng.
</Warning>

## Cài đặt

Zalo Personal là một plugin bên ngoài chính thức, không được đóng gói cùng phần lõi. Hãy cài đặt trước khi sử dụng:

```bash
openclaw plugins install @openclaw/zalouser
```

- Ghim một phiên bản: `openclaw plugins install @openclaw/zalouser@<version>`
- Từ bản checkout mã nguồn: `openclaw plugins install ./path/to/local/zalouser-plugin`
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

4. Khởi động lại Gateway (hoặc hoàn tất quá trình thiết lập).
5. Quyền truy cập tin nhắn trực tiếp mặc định sử dụng ghép nối; phê duyệt mã ghép nối trong lần liên hệ đầu tiên.

## Tích hợp này là gì

- Chạy hoàn toàn trong cùng tiến trình thông qua thư viện `zca-js` (không cần tệp nhị phân `zca`/`openzca` bên ngoài).
- Sử dụng các trình lắng nghe sự kiện gốc (`message`, `error`) để nhận tin nhắn đến.
- Gửi phản hồi trực tiếp qua API JS (văn bản/phương tiện/liên kết).
- Được thiết kế cho các trường hợp sử dụng "tài khoản cá nhân" khi không thể sử dụng API Zalo Bot.

## Quy ước đặt tên

ID kênh là `zalouser` để thể hiện rõ rằng kênh này tự động hóa một **tài khoản người dùng Zalo cá nhân** (không chính thức). `zalo` được dành riêng cho khả năng tích hợp API Zalo chính thức trong tương lai.

## Tìm ID (danh bạ)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Giới hạn

- Văn bản gửi đi được chia thành các đoạn 2000 ký tự (giới hạn của ứng dụng Zalo).
- Không hỗ trợ truyền phát.
- ID của các tin nhắn đến đã hoàn tất được lưu giữ trong 30 ngày, giới hạn ở 1000 mục gần nhất cho mỗi tài khoản.

## Độ bền của tin nhắn đến

OpenClaw lưu trữ từng lệnh gọi lại tin nhắn `zca-js` thô trước khi xử lý. Các tin nhắn đang chờ sẽ tiếp tục từ hàng đợi của tài khoản sau khi Gateway khởi động lại và quá trình xử lý vẫn được tuần tự hóa theo từng cuộc trò chuyện trực tiếp hoặc nhóm.

Trình lắng nghe socket `zca-js` không cung cấp xác nhận gửi nhận hoặc tự động phát lại các tin nhắn cũ sau khi kết nối lại. Do đó, hàng đợi bền vững bảo vệ khoảng thời gian sự cố cục bộ sau khi lệnh gọi lại đến OpenClaw; hàng đợi này không thể khôi phục tin nhắn mà socket chưa từng chuyển đến. Các dấu mốc phát lại chủ yếu là biện pháp bảo vệ trước một lệnh gọi lại lặp lại có cùng ID tin nhắn Zalo.

## Kiểm soát quyền truy cập (tin nhắn trực tiếp)

`channels.zalouser.dmPolicy`: `pairing | allowlist | open | disabled` (mặc định: `pairing`).

`channels.zalouser.allowFrom` nên sử dụng ID người dùng Zalo ổn định. Trường này cũng có thể tham chiếu các nhóm quyền truy cập người gửi tĩnh (`accessGroup:<name>`). Trong quá trình thiết lập tương tác, tên đã nhập có thể được phân giải thành ID bằng chức năng tra cứu liên hệ trong cùng tiến trình của plugin.

Nếu tên thô vẫn còn trong cấu hình, quá trình khởi động chỉ phân giải tên đó khi `channels.zalouser.dangerouslyAllowNameMatching: true` được bật. Nếu không bật tùy chọn này, việc kiểm tra người gửi trong thời gian chạy chỉ dựa trên ID và tên thô sẽ bị bỏ qua khi cấp quyền.

Phê duyệt qua:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Quyền truy cập nhóm (tùy chọn)

- Mặc định: `channels.zalouser.groupPolicy = "allowlist"` (các nhóm cần có một mục rõ ràng trong danh sách cho phép).
- Mở tất cả các nhóm: `channels.zalouser.groupPolicy = "open"`.
- Chặn tất cả các nhóm: `channels.zalouser.groupPolicy = "disabled"`.
- Với `groupPolicy = "allowlist"`:
  - Các khóa `channels.zalouser.groups` nên là ID nhóm ổn định; tên chỉ được phân giải thành ID khi khởi động nếu `channels.zalouser.dangerouslyAllowNameMatching: true` được bật.
  - `channels.zalouser.groupAllowFrom` kiểm soát những người gửi nào trong các nhóm được phép có thể kích hoạt bot; có thể tham chiếu các nhóm quyền truy cập người gửi tĩnh bằng `accessGroup:<name>`.
- Trình hướng dẫn cấu hình có thể nhắc nhập danh sách cho phép của nhóm.
- Theo mặc định, việc đối chiếu danh sách cho phép của nhóm chỉ dựa trên ID. Tên chưa được phân giải sẽ bị bỏ qua khi cấp quyền, trừ khi `channels.zalouser.dangerouslyAllowNameMatching: true` được bật.
- `channels.zalouser.dangerouslyAllowNameMatching: true` là chế độ tương thích khẩn cấp, bật lại khả năng phân giải tên có thể thay đổi khi khởi động và đối chiếu tên nhóm trong thời gian chạy.
- `groupAllowFrom` **không** dự phòng sang `allowFrom` cho tin nhắn nhóm thông thường: nếu để trống trường này trong một nhóm thuộc danh sách cho phép, bất kỳ người gửi nào cũng có thể truy cập nhóm đó. Các lệnh điều khiển đã được cấp quyền (ví dụ: `/new`) là ngoại lệ; việc kiểm tra người gửi lệnh sẽ dự phòng sang `allowFrom` khi `groupAllowFrom` trống.

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

### Kiểm soát yêu cầu nhắc tên trong nhóm

- `channels.zalouser.groups.<group>.requireMention` kiểm soát việc phản hồi trong nhóm có yêu cầu nhắc tên hay không.
- Thứ tự phân giải: ID nhóm -> bí danh `group:<id>` -> tên/slug nhóm (các ứng viên dựa trên tên chỉ áp dụng khi `dangerouslyAllowNameMatching: true`) -> `*` -> mặc định (`true`).
- Áp dụng cho cả các nhóm trong danh sách cho phép và chế độ nhóm mở.
- Trích dẫn một tin nhắn của bot được tính là một lần nhắc tên ngầm để kích hoạt trong nhóm.
- Các lệnh điều khiển đã được cấp quyền (ví dụ: `/new`) có thể bỏ qua yêu cầu nhắc tên.
- Khi một tin nhắn nhóm bị bỏ qua vì cần nhắc tên, OpenClaw lưu trữ tin nhắn đó dưới dạng lịch sử nhóm đang chờ và đưa nó vào tin nhắn nhóm được xử lý tiếp theo.
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

Việc chọn hồ sơ cũng có thể được xác định từ các biến môi trường:

| Biến               | Mục đích                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Tên hồ sơ sẽ sử dụng khi không có `profile` nào được đặt trong cấu hình kênh hoặc tài khoản. |
| `ZCA_PROFILE`      | Giá trị dự phòng cũ, chỉ được sử dụng khi `ZALOUSER_PROFILE` chưa được đặt.             |

Tên hồ sơ chọn thông tin xác thực đăng nhập Zalo đã lưu trong trạng thái OpenClaw. Thứ tự phân giải:

1. `profile` được chỉ định rõ ràng trong cấu hình.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. ID tài khoản đối với các tài khoản không mặc định, hoặc `default` đối với tài khoản mặc định.

Đối với thiết lập nhiều tài khoản, nên đặt `profile` cho từng tài khoản trong cấu hình để một biến môi trường không khiến nhiều tài khoản dùng chung một phiên đăng nhập.

## Trạng thái đang nhập, phản ứng và xác nhận gửi nhận

- OpenClaw gửi một sự kiện đang nhập trước khi gửi phản hồi (theo khả năng tốt nhất).
- Tác vụ phản ứng tin nhắn `react` được hỗ trợ cho `zalouser` trong các tác vụ kênh.
  - Sử dụng `remove: true` để xóa một biểu tượng cảm xúc phản ứng cụ thể khỏi tin nhắn.
  - Ngữ nghĩa của phản ứng: [Phản ứng](/vi/tools/reactions)
- Đối với các tin nhắn đến có chứa siêu dữ liệu sự kiện, OpenClaw gửi xác nhận đã chuyển và đã xem (theo khả năng tốt nhất).

## Khắc phục sự cố

**Trạng thái đăng nhập không được duy trì:**

- `openclaw channels status --probe`
- Đăng nhập lại: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Không thể phân giải tên trong danh sách cho phép/nhóm:**

- Sử dụng ID số trong `allowFrom`/`groupAllowFrom` và ID nhóm ổn định trong `groups`. Nếu bạn chủ ý cần tên chính xác của bạn bè/nhóm, hãy bật `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Đã nâng cấp từ thiết lập cũ dựa trên `zca`/CLI bên ngoài:**

- Loại bỏ mọi giả định về tiến trình `zca` bên ngoài; kênh hiện chạy hoàn toàn trong cùng tiến trình thông qua `zca-js`, không cần tệp nhị phân CLI bên ngoài.

## Liên quan

- [Tổng quan về kênh](/vi/channels) - tất cả các kênh được hỗ trợ
- [Ghép nối](/vi/channels/pairing) - xác thực tin nhắn trực tiếp và luồng ghép nối
- [Nhóm](/vi/channels/groups) - hành vi trò chuyện nhóm và kiểm soát yêu cầu nhắc tên
- [Định tuyến kênh](/vi/channels/channel-routing) - định tuyến phiên cho tin nhắn
- [Bảo mật](/vi/gateway/security) - mô hình quyền truy cập và tăng cường bảo mật
