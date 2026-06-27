---
read_when:
    - Bạn muốn thay đổi mô hình mặc định hoặc xem trạng thái xác thực của nhà cung cấp
    - Bạn muốn quét các mô hình/nhà cung cấp hiện có và gỡ lỗi hồ sơ xác thực
summary: Tham chiếu CLI cho `openclaw models` (status/list/set/scan, bí danh, phương án dự phòng, xác thực)
title: Mô hình
x-i18n:
    generated_at: "2026-06-27T17:18:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15d0a01e0f8f971996359413306a1c694e5a787eaef69b13eb8ac63c2a7c8990
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Khám phá, quét và cấu hình mô hình (mô hình mặc định, phương án dự phòng, hồ sơ xác thực).

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

`openclaw models status` hiển thị mặc định/phương án dự phòng đã phân giải cùng tổng quan xác thực.
Khi có ảnh chụp nhanh mức sử dụng nhà cung cấp, phần trạng thái OAuth/khóa API bao gồm
cửa sổ mức sử dụng nhà cung cấp và ảnh chụp nhanh hạn mức.
Các nhà cung cấp có cửa sổ mức sử dụng hiện tại: Anthropic, GitHub Copilot, Gemini CLI, OpenAI,
MiniMax, Xiaomi và z.ai. Xác thực mức sử dụng đến từ các hook dành riêng cho nhà cung cấp
khi có; nếu không, OpenClaw quay về dùng thông tin đăng nhập OAuth/khóa API khớp
từ hồ sơ xác thực, env hoặc cấu hình.
Trong đầu ra `--json`, `auth.providers` là tổng quan nhà cung cấp có nhận biết env/cấu hình/kho lưu trữ,
trong khi `auth.oauth` chỉ là tình trạng hồ sơ trong kho xác thực.
Thêm `--probe` để chạy kiểm tra xác thực trực tiếp với từng hồ sơ nhà cung cấp đã cấu hình.
Các kiểm tra là yêu cầu thật (có thể tiêu thụ token và kích hoạt giới hạn tốc độ).
Dùng `--agent <id>` để kiểm tra trạng thái mô hình/xác thực của một agent đã cấu hình. Khi bị bỏ qua,
lệnh dùng `OPENCLAW_AGENT_DIR` nếu được đặt, nếu không thì dùng
agent mặc định đã cấu hình.
Các hàng kiểm tra có thể đến từ hồ sơ xác thực, thông tin đăng nhập env hoặc `models.json`.
Để xử lý sự cố OAuth OpenAI ChatGPT/Codex, `openclaw models status`,
`openclaw models auth list --provider openai` và
`openclaw config get agents.defaults.model --json` là cách nhanh nhất để
xác nhận liệu một agent có hồ sơ OAuth `openai` dùng được cho
`openai/*` thông qua thời gian chạy Codex gốc hay không. Xem [Thiết lập nhà cung cấp OpenAI](/vi/providers/openai#check-and-recover-codex-oauth-routing).

Ghi chú:

- `models set <model-or-alias>` chấp nhận `provider/model` hoặc bí danh.
- `models list` chỉ đọc: lệnh đọc cấu hình, hồ sơ xác thực, trạng thái catalog hiện có
  và các hàng catalog do nhà cung cấp sở hữu, nhưng không ghi lại
  `models.json`.
- Cột `Auth` ở cấp nhà cung cấp và chỉ đọc. Cột này được tính từ siêu dữ liệu
  hồ sơ xác thực cục bộ, dấu hiệu env, khóa nhà cung cấp đã cấu hình, dấu hiệu
  nhà cung cấp cục bộ, dấu hiệu env/hồ sơ AWS Bedrock và siêu dữ liệu xác thực tổng hợp của Plugin;
  cột này không tải thời gian chạy nhà cung cấp, đọc bí mật keychain, gọi
  API nhà cung cấp hoặc chứng minh chính xác khả năng sẵn sàng thực thi theo từng mô hình.
- `models list --all --provider <id>` có thể bao gồm các hàng catalog tĩnh do nhà cung cấp sở hữu
  từ manifest Plugin hoặc siêu dữ liệu catalog nhà cung cấp đi kèm ngay cả khi bạn
  chưa xác thực với nhà cung cấp đó. Các hàng đó vẫn hiển thị là
  không khả dụng cho đến khi cấu hình xác thực khớp.
- `models list` giữ cho mặt phẳng điều khiển phản hồi nhanh khi quá trình
  khám phá catalog nhà cung cấp chậm. Các chế độ xem mặc định và đã cấu hình quay về
  dùng hàng mô hình đã cấu hình hoặc tổng hợp sau một khoảng chờ ngắn và để quá trình khám phá hoàn tất trong
  nền. Dùng `--all` khi bạn cần catalog đã khám phá đầy đủ chính xác và
  sẵn sàng chờ quá trình khám phá nhà cung cấp.
- `models list --all` phạm vi rộng hợp nhất các hàng catalog manifest lên trên các hàng registry
  mà không tải hook bổ sung thời gian chạy nhà cung cấp. Các đường nhanh manifest được lọc theo nhà cung cấp
  chỉ dùng những nhà cung cấp được đánh dấu `static`; nhà cung cấp được đánh dấu `refreshable`
  vẫn dựa trên registry/cache và thêm hàng manifest làm phần bổ sung, trong khi
  nhà cung cấp được đánh dấu `runtime` vẫn dùng khám phá registry/runtime.
- `models list` giữ siêu dữ liệu mô hình gốc và giới hạn thời gian chạy tách biệt. Trong đầu ra bảng,
  `Ctx` hiển thị `contextTokens/contextWindow` khi giới hạn thời gian chạy hiệu dụng
  khác với cửa sổ ngữ cảnh gốc; các hàng JSON bao gồm `contextTokens`
  khi một nhà cung cấp công bố giới hạn đó.
- `models list --provider <id>` lọc theo id nhà cung cấp, chẳng hạn `moonshot` hoặc
  `openai`. Lệnh không chấp nhận nhãn hiển thị từ bộ chọn nhà cung cấp tương tác,
  chẳng hạn `Moonshot AI`.
- Tham chiếu mô hình được phân tích bằng cách tách theo dấu `/` **đầu tiên**. Nếu ID mô hình bao gồm `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bạn bỏ qua nhà cung cấp, OpenClaw phân giải đầu vào như một bí danh trước, sau đó
  như một kết quả khớp nhà cung cấp đã cấu hình duy nhất cho đúng id mô hình đó, và chỉ sau đó
  mới quay về nhà cung cấp mặc định đã cấu hình với cảnh báo ngừng dùng.
  Nếu nhà cung cấp đó không còn công bố mô hình mặc định đã cấu hình, OpenClaw
  quay về nhà cung cấp/mô hình đã cấu hình đầu tiên thay vì hiển thị một
  mặc định nhà cung cấp đã bị gỡ bỏ đã lỗi thời.
- `models status` có thể hiển thị `marker(<value>)` trong đầu ra xác thực cho các phần giữ chỗ không bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) thay vì che chúng như bí mật.

### Quét mô hình

`models scan` đọc catalog `:free` công khai của OpenRouter và xếp hạng ứng viên cho
mục đích dùng làm phương án dự phòng. Bản thân catalog là công khai, nên các lần quét chỉ siêu dữ liệu không cần
khóa OpenRouter.

Theo mặc định, OpenClaw cố kiểm tra hỗ trợ công cụ và hình ảnh bằng các lệnh gọi mô hình trực tiếp.
Nếu chưa cấu hình khóa OpenRouter, lệnh quay về đầu ra chỉ siêu dữ liệu
và giải thích rằng các mô hình `:free` vẫn cần `OPENROUTER_API_KEY` cho
kiểm tra và suy luận.

Tùy chọn:

- `--no-probe` (chỉ siêu dữ liệu; không tra cứu cấu hình/bí mật)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (thời gian chờ cho yêu cầu catalog và từng lần kiểm tra)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` và `--set-image` yêu cầu kiểm tra trực tiếp; kết quả quét
chỉ siêu dữ liệu chỉ có tính thông tin và không được áp dụng vào cấu hình.

### Trạng thái mô hình

Tùy chọn:

- `--json`
- `--plain`
- `--check` (thoát 1=hết hạn/thiếu, 2=sắp hết hạn)
- `--probe` (kiểm tra trực tiếp các hồ sơ xác thực đã cấu hình)
- `--probe-provider <name>` (kiểm tra một nhà cung cấp)
- `--probe-profile <id>` (id hồ sơ lặp lại hoặc phân tách bằng dấu phẩy)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`)

`--json` giữ stdout dành riêng cho payload JSON. Chẩn đoán hồ sơ xác thực, nhà cung cấp
và khởi động được định tuyến tới stderr để script có thể pipe stdout trực tiếp
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

Các trường hợp chi tiết/mã lý do kiểm tra có thể gặp:

- `excluded_by_auth_order`: hồ sơ đã lưu tồn tại, nhưng `auth.order.<provider>` rõ ràng
  đã bỏ qua hồ sơ đó, nên kiểm tra báo cáo việc loại trừ thay vì
  thử hồ sơ đó.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  hồ sơ có mặt nhưng không đủ điều kiện/không thể phân giải.
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
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` là trình trợ giúp xác thực tương tác. Lệnh có thể khởi chạy luồng xác thực
nhà cung cấp (OAuth/khóa API) hoặc hướng dẫn bạn dán token thủ công, tùy theo
nhà cung cấp bạn chọn.

`models auth list` liệt kê hồ sơ xác thực đã lưu cho agent đã chọn mà không
in token, khóa API hoặc nội dung bí mật OAuth. Dùng `--provider <id>` để
lọc theo một nhà cung cấp, chẳng hạn `openai`, và `--json` cho scripting.

`models auth login` chạy luồng xác thực của Plugin nhà cung cấp (OAuth/khóa API). Dùng
`openclaw plugins list` để xem nhà cung cấp nào đã được cài đặt.
Dùng `openclaw models auth --agent <id> <subcommand>` để ghi kết quả xác thực vào một
kho agent đã cấu hình cụ thể. Cờ cha `--agent` được tôn trọng bởi
`add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token` và
`login-github-copilot`.

Đối với mô hình OpenAI, `--provider openai` mặc định dùng đăng nhập tài khoản ChatGPT/Codex.
Chỉ dùng `--method api-key` khi bạn muốn thêm hồ sơ khóa API OpenAI,
thường là bản dự phòng cho giới hạn đăng ký Codex. Chạy `openclaw doctor --fix`
để di chuyển trạng thái xác thực/hồ sơ tiền tố OpenAI Codex kế thừa cũ sang `openai`.

Ví dụ:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Ghi chú:

- `login` chấp nhận `--profile-id <id>` cho các nhà cung cấp hỗ trợ hồ sơ
  có tên trong lúc đăng nhập. Dùng tùy chọn này để giữ nhiều lần đăng nhập cho cùng một
  nhà cung cấp tách biệt.
- `paste-api-key` chấp nhận khóa API được tạo ở nơi khác, nhắc nhập giá trị khóa
  và ghi khóa đó vào id hồ sơ mặc định `<provider>:manual` trừ khi bạn
  truyền `--profile-id`. Trong tự động hóa, pipe khóa qua stdin, ví dụ
  `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` và `paste-token` vẫn là các lệnh token chung cho nhà cung cấp
  công bố phương thức xác thực bằng token.
- `setup-token` yêu cầu TTY tương tác và chạy phương thức xác thực bằng token của nhà cung cấp
  (mặc định là phương thức `setup-token` của nhà cung cấp đó khi họ công bố
  một phương thức như vậy).
- `paste-token` chấp nhận chuỗi token được tạo ở nơi khác hoặc từ tự động hóa.
- `paste-token` yêu cầu `--provider`, mặc định nhắc nhập giá trị token
  và ghi token đó vào id hồ sơ mặc định `<provider>:manual` trừ khi bạn truyền
  `--profile-id`.
- Trong tự động hóa, pipe token qua stdin thay vì truyền token làm đối số để
  thông tin đăng nhập nhà cung cấp không xuất hiện trong lịch sử shell hoặc danh sách tiến trình.
- `paste-token --expires-in <duration>` lưu thời điểm hết hạn token tuyệt đối từ một
  khoảng thời gian tương đối như `365d` hoặc `12h`.
- Đối với `openai`, khóa API OpenAI và nội dung token ChatGPT/OAuth là
  các dạng xác thực khác nhau. Dùng `paste-api-key` cho khóa API OpenAI `sk-...` và
  chỉ dùng `paste-token` cho nội dung xác thực bằng token.
- Ghi chú Anthropic: nhân viên Anthropic đã cho chúng tôi biết việc sử dụng Claude CLI kiểu OpenClaw được cho phép trở lại, nên OpenClaw xem việc tái sử dụng Claude CLI và sử dụng `claude -p` là được chấp thuận cho tích hợp này trừ khi Anthropic công bố chính sách mới.
- Anthropic `setup-token` / `paste-token` vẫn có sẵn như một đường token OpenClaw được hỗ trợ, nhưng OpenClaw hiện ưu tiên tái sử dụng Claude CLI và `claude -p` khi có.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
