---
read_when:
    - Bạn muốn giảm chi phí token lời nhắc bằng cách giữ lại bộ nhớ đệm
    - Bạn cần hành vi bộ nhớ đệm theo từng agent trong các thiết lập đa agent
    - Bạn đang điều chỉnh Heartbeat và dọn dẹp cache-ttl cùng lúc
summary: Các tùy chọn điều chỉnh lưu lời nhắc vào bộ nhớ đệm, thứ tự hợp nhất, hành vi của nhà cung cấp và các mẫu tinh chỉnh
title: Bộ nhớ đệm prompt
x-i18n:
    generated_at: "2026-07-01T18:14:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3189cc734bbee14236e6303aca99aca512732989ffd01612ae635608a2471e60
    source_path: reference/prompt-caching.md
    workflow: 16
---

Lưu bộ nhớ đệm prompt nghĩa là nhà cung cấp mô hình có thể tái sử dụng các tiền tố prompt không đổi (thường là chỉ dẫn hệ thống/nhà phát triển và ngữ cảnh ổn định khác) qua nhiều lượt thay vì xử lý lại chúng mỗi lần. OpenClaw chuẩn hóa mức sử dụng của nhà cung cấp thành `cacheRead` và `cacheWrite` khi API thượng nguồn trực tiếp cung cấp các bộ đếm đó.

Các giao diện trạng thái cũng có thể khôi phục bộ đếm bộ nhớ đệm từ nhật ký
mức sử dụng transcript gần nhất khi ảnh chụp phiên trực tiếp thiếu chúng, để `/status` có thể tiếp tục
hiển thị dòng bộ nhớ đệm sau khi mất một phần siêu dữ liệu phiên. Các giá trị bộ nhớ đệm trực tiếp khác 0
hiện có vẫn được ưu tiên hơn các giá trị dự phòng từ transcript.

Vì sao điều này quan trọng: chi phí token thấp hơn, phản hồi nhanh hơn, và hiệu năng dễ dự đoán hơn cho các phiên chạy lâu. Nếu không có bộ nhớ đệm, các prompt lặp lại phải trả toàn bộ chi phí prompt ở mọi lượt ngay cả khi phần lớn đầu vào không thay đổi.

Các phần bên dưới bao quát mọi nút điều chỉnh liên quan đến bộ nhớ đệm có ảnh hưởng đến việc tái sử dụng prompt và chi phí token.

Tài liệu tham khảo của nhà cung cấp:

- Lưu bộ nhớ đệm prompt của Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Lưu bộ nhớ đệm prompt của OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Header API và ID yêu cầu của OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- ID yêu cầu và lỗi của Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Các nút điều chỉnh chính

### `cacheRetention` (mặc định toàn cục, mô hình, và theo từng tác tử)

Đặt thời gian giữ bộ nhớ đệm làm mặc định toàn cục cho mọi mô hình:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Ghi đè theo từng mô hình:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Ghi đè theo từng tác tử:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Thứ tự hợp nhất cấu hình:

1. `agents.defaults.params` (mặc định toàn cục — áp dụng cho mọi mô hình)
2. `agents.defaults.models["provider/model"].params` (ghi đè theo từng mô hình)
3. `agents.list[].params` (ID tác tử khớp; ghi đè theo khóa)

### `contextPruning.mode: "cache-ttl"`

Cắt tỉa ngữ cảnh kết quả công cụ cũ sau các cửa sổ TTL của bộ nhớ đệm để các yêu cầu sau thời gian nhàn rỗi không lưu lại vào bộ nhớ đệm phần lịch sử quá lớn.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Xem [Cắt Tỉa Phiên](/vi/concepts/session-pruning) để biết đầy đủ hành vi.

### Giữ ấm Heartbeat

Heartbeat có thể giữ ấm các cửa sổ bộ nhớ đệm và giảm số lần ghi bộ nhớ đệm lặp lại sau các khoảng nhàn rỗi.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat theo từng tác tử được hỗ trợ tại `agents.list[].heartbeat`.

## Hành vi của nhà cung cấp

### Anthropic (API trực tiếp)

- `cacheRetention` được hỗ trợ.
- Với các hồ sơ xác thực bằng khóa API Anthropic, OpenClaw đặt sẵn `cacheRetention: "short"` cho các tham chiếu mô hình Anthropic khi chưa đặt.
- Phản hồi Messages gốc của Anthropic cung cấp cả `cache_read_input_tokens` và `cache_creation_input_tokens`, nên OpenClaw có thể hiển thị cả `cacheRead` và `cacheWrite`.
- Với các yêu cầu Anthropic gốc, `cacheRetention: "short"` ánh xạ tới bộ nhớ đệm tạm thời mặc định 5 phút, và `cacheRetention: "long"` nâng cấp lên TTL 1 giờ chỉ trên các máy chủ `api.anthropic.com` trực tiếp.

### OpenAI (API trực tiếp)

- Lưu bộ nhớ đệm prompt là tự động trên các mô hình gần đây được hỗ trợ. OpenClaw không cần chèn các dấu bộ nhớ đệm cấp khối.
- OpenClaw dùng `prompt_cache_key` để giữ định tuyến bộ nhớ đệm ổn định qua các lượt. Máy chủ OpenAI trực tiếp dùng `prompt_cache_retention: "24h"` khi chọn `cacheRetention: "long"`.
- Các nhà cung cấp Completions tương thích OpenAI chỉ nhận `prompt_cache_key` khi cấu hình mô hình của họ đặt rõ `compat.supportsPromptCacheKey: true`. Chuyển tiếp thời gian giữ dài là một khả năng riêng: `cacheRetention: "long"` rõ ràng chỉ gửi `prompt_cache_retention: "24h"` khi mục compat đó cũng hỗ trợ thời gian giữ bộ nhớ đệm dài. Các nhà cung cấp như Mistral có thể chọn dùng khóa bộ nhớ đệm trong khi đặt `compat.supportsLongCacheRetention: false` để chặn trường thời gian giữ dài. `cacheRetention: "none"` chặn cả hai trường.
- Phản hồi OpenAI cung cấp token prompt đã lưu trong bộ nhớ đệm qua `usage.prompt_tokens_details.cached_tokens` (hoặc `input_tokens_details.cached_tokens` trên sự kiện Responses API). OpenClaw ánh xạ giá trị đó tới `cacheRead`.
- Mức sử dụng GPT-5.6 Responses cũng có thể cung cấp `input_tokens_details.cache_write_tokens`. OpenClaw ánh xạ giá trị đó tới `cacheWrite` và định giá theo mức ghi bộ nhớ đệm của mô hình; các phản hồi Responses bỏ qua trường này giữ `cacheWrite` ở `0`.
- OpenAI trả về các header hữu ích cho truy vết và giới hạn tốc độ như `x-request-id`, `openai-processing-ms`, và `x-ratelimit-*`, nhưng kế toán lần trúng bộ nhớ đệm nên lấy từ payload mức sử dụng, không phải từ header.
- Trên thực tế, OpenAI thường hoạt động như bộ nhớ đệm tiền tố ban đầu hơn là tái sử dụng toàn bộ lịch sử di động kiểu Anthropic. Các lượt văn bản tiền tố dài ổn định có thể đạt gần một ngưỡng `4864` token đã lưu trong bộ nhớ đệm trong các phép thăm dò trực tiếp hiện tại, trong khi transcript nhiều công cụ hoặc kiểu MCP thường đạt ngưỡng gần `4608` token đã lưu trong bộ nhớ đệm ngay cả khi lặp lại chính xác.

### Anthropic Vertex

- Các mô hình Anthropic trên Vertex AI (`anthropic-vertex/*`) hỗ trợ `cacheRetention` giống như Anthropic trực tiếp.
- `cacheRetention: "long"` ánh xạ tới TTL bộ nhớ đệm prompt 1 giờ thực trên các endpoint Vertex AI.
- Thời gian giữ bộ nhớ đệm mặc định cho `anthropic-vertex` khớp với mặc định Anthropic trực tiếp.
- Các yêu cầu Vertex được định tuyến qua định hình bộ nhớ đệm nhận biết ranh giới để việc tái sử dụng bộ nhớ đệm vẫn khớp với nội dung nhà cung cấp thực sự nhận.

### Amazon Bedrock

- Các tham chiếu mô hình Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) hỗ trợ truyền qua `cacheRetention` rõ ràng.
- Các mô hình Bedrock không phải Anthropic bị ép thành `cacheRetention: "none"` khi chạy.

### Mô hình OpenRouter

Với các tham chiếu mô hình `openrouter/anthropic/*`, OpenClaw chèn
`cache_control` của Anthropic trên các khối prompt hệ thống/nhà phát triển để cải thiện việc tái sử dụng
bộ nhớ đệm prompt chỉ khi yêu cầu vẫn đang nhắm tới một tuyến OpenRouter đã xác minh
(`openrouter` trên endpoint mặc định của nó, hoặc bất kỳ nhà cung cấp/base URL nào phân giải
tới `openrouter.ai`).

Với các tham chiếu mô hình `openrouter/deepseek/*`, `openrouter/moonshot*/*`, và `openrouter/zai/*`,
`contextPruning.mode: "cache-ttl"` được cho phép vì OpenRouter
tự động xử lý lưu bộ nhớ đệm prompt phía nhà cung cấp. OpenClaw không chèn
dấu `cache_control` của Anthropic vào các yêu cầu đó.

Việc tạo bộ nhớ đệm DeepSeek là nỗ lực tối đa và có thể mất vài giây. Một
lượt theo sau ngay lập tức vẫn có thể hiển thị `cached_tokens: 0`; hãy xác minh bằng một yêu cầu
cùng tiền tố được lặp lại sau một khoảng trễ ngắn và dùng `usage.prompt_tokens_details.cached_tokens`
làm tín hiệu trúng bộ nhớ đệm.

Nếu bạn trỏ lại mô hình tới một URL proxy tương thích OpenAI tùy ý, OpenClaw
sẽ ngừng chèn các dấu bộ nhớ đệm Anthropic dành riêng cho OpenRouter đó.

### Nhà cung cấp khác

Nếu nhà cung cấp không hỗ trợ chế độ bộ nhớ đệm này, `cacheRetention` không có hiệu lực.

### API trực tiếp Google Gemini

- Phương thức truyền Gemini trực tiếp (`api: "google-generative-ai"`) báo cáo lần trúng bộ nhớ đệm
  qua `cachedContentTokenCount` thượng nguồn; OpenClaw ánh xạ giá trị đó tới `cacheRead`.
- Khi `cacheRetention` được đặt trên một mô hình Gemini trực tiếp, OpenClaw tự động
  tạo, tái sử dụng, và làm mới các tài nguyên `cachedContents` cho prompt hệ thống
  trên các lần chạy Google AI Studio. Điều này nghĩa là bạn không còn cần tạo sẵn
  một handle nội dung đã lưu trong bộ nhớ đệm theo cách thủ công.
- Bạn vẫn có thể truyền một handle nội dung đã lưu trong bộ nhớ đệm Gemini có sẵn qua
  `params.cachedContent` (hoặc `params.cached_content` cũ) trên mô hình đã cấu hình.
- Điều này tách biệt với lưu bộ nhớ đệm tiền tố prompt của Anthropic/OpenAI. Với Gemini,
  OpenClaw quản lý một tài nguyên `cachedContents` gốc của nhà cung cấp thay vì
  chèn dấu bộ nhớ đệm vào yêu cầu.

### Cách dùng Gemini CLI

- Đầu ra `stream-json` của Gemini CLI có thể hiển thị lần trúng bộ nhớ đệm qua `stats.cached`;
  OpenClaw ánh xạ giá trị đó tới `cacheRead`. Các ghi đè `--output-format json` cũ dùng
  cùng cơ chế chuẩn hóa mức sử dụng.
- Nếu CLI bỏ qua giá trị `stats.input` trực tiếp, OpenClaw suy ra token đầu vào
  từ `stats.input_tokens - stats.cached`.
- Đây chỉ là chuẩn hóa mức sử dụng. Điều này không có nghĩa là OpenClaw đang tạo
  dấu bộ nhớ đệm prompt kiểu Anthropic/OpenAI cho Gemini CLI.

## Ranh giới bộ nhớ đệm prompt hệ thống

OpenClaw tách prompt hệ thống thành một **tiền tố ổn định** và một **hậu tố
dễ biến động**, được phân tách bằng một ranh giới tiền tố bộ nhớ đệm nội bộ. Nội dung phía trên
ranh giới (định nghĩa công cụ, siêu dữ liệu Skills, tệp không gian làm việc, và ngữ cảnh
tương đối tĩnh khác) được sắp thứ tự để nó giữ nguyên từng byte qua các lượt.
Nội dung phía dưới ranh giới (ví dụ `HEARTBEAT.md`, dấu thời gian runtime, và
siêu dữ liệu theo từng lượt khác) được phép thay đổi mà không làm mất hiệu lực tiền tố
đã lưu trong bộ nhớ đệm.

Các lựa chọn thiết kế chính:

- Các tệp ngữ cảnh dự án không gian làm việc ổn định được sắp trước `HEARTBEAT.md` để
  biến động Heartbeat không phá vỡ tiền tố ổn định.
- Ranh giới được áp dụng trên định hình phương thức truyền họ Anthropic, họ OpenAI, Google, và
  CLI để mọi nhà cung cấp được hỗ trợ đều hưởng lợi từ cùng độ ổn định tiền tố.
- Các yêu cầu Codex Responses và Anthropic Vertex được định tuyến qua
  định hình bộ nhớ đệm nhận biết ranh giới để việc tái sử dụng bộ nhớ đệm vẫn khớp với nội dung nhà cung cấp
  thực sự nhận.
- Dấu vân tay prompt hệ thống được chuẩn hóa (khoảng trắng, kết thúc dòng,
  ngữ cảnh do hook thêm, thứ tự khả năng runtime) để các prompt không đổi về mặt ngữ nghĩa
  chia sẻ KV/bộ nhớ đệm qua các lượt.

Nếu bạn thấy các đợt tăng `cacheWrite` ngoài dự kiến sau thay đổi cấu hình hoặc không gian làm việc,
hãy kiểm tra xem thay đổi nằm phía trên hay phía dưới ranh giới bộ nhớ đệm. Di chuyển
nội dung dễ biến động xuống dưới ranh giới (hoặc ổn định hóa nó) thường giải quyết được
vấn đề.

## Bộ bảo vệ độ ổn định bộ nhớ đệm của OpenClaw

OpenClaw cũng giữ cho một số hình dạng payload nhạy với bộ nhớ đệm có tính xác định trước khi
yêu cầu tới nhà cung cấp:

- Các catalog công cụ MCP trong gói được sắp xếp xác định trước khi đăng ký
  công cụ, để thay đổi thứ tự `listTools()` không làm biến động khối công cụ và
  phá vỡ tiền tố bộ nhớ đệm prompt.
- Các phiên cũ có khối hình ảnh được lưu giữ sẽ giữ nguyên **3 lượt hoàn tất gần nhất**;
  các khối hình ảnh cũ hơn đã được xử lý có thể được thay bằng một dấu để các lượt theo sau
  nhiều hình ảnh không tiếp tục gửi lại các payload cũ lớn.

## Mẫu tinh chỉnh

### Lưu lượng hỗn hợp (mặc định được khuyến nghị)

Giữ một đường cơ sở sống lâu trên tác tử chính của bạn, tắt bộ nhớ đệm trên các tác tử thông báo bùng phát:

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

### Đường cơ sở ưu tiên chi phí

- Đặt đường cơ sở `cacheRetention: "short"`.
- Bật `contextPruning.mode: "cache-ttl"`.
- Giữ Heartbeat thấp hơn TTL của bạn chỉ cho các tác tử hưởng lợi từ bộ nhớ đệm ấm.

## Chẩn đoán bộ nhớ đệm

OpenClaw cung cấp chẩn đoán truy vết bộ nhớ đệm chuyên dụng cho các lần chạy tác tử nhúng.

Với chẩn đoán thông thường hướng tới người dùng, `/status` và các bản tóm tắt mức sử dụng khác có thể dùng
mục mức sử dụng transcript mới nhất làm nguồn dự phòng cho `cacheRead` /
`cacheWrite` khi mục phiên trực tiếp không có các bộ đếm đó.

## Kiểm thử hồi quy trực tiếp

OpenClaw giữ một cổng hồi quy bộ nhớ đệm trực tiếp kết hợp cho các tiền tố lặp lại, lượt công cụ, lượt hình ảnh, transcript công cụ kiểu MCP, và một đối chứng không bộ nhớ đệm của Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Chạy cổng trực tiếp hẹp bằng:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Tệp baseline lưu các số liệu live được quan sát gần đây nhất cùng các ngưỡng sàn hồi quy riêng theo nhà cung cấp mà bài kiểm tra sử dụng.
Runner cũng dùng ID phiên và namespace prompt mới cho từng lần chạy để trạng thái bộ nhớ đệm trước đó không làm nhiễu mẫu hồi quy hiện tại.

Các bài kiểm tra này cố ý không dùng tiêu chí thành công giống hệt nhau giữa các nhà cung cấp.

### Kỳ vọng live của Anthropic

- Kỳ vọng các lượt ghi khởi động rõ ràng qua `cacheWrite`.
- Kỳ vọng tái sử dụng gần như toàn bộ lịch sử ở các lượt lặp lại vì cache control của Anthropic đẩy điểm ngắt bộ nhớ đệm tiến qua cuộc hội thoại.
- Các xác nhận live hiện tại vẫn dùng ngưỡng tỷ lệ trúng cao cho các đường dẫn ổn định, công cụ và hình ảnh.

### Kỳ vọng live của OpenAI

- Chỉ kỳ vọng `cacheRead`. `cacheWrite` vẫn là `0`.
- Xem việc tái sử dụng bộ nhớ đệm ở lượt lặp lại là một mức ổn định riêng theo nhà cung cấp, không phải kiểu tái sử dụng toàn bộ lịch sử có dịch chuyển như Anthropic.
- Các xác nhận live hiện tại dùng các kiểm tra ngưỡng sàn thận trọng được suy ra từ hành vi live đã quan sát trên `gpt-5.4-mini`:
  - tiền tố ổn định: `cacheRead >= 4608`, tỷ lệ trúng `>= 0.90`
  - bản ghi công cụ: `cacheRead >= 4096`, tỷ lệ trúng `>= 0.85`
  - bản ghi hình ảnh: `cacheRead >= 3840`, tỷ lệ trúng `>= 0.82`
  - bản ghi kiểu MCP: `cacheRead >= 4096`, tỷ lệ trúng `>= 0.85`

Lần xác minh live kết hợp mới trên 2026-04-04 đạt:

- tiền tố ổn định: `cacheRead=4864`, tỷ lệ trúng `0.966`
- bản ghi công cụ: `cacheRead=4608`, tỷ lệ trúng `0.896`
- bản ghi hình ảnh: `cacheRead=4864`, tỷ lệ trúng `0.954`
- bản ghi kiểu MCP: `cacheRead=4608`, tỷ lệ trúng `0.891`

Thời gian thực cục bộ gần đây cho cổng kiểm tra kết hợp là khoảng `88s`.

Lý do các xác nhận khác nhau:

- Anthropic hiển thị các điểm ngắt bộ nhớ đệm rõ ràng và khả năng tái sử dụng lịch sử hội thoại có dịch chuyển.
- Prompt caching của OpenAI vẫn nhạy với tiền tố chính xác, nhưng tiền tố có thể tái sử dụng hiệu quả trong lưu lượng Responses live có thể dừng ở mức ổn định sớm hơn toàn bộ prompt.
- Vì vậy, việc so sánh Anthropic và OpenAI bằng một ngưỡng phần trăm duy nhất dùng chung giữa các nhà cung cấp sẽ tạo ra các hồi quy giả.

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

### Công tắc môi trường (gỡ lỗi một lần)

- `OPENCLAW_CACHE_TRACE=1` bật truy vết bộ nhớ đệm.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` ghi đè đường dẫn đầu ra.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` bật/tắt việc thu thập toàn bộ payload tin nhắn.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` bật/tắt việc thu thập văn bản prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` bật/tắt việc thu thập system prompt.

### Nội dung cần kiểm tra

- Sự kiện truy vết bộ nhớ đệm là JSONL và bao gồm các ảnh chụp nhanh theo giai đoạn như `session:loaded`, `prompt:before`, `stream:context` và `session:after`.
- Tác động token bộ nhớ đệm theo từng lượt hiển thị trong các bề mặt sử dụng thông thường qua `cacheRead` và `cacheWrite` (ví dụ `/usage tokens`, `/status`, tóm tắt mức sử dụng phiên và các bố cục `messages.usageTemplate` tùy chỉnh).
- Với Anthropic, kỳ vọng cả `cacheRead` và `cacheWrite` khi bộ nhớ đệm đang hoạt động.
- Với OpenAI, kỳ vọng `cacheRead` khi có cache hit. GPT-5.6 Responses cũng có thể báo cáo `cacheWrite` trong khi các phân đoạn prompt được ghi; các payload Responses khác bỏ qua bộ đếm ghi sẽ giữ nó ở `0`.
- Nếu cần truy vết yêu cầu, hãy ghi log ID yêu cầu và header giới hạn tốc độ riêng với chỉ số bộ nhớ đệm. Đầu ra cache-trace hiện tại của OpenClaw tập trung vào hình dạng prompt/phiên và mức sử dụng token đã chuẩn hóa thay vì header phản hồi thô từ nhà cung cấp.

## Khắc phục sự cố nhanh

- `cacheWrite` cao ở hầu hết lượt: kiểm tra các đầu vào system prompt biến động và xác minh model/nhà cung cấp hỗ trợ thiết lập bộ nhớ đệm của bạn.
- `cacheWrite` cao trên Anthropic: thường có nghĩa là điểm ngắt bộ nhớ đệm đang rơi vào nội dung thay đổi ở mọi yêu cầu.
- `cacheRead` thấp trên OpenAI: xác minh tiền tố ổn định nằm ở đầu, tiền tố lặp lại có ít nhất 1024 token và cùng một `prompt_cache_key` được tái sử dụng cho các lượt cần chia sẻ bộ nhớ đệm.
- `cacheRetention` không có tác dụng: xác nhận khóa model khớp với `agents.defaults.models["provider/model"]`.
- Yêu cầu Bedrock Nova/Mistral có thiết lập bộ nhớ đệm: runtime dự kiến sẽ ép về `none`.

Tài liệu liên quan:

- [Anthropic](/vi/providers/anthropic)
- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Tham chiếu cấu hình Gateway](/vi/gateway/configuration-reference)

## Liên quan

- [Mức dùng token và chi phí](/vi/reference/token-use)
- [Mức dùng API và chi phí](/vi/reference/api-usage-costs)
