---
read_when:
    - Bạn muốn một nhà cung cấp tìm kiếm web không yêu cầu khóa API
    - Bạn muốn sử dụng DuckDuckGo cho web_search
    - Bạn muốn một nhà cung cấp tìm kiếm không cần khóa được chọn rõ ràng
summary: Tìm kiếm web DuckDuckGo -- nhà cung cấp không cần khóa (thử nghiệm, dựa trên HTML)
title: Tìm kiếm DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:14:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw hỗ trợ DuckDuckGo làm nhà cung cấp `web_search` **không cần khóa**. Không cần khóa API hoặc tài khoản.

<Warning>
  DuckDuckGo là một tích hợp **thử nghiệm, không chính thức** lấy kết quả
  từ các trang tìm kiếm không dùng JavaScript của DuckDuckGo - không phải API chính thức. Hãy dự kiến
  đôi khi có lỗi do trang bot-challenge hoặc thay đổi HTML.
</Warning>

## Thiết lập

Không cần khóa API - chỉ cần đặt DuckDuckGo làm nhà cung cấp của bạn:

<Steps>
  <Step title="Cấu hình">
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

Các cài đặt tùy chọn ở cấp plugin cho khu vực và SafeSearch:

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
Số kết quả trả về (1-10).
</ParamField>

<ParamField path="region" type="string">
Mã khu vực DuckDuckGo (ví dụ: `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Mức SafeSearch.
</ParamField>

Khu vực và SafeSearch cũng có thể được đặt trong cấu hình plugin (xem ở trên) - các
tham số công cụ sẽ ghi đè giá trị cấu hình cho từng truy vấn.

## Ghi chú

- **Không cần khóa API** - hoạt động sau khi bạn chọn DuckDuckGo làm nhà cung cấp
  `web_search`
- **Thử nghiệm** - thu thập kết quả từ các trang tìm kiếm HTML không dùng JavaScript
  của DuckDuckGo, không phải API hoặc SDK chính thức
- **Rủi ro bot-challenge** - DuckDuckGo có thể cung cấp CAPTCHA hoặc chặn yêu cầu
  khi sử dụng nhiều hoặc tự động
- **Phân tích cú pháp HTML** - kết quả phụ thuộc vào cấu trúc trang, vốn có thể thay đổi mà không
  thông báo
- **Chọn rõ ràng** - OpenClaw không tự động chọn DuckDuckGo
  khi chưa cấu hình nhà cung cấp dựa trên API
- **SafeSearch mặc định ở mức vừa phải** khi chưa cấu hình

<Tip>
  Để sử dụng trong sản xuất, hãy cân nhắc [Brave Search](/vi/tools/brave-search) (có
  gói miễn phí) hoặc một nhà cung cấp dựa trên API khác.
</Tip>

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Brave Search](/vi/tools/brave-search) -- kết quả có cấu trúc với gói miễn phí
- [Exa Search](/vi/tools/exa-search) -- tìm kiếm neural với trích xuất nội dung
