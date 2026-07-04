---
read_when:
    - Bạn muốn thiết lập có hướng dẫn cho gateway, không gian làm việc, xác thực, kênh và skills
summary: Tài liệu tham khảo CLI cho `openclaw onboard` (thiết lập ban đầu tương tác)
title: Thiết lập ban đầu
x-i18n:
    generated_at: "2026-07-04T20:35:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Quy trình onboarding có hướng dẫn đầy đủ để thiết lập Gateway cục bộ hoặc từ xa. Dùng lệnh này khi bạn muốn OpenClaw hướng dẫn xuyên suốt trong một luồng về xác thực mô hình, workspace, gateway, kênh, Skills và sức khỏe hệ thống.

## Hướng dẫn liên quan

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/vi/start/wizard" icon="rocket">
    Hướng dẫn từng bước cho luồng CLI tương tác.
  </Card>
  <Card title="Onboarding overview" href="/vi/start/onboarding-overview" icon="map">
    Cách các phần onboarding của OpenClaw khớp với nhau.
  </Card>
  <Card title="CLI setup reference" href="/vi/start/wizard-cli-reference" icon="book">
    Đầu ra, nội bộ và hành vi theo từng bước.
  </Card>
  <Card title="CLI automation" href="/vi/start/wizard-cli-automation" icon="terminal">
    Cờ không tương tác và thiết lập bằng script.
  </Card>
  <Card title="macOS app onboarding" href="/vi/start/onboarding" icon="apple">
    Luồng onboarding cho ứng dụng thanh menu macOS.
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

`--flow import` dùng các nhà cung cấp di trú do plugin sở hữu, chẳng hạn như Hermes. Lệnh này chỉ chạy trên một thiết lập OpenClaw mới; nếu đã có cấu hình, thông tin xác thực, phiên hoặc tệp bộ nhớ/định danh workspace, hãy đặt lại hoặc chọn một thiết lập mới trước khi nhập.

`--modern` khởi động bản xem trước onboarding hội thoại Crestodian. Nếu không có
`--modern`, `openclaw onboard` giữ luồng onboarding cổ điển.

Trong terminal tương tác, `openclaw` trần (không có lệnh con) định tuyến theo
trạng thái cấu hình:

- Nếu tệp cấu hình đang hoạt động bị thiếu hoặc không có thiết lập do người dùng viết (trống hoặc
  chỉ có metadata), nó khởi động luồng onboarding cổ điển này.
- Nếu tệp cấu hình tồn tại nhưng không vượt qua xác thực, nó khởi động
  [Crestodian](/vi/cli/crestodian) để sửa chữa.
- Nếu tệp cấu hình hợp lệ, nó mở agent TUI bình thường, chạy cục bộ
  hoặc kết nối tới một Gateway đã cấu hình có thể truy cập. Trên một bản cài đặt đã cấu hình,
  truy cập Crestodian bằng `/crestodian` bên trong TUI hoặc `openclaw crestodian`.

`ws://` dạng văn bản thuần được chấp nhận cho loopback, literal IP riêng tư, `.local` và
URL gateway Tailnet `*.ts.net`. Với các tên private-DNS đáng tin cậy khác, hãy đặt
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trong môi trường tiến trình onboarding.

## Ngôn ngữ

Onboarding tương tác dùng ngôn ngữ của trình hướng dẫn CLI cho phần nội dung thiết lập cố định. Thứ tự
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

`--custom-api-key` là tùy chọn trong chế độ không tương tác. Nếu bỏ qua, onboarding kiểm tra `CUSTOM_API_KEY`.
OpenClaw tự động đánh dấu các ID mô hình thị giác phổ biến là có khả năng xử lý hình ảnh. Truyền `--custom-image-input` cho các ID thị giác tùy chỉnh chưa biết, hoặc `--custom-text-input` để buộc metadata chỉ văn bản.
Dùng `--custom-compatibility openai-responses` cho các endpoint tương thích OpenAI hỗ trợ `/v1/responses` nhưng không hỗ trợ `/v1/chat/completions`.

LM Studio cũng hỗ trợ cờ khóa riêng theo nhà cung cấp trong chế độ không tương tác:

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

`--custom-base-url` mặc định là `http://127.0.0.1:11434`. `--custom-model-id` là tùy chọn; nếu bỏ qua, onboarding dùng các mặc định được Ollama đề xuất. Các ID mô hình đám mây như `kimi-k2.5:cloud` cũng hoạt động ở đây.

Lưu khóa nhà cung cấp dưới dạng ref thay vì văn bản thuần:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Với `--secret-input-mode ref`, onboarding ghi các ref dựa trên env thay vì giá trị khóa dạng văn bản thuần.
Đối với các nhà cung cấp dựa trên auth-profile, thao tác này ghi mục `keyRef`; đối với nhà cung cấp tùy chỉnh, thao tác này ghi `models.providers.<id>.apiKey` dưới dạng env ref (ví dụ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Hợp đồng chế độ `ref` không tương tác:

- Đặt biến môi trường của nhà cung cấp trong môi trường tiến trình onboarding (ví dụ `OPENAI_API_KEY`).
- Không truyền cờ khóa inline (ví dụ `--openai-api-key`) trừ khi biến môi trường đó cũng được đặt.
- Nếu cờ khóa inline được truyền mà không có biến môi trường bắt buộc, onboarding thất bại nhanh kèm hướng dẫn.

Tùy chọn token Gateway trong chế độ không tương tác:

- `--gateway-auth token --gateway-token <token>` lưu token dạng văn bản thuần.
- `--gateway-auth token --gateway-token-ref-env <name>` lưu `gateway.auth.token` dưới dạng env SecretRef.
- `--gateway-token` và `--gateway-token-ref-env` loại trừ lẫn nhau.
- `--gateway-token-ref-env` yêu cầu một biến môi trường không rỗng trong môi trường tiến trình onboarding.
- Với `--install-daemon`, khi xác thực token yêu cầu token, các token gateway do SecretRef quản lý được xác thực nhưng không được lưu bền dưới dạng văn bản thuần đã phân giải trong metadata môi trường dịch vụ supervisor.
- Với `--install-daemon`, nếu chế độ token yêu cầu token và SecretRef token đã cấu hình chưa phân giải được, onboarding thất bại đóng kèm hướng dẫn khắc phục.
- Với `--install-daemon`, nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình và `gateway.auth.mode` chưa được đặt, onboarding chặn cài đặt cho tới khi chế độ được đặt rõ ràng.
- Onboarding cục bộ ghi `gateway.mode="local"` vào cấu hình. Nếu một tệp cấu hình sau đó thiếu `gateway.mode`, hãy xem đó là cấu hình bị hỏng hoặc chỉnh sửa thủ công chưa hoàn tất, không phải một lối tắt local-mode hợp lệ.
- Onboarding cục bộ cài đặt các plugin có thể tải xuống đã chọn khi đường dẫn thiết lập đã chọn yêu cầu chúng.
- Onboarding từ xa chỉ ghi thông tin kết nối cho Gateway từ xa và không cài đặt các gói plugin cục bộ.
- `--allow-unconfigured` là một lối thoát runtime gateway riêng. Nó không có nghĩa là onboarding có thể bỏ qua `gateway.mode`.

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

Sức khỏe gateway cục bộ không tương tác:

- Trừ khi bạn truyền `--skip-health`, onboarding chờ một gateway cục bộ có thể truy cập trước khi thoát thành công.
- `--install-daemon` khởi động đường dẫn cài đặt gateway được quản lý trước. Nếu không có cờ này, bạn phải đã có sẵn một gateway cục bộ đang chạy, ví dụ `openclaw gateway run`.
- Nếu bạn chỉ muốn ghi cấu hình/workspace/bootstrap trong tự động hóa, hãy dùng `--skip-health`.
- Nếu bạn tự quản lý các tệp workspace, hãy truyền `--skip-bootstrap` để đặt `agents.defaults.skipBootstrap: true` và bỏ qua việc tạo `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` và `BOOTSTRAP.md`.
- Trên Windows native, `--install-daemon` thử Scheduled Tasks trước và dự phòng sang một mục đăng nhập trong thư mục Startup theo người dùng nếu việc tạo tác vụ bị từ chối.

Hành vi onboarding tương tác với chế độ tham chiếu:

- Chọn **Use secret reference** khi được nhắc.
- Sau đó chọn một trong hai:
  - Biến môi trường
  - Nhà cung cấp bí mật đã cấu hình (`file` hoặc `exec`)
- Onboarding thực hiện xác thực preflight nhanh trước khi lưu ref.
  - Nếu xác thực thất bại, onboarding hiển thị lỗi và cho phép bạn thử lại.

### Lựa chọn endpoint Z.AI không tương tác

<Note>
`--auth-choice zai-api-key` tự động phát hiện endpoint và mô hình Z.AI tốt nhất cho
khóa của bạn. Endpoint Coding Plan ưu tiên `zai/glm-5.2`; endpoint API chung dùng
`zai/glm-5.1`. Để buộc dùng endpoint Coding Plan, chọn `zai-coding-global` hoặc
`zai-coding-cn`.
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

## Cờ không tương tác bổ sung

Xác thực mô hình dựa trên token (không tương tác; dùng với `--auth-choice token`):

- `--token-provider <id>` — ID nhà cung cấp token. Xác định nhà cung cấp nào phát hành token.
- `--token <token>` — Giá trị token cho xác thực mô hình.
- `--token-profile-id <id>` — ID auth profile. Lưu trữ token chung mặc định là `<provider>:manual`; các luồng thiết lập do nhà cung cấp sở hữu có thể dùng mặc định riêng, chẳng hạn như `anthropic:default`.
- `--token-expires-in <duration>` — Thời lượng hết hạn token tùy chọn (ví dụ `365d`, `12h`).

Cloudflare AI Gateway (không tương tác):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare Account ID để định tuyến qua Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID.

Kiểm soát cài đặt daemon:

- `--no-install-daemon` — Bỏ qua rõ ràng việc cài đặt dịch vụ gateway.
- `--skip-daemon` — Bí danh cho `--no-install-daemon`.

Kiểm soát thiết lập UI và hook:

- `--skip-ui` — Bỏ qua lời nhắc Control UI / TUI trong onboarding.
- `--skip-hooks` — Bỏ qua lời nhắc thiết lập webhook / hook trong onboarding.

Ẩn đầu ra:

- `--suppress-gateway-token-output` — Ẩn đầu ra Gateway/UI chứa token (gợi ý token, URL tự động đăng nhập có token nhúng, và tự động khởi chạy Control UI). Hữu ích trong môi trường terminal dùng chung và CI.

## Ghi chú về luồng

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: lời nhắc tối thiểu, tự động tạo token gateway.
    - `manual`: lời nhắc đầy đủ cho cổng, bind và xác thực (bí danh của `advanced`).
    - `import`: chạy một nhà cung cấp di trú đã phát hiện, xem trước kế hoạch, rồi áp dụng sau khi xác nhận.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Khi một lựa chọn xác thực ngụ ý nhà cung cấp ưu tiên, onboarding lọc trước các bộ chọn mô hình mặc định và allowlist theo nhà cung cấp đó. Với Volcengine và BytePlus, thao tác này cũng khớp các biến thể coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Nếu bộ lọc nhà cung cấp ưu tiên chưa trả về mô hình đã tải nào, onboarding dự phòng sang catalog chưa lọc thay vì để bộ chọn trống.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Một số nhà cung cấp tìm kiếm web kích hoạt lời nhắc tiếp theo riêng theo nhà cung cấp:

    - **Grok** có thể đề xuất thiết lập `x_search` tùy chọn với cùng hồ sơ OAuth xAI hoặc khóa API và một lựa chọn mô hình `x_search`.
    - **Kimi** có thể hỏi vùng API Moonshot (`api.moonshot.ai` so với `api.moonshot.cn`) và mô hình tìm kiếm web Kimi mặc định.

  </Accordion>
  <Accordion title="Other behaviors">
    - Hành vi phạm vi DM của onboarding cục bộ: [CLI setup reference](/vi/start/wizard-cli-reference#outputs-and-internals).
    - Cuộc trò chuyện đầu tiên nhanh nhất: `openclaw dashboard` (Control UI, không thiết lập kênh).
    - Nhà cung cấp tùy chỉnh: kết nối bất kỳ endpoint tương thích OpenAI hoặc Anthropic nào, bao gồm các nhà cung cấp được lưu trữ không có trong danh sách. Dùng Unknown để tự động phát hiện.
    - Nếu phát hiện trạng thái Hermes, onboarding đề xuất một luồng di trú. Dùng [Migrate](/vi/cli/migrate) cho kế hoạch dry-run, chế độ ghi đè, báo cáo và ánh xạ chính xác.

  </Accordion>
</AccordionGroup>

## Lệnh theo dõi thường dùng

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Dùng `openclaw setup` làm cùng điểm vào hướng dẫn thiết lập ban đầu. Dùng `openclaw setup --baseline` khi bạn chỉ cần cấu hình/không gian làm việc cơ sở, dùng `openclaw configure` sau đó cho các thay đổi có mục tiêu, và dùng `openclaw channels add` để thiết lập riêng kênh.

<Note>
`--json` không ngụ ý chế độ không tương tác. Dùng `--non-interactive` cho các tập lệnh.
</Note>
