---
read_when:
    - Bạn muốn tìm kiếm trên web được Tavily hỗ trợ
    - Bạn cần khóa API Tavily
    - Bạn muốn dùng Tavily làm nhà cung cấp `web_search`
    - Bạn muốn trích xuất nội dung từ các URL
summary: Các công cụ tìm kiếm và trích xuất Tavily
title: Tavily
x-i18n:
    generated_at: "2026-07-12T08:25:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a61351872eb8aecb0b3ada9b573ee8d3db1dcec3d7bd74074446fbe9dc1f274
    source_path: tools/tavily.md
    workflow: 16
---

[Tavily](https://tavily.com) là một API tìm kiếm được thiết kế cho các ứng dụng AI. OpenClaw cung cấp API này theo hai cách:

- dưới dạng nhà cung cấp `web_search` cho công cụ tìm kiếm dùng chung
- dưới dạng các công cụ Plugin riêng: `tavily_search` và `tavily_extract`

Tavily trả về kết quả có cấu trúc được tối ưu hóa để LLM sử dụng, với độ sâu tìm kiếm có thể cấu hình, bộ lọc chủ đề, bộ lọc miền, bản tóm tắt câu trả lời do AI tạo và khả năng trích xuất nội dung từ URL (bao gồm cả các trang được kết xuất bằng JavaScript).

| Thuộc tính  | Giá trị                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| ID Plugin   | `tavily`                                                                                                 |
| Gói         | `@openclaw/tavily-plugin`                                                                                |
| Xác thực    | Biến môi trường `TAVILY_API_KEY` hoặc cấu hình `apiKey`                                                  |
| URL cơ sở   | `https://api.tavily.com` (mặc định); biến môi trường `TAVILY_BASE_URL` hoặc cấu hình `baseUrl` để ghi đè |
| Thời gian chờ | 30 giây cho tìm kiếm, 60 giây cho trích xuất (mặc định)                                                |
| Công cụ     | `tavily_search`, `tavily_extract`                                                                        |

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
                apiKey: "tvly-...", // không bắt buộc nếu đã đặt TAVILY_API_KEY
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
  <Step title="Xác minh tìm kiếm hoạt động">
    Kích hoạt một lượt `web_search` từ bất kỳ tác nhân nào hoặc gọi trực tiếp `tavily_search`.
  </Step>
</Steps>

<Tip>
Việc chọn Tavily trong quy trình thiết lập ban đầu hoặc `openclaw configure --section web` sẽ cài đặt và bật Plugin Tavily chính thức khi cần.
</Tip>

## Tham chiếu công cụ

### `tavily_search`

Sử dụng công cụ này khi bạn muốn dùng các tùy chọn kiểm soát tìm kiếm riêng của Tavily thay vì `web_search` dùng chung.

| Tham số           | Kiểu         | Ràng buộc / mặc định                    | Mô tả                                                |
| ----------------- | ------------ | --------------------------------------- | ---------------------------------------------------- |
| `query`           | chuỗi        | bắt buộc                                | Chuỗi truy vấn tìm kiếm.                             |
| `search_depth`    | enum         | `basic` (mặc định), `advanced`          | `advanced` chậm hơn nhưng có độ liên quan cao hơn.   |
| `topic`           | enum         | `general` (mặc định), `news`, `finance` | Lọc theo nhóm chủ đề.                                |
| `max_results`     | số nguyên    | 1-20, mặc định `5`                      | Số lượng kết quả.                                    |
| `include_answer`  | boolean      | mặc định `false`                        | Bao gồm bản tóm tắt câu trả lời do AI Tavily tạo.    |
| `time_range`      | enum         | `day`, `week`, `month`, `year`          | Lọc kết quả theo mức độ gần đây.                     |
| `include_domains` | mảng chuỗi   | (không có)                              | Chỉ bao gồm kết quả từ các miền này.                 |
| `exclude_domains` | mảng chuỗi   | (không có)                              | Loại trừ kết quả từ các miền này.                    |

Sự đánh đổi về độ sâu tìm kiếm:

| Độ sâu     | Tốc độ     | Độ liên quan | Phù hợp nhất cho                                      |
| ---------- | ---------- | ------------ | ----------------------------------------------------- |
| `basic`    | Nhanh hơn  | Cao          | Các truy vấn đa dụng (mặc định).                      |
| `advanced` | Chậm hơn   | Cao nhất     | Nghiên cứu chính xác và tìm kiếm thông tin thực tế.   |

### `tavily_extract`

Sử dụng công cụ này để trích xuất nội dung sạch từ một hoặc nhiều URL. Công cụ xử lý được các trang kết xuất bằng JavaScript và hỗ trợ phân đoạn tập trung vào truy vấn để trích xuất có mục tiêu.

| Tham số             | Kiểu         | Ràng buộc / mặc định            | Mô tả                                                                  |
| ------------------- | ------------ | -------------------------------- | ---------------------------------------------------------------------- |
| `urls`              | mảng chuỗi   | bắt buộc, 1-20                   | Các URL cần trích xuất nội dung.                                       |
| `query`             | chuỗi        | (không bắt buộc)                 | Xếp hạng lại các phân đoạn đã trích xuất theo mức độ liên quan đến truy vấn này. |
| `extract_depth`     | enum         | `basic` (mặc định), `advanced`   | Dùng `advanced` cho các trang nặng về JS, SPA hoặc bảng động.          |
| `chunks_per_source` | số nguyên    | 1-5; **yêu cầu `query`**         | Số phân đoạn trả về trên mỗi URL. Sẽ báo lỗi nếu đặt mà không có `query`. |
| `include_images`    | boolean      | mặc định `false`                 | Bao gồm URL hình ảnh trong kết quả.                                    |

Sự đánh đổi về độ sâu trích xuất:

| Độ sâu     | Khi nào nên dùng                                  |
| ---------- | ------------------------------------------------- |
| `basic`    | Các trang đơn giản. Hãy thử tùy chọn này trước.   |
| `advanced` | SPA được kết xuất bằng JS, nội dung động, bảng.   |

<Tip>
Chia danh sách URL lớn thành nhiều lệnh gọi `tavily_extract` (tối đa 20 URL mỗi yêu cầu). Sử dụng `query` cùng với `chunks_per_source` để chỉ lấy nội dung liên quan thay vì toàn bộ trang.
</Tip>

## Chọn công cụ phù hợp

| Nhu cầu                                        | Công cụ           |
| ---------------------------------------------- | ----------------- |
| Tìm kiếm web nhanh, không cần tùy chọn đặc biệt | `web_search`      |
| Tìm kiếm với độ sâu, chủ đề, câu trả lời AI    | `tavily_search`   |
| Trích xuất nội dung từ các URL cụ thể          | `tavily_extract`  |

<Note>
Công cụ `web_search` dùng chung với Tavily làm nhà cung cấp hỗ trợ `query` và `count` (tối đa 20 kết quả). Đối với các tùy chọn kiểm soát riêng của Tavily (`search_depth`, `topic`, `include_answer`, bộ lọc miền, khoảng thời gian), hãy sử dụng `tavily_search`.
</Note>

## Cấu hình nâng cao

<AccordionGroup>
  <Accordion title="Thứ tự phân giải khóa API">
    Máy khách Tavily tìm khóa API theo thứ tự sau:

    1. `plugins.entries.tavily.config.webSearch.apiKey` (được phân giải thông qua SecretRefs).
    2. `TAVILY_API_KEY` từ môi trường Gateway.

    Cả `tavily_search` và `tavily_extract` đều phát sinh lỗi thiết lập nếu không có giá trị nào trong hai nguồn trên.

  </Accordion>

  <Accordion title="URL cơ sở tùy chỉnh">
    Ghi đè `plugins.entries.tavily.config.webSearch.baseUrl` hoặc đặt `TAVILY_BASE_URL` nếu bạn chuyển tiếp Tavily qua proxy. Cấu hình được ưu tiên hơn biến môi trường. Giá trị mặc định là `https://api.tavily.com`.
  </Accordion>

  <Accordion title="`chunks_per_source` yêu cầu `query`">
    `tavily_extract` từ chối các lệnh gọi truyền `chunks_per_source` mà không có `query`. Tavily xếp hạng các phân đoạn theo mức độ liên quan đến truy vấn, vì vậy tham số này không có ý nghĩa nếu thiếu truy vấn.
  </Accordion>
</AccordionGroup>

## Liên quan

<CardGroup cols={2}>
  <Card title="Tổng quan về tìm kiếm web" href="/vi/tools/web" icon="magnifying-glass">
    Tất cả nhà cung cấp và quy tắc tự động phát hiện.
  </Card>
  <Card title="Firecrawl" href="/vi/tools/firecrawl" icon="fire">
    Tìm kiếm kết hợp thu thập dữ liệu và trích xuất nội dung.
  </Card>
  <Card title="Tìm kiếm Exa" href="/vi/tools/exa-search" icon="binoculars">
    Tìm kiếm nơ-ron kết hợp trích xuất nội dung.
  </Card>
  <Card title="Cấu hình" href="/vi/gateway/configuration" icon="gear">
    Lược đồ cấu hình đầy đủ cho các mục Plugin và định tuyến công cụ.
  </Card>
</CardGroup>
