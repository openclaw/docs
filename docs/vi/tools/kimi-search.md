---
read_when:
    - Bạn muốn sử dụng Kimi cho web_search
    - Bạn cần KIMI_API_KEY hoặc MOONSHOT_API_KEY
summary: Tìm kiếm trên mạng của Kimi qua tìm kiếm trên mạng của Moonshot
title: Tìm kiếm Kimi
x-i18n:
    generated_at: "2026-04-29T23:19:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 16
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
`openclaw configure --section web`, OpenClaw cũng có thể hỏi:

- vùng API của Moonshot:
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

Nếu bạn dùng máy chủ API Trung Quốc cho trò chuyện (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`), OpenClaw sẽ dùng lại cùng máy chủ đó cho Kimi
`web_search` khi bỏ qua `tools.web.search.kimi.baseUrl`, để khóa từ
[platform.moonshot.cn](https://platform.moonshot.cn/) không vô tình truy cập
endpoint quốc tế (thường trả về HTTP 401). Ghi đè bằng
`tools.web.search.kimi.baseUrl` khi bạn cần một URL cơ sở tìm kiếm khác.

**Phương án thay thế bằng môi trường:** đặt `KIMI_API_KEY` hoặc `MOONSHOT_API_KEY` trong
môi trường Gateway. Với bản cài đặt gateway, đặt khóa trong `~/.openclaw/.env`.

Nếu bạn bỏ qua `baseUrl`, OpenClaw mặc định dùng `https://api.moonshot.ai/v1`.
Nếu bạn bỏ qua `model`, OpenClaw mặc định dùng `kimi-k2.6`.

## Cách hoạt động

Kimi sử dụng tìm kiếm web của Moonshot để tổng hợp câu trả lời kèm trích dẫn nội tuyến,
tương tự cách tiếp cận phản hồi có căn cứ của Gemini và Grok.

## Tham số được hỗ trợ

Tìm kiếm Kimi hỗ trợ `query`.

`count` được chấp nhận để tương thích với `web_search` dùng chung, nhưng Kimi vẫn
trả về một câu trả lời được tổng hợp kèm trích dẫn thay vì danh sách N kết quả.

Bộ lọc dành riêng cho nhà cung cấp hiện chưa được hỗ trợ.

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Moonshot AI](/vi/providers/moonshot) -- tài liệu nhà cung cấp mô hình Moonshot + Kimi Coding
- [Gemini Search](/vi/tools/gemini-search) -- câu trả lời do AI tổng hợp qua căn cứ Google
- [Grok Search](/vi/tools/grok-search) -- câu trả lời do AI tổng hợp qua căn cứ xAI
