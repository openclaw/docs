---
read_when:
    - Bạn đang lựa chọn giữa PI, Codex, ACP hoặc một môi trường chạy tác nhân gốc khác
    - Bạn thấy khó hiểu về các nhãn nhà cung cấp/mô hình/thời gian chạy trong trạng thái hoặc cấu hình
    - Bạn đang ghi tài liệu về tính tương đương hỗ trợ cho một bộ khung gốc
summary: Cách OpenClaw phân tách nhà cung cấp mô hình, mô hình, kênh và môi trường thực thi tác tử
title: Môi trường chạy của tác nhân
x-i18n:
    generated_at: "2026-04-29T22:35:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: f99e88a47a78c48b2f2408a3feedf15cde66a6bacc4e7bfadb9e47c74f7ce633
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Một **runtime tác tử** là thành phần sở hữu một vòng lặp mô hình đã được chuẩn bị: nó
nhận prompt, điều khiển đầu ra của mô hình, xử lý các lệnh gọi công cụ gốc, và trả
lượt đã hoàn tất về cho OpenClaw.

Runtime dễ bị nhầm với nhà cung cấp vì cả hai đều xuất hiện gần phần cấu hình
mô hình. Chúng là các lớp khác nhau:

| Lớp           | Ví dụ                                 | Ý nghĩa                                                             |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Nhà cung cấp  | `openai`, `anthropic`, `openai-codex` | Cách OpenClaw xác thực, khám phá mô hình, và đặt tên tham chiếu mô hình. |
| Mô hình       | `gpt-5.5`, `claude-opus-4-6`          | Mô hình được chọn cho lượt tác tử.                                  |
| Runtime tác tử | `pi`, `codex`, `claude-cli`           | Vòng lặp hoặc backend cấp thấp thực thi lượt đã chuẩn bị.           |
| Kênh          | Telegram, Discord, Slack, WhatsApp    | Nơi thông điệp đi vào và rời khỏi OpenClaw.                         |

Bạn cũng sẽ thấy từ **harness** trong mã. Harness là phần triển khai cung cấp
một runtime tác tử. Ví dụ, harness Codex đi kèm triển khai runtime `codex`.
Cấu hình công khai dùng `agentRuntime.id`; `openclaw doctor --fix` viết lại
các khóa runtime-policy cũ hơn sang dạng đó.

Có hai họ runtime:

- **Harness nhúng** chạy bên trong vòng lặp tác tử đã chuẩn bị của OpenClaw. Hiện nay,
  đó là runtime `pi` tích hợp sẵn cùng với các harness Plugin đã đăng ký như
  `codex`.
- **Backend CLI** chạy một tiến trình CLI cục bộ trong khi vẫn giữ tham chiếu mô hình
  chuẩn tắc. Ví dụ, `anthropic/claude-opus-4-7` với
  `agentRuntime.id: "claude-cli"` nghĩa là "chọn mô hình Anthropic, thực thi
  qua Claude CLI." `claude-cli` không phải là id harness nhúng và không được
  truyền vào phần chọn AgentHarness.

## Ba thứ mang tên Codex

Phần lớn nhầm lẫn đến từ ba bề mặt khác nhau cùng dùng tên Codex:

| Bề mặt                                               | Tên/cấu hình OpenClaw                | Tác dụng                                                                                            |
| ---------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Tuyến nhà cung cấp OAuth Codex                       | `openai-codex/*` tham chiếu mô hình  | Dùng OAuth đăng ký ChatGPT/Codex thông qua trình chạy PI bình thường của OpenClaw.                  |
| Runtime máy chủ ứng dụng Codex gốc                   | `agentRuntime.id: "codex"`           | Chạy lượt tác tử nhúng thông qua harness máy chủ ứng dụng Codex đi kèm.                            |
| Bộ điều hợp ACP Codex                                | `runtime: "acp"`, `agentId: "codex"` | Chạy Codex qua mặt phẳng điều khiển ACP/acpx bên ngoài. Chỉ dùng khi ACP/acpx được yêu cầu rõ ràng. |
| Bộ lệnh điều khiển trò chuyện Codex gốc              | `/codex ...`                         | Liên kết, tiếp tục, điều hướng, dừng, và kiểm tra các luồng máy chủ ứng dụng Codex từ trò chuyện.  |
| Tuyến OpenAI Platform API cho các mô hình kiểu GPT/Codex | `openai/*` tham chiếu mô hình        | Dùng xác thực khóa API OpenAI trừ khi một ghi đè runtime, chẳng hạn `runtime: "codex"`, chạy lượt. |

Các bề mặt đó độc lập có chủ ý. Bật Plugin `codex` làm cho các tính năng
máy chủ ứng dụng gốc khả dụng; nó không viết lại `openai-codex/*` thành
`openai/*`, không thay đổi các phiên hiện có, và không đặt ACP làm mặc định
Codex. Chọn `openai-codex/*` nghĩa là "dùng tuyến nhà cung cấp OAuth Codex"
trừ khi bạn ép riêng một runtime.

Thiết lập Codex phổ biến dùng nhà cung cấp `openai` với runtime `codex`:

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

Điều đó nghĩa là OpenClaw chọn một tham chiếu mô hình OpenAI, rồi yêu cầu runtime
máy chủ ứng dụng Codex chạy lượt tác tử nhúng. Điều đó không có nghĩa là kênh,
danh mục nhà cung cấp mô hình, hoặc kho phiên OpenClaw trở thành Codex.

Khi Plugin `codex` đi kèm được bật, việc điều khiển Codex bằng ngôn ngữ tự nhiên
nên dùng bề mặt lệnh `/codex` gốc (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) thay vì ACP. Chỉ dùng ACP cho
Codex khi người dùng yêu cầu rõ ràng ACP/acpx hoặc đang kiểm thử đường dẫn
bộ điều hợp ACP. Claude Code, Gemini CLI, OpenCode, Cursor, và các harness
bên ngoài tương tự vẫn dùng ACP.

Đây là cây quyết định dành cho tác tử:

1. Nếu người dùng yêu cầu **liên kết/điều khiển/luồng/tiếp tục/điều hướng/dừng Codex**, hãy dùng
   bề mặt lệnh `/codex` gốc khi Plugin `codex` đi kèm được bật.
2. Nếu người dùng yêu cầu **Codex làm runtime nhúng**, hãy dùng
   `openai/<model>` với `agentRuntime.id: "codex"`.
3. Nếu người dùng yêu cầu **xác thực OAuth/đăng ký Codex trên trình chạy OpenClaw
   bình thường**, hãy dùng `openai-codex/<model>` và giữ runtime là PI.
4. Nếu người dùng nói rõ **ACP**, **acpx**, hoặc **bộ điều hợp ACP Codex**, hãy dùng
   ACP với `runtime: "acp"` và `agentId: "codex"`.
5. Nếu yêu cầu dành cho **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, hoặc
   một harness bên ngoài khác**, hãy dùng ACP/acpx, không dùng runtime tác tử con gốc.

| Ý bạn là...                            | Dùng...                                      |
| -------------------------------------- | -------------------------------------------- |
| Điều khiển trò chuyện/luồng máy chủ ứng dụng Codex | `/codex ...` từ Plugin `codex` đi kèm |
| Runtime tác tử nhúng máy chủ ứng dụng Codex | `agentRuntime.id: "codex"`                   |
| OAuth OpenAI Codex trên trình chạy PI  | `openai-codex/*` tham chiếu mô hình          |
| Claude Code hoặc harness bên ngoài khác | ACP/acpx                                     |

Về phần tách tiền tố họ OpenAI, xem [OpenAI](/vi/providers/openai) và
[Nhà cung cấp mô hình](/vi/concepts/model-providers). Về hợp đồng hỗ trợ runtime
Codex, xem [Harness Codex](/vi/plugins/codex-harness#v1-support-contract).

## Quyền sở hữu runtime

Các runtime khác nhau sở hữu các phần khác nhau của vòng lặp.

| Bề mặt                      | PI nhúng của OpenClaw                 | Máy chủ ứng dụng Codex                                                     |
| --------------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Chủ sở hữu vòng lặp mô hình | OpenClaw thông qua trình chạy PI nhúng | Máy chủ ứng dụng Codex                                                      |
| Trạng thái luồng chuẩn tắc  | Bản ghi hội thoại OpenClaw            | Luồng Codex, cộng với bản sao phản chiếu bản ghi hội thoại OpenClaw         |
| Công cụ động của OpenClaw   | Vòng lặp công cụ OpenClaw gốc         | Được bắc cầu qua bộ điều hợp Codex                                          |
| Công cụ shell và tệp gốc    | Đường dẫn PI/OpenClaw                 | Công cụ gốc Codex, được bắc cầu qua hook gốc khi được hỗ trợ                |
| Công cụ ngữ cảnh            | Lắp ráp ngữ cảnh OpenClaw gốc         | OpenClaw chiếu ngữ cảnh đã lắp ráp vào lượt Codex                           |
| Compaction                  | OpenClaw hoặc công cụ ngữ cảnh đã chọn | Compaction gốc Codex, với thông báo OpenClaw và bảo trì bản sao phản chiếu |
| Phân phối kênh              | OpenClaw                              | OpenClaw                                                                    |

Phân tách quyền sở hữu này là quy tắc thiết kế chính:

- Nếu OpenClaw sở hữu bề mặt, OpenClaw có thể cung cấp hành vi hook Plugin bình thường.
- Nếu runtime gốc sở hữu bề mặt, OpenClaw cần sự kiện runtime hoặc hook gốc.
- Nếu runtime gốc sở hữu trạng thái luồng chuẩn tắc, OpenClaw nên phản chiếu và chiếu ngữ cảnh, không viết lại các phần nội bộ không được hỗ trợ.

## Chọn runtime

OpenClaw chọn một runtime nhúng sau khi phân giải nhà cung cấp và mô hình:

1. Runtime đã ghi trong phiên được ưu tiên. Thay đổi cấu hình không chuyển nóng
   một bản ghi hội thoại hiện có sang một hệ thống luồng gốc khác.
2. `OPENCLAW_AGENT_RUNTIME=<id>` ép runtime đó cho các phiên mới hoặc phiên đã đặt lại.
3. `agents.defaults.agentRuntime.id` hoặc `agents.list[].agentRuntime.id` có thể đặt
   `auto`, `pi`, một id harness nhúng đã đăng ký như `codex`, hoặc một bí danh
   backend CLI được hỗ trợ như `claude-cli`.
4. Ở chế độ `auto`, các runtime Plugin đã đăng ký có thể nhận các cặp nhà cung cấp/mô hình
   mà chúng hỗ trợ.
5. Nếu không runtime nào nhận một lượt ở chế độ `auto` và `fallback: "pi"` được đặt
   (mặc định), OpenClaw dùng PI làm phương án tương thích dự phòng. Đặt
   `fallback: "none"` để thay vào đó làm cho lựa chọn chế độ `auto` không khớp bị lỗi.

Runtime Plugin tường minh mặc định sẽ đóng khi lỗi. Ví dụ,
`runtime: "codex"` nghĩa là Codex hoặc một lỗi chọn rõ ràng trừ khi bạn đặt
`fallback: "pi"` trong cùng phạm vi ghi đè. Một ghi đè runtime không kế thừa
thiết lập fallback rộng hơn, vì vậy `runtime: "codex"` ở cấp tác tử không âm thầm
được định tuyến ngược về PI chỉ vì mặc định đã dùng `fallback: "pi"`.

Bí danh backend CLI khác với id harness nhúng. Dạng Claude CLI được ưu tiên là:

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

Các tham chiếu cũ như `claude-cli/claude-opus-4-7` vẫn được hỗ trợ để tương thích,
nhưng cấu hình mới nên giữ nhà cung cấp/mô hình ở dạng chuẩn tắc và đặt backend
thực thi trong `agentRuntime.id`.

Chế độ `auto` cố ý thận trọng. Runtime Plugin có thể nhận các cặp nhà cung cấp/mô hình
mà chúng hiểu, nhưng Plugin Codex không nhận nhà cung cấp `openai-codex` ở chế độ
`auto`. Điều đó giữ `openai-codex/*` làm tuyến OAuth Codex PI tường minh và tránh âm thầm
chuyển cấu hình xác thực đăng ký sang harness máy chủ ứng dụng gốc.

Nếu `openclaw doctor` cảnh báo rằng Plugin `codex` được bật trong khi
`openai-codex/*` vẫn định tuyến qua PI, hãy xem đó là chẩn đoán, không phải
di chuyển. Giữ nguyên cấu hình khi PI Codex OAuth là điều bạn muốn.
Chỉ chuyển sang `openai/<model>` cộng với `agentRuntime.id: "codex"` khi bạn muốn thực thi
máy chủ ứng dụng Codex gốc.

## Hợp đồng tương thích

Khi một runtime không phải PI, runtime đó nên ghi lại các bề mặt OpenClaw mà nó hỗ trợ.
Dùng dạng này cho tài liệu runtime:

| Câu hỏi                               | Vì sao quan trọng                                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Ai sở hữu vòng lặp mô hình?           | Xác định nơi diễn ra thử lại, tiếp tục công cụ, và quyết định câu trả lời cuối cùng.               |
| Ai sở hữu lịch sử luồng chuẩn tắc?    | Xác định liệu OpenClaw có thể chỉnh sửa lịch sử hay chỉ phản chiếu nó.                             |
| Công cụ động của OpenClaw có hoạt động không? | Nhắn tin, phiên, cron, và các công cụ do OpenClaw sở hữu phụ thuộc vào điều này.                  |
| Hook công cụ động có hoạt động không? | Plugin kỳ vọng `before_tool_call`, `after_tool_call`, và middleware quanh các công cụ do OpenClaw sở hữu. |
| Hook công cụ gốc có hoạt động không?  | Shell, patch, và các công cụ do runtime sở hữu cần hỗ trợ hook gốc cho chính sách và quan sát.    |
| Vòng đời công cụ ngữ cảnh có chạy không? | Plugin bộ nhớ và ngữ cảnh phụ thuộc vào vòng đời lắp ráp, nạp vào, sau lượt, và compaction.       |
| Dữ liệu compaction nào được phơi bày? | Một số Plugin chỉ cần thông báo, trong khi các Plugin khác cần siêu dữ liệu được giữ/bị bỏ.        |
| Điều gì cố ý không được hỗ trợ?       | Người dùng không nên giả định tính tương đương với PI ở nơi runtime gốc sở hữu nhiều trạng thái hơn. |

Hợp đồng hỗ trợ runtime Codex được ghi lại trong
[Harness Codex](/vi/plugins/codex-harness#v1-support-contract).

## Nhãn trạng thái

Đầu ra trạng thái có thể hiển thị cả nhãn `Execution` và `Runtime`. Hãy đọc chúng như
thông tin chẩn đoán, không phải tên nhà cung cấp.

- Một tham chiếu mô hình như `openai/gpt-5.5` cho bạn biết nhà cung cấp/mô hình đã chọn.
- Một mã định danh runtime như `codex` cho bạn biết vòng lặp nào đang thực thi lượt này.
- Một nhãn kênh như Telegram hoặc Discord cho bạn biết cuộc trò chuyện đang diễn ra ở đâu.

Nếu một phiên vẫn hiển thị PI sau khi thay đổi cấu hình runtime, hãy bắt đầu một phiên mới
bằng `/new` hoặc xóa phiên hiện tại bằng `/reset`. Các phiên hiện có giữ runtime
đã ghi lại để bản ghi hội thoại không bị phát lại qua hai hệ thống phiên gốc
không tương thích.

## Liên quan

- [Harness Codex](/vi/plugins/codex-harness)
- [OpenAI](/vi/providers/openai)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Vòng lặp tác tử](/vi/concepts/agent-loop)
- [Mô hình](/vi/concepts/models)
- [Trạng thái](/vi/cli/status)
