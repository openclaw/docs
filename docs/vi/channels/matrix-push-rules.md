---
read_when:
    - Thiết lập chế độ truyền phát im lặng của Matrix cho Synapse hoặc Tuwunel tự lưu trữ
    - Người dùng chỉ muốn nhận thông báo khi các khối đã hoàn tất, không phải sau mỗi lần chỉnh sửa bản xem trước
summary: Quy tắc đẩy Matrix theo từng người nhận cho các chỉnh sửa bản xem trước đã hoàn tất ở chế độ im lặng
title: Quy tắc đẩy của Matrix cho bản xem trước không thông báo
x-i18n:
    generated_at: "2026-07-16T14:51:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Khi `channels.matrix.streaming.mode` là `"quiet"`, OpenClaw truyền phát câu trả lời bằng cách chỉnh sửa tại chỗ một sự kiện xem trước duy nhất. Các bản xem trước được gửi dưới dạng sự kiện `m.notice` không kích hoạt thông báo, và bản chỉnh sửa đã hoàn tất được đánh dấu bằng `content["com.openclaw.finalized_preview"] = true`. Các ứng dụng khách Matrix chỉ thông báo về bản chỉnh sửa cuối cùng đó nếu một quy tắc đẩy riêng cho từng người dùng khớp với dấu đánh dấu. Trang này dành cho các nhà vận hành tự lưu trữ Matrix và muốn cài đặt quy tắc đó cho từng tài khoản người nhận.

`streaming.mode: "progress"` hoàn tất các bản nháp qua cùng một đường dẫn, vì vậy quy tắc này cũng được kích hoạt cho các bản chỉnh sửa đã hoàn tất ở chế độ tiến trình.

Nếu bạn chỉ muốn hành vi thông báo Matrix mặc định, hãy dùng `streaming.mode: "partial"` hoặc tắt tính năng truyền phát. Xem [Thiết lập kênh Matrix](/vi/channels/matrix#streaming-previews).

## Điều kiện tiên quyết

- người dùng nhận = người cần nhận thông báo
- người dùng bot = tài khoản Matrix của OpenClaw gửi câu trả lời
- dùng mã truy cập của người dùng nhận cho các lệnh gọi API bên dưới
- đối chiếu `sender` trong quy tắc đẩy với MXID đầy đủ của người dùng bot
- tài khoản người nhận phải có các pusher đang hoạt động; quy tắc xem trước im lặng chỉ hoạt động khi việc phân phối đẩy Matrix thông thường ở trạng thái ổn định

## Các bước

<Steps>
  <Step title="Cấu hình bản xem trước im lặng">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="Lấy mã truy cập của người nhận">
    Tái sử dụng mã phiên ứng dụng khách hiện có khi có thể. Để tạo mã mới:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Xác minh có pusher">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Nếu không trả về pusher nào, hãy khắc phục việc phân phối đẩy Matrix thông thường cho tài khoản này trước khi tiếp tục.

  </Step>

  <Step title="Cài đặt quy tắc đẩy ghi đè">
    Cài đặt một quy tắc khớp với dấu đánh dấu bản xem trước đã hoàn tất và MXID của bot với tư cách người gửi:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Thay thế trước khi chạy:

    - `https://matrix.example.org`: URL cơ sở của homeserver
    - `$USER_ACCESS_TOKEN`: mã truy cập của người dùng nhận
    - `openclaw-finalized-preview-botname`: ID quy tắc duy nhất cho mỗi bot và mỗi người nhận (mẫu: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID của bot OpenClaw, không phải của người nhận

  </Step>

  <Step title="Xác minh">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Sau đó kiểm tra một câu trả lời được truyền phát. Ở chế độ im lặng, phòng hiển thị bản xem trước nháp im lặng và gửi thông báo khi khối hoặc lượt hoàn tất.

  </Step>
</Steps>

Để xóa quy tắc sau này, hãy `DELETE` cùng URL quy tắc bằng mã của người nhận.

## Lưu ý về nhiều bot

Các quy tắc đẩy được định danh bằng `ruleId`: việc chạy lại `PUT` với cùng một ID sẽ cập nhật một quy tắc duy nhất. Đối với nhiều bot OpenClaw gửi thông báo cho cùng một người nhận, hãy tạo một quy tắc cho mỗi bot với điều kiện khớp người gửi riêng biệt.

Các quy tắc `override` mới do người dùng định nghĩa được chèn trước các quy tắc chặn mặc định của máy chủ, vì vậy không cần tham số thứ tự bổ sung. Quy tắc này chỉ ảnh hưởng đến các bản chỉnh sửa xem trước chỉ chứa văn bản có thể được hoàn tất tại chỗ; câu trả lời có nội dung đa phương tiện, phương án dự phòng cho bản xem trước cũ và văn bản cuối cùng có thể kích hoạt lượt đề cập Matrix sẽ được phân phối dưới dạng tin nhắn thông báo thông thường.

## Lưu ý về homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Không cần thay đổi `homeserver.yaml` đặc biệt. Nếu thông báo Matrix thông thường đã đến được người dùng này, mã của người nhận cùng lệnh gọi `pushrules` ở trên là bước thiết lập chính.

    Nếu bạn chạy Synapse phía sau proxy ngược hoặc worker, hãy bảo đảm `/_matrix/client/.../pushrules/` đến Synapse đúng cách. Việc phân phối đẩy do tiến trình chính hoặc `synapse.app.pusher` / các worker pusher đã cấu hình xử lý — hãy bảo đảm chúng hoạt động ổn định.

    Quy tắc sử dụng điều kiện quy tắc đẩy `event_property_is` (MSC3758, quy tắc đẩy v1.10), được thêm vào Synapse vào năm 2023. Các bản phát hành Synapse cũ hơn chấp nhận lệnh gọi `PUT pushrules/...` nhưng âm thầm không bao giờ khớp điều kiện — hãy nâng cấp Synapse nếu không có thông báo nào đến khi bản chỉnh sửa xem trước được hoàn tất.

  </Accordion>

  <Accordion title="Tuwunel">
    Quy trình giống Synapse; không cần cấu hình riêng cho Tuwunel đối với dấu đánh dấu bản xem trước đã hoàn tất.

    Nếu thông báo biến mất khi người dùng đang hoạt động trên một thiết bị khác, hãy kiểm tra xem `suppress_push_when_active` có được bật hay không. Tuwunel đã thêm tùy chọn này trong phiên bản 1.4.2 (tháng 9 năm 2025) và tùy chọn này có thể chủ ý chặn thông báo đẩy đến các thiết bị khác khi một thiết bị đang hoạt động.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Thiết lập kênh Matrix](/vi/channels/matrix)
- [Các khái niệm về truyền phát](/vi/concepts/streaming)
