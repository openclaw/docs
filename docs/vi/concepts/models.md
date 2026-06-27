---
read_when:
    - Thêm hoặc sửa đổi CLI mô hình (models list/set/scan/aliases/fallbacks)
    - Thay đổi hành vi dự phòng của mô hình hoặc UX lựa chọn
    - Cập nhật các phép dò quét mô hình (công cụ/hình ảnh)
sidebarTitle: Models CLI
summary: 'CLI mô hình: liệt kê, đặt, bí danh, phương án dự phòng, quét, trạng thái'
title: CLI mô hình
x-i18n:
    generated_at: "2026-06-27T17:24:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Chuyển đổi dự phòng mô hình" href="/vi/concepts/model-failover">
    Xoay vòng hồ sơ xác thực, thời gian chờ hồi phục, và cách chúng tương tác với các phương án dự phòng.
  </Card>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers">
    Tổng quan nhanh về nhà cung cấp và ví dụ.
  </Card>
  <Card title="Runtime tác tử" href="/vi/concepts/agent-runtimes">
    OpenClaw, Codex, và các runtime vòng lặp tác tử khác.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults">
    Khóa cấu hình mô hình.
  </Card>
</CardGroup>

Tham chiếu mô hình chọn một nhà cung cấp và mô hình. Chúng thường không chọn runtime tác tử cấp thấp. Tham chiếu tác tử OpenAI là ngoại lệ chính: `openai/gpt-5.5` chạy qua runtime máy chủ ứng dụng Codex theo mặc định trên nhà cung cấp OpenAI chính thức. Tham chiếu Copilot đăng ký (`github-copilot/*`) cũng có thể được chọn dùng Plugin runtime tác tử GitHub Copilot bên ngoài — đường dẫn đó luôn tường minh (không có dự phòng `auto`). Ghi đè runtime tường minh thuộc về chính sách nhà cung cấp/mô hình, không phải toàn bộ tác tử hoặc phiên. Ở chế độ runtime Codex, tham chiếu `openai/gpt-*` không hàm ý tính phí bằng khóa API; xác thực có thể đến từ tài khoản Codex hoặc hồ sơ OAuth `openai`. Xem [Runtime tác tử](/vi/concepts/agent-runtimes) và [Runtime tác tử GitHub Copilot](/vi/plugins/copilot).

## Cách chọn mô hình hoạt động

OpenClaw chọn mô hình theo thứ tự này:

<Steps>
  <Step title="Mô hình chính">
    `agents.defaults.model.primary` (hoặc `agents.defaults.model`).
  </Step>
  <Step title="Dự phòng">
    `agents.defaults.model.fallbacks` (theo thứ tự).
  </Step>
  <Step title="Chuyển đổi dự phòng xác thực nhà cung cấp">
    Chuyển đổi dự phòng xác thực diễn ra bên trong một nhà cung cấp trước khi chuyển sang mô hình tiếp theo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Các bề mặt mô hình liên quan">
    - `agents.defaults.models` là danh sách cho phép/danh mục các mô hình OpenClaw có thể dùng (cộng với bí danh). Dùng các mục `provider/*` để giới hạn nhà cung cấp hiển thị trong khi vẫn giữ khám phá nhà cung cấp động.
    - `agents.defaults.imageModel` được dùng **chỉ khi** mô hình chính không thể nhận hình ảnh.
    - `agents.defaults.pdfModel` được công cụ `pdf` dùng. Nếu bỏ qua, công cụ sẽ quay về `agents.defaults.imageModel`, rồi mô hình phiên/mặc định đã phân giải.
    - `agents.defaults.imageGenerationModel` được năng lực tạo ảnh dùng chung sử dụng. Nếu bỏ qua, `image_generate` vẫn có thể suy ra mặc định nhà cung cấp có xác thực hỗ trợ. Nó thử nhà cung cấp mặc định hiện tại trước, rồi các nhà cung cấp tạo ảnh đã đăng ký còn lại theo thứ tự provider-id. Nếu bạn đặt một nhà cung cấp/mô hình cụ thể, hãy cấu hình cả xác thực/khóa API của nhà cung cấp đó.
    - `agents.defaults.musicGenerationModel` được năng lực tạo nhạc dùng chung sử dụng. Nếu bỏ qua, `music_generate` vẫn có thể suy ra mặc định nhà cung cấp có xác thực hỗ trợ. Nó thử nhà cung cấp mặc định hiện tại trước, rồi các nhà cung cấp tạo nhạc đã đăng ký còn lại theo thứ tự provider-id. Nếu bạn đặt một nhà cung cấp/mô hình cụ thể, hãy cấu hình cả xác thực/khóa API của nhà cung cấp đó.
    - `agents.defaults.videoGenerationModel` được năng lực tạo video dùng chung sử dụng. Nếu bỏ qua, `video_generate` vẫn có thể suy ra mặc định nhà cung cấp có xác thực hỗ trợ. Nó thử nhà cung cấp mặc định hiện tại trước, rồi các nhà cung cấp tạo video đã đăng ký còn lại theo thứ tự provider-id. Nếu bạn đặt một nhà cung cấp/mô hình cụ thể, hãy cấu hình cả xác thực/khóa API của nhà cung cấp đó.
    - Mặc định theo tác tử có thể ghi đè `agents.defaults.model` qua `agents.list[].model` cộng với bindings (xem [Định tuyến đa tác tử](/vi/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Nguồn lựa chọn và hành vi dự phòng

Cùng một `provider/model` có thể mang ý nghĩa khác nhau tùy nơi nó đến từ:

- Mặc định đã cấu hình (`agents.defaults.model.primary` và mô hình chính riêng cho tác tử) là điểm bắt đầu thông thường và dùng `agents.defaults.model.fallbacks`.
- Lựa chọn dự phòng tự động là trạng thái khôi phục tạm thời. Chúng được lưu với `modelOverrideSource: "auto"` để các lượt sau có thể tiếp tục dùng chuỗi dự phòng mà không thăm dò mô hình chính đã biết lỗi mỗi lần; OpenClaw định kỳ thăm dò lại mô hình chính ban đầu, xóa lựa chọn tự động khi nó khôi phục, và thông báo các chuyển tiếp dự phòng/khôi phục một lần cho mỗi lần thay đổi trạng thái.
- Lựa chọn phiên người dùng là chính xác. `/model`, bộ chọn mô hình, `session_status(model=...)`, và `sessions.patch` lưu `modelOverrideSource: "user"`; nếu nhà cung cấp/mô hình đã chọn đó không truy cập được, OpenClaw sẽ lỗi hiển thị rõ thay vì rơi tiếp sang mô hình đã cấu hình khác.
- Việc thay đổi `agents.defaults.model.primary` không ghi lại các lựa chọn phiên hiện có. Nếu trạng thái nói `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, hãy xóa lựa chọn phiên hiện tại bằng `/model default` để nó kế thừa lại mô hình chính đã cấu hình.
- Cron `--model` / payload `model` là mô hình chính theo từng công việc. Nó vẫn dùng các dự phòng đã cấu hình trừ khi công việc cung cấp payload `fallbacks` tường minh (dùng `fallbacks: []` cho một lần chạy cron nghiêm ngặt).
- Bộ chọn mô hình mặc định CLI và danh sách cho phép tôn trọng `models.mode: "replace"` bằng cách liệt kê `models.providers.*.models` tường minh thay vì tải toàn bộ danh mục tích hợp sẵn.
- Bộ chọn mô hình của Control UI hỏi Gateway về chế độ xem mô hình đã cấu hình: `agents.defaults.models` khi có, bao gồm các mục `provider/*` toàn nhà cung cấp, nếu không thì `models.providers.*.models` tường minh cộng với các nhà cung cấp có xác thực dùng được. Toàn bộ danh mục tích hợp sẵn được dành cho các chế độ xem duyệt tường minh như `models.list` với `view: "all"` hoặc `openclaw models list --all`.

## Chính sách mô hình nhanh

- Đặt mô hình chính của bạn là mô hình thế hệ mới nhất mạnh nhất mà bạn có quyền dùng.
- Dùng dự phòng cho các tác vụ nhạy cảm về chi phí/độ trễ và trò chuyện ít rủi ro hơn.
- Với tác tử có công cụ hoặc đầu vào không đáng tin cậy, tránh các tầng mô hình cũ/yếu hơn.

## Onboarding (khuyến nghị)

Nếu bạn không muốn sửa cấu hình thủ công, hãy chạy onboarding:

```bash
openclaw onboard
```

Nó có thể thiết lập mô hình + xác thực cho các nhà cung cấp phổ biến, bao gồm **đăng ký OpenAI Code (Codex)** (OAuth) và **Anthropic** (khóa API hoặc Claude CLI).

## Khóa cấu hình (tổng quan)

- `agents.defaults.model.primary` và `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` và `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` và `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` và `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` và `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (danh sách cho phép + bí danh + tham số nhà cung cấp + mục nhà cung cấp động `provider/*`)
- `models.providers` (nhà cung cấp tùy chỉnh được ghi vào `models.json`)

<Note>
Tham chiếu mô hình được chuẩn hóa thành chữ thường. ID nhà cung cấp thì chính xác theo nguyên dạng; dùng
ID nhà cung cấp do plugin công bố.

Ví dụ cấu hình nhà cung cấp (bao gồm OpenCode) nằm trong [OpenCode](/vi/providers/opencode).
</Note>

### Sửa danh sách cho phép an toàn

Dùng ghi bổ sung khi cập nhật thủ công `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Quy tắc bảo vệ chống ghi đè">
    `openclaw config set` bảo vệ các bản đồ mô hình/nhà cung cấp khỏi bị ghi đè vô tình. Một phép gán đối tượng thuần cho `agents.defaults.models`, `models.providers`, hoặc `models.providers.<id>.models` sẽ bị từ chối khi nó sẽ xóa các mục hiện có. Dùng `--merge` cho thay đổi bổ sung; dùng `--replace` chỉ khi giá trị được cung cấp nên trở thành toàn bộ giá trị đích.

    Thiết lập nhà cung cấp tương tác và `openclaw configure --section model` cũng hợp nhất các lựa chọn theo phạm vi nhà cung cấp vào danh sách cho phép hiện có, nên việc thêm Codex, Ollama, hoặc nhà cung cấp khác không làm rơi các mục mô hình không liên quan. Configure giữ nguyên `agents.defaults.model.primary` hiện có khi xác thực nhà cung cấp được áp dụng lại. Các lệnh đặt mặc định tường minh như `openclaw models auth login --provider <id> --set-default` và `openclaw models set <model>` vẫn thay thế `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Mô hình không được phép" (và vì sao phản hồi dừng)

Nếu `agents.defaults.models` được đặt, nó trở thành **danh sách cho phép** cho `/model` và cho ghi đè phiên. Khi người dùng chọn một mô hình không nằm trong danh sách cho phép đó, OpenClaw trả về:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Điều này xảy ra **trước khi** phản hồi bình thường được tạo, nên thông báo có thể tạo cảm giác như nó "không phản hồi." Cách sửa là một trong các cách sau:

- Thêm mô hình vào `agents.defaults.models`, hoặc
- Xóa danh sách cho phép (gỡ `agents.defaults.models`), hoặc
- Chọn một mô hình từ `/model list`.

</Warning>

Khi lệnh bị từ chối bao gồm một ghi đè runtime như `/model openai/gpt-5.5 --runtime codex`, hãy sửa danh sách cho phép trước, rồi thử lại cùng lệnh `/model ... --runtime ...`. Với thực thi Codex gốc, mô hình đã chọn vẫn là `openai/gpt-5.5`; runtime `codex` chọn harness và dùng xác thực Codex riêng.

Với mô hình cục bộ/GGUF, lưu tham chiếu đầy đủ có tiền tố nhà cung cấp trong danh sách cho phép,
ví dụ `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, hoặc
provider/model chính xác được hiển thị bởi `openclaw models list --provider <provider>`.
Chỉ tên tệp cục bộ hoặc tên hiển thị không đủ khi danh sách cho phép đang
hoạt động.

Nếu bạn muốn giới hạn nhà cung cấp mà không liệt kê thủ công mọi mô hình, hãy thêm
các mục `provider/*` vào `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Với chính sách đó, `/model`, `/models`, và các bộ chọn mô hình hiển thị danh mục
đã khám phá chỉ cho các nhà cung cấp đó. Mô hình mới từ các nhà cung cấp đã chọn có thể
xuất hiện mà không cần sửa danh sách cho phép. Có thể trộn các mục `provider/model` chính xác
với các mục `provider/*` khi bạn cần một mô hình cụ thể từ nhà cung cấp khác.

Ví dụ cấu hình danh sách cho phép:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

## Chuyển mô hình trong chat (`/model`)

Bạn có thể chuyển mô hình cho phiên hiện tại mà không cần khởi động lại:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

<AccordionGroup>
  <Accordion title="Hành vi bộ chọn">
    - `/model` (và `/model list`) là bộ chọn nhỏ gọn, có đánh số (họ mô hình + nhà cung cấp có sẵn).
    - Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với danh sách thả xuống nhà cung cấp và mô hình cộng với bước Submit.
    - Trên Telegram, các lựa chọn của bộ chọn `/models` có phạm vi theo phiên; chúng không thay đổi mặc định bền vững của tác tử trong `openclaw.json`.
    - `/models add` đã ngừng khuyến nghị và hiện trả về thông báo ngừng khuyến nghị thay vì đăng ký mô hình từ chat.
    - `/model <#>` chọn từ bộ chọn đó.

  </Accordion>
  <Accordion title="Tính bền vững và chuyển đổi trực tiếp">
    - `/model` lưu lựa chọn phiên mới ngay lập tức.
    - Nếu agent đang rỗi, lượt chạy tiếp theo sẽ dùng mô hình mới ngay.
    - Nếu một lượt chạy đã đang hoạt động, OpenClaw đánh dấu một chuyển đổi trực tiếp là đang chờ và chỉ khởi động lại vào mô hình mới tại một điểm thử lại sạch.
    - Nếu hoạt động công cụ hoặc đầu ra phản hồi đã bắt đầu, chuyển đổi đang chờ có thể tiếp tục được xếp hàng cho đến một cơ hội thử lại sau đó hoặc lượt người dùng tiếp theo.
    - `/model default` xóa lựa chọn phiên và đưa phiên trở lại mô hình mặc định đã cấu hình.
    - Tham chiếu `/model` do người dùng chọn là nghiêm ngặt cho phiên đó: nếu nhà cung cấp/mô hình đã chọn không truy cập được, phản hồi sẽ lỗi hiển thị rõ thay vì âm thầm trả lời từ `agents.defaults.model.fallbacks`. Điều này khác với mặc định đã cấu hình và các chính của tác vụ cron, vốn vẫn có thể dùng chuỗi dự phòng.
    - `/model status` là chế độ xem chi tiết (ứng viên xác thực và, khi được cấu hình, điểm cuối nhà cung cấp `baseUrl` + chế độ `api`).

  </Accordion>
  <Accordion title="Phân tích cú pháp ref">
    - Ref mô hình được phân tích bằng cách tách tại dấu `/` **đầu tiên**. Dùng `provider/model` khi nhập `/model <ref>`.
    - Nếu chính ID mô hình chứa `/` (kiểu OpenRouter), bạn phải bao gồm tiền tố nhà cung cấp (ví dụ: `/model openrouter/moonshotai/kimi-k2`).
    - Nếu bạn bỏ qua nhà cung cấp, OpenClaw phân giải đầu vào theo thứ tự này:
      1. khớp bí danh
      2. khớp nhà cung cấp đã cấu hình duy nhất cho đúng ID mô hình không có tiền tố đó
      3. dự phòng đã không còn khuyến nghị về nhà cung cấp mặc định đã cấu hình — nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw thay vào đó dự phòng về nhà cung cấp/mô hình đã cấu hình đầu tiên để tránh hiển thị một mặc định nhà cung cấp đã bị xóa còn cũ.
  </Accordion>
</AccordionGroup>

Hành vi/cấu hình lệnh đầy đủ: [Lệnh gạch chéo](/vi/tools/slash-commands).

## Lệnh CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (không có lệnh con) là lối tắt cho `models status`.

### `models list`

Hiển thị mặc định các mô hình đã cấu hình/có sẵn xác thực. Các cờ hữu ích:

<ParamField path="--all" type="boolean">
  Danh mục đầy đủ. Bao gồm các hàng danh mục tĩnh đi kèm thuộc sở hữu nhà cung cấp trước khi xác thực được cấu hình, nên các chế độ xem chỉ khám phá có thể hiển thị những mô hình chưa khả dụng cho đến khi bạn thêm thông tin xác thực nhà cung cấp tương ứng.
</ParamField>
<ParamField path="--local" type="boolean">
  Chỉ nhà cung cấp cục bộ.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Lọc theo ID nhà cung cấp, ví dụ `moonshot`. Nhãn hiển thị từ trình chọn tương tác không được chấp nhận.
</ParamField>
<ParamField path="--plain" type="boolean">
  Mỗi dòng một mô hình.
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra máy đọc được.
</ParamField>

### `models status`

Hiển thị mô hình chính đã phân giải, các dự phòng, mô hình ảnh và tổng quan xác thực của các nhà cung cấp đã cấu hình. Nó cũng hiển thị trạng thái hết hạn OAuth cho các hồ sơ tìm thấy trong kho xác thực (mặc định cảnh báo trong vòng 24 giờ). `--plain` chỉ in mô hình chính đã phân giải.

<AccordionGroup>
  <Accordion title="Hành vi xác thực và thăm dò">
    - Trạng thái OAuth luôn được hiển thị (và bao gồm trong đầu ra `--json`). Nếu một nhà cung cấp đã cấu hình không có thông tin xác thực, `models status` in phần **Thiếu xác thực**.
    - JSON bao gồm `auth.oauth` (cửa sổ cảnh báo + hồ sơ) và `auth.providers` (xác thực hiệu lực theo từng nhà cung cấp, bao gồm thông tin xác thực từ env). `auth.oauth` chỉ là sức khỏe hồ sơ trong kho xác thực; các nhà cung cấp chỉ dùng env không xuất hiện ở đó.
    - Dùng `--check` cho tự động hóa (thoát `1` khi thiếu/hết hạn, `2` khi sắp hết hạn).
    - Dùng `--probe` cho kiểm tra xác thực trực tiếp; các hàng thăm dò có thể đến từ hồ sơ xác thực, thông tin xác thực env, hoặc `models.json`.
    - Nếu `auth.order.<provider>` tường minh bỏ qua một hồ sơ đã lưu, thăm dò báo cáo `excluded_by_auth_order` thay vì thử hồ sơ đó. Nếu xác thực tồn tại nhưng không phân giải được mô hình có thể thăm dò cho nhà cung cấp đó, thăm dò báo cáo `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Lựa chọn xác thực phụ thuộc vào nhà cung cấp/tài khoản. Với các máy chủ Gateway luôn bật, khóa API thường dễ dự đoán nhất; việc dùng lại Claude CLI và các hồ sơ Anthropic OAuth/token hiện có cũng được hỗ trợ.
</Note>

Ví dụ (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Quét (mô hình miễn phí OpenRouter)

`openclaw models scan` kiểm tra **danh mục mô hình miễn phí** của OpenRouter và có thể tùy chọn thăm dò các mô hình để hỗ trợ công cụ và hình ảnh.

<ParamField path="--no-probe" type="boolean">
  Bỏ qua thăm dò trực tiếp (chỉ metadata).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Kích thước tham số tối thiểu (tỷ).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Bỏ qua các mô hình cũ hơn.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Bộ lọc tiền tố nhà cung cấp.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Kích thước danh sách dự phòng.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Đặt `agents.defaults.model.primary` thành lựa chọn đầu tiên.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Đặt `agents.defaults.imageModel.primary` thành lựa chọn hình ảnh đầu tiên.
</ParamField>

<Note>
Danh mục `/models` của OpenRouter là công khai, nên các lượt quét chỉ metadata có thể liệt kê ứng viên miễn phí mà không cần khóa. Thăm dò và suy luận vẫn yêu cầu khóa API OpenRouter (từ hồ sơ xác thực hoặc `OPENROUTER_API_KEY`). Nếu không có khóa, `openclaw models scan` dự phòng về đầu ra chỉ metadata và giữ nguyên cấu hình. Dùng `--no-probe` để yêu cầu rõ chế độ chỉ metadata.
</Note>

Kết quả quét được xếp hạng theo:

1. Hỗ trợ hình ảnh
2. Độ trễ công cụ
3. Kích thước ngữ cảnh
4. Số lượng tham số

Đầu vào:

- Danh sách `/models` OpenRouter (bộ lọc `:free`)
- Thăm dò trực tiếp yêu cầu khóa API OpenRouter từ hồ sơ xác thực hoặc `OPENROUTER_API_KEY` (xem [Biến môi trường](/vi/help/environment))
- Bộ lọc tùy chọn: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Điều khiển yêu cầu/thăm dò: `--timeout`, `--concurrency`

Khi thăm dò trực tiếp chạy trong TUI, bạn có thể chọn các dự phòng một cách tương tác. Ở chế độ không tương tác, truyền `--yes` để chấp nhận mặc định. Kết quả chỉ metadata mang tính thông tin; `--set-default` và `--set-image` yêu cầu thăm dò trực tiếp để OpenClaw không cấu hình một mô hình OpenRouter không có khóa và không sử dụng được.

## Sổ đăng ký mô hình (`models.json`)

Các nhà cung cấp tùy chỉnh trong `models.providers` được ghi vào `models.json` trong thư mục agent (mặc định `~/.openclaw/agents/<agentId>/agent/models.json`). Danh mục Plugin nhà cung cấp được lưu dưới dạng các mảnh danh mục đã tạo thuộc sở hữu Plugin trong trạng thái Plugin của agent và được tải tự động. Tệp này được hợp nhất theo mặc định trừ khi `models.mode` được đặt thành `replace`.

<AccordionGroup>
  <Accordion title="Thứ tự ưu tiên chế độ hợp nhất">
    Thứ tự ưu tiên chế độ hợp nhất cho các ID nhà cung cấp khớp:

    - `baseUrl` không rỗng đã có trong `models.json` của agent thắng.
    - `apiKey` không rỗng trong `models.json` của agent chỉ thắng khi nhà cung cấp đó không do SecretRef quản lý trong ngữ cảnh cấu hình/hồ sơ xác thực hiện tại.
    - Các giá trị `apiKey` của nhà cung cấp do SecretRef quản lý được làm mới từ dấu nguồn (`ENV_VAR_NAME` cho ref env, `secretref-managed` cho ref file/exec) thay vì lưu bí mật đã phân giải.
    - Giá trị header của nhà cung cấp do SecretRef quản lý được làm mới từ dấu nguồn (`secretref-env:ENV_VAR_NAME` cho ref env, `secretref-managed` cho ref file/exec).
    - `apiKey`/`baseUrl` rỗng hoặc thiếu của agent dự phòng về `models.providers` trong cấu hình.
    - Các trường nhà cung cấp khác được làm mới từ cấu hình và dữ liệu danh mục đã chuẩn hóa.

  </Accordion>
</AccordionGroup>

<Note>
Lưu dấu lấy nguồn làm thẩm quyền: OpenClaw ghi dấu từ ảnh chụp nhanh cấu hình nguồn đang hoạt động (trước phân giải), không phải từ giá trị bí mật runtime đã phân giải. Điều này áp dụng bất cứ khi nào OpenClaw tạo lại `models.json`, bao gồm các đường dẫn do lệnh điều khiển như `openclaw agent`.
</Note>

## Liên quan

- [Runtime agent](/vi/concepts/agent-runtimes) — OpenClaw, Codex và các runtime vòng lặp agent khác
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) — các khóa cấu hình mô hình
- [Tạo hình ảnh](/vi/tools/image-generation) — cấu hình mô hình hình ảnh
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) — chuỗi dự phòng
- [Nhà cung cấp mô hình](/vi/concepts/model-providers) — định tuyến nhà cung cấp và xác thực
- [Tạo nhạc](/vi/tools/music-generation) — cấu hình mô hình nhạc
- [Tạo video](/vi/tools/video-generation) — cấu hình mô hình video
