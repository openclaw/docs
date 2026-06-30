---
read_when:
    - Chạy các harness lập trình thông qua ACP
    - Thiết lập các phiên ACP gắn với cuộc trò chuyện trên các kênh nhắn tin
    - Liên kết cuộc trò chuyện kênh tin nhắn với một phiên ACP bền vững
    - Khắc phục sự cố backend ACP, wiring Plugin hoặc phân phối hoàn tất
    - Vận hành các lệnh /acp từ chat
sidebarTitle: ACP agents
summary: Chạy các harness lập trình bên ngoài (Claude Code, Cursor, Gemini CLI, Codex ACP rõ ràng, OpenClaw ACP, OpenCode) thông qua phần phụ trợ ACP
title: Tác tử ACP
x-i18n:
    generated_at: "2026-06-30T14:12:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61edbc3b5a8303dc88e27a1315fe996da70eeee7aa211877d5680eb150e36cb
    source_path: tools/acp-agents.md
    workflow: 16
---

[Phiên Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
cho phép OpenClaw chạy các harness lập trình bên ngoài (ví dụ Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI và các harness
ACPX được hỗ trợ khác) thông qua một plugin backend ACP.

Mỗi lần sinh phiên ACP được theo dõi như một [tác vụ nền](/vi/automation/tasks).

<Note>
**ACP là đường dẫn harness bên ngoài, không phải đường dẫn Codex mặc định.** Plugin
máy chủ ứng dụng Codex gốc sở hữu các điều khiển `/codex ...` và runtime nhúng
`openai/gpt-*` mặc định cho lượt agent; ACP sở hữu các điều khiển
`/acp ...` và các phiên `sessions_spawn({ runtime: "acp" })`.

Nếu bạn muốn Codex hoặc Claude Code kết nối như một máy khách MCP bên ngoài
trực tiếp vào các cuộc trò chuyện kênh OpenClaw hiện có, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp) thay vì ACP.
</Note>

## Tôi cần trang nào?

| Bạn muốn…                                                                                       | Dùng phần này                         | Ghi chú                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liên kết hoặc điều khiển Codex trong cuộc trò chuyện hiện tại                                   | `/codex bind`, `/codex threads`       | Đường dẫn máy chủ ứng dụng Codex gốc khi plugin `codex` được bật; bao gồm trả lời chat đã liên kết, chuyển tiếp hình ảnh, model/nhanh/quyền, dừng và điều khiển điều hướng. ACP là phương án dự phòng tường minh |
| Chạy Claude Code, Gemini CLI, Codex ACP tường minh hoặc harness bên ngoài khác _thông qua_ OpenClaw | Trang này                             | Phiên gắn với chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tác vụ nền, điều khiển runtime                                                                                       |
| Công bố một phiên OpenClaw Gateway _như_ máy chủ ACP cho trình biên tập hoặc máy khách          | [`openclaw acp`](/vi/cli/acp)            | Chế độ cầu nối. IDE/máy khách nói ACP với OpenClaw qua stdio/WebSocket                                                                                                                        |
| Tái sử dụng một AI CLI cục bộ làm model dự phòng chỉ văn bản                                    | [Backend CLI](/vi/gateway/cli-backends)  | Không phải ACP. Không có công cụ OpenClaw, không có điều khiển ACP, không có runtime harness                                                                                                  |

## Tính năng này có hoạt động ngay không?

Có, sau khi cài đặt plugin runtime ACP chính thức:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các source checkout có thể dùng plugin workspace cục bộ `extensions/acpx` sau
`pnpm install`. Chạy `/acp doctor` để kiểm tra mức sẵn sàng.

OpenClaw chỉ hướng dẫn agent về việc sinh ACP khi ACP **thực sự khả dụng**:
ACP phải được bật, dispatch không được tắt, phiên hiện tại không bị sandbox chặn,
và backend runtime phải được tải. Nếu các điều kiện đó không được đáp ứng,
Skills của plugin ACP và hướng dẫn ACP cho `sessions_spawn` sẽ được ẩn để agent
không đề xuất một backend không khả dụng.

<AccordionGroup>
  <Accordion title="Những điểm dễ vướng trong lần chạy đầu">
    - Nếu `plugins.allow` được đặt, đó là danh mục plugin hạn chế và **phải** bao gồm `acpx`; nếu không, backend ACP đã cài đặt sẽ bị chặn có chủ đích và `/acp doctor` sẽ báo mục allowlist bị thiếu.
    - Bộ chuyển đổi Codex ACP được chuẩn bị cùng plugin `acpx` và được khởi chạy cục bộ khi có thể.
    - Codex ACP chạy với `CODEX_HOME` biệt lập; OpenClaw sao chép các mục dự án đáng tin cậy cùng cấu hình định tuyến model/provider an toàn từ cấu hình Codex của host, trong khi auth, thông báo và hook vẫn ở cấu hình host.
    - Các bộ chuyển đổi harness mục tiêu khác vẫn có thể được tải theo nhu cầu bằng `npx` trong lần đầu bạn dùng chúng.
    - Auth của nhà cung cấp vẫn phải tồn tại trên host cho harness đó.
    - Nếu host không có npm hoặc truy cập mạng, các lần tải bộ chuyển đổi trong lần chạy đầu sẽ thất bại cho đến khi cache được làm nóng trước hoặc bộ chuyển đổi được cài theo cách khác.

  </Accordion>
  <Accordion title="Điều kiện tiên quyết của runtime">
    ACP khởi chạy một tiến trình harness bên ngoài thật. OpenClaw sở hữu định tuyến,
    trạng thái tác vụ nền, phân phối, liên kết và chính sách; harness sở hữu
    đăng nhập provider, danh mục model, hành vi hệ thống tệp và công cụ gốc của nó.

    Trước khi quy lỗi cho OpenClaw, hãy xác minh:

    - `/acp doctor` báo một backend đã bật và khỏe mạnh.
    - ID mục tiêu được `acp.allowedAgents` cho phép khi allowlist đó được đặt.
    - Lệnh harness có thể khởi động trên host Gateway.
    - Auth provider hiện diện cho harness đó (`claude`, `codex`, `gemini`, `opencode`, `droid`, v.v.).
    - Model đã chọn tồn tại cho harness đó - ID model không thể dùng chung giữa các harness.
    - `cwd` được yêu cầu tồn tại và có thể truy cập, hoặc bỏ qua `cwd` và để backend dùng mặc định của nó.
    - Chế độ quyền phù hợp với công việc. Các phiên không tương tác không thể bấm prompt quyền gốc, nên các lượt lập trình nặng về ghi/thực thi thường cần một hồ sơ quyền ACPX có thể chạy không cần tương tác.

  </Accordion>
</AccordionGroup>

Công cụ plugin OpenClaw và công cụ OpenClaw tích hợp **không** được công bố cho
các harness ACP theo mặc định. Chỉ bật các cầu nối MCP tường minh trong
[Thiết lập agent ACP](/vi/tools/acp-agents-setup) khi harness cần gọi trực tiếp
các công cụ đó.

## Mục tiêu harness được hỗ trợ

Với backend `acpx`, hãy dùng các ID harness này làm mục tiêu `/acp spawn <id>`
hoặc `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID harness | Backend điển hình                             | Ghi chú                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Bộ chuyển đổi Claude Code ACP                  | Yêu cầu auth Claude Code trên host.                                                 |
| `codex`    | Bộ chuyển đổi Codex ACP                        | Chỉ là phương án dự phòng ACP tường minh khi `/codex` gốc không khả dụng hoặc ACP được yêu cầu. |
| `copilot`  | Bộ chuyển đổi GitHub Copilot ACP               | Yêu cầu auth Copilot CLI/runtime.                                                   |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Ghi đè lệnh acpx nếu bản cài cục bộ công bố một entrypoint ACP khác.               |
| `droid`    | Factory Droid CLI                              | Yêu cầu auth Factory/Droid hoặc `FACTORY_API_KEY` trong môi trường harness.         |
| `gemini`   | Bộ chuyển đổi Gemini CLI ACP                   | Yêu cầu auth Gemini CLI hoặc thiết lập khóa API.                                    |
| `iflow`    | iFlow CLI                                      | Tính khả dụng của bộ chuyển đổi và điều khiển model phụ thuộc vào CLI đã cài đặt.   |
| `kilocode` | Kilo Code CLI                                  | Tính khả dụng của bộ chuyển đổi và điều khiển model phụ thuộc vào CLI đã cài đặt.   |
| `kimi`     | Kimi/Moonshot CLI                              | Yêu cầu auth Kimi/Moonshot trên host.                                               |
| `kiro`     | Kiro CLI                                       | Tính khả dụng của bộ chuyển đổi và điều khiển model phụ thuộc vào CLI đã cài đặt.   |
| `opencode` | Bộ chuyển đổi OpenCode ACP                     | Yêu cầu auth OpenCode CLI/provider.                                                 |
| `openclaw` | Cầu nối OpenClaw Gateway qua `openclaw acp`    | Cho phép harness hiểu ACP nói ngược lại với một phiên OpenClaw Gateway.             |
| `qwen`     | Qwen Code / Qwen CLI                           | Yêu cầu auth tương thích Qwen trên host.                                            |

Alias agent acpx tùy chỉnh có thể được cấu hình trong chính acpx, nhưng chính sách
OpenClaw vẫn kiểm tra `acp.allowedAgents` và mọi ánh xạ
`agents.list[].runtime.acp.agent` trước khi dispatch.

## Runbook cho operator

Luồng `/acp` nhanh từ chat:

<Steps>
  <Step title="Sinh">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, hoặc tường minh
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Làm việc">
    Tiếp tục trong cuộc trò chuyện hoặc luồng đã liên kết (hoặc nhắm đích
    khóa phiên một cách tường minh).
  </Step>
  <Step title="Kiểm tra trạng thái">
    `/acp status`
  </Step>
  <Step title="Tinh chỉnh">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Điều hướng">
    Không thay thế ngữ cảnh: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Dừng">
    `/acp cancel` (lượt hiện tại) hoặc `/acp close` (phiên + liên kết).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Chi tiết vòng đời">
    - Spawn tạo hoặc tiếp tục một phiên runtime ACP, ghi metadata ACP vào kho phiên OpenClaw, và có thể tạo tác vụ nền khi lượt chạy do cha sở hữu.
    - Các phiên ACP do cha sở hữu được xử lý như công việc nền ngay cả khi phiên runtime là persistent; hoàn tất và phân phối xuyên bề mặt đi qua bộ thông báo tác vụ cha thay vì hoạt động như một phiên chat bình thường hướng tới người dùng.
    - Bảo trì tác vụ đóng các phiên ACP one-shot do cha sở hữu đã kết thúc hoặc mồ côi. Các phiên ACP persistent được giữ lại khi còn liên kết cuộc trò chuyện đang hoạt động; các phiên persistent cũ không có liên kết đang hoạt động sẽ bị đóng để chúng không thể được âm thầm tiếp tục sau khi tác vụ sở hữu đã xong hoặc bản ghi tác vụ của nó đã mất.
    - Tin nhắn theo dõi đã liên kết đi trực tiếp tới phiên ACP cho đến khi liên kết bị đóng, bỏ tiêu điểm, đặt lại hoặc hết hạn.
    - Lệnh Gateway vẫn ở cục bộ. `/acp ...`, `/status` và `/unfocus` không bao giờ được gửi như văn bản prompt bình thường tới harness ACP đã liên kết.
    - `cancel` hủy lượt đang hoạt động khi backend hỗ trợ hủy; nó không xóa metadata liên kết hoặc phiên.
    - `close` kết thúc phiên ACP từ góc nhìn của OpenClaw và xóa liên kết. Harness vẫn có thể giữ lịch sử upstream riêng nếu hỗ trợ tiếp tục.
    - Plugin acpx dọn dẹp cây tiến trình wrapper và bộ chuyển đổi do OpenClaw sở hữu sau `close`, và thu dọn các orphan ACPX do OpenClaw sở hữu đã cũ trong lúc Gateway khởi động.
    - Worker runtime nhàn rỗi đủ điều kiện được dọn dẹp sau `acp.runtime.ttlMinutes`; metadata phiên đã lưu vẫn có sẵn cho `/acp sessions`.

  </Accordion>
  <Accordion title="Quy tắc định tuyến Codex gốc">
    Các trigger ngôn ngữ tự nhiên nên định tuyến tới **plugin Codex gốc**
    khi nó được bật:

    - "Liên kết kênh Discord này với Codex."
    - "Gắn chat này vào luồng Codex `<id>`."
    - "Hiển thị các luồng Codex, rồi liên kết luồng này."

    Native Codex conversation binding là đường dẫn điều khiển trò chuyện mặc định.
    Các công cụ động của OpenClaw vẫn thực thi thông qua OpenClaw, trong khi
    các công cụ gốc Codex như shell/apply-patch thực thi bên trong Codex.
    Đối với sự kiện công cụ gốc Codex, OpenClaw chèn một relay hook gốc
    theo từng lượt để hook của Plugin có thể chặn `before_tool_call`, quan sát
    `after_tool_call`, và định tuyến sự kiện Codex `PermissionRequest`
    thông qua phê duyệt của OpenClaw. Hook Codex `Stop` được relay tới
    OpenClaw `before_agent_finalize`, nơi Plugin có thể yêu cầu thêm một
    lượt mô hình trước khi Codex hoàn tất câu trả lời. Relay này vẫn
    cố ý thận trọng: nó không thay đổi đối số công cụ gốc Codex
    hoặc viết lại bản ghi luồng Codex. Chỉ dùng ACP rõ ràng
    khi bạn muốn mô hình runtime/phiên ACP. Ranh giới hỗ trợ Codex
    nhúng được ghi lại trong
    [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Bảng tham chiếu nhanh chọn mô hình / nhà cung cấp / runtime">
    - tham chiếu mô hình Codex cũ - tuyến mô hình OAuth/gói đăng ký Codex cũ được doctor sửa chữa.
    - `openai/*` - runtime nhúng app-server Codex gốc cho các lượt tác tử OpenAI.
    - `/codex ...` - điều khiển cuộc trò chuyện Codex gốc.
    - `/acp ...` hoặc `runtime: "acp"` - điều khiển ACP/acpx rõ ràng.

  </Accordion>
  <Accordion title="Trình kích hoạt ngôn ngữ tự nhiên định tuyến ACP">
    Các trình kích hoạt nên định tuyến tới runtime ACP:

    - "Chạy việc này như một phiên Claude Code ACP một lần và tóm tắt kết quả."
    - "Dùng Gemini CLI cho tác vụ này trong một luồng, rồi giữ các lượt theo dõi trong cùng luồng đó."
    - "Chạy Codex thông qua ACP trong một luồng nền."

    OpenClaw chọn `runtime: "acp"`, phân giải harness `agentId`,
    liên kết với cuộc trò chuyện hoặc luồng hiện tại khi được hỗ trợ, và
    định tuyến các lượt theo dõi tới phiên đó cho đến khi đóng/hết hạn. Codex chỉ
    đi theo đường dẫn này khi ACP/acpx là rõ ràng hoặc Plugin Codex gốc
    không khả dụng cho thao tác được yêu cầu.

    Đối với `sessions_spawn`, `runtime: "acp"` chỉ được quảng bá khi ACP
    được bật, bên yêu cầu không bị sandbox, và một backend runtime ACP
    đã được tải. `acp.dispatch.enabled=false` tạm dừng việc tự động
    điều phối luồng ACP nhưng không ẩn hoặc chặn các lệnh gọi
    `sessions_spawn({ runtime: "acp" })` rõ ràng. Nó nhắm tới các id harness ACP như `codex`,
    `claude`, `droid`, `gemini`, hoặc `opencode`. Không truyền id tác tử
    cấu hình OpenClaw thông thường từ `agents_list` trừ khi mục đó được
    cấu hình rõ ràng với `agents.list[].runtime.type="acp"`;
    nếu không, hãy dùng runtime tác tử con mặc định. Khi một tác tử OpenClaw
    được cấu hình với `runtime.type="acp"`, OpenClaw dùng
    `runtime.acp.agent` làm id harness bên dưới.

  </Accordion>
</AccordionGroup>

## ACP so với tác tử con

Dùng ACP khi bạn muốn runtime harness bên ngoài. Dùng **app-server Codex
gốc** để liên kết/điều khiển cuộc trò chuyện Codex khi Plugin `codex`
được bật. Dùng **tác tử con** khi bạn muốn các lượt chạy được ủy quyền
gốc OpenClaw.

| Khu vực       | Phiên ACP                              | Lượt chạy tác tử con                |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (ví dụ acpx)       | Runtime tác tử con gốc OpenClaw    |
| Khóa phiên    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Lệnh chính    | `/acp ...`                            | `/subagents ...`                   |
| Công cụ spawn | `sessions_spawn` với `runtime:"acp"`  | `sessions_spawn` (runtime mặc định) |

Xem thêm [Tác tử con](/vi/tools/subagents).

## Cách ACP chạy Claude Code

Đối với Claude Code thông qua ACP, ngăn xếp là:

1. Mặt phẳng điều khiển phiên ACP của OpenClaw.
2. Plugin runtime chính thức `@openclaw/acpx`.
3. Bộ điều hợp Claude ACP.
4. Cơ chế runtime/phiên phía Claude.

ACP Claude là một **phiên harness** với điều khiển ACP, tiếp tục phiên,
theo dõi tác vụ nền, và liên kết cuộc trò chuyện/luồng tùy chọn.

Các backend CLI là runtime dự phòng cục bộ chỉ văn bản riêng biệt - xem
[Backend CLI](/vi/gateway/cli-backends).

Đối với người vận hành, quy tắc thực tế là:

- **Muốn `/acp spawn`, phiên có thể liên kết, điều khiển runtime, hoặc công việc harness bền vững?** Dùng ACP.
- **Muốn dự phòng văn bản cục bộ đơn giản thông qua CLI thô?** Dùng backend CLI.

## Phiên được liên kết

### Mô hình tinh thần

- **Bề mặt trò chuyện** - nơi mọi người tiếp tục trò chuyện (kênh Discord, chủ đề Telegram, cuộc trò chuyện iMessage).
- **Phiên ACP** - trạng thái runtime Codex/Claude/Gemini bền vững mà OpenClaw định tuyến tới.
- **Luồng/chủ đề con** - một bề mặt nhắn tin bổ sung tùy chọn chỉ được tạo bởi `--thread ...`.
- **Không gian làm việc runtime** - vị trí hệ thống tệp (`cwd`, repo checkout, không gian làm việc backend) nơi harness chạy. Độc lập với bề mặt trò chuyện.

### Liên kết cuộc trò chuyện hiện tại

`/acp spawn <harness> --bind here` ghim cuộc trò chuyện hiện tại vào
phiên ACP đã spawn - không có luồng con, cùng bề mặt trò chuyện. OpenClaw tiếp tục
sở hữu vận chuyển, xác thực, an toàn, và phân phối. Tin nhắn theo dõi trong
cuộc trò chuyện đó định tuyến tới cùng phiên; `/new` và `/reset` đặt lại
phiên tại chỗ; `/acp close` xóa liên kết.

Ví dụ:

```text
/codex bind                                              # liên kết Codex gốc, định tuyến các tin nhắn tương lai ở đây
/codex model gpt-5.4                                     # tinh chỉnh luồng Codex gốc đã liên kết
/codex stop                                              # điều khiển lượt Codex gốc đang hoạt động
/acp spawn codex --bind here                             # dự phòng ACP rõ ràng cho Codex
/acp spawn codex --thread auto                           # có thể tạo luồng/chủ đề con và liên kết ở đó
/acp spawn codex --bind here --cwd /workspace/repo       # cùng liên kết trò chuyện, Codex chạy trong /workspace/repo
```

<AccordionGroup>
  <Accordion title="Quy tắc liên kết và tính loại trừ">
    - `--bind here` và `--thread ...` loại trừ lẫn nhau.
    - `--bind here` chỉ hoạt động trên các kênh quảng bá khả năng liên kết cuộc trò chuyện hiện tại; nếu không, OpenClaw trả về thông báo không được hỗ trợ rõ ràng. Liên kết vẫn tồn tại qua các lần khởi động lại Gateway.
    - Trên Discord, `spawnSessions` kiểm soát việc tạo luồng con cho `--thread auto|here` - không phải `--bind here`.
    - Nếu bạn spawn tới một tác tử ACP khác mà không có `--cwd`, OpenClaw mặc định kế thừa không gian làm việc của **tác tử đích**. Các đường dẫn kế thừa bị thiếu (`ENOENT`/`ENOTDIR`) quay về mặc định của backend; các lỗi truy cập khác (ví dụ `EACCES`) hiển thị như lỗi spawn.
    - Lệnh quản lý Gateway vẫn ở cục bộ trong các cuộc trò chuyện được liên kết - lệnh `/acp ...` do OpenClaw xử lý ngay cả khi văn bản theo dõi thông thường định tuyến tới phiên ACP đã liên kết; `/status` và `/unfocus` cũng vẫn ở cục bộ bất cứ khi nào xử lý lệnh được bật cho bề mặt đó.

  </Accordion>
  <Accordion title="Phiên liên kết theo luồng">
    Khi liên kết luồng được bật cho bộ điều hợp kênh:

    - OpenClaw liên kết một luồng với phiên ACP đích.
    - Tin nhắn theo dõi trong luồng đó định tuyến tới phiên ACP đã liên kết.
    - Đầu ra ACP được gửi lại cùng luồng.
    - Bỏ tập trung/đóng/lưu trữ/idle-timeout hoặc hết hạn max-age sẽ xóa liên kết.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, và `/unfocus` là lệnh Gateway, không phải prompt gửi tới harness ACP.

    Cờ tính năng bắt buộc cho ACP liên kết theo luồng:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` được bật theo mặc định (đặt `false` để tạm dừng điều phối luồng ACP tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` rõ ràng vẫn hoạt động).
    - Spawn phiên luồng của bộ điều hợp kênh được bật (mặc định: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Hỗ trợ liên kết luồng phụ thuộc vào bộ điều hợp. Nếu bộ điều hợp kênh
    đang hoạt động không hỗ trợ liên kết luồng, OpenClaw trả về thông báo
    không được hỗ trợ/không khả dụng rõ ràng.

  </Accordion>
  <Accordion title="Các kênh hỗ trợ luồng">
    - Bất kỳ bộ điều hợp kênh nào phơi bày khả năng liên kết phiên/luồng.
    - Hỗ trợ tích hợp hiện tại: luồng/kênh **Discord**, chủ đề **Telegram** (chủ đề diễn đàn trong nhóm/siêu nhóm và chủ đề DM).
    - Kênh Plugin có thể thêm hỗ trợ thông qua cùng giao diện liên kết.

  </Accordion>
</AccordionGroup>

## Liên kết kênh bền vững

Đối với quy trình làm việc không nhất thời, cấu hình liên kết ACP bền vững trong
các mục `bindings[]` cấp cao nhất.

### Mô hình liên kết

<ParamField path="bindings[].type" type='"acp"'>
  Đánh dấu một liên kết cuộc trò chuyện ACP bền vững.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Xác định cuộc trò chuyện đích. Hình dạng theo từng kênh:

- **Kênh/luồng Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kênh/DM Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Ưu tiên id Slack ổn định; liên kết kênh cũng khớp các trả lời bên trong luồng của kênh đó.
- **Chủ đề diễn đàn Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/nhóm WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Dùng số E.164 như `+15555550123` cho cuộc trò chuyện trực tiếp và JID nhóm WhatsApp như `120363424282127706@g.us` cho nhóm.
- **DM/nhóm iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Ưu tiên `chat_id:*` cho liên kết nhóm ổn định.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id tác tử OpenClaw sở hữu.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Ghi đè ACP tùy chọn.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Nhãn tùy chọn hiển thị cho người vận hành.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Thư mục làm việc runtime tùy chọn.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Ghi đè backend tùy chọn.
</ParamField>

### Mặc định runtime theo từng tác tử

Dùng `agents.list[].runtime` để định nghĩa mặc định ACP một lần cho mỗi tác tử:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, ví dụ `codex` hoặc `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Thứ tự ưu tiên ghi đè cho phiên liên kết ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Mặc định ACP toàn cục (ví dụ `acp.backend`)

### Ví dụ

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
      {
        id: "claude",
        runtime: {
          type: "acp",
          acp: { agent: "claude", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
    {
      type: "acp",
      agentId: "claude",
      match: {
        channel: "telegram",
        accountId: "default",
        peer: { kind: "group", id: "-1001234567890:topic:42" },
      },
      acp: { cwd: "/workspace/repo-b" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "discord", accountId: "default" },
    },
    {
      type: "route",
      agentId: "main",
      match: { channel: "telegram", accountId: "default" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": { requireMention: false },
          },
        },
      },
    },
    telegram: {
      groups: {
        "-1001234567890": {
          topics: { "42": { requireMention: false } },
        },
      },
    },
  },
}
```

### Hành vi

- OpenClaw đảm bảo phiên ACP đã cấu hình tồn tại sau bước tiếp nhận theo kênh cụ thể và trước khi sử dụng.
- Tin nhắn trong kênh, chủ đề hoặc cuộc trò chuyện đó được định tuyến đến phiên ACP đã cấu hình.
- Các liên kết ACP đã cấu hình sở hữu tuyến phiên của chúng. Việc phát tán broadcast của kênh không thay thế phiên ACP đã cấu hình cho một liên kết khớp.
- Trong các cuộc trò chuyện đã liên kết, `/new` và `/reset` đặt lại cùng khóa phiên ACP tại chỗ.
- Các liên kết runtime tạm thời (ví dụ được tạo bởi các luồng tập trung vào luồng hội thoại) vẫn áp dụng khi có mặt.
- Với các lần sinh ACP giữa các agent mà không có `cwd` rõ ràng, OpenClaw kế thừa workspace của agent đích từ cấu hình agent.
- Các đường dẫn workspace kế thừa bị thiếu sẽ rơi về cwd mặc định của backend; các lỗi truy cập không bị thiếu sẽ hiển thị dưới dạng lỗi spawn.

## Khởi động phiên ACP

Hai cách để khởi động một phiên ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    Dùng `runtime: "acp"` để khởi động một phiên ACP từ một lượt agent hoặc
    lệnh gọi công cụ.

    ```json
    {
      "task": "Open the repo and summarize failing tests",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` mặc định là `subagent`, vì vậy hãy đặt rõ ràng `runtime: "acp"`
    cho các phiên ACP. Nếu bỏ qua `agentId`, OpenClaw dùng
    `acp.defaultAgent` khi đã cấu hình. `mode: "session"` yêu cầu
    `thread: true` để giữ một cuộc trò chuyện liên kết bền vững.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Dùng `/acp spawn` để điều hành viên kiểm soát rõ ràng từ cuộc trò chuyện.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Các cờ chính:

    - `--mode persistent|oneshot`
    - `--bind here|off`
    - `--thread auto|here|off`
    - `--cwd <absolute-path>`
    - `--label <name>`

    Xem [Lệnh slash](/vi/tools/slash-commands).

  </Tab>
</Tabs>

### Tham số `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt ban đầu được gửi đến phiên ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Phải là `"acp"` cho các phiên ACP.
</ParamField>
<ParamField path="agentId" type="string">
  ID harness ACP đích. Rơi về `acp.defaultAgent` nếu được đặt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Yêu cầu luồng liên kết thread khi được hỗ trợ.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` là một lần; `"session"` là bền vững. Nếu `thread: true` và
  bỏ qua `mode`, OpenClaw có thể mặc định sang hành vi bền vững theo
  đường dẫn runtime. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc runtime được yêu cầu (được xác thực theo chính sách
  backend/runtime). Nếu bỏ qua, ACP spawn kế thừa workspace của agent đích
  khi đã cấu hình; các đường dẫn kế thừa bị thiếu rơi về mặc định của backend,
  còn lỗi truy cập thật sẽ được trả về.
</ParamField>
<ParamField path="label" type="string">
  Nhãn hiển thị cho điều hành viên, dùng trong văn bản phiên/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tiếp tục một phiên ACP hiện có thay vì tạo phiên mới. Agent phát lại
  lịch sử hội thoại của nó qua `session/load`. Yêu cầu `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` truyền các tóm tắt tiến trình chạy ACP ban đầu trở lại
  phiên yêu cầu dưới dạng sự kiện hệ thống. Các phản hồi được chấp nhận bao gồm
  `streamLogPath` trỏ đến nhật ký JSONL theo phạm vi phiên
  (`<sessionId>.acp-stream.jsonl`) mà bạn có thể tail để xem toàn bộ lịch sử chuyển tiếp.
  Luồng tiến trình cha hiển thị commentary của assistant và tiến trình trạng thái ACP
  theo mặc định, trừ khi `streaming.progress.commentary=false`. Discord cũng mặc định
  bản xem trước cha sang chế độ tiến trình khi chưa cấu hình chế độ stream. Tiến trình
  trạng thái vẫn tôn trọng `acp.stream.tagVisibility`, nên các thẻ như `plan`
  vẫn bị ẩn trừ khi được bật rõ ràng.
</ParamField>

Các lần chạy ACP `sessions_spawn` dùng `agents.defaults.subagents.runTimeoutSeconds` làm
giới hạn lượt con mặc định. Công cụ không chấp nhận ghi đè timeout theo từng lệnh gọi.

<ParamField path="model" type="string">
  Ghi đè model rõ ràng cho phiên con ACP. Các ACP spawn của Codex
  chuẩn hóa các ref OpenAI như `openai/gpt-5.4` thành cấu hình khởi động
  Codex ACP trước `session/new`; các dạng slash như `openai/gpt-5.4/high`
  cũng đặt mức nỗ lực suy luận của Codex ACP.
  Khi bỏ qua, `sessions_spawn({ runtime: "acp" })` dùng các mặc định
  model subagent hiện có (`agents.defaults.subagents.model` hoặc
  `agents.list[].subagents.model`) khi đã cấu hình; nếu không, nó để
  harness ACP dùng model mặc định riêng của harness.
  Các harness khác phải quảng bá ACP `models` và hỗ trợ
  `session/set_model`; nếu không, OpenClaw/acpx sẽ lỗi rõ ràng thay vì
  âm thầm rơi về mặc định của agent đích.
</ParamField>
<ParamField path="thinking" type="string">
  Mức thinking/suy luận rõ ràng. Với Codex ACP, `minimal` ánh xạ tới
  mức nỗ lực thấp, `low`/`medium`/`high`/`xhigh` ánh xạ trực tiếp, và `off`
  bỏ qua ghi đè khởi động reasoning-effort.
  Khi bỏ qua, ACP spawn dùng các mặc định thinking subagent hiện có và
  `agents.defaults.models["provider/model"].params.thinking` theo từng model
  cho model đã chọn.
</ParamField>

## Chế độ liên kết spawn và thread

<Tabs>
  <Tab title="--bind here|off">
    | Chế độ | Hành vi                                                                  |
    | ------ | ------------------------------------------------------------------------ |
    | `here` | Liên kết cuộc trò chuyện đang hoạt động hiện tại tại chỗ; lỗi nếu không có cuộc trò chuyện nào đang hoạt động. |
    | `off`  | Không tạo liên kết cuộc trò chuyện hiện tại.                             |

    Ghi chú:

    - `--bind here` là đường dẫn điều hành viên đơn giản nhất để "biến kênh hoặc cuộc trò chuyện này thành do Codex hỗ trợ."
    - `--bind here` không tạo thread con.
    - `--bind here` chỉ khả dụng trên các kênh cung cấp hỗ trợ liên kết cuộc trò chuyện hiện tại.
    - Không thể kết hợp `--bind` và `--thread` trong cùng một lệnh gọi `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Chế độ | Hành vi                                                                                           |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | Trong một thread đang hoạt động: liên kết thread đó. Ngoài thread: tạo/liên kết thread con khi được hỗ trợ. |
    | `here` | Yêu cầu thread đang hoạt động hiện tại; lỗi nếu không ở trong thread.                              |
    | `off`  | Không liên kết. Phiên khởi động ở trạng thái chưa liên kết.                                        |

    Ghi chú:

    - Trên các bề mặt liên kết không phải thread, hành vi mặc định thực tế là `off`.
    - Spawn liên kết thread yêu cầu hỗ trợ chính sách kênh:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Dùng `--bind here` khi bạn muốn ghim cuộc trò chuyện hiện tại mà không tạo thread con.

  </Tab>
</Tabs>

## Mô hình phân phối

Phiên ACP có thể là workspace tương tác hoặc công việc nền do cha sở hữu.
Đường dẫn phân phối phụ thuộc vào dạng đó.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Các phiên tương tác nhằm tiếp tục trò chuyện trên một bề mặt chat
    hiển thị:

    - `/acp spawn ... --bind here` liên kết cuộc trò chuyện hiện tại với phiên ACP.
    - `/acp spawn ... --thread ...` liên kết một thread/chủ đề của kênh với phiên ACP.
    - `bindings[].type="acp"` bền vững đã cấu hình định tuyến các cuộc trò chuyện khớp đến cùng phiên ACP.

    Các tin nhắn tiếp theo trong cuộc trò chuyện đã liên kết được định tuyến trực tiếp đến
    phiên ACP, và đầu ra ACP được gửi trả về đúng cùng
    kênh/thread/chủ đề đó.

    Những gì OpenClaw gửi đến harness:

    - Các follow-up đã liên kết thông thường được gửi dưới dạng văn bản prompt, cộng với tệp đính kèm chỉ khi harness/backend hỗ trợ.
    - Các lệnh quản lý `/acp` và lệnh Gateway cục bộ được chặn trước khi gửi đến ACP.
    - Sự kiện hoàn tất do runtime tạo được vật chất hóa theo từng đích. Agent OpenClaw nhận envelope runtime-context nội bộ của OpenClaw; harness ACP bên ngoài nhận một prompt thuần với kết quả con và chỉ dẫn. Envelope thô `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` không bao giờ được gửi đến harness bên ngoài hoặc được lưu bền vững dưới dạng văn bản transcript người dùng ACP.
    - Các mục transcript ACP dùng văn bản kích hoạt hiển thị cho người dùng hoặc prompt hoàn tất thuần. Metadata sự kiện nội bộ vẫn có cấu trúc trong OpenClaw khi có thể và không được xem là nội dung chat do người dùng viết.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Các phiên ACP một lần do một lượt chạy agent khác spawn là các
    con chạy nền, tương tự sub-agent:

    - Cha yêu cầu công việc bằng `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Con chạy trong phiên harness ACP riêng của nó.
    - Các lượt con chạy trên cùng làn nền dùng cho spawn sub-agent gốc, vì vậy harness ACP chậm không chặn công việc phiên chính không liên quan.
    - Báo cáo hoàn tất trả về qua đường dẫn thông báo hoàn tất tác vụ. OpenClaw chuyển đổi metadata hoàn tất nội bộ thành prompt ACP thuần trước khi gửi đến harness bên ngoài, để harness không thấy các marker ngữ cảnh runtime chỉ dành cho OpenClaw.
    - Cha viết lại kết quả con bằng giọng assistant thông thường khi cần phản hồi hiển thị cho người dùng.

    **Không** xem đường dẫn này như một cuộc trò chuyện ngang hàng giữa cha
    và con. Con đã có kênh hoàn tất trở lại
    cha.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` có thể nhắm đến một phiên khác sau khi spawn. Với các
    phiên ngang hàng thông thường, OpenClaw dùng đường dẫn follow-up agent-to-agent (A2A)
    sau khi chèn tin nhắn:

    - Chờ phản hồi của phiên đích.
    - Tùy chọn cho phép bên yêu cầu và đích trao đổi một số lượt follow-up có giới hạn.
    - Yêu cầu đích tạo một tin nhắn thông báo.
    - Gửi thông báo đó đến kênh hoặc thread hiển thị.

    Đường dẫn A2A đó là fallback cho các lượt gửi ngang hàng khi người gửi cần một
    follow-up hiển thị. Nó vẫn được bật khi một phiên không liên quan có thể
    nhìn thấy và nhắn đến đích ACP, ví dụ dưới các thiết lập
    `tools.sessions.visibility` rộng.

    OpenClaw chỉ bỏ qua lượt theo dõi A2A khi bên yêu cầu là
    cha của chính tiến trình con ACP một lần do cha sở hữu. Trong trường hợp đó,
    chạy A2A bên trên quá trình hoàn tất tác vụ có thể đánh thức cha bằng
    kết quả của con, chuyển tiếp phản hồi của cha ngược lại vào con, và
    tạo một vòng lặp vọng lại cha/con. Kết quả `sessions_send` báo cáo
    `delivery.status="skipped"` cho trường hợp con được sở hữu đó vì
    đường dẫn hoàn tất đã chịu trách nhiệm về kết quả.

  </Accordion>
  <Accordion title="Tiếp tục một phiên hiện có">
    Dùng `resumeSessionId` để tiếp tục một phiên ACP trước đó thay vì
    bắt đầu mới. Tác tử phát lại lịch sử hội thoại qua
    `session/load`, nên nó tiếp tục với đầy đủ ngữ cảnh của những gì đã diễn ra trước đó.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Các trường hợp sử dụng phổ biến:

    - Bàn giao một phiên Codex từ máy tính xách tay sang điện thoại - bảo tác tử tiếp tục từ chỗ bạn đã dừng.
    - Tiếp tục một phiên lập trình bạn đã bắt đầu tương tác trong CLI, giờ chạy không giao diện qua tác tử của bạn.
    - Tiếp tục công việc bị gián đoạn do Gateway khởi động lại hoặc hết thời gian chờ khi rảnh.

    Ghi chú:

    - `resumeSessionId` chỉ áp dụng khi `runtime: "acp"`; runtime tác tử con mặc định bỏ qua trường chỉ dành cho ACP này.
    - `streamTo` chỉ áp dụng khi `runtime: "acp"`; runtime tác tử con mặc định bỏ qua trường chỉ dành cho ACP này.
    - `resumeSessionId` là id tiếp tục ACP/harness cục bộ trên máy chủ, không phải khóa phiên kênh OpenClaw; OpenClaw vẫn kiểm tra chính sách sinh ACP và chính sách tác tử đích trước khi điều phối, còn backend ACP hoặc harness sở hữu việc ủy quyền để tải id upstream đó.
    - `resumeSessionId` khôi phục lịch sử hội thoại ACP upstream; `thread` và `mode` vẫn áp dụng bình thường cho phiên OpenClaw mới bạn đang tạo, nên `mode: "session"` vẫn yêu cầu `thread: true`.
    - Tác tử đích phải hỗ trợ `session/load` (Codex và Claude Code có hỗ trợ).
    - Nếu không tìm thấy id phiên, thao tác sinh thất bại với lỗi rõ ràng - không âm thầm chuyển về một phiên mới.

  </Accordion>
  <Accordion title="Kiểm thử nhanh sau triển khai">
    Sau khi triển khai Gateway, hãy chạy một kiểm tra đầu cuối trực tiếp thay vì
    chỉ tin vào kiểm thử đơn vị:

    1. Xác minh phiên bản Gateway đã triển khai và commit trên máy chủ đích.
    2. Mở một phiên cầu nối ACPX tạm thời tới một tác tử trực tiếp.
    3. Yêu cầu tác tử đó gọi `sessions_spawn` với `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, và tác vụ `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Xác minh `accepted=yes`, một `childSessionKey` thật, và không có lỗi trình xác thực.
    5. Dọn dẹp phiên cầu nối tạm thời.

    Giữ cổng kiểm tra ở `mode: "run"` và bỏ qua `streamTo: "parent"` -
    các đường dẫn `mode: "session"` gắn với luồng và chuyển tiếp luồng là những
    lượt kiểm tra tích hợp phong phú riêng biệt.

  </Accordion>
</AccordionGroup>

## Tương thích sandbox

Các phiên ACP hiện chạy trên runtime của máy chủ, **không** chạy bên trong
sandbox của OpenClaw.

<Warning>
**Ranh giới bảo mật:**

- Harness bên ngoài có thể đọc/ghi theo quyền CLI riêng của nó và `cwd` đã chọn.
- Chính sách sandbox của OpenClaw **không** bao bọc quá trình thực thi harness ACP.
- OpenClaw vẫn thực thi các cổng tính năng ACP, tác tử được phép, quyền sở hữu phiên, ràng buộc kênh, và chính sách phân phối Gateway.
- Dùng `runtime: "subagent"` cho công việc gốc OpenClaw được sandbox thực thi.

</Warning>

Các giới hạn hiện tại:

- Nếu phiên yêu cầu đang ở trong sandbox, các thao tác sinh ACP bị chặn cho cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
- `sessions_spawn` với `runtime: "acp"` không hỗ trợ `sandbox: "require"`.

## Phân giải đích phiên

Hầu hết hành động `/acp` chấp nhận một đích phiên tùy chọn (`session-key`,
`session-id`, hoặc `session-label`).

**Thứ tự phân giải:**

1. Đối số đích tường minh (hoặc `--session` cho `/acp steer`)
   - thử khóa
   - rồi id phiên có dạng UUID
   - rồi nhãn
2. Ràng buộc luồng hiện tại (nếu cuộc hội thoại/luồng này được ràng buộc với một phiên ACP).
3. Dự phòng về phiên yêu cầu hiện tại.

Ràng buộc cuộc hội thoại hiện tại và ràng buộc luồng đều tham gia ở
bước 2.

Nếu không phân giải được đích nào, OpenClaw trả về một lỗi rõ ràng
(`Unable to resolve session target: ...`).

## Điều khiển ACP

| Lệnh                 | Tác dụng                                                  | Ví dụ                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tạo phiên ACP; tùy chọn ràng buộc hiện tại hoặc ràng buộc luồng. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hủy lượt đang chạy cho phiên đích.                        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Gửi chỉ dẫn điều hướng tới phiên đang chạy.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Đóng phiên và gỡ ràng buộc các đích luồng.                | `/acp close`                                                  |
| `/acp status`        | Hiển thị backend, chế độ, trạng thái, tùy chọn runtime, năng lực. | `/acp status`                                                 |
| `/acp set-mode`      | Đặt chế độ runtime cho phiên đích.                        | `/acp set-mode plan`                                          |
| `/acp set`           | Ghi tùy chọn cấu hình runtime chung.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Đặt ghi đè thư mục làm việc runtime.                      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Đặt hồ sơ chính sách phê duyệt.                           | `/acp permissions strict`                                     |
| `/acp timeout`       | Đặt thời gian chờ runtime (giây).                         | `/acp timeout 120`                                            |
| `/acp model`         | Đặt ghi đè mô hình runtime.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Xóa các ghi đè tùy chọn runtime của phiên.                | `/acp reset-options`                                          |
| `/acp sessions`      | Liệt kê các phiên ACP gần đây từ kho lưu trữ.             | `/acp sessions`                                               |
| `/acp doctor`        | Sức khỏe backend, năng lực, bản sửa có thể hành động.     | `/acp doctor`                                                 |
| `/acp install`       | In các bước cài đặt và bật theo cách xác định.            | `/acp install`                                                |

Điều khiển runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model`, và `reset-options`) yêu cầu
danh tính chủ sở hữu từ các kênh bên ngoài và `operator.admin` từ các máy khách Gateway
nội bộ. Người gửi không phải chủ sở hữu nhưng được ủy quyền vẫn có thể dùng `sessions`, `doctor`,
`install`, và `help`.

`/acp status` hiển thị các tùy chọn runtime có hiệu lực cùng các định danh phiên cấp runtime và
cấp backend. Lỗi điều khiển không được hỗ trợ hiện rõ ràng
khi backend thiếu một năng lực. `/acp sessions` đọc
kho lưu trữ cho phiên được ràng buộc hiện tại hoặc phiên yêu cầu; các token đích
(`session-key`, `session-id`, hoặc `session-label`) được phân giải thông qua
khám phá phiên Gateway, bao gồm các gốc `session.store`
tùy chỉnh theo từng tác tử.

### Ánh xạ tùy chọn runtime

`/acp` có các lệnh tiện ích và một bộ đặt giá trị chung. Các thao tác
tương đương:

| Lệnh                         | Ánh xạ tới                           | Ghi chú                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | khóa cấu hình runtime `model`        | Với Codex ACP, OpenClaw chuẩn hóa `openai/<model>` thành id mô hình của adapter và ánh xạ các hậu tố suy luận dạng gạch chéo như `openai/gpt-5.4/high` sang `reasoning_effort`.                           |
| `/acp set thinking <level>`  | tùy chọn chuẩn `thinking`            | OpenClaw gửi giá trị tương đương do backend quảng bá khi có, ưu tiên `thinking`, rồi `effort`, `reasoning_effort`, hoặc `thought_level`. Với Codex ACP, adapter ánh xạ các giá trị sang `reasoning_effort`. |
| `/acp permissions <profile>` | tùy chọn chuẩn `permissionProfile`   | OpenClaw gửi giá trị tương đương do backend quảng bá khi có, chẳng hạn `approval_policy`, `permission_profile`, `permissions`, hoặc `permission_mode`.                                                     |
| `/acp timeout <seconds>`     | tùy chọn chuẩn `timeoutSeconds`      | OpenClaw gửi giá trị tương đương do backend quảng bá khi có, chẳng hạn `timeout` hoặc `timeout_seconds`.                                                                                                   |
| `/acp cwd <path>`            | ghi đè cwd runtime                   | Cập nhật trực tiếp.                                                                                                                                                                                        |
| `/acp set <key> <value>`     | chung                                | `key=cwd` dùng đường dẫn ghi đè cwd.                                                                                                                                                                       |
| `/acp reset-options`         | xóa toàn bộ ghi đè runtime           | -                                                                                                                                                                                                          |

## Harness acpx, thiết lập plugin, và quyền

Để biết cấu hình harness acpx (bí danh Claude Code / Codex / Gemini CLI),
các cầu nối MCP plugin-tools và OpenClaw-tools, cũng như các chế độ
quyền ACP, xem
[tác tử ACP - thiết lập](/vi/tools/acp-agents-setup).

## Khắc phục sự cố

| Triệu chứng                                                                 | Nguyên nhân có khả năng xảy ra                                                                                          | Cách khắc phục                                                                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Plugin backend bị thiếu, bị tắt, hoặc bị chặn bởi `plugins.allow`.                                                       | Cài đặt và bật Plugin backend, đưa `acpx` vào `plugins.allow` khi danh sách cho phép đó được đặt, rồi chạy `/acp doctor`.                                                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP bị tắt toàn cục.                                                                                                     | Đặt `acp.enabled=true`.                                                                                                                                                           |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Tính năng điều phối tự động từ tin nhắn luồng thông thường bị tắt.                                                       | Đặt `acp.dispatch.enabled=true` để tiếp tục định tuyến luồng tự động; các lệnh gọi tường minh `sessions_spawn({ runtime: "acp" })` vẫn hoạt động.                                  |
| `ACP agent "<id>" is not allowed by policy`                                 | Tác tử không có trong danh sách cho phép.                                                                                | Dùng `agentId` được cho phép hoặc cập nhật `acp.allowedAgents`.                                                                                                                    |
| `/acp doctor` báo backend chưa sẵn sàng ngay sau khi khởi động              | Plugin backend bị thiếu, bị tắt, bị chặn bởi chính sách cho phép/từ chối, hoặc tệp thực thi đã cấu hình của nó không có. | Cài đặt/bật Plugin backend, chạy lại `/acp doctor`, và kiểm tra lỗi cài đặt backend hoặc lỗi chính sách nếu trạng thái vẫn không khỏe mạnh.                                        |
| Không tìm thấy lệnh của bộ điều hợp                                         | CLI của bộ điều hợp chưa được cài đặt, Plugin bên ngoài bị thiếu, hoặc lần tải `npx` đầu tiên thất bại với bộ điều hợp không phải Codex. | Chạy `/acp doctor`, cài đặt/làm nóng trước bộ điều hợp trên máy chủ Gateway, hoặc cấu hình tường minh lệnh tác tử acpx.                                                           |
| Bộ chạy báo không tìm thấy mô hình                                          | ID mô hình hợp lệ cho nhà cung cấp/bộ chạy khác nhưng không hợp lệ với đích ACP này.                                     | Dùng mô hình được bộ chạy đó liệt kê, cấu hình mô hình trong bộ chạy, hoặc bỏ qua ghi đè.                                                                                          |
| Lỗi xác thực nhà cung cấp từ bộ chạy                                        | OpenClaw khỏe mạnh, nhưng CLI/nhà cung cấp đích chưa đăng nhập.                                                         | Đăng nhập hoặc cung cấp khóa nhà cung cấp bắt buộc trong môi trường máy chủ Gateway.                                                                                              |
| `Unable to resolve session target: ...`                                     | Token khóa/ID/nhãn không đúng.                                                                                          | Chạy `/acp sessions`, sao chép đúng khóa/nhãn, rồi thử lại.                                                                                                                       |
| `--bind here requires running /acp spawn inside an active ... conversation` | Dùng `--bind here` khi không có cuộc trò chuyện đang hoạt động có thể liên kết.                                          | Chuyển sang cuộc trò chuyện/kênh đích rồi thử lại, hoặc dùng spawn không liên kết.                                                                                                |
| `Conversation bindings are unavailable for <channel>.`                      | Bộ điều hợp thiếu khả năng liên kết ACP với cuộc trò chuyện hiện tại.                                                    | Dùng `/acp spawn ... --thread ...` ở nơi được hỗ trợ, cấu hình `bindings[]` cấp cao nhất, hoặc chuyển sang kênh được hỗ trợ.                                                      |
| `--thread here requires running /acp spawn inside an active ... thread`     | Dùng `--thread here` bên ngoài ngữ cảnh luồng.                                                                           | Chuyển sang luồng đích hoặc dùng `--thread auto`/`off`.                                                                                                                           |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Người dùng khác sở hữu đích liên kết đang hoạt động.                                                                     | Liên kết lại với tư cách chủ sở hữu hoặc dùng cuộc trò chuyện hay luồng khác.                                                                                                     |
| `Thread bindings are unavailable for <channel>.`                            | Bộ điều hợp thiếu khả năng liên kết luồng.                                                                               | Dùng `--thread off` hoặc chuyển sang bộ điều hợp/kênh được hỗ trợ.                                                                                                                |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP nằm phía máy chủ; phiên yêu cầu đang bị sandbox.                                                             | Dùng `runtime="subagent"` từ các phiên bị sandbox, hoặc chạy ACP spawn từ phiên không bị sandbox.                                                                                 |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Đã yêu cầu `sandbox="require"` cho runtime ACP.                                                                          | Dùng `runtime="subagent"` cho sandbox bắt buộc, hoặc dùng ACP với `sandbox="inherit"` từ phiên không bị sandbox.                                                                  |
| `Cannot apply --model ... did not advertise model support`                  | Bộ chạy đích không cung cấp chuyển đổi mô hình ACP chung.                                                                | Dùng bộ chạy quảng bá ACP `models`/`session/set_model`, dùng tham chiếu mô hình Codex ACP, hoặc cấu hình mô hình trực tiếp trong bộ chạy nếu nó có cờ khởi động riêng.            |
| Thiếu siêu dữ liệu ACP cho phiên đã liên kết                                | Siêu dữ liệu phiên ACP cũ/đã xóa.                                                                                        | Tạo lại bằng `/acp spawn`, rồi liên kết lại/tập trung luồng.                                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` chặn ghi/thực thi trong phiên ACP không tương tác.                                                      | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại gateway. Xem [Cấu hình quyền](/vi/tools/acp-agents-setup#permission-configuration).           |
| Phiên ACP thất bại sớm với rất ít đầu ra                                    | Các lời nhắc cấp quyền bị chặn bởi `permissionMode`/`nonInteractivePermissions`.                                         | Kiểm tra nhật ký gateway để tìm `AcpRuntimeError`. Để có đầy đủ quyền, đặt `permissionMode=approve-all`; để suy giảm nhẹ nhàng, đặt `nonInteractivePermissions=deny`.             |
| Phiên ACP treo vô thời hạn sau khi hoàn tất công việc                       | Tiến trình bộ chạy đã kết thúc nhưng phiên ACP không báo hoàn tất.                                                       | Cập nhật OpenClaw; dọn dẹp acpx hiện tại sẽ thu hồi các tiến trình wrapper và bộ điều hợp cũ do OpenClaw sở hữu khi đóng và khi Gateway khởi động.                                |
| Bộ chạy thấy `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Phong bì sự kiện nội bộ bị rò rỉ qua ranh giới ACP.                                                                      | Cập nhật OpenClaw và chạy lại luồng hoàn tất; các bộ chạy bên ngoài chỉ nên nhận lời nhắc hoàn tất thuần túy.                                                                    |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` thuộc về
bộ chuyển tiếp hook Codex gốc, không phải ACP/acpx. Trong cuộc trò chuyện Codex đã liên kết, hãy bắt đầu một
phiên mới bằng `/new` hoặc `/reset`; nếu nó hoạt động một lần rồi quay lại ở lệnh gọi
công cụ gốc tiếp theo, hãy khởi động lại app-server Codex hoặc OpenClaw Gateway thay vì
lặp lại `/new`. Xem [Khắc phục sự cố bộ chạy Codex](/vi/plugins/codex-harness#troubleshooting).
</Note>

## Liên quan

- [Tác tử ACP - thiết lập](/vi/tools/acp-agents-setup)
- [Gửi tác tử](/vi/tools/agent-send)
- [Backend CLI](/vi/gateway/cli-backends)
- [Bộ chạy Codex](/vi/plugins/codex-harness)
- [Runtime bộ chạy Codex](/vi/plugins/codex-harness-runtime)
- [Công cụ sandbox đa tác tử](/vi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (chế độ cầu nối)](/vi/cli/acp)
- [Tác tử phụ](/vi/tools/subagents)
