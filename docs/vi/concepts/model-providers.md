---
read_when:
    - Bạn cần tài liệu tham chiếu thiết lập model theo từng provider
    - Bạn muốn các cấu hình ví dụ hoặc lệnh hướng dẫn thiết lập CLI cho nhà cung cấp mô hình
sidebarTitle: Model providers
summary: Tổng quan về nhà cung cấp mô hình với cấu hình mẫu + luồng CLI
title: Nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-07-04T03:53:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 410c92229de01cbb2be185e6cd1e2a07e554c7c5aacb356f4a9ffd1bce268de2
    source_path: concepts/model-providers.md
    workflow: 16
---

Tài liệu tham khảo cho **nhà cung cấp LLM/mô hình** (không phải kênh trò chuyện như WhatsApp/Telegram). Để biết quy tắc chọn mô hình, xem [Mô hình](/vi/concepts/models).

## Quy tắc nhanh

<AccordionGroup>
  <Accordion title="Model refs and CLI helpers">
    - Tham chiếu mô hình dùng `provider/model` (ví dụ: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` hoạt động như danh sách cho phép khi được đặt.
    - Trình trợ giúp CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` đặt giá trị mặc định ở cấp nhà cung cấp; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` ghi đè chúng cho từng mô hình.
    - Quy tắc dự phòng, thăm dò thời gian hồi và lưu phiên ghi đè: [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

  </Accordion>
  <Accordion title="Adding provider auth does not change your primary model">
    `openclaw configure` giữ nguyên `agents.defaults.model.primary` hiện có khi bạn thêm hoặc xác thực lại một nhà cung cấp. `openclaw models auth login` cũng làm như vậy trừ khi bạn truyền `--set-default`. Plugin nhà cung cấp vẫn có thể trả về một mô hình mặc định được khuyến nghị trong bản vá cấu hình xác thực của chúng, nhưng OpenClaw xem đó là "làm cho mô hình này khả dụng" khi đã có mô hình chính, không phải "thay thế mô hình chính hiện tại."

    Để cố ý chuyển mô hình mặc định, dùng `openclaw models set <provider/model>` hoặc `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="OpenAI provider/runtime split">
    Các tuyến thuộc họ OpenAI là đặc thù theo tiền tố:

    - `openai/<model>` mặc định dùng harness app-server Codex gốc cho các lượt tác nhân. Đây là thiết lập đăng ký ChatGPT/Codex thông thường.
    - Tham chiếu mô hình Codex cũ là cấu hình kế thừa mà doctor sẽ viết lại thành `openai/<model>`.
    - `openai/<model>` cùng với `agentRuntime.id: "openclaw"` của nhà cung cấp/mô hình dùng runtime tích hợp của OpenClaw cho các tuyến API-key hoặc tương thích rõ ràng.

    Xem [OpenAI](/vi/providers/openai) và [Harness Codex](/vi/plugins/codex-harness). Nếu việc tách nhà cung cấp/runtime gây khó hiểu, hãy đọc [Runtime tác nhân](/vi/concepts/agent-runtimes) trước.

    Tự động bật Plugin tuân theo cùng ranh giới: tham chiếu tác nhân `openai/*` bật Plugin Codex cho tuyến mặc định, và `agentRuntime.id: "codex"` rõ ràng của nhà cung cấp/mô hình hoặc tham chiếu `codex/<model>` kế thừa cũng yêu cầu Plugin đó.

    GPT-5.5 mặc định khả dụng qua harness app-server Codex gốc trên `openai/gpt-5.5`, và qua runtime OpenClaw khi chính sách runtime nhà cung cấp/mô hình chọn rõ ràng `openclaw`.

  </Accordion>
  <Accordion title="CLI runtimes">
    Runtime CLI dùng cùng cách tách: chọn tham chiếu mô hình chuẩn như `anthropic/claude-*` hoặc `google/gemini-*`, rồi đặt chính sách runtime nhà cung cấp/mô hình thành `claude-cli` hoặc `google-gemini-cli` khi bạn muốn backend CLI cục bộ.

    Tham chiếu `claude-cli/*` và `google-gemini-cli/*` kế thừa được di chuyển lại về tham chiếu nhà cung cấp chuẩn, với runtime được ghi riêng. Tham chiếu `codex-cli/*` kế thừa được di chuyển sang `openai/*` và dùng tuyến app-server Codex; OpenClaw không còn giữ backend CLI Codex đóng gói.

  </Accordion>
</AccordionGroup>

## Hành vi nhà cung cấp do Plugin sở hữu

Phần lớn logic đặc thù theo nhà cung cấp nằm trong Plugin nhà cung cấp (`registerProvider(...)`) trong khi OpenClaw giữ vòng lặp suy luận chung. Plugin sở hữu việc onboarding, catalog mô hình, ánh xạ biến môi trường xác thực, chuẩn hóa transport/cấu hình, dọn dẹp schema công cụ, phân loại chuyển đổi dự phòng, làm mới OAuth, báo cáo mức sử dụng, hồ sơ thinking/reasoning, và nhiều nội dung khác.

Danh sách đầy đủ các hook provider-SDK và ví dụ Plugin đóng gói nằm trong [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins). Một nhà cung cấp cần trình thực thi yêu cầu tùy chỉnh hoàn toàn là một bề mặt mở rộng riêng và sâu hơn.

<Note>
Hành vi runner do nhà cung cấp sở hữu nằm trên các hook nhà cung cấp rõ ràng như chính sách replay, chuẩn hóa schema công cụ, bọc luồng, và trình trợ giúp transport/yêu cầu. Túi tĩnh `ProviderPlugin.capabilities` kế thừa chỉ dành cho tương thích và không còn được logic runner dùng chung đọc nữa.
</Note>

## Xoay vòng API key

<AccordionGroup>
  <Accordion title="Key sources and priority">
    Cấu hình nhiều khóa qua:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè live đơn, ưu tiên cao nhất)
    - `<PROVIDER>_API_KEYS` (danh sách phân tách bằng dấu phẩy hoặc dấu chấm phẩy)
    - `<PROVIDER>_API_KEY` (khóa chính)
    - `<PROVIDER>_API_KEY_*` (danh sách đánh số, ví dụ `<PROVIDER>_API_KEY_1`)

    Với nhà cung cấp Google, `GOOGLE_API_KEY` cũng được đưa vào làm dự phòng. Thứ tự chọn khóa giữ nguyên mức ưu tiên và loại bỏ giá trị trùng lặp.

  </Accordion>
  <Accordion title="When rotation kicks in">
    - Yêu cầu chỉ được thử lại bằng khóa tiếp theo khi có phản hồi giới hạn tốc độ (ví dụ `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, hoặc thông báo giới hạn sử dụng định kỳ).
    - Lỗi không phải giới hạn tốc độ thất bại ngay; không thử xoay vòng khóa.
    - Khi tất cả khóa ứng viên đều thất bại, lỗi cuối cùng được trả về từ lần thử cuối.

  </Accordion>
</AccordionGroup>

## Plugin nhà cung cấp chính thức

Plugin nhà cung cấp chính thức công bố các hàng catalog mô hình riêng. Những nhà cung cấp này **không** yêu cầu mục mô hình `models.providers`; bật Plugin nhà cung cấp, đặt xác thực, rồi chọn mô hình. Chỉ dùng `models.providers` cho nhà cung cấp tùy chỉnh rõ ràng hoặc thiết lập yêu cầu hẹp như thời gian chờ.

### OpenAI

- Nhà cung cấp: `openai`
- Xác thực: `OPENAI_API_KEY`
- Xoay vòng tùy chọn: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, cùng với `OPENCLAW_LIVE_OPENAI_KEY` (ghi đè đơn)
- Mô hình ví dụ: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Xác minh khả năng dùng tài khoản/mô hình bằng `openclaw models list --provider openai` nếu một bản cài đặt hoặc API key cụ thể hoạt động khác đi.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport mặc định là `auto`; OpenClaw truyền lựa chọn transport cho runtime mô hình dùng chung.
- Ghi đè theo từng mô hình qua `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- Có thể bật xử lý ưu tiên của OpenAI qua `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` và `params.fastMode` ánh xạ các yêu cầu Responses `openai/*` trực tiếp thành `service_tier=priority` trên `api.openai.com`
- Dùng `params.serviceTier` khi bạn muốn một tầng rõ ràng thay vì công tắc `/fast` dùng chung
- Header ghi nhận OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ áp dụng trên lưu lượng OpenAI gốc đến `api.openai.com`, không áp dụng cho proxy tương thích OpenAI chung
- Tuyến OpenAI gốc cũng giữ `store` của Responses, gợi ý prompt-cache, và định hình payload tương thích reasoning của OpenAI; tuyến proxy thì không
- `openai/gpt-5.3-codex-spark` khả dụng qua xác thực đăng ký OAuth ChatGPT/Codex khi tài khoản đã đăng nhập của bạn hiển thị nó; OpenClaw vẫn chặn các tuyến API-key OpenAI trực tiếp và API-key Azure cho mô hình này vì các transport đó từ chối nó

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Nhà cung cấp: `anthropic`
- Xác thực: `ANTHROPIC_API_KEY`
- Xoay vòng tùy chọn: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, cùng với `OPENCLAW_LIVE_ANTHROPIC_KEY` (ghi đè đơn)
- Mô hình ví dụ: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Yêu cầu Anthropic công khai trực tiếp hỗ trợ công tắc `/fast` dùng chung và `params.fastMode`, bao gồm lưu lượng dùng API-key và xác thực OAuth gửi đến `api.anthropic.com`; OpenClaw ánh xạ điều đó sang `service_tier` của Anthropic (`auto` so với `standard_only`)
- Cấu hình Claude CLI ưu tiên giữ tham chiếu mô hình ở dạng chuẩn và chọn backend CLI riêng: `anthropic/claude-opus-4-8` với `agentRuntime.id: "claude-cli"` theo phạm vi mô hình. Tham chiếu `claude-cli/claude-opus-4-7` kế thừa vẫn hoạt động để tương thích.

<Note>
Nhân viên Anthropic cho chúng tôi biết việc sử dụng Claude CLI theo kiểu OpenClaw được cho phép trở lại, vì vậy OpenClaw xem việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới. Setup-token của Anthropic vẫn khả dụng như một đường dẫn token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI ChatGPT/Codex

- Nhà cung cấp: `openai`
- Xác thực: OAuth (ChatGPT)
- Tham chiếu mô hình OpenAI Codex kế thừa: `openai/gpt-5.5`
- Tham chiếu harness app-server Codex gốc: `openai/gpt-5.5`
- Tài liệu harness app-server Codex gốc: [Harness Codex](/vi/plugins/codex-harness)
- Tham chiếu mô hình kế thừa: `codex/gpt-*`
- Ranh giới Plugin: `openai/*` tải Plugin OpenAI; Plugin app-server Codex gốc được chọn bởi runtime harness Codex.
- CLI: `openclaw onboard --auth-choice openai` hoặc `openclaw models auth login --provider openai`
- Transport mặc định là `auto` (ưu tiên WebSocket, dự phòng SSE)
- Ghi đè theo từng mô hình OpenAI Codex qua `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- `params.serviceTier` cũng được chuyển tiếp trên yêu cầu Responses Codex gốc (`chatgpt.com/backend-api`)
- Header ghi nhận OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ được gắn trên lưu lượng Codex gốc đến `chatgpt.com/backend-api`, không gắn cho proxy tương thích OpenAI chung
- Chia sẻ cùng cấu hình công tắc `/fast` và `params.fastMode` như `openai/*` trực tiếp; OpenClaw ánh xạ điều đó thành `service_tier=priority`
- `openai/gpt-5.5` dùng `contextWindow = 400000` gốc từ catalog Codex và runtime mặc định `contextTokens = 272000`; ghi đè giới hạn runtime bằng `models.providers.openai.models[].contextTokens`
- Ghi chú chính sách: OAuth OpenAI Codex được hỗ trợ rõ ràng cho công cụ/quy trình làm việc bên ngoài như OpenClaw.
- Với tuyến đăng ký cộng với runtime Codex gốc phổ biến, đăng nhập bằng xác thực `openai` và cấu hình `openai/gpt-5.5`; lượt tác nhân OpenAI chọn Codex theo mặc định.
- Chỉ dùng `agentRuntime.id: "openclaw"` của nhà cung cấp/mô hình khi bạn muốn tuyến OpenClaw tích hợp; nếu không, giữ `openai/gpt-5.5` trên harness Codex mặc định.
- Tham chiếu GPT Codex kế thừa là trạng thái kế thừa, không phải tuyến nhà cung cấp live. Dùng `openai/gpt-5.5` trên runtime Codex gốc cho cấu hình tác nhân mới, và chạy `openclaw doctor --fix` để di chuyển tham chiếu mô hình Codex kế thừa cũ sang tham chiếu chuẩn `openai/*`.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      openai: {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Tùy chọn lưu trữ kiểu đăng ký khác

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/vi/providers/zai">
    Coding Plan Z.AI hoặc endpoint API chung.
  </Card>
  <Card title="MiniMax" href="/vi/providers/minimax">
    OAuth MiniMax Coding Plan hoặc truy cập bằng API key.
  </Card>
  <Card title="Qwen Cloud" href="/vi/providers/qwen">
    Bề mặt nhà cung cấp Qwen Cloud cùng với ánh xạ endpoint Alibaba DashScope và Coding Plan.
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

### Google Gemini (API key)

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY`
- Xoay vòng tùy chọn: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, phương án dự phòng `GOOGLE_API_KEY`, và `OPENCLAW_LIVE_GEMINI_KEY` (ghi đè đơn lẻ)
- Mô hình ví dụ: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Khả năng tương thích: cấu hình OpenClaw cũ dùng `google/gemini-3.1-flash-preview` được chuẩn hóa thành `google/gemini-3-flash-preview`
- Bí danh: `google/gemini-3.1-pro` được chấp nhận và chuẩn hóa thành id Gemini API trực tiếp của Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Suy luận: `/think adaptive` dùng suy luận động của Google. Gemini 3/3.1 bỏ qua `thinkingLevel` cố định; Gemini 2.5 gửi `thinkingBudget: -1`.
- Các lượt chạy Gemini trực tiếp cũng chấp nhận `agents.defaults.models["google/<model>"].params.cachedContent` (hoặc `cached_content` cũ) để chuyển tiếp một handle `cachedContents/...` gốc của nhà cung cấp; lượt trúng bộ nhớ đệm Gemini hiển thị dưới dạng `cacheRead` của OpenClaw

### Google Vertex và Gemini CLI

- Nhà cung cấp: `google-vertex`, `google-gemini-cli`
- Xác thực: Vertex dùng gcloud ADC; Gemini CLI dùng luồng OAuth của nó

<Warning>
Gemini CLI OAuth trong OpenClaw là một tích hợp không chính thức. Một số người dùng đã báo cáo các hạn chế tài khoản Google sau khi dùng ứng dụng khách bên thứ ba. Hãy xem lại điều khoản của Google và dùng tài khoản không quan trọng nếu bạn chọn tiếp tục.
</Warning>

Gemini CLI OAuth được phát hành như một phần của Plugin `google` đi kèm.

<Steps>
  <Step title="Cài đặt Gemini CLI">
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
  <Step title="Bật Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="Đăng nhập">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    Mô hình mặc định: `google-gemini-cli/gemini-3-flash-preview`. Bạn **không** dán client id hoặc secret vào `openclaw.json`. Luồng đăng nhập CLI lưu token trong hồ sơ xác thực trên máy chủ gateway.

  </Step>
  <Step title="Đặt dự án (nếu cần)">
    Nếu yêu cầu thất bại sau khi đăng nhập, hãy đặt `GOOGLE_CLOUD_PROJECT` hoặc `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ gateway.
  </Step>
</Steps>

Gemini CLI dùng `stream-json` theo mặc định. OpenClaw đọc thông điệp luồng
của trợ lý và chuẩn hóa `stats.cached` thành `cacheRead`; các ghi đè
`--output-format json` cũ vẫn đọc văn bản phản hồi từ `response`.

### Z.AI (GLM)

- Nhà cung cấp: `zai`
- Xác thực: `ZAI_API_KEY`
- Mô hình ví dụ: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Tham chiếu mô hình dùng ID nhà cung cấp `zai/*` chuẩn.
  - `zai-api-key` tự động phát hiện endpoint Z.AI tương ứng; `zai-coding-global`, `zai-coding-cn`, `zai-global`, và `zai-cn` ép dùng một bề mặt cụ thể

### Vercel AI Gateway

- Nhà cung cấp: `vercel-ai-gateway`
- Xác thực: `AI_GATEWAY_API_KEY`
- Mô hình ví dụ: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Các Plugin nhà cung cấp đi kèm khác

| Nhà cung cấp                            | Id                               | Env xác thực                                         | Mô hình ví dụ                                             |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                            |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`                   |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                          |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN`              | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/vi/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth hoặc `OPENROUTER_API_KEY`           | `openrouter/auto`                                          |
| [Qwen OAuth](/vi/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                       | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth hoặc `XAI_API_KEY`         | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Những điểm khác biệt cần biết

<AccordionGroup>
  <Accordion title="OpenRouter">
    Chỉ áp dụng các header ghi nhận ứng dụng và marker `cache_control` của Anthropic trên các route `openrouter.ai` đã xác minh. Các tham chiếu DeepSeek, Moonshot và ZAI đủ điều kiện cache-TTL cho bộ nhớ đệm prompt do OpenRouter quản lý nhưng không nhận marker bộ nhớ đệm Anthropic. Là một đường dẫn tương thích OpenAI kiểu proxy, nó bỏ qua shaping chỉ dành cho OpenAI gốc (`serviceTier`, Responses `store`, gợi ý prompt-cache, tương thích suy luận OpenAI). Các tham chiếu dựa trên Gemini chỉ giữ vệ sinh thought-signature của proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Các tham chiếu dựa trên Gemini đi theo cùng đường dẫn vệ sinh proxy-Gemini; `kilocode/kilo/auto` và các tham chiếu khác không hỗ trợ suy luận proxy bỏ qua chèn suy luận proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Onboarding bằng khóa API ghi các định nghĩa mô hình chat M3 và M2.7 rõ ràng; hiểu hình ảnh vẫn nằm trên nhà cung cấp media `MiniMax-VL-01` do Plugin sở hữu.
  </Accordion>
  <Accordion title="NVIDIA">
    ID mô hình dùng không gian tên `nvidia/<vendor>/<model>` (ví dụ `nvidia/nvidia/nemotron-...` cùng với `nvidia/moonshotai/kimi-k2.5`); bộ chọn giữ nguyên phép ghép `<provider>/<model-id>` theo nghĩa đen trong khi khóa chuẩn gửi đến API vẫn chỉ có một tiền tố.
  </Accordion>
  <Accordion title="xAI">
    Dùng đường dẫn Responses của xAI. Đường dẫn được khuyến nghị là SuperGrok/X Premium OAuth; khóa API vẫn hoạt động qua `XAI_API_KEY` hoặc cấu hình Plugin, và `web_search` của Grok dùng lại cùng hồ sơ xác thực trước khi dự phòng về khóa API. `grok-4.3` là mô hình chat mặc định đi kèm, và `grok-build-0.1` có thể chọn cho công việc tập trung vào build/lập trình. `/fast` hoặc `params.fastMode: true` ghi lại `grok-3`, `grok-3-mini`, `grok-4`, và `grok-4-0709` thành các biến thể `*-fast` của chúng. `tool_stream` bật mặc định; tắt qua `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp qua `models.providers` (URL tùy chỉnh/cơ sở)

Dùng `models.providers` (hoặc `models.json`) để thêm nhà cung cấp **tùy chỉnh** hoặc proxy tương thích OpenAI/Anthropic.

Nhiều Plugin nhà cung cấp đi kèm bên dưới đã phát hành catalog mặc định. Chỉ dùng các mục `models.providers.<id>` tường minh khi bạn muốn ghi đè URL cơ sở, header hoặc danh sách model mặc định.

Các kiểm tra khả năng của model trong Gateway cũng đọc metadata `models.providers.<id>.models[]` tường minh. Nếu một model tùy chỉnh hoặc proxy chấp nhận hình ảnh, hãy đặt `input: ["text", "image"]` trên model đó để WebChat và các đường dẫn tệp đính kèm bắt nguồn từ Node truyền hình ảnh dưới dạng đầu vào model nguyên bản thay vì tham chiếu phương tiện chỉ có văn bản.

`agents.defaults.models["provider/model"]` chỉ kiểm soát khả năng hiển thị model, bí danh và metadata theo từng model cho agent. Tự nó không đăng ký một model runtime mới. Đối với model nhà cung cấp tùy chỉnh, cũng hãy thêm `models.providers.<provider>.models[]` với ít nhất `id` khớp tương ứng.

### Moonshot AI (Kimi)

Cài đặt `@openclaw/moonshot-provider` trước khi onboarding. Chỉ thêm mục `models.providers.moonshot` tường minh khi bạn cần ghi đè URL cơ sở hoặc metadata model:

- Nhà cung cấp: `moonshot`
- Xác thực: `MOONSHOT_API_KEY`
- Model ví dụ: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`

ID model Kimi K2:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.7-code`
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

Kimi Coding sử dụng endpoint tương thích Anthropic của Moonshot AI:

- Nhà cung cấp: `kimi`
- Xác thực: `KIMI_API_KEY`
- Model ví dụ: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

`kimi/kimi-code` và `kimi/k2p5` cũ vẫn được chấp nhận dưới dạng ID model tương thích và được chuẩn hóa thành ID model API ổn định của Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) cung cấp quyền truy cập vào Doubao và các model khác tại Trung Quốc.

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

Khi onboarding, mặc định dùng bề mặt lập trình, nhưng catalog `volcengine/*` tổng quát cũng được đăng ký cùng lúc.

Trong bộ chọn mô hình của onboarding/configure, lựa chọn xác thực Volcengine ưu tiên cả các hàng `volcengine/*` và `volcengine-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ quay về catalog chưa lọc thay vì hiển thị bộ chọn rỗng theo phạm vi nhà cung cấp.

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

Khi onboarding, mặc định dùng bề mặt lập trình, nhưng catalog `byteplus/*` tổng quát cũng được đăng ký cùng lúc.

Trong bộ chọn mô hình của onboarding/configure, lựa chọn xác thực BytePlus ưu tiên cả các hàng `byteplus/*` và `byteplus-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ quay về catalog chưa lọc thay vì hiển thị bộ chọn rỗng theo phạm vi nhà cung cấp.

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

MiniMax được cấu hình qua `models.providers` vì nó dùng các endpoint tùy chỉnh:

- MiniMax OAuth (Toàn cầu): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (Trung Quốc): `--auth-choice minimax-cn-oauth`
- Khóa API MiniMax (Toàn cầu): `--auth-choice minimax-global-api`
- Khóa API MiniMax (Trung Quốc): `--auth-choice minimax-cn-api`
- Xác thực: `MINIMAX_API_KEY` cho `minimax`; `MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY` cho `minimax-portal`

Xem [/providers/minimax](/vi/providers/minimax) để biết chi tiết thiết lập, tùy chọn mô hình và các đoạn cấu hình.

<Note>
Trên đường dẫn streaming tương thích Anthropic của MiniMax, OpenClaw mặc định tắt thinking cho họ M2.x trừ khi bạn đặt rõ; MiniMax-M3 (và M3.x) mặc định vẫn dùng đường dẫn thinking bị lược bỏ/thích ứng của nhà cung cấp. `/fast on` viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
</Note>

Phân tách năng lực do Plugin sở hữu:

- Mặc định văn bản/chat vẫn dùng `minimax/MiniMax-M3`
- Tạo hình ảnh là `minimax/image-01` hoặc `minimax-portal/image-01`
- Hiểu hình ảnh là `MiniMax-VL-01` do Plugin sở hữu trên cả hai đường dẫn xác thực MiniMax
- Tìm kiếm web vẫn dùng id nhà cung cấp `minimax`

### LM Studio

LM Studio được phát hành dưới dạng Plugin nhà cung cấp được đóng gói sẵn, dùng API gốc:

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

OpenClaw dùng `/api/v1/models` và `/api/v1/models/load` gốc của LM Studio để khám phá + tự động tải, với `/v1/chat/completions` cho suy luận theo mặc định. Nếu bạn muốn cơ chế tải JIT, TTL và tự động loại bỏ của LM Studio sở hữu vòng đời mô hình, hãy đặt `models.providers.lmstudio.params.preload: false`. Xem [/providers/lmstudio](/vi/providers/lmstudio) để biết cách thiết lập và xử lý sự cố.

### Ollama

Ollama được phát hành dưới dạng Plugin nhà cung cấp được đóng gói sẵn và dùng API gốc của Ollama:

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

Ollama được phát hiện cục bộ tại `http://127.0.0.1:11434` khi bạn chọn tham gia bằng `OLLAMA_API_KEY`, và Plugin nhà cung cấp được đóng gói sẵn sẽ thêm Ollama trực tiếp vào `openclaw onboard` và bộ chọn mô hình. Xem [/providers/ollama](/vi/providers/ollama) để biết onboarding, chế độ đám mây/cục bộ và cấu hình tùy chỉnh.

### vLLM

vLLM được phát hành dưới dạng Plugin nhà cung cấp được đóng gói sẵn cho các máy chủ cục bộ/tự lưu trữ tương thích OpenAI:

- Nhà cung cấp: `vllm`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:8000/v1`

Để chọn tham gia tự động khám phá cục bộ (giá trị nào cũng được nếu máy chủ của bạn không bắt buộc xác thực):

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

SGLang được phát hành dưới dạng Plugin nhà cung cấp được đóng gói sẵn cho các máy chủ tự lưu trữ nhanh tương thích OpenAI:

- Nhà cung cấp: `sglang`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:30000/v1`

Để chọn tham gia tự động khám phá cục bộ (giá trị nào cũng được nếu máy chủ của bạn không bắt buộc xác thực):

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
    Với nhà cung cấp tùy chỉnh, `reasoning`, `input`, `cost`, `contextWindow` và `maxTokens` là tùy chọn. Khi bị lược bỏ, OpenClaw mặc định dùng:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Khuyến nghị: đặt giá trị rõ ràng khớp với giới hạn proxy/mô hình của bạn.

  </Accordion>
  <Accordion title="Quy tắc định hình tuyến proxy">
    - Với `api: "openai-completions"` trên các endpoint không phải gốc (bất kỳ `baseUrl` không rỗng nào có host không phải `api.openai.com`), OpenClaw ép `compat.supportsDeveloperRole: false` để tránh lỗi 400 từ nhà cung cấp đối với vai trò `developer` không được hỗ trợ.
    - Các tuyến tương thích OpenAI kiểu proxy cũng bỏ qua định hình yêu cầu chỉ dành cho OpenAI gốc: không `service_tier`, không Responses `store`, không Completions `store`, không gợi ý prompt-cache, không định hình payload tương thích reasoning của OpenAI, và không có header ghi nhận OpenClaw ẩn.
    - Với proxy Completions tương thích OpenAI cần các trường riêng của nhà cung cấp, hãy đặt `agents.defaults.models["provider/model"].params.extra_body` (hoặc `extraBody`) để hợp nhất JSON bổ sung vào thân yêu cầu gửi đi.
    - Với điều khiển chat-template của vLLM, hãy đặt `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Plugin vLLM được đóng gói sẵn tự động gửi `enable_thinking: false` và `force_nonempty_content: true` cho `vllm/nemotron-3-*` khi mức thinking của phiên đang tắt.
    - Với mô hình cục bộ chậm hoặc máy chủ LAN/tailnet từ xa, hãy đặt `models.providers.<id>.timeoutSeconds`. Thiết lập này kéo dài xử lý yêu cầu HTTP mô hình của nhà cung cấp, bao gồm kết nối, header, streaming phần thân và lệnh hủy guarded-fetch tổng thể, mà không tăng timeout toàn bộ runtime của tác nhân. Nếu `agents.defaults.timeoutSeconds` hoặc timeout riêng của lần chạy thấp hơn, cũng hãy nâng trần đó; timeout của nhà cung cấp không thể kéo dài toàn bộ lần chạy.
    - Các lệnh gọi HTTP của nhà cung cấp mô hình cho phép câu trả lời DNS fake-IP của Surge, Clash và sing-box trong `198.18.0.0/15` và `fc00::/7` chỉ cho hostname `baseUrl` của nhà cung cấp đã cấu hình. Endpoint nhà cung cấp tùy chỉnh/cục bộ cũng tin cậy đúng origin `scheme://host:port` đã cấu hình đó cho các yêu cầu mô hình được bảo vệ, bao gồm loopback, LAN và host tailnet. Đây không phải là tùy chọn cấu hình mới; `baseUrl` bạn cấu hình chỉ mở rộng chính sách yêu cầu cho origin đó. Cho phép hostname fake-IP và tin cậy exact-origin là hai cơ chế độc lập. Các đích riêng tư, loopback, link-local, metadata khác và các cổng khác vẫn cần chọn tham gia rõ ràng bằng `models.providers.<id>.request.allowPrivateNetwork: true`. Đặt `models.providers.<id>.request.allowPrivateNetwork: false` để không dùng tin cậy exact-origin.
    - Nếu `baseUrl` trống/bị lược bỏ, OpenClaw giữ hành vi OpenAI mặc định (phân giải tới `api.openai.com`).
    - Vì an toàn, `compat.supportsDeveloperRole: true` rõ ràng vẫn bị ghi đè trên các endpoint `openai-completions` không phải gốc.
    - Với `api: "anthropic-messages"` trên các endpoint không trực tiếp (bất kỳ nhà cung cấp nào ngoài `anthropic` chính tắc, hoặc một `models.providers.anthropic.baseUrl` tùy chỉnh có host không phải endpoint công khai `api.anthropic.com`), OpenClaw chặn các header Anthropic beta ngầm định như `claude-code-20250219`, `interleaved-thinking-2025-05-14` và marker OAuth, để proxy tùy chỉnh tương thích Anthropic không từ chối các cờ beta không được hỗ trợ. Đặt `models.providers.<id>.headers["anthropic-beta"]` rõ ràng nếu proxy của bạn cần tính năng beta cụ thể.

  </Accordion>
</AccordionGroup>

## Ví dụ CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Xem thêm: [Cấu hình](/vi/gateway/configuration) để có đầy đủ ví dụ cấu hình.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) - các khóa cấu hình mô hình
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) - chuỗi fallback và hành vi thử lại
- [Mô hình](/vi/concepts/models) - cấu hình mô hình và bí danh
- [Nhà cung cấp](/vi/providers) - hướng dẫn thiết lập theo từng nhà cung cấp
