---
read_when:
    - Bạn muốn giảm mức tăng ngữ cảnh từ các đầu ra của công cụ
    - Bạn muốn hiểu cách tối ưu hóa bộ nhớ đệm lời nhắc của Anthropic
summary: Cắt bớt các kết quả công cụ cũ để giữ ngữ cảnh gọn nhẹ và lưu vào bộ nhớ đệm hiệu quả
title: Cắt gọn phiên
x-i18n:
    generated_at: "2026-04-29T22:39:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 16
---

Cắt tỉa phiên lược bỏ **kết quả công cụ cũ** khỏi ngữ cảnh trước mỗi lệnh gọi LLM. Nó giảm tình trạng phình to ngữ cảnh do các đầu ra công cụ tích lũy (kết quả thực thi lệnh, lượt đọc tệp, kết quả tìm kiếm) mà không viết lại văn bản hội thoại thông thường.

<Info>
Cắt tỉa chỉ diễn ra trong bộ nhớ -- nó không sửa đổi bản ghi phiên trên đĩa. Toàn bộ lịch sử của bạn luôn được giữ nguyên.
</Info>

## Vì sao điều này quan trọng

Các phiên dài tích lũy đầu ra công cụ làm phình cửa sổ ngữ cảnh. Điều này làm tăng chi phí và có thể buộc [Compaction](/vi/concepts/compaction) xảy ra sớm hơn cần thiết.

Cắt tỉa đặc biệt hữu ích cho **bộ nhớ đệm prompt của Anthropic**. Sau khi TTL của bộ nhớ đệm hết hạn, yêu cầu tiếp theo sẽ lưu lại toàn bộ prompt vào bộ nhớ đệm. Cắt tỉa giảm kích thước ghi bộ nhớ đệm, trực tiếp hạ chi phí.

## Cách hoạt động

1. Chờ TTL của bộ nhớ đệm hết hạn (mặc định 5 phút).
2. Tìm các kết quả công cụ cũ để cắt tỉa thông thường (văn bản hội thoại được giữ nguyên).
3. **Cắt mềm** các kết quả quá lớn -- giữ phần đầu và phần cuối, chèn `...`.
4. **Xóa cứng** phần còn lại -- thay bằng một phần giữ chỗ.
5. Đặt lại TTL để các yêu cầu tiếp theo tái sử dụng bộ nhớ đệm mới.

## Dọn dẹp hình ảnh cũ

OpenClaw cũng xây dựng một chế độ xem phát lại riêng, có tính lũy đẳng, cho các phiên lưu giữ khối hình ảnh thô hoặc dấu mốc phương tiện hydrate prompt trong lịch sử.

- Nó giữ nguyên từng byte của **3 lượt hoàn tất gần nhất** để tiền tố bộ nhớ đệm prompt cho các lượt theo dõi gần đây vẫn ổn định.
- Trong chế độ xem phát lại, các khối hình ảnh cũ đã được xử lý từ lịch sử `user` hoặc `toolResult` có thể được thay bằng `[image data removed - already processed by model]`.
- Các tham chiếu phương tiện dạng văn bản cũ hơn như `[media attached: ...]`, `[Image: source: ...]`, và `media://inbound/...` có thể được thay bằng `[media reference removed - already processed by model]`. Các dấu mốc tệp đính kèm của lượt hiện tại vẫn được giữ nguyên để mô hình thị giác vẫn có thể hydrate hình ảnh mới.
- Bản ghi phiên thô không bị viết lại, nên các trình xem lịch sử vẫn có thể hiển thị các mục tin nhắn gốc và hình ảnh của chúng.
- Cơ chế này tách biệt với cắt tỉa TTL bộ nhớ đệm thông thường. Nó tồn tại để ngăn các payload hình ảnh lặp lại hoặc tham chiếu phương tiện cũ làm hỏng bộ nhớ đệm prompt ở các lượt sau.

## Mặc định thông minh

OpenClaw tự động bật cắt tỉa cho các hồ sơ Anthropic:

| Loại hồ sơ                                             | Đã bật cắt tỉa | Heartbeat |
| ------------------------------------------------------ | -------------- | --------- |
| Xác thực OAuth/token của Anthropic (bao gồm tái sử dụng Claude CLI) | Có             | 1 giờ     |
| Khóa API                                               | Có             | 30 phút   |

Nếu bạn đặt giá trị rõ ràng, OpenClaw sẽ không ghi đè chúng.

## Bật hoặc tắt

Cắt tỉa mặc định tắt đối với các nhà cung cấp không phải Anthropic. Để bật:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Để tắt: đặt `mode: "off"`.

## Cắt tỉa so với Compaction

|            | Cắt tỉa             | Compaction              |
| ---------- | ------------------- | ----------------------- |
| **Gì**     | Cắt bớt kết quả công cụ | Tóm tắt hội thoại    |
| **Đã lưu?** | Không (theo từng yêu cầu) | Có (trong bản ghi) |
| **Phạm vi** | Chỉ kết quả công cụ | Toàn bộ hội thoại       |

Chúng bổ trợ cho nhau -- cắt tỉa giữ cho đầu ra công cụ gọn nhẹ giữa các chu kỳ Compaction.

## Đọc thêm

- [Compaction](/vi/concepts/compaction) -- giảm ngữ cảnh dựa trên tóm tắt
- [Cấu hình Gateway](/vi/gateway/configuration) -- tất cả các núm cấu hình cắt tỉa (`contextPruning.*`)

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
