---
read_when:
    - Bạn muốn bật hoặc cấu hình web_search
    - Bạn muốn bật hoặc cấu hình x_search
    - Bạn cần chọn một nhà cung cấp dịch vụ tìm kiếm
    - Bạn muốn tìm hiểu về tính năng tự động phát hiện và lựa chọn nhà cung cấp
sidebarTitle: Web Search
summary: web_search, x_search và web_fetch -- tìm kiếm trên web, tìm kiếm bài đăng trên X hoặc truy xuất nội dung trang
title: Tìm kiếm trên web
x-i18n:
    generated_at: "2026-07-19T06:06:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb824277fed079a0978499a57a2e0946b7cf3079ef3394a64b30c8df049a29ee
    source_path: tools/web.md
    workflow: 16
---

`web_search` tìm kiếm trên web bằng nhà cung cấp đã cấu hình và trả về
các kết quả đã chuẩn hóa, được lưu vào bộ nhớ đệm theo truy vấn trong 15 phút (có thể cấu hình). OpenClaw
cũng tích hợp `x_search` dành cho các bài đăng trên X (trước đây là Twitter) và `web_fetch` để
tải URL ở mức nhẹ. `web_fetch` luôn chạy cục bộ; `web_search` định tuyến
qua xAI Responses khi Grok là nhà cung cấp, còn `x_search` luôn sử dụng
xAI Responses.

<Info>
  `web_search` là một công cụ HTTP nhẹ, không phải công cụ tự động hóa trình duyệt. Đối với
  các trang phụ thuộc nhiều vào JS hoặc yêu cầu đăng nhập, hãy sử dụng [Trình duyệt web](/vi/tools/browser). Để
  tải một URL cụ thể, hãy sử dụng [Tải nội dung web](/vi/tools/web-fetch).
</Info>

## Bắt đầu nhanh

<Steps>
  <Step title="Chọn nhà cung cấp">
    Chọn một nhà cung cấp và hoàn tất mọi thiết lập bắt buộc. Một số nhà cung cấp
    không cần khóa, trong khi những nhà cung cấp khác yêu cầu khóa API. Xem các trang về nhà cung cấp bên dưới để biết
    chi tiết.
  </Step>
  <Step title="Cấu hình">
    ```bash
    openclaw configure --section web
    ```
    Thao tác này lưu nhà cung cấp và mọi thông tin xác thực cần thiết. Đối với các nhà cung cấp
    dựa trên API, bạn có thể đặt biến môi trường của nhà cung cấp (ví dụ:
    `BRAVE_API_KEY`) và bỏ qua bước này.
  </Step>
  <Step title="Sử dụng">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Đối với các bài đăng trên X:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Chọn nhà cung cấp

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/vi/tools/brave-search">
    Kết quả có cấu trúc kèm đoạn trích. Hỗ trợ chế độ `llm-context` và bộ lọc quốc gia/ngôn ngữ. Có gói miễn phí.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/vi/plugins/codex-harness">
    Câu trả lời có căn cứ do AI tổng hợp thông qua tài khoản Codex app-server của bạn.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/vi/tools/duckduckgo-search">
    Nhà cung cấp không cần khóa. Không yêu cầu khóa API. Tích hợp không chính thức dựa trên HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/vi/tools/exa-search">
    Tìm kiếm bằng mạng nơ-ron + từ khóa với khả năng trích xuất nội dung (điểm nổi bật, văn bản, bản tóm tắt).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/vi/tools/firecrawl">
    Kết quả có cấu trúc. Hiệu quả nhất khi kết hợp với `firecrawl_search` và `firecrawl_scrape` để trích xuất chuyên sâu.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/vi/tools/gemini-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn, có căn cứ từ Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/vi/tools/grok-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn, có căn cứ từ web qua xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/vi/tools/kimi-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua tìm kiếm web của Moonshot; các phương án dự phòng dùng trò chuyện không có căn cứ sẽ báo lỗi rõ ràng.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/vi/tools/minimax-search">
    Kết quả có cấu trúc thông qua API tìm kiếm MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/vi/tools/ollama-search">
    Tìm kiếm qua máy chủ Ollama cục bộ đã đăng nhập hoặc API Ollama được lưu trữ.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/vi/tools/parallel-search">
    API Parallel Search trả phí (`PARALLEL_API_KEY`); giới hạn tần suất cao hơn và khả năng tinh chỉnh mục tiêu.
  </Card>
  <Card title="Parallel Search (Miễn phí)" icon="layer-group" href="/vi/tools/parallel-search">
    Tùy chọn tham gia không cần khóa. Search MCP miễn phí của Parallel, với các đoạn trích cô đọng được tối ưu hóa cho LLM và không cần khóa API.
  </Card>
  <Card title="Perplexity" icon="search" href="/vi/tools/perplexity-search">
    Kết quả có cấu trúc với các tùy chọn kiểm soát trích xuất nội dung và lọc miền.
  </Card>
  <Card title="SearXNG" icon="server" href="/vi/tools/searxng-search">
    Công cụ siêu tìm kiếm tự lưu trữ. Không cần khóa API. Tổng hợp Google, Bing, DuckDuckGo và nhiều nguồn khác.
  </Card>
  <Card title="Tavily" icon="globe" href="/vi/tools/tavily">
    Kết quả có cấu trúc với độ sâu tìm kiếm, bộ lọc chủ đề và `tavily_extract` để trích xuất URL.
  </Card>
</CardGroup>

### So sánh nhà cung cấp

| Nhà cung cấp                                    | Kiểu kết quả                                                          | Bộ lọc                                                   | Khóa API                                                                                             |
| ------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [Brave](/vi/tools/brave-search)                     | Đoạn trích có cấu trúc                                                | Quốc gia, ngôn ngữ, thời gian, chế độ `llm-context` | `BRAVE_API_KEY`                                                                                   |
| [Codex Hosted Search](/vi/plugins/codex-harness)    | Nội dung do AI tổng hợp + URL nguồn                                   | Miền, kích thước ngữ cảnh, vị trí người dùng             | Không; sử dụng thông tin đăng nhập Codex/OpenAI                                                      |
| [DuckDuckGo](/vi/tools/duckduckgo-search)           | Đoạn trích có cấu trúc                                                | --                                                       | Không (không cần khóa)                                                                               |
| [Exa](/vi/tools/exa-search)                         | Có cấu trúc + được trích xuất                                         | Chế độ mạng nơ-ron/từ khóa, ngày, trích xuất nội dung    | `EXA_API_KEY`                                                                                   |
| [Firecrawl](/vi/tools/firecrawl)                    | Đoạn trích có cấu trúc                                                | Qua công cụ `firecrawl_search`                           | `FIRECRAWL_API_KEY`                                                                                   |
| [Gemini](/vi/tools/gemini-search)                   | Nội dung do AI tổng hợp + trích dẫn                                   | --                                                       | `GEMINI_API_KEY`                                                                                   |
| [Grok](/vi/tools/grok-search)                       | Nội dung do AI tổng hợp + trích dẫn                                   | --                                                       | OAuth xAI, `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey`                                                |
| [Kimi](/vi/tools/kimi-search)                       | Nội dung do AI tổng hợp + trích dẫn; báo lỗi khi phương án dự phòng dùng trò chuyện không có căn cứ | --                           | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                             |
| [MiniMax Search](/vi/tools/minimax-search)          | Đoạn trích có cấu trúc                                                | Khu vực (`global` / `cn`)       | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`                                        |
| [Ollama Web Search](/vi/tools/ollama-search)        | Đoạn trích có cấu trúc                                                | --                                                       | Không đối với máy chủ cục bộ đã đăng nhập; `OLLAMA_API_KEY` cho tìm kiếm trực tiếp bằng `https://ollama.com` |
| [Parallel](/vi/tools/parallel-search)               | Các đoạn trích cô đọng được xếp hạng cho ngữ cảnh LLM                 | --                                                       | `PARALLEL_API_KEY` (trả phí)                                                                         |
| [Parallel Search (Miễn phí)](/vi/tools/parallel-search) | Các đoạn trích cô đọng được xếp hạng cho ngữ cảnh LLM              | --                                                       | Không (Search MCP miễn phí)                                                                          |
| [Perplexity](/vi/tools/perplexity-search)           | Đoạn trích có cấu trúc                                                | Quốc gia, ngôn ngữ, thời gian, miền, giới hạn nội dung   | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                                             |
| [SearXNG](/vi/tools/searxng-search)                 | Đoạn trích có cấu trúc                                                | Danh mục, ngôn ngữ                                       | Không (tự lưu trữ)                                                                                    |
| [Tavily](/vi/tools/tavily)                          | Đoạn trích có cấu trúc                                                | Qua công cụ `tavily_search`                           | `TAVILY_API_KEY`                                                                                   |

## Cấu trúc kết quả

`web_search` chuẩn hóa mọi nhà cung cấp Plugin tích hợp sẵn và bên ngoài tại ranh giới
công cụ lõi. Bên gọi nhận chính xác một trong các cấu trúc đóng sau:

```typescript
type WebSearchOutput =
  | {
      kind: "error";
      provider: string;
      error: "provider_error";
      message: string;
      docs?: string;
    }
  | {
      kind: "results";
      provider: string;
      query: string;
      count: number;
      tookMs?: number;
      results: Array<{
        title: string;
        url: string;
        snippet?: string;
        published?: string;
        siteName?: string;
      }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "answer";
      provider: string;
      query: string;
      tookMs?: number;
      content: string;
      citations?: Array<{ url: string; title?: string }>;
      externalContent: {
        untrusted: true;
        source: "web_search";
        wrapped: true;
        provider: string;
      };
      cached?: true;
    }
  | {
      kind: "raw";
      provider: string;
      data: unknown;
    };
```

Các nhà cung cấp có cấu trúc sử dụng `kind: "results"`; các nhà cung cấp tổng hợp sử dụng
`kind: "answer"`. Các nhà cung cấp Plugin bên ngoài có tải dữ liệu không khớp với cấu trúc nào
sẽ được chuyển nguyên trạng dưới dạng `kind: "raw"` để đảm bảo khả năng tương thích. Các trường dành riêng cho
nhà cung cấp như điểm số thô, đoạn trích, tìm kiếm liên quan, độ lệch
trích dẫn nội tuyến, mã định danh mô hình hoặc siêu dữ liệu phiên sẽ không được chuyển tiếp trên các nhánh
đã chuẩn hóa. Hãy sử dụng công cụ chuyên dụng của nhà cung cấp khi phản hồi phong phú hơn của công cụ đó là một phần trong
quy trình làm việc của bạn.

`externalContent.wrapped: true` là dấu hiệu tin cậy mà chính ranh giới này đảm bảo là
đúng: văn bản từ nhà cung cấp (`title`, `snippet`, `siteName`, `content`, tiêu đề
trích dẫn, lỗi `message`) được loại bỏ mọi dòng bao bọc có sẵn và
được bao bọc lại chính xác một lần tại ranh giới lõi, vì vậy không siêu dữ liệu nào của nhà cung cấp có thể giả mạo
dấu hiệu này. `query` luôn là truy vấn được yêu cầu, URL của trích dẫn và kết quả
phải phân tích được dưới dạng http(s), `published` phải có định dạng ngày ISO, URL được xuất ở dạng chuẩn hóa và một
tải dữ liệu chứa khóa `error` luôn được báo cáo là `kind: "error"`, với
mã thô của nhà cung cấp được giữ nguyên bên trong thông báo đã bao bọc. Các tải dữ liệu được chuyển nguyên trạng
giữ lại mọi dấu hiệu do nhà cung cấp đặt.

## Tự động phát hiện

Danh sách nhà cung cấp trong tài liệu và luồng thiết lập được sắp xếp theo thứ tự bảng chữ cái. Tính năng tự động phát hiện sử dụng
một thứ tự ưu tiên cố định riêng biệt và chỉ chọn nhà cung cấp cần
thông tin xác thực (`requiresCredential !== false`) khi tìm thấy thông tin đó đã được cấu hình. Nếu
không đặt `provider`, OpenClaw sẽ kiểm tra các nhà cung cấp theo thứ tự sau và sử dụng
nhà cung cấp sẵn sàng đầu tiên:

Trước tiên là các nhà cung cấp dựa trên API:

1. **Brave** -- `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey` (thứ tự 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` hoặc `plugins.entries.minimax.config.webSearch.apiKey` (thứ tự 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` hoặc `models.providers.google.apiKey` (thứ tự 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey` (thứ tự 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` hoặc `plugins.entries.moonshot.config.webSearch.apiKey` (thứ tự 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` hoặc `plugins.entries.perplexity.config.webSearch.apiKey` (thứ tự 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey` (thứ tự 60)
8. **Exa** -- `EXA_API_KEY` hoặc `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` tùy chọn sẽ ghi đè điểm cuối Exa (thứ tự 65)
9. **Tavily** -- `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey` (thứ tự 70)
10. **Parallel** -- API Parallel Search trả phí qua `PARALLEL_API_KEY` hoặc `plugins.entries.parallel.config.webSearch.apiKey`; `plugins.entries.parallel.config.webSearch.baseUrl` tùy chọn sẽ ghi đè điểm cuối (thứ tự 75)

Sau đó là các nhà cung cấp điểm cuối đã cấu hình:

11. **SearXNG** -- `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl` (thứ tự 200)

Các nhà cung cấp không cần khóa như **Parallel Search (Free)**, **DuckDuckGo**,
**Ollama Web Search** và **Codex Hosted Search** không bao giờ được tự động phát hiện ưu tiên,
dù chúng có giá trị thứ tự nội bộ. Chúng chỉ được sử dụng khi bạn
chọn rõ ràng bằng `tools.web.search.provider` hoặc thông qua
`openclaw configure --section web`. OpenClaw không gửi các truy vấn
`web_search` được quản lý đến một nhà cung cấp không cần khóa chỉ vì chưa cấu hình
nhà cung cấp dựa trên API nào.

Các mô hình OpenAI Responses là một ngoại lệ: khi chưa đặt `tools.web.search.provider`,
chúng sử dụng chức năng tìm kiếm web gốc của OpenAI thay vì các nhà cung cấp
được quản lý ở trên (xem bên dưới). Đặt `tools.web.search.provider` thành
`parallel-free` (hoặc một nhà cung cấp khác) để định tuyến chúng qua đường dẫn được quản lý
thay thế.

<Note>
  Tất cả các trường khóa của nhà cung cấp đều hỗ trợ đối tượng SecretRef. Các SecretRef trong phạm vi Plugin
  thuộc `plugins.entries.<plugin>.config.webSearch.apiKey` được phân giải cho các
  nhà cung cấp tìm kiếm web dựa trên API đã cài đặt, bao gồm Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity và Tavily,
  dù nhà cung cấp được chọn rõ ràng qua `tools.web.search.provider` hay
  được chọn bằng tự động phát hiện. Trong chế độ tự động phát hiện, OpenClaw chỉ phân giải
  khóa của nhà cung cấp được chọn -- các SecretRef không được chọn vẫn không hoạt động, vì vậy bạn có thể
  cấu hình nhiều nhà cung cấp mà không phải chịu chi phí phân giải cho những nhà cung cấp
  không sử dụng.
</Note>

## Tìm kiếm web gốc của OpenAI

Các mô hình OpenAI Responses trực tiếp (`api: "openai-responses"`, nhà cung cấp `openai`,
không có URL cơ sở hoặc sử dụng URL cơ sở API chính thức của OpenAI) tự động sử dụng
công cụ `web_search` được lưu trữ của OpenAI khi tính năng tìm kiếm web của OpenClaw được bật và không
ghim nhà cung cấp được quản lý nào. Đây là hành vi thuộc quyền sở hữu của nhà cung cấp trong Plugin
OpenAI đi kèm và không áp dụng cho URL cơ sở proxy tương thích với OpenAI hoặc các
tuyến Azure. Đặt `tools.web.search.provider` thành một nhà cung cấp khác như `brave` để
tiếp tục sử dụng công cụ `web_search` được quản lý cho các mô hình OpenAI, hoặc đặt
`tools.web.search.enabled: false` để tắt cả tìm kiếm được quản lý lẫn tìm kiếm
gốc của OpenAI.

## Tìm kiếm web gốc của Codex

Runtime app-server Codex tự động sử dụng công cụ `web_search` được lưu trữ của Codex
khi tính năng tìm kiếm web được bật và chưa chọn nhà cung cấp được quản lý nào. Tìm kiếm được lưu trữ
gốc và công cụ động `web_search` được quản lý của OpenClaw loại trừ lẫn nhau,
vì vậy tìm kiếm được quản lý không thể vượt qua các hạn chế miền gốc. OpenClaw sử dụng
công cụ được quản lý khi tìm kiếm được lưu trữ không khả dụng, bị tắt rõ ràng hoặc
được thay thế bằng một nhà cung cấp được quản lý đã chọn. OpenClaw giữ phần mở rộng
`web.run` độc lập của Codex ở trạng thái tắt (`features.standalone_web_search: false`)
vì lưu lượng app-server sản xuất từ chối không gian tên `web`
do người dùng định nghĩa của phần mở rộng này.

- Cấu hình tìm kiếm gốc trong `tools.web.search.openaiCodex`
- Đặt `tools.web.search.provider: "codex"` để cấp phát Codex Hosted Search làm
  nhà cung cấp `web_search` được quản lý cho bất kỳ mô hình mẹ nào. Mỗi lệnh gọi chạy một
  lượt app-server Codex tạm thời có giới hạn và thất bại nếu Codex không phát ra một
  mục `webSearch` được lưu trữ.
- `mode: "cached"` là tùy chọn ưu tiên mặc định, nhưng Codex phân giải nó thành quyền
  truy cập bên ngoài trực tiếp cho các lượt app-server không bị hạn chế; đặt `"live"` để yêu cầu
  rõ ràng quyền truy cập trực tiếp
- Đặt `tools.web.search.provider` thành một nhà cung cấp được quản lý như `brave` để sử dụng
  `web_search` được quản lý của OpenClaw thay thế
- Đặt `tools.web.search.openaiCodex.enabled: false` để không sử dụng tìm kiếm
  do Codex lưu trữ; các nhà cung cấp được quản lý khác vẫn khả dụng
- Việc hạn chế bề mặt công cụ gốc của Codex cũng giữ cho `web_search` được quản lý
  khả dụng
- Khi đặt `allowedDomains`, cơ chế dự phòng được quản lý tự động sẽ đóng khi lỗi nếu
  tìm kiếm được lưu trữ không khả dụng, nhờ đó không thể vượt qua danh sách cho phép gốc
- Các lượt chỉ dùng LLM với công cụ bị tắt sẽ tắt cả tìm kiếm gốc lẫn tìm kiếm được quản lý
- `tools.web.search.enabled: false` tắt cả tìm kiếm được quản lý lẫn tìm kiếm gốc

Các thay đổi lâu dài đối với chính sách tìm kiếm Codex có hiệu lực sẽ bắt đầu một luồng liên kết mới để
một luồng app-server đã tải không thể tiếp tục duy trì quyền truy cập tìm kiếm được lưu trữ cũ.
Các hạn chế tạm thời theo từng lượt sử dụng một luồng hạn chế tạm thời và giữ nguyên
liên kết hiện có để tiếp tục sau này.

Lưu lượng OpenAI ChatGPT Responses trực tiếp cũng có thể sử dụng công cụ
`web_search` được lưu trữ của OpenAI. Đường dẫn riêng biệt đó vẫn phải được chủ động bật thông qua
`tools.web.search.openaiCodex.enabled: true` và chỉ áp dụng cho các mô hình
`openai/*` đủ điều kiện sử dụng `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Tùy chọn: cũng sử dụng Codex Hosted Search từ các mô hình mẹ không phải Codex.
        provider: "codex",
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

Đối với các runtime và nhà cung cấp không hỗ trợ tìm kiếm Codex gốc, Codex có thể
sử dụng phương án dự phòng `web_search` được quản lý thông qua không gian tên công cụ động của OpenClaw.
Hãy sử dụng một nhà cung cấp được quản lý rõ ràng khi bạn cần các biện pháp kiểm soát mạng
dành riêng cho nhà cung cấp của OpenClaw thay vì tìm kiếm do Codex lưu trữ.

Việc chọn `provider: "codex"` sẽ bật Plugin `codex` đi kèm và sử dụng
cùng các hạn chế `tools.web.search.openaiCodex` nêu trên. Trước tiên, hãy xác thực
app-server Codex bằng `openclaw models auth login --provider openai`.
Tác nhân mẹ có thể sử dụng bất kỳ mô hình hoặc runtime nào; chỉ trình thực thi tìm kiếm có giới hạn
chạy qua Codex.

## An toàn mạng

Các lệnh gọi nhà cung cấp HTTP `web_search` được quản lý sử dụng đường dẫn tìm nạp có bảo vệ của OpenClaw,
được giới hạn trong tên máy chủ riêng của nhà cung cấp hiện tại. Chỉ đối với tên máy chủ đó,
OpenClaw cho phép các kết quả DNS IP giả của Surge, Clash và sing-box trong
`198.18.0.0/15` và `fc00::/7`. Các đích riêng tư, loopback, link-local và
siêu dữ liệu khác vẫn bị chặn. Codex Hosted Search là ngoại lệ:
trình thực thi có giới hạn của nó ủy quyền quyền truy cập mạng cho công cụ
`web_search` được lưu trữ của app-server Codex.

Quyền cho phép tự động này không áp dụng cho các URL `web_fetch` tùy ý. Đối với
`web_fetch`, chỉ bật rõ ràng `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` và
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` khi proxy đáng tin cậy của bạn sở hữu
các dải tổng hợp đó.

## Cấu hình

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // mặc định: true
        provider: "brave", // hoặc bỏ qua để tự động phát hiện
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Cấu hình dành riêng cho nhà cung cấp (khóa API, URL cơ sở, chế độ) nằm trong
`plugins.entries.<plugin>.config.webSearch.*`. Gemini cũng có thể tái sử dụng
`models.providers.google.apiKey` và `models.providers.google.baseUrl` làm các phương án dự phòng
có mức ưu tiên thấp hơn sau cấu hình tìm kiếm web chuyên dụng và `GEMINI_API_KEY`. Xem
các trang về nhà cung cấp để biết ví dụ.
Grok cũng có thể tái sử dụng hồ sơ xác thực OAuth xAI từ `openclaw models auth login
--provider xai --method oauth`; cấu hình khóa API vẫn là phương án dự phòng.

`tools.web.search.provider` được xác thực dựa trên các mã định danh nhà cung cấp tìm kiếm web
được khai báo bởi manifest của các Plugin đi kèm và đã cài đặt. Lỗi chính tả như `"brvae"`
khiến quá trình xác thực cấu hình thất bại thay vì âm thầm chuyển về tự động phát hiện. Nếu một
nhà cung cấp đã cấu hình chỉ còn bằng chứng Plugin lỗi thời, chẳng hạn như khối
`plugins.entries.<plugin>` còn sót lại sau khi gỡ cài đặt Plugin bên thứ ba,
OpenClaw vẫn duy trì khả năng khởi động ổn định và báo cáo cảnh báo để bạn có thể cài đặt lại
Plugin hoặc chạy `openclaw doctor --fix` nhằm dọn dẹp cấu hình lỗi thời.

Việc chọn nhà cung cấp dự phòng `web_fetch` là riêng biệt:

- chọn bằng `tools.web.fetch.provider`
- hoặc bỏ qua trường đó và để OpenClaw tự động phát hiện nhà cung cấp tìm nạp web
  sẵn sàng đầu tiên từ thông tin xác thực đã cấu hình
- `web_fetch` không nằm trong sandbox có thể sử dụng các nhà cung cấp Plugin đã cài đặt khai báo
  `contracts.webFetchProviders`; các lượt tìm nạp trong sandbox cho phép nhà cung cấp đi kèm và
  các bản cài đặt Plugin chính thức đã xác minh, nhưng loại trừ các Plugin bên ngoài của bên thứ ba
- Plugin Firecrawl chính thức là bên đóng góp `webFetchProviders` đi kèm duy nhất
  hiện nay, được cấu hình trong
  `plugins.entries.firecrawl.config.webFetch.*`

Khi bạn chọn **Kimi** trong `openclaw onboard` hoặc
`openclaw configure --section web`, OpenClaw cũng có thể yêu cầu:

- khu vực API Moonshot (`https://api.moonshot.ai/v1` hoặc `https://api.moonshot.cn/v1`)
- mô hình tìm kiếm web Kimi mặc định (mặc định là `kimi-k2.6`)

Đối với `x_search`, hãy cấu hình `plugins.entries.xai.config.xSearch.*`. Nó sử dụng
cùng hồ sơ xác thực xAI với trò chuyện hoặc thông tin xác thực tìm kiếm web
`XAI_API_KEY` / Plugin được tìm kiếm web Grok sử dụng.
Cấu hình `tools.web.x_search.*` cũ được `openclaw doctor --fix` tự động di chuyển.
Khi bạn chọn Grok trong `openclaw onboard` hoặc `openclaw configure --section web`,
OpenClaw cũng cung cấp thiết lập `x_search` tùy chọn với cùng thông tin xác thực ngay
sau khi hoàn tất thiết lập Grok. Đây là một bước tiếp theo riêng biệt bên trong đường dẫn
Grok, không phải một lựa chọn nhà cung cấp tìm kiếm web cấp cao nhất riêng biệt. Nếu bạn chọn một
nhà cung cấp khác, OpenClaw không hiển thị lời nhắc `x_search`.

### Lưu trữ khóa API

<Tabs>
  <Tab title="Tệp cấu hình">
    Chạy `openclaw configure --section web` hoặc đặt khóa trực tiếp:

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Biến môi trường">
    Đặt biến môi trường của nhà cung cấp trong môi trường tiến trình Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Đối với bản cài đặt Gateway, hãy đặt biến này trong `~/.openclaw/.env`.
    Xem [Biến môi trường](/vi/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tham số công cụ

| Tham số               | Mô tả                                                               |
| --------------------- | ------------------------------------------------------------------- |
| `query`               | Truy vấn tìm kiếm (bắt buộc)                                        |
| `count`               | Số kết quả trả về (1-10, mặc định: 5)                               |
| `country`             | Mã quốc gia ISO gồm 2 chữ cái (ví dụ: "US", "DE")                   |
| `language`            | Mã ngôn ngữ ISO 639-1 (ví dụ: "en", "de")                           |
| `search_lang`         | Mã ngôn ngữ tìm kiếm (chỉ Brave)                                    |
| `freshness`           | Bộ lọc thời gian: `day`, `week`, `month` hoặc `year`                     |
| `date_after`          | Kết quả sau ngày này (YYYY-MM-DD)                                   |
| `date_before`         | Kết quả trước ngày này (YYYY-MM-DD)                                 |
| `ui_lang`             | Mã ngôn ngữ giao diện người dùng (chỉ Brave)                         |
| `domain_filter`       | Mảng danh sách cho phép/từ chối tên miền (chỉ Perplexity)            |
| `max_tokens`          | Tổng hạn mức token nội dung, chỉ dành cho API Perplexity Search gốc  |
| `max_tokens_per_page` | Giới hạn token trích xuất trên mỗi trang, chỉ dành cho API Perplexity Search gốc |

<Warning>
  Không phải tất cả tham số đều hoạt động với mọi nhà cung cấp. Chế độ `llm-context`
  của Brave từ chối `ui_lang`; `date_before` cũng cần `date_after` vì phạm vi
  độ mới tùy chỉnh của Brave yêu cầu cả ngày bắt đầu và ngày kết thúc.
  Gemini, Grok và Kimi trả về một câu trả lời tổng hợp kèm trích dẫn. Chúng
  chấp nhận `count` để tương thích với công cụ dùng chung, nhưng tham số này không thay đổi
  hình thức của câu trả lời có căn cứ. Gemini coi độ mới `day` là gợi ý về tính gần đây; các
  giá trị độ mới rộng hơn và ngày tháng rõ ràng sẽ đặt phạm vi thời gian căn cứ cho Google Search.
  Perplexity hoạt động tương tự khi bạn dùng đường dẫn tương thích
  Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` hoặc `OPENROUTER_API_KEY`); đường dẫn đó cũng không hỗ trợ `max_tokens` và
  `max_tokens_per_page`.
  SearXNG chỉ chấp nhận `http://` đối với máy chủ loopback hoặc mạng riêng đáng tin cậy;
  các điểm cuối SearXNG công khai phải dùng `https://`.
  Firecrawl và Tavily chỉ hỗ trợ `query` và `count` thông qua `web_search`
  -- hãy dùng các công cụ chuyên dụng của chúng cho những tùy chọn nâng cao.
</Warning>

## x_search

`x_search` truy vấn các bài đăng trên X (trước đây là Twitter) bằng xAI và trả về
câu trả lời do AI tổng hợp kèm trích dẫn. Công cụ chấp nhận truy vấn bằng ngôn ngữ tự nhiên và
các bộ lọc có cấu trúc tùy chọn. OpenClaw tạo công cụ `x_search` tích hợp sẵn của xAI
cho từng yêu cầu thay vì đăng ký công cụ này vĩnh viễn, vì vậy công cụ chỉ
hoạt động trong lượt thực sự gọi nó.

<Warning>
  `x_search` chạy trên máy chủ của xAI. xAI tính phí $5 cho mỗi 1,000 lượt gọi công cụ, cộng với
  token đầu vào và đầu ra của mô hình.
</Warning>

<Note>
  Tài liệu xAI nêu rằng `x_search` hỗ trợ tìm kiếm từ khóa, tìm kiếm ngữ nghĩa, tìm kiếm
  người dùng và truy xuất chuỗi thảo luận. Đối với số liệu tương tác của từng bài đăng như lượt đăng lại,
  phản hồi, dấu trang hoặc lượt xem, nên ưu tiên tra cứu có mục tiêu bằng URL chính xác
  hoặc ID trạng thái của bài đăng. Các tìm kiếm từ khóa rộng có thể tìm đúng bài đăng nhưng trả về
  siêu dữ liệu từng bài đăng ít đầy đủ hơn. Một cách làm hiệu quả là: trước tiên định vị bài đăng, sau đó
  chạy truy vấn `x_search` thứ hai tập trung vào chính xác bài đăng đó.
</Note>

### Cấu hình x_search

Khi bỏ qua `enabled`, `x_search` chỉ được hiển thị khi nhà cung cấp của mô hình đang hoạt động
là `xai` và thông tin xác thực xAI được phân giải. Đối với mô hình đang hoạt động có nhà cung cấp
không phải xAI đã biết, hãy đặt `plugins.entries.xai.config.xSearch.enabled` thành `true` để
chủ động bật việc sử dụng giữa các nhà cung cấp. Nếu nhà cung cấp của mô hình đang hoạt động bị thiếu hoặc
chưa được phân giải, công cụ vẫn bị ẩn. Đặt `enabled` thành `false` để vô hiệu hóa công cụ
đối với mọi nhà cung cấp. Thông tin xác thực xAI luôn là bắt buộc.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // bắt buộc đối với nhà cung cấp mô hình không phải xAI đã biết
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // tùy chọn, ghi đè webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // tùy chọn nếu đã đặt hồ sơ xác thực xAI hoặc XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // URL cơ sở Responses dùng chung của xAI, tùy chọn
          },
        },
      },
    },
  },
}
```

`x_search` gửi yêu cầu POST đến `<baseUrl>/responses` khi
`plugins.entries.xai.config.xSearch.baseUrl` được đặt. Nếu trường đó bị bỏ qua,
hệ thống sẽ chuyển sang `plugins.entries.xai.config.webSearch.baseUrl`, sau đó là
`tools.web.search.grok.baseUrl` cũ và cuối cùng là điểm cuối xAI công khai
(`https://api.x.ai/v1`).

### Tham số x_search

| Tham số                      | Mô tả                                                    |
| ---------------------------- | -------------------------------------------------------- |
| `query`                      | Truy vấn tìm kiếm (bắt buộc)                              |
| `allowed_x_handles`          | Giới hạn kết quả ở tối đa 20 tài khoản X                  |
| `excluded_x_handles`         | Loại trừ tối đa 20 tài khoản X                            |
| `from_date`                  | Chỉ bao gồm bài đăng vào hoặc sau ngày này (YYYY-MM-DD)   |
| `to_date`                    | Chỉ bao gồm bài đăng vào hoặc trước ngày này (YYYY-MM-DD) |
| `enable_image_understanding` | Cho phép xAI kiểm tra hình ảnh đính kèm bài đăng phù hợp  |
| `enable_video_understanding` | Cho phép xAI kiểm tra video đính kèm bài đăng phù hợp     |

`allowed_x_handles` và `excluded_x_handles` loại trừ lẫn nhau.

### Ví dụ về x_search

```javascript
await x_search({
  query: "công thức bữa tối",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Số liệu từng bài đăng: dùng URL trạng thái hoặc ID trạng thái chính xác khi có thể
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Ví dụ

```javascript
// Tìm kiếm cơ bản
await web_search({ query: "SDK plugin OpenClaw" });

// Tìm kiếm dành riêng cho tiếng Đức
await web_search({ query: "xem TV trực tuyến", country: "DE", language: "de" });

// Kết quả gần đây (tuần qua)
await web_search({ query: "các phát triển về AI", freshness: "week" });

// Phạm vi ngày
await web_search({
  query: "nghiên cứu khí hậu",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Lọc tên miền (chỉ Perplexity)
await web_search({
  query: "đánh giá sản phẩm",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Hồ sơ công cụ

Nếu bạn sử dụng hồ sơ công cụ hoặc danh sách cho phép, hãy thêm `web_search`, `x_search` hoặc `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // hoặc: allow: ["group:web"]  (bao gồm web_search, x_search và web_fetch)
  },
}
```

## Liên quan

- [Web Fetch](/vi/tools/web-fetch) -- tìm nạp URL và trích xuất nội dung dễ đọc
- [Trình duyệt web](/vi/tools/browser) -- tự động hóa trình duyệt đầy đủ cho các trang phụ thuộc nhiều vào JS
- [Tìm kiếm Grok](/vi/tools/grok-search) -- Grok làm nhà cung cấp `web_search`
- [Tìm kiếm web Ollama](/vi/tools/ollama-search) -- tìm kiếm web không cần khóa thông qua máy chủ Ollama của bạn
