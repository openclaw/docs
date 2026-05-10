---
read_when:
    - Bạn muốn sử dụng Grok cho web_search
    - Bạn cần XAI_API_KEY để tìm kiếm trên web
summary: Tìm kiếm web bằng Grok thông qua các phản hồi dựa trên web của xAI
title: Tìm kiếm Grok
x-i18n:
    generated_at: "2026-05-10T19:53:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91220e1f9d3fb998d8270af5d5e9e2e47658688de00be0bab7a265910acef478
    source_path: tools/grok-search.md
    workflow: 16
---

OpenClaw hỗ trợ Grok làm nhà cung cấp `web_search`, sử dụng phản hồi
dựa trên web của xAI để tạo câu trả lời do AI tổng hợp, được hỗ trợ bởi
kết quả tìm kiếm trực tiếp kèm trích dẫn.

Cùng một khóa API xAI cũng có thể cấp nguồn cho công cụ `x_search` tích hợp sẵn
để tìm kiếm bài đăng trên X (trước đây là Twitter) và công cụ `code_execution`.
Nếu bạn lưu khóa trong `plugins.entries.xai.config.webSearch.apiKey`, OpenClaw
giờ đây cũng tái sử dụng khóa đó làm phương án dự phòng cho nhà cung cấp mô hình
xAI đi kèm.

Đối với các chỉ số cấp bài đăng trên X như đăng lại, trả lời, dấu trang hoặc
lượt xem, hãy ưu tiên `x_search` với URL bài đăng hoặc ID trạng thái chính xác
thay vì một truy vấn tìm kiếm rộng.

## Tiếp nhận ban đầu và cấu hình

Nếu bạn chọn **Grok** trong:

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw có thể hiển thị một bước tiếp theo riêng để bật `x_search` với cùng
`XAI_API_KEY`. Bước tiếp theo đó:

- chỉ xuất hiện sau khi bạn chọn Grok cho `web_search`
- không phải là một lựa chọn nhà cung cấp tìm kiếm web cấp cao riêng biệt
- có thể tùy chọn đặt mô hình `x_search` trong cùng luồng đó

Nếu bỏ qua, bạn có thể bật hoặc thay đổi `x_search` sau trong cấu hình.

## Lấy khóa API

<Steps>
  <Step title="Tạo khóa">
    Lấy khóa API từ [xAI](https://console.x.ai/).
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
            apiKey: "xai-...", // optional if XAI_API_KEY is set
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

**Phương án thay thế bằng môi trường:** đặt `XAI_API_KEY` trong môi trường Gateway.
Với một bản cài đặt gateway, hãy đặt khóa trong `~/.openclaw/.env`.

## Cách hoạt động

Grok sử dụng phản hồi dựa trên web của xAI để tổng hợp câu trả lời với trích dẫn
nội tuyến, tương tự cách tiếp cận dựa trên Google Search của Gemini.

## Tham số được hỗ trợ

Tìm kiếm Grok hỗ trợ `query`.

`count` được chấp nhận để tương thích với `web_search` dùng chung, nhưng Grok vẫn
trả về một câu trả lời tổng hợp kèm trích dẫn thay vì danh sách N kết quả.

Các bộ lọc dành riêng cho nhà cung cấp hiện chưa được hỗ trợ.

Grok dùng thời gian chờ mặc định 60 giây riêng cho nhà cung cấp vì các tìm kiếm
dựa trên web của xAI Responses có thể chạy lâu hơn mặc định `web_search` dùng
chung. Đặt `tools.web.search.timeoutSeconds` để ghi đè.

## Ghi đè URL cơ sở

Đặt `plugins.entries.xai.config.webSearch.baseUrl` khi tìm kiếm web Grok cần
định tuyến qua proxy của đơn vị vận hành hoặc điểm cuối Responses tương thích
với xAI. OpenClaw gửi yêu cầu đến `<baseUrl>/responses` sau khi cắt dấu gạch chéo
ở cuối. `x_search` dùng cùng phương án dự phòng `webSearch.baseUrl` trừ khi
`plugins.entries.xai.config.xSearch.baseUrl` được đặt.

## Liên quan

- [Tổng quan Tìm kiếm Web](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [`x_search` trong Tìm kiếm Web](/vi/tools/web#x_search) -- tìm kiếm X hạng nhất qua xAI
- [Tìm kiếm Gemini](/vi/tools/gemini-search) -- câu trả lời do AI tổng hợp qua nền tảng Google
