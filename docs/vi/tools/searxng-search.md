---
read_when:
    - Bạn muốn một nhà cung cấp dịch vụ tìm kiếm web tự lưu trữ
    - Bạn muốn sử dụng SearXNG cho web_search
    - Bạn cần một tùy chọn tìm kiếm chú trọng quyền riêng tư hoặc cách ly hoàn toàn khỏi mạng.
summary: Tìm kiếm web SearXNG -- nhà cung cấp siêu tìm kiếm tự lưu trữ, không cần khóa API
title: Tìm kiếm SearXNG
x-i18n:
    generated_at: "2026-07-12T08:31:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cae8de9f8e2c8dd9cec615adb48da5c1fd7654bffe96c7afc1acea3effbcf1fc
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw hỗ trợ [SearXNG](https://docs.searxng.org/) làm nhà cung cấp `web_search` **tự lưu trữ,
không cần khóa**. SearXNG là một công cụ siêu tìm kiếm mã nguồn mở,
tổng hợp kết quả từ Google, Bing, DuckDuckGo và các nguồn khác.

Ưu điểm:

- **Miễn phí và không giới hạn** -- không yêu cầu khóa API hoặc gói đăng ký thương mại
- **Quyền riêng tư / cách ly mạng** -- truy vấn không bao giờ rời khỏi mạng của bạn
- **Hoạt động ở mọi nơi** -- không bị giới hạn khu vực như các API tìm kiếm thương mại

## Thiết lập

<Steps>
  <Step title="Cài đặt Plugin">
    ```bash
    openclaw plugins install @openclaw/searxng-plugin
    ```
  </Step>
  <Step title="Chạy một phiên bản SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    Hoặc sử dụng bất kỳ bản triển khai SearXNG hiện có nào mà bạn có quyền truy cập. Xem
    [tài liệu SearXNG](https://docs.searxng.org/) để biết cách thiết lập cho môi trường sản xuất.

  </Step>
  <Step title="Cấu hình">
    ```bash
    openclaw configure --section web
    # Chọn "searxng" làm nhà cung cấp
    ```

    Hoặc đặt biến môi trường và để tính năng tự động phát hiện tìm thấy biến đó:

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

Các thiết lập ở cấp Plugin cho phiên bản SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // không bắt buộc
            language: "en", // không bắt buộc
          },
        },
      },
    },
  },
}
```

`baseUrl` cũng chấp nhận một đối tượng SecretRef (ví dụ: `{ source: "env", id: "SEARXNG_BASE_URL" }`).

## Biến môi trường

Đặt `SEARXNG_BASE_URL` để thay thế cho cấu hình:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

Thứ tự phân giải: chuỗi `baseUrl` đã cấu hình, sau đó là SecretRef môi trường nội tuyến trên
`baseUrl`, rồi đến `SEARXNG_BASE_URL`. Khi không có đường dẫn cấu hình nào được đặt và
`SEARXNG_BASE_URL` tồn tại nhưng chưa chọn rõ nhà cung cấp, tính năng tự động phát hiện
sẽ chọn SearXNG.

## Tham chiếu cấu hình Plugin

| Trường       | Mô tả                                                               |
| ------------ | ------------------------------------------------------------------- |
| `baseUrl`    | URL cơ sở của phiên bản SearXNG của bạn (bắt buộc)                  |
| `categories` | Các danh mục phân tách bằng dấu phẩy như `general`, `news` hoặc `science` |
| `language`   | Mã ngôn ngữ cho kết quả như `en`, `de` hoặc `fr`                    |

Lệnh gọi công cụ `web_search` cũng chấp nhận `count` (1-10 kết quả), `categories`
và `language` làm các giá trị ghi đè theo từng lần gọi.

## Lưu ý

- **API JSON** -- sử dụng điểm cuối `format=json` gốc của SearXNG, không thu thập dữ liệu từ HTML
- **URL kết quả hình ảnh** -- kết quả thuộc danh mục hình ảnh bao gồm `img_src` khi SearXNG
  trả về URL hình ảnh trực tiếp
- **Không cần khóa API** -- hoạt động ngay với bất kỳ phiên bản SearXNG nào
- **Xác thực URL cơ sở** -- `baseUrl` phải là một URL `http://` hoặc `https://`
  hợp lệ
- **Bảo vệ mạng** -- URL cơ sở `http://` phải trỏ đến một máy chủ riêng tư đáng tin cậy hoặc
  local loopback (máy chủ công khai phải sử dụng `https://`); URL cơ sở `https://` phân giải
  thành địa chỉ riêng tư/nội bộ cũng được áp dụng cùng cơ chế cho phép tự lưu trữ,
  trong khi URL cơ sở `https://` phân giải công khai vẫn duy trì biện pháp bảo vệ SSRF nghiêm ngặt
- **Thứ tự tự động phát hiện** -- SearXNG yêu cầu `baseUrl` đã được cấu hình (thứ tự
  200 trong số các nhà cung cấp đã có thông tin xác thực bắt buộc). Các nhà cung cấp
  không cần khóa như DuckDuckGo hoặc Ollama Web Search không bao giờ mặc nhiên được ưu tiên
  khi tự động phát hiện; chúng chỉ kích hoạt khi `provider` được chọn rõ ràng
- **Tự lưu trữ** -- bạn kiểm soát phiên bản, các truy vấn và các công cụ tìm kiếm nguồn
- **Danh mục** mặc định là `general` khi không được cấu hình
- **Phương án dự phòng cho danh mục** -- nếu yêu cầu danh mục không phải `general` thành công nhưng
  trả về không có kết quả, OpenClaw thử lại cùng truy vấn một lần với `general`
  trước khi trả về tập kết quả trống
- **Bộ nhớ đệm kết quả** -- các truy vấn giống hệt nhau (cùng truy vấn, số lượng, danh mục,
  ngôn ngữ và URL cơ sở) được lưu vào bộ nhớ đệm trong tiến trình với TTL ngắn
- **Yêu cầu phiên bản** -- Plugin khai báo `minHostVersion: >=2026.6.9`

<Tip>
  Để API JSON của SearXNG hoạt động, hãy đảm bảo phiên bản SearXNG của bạn đã bật định dạng `json`
  trong `settings.yml` tại `search.formats`.
</Tip>

## Liên quan

- [Tổng quan về tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [Tìm kiếm DuckDuckGo](/vi/tools/duckduckgo-search) -- một nhà cung cấp không cần khóa khác
- [Tìm kiếm Brave](/vi/tools/brave-search) -- kết quả có cấu trúc với gói miễn phí
