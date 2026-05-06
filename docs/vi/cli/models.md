---
read_when:
    - Bạn muốn thay đổi mô hình mặc định hoặc xem trạng thái xác thực của nhà cung cấp
    - Bạn muốn quét các mô hình/nhà cung cấp hiện có và gỡ lỗi các hồ sơ xác thực
summary: Tham chiếu CLI cho `openclaw models` (status/list/set/scan, bí danh, phương án dự phòng, xác thực)
title: Mô hình
x-i18n:
    generated_at: "2026-05-06T09:05:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7a1cce7b1b21411540238b1858580a56b2271d54d0898e261b69bd21f88c0f5
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Khám phá, quét và cấu hình mô hình (mô hình mặc định, dự phòng, hồ sơ xác thực).

Liên quan:

- Nhà cung cấp + mô hình: [Mô hình](/vi/providers/models)
- Khái niệm chọn mô hình + lệnh slash `/models`: [Khái niệm mô hình](/vi/concepts/models)
- Thiết lập xác thực nhà cung cấp: [Bắt đầu](/vi/start/getting-started)

## Lệnh phổ biến

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` hiển thị mặc định/dự phòng đã phân giải cùng tổng quan xác thực.
Khi có ảnh chụp nhanh mức sử dụng của nhà cung cấp, phần trạng thái OAuth/API-key bao gồm
các cửa sổ sử dụng và ảnh chụp nhanh hạn mức của nhà cung cấp.
Nhà cung cấp có cửa sổ sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi và z.ai. Xác thực mức sử dụng đến từ các hook dành riêng cho nhà cung cấp
khi có; nếu không OpenClaw sẽ quay về thông tin đăng nhập OAuth/API-key khớp
từ hồ sơ xác thực, env hoặc cấu hình.
Trong đầu ra `--json`, `auth.providers` là tổng quan nhà cung cấp có nhận biết env/config/store,
trong khi `auth.oauth` chỉ là tình trạng hồ sơ auth-store.
Thêm `--probe` để chạy probe xác thực trực tiếp với từng hồ sơ nhà cung cấp đã cấu hình.
Probe là các yêu cầu thật (có thể tiêu thụ token và kích hoạt giới hạn tốc độ).
Dùng `--agent <id>` để kiểm tra trạng thái mô hình/xác thực của một agent đã cấu hình. Khi bỏ qua,
lệnh dùng `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` nếu được đặt, nếu không thì dùng
agent mặc định đã cấu hình.
Các hàng probe có thể đến từ hồ sơ xác thực, thông tin đăng nhập env hoặc `models.json`.

Ghi chú:

- `models set <model-or-alias>` chấp nhận `provider/model` hoặc một alias.
- `models list` là chỉ đọc: nó đọc cấu hình, hồ sơ xác thực, trạng thái catalog hiện có,
  và các hàng catalog do nhà cung cấp sở hữu, nhưng không ghi lại
  `models.json`.
- Cột `Auth` là cấp nhà cung cấp và chỉ đọc. Cột này được tính từ metadata hồ sơ
  xác thực cục bộ, marker env, khóa nhà cung cấp đã cấu hình, marker nhà cung cấp cục bộ,
  marker env/profile của AWS Bedrock và metadata synthetic-auth của Plugin;
  nó không tải runtime nhà cung cấp, đọc secret keychain, gọi API nhà cung cấp,
  hoặc chứng minh chính xác khả năng sẵn sàng thực thi theo từng mô hình.
- `models list --all --provider <id>` có thể bao gồm các hàng catalog tĩnh do nhà cung cấp sở hữu
  từ manifest Plugin hoặc metadata catalog nhà cung cấp đi kèm ngay cả khi bạn
  chưa xác thực với nhà cung cấp đó. Những hàng đó vẫn hiển thị là
  không khả dụng cho đến khi xác thực khớp được cấu hình.
- `models list` giữ cho mặt phẳng điều khiển phản hồi nhanh trong khi khám phá catalog nhà cung cấp
  chậm. Các chế độ xem mặc định và đã cấu hình quay về các hàng mô hình đã cấu hình hoặc
  tổng hợp sau một khoảng chờ ngắn và để khám phá hoàn tất trong
  nền. Dùng `--all` khi bạn cần catalog được khám phá đầy đủ chính xác và
  sẵn sàng chờ khám phá nhà cung cấp.
- `models list --all` phạm vi rộng hợp nhất các hàng catalog manifest lên trên các hàng registry
  mà không tải hook bổ sung runtime nhà cung cấp. Đường nhanh manifest có lọc theo nhà cung cấp
  chỉ dùng các nhà cung cấp được đánh dấu `static`; các nhà cung cấp được đánh dấu `refreshable`
  vẫn dựa trên registry/cache và nối thêm hàng manifest làm phần bổ sung, trong khi
  các nhà cung cấp được đánh dấu `runtime` vẫn ở khám phá registry/runtime.
- `models list` giữ metadata mô hình gốc và giới hạn runtime riêng biệt. Trong đầu ra bảng,
  `Ctx` hiển thị `contextTokens/contextWindow` khi một giới hạn runtime hiệu dụng
  khác với cửa sổ ngữ cảnh gốc; các hàng JSON bao gồm `contextTokens`
  khi một nhà cung cấp công bố giới hạn đó.
- `models list --provider <id>` lọc theo id nhà cung cấp, chẳng hạn `moonshot` hoặc
  `openai-codex`. Nó không chấp nhận nhãn hiển thị từ bộ chọn nhà cung cấp tương tác,
  chẳng hạn `Moonshot AI`.
- Tham chiếu mô hình được phân tích bằng cách tách tại dấu `/` **đầu tiên**. Nếu ID mô hình bao gồm `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw phân giải đầu vào như một alias trước, sau đó
  như một khớp nhà cung cấp đã cấu hình duy nhất cho đúng id mô hình đó, và chỉ sau đó
  mới quay về nhà cung cấp mặc định đã cấu hình kèm cảnh báo không còn khuyến nghị.
  Nếu nhà cung cấp đó không còn công bố mô hình mặc định đã cấu hình, OpenClaw
  quay về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị
  mặc định nhà cung cấp đã bị xóa lỗi thời.
- `models status` có thể hiển thị `marker(<value>)` trong đầu ra xác thực cho placeholder không bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) thay vì che chúng như secret.

### Quét mô hình

`models scan` đọc catalog `:free` công khai của OpenRouter và xếp hạng ứng viên để
dùng làm dự phòng. Bản thân catalog là công khai, nên các lượt quét chỉ metadata không cần
khóa OpenRouter.

Theo mặc định OpenClaw cố gắng probe hỗ trợ công cụ và hình ảnh bằng các lệnh gọi mô hình trực tiếp.
Nếu không có khóa OpenRouter nào được cấu hình, lệnh quay về đầu ra chỉ metadata
và giải thích rằng các mô hình `:free` vẫn yêu cầu `OPENROUTER_API_KEY` cho
probe và suy luận.

Tùy chọn:

- `--no-probe` (chỉ metadata; không tra cứu cấu hình/secret)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (yêu cầu catalog và timeout cho từng probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` và `--set-image` yêu cầu probe trực tiếp; kết quả quét chỉ metadata
chỉ mang tính thông tin và không được áp dụng vào cấu hình.

### Trạng thái mô hình

Tùy chọn:

- `--json`
- `--plain`
- `--check` (thoát 1=hết hạn/thiếu, 2=sắp hết hạn)
- `--probe` (probe trực tiếp các hồ sơ xác thực đã cấu hình)
- `--probe-provider <name>` (probe một nhà cung cấp)
- `--probe-profile <id>` (lặp lại hoặc id hồ sơ phân tách bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` giữ stdout dành riêng cho payload JSON. Chẩn đoán hồ sơ xác thực, nhà cung cấp,
và khởi động được chuyển đến stderr để script có thể pipe stdout trực tiếp
vào các công cụ như `jq`.

Nhóm trạng thái probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Các trường hợp mã chi tiết/lý do probe cần dự kiến:

- `excluded_by_auth_order`: một hồ sơ đã lưu tồn tại, nhưng explicit
  `auth.order.<provider>` đã bỏ qua nó, nên probe báo cáo việc loại trừ thay vì
  thử nó.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  hồ sơ có mặt nhưng không đủ điều kiện/không thể phân giải.
- `no_model`: xác thực nhà cung cấp tồn tại, nhưng OpenClaw không thể phân giải một
  ứng viên mô hình có thể probe cho nhà cung cấp đó.

## Alias + dự phòng

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Hồ sơ xác thực

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` là trình hỗ trợ xác thực tương tác. Nó có thể khởi chạy một luồng xác thực
nhà cung cấp (OAuth/API key) hoặc hướng dẫn bạn dán token thủ công, tùy theo
nhà cung cấp bạn chọn.

`models auth list` liệt kê các hồ sơ xác thực đã lưu cho agent đã chọn mà không
in token, API-key hoặc vật liệu secret OAuth. Dùng `--provider <id>` để
lọc theo một nhà cung cấp, chẳng hạn `openai-codex`, và `--json` cho scripting.

`models auth login` chạy luồng xác thực của Plugin nhà cung cấp (OAuth/API key). Dùng
`openclaw plugins list` để xem nhà cung cấp nào đã được cài đặt.
Dùng `openclaw models auth --agent <id> <subcommand>` để ghi kết quả xác thực vào một
kho agent đã cấu hình cụ thể. Cờ cha `--agent` được tôn trọng bởi
`add`, `list`, `login`, `setup-token`, `paste-token`, và
`login-github-copilot`.

Ví dụ:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Ghi chú:

- `setup-token` và `paste-token` vẫn là các lệnh token chung cho nhà cung cấp
  công bố phương thức xác thực token.
- `setup-token` yêu cầu TTY tương tác và chạy phương thức token-auth của nhà cung cấp
  (mặc định là phương thức `setup-token` của nhà cung cấp đó khi nhà cung cấp công bố
  phương thức này).
- `paste-token` chấp nhận một chuỗi token được tạo ở nơi khác hoặc từ tự động hóa.
- `paste-token` yêu cầu `--provider`, nhắc nhập giá trị token, và ghi
  nó vào id hồ sơ mặc định `<provider>:manual` trừ khi bạn truyền
  `--profile-id`.
- `paste-token --expires-in <duration>` lưu thời điểm hết hạn token tuyệt đối từ một
  khoảng thời gian tương đối như `365d` hoặc `12h`.
- Ghi chú Anthropic: Nhân viên Anthropic đã cho chúng tôi biết việc dùng Claude CLI kiểu OpenClaw được phép trở lại, nên OpenClaw coi việc tái sử dụng Claude CLI và dùng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới.
- Anthropic `setup-token` / `paste-token` vẫn khả dụng như một đường token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
