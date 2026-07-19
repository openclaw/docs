---
read_when:
    - Bạn cần tài liệu tham khảo về cách thiết lập mô hình cho từng nhà cung cấp
    - Bạn muốn xem cấu hình mẫu hoặc các lệnh hướng dẫn thiết lập CLI cho nhà cung cấp mô hình
sidebarTitle: Model providers
summary: Tổng quan về nhà cung cấp mô hình, kèm cấu hình mẫu và luồng CLI
title: Nhà cung cấp mô hình
x-i18n:
    generated_at: "2026-07-19T05:43:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4c0240811ced123bb58c862b08bb91110d211bc74074f7a48acb5bb87295838d
    source_path: concepts/model-providers.md
    workflow: 16
---

Tài liệu tham khảo về **nhà cung cấp LLM/mô hình** (không phải các kênh trò chuyện như WhatsApp/Telegram). Để biết quy tắc lựa chọn mô hình, xem [Mô hình](/vi/concepts/models).

## Quy tắc nhanh

<AccordionGroup>
  <Accordion title="Tham chiếu mô hình và trình trợ giúp CLI">
    - Tham chiếu mô hình sử dụng `provider/model` (ví dụ: `opencode/claude-opus-4-6`).
    - `agents.defaults.models` lưu bí danh và cài đặt theo từng mô hình; `agents.defaults.modelPolicy.allow` là danh sách cho phép ghi đè tường minh không bắt buộc.
    - Trình trợ giúp CLI: `openclaw onboard`, `openclaw models list`, `openclaw models set <provider/model>`.
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` đặt giá trị mặc định ở cấp nhà cung cấp; `models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` ghi đè chúng theo từng mô hình.
    - Quy tắc dự phòng, phép thăm dò thời gian chờ và khả năng duy trì ghi đè phiên: [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

  </Accordion>
  <Accordion title="Thêm xác thực nhà cung cấp không thay đổi mô hình chính">
    `openclaw configure` giữ nguyên `agents.defaults.model.primary` hiện có khi bạn thêm hoặc xác thực lại một nhà cung cấp. `openclaw models auth login` cũng làm như vậy trừ khi bạn truyền `--set-default`. Plugin nhà cung cấp vẫn có thể trả về mô hình mặc định được đề xuất trong bản vá cấu hình xác thực, nhưng khi đã có mô hình chính, OpenClaw xem đó là "cung cấp mô hình này để sử dụng", chứ không phải "thay thế mô hình chính hiện tại".

    Để chủ động chuyển đổi mô hình mặc định, hãy sử dụng `openclaw models set <provider/model>` hoặc `openclaw models auth login --provider <id> --set-default`.

  </Accordion>
  <Accordion title="Phân tách nhà cung cấp/môi trường thực thi OpenAI">
    Tham chiếu mô hình OpenAI và môi trường thực thi tác nhân là hai phần riêng biệt:

    - `openai/<model>` chọn nhà cung cấp và mô hình OpenAI chính thức. Chỉ riêng tiền tố không bao giờ chọn Codex.
    - Khi chính sách môi trường thực thi của nhà cung cấp/mô hình chưa được đặt hoặc là `auto`, OpenAI chỉ có thể chọn ngầm Codex cho đúng một tuyến Platform Responses HTTPS chính thức hoặc ChatGPT Responses không có ghi đè yêu cầu do người dùng thiết lập.
    - Các bộ điều hợp Completions do người dùng thiết lập, điểm cuối tùy chỉnh và tuyến có hành vi yêu cầu do người dùng thiết lập vẫn chạy trên OpenClaw. Các điểm cuối HTTP văn bản thuần chính thức bị từ chối.
    - Các tham chiếu mô hình Codex cũ là cấu hình cũ mà doctor viết lại thành `openai/<model>`.
    - `agentRuntime.id: "openclaw"` của nhà cung cấp/mô hình tường minh giữ một tuyến vốn đủ điều kiện trên OpenClaw. `agentRuntime.id: "codex"` yêu cầu Codex và từ chối an toàn khi tuyến hiệu lực không tương thích với Codex.

    Xem [Môi trường thực thi tác nhân OpenAI ngầm định](/vi/providers/openai#implicit-agent-runtime) và [Bộ khung Codex](/vi/plugins/codex-harness). Nếu việc phân tách nhà cung cấp/môi trường thực thi gây khó hiểu, trước tiên hãy đọc [Môi trường thực thi tác nhân](/vi/concepts/agent-runtimes).

    Tự động bật Plugin tuân theo cùng ranh giới: một tuyến hiệu lực ngầm tương thích với Codex có thể bật Plugin Codex, trong khi `agentRuntime.id: "codex"` tường minh của nhà cung cấp/mô hình hoặc tham chiếu `codex/<model>` cũ yêu cầu Plugin này. Chỉ riêng tiền tố `openai/*` thì không.

    Thiết lập OpenAI mới sử dụng tham chiếu GPT-5.6 dành riêng cho từng tuyến: thiết lập bằng khóa API chọn
    `openai/gpt-5.6` (mã API trực tiếp trần phân giải thành Sol), trong khi
    OAuth ChatGPT/Codex chọn chính xác `openai/gpt-5.6-sol` cho danh mục Codex
    gốc. Các mô hình chính tường minh hiện có, bao gồm `openai/gpt-5.5`, được
    giữ nguyên khi thêm hoặc làm mới xác thực OpenAI. GPT-5.5 vẫn khả dụng
    thông qua một trong hai môi trường thực thi như một lựa chọn khôi phục tường minh cho các tài khoản không
    có quyền truy cập GPT-5.6.

  </Accordion>
  <Accordion title="Môi trường thực thi CLI">
    Môi trường thực thi CLI sử dụng cùng cách phân tách: chọn tham chiếu mô hình chính thức như `anthropic/claude-*` hoặc `google/gemini-*`, sau đó đặt chính sách môi trường thực thi của nhà cung cấp/mô hình thành `claude-cli` hoặc `google-gemini-cli` khi bạn muốn dùng phần phụ trợ CLI cục bộ.

    Các tham chiếu `claude-cli/*` và `google-gemini-cli/*` cũ được di chuyển trở lại tham chiếu nhà cung cấp chính thức, còn môi trường thực thi được ghi riêng. Các tham chiếu `codex-cli/*` cũ được di chuyển sang `openai/*` và sử dụng tuyến máy chủ ứng dụng Codex; OpenClaw không còn duy trì phần phụ trợ Codex CLI đóng gói sẵn.

  </Accordion>
</AccordionGroup>

## Cấu hình nhà cung cấp trong giao diện điều khiển

Mở **Settings → Model Providers** trong giao diện điều khiển để thêm, thay thế hoặc xóa các khóa API nhà cung cấp được lưu trong `models.providers.<id>.apiKey`. Trang này xác định mỗi khóa API đến từ cấu hình OpenClaw hay biến môi trường mà không hiển thị thông tin xác thực. Các khóa do môi trường cung cấp vẫn được quản lý bởi môi trường tiến trình Gateway.

Sử dụng **Test connection** để chạy phép thăm dò trực tiếp nhà cung cấp và xem độ trễ hoặc lỗi đã phân loại về xác thực, giới hạn tốc độ, thanh toán, hết thời gian chờ hay phản hồi. Phép thăm dò gửi yêu cầu thực sự tới nhà cung cấp và có thể tiêu thụ một lượng nhỏ token. Bạn cũng có thể đăng xuất khỏi hồ sơ OAuth và token trên thẻ nhà cung cấp.

Thẻ **Default models** quản lý mô hình chính, các mô hình dự phòng có thứ tự và mô hình tiện ích từ danh mục mô hình đã cấu hình. Chọn các mô hình, sau đó lưu chúng cùng nhau vào các cài đặt `agents.defaults.model` và `agents.defaults.utilityModel` hiện có. Đối với mô hình tiện ích, **Automatic** để cài đặt ở trạng thái chưa thiết lập và **Disabled** lưu một chuỗi rỗng để tắt định tuyến tiện ích.

## Hành vi nhà cung cấp do Plugin sở hữu

Phần lớn logic dành riêng cho nhà cung cấp nằm trong các Plugin nhà cung cấp (`registerProvider(...)`), còn OpenClaw duy trì vòng lặp suy luận chung. Các Plugin sở hữu quy trình thiết lập ban đầu, danh mục mô hình, ánh xạ biến môi trường xác thực, chuẩn hóa giao vận/cấu hình, dọn dẹp lược đồ công cụ, phân loại chuyển đổi dự phòng, làm mới OAuth, báo cáo mức sử dụng, hồ sơ tư duy/suy luận và nhiều chức năng khác.

Danh sách đầy đủ các hook SDK nhà cung cấp và ví dụ Plugin đóng gói sẵn nằm trong [Plugin nhà cung cấp](/vi/plugins/sdk-provider-plugins). Nhà cung cấp cần một trình thực thi yêu cầu hoàn toàn tùy chỉnh là một bề mặt mở rộng riêng biệt và chuyên sâu hơn.

<Note>
Hành vi trình chạy do nhà cung cấp sở hữu nằm trên các hook nhà cung cấp tường minh như chính sách phát lại, chuẩn hóa lược đồ công cụ, bao luồng và trình trợ giúp giao vận/yêu cầu. Túi tĩnh `ProviderPlugin.capabilities` cũ chỉ dành cho khả năng tương thích và logic trình chạy dùng chung không còn đọc nó.
</Note>

## Luân phiên khóa API

<AccordionGroup>
  <Accordion title="Nguồn khóa và mức ưu tiên">
    Cấu hình nhiều khóa qua:

    - `OPENCLAW_LIVE_<PROVIDER>_KEY` (ghi đè trực tiếp duy nhất, mức ưu tiên cao nhất)
    - `<PROVIDER>_API_KEYS` (danh sách phân tách bằng dấu phẩy hoặc dấu chấm phẩy)
    - `<PROVIDER>_API_KEY` (khóa chính)
    - `<PROVIDER>_API_KEY_*` (danh sách được đánh số, ví dụ `<PROVIDER>_API_KEY_1`)

    Đối với các nhà cung cấp Google, `GOOGLE_API_KEY` cũng được dùng làm phương án dự phòng. Thứ tự chọn khóa giữ nguyên mức ưu tiên và loại bỏ các giá trị trùng lặp.

  </Accordion>
  <Accordion title="Thời điểm luân phiên bắt đầu">
    - Yêu cầu chỉ được thử lại với khóa tiếp theo khi có phản hồi giới hạn tốc độ (ví dụ `429`, `rate_limit`, `quota`, `resource exhausted`, `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` hoặc thông báo giới hạn mức sử dụng định kỳ).
    - Các lỗi không liên quan đến giới hạn tốc độ sẽ thất bại ngay lập tức; hệ thống không thử luân phiên khóa.
    - Khi tất cả khóa ứng viên đều thất bại, lỗi cuối cùng từ lần thử cuối sẽ được trả về.

  </Accordion>
</AccordionGroup>

## Plugin nhà cung cấp chính thức

Các Plugin nhà cung cấp chính thức phát hành các hàng danh mục mô hình riêng. Những nhà cung cấp này **không** yêu cầu mục mô hình `models.providers`; hãy bật Plugin nhà cung cấp, đặt thông tin xác thực và chọn một mô hình. Chỉ sử dụng `models.providers` cho các nhà cung cấp tùy chỉnh tường minh hoặc cài đặt yêu cầu hẹp như thời gian chờ.

### OpenAI

- Nhà cung cấp: `openai`
- Xác thực: `OPENAI_API_KEY`
- Luân phiên không bắt buộc: `OPENAI_API_KEYS`, `OPENAI_API_KEY_1`, `OPENAI_API_KEY_2`, cộng với `OPENCLAW_LIVE_OPENAI_KEY` (ghi đè duy nhất)
- Mặc định khi thiết lập mới: `openai/gpt-5.6`; trên API trực tiếp, mã trần phân giải thành Sol.
- Mô hình ví dụ: `openai/gpt-5.6`, `openai/gpt-5.6-terra`, `openai/gpt-5.6-luna`, `openai/gpt-5.5`
- Xác minh khả năng cung cấp tài khoản/mô hình bằng `openclaw models list --provider openai` nếu một bản cài đặt hoặc khóa API cụ thể hoạt động khác.
- CLI: `openclaw onboard --auth-choice openai-api-key`
- Giao vận mặc định là `auto`; OpenClaw chuyển lựa chọn giao vận đến môi trường thực thi mô hình dùng chung.
- Ghi đè theo từng mô hình qua `agents.defaults.models["openai/<model>"].params.transport` (`"sse"`, `"websocket"` hoặc `"auto"`)
- Có thể bật xử lý ưu tiên OpenAI qua `agents.defaults.models["openai/<model>"].params.serviceTier`
- `/fast` và `params.fastMode` ánh xạ các yêu cầu Responses `openai/*` trực tiếp sang `service_tier=priority` trên `api.openai.com`
- Sử dụng `params.serviceTier` khi bạn muốn một cấp tường minh thay vì nút bật/tắt `/fast` dùng chung
- Các tiêu đề ghi công OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ áp dụng cho lưu lượng OpenAI gốc đến `api.openai.com`, không áp dụng cho proxy tương thích OpenAI chung
- Các tuyến OpenAI gốc cũng giữ lại `store` của Responses, gợi ý bộ nhớ đệm prompt và định hình tải trọng tương thích suy luận OpenAI; các tuyến proxy thì không
- `openai/gpt-5.3-codex-spark` chỉ khả dụng qua OAuth ChatGPT/Codex; các tuyến khóa API OpenAI trực tiếp và khóa API Azure từ chối nó

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
}
```

Nếu tổ chức API không cung cấp GPT-5.6, hãy đặt
`openai/gpt-5.5` một cách tường minh. Quy trình thiết lập ban đầu và xác thực lại thông thường giữ nguyên
mô hình chính tường minh hiện có; `models auth login --set-default` và
`models set` là các đường dẫn thay thế có chủ đích.

### Anthropic

- Nhà cung cấp: `anthropic`
- Xác thực: `ANTHROPIC_API_KEY`
- Luân phiên không bắt buộc: `ANTHROPIC_API_KEYS`, `ANTHROPIC_API_KEY_1`, `ANTHROPIC_API_KEY_2`, cộng với `OPENCLAW_LIVE_ANTHROPIC_KEY` (ghi đè duy nhất)
- Mô hình ví dụ: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- Các yêu cầu Anthropic công khai trực tiếp hỗ trợ nút bật/tắt `/fast` dùng chung và `params.fastMode`, bao gồm lưu lượng được xác thực bằng khóa API và OAuth gửi đến `api.anthropic.com`; OpenClaw ánh xạ điều đó sang `service_tier` của Anthropic (`auto` so với `standard_only`)
- Cấu hình Claude CLI ưu tiên giữ tham chiếu mô hình ở dạng chính thức và chọn riêng
  phần phụ trợ CLI: `anthropic/claude-opus-4-8` với
  `agentRuntime.id: "claude-cli"` ở phạm vi mô hình. Các tham chiếu
  `claude-cli/claude-opus-4-7` cũ vẫn hoạt động để đảm bảo khả năng tương thích.

<Note>
Việc tái sử dụng Claude CLI (`claude -p`) là một đường dẫn tích hợp OpenClaw được chấp thuận. Xác thực bằng token thiết lập Anthropic vẫn được hỗ trợ, nhưng OpenClaw ưu tiên tái sử dụng Claude CLI khi có sẵn.
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OAuth OpenAI ChatGPT/Codex

- Nhà cung cấp: `openai`
- Xác thực: OAuth (ChatGPT)
- Tham chiếu mới cho bộ kiểm thử app-server Codex nguyên bản: `openai/gpt-5.6-sol`
- Tài liệu về bộ kiểm thử app-server Codex nguyên bản: [Bộ kiểm thử Codex](/vi/plugins/codex-harness)
- Tham chiếu mô hình cũ: `codex/gpt-*`, `openai-codex/gpt-*`
- Ranh giới Plugin: `openai/*` tải Plugin OpenAI; chính sách runtime tường minh hoặc tuyến hiệu lực do nhà cung cấp sở hữu quyết định có chọn Plugin app-server Codex nguyên bản hay không.
- CLI: `openclaw onboard --auth-choice openai` hoặc `openclaw models auth login --provider openai`
- Phương thức vận chuyển ChatGPT Responses nhúng của OpenClaw mặc định là `auto` (ưu tiên WebSocket, dự phòng SSE).
- `agents.defaults.models["openai/<model>"].params.transport`, `params.serviceTier` và `params.fastMode` là các thiết lập yêu cầu nhúng do người dùng cấu hình. Chúng giữ việc lựa chọn runtime ngầm định trên OpenClaw; Codex nguyên bản sở hữu phương thức vận chuyển app-server và cấp dịch vụ của nó.
- Các header ghi nhận OpenClaw ẩn (`originator`, `version`, `User-Agent`) chỉ được đính kèm vào lưu lượng Codex nguyên bản tới `chatgpt.com/backend-api`, không áp dụng cho các proxy tương thích OpenAI nói chung
- Nút chuyển đổi `/fast` dùng chung vẫn khả dụng như một điều khiển runtime; nó khác với các tham số mô hình do người dùng cấu hình.
- Danh mục Codex nguyên bản có thể cung cấp chính xác các tham chiếu `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` và `openai/gpt-5.6-luna` tùy theo quyền truy cập của tài khoản. Nó không áp dụng bí danh trần `gpt-5.6` của API trực tiếp ở phía máy khách.
- `openai/gpt-5.5` sử dụng `contextWindow = 400000` nguyên bản trong danh mục Codex và runtime mặc định `contextTokens = 272000`; ghi đè giới hạn runtime bằng `models.providers.openai.models[].contextTokens`
- Đăng nhập bằng phương thức xác thực `openai` và sử dụng `openai/gpt-5.6-sol` cho một thiết lập mới dựa trên gói đăng ký. Chọn tường minh `openai/gpt-5.5` nếu không gian làm việc Codex đó không cung cấp GPT-5.6.
- Sử dụng nhà cung cấp/mô hình `agentRuntime.id: "openclaw"` để giữ một tuyến vốn đủ điều kiện trên runtime tích hợp sẵn. Khi runtime chưa được đặt hoặc là `auto`, chỉ một tuyến Responses/ChatGPT chính thức tương thích HTTPS chính xác, không có ghi đè yêu cầu do người dùng cấu hình, mới có thể chọn Codex ngầm định.
- Các tham chiếu GPT Codex cũ là trạng thái kế thừa, không phải tuyến nhà cung cấp đang hoạt động. Sử dụng các tham chiếu `openai/*` chuẩn cho cấu hình tác nhân mới và chạy `openclaw doctor --fix` để di chuyển các tham chiếu `codex/*` và `openai-codex/*` trong khi vẫn giữ nguyên ngữ nghĩa Codex nguyên bản của chúng bằng `agentRuntime.id: "codex"` theo phạm vi mô hình. Các lựa chọn `openai/gpt-5.5` chuẩn, tường minh hiện có sẽ không được nâng cấp.

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
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

### Các tùy chọn lưu trữ dạng thuê bao khác

<CardGroup cols={3}>
  <Card title="MiniMax" href="/vi/providers/minimax">
    Quyền truy cập bằng OAuth hoặc khóa API của MiniMax Coding Plan.
  </Card>
  <Card title="Qwen Cloud" href="/vi/providers/qwen">
    Giao diện nhà cung cấp Qwen Cloud cùng với ánh xạ điểm cuối Alibaba DashScope và Coding Plan.
  </Card>
  <Card title="Z.AI (GLM)" href="/vi/providers/zai">
    Coding Plan của Z.AI hoặc các điểm cuối API chung.
  </Card>
</CardGroup>

### OpenCode

- Xác thực: `OPENCODE_API_KEY` (hoặc `OPENCODE_ZEN_API_KEY`)
- Nhà cung cấp runtime Zen: `opencode`
- Nhà cung cấp runtime Go: `opencode-go`
- Các mô hình ví dụ: `opencode/claude-opus-4-6`, `opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` hoặc `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (khóa API)

- Nhà cung cấp: `google`
- Xác thực: `GEMINI_API_KEY`
- Luân phiên tùy chọn: `GEMINI_API_KEYS`, `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2`, dự phòng `GOOGLE_API_KEY` và `OPENCLAW_LIVE_GEMINI_KEY` (ghi đè đơn)
- Các mô hình ví dụ: `google/gemini-3.1-pro-preview`, `google/gemini-3.5-flash`
- Khả năng tương thích: cấu hình OpenClaw cũ sử dụng `google/gemini-3.1-flash-preview` được chuẩn hóa thành `google/gemini-3-flash-preview`
- Bí danh: `google/gemini-3.1-pro` được chấp nhận và chuẩn hóa thành mã định danh API Gemini đang hoạt động của Google, `google/gemini-3.1-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Suy luận: `/think adaptive` sử dụng cơ chế suy luận động của Google. Gemini 3/3.1 bỏ qua `thinkingLevel` cố định; Gemini 2.5 gửi `thinkingBudget: -1`.
- Các lần chạy Gemini trực tiếp cũng chấp nhận `agents.defaults.models["google/<model>"].params.cachedContent` (hoặc `cached_content` cũ) để chuyển tiếp handle `cachedContents/...` nguyên bản của nhà cung cấp; các lượt truy cập bộ nhớ đệm Gemini được hiển thị dưới dạng `cacheRead` của OpenClaw

### Google Vertex và Gemini CLI

- Các nhà cung cấp: `google-vertex`, `google-gemini-cli`
- Xác thực: Vertex sử dụng gcloud ADC; Gemini CLI sử dụng luồng OAuth của nó

<Warning>
OAuth của Gemini CLI trong OpenClaw là một tích hợp không chính thức. Một số người dùng đã báo cáo tài khoản Google bị hạn chế sau khi sử dụng các máy khách bên thứ ba. Hãy xem xét các điều khoản của Google và sử dụng một tài khoản không quan trọng nếu bạn chọn tiếp tục.
</Warning>

OAuth của Gemini CLI được cung cấp như một phần của Plugin `google` đi kèm.

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

    Mô hình mặc định: `google-gemini-cli/gemini-3-flash-preview`. Bạn **không** dán mã định danh máy khách hoặc thông tin bí mật vào `openclaw.json`. Luồng đăng nhập CLI lưu trữ token trong các hồ sơ xác thực trên máy chủ Gateway.

  </Step>
  <Step title="Đặt dự án (nếu cần)">
    Nếu các yêu cầu thất bại sau khi đăng nhập, hãy đặt `GOOGLE_CLOUD_PROJECT` hoặc `GOOGLE_CLOUD_PROJECT_ID` trên máy chủ Gateway.
  </Step>
</Steps>

Gemini CLI sử dụng `stream-json` theo mặc định. OpenClaw đọc các thông báo luồng
của trợ lý và chuẩn hóa `stats.cached` thành `cacheRead`; các ghi đè
`--output-format json` cũ vẫn đọc văn bản trả lời từ `response`.

### Z.AI (GLM)

- Nhà cung cấp: `zai`
- Xác thực: `ZAI_API_KEY`
- Mô hình ví dụ: `zai/glm-5.2`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - Các tham chiếu mô hình sử dụng mã định danh nhà cung cấp `zai/*` chuẩn.
  - `zai-api-key` tự động phát hiện điểm cuối Z.AI tương ứng; `zai-coding-global`, `zai-coding-cn`, `zai-global` và `zai-cn` buộc sử dụng một giao diện cụ thể

### Vercel AI Gateway

- Nhà cung cấp: `vercel-ai-gateway`
- Xác thực: `AI_GATEWAY_API_KEY`
- Các mô hình ví dụ: `vercel-ai-gateway/anthropic/claude-opus-4.6`, `vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Các Plugin nhà cung cấp đi kèm khác

| Nhà cung cấp                            | Id                               | Biến môi trường xác thực                              | Mô hình ví dụ                                           |
| --------------------------------------- | -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Arcee                                   | `arcee`                          | `ARCEEAI_API_KEY` hoặc `OPENROUTER_API_KEY`           | `arcee/trinity-large-thinking`                         |
| BytePlus                                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                   | `byteplus-plan/ark-code-latest`                        |
| Cerebras                                | `cerebras`                       | `CEREBRAS_API_KEY`                                   | `cerebras/zai-glm-4.7`                                 |
| Chutes                                  | `chutes`                         | `CHUTES_API_KEY` hoặc `CHUTES_OAUTH_TOKEN`            | `chutes/zai-org/GLM-5-TEE`                             |
| ClawRouter                              | `clawrouter`                     | `CLAWROUTER_API_KEY`                                 | `clawrouter/anthropic/claude-sonnet-4-6`               |
| Cohere                                  | `cohere`                         | `COHERE_API_KEY`                                     | `cohere/command-a-plus-05-2026`                        |
| DeepInfra                               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                  | `deepinfra/deepseek-ai/DeepSeek-V4-Flash`              |
| DeepSeek                                | `deepseek`                       | `DEEPSEEK_API_KEY`                                   | `deepseek/deepseek-v4-flash`                           |
| Featherless AI                          | `featherless`                    | `FEATHERLESS_API_KEY`                                | `featherless/Qwen/Qwen3-32B`                           |
| GitHub Copilot                          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN` | -                                                      |
| GMI Cloud                               | `gmi`                            | `GMI_API_KEY`                                        | `gmi/google/gemini-3.1-flash-lite`                     |
| Groq                                    | `groq`                           | `GROQ_API_KEY`                                       | `groq/llama-3.3-70b-versatile`                         |
| Hugging Face Inference                  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` hoặc `HF_TOKEN`               | `huggingface/deepseek-ai/DeepSeek-R1`                  |
| MiniMax                                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`            | `minimax/MiniMax-M3`                                   |
| Mistral                                 | `mistral`                        | `MISTRAL_API_KEY`                                    | `mistral/mistral-large-latest`                         |
| Moonshot                                | `moonshot`                       | `MOONSHOT_API_KEY`                                   | `moonshot/kimi-k2.6`                                   |
| NVIDIA                                  | `nvidia`                         | `NVIDIA_API_KEY`                                     | `nvidia/nvidia/nemotron-3-ultra-550b-a55b`             |
| NovitaAI                                | `novita`                         | `NOVITA_API_KEY`                                     | `novita/deepseek/deepseek-v3-0324`                     |
| [Ollama Cloud](/vi/providers/ollama-cloud) | `ollama-cloud`                   | `OLLAMA_API_KEY`                                     | `ollama-cloud/kimi-k2.6`                               |
| OpenRouter                              | `openrouter`                     | OAuth OpenRouter hoặc `OPENROUTER_API_KEY`            | `openrouter/auto`                                      |
| Qianfan                                 | `qianfan`                        | `QIANFAN_API_KEY`                                    | `qianfan/deepseek-v3.2`                                |
| Tencent TokenHub                        | `tencent-tokenhub`               | `TOKENHUB_API_KEY`                                   | `tencent-tokenhub/hy3-preview`                         |
| Together                                | `together`                       | `TOGETHER_API_KEY`                                   | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`     |
| Venice                                  | `venice`                         | `VENICE_API_KEY`                                     | -                                                      |
| Vercel AI Gateway                       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                 | `vercel-ai-gateway/anthropic/claude-opus-4.6`          |
| Volcano Engine (Doubao)                 | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                             | `volcengine-plan/ark-code-latest`                      |
| xAI                                     | `xai`                            | OAuth SuperGrok/X Premium hoặc `XAI_API_KEY`          | `xai/grok-4.3`                                         |
| Xiaomi                                  | `xiaomi` / `xiaomi-token-plan`   | `XIAOMI_API_KEY` / `XIAOMI_TOKEN_PLAN_API_KEY`       | `xiaomi/mimo-v2.5` / `xiaomi-token-plan/mimo-v2.5-pro` |

#### Những điểm đặc thù cần biết

<AccordionGroup>
  <Accordion title="OpenRouter">
    Chỉ áp dụng các header ghi nhận ứng dụng và marker Anthropic `cache_control` trên các tuyến `openrouter.ai` đã được xác minh. Các tham chiếu DeepSeek, Moonshot và ZAI đủ điều kiện sử dụng TTL bộ nhớ đệm cho việc lưu bộ nhớ đệm prompt do OpenRouter quản lý, nhưng không nhận marker bộ nhớ đệm Anthropic. Vì là một đường dẫn kiểu proxy tương thích với OpenAI, nó bỏ qua việc định dạng chỉ dành cho OpenAI gốc (`serviceTier`, Responses `store`, gợi ý bộ nhớ đệm prompt, khả năng tương thích suy luận OpenAI). Các tham chiếu dựa trên Gemini chỉ giữ lại quy trình làm sạch chữ ký suy nghĩ proxy-Gemini.
  </Accordion>
  <Accordion title="Kilo Gateway">
    Các tham chiếu dựa trên Gemini sử dụng cùng quy trình làm sạch proxy-Gemini; `kilocode/kilo-auto/balanced` và các tham chiếu khác không hỗ trợ suy luận qua proxy sẽ bỏ qua việc chèn suy luận proxy.
  </Accordion>
  <Accordion title="MiniMax">
    Quy trình thiết lập bằng khóa API ghi các định nghĩa mô hình trò chuyện M3 và M2.7 tường minh; khả năng hiểu hình ảnh vẫn sử dụng nhà cung cấp phương tiện `MiniMax-VL-01` do plugin sở hữu.
  </Accordion>
  <Accordion title="NVIDIA">
    ID mô hình sử dụng không gian tên `nvidia/<vendor>/<model>` (ví dụ: `nvidia/nvidia/nemotron-...`); bộ chọn giữ nguyên cấu trúc `<provider>/<model-id>` theo nghĩa đen, trong khi khóa chính tắc gửi đến API vẫn chỉ có một tiền tố.
  </Accordion>
  <Accordion title="xAI">
    Sử dụng đường dẫn Responses của xAI. Đường dẫn được khuyến nghị là OAuth SuperGrok/X Premium; khóa API vẫn hoạt động qua `XAI_API_KEY` hoặc cấu hình plugin, và Grok `web_search` sử dụng lại cùng hồ sơ xác thực trước khi dự phòng sang khóa API. Có thể chọn Grok 4.5 cho trò chuyện, lập trình và công việc tác tử khi khả dụng; `grok-4.3` vẫn là giá trị mặc định đi kèm an toàn theo khu vực. Các cấu hình `/fast` và `params.fastMode: true` cũ hơn vẫn được phân giải qua chuyển hướng tương thích Grok 4.3 của xAI, nhưng cấu hình mới nên chọn trực tiếp một mô hình hiện hành. `tool_stream` được bật theo mặc định; tắt bằng `agents.defaults.models["xai/<model>"].params.tool_stream=false`.
  </Accordion>
</AccordionGroup>

## Nhà cung cấp qua `models.providers` (URL tùy chỉnh/cơ sở)

Sử dụng `models.providers` (hoặc `models.json`) để thêm nhà cung cấp **tùy chỉnh** hoặc proxy tương thích với OpenAI/Anthropic.

Nhiều plugin nhà cung cấp đi kèm bên dưới đã công bố danh mục mặc định. Chỉ sử dụng các mục `models.providers.<id>` tường minh khi muốn ghi đè URL cơ sở, header hoặc danh sách mô hình mặc định.

Các bước kiểm tra khả năng mô hình của Gateway cũng đọc siêu dữ liệu `models.providers.<id>.models[]` tường minh. Nếu một mô hình tùy chỉnh hoặc proxy chấp nhận hình ảnh, hãy đặt `input: ["text", "image"]` trên mô hình đó để các đường dẫn tệp đính kèm từ WebChat và node truyền hình ảnh dưới dạng đầu vào mô hình gốc thay vì tham chiếu phương tiện chỉ có văn bản.

`agents.defaults.models["provider/model"]` kiểm soát bí danh và siêu dữ liệu theo từng mô hình cho tác tử. Bản thân nó không hạn chế việc ghi đè cũng không đăng ký mô hình runtime mới. Đối với mô hình của nhà cung cấp tùy chỉnh, cũng thêm `models.providers.<provider>.models[]` với ít nhất `id` tương ứng; sử dụng riêng `agents.defaults.modelPolicy.allow` khi muốn hạn chế việc ghi đè.

### Moonshot AI (Kimi)

Cài đặt `@openclaw/moonshot-provider` trước khi thiết lập. Chỉ thêm mục `models.providers.moonshot` tường minh khi cần ghi đè URL cơ sở hoặc siêu dữ liệu mô hình:

- Nhà cung cấp: `moonshot`
- Xác thực: `MOONSHOT_API_KEY`
- Mô hình ví dụ: `moonshot/kimi-k3`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` hoặc `openclaw onboard --auth-choice moonshot-api-key-cn`

ID mô hình Kimi:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k3`
- `moonshot/kimi-k2.7-code`
- `moonshot/kimi-k2.7-code-highspeed`
- `moonshot/kimi-k2.5`

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

Xem [Moonshot AI (Kimi + Kimi Coding)](/vi/providers/moonshot) để biết hướng dẫn thiết lập đầy đủ.

### Kimi Coding

Kimi Coding sử dụng endpoint tương thích với Anthropic của Moonshot AI:

- Nhà cung cấp: `kimi`
- Xác thực: `KIMI_API_KEY`
- Kimi K3: `kimi/k3` (256K) hoặc `kimi/k3[1m]` (gói 1M)
- Kimi Code: `kimi/kimi-for-coding`
- Kimi Code HighSpeed: `kimi/kimi-for-coding-highspeed`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

Các giá trị `kimi/kimi-code` và `kimi/k2p5` cũ vẫn được chấp nhận dưới dạng ID mô hình tương thích và được chuẩn hóa thành ID mô hình API ổn định của Kimi.

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

Quy trình thiết lập mặc định dùng bề mặt lập trình, nhưng danh mục `volcengine/*` chung được đăng ký cùng lúc.

Trong bộ chọn mô hình khi thiết lập/cấu hình, lựa chọn xác thực Volcengine ưu tiên cả hai hàng `volcengine/*` và `volcengine-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ dự phòng sang danh mục chưa lọc thay vì hiển thị một bộ chọn trống giới hạn theo nhà cung cấp.

<Tabs>
  <Tab title="Mô hình tiêu chuẩn">
    - `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127` (Kimi K2.5)
    - `volcengine/glm-4-7-251222` (GLM 4.7)
    - `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2)

  </Tab>
  <Tab title="Mô hình lập trình (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`

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

Mặc định, quy trình thiết lập ban đầu sử dụng giao diện lập trình, nhưng danh mục `byteplus/*` chung cũng được đăng ký cùng lúc.

Trong bộ chọn mô hình của quy trình thiết lập ban đầu/cấu hình, lựa chọn xác thực BytePlus ưu tiên cả các hàng `byteplus/*` và `byteplus-plan/*`. Nếu các mô hình đó chưa được tải, OpenClaw sẽ chuyển sang danh mục chưa lọc thay vì hiển thị bộ chọn theo phạm vi nhà cung cấp trống.

<Tabs>
  <Tab title="Mô hình tiêu chuẩn">
    - `byteplus/seed-1-8-251228` (Seed 1.8)
    - `byteplus/kimi-k2-5-260127` (Kimi K2.5)
    - `byteplus/glm-4-7-251222` (GLM 4.7)

  </Tab>
  <Tab title="Mô hình lập trình (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic cung cấp các mô hình tương thích với Anthropic thông qua nhà cung cấp `synthetic`:

- Nhà cung cấp: `synthetic`
- Xác thực: `SYNTHETIC_API_KEY`
- Mô hình ví dụ: `synthetic/hf:MiniMaxAI/MiniMax-M3`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M3", name: "MiniMax M3" }],
      },
    },
  },
}
```

### MiniMax

MiniMax được cấu hình qua `models.providers` vì sử dụng các điểm cuối tùy chỉnh:

- MiniMax OAuth (Toàn cầu): `--auth-choice minimax-global-oauth`
- MiniMax OAuth (CN): `--auth-choice minimax-cn-oauth`
- Khóa API MiniMax (Toàn cầu): `--auth-choice minimax-global-api`
- Khóa API MiniMax (CN): `--auth-choice minimax-cn-api`
- Xác thực: `MINIMAX_API_KEY` cho `minimax`; `MINIMAX_OAUTH_TOKEN` hoặc `MINIMAX_API_KEY` cho `minimax-portal`

Xem [/providers/minimax](/vi/providers/minimax) để biết chi tiết thiết lập, các tùy chọn mô hình và đoạn mã cấu hình.

<Note>
Trên đường truyền trực tuyến tương thích với Anthropic của MiniMax, OpenClaw mặc định tắt chế độ suy luận cho dòng M2.x trừ khi bạn thiết lập rõ ràng; MiniMax-M3 (và M3.x) mặc định vẫn sử dụng đường dẫn suy luận bỏ qua/thích ứng của nhà cung cấp. `/fast on` ghi lại `MiniMax-M2.7` thành `MiniMax-M2.7-highspeed`.
</Note>

Phân chia khả năng do Plugin sở hữu:

- Mặc định văn bản/trò chuyện vẫn dùng `minimax/MiniMax-M3`
- Tạo hình ảnh là `minimax/image-01` hoặc `minimax-portal/image-01`
- Hiểu hình ảnh là `MiniMax-VL-01` do Plugin sở hữu trên cả hai đường dẫn xác thực MiniMax
- Tìm kiếm web vẫn dùng ID nhà cung cấp `minimax`

### LM Studio

LM Studio được cung cấp dưới dạng Plugin nhà cung cấp tích hợp sẵn sử dụng API gốc:

- Nhà cung cấp: `lmstudio`
- Xác thực: `LM_API_TOKEN`
- URL cơ sở suy luận mặc định: `http://localhost:1234/v1`

Sau đó thiết lập một mô hình (thay thế bằng một trong các ID do `http://localhost:1234/api/v1/models` trả về):

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw sử dụng `/api/v1/models` và `/api/v1/models/load` gốc của LM Studio để khám phá + tự động tải, với `/v1/chat/completions` dùng cho suy luận theo mặc định. Nếu bạn muốn tính năng tải JIT, TTL và tự động loại bỏ của LM Studio quản lý vòng đời mô hình, hãy thiết lập `models.providers.lmstudio.params.preload: false`. Xem [/providers/lmstudio](/vi/providers/lmstudio) để biết cách thiết lập và khắc phục sự cố.

### Ollama

Ollama được cung cấp dưới dạng Plugin nhà cung cấp tích hợp sẵn và sử dụng API gốc của Ollama:

- Nhà cung cấp: `ollama`
- Xác thực: Không bắt buộc (máy chủ cục bộ)
- Mô hình ví dụ: `ollama/llama3.3`
- Cài đặt: [https://ollama.com/download](https://ollama.com/download)

```bash
# Cài đặt Ollama, sau đó tải một mô hình:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama được phát hiện cục bộ tại `http://127.0.0.1:11434` khi bạn chọn tham gia bằng `OLLAMA_API_KEY`, và Plugin nhà cung cấp tích hợp sẵn thêm Ollama trực tiếp vào `openclaw onboard` và bộ chọn mô hình. Xem [/providers/ollama](/vi/providers/ollama) để biết về quy trình thiết lập ban đầu, chế độ đám mây/cục bộ và cấu hình tùy chỉnh.

### vLLM

vLLM được cung cấp dưới dạng Plugin nhà cung cấp tích hợp sẵn dành cho các máy chủ cục bộ/tự lưu trữ tương thích với OpenAI:

- Nhà cung cấp: `vllm`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:8000/v1`

Để chọn tham gia tự động khám phá cục bộ (giá trị bất kỳ đều dùng được nếu máy chủ của bạn không thực thi xác thực):

```bash
export VLLM_API_KEY="vllm-local"
```

Sau đó thiết lập một mô hình (thay thế bằng một trong các ID do `/v1/models` trả về):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

Xem [/providers/vllm](/vi/providers/vllm) để biết chi tiết.

### SGLang

SGLang được cung cấp dưới dạng Plugin nhà cung cấp tích hợp sẵn dành cho các máy chủ tự lưu trữ nhanh, tương thích với OpenAI:

- Nhà cung cấp: `sglang`
- Xác thực: Tùy chọn (phụ thuộc vào máy chủ của bạn)
- URL cơ sở mặc định: `http://127.0.0.1:30000/v1`

Để chọn tham gia tự động khám phá cục bộ (giá trị bất kỳ đều dùng được nếu máy chủ của bạn không thực thi xác thực):

```bash
export SGLANG_API_KEY="sglang-local"
```

Sau đó thiết lập một mô hình (thay thế bằng một trong các ID do `/v1/models` trả về):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

Xem [/providers/sglang](/vi/providers/sglang) để biết chi tiết.

### Proxy cục bộ (LM Studio, vLLM, LiteLLM, v.v.)

Ví dụ (tương thích với OpenAI):

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
  <Accordion title="Các trường tùy chọn mặc định">
    Đối với nhà cung cấp tùy chỉnh, `reasoning`, `input`, `cost`, `contextWindow` và `maxTokens` là tùy chọn. Khi bị bỏ qua, OpenClaw mặc định sử dụng:

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    Khuyến nghị: thiết lập các giá trị rõ ràng phù hợp với giới hạn của proxy/mô hình.

  </Accordion>
  <Accordion title="Quy tắc định hình tuyến proxy">
    - Đối với `api: "openai-completions"` trên các điểm cuối không phải gốc (bất kỳ `baseUrl` không trống nào có máy chủ không phải `api.openai.com`), OpenClaw buộc `compat.supportsDeveloperRole: false` để tránh lỗi 400 từ nhà cung cấp đối với các vai trò `developer` không được hỗ trợ.
    - Các tuyến tương thích với OpenAI kiểu proxy cũng bỏ qua việc định hình yêu cầu chỉ dành cho OpenAI gốc: không có `service_tier`, không có Responses `store`, không có Completions `store`, không có gợi ý bộ nhớ đệm prompt, không định hình tải trọng tương thích suy luận OpenAI và không có tiêu đề ghi công OpenClaw ẩn.
    - Đối với các proxy Completions tương thích với OpenAI cần trường dành riêng cho nhà cung cấp, hãy thiết lập `agents.defaults.models["provider/model"].params.extra_body` (hoặc `extraBody`) để hợp nhất JSON bổ sung vào phần thân yêu cầu gửi đi.
    - Đối với các điều khiển mẫu trò chuyện của vLLM, hãy thiết lập `agents.defaults.models["provider/model"].params.chat_template_kwargs`. Plugin vLLM tích hợp sẵn tự động gửi `enable_thinking: false` và `force_nonempty_content: true` cho `vllm/nemotron-3-*` khi mức suy luận của phiên bị tắt.
    - Đối với các mô hình cục bộ chậm hoặc máy chủ LAN/tailnet từ xa, hãy thiết lập `models.providers.<id>.timeoutSeconds`. Điều này kéo dài quá trình xử lý yêu cầu HTTP mô hình của nhà cung cấp, bao gồm kết nối, tiêu đề, truyền trực tuyến phần thân và thao tác hủy guarded-fetch tổng thể, mà không tăng thời gian chờ của toàn bộ thời gian chạy tác nhân. Nếu `agents.defaults.timeoutSeconds` hoặc thời gian chờ dành riêng cho lượt chạy thấp hơn, hãy tăng cả giới hạn đó; thời gian chờ của nhà cung cấp không thể kéo dài toàn bộ lượt chạy.
    - Các lệnh gọi HTTP đến nhà cung cấp mô hình chỉ cho phép câu trả lời DNS fake-IP của Surge, Clash và sing-box trong `198.18.0.0/15` và `fc00::/7` đối với tên máy chủ `baseUrl` của nhà cung cấp đã cấu hình. Các điểm cuối nhà cung cấp tùy chỉnh/cục bộ cũng tin cậy chính xác nguồn gốc `scheme://host:port` đã cấu hình đó cho các yêu cầu mô hình được bảo vệ, bao gồm các máy chủ loopback, LAN và tailnet. Đây không phải là tùy chọn cấu hình mới; `baseUrl` bạn cấu hình chỉ mở rộng chính sách yêu cầu cho nguồn gốc đó. Việc cho phép tên máy chủ fake-IP và tin cậy chính xác nguồn gốc là các cơ chế độc lập. Các đích riêng tư, loopback, link-local, metadata khác và các cổng khác vẫn yêu cầu chọn tham gia `models.providers.<id>.request.allowPrivateNetwork: true` rõ ràng. Thiết lập `models.providers.<id>.request.allowPrivateNetwork: false` để từ chối tin cậy chính xác nguồn gốc.
    - Nếu `baseUrl` trống/bị bỏ qua, OpenClaw giữ hành vi OpenAI mặc định (phân giải thành `api.openai.com`).
    - Để đảm bảo an toàn, `compat.supportsDeveloperRole: true` được thiết lập rõ ràng vẫn bị ghi đè trên các điểm cuối `openai-completions` không phải gốc.
    - Đối với `api: "anthropic-messages"` trên các điểm cuối không trực tiếp (bất kỳ nhà cung cấp nào ngoài `anthropic` chuẩn, hoặc `models.providers.anthropic.baseUrl` tùy chỉnh có máy chủ không phải điểm cuối `api.anthropic.com` công khai), OpenClaw loại bỏ các tiêu đề beta Anthropic ngầm định như `claude-code-20250219`, `interleaved-thinking-2025-05-14` và các dấu hiệu OAuth để các proxy tùy chỉnh tương thích với Anthropic không từ chối cờ beta không được hỗ trợ. Hãy thiết lập rõ ràng `models.providers.<id>.headers["anthropic-beta"]` nếu proxy của bạn cần các tính năng beta cụ thể.

  </Accordion>
</AccordionGroup>

## Ví dụ CLI

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

Xem thêm: [Cấu hình](/vi/gateway/configuration) để biết các ví dụ cấu hình đầy đủ.

## Liên quan

- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) - các khóa cấu hình mô hình
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) - chuỗi dự phòng và hành vi thử lại
- [Mô hình](/vi/concepts/models) - cấu hình mô hình và bí danh
- [Nhà cung cấp](/vi/providers) - hướng dẫn thiết lập cho từng nhà cung cấp
