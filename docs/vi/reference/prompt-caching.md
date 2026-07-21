---
read_when:
    - Bạn muốn giảm chi phí token của prompt bằng cách duy trì bộ nhớ đệm
    - Bạn cần cơ chế bộ nhớ đệm riêng cho từng tác tử trong các thiết lập đa tác tử
    - Bạn đang đồng thời tinh chỉnh Heartbeat và việc dọn dẹp theo TTL của bộ nhớ đệm
summary: Các tùy chọn bộ nhớ đệm prompt, thứ tự hợp nhất, hành vi của nhà cung cấp và các mẫu tinh chỉnh
title: Bộ nhớ đệm prompt
x-i18n:
    generated_at: "2026-07-21T13:51:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a9201ebc262f00311a512788e8aa2bf2091b6f31ad160b54925cceb2b74c7155
    source_path: reference/prompt-caching.md
    workflow: 16
---

Bộ nhớ đệm lời nhắc cho phép nhà cung cấp mô hình tái sử dụng tiền tố lời nhắc không thay đổi (hướng dẫn hệ thống/nhà phát triển, định nghĩa công cụ, ngữ cảnh ổn định khác) qua nhiều lượt thay vì xử lý lại trong mỗi yêu cầu. Điều này giúp giảm chi phí token và độ trễ trong các phiên chạy dài có ngữ cảnh lặp lại.

OpenClaw chuẩn hóa mức sử dụng của nhà cung cấp thành `cacheRead` và `cacheWrite` ở mọi nơi API thượng nguồn cung cấp các bộ đếm đó. Bản tóm tắt mức sử dụng (`/status` và các mục tương tự) dùng mục mức sử dụng gần nhất trong bản ghi hội thoại làm phương án dự phòng khi ảnh chụp nhanh của phiên trực tiếp thiếu bộ đếm bộ nhớ đệm; giá trị trực tiếp khác 0 luôn được ưu tiên hơn phương án dự phòng.

Tài liệu tham khảo của nhà cung cấp:

- [Bộ nhớ đệm lời nhắc Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Bộ nhớ đệm lời nhắc OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Các tùy chọn chính

### `cacheRetention`

Giá trị: `"none" | "short" | "long"`. Có thể cấu hình làm mặc định toàn cục, theo từng mô hình và theo từng tác nhân.
`"standard"` không phải là bí danh; hãy dùng `"short"` cho khoảng thời gian lưu bộ nhớ đệm mặc định của nhà cung cấp. Các giá trị không hợp lệ sẽ bị bỏ qua kèm cảnh báo.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # overrides the global default for this model
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # overrides both defaults for this agent
```

Thứ tự hợp nhất (mục sau được ưu tiên):

1. `agents.defaults.params` - mặc định toàn cục cho mọi mô hình
2. `agents.defaults.models["provider/model"].params` - ghi đè theo từng mô hình
3. `agents.list[].params` - ghi đè theo từng tác nhân, được khớp theo mã định danh tác nhân

Nguồn: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Lược bỏ ngữ cảnh kết quả công cụ cũ sau khi cửa sổ TTL của bộ nhớ đệm hết hạn, để yêu cầu sau một khoảng thời gian không hoạt động không lưu lại toàn bộ lịch sử quá lớn vào bộ nhớ đệm.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Xem [Lược bỏ phiên](/vi/concepts/session-pruning) để biết hành vi đầy đủ.

### Giữ bộ nhớ đệm nóng bằng Heartbeat

Heartbeat có thể giữ cho các cửa sổ bộ nhớ đệm luôn nóng và giảm số lần ghi lại bộ nhớ đệm sau các khoảng thời gian không hoạt động. Có thể cấu hình toàn cục (`agents.defaults.heartbeat`) hoặc theo từng tác nhân (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Hành vi của nhà cung cấp

### Anthropic (API trực tiếp và Vertex AI)

- `cacheRetention` được hỗ trợ cho các nhà cung cấp `anthropic` và `anthropic-vertex`, cũng như cho các mô hình Claude trên `amazon-bedrock` và các điểm cuối tùy chỉnh tương thích với `anthropic-messages` khi `cacheRetention` được đặt rõ ràng.
- Khi chưa được đặt, OpenClaw khởi tạo `cacheRetention: "short"` cho Anthropic trực tiếp (chỉ các nhà cung cấp `anthropic` và `anthropic-vertex`; các tuyến thuộc họ Anthropic khác yêu cầu giá trị rõ ràng).
- Phản hồi Anthropic Messages gốc cung cấp `cache_read_input_tokens` và `cache_creation_input_tokens`, được ánh xạ thành `cacheRead` và `cacheWrite`.
- `cacheRetention: "short"` ánh xạ tới bộ nhớ đệm tạm thời mặc định 5 phút. `cacheRetention: "long"` yêu cầu TTL 1 giờ (`cache_control: { type: "ephemeral", ttl: "1h" }`) khi được đặt rõ ràng. Thời gian lưu dài ngầm định/do môi trường điều khiển (`OPENCLAW_CACHE_RETENTION=long` mà không có `cacheRetention` rõ ràng) chỉ nâng cấp lên TTL 1 giờ trên `api.anthropic.com` hoặc các máy chủ Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); các máy chủ khác vẫn dùng bộ nhớ đệm 5 phút.

Nguồn: `packages/ai/src/transports/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API trực tiếp)

- Bộ nhớ đệm lời nhắc hoạt động tự động trên các mô hình gần đây được hỗ trợ; OpenClaw không chèn dấu bộ nhớ đệm ở cấp khối.
- OpenClaw gửi `prompt_cache_key` để giữ ổn định việc định tuyến bộ nhớ đệm qua các lượt. Các máy chủ `api.openai.com` trực tiếp tự động nhận trường này. Các proxy tương thích với OpenAI (oMLX, llama.cpp, điểm cuối tùy chỉnh) cần `compat.supportsPromptCacheKey: true` trong cấu hình mô hình để chủ động bật tính năng này — tùy chọn này không bao giờ được tự động phát hiện cho proxy.
- `prompt_cache_retention: "24h"` chỉ được thêm khi `cacheRetention: "long"` được chọn và điểm cuối đã phân giải hỗ trợ cả khóa bộ nhớ đệm lẫn thời gian lưu dài (`compat.supportsLongCacheRetention`, mặc định là true; các hồ sơ tương thích Together AI và Cloudflare vô hiệu hóa tùy chọn này). `cacheRetention: "none"` ngăn gửi cả hai trường.
- Lượt truy cập bộ nhớ đệm được cung cấp qua `usage.prompt_tokens_details.cached_tokens` (Chat Completions) hoặc `input_tokens_details.cached_tokens` (Responses API), được ánh xạ thành `cacheRead`.
- Tải trọng Responses API cũng có thể cung cấp `input_tokens_details.cache_write_tokens`, được ánh xạ thành `cacheWrite` và tính giá theo mức phí ghi bộ nhớ đệm của mô hình; tải trọng Responses không có trường này giữ `cacheWrite` ở `0`. API Chat Completions của OpenAI không lập tài liệu hoặc phát ra bộ đếm `cache_write_tokens`, nhưng OpenClaw vẫn đọc `prompt_tokens_details.cache_write_tokens` tại đó cho các proxy tương thích với OpenRouter và kiểu DeepSeek có báo cáo số lượt ghi riêng.
- Trong thực tế, OpenAI hoạt động giống bộ nhớ đệm tiền tố ban đầu hơn là cơ chế tái sử dụng toàn bộ lịch sử dịch chuyển của Anthropic — xem [kỳ vọng trực tiếp đối với OpenAI](#openai-live-expectations) bên dưới.

### Amazon Bedrock

- Các tham chiếu mô hình Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, cùng các tiền tố hồ sơ suy luận hệ thống AWS `us.`/`eu.`/`global.anthropic.claude*`) hỗ trợ chuyển tiếp rõ ràng `cacheRetention`.
- Các mô hình Bedrock không thuộc Anthropic (ví dụ `amazon.nova-*`) được phân giải thành không lưu bộ nhớ đệm khi chạy, bất kể giá trị `cacheRetention` nào đã được cấu hình.
- Các ARN hồ sơ suy luận ứng dụng Bedrock không rõ loại (mã định danh hồ sơ không chứa `claude`) cũng được phân giải thành không lưu bộ nhớ đệm, trừ khi `cacheRetention` được đặt rõ ràng, vì không thể suy ra họ mô hình chỉ từ ARN.

### OpenRouter

Đối với các tham chiếu mô hình `openrouter/anthropic/*`, OpenClaw chèn dấu `cache_control` của Anthropic vào các khối lời nhắc hệ thống/nhà phát triển, nhưng chỉ khi yêu cầu vẫn nhắm đến một tuyến OpenRouter đã được xác minh (`openrouter` trên điểm cuối mặc định của tuyến đó, hoặc bất kỳ nhà cung cấp/URL cơ sở nào phân giải thành `openrouter.ai`). Việc chuyển mô hình sang một URL proxy tùy ý tương thích với OpenAI sẽ dừng quá trình chèn này.

`contextPruning.mode: "cache-ttl"` được phép cho các tham chiếu mô hình `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` và `openrouter/zai/*`, vì các tuyến này xử lý bộ nhớ đệm lời nhắc ở phía nhà cung cấp mà không cần dấu do OpenClaw chèn.

Nguồn: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Việc tạo bộ nhớ đệm DeepSeek trên OpenRouter được thực hiện theo khả năng tốt nhất và có thể mất vài giây; một yêu cầu tiếp nối ngay lập tức vẫn có thể hiển thị `cached_tokens: 0`. Hãy xác minh bằng một yêu cầu lặp lại có cùng tiền tố sau một khoảng trễ ngắn, sử dụng `usage.prompt_tokens_details.cached_tokens` làm tín hiệu truy cập bộ nhớ đệm.

### Google Gemini (API trực tiếp)

- Phương thức truyền Gemini trực tiếp (`api: "google-generative-ai"`) báo cáo lượt truy cập bộ nhớ đệm qua `cachedContentTokenCount` thượng nguồn, được ánh xạ thành `cacheRead`.
- Các họ mô hình đủ điều kiện: `gemini-2.5*` và `gemini-3*` (không bao gồm các biến thể Live/preview nằm ngoài phép khớp tiền tố đó, ví dụ `gemini-live-2.5-flash-preview`).
- Khi `cacheRetention` được đặt trên một mô hình đủ điều kiện, OpenClaw tự động tạo, tái sử dụng và làm mới tài nguyên `cachedContents` cho lời nhắc hệ thống — không cần bộ xử lý nội dung đã lưu vào bộ nhớ đệm thủ công. TTL là `300s` đối với `cacheRetention: "short"` và `3600s` đối với `"long"`.
- Bạn vẫn có thể chuyển tiếp bộ xử lý nội dung đã lưu vào bộ nhớ đệm Gemini có sẵn dưới dạng `params.cachedContent` (hoặc `params.cached_content` cũ); bộ xử lý được chỉ định rõ ràng sẽ bỏ qua hoàn toàn đường dẫn quản lý bộ nhớ đệm tự động.
- Cơ chế này tách biệt với bộ nhớ đệm tiền tố lời nhắc của Anthropic/OpenAI: OpenClaw quản lý tài nguyên `cachedContents` gốc của nhà cung cấp cho Gemini thay vì chèn dấu bộ nhớ đệm nội tuyến.

Nguồn: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Nhà cung cấp dùng bộ khung CLI (Claude Code, Gemini CLI)

Các phần phụ trợ CLI phát ra sự kiện mức sử dụng JSONL (`jsonlDialect: "claude-stream-json"` hoặc `"gemini-stream-json"`) đi qua một trình phân tích mức sử dụng dùng chung có thể nhận dạng nhiều biến thể tên trường, bao gồm bộ đếm `cached` thuần túy được ánh xạ thành `cacheRead`. Khi tải trọng JSON của CLI không có trường token đầu vào trực tiếp, OpenClaw suy ra trường đó dưới dạng `input_tokens - cached`. Đây chỉ là quá trình chuẩn hóa mức sử dụng — nó không tạo dấu bộ nhớ đệm lời nhắc kiểu Anthropic/OpenAI cho các mô hình được điều khiển bằng CLI này.

Nguồn: `src/agents/cli-output.ts` (`toCliUsage`).

### Các nhà cung cấp khác

Nếu một nhà cung cấp không hỗ trợ bất kỳ chế độ bộ nhớ đệm nào ở trên, `cacheRetention` không có tác dụng.

## Ranh giới bộ nhớ đệm của lời nhắc hệ thống

OpenClaw chia lời nhắc hệ thống thành một **tiền tố ổn định** và một **hậu tố biến động** tại ranh giới tiền tố bộ nhớ đệm nội bộ. Nội dung phía trên ranh giới (định nghĩa công cụ, siêu dữ liệu Skills, tệp không gian làm việc) được sắp xếp để duy trì giống hệt từng byte qua các lượt. Nội dung phía dưới ranh giới (ví dụ `HEARTBEAT.md`, dấu thời gian khi chạy, siêu dữ liệu khác theo từng lượt) có thể thay đổi mà không làm mất hiệu lực tiền tố đã lưu vào bộ nhớ đệm.

Các lựa chọn thiết kế chính:

- Các tệp ngữ cảnh dự án ổn định trong không gian làm việc được sắp xếp trước `HEARTBEAT.md` để biến động Heartbeat không phá vỡ tiền tố ổn định.
- Ranh giới này áp dụng xuyên suốt việc định hình phương thức truyền thuộc họ Anthropic, họ OpenAI, Google và CLI, để mọi nhà cung cấp được hỗ trợ đều hưởng lợi từ cùng mức ổn định tiền tố.
- Các yêu cầu Codex Responses và Anthropic Vertex được định tuyến qua cơ chế định hình bộ nhớ đệm có nhận biết ranh giới để việc tái sử dụng bộ nhớ đệm luôn khớp với nội dung mà nhà cung cấp thực sự nhận được.
- Dấu vân tay lời nhắc hệ thống được chuẩn hóa (khoảng trắng, ký tự kết thúc dòng, ngữ cảnh do hook thêm, thứ tự khả năng khi chạy) để các lời nhắc không thay đổi về ngữ nghĩa dùng chung bộ nhớ đệm qua các lượt.

Nếu thấy `cacheWrite` tăng đột biến ngoài dự kiến sau khi thay đổi cấu hình hoặc không gian làm việc, hãy kiểm tra xem thay đổi đó nằm phía trên hay phía dưới ranh giới bộ nhớ đệm. Việc chuyển nội dung biến động xuống dưới ranh giới (hoặc làm cho nội dung đó ổn định) thường giải quyết được vấn đề.

## Các cơ chế bảo vệ độ ổn định bộ nhớ đệm của OpenClaw

- Các danh mục công cụ MCP đi kèm được sắp xếp theo cách xác định (trước tiên theo tên máy chủ, sau đó theo tên công cụ) trước khi đăng ký công cụ, để các thay đổi thứ tự `listTools()` không làm biến động khối công cụ và phá vỡ tiền tố bộ nhớ đệm lời nhắc.
- Các phiên cũ có khối hình ảnh được lưu vẫn giữ nguyên **3 lượt hoàn tất gần nhất** (tính tất cả các lượt hoàn tất, không chỉ các lượt có hình ảnh). Các khối hình ảnh cũ hơn đã được xử lý được thay bằng dấu văn bản để những lượt tiếp nối chứa nhiều hình ảnh không tiếp tục gửi lại tải trọng cũ có kích thước lớn.

## Mẫu tinh chỉnh

### Lưu lượng hỗn hợp (mặc định được khuyến nghị)

Duy trì đường cơ sở dài hạn trên tác nhân chính và vô hiệu hóa bộ nhớ đệm trên các tác nhân thông báo có lưu lượng bùng phát:

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

- Đặt `cacheRetention: "short"` làm đường cơ sở.
- Bật `contextPruning.mode: "cache-ttl"`.
- Chỉ giữ khoảng Heartbeat ngắn hơn TTL đối với các tác nhân được hưởng lợi từ bộ nhớ đệm nóng.

## Kiểm thử hồi quy trực tiếp

OpenClaw chạy một cổng hồi quy bộ nhớ đệm trực tiếp kết hợp, bao phủ tiền tố lặp lại, lượt dùng công cụ, lượt dùng hình ảnh, bản ghi hội thoại công cụ kiểu MCP và một trường hợp đối chứng Anthropic không dùng bộ nhớ đệm.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Chạy bằng:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Tệp baseline lưu các số liệu trực tiếp được quan sát gần nhất cùng với các ngưỡng sàn hồi quy dành riêng cho từng nhà cung cấp mà bài kiểm thử dùng để đối chiếu. Mỗi lần chạy sử dụng ID phiên và không gian tên prompt riêng mới, để trạng thái bộ nhớ đệm trước đó không làm sai lệch mẫu hiện tại. Anthropic và OpenAI áp dụng cơ chế thực thi khác nhau: nếu không đạt ngưỡng sàn Anthropic thì đó là hồi quy nghiêm trọng (bài kiểm thử thất bại), còn nếu không đạt ngưỡng sàn OpenAI thì chỉ được theo dõi (được ghi nhận dưới dạng cảnh báo và không làm lần chạy thất bại). Hai nhà cung cấp không dùng chung một ngưỡng duy nhất.

### Kỳ vọng trực tiếp đối với Anthropic

- Kỳ vọng các lượt ghi khởi động rõ ràng qua `cacheWrite`.
- Kỳ vọng tái sử dụng gần như toàn bộ lịch sử ở các lượt lặp lại, vì cơ chế kiểm soát bộ nhớ đệm của Anthropic dịch chuyển điểm ngắt bộ nhớ đệm xuyên suốt cuộc hội thoại.
- Các ngưỡng sàn baseline cho các luồng ổn định, công cụ, hình ảnh và kiểu MCP là các cổng hồi quy nghiêm ngặt.

### Kỳ vọng trực tiếp đối với OpenAI

- Chỉ kỳ vọng `cacheRead`; `cacheWrite` vẫn là `0` trên Chat Completions.
- Xem việc tái sử dụng bộ nhớ đệm qua các lượt lặp lại là một mức ổn định dành riêng cho nhà cung cấp, không phải kiểu tái sử dụng toàn bộ lịch sử dịch chuyển như Anthropic.
- Các ngưỡng sàn chỉ dùng để theo dõi (nếu không đạt thì được ghi dưới dạng cảnh báo, không làm bài kiểm thử thất bại), được suy ra từ hành vi trực tiếp đã quan sát trên `gpt-5.4-mini`:

| Kịch bản             | Ngưỡng sàn `cacheRead` | Ngưỡng tỷ lệ trúng |
| -------------------- | ----------------: | -------------: |
| Tiền tố ổn định        |             4,608 |           0.90 |
| Bản ghi công cụ      |             4,096 |           0.85 |
| Bản ghi hình ảnh     |             3,840 |           0.82 |
| Bản ghi kiểu MCP |             4,096 |           0.85 |

Các số liệu baseline được quan sát gần nhất (từ `live-cache-regression-baseline.ts`) đạt: tiền tố ổn định `cacheRead=4864`, tỷ lệ trúng `0.966`; bản ghi công cụ `cacheRead=4608`, tỷ lệ trúng `0.896`; bản ghi hình ảnh `cacheRead=4864`, tỷ lệ trúng `0.954`; bản ghi kiểu MCP `cacheRead=4608`, tỷ lệ trúng `0.891`.

Lý do các phép xác nhận khác nhau: Anthropic cung cấp các điểm ngắt bộ nhớ đệm rõ ràng và khả năng tái sử dụng lịch sử hội thoại dịch chuyển, còn tiền tố có thể tái sử dụng hiệu quả của OpenAI trong lưu lượng trực tiếp có thể đạt trạng thái ổn định trước khi bao phủ toàn bộ prompt. So sánh hai nhà cung cấp theo một ngưỡng phần trăm duy nhất tạo ra các hồi quy giả.

## Cấu hình `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # tùy chọn
    includeMessages: false # mặc định là true
    includePrompt: false # mặc định là true
    includeSystem: false # mặc định là true
```

Giá trị mặc định:

| Khóa               | Mặc định                                      |
| ----------------- | -------------------------------------------- |
| `filePath`        | `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl` |
| `includeMessages` | `true`                                       |
| `includePrompt`   | `true`                                       |
| `includeSystem`   | `true`                                       |

### Công tắc môi trường (gỡ lỗi một lần)

| Biến                             | Tác dụng                               |
| ------------------------------------ | ------------------------------------ |
| `OPENCLAW_CACHE_TRACE=1`             | Bật theo dõi bộ nhớ đệm                |
| `OPENCLAW_CACHE_TRACE_FILE=path`     | Ghi đè đường dẫn đầu ra                |
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Bật hoặc tắt việc ghi lại toàn bộ payload thông điệp |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Bật hoặc tắt việc ghi lại văn bản prompt          |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Bật hoặc tắt việc ghi lại system prompt        |

### Nội dung cần kiểm tra

- Các sự kiện theo dõi bộ nhớ đệm có định dạng JSONL với các snapshot theo giai đoạn như `session:loaded`, `prompt:before`, `stream:context` và `session:after`.
- Tác động của token bộ nhớ đệm theo từng lượt hiển thị trên các bề mặt mức sử dụng thông thường: `cacheRead` và `cacheWrite` xuất hiện trong `/usage tokens`, `/status`, bản tóm tắt mức sử dụng phiên và bố cục `messages.usageTemplate` tùy chỉnh.
- Đối với Anthropic, kỳ vọng cả `cacheRead` và `cacheWrite` khi bộ nhớ đệm đang hoạt động.
- Đối với OpenAI, kỳ vọng `cacheRead` khi trúng bộ nhớ đệm; `cacheWrite` chỉ được điền trong các payload Responses API có chứa trường này (xem [OpenAI](#openai-direct-api) ở trên).
- OpenAI cũng trả về các header theo dõi và giới hạn tốc độ như `x-request-id`, `openai-processing-ms` và `x-ratelimit-*`; hãy dùng chúng để theo dõi yêu cầu, nhưng việc tính toán lượt trúng bộ nhớ đệm vẫn phải lấy từ payload mức sử dụng, không phải từ header.

## Khắc phục sự cố nhanh

- **`cacheWrite` cao ở hầu hết các lượt**: kiểm tra các đầu vào system prompt thường xuyên thay đổi; xác minh mô hình/nhà cung cấp hỗ trợ các thiết lập bộ nhớ đệm của bạn.
- **`cacheWrite` cao trên Anthropic**: thường có nghĩa là điểm ngắt bộ nhớ đệm nằm trên nội dung thay đổi theo từng yêu cầu.
- **`cacheRead` của OpenAI thấp**: xác minh tiền tố ổn định nằm ở đầu, tiền tố lặp lại có ít nhất 1024 token và cùng một `prompt_cache_key` được tái sử dụng cho các lượt cần dùng chung bộ nhớ đệm.
- **`cacheRetention` không có tác dụng**: xác nhận khóa mô hình khớp với `agents.defaults.models["provider/model"]`.
- **Các yêu cầu Bedrock Nova có thiết lập bộ nhớ đệm**: đây là hành vi dự kiến — các yêu cầu này được phân giải thành không duy trì bộ nhớ đệm trong thời gian chạy.

Tài liệu liên quan:

- [Anthropic](/vi/providers/anthropic)
- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Lược bỏ phiên](/vi/concepts/session-pruning)
- [Tham chiếu cấu hình Gateway](/vi/gateway/configuration-reference)

## Liên quan

- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
