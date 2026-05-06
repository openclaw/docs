---
read_when:
    - Bạn muốn thay đổi các mô hình mặc định hoặc xem trạng thái xác thực của nhà cung cấp
    - Bạn muốn quét các mô hình/nhà cung cấp hiện có và gỡ lỗi hồ sơ xác thực
summary: Tham chiếu CLI cho `openclaw models` (status/list/set/scan, bí danh, phương án dự phòng, xác thực)
title: Mô hình
x-i18n:
    generated_at: "2026-05-06T19:35:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Khám phá, quét và cấu hình mô hình (mô hình mặc định, phương án dự phòng, hồ sơ xác thực).

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

`openclaw models status` hiển thị mô hình mặc định/phương án dự phòng đã được phân giải cùng phần tổng quan xác thực.
Khi có ảnh chụp nhanh mức sử dụng của nhà cung cấp, phần trạng thái OAuth/khóa API sẽ bao gồm
cửa sổ sử dụng của nhà cung cấp và ảnh chụp nhanh hạn mức.
Các nhà cung cấp cửa sổ sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi và z.ai. Xác thực mức sử dụng đến từ các hook dành riêng cho nhà cung cấp
khi có; nếu không OpenClaw sẽ quay về dùng thông tin xác thực OAuth/khóa API khớp
từ hồ sơ xác thực, env hoặc cấu hình.
Trong đầu ra `--json`, `auth.providers` là phần tổng quan nhà cung cấp có xét đến env/cấu hình/kho lưu trữ,
trong khi `auth.oauth` chỉ là tình trạng hồ sơ trong kho xác thực.
Thêm `--probe` để chạy thăm dò xác thực trực tiếp với từng hồ sơ nhà cung cấp đã cấu hình.
Các thăm dò là yêu cầu thật (có thể tiêu tốn token và kích hoạt giới hạn tốc độ).
Dùng `--agent <id>` để kiểm tra trạng thái mô hình/xác thực của một tác nhân đã cấu hình. Khi bỏ qua,
lệnh dùng `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` nếu được đặt, nếu không sẽ dùng
tác nhân mặc định đã cấu hình.
Các hàng thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực env hoặc `models.json`.
Để xử lý sự cố OAuth của Codex, `openclaw models status`,
`openclaw models auth list --provider openai-codex` và
`openclaw config get agents.defaults.model --json` là cách nhanh nhất để
xác nhận tác nhân đang dùng `openai-codex/*` qua PI hay `openai/*`
qua runtime Codex gốc. Xem [thiết lập nhà cung cấp OpenAI](/vi/providers/openai#check-and-recover-codex-oauth-routing).

Ghi chú:

- `models set <model-or-alias>` chấp nhận `provider/model` hoặc một bí danh.
- `models list` chỉ đọc: lệnh đọc cấu hình, hồ sơ xác thực, trạng thái catalog hiện có
  và các hàng catalog do nhà cung cấp sở hữu, nhưng không ghi lại
  `models.json`.
- Cột `Auth` ở cấp nhà cung cấp và chỉ đọc. Nó được tính từ siêu dữ liệu hồ sơ
  xác thực cục bộ, dấu hiệu env, khóa nhà cung cấp đã cấu hình, dấu hiệu nhà cung cấp cục bộ,
  dấu hiệu env/hồ sơ AWS Bedrock và siêu dữ liệu xác thực tổng hợp của Plugin;
  nó không tải runtime của nhà cung cấp, đọc bí mật trong keychain, gọi API
  của nhà cung cấp, hoặc chứng minh trạng thái sẵn sàng thực thi chính xác theo từng mô hình.
- `models list --all --provider <id>` có thể bao gồm các hàng catalog tĩnh do nhà cung cấp sở hữu
  từ manifest Plugin hoặc siêu dữ liệu catalog nhà cung cấp đi kèm ngay cả khi bạn
  chưa xác thực với nhà cung cấp đó. Các hàng đó vẫn hiển thị là
  không khả dụng cho đến khi cấu hình xác thực khớp.
- `models list` giữ control plane phản hồi nhanh khi quá trình khám phá catalog
  của nhà cung cấp chậm. Các chế độ xem mặc định và đã cấu hình quay về các hàng mô hình đã cấu hình hoặc
  tổng hợp sau một khoảng chờ ngắn và cho phép khám phá hoàn tất trong
  nền. Dùng `--all` khi bạn cần catalog đầy đủ đã khám phá chính xác và
  sẵn sàng chờ quá trình khám phá nhà cung cấp.
- `models list --all` rộng sẽ hợp nhất các hàng catalog từ manifest lên trên các hàng registry
  mà không tải các hook bổ sung runtime của nhà cung cấp. Các đường nhanh manifest được lọc theo nhà cung cấp
  chỉ dùng các nhà cung cấp được đánh dấu `static`; nhà cung cấp được đánh dấu `refreshable`
  vẫn dựa trên registry/cache và thêm các hàng manifest dưới dạng bổ sung, trong khi
  nhà cung cấp được đánh dấu `runtime` vẫn dùng khám phá registry/runtime.
- `models list` giữ siêu dữ liệu mô hình gốc và giới hạn runtime tách biệt. Trong đầu ra bảng,
  `Ctx` hiển thị `contextTokens/contextWindow` khi giới hạn runtime hiệu dụng
  khác với cửa sổ ngữ cảnh gốc; các hàng JSON bao gồm `contextTokens`
  khi nhà cung cấp phơi bày giới hạn đó.
- `models list --provider <id>` lọc theo id nhà cung cấp, chẳng hạn `moonshot` hoặc
  `openai-codex`. Lệnh không chấp nhận nhãn hiển thị từ bộ chọn nhà cung cấp tương tác,
  chẳng hạn `Moonshot AI`.
- Tham chiếu mô hình được phân tích bằng cách tách theo dấu `/` **đầu tiên**. Nếu ID mô hình chứa `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw phân giải đầu vào trước tiên như một bí danh, sau đó
  như một kết quả khớp duy nhất từ nhà cung cấp đã cấu hình cho đúng id mô hình đó, và chỉ sau đó
  mới quay về nhà cung cấp mặc định đã cấu hình kèm cảnh báo ngừng hỗ trợ.
  Nếu nhà cung cấp đó không còn phơi bày mô hình mặc định đã cấu hình, OpenClaw
  quay về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị một
  mặc định nhà cung cấp đã bị gỡ bỏ và lỗi thời.
- `models status` có thể hiển thị `marker(<value>)` trong đầu ra xác thực cho các placeholder không bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) thay vì che chúng như bí mật.

### Quét mô hình

`models scan` đọc catalog công khai `:free` của OpenRouter và xếp hạng ứng viên để
dùng làm phương án dự phòng. Bản thân catalog là công khai, nên các lần quét chỉ siêu dữ liệu không cần
khóa OpenRouter.

Theo mặc định OpenClaw cố gắng thăm dò hỗ trợ công cụ và hình ảnh bằng các lệnh gọi mô hình trực tiếp.
Nếu chưa cấu hình khóa OpenRouter, lệnh quay về đầu ra chỉ siêu dữ liệu
và giải thích rằng các mô hình `:free` vẫn cần `OPENROUTER_API_KEY` cho
thăm dò và suy luận.

Tùy chọn:

- `--no-probe` (chỉ siêu dữ liệu; không tra cứu cấu hình/bí mật)
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

`--set-default` và `--set-image` yêu cầu thăm dò trực tiếp; kết quả quét chỉ siêu dữ liệu
chỉ có tính thông tin và không được áp dụng vào cấu hình.

### Trạng thái mô hình

Tùy chọn:

- `--json`
- `--plain`
- `--check` (exit 1=hết hạn/thiếu, 2=sắp hết hạn)
- `--probe` (thăm dò trực tiếp các hồ sơ xác thực đã cấu hình)
- `--probe-provider <name>` (thăm dò một nhà cung cấp)
- `--probe-profile <id>` (lặp lại hoặc các id hồ sơ phân tách bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id tác nhân đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` giữ stdout dành riêng cho payload JSON. Chẩn đoán hồ sơ xác thực, nhà cung cấp,
và khởi động được chuyển tới stderr để script có thể pipe stdout trực tiếp
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

Các trường hợp chi tiết thăm dò/mã lý do cần dự kiến:

- `excluded_by_auth_order`: một hồ sơ đã lưu tồn tại, nhưng `auth.order.<provider>` rõ ràng
  đã bỏ qua nó, nên thăm dò báo cáo việc loại trừ thay vì
  thử hồ sơ đó.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  hồ sơ có tồn tại nhưng không đủ điều kiện/không thể phân giải.
- `no_model`: xác thực nhà cung cấp tồn tại, nhưng OpenClaw không thể phân giải một ứng viên
  mô hình có thể thăm dò cho nhà cung cấp đó.

## Bí danh + phương án dự phòng

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

`models auth add` là trình hỗ trợ xác thực tương tác. Nó có thể khởi chạy luồng xác thực
của nhà cung cấp (OAuth/khóa API) hoặc hướng dẫn bạn dán token thủ công, tùy vào
nhà cung cấp bạn chọn.

`models auth list` liệt kê các hồ sơ xác thực đã lưu cho tác nhân được chọn mà không
in token, khóa API hoặc vật liệu bí mật OAuth. Dùng `--provider <id>` để
lọc theo một nhà cung cấp, chẳng hạn `openai-codex`, và `--json` để viết script.

`models auth login` chạy luồng xác thực của Plugin nhà cung cấp (OAuth/khóa API). Dùng
`openclaw plugins list` để xem các nhà cung cấp nào đã được cài đặt.
Dùng `openclaw models auth --agent <id> <subcommand>` để ghi kết quả xác thực vào
kho tác nhân đã cấu hình cụ thể. Cờ cha `--agent` được tôn trọng bởi
`add`, `list`, `login`, `setup-token`, `paste-token`, và
`login-github-copilot`.

Ví dụ:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Ghi chú:

- `setup-token` và `paste-token` vẫn là các lệnh token chung cho nhà cung cấp
  phơi bày phương thức xác thực bằng token.
- `setup-token` yêu cầu một TTY tương tác và chạy phương thức xác thực bằng token
  của nhà cung cấp (mặc định là phương thức `setup-token` của nhà cung cấp đó khi họ phơi bày
  phương thức này).
- `paste-token` chấp nhận một chuỗi token được tạo ở nơi khác hoặc từ tự động hóa.
- `paste-token` yêu cầu `--provider`, nhắc nhập giá trị token, và ghi
  nó vào id hồ sơ mặc định `<provider>:manual` trừ khi bạn truyền
  `--profile-id`.
- `paste-token --expires-in <duration>` lưu thời điểm hết hạn token tuyệt đối từ một
  khoảng thời gian tương đối như `365d` hoặc `12h`.
- Ghi chú Anthropic: Nhân viên Anthropic đã cho chúng tôi biết rằng việc sử dụng Claude CLI kiểu OpenClaw lại được cho phép, nên OpenClaw xem việc tái sử dụng Claude CLI và sử dụng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới.
- Anthropic `setup-token` / `paste-token` vẫn có sẵn dưới dạng một đường token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
