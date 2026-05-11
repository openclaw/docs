---
read_when:
    - Bạn muốn tìm hiểu về Compaction tự động và /compact
    - Bạn đang gỡ lỗi các phiên dài đạt đến giới hạn ngữ cảnh
summary: Cách OpenClaw tóm tắt các cuộc trò chuyện dài để nằm trong giới hạn của mô hình
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:27:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

Mỗi mô hình có một cửa sổ ngữ cảnh: số token tối đa mà nó có thể xử lý. Khi cuộc trò chuyện tiến gần đến giới hạn đó, OpenClaw **Compaction** các tin nhắn cũ hơn thành một bản tóm tắt để cuộc trò chuyện có thể tiếp tục.

## Cách hoạt động

1. Các lượt trò chuyện cũ hơn được tóm tắt thành một mục nhỏ gọn.
2. Bản tóm tắt được lưu trong bản ghi phiên.
3. Các tin nhắn gần đây được giữ nguyên.

Khi OpenClaw chia lịch sử thành các đoạn Compaction, nó giữ các lệnh gọi công cụ của trợ lý đi kèm với các mục `toolResult` tương ứng. Nếu điểm chia nằm bên trong một khối công cụ, OpenClaw sẽ di chuyển ranh giới để cặp này vẫn ở cùng nhau và phần đuôi hiện tại chưa được tóm tắt được bảo toàn.

Toàn bộ lịch sử cuộc trò chuyện vẫn nằm trên đĩa. Compaction chỉ thay đổi những gì mô hình thấy ở lượt tiếp theo.

## Tự động Compaction

Tự động Compaction được bật theo mặc định. Nó chạy khi phiên gần đạt giới hạn ngữ cảnh, hoặc khi mô hình trả về lỗi tràn ngữ cảnh (trong trường hợp đó OpenClaw Compaction và thử lại).

Bạn sẽ thấy:

- `embedded run auto-compaction start` / `complete` trong nhật ký Gateway thông thường.
- `🧹 Auto-compaction complete` trong chế độ chi tiết.
- `/status` hiển thị `🧹 Compactions: <count>`.

<Info>
Trước khi Compaction, OpenClaw tự động nhắc tác nhân lưu các ghi chú quan trọng vào các tệp [bộ nhớ](/vi/concepts/memory). Điều này ngăn mất ngữ cảnh.
</Info>

<AccordionGroup>
  <Accordion title="Chữ ký tràn được nhận diện">
    OpenClaw phát hiện tràn ngữ cảnh từ các mẫu lỗi nhà cung cấp sau:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction thủ công

Gõ `/compact` trong bất kỳ cuộc trò chuyện nào để buộc Compaction. Thêm hướng dẫn để định hướng bản tóm tắt:

```
/compact Focus on the API design decisions
```

Khi `agents.defaults.compaction.keepRecentTokens` được đặt, Compaction thủ công sẽ tôn trọng điểm cắt Pi đó và giữ phần đuôi gần đây trong ngữ cảnh được xây dựng lại. Nếu không có ngân sách giữ lại rõ ràng, Compaction thủ công hoạt động như một điểm kiểm tra cứng và tiếp tục chỉ từ bản tóm tắt mới.

## Cấu hình

Cấu hình Compaction trong `agents.defaults.compaction` trong `openclaw.json` của bạn. Các núm điều chỉnh phổ biến nhất được liệt kê bên dưới; để xem tham chiếu đầy đủ, xem [Phân tích sâu về quản lý phiên](/vi/reference/session-management-compaction).

### Sử dụng một mô hình khác

Theo mặc định, Compaction sử dụng mô hình chính của tác nhân. Đặt `agents.defaults.compaction.model` để ủy quyền việc tóm tắt cho một mô hình có năng lực hơn hoặc chuyên biệt hơn. Ghi đè chấp nhận bất kỳ chuỗi `provider/model-id` nào:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Điều này cũng hoạt động với các mô hình cục bộ, ví dụ một mô hình Ollama thứ hai dành riêng cho việc tóm tắt:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Khi chưa đặt, Compaction bắt đầu bằng mô hình phiên đang hoạt động. Nếu việc tóm tắt thất bại với lỗi nhà cung cấp đủ điều kiện dự phòng mô hình, OpenClaw thử lại lần Compaction đó qua chuỗi dự phòng mô hình hiện có của phiên. Lựa chọn dự phòng là tạm thời và không được ghi trở lại trạng thái phiên. Ghi đè `agents.defaults.compaction.model` rõ ràng vẫn chính xác và không kế thừa chuỗi dự phòng của phiên.

### Bảo toàn định danh

Việc tóm tắt Compaction bảo toàn các định danh mờ theo mặc định (`identifierPolicy: "strict"`). Ghi đè bằng `identifierPolicy: "off"` để tắt, hoặc `identifierPolicy: "custom"` cộng với `identifierInstructions` để có hướng dẫn tùy chỉnh.

### Bộ bảo vệ byte bản ghi đang hoạt động

Khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt, OpenClaw kích hoạt Compaction cục bộ thông thường trước một lần chạy nếu JSONL đang hoạt động đạt kích thước đó. Điều này hữu ích cho các phiên chạy lâu, nơi quản lý ngữ cảnh phía nhà cung cấp có thể giữ ngữ cảnh mô hình khỏe mạnh trong khi bản ghi cục bộ tiếp tục lớn lên. Nó không chia nhỏ byte JSONL thô; nó yêu cầu pipeline Compaction thông thường tạo một bản tóm tắt ngữ nghĩa.

<Warning>
Bộ bảo vệ byte yêu cầu `truncateAfterCompaction: true`. Nếu không xoay vòng bản ghi, tệp đang hoạt động sẽ không thu nhỏ và bộ bảo vệ vẫn không hoạt động.
</Warning>

### Bản ghi kế nhiệm

Khi `agents.defaults.compaction.truncateAfterCompaction` được bật, OpenClaw không ghi lại bản ghi hiện có tại chỗ. Nó tạo một bản ghi kế nhiệm đang hoạt động mới từ bản tóm tắt Compaction, trạng thái được bảo toàn và phần đuôi chưa được tóm tắt, sau đó giữ JSONL trước đó làm nguồn điểm kiểm tra đã lưu trữ.
Các bản ghi kế nhiệm cũng loại bỏ các lượt người dùng dài trùng lặp chính xác xuất hiện
trong một cửa sổ thử lại ngắn, để các cơn bão thử lại kênh không được mang sang
bản ghi đang hoạt động tiếp theo sau Compaction.

Các điểm kiểm tra trước Compaction chỉ được giữ lại khi chúng vẫn nằm dưới
giới hạn kích thước điểm kiểm tra của OpenClaw; các bản ghi đang hoạt động quá lớn vẫn được Compaction, nhưng OpenClaw
bỏ qua ảnh chụp nhanh gỡ lỗi lớn thay vì nhân đôi dung lượng đĩa sử dụng.

### Thông báo Compaction

Theo mặc định, Compaction chạy im lặng. Đặt `notifyUser` để hiển thị các thông báo trạng thái ngắn khi Compaction bắt đầu và hoàn tất:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### Ghi bộ nhớ

Trước Compaction, OpenClaw có thể chạy một lượt **ghi bộ nhớ im lặng** để lưu các ghi chú bền vững vào đĩa. Đặt `agents.defaults.compaction.memoryFlush.model` khi lượt dọn dẹp này nên dùng một mô hình cục bộ thay vì mô hình cuộc trò chuyện đang hoạt động:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

Ghi đè mô hình ghi bộ nhớ là chính xác và không kế thừa chuỗi dự phòng của phiên đang hoạt động. Xem [Bộ nhớ](/vi/concepts/memory) để biết chi tiết và cấu hình.

## Nhà cung cấp Compaction có thể cắm thêm

Plugin có thể đăng ký một nhà cung cấp Compaction tùy chỉnh thông qua `registerCompactionProvider()` trên API plugin. Khi một nhà cung cấp được đăng ký và cấu hình, OpenClaw ủy quyền việc tóm tắt cho nhà cung cấp đó thay vì pipeline LLM tích hợp.

Để sử dụng một nhà cung cấp đã đăng ký, đặt id của nó trong cấu hình của bạn:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Đặt `provider` sẽ tự động buộc `mode: "safeguard"`. Nhà cung cấp nhận cùng các hướng dẫn Compaction và chính sách bảo toàn định danh như đường dẫn tích hợp, và OpenClaw vẫn bảo toàn ngữ cảnh hậu tố lượt gần đây và lượt bị chia sau đầu ra của nhà cung cấp.

<Note>
Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw quay lại tóm tắt LLM tích hợp.
</Note>

## Compaction so với cắt tỉa

|                  | Compaction                    | Cắt tỉa                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Nó làm gì** | Tóm tắt cuộc trò chuyện cũ hơn | Cắt bớt kết quả công cụ cũ           |
| **Đã lưu?**       | Có (trong bản ghi phiên)   | Không (chỉ trong bộ nhớ, theo từng yêu cầu) |
| **Phạm vi**        | Toàn bộ cuộc trò chuyện           | Chỉ kết quả công cụ                |

[Cắt tỉa phiên](/vi/concepts/session-pruning) là một phần bổ trợ nhẹ hơn, cắt bớt đầu ra công cụ mà không tóm tắt.

## Khắc phục sự cố

**Compaction quá thường xuyên?** Cửa sổ ngữ cảnh của mô hình có thể nhỏ, hoặc đầu ra công cụ có thể lớn. Hãy thử bật [cắt tỉa phiên](/vi/concepts/session-pruning).

**Ngữ cảnh có vẻ cũ sau Compaction?** Dùng `/compact Focus on <topic>` để định hướng bản tóm tắt, hoặc bật [ghi bộ nhớ](/vi/concepts/memory) để các ghi chú được giữ lại.

**Cần bắt đầu sạch?** `/new` bắt đầu một phiên mới mà không Compaction.

Để cấu hình nâng cao (token dự trữ, bảo toàn định danh, công cụ ngữ cảnh tùy chỉnh, Compaction phía máy chủ OpenAI), xem [Phân tích sâu về quản lý phiên](/vi/reference/session-management-compaction).

## Liên quan

- [Phiên](/vi/concepts/session): quản lý phiên và vòng đời.
- [Cắt tỉa phiên](/vi/concepts/session-pruning): cắt bớt kết quả công cụ.
- [Ngữ cảnh](/vi/concepts/context): cách ngữ cảnh được xây dựng cho các lượt tác nhân.
- [Hook](/vi/automation/hooks): hook vòng đời Compaction (`before_compaction`, `after_compaction`).
