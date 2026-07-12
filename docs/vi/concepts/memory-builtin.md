---
read_when:
    - Bạn muốn tìm hiểu backend bộ nhớ mặc định
    - Bạn muốn cấu hình nhà cung cấp embedding hoặc tìm kiếm kết hợp
summary: Backend bộ nhớ mặc định dựa trên SQLite với tìm kiếm từ khóa, vectơ và kết hợp
title: Công cụ bộ nhớ tích hợp
x-i18n:
    generated_at: "2026-07-12T07:51:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Công cụ tích hợp sẵn là backend bộ nhớ mặc định. Nó lưu chỉ mục bộ nhớ của bạn
trong cơ sở dữ liệu SQLite riêng cho từng agent và không cần thêm phần phụ thuộc nào
để bắt đầu.

## Các tính năng được cung cấp

- **Tìm kiếm từ khóa** thông qua lập chỉ mục toàn văn FTS5 (chấm điểm BM25).
- **Tìm kiếm vector** thông qua embedding từ bất kỳ nhà cung cấp nào được hỗ trợ.
- **Tìm kiếm kết hợp** phối hợp cả hai để đạt kết quả tốt nhất.
- **Hỗ trợ CJK** thông qua token hóa trigram cho tiếng Trung, tiếng Nhật và tiếng Hàn.
- **Tăng tốc bằng sqlite-vec** cho các truy vấn vector trong cơ sở dữ liệu (tùy chọn).

## Bắt đầu

Theo mặc định, công cụ tích hợp sẵn sử dụng embedding của OpenAI. Nếu
`OPENAI_API_KEY` hoặc `models.providers.openai.apiKey` đã được cấu hình, tính năng
tìm kiếm vector sẽ hoạt động mà không cần cấu hình thêm cho bộ nhớ.

Để chỉ định rõ một nhà cung cấp:

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

Nếu không có nhà cung cấp embedding, chỉ tính năng tìm kiếm từ khóa khả dụng.

Để bắt buộc sử dụng embedding GGUF cục bộ, hãy cài đặt Plugin nhà cung cấp
llama.cpp chính thức, sau đó trỏ `local.modelPath` đến một tệp GGUF:

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

## Các nhà cung cấp embedding được hỗ trợ

| Nhà cung cấp      | ID                  | Ghi chú                                   |
| ----------------- | ------------------- | ----------------------------------------- |
| Bedrock           | `bedrock`           | Sử dụng chuỗi thông tin xác thực AWS      |
| DeepInfra         | `deepinfra`         | Mặc định: `BAAI/bge-m3`                   |
| Gemini            | `gemini`            | Hỗ trợ đa phương thức (hình ảnh + âm thanh) |
| GitHub Copilot    | `github-copilot`    | Sử dụng gói đăng ký Copilot của bạn       |
| LM Studio         | `lmstudio`          | Cục bộ/tự lưu trữ                         |
| Cục bộ            | `local`             | `@openclaw/llama-cpp-provider`            |
| Mistral           | `mistral`           |                                           |
| Ollama            | `ollama`            | Cục bộ/tự lưu trữ                         |
| OpenAI            | `openai`            | Mặc định: `text-embedding-3-small`        |
| Tương thích OpenAI | `openai-compatible` | Điểm cuối `/v1/embeddings` dùng chung     |
| Voyage            | `voyage`            |                                           |

Đặt `memorySearch.provider` để chuyển khỏi OpenAI.

## Cách hoạt động của quá trình lập chỉ mục

OpenClaw lập chỉ mục `MEMORY.md` và `memory/*.md` thành các đoạn (mặc định
400 token với phần chồng lấp 80 token) và lưu chúng trong cơ sở dữ liệu SQLite
riêng cho từng agent.

- **Vị trí chỉ mục:** cơ sở dữ liệu của agent sở hữu tại
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Bảo trì bộ nhớ lưu trữ:** các tệp phụ WAL của SQLite được giới hạn bằng các
  checkpoint định kỳ và khi tắt.
- **Theo dõi tệp:** các thay đổi đối với tệp bộ nhớ kích hoạt quá trình lập chỉ mục
  lại có chống dội (mặc định 1,5 giây).
- **Tự động lập chỉ mục lại:** chỉ mục tự động được dựng lại khi nhà cung cấp
  embedding, mô hình, cấu hình phân đoạn, nguồn đã cấu hình hoặc phạm vi thay đổi.
- **Lập chỉ mục lại theo yêu cầu:** `openclaw memory index --force`

<Info>
Bạn cũng có thể lập chỉ mục các tệp Markdown bên ngoài không gian làm việc bằng
`memorySearch.extraPaths`. Xem
[tham chiếu cấu hình](/vi/reference/memory-config#additional-memory-paths).
</Info>

## Khi nào nên sử dụng

Công cụ tích hợp sẵn là lựa chọn phù hợp cho hầu hết người dùng:

- Hoạt động ngay mà không cần thêm phần phụ thuộc.
- Xử lý tốt cả tìm kiếm từ khóa và tìm kiếm vector.
- Hỗ trợ tất cả nhà cung cấp embedding.
- Tìm kiếm kết hợp tận dụng ưu điểm của cả hai phương pháp truy xuất.

Hãy cân nhắc chuyển sang [QMD](/vi/concepts/memory-qmd) nếu bạn cần xếp hạng lại,
mở rộng truy vấn hoặc muốn lập chỉ mục các thư mục bên ngoài không gian làm việc.

Hãy cân nhắc [Honcho](/vi/concepts/memory-honcho) nếu bạn muốn bộ nhớ xuyên phiên
với khả năng tự động xây dựng mô hình người dùng.

## Khắc phục sự cố

**Tìm kiếm bộ nhớ bị tắt?** Hãy kiểm tra `openclaw memory status`. Nếu không phát hiện
nhà cung cấp nào, hãy chỉ định rõ một nhà cung cấp hoặc thêm khóa API.

**Không phát hiện nhà cung cấp cục bộ?** Hãy xác nhận đường dẫn cục bộ tồn tại và chạy:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Cả các lệnh CLI độc lập và Gateway đều sử dụng cùng ID nhà cung cấp `local`.
Đặt `memorySearch.provider: "local"` khi bạn muốn sử dụng embedding cục bộ.

**Kết quả lỗi thời?** Chạy `openclaw memory index --force` để dựng lại. Trong một số
trường hợp hiếm gặp, trình theo dõi có thể bỏ sót thay đổi.

**sqlite-vec không tải được?** OpenClaw tự động chuyển sang tính độ tương đồng cosine
trong tiến trình. `openclaw memory status --deep` báo cáo kho vector cục bộ riêng
với nhà cung cấp embedding, vì vậy `Vector store: unavailable` cho biết có vấn đề
khi tải sqlite-vec, còn `Embeddings: unavailable` cho biết có vấn đề về trạng thái
sẵn sàng của nhà cung cấp/xác thực hoặc mô hình. Hãy kiểm tra nhật ký để biết lỗi tải
cụ thể.

## Cấu hình

Để thiết lập nhà cung cấp embedding, tinh chỉnh tìm kiếm kết hợp (trọng số, MMR,
suy giảm theo thời gian), lập chỉ mục theo lô, bộ nhớ đa phương thức, sqlite-vec,
đường dẫn bổ sung và mọi tùy chọn cấu hình khác, hãy xem
[tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config).

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Tìm kiếm bộ nhớ](/vi/concepts/memory-search)
- [Active Memory](/vi/concepts/active-memory)
