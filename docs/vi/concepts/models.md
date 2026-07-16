---
read_when:
    - Thay đổi hành vi dự phòng của mô hình hoặc trải nghiệm chọn mô hình
    - Gỡ lỗi lỗi "mô hình không được phép" hoặc cơ chế dự phòng nhà cung cấp mặc định đã lỗi thời
    - Xử lý hành vi hợp nhất/bí mật của models.json
sidebarTitle: Models CLI
summary: Cách OpenClaw phân giải tham chiếu nhà cung cấp/mô hình, khóa cấu hình và lệnh trò chuyện `/model`
title: CLI mô hình
x-i18n:
    generated_at: "2026-07-16T14:19:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
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
  <Card title="Tham chiếu CLI về mô hình" href="/vi/cli/models">
    Tham chiếu đầy đủ về lệnh `openclaw models` và các cờ.
  </Card>
  <Card title="Tham chiếu cấu hình" href="/vi/gateway/config-agents#agent-defaults">
    Các khóa cấu hình mô hình, giá trị mặc định và ví dụ.
  </Card>
</CardGroup>

Một tham chiếu mô hình (`provider/model`) chọn nhà cung cấp và mô hình, không chọn
runtime tác tử cấp thấp. Khi chính sách runtime chưa được đặt hoặc là `auto`, chính sách
định tuyến do nhà cung cấp OpenAI sở hữu chỉ có thể chọn Codex cho một tuyến Responses
HTTPS Platform chính thức hoặc ChatGPT Responses chính xác, không có ghi đè yêu cầu do người dùng
thiết lập; riêng tiền tố `openai/*` không bao giờ chọn Codex. Các bộ điều hợp Completions,
điểm cuối tùy chỉnh và hành vi yêu cầu do người dùng thiết lập vẫn chạy trên OpenClaw. Các điểm cuối
HTTP văn bản thuần chính thức sẽ bị từ chối. Xem [Runtime tác tử ngầm định của OpenAI](/vi/providers/openai#implicit-agent-runtime).

Có thể chọn dùng các tham chiếu Copilot theo gói thuê bao (`github-copilot/*`) với Plugin
runtime tác tử GitHub Copilot bên ngoài, nhưng đường dẫn đó luôn là lựa chọn tường minh (không bao giờ
được `auto` chọn). Các ghi đè runtime thuộc về chính sách nhà cung cấp/mô hình, không thuộc về
toàn bộ tác tử hoặc phiên. Việc chọn runtime không quyết định cách tính phí:
thông tin xác thực bằng khóa API OpenAI và thông tin xác thực theo gói thuê bao ChatGPT/Codex vẫn tách biệt. Xem
[Runtime tác tử](/vi/concepts/agent-runtimes) và
[Runtime tác tử GitHub Copilot](/vi/plugins/copilot).

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

- `agents.defaults.models` là danh sách cho phép/danh mục các mô hình OpenClaw có thể sử dụng, cùng với các bí danh. Dùng các mục `provider/*` để cho phép mọi mô hình được phát hiện từ một nhà cung cấp mà không cần liệt kê từng mô hình.
- `agents.defaults.utilityModel` là mô hình tùy chọn có chi phí thấp hơn dành cho các tác vụ nội bộ ngắn, chẳng hạn như tiêu đề phiên bảng điều khiển được tạo, tiêu đề luồng/chủ đề của kênh được hỗ trợ và tường thuật tiến độ. `agents.list[].utilityModel` theo từng tác tử sẽ ghi đè giá trị này. Khi chưa đặt, OpenClaw sử dụng mô hình nhỏ mặc định do nhà cung cấp chính khai báo nếu có (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), nếu không thì dùng mô hình chính của tác tử; đặt thành chuỗi rỗng để tắt định tuyến tiện ích. Các tác vụ tiện ích là những lệnh gọi mô hình riêng biệt và có thể gửi nội dung tác vụ có giới hạn đến nhà cung cấp mô hình đã chọn.
- `agents.defaults.imageModel` chỉ được dùng khi mô hình chính không thể nhận hình ảnh.
- `agents.defaults.pdfModel` được công cụ `pdf` sử dụng. Nếu chưa đặt, công cụ sẽ chuyển sang `imageModel`, rồi đến mô hình phiên/mặc định đã phân giải.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` và `videoGenerationModel` hỗ trợ các công cụ tạo nội dung đa phương tiện dùng chung. Nếu chưa đặt, mỗi công cụ sẽ suy ra một giá trị mặc định của nhà cung cấp có xác thực: trước tiên là nhà cung cấp mặc định hiện tại, sau đó là các nhà cung cấp đã đăng ký còn lại cho khả năng đó theo thứ tự mã định danh nhà cung cấp. Đặt `agents.defaults.mediaGenerationAutoProviderFallback: false` để tắt cơ chế suy luận giữa các nhà cung cấp đó trong khi vẫn giữ các phương án dự phòng tường minh.
- `agents.list[].model` theo từng tác tử (cùng với các liên kết) ghi đè `agents.defaults.model` — xem [Định tuyến đa tác tử](/vi/concepts/multi-agent).

Tham chiếu đầy đủ về khóa, giá trị mặc định và các ví dụ JSON5: [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults).

## Nguồn lựa chọn và mức độ nghiêm ngặt của phương án dự phòng

Cùng một `provider/model` hoạt động khác nhau tùy theo nguồn gốc của nó:

| Nguồn                                                                  | Hành vi                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Giá trị mặc định đã cấu hình (`agents.defaults.model.primary`, mô hình chính theo từng tác tử) | Điểm khởi đầu thông thường; sử dụng `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Dự phòng tự động                                                           | Trạng thái khôi phục tạm thời, được lưu dưới dạng `modelOverrideSource: "auto"`. OpenClaw định kỳ thăm dò lại mô hình chính ban đầu, xóa lựa chọn tự động khi khôi phục và thông báo các chuyển tiếp dự phòng/khôi phục một lần cho mỗi thay đổi trạng thái.                              |
| Lựa chọn phiên của người dùng                                                  | Chính xác và nghiêm ngặt. `/model`, trình chọn mô hình, `session_status(model=...)` và `sessions.patch` lưu `modelOverrideSource: "user"`. Nếu nhà cung cấp/mô hình đó không thể truy cập được, lượt chạy sẽ thất bại rõ ràng thay vì chuyển tiếp sang một mô hình đã cấu hình khác. |
| Cron `--model` / tải trọng `model`                                        | Mô hình chính theo từng công việc. Vẫn sử dụng các phương án dự phòng đã cấu hình trừ khi công việc cung cấp tải trọng `fallbacks` riêng (`fallbacks: []` buộc lượt chạy phải nghiêm ngặt).                                                                                                                    |

Các quy tắc lựa chọn khác:

- Việc thay đổi `agents.defaults.model.primary` không ghi lại các ghim phiên hiện có. Nếu trạng thái báo `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, hãy chạy `/model default` để xóa ghim.
- Các trình chọn mô hình mặc định và danh sách cho phép của CLI tuân theo `models.mode: "replace"` bằng cách chỉ liệt kê `models.providers.*.models` thay vì toàn bộ danh mục tích hợp sẵn.
- Trình chọn mô hình trong giao diện điều khiển yêu cầu Gateway cung cấp chế độ xem mô hình đã cấu hình: `agents.defaults.models` khi được đặt (bao gồm các mục ký tự đại diện `provider/*`), nếu không thì dùng `models.providers.*.models` cùng với các nhà cung cấp có thông tin xác thực khả dụng. Toàn bộ danh mục tích hợp sẵn chỉ dành cho các chế độ duyệt tường minh (`models.list` với `view: "all"`, hoặc `openclaw models list --all`).
- Các giao diện kiểm kê nhà cung cấp sử dụng `models.list` với `view: "provider-config"` để hiển thị các hàng `models.providers.*.models` do nguồn tạo mà không áp dụng danh sách cho phép của trình chọn.

Cơ chế đầy đủ: [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover).

## Chính sách mô hình nhanh

- Đặt mô hình chính thành mô hình thế hệ mới nhất, mạnh nhất mà bạn có thể sử dụng.
- Sử dụng các phương án dự phòng cho những tác vụ nhạy cảm về chi phí/độ trễ và các cuộc trò chuyện ít quan trọng hơn.
- Với tác tử hỗ trợ công cụ hoặc đầu vào không đáng tin cậy, tránh các cấp mô hình cũ hơn/yếu hơn.

## Thiết lập ban đầu

```bash
openclaw onboard
```

Thiết lập mô hình và xác thực cho các nhà cung cấp phổ biến mà không cần chỉnh sửa cấu hình thủ công, bao gồm OAuth theo gói thuê bao OpenAI Codex và Anthropic (khóa API hoặc tái sử dụng Claude CLI).

Khi chưa cấu hình mô hình chính, thiết lập khóa API OpenAI mới sẽ chọn
`openai/gpt-5.6`; mã định danh API trực tiếp không kèm định danh cấp sẽ phân giải thành cấp Sol. Thiết lập
OAuth ChatGPT/Codex mới sẽ chọn chính xác tham chiếu danh mục `openai/gpt-5.6-sol`.
Việc xác thực lại giữ nguyên mô hình chính tường minh hiện có, bao gồm
`openai/gpt-5.5`. Nếu tài khoản không thể sử dụng GPT-5.6, hãy chọn
`openai/gpt-5.5` một cách tường minh; OpenClaw không tự động hạ cấp âm thầm.

## "Mô hình không được phép" (và lý do phản hồi dừng lại)

Nếu `agents.defaults.models` được đặt, nó trở thành danh sách cho phép cho `/model` và các ghi đè phiên. Việc chọn một mô hình nằm ngoài danh sách cho phép đó sẽ trả về nội dung sau trước khi bất kỳ phản hồi thông thường nào được tạo:

```text
Mô hình "provider/model" không được phép. Dùng /models để liệt kê các nhà cung cấp hoặc /models <provider> để liệt kê các mô hình.
Thêm mô hình bằng lệnh: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Khắc phục bằng cách thêm mô hình vào `agents.defaults.models`, xóa hoàn toàn danh sách cho phép (xóa khóa) hoặc chọn một mô hình từ `/model list`. Nếu lệnh bị từ chối chứa ghi đè runtime như `/model openai/gpt-5.5 --runtime codex`, trước tiên hãy sửa danh sách cho phép, sau đó thử lại cùng lệnh `/model ... --runtime ...`.

Đối với các mô hình cục bộ/GGUF, danh sách cho phép cần tham chiếu đầy đủ có tiền tố nhà cung cấp, ví dụ `ollama/gemma4:26b` hoặc `lmstudio/Gemma4-26b-a4-it-gguf` — kiểm tra `openclaw models list --provider <provider>` để biết chuỗi chính xác. Khi danh sách cho phép đang hoạt động, chỉ tên tệp hoặc tên hiển thị là không đủ.

Để giới hạn nhà cung cấp mà không cần liệt kê mọi mô hình, hãy sử dụng các mục ký tự đại diện `provider/*`:

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

Sau đó, `/model`, `/models` và các trình chọn mô hình chỉ hiển thị danh mục được phát hiện cho những nhà cung cấp đó, đồng thời các mô hình mới có thể xuất hiện mà không cần chỉnh sửa danh sách cho phép. Kết hợp các mục `provider/model` chính xác với các mục `provider/*` để đưa vào một mô hình cụ thể từ nhà cung cấp khác.

Ví dụ về danh sách cho phép có bí danh:

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

<Accordion title="Chỉnh sửa danh sách cho phép an toàn từ CLI">
Sử dụng `--merge` cho các thay đổi bổ sung:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` từ chối việc gán đối tượng thuần cho `agents.defaults.models`, `models.providers` hoặc `models.providers.<id>.models` nếu chúng sẽ làm mất các mục hiện có; chỉ sử dụng `--replace` khi giá trị mới phải trở thành toàn bộ giá trị đích. Quy trình thiết lập nhà cung cấp tương tác và `openclaw configure --section model` đã hợp nhất các lựa chọn theo phạm vi nhà cung cấp vào danh sách cho phép, vì vậy việc thêm nhà cung cấp không làm mất các mục không liên quan; quy trình cấu hình giữ nguyên `agents.defaults.model.primary` hiện có. Các lệnh tường minh như `openclaw models auth login --provider <id> --set-default` và `openclaw models set <model>` vẫn thay thế mô hình chính.
</Accordion>

## `/model` trong trò chuyện

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` và `/model list` hiển thị bộ chọn đánh số nhỏ gọn (họ mô hình + các nhà cung cấp khả dụng); `/model <#>` chọn từ đó. Trên Discord, thao tác này mở các danh sách thả xuống nhà cung cấp/mô hình kèm bước Submit; trên Telegram, các lựa chọn trong bộ chọn chỉ áp dụng cho phiên và không bao giờ ghi đè giá trị mặc định lâu dài của tác nhân trong `openclaw.json`. `/models add` đã lỗi thời và trả về một thông báo thay vì đăng ký mô hình từ cuộc trò chuyện.
- `/model` lưu ngay lựa chọn phiên mới. Nếu tác nhân đang rảnh, lần chạy tiếp theo sẽ sử dụng lựa chọn đó ngay; nếu đã có một lần chạy đang hoạt động, việc chuyển đổi sẽ được xếp hàng cho điểm thử lại sạch tiếp theo (hoặc một điểm sau đó nếu hoạt động công cụ hoặc đầu ra phản hồi đã bắt đầu).
- `/model default` xóa lựa chọn phiên để phiên lại kế thừa lựa chọn chính đã cấu hình.
- Tham chiếu `/model` do người dùng chọn được áp dụng nghiêm ngặt cho phiên đó: nếu tham chiếu này không thể truy cập được, phản hồi sẽ thất bại một cách rõ ràng thay vì âm thầm chuyển dự phòng qua `agents.defaults.model.fallbacks`. Các giá trị mặc định đã cấu hình và mô hình chính của tác vụ cron vẫn sử dụng chuỗi dự phòng.
- `/model status` là chế độ xem chi tiết: các ứng viên xác thực cho từng nhà cung cấp và (khi được cấu hình) điểm cuối `baseUrl` của nhà cung cấp cùng chế độ `api`.
- Tham chiếu mô hình được phân tích bằng cách tách tại `/` đầu tiên; nhập `provider/model`. Nếu chính ID mô hình chứa `/` (kiểu OpenRouter), hãy thêm tiền tố nhà cung cấp, ví dụ: `/model openrouter/moonshotai/kimi-k2`. Nếu bỏ qua nhà cung cấp, OpenClaw sẽ thử: (1) khớp bí danh, (2) khớp duy nhất với nhà cung cấp đã cấu hình cho đúng ID mô hình không có tiền tố đó, (3) nhà cung cấp mặc định đã cấu hình (cơ chế dự phòng đã lỗi thời) — và nếu nhà cung cấp đó không còn cung cấp mô hình mặc định đã cấu hình, sẽ dùng nhà cung cấp/mô hình được cấu hình đầu tiên để tránh hiển thị giá trị mặc định cũ của một nhà cung cấp đã bị xóa.
- Tham chiếu mô hình được chuẩn hóa thành chữ thường; ngoài điều đó, ID nhà cung cấp phải khớp chính xác, vì vậy hãy dùng ID do plugin công bố.

Hành vi đầy đủ của lệnh và cấu hình: [Lệnh gạch chéo](/vi/tools/slash-commands).

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

`openclaw models` không có lệnh con là lối tắt cho `models status`, lệnh này cũng hiển thị thời điểm hết hạn OAuth cho các hồ sơ trong kho xác thực (mặc định cảnh báo trong vòng 24h). Các cờ đầy đủ, cấu trúc JSON và lệnh con của hồ sơ xác thực: [Tham chiếu CLI mô hình](/vi/cli/models).

<AccordionGroup>
  <Accordion title="Quét (các mô hình miễn phí của OpenRouter)">
    `openclaw models scan` kiểm tra danh mục mô hình miễn phí công khai của OpenRouter và có thể thăm dò trực tiếp các ứng viên về khả năng hỗ trợ công cụ và hình ảnh. Bản thân danh mục này là công khai, vì vậy các lượt quét chỉ lấy siêu dữ liệu (`--no-probe`) không cần khóa; việc thăm dò trực tiếp và `--set-default`/`--set-image` yêu cầu khóa API OpenRouter (hồ sơ xác thực hoặc `OPENROUTER_API_KEY`) và nếu không có khóa thì sẽ từ chối thực hiện, chỉ xuất siêu dữ liệu.

    Kết quả được xếp hạng theo: hỗ trợ hình ảnh, sau đó là độ trễ công cụ, kích thước ngữ cảnh, rồi số lượng tham số. Trong TTY, các kết quả đã thăm dò sẽ nhắc chọn phương án dự phòng theo cách tương tác; chế độ không tương tác cần `--yes` để chấp nhận các giá trị mặc định.

  </Accordion>
</AccordionGroup>

## Sổ đăng ký mô hình (`models.json`)

Các nhà cung cấp tùy chỉnh được cấu hình trong `models.providers` sẽ được ghi vào `models.json` trong thư mục tác nhân (mặc định là `~/.openclaw/agents/<agentId>/agent/models.json`). Danh mục của plugin nhà cung cấp được lưu riêng dưới dạng các phân đoạn danh mục được tạo và thuộc quyền sở hữu của plugin, đồng thời tự động được tải. Theo mặc định, tệp này được hợp nhất với cấu hình; đặt `models.mode: "replace"` để chỉ sử dụng các nhà cung cấp đã cấu hình.

<AccordionGroup>
  <Accordion title="Thứ tự ưu tiên của chế độ hợp nhất">
    Đối với các ID nhà cung cấp trùng khớp:

    - Giá trị `baseUrl` không rỗng đã có trong `models.json` của tác nhân được ưu tiên.
    - Giá trị `apiKey` không rỗng trong `models.json` chỉ được ưu tiên khi nhà cung cấp đó không do SecretRef quản lý trong ngữ cảnh cấu hình/hồ sơ xác thực hiện tại.
    - Các giá trị `apiKey` do SecretRef quản lý được làm mới từ các dấu nguồn thay vì lưu bí mật đã phân giải: tên biến môi trường đối với tham chiếu môi trường, `secretref-managed` đối với tham chiếu tệp/thực thi.
    - Các giá trị tiêu đề do SecretRef quản lý được làm mới theo cùng cách, sử dụng `secretref-env:ENV_VAR_NAME` cho tham chiếu môi trường.
    - Các giá trị `apiKey`/`baseUrl` trống hoặc bị thiếu trong `models.json` sẽ dùng `models.providers` trong cấu hình làm dự phòng.
    - Các trường nhà cung cấp khác được làm mới từ cấu hình và dữ liệu danh mục đã chuẩn hóa.

  </Accordion>
</AccordionGroup>

Việc duy trì dấu lấy nguồn làm căn cứ có thẩm quyền: OpenClaw ghi các dấu từ ảnh chụp cấu hình nguồn đang hoạt động (trước khi phân giải), không phải từ các giá trị bí mật thời gian chạy đã phân giải, mỗi khi tạo lại `models.json` — bao gồm cả các đường dẫn được điều khiển bằng lệnh như `openclaw agent`.

## Liên quan

- [Môi trường chạy tác nhân](/vi/concepts/agent-runtimes) — OpenClaw, Codex và các môi trường chạy vòng lặp tác nhân khác
- [Tham chiếu cấu hình](/vi/gateway/config-agents#agent-defaults) — các khóa cấu hình mô hình
- [Tạo hình ảnh](/vi/tools/image-generation) — cấu hình mô hình hình ảnh
- [Chuyển đổi dự phòng mô hình](/vi/concepts/model-failover) — các chuỗi dự phòng
- [Nhà cung cấp mô hình](/vi/concepts/model-providers) — định tuyến và xác thực nhà cung cấp
- [Tham chiếu CLI mô hình](/vi/cli/models) — tham chiếu đầy đủ về lệnh và cờ
- [Tạo nhạc](/vi/tools/music-generation) — cấu hình mô hình âm nhạc
- [Tạo video](/vi/tools/video-generation) — cấu hình mô hình video
