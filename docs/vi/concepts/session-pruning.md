---
read_when:
    - Bạn muốn giảm mức tăng ngữ cảnh do đầu ra của công cụ gây ra
    - Bạn muốn tìm hiểu về cách tối ưu hóa bộ nhớ đệm lời nhắc của Anthropic
summary: Lược bớt các kết quả công cụ cũ để giữ ngữ cảnh gọn nhẹ và tối ưu hiệu quả bộ nhớ đệm
title: Lược bớt phiên làm việc
x-i18n:
    generated_at: "2026-07-12T07:53:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

Việc lược bớt phiên sẽ cắt giảm **các kết quả công cụ cũ** khỏi ngữ cảnh trước mỗi lần gọi LLM. Quá trình này giảm sự phình to của ngữ cảnh do đầu ra công cụ tích lũy (kết quả thực thi, nội dung đọc từ tệp, kết quả tìm kiếm) mà không viết lại văn bản hội thoại thông thường.

<Info>
Việc lược bớt chỉ diễn ra trong bộ nhớ -- không sửa đổi bản ghi phiên trên đĩa. Toàn bộ lịch sử của bạn luôn được bảo toàn.
</Info>

## Tại sao điều này quan trọng

Các phiên dài tích lũy đầu ra công cụ, làm phình cửa sổ ngữ cảnh. Điều này làm tăng chi phí và có thể buộc [Compaction](/vi/concepts/compaction) diễn ra sớm hơn mức cần thiết.

Việc lược bớt đặc biệt hữu ích cho **bộ nhớ đệm lời nhắc của Anthropic**. Sau khi TTL của bộ nhớ đệm hết hạn, yêu cầu tiếp theo sẽ lưu lại toàn bộ lời nhắc vào bộ nhớ đệm. Việc lược bớt làm giảm kích thước dữ liệu ghi vào bộ nhớ đệm, qua đó trực tiếp giảm chi phí.

## Cách hoạt động

Việc lược bớt chạy ở chế độ `cache-ttl`, với điều kiện phải vượt qua cả bước kiểm tra thời gian và bước kiểm tra kích thước ngữ cảnh:

1. Chờ TTL của bộ nhớ đệm hết hạn (mặc định là 5 phút khi được đặt thủ công; xem [Giá trị mặc định thông minh](#smart-defaults) để biết giá trị mặc định tự động cho Anthropic). Trước khi TTL trôi qua, việc lược bớt được bỏ qua hoàn toàn để duy trì khả năng tái sử dụng bộ nhớ đệm lời nhắc cho các lượt gần nhau.
2. Sau khi TTL đã hết, ước tính tổng kích thước ngữ cảnh so với cửa sổ ngữ cảnh của mô hình. Nếu tỷ lệ thấp hơn `softTrimRatio` (mặc định 0,3), bỏ qua việc lược bớt và tiếp tục chạy đồng hồ TTL.
3. **Cắt mềm** các kết quả công cụ quá lớn nằm trên tỷ lệ này: giữ lại phần đầu và phần cuối (mặc định mỗi phần 1.500 ký tự, tổng cộng tối đa 4.000 ký tự), rồi chèn `...` vào giữa.
4. Nếu tỷ lệ vẫn bằng hoặc cao hơn `hardClearRatio` (mặc định 0,5) và còn ít nhất `minPrunableToolChars` (mặc định 50.000) ký tự nội dung công cụ có thể lược bớt, hãy **xóa cứng** các kết quả đó: thay nội dung của chúng bằng một phần giữ chỗ (mặc định `[Nội dung kết quả công cụ cũ đã bị xóa]`).
5. Chỉ đặt lại đồng hồ TTL khi việc lược bớt thực sự thay đổi ngữ cảnh, để các yêu cầu tiếp theo tái sử dụng bộ nhớ đệm mới.

Hai quy tắc an toàn được áp dụng bất kể các ngưỡng: các lượt của trợ lý trong `keepLastAssistants` gần nhất (mặc định 3) không bao giờ bị lược bớt, và không có nội dung nào trước tin nhắn đầu tiên của người dùng trong phiên bị lược bớt (nhằm bảo vệ các lượt đọc khởi tạo như `SOUL.md`/`USER.md`).

Chỉ các tin nhắn `toolResult` mới đủ điều kiện; văn bản hội thoại thông thường được giữ nguyên. Dùng `agents.defaults.contextPruning.tools.{allow,deny}` để giới hạn những tên công cụ có thể được lược bớt.

## Dọn dẹp hình ảnh cũ

OpenClaw cũng tạo một chế độ xem phát lại riêng biệt, có tính lũy đẳng, cho các phiên lưu giữ khối hình ảnh thô hoặc dấu phương tiện nạp lời nhắc trong lịch sử.

- Chế độ này bảo toàn nguyên từng byte của **3 lượt hoàn tất gần nhất** để tiền tố bộ nhớ đệm lời nhắc cho các lượt tiếp theo gần đây duy trì ổn định. Số lượng này bao gồm tất cả các lượt đã hoàn tất, không chỉ những lượt chứa hình ảnh, vì vậy các lượt chỉ có văn bản cũng chiếm chỗ trong cửa sổ.
- Trong chế độ xem phát lại, các khối hình ảnh cũ đã được xử lý từ lịch sử `user` hoặc `toolResult` được thay bằng `[dữ liệu hình ảnh đã bị xóa - mô hình đã xử lý]`.
- Các tham chiếu phương tiện dạng văn bản cũ như `[phương tiện đính kèm: ...]`, `[Hình ảnh: nguồn: ...]` và `media://inbound/...` được thay bằng `[tham chiếu phương tiện đã bị xóa - mô hình đã xử lý]`. Các dấu tệp đính kèm của lượt hiện tại được giữ nguyên để các mô hình thị giác vẫn có thể nạp hình ảnh mới.
- Bản ghi phiên thô không bị viết lại, vì vậy các trình xem lịch sử vẫn có thể hiển thị các mục tin nhắn gốc và hình ảnh của chúng.
- Cơ chế này tách biệt với việc lược bớt theo TTL bộ nhớ đệm thông thường ở trên. Nó tồn tại để ngăn các tải trọng hình ảnh lặp lại hoặc tham chiếu phương tiện cũ làm mất hiệu lực bộ nhớ đệm lời nhắc trong các lượt sau.

## Giá trị mặc định thông minh

Plugin Anthropic đi kèm tự động cấu hình nhịp lược bớt và Heartbeat trong lần đầu tiên phân giải hồ sơ xác thực Anthropic (hoặc Claude CLI), nhưng chỉ đối với những trường bạn chưa đặt rõ ràng:

| Chế độ xác thực                          | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ---------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/token (bao gồm tái sử dụng Claude CLI) | `cache-ttl`       | `1h`                 | `1h`              |
| Khóa API                                 | `cache-ttl`           | `1h`                 | `30m`             |

Nếu bạn tự đặt `agents.defaults.contextPruning.mode` hoặc `agents.defaults.heartbeat.every`, OpenClaw sẽ không ghi đè chúng. Giá trị mặc định tự động này chỉ được áp dụng cho phương thức xác thực thuộc họ Anthropic; các nhà cung cấp khác sẽ có chế độ lược bớt là `off` trừ khi bạn cấu hình chế độ này.

## Bật hoặc tắt

Việc lược bớt mặc định bị tắt đối với các nhà cung cấp không phải Anthropic. Để bật:

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

## Lược bớt so với Compaction

|              | Lược bớt                | Compaction                |
| ------------ | ----------------------- | ------------------------- |
| **Làm gì**   | Cắt giảm kết quả công cụ | Tóm tắt hội thoại         |
| **Được lưu?** | Không (theo từng yêu cầu) | Có (trong bản ghi)      |
| **Phạm vi**  | Chỉ kết quả công cụ     | Toàn bộ hội thoại         |

Chúng bổ trợ cho nhau -- việc lược bớt giúp đầu ra công cụ gọn nhẹ giữa các chu kỳ Compaction.

## Đọc thêm

- [Compaction](/vi/concepts/compaction): giảm ngữ cảnh dựa trên việc tóm tắt
- [Cấu hình Gateway](/vi/gateway/configuration): tất cả tùy chọn cấu hình lược bớt (`contextPruning.*`)

## Liên quan

- [Quản lý phiên](/vi/concepts/session)
- [Công cụ phiên](/vi/concepts/session-tool)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
