---
read_when:
    - Bạn đang xây dựng hoặc tái cấu trúc luồng nhận của một plugin kênh nhắn tin
    - Bạn cần xây dựng ngữ cảnh đầu vào dùng chung, ghi lại phiên hoặc gửi phản hồi đã chuẩn bị sẵn
    - Bạn đang di chuyển các hàm trợ giúp lượt của kênh cũ sang các API inbound/message
summary: 'Các trình trợ giúp sự kiện đến cho plugin kênh: xây dựng ngữ cảnh, điều phối trình chạy dùng chung, bản ghi phiên và gửi phản hồi đã chuẩn bị'
title: API nhận dữ liệu vào của kênh
x-i18n:
    generated_at: "2026-07-20T04:45:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f702019b0ee35055edd6fdbccc190eee66f35419d918c50076a005072d3f8ec
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Các đường dẫn nhận của kênh tuân theo một luồng:

```text
sự kiện nền tảng -> dữ kiện/ngữ cảnh đầu vào -> phản hồi của tác tử -> phân phối tin nhắn
```

Sử dụng `openclaw/plugin-sdk/channel-inbound` để chuẩn hóa sự kiện đầu vào,
định dạng, xác định gốc và điều phối. Sử dụng
`openclaw/plugin-sdk/channel-outbound` cho hành vi gửi gốc, biên nhận, phân phối
bền vững và xem trước trực tiếp.

## Trình trợ giúp cốt lõi

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: ánh xạ các dữ kiện kênh đã chuẩn hóa
  vào ngữ cảnh lời nhắc/phiên. Truyền siêu dữ liệu người gửi/cuộc trò chuyện do kênh sở hữu
  qua `channelContext`, mà các hook Plugin nhận dưới dạng `ctx.channelContext`.
  Bổ sung `PluginHookChannelSenderContext` hoặc `PluginHookChannelChatContext`
  từ đường dẫn con này cho các trường dành riêng cho kênh.
- `runChannelInboundEvent(...)`: chạy các bước tiếp nhận, phân loại, kiểm tra trước, phân giải,
  ghi lại, điều phối và hoàn tất cho một sự kiện nền tảng đầu vào.
- `dispatchChannelInboundReply(...)`: ghi lại và điều phối một phản hồi đầu vào
  đã được lắp ráp bằng bộ điều hợp phân phối.

Đối với các sự kiện đầu vào chỉ có phương tiện, hãy để trống nội dung tin nhắn và văn bản lệnh,
đồng thời truyền một dữ kiện `ChannelInboundMediaInput` cho mỗi tệp đính kèm gốc. Khi một dòng
lịch sử ngữ cảnh hoặc một phương tiện truyền tải chỉ có văn bản khác phải mô tả các dữ kiện đó, hãy sử dụng
`formatMediaPlaceholderText(media)`. Hàm này phân loại từng dữ kiện dựa trên `kind`, loại
MIME, rồi đến phần mở rộng của đường dẫn hoặc URL; các tệp đính kèm gốc chưa được tải xuống vẫn phải
đóng góp một dữ kiện chỉ có loại cho mỗi tệp. Không sử dụng trình định dạng để tổng hợp
nội dung đầu vào chính.

Các kênh đi kèm/gốc đã nhận đối tượng thời gian chạy Plugin được chèn
có thể gọi cùng các trình trợ giúp trong `runtime.channel.inbound.*` thay vì
nhập trực tiếp đường dẫn con này:

```ts
await runtime.channel.inbound.run({
  channel: "demo",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest: normalizePlatformEvent,
    resolveTurn: resolveInboundReply,
  },
});
```

Lắp ráp các đầu vào `dispatchChannelInboundReply(...)` cho các trình điều phối tương thích
giữ việc phân phối trên nền tảng trong bộ điều hợp phân phối. Các đường dẫn gửi mới
nên sử dụng bộ điều hợp tin nhắn và các trình trợ giúp tin nhắn bền vững từ
`channel-outbound` thay thế.

## Di chuyển

Các bí danh thời gian chạy `runtime.channel.turn.*` đã bị xóa. Sử dụng:

- `runtime.channel.inbound.run(...)` cho các sự kiện đầu vào thô.
- `runtime.channel.inbound.dispatchReply(...)` cho các ngữ cảnh phản hồi đã lắp ráp.
- `runtime.channel.inbound.buildContext(...)` cho các tải trọng ngữ cảnh đầu vào.
- `runtime.channel.inbound.runPreparedReply(...)`, đã lỗi thời, chỉ dành cho
  các đường dẫn điều phối đã chuẩn bị do kênh sở hữu và đã tự lắp ráp
  closure điều phối của riêng mình.

Mã Plugin mới không nên đưa vào các API kênh có tên `turn`. Giữ thuật ngữ về lượt của mô hình hoặc
tác tử trong mã tác tử/nhà cung cấp; các Plugin kênh sử dụng thuật ngữ đầu vào,
tin nhắn, phân phối và phản hồi.
