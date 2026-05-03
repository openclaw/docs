---
read_when:
    - Bạn muốn hiểu phần phụ trợ bộ nhớ mặc định
    - Bạn muốn cấu hình các nhà cung cấp embedding hoặc tìm kiếm kết hợp
summary: Backend bộ nhớ mặc định dựa trên SQLite với tìm kiếm theo từ khóa, tìm kiếm vector và tìm kiếm kết hợp
title: Công cụ bộ nhớ tích hợp sẵn
x-i18n:
    generated_at: "2026-05-03T21:29:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72f5d1fee02bff0962bd012575b62846c1f11c030fd1174fdb2af1e81909f52a
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Công cụ tích hợp là backend bộ nhớ mặc định. Nó lưu chỉ mục bộ nhớ của bạn trong
cơ sở dữ liệu SQLite riêng cho từng agent và không cần phụ thuộc bổ sung để bắt đầu.

## Nó cung cấp gì

- **Tìm kiếm từ khóa** qua lập chỉ mục toàn văn FTS5 (chấm điểm BM25).
- **Tìm kiếm vector** qua embedding từ bất kỳ nhà cung cấp được hỗ trợ nào.
- **Tìm kiếm hybrid** kết hợp cả hai để có kết quả tốt nhất.
- **Hỗ trợ CJK** qua token hóa trigram cho tiếng Trung, tiếng Nhật và tiếng Hàn.
- **Tăng tốc sqlite-vec** cho truy vấn vector trong cơ sở dữ liệu (tùy chọn).

## Bắt đầu

Nếu bạn có API key cho OpenAI, Gemini, Voyage, Mistral hoặc DeepInfra, công cụ tích hợp
sẽ tự động phát hiện và bật tìm kiếm vector. Không cần cấu hình.

Để đặt rõ nhà cung cấp:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Khi không có nhà cung cấp embedding, chỉ có tìm kiếm từ khóa.

Để buộc dùng nhà cung cấp embedding cục bộ tích hợp, hãy cài đặt gói runtime tùy chọn
`node-llama-cpp` bên cạnh OpenClaw, rồi trỏ `local.modelPath`
đến một tệp GGUF:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Nhà cung cấp embedding được hỗ trợ

| Nhà cung cấp | ID          | Tự động phát hiện | Ghi chú                              |
| ------------ | ----------- | ----------------- | ----------------------------------- |
| OpenAI       | `openai`    | Có                | Mặc định: `text-embedding-3-small`  |
| Gemini       | `gemini`    | Có                | Hỗ trợ đa phương thức (ảnh + âm thanh) |
| Voyage       | `voyage`    | Có                |                                     |
| Mistral      | `mistral`   | Có                |                                     |
| DeepInfra    | `deepinfra` | Có                | Mặc định: `BAAI/bge-m3`             |
| Ollama       | `ollama`    | Không             | Cục bộ, đặt rõ ràng                 |
| Cục bộ       | `local`     | Có (đầu tiên)     | Runtime `node-llama-cpp` tùy chọn   |

Tự động phát hiện chọn nhà cung cấp đầu tiên có thể phân giải API key, theo
thứ tự hiển thị. Đặt `memorySearch.provider` để ghi đè.

## Cách lập chỉ mục hoạt động

OpenClaw lập chỉ mục `MEMORY.md` và `memory/*.md` thành các đoạn (~400 token với
phần chồng lấn 80 token) và lưu chúng trong cơ sở dữ liệu SQLite riêng cho từng agent.

- **Vị trí chỉ mục:** `~/.openclaw/memory/<agentId>.sqlite`
- **Bảo trì lưu trữ:** Các tệp phụ SQLite WAL được giới hạn bằng checkpoint định kỳ và
  khi tắt.
- **Theo dõi tệp:** thay đổi trong các tệp bộ nhớ kích hoạt lập chỉ mục lại có debounce (1,5 giây).
- **Tự động lập chỉ mục lại:** khi nhà cung cấp embedding, mô hình hoặc cấu hình chia đoạn
  thay đổi, toàn bộ chỉ mục sẽ tự động được xây dựng lại.
- **Lập chỉ mục lại theo yêu cầu:** `openclaw memory index --force`

<Info>
Bạn cũng có thể lập chỉ mục các tệp Markdown bên ngoài workspace bằng
`memorySearch.extraPaths`. Xem
[tham chiếu cấu hình](/vi/reference/memory-config#additional-memory-paths).
</Info>

## Khi nào nên dùng

Công cụ tích hợp là lựa chọn phù hợp cho hầu hết người dùng:

- Hoạt động ngay không cần phụ thuộc bổ sung.
- Xử lý tốt tìm kiếm từ khóa và vector.
- Hỗ trợ tất cả nhà cung cấp embedding.
- Tìm kiếm hybrid kết hợp điểm mạnh nhất của cả hai cách truy xuất.

Cân nhắc chuyển sang [QMD](/vi/concepts/memory-qmd) nếu bạn cần xếp hạng lại, mở rộng
truy vấn, hoặc muốn lập chỉ mục các thư mục bên ngoài workspace.

Cân nhắc [Honcho](/vi/concepts/memory-honcho) nếu bạn muốn bộ nhớ xuyên phiên với
mô hình hóa người dùng tự động.

## Khắc phục sự cố

**Tìm kiếm bộ nhớ bị tắt?** Kiểm tra `openclaw memory status`. Nếu không có nhà cung cấp nào
được phát hiện, hãy đặt rõ một nhà cung cấp hoặc thêm API key.

**Không phát hiện nhà cung cấp cục bộ?** Xác nhận đường dẫn cục bộ tồn tại rồi chạy:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Cả lệnh CLI độc lập và Gateway đều dùng cùng id nhà cung cấp `local`.
Nếu nhà cung cấp được đặt thành `auto`, embedding cục bộ chỉ được xét trước tiên
khi `memorySearch.local.modelPath` trỏ đến một tệp cục bộ hiện có.

**Kết quả cũ?** Chạy `openclaw memory index --force` để xây dựng lại. Trình theo dõi
có thể bỏ sót thay đổi trong một số trường hợp hiếm.

**sqlite-vec không tải được?** OpenClaw tự động fallback về độ tương đồng cosine
trong tiến trình. `openclaw memory status --deep` báo cáo kho vector cục bộ
tách biệt với nhà cung cấp embedding, vì vậy `Vector store: unavailable` chỉ đến
việc tải sqlite-vec, còn `Embeddings: unavailable` chỉ đến nhà cung cấp/xác thực
hoặc trạng thái sẵn sàng của mô hình. Kiểm tra log để biết lỗi tải cụ thể.

## Cấu hình

Để thiết lập nhà cung cấp embedding, tinh chỉnh tìm kiếm hybrid (trọng số, MMR, suy giảm
theo thời gian), lập chỉ mục theo lô, bộ nhớ đa phương thức, sqlite-vec, đường dẫn bổ sung và mọi
núm cấu hình khác, hãy xem
[tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config).

## Liên quan

- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Active memory](/vi/concepts/active-memory)
