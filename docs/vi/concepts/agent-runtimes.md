---
read_when:
    - Bạn đang lựa chọn giữa PI, Codex, ACP hoặc một môi trường chạy tác nhân gốc khác
    - Bạn bị nhầm lẫn bởi các nhãn nhà cung cấp/mô hình/thời gian chạy trong trạng thái hoặc cấu hình
    - Bạn đang ghi chép tính ngang bằng về hỗ trợ cho một bộ khung gốc
summary: Cách OpenClaw phân tách các nhà cung cấp mô hình, mô hình, kênh và môi trường chạy của tác nhân
title: Môi trường chạy của tác nhân
x-i18n:
    generated_at: "2026-05-10T19:30:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc5493bbcfb9fd60d4060455215780ca752040cc09b1b5a4d05bd84a59ce5a1e
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**Thời gian chạy tác nhân** là thành phần sở hữu một vòng lặp mô hình đã được chuẩn bị: nó
nhận prompt, điều khiển đầu ra của mô hình, xử lý các lệnh gọi công cụ gốc, và trả
lượt đã hoàn tất về OpenClaw.

Thời gian chạy dễ bị nhầm với nhà cung cấp vì cả hai đều xuất hiện gần phần
cấu hình mô hình. Chúng là các lớp khác nhau:

| Lớp           | Ví dụ                                 | Ý nghĩa                                                            |
| ------------- | ------------------------------------- | ------------------------------------------------------------------ |
| Nhà cung cấp  | `openai`, `anthropic`, `openai-codex` | Cách OpenClaw xác thực, khám phá mô hình, và đặt tên tham chiếu mô hình. |
| Mô hình       | `gpt-5.5`, `claude-opus-4-6`          | Mô hình được chọn cho lượt tác nhân.                               |
| Thời gian chạy tác nhân | `pi`, `codex`, `claude-cli`  | Vòng lặp hoặc backend cấp thấp thực thi lượt đã chuẩn bị.          |
| Kênh          | Telegram, Discord, Slack, WhatsApp    | Nơi thông điệp đi vào và rời khỏi OpenClaw.                        |

Bạn cũng sẽ thấy từ **bộ thực thi** trong mã. Bộ thực thi là phần triển khai
cung cấp một thời gian chạy tác nhân. Ví dụ, bộ thực thi Codex được đóng gói sẵn
triển khai thời gian chạy `codex`. Cấu hình công khai dùng `agentRuntime.id` trên
các mục nhà cung cấp hoặc mô hình; các khóa thời gian chạy toàn tác nhân là di sản và bị bỏ qua.
`openclaw doctor --fix` xóa các ghim thời gian chạy toàn tác nhân cũ và ghi lại
các tham chiếu mô hình thời gian chạy di sản thành tham chiếu nhà cung cấp/mô hình
chuẩn cùng với chính sách thời gian chạy theo phạm vi mô hình khi cần.

Có hai nhóm thời gian chạy:

- **Bộ thực thi nhúng** chạy bên trong vòng lặp tác nhân đã chuẩn bị của OpenClaw. Hiện tại nhóm này
  gồm thời gian chạy `pi` tích hợp sẵn cùng các bộ thực thi Plugin đã đăng ký như
  `codex`.
- **Backend CLI** chạy một tiến trình CLI cục bộ trong khi vẫn giữ tham chiếu mô hình
  ở dạng chuẩn. Ví dụ, `anthropic/claude-opus-4-7` với
  `agentRuntime.id: "claude-cli"` theo phạm vi mô hình nghĩa là "chọn mô hình Anthropic,
  thực thi qua Claude CLI." `claude-cli` không phải là id bộ thực thi nhúng
  và không được truyền vào lựa chọn AgentHarness.

## Các bề mặt Codex

Phần lớn sự nhầm lẫn đến từ nhiều bề mặt khác nhau cùng dùng tên Codex:

| Bề mặt                                           | Tên/cấu hình OpenClaw                | Việc nó làm                                                                                                    |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Thời gian chạy app-server Codex gốc              | tham chiếu mô hình `openai/*`        | Chạy các lượt tác nhân nhúng OpenAI qua app-server Codex. Đây là thiết lập đăng ký ChatGPT/Codex thông thường. |
| Hồ sơ xác thực Codex OAuth                       | nhà cung cấp xác thực `openai-codex` | Lưu xác thực đăng ký ChatGPT/Codex mà bộ thực thi app-server Codex tiêu thụ.                                   |
| Bộ chuyển đổi Codex ACP                          | `runtime: "acp"`, `agentId: "codex"` | Chạy Codex qua mặt phẳng điều khiển ACP/acpx bên ngoài. Chỉ dùng khi ACP/acpx được yêu cầu rõ ràng.            |
| Bộ lệnh điều khiển trò chuyện Codex gốc          | `/codex ...`                         | Liên kết, tiếp tục, điều hướng, dừng, và kiểm tra các luồng app-server Codex từ trò chuyện.                    |
| Tuyến OpenAI Platform API cho các bề mặt không phải tác nhân | `openai/*` cộng xác thực khóa API | Dùng cho các API OpenAI trực tiếp như hình ảnh, embedding, giọng nói, và thời gian thực.                       |

Các bề mặt đó độc lập có chủ ý. Bật Plugin `codex` làm cho các tính năng
app-server gốc khả dụng; `openclaw doctor --fix` sở hữu việc sửa tuyến
`openai-codex/*` di sản và dọn dẹp ghim phiên cũ. Chọn
`openai/*` cho mô hình tác nhân hiện có nghĩa là "chạy phần này qua Codex" trừ khi
một bề mặt OpenAI API không phải tác nhân đang được dùng.

Thiết lập đăng ký ChatGPT/Codex thông thường dùng Codex OAuth để xác thực, nhưng giữ
tham chiếu mô hình là `openai/*` và chọn thời gian chạy `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Điều đó nghĩa là OpenClaw chọn một tham chiếu mô hình OpenAI, sau đó yêu cầu thời gian chạy
app-server Codex chạy lượt tác nhân nhúng. Nó không có nghĩa là "dùng thanh toán API", và
cũng không có nghĩa là kênh, danh mục nhà cung cấp mô hình, hoặc kho phiên OpenClaw
trở thành Codex.

Khi Plugin `codex` được đóng gói sẵn được bật, điều khiển Codex bằng ngôn ngữ tự nhiên
nên dùng bề mặt lệnh `/codex` gốc (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) thay vì ACP. Chỉ dùng ACP cho
Codex khi người dùng yêu cầu rõ ràng ACP/acpx hoặc đang kiểm thử đường dẫn bộ chuyển đổi ACP.
Claude Code, Gemini CLI, OpenCode, Cursor, và các bộ thực thi bên ngoài tương tự
vẫn dùng ACP.

Đây là cây quyết định dành cho tác nhân:

1. Nếu người dùng yêu cầu **liên kết/điều khiển/luồng/tiếp tục/điều hướng/dừng Codex**, hãy dùng
   bề mặt lệnh `/codex` gốc khi Plugin `codex` được đóng gói sẵn được bật.
2. Nếu người dùng yêu cầu **Codex làm thời gian chạy nhúng** hoặc muốn trải nghiệm tác nhân Codex
   thông thường được hỗ trợ bởi đăng ký, hãy dùng `openai/<model>`.
3. Nếu người dùng chọn rõ ràng **PI cho một mô hình OpenAI**, hãy giữ tham chiếu mô hình
   là `openai/<model>` và đặt chính sách thời gian chạy nhà cung cấp/mô hình thành
   `agentRuntime.id: "pi"`. Hồ sơ xác thực `openai-codex` đã chọn được định tuyến
   nội bộ qua phương thức vận chuyển xác thực Codex di sản của PI.
4. Nếu cấu hình di sản vẫn chứa **tham chiếu mô hình `openai-codex/*`**, hãy sửa nó thành
   `openai/<model>` bằng `openclaw doctor --fix`; doctor giữ tuyến xác thực Codex
   bằng cách thêm `agentRuntime.id: "codex"` theo phạm vi nhà cung cấp/mô hình ở nơi
   tham chiếu mô hình cũ đã ngụ ý điều đó.
5. Nếu người dùng nói rõ **ACP**, **acpx**, hoặc **bộ chuyển đổi Codex ACP**, hãy dùng
   ACP với `runtime: "acp"` và `agentId: "codex"`.
6. Nếu yêu cầu dành cho **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, hoặc
   một bộ thực thi bên ngoài khác**, hãy dùng ACP/acpx, không dùng thời gian chạy tác nhân con gốc.

| Ý bạn là...                            | Dùng...                                      |
| -------------------------------------- | -------------------------------------------- |
| Điều khiển trò chuyện/luồng app-server Codex | `/codex ...` từ Plugin `codex` được đóng gói sẵn |
| Thời gian chạy tác nhân nhúng app-server Codex | tham chiếu mô hình tác nhân `openai/*`        |
| OpenAI Codex OAuth                     | hồ sơ xác thực `openai-codex`                 |
| Claude Code hoặc bộ thực thi bên ngoài khác | ACP/acpx                                     |

Để biết phần tách tiền tố họ OpenAI, xem [OpenAI](/vi/providers/openai) và
[Nhà cung cấp mô hình](/vi/concepts/model-providers). Để biết hợp đồng hỗ trợ thời gian chạy Codex,
xem [Thời gian chạy bộ thực thi Codex](/vi/plugins/codex-harness-runtime#v1-support-contract).

## Quyền sở hữu thời gian chạy

Các thời gian chạy khác nhau sở hữu các phần khác nhau của vòng lặp.

| Bề mặt                      | OpenClaw PI nhúng                        | App-server Codex                                                            |
| --------------------------- | ---------------------------------------- | --------------------------------------------------------------------------- |
| Chủ sở hữu vòng lặp mô hình | OpenClaw qua runner PI nhúng             | App-server Codex                                                            |
| Trạng thái luồng chuẩn      | Bản ghi OpenClaw                         | Luồng Codex, cộng bản sao bản ghi OpenClaw                                  |
| Công cụ động OpenClaw       | Vòng lặp công cụ OpenClaw gốc            | Được bắc cầu qua bộ chuyển đổi Codex                                        |
| Công cụ shell và tệp gốc    | Đường dẫn PI/OpenClaw                    | Công cụ gốc Codex, được bắc cầu qua hook gốc nơi được hỗ trợ                |
| Công cụ ngữ cảnh            | Lắp ráp ngữ cảnh OpenClaw gốc            | OpenClaw projects lắp ráp ngữ cảnh vào lượt Codex                           |
| Compaction                  | OpenClaw hoặc công cụ ngữ cảnh đã chọn   | Compaction gốc Codex, với thông báo OpenClaw và bảo trì bản sao             |
| Phân phối qua kênh          | OpenClaw                                 | OpenClaw                                                                    |

Phần tách quyền sở hữu này là quy tắc thiết kế chính:

- Nếu OpenClaw sở hữu bề mặt, OpenClaw có thể cung cấp hành vi hook Plugin bình thường.
- Nếu thời gian chạy gốc sở hữu bề mặt, OpenClaw cần sự kiện thời gian chạy hoặc hook gốc.
- Nếu thời gian chạy gốc sở hữu trạng thái luồng chuẩn, OpenClaw nên sao chép và chiếu ngữ cảnh, không ghi lại các phần nội bộ không được hỗ trợ.

## Lựa chọn thời gian chạy

OpenClaw chọn một thời gian chạy nhúng sau khi phân giải nhà cung cấp và mô hình:

1. Chính sách thời gian chạy theo phạm vi mô hình thắng. Chính sách này có thể nằm trong một mục mô hình
   nhà cung cấp đã cấu hình hoặc trong `agents.defaults.models["provider/model"].agentRuntime` /
   `agents.list[].models["provider/model"].agentRuntime`.
2. Chính sách thời gian chạy theo phạm vi nhà cung cấp đứng tiếp theo tại
   `models.providers.<provider>.agentRuntime`.
3. Trong chế độ `auto`, các thời gian chạy Plugin đã đăng ký có thể nhận các cặp nhà cung cấp/mô hình
   được hỗ trợ.
4. Nếu không có thời gian chạy nào nhận một lượt trong chế độ `auto`, OpenClaw dùng PI làm
   thời gian chạy tương thích. Dùng id thời gian chạy rõ ràng khi lần chạy phải
   nghiêm ngặt.

Các ghim thời gian chạy toàn phiên và toàn tác nhân bị bỏ qua. Điều đó bao gồm
`OPENCLAW_AGENT_RUNTIME`, trạng thái phiên `agentHarnessId`/`agentRuntimeOverride`,
`agents.defaults.agentRuntime`, và `agents.list[].agentRuntime`. Chạy
`openclaw doctor --fix` để xóa cấu hình thời gian chạy toàn tác nhân cũ và chuyển đổi
các tham chiếu mô hình thời gian chạy di sản ở nơi OpenClaw có thể giữ nguyên ý định.

Các thời gian chạy Plugin nhà cung cấp/mô hình rõ ràng sẽ đóng khi lỗi. Ví dụ,
`agentRuntime.id: "codex"` trên một nhà cung cấp hoặc mô hình nghĩa là Codex hoặc một
lỗi lựa chọn/thời gian chạy rõ ràng; nó không bao giờ được âm thầm định tuyến lại về PI.

Bí danh backend CLI khác với id bộ thực thi nhúng. Dạng Claude CLI được ưu tiên là:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Các tham chiếu di sản như `claude-cli/claude-opus-4-7` vẫn được hỗ trợ để
tương thích, nhưng cấu hình mới nên giữ nhà cung cấp/mô hình ở dạng chuẩn và đặt
backend thực thi trong chính sách thời gian chạy nhà cung cấp/mô hình.

Chế độ `auto` có chủ ý thận trọng với hầu hết nhà cung cấp. Mô hình tác nhân OpenAI
là ngoại lệ: thời gian chạy chưa đặt và `auto` đều phân giải về bộ thực thi Codex.
Cấu hình thời gian chạy PI rõ ràng vẫn là tuyến tương thích theo kiểu chọn tham gia cho
các lượt tác nhân `openai/*`; khi được ghép với một hồ sơ xác thực `openai-codex` đã chọn,
OpenClaw định tuyến PI nội bộ qua phương thức vận chuyển xác thực Codex di sản trong khi
vẫn giữ tham chiếu mô hình công khai là `openai/*`. Các ghim phiên OpenAI PI cũ
bị lựa chọn thời gian chạy bỏ qua và có thể được dọn bằng `openclaw doctor --fix`.

Nếu `openclaw doctor` cảnh báo rằng Plugin `codex` được bật trong khi
`openai-codex/*` vẫn còn trong cấu hình, hãy coi đó là trạng thái tuyến di sản. Chạy
`openclaw doctor --fix` để ghi lại nó thành `openai/*` với thời gian chạy Codex.

## Hợp đồng tương thích

Khi thời gian chạy không phải PI, nó nên ghi tài liệu các bề mặt OpenClaw mà nó hỗ trợ.
Dùng dạng này cho tài liệu thời gian chạy:

| Câu hỏi                               | Vì sao điều này quan trọng                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Ai sở hữu vòng lặp mô hình?               | Xác định nơi diễn ra việc thử lại, tiếp tục công cụ và quyết định câu trả lời cuối cùng.                   |
| Ai sở hữu lịch sử luồng chuẩn tắc?     | Xác định liệu OpenClaw có thể chỉnh sửa lịch sử hay chỉ phản chiếu lịch sử đó.                                   |
| Các công cụ động của OpenClaw có hoạt động không?        | Nhắn tin, phiên, Cron và các công cụ do OpenClaw sở hữu phụ thuộc vào điều này.                                 |
| Các hook công cụ động có hoạt động không?            | Các Plugin kỳ vọng `before_tool_call`, `after_tool_call` và middleware quanh các công cụ do OpenClaw sở hữu. |
| Các hook công cụ gốc có hoạt động không?             | Shell, patch và các công cụ do môi trường thực thi sở hữu cần hỗ trợ hook gốc cho chính sách và quan sát.        |
| Vòng đời của công cụ ngữ cảnh có chạy không? | Các Plugin bộ nhớ và ngữ cảnh phụ thuộc vào vòng đời assemble, ingest, after-turn và Compaction.      |
| Dữ liệu Compaction nào được hiển thị?       | Một số Plugin chỉ cần thông báo, trong khi các Plugin khác cần siêu dữ liệu được giữ lại/bị loại bỏ.                    |
| Điều gì được cố ý không hỗ trợ?     | Người dùng không nên giả định tính tương đương PI khi môi trường thực thi gốc sở hữu nhiều trạng thái hơn.                  |

Hợp đồng hỗ trợ môi trường thực thi Codex được ghi lại trong
[Môi trường thực thi harness Codex](/vi/plugins/codex-harness-runtime#v1-support-contract).

## Nhãn trạng thái

Đầu ra trạng thái có thể hiển thị cả nhãn `Execution` và `Runtime`. Hãy hiểu chúng như
chẩn đoán, không phải tên nhà cung cấp.

- Tham chiếu mô hình như `openai/gpt-5.5` cho bạn biết nhà cung cấp/mô hình đã chọn.
- ID môi trường thực thi như `codex` cho bạn biết vòng lặp nào đang thực thi lượt này.
- Nhãn kênh như Telegram hoặc Discord cho bạn biết cuộc trò chuyện đang diễn ra ở đâu.

Nếu một lần chạy vẫn hiển thị môi trường thực thi không mong đợi, trước tiên hãy kiểm tra chính sách môi trường thực thi
của nhà cung cấp/mô hình đã chọn. Các ghim môi trường thực thi phiên cũ không còn quyết định định tuyến.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [Môi trường thực thi harness Codex](/vi/plugins/codex-harness-runtime)
- [OpenAI](/vi/providers/openai)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Vòng lặp tác tử](/vi/concepts/agent-loop)
- [Mô hình](/vi/concepts/models)
- [Trạng thái](/vi/cli/status)
