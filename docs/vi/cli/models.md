---
read_when:
    - Bạn muốn thay đổi các mô hình mặc định hoặc xem trạng thái xác thực của nhà cung cấp
    - Bạn muốn quét các mô hình/nhà cung cấp hiện có và gỡ lỗi các hồ sơ xác thực
summary: Tham chiếu CLI cho `openclaw models` (status/list/set/scan, bí danh, cơ chế dự phòng, xác thực)
title: Mô hình
x-i18n:
    generated_at: "2026-04-29T22:32:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Khám phá, quét và cấu hình mô hình (mô hình mặc định, phương án dự phòng, hồ sơ xác thực).

Liên quan:

- Nhà cung cấp + mô hình: [Mô hình](/vi/providers/models)
- Khái niệm lựa chọn mô hình + lệnh gạch chéo `/models`: [Khái niệm mô hình](/vi/concepts/models)
- Thiết lập xác thực nhà cung cấp: [Bắt đầu](/vi/start/getting-started)

## Lệnh thông dụng

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` hiển thị mô hình mặc định/phương án dự phòng đã phân giải cùng phần tổng quan xác thực.
Khi có ảnh chụp nhanh mức sử dụng của nhà cung cấp, phần trạng thái OAuth/khóa API bao gồm
các cửa sổ sử dụng của nhà cung cấp và ảnh chụp nhanh hạn mức.
Các nhà cung cấp có cửa sổ sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi và z.ai. Xác thực mức sử dụng đến từ các hook riêng của nhà cung cấp
khi có; nếu không, OpenClaw sẽ chuyển sang dùng thông tin xác thực OAuth/khóa API khớp
từ hồ sơ xác thực, env hoặc cấu hình.
Trong đầu ra `--json`, `auth.providers` là phần tổng quan nhà cung cấp có nhận biết
env/cấu hình/kho lưu trữ, còn `auth.oauth` chỉ là tình trạng sức khỏe hồ sơ trong kho xác thực.
Thêm `--probe` để chạy kiểm tra xác thực trực tiếp với từng hồ sơ nhà cung cấp đã cấu hình.
Các kiểm tra là yêu cầu thật (có thể tiêu tốn token và kích hoạt giới hạn tốc độ).
Dùng `--agent <id>` để kiểm tra trạng thái mô hình/xác thực của một agent đã cấu hình. Khi bỏ qua,
lệnh dùng `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` nếu đã đặt, nếu không thì dùng
agent mặc định đã cấu hình.
Các hàng kiểm tra có thể đến từ hồ sơ xác thực, thông tin xác thực env hoặc `models.json`.

Ghi chú:

- `models set <model-or-alias>` chấp nhận `provider/model` hoặc một bí danh.
- `models list` là chỉ đọc: lệnh đọc cấu hình, hồ sơ xác thực, trạng thái danh mục hiện có
  và các hàng danh mục do nhà cung cấp sở hữu, nhưng không ghi lại
  `models.json`.
- Cột `Auth` ở cấp nhà cung cấp và chỉ đọc. Cột này được tính từ siêu dữ liệu
  hồ sơ xác thực cục bộ, dấu hiệu env, khóa nhà cung cấp đã cấu hình, dấu hiệu
  nhà cung cấp cục bộ, dấu hiệu env/hồ sơ AWS Bedrock và siêu dữ liệu xác thực tổng hợp của Plugin;
  nó không tải runtime của nhà cung cấp, đọc bí mật trong keychain, gọi API
  nhà cung cấp hoặc chứng minh chính xác khả năng sẵn sàng thực thi theo từng mô hình.
- `models list --all --provider <id>` có thể bao gồm các hàng danh mục tĩnh do nhà cung cấp sở hữu
  từ manifest Plugin hoặc siêu dữ liệu danh mục nhà cung cấp được đóng gói ngay cả khi bạn
  chưa xác thực với nhà cung cấp đó. Các hàng đó vẫn hiển thị là
  không khả dụng cho đến khi cấu hình xác thực khớp.
- `models list --all` phạm vi rộng hợp nhất các hàng danh mục trong manifest lên trên các hàng registry
  mà không tải các hook bổ sung runtime của nhà cung cấp. Các đường nhanh manifest được lọc theo nhà cung cấp
  chỉ dùng những nhà cung cấp được đánh dấu `static`; nhà cung cấp được đánh dấu `refreshable`
  vẫn dựa trên registry/cache và thêm các hàng manifest làm phần bổ sung, còn
  nhà cung cấp được đánh dấu `runtime` vẫn dùng khám phá registry/runtime.
- `models list` giữ riêng siêu dữ liệu mô hình gốc và giới hạn runtime. Trong đầu ra bảng,
  `Ctx` hiển thị `contextTokens/contextWindow` khi giới hạn runtime hiệu dụng
  khác với cửa sổ ngữ cảnh gốc; các hàng JSON bao gồm `contextTokens`
  khi nhà cung cấp phơi bày giới hạn đó.
- `models list --provider <id>` lọc theo id nhà cung cấp, chẳng hạn `moonshot` hoặc
  `openai-codex`. Lệnh không chấp nhận nhãn hiển thị từ bộ chọn nhà cung cấp
  tương tác, chẳng hạn `Moonshot AI`.
- Tham chiếu mô hình được phân tích bằng cách tách tại `/` **đầu tiên**. Nếu ID mô hình bao gồm `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw phân giải đầu vào trước tiên như một bí danh, sau đó
  như một kết quả khớp nhà cung cấp đã cấu hình duy nhất cho đúng id mô hình đó, và chỉ sau đó
  mới chuyển sang nhà cung cấp mặc định đã cấu hình cùng cảnh báo không khuyến khích dùng.
  Nếu nhà cung cấp đó không còn phơi bày mô hình mặc định đã cấu hình, OpenClaw
  chuyển sang nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị một
  mặc định nhà cung cấp đã bị gỡ bỏ và lỗi thời.
- `models status` có thể hiển thị `marker(<value>)` trong đầu ra xác thực cho các placeholder không bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) thay vì che chúng như bí mật.

### Quét mô hình

`models scan` đọc danh mục `:free` công khai của OpenRouter và xếp hạng ứng viên để
dùng làm phương án dự phòng. Bản thân danh mục là công khai, vì vậy các lần quét chỉ siêu dữ liệu không cần
khóa OpenRouter.

Theo mặc định OpenClaw cố gắng kiểm tra hỗ trợ công cụ và hình ảnh bằng lệnh gọi mô hình trực tiếp.
Nếu chưa cấu hình khóa OpenRouter, lệnh sẽ chuyển sang đầu ra chỉ siêu dữ liệu
và giải thích rằng các mô hình `:free` vẫn cần `OPENROUTER_API_KEY` để
kiểm tra và suy luận.

Tùy chọn:

- `--no-probe` (chỉ siêu dữ liệu; không tra cứu cấu hình/bí mật)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (yêu cầu danh mục và thời gian chờ cho từng kiểm tra)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` và `--set-image` yêu cầu kiểm tra trực tiếp; kết quả quét chỉ siêu dữ liệu
chỉ mang tính thông tin và không được áp dụng vào cấu hình.

### Trạng thái mô hình

Tùy chọn:

- `--json`
- `--plain`
- `--check` (thoát 1=hết hạn/thiếu, 2=sắp hết hạn)
- `--probe` (kiểm tra trực tiếp các hồ sơ xác thực đã cấu hình)
- `--probe-provider <name>` (kiểm tra một nhà cung cấp)
- `--probe-profile <id>` (lặp lại hoặc id hồ sơ phân tách bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` giữ stdout chỉ dành cho payload JSON. Chẩn đoán hồ sơ xác thực, nhà cung cấp,
và khởi động được chuyển tới stderr để script có thể pipe stdout trực tiếp
vào các công cụ như `jq`.

Nhóm trạng thái kiểm tra:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Các trường hợp chi tiết kiểm tra/mã lý do cần dự kiến:

- `excluded_by_auth_order`: tồn tại một hồ sơ đã lưu, nhưng `auth.order.<provider>` rõ ràng
  đã bỏ qua hồ sơ đó, vì vậy kiểm tra báo cáo việc loại trừ thay vì
  thử dùng hồ sơ.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  hồ sơ hiện diện nhưng không đủ điều kiện/không phân giải được.
- `no_model`: xác thực nhà cung cấp tồn tại, nhưng OpenClaw không thể phân giải một
  ứng viên mô hình có thể kiểm tra cho nhà cung cấp đó.

## Bí danh + phương án dự phòng

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Hồ sơ xác thực

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` là trình trợ giúp xác thực tương tác. Nó có thể khởi chạy một luồng xác thực nhà cung cấp
(OAuth/khóa API) hoặc hướng dẫn bạn dán token thủ công, tùy thuộc vào
nhà cung cấp bạn chọn.

`models auth login` chạy luồng xác thực của Plugin nhà cung cấp (OAuth/khóa API). Dùng
`openclaw plugins list` để xem những nhà cung cấp nào đã được cài đặt.
Dùng `openclaw models auth --agent <id> <subcommand>` để ghi kết quả xác thực vào một
kho agent đã cấu hình cụ thể. Cờ cha `--agent` được
`add`, `login`, `setup-token`, `paste-token` và `login-github-copilot` tuân thủ.

Ví dụ:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Ghi chú:

- `setup-token` và `paste-token` vẫn là các lệnh token chung cho nhà cung cấp
  phơi bày phương thức xác thực bằng token.
- `setup-token` yêu cầu TTY tương tác và chạy phương thức xác thực bằng token của nhà cung cấp
  (mặc định là phương thức `setup-token` của nhà cung cấp đó khi nhà cung cấp phơi bày
  phương thức này).
- `paste-token` chấp nhận chuỗi token được tạo ở nơi khác hoặc từ tự động hóa.
- `paste-token` yêu cầu `--provider`, nhắc nhập giá trị token và ghi
  giá trị đó vào id hồ sơ mặc định `<provider>:manual` trừ khi bạn truyền
  `--profile-id`.
- `paste-token --expires-in <duration>` lưu thời điểm hết hạn token tuyệt đối từ một
  khoảng thời gian tương đối như `365d` hoặc `12h`.
- Lưu ý về Anthropic: nhân viên Anthropic đã cho chúng tôi biết rằng việc sử dụng Claude CLI kiểu OpenClaw lại được phép, vì vậy OpenClaw coi việc tái sử dụng Claude CLI và sử dụng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới.
- Anthropic `setup-token` / `paste-token` vẫn khả dụng như một đường token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
