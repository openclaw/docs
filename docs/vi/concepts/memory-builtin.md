---
read_when:
    - Bạn muốn hiểu phần phụ trợ bộ nhớ mặc định
    - Bạn muốn cấu hình nhà cung cấp embedding hoặc tìm kiếm kết hợp
summary: Phần phụ trợ bộ nhớ mặc định dựa trên SQLite với tìm kiếm theo từ khóa, vector và kết hợp
title: Công cụ bộ nhớ tích hợp sẵn
x-i18n:
    generated_at: "2026-04-29T22:37:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Công cụ tích hợp là backend bộ nhớ mặc định. Nó lưu chỉ mục bộ nhớ của bạn trong
cơ sở dữ liệu SQLite riêng cho từng agent và không cần phụ thuộc bổ sung để bắt đầu.

## Công cụ này cung cấp gì

- **Tìm kiếm từ khóa** thông qua lập chỉ mục toàn văn FTS5 (chấm điểm BM25).
- **Tìm kiếm vector** thông qua embedding từ bất kỳ nhà cung cấp nào được hỗ trợ.
- **Tìm kiếm kết hợp** kết hợp cả hai để có kết quả tốt nhất.
- **Hỗ trợ CJK** thông qua tách token trigram cho tiếng Trung, tiếng Nhật và tiếng Hàn.
- **Tăng tốc sqlite-vec** cho truy vấn vector trong cơ sở dữ liệu (tùy chọn).

## Bắt đầu

Nếu bạn có khóa API cho OpenAI, Gemini, Voyage, Mistral hoặc DeepInfra, công cụ tích hợp
sẽ tự phát hiện và bật tìm kiếm vector. Không cần cấu hình.

Để đặt nhà cung cấp rõ ràng:

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

Nếu không có nhà cung cấp embedding, chỉ có tìm kiếm từ khóa khả dụng.

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

| Nhà cung cấp | ID          | Tự phát hiện | Ghi chú                              |
| ------------ | ----------- | ------------ | ----------------------------------- |
| OpenAI       | `openai`    | Có           | Mặc định: `text-embedding-3-small`  |
| Gemini       | `gemini`    | Có           | Hỗ trợ đa phương thức (ảnh + âm thanh) |
| Voyage       | `voyage`    | Có           |                                     |
| Mistral      | `mistral`   | Có           |                                     |
| DeepInfra    | `deepinfra` | Có           | Mặc định: `BAAI/bge-m3`             |
| Ollama       | `ollama`    | Không        | Cục bộ, đặt rõ ràng                 |
| Cục bộ       | `local`     | Có (đầu tiên) | Runtime `node-llama-cpp` tùy chọn   |

Tự phát hiện chọn nhà cung cấp đầu tiên có thể phân giải được khóa API, theo
thứ tự được hiển thị. Đặt `memorySearch.provider` để ghi đè.

## Cách lập chỉ mục hoạt động

OpenClaw lập chỉ mục `MEMORY.md` và `memory/*.md` thành các đoạn (~400 token với
phần chồng lặp 80 token) và lưu chúng trong cơ sở dữ liệu SQLite riêng cho từng agent.

- **Vị trí chỉ mục:** `~/.openclaw/memory/<agentId>.sqlite`
- **Bảo trì lưu trữ:** Các tệp phụ SQLite WAL được giới hạn bằng checkpoint định kỳ và
  khi tắt.
- **Theo dõi tệp:** thay đổi đối với tệp bộ nhớ kích hoạt lập chỉ mục lại có debounce (1,5 giây).
- **Tự động lập chỉ mục lại:** khi nhà cung cấp embedding, mô hình hoặc cấu hình chia đoạn
  thay đổi, toàn bộ chỉ mục được tự động xây dựng lại.
- **Lập chỉ mục lại theo yêu cầu:** `openclaw memory index --force`

<Info>
Bạn cũng có thể lập chỉ mục các tệp Markdown bên ngoài workspace bằng
`memorySearch.extraPaths`. Xem
[tham chiếu cấu hình](/vi/reference/memory-config#additional-memory-paths).
</Info>

## Khi nào nên dùng

Công cụ tích hợp là lựa chọn phù hợp cho hầu hết người dùng:

- Hoạt động ngay mà không cần phụ thuộc bổ sung.
- Xử lý tốt tìm kiếm từ khóa và vector.
- Hỗ trợ tất cả nhà cung cấp embedding.
- Tìm kiếm kết hợp kết hợp điểm mạnh nhất của cả hai cách truy xuất.

Cân nhắc chuyển sang [QMD](/vi/concepts/memory-qmd) nếu bạn cần xếp hạng lại, mở rộng
truy vấn, hoặc muốn lập chỉ mục các thư mục bên ngoài workspace.

Cân nhắc [Honcho](/vi/concepts/memory-honcho) nếu bạn muốn bộ nhớ xuyên phiên với
mô hình hóa người dùng tự động.

## Khắc phục sự cố

**Tìm kiếm bộ nhớ bị tắt?** Kiểm tra `openclaw memory status`. Nếu không phát hiện
nhà cung cấp nào, hãy đặt một nhà cung cấp rõ ràng hoặc thêm khóa API.

**Không phát hiện nhà cung cấp cục bộ?** Xác nhận đường dẫn cục bộ tồn tại và chạy:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Cả lệnh CLI độc lập và Gateway đều dùng cùng id nhà cung cấp `local`.
Nếu nhà cung cấp được đặt thành `auto`, embedding cục bộ chỉ được xét đầu tiên
khi `memorySearch.local.modelPath` trỏ đến một tệp cục bộ hiện có.

**Kết quả cũ?** Chạy `openclaw memory index --force` để xây dựng lại. Trình theo dõi
có thể bỏ lỡ thay đổi trong một số trường hợp hiếm gặp.

**sqlite-vec không tải?** OpenClaw tự động quay về tính độ tương đồng cosine trong tiến trình.
Kiểm tra nhật ký để biết lỗi tải cụ thể.

## Cấu hình

Để thiết lập nhà cung cấp embedding, tinh chỉnh tìm kiếm kết hợp (trọng số, MMR, suy giảm
theo thời gian), lập chỉ mục theo lô, bộ nhớ đa phương thức, sqlite-vec, đường dẫn bổ sung và mọi
núm cấu hình khác, xem
[tham chiếu cấu hình Bộ nhớ](/vi/reference/memory-config).

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Active Memory](/vi/concepts/active-memory)
