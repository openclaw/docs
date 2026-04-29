---
read_when:
    - Bạn muốn hiểu về Compaction tự động và /compact
    - Bạn đang gỡ lỗi các phiên dài gặp giới hạn ngữ cảnh
summary: Cách OpenClaw tóm tắt các cuộc trò chuyện dài để duy trì trong giới hạn của mô hình
title: Compaction
x-i18n:
    generated_at: "2026-04-29T22:36:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9beac513a8226a7dd107cdc3a7bfd7550d87e98648004c80487db968c57742d4
    source_path: concepts/compaction.md
    workflow: 16
---

Mỗi model có một cửa sổ ngữ cảnh: số token tối đa mà nó có thể xử lý. Khi một cuộc trò chuyện tiến gần giới hạn đó, OpenClaw **Compaction** các tin nhắn cũ thành một bản tóm tắt để cuộc trò chuyện có thể tiếp tục.

## Cách hoạt động

1. Các lượt trò chuyện cũ hơn được tóm tắt thành một mục gọn.
2. Bản tóm tắt được lưu trong bản ghi phiên.
3. Các tin nhắn gần đây được giữ nguyên vẹn.

Khi OpenClaw chia lịch sử thành các đoạn Compaction, nó giữ các lệnh gọi công cụ của assistant ghép đôi với các mục `toolResult` tương ứng. Nếu điểm chia rơi vào bên trong một khối công cụ, OpenClaw sẽ di chuyển ranh giới để cặp đó vẫn ở cùng nhau và phần đuôi hiện tại chưa được tóm tắt được giữ lại.

Toàn bộ lịch sử cuộc trò chuyện vẫn nằm trên đĩa. Compaction chỉ thay đổi những gì model thấy ở lượt tiếp theo.

## Compaction tự động

Compaction tự động được bật theo mặc định. Nó chạy khi phiên gần đạt giới hạn ngữ cảnh, hoặc khi model trả về lỗi tràn ngữ cảnh (trong trường hợp đó OpenClaw sẽ Compaction và thử lại).

Bạn sẽ thấy:

- `🧹 Auto-compaction complete` trong chế độ chi tiết.
- `/status` hiển thị `🧹 Compactions: <count>`.

<Info>
Trước khi Compaction, OpenClaw tự động nhắc agent lưu các ghi chú quan trọng vào các tệp [bộ nhớ](/vi/concepts/memory). Điều này ngăn mất ngữ cảnh.
</Info>

<AccordionGroup>
  <Accordion title="Các chữ ký tràn được nhận diện">
    OpenClaw phát hiện tràn ngữ cảnh từ các mẫu lỗi provider này:

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

Khi `agents.defaults.compaction.keepRecentTokens` được đặt, Compaction thủ công tôn trọng điểm cắt Pi đó và giữ phần đuôi gần đây trong ngữ cảnh được dựng lại. Nếu không có ngân sách giữ lại rõ ràng, Compaction thủ công hoạt động như một điểm kiểm tra cứng và chỉ tiếp tục từ bản tóm tắt mới.

## Cấu hình

Cấu hình Compaction trong `agents.defaults.compaction` trong `openclaw.json` của bạn. Các nút điều chỉnh phổ biến nhất được liệt kê bên dưới; để xem tham chiếu đầy đủ, hãy xem [Tìm hiểu sâu về quản lý phiên](/vi/reference/session-management-compaction).

### Sử dụng một model khác

Theo mặc định, Compaction sử dụng model chính của agent. Đặt `agents.defaults.compaction.model` để ủy quyền việc tóm tắt cho một model có năng lực hơn hoặc chuyên biệt hơn. Giá trị ghi đè chấp nhận bất kỳ chuỗi `provider/model-id` nào:

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

Điều này cũng hoạt động với các model cục bộ, ví dụ một model Ollama thứ hai dành riêng cho việc tóm tắt:

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

Khi không được đặt, Compaction sử dụng model chính của agent.

### Bảo toàn định danh

Tóm tắt Compaction bảo toàn các định danh mờ theo mặc định (`identifierPolicy: "strict"`). Ghi đè bằng `identifierPolicy: "off"` để tắt, hoặc `identifierPolicy: "custom"` cộng với `identifierInstructions` để có hướng dẫn tùy chỉnh.

### Bộ bảo vệ byte bản ghi đang hoạt động

Khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt, OpenClaw kích hoạt Compaction cục bộ thông thường trước một lượt chạy nếu JSONL đang hoạt động đạt kích thước đó. Điều này hữu ích cho các phiên chạy lâu, nơi quản lý ngữ cảnh phía provider có thể giữ ngữ cảnh model lành mạnh trong khi bản ghi cục bộ tiếp tục tăng. Nó không chia byte JSONL thô; nó yêu cầu pipeline Compaction thông thường tạo một bản tóm tắt ngữ nghĩa.

<Warning>
Bộ bảo vệ byte yêu cầu `truncateAfterCompaction: true`. Nếu không xoay vòng bản ghi, tệp đang hoạt động sẽ không thu nhỏ và bộ bảo vệ vẫn không hoạt động.
</Warning>

### Bản ghi kế nhiệm

Khi `agents.defaults.compaction.truncateAfterCompaction` được bật, OpenClaw không ghi lại bản ghi hiện có tại chỗ. Nó tạo một bản ghi kế nhiệm đang hoạt động mới từ bản tóm tắt Compaction, trạng thái được bảo toàn, và phần đuôi chưa được tóm tắt, sau đó giữ JSONL trước đó làm nguồn điểm kiểm tra đã lưu trữ.
Bản ghi kế nhiệm cũng loại bỏ các lượt người dùng dài trùng lặp chính xác xuất hiện
bên trong một cửa sổ thử lại ngắn, để các cơn bão thử lại của kênh không bị mang vào
bản ghi đang hoạt động tiếp theo sau Compaction.

Các điểm kiểm tra trước Compaction chỉ được giữ lại khi chúng vẫn thấp hơn
giới hạn kích thước điểm kiểm tra của OpenClaw; các bản ghi đang hoạt động quá lớn vẫn được Compaction, nhưng OpenClaw
bỏ qua snapshot debug lớn thay vì nhân đôi mức sử dụng đĩa.

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

### Xả bộ nhớ

Trước Compaction, OpenClaw có thể chạy một lượt **xả bộ nhớ im lặng** để lưu các ghi chú bền vững vào đĩa. Đặt `agents.defaults.compaction.memoryFlush.model` khi lượt dọn dẹp này nên dùng một model cục bộ thay vì model cuộc trò chuyện đang hoạt động:

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

Ghi đè model xả bộ nhớ là chính xác và không kế thừa chuỗi fallback của phiên đang hoạt động. Xem [Bộ nhớ](/vi/concepts/memory) để biết chi tiết và cấu hình.

## Provider Compaction có thể cắm vào

Plugin có thể đăng ký một provider Compaction tùy chỉnh thông qua `registerCompactionProvider()` trên API Plugin. Khi một provider được đăng ký và cấu hình, OpenClaw ủy quyền việc tóm tắt cho provider đó thay vì pipeline LLM tích hợp sẵn.

Để sử dụng một provider đã đăng ký, hãy đặt id của nó trong cấu hình của bạn:

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

Việc đặt `provider` tự động buộc `mode: "safeguard"`. Provider nhận cùng các hướng dẫn Compaction và chính sách bảo toàn định danh như đường dẫn tích hợp sẵn, và OpenClaw vẫn bảo toàn ngữ cảnh hậu tố lượt gần đây và lượt bị chia sau đầu ra của provider.

<Note>
Nếu provider thất bại hoặc trả về kết quả rỗng, OpenClaw fallback sang tóm tắt LLM tích hợp sẵn.
</Note>

## Compaction so với cắt tỉa

|                  | Compaction                    | Cắt tỉa                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Tác dụng** | Tóm tắt cuộc trò chuyện cũ hơn | Cắt bớt kết quả công cụ cũ           |
| **Được lưu?**       | Có (trong bản ghi phiên)   | Không (chỉ trong bộ nhớ, theo từng yêu cầu) |
| **Phạm vi**        | Toàn bộ cuộc trò chuyện           | Chỉ kết quả công cụ                |

[Cắt tỉa phiên](/vi/concepts/session-pruning) là phần bổ trợ nhẹ hơn, cắt bớt đầu ra công cụ mà không tóm tắt.

## Khắc phục sự cố

**Compaction quá thường xuyên?** Cửa sổ ngữ cảnh của model có thể nhỏ, hoặc đầu ra công cụ có thể lớn. Hãy thử bật [cắt tỉa phiên](/vi/concepts/session-pruning).

**Ngữ cảnh có vẻ cũ sau Compaction?** Dùng `/compact Focus on <topic>` để định hướng bản tóm tắt, hoặc bật [xả bộ nhớ](/vi/concepts/memory) để ghi chú được giữ lại.

**Cần một khởi đầu sạch?** `/new` bắt đầu một phiên mới mà không Compaction.

Để cấu hình nâng cao (token dự trữ, bảo toàn định danh, engine ngữ cảnh tùy chỉnh, Compaction phía máy chủ OpenAI), hãy xem [Tìm hiểu sâu về quản lý phiên](/vi/reference/session-management-compaction).

## Liên quan

- [Phiên](/vi/concepts/session): quản lý phiên và vòng đời.
- [Cắt tỉa phiên](/vi/concepts/session-pruning): cắt bớt kết quả công cụ.
- [Ngữ cảnh](/vi/concepts/context): cách ngữ cảnh được dựng cho các lượt agent.
- [Hook](/vi/automation/hooks): hook vòng đời Compaction (`before_compaction`, `after_compaction`).
