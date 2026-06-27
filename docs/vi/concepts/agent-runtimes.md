---
read_when:
    - Bạn đang lựa chọn giữa OpenClaw, Codex, ACP hoặc một runtime tác tử gốc khác
    - Bạn bị nhầm lẫn bởi các nhãn nhà cung cấp/mô hình/runtime trong trạng thái hoặc cấu hình
    - Bạn đang ghi tài liệu về tính tương đương hỗ trợ cho một harness gốc
summary: Cách OpenClaw tách biệt nhà cung cấp mô hình, mô hình, kênh và runtime của tác tử
title: Môi trường chạy tác nhân
x-i18n:
    generated_at: "2026-06-27T17:21:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb818e682ffb11a073ee0053c0e7b7e2ea60239141aab7f96cd82520ded9d22f
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Một **runtime tác tử** là thành phần sở hữu một vòng lặp mô hình đã được chuẩn bị: nó
nhận prompt, điều khiển đầu ra của mô hình, xử lý các lệnh gọi công cụ gốc, và trả
lượt hoàn tất về OpenClaw.

Runtime dễ bị nhầm với nhà cung cấp vì cả hai đều xuất hiện gần phần cấu hình mô
hình. Chúng là các lớp khác nhau:

| Lớp           | Ví dụ                                        | Ý nghĩa                                                             |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Nhà cung cấp  | `openai`, `anthropic`, `github-copilot`      | Cách OpenClaw xác thực, khám phá mô hình, và đặt tên model refs.    |
| Mô hình       | `gpt-5.5`, `claude-opus-4-6`                 | Mô hình được chọn cho lượt tác tử.                                  |
| Runtime tác tử | `openclaw`, `codex`, `copilot`, `claude-cli` | Vòng lặp hoặc backend cấp thấp thực thi lượt đã chuẩn bị.           |
| Kênh          | Telegram, Discord, Slack, WhatsApp           | Nơi tin nhắn đi vào và rời khỏi OpenClaw.                           |

Bạn cũng sẽ thấy từ **harness** trong mã. Harness là phần triển khai cung cấp một
runtime tác tử. Ví dụ, harness Codex được đóng gói sẵn triển khai runtime
`codex`. Cấu hình công khai dùng `agentRuntime.id` trên các mục nhà cung cấp
hoặc mô hình; các khóa runtime toàn tác tử là di sản và bị bỏ qua.
`openclaw doctor --fix` xóa các ghim runtime toàn tác tử cũ và viết lại các
model refs runtime di sản thành các provider/model refs chuẩn, cộng với chính
sách runtime phạm vi mô hình khi cần.

Có hai họ runtime:

- **Harness nhúng** chạy bên trong vòng lặp tác tử đã chuẩn bị của OpenClaw. Hiện
  nay gồm runtime tích hợp sẵn `openclaw` cùng các harness plugin đã đăng ký như
  `codex` và `copilot`.
- **Backend CLI** chạy một tiến trình CLI cục bộ trong khi vẫn giữ model ref
  chuẩn. Ví dụ, `anthropic/claude-opus-4-8` với
  `agentRuntime.id: "claude-cli"` trong phạm vi mô hình có nghĩa là "chọn mô
  hình Anthropic, thực thi qua Claude CLI." `claude-cli` không phải là id harness
  nhúng và không được truyền vào lựa chọn AgentHarness.

Harness `copilot` là một harness plugin ngoài, riêng biệt và cần bật tường minh
cho GitHub Copilot CLI; xem [runtime tác tử GitHub Copilot](/vi/plugins/copilot)
để biết quyết định phía người dùng giữa PI, Codex, và runtime tác tử GitHub Copilot.

## Các bề mặt Codex

Phần lớn nhầm lẫn đến từ nhiều bề mặt khác nhau cùng dùng tên Codex:

| Bề mặt                                           | Tên/cấu hình OpenClaw                 | Chức năng                                                                                                      |
| ------------------------------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Runtime app-server Codex gốc                     | `openai/*` model refs                 | Chạy các lượt tác tử nhúng OpenAI qua app-server Codex. Đây là thiết lập thuê bao ChatGPT/Codex thông thường. |
| Hồ sơ xác thực OAuth Codex                       | Hồ sơ OAuth `openai`                  | Lưu xác thực thuê bao ChatGPT/Codex mà harness app-server Codex sử dụng.                                      |
| Bộ chuyển đổi ACP Codex                          | `runtime: "acp"`, `agentId: "codex"`  | Chạy Codex qua mặt phẳng điều khiển ACP/acpx bên ngoài. Chỉ dùng khi ACP/acpx được yêu cầu tường minh.        |
| Bộ lệnh điều khiển chat Codex gốc                | `/codex ...`                          | Liên kết, tiếp tục, điều hướng, dừng, và kiểm tra các luồng app-server Codex từ chat.                         |
| Tuyến OpenAI Platform API cho bề mặt không phải tác tử | `openai/*` cộng xác thực API-key | Dùng cho các API OpenAI trực tiếp như hình ảnh, embeddings, giọng nói, và realtime.                           |

Các bề mặt đó được cố ý tách độc lập. Bật plugin `codex` làm cho các tính năng
app-server gốc khả dụng; `openclaw doctor --fix` sở hữu việc sửa tuyến Codex di
sản và dọn dẹp ghim phiên cũ. Chọn `openai/*` cho một mô hình tác tử hiện có
nghĩa là "chạy cái này qua Codex" trừ khi đang dùng một bề mặt OpenAI API không
phải tác tử.

Thiết lập thuê bao ChatGPT/Codex phổ biến dùng OAuth Codex để xác thực, nhưng giữ
model ref là `openai/*` và chọn runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Điều đó có nghĩa là OpenClaw chọn một model ref OpenAI, rồi yêu cầu runtime
app-server Codex chạy lượt tác tử nhúng. Nó không có nghĩa là "dùng thanh toán
API," và không có nghĩa là kênh, danh mục nhà cung cấp mô hình, hoặc kho phiên
OpenClaw trở thành Codex.

Khi plugin `codex` được đóng gói sẵn được bật, điều khiển Codex bằng ngôn ngữ tự
nhiên nên dùng bề mặt lệnh `/codex` gốc (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) thay vì ACP. Chỉ dùng ACP cho
Codex khi người dùng yêu cầu ACP/acpx tường minh hoặc đang kiểm thử đường dẫn bộ
chuyển đổi ACP. Claude Code, Gemini CLI, OpenCode, Cursor, và các harness ngoài
tương tự vẫn dùng ACP.

Đây là cây quyết định dành cho tác tử:

1. Nếu người dùng yêu cầu **liên kết/điều khiển/luồng/tiếp tục/điều hướng/dừng Codex**, hãy dùng
   bề mặt lệnh `/codex` gốc khi plugin `codex` được đóng gói sẵn đã bật.
2. Nếu người dùng yêu cầu **Codex làm runtime nhúng** hoặc muốn trải nghiệm tác tử
   Codex thông thường được hỗ trợ bằng thuê bao, hãy dùng `openai/<model>`.
3. Nếu người dùng chọn tường minh **OpenClaw cho một mô hình OpenAI**, giữ model ref
   là `openai/<model>` và đặt chính sách runtime nhà cung cấp/mô hình thành
   `agentRuntime.id: "openclaw"`. Một hồ sơ OAuth `openai` đã chọn được định tuyến
   nội bộ qua transport xác thực Codex của OpenClaw.
4. Nếu cấu hình di sản vẫn chứa **legacy Codex model refs**, hãy sửa thành
   `openai/<model>` bằng `openclaw doctor --fix`; doctor giữ tuyến xác thực Codex
   bằng cách thêm `agentRuntime.id: "codex"` theo phạm vi nhà cung cấp/mô hình tại
   nơi model ref cũ đã ngụ ý điều đó.
   Các **`codex-cli/*` model refs** di sản sửa về cùng tuyến app-server Codex
   `openai/<model>`; OpenClaw không còn giữ backend Codex CLI đóng gói sẵn.
5. Nếu người dùng nói tường minh **ACP**, **acpx**, hoặc **bộ chuyển đổi ACP Codex**, hãy dùng
   ACP với `runtime: "acp"` và `agentId: "codex"`.
6. Nếu yêu cầu dành cho **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, hoặc
   một harness ngoài khác**, hãy dùng ACP/acpx, không dùng runtime tác tử con gốc.

| Ý bạn là...                              | Dùng...                                      |
| ---------------------------------------- | -------------------------------------------- |
| Điều khiển chat/luồng app-server Codex   | `/codex ...` từ plugin `codex` đóng gói sẵn  |
| Runtime tác tử nhúng app-server Codex    | `openai/*` agent model refs                  |
| OAuth OpenAI Codex                       | Hồ sơ OAuth `openai`                         |
| Claude Code hoặc harness ngoài khác      | ACP/acpx                                     |

Để biết phần tách tiền tố họ OpenAI, xem [OpenAI](/vi/providers/openai) và
[Nhà cung cấp mô hình](/vi/concepts/model-providers). Để biết hợp đồng hỗ trợ
runtime Codex, xem [runtime harness Codex](/vi/plugins/codex-harness-runtime#v1-support-contract).

## Quyền sở hữu runtime

Các runtime khác nhau sở hữu các phần khác nhau của vòng lặp.

| Bề mặt                      | OpenClaw nhúng                                | App-server Codex                                                           |
| --------------------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| Chủ sở hữu vòng lặp mô hình | OpenClaw qua runner nhúng OpenClaw            | App-server Codex                                                           |
| Trạng thái luồng chuẩn      | Bản ghi OpenClaw                              | Luồng Codex, cộng bản sao bản ghi OpenClaw                                 |
| Công cụ động OpenClaw       | Vòng lặp công cụ OpenClaw gốc                 | Được bắc cầu qua bộ chuyển đổi Codex                                       |
| Công cụ shell và tệp gốc    | Đường dẫn OpenClaw                            | Công cụ gốc Codex, được bắc cầu qua hook gốc nơi được hỗ trợ               |
| Bộ máy ngữ cảnh             | Lắp ráp ngữ cảnh OpenClaw gốc                 | OpenClaw lắp ráp ngữ cảnh dự án vào lượt Codex                             |
| Compaction                  | OpenClaw hoặc bộ máy ngữ cảnh đã chọn         | Compaction gốc Codex, với thông báo OpenClaw và bảo trì bản sao            |
| Phân phối kênh              | OpenClaw                                      | OpenClaw                                                                   |

Phần tách quyền sở hữu này là quy tắc thiết kế chính:

- Nếu OpenClaw sở hữu bề mặt, OpenClaw có thể cung cấp hành vi hook plugin thông thường.
- Nếu runtime gốc sở hữu bề mặt, OpenClaw cần sự kiện runtime hoặc hook gốc.
- Nếu runtime gốc sở hữu trạng thái luồng chuẩn, OpenClaw nên sao chiếu và chiếu ngữ cảnh, không viết lại các phần nội bộ không được hỗ trợ.

## Lựa chọn runtime

OpenClaw chọn một runtime nhúng sau khi phân giải nhà cung cấp và mô hình:

1. Chính sách runtime phạm vi mô hình thắng. Chính sách này có thể nằm trong mục
   mô hình nhà cung cấp đã cấu hình hoặc trong `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`. Ký tự đại diện nhà cung cấp
   như `agents.defaults.models["vllm/*"].agentRuntime` áp dụng sau chính sách mô
   hình chính xác, để các mô hình nhà cung cấp được khám phá động có thể dùng chung
   một runtime mà không ghi đè các ngoại lệ theo từng mô hình chính xác.
2. Chính sách runtime phạm vi nhà cung cấp đứng tiếp theo tại
   `models.providers.<provider>.agentRuntime`.
3. Trong chế độ `auto`, các runtime plugin đã đăng ký có thể nhận các cặp nhà cung cấp/mô hình được hỗ trợ.
4. Nếu không runtime nào nhận một lượt trong chế độ `auto`, OpenClaw dùng `openclaw`
   làm runtime tương thích. Dùng một id runtime tường minh khi lượt chạy phải nghiêm ngặt.

Các ghim runtime toàn phiên và toàn tác tử bị bỏ qua. Điều đó bao gồm
`OPENCLAW_AGENT_RUNTIME`, trạng thái phiên `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime`, và `agents.list[].agentRuntime`. Chạy
`openclaw doctor --fix` để xóa cấu hình runtime toàn tác tử cũ và chuyển đổi
các model refs runtime di sản tại nơi OpenClaw có thể giữ nguyên ý định.

Các runtime plugin nhà cung cấp/mô hình tường minh sẽ fail closed. Ví dụ,
`agentRuntime.id: "codex"` trên một nhà cung cấp hoặc mô hình có nghĩa là Codex
hoặc một lỗi lựa chọn/runtime rõ ràng; nó không bao giờ được định tuyến âm thầm
trở lại OpenClaw.

Alias backend CLI khác với id harness nhúng. Dạng Claude CLI được khuyến nghị là:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Các ref di sản như `claude-cli/claude-opus-4-7` vẫn được hỗ trợ để tương thích,
nhưng cấu hình mới nên giữ nhà cung cấp/mô hình ở dạng chuẩn và đặt backend thực
thi trong chính sách runtime nhà cung cấp/mô hình.

Các ref `codex-cli/*` di sản thì khác: doctor di chuyển chúng sang `openai/*` để
chúng chạy qua harness app-server Codex thay vì giữ một backend Codex CLI.

Chế độ `auto` được cố ý bảo thủ với hầu hết nhà cung cấp. Mô hình tác tử OpenAI
là ngoại lệ: runtime chưa đặt và `auto` đều phân giải về harness Codex. Cấu hình
runtime OpenClaw tường minh vẫn là tuyến tương thích cần chọn chủ động cho các
lượt tác tử `openai/*`; khi ghép với một hồ sơ OAuth `openai` đã chọn,
OpenClaw định tuyến đường dẫn đó nội bộ qua transport xác thực Codex trong khi
giữ model ref công khai là `openai/*`. Các ghim phiên runtime OpenAI cũ bị lựa
chọn runtime bỏ qua và có thể được dọn bằng `openclaw doctor --fix`.

Nếu `openclaw doctor` cảnh báo rằng Plugin `codex` đang được bật trong khi
các tham chiếu mô hình Codex cũ vẫn còn trong cấu hình, hãy xem đó là trạng thái tuyến cũ. Chạy
`openclaw doctor --fix` để viết lại nó thành `openai/*` với runtime Codex.

## Runtime tác nhân GitHub Copilot

Plugin bên ngoài `@openclaw/copilot` đăng ký một runtime `copilot` cần chọn bật
được hỗ trợ bởi GitHub Copilot CLI (`@github/copilot-sdk`). Nó nhận
nhà cung cấp đăng ký chính tắc `github-copilot` và **không bao giờ** được chọn bởi
`auto`. Chọn bật theo từng mô hình hoặc từng nhà cung cấp qua `agentRuntime.id`:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/gpt-5.5",
      models: {
        "github-copilot/gpt-5.5": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Harness nhận nhà cung cấp, runtime, khóa phiên CLI và tiền tố hồ sơ xác thực
của nó trong `extensions/copilot/doctor-contract-api.ts`, tệp mà
`openclaw doctor` tự động tải. Về cấu hình, xác thực, phản chiếu bản ghi cuộc hội thoại,
Compaction, hợp đồng doctor khai báo và quyết định rộng hơn giữa PI, Codex và
Copilot SDK, xem [Runtime tác nhân GitHub Copilot](/vi/plugins/copilot).

## Hợp đồng tương thích

Khi runtime không phải là OpenClaw, nó nên ghi lại các bề mặt OpenClaw mà nó hỗ trợ.
Dùng dạng này cho tài liệu runtime:

| Câu hỏi                                | Vì sao điều này quan trọng                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Ai sở hữu vòng lặp mô hình?            | Xác định nơi diễn ra việc thử lại, tiếp tục công cụ và quyết định câu trả lời cuối cùng.          |
| Ai sở hữu lịch sử luồng chính tắc?     | Xác định liệu OpenClaw có thể chỉnh sửa lịch sử hay chỉ phản chiếu lịch sử đó.                    |
| Công cụ động của OpenClaw có hoạt động không? | Nhắn tin, phiên, Cron và các công cụ do OpenClaw sở hữu phụ thuộc vào điều này.              |
| Hook công cụ động có hoạt động không?  | Plugin kỳ vọng `before_tool_call`, `after_tool_call` và middleware quanh các công cụ do OpenClaw sở hữu. |
| Hook công cụ gốc có hoạt động không?   | Shell, patch và các công cụ do runtime sở hữu cần hỗ trợ hook gốc cho chính sách và quan sát.     |
| Vòng đời công cụ ngữ cảnh có chạy không? | Plugin bộ nhớ và ngữ cảnh phụ thuộc vào vòng đời assemble, ingest, after-turn và Compaction.    |
| Dữ liệu Compaction nào được phơi bày?  | Một số Plugin chỉ cần thông báo, trong khi những Plugin khác cần metadata được giữ/bị bỏ.         |
| Điều gì được cố ý không hỗ trợ?        | Người dùng không nên giả định tương đương với OpenClaw khi runtime gốc sở hữu nhiều trạng thái hơn. |

Hợp đồng hỗ trợ runtime Codex được ghi lại trong
[Runtime harness Codex](/vi/plugins/codex-harness-runtime#v1-support-contract).

## Nhãn trạng thái

Đầu ra trạng thái có thể hiển thị cả nhãn `Execution` và `Runtime`. Hãy đọc chúng như
thông tin chẩn đoán, không phải tên nhà cung cấp.

- Tham chiếu mô hình như `openai/gpt-5.5` cho bạn biết nhà cung cấp/mô hình đã chọn.
- ID runtime như `codex` cho bạn biết vòng lặp nào đang thực thi lượt.
- Nhãn kênh như Telegram hoặc Discord cho bạn biết cuộc trò chuyện đang diễn ra ở đâu.

Nếu một lần chạy vẫn hiển thị runtime không mong đợi, trước tiên hãy kiểm tra chính sách runtime
của nhà cung cấp/mô hình đã chọn. Các ghim runtime phiên cũ không còn quyết định định tuyến.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Runtime tác nhân GitHub Copilot](/vi/plugins/copilot)
- [OpenAI](/vi/providers/openai)
- [Plugin harness tác nhân](/vi/plugins/sdk-agent-harness)
- [Vòng lặp tác nhân](/vi/concepts/agent-loop)
- [Mô hình](/vi/concepts/models)
- [Trạng thái](/vi/cli/status)
