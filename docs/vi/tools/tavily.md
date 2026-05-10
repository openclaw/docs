---
read_when:
    - Bạn muốn tìm kiếm trên web do Tavily hỗ trợ
    - Bạn cần có khóa API Tavily
    - Bạn muốn Tavily làm nhà cung cấp web_search
    - Bạn muốn trích xuất nội dung từ các URL
summary: Công cụ tìm kiếm và trích xuất Tavily
title: Tavily
x-i18n:
    generated_at: "2026-05-10T19:55:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 071e2b1be054890711e32d7424d16d94133d16ff1ce7da3703e62c53b5c217ef
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) là một API tìm kiếm được thiết kế cho các ứng dụng AI. OpenClaw cung cấp API này theo hai cách:

- dưới dạng nhà cung cấp `web_search` cho công cụ tìm kiếm chung
- dưới dạng các công cụ Plugin rõ ràng: `tavily_search` và `tavily_extract`

Tavily trả về kết quả có cấu trúc được tối ưu hóa để LLM sử dụng, với độ sâu tìm kiếm có thể cấu hình, lọc theo chủ đề, bộ lọc miền, tóm tắt câu trả lời do AI tạo và trích xuất nội dung từ URL (bao gồm cả các trang được render bằng JavaScript).

| Thuộc tính     | Giá trị                             |
| -------------- | ----------------------------------- |
| ID Plugin      | `tavily`                            |
| Xác thực       | `TAVILY_API_KEY` hoặc cấu hình `apiKey` |
| URL cơ sở      | `https://api.tavily.com` (mặc định) |
| Công cụ đi kèm | `tavily_search`, `tavily_extract`   |

## Bắt đầu

<Steps>
  <Step title="Get an API key">
    Tạo tài khoản Tavily tại [tavily.com](https://tavily.com), rồi tạo một khóa API trong bảng điều khiển.
  </Step>
  <Step title="Configure the plugin and provider">
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
  <Step title="Verify search runs">
    Kích hoạt một `web_search` từ bất kỳ agent nào, hoặc gọi trực tiếp `tavily_search`.
  </Step>
</Steps>

<Tip>
Chọn Tavily trong quá trình thiết lập ban đầu hoặc `openclaw configure --section web` sẽ tự động bật Plugin Tavily đi kèm.
</Tip>

## Tham chiếu công cụ

### `tavily_search`

Dùng công cụ này khi bạn muốn các tùy chọn điều khiển tìm kiếm riêng của Tavily thay vì `web_search` chung.

| Tham số           | Kiểu         | Ràng buộc / mặc định                  | Mô tả                                                   |
| ----------------- | ------------ | -------------------------------------- | ------------------------------------------------------- |
| `query`           | string       | bắt buộc                               | Chuỗi truy vấn tìm kiếm. Giữ dưới 400 ký tự.            |
| `search_depth`    | enum         | `basic` (mặc định), `advanced`         | `advanced` chậm hơn nhưng có độ liên quan cao hơn.      |
| `topic`           | enum         | `general` (mặc định), `news`, `finance` | Lọc theo nhóm chủ đề.                                   |
| `max_results`     | integer      | 1-20                                   | Số lượng kết quả.                                       |
| `include_answer`  | boolean      | mặc định `false`                       | Bao gồm tóm tắt câu trả lời do AI của Tavily tạo.       |
| `time_range`      | enum         | `day`, `week`, `month`, `year`         | Lọc kết quả theo độ mới.                                |
| `include_domains` | string array | (không có)                             | Chỉ bao gồm kết quả từ các miền này.                    |
| `exclude_domains` | string array | (không có)                             | Loại trừ kết quả từ các miền này.                       |

Đánh đổi về độ sâu tìm kiếm:

| Độ sâu     | Tốc độ     | Độ liên quan | Phù hợp nhất cho                              |
| ---------- | ---------- | ------------ | -------------------------------------------- |
| `basic`    | Nhanh hơn  | Cao          | Truy vấn mục đích chung (mặc định).          |
| `advanced` | Chậm hơn   | Cao nhất     | Nghiên cứu chính xác và xác minh dữ kiện.    |

### `tavily_extract`

Dùng công cụ này để trích xuất nội dung sạch từ một hoặc nhiều URL. Xử lý các trang được render bằng JavaScript và hỗ trợ chia đoạn tập trung theo truy vấn để trích xuất có mục tiêu.

| Tham số             | Kiểu         | Ràng buộc / mặc định         | Mô tả                                                       |
| ------------------- | ------------ | ---------------------------- | ----------------------------------------------------------- |
| `urls`              | string array | bắt buộc, 1-20               | URL để trích xuất nội dung từ đó.                           |
| `query`             | string       | (tùy chọn)                   | Xếp hạng lại các đoạn trích xuất theo mức liên quan đến truy vấn này. |
| `extract_depth`     | enum         | `basic` (mặc định), `advanced` | Dùng `advanced` cho các trang nặng JS, SPA hoặc bảng động.  |
| `chunks_per_source` | integer      | 1-5; **yêu cầu `query`**     | Số đoạn trả về cho mỗi URL. Gây lỗi nếu đặt mà không có `query`. |
| `include_images`    | boolean      | mặc định `false`             | Bao gồm URL hình ảnh trong kết quả.                         |

Đánh đổi về độ sâu trích xuất:

| Độ sâu     | Khi nào nên dùng                              |
| ---------- | -------------------------------------------- |
| `basic`    | Trang đơn giản. Thử tùy chọn này trước.       |
| `advanced` | SPA được render bằng JS, nội dung động, bảng. |

<Tip>
Chia danh sách URL lớn thành nhiều lệnh gọi `tavily_extract` (tối đa 20 URL mỗi yêu cầu). Dùng `query` cùng với `chunks_per_source` để chỉ lấy nội dung liên quan thay vì toàn bộ trang.
</Tip>

## Chọn công cụ phù hợp

| Nhu cầu                                      | Công cụ          |
| ------------------------------------------- | ---------------- |
| Tìm kiếm web nhanh, không cần tùy chọn đặc biệt | `web_search`     |
| Tìm kiếm với độ sâu, chủ đề, câu trả lời AI | `tavily_search`  |
| Trích xuất nội dung từ các URL cụ thể       | `tavily_extract` |

<Note>
Công cụ `web_search` chung với Tavily làm nhà cung cấp hỗ trợ `query` và `count` (tối đa 20 kết quả). Để dùng các tùy chọn điều khiển riêng của Tavily (`search_depth`, `topic`, `include_answer`, bộ lọc miền, khoảng thời gian), hãy dùng `tavily_search` thay thế.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="API key resolution order">
    Client Tavily tra cứu khóa API theo thứ tự sau:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (được phân giải thông qua SecretRefs).
    2. `TAVILY_API_KEY` từ môi trường Gateway.

    `tavily_extract` báo lỗi thiết lập nếu không có mục nào trong hai mục trên.

  </Accordion>

  <Accordion title="Custom base URL">
    Ghi đè `plugins.entries.tavily.config.webSearch.baseUrl` nếu bạn đưa Tavily qua proxy. Giá trị mặc định là `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` requires `query`">
    `tavily_extract` từ chối các lệnh gọi truyền `chunks_per_source` mà không có `query`. Tavily xếp hạng các đoạn theo mức liên quan của truy vấn, nên tham số này vô nghĩa nếu thiếu truy vấn.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Web Search overview" href="/vi/tools/web" icon="magnifying-glass">
    Tất cả nhà cung cấp và quy tắc tự động phát hiện.
  </Card>
  <Card title="Firecrawl" href="/vi/tools/firecrawl" icon="fire">
    Tìm kiếm kết hợp scraping với trích xuất nội dung.
  </Card>
  <Card title="Exa Search" href="/vi/tools/exa-search" icon="binoculars">
    Tìm kiếm neural với trích xuất nội dung.
  </Card>
  <Card title="Configuration" href="/vi/gateway/configuration" icon="gear">
    Schema cấu hình đầy đủ cho mục nhập Plugin và định tuyến công cụ.
  </Card>
</CardGroup>
