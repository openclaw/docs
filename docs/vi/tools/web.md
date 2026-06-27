---
read_when:
    - Bạn muốn bật hoặc cấu hình web_search
    - Bạn muốn bật hoặc cấu hình x_search
    - Bạn cần chọn một nhà cung cấp tìm kiếm
    - Bạn muốn hiểu về tự động phát hiện và lựa chọn nhà cung cấp
sidebarTitle: Web Search
summary: web_search, x_search, và web_fetch -- tìm kiếm trên web, tìm kiếm bài đăng trên X, hoặc tìm nạp nội dung trang
title: Tìm kiếm trên web
x-i18n:
    generated_at: "2026-06-27T18:20:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a448de6760546863b840118ab04fec8ef4b3213c124a7f229ffe67536327f9a4
    source_path: tools/web.md
    workflow: 16
---

Công cụ `web_search` tìm kiếm trên web bằng nhà cung cấp bạn đã cấu hình và
trả về kết quả. Kết quả được lưu vào bộ nhớ đệm theo truy vấn trong 15 phút (có thể cấu hình).

OpenClaw cũng bao gồm `x_search` cho bài đăng trên X (trước đây là Twitter) và
`web_fetch` để tải URL nhẹ. Trong giai đoạn này, `web_fetch` vẫn chạy
cục bộ, trong khi `web_search` và `x_search` có thể dùng xAI Responses ở bên dưới.

<Info>
  `web_search` là công cụ HTTP nhẹ, không phải tự động hóa trình duyệt. Với
  các trang nặng về JS hoặc yêu cầu đăng nhập, hãy dùng [Trình duyệt web](/vi/tools/browser). Để
  tải một URL cụ thể, hãy dùng [Tải web](/vi/tools/web-fetch).
</Info>

## Bắt đầu nhanh

<Steps>
  <Step title="Choose a provider">
    Chọn một nhà cung cấp và hoàn tất mọi thiết lập bắt buộc. Một số nhà cung cấp
    không cần khóa, trong khi những nhà cung cấp khác dùng khóa API. Xem các trang nhà cung cấp bên dưới để biết
    chi tiết.
  </Step>
  <Step title="Configure">
    ```bash
    openclaw configure --section web
    ```
    Lệnh này lưu nhà cung cấp và mọi thông tin xác thực cần thiết. Bạn cũng có thể đặt một biến môi trường
    (ví dụ `BRAVE_API_KEY`) và bỏ qua bước này đối với các nhà cung cấp
    dựa trên API.
  </Step>
  <Step title="Use it">
    Agent hiện có thể gọi `web_search`:

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Với bài đăng trên X, hãy dùng:

    ```javascript
    await x_search({ query: "dinner recipes" });
    ```

  </Step>
</Steps>

## Chọn nhà cung cấp

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/vi/tools/brave-search">
    Kết quả có cấu trúc kèm đoạn trích. Hỗ trợ chế độ `llm-context`, bộ lọc quốc gia/ngôn ngữ. Có gói miễn phí.
  </Card>
  <Card title="Codex Hosted Search" icon="search" href="/vi/plugins/codex-harness">
    Câu trả lời do AI tổng hợp, có căn cứ, thông qua tài khoản máy chủ ứng dụng Codex của bạn.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/vi/tools/duckduckgo-search">
    Nhà cung cấp không cần khóa. Không cần khóa API. Tích hợp không chính thức dựa trên HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/vi/tools/exa-search">
    Tìm kiếm neural + từ khóa với trích xuất nội dung (đoạn nổi bật, văn bản, tóm tắt).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/vi/tools/firecrawl">
    Kết quả có cấu trúc. Hiệu quả nhất khi kết hợp với `firecrawl_search` và `firecrawl_scrape` để trích xuất sâu.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/vi/tools/gemini-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua nền tảng căn cứ Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/vi/tools/grok-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua nền tảng căn cứ web của xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/vi/tools/kimi-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua tìm kiếm web Moonshot; các phương án dự phòng chat không có căn cứ sẽ thất bại rõ ràng.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/vi/tools/minimax-search">
    Kết quả có cấu trúc thông qua API tìm kiếm MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/vi/tools/ollama-search">
    Tìm kiếm thông qua máy chủ Ollama cục bộ đã đăng nhập hoặc API Ollama được lưu trữ.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/vi/tools/parallel-search">
    API Parallel Search trả phí (`PARALLEL_API_KEY`); giới hạn tốc độ cao hơn và tinh chỉnh mục tiêu.
  </Card>
  <Card title="Parallel Search (Free)" icon="layer-group" href="/vi/tools/parallel-search">
    Tùy chọn tham gia không cần khóa. Search MCP miễn phí của Parallel, với trích đoạn dày đặc được tối ưu cho LLM và không cần khóa API.
  </Card>
  <Card title="Perplexity" icon="search" href="/vi/tools/perplexity-search">
    Kết quả có cấu trúc với điều khiển trích xuất nội dung và lọc miền.
  </Card>
  <Card title="SearXNG" icon="server" href="/vi/tools/searxng-search">
    Siêu tìm kiếm tự lưu trữ. Không cần khóa API. Tổng hợp Google, Bing, DuckDuckGo và nhiều nguồn khác.
  </Card>
  <Card title="Tavily" icon="globe" href="/vi/tools/tavily">
    Kết quả có cấu trúc với độ sâu tìm kiếm, lọc chủ đề và `tavily_extract` để trích xuất URL.
  </Card>
</CardGroup>

### So sánh nhà cung cấp

| Nhà cung cấp                                    | Kiểu kết quả                                                   | Bộ lọc                                          | Khóa API                                                                                |
| ------------------------------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| [Brave](/vi/tools/brave-search)                     | Đoạn trích có cấu trúc                                         | Quốc gia, ngôn ngữ, thời gian, chế độ `llm-context` | `BRAVE_API_KEY`                                                                         |
| [Codex Hosted Search](/vi/plugins/codex-harness)    | Do AI tổng hợp + URL nguồn                                     | Miền, kích thước ngữ cảnh, vị trí người dùng     | Không có; dùng đăng nhập Codex/OpenAI                                                   |
| [DuckDuckGo](/vi/tools/duckduckgo-search)           | Đoạn trích có cấu trúc                                         | --                                               | Không có (không cần khóa)                                                              |
| [Exa](/vi/tools/exa-search)                         | Có cấu trúc + đã trích xuất                                    | Chế độ neural/từ khóa, ngày, trích xuất nội dung | `EXA_API_KEY`                                                                           |
| [Firecrawl](/vi/tools/firecrawl)                    | Đoạn trích có cấu trúc                                         | Qua công cụ `firecrawl_search`                   | `FIRECRAWL_API_KEY`                                                                     |
| [Gemini](/vi/tools/gemini-search)                   | Do AI tổng hợp + trích dẫn                                     | --                                               | `GEMINI_API_KEY`                                                                        |
| [Grok](/vi/tools/grok-search)                       | Do AI tổng hợp + trích dẫn                                     | --                                               | OAuth xAI, `XAI_API_KEY`, hoặc `plugins.entries.xai.config.webSearch.apiKey`            |
| [Kimi](/vi/tools/kimi-search)                       | Do AI tổng hợp + trích dẫn; thất bại với dự phòng chat không có căn cứ | --                                               | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                     |
| [MiniMax Search](/vi/tools/minimax-search)          | Đoạn trích có cấu trúc                                         | Khu vực (`global` / `cn`)                        | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`              |
| [Ollama Web Search](/vi/tools/ollama-search)        | Đoạn trích có cấu trúc                                         | --                                               | Không có cho máy chủ cục bộ đã đăng nhập; `OLLAMA_API_KEY` cho tìm kiếm trực tiếp `https://ollama.com` |
| [Parallel](/vi/tools/parallel-search)               | Trích đoạn dày đặc được xếp hạng cho ngữ cảnh LLM              | --                                               | `PARALLEL_API_KEY` (trả phí)                                                           |
| [Parallel Search (Free)](/vi/tools/parallel-search) | Trích đoạn dày đặc được xếp hạng cho ngữ cảnh LLM              | --                                               | Không có (Search MCP miễn phí)                                                         |
| [Perplexity](/vi/tools/perplexity-search)           | Đoạn trích có cấu trúc                                         | Quốc gia, ngôn ngữ, thời gian, miền, giới hạn nội dung | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                             |
| [SearXNG](/vi/tools/searxng-search)                 | Đoạn trích có cấu trúc                                         | Danh mục, ngôn ngữ                               | Không có (tự lưu trữ)                                                                  |
| [Tavily](/vi/tools/tavily)                          | Đoạn trích có cấu trúc                                         | Qua công cụ `tavily_search`                      | `TAVILY_API_KEY`                                                                        |

## Tự động phát hiện

## Tìm kiếm web OpenAI gốc

Các mô hình OpenAI Responses trực tiếp tự động dùng công cụ `web_search` được lưu trữ của OpenAI khi tìm kiếm web OpenClaw được bật và không ghim nhà cung cấp được quản lý nào. Đây là hành vi do nhà cung cấp sở hữu trong Plugin OpenAI đi kèm và chỉ áp dụng cho lưu lượng API OpenAI gốc, không áp dụng cho URL cơ sở proxy tương thích OpenAI hoặc các tuyến Azure. Đặt `tools.web.search.provider` thành nhà cung cấp khác như `brave` để giữ công cụ `web_search` được quản lý cho các mô hình OpenAI, hoặc đặt `tools.web.search.enabled: false` để tắt cả tìm kiếm được quản lý lẫn tìm kiếm OpenAI gốc.

## Tìm kiếm web Codex gốc

Runtime máy chủ ứng dụng Codex tự động dùng công cụ `web_search` được lưu trữ của Codex
khi tìm kiếm web được bật và không chọn nhà cung cấp được quản lý nào. Tìm kiếm được lưu trữ gốc
và công cụ động `web_search` được quản lý của OpenClaw loại trừ lẫn nhau,
nên tìm kiếm được quản lý không thể vượt qua các hạn chế miền gốc. OpenClaw dùng
công cụ được quản lý khi tìm kiếm được lưu trữ không khả dụng, bị tắt rõ ràng hoặc
được thay thế bằng một nhà cung cấp được quản lý đã chọn. OpenClaw giữ phần mở rộng độc lập
`web.run` của Codex ở trạng thái tắt vì lưu lượng máy chủ ứng dụng sản xuất từ chối
namespace `web` do người dùng định nghĩa.

- Cấu hình tìm kiếm gốc trong `tools.web.search.openaiCodex`
- Đặt `tools.web.search.provider: "codex"` để cấp phát Codex Hosted Search làm
  nhà cung cấp `web_search` được quản lý cho mọi mô hình cha. Mỗi lệnh gọi chạy một
  lượt máy chủ ứng dụng Codex tạm thời có giới hạn và thất bại nếu Codex không phát ra một
  mục `webSearch` được lưu trữ.
- `mode: "cached"` là tùy chọn mặc định, nhưng Codex phân giải nó thành quyền truy cập bên ngoài
  trực tiếp cho các lượt máy chủ ứng dụng không bị hạn chế; đặt `"live"` để yêu cầu
  quyền truy cập trực tiếp rõ ràng
- Đặt `tools.web.search.provider` thành một nhà cung cấp được quản lý như `brave` để dùng
  `web_search` được quản lý của OpenClaw thay thế
- Đặt `tools.web.search.openaiCodex.enabled: false` để không dùng tìm kiếm
  do Codex lưu trữ; các nhà cung cấp được quản lý khác vẫn khả dụng
- Việc hạn chế bề mặt công cụ Codex gốc cũng giữ cho `web_search` được quản lý
  khả dụng
- Khi đặt `allowedDomains`, phương án dự phòng được quản lý tự động sẽ thất bại đóng nếu
  tìm kiếm được lưu trữ không khả dụng, để danh sách cho phép gốc không thể bị vượt qua
- Các lượt chạy chỉ dùng LLM với công cụ bị tắt sẽ tắt cả tìm kiếm gốc lẫn tìm kiếm được quản lý
- `tools.web.search.enabled: false` tắt cả tìm kiếm được quản lý lẫn tìm kiếm gốc

Các thay đổi chính sách tìm kiếm Codex hiệu lực bền vững sẽ bắt đầu một luồng đã ràng buộc mới để
một luồng máy chủ ứng dụng đã tải không thể giữ quyền truy cập tìm kiếm được lưu trữ đã cũ.
Các hạn chế tạm thời theo từng lượt dùng một luồng bị hạn chế tạm thời và giữ nguyên
ràng buộc hiện có để tiếp tục về sau.

Lưu lượng OpenAI ChatGPT Responses trực tiếp cũng có thể dùng công cụ
`web_search` được lưu trữ của OpenAI. Đường dẫn riêng đó vẫn là tùy chọn tham gia thông qua
`tools.web.search.openaiCodex.enabled: true` và chỉ áp dụng cho các mô hình
`openai/*` đủ điều kiện dùng `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Optional: use Codex Hosted Search from non-Codex parent models too.
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
dùng phương án dự phòng `web_search` được quản lý thông qua namespace công cụ động của OpenClaw.
Hãy dùng một nhà cung cấp được quản lý rõ ràng khi bạn cần các điều khiển mạng theo từng nhà cung cấp
của OpenClaw thay vì tìm kiếm do Codex lưu trữ.

Việc chọn `provider: "codex"` bật plugin `codex` được đóng gói sẵn và dùng các hạn chế `tools.web.search.openaiCodex` giống như trên. Trước tiên, hãy xác thực app-server Codex bằng `openclaw models auth login --provider openai`. Tác tử cha có thể dùng bất kỳ mô hình hoặc runtime nào; chỉ worker tìm kiếm bị giới hạn mới chạy qua Codex.

## An toàn mạng

Các lệnh gọi provider HTTP `web_search` được quản lý dùng đường dẫn fetch có bảo vệ của OpenClaw. Đối với các máy chủ API provider đáng tin cậy, OpenClaw cho phép các câu trả lời DNS fake-IP của Surge, Clash và sing-box trong `198.18.0.0/15` và `fc00::/7` chỉ cho hostname provider đó. Các đích private, loopback, link-local và metadata khác vẫn bị chặn. Codex Hosted Search là ngoại lệ: worker bị giới hạn của nó ủy quyền truy cập mạng cho công cụ `web_search` được host của app-server Codex.

Khoản cho phép tự động này không áp dụng cho các URL `web_fetch` tùy ý. Với `web_fetch`, chỉ bật rõ ràng `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` và `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` khi proxy đáng tin cậy của bạn sở hữu các dải tổng hợp đó.

## Thiết lập web search

Danh sách provider trong tài liệu và các luồng thiết lập được sắp xếp theo bảng chữ cái. Tự động phát hiện giữ một thứ tự ưu tiên riêng.

Nếu không đặt `provider`, OpenClaw kiểm tra provider theo thứ tự này và dùng provider đầu tiên đã sẵn sàng:

Trước tiên là các provider dựa trên API:

1. **Brave** -- `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey` (thứ tự 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` hoặc `plugins.entries.minimax.config.webSearch.apiKey` (thứ tự 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY`, hoặc `models.providers.google.apiKey` (thứ tự 20)
4. **Grok** -- xAI OAuth, `XAI_API_KEY`, hoặc `plugins.entries.xai.config.webSearch.apiKey` (thứ tự 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` hoặc `plugins.entries.moonshot.config.webSearch.apiKey` (thứ tự 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` hoặc `plugins.entries.perplexity.config.webSearch.apiKey` (thứ tự 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey` (thứ tự 60)
8. **Exa** -- `EXA_API_KEY` hoặc `plugins.entries.exa.config.webSearch.apiKey`; tùy chọn `plugins.entries.exa.config.webSearch.baseUrl` ghi đè endpoint Exa (thứ tự 65)
9. **Tavily** -- `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey` (thứ tự 70)
10. **Parallel** -- API Parallel Search trả phí qua `PARALLEL_API_KEY` hoặc `plugins.entries.parallel.config.webSearch.apiKey`; tùy chọn `plugins.entries.parallel.config.webSearch.baseUrl` ghi đè endpoint (thứ tự 75)

Sau đó là các provider endpoint đã cấu hình:

11. **SearXNG** -- `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl` (thứ tự 200)

Các provider không cần khóa như **Parallel Search (Free)**, **DuckDuckGo**, **Ollama Web Search** và **Codex Hosted Search** chỉ khả dụng khi bạn chọn chúng rõ ràng bằng `tools.web.search.provider` hoặc qua `openclaw configure --section web`. OpenClaw không gửi truy vấn `web_search` được quản lý đến provider không cần khóa chỉ vì không có provider dựa trên API nào được cấu hình.

Các mô hình OpenAI Responses là ngoại lệ: khi chưa đặt `tools.web.search.provider`, chúng dùng web search gốc của OpenAI thay vì các provider được quản lý ở trên. Đặt `tools.web.search.provider` thành `parallel-free` (hoặc provider khác) để định tuyến chúng qua đường dẫn được quản lý.

<Note>
  Tất cả trường khóa provider đều hỗ trợ đối tượng SecretRef. Các SecretRef theo phạm vi plugin dưới `plugins.entries.<plugin>.config.webSearch.apiKey` được phân giải cho các provider web search dựa trên API đã cài đặt, bao gồm Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity và Tavily, dù provider được chọn rõ ràng qua `tools.web.search.provider` hay được chọn bằng tự động phát hiện. Ở chế độ tự động phát hiện, OpenClaw chỉ phân giải khóa provider đã chọn -- các SecretRef không được chọn vẫn không hoạt động, vì vậy bạn có thể giữ cấu hình nhiều provider mà không tốn chi phí phân giải cho những provider không dùng.
</Note>

## Cấu hình

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // default: true
        provider: "brave", // or omit for auto-detection
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

Cấu hình riêng theo provider (khóa API, URL cơ sở, chế độ) nằm dưới `plugins.entries.<plugin>.config.webSearch.*`. Gemini cũng có thể tái sử dụng `models.providers.google.apiKey` và `models.providers.google.baseUrl` làm fallback có độ ưu tiên thấp hơn sau cấu hình web-search chuyên dụng và `GEMINI_API_KEY` của nó. Xem các trang provider để biết ví dụ. Grok cũng có thể tái sử dụng hồ sơ xác thực xAI OAuth từ `openclaw models auth login --provider xai --method oauth`; cấu hình khóa API vẫn là fallback.

`tools.web.search.provider` được xác thực dựa trên các id provider web-search do manifest plugin được đóng gói sẵn và đã cài đặt khai báo. Một lỗi chính tả như `"brvae"` sẽ làm xác thực cấu hình thất bại thay vì âm thầm fallback về tự động phát hiện. Nếu một provider đã cấu hình chỉ có bằng chứng plugin cũ, chẳng hạn khối `plugins.entries.<plugin>` còn sót lại sau khi gỡ cài đặt plugin bên thứ ba, OpenClaw vẫn giữ khởi động ổn định và báo cảnh báo để bạn có thể cài lại plugin hoặc chạy `openclaw doctor --fix` để dọn cấu hình cũ.

Lựa chọn provider fallback `web_fetch` là riêng biệt:

- chọn bằng `tools.web.fetch.provider`
- hoặc bỏ qua trường đó và để OpenClaw tự động phát hiện provider web-fetch sẵn sàng đầu tiên từ thông tin xác thực đã cấu hình
- `web_fetch` không sandbox có thể dùng các provider plugin đã cài đặt khai báo `contracts.webFetchProviders`; các fetch có sandbox cho phép provider được đóng gói sẵn và cài đặt plugin chính thức đã xác minh, nhưng loại trừ plugin bên ngoài của bên thứ ba
- plugin Firecrawl chính thức cung cấp fallback web-fetch, được cấu hình dưới `plugins.entries.firecrawl.config.webFetch.*`

Khi bạn chọn **Kimi** trong `openclaw onboard` hoặc `openclaw configure --section web`, OpenClaw cũng có thể hỏi về:

- vùng API Moonshot (`https://api.moonshot.ai/v1` hoặc `https://api.moonshot.cn/v1`)
- mô hình web-search Kimi mặc định (mặc định là `kimi-k2.6`)

Với `x_search`, cấu hình `plugins.entries.xai.config.xSearch.*`. Nó dùng cùng hồ sơ xác thực xAI như chat, hoặc thông tin xác thực `XAI_API_KEY` / web-search plugin mà Grok web search dùng. Cấu hình cũ `tools.web.x_search.*` được `openclaw doctor --fix` tự động di trú. Khi bạn chọn Grok trong `openclaw onboard` hoặc `openclaw configure --section web`, OpenClaw cũng có thể cung cấp thiết lập `x_search` tùy chọn với cùng thông tin xác thực. Đây là một bước tiếp theo riêng trong đường dẫn Grok, không phải một lựa chọn provider web-search cấp cao nhất riêng. Nếu bạn chọn provider khác, OpenClaw không hiển thị prompt `x_search`.

### Lưu trữ khóa API

<Tabs>
  <Tab title="Config file">
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
  <Tab title="Environment variable">
    Đặt biến môi trường provider trong môi trường tiến trình Gateway:

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    Với bản cài đặt gateway, đặt biến đó trong `~/.openclaw/.env`.
    Xem [biến môi trường](/vi/help/faq#env-vars-and-env-loading).

  </Tab>
</Tabs>

## Tham số công cụ

| Tham số               | Mô tả                                                  |
| --------------------- | ------------------------------------------------------ |
| `query`               | Truy vấn tìm kiếm (bắt buộc)                           |
| `count`               | Số kết quả trả về (1-10, mặc định: 5)                  |
| `country`             | Mã quốc gia ISO 2 chữ cái (ví dụ: "US", "DE")          |
| `language`            | Mã ngôn ngữ ISO 639-1 (ví dụ: "en", "de")             |
| `search_lang`         | Mã ngôn ngữ tìm kiếm (chỉ Brave)                       |
| `freshness`           | Bộ lọc thời gian: `day`, `week`, `month`, hoặc `year`  |
| `date_after`          | Kết quả sau ngày này (YYYY-MM-DD)                      |
| `date_before`         | Kết quả trước ngày này (YYYY-MM-DD)                    |
| `ui_lang`             | Mã ngôn ngữ UI (chỉ Brave)                             |
| `domain_filter`       | Mảng danh sách cho phép/từ chối domain (chỉ Perplexity) |
| `max_tokens`          | Ngân sách nội dung tổng, mặc định 25000 (chỉ Perplexity) |
| `max_tokens_per_page` | Giới hạn token mỗi trang, mặc định 2048 (chỉ Perplexity) |

<Warning>
  Không phải mọi tham số đều hoạt động với mọi provider. Chế độ `llm-context` của Brave từ chối `ui_lang`; `date_before` cũng cần `date_after` vì các khoảng freshness tùy chỉnh của Brave yêu cầu cả ngày bắt đầu và ngày kết thúc. Gemini, Grok và Kimi trả về một câu trả lời tổng hợp với trích dẫn. Chúng chấp nhận `count` để tương thích công cụ dùng chung, nhưng tham số đó không thay đổi dạng câu trả lời có căn cứ. Gemini xem freshness `day` như một gợi ý về độ gần đây; các giá trị freshness rộng hơn và ngày rõ ràng đặt khoảng thời gian grounding của Google Search. Perplexity hoạt động tương tự khi bạn dùng đường dẫn tương thích Sonar/OpenRouter (`plugins.entries.perplexity.config.webSearch.baseUrl` / `model` hoặc `OPENROUTER_API_KEY`). SearXNG chỉ chấp nhận `http://` cho các máy chủ private-network hoặc loopback đáng tin cậy; các endpoint SearXNG công khai phải dùng `https://`. Firecrawl và Tavily chỉ hỗ trợ `query` và `count` qua `web_search` -- hãy dùng các công cụ chuyên dụng của chúng cho tùy chọn nâng cao.
</Warning>

## x_search

`x_search` truy vấn bài đăng X (trước đây là Twitter) bằng xAI và trả về câu trả lời do AI tổng hợp kèm trích dẫn. Nó chấp nhận truy vấn ngôn ngữ tự nhiên và các bộ lọc có cấu trúc tùy chọn. OpenClaw chỉ bật công cụ `x_search` xAI tích hợp sẵn trên request phục vụ lệnh gọi công cụ này.

<Note>
  xAI ghi tài liệu rằng `x_search` hỗ trợ tìm kiếm từ khóa, tìm kiếm ngữ nghĩa, tìm kiếm người dùng và tải thread. Với các thống kê tương tác theo từng bài đăng như repost, trả lời, dấu trang hoặc lượt xem, nên dùng tra cứu có mục tiêu cho URL bài đăng hoặc status ID chính xác. Tìm kiếm từ khóa rộng có thể tìm đúng bài đăng nhưng trả về metadata theo từng bài đăng kém đầy đủ hơn. Một mẫu tốt là: trước tiên định vị bài đăng, sau đó chạy truy vấn `x_search` thứ hai tập trung vào đúng bài đăng đó.
</Note>

### Cấu hình x_search

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // optional, overrides webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // optional if an xAI auth profile or XAI_API_KEY is set
            baseUrl: "https://api.x.ai/v1", // optional shared xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` gửi POST đến `<baseUrl>/responses` khi đặt `plugins.entries.xai.config.xSearch.baseUrl`. Nếu bỏ qua trường đó, nó fallback về `plugins.entries.xai.config.webSearch.baseUrl`, rồi `tools.web.search.grok.baseUrl` cũ, và cuối cùng là endpoint xAI công khai.

### Tham số x_search

| Tham số                      | Mô tả                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `query`                      | Truy vấn tìm kiếm (bắt buộc)                           |
| `allowed_x_handles`          | Giới hạn kết quả ở các handle X cụ thể                 |
| `excluded_x_handles`         | Loại trừ các handle X cụ thể                           |
| `from_date`                  | Chỉ bao gồm bài đăng vào hoặc sau ngày này (YYYY-MM-DD) |
| `to_date`                    | Chỉ bao gồm bài đăng vào hoặc trước ngày này (YYYY-MM-DD) |
| `enable_image_understanding` | Cho phép xAI kiểm tra hình ảnh đính kèm với bài đăng khớp |
| `enable_video_understanding` | Cho phép xAI kiểm tra video đính kèm với bài đăng khớp |

### Ví dụ về x_search

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// Per-post stats: use the exact status URL or status ID when possible
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Ví dụ

```javascript
// Basic search
await web_search({ query: "OpenClaw plugin SDK" });

// German-specific search
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Recent results (past week)
await web_search({ query: "AI developments", freshness: "week" });

// Date range
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// Domain filtering (Perplexity only)
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## Hồ sơ công cụ

Nếu bạn dùng hồ sơ công cụ hoặc danh sách cho phép, hãy thêm `web_search`, `x_search`, hoặc `group:web`:

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // or: allow: ["group:web"]  (includes web_search, x_search, and web_fetch)
  },
}
```

## Liên quan

- [Tìm nạp web](/vi/tools/web-fetch) -- tìm nạp một URL và trích xuất nội dung dễ đọc
- [Trình duyệt web](/vi/tools/browser) -- tự động hóa trình duyệt đầy đủ cho các trang dùng nhiều JS
- [Tìm kiếm Grok](/vi/tools/grok-search) -- Grok làm nhà cung cấp `web_search`
- [Tìm kiếm web Ollama](/vi/tools/ollama-search) -- tìm kiếm web không cần khóa thông qua máy chủ Ollama của bạn
