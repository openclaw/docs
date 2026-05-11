---
read_when:
    - Thêm hoặc sửa đổi CLI models (models list/set/scan/aliases/fallbacks)
    - Thay đổi hành vi dự phòng của mô hình hoặc UX lựa chọn
    - Cập nhật các đầu dò quét mô hình (công cụ/hình ảnh)
sidebarTitle: Models CLI
summary: 'CLI mô hình: liệt kê, đặt, bí danh, dự phòng, quét, trạng thái'
title: CLI mô hình
x-i18n:
    generated_at: "2026-05-11T20:28:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 346f0edaf0d821bc8e65b73bf1d2385fb343c4b93127e6a20e9dd783c5138c52
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Chuyển đổi dự phòng mô hình" href="/vi/concepts/model-failover">
    Luân phiên hồ sơ xác thực, thời gian chờ hồi phục và cách chúng tương tác với các phương án dự phòng.
  </Card>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers">
    Tổng quan nhanh về nhà cung cấp và các ví dụ.
  </Card>
  <Card title="Runtime tác nhân" href="/vi/concepts/agent-runtimes">
    PI, Codex và các runtime vòng lặp tác nhân khác.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults">
    Các khóa cấu hình mô hình.
  </Card>
</CardGroup>

Tham chiếu mô hình chọn một nhà cung cấp và mô hình. Chúng thường không chọn runtime tác nhân cấp thấp. Tham chiếu tác nhân OpenAI là ngoại lệ chính: `openai/gpt-5.5` chạy qua runtime máy chủ ứng dụng Codex theo mặc định trên nhà cung cấp OpenAI chính thức. Ghi đè runtime tường minh thuộc về chính sách nhà cung cấp/mô hình, không phải toàn bộ tác nhân hoặc phiên. Ở chế độ runtime Codex, tham chiếu `openai/gpt-*` không hàm ý tính phí theo khóa API; xác thực có thể đến từ tài khoản Codex hoặc hồ sơ xác thực `openai-codex`. Xem [Runtime tác nhân](/vi/concepts/agent-runtimes).

## Cách hoạt động của lựa chọn mô hình

OpenClaw chọn mô hình theo thứ tự này:

<Steps>
  <Step title="Mô hình chính">
    `agents.defaults.model.primary` (hoặc `agents.defaults.model`).
  </Step>
  <Step title="Phương án dự phòng">
    `agents.defaults.model.fallbacks` (theo thứ tự).
  </Step>
  <Step title="Chuyển đổi dự phòng xác thực của nhà cung cấp">
    Chuyển đổi dự phòng xác thực diễn ra bên trong một nhà cung cấp trước khi chuyển sang mô hình tiếp theo.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Các bề mặt mô hình liên quan">
    - `agents.defaults.models` là danh sách cho phép/danh mục các mô hình OpenClaw có thể dùng (cộng với bí danh). Dùng các mục `provider/*` để giới hạn nhà cung cấp hiển thị trong khi vẫn giữ việc khám phá nhà cung cấp ở dạng động.
    - `agents.defaults.imageModel` được dùng **chỉ khi** mô hình chính không thể chấp nhận hình ảnh.
    - `agents.defaults.pdfModel` được công cụ `pdf` sử dụng. Nếu bỏ qua, công cụ sẽ dự phòng về `agents.defaults.imageModel`, rồi đến mô hình phiên/mặc định đã phân giải.
    - `agents.defaults.imageGenerationModel` được dùng bởi năng lực tạo hình ảnh dùng chung. Nếu bỏ qua, `image_generate` vẫn có thể suy ra một mặc định nhà cung cấp có xác thực. Nó thử nhà cung cấp mặc định hiện tại trước, rồi đến các nhà cung cấp tạo hình ảnh đã đăng ký còn lại theo thứ tự ID nhà cung cấp. Nếu bạn đặt một nhà cung cấp/mô hình cụ thể, cũng hãy cấu hình xác thực/khóa API của nhà cung cấp đó.
    - `agents.defaults.musicGenerationModel` được dùng bởi năng lực tạo nhạc dùng chung. Nếu bỏ qua, `music_generate` vẫn có thể suy ra một mặc định nhà cung cấp có xác thực. Nó thử nhà cung cấp mặc định hiện tại trước, rồi đến các nhà cung cấp tạo nhạc đã đăng ký còn lại theo thứ tự ID nhà cung cấp. Nếu bạn đặt một nhà cung cấp/mô hình cụ thể, cũng hãy cấu hình xác thực/khóa API của nhà cung cấp đó.
    - `agents.defaults.videoGenerationModel` được dùng bởi năng lực tạo video dùng chung. Nếu bỏ qua, `video_generate` vẫn có thể suy ra một mặc định nhà cung cấp có xác thực. Nó thử nhà cung cấp mặc định hiện tại trước, rồi đến các nhà cung cấp tạo video đã đăng ký còn lại theo thứ tự ID nhà cung cấp. Nếu bạn đặt một nhà cung cấp/mô hình cụ thể, cũng hãy cấu hình xác thực/khóa API của nhà cung cấp đó.
    - Mặc định theo từng tác nhân có thể ghi đè `agents.defaults.model` thông qua `agents.list[].model` cộng với các liên kết (xem [Định tuyến đa tác nhân](/vi/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Nguồn lựa chọn và hành vi dự phòng

Cùng một `provider/model` có thể mang ý nghĩa khác nhau tùy theo nguồn gốc của nó:

- Mặc định đã cấu hình (`agents.defaults.model.primary` và các mô hình chính theo tác nhân) là điểm bắt đầu thông thường và sử dụng `agents.defaults.model.fallbacks`.
- Các lựa chọn dự phòng tự động là trạng thái phục hồi tạm thời. Chúng được lưu với `modelOverrideSource: "auto"` để các lượt sau có thể tiếp tục dùng chuỗi dự phòng mà không thăm dò mô hình chính đã biết là lỗi trước.
- Lựa chọn phiên của người dùng là chính xác. `/model`, bộ chọn mô hình, `session_status(model=...)` và `sessions.patch` lưu `modelOverrideSource: "user"`; nếu nhà cung cấp/mô hình đã chọn đó không thể truy cập, OpenClaw sẽ báo lỗi rõ ràng thay vì rơi xuống một mô hình đã cấu hình khác.
- Cron `--model` / payload `model` là mô hình chính theo từng tác vụ. Nó vẫn dùng các phương án dự phòng đã cấu hình trừ khi tác vụ cung cấp payload `fallbacks` tường minh (dùng `fallbacks: []` cho một lần chạy cron nghiêm ngặt).
- Các bộ chọn mô hình mặc định và danh sách cho phép của CLI tôn trọng `models.mode: "replace"` bằng cách liệt kê `models.providers.*.models` tường minh thay vì tải toàn bộ danh mục tích hợp sẵn.
- Bộ chọn mô hình trong Giao diện Điều khiển hỏi Gateway để lấy chế độ xem mô hình đã cấu hình: `agents.defaults.models` khi có mặt, bao gồm các mục toàn nhà cung cấp `provider/*`, nếu không thì dùng `models.providers.*.models` tường minh cộng với các nhà cung cấp có xác thực khả dụng. Toàn bộ danh mục tích hợp sẵn được dành cho các chế độ xem duyệt tường minh như `models.list` với `view: "all"` hoặc `openclaw models list --all`.

## Chính sách mô hình nhanh

- Đặt mô hình chính của bạn thành mô hình thế hệ mới nhất mạnh nhất mà bạn có thể dùng.
- Dùng các phương án dự phòng cho các tác vụ nhạy cảm về chi phí/độ trễ và trò chuyện ít rủi ro hơn.
- Với tác nhân có bật công cụ hoặc đầu vào không đáng tin cậy, tránh các tầng mô hình cũ/yếu hơn.

## Onboarding (khuyến nghị)

Nếu bạn không muốn chỉnh cấu hình thủ công, hãy chạy onboarding:

```bash
openclaw onboard
```

Nó có thể thiết lập mô hình + xác thực cho các nhà cung cấp phổ biến, bao gồm **OpenAI Code (Codex) subscription** (OAuth) và **Anthropic** (khóa API hoặc Claude CLI).

## Khóa cấu hình (tổng quan)

- `agents.defaults.model.primary` và `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` và `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` và `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` và `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` và `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (danh sách cho phép + bí danh + tham số nhà cung cấp + mục nhà cung cấp động `provider/*`)
- `models.providers` (nhà cung cấp tùy chỉnh được ghi vào `models.json`)

<Note>
Tham chiếu mô hình được chuẩn hóa thành chữ thường. Bí danh nhà cung cấp như `z.ai/*` chuẩn hóa thành `zai/*`.

Các ví dụ cấu hình nhà cung cấp (bao gồm OpenCode) nằm trong [OpenCode](/vi/providers/opencode).
</Note>

### Chỉnh sửa danh sách cho phép an toàn

Dùng thao tác ghi cộng thêm khi cập nhật thủ công `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Quy tắc bảo vệ khỏi ghi đè">
    `openclaw config set` bảo vệ các bản đồ mô hình/nhà cung cấp khỏi ghi đè ngoài ý muốn. Một phép gán đối tượng thuần cho `agents.defaults.models`, `models.providers` hoặc `models.providers.<id>.models` bị từ chối khi nó sẽ xóa các mục hiện có. Dùng `--merge` cho các thay đổi cộng thêm; chỉ dùng `--replace` khi giá trị được cung cấp nên trở thành toàn bộ giá trị đích.

    Thiết lập nhà cung cấp tương tác và `openclaw configure --section model` cũng hợp nhất các lựa chọn theo phạm vi nhà cung cấp vào danh sách cho phép hiện có, vì vậy việc thêm Codex, Ollama hoặc nhà cung cấp khác sẽ không làm mất các mục mô hình không liên quan. Configure giữ nguyên `agents.defaults.model.primary` hiện có khi xác thực nhà cung cấp được áp dụng lại. Các lệnh đặt mặc định tường minh như `openclaw models auth login --provider <id> --set-default` và `openclaw models set <model>` vẫn thay thế `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Mô hình không được phép" (và vì sao trả lời dừng lại)

Nếu `agents.defaults.models` được đặt, nó trở thành **danh sách cho phép** cho `/model` và cho các ghi đè phiên. Khi người dùng chọn một mô hình không nằm trong danh sách cho phép đó, OpenClaw trả về:

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Điều này xảy ra **trước khi** một phản hồi thông thường được tạo, nên tin nhắn có thể tạo cảm giác như nó "không phản hồi." Cách sửa là một trong các cách sau:

- Thêm mô hình vào `agents.defaults.models`, hoặc
- Xóa danh sách cho phép (gỡ bỏ `agents.defaults.models`), hoặc
- Chọn một mô hình từ `/model list`.

</Warning>

Khi lệnh bị từ chối bao gồm ghi đè runtime như `/model openai/gpt-5.5 --runtime codex`, trước tiên hãy sửa danh sách cho phép, rồi thử lại cùng lệnh `/model ... --runtime ...`. Với thực thi Codex gốc, mô hình đã chọn vẫn là `openai/gpt-5.5`; runtime `codex` chọn harness và dùng xác thực Codex riêng.

Với mô hình cục bộ/GGUF, hãy lưu tham chiếu đầy đủ có tiền tố nhà cung cấp trong danh sách cho phép,
ví dụ `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, hoặc
nhà cung cấp/mô hình chính xác được hiển thị bởi `openclaw models list --provider <provider>`.
Tên tệp cục bộ trần hoặc tên hiển thị là không đủ khi danh sách cho phép đang
hoạt động.

Nếu bạn muốn giới hạn nhà cung cấp mà không liệt kê thủ công mọi mô hình, hãy thêm
các mục `provider/*` vào `agents.defaults.models`:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai-codex/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Với chính sách đó, `/model`, `/models` và các bộ chọn mô hình hiển thị danh mục
đã khám phá chỉ cho các nhà cung cấp đó. Mô hình mới từ các nhà cung cấp đã chọn có thể
xuất hiện mà không cần chỉnh sửa danh sách cho phép. Có thể kết hợp các mục `provider/model` chính xác
với các mục `provider/*` khi bạn cần một mô hình cụ thể từ một nhà cung cấp khác.

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

## Chuyển đổi mô hình trong trò chuyện (`/model`)

Bạn có thể chuyển mô hình cho phiên hiện tại mà không cần khởi động lại:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Hành vi của bộ chọn">
    - `/model` (và `/model list`) là bộ chọn nhỏ gọn, có đánh số (họ mô hình + nhà cung cấp khả dụng).
    - Trên Discord, `/model` và `/models` mở một bộ chọn tương tác với menu thả xuống nhà cung cấp và mô hình cùng một bước Gửi.
    - Trên Telegram, các lựa chọn trong bộ chọn `/models` có phạm vi theo phiên; chúng không thay đổi mặc định lâu dài của tác nhân trong `openclaw.json`.
    - `/models add` đã ngừng khuyến nghị và hiện trả về thông báo ngừng khuyến nghị thay vì đăng ký mô hình từ trò chuyện.
    - `/model <#>` chọn từ bộ chọn đó.

  </Accordion>
  <Accordion title="Lưu giữ và chuyển đổi trực tiếp">
    - `/model` lưu lựa chọn phiên mới ngay lập tức.
    - Nếu tác nhân đang rảnh, lần chạy tiếp theo dùng mô hình mới ngay.
    - Nếu một lần chạy đã hoạt động, OpenClaw đánh dấu một chuyển đổi trực tiếp là đang chờ và chỉ khởi động lại vào mô hình mới tại một điểm thử lại sạch.
    - Nếu hoạt động công cụ hoặc đầu ra trả lời đã bắt đầu, chuyển đổi đang chờ có thể tiếp tục nằm trong hàng đợi cho đến một cơ hội thử lại sau đó hoặc lượt người dùng tiếp theo.
    - Một tham chiếu `/model` do người dùng chọn là nghiêm ngặt cho phiên đó: nếu nhà cung cấp/mô hình đã chọn không thể truy cập, phản hồi sẽ lỗi rõ ràng thay vì âm thầm trả lời từ `agents.defaults.model.fallbacks`. Điều này khác với mặc định đã cấu hình và mô hình chính của tác vụ cron, vốn vẫn có thể dùng chuỗi dự phòng.
    - `/model status` là chế độ xem chi tiết (ứng viên xác thực và, khi đã cấu hình, `baseUrl` điểm cuối nhà cung cấp + chế độ `api`).

  </Accordion>
  <Accordion title="Phân tích cú pháp ref">
    - Các ref mô hình được phân tích cú pháp bằng cách tách tại dấu `/` **đầu tiên**. Dùng `provider/model` khi nhập `/model <ref>`.
    - Nếu chính ID mô hình chứa `/` (kiểu OpenRouter), bạn phải thêm tiền tố nhà cung cấp (ví dụ: `/model openrouter/moonshotai/kimi-k2`).
    - Nếu bạn bỏ qua nhà cung cấp, OpenClaw phân giải đầu vào theo thứ tự này:
      1. khớp bí danh
      2. khớp nhà cung cấp đã cấu hình duy nhất cho đúng id mô hình không có tiền tố đó
      3. dự phòng không còn được khuyến nghị về nhà cung cấp mặc định đã cấu hình — nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, OpenClaw thay vào đó dự phòng về nhà cung cấp/mô hình đã cấu hình đầu tiên để tránh hiển thị một mặc định nhà cung cấp đã bị xóa và lỗi thời.
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

Theo mặc định, hiển thị các mô hình đã cấu hình/có xác thực khả dụng. Các cờ hữu ích:

<ParamField path="--all" type="boolean">
  Danh mục đầy đủ. Bao gồm các hàng danh mục tĩnh thuộc sở hữu nhà cung cấp được đóng gói sẵn trước khi xác thực được cấu hình, nên các chế độ xem chỉ để khám phá có thể hiển thị các mô hình chưa khả dụng cho đến khi bạn thêm thông tin xác thực nhà cung cấp tương ứng.
</ParamField>
<ParamField path="--local" type="boolean">
  Chỉ các nhà cung cấp cục bộ.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Lọc theo id nhà cung cấp, ví dụ `moonshot`. Không chấp nhận nhãn hiển thị từ bộ chọn tương tác.
</ParamField>
<ParamField path="--plain" type="boolean">
  Mỗi dòng một mô hình.
</ParamField>
<ParamField path="--json" type="boolean">
  Đầu ra máy đọc được.
</ParamField>

### `models status`

Hiển thị mô hình chính đã phân giải, các mô hình dự phòng, mô hình hình ảnh và tổng quan xác thực của các nhà cung cấp đã cấu hình. Lệnh này cũng hiển thị trạng thái hết hạn OAuth cho các hồ sơ tìm thấy trong kho xác thực (mặc định cảnh báo trong vòng 24 giờ). `--plain` chỉ in mô hình chính đã phân giải.

<AccordionGroup>
  <Accordion title="Hành vi xác thực và kiểm tra">
    - Trạng thái OAuth luôn được hiển thị (và được bao gồm trong đầu ra `--json`). Nếu một nhà cung cấp đã cấu hình không có thông tin xác thực, `models status` in phần **Thiếu xác thực**.
    - JSON bao gồm `auth.oauth` (khung cảnh báo + hồ sơ) và `auth.providers` (xác thực hiệu lực theo từng nhà cung cấp, bao gồm thông tin xác thực dựa trên env). `auth.oauth` chỉ là tình trạng hồ sơ trong kho xác thực; các nhà cung cấp chỉ dùng env không xuất hiện ở đó.
    - Dùng `--check` cho tự động hóa (thoát `1` khi thiếu/hết hạn, `2` khi sắp hết hạn).
    - Dùng `--probe` cho các kiểm tra xác thực trực tiếp; các hàng kiểm tra có thể đến từ hồ sơ xác thực, thông tin xác thực env hoặc `models.json`.
    - Nếu `auth.order.<provider>` tường minh bỏ qua một hồ sơ đã lưu, kiểm tra báo cáo `excluded_by_auth_order` thay vì thử hồ sơ đó. Nếu có xác thực nhưng không thể phân giải mô hình có thể kiểm tra cho nhà cung cấp đó, kiểm tra báo cáo `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Lựa chọn xác thực phụ thuộc vào nhà cung cấp/tài khoản. Với các máy chủ Gateway luôn bật, khóa API thường dễ dự đoán nhất; cũng hỗ trợ tái sử dụng Claude CLI và các hồ sơ OAuth/token Anthropic hiện có.
</Note>

Ví dụ (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Quét (mô hình miễn phí của OpenRouter)

`openclaw models scan` kiểm tra **danh mục mô hình miễn phí** của OpenRouter và có thể tùy chọn kiểm tra mô hình để xác định hỗ trợ công cụ và hình ảnh.

<ParamField path="--no-probe" type="boolean">
  Bỏ qua kiểm tra trực tiếp (chỉ metadata).
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
Danh mục `/models` của OpenRouter là công khai, nên các lượt quét chỉ metadata có thể liệt kê ứng viên miễn phí mà không cần khóa. Kiểm tra và suy luận vẫn yêu cầu khóa API OpenRouter (từ hồ sơ xác thực hoặc `OPENROUTER_API_KEY`). Nếu không có khóa, `openclaw models scan` quay về đầu ra chỉ metadata và giữ nguyên cấu hình. Dùng `--no-probe` để yêu cầu rõ ràng chế độ chỉ metadata.
</Note>

Kết quả quét được xếp hạng theo:

1. Hỗ trợ hình ảnh
2. Độ trễ công cụ
3. Kích thước ngữ cảnh
4. Số lượng tham số

Đầu vào:

- Danh sách `/models` của OpenRouter (bộ lọc `:free`)
- Kiểm tra trực tiếp yêu cầu khóa API OpenRouter từ hồ sơ xác thực hoặc `OPENROUTER_API_KEY` (xem [Biến môi trường](/vi/help/environment))
- Bộ lọc tùy chọn: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Điều khiển yêu cầu/kiểm tra: `--timeout`, `--concurrency`

Khi kiểm tra trực tiếp chạy trong TTY, bạn có thể chọn dự phòng theo cách tương tác. Ở chế độ không tương tác, truyền `--yes` để chấp nhận mặc định. Kết quả chỉ metadata chỉ mang tính thông tin; `--set-default` và `--set-image` yêu cầu kiểm tra trực tiếp để OpenClaw không cấu hình một mô hình OpenRouter không có khóa và không dùng được.

## Sổ đăng ký mô hình (`models.json`)

Các nhà cung cấp tùy chỉnh trong `models.providers` được ghi vào `models.json` trong thư mục agent (mặc định `~/.openclaw/agents/<agentId>/agent/models.json`). Tệp này được hợp nhất theo mặc định trừ khi `models.mode` được đặt thành `replace`.

<AccordionGroup>
  <Accordion title="Thứ tự ưu tiên chế độ hợp nhất">
    Thứ tự ưu tiên chế độ hợp nhất cho các ID nhà cung cấp khớp nhau:

    - `baseUrl` không rỗng đã có trong `models.json` của agent sẽ thắng.
    - `apiKey` không rỗng trong `models.json` của agent chỉ thắng khi nhà cung cấp đó không do SecretRef quản lý trong ngữ cảnh cấu hình/hồ sơ xác thực hiện tại.
    - Các giá trị `apiKey` của nhà cung cấp do SecretRef quản lý được làm mới từ marker nguồn (`ENV_VAR_NAME` cho ref env, `secretref-managed` cho ref file/exec) thay vì lưu giữ bí mật đã phân giải.
    - Các giá trị header của nhà cung cấp do SecretRef quản lý được làm mới từ marker nguồn (`secretref-env:ENV_VAR_NAME` cho ref env, `secretref-managed` cho ref file/exec).
    - `apiKey`/`baseUrl` của agent rỗng hoặc thiếu sẽ quay về `models.providers` trong cấu hình.
    - Các trường nhà cung cấp khác được làm mới từ cấu hình và dữ liệu danh mục đã chuẩn hóa.

  </Accordion>
</AccordionGroup>

<Note>
Việc lưu giữ marker lấy nguồn làm thẩm quyền: OpenClaw ghi marker từ snapshot cấu hình nguồn đang hoạt động (trước khi phân giải), không phải từ các giá trị bí mật runtime đã phân giải. Điều này áp dụng bất cứ khi nào OpenClaw tạo lại `models.json`, bao gồm các đường dẫn do lệnh điều khiển như `openclaw agent`.
</Note>

## Liên quan

- [Runtime agent](/vi/concepts/agent-runtimes) — PI, Codex và các runtime vòng lặp agent khác
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) — khóa cấu hình mô hình
- [Tạo hình ảnh](/vi/tools/image-generation) — cấu hình mô hình hình ảnh
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) — chuỗi dự phòng
- [Nhà cung cấp mô hình](/vi/concepts/model-providers) — định tuyến và xác thực nhà cung cấp
- [Tạo nhạc](/vi/tools/music-generation) — cấu hình mô hình âm nhạc
- [Tạo video](/vi/tools/video-generation) — cấu hình mô hình video
