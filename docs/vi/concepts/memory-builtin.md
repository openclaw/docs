---
read_when:
    - Bạn muốn hiểu backend bộ nhớ mặc định
    - Bạn muốn cấu hình nhà cung cấp embedding hoặc tìm kiếm lai
summary: Phần phụ trợ bộ nhớ mặc định dựa trên SQLite với tìm kiếm theo từ khóa, vector và kết hợp
title: Công cụ bộ nhớ tích hợp sẵn
x-i18n:
    generated_at: "2026-06-27T17:23:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Công cụ tích hợp là backend bộ nhớ mặc định. Nó lưu chỉ mục bộ nhớ của bạn trong
cơ sở dữ liệu SQLite riêng cho từng tác tử và không cần phụ thuộc bổ sung để bắt đầu.

## Công cụ này cung cấp gì

- **Tìm kiếm từ khóa** qua lập chỉ mục toàn văn FTS5 (chấm điểm BM25).
- **Tìm kiếm vector** qua embedding từ bất kỳ nhà cung cấp được hỗ trợ nào.
- **Tìm kiếm lai** kết hợp cả hai để có kết quả tốt nhất.
- **Hỗ trợ CJK** qua token hóa trigram cho tiếng Trung, tiếng Nhật và tiếng Hàn.
- **Tăng tốc sqlite-vec** cho truy vấn vector trong cơ sở dữ liệu (tùy chọn).

## Bắt đầu

Theo mặc định, công cụ tích hợp dùng embedding của OpenAI. Nếu bạn đã cấu hình
`OPENAI_API_KEY` hoặc `models.providers.openai.apiKey`, tìm kiếm vector
hoạt động mà không cần cấu hình bộ nhớ bổ sung.

Để đặt rõ một nhà cung cấp:

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

Để buộc dùng embedding GGUF cục bộ, hãy cài đặt Plugin nhà cung cấp llama.cpp chính thức,
sau đó trỏ `local.modelPath` tới một tệp GGUF:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

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

| Nhà cung cấp      | ID                  | Ghi chú                              |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | Dùng chuỗi thông tin xác thực AWS    |
| DeepInfra         | `deepinfra`         | Mặc định: `BAAI/bge-m3`              |
| Gemini            | `gemini`            | Hỗ trợ đa phương thức (hình ảnh + âm thanh) |
| GitHub Copilot    | `github-copilot`    | Dùng đăng ký Copilot                 |
| Local             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | Cục bộ/tự lưu trữ                    |
| OpenAI            | `openai`            | Mặc định: `text-embedding-3-small`   |
| Tương thích OpenAI | `openai-compatible` | Điểm cuối `/v1/embeddings` chung     |
| Voyage            | `voyage`            |                                     |

Đặt `memorySearch.provider` để chuyển khỏi OpenAI.

## Cách lập chỉ mục hoạt động

OpenClaw lập chỉ mục `MEMORY.md` và `memory/*.md` thành các đoạn (~400 token với
phần chồng lấp 80 token) và lưu chúng trong cơ sở dữ liệu SQLite riêng cho từng tác tử.

- **Vị trí chỉ mục:** cơ sở dữ liệu của tác tử sở hữu tại
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Bảo trì lưu trữ:** các sidecar WAL của SQLite được giới hạn bằng checkpoint định kỳ và
  khi tắt.
- **Theo dõi tệp:** thay đổi đối với tệp bộ nhớ kích hoạt lập chỉ mục lại có debounce (1,5 giây).
- **Tự động lập chỉ mục lại:** khi nhà cung cấp embedding, mô hình hoặc cấu hình chia đoạn
  thay đổi, toàn bộ chỉ mục được xây dựng lại tự động.
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
- Tìm kiếm lai kết hợp phần tốt nhất của cả hai cách truy xuất.

Cân nhắc chuyển sang [QMD](/vi/concepts/memory-qmd) nếu bạn cần xếp hạng lại, mở rộng truy vấn,
hoặc muốn lập chỉ mục các thư mục bên ngoài workspace.

Cân nhắc [Honcho](/vi/concepts/memory-honcho) nếu bạn muốn bộ nhớ xuyên phiên với
mô hình hóa người dùng tự động.

## Khắc phục sự cố

**Tìm kiếm bộ nhớ bị tắt?** Kiểm tra `openclaw memory status`. Nếu không phát hiện
nhà cung cấp nào, hãy đặt rõ một nhà cung cấp hoặc thêm khóa API.

**Không phát hiện nhà cung cấp cục bộ?** Xác nhận đường dẫn cục bộ tồn tại và chạy:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Cả các lệnh CLI độc lập và Gateway đều dùng cùng id nhà cung cấp `local`.
Đặt `memorySearch.provider: "local"` khi bạn muốn embedding cục bộ.

**Kết quả cũ?** Chạy `openclaw memory index --force` để xây dựng lại. Trình theo dõi
có thể bỏ lỡ thay đổi trong một số trường hợp hiếm gặp.

**sqlite-vec không tải?** OpenClaw tự động quay về tính độ tương đồng cosine trong tiến trình.
`openclaw memory status --deep` báo cáo kho vector cục bộ riêng với nhà cung cấp embedding,
vì vậy `Vector store: unavailable` chỉ ra vấn đề tải sqlite-vec còn `Embeddings: unavailable`
chỉ ra vấn đề về nhà cung cấp/xác thực hoặc trạng thái sẵn sàng của mô hình. Kiểm tra log để biết
lỗi tải cụ thể.

## Cấu hình

Để thiết lập nhà cung cấp embedding, tinh chỉnh tìm kiếm lai (trọng số, MMR, suy giảm theo thời gian),
lập chỉ mục theo lô, bộ nhớ đa phương thức, sqlite-vec, đường dẫn bổ sung và tất cả
các nút cấu hình khác, xem
[tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config).

## Liên quan

- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Active memory](/vi/concepts/active-memory)
