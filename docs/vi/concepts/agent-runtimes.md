---
read_when:
    - Bạn đang lựa chọn giữa OpenClaw, Codex, ACP hoặc một môi trường thực thi tác nhân gốc khác
    - Bạn bối rối trước các nhãn nhà cung cấp/mô hình/môi trường chạy trong trạng thái hoặc cấu hình
    - Bạn đang lập tài liệu về mức độ tương đương hỗ trợ cho một bộ khung chạy thử gốc
summary: Cách OpenClaw phân tách nhà cung cấp mô hình, mô hình, kênh và môi trường thực thi tác nhân
title: Môi trường chạy tác nhân
x-i18n:
    generated_at: "2026-07-12T07:47:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47634daec4f88afa26ba47f33e1ed54b5768381bedeb7de7730fdb766566da89
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Một **môi trường thực thi tác nhân** sở hữu một vòng lặp mô hình đã được chuẩn bị: nó nhận prompt,
điều khiển đầu ra của mô hình, xử lý các lệnh gọi công cụ gốc và trả lượt đã hoàn tất
về OpenClaw.

Môi trường thực thi rất dễ bị nhầm với nhà cung cấp vì cả hai đều xuất hiện gần phần
cấu hình mô hình. Chúng là các lớp khác nhau:

| Lớp                       | Ví dụ                                        | Ý nghĩa                                                                 |
| ------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| Nhà cung cấp              | `anthropic`, `github-copilot`, `openai`      | Cách OpenClaw xác thực, khám phá mô hình và đặt tên tham chiếu mô hình. |
| Mô hình                   | `claude-opus-4-6`, `gpt-5.6-sol`             | Mô hình được chọn cho lượt của tác nhân.                                |
| Môi trường thực thi tác nhân | `claude-cli`, `codex`, `copilot`, `openclaw` | Vòng lặp cấp thấp hoặc phần phụ trợ thực thi lượt đã được chuẩn bị.      |
| Kênh                      | Discord, Slack, Telegram, WhatsApp           | Nơi thông điệp đi vào và đi ra khỏi OpenClaw.                           |

Một **harness** là phần triển khai cung cấp môi trường thực thi tác nhân (thuật ngữ
trong mã). Ví dụ, harness Codex đi kèm triển khai môi trường thực thi `codex`.
Cấu hình công khai sử dụng `agentRuntime.id` trên các mục nhà cung cấp hoặc mô hình; các
khóa môi trường thực thi áp dụng cho toàn bộ tác nhân là dạng cũ và bị bỏ qua. `openclaw doctor --fix` loại bỏ
các ghim môi trường thực thi toàn tác nhân cũ và viết lại các tham chiếu mô hình môi trường thực thi cũ thành
tham chiếu nhà cung cấp/mô hình chuẩn, đồng thời bổ sung chính sách môi trường thực thi theo phạm vi mô hình khi cần.

Hai họ môi trường thực thi:

- **Harness nhúng** chạy bên trong vòng lặp tác nhân đã chuẩn bị của OpenClaw: môi trường
  thực thi `openclaw` tích hợp sẵn, cùng các harness Plugin đã đăng ký như
  `codex` và `copilot`.
- **Phần phụ trợ CLI** chạy một tiến trình CLI cục bộ trong khi vẫn giữ tham chiếu mô hình
  ở dạng chuẩn. Ví dụ, `anthropic/claude-opus-4-8` với
  `agentRuntime.id: "claude-cli"` theo phạm vi mô hình có nghĩa là “chọn mô hình Anthropic, thực thi
  thông qua Claude CLI”. `claude-cli` không phải là mã định danh harness nhúng và không được
  truyền vào quá trình lựa chọn AgentHarness.

Harness `copilot` là một harness Plugin bên ngoài riêng biệt, tùy chọn tham gia, dành cho
GitHub Copilot CLI; xem [môi trường thực thi tác nhân GitHub Copilot](/vi/plugins/copilot) để biết
quyết định dành cho người dùng giữa môi trường thực thi tác nhân PI, Codex và GitHub Copilot.

## Các bề mặt Codex

Một số bề mặt cùng sử dụng tên Codex:

| Bề mặt                                           | Tên/cấu hình OpenClaw                  | Chức năng                                                                                                           |
| ------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Môi trường thực thi app-server Codex gốc         | Tham chiếu mô hình `openai/*`          | Chạy các lượt tác nhân nhúng của OpenAI thông qua Codex app-server. Đây là cách thiết lập gói đăng ký ChatGPT/Codex thông thường. |
| Hồ sơ xác thực OAuth Codex                       | Hồ sơ OAuth `openai`                   | Lưu thông tin xác thực gói đăng ký ChatGPT/Codex mà harness Codex app-server sử dụng.                               |
| Bộ chuyển đổi ACP Codex                          | `runtime: "acp"`, `agentId: "codex"`   | Chạy Codex thông qua mặt phẳng điều khiển ACP/acpx bên ngoài. Chỉ dùng khi ACP/acpx được yêu cầu rõ ràng.            |
| Bộ lệnh điều khiển trò chuyện Codex gốc          | `/codex ...`                           | Liên kết, tiếp tục, điều hướng, dừng và kiểm tra các luồng Codex app-server từ trò chuyện.                           |
| Tuyến API OpenAI Platform cho các bề mặt không phải tác nhân | `openai/*` cộng xác thực bằng khóa API | Các API OpenAI trực tiếp như hình ảnh, embedding, giọng nói và thời gian thực.                                      |

Các bề mặt này cố ý độc lập với nhau. Việc bật Plugin `codex`
cung cấp các tính năng app-server gốc; `openclaw doctor --fix` chịu trách nhiệm
sửa chữa tuyến Codex cũ và dọn dẹp các ghim phiên lỗi thời. Việc chọn `openai/*`
cho mô hình tác nhân hiện có nghĩa là “chạy mô hình này thông qua Codex”, trừ khi đang sử dụng
một bề mặt API OpenAI không dành cho tác nhân.

Cách thiết lập gói đăng ký ChatGPT/Codex phổ biến sử dụng Codex OAuth để xác thực, nhưng
giữ tham chiếu mô hình ở dạng `openai/*` và chọn môi trường thực thi `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Điều đó có nghĩa là OpenClaw chọn một tham chiếu mô hình OpenAI, sau đó yêu cầu môi trường thực thi
Codex app-server chạy lượt tác nhân nhúng. Điều đó không có nghĩa là “sử dụng cơ chế
tính phí API”, cũng không có nghĩa là kênh, danh mục nhà cung cấp mô hình hoặc
kho phiên OpenClaw trở thành Codex.

Khi Plugin `codex` đi kèm được bật, hãy sử dụng bề mặt lệnh `/codex` gốc
(`/codex bind`, `/codex threads`, `/codex resume`, `/codex steer`,
`/codex stop`) để điều khiển Codex bằng ngôn ngữ tự nhiên thay vì ACP. Chỉ sử dụng ACP cho
Codex khi người dùng yêu cầu rõ ràng ACP/acpx hoặc đang kiểm thử đường dẫn
bộ chuyển đổi ACP. Claude Code, Gemini CLI, OpenCode, Cursor và các harness bên ngoài tương tự
vẫn sử dụng ACP.

Cây quyết định:

1. **Liên kết/điều khiển/luồng/tiếp tục/điều hướng/dừng Codex** -> bề mặt lệnh `/codex` gốc khi Plugin `codex` đi kèm được bật.
2. **Codex làm môi trường thực thi nhúng** hoặc trải nghiệm tác nhân Codex thông thường được hỗ trợ bởi gói đăng ký -> `openai/<model>`.
3. **OpenClaw được chọn rõ ràng cho một mô hình OpenAI** -> giữ tham chiếu mô hình là `openai/<model>` và đặt chính sách môi trường thực thi của nhà cung cấp/mô hình thành `agentRuntime.id: "openclaw"`. Hồ sơ OAuth `openai` đã chọn được định tuyến nội bộ thông qua cơ chế vận chuyển xác thực Codex của OpenClaw.
4. **Các tham chiếu mô hình Codex cũ trong cấu hình** -> sửa bằng `openclaw doctor --fix` thành `openai/<model>`; doctor giữ tuyến xác thực Codex bằng cách thêm `agentRuntime.id: "codex"` theo phạm vi nhà cung cấp/mô hình ở nơi tham chiếu mô hình cũ ngụ ý điều đó. Các tham chiếu mô hình **`codex-cli/*`** cũ được sửa thành cùng tuyến Codex app-server `openai/<model>`; OpenClaw không còn duy trì phần phụ trợ Codex CLI đi kèm.
5. **ACP, acpx hoặc bộ chuyển đổi ACP Codex được yêu cầu rõ ràng** -> `runtime: "acp"` và `agentId: "codex"`.
6. **Claude Code, Gemini CLI, OpenCode, Cursor, Droid hoặc một harness bên ngoài khác** -> ACP/acpx, không phải môi trường thực thi tác nhân con gốc.

| Ý bạn là...                                   | Hãy dùng...                                      |
| --------------------------------------------- | ------------------------------------------------ |
| Điều khiển trò chuyện/luồng Codex app-server  | `/codex ...` từ Plugin `codex` đi kèm            |
| Môi trường thực thi tác nhân nhúng Codex app-server | Tham chiếu mô hình tác nhân `openai/*`       |
| OAuth OpenAI Codex                            | Hồ sơ OAuth `openai`                             |
| Claude Code hoặc harness bên ngoài khác       | ACP/acpx                                         |

Để biết cách phân tách tiền tố trong họ OpenAI, xem [OpenAI](/vi/providers/openai) và
[Nhà cung cấp mô hình](/vi/concepts/model-providers). Để biết hợp đồng hỗ trợ môi trường thực thi
Codex, xem [Môi trường thực thi harness Codex](/vi/plugins/codex-harness-runtime#v1-support-contract).

## Quyền sở hữu môi trường thực thi

Các môi trường thực thi khác nhau sở hữu những phần khác nhau của vòng lặp:

| Bề mặt                         | OpenClaw nhúng                                  | Codex app-server                                                                    |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Chủ sở hữu vòng lặp mô hình    | OpenClaw, thông qua trình chạy nhúng OpenClaw   | Codex app-server                                                                    |
| Trạng thái luồng chuẩn         | Bản ghi hội thoại OpenClaw                      | Luồng Codex, cộng bản sao bản ghi hội thoại OpenClaw                                |
| Công cụ động của OpenClaw      | Vòng lặp công cụ OpenClaw gốc                   | Được bắc cầu thông qua bộ chuyển đổi Codex                                           |
| Công cụ shell và tệp gốc       | Đường dẫn OpenClaw                              | Công cụ gốc Codex, được bắc cầu thông qua các hook gốc khi được hỗ trợ               |
| Công cụ ngữ cảnh               | Cơ chế tập hợp ngữ cảnh gốc của OpenClaw        | OpenClaw chiếu ngữ cảnh đã tập hợp vào lượt Codex                                    |
| Compaction                     | OpenClaw hoặc công cụ ngữ cảnh đã chọn          | Compaction gốc Codex, cùng thông báo OpenClaw và duy trì bản sao                     |
| Phân phối qua kênh             | OpenClaw                                        | OpenClaw                                                                            |

Quy tắc thiết kế: nếu OpenClaw sở hữu bề mặt, nó có thể cung cấp hành vi hook Plugin
thông thường. Nếu môi trường thực thi gốc sở hữu bề mặt, OpenClaw cần các sự kiện môi trường thực thi
hoặc hook gốc. Nếu môi trường thực thi gốc sở hữu trạng thái luồng chuẩn,
OpenClaw tạo bản sao và chiếu ngữ cảnh thay vì viết lại các phần nội bộ không được hỗ trợ.

## Lựa chọn môi trường thực thi

OpenClaw phân giải một môi trường thực thi nhúng sau khi phân giải nhà cung cấp và mô hình, theo
thứ tự sau:

1. **Chính sách môi trường thực thi theo phạm vi mô hình** được ưu tiên. Chính sách này nằm trong một mục mô hình
   của nhà cung cấp đã cấu hình, hoặc trong `agents.defaults.models["provider/model"].agentRuntime`
   / `agents.list[].models["provider/model"].agentRuntime`. Ký tự đại diện nhà cung cấp
   như `agents.defaults.models["vllm/*"].agentRuntime` được áp dụng
   sau chính sách mô hình chính xác, để các mô hình nhà cung cấp được khám phá động có thể
   dùng chung một môi trường thực thi mà không ghi đè các ngoại lệ chính xác theo từng mô hình.
2. **Chính sách môi trường thực thi theo phạm vi nhà cung cấp**: `models.providers.<provider>.agentRuntime`.
3. **Chế độ `auto`**: các môi trường thực thi Plugin đã đăng ký có thể nhận các cặp nhà cung cấp/mô hình được hỗ trợ.
4. Nếu không có môi trường nào nhận lượt trong chế độ `auto`, OpenClaw sẽ dự phòng về
   `openclaw` làm môi trường thực thi tương thích. Hãy sử dụng mã định danh môi trường thực thi rõ ràng khi
   lượt chạy phải nghiêm ngặt.

Các ghim môi trường thực thi cho toàn bộ phiên và toàn bộ tác nhân bị bỏ qua: `OPENCLAW_AGENT_RUNTIME`,
trạng thái phiên `agentHarnessId`/`agentRuntimeOverride`, `agents.defaults.agentRuntime`
và `agents.list[].agentRuntime`. Chạy `openclaw doctor --fix` để loại bỏ cấu hình
môi trường thực thi toàn tác nhân lỗi thời và chuyển đổi các tham chiếu mô hình môi trường thực thi cũ khi
có thể bảo toàn ý định.

Các môi trường thực thi Plugin theo nhà cung cấp/mô hình được chỉ định rõ ràng sẽ đóng khi có lỗi: `agentRuntime.id: "codex"`
trên một nhà cung cấp hoặc mô hình có nghĩa là Codex, hoặc tạo ra lỗi lựa chọn/môi trường thực thi rõ ràng — nó
không bao giờ được âm thầm định tuyến trở lại OpenClaw. Chỉ `auto` mới có thể định tuyến một
lượt không khớp sang OpenClaw.

Bí danh phần phụ trợ CLI khác với mã định danh harness nhúng. Dạng Claude CLI được ưu tiên:

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

Các tham chiếu cũ như `claude-cli/claude-opus-4-7` vẫn được hỗ trợ để
tương thích, nhưng cấu hình mới nên giữ nhà cung cấp/mô hình ở dạng chuẩn và
đặt phần phụ trợ thực thi trong chính sách môi trường thực thi của nhà cung cấp/mô hình.

Các tham chiếu `codex-cli/*` cũ thì khác: doctor di chuyển chúng sang `openai/*` để
chúng chạy thông qua harness Codex app-server thay vì duy trì một phần phụ trợ Codex
CLI.

Chế độ `auto` cố ý thận trọng với hầu hết nhà cung cấp. Các mô hình tác nhân OpenAI
là ngoại lệ: cả môi trường thực thi chưa đặt và `auto` đều phân giải thành harness Codex.
Cấu hình môi trường thực thi OpenClaw rõ ràng vẫn là một tuyến tương thích tùy chọn tham gia
cho các lượt tác nhân `openai/*`; khi đi cùng một hồ sơ OAuth `openai` đã chọn,
OpenClaw định tuyến đường dẫn đó nội bộ thông qua cơ chế vận chuyển xác thực Codex
trong khi vẫn giữ tham chiếu mô hình công khai là `openai/*`. Các ghim phiên môi trường thực thi
OpenAI lỗi thời bị quá trình lựa chọn môi trường thực thi bỏ qua và có thể được dọn dẹp bằng
`openclaw doctor --fix`.

Nếu `openclaw doctor` cảnh báo rằng Plugin `codex` đang được bật trong khi các tham chiếu
mô hình Codex cũ vẫn còn trong cấu hình, hãy coi đó là trạng thái tuyến cũ và chạy
`openclaw doctor --fix` để viết lại thành `openai/*` với môi trường thực thi Codex.

## Môi trường thực thi tác nhân GitHub Copilot

Plugin `@openclaw/copilot` bên ngoài đăng ký runtime `copilot` tự chọn tham gia
được hỗ trợ bởi GitHub Copilot CLI (`@github/copilot-sdk`). Plugin này xác nhận
quyền sở hữu nhà cung cấp gói đăng ký chuẩn `github-copilot` và **không bao giờ** được
`auto` chọn. Chọn tham gia theo từng mô hình hoặc từng nhà cung cấp qua `agentRuntime.id`:

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

Harness xác nhận quyền sở hữu nhà cung cấp, runtime, khóa phiên CLI và tiền tố
hồ sơ xác thực của nó trong `extensions/copilot/doctor-contract-api.ts`, tệp mà
`openclaw doctor` tự động tải. Để biết về cấu hình, xác thực, sao chiếu bản ghi,
compaction, hợp đồng doctor khai báo và quyết định tổng quát hơn giữa SDK PI,
Codex và Copilot, hãy xem [runtime tác nhân GitHub Copilot](/vi/plugins/copilot).

## Hợp đồng tương thích

Khi một runtime không phải là OpenClaw, tài liệu của runtime đó nên nêu rõ các
bề mặt OpenClaw mà nó hỗ trợ:

| Câu hỏi                                         | Tại sao điều này quan trọng                                                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Ai sở hữu vòng lặp mô hình?                     | Xác định nơi diễn ra việc thử lại, tiếp tục công cụ và quyết định câu trả lời cuối cùng.                                |
| Ai sở hữu lịch sử luồng chuẩn?                  | Xác định liệu OpenClaw có thể chỉnh sửa lịch sử hay chỉ có thể sao chiếu lịch sử đó.                                    |
| Các công cụ động của OpenClaw có hoạt động không? | Nhắn tin, phiên, cron và các công cụ do OpenClaw sở hữu phụ thuộc vào điều này.                                          |
| Các hook công cụ động có hoạt động không?       | Các Plugin mong đợi `before_tool_call`, `after_tool_call` và middleware bao quanh các công cụ do OpenClaw sở hữu.       |
| Các hook công cụ gốc có hoạt động không?        | Shell, bản vá và các công cụ do runtime sở hữu cần hỗ trợ hook gốc để thực thi chính sách và quan sát.                  |
| Vòng đời của công cụ ngữ cảnh có chạy không?    | Các Plugin bộ nhớ và ngữ cảnh phụ thuộc vào vòng đời lắp ráp, nạp vào, sau lượt và compaction.                          |
| Dữ liệu compaction nào được cung cấp?            | Một số Plugin chỉ cần thông báo; các Plugin khác cần siêu dữ liệu về nội dung được giữ lại/loại bỏ.                    |
| Nội dung nào cố ý không được hỗ trợ?             | Người dùng không nên mặc định rằng nó tương đương OpenClaw khi runtime gốc sở hữu nhiều trạng thái hơn.                 |

Hợp đồng hỗ trợ runtime Codex được ghi lại trong
[runtime harness Codex](/vi/plugins/codex-harness-runtime#v1-support-contract).

## Nhãn trạng thái

Đầu ra trạng thái có thể hiển thị cả nhãn `Execution` và `Runtime`. Hãy đọc chúng
như thông tin chẩn đoán, không phải tên nhà cung cấp:

- Một tham chiếu mô hình như `openai/gpt-5.6-sol` là nhà cung cấp/mô hình đã chọn.
- Một mã định danh runtime như `codex` là vòng lặp đang thực thi lượt.
- Một nhãn kênh như Telegram hoặc Discord là nơi cuộc hội thoại đang diễn ra.

Nếu một lần chạy hiển thị runtime không mong đợi, trước tiên hãy kiểm tra chính sách
runtime của nhà cung cấp/mô hình đã chọn. Các ghim runtime phiên cũ không còn quyết định
việc định tuyến.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Runtime harness Codex](/vi/plugins/codex-harness-runtime)
- [Runtime tác nhân GitHub Copilot](/vi/plugins/copilot)
- [OpenAI](/vi/providers/openai)
- [Các Plugin harness tác nhân](/vi/plugins/sdk-agent-harness)
- [Vòng lặp tác nhân](/vi/concepts/agent-loop)
- [Mô hình](/vi/concepts/models)
- [Trạng thái](/vi/cli/status)
