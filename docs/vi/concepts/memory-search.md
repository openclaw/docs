---
read_when:
    - Bạn muốn hiểu cách memory_search hoạt động
    - Bạn muốn chọn một nhà cung cấp embedding
    - Bạn muốn tinh chỉnh chất lượng tìm kiếm
summary: Cách tìm kiếm bộ nhớ tìm thấy các ghi chú liên quan bằng embedding và truy xuất kết hợp
title: Tìm kiếm bộ nhớ
x-i18n:
    generated_at: "2026-07-16T15:09:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2ae0830843fba28c24159d85425240051fb8caf086cd0563d3091890045dcfad
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search` tìm các ghi chú liên quan trong tệp bộ nhớ, ngay cả khi cách
diễn đạt khác với văn bản gốc. Tính năng này chia bộ nhớ thành các phần nhỏ và
tìm kiếm chúng bằng embedding, từ khóa hoặc cả hai.

## Bắt đầu nhanh

OpenClaw mặc định sử dụng embedding của OpenAI. Để sử dụng nhà cung cấp khác,
hãy thiết lập rõ ràng:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // hoặc "gemini", "voyage", "mistral", "bedrock", "local", "ollama", "lmstudio", "github-copilot", "openai-compatible"
      },
    },
  },
}
```

`provider` cũng có thể tham chiếu đến một mục `models.providers.<id>` tùy chỉnh
(ví dụ: `ollama-5080`), miễn là mục đó đặt `api` thành `"ollama"` hoặc
một mã định danh nhà cung cấp khác có bộ điều hợp embedding bộ nhớ.

Để sử dụng embedding cục bộ không cần khóa API, hãy cài đặt plugin nhà cung cấp
llama.cpp chính thức và đặt `provider: "local"`:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

Các bản sao mã nguồn vẫn cần phê duyệt bản dựng gốc: `pnpm approve-builds`, sau đó
`pnpm rebuild node-llama-cpp`.

Một số điểm cuối embedding tương thích với OpenAI yêu cầu các nhãn `input_type`
bất đối xứng, chẳng hạn như `"query"` cho tìm kiếm và `"document"`/`"passage"` cho
các đoạn đã lập chỉ mục. Thiết lập các nhãn này bằng `queryInputType` và `documentInputType`; xem
[Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#provider-specific-config).

## Nhà cung cấp được hỗ trợ

| Nhà cung cấp      | ID                  | Cần khóa API | Ghi chú                                      |
| ----------------- | ------------------- | ------------ | -------------------------------------------- |
| Bedrock           | `bedrock`           | Không        | Sử dụng chuỗi thông tin xác thực AWS         |
| DeepInfra         | `deepinfra`         | Có           | Mô hình mặc định `BAAI/bge-m3`                |
| Gemini            | `gemini`            | Có           | Hỗ trợ lập chỉ mục hình ảnh/âm thanh          |
| GitHub Copilot    | `github-copilot`    | Không        | Sử dụng gói đăng ký Copilot của bạn           |
| Cục bộ            | `local`             | Không        | Mô hình GGUF, tự động tải xuống ~0.6 GB       |
| LM Studio         | `lmstudio`          | Không        | Máy chủ cục bộ/tự lưu trữ                     |
| Mistral           | `mistral`           | Có           |                                              |
| Ollama            | `ollama`            | Không        | Máy chủ cục bộ/tự lưu trữ                     |
| OpenAI            | `openai`            | Có           | Mặc định                                     |
| Tương thích OpenAI | `openai-compatible` | Thường là có | Điểm cuối `/v1/embeddings` chung                 |
| Voyage            | `voyage`            | Có           |                                              |

## Cách hoạt động của tìm kiếm

OpenClaw chạy song song hai luồng truy xuất và hợp nhất kết quả:

```mermaid
flowchart LR
    Q["Truy vấn"] --> E["Embedding"]
    Q --> T["Token hóa"]
    E --> VS["Tìm kiếm vector"]
    T --> BM["Tìm kiếm BM25"]
    VS --> M["Hợp nhất có trọng số"]
    BM --> M
    M --> R["Kết quả hàng đầu"]
```

- **Tìm kiếm vector** đối sánh ý nghĩa tương tự ("máy chủ gateway" khớp với "máy
  chạy OpenClaw").
- **Tìm kiếm từ khóa BM25** đối sánh chính xác các thuật ngữ (ID, chuỗi lỗi, khóa
  cấu hình).
- **Tìm kiếm tên tệp** lập chỉ mục đường dẫn riêng biệt với nội dung ghi chú. Đường
  dẫn đầy đủ chính xác, tên cơ sở và phần gốc của tên tệp được xếp hạng cao hơn
  các kết quả khớp một phần với đường dẫn, trong khi đoạn trích và điểm từ khóa
  trong nội dung vẫn lấy từ nội dung ghi chú.

Nếu chỉ có một luồng khả dụng, luồng đó sẽ chạy riêng.

**Chế độ chỉ FTS.** Đặt `provider: "none"` để chủ động tắt embedding
và chỉ tìm kiếm bằng từ khóa. Nếu để `provider` chưa thiết lập hoặc đặt thành `"auto"`,
hệ thống cũng chuyển sang xếp hạng chỉ bằng từ khóa mà không báo lỗi khi chưa
cấu hình thông tin xác thực embedding; `provider: "local"` (nhà cung cấp
GGUF/llama.cpp) cũng hoạt động như vậy khi gặp lỗi.

**Nhà cung cấp được chỉ định không khả dụng.** Nếu bạn chỉ định rõ bất kỳ nhà
cung cấp nào khác (ví dụ: `openai`, `ollama`, `gemini`) và nhà cung cấp đó
không khả dụng tại thời điểm yêu cầu (thông tin xác thực không hợp lệ, lỗi mạng),
`memory_search` sẽ báo bộ nhớ không khả dụng thay vì âm thầm hạ cấp xuống kết quả
chỉ FTS. Điều này giúp phát hiện nhà cung cấp đã cấu hình nhưng bị lỗi. Đặt
`provider: "none"` để chủ động truy xuất chỉ bằng FTS, hoặc sửa cấu hình nhà cung
cấp/thông tin xác thực để khôi phục xếp hạng ngữ nghĩa.

## Cải thiện chất lượng tìm kiếm

Hai tính năng tùy chọn hỗ trợ xử lý lịch sử ghi chú lớn.

### Suy giảm theo thời gian

Trọng số xếp hạng của ghi chú cũ giảm dần để thông tin gần đây xuất hiện trước.
Với chu kỳ bán rã mặc định là 30 ngày, ghi chú từ tháng trước đạt 50% trọng số
ban đầu. `MEMORY.md` và các tệp không có ngày khác trong `memory/` luôn
có giá trị lâu dài và không bao giờ bị suy giảm; chỉ các tệp `memory/YYYY-MM-DD.md` có ngày
mới bị suy giảm.

<Tip>
Bật tính năng này nếu tác tử có nhiều tháng ghi chú hằng ngày và thông tin cũ
liên tục được xếp hạng cao hơn ngữ cảnh gần đây.
</Tip>

### MMR (tính đa dạng)

Giảm các kết quả trùng lặp. Nếu năm ghi chú đều đề cập đến cùng một cấu hình bộ
định tuyến, MMR đảm bảo các kết quả hàng đầu bao quát nhiều chủ đề khác nhau
thay vì lặp lại.

<Tip>
Bật tính năng này nếu `memory_search` liên tục trả về các đoạn trích gần như trùng
lặp từ những ghi chú hằng ngày khác nhau.
</Tip>

### Bật cả hai

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

## Bộ nhớ đa phương thức

Với `gemini-embedding-2-preview`, bạn có thể lập chỉ mục hình ảnh và âm thanh cùng với
Markdown. Tính năng này chỉ áp dụng cho các tệp trong `memorySearch.extraPaths`; các thư
mục gốc bộ nhớ mặc định (`MEMORY.md`, `memory/*.md`) vẫn chỉ hỗ trợ Markdown. Truy vấn
tìm kiếm vẫn là văn bản nhưng có thể đối sánh với nội dung hình ảnh và âm thanh.
Xem [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config#multimodal-memory-gemini)
để biết cách thiết lập.

## Tìm kiếm bộ nhớ phiên

Để truy xuất toàn văn chính xác từ bản chép lời phiên, hãy sử dụng [`sessions_search`](/concepts/session-search)
rồi mở một kết quả bằng `sessions_history`. Tìm kiếm bộ nhớ phiên vẫn là phần bổ trợ
ngữ nghĩa mang tính thử nghiệm.

Bạn có thể tùy chọn lập chỉ mục bản chép lời phiên để `memory_search` có thể truy
xuất các cuộc trò chuyện trước đó. Tính năng này cần được chủ động bật: đặt
`experimental.sessionMemory: true` và thêm `"sessions"` vào `sources` (`sources` mặc định là `["memory"]`).

Kết quả phiên tuân theo `tools.sessions.visibility`: giá trị mặc định `"tree"` chỉ
hiển thị phiên hiện tại và các phiên do phiên đó khởi tạo. Để truy xuất một
phiên không liên quan của cùng tác tử từ một phiên khác (ví dụ: phiên do gateway
điều phối từ tin nhắn trực tiếp), hãy mở rộng phạm vi hiển thị thành `"agent"`.

Khi sử dụng phần phụ trợ QMD, hãy đặt thêm `memory.qmd.sessions.enabled: true` để
bản chép lời được xuất vào bộ sưu tập QMD; chỉ riêng `experimental.sessionMemory`
và `sources` sẽ không xuất bản chép lời vào QMD. Xem
[tham chiếu cấu hình](/vi/reference/memory-config#session-memory-search-experimental).

## Khắc phục sự cố

**Không có kết quả?** Chạy `openclaw memory status` để kiểm tra chỉ mục. Nếu trống, hãy chạy
`openclaw memory index --force`.

**Chỉ có kết quả khớp từ khóa?** Nhà cung cấp embedding có thể chưa được cấu hình.
Hãy kiểm tra `openclaw memory status --deep`.

**Embedding cục bộ hết thời gian chờ?** `ollama`, `lmstudio` và `local` mặc định sử dụng
thời gian chờ lô nội tuyến dài hơn. Nếu máy chủ chỉ hoạt động chậm, hãy đặt
`agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds` và chạy lại
`openclaw memory index --force`.

**Không tìm thấy văn bản CJK?** Xây dựng lại chỉ mục FTS bằng
`openclaw memory index --force`.

## Liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Active Memory](/vi/concepts/active-memory)
- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin)
- [Tham chiếu cấu hình bộ nhớ](/vi/reference/memory-config)
