---
read_when:
    - Bạn muốn một nhà cung cấp tìm kiếm web tự lưu trữ
    - Bạn muốn sử dụng SearXNG cho web_search
    - Bạn cần một tùy chọn tìm kiếm chú trọng quyền riêng tư hoặc cách ly mạng
summary: Tìm kiếm web SearXNG -- nhà cung cấp tìm kiếm tổng hợp tự lưu trữ, không cần khóa
title: Tìm kiếm SearXNG
x-i18n:
    generated_at: "2026-04-29T23:20:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw hỗ trợ [SearXNG](https://docs.searxng.org/) làm nhà cung cấp `web_search` **tự lưu trữ,
không cần khóa**. SearXNG là một công cụ siêu tìm kiếm nguồn mở
tổng hợp kết quả từ Google, Bing, DuckDuckGo và các nguồn khác.

Ưu điểm:

- **Miễn phí và không giới hạn** -- không cần khóa API hoặc gói đăng ký thương mại
- **Quyền riêng tư / cách ly mạng** -- truy vấn không bao giờ rời khỏi mạng của bạn
- **Hoạt động ở mọi nơi** -- không bị giới hạn theo khu vực trên các API tìm kiếm thương mại

## Thiết lập

<Steps>
  <Step title="Chạy một phiên bản SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Hoặc dùng bất kỳ triển khai SearXNG hiện có nào mà bạn có quyền truy cập. Xem
    [tài liệu SearXNG](https://docs.searxng.org/) để thiết lập cho môi trường sản xuất.

  </Step>
  <Step title="Cấu hình">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    Hoặc đặt biến môi trường và để tính năng tự động phát hiện tìm thấy nó:

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
- `http://` chỉ được chấp nhận cho máy chủ mạng riêng đáng tin cậy hoặc loopback
- máy chủ SearXNG công khai phải dùng `https://`

## Biến môi trường

Đặt `SEARXNG_BASE_URL` làm lựa chọn thay thế cho cấu hình:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Khi `SEARXNG_BASE_URL` được đặt và không có nhà cung cấp rõ ràng nào được cấu hình, tính năng tự động phát hiện
tự động chọn SearXNG (ở mức ưu tiên thấp nhất -- bất kỳ nhà cung cấp dựa trên API nào có
khóa sẽ thắng trước).

## Tham chiếu cấu hình Plugin

| Trường       | Mô tả                                                              |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL cơ sở của phiên bản SearXNG của bạn (bắt buộc)                 |
| `categories` | Các danh mục phân tách bằng dấu phẩy như `general`, `news`, hoặc `science` |
| `language`   | Mã ngôn ngữ cho kết quả như `en`, `de`, hoặc `fr`                  |

## Ghi chú

- **JSON API** -- dùng endpoint `format=json` gốc của SearXNG, không phải quét HTML
- **Không cần khóa API** -- hoạt động ngay với bất kỳ phiên bản SearXNG nào
- **Xác thực URL cơ sở** -- `baseUrl` phải là URL `http://` hoặc `https://`
  hợp lệ; máy chủ công khai phải dùng `https://`
- **Thứ tự tự động phát hiện** -- SearXNG được kiểm tra cuối cùng (thứ tự 200) trong
  tự động phát hiện. Các nhà cung cấp dựa trên API có khóa đã cấu hình chạy trước, rồi đến
  DuckDuckGo (thứ tự 100), rồi Ollama Web Search (thứ tự 110)
- **Tự lưu trữ** -- bạn kiểm soát phiên bản, truy vấn và các công cụ tìm kiếm thượng nguồn
- **Danh mục** mặc định là `general` khi chưa được cấu hình

<Tip>
  Để JSON API của SearXNG hoạt động, hãy bảo đảm phiên bản SearXNG của bạn đã bật định dạng `json`
  trong `settings.yml` của nó, bên dưới `search.formats`.
</Tip>

## Liên quan

- [Tổng quan Web Search](/vi/tools/web) -- tất cả nhà cung cấp và tự động phát hiện
- [Tìm kiếm DuckDuckGo](/vi/tools/duckduckgo-search) -- một phương án dự phòng khác không cần khóa
- [Tìm kiếm Brave](/vi/tools/brave-search) -- kết quả có cấu trúc với gói miễn phí
