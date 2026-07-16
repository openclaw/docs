---
read_when:
    - Bạn muốn tìm hiểu về tính năng tự động Compaction và `/compact`
    - Bạn đang gỡ lỗi các phiên dài chạm đến giới hạn ngữ cảnh
summary: Cách OpenClaw tóm tắt các cuộc trò chuyện dài để không vượt quá giới hạn của mô hình
title: Compaction
x-i18n:
    generated_at: "2026-07-16T15:09:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

Mỗi mô hình đều có một cửa sổ ngữ cảnh: số token tối đa mà mô hình có thể xử lý. Khi cuộc hội thoại gần đạt giới hạn đó, OpenClaw sẽ **Compaction** các tin nhắn cũ thành một bản tóm tắt để cuộc trò chuyện có thể tiếp tục.

## Cách hoạt động

1. Các lượt hội thoại cũ được tóm tắt thành một mục cô đọng.
2. Bản tóm tắt được lưu trong bản ghi phiên.
3. Các tin nhắn gần đây được giữ nguyên.

OpenClaw giữ các lệnh gọi công cụ của trợ lý đi cùng với các mục `toolResult` tương ứng khi chọn điểm phân tách để Compaction. Nếu điểm đó nằm bên trong một khối công cụ, OpenClaw sẽ dịch chuyển ranh giới để cặp này vẫn ở cùng nhau và phần đuôi hiện tại chưa được tóm tắt vẫn được bảo toàn.

Toàn bộ lịch sử hội thoại vẫn được lưu trên đĩa. Compaction chỉ thay đổi nội dung mà mô hình nhìn thấy trong lượt tiếp theo.

<Note>
Các cấu hình mới mặc định đặt `agents.defaults.compaction.mode` thành `"safeguard"` (các biện pháp bảo vệ nghiêm ngặt hơn, kiểm tra chất lượng bản tóm tắt). Đặt rõ `mode: "default"` để không sử dụng chế độ này.
</Note>

## Compaction tự động

Compaction tự động được bật theo mặc định. Tính năng này chạy khi phiên gần đạt giới hạn ngữ cảnh hoặc khi mô hình trả về lỗi tràn ngữ cảnh (trong trường hợp đó, OpenClaw sẽ thực hiện Compaction rồi thử lại).

Bạn sẽ thấy:

- `embedded run auto-compaction start` / `complete` trong nhật ký Gateway thông thường.
- `🧹 Auto-compaction complete` trong chế độ chi tiết.
- `/status` hiển thị `🧹 Compactions: <count>`.

<Info>
Trước khi thực hiện Compaction, OpenClaw tự động nhắc tác tử lưu các ghi chú quan trọng vào tệp [bộ nhớ](/vi/concepts/memory). Điều này giúp ngăn mất ngữ cảnh.
</Info>

<AccordionGroup>
  <Accordion title="Các mẫu lỗi tràn mà OpenClaw nhận diện">
    OpenClaw đối chiếu hàng chục chuỗi lỗi tràn dành riêng cho từng nhà cung cấp (Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter và nhiều nhà cung cấp khác). Các ví dụ phổ biến:

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## Compaction thủ công

Nhập `/compact` trong bất kỳ cuộc trò chuyện nào để buộc thực hiện Compaction. Thêm hướng dẫn để định hướng bản tóm tắt:

```text
/compact Tập trung vào các quyết định thiết kế API
```

Khi `agents.defaults.compaction.keepRecentTokens` được đặt (mặc định: 20,000), Compaction thủ công tuân theo điểm cắt đó và giữ phần đuôi gần đây trong ngữ cảnh được tái tạo. Nếu không có ngân sách giữ lại rõ ràng, Compaction thủ công hoạt động như một điểm kiểm tra cứng và chỉ tiếp tục từ bản tóm tắt mới.

## Cấu hình

Cấu hình Compaction trong `agents.defaults.compaction` thuộc `openclaw.json` của bạn. Các tùy chọn phổ biến nhất được liệt kê dưới đây; để xem tài liệu tham khảo đầy đủ, hãy xem [Tìm hiểu chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction).

### Sử dụng mô hình khác

Theo mặc định, Compaction sử dụng mô hình chính của tác tử. Đặt `agents.defaults.compaction.model` để giao việc tóm tắt cho một mô hình chuyên biệt hoặc có năng lực cao hơn. Giá trị ghi đè chấp nhận chuỗi `provider/model-id` hoặc một bí danh thuần được cấu hình trong `agents.defaults.models`:

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

Các bí danh thuần đã cấu hình được phân giải thành nhà cung cấp và mô hình chuẩn trước khi Compaction bắt đầu. Nếu một giá trị thuần khớp với cả bí danh và ID mô hình dạng ký tự đã cấu hình, ID mô hình dạng ký tự được ưu tiên. Một giá trị thuần không khớp vẫn được xem là ID mô hình trên nhà cung cấp đang hoạt động.

Điều này cũng hoạt động với các mô hình cục bộ, chẳng hạn như mô hình Ollama thứ hai chuyên dùng để tóm tắt:

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

Khi không được đặt, Compaction bắt đầu bằng mô hình của phiên đang hoạt động. Nếu việc tóm tắt thất bại do lỗi nhà cung cấp đủ điều kiện chuyển sang mô hình dự phòng, OpenClaw sẽ thử lại lần Compaction đó thông qua chuỗi mô hình dự phòng hiện có của phiên. Lựa chọn dự phòng chỉ là tạm thời và không được ghi trở lại trạng thái phiên. Giá trị ghi đè `agents.defaults.compaction.model` rõ ràng vẫn được giữ chính xác và không kế thừa chuỗi dự phòng của phiên.

### Bảo toàn định danh

Theo mặc định, quá trình tóm tắt Compaction bảo toàn các định danh bất khả tri (`identifierPolicy: "strict"`). Ghi đè bằng `identifierPolicy: "off"` để tắt, hoặc bằng `identifierPolicy: "custom"` cùng `identifierInstructions` để cung cấp hướng dẫn tùy chỉnh.

### Bộ bảo vệ số byte của bản ghi đang hoạt động

Khi `agents.defaults.compaction.maxActiveTranscriptBytes` được đặt, OpenClaw
kích hoạt Compaction cục bộ thông thường trước một lần chạy nếu lịch sử bản ghi đạt
kích thước đó. Điều này hữu ích cho các phiên chạy dài, nơi việc quản lý ngữ cảnh
phía nhà cung cấp có thể duy trì ngữ cảnh mô hình ở trạng thái tốt trong khi lịch sử bản ghi được lưu trữ
tiếp tục tăng. Tính năng này không phân tách byte thô; nó yêu cầu quy trình Compaction
thông thường tạo một bản tóm tắt ngữ nghĩa.

<Warning>
Bộ bảo vệ byte áp dụng cho lịch sử bản ghi SQLite đang hoạt động. Các tạo tác
điểm kiểm tra JSONL cũ không phải là mục tiêu Compaction đang hoạt động.
</Warning>

### Bản ghi kế nhiệm

Khi `agents.defaults.compaction.truncateAfterCompaction` được bật, OpenClaw không ghi lại bản ghi hiện có tại chỗ. Thay vào đó, OpenClaw tạo một bản ghi kế nhiệm đang hoạt động mới từ bản tóm tắt Compaction, trạng thái được bảo toàn và phần đuôi chưa được tóm tắt, sau đó ghi lại siêu dữ liệu điểm kiểm tra để hướng các luồng phân nhánh/khôi phục đến bản kế nhiệm đã được Compaction đó.
Các bản ghi kế nhiệm cũng loại bỏ các lượt dài của người dùng trùng khớp hoàn toàn được gửi đến
trong một khoảng thời gian thử lại ngắn, để các đợt thử lại dồn dập từ kênh không bị chuyển sang
bản ghi đang hoạt động tiếp theo sau khi Compaction.

OpenClaw không còn ghi các bản sao `.checkpoint.*.jsonl` riêng biệt cho các lần
Compaction mới. Các tệp điểm kiểm tra cũ hiện có vẫn có thể được sử dụng khi còn được tham chiếu
và được dọn bỏ trong quá trình dọn dẹp phiên thông thường.

### Thông báo Compaction

Theo mặc định, Compaction chạy âm thầm. Đặt `notifyUser` để hiển thị các thông báo trạng thái ngắn khi Compaction bắt đầu và hoàn tất, đồng thời hiển thị thông báo suy giảm khi việc đẩy bộ nhớ trước Compaction đã dùng hết khả năng nhưng phản hồi vẫn tiếp tục:

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

### Đẩy bộ nhớ

Trước khi Compaction, OpenClaw có thể chạy một lượt **đẩy bộ nhớ âm thầm** để lưu các ghi chú lâu dài vào đĩa. Đặt `agents.defaults.compaction.memoryFlush.model` khi lượt bảo trì này cần sử dụng mô hình cục bộ thay vì mô hình của cuộc hội thoại đang hoạt động:

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

Giá trị ghi đè mô hình đẩy bộ nhớ được áp dụng chính xác và không kế thừa chuỗi dự phòng của phiên đang hoạt động. Xem [Bộ nhớ](/vi/concepts/memory) để biết chi tiết và cấu hình.

## Nhà cung cấp Compaction có thể cắm thêm

Các Plugin có thể đăng ký một nhà cung cấp Compaction tùy chỉnh qua `registerCompactionProvider()` trên API Plugin. Khi một nhà cung cấp được đăng ký và cấu hình, OpenClaw giao việc tóm tắt cho nhà cung cấp đó thay vì quy trình LLM tích hợp sẵn.

Để sử dụng một nhà cung cấp đã đăng ký, hãy đặt ID của nhà cung cấp đó trong cấu hình:

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

Việc đặt `provider` sẽ tự động buộc `mode: "safeguard"`. Các nhà cung cấp nhận cùng hướng dẫn Compaction và chính sách bảo toàn định danh như quy trình tích hợp sẵn, đồng thời OpenClaw vẫn bảo toàn ngữ cảnh hậu tố của lượt gần đây và lượt bị phân tách sau đầu ra của nhà cung cấp.

<Note>
Nếu nhà cung cấp thất bại hoặc trả về kết quả trống, OpenClaw sẽ chuyển về sử dụng tính năng tóm tắt LLM tích hợp sẵn.
</Note>

## Compaction so với cắt tỉa

|                  | Compaction                    | Cắt tỉa                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **Chức năng** | Tóm tắt hội thoại cũ | Cắt bớt kết quả công cụ cũ           |
| **Có được lưu không?**       | Có (trong bản ghi phiên)   | Không (chỉ trong bộ nhớ, theo từng yêu cầu) |
| **Phạm vi**        | Toàn bộ cuộc hội thoại           | Chỉ kết quả công cụ                |

[Cắt tỉa phiên](/vi/concepts/session-pruning) là một tính năng bổ trợ nhẹ hơn, giúp cắt bớt đầu ra công cụ mà không cần tóm tắt.

## Khắc phục sự cố

**Compaction quá thường xuyên?** Cửa sổ ngữ cảnh của mô hình có thể nhỏ hoặc đầu ra công cụ có thể lớn. Hãy thử bật [cắt tỉa phiên](/vi/concepts/session-pruning).

**Ngữ cảnh có vẻ lỗi thời sau Compaction?** Sử dụng `/compact Focus on <topic>` để định hướng bản tóm tắt hoặc bật [đẩy bộ nhớ](/vi/concepts/memory) để các ghi chú được duy trì.

**Cần bắt đầu lại từ đầu?** `/new` bắt đầu một phiên mới mà không thực hiện Compaction.

Để biết cấu hình nâng cao (token dự trữ, bảo toàn định danh, công cụ ngữ cảnh tùy chỉnh, Compaction phía máy chủ OpenAI), hãy xem [Tìm hiểu chuyên sâu về quản lý phiên](/vi/reference/session-management-compaction).

## Liên quan

- [Phiên](/vi/concepts/session): quản lý và vòng đời phiên.
- [Cắt tỉa phiên](/vi/concepts/session-pruning): cắt bớt kết quả công cụ.
- [Ngữ cảnh](/vi/concepts/context): cách ngữ cảnh được xây dựng cho các lượt của tác tử.
- [Hook](/vi/automation/hooks): các hook vòng đời Compaction (`before_compaction`, `after_compaction`).
