---
read_when:
    - Bạn muốn bật hoặc cấu hình web_search
    - Bạn muốn bật hoặc cấu hình x_search
    - Bạn cần chọn một nhà cung cấp dịch vụ tìm kiếm
    - Bạn muốn tìm hiểu về tính năng tự động phát hiện và lựa chọn nhà cung cấp
sidebarTitle: Web Search
summary: web_search, x_search và web_fetch -- tìm kiếm trên web, tìm kiếm bài đăng trên X hoặc tải nội dung trang
title: Tìm kiếm trên web
x-i18n:
    generated_at: "2026-07-12T08:29:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58db549f5133a98a2ee9514f570ba8bd99b793e912ed3e0da296f454c88692a7
    source_path: tools/web.md
    workflow: 16
---

`web_search` tìm kiếm trên web bằng nhà cung cấp bạn đã cấu hình và trả về
kết quả đã chuẩn hóa, được lưu vào bộ nhớ đệm theo truy vấn trong 15 phút (có thể cấu hình). OpenClaw
cũng tích hợp `x_search` dành cho các bài đăng trên X (trước đây là Twitter) và `web_fetch` để
truy xuất URL nhẹ. `web_fetch` luôn chạy cục bộ; `web_search` được định tuyến
qua xAI Responses khi Grok là nhà cung cấp, còn `x_search` luôn sử dụng
xAI Responses.

<Info>
  `web_search` là một công cụ HTTP nhẹ, không phải công cụ tự động hóa trình duyệt. Với
  các trang phụ thuộc nhiều vào JS hoặc yêu cầu đăng nhập, hãy sử dụng [Trình duyệt web](/vi/tools/browser). Để
  truy xuất một URL cụ thể, hãy sử dụng [Truy xuất web](/vi/tools/web-fetch).
</Info>

## Bắt đầu nhanh

<Steps>
  <Step title="Chọn nhà cung cấp">
    Chọn một nhà cung cấp và hoàn tất mọi thiết lập bắt buộc. Một số nhà cung cấp
    không cần khóa, trong khi các nhà cung cấp khác cần khóa API. Xem các trang về nhà cung cấp bên dưới để biết
    chi tiết.
  </Step>
  <Step title="Cấu hình">
    ```bash
    openclaw configure --section web
    ```
    Thao tác này lưu nhà cung cấp và mọi thông tin xác thực cần thiết. Với các nhà cung cấp
    dựa trên API, bạn có thể đặt biến môi trường của nhà cung cấp (ví dụ:
    `BRAVE_API_KEY`) và bỏ qua bước này.
  </Step>
  <Step title="Sử dụng">
    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    Đối với bài đăng trên X:

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
    Câu trả lời có căn cứ do AI tổng hợp thông qua tài khoản máy chủ ứng dụng Codex của bạn.
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/vi/tools/duckduckgo-search">
    Nhà cung cấp không cần khóa. Không yêu cầu khóa API. Tích hợp không chính thức dựa trên HTML.
  </Card>
  <Card title="Exa" icon="brain" href="/vi/tools/exa-search">
    Tìm kiếm ngữ nghĩa + từ khóa kèm trích xuất nội dung (điểm nổi bật, văn bản, bản tóm tắt).
  </Card>
  <Card title="Firecrawl" icon="flame" href="/vi/tools/firecrawl">
    Kết quả có cấu trúc. Nên kết hợp với `firecrawl_search` và `firecrawl_scrape` để trích xuất chuyên sâu.
  </Card>
  <Card title="Gemini" icon="sparkles" href="/vi/tools/gemini-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua cơ chế căn cứ trên Google Search.
  </Card>
  <Card title="Grok" icon="zap" href="/vi/tools/grok-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua cơ chế căn cứ trên web của xAI.
  </Card>
  <Card title="Kimi" icon="moon" href="/vi/tools/kimi-search">
    Câu trả lời do AI tổng hợp kèm trích dẫn thông qua tìm kiếm web của Moonshot; các phương án dự phòng sang trò chuyện không có căn cứ sẽ báo lỗi rõ ràng.
  </Card>
  <Card title="MiniMax Search" icon="globe" href="/vi/tools/minimax-search">
    Kết quả có cấu trúc thông qua API tìm kiếm của MiniMax Token Plan.
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/vi/tools/ollama-search">
    Tìm kiếm thông qua máy chủ Ollama cục bộ đã đăng nhập hoặc API Ollama được lưu trữ.
  </Card>
  <Card title="Parallel" icon="layer-group" href="/vi/tools/parallel-search">
    API Parallel Search trả phí (`PARALLEL_API_KEY`); giới hạn tốc độ cao hơn và khả năng tinh chỉnh mục tiêu.
  </Card>
  <Card title="Parallel Search (Miễn phí)" icon="layer-group" href="/vi/tools/parallel-search">
    Tùy chọn không cần khóa. Search MCP miễn phí của Parallel, với các đoạn trích dày đặc được tối ưu hóa cho LLM và không cần khóa API.
  </Card>
  <Card title="Perplexity" icon="search" href="/vi/tools/perplexity-search">
    Kết quả có cấu trúc với các tùy chọn kiểm soát trích xuất nội dung và lọc miền.
  </Card>
  <Card title="SearXNG" icon="server" href="/vi/tools/searxng-search">
    Công cụ siêu tìm kiếm tự lưu trữ. Không cần khóa API. Tổng hợp Google, Bing, DuckDuckGo và các dịch vụ khác.
  </Card>
  <Card title="Tavily" icon="globe" href="/vi/tools/tavily">
    Kết quả có cấu trúc với độ sâu tìm kiếm, bộ lọc chủ đề và `tavily_extract` để trích xuất URL.
  </Card>
</CardGroup>

### So sánh nhà cung cấp

| Nhà cung cấp                                    | Kiểu kết quả                                                          | Bộ lọc                                                  | Khóa API                                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [Brave](/vi/tools/brave-search)                     | Đoạn trích có cấu trúc                                                | Quốc gia, ngôn ngữ, thời gian, chế độ `llm-context`     | `BRAVE_API_KEY`                                                                                 |
| [Codex Hosted Search](/vi/plugins/codex-harness)    | Do AI tổng hợp + URL nguồn                                            | Miền, kích thước ngữ cảnh, vị trí người dùng            | Không; sử dụng thông tin đăng nhập Codex/OpenAI                                                 |
| [DuckDuckGo](/vi/tools/duckduckgo-search)           | Đoạn trích có cấu trúc                                                | --                                                      | Không (không cần khóa)                                                                          |
| [Exa](/vi/tools/exa-search)                         | Có cấu trúc + đã trích xuất                                          | Chế độ ngữ nghĩa/từ khóa, ngày, trích xuất nội dung     | `EXA_API_KEY`                                                                                   |
| [Firecrawl](/vi/tools/firecrawl)                    | Đoạn trích có cấu trúc                                                | Thông qua công cụ `firecrawl_search`                     | `FIRECRAWL_API_KEY`                                                                             |
| [Gemini](/vi/tools/gemini-search)                   | Do AI tổng hợp + trích dẫn                                            | --                                                      | `GEMINI_API_KEY`                                                                                |
| [Grok](/vi/tools/grok-search)                       | Do AI tổng hợp + trích dẫn                                            | --                                                      | OAuth xAI, `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey`                      |
| [Kimi](/vi/tools/kimi-search)                       | Do AI tổng hợp + trích dẫn; báo lỗi khi dự phòng sang trò chuyện không có căn cứ | --                                          | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                                             |
| [MiniMax Search](/vi/tools/minimax-search)          | Đoạn trích có cấu trúc                                                | Khu vực (`global` / `cn`)                               | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`                      |
| [Ollama Web Search](/vi/tools/ollama-search)        | Đoạn trích có cấu trúc                                                | --                                                      | Không đối với máy chủ cục bộ đã đăng nhập; `OLLAMA_API_KEY` để tìm kiếm trực tiếp trên `https://ollama.com` |
| [Parallel](/vi/tools/parallel-search)               | Các đoạn trích dày đặc được xếp hạng cho ngữ cảnh LLM                 | --                                                      | `PARALLEL_API_KEY` (trả phí)                                                                    |
| [Parallel Search (Miễn phí)](/vi/tools/parallel-search) | Các đoạn trích dày đặc được xếp hạng cho ngữ cảnh LLM              | --                                                      | Không (Search MCP miễn phí)                                                                     |
| [Perplexity](/vi/tools/perplexity-search)           | Đoạn trích có cấu trúc                                                | Quốc gia, ngôn ngữ, thời gian, miền, giới hạn nội dung  | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                                     |
| [SearXNG](/vi/tools/searxng-search)                 | Đoạn trích có cấu trúc                                                | Danh mục, ngôn ngữ                                      | Không (tự lưu trữ)                                                                              |
| [Tavily](/vi/tools/tavily)                          | Đoạn trích có cấu trúc                                                | Thông qua công cụ `tavily_search`                       | `TAVILY_API_KEY`                                                                                |

## Tự động phát hiện

Danh sách nhà cung cấp trong tài liệu và các luồng thiết lập được sắp xếp theo thứ tự bảng chữ cái. Tính năng tự động phát hiện sử dụng một
thứ tự ưu tiên cố định riêng biệt và chỉ chọn nhà cung cấp cần
thông tin xác thực (`requiresCredential !== false`) khi tìm thấy nhà cung cấp đã được cấu hình. Nếu
chưa đặt `provider`, OpenClaw kiểm tra các nhà cung cấp theo thứ tự sau và sử dụng
nhà cung cấp sẵn sàng đầu tiên:

Các nhà cung cấp dựa trên API trước:

1. **Brave** -- `BRAVE_API_KEY` hoặc `plugins.entries.brave.config.webSearch.apiKey` (thứ tự 10)
2. **MiniMax Search** -- `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` hoặc `plugins.entries.minimax.config.webSearch.apiKey` (thứ tự 15)
3. **Gemini** -- `plugins.entries.google.config.webSearch.apiKey`, `GEMINI_API_KEY` hoặc `models.providers.google.apiKey` (thứ tự 20)
4. **Grok** -- OAuth xAI, `XAI_API_KEY` hoặc `plugins.entries.xai.config.webSearch.apiKey` (thứ tự 30)
5. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` hoặc `plugins.entries.moonshot.config.webSearch.apiKey` (thứ tự 40)
6. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` hoặc `plugins.entries.perplexity.config.webSearch.apiKey` (thứ tự 50)
7. **Firecrawl** -- `FIRECRAWL_API_KEY` hoặc `plugins.entries.firecrawl.config.webSearch.apiKey` (thứ tự 60)
8. **Exa** -- `EXA_API_KEY` hoặc `plugins.entries.exa.config.webSearch.apiKey`; `plugins.entries.exa.config.webSearch.baseUrl` tùy chọn sẽ ghi đè điểm cuối Exa (thứ tự 65)
9. **Tavily** -- `TAVILY_API_KEY` hoặc `plugins.entries.tavily.config.webSearch.apiKey` (thứ tự 70)
10. **Parallel** -- API Parallel Search trả phí thông qua `PARALLEL_API_KEY` hoặc `plugins.entries.parallel.config.webSearch.apiKey`; `plugins.entries.parallel.config.webSearch.baseUrl` tùy chọn sẽ ghi đè điểm cuối (thứ tự 75)

Tiếp theo là các nhà cung cấp điểm cuối đã cấu hình:

11. **SearXNG** -- `SEARXNG_BASE_URL` hoặc `plugins.entries.searxng.config.webSearch.baseUrl` (thứ tự 200)

Các nhà cung cấp không cần khóa như **Parallel Search (Miễn phí)**, **DuckDuckGo**,
**Ollama Web Search** và **Codex Hosted Search** không bao giờ được tính năng tự động phát hiện chọn,
mặc dù chúng có giá trị thứ tự nội bộ. Chúng chỉ được sử dụng khi bạn
chọn rõ ràng bằng `tools.web.search.provider` hoặc thông qua
`openclaw configure --section web`. OpenClaw không gửi các truy vấn
`web_search` được quản lý đến một nhà cung cấp không cần khóa chỉ vì chưa có
nhà cung cấp dựa trên API nào được cấu hình.

Các mô hình OpenAI Responses là một ngoại lệ: khi chưa đặt `tools.web.search.provider`,
chúng sử dụng tính năng tìm kiếm web gốc của OpenAI thay vì các nhà cung cấp được quản lý
ở trên (xem bên dưới). Đặt `tools.web.search.provider` thành
`parallel-free` (hoặc một nhà cung cấp khác) để định tuyến chúng qua đường dẫn được quản lý
thay vào đó.

<Note>
  Tất cả các trường khóa của nhà cung cấp đều hỗ trợ đối tượng SecretRef. Các SecretRef theo phạm vi Plugin
  trong `plugins.entries.<plugin>.config.webSearch.apiKey` được phân giải cho các
  nhà cung cấp tìm kiếm web dựa trên API đã cài đặt, bao gồm Brave, Exa, Firecrawl,
  Gemini, Grok, Kimi, MiniMax, Parallel, Perplexity và Tavily,
  dù nhà cung cấp được chọn rõ ràng qua `tools.web.search.provider` hay
  được chọn bằng tính năng tự động phát hiện. Trong chế độ tự động phát hiện, OpenClaw chỉ phân giải
  khóa của nhà cung cấp được chọn -- các SecretRef không được chọn vẫn không hoạt động, vì vậy bạn có thể
  duy trì cấu hình cho nhiều nhà cung cấp mà không phải chịu chi phí phân giải cho
  những nhà cung cấp bạn không sử dụng.
</Note>

## Tìm kiếm web gốc của OpenAI

Các mô hình OpenAI Responses trực tiếp (`api: "openai-responses"`, nhà cung cấp `openai`,
không có URL cơ sở hoặc sử dụng URL cơ sở API OpenAI chính thức) tự động dùng công cụ
`web_search` được lưu trữ của OpenAI khi tính năng tìm kiếm web của OpenClaw được bật và
không ghim nhà cung cấp được quản lý nào. Đây là hành vi thuộc quyền sở hữu của nhà cung cấp
trong plugin OpenAI đi kèm và không áp dụng cho các URL cơ sở proxy tương thích với OpenAI
hoặc các tuyến Azure. Đặt `tools.web.search.provider` thành một nhà cung cấp khác như `brave`
để tiếp tục dùng công cụ `web_search` được quản lý cho các mô hình OpenAI, hoặc đặt
`tools.web.search.enabled: false` để tắt cả tìm kiếm được quản lý lẫn tìm kiếm OpenAI gốc.

## Tìm kiếm web Codex gốc

Runtime app-server của Codex tự động dùng công cụ `web_search` được lưu trữ của Codex
khi tính năng tìm kiếm web được bật và không chọn nhà cung cấp được quản lý nào. Tìm kiếm
được lưu trữ gốc và công cụ động `web_search` được quản lý của OpenClaw loại trừ lẫn nhau,
vì vậy tìm kiếm được quản lý không thể vượt qua các giới hạn miền của tìm kiếm gốc. OpenClaw
dùng công cụ được quản lý khi tìm kiếm được lưu trữ không khả dụng, bị tắt rõ ràng hoặc
được thay thế bằng một nhà cung cấp được quản lý đã chọn. OpenClaw giữ phần mở rộng độc lập
`web.run` của Codex ở trạng thái tắt (`features.standalone_web_search: false`)
vì lưu lượng app-server trong môi trường vận hành từ chối không gian tên `web`
do người dùng định nghĩa.

- Cấu hình tìm kiếm gốc trong `tools.web.search.openaiCodex`
- Đặt `tools.web.search.provider: "codex"` để cung cấp Codex Hosted Search làm
  nhà cung cấp `web_search` được quản lý cho bất kỳ mô hình cha nào. Mỗi lệnh gọi chạy một
  lượt app-server Codex tạm thời có giới hạn và thất bại nếu Codex không phát ra mục
  `webSearch` được lưu trữ.
- `mode: "cached"` là tùy chọn ưu tiên mặc định, nhưng Codex phân giải nó thành quyền truy cập
  trực tiếp ra bên ngoài đối với các lượt app-server không bị hạn chế; đặt `"live"` để yêu cầu
  rõ ràng quyền truy cập trực tiếp
- Đặt `tools.web.search.provider` thành một nhà cung cấp được quản lý như `brave` để dùng
  `web_search` được quản lý của OpenClaw thay thế
- Đặt `tools.web.search.openaiCodex.enabled: false` để không dùng tìm kiếm
  do Codex lưu trữ; các nhà cung cấp được quản lý khác vẫn khả dụng
- Việc hạn chế bề mặt công cụ gốc của Codex cũng giữ cho `web_search` được quản lý
  tiếp tục khả dụng
- Khi đặt `allowedDomains`, phương án dự phòng được quản lý tự động sẽ đóng an toàn nếu
  tìm kiếm được lưu trữ không khả dụng, để không thể vượt qua danh sách cho phép gốc
- Các lượt chạy chỉ dùng LLM với công cụ bị tắt sẽ tắt cả tìm kiếm gốc lẫn tìm kiếm được quản lý
- `tools.web.search.enabled: false` tắt cả tìm kiếm được quản lý lẫn tìm kiếm gốc

Các thay đổi lâu dài đối với chính sách tìm kiếm Codex có hiệu lực sẽ khởi tạo một luồng liên kết
mới để một luồng app-server đã tải không thể tiếp tục giữ quyền truy cập tìm kiếm được lưu trữ
đã lỗi thời. Các hạn chế tạm thời theo từng lượt dùng một luồng hạn chế tạm thời và giữ nguyên
liên kết hiện có để tiếp tục lại sau đó.

Lưu lượng OpenAI ChatGPT Responses trực tiếp cũng có thể dùng công cụ
`web_search` được lưu trữ của OpenAI. Tuyến riêng biệt đó vẫn yêu cầu chủ động bật qua
`tools.web.search.openaiCodex.enabled: true` và chỉ áp dụng cho các mô hình
`openai/*` đủ điều kiện sử dụng `api: "openai-chatgpt-responses"`.

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        // Tùy chọn: cũng dùng Codex Hosted Search từ các mô hình cha không phải Codex.
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
dùng phương án dự phòng `web_search` được quản lý thông qua không gian tên công cụ động
của OpenClaw. Hãy dùng một nhà cung cấp được quản lý rõ ràng khi bạn cần các biện pháp kiểm soát
mạng riêng theo nhà cung cấp của OpenClaw thay vì tìm kiếm do Codex lưu trữ.

Việc chọn `provider: "codex"` sẽ bật plugin `codex` đi kèm và dùng các
hạn chế `tools.web.search.openaiCodex` tương tự như trình bày ở trên. Trước tiên, hãy xác thực
app-server Codex bằng `openclaw models auth login --provider openai`.
Tác nhân cha có thể dùng bất kỳ mô hình hoặc runtime nào; chỉ trình thực thi tìm kiếm có giới hạn
mới chạy qua Codex.

## An toàn mạng

Các lệnh gọi nhà cung cấp `web_search` qua HTTP được quản lý sử dụng tuyến tìm nạp có bảo vệ
của OpenClaw, giới hạn trong tên máy chủ riêng của nhà cung cấp hiện tại. Chỉ đối với tên máy chủ đó,
OpenClaw cho phép các câu trả lời DNS IP giả của Surge, Clash và sing-box trong
`198.18.0.0/15` và `fc00::/7`. Các đích riêng tư, local loopback, liên kết cục bộ và
siêu dữ liệu khác vẫn bị chặn. Codex Hosted Search là ngoại lệ:
trình thực thi có giới hạn của nó ủy quyền truy cập mạng cho công cụ
`web_search` được lưu trữ của app-server Codex.

Quyền cho phép tự động này không áp dụng cho các URL `web_fetch` tùy ý. Đối với
`web_fetch`, chỉ bật rõ ràng `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` và
`tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange` khi proxy đáng tin cậy của bạn
sở hữu các dải tổng hợp đó.

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

Cấu hình riêng theo nhà cung cấp (khóa API, URL cơ sở, chế độ) nằm trong
`plugins.entries.<plugin>.config.webSearch.*`. Gemini cũng có thể tái sử dụng
`models.providers.google.apiKey` và `models.providers.google.baseUrl` làm phương án dự phòng
có mức ưu tiên thấp hơn sau cấu hình tìm kiếm web chuyên dụng của nó và `GEMINI_API_KEY`. Xem
các trang về nhà cung cấp để biết ví dụ.
Grok cũng có thể tái sử dụng hồ sơ xác thực xAI OAuth từ `openclaw models auth login
--provider xai --method oauth`; cấu hình khóa API vẫn là phương án dự phòng.

`tools.web.search.provider` được xác thực theo các mã định danh nhà cung cấp tìm kiếm web
được khai báo trong manifest của các plugin đi kèm và đã cài đặt. Lỗi chính tả như `"brvae"`
khiến quá trình xác thực cấu hình thất bại thay vì âm thầm quay về chế độ tự động phát hiện. Nếu
một nhà cung cấp đã cấu hình chỉ còn bằng chứng plugin lỗi thời, chẳng hạn một khối
`plugins.entries.<plugin>` còn sót lại sau khi gỡ cài đặt plugin bên thứ ba,
OpenClaw vẫn duy trì khả năng khởi động ổn định và báo cảnh báo để bạn có thể cài đặt lại
plugin hoặc chạy `openclaw doctor --fix` nhằm dọn dẹp cấu hình lỗi thời.

Việc chọn nhà cung cấp dự phòng cho `web_fetch` là riêng biệt:

- chọn bằng `tools.web.fetch.provider`
- hoặc bỏ qua trường đó và để OpenClaw tự động phát hiện nhà cung cấp tìm nạp web sẵn sàng
  đầu tiên từ các thông tin xác thực đã cấu hình
- `web_fetch` không nằm trong sandbox có thể dùng các nhà cung cấp plugin đã cài đặt khai báo
  `contracts.webFetchProviders`; các lượt tìm nạp trong sandbox cho phép nhà cung cấp đi kèm và
  các bản cài đặt plugin chính thức đã xác minh, nhưng loại trừ plugin bên ngoài của bên thứ ba
- plugin Firecrawl chính thức hiện là thành phần đóng góp `webFetchProviders` đi kèm duy nhất,
  được cấu hình trong
  `plugins.entries.firecrawl.config.webFetch.*`

Khi bạn chọn **Kimi** trong `openclaw onboard` hoặc
`openclaw configure --section web`, OpenClaw cũng có thể yêu cầu:

- khu vực API Moonshot (`https://api.moonshot.ai/v1` hoặc `https://api.moonshot.cn/v1`)
- mô hình tìm kiếm web Kimi mặc định (mặc định là `kimi-k2.6`)

Đối với `x_search`, hãy cấu hình `plugins.entries.xai.config.xSearch.*`. Nó dùng cùng
hồ sơ xác thực xAI như trò chuyện hoặc thông tin xác thực `XAI_API_KEY` / tìm kiếm web của
plugin được Grok dùng cho tìm kiếm web.
Cấu hình `tools.web.x_search.*` cũ được `openclaw doctor --fix` tự động di chuyển.
Khi bạn chọn Grok trong `openclaw onboard` hoặc `openclaw configure --section web`,
OpenClaw cũng cung cấp thiết lập `x_search` tùy chọn với cùng thông tin xác thực ngay
sau khi hoàn tất thiết lập Grok. Đây là bước tiếp theo riêng biệt bên trong tuyến Grok,
không phải một lựa chọn nhà cung cấp tìm kiếm web cấp cao nhất riêng biệt. Nếu bạn chọn một
nhà cung cấp khác, OpenClaw sẽ không hiển thị lời nhắc `x_search`.

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

    Đối với bản cài đặt Gateway, hãy đặt biến đó trong `~/.openclaw/.env`.
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
| `freshness`           | Bộ lọc thời gian: `day`, `week`, `month` hoặc `year`                |
| `date_after`          | Kết quả sau ngày này (YYYY-MM-DD)                                    |
| `date_before`         | Kết quả trước ngày này (YYYY-MM-DD)                                  |
| `ui_lang`             | Mã ngôn ngữ giao diện người dùng (chỉ Brave)                         |
| `domain_filter`       | Mảng danh sách cho phép/từ chối miền (chỉ Perplexity)                |
| `max_tokens`          | Tổng ngân sách token nội dung, chỉ API Perplexity Search gốc         |
| `max_tokens_per_page` | Giới hạn token trích xuất trên mỗi trang, chỉ API Perplexity Search gốc |

<Warning>
  Không phải tất cả tham số đều hoạt động với mọi nhà cung cấp. Chế độ `llm-context`
  của Brave từ chối `ui_lang`; `date_before` cũng cần `date_after` vì các phạm vi
  độ mới tùy chỉnh của Brave yêu cầu cả ngày bắt đầu lẫn ngày kết thúc.
  Gemini, Grok và Kimi trả về một câu trả lời tổng hợp kèm trích dẫn. Chúng
  chấp nhận `count` để tương thích với công cụ dùng chung, nhưng tham số này không thay đổi
  cấu trúc câu trả lời có căn cứ. Gemini coi độ mới `day` là một gợi ý về tính gần đây; các
  giá trị độ mới rộng hơn và ngày rõ ràng sẽ đặt phạm vi thời gian cho dữ liệu nền tảng
  Google Search. Perplexity hoạt động tương tự khi bạn dùng tuyến tương thích Sonar/OpenRouter
  (`plugins.entries.perplexity.config.webSearch.baseUrl` /
  `model` hoặc `OPENROUTER_API_KEY`); tuyến đó cũng không hỗ trợ `max_tokens` và
  `max_tokens_per_page`.
  SearXNG chỉ chấp nhận `http://` cho máy chủ mạng riêng hoặc local loopback đáng tin cậy;
  các điểm cuối SearXNG công khai phải dùng `https://`.
  Firecrawl và Tavily chỉ hỗ trợ `query` và `count` thông qua `web_search`
  -- hãy dùng các công cụ chuyên dụng của chúng cho những tùy chọn nâng cao.
</Warning>

## x_search

`x_search` truy vấn các bài đăng trên X (trước đây là Twitter) bằng xAI và trả về
câu trả lời do AI tổng hợp kèm trích dẫn. Công cụ chấp nhận truy vấn ngôn ngữ tự nhiên và
các bộ lọc có cấu trúc tùy chọn. OpenClaw tạo công cụ `x_search` tích hợp của xAI cho từng
yêu cầu thay vì đăng ký công cụ đó vĩnh viễn, vì vậy nó chỉ hoạt động trong lượt thực sự gọi nó.

<Warning>
  `x_search` chạy trên máy chủ của xAI. xAI tính phí 5 USD cho mỗi 1.000 lệnh gọi công cụ,
  cộng thêm token đầu vào và đầu ra của mô hình.
</Warning>

<Note>
  Tài liệu của xAI mô tả `x_search` hỗ trợ tìm kiếm từ khóa, tìm kiếm ngữ nghĩa, tìm kiếm
  người dùng và tìm nạp luồng. Đối với số liệu tương tác trên từng bài đăng như lượt đăng lại,
  phản hồi, dấu trang hoặc lượt xem, nên dùng truy vấn tra cứu có mục tiêu cho URL chính xác
  của bài đăng hoặc mã định danh trạng thái. Các tìm kiếm từ khóa rộng có thể tìm đúng bài đăng
  nhưng trả về siêu dữ liệu trên từng bài đăng kém đầy đủ hơn. Một cách làm phù hợp là: trước tiên
  xác định bài đăng, sau đó chạy truy vấn `x_search` thứ hai tập trung vào chính bài đăng đó.
</Note>

### Cấu hình x_search

Khi bỏ qua `enabled`, `x_search` chỉ được cung cấp khi nhà cung cấp của mô hình đang hoạt động là `xai` và thông tin xác thực xAI được phân giải thành công. Đối với mô hình đang hoạt động có nhà cung cấp không phải xAI đã xác định, hãy đặt `plugins.entries.xai.config.xSearch.enabled` thành `true` để chủ động cho phép sử dụng xuyên nhà cung cấp. Nếu nhà cung cấp của mô hình đang hoạt động bị thiếu hoặc chưa được phân giải, công cụ vẫn bị ẩn. Đặt `enabled` thành `false` để vô hiệu hóa công cụ này cho mọi nhà cung cấp. Luôn bắt buộc có thông tin xác thực xAI.

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true, // bắt buộc đối với nhà cung cấp mô hình không phải xAI đã xác định
            model: "grok-4.3",
            baseUrl: "https://api.x.ai/v1", // không bắt buộc, ghi đè webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // không bắt buộc nếu đã đặt hồ sơ xác thực xAI hoặc XAI_API_KEY
            baseUrl: "https://api.x.ai/v1", // URL cơ sở dùng chung không bắt buộc cho xAI Responses
          },
        },
      },
    },
  },
}
```

`x_search` gửi yêu cầu POST đến `<baseUrl>/responses` khi
`plugins.entries.xai.config.xSearch.baseUrl` được đặt. Nếu trường đó bị bỏ qua,
công cụ sẽ lần lượt dùng dự phòng `plugins.entries.xai.config.webSearch.baseUrl`,
`tools.web.search.grok.baseUrl` cũ và cuối cùng là điểm cuối xAI công khai
(`https://api.x.ai/v1`).

### Tham số x_search

| Tham số                      | Mô tả                                                          |
| ---------------------------- | -------------------------------------------------------------- |
| `query`                      | Truy vấn tìm kiếm (bắt buộc)                                   |
| `allowed_x_handles`          | Giới hạn kết quả ở tối đa 20 tên người dùng X                   |
| `excluded_x_handles`         | Loại trừ tối đa 20 tên người dùng X                             |
| `from_date`                  | Chỉ bao gồm bài đăng vào hoặc sau ngày này (YYYY-MM-DD)         |
| `to_date`                    | Chỉ bao gồm bài đăng vào hoặc trước ngày này (YYYY-MM-DD)       |
| `enable_image_understanding` | Cho phép xAI kiểm tra hình ảnh đính kèm các bài đăng phù hợp    |
| `enable_video_understanding` | Cho phép xAI kiểm tra video đính kèm các bài đăng phù hợp       |

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
// Số liệu thống kê theo bài đăng: sử dụng URL trạng thái chính xác hoặc ID trạng thái khi có thể
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

## Ví dụ

```javascript
// Tìm kiếm cơ bản
await web_search({ query: "SDK Plugin OpenClaw" });

// Tìm kiếm dành riêng cho tiếng Đức
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// Kết quả gần đây (tuần vừa qua)
await web_search({ query: "các phát triển về AI", freshness: "week" });

// Khoảng ngày
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

- [Tải nội dung web](/vi/tools/web-fetch) -- tải một URL và trích xuất nội dung dễ đọc
- [Trình duyệt web](/vi/tools/browser) -- tự động hóa toàn bộ trình duyệt cho các trang web phụ thuộc nhiều vào JS
- [Tìm kiếm Grok](/vi/tools/grok-search) -- Grok làm nhà cung cấp `web_search`
- [Tìm kiếm web Ollama](/vi/tools/ollama-search) -- tìm kiếm web không cần khóa thông qua máy chủ Ollama của bạn
