---
read_when:
    - Bạn muốn giảm chi phí token của lời nhắc bằng cách giữ lại bộ nhớ đệm
    - Bạn cần hành vi bộ nhớ đệm riêng cho từng tác nhân trong các thiết lập đa tác nhân
    - Bạn đang tinh chỉnh Heartbeat và việc dọn dẹp cache-ttl cùng nhau
summary: Các tham số điều chỉnh bộ nhớ đệm lời nhắc, thứ tự hợp nhất, hành vi của nhà cung cấp và các mẫu tinh chỉnh
title: Lưu lời nhắc vào bộ nhớ đệm
x-i18n:
    generated_at: "2026-04-29T23:11:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 16
---

Lưu cache prompt nghĩa là nhà cung cấp mô hình có thể tái sử dụng các tiền tố prompt không đổi (thường là hướng dẫn hệ thống/developer và ngữ cảnh ổn định khác) qua các lượt thay vì xử lý lại chúng mỗi lần. OpenClaw chuẩn hóa mức sử dụng của nhà cung cấp thành `cacheRead` và `cacheWrite` khi API upstream trực tiếp cung cấp các bộ đếm đó.

Các bề mặt trạng thái cũng có thể khôi phục bộ đếm cache từ nhật ký sử dụng
transcript gần đây nhất khi snapshot phiên live thiếu chúng, để `/status` có thể tiếp tục
hiển thị một dòng cache sau khi mất một phần metadata phiên. Các giá trị cache live
khác 0 hiện có vẫn được ưu tiên hơn các giá trị dự phòng từ transcript.

Vì sao điều này quan trọng: chi phí token thấp hơn, phản hồi nhanh hơn, và hiệu năng dễ dự đoán hơn cho các phiên chạy lâu. Nếu không có cache, các prompt lặp lại phải trả toàn bộ chi phí prompt ở mọi lượt ngay cả khi phần lớn đầu vào không thay đổi.

Các phần bên dưới bao quát mọi nút điều chỉnh liên quan đến cache có ảnh hưởng đến việc tái sử dụng prompt và chi phí token.

Tài liệu tham chiếu của nhà cung cấp:

- Lưu cache prompt của Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Lưu cache prompt của OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API và ID yêu cầu của OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID yêu cầu và lỗi của Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Các nút điều chỉnh chính

### `cacheRetention` (mặc định toàn cục, mô hình, và theo agent)

Đặt thời hạn giữ cache làm mặc định toàn cục cho tất cả mô hình:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Ghi đè theo mô hình:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Ghi đè theo agent:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Thứ tự hợp nhất cấu hình:

1. `agents.defaults.params` (mặc định toàn cục — áp dụng cho mọi mô hình)
2. `agents.defaults.models["provider/model"].params` (ghi đè theo mô hình)
3. `agents.list[].params` (ID agent khớp; ghi đè theo khóa)

### `contextPruning.mode: "cache-ttl"`

Cắt tỉa ngữ cảnh kết quả công cụ cũ sau các cửa sổ TTL cache để các yêu cầu sau thời gian nhàn rỗi không lưu lại cache cho lịch sử quá lớn.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Xem [Cắt tỉa phiên](/vi/concepts/session-pruning) để biết đầy đủ hành vi.

### Giữ ấm Heartbeat

Heartbeat có thể giữ ấm các cửa sổ cache và giảm các lần ghi cache lặp lại sau khoảng trống nhàn rỗi.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat theo agent được hỗ trợ tại `agents.list[].heartbeat`.

## Hành vi nhà cung cấp

### Anthropic (API trực tiếp)

- `cacheRetention` được hỗ trợ.
- Với hồ sơ xác thực bằng khóa API Anthropic, OpenClaw khởi tạo `cacheRetention: "short"` cho tham chiếu mô hình Anthropic khi chưa đặt.
- Phản hồi Messages gốc của Anthropic cung cấp cả `cache_read_input_tokens` và `cache_creation_input_tokens`, nên OpenClaw có thể hiển thị cả `cacheRead` và `cacheWrite`.
- Với yêu cầu Anthropic gốc, `cacheRetention: "short"` ánh xạ tới cache tạm thời mặc định 5 phút, và `cacheRetention: "long"` nâng cấp lên TTL 1 giờ chỉ trên các máy chủ `api.anthropic.com` trực tiếp.

### OpenAI (API trực tiếp)

- Lưu cache prompt là tự động trên các mô hình gần đây được hỗ trợ. OpenClaw không cần chèn marker cache cấp khối.
- OpenClaw dùng `prompt_cache_key` để giữ định tuyến cache ổn định qua các lượt và chỉ dùng `prompt_cache_retention: "24h"` khi `cacheRetention: "long"` được chọn trên các máy chủ OpenAI trực tiếp.
- Các nhà cung cấp Completions tương thích OpenAI chỉ nhận `prompt_cache_key` khi cấu hình mô hình của họ đặt rõ `compat.supportsPromptCacheKey: true`; `cacheRetention: "none"` vẫn chặn nó.
- Phản hồi OpenAI cung cấp token prompt đã lưu cache qua `usage.prompt_tokens_details.cached_tokens` (hoặc `input_tokens_details.cached_tokens` trên sự kiện Responses API). OpenClaw ánh xạ giá trị đó thành `cacheRead`.
- OpenAI không cung cấp bộ đếm token ghi cache riêng, nên `cacheWrite` giữ nguyên `0` trên các đường dẫn OpenAI ngay cả khi nhà cung cấp đang làm ấm cache.
- OpenAI trả về các header hữu ích cho truy vết và giới hạn tốc độ như `x-request-id`, `openai-processing-ms`, và `x-ratelimit-*`, nhưng việc tính toán cache hit nên lấy từ payload sử dụng, không phải từ header.
- Trong thực tế, OpenAI thường hoạt động như cache tiền tố ban đầu hơn là tái sử dụng toàn bộ lịch sử di động kiểu Anthropic. Các lượt văn bản tiền tố dài ổn định có thể đạt gần mức ổn định `4864` token đã lưu cache trong các phép thăm dò live hiện tại, trong khi transcript nhiều công cụ hoặc kiểu MCP thường ổn định gần `4608` token đã lưu cache ngay cả khi lặp lại chính xác.

### Anthropic Vertex

- Các mô hình Anthropic trên Vertex AI (`anthropic-vertex/*`) hỗ trợ `cacheRetention` giống như Anthropic trực tiếp.
- `cacheRetention: "long"` ánh xạ tới TTL cache prompt 1 giờ thật trên endpoint Vertex AI.
- Thời hạn giữ cache mặc định cho `anthropic-vertex` khớp với mặc định Anthropic trực tiếp.
- Yêu cầu Vertex được định tuyến qua shaping cache nhận biết ranh giới để việc tái sử dụng cache luôn khớp với những gì nhà cung cấp thật sự nhận.

### Amazon Bedrock

- Tham chiếu mô hình Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) hỗ trợ truyền qua `cacheRetention` rõ ràng.
- Các mô hình Bedrock không phải Anthropic bị buộc thành `cacheRetention: "none"` tại runtime.

### Mô hình OpenRouter

Với tham chiếu mô hình `openrouter/anthropic/*`, OpenClaw chèn
`cache_control` của Anthropic vào các khối prompt hệ thống/developer để cải thiện việc tái sử dụng
cache prompt chỉ khi yêu cầu vẫn nhắm tới một tuyến OpenRouter đã xác minh
(`openrouter` trên endpoint mặc định của nó, hoặc bất kỳ nhà cung cấp/base URL nào phân giải
tới `openrouter.ai`).

Với tham chiếu mô hình `openrouter/deepseek/*`, `openrouter/moonshot*/*`, và `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` được cho phép vì OpenRouter
tự động xử lý lưu cache prompt phía nhà cung cấp. OpenClaw không chèn
marker `cache_control` của Anthropic vào các yêu cầu đó.

Việc xây dựng cache DeepSeek là nỗ lực tối đa và có thể mất vài giây. Một lượt theo sau
ngay lập tức vẫn có thể hiển thị `cached_tokens: 0`; hãy xác minh bằng một yêu cầu
cùng tiền tố lặp lại sau một khoảng trễ ngắn và dùng `usage.prompt_tokens_details.cached_tokens`
làm tín hiệu cache hit.

Nếu bạn trỏ mô hình sang một URL proxy tùy ý tương thích OpenAI, OpenClaw
dừng chèn các marker cache Anthropic dành riêng cho OpenRouter đó.

### Nhà cung cấp khác

Nếu nhà cung cấp không hỗ trợ chế độ cache này, `cacheRetention` không có hiệu lực.

### API trực tiếp Google Gemini

- Transport Gemini trực tiếp (`api: "google-generative-ai"`) báo cáo cache hit
  qua `cachedContentTokenCount` upstream; OpenClaw ánh xạ giá trị đó thành `cacheRead`.
- Khi `cacheRetention` được đặt trên mô hình Gemini trực tiếp, OpenClaw tự động
  tạo, tái sử dụng, và làm mới tài nguyên `cachedContents` cho prompt hệ thống
  trên các lần chạy Google AI Studio. Điều này nghĩa là bạn không còn cần tạo trước một
  handle cached-content theo cách thủ công.
- Bạn vẫn có thể truyền một handle cached-content Gemini đã tồn tại qua
  `params.cachedContent` (hoặc `params.cached_content` cũ) trên mô hình đã cấu hình.
- Điều này tách biệt với cache tiền tố prompt của Anthropic/OpenAI. Với Gemini,
  OpenClaw quản lý một tài nguyên `cachedContents` gốc của nhà cung cấp thay vì
  chèn marker cache vào yêu cầu.

### Mức sử dụng JSON Gemini CLI

- Đầu ra JSON của Gemini CLI cũng có thể hiển thị cache hit qua `stats.cached`;
  OpenClaw ánh xạ giá trị đó thành `cacheRead`.
- Nếu CLI bỏ qua giá trị `stats.input` trực tiếp, OpenClaw suy ra token đầu vào
  từ `stats.input_tokens - stats.cached`.
- Đây chỉ là chuẩn hóa mức sử dụng. Nó không có nghĩa OpenClaw đang tạo
  marker cache prompt kiểu Anthropic/OpenAI cho Gemini CLI.

## Ranh giới cache prompt hệ thống

OpenClaw chia prompt hệ thống thành một **tiền tố ổn định** và một **hậu tố biến động**
được phân tách bằng ranh giới tiền tố cache nội bộ. Nội dung phía trên
ranh giới (định nghĩa công cụ, metadata Skills, tệp workspace, và ngữ cảnh
tương đối tĩnh khác) được sắp xếp để giữ nguyên từng byte qua các lượt.
Nội dung phía dưới ranh giới (ví dụ `HEARTBEAT.md`, dấu thời gian runtime, và
metadata theo lượt khác) được phép thay đổi mà không làm mất hiệu lực tiền tố đã lưu cache.

Các lựa chọn thiết kế chính:

- Các tệp ngữ cảnh dự án workspace ổn định được sắp xếp trước `HEARTBEAT.md` để
  thay đổi Heartbeat không phá tiền tố ổn định.
- Ranh giới được áp dụng trên các họ Anthropic, họ OpenAI, Google, và
  shaping transport CLI để mọi nhà cung cấp được hỗ trợ đều hưởng lợi từ cùng độ ổn định tiền tố.
- Các yêu cầu Codex Responses và Anthropic Vertex được định tuyến qua
  shaping cache nhận biết ranh giới để việc tái sử dụng cache luôn khớp với những gì nhà cung cấp
  thật sự nhận.
- Dấu vân tay prompt hệ thống được chuẩn hóa (khoảng trắng, kết thúc dòng,
  ngữ cảnh do hook thêm, thứ tự capability runtime) để các prompt không đổi về mặt ngữ nghĩa
  dùng chung KV/cache qua các lượt.

Nếu bạn thấy các đợt tăng `cacheWrite` bất thường sau một thay đổi cấu hình hoặc workspace,
hãy kiểm tra xem thay đổi đó nằm phía trên hay phía dưới ranh giới cache. Di chuyển
nội dung biến động xuống dưới ranh giới (hoặc ổn định hóa nó) thường giải quyết được
vấn đề.

## Bộ bảo vệ ổn định cache của OpenClaw

OpenClaw cũng giữ cho một số hình dạng payload nhạy cảm với cache mang tính xác định trước khi
yêu cầu tới nhà cung cấp:

- Catalog công cụ MCP đi kèm được sắp xếp xác định trước khi đăng ký công cụ,
  để thay đổi thứ tự `listTools()` không làm biến động khối công cụ và
  phá tiền tố cache prompt.
- Các phiên cũ có khối ảnh được lưu giữ sẽ giữ nguyên **3 lượt hoàn tất gần đây nhất**;
  các khối ảnh cũ hơn đã xử lý có thể được thay bằng marker để các lượt theo sau
  nhiều ảnh không tiếp tục gửi lại payload cũ lớn.

## Mẫu tinh chỉnh

### Lưu lượng hỗn hợp (mặc định khuyến nghị)

Giữ một baseline tồn tại lâu trên agent chính, tắt cache trên các agent thông báo theo đợt:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Baseline ưu tiên chi phí

- Đặt baseline `cacheRetention: "short"`.
- Bật `contextPruning.mode: "cache-ttl"`.
- Giữ Heartbeat thấp hơn TTL của bạn chỉ cho các agent hưởng lợi từ cache ấm.

## Chẩn đoán cache

OpenClaw cung cấp chẩn đoán cache-trace chuyên dụng cho các lần chạy agent nhúng.

Với chẩn đoán hướng tới người dùng thông thường, `/status` và các tóm tắt sử dụng khác có thể dùng
mục sử dụng transcript mới nhất làm nguồn dự phòng cho `cacheRead` /
`cacheWrite` khi mục phiên live không có các bộ đếm đó.

## Kiểm thử hồi quy live

OpenClaw giữ một gate hồi quy cache live kết hợp cho tiền tố lặp lại, lượt công cụ, lượt ảnh, transcript công cụ kiểu MCP, và một đối chứng không cache của Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Chạy gate live hẹp bằng:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Tệp baseline lưu các số live quan sát gần đây nhất cùng với các ngưỡng sàn hồi quy theo nhà cung cấp được bài kiểm thử dùng.
Runner cũng dùng ID phiên và namespace prompt mới cho từng lần chạy để trạng thái cache trước đó không làm nhiễu mẫu hồi quy hiện tại.

Các bài kiểm thử này cố ý không dùng tiêu chí thành công giống hệt nhau giữa các nhà cung cấp.

### Kỳ vọng live Anthropic

- Kỳ vọng các lần ghi warmup rõ ràng qua `cacheWrite`.
- Kỳ vọng tái sử dụng gần như toàn bộ lịch sử trên các lượt lặp lại vì cache control của Anthropic đẩy breakpoint cache tiến qua cuộc hội thoại.
- Các assertion live hiện tại vẫn dùng ngưỡng tỷ lệ hit cao cho các đường dẫn ổn định, công cụ, và ảnh.

### Kỳ vọng live OpenAI

- Chỉ kỳ vọng `cacheRead`. `cacheWrite` vẫn là `0`.
- Xem việc tái sử dụng cache qua các lượt lặp lại là một ngưỡng ổn định theo từng provider, không phải là tái sử dụng toàn bộ lịch sử di chuyển kiểu Anthropic.
- Các xác nhận live hiện tại dùng các kiểm tra ngưỡng sàn thận trọng, được suy ra từ hành vi live đã quan sát trên `gpt-5.4-mini`:
  - tiền tố ổn định: `cacheRead >= 4608`, tỷ lệ trúng `>= 0.90`
  - bản ghi công cụ: `cacheRead >= 4096`, tỷ lệ trúng `>= 0.85`
  - bản ghi hình ảnh: `cacheRead >= 3840`, tỷ lệ trúng `>= 0.82`
  - bản ghi kiểu MCP: `cacheRead >= 4096`, tỷ lệ trúng `>= 0.85`

Xác minh live kết hợp mới trên 2026-04-04 cho kết quả:

- tiền tố ổn định: `cacheRead=4864`, tỷ lệ trúng `0.966`
- bản ghi công cụ: `cacheRead=4608`, tỷ lệ trúng `0.896`
- bản ghi hình ảnh: `cacheRead=4864`, tỷ lệ trúng `0.954`
- bản ghi kiểu MCP: `cacheRead=4608`, tỷ lệ trúng `0.891`

Thời gian wall-clock cục bộ gần đây cho gate kết hợp là khoảng `88s`.

Vì sao các xác nhận khác nhau:

- Anthropic cung cấp các điểm ngắt cache rõ ràng và tái sử dụng lịch sử hội thoại di chuyển.
- Cache prompt của OpenAI vẫn nhạy với tiền tố chính xác, nhưng tiền tố có thể tái sử dụng hiệu quả trong lưu lượng Responses live có thể đạt ngưỡng ổn định sớm hơn toàn bộ prompt.
- Vì vậy, so sánh Anthropic và OpenAI bằng một ngưỡng phần trăm duy nhất giữa các provider sẽ tạo ra hồi quy giả.

### Cấu hình `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # tùy chọn
    includeMessages: false # mặc định true
    includePrompt: false # mặc định true
    includeSystem: false # mặc định true
```

Mặc định:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Công tắc env (gỡ lỗi một lần)

- `OPENCLAW_CACHE_TRACE=1` bật truy vết cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` ghi đè đường dẫn đầu ra.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` bật/tắt ghi lại toàn bộ payload thông điệp.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` bật/tắt ghi lại văn bản prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` bật/tắt ghi lại system prompt.

### Những gì cần kiểm tra

- Sự kiện truy vết cache là JSONL và bao gồm các ảnh chụp nhanh theo giai đoạn như `session:loaded`, `prompt:before`, `stream:context` và `session:after`.
- Tác động token cache theo từng lượt hiển thị trong các bề mặt sử dụng thông thường qua `cacheRead` và `cacheWrite` (ví dụ `/usage full` và tóm tắt sử dụng phiên).
- Với Anthropic, kỳ vọng có cả `cacheRead` và `cacheWrite` khi cache đang hoạt động.
- Với OpenAI, kỳ vọng có `cacheRead` khi trúng cache và `cacheWrite` vẫn là `0`; OpenAI không công bố trường token ghi cache riêng.
- Nếu cần truy vết request, hãy ghi log ID request và header giới hạn tốc độ riêng biệt với chỉ số cache. Đầu ra cache-trace hiện tại của OpenClaw tập trung vào hình dạng prompt/phiên và mức sử dụng token đã chuẩn hóa thay vì header phản hồi provider thô.

## Khắc phục sự cố nhanh

- `cacheWrite` cao ở hầu hết các lượt: kiểm tra các đầu vào system-prompt dễ thay đổi và xác minh model/provider hỗ trợ cài đặt cache của bạn.
- `cacheWrite` cao trên Anthropic: thường có nghĩa là điểm ngắt cache đang nằm trên nội dung thay đổi theo từng request.
- `cacheRead` thấp trên OpenAI: xác minh tiền tố ổn định nằm ở đầu, tiền tố lặp lại có ít nhất 1024 token và cùng một `prompt_cache_key` được tái sử dụng cho các lượt nên dùng chung cache.
- `cacheRetention` không có tác dụng: xác nhận khóa model khớp với `agents.defaults.models["provider/model"]`.
- Request Bedrock Nova/Mistral có cài đặt cache: dự kiến runtime sẽ ép thành `none`.

Tài liệu liên quan:

- [Anthropic](/vi/providers/anthropic)
- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Tài liệu tham chiếu cấu hình Gateway](/vi/gateway/configuration-reference)

## Liên quan

- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Mức dùng API và chi phí](/vi/reference/api-usage-costs)
