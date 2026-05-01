---
read_when:
    - Chạy các bộ khung lập trình thông qua ACP
    - Thiết lập các phiên ACP gắn với cuộc trò chuyện trên các kênh nhắn tin
    - Liên kết cuộc trò chuyện qua kênh nhắn tin với một phiên ACP lâu dài
    - Khắc phục sự cố hệ thống phụ trợ ACP, kết nối Plugin hoặc chuyển giao kết quả hoàn thành
    - Thao tác với các lệnh /acp từ cuộc trò chuyện
sidebarTitle: ACP agents
summary: Chạy các bộ điều phối lập trình bên ngoài (Claude Code, Cursor, Gemini CLI, Codex ACP rõ ràng, OpenClaw ACP, OpenCode) thông qua phần phụ trợ ACP
title: Tác nhân ACP
x-i18n:
    generated_at: "2026-05-01T10:53:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb4164208571799f2d78d324f86c9b2fb72c60489ac2c367256f222495c74dbf
    source_path: tools/acp-agents.md
    workflow: 16
---

[Agent Client Protocol (ACP)](https://agentclientprotocol.com/) cho phép OpenClaw chạy các bộ chạy lập trình bên ngoài (ví dụ: Pi, Claude Code,
Cursor, Copilot, Droid, OpenClaw ACP, OpenCode, Gemini CLI và các bộ chạy
ACPX được hỗ trợ khác) thông qua một Plugin phần phụ trợ ACP.

Mỗi lần sinh phiên ACP được theo dõi như một [tác vụ nền](/vi/automation/tasks).

<Note>
**ACP là đường dẫn bộ chạy bên ngoài, không phải đường dẫn Codex mặc định.** Plugin máy chủ ứng dụng Codex gốc sở hữu các điều khiển `/codex ...` và môi trường chạy nhúng
`agentRuntime.id: "codex"`; ACP sở hữu
các điều khiển `/acp ...` và các phiên `sessions_spawn({ runtime: "acp" })`.

Nếu bạn muốn Codex hoặc Claude Code kết nối như một máy khách MCP bên ngoài
trực tiếp tới các cuộc hội thoại kênh OpenClaw hiện có, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp) thay vì ACP.
</Note>

## Tôi cần trang nào?

| Bạn muốn...                                                                                    | Dùng mục này                              | Ghi chú                                                                                                                                                                                         |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liên kết hoặc điều khiển Codex trong cuộc hội thoại hiện tại                                               | `/codex bind`, `/codex threads`       | Đường dẫn máy chủ ứng dụng Codex gốc khi Plugin `codex` được bật; bao gồm câu trả lời trò chuyện đã liên kết, chuyển tiếp hình ảnh, mô hình/nhanh/quyền, dừng và điều khiển điều hướng. ACP là phương án dự phòng tường minh |
| Chạy Claude Code, Gemini CLI, Codex ACP tường minh hoặc một bộ chạy bên ngoài khác _thông qua_ OpenClaw | Trang này                             | Các phiên gắn với trò chuyện, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tác vụ nền, điều khiển môi trường chạy                                                                                   |
| Cung cấp một phiên OpenClaw Gateway _như_ máy chủ ACP cho trình biên tập hoặc máy khách                   | [`openclaw acp`](/vi/cli/acp)            | Chế độ cầu nối. IDE/máy khách giao tiếp ACP với OpenClaw qua stdio/WebSocket                                                                                                                            |
| Tái sử dụng một CLI AI cục bộ làm mô hình dự phòng chỉ văn bản                                              | [Phần phụ trợ CLI](/vi/gateway/cli-backends) | Không phải ACP. Không có công cụ OpenClaw, không có điều khiển ACP, không có môi trường chạy bộ chạy                                                                                                                               |

## Tính năng này có hoạt động ngay sau khi cài đặt không?

Thường là có. Các bản cài đặt mới đi kèm Plugin môi trường chạy `acpx` tích hợp được bật
theo mặc định, với tệp nhị phân `acpx` được ghim cục bộ theo Plugin mà OpenClaw thăm dò
và tự sửa ngay sau khi trình nghe HTTP của Gateway hoạt động. Chạy
`/acp doctor` để kiểm tra tính sẵn sàng.

OpenClaw chỉ hướng dẫn tác tử về việc sinh phiên ACP khi ACP **thực sự
khả dụng**: ACP phải được bật, điều phối không được tắt, phiên hiện tại
không bị môi trường cô lập chặn và một phần phụ trợ môi trường chạy phải được
tải. Nếu các điều kiện đó không được đáp ứng, Skills của Plugin ACP và
hướng dẫn ACP cho `sessions_spawn` vẫn bị ẩn để tác tử không gợi ý
một phần phụ trợ không khả dụng.

<AccordionGroup>
  <Accordion title="Các điểm cần chú ý trong lần chạy đầu tiên">
    - Nếu `plugins.allow` được đặt, đó là một danh mục Plugin giới hạn và **phải** bao gồm `acpx`; nếu không, mặc định tích hợp sẽ bị chặn có chủ ý và `/acp doctor` báo cáo mục danh sách cho phép bị thiếu.
    - Bộ điều hợp Codex ACP tích hợp được bố trí cùng Plugin `acpx` và được khởi chạy cục bộ khi có thể.
    - Các bộ điều hợp bộ chạy mục tiêu khác vẫn có thể được tải theo yêu cầu bằng `npx` trong lần đầu bạn sử dụng chúng.
    - Xác thực của nhà cung cấp vẫn phải tồn tại trên máy chủ cho bộ chạy đó.
    - Nếu máy chủ không có npm hoặc quyền truy cập mạng, các lần tải bộ điều hợp trong lần chạy đầu sẽ thất bại cho đến khi bộ nhớ đệm được làm nóng sẵn hoặc bộ điều hợp được cài đặt theo cách khác.

  </Accordion>
  <Accordion title="Điều kiện tiên quyết về môi trường chạy">
    ACP khởi chạy một tiến trình bộ chạy bên ngoài thực sự. OpenClaw sở hữu định tuyến,
    trạng thái tác vụ nền, phân phối, liên kết và chính sách; bộ chạy
    sở hữu đăng nhập nhà cung cấp, danh mục mô hình, hành vi hệ thống tệp và
    công cụ gốc của nó.

    Trước khi cho rằng lỗi thuộc về OpenClaw, hãy kiểm tra:

    - `/acp doctor` báo cáo một phần phụ trợ đã bật và hoạt động tốt.
    - ID mục tiêu được `acp.allowedAgents` cho phép khi danh sách cho phép đó được đặt.
    - Lệnh bộ chạy có thể khởi động trên máy chủ Gateway.
    - Xác thực nhà cung cấp có sẵn cho bộ chạy đó (`claude`, `codex`, `gemini`, `opencode`, `droid`, v.v.).
    - Mô hình đã chọn tồn tại cho bộ chạy đó — ID mô hình không dùng chung giữa các bộ chạy.
    - `cwd` được yêu cầu tồn tại và có thể truy cập, hoặc bỏ qua `cwd` và để phần phụ trợ dùng mặc định của nó.
    - Chế độ quyền phù hợp với công việc. Các phiên phi tương tác không thể bấm lời nhắc quyền gốc, nên các lượt chạy lập trình nặng về ghi/thực thi thường cần một hồ sơ quyền ACPX có thể tiếp tục mà không cần giao diện.

  </Accordion>
</AccordionGroup>

Công cụ Plugin OpenClaw và công cụ OpenClaw tích hợp **không** được cung cấp cho
các bộ chạy ACP theo mặc định. Chỉ bật các cầu nối MCP tường minh trong
[tác tử ACP — thiết lập](/vi/tools/acp-agents-setup) khi bộ chạy
cần gọi trực tiếp các công cụ đó.

## Các mục tiêu bộ chạy được hỗ trợ

Với phần phụ trợ `acpx` tích hợp, dùng các ID bộ chạy này làm mục tiêu `/acp spawn <id>`
hoặc `sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID bộ chạy | Phần phụ trợ điển hình                                | Ghi chú                                                                               |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `claude`   | Bộ điều hợp ACP Claude Code                        | Yêu cầu xác thực Claude Code trên máy chủ.                                              |
| `codex`    | Bộ điều hợp ACP Codex                              | Chỉ là phương án dự phòng ACP tường minh khi `/codex` gốc không khả dụng hoặc khi ACP được yêu cầu. |
| `copilot`  | Bộ điều hợp ACP GitHub Copilot                     | Yêu cầu xác thực CLI/môi trường chạy Copilot.                                                  |
| `cursor`   | ACP Cursor CLI (`cursor-agent acp`)            | Ghi đè lệnh acpx nếu bản cài đặt cục bộ cung cấp điểm vào ACP khác.    |
| `droid`    | Factory Droid CLI                              | Yêu cầu xác thực Factory/Droid hoặc `FACTORY_API_KEY` trong môi trường bộ chạy.        |
| `gemini`   | Bộ điều hợp ACP Gemini CLI                         | Yêu cầu xác thực Gemini CLI hoặc thiết lập khóa API.                                          |
| `iflow`    | iFlow CLI                                      | Tính khả dụng của bộ điều hợp và điều khiển mô hình phụ thuộc vào CLI đã cài đặt.                 |
| `kilocode` | Kilo Code CLI                                  | Tính khả dụng của bộ điều hợp và điều khiển mô hình phụ thuộc vào CLI đã cài đặt.                 |
| `kimi`     | Kimi/Moonshot CLI                              | Yêu cầu xác thực Kimi/Moonshot trên máy chủ.                                            |
| `kiro`     | Kiro CLI                                       | Tính khả dụng của bộ điều hợp và điều khiển mô hình phụ thuộc vào CLI đã cài đặt.                 |
| `opencode` | Bộ điều hợp ACP OpenCode                           | Yêu cầu xác thực CLI/nhà cung cấp OpenCode.                                                |
| `openclaw` | Cầu nối OpenClaw Gateway thông qua `openclaw acp` | Cho phép một bộ chạy nhận biết ACP giao tiếp ngược lại với một phiên OpenClaw Gateway.                 |
| `pi`       | Môi trường chạy OpenClaw nhúng/Pi                   | Dùng cho các thử nghiệm bộ chạy gốc OpenClaw.                                       |
| `qwen`     | Qwen Code / Qwen CLI                           | Yêu cầu xác thực tương thích Qwen trên máy chủ.                                          |

Có thể cấu hình bí danh tác tử acpx tùy chỉnh trong chính acpx, nhưng chính sách OpenClaw
vẫn kiểm tra `acp.allowedAgents` và mọi ánh xạ
`agents.list[].runtime.acp.agent` trước khi điều phối.

## Sổ tay vận hành

Luồng `/acp` nhanh từ cuộc trò chuyện:

<Steps>
  <Step title="Sinh phiên">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto`, hoặc tường minh
    `/acp spawn codex --bind here`.
  </Step>
  <Step title="Làm việc">
    Tiếp tục trong cuộc hội thoại hoặc luồng đã liên kết (hoặc nhắm đích khóa phiên một cách tường minh).
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
    - Thao tác sinh phiên tạo hoặc tiếp tục một phiên môi trường chạy ACP, ghi siêu dữ liệu ACP vào kho phiên OpenClaw và có thể tạo một tác vụ nền khi lượt chạy do cha sở hữu.
    - Các phiên ACP do cha sở hữu được xem là công việc nền ngay cả khi phiên môi trường chạy là lâu dài; việc hoàn tất và phân phối xuyên bề mặt đi qua bộ thông báo tác vụ cha thay vì hoạt động như một phiên trò chuyện hướng người dùng thông thường.
    - Bảo trì tác vụ đóng các phiên ACP một lần do cha sở hữu đã kết thúc hoặc bị mồ côi. Các phiên ACP lâu dài được giữ lại khi vẫn còn liên kết cuộc hội thoại đang hoạt động; các phiên lâu dài cũ không có liên kết đang hoạt động sẽ bị đóng để chúng không thể được tiếp tục âm thầm sau khi tác vụ sở hữu đã xong hoặc bản ghi tác vụ của nó đã biến mất.
    - Tin nhắn theo sau trong liên kết đi trực tiếp tới phiên ACP cho đến khi liên kết được đóng, bỏ tập trung, đặt lại hoặc hết hạn.
    - Lệnh Gateway vẫn ở cục bộ. `/acp ...`, `/status` và `/unfocus` không bao giờ được gửi như văn bản lời nhắc thông thường tới một bộ chạy ACP đã liên kết.
    - `cancel` hủy lượt đang hoạt động khi phần phụ trợ hỗ trợ hủy; nó không xóa liên kết hoặc siêu dữ liệu phiên.
    - `close` kết thúc phiên ACP theo góc nhìn của OpenClaw và xóa liên kết. Một bộ chạy vẫn có thể giữ lịch sử phía nguồn của riêng nó nếu nó hỗ trợ tiếp tục.
    - Các trình xử lý môi trường chạy đang nhàn rỗi đủ điều kiện được dọn dẹp sau `acp.runtime.ttlMinutes`; siêu dữ liệu phiên đã lưu vẫn khả dụng cho `/acp sessions`.

  </Accordion>
  <Accordion title="Quy tắc định tuyến Codex gốc">
    Các kích hoạt bằng ngôn ngữ tự nhiên nên định tuyến đến **Plugin Codex
    gốc** khi nó được bật:

    - "Liên kết kênh Discord này với Codex."
    - "Gắn cuộc trò chuyện này vào luồng Codex `<id>`."
    - "Hiển thị các luồng Codex, rồi liên kết luồng này."

    Liên kết cuộc hội thoại Codex gốc là đường dẫn điều khiển trò chuyện mặc định.
    Các công cụ động của OpenClaw vẫn thực thi thông qua OpenClaw, trong khi
    các công cụ gốc của Codex như shell/apply-patch thực thi bên trong Codex.
    Đối với sự kiện công cụ gốc của Codex, OpenClaw chèn một bộ chuyển tiếp
    điểm nối gốc theo từng lượt để các điểm nối Plugin có thể chặn `before_tool_call`, quan sát
    `after_tool_call` và định tuyến sự kiện `PermissionRequest` của Codex
    qua phê duyệt OpenClaw. Các điểm nối `Stop` của Codex được chuyển tiếp tới
    `before_agent_finalize` của OpenClaw, nơi các Plugin có thể yêu cầu thêm một
    lượt mô hình trước khi Codex hoàn tất câu trả lời. Bộ chuyển tiếp vẫn
    cố ý thận trọng: nó không biến đổi đối số công cụ gốc của Codex
    hoặc viết lại bản ghi luồng Codex. Chỉ dùng ACP tường minh
    khi bạn muốn mô hình môi trường chạy/phiên ACP. Ranh giới hỗ trợ Codex
    nhúng được ghi lại trong
    [hợp đồng hỗ trợ bộ chạy Codex v1](/vi/plugins/codex-harness#v1-support-contract).

  </Accordion>
  <Accordion title="Bảng tham khảo nhanh chọn mô hình / provider / runtime">
    - `openai-codex/*` — tuyến OAuth/gói đăng ký PI Codex.
    - `openai/*` cộng với `agentRuntime.id: "codex"` — runtime nhúng app-server Codex gốc.
    - `/codex ...` — điều khiển cuộc hội thoại Codex gốc.
    - `/acp ...` hoặc `runtime: "acp"` — điều khiển ACP/acpx rõ ràng.

  </Accordion>
  <Accordion title="Trình kích hoạt ngôn ngữ tự nhiên để định tuyến ACP">
    Các trình kích hoạt nên định tuyến đến runtime ACP:

    - "Chạy nội dung này như một phiên Claude Code ACP một lần và tóm tắt kết quả."
    - "Dùng Gemini CLI cho tác vụ này trong một thread, rồi giữ các phần tiếp theo trong cùng thread đó."
    - "Chạy Codex qua ACP trong một thread nền."

    OpenClaw chọn `runtime: "acp"`, phân giải harness `agentId`,
    liên kết với cuộc hội thoại hoặc thread hiện tại khi được hỗ trợ, và
    định tuyến các phần tiếp theo đến phiên đó cho đến khi đóng/hết hạn. Codex chỉ
    đi theo đường dẫn này khi ACP/acpx được nêu rõ hoặc Plugin Codex
    gốc không khả dụng cho thao tác được yêu cầu.

    Với `sessions_spawn`, `runtime: "acp"` chỉ được quảng bá khi ACP
    được bật, bên yêu cầu không bị sandbox, và một backend runtime
    ACP đã được tải. `acp.dispatch.enabled=false` tạm dừng dispatch thread
    ACP tự động nhưng không ẩn hoặc chặn các lệnh gọi
    `sessions_spawn({ runtime: "acp" })` rõ ràng. Nó nhắm đến các id harness ACP như `codex`,
    `claude`, `droid`, `gemini`, hoặc `opencode`. Đừng truyền một id agent cấu hình
    OpenClaw thông thường từ `agents_list` trừ khi mục đó được
    cấu hình rõ ràng với `agents.list[].runtime.type="acp"`;
    nếu không, hãy dùng runtime sub-agent mặc định. Khi một agent OpenClaw
    được cấu hình với `runtime.type="acp"`, OpenClaw dùng
    `runtime.acp.agent` làm id harness bên dưới.

  </Accordion>
</AccordionGroup>

## ACP so với sub-agent

Dùng ACP khi bạn muốn một runtime harness bên ngoài. Dùng **app-server Codex
gốc** để liên kết/điều khiển cuộc hội thoại Codex khi Plugin `codex`
được bật. Dùng **sub-agent** khi bạn muốn các lần chạy ủy quyền
gốc của OpenClaw.

| Khu vực        | Phiên ACP                              | Lần chạy sub-agent                 |
| -------------- | ------------------------------------- | ---------------------------------- |
| Runtime        | Plugin backend ACP (ví dụ acpx)       | Runtime sub-agent gốc của OpenClaw |
| Khóa phiên     | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Lệnh chính     | `/acp ...`                            | `/subagents ...`                   |
| Công cụ spawn  | `sessions_spawn` với `runtime:"acp"`  | `sessions_spawn` (runtime mặc định) |

Xem thêm [Sub-agent](/vi/tools/subagents).

## Cách ACP chạy Claude Code

Với Claude Code qua ACP, stack là:

1. Mặt phẳng điều khiển phiên ACP của OpenClaw.
2. Plugin runtime `acpx` đi kèm.
3. Adapter ACP của Claude.
4. Cơ chế runtime/phiên phía Claude.

ACP Claude là một **phiên harness** với các điều khiển ACP, tiếp tục phiên,
theo dõi tác vụ nền, và tùy chọn liên kết cuộc hội thoại/thread.

Các backend CLI là các runtime dự phòng cục bộ chỉ văn bản riêng biệt — xem
[Backend CLI](/vi/gateway/cli-backends).

Với operator, quy tắc thực tế là:

- **Muốn `/acp spawn`, phiên có thể liên kết, điều khiển runtime, hoặc công việc harness bền vững?** Dùng ACP.
- **Muốn dự phòng văn bản cục bộ đơn giản qua CLI thô?** Dùng backend CLI.

## Phiên đã liên kết

### Mô hình tư duy

- **Bề mặt chat** — nơi mọi người tiếp tục trò chuyện (kênh Discord, chủ đề Telegram, cuộc trò chuyện iMessage).
- **Phiên ACP** — trạng thái runtime Codex/Claude/Gemini bền vững mà OpenClaw định tuyến đến.
- **Thread/chủ đề con** — một bề mặt nhắn tin bổ sung tùy chọn chỉ được tạo bởi `--thread ...`.
- **Workspace runtime** — vị trí hệ thống tệp (`cwd`, repo checkout, workspace backend) nơi harness chạy. Độc lập với bề mặt chat.

### Liên kết cuộc hội thoại hiện tại

`/acp spawn <harness> --bind here` ghim cuộc hội thoại hiện tại vào
phiên ACP đã spawn — không có thread con, cùng bề mặt chat. OpenClaw tiếp tục
sở hữu transport, auth, safety, và delivery. Các tin nhắn tiếp theo trong
cuộc hội thoại đó định tuyến đến cùng phiên; `/new` và `/reset` đặt lại
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
    - `--bind here` chỉ hoạt động trên các kênh quảng bá khả năng liên kết cuộc hội thoại hiện tại; nếu không, OpenClaw trả về thông báo không được hỗ trợ rõ ràng. Các liên kết vẫn tồn tại sau khi Gateway khởi động lại.
    - Trên Discord, `spawnAcpSessions` chỉ bắt buộc khi OpenClaw cần tạo một thread con cho `--thread auto|here` — không phải cho `--bind here`.
    - Nếu bạn spawn đến một agent ACP khác mà không có `--cwd`, OpenClaw mặc định kế thừa workspace của **agent đích**. Các đường dẫn kế thừa bị thiếu (`ENOENT`/`ENOTDIR`) sẽ quay về mặc định của backend; các lỗi truy cập khác (ví dụ `EACCES`) xuất hiện dưới dạng lỗi spawn.
    - Các lệnh quản lý Gateway vẫn cục bộ trong các cuộc hội thoại đã liên kết — lệnh `/acp ...` được OpenClaw xử lý ngay cả khi văn bản theo dõi thông thường định tuyến đến phiên ACP đã liên kết; `/status` và `/unfocus` cũng vẫn cục bộ bất cứ khi nào việc xử lý lệnh được bật cho bề mặt đó.

  </Accordion>
  <Accordion title="Phiên liên kết với thread">
    Khi liên kết thread được bật cho một adapter kênh:

    - OpenClaw liên kết một thread với một phiên ACP đích.
    - Các tin nhắn tiếp theo trong thread đó định tuyến đến phiên ACP đã liên kết.
    - Đầu ra ACP được gửi lại cùng thread.
    - Unfocus/close/archive/idle-timeout hoặc hết hạn theo max-age sẽ xóa liên kết.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status`, và `/unfocus` là lệnh Gateway, không phải prompt gửi đến harness ACP.

    Các cờ tính năng bắt buộc cho ACP liên kết với thread:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` bật theo mặc định (đặt `false` để tạm dừng dispatch thread ACP tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` rõ ràng vẫn hoạt động).
    - Cờ spawn thread ACP của adapter kênh được bật (theo từng adapter):
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`

    Hỗ trợ liên kết thread phụ thuộc vào từng adapter. Nếu adapter kênh
    đang hoạt động không hỗ trợ liên kết thread, OpenClaw trả về một thông báo
    không được hỗ trợ/không khả dụng rõ ràng.

  </Accordion>
  <Accordion title="Các kênh hỗ trợ thread">
    - Bất kỳ adapter kênh nào phơi bày khả năng liên kết phiên/thread.
    - Hỗ trợ tích hợp hiện tại: thread/kênh **Discord**, chủ đề **Telegram** (chủ đề diễn đàn trong nhóm/supergroup và chủ đề DM).
    - Các kênh Plugin có thể thêm hỗ trợ qua cùng giao diện liên kết.

  </Accordion>
</AccordionGroup>

## Liên kết kênh bền vững

Với workflow không tạm thời, hãy cấu hình các liên kết ACP bền vững trong
các mục cấp cao nhất `bindings[]`.

### Mô hình liên kết

<ParamField path="bindings[].type" type='"acp"'>
  Đánh dấu một liên kết cuộc hội thoại ACP bền vững.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Nhận diện cuộc hội thoại đích. Hình dạng theo từng kênh:

- **Kênh/thread Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
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
  Nhãn tùy chọn dành cho operator.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Thư mục làm việc runtime tùy chọn.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Ghi đè backend tùy chọn.
</ParamField>

### Mặc định runtime theo từng agent

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
- Trong các cuộc hội thoại đã liên kết, `/new` và `/reset` đặt lại cùng khóa phiên ACP tại chỗ.
- Các liên kết runtime tạm thời (ví dụ được tạo bởi luồng thread-focus) vẫn áp dụng ở nơi hiện diện.
- Với các lần spawn ACP qua agent khác mà không có `cwd` rõ ràng, OpenClaw kế thừa workspace agent đích từ cấu hình agent.
- Đường dẫn workspace kế thừa bị thiếu sẽ quay về cwd mặc định của backend; lỗi truy cập không phải do thiếu sẽ xuất hiện dưới dạng lỗi spawn.

## Khởi động phiên ACP

Hai cách để khởi động một phiên ACP:

<Tabs>
  <Tab title="Từ sessions_spawn">
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
    `runtime` mặc định là `subagent`, vì vậy hãy đặt rõ `runtime: "acp"`
    cho các phiên ACP. Nếu bỏ qua `agentId`, OpenClaw sẽ dùng
    `acp.defaultAgent` khi được cấu hình. `mode: "session"` yêu cầu
    `thread: true` để giữ một cuộc trò chuyện ràng buộc lâu dài.
    </Note>

  </Tab>
  <Tab title="From /acp command">
    Dùng `/acp spawn` để điều khiển rõ ràng từ trò chuyện.

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

    Xem [Lệnh Slash](/vi/tools/slash-commands).

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
  Id harness ACP đích. Quay về `acp.defaultAgent` nếu được đặt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Yêu cầu luồng ràng buộc thread ở nơi được hỗ trợ.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` là chạy một lần; `"session"` là lâu dài. Nếu `thread: true` và
  bỏ qua `mode`, OpenClaw có thể mặc định dùng hành vi lâu dài theo
  đường dẫn runtime. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc runtime được yêu cầu (được xác thực bởi chính sách
  backend/runtime). Nếu bỏ qua, ACP spawn kế thừa workspace của agent
  đích khi được cấu hình; các đường dẫn kế thừa bị thiếu sẽ quay về mặc
  định của backend, còn lỗi truy cập thật sẽ được trả về.
</ParamField>
<ParamField path="label" type="string">
  Nhãn dành cho người vận hành dùng trong văn bản phiên/banner.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tiếp tục một phiên ACP hiện có thay vì tạo phiên mới. Agent phát lại
  lịch sử trò chuyện của nó qua `session/load`. Yêu cầu
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` truyền các tóm tắt tiến trình chạy ACP ban đầu trở lại
  phiên yêu cầu dưới dạng sự kiện hệ thống. Phản hồi được chấp nhận bao
  gồm `streamLogPath` trỏ đến nhật ký JSONL theo phạm vi phiên
  (`<sessionId>.acp-stream.jsonl`) mà bạn có thể tail để xem đầy đủ lịch
  sử chuyển tiếp.
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  Hủy lượt ACP con sau N giây. `0` giữ lượt trên đường dẫn không timeout
  của gateway. Cùng giá trị được áp dụng cho lượt chạy Gateway và
  runtime ACP để các harness bị treo/hết quota không chiếm làn agent cha
  vô thời hạn.
</ParamField>
<ParamField path="model" type="string">
  Ghi đè model rõ ràng cho phiên ACP con. Các Codex ACP spawn chuẩn hóa
  ref OpenClaw Codex như `openai-codex/gpt-5.4` thành cấu hình khởi động
  Codex ACP trước `session/new`; các dạng slash như
  `openai-codex/gpt-5.4/high` cũng đặt mức nỗ lực suy luận Codex ACP.
  Các harness khác phải quảng bá ACP `models` và hỗ trợ
  `session/set_model`; nếu không OpenClaw/acpx sẽ thất bại rõ ràng thay
  vì âm thầm quay về mặc định của agent đích.
</ParamField>
<ParamField path="thinking" type="string">
  Mức nỗ lực thinking/suy luận rõ ràng. Với Codex ACP, `minimal` ánh xạ
  sang nỗ lực thấp, `low`/`medium`/`high`/`xhigh` ánh xạ trực tiếp, và
  `off` bỏ qua ghi đè khởi động reasoning-effort.
</ParamField>

## Chế độ ràng buộc spawn và thread

<Tabs>
  <Tab title="--bind here|off">
    | Chế độ | Hành vi                                                               |
    | ------ | ---------------------------------------------------------------------- |
    | `here` | Ràng buộc cuộc trò chuyện đang hoạt động tại chỗ; thất bại nếu không có cuộc trò chuyện nào đang hoạt động. |
    | `off`  | Không tạo ràng buộc cuộc trò chuyện hiện tại.                          |

    Ghi chú:

    - `--bind here` là đường dẫn vận hành đơn giản nhất để "biến kênh hoặc cuộc trò chuyện này thành được Codex hỗ trợ."
    - `--bind here` không tạo thread con.
    - `--bind here` chỉ khả dụng trên các kênh phơi bày hỗ trợ ràng buộc cuộc trò chuyện hiện tại.
    - `--bind` và `--thread` không thể kết hợp trong cùng một lệnh gọi `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Chế độ | Hành vi                                                                                            |
    | ------ | --------------------------------------------------------------------------------------------------- |
    | `auto` | Trong một thread đang hoạt động: ràng buộc thread đó. Ngoài thread: tạo/ràng buộc một thread con khi được hỗ trợ. |
    | `here` | Yêu cầu thread đang hoạt động hiện tại; thất bại nếu không ở trong một thread.                                                  |
    | `off`  | Không ràng buộc. Phiên bắt đầu không bị ràng buộc.                                                                 |

    Ghi chú:

    - Trên các bề mặt ràng buộc không có thread, hành vi mặc định về cơ bản là `off`.
    - Spawn ràng buộc thread yêu cầu hỗ trợ chính sách kênh:
      - Discord: `channels.discord.threadBindings.spawnAcpSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnAcpSessions=true`
    - Dùng `--bind here` khi bạn muốn ghim cuộc trò chuyện hiện tại mà không tạo thread con.

  </Tab>
</Tabs>

## Mô hình phân phối

Phiên ACP có thể là workspace tương tác hoặc công việc nền do cha sở hữu.
Đường dẫn phân phối phụ thuộc vào dạng đó.

<AccordionGroup>
  <Accordion title="Interactive ACP sessions">
    Các phiên tương tác được dùng để tiếp tục trò chuyện trên một bề mặt
    trò chuyện hiển thị:

    - `/acp spawn ... --bind here` ràng buộc cuộc trò chuyện hiện tại với phiên ACP.
    - `/acp spawn ... --thread ...` ràng buộc một thread/chủ đề kênh với phiên ACP.
    - `bindings[].type="acp"` được cấu hình lâu dài định tuyến các cuộc trò chuyện khớp đến cùng phiên ACP.

    Các tin nhắn tiếp theo trong cuộc trò chuyện đã ràng buộc được định
    tuyến trực tiếp đến phiên ACP, và đầu ra ACP được gửi trở lại cùng
    kênh/thread/chủ đề đó.

    OpenClaw gửi gì đến harness:

    - Các follow-up đã ràng buộc thông thường được gửi dưới dạng văn bản prompt, kèm tệp đính kèm chỉ khi harness/backend hỗ trợ.
    - Các lệnh quản lý `/acp` và lệnh Gateway cục bộ được chặn trước khi gửi đến ACP.
    - Sự kiện hoàn tất do runtime tạo được hiện thực hóa theo từng đích. Agent OpenClaw nhận phong bì runtime-context nội bộ của OpenClaw; các harness ACP bên ngoài nhận một prompt thuần với kết quả con và chỉ dẫn. Phong bì thô `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` không bao giờ được gửi đến harness bên ngoài hoặc lưu bền dưới dạng văn bản transcript người dùng ACP.
    - Các mục transcript ACP dùng văn bản kích hoạt hiển thị với người dùng hoặc prompt hoàn tất thuần. Metadata sự kiện nội bộ được giữ có cấu trúc trong OpenClaw khi có thể và không được xem là nội dung trò chuyện do người dùng viết.

  </Accordion>
  <Accordion title="Parent-owned one-shot ACP sessions">
    Các phiên ACP một lần do một lượt chạy agent khác spawn là các con
    chạy nền, tương tự sub-agent:

    - Agent cha yêu cầu công việc bằng `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Con chạy trong phiên harness ACP riêng của nó.
    - Các lượt con chạy trên cùng làn nền được dùng bởi các spawn sub-agent native, vì vậy một harness ACP chậm không chặn công việc phiên chính không liên quan.
    - Báo cáo hoàn tất quay lại qua đường dẫn thông báo hoàn tất tác vụ. OpenClaw chuyển metadata hoàn tất nội bộ thành một prompt ACP thuần trước khi gửi đến harness bên ngoài, để harness không thấy các marker ngữ cảnh runtime chỉ dành cho OpenClaw.
    - Agent cha viết lại kết quả con bằng giọng assistant bình thường khi một phản hồi hướng người dùng là hữu ích.

    **Không** xem đường dẫn này là trò chuyện ngang hàng giữa cha
    và con. Con đã có một kênh hoàn tất quay về
    cha.

  </Accordion>
  <Accordion title="sessions_send and A2A delivery">
    `sessions_send` có thể nhắm đến phiên khác sau khi spawn. Với các
    phiên ngang hàng thông thường, OpenClaw dùng một đường dẫn follow-up
    agent-to-agent (A2A) sau khi chèn tin nhắn:

    - Chờ phản hồi của phiên đích.
    - Tùy chọn cho phép bên yêu cầu và đích trao đổi một số lượt follow-up có giới hạn.
    - Yêu cầu đích tạo một tin nhắn thông báo.
    - Gửi thông báo đó đến kênh hoặc thread hiển thị.

    Đường dẫn A2A đó là fallback cho các lượt gửi ngang hàng nơi bên gửi
    cần một follow-up hiển thị. Nó vẫn được bật khi một phiên không liên
    quan có thể thấy và nhắn tin cho đích ACP, ví dụ dưới các thiết lập
    `tools.sessions.visibility` rộng.

    OpenClaw chỉ bỏ qua follow-up A2A khi bên yêu cầu là cha của chính
    con ACP một lần do cha sở hữu. Trong trường hợp đó,
    chạy A2A chồng lên hoàn tất tác vụ có thể đánh thức cha bằng kết quả
    của con, chuyển tiếp phản hồi của cha trở lại con, và
    tạo vòng lặp echo cha/con. Kết quả `sessions_send` báo cáo
    `delivery.status="skipped"` cho trường hợp con được sở hữu đó vì
    đường dẫn hoàn tất đã chịu trách nhiệm cho kết quả.

  </Accordion>
  <Accordion title="Resume an existing session">
    Dùng `resumeSessionId` để tiếp tục một phiên ACP trước đó thay vì
    bắt đầu mới. Agent phát lại lịch sử trò chuyện của nó qua
    `session/load`, nên nó tiếp tục với đầy đủ ngữ cảnh của những gì đã xảy ra trước đó.

    ```json
    {
      "task": "Continue where we left off — fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Các trường hợp sử dụng phổ biến:

    - Bàn giao một phiên Codex từ laptop sang điện thoại của bạn — bảo agent tiếp tục từ nơi bạn đã dừng.
    - Tiếp tục một phiên lập trình bạn đã bắt đầu tương tác trong CLI, giờ chạy không giao diện qua agent của bạn.
    - Tiếp tục công việc bị gián đoạn bởi khởi động lại gateway hoặc timeout do nhàn rỗi.

    Ghi chú:

    - `resumeSessionId` chỉ áp dụng khi `runtime: "acp"`; runtime sub-agent mặc định bỏ qua trường chỉ dành cho ACP này.
    - `streamTo` chỉ áp dụng khi `runtime: "acp"`; runtime sub-agent mặc định bỏ qua trường chỉ dành cho ACP này.
    - `resumeSessionId` là id tiếp tục ACP/harness cục bộ trên host, không phải khóa phiên kênh OpenClaw; OpenClaw vẫn kiểm tra chính sách spawn ACP và chính sách agent đích trước khi dispatch, còn backend hoặc harness ACP sở hữu việc ủy quyền để tải id upstream đó.
    - `resumeSessionId` khôi phục lịch sử trò chuyện ACP upstream; `thread` và `mode` vẫn áp dụng bình thường cho phiên OpenClaw mới mà bạn đang tạo, vì vậy `mode: "session"` vẫn yêu cầu `thread: true`.
    - Agent đích phải hỗ trợ `session/load` (Codex và Claude Code có hỗ trợ).
    - Nếu không tìm thấy id phiên, spawn thất bại với lỗi rõ ràng — không có fallback âm thầm sang phiên mới.

  </Accordion>
  <Accordion title="Post-deploy smoke test">
    Sau khi deploy gateway, hãy chạy kiểm tra end-to-end trực tiếp thay
    vì tin vào unit test:

    1. Xác minh phiên bản gateway và commit đã deploy trên host đích.
    2. Mở một phiên cầu nối ACPX tạm thời đến agent live.
    3. Yêu cầu agent đó gọi `sessions_spawn` với `runtime: "acp"`, `agentId: "codex"`, `mode: "run"`, và tác vụ `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Xác minh `accepted=yes`, một `childSessionKey` thật, và không có lỗi validator.
    5. Dọn dẹp phiên cầu nối tạm thời.

    Giữ gate ở `mode: "run"` và bỏ qua `streamTo: "parent"` —
    `mode: "session"` ràng buộc thread và các đường dẫn stream-relay là
    những lượt tích hợp phong phú riêng biệt.

  </Accordion>
</AccordionGroup>

## Tương thích sandbox

Các phiên ACP hiện chạy trên runtime của host, **không** chạy bên trong
sandbox OpenClaw.

<Warning>
**Ranh giới bảo mật:**

- Bộ harness bên ngoài có thể đọc/ghi theo quyền CLI riêng của nó và `cwd` đã chọn.
- Chính sách sandbox của OpenClaw **không** bao bọc việc thực thi harness ACP.
- OpenClaw vẫn thực thi các cổng tính năng ACP, agent được phép, quyền sở hữu phiên, liên kết kênh, và chính sách phân phối Gateway.
- Dùng `runtime: "subagent"` cho công việc gốc OpenClaw được thực thi bằng sandbox.

</Warning>

Giới hạn hiện tại:

- Nếu phiên của bên yêu cầu được sandbox, việc sinh ACP sẽ bị chặn cho cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
- `sessions_spawn` với `runtime: "acp"` không hỗ trợ `sandbox: "require"`.

## Phân giải đích phiên

Hầu hết hành động `/acp` chấp nhận một đích phiên tùy chọn (`session-key`,
`session-id`, hoặc `session-label`).

**Thứ tự phân giải:**

1. Đối số đích rõ ràng (hoặc `--session` cho `/acp steer`)
   - thử khóa
   - rồi đến mã định danh phiên có dạng UUID
   - rồi đến nhãn
2. Liên kết luồng hiện tại (nếu cuộc trò chuyện/luồng này được liên kết với một phiên ACP).
3. Phương án dự phòng là phiên hiện tại của bên yêu cầu.

Liên kết cuộc trò chuyện hiện tại và liên kết luồng đều tham gia ở
bước 2.

Nếu không phân giải được đích nào, OpenClaw trả về lỗi rõ ràng
(`Unable to resolve session target: ...`).

## Điều khiển ACP

| Lệnh                 | Chức năng                                                  | Ví dụ                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tạo phiên ACP; tùy chọn liên kết hiện tại hoặc liên kết luồng. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hủy lượt đang chạy cho phiên đích.                         | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Gửi chỉ dẫn điều hướng đến phiên đang chạy.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Đóng phiên và hủy liên kết các đích luồng.                 | `/acp close`                                                  |
| `/acp status`        | Hiển thị backend, chế độ, trạng thái, tùy chọn runtime, khả năng. | `/acp status`                                                 |
| `/acp set-mode`      | Đặt chế độ runtime cho phiên đích.                         | `/acp set-mode plan`                                          |
| `/acp set`           | Ghi tùy chọn cấu hình runtime chung.                       | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Đặt ghi đè thư mục làm việc của runtime.                   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Đặt hồ sơ chính sách phê duyệt.                            | `/acp permissions strict`                                     |
| `/acp timeout`       | Đặt thời gian chờ runtime (giây).                          | `/acp timeout 120`                                            |
| `/acp model`         | Đặt ghi đè mô hình runtime.                                | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Xóa các ghi đè tùy chọn runtime của phiên.                 | `/acp reset-options`                                          |
| `/acp sessions`      | Liệt kê các phiên ACP gần đây từ kho lưu trữ.              | `/acp sessions`                                               |
| `/acp doctor`        | Sức khỏe backend, khả năng, bản sửa có thể hành động.      | `/acp doctor`                                                 |
| `/acp install`       | In các bước cài đặt và bật có tính xác định.               | `/acp install`                                                |

`/acp status` hiển thị các tùy chọn runtime có hiệu lực cùng với mã định danh phiên ở cấp runtime và
cấp backend. Lỗi điều khiển không được hỗ trợ được hiển thị
rõ ràng khi backend thiếu một khả năng. `/acp sessions` đọc
kho lưu trữ cho phiên đang được liên kết hiện tại hoặc phiên của bên yêu cầu; token đích
(`session-key`, `session-id`, hoặc `session-label`) được phân giải thông qua
khám phá phiên gateway, bao gồm các gốc `session.store`
tùy chỉnh theo từng agent.

### Ánh xạ tùy chọn runtime

`/acp` có các lệnh tiện ích và một setter chung. Các thao tác
tương đương:

| Lệnh                         | Ánh xạ tới                          | Ghi chú                                                                                                                                                                        |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/acp model <id>`            | khóa cấu hình runtime `model`        | Với Codex ACP, OpenClaw chuẩn hóa `openai-codex/<model>` thành mã định danh mô hình adapter và ánh xạ các hậu tố reasoning dạng dấu gạch chéo như `openai-codex/gpt-5.4/high` tới `reasoning_effort`. |
| `/acp set thinking <level>`  | khóa cấu hình runtime `thinking`     | Với Codex ACP, OpenClaw gửi `reasoning_effort` tương ứng khi adapter hỗ trợ.                                                                                                   |
| `/acp permissions <profile>` | khóa cấu hình runtime `approval_policy` | —                                                                                                                                                                              |
| `/acp timeout <seconds>`     | khóa cấu hình runtime `timeout`      | —                                                                                                                                                                              |
| `/acp cwd <path>`            | ghi đè cwd của runtime               | Cập nhật trực tiếp.                                                                                                                                                            |
| `/acp set <key> <value>`     | chung                                | `key=cwd` dùng đường dẫn ghi đè cwd.                                                                                                                                           |
| `/acp reset-options`         | xóa tất cả ghi đè runtime            | —                                                                                                                                                                              |

## acpx harness, thiết lập Plugin, và quyền

Để biết cấu hình harness acpx (bí danh Claude Code / Codex / Gemini CLI
aliases), các cầu nối MCP plugin-tools và OpenClaw-tools, cũng như
các chế độ quyền ACP, hãy xem
[agent ACP — thiết lập](/vi/tools/acp-agents-setup).

## Khắc phục sự cố

| Triệu chứng                                                                     | Nguyên nhân có khả năng                                                                                                           | Cách khắc phục                                                                                                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                     | Plugin phần phụ trợ bị thiếu, bị tắt, hoặc bị chặn bởi `plugins.allow`.                                                       | Cài đặt và bật Plugin phần phụ trợ, bao gồm `acpx` trong `plugins.allow` khi danh sách cho phép đó được đặt, rồi chạy `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                             | ACP bị tắt trên toàn cục.                                                                                                 | Đặt `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`           | Tính năng điều phối tự động từ tin nhắn luồng thông thường bị tắt.                                                               | Đặt `acp.dispatch.enabled=true` để tiếp tục định tuyến luồng tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` rõ ràng vẫn hoạt động.                                      |
| `ACP agent "<id>" is not allowed by policy`                                 | Agent không có trong danh sách cho phép.                                                                                                | Dùng `agentId` được phép hoặc cập nhật `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` báo phần phụ trợ chưa sẵn sàng ngay sau khi khởi động                 | Quá trình thăm dò phụ thuộc Plugin hoặc tự sửa chữa vẫn đang chạy.                                                               | Chờ một chút rồi chạy lại `/acp doctor`; nếu vẫn không lành mạnh, kiểm tra lỗi cài đặt phần phụ trợ và chính sách cho phép/từ chối Plugin.                                             |
| Không tìm thấy lệnh harness                                                   | CLI bộ chuyển đổi chưa được cài đặt, phụ thuộc Plugin đã dàn dựng bị thiếu, hoặc lần tải `npx` đầu tiên thất bại đối với bộ chuyển đổi không phải Codex. | Chạy `/acp doctor`, sửa phụ thuộc Plugin, cài đặt/làm nóng trước bộ chuyển đổi trên máy chủ Gateway, hoặc cấu hình rõ ràng lệnh agent acpx.                          |
| Harness báo không tìm thấy mô hình                                            | ID mô hình hợp lệ cho nhà cung cấp/harness khác nhưng không hợp lệ cho mục tiêu ACP này.                                                | Dùng mô hình được harness đó liệt kê, cấu hình mô hình trong harness, hoặc bỏ qua phần ghi đè.                                                                            |
| Lỗi xác thực nhà cung cấp từ harness                                          | OpenClaw lành mạnh, nhưng CLI/nhà cung cấp mục tiêu chưa đăng nhập.                                                     | Đăng nhập hoặc cung cấp khóa nhà cung cấp bắt buộc trong môi trường máy chủ Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                     | Mã khóa/ID/nhãn không đúng.                                                                                                | Chạy `/acp sessions`, sao chép đúng khóa/nhãn, rồi thử lại.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation` | `--bind here` được dùng khi không có cuộc hội thoại đang hoạt động có thể ràng buộc.                                                            | Chuyển đến cuộc trò chuyện/kênh mục tiêu rồi thử lại, hoặc dùng cách tạo phiên không ràng buộc.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                      | Bộ chuyển đổi thiếu năng lực ràng buộc ACP với cuộc hội thoại hiện tại.                                                             | Dùng `/acp spawn ... --thread ...` nếu được hỗ trợ, cấu hình `bindings[]` cấp cao nhất, hoặc chuyển sang kênh được hỗ trợ.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`     | `--thread here` được dùng bên ngoài ngữ cảnh luồng.                                                                         | Chuyển đến luồng mục tiêu hoặc dùng `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`               | Người dùng khác sở hữu mục tiêu ràng buộc đang hoạt động.                                                                           | Ràng buộc lại với tư cách chủ sở hữu hoặc dùng cuộc hội thoại hay luồng khác.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                            | Bộ chuyển đổi thiếu năng lực ràng buộc luồng.                                                                               | Dùng `--thread off` hoặc chuyển sang bộ chuyển đổi/kênh được hỗ trợ.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                          | Runtime ACP ở phía máy chủ; phiên yêu cầu nằm trong sandbox.                                                              | Dùng `runtime="subagent"` từ các phiên trong sandbox, hoặc chạy tạo phiên ACP từ phiên không nằm trong sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`     | `sandbox="require"` được yêu cầu cho runtime ACP.                                                                         | Dùng `runtime="subagent"` khi bắt buộc cần sandbox, hoặc dùng ACP với `sandbox="inherit"` từ phiên không nằm trong sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                  | Harness mục tiêu không cung cấp khả năng chuyển đổi mô hình ACP chung.                                                        | Dùng harness có quảng bá ACP `models`/`session/set_model`, dùng tham chiếu mô hình ACP Codex, hoặc cấu hình mô hình trực tiếp trong harness nếu nó có cờ khởi động riêng. |
| Thiếu siêu dữ liệu ACP cho phiên đã ràng buộc                                      | Siêu dữ liệu phiên ACP đã cũ/bị xóa.                                                                                    | Tạo lại bằng `/acp spawn`, rồi ràng buộc lại/tập trung luồng.                                                                                                                    |
| `AcpRuntimeError: Permission prompt unavailable in non-interactive mode`    | `permissionMode` chặn ghi/thực thi trong phiên ACP không tương tác.                                                    | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại gateway. Xem [Cấu hình quyền](/vi/tools/acp-agents-setup#permission-configuration). |
| Phiên ACP thất bại sớm với ít đầu ra                                  | Lời nhắc quyền bị chặn bởi `permissionMode`/`nonInteractivePermissions`.                                        | Kiểm tra nhật ký gateway để tìm `AcpRuntimeError`. Để có đầy đủ quyền, đặt `permissionMode=approve-all`; để suy giảm nhẹ nhàng, đặt `nonInteractivePermissions=deny`.        |
| Phiên ACP treo vô thời hạn sau khi hoàn tất công việc                       | Tiến trình harness đã kết thúc nhưng phiên ACP không báo hoàn tất.                                                    | Theo dõi bằng `ps aux \| grep acpx`; tự tay dừng các tiến trình cũ.                                                                                                       |
| Harness thấy `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                        | Phong bì sự kiện nội bộ bị rò rỉ qua ranh giới ACP.                                                                | Cập nhật OpenClaw và chạy lại luồng hoàn tất; harness bên ngoài chỉ nên nhận lời nhắc hoàn tất dạng thuần.                                                          |

## Liên quan

- [Agent ACP — thiết lập](/vi/tools/acp-agents-setup)
- [Gửi agent](/vi/tools/agent-send)
- [Phần phụ trợ CLI](/vi/gateway/cli-backends)
- [Harness Codex](/vi/plugins/codex-harness)
- [Công cụ sandbox đa agent](/vi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (chế độ cầu nối)](/vi/cli/acp)
- [Sub-agent](/vi/tools/subagents)
