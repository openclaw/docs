---
read_when:
    - Chạy các bộ khung lập trình thông qua ACP
    - Thiết lập các phiên ACP gắn với cuộc trò chuyện trên kênh nhắn tin
    - Liên kết cuộc trò chuyện trên kênh nhắn tin với một phiên ACP cố định
    - Khắc phục sự cố phần phụ trợ ACP, kết nối Plugin hoặc gửi kết quả hoàn thành
    - Vận hành các lệnh /acp từ cuộc trò chuyện
sidebarTitle: ACP agents
summary: Chạy các bộ công cụ lập trình bên ngoài (Claude Code, Cursor, Gemini CLI, Codex ACP tường minh, OpenClaw ACP, OpenCode) thông qua phần phụ trợ ACP
title: Tác tử ACP
x-i18n:
    generated_at: "2026-05-07T13:25:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: e5cdb853d2cec2c7466fff5f1e046b38bf9bac8b2b62f208ad3465a666272631
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) phiên
cho phép OpenClaw chạy các harness lập trình bên ngoài (ví dụ Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI và các harness ACPX
được hỗ trợ khác) thông qua một Plugin backend ACP.

Mỗi lần tạo phiên ACP đều được theo dõi như một [tác vụ nền](/vi/automation/tasks).

<Note>
**ACP là đường dẫn harness bên ngoài, không phải đường dẫn Codex mặc định.** Plugin
app-server Codex gốc sở hữu các điều khiển `/codex ...` và runtime nhúng
`agentRuntime.id: "codex"`; ACP sở hữu các điều khiển
`/acp ...` và các phiên `sessions_spawn({ runtime: "acp" })`.

Nếu bạn muốn Codex hoặc Claude Code kết nối như một client MCP bên ngoài
trực tiếp tới các cuộc trò chuyện kênh OpenClaw hiện có, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp) thay vì ACP.
</Note>

## Tôi muốn trang nào?

| Bạn muốn…                                                                                      | Dùng mục này                          | Ghi chú                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gắn kết hoặc điều khiển Codex trong cuộc trò chuyện hiện tại                                    | `/codex bind`, `/codex threads`       | Đường dẫn app-server Codex gốc khi Plugin `codex` được bật; bao gồm trả lời chat đã gắn kết, chuyển tiếp hình ảnh, model/fast/permissions, dừng và điều khiển định hướng. ACP là phương án dự phòng tường minh |
| Chạy Claude Code, Gemini CLI, Codex ACP tường minh hoặc harness bên ngoài khác _thông qua_ OpenClaw | Trang này                             | Các phiên gắn với chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tác vụ nền, điều khiển runtime                                                                                   |
| Phơi bày một phiên OpenClaw Gateway _như_ máy chủ ACP cho trình soạn thảo hoặc client           | [`openclaw acp`](/vi/cli/acp)            | Chế độ bridge. IDE/client nói ACP với OpenClaw qua stdio/WebSocket                                                                                                                            |
| Tái sử dụng một AI CLI cục bộ làm model dự phòng chỉ văn bản                                    | [Backend CLI](/vi/gateway/cli-backends) | Không phải ACP. Không có công cụ OpenClaw, không có điều khiển ACP, không có runtime harness                                                                                                  |

## Tính năng này có hoạt động ngay không?

Có, sau khi cài đặt Plugin runtime ACP chính thức:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các checkout mã nguồn có thể dùng Plugin workspace `extensions/acpx` cục bộ sau
`pnpm install`. Chạy `/acp doctor` để kiểm tra mức độ sẵn sàng.

OpenClaw chỉ hướng dẫn agent về việc tạo ACP khi ACP **thật sự
dùng được**: ACP phải được bật, dispatch không được bị tắt, phiên hiện tại
không được bị sandbox chặn và một backend runtime phải được tải.
Nếu các điều kiện đó không được đáp ứng, Skills của Plugin ACP và
hướng dẫn ACP cho `sessions_spawn` sẽ được ẩn để agent không đề xuất
một backend không khả dụng.

<AccordionGroup>
  <Accordion title="Những điểm dễ vướng ở lần chạy đầu">
    - Nếu `plugins.allow` được đặt, đó là danh mục Plugin hạn chế và **phải** bao gồm `acpx`; nếu không, backend ACP đã cài đặt sẽ bị chặn có chủ đích và `/acp doctor` báo mục allowlist bị thiếu.
    - Adapter Codex ACP được chuẩn bị cùng Plugin `acpx` và được khởi chạy cục bộ khi có thể.
    - Codex ACP chạy với `CODEX_HOME` biệt lập; OpenClaw chỉ sao chép các mục dự án đáng tin cậy từ cấu hình Codex của host và tin cậy workspace đang hoạt động, để lại auth, thông báo và hook trên cấu hình host.
    - Các adapter harness đích khác vẫn có thể được tải theo nhu cầu bằng `npx` trong lần đầu bạn dùng chúng.
    - Auth của nhà cung cấp vẫn phải tồn tại trên host cho harness đó.
    - Nếu host không có npm hoặc quyền truy cập mạng, quá trình tải adapter lần đầu sẽ thất bại cho đến khi cache được làm nóng trước hoặc adapter được cài đặt theo cách khác.

  </Accordion>
  <Accordion title="Điều kiện tiên quyết về runtime">
    ACP khởi chạy một tiến trình harness bên ngoài thật. OpenClaw sở hữu việc định tuyến,
    trạng thái tác vụ nền, phân phối, gắn kết và chính sách; harness
    sở hữu đăng nhập nhà cung cấp, danh mục model, hành vi hệ thống tệp và
    công cụ gốc của nó.

    Trước khi quy lỗi cho OpenClaw, hãy xác minh:

    - `/acp doctor` báo một backend đã bật và khỏe mạnh.
    - ID đích được `acp.allowedAgents` cho phép khi allowlist đó được đặt.
    - Lệnh harness có thể khởi động trên host Gateway.
    - Auth của nhà cung cấp hiện diện cho harness đó (`claude`, `codex`, `gemini`, `opencode`, `droid`, v.v.).
    - Model đã chọn tồn tại cho harness đó - ID model không di động giữa các harness.
    - `cwd` được yêu cầu tồn tại và có thể truy cập, hoặc bỏ qua `cwd` và để backend dùng mặc định của nó.
    - Chế độ quyền phù hợp với công việc. Các phiên không tương tác không thể bấm lời nhắc quyền gốc, nên các lượt chạy lập trình cần nhiều ghi/thực thi thường cần một hồ sơ quyền ACPX có thể chạy không cần điều khiển trực tiếp.

  </Accordion>
</AccordionGroup>

Công cụ Plugin OpenClaw và các công cụ OpenClaw tích hợp **không** được phơi bày
cho harness ACP theo mặc định. Chỉ bật các bridge MCP tường minh trong
[Agent ACP - thiết lập](/vi/tools/acp-agents-setup) khi harness
cần gọi trực tiếp các công cụ đó.

## Các mục tiêu harness được hỗ trợ

Với backend `acpx`, hãy dùng các ID harness này làm mục tiêu `/acp spawn <id>`
hoặc `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID harness | Backend thường dùng                             | Ghi chú                                                                              |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Yêu cầu auth Claude Code trên host.                                                  |
| `codex`    | Adapter Codex ACP                              | Chỉ là phương án ACP dự phòng tường minh khi `/codex` gốc không khả dụng hoặc ACP được yêu cầu. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Yêu cầu auth Copilot CLI/runtime.                                                    |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Ghi đè lệnh acpx nếu bản cài đặt cục bộ phơi bày một entrypoint ACP khác.           |
| `droid`    | Factory Droid CLI                              | Yêu cầu auth Factory/Droid hoặc `FACTORY_API_KEY` trong môi trường harness.          |
| `gemini`   | Adapter Gemini CLI ACP                         | Yêu cầu auth Gemini CLI hoặc thiết lập khóa API.                                     |
| `iflow`    | iFlow CLI                                      | Tính khả dụng của adapter và điều khiển model phụ thuộc vào CLI đã cài đặt.          |
| `kilocode` | Kilo Code CLI                                  | Tính khả dụng của adapter và điều khiển model phụ thuộc vào CLI đã cài đặt.          |
| `kimi`     | Kimi/Moonshot CLI                              | Yêu cầu auth Kimi/Moonshot trên host.                                                |
| `kiro`     | Kiro CLI                                       | Tính khả dụng của adapter và điều khiển model phụ thuộc vào CLI đã cài đặt.          |
| `opencode` | Adapter OpenCode ACP                           | Yêu cầu auth OpenCode CLI/nhà cung cấp.                                              |
| `openclaw` | Bridge OpenClaw Gateway thông qua `openclaw acp` | Cho phép một harness biết ACP nói ngược lại với phiên OpenClaw Gateway.             |
| `pi`       | Runtime Pi/OpenClaw nhúng                      | Dùng cho các thử nghiệm harness gốc OpenClaw.                                        |
| `qwen`     | Qwen Code / Qwen CLI                           | Yêu cầu auth tương thích Qwen trên host.                                             |

Bí danh agent acpx tùy chỉnh có thể được cấu hình trong chính acpx, nhưng chính sách OpenClaw
vẫn kiểm tra `acp.allowedAgents` và mọi ánh xạ
`agents.list[].runtime.acp.agent` trước khi dispatch.

## Sổ tay vận hành

Luồng `/acp` nhanh từ chat:

<Steps>
  <Step title="Tạo phiên">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, hoặc tường minh
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Làm việc">
    Tiếp tục trong cuộc trò chuyện hoặc luồng đã gắn kết (hoặc nhắm rõ
    khóa phiên).
  </Step>
  <Step title="Kiểm tra trạng thái">
    `/acp status`
  </Step>
  <Step title="Tinh chỉnh">
    `/acp model <provider/model>`,
    `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Định hướng">
    Không thay thế ngữ cảnh: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Dừng">
    `/acp cancel` (lượt hiện tại) hoặc `/acp close` (phiên + gắn kết).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Chi tiết vòng đời">
    - Việc tạo phiên tạo mới hoặc tiếp tục một phiên runtime ACP, ghi metadata ACP vào kho phiên OpenClaw và có thể tạo một tác vụ nền khi lượt chạy do cha sở hữu.
    - Các phiên ACP do cha sở hữu được xem là công việc nền ngay cả khi phiên runtime là bền vững; việc hoàn tất và phân phối xuyên bề mặt đi qua bộ thông báo tác vụ cha thay vì hoạt động như một phiên chat hướng người dùng thông thường.
    - Bảo trì tác vụ đóng các phiên ACP một lần do cha sở hữu đã kết thúc hoặc mồ côi. Các phiên ACP bền vững được giữ lại khi còn gắn kết cuộc trò chuyện đang hoạt động; các phiên bền vững cũ không có gắn kết đang hoạt động sẽ bị đóng để chúng không thể được tiếp tục âm thầm sau khi tác vụ sở hữu đã xong hoặc bản ghi tác vụ của nó không còn.
    - Các tin nhắn tiếp nối đã gắn kết đi thẳng tới phiên ACP cho đến khi gắn kết bị đóng, bỏ tập trung, đặt lại hoặc hết hạn.
    - Các lệnh Gateway vẫn ở cục bộ. `/acp ...`, `/status` và `/unfocus` không bao giờ được gửi như văn bản nhắc thông thường tới harness ACP đã gắn kết.
    - `cancel` hủy lượt đang hoạt động khi backend hỗ trợ hủy; nó không xóa metadata gắn kết hoặc phiên.
    - `close` kết thúc phiên ACP theo góc nhìn của OpenClaw và xóa gắn kết. Harness vẫn có thể giữ lịch sử upstream riêng nếu hỗ trợ tiếp tục.
    - Plugin acpx dọn dẹp các cây tiến trình wrapper và adapter do OpenClaw sở hữu sau `close`, và thu gom các tiến trình ACPX mồ côi do OpenClaw sở hữu còn sót trong quá trình khởi động Gateway.
    - Worker runtime nhàn rỗi có thể được dọn dẹp sau `acp.runtime.ttlMinutes`; metadata phiên đã lưu vẫn còn khả dụng cho `/acp sessions`.

  </Accordion>
  <Accordion title="Quy tắc định tuyến Codex gốc">
    Các trigger bằng ngôn ngữ tự nhiên nên định tuyến tới **Plugin Codex
    gốc** khi Plugin đó được bật:

    - "Gắn kết kênh Discord này với Codex."
    - "Gắn chat này vào luồng Codex `<id>`."
    - "Hiển thị các luồng Codex, rồi gắn kết luồng này."

    Liên kết cuộc trò chuyện Codex gốc là đường dẫn điều khiển trò chuyện mặc định.
    Các công cụ động của OpenClaw vẫn thực thi qua OpenClaw, trong khi
    các công cụ gốc của Codex như shell/apply-patch thực thi bên trong Codex.
    Đối với sự kiện công cụ gốc của Codex, OpenClaw chèn một relay hook gốc theo từng lượt
    để các hook của Plugin có thể chặn `before_tool_call`, quan sát
    `after_tool_call`, và định tuyến các sự kiện Codex `PermissionRequest`
    qua phê duyệt của OpenClaw. Các hook Codex `Stop` được chuyển tiếp đến
    OpenClaw `before_agent_finalize`, nơi các Plugin có thể yêu cầu thêm một
    lượt chạy mô hình nữa trước khi Codex hoàn tất câu trả lời. Relay này vẫn
    được giữ thận trọng có chủ ý: nó không thay đổi đối số công cụ gốc của Codex
    hoặc ghi lại các bản ghi luồng của Codex. Chỉ dùng ACP tường minh
    khi bạn muốn mô hình runtime/phiên của ACP. Ranh giới hỗ trợ Codex
    nhúng được ghi lại trong
    [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Bảng tham khảo nhanh chọn mô hình / nhà cung cấp / runtime">
    - `openai-codex/*` - tuyến mô hình Codex OAuth/gói đăng ký cũ được doctor sửa chữa.
    - `openai/*` - runtime nhúng máy chủ ứng dụng Codex gốc cho các lượt agent OpenAI.
    - `/codex ...` - điều khiển cuộc trò chuyện Codex gốc.
    - `/acp ...` hoặc `runtime: "acp"` - điều khiển ACP/acpx tường minh.

  </Accordion>
  <Accordion title="Tác nhân kích hoạt ngôn ngữ tự nhiên để định tuyến ACP">
    Các tác nhân kích hoạt nên định tuyến đến runtime ACP:

    - "Chạy tác vụ này như một phiên Claude Code ACP dùng một lần và tóm tắt kết quả."
    - "Dùng Gemini CLI cho tác vụ này trong một luồng, rồi giữ các trao đổi tiếp theo trong cùng luồng đó."
    - "Chạy Codex qua ACP trong một luồng nền."

    OpenClaw chọn `runtime: "acp"`, phân giải harness `agentId`,
    liên kết với cuộc trò chuyện hoặc luồng hiện tại khi được hỗ trợ, và
    định tuyến các lượt theo dõi đến phiên đó cho đến khi đóng/hết hạn. Codex chỉ
    đi theo đường dẫn này khi ACP/acpx là tường minh hoặc Plugin Codex gốc
    không khả dụng cho thao tác được yêu cầu.

    Đối với `sessions_spawn`, `runtime: "acp"` chỉ được quảng bá khi ACP
    được bật, bên yêu cầu không bị sandbox, và một backend runtime ACP
    đã được tải. `acp.dispatch.enabled=false` tạm dừng việc điều phối
    luồng ACP tự động nhưng không ẩn hoặc chặn các lệnh gọi
    `sessions_spawn({ runtime: "acp" })` tường minh. Nó nhắm đến các id harness ACP như `codex`,
    `claude`, `droid`, `gemini`, hoặc `opencode`. Đừng truyền id agent cấu hình
    OpenClaw thông thường từ `agents_list` trừ khi mục đó được
    cấu hình tường minh với `agents.list[].runtime.type="acp"`;
    nếu không, hãy dùng runtime sub-agent mặc định. Khi một agent OpenClaw
    được cấu hình với `runtime.type="acp"`, OpenClaw dùng
    `runtime.acp.agent` làm id harness bên dưới.

  </Accordion>
</AccordionGroup>

## ACP so với sub-agent

Dùng ACP khi bạn muốn một runtime harness bên ngoài. Dùng **máy chủ ứng dụng Codex gốc**
cho việc liên kết/điều khiển cuộc trò chuyện Codex khi Plugin `codex`
được bật. Dùng **sub-agent** khi bạn muốn các lần chạy được ủy quyền
gốc của OpenClaw.

| Phạm vi       | Phiên ACP                              | Lần chạy sub-agent                 |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (ví dụ acpx)       | Runtime sub-agent gốc của OpenClaw |
| Khóa phiên    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Lệnh chính    | `/acp ...`                            | `/subagents ...`                   |
| Công cụ spawn | `sessions_spawn` với `runtime:"acp"`  | `sessions_spawn` (runtime mặc định) |

Xem thêm [Sub-agent](/vi/tools/subagents).

## Cách ACP chạy Claude Code

Đối với Claude Code qua ACP, ngăn xếp là:

1. Mặt phẳng điều khiển phiên ACP của OpenClaw.
2. Plugin runtime chính thức `@openclaw/acpx`.
3. Bộ điều hợp Claude ACP.
4. Cơ chế runtime/phiên phía Claude.

ACP Claude là một **phiên harness** với các điều khiển ACP, tiếp tục phiên,
theo dõi tác vụ nền, và liên kết cuộc trò chuyện/luồng tùy chọn.

Backend CLI là các runtime dự phòng cục bộ chỉ văn bản riêng biệt - xem
[Backend CLI](/vi/gateway/cli-backends).

Đối với người vận hành, quy tắc thực tế là:

- **Muốn `/acp spawn`, phiên có thể liên kết, điều khiển runtime, hoặc công việc harness bền vững?** Dùng ACP.
- **Muốn dự phòng văn bản cục bộ đơn giản qua CLI thô?** Dùng backend CLI.

## Phiên được liên kết

### Mô hình tư duy

- **Bề mặt trò chuyện** - nơi mọi người tiếp tục trao đổi (kênh Discord, chủ đề Telegram, cuộc trò chuyện iMessage).
- **Phiên ACP** - trạng thái runtime Codex/Claude/Gemini bền vững mà OpenClaw định tuyến đến.
- **Luồng/chủ đề con** - bề mặt nhắn tin bổ sung tùy chọn chỉ được tạo bởi `--thread ...`.
- **Không gian làm việc runtime** - vị trí hệ thống tệp (`cwd`, bản checkout repo, không gian làm việc backend) nơi harness chạy. Độc lập với bề mặt trò chuyện.

### Liên kết cuộc trò chuyện hiện tại

`/acp spawn <harness> --bind here` ghim cuộc trò chuyện hiện tại vào
phiên ACP đã spawn - không có luồng con, cùng bề mặt trò chuyện. OpenClaw tiếp tục
sở hữu vận chuyển, xác thực, an toàn, và phân phối. Các tin nhắn theo dõi trong
cuộc trò chuyện đó định tuyến đến cùng phiên; `/new` và `/reset` đặt lại
phiên tại chỗ; `/acp close` gỡ liên kết.

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
  <Accordion title="Quy tắc liên kết và tính loại trừ">
    - `--bind here` và `--thread ...` loại trừ lẫn nhau.
    - `--bind here` chỉ hoạt động trên các kênh quảng bá khả năng liên kết cuộc trò chuyện hiện tại; nếu không, OpenClaw trả về một thông báo không được hỗ trợ rõ ràng. Các liên kết vẫn tồn tại qua các lần khởi động lại gateway.
    - Trên Discord, `spawnSessions` kiểm soát việc tạo luồng con cho `--thread auto|here` - không phải `--bind here`.
    - Nếu bạn spawn đến một agent ACP khác mà không có `--cwd`, theo mặc định OpenClaw kế thừa không gian làm việc của **agent đích**. Các đường dẫn kế thừa bị thiếu (`ENOENT`/`ENOTDIR`) rơi về mặc định backend; các lỗi truy cập khác (ví dụ `EACCES`) được hiển thị dưới dạng lỗi spawn.
    - Các lệnh quản lý Gateway vẫn cục bộ trong các cuộc trò chuyện được liên kết - các lệnh `/acp ...` được OpenClaw xử lý ngay cả khi văn bản theo dõi thông thường định tuyến đến phiên ACP được liên kết; `/status` và `/unfocus` cũng vẫn cục bộ bất cứ khi nào xử lý lệnh được bật cho bề mặt đó.

  </Accordion>
  <Accordion title="Phiên liên kết với luồng">
    Khi liên kết luồng được bật cho một bộ điều hợp kênh:

    - OpenClaw liên kết một luồng với một phiên ACP đích.
    - Các tin nhắn theo dõi trong luồng đó định tuyến đến phiên ACP được liên kết.
    - Đầu ra ACP được gửi lại về cùng luồng.
    - Bỏ tập trung/đóng/lưu trữ/hết thời gian chờ nhàn rỗi hoặc hết hạn tuổi tối đa sẽ gỡ liên kết.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, và `/unfocus` là các lệnh Gateway, không phải prompt gửi đến harness ACP.

    Các cờ tính năng bắt buộc cho ACP liên kết với luồng:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` được bật theo mặc định (đặt `false` để tạm dừng điều phối luồng ACP tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` tường minh vẫn hoạt động).
    - Spawn phiên luồng của bộ điều hợp kênh được bật (mặc định: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Hỗ trợ liên kết luồng phụ thuộc vào bộ điều hợp. Nếu bộ điều hợp kênh
    đang hoạt động không hỗ trợ liên kết luồng, OpenClaw trả về một
    thông báo không được hỗ trợ/không khả dụng rõ ràng.

  </Accordion>
  <Accordion title="Các kênh hỗ trợ luồng">
    - Bất kỳ bộ điều hợp kênh nào phơi bày khả năng liên kết phiên/luồng.
    - Hỗ trợ tích hợp hiện tại: luồng/kênh **Discord**, chủ đề **Telegram** (chủ đề diễn đàn trong nhóm/siêu nhóm và chủ đề DM).
    - Các kênh Plugin có thể thêm hỗ trợ qua cùng giao diện liên kết.

  </Accordion>
</AccordionGroup>

## Liên kết kênh bền vững

Đối với các quy trình làm việc không tạm thời, hãy cấu hình các liên kết ACP bền vững trong
các mục cấp cao nhất `bindings[]`.

### Mô hình liên kết

<ParamField path="bindings[].type" type='"acp"'>
  Đánh dấu một liên kết cuộc trò chuyện ACP bền vững.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Xác định cuộc trò chuyện đích. Các dạng theo kênh:

- **Kênh/luồng Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Chủ đề diễn đàn Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **DM/nhóm BlueBubbles:** `match.channel="bluebubbles"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Ưu tiên `chat_id:*` hoặc `chat_identifier:*` cho liên kết nhóm ổn định.
- **DM/nhóm iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Ưu tiên `chat_id:*` cho liên kết nhóm ổn định.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Id agent OpenClaw sở hữu.
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

### Mặc định runtime theo agent

Dùng `agents.list[].runtime` để định nghĩa mặc định ACP một lần cho mỗi agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (id harness, ví dụ `codex` hoặc `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Thứ tự ưu tiên ghi đè cho các phiên ACP được liên kết:**

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

- OpenClaw bảo đảm phiên ACP đã cấu hình tồn tại trước khi sử dụng.
- Tin nhắn trong kênh hoặc chủ đề đó được định tuyến tới phiên ACP đã cấu hình.
- Trong các cuộc trò chuyện đã liên kết, `/new` và `/reset` đặt lại cùng khóa phiên ACP tại chỗ.
- Các liên kết runtime tạm thời (ví dụ được tạo bởi các luồng tập trung vào luồng thảo luận) vẫn áp dụng khi hiện diện.
- Với các lượt sinh ACP giữa nhiều agent mà không có `cwd` rõ ràng, OpenClaw kế thừa workspace của agent đích từ cấu hình agent.
- Các đường dẫn workspace kế thừa bị thiếu sẽ quay về cwd mặc định của backend; lỗi truy cập không phải do thiếu đường dẫn sẽ hiển thị dưới dạng lỗi sinh phiên.

## Bắt đầu phiên ACP

Hai cách để bắt đầu một phiên ACP:

<Tabs>
  <Tab title="From sessions_spawn">
    Dùng `runtime: "acp"` để bắt đầu một phiên ACP từ một lượt agent hoặc
    lời gọi công cụ.

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
    `runtime` mặc định là `subagent`, vì vậy hãy đặt rõ `runtime: "acp"`
    cho các phiên ACP. Nếu bỏ qua `agentId`, OpenClaw dùng
    `acp.defaultAgent` khi đã cấu hình. `mode: "session"` yêu cầu
    `thread: true` để giữ một cuộc trò chuyện đã liên kết bền vững.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Dùng `/acp spawn` để operator điều khiển rõ ràng từ chat.

    ```text
    /acp spawn codex --mode persistent --thread auto
    /acp spawn codex --mode oneshot --thread off
    /acp spawn codex --bind here
    /acp spawn codex --thread here
    ```

    Các flag chính:

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
  Prompt ban đầu được gửi tới phiên ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Phải là `"acp"` cho các phiên ACP.
</ParamField>
<ParamField path="agentId" type="string">
  Id harness đích ACP. Quay về `acp.defaultAgent` nếu được đặt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Yêu cầu luồng liên kết thread khi được hỗ trợ.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` là một lần; `"session"` là bền vững. Nếu `thread: true` và
  bỏ qua `mode`, OpenClaw có thể mặc định dùng hành vi bền vững theo
  đường dẫn runtime. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc runtime được yêu cầu (được backend/runtime
  policy xác thực). Nếu bỏ qua, ACP spawn kế thừa workspace của agent đích
  khi đã cấu hình; các đường dẫn kế thừa bị thiếu quay về mặc định của
  backend, còn lỗi truy cập thật sẽ được trả về.
</ParamField>
<ParamField path="label" type="string">
  Nhãn hướng tới operator dùng trong văn bản phiên/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tiếp tục một phiên ACP hiện có thay vì tạo phiên mới. Agent phát lại
  lịch sử trò chuyện qua `session/load`. Yêu cầu `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` stream các tóm tắt tiến trình chạy ACP ban đầu trở lại
  phiên yêu cầu dưới dạng sự kiện hệ thống. Phản hồi được chấp nhận bao gồm
  `streamLogPath` trỏ tới nhật ký JSONL theo phạm vi phiên
  (`<sessionId>.acp-stream.jsonl`) mà bạn có thể tail để xem toàn bộ lịch sử chuyển tiếp.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Hủy lượt ACP con sau N giây. `0` giữ lượt đó trên đường dẫn không timeout
  của gateway. Cùng giá trị được áp dụng cho lượt chạy Gateway
  và runtime ACP để các harness bị treo/hết quota không chiếm
  lane của agent cha vô thời hạn.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè model rõ ràng cho phiên ACP con. Các lượt sinh Codex ACP
  chuẩn hóa ref OpenClaw Codex như `openai-codex/gpt-5.4` thành cấu hình
  khởi động Codex ACP trước `session/new`; các dạng slash như
  `openai-codex/gpt-5.4/high` cũng đặt reasoning effort của Codex ACP.
  Các harness khác phải quảng bá ACP `models` và hỗ trợ
  `session/set_model`; nếu không OpenClaw/acpx sẽ lỗi rõ ràng thay vì
  âm thầm quay về mặc định của agent đích.
</ParamField>
<ParamField path="thinking" type="string">
  Thinking/reasoning effort rõ ràng. Với Codex ACP, `minimal` ánh xạ tới
  effort thấp, `low`/`medium`/`high`/`xhigh` ánh xạ trực tiếp, và `off`
  bỏ qua ghi đè reasoning-effort khi khởi động.
</ParamField>

## Các chế độ liên kết sinh phiên và thread

<Tabs>
  <Tab title="--bind here|off">
    | Chế độ | Hành vi                                                                |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Liên kết cuộc trò chuyện đang hoạt động hiện tại tại chỗ; lỗi nếu không có cuộc trò chuyện nào đang hoạt động. |
    | `off`  | Không tạo liên kết cuộc trò chuyện hiện tại.                           |

    Ghi chú:

    - `--bind here` là đường dẫn operator đơn giản nhất để "biến kênh hoặc chat này thành kênh được Codex hỗ trợ."
    - `--bind here` không tạo thread con.
    - `--bind here` chỉ có trên các kênh phơi bày hỗ trợ liên kết cuộc trò chuyện hiện tại.
    - Không thể kết hợp `--bind` và `--thread` trong cùng một lời gọi `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Chế độ | Hành vi                                                                                             |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Trong một thread đang hoạt động: liên kết thread đó. Ngoài thread: tạo/liên kết thread con khi được hỗ trợ. |
    | `here` | Yêu cầu thread đang hoạt động hiện tại; lỗi nếu không ở trong thread.                               |
    | `off`  | Không liên kết. Phiên bắt đầu không bị ràng buộc.                                                   |

    Ghi chú:

    - Trên các bề mặt liên kết không theo thread, hành vi mặc định trên thực tế là `off`.
    - Sinh phiên gắn với thread yêu cầu hỗ trợ policy của kênh:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Dùng `--bind here` khi bạn muốn ghim cuộc trò chuyện hiện tại mà không tạo thread con.

  </Tab>
</Tabs>

## Mô hình phân phối

Phiên ACP có thể là workspace tương tác hoặc công việc nền do cha sở hữu.
Đường dẫn phân phối phụ thuộc vào hình dạng đó.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Các phiên tương tác được thiết kế để tiếp tục trò chuyện trên một bề mặt chat
    hiển thị:

    - `/acp spawn ... --bind here` liên kết cuộc trò chuyện hiện tại với phiên ACP.
    - `/acp spawn ... --thread ...` liên kết một thread/chủ đề của kênh với phiên ACP.
    - `bindings[].type="acp"` đã cấu hình bền vững định tuyến các cuộc trò chuyện khớp tới cùng phiên ACP.

    Tin nhắn tiếp theo trong cuộc trò chuyện đã liên kết được định tuyến trực tiếp tới
    phiên ACP, và đầu ra ACP được gửi trả lại cùng
    kênh/thread/chủ đề đó.

    OpenClaw gửi gì tới harness:

    - Các follow-up đã liên kết thông thường được gửi dưới dạng văn bản prompt, kèm tệp đính kèm chỉ khi harness/backend hỗ trợ.
    - Các lệnh quản lý `/acp` và lệnh Gateway cục bộ được chặn trước khi dispatch ACP.
    - Các sự kiện hoàn tất do runtime tạo được vật chất hóa theo từng đích. Agent OpenClaw nhận envelope runtime-context nội bộ của OpenClaw; harness ACP bên ngoài nhận một prompt thuần với kết quả con và chỉ dẫn. Envelope thô `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` không bao giờ nên được gửi tới harness bên ngoài hoặc được lưu bền vững làm văn bản transcript người dùng ACP.
    - Các mục transcript ACP dùng văn bản kích hoạt người dùng nhìn thấy hoặc prompt hoàn tất thuần. Metadata sự kiện nội bộ được giữ có cấu trúc trong OpenClaw khi có thể và không được xử lý như nội dung chat do người dùng viết.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Các phiên ACP một lần do một lượt chạy agent khác sinh ra là các con chạy nền,
    tương tự sub-agent:

    - Cha yêu cầu công việc bằng `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Con chạy trong phiên harness ACP riêng.
    - Các lượt con chạy trên cùng lane nền được dùng bởi các lượt sinh sub-agent gốc, vì vậy harness ACP chậm không chặn công việc phiên chính không liên quan.
    - Báo cáo hoàn tất quay lại qua đường dẫn thông báo hoàn tất tác vụ. OpenClaw chuyển metadata hoàn tất nội bộ thành prompt ACP thuần trước khi gửi tới harness bên ngoài, để harness không thấy các marker runtime context chỉ dành cho OpenClaw.
    - Cha viết lại kết quả con bằng giọng assistant thông thường khi phản hồi hướng tới người dùng là hữu ích.

    **Không** xử lý đường dẫn này như một cuộc chat ngang hàng giữa cha
    và con. Con đã có một kênh hoàn tất quay lại
    cha.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` có thể nhắm tới một phiên khác sau khi sinh. Với các
    phiên ngang hàng thông thường, OpenClaw dùng đường dẫn follow-up agent-to-agent (A2A)
    sau khi tiêm tin nhắn:

    - Chờ phản hồi của phiên đích.
    - Tùy chọn cho phép bên yêu cầu và bên đích trao đổi số lượt follow-up có giới hạn.
    - Yêu cầu đích tạo một tin nhắn thông báo.
    - Phân phối thông báo đó tới kênh hoặc thread hiển thị.

    Đường dẫn A2A đó là fallback cho các lượt gửi ngang hàng mà bên gửi cần một
    follow-up hiển thị. Nó vẫn được bật khi một phiên không liên quan có thể
    thấy và nhắn tin tới đích ACP, ví dụ dưới các thiết lập
    `tools.sessions.visibility` rộng.

    OpenClaw chỉ bỏ qua follow-up A2A khi bên yêu cầu là
    cha của chính ACP con một lần do cha sở hữu. Trong trường hợp đó,
    chạy A2A chồng lên hoàn tất tác vụ có thể đánh thức cha bằng
    kết quả của con, chuyển tiếp phản hồi của cha trở lại con, và
    tạo vòng lặp vang vọng cha/con. Kết quả `sessions_send` báo cáo
    `delivery.status="skipped"` cho trường hợp con được sở hữu đó vì
    đường dẫn hoàn tất đã chịu trách nhiệm cho kết quả.

  </Accordion>
  <Accordion title="Resume an existing session">
    Dùng `resumeSessionId` để tiếp tục một phiên ACP trước đó thay vì
    bắt đầu mới. Agent phát lại lịch sử trò chuyện qua
    `session/load`, vì vậy nó tiếp tục với đầy đủ ngữ cảnh của những gì đã diễn ra trước đó.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Các trường hợp sử dụng phổ biến:

    - Chuyển giao một phiên Codex từ laptop của bạn sang điện thoại - bảo agent của bạn tiếp tục từ nơi bạn đã dừng.
    - Tiếp tục một phiên lập trình bạn đã bắt đầu tương tác trong CLI, giờ chạy headless qua agent của bạn.
    - Tiếp tục công việc bị gián đoạn bởi gateway restart hoặc idle timeout.

    Ghi chú:

    - `resumeSessionId` chỉ áp dụng khi `runtime: "acp"`; runtime sub-agent mặc định bỏ qua trường chỉ dành cho ACP này.
    - `streamTo` chỉ áp dụng khi `runtime: "acp"`; runtime sub-agent mặc định bỏ qua trường chỉ dành cho ACP này.
    - `resumeSessionId` là id tiếp tục ACP/harness cục bộ theo host, không phải khóa phiên kênh OpenClaw; OpenClaw vẫn kiểm tra policy sinh ACP và policy agent đích trước khi dispatch, trong khi backend hoặc harness ACP sở hữu việc cấp quyền để tải id upstream đó.
    - `resumeSessionId` khôi phục lịch sử trò chuyện ACP upstream; `thread` và `mode` vẫn áp dụng bình thường cho phiên OpenClaw mới bạn đang tạo, vì vậy `mode: "session"` vẫn yêu cầu `thread: true`.
    - Agent đích phải hỗ trợ `session/load` (Codex và Claude Code có hỗ trợ).
    - Nếu không tìm thấy id phiên, thao tác sinh phiên lỗi với thông báo rõ ràng - không âm thầm fallback sang phiên mới.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Sau khi deploy gateway, hãy chạy kiểm tra end-to-end trực tiếp thay vì
    tin vào unit test:

    1. Xác minh phiên bản Gateway đã triển khai và commit trên máy chủ đích.
    2. Mở một phiên cầu nối ACPX tạm thời tới một tác tử đang hoạt động.
    3. Yêu cầu tác tử đó gọi `sessions_spawn` với `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, và tác vụ `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Xác minh `accepted=yes`, một `childSessionKey` thật, và không có lỗi trình xác thực.
    5. Dọn dẹp phiên cầu nối tạm thời.

    Giữ cổng kiểm tra trên `mode: "run"` và bỏ qua `streamTo: "parent"` -
    `mode: "session"` gắn với luồng và các đường dẫn chuyển tiếp luồng là những
    lượt kiểm thử tích hợp phong phú riêng biệt.

  </Accordion>
</AccordionGroup>

## Tương thích sandbox

Các phiên ACP hiện chạy trên runtime của máy chủ, **không** chạy bên trong
sandbox của OpenClaw.

<Warning>
**Ranh giới bảo mật:**

- Bộ kiểm thử bên ngoài có thể đọc/ghi theo quyền CLI riêng của nó và `cwd` đã chọn.
- Chính sách sandbox của OpenClaw **không** bao bọc việc thực thi harness ACP.
- OpenClaw vẫn thực thi các cổng tính năng ACP, tác tử được phép, quyền sở hữu phiên, liên kết kênh, và chính sách phân phối của Gateway.
- Dùng `runtime: "subagent"` cho công việc gốc OpenClaw được sandbox thực thi.

</Warning>

Các giới hạn hiện tại:

- Nếu phiên yêu cầu đang ở trong sandbox, các lần spawn ACP bị chặn cho cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
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
3. Dự phòng phiên yêu cầu hiện tại.

Liên kết cuộc trò chuyện hiện tại và liên kết luồng đều tham gia ở
bước 2.

Nếu không phân giải được mục tiêu nào, OpenClaw trả về lỗi rõ ràng
(`Unable to resolve session target: ...`).

## Điều khiển ACP

| Lệnh                 | Tác dụng                                                   | Ví dụ                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tạo phiên ACP; tùy chọn liên kết hiện tại hoặc liên kết luồng. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hủy lượt đang xử lý cho phiên mục tiêu.                   | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Gửi chỉ dẫn điều hướng tới phiên đang chạy.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Đóng phiên và hủy liên kết các mục tiêu luồng.            | `/acp close`                                                  |
| `/acp status`        | Hiển thị backend, chế độ, trạng thái, tùy chọn runtime, khả năng. | `/acp status`                                                 |
| `/acp set-mode`      | Đặt chế độ runtime cho phiên mục tiêu.                    | `/acp set-mode plan`                                          |
| `/acp set`           | Ghi tùy chọn cấu hình runtime chung.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Đặt ghi đè thư mục làm việc của runtime.                  | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Đặt hồ sơ chính sách phê duyệt.                           | `/acp permissions strict`                                     |
| `/acp timeout`       | Đặt thời gian chờ runtime (giây).                         | `/acp timeout 120`                                            |
| `/acp model`         | Đặt ghi đè mô hình runtime.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Xóa các ghi đè tùy chọn runtime của phiên.                | `/acp reset-options`                                          |
| `/acp sessions`      | Liệt kê các phiên ACP gần đây từ kho lưu trữ.             | `/acp sessions`                                               |
| `/acp doctor`        | Tình trạng backend, khả năng, các bản sửa có thể hành động. | `/acp doctor`                                                 |
| `/acp install`       | In các bước cài đặt và bật mang tính xác định.            | `/acp install`                                                |

`/acp status` hiển thị các tùy chọn runtime hiệu lực cùng với các mã định danh phiên cấp runtime và
cấp backend. Lỗi điều khiển không được hỗ trợ được hiển thị
rõ ràng khi backend thiếu một khả năng. `/acp sessions` đọc
kho lưu trữ cho phiên hiện được liên kết hoặc phiên yêu cầu; các token mục tiêu
(`session-key`, `session-id`, hoặc `session-label`) được phân giải thông qua
khám phá phiên Gateway, bao gồm các gốc `session.store`
tùy chỉnh theo từng tác tử.

### Ánh xạ tùy chọn runtime

`/acp` có các lệnh tiện dụng và một bộ đặt chung. Các thao tác
tương đương:

| Lệnh                         | Ánh xạ tới                           | Ghi chú                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | khóa cấu hình runtime `model`        | Với Codex ACP, OpenClaw chuẩn hóa `openai-codex/<model>` thành id mô hình của adapter và ánh xạ các hậu tố suy luận dạng gạch chéo như `openai-codex/gpt-5.4/high` thành `reasoning_effort`. |
| `/acp set thinking <level>`  | khóa cấu hình runtime `thinking`     | Với Codex ACP, OpenClaw gửi `reasoning_effort` tương ứng khi adapter hỗ trợ.                                                                                                   |
| `/acp permissions <profile>` | khóa cấu hình runtime `approval_policy` | -                                                                                                                                                                              |
| `/acp timeout <seconds>`     | khóa cấu hình runtime `timeout`      | -                                                                                                                                                                              |
| `/acp cwd <path>`            | ghi đè cwd runtime                   | Cập nhật trực tiếp.                                                                                                                                                           |
| `/acp set <key> <value>`     | chung                                | `key=cwd` dùng đường dẫn ghi đè cwd.                                                                                                                                          |
| `/acp reset-options`         | xóa tất cả ghi đè runtime            | -                                                                                                                                                                              |

## harness acpx, thiết lập Plugin, và quyền

Để biết cấu hình harness acpx (bí danh Claude Code / Codex / Gemini CLI),
các cầu nối MCP plugin-tools và OpenClaw-tools, và các chế độ quyền
ACP, xem
[Tác tử ACP - thiết lập](/vi/tools/acp-agents-setup).

## Khắc phục sự cố

| Triệu chứng                                                                     | Nguyên nhân có khả năng                                                                                                           | Cách khắc phục                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin backend bị thiếu, bị tắt hoặc bị chặn bởi `plugins.allow`.                                                       | Cài đặt và bật Plugin backend, đưa `acpx` vào `plugins.allow` khi allowlist đó được đặt, rồi chạy `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP bị tắt trên toàn cục.                                                                                                 | Đặt `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Điều phối tự động từ các tin nhắn luồng thông thường đã bị tắt.                                                               | Đặt `acp.dispatch.enabled=true` để tiếp tục định tuyến luồng tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` tường minh vẫn hoạt động.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent không có trong allowlist.                                                                                                | Dùng `agentId` được cho phép hoặc cập nhật `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` báo backend chưa sẵn sàng ngay sau khi khởi động                 | Plugin backend bị thiếu, bị tắt, bị chặn bởi chính sách cho phép/từ chối hoặc tệp thực thi đã cấu hình của nó không khả dụng.        | Cài đặt/bật Plugin backend, chạy lại `/acp doctor`, và kiểm tra lỗi cài đặt backend hoặc lỗi chính sách nếu nó vẫn không khỏe mạnh.                                           |
| Không tìm thấy lệnh harness                                                   | CLI adapter chưa được cài đặt, Plugin bên ngoài bị thiếu hoặc lần tải `npx` đầu tiên thất bại với adapter không phải Codex. | Chạy `/acp doctor`, cài đặt/làm nóng adapter trên máy chủ Gateway, hoặc cấu hình tường minh lệnh agent acpx.                                                      |
| Harness báo không tìm thấy mô hình                                            | ID mô hình hợp lệ cho nhà cung cấp/harness khác nhưng không hợp lệ với mục tiêu ACP này.                                                | Dùng mô hình do harness đó liệt kê, cấu hình mô hình trong harness, hoặc bỏ qua ghi đè.                                                                            |
| Lỗi xác thực nhà cung cấp từ harness                                          | OpenClaw khỏe mạnh, nhưng CLI/nhà cung cấp mục tiêu chưa đăng nhập.                                                     | Đăng nhập hoặc cung cấp khóa nhà cung cấp cần thiết trong môi trường máy chủ Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Token khóa/ID/nhãn không hợp lệ.                                                                                                | Chạy `/acp sessions`, sao chép chính xác khóa/nhãn, rồi thử lại.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` được dùng khi không có cuộc trò chuyện đang hoạt động có thể liên kết.                                                            | Chuyển tới cuộc trò chuyện/kênh đích và thử lại, hoặc tạo phiên không liên kết.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter thiếu khả năng liên kết ACP với cuộc trò chuyện hiện tại.                                                             | Dùng `/acp spawn ... --thread ...` nếu được hỗ trợ, cấu hình `bindings[]` cấp cao nhất, hoặc chuyển sang kênh được hỗ trợ.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` được dùng bên ngoài ngữ cảnh luồng.                                                                         | Chuyển tới luồng đích hoặc dùng `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Người dùng khác sở hữu mục tiêu liên kết đang hoạt động.                                                                           | Liên kết lại với tư cách chủ sở hữu hoặc dùng cuộc trò chuyện hay luồng khác.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Adapter thiếu khả năng liên kết luồng.                                                                               | Dùng `--thread off` hoặc chuyển sang adapter/kênh được hỗ trợ.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP nằm phía máy chủ; phiên yêu cầu đang ở trong sandbox.                                                              | Dùng `runtime="subagent"` từ các phiên sandbox, hoặc chạy ACP spawn từ một phiên không sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` được yêu cầu cho runtime ACP.                                                                         | Dùng `runtime="subagent"` cho sandboxing bắt buộc, hoặc dùng ACP với `sandbox="inherit"` từ một phiên không sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Harness mục tiêu không phơi bày khả năng chuyển đổi mô hình ACP chung.                                                        | Dùng harness quảng bá ACP `models`/`session/set_model`, dùng tham chiếu mô hình ACP của Codex, hoặc cấu hình mô hình trực tiếp trong harness nếu nó có cờ khởi động riêng. |
| Thiếu metadata ACP cho phiên đã liên kết                                      | Metadata phiên ACP cũ/đã xóa.                                                                                    | Tạo lại bằng `/acp spawn`, rồi liên kết lại/tập trung vào luồng.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` chặn ghi/thực thi trong phiên ACP không tương tác.                                                    | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại Gateway. Xem [Cấu hình quyền](/vi/tools/acp-agents-setup#permission-configuration). |
| Phiên ACP thất bại sớm với rất ít đầu ra                                  | Các lời nhắc quyền bị chặn bởi `permissionMode`/`nonInteractivePermissions`.                                        | Kiểm tra nhật ký gateway để tìm `AcpRuntimeError`. Để có đầy đủ quyền, đặt `permissionMode=approve-all`; để suy giảm chức năng nhẹ nhàng, đặt `nonInteractivePermissions=deny`.        |
| Phiên ACP bị treo vô thời hạn sau khi hoàn thành công việc                       | Tiến trình harness đã kết thúc nhưng phiên ACP không báo hoàn tất.                                                    | Cập nhật OpenClaw; cơ chế dọn dẹp acpx hiện tại sẽ thu hồi các tiến trình wrapper và adapter cũ do OpenClaw sở hữu khi đóng và khi Gateway khởi động.                                             |
| Harness thấy `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Phong bì sự kiện nội bộ bị rò rỉ qua ranh giới ACP.                                                                | Cập nhật OpenClaw và chạy lại luồng hoàn tất; các harness bên ngoài chỉ nên nhận lời nhắc hoàn tất dạng thuần.                                                          |

## Liên quan

- [ACP agents - thiết lập](/vi/tools/acp-agents-setup)
- [Gửi agent](/vi/tools/agent-send)
- [Backend CLI](/vi/gateway/cli-backends)
- [Harness Codex](/vi/plugins/codex-harness)
- [Công cụ sandbox đa agent](/vi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (chế độ cầu nối)](/vi/cli/acp)
- [Sub-agents](/vi/tools/subagents)
