---
read_when:
    - Bạn muốn một nhà cung cấp dịch vụ tìm kiếm trên web không yêu cầu khóa API
    - Bạn muốn sử dụng DuckDuckGo cho web_search
    - Bạn cần một phương án dự phòng tìm kiếm không cần cấu hình
summary: Tìm kiếm web DuckDuckGo -- nhà cung cấp dự phòng không cần khóa API (thử nghiệm, dựa trên HTML)
title: Tìm kiếm DuckDuckGo
x-i18n:
    generated_at: "2026-04-29T23:17:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw hỗ trợ DuckDuckGo làm nhà cung cấp `web_search` **không cần khóa**. Không cần khóa API
hoặc tài khoản.

<Warning>
  DuckDuckGo là một tích hợp **thử nghiệm, không chính thức** lấy kết quả
  từ các trang tìm kiếm không dùng JavaScript của DuckDuckGo — không phải API chính thức. Có thể
  thỉnh thoảng bị hỏng do các trang thử thách bot hoặc thay đổi HTML.
</Warning>

## Thiết lập

Không cần khóa API — chỉ cần đặt DuckDuckGo làm nhà cung cấp của bạn:

<Steps>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## Cấu hình

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

Các thiết lập tùy chọn cấp Plugin cho khu vực và SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## Tham số công cụ

<ParamField path="query" type="string" required>
Truy vấn tìm kiếm.
</ParamField>

<ParamField path="count" type="number" default="5">
Số kết quả trả về (1–10).
</ParamField>

<ParamField path="region" type="string">
Mã khu vực DuckDuckGo (ví dụ `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Mức SafeSearch.
</ParamField>

Khu vực và SafeSearch cũng có thể được đặt trong cấu hình Plugin (xem ở trên) — các tham số
công cụ sẽ ghi đè giá trị cấu hình cho từng truy vấn.

## Ghi chú

- **Không cần khóa API** — hoạt động ngay, không cần cấu hình
- **Thử nghiệm** — thu thập kết quả từ các trang tìm kiếm HTML không dùng JavaScript
  của DuckDuckGo, không phải API hoặc SDK chính thức
- **Rủi ro thử thách bot** — DuckDuckGo có thể phục vụ CAPTCHA hoặc chặn yêu cầu
  khi sử dụng nhiều hoặc tự động hóa
- **Phân tích cú pháp HTML** — kết quả phụ thuộc vào cấu trúc trang, vốn có thể thay đổi mà không
  báo trước
- **Thứ tự tự động phát hiện** — DuckDuckGo là phương án dự phòng không cần khóa đầu tiên
  (thứ tự 100) trong tự động phát hiện. Các nhà cung cấp dựa trên API có khóa đã cấu hình sẽ chạy
  trước, sau đó là Ollama Web Search (thứ tự 110), rồi SearXNG (thứ tự 200)
- **SafeSearch mặc định là moderate** khi chưa được cấu hình

<Tip>
  Để dùng trong sản xuất, hãy cân nhắc [Brave Search](/vi/tools/brave-search) (có gói miễn phí)
  hoặc một nhà cung cấp dựa trên API khác.
</Tip>

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Brave Search](/vi/tools/brave-search) -- kết quả có cấu trúc với gói miễn phí
- [Exa Search](/vi/tools/exa-search) -- tìm kiếm nơ-ron với trích xuất nội dung
