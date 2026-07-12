---
read_when:
    - Bạn đang xây dựng hoặc tái cấu trúc luồng nhận của Plugin kênh nhắn tin
    - Bạn cần cơ chế dựng ngữ cảnh đầu vào dùng chung, ghi lại phiên hoặc gửi phản hồi đã chuẩn bị sẵn
    - Bạn đang di chuyển các hàm trợ giúp lượt hội thoại cũ của kênh sang các API inbound/message
summary: 'Các trình trợ giúp sự kiện đến cho Plugin kênh: xây dựng ngữ cảnh, điều phối trình chạy dùng chung, bản ghi phiên và gửi phản hồi đã chuẩn bị'
title: API đầu vào của kênh
x-i18n:
    generated_at: "2026-07-12T08:13:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a85ffaf9501af00e1493b5fbb0454a070626ed6ca41977323b55e84b92075ed1
    source_path: plugins/sdk-channel-inbound.md
    workflow: 16
---

Các đường dẫn tiếp nhận của kênh tuân theo một luồng:

```text
sự kiện nền tảng -> dữ kiện/ngữ cảnh đầu vào -> phản hồi của tác nhân -> chuyển phát tin nhắn
```

Sử dụng `openclaw/plugin-sdk/channel-inbound` để chuẩn hóa sự kiện đầu vào,
định dạng, xác định gốc và điều phối. Sử dụng
`openclaw/plugin-sdk/channel-outbound` cho thao tác gửi gốc, biên nhận, chuyển
phát bền vững và hành vi xem trước trực tiếp.

## Các hàm hỗ trợ cốt lõi

```ts
import {
  buildChannelInboundEventContext,
  runChannelInboundEvent,
  dispatchChannelInboundReply,
} from "openclaw/plugin-sdk/channel-inbound";
```

- `buildChannelInboundEventContext(...)`: ánh xạ các dữ kiện kênh đã chuẩn hóa
  vào ngữ cảnh lời nhắc/phiên. Truyền siêu dữ liệu người gửi/cuộc trò chuyện
  do kênh sở hữu qua `channelContext`, mà các hook của plugin sẽ nhận dưới dạng
  `ctx.channelContext`. Mở rộng `PluginHookChannelSenderContext` hoặc
  `PluginHookChannelChatContext` từ đường dẫn con này cho các trường dành riêng
  cho kênh.
- `runChannelInboundEvent(...)`: chạy các bước tiếp nhận, phân loại, kiểm tra
  sơ bộ, phân giải, ghi lại, điều phối và hoàn tất cho một sự kiện nền tảng đầu
  vào.
- `dispatchChannelInboundReply(...)`: ghi lại và điều phối một phản hồi đầu vào
  đã được tập hợp bằng bộ điều hợp chuyển phát.

Các kênh đi kèm/gốc đã nhận được đối tượng môi trường chạy plugin được chèn có
thể gọi cùng các hàm hỗ trợ qua `runtime.channel.inbound.*` thay vì nhập trực
tiếp đường dẫn con này:

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

Tập hợp các đầu vào của `dispatchChannelInboundReply(...)` cho những bộ điều
phối tương thích vẫn duy trì việc chuyển phát qua nền tảng trong bộ điều hợp
chuyển phát. Các đường dẫn gửi mới nên sử dụng bộ điều hợp tin nhắn và các hàm
hỗ trợ tin nhắn bền vững từ `channel-outbound`.

## Di chuyển

Các bí danh môi trường chạy `runtime.channel.turn.*` đã bị loại bỏ. Sử dụng:

- `runtime.channel.inbound.run(...)` cho các sự kiện đầu vào thô.
- `runtime.channel.inbound.dispatchReply(...)` cho các ngữ cảnh phản hồi đã
  được tập hợp.
- `runtime.channel.inbound.buildContext(...)` cho các tải trọng ngữ cảnh đầu
  vào.
- `runtime.channel.inbound.runPreparedReply(...)`, đã lỗi thời, chỉ dành cho
  các đường dẫn điều phối được chuẩn bị do kênh sở hữu và đã tự tập hợp closure
  điều phối riêng.

Mã plugin mới không nên đưa vào các API kênh có tên chứa `turn`. Chỉ sử dụng
thuật ngữ lượt của mô hình hoặc tác nhân trong mã tác nhân/nhà cung cấp; các
plugin kênh sử dụng thuật ngữ đầu vào, tin nhắn, chuyển phát và phản hồi.
