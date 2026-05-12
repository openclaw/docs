---
read_when:
    - Bạn muốn thay đổi các mô hình mặc định hoặc xem trạng thái xác thực của nhà cung cấp
    - Bạn muốn quét các mô hình/nhà cung cấp có sẵn và gỡ lỗi hồ sơ xác thực
summary: Tham chiếu CLI cho `openclaw models` (status/list/set/scan, bí danh, phương án dự phòng, xác thực)
title: Mô hình
x-i18n:
    generated_at: "2026-05-12T00:58:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Khám phá, quét và cấu hình mô hình (mô hình mặc định, dự phòng, hồ sơ xác thực).

Liên quan:

- Nhà cung cấp + mô hình: [Mô hình](/vi/providers/models)
- Khái niệm chọn mô hình + lệnh gạch chéo `/models`: [Khái niệm mô hình](/vi/concepts/models)
- Thiết lập xác thực nhà cung cấp: [Bắt đầu](/vi/start/getting-started)

## Lệnh thường dùng

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` hiển thị mặc định/dự phòng đã phân giải cùng tổng quan xác thực.
Khi có ảnh chụp nhanh mức sử dụng của nhà cung cấp, phần trạng thái OAuth/API-key bao gồm
các cửa sổ sử dụng của nhà cung cấp và ảnh chụp nhanh hạn mức.
Nhà cung cấp có cửa sổ sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi và z.ai. Xác thực mức sử dụng đến từ các hook dành riêng cho nhà cung cấp
khi có; nếu không, OpenClaw quay về khớp thông tin xác thực OAuth/API-key
từ hồ sơ xác thực, env hoặc cấu hình.
Trong đầu ra `--json`, `auth.providers` là tổng quan nhà cung cấp có nhận biết env/cấu hình/kho lưu trữ,
còn `auth.oauth` chỉ là tình trạng hồ sơ trong kho xác thực.
Thêm `--probe` để chạy các phép thăm dò xác thực trực tiếp đối với từng hồ sơ nhà cung cấp đã cấu hình.
Thăm dò là yêu cầu thật (có thể tiêu thụ token và kích hoạt giới hạn tốc độ).
Dùng `--agent <id>` để kiểm tra trạng thái mô hình/xác thực của một agent đã cấu hình. Khi bỏ qua,
lệnh dùng `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` nếu đã đặt, nếu không thì dùng
agent mặc định đã cấu hình.
Các hàng thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực env hoặc `models.json`.
Để khắc phục sự cố Codex OAuth, `openclaw models status`,
`openclaw models auth list --provider openai-codex` và
`openclaw config get agents.defaults.model --json` là cách nhanh nhất để
xác nhận agent có hồ sơ xác thực `openai-codex` dùng được cho
`openai/*` thông qua runtime Codex gốc hay không. Xem [thiết lập nhà cung cấp OpenAI](/vi/providers/openai#check-and-recover-codex-oauth-routing).

Ghi chú:

- `models set <model-or-alias>` chấp nhận `provider/model` hoặc một bí danh.
- `models list` là chỉ đọc: lệnh đọc cấu hình, hồ sơ xác thực, trạng thái catalog hiện có
  và các hàng catalog do nhà cung cấp sở hữu, nhưng không ghi lại
  `models.json`.
- Cột `Auth` ở cấp nhà cung cấp và chỉ đọc. Cột này được tính từ metadata hồ sơ
  xác thực cục bộ, dấu hiệu env, khóa nhà cung cấp đã cấu hình, dấu hiệu nhà cung cấp cục bộ,
  dấu hiệu env/hồ sơ AWS Bedrock và metadata xác thực tổng hợp của Plugin;
  cột này không tải runtime nhà cung cấp, đọc bí mật trong keychain, gọi API
  nhà cung cấp, hoặc chứng minh khả năng sẵn sàng thực thi chính xác theo từng mô hình.
- `models list --all --provider <id>` có thể bao gồm các hàng catalog tĩnh do nhà cung cấp sở hữu
  từ manifest Plugin hoặc metadata catalog nhà cung cấp đóng gói ngay cả khi bạn
  chưa xác thực với nhà cung cấp đó. Các hàng đó vẫn hiển thị là
  không khả dụng cho đến khi cấu hình xác thực khớp.
- `models list` giữ mặt phẳng điều khiển phản hồi nhanh trong khi quá trình khám phá catalog
  nhà cung cấp bị chậm. Các chế độ xem mặc định và đã cấu hình quay về các hàng mô hình đã cấu hình hoặc
  tổng hợp sau một khoảng chờ ngắn và để quá trình khám phá hoàn tất trong
  nền. Dùng `--all` khi bạn cần catalog đầy đủ đã khám phá chính xác và
  sẵn sàng chờ quá trình khám phá nhà cung cấp.
- `models list --all` phạm vi rộng hợp nhất các hàng catalog manifest lên trên hàng registry
  mà không tải hook bổ sung runtime nhà cung cấp. Các đường nhanh manifest có lọc theo nhà cung cấp
  chỉ dùng nhà cung cấp được đánh dấu `static`; nhà cung cấp được đánh dấu `refreshable`
  vẫn dựa trên registry/cache và nối thêm các hàng manifest làm phần bổ sung, còn
  nhà cung cấp được đánh dấu `runtime` vẫn dùng khám phá registry/runtime.
- `models list` giữ metadata mô hình gốc và giới hạn runtime riêng biệt. Trong đầu ra bảng,
  `Ctx` hiển thị `contextTokens/contextWindow` khi giới hạn runtime hiệu dụng
  khác với cửa sổ ngữ cảnh gốc; các hàng JSON bao gồm `contextTokens`
  khi nhà cung cấp công bố giới hạn đó.
- `models list --provider <id>` lọc theo ID nhà cung cấp, chẳng hạn `moonshot` hoặc
  `openai-codex`. Lệnh không chấp nhận nhãn hiển thị từ bộ chọn nhà cung cấp
  tương tác, chẳng hạn `Moonshot AI`.
- Tham chiếu mô hình được phân tích bằng cách tách ở dấu `/` **đầu tiên**. Nếu ID mô hình có chứa `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, trước tiên OpenClaw phân giải đầu vào như một bí danh, sau đó
  như một khớp nhà cung cấp đã cấu hình duy nhất cho chính xác ID mô hình đó, và chỉ sau đó
  quay về nhà cung cấp mặc định đã cấu hình kèm cảnh báo ngừng hỗ trợ.
  Nếu nhà cung cấp đó không còn công bố mô hình mặc định đã cấu hình, OpenClaw
  quay về cặp nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị một
  mặc định nhà cung cấp đã bị xóa và lỗi thời.
- `models status` có thể hiển thị `marker(<value>)` trong đầu ra xác thực cho các phần giữ chỗ không bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) thay vì che chúng như bí mật.

### Quét mô hình

`models scan` đọc catalog `:free` công khai của OpenRouter và xếp hạng ứng viên để
dùng làm dự phòng. Bản thân catalog là công khai, nên các lần quét chỉ metadata không cần
khóa OpenRouter.

Theo mặc định, OpenClaw cố thăm dò hỗ trợ công cụ và hình ảnh bằng các lệnh gọi mô hình trực tiếp.
Nếu chưa cấu hình khóa OpenRouter, lệnh quay về đầu ra chỉ metadata
và giải thích rằng mô hình `:free` vẫn yêu cầu `OPENROUTER_API_KEY` để
thăm dò và suy luận.

Tùy chọn:

- `--no-probe` (chỉ metadata; không tra cứu cấu hình/bí mật)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (yêu cầu catalog và thời gian chờ cho mỗi thăm dò)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` và `--set-image` yêu cầu thăm dò trực tiếp; kết quả quét
chỉ metadata chỉ mang tính thông tin và không được áp dụng vào cấu hình.

### Trạng thái mô hình

Tùy chọn:

- `--json`
- `--plain`
- `--check` (mã thoát 1=hết hạn/thiếu, 2=sắp hết hạn)
- `--probe` (thăm dò trực tiếp các hồ sơ xác thực đã cấu hình)
- `--probe-provider <name>` (thăm dò một nhà cung cấp)
- `--probe-profile <id>` (lặp lại hoặc các ID hồ sơ phân tách bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (ID agent đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` giữ stdout dành riêng cho payload JSON. Chẩn đoán hồ sơ xác thực, nhà cung cấp
và khởi động được định tuyến đến stderr để script có thể pipe stdout trực tiếp
vào các công cụ như `jq`.

Nhóm trạng thái thăm dò:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Các trường hợp chi tiết/mã lý do thăm dò cần dự kiến:

- `excluded_by_auth_order`: một hồ sơ đã lưu tồn tại, nhưng `auth.order.<provider>` tường minh
  đã bỏ qua hồ sơ đó, nên thăm dò báo cáo việc loại trừ thay vì
  thử hồ sơ.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  hồ sơ có mặt nhưng không đủ điều kiện/không phân giải được.
- `no_model`: xác thực nhà cung cấp tồn tại, nhưng OpenClaw không thể phân giải ứng viên
  mô hình có thể thăm dò cho nhà cung cấp đó.

## Bí danh + dự phòng

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

`models auth add` là trợ lý xác thực tương tác. Lệnh có thể khởi chạy luồng xác thực
nhà cung cấp (OAuth/API key) hoặc hướng dẫn bạn dán token thủ công, tùy theo
nhà cung cấp bạn chọn.

`models auth list` liệt kê các hồ sơ xác thực đã lưu cho agent đã chọn mà không
in token, API-key hoặc dữ liệu bí mật OAuth. Dùng `--provider <id>` để
lọc một nhà cung cấp, chẳng hạn `openai-codex`, và `--json` cho scripting.

`models auth login` chạy luồng xác thực của Plugin nhà cung cấp (OAuth/API key). Dùng
`openclaw plugins list` để xem các nhà cung cấp nào đã được cài đặt.
Dùng `openclaw models auth --agent <id> <subcommand>` để ghi kết quả xác thực vào một
kho agent đã cấu hình cụ thể. Cờ cha `--agent` được tôn trọng bởi
`add`, `list`, `login`, `setup-token`, `paste-token` và
`login-github-copilot`.

Đối với mô hình OpenAI, `--provider openai` mặc định là đăng nhập tài khoản ChatGPT/Codex.
Chỉ dùng `--method api-key` khi bạn muốn thêm hồ sơ API-key OpenAI,
thường làm phương án dự phòng cho giới hạn thuê bao Codex. Cách viết cũ
`--provider openai-codex` vẫn hoạt động cho các script hiện có.

Ví dụ:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

Ghi chú:

- `setup-token` và `paste-token` vẫn là các lệnh token chung cho nhà cung cấp
  công bố phương thức xác thực bằng token.
- `setup-token` yêu cầu TTY tương tác và chạy phương thức xác thực bằng token của nhà cung cấp
  (mặc định là phương thức `setup-token` của nhà cung cấp đó khi họ công bố
  phương thức này).
- `paste-token` chấp nhận chuỗi token được tạo ở nơi khác hoặc từ tự động hóa.
- `paste-token` yêu cầu `--provider`, nhắc nhập giá trị token và ghi
  giá trị đó vào ID hồ sơ mặc định `<provider>:manual` trừ khi bạn truyền
  `--profile-id`.
- `paste-token --expires-in <duration>` lưu thời điểm hết hạn token tuyệt đối từ một
  khoảng thời gian tương đối như `365d` hoặc `12h`.
- Ghi chú về Anthropic: nhân viên Anthropic đã cho chúng tôi biết việc sử dụng Claude CLI kiểu OpenClaw đã được cho phép trở lại, nên OpenClaw xem việc tái sử dụng Claude CLI và sử dụng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới.
- Anthropic `setup-token` / `paste-token` vẫn khả dụng như một đường dẫn token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
