---
read_when:
    - Bạn muốn tìm kiếm web được hỗ trợ bởi Tavily
    - Bạn cần có khóa API Tavily
    - Bạn muốn Tavily làm nhà cung cấp web_search
    - Bạn muốn trích xuất nội dung từ URL
summary: Công cụ tìm kiếm và trích xuất Tavily
title: Tavily
x-i18n:
    generated_at: "2026-06-27T18:19:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 539e76120e858129dabfb85c1fe379837fc87be491d5a57803917bf6bb7018ae
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) là một API tìm kiếm được thiết kế cho các ứng dụng AI. OpenClaw cung cấp Tavily theo hai cách:

- làm nhà cung cấp `web_search` cho công cụ tìm kiếm chung
- làm các công cụ Plugin rõ ràng: `tavily_search` và `tavily_extract`

Tavily trả về kết quả có cấu trúc được tối ưu hóa để LLM sử dụng, với độ sâu tìm kiếm có thể cấu hình, lọc theo chủ đề, bộ lọc miền, tóm tắt câu trả lời do AI tạo và trích xuất nội dung từ URL (bao gồm cả các trang được kết xuất bằng JavaScript).

| Thuộc tính | Giá trị                             |
| ---------- | ----------------------------------- |
| ID Plugin  | `tavily`                            |
| Gói        | `@openclaw/tavily-plugin`           |
| Xác thực   | `TAVILY_API_KEY` hoặc cấu hình `apiKey` |
| URL cơ sở  | `https://api.tavily.com` (mặc định) |
| Công cụ    | `tavily_search`, `tavily_extract`   |

## Bắt đầu

<Steps>
  <Step title="Cài đặt Plugin">
    ```bash
    openclaw plugins install @openclaw/tavily-plugin
    ```
  </Step>
  <Step title="Lấy khóa API">
    Tạo tài khoản Tavily tại [tavily.com](https://tavily.com), sau đó tạo khóa API trong bảng điều khiển.
  </Step>
  <Step title="Cấu hình Plugin và nhà cung cấp">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // optional if TAVILY_API_KEY is set
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Xác minh tìm kiếm chạy được">
    Kích hoạt `web_search` từ bất kỳ agent nào, hoặc gọi trực tiếp `tavily_search`.
  </Step>
</Steps>

<Tip>
Chọn Tavily trong quá trình onboarding hoặc `openclaw configure --section web` sẽ cài đặt và bật Plugin Tavily chính thức khi cần.
</Tip>

## Tham chiếu công cụ

### `tavily_search`

Sử dụng công cụ này khi bạn muốn các điều khiển tìm kiếm dành riêng cho Tavily thay vì `web_search` chung.

| Tham số           | Kiểu         | Ràng buộc / mặc định                  | Mô tả                                          |
| ----------------- | ------------ | -------------------------------------- | ---------------------------------------------- |
| `query`           | string       | bắt buộc                               | Chuỗi truy vấn tìm kiếm. Giữ dưới 400 ký tự.   |
| `search_depth`    | enum         | `basic` (mặc định), `advanced`         | `advanced` chậm hơn nhưng có độ liên quan cao hơn. |
| `topic`           | enum         | `general` (mặc định), `news`, `finance` | Lọc theo nhóm chủ đề.                          |
| `max_results`     | integer      | 1-20                                   | Số lượng kết quả.                              |
| `include_answer`  | boolean      | mặc định `false`                       | Bao gồm tóm tắt câu trả lời do Tavily AI tạo.  |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Lọc kết quả theo độ gần đây.                   |
| `include_domains` | string array | (không có)                             | Chỉ bao gồm kết quả từ các miền này.           |
| `exclude_domains` | string array | (không có)                             | Loại trừ kết quả từ các miền này.              |

Đánh đổi về độ sâu tìm kiếm:

| Độ sâu     | Tốc độ     | Độ liên quan | Phù hợp nhất cho                         |
| ---------- | ---------- | ------------ | ---------------------------------------- |
| `basic`    | Nhanh hơn  | Cao          | Truy vấn mục đích chung (mặc định).      |
| `advanced` | Chậm hơn   | Cao nhất     | Nghiên cứu chính xác và xác minh sự kiện. |

### `tavily_extract`

Sử dụng công cụ này để trích xuất nội dung sạch từ một hoặc nhiều URL. Xử lý các trang được kết xuất bằng JavaScript và hỗ trợ chia đoạn tập trung theo truy vấn để trích xuất có mục tiêu.

| Tham số             | Kiểu         | Ràng buộc / mặc định         | Mô tả                                                       |
| ------------------- | ------------ | ----------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | bắt buộc, 1-20                | URL để trích xuất nội dung.                                 |
| `query`             | string       | (tùy chọn)                    | Xếp hạng lại các đoạn đã trích xuất theo mức liên quan với truy vấn này. |
| `extract_depth`     | enum         | `basic` (mặc định), `advanced` | Dùng `advanced` cho các trang nhiều JS, SPA hoặc bảng động. |
| `chunks_per_source` | integer      | 1-5; **yêu cầu `query`**      | Số đoạn trả về trên mỗi URL. Báo lỗi nếu đặt mà không có `query`. |
| `include_images`    | boolean      | mặc định `false`              | Bao gồm URL hình ảnh trong kết quả.                         |

Đánh đổi về độ sâu trích xuất:

| Độ sâu     | Khi nào nên dùng                          |
| ---------- | ------------------------------------------ |
| `basic`    | Trang đơn giản. Hãy thử tùy chọn này trước. |
| `advanced` | SPA được kết xuất bằng JS, nội dung động, bảng. |

<Tip>
Chia danh sách URL lớn hơn thành nhiều lệnh gọi `tavily_extract` (tối đa 20 mỗi yêu cầu). Dùng `query` cùng với `chunks_per_source` để chỉ lấy nội dung liên quan thay vì toàn bộ trang.
</Tip>

## Chọn đúng công cụ

| Nhu cầu                                  | Công cụ          |
| ---------------------------------------- | ---------------- |
| Tìm kiếm web nhanh, không có tùy chọn đặc biệt | `web_search`     |
| Tìm kiếm với độ sâu, chủ đề, câu trả lời AI | `tavily_search`  |
| Trích xuất nội dung từ các URL cụ thể    | `tavily_extract` |

<Note>
Công cụ `web_search` chung với Tavily làm nhà cung cấp hỗ trợ `query` và `count` (tối đa 20 kết quả). Đối với các điều khiển dành riêng cho Tavily (`search_depth`, `topic`, `include_answer`, bộ lọc miền, khoảng thời gian), hãy dùng `tavily_search` thay thế.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Thứ tự phân giải khóa API">
    Máy khách Tavily tra cứu khóa API theo thứ tự sau:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (được phân giải thông qua SecretRefs).
    2. `TAVILY_API_KEY` từ môi trường Gateway.

    `tavily_extract` phát sinh lỗi thiết lập nếu không có khóa nào.

  </Accordion>

  <Accordion title="URL cơ sở tùy chỉnh">
    Ghi đè `plugins.entries.tavily.config.webSearch.baseUrl` nếu bạn đặt Tavily phía sau proxy. Mặc định là `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` yêu cầu `query`">
    `tavily_extract` từ chối các lệnh gọi truyền `chunks_per_source` mà không có `query`. Tavily xếp hạng các đoạn theo mức liên quan với truy vấn, vì vậy tham số này không có ý nghĩa nếu không có truy vấn.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tổng quan Web Search" href="/vi/tools/web" icon="magnifying-glass">
    Tất cả nhà cung cấp và quy tắc tự động phát hiện.
  </Card>
  <Card title="Firecrawl" href="/vi/tools/firecrawl" icon="fire">
    Tìm kiếm kèm scraping với trích xuất nội dung.
  </Card>
  <Card title="Exa Search" href="/vi/tools/exa-search" icon="binoculars">
    Tìm kiếm neural với trích xuất nội dung.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Lược đồ cấu hình đầy đủ cho mục nhập Plugin và định tuyến công cụ.
  </Card>
</CardGroup>
