---
read_when:
    - Bạn đang tự động hóa quy trình thiết lập ban đầu trong các tập lệnh hoặc CI
    - Bạn cần các ví dụ không tương tác cho các nhà cung cấp cụ thể
sidebarTitle: CLI automation
summary: Onboarding bằng script và thiết lập agent cho OpenClaw CLI
title: Tự động hóa CLI
x-i18n:
    generated_at: "2026-04-29T23:15:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a169abafa682e99d2cd89dbcc9a738790d7fdfa7ba204f415baac35d6df4a2f
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Dùng `--non-interactive` để tự động hóa `openclaw onboard`.

<Note>
`--json` không ngụ ý chế độ không tương tác. Dùng `--non-interactive` (và `--workspace`) cho script.
</Note>

## Ví dụ không tương tác cơ sở

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Thêm `--json` để có bản tóm tắt máy có thể đọc.

Dùng `--skip-bootstrap` khi phần tự động hóa của bạn đã tạo sẵn các tệp workspace và không muốn onboarding tạo các tệp bootstrap mặc định.

Dùng `--secret-input-mode ref` để lưu các ref dựa trên env trong auth profile thay vì giá trị plaintext.
Lựa chọn tương tác giữa env ref và ref provider đã cấu hình (`file` hoặc `exec`) có sẵn trong luồng onboarding.

Ở chế độ `ref` không tương tác, các biến env của provider phải được đặt trong môi trường tiến trình.
Việc truyền các flag khóa nội tuyến mà không có biến env khớp hiện sẽ thất bại ngay.

Ví dụ:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Ví dụ theo provider

<AccordionGroup>
  <Accordion title="Ví dụ khóa API Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Chuyển sang `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` cho catalog Go.
  </Accordion>
  <Accordion title="Ví dụ Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ provider tùy chỉnh">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` là tùy chọn. Nếu bỏ qua, onboarding sẽ kiểm tra `CUSTOM_API_KEY`.
    OpenClaw tự động đánh dấu các ID model thị giác phổ biến là có khả năng xử lý hình ảnh. Thêm `--custom-image-input` cho các ID thị giác tùy chỉnh không xác định, hoặc `--custom-text-input` để buộc metadata chỉ văn bản.

    Biến thể chế độ ref:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    Trong chế độ này, onboarding lưu `apiKey` dưới dạng `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

Setup-token Anthropic vẫn có sẵn như một đường dẫn token onboarding được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI khi có sẵn.
Với production, ưu tiên khóa API Anthropic.

## Thêm một agent khác

Dùng `openclaw agents add <name>` để tạo một agent riêng với workspace,
phiên và auth profile của riêng nó. Chạy không có `--workspace` sẽ khởi chạy wizard.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Những gì lệnh này đặt:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Ghi chú:

- Workspace mặc định theo mẫu `~/.openclaw/workspace-<agentId>`.
- Thêm `bindings` để định tuyến tin nhắn đến (wizard có thể thực hiện việc này).
- Flag không tương tác: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Tài liệu liên quan

- Trung tâm onboarding: [Onboarding (CLI)](/vi/start/wizard)
- Tham chiếu đầy đủ: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference)
- Tham chiếu lệnh: [`openclaw onboard`](/vi/cli/onboard)
