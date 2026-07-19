---
read_when:
    - Bạn thấy khóa cấu hình `.experimental` và muốn biết liệu khóa đó có ổn định hay không
    - Bạn muốn dùng thử các tính năng runtime thử nghiệm mà không nhầm lẫn chúng với các giá trị mặc định thông thường
    - Bạn muốn có một nơi duy nhất để tìm các cờ thử nghiệm hiện được ghi trong tài liệu
summary: Ý nghĩa của các cờ thử nghiệm trong OpenClaw và những cờ hiện được ghi trong tài liệu
title: Tính năng thử nghiệm
x-i18n:
    generated_at: "2026-07-19T05:46:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c25e5120b0c602c2d143e54f124b760208a08ddfed3d515f73de2b2fd2640d9d
    source_path: concepts/experimental-features.md
    workflow: 16
---

Các tính năng thử nghiệm là những bề mặt xem trước nằm sau các cờ tường minh. Chúng cần được kiểm nghiệm thêm trong thực tế trước khi có cấu hình mặc định ổn định hoặc hợp đồng dài hạn.

- Tắt theo mặc định, trừ khi tài liệu mô tả một quy tắc thiết lập tự động có phạm vi hẹp.
- Hình dạng và hành vi có thể thay đổi nhanh hơn cấu hình ổn định.
- Ưu tiên một đường dẫn ổn định nếu đã có.
- Chỉ triển khai rộng rãi sau khi đã thử nghiệm trong một môi trường nhỏ hơn.

## Các cờ hiện được ghi trong tài liệu

| Bề mặt                  | Khóa                                                                                        | Sử dụng khi                                                                                                                       | Thông tin thêm                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime mô hình cục bộ      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Một backend cục bộ nhỏ hơn hoặc nghiêm ngặt hơn không xử lý được toàn bộ bề mặt công cụ mặc định của OpenClaw                                                | [Mô hình cục bộ](/vi/gateway/local-models)                                                         |
| Tìm kiếm bộ nhớ            | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Bạn muốn `memory_search` lập chỉ mục bản chép lời của các phiên trước và chấp nhận chi phí lưu trữ/lập chỉ mục bổ sung                            | [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#session-memory-search-experimental) |
| Bộ khung Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Bạn muốn app-server Codex gốc phiên bản 0.132.0 trở lên nhắm đến exec-server dựa trên sandbox của OpenClaw thay vì vô hiệu hóa Chế độ mã | [Tham chiếu bộ khung Codex](/vi/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Công cụ lập kế hoạch có cấu trúc | `tools.experimental.planTool`                                                              | Bạn muốn công cụ `update_plan` có cấu trúc được cung cấp để theo dõi công việc nhiều bước trong các runtime và giao diện người dùng tương thích                    | [Tham chiếu cấu hình Gateway](/vi/gateway/config-tools#toolsexperimental)                    |
| Chế độ mã                | `tools.codeMode.enabled`                                                                   | Bạn muốn truy cập gọn nhẹ, được điều phối bằng mã, vào danh mục công cụ OpenClaw ẩn                                                       | [Chế độ mã](/vi/tools/code-mode)                                                                 |

## Phòng thí nghiệm của giao diện điều khiển

Mở **Settings → Agents & Tools → Labs** để quản lý các thử nghiệm có công tắc
trong giao diện điều khiển. Việc bật hoặc tắt một phòng thí nghiệm sẽ vá ngay
cấu hình Gateway chuẩn; trang chỉ hiển thị gợi ý khởi động lại khi một tính năng
yêu cầu việc đó.

Chế độ mã hiện là mục Labs duy nhất đã được phát hành. Swarm chưa được cung cấp:
hình dạng cấu hình của nó chưa được phát hành, vì vậy giao diện điều khiển không ghi một
khóa mang tính phỏng đoán có thể làm mất hiệu lực cấu hình của người vận hành.

## Chế độ tinh gọn cho mô hình cục bộ

`agents.defaults.experimental.localModelLean: true` loại bỏ các công cụ tùy chọn nặng khỏi bề mặt trực tiếp của tác nhân trong mỗi lượt: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` và `pdf`. Các công cụ được cho phép tường minh hoặc cần thiết cho việc phân phối vẫn khả dụng, mặc dù Tìm kiếm công cụ có thể đưa chúng vào danh mục thay vì cung cấp trực tiếp. Chế độ tinh gọn cũng mặc định đưa các danh mục plugin/MCP/máy khách vào Tìm kiếm công cụ có cấu trúc (`tool_search`, `tool_describe`, `tool_call`) khi `tools.toolSearch` chưa được đặt. Sử dụng `agents.list[].experimental.localModelLean` để giới hạn phạm vi này cho một tác nhân.

Trong quá trình hướng dẫn thiết lập ban đầu, một tuyến suy luận `ollama` hoặc `lmstudio` đã được xác minh sẽ tự động đặt `agents.defaults.experimental.localModelLean: true` khi giá trị đó chưa có. OpenClaw ghi nhận rằng thiết lập này đến từ quá trình hướng dẫn thiết lập ban đầu, vì vậy một tuyến không cục bộ được xác minh sau đó chỉ gỡ bỏ thiết lập tự động. Một `true` hoặc `false` được cấu hình tường minh sẽ được giữ nguyên. Các nhà cung cấp tự lưu trữ và tương thích với OpenAI khác không được suy luận từ tên mô hình hoặc URL.

Nếu bạn đã tinh chỉnh Tìm kiếm công cụ trên toàn hệ thống, OpenClaw sẽ không thay đổi cấu hình đó. Đặt `tools.toolSearch: false` để không sử dụng mặc định Tìm kiếm công cụ của chế độ tinh gọn.

Trong chế độ `tools` có cấu trúc, các lượt chạy tinh gọn giữ `exec` hiển thị trực tiếp bên cạnh các thành phần điều khiển Tìm kiếm công cụ để các mô hình cục bộ được tinh chỉnh cho lập trình vẫn có thể chọn đường dẫn shell quen thuộc. Điều này chỉ thay đổi khả năng hiển thị của lược đồ: chính sách công cụ thông thường, sandbox và phê duyệt thực thi vẫn được áp dụng. Các chế độ `code` và `directory` tường minh vẫn giữ hành vi Compaction thông thường.

### Tại sao chọn các công cụ này

Các công cụ này có phần mô tả dài nhất, hình dạng tham số rộng nhất hoặc khả năng cao nhất khiến một mô hình nhỏ bị phân tâm khỏi luồng lập trình và hội thoại thông thường. Trên một backend tương thích với OpenAI có ngữ cảnh nhỏ hoặc nghiêm ngặt hơn, đó là sự khác biệt giữa:

- Lược đồ công cụ vừa với prompt thay vì lấn át lịch sử hội thoại.
- Mô hình chọn đúng công cụ thay vì phát ra các lệnh gọi công cụ sai định dạng do có quá nhiều lược đồ tương tự.
- Bộ điều hợp Chat Completions duy trì trong giới hạn đầu ra có cấu trúc thay vì gặp lỗi 400 do kích thước tải trọng lệnh gọi công cụ.

Việc loại bỏ chúng chỉ rút ngắn danh sách công cụ trực tiếp. Mô hình vẫn có `read`, `write`, `edit`, `exec`, `apply_patch`, khả năng hiểu hình ảnh, tìm nạp/tìm kiếm web (khi được cấu hình), bộ nhớ và các công cụ phiên/tác nhân. Các danh mục bổ sung vẫn có thể truy cập qua Tìm kiếm công cụ trừ khi bạn đặt `tools.toolSearch: false`; việc cho phép công cụ tường minh có thể đưa một tác nhân tinh gọn trở lại quy trình làm việc đã được tinh giản.

### Khi nào nên bật

Bật chế độ tinh gọn sau khi bạn đã chứng minh rằng mô hình có thể giao tiếp với Gateway nhưng các lượt chạy đầy đủ của tác nhân hoạt động sai:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` thành công.
2. Một lượt tác nhân thông thường thất bại do lệnh gọi công cụ sai định dạng, prompt quá lớn hoặc mô hình bỏ qua các công cụ của mình.
3. Việc chuyển đổi `localModelLean: true` khắc phục lỗi.

### Khi nào nên để tắt

Nếu backend của bạn xử lý sạch sẽ toàn bộ runtime mặc định, hãy để tính năng này tắt. Đây là giải pháp tạm thời cho các ngăn xếp cục bộ cần bề mặt công cụ nhỏ hơn, không phải cấu hình mặc định cho các mô hình được lưu trữ hoặc hệ thống cục bộ có nhiều tài nguyên.

Chế độ tinh gọn không thay thế `tools.profile`, `tools.allow`/`tools.deny` hoặc lối thoát `compat.supportsTools: false` của mô hình. Để có bề mặt công cụ hẹp hơn lâu dài trên một tác nhân cụ thể, hãy ưu tiên các nút điều chỉnh ổn định đó.

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

Chỉ dành cho một tác nhân:

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

Khởi động lại Gateway sau khi thay đổi cờ. Bộ lọc tinh gọn loại bỏ `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` và `pdf`, trừ khi bạn giữ lại chúng một cách tường minh bằng `tools.allow` hoặc `tools.alsoAllow`; Tìm kiếm công cụ vẫn có thể đưa các công cụ được giữ lại vào danh mục thay vì cung cấp chúng trực tiếp.

## Thử nghiệm không có nghĩa là bị ẩn

Một tính năng thử nghiệm phải được nêu rõ như vậy trong tài liệu và ngay trong đường dẫn cấu hình, thay vì ẩn sau một nút điều chỉnh mặc định trông có vẻ ổn định.

## Liên quan

- [Tính năng](/vi/concepts/features)
- [Kênh phát hành](/vi/install/development-channels)
