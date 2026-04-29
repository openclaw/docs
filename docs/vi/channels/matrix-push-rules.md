---
read_when:
    - Thiết lập truyền phát im lặng Matrix cho Synapse hoặc Tuwunel tự lưu trữ
    - Người dùng muốn nhận thông báo chỉ khi các khối đã hoàn tất, không phải sau mỗi lần chỉnh sửa bản xem trước
summary: Quy tắc push Matrix theo từng người nhận cho các chỉnh sửa bản xem trước được hoàn tất trong im lặng
title: Quy tắc thông báo đẩy của Matrix cho bản xem trước yên lặng
x-i18n:
    generated_at: "2026-04-29T22:26:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Khi `channels.matrix.streaming` là `"quiet"`, OpenClaw chỉnh sửa một sự kiện xem trước duy nhất tại chỗ và đánh dấu bản chỉnh sửa cuối cùng bằng một cờ nội dung tùy chỉnh. Matrix client chỉ thông báo cho bản chỉnh sửa cuối cùng nếu một quy tắc push theo từng người dùng khớp với cờ đó. Trang này dành cho các operator tự host Matrix và muốn cài đặt quy tắc đó cho từng tài khoản người nhận.

Nếu bạn chỉ muốn hành vi thông báo Matrix mặc định, hãy dùng `streaming: "partial"` hoặc tắt streaming. Xem [thiết lập kênh Matrix](/vi/channels/matrix#streaming-previews).

## Điều kiện tiên quyết

- người dùng nhận = người cần nhận thông báo
- người dùng bot = tài khoản Matrix của OpenClaw gửi câu trả lời
- dùng access token của người dùng nhận cho các lệnh gọi API bên dưới
- khớp `sender` trong quy tắc push với MXID đầy đủ của người dùng bot
- tài khoản người nhận phải đã có pusher hoạt động — quy tắc xem trước yên lặng chỉ hoạt động khi việc gửi push Matrix thông thường đang khỏe mạnh

## Các bước

<Steps>
  <Step title="Cấu hình bản xem trước yên lặng">

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

  <Step title="Lấy access token của người nhận">
    Tái sử dụng token phiên client hiện có khi có thể. Để tạo một token mới:

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

  <Step title="Xác minh pusher tồn tại">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Nếu không có pusher nào được trả về, hãy sửa việc gửi push Matrix thông thường cho tài khoản này trước khi tiếp tục.

  </Step>

  <Step title="Cài đặt quy tắc push override">
    OpenClaw đánh dấu các bản chỉnh sửa xem trước chỉ có văn bản đã hoàn tất bằng `content["com.openclaw.finalized_preview"] = true`. Cài đặt một quy tắc khớp marker đó cùng với MXID bot làm sender:

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

    - `https://matrix.example.org`: URL gốc homeserver của bạn
    - `$USER_ACCESS_TOKEN`: access token của người dùng nhận
    - `openclaw-finalized-preview-botname`: ID quy tắc duy nhất cho mỗi bot trên mỗi người nhận (mẫu: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: MXID bot OpenClaw của bạn, không phải của người nhận

  </Step>

  <Step title="Xác minh">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Sau đó kiểm thử một câu trả lời được stream. Ở chế độ yên lặng, phòng hiển thị bản xem trước nháp yên lặng và thông báo một lần khi block hoặc lượt kết thúc.

  </Step>
</Steps>

Để xóa quy tắc sau này, `DELETE` cùng URL quy tắc bằng token của người nhận.

## Ghi chú nhiều bot

Quy tắc push được định danh bằng `ruleId`: chạy lại `PUT` với cùng ID sẽ cập nhật một quy tắc duy nhất. Với nhiều bot OpenClaw thông báo cho cùng một người nhận, hãy tạo một quy tắc cho mỗi bot với điều kiện khớp sender riêng biệt.

Các quy tắc `override` do người dùng định nghĩa mới được chèn trước các quy tắc chặn mặc định, nên không cần tham số thứ tự bổ sung. Quy tắc này chỉ ảnh hưởng đến các bản chỉnh sửa xem trước chỉ có văn bản có thể được hoàn tất tại chỗ; fallback media và fallback bản xem trước cũ dùng cách gửi Matrix thông thường.

## Ghi chú homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Không cần thay đổi `homeserver.yaml` đặc biệt. Nếu thông báo Matrix thông thường đã đến được người dùng này, token người nhận + lệnh gọi `pushrules` ở trên là bước thiết lập chính.

    Nếu bạn chạy Synapse phía sau reverse proxy hoặc worker, hãy bảo đảm `/_matrix/client/.../pushrules/` đến Synapse đúng cách. Việc gửi push do tiến trình chính hoặc `synapse.app.pusher` / các worker pusher đã cấu hình xử lý — hãy bảo đảm chúng đang khỏe mạnh.

    Quy tắc này dùng điều kiện quy tắc push `event_property_is` (MSC3758, push rule v1.10), được thêm vào Synapse năm 2023. Các bản phát hành Synapse cũ hơn chấp nhận lệnh gọi `PUT pushrules/...` nhưng âm thầm không bao giờ khớp điều kiện — hãy nâng cấp Synapse nếu không có thông báo nào đến khi có bản chỉnh sửa xem trước đã hoàn tất.

  </Accordion>

  <Accordion title="Tuwunel">
    Cùng quy trình như Synapse; không cần cấu hình riêng cho Tuwunel đối với marker bản xem trước đã hoàn tất.

    Nếu thông báo biến mất trong khi người dùng đang hoạt động trên một thiết bị khác, hãy kiểm tra xem `suppress_push_when_active` có được bật không. Tuwunel đã thêm tùy chọn này trong 1.4.2 (tháng 9 năm 2025) và nó có thể chủ động chặn push đến các thiết bị khác khi một thiết bị đang hoạt động.

  </Accordion>
</AccordionGroup>

## Liên quan

- [Thiết lập kênh Matrix](/vi/channels/matrix)
- [Khái niệm streaming](/vi/concepts/streaming)
