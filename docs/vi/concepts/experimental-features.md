---
read_when:
    - Bạn thấy một khóa cấu hình `.experimental` và muốn biết liệu khóa đó có ổn định hay không
    - Bạn muốn thử các tính năng thời gian chạy ở bản xem trước mà không nhầm chúng với các giá trị mặc định thông thường
    - Bạn muốn có một nơi duy nhất để tìm các cờ thử nghiệm hiện được ghi trong tài liệu
summary: Ý nghĩa của các cờ thử nghiệm trong OpenClaw và những cờ hiện đang được ghi trong tài liệu
title: Tính năng thử nghiệm
x-i18n:
    generated_at: "2026-05-02T22:17:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

Các tính năng thử nghiệm trong OpenClaw là **bề mặt xem trước cần bật thủ công**. Chúng nằm sau các cờ rõ ràng vì vẫn cần được kiểm chứng nhiều hơn trong thực tế trước khi xứng đáng trở thành mặc định ổn định hoặc một hợp đồng công khai dài hạn.

Hãy xử lý chúng khác với cấu hình thông thường:

- Giữ chúng **tắt theo mặc định** trừ khi tài liệu liên quan bảo bạn thử một cờ.
- Dự kiến **hình dạng và hành vi sẽ thay đổi** nhanh hơn cấu hình ổn định.
- Ưu tiên đường dẫn ổn định trước khi đã có đường dẫn đó.
- Nếu bạn đang triển khai OpenClaw trên diện rộng, hãy kiểm thử các cờ thử nghiệm trong một môi trường nhỏ hơn trước khi đưa chúng vào đường cơ sở dùng chung.

## Các cờ hiện được ghi trong tài liệu

| Bề mặt                  | Khóa                                                      | Dùng khi                                                                                                             | Xem thêm                                                                                      |
| ----------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime mô hình cục bộ  | `agents.defaults.experimental.localModelLean`             | Một backend cục bộ nhỏ hơn hoặc nghiêm ngặt hơn bị nghẽn với toàn bộ bề mặt công cụ mặc định của OpenClaw            | [Mô hình cục bộ](/vi/gateway/local-models)                                                       |
| Tìm kiếm bộ nhớ         | `agents.defaults.memorySearch.experimental.sessionMemory` | Bạn muốn `memory_search` lập chỉ mục transcript phiên trước đó và chấp nhận chi phí lưu trữ/lập chỉ mục bổ sung      | [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#session-memory-search-experimental)     |
| Công cụ lập kế hoạch có cấu trúc | `tools.experimental.planTool`                             | Bạn muốn công cụ `update_plan` có cấu trúc được cung cấp để theo dõi công việc nhiều bước trong các runtime và UI tương thích | [Tham chiếu cấu hình Gateway](/vi/gateway/config-tools#toolsexperimental)                    |

## Chế độ mô hình cục bộ gọn nhẹ

`agents.defaults.experimental.localModelLean: true` là van xả áp cho các thiết lập mô hình cục bộ yếu hơn. Khi bật, OpenClaw loại bỏ ba công cụ mặc định — `browser`, `cron`, và `message` — khỏi bề mặt công cụ của agent cho mỗi lượt. Không có gì khác thay đổi.

### Vì sao là ba công cụ này

Ba công cụ này có phần mô tả lớn nhất và nhiều dạng tham số nhất trong runtime OpenClaw mặc định. Trên backend tương thích OpenAI có ngữ cảnh nhỏ hoặc nghiêm ngặt hơn, đó là khác biệt giữa:

- Schema công cụ vừa gọn trong prompt so với việc lấn át lịch sử hội thoại.
- Mô hình chọn đúng công cụ so với phát ra lời gọi công cụ sai định dạng vì có quá nhiều schema trông tương tự nhau.
- Bộ chuyển đổi Chat Completions nằm trong giới hạn đầu ra có cấu trúc của máy chủ so với gặp lỗi 400 do kích thước payload lời gọi công cụ.

Việc loại bỏ chúng không âm thầm nối dây lại OpenClaw — nó chỉ làm danh sách công cụ ngắn hơn. Mô hình vẫn có sẵn `read`, `write`, `edit`, `exec`, `apply_patch`, tìm kiếm/tải web (khi được cấu hình), bộ nhớ, và các công cụ phiên/agent.

### Khi nào nên bật

Bật chế độ gọn nhẹ khi bạn đã chứng minh mô hình có thể nói chuyện với Gateway nhưng các lượt agent đầy đủ hoạt động không đúng. Chuỗi tín hiệu điển hình là:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` thành công.
2. Một lượt agent thông thường thất bại với lời gọi công cụ sai định dạng, prompt quá lớn, hoặc mô hình bỏ qua công cụ của nó.
3. Bật `localModelLean: true` xóa lỗi đó.

### Khi nào nên để tắt

Nếu backend của bạn xử lý runtime mặc định đầy đủ một cách sạch sẽ, hãy để cờ này tắt. Chế độ gọn nhẹ là một giải pháp tạm, không phải mặc định. Nó tồn tại vì một số stack cục bộ cần bề mặt công cụ nhỏ hơn để hoạt động đúng; các mô hình được lưu trữ và máy cục bộ có đủ tài nguyên thì không cần.

Chế độ gọn nhẹ cũng không thay thế `tools.profile`, `tools.allow`/`tools.deny`, hoặc lối thoát `compat.supportsTools: false` của mô hình. Nếu bạn cần một bề mặt công cụ hẹp hơn lâu dài cho một agent cụ thể, hãy ưu tiên các núm điều chỉnh ổn định đó thay vì cờ thử nghiệm.

### Bật

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Khởi động lại Gateway sau khi thay đổi cờ, rồi xác nhận danh sách công cụ đã được rút gọn bằng:

```bash
openclaw status --deep
```

Đầu ra trạng thái sâu liệt kê các công cụ agent đang hoạt động; `browser`, `cron`, và `message` sẽ vắng mặt khi chế độ gọn nhẹ được bật.

## Thử nghiệm không có nghĩa là ẩn

Nếu một tính năng là thử nghiệm, OpenClaw nên nói rõ điều đó trong tài liệu và trong chính đường dẫn cấu hình. Điều nó **không** nên làm là lén đưa hành vi xem trước vào một núm mặc định trông có vẻ ổn định và giả vờ rằng đó là bình thường. Đó là cách các bề mặt cấu hình trở nên lộn xộn.

## Liên quan

- [Tính năng](/vi/concepts/features)
- [Kênh phát hành](/vi/install/development-channels)
