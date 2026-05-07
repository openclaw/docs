---
read_when:
    - Bạn muốn thay đổi các mô hình mặc định hoặc xem trạng thái xác thực của nhà cung cấp
    - Bạn muốn quét các mô hình/nhà cung cấp có sẵn và gỡ lỗi hồ sơ xác thực
summary: Tài liệu tham chiếu CLI cho `openclaw models` (status/list/set/scan, bí danh, phương án dự phòng, xác thực)
title: Mô hình
x-i18n:
    generated_at: "2026-05-07T13:14:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Khám phá, quét và cấu hình mô hình (mô hình mặc định, các dự phòng, hồ sơ xác thực).

Liên quan:

- Nhà cung cấp + mô hình: [Mô hình](/vi/providers/models)
- Khái niệm chọn mô hình + lệnh gạch chéo `/models`: [Khái niệm về mô hình](/vi/concepts/models)
- Thiết lập xác thực nhà cung cấp: [Bắt đầu](/vi/start/getting-started)

## Các lệnh thường dùng

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` hiển thị mặc định/dự phòng đã phân giải cùng tổng quan xác thực.
Khi có ảnh chụp nhanh mức sử dụng nhà cung cấp, phần trạng thái OAuth/API-key sẽ bao gồm
các cửa sổ mức sử dụng của nhà cung cấp và ảnh chụp nhanh hạn ngạch.
Các nhà cung cấp cửa sổ mức sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi và z.ai. Xác thực mức sử dụng đến từ các hook dành riêng cho nhà cung cấp
khi có; nếu không, OpenClaw sẽ dự phòng bằng thông tin xác thực OAuth/API-key khớp
từ hồ sơ xác thực, env hoặc cấu hình.
Trong đầu ra `--json`, `auth.providers` là tổng quan nhà cung cấp có nhận biết
env/cấu hình/kho, trong khi `auth.oauth` chỉ là tình trạng hồ sơ trong kho xác thực.
Thêm `--probe` để chạy kiểm tra xác thực trực tiếp với từng hồ sơ nhà cung cấp đã cấu hình.
Các phép kiểm tra là yêu cầu thật (có thể tiêu thụ token và kích hoạt giới hạn tốc độ).
Dùng `--agent <id>` để kiểm tra trạng thái mô hình/xác thực của một agent đã cấu hình. Khi bỏ qua,
lệnh dùng `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` nếu đã đặt, nếu không thì dùng
agent mặc định đã cấu hình.
Các dòng kiểm tra có thể đến từ hồ sơ xác thực, thông tin xác thực env hoặc `models.json`.
Để khắc phục sự cố Codex OAuth, `openclaw models status`,
`openclaw models auth list --provider openai-codex` và
`openclaw config get agents.defaults.model --json` là cách nhanh nhất để
xác nhận liệu một agent có hồ sơ xác thực `openai-codex` dùng được cho
`openai/*` thông qua runtime Codex gốc hay không. Xem [thiết lập nhà cung cấp OpenAI](/vi/providers/openai#check-and-recover-codex-oauth-routing).

Ghi chú:

- `models set <model-or-alias>` chấp nhận `provider/model` hoặc một bí danh.
- `models list` là chỉ đọc: lệnh đọc cấu hình, hồ sơ xác thực, trạng thái catalog hiện có
  và các dòng catalog do nhà cung cấp sở hữu, nhưng không ghi lại
  `models.json`.
- Cột `Auth` là cấp nhà cung cấp và chỉ đọc. Cột này được tính từ siêu dữ liệu hồ sơ
  xác thực cục bộ, dấu hiệu env, khóa nhà cung cấp đã cấu hình, dấu hiệu nhà cung cấp cục bộ,
  dấu hiệu env/hồ sơ AWS Bedrock và siêu dữ liệu xác thực tổng hợp của Plugin;
  cột này không tải runtime nhà cung cấp, không đọc bí mật trong keychain, không gọi
  API nhà cung cấp, và không chứng minh mức sẵn sàng thực thi chính xác theo từng mô hình.
- `models list --all --provider <id>` có thể bao gồm các dòng catalog tĩnh do nhà cung cấp sở hữu
  từ manifest Plugin hoặc siêu dữ liệu catalog nhà cung cấp đi kèm ngay cả khi bạn
  chưa xác thực với nhà cung cấp đó. Những dòng đó vẫn hiển thị là
  không khả dụng cho đến khi xác thực khớp được cấu hình.
- `models list` giữ cho mặt phẳng điều khiển phản hồi nhanh trong khi quá trình khám phá catalog
  nhà cung cấp chậm. Các chế độ xem mặc định và đã cấu hình dự phòng về các dòng mô hình đã cấu hình hoặc
  tổng hợp sau một khoảng chờ ngắn và để quá trình khám phá hoàn tất trong
  nền. Dùng `--all` khi bạn cần catalog đầy đủ đã khám phá chính xác và
  sẵn sàng chờ quá trình khám phá nhà cung cấp.
- `models list --all` phạm vi rộng hợp nhất các dòng catalog manifest lên trên các dòng registry
  mà không tải các hook bổ sung runtime nhà cung cấp. Các đường nhanh manifest có lọc theo nhà cung cấp
  chỉ dùng các nhà cung cấp được đánh dấu `static`; các nhà cung cấp được đánh dấu `refreshable`
  vẫn dựa trên registry/cache và thêm các dòng manifest làm phần bổ sung, trong khi
  các nhà cung cấp được đánh dấu `runtime` vẫn dùng khám phá registry/runtime.
- `models list` giữ tách biệt siêu dữ liệu mô hình gốc và giới hạn runtime. Trong đầu ra bảng,
  `Ctx` hiển thị `contextTokens/contextWindow` khi giới hạn runtime hiệu dụng
  khác với cửa sổ ngữ cảnh gốc; các dòng JSON bao gồm `contextTokens`
  khi nhà cung cấp công bố giới hạn đó.
- `models list --provider <id>` lọc theo id nhà cung cấp, chẳng hạn `moonshot` hoặc
  `openai-codex`. Lệnh không chấp nhận nhãn hiển thị từ bộ chọn nhà cung cấp
  tương tác, chẳng hạn `Moonshot AI`.
- Tham chiếu mô hình được phân tích bằng cách tách tại dấu `/` **đầu tiên**. Nếu ID mô hình bao gồm `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw sẽ phân giải đầu vào trước tiên như một bí danh, sau đó
  như một khớp nhà cung cấp đã cấu hình duy nhất cho id mô hình chính xác đó, và chỉ sau đó
  mới dự phòng về nhà cung cấp mặc định đã cấu hình kèm cảnh báo ngừng hỗ trợ.
  Nếu nhà cung cấp đó không còn công bố mô hình mặc định đã cấu hình, OpenClaw
  dự phòng về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị
  mặc định nhà cung cấp đã bị loại bỏ và lỗi thời.
- `models status` có thể hiển thị `marker(<value>)` trong đầu ra xác thực cho các placeholder không phải bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) thay vì che chúng như bí mật.

### Quét mô hình

`models scan` đọc catalog `:free` công khai của OpenRouter và xếp hạng ứng viên cho
mục đích dùng làm dự phòng. Bản thân catalog là công khai, nên các lần quét chỉ siêu dữ liệu không cần
khóa OpenRouter.

Theo mặc định, OpenClaw cố kiểm tra hỗ trợ công cụ và hình ảnh bằng các lệnh gọi mô hình trực tiếp.
Nếu chưa cấu hình khóa OpenRouter, lệnh sẽ dự phòng về đầu ra chỉ siêu dữ liệu
và giải thích rằng các mô hình `:free` vẫn yêu cầu `OPENROUTER_API_KEY` cho
kiểm tra và suy luận.

Tùy chọn:

- `--no-probe` (chỉ siêu dữ liệu; không tra cứu cấu hình/bí mật)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (thời gian chờ yêu cầu catalog và từng lần kiểm tra)
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
- `--check` (thoát 1=đã hết hạn/thiếu, 2=sắp hết hạn)
- `--probe` (kiểm tra trực tiếp các hồ sơ xác thực đã cấu hình)
- `--probe-provider <name>` (kiểm tra một nhà cung cấp)
- `--probe-profile <id>` (lặp lại hoặc các id hồ sơ phân tách bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` giữ stdout dành riêng cho payload JSON. Chẩn đoán hồ sơ xác thực, nhà cung cấp
và khởi động được chuyển đến stderr để script có thể pipe stdout trực tiếp
vào các công cụ như `jq`.

Các nhóm trạng thái kiểm tra:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Các trường hợp chi tiết/mã lý do kiểm tra nên dự kiến:

- `excluded_by_auth_order`: một hồ sơ đã lưu tồn tại, nhưng
  `auth.order.<provider>` rõ ràng đã bỏ qua nó, nên phép kiểm tra báo cáo việc loại trừ thay vì
  thử hồ sơ đó.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  hồ sơ hiện diện nhưng không đủ điều kiện/không thể phân giải.
- `no_model`: xác thực nhà cung cấp tồn tại, nhưng OpenClaw không thể phân giải một
  ứng viên mô hình có thể kiểm tra cho nhà cung cấp đó.

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

`models auth add` là trình trợ giúp xác thực tương tác. Nó có thể khởi chạy luồng xác thực
nhà cung cấp (OAuth/API key) hoặc hướng dẫn bạn dán token thủ công, tùy vào
nhà cung cấp bạn chọn.

`models auth list` liệt kê các hồ sơ xác thực đã lưu cho agent được chọn mà không
in token, API-key hoặc vật liệu bí mật OAuth. Dùng `--provider <id>` để
lọc theo một nhà cung cấp, chẳng hạn `openai-codex`, và `--json` để viết script.

`models auth login` chạy luồng xác thực của Plugin nhà cung cấp (OAuth/API key). Dùng
`openclaw plugins list` để xem nhà cung cấp nào đã được cài đặt.
Dùng `openclaw models auth --agent <id> <subcommand>` để ghi kết quả xác thực vào
kho agent đã cấu hình cụ thể. Cờ cha `--agent` được tôn trọng bởi
`add`, `list`, `login`, `setup-token`, `paste-token` và
`login-github-copilot`.

Ví dụ:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

Ghi chú:

- `setup-token` và `paste-token` vẫn là các lệnh token chung cho những nhà cung cấp
  công bố phương thức xác thực bằng token.
- `setup-token` yêu cầu TTY tương tác và chạy phương thức xác thực bằng token của nhà cung cấp
  (mặc định là phương thức `setup-token` của nhà cung cấp đó khi nhà cung cấp công bố
  một phương thức như vậy).
- `paste-token` chấp nhận chuỗi token được tạo ở nơi khác hoặc từ tự động hóa.
- `paste-token` yêu cầu `--provider`, nhắc nhập giá trị token và ghi
  nó vào id hồ sơ mặc định `<provider>:manual` trừ khi bạn truyền
  `--profile-id`.
- `paste-token --expires-in <duration>` lưu thời điểm hết hạn token tuyệt đối từ một
  khoảng thời gian tương đối như `365d` hoặc `12h`.
- Ghi chú về Anthropic: nhân viên Anthropic đã nói với chúng tôi rằng việc sử dụng Claude CLI kiểu OpenClaw đã được cho phép trở lại, nên OpenClaw coi việc tái sử dụng Claude CLI và sử dụng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới.
- Anthropic `setup-token` / `paste-token` vẫn có sẵn như một đường token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
