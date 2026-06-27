---
read_when:
    - Bạn đang quyết định liệu một plugin được phát hành trong gói npm lõi hay được cài đặt riêng
    - Bạn đang cập nhật siêu dữ liệu gói Plugin đi kèm hoặc tự động hóa phát hành
    - Bạn cần danh sách Plugin nội bộ và bên ngoài chuẩn
summary: Bản kiểm kê được tạo về các Plugin OpenClaw được phát hành trong lõi, phát hành bên ngoài, hoặc chỉ giữ dưới dạng mã nguồn
title: Kho Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f0c5aa2c3e5f25308a4398dc2582caa8f355a4dfd0d5693d9cfaf1c1ce6926
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Danh mục Plugin

Trang này được tạo từ `extensions/*/package.json`, `openclaw.plugin.json`,
và các loại trừ `files` của gói npm gốc. Tạo lại bằng:

```bash
pnpm plugins:inventory:gen
```

## Định nghĩa

- **Gói npm lõi:** được tích hợp vào gói npm `openclaw` và có sẵn mà không cần cài đặt Plugin riêng.
- **Gói bên ngoài chính thức:** Plugin do OpenClaw duy trì, bị loại khỏi gói npm lõi, được giữ trong danh mục chính thức này và được cài đặt khi cần thông qua ClawHub và/hoặc npm.
- **Chỉ checkout nguồn:** Plugin cục bộ trong repo, bị loại khỏi các artifact npm đã xuất bản và không được quảng bá như một gói có thể cài đặt.

Các checkout nguồn khác với cài đặt npm: sau `pnpm install`, các Plugin được đóng gói
tải từ `extensions/<id>` để các chỉnh sửa cục bộ và dependency workspace cục bộ theo gói
khả dụng.

## Cài đặt Plugin

Dùng tuyến cài đặt trong từng mục để quyết định có cần cài đặt hay không. Các Plugin
ghi `được bao gồm trong OpenClaw` đã có sẵn trong gói lõi.
Các gói bên ngoài chính thức cần cài đặt một lần, rồi khởi động lại Gateway.

Ví dụ, Discord là một gói bên ngoài chính thức:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Trong giai đoạn chuyển đổi khi ra mắt, các spec gói trần thông thường vẫn cài đặt từ npm.
Dùng `clawhub:@openclaw/discord` hoặc `npm:@openclaw/discord` khi bạn cần một
nguồn rõ ràng. Sau khi cài đặt, làm theo tài liệu thiết lập của Plugin, chẳng hạn như
[Discord](/vi/channels/discord), để thêm thông tin xác thực và cấu hình kênh. Xem
[Quản lý Plugin](/vi/plugins/manage-plugins) để biết các lệnh cập nhật, gỡ cài đặt và xuất bản.

Mỗi mục liệt kê gói, tuyến phân phối và mô tả.

## Gói npm lõi

59 Plugin

- **[admin-http-rpc](/vi/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - được bao gồm trong OpenClaw. Endpoint HTTP RPC quản trị OpenClaw.

- **[alibaba](/vi/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp tạo video.

- **[anthropic](/vi/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Anthropic cho OpenClaw.

- **[azure-speech](/vi/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - được bao gồm trong OpenClaw. Văn bản thành giọng nói Azure AI Speech (MP3, ghi chú thoại Ogg/Opus gốc, PCM điện thoại).

- **[bonjour](/vi/plugins/reference/bonjour)** (`@openclaw/bonjour`) - được bao gồm trong OpenClaw. Quảng bá Gateway OpenClaw cục bộ qua Bonjour/mDNS.

- **[browser](/vi/plugins/reference/browser)** (`@openclaw/browser-plugin`) - được bao gồm trong OpenClaw. Thêm công cụ mà agent có thể gọi.

- **[byteplus](/vi/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình BytePlus, BytePlus Plan cho OpenClaw.

- **[canvas](/vi/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - được bao gồm trong OpenClaw. Các bề mặt điều khiển Canvas và kết xuất A2UI thử nghiệm cho các node được ghép đôi.

- **[codex-supervisor](/vi/plugins/reference/codex-supervisor)** (`@openclaw/codex-supervisor`) - được bao gồm trong OpenClaw. Giám sát các phiên Codex app-server từ OpenClaw.

- **[cohere](/vi/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - được bao gồm trong OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin nhà cung cấp Cohere của OpenClaw.

- **[comfy](/vi/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình ComfyUI cho OpenClaw.

- **[copilot-proxy](/vi/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Copilot Proxy cho OpenClaw.

- **[deepgram](/vi/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp hiểu media. Thêm hỗ trợ nhà cung cấp phiên âm thời gian thực.

- **[document-extract](/vi/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - được bao gồm trong OpenClaw. Trích xuất văn bản và ảnh trang dự phòng từ tệp đính kèm tài liệu cục bộ.

- **[duckduckgo](/vi/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp tìm kiếm web.

- **[elevenlabs](/vi/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp hiểu media. Thêm hỗ trợ nhà cung cấp phiên âm thời gian thực. Thêm hỗ trợ nhà cung cấp văn bản thành giọng nói.

- **[fal](/vi/plugins/reference/fal)** (`@openclaw/fal-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình fal cho OpenClaw.

- **[file-transfer](/vi/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - được bao gồm trong OpenClaw. Tải về, liệt kê và ghi tệp trên các node được ghép đôi qua các lệnh node chuyên dụng. Vượt qua giới hạn cắt ngắn stdout của bash bằng cách dùng base64 qua node.invoke cho nhị phân tối đa 16 MB.

- **[github-copilot](/vi/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình GitHub Copilot cho OpenClaw.

- **[google](/vi/plugins/reference/google)** (`@openclaw/google-plugin`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Google, Google Gemini CLI, Google Vertex cho OpenClaw.

- **[huggingface](/vi/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Hugging Face cho OpenClaw.

- **[imessage](/vi/plugins/reference/imessage)** (`@openclaw/imessage`) - được bao gồm trong OpenClaw. Thêm bề mặt kênh iMessage để gửi và nhận tin nhắn OpenClaw.

- **[litellm](/vi/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình LiteLLM cho OpenClaw.

- **[llm-task](/vi/plugins/reference/llm-task)** (`@openclaw/llm-task`) - được bao gồm trong OpenClaw. Công cụ LLM chỉ JSON chung cho các tác vụ có cấu trúc, có thể gọi từ workflow.

- **[lmstudio](/vi/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình LM Studio cho OpenClaw.

- **[memory-core](/vi/plugins/reference/memory-core)** (`@openclaw/memory-core`) - được bao gồm trong OpenClaw. Thêm công cụ mà agent có thể gọi.

- **[memory-wiki](/vi/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - được bao gồm trong OpenClaw. Trình biên dịch wiki bền vững và kho tri thức thân thiện với Obsidian cho OpenClaw.

- **[microsoft](/vi/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp văn bản thành giọng nói.

- **[microsoft-foundry](/vi/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Microsoft Foundry cho OpenClaw.

- **[migrate-claude](/vi/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - được bao gồm trong OpenClaw. Nhập chỉ dẫn Claude Code và Claude Desktop, máy chủ MCP, Skills, và cấu hình an toàn vào OpenClaw.

- **[migrate-hermes](/vi/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - được bao gồm trong OpenClaw. Nhập cấu hình Hermes, bộ nhớ, Skills, và thông tin xác thực được hỗ trợ vào OpenClaw.

- **[minimax](/vi/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình MiniMax, MiniMax Portal cho OpenClaw.

- **[mistral](/vi/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Mistral cho OpenClaw.

- **[novita](/vi/plugins/reference/novita)** (`@openclaw/novita-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Novita, Novita AI, Novitaai cho OpenClaw.

- **[nvidia](/vi/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình NVIDIA cho OpenClaw.

- **[oc-path](/vi/plugins/reference/oc-path)** (`@openclaw/oc-path`) - được bao gồm trong OpenClaw. Thêm CLI đường dẫn openclaw cho định địa chỉ tệp workspace oc://.

- **[ollama](/vi/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Ollama, Ollama Cloud cho OpenClaw.

- **[open-prose](/vi/plugins/reference/open-prose)** (`@openclaw/open-prose`) - được bao gồm trong OpenClaw. Gói skill OpenProse VM với lệnh slash /prose.

- **[openai](/vi/plugins/reference/openai)** (`@openclaw/openai-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình OpenAI cho OpenClaw.

- **[opencode](/vi/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình OpenCode cho OpenClaw.

- **[opencode-go](/vi/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình OpenCode Go cho OpenClaw.

- **[openrouter](/vi/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình OpenRouter cho OpenClaw.

- **[policy](/vi/plugins/reference/policy)** (`@openclaw/policy`) - được bao gồm trong OpenClaw. Thêm các kiểm tra doctor dựa trên policy cho việc tuân thủ của workspace.

- **[runway](/vi/plugins/reference/runway)** (`@openclaw/runway-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp tạo video.

- **[senseaudio](/vi/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp hiểu media.

- **[sglang](/vi/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình SGLang cho OpenClaw.

- **[synthetic](/vi/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Synthetic cho OpenClaw.

- **[telegram](/vi/plugins/reference/telegram)** (`@openclaw/telegram`) - được bao gồm trong OpenClaw. Thêm bề mặt kênh Telegram để gửi và nhận tin nhắn OpenClaw.

- **[together](/vi/plugins/reference/together)** (`@openclaw/together-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Together cho OpenClaw.

- **[tts-local-cli](/vi/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp văn bản thành giọng nói.

- **[vllm](/vi/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình vLLM cho OpenClaw.

- **[volcengine](/vi/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Volcengine, Volcengine Plan cho OpenClaw.

- **[voyage](/vi/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp embedding bộ nhớ.

- **[vydra](/vi/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Vydra cho OpenClaw.

- **[web-readability](/vi/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - được bao gồm trong OpenClaw. Trích xuất nội dung bài viết dễ đọc từ các phản hồi tải web HTML cục bộ.

- **[webhooks](/vi/plugins/reference/webhooks)** (`@openclaw/webhooks`) - được bao gồm trong OpenClaw. Các Webhook đầu vào đã xác thực, liên kết tự động hóa bên ngoài với OpenClaw TaskFlows.

- **[workboard](/vi/plugins/reference/workboard)** (`@openclaw/workboard`) - được bao gồm trong OpenClaw. Workboard dạng dashboard cho các issue và phiên do agent sở hữu.

- **[xai](/vi/plugins/reference/xai)** (`@openclaw/xai-plugin`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình xAI cho OpenClaw.

- **[xiaomi](/vi/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - được bao gồm trong OpenClaw. Thêm hỗ trợ nhà cung cấp mô hình Xiaomi, Xiaomi Token Plan cho OpenClaw.

## Gói bên ngoài chính thức

68 Plugin

- **[acpx](/vi/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend runtime ACP của OpenClaw với quản lý phiên và vận chuyển do Plugin sở hữu.

- **[amazon-bedrock](/vi/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin nhà cung cấp Amazon Bedrock của OpenClaw với hỗ trợ khám phá mô hình, embedding và guardrail.

- **[amazon-bedrock-mantle](/vi/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin nhà cung cấp Amazon Bedrock Mantle của OpenClaw để định tuyến mô hình tương thích OpenAI.

- **[anthropic-vertex](/vi/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin nhà cung cấp Anthropic Vertex của OpenClaw cho các mô hình Claude trên Google Vertex AI.

- **[arcee](/vi/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Thêm hỗ trợ nhà cung cấp mô hình Arcee vào OpenClaw.

- **[brave](/vi/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin nhà cung cấp Brave Search của OpenClaw cho tìm kiếm web.

- **[cerebras](/vi/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Thêm hỗ trợ nhà cung cấp mô hình Cerebras vào OpenClaw.

- **[chutes](/vi/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Thêm hỗ trợ nhà cung cấp mô hình Chutes vào OpenClaw.

- **[clickclack](/vi/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Thêm bề mặt kênh Clickclack để gửi và nhận tin nhắn OpenClaw.

- **[cloudflare-ai-gateway](/vi/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Thêm hỗ trợ nhà cung cấp mô hình Cloudflare AI Gateway vào OpenClaw.

- **[codex](/vi/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Plugin bộ điều phối máy chủ ứng dụng Codex và nhà cung cấp mô hình của OpenClaw với danh mục GPT do Codex quản lý.

- **[copilot](/vi/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Đăng ký runtime tác tử GitHub Copilot.

- **[deepinfra](/vi/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Thêm hỗ trợ nhà cung cấp mô hình DeepInfra vào OpenClaw.

- **[deepseek](/vi/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Thêm hỗ trợ nhà cung cấp mô hình DeepSeek vào OpenClaw.

- **[diagnostics-otel](/vi/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Bộ xuất chẩn đoán OpenTelemetry của OpenClaw cho số liệu, dấu vết và nhật ký.

- **[diagnostics-prometheus](/vi/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Bộ xuất Prometheus chẩn đoán của OpenClaw cho số liệu runtime.

- **[diffs](/vi/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin trình xem diff chỉ đọc và trình kết xuất tệp cho tác tử của OpenClaw.

- **[diffs-language-pack](/vi/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Thêm tô sáng cú pháp cho các ngôn ngữ ngoài bộ trình xem diff mặc định.

- **[discord](/vi/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin kênh Discord của OpenClaw cho kênh, DM, lệnh và sự kiện ứng dụng.

- **[exa](/vi/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Thêm hỗ trợ nhà cung cấp tìm kiếm web.

- **[feishu](/vi/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin kênh Feishu/Lark của OpenClaw cho trò chuyện và công cụ nơi làm việc (do cộng đồng @m1heng duy trì).

- **[firecrawl](/vi/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Thêm công cụ mà tác tử có thể gọi. Thêm hỗ trợ nhà cung cấp tìm nạp web. Thêm hỗ trợ nhà cung cấp tìm kiếm web.

- **[fireworks](/vi/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Thêm hỗ trợ nhà cung cấp mô hình Fireworks vào OpenClaw.

- **[gmi](/vi/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin nhà cung cấp GMI Cloud của OpenClaw.

- **[google-meet](/vi/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin người tham gia Google Meet của OpenClaw để tham gia cuộc gọi qua các phương thức truyền tải Chrome hoặc Twilio.

- **[googlechat](/vi/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin kênh Google Chat của OpenClaw cho không gian và tin nhắn trực tiếp.

- **[gradium](/vi/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Thêm hỗ trợ nhà cung cấp chuyển văn bản thành giọng nói.

- **[groq](/vi/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Thêm hỗ trợ nhà cung cấp mô hình Groq vào OpenClaw.

- **[inworld](/vi/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Chuyển văn bản thành giọng nói phát trực tuyến Inworld (MP3, OGG_OPUS, PCM điện thoại).

- **[irc](/vi/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Thêm bề mặt kênh IRC để gửi và nhận tin nhắn OpenClaw.

- **[kilocode](/vi/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Thêm hỗ trợ nhà cung cấp mô hình Kilocode vào OpenClaw.

- **[kimi](/vi/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Thêm hỗ trợ nhà cung cấp mô hình Kimi, Kimi Coding vào OpenClaw.

- **[line](/vi/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin kênh LINE của OpenClaw cho trò chuyện LINE Bot API.

- **[llama-cpp](/vi/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Nhúng GGUF cục bộ thông qua node-llama-cpp.

- **[lobster](/vi/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin công cụ quy trình làm việc Lobster cho các pipeline có kiểu và phê duyệt có thể tiếp tục.

- **[matrix](/vi/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin kênh Matrix của OpenClaw cho phòng và tin nhắn trực tiếp.

- **[mattermost](/vi/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Thêm bề mặt kênh Mattermost để gửi và nhận tin nhắn OpenClaw.

- **[memory-lancedb](/vi/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin bộ nhớ dài hạn dựa trên LanceDB của OpenClaw với tự động nhớ lại, tự động ghi lại và tìm kiếm vector.

- **[moonshot](/vi/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Thêm hỗ trợ nhà cung cấp mô hình Moonshot vào OpenClaw.

- **[msteams](/vi/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin kênh Microsoft Teams của OpenClaw cho hội thoại bot.

- **[nextcloud-talk](/vi/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin kênh Nextcloud Talk của OpenClaw cho hội thoại.

- **[nostr](/vi/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin kênh Nostr của OpenClaw cho tin nhắn trực tiếp được mã hóa NIP-04.

- **[openshell](/vi/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend sandbox của OpenClaw cho NVIDIA OpenShell CLI với không gian làm việc cục bộ được phản chiếu và thực thi lệnh SSH.

- **[parallel](/vi/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Thêm hỗ trợ nhà cung cấp tìm kiếm web.

- **[perplexity](/vi/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Thêm hỗ trợ nhà cung cấp tìm kiếm web.

- **[pixverse](/vi/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin nhà cung cấp tạo video PixVerse của OpenClaw.

- **[qianfan](/vi/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Thêm hỗ trợ nhà cung cấp mô hình Qianfan vào OpenClaw.

- **[qqbot](/vi/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin kênh QQ Bot của OpenClaw cho quy trình làm việc nhóm và tin nhắn trực tiếp.

- **[qwen](/vi/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Thêm hỗ trợ nhà cung cấp mô hình Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Oauth, Qwen Portal, Qwen CLI vào OpenClaw.

- **[raft](/vi/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin kênh Raft của OpenClaw cho cầu đánh thức CLI bảo mật.

- **[searxng](/vi/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Thêm hỗ trợ nhà cung cấp tìm kiếm web.

- **[signal](/vi/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Thêm bề mặt kênh Signal để gửi và nhận tin nhắn OpenClaw.

- **[slack](/vi/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin kênh Slack của OpenClaw cho kênh, DM, lệnh và sự kiện ứng dụng.

- **[sms](/vi/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin kênh SMS Twilio cho tin nhắn văn bản OpenClaw.

- **[stepfun](/vi/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Thêm hỗ trợ nhà cung cấp mô hình StepFun, StepFun Plan vào OpenClaw.

- **[synology-chat](/vi/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin kênh Synology Chat cho kênh OpenClaw và tin nhắn trực tiếp.

- **[tavily](/vi/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Thêm công cụ mà tác tử có thể gọi. Thêm hỗ trợ nhà cung cấp tìm kiếm web.

- **[tencent](/vi/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Thêm hỗ trợ nhà cung cấp mô hình Tencent TokenHub vào OpenClaw.

- **[tlon](/vi/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin kênh Tlon/Urbit của OpenClaw cho quy trình làm việc trò chuyện.

- **[tokenjuice](/vi/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Nén kết quả công cụ exec và bash bằng các bộ rút gọn tokenjuice.

- **[twitch](/vi/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin kênh Twitch của OpenClaw cho quy trình làm việc trò chuyện và kiểm duyệt.

- **[venice](/vi/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Thêm hỗ trợ nhà cung cấp mô hình Venice vào OpenClaw.

- **[vercel-ai-gateway](/vi/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Thêm hỗ trợ nhà cung cấp mô hình Vercel AI Gateway vào OpenClaw.

- **[voice-call](/vi/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin voice-call của OpenClaw cho cuộc gọi điện thoại Twilio, Telnyx và Plivo.

- **[whatsapp](/vi/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin kênh WhatsApp của OpenClaw cho trò chuyện WhatsApp Web.

- **[zai](/vi/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Thêm hỗ trợ nhà cung cấp mô hình Z.AI vào OpenClaw.

- **[zalo](/vi/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin kênh Zalo của OpenClaw cho trò chuyện bot và webhook.

- **[zalouser](/vi/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin Tài khoản Cá nhân Zalo của OpenClaw thông qua tích hợp zca-js gốc.

## Chỉ checkout nguồn

3 plugin

- **[qa-channel](/vi/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - chỉ checkout nguồn. Thêm bề mặt Kênh QA để gửi và nhận tin nhắn OpenClaw.

- **[qa-lab](/vi/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - chỉ checkout nguồn. Plugin phòng thí nghiệm QA của OpenClaw với giao diện người dùng gỡ lỗi riêng tư và trình chạy kịch bản.

- **[qa-matrix](/vi/plugins/reference/qa-matrix)** (`@openclaw/qa-matrix`) - chỉ dành cho bản checkout nguồn. Trình chạy vận chuyển QA Matrix và nền tảng cơ sở.
