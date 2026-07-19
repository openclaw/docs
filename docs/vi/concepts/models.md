---
read_when:
    - Thay đổi hành vi dự phòng của mô hình hoặc trải nghiệm chọn mô hình
    - Gỡ lỗi lỗi "model is not allowed" hoặc cơ chế dự phòng về nhà cung cấp mặc định đã lỗi thời
    - Xử lý hành vi hợp nhất/bí mật của models.json
sidebarTitle: Models CLI
summary: Cách OpenClaw phân giải tham chiếu nhà cung cấp/mô hình, khóa cấu hình và lệnh trò chuyện `/model`
title: CLI mô hình
x-i18n:
    generated_at: "2026-07-19T05:42:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ad5cdf2ca5f165ab5700eaf6af89a7e5fb02fbd2eaa27c5d06ba50dd0f60637
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Chuyển đổi dự phòng mô hình" href="/vi/concepts/model-failover">
    Luân phiên hồ sơ xác thực, thời gian chờ và cách chúng tương tác với các phương án dự phòng.
  </Card>
  <Card title="Nhà cung cấp mô hình" href="/vi/concepts/model-providers">
    Tổng quan nhanh về nhà cung cấp và các ví dụ.
  </Card>
  <Card title="Tham chiếu CLI cho mô hình" href="/vi/cli/models">
    Tham chiếu đầy đủ về lệnh `openclaw models` và các cờ.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults">
    Các khóa cấu hình mô hình, giá trị mặc định và ví dụ.
  </Card>
</CardGroup>

Một tham chiếu mô hình (`provider/model`) chọn nhà cung cấp và mô hình, không chọn
runtime tác nhân cấp thấp. Khi chính sách runtime chưa được đặt hoặc là `auto`, chính sách
định tuyến do nhà cung cấp của OpenAI sở hữu chỉ có thể chọn Codex cho một tuyến Responses
chính thức chính xác của HTTPS Platform hoặc ChatGPT Responses mà không có ghi đè yêu cầu do người dùng
thiết lập; chỉ riêng tiền tố `openai/*` không bao giờ chọn Codex. Các bộ điều hợp Completions, điểm cuối
tùy chỉnh và hành vi yêu cầu do người dùng thiết lập vẫn chạy trên OpenClaw. Các điểm cuối HTTP chính thức
dạng văn bản thuần bị từ chối. Xem [Runtime tác nhân OpenAI ngầm định](/vi/providers/openai#implicit-agent-runtime).

Các tham chiếu Copilot theo gói đăng ký (`github-copilot/*`) có thể được chọn sử dụng Plugin
runtime tác nhân GitHub Copilot bên ngoài, nhưng đường dẫn đó luôn là tường minh (không bao giờ
được chọn bởi `auto`). Các ghi đè runtime thuộc về chính sách nhà cung cấp/mô hình, không thuộc về
toàn bộ tác nhân hoặc phiên. Việc chọn runtime không quyết định cách tính phí:
thông tin xác thực bằng khóa API OpenAI và thông tin xác thực gói đăng ký ChatGPT/Codex vẫn tách biệt. Xem
[Runtime tác nhân](/vi/concepts/agent-runtimes) và
[Runtime tác nhân GitHub Copilot](/vi/plugins/copilot).

## Thứ tự lựa chọn

<Steps>
  <Step title="Mô hình chính">
    `agents.defaults.model.primary` (hoặc `agents.defaults.model` dưới dạng chuỗi thuần).
  </Step>
  <Step title="Các phương án dự phòng">
    `agents.defaults.model.fallbacks`, được thử theo thứ tự.
  </Step>
  <Step title="Chuyển đổi dự phòng xác thực">
    Việc luân phiên hồ sơ xác thực diễn ra bên trong một nhà cung cấp trước khi OpenClaw chuyển sang mô hình dự phòng tiếp theo.
  </Step>
</Steps>

Các bề mặt cấu hình mô hình liên quan:

- `agents.defaults.models` lưu bí danh và cài đặt theo từng mô hình. Việc thêm một mục không hạn chế các ghi đè mô hình.
- `agents.defaults.modelPolicy.allow` là danh sách cho phép ghi đè tùy chọn. Sử dụng tham chiếu chính xác hoặc các mục `provider/*`; bỏ qua hoặc đặt thành `[]` để cho phép mọi mô hình. `agents.list[].modelPolicy.allow` theo từng tác nhân thay thế chính sách mặc định cho tác nhân đó.
- `agents.defaults.utilityModel` là mô hình chi phí thấp hơn tùy chọn dành cho các tác vụ nội bộ ngắn như tiêu đề phiên bảng điều khiển được tạo, tiêu đề luồng/chủ đề của kênh được hỗ trợ và phần tường thuật tiến trình. `agents.list[].utilityModel` theo từng tác nhân ghi đè mô hình này. Khi chưa đặt, OpenClaw sử dụng mô hình nhỏ mặc định do nhà cung cấp chính khai báo nếu có (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), nếu không thì dùng mô hình chính của tác nhân; đặt thành chuỗi rỗng để tắt định tuyến tiện ích. Các tác vụ tiện ích là những lệnh gọi mô hình riêng biệt và có thể gửi nội dung tác vụ có giới hạn đến nhà cung cấp mô hình đã chọn.
- `agents.defaults.imageModel` chỉ được sử dụng khi mô hình chính không thể nhận hình ảnh.
- `agents.defaults.pdfModel` được công cụ `pdf` sử dụng. Nếu chưa đặt, công cụ sẽ chuyển sang `imageModel`, rồi đến mô hình phiên/mặc định đã phân giải.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` và `videoGenerationModel` hỗ trợ các công cụ tạo phương tiện dùng chung. Nếu chưa đặt, mỗi công cụ suy ra giá trị mặc định của nhà cung cấp có xác thực: nhà cung cấp mặc định hiện tại trước tiên, sau đó là các nhà cung cấp đã đăng ký còn lại cho khả năng đó theo thứ tự mã định danh nhà cung cấp. Đặt `agents.defaults.mediaGenerationAutoProviderFallback: false` để tắt suy luận xuyên nhà cung cấp đó trong khi vẫn giữ các phương án dự phòng tường minh.
- `agents.list[].model` theo từng tác nhân (cùng với các liên kết) ghi đè `agents.defaults.model` — xem [Định tuyến đa tác nhân](/vi/concepts/multi-agent).

Tham chiếu khóa đầy đủ, giá trị mặc định và ví dụ JSON5: [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults).

## Nguồn lựa chọn và mức độ nghiêm ngặt của phương án dự phòng

Cùng một `provider/model` hoạt động khác nhau tùy theo nguồn gốc của nó:

| Nguồn                                                                  | Hành vi                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mặc định đã cấu hình (`agents.defaults.model.primary`, mô hình chính theo từng tác nhân) | Điểm bắt đầu thông thường; sử dụng `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Dự phòng tự động                                                           | Trạng thái khôi phục tạm thời, được lưu dưới dạng `modelOverrideSource: "auto"`. OpenClaw định kỳ thăm dò lại mô hình chính ban đầu, xóa lựa chọn tự động khi khôi phục và thông báo các chuyển đổi dự phòng/khôi phục một lần cho mỗi thay đổi trạng thái.                              |
| Lựa chọn phiên của người dùng                                                  | Chính xác và nghiêm ngặt. `/model`, bộ chọn mô hình, `session_status(model=...)` và `sessions.patch` lưu `modelOverrideSource: "user"`. Nếu nhà cung cấp/mô hình đó không thể truy cập được, lượt chạy sẽ báo lỗi rõ ràng thay vì chuyển sang một mô hình đã cấu hình khác. |
| Cron `--model` / tải dữ liệu `model`                                        | Mô hình chính theo từng công việc. Vẫn sử dụng các phương án dự phòng đã cấu hình trừ khi công việc cung cấp tải dữ liệu `fallbacks` riêng (`fallbacks: []` buộc chạy nghiêm ngặt).                                                                                                                    |

Các quy tắc lựa chọn khác:

- Việc thay đổi `agents.defaults.model.primary` không ghi lại các ghim phiên hiện có. Nếu trạng thái báo cáo `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, hãy chạy `/model default` để xóa ghim.
- Các bộ chọn mô hình mặc định và danh sách cho phép của CLI tuân theo `models.mode: "replace"` bằng cách chỉ liệt kê `models.providers.*.models` thay vì toàn bộ danh mục tích hợp sẵn.
- Bộ chọn mô hình trong giao diện điều khiển yêu cầu Gateway cung cấp chế độ xem mô hình đã cấu hình. Một `modelPolicy.allow` tường minh sẽ lọc chế độ xem này, bao gồm các mục ký tự đại diện `provider/*`; nếu không, nó hiển thị các mô hình đã cấu hình cùng các nhà cung cấp có xác thực khả dụng. Toàn bộ danh mục tích hợp sẵn chỉ dành cho các chế độ xem duyệt tường minh (`models.list` với `view: "all"`, hoặc `openclaw models list --all`).
- Các giao diện kiểm kê nhà cung cấp sử dụng `models.list` với `view: "provider-config"` để hiển thị các hàng `models.providers.*.models` do nguồn tạo mà không áp dụng danh sách cho phép của bộ chọn.

Cơ chế đầy đủ: [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

## Chính sách mô hình nhanh

- Đặt mô hình chính thành mô hình thế hệ mới nhất và mạnh nhất mà bạn có thể sử dụng.
- Sử dụng các phương án dự phòng cho tác vụ nhạy cảm với chi phí/độ trễ và cuộc trò chuyện ít quan trọng hơn.
- Đối với các tác nhân có bật công cụ hoặc đầu vào không đáng tin cậy, tránh các cấp mô hình cũ/yếu hơn.

## Thiết lập ban đầu

```bash
openclaw onboard
```

Thiết lập mô hình và xác thực cho các nhà cung cấp phổ biến mà không cần chỉnh sửa cấu hình thủ công, bao gồm OAuth gói đăng ký OpenAI Codex và Anthropic (khóa API hoặc tái sử dụng Claude CLI).

Khi chưa cấu hình mô hình chính, thiết lập khóa API OpenAI mới sẽ chọn
`openai/gpt-5.6`; mã định danh API trực tiếp dạng rút gọn được phân giải thành cấp Sol. Thiết lập
OAuth ChatGPT/Codex mới chọn tham chiếu danh mục chính xác `openai/gpt-5.6-sol`.
Việc xác thực lại giữ nguyên mô hình chính tường minh hiện có, bao gồm
`openai/gpt-5.5`. Nếu tài khoản không thể sử dụng GPT-5.6, hãy chọn
`openai/gpt-5.5` một cách tường minh; OpenClaw không âm thầm hạ cấp mô hình này.

## "Model is not allowed" (và lý do phản hồi dừng lại)

Nếu `agents.defaults.modelPolicy.allow` không rỗng, nó trở thành danh sách cho phép cho `/model`, các ghi đè phiên và `--model`. Việc chọn mô hình ngoài danh sách cho phép đó sẽ trả về trước khi tạo bất kỳ phản hồi thông thường nào. `agents.list[].modelPolicy.allow` theo từng tác nhân thay thế chính sách mặc định cho tác nhân đó.

```text
Ghi đè mô hình "provider/model" không được agents.defaults.modelPolicy.allow cho phép.
Thêm "provider/model" hoặc "provider/*" vào agents.defaults.modelPolicy.allow, hoặc xóa/để trống danh sách để cho phép mọi mô hình.
```

Khắc phục bằng cách thêm mô hình hoặc ký tự đại diện nhà cung cấp vào khóa `modelPolicy.allow` được nêu, xóa/để trống danh sách đó hoặc chọn một mô hình từ `/model list`. Nếu lệnh bị từ chối có chứa ghi đè runtime như `/model openai/gpt-5.5 --runtime codex`, trước tiên hãy sửa danh sách cho phép, rồi thử lại cùng lệnh.

Đối với các mô hình cục bộ/GGUF, danh sách cho phép cần tham chiếu đầy đủ có tiền tố nhà cung cấp, ví dụ `ollama/gemma4:26b` hoặc `lmstudio/Gemma4-26b-a4-it-gguf` — kiểm tra `openclaw models list --provider <provider>` để biết chuỗi chính xác. Chỉ tên tệp hoặc tên hiển thị là không đủ khi danh sách cho phép đã hoạt động.

Để giới hạn nhà cung cấp mà không liệt kê mọi mô hình, hãy sử dụng các mục ký tự đại diện `provider/*`:

```json5
{
  agents: {
    defaults: {
      modelPolicy: {
        allow: ["openai/*", "vllm/*"],
      },
    },
  },
}
```

`/model`, `/models` và các bộ chọn mô hình sau đó chỉ hiển thị danh mục được phát hiện cho các nhà cung cấp đó, đồng thời các mô hình mới có thể xuất hiện mà không cần chỉnh sửa danh sách cho phép. Kết hợp các mục `provider/model` chính xác với các mục `provider/*` để đưa vào một mô hình cụ thể từ nhà cung cấp khác.

Ví dụ về danh sách cho phép với bí danh và cài đặt theo từng mô hình:

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      modelPolicy: {
        allow: ["anthropic/claude-sonnet-4-6", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

<Accordion title="Chỉnh sửa danh sách cho phép một cách tường minh">
Đặt trực tiếp danh sách đầy đủ:

```bash
openclaw config set agents.defaults.modelPolicy.allow '["openai/gpt-5.4","anthropic/*"]' --strict-json
```

`openclaw models set`, thiết lập nhà cung cấp và `openclaw models aliases add` có thể thêm các mục trong `agents.defaults.models`, nhưng không bao giờ thay đổi `modelPolicy.allow`. Điều này giữ siêu dữ liệu mô hình và bí danh độc lập với chính sách ghi đè.
</Accordion>

## `/model` trong cuộc trò chuyện

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` và `/model list` hiển thị một bộ chọn đánh số thu gọn (họ mô hình + các nhà cung cấp khả dụng); `/model <#>` chọn từ đó. Trên Discord, thao tác này mở các danh sách thả xuống nhà cung cấp/mô hình kèm bước Submit; trên Telegram, các lựa chọn trong bộ chọn chỉ áp dụng cho phiên và không bao giờ ghi đè giá trị mặc định lâu dài của tác nhân trong `openclaw.json`. `/models add` đã bị ngừng dùng và trả về một thông báo thay vì đăng ký mô hình từ cuộc trò chuyện.
- `/model` lưu ngay lựa chọn mới của phiên. Nếu tác nhân đang rảnh, lượt chạy tiếp theo sẽ dùng lựa chọn đó ngay; nếu đã có một lượt chạy đang hoạt động, thay đổi sẽ được đưa vào hàng đợi cho điểm thử lại sạch tiếp theo (hoặc một điểm sau đó nếu hoạt động công cụ hoặc đầu ra phản hồi đã bắt đầu).
- `/model default` xóa lựa chọn của phiên để phiên kế thừa lại cấu hình chính.
- Tham chiếu `/model` do người dùng chọn được áp dụng nghiêm ngặt cho phiên đó: nếu tham chiếu không còn truy cập được, phản hồi sẽ thất bại rõ ràng thay vì âm thầm chuyển sang phương án dự phòng thông qua `agents.defaults.model.fallbacks`. Các giá trị mặc định đã cấu hình và mô hình chính của tác vụ cron vẫn sử dụng chuỗi dự phòng.
- `/model status` là chế độ xem chi tiết: các ứng viên xác thực theo từng nhà cung cấp và (khi đã cấu hình) điểm cuối `baseUrl` của nhà cung cấp cùng chế độ `api`.
- Tham chiếu mô hình được phân tích bằng cách tách tại `/` đầu tiên; hãy nhập `provider/model`. Nếu chính ID mô hình chứa `/` (theo kiểu OpenRouter), hãy thêm tiền tố nhà cung cấp, ví dụ: `/model openrouter/moonshotai/kimi-k2`. Nếu bạn bỏ qua nhà cung cấp, OpenClaw sẽ thử: (1) khớp bí danh, (2) khớp duy nhất với nhà cung cấp đã cấu hình cho chính xác ID mô hình không có tiền tố đó, (3) nhà cung cấp mặc định đã cấu hình (phương án dự phòng đã ngừng dùng) — và nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, thì dùng nhà cung cấp/mô hình được cấu hình đầu tiên để tránh hiển thị một giá trị mặc định cũ của nhà cung cấp đã bị xóa.
- Tham chiếu mô hình được chuẩn hóa thành chữ thường; ngoài ra, ID nhà cung cấp phải chính xác, vì vậy hãy dùng ID do plugin công bố.

Hành vi đầy đủ của lệnh và cấu hình: [Lệnh dấu gạch chéo](/vi/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` khi không có lệnh con là lối tắt cho `models status`, lệnh này cũng hiển thị thời điểm hết hạn OAuth cho các hồ sơ trong kho xác thực (mặc định cảnh báo trong vòng 24h). Các cờ đầy đủ, cấu trúc JSON và lệnh con của hồ sơ xác thực: [Tài liệu tham khảo CLI mô hình](/vi/cli/models).

<AccordionGroup>
  <Accordion title="Quét (các mô hình miễn phí của OpenRouter)">
    `openclaw models scan` kiểm tra danh mục mô hình miễn phí công khai của OpenRouter và có thể thăm dò trực tiếp các ứng viên về khả năng hỗ trợ công cụ và hình ảnh. Bản thân danh mục là công khai, vì vậy các lượt quét chỉ lấy siêu dữ liệu (`--no-probe`) không cần khóa; việc thăm dò trực tiếp và `--set-default`/`--set-image` yêu cầu khóa API OpenRouter (hồ sơ xác thực hoặc `OPENROUTER_API_KEY`) và sẽ chuyển sang chỉ xuất siêu dữ liệu nếu không có khóa.

    Kết quả được xếp hạng theo: khả năng hỗ trợ hình ảnh, sau đó là độ trễ công cụ, tiếp theo là kích thước ngữ cảnh, rồi đến số lượng tham số. Trong TTY, các kết quả đã thăm dò sẽ nhắc chọn phương án dự phòng theo cách tương tác; chế độ không tương tác cần `--yes` để chấp nhận các giá trị mặc định.

  </Accordion>
</AccordionGroup>

## Sổ đăng ký mô hình (`models.json`)

Các nhà cung cấp tùy chỉnh được cấu hình trong `models.providers` được ghi vào `models.json` trong thư mục tác nhân (mặc định là `~/.openclaw/agents/<agentId>/agent/models.json`). Danh mục của plugin nhà cung cấp được lưu riêng dưới dạng các phân đoạn danh mục được tạo và do plugin sở hữu, đồng thời tự động tải. Theo mặc định, tệp này được hợp nhất với cấu hình; đặt `models.mode: "replace"` để chỉ sử dụng các nhà cung cấp do bạn cấu hình.

<AccordionGroup>
  <Accordion title="Thứ tự ưu tiên của chế độ hợp nhất">
    Đối với các ID nhà cung cấp trùng khớp:

    - Một `baseUrl` không rỗng đã có trong `models.json` của tác nhân sẽ được ưu tiên.
    - Một `apiKey` không rỗng trong `models.json` chỉ được ưu tiên khi nhà cung cấp đó không do SecretRef quản lý trong ngữ cảnh cấu hình/hồ sơ xác thực hiện tại.
    - Các giá trị `apiKey` do SecretRef quản lý được làm mới từ dấu nguồn thay vì lưu bí mật đã phân giải: tên biến môi trường đối với tham chiếu môi trường, `secretref-managed` đối với tham chiếu tệp/thực thi.
    - Các giá trị tiêu đề do SecretRef quản lý được làm mới theo cách tương tự, sử dụng `secretref-env:ENV_VAR_NAME` cho tham chiếu môi trường.
    - `apiKey`/`baseUrl` trống hoặc thiếu trong `models.json` sẽ dùng `models.providers` trong cấu hình làm phương án dự phòng.
    - Các trường khác của nhà cung cấp được làm mới từ cấu hình và dữ liệu danh mục đã chuẩn hóa.

  </Accordion>
</AccordionGroup>

Việc lưu dấu lấy nguồn làm căn cứ chính thức: OpenClaw ghi các dấu từ ảnh chụp cấu hình nguồn đang hoạt động (trước khi phân giải), không phải từ các giá trị bí mật thời gian chạy đã phân giải, mỗi khi tạo lại `models.json` — bao gồm cả các đường dẫn do lệnh điều khiển như `openclaw agent`.

## Liên quan

- [Môi trường chạy tác nhân](/vi/concepts/agent-runtimes) — OpenClaw, Codex và các môi trường chạy vòng lặp tác nhân khác
- [Tài liệu tham khảo cấu hình](/vi/gateway/config-agents#agent-defaults) — các khóa cấu hình mô hình
- [Tạo hình ảnh](/vi/tools/image-generation) — cấu hình mô hình hình ảnh
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) — các chuỗi dự phòng
- [Nhà cung cấp mô hình](/vi/concepts/model-providers) — định tuyến nhà cung cấp và xác thực
- [Tài liệu tham khảo CLI mô hình](/vi/cli/models) — tài liệu tham khảo đầy đủ về lệnh và cờ
- [Tạo nhạc](/vi/tools/music-generation) — cấu hình mô hình âm nhạc
- [Tạo video](/vi/tools/video-generation) — cấu hình mô hình video
