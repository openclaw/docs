---
read_when:
    - Bạn cần tài liệu tham khảo thiết lập mô hình theo từng nhà cung cấp
    - Bạn muốn cấu hình mẫu hoặc các lệnh CLI để hướng dẫn thiết lập ban đầu cho các nhà cung cấp mô hình
sidebarTitle: Model providers
summary: Tổng quan về nhà cung cấp mô hình với cấu hình mẫu + quy trình CLI
title: Nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-05-11T20:27:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8a3cde106981c2601c0b127116c8b5968a9f95571245fc795e9a181243fc3b7e
    source_path: concepts/model-providers.md
    workflow: 16
---

Tham chiếu cho **nhà cung cấp LLM/mô hình** (không phải các kênh trò chuyện như WhatsApp/Telegram). Để biết quy tắc chọn mô hình, xem [Mô hình](/vi/concepts/models).

## Quy tắc nhanh

<AccordionGroup>
  <Accordion title="Tham chiếu mô hình và trình trợ giúp CLI">
    - Tham chiếu mô hình dùng `provider/model` (ví dụ: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` hoạt động như danh sách cho phép khi được đặt.
    - Trình trợ giúp CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` đặt mặc định cấp nhà cung cấp; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` ghi đè chúng theo từng mô hình.
    - Quy tắc dự phòng, thăm dò thời gian chờ, và lưu giữ ghi đè phiên: [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

  </Accordion>
  <Accordion title="Thêm xác thực nhà cung cấp không thay đổi mô hình chính của bạn">
    `openclaw configure` giữ nguyên `agents.defaults.model.primary` hiện có khi bạn thêm hoặc xác thực lại một nhà cung cấp. `openclaw models auth login` cũng làm như vậy trừ khi bạn truyền `--set-default`. Các Plugin nhà cung cấp vẫn có thể trả về một mô hình mặc định được đề xuất trong bản vá cấu hình xác thực của chúng, nhưng OpenClaw xử lý điều đó là "cho phép dùng mô hình này" khi một mô hình chính đã tồn tại, không phải "thay thế mô hình chính hiện tại."

    Để chủ động chuyển mô hình mặc định, dùng `openclaw models set <provider/model>` hoặc `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Phân tách nhà cung cấp/môi trường chạy OpenAI">
    Các tuyến thuộc họ OpenAI phụ thuộc vào tiền tố:

    - `openai/<model>` dùng khung chạy máy chủ ứng dụng Codex gốc cho các lượt tác tử theo mặc định. Đây là thiết lập đăng ký ChatGPT/Codex thông thường.
    - `openai-codex/<model>` là cấu hình cũ mà doctor viết lại thành `openai/<model>`.
    - `openai/<model>` cộng với `agentRuntime.id: "pi"` của nhà cung cấp/mô hình dùng PI cho các tuyến khóa API rõ ràng hoặc tuyến tương thích.

    Xem [OpenAI](/vi/providers/openai) và [khung chạy Codex](/vi/plugins/codex-harness). Nếu việc phân tách nhà cung cấp/môi trường chạy gây khó hiểu, hãy đọc [Môi trường chạy tác tử](/vi/concepts/agent-runtimes) trước.

    Tự động bật Plugin tuân theo cùng ranh giới: tham chiếu tác tử `openai/*` bật Plugin Codex cho tuyến mặc định, và `agentRuntime.id: "codex"` rõ ràng của nhà cung cấp/mô hình hoặc tham chiếu `codex/<model>` cũ cũng yêu cầu Plugin đó.

    GPT-5.5 có sẵn thông qua khung chạy máy chủ ứng dụng Codex gốc theo mặc định trên `openai/gpt-5.5`, và thông qua PI chỉ khi chính sách môi trường chạy nhà cung cấp/mô hình chọn rõ ràng `pi`.

  </Accordion>
  <Accordion title="Môi trường chạy CLI">
    Môi trường chạy CLI dùng cùng cách phân tách: chọn tham chiếu mô hình chuẩn như `anthropic/claude-*`, `google/gemini-*`, hoặc `openai/gpt-*`, rồi đặt chính sách môi trường chạy nhà cung cấp/mô hình thành `claude-cli`, `google-gemini-cli`, hoặc `codex-cli` khi bạn muốn một phần phụ trợ CLI cục bộ.

    Các tham chiếu cũ `claude-cli/*`, `google-gemini-cli/*`, và `codex-cli/*` được di chuyển lại về tham chiếu nhà cung cấp chuẩn, với môi trường chạy được ghi riêng.

  </Accordion>
</AccordionGroup>

## Hành vi nhà cung cấp do Plugin sở hữu

Hầu hết logic riêng theo nhà cung cấp nằm trong các Plugin nhà cung cấp (`registerProvider(...)`) trong khi OpenClaw giữ vòng lặp suy luận chung. Plugin sở hữu onboarding, danh mục mô hình, ánh xạ biến môi trường xác thực, chuẩn hóa truyền tải/cấu hình, dọn dẹp schema công cụ, phân loại chuyển đổi dự phòng, làm mới OAuth, báo cáo mức sử dụng, hồ sơ suy nghĩ/lập luận, và nhiều phần khác.

Danh sách đầy đủ các điểm móc SDK nhà cung cấp và ví dụ Plugin đi kèm nằm trong [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins). Một nhà cung cấp cần bộ thực thi yêu cầu hoàn toàn tùy chỉnh là một bề mặt mở rộng riêng và sâu hơn.

<Note>
Hành vi trình chạy do nhà cung cấp sở hữu nằm trên các điểm móc nhà cung cấp rõ ràng như chính sách phát lại, chuẩn hóa schema công cụ, bọc luồng, và trình trợ giúp truyền tải/yêu cầu. Bộ chứa tĩnh `ProviderPlugin.capabilities` cũ chỉ dành cho tương thích và không còn được logic trình chạy dùng chung đọc nữa.
</Note>

## Xoay vòng khóa API

<AccordionGroup>
  <Accordion title="Nguồn khóa và mức ưu tiên">
    Cấu hình nhiều khóa qua:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè trực tiếp đơn lẻ, ưu tiên cao nhất)
    - `<PROVIDER>_API_KEYS` (danh sách phân tách bằng dấu phẩy hoặc dấu chấm phẩy)
    - `<PROVIDER>_API_KEY` (khóa chính)
    - `<PROVIDER>_API_KEY_*` (danh sách đánh số, ví dụ `<PROVIDER>_API_KEY_1`)

    Với nhà cung cấp Google, `GOOGLE_API_KEY` cũng được đưa vào làm dự phòng. Thứ tự chọn khóa giữ nguyên mức ưu tiên và loại bỏ giá trị trùng lặp.

  </Accordion>
  <Accordion title="Khi việc xoay vòng được kích hoạt">
    - Yêu cầu chỉ được thử lại bằng khóa tiếp theo khi có phản hồi giới hạn tốc độ (ví dụ `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, hoặc thông báo định kỳ về giới hạn sử dụng).
    - Lỗi không phải giới hạn tốc độ sẽ thất bại ngay; không thử xoay vòng khóa.
    - Khi tất cả khóa ứng viên đều thất bại, lỗi cuối cùng được trả về từ lần thử cuối.

  </Accordion>
</AccordionGroup>

## Nhà cung cấp tích hợp sẵn (danh mục pi-ai)

OpenClaw đi kèm danh mục pi-ai. Các nhà cung cấp này **không** yêu cầu cấu hình `models.providers`; chỉ cần đặt xác thực + chọn một mô hình.

### OpenAI

- Nhà cung cấp: `openai`
- Xác thực: `OPENAI_API_KEY`
- Xoay vòng tùy chọn: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, cộng với `OPENCLAW_LIVE_OPENAI_KEY` (ghi đè đơn lẻ)
- Mô hình ví dụ: `openai/gpt-5.5`, `openai/gpt-5.4-mini`
- Xác minh tài khoản/tính khả dụng của mô hình bằng `openclaw models list --provider openai` nếu một bản cài đặt hoặc khóa API cụ thể hoạt động khác.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Truyền tải mặc định là `auto`; OpenClaw chuyển lựa chọn truyền tải cho pi-ai.
- Ghi đè theo từng mô hình qua `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- Có thể bật xử lý ưu tiên của OpenAI qua `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` và `params.fastMode` ánh xạ các yêu cầu Responses trực tiếp `openai/*` thành `service_tier=priority` trên `api.openai.com`
- Dùng `params.serviceTier` khi bạn muốn một tầng rõ ràng thay vì nút bật/tắt `/fast` dùng chung
- Các header ghi nhận nguồn gốc OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ áp dụng trên lưu lượng OpenAI gốc đến `api.openai.com`, không áp dụng cho proxy tương thích OpenAI chung
- Các tuyến OpenAI gốc cũng giữ Responses `store`, gợi ý bộ nhớ đệm lời nhắc, và định dạng dữ liệu gửi đi tương thích lập luận của OpenAI; tuyến proxy thì không
- `openai/gpt-5.3-codex-spark` được cố ý ẩn trong OpenClaw vì các yêu cầu API OpenAI thực tế từ chối nó và danh mục Codex hiện tại không hiển thị nó

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Nhà cung cấp: `anthropic`
- Xác thực: `ANTHROPIC_API_KEY`
- Xoay vòng tùy chọn: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, cộng với `OPENCLAW_LIVE_ANTHROPIC_KEY` (ghi đè đơn lẻ)
- Mô hình ví dụ: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Yêu cầu Anthropic công khai trực tiếp hỗ trợ nút bật/tắt `/fast` dùng chung và `params.fastMode`, bao gồm lưu lượng khóa API và lưu lượng được xác thực bằng OAuth gửi đến `api.anthropic.com`; OpenClaw ánh xạ điều đó sang `service_tier` của Anthropic (`auto` so với `standard_only`)
- Cấu hình Claude CLI được ưu tiên giữ tham chiếu mô hình ở dạng chuẩn và chọn phần phụ trợ CLI
  riêng: `anthropic/claude-opus-4-7` với
  `agentRuntime.id: "claude-cli"` theo phạm vi mô hình. Các tham chiếu cũ
  `claude-cli/claude-opus-4-7` vẫn hoạt động để tương thích.

<Note>
Nhân viên Anthropic đã cho chúng tôi biết việc dùng Claude CLI kiểu OpenClaw được cho phép trở lại, nên OpenClaw xem việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới. setup-token Anthropic vẫn có sẵn như một đường dẫn token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Nhà cung cấp: `openai-codex`
- Xác thực: OAuth (ChatGPT)
- Tham chiếu mô hình PI cũ: `openai-codex/gpt-5.5`
- Tham chiếu khung chạy máy chủ ứng dụng Codex gốc: `openai/gpt-5.5`
- Tài liệu khung chạy máy chủ ứng dụng Codex gốc: [khung chạy Codex](/vi/plugins/codex-harness)
- Tham chiếu mô hình cũ: `codex/gpt-*`
- Ranh giới Plugin: `openai-codex/*` tải Plugin OpenAI; Plugin máy chủ ứng dụng Codex gốc chỉ được chọn bởi môi trường chạy khung chạy Codex hoặc tham chiếu `codex/*` cũ.
- CLI: `openclaw onboard --auth-choice openai-codex` hoặc `openclaw models auth login --provider openai-codex`
- Truyền tải mặc định là `auto` (ưu tiên WebSocket, dự phòng SSE)
- Ghi đè theo từng mô hình PI qua `agents.defaults.models["openai-codex/<model>"].params.transport` (`"sse"`, `"websocket"`, hoặc `"auto"`)
- `params.serviceTier` cũng được chuyển tiếp trên các yêu cầu Responses Codex gốc (`chatgpt.com/backend-api`)
- Các header ghi nhận nguồn gốc OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ được gắn trên lưu lượng Codex gốc đến `chatgpt.com/backend-api`, không phải proxy tương thích OpenAI chung
- Chia sẻ cùng nút bật/tắt `/fast` và cấu hình `params.fastMode` như `openai/*` trực tiếp; OpenClaw ánh xạ điều đó thành `service_tier=priority`
- `openai-codex/gpt-5.5` dùng `contextWindow = 400000` gốc của danh mục Codex và môi trường chạy mặc định `contextTokens = 272000`; ghi đè giới hạn môi trường chạy bằng `models.providers.openai-codex.models[].contextTokens`
- Ghi chú chính sách: OpenAI Codex OAuth được hỗ trợ rõ ràng cho công cụ/quy trình làm việc bên ngoài như OpenClaw.
- Đối với tuyến phổ biến dùng gói đăng ký cùng môi trường chạy Codex gốc, đăng nhập bằng xác thực `openai-codex` nhưng cấu hình `openai/gpt-5.5`; các lượt tác tử OpenAI chọn Codex theo mặc định.
- Chỉ dùng `agentRuntime.id: "pi"` của nhà cung cấp/mô hình khi bạn muốn tuyến tương thích qua PI; nếu không, hãy giữ `openai/gpt-5.5` trên khung chạy Codex mặc định.
- Các tham chiếu `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*`, và `openai-codex/gpt-5.3*` cũ hơn bị ẩn vì tài khoản ChatGPT/Codex OAuth từ chối chúng; hãy dùng `openai-codex/gpt-5.5` hoặc tuyến môi trường chạy Codex gốc thay vào đó.

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
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### Các tùy chọn được lưu trữ kiểu đăng ký khác

<CardGroup cols={3}>
  <Card title="Mô hình GLM" href="/vi/providers/glm">
    Z.AI Coding Plan hoặc các điểm cuối API chung.
  </Card>
  <Card title="MiniMax" href="/vi/providers/minimax">
    OAuth MiniMax Coding Plan hoặc truy cập bằng khóa API.
  </Card>
  <Card title="Qwen Cloud" href="/vi/providers/qwen">
    Bề mặt nhà cung cấp Qwen Cloud cộng với ánh xạ điểm cuối Alibaba DashScope và Coding Plan.
  </Card>
</CardGroup>

### OpenCode

- Xác thực: `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`)
- Nhà cung cấp môi trường chạy Zen: `opencode`
- Nhà cung cấp môi trường chạy Go: `opencode-go`
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
- Luân phiên tùy chọn: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, dự phòng `GOOGLE_API_KEY`, và `OPENCLAW_LIVE_GEMINI_KEY` (ghi đè đơn lẻ)
- Mô hình ví dụ: `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview`
- Khả năng tương thích: cấu hình OpenClaw cũ dùng `google/gemini-3.1-flash-preview` được chuẩn hóa thành `google/gemini-3-flash-preview`
- Bí danh: `google/gemini-3.1-pro` được chấp nhận và chuẩn hóa thành id Gemini API trực tiếp của Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Suy nghĩ: `/think adaptive` dùng suy nghĩ động của Google. Gemini 3/3.1 bỏ qua `thinkingLevel` cố định; Gemini 2.5 gửi `thinkingBudget: -1`.
- Các lần chạy Gemini trực tiếp cũng chấp nhận `agents.defaults.models["google/<model>"].params.cachedContent` (hoặc `cached_content` cũ) để chuyển tiếp một handle `cachedContents/...` nguyên bản của nhà cung cấp; các lần trúng bộ nhớ đệm Gemini hiển thị dưới dạng `cacheRead` của OpenClaw

### Google Vertex và Gemini CLI

- Nhà cung cấp: `google-vertex`, `google-gemini-cli`
- Xác thực: Vertex dùng gcloud ADC; Gemini CLI dùng luồng OAuth của nó

<Warning>
Gemini CLI OAuth trong OpenClaw là một tích hợp không chính thức. Một số người dùng đã báo cáo tài khoản Google bị hạn chế sau khi sử dụng ứng dụng khách bên thứ ba. Hãy xem lại điều khoản của Google và dùng một tài khoản không quan trọng nếu bạn chọn tiếp tục.
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

Các phản hồi JSON của Gemini CLI được phân tích từ `response`; usage dự phòng về `stats`, với `stats.cached` được chuẩn hóa thành `cacheRead` của OpenClaw.

### Z.AI (GLM)

- Nhà cung cấp: `zai`
- Xác thực: `ZAI_API_KEY`
- Mô hình ví dụ: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Bí danh: `z.ai/*` và `z-ai/*` chuẩn hóa thành `zai/*`
  - `zai-api-key` tự động phát hiện endpoint Z.AI khớp; `zai-coding-global`, `zai-coding-cn`, `zai-global`, và `zai-cn` buộc dùng một surface cụ thể

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
- Base URL: `https://api.kilo.ai/api/gateway/`
- Danh mục dự phòng tĩnh phát hành kèm `kilocode/kilo/auto`; khám phá trực tiếp `https://api.kilo.ai/api/gateway/models` có thể mở rộng thêm danh mục runtime.
- Định tuyến upstream chính xác phía sau `kilocode/kilo/auto` do Kilo Gateway sở hữu, không được hard-code trong OpenClaw.

Xem [/providers/kilocode](/vi/providers/kilocode) để biết chi tiết thiết lập.

### Các Plugin nhà cung cấp đi kèm khác

| Nhà cung cấp            | Id                               | Biến môi trường xác thực                                    | Mô hình ví dụ                                 |
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
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` hoặc `KIMICODE_API_KEY`                       | `kimi/kimi-for-coding`                        |
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

#### Những điểm đặc thù cần biết

<AccordionGroup>
  <Accordion title="OpenRouter">
    Chỉ áp dụng các header quy gán ứng dụng và marker `cache_control` của Anthropic trên các tuyến `openrouter.ai` đã xác minh. Các ref DeepSeek, Moonshot và ZAI đủ điều kiện cache-TTL cho bộ nhớ đệm prompt do OpenRouter quản lý nhưng không nhận marker bộ nhớ đệm Anthropic. Là một đường dẫn tương thích OpenAI theo kiểu proxy, nó bỏ qua việc định hình chỉ dành riêng cho OpenAI gốc (`serviceTier`, Responses `store`, gợi ý prompt-cache, tương thích suy luận OpenAI). Các ref dùng Gemini vẫn chỉ giữ lại bước vệ sinh chữ ký suy nghĩ proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Các ref dùng Gemini đi theo cùng đường dẫn vệ sinh proxy-Gemini; `kilocode/kilo/auto` và các ref khác không hỗ trợ proxy-reasoning sẽ bỏ qua việc chèn suy luận proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Quy trình onboarding bằng API-key ghi các định nghĩa mô hình chat M2.7 chỉ văn bản một cách tường minh; hiểu hình ảnh vẫn nằm trên nhà cung cấp media `MiniMax-VL-01` do Plugin sở hữu.
  </Accordion>
  <Accordion title="NVIDIA">
    ID mô hình dùng namespace `nvidia/<vendor>/<model>` (ví dụ `nvidia/nvidia/nemotron-...` cùng với `nvidia/moonshotai/kimi-k2.5`); các bộ chọn giữ nguyên cấu trúc `<provider>/<model-id>` theo nghĩa đen trong khi khóa chuẩn gửi tới API vẫn chỉ có một tiền tố.
  </Accordion>
  <Accordion title="xAI">
    Dùng đường dẫn xAI Responses. `grok-4.3` là mô hình chat mặc định được đóng gói. `/fast` hoặc `params.fastMode: true` viết lại `grok-3`, `grok-3-mini`, `grok-4` và `grok-4-0709` thành các biến thể `*-fast` tương ứng. `tool_stream` bật mặc định; tắt qua `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
  <Accordion title="Cerebras">
    Được phát hành dưới dạng Plugin nhà cung cấp `cerebras` được đóng gói. GLM dùng `zai-glm-4.7`; URL cơ sở tương thích OpenAI là `https://api.cerebras.ai/v1`.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp qua `models.providers` (URL tùy chỉnh/cơ sở)

Dùng `models.providers` (hoặc `models.json`) để thêm các nhà cung cấp **tùy chỉnh** hoặc proxy tương thích OpenAI/Anthropic.

Nhiều Plugin nhà cung cấp được đóng gói bên dưới đã xuất bản một danh mục mặc định. Chỉ dùng các mục `models.providers.<id>` tường minh khi bạn muốn ghi đè URL cơ sở, header hoặc danh sách mô hình mặc định.

Các kiểm tra khả năng mô hình của Gateway cũng đọc metadata `models.providers.<id>.models[]` tường minh. Nếu một mô hình tùy chỉnh hoặc proxy chấp nhận hình ảnh, hãy đặt `input: ["text", "image"]` trên mô hình đó để WebChat và các đường dẫn tệp đính kèm có nguồn gốc node chuyển hình ảnh dưới dạng đầu vào mô hình gốc thay vì ref media chỉ văn bản.

`agents.defaults.models["provider/model"]` chỉ kiểm soát khả năng hiển thị mô hình, bí danh và metadata theo từng mô hình cho agent. Tự nó không đăng ký một mô hình runtime mới. Với mô hình nhà cung cấp tùy chỉnh, cũng thêm `models.providers.<provider>.models[]` với ít nhất `id` khớp.

### Moonshot AI (Kimi)

Moonshot được phát hành dưới dạng Plugin nhà cung cấp được đóng gói. Dùng nhà cung cấp tích hợp theo mặc định, và chỉ thêm mục `models.providers.moonshot` tường minh khi bạn cần ghi đè URL cơ sở hoặc metadata mô hình:

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

Kimi Coding sử dụng endpoint tương thích Anthropic của Moonshot AI:

- Nhà cung cấp: `kimi`
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

Các `kimi/kimi-code` và `kimi/k2p5` cũ vẫn được chấp nhận làm id mô hình tương thích và được chuẩn hóa thành id mô hình API ổn định của Kimi.

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

Onboarding mặc định dùng bề mặt lập trình, nhưng catalog `volcengine/*` chung cũng được đăng ký cùng lúc.

Trong các trình chọn mô hình khi onboarding/cấu hình, lựa chọn xác thực Volcengine ưu tiên cả các hàng `volcengine/*` và `volcengine-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ quay về catalog không lọc thay vì hiển thị trình chọn theo phạm vi nhà cung cấp trống.

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

Onboarding mặc định dùng bề mặt lập trình, nhưng catalog `byteplus/*` chung cũng được đăng ký cùng lúc.

Trong các trình chọn mô hình khi onboarding/cấu hình, lựa chọn xác thực BytePlus ưu tiên cả các hàng `byteplus/*` và `byteplus-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ quay về catalog không lọc thay vì hiển thị trình chọn theo phạm vi nhà cung cấp trống.

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

MiniMax được cấu hình qua `models.providers` vì nó dùng các endpoint tùy chỉnh:

- MiniMax OAuth (Toàn cầu): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Khóa API MiniMax (Toàn cầu): `--auth-choice minimax-global-api`
- Khóa API MiniMax (CN): `--auth-choice minimax-cn-api`
- Xác thực: `MINIMAX_API_KEY` cho `minimax`; `MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY` cho `minimax-portal`

Xem [/providers/minimax](/vi/providers/minimax) để biết chi tiết thiết lập, tùy chọn mô hình và đoạn cấu hình.

<Note>
Trên đường dẫn phát luồng tương thích Anthropic của MiniMax, OpenClaw mặc định tắt thinking trừ khi bạn đặt rõ ràng, và `/fast on` viết lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
</Note>

Tách capability do Plugin sở hữu:

- Mặc định văn bản/chat vẫn dùng `minimax/MiniMax-M2.7`
- Tạo hình ảnh là `minimax/image-01` hoặc `minimax-portal/image-01`
- Hiểu hình ảnh là `MiniMax-VL-01` do Plugin sở hữu trên cả hai đường dẫn xác thực MiniMax
- Tìm kiếm web vẫn dùng id nhà cung cấp `minimax`

### LM Studio

LM Studio được phát hành dưới dạng Plugin nhà cung cấp đi kèm sử dụng API gốc:

- Nhà cung cấp: `lmstudio`
- Xác thực: `LM_API_TOKEN`
- URL cơ sở suy luận mặc định: `http://localhost:1234/v1`

Sau đó đặt một mô hình (thay bằng một trong các ID được trả về bởi `http://localhost:1234/api/v1/models`):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw sử dụng `/api/v1/models` và `/api/v1/models/load` gốc của LM Studio để khám phá + tự động tải, với `/v1/chat/completions` để suy luận theo mặc định. Nếu bạn muốn việc tải JIT, TTL và tự động loại bỏ của LM Studio sở hữu vòng đời mô hình, hãy đặt `models.providers.lmstudio.params.preload: false`. Xem [/providers/lmstudio](/vi/providers/lmstudio) để thiết lập và xử lý sự cố.

### Ollama

Ollama được phát hành dưới dạng Plugin nhà cung cấp đi kèm và sử dụng API gốc của Ollama:

- Nhà cung cấp: `ollama`
- Xác thực: Không yêu cầu (máy chủ cục bộ)
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

Ollama được phát hiện cục bộ tại `http://127.0.0.1:11434` khi bạn chọn tham gia bằng `OLLAMA_API_KEY`, và Plugin nhà cung cấp đi kèm thêm Ollama trực tiếp vào `openclaw onboard` và trình chọn mô hình. Xem [/providers/ollama](/vi/providers/ollama) để biết onboarding, chế độ cloud/cục bộ và cấu hình tùy chỉnh.

### vLLM

vLLM được phát hành dưới dạng Plugin nhà cung cấp đi kèm cho các máy chủ cục bộ/tự lưu trữ tương thích OpenAI:

- Nhà cung cấp: `vllm`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:8000/v1`

Để chọn tham gia tự động khám phá cục bộ (bất kỳ giá trị nào cũng được nếu máy chủ của bạn không thực thi xác thực):

```bash
export VLLM_API_KEY="vllm-local"
```

Sau đó đặt một mô hình (thay bằng một trong các ID được trả về bởi `/v1/models`):

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
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:30000/v1`

Để chọn tham gia tự động khám phá cục bộ (bất kỳ giá trị nào cũng được nếu máy chủ của bạn không thực thi xác thực):

```bash
export SGLANG_API_KEY="sglang-local"
```

Sau đó đặt một mô hình (thay bằng một trong các ID được trả về bởi `/v1/models`):

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
    - Với `api: "openai-completions"` trên endpoint không gốc (bất kỳ `baseUrl` không rỗng nào có host không phải `api.openai.com`), OpenClaw ép `compat.supportsDeveloperRole: false` để tránh lỗi 400 của nhà cung cấp đối với các vai trò `developer` không được hỗ trợ.
    - Các tuyến kiểu proxy tương thích OpenAI cũng bỏ qua việc định hình yêu cầu chỉ dành cho OpenAI gốc: không có `service_tier`, không có Responses `store`, không có Completions `store`, không có gợi ý prompt-cache, không định hình payload tương thích reasoning của OpenAI, và không có header quy kết OpenClaw ẩn.
    - Với các proxy Completions tương thích OpenAI cần trường riêng theo nhà cung cấp, hãy đặt `agents.defaults.models["provider/model"].params.extra_body` (hoặc `extraBody`) để hợp nhất JSON bổ sung vào thân yêu cầu gửi đi.
    - Với các điều khiển chat-template của vLLM, hãy đặt `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Plugin vLLM đi kèm tự động gửi `enable_thinking: false` và `force_nonempty_content: true` cho `vllm/nemotron-3-*` khi mức thinking của phiên tắt.
    - Với các mô hình cục bộ chậm hoặc host LAN/tailnet từ xa, hãy đặt `models.providers.<id>.timeoutSeconds`. Thiết lập này kéo dài xử lý yêu cầu HTTP của nhà cung cấp mô hình, bao gồm kết nối, header, phát luồng body và hủy guarded-fetch tổng thể, mà không tăng timeout toàn bộ runtime của agent.
    - Các lệnh gọi HTTP của nhà cung cấp mô hình cho phép câu trả lời DNS fake-IP của Surge, Clash và sing-box trong `198.18.0.0/15` và `fc00::/7` chỉ cho tên máy chủ `baseUrl` của nhà cung cấp đã cấu hình. Các đích private, loopback, link-local và metadata khác vẫn yêu cầu chọn tham gia rõ ràng bằng `models.providers.<id>.request.allowPrivateNetwork: true`.
    - Nếu `baseUrl` rỗng/bị bỏ qua, OpenClaw giữ hành vi OpenAI mặc định (phân giải tới `api.openai.com`).
    - Để an toàn, một `compat.supportsDeveloperRole: true` rõ ràng vẫn bị ghi đè trên các endpoint `openai-completions` không gốc.
    - Với `api: "anthropic-messages"` trên endpoint không trực tiếp (bất kỳ nhà cung cấp nào khác `anthropic` chuẩn, hoặc `models.providers.anthropic.baseUrl` tùy chỉnh có host không phải endpoint công khai `api.anthropic.com`), OpenClaw chặn các header beta Anthropic ngầm định như `claude-code-20250219`, `interleaved-thinking-2025-05-14` và marker OAuth, để các proxy tương thích Anthropic tùy chỉnh không từ chối các cờ beta không được hỗ trợ. Đặt rõ `models.providers.<id>.headers["anthropic-beta"]` nếu proxy của bạn cần các tính năng beta cụ thể.

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

- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) - khóa cấu hình mô hình
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) - chuỗi dự phòng và hành vi thử lại
- [Mô hình](/vi/concepts/models) - cấu hình mô hình và bí danh
- [Nhà cung cấp](/vi/providers) - hướng dẫn thiết lập theo từng nhà cung cấp
