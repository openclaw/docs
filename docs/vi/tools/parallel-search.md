---
read_when:
    - Bạn muốn tìm kiếm trên web mà không cần khóa API
    - Bạn muốn dùng Search API trả phí của Parallel
    - Bạn muốn các đoạn trích cô đọng được xếp hạng theo hiệu quả sử dụng ngữ cảnh LLM
summary: Tìm kiếm song song -- các đoạn trích cô đọng từ nguồn web, được tối ưu hóa cho LLM
title: Tìm kiếm song song
x-i18n:
    generated_at: "2026-07-12T08:31:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eff693f286015b287bbdacf44f11ff6f07f2f7d2605ef6f09259e7402b40515e
    source_path: tools/parallel-search.md
    workflow: 16
---

Plugin Parallel cung cấp hai nhà cung cấp `web_search` của [Parallel](https://parallel.ai/), cả hai đều trả về các đoạn trích được xếp hạng và tối ưu hóa cho LLM từ một chỉ mục web được xây dựng cho các tác tử AI:

| Nhà cung cấp                  | id              | Xác thực                                                                                                       |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------- |
| Parallel Search (Miễn phí)   | `parallel-free` | Không cần -- [Search MCP](https://docs.parallel.ai/integrations/mcp/search-mcp) miễn phí của Parallel          |
| Parallel Search              | `parallel`      | `PARALLEL_API_KEY` -- Search API trả phí, có giới hạn tốc độ cao hơn và khả năng tinh chỉnh mục tiêu           |

Đặt `tools.web.search.provider` thành `parallel-free` hoặc `parallel` để chọn rõ ràng một nhà cung cấp; không nhà cung cấp nào được tự động phát hiện.

<Note>
  Các mô hình OpenAI Responses trực tiếp (`api: "openai-responses"`, nhà cung cấp
  `openai`, URL cơ sở API chính thức) tự động sử dụng tính năng tìm kiếm web gốc
  được OpenAI lưu trữ khi `tools.web.search.provider` chưa được đặt, để trống, là `"auto"`
  hoặc `"openai"` -- vì vậy, theo mặc định chúng bỏ qua Parallel. Đặt
  `tools.web.search.provider` thành `parallel-free` hoặc `parallel` để thay vào đó định tuyến chúng
  qua Parallel. Xem [Tổng quan về tìm kiếm web](/vi/tools/web).
</Note>

## Cài đặt Plugin

```bash
openclaw plugins install @openclaw/parallel-plugin
openclaw gateway restart
```

## Khóa API (nhà cung cấp trả phí)

`parallel-free` không cần khóa nhưng vẫn phải được chọn rõ ràng. Nhà cung cấp
`parallel` trả phí cần khóa API:

<Steps>
  <Step title="Tạo tài khoản">
    Đăng ký tại [platform.parallel.ai](https://platform.parallel.ai) và
    tạo khóa API từ bảng điều khiển của bạn.
  </Step>
  <Step title="Lưu trữ khóa">
    Đặt `PARALLEL_API_KEY` trong môi trường Gateway hoặc cấu hình qua:

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
      parallel: {
        config: {
          webSearch: {
            apiKey: "par-...", // không bắt buộc nếu đã đặt PARALLEL_API_KEY
            baseUrl: "https://api.parallel.ai", // không bắt buộc; OpenClaw nối thêm /v1/search
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        // "parallel-free" cho Search MCP miễn phí, hoặc "parallel" cho nhà cung cấp
        // dựa trên API trả phí được trình bày ở đây.
        provider: "parallel",
      },
    },
  },
}
```

**Phương án thay thế bằng biến môi trường:** đặt `PARALLEL_API_KEY` trong môi trường
Gateway. Đối với bản cài đặt Gateway, hãy đặt biến này trong `~/.openclaw/.env`.

## Ghi đè URL cơ sở

Chỉ áp dụng cho nhà cung cấp `parallel` trả phí; `parallel-free` luôn sử dụng
`https://search.parallel.ai/mcp` và bỏ qua cài đặt này.

Đặt `plugins.entries.parallel.config.webSearch.baseUrl` để định tuyến các yêu cầu
trả phí qua một proxy tương thích hoặc điểm cuối thay thế (ví dụ: Cloudflare AI
Gateway). OpenClaw chuẩn hóa các máy chủ thuần bằng cách thêm `https://` vào trước
và nối thêm `/v1/search` trừ khi đường dẫn đã kết thúc bằng phần này. Điểm cuối
đã phân giải là một phần của khóa bộ nhớ đệm tìm kiếm, vì vậy kết quả từ các
điểm cuối khác nhau không bao giờ được dùng chung.

## Tham số công cụ

Cả hai nhà cung cấp đều cung cấp cấu trúc tìm kiếm gốc của Parallel để mô hình
điền một mục tiêu bằng ngôn ngữ tự nhiên cùng một vài truy vấn từ khóa ngắn --
cách kết hợp mà Parallel [khuyến nghị](https://docs.parallel.ai/search/best-practices)
để đạt kết quả tốt nhất.

<ParamField path="objective" type="string" required>
Mô tả bằng ngôn ngữ tự nhiên về câu hỏi hoặc mục tiêu cơ bản (tối đa 5000
ký tự). Nội dung phải tự đầy đủ.
</ParamField>

<ParamField path="search_queries" type="string[]" required>
Các truy vấn tìm kiếm bằng từ khóa ngắn gọn, mỗi truy vấn gồm 3-6 từ (1-5 mục,
tối đa 200 ký tự mỗi mục). Cung cấp 2-3 truy vấn đa dạng để đạt kết quả tốt nhất.
</ParamField>

<ParamField path="count" type="number">
Số kết quả cần trả về (1-40).
</ParamField>

<ParamField path="session_id" type="string">
ID phiên Parallel không bắt buộc từ `sessionId` của kết quả trước đó. Truyền nó
vào các lần tìm kiếm tiếp theo trong cùng một tác vụ để Parallel nhóm các lệnh gọi
liên quan và cải thiện kết quả tiếp theo. Tối đa 1000 ký tự đối với `parallel`;
Search MCP `parallel-free` miễn phí giới hạn ở 100. ID vượt quá giới hạn sẽ bị loại bỏ
(trả phí) hoặc một ID mới sẽ được tạo (miễn phí).
</ParamField>

<ParamField path="client_model" type="string">
Mã định danh không bắt buộc của mô hình thực hiện lệnh gọi (ví dụ: `claude-opus-4-7`,
`gpt-5.6-sol`), tối đa 100 ký tự. Cho phép Parallel điều chỉnh các cài đặt mặc định
theo khả năng của mô hình. Truyền chính xác slug của mô hình đang hoạt động; không
rút gọn thành bí danh họ mô hình.
</ParamField>

## Ghi chú

- Parallel xếp hạng và nén kết quả nhằm phục vụ khả năng suy luận của LLM, không phải
  lượt nhấp của con người; mỗi kết quả sẽ chứa các đoạn trích cô đọng thay vì nội dung
  toàn trang.
- Các đoạn trích kết quả được trả về dưới dạng mảng `excerpts` và cũng được nối vào
  `description` để tương thích với hợp đồng `web_search` chung.
- Cả hai nhà cung cấp đều trả về `session_id`; OpenClaw hiển thị giá trị này dưới dạng
  `sessionId` trong tải trọng công cụ để bên gọi có thể nhóm các lần tìm kiếm tiếp theo.
  ID phiên do Parallel tạo (không phải do bên gọi cung cấp) được loại khỏi mục bộ nhớ
  đệm, vì các tác vụ không liên quan có truy vấn giống nhau không nên kế thừa ID đó.
- `searchId`, `warnings` và `usage` từ Parallel được chuyển tiếp khi có.
- OpenClaw luôn chuyển tiếp số lượng kết quả đã phân giải đến Parallel dưới dạng
  `advanced_settings.max_results` (`parallel`) hoặc áp dụng `count` ở phía máy khách
  sau phản hồi có kích thước cố định của Parallel (`parallel-free`). Đối số `count`
  của bên gọi được ưu tiên, tiếp theo là `tools.web.search.maxResults`; nếu không có,
  OpenClaw sử dụng giá trị mặc định `web_search` chung (5) -- API riêng của Parallel
  mặc định là 10.
- Theo mặc định, kết quả được lưu vào bộ nhớ đệm trong 15 phút (`cacheTtlMinutes`).
- `parallel-free` tạo một `session_id` mới cho mỗi lệnh gọi thông qua quy trình bắt tay
  MCP khi bên gọi không cung cấp; trong trường hợp đó, `parallel` để giá trị này chưa đặt.

## Liên quan

- [Tổng quan về tìm kiếm web](/vi/tools/web) -- tất cả nhà cung cấp và tính năng tự động phát hiện
- [Tìm kiếm Exa](/vi/tools/exa-search) -- tìm kiếm nơ-ron có trích xuất nội dung
- [Tìm kiếm Perplexity](/vi/tools/perplexity-search) -- kết quả có cấu trúc với tính năng lọc theo miền
