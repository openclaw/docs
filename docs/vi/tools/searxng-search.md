---
read_when:
    - Bạn muốn một nhà cung cấp tìm kiếm web tự lưu trữ
    - Bạn muốn dùng SearXNG cho web_search
    - Bạn cần một tùy chọn tìm kiếm tập trung vào quyền riêng tư hoặc tách biệt mạng
summary: Tìm kiếm web SearXNG -- nhà cung cấp siêu tìm kiếm tự lưu trữ, không cần khóa
title: Tìm kiếm SearXNG
x-i18n:
    generated_at: "2026-06-27T18:18:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4bd00a20e45f71b7bd855a6588d5c829a0202839fc93ddcec1e255b7858ff183
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw hỗ trợ [SearXNG](https://docs.searxng.org/) làm nhà cung cấp `web_search` **tự lưu trữ,
không cần khóa**. SearXNG là một công cụ siêu tìm kiếm mã nguồn mở
tổng hợp kết quả từ Google, Bing, DuckDuckGo và các nguồn khác.

Ưu điểm:

- **Miễn phí và không giới hạn** -- không cần khóa API hoặc gói đăng ký thương mại
- **Quyền riêng tư / cách ly mạng** -- truy vấn không bao giờ rời khỏi mạng của bạn
- **Hoạt động ở mọi nơi** -- không có giới hạn khu vực của API tìm kiếm thương mại

## Thiết lập

<Steps>
  <Step title="Cài đặt plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Chạy một phiên bản SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Hoặc dùng bất kỳ bản triển khai SearXNG hiện có nào mà bạn có quyền truy cập. Xem
    [tài liệu SearXNG](https://docs.searxng.org/) để biết cách thiết lập cho môi trường production.

  </Step>
  <Step title="Cấu hình">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Hoặc đặt biến môi trường và để cơ chế tự động phát hiện tìm thấy nó:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## Cấu hình

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

Thiết lập cấp Plugin cho phiên bản SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

Trường `baseUrl` cũng chấp nhận các đối tượng SecretRef.

Quy tắc truyền tải:

- `https://` hoạt động cho máy chủ SearXNG công khai hoặc riêng tư
- `http://` chỉ được chấp nhận cho máy chủ mạng riêng đáng tin cậy hoặc máy chủ loopback
- máy chủ SearXNG công khai phải dùng `https://`
- máy chủ riêng tư/nội bộ dùng bộ bảo vệ mạng tự lưu trữ; máy chủ `https://`
  công khai vẫn ở trên bộ bảo vệ tìm kiếm web nghiêm ngặt và không thể chuyển hướng đến địa chỉ
  riêng tư

## Biến môi trường

Đặt `SEARXNG_BASE_URL` làm phương án thay thế cho cấu hình:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Khi `SEARXNG_BASE_URL` được đặt và không có nhà cung cấp tường minh nào được cấu hình, cơ chế tự động phát hiện
sẽ tự động chọn SearXNG (ở mức ưu tiên thấp nhất -- bất kỳ nhà cung cấp dựa trên API nào có
khóa đều thắng trước).

## Tham chiếu cấu hình Plugin

| Trường       | Mô tả                                                                 |
| ------------ | --------------------------------------------------------------------- |
| `baseUrl`    | URL cơ sở của phiên bản SearXNG của bạn (bắt buộc)                    |
| `categories` | Các danh mục phân tách bằng dấu phẩy, như `general`, `news` hoặc `science` |
| `language`   | Mã ngôn ngữ cho kết quả, như `en`, `de` hoặc `fr`                     |

## Ghi chú

- **API JSON** -- dùng endpoint `format=json` gốc của SearXNG, không scrape HTML
- **URL kết quả hình ảnh** -- kết quả thuộc danh mục hình ảnh bao gồm `img_src` khi SearXNG
  trả về URL hình ảnh trực tiếp
- **Không cần khóa API** -- hoạt động ngay với bất kỳ phiên bản SearXNG nào
- **Xác thực URL cơ sở** -- `baseUrl` phải là URL `http://` hoặc `https://`
  hợp lệ; máy chủ công khai phải dùng `https://`
- **Bộ bảo vệ mạng** -- endpoint SearXNG riêng tư/nội bộ chọn tham gia
  quyền truy cập mạng riêng; endpoint SearXNG `https://` công khai giữ cơ chế bảo vệ SSRF
  nghiêm ngặt
- **Thứ tự tự động phát hiện** -- SearXNG được kiểm tra sau các nhà cung cấp dựa trên API
  có khóa đã cấu hình (thứ tự 200). Các nhà cung cấp không cần khóa như DuckDuckGo hoặc
  Ollama Web Search không được tự động chọn nếu không có lựa chọn nhà cung cấp tường minh
- **Tự lưu trữ** -- bạn kiểm soát phiên bản, truy vấn và các công cụ tìm kiếm upstream
- **Danh mục** mặc định là `general` khi chưa được cấu hình
- **Dự phòng danh mục** -- nếu yêu cầu danh mục không phải `general` thành công nhưng
  trả về không kết quả, OpenClaw thử lại cùng truy vấn một lần với `general`
  trước khi trả về tập kết quả rỗng

<Tip>
  Để API JSON của SearXNG hoạt động, hãy đảm bảo phiên bản SearXNG của bạn đã bật định dạng `json`
  trong `settings.yml` dưới `search.formats`.
</Tip>

## Liên quan

- [Tổng quan tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và cơ chế tự động phát hiện
- [DuckDuckGo Search](/vi/tools/duckduckgo-search) -- một nhà cung cấp khác không cần khóa
- [Brave Search](/vi/tools/brave-search) -- kết quả có cấu trúc với gói miễn phí
