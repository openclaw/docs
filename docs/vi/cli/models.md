---
read_when:
    - Bạn muốn thay đổi các mô hình mặc định hoặc xem trạng thái xác thực của nhà cung cấp
    - Bạn muốn quét các mô hình/nhà cung cấp có sẵn và gỡ lỗi các hồ sơ xác thực
summary: Tài liệu tham khảo CLI cho `openclaw models` (status/list/set/scan, bí danh, phương án dự phòng, xác thực)
title: Mô hình
x-i18n:
    generated_at: "2026-05-01T10:47:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 538d3e4808329737fdc044dc6e14e5c7c78052e75d8a8b3b257b1ebd821c84d1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Phát hiện, quét và cấu hình mô hình (mô hình mặc định, các phương án dự phòng, hồ sơ xác thực).

Liên quan:

- Nhà cung cấp + mô hình: [Mô hình](/vi/providers/models)
- Khái niệm chọn mô hình + lệnh slash `/models`: [Khái niệm mô hình](/vi/concepts/models)
- Thiết lập xác thực nhà cung cấp: [Bắt đầu](/vi/start/getting-started)

## Lệnh thường dùng

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` hiển thị mặc định/phương án dự phòng đã được phân giải cùng tổng quan xác thực.
Khi có ảnh chụp nhanh về mức dùng của nhà cung cấp, phần trạng thái OAuth/API-key sẽ bao gồm
các cửa sổ sử dụng của nhà cung cấp và ảnh chụp nhanh hạn mức.
Các nhà cung cấp cửa sổ sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi và z.ai. Xác thực mức dùng đến từ các hook dành riêng cho nhà cung cấp
khi có; nếu không OpenClaw sẽ quay về dùng thông tin xác thực OAuth/API-key khớp
từ hồ sơ xác thực, env hoặc cấu hình.
Trong đầu ra `--json`, `auth.providers` là tổng quan nhà cung cấp có nhận biết
env/config/store, còn `auth.oauth` chỉ là tình trạng hồ sơ trong kho xác thực.
Thêm `--probe` để chạy probe xác thực trực tiếp với từng hồ sơ nhà cung cấp đã cấu hình.
Probe là các yêu cầu thật (có thể tiêu thụ token và kích hoạt giới hạn tốc độ).
Dùng `--agent <id>` để kiểm tra trạng thái mô hình/xác thực của một agent đã cấu hình. Khi bỏ qua,
lệnh dùng `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` nếu đã đặt, nếu không thì dùng
agent mặc định đã cấu hình.
Các hàng probe có thể đến từ hồ sơ xác thực, thông tin xác thực trong env hoặc `models.json`.

Ghi chú:

- `models set <model-or-alias>` chấp nhận `provider/model` hoặc một alias.
- `models list` là chỉ đọc: lệnh đọc cấu hình, hồ sơ xác thực, trạng thái catalog
  hiện có và các hàng catalog do nhà cung cấp sở hữu, nhưng không ghi lại
  `models.json`.
- Cột `Auth` ở cấp nhà cung cấp và chỉ đọc. Cột này được tính từ metadata hồ sơ
  xác thực cục bộ, marker env, khóa nhà cung cấp đã cấu hình, marker nhà cung cấp cục bộ,
  marker env/profile của AWS Bedrock và metadata synthetic-auth của Plugin;
  cột này không tải runtime của nhà cung cấp, đọc bí mật keychain, gọi API
  nhà cung cấp hoặc chứng minh trạng thái sẵn sàng thực thi chính xác theo từng mô hình.
- `models list --all --provider <id>` có thể bao gồm các hàng catalog tĩnh do nhà cung cấp sở hữu
  từ manifest Plugin hoặc metadata catalog nhà cung cấp đi kèm ngay cả khi bạn
  chưa xác thực với nhà cung cấp đó. Các hàng đó vẫn hiển thị là
  không khả dụng cho đến khi cấu hình xác thực khớp.
- `models list` giữ cho mặt phẳng điều khiển phản hồi nhanh trong khi quá trình phát hiện catalog
  của nhà cung cấp bị chậm. Các chế độ xem mặc định và đã cấu hình quay về dùng các hàng mô hình
  đã cấu hình hoặc tổng hợp sau một khoảng chờ ngắn và để quá trình phát hiện hoàn tất trong
  nền. Dùng `--all` khi bạn cần catalog đầy đủ đã phát hiện chính xác và
  sẵn sàng chờ quá trình phát hiện của nhà cung cấp.
- `models list --all` phạm vi rộng hợp nhất các hàng catalog manifest lên trên các hàng registry
  mà không tải các hook bổ sung runtime của nhà cung cấp. Các đường nhanh manifest được lọc theo nhà cung cấp
  chỉ dùng những nhà cung cấp được đánh dấu `static`; các nhà cung cấp được đánh dấu `refreshable`
  vẫn dựa trên registry/cache và nối thêm các hàng manifest dưới dạng bổ sung, trong khi
  các nhà cung cấp được đánh dấu `runtime` vẫn dùng phát hiện registry/runtime.
- `models list` giữ metadata mô hình gốc và giới hạn runtime tách biệt. Trong đầu ra bảng,
  `Ctx` hiển thị `contextTokens/contextWindow` khi giới hạn runtime hiệu dụng
  khác với cửa sổ ngữ cảnh gốc; các hàng JSON bao gồm `contextTokens`
  khi nhà cung cấp công bố giới hạn đó.
- `models list --provider <id>` lọc theo id nhà cung cấp, chẳng hạn `moonshot` hoặc
  `openai-codex`. Lệnh không chấp nhận nhãn hiển thị từ bộ chọn nhà cung cấp
  tương tác, chẳng hạn `Moonshot AI`.
- Tham chiếu mô hình được phân tích bằng cách tách tại dấu `/` **đầu tiên**. Nếu ID mô hình có chứa `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw phân giải đầu vào như một alias trước, sau đó
  như một kết quả khớp duy nhất với nhà cung cấp đã cấu hình cho đúng id mô hình đó, và chỉ sau đó
  mới quay về dùng nhà cung cấp mặc định đã cấu hình cùng cảnh báo không còn khuyến nghị.
  Nếu nhà cung cấp đó không còn công bố mô hình mặc định đã cấu hình, OpenClaw
  quay về dùng nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị một
  mặc định nhà cung cấp đã bị xóa và lỗi thời.
- `models status` có thể hiển thị `marker(<value>)` trong đầu ra xác thực cho placeholder không bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) thay vì che chúng như bí mật.

### Quét mô hình

`models scan` đọc catalog `:free` công khai của OpenRouter và xếp hạng ứng viên để
dùng làm phương án dự phòng. Bản thân catalog là công khai, nên các lượt quét chỉ metadata không cần
khóa OpenRouter.

Theo mặc định OpenClaw cố probe khả năng hỗ trợ công cụ và hình ảnh bằng các lệnh gọi mô hình trực tiếp.
Nếu chưa cấu hình khóa OpenRouter, lệnh quay về đầu ra chỉ metadata
và giải thích rằng các mô hình `:free` vẫn cần `OPENROUTER_API_KEY` cho
probe và suy luận.

Tùy chọn:

- `--no-probe` (chỉ metadata; không tra cứu cấu hình/bí mật)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout cho yêu cầu catalog và từng probe)
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
- `--probe-profile <id>` (lặp lại hoặc danh sách id hồ sơ phân tách bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` giữ stdout dành riêng cho payload JSON. Chẩn đoán hồ sơ xác thực, nhà cung cấp
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

Các trường hợp chi tiết probe/mã lý do có thể gặp:

- `excluded_by_auth_order`: có hồ sơ đã lưu, nhưng cấu hình tường minh
  `auth.order.<provider>` đã bỏ qua hồ sơ đó, nên probe báo cáo việc loại trừ thay vì
  thử dùng hồ sơ.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  hồ sơ có mặt nhưng không đủ điều kiện/không phân giải được.
- `no_model`: có xác thực nhà cung cấp, nhưng OpenClaw không thể phân giải một ứng viên
  mô hình có thể probe cho nhà cung cấp đó.

## Alias + phương án dự phòng

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

`models auth add` là trình trợ giúp xác thực tương tác. Nó có thể khởi chạy luồng xác thực
nhà cung cấp (OAuth/API key) hoặc hướng dẫn bạn dán token thủ công, tùy vào
nhà cung cấp bạn chọn.

`models auth login` chạy luồng xác thực của Plugin nhà cung cấp (OAuth/API key). Dùng
`openclaw plugins list` để xem các nhà cung cấp đã cài đặt.
Dùng `openclaw models auth --agent <id> <subcommand>` để ghi kết quả xác thực vào một
kho agent đã cấu hình cụ thể. Cờ cha `--agent` được
`add`, `login`, `setup-token`, `paste-token` và `login-github-copilot` tuân theo.

Ví dụ:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Ghi chú:

- `setup-token` và `paste-token` vẫn là các lệnh token chung cho những nhà cung cấp
  công bố phương thức xác thực bằng token.
- `setup-token` yêu cầu TTY tương tác và chạy phương thức xác thực bằng token của nhà cung cấp
  (mặc định dùng phương thức `setup-token` của nhà cung cấp đó khi họ công bố
  phương thức này).
- `paste-token` chấp nhận chuỗi token được tạo ở nơi khác hoặc từ tự động hóa.
- `paste-token` yêu cầu `--provider`, nhắc nhập giá trị token, và ghi
  nó vào id hồ sơ mặc định `<provider>:manual` trừ khi bạn truyền
  `--profile-id`.
- `paste-token --expires-in <duration>` lưu thời điểm hết hạn tuyệt đối của token từ một
  khoảng thời gian tương đối như `365d` hoặc `12h`.
- Ghi chú về Anthropic: Nhân viên Anthropic đã cho chúng tôi biết rằng việc sử dụng Claude CLI kiểu OpenClaw lại được phép, nên OpenClaw xem việc tái sử dụng Claude CLI và sử dụng `claude -p` là được chấp thuận cho tích hợp này, trừ khi Anthropic công bố chính sách mới.
- Anthropic `setup-token` / `paste-token` vẫn có sẵn như một đường dẫn token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Chọn mô hình](/vi/concepts/model-providers)
- [Chuyển dự phòng mô hình](/vi/concepts/model-failover)
