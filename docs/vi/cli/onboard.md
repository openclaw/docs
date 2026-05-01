---
read_when:
    - Bạn muốn thiết lập có hướng dẫn cho Gateway, không gian làm việc, xác thực, kênh và Skills
summary: Tài liệu tham chiếu CLI cho `openclaw onboard` (hướng dẫn thiết lập tương tác)
title: Thiết lập ban đầu
x-i18n:
    generated_at: "2026-05-01T10:46:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1276a0b20f37da470bb4d49b38d06bacc38e7d0e85737a22971a2a9a3d90e244
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Thiết lập ban đầu tương tác cho cấu hình Gateway cục bộ hoặc từ xa.

## Hướng dẫn liên quan

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/vi/start/wizard" icon="rocket">
    Hướng dẫn từng bước về luồng CLI tương tác.
  </Card>
  <Card title="Onboarding overview" href="/vi/start/onboarding-overview" icon="map">
    Cách các phần của quy trình thiết lập ban đầu OpenClaw kết hợp với nhau.
  </Card>
  <Card title="CLI setup reference" href="/vi/start/wizard-cli-reference" icon="book">
    Đầu ra, nội bộ và hành vi theo từng bước.
  </Card>
  <Card title="CLI automation" href="/vi/start/wizard-cli-automation" icon="terminal">
    Các cờ không tương tác và thiết lập bằng script.
  </Card>
  <Card title="macOS app onboarding" href="/vi/start/onboarding" icon="apple">
    Luồng thiết lập ban đầu cho ứng dụng thanh menu macOS.
  </Card>
</CardGroup>

## Ví dụ

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` dùng các nhà cung cấp di trú do plugin sở hữu, chẳng hạn như Hermes. Nó chỉ chạy với một thiết lập OpenClaw mới; nếu đã có cấu hình, thông tin xác thực, phiên hoặc tệp bộ nhớ/danh tính workspace, hãy đặt lại hoặc chọn một thiết lập mới trước khi nhập.

`--modern` khởi động bản xem trước thiết lập ban đầu dạng hội thoại Crestodian. Khi không có
`--modern`, `openclaw onboard` giữ luồng thiết lập ban đầu cổ điển.

Đối với các đích `ws://` văn bản thuần trên mạng riêng (chỉ mạng đáng tin cậy), đặt
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trong môi trường tiến trình thiết lập ban đầu.
Không có cấu hình tương đương trong `openclaw.json` cho cơ chế bỏ chốt an toàn
của truyền tải phía client này.

Nhà cung cấp tùy chỉnh không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` là tùy chọn trong chế độ không tương tác. Nếu bỏ qua, thiết lập ban đầu sẽ kiểm tra `CUSTOM_API_KEY`.
OpenClaw tự động đánh dấu các ID mô hình thị giác phổ biến là có khả năng xử lý hình ảnh. Truyền `--custom-image-input` cho các ID thị giác tùy chỉnh chưa biết, hoặc `--custom-text-input` để buộc metadata chỉ văn bản.

LM Studio cũng hỗ trợ cờ khóa riêng cho nhà cung cấp trong chế độ không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Ollama không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` mặc định là `http://127.0.0.1:11434`. `--custom-model-id` là tùy chọn; nếu bỏ qua, thiết lập ban đầu dùng các mặc định do Ollama đề xuất. Các ID mô hình đám mây như `kimi-k2.5:cloud` cũng hoạt động ở đây.

Lưu khóa nhà cung cấp dưới dạng tham chiếu thay vì văn bản thuần:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Với `--secret-input-mode ref`, thiết lập ban đầu ghi các tham chiếu dựa trên env thay vì giá trị khóa văn bản thuần.
Đối với các nhà cung cấp dựa trên auth-profile, thao tác này ghi các mục `keyRef`; đối với nhà cung cấp tùy chỉnh, thao tác này ghi `models.providers.<id>.apiKey` dưới dạng tham chiếu env (ví dụ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Hợp đồng chế độ `ref` không tương tác:

- Đặt biến env của nhà cung cấp trong môi trường tiến trình thiết lập ban đầu (ví dụ `OPENAI_API_KEY`).
- Không truyền cờ khóa nội tuyến (ví dụ `--openai-api-key`) trừ khi biến env đó cũng được đặt.
- Nếu cờ khóa nội tuyến được truyền mà không có biến env bắt buộc, thiết lập ban đầu sẽ thất bại nhanh kèm hướng dẫn.

Tùy chọn token Gateway trong chế độ không tương tác:

- `--gateway-auth token --gateway-token <token>` lưu token văn bản thuần.
- `--gateway-auth token --gateway-token-ref-env <name>` lưu `gateway.auth.token` dưới dạng SecretRef env.
- `--gateway-token` và `--gateway-token-ref-env` loại trừ lẫn nhau.
- `--gateway-token-ref-env` yêu cầu một biến env không rỗng trong môi trường tiến trình thiết lập ban đầu.
- Với `--install-daemon`, khi xác thực bằng token yêu cầu token, token Gateway do SecretRef quản lý được xác thực nhưng không được lưu bền dưới dạng văn bản thuần đã phân giải trong metadata môi trường dịch vụ supervisor.
- Với `--install-daemon`, nếu chế độ token yêu cầu token và SecretRef token đã cấu hình chưa phân giải được, thiết lập ban đầu sẽ đóng thất bại kèm hướng dẫn khắc phục.
- Với `--install-daemon`, nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa đặt, thiết lập ban đầu sẽ chặn cài đặt cho đến khi mode được đặt rõ ràng.
- Thiết lập ban đầu cục bộ ghi `gateway.mode="local"` vào cấu hình. Nếu tệp cấu hình về sau thiếu `gateway.mode`, hãy xem đó là cấu hình bị hỏng hoặc chỉnh sửa thủ công chưa hoàn tất, không phải lối tắt hợp lệ cho chế độ cục bộ.
- Thiết lập ban đầu cục bộ hiện thực hóa các phụ thuộc runtime Plugin đi kèm mới được yêu cầu sau khi ghi cấu hình, trước khi workspace/bootstrap, cài đặt daemon hoặc kiểm tra sức khỏe tiếp tục. Đây là bước sửa chữa hẹp bằng trình quản lý gói, không phải một lần chạy `openclaw doctor` đầy đủ.
- Thiết lập ban đầu từ xa chỉ ghi thông tin kết nối cho Gateway từ xa và không cài đặt các phụ thuộc Plugin đi kèm cục bộ.
- `--allow-unconfigured` là một cửa thoát runtime Gateway riêng. Nó không có nghĩa là thiết lập ban đầu có thể bỏ qua `gateway.mode`.

Ví dụ:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Sức khỏe Gateway cục bộ không tương tác:

- Trừ khi bạn truyền `--skip-health`, thiết lập ban đầu sẽ chờ một gateway cục bộ có thể truy cập trước khi thoát thành công.
- `--install-daemon` khởi động đường dẫn cài đặt gateway được quản lý trước. Nếu không có cờ này, bạn phải có sẵn một gateway cục bộ đang chạy, ví dụ `openclaw gateway run`.
- Nếu trong tự động hóa bạn chỉ muốn ghi cấu hình/workspace/bootstrap, hãy dùng `--skip-health`.
- Nếu bạn tự quản lý tệp workspace, hãy truyền `--skip-bootstrap` để đặt `agents.defaults.skipBootstrap: true` và bỏ qua việc tạo `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, và `BOOTSTRAP.md`.
- Trên Windows gốc, `--install-daemon` thử Scheduled Tasks trước và chuyển sang mục đăng nhập Startup-folder theo người dùng nếu việc tạo tác vụ bị từ chối.

Hành vi thiết lập ban đầu tương tác với chế độ tham chiếu:

- Chọn **Dùng tham chiếu bí mật** khi được nhắc.
- Sau đó chọn một trong hai:
  - Biến môi trường
  - Nhà cung cấp bí mật đã cấu hình (`file` hoặc `exec`)
- Thiết lập ban đầu thực hiện xác thực preflight nhanh trước khi lưu tham chiếu.
  - Nếu xác thực thất bại, thiết lập ban đầu hiển thị lỗi và cho phép bạn thử lại.

### Lựa chọn endpoint Z.AI không tương tác

<Note>
`--auth-choice zai-api-key` tự động phát hiện endpoint Z.AI tốt nhất cho khóa của bạn (ưu tiên API chung với `zai/glm-5.1`). Nếu bạn muốn cụ thể các endpoint GLM Coding Plan, hãy chọn `zai-coding-global` hoặc `zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Ví dụ Mistral không tương tác:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Ghi chú luồng

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: lời nhắc tối thiểu, tự động tạo token gateway.
    - `manual`: đầy đủ lời nhắc cho cổng, liên kết và xác thực (bí danh của `advanced`).
    - `import`: chạy nhà cung cấp di trú đã phát hiện, xem trước kế hoạch, sau đó áp dụng sau khi xác nhận.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Khi một lựa chọn xác thực ngụ ý một nhà cung cấp ưu tiên, thiết lập ban đầu lọc trước bộ chọn mô hình mặc định và allowlist theo nhà cung cấp đó. Với Volcengine và BytePlus, thao tác này cũng khớp các biến thể coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Nếu bộ lọc nhà cung cấp ưu tiên chưa cho ra mô hình đã tải nào, thiết lập ban đầu sẽ quay về catalog chưa lọc thay vì để bộ chọn trống.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Một số nhà cung cấp tìm kiếm web kích hoạt các lời nhắc theo dõi riêng cho nhà cung cấp:

    - **Grok** có thể cung cấp thiết lập `x_search` tùy chọn với cùng `XAI_API_KEY` và lựa chọn mô hình `x_search`.
    - **Kimi** có thể hỏi vùng API Moonshot (`api.moonshot.ai` so với `api.moonshot.cn`) và mô hình tìm kiếm web Kimi mặc định.

  </Accordion>
  <Accordion title="Other behaviors">
    - Hành vi phạm vi DM của thiết lập ban đầu cục bộ: [tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals).
    - Cuộc trò chuyện đầu tiên nhanh nhất: `openclaw dashboard` (Control UI, không cần thiết lập kênh).
    - Nhà cung cấp tùy chỉnh: kết nối bất kỳ endpoint tương thích OpenAI hoặc Anthropic nào, bao gồm các nhà cung cấp lưu trữ không được liệt kê. Dùng Unknown để tự động phát hiện.
    - Nếu phát hiện trạng thái Hermes, thiết lập ban đầu sẽ cung cấp luồng di trú. Dùng [Migrate](/vi/cli/migrate) cho kế hoạch chạy thử, chế độ ghi đè, báo cáo và ánh xạ chính xác.

  </Accordion>
</AccordionGroup>

## Lệnh theo dõi thường dùng

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` không ngụ ý chế độ không tương tác. Dùng `--non-interactive` cho script.
</Note>
