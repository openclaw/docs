---
read_when:
    - Bạn muốn thiết lập có hướng dẫn cho Gateway, không gian làm việc, xác thực, kênh và Skills
summary: Tham chiếu CLI cho `openclaw onboard` (thiết lập ban đầu tương tác)
title: Thiết lập ban đầu
x-i18n:
    generated_at: "2026-06-30T22:21:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Quy trình hướng dẫn thiết lập ban đầu đầy đủ cho thiết lập Gateway cục bộ hoặc từ xa. Dùng lệnh này khi bạn muốn OpenClaw hướng dẫn qua xác thực mô hình, workspace, gateway, kênh, skills và tình trạng sức khỏe trong một luồng duy nhất.

## Hướng dẫn liên quan

<CardGroup cols={2}>
  <Card title="Trung tâm thiết lập ban đầu CLI" href="/vi/start/wizard" icon="rocket">
    Hướng dẫn từng bước về luồng CLI tương tác.
  </Card>
  <Card title="Tổng quan thiết lập ban đầu" href="/vi/start/onboarding-overview" icon="map">
    Cách các phần thiết lập ban đầu của OpenClaw khớp với nhau.
  </Card>
  <Card title="Tham chiếu thiết lập CLI" href="/vi/start/wizard-cli-reference" icon="book">
    Đầu ra, nội bộ và hành vi theo từng bước.
  </Card>
  <Card title="Tự động hóa CLI" href="/vi/start/wizard-cli-automation" icon="terminal">
    Các cờ không tương tác và thiết lập bằng script.
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

`--flow import` dùng các nhà cung cấp di chuyển do plugin sở hữu, chẳng hạn như Hermes. Lệnh này chỉ chạy trên một thiết lập OpenClaw mới; nếu đã có cấu hình, thông tin xác thực, phiên hoặc các tệp bộ nhớ/danh tính workspace, hãy đặt lại hoặc chọn một thiết lập mới trước khi nhập.

`--modern` khởi động bản xem trước thiết lập ban đầu hội thoại Crestodian. Không có
`--modern`, `openclaw onboard` giữ luồng thiết lập ban đầu cổ điển.

Trên bản cài đặt mới khi tệp cấu hình đang hoạt động bị thiếu hoặc không có
thiết lập do người dùng viết (trống hoặc chỉ có siêu dữ liệu), `openclaw` trần cũng khởi động luồng
thiết lập ban đầu cổ điển. Khi tệp cấu hình đã có thiết lập do người dùng viết, `openclaw` trần
sẽ mở Crestodian thay vào đó.

`ws://` dạng văn bản thuần được chấp nhận cho local loopback, literal IP riêng, `.local` và
URL gateway Tailnet `*.ts.net`. Với các tên DNS riêng đáng tin cậy khác, hãy đặt
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trong môi trường tiến trình thiết lập ban đầu.

## Ngôn ngữ

Thiết lập ban đầu tương tác dùng ngôn ngữ của trình hướng dẫn CLI cho phần nội dung thiết lập cố định. Thứ tự
phân giải là:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Dự phòng tiếng Anh

Các ngôn ngữ trình hướng dẫn được hỗ trợ là `en`, `zh-CN` và `zh-TW`. Giá trị ngôn ngữ có thể dùng
dấu gạch dưới hoặc dạng hậu tố POSIX như `zh_CN.UTF-8`. Tên sản phẩm, tên lệnh,
khóa cấu hình, URL, ID nhà cung cấp, ID mô hình và nhãn plugin/kênh
giữ nguyên dạng literal.

Ví dụ:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

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
OpenClaw tự động đánh dấu các ID mô hình thị giác phổ biến là hỗ trợ hình ảnh. Truyền `--custom-image-input` cho các ID thị giác tùy chỉnh chưa biết, hoặc `--custom-text-input` để buộc siêu dữ liệu chỉ văn bản.
Dùng `--custom-compatibility openai-responses` cho các endpoint tương thích OpenAI hỗ trợ `/v1/responses` nhưng không hỗ trợ `/v1/chat/completions`.

LM Studio cũng hỗ trợ một cờ khóa theo nhà cung cấp trong chế độ không tương tác:

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

`--custom-base-url` mặc định là `http://127.0.0.1:11434`. `--custom-model-id` là tùy chọn; nếu bỏ qua, thiết lập ban đầu dùng các mặc định được Ollama đề xuất. Các ID mô hình cloud như `kimi-k2.5:cloud` cũng hoạt động ở đây.

Lưu khóa nhà cung cấp dưới dạng tham chiếu thay vì văn bản thuần:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Với `--secret-input-mode ref`, thiết lập ban đầu ghi các tham chiếu dựa trên env thay vì giá trị khóa văn bản thuần.
Với các nhà cung cấp dựa trên hồ sơ xác thực, lệnh này ghi mục `keyRef`; với nhà cung cấp tùy chỉnh, lệnh này ghi `models.providers.<id>.apiKey` dưới dạng tham chiếu env (ví dụ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Hợp đồng chế độ `ref` không tương tác:

- Đặt biến env của nhà cung cấp trong môi trường tiến trình thiết lập ban đầu (ví dụ `OPENAI_API_KEY`).
- Không truyền cờ khóa inline (ví dụ `--openai-api-key`) trừ khi biến env đó cũng được đặt.
- Nếu cờ khóa inline được truyền mà không có biến env bắt buộc, thiết lập ban đầu sẽ thất bại nhanh kèm hướng dẫn.

Tùy chọn token Gateway trong chế độ không tương tác:

- `--gateway-auth token --gateway-token <token>` lưu token văn bản thuần.
- `--gateway-auth token --gateway-token-ref-env <name>` lưu `gateway.auth.token` dưới dạng SecretRef env.
- `--gateway-token` và `--gateway-token-ref-env` loại trừ lẫn nhau.
- `--gateway-token-ref-env` yêu cầu một biến env không rỗng trong môi trường tiến trình thiết lập ban đầu.
- Với `--install-daemon`, khi xác thực token yêu cầu token, token gateway do SecretRef quản lý được xác thực nhưng không được lưu bền vững dưới dạng văn bản thuần đã phân giải trong siêu dữ liệu môi trường dịch vụ supervisor.
- Với `--install-daemon`, nếu chế độ token yêu cầu token và SecretRef token đã cấu hình chưa phân giải được, thiết lập ban đầu thất bại đóng kèm hướng dẫn khắc phục.
- Với `--install-daemon`, nếu cả `gateway.auth.token` và `gateway.auth.password` được cấu hình và `gateway.auth.mode` chưa đặt, thiết lập ban đầu chặn cài đặt cho đến khi chế độ được đặt rõ ràng.
- Thiết lập ban đầu cục bộ ghi `gateway.mode="local"` vào cấu hình. Nếu một tệp cấu hình sau này thiếu `gateway.mode`, hãy xem đó là cấu hình bị hỏng hoặc một chỉnh sửa thủ công chưa hoàn tất, không phải một lối tắt chế độ cục bộ hợp lệ.
- Thiết lập ban đầu cục bộ cài đặt các plugin có thể tải xuống đã chọn khi đường dẫn thiết lập được chọn yêu cầu chúng.
- Thiết lập ban đầu từ xa chỉ ghi thông tin kết nối cho Gateway từ xa và không cài đặt gói plugin cục bộ.
- `--allow-unconfigured` là một cửa thoát runtime gateway riêng. Nó không có nghĩa là thiết lập ban đầu có thể bỏ qua `gateway.mode`.

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

Tình trạng gateway cục bộ không tương tác:

- Trừ khi bạn truyền `--skip-health`, thiết lập ban đầu chờ gateway cục bộ có thể truy cập được trước khi thoát thành công.
- `--install-daemon` khởi động đường dẫn cài đặt gateway được quản lý trước. Nếu không dùng cờ này, bạn phải đã có gateway cục bộ đang chạy, ví dụ `openclaw gateway run`.
- Nếu bạn chỉ muốn ghi cấu hình/workspace/bootstrap trong tự động hóa, dùng `--skip-health`.
- Nếu bạn tự quản lý các tệp workspace, truyền `--skip-bootstrap` để đặt `agents.defaults.skipBootstrap: true` và bỏ qua việc tạo `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` và `BOOTSTRAP.md`.
- Trên Windows native, `--install-daemon` thử Scheduled Tasks trước và dự phòng sang một mục đăng nhập thư mục Startup theo người dùng nếu việc tạo tác vụ bị từ chối.

Hành vi thiết lập ban đầu tương tác với chế độ tham chiếu:

- Chọn **Dùng tham chiếu bí mật** khi được nhắc.
- Sau đó chọn một trong hai:
  - Biến môi trường
  - Nhà cung cấp bí mật đã cấu hình (`file` hoặc `exec`)
- Thiết lập ban đầu thực hiện xác thực preflight nhanh trước khi lưu tham chiếu.
  - Nếu xác thực thất bại, thiết lập ban đầu hiển thị lỗi và cho phép bạn thử lại.

### Lựa chọn endpoint Z.AI không tương tác

<Note>
`--auth-choice zai-api-key` tự động phát hiện endpoint và mô hình Z.AI phù hợp nhất cho
khóa của bạn. Endpoint Coding Plan ưu tiên `zai/glm-5.2`; endpoint API chung dùng
`zai/glm-5.1`. Để buộc dùng endpoint Coding Plan, chọn `zai-coding-global` hoặc
`zai-coding-cn`.
</Note>

```bash
# Chọn endpoint không cần lời nhắc
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Các lựa chọn endpoint Z.AI khác:
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
    - `quickstart`: lời nhắc tối thiểu, tự động tạo token gateway.
    - `manual`: lời nhắc đầy đủ cho cổng, bind và xác thực (bí danh của `advanced`).
    - `import`: chạy nhà cung cấp di chuyển đã phát hiện, xem trước kế hoạch, rồi áp dụng sau khi xác nhận.

  </Accordion>
  <Accordion title="Lọc trước nhà cung cấp">
    Khi một lựa chọn xác thực ngụ ý nhà cung cấp ưu tiên, thiết lập ban đầu lọc trước bộ chọn mô hình mặc định và allowlist theo nhà cung cấp đó. Với Volcengine và BytePlus, điều này cũng khớp các biến thể coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Nếu bộ lọc nhà cung cấp ưu tiên chưa trả về mô hình nào đã tải, thiết lập ban đầu quay về catalog không lọc thay vì để bộ chọn trống.

  </Accordion>
  <Accordion title="Theo dõi web-search">
    Một số nhà cung cấp web-search kích hoạt lời nhắc theo dõi riêng theo nhà cung cấp:

    - **Grok** có thể cung cấp thiết lập `x_search` tùy chọn với cùng hồ sơ OAuth xAI hoặc khóa API và một lựa chọn mô hình `x_search`.
    - **Kimi** có thể hỏi vùng API Moonshot (`api.moonshot.ai` so với `api.moonshot.cn`) và mô hình web-search Kimi mặc định.

  </Accordion>
  <Accordion title="Hành vi khác">
    - Hành vi phạm vi DM của thiết lập ban đầu cục bộ: [Tham chiếu thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals).
    - Cuộc trò chuyện đầu tiên nhanh nhất: `openclaw dashboard` (Control UI, không cần thiết lập kênh).
    - Nhà cung cấp tùy chỉnh: kết nối bất kỳ endpoint tương thích OpenAI hoặc Anthropic nào, bao gồm các nhà cung cấp hosted không được liệt kê. Dùng Unknown để tự động phát hiện.
    - Nếu phát hiện trạng thái Hermes, thiết lập ban đầu cung cấp một luồng di chuyển. Dùng [Di chuyển](/vi/cli/migrate) cho kế hoạch chạy thử, chế độ ghi đè, báo cáo và ánh xạ chính xác.

  </Accordion>
</AccordionGroup>

## Lệnh theo dõi thường dùng

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Dùng `openclaw setup` làm cùng điểm vào thiết lập ban đầu có hướng dẫn. Dùng `openclaw setup --baseline` khi bạn chỉ cần cấu hình/workspace cơ sở, `openclaw configure` sau đó cho các thay đổi có mục tiêu, và `openclaw channels add` cho thiết lập chỉ kênh.

<Note>
`--json` không ngụ ý chế độ không tương tác. Dùng `--non-interactive` cho script.
</Note>
