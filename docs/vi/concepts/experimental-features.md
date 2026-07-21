---
read_when:
    - Bạn thấy khóa cấu hình `.experimental` và muốn biết liệu khóa đó có ổn định hay không
    - Bạn muốn thử các tính năng runtime ở bản xem trước mà không nhầm lẫn chúng với các giá trị mặc định thông thường
    - Bạn muốn có một nơi duy nhất để tìm các cờ thử nghiệm hiện đang được ghi lại trong tài liệu
summary: Ý nghĩa của các cờ thử nghiệm trong OpenClaw và những cờ hiện được ghi trong tài liệu
title: Các tính năng thử nghiệm
x-i18n:
    generated_at: "2026-07-21T13:40:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ba3a3e13b308c572b02076e131143845d4ad4c2a28847aabec1496012e29a6f7
    source_path: concepts/experimental-features.md
    workflow: 16
---

Các tính năng thử nghiệm là những bề mặt xem trước nằm sau các cờ tường minh. Chúng cần được kiểm chứng thêm trong thực tế trước khi có giá trị mặc định ổn định hoặc hợp đồng dài hạn.

- Tắt theo mặc định, trừ khi tài liệu mô tả một quy tắc thiết lập tự động có phạm vi hẹp.
- Cấu trúc và hành vi có thể thay đổi nhanh hơn cấu hình ổn định.
- Ưu tiên lộ trình ổn định nếu đã có.
- Chỉ triển khai rộng rãi sau khi thử nghiệm trước trong một môi trường nhỏ hơn.

## Các cờ hiện được ghi trong tài liệu

| Bề mặt                  | Khóa                                                                                        | Sử dụng khi                                                                                                                       | Xem thêm                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime mô hình cục bộ      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Backend cục bộ nhỏ hơn hoặc nghiêm ngặt hơn không xử lý được toàn bộ bề mặt công cụ mặc định của OpenClaw                                                | [Mô hình cục bộ](/vi/gateway/local-models)                                                         |
| Tìm kiếm bộ nhớ            | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Bạn muốn `memory_search` lập chỉ mục bản ghi các phiên trước và chấp nhận thêm chi phí lưu trữ/lập chỉ mục                            | [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#session-memory-search-experimental) |
| Bộ khung Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Bạn muốn Codex app-server 0.132.0 trở lên ở chế độ gốc nhắm đến exec-server được hỗ trợ bởi sandbox của OpenClaw thay vì tắt Code Mode | [Tham chiếu bộ khung Codex](/vi/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Công cụ lập kế hoạch có cấu trúc | `tools.experimental.planTool`                                                              | Bạn muốn công cụ `update_plan` có cấu trúc được cung cấp để theo dõi công việc nhiều bước trong các runtime và giao diện người dùng tương thích                    | [Tham chiếu cấu hình Gateway](/vi/gateway/config-tools#toolsexperimental)                    |
| Code Mode                | `tools.codeMode.enabled`                                                                   | Bạn muốn truy cập nhỏ gọn, được điều phối bằng mã vào danh mục công cụ OpenClaw ẩn                                                       | [Code Mode](/vi/tools/code-mode)                                                                 |
| Swarm                    | `tools.swarm.enabled`                                                                      | Bạn muốn các tập lệnh Code Mode điều phối song song những nhóm tác tử con có giới hạn                                                | [Swarm](/vi/tools/swarm)                                                                         |

## Labs trong Control UI

Mở **Settings → Agents & Tools → Labs** để quản lý các thử nghiệm có công tắc
trong Control UI. Việc bật hoặc tắt một lab sẽ sửa ngay cấu hình Gateway
chuẩn; trang chỉ hiển thị gợi ý khởi động lại khi một tính năng yêu cầu
điều đó.

Code Mode và Swarm hiện là các mục Labs đã được phát hành. Cả hai công tắc
đều ghi vào các khóa cấu hình hiện có đã được xác thực và thường có hiệu lực với các lần chạy tác tử
sau này mà không cần khởi động lại Gateway.

## Chế độ tinh gọn cho mô hình cục bộ

`agents.defaults.experimental.localModelLean: true` loại bỏ các công cụ tùy chọn nặng khỏi bề mặt trực tiếp của tác tử ở mỗi lượt: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` và `pdf`. Các công cụ được cho phép rõ ràng hoặc cần thiết để phân phối vẫn khả dụng, dù Tool Search có thể lập danh mục chúng thay vì cung cấp trực tiếp. Chế độ tinh gọn cũng mặc định đưa các danh mục plugin/MCP/máy khách vào Tool Search có cấu trúc (`tool_search`, `tool_describe`, `tool_call`) khi `tools.toolSearch` chưa được đặt. Sử dụng `agents.list[].experimental.localModelLean` để giới hạn chế độ này cho một tác tử.

Trong quá trình hướng dẫn thiết lập ban đầu, một tuyến suy luận `ollama` hoặc `lmstudio` đã được xác minh sẽ tự động đặt `agents.defaults.experimental.localModelLean: true` khi giá trị đó chưa tồn tại. OpenClaw ghi nhận rằng thiết lập này đến từ quá trình hướng dẫn thiết lập ban đầu, vì vậy một tuyến không cục bộ được xác minh sau đó chỉ gỡ thiết lập tự động. Giá trị `true` hoặc `false` được cấu hình rõ ràng sẽ được giữ nguyên. Các nhà cung cấp tự lưu trữ và tương thích với OpenAI khác không được suy ra từ tên mô hình hoặc URL.

Nếu bạn đã tinh chỉnh Tool Search trên toàn hệ thống, OpenClaw sẽ giữ nguyên cấu hình đó. Đặt `tools.toolSearch: false` để không dùng giá trị mặc định của Tool Search trong chế độ tinh gọn.

Trong chế độ `tools` có cấu trúc, các lần chạy tinh gọn vẫn giữ `exec` hiển thị trực tiếp bên cạnh các điều khiển Tool Search để các mô hình cục bộ được tinh chỉnh cho việc lập trình vẫn có thể chọn lộ trình shell quen thuộc. Điều này chỉ thay đổi khả năng hiển thị của schema: chính sách công cụ, sandbox và phê duyệt thực thi thông thường vẫn được áp dụng. Các chế độ `code` và `directory` tường minh giữ nguyên hành vi Compaction thông thường.

### Tại sao chọn các công cụ này

Các công cụ này có phần mô tả dài nhất, cấu trúc tham số rộng nhất hoặc khả năng cao nhất khiến một mô hình nhỏ sao nhãng khỏi lộ trình lập trình và hội thoại thông thường. Trên backend có ngữ cảnh nhỏ hơn hoặc tương thích với OpenAI nghiêm ngặt hơn, đó là sự khác biệt giữa:

- Schema công cụ vừa với lời nhắc so với lấn át lịch sử hội thoại.
- Mô hình chọn đúng công cụ so với tạo ra các lệnh gọi công cụ sai định dạng do có quá nhiều schema tương tự.
- Bộ điều hợp Chat Completions nằm trong giới hạn đầu ra có cấu trúc so với lỗi 400 vì kích thước tải trọng lệnh gọi công cụ.

Việc loại bỏ chúng chỉ rút ngắn danh sách công cụ trực tiếp. Mô hình vẫn có `read`, `write`, `edit`, `exec`, `apply_patch`, khả năng hiểu hình ảnh, tìm kiếm/truy xuất web (khi được cấu hình), bộ nhớ và các công cụ phiên/tác tử. Các danh mục bổ sung vẫn có thể truy cập qua Tool Search, trừ khi bạn đặt `tools.toolSearch: false`; việc cho phép công cụ một cách tường minh có thể đưa một tác tử tinh gọn trở lại quy trình làm việc đã bị cắt giảm.

### Khi nào nên bật

Bật chế độ tinh gọn sau khi bạn đã chứng minh rằng mô hình có thể giao tiếp với Gateway nhưng các lượt tác tử đầy đủ hoạt động không đúng:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` thành công.
2. Một lượt tác tử thông thường thất bại do lệnh gọi công cụ sai định dạng, lời nhắc quá lớn hoặc mô hình bỏ qua các công cụ.
3. Việc chuyển đổi `localModelLean: true` khắc phục lỗi.

### Khi nào nên để tắt

Nếu backend của bạn xử lý tốt toàn bộ runtime mặc định, hãy để chế độ này tắt. Đây là giải pháp tạm thời dành cho các stack cục bộ cần bề mặt công cụ nhỏ hơn, không phải giá trị mặc định cho các mô hình được lưu trữ hoặc các hệ thống cục bộ có nhiều tài nguyên.

Chế độ tinh gọn không thay thế `tools.profile`, `tools.allow`/`tools.deny` hoặc lối thoát `compat.supportsTools: false` của mô hình. Đối với bề mặt công cụ hẹp hơn vĩnh viễn trên một tác tử cụ thể, hãy ưu tiên các tùy chọn ổn định đó.

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

Khởi động lại Gateway sau khi thay đổi cờ. Bộ lọc tinh gọn sẽ loại bỏ `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` và `pdf`, trừ khi bạn giữ lại chúng một cách tường minh bằng `tools.allow` hoặc `tools.alsoAllow`; Tool Search vẫn có thể lập danh mục các công cụ được giữ lại thay vì cung cấp chúng trực tiếp.

## Thử nghiệm không có nghĩa là bị ẩn

Một tính năng thử nghiệm phải được nêu rõ như vậy trong tài liệu và trong chính đường dẫn cấu hình, thay vì ẩn sau một tùy chọn mặc định trông có vẻ ổn định.

## Liên quan

- [Tính năng](/vi/concepts/features)
- [Kênh phát hành](/vi/install/development-channels)
