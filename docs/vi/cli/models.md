---
read_when:
    - Bạn muốn thay đổi các mô hình mặc định hoặc xem trạng thái xác thực của nhà cung cấp
    - Bạn muốn quét các mô hình/nhà cung cấp hiện có và gỡ lỗi các hồ sơ xác thực
summary: Tham chiếu CLI cho `openclaw models` (trạng thái/danh sách/thiết lập/quét, bí danh, phương án dự phòng, xác thực)
title: Mô hình
x-i18n:
    generated_at: "2026-07-16T14:16:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 330598225664ff961ab41bf6358226ad64eb43e941be7f422cfde0fe9d93cea8
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

Khám phá, quét và cấu hình mô hình (mô hình mặc định, phương án dự phòng, hồ sơ xác thực).

Liên quan:

- Nhà cung cấp + mô hình: [Mô hình](/vi/providers/models)
- Các khái niệm về lựa chọn mô hình + lệnh gạch chéo `/models`: [Khái niệm mô hình](/vi/concepts/models)
- Thiết lập xác thực nhà cung cấp: [Bắt đầu](/vi/start/getting-started)

## Các lệnh thường dùng

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
openclaw models scan
```

Các lệnh con `status` và `auth` chấp nhận `--agent <id>` để nhắm đến một tác nhân đã cấu hình; `list`, `scan`, `aliases` và `fallbacks`/`image-fallbacks` luôn sử dụng tác nhân mặc định đã cấu hình, còn `set`/`set-image` từ chối hoàn toàn `--agent`. Khi bị bỏ qua, các lệnh có nhận biết `--agent` sẽ sử dụng `OPENCLAW_AGENT_DIR` nếu được đặt, nếu không sẽ sử dụng tác nhân mặc định đã cấu hình.

### Trạng thái

`openclaw models status` hiển thị mô hình mặc định/phương án dự phòng đã phân giải cùng với thông tin tổng quan về xác thực. Khi có ảnh chụp nhanh về mức sử dụng của nhà cung cấp, phần trạng thái OAuth/khóa API sẽ bao gồm các khoảng thời gian sử dụng và ảnh chụp nhanh hạn ngạch của nhà cung cấp. Các nhà cung cấp hiện có khoảng thời gian sử dụng: Anthropic, GitHub Copilot, Gemini CLI, OpenAI, MiniMax, Xiaomi và z.ai. Thông tin xác thực sử dụng đến từ các hook dành riêng cho nhà cung cấp khi có; nếu không, OpenClaw sẽ chuyển sang đối chiếu thông tin đăng nhập OAuth/khóa API từ hồ sơ xác thực, biến môi trường hoặc cấu hình.

Trong đầu ra `--json`, `auth.providers` là phần tổng quan về nhà cung cấp có nhận biết biến môi trường/cấu hình/kho lưu trữ, còn `auth.oauth` chỉ là tình trạng của hồ sơ trong kho xác thực.

Tùy chọn:

| Cờ                        | Tác dụng                                                                                                      |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `--json`                  | Đầu ra JSON; chẩn đoán hồ sơ xác thực, nhà cung cấp và khởi động được gửi đến stderr để stdout vẫn có thể chuyển qua pipe vào `jq`. |
| `--plain`                 | Đầu ra văn bản thuần túy.                                                                                     |
| `--check`                 | Thoát với mã khác 0 nếu xác thực sắp hết hạn/đã hết hạn: `1` = đã hết hạn/thiếu, `2` = sắp hết hạn.              |
| `--probe`                 | Thăm dò trực tiếp các hồ sơ xác thực đã cấu hình. Gửi yêu cầu thật; có thể tiêu thụ token và kích hoạt giới hạn tốc độ. |
| `--probe-provider <name>` | Chỉ thăm dò một nhà cung cấp.                                                                                 |
| `--probe-profile <id>`    | Thăm dò các ID hồ sơ xác thực cụ thể (lặp lại hoặc phân tách bằng dấu phẩy).                                   |
| `--probe-timeout <ms>`    | Thời gian chờ cho mỗi lần thăm dò.                                                                            |
| `--probe-concurrency <n>` | Số lần thăm dò đồng thời.                                                                                     |
| `--probe-max-tokens <n>`  | Số token tối đa cho lần thăm dò (nỗ lực tối đa).                                                              |
| `--agent <id>`            | ID tác nhân đã cấu hình; ghi đè `OPENCLAW_AGENT_DIR`.                                                           |

Các hàng thăm dò có thể đến từ hồ sơ xác thực, thông tin đăng nhập trong biến môi trường hoặc `models.json`. Các nhóm trạng thái thăm dò: `ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`.

Các mã chi tiết/lý do thăm dò có thể xuất hiện khi một lần thăm dò không bao giờ tiến đến bước gọi mô hình:

- `excluded_by_auth_order`: có một hồ sơ đã lưu trữ, nhưng `auth.order.<provider>` tường minh đã bỏ qua hồ sơ đó, vì vậy lần thăm dò báo cáo việc loại trừ thay vì thử hồ sơ.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`: hồ sơ tồn tại nhưng không đủ điều kiện hoặc không thể phân giải.
- `ineligible_profile`: hồ sơ không tương thích với cấu hình nhà cung cấp vì một lý do khác.
- `no_model`: có xác thực của nhà cung cấp, nhưng OpenClaw không thể phân giải một ứng viên mô hình có thể thăm dò cho nhà cung cấp đó.

Để khắc phục sự cố OAuth của OpenAI ChatGPT/Codex, `openclaw models status`, `openclaw models auth list --provider openai` và `openclaw config get agents.defaults.model --json` là cách nhanh nhất để xác nhận liệu một tác nhân có hồ sơ OAuth `openai` khả dụng cho `openai/*` thông qua runtime Codex gốc hay không. Xem [thiết lập nhà cung cấp OpenAI](/vi/providers/openai#check-and-recover-codex-oauth-routing).

### Danh sách

`openclaw models list` ở chế độ chỉ đọc: lệnh đọc cấu hình, hồ sơ xác thực, trạng thái danh mục hiện có và các hàng danh mục do nhà cung cấp sở hữu, nhưng không bao giờ ghi lại `models.json`.

Tùy chọn: `--all` (danh mục đầy đủ), `--local` (chỉ lọc các mô hình cục bộ), `--provider <id>`, `--json`, `--plain`.

Lưu ý:

- Cột `Auth` ở chế độ chỉ đọc. Đối với các tuyến mô hình do nhà cung cấp sở hữu như OpenAI, cột này đối chiếu tuyến API/URL cơ sở của từng hàng với các hồ sơ đủ điều kiện trong `auth.order` có hiệu lực, thông tin đăng nhập từ biến môi trường/cấu hình và các SecretRef trong phạm vi lệnh đã phân giải. Một hàng OpenAI cụ thể vẫn ở trạng thái không xác định khi không có chính sách tuyến của hàng đó, thay vì mượn xác thực cấp nhà cung cấp; các kiểm tra cũ chỉ ở cấp nhà cung cấp và các nhà cung cấp khác vẫn giữ hành vi cấp nhà cung cấp. Siêu dữ liệu xác thực tổng hợp của Plugin chỉ là gợi ý về khả năng runtime, không phải bằng chứng về xác thực tài khoản gốc, vì vậy các tuyến phụ thuộc vào tài khoản vẫn ở trạng thái không xác định nếu không có bằng chứng xác thực từ sổ đăng ký. Lệnh này không tải runtime của nhà cung cấp, đọc thông tin bí mật trong chuỗi khóa, gọi API của nhà cung cấp hoặc chứng minh khả năng sẵn sàng thực thi chính xác.
- `models list --all --provider <id>` có thể bao gồm các hàng danh mục tĩnh do nhà cung cấp sở hữu từ tệp kê khai Plugin hoặc siêu dữ liệu danh mục nhà cung cấp đi kèm, ngay cả khi bạn chưa xác thực với nhà cung cấp đó. Các hàng này vẫn hiển thị là không khả dụng cho đến khi cấu hình xác thực phù hợp.
- `models list` duy trì khả năng phản hồi của mặt phẳng điều khiển khi quá trình khám phá danh mục nhà cung cấp diễn ra chậm. Các chế độ xem mặc định và đã cấu hình sẽ chuyển sang các hàng mô hình đã cấu hình hoặc tổng hợp sau một khoảng chờ ngắn và để quá trình khám phá hoàn tất trong nền. Sử dụng `--all` khi cần danh mục đầy đủ đã khám phá một cách chính xác và sẵn sàng chờ quá trình khám phá nhà cung cấp.
- `models list --all` phạm vi rộng hợp nhất các hàng danh mục trong tệp kê khai lên trên các hàng trong sổ đăng ký mà không tải các hook bổ sung runtime của nhà cung cấp. Các đường dẫn nhanh của tệp kê khai được lọc theo nhà cung cấp chỉ sử dụng các nhà cung cấp được đánh dấu `static`; các nhà cung cấp được đánh dấu `refreshable` vẫn dựa trên sổ đăng ký/bộ nhớ đệm và bổ sung các hàng trong tệp kê khai, còn các nhà cung cấp được đánh dấu `runtime` vẫn sử dụng quá trình khám phá qua sổ đăng ký/runtime.
- `models list` giữ riêng biệt siêu dữ liệu mô hình gốc và các giới hạn runtime. Trong đầu ra dạng bảng, `Ctx` hiển thị `contextTokens/contextWindow` khi giới hạn runtime có hiệu lực khác với cửa sổ ngữ cảnh gốc; các hàng JSON bao gồm `contextTokens` khi nhà cung cấp công khai giới hạn đó.
- Đối với các tuyến do nhà cung cấp sở hữu, `models list` ánh xạ một hàng nhà cung cấp/mô hình logic lên tuyến đã chọn. `Input` và `Ctx` chỉ đến từ một hàng danh mục tuyến vật lý khớp chính xác, với các ghi đè logic được cấu hình tường minh áp dụng sau cùng; khi không phân giải được lựa chọn tuyến, các trường khả năng sẽ hiển thị là không xác định thay vì mượn siêu dữ liệu của tuyến cùng cấp.
- `models list --provider <id>` lọc theo ID nhà cung cấp, chẳng hạn như `moonshot` hoặc `openai`. Tùy chọn này không chấp nhận các nhãn hiển thị từ bộ chọn nhà cung cấp tương tác, chẳng hạn như `Moonshot AI`.
- Tham chiếu mô hình được phân tích bằng cách tách tại `/` **đầu tiên**. Nếu ID mô hình bao gồm `/` (kiểu OpenRouter), hãy bao gồm tiền tố nhà cung cấp (ví dụ: `openrouter/moonshotai/kimi-k2`).
- Nếu bỏ qua nhà cung cấp, trước tiên OpenClaw phân giải đầu vào dưới dạng bí danh, sau đó dưới dạng kết quả khớp duy nhất với nhà cung cấp đã cấu hình cho chính xác ID mô hình đó, và chỉ sau đó mới chuyển sang nhà cung cấp mặc định đã cấu hình kèm cảnh báo ngừng hỗ trợ. Nếu nhà cung cấp đó không còn công khai mô hình mặc định đã cấu hình, OpenClaw sẽ chuyển sang nhà cung cấp/mô hình đầu tiên đã cấu hình thay vì hiển thị một giá trị mặc định cũ của nhà cung cấp đã bị xóa.
- `models status` có thể hiển thị `marker(<value>)` trong đầu ra xác thực cho các phần giữ chỗ không phải thông tin bí mật (ví dụ `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) thay vì che chúng như thông tin bí mật.

### Đặt mô hình mặc định / mô hình hình ảnh

```bash
openclaw models set <model-or-alias>
openclaw models set-image <model-or-alias>
```

`set` ghi `agents.defaults.model.primary`; `set-image` ghi `agents.defaults.imageModel.primary`. Cả hai chấp nhận `provider/model` hoặc một bí danh đã cấu hình. `set` cũng sửa chữa các bản cài đặt Plugin runtime Codex/Copilot khi mô hình mới được chọn cần một Plugin; `set-image` thì không. Cả hai lệnh đều không chấp nhận `--agent`; chúng luôn ghi các giá trị mặc định của tác nhân.

### Quét

`models scan` đọc danh mục `:free` công khai của OpenRouter và xếp hạng các ứng viên để sử dụng làm phương án dự phòng. Bản thân danh mục là công khai, vì vậy các lần quét chỉ lấy siêu dữ liệu không cần khóa OpenRouter.

Theo mặc định, OpenClaw cố gắng thăm dò khả năng hỗ trợ công cụ và hình ảnh bằng các lệnh gọi mô hình trực tiếp. Nếu chưa cấu hình khóa OpenRouter, lệnh sẽ chuyển sang đầu ra chỉ có siêu dữ liệu và giải thích rằng các mô hình `:free` vẫn yêu cầu `OPENROUTER_API_KEY` để thăm dò và suy luận.

Tùy chọn:

- `--no-probe` (chỉ siêu dữ liệu; không tra cứu cấu hình/thông tin bí mật)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (thời gian chờ cho yêu cầu danh mục và mỗi lần thăm dò)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` và `--set-image` yêu cầu thăm dò trực tiếp; kết quả quét chỉ có siêu dữ liệu chỉ mang tính cung cấp thông tin và không được áp dụng vào cấu hình.

## Bí danh

```bash
openclaw models aliases list [--json] [--plain]
openclaw models aliases add <alias> <model-or-alias>
openclaw models aliases remove <alias>
```

Bí danh được lưu trữ theo từng mục mô hình dưới dạng `agents.defaults.models.<key>.alias`. Trước tiên, `add` phân giải `<model-or-alias>` thành khóa nhà cung cấp/mô hình chuẩn, vì vậy việc đặt bí danh cho một bí danh sẽ trỏ lại bí danh đó thay vì tạo chuỗi.

## Phương án dự phòng

```bash
openclaw models fallbacks list [--json] [--plain]
openclaw models fallbacks add <model-or-alias>
openclaw models fallbacks remove <model-or-alias>
openclaw models fallbacks clear
```

Quản lý `agents.defaults.model.fallbacks`. `openclaw models image-fallbacks list|add|remove|clear` quản lý danh sách `agents.defaults.imageModel.fallbacks` song song với cùng cấu trúc lệnh con.

## Hồ sơ xác thực

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth login --provider openai --profile-id openai:work
openclaw models auth login-github-copilot
openclaw models auth paste-api-key --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token --provider <id>
openclaw models auth order get --provider <id>
openclaw models auth order set --provider <id> <profileIds...>
openclaw models auth order clear --provider <id>
```

`models auth add` là trình trợ giúp xác thực tương tác. Tùy thuộc vào nhà cung cấp được chọn, trình này có thể khởi chạy luồng xác thực của nhà cung cấp (OAuth/khóa API) hoặc hướng dẫn bạn dán token theo cách thủ công.

`models auth list` liệt kê các hồ sơ xác thực đã lưu cho tác nhân được chọn mà không hiển thị token, khóa API hoặc dữ liệu bí mật OAuth. Dùng `--provider <id>` để lọc theo một nhà cung cấp, chẳng hạn như `openai`, và dùng `--json` cho việc viết tập lệnh.

`models auth login` chạy quy trình xác thực của Plugin nhà cung cấp (OAuth/khóa API). Dùng `openclaw plugins list` để xem những nhà cung cấp nào đã được cài đặt. `login` chấp nhận `--profile-id <id>` đối với các nhà cung cấp hỗ trợ hồ sơ có tên trong khi đăng nhập (dùng tùy chọn này để tách riêng nhiều lần đăng nhập cho cùng một nhà cung cấp), `--method <id>` để chọn một phương thức xác thực cụ thể, `--device-code` làm lối tắt cho `--method device-code`, `--set-default` để áp dụng mô hình mặc định do nhà cung cấp đề xuất và `--force` để xóa các hồ sơ hiện có của nhà cung cấp đó trước (dùng khi hồ sơ OAuth trong bộ nhớ đệm bị kẹt hoặc khi bạn muốn chuyển tài khoản).

`models auth login-github-copilot` là lối tắt cho `models auth login --provider github-copilot --method device` (luồng thiết bị GitHub); lệnh này chấp nhận `--yes` để ghi đè hồ sơ hiện có mà không hỏi xác nhận.

Dùng `openclaw models auth --agent <id> <subcommand>` để ghi kết quả xác thực vào kho lưu trữ của một tác nhân đã cấu hình cụ thể. Cờ `--agent` cấp cha được `add`, `list`, `login`, `paste-api-key`, `setup-token`, `paste-token`, `login-github-copilot` và `order get`/`set`/`clear` tuân thủ.

Đối với các mô hình OpenAI, `--provider openai` mặc định sử dụng đăng nhập tài khoản ChatGPT/Codex. Chỉ dùng `--method api-key` khi bạn muốn thêm hồ sơ khóa API OpenAI, thường để dự phòng khi đạt giới hạn gói đăng ký Codex. Chạy `openclaw doctor --fix` để di chuyển trạng thái xác thực/hồ sơ dùng tiền tố OpenAI Codex cũ sang `openai`.

Ví dụ:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth paste-api-key --provider openai
openclaw models auth list --provider openai
```

Lưu ý:

- `paste-api-key` chấp nhận các khóa API được tạo ở nơi khác, nhắc nhập giá trị khóa và ghi khóa vào mã định danh hồ sơ mặc định `<provider>:manual`, trừ khi bạn truyền `--profile-id`. Trong quy trình tự động hóa, hãy chuyển khóa qua stdin, ví dụ `printf "%s\n" "$OPENAI_API_KEY" | openclaw models auth paste-api-key --provider openai`.
- `setup-token` và `paste-token` vẫn là các lệnh token dùng chung cho những nhà cung cấp cung cấp phương thức xác thực bằng token.
- `setup-token` yêu cầu TTY tương tác và chạy phương thức xác thực bằng token của nhà cung cấp (mặc định dùng phương thức `setup-token` của nhà cung cấp đó khi có).
- `paste-token` yêu cầu `--provider`, mặc định nhắc nhập giá trị token và ghi token vào mã định danh hồ sơ mặc định `<provider>:manual`, trừ khi bạn truyền `--profile-id`. Trong quy trình tự động hóa, hãy chuyển token qua stdin thay vì truyền dưới dạng đối số để thông tin xác thực của nhà cung cấp không xuất hiện trong lịch sử shell hoặc danh sách tiến trình.
- `paste-token --expires-in <duration>` lưu thời điểm hết hạn tuyệt đối của token từ một khoảng thời gian tương đối như `365d` hoặc `12h`.
- Đối với `openai`, khóa API OpenAI và dữ liệu token ChatGPT/OAuth có cấu trúc xác thực khác nhau. Dùng `paste-api-key` cho khóa API OpenAI `sk-...` và chỉ dùng `paste-token` cho dữ liệu xác thực bằng token.
- Anthropic: `setup-token`/`paste-token` là các phương thức xác thực OpenClaw được hỗ trợ cho `anthropic`, nhưng OpenClaw ưu tiên tái sử dụng Claude CLI (`claude -p`) trên máy chủ khi có sẵn.
- `auth order get/set/clear` quản lý tùy chỉnh thứ tự hồ sơ xác thực theo từng tác nhân cho một nhà cung cấp, được lưu trong `auth-state.json` (tách biệt với khóa cấu hình `auth.order.<provider>`). `set` nhận một hoặc nhiều mã định danh hồ sơ theo thứ tự ưu tiên; `clear` quay về thứ tự từ cấu hình/luân phiên vòng tròn.

## Liên quan

- [Tham chiếu CLI](/vi/cli)
- [Lựa chọn mô hình](/vi/concepts/model-providers)
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover)
