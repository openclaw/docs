---
read_when:
    - Bạn cần tài liệu tham khảo về cách thiết lập mô hình theo từng nhà cung cấp
    - Bạn muốn các cấu hình mẫu hoặc lệnh CLI để thiết lập ban đầu cho các nhà cung cấp mô hình
sidebarTitle: Model providers
summary: Tổng quan về nhà cung cấp mô hình với cấu hình mẫu + luồng CLI
title: Nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-05-06T09:08:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8375caf4bacbb360e57637801d06a9d7898b36d440b82885d993b8248cd4daff
    source_path: concepts/model-providers.md
    workflow: 16
---

Tham khảo cho **nhà cung cấp LLM/mô hình** (không phải các kênh trò chuyện như WhatsApp/Telegram). Để biết quy tắc chọn mô hình, xem [Mô hình](/vi/concepts/models).

## Quy tắc nhanh

<AccordionGroup>
  <Accordion title="Tham chiếu mô hình và trình hỗ trợ CLI">
    - Tham chiếu mô hình dùng `provider/model` (ví dụ: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` hoạt động như danh sách cho phép khi được đặt.
    - Trình hỗ trợ CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` đặt mặc định cấp nhà cung cấp; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` ghi đè chúng theo từng mô hình.
    - Quy tắc dự phòng, thăm dò thời gian chờ, và lưu trữ ghi đè phiên: [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

  </Accordion>
  <Accordion title="Thêm xác thực nhà cung cấp không thay đổi mô hình chính của bạn">
    `openclaw configure` giữ nguyên `agents.defaults.model.primary` hiện có khi bạn thêm hoặc xác thực lại một nhà cung cấp. Plugin nhà cung cấp vẫn có thể trả về một mô hình mặc định được khuyến nghị trong bản vá cấu hình xác thực của chúng, nhưng configure xem điều đó là "làm cho mô hình này khả dụng" khi đã có mô hình chính, không phải "thay thế mô hình chính hiện tại."

    Để chủ động chuyển mô hình mặc định, dùng `openclaw models set <provider/model>` hoặc `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Tách nhà cung cấp/runtime OpenAI">
    Các tuyến thuộc họ OpenAI phụ thuộc vào tiền tố cụ thể:

    - `openai/<model>` cùng với `agents.defaults.agentRuntime.id: "codex"` dùng harness app-server Codex gốc. Đây là thiết lập đăng ký ChatGPT/Codex thông thường.
    - `openai-codex/<model>` dùng Codex OAuth trong PI.
    - `openai/<model>` không có ghi đè runtime Codex dùng nhà cung cấp khóa API OpenAI trực tiếp trong PI.

    Xem [OpenAI](/vi/providers/openai) và [Harness Codex](/vi/plugins/codex-harness). Nếu việc tách nhà cung cấp/runtime gây khó hiểu, hãy đọc [Runtime tác tử](/vi/concepts/agent-runtimes) trước.

    Tự động bật Plugin tuân theo cùng ranh giới: `openai-codex/<model>` thuộc về Plugin OpenAI, trong khi Plugin Codex được bật bởi `agentRuntime.id: "codex"` hoặc các tham chiếu `codex/<model>` cũ.

    GPT-5.5 khả dụng thông qua harness app-server Codex gốc khi đặt `agentRuntime.id: "codex"`, thông qua `openai-codex/gpt-5.5` trong PI cho Codex OAuth, và thông qua `openai/gpt-5.5` trong PI cho lưu lượng khóa API trực tiếp khi tài khoản của bạn cung cấp quyền đó.

  </Accordion>
  <Accordion title="Runtime CLI">
    Runtime CLI dùng cùng cách tách: chọn các tham chiếu mô hình chuẩn như `anthropic/claude-*`, `google/gemini-*`, hoặc `openai/gpt-*`, rồi đặt `agents.defaults.agentRuntime.id` thành `claude-cli`, `google-gemini-cli`, hoặc `codex-cli` khi bạn muốn một backend CLI cục bộ.

    Các tham chiếu cũ `claude-cli/*`, `google-gemini-cli/*`, và `codex-cli/*` được di chuyển trở lại thành tham chiếu nhà cung cấp chuẩn, với runtime được ghi riêng.

  </Accordion>
</AccordionGroup>

## Hành vi nhà cung cấp do Plugin sở hữu

Phần lớn logic đặc thù theo nhà cung cấp nằm trong các Plugin nhà cung cấp (`registerProvider(...)`) trong khi OpenClaw giữ vòng lặp suy luận chung. Plugin sở hữu onboarding, danh mục mô hình, ánh xạ biến môi trường xác thực, chuẩn hóa transport/cấu hình, dọn dẹp schema công cụ, phân loại chuyển đổi dự phòng, làm mới OAuth, báo cáo mức sử dụng, hồ sơ thinking/reasoning, và nhiều hơn nữa.

Danh sách đầy đủ các hook provider-SDK và ví dụ Plugin đi kèm nằm trong [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins). Một nhà cung cấp cần executor yêu cầu hoàn toàn tùy chỉnh là một bề mặt mở rộng riêng, sâu hơn.

<Note>
Hành vi runner do nhà cung cấp sở hữu nằm trên các hook nhà cung cấp tường minh như chính sách phát lại, chuẩn hóa schema công cụ, bọc luồng, và trình hỗ trợ transport/yêu cầu. Túi tĩnh `ProviderPlugin.capabilities` cũ chỉ dành cho tương thích và không còn được logic runner dùng chung đọc nữa.
</Note>

## Xoay vòng khóa API

<AccordionGroup>
  <Accordion title="Nguồn khóa và mức ưu tiên">
    Cấu hình nhiều khóa qua:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè live đơn, ưu tiên cao nhất)
    - `<PROVIDER>_API_KEYS` (danh sách phân tách bằng dấu phẩy hoặc dấu chấm phẩy)
    - `<PROVIDER>_API_KEY` (khóa chính)
    - `<PROVIDER>_API_KEY_*` (danh sách đánh số, ví dụ `<PROVIDER>_API_KEY_1`)

    Với nhà cung cấp Google, `GOOGLE_API_KEY` cũng được bao gồm làm dự phòng. Thứ tự chọn khóa giữ nguyên ưu tiên và loại bỏ giá trị trùng lặp.

  </Accordion>
  <Accordion title="Khi nào xoay vòng bắt đầu">
    - Yêu cầu chỉ được thử lại với khóa tiếp theo trên các phản hồi giới hạn tốc độ (ví dụ `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, hoặc các thông báo giới hạn mức sử dụng định kỳ).
    - Các lỗi không phải giới hạn tốc độ thất bại ngay; không thử xoay vòng khóa.
    - Khi tất cả khóa ứng viên đều thất bại, lỗi cuối cùng được trả về từ lần thử cuối.

  </Accordion>
</AccordionGroup>

## Nhà cung cấp tích hợp sẵn (danh mục pi-ai)

OpenClaw đi kèm danh mục pi-ai. Các nhà cung cấp này **không** yêu cầu cấu hình `models.providers`; chỉ cần đặt xác thực + chọn mô hình.

### OpenAI

- Nhà cung cấp: `openai`
- Xác thực: `OPENAI_API_KEY`
- Xoay vòng tùy chọn: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, cộng với `OPENCLAW_LIVE_OPENAI_KEY` (ghi đè đơn)
- Mô hình ví dụ: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Xác minh tính khả dụng của tài khoản/mô hình bằng `openclaw models list --provider openai` nếu một bản cài đặt hoặc khóa API cụ thể hoạt động khác.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport mặc định là `auto` (ưu tiên WebSocket, dự phòng SSE)
- Ghi đè theo từng mô hình qua `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- Khởi động trước WebSocket OpenAI Responses mặc định được bật qua `params.openaiWsWarmup` (`true`/`false`)
- Có thể bật xử lý ưu tiên OpenAI qua `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` và `params.fastMode` ánh xạ các yêu cầu Responses trực tiếp `openai/*` sang `service_tier=priority` trên `api.openai.com`
- Dùng `params.serviceTier` khi bạn muốn một tầng tường minh thay vì công tắc `/fast` dùng chung
- Các header quy thuộc OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ áp dụng trên lưu lượng OpenAI gốc tới `api.openai.com`, không áp dụng cho proxy tương thích OpenAI chung
- Các tuyến OpenAI gốc cũng giữ `store` của Responses, gợi ý prompt-cache, và định dạng payload tương thích reasoning của OpenAI; các tuyến proxy thì không
- `openai/gpt-5.3-codex-spark` bị ẩn có chủ ý trong OpenClaw vì yêu cầu API OpenAI live từ chối nó và danh mục Codex hiện tại không cung cấp nó

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
- Các yêu cầu Anthropic công khai trực tiếp hỗ trợ công tắc `/fast` dùng chung và `params.fastMode`, bao gồm lưu lượng được xác thực bằng khóa API và OAuth gửi tới `api.anthropic.com`; OpenClaw ánh xạ điều đó sang `service_tier` của Anthropic (`auto` so với `standard_only`)
- Cấu hình Claude CLI được ưu tiên giữ tham chiếu mô hình chuẩn và chọn backend CLI riêng: `anthropic/claude-opus-4-7` với `agents.defaults.agentRuntime.id: "claude-cli"`. Các tham chiếu cũ `claude-cli/claude-opus-4-7` vẫn hoạt động để tương thích.

<Note>
Nhân viên Anthropic đã cho chúng tôi biết việc sử dụng Claude CLI kiểu OpenClaw lại được phép, vì vậy OpenClaw xem việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới. Setup-token của Anthropic vẫn khả dụng như một đường dẫn token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.
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
- Các header quy thuộc OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ được gắn trên lưu lượng Codex gốc tới `chatgpt.com/backend-api`, không áp dụng cho proxy tương thích OpenAI chung
- Chia sẻ cùng công tắc `/fast` và cấu hình `params.fastMode` như `openai/*` trực tiếp; OpenClaw ánh xạ điều đó sang `service_tier=priority`
- `openai-codex/gpt-5.5` dùng `contextWindow = 400000` gốc của danh mục Codex và runtime mặc định `contextTokens = 272000`; ghi đè giới hạn runtime bằng `models.providers.openai-codex.models[].contextTokens`
- Ghi chú chính sách: OpenAI Codex OAuth được hỗ trợ tường minh cho các công cụ/quy trình bên ngoài như OpenClaw.
- Với tuyến đăng ký cộng runtime Codex gốc phổ biến, đăng nhập bằng xác thực `openai-codex` nhưng cấu hình `openai/gpt-5.5` cộng với `agents.defaults.agentRuntime.id: "codex"`.
- Chỉ dùng `openai-codex/gpt-5.5` khi bạn muốn tuyến Codex OAuth/đăng ký qua PI; dùng `openai/gpt-5.5` không có ghi đè runtime Codex khi thiết lập khóa API và danh mục cục bộ của bạn cung cấp tuyến API công khai.
- Các tham chiếu cũ `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*`, và `openai-codex/gpt-5.3*` bị ẩn vì tài khoản ChatGPT/Codex OAuth từ chối chúng; hãy dùng `openai-codex/gpt-5.5` hoặc tuyến runtime Codex gốc thay thế.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      agentRuntime: { id: "codex" },
    },
  },
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

### Tùy chọn lưu trữ kiểu đăng ký khác

<CardGroup cols={3}>
  <Card title="Mô hình GLM" href="/vi/providers/glm">
    Z.AI Coding Plan hoặc endpoint API chung.
  </Card>
  <Card title="MiniMax" href="/vi/providers/minimax">
    Truy cập MiniMax Coding Plan OAuth hoặc khóa API.
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
- Luân phiên tùy chọn: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, phương án dự phòng `GOOGLE_API_KEY`, và `OPENCLAW_LIVE_GEMINI_KEY` (ghi đè đơn lẻ)
- Mô hình ví dụ: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Khả năng tương thích: cấu hình OpenClaw cũ dùng `google/gemini-3.1-flash-preview` được chuẩn hóa thành `google/gemini-3-flash-preview`
- Bí danh: `google/gemini-3.1-pro` được chấp nhận và chuẩn hóa thành id API Gemini trực tiếp của Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Suy luận: `/think adaptive` dùng suy luận động của Google. Gemini 3/3.1 bỏ qua `thinkingLevel` cố định; Gemini 2.5 gửi `thinkingBudget: -1`.
- Các lần chạy Gemini trực tiếp cũng chấp nhận `agents.defaults.models["google/<model>"].params.cachedContent` (hoặc `cached_content` cũ) để chuyển tiếp handle `cachedContents/...` gốc của nhà cung cấp; các lượt trúng bộ nhớ đệm Gemini hiển thị dưới dạng OpenClaw `cacheRead`

### Google Vertex và Gemini CLI

- Nhà cung cấp: `google-vertex`, `google-gemini-cli`
- Xác thực: Vertex dùng gcloud ADC; Gemini CLI dùng luồng OAuth của nó

<Warning>
Gemini CLI OAuth trong OpenClaw là một tích hợp không chính thức. Một số người dùng đã báo cáo các hạn chế tài khoản Google sau khi dùng ứng dụng khách bên thứ ba. Hãy xem lại điều khoản của Google và dùng một tài khoản không quan trọng nếu bạn chọn tiếp tục.
</Warning>

Gemini CLI OAuth được phát hành như một phần của Plugin `google` được đóng gói kèm.

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

    Mô hình mặc định: `google-gemini-cli/gemini-3-flash-preview`. Bạn **không** dán client id hoặc secret vào `openclaw.json`. Luồng đăng nhập CLI lưu token trong hồ sơ xác thực trên máy chủ Gateway.

  </Step>
  <Step title="Set project (if needed)">
    Nếu yêu cầu thất bại sau khi đăng nhập, hãy đặt `GOOGLE_CLOUD_PROJECT` hoặc `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ Gateway.
  </Step>
</Steps>

Phản hồi JSON của Gemini CLI được phân tích từ `response`; mức sử dụng dự phòng sang `stats`, với `stats.cached` được chuẩn hóa thành OpenClaw `cacheRead`.

### Z.AI (GLM)

- Nhà cung cấp: `zai`
- Xác thực: `ZAI_API_KEY`
- Mô hình ví dụ: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Bí danh: `z.ai/*` và `z-ai/*` chuẩn hóa thành `zai/*`
  - `zai-api-key` tự động phát hiện endpoint Z.AI tương ứng; `zai-coding-global`, `zai-coding-cn`, `zai-global`, và `zai-cn` buộc dùng một bề mặt cụ thể

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
- Danh mục dự phòng tĩnh đi kèm `kilocode/kilo/auto`; cơ chế khám phá trực tiếp `https://api.kilo.ai/api/gateway/models` có thể mở rộng thêm danh mục thời gian chạy.
- Định tuyến upstream chính xác phía sau `kilocode/kilo/auto` thuộc quyền sở hữu của Kilo Gateway, không được mã hóa cứng trong OpenClaw.

Xem [/providers/kilocode](/vi/providers/kilocode) để biết chi tiết thiết lập.

### Các Plugin nhà cung cấp khác được đóng gói kèm

| Nhà cung cấp            | Id                               | Biến môi trường xác thực                                    | Mô hình ví dụ                                  |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
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
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### Các điểm đặc thù nên biết

<AccordionGroup>
  <Accordion title="OpenRouter">
    Chỉ áp dụng các header quy thuộc ứng dụng và marker Anthropic `cache_control` trên các route `openrouter.ai` đã xác minh. Các ref DeepSeek, Moonshot và ZAI đủ điều kiện cache-TTL cho cơ chế lưu bộ nhớ đệm prompt do OpenRouter quản lý nhưng không nhận marker cache của Anthropic. Là một đường dẫn kiểu proxy tương thích OpenAI, nó bỏ qua định hình chỉ dành riêng cho OpenAI gốc (`serviceTier`, Responses `store`, gợi ý prompt-cache, tương thích reasoning của OpenAI). Các ref dựa trên Gemini chỉ giữ cơ chế làm sạch chữ ký suy nghĩ proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Các ref dựa trên Gemini đi theo cùng đường dẫn làm sạch proxy-Gemini; `kilocode/kilo/auto` và các ref khác không hỗ trợ proxy-reasoning sẽ bỏ qua việc chèn reasoning proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding bằng khóa API ghi các định nghĩa mô hình chat M2.7 chỉ văn bản rõ ràng; khả năng hiểu hình ảnh vẫn nằm trên nhà cung cấp media `MiniMax-VL-01` do plugin sở hữu.
  </Accordion>
  <Accordion title="NVIDIA">
    ID mô hình dùng namespace `nvidia/<vendor>/<model>` (ví dụ `nvidia/nvidia/nemotron-...` cùng với `nvidia/moonshotai/kimi-k2.5`); các trình chọn giữ nguyên thành phần `<provider>/<model-id>` theo nghĩa đen, trong khi khóa chuẩn gửi đến API vẫn chỉ có một tiền tố.
  </Accordion>
  <Accordion title="xAI">
    Dùng đường dẫn Responses của xAI. `grok-4.3` là mô hình chat mặc định được đóng gói kèm. `/fast` hoặc `params.fastMode: true` ghi lại `grok-3`, `grok-3-mini`, `grok-4` và `grok-4-0709` thành các biến thể `*-fast` tương ứng. `tool_stream` bật mặc định; tắt qua `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Được phân phối dưới dạng plugin nhà cung cấp `cerebras` đóng gói kèm. GLM dùng `zai-glm-4.7`; URL cơ sở tương thích OpenAI là `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp qua `models.providers` (tùy chỉnh/URL cơ sở)

Dùng `models.providers` (hoặc `models.json`) để thêm nhà cung cấp **tùy chỉnh** hoặc proxy tương thích OpenAI/Anthropic.

Nhiều plugin nhà cung cấp đóng gói kèm bên dưới đã công bố một danh mục mặc định. Chỉ dùng các mục `models.providers.<id>` rõ ràng khi bạn muốn ghi đè URL cơ sở mặc định, header hoặc danh sách mô hình.

Các kiểm tra năng lực mô hình của Gateway cũng đọc metadata `models.providers.<id>.models[]` rõ ràng. Nếu một mô hình tùy chỉnh hoặc proxy chấp nhận hình ảnh, đặt `input: ["text", "image"]` trên mô hình đó để WebChat và các đường dẫn tệp đính kèm bắt nguồn từ node truyền hình ảnh dưới dạng đầu vào mô hình gốc thay vì ref media chỉ văn bản.

### Moonshot AI (Kimi)

Moonshot được phân phối dưới dạng plugin nhà cung cấp đóng gói kèm. Mặc định hãy dùng nhà cung cấp tích hợp sẵn và chỉ thêm mục `models.providers.moonshot` rõ ràng khi bạn cần ghi đè URL cơ sở hoặc metadata mô hình:

- Nhà cung cấp: `moonshot`
- Xác thực: `MOONSHOT_API_KEY`
- Mô hình ví dụ: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`

ID mô hình Kimi K2:

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

### Kimi coding

Kimi Coding dùng endpoint tương thích Anthropic của Moonshot AI:

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

Mã model tương thích cũ `kimi/k2p5` vẫn được chấp nhận.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) cung cấp quyền truy cập Doubao và các model khác tại Trung Quốc.

- Nhà cung cấp: `volcengine` (lập trình: `volcengine-plan`)
- Xác thực: `VOLCANO_ENGINE_API_KEY`
- Model ví dụ: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding mặc định dùng bề mặt lập trình, nhưng catalog `volcengine/*` chung cũng được đăng ký cùng lúc.

Trong bộ chọn model khi onboarding/cấu hình, lựa chọn xác thực Volcengine ưu tiên cả các hàng `volcengine/*` và `volcengine-plan/*`. Nếu các model đó chưa được tải, OpenClaw sẽ quay về catalog chưa lọc thay vì hiển thị bộ chọn rỗng theo phạm vi nhà cung cấp.

<Tabs>
  <Tab title="Model tiêu chuẩn">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Model lập trình (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus (Quốc tế)

BytePlus ARK cung cấp quyền truy cập các model giống Volcano Engine cho người dùng quốc tế.

- Nhà cung cấp: `byteplus` (lập trình: `byteplus-plan`)
- Xác thực: `BYTEPLUS_API_KEY`
- Model ví dụ: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding mặc định dùng bề mặt lập trình, nhưng catalog `byteplus/*` chung cũng được đăng ký cùng lúc.

Trong bộ chọn model khi onboarding/cấu hình, lựa chọn xác thực BytePlus ưu tiên cả các hàng `byteplus/*` và `byteplus-plan/*`. Nếu các model đó chưa được tải, OpenClaw sẽ quay về catalog chưa lọc thay vì hiển thị bộ chọn rỗng theo phạm vi nhà cung cấp.

<Tabs>
  <Tab title="Model tiêu chuẩn">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Model lập trình (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic cung cấp các model tương thích Anthropic phía sau nhà cung cấp `synthetic`:

- Nhà cung cấp: `synthetic`
- Xác thực: `SYNTHETIC_API_KEY`
- Model ví dụ: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
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

MiniMax được cấu hình qua `models.providers` vì nó dùng endpoint tùy chỉnh:

- MiniMax OAuth (Toàn cầu): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Khóa API MiniMax (Toàn cầu): `--auth-choice minimax-global-api`
- Khóa API MiniMax (CN): `--auth-choice minimax-cn-api`
- Xác thực: `MINIMAX_API_KEY` cho `minimax`; `MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY` cho `minimax-portal`

Xem [/providers/minimax](/vi/providers/minimax) để biết chi tiết thiết lập, tùy chọn model và đoạn cấu hình.

<Note>
Trên đường dẫn streaming tương thích Anthropic của MiniMax, OpenClaw mặc định tắt suy luận trừ khi bạn đặt rõ ràng, và `/fast on` sẽ viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
</Note>

Phân tách năng lực do plugin sở hữu:

- Mặc định văn bản/trò chuyện vẫn dùng `minimax/MiniMax-M2.7`
- Tạo ảnh là `minimax/image-01` hoặc `minimax-portal/image-01`
- Hiểu ảnh là `MiniMax-VL-01` do plugin sở hữu trên cả hai đường dẫn xác thực MiniMax
- Tìm kiếm web vẫn dùng id nhà cung cấp `minimax`

### LM Studio

LM Studio được phân phối dưới dạng plugin nhà cung cấp đi kèm, dùng API native:

- Nhà cung cấp: `lmstudio`
- Xác thực: `LM_API_TOKEN`
- URL cơ sở suy luận mặc định: `http://localhost:1234/v1`

Sau đó đặt một model (thay bằng một trong các ID do `http://localhost:1234/api/v1/models` trả về):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw dùng `/api/v1/models` và `/api/v1/models/load` native của LM Studio để khám phá + tự động tải, với `/v1/chat/completions` cho suy luận theo mặc định. Nếu bạn muốn LM Studio JIT loading, TTL và tự động loại bỏ sở hữu vòng đời model, hãy đặt `models.providers.lmstudio.params.preload: false`. Xem [/providers/lmstudio](/vi/providers/lmstudio) để biết cách thiết lập và khắc phục sự cố.

### Ollama

Ollama được phân phối dưới dạng plugin nhà cung cấp đi kèm và dùng API native của Ollama:

- Nhà cung cấp: `ollama`
- Xác thực: Không bắt buộc (máy chủ cục bộ)
- Model ví dụ: `ollama/llama3.3`
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

Ollama được phát hiện cục bộ tại `http://127.0.0.1:11434` khi bạn chọn tham gia bằng `OLLAMA_API_KEY`, và plugin nhà cung cấp đi kèm thêm Ollama trực tiếp vào `openclaw onboard` và bộ chọn model. Xem [/providers/ollama](/vi/providers/ollama) để biết onboarding, chế độ đám mây/cục bộ và cấu hình tùy chỉnh.

### vLLM

vLLM được phân phối dưới dạng plugin nhà cung cấp đi kèm cho các máy chủ cục bộ/tự lưu trữ tương thích OpenAI:

- Nhà cung cấp: `vllm`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:8000/v1`

Để chọn tham gia tự động khám phá cục bộ (bất kỳ giá trị nào cũng được nếu máy chủ của bạn không bắt buộc xác thực):

```bash
export VLLM_API_KEY="vllm-local"
```

Sau đó đặt một model (thay bằng một trong các ID do `/v1/models` trả về):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Xem [/providers/vllm](/vi/providers/vllm) để biết chi tiết.

### SGLang

SGLang được phân phối dưới dạng plugin nhà cung cấp đi kèm cho các máy chủ tự lưu trữ nhanh tương thích OpenAI:

- Nhà cung cấp: `sglang`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:30000/v1`

Để chọn tham gia tự động khám phá cục bộ (bất kỳ giá trị nào cũng được nếu máy chủ của bạn không bắt buộc xác thực):

```bash
export SGLANG_API_KEY="sglang-local"
```

Sau đó đặt một model (thay bằng một trong các ID do `/v1/models` trả về):

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
    Với nhà cung cấp tùy chỉnh, `reasoning`, `input`, `cost`, `contextWindow` và `maxTokens` là tùy chọn. Khi bị bỏ qua, OpenClaw mặc định là:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Khuyến nghị: đặt các giá trị rõ ràng khớp với giới hạn proxy/model của bạn.

  </Accordion>
  <Accordion title="Quy tắc định hình tuyến proxy">
    - Với `api: "openai-completions"` trên endpoint không native (bất kỳ `baseUrl` không rỗng nào có host không phải `api.openai.com`), OpenClaw buộc `compat.supportsDeveloperRole: false` để tránh lỗi 400 của nhà cung cấp do không hỗ trợ vai trò `developer`.
    - Các tuyến kiểu proxy tương thích OpenAI cũng bỏ qua định hình yêu cầu chỉ dành cho OpenAI native: không `service_tier`, không Responses `store`, không Completions `store`, không gợi ý prompt-cache, không định hình payload tương thích suy luận OpenAI, và không có header ghi nhận OpenClaw ẩn.
    - Với proxy Completions tương thích OpenAI cần các trường riêng của nhà cung cấp, đặt `agents.defaults.models["provider/model"].params.extra_body` (hoặc `extraBody`) để hợp nhất JSON bổ sung vào thân yêu cầu gửi ra.
    - Với điều khiển chat-template của vLLM, đặt `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true` cho `vllm/nemotron-3-*` khi cấp độ suy luận của phiên đang tắt.
    - Với các model cục bộ chậm hoặc host LAN/tailnet từ xa, đặt `models.providers.<id>.timeoutSeconds`. Thiết lập này mở rộng việc xử lý yêu cầu HTTP model của nhà cung cấp, bao gồm kết nối, header, streaming thân và hủy guarded-fetch tổng thể, mà không tăng toàn bộ thời gian chờ runtime của agent.
    - Các lệnh gọi HTTP của nhà cung cấp model cho phép câu trả lời DNS fake-IP của Surge, Clash và sing-box trong `198.18.0.0/15` và `fc00::/7` chỉ cho tên host `baseUrl` của nhà cung cấp đã cấu hình. Các đích private, loopback, link-local và metadata khác vẫn cần chọn tham gia rõ ràng bằng `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Nếu `baseUrl` rỗng/bị bỏ qua, OpenClaw giữ hành vi OpenAI mặc định (phân giải tới `api.openai.com`).
    - Vì an toàn, `compat.supportsDeveloperRole: true` rõ ràng vẫn bị ghi đè trên các endpoint `openai-completions` không native.
    - Với `api: "anthropic-messages"` trên endpoint không trực tiếp (bất kỳ nhà cung cấp nào ngoài `anthropic` chuẩn, hoặc `models.providers.anthropic.baseUrl` tùy chỉnh có host không phải endpoint công khai `api.anthropic.com`), OpenClaw chặn các header beta Anthropic ngầm định như `claude-code-20250219`, `interleaved-thinking-2025-05-14` và marker OAuth, để proxy tùy chỉnh tương thích Anthropic không từ chối các cờ beta không được hỗ trợ. Đặt rõ ràng `models.providers.<id>.headers["anthropic-beta"]` nếu proxy của bạn cần tính năng beta cụ thể.

  </Accordion>
</AccordionGroup>

## Ví dụ CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Xem thêm: [Cấu hình](/vi/gateway/configuration) để có ví dụ cấu hình đầy đủ.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) - khóa cấu hình model
- [Chuyển đổi dự phòng model](/vi/concepts/model-failover) - chuỗi dự phòng và hành vi thử lại
- [Model](/vi/concepts/models) - cấu hình model và bí danh
- [Nhà cung cấp](/vi/providers) - hướng dẫn thiết lập theo từng nhà cung cấp
