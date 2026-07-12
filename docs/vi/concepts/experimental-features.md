---
read_when:
    - Bạn thấy một khóa cấu hình `.experimental` và muốn biết liệu khóa đó có ổn định hay không
    - Bạn muốn thử các tính năng runtime xem trước mà không nhầm lẫn chúng với các giá trị mặc định thông thường
    - Bạn muốn có một nơi duy nhất để tìm các cờ thử nghiệm hiện được ghi trong tài liệu
summary: Ý nghĩa của các cờ thử nghiệm trong OpenClaw và những cờ hiện được ghi nhận trong tài liệu
title: Các tính năng thử nghiệm
x-i18n:
    generated_at: "2026-07-12T07:51:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Các tính năng thử nghiệm là những bề mặt xem trước phải chủ động bật thông qua các cờ tường minh. Chúng cần được kiểm nghiệm nhiều hơn trong thực tế trước khi có thể trở thành mặc định ổn định hoặc một giao ước dài hạn.

- Mặc định tắt, trừ khi tài liệu hướng dẫn bạn bật một tính năng.
- Cấu trúc và hành vi có thể thay đổi nhanh hơn cấu hình ổn định.
- Ưu tiên lộ trình ổn định nếu đã có sẵn.
- Chỉ triển khai rộng rãi sau khi đã thử nghiệm trước trong một môi trường nhỏ hơn.

## Các cờ hiện có tài liệu

| Bề mặt                  | Khóa                                                                                        | Dùng khi                                                                                                                       | Xem thêm                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Môi trường chạy mô hình cục bộ      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Một backend cục bộ nhỏ hơn hoặc nghiêm ngặt hơn không xử lý được toàn bộ bề mặt công cụ mặc định của OpenClaw                                                | [Mô hình cục bộ](/vi/gateway/local-models)                                                         |
| Tìm kiếm bộ nhớ            | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Bạn muốn `memory_search` lập chỉ mục bản chép lời của các phiên trước và chấp nhận chi phí lưu trữ/lập chỉ mục bổ sung                            | [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#session-memory-search-experimental) |
| Bộ khung Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Bạn muốn app-server Codex gốc phiên bản 0.132.0 trở lên nhắm đến exec-server được hỗ trợ bởi sandbox OpenClaw thay vì vô hiệu hóa Chế độ mã | [Tham chiếu bộ khung Codex](/vi/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Công cụ lập kế hoạch có cấu trúc | `tools.experimental.planTool`                                                              | Bạn muốn hiển thị công cụ `update_plan` có cấu trúc để theo dõi công việc nhiều bước trong các môi trường chạy và giao diện người dùng tương thích                    | [Tham chiếu cấu hình Gateway](/vi/gateway/config-tools#toolsexperimental)                    |

## Chế độ tinh gọn cho mô hình cục bộ

`agents.defaults.experimental.localModelLean: true` loại bỏ các công cụ tùy chọn nặng khỏi bề mặt trực tiếp của tác tử trong mỗi lượt: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` và `pdf`. Các công cụ được cho phép rõ ràng hoặc cần thiết để phân phối vẫn khả dụng, dù Tìm kiếm công cụ có thể đưa chúng vào danh mục thay vì hiển thị trực tiếp. Chế độ tinh gọn cũng mặc định chuyển danh mục plugin/MCP/máy khách sang Tìm kiếm công cụ có cấu trúc (`tool_search`, `tool_describe`, `tool_call`) khi `tools.toolSearch` chưa được đặt. Dùng `agents.list[].experimental.localModelLean` để giới hạn chế độ này cho một tác tử.

Nếu bạn đã tinh chỉnh Tìm kiếm công cụ trên toàn hệ thống, OpenClaw sẽ giữ nguyên cấu hình đó. Đặt `tools.toolSearch: false` để không sử dụng mặc định Tìm kiếm công cụ của chế độ tinh gọn.

Trong chế độ `tools` có cấu trúc, các lượt chạy tinh gọn vẫn giữ `exec` hiển thị trực tiếp bên cạnh các thành phần điều khiển Tìm kiếm công cụ để các mô hình cục bộ được tinh chỉnh cho lập trình vẫn có thể chọn lộ trình shell quen thuộc. Điều này chỉ thay đổi khả năng hiển thị của lược đồ: chính sách công cụ thông thường, cơ chế sandbox và phê duyệt exec vẫn được áp dụng. Các chế độ `code` và `directory` tường minh vẫn giữ hành vi Compaction thông thường.

### Tại sao chọn các công cụ này

Các công cụ này có phần mô tả dài nhất, cấu trúc tham số rộng nhất hoặc khả năng cao nhất khiến một mô hình nhỏ bị phân tâm khỏi luồng lập trình và hội thoại thông thường. Trên một backend tương thích OpenAI có ngữ cảnh nhỏ hoặc nghiêm ngặt hơn, đây là sự khác biệt giữa:

- Lược đồ công cụ vừa với lời nhắc và việc chúng lấn át lịch sử hội thoại.
- Mô hình chọn đúng công cụ và việc phát sinh lệnh gọi công cụ sai định dạng do có quá nhiều lược đồ tương tự.
- Bộ điều hợp Chat Completions duy trì trong giới hạn đầu ra có cấu trúc và lỗi 400 do kích thước tải trọng lệnh gọi công cụ.

Việc loại bỏ chúng chỉ rút ngắn danh sách công cụ trực tiếp. Mô hình vẫn có `read`, `write`, `edit`, `exec`, `apply_patch`, khả năng hiểu hình ảnh, tìm kiếm/truy xuất web (khi được cấu hình), bộ nhớ và các công cụ phiên/tác tử. Các danh mục bổ sung vẫn có thể truy cập thông qua Tìm kiếm công cụ, trừ khi bạn đặt `tools.toolSearch: false`; các quyền cho phép công cụ tường minh có thể đưa một tác tử tinh gọn trở lại quy trình làm việc rút gọn.

### Khi nào nên bật

Bật chế độ tinh gọn sau khi bạn đã xác nhận rằng mô hình có thể giao tiếp với Gateway nhưng các lượt tác tử đầy đủ hoạt động không đúng:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` thành công.
2. Một lượt tác tử thông thường thất bại do lệnh gọi công cụ sai định dạng, lời nhắc quá lớn hoặc mô hình bỏ qua công cụ.
3. Bật `localModelLean: true` khắc phục lỗi.

### Khi nào nên để tắt

Nếu backend của bạn xử lý tốt toàn bộ môi trường chạy mặc định, hãy để tùy chọn này tắt. Đây là giải pháp tạm thời cho các hệ thống cục bộ cần bề mặt công cụ nhỏ hơn, không phải mặc định dành cho mô hình được lưu trữ hoặc hệ thống cục bộ có nhiều tài nguyên.

Chế độ tinh gọn không thay thế `tools.profile`, `tools.allow`/`tools.deny` hoặc cơ chế thoát `compat.supportsTools: false` của mô hình. Để có bề mặt công cụ hẹp hơn lâu dài trên một tác tử cụ thể, hãy ưu tiên các tùy chọn ổn định đó.

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

Chỉ dành cho một tác tử:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Khởi động lại Gateway sau khi thay đổi cờ. Bộ lọc tinh gọn loại bỏ `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` và `pdf`, trừ khi bạn chủ động giữ lại chúng bằng `tools.allow` hoặc `tools.alsoAllow`; Tìm kiếm công cụ vẫn có thể đưa các công cụ được giữ lại vào danh mục thay vì hiển thị trực tiếp.

## Thử nghiệm không có nghĩa là bị ẩn

Một tính năng thử nghiệm phải được nêu rõ là thử nghiệm trong tài liệu và ngay trong đường dẫn cấu hình, thay vì ẩn sau một tùy chọn mặc định có vẻ ổn định.

## Liên quan

- [Tính năng](/vi/concepts/features)
- [Kênh phát hành](/vi/install/development-channels)
