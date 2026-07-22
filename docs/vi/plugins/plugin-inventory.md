---
read_when:
    - Bạn đang quyết định liệu một plugin được phân phối trong gói npm cốt lõi hay được cài đặt riêng biệt
    - Bạn đang cập nhật siêu dữ liệu gói Plugin đi kèm hoặc quy trình tự động hóa phát hành
    - Bạn cần danh sách plugin nội bộ và bên ngoài chính thức.
summary: Danh mục được tạo tự động về các Plugin OpenClaw được tích hợp trong lõi, phát hành bên ngoài hoặc chỉ lưu dưới dạng mã nguồn
title: Danh mục Plugin
x-i18n:
    generated_at: "2026-07-22T02:13:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2d835087afbe9d75f883c3db9739f914bedab5ac87a9c20b69c248304b61c594
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Danh mục Plugin

Trang này được tạo từ `extensions/*/package.json`, `openclaw.plugin.json`,
và các mục loại trừ của gói npm gốc `files`. Tạo lại bằng:

```bash
pnpm plugins:inventory:gen
```

## Định nghĩa

- **Gói npm lõi:** được tích hợp vào gói npm `openclaw` và khả dụng mà không cần cài đặt Plugin riêng.
- **Gói bên ngoài chính thức:** Plugin do OpenClaw duy trì, không được đưa vào gói npm lõi, được giữ trong danh mục chính thức này và được cài đặt theo nhu cầu thông qua ClawHub và/hoặc npm.
- **Chỉ dành cho bản sao mã nguồn:** Plugin cục bộ trong kho mã nguồn, không được đưa vào các thành phần npm đã phát hành và không được quảng bá dưới dạng gói có thể cài đặt.

Bản sao mã nguồn khác với bản cài đặt npm: sau khi `pnpm install`, các
Plugin đi kèm được tải từ `extensions/<id>` để các chỉnh sửa cục bộ và phần phụ thuộc
workspace cục bộ của gói có thể sử dụng được.

## Cài đặt Plugin

Sử dụng phương thức cài đặt trong từng mục để xác định có cần cài đặt hay không. Các Plugin
ghi `included in OpenClaw` đã có sẵn trong gói lõi.
Các gói bên ngoài chính thức cần được cài đặt một lần, sau đó khởi động lại Gateway.

Ví dụ, Discord là một gói bên ngoài chính thức:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Trong quá trình chuyển đổi khi ra mắt, các đặc tả gói trần thông thường vẫn được cài đặt từ npm.
Sử dụng `clawhub:@openclaw/discord` hoặc `npm:@openclaw/discord` khi cần một
nguồn rõ ràng. Sau khi cài đặt, hãy làm theo tài liệu thiết lập của Plugin, chẳng hạn như
[Discord](/vi/channels/discord), để thêm thông tin xác thực và cấu hình kênh. Xem
[Quản lý Plugin](/vi/plugins/manage-plugins) để biết các lệnh cập nhật, gỡ cài đặt và phát hành.

Mỗi mục liệt kê gói, phương thức phân phối và mô tả.

## Gói npm lõi

70 Plugin

- **[admin-http-rpc](/vi/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - có trong OpenClaw. Điểm cuối RPC HTTP quản trị OpenClaw.

- **[alibaba](/vi/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp tạo video.

- **[anthropic](/vi/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - có trong OpenClaw. Các mô hình Anthropic, Claude CLI và danh mục phiên Claude gốc.

- **[azure-speech](/vi/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - có trong OpenClaw. Chuyển văn bản thành giọng nói bằng Azure AI Speech (MP3, ghi chú thoại Ogg/Opus gốc, điện thoại PCM).

- **[bonjour](/vi/plugins/reference/bonjour)** (`@openclaw/bonjour`) - có trong OpenClaw. Quảng bá Gateway OpenClaw cục bộ qua Bonjour/mDNS.

- **[browser](/vi/plugins/reference/browser)** (`@openclaw/browser-plugin`) - có trong OpenClaw. Bổ sung các công cụ mà tác tử có thể gọi.

- **[byteplus](/vi/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình BytePlus, BytePlus Plan cho OpenClaw.

- **[canvas](/vi/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - có trong OpenClaw. Các bề mặt thử nghiệm để điều khiển Canvas và kết xuất A2UI cho các Node đã ghép cặp.

- **[clawrouter](/vi/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình ClawRouter cho OpenClaw.

- **[cohere](/vi/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - có trong OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin nhà cung cấp Cohere của OpenClaw.

- **[comfy](/vi/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình ComfyUI cho OpenClaw.

- **[copilot-proxy](/vi/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Copilot Proxy cho OpenClaw.

- **[crabbox](/vi/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - có trong OpenClaw. Nhà cung cấp worker đám mây dựa trên Crabbox CLI.

- **[cua-computer](/plugins/reference/cua-computer)** (`@openclaw/cua-computer`) - có trong OpenClaw. Khả năng điều khiển máy tính thử nghiệm bằng cua-driver dành cho máy chủ Node Windows và Linux.

- **[deepgram](/vi/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp khả năng hiểu nội dung đa phương tiện. Bổ sung hỗ trợ nhà cung cấp phiên âm theo thời gian thực.

- **[document-extract](/vi/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - có trong OpenClaw. Trích xuất văn bản và hình ảnh trang dự phòng từ các tài liệu đính kèm cục bộ.

- **[duckduckgo](/vi/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp tìm kiếm web.

- **[elevenlabs](/vi/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp khả năng hiểu nội dung đa phương tiện. Bổ sung hỗ trợ nhà cung cấp phiên âm theo thời gian thực. Bổ sung hỗ trợ nhà cung cấp chuyển văn bản thành giọng nói.

- **[fal](/vi/plugins/reference/fal)** (`@openclaw/fal-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình fal cho OpenClaw.

- **[file-transfer](/vi/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - có trong OpenClaw. Tìm nạp, liệt kê và ghi tệp trên các Node đã ghép cặp thông qua các lệnh Node chuyên dụng. Tránh việc đầu ra stdout của bash bị cắt bớt bằng cách sử dụng base64 qua node.invoke cho các tệp nhị phân có kích thước tối đa 16 MB.

- **[github-copilot](/vi/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình GitHub Copilot cho OpenClaw.

- **[google](/vi/plugins/reference/google)** (`@openclaw/google-plugin`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Google, Google Gemini CLI và Google Vertex cho OpenClaw.

- **[huggingface](/vi/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Hugging Face cho OpenClaw.

- **[imessage](/vi/plugins/reference/imessage)** (`@openclaw/imessage`) - có trong OpenClaw. Bổ sung bề mặt kênh iMessage để gửi và nhận tin nhắn OpenClaw.

- **[linux-canvas](/vi/plugins/reference/linux-canvas)** (`@openclaw/linux-canvas`) - có trong OpenClaw. Cầu nối kết xuất Canvas cho ứng dụng OpenClaw trên máy tính Linux.

- **[linux-node](/vi/plugins/reference/linux-node)** (`@openclaw/linux-node`) - có trong OpenClaw. Thông báo trên máy tính, chụp ảnh bằng camera và vị trí cho máy chủ Node Linux.

- **[litellm](/vi/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình LiteLLM cho OpenClaw.

- **[llm-task](/vi/plugins/reference/llm-task)** (`@openclaw/llm-task`) - có trong OpenClaw. Công cụ LLM đa dụng chỉ dùng JSON cho các tác vụ có cấu trúc, có thể được gọi từ quy trình làm việc.

- **[lmstudio](/vi/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình LM Studio cho OpenClaw.

- **[logbook](/vi/plugins/reference/logbook)** (`@openclaw/logbook`) - có trong OpenClaw. Nhật ký công việc tự động: định kỳ chụp ảnh màn hình từ một Node đã ghép cặp và chuyển chúng thành dòng thời gian trong ngày mà bạn có thể xem lại.

- **[memory-core](/vi/plugins/reference/memory-core)** (`@openclaw/memory-core`) - có trong OpenClaw. Bổ sung các công cụ mà tác tử có thể gọi.

- **[memory-wiki](/vi/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - có trong OpenClaw. Trình biên dịch wiki bền vững và kho kiến thức thân thiện với Obsidian dành cho OpenClaw.

- **[meta](/vi/plugins/reference/meta)** (`@openclaw/meta-provider`) - có trong OpenClaw; npm; ClawHub: `clawhub:@openclaw/meta-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Meta cho OpenClaw.

- **[microsoft](/vi/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp chuyển văn bản thành giọng nói.

- **[microsoft-foundry](/vi/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Microsoft Foundry cho OpenClaw.

- **[migrate-claude](/vi/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - có trong OpenClaw. Nhập hướng dẫn Claude Code và Claude Desktop, máy chủ MCP, kỹ năng và cấu hình an toàn vào OpenClaw.

- **[migrate-hermes](/vi/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - có trong OpenClaw. Nhập cấu hình, bộ nhớ, kỹ năng và thông tin xác thực được hỗ trợ của Hermes vào OpenClaw.

- **[minimax](/vi/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình MiniMax, MiniMax Portal cho OpenClaw.

- **[mistral](/vi/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Mistral cho OpenClaw.

- **[novita](/vi/plugins/reference/novita)** (`@openclaw/novita-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Novita, Novita AI, Novitaai cho OpenClaw.

- **[nvidia](/vi/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình NVIDIA cho OpenClaw.

- **[oc-path](/vi/plugins/reference/oc-path)** (`@openclaw/oc-path`) - có trong OpenClaw. Bổ sung CLI đường dẫn openclaw để định địa chỉ tệp trong workspace bằng oc://.

- **[ollama](/vi/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Ollama, Ollama Cloud cho OpenClaw.

- **[onepassword](/vi/plugins/reference/onepassword)** (`@openclaw/onepassword`) - có trong OpenClaw. Trình môi giới bí mật 1Password được tuyển chọn, có chính sách phê duyệt và lịch sử kiểm tra SQLite.

- **[open-prose](/vi/plugins/reference/open-prose)** (`@openclaw/open-prose`) - có trong OpenClaw. Gói kỹ năng VM OpenProse với lệnh gạch chéo /prose.

- **[openai](/vi/plugins/reference/openai)** (`@openclaw/openai-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình OpenAI cho OpenClaw.

- **[opencode](/vi/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình OpenCode cho OpenClaw.

- **[opencode-go](/vi/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình OpenCode Go cho OpenClaw.

- **[openrouter](/vi/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình OpenRouter cho OpenClaw.

- **[policy](/vi/plugins/reference/policy)** (`@openclaw/policy`) - có trong OpenClaw. Bổ sung các bước kiểm tra doctor dựa trên chính sách để bảo đảm workspace tuân thủ yêu cầu.

- **[reef](/vi/plugins/reference/reef)** (`@openclaw/reef`) - có trong OpenClaw. Kênh claw được bảo vệ và mã hóa đầu cuối.

- **[runway](/vi/plugins/reference/runway)** (`@openclaw/runway-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp tạo video.

- **[senseaudio](/vi/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp khả năng hiểu nội dung đa phương tiện.

- **[sglang](/vi/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình SGLang cho OpenClaw.

- **[synthetic](/vi/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Synthetic cho OpenClaw.

- **[teams-meetings](/vi/plugins/reference/teams-meetings)** (`@openclaw/teams-meetings`) - có trong OpenClaw. Tham gia các cuộc họp Microsoft Teams với tư cách khách dùng trình duyệt Chrome.

- **[telegram](/vi/plugins/reference/telegram)** (`@openclaw/telegram`) - có trong OpenClaw. Bổ sung bề mặt kênh Telegram để gửi và nhận tin nhắn OpenClaw.

- **[together](/vi/plugins/reference/together)** (`@openclaw/together-provider`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Together cho OpenClaw.

- **[tts-local-cli](/vi/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - có trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp chuyển văn bản thành giọng nói.

- **[vault](/vi/plugins/reference/vault)** (`@openclaw/vault`) - được tích hợp trong OpenClaw. Tích hợp nhà cung cấp SecretRef HashiCorp Vault.

- **[vllm](/vi/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - được tích hợp trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình vLLM cho OpenClaw.

- **[volcengine](/vi/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - được tích hợp trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Volcengine và Volcengine Plan cho OpenClaw.

- **[voyage](/vi/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - được tích hợp trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp embedding cho bộ nhớ.

- **[vydra](/vi/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - được tích hợp trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Vydra cho OpenClaw.

- **[web-readability](/vi/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - được tích hợp trong OpenClaw. Trích xuất nội dung bài viết dễ đọc từ các phản hồi tìm nạp web HTML cục bộ.

- **[webhooks](/vi/plugins/reference/webhooks)** (`@openclaw/webhooks`) - được tích hợp trong OpenClaw. Các webhook gửi đến đã xác thực, liên kết hoạt động tự động hóa bên ngoài với TaskFlow của OpenClaw.

- **[workboard](/vi/plugins/reference/workboard)** (`@openclaw/workboard`) - được tích hợp trong OpenClaw. Bảng công việc trên dashboard dành cho các vấn đề và phiên do tác tử sở hữu.

- **[xai](/vi/plugins/reference/xai)** (`@openclaw/xai-plugin`) - được tích hợp trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình xAI cho OpenClaw.

- **[xiaomi](/vi/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - được tích hợp trong OpenClaw. Bổ sung hỗ trợ nhà cung cấp mô hình Xiaomi và Xiaomi Token Plan cho OpenClaw.

- **[zoom-meetings](/vi/plugins/reference/zoom-meetings)** (`@openclaw/zoom-meetings`) - được tích hợp trong OpenClaw. Tham gia các cuộc họp Zoom với tư cách khách bằng trình duyệt Chrome.

## Các gói bên ngoài chính thức

72 plugin

- **[acpx](/vi/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend runtime ACP của OpenClaw với tính năng quản lý phiên và phương thức truyền tải do plugin sở hữu.

- **[amazon-bedrock](/vi/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin nhà cung cấp Amazon Bedrock của OpenClaw, hỗ trợ khám phá mô hình, embedding và guardrail.

- **[amazon-bedrock-mantle](/vi/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin nhà cung cấp Amazon Bedrock Mantle của OpenClaw để định tuyến mô hình tương thích với OpenAI.

- **[anthropic-vertex](/vi/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin nhà cung cấp Anthropic Vertex của OpenClaw dành cho các mô hình Claude trên Google Vertex AI.

- **[arcee](/vi/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Arcee cho OpenClaw.

- **[baseten](/vi/plugins/reference/baseten)** (`@openclaw/baseten-provider`) - npm; ClawHub: `clawhub:@openclaw/baseten-provider`. Plugin nhà cung cấp Baseten của OpenClaw.

- **[brave](/vi/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin nhà cung cấp Brave Search của OpenClaw dành cho tìm kiếm web.

- **[cerebras](/vi/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Cerebras cho OpenClaw.

- **[chutes](/vi/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Chutes cho OpenClaw.

- **[clickclack](/vi/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Bổ sung bề mặt kênh Clickclack để gửi và nhận tin nhắn OpenClaw.

- **[cloudflare-ai-gateway](/vi/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Cloudflare AI Gateway cho OpenClaw.

- **[codex](/vi/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Bộ khung máy chủ ứng dụng Codex và danh mục phiên gốc.

- **[copilot](/vi/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Đăng ký runtime tác tử GitHub Copilot.

- **[deepinfra](/vi/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình DeepInfra cho OpenClaw.

- **[deepseek](/vi/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình DeepSeek cho OpenClaw.

- **[diagnostics-otel](/vi/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Trình xuất OpenTelemetry chẩn đoán của OpenClaw dành cho số liệu, dấu vết và nhật ký.

- **[diagnostics-prometheus](/vi/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Trình xuất Prometheus chẩn đoán của OpenClaw dành cho số liệu runtime.

- **[diffs](/vi/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin trình xem diff chỉ đọc và trình kết xuất tệp của OpenClaw dành cho tác tử.

- **[diffs-language-pack](/vi/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Bổ sung tô sáng cú pháp cho các ngôn ngữ không thuộc bộ mặc định của trình xem diff.

- **[discord](/vi/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin kênh Discord của OpenClaw dành cho kênh, tin nhắn trực tiếp, lệnh và sự kiện ứng dụng.

- **[exa](/vi/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Bổ sung hỗ trợ nhà cung cấp tìm kiếm web.

- **[featherless](/vi/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm; ClawHub: `clawhub:@openclaw/featherless-provider`. Plugin nhà cung cấp Featherless AI của OpenClaw.

- **[feishu](/vi/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin kênh Feishu/Lark của OpenClaw dành cho trò chuyện và các công cụ tại nơi làm việc (do cộng đồng duy trì bởi @m1heng).

- **[firecrawl](/vi/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Bổ sung các công cụ mà tác tử có thể gọi. Bổ sung hỗ trợ nhà cung cấp tìm nạp web. Bổ sung hỗ trợ nhà cung cấp tìm kiếm web.

- **[fireworks](/vi/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Fireworks cho OpenClaw.

- **[gmi](/vi/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin nhà cung cấp GMI Cloud của OpenClaw.

- **[google-meet](/vi/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin người tham gia Google Meet của OpenClaw để tham gia cuộc gọi qua phương thức truyền tải Chrome hoặc Twilio.

- **[googlechat](/vi/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin kênh Google Chat của OpenClaw dành cho không gian và tin nhắn trực tiếp.

- **[gradium](/vi/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Bổ sung hỗ trợ nhà cung cấp chuyển văn bản thành giọng nói.

- **[groq](/vi/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Groq cho OpenClaw.

- **[inworld](/vi/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Chuyển văn bản thành giọng nói dạng luồng của Inworld (MP3, OGG_OPUS, PCM điện thoại).

- **[irc](/vi/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Bổ sung bề mặt kênh IRC để gửi và nhận tin nhắn OpenClaw.

- **[kilocode](/vi/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Kilocode cho OpenClaw.

- **[kimi](/vi/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Kimi và Kimi Coding cho OpenClaw.

- **[line](/vi/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin kênh LINE của OpenClaw dành cho các cuộc trò chuyện qua LINE Bot API.

- **[llama-cpp](/vi/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Suy luận văn bản và embedding GGUF cục bộ thông qua node-llama-cpp.

- **[lobster](/vi/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin công cụ quy trình làm việc Lobster dành cho các pipeline có kiểu và các phê duyệt có thể tiếp tục.

- **[longcat](/vi/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider`. Plugin nhà cung cấp LongCat của OpenClaw.

- **[matrix](/vi/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin kênh Matrix của OpenClaw dành cho phòng và tin nhắn trực tiếp.

- **[mattermost](/vi/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Bổ sung bề mặt kênh Mattermost để gửi và nhận tin nhắn OpenClaw.

- **[memory-lancedb](/vi/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin bộ nhớ dài hạn dựa trên LanceDB của OpenClaw, hỗ trợ tự động truy hồi, tự động thu thập và tìm kiếm vectơ.

- **[moonshot](/vi/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Moonshot cho OpenClaw.

- **[msteams](/vi/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin kênh Microsoft Teams của OpenClaw dành cho các cuộc hội thoại với bot.

- **[mxc](/vi/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) - npm; ClawHub. Thực thi công cụ trong sandbox ở cấp hệ điều hành thông qua MXC: chạy lệnh trong Windows ProcessContainer với các tệp chính sách MXC đã cấu hình.

- **[nextcloud-talk](/vi/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin kênh Nextcloud Talk của OpenClaw dành cho hội thoại.

- **[nostr](/vi/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin kênh Nostr của OpenClaw dành cho tin nhắn trực tiếp được mã hóa NIP-04.

- **[openshell](/vi/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend sandbox của OpenClaw dành cho NVIDIA OpenShell CLI, có các không gian làm việc cục bộ được phản chiếu và khả năng thực thi lệnh SSH.

- **[parallel](/vi/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Bổ sung hỗ trợ nhà cung cấp tìm kiếm web.

- **[perplexity](/vi/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Bổ sung hỗ trợ nhà cung cấp tìm kiếm web.

- **[pixverse](/vi/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin nhà cung cấp tạo video PixVerse của OpenClaw.

- **[qianfan](/vi/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Qianfan cho OpenClaw.

- **[qqbot](/vi/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin kênh QQ Bot của OpenClaw dành cho các quy trình làm việc nhóm và tin nhắn trực tiếp.

- **[qwen](/vi/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Token Plan và Bailian Token Plan cho OpenClaw.

- **[raft](/vi/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin kênh Raft của OpenClaw dành cho các cầu nối đánh thức CLI an toàn.

- **[searxng](/vi/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Bổ sung hỗ trợ nhà cung cấp tìm kiếm web.

- **[signal](/vi/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Bổ sung bề mặt kênh Signal để gửi và nhận tin nhắn OpenClaw.

- **[slack](/vi/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin kênh Slack của OpenClaw dành cho kênh, tin nhắn trực tiếp, lệnh và sự kiện ứng dụng.

- **[sms](/vi/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin kênh SMS Twilio dành cho tin nhắn văn bản OpenClaw.

- **[stepfun](/vi/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình StepFun và StepFun Plan cho OpenClaw.

- **[synology-chat](/vi/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin kênh Synology Chat dành cho các kênh và tin nhắn trực tiếp của OpenClaw.

- **[tavily](/vi/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Bổ sung các công cụ mà tác nhân có thể gọi. Bổ sung hỗ trợ nhà cung cấp tìm kiếm web.

- **[tencent](/vi/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Tencent TokenHub và Tencent Tokenplan cho OpenClaw.

- **[tlon](/vi/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin kênh Tlon/Urbit của OpenClaw dành cho các quy trình trò chuyện.

- **[tokenjuice](/vi/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Thu gọn kết quả của các công cụ exec và bash bằng các bộ rút gọn Tokenjuice.

- **[twitch](/vi/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin kênh Twitch của OpenClaw dành cho các quy trình trò chuyện và kiểm duyệt.

- **[venice](/vi/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Venice cho OpenClaw.

- **[vercel-ai-gateway](/vi/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Vercel AI Gateway cho OpenClaw.

- **[voice-call](/vi/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin cuộc gọi thoại của OpenClaw dành cho các cuộc gọi điện thoại qua Twilio, Telnyx và Plivo.

- **[whatsapp](/vi/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin kênh WhatsApp của OpenClaw dành cho các cuộc trò chuyện trên WhatsApp Web.

- **[zai](/vi/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Bổ sung hỗ trợ nhà cung cấp mô hình Z.AI cho OpenClaw.

- **[zalo](/vi/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin kênh Zalo của OpenClaw dành cho các cuộc trò chuyện qua bot và webhook.

- **[zalouser](/vi/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin Tài khoản Cá nhân Zalo của OpenClaw thông qua tích hợp zca-js gốc.

## Chỉ dành cho bản mã nguồn đã checkout

2 plugin

- **[qa-channel](/vi/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - chỉ dành cho bản mã nguồn đã checkout. Bổ sung bề mặt Kênh QA để gửi và nhận tin nhắn OpenClaw.

- **[qa-lab](/vi/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - chỉ dành cho bản mã nguồn đã checkout. Plugin phòng kiểm thử QA của OpenClaw với giao diện người dùng trình gỡ lỗi riêng tư và trình chạy kịch bản.
