---
read_when:
    - Bạn muốn thiết lập suy luận, sau đó hoàn tất quá trình thiết lập với Crestodian
summary: Tài liệu tham khảo CLI cho `openclaw onboard` (quy trình thiết lập ban đầu tương tác)
title: Thiết lập ban đầu
x-i18n:
    generated_at: "2026-07-12T07:49:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e9dad7efda492e0d9ef01ef08a1fd8c81272a0d9b3aa3b945917b6878159a06
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Quy trình thiết lập có hướng dẫn ưu tiên thiết lập khả năng suy luận trước: phát hiện quyền truy cập AI hiện có,
yêu cầu một lượt hoàn thành trực tiếp, chỉ lưu tuyến đang hoạt động, rồi khởi động
Crestodian để cấu hình phần còn lại. `openclaw setup` là cùng một điểm vào;
`openclaw setup --baseline` chỉ ghi cấu hình/không gian làm việc cơ sở.

<CardGroup cols={2}>
  <Card title="Trung tâm tiếp nhận CLI" href="/vi/start/wizard" icon="rocket">
    Hướng dẫn từng bước về luồng CLI tương tác.
  </Card>
  <Card title="Tổng quan về quy trình tiếp nhận" href="/vi/start/onboarding-overview" icon="map">
    Cách các phần trong quy trình tiếp nhận của OpenClaw phối hợp với nhau.
  </Card>
  <Card title="Tham chiếu thiết lập CLI" href="/vi/start/wizard-cli-reference" icon="book">
    Đầu ra, cơ chế nội bộ và hành vi ở từng bước.
  </Card>
  <Card title="Tự động hóa CLI" href="/vi/start/wizard-cli-automation" icon="terminal">
    Các cờ không tương tác và quy trình thiết lập bằng tập lệnh.
  </Card>
  <Card title="Tiếp nhận ứng dụng macOS" href="/vi/start/onboarding" icon="apple">
    Luồng tiếp nhận dành cho ứng dụng trên thanh menu macOS.
  </Card>
</CardGroup>

## Ví dụ

```bash
openclaw onboard
openclaw onboard --classic
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

- `--classic`: mở trình hướng dẫn đầy đủ theo từng bước. Không thể kết hợp cờ này với
  `--non-interactive`; hãy bỏ `--classic` khi thiết lập tự động.
- `--flow quickstart`: mở trình hướng dẫn cổ điển với số lời nhắc tối thiểu và
  tự động tạo mã thông báo Gateway.
- `--flow manual` (bí danh `advanced`): mở trình hướng dẫn cổ điển với đầy đủ lời nhắc
  về cổng, địa chỉ liên kết và xác thực.
- `--flow import`: chạy nhà cung cấp di chuyển được phát hiện (ví dụ Hermes thông qua `--import-from hermes`), xem trước kế hoạch, rồi áp dụng sau khi xác nhận. Chỉ chạy nhập trên một thiết lập OpenClaw mới - trước tiên hãy đặt lại cấu hình, thông tin xác thực, phiên và trạng thái không gian làm việc nếu có. Dùng [`openclaw migrate`](/vi/cli/migrate) để xem kế hoạch chạy thử, chế độ ghi đè, báo cáo và ánh xạ chính xác.
- `--modern` là bí danh tương thích cho trợ lý thiết lập hội thoại Crestodian.
  Cờ này sử dụng cùng cổng kiểm tra suy luận trực tiếp như `openclaw crestodian` và
  chỉ chấp nhận `--workspace`, `--accept-risk`,
  `--non-interactive` và `--json`. Các cờ thiết lập khác sẽ bị từ chối thay vì
  bị âm thầm bỏ qua.

## Luồng có hướng dẫn

Lệnh `openclaw onboard` không kèm tùy chọn sẽ khởi động luồng có hướng dẫn. Luồng này hiển thị thông báo bảo mật,
phát hiện quyền truy cập AI đã có thông qua các mô hình được cấu hình, các biến môi trường
khóa API và các CLI cục bộ được hỗ trợ, rồi kiểm thử ứng viên được đề xuất
bằng một lượt hoàn thành thực tế. Nếu ứng viên đó thất bại, quy trình tiếp nhận sẽ hiển thị
lý do và tự động thử ứng viên khả dụng tiếp theo.

Nếu quá trình phát hiện tự động không còn ứng viên, hãy chọn một ứng viên khác đã được phát hiện hoặc nhập
khóa API của nhà cung cấp trong lời nhắc được che nội dung. Khóa nhập thủ công được kiểm thử qua cùng
đường dẫn hoàn thành trực tiếp. Quy trình tiếp nhận có hướng dẫn
không cung cấp Crestodian hoặc lối thoát bỏ qua AI trước khi có ứng viên vượt qua kiểm thử. OpenClaw
chỉ lưu tuyến mô hình đã xác minh cùng thông tin xác thực của tuyến đó sau khi kiểm thử
thành công; ứng viên thất bại không thay thế mô hình đã cấu hình hoặc lưu
thông tin xác thực đã thử. Thiết lập không gian làm việc và Gateway không thay đổi cho đến khi
Crestodian khởi động.

Trong chế độ có hướng dẫn, `--workspace <dir>` cung cấp không gian làm việc đề xuất của Crestodian
và ngữ cảnh suy luận biệt lập. Giá trị này không được lưu cho đến khi bạn phê duyệt
đề xuất thiết lập của Crestodian. Quy trình tiếp nhận cổ điển và không tương tác lưu
không gian làm việc thông qua luồng thiết lập thông thường của chúng.

Sau khi kiểm tra suy luận thành công, quy trình tiếp nhận có hướng dẫn lập tức khởi động Crestodian bằng
mô hình đã xác minh. Sau đó, Crestodian có thể cấu hình không gian làm việc, Gateway,
các kênh, tác nhân, plugin và các tính năng tùy chọn khác. Trong Crestodian, hãy dùng
`open channel wizard for <channel>` để chuyển việc thu thập thông tin xác thực của kênh sang một
trình hướng dẫn đầu cuối có che nội dung. Để thay đổi nhà cung cấp mô hình hoặc phương thức xác thực của nhà cung cấp,
hãy thoát Crestodian và chạy `openclaw onboard`; Crestodian không mở các luồng nhà cung cấp
có hướng dẫn hoặc cổ điển.

Trên một bản cài đặt đã cấu hình, việc chạy lại `openclaw onboard` sẽ xác minh mô hình mặc định
hiện tại trước, vì vậy cùng một luồng đóng vai trò như một lượt xác minh và sửa chữa.
Nếu kiểm tra đó thất bại, mô hình đã cấu hình sẽ không bao giờ tự động bị thay thế —
quy trình tiếp nhận dừng lại và hỏi cách tiếp tục. Kiểm tra này chạy bên ngoài
không gian làm việc của bạn, vì vậy mô hình do plugin của không gian làm việc cung cấp có thể thất bại ở đây dù vẫn
hoạt động trong tác nhân.
Dùng `openclaw onboard --classic` để xác thực theo từng nhà cung cấp, thiết lập kênh, Skills,
Gateway từ xa, nhập dữ liệu hoặc toàn quyền điều khiển Gateway. Để thiết lập và sửa chữa
không liên quan đến suy luận theo dạng hội thoại, hãy chạy `openclaw crestodian`; `openclaw onboard
--modern` là bí danh tương thích đi qua cùng cổng kiểm tra suy luận. Trình hướng dẫn cổ điển
có thể tùy chọn xác minh mô hình mặc định bằng một lượt hoàn thành trực tiếp, nhưng
Crestodian sẽ không khởi động cho đến khi phép kiểm tra suy luận trực tiếp riêng của nó thành công.

Trong một đầu cuối tương tác, lệnh `openclaw` trần (không có lệnh con) định tuyến theo trạng thái
cấu hình:

- Nếu tệp cấu hình đang hoạt động bị thiếu hoặc không có thiết lập nào do người dùng tạo (trống hoặc
  chỉ có siêu dữ liệu), lệnh sẽ khởi động quy trình tiếp nhận có hướng dẫn.
- Nếu tệp cấu hình tồn tại nhưng không vượt qua xác thực, lệnh sẽ khởi động đường dẫn
  tiếp nhận cổ điển kèm hướng dẫn `openclaw doctor`. Crestodian cần khả năng
  suy luận hoạt động và không được dùng để sửa chữa trạng thái trước suy luận này.
- Nếu tệp cấu hình hợp lệ, lệnh sẽ mở TUI tác nhân thông thường. Một
  Gateway đã cấu hình và có thể truy cập, cùng tác nhân và mô hình, sẽ chuyển thẳng đến giao diện đó mà không cần
  quy trình tiếp nhận hoặc Crestodian. Trên một bản cài đặt đã cấu hình, hãy truy cập Crestodian bằng
  `/crestodian` trong TUI hoặc `openclaw crestodian`.

`ws://` dạng văn bản thuần được chấp nhận cho local loopback, địa chỉ IP riêng dạng số, `.local` và URL Gateway Tailnet `*.ts.net`. Đối với các tên DNS riêng đáng tin cậy khác, hãy đặt `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` trong môi trường tiến trình tiếp nhận.

## Đặt lại

```bash
openclaw onboard --reset
openclaw onboard --reset --reset-scope full
```

`--reset` xóa trạng thái trước khi chạy thiết lập. `--reset-scope` kiểm soát phạm vi xóa: `config` (chỉ cấu hình), `config+creds+sessions` (mặc định khi truyền `--reset` mà không có phạm vi), hoặc `full` (cũng đặt lại không gian làm việc). Việc đặt lại không gian làm việc chỉ diễn ra với `--reset-scope full`.

## Ngôn ngữ

Quy trình tiếp nhận tương tác sử dụng ngôn ngữ của trình hướng dẫn CLI cho nội dung thiết lập cố định. Thứ tự phân giải:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Dùng tiếng Anh làm phương án dự phòng

Các ngôn ngữ trình hướng dẫn được hỗ trợ là `en`, `zh-CN` và `zh-TW`. Giá trị ngôn ngữ có thể dùng dấu gạch dưới hoặc dạng hậu tố POSIX như `zh_CN.UTF-8`. Tên sản phẩm, tên lệnh, khóa cấu hình, URL, ID nhà cung cấp, ID mô hình và nhãn plugin/kênh được giữ nguyên.

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

## Thiết lập không tương tác

`--non-interactive` yêu cầu `--accept-risk` (xác nhận rằng các tác nhân rất mạnh và quyền truy cập toàn hệ thống tiềm ẩn rủi ro). `--mode` mặc định là `local`.

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

`--custom-api-key` là tùy chọn; nếu bỏ qua, quy trình tiếp nhận sẽ kiểm tra `CUSTOM_API_KEY` trong môi trường. OpenClaw tự động đánh dấu các ID mô hình thị giác phổ biến (GPT-4o/4.1/5.x, Claude 3/4, Gemini, Qwen-VL, LLaVA, Pixtral và các mô hình tương tự) là có khả năng xử lý hình ảnh. Truyền `--custom-image-input` cho các ID mô hình thị giác tùy chỉnh chưa được nhận diện, hoặc `--custom-text-input` để buộc siêu dữ liệu chỉ hỗ trợ văn bản. Dùng `--custom-compatibility openai-responses` cho các điểm cuối tương thích OpenAI có hỗ trợ `/v1/responses` nhưng không hỗ trợ `/v1/chat/completions`; các giá trị hợp lệ là `openai` (mặc định), `openai-responses`, `anthropic`.

LM Studio cũng có một cờ khóa riêng cho nhà cung cấp:

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

`--custom-base-url` mặc định là `http://127.0.0.1:11434`. `--custom-model-id` là tùy chọn; nếu bỏ qua, quy trình tiếp nhận sẽ dùng các giá trị mặc định do Ollama đề xuất. Các ID mô hình đám mây như `kimi-k2.5:cloud` cũng hoạt động tại đây.

Lưu khóa nhà cung cấp dưới dạng tham chiếu thay vì văn bản thuần:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

Với `--secret-input-mode ref`, quy trình tiếp nhận ghi các tham chiếu dựa trên môi trường thay vì giá trị khóa dạng văn bản thuần: đối với các nhà cung cấp dựa trên hồ sơ xác thực, thao tác này ghi `keyRef: { source: "env", provider: "default", id: <envVar> }`; đối với nhà cung cấp tùy chỉnh, thao tác này ghi `models.providers.<id>.apiKey` theo cùng cách (ví dụ `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`). Quy ước: đặt biến môi trường của nhà cung cấp trong môi trường tiến trình tiếp nhận (ví dụ `OPENAI_API_KEY`) và không đồng thời truyền cờ khóa nội tuyến trừ khi biến môi trường đó đã được đặt - giá trị cờ không có biến môi trường tương ứng sẽ thất bại ngay kèm hướng dẫn.

### Xác thực Gateway (không tương tác)

- `--gateway-auth token --gateway-token <token>` lưu mã thông báo dạng văn bản thuần. `token` là chế độ xác thực mặc định.
- `--gateway-auth token --gateway-token-ref-env <name>` lưu `gateway.auth.token` dưới dạng SecretRef môi trường. Yêu cầu biến môi trường có tên đó không được để trống trong môi trường tiến trình tiếp nhận.
- `--gateway-token` và `--gateway-token-ref-env` loại trừ lẫn nhau.
- Với `--install-daemon`: `gateway.auth.token` do SecretRef quản lý được xác thực nhưng không được lưu dưới dạng văn bản thuần đã phân giải trong siêu dữ liệu môi trường dịch vụ giám sát; nếu tham chiếu chưa được phân giải, quá trình cài đặt sẽ đóng an toàn và cung cấp hướng dẫn khắc phục. Nếu cả `gateway.auth.token` và `gateway.auth.password` đều được cấu hình nhưng `gateway.auth.mode` chưa được đặt, quá trình cài đặt sẽ bị chặn cho đến khi chế độ được đặt rõ ràng.
- Quy trình tiếp nhận cục bộ ghi `gateway.mode="local"` vào cấu hình. Nếu một tệp cấu hình sau đó thiếu `gateway.mode`, điều đó cho thấy cấu hình bị hỏng hoặc thao tác chỉnh sửa thủ công chưa hoàn tất, không phải lối tắt hợp lệ cho chế độ cục bộ.
- Quy trình tiếp nhận cục bộ cài đặt các plugin có thể tải xuống mà đường dẫn thiết lập đã chọn yêu cầu (ví dụ plugin môi trường chạy Codex hoặc Copilot cho các lựa chọn xác thực tương ứng). Quy trình tiếp nhận từ xa chỉ ghi thông tin kết nối cho Gateway từ xa - quy trình này không bao giờ cài đặt các gói plugin cục bộ.
- `--allow-unconfigured` là một lối thoát riêng của `openclaw gateway run`; cờ này không cho phép quy trình tiếp nhận bỏ qua `gateway.mode`.

```bash
export OPENAI_API_KEY="your-provider-key"
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

### Tình trạng Gateway cục bộ

- Trừ khi bạn truyền `--skip-health`, quy trình tiếp nhận sẽ chờ đến khi Gateway cục bộ có thể truy cập trước khi thoát thành công.
- `--install-daemon` khởi động đường dẫn cài đặt Gateway được quản lý trước. Nếu không dùng cờ này, một Gateway cục bộ phải đang chạy sẵn (ví dụ `openclaw gateway run`).
- `--skip-health` bỏ qua việc chờ nếu trong quy trình tự động hóa bạn chỉ muốn ghi cấu hình/không gian làm việc/tệp khởi tạo.
- `--skip-bootstrap` đặt `agents.defaults.skipBootstrap: true` và bỏ qua việc tạo `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` và `BOOTSTRAP.md`.
- Trên Windows nguyên bản, `--install-daemon` thử Scheduled Tasks trước và chuyển sang một mục đăng nhập trong thư mục Startup theo từng người dùng nếu việc tạo tác vụ bị từ chối.

### Chế độ tham chiếu tương tác

- Chọn **Sử dụng tham chiếu bí mật** khi được nhắc, sau đó chọn **Biến môi trường** hoặc một nhà cung cấp bí mật đã cấu hình (`file` hoặc `exec`).
- Quy trình tiếp nhận chạy một bước xác thực sơ bộ nhanh trước khi lưu tham chiếu và cho phép bạn thử lại khi thất bại.

### Các lựa chọn điểm cuối Z.AI

<Note>
`--auth-choice zai-api-key` tự động phát hiện điểm cuối và mô hình Z.AI phù hợp nhất cho khóa của bạn: các điểm cuối Coding Plan ưu tiên `zai/glm-5.2` (dự phòng sang `glm-5.1` nếu không khả dụng); các điểm cuối API thông thường mặc định dùng `zai/glm-5.1`. Để buộc sử dụng một điểm cuối Coding Plan, hãy chọn trực tiếp `zai-coding-global` hoặc `zai-coding-cn`.
</Note>

```bash
# Chọn điểm cuối không cần lời nhắc
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Các lựa chọn điểm cuối Z.AI khác: zai-coding-cn, zai-global, zai-cn
```

Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Các cờ không tương tác bổ sung

Xác thực mô hình dựa trên token (dùng với `--auth-choice token`):

| Cờ                              | Mô tả                                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `--token-provider <id>`         | ID của nhà cung cấp token phát hành token                                                                                                 |
| `--token <token>`               | Giá trị token để xác thực mô hình                                                                                                         |
| `--token-profile-id <id>`       | ID hồ sơ xác thực (mặc định là `<provider>:manual`; một số luồng do nhà cung cấp sở hữu dùng giá trị mặc định riêng, như `anthropic:default`) |
| `--token-expires-in <duration>` | Thời hạn hết hiệu lực tùy chọn của token (ví dụ: `365d`, `12h`)                                                                           |

Cloudflare AI Gateway: `--cloudflare-ai-gateway-account-id <id>`, `--cloudflare-ai-gateway-gateway-id <id>`.

Kiểm soát cài đặt daemon: `--no-install-daemon` / `--skip-daemon` (các bí danh; bỏ qua cài đặt dịch vụ Gateway), `--daemon-runtime <node|bun>`.

Skills: `--node-manager <npm|pnpm|bun>` (mặc định là `npm`), `--skip-skills`.

Thiết lập giao diện người dùng và hook: `--skip-ui` (bỏ qua các lời nhắc của giao diện điều khiển/TUI), `--skip-hooks` (bỏ qua thiết lập webhook/hook), `--skip-channels`, `--skip-search`.

Đầu ra: `--suppress-gateway-token-output` ẩn đầu ra Gateway/giao diện người dùng có chứa token (gợi ý token, URL tự động đăng nhập có nhúng token và tự động khởi chạy giao diện điều khiển) - hữu ích trong các terminal dùng chung và CI.

<Note>
`--json` không mặc nhiên bật chế độ không tương tác trong quy trình hướng dẫn hoặc tiếp nhận cổ điển.
Với `--modern`, JSON là phần tổng quan Crestodian dùng một lần và sẽ thoát sau
kết quả duy nhất đó. Hãy dùng `--non-interactive` cho các tập lệnh khác.
</Note>

## Lọc trước nhà cung cấp

Khi một lựa chọn xác thực ngụ ý nhà cung cấp ưu tiên, quy trình tiếp nhận sẽ lọc trước các bộ chọn mô hình mặc định và danh sách cho phép để chỉ hiển thị các mô hình của nhà cung cấp đó. Bộ lọc cũng khớp với các nhà cung cấp khác do cùng một plugin sở hữu, bao gồm các biến thể gói lập trình như `volcengine`/`volcengine-plan` và `byteplus`/`byteplus-plan`. Nếu bộ lọc nhà cung cấp ưu tiên không trả về mô hình nào đã tải, quy trình tiếp nhận sẽ quay lại danh mục chưa lọc thay vì để bộ chọn trống.

## Các bước tiếp theo cho tìm kiếm web

Một số nhà cung cấp tìm kiếm web kích hoạt các lời nhắc tiếp theo dành riêng cho nhà cung cấp trong quá trình tiếp nhận:

- **Grok** có thể cung cấp tùy chọn thiết lập `x_search` với cùng thông tin xác thực xAI và lựa chọn mô hình `x_search`.
- **Kimi** có thể yêu cầu vùng API Moonshot (`api.moonshot.ai` hoặc `api.moonshot.cn`) và mô hình tìm kiếm web Kimi mặc định.

## Các hành vi khác

- Hành vi phạm vi DM khi tiếp nhận cục bộ: [Tài liệu tham khảo về thiết lập CLI](/vi/start/wizard-cli-reference#outputs-and-internals).
- Cách nhanh nhất để bắt đầu cuộc trò chuyện đầu tiên: `openclaw dashboard` (giao diện điều khiển, không thiết lập kênh).
- Nhà cung cấp tùy chỉnh: kết nối bất kỳ điểm cuối nào tương thích với OpenAI hoặc Anthropic, bao gồm cả các nhà cung cấp dịch vụ lưu trữ không có trong danh sách. Dùng khả năng tương thích **Không xác định** để tự động phát hiện thông qua một lần thăm dò trực tiếp.
- Nếu phát hiện trạng thái Hermes, quy trình tiếp nhận sẽ cung cấp luồng di chuyển (xem `--flow import` ở trên).

## Các lệnh thường dùng tiếp theo

Sau này, hãy dùng `openclaw configure` cho các thay đổi có mục tiêu không liên quan đến suy luận và `openclaw
channels add` để chỉ thiết lập kênh. Đối với các thay đổi về nhà cung cấp mô hình hoặc tuyến xác thực,
hãy chạy `openclaw onboard`.

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```
