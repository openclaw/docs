---
read_when:
    - Bạn muốn một nhà cung cấp dịch vụ tìm kiếm web không yêu cầu khóa API
    - Bạn muốn sử dụng DuckDuckGo cho web_search
    - Bạn muốn một nhà cung cấp tìm kiếm không cần khóa được chọn rõ ràng
summary: Tìm kiếm web DuckDuckGo -- nhà cung cấp không cần khóa (thử nghiệm, dựa trên HTML)
title: Tìm kiếm DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T08:29:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw hỗ trợ DuckDuckGo làm nhà cung cấp `web_search` **không cần khóa**. Không yêu cầu khóa API hoặc tài khoản.

<Warning>
  DuckDuckGo là một tích hợp **thử nghiệm, không chính thức**, thu thập dữ liệu từ các trang tìm kiếm HTML không dùng JavaScript của DuckDuckGo — không phải API chính thức. Có thể đôi khi xảy ra lỗi do các trang xác minh bot hoặc thay đổi HTML.
</Warning>

## Thiết lập

DuckDuckGo không bao giờ được tự động chọn vì tính năng tự động phát hiện chỉ xem xét các nhà cung cấp có thông tin xác thực khả dụng. Hãy thiết lập rõ ràng:

<Steps>
  <Step title="Cấu hình">
    ```bash
    openclaw configure --section web
    # Chọn "duckduckgo" làm nhà cung cấp
    ```
  </Step>
</Steps>

## Cấu hình

Thiết lập trực tiếp nhà cung cấp trong cấu hình:

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

Các thiết lập tùy chọn ở cấp Plugin cho khu vực và SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // Mã khu vực DuckDuckGo
            safeSearch: "moderate", // "strict", "moderate" hoặc "off"
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
Số kết quả cần trả về (1-10).
</ParamField>

<ParamField path="region" type="string">
Mã khu vực DuckDuckGo (ví dụ: `us-en`, `uk-en`, `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
Mức SafeSearch.
</ParamField>

Các tham số công cụ `region` và `safeSearch` ghi đè các giá trị cấu hình Plugin ở trên cho từng truy vấn.

## Ghi chú

- **Không cần khóa API** — hoạt động sau khi DuckDuckGo được chọn làm nhà cung cấp `web_search`.
- **Thử nghiệm** — thu thập dữ liệu từ các trang tìm kiếm HTML không dùng JavaScript của DuckDuckGo, không phải API hoặc SDK chính thức. Kết quả phụ thuộc vào cấu trúc trang, vốn có thể thay đổi mà không báo trước.
- **Rủi ro xác minh bot** — DuckDuckGo có thể hiển thị CAPTCHA hoặc chặn yêu cầu khi mức sử dụng cao hoặc mang tính tự động.
- **Chỉ chọn thủ công** — tính năng tự động phát hiện của OpenClaw chỉ xem xét các nhà cung cấp có thông tin xác thực khả dụng, vì vậy nhà cung cấp không cần khóa như DuckDuckGo không bao giờ được chọn tự động; bạn phải thiết lập `provider: "duckduckgo"`.
- **SafeSearch mặc định là `moderate`** khi chưa được cấu hình.

<Tip>
  Để sử dụng trong môi trường sản xuất, hãy cân nhắc [Brave Search](/vi/tools/brave-search) (có gói miễn phí) hoặc một nhà cung cấp khác dựa trên API.
</Tip>

## Liên quan

- [Tổng quan về Tìm kiếm web](/vi/tools/web) — tất cả nhà cung cấp và tính năng tự động phát hiện
- [Brave Search](/vi/tools/brave-search) — kết quả có cấu trúc với gói miễn phí
- [Exa Search](/vi/tools/exa-search) — tìm kiếm nơ-ron kèm trích xuất nội dung
