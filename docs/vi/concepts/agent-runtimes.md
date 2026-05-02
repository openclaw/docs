---
read_when:
    - Bạn đang lựa chọn giữa PI, Codex, ACP hoặc một môi trường chạy tác nhân gốc khác
    - Bạn thấy khó hiểu về các nhãn nhà cung cấp/mô hình/thời gian chạy trong trạng thái hoặc cấu hình
    - Bạn đang ghi tài liệu về tính tương đương hỗ trợ cho một bộ khung gốc
summary: Cách OpenClaw tách biệt nhà cung cấp mô hình, mô hình, kênh và môi trường chạy tác tử
title: Môi trường chạy của tác tử
x-i18n:
    generated_at: "2026-05-02T10:38:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: bae2dd55491e5411983da942b2bdc4868d3b2cb5a4eb5d94fbb5a779dc4d679a
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Một **thời gian chạy tác tử** là thành phần sở hữu một vòng lặp mô hình đã chuẩn bị: nó
nhận prompt, điều khiển đầu ra của mô hình, xử lý các lệnh gọi công cụ gốc và trả về
lượt hoàn tất cho OpenClaw.

Thời gian chạy rất dễ bị nhầm với nhà cung cấp vì cả hai đều xuất hiện gần phần
cấu hình mô hình. Chúng là các lớp khác nhau:

| Lớp           | Ví dụ                                 | Ý nghĩa                                                             |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Nhà cung cấp  | `openai`, `anthropic`, `openai-codex` | Cách OpenClaw xác thực, khám phá mô hình và đặt tên tham chiếu mô hình. |
| Mô hình       | `gpt-5.5`, `claude-opus-4-6`          | Mô hình được chọn cho lượt tác tử.                                  |
| Thời gian chạy tác tử | `pi`, `codex`, `claude-cli`    | Vòng lặp hoặc phần phụ trợ cấp thấp thực thi lượt đã chuẩn bị.      |
| Kênh          | Telegram, Discord, Slack, WhatsApp    | Nơi tin nhắn đi vào và rời khỏi OpenClaw.                           |

Bạn cũng sẽ thấy từ **bộ khung thực thi** trong mã. Bộ khung thực thi là phần triển khai
cung cấp một thời gian chạy tác tử. Ví dụ: bộ khung thực thi Codex đi kèm
triển khai thời gian chạy `codex`. Cấu hình công khai dùng `agentRuntime.id`; `openclaw
doctor --fix` viết lại các khóa chính sách thời gian chạy cũ về dạng đó.

Có hai họ thời gian chạy:

- **Bộ khung thực thi nhúng** chạy bên trong vòng lặp tác tử đã chuẩn bị của OpenClaw. Hiện tại đây
  là thời gian chạy `pi` tích hợp sẵn cùng với các bộ khung thực thi Plugin đã đăng ký như
  `codex`.
- **Phần phụ trợ CLI** chạy một tiến trình CLI cục bộ trong khi vẫn giữ tham chiếu mô hình
  chuẩn. Ví dụ: `anthropic/claude-opus-4-7` với
  `agentRuntime.id: "claude-cli"` có nghĩa là "chọn mô hình Anthropic, thực thi
  thông qua Claude CLI." `claude-cli` không phải là id bộ khung thực thi nhúng và không được
  truyền vào lựa chọn AgentHarness.

## Các bề mặt Codex

Phần lớn nhầm lẫn đến từ việc nhiều bề mặt khác nhau cùng dùng tên Codex:

| Bề mặt                                               | Tên/cấu hình OpenClaw                       | Chức năng                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Thời gian chạy máy chủ ứng dụng Codex gốc            | `openai/*` cộng với `agentRuntime.id: "codex"` | Chạy lượt tác tử nhúng thông qua máy chủ ứng dụng Codex. Đây là thiết lập thuê bao ChatGPT/Codex thông thường. |
| Tuyến nhà cung cấp OAuth Codex                       | tham chiếu mô hình `openai-codex/*`        | Dùng OAuth thuê bao ChatGPT/Codex thông qua trình chạy OpenClaw PI thông thường.                           |
| Bộ điều hợp ACP Codex                                | `runtime: "acp"`, `agentId: "codex"`       | Chạy Codex thông qua mặt phẳng điều khiển ACP/acpx bên ngoài. Chỉ dùng khi ACP/acpx được yêu cầu rõ ràng.  |
| Bộ lệnh điều khiển chat Codex gốc                    | `/codex ...`                               | Liên kết, tiếp tục, điều hướng, dừng và kiểm tra các luồng máy chủ ứng dụng Codex từ chat.                 |
| Tuyến OpenAI Platform API cho các mô hình kiểu GPT/Codex | tham chiếu mô hình `openai/*`             | Dùng xác thực bằng khóa API OpenAI trừ khi một ghi đè thời gian chạy, như `agentRuntime.id: "codex"`, chạy lượt đó. |

Các bề mặt đó được cố ý tách biệt. Bật Plugin `codex` làm cho
các tính năng máy chủ ứng dụng gốc khả dụng; nó không viết lại
`openai-codex/*` thành `openai/*`, không thay đổi các phiên hiện có và không
biến ACP thành mặc định của Codex. Chọn `openai-codex/*` có nghĩa là "dùng tuyến nhà cung cấp
OAuth Codex" trừ khi bạn riêng biệt ép dùng một thời gian chạy.

Thiết lập thuê bao ChatGPT/Codex phổ biến dùng OAuth Codex để xác thực, nhưng giữ
tham chiếu mô hình là `openai/*` và chọn thời gian chạy `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Điều đó có nghĩa là OpenClaw chọn một tham chiếu mô hình OpenAI, rồi yêu cầu thời gian chạy máy chủ ứng dụng Codex
chạy lượt tác tử nhúng. Nó không có nghĩa là "dùng thanh toán API", và
nó không có nghĩa là kênh, danh mục nhà cung cấp mô hình hoặc kho phiên OpenClaw
trở thành Codex.

Khi Plugin `codex` đi kèm được bật, điều khiển Codex bằng ngôn ngữ tự nhiên
nên dùng bề mặt lệnh `/codex` gốc (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) thay vì ACP. Chỉ dùng ACP cho
Codex khi người dùng yêu cầu rõ ràng ACP/acpx hoặc đang kiểm thử đường dẫn bộ điều hợp ACP.
Claude Code, Gemini CLI, OpenCode, Cursor và các bộ khung thực thi bên ngoài tương tự
vẫn dùng ACP.

Đây là cây quyết định dành cho tác tử:

1. Nếu người dùng yêu cầu **liên kết/điều khiển/luồng/tiếp tục/điều hướng/dừng Codex**, hãy dùng
   bề mặt lệnh `/codex` gốc khi Plugin `codex` đi kèm được bật.
2. Nếu người dùng yêu cầu **Codex làm thời gian chạy nhúng** hoặc muốn trải nghiệm tác tử Codex
   thông thường được hỗ trợ bằng thuê bao, hãy dùng
   `openai/<model>` với `agentRuntime.id: "codex"`.
3. Nếu người dùng yêu cầu **xác thực OAuth/thuê bao Codex trên trình chạy OpenClaw
   thông thường**, hãy dùng `openai-codex/<model>` và giữ thời gian chạy là PI.
4. Nếu người dùng nói rõ **ACP**, **acpx** hoặc **bộ điều hợp ACP Codex**, hãy dùng
   ACP với `runtime: "acp"` và `agentId: "codex"`.
5. Nếu yêu cầu dành cho **Claude Code, Gemini CLI, OpenCode, Cursor, Droid hoặc
   một bộ khung thực thi bên ngoài khác**, hãy dùng ACP/acpx, không dùng thời gian chạy tác tử con gốc.

| Bạn muốn nói...                       | Hãy dùng...                                  |
| ------------------------------------- | -------------------------------------------- |
| Điều khiển chat/luồng máy chủ ứng dụng Codex | `/codex ...` từ Plugin `codex` đi kèm |
| Thời gian chạy tác tử nhúng máy chủ ứng dụng Codex | `agentRuntime.id: "codex"`                   |
| OAuth OpenAI Codex trên trình chạy PI | tham chiếu mô hình `openai-codex/*`          |
| Claude Code hoặc bộ khung thực thi bên ngoài khác | ACP/acpx                                     |

Về phần tách tiền tố họ OpenAI, xem [OpenAI](/vi/providers/openai) và
[Nhà cung cấp mô hình](/vi/concepts/model-providers). Về hợp đồng hỗ trợ thời gian chạy Codex,
xem [Bộ khung thực thi Codex](/vi/plugins/codex-harness#v1-support-contract).

## Quyền sở hữu thời gian chạy

Các thời gian chạy khác nhau sở hữu các phần khác nhau của vòng lặp.

| Bề mặt                      | OpenClaw PI nhúng                         | Máy chủ ứng dụng Codex                                                     |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Chủ sở hữu vòng lặp mô hình | OpenClaw thông qua trình chạy PI nhúng    | Máy chủ ứng dụng Codex                                                      |
| Trạng thái luồng chuẩn      | Bản ghi OpenClaw                          | Luồng Codex, cộng với bản sao phản chiếu bản ghi OpenClaw                  |
| Công cụ động của OpenClaw   | Vòng lặp công cụ OpenClaw gốc             | Được bắc cầu thông qua bộ điều hợp Codex                                    |
| Công cụ shell và tệp gốc    | Đường dẫn PI/OpenClaw                     | Công cụ gốc Codex, được bắc cầu thông qua hook gốc khi được hỗ trợ          |
| Công cụ ngữ cảnh            | Tập hợp ngữ cảnh OpenClaw gốc             | OpenClaw chiếu ngữ cảnh đã tập hợp vào lượt Codex                           |
| Compaction                  | OpenClaw hoặc công cụ ngữ cảnh đã chọn    | Compaction gốc Codex, với thông báo OpenClaw và bảo trì bản sao phản chiếu |
| Phân phối kênh              | OpenClaw                                  | OpenClaw                                                                    |

Phần tách quyền sở hữu này là quy tắc thiết kế chính:

- Nếu OpenClaw sở hữu bề mặt, OpenClaw có thể cung cấp hành vi hook Plugin thông thường.
- Nếu thời gian chạy gốc sở hữu bề mặt, OpenClaw cần sự kiện thời gian chạy hoặc hook gốc.
- Nếu thời gian chạy gốc sở hữu trạng thái luồng chuẩn, OpenClaw nên phản chiếu và chiếu ngữ cảnh, không viết lại các phần nội bộ không được hỗ trợ.

## Lựa chọn thời gian chạy

OpenClaw chọn một thời gian chạy nhúng sau khi phân giải nhà cung cấp và mô hình:

1. Thời gian chạy đã ghi của một phiên được ưu tiên. Thay đổi cấu hình không chuyển nóng
   một bản ghi hiện có sang hệ thống luồng gốc khác.
2. `OPENCLAW_AGENT_RUNTIME=<id>` ép dùng thời gian chạy đó cho các phiên mới hoặc đã đặt lại.
3. `agents.defaults.agentRuntime.id` hoặc `agents.list[].agentRuntime.id` có thể đặt
   `auto`, `pi`, một id bộ khung thực thi nhúng đã đăng ký như `codex`, hoặc một
   bí danh phần phụ trợ CLI được hỗ trợ như `claude-cli`.
4. Trong chế độ `auto`, các thời gian chạy Plugin đã đăng ký có thể nhận các cặp nhà cung cấp/mô hình
   được hỗ trợ.
5. Nếu không có thời gian chạy nào nhận một lượt trong chế độ `auto` và `fallback: "pi"` được đặt
   (mặc định), OpenClaw dùng PI làm phương án dự phòng tương thích. Đặt
   `fallback: "none"` để làm cho lựa chọn chế độ `auto` không khớp bị lỗi thay vì dự phòng.

Các thời gian chạy Plugin rõ ràng mặc định sẽ đóng khi lỗi. Ví dụ:
`agentRuntime.id: "codex"` có nghĩa là Codex hoặc một lỗi lựa chọn rõ ràng trừ khi bạn đặt
`fallback: "pi"` trong cùng phạm vi ghi đè. Ghi đè thời gian chạy không kế thừa
một thiết lập dự phòng rộng hơn, vì vậy `agentRuntime.id: "codex"` ở cấp tác tử sẽ không
bị âm thầm định tuyến trở lại PI chỉ vì mặc định đã dùng `fallback: "pi"`.

Bí danh phần phụ trợ CLI khác với id bộ khung thực thi nhúng. Dạng
Claude CLI được ưu tiên là:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

Các tham chiếu cũ như `claude-cli/claude-opus-4-7` vẫn được hỗ trợ để
tương thích, nhưng cấu hình mới nên giữ nhà cung cấp/mô hình ở dạng chuẩn và đặt
phần phụ trợ thực thi trong `agentRuntime.id`.

Chế độ `auto` được cố ý bảo thủ. Các thời gian chạy Plugin có thể nhận
cặp nhà cung cấp/mô hình mà chúng hiểu, nhưng Plugin Codex không nhận nhà cung cấp
`openai-codex` trong chế độ `auto`. Điều đó giữ
`openai-codex/*` làm tuyến OAuth Codex PI rõ ràng và tránh âm thầm
chuyển cấu hình xác thực thuê bao sang bộ khung thực thi máy chủ ứng dụng gốc.

Nếu `openclaw doctor` cảnh báo rằng Plugin `codex` được bật trong khi
`openai-codex/*` vẫn định tuyến qua PI, hãy xem đó là chẩn đoán, không phải
một di chuyển. Giữ cấu hình không đổi khi OAuth PI Codex là điều bạn muốn.
Chỉ chuyển sang `openai/<model>` cộng với `agentRuntime.id: "codex"` khi bạn muốn thực thi
máy chủ ứng dụng Codex gốc.

## Hợp đồng tương thích

Khi một thời gian chạy không phải là PI, nó nên ghi tài liệu những bề mặt OpenClaw mà nó hỗ trợ.
Dùng dạng này cho tài liệu thời gian chạy:

| Câu hỏi                               | Vì sao điều đó quan trọng                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Ai sở hữu vòng lặp mô hình?               | Xác định nơi diễn ra việc thử lại, tiếp tục công cụ và quyết định câu trả lời cuối cùng.                   |
| Ai sở hữu lịch sử luồng chuẩn?     | Xác định liệu OpenClaw có thể chỉnh sửa lịch sử hay chỉ phản chiếu lịch sử đó.                                   |
| Các công cụ động của OpenClaw có hoạt động không?        | Nhắn tin, phiên, Cron và các công cụ do OpenClaw sở hữu phụ thuộc vào điều này.                                 |
| Các hook công cụ động có hoạt động không?            | Plugin mong đợi `before_tool_call`, `after_tool_call` và middleware quanh các công cụ do OpenClaw sở hữu. |
| Các hook công cụ native có hoạt động không?             | Shell, patch và các công cụ do runtime sở hữu cần hỗ trợ hook native cho chính sách và quan sát.        |
| Vòng đời của công cụ ngữ cảnh có chạy không? | Plugin bộ nhớ và ngữ cảnh phụ thuộc vào vòng đời assemble, ingest, after-turn và compaction.      |
| Dữ liệu compaction nào được hiển thị?       | Một số Plugin chỉ cần thông báo, trong khi các Plugin khác cần siêu dữ liệu được giữ lại/bị loại bỏ.                    |
| Điều gì được cố ý không hỗ trợ?     | Người dùng không nên giả định tính tương đương với PI khi runtime native sở hữu nhiều trạng thái hơn.                  |

Hợp đồng hỗ trợ runtime Codex được ghi lại trong
[Bộ khai thác Codex](/vi/plugins/codex-harness#v1-support-contract).

## Nhãn trạng thái

Đầu ra trạng thái có thể hiển thị cả nhãn `Execution` và `Runtime`. Hãy đọc chúng như
thông tin chẩn đoán, không phải tên nhà cung cấp.

- Một tham chiếu mô hình như `openai/gpt-5.5` cho bạn biết nhà cung cấp/mô hình đã chọn.
- Một ID runtime như `codex` cho bạn biết vòng lặp nào đang thực thi lượt này.
- Một nhãn kênh như Telegram hoặc Discord cho bạn biết cuộc trò chuyện đang diễn ra ở đâu.

Nếu một phiên vẫn hiển thị PI sau khi thay đổi cấu hình runtime, hãy bắt đầu phiên mới
bằng `/new` hoặc xóa phiên hiện tại bằng `/reset`. Các phiên hiện có giữ runtime
đã ghi lại của chúng để bản ghi hội thoại không được phát lại qua hai hệ thống
phiên native không tương thích.

## Liên quan

- [Bộ khai thác Codex](/vi/plugins/codex-harness)
- [OpenAI](/vi/providers/openai)
- [Plugin bộ khai thác agent](/vi/plugins/sdk-agent-harness)
- [Vòng lặp agent](/vi/concepts/agent-loop)
- [Mô hình](/vi/concepts/models)
- [Trạng thái](/vi/cli/status)
