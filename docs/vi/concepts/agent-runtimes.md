---
read_when:
    - Bạn đang chọn giữa PI, Codex, ACP hoặc một môi trường thực thi tác tử gốc khác
    - Bạn đang bối rối về các nhãn nhà cung cấp/mô hình/môi trường chạy trong trạng thái hoặc cấu hình
    - Bạn đang ghi tài liệu về tính tương đương hỗ trợ cho một bộ khung gốc
summary: Cách OpenClaw tách biệt nhà cung cấp mô hình, mô hình, kênh và môi trường thực thi tác tử
title: Môi trường chạy tác nhân
x-i18n:
    generated_at: "2026-05-07T13:15:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417a3a7e12a881bc33023cc87553dd3536a63ad955d1e93d26f1014032303469
    source_path: concepts/agent-runtimes.md
    workflow: 16
---

Một **runtime agent** là thành phần sở hữu một vòng lặp mô hình đã chuẩn bị: nó
nhận prompt, điều khiển đầu ra của mô hình, xử lý các lệnh gọi công cụ gốc và trả
lượt hoàn tất về OpenClaw.

Runtime dễ bị nhầm với nhà cung cấp vì cả hai đều xuất hiện gần cấu hình mô
hình. Chúng là các lớp khác nhau:

| Lớp           | Ví dụ                                 | Ý nghĩa                                                           |
| ------------- | ------------------------------------- | ----------------------------------------------------------------- |
| Nhà cung cấp  | `openai`, `anthropic`, `openai-codex` | Cách OpenClaw xác thực, phát hiện mô hình và đặt tên tham chiếu mô hình. |
| Mô hình       | `gpt-5.5`, `claude-opus-4-6`          | Mô hình được chọn cho lượt agent.                                 |
| Runtime agent | `pi`, `codex`, `claude-cli`           | Vòng lặp hoặc backend cấp thấp thực thi lượt đã chuẩn bị.         |
| Kênh          | Telegram, Discord, Slack, WhatsApp    | Nơi tin nhắn đi vào và rời khỏi OpenClaw.                         |

Bạn cũng sẽ thấy từ **harness** trong mã. Harness là phần triển khai cung cấp
một runtime agent. Ví dụ, harness Codex đi kèm triển khai runtime `codex`. Cấu
hình công khai dùng `agentRuntime.id`; `openclaw doctor --fix` viết lại các khóa
runtime-policy cũ sang dạng đó.

Có hai họ runtime:

- **Harness nhúng** chạy bên trong vòng lặp agent đã chuẩn bị của OpenClaw. Hiện
  tại đây là runtime `pi` tích hợp sẵn cùng các harness Plugin đã đăng ký như
  `codex`.
- **Backend CLI** chạy một tiến trình CLI cục bộ trong khi vẫn giữ tham chiếu mô
  hình ở dạng chuẩn. Ví dụ, `anthropic/claude-opus-4-7` với
  `agentRuntime.id: "claude-cli"` có nghĩa là "chọn mô hình Anthropic, thực thi
  qua Claude CLI." `claude-cli` không phải là id harness nhúng và không được
  truyền vào lựa chọn AgentHarness.

## Các bề mặt Codex

Phần lớn nhầm lẫn đến từ nhiều bề mặt khác nhau cùng dùng tên Codex:

| Bề mặt                                           | Tên/cấu hình OpenClaw                | Chức năng                                                                                                      |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Runtime máy chủ ứng dụng Codex gốc               | Tham chiếu mô hình `openai/*`        | Chạy các lượt agent nhúng OpenAI qua máy chủ ứng dụng Codex. Đây là thiết lập đăng ký ChatGPT/Codex thông thường. |
| Hồ sơ xác thực OAuth Codex                       | Nhà cung cấp xác thực `openai-codex` | Lưu xác thực đăng ký ChatGPT/Codex mà harness máy chủ ứng dụng Codex sử dụng.                                  |
| Bộ điều hợp ACP Codex                            | `runtime: "acp"`, `agentId: "codex"` | Chạy Codex qua mặt phẳng điều khiển ACP/acpx bên ngoài. Chỉ dùng khi ACP/acpx được yêu cầu rõ ràng.            |
| Bộ lệnh điều khiển chat Codex gốc                | `/codex ...`                         | Liên kết, tiếp tục, điều hướng, dừng và kiểm tra các luồng máy chủ ứng dụng Codex từ chat.                    |
| Tuyến OpenAI Platform API cho các bề mặt không phải agent | `openai/*` cộng xác thực khóa API    | Dùng cho các API OpenAI trực tiếp như hình ảnh, embeddings, giọng nói và thời gian thực.                       |

Các bề mặt đó được chủ ý tách độc lập. Bật Plugin `codex` làm cho các tính năng
máy chủ ứng dụng gốc khả dụng; `openclaw doctor --fix` sở hữu việc sửa tuyến
`openai-codex/*` cũ và dọn dẹp ghim phiên lỗi thời. Việc chọn `openai/*` cho mô
hình agent hiện có nghĩa là "chạy phần này qua Codex" trừ khi đang dùng một bề
mặt OpenAI API không phải agent.

Thiết lập đăng ký ChatGPT/Codex phổ biến dùng OAuth Codex để xác thực, nhưng giữ
tham chiếu mô hình là `openai/*` và chọn runtime `codex`:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

Điều đó có nghĩa OpenClaw chọn một tham chiếu mô hình OpenAI, rồi yêu cầu runtime
máy chủ ứng dụng Codex chạy lượt agent nhúng. Nó không có nghĩa là "dùng thanh
toán API," và cũng không có nghĩa là kênh, danh mục nhà cung cấp mô hình, hoặc
kho phiên OpenClaw trở thành Codex.

Khi Plugin `codex` đi kèm được bật, điều khiển Codex bằng ngôn ngữ tự nhiên nên
dùng bề mặt lệnh `/codex` gốc (`/codex bind`, `/codex threads`,
`/codex resume`, `/codex steer`, `/codex stop`) thay vì ACP. Chỉ dùng ACP cho
Codex khi người dùng yêu cầu rõ ràng ACP/acpx hoặc đang kiểm thử đường dẫn bộ
điều hợp ACP. Claude Code, Gemini CLI, OpenCode, Cursor và các harness bên ngoài
tương tự vẫn dùng ACP.

Đây là cây quyết định dành cho agent:

1. Nếu người dùng yêu cầu **Codex bind/control/thread/resume/steer/stop**, hãy
   dùng bề mặt lệnh `/codex` gốc khi Plugin `codex` đi kèm được bật.
2. Nếu người dùng yêu cầu **Codex làm runtime nhúng** hoặc muốn trải nghiệm agent
   Codex thông thường được hỗ trợ bởi đăng ký, hãy dùng `openai/<model>`.
3. Nếu người dùng chọn rõ ràng **PI cho một mô hình OpenAI**, hãy giữ tham chiếu
   mô hình là `openai/<model>` và đặt `agentRuntime.id: "pi"`. Hồ sơ xác thực
   `openai-codex` đã chọn được định tuyến nội bộ qua cơ chế vận chuyển xác thực
   Codex cũ của PI.
4. Nếu cấu hình cũ vẫn chứa **tham chiếu mô hình `openai-codex/*`**, hãy sửa nó
   thành `openai/<model>` bằng `openclaw doctor --fix`.
5. Nếu người dùng nói rõ **ACP**, **acpx**, hoặc **bộ điều hợp ACP Codex**, hãy
   dùng ACP với `runtime: "acp"` và `agentId: "codex"`.
6. Nếu yêu cầu là cho **Claude Code, Gemini CLI, OpenCode, Cursor, Droid, hoặc
   một harness bên ngoài khác**, hãy dùng ACP/acpx, không dùng runtime sub-agent
   gốc.

| Ý bạn là...                            | Dùng...                                      |
| -------------------------------------- | ------------------------------------------- |
| Điều khiển chat/luồng máy chủ ứng dụng Codex | `/codex ...` từ Plugin `codex` đi kèm       |
| Runtime agent nhúng máy chủ ứng dụng Codex | Tham chiếu mô hình agent `openai/*`         |
| OpenAI Codex OAuth                     | Hồ sơ xác thực `openai-codex`               |
| Claude Code hoặc harness bên ngoài khác | ACP/acpx                                    |

Để biết phần tách tiền tố họ OpenAI, hãy xem [OpenAI](/vi/providers/openai) và
[Nhà cung cấp mô hình](/vi/concepts/model-providers). Để biết hợp đồng hỗ trợ
runtime Codex, hãy xem [Harness Codex](/vi/plugins/codex-harness#v1-support-contract).

## Quyền sở hữu runtime

Các runtime khác nhau sở hữu các phần khác nhau của vòng lặp.

| Bề mặt                      | PI nhúng của OpenClaw                  | Máy chủ ứng dụng Codex                                                    |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------------- |
| Chủ sở hữu vòng lặp mô hình | OpenClaw thông qua trình chạy PI nhúng | Máy chủ ứng dụng Codex                                                    |
| Trạng thái luồng chuẩn      | Bản ghi OpenClaw                       | Luồng Codex, cộng bản sao bản ghi OpenClaw                                |
| Công cụ động OpenClaw       | Vòng lặp công cụ OpenClaw gốc          | Được bắc cầu qua bộ điều hợp Codex                                        |
| Công cụ shell và tệp gốc    | Đường dẫn PI/OpenClaw                  | Công cụ gốc của Codex, được bắc cầu qua hook gốc khi được hỗ trợ          |
| Công cụ ngữ cảnh            | Lắp ráp ngữ cảnh OpenClaw gốc          | OpenClaw chiếu ngữ cảnh đã lắp ráp vào lượt Codex                         |
| Compaction                  | OpenClaw hoặc công cụ ngữ cảnh đã chọn | Compaction gốc của Codex, với thông báo OpenClaw và bảo trì bản sao       |
| Chuyển phát kênh            | OpenClaw                               | OpenClaw                                                                  |

Phần tách quyền sở hữu này là quy tắc thiết kế chính:

- Nếu OpenClaw sở hữu bề mặt, OpenClaw có thể cung cấp hành vi hook Plugin thông thường.
- Nếu runtime gốc sở hữu bề mặt, OpenClaw cần sự kiện runtime hoặc hook gốc.
- Nếu runtime gốc sở hữu trạng thái luồng chuẩn, OpenClaw nên sao chép và chiếu ngữ cảnh, không viết lại các phần nội bộ không được hỗ trợ.

## Lựa chọn runtime

OpenClaw chọn một runtime nhúng sau khi phân giải nhà cung cấp và mô hình:

1. Runtime đã ghi của một phiên được ưu tiên. Thay đổi cấu hình không chuyển nóng
   một bản ghi hiện có sang hệ thống luồng gốc khác.
2. `OPENCLAW_AGENT_RUNTIME=<id>` buộc runtime đó cho các phiên mới hoặc đã đặt lại.
3. `agents.defaults.agentRuntime.id` hoặc `agents.list[].agentRuntime.id` có thể
   đặt `auto`, `pi`, một id harness nhúng đã đăng ký như `codex`, hoặc một bí
   danh backend CLI được hỗ trợ như `claude-cli`.
4. Trong chế độ `auto`, các runtime Plugin đã đăng ký có thể nhận các cặp nhà
   cung cấp/mô hình được hỗ trợ.
5. Nếu không có runtime nào nhận một lượt trong chế độ `auto`, OpenClaw dùng PI
   làm runtime tương thích. Hãy dùng id runtime rõ ràng khi lần chạy phải nghiêm
   ngặt.

Runtime Plugin rõ ràng sẽ thất bại đóng. Ví dụ, `agentRuntime.id: "codex"` có
nghĩa là Codex hoặc một lỗi lựa chọn/runtime rõ ràng; nó không bao giờ được âm
thầm định tuyến ngược về PI.

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

Các tham chiếu cũ như `claude-cli/claude-opus-4-7` vẫn được hỗ trợ để tương
thích, nhưng cấu hình mới nên giữ nhà cung cấp/mô hình ở dạng chuẩn và đặt
backend thực thi trong `agentRuntime.id`.

Chế độ `auto` được chủ ý giữ thận trọng với hầu hết nhà cung cấp. Mô hình agent
OpenAI là ngoại lệ: runtime chưa đặt và `auto` đều phân giải sang harness Codex.
Cấu hình runtime PI rõ ràng vẫn là tuyến tương thích chọn tham gia cho các lượt
agent `openai/*`; khi ghép với một hồ sơ xác thực `openai-codex` đã chọn,
OpenClaw định tuyến PI nội bộ qua cơ chế vận chuyển xác thực Codex cũ trong khi
giữ tham chiếu mô hình công khai là `openai/*`. Các ghim phiên OpenAI PI lỗi
thời không có cấu hình rõ ràng sẽ được sửa trở lại Codex.

Nếu `openclaw doctor` cảnh báo rằng Plugin `codex` được bật trong khi
`openai-codex/*` vẫn còn trong cấu hình, hãy xem đó là trạng thái tuyến cũ. Chạy
`openclaw doctor --fix` để viết lại thành `openai/*` với runtime Codex.

## Hợp đồng tương thích

Khi runtime không phải là PI, nó nên ghi tài liệu các bề mặt OpenClaw mà nó hỗ
trợ. Dùng dạng này cho tài liệu runtime:

| Câu hỏi                                | Vì sao quan trọng                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Ai sở hữu vòng lặp mô hình?            | Xác định nơi diễn ra quyết định thử lại, tiếp tục công cụ và câu trả lời cuối cùng.            |
| Ai sở hữu lịch sử luồng chuẩn?         | Xác định liệu OpenClaw có thể chỉnh sửa lịch sử hay chỉ sao chép nó.                           |
| Công cụ động OpenClaw có hoạt động không? | Nhắn tin, phiên, cron và các công cụ do OpenClaw sở hữu phụ thuộc vào điều này.             |
| Hook công cụ động có hoạt động không?  | Plugin kỳ vọng `before_tool_call`, `after_tool_call` và middleware quanh các công cụ do OpenClaw sở hữu. |
| Hook công cụ gốc có hoạt động không?   | Shell, patch và các công cụ do runtime sở hữu cần hỗ trợ hook gốc cho chính sách và quan sát. |
| Vòng đời công cụ ngữ cảnh có chạy không? | Plugin bộ nhớ và ngữ cảnh phụ thuộc vào vòng đời lắp ráp, thu nạp, sau lượt và Compaction.  |
| Dữ liệu Compaction nào được phơi bày?  | Một số Plugin chỉ cần thông báo, trong khi các Plugin khác cần metadata đã giữ/đã bỏ.          |
| Điều gì cố ý không được hỗ trợ?        | Người dùng không nên giả định tương đương PI ở nơi runtime gốc sở hữu nhiều trạng thái hơn.   |

Hợp đồng hỗ trợ runtime Codex được ghi lại trong
[Codex harness](/vi/plugins/codex-harness#v1-support-contract).

## Nhãn trạng thái

Đầu ra trạng thái có thể hiển thị cả nhãn `Execution` và `Runtime`. Hãy đọc chúng như
thông tin chẩn đoán, không phải tên nhà cung cấp.

- Một tham chiếu mô hình như `openai/gpt-5.5` cho biết nhà cung cấp/mô hình đã chọn.
- Một id runtime như `codex` cho biết loop nào đang thực thi lượt này.
- Một nhãn kênh như Telegram hoặc Discord cho biết cuộc trò chuyện đang diễn ra ở đâu.

Nếu một phiên vẫn hiển thị PI sau khi thay đổi cấu hình runtime, hãy bắt đầu phiên mới
bằng `/new` hoặc xóa phiên hiện tại bằng `/reset`. Các phiên hiện có giữ nguyên
runtime đã ghi nhận để transcript không bị phát lại qua hai hệ thống phiên native
không tương thích.

## Liên quan

- [Codex harness](/vi/plugins/codex-harness)
- [OpenAI](/vi/providers/openai)
- [Plugin harness tác tử](/vi/plugins/sdk-agent-harness)
- [Loop tác tử](/vi/concepts/agent-loop)
- [Mô hình](/vi/concepts/models)
- [Trạng thái](/vi/cli/status)
