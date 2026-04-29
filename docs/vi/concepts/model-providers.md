---
read_when:
    - Bạn cần một tài liệu tham chiếu về thiết lập mô hình theo từng nhà cung cấp
    - Bạn muốn các cấu hình mẫu hoặc lệnh CLI để thiết lập ban đầu cho các nhà cung cấp mô hình
sidebarTitle: Model providers
summary: Tổng quan về nhà cung cấp mô hình với các cấu hình mẫu + luồng CLI
title: Nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-04-29T22:38:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3902194674d6d4e17a8477c28addb39b8e04c3b498eb6a0305e82c2f1b5d737e
    source_path: concepts/model-providers.md
    workflow: 16
---

Tài liệu tham khảo cho **nhà cung cấp LLM/mô hình** (không phải các kênh trò chuyện như WhatsApp/Telegram). Để biết quy tắc chọn mô hình, xem [Mô hình](/vi/concepts/models).

## Quy tắc nhanh

<AccordionGroup>
  <Accordion title="Tham chiếu mô hình và trình trợ giúp CLI">
    - Tham chiếu mô hình dùng `provider/model` (ví dụ: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` đóng vai trò là danh sách cho phép khi được đặt.
    - Trình trợ giúp CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` đặt mặc định cấp nhà cung cấp; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` ghi đè chúng theo từng mô hình.
    - Quy tắc dự phòng, kiểm tra thời gian hồi và duy trì ghi đè phiên: [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

  </Accordion>
  <Accordion title="Phân tách nhà cung cấp/thời gian chạy OpenAI">
    Các tuyến thuộc họ OpenAI phụ thuộc vào tiền tố cụ thể:

    - `openai/<model>` dùng nhà cung cấp khóa API OpenAI trực tiếp trong PI.
    - `openai-codex/<model>` dùng Codex OAuth trong PI.
    - `openai/<model>` cộng với `agents.defaults.agentRuntime.id: "codex"` dùng bộ harness máy chủ ứng dụng Codex gốc.

    Xem [OpenAI](/vi/providers/openai) và [harness Codex](/vi/plugins/codex-harness). Nếu việc phân tách nhà cung cấp/thời gian chạy gây nhầm lẫn, hãy đọc [Thời gian chạy tác nhân](/vi/concepts/agent-runtimes) trước.

    Tự động bật Plugin tuân theo cùng ranh giới: `openai-codex/<model>` thuộc về Plugin OpenAI, trong khi Plugin Codex được bật bởi `agentRuntime.id: "codex"` hoặc các tham chiếu `codex/<model>` cũ.

    GPT-5.5 có sẵn qua `openai/gpt-5.5` cho lưu lượng dùng khóa API trực tiếp, `openai-codex/gpt-5.5` trong PI cho Codex OAuth, và bộ harness máy chủ ứng dụng Codex gốc khi `agentRuntime.id: "codex"` được đặt.

  </Accordion>
  <Accordion title="Thời gian chạy CLI">
    Thời gian chạy CLI dùng cùng cách phân tách: chọn các tham chiếu mô hình chuẩn như `anthropic/claude-*`, `google/gemini-*`, hoặc `openai/gpt-*`, rồi đặt `agents.defaults.agentRuntime.id` thành `claude-cli`, `google-gemini-cli`, hoặc `codex-cli` khi bạn muốn một backend CLI cục bộ.

    Các tham chiếu `claude-cli/*`, `google-gemini-cli/*`, và `codex-cli/*` cũ sẽ được di chuyển trở lại thành tham chiếu nhà cung cấp chuẩn, với thời gian chạy được ghi riêng.

  </Accordion>
</AccordionGroup>

## Hành vi nhà cung cấp do Plugin sở hữu

Hầu hết logic dành riêng cho từng nhà cung cấp nằm trong các Plugin nhà cung cấp (`registerProvider(...)`) trong khi OpenClaw giữ vòng lặp suy luận chung. Plugin sở hữu quá trình thiết lập ban đầu, danh mục mô hình, ánh xạ biến môi trường xác thực, chuẩn hóa vận chuyển/cấu hình, dọn dẹp schema công cụ, phân loại chuyển đổi dự phòng, làm mới OAuth, báo cáo mức sử dụng, hồ sơ suy nghĩ/lập luận, v.v.

Danh sách đầy đủ các hook SDK nhà cung cấp và ví dụ Plugin đi kèm nằm trong [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins). Một nhà cung cấp cần bộ thực thi yêu cầu hoàn toàn tùy chỉnh là một bề mặt mở rộng riêng và sâu hơn.

<Note>
Hành vi runner do nhà cung cấp sở hữu nằm trên các hook nhà cung cấp rõ ràng như chính sách phát lại, chuẩn hóa schema công cụ, bọc luồng và trình trợ giúp vận chuyển/yêu cầu. Túi tĩnh `ProviderPlugin.capabilities` cũ chỉ để tương thích và không còn được logic runner dùng chung đọc.
</Note>

## Xoay vòng khóa API

<AccordionGroup>
  <Accordion title="Nguồn khóa và mức ưu tiên">
    Cấu hình nhiều khóa qua:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè trực tiếp đơn lẻ, ưu tiên cao nhất)
    - `<PROVIDER>_API_KEYS` (danh sách phân tách bằng dấu phẩy hoặc dấu chấm phẩy)
    - `<PROVIDER>_API_KEY` (khóa chính)
    - `<PROVIDER>_API_KEY_*` (danh sách đánh số, ví dụ `<PROVIDER>_API_KEY_1`)

    Đối với nhà cung cấp Google, `GOOGLE_API_KEY` cũng được bao gồm làm dự phòng. Thứ tự chọn khóa giữ nguyên mức ưu tiên và loại bỏ giá trị trùng lặp.

  </Accordion>
  <Accordion title="Khi nào xoay vòng được kích hoạt">
    - Yêu cầu chỉ được thử lại với khóa tiếp theo khi có phản hồi giới hạn tốc độ (ví dụ `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, hoặc thông báo giới hạn mức sử dụng định kỳ).
    - Lỗi không phải giới hạn tốc độ sẽ thất bại ngay lập tức; không thử xoay vòng khóa.
    - Khi tất cả khóa ứng viên đều thất bại, lỗi cuối cùng được trả về từ lần thử cuối.

  </Accordion>
</AccordionGroup>

## Nhà cung cấp tích hợp sẵn (danh mục pi-ai)

OpenClaw đi kèm danh mục pi‑ai. Các nhà cung cấp này **không** yêu cầu cấu hình `models.providers`; chỉ cần đặt xác thực và chọn một mô hình.

### OpenAI

- Nhà cung cấp: `openai`
- Xác thực: `OPENAI_API_KEY`
- Xoay vòng tùy chọn: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, cộng với `OPENCLAW_LIVE_OPENAI_KEY` (ghi đè đơn)
- Mô hình ví dụ: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Xác minh tài khoản/tính khả dụng của mô hình bằng `openclaw models list --provider openai` nếu một bản cài đặt hoặc khóa API cụ thể hoạt động khác đi.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport mặc định là `auto` (ưu tiên WebSocket, dự phòng SSE)
- Ghi đè theo từng mô hình qua `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- Khởi động sẵn OpenAI Responses WebSocket mặc định được bật qua `params.openaiWsWarmup` (`true`/`false`)
- Có thể bật xử lý ưu tiên của OpenAI qua `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` và `params.fastMode` ánh xạ các yêu cầu Responses trực tiếp `openai/*` sang `service_tier=priority` trên `api.openai.com`
- Dùng `params.serviceTier` khi bạn muốn một tầng rõ ràng thay vì công tắc `/fast` dùng chung
- Các header quy thuộc OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ áp dụng trên lưu lượng OpenAI gốc tới `api.openai.com`, không áp dụng cho proxy tương thích OpenAI chung
- Các tuyến OpenAI gốc cũng giữ Responses `store`, gợi ý prompt-cache, và định dạng payload tương thích reasoning của OpenAI; các tuyến proxy thì không
- `openai/gpt-5.3-codex-spark` được cố ý ẩn trong OpenClaw vì các yêu cầu OpenAI API trực tiếp từ chối nó và catalog Codex hiện tại không hiển thị nó

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Nhà cung cấp: `anthropic`
- Xác thực: `ANTHROPIC_API_KEY`
- Xoay vòng tùy chọn: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, cộng với `OPENCLAW_LIVE_ANTHROPIC_KEY` (ghi đè đơn)
- Mô hình ví dụ: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Các yêu cầu Anthropic công khai trực tiếp hỗ trợ công tắc `/fast` dùng chung và `params.fastMode`, bao gồm lưu lượng dùng khóa API và OAuth gửi tới `api.anthropic.com`; OpenClaw ánh xạ phần đó sang `service_tier` của Anthropic (`auto` so với `standard_only`)
- Cấu hình Claude CLI ưu tiên giữ tham chiếu mô hình ở dạng chuẩn và chọn backend CLI riêng: `anthropic/claude-opus-4-7` với `agents.defaults.agentRuntime.id: "claude-cli"`. Các tham chiếu cũ `claude-cli/claude-opus-4-7` vẫn hoạt động để tương thích.

<Note>
Nhân viên Anthropic đã cho chúng tôi biết việc sử dụng Claude CLI kiểu OpenClaw lại được cho phép, nên OpenClaw xem việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic công bố chính sách mới. Anthropic setup-token vẫn có sẵn dưới dạng đường dẫn token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có sẵn.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Nhà cung cấp: `openai-codex`
- Xác thực: OAuth (ChatGPT)
- Tham chiếu mô hình PI: `openai-codex/gpt-5.5`
- Tham chiếu harness app-server Codex gốc: `openai/gpt-5.5` với `agents.defaults.agentRuntime.id: "codex"`
- Tài liệu harness app-server Codex gốc: [Harness Codex](/vi/plugins/codex-harness)
- Tham chiếu mô hình cũ: `codex/gpt-*`
- Ranh giới Plugin: `openai-codex/*` tải Plugin OpenAI; Plugin app-server Codex gốc chỉ được chọn bởi runtime harness Codex hoặc các tham chiếu cũ `codex/*`.
- CLI: `openclaw onboard --auth-choice openai-codex` hoặc `openclaw models auth login --provider openai-codex`
- Transport mặc định là `auto` (ưu tiên WebSocket, dự phòng SSE)
- Ghi đè theo từng mô hình PI qua `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- `params.serviceTier` cũng được chuyển tiếp trên các yêu cầu Codex Responses gốc (`chatgpt.com/backend-api`)
- Các header quy thuộc OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ được đính kèm trên lưu lượng Codex gốc tới `chatgpt.com/backend-api`, không áp dụng cho proxy tương thích OpenAI chung
- Chia sẻ cùng cấu hình công tắc `/fast` và `params.fastMode` như `openai/*` trực tiếp; OpenClaw ánh xạ phần đó sang `service_tier=priority`
- `openai-codex/gpt-5.5` dùng `contextWindow = 400000` gốc từ catalog Codex và runtime mặc định `contextTokens = 272000`; ghi đè giới hạn runtime bằng `models.providers.openai-codex.models[].contextTokens`
- Ghi chú chính sách: OpenAI Codex OAuth được hỗ trợ rõ ràng cho các công cụ/quy trình làm việc bên ngoài như OpenClaw.
- Dùng `openai-codex/gpt-5.5` khi bạn muốn tuyến Codex OAuth/gói đăng ký; dùng `openai/gpt-5.5` khi thiết lập khóa API và catalog cục bộ của bạn hiển thị tuyến API công khai.

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Các tùy chọn hosted kiểu gói đăng ký khác

<CardGroup cols={3}>
  <Card title="GLM models" href="/vi/providers/glm">
    Z.AI Coding Plan hoặc các endpoint API chung.
  </Card>
  <Card title="MiniMax" href="/vi/providers/minimax">
    OAuth MiniMax Coding Plan hoặc quyền truy cập bằng khóa API.
  </Card>
  <Card title="Qwen Cloud" href="/vi/providers/qwen">
    Bề mặt nhà cung cấp Qwen Cloud cộng với ánh xạ endpoint Alibaba DashScope và Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Xác thực: `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`)
- Nhà cung cấp runtime Zen: `opencode`
- Nhà cung cấp runtime Go: `opencode-go`
- Mô hình ví dụ: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` hoặc `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (khóa API)

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY`
- Xoay vòng tùy chọn: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, dự phòng `GOOGLE_API_KEY`, và `OPENCLAW_LIVE_GEMINI_KEY` (ghi đè đơn)
- Mô hình ví dụ: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Tương thích: cấu hình OpenClaw cũ dùng `google/gemini-3.1-flash-preview` được chuẩn hóa thành `google/gemini-3-flash-preview`
- Bí danh: `google/gemini-3.1-pro` được chấp nhận và chuẩn hóa thành id Gemini API trực tiếp của Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` dùng thinking động của Google. Gemini 3/3.1 bỏ qua `thinkingLevel` cố định; Gemini 2.5 gửi `thinkingBudget: -1`.
- Các lượt chạy Gemini trực tiếp cũng chấp nhận `agents.defaults.models["google/<model>"].params.cachedContent` (hoặc `cached_content` cũ) để chuyển tiếp handle `cachedContents/...` gốc của nhà cung cấp; các lần trúng cache Gemini hiển thị dưới dạng OpenClaw `cacheRead`

### Google Vertex và Gemini CLI

- Nhà cung cấp: `google-vertex`, `google-gemini-cli`
- Xác thực: Vertex dùng gcloud ADC; Gemini CLI dùng luồng OAuth của nó

<Warning>
Gemini CLI OAuth trong OpenClaw là một tích hợp không chính thức. Một số người dùng đã báo cáo các hạn chế tài khoản Google sau khi dùng client bên thứ ba. Hãy xem lại điều khoản của Google và dùng một tài khoản không quan trọng nếu bạn chọn tiếp tục.
</Warning>

Gemini CLI OAuth được phân phối như một phần của Plugin `google` đi kèm.

<Steps>
  <Step title="Install Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="Enable plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Login">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Mô hình mặc định: `google-gemini-cli/gemini-3-flash-preview`. Bạn **không** dán client id hoặc secret vào `openclaw.json`. Luồng đăng nhập CLI lưu token trong auth profile trên máy chủ Gateway.

  </Step>
  <Step title="Set project (if needed)">
    Nếu yêu cầu thất bại sau khi đăng nhập, hãy đặt `GOOGLE_CLOUD_PROJECT` hoặc `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ Gateway.
  </Step>
</Steps>

Phản hồi JSON của Gemini CLI được phân tích từ `response`; usage dự phòng về `stats`, với `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.

### Z.AI (GLM)

- Nhà cung cấp: `zai`
- Xác thực: `ZAI_API_KEY`
- Mô hình ví dụ: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Bí danh: `z.ai/*` và `z-ai/*` chuẩn hóa thành `zai/*`
  - `zai-api-key` tự động phát hiện endpoint Z.AI phù hợp; `zai-coding-global`, `zai-coding-cn`, `zai-global`, và `zai-cn` buộc dùng một surface cụ thể

### Vercel AI Gateway

- Nhà cung cấp: `vercel-ai-gateway`
- Xác thực: `AI_GATEWAY_API_KEY`
- Mô hình ví dụ: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Nhà cung cấp: `kilocode`
- Xác thực: `KILOCODE_API_KEY`
- Mô hình ví dụ: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- URL cơ sở: `https://api.kilo.ai/api/gateway/`
- Danh mục dự phòng tĩnh kèm theo `kilocode/kilo/auto`; cơ chế khám phá live `https://api.kilo.ai/api/gateway/models` có thể mở rộng thêm danh mục runtime.
- Định tuyến upstream chính xác phía sau `kilocode/kilo/auto` thuộc sở hữu của Kilo Gateway, không được hard-code trong OpenClaw.

Xem [/providers/kilocode](/vi/providers/kilocode) để biết chi tiết thiết lập.

### Các Plugin nhà cung cấp được đóng gói kèm khác

| Nhà cung cấp            | Id                               | Env xác thực                                                 | Mô hình ví dụ                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN`                      | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` hoặc `KIMICODE_API_KEY`                       | `kimi/kimi-code`                              |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                  |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Những điểm đặc thù cần biết

<AccordionGroup>
  <Accordion title="OpenRouter">
    Chỉ áp dụng header ghi nhận ứng dụng và marker Anthropic `cache_control` trên các route `openrouter.ai` đã xác minh. Các ref DeepSeek, Moonshot và ZAI đủ điều kiện cache-TTL cho prompt caching do OpenRouter quản lý nhưng không nhận marker cache Anthropic. Là một đường dẫn tương thích OpenAI kiểu proxy, nó bỏ qua shaping chỉ dành cho OpenAI gốc (`serviceTier`, Responses `store`, gợi ý prompt-cache, tương thích reasoning OpenAI). Các ref dựa trên Gemini chỉ giữ phần vệ sinh thought-signature proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Các ref dựa trên Gemini đi theo cùng đường dẫn vệ sinh proxy-Gemini; `kilocode/kilo/auto` và các ref khác không hỗ trợ proxy-reasoning sẽ bỏ qua việc chèn proxy reasoning.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding bằng API-key ghi các định nghĩa mô hình chat M2.7 chỉ văn bản rõ ràng; khả năng hiểu hình ảnh vẫn nằm trên media provider `MiniMax-VL-01` do Plugin sở hữu.
  </Accordion>
  <Accordion title="NVIDIA">
    Model id dùng namespace `nvidia/<vendor>/<model>` (ví dụ `nvidia/nvidia/nemotron-...` cùng với `nvidia/moonshotai/kimi-k2.5`); picker giữ nguyên thành phần chữ của `<provider>/<model-id>` trong khi khóa canonical gửi tới API vẫn chỉ có một tiền tố.
  </Accordion>
  <Accordion title="xAI">
    Dùng đường dẫn xAI Responses. `/fast` hoặc `params.fastMode: true` viết lại `grok-3`, `grok-3-mini`, `grok-4`, và `grok-4-0709` thành các biến thể `*-fast` tương ứng. `tool_stream` bật theo mặc định; tắt qua `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Được phân phối dưới dạng Plugin nhà cung cấp `cerebras` đóng gói kèm. GLM dùng `zai-glm-4.7`; URL cơ sở tương thích OpenAI là `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp qua `models.providers` (custom/base URL)

Dùng `models.providers` (hoặc `models.json`) để thêm nhà cung cấp **tùy chỉnh** hoặc proxy tương thích OpenAI/Anthropic.

Nhiều Plugin nhà cung cấp đóng gói kèm bên dưới đã phát hành danh mục mặc định. Chỉ dùng các mục `models.providers.<id>` rõ ràng khi bạn muốn ghi đè URL cơ sở mặc định, header hoặc danh sách mô hình.

Các kiểm tra năng lực mô hình của Gateway cũng đọc metadata `models.providers.<id>.models[]` rõ ràng. Nếu mô hình tùy chỉnh hoặc proxy chấp nhận hình ảnh, hãy đặt `input: ["text", "image"]` trên mô hình đó để WebChat và các đường dẫn tệp đính kèm xuất phát từ node truyền hình ảnh dưới dạng đầu vào mô hình gốc thay vì ref media chỉ văn bản.

### Moonshot AI (Kimi)

Moonshot được phân phối dưới dạng Plugin nhà cung cấp đóng gói kèm. Mặc định hãy dùng nhà cung cấp tích hợp sẵn, và chỉ thêm mục `models.providers.moonshot` rõ ràng khi bạn cần ghi đè URL cơ sở hoặc metadata mô hình:

- Nhà cung cấp: `moonshot`
- Xác thực: `MOONSHOT_API_KEY`
- Mô hình ví dụ: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`

Model ID Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Lập trình với Kimi

Kimi Coding sử dụng điểm cuối tương thích với Anthropic của Moonshot AI:

- Nhà cung cấp: `kimi`
- Xác thực: `KIMI_API_KEY`
- Mô hình ví dụ: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

`kimi/k2p5` cũ vẫn được chấp nhận làm id mô hình tương thích.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) cung cấp quyền truy cập vào Doubao và các mô hình khác tại Trung Quốc.

- Nhà cung cấp: `volcengine` (lập trình: `volcengine-plan`)
- Xác thực: `VOLCANO_ENGINE_API_KEY`
- Mô hình ví dụ: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Quy trình onboarding mặc định dùng bề mặt lập trình, nhưng danh mục `volcengine/*` chung cũng được đăng ký cùng lúc.

Trong các bộ chọn mô hình onboarding/configure, lựa chọn xác thực Volcengine ưu tiên cả các hàng `volcengine/*` và `volcengine-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ quay về danh mục chưa lọc thay vì hiển thị bộ chọn rỗng theo phạm vi nhà cung cấp.

<Tabs>
  <Tab title="Mô hình tiêu chuẩn">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Mô hình lập trình (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Quốc tế)

BytePlus ARK cung cấp quyền truy cập vào cùng các mô hình như Volcano Engine cho người dùng quốc tế.

- Nhà cung cấp: `byteplus` (lập trình: `byteplus-plan`)
- Xác thực: `BYTEPLUS_API_KEY`
- Mô hình ví dụ: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Quy trình onboarding mặc định dùng bề mặt lập trình, nhưng danh mục `byteplus/*` chung cũng được đăng ký cùng lúc.

Trong các bộ chọn mô hình khi onboarding/cấu hình, lựa chọn xác thực BytePlus ưu tiên cả các hàng `byteplus/*` và `byteplus-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ quay lại catalog chưa lọc thay vì hiển thị một bộ chọn trống bị giới hạn theo nhà cung cấp.

<Tabs>
  <Tab title="Mô hình tiêu chuẩn">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Mô hình lập trình (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic cung cấp các mô hình tương thích với Anthropic phía sau nhà cung cấp `synthetic`:

- Nhà cung cấp: `synthetic`
- Xác thực: `SYNTHETIC_API_KEY`
- Mô hình ví dụ: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax được cấu hình qua `models.providers` vì dùng các endpoint tùy chỉnh:

- MiniMax OAuth (Toàn cầu): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Khóa API MiniMax (Toàn cầu): `--auth-choice minimax-global-api`
- Khóa API MiniMax (CN): `--auth-choice minimax-cn-api`
- Xác thực: `MINIMAX_API_KEY` cho `minimax`; `MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY` cho `minimax-portal`

Xem [/providers/minimax](/vi/providers/minimax) để biết chi tiết thiết lập, tùy chọn mô hình và đoạn cấu hình.

<Note>
Trên đường dẫn streaming tương thích Anthropic của MiniMax, OpenClaw tắt chế độ thinking theo mặc định trừ khi bạn đặt rõ ràng, và `/fast on` sẽ ghi lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
</Note>

Phân tách capability do Plugin sở hữu:

- Mặc định văn bản/chat vẫn dùng `minimax/MiniMax-M2.7`
- Tạo ảnh là `minimax/image-01` hoặc `minimax-portal/image-01`
- Hiểu ảnh là `MiniMax-VL-01` do Plugin sở hữu trên cả hai đường dẫn xác thực MiniMax
- Tìm kiếm web vẫn dùng ID nhà cung cấp `minimax`

### LM Studio

LM Studio được phát hành dưới dạng Plugin nhà cung cấp đi kèm, dùng API native:

- Nhà cung cấp: `lmstudio`
- Xác thực: `LM_API_TOKEN`
- URL cơ sở suy luận mặc định: `http://localhost:1234/v1`

Sau đó đặt một mô hình (thay bằng một trong các ID do `http://localhost:1234/api/v1/models` trả về):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw dùng `/api/v1/models` và `/api/v1/models/load` native của LM Studio để khám phá + tự động tải, với `/v1/chat/completions` cho suy luận theo mặc định. Xem [/providers/lmstudio](/vi/providers/lmstudio) để biết cách thiết lập và khắc phục sự cố.

### Ollama

Ollama được phát hành dưới dạng Plugin nhà cung cấp đi kèm và dùng API native của Ollama:

- Nhà cung cấp: `ollama`
- Xác thực: Không bắt buộc (máy chủ cục bộ)
- Mô hình ví dụ: `ollama/llama3.3`
- Cài đặt: [https://ollama.com/download](https://ollama.com/download)

```bash
# Install Ollama, then pull a model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama được phát hiện cục bộ tại `http://127.0.0.1:11434` khi bạn chọn tham gia bằng `OLLAMA_API_KEY`, và Plugin nhà cung cấp đi kèm thêm Ollama trực tiếp vào `openclaw onboard` và bộ chọn mô hình. Xem [/providers/ollama](/vi/providers/ollama) để biết về onboarding, chế độ cloud/cục bộ và cấu hình tùy chỉnh.

### vLLM

vLLM được phát hành dưới dạng Plugin nhà cung cấp đi kèm cho các máy chủ cục bộ/tự host tương thích OpenAI:

- Nhà cung cấp: `vllm`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:8000/v1`

Để chọn tham gia tự động khám phá cục bộ (giá trị bất kỳ đều được nếu máy chủ của bạn không bắt buộc xác thực):

```bash
export VLLM_API_KEY="vllm-local"
```

Sau đó đặt một mô hình (thay bằng một trong các ID do `/v1/models` trả về):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Xem [/providers/vllm](/vi/providers/vllm) để biết chi tiết.

### SGLang

SGLang được phát hành dưới dạng Plugin nhà cung cấp đi kèm cho các máy chủ tự host nhanh tương thích OpenAI:

- Nhà cung cấp: `sglang`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:30000/v1`

Để chọn tham gia tự động khám phá cục bộ (giá trị bất kỳ đều được nếu máy chủ của bạn không bắt buộc xác thực):

```bash
export SGLANG_API_KEY="sglang-local"
```

Sau đó đặt một mô hình (thay bằng một trong các ID do `/v1/models` trả về):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Xem [/providers/sglang](/vi/providers/sglang) để biết chi tiết.

### Proxy cục bộ (LM Studio, vLLM, LiteLLM, v.v.)

Ví dụ (tương thích OpenAI):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Trường tùy chọn mặc định">
    Với nhà cung cấp tùy chỉnh, `reasoning`, `input`, `cost`, `contextWindow` và `maxTokens` là tùy chọn. Khi bị bỏ qua, OpenClaw mặc định dùng:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Khuyến nghị: đặt các giá trị rõ ràng khớp với giới hạn proxy/mô hình của bạn.

  </Accordion>
  <Accordion title="Quy tắc định hình tuyến proxy">
    - Với `api: "openai-completions"` trên các endpoint không native (mọi `baseUrl` không rỗng có host không phải `api.openai.com`), OpenClaw ép `compat.supportsDeveloperRole: false` để tránh lỗi 400 từ nhà cung cấp đối với các vai trò `developer` không được hỗ trợ.
    - Các tuyến kiểu proxy tương thích OpenAI cũng bỏ qua định hình yêu cầu chỉ dành cho OpenAI native: không có `service_tier`, không có Responses `store`, không có Completions `store`, không có gợi ý prompt-cache, không có định hình payload tương thích reasoning của OpenAI, và không có header ghi nhận OpenClaw ẩn.
    - Với các proxy Completions tương thích OpenAI cần trường riêng theo nhà cung cấp, đặt `agents.defaults.models["provider/model"].params.extra_body` (hoặc `extraBody`) để hợp nhất JSON bổ sung vào thân yêu cầu gửi đi.
    - Với điều khiển chat-template của vLLM, đặt `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true` cho `vllm/nemotron-3-*` khi cấp độ thinking của phiên đang tắt.
    - Với các mô hình cục bộ chậm hoặc host LAN/tailnet từ xa, đặt `models.providers.<id>.timeoutSeconds`. Thiết lập này kéo dài xử lý yêu cầu HTTP của mô hình nhà cung cấp, bao gồm kết nối, header, streaming thân và hủy guarded-fetch tổng thể, mà không tăng timeout toàn bộ thời gian chạy agent.
    - Nếu `baseUrl` rỗng/bị bỏ qua, OpenClaw giữ hành vi OpenAI mặc định (phân giải tới `api.openai.com`).
    - Vì an toàn, `compat.supportsDeveloperRole: true` rõ ràng vẫn bị ghi đè trên các endpoint `openai-completions` không native.
    - Với `api: "anthropic-messages"` trên các endpoint không trực tiếp (mọi nhà cung cấp khác với `anthropic` chuẩn, hoặc `models.providers.anthropic.baseUrl` tùy chỉnh có host không phải endpoint `api.anthropic.com` công khai), OpenClaw loại bỏ các header beta Anthropic ngầm định như `claude-code-20250219`, `interleaved-thinking-2025-05-14` và marker OAuth, để các proxy tùy chỉnh tương thích Anthropic không từ chối các cờ beta không được hỗ trợ. Đặt rõ `models.providers.<id>.headers["anthropic-beta"]` nếu proxy của bạn cần các tính năng beta cụ thể.

  </Accordion>
</AccordionGroup>

## Ví dụ CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Xem thêm: [Cấu hình](/vi/gateway/configuration) để có các ví dụ cấu hình đầy đủ.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) — các khóa cấu hình mô hình
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) — chuỗi dự phòng và hành vi thử lại
- [Mô hình](/vi/concepts/models) — cấu hình mô hình và bí danh
- [Nhà cung cấp](/vi/providers) — hướng dẫn thiết lập theo từng nhà cung cấp
