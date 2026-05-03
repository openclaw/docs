---
read_when:
    - Bạn đang chọn giữa PI, Codex, ACP hoặc một runtime tác tử gốc khác
    - Bạn bị nhầm lẫn bởi các nhãn nhà cung cấp/mô hình/môi trường chạy trong trạng thái hoặc cấu hình
    - Bạn đang ghi tài liệu về mức độ tương đương hỗ trợ cho một bộ khung gốc
summary: Cách OpenClaw tách biệt nhà cung cấp mô hình, mô hình, kênh và môi trường chạy tác nhân
title: Môi trường chạy của tác nhân
x-i18n:
    generated_at: "2026-05-03T10:35:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6cd0e0e8508f88c04db63ebcbbca61d9a023ee661f59ea1ed7a1341b357088c7
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

**môi trường chạy tác tử** là thành phần sở hữu một vòng lặp mô hình đã được chuẩn bị: nó
nhận prompt, điều khiển đầu ra của mô hình, xử lý các lệnh gọi công cụ gốc và trả
lượt đã hoàn tất về OpenClaw.

Dễ nhầm lẫn môi trường chạy với nhà cung cấp vì cả hai đều xuất hiện gần phần
cấu hình mô hình. Chúng là các lớp khác nhau:

| Lớp           | Ví dụ                                 | Ý nghĩa                                                             |
| ------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Nhà cung cấp  | `openai`, `anthropic`, `openai-codex` | Cách OpenClaw xác thực, phát hiện mô hình và đặt tên model refs.    |
| Mô hình       | `gpt-5.5`, `claude-opus-4-6`          | Mô hình được chọn cho lượt tác tử.                                  |
| Môi trường chạy tác tử | `pi`, `codex`, `claude-cli`           | Vòng lặp hoặc backend cấp thấp thực thi lượt đã chuẩn bị.           |
| Kênh          | Telegram, Discord, Slack, WhatsApp    | Nơi tin nhắn đi vào và rời OpenClaw.                                |

Bạn cũng sẽ thấy từ **harness** trong mã. Harness là phần triển khai
cung cấp một môi trường chạy tác tử. Ví dụ, harness Codex đi kèm
triển khai môi trường chạy `codex`. Cấu hình công khai dùng `agentRuntime.id`; `openclaw
doctor --fix` viết lại các khóa runtime-policy cũ hơn sang dạng đó.

Có hai họ môi trường chạy:

- **Harness nhúng** chạy bên trong vòng lặp tác tử đã chuẩn bị của OpenClaw. Hiện nay đây
  là môi trường chạy `pi` tích hợp sẵn cộng với các harness Plugin đã đăng ký như
  `codex`.
- **Backend CLI** chạy một tiến trình CLI cục bộ trong khi vẫn giữ model ref
  chính tắc. Ví dụ, `anthropic/claude-opus-4-7` với
  `agentRuntime.id: "claude-cli"` nghĩa là "chọn mô hình Anthropic, thực thi
  qua Claude CLI." `claude-cli` không phải là id harness nhúng và không được
  truyền vào phần chọn AgentHarness.

## Bề mặt Codex

Phần lớn nhầm lẫn đến từ nhiều bề mặt khác nhau cùng dùng tên Codex:

| Bề mặt                                               | Tên/cấu hình OpenClaw                    | Chức năng                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Môi trường chạy app-server Codex gốc                 | `openai/*` cộng `agentRuntime.id: "codex"` | Chạy lượt tác tử nhúng qua app-server Codex. Đây là thiết lập đăng ký ChatGPT/Codex thông thường.          |
| Tuyến nhà cung cấp OAuth Codex                       | `openai-codex/*` model refs                | Dùng OAuth đăng ký ChatGPT/Codex qua trình chạy PI OpenClaw thông thường.                                  |
| Bộ chuyển đổi ACP Codex                              | `runtime: "acp"`, `agentId: "codex"`       | Chạy Codex qua mặt phẳng điều khiển ACP/acpx bên ngoài. Chỉ dùng khi ACP/acpx được yêu cầu rõ ràng.        |
| Bộ lệnh điều khiển chat Codex gốc                    | `/codex ...`                               | Liên kết, tiếp tục, điều hướng, dừng và kiểm tra các luồng app-server Codex từ chat.                       |
| Tuyến OpenAI Platform API cho mô hình kiểu GPT/Codex | `openai/*` model refs                      | Dùng xác thực khóa API OpenAI trừ khi một ghi đè môi trường chạy, như `agentRuntime.id: "codex"`, chạy lượt. |

Các bề mặt đó độc lập có chủ ý. Bật Plugin `codex` làm cho
các tính năng app-server gốc khả dụng; nó không viết lại
`openai-codex/*` thành `openai/*`, không thay đổi các phiên hiện có và không
biến ACP thành mặc định Codex. Chọn `openai-codex/*` nghĩa là "dùng tuyến nhà cung cấp
OAuth Codex" trừ khi bạn ép riêng một môi trường chạy.

Thiết lập đăng ký ChatGPT/Codex phổ biến dùng OAuth Codex để xác thực, nhưng giữ
model ref là `openai/*` và chọn môi trường chạy `codex`:

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

Điều đó nghĩa là OpenClaw chọn một model ref OpenAI, rồi yêu cầu môi trường chạy app-server
Codex chạy lượt tác tử nhúng. Nó không có nghĩa là "dùng thanh toán API", và
không có nghĩa là kênh, danh mục nhà cung cấp mô hình hoặc kho phiên OpenClaw
trở thành Codex.

Khi Plugin `codex` đi kèm được bật, việc điều khiển Codex bằng ngôn ngữ tự nhiên
nên dùng bề mặt lệnh `/codex` gốc (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) thay vì ACP. Chỉ dùng ACP cho
Codex khi người dùng yêu cầu rõ ràng ACP/acpx hoặc đang kiểm thử đường dẫn bộ chuyển đổi ACP.
Claude Code, Gemini CLI, OpenCode, Cursor và các harness bên ngoài tương tự
vẫn dùng ACP.

Đây là cây quyết định hướng đến tác tử:

1. Nếu người dùng yêu cầu **Codex bind/control/thread/resume/steer/stop**, hãy dùng
   bề mặt lệnh `/codex` gốc khi Plugin `codex` đi kèm được bật.
2. Nếu người dùng yêu cầu **Codex làm môi trường chạy nhúng** hoặc muốn trải nghiệm tác tử
   Codex thông thường được hỗ trợ bằng đăng ký, hãy dùng
   `openai/<model>` với `agentRuntime.id: "codex"`.
3. Nếu người dùng yêu cầu **xác thực OAuth/đăng ký Codex trên trình chạy OpenClaw
   thông thường**, hãy dùng `openai-codex/<model>` và để môi trường chạy là PI.
4. Nếu người dùng nói rõ **ACP**, **acpx** hoặc **bộ chuyển đổi ACP Codex**, hãy dùng
   ACP với `runtime: "acp"` và `agentId: "codex"`.
5. Nếu yêu cầu dành cho **Claude Code, Gemini CLI, OpenCode, Cursor, Droid hoặc
   một harness bên ngoài khác**, hãy dùng ACP/acpx, không dùng môi trường chạy tác tử phụ gốc.

| Ý bạn là...                            | Dùng...                                      |
| --------------------------------------- | -------------------------------------------- |
| Điều khiển chat/luồng app-server Codex  | `/codex ...` từ Plugin `codex` đi kèm        |
| Môi trường chạy tác tử nhúng app-server Codex | `agentRuntime.id: "codex"`                   |
| OAuth OpenAI Codex trên trình chạy PI   | `openai-codex/*` model refs                  |
| Claude Code hoặc harness bên ngoài khác | ACP/acpx                                     |

Về phần tách tiền tố họ OpenAI, xem [OpenAI](/vi/providers/openai) và
[Nhà cung cấp mô hình](/vi/concepts/model-providers). Về hợp đồng hỗ trợ môi trường chạy Codex,
xem [Codex harness](/vi/plugins/codex-harness#v1-support-contract).

## Quyền sở hữu môi trường chạy

Các môi trường chạy khác nhau sở hữu các phần khác nhau của vòng lặp.

| Bề mặt                      | OpenClaw PI nhúng                         | App-server Codex                                                            |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Chủ sở hữu vòng lặp mô hình | OpenClaw thông qua trình chạy PI nhúng    | App-server Codex                                                            |
| Trạng thái luồng chính tắc  | Bản ghi hội thoại OpenClaw                | Luồng Codex, cộng với bản sao phản chiếu bản ghi hội thoại OpenClaw         |
| Công cụ động OpenClaw       | Vòng lặp công cụ OpenClaw gốc             | Được bắc cầu qua bộ chuyển đổi Codex                                        |
| Công cụ shell và tệp gốc    | Đường dẫn PI/OpenClaw                     | Công cụ gốc của Codex, được bắc cầu qua hook gốc khi được hỗ trợ            |
| Công cụ ngữ cảnh            | Tập hợp ngữ cảnh OpenClaw gốc             | OpenClaw chiếu ngữ cảnh đã tập hợp vào lượt Codex                           |
| Compaction                  | OpenClaw hoặc công cụ ngữ cảnh đã chọn    | Compaction gốc của Codex, với thông báo OpenClaw và bảo trì bản sao phản chiếu |
| Phân phối kênh              | OpenClaw                                  | OpenClaw                                                                    |

Phần chia quyền sở hữu này là quy tắc thiết kế chính:

- Nếu OpenClaw sở hữu bề mặt, OpenClaw có thể cung cấp hành vi hook Plugin thông thường.
- Nếu môi trường chạy gốc sở hữu bề mặt, OpenClaw cần sự kiện môi trường chạy hoặc hook gốc.
- Nếu môi trường chạy gốc sở hữu trạng thái luồng chính tắc, OpenClaw nên phản chiếu và chiếu ngữ cảnh, không viết lại các phần nội bộ không được hỗ trợ.

## Chọn môi trường chạy

OpenClaw chọn một môi trường chạy nhúng sau khi phân giải nhà cung cấp và mô hình:

1. Môi trường chạy đã ghi của phiên được ưu tiên. Thay đổi cấu hình không chuyển nóng
   một bản ghi hội thoại hiện có sang hệ thống luồng gốc khác.
2. `OPENCLAW_AGENT_RUNTIME=<id>` ép môi trường chạy đó cho các phiên mới hoặc đã đặt lại.
3. `agents.defaults.agentRuntime.id` hoặc `agents.list[].agentRuntime.id` có thể đặt
   `auto`, `pi`, id harness nhúng đã đăng ký như `codex` hoặc một
   alias backend CLI được hỗ trợ như `claude-cli`.
4. Ở chế độ `auto`, các môi trường chạy Plugin đã đăng ký có thể nhận các cặp nhà cung cấp/mô hình
   được hỗ trợ.
5. Nếu không môi trường chạy nào nhận một lượt ở chế độ `auto`, OpenClaw dùng PI làm
   môi trường chạy tương thích. Hãy dùng id môi trường chạy tường minh khi lần chạy phải
   nghiêm ngặt.

Các môi trường chạy Plugin tường minh sẽ đóng khi lỗi. Ví dụ, `agentRuntime.id: "codex"`
nghĩa là Codex hoặc một lỗi chọn/môi trường chạy rõ ràng; nó không bao giờ được định tuyến âm thầm
trở lại PI.

Alias backend CLI khác với id harness nhúng. Dạng Claude CLI được ưu tiên là:

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

Các ref cũ như `claude-cli/claude-opus-4-7` vẫn được hỗ trợ để
tương thích, nhưng cấu hình mới nên giữ nhà cung cấp/mô hình ở dạng chính tắc và đặt
backend thực thi trong `agentRuntime.id`.

Chế độ `auto` có chủ ý thận trọng. Các môi trường chạy Plugin có thể nhận
các cặp nhà cung cấp/mô hình mà chúng hiểu, nhưng Plugin Codex không nhận
nhà cung cấp `openai-codex` ở chế độ `auto`. Điều đó giữ
`openai-codex/*` là tuyến OAuth Codex PI tường minh và tránh âm thầm
chuyển cấu hình xác thực bằng đăng ký sang harness app-server gốc.

Nếu `openclaw doctor` cảnh báo rằng Plugin `codex` được bật trong khi
`openai-codex/*` vẫn định tuyến qua PI, hãy xem đó là chẩn đoán, không phải
di chuyển. Giữ nguyên cấu hình khi OAuth Codex PI là điều bạn muốn.
Chỉ chuyển sang `openai/<model>` cộng `agentRuntime.id: "codex"` khi bạn muốn thực thi
bằng app-server Codex gốc.

## Hợp đồng tương thích

Khi một môi trường chạy không phải là PI, nó nên ghi tài liệu các bề mặt OpenClaw mà nó hỗ trợ.
Dùng dạng này cho tài liệu môi trường chạy:

| Câu hỏi                                | Vì sao quan trọng                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Ai sở hữu vòng lặp mô hình?            | Xác định nơi xảy ra thử lại, tiếp tục công cụ và quyết định câu trả lời cuối cùng.                |
| Ai sở hữu lịch sử luồng chính tắc?     | Xác định OpenClaw có thể chỉnh sửa lịch sử hay chỉ phản chiếu nó.                                |
| Công cụ động OpenClaw có hoạt động không? | Nhắn tin, phiên, cron và công cụ do OpenClaw sở hữu phụ thuộc vào điều này.                     |
| Hook công cụ động có hoạt động không?  | Plugin kỳ vọng `before_tool_call`, `after_tool_call` và middleware quanh công cụ do OpenClaw sở hữu. |
| Hook công cụ gốc có hoạt động không?   | Shell, patch và công cụ do môi trường chạy sở hữu cần hỗ trợ hook gốc cho chính sách và quan sát. |
| Vòng đời công cụ ngữ cảnh có chạy không? | Plugin bộ nhớ và ngữ cảnh phụ thuộc vào vòng đời assemble, ingest, after-turn và compaction.    |
| Dữ liệu compaction nào được phơi bày?  | Một số Plugin chỉ cần thông báo, trong khi số khác cần siêu dữ liệu được giữ/bị loại bỏ.          |
| Điều gì cố ý không được hỗ trợ?        | Người dùng không nên giả định tương đương PI khi môi trường chạy gốc sở hữu nhiều trạng thái hơn. |

Hợp đồng hỗ trợ môi trường chạy Codex được ghi tài liệu trong
[Codex harness](/vi/plugins/codex-harness#v1-support-contract).

## Nhãn trạng thái

Đầu ra trạng thái có thể hiển thị cả hai nhãn `Execution` và `Runtime`. Hãy xem chúng là thông tin chẩn đoán, không phải tên nhà cung cấp.

- Tham chiếu mô hình như `openai/gpt-5.5` cho bạn biết nhà cung cấp/mô hình đã chọn.
- ID runtime như `codex` cho bạn biết vòng lặp nào đang thực thi lượt.
- Nhãn kênh như Telegram hoặc Discord cho bạn biết cuộc trò chuyện đang diễn ra ở đâu.

Nếu một phiên vẫn hiển thị PI sau khi thay đổi cấu hình runtime, hãy bắt đầu phiên mới bằng `/new` hoặc xóa phiên hiện tại bằng `/reset`. Các phiên hiện có giữ runtime đã ghi lại của chúng để transcript không bị phát lại qua hai hệ thống phiên native không tương thích.

## Liên quan

- [Bộ điều phối Codex](/vi/plugins/codex-harness)
- [OpenAI](/vi/providers/openai)
- [Plugin bộ điều phối agent](/vi/plugins/sdk-agent-harness)
- [Vòng lặp agent](/vi/concepts/agent-loop)
- [Mô hình](/vi/concepts/models)
- [Trạng thái](/vi/cli/status)
