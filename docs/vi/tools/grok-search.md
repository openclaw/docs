---
read_when:
    - Bạn muốn sử dụng Grok cho web_search
    - Bạn cần XAI_API_KEY để tìm kiếm trên web
summary: Tìm kiếm web bằng Grok thông qua phản hồi có căn cứ từ web của xAI
title: Tìm kiếm Grok
x-i18n:
    generated_at: "2026-04-29T23:18:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37e13e7210f0b008616e27ea08d38b4f1efe89d3c4f82a61aaac944a1e1dd0af
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw hỗ trợ Grok làm nhà cung cấp `web_search`, sử dụng phản hồi dựa trên web của xAI để tạo câu trả lời do AI tổng hợp, được hỗ trợ bởi kết quả tìm kiếm trực tiếp kèm trích dẫn.

Cùng một `XAI_API_KEY` cũng có thể cấp nguồn cho công cụ `x_search` tích hợp sẵn để tìm kiếm bài đăng trên X (trước đây là Twitter). Nếu bạn lưu khóa trong `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw hiện cũng tái sử dụng khóa đó làm phương án dự phòng cho nhà cung cấp mô hình xAI đi kèm.

Đối với các chỉ số X ở cấp bài đăng như lượt đăng lại, lượt trả lời, lượt đánh dấu, hoặc lượt xem, hãy ưu tiên dùng `x_search` với URL bài đăng hoặc ID trạng thái chính xác thay vì truy vấn tìm kiếm rộng.

## Thiết lập ban đầu và cấu hình

Nếu bạn chọn **Grok** trong khi:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw có thể hiển thị một bước tiếp theo riêng để bật `x_search` bằng cùng `XAI_API_KEY`. Bước tiếp theo đó:

- chỉ xuất hiện sau khi bạn chọn Grok cho `web_search`
- không phải là một lựa chọn nhà cung cấp tìm kiếm web cấp cao riêng biệt
- có thể tùy chọn đặt mô hình `x_search` trong cùng luồng

Nếu bạn bỏ qua bước này, bạn có thể bật hoặc thay đổi `x_search` sau trong cấu hình.

## Lấy khóa API

<Steps>
  <Step title="Create a key">
    Lấy khóa API từ [xAI](https://console.x.ai/).
  </Step>
  <Step title="Store the key">
    Đặt `XAI_API_KEY` trong môi trường Gateway, hoặc cấu hình qua:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## Cấu hình

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // optional if XAI_API_KEY is set
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**Phương án môi trường thay thế:** đặt `XAI_API_KEY` trong môi trường Gateway.
Đối với một bản cài đặt Gateway, hãy đặt khóa trong `~/.openclaw/.env`.

## Cách hoạt động

Grok sử dụng phản hồi dựa trên web của xAI để tổng hợp câu trả lời với trích dẫn nội tuyến, tương tự cách tiếp cận dựa trên Google Search của Gemini.

## Tham số được hỗ trợ

Tìm kiếm Grok hỗ trợ `query`.

`count` được chấp nhận để tương thích với `web_search` dùng chung, nhưng Grok vẫn trả về một câu trả lời tổng hợp kèm trích dẫn thay vì danh sách N kết quả.

Bộ lọc riêng theo nhà cung cấp hiện chưa được hỗ trợ.

## Liên quan

- [Tổng quan Tìm kiếm Web](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [x_search trong Tìm kiếm Web](/vi/tools/web#x_search) -- tìm kiếm X hạng nhất qua xAI
- [Tìm kiếm Gemini](/vi/tools/gemini-search) -- câu trả lời do AI tổng hợp qua nền tảng Google
