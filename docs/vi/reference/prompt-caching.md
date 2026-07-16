---
read_when:
    - Bạn muốn giảm chi phí token của prompt bằng cách duy trì bộ nhớ đệm
    - Bạn cần cơ chế bộ nhớ đệm riêng cho từng agent trong các thiết lập đa agent
    - Bạn đang đồng thời tinh chỉnh Heartbeat và việc dọn dẹp theo TTL của bộ nhớ đệm
summary: Các tùy chọn bộ nhớ đệm lời nhắc, thứ tự hợp nhất, hành vi của nhà cung cấp và các mẫu tinh chỉnh
title: Bộ nhớ đệm lời nhắc
x-i18n:
    generated_at: "2026-07-16T15:49:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 59a5aefc4d4139c31461b81f164b9efa9a4c1c48d03146049cf447b9dfd6ea99
    source_path: reference/prompt-caching.md
    workflow: 16
---

Bộ nhớ đệm lời nhắc cho phép nhà cung cấp mô hình tái sử dụng một tiền tố lời nhắc không thay đổi (chỉ dẫn hệ thống/nhà phát triển, định nghĩa công cụ, ngữ cảnh ổn định khác) qua nhiều lượt thay vì xử lý lại trong mỗi yêu cầu. Điều này giúp giảm chi phí token và độ trễ trong các phiên chạy dài có ngữ cảnh lặp lại.

OpenClaw chuẩn hóa mức sử dụng của nhà cung cấp thành `cacheRead` và `cacheWrite` ở bất cứ nơi nào API thượng nguồn cung cấp các bộ đếm đó. Bản tóm tắt mức sử dụng (`/status` và các mục tương tự) dùng mục mức sử dụng cuối cùng trong bản ghi hội thoại làm giá trị dự phòng khi ảnh chụp nhanh của phiên trực tiếp thiếu bộ đếm bộ nhớ đệm; giá trị trực tiếp khác 0 luôn được ưu tiên hơn giá trị dự phòng.

Tài liệu tham khảo của nhà cung cấp:

- [Bộ nhớ đệm lời nhắc của Anthropic](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Bộ nhớ đệm lời nhắc của OpenAI](https://developers.openai.com/api/docs/guides/prompt-caching)

## Các nút điều chỉnh chính

### `cacheRetention`

Giá trị: `"none" | "short" | "long"`. Có thể cấu hình làm mặc định toàn cục, theo từng mô hình và theo từng tác tử.
`"standard"` không phải là bí danh; hãy dùng `"short"` cho khoảng thời gian bộ nhớ đệm mặc định của nhà cung cấp. Các giá trị không hợp lệ bị bỏ qua kèm cảnh báo.

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # ghi đè mặc định toàn cục cho mô hình này
  list:
    - id: "alerts"
      params:
        cacheRetention: "none" # ghi đè cả hai giá trị mặc định cho tác tử này
```

Thứ tự hợp nhất (mục sau được ưu tiên):

1. `agents.defaults.params` - mặc định toàn cục cho tất cả mô hình
2. `agents.defaults.models["provider/model"].params` - ghi đè theo mô hình
3. `agents.list[].params` - ghi đè theo tác tử, được khớp bằng ID tác tử

Nguồn: `src/agents/embedded-agent-runner/extra-params.ts` (`resolveExtraParams`).

### `contextPruning.mode: "cache-ttl"`

Lược bỏ ngữ cảnh kết quả công cụ cũ sau khi khoảng TTL của bộ nhớ đệm hết hạn, để một yêu cầu sau thời gian nhàn rỗi không lưu lại vào bộ nhớ đệm phần lịch sử quá lớn.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Xem [Lược bỏ phiên](/vi/concepts/session-pruning) để biết đầy đủ hành vi.

### Giữ ấm bằng Heartbeat

Heartbeat có thể giữ ấm các khoảng thời gian bộ nhớ đệm và giảm số lần ghi lại bộ nhớ đệm sau những khoảng nhàn rỗi. Có thể cấu hình toàn cục (`agents.defaults.heartbeat`) hoặc theo từng tác tử (`agents.list[].heartbeat`).

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

## Hành vi của nhà cung cấp

### Anthropic (API trực tiếp và Vertex AI)

- `cacheRetention` được hỗ trợ cho các nhà cung cấp `anthropic` và `anthropic-vertex`, cũng như cho các mô hình Claude trên `amazon-bedrock` và các điểm cuối tùy chỉnh tương thích với `anthropic-messages` khi `cacheRetention` được đặt tường minh.
- Khi chưa được đặt, OpenClaw khởi tạo `cacheRetention: "short"` cho Anthropic trực tiếp (chỉ các nhà cung cấp `anthropic` và `anthropic-vertex`; các tuyến khác thuộc họ Anthropic yêu cầu giá trị tường minh).
- Phản hồi Anthropic Messages gốc cung cấp `cache_read_input_tokens` và `cache_creation_input_tokens`, được ánh xạ thành `cacheRead` và `cacheWrite`.
- `cacheRetention: "short"` ánh xạ tới bộ nhớ đệm tạm thời mặc định 5 phút. `cacheRetention: "long"` yêu cầu TTL 1 giờ (`cache_control: { type: "ephemeral", ttl: "1h" }`) khi được đặt tường minh. Chính sách lưu giữ dài ngầm định/được điều khiển bằng biến môi trường (`OPENCLAW_CACHE_RETENTION=long` mà không có `cacheRetention` tường minh) chỉ nâng cấp lên TTL 1 giờ trên `api.anthropic.com` hoặc các máy chủ Vertex AI (`aiplatform.googleapis.com` / `*-aiplatform.googleapis.com`); các máy chủ khác vẫn dùng bộ nhớ đệm 5 phút.

Nguồn: `src/agents/anthropic-payload-policy.ts` (`resolveAnthropicEphemeralCacheControl`, `isLongTtlEligibleEndpoint`).

### OpenAI (API trực tiếp)

- Bộ nhớ đệm lời nhắc hoạt động tự động trên các mô hình gần đây được hỗ trợ; OpenClaw không chèn dấu bộ nhớ đệm ở cấp khối.
- OpenClaw gửi `prompt_cache_key` để giữ ổn định việc định tuyến bộ nhớ đệm qua các lượt. Các máy chủ `api.openai.com` trực tiếp tự động nhận giá trị này. Các proxy tương thích với OpenAI (oMLX, llama.cpp, điểm cuối tùy chỉnh) cần `compat.supportsPromptCacheKey: true` trong cấu hình mô hình để chọn sử dụng — điều này không bao giờ được tự động phát hiện đối với proxy.
- `prompt_cache_retention: "24h"` chỉ được thêm khi chọn `cacheRetention: "long"` và điểm cuối đã phân giải hỗ trợ cả khóa bộ nhớ đệm lẫn chính sách lưu giữ dài (`compat.supportsLongCacheRetention`, mặc định là true; các hồ sơ tương thích Together AI và Cloudflare vô hiệu hóa tính năng này). `cacheRetention: "none"` loại bỏ cả hai trường.
- Các lượt truy cập trúng bộ nhớ đệm được biểu thị qua `usage.prompt_tokens_details.cached_tokens` (Chat Completions) hoặc `input_tokens_details.cached_tokens` (Responses API), được ánh xạ thành `cacheRead`.
- Tải trọng Responses API cũng có thể cung cấp `input_tokens_details.cache_write_tokens`, được ánh xạ thành `cacheWrite` và tính giá theo mức ghi bộ nhớ đệm của mô hình; các tải trọng Responses không có trường này giữ `cacheWrite` ở `0`. Chat Completions API của OpenAI không lập tài liệu hay phát ra bộ đếm `cache_write_tokens`, nhưng OpenClaw vẫn đọc `prompt_tokens_details.cache_write_tokens` tại đó cho các proxy tương thích với OpenRouter và kiểu DeepSeek có báo cáo riêng số lượt ghi.
- Trong thực tế, OpenAI hoạt động giống bộ nhớ đệm tiền tố ban đầu hơn là cơ chế tái sử dụng toàn bộ lịch sử động của Anthropic — xem [kỳ vọng trực tiếp với OpenAI](#openai-live-expectations) bên dưới.

### Amazon Bedrock

- Các tham chiếu mô hình Anthropic Claude (`amazon-bedrock/*anthropic.claude*`, cùng các tiền tố hồ sơ suy luận hệ thống AWS `us.`/`eu.`/`global.anthropic.claude*`) hỗ trợ truyền trực tiếp `cacheRetention` một cách tường minh.
- Các mô hình Bedrock không phải Anthropic (ví dụ `amazon.nova-*`) được phân giải thành không lưu giữ bộ nhớ đệm khi chạy, bất kể giá trị `cacheRetention` đã cấu hình.
- Các ARN hồ sơ suy luận ứng dụng Bedrock không trong suốt (ID hồ sơ không chứa `claude`) cũng được phân giải thành không lưu giữ bộ nhớ đệm trừ khi `cacheRetention` được đặt tường minh, vì không thể suy ra họ mô hình chỉ từ ARN.

### OpenRouter

Đối với các tham chiếu mô hình `openrouter/anthropic/*`, OpenClaw chèn các dấu `cache_control` của Anthropic vào các khối lời nhắc hệ thống/nhà phát triển, nhưng chỉ khi yêu cầu vẫn nhắm tới một tuyến OpenRouter đã xác minh (`openrouter` trên điểm cuối mặc định của tuyến đó hoặc bất kỳ nhà cung cấp/URL cơ sở nào phân giải thành `openrouter.ai`). Việc trỏ lại mô hình tới một URL proxy tùy ý tương thích với OpenAI sẽ dừng thao tác chèn này.

`contextPruning.mode: "cache-ttl"` được phép đối với các tham chiếu mô hình `openrouter/anthropic/*`, `openrouter/deepseek/*`, `openrouter/moonshot/*`, `openrouter/moonshotai/*` và `openrouter/zai/*`, vì các tuyến này xử lý bộ nhớ đệm lời nhắc ở phía nhà cung cấp mà không cần các dấu do OpenClaw chèn.

Nguồn: `extensions/openrouter/index.ts` (`OPENROUTER_CACHE_TTL_MODEL_PREFIXES`).

Việc tạo bộ nhớ đệm DeepSeek trên OpenRouter được thực hiện theo khả năng tối đa và có thể mất vài giây; một yêu cầu tiếp nối ngay lập tức vẫn có thể hiển thị `cached_tokens: 0`. Hãy xác minh bằng một yêu cầu lặp lại có cùng tiền tố sau một khoảng trễ ngắn, sử dụng `usage.prompt_tokens_details.cached_tokens` làm tín hiệu truy cập trúng bộ nhớ đệm.

### Google Gemini (API trực tiếp)

- Phương thức truyền tải Gemini trực tiếp (`api: "google-generative-ai"`) báo cáo lượt truy cập trúng bộ nhớ đệm thông qua `cachedContentTokenCount` thượng nguồn, được ánh xạ thành `cacheRead`.
- Các họ mô hình đủ điều kiện: `gemini-2.5*` và `gemini-3*` (không bao gồm các biến thể Live/xem trước nằm ngoài phép khớp tiền tố đó, ví dụ `gemini-live-2.5-flash-preview`).
- Khi `cacheRetention` được đặt trên một mô hình đủ điều kiện, OpenClaw tự động tạo, tái sử dụng và làm mới tài nguyên `cachedContents` cho lời nhắc hệ thống — không cần tay cầm nội dung được lưu vào bộ nhớ đệm thủ công. TTL là `300s` cho `cacheRetention: "short"` và `3600s` cho `"long"`.
- Bạn vẫn có thể truyền trực tiếp một tay cầm nội dung được lưu vào bộ nhớ đệm Gemini có sẵn dưới dạng `params.cachedContent` (hoặc `params.cached_content` cũ); một tay cầm tường minh sẽ bỏ qua hoàn toàn đường dẫn quản lý bộ nhớ đệm tự động.
- Cơ chế này tách biệt với bộ nhớ đệm tiền tố lời nhắc của Anthropic/OpenAI: OpenClaw quản lý một tài nguyên `cachedContents` gốc của nhà cung cấp cho Gemini thay vì chèn các dấu bộ nhớ đệm nội tuyến.

Nguồn: `src/agents/embedded-agent-runner/google-prompt-cache.ts`.

### Nhà cung cấp qua bộ khung CLI (Claude Code, Gemini CLI)

Các phần phụ trợ CLI phát ra sự kiện mức sử dụng JSONL (`jsonlDialect: "claude-stream-json"` hoặc `"gemini-stream-json"`) đi qua một trình phân tích mức sử dụng dùng chung, có khả năng nhận diện nhiều biến thể tên trường, bao gồm bộ đếm `cached` thuần túy được ánh xạ thành `cacheRead`. Khi tải trọng JSON của CLI không có trường token đầu vào trực tiếp, OpenClaw suy ra trường đó dưới dạng `input_tokens - cached`. Đây chỉ là bước chuẩn hóa mức sử dụng — nó không tạo các dấu bộ nhớ đệm lời nhắc kiểu Anthropic/OpenAI cho các mô hình được điều khiển bằng CLI này.

Nguồn: `src/agents/cli-output.ts` (`toCliUsage`).

### Các nhà cung cấp khác

Nếu một nhà cung cấp không hỗ trợ bất kỳ chế độ bộ nhớ đệm nào nêu trên, `cacheRetention` không có tác dụng.

## Ranh giới bộ nhớ đệm của lời nhắc hệ thống

OpenClaw chia lời nhắc hệ thống thành một **tiền tố ổn định** và một **hậu tố biến động** tại ranh giới tiền tố bộ nhớ đệm nội bộ. Nội dung phía trên ranh giới (định nghĩa công cụ, siêu dữ liệu Skills, tệp không gian làm việc) được sắp xếp để giữ nguyên từng byte qua các lượt. Nội dung phía dưới ranh giới (ví dụ `HEARTBEAT.md`, dấu thời gian khi chạy, siêu dữ liệu khác theo từng lượt) có thể thay đổi mà không làm mất hiệu lực tiền tố đã lưu vào bộ nhớ đệm.

Các lựa chọn thiết kế chính:

- Các tệp ngữ cảnh dự án ổn định trong không gian làm việc được sắp xếp trước `HEARTBEAT.md` để sự biến động của Heartbeat không làm mất hiệu lực tiền tố ổn định.
- Ranh giới được áp dụng xuyên suốt quá trình định hình phương thức truyền tải của họ Anthropic, họ OpenAI, Google và CLI, nhờ đó tất cả nhà cung cấp được hỗ trợ đều hưởng lợi từ cùng một mức ổn định tiền tố.
- Các yêu cầu Codex Responses và Anthropic Vertex được định tuyến qua cơ chế định hình bộ nhớ đệm có nhận biết ranh giới để việc tái sử dụng bộ nhớ đệm luôn khớp với nội dung mà nhà cung cấp thực sự nhận được.
- Dấu vân tay của lời nhắc hệ thống được chuẩn hóa (khoảng trắng, kết thúc dòng, ngữ cảnh do hook thêm vào, thứ tự khả năng khi chạy) để các lời nhắc không thay đổi về mặt ngữ nghĩa dùng chung bộ nhớ đệm qua các lượt.

Nếu thấy `cacheWrite` tăng đột biến ngoài dự kiến sau khi thay đổi cấu hình hoặc không gian làm việc, hãy kiểm tra xem thay đổi đó nằm trên hay dưới ranh giới bộ nhớ đệm. Việc chuyển nội dung biến động xuống dưới ranh giới (hoặc ổn định hóa nội dung đó) thường giải quyết được vấn đề.

## Các biện pháp bảo vệ độ ổn định bộ nhớ đệm của OpenClaw

- Danh mục công cụ MCP đi kèm được sắp xếp theo cách xác định (theo tên máy chủ, sau đó theo tên công cụ) trước khi đăng ký công cụ, để các thay đổi thứ tự `listTools()` không làm biến động khối công cụ và mất hiệu lực các tiền tố bộ nhớ đệm lời nhắc.
- Các phiên cũ có khối hình ảnh được lưu giữ nguyên vẹn **3 lượt hoàn tất gần nhất** (tính tất cả lượt hoàn tất, không chỉ các lượt chứa hình ảnh). Các khối hình ảnh cũ hơn đã được xử lý sẽ được thay bằng dấu văn bản để các lượt tiếp nối có nhiều hình ảnh không liên tục gửi lại tải trọng cũ có kích thước lớn.

## Mẫu tinh chỉnh

### Lưu lượng hỗn hợp (mặc định được khuyến nghị)

Duy trì đường cơ sở dài hạn trên tác tử chính và vô hiệu hóa bộ nhớ đệm trên các tác tử thông báo có lưu lượng bùng phát:

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

- Đặt `cacheRetention: "short"` cho đường cơ sở.
- Bật `contextPruning.mode: "cache-ttl"`.
- Chỉ giữ Heartbeat thấp hơn TTL cho các tác tử hưởng lợi từ bộ nhớ đệm được giữ ấm.

## Kiểm thử hồi quy trực tiếp

OpenClaw chạy một cổng hồi quy bộ nhớ đệm trực tiếp kết hợp, bao phủ tiền tố lặp lại, lượt công cụ, lượt hình ảnh, bản ghi hội thoại công cụ kiểu MCP và một trường hợp đối chứng không dùng bộ nhớ đệm của Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-runner.ts`
- `src/agents/live-cache-regression-baseline.ts`

Chạy bằng:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Tệp cơ sở lưu trữ các số liệu trực tiếp được quan sát gần đây nhất cùng với các ngưỡng sàn hồi quy dành riêng cho từng nhà cung cấp mà bài kiểm thử dùng để đối chiếu. Mỗi lần chạy sử dụng ID phiên và không gian tên lời nhắc mới riêng cho lần chạy đó, để trạng thái bộ nhớ đệm trước đây không làm sai lệch mẫu hiện tại. Anthropic và OpenAI áp dụng cơ chế thực thi khác nhau: việc không đạt ngưỡng sàn của Anthropic là một hồi quy nghiêm trọng (bài kiểm thử thất bại), còn việc không đạt ngưỡng sàn của OpenAI chỉ dùng để theo dõi (được ghi lại dưới dạng cảnh báo và không làm lần chạy thất bại). Chúng không dùng chung một ngưỡng duy nhất xuyên nhà cung cấp.

### Kỳ vọng trực tiếp đối với Anthropic

- Kỳ vọng các lần ghi khởi động rõ ràng qua `cacheWrite`.
- Kỳ vọng tái sử dụng gần như toàn bộ lịch sử ở các lượt lặp lại, vì cơ chế kiểm soát bộ nhớ đệm của Anthropic dịch chuyển điểm ngắt bộ nhớ đệm xuyên suốt cuộc hội thoại.
- Các ngưỡng sàn cơ sở cho luồng ổn định, công cụ, hình ảnh và kiểu MCP là các cổng kiểm soát hồi quy nghiêm ngặt.

### Kỳ vọng trực tiếp đối với OpenAI

- Chỉ kỳ vọng `cacheRead`; `cacheWrite` vẫn là `0` trên Chat Completions.
- Xem việc tái sử dụng bộ nhớ đệm ở các lượt lặp lại như một mức ổn định dành riêng cho nhà cung cấp, không phải kiểu tái sử dụng toàn bộ lịch sử dịch chuyển như Anthropic.
- Các ngưỡng sàn chỉ dùng để theo dõi (trường hợp không đạt được ghi dưới dạng cảnh báo, không phải lỗi kiểm thử), được suy ra từ hành vi trực tiếp quan sát được trên `gpt-5.4-mini`:

| Kịch bản             | Ngưỡng sàn `cacheRead` | Ngưỡng sàn tỷ lệ trúng |
| -------------------- | ----------------: | -------------: |
| Tiền tố ổn định        |             4,608 |           0.90 |
| Bản ghi công cụ      |             4,096 |           0.85 |
| Bản ghi hình ảnh     |             3,840 |           0.82 |
| Bản ghi kiểu MCP |             4,096 |           0.85 |

Các số liệu cơ sở được quan sát gần đây nhất (từ `live-cache-regression-baseline.ts`) đạt: tiền tố ổn định `cacheRead=4864`, tỷ lệ trúng `0.966`; bản ghi công cụ `cacheRead=4608`, tỷ lệ trúng `0.896`; bản ghi hình ảnh `cacheRead=4864`, tỷ lệ trúng `0.954`; bản ghi kiểu MCP `cacheRead=4608`, tỷ lệ trúng `0.891`.

Lý do các xác nhận khác nhau: Anthropic cung cấp các điểm ngắt bộ nhớ đệm rõ ràng và khả năng tái sử dụng lịch sử hội thoại dịch chuyển, còn tiền tố có thể tái sử dụng hiệu quả của OpenAI trong lưu lượng trực tiếp có thể đạt mức ổn định trước khi bao phủ toàn bộ lời nhắc. Việc so sánh hai nhà cung cấp theo một ngưỡng tỷ lệ phần trăm duy nhất xuyên nhà cung cấp sẽ tạo ra các hồi quy giả.

## Cấu hình `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # không bắt buộc
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
| `OPENCLAW_CACHE_TRACE_MESSAGES=0\|1` | Bật/tắt việc thu thập toàn bộ tải trọng thông báo |
| `OPENCLAW_CACHE_TRACE_PROMPT=0\|1`   | Bật/tắt việc thu thập văn bản lời nhắc          |
| `OPENCLAW_CACHE_TRACE_SYSTEM=0\|1`   | Bật/tắt việc thu thập lời nhắc hệ thống        |

### Nội dung cần kiểm tra

- Các sự kiện theo dõi bộ nhớ đệm có định dạng JSONL với các ảnh chụp nhanh theo giai đoạn như `session:loaded`, `prompt:before`, `stream:context` và `session:after`.
- Tác động của token bộ nhớ đệm theo từng lượt hiển thị trên các giao diện sử dụng thông thường: `cacheRead` và `cacheWrite` xuất hiện trong `/usage tokens`, `/status`, bản tóm tắt mức sử dụng phiên và bố cục `messages.usageTemplate` tùy chỉnh.
- Đối với Anthropic, kỳ vọng cả `cacheRead` và `cacheWrite` khi bộ nhớ đệm đang hoạt động.
- Đối với OpenAI, kỳ vọng `cacheRead` khi trúng bộ nhớ đệm; `cacheWrite` chỉ được điền trong các tải trọng Responses API có chứa trường này (xem [OpenAI](#openai-direct-api) ở trên).
- OpenAI cũng trả về các tiêu đề theo dõi và giới hạn tốc độ như `x-request-id`, `openai-processing-ms` và `x-ratelimit-*`; hãy dùng chúng để theo dõi yêu cầu, nhưng việc tính toán lượt trúng bộ nhớ đệm vẫn phải dựa trên tải trọng mức sử dụng, không phải các tiêu đề.

## Khắc phục sự cố nhanh

- **`cacheWrite` cao ở hầu hết các lượt**: kiểm tra các đầu vào lời nhắc hệ thống hay thay đổi; xác minh mô hình/nhà cung cấp hỗ trợ các thiết lập bộ nhớ đệm của bạn.
- **`cacheWrite` cao trên Anthropic**: thường có nghĩa là điểm ngắt bộ nhớ đệm nằm trên nội dung thay đổi theo từng yêu cầu.
- **`cacheRead` của OpenAI thấp**: xác minh tiền tố ổn định nằm ở đầu, tiền tố lặp lại có ít nhất 1024 token và cùng một `prompt_cache_key` được tái sử dụng cho các lượt cần dùng chung bộ nhớ đệm.
- **`cacheRetention` không có tác dụng**: xác nhận khóa mô hình khớp với `agents.defaults.models["provider/model"]`.
- **Các yêu cầu Bedrock Nova có thiết lập bộ nhớ đệm**: đây là hành vi dự kiến — khi chạy, chúng được phân giải thành không lưu giữ bộ nhớ đệm.

Tài liệu liên quan:

- [Anthropic](/vi/providers/anthropic)
- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Cắt tỉa phiên](/vi/concepts/session-pruning)
- [Tham chiếu cấu hình Gateway](/vi/gateway/configuration-reference)

## Liên quan

- [Mức sử dụng token và chi phí](/vi/reference/token-use)
- [Mức sử dụng API và chi phí](/vi/reference/api-usage-costs)
