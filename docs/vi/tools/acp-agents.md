---
read_when:
    - Chạy các bộ khung lập trình thông qua ACP
    - Thiết lập các phiên ACP gắn với cuộc trò chuyện trên các kênh nhắn tin
    - Liên kết cuộc trò chuyện trên kênh nhắn tin với một phiên ACP được duy trì
    - Khắc phục sự cố phần backend ACP, kết nối Plugin hoặc gửi kết quả hoàn thành
    - Sử dụng các lệnh /acp từ cuộc trò chuyện
sidebarTitle: ACP agents
summary: Chạy các harness lập trình bên ngoài (Claude Code, Cursor, Gemini CLI, Codex ACP tường minh, OpenClaw ACP, OpenCode) thông qua backend ACP
title: Tác nhân ACP
x-i18n:
    generated_at: "2026-04-29T23:16:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8257bdba22b613093da1a06761fdc5034cae4bca249ae91a531ec3fccabb954
    source_path: tools/acp-agents.md
    workflow: 16
---

[Phiên Agent Client Protocol (ACP)](https://agentclientprotocol.com/)
cho phép OpenClaw chạy các harness lập trình bên ngoài (ví dụ Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, và các harness
ACPX được hỗ trợ khác) thông qua một Plugin backend ACP.

Mỗi lần tạo phiên ACP đều được theo dõi dưới dạng một [tác vụ nền](/vi/automation/tasks).

<Note>
**ACP là đường dẫn harness bên ngoài, không phải đường dẫn Codex mặc định.** Plugin
máy chủ ứng dụng Codex gốc sở hữu các điều khiển `/codex ...` và runtime nhúng
`agentRuntime.id: "codex"`; ACP sở hữu các điều khiển
`/acp ...` và các phiên `sessions_spawn({ runtime: "acp" })`.

Nếu bạn muốn Codex hoặc Claude Code kết nối trực tiếp như một MCP client bên ngoài
vào các cuộc hội thoại kênh OpenClaw hiện có, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp) thay vì ACP.
</Note>

## Tôi cần trang nào?

| Bạn muốn…                                                                                       | Dùng mục này                          | Ghi chú                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liên kết hoặc điều khiển Codex trong cuộc hội thoại hiện tại                                    | `/codex bind`, `/codex threads`       | Đường dẫn máy chủ ứng dụng Codex gốc khi Plugin `codex` được bật; bao gồm trả lời chat đã liên kết, chuyển tiếp hình ảnh, model/nhanh/quyền, dừng và điều khiển định hướng. ACP là phương án dự phòng rõ ràng |
| Chạy Claude Code, Gemini CLI, Codex ACP rõ ràng, hoặc một harness bên ngoài khác _thông qua_ OpenClaw | Trang này                             | Các phiên gắn với chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tác vụ nền, điều khiển runtime                                                                                   |
| Phơi bày một phiên OpenClaw Gateway _dưới dạng_ máy chủ ACP cho editor hoặc client              | [`openclaw acp`](/vi/cli/acp)            | Chế độ cầu nối. IDE/client giao tiếp ACP với OpenClaw qua stdio/WebSocket                                                                                                                    |
| Tái sử dụng một AI CLI cục bộ làm model dự phòng chỉ văn bản                                    | [Backend CLI](/vi/gateway/cli-backends) | Không phải ACP. Không có công cụ OpenClaw, không có điều khiển ACP, không có runtime harness                                                                                                 |

## Cái này có hoạt động ngay không?

Thường là có. Các bản cài đặt mới đi kèm Plugin runtime `acpx` tích hợp được bật
theo mặc định, với binary `acpx` được ghim cục bộ theo Plugin mà OpenClaw thăm dò
và tự sửa khi khởi động. Chạy `/acp doctor` để kiểm tra mức sẵn sàng.

OpenClaw chỉ dạy agent về việc tạo phiên ACP khi ACP **thực sự
có thể dùng**: ACP phải được bật, dispatch không được bị tắt, phiên hiện tại
không được bị sandbox chặn, và một backend runtime phải được tải. Nếu các điều kiện
đó không được đáp ứng, Skills Plugin ACP và hướng dẫn ACP cho
`sessions_spawn` vẫn bị ẩn để agent không đề xuất một backend không khả dụng.

<AccordionGroup>
  <Accordion title="Những điều dễ vướng khi chạy lần đầu">
    - Nếu `plugins.allow` được đặt, đó là danh mục Plugin giới hạn và **phải** bao gồm `acpx`; nếu không, mặc định tích hợp sẽ bị chặn có chủ ý và `/acp doctor` báo mục allowlist bị thiếu.
    - Adapter Codex ACP tích hợp được chuẩn bị cùng Plugin `acpx` và được khởi chạy cục bộ khi có thể.
    - Các adapter harness đích khác vẫn có thể được tải theo nhu cầu bằng `npx` trong lần đầu bạn dùng chúng.
    - Xác thực của nhà cung cấp vẫn phải tồn tại trên host cho harness đó.
    - Nếu host không có npm hoặc quyền truy cập mạng, các lần tải adapter đầu tiên sẽ thất bại cho đến khi cache được làm nóng trước hoặc adapter được cài theo cách khác.

  </Accordion>
  <Accordion title="Điều kiện tiên quyết của runtime">
    ACP khởi chạy một tiến trình harness bên ngoài thật. OpenClaw sở hữu định tuyến,
    trạng thái tác vụ nền, phân phối, liên kết và chính sách; harness
    sở hữu đăng nhập nhà cung cấp, danh mục model, hành vi hệ thống tệp và
    công cụ gốc của nó.

    Trước khi quy lỗi cho OpenClaw, hãy xác minh:

    - `/acp doctor` báo một backend đã bật và khỏe mạnh.
    - Id đích được `acp.allowedAgents` cho phép khi allowlist đó được đặt.
    - Lệnh harness có thể khởi động trên host Gateway.
    - Xác thực nhà cung cấp có mặt cho harness đó (`claude`, `codex`, `gemini`, `opencode`, `droid`, v.v.).
    - Model đã chọn tồn tại cho harness đó — các id model không thể dùng thay thế giữa các harness.
    - `cwd` được yêu cầu tồn tại và có thể truy cập, hoặc bỏ qua `cwd` và để backend dùng mặc định của nó.
    - Chế độ quyền khớp với công việc. Các phiên không tương tác không thể bấm lời nhắc quyền gốc, nên các lượt chạy lập trình nặng về ghi/thực thi thường cần một hồ sơ quyền ACPX có thể tiếp tục không cần giao diện.

  </Accordion>
</AccordionGroup>

Công cụ Plugin OpenClaw và công cụ OpenClaw tích hợp **không** được phơi bày cho
các harness ACP theo mặc định. Chỉ bật các cầu nối MCP rõ ràng trong
[Agent ACP — thiết lập](/vi/tools/acp-agents-setup) khi harness
nên gọi trực tiếp các công cụ đó.

## Mục tiêu harness được hỗ trợ

Với backend `acpx` tích hợp, hãy dùng các id harness này làm mục tiêu `/acp spawn <id>`
hoặc `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id harness | Backend điển hình                              | Ghi chú                                                                              |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Adapter Claude Code ACP                        | Yêu cầu xác thực Claude Code trên host.                                              |
| `codex`    | Adapter Codex ACP                              | Chỉ là phương án dự phòng ACP rõ ràng khi `/codex` gốc không khả dụng hoặc ACP được yêu cầu. |
| `copilot`  | Adapter GitHub Copilot ACP                     | Yêu cầu xác thực Copilot CLI/runtime.                                                |
| `cursor`   | Cursor CLI ACP (`cursor-agent acp`)            | Ghi đè lệnh acpx nếu bản cài cục bộ phơi bày entrypoint ACP khác.                  |
| `droid`    | Factory Droid CLI                              | Yêu cầu xác thực Factory/Droid hoặc `FACTORY_API_KEY` trong môi trường harness.      |
| `gemini`   | Adapter Gemini CLI ACP                         | Yêu cầu xác thực Gemini CLI hoặc thiết lập khóa API.                                 |
| `iflow`    | iFlow CLI                                      | Tính khả dụng của adapter và điều khiển model phụ thuộc vào CLI đã cài.             |
| `kilocode` | Kilo Code CLI                                  | Tính khả dụng của adapter và điều khiển model phụ thuộc vào CLI đã cài.             |
| `kimi`     | Kimi/Moonshot CLI                              | Yêu cầu xác thực Kimi/Moonshot trên host.                                            |
| `kiro`     | Kiro CLI                                       | Tính khả dụng của adapter và điều khiển model phụ thuộc vào CLI đã cài.             |
| `opencode` | Adapter OpenCode ACP                           | Yêu cầu xác thực OpenCode CLI/nhà cung cấp.                                          |
| `openclaw` | Cầu nối OpenClaw Gateway qua `openclaw acp`    | Cho phép một harness hỗ trợ ACP giao tiếp ngược với một phiên OpenClaw Gateway.      |
| `pi`       | Runtime OpenClaw nhúng/Pi                      | Dùng cho các thử nghiệm harness gốc OpenClaw.                                        |
| `qwen`     | Qwen Code / Qwen CLI                           | Yêu cầu xác thực tương thích Qwen trên host.                                         |

Có thể cấu hình alias agent acpx tùy chỉnh trong chính acpx, nhưng chính sách
OpenClaw vẫn kiểm tra `acp.allowedAgents` và mọi ánh xạ
`agents.list[].runtime.acp.agent` trước khi dispatch.

## Runbook cho operator

Luồng `/acp` nhanh từ chat:

<Steps>
  <Step title="Tạo phiên">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, hoặc rõ ràng
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Làm việc">
    Tiếp tục trong cuộc hội thoại hoặc thread đã liên kết (hoặc nhắm rõ
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
    `/acp cancel` (lượt hiện tại) hoặc `/acp close` (phiên + liên kết).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Chi tiết vòng đời">
    - Tạo phiên sẽ tạo mới hoặc tiếp tục một phiên runtime ACP, ghi metadata ACP vào kho phiên OpenClaw, và có thể tạo một tác vụ nền khi lượt chạy thuộc sở hữu của parent.
    - Các phiên ACP thuộc sở hữu của parent được xem là công việc nền ngay cả khi phiên runtime là persistent; hoàn tất và phân phối liên bề mặt đi qua bộ thông báo tác vụ parent thay vì hoạt động như một phiên chat thông thường hướng người dùng.
    - Bảo trì tác vụ đóng các phiên ACP one-shot thuộc sở hữu của parent đã kết thúc hoặc mồ côi. Các phiên ACP persistent được giữ lại khi vẫn còn liên kết hội thoại đang hoạt động; các phiên persistent cũ không có liên kết đang hoạt động sẽ bị đóng để chúng không thể được tiếp tục âm thầm sau khi tác vụ sở hữu đã xong hoặc bản ghi tác vụ của nó đã mất.
    - Tin nhắn theo dõi đã liên kết đi trực tiếp tới phiên ACP cho đến khi liên kết được đóng, bỏ focus, đặt lại hoặc hết hạn.
    - Lệnh Gateway vẫn cục bộ. `/acp ...`, `/status`, và `/unfocus` không bao giờ được gửi như văn bản prompt thông thường tới harness ACP đã liên kết.
    - `cancel` hủy lượt đang hoạt động khi backend hỗ trợ hủy; nó không xóa liên kết hoặc metadata phiên.
    - `close` kết thúc phiên ACP theo góc nhìn của OpenClaw và xóa liên kết. Một harness vẫn có thể giữ lịch sử upstream riêng nếu nó hỗ trợ tiếp tục.
    - Worker runtime nhàn rỗi đủ điều kiện được dọn dẹp sau `acp.runtime.ttlMinutes`; metadata phiên đã lưu vẫn khả dụng cho `/acp sessions`.

  </Accordion>
  <Accordion title="Quy tắc định tuyến Codex gốc">
    Các trigger ngôn ngữ tự nhiên nên được định tuyến tới **Plugin Codex
    gốc** khi Plugin đó được bật:

    - "Liên kết kênh Discord này với Codex."
    - "Gắn chat này với thread Codex `<id>`."
    - "Hiển thị các thread Codex, rồi liên kết thread này."

    Liên kết hội thoại Codex gốc là đường dẫn điều khiển chat mặc định.
    Các công cụ động OpenClaw vẫn thực thi thông qua OpenClaw, trong khi
    các công cụ gốc Codex như shell/apply-patch thực thi bên trong Codex.
    Đối với sự kiện công cụ gốc Codex, OpenClaw chèn một relay hook gốc
    theo từng lượt để các hook Plugin có thể chặn `before_tool_call`, quan sát
    `after_tool_call`, và định tuyến các sự kiện Codex `PermissionRequest`
    thông qua phê duyệt OpenClaw. Các hook Codex `Stop` được relay tới
    OpenClaw `before_agent_finalize`, nơi các Plugin có thể yêu cầu thêm một
    lượt model trước khi Codex hoàn tất câu trả lời. Relay vẫn
    cố ý thận trọng: nó không thay đổi đối số công cụ gốc Codex
    hoặc viết lại bản ghi thread Codex. Chỉ dùng ACP rõ ràng
    khi bạn muốn mô hình runtime/phiên ACP. Ranh giới hỗ trợ Codex nhúng
    được ghi lại trong
    [hợp đồng hỗ trợ harness Codex v1](/vi/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Bảng tham chiếu nhanh chọn mô hình / nhà cung cấp / runtime">
    - `openai-codex/*` — tuyến OAuth/gói đăng ký PI Codex.
    - `openai/*` cộng với `agentRuntime.id: "codex"` — runtime nhúng của app-server Codex gốc.
    - `/codex ...` — điều khiển hội thoại Codex gốc.
    - `/acp ...` hoặc `runtime: "acp"` — điều khiển ACP/acpx tường minh.

  </Accordion>
  <Accordion title="Tác nhân kích hoạt ngôn ngữ tự nhiên định tuyến ACP">
    Các tác nhân kích hoạt nên định tuyến đến runtime ACP:

    - "Chạy tác vụ này dưới dạng một phiên Claude Code ACP một lần rồi tóm tắt kết quả."
    - "Dùng Gemini CLI cho tác vụ này trong một luồng, sau đó giữ các lượt theo dõi trong cùng luồng đó."
    - "Chạy Codex qua ACP trong một luồng nền."

    OpenClaw chọn `runtime: "acp"`, phân giải harness `agentId`,
    liên kết với hội thoại hoặc luồng hiện tại khi được hỗ trợ, và
    định tuyến các lượt theo dõi đến phiên đó cho đến khi đóng/hết hạn. Codex chỉ
    đi theo đường dẫn này khi ACP/acpx được chỉ định tường minh hoặc Plugin Codex
    gốc không khả dụng cho thao tác được yêu cầu.

    Với `sessions_spawn`, `runtime: "acp"` chỉ được quảng bá khi ACP
    được bật, bên yêu cầu không bị sandbox, và một backend runtime
    ACP đã được tải. `acp.dispatch.enabled=false` tạm dừng điều phối
    luồng ACP tự động nhưng không ẩn hoặc chặn các lệnh gọi
    `sessions_spawn({ runtime: "acp" })` tường minh. Nó nhắm đến các id harness ACP như `codex`,
    `claude`, `droid`, `gemini`, hoặc `opencode`. Không truyền id agent
    cấu hình OpenClaw thông thường từ `agents_list` trừ khi mục đó được
    cấu hình tường minh với `agents.list[].runtime.type="acp"`;
    nếu không, hãy dùng runtime sub-agent mặc định. Khi một agent OpenClaw
    được cấu hình với `runtime.type="acp"`, OpenClaw dùng
    `runtime.acp.agent` làm id harness bên dưới.

  </Accordion>
</AccordionGroup>

## ACP so với sub-agent

Dùng ACP khi bạn muốn một runtime harness bên ngoài. Dùng **app-server Codex
gốc** để liên kết/điều khiển hội thoại Codex khi Plugin `codex`
được bật. Dùng **sub-agent** khi bạn muốn các lượt chạy được ủy quyền
gốc OpenClaw.

| Khu vực       | Phiên ACP                              | Lượt chạy sub-agent                |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (ví dụ acpx)       | Runtime sub-agent gốc OpenClaw     |
| Khóa phiên    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Lệnh chính    | `/acp ...`                            | `/subagents ...`                   |
| Công cụ tạo   | `sessions_spawn` với `runtime:"acp"`  | `sessions_spawn` (runtime mặc định) |

Xem thêm [Sub-agent](/vi/tools/subagents).

## Cách ACP chạy Claude Code

Với Claude Code qua ACP, ngăn xếp là:

1. Mặt phẳng điều khiển phiên ACP của OpenClaw.
2. Plugin runtime `acpx` đi kèm.
3. Bộ chuyển đổi ACP của Claude.
4. Cơ chế runtime/phiên phía Claude.

ACP Claude là một **phiên harness** với các điều khiển ACP, tiếp tục phiên,
theo dõi tác vụ nền, và tùy chọn liên kết hội thoại/luồng.

Các backend CLI là các runtime dự phòng cục bộ chỉ văn bản riêng biệt — xem
[Backend CLI](/vi/gateway/cli-backends).

Với người vận hành, quy tắc thực tế là:

- **Muốn `/acp spawn`, phiên có thể liên kết, điều khiển runtime, hoặc công việc harness bền vững?** Dùng ACP.
- **Muốn dự phòng văn bản cục bộ đơn giản qua CLI thô?** Dùng backend CLI.

## Phiên đã liên kết

### Mô hình tư duy

- **Bề mặt chat** — nơi mọi người tiếp tục trò chuyện (kênh Discord, chủ đề Telegram, chat iMessage).
- **Phiên ACP** — trạng thái runtime Codex/Claude/Gemini bền vững mà OpenClaw định tuyến tới.
- **Luồng/chủ đề con** — bề mặt nhắn tin bổ sung tùy chọn chỉ được tạo bởi `--thread ...`.
- **Không gian làm việc runtime** — vị trí hệ thống tệp (`cwd`, checkout repo, không gian làm việc backend) nơi harness chạy. Độc lập với bề mặt chat.

### Liên kết hội thoại hiện tại

`/acp spawn <harness> --bind here` ghim hội thoại hiện tại vào
phiên ACP đã tạo — không có luồng con, cùng bề mặt chat. OpenClaw tiếp tục
sở hữu transport, xác thực, an toàn và phân phối. Các tin nhắn theo dõi trong
hội thoại đó được định tuyến đến cùng phiên; `/new` và `/reset` đặt lại
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
    - `--bind here` chỉ hoạt động trên các kênh quảng bá khả năng liên kết hội thoại hiện tại; nếu không, OpenClaw trả về một thông báo không được hỗ trợ rõ ràng. Liên kết tồn tại qua các lần khởi động lại Gateway.
    - Trên Discord, `spawnAcpSessions` chỉ bắt buộc khi OpenClaw cần tạo luồng con cho `--thread auto|here` — không áp dụng cho `--bind here`.
    - Nếu bạn tạo phiên cho một agent ACP khác mà không có `--cwd`, theo mặc định OpenClaw kế thừa không gian làm việc của **agent đích**. Đường dẫn kế thừa bị thiếu (`ENOENT`/`ENOTDIR`) sẽ quay về mặc định backend; các lỗi truy cập khác (ví dụ `EACCES`) xuất hiện dưới dạng lỗi tạo phiên.
    - Các lệnh quản lý Gateway vẫn cục bộ trong hội thoại đã liên kết — lệnh `/acp ...` được OpenClaw xử lý ngay cả khi văn bản theo dõi thông thường định tuyến đến phiên ACP đã liên kết; `/status` và `/unfocus` cũng vẫn cục bộ bất cứ khi nào xử lý lệnh được bật cho bề mặt đó.

  </Accordion>
  <Accordion title="Phiên liên kết theo luồng">
    Khi liên kết luồng được bật cho bộ chuyển đổi kênh:

    - OpenClaw liên kết một luồng với phiên ACP đích.
    - Tin nhắn theo dõi trong luồng đó định tuyến đến phiên ACP đã liên kết.
    - Đầu ra ACP được phân phối trở lại cùng luồng.
    - Unfocus/đóng/lưu trữ/hết thời gian nhàn rỗi hoặc hết hạn tuổi tối đa sẽ gỡ liên kết.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, và `/unfocus` là các lệnh Gateway, không phải prompt gửi đến harness ACP.

    Cờ tính năng bắt buộc cho ACP liên kết theo luồng:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` được bật theo mặc định (đặt `false` để tạm dừng điều phối luồng ACP tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` tường minh vẫn hoạt động).
    - Cờ tạo luồng ACP của bộ chuyển đổi kênh được bật (tùy bộ chuyển đổi):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Hỗ trợ liên kết luồng tùy thuộc vào bộ chuyển đổi. Nếu bộ chuyển đổi
    kênh đang hoạt động không hỗ trợ liên kết luồng, OpenClaw trả về một
    thông báo không được hỗ trợ/không khả dụng rõ ràng.

  </Accordion>
  <Accordion title="Kênh hỗ trợ luồng">
    - Bất kỳ bộ chuyển đổi kênh nào cung cấp khả năng liên kết phiên/luồng.
    - Hỗ trợ tích hợp hiện tại: luồng/kênh **Discord**, chủ đề **Telegram** (chủ đề diễn đàn trong nhóm/siêu nhóm và chủ đề DM).
    - Kênh Plugin có thể thêm hỗ trợ thông qua cùng giao diện liên kết.

  </Accordion>
</AccordionGroup>

## Liên kết kênh bền vững

Với các quy trình làm việc không tạm thời, hãy cấu hình liên kết ACP bền vững trong
các mục `bindings[]` cấp cao nhất.

### Mô hình liên kết

<ParamField path="bindings[].type" type='"acp"'>
  Đánh dấu một liên kết hội thoại ACP bền vững.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Xác định hội thoại đích. Các dạng theo từng kênh:

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
  Nhãn tùy chọn dành cho người vận hành.
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

**Thứ tự ưu tiên ghi đè cho phiên ACP đã liên kết:**

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

- OpenClaw đảm bảo phiên ACP đã cấu hình tồn tại trước khi sử dụng.
- Tin nhắn trong kênh hoặc chủ đề đó định tuyến đến phiên ACP đã cấu hình.
- Trong hội thoại đã liên kết, `/new` và `/reset` đặt lại cùng khóa phiên ACP tại chỗ.
- Liên kết runtime tạm thời (ví dụ do luồng tập trung theo luồng tạo ra) vẫn áp dụng ở nơi hiện diện.
- Với các lần tạo ACP xuyên agent không có `cwd` tường minh, OpenClaw kế thừa không gian làm việc agent đích từ cấu hình agent.
- Đường dẫn không gian làm việc kế thừa bị thiếu sẽ quay về cwd mặc định của backend; lỗi truy cập không phải do thiếu sẽ xuất hiện dưới dạng lỗi tạo phiên.

## Khởi động phiên ACP

Hai cách để khởi động một phiên ACP:

<Tabs>
  <Tab title="Từ sessions_spawn">
    Dùng `runtime: "acp"` để khởi động một phiên ACP từ lượt của agent hoặc
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
    `runtime` mặc định là `subagent`, vì vậy hãy đặt rõ `runtime: "acp"`
    cho các phiên ACP. Nếu bỏ qua `agentId`, OpenClaw sẽ dùng
    `acp.defaultAgent` khi đã được cấu hình. `mode: "session"` yêu cầu
    `thread: true` để giữ một cuộc trò chuyện đã liên kết bền vững.
    </Note>

  </Tab>
  <Tab title="Từ lệnh /acp">
    Dùng `/acp spawn` để có quyền điều khiển rõ ràng của người vận hành từ cuộc trò chuyện.

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
  Lời nhắc ban đầu được gửi đến phiên ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Phải là `"acp"` cho các phiên ACP.
</ParamField>
<ParamField path="agentId" type="string">
  ID bộ điều phối đích ACP. Quay về `acp.defaultAgent` nếu đã đặt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Yêu cầu luồng liên kết luồng khi được hỗ trợ.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` là một lần; `"session"` là bền vững. Nếu `thread: true` và
  bỏ qua `mode`, OpenClaw có thể mặc định dùng hành vi bền vững theo
  đường dẫn môi trường chạy. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc môi trường chạy được yêu cầu (được xác thực bởi chính sách
  phần phụ trợ/môi trường chạy). Nếu bỏ qua, thao tác sinh ACP kế thừa không gian làm việc
  của tác nhân đích khi đã được cấu hình; các đường dẫn kế thừa bị thiếu sẽ quay về
  mặc định phần phụ trợ, còn lỗi truy cập thực sẽ được trả về.
</ParamField>
<ParamField path="label" type="string">
  Nhãn hiển thị cho người vận hành được dùng trong văn bản phiên/biểu ngữ.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tiếp tục một phiên ACP hiện có thay vì tạo phiên mới. Tác nhân
  phát lại lịch sử cuộc trò chuyện của nó qua `session/load`. Yêu cầu
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` truyền các bản tóm tắt tiến trình lần chạy ACP ban đầu về
  phiên yêu cầu dưới dạng sự kiện hệ thống. Phản hồi được chấp nhận bao gồm
  `streamLogPath` trỏ đến nhật ký JSONL trong phạm vi phiên
  (`<sessionId>.acp-stream.jsonl`) mà bạn có thể theo dõi để xem đầy đủ lịch sử chuyển tiếp.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Hủy lượt ACP con sau N giây. `0` giữ lượt trên đường dẫn không hết thời gian chờ
  của Gateway. Cùng một giá trị được áp dụng cho lần chạy Gateway
  và môi trường chạy ACP để các bộ điều phối bị kẹt/hết hạn mức không
  chiếm làn tác nhân cha vô thời hạn.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình rõ ràng cho phiên ACP con. Các lần sinh Codex ACP
  chuẩn hóa các tham chiếu OpenClaw Codex như `openai-codex/gpt-5.4` thành cấu hình
  khởi động Codex ACP trước `session/new`; các dạng gạch chéo như
  `openai-codex/gpt-5.4/high` cũng đặt mức nỗ lực suy luận Codex ACP.
  Các bộ điều phối khác phải quảng bá ACP `models` và hỗ trợ
  `session/set_model`; nếu không OpenClaw/acpx sẽ lỗi rõ ràng thay vì
  âm thầm quay về mặc định tác nhân đích.
</ParamField>
<ParamField path="thinking" type="string">
  Mức nỗ lực suy nghĩ/suy luận rõ ràng. Với Codex ACP, `minimal` ánh xạ đến
  mức nỗ lực thấp, `low`/`medium`/`high`/`xhigh` ánh xạ trực tiếp, và `off`
  bỏ qua ghi đè khởi động mức nỗ lực suy luận.
</ParamField>

## Chế độ liên kết sinh và luồng

<Tabs>
  <Tab title="--bind here|off">
    | Chế độ | Hành vi                                                                |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Liên kết cuộc trò chuyện đang hoạt động hiện tại tại chỗ; lỗi nếu không có cuộc trò chuyện nào hoạt động. |
    | `off`  | Không tạo liên kết cuộc trò chuyện hiện tại.                           |

    Ghi chú:

    - `--bind here` là đường dẫn người vận hành đơn giản nhất để "biến kênh hoặc cuộc trò chuyện này thành được Codex hỗ trợ."
    - `--bind here` không tạo luồng con.
    - `--bind here` chỉ khả dụng trên các kênh cung cấp hỗ trợ liên kết cuộc trò chuyện hiện tại.
    - Không thể kết hợp `--bind` và `--thread` trong cùng một lần gọi `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Chế độ | Hành vi                                                                                             |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Trong một luồng đang hoạt động: liên kết luồng đó. Bên ngoài luồng: tạo/liên kết luồng con khi được hỗ trợ. |
    | `here` | Yêu cầu luồng đang hoạt động hiện tại; lỗi nếu không ở trong luồng nào.                             |
    | `off`  | Không liên kết. Phiên bắt đầu ở trạng thái chưa liên kết.                                           |

    Ghi chú:

    - Trên các bề mặt liên kết không theo luồng, hành vi mặc định về cơ bản là `off`.
    - Sinh có liên kết luồng yêu cầu chính sách kênh hỗ trợ:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Dùng `--bind here` khi bạn muốn ghim cuộc trò chuyện hiện tại mà không tạo luồng con.

  </Tab>
</Tabs>

## Mô hình phân phối

Các phiên ACP có thể là không gian làm việc tương tác hoặc công việc nền
do phiên cha sở hữu. Đường dẫn phân phối phụ thuộc vào hình dạng đó.

<AccordionGroup>
  <Accordion title="Phiên ACP tương tác">
    Các phiên tương tác được thiết kế để tiếp tục trò chuyện trên một bề mặt trò chuyện
    hiển thị:

    - `/acp spawn ... --bind here` liên kết cuộc trò chuyện hiện tại với phiên ACP.
    - `/acp spawn ... --thread ...` liên kết một luồng/chủ đề kênh với phiên ACP.
    - `bindings[].type="acp"` được cấu hình bền vững định tuyến các cuộc trò chuyện khớp đến cùng một phiên ACP.

    Các tin nhắn tiếp theo trong cuộc trò chuyện đã liên kết được định tuyến trực tiếp đến
    phiên ACP, và đầu ra ACP được gửi trở lại chính
    kênh/luồng/chủ đề đó.

    OpenClaw gửi gì đến bộ điều phối:

    - Các lượt tiếp theo đã liên kết thông thường được gửi dưới dạng văn bản lời nhắc, cộng với tệp đính kèm chỉ khi bộ điều phối/phần phụ trợ hỗ trợ chúng.
    - Các lệnh quản lý `/acp` và lệnh Gateway cục bộ bị chặn trước khi điều phối ACP.
    - Các sự kiện hoàn tất do môi trường chạy tạo được hiện thực hóa theo từng đích. Tác nhân OpenClaw nhận phong bì ngữ cảnh môi trường chạy nội bộ của OpenClaw; các bộ điều phối ACP bên ngoài nhận một lời nhắc thuần với kết quả con và chỉ dẫn. Phong bì thô `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` không bao giờ được gửi đến bộ điều phối bên ngoài hoặc được lưu bền vững dưới dạng văn bản bản ghi người dùng ACP.
    - Các mục bản ghi ACP dùng văn bản kích hoạt hiển thị cho người dùng hoặc lời nhắc hoàn tất thuần. Siêu dữ liệu sự kiện nội bộ vẫn có cấu trúc trong OpenClaw khi có thể và không được xem là nội dung trò chuyện do người dùng viết.

  </Accordion>
  <Accordion title="Phiên ACP một lần do phiên cha sở hữu">
    Các phiên ACP một lần do một lần chạy tác nhân khác sinh ra chạy như con nền,
    tương tự tác nhân phụ:

    - Phiên cha yêu cầu công việc bằng `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Phiên con chạy trong phiên bộ điều phối ACP riêng của nó.
    - Lượt con chạy trên cùng làn nền được dùng bởi các lần sinh tác nhân phụ gốc, vì vậy một bộ điều phối ACP chậm không chặn công việc phiên chính không liên quan.
    - Báo cáo hoàn tất quay lại qua đường dẫn thông báo hoàn tất tác vụ. OpenClaw chuyển đổi siêu dữ liệu hoàn tất nội bộ thành một lời nhắc ACP thuần trước khi gửi đến bộ điều phối bên ngoài, vì vậy bộ điều phối không thấy các dấu ngữ cảnh môi trường chạy chỉ dành cho OpenClaw.
    - Phiên cha viết lại kết quả con bằng giọng trợ lý thông thường khi cần phản hồi hướng đến người dùng.

    **Không** xem đường dẫn này là cuộc trò chuyện ngang hàng giữa phiên cha
    và phiên con. Phiên con đã có kênh hoàn tất quay lại
    phiên cha.

  </Accordion>
  <Accordion title="sessions_send và phân phối A2A">
    `sessions_send` có thể nhắm đến phiên khác sau khi sinh. Với các phiên ngang hàng
    thông thường, OpenClaw dùng đường dẫn tiếp theo tác nhân-đến-tác nhân (A2A)
    sau khi chèn tin nhắn:

    - Chờ phản hồi của phiên đích.
    - Tùy chọn cho phép bên yêu cầu và bên đích trao đổi số lượt tiếp theo có giới hạn.
    - Yêu cầu đích tạo một tin nhắn thông báo.
    - Gửi thông báo đó đến kênh hoặc luồng hiển thị.

    Đường dẫn A2A đó là phương án dự phòng cho các lần gửi ngang hàng khi bên gửi cần một
    lượt tiếp theo hiển thị. Nó vẫn được bật khi một phiên không liên quan có thể
    thấy và nhắn tin cho một đích ACP, ví dụ dưới các thiết lập
    `tools.sessions.visibility` rộng.

    OpenClaw chỉ bỏ qua lượt tiếp theo A2A khi bên yêu cầu là
    phiên cha của chính phiên con ACP một lần do phiên cha sở hữu. Trong trường hợp đó,
    chạy A2A bên trên hoàn tất tác vụ có thể đánh thức phiên cha bằng
    kết quả của phiên con, chuyển tiếp phản hồi của phiên cha trở lại phiên con, và
    tạo vòng lặp vọng phiên cha/phiên con. Kết quả `sessions_send` báo cáo
    `delivery.status="skipped"` cho trường hợp phiên con được sở hữu đó vì
    đường dẫn hoàn tất đã chịu trách nhiệm cho kết quả.

  </Accordion>
  <Accordion title="Tiếp tục một phiên hiện có">
    Dùng `resumeSessionId` để tiếp tục một phiên ACP trước đó thay vì
    bắt đầu mới. Tác nhân phát lại lịch sử cuộc trò chuyện của nó qua
    `session/load`, vì vậy nó tiếp tục với đầy đủ ngữ cảnh của những gì đã diễn ra trước đó.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Các trường hợp sử dụng phổ biến:

    - Bàn giao một phiên Codex từ máy tính xách tay của bạn sang điện thoại — bảo tác nhân của bạn tiếp tục từ nơi bạn đã dừng.
    - Tiếp tục một phiên lập trình bạn đã bắt đầu tương tác trong CLI, giờ chạy không giao diện thông qua tác nhân của bạn.
    - Tiếp tục công việc đã bị gián đoạn bởi lần khởi động lại gateway hoặc hết thời gian chờ do nhàn rỗi.

    Ghi chú:

    - `resumeSessionId` chỉ áp dụng khi `runtime: "acp"`; môi trường chạy tác nhân phụ mặc định bỏ qua trường chỉ dành cho ACP này.
    - `streamTo` chỉ áp dụng khi `runtime: "acp"`; môi trường chạy tác nhân phụ mặc định bỏ qua trường chỉ dành cho ACP này.
    - `resumeSessionId` là ID tiếp tục ACP/bộ điều phối cục bộ trên máy chủ, không phải khóa phiên kênh OpenClaw; OpenClaw vẫn kiểm tra chính sách sinh ACP và chính sách tác nhân đích trước khi điều phối, trong khi phần phụ trợ hoặc bộ điều phối ACP sở hữu quyền ủy quyền để tải ID thượng nguồn đó.
    - `resumeSessionId` khôi phục lịch sử cuộc trò chuyện ACP thượng nguồn; `thread` và `mode` vẫn áp dụng bình thường cho phiên OpenClaw mới bạn đang tạo, vì vậy `mode: "session"` vẫn yêu cầu `thread: true`.
    - Tác nhân đích phải hỗ trợ `session/load` (Codex và Claude Code có hỗ trợ).
    - Nếu không tìm thấy ID phiên, thao tác sinh sẽ lỗi với thông báo rõ ràng — không âm thầm quay về phiên mới.

  </Accordion>
  <Accordion title="Kiểm thử khói sau triển khai">
    Sau khi triển khai gateway, hãy chạy kiểm tra đầu cuối trực tiếp thay vì
    tin vào kiểm thử đơn vị:

    1. Xác minh phiên bản gateway và commit đã triển khai trên máy chủ đích.
    2. Mở một phiên cầu nối ACPX tạm thời đến một tác nhân trực tiếp.
    3. Yêu cầu tác nhân đó gọi `sessions_spawn` với `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, và tác vụ `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Xác minh `accepted=yes`, một `childSessionKey` thật, và không có lỗi trình xác thực.
    5. Dọn dẹp phiên cầu nối tạm thời.

    Giữ cổng trên `mode: "run"` và bỏ qua `streamTo: "parent"` —
    `mode: "session"` có liên kết luồng và các đường dẫn chuyển tiếp luồng là những
    lượt tích hợp phong phú riêng biệt.

  </Accordion>
</AccordionGroup>

## Tương thích sandbox

Các phiên ACP hiện chạy trên môi trường chạy máy chủ, **không** bên trong
sandbox OpenClaw.

<Warning>
**Ranh giới bảo mật:**

- Harness bên ngoài có thể đọc/ghi theo quyền CLI riêng của nó và `cwd` đã chọn.
- Chính sách sandbox của OpenClaw **không** bao bọc quá trình thực thi harness ACP.
- OpenClaw vẫn thực thi các cổng tính năng ACP, tác nhân được phép, quyền sở hữu phiên, ràng buộc kênh và chính sách phân phối Gateway.
- Dùng `runtime: "subagent"` cho công việc gốc OpenClaw được sandbox thực thi.

</Warning>

Hạn chế hiện tại:

- Nếu phiên của bên yêu cầu đang bị sandbox, việc spawn ACP bị chặn cho cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
- `sessions_spawn` với `runtime: "acp"` không hỗ trợ `sandbox: "require"`.

## Phân giải đích phiên

Hầu hết hành động `/acp` chấp nhận một đích phiên tùy chọn (`session-key`,
`session-id`, hoặc `session-label`).

**Thứ tự phân giải:**

1. Đối số đích tường minh (hoặc `--session` cho `/acp steer`)
   - thử khóa
   - rồi id phiên có dạng UUID
   - rồi nhãn
2. Ràng buộc luồng hiện tại (nếu cuộc trò chuyện/luồng này được ràng buộc với một phiên ACP).
3. Dự phòng về phiên của bên yêu cầu hiện tại.

Các ràng buộc cuộc trò chuyện hiện tại và ràng buộc luồng đều tham gia ở
bước 2.

Nếu không phân giải được đích nào, OpenClaw trả về lỗi rõ ràng
(`Unable to resolve session target: ...`).

## Điều khiển ACP

| Lệnh                 | Chức năng                                                 | Ví dụ                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tạo phiên ACP; tùy chọn ràng buộc hiện tại hoặc luồng.    | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hủy lượt đang chạy cho phiên đích.                        | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Gửi chỉ dẫn điều hướng tới phiên đang chạy.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Đóng phiên và gỡ ràng buộc các đích luồng.                | `/acp close`                                                  |
| `/acp status`        | Hiển thị backend, chế độ, trạng thái, tùy chọn runtime, capability. | `/acp status`                                                 |
| `/acp set-mode`      | Đặt chế độ runtime cho phiên đích.                        | `/acp set-mode plan`                                          |
| `/acp set`           | Ghi tùy chọn cấu hình runtime chung.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Đặt ghi đè thư mục làm việc runtime.                      | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Đặt hồ sơ chính sách phê duyệt.                           | `/acp permissions strict`                                     |
| `/acp timeout`       | Đặt thời gian chờ runtime (giây).                         | `/acp timeout 120`                                            |
| `/acp model`         | Đặt ghi đè mô hình runtime.                               | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Xóa các ghi đè tùy chọn runtime của phiên.                | `/acp reset-options`                                          |
| `/acp sessions`      | Liệt kê các phiên ACP gần đây từ kho lưu trữ.             | `/acp sessions`                                               |
| `/acp doctor`        | Sức khỏe backend, capability, bản sửa có thể hành động.   | `/acp doctor`                                                 |
| `/acp install`       | In các bước cài đặt và bật có tính xác định.              | `/acp install`                                                |

`/acp status` hiển thị các tùy chọn runtime hiệu lực cùng với mã định danh phiên cấp runtime và
cấp backend. Lỗi điều khiển không được hỗ trợ được hiển thị
rõ ràng khi backend thiếu capability. `/acp sessions` đọc
kho lưu trữ cho phiên đang được ràng buộc hiện tại hoặc phiên của bên yêu cầu; token đích
(`session-key`, `session-id`, hoặc `session-label`) được phân giải thông qua
khám phá phiên Gateway, bao gồm các gốc `session.store`
tùy chỉnh theo từng tác nhân.

### Ánh xạ tùy chọn runtime

`/acp` có các lệnh tiện ích và một bộ đặt chung. Các
thao tác tương đương:

| Lệnh                         | Ánh xạ tới                           | Ghi chú                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | khóa cấu hình runtime `model`        | Với Codex ACP, OpenClaw chuẩn hóa `openai-codex/<model>` thành id mô hình adapter và ánh xạ các hậu tố suy luận dạng dấu gạch chéo như `openai-codex/gpt-5.4/high` thành `reasoning_effort`. |
| `/acp set thinking <level>`  | khóa cấu hình runtime `thinking`     | Với Codex ACP, OpenClaw gửi `reasoning_effort` tương ứng khi adapter hỗ trợ.                                                                                                   |
| `/acp permissions <profile>` | khóa cấu hình runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | khóa cấu hình runtime `timeout`      | —                                                                                                                                                                              |
| `/acp cwd <path>`            | ghi đè cwd runtime                   | Cập nhật trực tiếp.                                                                                                                                                            |
| `/acp set <key> <value>`     | chung                                | `key=cwd` dùng đường dẫn ghi đè cwd.                                                                                                                                           |
| `/acp reset-options`         | xóa tất cả ghi đè runtime            | —                                                                                                                                                                              |

## Harness acpx, thiết lập plugin và quyền

Để biết cấu hình harness acpx (bí danh Claude Code / Codex / Gemini CLI),
các cầu nối MCP plugin-tools và OpenClaw-tools, và các chế độ
quyền ACP, xem
[Tác nhân ACP — thiết lập](/vi/tools/acp-agents-setup).

## Khắc phục sự cố

| Triệu chứng                                                                 | Nguyên nhân có thể                                                                                                    | Cách khắc phục                                                                                                                                                          |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Thiếu Plugin backend, bị tắt, hoặc bị chặn bởi `plugins.allow`.                                                        | Cài đặt và bật Plugin backend, đưa `acpx` vào `plugins.allow` khi allowlist đó được thiết lập, rồi chạy `/acp doctor`.                                                  |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP bị tắt toàn cục.                                                                                                   | Đặt `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Điều phối tự động từ tin nhắn luồng thông thường bị tắt.                                                               | Đặt `acp.dispatch.enabled=true` để tiếp tục định tuyến luồng tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` rõ ràng vẫn hoạt động.                          |
| `ACP agent "<id>" is not allowed by policy`                                 | Tác tử không nằm trong allowlist.                                                                                      | Dùng `agentId` được phép hoặc cập nhật `acp.allowedAgents`.                                                                                                              |
| `/acp doctor` báo backend chưa sẵn sàng ngay sau khi khởi động              | Kiểm tra phụ thuộc của Plugin hoặc tự sửa chữa vẫn đang chạy.                                                          | Chờ một lúc rồi chạy lại `/acp doctor`; nếu vẫn không khỏe, kiểm tra lỗi cài đặt backend và chính sách cho phép/từ chối Plugin.                                         |
| Không tìm thấy lệnh harness                                                 | CLI adapter chưa được cài đặt, thiếu phụ thuộc Plugin đã chuẩn bị, hoặc lần tải `npx` đầu tiên thất bại với adapter không phải Codex. | Chạy `/acp doctor`, sửa phụ thuộc Plugin, cài đặt/làm nóng adapter trên máy chủ Gateway, hoặc cấu hình rõ ràng lệnh tác tử acpx.                                        |
| Harness trả về lỗi không tìm thấy mô hình                                   | ID mô hình hợp lệ với nhà cung cấp/harness khác nhưng không hợp lệ với mục tiêu ACP này.                              | Dùng một mô hình do harness đó liệt kê, cấu hình mô hình trong harness, hoặc bỏ ghi đè.                                                                                  |
| Lỗi xác thực nhà cung cấp từ harness                                        | OpenClaw đang khỏe, nhưng CLI/nhà cung cấp mục tiêu chưa đăng nhập.                                                    | Đăng nhập hoặc cung cấp khóa nhà cung cấp bắt buộc trong môi trường máy chủ Gateway.                                                                                    |
| `Unable to resolve session target: ...`                                     | Token khóa/id/nhãn không hợp lệ.                                                                                      | Chạy `/acp sessions`, sao chép chính xác khóa/nhãn, rồi thử lại.                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | Dùng `--bind here` khi không có cuộc hội thoại đang hoạt động có thể bind.                                             | Chuyển tới cuộc trò chuyện/kênh mục tiêu rồi thử lại, hoặc spawn không bind.                                                                                            |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter thiếu khả năng binding ACP cho cuộc hội thoại hiện tại.                                                        | Dùng `/acp spawn ... --thread ...` ở nơi được hỗ trợ, cấu hình `bindings[]` cấp cao nhất, hoặc chuyển tới kênh được hỗ trợ.                                             |
| `--thread here requires running /acp spawn inside an active ... thread`     | Dùng `--thread here` bên ngoài ngữ cảnh luồng.                                                                         | Chuyển tới luồng mục tiêu hoặc dùng `--thread auto`/`off`.                                                                                                              |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Người dùng khác sở hữu mục tiêu binding đang hoạt động.                                                                | Rebind với tư cách chủ sở hữu hoặc dùng cuộc hội thoại hay luồng khác.                                                                                                  |
| `Thread bindings are unavailable for <channel>.`                            | Adapter thiếu khả năng binding luồng.                                                                                  | Dùng `--thread off` hoặc chuyển tới adapter/kênh được hỗ trợ.                                                                                                           |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | ACP runtime nằm phía máy chủ; phiên yêu cầu đang ở trong sandbox.                                                      | Dùng `runtime="subagent"` từ các phiên sandbox, hoặc chạy ACP spawn từ một phiên không sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | Đã yêu cầu `sandbox="require"` cho ACP runtime.                                                                        | Dùng `runtime="subagent"` cho yêu cầu sandbox bắt buộc, hoặc dùng ACP với `sandbox="inherit"` từ một phiên không sandbox.                                               |
| `Cannot apply --model ... did not advertise model support`                  | Harness mục tiêu không cung cấp chuyển đổi mô hình ACP chung.                                                          | Dùng harness quảng bá ACP `models`/`session/set_model`, dùng tham chiếu mô hình ACP của Codex, hoặc cấu hình mô hình trực tiếp trong harness nếu nó có cờ khởi động riêng. |
| Thiếu siêu dữ liệu ACP cho phiên đã bind                                    | Siêu dữ liệu phiên ACP đã cũ/bị xóa.                                                                                   | Tạo lại bằng `/acp spawn`, rồi rebind/focus luồng.                                                                                                                      |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` chặn ghi/thực thi trong phiên ACP không tương tác.                                                    | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại gateway. Xem [Cấu hình quyền](/vi/tools/acp-agents-setup#permission-configuration). |
| Phiên ACP thất bại sớm với rất ít đầu ra                                    | Lời nhắc quyền bị chặn bởi `permissionMode`/`nonInteractivePermissions`.                                               | Kiểm tra nhật ký gateway để tìm `AcpRuntimeError`. Để có đầy đủ quyền, đặt `permissionMode=approve-all`; để suy giảm nhẹ nhàng, đặt `nonInteractivePermissions=deny`.    |
| Phiên ACP bị treo vô thời hạn sau khi hoàn tất công việc                    | Tiến trình harness đã kết thúc nhưng phiên ACP không báo hoàn tất.                                                     | Theo dõi bằng `ps aux \| grep acpx`; tự kết thúc các tiến trình cũ.                                                                                                     |
| Harness thấy `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Phong bì sự kiện nội bộ bị rò rỉ qua ranh giới ACP.                                                                    | Cập nhật OpenClaw và chạy lại luồng hoàn tất; các harness bên ngoài chỉ nên nhận lời nhắc hoàn tất dạng văn bản thuần.                                                  |

## Liên quan

- [Tác tử ACP — thiết lập](/vi/tools/acp-agents-setup)
- [Gửi tác tử](/vi/tools/agent-send)
- [Backend CLI](/vi/gateway/cli-backends)
- [Harness Codex](/vi/plugins/codex-harness)
- [Công cụ sandbox đa tác tử](/vi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (chế độ cầu nối)](/vi/cli/acp)
- [Tác tử phụ](/vi/tools/subagents)
