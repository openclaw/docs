---
read_when:
    - Chạy các bộ khung lập trình thông qua ACP
    - Thiết lập các phiên ACP gắn với cuộc trò chuyện trên các kênh nhắn tin
    - Liên kết cuộc trò chuyện qua kênh nhắn tin với phiên ACP duy trì lâu dài
    - Khắc phục sự cố phần phụ trợ ACP, kết nối Plugin hoặc gửi kết quả hoàn tất
    - Chạy các lệnh /acp từ cuộc trò chuyện
sidebarTitle: ACP agents
summary: Chạy các bộ công cụ lập trình bên ngoài (Claude Code, Cursor, Gemini CLI, Codex ACP tường minh, OpenClaw ACP, OpenCode) thông qua phần phụ trợ ACP
title: Tác nhân ACP
x-i18n:
    generated_at: "2026-05-02T10:54:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec2404924cbb4c4cd0d94485bc7d8ea586c0ef5f4380e72d5212c8bd9d868c20
    source_path: tools/acp-agents.md
    workflow: 16
---

[Giao thức máy khách tác nhân (ACP)](https://agentclientprotocol.com/) phiên
cho phép OpenClaw chạy các bộ điều khiển lập trình bên ngoài (ví dụ Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI, và các bộ điều khiển
ACPX được hỗ trợ khác) thông qua một Plugin backend ACP.

Mỗi lần sinh phiên ACP được theo dõi như một [tác vụ nền](/vi/automation/tasks).

<Note>
**ACP là đường dẫn dành cho bộ điều khiển bên ngoài, không phải đường dẫn Codex mặc định.** Plugin
máy chủ ứng dụng Codex gốc sở hữu các điều khiển `/codex ...` và runtime nhúng
`agentRuntime.id: "codex"`; ACP sở hữu
các điều khiển `/acp ...` và các phiên `sessions_spawn({ runtime: "acp" })`.

Nếu bạn muốn Codex hoặc Claude Code kết nối như một máy khách MCP bên ngoài
trực tiếp tới các cuộc trò chuyện kênh OpenClaw hiện có, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp) thay vì ACP.
</Note>

## Tôi cần trang nào?

| Bạn muốn…                                                                                       | Dùng mục này                           | Ghi chú                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liên kết hoặc điều khiển Codex trong cuộc trò chuyện hiện tại                                   | `/codex bind`, `/codex threads`        | Đường dẫn máy chủ ứng dụng Codex gốc khi Plugin `codex` được bật; bao gồm trả lời trong chat đã liên kết, chuyển tiếp hình ảnh, mô hình/nhanh/quyền, dừng, và điều khiển định hướng. ACP là phương án dự phòng rõ ràng |
| Chạy Claude Code, Gemini CLI, Codex ACP rõ ràng, hoặc một bộ điều khiển bên ngoài khác _thông qua_ OpenClaw | Trang này                              | Phiên gắn với chat, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tác vụ nền, điều khiển runtime                                                                                        |
| Công bố một phiên OpenClaw Gateway _như_ máy chủ ACP cho trình biên tập hoặc máy khách          | [`openclaw acp`](/vi/cli/acp)             | Chế độ cầu nối. IDE/máy khách nói ACP với OpenClaw qua stdio/WebSocket                                                                                                                        |
| Tái sử dụng một AI CLI cục bộ làm mô hình dự phòng chỉ văn bản                                  | [Backend CLI](/vi/gateway/cli-backends)   | Không phải ACP. Không có công cụ OpenClaw, không có điều khiển ACP, không có runtime bộ điều khiển                                                                                            |

## Tính năng này có hoạt động ngay không?

Có, sau khi cài đặt Plugin runtime ACP chính thức:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các checkout nguồn có thể dùng Plugin workspace cục bộ `extensions/acpx` sau
`pnpm install`. Chạy `/acp doctor` để kiểm tra mức sẵn sàng.

OpenClaw chỉ hướng dẫn tác nhân về việc sinh ACP khi ACP **thực sự
dùng được**: ACP phải được bật, dispatch không được tắt, phiên hiện tại
không bị sandbox chặn, và một backend runtime phải được tải. Nếu các điều kiện
đó không được đáp ứng, Skills của Plugin ACP và hướng dẫn ACP
`sessions_spawn` sẽ được ẩn để tác nhân không đề xuất
một backend không khả dụng.

<AccordionGroup>
  <Accordion title="Vướng mắc khi chạy lần đầu">
    - Nếu `plugins.allow` được đặt, đó là một danh mục Plugin hạn chế và **phải** bao gồm `acpx`; nếu không, backend ACP đã cài đặt sẽ bị chặn có chủ ý và `/acp doctor` báo thiếu mục allowlist.
    - Bộ chuyển đổi Codex ACP được chuẩn bị cùng Plugin `acpx` và được khởi chạy cục bộ khi có thể.
    - Các bộ chuyển đổi bộ điều khiển đích khác vẫn có thể được tải theo nhu cầu bằng `npx` trong lần đầu bạn dùng.
    - Xác thực nhà cung cấp vẫn phải tồn tại trên máy chủ cho bộ điều khiển đó.
    - Nếu máy chủ không có npm hoặc truy cập mạng, việc tải bộ chuyển đổi lần đầu sẽ thất bại cho đến khi cache được làm nóng trước hoặc bộ chuyển đổi được cài đặt theo cách khác.

  </Accordion>
  <Accordion title="Điều kiện tiên quyết về runtime">
    ACP khởi chạy một tiến trình bộ điều khiển bên ngoài thật. OpenClaw sở hữu định tuyến,
    trạng thái tác vụ nền, phân phối, liên kết, và chính sách; bộ điều khiển
    sở hữu đăng nhập nhà cung cấp, danh mục mô hình, hành vi hệ thống tệp, và
    công cụ gốc của nó.

    Trước khi quy lỗi cho OpenClaw, hãy xác minh:

    - `/acp doctor` báo một backend đã bật và khỏe mạnh.
    - ID đích được `acp.allowedAgents` cho phép khi allowlist đó được đặt.
    - Lệnh bộ điều khiển có thể khởi động trên máy chủ Gateway.
    - Xác thực nhà cung cấp hiện diện cho bộ điều khiển đó (`claude`, `codex`, `gemini`, `opencode`, `droid`, v.v.).
    - Mô hình đã chọn tồn tại cho bộ điều khiển đó — ID mô hình không thể dùng thay thế giữa các bộ điều khiển.
    - `cwd` được yêu cầu tồn tại và có thể truy cập, hoặc bỏ qua `cwd` và để backend dùng mặc định của nó.
    - Chế độ quyền phù hợp với công việc. Các phiên không tương tác không thể bấm lời nhắc quyền gốc, nên các lượt chạy lập trình nặng về ghi/thực thi thường cần một hồ sơ quyền ACPX có thể tiếp tục không cần giao diện.

  </Accordion>
</AccordionGroup>

Công cụ Plugin OpenClaw và công cụ OpenClaw tích hợp sẵn **không** được công bố cho
các bộ điều khiển ACP theo mặc định. Chỉ bật các cầu nối MCP rõ ràng trong
[Thiết lập tác nhân ACP](/vi/tools/acp-agents-setup) khi bộ điều khiển
nên gọi trực tiếp các công cụ đó.

## Các mục tiêu bộ điều khiển được hỗ trợ

Với backend `acpx`, dùng các ID bộ điều khiển này làm mục tiêu `/acp spawn <id>`
hoặc `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID bộ điều khiển | Backend thường dùng                          | Ghi chú                                                                             |
| ---------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`         | Bộ chuyển đổi Claude Code ACP                | Yêu cầu xác thực Claude Code trên máy chủ.                                          |
| `codex`          | Bộ chuyển đổi Codex ACP                      | Chỉ là dự phòng ACP rõ ràng khi `/codex` gốc không khả dụng hoặc ACP được yêu cầu. |
| `copilot`        | Bộ chuyển đổi GitHub Copilot ACP             | Yêu cầu xác thực Copilot CLI/runtime.                                               |
| `cursor`         | Cursor CLI ACP (`cursor-agent acp`)          | Ghi đè lệnh acpx nếu bản cài đặt cục bộ công bố một entrypoint ACP khác.           |
| `droid`          | Factory Droid CLI                            | Yêu cầu xác thực Factory/Droid hoặc `FACTORY_API_KEY` trong môi trường bộ điều khiển. |
| `gemini`         | Bộ chuyển đổi Gemini CLI ACP                 | Yêu cầu xác thực Gemini CLI hoặc thiết lập khóa API.                                |
| `iflow`          | iFlow CLI                                    | Tính khả dụng của bộ chuyển đổi và điều khiển mô hình phụ thuộc vào CLI đã cài đặt. |
| `kilocode`       | Kilo Code CLI                                | Tính khả dụng của bộ chuyển đổi và điều khiển mô hình phụ thuộc vào CLI đã cài đặt. |
| `kimi`           | Kimi/Moonshot CLI                            | Yêu cầu xác thực Kimi/Moonshot trên máy chủ.                                        |
| `kiro`           | Kiro CLI                                     | Tính khả dụng của bộ chuyển đổi và điều khiển mô hình phụ thuộc vào CLI đã cài đặt. |
| `opencode`       | Bộ chuyển đổi OpenCode ACP                   | Yêu cầu xác thực OpenCode CLI/nhà cung cấp.                                         |
| `openclaw`       | Cầu nối OpenClaw Gateway qua `openclaw acp`  | Cho phép một bộ điều khiển biết ACP nói ngược lại với một phiên OpenClaw Gateway.  |
| `pi`             | Runtime Pi/OpenClaw nhúng                    | Dùng cho các thử nghiệm bộ điều khiển gốc OpenClaw.                                 |
| `qwen`           | Qwen Code / Qwen CLI                         | Yêu cầu xác thực tương thích Qwen trên máy chủ.                                     |

Alias tác nhân acpx tùy chỉnh có thể được cấu hình trong chính acpx, nhưng chính sách
OpenClaw vẫn kiểm tra `acp.allowedAgents` và mọi ánh xạ
`agents.list[].runtime.acp.agent` trước khi dispatch.

## Sổ tay vận hành

Luồng `/acp` nhanh từ chat:

<Steps>
  <Step title="Sinh phiên">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, hoặc rõ ràng
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Làm việc">
    Tiếp tục trong cuộc trò chuyện hoặc luồng đã liên kết (hoặc chỉ định rõ
    khóa phiên làm mục tiêu).
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
    - Sinh phiên tạo hoặc tiếp tục một phiên runtime ACP, ghi siêu dữ liệu ACP vào kho phiên OpenClaw, và có thể tạo một tác vụ nền khi lượt chạy do cha sở hữu.
    - Các phiên ACP do cha sở hữu được xem là công việc nền ngay cả khi phiên runtime là lâu dài; hoàn tất và phân phối liên bề mặt đi qua bộ thông báo tác vụ cha thay vì hoạt động như một phiên chat bình thường hướng tới người dùng.
    - Bảo trì tác vụ đóng các phiên ACP một lượt do cha sở hữu đã kết thúc hoặc mồ côi. Phiên ACP lâu dài được giữ lại khi còn liên kết cuộc trò chuyện đang hoạt động; các phiên lâu dài cũ không có liên kết đang hoạt động sẽ bị đóng để chúng không thể được tiếp tục âm thầm sau khi tác vụ sở hữu đã xong hoặc bản ghi tác vụ của nó đã mất.
    - Tin nhắn tiếp theo trong liên kết đi trực tiếp tới phiên ACP cho đến khi liên kết được đóng, bỏ tiêu điểm, đặt lại, hoặc hết hạn.
    - Lệnh Gateway vẫn ở cục bộ. `/acp ...`, `/status`, và `/unfocus` không bao giờ được gửi như văn bản prompt bình thường tới một bộ điều khiển ACP đã liên kết.
    - `cancel` hủy lượt đang hoạt động khi backend hỗ trợ hủy; nó không xóa liên kết hoặc siêu dữ liệu phiên.
    - `close` kết thúc phiên ACP theo góc nhìn của OpenClaw và xóa liên kết. Một bộ điều khiển vẫn có thể giữ lịch sử thượng nguồn riêng nếu nó hỗ trợ tiếp tục.
    - Worker runtime nhàn rỗi đủ điều kiện được dọn dẹp sau `acp.runtime.ttlMinutes`; siêu dữ liệu phiên đã lưu vẫn khả dụng cho `/acp sessions`.

  </Accordion>
  <Accordion title="Quy tắc định tuyến Codex gốc">
    Các trigger bằng ngôn ngữ tự nhiên nên được định tuyến tới **Plugin Codex
    gốc** khi nó được bật:

    - "Liên kết kênh Discord này với Codex."
    - "Gắn chat này vào luồng Codex `<id>`."
    - "Hiển thị các luồng Codex, rồi liên kết luồng này."

    Liên kết cuộc trò chuyện Codex gốc là đường dẫn điều khiển chat mặc định.
    Công cụ động OpenClaw vẫn thực thi thông qua OpenClaw, trong khi
    các công cụ gốc Codex như shell/apply-patch thực thi bên trong Codex.
    Đối với sự kiện công cụ gốc Codex, OpenClaw chèn một relay hook gốc
    theo từng lượt để Plugin hook có thể chặn `before_tool_call`, quan sát
    `after_tool_call`, và định tuyến các sự kiện Codex `PermissionRequest`
    qua phê duyệt OpenClaw. Hook Codex `Stop` được relay tới
    OpenClaw `before_agent_finalize`, nơi Plugin có thể yêu cầu thêm một
    lượt mô hình trước khi Codex hoàn tất câu trả lời. Relay vẫn
    được giữ thận trọng có chủ ý: nó không biến đổi đối số công cụ gốc Codex
    hoặc viết lại bản ghi luồng Codex. Chỉ dùng ACP rõ ràng
    khi bạn muốn mô hình runtime/phiên ACP. Ranh giới hỗ trợ Codex nhúng
    được ghi lại trong
    [hợp đồng hỗ trợ bộ điều khiển Codex v1](/vi/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Bảng tham khảo nhanh về lựa chọn model / provider / runtime">
    - `openai-codex/*` — tuyến OAuth/gói đăng ký PI Codex.
    - `openai/*` cộng với `agentRuntime.id: "codex"` — runtime nhúng của máy chủ ứng dụng Codex gốc.
    - `/codex ...` — điều khiển cuộc trò chuyện Codex gốc.
    - `/acp ...` hoặc `runtime: "acp"` — điều khiển ACP/acpx rõ ràng.

  </Accordion>
  <Accordion title="Tác nhân kích hoạt ngôn ngữ tự nhiên định tuyến ACP">
    Các tác nhân kích hoạt nên định tuyến đến runtime ACP:

    - "Chạy tác vụ này như một phiên Claude Code ACP một lần rồi tóm tắt kết quả."
    - "Dùng Gemini CLI cho tác vụ này trong một luồng, rồi giữ các lượt theo dõi trong cùng luồng đó."
    - "Chạy Codex thông qua ACP trong một luồng nền."

    OpenClaw chọn `runtime: "acp"`, phân giải harness `agentId`,
    liên kết với cuộc trò chuyện hoặc luồng hiện tại khi được hỗ trợ, và
    định tuyến các lượt theo dõi đến phiên đó cho đến khi đóng/hết hạn. Codex chỉ
    đi theo đường dẫn này khi ACP/acpx được chỉ định rõ ràng hoặc Plugin Codex
    gốc không khả dụng cho thao tác được yêu cầu.

    Đối với `sessions_spawn`, `runtime: "acp"` chỉ được quảng bá khi ACP
    được bật, bên yêu cầu không bị sandbox, và một backend runtime
    ACP đã được tải. `acp.dispatch.enabled=false` tạm dừng việc tự động
    điều phối luồng ACP nhưng không ẩn hoặc chặn các lệnh gọi
    `sessions_spawn({ runtime: "acp" })` rõ ràng. Nó nhắm đến các id harness ACP như `codex`,
    `claude`, `droid`, `gemini`, hoặc `opencode`. Không truyền id agent cấu hình
    OpenClaw thông thường từ `agents_list` trừ khi mục đó được
    cấu hình rõ ràng với `agents.list[].runtime.type="acp"`;
    nếu không hãy dùng runtime sub-agent mặc định. Khi một agent OpenClaw
    được cấu hình với `runtime.type="acp"`, OpenClaw dùng
    `runtime.acp.agent` làm id harness bên dưới.

  </Accordion>
</AccordionGroup>

## ACP so với sub-agent

Dùng ACP khi bạn muốn một runtime harness bên ngoài. Dùng **máy chủ ứng dụng Codex
gốc** để liên kết/điều khiển cuộc trò chuyện Codex khi Plugin `codex`
được bật. Dùng **sub-agent** khi bạn muốn các lượt chạy được ủy quyền
gốc của OpenClaw.

| Khu vực       | Phiên ACP                              | Lượt chạy sub-agent                |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (ví dụ acpx)        | Runtime sub-agent gốc của OpenClaw |
| Khóa phiên    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Lệnh chính    | `/acp ...`                            | `/subagents ...`                   |
| Công cụ spawn | `sessions_spawn` với `runtime:"acp"`  | `sessions_spawn` (runtime mặc định) |

Xem thêm [Sub-agent](/vi/tools/subagents).

## Cách ACP chạy Claude Code

Đối với Claude Code thông qua ACP, ngăn xếp là:

1. Mặt phẳng điều khiển phiên ACP của OpenClaw.
2. Plugin runtime `@openclaw/acpx` chính thức.
3. Bộ chuyển đổi Claude ACP.
4. Cơ chế runtime/phiên phía Claude.

ACP Claude là một **phiên harness** với điều khiển ACP, tiếp tục phiên,
theo dõi tác vụ nền, và tùy chọn liên kết cuộc trò chuyện/luồng.

Các backend CLI là các runtime dự phòng cục bộ chỉ văn bản riêng biệt — xem
[Backend CLI](/vi/gateway/cli-backends).

Đối với người vận hành, quy tắc thực tế là:

- **Muốn `/acp spawn`, phiên có thể liên kết, điều khiển runtime, hoặc công việc harness bền vững?** Dùng ACP.
- **Muốn dự phòng văn bản cục bộ đơn giản thông qua CLI thô?** Dùng backend CLI.

## Phiên được liên kết

### Mô hình tư duy

- **Bề mặt chat** — nơi mọi người tiếp tục trò chuyện (kênh Discord, chủ đề Telegram, cuộc trò chuyện iMessage).
- **Phiên ACP** — trạng thái runtime Codex/Claude/Gemini bền vững mà OpenClaw định tuyến đến.
- **Luồng/chủ đề con** — một bề mặt nhắn tin bổ sung tùy chọn chỉ được tạo bởi `--thread ...`.
- **Workspace runtime** — vị trí hệ thống tệp (`cwd`, repo checkout, workspace backend) nơi harness chạy. Độc lập với bề mặt chat.

### Liên kết cuộc trò chuyện hiện tại

`/acp spawn <harness> --bind here` ghim cuộc trò chuyện hiện tại vào
phiên ACP đã spawn — không có luồng con, cùng bề mặt chat. OpenClaw tiếp tục
sở hữu transport, auth, an toàn và phân phối. Các tin nhắn theo dõi trong
cuộc trò chuyện đó định tuyến đến cùng phiên; `/new` và `/reset` đặt lại
phiên tại chỗ; `/acp close` xóa liên kết.

Ví dụ:

```text
/codex bind                                              # liên kết Codex gốc, định tuyến các tin nhắn tương lai tại đây
/codex model gpt-5.4                                     # tinh chỉnh luồng Codex gốc đã liên kết
/codex stop                                              # điều khiển lượt Codex gốc đang hoạt động
/acp spawn codex --bind here                             # dự phòng ACP rõ ràng cho Codex
/acp spawn codex --thread auto                           # có thể tạo luồng/chủ đề con và liên kết tại đó
/acp spawn codex --bind here --cwd /workspace/repo       # cùng liên kết chat, Codex chạy trong /workspace/repo
```

<AccordionGroup>
  <Accordion title="Quy tắc liên kết và tính loại trừ">
    - `--bind here` và `--thread ...` loại trừ lẫn nhau.
    - `--bind here` chỉ hoạt động trên các kênh quảng bá khả năng liên kết cuộc trò chuyện hiện tại; nếu không OpenClaw trả về thông báo không được hỗ trợ rõ ràng. Các liên kết vẫn tồn tại qua các lần khởi động lại Gateway.
    - Trên Discord, `spawnSessions` kiểm soát việc tạo luồng con cho `--thread auto|here` — không phải `--bind here`.
    - Nếu bạn spawn đến một agent ACP khác mà không có `--cwd`, OpenClaw mặc định kế thừa workspace của **agent đích**. Các đường dẫn kế thừa bị thiếu (`ENOENT`/`ENOTDIR`) rơi về mặc định của backend; các lỗi truy cập khác (ví dụ `EACCES`) hiển thị dưới dạng lỗi spawn.
    - Các lệnh quản lý Gateway vẫn ở cục bộ trong các cuộc trò chuyện được liên kết — các lệnh `/acp ...` được OpenClaw xử lý ngay cả khi văn bản theo dõi thông thường định tuyến đến phiên ACP đã liên kết; `/status` và `/unfocus` cũng vẫn ở cục bộ bất cứ khi nào việc xử lý lệnh được bật cho bề mặt đó.

  </Accordion>
  <Accordion title="Phiên được liên kết với luồng">
    Khi các liên kết luồng được bật cho một adapter kênh:

    - OpenClaw liên kết một luồng với phiên ACP đích.
    - Các tin nhắn theo dõi trong luồng đó định tuyến đến phiên ACP đã liên kết.
    - Đầu ra ACP được gửi lại cùng luồng.
    - Bỏ tập trung/đóng/lưu trữ/hết thời gian chờ nhàn rỗi hoặc hết hạn tuổi tối đa sẽ xóa liên kết.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, và `/unfocus` là các lệnh Gateway, không phải prompt gửi đến harness ACP.

    Các cờ tính năng bắt buộc cho ACP được liên kết với luồng:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` được bật theo mặc định (đặt `false` để tạm dừng điều phối luồng ACP tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` rõ ràng vẫn hoạt động).
    - Spawn phiên luồng của adapter kênh được bật (mặc định: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Hỗ trợ liên kết luồng phụ thuộc vào từng adapter. Nếu adapter kênh
    đang hoạt động không hỗ trợ liên kết luồng, OpenClaw trả về thông báo
    không được hỗ trợ/không khả dụng rõ ràng.

  </Accordion>
  <Accordion title="Các kênh hỗ trợ luồng">
    - Bất kỳ adapter kênh nào bộc lộ khả năng liên kết phiên/luồng.
    - Hỗ trợ tích hợp hiện tại: luồng/kênh **Discord**, chủ đề **Telegram** (chủ đề diễn đàn trong nhóm/siêu nhóm và chủ đề DM).
    - Các kênh Plugin có thể thêm hỗ trợ thông qua cùng giao diện liên kết.

  </Accordion>
</AccordionGroup>

## Liên kết kênh bền vững

Đối với các quy trình làm việc không tạm thời, hãy cấu hình liên kết ACP bền vững trong
các mục `bindings[]` cấp cao nhất.

### Mô hình liên kết

<ParamField path="bindings[].type" type='"acp"'>
  Đánh dấu một liên kết cuộc trò chuyện ACP bền vững.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Xác định cuộc trò chuyện đích. Các dạng theo từng kênh:

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
- Tin nhắn trong kênh hoặc chủ đề đó định tuyến đến phiên ACP đã cấu hình.
- Trong các cuộc trò chuyện được liên kết, `/new` và `/reset` đặt lại cùng khóa phiên ACP tại chỗ.
- Các liên kết runtime tạm thời (ví dụ được tạo bởi luồng tập trung theo luồng) vẫn áp dụng khi có mặt.
- Đối với các lần spawn ACP liên agent không có `cwd` rõ ràng, OpenClaw kế thừa workspace agent đích từ cấu hình agent.
- Các đường dẫn workspace kế thừa bị thiếu rơi về cwd mặc định của backend; các lỗi truy cập không do thiếu đường dẫn sẽ hiển thị dưới dạng lỗi spawn.

## Bắt đầu phiên ACP

Có hai cách để bắt đầu một phiên ACP:

<Tabs>
  <Tab title="Từ sessions_spawn">
    Dùng `runtime: "acp"` để bắt đầu một phiên ACP từ một lượt agent hoặc
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
    cho các phiên ACP. Nếu bỏ qua `agentId`, OpenClaw sử dụng
    `acp.defaultAgent` khi đã cấu hình. `mode: "session"` yêu cầu
    `thread: true` để duy trì một cuộc hội thoại liên kết bền vững.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Dùng `/acp spawn` để điều khiển rõ ràng từ phía người vận hành trong chat.

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
  Id bộ chạy đích ACP. Quay về `acp.defaultAgent` nếu đã đặt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Yêu cầu luồng liên kết thread ở nơi được hỗ trợ.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` là một lần; `"session"` là bền vững. Nếu `thread: true` và
  bỏ qua `mode`, OpenClaw có thể mặc định dùng hành vi bền vững theo
  đường dẫn runtime. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc runtime được yêu cầu (được backend/runtime xác thực
  theo chính sách). Nếu bỏ qua, ACP spawn kế thừa không gian làm việc
  của agent đích khi đã cấu hình; các đường dẫn kế thừa bị thiếu sẽ quay
  về mặc định của backend, còn lỗi truy cập thật sẽ được trả về.
</ParamField>
<ParamField path="label" type="string">
  Nhãn hiển thị cho người vận hành được dùng trong văn bản phiên/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tiếp tục một phiên ACP hiện có thay vì tạo phiên mới. Agent phát lại
  lịch sử hội thoại của nó qua `session/load`. Yêu cầu `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` truyền các tóm tắt tiến trình lần chạy ACP ban đầu trở lại
  phiên yêu cầu dưới dạng sự kiện hệ thống. Phản hồi được chấp nhận bao
  gồm `streamLogPath` trỏ đến nhật ký JSONL theo phạm vi phiên
  (`<sessionId>.acp-stream.jsonl`) mà bạn có thể tail để xem toàn bộ
  lịch sử chuyển tiếp.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Hủy lượt ACP con sau N giây. `0` giữ lượt trên đường dẫn không hết
  thời gian của gateway. Cùng một giá trị được áp dụng cho lần chạy
  Gateway và runtime ACP để các bộ chạy bị kẹt/hết hạn ngạch không
  chiếm làn agent cha vô thời hạn.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè mô hình rõ ràng cho phiên ACP con. Các ACP spawn của Codex
  chuẩn hóa ref OpenClaw Codex như `openai-codex/gpt-5.4` thành cấu hình
  khởi động Codex ACP trước `session/new`; các dạng slash như
  `openai-codex/gpt-5.4/high` cũng đặt mức nỗ lực lập luận của Codex ACP.
  Các bộ chạy khác phải quảng bá ACP `models` và hỗ trợ
  `session/set_model`; nếu không, OpenClaw/acpx sẽ lỗi rõ ràng thay vì
  âm thầm quay về mặc định của agent đích.
</ParamField>
<ParamField path="thinking" type="string">
  Nỗ lực suy nghĩ/lập luận rõ ràng. Với Codex ACP, `minimal` ánh xạ đến
  nỗ lực thấp, `low`/`medium`/`high`/`xhigh` ánh xạ trực tiếp, và `off`
  bỏ qua ghi đè khởi động về nỗ lực lập luận.
</ParamField>

## Chế độ liên kết spawn và thread

<Tabs>
  <Tab title="--bind here|off">
    | Chế độ | Hành vi                                                                |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Liên kết cuộc hội thoại đang hoạt động hiện tại tại chỗ; lỗi nếu không có cuộc hội thoại nào đang hoạt động. |
    | `off`  | Không tạo liên kết cuộc hội thoại hiện tại.                            |

    Ghi chú:

    - `--bind here` là đường dẫn đơn giản nhất cho người vận hành khi muốn "làm cho kênh hoặc chat này được Codex hỗ trợ."
    - `--bind here` không tạo thread con.
    - `--bind here` chỉ khả dụng trên các kênh cung cấp hỗ trợ liên kết cuộc hội thoại hiện tại.
    - Không thể kết hợp `--bind` và `--thread` trong cùng một lệnh gọi `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Chế độ | Hành vi                                                                                             |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Trong thread đang hoạt động: liên kết thread đó. Bên ngoài thread: tạo/liên kết thread con khi được hỗ trợ. |
    | `here` | Yêu cầu thread đang hoạt động hiện tại; lỗi nếu không ở trong thread.                               |
    | `off`  | Không liên kết. Phiên bắt đầu ở trạng thái không liên kết.                                          |

    Ghi chú:

    - Trên các bề mặt liên kết không phải thread, hành vi mặc định về thực chất là `off`.
    - Spawn gắn với thread yêu cầu chính sách kênh hỗ trợ:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Dùng `--bind here` khi bạn muốn ghim cuộc hội thoại hiện tại mà không tạo thread con.

  </Tab>
</Tabs>

## Mô hình phân phối

Các phiên ACP có thể là không gian làm việc tương tác hoặc công việc nền
do cha sở hữu. Đường dẫn phân phối phụ thuộc vào hình dạng đó.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Các phiên tương tác được dùng để tiếp tục trò chuyện trên một bề mặt
    chat hiển thị:

    - `/acp spawn ... --bind here` liên kết cuộc hội thoại hiện tại với phiên ACP.
    - `/acp spawn ... --thread ...` liên kết thread/chủ đề của kênh với phiên ACP.
    - `bindings[].type="acp"` bền vững đã cấu hình định tuyến các cuộc hội thoại khớp đến cùng phiên ACP.

    Tin nhắn tiếp theo trong cuộc hội thoại đã liên kết được định tuyến
    trực tiếp đến phiên ACP, và đầu ra ACP được gửi trở lại cùng
    kênh/thread/chủ đề đó.

    Những gì OpenClaw gửi đến bộ chạy:

    - Các lượt tiếp theo đã liên kết thông thường được gửi dưới dạng văn bản prompt, cộng với tệp đính kèm chỉ khi bộ chạy/backend hỗ trợ.
    - Các lệnh quản lý `/acp` và lệnh Gateway cục bộ được chặn trước khi điều phối ACP.
    - Sự kiện hoàn tất do runtime tạo được hiện thực hóa theo từng đích. Agent OpenClaw nhận phong bì runtime-context nội bộ của OpenClaw; bộ chạy ACP bên ngoài nhận prompt thuần với kết quả con và chỉ dẫn. Phong bì thô `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` tuyệt đối không được gửi đến bộ chạy bên ngoài hoặc lưu bền vững dưới dạng văn bản transcript người dùng ACP.
    - Các mục transcript ACP dùng văn bản kích hoạt hiển thị cho người dùng hoặc prompt hoàn tất thuần. Siêu dữ liệu sự kiện nội bộ vẫn có cấu trúc trong OpenClaw khi có thể và không được xử lý như nội dung chat do người dùng viết.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Các phiên ACP một lần được spawn bởi một lần chạy agent khác là các
    con chạy nền, tương tự sub-agent:

    - Cha yêu cầu công việc bằng `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Con chạy trong phiên bộ chạy ACP riêng của nó.
    - Các lượt con chạy trên cùng làn nền được dùng bởi spawn sub-agent gốc, vì vậy một bộ chạy ACP chậm không chặn công việc phiên chính không liên quan.
    - Báo cáo hoàn tất quay lại qua đường dẫn thông báo hoàn tất tác vụ. OpenClaw chuyển đổi siêu dữ liệu hoàn tất nội bộ thành prompt ACP thuần trước khi gửi đến bộ chạy bên ngoài, vì vậy bộ chạy không thấy các marker ngữ cảnh runtime chỉ dành cho OpenClaw.
    - Cha viết lại kết quả con bằng giọng trợ lý thông thường khi cần phản hồi hiển thị cho người dùng.

    **Không** xử lý đường dẫn này như một cuộc chat ngang hàng giữa cha
    và con. Con đã có kênh hoàn tất quay lại cha.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` có thể nhắm đến một phiên khác sau khi spawn. Với
    các phiên ngang hàng thông thường, OpenClaw dùng đường dẫn tiếp theo
    agent-to-agent (A2A) sau khi chèn tin nhắn:

    - Chờ phản hồi của phiên đích.
    - Tùy chọn cho phép phiên yêu cầu và phiên đích trao đổi một số lượt tiếp theo có giới hạn.
    - Yêu cầu đích tạo một thông báo announce.
    - Gửi announce đó đến kênh hoặc thread hiển thị.

    Đường dẫn A2A đó là phương án dự phòng cho các lượt gửi ngang hàng
    khi bên gửi cần một lượt tiếp theo hiển thị. Nó vẫn được bật khi một
    phiên không liên quan có thể thấy và nhắn tin đến một đích ACP, ví dụ
    dưới các thiết lập `tools.sessions.visibility` rộng.

    OpenClaw chỉ bỏ qua lượt tiếp theo A2A khi bên yêu cầu là cha của
    chính con ACP một lần do cha sở hữu. Trong trường hợp đó, chạy A2A
    bên trên hoàn tất tác vụ có thể đánh thức cha bằng kết quả của con,
    chuyển tiếp phản hồi của cha trở lại con, và tạo vòng lặp vọng
    cha/con. Kết quả `sessions_send` báo cáo `delivery.status="skipped"`
    cho trường hợp con được sở hữu đó vì đường dẫn hoàn tất đã chịu trách
    nhiệm về kết quả.

  </Accordion>
  <Accordion title="Resume an existing session">
    Dùng `resumeSessionId` để tiếp tục một phiên ACP trước đó thay vì
    bắt đầu mới. Agent phát lại lịch sử hội thoại của nó qua
    `session/load`, nên nó tiếp tục với đầy đủ ngữ cảnh của những gì đã
    xảy ra trước đó.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Các trường hợp sử dụng phổ biến:

    - Chuyển giao một phiên Codex từ laptop sang điện thoại của bạn — bảo agent tiếp tục từ chỗ bạn dừng lại.
    - Tiếp tục một phiên lập trình bạn đã bắt đầu tương tác trong CLI, giờ chạy không giao diện qua agent của bạn.
    - Tiếp tục công việc bị gián đoạn bởi gateway khởi động lại hoặc hết thời gian chờ do nhàn rỗi.

    Ghi chú:

    - `resumeSessionId` chỉ áp dụng khi `runtime: "acp"`; runtime sub-agent mặc định bỏ qua trường chỉ dành cho ACP này.
    - `streamTo` chỉ áp dụng khi `runtime: "acp"`; runtime sub-agent mặc định bỏ qua trường chỉ dành cho ACP này.
    - `resumeSessionId` là id tiếp tục ACP/bộ chạy cục bộ trên host, không phải khóa phiên kênh OpenClaw; OpenClaw vẫn kiểm tra chính sách spawn ACP và chính sách agent đích trước khi điều phối, còn backend ACP hoặc bộ chạy sở hữu việc cấp quyền để tải id upstream đó.
    - `resumeSessionId` khôi phục lịch sử hội thoại ACP upstream; `thread` và `mode` vẫn áp dụng bình thường cho phiên OpenClaw mới bạn đang tạo, vì vậy `mode: "session"` vẫn yêu cầu `thread: true`.
    - Agent đích phải hỗ trợ `session/load` (Codex và Claude Code có hỗ trợ).
    - Nếu không tìm thấy id phiên, spawn sẽ lỗi với thông báo rõ ràng — không âm thầm quay về một phiên mới.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Sau khi triển khai gateway, hãy chạy kiểm tra end-to-end trực tiếp
    thay vì tin vào unit test:

    1. Xác minh phiên bản gateway đã triển khai và commit trên host đích.
    2. Mở một phiên cầu nối ACPX tạm thời đến một agent trực tiếp.
    3. Yêu cầu agent đó gọi `sessions_spawn` với `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, và tác vụ `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Xác minh `accepted=yes`, một `childSessionKey` thật, và không có lỗi validator.
    5. Dọn dẹp phiên cầu nối tạm thời.

    Giữ cổng kiểm tra ở `mode: "run"` và bỏ qua `streamTo: "parent"` —
    `mode: "session"` gắn với thread và các đường dẫn stream-relay là các
    lượt kiểm thử tích hợp phong phú riêng biệt.

  </Accordion>
</AccordionGroup>

## Khả năng tương thích sandbox

Các phiên ACP hiện chạy trên runtime của host, **không** ở trong
sandbox OpenClaw.

<Warning>
**Ranh giới bảo mật:**

- Bộ thực thi bên ngoài có thể đọc/ghi theo quyền CLI riêng của nó và `cwd` đã chọn.
- Chính sách sandbox của OpenClaw **không** bao bọc việc thực thi bộ thực thi ACP.
- OpenClaw vẫn thực thi các cổng tính năng ACP, tác tử được phép, quyền sở hữu phiên, liên kết kênh và chính sách phân phối của Gateway.
- Dùng `runtime: "subagent"` cho công việc gốc OpenClaw được thực thi sandbox.

</Warning>

Các hạn chế hiện tại:

- Nếu phiên yêu cầu đang bị sandbox, việc sinh ACP bị chặn cho cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
- `sessions_spawn` với `runtime: "acp"` không hỗ trợ `sandbox: "require"`.

## Phân giải đích phiên

Hầu hết hành động `/acp` chấp nhận một đích phiên tùy chọn (`session-key`,
`session-id`, hoặc `session-label`).

**Thứ tự phân giải:**

1. Đối số đích tường minh (hoặc `--session` cho `/acp steer`)
   - thử khóa
   - sau đó là id phiên có dạng UUID
   - sau đó là nhãn
2. Liên kết luồng hiện tại (nếu cuộc trò chuyện/luồng này được liên kết với một phiên ACP).
3. Phương án dự phòng là phiên yêu cầu hiện tại.

Liên kết cuộc trò chuyện hiện tại và liên kết luồng đều tham gia vào
bước 2.

Nếu không phân giải được đích nào, OpenClaw trả về lỗi rõ ràng
(`Unable to resolve session target: ...`).

## Điều khiển ACP

| Lệnh                 | Chức năng                                                  | Ví dụ                                                         |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tạo phiên ACP; tùy chọn liên kết hiện tại hoặc liên kết luồng. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hủy lượt đang chạy cho phiên đích.                         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Gửi chỉ dẫn điều hướng tới phiên đang chạy.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Đóng phiên và hủy liên kết các đích luồng.                 | `/acp close`                                                  |
| `/acp status`        | Hiển thị phần phụ trợ, chế độ, trạng thái, tùy chọn thời gian chạy, khả năng. | `/acp status`                                                 |
| `/acp set-mode`      | Đặt chế độ thời gian chạy cho phiên đích.                  | `/acp set-mode plan`                                          |
| `/acp set`           | Ghi tùy chọn cấu hình thời gian chạy chung.                | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Đặt ghi đè thư mục làm việc thời gian chạy.                | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Đặt hồ sơ chính sách phê duyệt.                            | `/acp permissions strict`                                     |
| `/acp timeout`       | Đặt thời gian chờ thời gian chạy (giây).                   | `/acp timeout 120`                                            |
| `/acp model`         | Đặt ghi đè mô hình thời gian chạy.                         | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Xóa các ghi đè tùy chọn thời gian chạy của phiên.          | `/acp reset-options`                                          |
| `/acp sessions`      | Liệt kê các phiên ACP gần đây từ kho lưu trữ.              | `/acp sessions`                                               |
| `/acp doctor`        | Sức khỏe phần phụ trợ, khả năng, bản sửa có thể thực hiện. | `/acp doctor`                                                 |
| `/acp install`       | In các bước cài đặt và bật mang tính xác định.             | `/acp install`                                                |

`/acp status` hiển thị các tùy chọn thời gian chạy hiệu lực cùng với mã định danh phiên cấp thời gian chạy và cấp phần phụ trợ. Lỗi điều khiển không được hỗ trợ sẽ hiển thị rõ ràng khi phần phụ trợ thiếu một khả năng. `/acp sessions` đọc kho lưu trữ cho phiên đang liên kết hoặc phiên yêu cầu hiện tại; token đích (`session-key`, `session-id`, hoặc `session-label`) được phân giải thông qua khám phá phiên gateway, bao gồm cả gốc `session.store` tùy chỉnh theo từng tác tử.

### Ánh xạ tùy chọn thời gian chạy

`/acp` có các lệnh tiện ích và một bộ đặt giá trị chung. Các thao tác tương đương:

| Lệnh                         | Ánh xạ tới                            | Ghi chú                                                                                                                                                                        |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | khóa cấu hình thời gian chạy `model`  | Với Codex ACP, OpenClaw chuẩn hóa `openai-codex/<model>` thành id mô hình của bộ chuyển đổi và ánh xạ các hậu tố suy luận dạng gạch chéo như `openai-codex/gpt-5.4/high` thành `reasoning_effort`. |
| `/acp set thinking <level>`  | khóa cấu hình thời gian chạy `thinking` | Với Codex ACP, OpenClaw gửi `reasoning_effort` tương ứng khi bộ chuyển đổi hỗ trợ.                                                                                            |
| `/acp permissions <profile>` | khóa cấu hình thời gian chạy `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | khóa cấu hình thời gian chạy `timeout` | —                                                                                                                                                                              |
| `/acp cwd <path>`            | ghi đè cwd thời gian chạy             | Cập nhật trực tiếp.                                                                                                                                                           |
| `/acp set <key> <value>`     | chung                                 | `key=cwd` dùng đường dẫn ghi đè cwd.                                                                                                                                          |
| `/acp reset-options`         | xóa tất cả ghi đè thời gian chạy      | —                                                                                                                                                                              |

## Bộ thực thi acpx, thiết lập Plugin và quyền

Để cấu hình bộ thực thi acpx (bí danh Claude Code / Codex / Gemini CLI), các cầu nối MCP plugin-tools và OpenClaw-tools, cũng như các chế độ quyền ACP, xem
[Tác tử ACP — thiết lập](/vi/tools/acp-agents-setup).

## Khắc phục sự cố

| Triệu chứng                                                                 | Nguyên nhân có khả năng                                                                                                         | Cách khắc phục                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ACP runtime backend is not configured`                                     | Thiếu Plugin backend, bị tắt, hoặc bị chặn bởi `plugins.allow`.                                                                 | Cài đặt và bật Plugin backend, thêm `acpx` vào `plugins.allow` khi danh sách cho phép đó được đặt, rồi chạy `/acp doctor`.                                                         |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP bị tắt trên toàn hệ thống.                                                                                                  | Đặt `acp.enabled=true`.                                                                                                                                                            |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Tính năng điều phối tự động từ tin nhắn luồng thông thường bị tắt.                                                              | Đặt `acp.dispatch.enabled=true` để tiếp tục định tuyến luồng tự động; các lệnh gọi rõ ràng `sessions_spawn({ runtime: "acp" })` vẫn hoạt động.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Tác nhân không nằm trong danh sách cho phép.                                                                                    | Dùng `agentId` được cho phép hoặc cập nhật `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` reports backend not ready right after startup                 | Thiếu Plugin backend, bị tắt, bị chặn bởi chính sách cho phép/từ chối, hoặc tệp thực thi đã cấu hình của nó không khả dụng.     | Cài đặt/bật Plugin backend, chạy lại `/acp doctor`, và kiểm tra lỗi cài đặt backend hoặc lỗi chính sách nếu trạng thái vẫn không lành mạnh.                                         |
| Harness command not found                                                   | CLI adapter chưa được cài đặt, thiếu Plugin bên ngoài, hoặc lần tải `npx` đầu tiên thất bại đối với adapter không phải Codex.   | Chạy `/acp doctor`, cài đặt/làm nóng adapter trên máy chủ Gateway, hoặc cấu hình rõ ràng lệnh tác nhân acpx.                                                                        |
| Model-not-found from the harness                                            | ID mô hình hợp lệ với nhà cung cấp/harness khác nhưng không hợp lệ với mục tiêu ACP này.                                        | Dùng một mô hình được harness đó liệt kê, cấu hình mô hình trong harness, hoặc bỏ qua phần ghi đè.                                                                                  |
| Vendor auth error from the harness                                          | OpenClaw lành mạnh, nhưng CLI/nhà cung cấp mục tiêu chưa đăng nhập.                                                             | Đăng nhập hoặc cung cấp khóa nhà cung cấp bắt buộc trong môi trường máy chủ Gateway.                                                                                                |
| `Unable to resolve session target: ...`                                     | Token khóa/ID/nhãn không hợp lệ.                                                                                                | Chạy `/acp sessions`, sao chép đúng khóa/nhãn, rồi thử lại.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` được dùng khi không có cuộc hội thoại có thể liên kết đang hoạt động.                                             | Chuyển đến kênh/cuộc trò chuyện mục tiêu rồi thử lại, hoặc tạo phiên không liên kết.                                                                                                |
| `Conversation bindings are unavailable for <channel>.`                      | Adapter thiếu khả năng liên kết ACP với cuộc hội thoại hiện tại.                                                                | Dùng `/acp spawn ... --thread ...` khi được hỗ trợ, cấu hình `bindings[]` cấp cao nhất, hoặc chuyển đến một kênh được hỗ trợ.                                                       |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` được dùng ngoài ngữ cảnh luồng.                                                                                 | Chuyển đến luồng mục tiêu hoặc dùng `--thread auto`/`off`.                                                                                                                         |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Người dùng khác sở hữu mục tiêu liên kết đang hoạt động.                                                                        | Liên kết lại với tư cách chủ sở hữu hoặc dùng cuộc hội thoại hoặc luồng khác.                                                                                                      |
| `Thread bindings are unavailable for <channel>.`                            | Adapter thiếu khả năng liên kết luồng.                                                                                          | Dùng `--thread off` hoặc chuyển đến adapter/kênh được hỗ trợ.                                                                                                                       |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP nằm ở phía máy chủ; phiên yêu cầu đang được sandbox.                                                                | Dùng `runtime="subagent"` từ các phiên được sandbox, hoặc chạy lệnh tạo ACP từ một phiên không được sandbox.                                                                        |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` được yêu cầu cho runtime ACP.                                                                               | Dùng `runtime="subagent"` khi bắt buộc sandbox, hoặc dùng ACP với `sandbox="inherit"` từ một phiên không được sandbox.                                                              |
| `Cannot apply --model ... did not advertise model support`                  | Harness mục tiêu không cung cấp tính năng chuyển đổi mô hình ACP chung.                                                         | Dùng harness công bố ACP `models`/`session/set_model`, dùng tham chiếu mô hình ACP của Codex, hoặc cấu hình mô hình trực tiếp trong harness nếu harness có cờ khởi động riêng.      |
| Missing ACP metadata for bound session                                      | Siêu dữ liệu phiên ACP đã cũ/bị xóa.                                                                                            | Tạo lại bằng `/acp spawn`, rồi liên kết lại/tập trung luồng.                                                                                                                        |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` chặn ghi/thực thi trong phiên ACP không tương tác.                                                            | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại Gateway. Xem [Cấu hình quyền](/vi/tools/acp-agents-setup#permission-configuration).            |
| ACP session fails early with little output                                  | Lời nhắc quyền bị chặn bởi `permissionMode`/`nonInteractivePermissions`.                                                       | Kiểm tra nhật ký Gateway để tìm `AcpRuntimeError`. Để có đầy đủ quyền, đặt `permissionMode=approve-all`; để giảm cấp một cách êm thấm, đặt `nonInteractivePermissions=deny`.       |
| ACP session stalls indefinitely after completing work                       | Tiến trình harness đã hoàn tất nhưng phiên ACP không báo cáo hoàn thành.                                                       | Giám sát bằng `ps aux \| grep acpx`; tự dừng các tiến trình cũ theo cách thủ công.                                                                                                  |
| Harness sees `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Phong bì sự kiện nội bộ bị rò rỉ qua ranh giới ACP.                                                                             | Cập nhật OpenClaw và chạy lại luồng hoàn tất; các harness bên ngoài chỉ nên nhận lời nhắc hoàn tất dạng văn bản thuần túy.                                                         |

## Liên quan

- [Tác nhân ACP — thiết lập](/vi/tools/acp-agents-setup)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Backend CLI](/vi/gateway/cli-backends)
- [Harness Codex](/vi/plugins/codex-harness)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (chế độ cầu nối)](/vi/cli/acp)
- [Tác nhân phụ](/vi/tools/subagents)
