---
read_when:
    - Bạn thấy một khóa cấu hình `.experimental` và muốn biết liệu nó có ổn định hay không
    - Bạn muốn thử các tính năng runtime xem trước mà không nhầm lẫn chúng với các mặc định thông thường
    - Bạn muốn một nơi duy nhất để tìm các cờ thử nghiệm hiện được ghi lại
summary: Ý nghĩa của các cờ thử nghiệm trong OpenClaw và những cờ hiện đang được ghi lại
title: Tính năng thử nghiệm
x-i18n:
    generated_at: "2026-06-27T17:22:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

Các tính năng thử nghiệm trong OpenClaw là **các bề mặt xem trước phải bật rõ ràng**. Chúng nằm
sau các cờ rõ ràng vì vẫn cần được kiểm chứng thêm trong thực tế trước khi
xứng đáng trở thành mặc định ổn định hoặc một hợp đồng công khai dài hạn.

Hãy xử lý chúng khác với cấu hình thông thường:

- Giữ chúng **tắt theo mặc định** trừ khi tài liệu liên quan yêu cầu bạn thử một cờ.
- Dự kiến **hình dạng và hành vi sẽ thay đổi** nhanh hơn cấu hình ổn định.
- Ưu tiên đường dẫn ổn định trước khi đã có sẵn.
- Nếu bạn đang triển khai OpenClaw trên diện rộng, hãy thử nghiệm các cờ thử nghiệm trong một
  môi trường nhỏ hơn trước khi đưa chúng vào một đường cơ sở dùng chung.

## Các cờ hiện được ghi tài liệu

| Bề mặt                  | Khóa                                                                                        | Dùng khi                                                                                                                       | Thêm                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime mô hình cục bộ      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Một backend cục bộ nhỏ hơn hoặc nghiêm ngặt hơn bị nghẽn với bề mặt công cụ mặc định đầy đủ của OpenClaw                                                | [Mô hình cục bộ](/vi/gateway/local-models)                                                         |
| Tìm kiếm bộ nhớ            | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Bạn muốn `memory_search` lập chỉ mục bản ghi phiên trước đó và chấp nhận chi phí lưu trữ/lập chỉ mục bổ sung                            | [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#session-memory-search-experimental) |
| Harness Codex            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Bạn muốn app-server Codex native 0.132.0 hoặc mới hơn nhắm tới exec-server do sandbox của OpenClaw hỗ trợ thay vì tắt Code Mode | [Tham chiếu harness Codex](/vi/plugins/codex-harness-reference#sandboxed-native-execution)        |
| Công cụ lập kế hoạch có cấu trúc | `tools.experimental.planTool`                                                              | Bạn muốn công cụ `update_plan` có cấu trúc được hiển thị để theo dõi công việc nhiều bước trong các runtime và UI tương thích                    | [Tham chiếu cấu hình Gateway](/vi/gateway/config-tools#toolsexperimental)                    |

## Chế độ tinh gọn cho mô hình cục bộ

`agents.defaults.experimental.localModelLean: true` là van giảm áp cho các thiết lập mô hình cục bộ yếu hơn. Khi bật, OpenClaw loại bỏ ba công cụ mặc định — `browser`, `cron` và `message` — khỏi bề mặt công cụ của agent trong mọi lượt. Nó cũng mặc định lượt chạy đó dùng các điều khiển Tool Search có cấu trúc khi `tools.toolSearch` không được cấu hình rõ ràng, để các danh mục công cụ Plugin, MCP hoặc client lớn hơn vẫn nằm sau `tool_search`, `tool_describe` và `tool_call` thay vì bị đổ thẳng vào prompt. Các lượt chạy cần gửi trực tiếp bằng `message` vẫn giữ công cụ đó trực tiếp thay vì bật mặc định Tool Search của chế độ tinh gọn. Dùng `agents.list[].experimental.localModelLean` để bật hoặc tắt cùng hành vi cho một agent đã cấu hình.

### Vì sao là ba công cụ này

Ba công cụ này có phần mô tả lớn nhất và nhiều hình dạng tham số nhất trong runtime OpenClaw mặc định. Trên một backend tương thích OpenAI có ngữ cảnh nhỏ hoặc nghiêm ngặt hơn, đó là khác biệt giữa:

- Schema công cụ vừa gọn trong prompt so với lấn át lịch sử hội thoại.
- Mô hình chọn đúng công cụ so với phát ra các lời gọi công cụ sai định dạng vì có quá nhiều schema trông tương tự nhau.
- Adapter Chat Completions nằm trong giới hạn structured-output của máy chủ so với gặp lỗi 400 do kích thước payload lời gọi công cụ.

Việc loại bỏ chúng không âm thầm nối lại dây cho OpenClaw — nó chỉ làm danh sách công cụ trực tiếp ngắn hơn. Mô hình vẫn có `read`, `write`, `edit`, `exec`, `apply_patch`, tìm kiếm/tải web (khi được cấu hình), bộ nhớ và các công cụ phiên/agent. Các danh mục bổ sung vẫn gọi được qua Tool Search trừ khi bạn đặt rõ `tools.toolSearch: false`.

### Khi nào bật

Bật chế độ tinh gọn khi bạn đã chứng minh mô hình có thể nói chuyện với Gateway nhưng các lượt agent đầy đủ hoạt động sai. Chuỗi tín hiệu thường là:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` thành công.
2. Một lượt agent thông thường thất bại với lời gọi công cụ sai định dạng, prompt quá lớn hoặc mô hình bỏ qua công cụ của nó.
3. Bật `localModelLean: true` xóa được lỗi.

### Khi nào để tắt

Nếu backend của bạn xử lý runtime mặc định đầy đủ một cách sạch sẽ, hãy để tắt. Chế độ tinh gọn là giải pháp tình thế, không phải mặc định. Nó tồn tại vì một số stack cục bộ cần bề mặt công cụ nhỏ hơn để hoạt động đúng; các mô hình hosted và máy cục bộ đủ tài nguyên thì không.

Chế độ tinh gọn cũng không thay thế `tools.profile`, `tools.allow`/`tools.deny` hoặc lối thoát `compat.supportsTools: false` của mô hình. Nếu bạn cần một bề mặt công cụ hẹp hơn lâu dài cho một agent cụ thể, hãy ưu tiên các núm điều chỉnh ổn định đó thay vì cờ thử nghiệm.

Nếu bạn đã tinh chỉnh Tool Search toàn cục, OpenClaw sẽ giữ nguyên cấu hình của operator đó. Đặt `tools.toolSearch: false` để không dùng mặc định Tool Search của chế độ tinh gọn.

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

Chỉ cho một agent:

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

Khởi động lại Gateway sau khi thay đổi cờ, rồi xác nhận danh sách công cụ đã rút gọn bằng:

```bash
openclaw status --deep
```

Đầu ra trạng thái sâu liệt kê các công cụ agent đang hoạt động; `browser`, `cron` và `message` sẽ vắng mặt khi chế độ tinh gọn bật, trừ khi chế độ gửi hiện tại buộc trả lời trực tiếp bằng `message`.

## Thử nghiệm không có nghĩa là ẩn

Nếu một tính năng là thử nghiệm, OpenClaw nên nói rõ điều đó trong tài liệu và trong chính
đường dẫn cấu hình. Điều nó **không** nên làm là lén đưa hành vi xem trước vào một
núm mặc định trông ổn định rồi giả vờ đó là bình thường. Đó là cách các bề mặt
cấu hình trở nên lộn xộn.

## Liên quan

- [Tính năng](/vi/concepts/features)
- [Kênh phát hành](/vi/install/development-channels)
