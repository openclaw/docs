---
read_when:
    - Bạn muốn có bộ nhớ bền vững hoạt động xuyên suốt các phiên và kênh
    - Bạn muốn khả năng ghi nhớ và lập mô hình người dùng dựa trên AI
summary: Bộ nhớ xuyên phiên hoạt động gốc với AI thông qua plugin Honcho
title: Bộ nhớ Honcho
x-i18n:
    generated_at: "2026-07-12T07:48:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fadcf6d8e2505ab4fe6a81340695b7c8fee49c3cb4889665af13389941619117
    source_path: concepts/memory-honcho.md
    workflow: 16
---

[Honcho](https://honcho.dev) bổ sung bộ nhớ tích hợp AI cho OpenClaw thông qua một
Plugin bên ngoài. Plugin này lưu giữ lâu dài các cuộc hội thoại trong một dịch vụ chuyên dụng và xây dựng
mô hình người dùng cũng như tác nhân theo thời gian, cung cấp cho tác nhân ngữ cảnh xuyên phiên
vượt ra ngoài các tệp Markdown trong không gian làm việc.

## Các tính năng được cung cấp

- **Bộ nhớ xuyên phiên** - các cuộc hội thoại được lưu giữ sau mỗi lượt, nhờ đó
  ngữ cảnh được duy trì qua các lần đặt lại phiên, Compaction và chuyển đổi kênh.
- **Mô hình hóa người dùng** - Honcho duy trì một hồ sơ cho từng người dùng (tùy chọn,
  dữ kiện, phong cách giao tiếp) và cho tác nhân (tính cách, các hành vi
  đã học).
- **Tìm kiếm ngữ nghĩa** - tìm kiếm trong các quan sát từ những cuộc hội thoại trước đây, không
  chỉ trong phiên hiện tại.
- **Nhận biết đa tác nhân** - các tác nhân cha tự động theo dõi những
  tác nhân con được tạo, đồng thời tác nhân cha được thêm làm bên quan sát trong các phiên con.

## Công cụ có sẵn

Honcho đăng ký các công cụ mà tác nhân có thể sử dụng trong cuộc hội thoại:

**Truy xuất dữ liệu (nhanh, không gọi LLM):**

| Công cụ                     | Chức năng                                                        |
| --------------------------- | ---------------------------------------------------------------- |
| `honcho_context`            | Biểu diễn đầy đủ về người dùng trên nhiều phiên                   |
| `honcho_search_conclusions` | Tìm kiếm ngữ nghĩa trong các kết luận đã lưu                      |
| `honcho_search_messages`    | Tìm tin nhắn trên nhiều phiên (lọc theo người gửi, ngày)          |
| `honcho_session`            | Lịch sử và bản tóm tắt của phiên hiện tại                         |

**Hỏi đáp (do LLM hỗ trợ):**

| Công cụ     | Chức năng                                                                       |
| ----------- | ------------------------------------------------------------------------------- |
| `honcho_ask` | Hỏi về người dùng. Dùng `depth='quick'` cho dữ kiện, `'thorough'` để tổng hợp |

## Bắt đầu

Cài đặt Plugin và chạy thiết lập:

```bash
openclaw plugins install @honcho-ai/openclaw-honcho
openclaw honcho setup
openclaw gateway --force
```

Lệnh thiết lập sẽ yêu cầu thông tin xác thực API của bạn, ghi cấu hình và
tùy chọn di chuyển các tệp bộ nhớ hiện có trong không gian làm việc.

<Info>
Honcho có thể chạy hoàn toàn cục bộ (tự lưu trữ) hoặc thông qua API được quản lý tại
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
          apiKey: "your-api-key", // bỏ qua khi tự lưu trữ
          workspaceId: "openclaw", // cô lập bộ nhớ
          baseUrl: "https://api.honcho.dev",
        },
      },
    },
  },
}
```

Đối với các phiên bản tự lưu trữ, hãy đặt `baseUrl` trỏ đến máy chủ cục bộ của bạn (ví dụ
`http://localhost:8000`) và bỏ qua khóa API.

## Di chuyển bộ nhớ hiện có

Nếu bạn có các tệp bộ nhớ hiện có trong không gian làm việc (`USER.md`, `MEMORY.md`,
`IDENTITY.md`, `memory/`, `canvas/`), `openclaw honcho setup` sẽ phát hiện và
đề nghị di chuyển chúng.

<Info>
Quá trình di chuyển không gây mất dữ liệu - các tệp được tải lên Honcho. Các tệp gốc
không bao giờ bị xóa hoặc di chuyển.
</Info>

## Cách hoạt động

Sau mỗi lượt AI, cuộc hội thoại được lưu giữ lâu dài trong Honcho. Cả tin nhắn của người dùng và
tác nhân đều được quan sát, cho phép Honcho xây dựng và tinh chỉnh các mô hình của mình theo
thời gian.

Trong cuộc hội thoại, các công cụ Honcho truy vấn dịch vụ tại hook Plugin
`before_prompt_build` của OpenClaw, chèn ngữ cảnh liên quan trước khi mô hình
nhận được lời nhắc.

## Honcho so với bộ nhớ tích hợp sẵn

|                   | Tích hợp sẵn / QMD                 | Honcho                                  |
| ----------------- | ---------------------------------- | --------------------------------------- |
| **Lưu trữ**       | Các tệp Markdown trong không gian làm việc | Dịch vụ chuyên dụng (cục bộ hoặc được lưu trữ) |
| **Xuyên phiên**   | Thông qua các tệp bộ nhớ           | Tự động, tích hợp sẵn                   |
| **Mô hình hóa người dùng** | Thủ công (ghi vào MEMORY.md) | Hồ sơ tự động                           |
| **Tìm kiếm**      | Vectơ + từ khóa (kết hợp)          | Ngữ nghĩa trên các quan sát             |
| **Đa tác nhân**   | Không được theo dõi                | Nhận biết quan hệ cha/con               |
| **Phụ thuộc**     | Không có (tích hợp sẵn) hoặc tệp nhị phân QMD | Cài đặt Plugin                  |

Honcho và hệ thống bộ nhớ tích hợp sẵn có thể hoạt động cùng nhau. Khi QMD được
cấu hình, các công cụ bổ sung sẽ khả dụng để tìm kiếm các tệp Markdown cục bộ
cùng với bộ nhớ xuyên phiên của Honcho.

## Các lệnh CLI

```bash
openclaw honcho setup                        # Cấu hình khóa API và di chuyển tệp
openclaw honcho status                       # Kiểm tra trạng thái kết nối
openclaw honcho ask <question>               # Truy vấn Honcho về người dùng
openclaw honcho search <query> [-k N] [-d D] # Tìm kiếm ngữ nghĩa trong bộ nhớ
```

## Đọc thêm

- [Mã nguồn Plugin](https://github.com/plastic-labs/openclaw-honcho)
- [Tài liệu Honcho](https://docs.honcho.dev)
- [Hướng dẫn tích hợp Honcho với OpenClaw](https://docs.honcho.dev/v3/guides/integrations/openclaw)

## Nội dung liên quan

- [Tổng quan về bộ nhớ](/vi/concepts/memory)
- [Công cụ bộ nhớ tích hợp sẵn](/vi/concepts/memory-builtin)
- [Công cụ bộ nhớ QMD](/vi/concepts/memory-qmd)
- [Công cụ ngữ cảnh](/vi/concepts/context-engine)
