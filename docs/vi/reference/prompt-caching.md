---
read_when:
    - Bạn muốn giảm chi phí token của prompt bằng cách duy trì bộ nhớ đệm
    - Bạn cần hành vi bộ nhớ đệm theo từng tác nhân trong các thiết lập đa tác nhân
    - Bạn đang tinh chỉnh Heartbeat và việc dọn dẹp cache-ttl cùng nhau
summary: Các tùy chọn điều chỉnh bộ nhớ đệm lời nhắc, thứ tự hợp nhất, hành vi của nhà cung cấp và các mẫu tinh chỉnh
title: Bộ nhớ đệm prompt
x-i18n:
    generated_at: "2026-07-01T08:16:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dbbc46d5f726ae5e9b3bb51af0d271e49df768bc93de6e13b4c87519f0fca5c3
    source_path: reference/prompt-caching.md
    workflow: 16
---

Cache lời nhắc có nghĩa là nhà cung cấp mô hình có thể tái sử dụng các tiền tố lời nhắc không đổi (thường là chỉ dẫn hệ thống/nhà phát triển và ngữ cảnh ổn định khác) qua các lượt thay vì xử lý lại chúng mỗi lần. OpenClaw chuẩn hóa mức sử dụng của nhà cung cấp thành `cacheRead` và `cacheWrite` khi API thượng nguồn cung cấp trực tiếp các bộ đếm đó.

Các bề mặt trạng thái cũng có thể khôi phục bộ đếm cache từ nhật ký sử dụng
bản ghi phiên gần nhất khi ảnh chụp nhanh phiên trực tiếp thiếu chúng, để `/status` vẫn có thể
hiển thị dòng cache sau khi mất một phần siêu dữ liệu phiên. Các giá trị cache trực tiếp khác 0 hiện có
vẫn được ưu tiên hơn các giá trị dự phòng từ bản ghi phiên.

Lý do điều này quan trọng: chi phí token thấp hơn, phản hồi nhanh hơn và hiệu năng dễ dự đoán hơn cho các phiên chạy dài. Nếu không có cache, các lời nhắc lặp lại phải trả toàn bộ chi phí lời nhắc ở mỗi lượt ngay cả khi phần lớn đầu vào không thay đổi.

Các phần bên dưới bao quát mọi núm điều chỉnh liên quan đến cache ảnh hưởng đến việc tái sử dụng lời nhắc và chi phí token.

Tham chiếu nhà cung cấp:

- Cache lời nhắc Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Cache lời nhắc OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API OpenAI và ID yêu cầu: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID yêu cầu và lỗi Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Núm điều chỉnh chính

### `cacheRetention` (mặc định toàn cục, mô hình và theo tác tử)

Đặt thời gian giữ cache làm mặc định toàn cục cho mọi mô hình:

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

Ghi đè theo tác tử:

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
3. `agents.list[].params` (ID tác tử khớp; ghi đè theo khóa)

### `contextPruning.mode: "cache-ttl"`

Cắt tỉa ngữ cảnh kết quả công cụ cũ sau các cửa sổ TTL cache để các yêu cầu sau thời gian nhàn rỗi không cache lại lịch sử quá lớn.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Xem [Cắt Tỉa Phiên](/vi/concepts/session-pruning) để biết đầy đủ hành vi.

### Giữ ấm Heartbeat

Heartbeat có thể giữ ấm các cửa sổ cache và giảm các lần ghi cache lặp lại sau khoảng trống nhàn rỗi.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat theo tác tử được hỗ trợ tại `agents.list[].heartbeat`.

## Hành vi nhà cung cấp

### Anthropic (API trực tiếp)

- `cacheRetention` được hỗ trợ.
- Với hồ sơ xác thực bằng khóa API Anthropic, OpenClaw khởi tạo `cacheRetention: "short"` cho tham chiếu mô hình Anthropic khi chưa đặt.
- Phản hồi Messages gốc của Anthropic cung cấp cả `cache_read_input_tokens` và `cache_creation_input_tokens`, nên OpenClaw có thể hiển thị cả `cacheRead` và `cacheWrite`.
- Với yêu cầu Anthropic gốc, `cacheRetention: "short"` ánh xạ tới cache tạm thời mặc định 5 phút, và `cacheRetention: "long"` nâng cấp lên TTL 1 giờ chỉ trên host `api.anthropic.com` trực tiếp.

### OpenAI (API trực tiếp)

- Cache lời nhắc là tự động trên các mô hình gần đây được hỗ trợ. OpenClaw không cần chèn marker cache cấp khối.
- OpenClaw dùng `prompt_cache_key` để giữ định tuyến cache ổn định qua các lượt. Host OpenAI trực tiếp dùng `prompt_cache_retention: "24h"` khi chọn `cacheRetention: "long"`.
- Các nhà cung cấp Completions tương thích OpenAI chỉ nhận `prompt_cache_key` khi cấu hình mô hình của họ đặt rõ `compat.supportsPromptCacheKey: true`. Chuyển tiếp giữ dài hạn là một khả năng riêng: `cacheRetention: "long"` tường minh chỉ gửi `prompt_cache_retention: "24h"` khi mục compat đó cũng hỗ trợ giữ cache dài hạn. Các nhà cung cấp như Mistral có thể chọn tham gia khóa cache trong khi đặt `compat.supportsLongCacheRetention: false` để chặn trường giữ dài hạn. `cacheRetention: "none"` chặn cả hai trường.
- Phản hồi OpenAI cung cấp token lời nhắc đã cache qua `usage.prompt_tokens_details.cached_tokens` (hoặc `input_tokens_details.cached_tokens` trên sự kiện Responses API). OpenClaw ánh xạ giá trị đó tới `cacheRead`.
- Mức sử dụng Responses GPT-5.6 cũng có thể cung cấp `input_tokens_details.cache_write_tokens`. OpenClaw ánh xạ giá trị đó tới `cacheWrite` và tính giá theo mức giá ghi cache của mô hình; các Responses bỏ qua trường này giữ `cacheWrite` ở `0`.
- OpenAI trả về các header hữu ích cho truy vết và giới hạn tốc độ như `x-request-id`, `openai-processing-ms` và `x-ratelimit-*`, nhưng việc hạch toán cache hit nên lấy từ payload sử dụng, không phải từ header.
- Trong thực tế, OpenAI thường hoạt động như cache tiền tố ban đầu hơn là tái sử dụng toàn bộ lịch sử động kiểu Anthropic. Các lượt văn bản có tiền tố dài ổn định có thể đạt gần ngưỡng `4864` token đã cache trong các probe trực tiếp hiện tại, trong khi bản ghi phiên nặng công cụ hoặc kiểu MCP thường ổn định gần `4608` token đã cache ngay cả khi lặp lại chính xác.

### Anthropic Vertex

- Các mô hình Anthropic trên Vertex AI (`anthropic-vertex/*`) hỗ trợ `cacheRetention` giống như Anthropic trực tiếp.
- `cacheRetention: "long"` ánh xạ tới TTL cache lời nhắc 1 giờ thực trên endpoint Vertex AI.
- Thời gian giữ cache mặc định cho `anthropic-vertex` khớp với mặc định Anthropic trực tiếp.
- Các yêu cầu Vertex được định tuyến qua định hình cache nhận biết ranh giới để việc tái sử dụng cache luôn khớp với nội dung nhà cung cấp thực sự nhận.

### Amazon Bedrock

- Tham chiếu mô hình Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) hỗ trợ truyền qua `cacheRetention` tường minh.
- Các mô hình Bedrock không phải Anthropic bị buộc thành `cacheRetention: "none"` lúc chạy.

### Mô hình OpenRouter

Với tham chiếu mô hình `openrouter/anthropic/*`, OpenClaw chèn
`cache_control` vào các khối lời nhắc hệ thống/nhà phát triển để cải thiện việc tái sử dụng
cache lời nhắc chỉ khi yêu cầu vẫn đang nhắm tới tuyến OpenRouter đã xác minh
(`openrouter` trên endpoint mặc định của nó, hoặc bất kỳ nhà cung cấp/base URL nào phân giải
tới `openrouter.ai`).

Với tham chiếu mô hình `openrouter/deepseek/*`, `openrouter/moonshot*/*` và `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` được cho phép vì OpenRouter
tự động xử lý cache lời nhắc phía nhà cung cấp. OpenClaw không chèn
marker `cache_control` của Anthropic vào các yêu cầu đó.

Việc dựng cache DeepSeek là nỗ lực tối đa và có thể mất vài giây. Một
lượt theo sau ngay lập tức vẫn có thể hiển thị `cached_tokens: 0`; hãy xác minh bằng một yêu cầu
cùng tiền tố lặp lại sau một khoảng trễ ngắn và dùng `usage.prompt_tokens_details.cached_tokens`
làm tín hiệu cache hit.

Nếu bạn trỏ mô hình tới một URL proxy tương thích OpenAI tùy ý, OpenClaw
ngừng chèn các marker cache Anthropic dành riêng cho OpenRouter đó.

### Nhà cung cấp khác

Nếu nhà cung cấp không hỗ trợ chế độ cache này, `cacheRetention` không có hiệu lực.

### API trực tiếp Google Gemini

- Transport Gemini trực tiếp (`api: "google-generative-ai"`) báo cáo cache hit
  qua `cachedContentTokenCount` thượng nguồn; OpenClaw ánh xạ giá trị đó tới `cacheRead`.
- Khi `cacheRetention` được đặt trên mô hình Gemini trực tiếp, OpenClaw tự động
  tạo, tái sử dụng và làm mới tài nguyên `cachedContents` cho lời nhắc hệ thống
  trên các lần chạy Google AI Studio. Điều này nghĩa là bạn không còn cần tạo trước
  handle cached-content thủ công.
- Bạn vẫn có thể truyền một handle cached-content Gemini đã tồn tại qua
  `params.cachedContent` (hoặc `params.cached_content` cũ) trên mô hình đã cấu hình.
- Cơ chế này tách biệt với cache tiền tố lời nhắc Anthropic/OpenAI. Với Gemini,
  OpenClaw quản lý tài nguyên `cachedContents` gốc của nhà cung cấp thay vì
  chèn marker cache vào yêu cầu.

### Mức sử dụng Gemini CLI

- Đầu ra `stream-json` của Gemini CLI có thể hiển thị cache hit qua `stats.cached`;
  OpenClaw ánh xạ giá trị đó tới `cacheRead`. Các ghi đè `--output-format json` cũ dùng
  cùng quá trình chuẩn hóa mức sử dụng.
- Nếu CLI bỏ qua giá trị `stats.input` trực tiếp, OpenClaw suy ra token đầu vào
  từ `stats.input_tokens - stats.cached`.
- Đây chỉ là chuẩn hóa mức sử dụng. Điều này không có nghĩa là OpenClaw đang tạo
  marker cache lời nhắc kiểu Anthropic/OpenAI cho Gemini CLI.

## Ranh giới cache lời nhắc hệ thống

OpenClaw tách lời nhắc hệ thống thành **tiền tố ổn định** và **hậu tố biến động**
được phân tách bởi một ranh giới tiền tố cache nội bộ. Nội dung phía trên
ranh giới (định nghĩa công cụ, siêu dữ liệu Skills, tệp workspace và ngữ cảnh
tương đối tĩnh khác) được sắp xếp để vẫn giống hệt từng byte qua các lượt.
Nội dung phía dưới ranh giới (ví dụ `HEARTBEAT.md`, timestamp lúc chạy và
siêu dữ liệu theo lượt khác) được phép thay đổi mà không làm mất hiệu lực tiền tố
đã cache.

Các lựa chọn thiết kế chính:

- Các tệp ngữ cảnh dự án workspace ổn định được sắp xếp trước `HEARTBEAT.md` để
  biến động heartbeat không phá vỡ tiền tố ổn định.
- Ranh giới được áp dụng trên các họ Anthropic, họ OpenAI, Google và
  định hình transport CLI để mọi nhà cung cấp được hỗ trợ đều hưởng lợi từ cùng độ ổn định
  tiền tố.
- Các yêu cầu Codex Responses và Anthropic Vertex được định tuyến qua
  định hình cache nhận biết ranh giới để việc tái sử dụng cache luôn khớp với nội dung nhà cung cấp
  thực sự nhận.
- Vân tay lời nhắc hệ thống được chuẩn hóa (khoảng trắng, kết thúc dòng,
  ngữ cảnh do hook thêm, thứ tự khả năng lúc chạy) để các lời nhắc không đổi về mặt ngữ nghĩa
  dùng chung KV/cache qua các lượt.

Nếu bạn thấy các đợt tăng `cacheWrite` bất ngờ sau một thay đổi cấu hình hoặc workspace,
hãy kiểm tra xem thay đổi đó nằm phía trên hay phía dưới ranh giới cache. Di chuyển
nội dung biến động xuống dưới ranh giới (hoặc làm nó ổn định) thường giải quyết được
vấn đề.

## Bộ bảo vệ độ ổn định cache của OpenClaw

OpenClaw cũng giữ cho nhiều dạng payload nhạy cảm với cache có tính xác định trước khi
yêu cầu tới nhà cung cấp:

- Danh mục công cụ Bundle MCP được sắp xếp xác định trước khi đăng ký công cụ,
  nên thay đổi thứ tự `listTools()` không làm biến động khối công cụ và
  phá vỡ tiền tố cache lời nhắc.
- Các phiên cũ có khối hình ảnh được lưu giữ nguyên **3 lượt hoàn tất gần nhất**;
  các khối hình ảnh cũ hơn đã được xử lý có thể được thay bằng một marker để các
  lượt theo sau nặng hình ảnh không tiếp tục gửi lại payload cũ lớn.

## Mẫu điều chỉnh

### Lưu lượng hỗn hợp (mặc định được khuyến nghị)

Giữ baseline sống dài hạn trên tác tử chính của bạn, tắt cache trên các tác tử thông báo bùng phát:

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
- Giữ heartbeat thấp hơn TTL của bạn chỉ cho các tác tử hưởng lợi từ cache ấm.

## Chẩn đoán cache

OpenClaw cung cấp chẩn đoán cache-trace chuyên dụng cho các lần chạy tác tử nhúng.

Với chẩn đoán bình thường hướng tới người dùng, `/status` và các tóm tắt mức sử dụng khác có thể dùng
mục mức sử dụng bản ghi phiên mới nhất làm nguồn dự phòng cho `cacheRead` /
`cacheWrite` khi mục phiên trực tiếp không có các bộ đếm đó.

## Kiểm thử hồi quy trực tiếp

OpenClaw duy trì một cổng hồi quy cache trực tiếp kết hợp cho tiền tố lặp lại, lượt công cụ, lượt hình ảnh, bản ghi phiên công cụ kiểu MCP và một đối chứng không cache của Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Chạy cổng trực tiếp hẹp bằng:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Tệp baseline lưu các số liệu live được quan sát gần đây nhất cộng với các ngưỡng sàn hồi quy riêng theo provider mà bài kiểm thử sử dụng.
Runner cũng dùng ID phiên và namespace prompt mới cho từng lần chạy để trạng thái cache trước đó không làm nhiễu mẫu hồi quy hiện tại.

Các bài kiểm thử này cố ý không dùng tiêu chí thành công giống hệt nhau giữa các provider.

### Kỳ vọng live của Anthropic

- Kỳ vọng các lần ghi khởi động rõ ràng qua `cacheWrite`.
- Kỳ vọng tái sử dụng gần như toàn bộ lịch sử ở các lượt lặp lại vì cơ chế kiểm soát cache của Anthropic đẩy điểm ngắt cache tiến dần qua cuộc hội thoại.
- Các assertion live hiện tại vẫn dùng ngưỡng tỷ lệ hit cao cho các đường dẫn ổn định, công cụ và hình ảnh.

### Kỳ vọng live của OpenAI

- Chỉ kỳ vọng `cacheRead`. `cacheWrite` vẫn là `0`.
- Xem việc tái sử dụng cache ở lượt lặp lại là một ngưỡng bão hòa riêng theo provider, không phải kiểu tái sử dụng toàn bộ lịch sử dịch chuyển như Anthropic.
- Các assertion live hiện tại dùng các kiểm tra ngưỡng sàn thận trọng được suy ra từ hành vi live đã quan sát trên `gpt-5.4-mini`:
  - tiền tố ổn định: `cacheRead >= 4608`, tỷ lệ hit `>= 0.90`
  - bản ghi công cụ: `cacheRead >= 4096`, tỷ lệ hit `>= 0.85`
  - bản ghi hình ảnh: `cacheRead >= 3840`, tỷ lệ hit `>= 0.82`
  - bản ghi kiểu MCP: `cacheRead >= 4096`, tỷ lệ hit `>= 0.85`

Xác minh live kết hợp mới trên 2026-04-04 đạt:

- tiền tố ổn định: `cacheRead=4864`, tỷ lệ hit `0.966`
- bản ghi công cụ: `cacheRead=4608`, tỷ lệ hit `0.896`
- bản ghi hình ảnh: `cacheRead=4864`, tỷ lệ hit `0.954`
- bản ghi kiểu MCP: `cacheRead=4608`, tỷ lệ hit `0.891`

Thời gian chạy cục bộ gần đây theo đồng hồ thực cho cổng kết hợp là khoảng `88s`.

Vì sao các assertion khác nhau:

- Anthropic cung cấp các điểm ngắt cache rõ ràng và khả năng tái sử dụng lịch sử hội thoại dịch chuyển.
- Cache prompt của OpenAI vẫn nhạy với tiền tố khớp chính xác, nhưng tiền tố có thể tái sử dụng hiệu quả trong lưu lượng Responses live có thể bão hòa sớm hơn toàn bộ prompt.
- Vì vậy, so sánh Anthropic và OpenAI bằng một ngưỡng phần trăm chung cho nhiều provider sẽ tạo ra các hồi quy giả.

### Cấu hình `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Mặc định:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Công tắc env (gỡ lỗi một lần)

- `OPENCLAW_CACHE_TRACE=1` bật truy vết cache.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` ghi đè đường dẫn đầu ra.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` bật/tắt ghi lại toàn bộ payload tin nhắn.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` bật/tắt ghi lại văn bản prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` bật/tắt ghi lại system prompt.

### Cần kiểm tra gì

- Sự kiện truy vết cache là JSONL và bao gồm các snapshot theo giai đoạn như `session:loaded`, `prompt:before`, `stream:context` và `session:after`.
- Tác động token cache theo từng lượt hiển thị trong các bề mặt sử dụng thông thường qua `cacheRead` và `cacheWrite` (ví dụ `/usage full` và tóm tắt sử dụng phiên).
- Với Anthropic, kỳ vọng cả `cacheRead` và `cacheWrite` khi cache đang hoạt động.
- Với OpenAI, kỳ vọng `cacheRead` khi cache hit. GPT-5.6 Responses cũng có thể báo cáo `cacheWrite` khi các đoạn prompt được ghi; các payload Responses khác bỏ qua bộ đếm ghi sẽ giữ nó ở `0`.
- Nếu bạn cần truy vết yêu cầu, hãy ghi log ID yêu cầu và header giới hạn tốc độ riêng biệt với chỉ số cache. Đầu ra cache-trace hiện tại của OpenClaw tập trung vào hình dạng prompt/phiên và mức sử dụng token đã chuẩn hóa thay vì header phản hồi provider thô.

## Khắc phục sự cố nhanh

- `cacheWrite` cao ở hầu hết các lượt: kiểm tra các đầu vào system-prompt dễ thay đổi và xác minh model/provider hỗ trợ thiết lập cache của bạn.
- `cacheWrite` cao trên Anthropic: thường có nghĩa là điểm ngắt cache đang rơi vào nội dung thay đổi trong mọi yêu cầu.
- `cacheRead` thấp trên OpenAI: xác minh tiền tố ổn định nằm ở đầu, tiền tố lặp lại có ít nhất 1024 token, và cùng một `prompt_cache_key` được tái sử dụng cho các lượt cần dùng chung cache.
- `cacheRetention` không có hiệu lực: xác nhận khóa model khớp với `agents.defaults.models["provider/model"]`.
- Yêu cầu Bedrock Nova/Mistral với thiết lập cache: runtime dự kiến sẽ ép về `none`.

Tài liệu liên quan:

- [Anthropic](/vi/providers/anthropic)
- [Sử dụng token và chi phí](/vi/reference/token-use)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Tham chiếu cấu hình Gateway](/vi/gateway/configuration-reference)

## Liên quan

- [Sử dụng token và chi phí](/vi/reference/token-use)
- [Sử dụng API và chi phí](/vi/reference/api-usage-costs)
