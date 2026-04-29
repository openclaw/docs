---
read_when:
    - Bạn muốn bộ nhớ lâu dài hoạt động trên nhiều phiên và kênh
    - Bạn muốn khả năng truy hồi và mô hình hóa người dùng do AI hỗ trợ
summary: Bộ nhớ xuyên phiên được thiết kế gốc cho AI thông qua Plugin Honcho
title: Bộ nhớ Honcho
x-i18n:
    generated_at: "2026-04-29T22:37:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: d77af5c7281a4abafc184e426b1c37205a6d06a196b50353c1abbf67cc93bb97
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) bổ sung bộ nhớ gốc AI cho OpenClaw. Nó lưu giữ
các cuộc trò chuyện vào một dịch vụ chuyên dụng và xây dựng mô hình người dùng
cũng như mô hình tác tử theo thời gian, giúp tác tử của bạn có ngữ cảnh xuyên
phiên vượt ra ngoài các tệp Markdown trong workspace.

## Công cụ này cung cấp gì

- **Bộ nhớ xuyên phiên** -- các cuộc trò chuyện được lưu giữ sau mỗi lượt, nên
  ngữ cảnh được duy trì qua các lần đặt lại phiên, Compaction và chuyển kênh.
- **Mô hình hóa người dùng** -- Honcho duy trì hồ sơ cho từng người dùng (tùy chọn,
  sự kiện, phong cách giao tiếp) và cho tác tử (tính cách, hành vi đã học).
- **Tìm kiếm ngữ nghĩa** -- tìm kiếm trên các quan sát từ những cuộc trò chuyện trước đây,
  không chỉ phiên hiện tại.
- **Nhận thức đa tác tử** -- các tác tử cha tự động theo dõi các tác tử con
  được tạo ra, trong đó tác tử cha được thêm làm người quan sát trong phiên con.

## Công cụ có sẵn

Honcho đăng ký các công cụ mà tác tử có thể dùng trong cuộc trò chuyện:

**Truy xuất dữ liệu (nhanh, không gọi LLM):**

| Công cụ                     | Chức năng                                               |
| --------------------------- | ------------------------------------------------------- |
| `honcho_context`            | Biểu diễn đầy đủ về người dùng xuyên phiên              |
| `honcho_search_conclusions` | Tìm kiếm ngữ nghĩa trên các kết luận đã lưu             |
| `honcho_search_messages`    | Tìm tin nhắn xuyên phiên (lọc theo người gửi, ngày)     |
| `honcho_session`            | Lịch sử và tóm tắt phiên hiện tại                       |

**Hỏi đáp (do LLM hỗ trợ):**

| Công cụ      | Chức năng                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| `honcho_ask` | Hỏi về người dùng. `depth='quick'` cho sự kiện, `'thorough'` để tổng hợp |

## Bắt đầu

Cài đặt Plugin và chạy thiết lập:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Lệnh thiết lập sẽ nhắc bạn nhập thông tin xác thực API, ghi cấu hình và
tùy chọn di chuyển các tệp bộ nhớ workspace hiện có.

<Info>
Honcho có thể chạy hoàn toàn cục bộ (tự lưu trữ) hoặc qua API được quản lý tại
`api.honcho.dev`. Tùy chọn tự lưu trữ không yêu cầu phụ thuộc bên ngoài.
</Info>

## Cấu hình

Các thiết lập nằm trong `plugins.entries["openclaw-honcho"].config`:

```json5
{
  plugins: {
    entries: {
      "openclaw-honcho": {
        config: {
          apiKey: "your-api-key", // omit for self-hosted
          workspaceId: "openclaw", // memory isolation
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Với các phiên bản tự lưu trữ, trỏ `baseUrl` đến máy chủ cục bộ của bạn (ví dụ
`http://localhost:8000`) và bỏ qua khóa API.

## Di chuyển bộ nhớ hiện có

Nếu bạn có các tệp bộ nhớ workspace hiện có (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` sẽ phát hiện và
đề nghị di chuyển chúng.

<Info>
Việc di chuyển không phá hủy dữ liệu -- các tệp được tải lên Honcho. Bản gốc
không bao giờ bị xóa hoặc di chuyển.
</Info>

## Cách hoạt động

Sau mỗi lượt AI, cuộc trò chuyện được lưu giữ vào Honcho. Cả tin nhắn của người dùng
và tác tử đều được quan sát, cho phép Honcho xây dựng và tinh chỉnh các mô hình của mình theo
thời gian.

Trong cuộc trò chuyện, các công cụ Honcho truy vấn dịch vụ ở giai đoạn `before_prompt_build`,
chèn ngữ cảnh liên quan trước khi mô hình thấy prompt. Điều này đảm bảo
ranh giới lượt chính xác và khả năng hồi tưởng phù hợp.

## Honcho so với bộ nhớ tích hợp sẵn

|                   | Tích hợp sẵn / QMD          | Honcho                              |
| ----------------- | --------------------------- | ----------------------------------- |
| **Lưu trữ**       | Tệp Markdown trong workspace | Dịch vụ chuyên dụng (cục bộ hoặc lưu trữ) |
| **Xuyên phiên**   | Qua các tệp bộ nhớ          | Tự động, tích hợp sẵn               |
| **Mô hình hóa người dùng** | Thủ công (ghi vào MEMORY.md) | Hồ sơ tự động                  |
| **Tìm kiếm**      | Vector + từ khóa (lai)      | Ngữ nghĩa trên các quan sát         |
| **Đa tác tử**     | Không được theo dõi         | Nhận thức cha/con                   |
| **Phụ thuộc**     | Không có (tích hợp sẵn) hoặc tệp nhị phân QMD | Cài đặt Plugin          |

Honcho và hệ thống bộ nhớ tích hợp sẵn có thể hoạt động cùng nhau. Khi QMD được cấu hình,
các công cụ bổ sung sẽ khả dụng để tìm kiếm các tệp Markdown cục bộ song song với
bộ nhớ xuyên phiên của Honcho.

## Lệnh CLI

```bash
openclaw honcho setup                        # Configure API key and migrate files
openclaw honcho status                       # Check connection status
openclaw honcho ask <question>               # Query Honcho about the user
openclaw honcho search <query> [-k N] [-d D] # Semantic search over memory
```

## Đọc thêm

- [Mã nguồn Plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Tài liệu Honcho](https://docs.honcho.dev)
- [Hướng dẫn tích hợp Honcho OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)
- [Bộ nhớ](/vi/concepts/memory) -- tổng quan về bộ nhớ OpenClaw
- [Công cụ ngữ cảnh](/vi/concepts/context-engine) -- cách các công cụ ngữ cảnh của Plugin hoạt động

## Liên quan

- [Tổng quan bộ nhớ](/vi/concepts/memory)
- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin)
- [Công cụ bộ nhớ QMD](/vi/concepts/memory-qmd)
