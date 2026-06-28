---
read_when:
    - Bạn muốn sử dụng Kimi cho web_search
    - Bạn cần có KIMI_API_KEY hoặc MOONSHOT_API_KEY
summary: Tìm kiếm web Kimi thông qua tìm kiếm web Moonshot
title: Tìm kiếm Kimi
x-i18n:
    generated_at: "2026-05-02T10:55:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: e00dd963257cd40235ebf8375ddbc1ba0344b9b3a82886fbf0fcf975390c27f2
    source_path: tools/kimi-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw hỗ trợ Kimi làm nhà cung cấp `web_search`, sử dụng tìm kiếm web của Moonshot để tạo câu trả lời do AI tổng hợp kèm trích dẫn.

## Lấy khóa API

<Steps>
  <Step title="Tạo khóa">
    Lấy khóa API từ [Moonshot AI](https://platform.moonshot.cn/).
  </Step>
  <Step title="Lưu khóa">
    Đặt `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` trong môi trường Gateway, hoặc
    cấu hình qua:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

Khi bạn chọn **Kimi** trong `openclaw onboard` hoặc
`openclaw configure --section web`, OpenClaw cũng có thể hỏi về:

- khu vực API của Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- mô hình tìm kiếm web Kimi mặc định (mặc định là `kimi-k2.6`)

## Cấu hình

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

Nếu bạn dùng máy chủ API Trung Quốc cho chat (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw sẽ dùng lại cùng máy chủ đó cho Kimi
`web_search` khi bỏ qua `tools.web.search.kimi.baseUrl`, để các khóa từ
[platform.moonshot.cn](https://platform.moonshot.cn/) không vô tình truy cập
endpoint quốc tế (thường trả về HTTP 401). Ghi đè bằng
`tools.web.search.kimi.baseUrl` khi bạn cần URL cơ sở tìm kiếm khác.

**Phương án môi trường:** đặt `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` trong môi trường
Gateway. Với một bản cài đặt gateway, đặt khóa trong `~/.openclaw/.env`.

Nếu bỏ qua `baseUrl`, OpenClaw mặc định dùng `https://api.moonshot.ai/v1`.
Nếu bỏ qua `model`, OpenClaw mặc định dùng `kimi-k2.6`.

## Cách hoạt động

Kimi dùng tìm kiếm web của Moonshot để tổng hợp câu trả lời kèm trích dẫn nội tuyến,
tương tự cách tiếp cận phản hồi có căn cứ của Gemini và Grok.

OpenClaw chỉ xem Kimi `web_search` là thành công sau khi Moonshot trả về bằng chứng căn cứ tìm kiếm web gốc, chẳng hạn như payload công cụ `$web_search` có thể phát lại, `search_results`, hoặc các URL trích dẫn. Nếu Kimi dừng ngay với một câu trả lời chat thuần túy như "Tôi không thể duyệt internet" và không có bằng chứng căn cứ, OpenClaw trả về lỗi có cấu trúc `kimi_web_search_ungrounded` thay vì bọc văn bản đó thành kết quả tìm kiếm. Hãy thử lại truy vấn, chuyển sang một nhà cung cấp có cấu trúc như Brave, hoặc dùng `web_fetch` / công cụ trình duyệt khi bạn đã có URL đích.

## Tham số được hỗ trợ

Tìm kiếm Kimi hỗ trợ `query`.

`count` được chấp nhận để tương thích với `web_search` dùng chung, nhưng Kimi vẫn trả về một câu trả lời tổng hợp kèm trích dẫn thay vì danh sách N kết quả.

Các bộ lọc riêng cho từng nhà cung cấp hiện chưa được hỗ trợ.

## Liên quan

- [Tổng quan Tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Moonshot AI](/vi/providers/moonshot) -- tài liệu về mô hình Moonshot và nhà cung cấp Kimi Coding
- [Tìm kiếm Gemini](/vi/tools/gemini-search) -- câu trả lời do AI tổng hợp qua căn cứ của Google
- [Tìm kiếm Grok](/vi/tools/grok-search) -- câu trả lời do AI tổng hợp qua căn cứ của xAI
