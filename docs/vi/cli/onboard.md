---
read_when:
    - Bạn muốn thiết lập có hướng dẫn cho Gateway, không gian làm việc, xác thực, kênh và Skills
summary: Tài liệu tham chiếu CLI cho `openclaw onboard` (hướng dẫn thiết lập ban đầu tương tác)
title: Thiết lập ban đầu
x-i18n:
    generated_at: "2026-04-29T22:33:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Thiết lập ban đầu tương tác cho cấu hình Gateway cục bộ hoặc từ xa.

## Hướng dẫn liên quan

<CardGroup cols={2}>
  <Card title="Trung tâm thiết lập ban đầu CLI" href="/vi/start/wizard" icon="rocket">
    Hướng dẫn từng bước về luồng CLI tương tác.
  </Card>
  <Card title="Tổng quan thiết lập ban đầu" href="/vi/start/onboarding-overview" icon="map">
    Cách các phần thiết lập ban đầu của OpenClaw kết hợp với nhau.
  </Card>
  <Card title="Tham chiếu thiết lập CLI" href="/vi/start/wizard-cli-reference" icon="book">
    Đầu ra, nội bộ và hành vi theo từng bước.
  </Card>
  <Card title="Tự động hóa CLI" href="/vi/start/wizard-cli-automation" icon="terminal">
    Các cờ không tương tác và thiết lập theo kịch bản.
  </Card>
  <Card title="Thiết lập ban đầu ứng dụng macOS" href="/vi/start/onboarding" icon="apple">
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

`--flow import` dùng các trình cung cấp di chuyển do Plugin sở hữu, chẳng hạn như Hermes. Nó chỉ chạy trên một thiết lập OpenClaw mới; nếu đã có cấu hình, thông tin xác thực, phiên hoặc các tệp bộ nhớ/danh tính không gian làm việc, hãy đặt lại hoặc chọn một thiết lập mới trước khi nhập.

`--modern` khởi động bản xem trước thiết lập ban đầu dạng hội thoại Crestodian. Nếu không có
`--modern`, `openclaw onboard` giữ luồng thiết lập ban đầu cổ điển.

Đối với các đích `ws://` văn bản thuần trên mạng riêng (chỉ mạng tin cậy), hãy đặt
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trong môi trường quy trình thiết lập ban đầu.
Không có mục tương đương trong `openclaw.json` cho cơ chế khẩn cấp phía client
của phương thức truyền tải này.

Trình cung cấp tùy chỉnh không tương tác:

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
OpenClaw tự động đánh dấu các ID mô hình thị giác phổ biến là có khả năng xử lý hình ảnh. Truyền `--custom-image-input` cho các ID thị giác tùy chỉnh chưa biết, hoặc `--custom-text-input` để buộc siêu dữ liệu chỉ văn bản.

LM Studio cũng hỗ trợ cờ khóa riêng cho trình cung cấp trong chế độ không tương tác:

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

`--custom-base-url` mặc định là `http://127.0.0.1:11434`. `--custom-model-id` là tùy chọn; nếu bỏ qua, thiết lập ban đầu sẽ dùng các mặc định được Ollama đề xuất. Các ID mô hình đám mây như `kimi-k2.5:cloud` cũng hoạt động tại đây.

Lưu khóa trình cung cấp dưới dạng tham chiếu thay vì văn bản thuần:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Với `--secret-input-mode ref`, thiết lập ban đầu ghi các tham chiếu dựa trên biến môi trường thay vì giá trị khóa văn bản thuần.
Đối với các trình cung cấp dựa trên hồ sơ xác thực, thao tác này ghi các mục `keyRef`; đối với trình cung cấp tùy chỉnh, thao tác này ghi `models.providers.<id>.apiKey` dưới dạng tham chiếu biến môi trường (ví dụ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Hợp đồng chế độ `ref` không tương tác:

- Đặt biến môi trường của trình cung cấp trong môi trường quy trình thiết lập ban đầu (ví dụ `OPENAI_API_KEY`).
- Không truyền cờ khóa nội tuyến (ví dụ `--openai-api-key`) trừ khi biến môi trường đó cũng được đặt.
- Nếu cờ khóa nội tuyến được truyền mà không có biến môi trường bắt buộc, thiết lập ban đầu sẽ thất bại nhanh kèm hướng dẫn.

Tùy chọn token Gateway trong chế độ không tương tác:

- `--gateway-auth token --gateway-token <token>` lưu token văn bản thuần.
- `--gateway-auth token --gateway-token-ref-env <name>` lưu `gateway.auth.token` dưới dạng SecretRef biến môi trường.
- `--gateway-token` và `--gateway-token-ref-env` loại trừ lẫn nhau.
- `--gateway-token-ref-env` yêu cầu một biến môi trường không rỗng trong môi trường quy trình thiết lập ban đầu.
- Với `--install-daemon`, khi xác thực bằng token yêu cầu token, các token Gateway do SecretRef quản lý được xác thực nhưng không được lưu bền dưới dạng văn bản thuần đã phân giải trong siêu dữ liệu môi trường dịch vụ giám sát.
- Với `--install-daemon`, nếu chế độ token yêu cầu token và SecretRef token đã cấu hình không phân giải được, thiết lập ban đầu sẽ đóng thất bại kèm hướng dẫn khắc phục.
- Với `--install-daemon`, nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, thiết lập ban đầu sẽ chặn cài đặt cho đến khi chế độ được đặt rõ ràng.
- Thiết lập ban đầu cục bộ ghi `gateway.mode="local"` vào cấu hình. Nếu tệp cấu hình sau đó thiếu `gateway.mode`, hãy xem đó là cấu hình bị hỏng hoặc một chỉnh sửa thủ công chưa hoàn tất, không phải lối tắt chế độ cục bộ hợp lệ.
- `--allow-unconfigured` là một cơ chế thoát riêng cho thời gian chạy Gateway. Nó không có nghĩa là thiết lập ban đầu có thể bỏ qua `gateway.mode`.

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

Tình trạng Gateway cục bộ không tương tác:

- Trừ khi bạn truyền `--skip-health`, thiết lập ban đầu sẽ chờ một Gateway cục bộ có thể kết nối trước khi thoát thành công.
- `--install-daemon` khởi động đường dẫn cài đặt Gateway được quản lý trước. Nếu không có nó, bạn phải có sẵn một Gateway cục bộ đang chạy, ví dụ `openclaw gateway run`.
- Nếu bạn chỉ muốn ghi cấu hình/không gian làm việc/bootstrap trong tự động hóa, hãy dùng `--skip-health`.
- Nếu bạn tự quản lý các tệp không gian làm việc, hãy truyền `--skip-bootstrap` để đặt `agents.defaults.skipBootstrap: true` và bỏ qua việc tạo `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, và `BOOTSTRAP.md`.
- Trên Windows gốc, `--install-daemon` thử Scheduled Tasks trước và chuyển dự phòng sang mục đăng nhập thư mục Startup theo người dùng nếu việc tạo tác vụ bị từ chối.

Hành vi thiết lập ban đầu tương tác với chế độ tham chiếu:

- Chọn **Dùng tham chiếu bí mật** khi được nhắc.
- Sau đó chọn một trong hai:
  - Biến môi trường
  - Trình cung cấp bí mật đã cấu hình (`file` hoặc `exec`)
- Thiết lập ban đầu thực hiện xác thực sơ bộ nhanh trước khi lưu tham chiếu.
  - Nếu xác thực thất bại, thiết lập ban đầu sẽ hiển thị lỗi và cho phép bạn thử lại.

### Lựa chọn endpoint Z.AI không tương tác

<Note>
`--auth-choice zai-api-key` tự động phát hiện endpoint Z.AI tốt nhất cho khóa của bạn (ưu tiên API chung với `zai/glm-5.1`). Nếu bạn đặc biệt muốn các endpoint GLM Coding Plan, hãy chọn `zai-coding-global` hoặc `zai-coding-cn`.
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

## Ghi chú về luồng

<AccordionGroup>
  <Accordion title="Loại luồng">
    - `quickstart`: lời nhắc tối thiểu, tự động tạo token Gateway.
    - `manual`: lời nhắc đầy đủ cho cổng, ràng buộc và xác thực (bí danh của `advanced`).
    - `import`: chạy một trình cung cấp di chuyển đã phát hiện, xem trước kế hoạch, rồi áp dụng sau khi xác nhận.

  </Accordion>
  <Accordion title="Lọc trước trình cung cấp">
    Khi một lựa chọn xác thực ngụ ý một trình cung cấp ưu tiên, thiết lập ban đầu sẽ lọc trước các bộ chọn mô hình mặc định và danh sách cho phép theo trình cung cấp đó. Đối với Volcengine và BytePlus, thao tác này cũng khớp với các biến thể coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Nếu bộ lọc trình cung cấp ưu tiên chưa cho ra mô hình đã tải nào, thiết lập ban đầu sẽ quay về catalog chưa lọc thay vì để bộ chọn trống.

  </Accordion>
  <Accordion title="Theo dõi tìm kiếm web">
    Một số trình cung cấp tìm kiếm web kích hoạt lời nhắc tiếp theo riêng cho trình cung cấp:

    - **Grok** có thể cung cấp thiết lập `x_search` tùy chọn với cùng `XAI_API_KEY` và một lựa chọn mô hình `x_search`.
    - **Kimi** có thể hỏi vùng API Moonshot (`api.moonshot.ai` so với `api.moonshot.cn`) và mô hình tìm kiếm web Kimi mặc định.

  </Accordion>
  <Accordion title="Hành vi khác">
    - Hành vi phạm vi DM của thiết lập ban đầu cục bộ: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals).
    - Cuộc trò chuyện đầu tiên nhanh nhất: `openclaw dashboard` (Control UI, không cần thiết lập kênh).
    - Trình cung cấp tùy chỉnh: kết nối bất kỳ endpoint tương thích OpenAI hoặc Anthropic nào, bao gồm các trình cung cấp được lưu trữ không được liệt kê. Dùng Unknown để tự động phát hiện.
    - Nếu phát hiện trạng thái Hermes, thiết lập ban đầu sẽ cung cấp một luồng di chuyển. Dùng [Di chuyển](/vi/cli/migrate) cho kế hoạch chạy thử, chế độ ghi đè, báo cáo và ánh xạ chính xác.

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
