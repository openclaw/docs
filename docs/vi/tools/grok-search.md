---
read_when:
    - Bạn muốn sử dụng Grok cho web_search
    - Bạn muốn sử dụng OAuth của xAI hoặc `XAI_API_KEY` để tìm kiếm trên web
summary: Tìm kiếm web bằng Grok thông qua các phản hồi của xAI dựa trên dữ liệu web
title: Tìm kiếm Grok
x-i18n:
    generated_at: "2026-07-12T08:30:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e39edd660d0ffe8be066ae81317810da691a7dbd8c59a74222a59145cff5c77
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw hỗ trợ Grok làm nhà cung cấp `web_search`, sử dụng các phản hồi của xAI có căn cứ từ web để tạo ra câu trả lời do AI tổng hợp, dựa trên kết quả tìm kiếm trực tiếp kèm trích dẫn.

Tìm kiếm web Grok ưu tiên sử dụng phiên đăng nhập OAuth xAI hiện có nếu khả dụng. Nếu không có hồ sơ OAuth, cùng một khóa API xAI cũng vận hành công cụ `x_search` tích hợp để tìm kiếm bài đăng trên X (trước đây là Twitter) và công cụ `code_execution`. Việc lưu khóa tại `plugins.entries.xai.config.webSearch.apiKey` cũng cho phép OpenClaw tái sử dụng khóa đó làm phương án dự phòng cho nhà cung cấp mô hình xAI đi kèm.

Đối với các chỉ số ở cấp bài đăng trên X (lượt đăng lại, lượt trả lời, lượt đánh dấu, lượt xem), hãy sử dụng [`x_search`](/vi/tools/web#x_search) với URL chính xác của bài đăng hoặc ID trạng thái thay vì một truy vấn tìm kiếm rộng.

## Tiếp nhận ban đầu và cấu hình

Việc chọn **Grok** trong `openclaw onboard` hoặc `openclaw configure --section
web` cho phép OpenClaw tái sử dụng hồ sơ OAuth xAI hiện có mà không yêu cầu khóa tìm kiếm web riêng. Nếu không có OAuth, hệ thống sẽ chuyển sang thiết lập bằng khóa API xAI.

Sau đó, OpenClaw cung cấp một bước tiếp theo để bật `x_search` bằng cùng thông tin xác thực xAI. Bước tiếp theo này:

- chỉ xuất hiện sau khi bạn chọn Grok cho `web_search`
- không phải là một lựa chọn nhà cung cấp tìm kiếm web cấp cao nhất riêng biệt
- có thể tùy chọn đặt mô hình `x_search` trong cùng quy trình

Hãy bỏ qua bước này để bật hoặc thay đổi `x_search` trong cấu hình sau.

## Đăng nhập hoặc lấy khóa API

<Steps>
  <Step title="Sử dụng OAuth xAI">
    Nếu bạn đã đăng nhập bằng xAI trong quá trình tiếp nhận ban đầu hoặc xác thực mô hình, hãy chọn
    Grok làm nhà cung cấp `web_search`. Không cần khóa API riêng:

    ```bash
    openclaw onboard --auth-choice xai-oauth
    openclaw config set tools.web.search.provider grok
    ```

  </Step>
  <Step title="Sử dụng khóa API dự phòng">
    Lấy khóa API từ [xAI](https://console.x.ai/) khi OAuth không khả dụng
    hoặc khi bạn chủ ý muốn sử dụng cấu hình tìm kiếm web dựa trên khóa.
  </Step>
  <Step title="Lưu khóa">
    Đặt `XAI_API_KEY` trong môi trường Gateway hoặc cấu hình qua:

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
            apiKey: "xai-...", // không bắt buộc nếu có OAuth xAI hoặc XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // tùy chọn ghi đè URL cơ sở/proxy của Responses API
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

**Các phương án thông tin xác thực:** `openclaw models auth login --provider xai
--method oauth`, `XAI_API_KEY` trong môi trường Gateway hoặc
`plugins.entries.xai.config.webSearch.apiKey`. Đối với bản cài đặt gateway, hãy đặt các biến môi trường trong `~/.openclaw/.env`.

## Cách hoạt động

Grok sử dụng các phản hồi của xAI có căn cứ từ web để tổng hợp câu trả lời kèm trích dẫn nội dòng, tương tự phương pháp tạo căn cứ bằng Google Search của Gemini.

## Các tham số được hỗ trợ

Tìm kiếm Grok hỗ trợ `query`. `count` được chấp nhận để tương thích với `web_search` dùng chung, nhưng Grok luôn trả về một câu trả lời tổng hợp kèm trích dẫn thay vì danh sách gồm N kết quả. Các bộ lọc dành riêng cho nhà cung cấp không được hỗ trợ.

Grok mặc định có thời gian chờ 60 giây vì các lượt tìm kiếm có căn cứ từ web bằng Responses của xAI có thể chạy lâu hơn thời gian chờ mặc định dùng chung của `web_search`. Ghi đè bằng `tools.web.search.timeoutSeconds`.

## Ghi đè URL cơ sở

Đặt `plugins.entries.xai.config.webSearch.baseUrl` để định tuyến tìm kiếm web Grok qua proxy của đơn vị vận hành hoặc điểm cuối Responses tương thích với xAI. OpenClaw gửi yêu cầu POST đến `<baseUrl>/responses` sau khi loại bỏ các dấu gạch chéo ở cuối. `x_search` sử dụng cùng `webSearch.baseUrl` làm phương án dự phòng trừ khi `plugins.entries.xai.config.xSearch.baseUrl` được đặt.

## Liên quan

- [Tổng quan về Tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [x_search trong Tìm kiếm web](/vi/tools/web#x_search) -- tìm kiếm X hạng nhất thông qua xAI
- [Tìm kiếm Gemini](/vi/tools/gemini-search) -- câu trả lời do AI tổng hợp thông qua cơ chế tạo căn cứ của Google
