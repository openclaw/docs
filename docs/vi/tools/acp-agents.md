---
read_when:
    - Chạy các bộ khung lập trình thông qua ACP
    - Thiết lập các phiên ACP gắn với cuộc trò chuyện trên các kênh nhắn tin
    - Liên kết cuộc trò chuyện trên kênh nhắn tin với một phiên ACP được duy trì
    - Khắc phục sự cố phần phụ trợ ACP, kết nối Plugin hoặc phân phối hoàn tất
    - Vận hành các lệnh /acp từ cuộc trò chuyện
sidebarTitle: ACP agents
summary: Chạy các công cụ lập trình bên ngoài (Claude Code, Cursor, Gemini CLI, Codex ACP tường minh, OpenClaw ACP, OpenCode) thông qua phần phụ trợ ACP
title: Tác tử ACP
x-i18n:
    generated_at: "2026-05-06T09:31:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75744690ee307bc86d9a3de268c84e52d8a281ca8a0e7d2d39c9a0cb7fbe2b39
    source_path: tools/acp-agents.md
    workflow: 16
---

[Giao thức Agent Client Protocol (ACP)](https://agentclientprotocol.com/) cho phép các phiên
OpenClaw chạy các harness lập trình bên ngoài (ví dụ Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI và các harness
ACPX được hỗ trợ khác) thông qua một plugin backend ACP.

Mỗi lần sinh phiên ACP được theo dõi dưới dạng một [tác vụ nền](/vi/automation/tasks).

<Note>
**ACP là đường dẫn harness bên ngoài, không phải đường dẫn Codex mặc định.** Plugin
máy chủ ứng dụng Codex gốc sở hữu các điều khiển `/codex ...` và runtime nhúng
`agentRuntime.id: "codex"`; ACP sở hữu các điều khiển
`/acp ...` và các phiên `sessions_spawn({ runtime: "acp" })`.

Nếu bạn muốn Codex hoặc Claude Code kết nối như một client MCP bên ngoài
trực tiếp tới các cuộc trò chuyện kênh OpenClaw hiện có, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp) thay vì ACP.
</Note>

## Tôi cần trang nào?

| Bạn muốn…                                                                                       | Dùng mục này                          | Ghi chú                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liên kết hoặc điều khiển Codex trong cuộc trò chuyện hiện tại                                   | `/codex bind`, `/codex threads`       | Đường dẫn máy chủ ứng dụng Codex gốc khi plugin `codex` được bật; bao gồm trả lời chat đã liên kết, chuyển tiếp hình ảnh, model/nhanh/quyền, dừng và điều khiển điều hướng. ACP là phương án dự phòng rõ ràng |
| Chạy Claude Code, Gemini CLI, Codex ACP rõ ràng hoặc harness bên ngoài khác _thông qua_ OpenClaw | Trang này                             | Phiên gắn với chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tác vụ nền, điều khiển runtime                                                                                       |
| Phơi bày một phiên OpenClaw Gateway _như_ một máy chủ ACP cho trình soạn thảo hoặc client       | [`openclaw acp`](/vi/cli/acp)            | Chế độ cầu nối. IDE/client giao tiếp ACP với OpenClaw qua stdio/WebSocket                                                                                                                     |
| Tái sử dụng một AI CLI cục bộ làm model dự phòng chỉ văn bản                                    | [Backend CLI](/vi/gateway/cli-backends)  | Không phải ACP. Không có công cụ OpenClaw, không có điều khiển ACP, không có runtime harness                                                                                                  |

## Tính năng này có hoạt động ngay không?

Có, sau khi cài đặt plugin runtime ACP chính thức:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các bản checkout nguồn có thể dùng plugin workspace cục bộ `extensions/acpx` sau
`pnpm install`. Chạy `/acp doctor` để kiểm tra mức sẵn sàng.

OpenClaw chỉ hướng dẫn agent về việc sinh ACP khi ACP **thực sự
dùng được**: ACP phải được bật, dispatch không được bị tắt, phiên hiện tại
không được bị chặn bởi sandbox và một backend runtime phải được tải. Nếu các
điều kiện đó không được đáp ứng, Skills của plugin ACP và hướng dẫn ACP cho
`sessions_spawn` sẽ được ẩn để agent không đề xuất một backend không khả dụng.

<AccordionGroup>
  <Accordion title="Các điểm dễ vướng ở lần chạy đầu">
    - Nếu `plugins.allow` được đặt, đó là một danh sách plugin hạn chế và **phải** bao gồm `acpx`; nếu không backend ACP đã cài đặt sẽ bị chặn có chủ ý và `/acp doctor` báo mục allowlist bị thiếu.
    - Adapter Codex ACP được staging cùng plugin `acpx` và được khởi chạy cục bộ khi có thể.
    - Các adapter harness đích khác vẫn có thể được tải theo nhu cầu bằng `npx` trong lần đầu bạn dùng chúng.
    - Xác thực của nhà cung cấp vẫn phải tồn tại trên host cho harness đó.
    - Nếu host không có npm hoặc quyền truy cập mạng, các lần tải adapter đầu tiên sẽ thất bại cho đến khi cache được làm nóng trước hoặc adapter được cài đặt theo cách khác.

  </Accordion>
  <Accordion title="Điều kiện tiên quyết về runtime">
    ACP khởi chạy một tiến trình harness bên ngoài thật. OpenClaw sở hữu định tuyến,
    trạng thái tác vụ nền, phân phối, liên kết và chính sách; harness
    sở hữu đăng nhập nhà cung cấp, catalog model, hành vi hệ thống tệp và
    các công cụ gốc của nó.

    Trước khi quy lỗi cho OpenClaw, hãy xác minh:

    - `/acp doctor` báo backend đã bật và khỏe mạnh.
    - Id đích được `acp.allowedAgents` cho phép khi allowlist đó được đặt.
    - Lệnh harness có thể khởi động trên host Gateway.
    - Xác thực nhà cung cấp hiện diện cho harness đó (`claude`, `codex`, `gemini`, `opencode`, `droid`, v.v.).
    - Model đã chọn tồn tại cho harness đó - id model không dùng chung được giữa các harness.
    - `cwd` được yêu cầu tồn tại và có thể truy cập, hoặc bỏ qua `cwd` và để backend dùng mặc định của nó.
    - Chế độ quyền phù hợp với công việc. Các phiên không tương tác không thể nhấp lời nhắc quyền gốc, nên các lượt chạy lập trình nặng về ghi/thực thi thường cần một hồ sơ quyền ACPX có thể tiếp tục không cần giao diện.

  </Accordion>
</AccordionGroup>

Các công cụ plugin OpenClaw và công cụ OpenClaw tích hợp **không** được phơi bày cho
harness ACP theo mặc định. Chỉ bật các cầu nối MCP rõ ràng trong
[Thiết lập agent ACP](/vi/tools/acp-agents-setup) khi harness
cần gọi trực tiếp các công cụ đó.

## Các đích harness được hỗ trợ

Với backend `acpx`, hãy dùng các id harness này làm đích `/acp spawn <id>`
hoặc `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend thường dùng                            | Ghi chú                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Yêu cầu xác thực Claude Code trên host.                                             |
| `codex`    | Adapter Codex ACP                              | Chỉ là phương án dự phòng ACP rõ ràng khi `/codex` gốc không khả dụng hoặc ACP được yêu cầu. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Yêu cầu xác thực Copilot CLI/runtime.                                               |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Ghi đè lệnh acpx nếu bản cài cục bộ phơi bày một entrypoint ACP khác.              |
| `droid`    | Factory Droid CLI                              | Yêu cầu xác thực Factory/Droid hoặc `FACTORY_API_KEY` trong môi trường harness.     |
| `gemini`   | Adapter Gemini CLI ACP                         | Yêu cầu xác thực Gemini CLI hoặc thiết lập khóa API.                                |
| `iflow`    | iFlow CLI                                      | Tính khả dụng của adapter và điều khiển model phụ thuộc vào CLI đã cài đặt.         |
| `kilocode` | Kilo Code CLI                                  | Tính khả dụng của adapter và điều khiển model phụ thuộc vào CLI đã cài đặt.         |
| `kimi`     | Kimi/Moonshot CLI                              | Yêu cầu xác thực Kimi/Moonshot trên host.                                           |
| `kiro`     | Kiro CLI                                       | Tính khả dụng của adapter và điều khiển model phụ thuộc vào CLI đã cài đặt.         |
| `opencode` | Adapter OpenCode ACP                           | Yêu cầu xác thực OpenCode CLI/nhà cung cấp.                                        |
| `openclaw` | Cầu nối OpenClaw Gateway thông qua `openclaw acp` | Cho phép một harness hiểu ACP giao tiếp ngược lại với phiên OpenClaw Gateway.      |
| `pi`       | Runtime OpenClaw nhúng/Pi                      | Dùng cho các thử nghiệm harness gốc OpenClaw.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Yêu cầu xác thực tương thích Qwen trên host.                                        |

Bí danh agent acpx tùy chỉnh có thể được cấu hình trong chính acpx, nhưng chính sách
OpenClaw vẫn kiểm tra `acp.allowedAgents` và mọi ánh xạ
`agents.list[].runtime.acp.agent` trước khi dispatch.

## Runbook cho operator

Luồng `/acp` nhanh từ chat:

<Steps>
  <Step title="Sinh phiên">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, hoặc rõ ràng
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Làm việc">
    Tiếp tục trong cuộc trò chuyện hoặc thread đã liên kết (hoặc nhắm đích
    khóa phiên một cách rõ ràng).
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
    - Sinh phiên tạo hoặc tiếp tục một phiên runtime ACP, ghi metadata ACP vào kho phiên OpenClaw và có thể tạo tác vụ nền khi lượt chạy thuộc sở hữu của parent.
    - Các phiên ACP thuộc sở hữu của parent được xử lý như công việc nền ngay cả khi phiên runtime là persistent; hoàn tất và phân phối xuyên bề mặt đi qua bộ thông báo tác vụ parent thay vì hoạt động như một phiên chat hướng người dùng bình thường.
    - Bảo trì tác vụ đóng các phiên ACP one-shot thuộc sở hữu của parent đã kết thúc hoặc mồ côi. Các phiên ACP persistent được giữ lại trong khi vẫn còn liên kết cuộc trò chuyện đang hoạt động; các phiên persistent cũ không có liên kết đang hoạt động bị đóng để chúng không thể được tiếp tục âm thầm sau khi tác vụ sở hữu đã xong hoặc bản ghi tác vụ của nó đã mất.
    - Tin nhắn theo dõi đã liên kết đi thẳng tới phiên ACP cho đến khi liên kết được đóng, bỏ focus, đặt lại hoặc hết hạn.
    - Các lệnh Gateway vẫn ở cục bộ. `/acp ...`, `/status` và `/unfocus` không bao giờ được gửi như văn bản prompt bình thường tới một harness ACP đã liên kết.
    - `cancel` hủy lượt đang hoạt động khi backend hỗ trợ hủy; nó không xóa metadata liên kết hoặc phiên.
    - `close` kết thúc phiên ACP theo góc nhìn của OpenClaw và xóa liên kết. Một harness vẫn có thể giữ lịch sử upstream của riêng nó nếu hỗ trợ tiếp tục.
    - Worker runtime nhàn rỗi đủ điều kiện được dọn dẹp sau `acp.runtime.ttlMinutes`; metadata phiên đã lưu vẫn còn khả dụng cho `/acp sessions`.

  </Accordion>
  <Accordion title="Quy tắc định tuyến Codex gốc">
    Các trigger bằng ngôn ngữ tự nhiên nên định tuyến tới **plugin Codex
    gốc** khi nó được bật:

    - "Liên kết kênh Discord này với Codex."
    - "Gắn chat này vào thread Codex `<id>`."
    - "Hiển thị các thread Codex, rồi liên kết thread này."

    Liên kết cuộc trò chuyện Codex gốc là đường dẫn điều khiển chat mặc định.
    Các công cụ động của OpenClaw vẫn thực thi thông qua OpenClaw, trong khi
    các công cụ gốc Codex như shell/apply-patch thực thi bên trong Codex.
    Đối với sự kiện công cụ gốc Codex, OpenClaw chèn một relay hook gốc
    theo từng lượt để các hook plugin có thể chặn `before_tool_call`, quan sát
    `after_tool_call` và định tuyến sự kiện Codex `PermissionRequest`
    thông qua phê duyệt OpenClaw. Hook Codex `Stop` được relay tới
    OpenClaw `before_agent_finalize`, nơi plugin có thể yêu cầu thêm một
    lượt model trước khi Codex hoàn tất câu trả lời. Relay này vẫn
    cố ý bảo thủ: nó không thay đổi đối số công cụ gốc Codex
    hoặc viết lại bản ghi thread Codex. Chỉ dùng ACP rõ ràng
    khi bạn muốn mô hình runtime/phiên ACP. Ranh giới hỗ trợ Codex nhúng
    được ghi lại trong
    [hợp đồng hỗ trợ harness Codex v1](/vi/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Bảng tham chiếu nhanh để chọn mô hình / nhà cung cấp / runtime">
    - `openai-codex/*` - tuyến OAuth/gói đăng ký PI Codex.
    - `openai/*` cộng với `agentRuntime.id: "codex"` - runtime nhúng của app-server Codex gốc.
    - `/codex ...` - điều khiển hội thoại Codex gốc.
    - `/acp ...` hoặc `runtime: "acp"` - điều khiển ACP/acpx rõ ràng.

  </Accordion>
  <Accordion title="Các trigger ngôn ngữ tự nhiên để định tuyến ACP">
    Các trigger nên định tuyến đến runtime ACP:

    - "Chạy tác vụ này dưới dạng phiên Claude Code ACP một lần và tóm tắt kết quả."
    - "Dùng Gemini CLI cho tác vụ này trong một luồng, rồi giữ các phần tiếp theo trong cùng luồng đó."
    - "Chạy Codex qua ACP trong một luồng nền."

    OpenClaw chọn `runtime: "acp"`, phân giải harness `agentId`,
    liên kết với hội thoại hoặc luồng hiện tại khi được hỗ trợ, và
    định tuyến các lượt tiếp theo đến phiên đó cho đến khi đóng/hết hạn. Codex chỉ
    đi theo đường dẫn này khi ACP/acpx được nêu rõ hoặc plugin Codex gốc
    không khả dụng cho thao tác được yêu cầu.

    Với `sessions_spawn`, `runtime: "acp"` chỉ được công bố khi ACP
    được bật, bên yêu cầu không bị sandbox, và một backend runtime ACP
    đã được tải. `acp.dispatch.enabled=false` tạm dừng việc tự động
    gửi luồng ACP nhưng không ẩn hoặc chặn các lệnh gọi
    `sessions_spawn({ runtime: "acp" })` rõ ràng. Nó nhắm đến các id harness ACP như `codex`,
    `claude`, `droid`, `gemini`, hoặc `opencode`. Không truyền một id tác tử
    cấu hình OpenClaw thông thường từ `agents_list` trừ khi mục đó
    được cấu hình rõ ràng với `agents.list[].runtime.type="acp"`;
    nếu không, hãy dùng runtime tác tử con mặc định. Khi một tác tử OpenClaw
    được cấu hình với `runtime.type="acp"`, OpenClaw dùng
    `runtime.acp.agent` làm id harness bên dưới.

  </Accordion>
</AccordionGroup>

## ACP so với tác tử con

Dùng ACP khi bạn muốn một runtime harness bên ngoài. Dùng **app-server
Codex gốc** để liên kết/điều khiển hội thoại Codex khi plugin `codex`
được bật. Dùng **tác tử con** khi bạn muốn các lượt chạy được ủy quyền
gốc của OpenClaw.

| Khu vực       | Phiên ACP                              | Lượt chạy tác tử con                |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (ví dụ acpx)       | Runtime tác tử con gốc OpenClaw    |
| Khóa phiên    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Lệnh chính    | `/acp ...`                            | `/subagents ...`                   |
| Công cụ spawn | `sessions_spawn` với `runtime:"acp"`  | `sessions_spawn` (runtime mặc định) |

Xem thêm [Tác tử con](/vi/tools/subagents).

## Cách ACP chạy Claude Code

Với Claude Code qua ACP, stack là:

1. Mặt phẳng điều khiển phiên ACP của OpenClaw.
2. Plugin runtime `@openclaw/acpx` chính thức.
3. Bộ chuyển đổi ACP của Claude.
4. Bộ máy runtime/phiên phía Claude.

ACP Claude là một **phiên harness** với các điều khiển ACP, tiếp tục phiên,
theo dõi tác vụ nền, và tùy chọn liên kết hội thoại/luồng.

Các backend CLI là các runtime dự phòng cục bộ chỉ văn bản riêng biệt - xem
[Backend CLI](/vi/gateway/cli-backends).

Với người vận hành, quy tắc thực tế là:

- **Muốn `/acp spawn`, phiên có thể liên kết, điều khiển runtime, hoặc công việc harness bền vững?** Dùng ACP.
- **Muốn dự phòng văn bản cục bộ đơn giản qua CLI thô?** Dùng backend CLI.

## Phiên được liên kết

### Mô hình tư duy

- **Bề mặt trò chuyện** - nơi mọi người tiếp tục trao đổi (kênh Discord, chủ đề Telegram, cuộc trò chuyện iMessage).
- **Phiên ACP** - trạng thái runtime Codex/Claude/Gemini bền vững mà OpenClaw định tuyến đến.
- **Luồng/chủ đề con** - một bề mặt nhắn tin bổ sung tùy chọn chỉ được tạo bởi `--thread ...`.
- **Không gian làm việc runtime** - vị trí hệ thống tệp (`cwd`, bản checkout repo, không gian làm việc backend) nơi harness chạy. Độc lập với bề mặt trò chuyện.

### Liên kết hội thoại hiện tại

`/acp spawn <harness> --bind here` ghim hội thoại hiện tại vào
phiên ACP đã spawn - không có luồng con, cùng bề mặt trò chuyện. OpenClaw tiếp tục
sở hữu vận chuyển, xác thực, an toàn, và phân phối. Các tin nhắn tiếp theo trong
hội thoại đó định tuyến đến cùng phiên; `/new` và `/reset` đặt lại
phiên tại chỗ; `/acp close` xóa liên kết.

Ví dụ:

```text
/codex bind                                              # native Codex bind, route future messages here
/codex model gpt-5.4                                     # tune the bound native Codex thread
/codex stop                                              # control the active native Codex turn
/acp spawn codex --bind here                             # explicit ACP fallback for Codex
/acp spawn codex --thread auto                           # may create a child thread/topic and bind there
/acp spawn codex --bind here --cwd /workspace/repo       # same chat binding, Codex runs in /workspace/repo
```

<AccordionGroup>
  <Accordion title="Quy tắc liên kết và tính độc quyền">
    - `--bind here` và `--thread ...` loại trừ lẫn nhau.
    - `--bind here` chỉ hoạt động trên các kênh công bố khả năng liên kết hội thoại hiện tại; nếu không, OpenClaw trả về thông báo không được hỗ trợ rõ ràng. Các liên kết tồn tại qua các lần khởi động lại Gateway.
    - Trên Discord, `spawnSessions` kiểm soát việc tạo luồng con cho `--thread auto|here` - không phải `--bind here`.
    - Nếu bạn spawn đến một tác tử ACP khác mà không có `--cwd`, theo mặc định OpenClaw kế thừa không gian làm việc của **tác tử đích**. Các đường dẫn kế thừa bị thiếu (`ENOENT`/`ENOTDIR`) quay về mặc định backend; các lỗi truy cập khác (ví dụ `EACCES`) hiển thị dưới dạng lỗi spawn.
    - Các lệnh quản lý Gateway vẫn cục bộ trong hội thoại được liên kết - các lệnh `/acp ...` do OpenClaw xử lý ngay cả khi văn bản tiếp theo thông thường định tuyến đến phiên ACP được liên kết; `/status` và `/unfocus` cũng vẫn cục bộ bất cứ khi nào xử lý lệnh được bật cho bề mặt đó.

  </Accordion>
  <Accordion title="Phiên được liên kết với luồng">
    Khi liên kết luồng được bật cho một bộ chuyển đổi kênh:

    - OpenClaw liên kết một luồng với một phiên ACP đích.
    - Tin nhắn tiếp theo trong luồng đó định tuyến đến phiên ACP được liên kết.
    - Đầu ra ACP được gửi lại cùng luồng đó.
    - Bỏ tập trung/đóng/lưu trữ/hết thời gian nhàn rỗi hoặc hết hạn theo tuổi tối đa sẽ xóa liên kết.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, và `/unfocus` là lệnh Gateway, không phải prompt gửi đến harness ACP.

    Cờ tính năng bắt buộc cho ACP liên kết theo luồng:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` được bật theo mặc định (đặt `false` để tạm dừng việc tự động gửi luồng ACP; các lệnh gọi `sessions_spawn({ runtime: "acp" })` rõ ràng vẫn hoạt động).
    - Bật spawn phiên luồng của bộ chuyển đổi kênh (mặc định: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Hỗ trợ liên kết luồng phụ thuộc vào từng bộ chuyển đổi. Nếu bộ chuyển đổi kênh
    đang hoạt động không hỗ trợ liên kết luồng, OpenClaw trả về thông báo
    không được hỗ trợ/không khả dụng rõ ràng.

  </Accordion>
  <Accordion title="Các kênh hỗ trợ luồng">
    - Bất kỳ bộ chuyển đổi kênh nào phơi bày khả năng liên kết phiên/luồng.
    - Hỗ trợ tích hợp hiện tại: luồng/kênh **Discord**, chủ đề **Telegram** (chủ đề diễn đàn trong nhóm/siêu nhóm và chủ đề DM).
    - Các kênh Plugin có thể thêm hỗ trợ thông qua cùng giao diện liên kết.

  </Accordion>
</AccordionGroup>

## Liên kết kênh bền vững

Với các quy trình làm việc không tạm thời, cấu hình liên kết ACP bền vững trong
các mục `bindings[]` cấp cao nhất.

### Mô hình liên kết

<ParamField path="bindings[].type" type='"acp"'>
  Đánh dấu một liên kết hội thoại ACP bền vững.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Xác định hội thoại đích. Hình dạng theo từng kênh:

- **Kênh/luồng Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Chủ đề diễn đàn Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/nhóm BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Ưu tiên `chat_id:*` hoặc `chat_identifier:*` cho liên kết nhóm ổn định.
- **DM/nhóm iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Ưu tiên `chat_id:*` cho liên kết nhóm ổn định.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id tác tử OpenClaw sở hữu.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Ghi đè ACP tùy chọn.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Nhãn tùy chọn hướng đến người vận hành.
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

**Thứ tự ưu tiên ghi đè cho phiên ACP được liên kết:**

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

- OpenClaw đảm bảo phiên ACP đã cấu hình tồn tại trước khi dùng.
- Tin nhắn trong kênh hoặc chủ đề đó định tuyến đến phiên ACP đã cấu hình.
- Trong các hội thoại được liên kết, `/new` và `/reset` đặt lại cùng khóa phiên ACP tại chỗ.
- Các liên kết runtime tạm thời (ví dụ được tạo bởi các luồng tập trung vào luồng) vẫn áp dụng ở nơi có mặt.
- Với các spawn ACP xuyên tác tử mà không có `cwd` rõ ràng, OpenClaw kế thừa không gian làm việc tác tử đích từ cấu hình tác tử.
- Các đường dẫn không gian làm việc kế thừa bị thiếu quay về cwd mặc định của backend; lỗi truy cập không do thiếu đường dẫn hiển thị dưới dạng lỗi spawn.

## Bắt đầu phiên ACP

Có hai cách để bắt đầu một phiên ACP:

<Tabs>
  <Tab title="Từ sessions_spawn">
    Dùng `runtime: "acp"` để bắt đầu một phiên ACP từ lượt tác tử hoặc
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
    `runtime` mặc định là `subagent`, nên hãy đặt rõ `runtime: "acp"`
    cho các phiên ACP. Nếu bỏ qua `agentId`, OpenClaw dùng
    `acp.defaultAgent` khi đã cấu hình. `mode: "session"` yêu cầu
    `thread: true` để giữ một cuộc trò chuyện ràng buộc liên tục.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Dùng `/acp spawn` để điều khiển rõ ràng từ người vận hành trong chat.

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

    Xem [Lệnh gạch chéo](/vi/tools/slash-commands).

  </Tab>
</Tabs>

### Tham số `sessions_spawn`

<ParamField path="task" type="string" required>
  Prompt ban đầu được gửi tới phiên ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Phải là `"acp"` cho các phiên ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id harness mục tiêu ACP. Chuyển về `acp.defaultAgent` nếu đã đặt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Yêu cầu luồng ràng buộc thread khi được hỗ trợ.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` là một lần; `"session"` là liên tục. Nếu `thread: true` và
  bỏ qua `mode`, OpenClaw có thể mặc định sang hành vi liên tục theo
  đường dẫn runtime. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc runtime được yêu cầu (được xác thực bởi chính sách
  backend/runtime). Nếu bỏ qua, ACP spawn kế thừa không gian làm việc
  của agent mục tiêu khi được cấu hình; các đường dẫn kế thừa bị thiếu
  sẽ chuyển về mặc định của backend, còn lỗi truy cập thực sẽ được trả về.
</ParamField>
<ParamField path="label" type="string">
  Nhãn hướng tới người vận hành được dùng trong văn bản phiên/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tiếp tục một phiên ACP hiện có thay vì tạo phiên mới. Agent phát lại
  lịch sử trò chuyện của nó qua `session/load`. Yêu cầu `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` stream các tóm tắt tiến trình lần chạy ACP ban đầu về
  phiên requester dưới dạng sự kiện hệ thống. Các phản hồi được chấp nhận
  bao gồm `streamLogPath` trỏ tới log JSONL trong phạm vi phiên
  (`<sessionId>.acp-stream.jsonl`) mà bạn có thể tail để xem toàn bộ lịch sử relay.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Hủy lượt ACP con sau N giây. `0` giữ lượt trên đường dẫn không timeout
  của gateway. Cùng giá trị được áp dụng cho lượt chạy Gateway và runtime
  ACP để các harness bị kẹt/hết quota không chiếm lane của agent cha vô thời hạn.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè model rõ ràng cho phiên ACP con. Các spawn Codex ACP chuẩn hóa
  ref OpenClaw Codex như `openai-codex/gpt-5.4` thành cấu hình khởi động
  Codex ACP trước `session/new`; các dạng slash như
  `openai-codex/gpt-5.4/high` cũng đặt mức nỗ lực suy luận Codex ACP.
  Các harness khác phải quảng bá ACP `models` và hỗ trợ
  `session/set_model`; nếu không OpenClaw/acpx sẽ lỗi rõ ràng thay vì
  âm thầm chuyển về mặc định của agent mục tiêu.
</ParamField>
<ParamField path="thinking" type="string">
  Mức nỗ lực suy nghĩ/suy luận rõ ràng. Với Codex ACP, `minimal` ánh xạ
  tới mức nỗ lực thấp, `low`/`medium`/`high`/`xhigh` ánh xạ trực tiếp,
  và `off` bỏ qua ghi đè khởi động reasoning-effort.
</ParamField>

## Chế độ bind và thread khi spawn

<Tabs>
  <Tab title="--bind here|off">
    | Chế độ | Hành vi                                                                 |
    | ------ | ------------------------------------------------------------------------ |
    | `here` | Ràng buộc cuộc trò chuyện đang hoạt động hiện tại tại chỗ; lỗi nếu không có cuộc trò chuyện nào đang hoạt động. |
    | `off`  | Không tạo ràng buộc cuộc trò chuyện hiện tại.                            |

    Ghi chú:

    - `--bind here` là đường dẫn người vận hành đơn giản nhất để "biến kênh hoặc chat này thành nơi được Codex hỗ trợ."
    - `--bind here` không tạo thread con.
    - `--bind here` chỉ khả dụng trên các kênh cung cấp hỗ trợ ràng buộc cuộc trò chuyện hiện tại.
    - `--bind` và `--thread` không thể kết hợp trong cùng một lệnh gọi `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Chế độ | Hành vi                                                                                              |
    | ------ | ----------------------------------------------------------------------------------------------------- |
    | `auto` | Trong một thread đang hoạt động: ràng buộc thread đó. Ngoài thread: tạo/ràng buộc một thread con khi được hỗ trợ. |
    | `here` | Yêu cầu thread đang hoạt động hiện tại; lỗi nếu không ở trong thread.                                |
    | `off`  | Không ràng buộc. Phiên bắt đầu ở trạng thái không ràng buộc.                                         |

    Ghi chú:

    - Trên các bề mặt ràng buộc không theo thread, hành vi mặc định thực tế là `off`.
    - Spawn gắn với thread yêu cầu hỗ trợ chính sách kênh:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Dùng `--bind here` khi bạn muốn ghim cuộc trò chuyện hiện tại mà không tạo thread con.

  </Tab>
</Tabs>

## Mô hình phân phối

Phiên ACP có thể là không gian làm việc tương tác hoặc công việc nền
do cha sở hữu. Đường dẫn phân phối phụ thuộc vào hình dạng đó.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Phiên tương tác được dùng để tiếp tục trò chuyện trên một bề mặt chat hiển thị:

    - `/acp spawn ... --bind here` ràng buộc cuộc trò chuyện hiện tại với phiên ACP.
    - `/acp spawn ... --thread ...` ràng buộc một thread/chủ đề của kênh với phiên ACP.
    - Các `bindings[].type="acp"` liên tục đã cấu hình định tuyến những cuộc trò chuyện khớp tới cùng phiên ACP.

    Các tin nhắn tiếp theo trong cuộc trò chuyện đã ràng buộc được định tuyến
    trực tiếp tới phiên ACP, và đầu ra ACP được chuyển lại về cùng
    kênh/thread/chủ đề đó.

    Những gì OpenClaw gửi tới harness:

    - Các follow-up ràng buộc thông thường được gửi dưới dạng văn bản prompt, kèm tệp đính kèm chỉ khi harness/backend hỗ trợ.
    - Các lệnh quản lý `/acp` và lệnh Gateway cục bộ được chặn trước khi dispatch ACP.
    - Các sự kiện hoàn tất do runtime tạo được hiện thực hóa theo từng mục tiêu. Agent OpenClaw nhận envelope runtime-context nội bộ của OpenClaw; harness ACP bên ngoài nhận một prompt thuần với kết quả con và chỉ dẫn. Envelope thô `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tuyệt đối không được gửi tới harness bên ngoài hoặc lưu bền dưới dạng văn bản transcript người dùng ACP.
    - Các mục transcript ACP dùng văn bản kích hoạt mà người dùng thấy hoặc prompt hoàn tất thuần. Siêu dữ liệu sự kiện nội bộ vẫn được cấu trúc trong OpenClaw khi có thể và không được xem là nội dung chat do người dùng viết.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Các phiên ACP một lần do một lượt chạy agent khác spawn là con chạy nền,
    tương tự sub-agent:

    - Cha yêu cầu công việc bằng `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Con chạy trong phiên harness ACP riêng.
    - Các lượt con chạy trên cùng lane nền dùng cho spawn sub-agent gốc, nên harness ACP chậm không chặn công việc main-session không liên quan.
    - Báo cáo hoàn tất trả về qua đường dẫn thông báo task-completion. OpenClaw chuyển siêu dữ liệu hoàn tất nội bộ thành một prompt ACP thuần trước khi gửi tới harness bên ngoài, nên harness không thấy các marker ngữ cảnh runtime chỉ dành cho OpenClaw.
    - Cha viết lại kết quả con bằng giọng trợ lý bình thường khi cần phản hồi hướng tới người dùng.

    **Không** xem đường dẫn này là chat ngang hàng giữa cha
    và con. Con đã có kênh hoàn tất quay lại
    cha.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` có thể nhắm tới phiên khác sau khi spawn. Với các phiên
    ngang hàng thông thường, OpenClaw dùng đường dẫn follow-up agent-to-agent (A2A)
    sau khi tiêm tin nhắn:

    - Chờ phản hồi của phiên mục tiêu.
    - Tùy chọn cho phép requester và mục tiêu trao đổi một số lượt follow-up có giới hạn.
    - Yêu cầu mục tiêu tạo tin nhắn thông báo.
    - Chuyển thông báo đó tới kênh hoặc thread hiển thị.

    Đường dẫn A2A đó là fallback cho các lượt gửi ngang hàng nơi người gửi cần
    một follow-up hiển thị. Nó vẫn bật khi một phiên không liên quan có thể
    thấy và nhắn tin tới mục tiêu ACP, ví dụ dưới các thiết lập
    `tools.sessions.visibility` rộng.

    OpenClaw chỉ bỏ qua follow-up A2A khi requester là cha của con ACP một lần
    do chính nó sở hữu. Trong trường hợp đó, chạy A2A trên task completion có thể
    đánh thức cha bằng kết quả của con, chuyển tiếp phản hồi của cha trở lại con,
    và tạo vòng lặp echo cha/con. Kết quả `sessions_send` báo cáo
    `delivery.status="skipped"` cho trường hợp con được sở hữu đó vì
    đường dẫn hoàn tất đã chịu trách nhiệm cho kết quả.

  </Accordion>
  <Accordion title="Resume an existing session">
    Dùng `resumeSessionId` để tiếp tục một phiên ACP trước đó thay vì
    bắt đầu mới. Agent phát lại lịch sử trò chuyện của nó qua
    `session/load`, nên nó tiếp tục với đầy đủ ngữ cảnh của những gì đã có trước đó.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Các trường hợp sử dụng phổ biến:

    - Bàn giao một phiên Codex từ laptop sang điện thoại - bảo agent tiếp tục từ nơi bạn đã dừng.
    - Tiếp tục một phiên lập trình bạn đã bắt đầu tương tác trong CLI, giờ chạy headless qua agent của bạn.
    - Tiếp tục công việc bị gián đoạn do gateway khởi động lại hoặc timeout khi nhàn rỗi.

    Ghi chú:

    - `resumeSessionId` chỉ áp dụng khi `runtime: "acp"`; runtime sub-agent mặc định bỏ qua trường chỉ dành cho ACP này.
    - `streamTo` chỉ áp dụng khi `runtime: "acp"`; runtime sub-agent mặc định bỏ qua trường chỉ dành cho ACP này.
    - `resumeSessionId` là id tiếp tục ACP/harness cục bộ trên host, không phải khóa phiên kênh OpenClaw; OpenClaw vẫn kiểm tra chính sách ACP spawn và chính sách agent mục tiêu trước khi dispatch, còn backend hoặc harness ACP sở hữu quyền cho việc tải id upstream đó.
    - `resumeSessionId` khôi phục lịch sử trò chuyện ACP upstream; `thread` và `mode` vẫn áp dụng bình thường cho phiên OpenClaw mới bạn đang tạo, nên `mode: "session"` vẫn yêu cầu `thread: true`.
    - Agent mục tiêu phải hỗ trợ `session/load` (Codex và Claude Code có hỗ trợ).
    - Nếu không tìm thấy id phiên, spawn sẽ lỗi rõ ràng - không âm thầm fallback sang phiên mới.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Sau khi deploy gateway, hãy chạy kiểm tra end-to-end trực tiếp thay vì
    chỉ tin vào unit test:

    1. Xác minh phiên bản gateway đã deploy và commit trên host mục tiêu.
    2. Mở một phiên cầu nối ACPX tạm thời tới một agent live.
    3. Yêu cầu agent đó gọi `sessions_spawn` với `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, và tác vụ `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Xác minh `accepted=yes`, một `childSessionKey` thực, và không có lỗi validator.
    5. Dọn dẹp phiên cầu nối tạm thời.

    Giữ gate ở `mode: "run"` và bỏ qua `streamTo: "parent"` -
    `mode: "session"` gắn với thread và các đường dẫn stream-relay là những lượt
    tích hợp phong phú riêng.

  </Accordion>
</AccordionGroup>

## Khả năng tương thích sandbox

Các phiên ACP hiện chạy trên runtime của host, **không** chạy bên trong
sandbox của OpenClaw.

<Warning>
**Ranh giới bảo mật:**

- Bộ harness bên ngoài có thể đọc/ghi theo quyền CLI riêng của nó và `cwd` đã chọn.
- Chính sách sandbox của OpenClaw **không** bao bọc việc thực thi harness ACP.
- OpenClaw vẫn thực thi các cổng tính năng ACP, agent được phép, quyền sở hữu phiên, liên kết kênh và chính sách phân phối Gateway.
- Dùng `runtime: "subagent"` cho công việc gốc OpenClaw được sandbox thực thi.

</Warning>

Các giới hạn hiện tại:

- Nếu phiên bên yêu cầu đang bị sandbox, việc tạo ACP sẽ bị chặn cho cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
- `sessions_spawn` với `runtime: "acp"` không hỗ trợ `sandbox: "require"`.

## Phân giải mục tiêu phiên

Hầu hết hành động `/acp` chấp nhận một mục tiêu phiên tùy chọn (`session-key`,
`session-id`, hoặc `session-label`).

**Thứ tự phân giải:**

1. Đối số mục tiêu tường minh (hoặc `--session` cho `/acp steer`)
   - thử khóa
   - sau đó là id phiên có dạng UUID
   - sau đó là nhãn
2. Liên kết luồng hiện tại (nếu cuộc trò chuyện/luồng này được liên kết với một phiên ACP).
3. Dự phòng về phiên bên yêu cầu hiện tại.

Liên kết cuộc trò chuyện hiện tại và liên kết luồng đều tham gia vào
bước 2.

Nếu không phân giải được mục tiêu nào, OpenClaw trả về lỗi rõ ràng
(`Unable to resolve session target: ...`).

## Điều khiển ACP

| Lệnh                 | Chức năng                                                 | Ví dụ                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tạo phiên ACP; tùy chọn liên kết hiện tại hoặc liên kết luồng. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hủy lượt đang chạy cho phiên mục tiêu.                    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Gửi chỉ dẫn điều hướng đến phiên đang chạy.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Đóng phiên và hủy liên kết các mục tiêu luồng.            | `/acp close`                                                  |
| `/acp status`        | Hiển thị phụ trợ, chế độ, trạng thái, tùy chọn thời gian chạy, năng lực. | `/acp status`                                                 |
| `/acp set-mode`      | Đặt chế độ thời gian chạy cho phiên mục tiêu.             | `/acp set-mode plan`                                          |
| `/acp set`           | Ghi tùy chọn cấu hình thời gian chạy chung.               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Đặt ghi đè thư mục làm việc thời gian chạy.               | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Đặt hồ sơ chính sách phê duyệt.                           | `/acp permissions strict`                                     |
| `/acp timeout`       | Đặt thời gian chờ thời gian chạy (giây).                  | `/acp timeout 120`                                            |
| `/acp model`         | Đặt ghi đè mô hình thời gian chạy.                        | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Xóa các ghi đè tùy chọn thời gian chạy của phiên.         | `/acp reset-options`                                          |
| `/acp sessions`      | Liệt kê các phiên ACP gần đây từ kho lưu trữ.             | `/acp sessions`                                               |
| `/acp doctor`        | Sức khỏe phụ trợ, năng lực, bản sửa có thể hành động.     | `/acp doctor`                                                 |
| `/acp install`       | In các bước cài đặt và bật có tính quyết định.            | `/acp install`                                                |

`/acp status` hiển thị các tùy chọn thời gian chạy hiệu lực cùng các mã định danh phiên cấp thời gian chạy và
cấp phụ trợ. Lỗi điều khiển không được hỗ trợ được hiển thị
rõ ràng khi phụ trợ thiếu năng lực. `/acp sessions` đọc
kho lưu trữ cho phiên đang được liên kết hiện tại hoặc phiên bên yêu cầu; token mục tiêu
(`session-key`, `session-id`, hoặc `session-label`) được phân giải thông qua
khám phá phiên Gateway, bao gồm các gốc `session.store`
tùy chỉnh theo từng agent.

### Ánh xạ tùy chọn thời gian chạy

`/acp` có các lệnh tiện ích và một bộ đặt chung. Các thao tác
tương đương:

| Lệnh                         | Ánh xạ tới                            | Ghi chú                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | khóa cấu hình thời gian chạy `model` | Với Codex ACP, OpenClaw chuẩn hóa `openai-codex/<model>` thành id mô hình của bộ chuyển đổi và ánh xạ các hậu tố suy luận dạng gạch chéo như `openai-codex/gpt-5.4/high` thành `reasoning_effort`. |
| `/acp set thinking <level>`  | khóa cấu hình thời gian chạy `thinking` | Với Codex ACP, OpenClaw gửi `reasoning_effort` tương ứng khi bộ chuyển đổi hỗ trợ.                                                                                             |
| `/acp permissions <profile>` | khóa cấu hình thời gian chạy `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | khóa cấu hình thời gian chạy `timeout` | -                                                                                                                                                                              |
| `/acp cwd <path>`            | ghi đè cwd thời gian chạy             | Cập nhật trực tiếp.                                                                                                                                                            |
| `/acp set <key> <value>`     | chung                                 | `key=cwd` dùng đường dẫn ghi đè cwd.                                                                                                                                           |
| `/acp reset-options`         | xóa tất cả ghi đè thời gian chạy      | -                                                                                                                                                                              |

## Harness acpx, thiết lập Plugin và quyền

Để cấu hình harness acpx (bí danh Claude Code / Codex / Gemini CLI), cầu nối MCP plugin-tools và OpenClaw-tools, cũng như các chế độ quyền ACP, xem
[Agent ACP - thiết lập](/vi/tools/acp-agents-setup).

## Khắc phục sự cố

| Triệu chứng                                                                 | Nguyên nhân có thể                                                                                                     | Cách khắc phục                                                                                                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin phụ trợ bị thiếu, bị tắt hoặc bị `plugins.allow` chặn.                                                          | Cài đặt và bật Plugin phụ trợ, thêm `acpx` vào `plugins.allow` khi danh sách cho phép đó được đặt, rồi chạy `/acp doctor`.                                               |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP bị tắt toàn cục.                                                                                                   | Đặt `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Điều phối tự động từ tin nhắn luồng thông thường bị tắt.                                                               | Đặt `acp.dispatch.enabled=true` để tiếp tục định tuyến luồng tự động; các lệnh gọi rõ ràng `sessions_spawn({ runtime: "acp" })` vẫn hoạt động.                           |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent không nằm trong danh sách cho phép.                                                                              | Dùng `agentId` được cho phép hoặc cập nhật `acp.allowedAgents`.                                                                                                          |
| `/acp doctor` báo phần phụ trợ chưa sẵn sàng ngay sau khi khởi động         | Plugin phụ trợ bị thiếu, bị tắt, bị chính sách cho phép/từ chối chặn hoặc tệp thực thi đã cấu hình không khả dụng.     | Cài đặt/bật Plugin phụ trợ, chạy lại `/acp doctor`, rồi kiểm tra lỗi cài đặt hoặc chính sách của phần phụ trợ nếu nó vẫn không khỏe.                                    |
| Không tìm thấy lệnh harness                                                 | CLI của bộ điều hợp chưa được cài đặt, Plugin bên ngoài bị thiếu hoặc lần tìm nạp `npx` đầu tiên thất bại với bộ điều hợp không phải Codex. | Chạy `/acp doctor`, cài đặt/làm nóng trước bộ điều hợp trên máy chủ Gateway, hoặc cấu hình rõ ràng lệnh agent acpx.                                                     |
| Harness trả về lỗi không tìm thấy mô hình                                   | ID mô hình hợp lệ với nhà cung cấp/harness khác nhưng không hợp lệ với đích ACP này.                                   | Dùng một mô hình được harness đó liệt kê, cấu hình mô hình trong harness, hoặc bỏ qua phần ghi đè.                                                                       |
| Lỗi xác thực nhà cung cấp từ harness                                        | OpenClaw khỏe mạnh, nhưng CLI/nhà cung cấp đích chưa đăng nhập.                                                        | Đăng nhập hoặc cung cấp khóa nhà cung cấp bắt buộc trong môi trường máy chủ Gateway.                                                                                     |
| `Unable to resolve session target: ...`                                     | Token khóa/ID/nhãn không đúng.                                                                                         | Chạy `/acp sessions`, sao chép đúng khóa/nhãn, rồi thử lại.                                                                                                             |
| `--bind here requires running /acp spawn inside an active ... conversation` | Đã dùng `--bind here` khi không có cuộc trò chuyện đang hoạt động có thể liên kết.                                     | Chuyển đến cuộc trò chuyện/kênh đích rồi thử lại, hoặc dùng tạo phiên không liên kết.                                                                                    |
| `Conversation bindings are unavailable for <channel>.`                      | Bộ điều hợp thiếu khả năng liên kết ACP với cuộc trò chuyện hiện tại.                                                  | Dùng `/acp spawn ... --thread ...` khi được hỗ trợ, cấu hình `bindings[]` cấp cao nhất, hoặc chuyển sang kênh được hỗ trợ.                                               |
| `--thread here requires running /acp spawn inside an active ... thread`     | Đã dùng `--thread here` bên ngoài ngữ cảnh luồng.                                                                      | Chuyển đến luồng đích hoặc dùng `--thread auto`/`off`.                                                                                                                  |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Người dùng khác sở hữu đích liên kết đang hoạt động.                                                                   | Liên kết lại với tư cách chủ sở hữu hoặc dùng cuộc trò chuyện hay luồng khác.                                                                                           |
| `Thread bindings are unavailable for <channel>.`                            | Bộ điều hợp thiếu khả năng liên kết luồng.                                                                             | Dùng `--thread off` hoặc chuyển sang bộ điều hợp/kênh được hỗ trợ.                                                                                                      |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime nằm phía máy chủ; phiên yêu cầu chạy trong sandbox.                                                        | Dùng `runtime="subagent"` từ các phiên chạy trong sandbox, hoặc chạy tạo phiên ACP từ phiên không chạy trong sandbox.                                                   |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Đã yêu cầu `sandbox="require"` cho ACP runtime.                                                                        | Dùng `runtime="subagent"` cho sandbox bắt buộc, hoặc dùng ACP với `sandbox="inherit"` từ phiên không chạy trong sandbox.                                                |
| `Cannot apply --model ... did not advertise model support`                  | Harness đích không công bố khả năng chuyển đổi mô hình ACP chung.                                                      | Dùng harness công bố ACP `models`/`session/set_model`, dùng tham chiếu mô hình ACP của Codex, hoặc cấu hình mô hình trực tiếp trong harness nếu nó có cờ khởi động riêng. |
| Thiếu siêu dữ liệu ACP cho phiên đã liên kết                                | Siêu dữ liệu phiên ACP đã cũ/bị xóa.                                                                                   | Tạo lại bằng `/acp spawn`, rồi liên kết lại/tập trung vào luồng.                                                                                                        |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` chặn ghi/thực thi trong phiên ACP không tương tác.                                                    | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại gateway. Xem [Cấu hình quyền](/vi/tools/acp-agents-setup#permission-configuration). |
| Phiên ACP thất bại sớm với rất ít đầu ra                                    | Lời nhắc cấp quyền bị `permissionMode`/`nonInteractivePermissions` chặn.                                               | Kiểm tra nhật ký gateway để tìm `AcpRuntimeError`. Để có đầy đủ quyền, đặt `permissionMode=approve-all`; để suy giảm nhẹ nhàng, đặt `nonInteractivePermissions=deny`.    |
| Phiên ACP treo vô thời hạn sau khi hoàn thành công việc                     | Tiến trình harness đã hoàn tất nhưng phiên ACP không báo hoàn thành.                                                   | Theo dõi bằng `ps aux \| grep acpx`; tự kết thúc thủ công các tiến trình cũ.                                                                                            |
| Harness thấy `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Phong bì sự kiện nội bộ bị rò rỉ qua ranh giới ACP.                                                                    | Cập nhật OpenClaw và chạy lại luồng hoàn thành; các harness bên ngoài chỉ nên nhận lời nhắc hoàn thành dạng văn bản thuần.                                              |

## Liên quan

- [Agent ACP - thiết lập](/vi/tools/acp-agents-setup)
- [Gửi agent](/vi/tools/agent-send)
- [Phần phụ trợ CLI](/vi/gateway/cli-backends)
- [Harness Codex](/vi/plugins/codex-harness)
- [Công cụ sandbox đa agent](/vi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (chế độ cầu nối)](/vi/cli/acp)
- [Sub-agent](/vi/tools/subagents)
