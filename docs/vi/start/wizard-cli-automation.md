---
read_when:
    - Bạn đang tự động hóa quy trình thiết lập ban đầu trong các tập lệnh hoặc CI
    - Bạn cần các ví dụ không tương tác cho những nhà cung cấp cụ thể
sidebarTitle: CLI automation
summary: Hướng dẫn nhập môn và thiết lập tác nhân bằng tập lệnh cho OpenClaw CLI
title: Tự động hóa CLI
x-i18n:
    generated_at: "2026-07-12T08:23:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de3115fd0c675b92f22cf9c44ddd307a854e499c6f163235f991368429b2c152
    source_path: start/wizard-cli-automation.md
    workflow: 16
---

Sử dụng `openclaw onboard --non-interactive` để thiết lập bằng tập lệnh. Lệnh này yêu cầu `--accept-risk`: quá trình thiết lập không tương tác có thể ghi thông tin xác thực và cấu hình daemon mà không có lời nhắc xác nhận, vì vậy cờ này thể hiện việc xác nhận rủi ro một cách rõ ràng.

<Note>
`--json` không mặc nhiên bật chế độ không tương tác. Hãy truyền rõ ràng `--non-interactive --accept-risk` cho các tập lệnh.
</Note>

## Ví dụ không tương tác cơ bản

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Thêm `--json` để nhận bản tóm tắt mà máy có thể đọc được.

- `--gateway-port` mặc định là `18789`; chỉ truyền cờ này khi cần ghi đè.
- `--skip-bootstrap` bỏ qua việc tạo các tệp không gian làm việc mặc định, dành cho quy trình tự động hóa đã điền sẵn không gian làm việc riêng.
- `--secret-input-mode ref` lưu một tham chiếu dựa trên biến môi trường (`{ source: "env", provider: "default", id: "<ENV_VAR>" }`) trong hồ sơ xác thực thay vì khóa dạng văn bản thuần. Ở chế độ `ref` không tương tác, biến môi trường của nhà cung cấp phải được thiết lập sẵn trong môi trường tiến trình: việc truyền cờ khóa nội tuyến mà không có biến môi trường tương ứng sẽ thất bại ngay lập tức.

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref
```

## Ví dụ dành riêng cho từng nhà cung cấp

<AccordionGroup>
  <Accordion title="Ví dụ về khóa API Anthropic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ về Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ về Gemini">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ về Mistral">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ về Moonshot">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ về Ollama">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ về OpenCode">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-bind loopback
    ```
    Chuyển sang `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` để sử dụng danh mục Go.
  </Accordion>
  <Accordion title="Ví dụ về Synthetic">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ về Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ về Z.AI">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ví dụ về nhà cung cấp tùy chỉnh">
    ```bash
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

    `--custom-api-key` là tùy chọn; một số điểm cuối không yêu cầu xác thực. Nếu bỏ qua, quá trình thiết lập ban đầu sẽ kiểm tra `CUSTOM_API_KEY` trong môi trường. `--custom-provider-id` là tùy chọn và được tự động suy ra từ URL cơ sở khi bị bỏ qua. `--custom-compatibility` mặc định là `openai` (các giá trị khác: `openai-responses`, `anthropic`).

    OpenClaw suy luận khả năng hỗ trợ đầu vào hình ảnh từ các mẫu mã định danh mô hình thị giác đã biết (`gpt-4o`, `claude-3/4`, `gemini`, các hậu tố `-vl`/`vision` và những mẫu tương tự). Thêm `--custom-image-input` để buộc bật tính năng này cho một mô hình thị giác chưa được nhận diện, hoặc `--custom-text-input` để buộc chỉ sử dụng văn bản.

    Biến thể chế độ tham chiếu, lưu `apiKey` dưới dạng `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive --accept-risk \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --custom-image-input \
      --gateway-bind loopback
    ```

  </Accordion>
</AccordionGroup>

Xác thực bằng mã thông báo thiết lập Anthropic vẫn được hỗ trợ, nhưng OpenClaw ưu tiên tái sử dụng Claude CLI khi có phiên đăng nhập Claude CLI cục bộ. Đối với môi trường sản xuất, nên ưu tiên khóa API Anthropic.

## Thêm một tác tử khác

`openclaw agents add <name>` tạo một tác tử riêng biệt với không gian làm việc, phiên và hồ sơ xác thực riêng. Chạy lệnh mà không có `--workspace` (và không có cờ nào khác) sẽ khởi chạy trình hướng dẫn tương tác; việc truyền bất kỳ cờ nào trong số `--workspace`, `--model`, `--agent-dir`, `--bind` hoặc `--non-interactive` sẽ chạy lệnh ở chế độ không tương tác và khi đó yêu cầu phải có `--workspace`.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.6-sol \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Các khóa cấu hình mà lệnh ghi (mục nhập `agents.list[]` cho mã định danh tác tử mới):

- `name`
- `workspace`
- `agentDir`
- `model` (chỉ khi truyền `--model`)

Lưu ý:

- Không gian làm việc mặc định (khi bỏ qua `--workspace` trong trình hướng dẫn tương tác): `~/.openclaw/workspace-<agentId>`.
- `--bind <channel[:accountId]>` có thể được lặp lại; thêm các liên kết để định tuyến tin nhắn đến cho tác tử mới (trình hướng dẫn cũng có thể thực hiện việc này theo cách tương tác).
- Tên tác tử được chuẩn hóa thành một mã định danh tác tử hợp lệ; `main` được dành riêng.

## Tài liệu liên quan

- Trung tâm thiết lập ban đầu: [Thiết lập ban đầu (CLI)](/vi/start/wizard)
- Tài liệu tham khảo đầy đủ: [Tài liệu tham khảo về thiết lập CLI](/vi/start/wizard-cli-reference)
- Tài liệu tham khảo lệnh: [`openclaw onboard`](/vi/cli/onboard)
