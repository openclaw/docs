---
read_when:
    - Chạy các harness lập trình thông qua ACP
    - Thiết lập các phiên ACP gắn với cuộc trò chuyện trên các kênh nhắn tin
    - Liên kết cuộc hội thoại trên kênh nhắn tin với một phiên ACP bền vững
    - Khắc phục sự cố backend ACP, kết nối Plugin hoặc phân phối kết quả hoàn tất
    - Vận hành các lệnh /acp từ cuộc trò chuyện
sidebarTitle: ACP agents
summary: Chạy các bộ công cụ lập trình bên ngoài (Claude Code, Cursor, Gemini CLI, Codex ACP tường minh, OpenClaw ACP, OpenCode) thông qua backend ACP
title: Tác nhân ACP
x-i18n:
    generated_at: "2026-07-20T04:44:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4a2b2b3754e7889f06e65740b9c08e56ec8d01637c286ec2dfa743ae2f7e507e
    source_path: tools/acp-agents.md
    workflow: 16
---

Các phiên [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) cho phép
OpenClaw chạy các môi trường điều phối lập trình bên ngoài (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI và các môi trường ACPX được hỗ trợ khác)
thông qua Plugin backend ACP. Mỗi lần khởi tạo được theo dõi dưới dạng một
[tác vụ nền](/vi/automation/tasks).

<Note>
**ACP là đường dẫn dành cho môi trường điều phối bên ngoài, không phải đường dẫn Codex mặc định.** Plugin
app-server Codex gốc sở hữu các điều khiển `/codex ...` và runtime nhúng
`openai/gpt-*` mặc định cho các lượt của tác nhân; ACP sở hữu các điều khiển `/acp ...`
và các phiên `sessions_spawn({ runtime: "acp" })`.

Để cho phép Codex hoặc Claude Code kết nối trực tiếp dưới dạng máy khách MCP bên ngoài với
các cuộc hội thoại kênh OpenClaw hiện có, hãy dùng
[`openclaw mcp serve`](/vi/cli/mcp) thay cho ACP.
</Note>

## Tôi cần trang nào?

| Bạn muốn...                                                                                     | Sử dụng                               | Ghi chú                                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Liên kết hoặc điều khiển Codex trong cuộc hội thoại hiện tại                                    | `/codex bind`, `/codex threads`       | Đường dẫn app-server Codex gốc khi Plugin `codex` được bật: phản hồi trò chuyện đã liên kết, chuyển tiếp hình ảnh, mô hình/nhanh/quyền, dừng và điều hướng. ACP là phương án dự phòng rõ ràng |
| Chạy Claude Code, Gemini CLI, Codex ACP rõ ràng hoặc một môi trường điều phối bên ngoài khác _thông qua_ OpenClaw | Trang này                              | Các phiên liên kết với cuộc trò chuyện, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tác vụ nền, điều khiển runtime                                                                 |
| Cung cấp một phiên OpenClaw Gateway _dưới dạng_ máy chủ ACP cho trình chỉnh sửa hoặc máy khách  | [`openclaw acp`](/vi/cli/acp)            | Chế độ cầu nối: IDE/máy khách giao tiếp bằng ACP với OpenClaw qua stdio/WebSocket                                                                                                    |
| Tái sử dụng CLI AI cục bộ làm mô hình dự phòng chỉ văn bản                                      | [Backend CLI](/vi/gateway/cli-backends)  | Không phải ACP: không có công cụ OpenClaw, không có điều khiển ACP, không có runtime của môi trường điều phối                                                                         |

## Tính năng này có hoạt động ngay không?

Có, sau khi cài đặt Plugin runtime ACP chính thức:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các bản checkout mã nguồn có thể dùng Plugin workspace `extensions/acpx` cục bộ sau
`pnpm install`. Chạy `/acp doctor` để kiểm tra trạng thái sẵn sàng.

OpenClaw chỉ hướng dẫn tác nhân về việc khởi tạo ACP khi ACP **thực sự khả dụng**:
ACP phải được bật, việc điều phối không được tắt, phiên hiện tại không được
sandbox chặn và một backend runtime phải được tải cũng như hoạt động bình thường. Nếu
bất kỳ điều kiện nào không đạt, Skills ACP và hướng dẫn ACP `sessions_spawn` sẽ tiếp tục bị ẩn
để tác nhân không đề xuất một backend không khả dụng.

<AccordionGroup>
  <Accordion title="Những điểm dễ gặp sự cố khi chạy lần đầu">
    - Nếu `plugins.allow` được đặt, đây là danh sách Plugin hạn chế và **phải** bao gồm `acpx`, nếu không backend ACP đã cài đặt sẽ bị chặn có chủ đích (`/acp doctor` báo cáo mục bị thiếu trong danh sách cho phép).
    - Bộ điều hợp Codex ACP được cung cấp cùng Plugin `acpx` và khởi chạy cục bộ khi có thể.
    - Codex ACP chạy với `CODEX_HOME` biệt lập. OpenClaw sao chép các mục tin cậy của dự án đáng tin cậy cùng cấu hình định tuyến mô hình/nhà cung cấp an toàn (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` và các trường `model_providers.<name>` an toàn) từ cấu hình Codex trên máy chủ; thông tin xác thực, thông báo và hook chỉ nằm trong cấu hình máy chủ.
    - Các bộ điều hợp môi trường điều phối đích khác có thể được tải về theo yêu cầu bằng `npx` trong lần sử dụng đầu tiên.
    - Thông tin xác thực của nhà cung cấp phải tồn tại sẵn trên máy chủ cho môi trường điều phối đó.
    - Nếu máy chủ không có npm hoặc quyền truy cập mạng, việc tải bộ điều hợp trong lần chạy đầu sẽ thất bại cho đến khi bộ nhớ đệm được làm nóng trước hoặc bộ điều hợp được cài đặt theo cách khác.

  </Accordion>
  <Accordion title="Điều kiện tiên quyết của runtime">
    ACP khởi chạy một tiến trình môi trường điều phối bên ngoài thực sự. OpenClaw sở hữu việc định tuyến,
    trạng thái tác vụ nền, phân phối, liên kết và chính sách; môi trường điều phối sở hữu
    thông tin đăng nhập nhà cung cấp, danh mục mô hình, hành vi hệ thống tệp và các công cụ gốc của nó.

    Trước khi quy lỗi cho OpenClaw, hãy xác minh:

    - `/acp doctor` báo cáo một backend đã bật và hoạt động bình thường.
    - Id đích được `acp.allowedAgents` cho phép khi danh sách cho phép đó được đặt.
    - Lệnh của môi trường điều phối có thể khởi động trên máy chủ Gateway.
    - Thông tin xác thực của nhà cung cấp hiện diện cho môi trường điều phối đó (`claude`, `codex`, `gemini`, `opencode`, `droid`, v.v.).
    - Mô hình đã chọn tồn tại cho môi trường điều phối đó - id mô hình không thể dùng chung giữa các môi trường điều phối.
    - `cwd` được yêu cầu tồn tại và có thể truy cập, hoặc bỏ qua `cwd` để backend dùng giá trị mặc định.
    - Chế độ quyền phù hợp với công việc. Các phiên không tương tác không thể nhấp vào lời nhắc quyền gốc, vì vậy các lượt lập trình cần nhiều thao tác ghi/thực thi thường cần hồ sơ quyền ACPX có thể tiếp tục ở chế độ không giao diện.

  </Accordion>
</AccordionGroup>

Theo mặc định, các công cụ Plugin OpenClaw và công cụ tích hợp sẵn của OpenClaw **không** được cung cấp cho
các môi trường điều phối ACP. Chỉ bật các cầu nối MCP rõ ràng trong
[Tác nhân ACP - thiết lập](/vi/tools/acp-agents-setup) khi môi trường điều phối cần
gọi trực tiếp các công cụ đó.

## Các đích môi trường điều phối được hỗ trợ

Với backend `acpx`, hãy dùng các id này làm đích `/acp spawn <id>` hoặc
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| Id môi trường điều phối | Backend điển hình                               | Ghi chú                                                                                                      |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `claude`     | Bộ điều hợp ACP Claude Code                     | Yêu cầu thông tin xác thực Claude Code trên máy chủ.                                                         |
| `codex`      | Bộ điều hợp ACP Codex                           | Chỉ là phương án dự phòng ACP rõ ràng khi `/codex` gốc không khả dụng hoặc ACP được yêu cầu.       |
| `copilot`    | Bộ điều hợp ACP GitHub Copilot                  | Yêu cầu thông tin xác thực CLI/runtime Copilot.                                                              |
| `cursor`     | ACP Cursor CLI (`cursor-agent acp`)             | Ghi đè lệnh acpx nếu bản cài đặt cục bộ cung cấp một điểm vào ACP khác.                                      |
| `droid`      | Factory Droid CLI                               | Yêu cầu thông tin xác thực Factory/Droid hoặc `FACTORY_API_KEY` trong môi trường của môi trường điều phối. |
| `fast-agent` | Bộ điều hợp ACP fast-agent-mcp                  | Được tải về theo yêu cầu bằng `uvx`.                                                            |
| `gemini`     | Bộ điều hợp ACP Gemini CLI                      | Yêu cầu thông tin xác thực Gemini CLI hoặc thiết lập khóa API.                                               |
| `iflow`      | iFlow CLI                                       | Tính khả dụng của bộ điều hợp và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.                   |
| `kilocode`   | Kilo Code CLI                                   | Tính khả dụng của bộ điều hợp và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.                   |
| `kimi`       | Kimi/Moonshot CLI                               | Yêu cầu thông tin xác thực Kimi/Moonshot trên máy chủ.                                                       |
| `kiro`       | Kiro CLI                                        | Tính khả dụng của bộ điều hợp và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.                   |
| `mux`        | Bộ điều hợp ACP Mux                             | Được tải về theo yêu cầu bằng `npx`.                                                            |
| `opencode`   | Bộ điều hợp ACP OpenCode                        | Yêu cầu thông tin xác thực CLI/nhà cung cấp OpenCode.                                                        |
| `openclaw`   | Cầu nối OpenClaw Gateway thông qua `openclaw acp` | Cho phép một môi trường điều phối hỗ trợ ACP giao tiếp ngược lại với phiên OpenClaw Gateway.               |
| `qoder`      | Qoder CLI                                       | Tính khả dụng của bộ điều hợp và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.                   |
| `qwen`       | Qwen Code / Qwen CLI                            | Yêu cầu thông tin xác thực tương thích với Qwen trên máy chủ.                                                |
| `trae`       | Bộ điều hợp ACP Trae                            | Tính khả dụng của bộ điều hợp và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.                   |

`pi` (pi-acp) cũng được đăng ký trong backend acpx nhưng không phải là một
môi trường điều phối lập trình theo cùng nghĩa với các mục khác ở trên.

Có thể cấu hình bí danh tác nhân acpx tùy chỉnh trong chính acpx, nhưng chính sách OpenClaw
vẫn kiểm tra `acp.allowedAgents` và mọi ánh xạ
`agents.list[].runtime.acp.agent` trước khi điều phối.

## Sổ tay vận hành

Luồng `/acp` nhanh từ cuộc trò chuyện:

<Steps>
  <Step title="Khởi tạo">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` hoặc
    `/acp spawn codex --bind here` rõ ràng.
  </Step>
  <Step title="Làm việc">
    Tiếp tục trong cuộc hội thoại hoặc luồng đã liên kết (hoặc chỉ định khóa phiên
    một cách rõ ràng).
  </Step>
  <Step title="Kiểm tra trạng thái">
    `/acp status`
  </Step>
  <Step title="Tinh chỉnh">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
    `/acp timeout <seconds>`.
  </Step>
  <Step title="Điều hướng">
    Mà không thay thế ngữ cảnh: `/acp steer tighten logging and continue`.
  </Step>
  <Step title="Dừng">
    `/acp cancel` (lượt hiện tại) hoặc `/acp close` (phiên + liên kết).
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Chi tiết vòng đời">
    - Thao tác khởi tạo sẽ tạo mới hoặc tiếp tục một phiên runtime ACP, ghi siêu dữ liệu ACP vào kho lưu trữ phiên OpenClaw và có thể tạo một tác vụ nền khi lượt chạy thuộc quyền sở hữu của tác vụ cha.
    - Các phiên ACP thuộc quyền sở hữu của tác vụ cha được xem là công việc nền ngay cả khi phiên runtime là phiên duy trì lâu dài; việc hoàn tất và phân phối trên nhiều bề mặt đi qua trình thông báo tác vụ cha thay vì hoạt động như một phiên trò chuyện thông thường hướng đến người dùng.
    - Quá trình bảo trì tác vụ đóng các phiên ACP dùng một lần thuộc quyền sở hữu của tác vụ cha đã kết thúc hoặc bị mất liên kết. Các phiên ACP duy trì lâu dài được giữ lại khi vẫn còn liên kết hội thoại đang hoạt động; các phiên duy trì lâu dài cũ không có liên kết đang hoạt động sẽ bị đóng để không thể được âm thầm tiếp tục sau khi tác vụ sở hữu đã hoàn tất hoặc bản ghi tác vụ của nó không còn tồn tại.
    - Các tin nhắn tiếp theo đã liên kết được chuyển thẳng đến phiên ACP cho đến khi liên kết bị đóng, bỏ tiêu điểm, đặt lại hoặc hết hạn.
    - Các lệnh Gateway vẫn được xử lý cục bộ. `/acp ...`, `/status` và `/unfocus` không bao giờ được gửi dưới dạng văn bản lời nhắc thông thường đến một harness ACP đã liên kết.
    - `cancel` hủy lượt đang hoạt động khi backend hỗ trợ hủy; thao tác này không xóa liên kết hoặc siêu dữ liệu phiên.
    - `close` kết thúc phiên ACP theo góc nhìn của OpenClaw và xóa liên kết. Harness vẫn có thể lưu lịch sử ngược dòng của riêng nó nếu hỗ trợ tiếp tục.
    - Plugin acpx dọn dẹp các cây tiến trình trình bao bọc và bộ điều hợp do OpenClaw sở hữu sau `close`, đồng thời thu hồi các tiến trình ACPX mồ côi cũ do OpenClaw sở hữu trong quá trình khởi động Gateway.
    - Các worker runtime không hoạt động đủ điều kiện được dọn dẹp sau khoảng thời gian không hoạt động tích hợp sẵn; siêu dữ liệu phiên đã lưu vẫn khả dụng cho `/acp sessions`.

  </Accordion>
  <Accordion title="Quy tắc định tuyến Codex gốc">
    Các tác nhân kích hoạt bằng ngôn ngữ tự nhiên nên định tuyến đến **Plugin Codex gốc**
    khi Plugin này được bật:

    - "Liên kết kênh Discord này với Codex."
    - "Gắn cuộc trò chuyện này vào luồng Codex `<id>`."
    - "Hiển thị các luồng Codex, sau đó liên kết luồng này."

    Liên kết hội thoại Codex gốc là đường dẫn điều khiển trò chuyện mặc định.
    Các công cụ động của OpenClaw vẫn thực thi thông qua OpenClaw, trong khi các
    công cụ gốc của Codex như shell/apply-patch thực thi bên trong Codex. Đối với
    các sự kiện công cụ gốc của Codex, OpenClaw chèn một bộ chuyển tiếp hook gốc
    theo từng lượt để các hook Plugin có thể chặn `before_tool_call`, quan sát
    `after_tool_call` và định tuyến các sự kiện `PermissionRequest` của Codex
    thông qua quy trình phê duyệt của OpenClaw. Các hook `Stop` của Codex
    được chuyển tiếp đến `before_agent_finalize` của OpenClaw, nơi các Plugin có thể yêu cầu
    thêm một lượt chạy mô hình trước khi Codex hoàn tất câu trả lời. Bộ chuyển tiếp
    được chủ ý giữ ở mức thận trọng: nó không sửa đổi các đối số công cụ gốc của Codex
    hoặc ghi lại bản ghi luồng Codex. Chỉ dùng ACP tường minh khi bạn muốn
    mô hình runtime/phiên ACP. Ranh giới hỗ trợ Codex nhúng được
    ghi lại trong
    [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Bảng tra nhanh lựa chọn mô hình / nhà cung cấp / runtime">
    - tham chiếu mô hình Codex cũ - tuyến mô hình đăng ký/OAuth Codex cũ được doctor sửa chữa.
    - `openai/*` - runtime nhúng app-server Codex gốc cho các lượt tác nhân OpenAI.
    - `/codex ...` - điều khiển hội thoại Codex gốc.
    - `/acp ...` hoặc `runtime: "acp"` - điều khiển ACP/acpx tường minh.

  </Accordion>
  <Accordion title="Tác nhân kích hoạt bằng ngôn ngữ tự nhiên để định tuyến ACP">
    Các tác nhân kích hoạt nên định tuyến đến runtime ACP:

    - "Chạy tác vụ này dưới dạng phiên ACP Claude Code dùng một lần và tóm tắt kết quả."
    - "Dùng Gemini CLI cho tác vụ này trong một luồng, sau đó giữ các lượt tiếp theo trong cùng luồng đó."
    - "Chạy Codex thông qua ACP trong một luồng nền."

    OpenClaw chọn `runtime: "acp"`, phân giải harness `agentId`, liên kết với
    hội thoại hoặc luồng hiện tại khi được hỗ trợ và định tuyến các lượt tiếp theo
    đến phiên đó cho đến khi đóng/hết hạn. Codex chỉ đi theo đường dẫn này khi
    ACP/acpx được chỉ định tường minh hoặc Plugin Codex gốc không khả dụng cho
    thao tác được yêu cầu.

    Đối với `sessions_spawn`, `runtime: "acp"` chỉ được công bố khi ACP
    được bật, bên yêu cầu không nằm trong sandbox và một backend runtime ACP
    đã được tải. `acp.dispatch.enabled=false` tạm dừng điều phối luồng ACP tự động
    nhưng không ẩn hoặc chặn các lệnh gọi `sessions_spawn({ runtime: "acp" })`
    tường minh. Nó nhắm đến các id harness ACP như `codex`, `claude`, `droid`,
    `gemini` hoặc `opencode`. Không truyền id tác nhân cấu hình OpenClaw thông thường
    từ `agents_list` trừ khi mục đó được cấu hình tường minh với
    `agents.list[].runtime.type="acp"`; nếu không, hãy dùng runtime
    tác nhân phụ mặc định. Khi một tác nhân OpenClaw được cấu hình với
    `runtime.type="acp"`, OpenClaw dùng `runtime.acp.agent` làm
    id harness nền tảng.

  </Accordion>
</AccordionGroup>

## ACP so với tác nhân phụ

Dùng ACP khi bạn muốn một runtime harness bên ngoài. Dùng **app-server
Codex gốc** để liên kết/điều khiển hội thoại Codex khi Plugin `codex`
được bật. Dùng **tác nhân phụ** khi bạn muốn các lượt chạy được ủy quyền có nguồn gốc OpenClaw.

| Phạm vi       | Phiên ACP                              | Lượt chạy tác nhân phụ               |
| ------------- | ------------------------------------- | ---------------------------------- |
| Runtime       | Plugin backend ACP (ví dụ: acpx)      | Runtime tác nhân phụ gốc của OpenClaw |
| Khóa phiên    | `agent:<agentId>:acp:<uuid>`          | `agent:<agentId>:subagent:<uuid>`  |
| Lệnh chính    | `/acp ...`                            | `/subagents ...`                   |
| Công cụ khởi tạo | `sessions_spawn` với `runtime:"acp"` | `sessions_spawn` (runtime mặc định) |

Xem thêm [Tác nhân phụ](/vi/tools/subagents).

## Cách ACP chạy Claude Code

Đối với Claude Code thông qua ACP, ngăn xếp là:

1. Mặt phẳng điều khiển phiên ACP của OpenClaw.
2. Plugin runtime `@openclaw/acpx` chính thức.
3. Bộ điều hợp ACP Claude.
4. Cơ chế runtime/phiên phía Claude.

ACP Claude là một **phiên harness** với các điều khiển ACP, khả năng tiếp tục phiên,
theo dõi tác vụ nền và tùy chọn liên kết hội thoại/luồng.

Các backend CLI là những runtime dự phòng cục bộ riêng biệt chỉ dùng văn bản - xem
[Backend CLI](/vi/gateway/cli-backends).

Đối với người vận hành, quy tắc thực tế là:

- **Muốn `/acp spawn`, phiên có thể liên kết, điều khiển runtime hoặc công việc harness duy trì lâu dài?** Dùng ACP.
- **Muốn cơ chế dự phòng văn bản cục bộ đơn giản thông qua CLI thô?** Dùng các backend CLI.

## Phiên đã liên kết

### Mô hình tư duy

- **Bề mặt trò chuyện** - nơi mọi người tiếp tục trò chuyện (kênh Discord, chủ đề Telegram, cuộc trò chuyện iMessage).
- **Phiên ACP** - trạng thái runtime Codex/Claude/Gemini bền vững mà OpenClaw định tuyến đến.
- **Luồng/chủ đề con** - một bề mặt nhắn tin bổ sung tùy chọn chỉ được tạo bởi `--thread ...`.
- **Không gian làm việc runtime** - vị trí hệ thống tệp (`cwd`, bản checkout kho lưu trữ, không gian làm việc backend) nơi harness chạy. Độc lập với bề mặt trò chuyện.

### Liên kết hội thoại hiện tại

`/acp spawn <harness> --bind here` ghim hội thoại hiện tại vào
phiên ACP đã khởi tạo - không có luồng con, vẫn cùng bề mặt trò chuyện. OpenClaw tiếp tục
sở hữu phần vận chuyển, xác thực, an toàn và phân phối. Các tin nhắn tiếp theo trong
hội thoại đó được định tuyến đến cùng phiên; `/new` và `/reset` đặt lại phiên
tại chỗ; `/acp close` xóa liên kết.

Ví dụ:

```text
/codex bind                                              # liên kết Codex gốc, định tuyến các tin nhắn sau này đến đây
/codex model gpt-5.4                                     # tinh chỉnh luồng Codex gốc đã liên kết
/codex stop                                              # điều khiển lượt Codex gốc đang hoạt động
/acp spawn codex --bind here                             # phương án ACP dự phòng tường minh cho Codex
/acp spawn codex --thread auto                           # có thể tạo một luồng/chủ đề con và liên kết tại đó
/acp spawn codex --bind here --cwd /workspace/repo       # cùng liên kết trò chuyện, Codex chạy trong /workspace/repo
```

<AccordionGroup>
  <Accordion title="Quy tắc liên kết và tính loại trừ">
    - `--bind here` và `--thread ...` loại trừ lẫn nhau.
    - `--bind here` chỉ hoạt động trên các kênh công bố khả năng liên kết hội thoại hiện tại; nếu không, OpenClaw trả về thông báo rõ ràng rằng tính năng không được hỗ trợ. Liên kết vẫn tồn tại qua các lần khởi động lại Gateway.
    - Trên Discord, `spawnSessions` kiểm soát việc tạo luồng con cho `--thread auto|here` - không phải `--bind here`.
    - Nếu bạn khởi tạo đến một tác nhân ACP khác mà không có `--cwd`, theo mặc định OpenClaw kế thừa không gian làm việc của **tác nhân đích**. Các đường dẫn được kế thừa bị thiếu (`ENOENT`/`ENOTDIR`) sẽ dùng mặc định của backend; các lỗi truy cập khác (ví dụ: `EACCES`) được hiển thị dưới dạng lỗi khởi tạo.
    - Các lệnh quản lý Gateway vẫn được xử lý cục bộ trong hội thoại đã liên kết - các lệnh `/acp ...` được OpenClaw xử lý ngay cả khi văn bản tiếp theo thông thường được định tuyến đến phiên ACP đã liên kết; `/status` và `/unfocus` cũng luôn được xử lý cục bộ khi việc xử lý lệnh được bật cho bề mặt đó.

  </Accordion>
  <Accordion title="Phiên liên kết với luồng">
    Khi liên kết luồng được bật cho một bộ điều hợp kênh:

    - OpenClaw liên kết một luồng với phiên ACP đích.
    - Các tin nhắn tiếp theo trong luồng đó được định tuyến đến phiên ACP đã liên kết.
    - Đầu ra ACP được gửi trở lại cùng luồng.
    - Thao tác bỏ tiêu điểm/đóng/lưu trữ, hết thời gian chờ không hoạt động hoặc hết thời hạn tối đa sẽ xóa liên kết.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` và `/unfocus` là các lệnh Gateway, không phải lời nhắc cho harness ACP.

    Các cờ tính năng bắt buộc cho ACP liên kết với luồng:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` được bật theo mặc định (đặt `false` để tạm dừng điều phối luồng ACP tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` tường minh vẫn hoạt động).
    - Khả năng khởi tạo phiên luồng của bộ điều hợp kênh được bật (mặc định: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Hỗ trợ liên kết luồng tùy thuộc vào từng bộ điều hợp. Nếu bộ điều hợp kênh
    đang hoạt động không hỗ trợ liên kết luồng, OpenClaw trả về thông báo rõ ràng
    rằng tính năng không được hỗ trợ/không khả dụng.

  </Accordion>
  <Accordion title="Các kênh hỗ trợ luồng">
    - Mọi bộ điều hợp kênh cung cấp khả năng liên kết phiên/luồng.
    - Hỗ trợ tích hợp hiện tại: các luồng/kênh **Discord**, các chủ đề **Telegram** (chủ đề diễn đàn trong nhóm/siêu nhóm và chủ đề tin nhắn trực tiếp).
    - Các kênh Plugin có thể bổ sung hỗ trợ thông qua cùng giao diện liên kết.

  </Accordion>
</AccordionGroup>

## Liên kết kênh duy trì lâu dài

Đối với các quy trình không tạm thời, hãy cấu hình liên kết ACP duy trì lâu dài trong các mục
`bindings[]` cấp cao nhất.

### Mô hình liên kết

<ParamField path="bindings[].type" type='"acp"'>
  Đánh dấu một liên kết hội thoại ACP duy trì lâu dài.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Xác định hội thoại đích. Cấu trúc theo từng kênh:

- **Kênh/luồng Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kênh/tin nhắn trực tiếp Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Ưu tiên các ID Slack ổn định; liên kết kênh cũng khớp với các câu trả lời bên trong các luồng của kênh đó.
- **Chủ đề diễn đàn Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Tin nhắn trực tiếp/nhóm WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Sử dụng số E.164 như `+15555550123` cho cuộc trò chuyện trực tiếp và JID nhóm WhatsApp như `120363424282127706@g.us` cho nhóm.
- **Tin nhắn trực tiếp/nhóm iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Ưu tiên `chat_id:*` để có liên kết nhóm ổn định.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  ID agent OpenClaw sở hữu.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Giá trị ghi đè ACP tùy chọn.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Nhãn tùy chọn dành cho người vận hành.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Thư mục làm việc thời gian chạy tùy chọn.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Giá trị ghi đè backend tùy chọn.
</ParamField>

### Giá trị mặc định thời gian chạy cho từng agent

Sử dụng `agents.list[].runtime` để xác định các giá trị mặc định ACP một lần cho mỗi agent:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (ID harness, ví dụ: `codex` hoặc `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Thứ tự ưu tiên ghi đè cho các phiên liên kết ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Các giá trị mặc định ACP toàn cục (ví dụ: `acp.backend`)

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

- OpenClaw đảm bảo phiên ACP đã cấu hình tồn tại sau bước kiểm soát quyền vào dành riêng cho kênh và trước khi sử dụng.
- Tin nhắn trong kênh, chủ đề hoặc cuộc trò chuyện đó được định tuyến đến phiên ACP đã cấu hình.
- Các liên kết ACP đã cấu hình sở hữu tuyến phiên của chúng. Phân phối dạng broadcast đến nhiều đích của kênh không thay thế phiên ACP đã cấu hình đối với một liên kết khớp.
- Trong các cuộc trò chuyện đã liên kết, `/new` và `/reset` đặt lại cùng một khóa phiên ACP tại chỗ.
- Các liên kết thời gian chạy tạm thời (ví dụ: được tạo bởi luồng tập trung vào luồng hội thoại) vẫn áp dụng khi có.
- Đối với việc khởi tạo ACP giữa các agent mà không có `cwd` tường minh, OpenClaw kế thừa không gian làm việc của agent đích từ cấu hình agent.
- Các đường dẫn không gian làm việc được kế thừa nhưng không tồn tại sẽ dùng cwd mặc định của backend; lỗi truy cập đối với đường dẫn có tồn tại được trả về dưới dạng lỗi khởi tạo.

## Khởi động phiên ACP

Có hai cách để khởi động một phiên ACP:

<Tabs>
  <Tab title="Từ sessions_spawn">
    Sử dụng `runtime: "acp"` để khởi động một phiên ACP từ một lượt xử lý của agent hoặc một
    lệnh gọi công cụ.

    ```json
    {
      "task": "Mở kho mã và tóm tắt các kiểm thử đang thất bại",
      "runtime": "acp",
      "agentId": "codex",
      "thread": true,
      "mode": "session"
    }
    ```

    <Note>
    `runtime` mặc định là `subagent`, vì vậy hãy đặt `runtime: "acp"` tường minh cho
    các phiên ACP. Nếu bỏ qua `agentId`, OpenClaw sử dụng `acp.defaultAgent`
    khi được cấu hình. `mode: "session"` yêu cầu `thread: true` để duy trì một
    cuộc trò chuyện liên kết lâu dài.
    </Note>

  </Tab>
  <Tab title="Từ lệnh /acp">
    Sử dụng `/acp spawn` để người vận hành điều khiển tường minh từ cuộc trò chuyện.

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

    Xem [Lệnh dấu gạch chéo](/vi/tools/slash-commands).

  </Tab>
</Tabs>

### Tham số `sessions_spawn`

<ParamField path="task" type="string" required>
  Lời nhắc ban đầu được gửi đến phiên ACP.
</ParamField>
<ParamField path="runtime" type='"acp"' required>
  Phải là `"acp"` đối với các phiên ACP.
</ParamField>
<ParamField path="agentId" type="string">
  ID harness đích của ACP. Dùng `acp.defaultAgent` làm phương án dự phòng nếu được đặt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Yêu cầu luồng liên kết luồng hội thoại ở nơi được hỗ trợ.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` chạy một lần; `"session"` là lâu dài. Nếu `thread: true` và
  bỏ qua `mode`, OpenClaw có thể mặc định sử dụng hành vi lâu dài tùy theo
  đường dẫn thời gian chạy. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc thời gian chạy được yêu cầu (được xác thực theo chính sách backend/thời gian chạy).
  Nếu bỏ qua, thao tác khởi tạo ACP kế thừa không gian làm việc của agent đích khi được cấu hình;
  các đường dẫn được kế thừa nhưng không tồn tại sẽ dùng giá trị mặc định của backend, còn lỗi
  truy cập thực tế sẽ được trả về.
</ParamField>
<ParamField path="label" type="string">
  Nhãn dành cho người vận hành, được sử dụng trong văn bản phiên/biểu ngữ.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tiếp tục một phiên ACP hiện có thay vì tạo phiên mới. Agent
  phát lại lịch sử trò chuyện của phiên qua `session/load`. Yêu cầu
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` truyền phát các bản tóm tắt tiến trình chạy ACP ban đầu trở lại phiên
  yêu cầu dưới dạng sự kiện hệ thống. OpenClaw ghi lại toàn bộ lịch sử chuyển tiếp trong
  trạng thái SQLite của agent con và xóa lịch sử đó cùng với phiên con. Theo mặc định,
  luồng tiến trình của phiên cha hiển thị phần bình luận của trợ lý và tiến trình trạng thái ACP, trừ khi
  `streaming.progress.commentary=false`. Discord cũng mặc định đặt bản xem trước của phiên cha
  ở chế độ tiến trình khi chưa cấu hình chế độ truyền phát. Tiến trình
  trạng thái vẫn tuân theo `acp.stream.tagVisibility`, vì vậy các thẻ như `plan`
  vẫn bị ẩn trừ khi được bật tường minh.
</ParamField>

Các lượt chạy ACP `sessions_spawn` sử dụng `agents.defaults.subagents.runTimeoutSeconds`
làm giới hạn lượt con mặc định. Công cụ không chấp nhận giá trị ghi đè thời gian chờ
theo từng lệnh gọi (`runTimeoutSeconds`/`timeoutSeconds` bị từ chối kèm lỗi
yêu cầu cấu hình giá trị mặc định).

<ParamField path="model" type="string">
  Giá trị ghi đè mô hình tường minh cho phiên ACP con. Các thao tác khởi tạo Codex ACP
  chuẩn hóa các tham chiếu OpenAI như `openai/gpt-5.4` thành cấu hình khởi động Codex ACP
  trước `session/new`; các dạng có dấu gạch chéo như `openai/gpt-5.4/high` cũng đặt
  mức độ suy luận của Codex ACP. Khi bỏ qua, `sessions_spawn({ runtime: "acp" })`
  sử dụng các giá trị mặc định hiện có về mô hình subagent (`agents.defaults.subagents.model` hoặc
  `agents.list[].subagents.model`) khi được cấu hình; nếu không, nó cho phép
  harness ACP sử dụng mô hình mặc định riêng. Các harness khác phải công bố ACP
  `models` và hỗ trợ `session/set_model`; nếu không, OpenClaw/acpx sẽ báo lỗi
  rõ ràng thay vì âm thầm dùng mô hình mặc định của agent đích.
</ParamField>
<ParamField path="thinking" type="string">
  Mức độ tư duy/suy luận tường minh. Đối với Codex ACP, `minimal` ánh xạ thành mức
  thấp, `low`/`medium`/`high`/`xhigh` ánh xạ trực tiếp, còn `off` bỏ qua
  giá trị ghi đè mức độ suy luận khi khởi động. Khi bỏ qua, các thao tác khởi tạo ACP sử dụng
  các giá trị mặc định hiện có về tư duy của subagent và
  `agents.defaults.models["provider/model"].params.thinking` theo từng mô hình cho mô hình
  đã chọn.
</ParamField>

## Chế độ liên kết và luồng hội thoại khi khởi tạo

<Tabs>
  <Tab title="--bind here|off">
    | Chế độ   | Hành vi                                                               |
    | ------ | ----------------------------------------------------------------------- |
    | `here` | Liên kết tại chỗ cuộc trò chuyện đang hoạt động hiện tại; thất bại nếu không có cuộc trò chuyện nào đang hoạt động. |
    | `off`  | Không tạo liên kết với cuộc trò chuyện hiện tại.                          |

    Ghi chú:

    - `--bind here` là cách đơn giản nhất để người vận hành “dùng Codex làm backend cho kênh hoặc cuộc trò chuyện này”.
    - `--bind here` không tạo luồng hội thoại con.
    - `--bind here` chỉ khả dụng trên các kênh cung cấp khả năng liên kết cuộc trò chuyện hiện tại.
    - Không thể kết hợp `--bind` và `--thread` trong cùng một lệnh gọi `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Chế độ   | Hành vi                                                                                            |
    | ------ | ------------------------------------------------------------------------------------------------- |
    | `auto` | Trong một luồng hội thoại đang hoạt động: liên kết luồng đó. Ngoài luồng hội thoại: tạo/liên kết một luồng hội thoại con khi được hỗ trợ. |
    | `here` | Yêu cầu luồng hội thoại hiện đang hoạt động; thất bại nếu không ở trong luồng hội thoại.                                                  |
    | `off`  | Không liên kết. Phiên khởi động ở trạng thái không liên kết.                                                                 |

    Ghi chú:

    - Trên các bề mặt liên kết không hỗ trợ luồng hội thoại, hành vi mặc định về cơ bản là `off`.
    - Khởi tạo có liên kết luồng hội thoại yêu cầu chính sách kênh hỗ trợ:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Sử dụng `--bind here` khi bạn muốn ghim cuộc trò chuyện hiện tại mà không tạo luồng hội thoại con.

  </Tab>
</Tabs>

## Mô hình phân phối

Các phiên ACP có thể là không gian làm việc tương tác hoặc công việc nền do phiên cha sở hữu.
Đường dẫn phân phối phụ thuộc vào dạng đó.

<AccordionGroup>
  <Accordion title="Phiên ACP tương tác">
    Các phiên tương tác được thiết kế để tiếp tục trò chuyện trên một bề mặt trò chuyện hiển thị:

    - `/acp spawn ... --bind here` liên kết cuộc trò chuyện hiện tại với phiên ACP.
    - `/acp spawn ... --thread ...` liên kết một luồng/chủ đề của kênh với phiên ACP.
    - `bindings[].type="acp"` được cấu hình lâu dài định tuyến các cuộc trò chuyện khớp đến cùng một phiên ACP.

    Các tin nhắn tiếp theo trong cuộc trò chuyện đã liên kết được định tuyến trực tiếp đến phiên ACP,
    và đầu ra ACP được phân phối trở lại cùng
    kênh/luồng/chủ đề đó.

    Nội dung OpenClaw gửi đến harness:

    - Các lượt theo dõi liên kết thông thường được gửi dưới dạng văn bản lời nhắc, kèm tệp đính kèm chỉ khi bộ kiểm thử/backend hỗ trợ.
    - Các lệnh quản lý `/acp` và lệnh Gateway cục bộ được chặn trước khi điều phối ACP.
    - Các sự kiện hoàn tất do runtime tạo ra được hiện thực hóa theo từng đích. Các agent OpenClaw nhận phong bì ngữ cảnh runtime nội bộ của OpenClaw; các bộ kiểm thử ACP bên ngoài nhận lời nhắc thuần túy chứa kết quả của tiến trình con và chỉ dẫn. Không bao giờ được gửi phong bì `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` thô tới các bộ kiểm thử bên ngoài hoặc lưu nó dưới dạng văn bản bản ghi người dùng ACP.
    - Các mục bản ghi ACP sử dụng văn bản kích hoạt hiển thị cho người dùng hoặc lời nhắc hoàn tất thuần túy. Siêu dữ liệu sự kiện nội bộ vẫn được giữ ở dạng có cấu trúc trong OpenClaw khi có thể và không được coi là nội dung trò chuyện do người dùng soạn.

  </Accordion>
  <Accordion title="Các phiên ACP một lần do tiến trình cha sở hữu">
    Các phiên ACP một lần được tạo bởi một lượt chạy agent khác là các tiến trình con
    chạy nền, tương tự như các agent con:

    - Tiến trình cha yêu cầu thực hiện công việc bằng `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Tiến trình con chạy trong phiên bộ kiểm thử ACP riêng.
    - Các lượt của tiến trình con chạy trên cùng làn nền được các lần tạo agent con gốc sử dụng, vì vậy một bộ kiểm thử ACP chậm không chặn công việc không liên quan trong phiên chính.
    - Báo cáo hoàn tất được gửi lại qua đường dẫn thông báo hoàn tất tác vụ. OpenClaw chuyển đổi siêu dữ liệu hoàn tất nội bộ thành lời nhắc ACP thuần túy trước khi gửi tới bộ kiểm thử bên ngoài, vì vậy các bộ kiểm thử không thấy các dấu ngữ cảnh runtime chỉ dành cho OpenClaw.
    - Tiến trình cha viết lại kết quả của tiến trình con bằng giọng trợ lý thông thường khi cần phản hồi hiển thị cho người dùng.

    **Không** coi đường dẫn này là cuộc trò chuyện ngang hàng giữa tiến trình cha và
    tiến trình con. Tiến trình con đã có một kênh hoàn tất để gửi lại cho tiến trình cha.

  </Accordion>
  <Accordion title="sessions_send và phân phối A2A">
    `sessions_send` có thể nhắm tới một phiên khác sau khi tạo. Đối với các phiên ngang hàng
    thông thường, OpenClaw sử dụng đường dẫn theo dõi agent-tới-agent (A2A) sau khi
    chèn thông điệp:

    - Chờ phản hồi của phiên đích.
    - Tùy chọn cho phép bên yêu cầu và đích trao đổi một số lượng hữu hạn các lượt theo dõi.
    - Yêu cầu đích tạo thông điệp thông báo.
    - Phân phối thông báo đó tới kênh hoặc luồng hiển thị.

    Đường dẫn A2A đó là phương án dự phòng cho các lượt gửi ngang hàng khi bên gửi cần
    một lượt theo dõi hiển thị. Nó vẫn được bật khi một phiên không liên quan có thể thấy và
    gửi thông điệp đến đích ACP, ví dụ trong các cài đặt `tools.sessions.visibility`
    rộng.

    OpenClaw chỉ bỏ qua lượt theo dõi A2A khi bên yêu cầu là tiến trình cha của
    chính tiến trình con ACP một lần do tiến trình cha sở hữu. Trong trường hợp đó, việc chạy A2A chồng lên
    quá trình hoàn tất tác vụ có thể đánh thức tiến trình cha bằng kết quả của tiến trình con, chuyển tiếp
    phản hồi của tiến trình cha trở lại tiến trình con và tạo vòng lặp vọng lại
    giữa tiến trình cha/tiến trình con. Kết quả `sessions_send` báo cáo `delivery.status="skipped"` cho
    trường hợp tiến trình con được sở hữu đó vì đường dẫn hoàn tất đã chịu trách nhiệm
    về kết quả.

  </Accordion>
  <Accordion title="Tiếp tục một phiên hiện có">
    Sử dụng `resumeSessionId` để tiếp tục một phiên ACP trước đó thay vì
    bắt đầu mới. Agent phát lại lịch sử hội thoại qua
    `session/load`, nhờ đó tiếp tục với đầy đủ ngữ cảnh trước đó.

    ```json
    {
      "task": "Tiếp tục từ chỗ chúng ta đã dừng - sửa các lỗi kiểm thử còn lại",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Các trường hợp sử dụng phổ biến:

    - Chuyển giao một phiên Codex từ máy tính xách tay sang điện thoại - yêu cầu agent tiếp tục từ chỗ bạn đã dừng.
    - Tiếp tục một phiên lập trình mà bạn đã bắt đầu tương tác trong CLI, giờ đây chạy không giao diện thông qua agent.
    - Tiếp tục công việc bị gián đoạn do Gateway khởi động lại hoặc hết thời gian chờ khi không hoạt động.

    Lưu ý:

    - `resumeSessionId` chỉ áp dụng khi `runtime: "acp"`; runtime agent con mặc định bỏ qua trường chỉ dành cho ACP này.
    - `streamTo` chỉ áp dụng khi `runtime: "acp"`; runtime agent con mặc định bỏ qua trường chỉ dành cho ACP này.
    - `resumeSessionId` là mã tiếp tục ACP/bộ kiểm thử cục bộ trên máy chủ, không phải khóa phiên kênh OpenClaw; OpenClaw vẫn kiểm tra chính sách tạo ACP và chính sách agent đích trước khi điều phối, còn backend ACP hoặc bộ kiểm thử chịu trách nhiệm cấp quyền để tải mã nguồn ngược đó.
    - `resumeSessionId` khôi phục lịch sử hội thoại ACP nguồn ngược; `thread` và `mode` vẫn áp dụng bình thường cho phiên OpenClaw mới mà bạn đang tạo, vì vậy `mode: "session"` vẫn yêu cầu `thread: true`.
    - Agent đích phải hỗ trợ `session/load` (Codex và Claude Code đều hỗ trợ).
    - Nếu không tìm thấy mã phiên, thao tác tạo sẽ thất bại với lỗi rõ ràng - không âm thầm chuyển sang phiên mới.

  </Accordion>
  <Accordion title="Kiểm thử nhanh sau khi triển khai">
    Sau khi triển khai Gateway, hãy chạy kiểm tra trực tiếp từ đầu đến cuối thay vì tin tưởng
    các kiểm thử đơn vị:

    1. Xác minh phiên bản và commit của Gateway đã triển khai trên máy chủ đích.
    2. Mở một phiên cầu nối ACPX tạm thời tới một agent trực tiếp.
    3. Yêu cầu agent đó gọi `sessions_spawn` với `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` và tác vụ `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Xác minh `accepted=yes`, một `childSessionKey` thực và không có lỗi trình xác thực.
    5. Dọn dẹp phiên cầu nối tạm thời.

    Giữ cổng kiểm soát trên `mode: "run"` và bỏ qua `streamTo: "parent"` -
    `mode: "session"` liên kết với luồng và các đường dẫn chuyển tiếp luồng là những lượt
    tích hợp phong phú hơn riêng biệt.

  </Accordion>
</AccordionGroup>

## Khả năng tương thích với sandbox

Các phiên ACP hiện chạy trên runtime máy chủ, **không** chạy bên trong sandbox
OpenClaw.

<Warning>
**Ranh giới bảo mật:**

- Bộ kiểm thử bên ngoài có thể đọc/ghi theo quyền CLI riêng và `cwd` đã chọn.
- Chính sách sandbox của OpenClaw **không** bao bọc việc thực thi bộ kiểm thử ACP.
- OpenClaw vẫn thực thi các cổng tính năng ACP, agent được phép, quyền sở hữu phiên, liên kết kênh và chính sách phân phối Gateway.
- Sử dụng `runtime: "subagent"` cho công việc gốc OpenClaw được sandbox thực thi.

</Warning>

Các hạn chế hiện tại:

- Nếu phiên yêu cầu được sandbox, việc tạo ACP bị chặn cho cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
- `sessions_spawn` với `runtime: "acp"` không hỗ trợ `sandbox: "require"`.

## Phân giải đích phiên

Hầu hết hành động `/acp` chấp nhận một đích phiên tùy chọn (`session-key`,
`session-id` hoặc `session-label`).

**Thứ tự phân giải:**

1. Đối số đích tường minh (hoặc `--session` cho `/acp steer`)
   - thử khóa
   - sau đó là mã phiên có dạng UUID
   - sau đó là nhãn
2. Liên kết luồng hiện tại (nếu cuộc hội thoại/luồng này được liên kết với một phiên ACP).
3. Phương án dự phòng là phiên của bên yêu cầu hiện tại.

Cả liên kết cuộc hội thoại hiện tại và liên kết luồng đều tham gia bước 2.

Nếu không phân giải được đích nào, OpenClaw trả về lỗi rõ ràng
(`Unable to resolve session target: ...`).

## Các điều khiển ACP

| Lệnh                 | Chức năng                                                  | Ví dụ                                                         |
| -------------------- | --------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tạo phiên ACP; tùy chọn liên kết hiện tại hoặc liên kết luồng. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hủy lượt đang thực hiện cho phiên đích.                   | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Gửi chỉ dẫn điều hướng tới phiên đang chạy.               | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Đóng phiên và hủy liên kết các đích luồng.                | `/acp close`                                                  |
| `/acp status`        | Hiển thị backend, chế độ, trạng thái, tùy chọn runtime, khả năng. | `/acp status`                                                 |
| `/acp set-mode`      | Đặt chế độ runtime cho phiên đích.                        | `/acp set-mode plan`                                          |
| `/acp set`           | Ghi tùy chọn cấu hình runtime chung.                      | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Đặt giá trị ghi đè thư mục làm việc của runtime.          | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Đặt hồ sơ chính sách phê duyệt.                           | `/acp permissions strict`                                     |
| `/acp timeout`       | Đặt thời gian chờ runtime (giây).                         | `/acp timeout 120`                                            |
| `/acp model`         | Đặt giá trị ghi đè mô hình runtime.                       | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Xóa các giá trị ghi đè tùy chọn runtime của phiên.        | `/acp reset-options`                                          |
| `/acp sessions`      | Liệt kê các phiên ACP gần đây từ kho lưu trữ.             | `/acp sessions`                                               |
| `/acp doctor`        | Tình trạng backend, khả năng, các cách khắc phục có thể thực hiện. | `/acp doctor`                                                 |
| `/acp install`       | In các bước cài đặt và bật có tính xác định.              | `/acp install`                                                |

Các điều khiển runtime (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` và `reset-options`) yêu cầu
danh tính chủ sở hữu từ các kênh bên ngoài và `operator.admin` từ các máy khách
Gateway nội bộ. Bên gửi không phải chủ sở hữu nhưng được cấp quyền vẫn có thể sử dụng `sessions`,
`doctor`, `install` và `help`. Đối với bên gửi không phải chủ sở hữu, `/acp sessions`
chỉ liệt kê phiên đang được liên kết hoặc phiên của bên yêu cầu; danh tính chủ sở hữu và
máy khách `operator.admin` thấy tất cả các phiên gần đây.

`/acp status` hiển thị các tùy chọn runtime có hiệu lực cùng các mã định danh phiên
cấp runtime và cấp backend. Lỗi điều khiển không được hỗ trợ được hiển thị
rõ ràng khi backend thiếu một khả năng. Các lệnh chấp nhận token đích
(`session-key`, `session-id` hoặc `session-label`) phân giải chúng thông qua cơ chế khám phá phiên của Gateway,
bao gồm các gốc `session.store` tùy chỉnh theo từng agent. `/acp sessions`
không chấp nhận token đích.

### Ánh xạ tùy chọn runtime

`/acp` có các lệnh tiện ích và một trình đặt chung. Các thao tác tương đương:

| Lệnh                         | Ánh xạ tới                            | Ghi chú                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | khóa cấu hình runtime `model`           | Đối với Codex ACP, OpenClaw chuẩn hóa `openai/<model>` thành id mô hình của bộ điều hợp và ánh xạ các hậu tố suy luận dạng dấu gạch chéo như `openai/gpt-5.4/high` thành `reasoning_effort`.                                         |
| `/acp set thinking <level>`  | tùy chọn chuẩn `thinking`          | OpenClaw gửi giá trị tương đương do backend công bố khi có, ưu tiên `thinking`, sau đó là `effort`, `reasoning_effort` hoặc `thought_level`. Đối với Codex ACP, bộ điều hợp ánh xạ các giá trị thành `reasoning_effort`. |
| `/acp permissions <profile>` | tùy chọn chuẩn `permissionProfile` | OpenClaw gửi giá trị tương đương do backend công bố khi có, chẳng hạn như `approval_policy`, `permission_profile`, `permissions` hoặc `permission_mode`.                                                       |
| `/acp timeout <seconds>`     | tùy chọn chuẩn `timeoutSeconds`    | OpenClaw gửi giá trị tương đương do backend công bố khi có, chẳng hạn như `timeout` hoặc `timeout_seconds`.                                                                                                     |
| `/acp cwd <path>`            | ghi đè cwd của runtime                 | Cập nhật trực tiếp.                                                                                                                                                                                             |
| `/acp set <key> <value>`     | chung                              | `key=cwd` sử dụng đường dẫn ghi đè cwd.                                                                                                                                                                      |
| `/acp reset-options`         | xóa tất cả ghi đè runtime         | -                                                                                                                                                                                                          |

## Harness acpx, thiết lập plugin và quyền

Để biết cấu hình harness acpx (các bí danh Claude Code / Codex / Gemini CLI),
các cầu nối MCP plugin-tools và OpenClaw-tools cũng như các chế độ quyền ACP,
hãy xem [Tác nhân ACP - thiết lập](/vi/tools/acp-agents-setup).

## Khắc phục sự cố

| Triệu chứng                                                                                   | Nguyên nhân có thể                                                                                                           | Cách khắc phục                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | Plugin backend bị thiếu, bị vô hiệu hóa hoặc bị `plugins.allow` chặn.                                                       | Cài đặt và bật plugin backend, thêm `acpx` vào `plugins.allow` khi danh sách cho phép đó được thiết lập, sau đó chạy `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP bị vô hiệu hóa trên toàn hệ thống.                                                                                                 | Đặt `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Điều phối tự động từ các tin nhắn luồng thông thường bị vô hiệu hóa.                                                               | Đặt `acp.dispatch.enabled=true` để tiếp tục định tuyến luồng tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` tường minh vẫn hoạt động.                                      |
| `ACP agent "<id>" is not allowed by policy`                                               | Tác nhân không có trong danh sách cho phép.                                                                                                | Sử dụng `agentId` được phép hoặc cập nhật `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` báo backend chưa sẵn sàng ngay sau khi khởi động                               | Plugin backend bị thiếu, bị vô hiệu hóa, bị chính sách cho phép/từ chối chặn hoặc tệp thực thi đã cấu hình không khả dụng.        | Cài đặt/bật plugin backend, chạy lại `/acp doctor` và kiểm tra lỗi cài đặt hoặc lỗi chính sách của backend nếu trạng thái vẫn không ổn định.                                           |
| Không tìm thấy lệnh harness                                                                 | CLI của bộ điều hợp chưa được cài đặt, plugin bên ngoài bị thiếu hoặc lần tải `npx` đầu tiên cho bộ điều hợp không phải Codex đã thất bại. | Chạy `/acp doctor`, cài đặt/làm nóng trước bộ điều hợp trên máy chủ Gateway hoặc cấu hình tường minh lệnh tác nhân acpx.                                                      |
| Harness báo không tìm thấy mô hình                                                          | id mô hình hợp lệ với nhà cung cấp/harness khác nhưng không hợp lệ với đích ACP này.                                                | Sử dụng mô hình do harness đó liệt kê, cấu hình mô hình trong harness hoặc bỏ qua giá trị ghi đè.                                                                            |
| Lỗi xác thực nhà cung cấp từ harness                                                        | OpenClaw hoạt động bình thường nhưng CLI/nhà cung cấp đích chưa đăng nhập.                                                     | Đăng nhập hoặc cung cấp khóa nhà cung cấp bắt buộc trong môi trường máy chủ Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                                   | Token khóa/id/nhãn không hợp lệ.                                                                                                | Chạy `/acp sessions`, sao chép chính xác khóa/nhãn rồi thử lại.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` được sử dụng khi không có cuộc hội thoại đang hoạt động và có thể liên kết.                                                            | Chuyển tới cuộc trò chuyện/kênh đích rồi thử lại hoặc sử dụng thao tác tạo không liên kết.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | Bộ điều hợp không có khả năng liên kết ACP với cuộc hội thoại hiện tại.                                                             | Sử dụng `/acp spawn ... --thread ...` ở nơi được hỗ trợ, cấu hình `bindings[]` cấp cao nhất hoặc chuyển tới kênh được hỗ trợ.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` được sử dụng bên ngoài ngữ cảnh luồng.                                                                         | Chuyển tới luồng đích hoặc sử dụng `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Một người dùng khác sở hữu đích liên kết đang hoạt động.                                                                           | Liên kết lại với tư cách chủ sở hữu hoặc sử dụng cuộc hội thoại hay luồng khác.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | Bộ điều hợp không có khả năng liên kết luồng.                                                                               | Sử dụng `--thread off` hoặc chuyển tới bộ điều hợp/kênh được hỗ trợ.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | Runtime ACP chạy phía máy chủ; phiên của bên yêu cầu nằm trong sandbox.                                                              | Sử dụng `runtime="subagent"` từ các phiên trong sandbox hoặc thực hiện thao tác tạo ACP từ một phiên không nằm trong sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | `sandbox="require"` được yêu cầu cho runtime ACP.                                                                         | Sử dụng `runtime="subagent"` khi bắt buộc phải dùng sandbox hoặc sử dụng ACP với `sandbox="inherit"` từ một phiên không nằm trong sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                                | Harness đích không cung cấp tính năng chuyển đổi mô hình ACP chung.                                                        | Sử dụng harness công bố ACP `models`/`session/set_model`, sử dụng tham chiếu mô hình Codex ACP hoặc cấu hình mô hình trực tiếp trong harness nếu nó có cờ khởi động riêng. |
| Thiếu siêu dữ liệu ACP cho phiên đã liên kết                                                    | Siêu dữ liệu phiên ACP đã cũ/bị xóa.                                                                                    | Tạo lại bằng `/acp spawn`, sau đó liên kết lại/tập trung vào luồng.                                                                                                                    |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` chặn thao tác ghi/thực thi trong phiên ACP không tương tác.                                                    | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại Gateway. Xem [Cấu hình quyền](/vi/tools/acp-agents-setup#permission-configuration). |
| Phiên ACP thất bại sớm với rất ít đầu ra                                                | Các lời nhắc cấp quyền bị `permissionMode`/`nonInteractivePermissions` chặn.                                        | Kiểm tra nhật ký Gateway để tìm `AcpRuntimeError`. Để có đầy đủ quyền, đặt `permissionMode=approve-all`; để suy giảm chức năng có kiểm soát, đặt `nonInteractivePermissions=deny`.        |
| Phiên ACP bị treo vô thời hạn sau khi hoàn thành công việc                                     | Tiến trình harness đã kết thúc nhưng phiên ACP không báo hoàn tất.                                                    | Cập nhật OpenClaw; cơ chế dọn dẹp acpx hiện tại sẽ thu hồi các tiến trình bộ điều hợp và trình bao cũ do OpenClaw sở hữu khi đóng và khi Gateway khởi động.                                             |
| Harness thấy `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | Phong bì sự kiện nội bộ bị rò rỉ qua ranh giới ACP.                                                                | Cập nhật OpenClaw và chạy lại luồng hoàn tất; các harness bên ngoài chỉ nên nhận lời nhắc hoàn tất dạng văn bản thuần túy.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` thuộc về
cơ chế chuyển tiếp hook Codex gốc, không phải ACP/acpx. Trong một cuộc trò chuyện Codex đã liên kết, hãy bắt đầu
phiên mới bằng `/new` hoặc `/reset`; nếu thao tác này hoạt động một lần rồi lỗi quay lại trong
lần gọi công cụ gốc tiếp theo, hãy khởi động lại app-server Codex hoặc OpenClaw Gateway
thay vì lặp lại `/new`. Xem
[Khắc phục sự cố harness Codex](/vi/plugins/codex-harness#troubleshooting).
</Note>

## Liên quan

- [Tác nhân ACP - thiết lập](/vi/tools/acp-agents-setup)
- [Gửi tác nhân](/vi/tools/agent-send)
- [Backend CLI](/vi/gateway/cli-backends)
- [Bộ kiểm thử Codex](/vi/plugins/codex-harness)
- [Môi trường chạy bộ kiểm thử Codex](/vi/plugins/codex-harness-runtime)
- [Công cụ sandbox đa tác nhân](/vi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (chế độ cầu nối)](/vi/cli/acp)
- [Tác nhân phụ](/vi/tools/subagents)
