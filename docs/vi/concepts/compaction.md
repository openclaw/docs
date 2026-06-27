---
read_when:
    - Bạn muốn tìm hiểu về Compaction tự động và /compact
    - Bạn đang gỡ lỗi các phiên dài chạm tới giới hạn ngữ cảnh
summary: Cách OpenClaw tóm tắt các cuộc trò chuyện dài để duy trì trong giới hạn của mô hình
title: Compaction
x-i18n:
    generated_at: "2026-06-27T17:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 71c1665055574622926a4f13ee82b97f1c45e679a895db78da983919c0a5458f
    source_path: concepts/compaction.md
    workflow: 16
---

Mỗi mô hình có một cửa sổ ngữ cảnh: số lượng token tối đa mà nó có thể xử lý. Khi một cuộc trò chuyện tiến gần đến giới hạn đó, OpenClaw **compacts** các tin nhắn cũ thành một bản tóm tắt để cuộc trò chuyện có thể tiếp tục.

## Cách hoạt động

1. Các lượt trò chuyện cũ hơn được tóm tắt thành một mục nhỏ gọn.
2. Bản tóm tắt được lưu trong bản ghi phiên.
3. Các tin nhắn gần đây được giữ nguyên.

Khi OpenClaw chia lịch sử thành các đoạn Compaction, nó giữ các lệnh gọi công cụ của trợ lý đi cùng với các mục `toolResult` tương ứng. Nếu điểm chia nằm bên trong một khối công cụ, OpenClaw sẽ dịch chuyển ranh giới để cặp này ở cùng nhau và phần đuôi hiện tại chưa được tóm tắt được bảo toàn.

Toàn bộ lịch sử cuộc trò chuyện vẫn nằm trên đĩa. Compaction chỉ thay đổi những gì mô hình nhìn thấy ở lượt tiếp theo.

## Tự động Compaction

Tự động Compaction được bật theo mặc định. Nó chạy khi phiên gần đạt giới hạn ngữ cảnh, hoặc khi mô hình trả về lỗi tràn ngữ cảnh (trong trường hợp đó OpenClaw thực hiện Compaction rồi thử lại).

Bạn sẽ thấy:

- `embedded run auto-compaction start` / `complete` trong nhật ký Gateway thông thường.
- `🧹 Auto-compaction complete` ở chế độ chi tiết.
- `/status` hiển thị `🧹 Compactions: <count>`.

<Info>
Trước khi thực hiện Compaction, OpenClaw tự động nhắc tác nhân lưu các ghi chú quan trọng vào tệp [bộ nhớ](/vi/concepts/memory). Điều này ngăn mất ngữ cảnh.
</Info>

<AccordionGroup>
  <Accordion title="Các dấu hiệu tràn được nhận diện">
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

Gõ `/compact` trong bất kỳ cuộc trò chuyện nào để buộc thực hiện Compaction. Thêm chỉ dẫn để định hướng bản tóm tắt:

```
/compact Focus on the API design decisions
```

Khi `agents.defaults.compaction.keepRecentTokens` được đặt, Compaction thủ công tôn trọng điểm cắt đó của OpenClaw và giữ phần đuôi gần đây trong ngữ cảnh được dựng lại. Nếu không có ngân sách giữ lại rõ ràng, Compaction thủ công hoạt động như một điểm kiểm tra cứng và chỉ tiếp tục từ bản tóm tắt mới.

## Cấu hình

Cấu hình Compaction trong `agents.defaults.compaction` của `openclaw.json`. Các nút điều chỉnh phổ biến nhất được liệt kê bên dưới; để xem tham chiếu đầy đủ, hãy xem [Phân tích sâu về quản lý phiên](/vi/reference/session-management-compaction).

### Dùng một mô hình khác

Theo mặc định, Compaction dùng mô hình chính của tác nhân. Đặt `agents.defaults.compaction.model` để ủy quyền việc tóm tắt cho một mô hình mạnh hơn hoặc chuyên biệt hơn. Ghi đè chấp nhận chuỗi `provider/model-id` hoặc một bí danh trần được cấu hình trong `agents.defaults.models`:

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

Các bí danh trần đã cấu hình được phân giải thành nhà cung cấp và mô hình chính tắc trước khi Compaction bắt đầu. Nếu một giá trị trần khớp cả bí danh lẫn ID mô hình dạng chữ đã cấu hình, ID mô hình dạng chữ sẽ thắng. Một giá trị trần không khớp vẫn là ID mô hình trên nhà cung cấp đang hoạt động.

Điều này cũng hoạt động với mô hình cục bộ, ví dụ một mô hình Ollama thứ hai chuyên dùng để tóm tắt:

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

Khi chưa đặt, Compaction bắt đầu với mô hình phiên đang hoạt động. Nếu việc tóm tắt thất bại với lỗi nhà cung cấp đủ điều kiện dự phòng mô hình, OpenClaw thử lại lần Compaction đó qua chuỗi dự phòng mô hình hiện có của phiên. Lựa chọn dự phòng là tạm thời và không được ghi ngược vào trạng thái phiên. Một ghi đè `agents.defaults.compaction.model` rõ ràng vẫn chính xác và không kế thừa chuỗi dự phòng của phiên.

### Bảo toàn định danh

Tóm tắt Compaction bảo toàn các định danh mờ theo mặc định (`identifierPolicy: "strict"`). Ghi đè bằng `identifierPolicy: "off"` để tắt, hoặc `identifierPolicy: "custom"` cộng với `identifierInstructions` để có hướng dẫn tùy chỉnh.

### Chốt byte bản ghi đang hoạt động

Khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt, OpenClaw kích hoạt Compaction cục bộ thông thường trước một lần chạy nếu JSONL đang hoạt động đạt kích thước đó. Điều này hữu ích cho các phiên chạy dài, nơi quản lý ngữ cảnh phía nhà cung cấp có thể giữ ngữ cảnh mô hình khỏe mạnh trong khi bản ghi cục bộ tiếp tục lớn lên. Nó không chia byte JSONL thô; nó yêu cầu pipeline Compaction thông thường tạo một bản tóm tắt ngữ nghĩa.

<Warning>
Chốt byte yêu cầu `truncateAfterCompaction: true`. Nếu không xoay vòng bản ghi, tệp đang hoạt động sẽ không thu nhỏ và chốt vẫn không hoạt động.
</Warning>

### Bản ghi kế nhiệm

Khi `agents.defaults.compaction.truncateAfterCompaction` được bật, OpenClaw không ghi đè bản ghi hiện có tại chỗ. Nó tạo một bản ghi kế nhiệm đang hoạt động mới từ bản tóm tắt Compaction, trạng thái được bảo toàn và phần đuôi chưa tóm tắt, rồi ghi siêu dữ liệu điểm kiểm tra trỏ các luồng nhánh/khôi phục đến bản kế nhiệm đã được Compaction đó.
Các bản ghi kế nhiệm cũng loại bỏ chính xác các lượt người dùng dài bị trùng lặp xuất hiện
trong một cửa sổ thử lại ngắn, để các đợt bão thử lại kênh không bị mang sang
bản ghi đang hoạt động tiếp theo sau Compaction.

OpenClaw không còn ghi các bản sao `.checkpoint.*.jsonl` riêng cho các lần
Compaction mới. Các tệp điểm kiểm tra kế thừa hiện có vẫn có thể được dùng khi được tham chiếu
và được dọn dẹp bởi quá trình dọn phiên thông thường.

### Thông báo Compaction

Theo mặc định, Compaction chạy im lặng. Đặt `notifyUser` để hiển thị thông báo trạng thái ngắn khi Compaction bắt đầu và hoàn tất:

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

Trước Compaction, OpenClaw có thể chạy một lượt **xả bộ nhớ im lặng** để lưu các ghi chú bền vững xuống đĩa. Đặt `agents.defaults.compaction.memoryFlush.model` khi lượt dọn dẹp này nên dùng mô hình cục bộ thay vì mô hình hội thoại đang hoạt động:

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

Ghi đè mô hình xả bộ nhớ là chính xác và không kế thừa chuỗi dự phòng của phiên đang hoạt động. Xem [Bộ nhớ](/vi/concepts/memory) để biết chi tiết và cấu hình.

## Nhà cung cấp Compaction có thể cắm thêm

Plugins có thể đăng ký nhà cung cấp Compaction tùy chỉnh qua `registerCompactionProvider()` trên API plugin. Khi một nhà cung cấp được đăng ký và cấu hình, OpenClaw ủy quyền việc tóm tắt cho nó thay vì pipeline LLM tích hợp.

Để dùng một nhà cung cấp đã đăng ký, hãy đặt id của nó trong cấu hình của bạn:

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

Đặt `provider` tự động buộc `mode: "safeguard"`. Nhà cung cấp nhận cùng các chỉ dẫn Compaction và chính sách bảo toàn định danh như đường dẫn tích hợp, và OpenClaw vẫn bảo toàn ngữ cảnh hậu tố của lượt gần đây và lượt bị chia sau đầu ra của nhà cung cấp.

<Note>
Nếu nhà cung cấp thất bại hoặc trả về kết quả rỗng, OpenClaw quay về tóm tắt LLM tích hợp.
</Note>

## Compaction so với cắt tỉa

|                  | Compaction                    | Cắt tỉa                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Chức năng** | Tóm tắt cuộc trò chuyện cũ hơn | Cắt bớt kết quả công cụ cũ           |
| **Được lưu?**       | Có (trong bản ghi phiên)   | Không (chỉ trong bộ nhớ, theo từng yêu cầu) |
| **Phạm vi**        | Toàn bộ cuộc trò chuyện           | Chỉ kết quả công cụ                |

[Cắt tỉa phiên](/vi/concepts/session-pruning) là phần bổ trợ nhẹ hơn, cắt bớt đầu ra công cụ mà không tóm tắt.

## Khắc phục sự cố

**Compaction quá thường xuyên?** Cửa sổ ngữ cảnh của mô hình có thể nhỏ, hoặc đầu ra công cụ có thể lớn. Hãy thử bật [cắt tỉa phiên](/vi/concepts/session-pruning).

**Ngữ cảnh có vẻ cũ sau Compaction?** Dùng `/compact Focus on <topic>` để định hướng bản tóm tắt, hoặc bật [xả bộ nhớ](/vi/concepts/memory) để ghi chú được giữ lại.

**Cần một khởi đầu sạch?** `/new` bắt đầu một phiên mới mà không thực hiện Compaction.

Để cấu hình nâng cao (token dự trữ, bảo toàn định danh, công cụ ngữ cảnh tùy chỉnh, Compaction phía máy chủ OpenAI), hãy xem [Phân tích sâu về quản lý phiên](/vi/reference/session-management-compaction).

## Liên quan

- [Phiên](/vi/concepts/session): quản lý phiên và vòng đời.
- [Cắt tỉa phiên](/vi/concepts/session-pruning): cắt bớt kết quả công cụ.
- [Ngữ cảnh](/vi/concepts/context): cách ngữ cảnh được xây dựng cho các lượt tác nhân.
- [Hooks](/vi/automation/hooks): hook vòng đời Compaction (`before_compaction`, `after_compaction`).
