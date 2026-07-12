---
read_when:
    - Thiết lập chế độ truyền phát yên lặng của Matrix cho Synapse hoặc Tuwunel tự lưu trữ
    - Người dùng chỉ muốn nhận thông báo khi các khối đã hoàn tất, không phải sau mỗi lần chỉnh sửa bản xem trước
summary: Quy tắc đẩy Matrix theo từng người nhận cho các chỉnh sửa bản xem trước đã hoàn tất mà không gửi thông báo
title: Quy tắc đẩy lên Matrix cho bản xem trước không thông báo
x-i18n:
    generated_at: "2026-07-12T07:43:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Khi `channels.matrix.streaming` là `"quiet"`, OpenClaw truyền phát câu trả lời bằng cách chỉnh sửa tại chỗ một sự kiện xem trước duy nhất. Các bản xem trước được gửi dưới dạng sự kiện `m.notice` không kích hoạt thông báo, và bản chỉnh sửa hoàn tất được đánh dấu bằng `content["com.openclaw.finalized_preview"] = true`. Các ứng dụng khách Matrix chỉ thông báo về bản chỉnh sửa cuối cùng đó nếu quy tắc đẩy riêng cho từng người dùng khớp với dấu mốc này. Trang này dành cho các đơn vị vận hành tự lưu trữ Matrix và muốn cài đặt quy tắc đó cho từng tài khoản người nhận.

`streaming: "progress"` hoàn tất các bản nháp qua cùng một đường dẫn, vì vậy quy tắc này cũng được kích hoạt cho các bản chỉnh sửa đã hoàn tất ở chế độ tiến trình.

Nếu bạn chỉ muốn hành vi thông báo Matrix mặc định, hãy dùng `streaming: "partial"` hoặc tắt tính năng truyền phát. Xem [Thiết lập kênh Matrix](/vi/channels/matrix#streaming-previews).

## Điều kiện tiên quyết

- người dùng nhận = người cần nhận thông báo
- người dùng bot = tài khoản Matrix của OpenClaw gửi câu trả lời
- dùng mã thông báo truy cập của người dùng nhận cho các lệnh gọi API bên dưới
- đối chiếu `sender` trong quy tắc đẩy với MXID đầy đủ của người dùng bot
- tài khoản người nhận phải có các trình đẩy đang hoạt động; quy tắc xem trước im lặng chỉ hoạt động khi cơ chế gửi thông báo đẩy Matrix thông thường đang ổn định

## Các bước

<Steps>
  <Step title="Cấu hình bản xem trước im lặng">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Lấy mã thông báo truy cập của người nhận">
    Tái sử dụng mã thông báo của một phiên ứng dụng khách hiện có nếu có thể. Để tạo mã mới:

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

  <Step title="Xác minh có trình đẩy">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Nếu không có trình đẩy nào được trả về, hãy khắc phục cơ chế gửi thông báo đẩy Matrix thông thường cho tài khoản này trước khi tiếp tục.

  </Step>

  <Step title="Cài đặt quy tắc đẩy ghi đè">
    Cài đặt một quy tắc khớp với dấu mốc bản xem trước đã hoàn tất và MXID của bot ở vai trò người gửi:

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

    Thay thế các giá trị sau trước khi chạy:

    - `https://matrix.example.org`: URL cơ sở của máy chủ nhà của bạn
    - `$USER_ACCESS_TOKEN`: mã thông báo truy cập của người dùng nhận
    - `openclaw-finalized-preview-botname`: ID quy tắc duy nhất cho mỗi bot và mỗi người nhận (mẫu: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID của bot OpenClaw, không phải MXID của người nhận

  </Step>

  <Step title="Xác minh">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Sau đó, hãy kiểm thử một câu trả lời được truyền phát. Ở chế độ im lặng, phòng hiển thị bản xem trước nháp im lặng và gửi thông báo một lần khi khối hoặc lượt hoàn tất.

  </Step>
</Steps>

Để xóa quy tắc sau này, hãy gửi `DELETE` đến cùng URL quy tắc bằng mã thông báo của người nhận.

## Lưu ý khi dùng nhiều bot

Các quy tắc đẩy được định danh bằng `ruleId`: chạy lại `PUT` với cùng một ID sẽ cập nhật một quy tắc duy nhất. Với nhiều bot OpenClaw gửi thông báo cho cùng một người nhận, hãy tạo một quy tắc cho mỗi bot với điều kiện khớp người gửi riêng biệt.

Các quy tắc `override` mới do người dùng định nghĩa được chèn trước các quy tắc chặn mặc định của máy chủ, vì vậy không cần tham số thứ tự bổ sung. Quy tắc này chỉ ảnh hưởng đến các bản chỉnh sửa xem trước chỉ chứa văn bản có thể được hoàn tất tại chỗ; câu trả lời chứa nội dung đa phương tiện, phương án dự phòng khi bản xem trước đã cũ và văn bản cuối cùng có thể kích hoạt lượt nhắc đến trong Matrix sẽ được gửi dưới dạng thông báo thông thường.

## Lưu ý về máy chủ nhà

<AccordionGroup>
  <Accordion title="Synapse">
    Không cần thay đổi đặc biệt nào trong `homeserver.yaml`. Nếu các thông báo Matrix thông thường đã đến được người dùng này, mã thông báo của người nhận và lệnh gọi `pushrules` ở trên là bước thiết lập chính.

    Nếu bạn chạy Synapse phía sau proxy ngược hoặc các tiến trình worker, hãy bảo đảm `/_matrix/client/.../pushrules/` được chuyển đến Synapse đúng cách. Việc gửi thông báo đẩy được xử lý bởi tiến trình chính hoặc `synapse.app.pusher` / các worker trình đẩy đã cấu hình — hãy bảo đảm chúng hoạt động ổn định.

    Quy tắc sử dụng điều kiện quy tắc đẩy `event_property_is` (MSC3758, quy tắc đẩy v1.10), được thêm vào Synapse năm 2023. Các bản phát hành Synapse cũ hơn chấp nhận lệnh gọi `PUT pushrules/...` nhưng âm thầm không bao giờ khớp điều kiện — hãy nâng cấp Synapse nếu không nhận được thông báo khi bản xem trước được chỉnh sửa thành trạng thái hoàn tất.

  </Accordion>

  <Accordion title="Tuwunel">
    Quy trình giống như Synapse; không cần cấu hình dành riêng cho Tuwunel đối với dấu mốc bản xem trước đã hoàn tất.

    Nếu thông báo biến mất khi người dùng đang hoạt động trên thiết bị khác, hãy kiểm tra xem `suppress_push_when_active` có được bật hay không. Tuwunel đã thêm tùy chọn này trong phiên bản 1.4.2 (tháng 9 năm 2025) và tùy chọn này có thể chủ động chặn thông báo đẩy đến các thiết bị khác khi một thiết bị đang hoạt động.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Thiết lập kênh Matrix](/vi/channels/matrix)
- [Các khái niệm về truyền phát](/vi/concepts/streaming)
