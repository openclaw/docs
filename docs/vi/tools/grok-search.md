---
read_when:
    - Bạn muốn dùng Grok cho web_search
    - Bạn muốn dùng xAI OAuth hoặc XAI_API_KEY cho tìm kiếm web
summary: Tìm kiếm web Grok thông qua phản hồi dựa trên web của xAI
title: Tìm kiếm Grok
x-i18n:
    generated_at: "2026-06-27T18:16:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d18866f12648c5c194112633f6e888711cab83628dcc06ac58cb7801841a73b
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw hỗ trợ Grok làm nhà cung cấp `web_search`, sử dụng phản hồi dựa trên web của xAI để tạo câu trả lời do AI tổng hợp, được hỗ trợ bởi kết quả tìm kiếm trực tiếp kèm trích dẫn.

Tìm kiếm web Grok ưu tiên phiên đăng nhập OAuth xAI hiện có của bạn khi có sẵn. Nếu không có hồ sơ OAuth, cùng một khóa API xAI cũng có thể cấp nguồn cho công cụ `x_search` tích hợp để tìm kiếm bài đăng trên X (trước đây là Twitter) và công cụ `code_execution`. Nếu bạn lưu khóa trong `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw cũng tái sử dụng khóa đó làm phương án dự phòng cho nhà cung cấp mô hình xAI được đóng gói kèm.

Đối với các chỉ số cấp bài đăng của X như lượt đăng lại, trả lời, đánh dấu trang hoặc lượt xem, nên dùng `x_search` với URL bài đăng hoặc ID trạng thái chính xác thay vì một truy vấn tìm kiếm rộng.

## Onboarding và cấu hình

Nếu bạn chọn **Grok** trong:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw có thể dùng hồ sơ OAuth xAI hiện có mà không nhắc nhập khóa tìm kiếm web riêng. Nếu OAuth không khả dụng, OpenClaw sẽ quay về thiết lập bằng khóa API xAI. OpenClaw cũng có thể hiển thị một bước theo dõi riêng để bật `x_search` với cùng thông tin xác thực xAI. Bước theo dõi đó:

- chỉ xuất hiện sau khi bạn chọn Grok cho `web_search`
- không phải là một lựa chọn nhà cung cấp tìm kiếm web cấp cao riêng
- có thể tùy chọn đặt mô hình `x_search` trong cùng luồng

Nếu bỏ qua, bạn có thể bật hoặc thay đổi `x_search` sau trong cấu hình.

## Đăng nhập hoặc lấy khóa API

<Steps>
  <Step title="Dùng OAuth xAI">
    Nếu bạn đã đăng nhập bằng xAI trong quá trình onboarding hoặc xác thực mô hình, hãy chọn Grok làm nhà cung cấp `web_search`. Không cần khóa API riêng:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Dùng phương án dự phòng bằng khóa API">
    Lấy khóa API từ [xAI](https://console.x.ai/) khi OAuth không khả dụng hoặc bạn chủ động muốn cấu hình tìm kiếm web dựa trên khóa.
  </Step>
  <Step title="Lưu khóa">
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
            apiKey: "xai-...", // optional if xAI OAuth or XAI_API_KEY is available
            baseUrl: "https://api.x.ai/v1", // optional Responses API proxy/base URL override
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

**Các lựa chọn thông tin xác thực thay thế:** đăng nhập bằng `openclaw models auth login
--provider xai --method oauth`, đặt `XAI_API_KEY` trong môi trường Gateway, hoặc lưu `plugins.entries.xai.config.webSearch.apiKey`. Với bản cài đặt gateway, hãy đặt biến môi trường trong `~/.openclaw/.env`.

## Cách hoạt động

Grok sử dụng phản hồi dựa trên web của xAI để tổng hợp câu trả lời kèm trích dẫn nội tuyến, tương tự cách tiếp cận grounding bằng Google Search của Gemini.

## Tham số được hỗ trợ

Tìm kiếm Grok hỗ trợ `query`.

`count` được chấp nhận để tương thích với `web_search` dùng chung, nhưng Grok vẫn trả về một câu trả lời tổng hợp kèm trích dẫn thay vì danh sách N kết quả.

Các bộ lọc dành riêng cho nhà cung cấp hiện chưa được hỗ trợ.

Grok dùng thời gian chờ mặc định 60 giây dành riêng cho nhà cung cấp vì các tìm kiếm dựa trên web của xAI Responses có thể chạy lâu hơn mặc định `web_search` dùng chung. Đặt `tools.web.search.timeoutSeconds` để ghi đè.

## Ghi đè URL cơ sở

Đặt `plugins.entries.xai.config.webSearch.baseUrl` khi tìm kiếm web Grok cần định tuyến qua proxy của operator hoặc endpoint Responses tương thích với xAI. OpenClaw gửi POST đến `<baseUrl>/responses` sau khi cắt bỏ dấu gạch chéo ở cuối. `x_search` dùng cùng phương án dự phòng `webSearch.baseUrl` trừ khi `plugins.entries.xai.config.xSearch.baseUrl` được đặt.

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [x_search trong Web Search](/vi/tools/web#x_search) -- tìm kiếm X hạng nhất qua xAI
- [Tìm kiếm Gemini](/vi/tools/gemini-search) -- câu trả lời do AI tổng hợp thông qua grounding của Google
