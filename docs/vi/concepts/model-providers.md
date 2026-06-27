---
read_when:
    - Bạn cần tài liệu tham chiếu thiết lập mô hình theo từng nhà cung cấp
    - Bạn muốn cấu hình mẫu hoặc các lệnh thiết lập ban đầu bằng CLI cho nhà cung cấp mô hình
sidebarTitle: Model providers
summary: Tổng quan về nhà cung cấp mô hình với cấu hình ví dụ + luồng CLI
title: Nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-06-27T17:24:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29bf36fd787e5c1a9dcd24abd4e484c14385a46973150cfc6d3c8dc7c14dec0a
    source_path: concepts/model-providers.md
    workflow: 16
---

Tài liệu tham khảo cho **nhà cung cấp LLM/mô hình** (không phải kênh trò chuyện như WhatsApp/Telegram). Để xem quy tắc chọn mô hình, hãy xem [Mô hình](/vi/concepts/models).

## Quy tắc nhanh

<AccordionGroup>
  <Accordion title="Tham chiếu mô hình và trình trợ giúp CLI">
    - Tham chiếu mô hình dùng `provider/model` (ví dụ: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` hoạt động như danh sách cho phép khi được đặt.
    - Trình trợ giúp CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` đặt mặc định cấp nhà cung cấp; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` ghi đè chúng theo từng mô hình.
    - Quy tắc dự phòng, probe cooldown và lưu trạng thái ghi đè phiên: [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

  </Accordion>
  <Accordion title="Thêm xác thực nhà cung cấp không thay đổi mô hình chính của bạn">
    `openclaw configure` giữ nguyên `agents.defaults.model.primary` hiện có khi bạn thêm hoặc xác thực lại một nhà cung cấp. `openclaw models auth login` cũng làm như vậy trừ khi bạn truyền `--set-default`. Provider Plugin vẫn có thể trả về mô hình mặc định được đề xuất trong bản vá cấu hình xác thực, nhưng OpenClaw xem đó là "làm cho mô hình này khả dụng" khi đã có mô hình chính, không phải "thay thế mô hình chính hiện tại."

    Để chủ động chuyển mô hình mặc định, hãy dùng `openclaw models set <provider/model>` hoặc `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Tách nhà cung cấp/runtime OpenAI">
    Các tuyến thuộc họ OpenAI là theo tiền tố cụ thể:

    - `openai/<model>` mặc định dùng harness app-server Codex gốc cho lượt agent. Đây là thiết lập đăng ký ChatGPT/Codex thông thường.
    - Các tham chiếu mô hình Codex cũ là cấu hình kế thừa mà doctor viết lại thành `openai/<model>`.
    - `openai/<model>` cộng với provider/model `agentRuntime.id: "openclaw"` dùng runtime tích hợp của OpenClaw cho các tuyến API-key hoặc tương thích rõ ràng.

    Xem [OpenAI](/vi/providers/openai) và [Codex harness](/vi/plugins/codex-harness). Nếu phần tách nhà cung cấp/runtime gây khó hiểu, hãy đọc [Runtime agent](/vi/concepts/agent-runtimes) trước.

    Tự động bật Plugin tuân theo cùng ranh giới: tham chiếu agent `openai/*` bật Plugin Codex cho tuyến mặc định, và provider/model rõ ràng `agentRuntime.id: "codex"` hoặc tham chiếu cũ `codex/<model>` cũng yêu cầu Plugin đó.

    GPT-5.5 mặc định có sẵn qua harness app-server Codex gốc trên `openai/gpt-5.5`, và qua runtime OpenClaw khi chính sách runtime provider/model chọn rõ ràng `openclaw`.

  </Accordion>
  <Accordion title="Runtime CLI">
    Runtime CLI dùng cùng cách tách: chọn tham chiếu mô hình chuẩn như `anthropic/claude-*` hoặc `google/gemini-*`, rồi đặt chính sách runtime provider/model thành `claude-cli` hoặc `google-gemini-cli` khi bạn muốn backend CLI cục bộ.

    Các tham chiếu cũ `claude-cli/*` và `google-gemini-cli/*` được di chuyển trở lại tham chiếu nhà cung cấp chuẩn với runtime được ghi riêng. Tham chiếu cũ `codex-cli/*` di chuyển sang `openai/*` và dùng tuyến app-server Codex; OpenClaw không còn giữ backend Codex CLI đi kèm.

  </Accordion>
</AccordionGroup>

## Hành vi nhà cung cấp do Plugin sở hữu

Hầu hết logic theo nhà cung cấp nằm trong provider Plugin (`registerProvider(...)`) trong khi OpenClaw giữ vòng lặp suy luận chung. Plugin sở hữu onboarding, catalog mô hình, ánh xạ biến môi trường xác thực, chuẩn hóa transport/cấu hình, dọn dẹp schema công cụ, phân loại chuyển đổi dự phòng, làm mới OAuth, báo cáo sử dụng, hồ sơ suy nghĩ/lập luận, v.v.

Danh sách đầy đủ các hook provider-SDK và ví dụ Plugin đi kèm nằm trong [Provider Plugin](/vi/plugins/sdk-provider-plugins). Một nhà cung cấp cần bộ thực thi yêu cầu hoàn toàn tùy chỉnh là một bề mặt mở rộng riêng và sâu hơn.

<Note>
Hành vi runner do nhà cung cấp sở hữu nằm trên các hook nhà cung cấp rõ ràng như chính sách phát lại, chuẩn hóa schema công cụ, bọc stream và trình trợ giúp transport/yêu cầu. Túi tĩnh `ProviderPlugin.capabilities` kế thừa chỉ dành cho tương thích và không còn được logic runner dùng chung đọc nữa.
</Note>

## Xoay vòng API key

<AccordionGroup>
  <Accordion title="Nguồn khóa và mức ưu tiên">
    Cấu hình nhiều khóa qua:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè live đơn, ưu tiên cao nhất)
    - `<PROVIDER>_API_KEYS` (danh sách phân tách bằng dấu phẩy hoặc dấu chấm phẩy)
    - `<PROVIDER>_API_KEY` (khóa chính)
    - `<PROVIDER>_API_KEY_*` (danh sách đánh số, ví dụ `<PROVIDER>_API_KEY_1`)

    Với nhà cung cấp Google, `GOOGLE_API_KEY` cũng được đưa vào làm dự phòng. Thứ tự chọn khóa giữ nguyên mức ưu tiên và loại bỏ giá trị trùng lặp.

  </Accordion>
  <Accordion title="Khi nào xoay vòng được kích hoạt">
    - Yêu cầu chỉ được thử lại với khóa tiếp theo khi gặp phản hồi giới hạn tốc độ (ví dụ `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, hoặc thông báo giới hạn sử dụng định kỳ).
    - Lỗi không phải giới hạn tốc độ sẽ thất bại ngay; không thử xoay vòng khóa.
    - Khi tất cả khóa ứng viên đều thất bại, lỗi cuối cùng được trả về từ lần thử cuối.

  </Accordion>
</AccordionGroup>

## Provider Plugin chính thức

Provider Plugin chính thức xuất bản các hàng catalog mô hình riêng. Các nhà cung cấp này **không** yêu cầu mục mô hình `models.providers`; hãy bật provider Plugin, đặt xác thực và chọn một mô hình. Chỉ dùng `models.providers` cho nhà cung cấp tùy chỉnh rõ ràng hoặc thiết lập yêu cầu hẹp như timeout.

### OpenAI

- Nhà cung cấp: `openai`
- Xác thực: `OPENAI_API_KEY`
- Xoay vòng tùy chọn: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, cộng với `OPENCLAW_LIVE_OPENAI_KEY` (ghi đè đơn)
- Mô hình ví dụ: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Xác minh tính khả dụng của tài khoản/mô hình bằng `openclaw models list --provider openai` nếu một bản cài đặt hoặc API key cụ thể hoạt động khác đi.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Transport mặc định là `auto`; OpenClaw truyền lựa chọn transport cho runtime mô hình dùng chung.
- Ghi đè theo từng mô hình qua `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- Xử lý ưu tiên OpenAI có thể được bật qua `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` và `params.fastMode` ánh xạ yêu cầu Responses trực tiếp `openai/*` thành `service_tier=priority` trên `api.openai.com`
- Dùng `params.serviceTier` khi bạn muốn một tầng rõ ràng thay vì nút bật/tắt `/fast` dùng chung
- Header ghi nhận nguồn OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ áp dụng trên lưu lượng OpenAI gốc tới `api.openai.com`, không áp dụng cho proxy tương thích OpenAI chung
- Các tuyến OpenAI gốc cũng giữ Responses `store`, gợi ý prompt-cache và định hình payload tương thích lập luận OpenAI; tuyến proxy thì không
- `openai/gpt-5.3-codex-spark` có sẵn qua xác thực đăng ký OAuth ChatGPT/Codex khi tài khoản đã đăng nhập của bạn cho phép dùng nó; OpenClaw vẫn chặn các tuyến API-key OpenAI trực tiếp và API-key Azure cho mô hình này vì các transport đó từ chối nó

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
- Yêu cầu Anthropic công khai trực tiếp hỗ trợ nút bật/tắt `/fast` dùng chung và `params.fastMode`, bao gồm lưu lượng xác thực bằng API-key và OAuth gửi tới `api.anthropic.com`; OpenClaw ánh xạ phần đó sang Anthropic `service_tier` (`auto` so với `standard_only`)
- Cấu hình Claude CLI ưu tiên giữ tham chiếu mô hình ở dạng chuẩn và chọn backend CLI
  riêng: `anthropic/claude-opus-4-8` với
  `agentRuntime.id: "claude-cli"` theo phạm vi mô hình. Các tham chiếu cũ
  `claude-cli/claude-opus-4-7` vẫn hoạt động để tương thích.

<Note>
Nhân viên Anthropic đã cho chúng tôi biết việc sử dụng Claude CLI kiểu OpenClaw đã được cho phép trở lại, vì vậy OpenClaw xem việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới. Setup-token Anthropic vẫn có sẵn như một đường dẫn token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có sẵn.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI ChatGPT/Codex OAuth

- Nhà cung cấp: `openai`
- Xác thực: OAuth (ChatGPT)
- Tham chiếu mô hình OpenAI Codex kế thừa: `openai/gpt-5.5`
- Tham chiếu harness app-server Codex gốc: `openai/gpt-5.5`
- Tài liệu harness app-server Codex gốc: [Codex harness](/vi/plugins/codex-harness)
- Tham chiếu mô hình kế thừa: `codex/gpt-*`
- Ranh giới Plugin: `openai/*` tải OpenAI Plugin; Plugin app-server Codex gốc được chọn bởi runtime Codex harness.
- CLI: `openclaw onboard --auth-choice openai` hoặc `openclaw models auth login --provider openai`
- Transport mặc định là `auto` (ưu tiên WebSocket, SSE dự phòng)
- Ghi đè theo từng mô hình OpenAI Codex qua `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- `params.serviceTier` cũng được chuyển tiếp trên yêu cầu Codex Responses gốc (`chatgpt.com/backend-api`)
- Header ghi nhận nguồn OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ được gắn trên lưu lượng Codex gốc tới `chatgpt.com/backend-api`, không áp dụng cho proxy tương thích OpenAI chung
- Chia sẻ cùng cấu hình nút bật/tắt `/fast` và `params.fastMode` như `openai/*` trực tiếp; OpenClaw ánh xạ phần đó sang `service_tier=priority`
- `openai/gpt-5.5` dùng catalog Codex gốc `contextWindow = 400000` và runtime mặc định `contextTokens = 272000`; ghi đè giới hạn runtime bằng `models.providers.openai.models[].contextTokens`
- Ghi chú chính sách: OpenAI Codex OAuth được hỗ trợ rõ ràng cho công cụ/quy trình bên ngoài như OpenClaw.
- Với tuyến đăng ký thông thường cộng với runtime Codex gốc, hãy đăng nhập bằng xác thực `openai` và cấu hình `openai/gpt-5.5`; lượt agent OpenAI mặc định chọn Codex.
- Chỉ dùng provider/model `agentRuntime.id: "openclaw"` khi bạn muốn tuyến OpenClaw tích hợp; nếu không, hãy giữ `openai/gpt-5.5` trên Codex harness mặc định.
- Tham chiếu Codex GPT kế thừa là trạng thái kế thừa, không phải tuyến nhà cung cấp live. Dùng `openai/gpt-5.5` trên runtime Codex gốc cho cấu hình agent mới, và chạy `openclaw doctor --fix` để di chuyển tham chiếu mô hình Codex kế thừa cũ sang tham chiếu chuẩn `openai/*`.

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
    Gói Z.AI Coding hoặc endpoint API chung.
  </Card>
  <Card title="MiniMax" href="/vi/providers/minimax">
    Truy cập MiniMax Coding Plan OAuth hoặc API key.
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

### Google Gemini (API key)

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY`
- Xoay vòng tùy chọn: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, dự phòng `GOOGLE_API_KEY`, và `OPENCLAW_LIVE_GEMINI_KEY` (ghi đè đơn)
- Model ví dụ: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Tương thích: cấu hình OpenClaw cũ dùng `google/gemini-3.1-flash-preview` được chuẩn hóa thành `google/gemini-3-flash-preview`
- Bí danh: `google/gemini-3.1-pro` được chấp nhận và chuẩn hóa thành id Gemini API trực tiếp của Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Tư duy: `/think adaptive` dùng tư duy động của Google. Gemini 3/3.1 bỏ qua `thinkingLevel` cố định; Gemini 2.5 gửi `thinkingBudget: -1`.
- Các lần chạy Gemini trực tiếp cũng chấp nhận `agents.defaults.models["google/<model>"].params.cachedContent` (hoặc `cached_content` cũ) để chuyển tiếp một handle gốc của nhà cung cấp dạng `cachedContents/...`; các lần trúng bộ nhớ đệm Gemini hiển thị dưới dạng OpenClaw `cacheRead`

### Google Vertex và Gemini CLI

- Nhà cung cấp: `google-vertex`, `google-gemini-cli`
- Xác thực: Vertex dùng gcloud ADC; Gemini CLI dùng luồng OAuth của nó

<Warning>
Gemini CLI OAuth trong OpenClaw là một tích hợp không chính thức. Một số người dùng đã báo cáo các hạn chế tài khoản Google sau khi dùng ứng dụng khách bên thứ ba. Hãy xem lại điều khoản của Google và dùng một tài khoản không quan trọng nếu bạn chọn tiếp tục.
</Warning>

Gemini CLI OAuth được phát hành như một phần của Plugin `google` được đóng gói kèm.

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

    Model mặc định: `google-gemini-cli/gemini-3-flash-preview`. Bạn **không** dán client id hoặc secret vào `openclaw.json`. Luồng đăng nhập CLI lưu token trong hồ sơ xác thực trên máy chủ gateway.

  </Step>
  <Step title="Đặt dự án (nếu cần)">
    Nếu yêu cầu thất bại sau khi đăng nhập, hãy đặt `GOOGLE_CLOUD_PROJECT` hoặc `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ gateway.
  </Step>
</Steps>

Gemini CLI dùng `stream-json` theo mặc định. OpenClaw đọc các thông điệp luồng của trợ lý
và chuẩn hóa `stats.cached` thành `cacheRead`; các ghi đè
`--output-format json` cũ vẫn đọc văn bản phản hồi từ `response`.

### Z.AI (GLM)

- Nhà cung cấp: `zai`
- Xác thực: `ZAI_API_KEY`
- Model ví dụ: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Tham chiếu model dùng ID nhà cung cấp chuẩn tắc `zai/*`.
  - `zai-api-key` tự phát hiện endpoint Z.AI phù hợp; `zai-coding-global`, `zai-coding-cn`, `zai-global`, và `zai-cn` buộc dùng một bề mặt cụ thể

### Vercel AI Gateway

- Nhà cung cấp: `vercel-ai-gateway`
- Xác thực: `AI_GATEWAY_API_KEY`
- Model ví dụ: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Các Plugin nhà cung cấp được đóng gói kèm khác

| Nhà cung cấp                            | Id                               | Biến môi trường xác thực                           | Model ví dụ                                                |
| --------------------------------------- | -------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                 | `byteplus-plan/ark-code-latest`                            |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                   | `cohere/command-a-03-2025`                                 |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                        |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN`            | `huggingface/deepseek-ai/DeepSeek-R1`                      |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`          | `minimax/MiniMax-M3`                                       |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                  | `mistral/mistral-large-latest`                             |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                 | `moonshot/kimi-k2.6`                                       |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                   | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`                 |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                   | `novita/deepseek/deepseek-v3-0324`                         |
| [Ollama Cloud](/vi/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                   | `ollama-cloud/kimi-k2.6`                                   |
| OpenRouter                              | `openrouter`                     | OpenRouter OAuth hoặc `OPENROUTER_API_KEY`         | `openrouter/auto`                                          |
| [Qwen OAuth](/vi/providers/qwen-oauth)     | `qwen-oauth`                     | `QWEN_API_KEY`                                     | `qwen-oauth/qwen3.5-plus`                                  |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                 | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                   | -                                                          |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                               | `vercel-ai-gateway/anthropic/claude-opus-4.6`              |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                           | `volcengine-plan/ark-code-latest`                          |
| xAI                                     | `xai`                            | SuperGrok/X Premium OAuth hoặc `XAI_API_KEY`       | `xai/grok-4.3`                                             |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`     | `xiaomi/mimo-v2-flash` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Các điểm đặc biệt nên biết

<AccordionGroup>
  <Accordion title="OpenRouter">
    Chỉ áp dụng các header ghi nhận ứng dụng và dấu mốc Anthropic `cache_control` trên các tuyến `openrouter.ai` đã xác minh. Các tham chiếu DeepSeek, Moonshot, và ZAI đủ điều kiện dùng TTL bộ nhớ đệm cho bộ nhớ đệm prompt do OpenRouter quản lý nhưng không nhận dấu mốc bộ nhớ đệm Anthropic. Là một đường dẫn kiểu proxy tương thích OpenAI, nó bỏ qua định dạng chỉ dành cho OpenAI gốc (`serviceTier`, Responses `store`, gợi ý bộ nhớ đệm prompt, tương thích lý luận OpenAI). Các tham chiếu dựa trên Gemini chỉ giữ việc làm sạch chữ ký suy nghĩ proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Các tham chiếu dựa trên Gemini đi theo cùng đường dẫn làm sạch proxy-Gemini; `kilocode/kilo/auto` và các tham chiếu khác không hỗ trợ lý luận proxy sẽ bỏ qua việc chèn lý luận proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Quy trình nhập môn bằng API key ghi các định nghĩa model chat M3 và M2.7 tường minh; hiểu hình ảnh vẫn nằm trên nhà cung cấp media `MiniMax-VL-01` do Plugin sở hữu.
  </Accordion>
  <Accordion title="NVIDIA">
    ID model dùng không gian tên `nvidia/<vendor>/<model>` (ví dụ `nvidia/nvidia/nemotron-...` cùng với `nvidia/moonshotai/kimi-k2.5`); bộ chọn giữ nguyên thành phần `<provider>/<model-id>` theo nghĩa đen, trong khi khóa chuẩn tắc gửi đến API vẫn chỉ có một tiền tố.
  </Accordion>
  <Accordion title="xAI">
    Dùng đường dẫn xAI Responses. Đường dẫn được khuyến nghị là SuperGrok/X Premium OAuth; API key vẫn hoạt động qua `XAI_API_KEY` hoặc cấu hình Plugin, và Grok `web_search` dùng lại cùng hồ sơ xác thực trước khi dự phòng sang API key. `grok-4.3` là model chat mặc định được đóng gói kèm, và `grok-build-0.1` có thể được chọn cho công việc tập trung vào build/coding. `/fast` hoặc `params.fastMode: true` viết lại `grok-3`, `grok-3-mini`, `grok-4`, và `grok-4-0709` thành các biến thể `*-fast` tương ứng. `tool_stream` bật mặc định; tắt qua `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp qua `models.providers` (URL tùy chỉnh/cơ sở)

Dùng `models.providers` (hoặc `models.json`) để thêm nhà cung cấp **tùy chỉnh** hoặc proxy tương thích OpenAI/Anthropic.

Nhiều Plugin nhà cung cấp được đóng gói kèm bên dưới đã phát hành catalog mặc định. Chỉ dùng các mục `models.providers.<id>` tường minh khi bạn muốn ghi đè URL cơ sở, header, hoặc danh sách model mặc định.

Các kiểm tra năng lực mô hình của Gateway cũng đọc siêu dữ liệu `models.providers.<id>.models[]` tường minh. Nếu một mô hình tùy chỉnh hoặc proxy chấp nhận hình ảnh, hãy đặt `input: ["text", "image"]` trên mô hình đó để WebChat và các đường dẫn tệp đính kèm xuất phát từ nút truyền hình ảnh dưới dạng đầu vào mô hình gốc thay vì các tham chiếu phương tiện chỉ văn bản.

`agents.defaults.models["provider/model"]` chỉ kiểm soát khả năng hiển thị mô hình, bí danh và siêu dữ liệu theo từng mô hình cho agent. Tự nó không đăng ký một mô hình runtime mới. Với các mô hình provider tùy chỉnh, cũng hãy thêm `models.providers.<provider>.models[]` với ít nhất `id` khớp tương ứng.

### Moonshot AI (Kimi)

Cài đặt `@openclaw/moonshot-provider` trước khi thiết lập ban đầu. Chỉ thêm mục `models.providers.moonshot` tường minh khi bạn cần ghi đè URL cơ sở hoặc siêu dữ liệu mô hình:

- Provider: `moonshot`
- Xác thực: `MOONSHOT_API_KEY`
- Mô hình ví dụ: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`

ID mô hình Kimi K2:

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

Kimi Coding sử dụng điểm cuối tương thích Anthropic của Moonshot AI:

- Provider: `kimi`
- Xác thực: `KIMI_API_KEY`
- Mô hình ví dụ: `kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Các `kimi/kimi-code` và `kimi/k2p5` cũ vẫn được chấp nhận làm ID mô hình tương thích và được chuẩn hóa thành ID mô hình API ổn định của Kimi.

### Volcano Engine (Doubao)

Volcano Engine (火山引擎) cung cấp quyền truy cập vào Doubao và các mô hình khác tại Trung Quốc.

- Provider: `volcengine` (lập trình: `volcengine-plan`)
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

Quy trình thiết lập ban đầu mặc định dùng bề mặt lập trình, nhưng danh mục `volcengine/*` chung cũng được đăng ký cùng lúc.

Trong bộ chọn mô hình onboarding/configure, lựa chọn xác thực Volcengine ưu tiên cả các hàng `volcengine/*` và `volcengine-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ quay về catalog chưa lọc thay vì hiển thị bộ chọn rỗng được giới hạn theo nhà cung cấp.

<Tabs>
  <Tab title="Standard models">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

  </Tab>
  <Tab title="Coding models (volcengine-plan)">
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

Onboarding mặc định dùng bề mặt lập trình, nhưng catalog `byteplus/*` chung cũng được đăng ký cùng lúc.

Trong bộ chọn mô hình onboarding/configure, lựa chọn xác thực BytePlus ưu tiên cả các hàng `byteplus/*` và `byteplus-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ quay về catalog chưa lọc thay vì hiển thị bộ chọn rỗng được giới hạn theo nhà cung cấp.

<Tabs>
  <Tab title="Standard models">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Coding models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic cung cấp các mô hình tương thích Anthropic phía sau nhà cung cấp `synthetic`:

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

MiniMax được cấu hình qua `models.providers` vì nó dùng các điểm cuối tùy chỉnh:

- MiniMax OAuth (Toàn cầu): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Khóa API MiniMax (Toàn cầu): `--auth-choice minimax-global-api`
- Khóa API MiniMax (CN): `--auth-choice minimax-cn-api`
- Xác thực: `MINIMAX_API_KEY` cho `minimax`; `MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY` cho `minimax-portal`

Xem [/providers/minimax](/vi/providers/minimax) để biết chi tiết thiết lập, tùy chọn mô hình và đoạn cấu hình.

<Note>
Trên đường dẫn truyền phát tương thích Anthropic của MiniMax, OpenClaw tắt thinking theo mặc định cho họ M2.x trừ khi bạn đặt rõ; MiniMax-M3 (và M3.x) vẫn dùng đường dẫn thinking bị lược bỏ/thích ứng của nhà cung cấp theo mặc định. `/fast on` viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
</Note>

Phân tách năng lực do Plugin sở hữu:

- Mặc định văn bản/chat vẫn dùng `minimax/MiniMax-M3`
- Tạo ảnh là `minimax/image-01` hoặc `minimax-portal/image-01`
- Hiểu ảnh là `MiniMax-VL-01` do Plugin sở hữu trên cả hai đường dẫn xác thực MiniMax
- Tìm kiếm web vẫn dùng id nhà cung cấp `minimax`

### LM Studio

LM Studio được phát hành dưới dạng Plugin nhà cung cấp đi kèm, sử dụng API gốc:

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

OpenClaw dùng `/api/v1/models` và `/api/v1/models/load` gốc của LM Studio để khám phá + tự động tải, với `/v1/chat/completions` cho suy luận theo mặc định. Nếu bạn muốn LM Studio JIT loading, TTL và auto-evict sở hữu vòng đời mô hình, hãy đặt `models.providers.lmstudio.params.preload: false`. Xem [/providers/lmstudio](/vi/providers/lmstudio) để biết thiết lập và khắc phục sự cố.

### Ollama

Ollama được phát hành dưới dạng Plugin nhà cung cấp đi kèm và dùng API gốc của Ollama:

- Nhà cung cấp: `ollama`
- Xác thực: Không cần (máy chủ cục bộ)
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

Ollama được phát hiện cục bộ tại `http://127.0.0.1:11434` khi bạn chọn tham gia bằng `OLLAMA_API_KEY`, và Plugin nhà cung cấp đi kèm thêm Ollama trực tiếp vào `openclaw onboard` và bộ chọn mô hình. Xem [/providers/ollama](/vi/providers/ollama) để biết onboarding, chế độ đám mây/cục bộ và cấu hình tùy chỉnh.

### vLLM

vLLM được phát hành dưới dạng Plugin nhà cung cấp đi kèm cho các máy chủ cục bộ/tự lưu trữ tương thích OpenAI:

- Nhà cung cấp: `vllm`
- Xác thực: Tùy chọn (tùy thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:8000/v1`

Để chọn tham gia tự động khám phá cục bộ (bất kỳ giá trị nào cũng hoạt động nếu máy chủ của bạn không bắt buộc xác thực):

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

SGLang được phát hành dưới dạng Plugin nhà cung cấp đi kèm cho các máy chủ tự lưu trữ nhanh tương thích OpenAI:

- Nhà cung cấp: `sglang`
- Xác thực: Tùy chọn (tùy thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:30000/v1`

Để chọn tham gia tự động khám phá cục bộ (bất kỳ giá trị nào cũng hoạt động nếu máy chủ của bạn không bắt buộc xác thực):

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
  <Accordion title="Default optional fields">
    Với nhà cung cấp tùy chỉnh, `reasoning`, `input`, `cost`, `contextWindow` và `maxTokens` là tùy chọn. Khi bị lược bỏ, OpenClaw mặc định là:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Khuyến nghị: đặt các giá trị rõ ràng khớp với giới hạn proxy/mô hình của bạn.

  </Accordion>
  <Accordion title="Proxy-route shaping rules">
    - Với `api: "openai-completions"` trên các điểm cuối không gốc (bất kỳ `baseUrl` không rỗng nào có máy chủ không phải `api.openai.com`), OpenClaw buộc `compat.supportsDeveloperRole: false` để tránh lỗi 400 của nhà cung cấp cho các vai trò `developer` không được hỗ trợ.
    - Các tuyến tương thích OpenAI kiểu proxy cũng bỏ qua định hình yêu cầu chỉ dành cho OpenAI gốc: không `service_tier`, không Responses `store`, không Completions `store`, không gợi ý prompt-cache, không định hình payload tương thích reasoning của OpenAI, và không header ghi nhận OpenClaw ẩn.
    - Với proxy Completions tương thích OpenAI cần các trường riêng theo nhà cung cấp, đặt `agents.defaults.models["provider/model"].params.extra_body` (hoặc `extraBody`) để hợp nhất JSON bổ sung vào phần thân yêu cầu gửi đi.
    - Với điều khiển chat-template của vLLM, đặt `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true` cho `vllm/nemotron-3-*` khi mức thinking của phiên bị tắt.
    - Với mô hình cục bộ chậm hoặc máy chủ LAN/tailnet từ xa, đặt `models.providers.<id>.timeoutSeconds`. Điều này mở rộng xử lý yêu cầu HTTP mô hình của nhà cung cấp, bao gồm kết nối, header, truyền phát body và hủy guarded-fetch tổng thể, mà không tăng thời gian chờ toàn bộ runtime agent. Nếu `agents.defaults.timeoutSeconds` hoặc thời gian chờ riêng của lần chạy thấp hơn, cũng hãy nâng giới hạn đó; thời gian chờ của nhà cung cấp không thể kéo dài toàn bộ lần chạy.
    - Các lệnh gọi HTTP tới nhà cung cấp mô hình cho phép câu trả lời DNS fake-IP của Surge, Clash và sing-box trong `198.18.0.0/15` và `fc00::/7` chỉ cho hostname `baseUrl` của nhà cung cấp đã cấu hình. Các điểm cuối nhà cung cấp tùy chỉnh/cục bộ cũng tin cậy đúng origin `scheme://host:port` đã cấu hình đó cho yêu cầu mô hình được bảo vệ, bao gồm máy chủ loopback, LAN và tailnet. Đây không phải tùy chọn cấu hình mới; `baseUrl` bạn cấu hình chỉ mở rộng chính sách yêu cầu cho origin đó. Cho phép hostname fake-IP và tin cậy exact-origin là các cơ chế độc lập. Các đích riêng tư, loopback, link-local, metadata khác và các cổng khác vẫn yêu cầu chọn tham gia rõ ràng bằng `models.providers.<id>.request.allowPrivateNetwork: true`. Đặt `models.providers.<id>.request.allowPrivateNetwork: false` để từ chối tin cậy exact-origin.
    - Nếu `baseUrl` rỗng/bị lược bỏ, OpenClaw giữ hành vi OpenAI mặc định (phân giải tới `api.openai.com`).
    - Vì an toàn, `compat.supportsDeveloperRole: true` rõ ràng vẫn bị ghi đè trên các điểm cuối `openai-completions` không gốc.
    - Với `api: "anthropic-messages"` trên các điểm cuối không trực tiếp (bất kỳ nhà cung cấp nào ngoài `anthropic` chuẩn, hoặc `models.providers.anthropic.baseUrl` tùy chỉnh có máy chủ không phải điểm cuối `api.anthropic.com` công khai), OpenClaw chặn các header beta Anthropic ngầm định như `claude-code-20250219`, `interleaved-thinking-2025-05-14` và dấu hiệu OAuth, để các proxy tùy chỉnh tương thích Anthropic không từ chối cờ beta không được hỗ trợ. Đặt `models.providers.<id>.headers["anthropic-beta"]` rõ ràng nếu proxy của bạn cần các tính năng beta cụ thể.

  </Accordion>
</AccordionGroup>

## Ví dụ CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Xem thêm: [Cấu hình](/vi/gateway/configuration) để xem ví dụ cấu hình đầy đủ.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) - khóa cấu hình mô hình
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) - chuỗi dự phòng và hành vi thử lại
- [Mô hình](/vi/concepts/models) - cấu hình mô hình và bí danh
- [Nhà cung cấp](/vi/providers) - hướng dẫn thiết lập theo từng nhà cung cấp
