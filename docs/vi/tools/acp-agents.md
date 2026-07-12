---
read_when:
    - Chạy các khung thực thi lập trình thông qua ACP
    - Thiết lập các phiên ACP gắn với cuộc trò chuyện trên các kênh nhắn tin
    - Liên kết một cuộc hội thoại trên kênh nhắn tin với một phiên ACP lâu dài
    - Khắc phục sự cố backend ACP, kết nối Plugin hoặc chuyển kết quả hoàn tất
    - Thực thi các lệnh /acp từ cuộc trò chuyện
sidebarTitle: ACP agents
summary: Chạy các bộ khung lập trình bên ngoài (Claude Code, Cursor, Gemini CLI, Codex ACP tường minh, OpenClaw ACP, OpenCode) thông qua phần phụ trợ ACP
title: Tác nhân ACP
x-i18n:
    generated_at: "2026-07-12T08:22:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 68f5a5588710bea3027583bf06587706eb476d3ad1a31b0ef798586fcb895aa9
    source_path: tools/acp-agents.md
    workflow: 16
---

[Các phiên Agent Client Protocol (ACP)](https://agentclientprotocol.com/) cho phép
OpenClaw chạy các môi trường điều phối lập trình bên ngoài (Claude Code, Cursor, Copilot, Droid,
OpenClaw ACP, OpenCode, Gemini CLI và các môi trường ACPX được hỗ trợ khác)
thông qua một Plugin backend ACP. Mỗi lần khởi tạo đều được theo dõi dưới dạng
[tác vụ nền](/vi/automation/tasks).

<Note>
**ACP là đường dẫn dành cho môi trường điều phối bên ngoài, không phải đường dẫn Codex mặc định.** Plugin
máy chủ ứng dụng Codex gốc quản lý các lệnh điều khiển `/codex ...` và runtime nhúng
`openai/gpt-*` mặc định cho các lượt của tác nhân; ACP quản lý các lệnh điều khiển `/acp ...`
và các phiên `sessions_spawn({ runtime: "acp" })`.

Để cho phép Codex hoặc Claude Code kết nối trực tiếp dưới dạng máy khách MCP bên ngoài với
các cuộc hội thoại kênh OpenClaw hiện có, hãy sử dụng
[`openclaw mcp serve`](/vi/cli/mcp) thay vì ACP.
</Note>

## Tôi cần trang nào?

| Bạn muốn...                                                                                     | Sử dụng                               | Ghi chú                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liên kết hoặc điều khiển Codex trong cuộc hội thoại hiện tại                                    | `/codex bind`, `/codex threads`       | Đường dẫn máy chủ ứng dụng Codex gốc khi Plugin `codex` được bật: trả lời trong cuộc trò chuyện đã liên kết, chuyển tiếp hình ảnh, mô hình/chế độ nhanh/quyền, dừng và điều hướng. ACP là phương án dự phòng tường minh |
| Chạy Claude Code, Gemini CLI, Codex ACP tường minh hoặc một môi trường điều phối bên ngoài khác _thông qua_ OpenClaw | Trang này                             | Các phiên liên kết với cuộc trò chuyện, `/acp spawn`, `sessions_spawn({ runtime: "acp" })`, tác vụ nền, lệnh điều khiển runtime                                                            |
| Cung cấp một phiên OpenClaw Gateway _dưới dạng_ máy chủ ACP cho trình soạn thảo hoặc máy khách   | [`openclaw acp`](/vi/cli/acp)            | Chế độ cầu nối: IDE/máy khách giao tiếp bằng ACP với OpenClaw qua stdio/WebSocket                                                                                                         |
| Tái sử dụng một CLI AI cục bộ làm mô hình dự phòng chỉ xử lý văn bản                            | [Backend CLI](/vi/gateway/cli-backends)  | Không phải ACP: không có công cụ OpenClaw, không có lệnh điều khiển ACP, không có runtime của môi trường điều phối                                                                          |

## Tính năng này có hoạt động ngay không?

Có, sau khi cài đặt Plugin runtime ACP chính thức:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Các bản mã nguồn đã kiểm xuất có thể sử dụng Plugin không gian làm việc `extensions/acpx` cục bộ sau khi
chạy `pnpm install`. Chạy `/acp doctor` để kiểm tra trạng thái sẵn sàng.

OpenClaw chỉ hướng dẫn tác nhân về cách khởi tạo ACP khi ACP **thực sự khả dụng**:
ACP phải được bật, việc điều phối không được vô hiệu hóa, phiên hiện tại không bị
sandbox chặn và một backend runtime phải được tải cũng như hoạt động bình thường. Nếu
bất kỳ điều kiện nào không đạt, Skills ACP và hướng dẫn ACP cho `sessions_spawn` sẽ bị ẩn
để tác nhân không đề xuất một backend không khả dụng.

<AccordionGroup>
  <Accordion title="Những điểm dễ gặp sự cố khi chạy lần đầu">
    - Nếu `plugins.allow` được thiết lập, đây là danh mục Plugin mang tính hạn chế và **phải** bao gồm `acpx`, nếu không backend ACP đã cài đặt sẽ bị chặn có chủ đích (`/acp doctor` báo cáo mục còn thiếu trong danh sách cho phép).
    - Bộ chuyển đổi Codex ACP đi kèm với Plugin `acpx` và sẽ khởi chạy cục bộ khi có thể.
    - Codex ACP chạy với một `CODEX_HOME` biệt lập. OpenClaw sao chép các mục tin cậy của dự án cùng cấu hình định tuyến mô hình/nhà cung cấp an toàn (`model`, `model_provider`, `model_reasoning_effort`, `sandbox_mode` và các trường `model_providers.<name>` an toàn) từ cấu hình Codex của máy chủ; thông tin xác thực, thông báo và hook chỉ được giữ trong cấu hình máy chủ.
    - Các bộ chuyển đổi cho môi trường điều phối đích khác có thể được tải xuống theo nhu cầu bằng `npx` trong lần sử dụng đầu tiên.
    - Thông tin xác thực của nhà cung cấp phải tồn tại sẵn trên máy chủ cho môi trường điều phối đó.
    - Nếu máy chủ không có npm hoặc quyền truy cập mạng, việc tải bộ chuyển đổi trong lần chạy đầu tiên sẽ thất bại cho đến khi bộ nhớ đệm được làm nóng trước hoặc bộ chuyển đổi được cài đặt theo cách khác.

  </Accordion>
  <Accordion title="Điều kiện tiên quyết của runtime">
    ACP khởi chạy một tiến trình môi trường điều phối bên ngoài thực sự. OpenClaw quản lý việc định tuyến,
    trạng thái tác vụ nền, phân phối, liên kết và chính sách; môi trường điều phối quản lý
    đăng nhập nhà cung cấp, danh mục mô hình, hành vi hệ thống tệp và các công cụ gốc của nó.

    Trước khi quy lỗi cho OpenClaw, hãy xác minh:

    - `/acp doctor` báo cáo một backend đã bật và hoạt động bình thường.
    - ID đích được `acp.allowedAgents` cho phép khi danh sách cho phép đó được thiết lập.
    - Lệnh của môi trường điều phối có thể khởi chạy trên máy chủ Gateway.
    - Thông tin xác thực nhà cung cấp hiện diện cho môi trường điều phối đó (`claude`, `codex`, `gemini`, `opencode`, `droid`, v.v.).
    - Mô hình đã chọn tồn tại cho môi trường điều phối đó — ID mô hình không thể dùng chung giữa các môi trường điều phối.
    - `cwd` được yêu cầu tồn tại và có thể truy cập, hoặc bỏ qua `cwd` và để backend sử dụng giá trị mặc định.
    - Chế độ quyền phù hợp với công việc. Các phiên không tương tác không thể nhấp vào lời nhắc cấp quyền gốc, vì vậy những lượt chạy lập trình cần nhiều thao tác ghi/thực thi thường cần một hồ sơ quyền ACPX có thể tiếp tục mà không cần giao diện tương tác.

  </Accordion>
</AccordionGroup>

Các công cụ Plugin OpenClaw và công cụ OpenClaw tích hợp sẵn **không** được cung cấp cho
các môi trường điều phối ACP theo mặc định. Chỉ bật các cầu nối MCP tường minh trong
[Thiết lập tác nhân ACP](/vi/tools/acp-agents-setup) khi môi trường điều phối cần
gọi trực tiếp các công cụ đó.

## Các môi trường điều phối đích được hỗ trợ

Với backend `acpx`, hãy sử dụng các ID này làm đích cho `/acp spawn <id>` hoặc
`sessions_spawn({ runtime: "acp", agentId: "<id>" })`:

| ID môi trường điều phối | Backend điển hình                               | Ghi chú                                                                                       |
| ----------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `claude`                | Bộ chuyển đổi Claude Code ACP                  | Yêu cầu thông tin xác thực Claude Code trên máy chủ.                                           |
| `codex`                 | Bộ chuyển đổi Codex ACP                        | Chỉ là phương án dự phòng ACP tường minh khi `/codex` gốc không khả dụng hoặc ACP được yêu cầu. |
| `copilot`               | Bộ chuyển đổi GitHub Copilot ACP               | Yêu cầu thông tin xác thực CLI/runtime của Copilot.                                            |
| `cursor`                | Cursor CLI ACP (`cursor-agent acp`)            | Ghi đè lệnh acpx nếu bản cài đặt cục bộ cung cấp một điểm vào ACP khác.                         |
| `droid`                 | Factory Droid CLI                              | Yêu cầu thông tin xác thực Factory/Droid hoặc `FACTORY_API_KEY` trong môi trường điều phối.     |
| `fast-agent`            | Bộ chuyển đổi fast-agent-mcp ACP               | Được tải xuống theo nhu cầu bằng `uvx`.                                                        |
| `gemini`                | Bộ chuyển đổi Gemini CLI ACP                   | Yêu cầu thông tin xác thực Gemini CLI hoặc thiết lập khóa API.                                 |
| `iflow`                 | iFlow CLI                                      | Tính khả dụng của bộ chuyển đổi và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.    |
| `kilocode`              | Kilo Code CLI                                  | Tính khả dụng của bộ chuyển đổi và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.    |
| `kimi`                  | Kimi/Moonshot CLI                              | Yêu cầu thông tin xác thực Kimi/Moonshot trên máy chủ.                                         |
| `kiro`                  | Kiro CLI                                       | Tính khả dụng của bộ chuyển đổi và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.    |
| `mux`                   | Bộ chuyển đổi Mux CLI ACP                      | Được tải xuống theo nhu cầu bằng `npx`.                                                        |
| `opencode`              | Bộ chuyển đổi OpenCode ACP                     | Yêu cầu thông tin xác thực CLI/nhà cung cấp của OpenCode.                                      |
| `openclaw`              | Cầu nối OpenClaw Gateway thông qua `openclaw acp` | Cho phép một môi trường điều phối hỗ trợ ACP giao tiếp ngược lại với một phiên OpenClaw Gateway. |
| `qoder`                 | Qoder CLI                                      | Tính khả dụng của bộ chuyển đổi và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.    |
| `qwen`                  | Qwen Code / Qwen CLI                           | Yêu cầu thông tin xác thực tương thích với Qwen trên máy chủ.                                  |
| `trae`                  | Bộ chuyển đổi Trae CLI ACP                     | Tính khả dụng của bộ chuyển đổi và khả năng điều khiển mô hình phụ thuộc vào CLI đã cài đặt.    |

`pi` (pi-acp) cũng được đăng ký trong backend acpx nhưng không phải là một môi trường
điều phối lập trình theo cùng nghĩa với các mục khác ở trên.

Có thể cấu hình các bí danh tác nhân acpx tùy chỉnh trong chính acpx, nhưng chính sách OpenClaw
vẫn kiểm tra `acp.allowedAgents` và mọi ánh xạ
`agents.list[].runtime.acp.agent` trước khi điều phối.

## Sổ tay vận hành

Luồng `/acp` nhanh từ cuộc trò chuyện:

<Steps>
  <Step title="Khởi tạo">
    `/acp spawn claude --bind here`,
    `/acp spawn gemini --mode persistent --thread auto` hoặc
    `/acp spawn codex --bind here` tường minh.
  </Step>
  <Step title="Làm việc">
    Tiếp tục trong cuộc hội thoại hoặc luồng đã liên kết (hoặc chỉ định tường minh
    khóa phiên).
  </Step>
  <Step title="Kiểm tra trạng thái">
    `/acp status`
  </Step>
  <Step title="Điều chỉnh">
    `/acp model <provider/model>`, `/acp permissions <profile>`,
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
    - Việc khởi tạo tạo mới hoặc tiếp tục một phiên runtime ACP, ghi lại siêu dữ liệu ACP trong kho phiên OpenClaw và có thể tạo một tác vụ nền khi lượt chạy thuộc quyền sở hữu của tác vụ cha.
    - Các phiên ACP do tác vụ cha sở hữu được xem là công việc nền ngay cả khi phiên runtime là liên tục; quá trình hoàn tất và phân phối giữa các bề mặt đi qua trình thông báo của tác vụ cha thay vì hoạt động như một phiên trò chuyện thông thường hướng đến người dùng.
    - Quá trình bảo trì tác vụ đóng các phiên ACP một lần do tác vụ cha sở hữu khi chúng đã kết thúc hoặc bị mồ côi. Các phiên ACP liên tục được giữ lại khi vẫn còn một liên kết cuộc hội thoại đang hoạt động; các phiên liên tục cũ không có liên kết hoạt động sẽ bị đóng để chúng không thể âm thầm được tiếp tục sau khi tác vụ sở hữu đã hoàn tất hoặc bản ghi tác vụ không còn tồn tại.
    - Các tin nhắn tiếp theo trong liên kết được gửi trực tiếp đến phiên ACP cho đến khi liên kết bị đóng, bỏ tập trung, đặt lại hoặc hết hạn.
    - Các lệnh Gateway được xử lý cục bộ. `/acp ...`, `/status` và `/unfocus` không bao giờ được gửi dưới dạng văn bản lời nhắc thông thường đến một môi trường điều phối ACP đã liên kết.
    - `cancel` hủy lượt đang hoạt động khi backend hỗ trợ hủy; thao tác này không xóa liên kết hoặc siêu dữ liệu phiên.
    - `close` kết thúc phiên ACP theo góc nhìn của OpenClaw và xóa liên kết. Một môi trường điều phối vẫn có thể giữ lịch sử phía thượng nguồn riêng nếu hỗ trợ tiếp tục.
    - Plugin acpx dọn dẹp các cây tiến trình trình bao bọc và bộ chuyển đổi do OpenClaw sở hữu sau `close`, đồng thời thu hồi các tiến trình ACPX mồ côi, cũ do OpenClaw sở hữu trong quá trình khởi động Gateway.
    - Các tiến trình thực thi runtime không hoạt động có thể được dọn dẹp sau `acp.runtime.ttlMinutes`; siêu dữ liệu phiên đã lưu vẫn khả dụng cho `/acp sessions`.

  </Accordion>
  <Accordion title="Quy tắc định tuyến Codex gốc">
    Các cụm từ kích hoạt bằng ngôn ngữ tự nhiên sau nên được định tuyến đến **Plugin Codex gốc**
    khi Plugin này được bật:

    - "Liên kết kênh Discord này với Codex."
    - "Gắn cuộc trò chuyện này vào luồng Codex `<id>`."
    - "Hiển thị các luồng Codex, sau đó liên kết luồng này."

    Liên kết hội thoại Codex gốc là đường dẫn điều khiển trò chuyện mặc định.
    Các công cụ động của OpenClaw vẫn thực thi thông qua OpenClaw, còn các
    công cụ gốc của Codex như shell/apply-patch thực thi bên trong Codex. Đối với
    các sự kiện công cụ gốc của Codex, OpenClaw chèn một bộ chuyển tiếp hook gốc
    theo từng lượt để các hook của plugin có thể chặn `before_tool_call`, quan sát
    `after_tool_call` và định tuyến các sự kiện `PermissionRequest` của Codex
    thông qua quy trình phê duyệt của OpenClaw. Các hook `Stop` của Codex được
    chuyển tiếp tới `before_agent_finalize` của OpenClaw, nơi các plugin có thể
    yêu cầu thêm một lượt chạy mô hình trước khi Codex hoàn tất câu trả lời. Bộ
    chuyển tiếp này được thiết kế thận trọng: nó không sửa đổi các đối số công cụ
    gốc của Codex hoặc ghi lại các bản ghi luồng Codex. Chỉ sử dụng ACP tường minh
    khi bạn muốn mô hình runtime/phiên của ACP. Ranh giới hỗ trợ Codex nhúng được
    ghi lại trong
    [hợp đồng hỗ trợ Codex harness v1](/vi/plugins/codex-harness-runtime#v1-support-contract).

  </Accordion>
  <Accordion title="Bảng tra nhanh lựa chọn mô hình / nhà cung cấp / runtime">
    - tham chiếu mô hình Codex cũ - tuyến mô hình OAuth/gói đăng ký Codex cũ được doctor sửa chữa.
    - `openai/*` - runtime nhúng app-server Codex gốc cho các lượt tác tử OpenAI.
    - `/codex ...` - điều khiển hội thoại Codex gốc.
    - `/acp ...` hoặc `runtime: "acp"` - điều khiển ACP/acpx tường minh.

  </Accordion>
  <Accordion title="Tác nhân kích hoạt bằng ngôn ngữ tự nhiên để định tuyến ACP">
    Các tác nhân kích hoạt cần định tuyến tới runtime ACP:

    - "Chạy tác vụ này dưới dạng một phiên Claude Code ACP dùng một lần và tóm tắt kết quả."
    - "Sử dụng Gemini CLI cho tác vụ này trong một luồng, sau đó tiếp tục các lượt trao đổi trong cùng luồng đó."
    - "Chạy Codex thông qua ACP trong một luồng nền."

    OpenClaw chọn `runtime: "acp"`, phân giải `agentId` của harness, liên kết với
    hội thoại hoặc luồng hiện tại khi được hỗ trợ và định tuyến các lượt trao đổi
    tiếp theo tới phiên đó cho đến khi đóng/hết hạn. Codex chỉ đi theo đường dẫn
    này khi ACP/acpx được chỉ định tường minh hoặc plugin Codex gốc không khả dụng
    cho thao tác được yêu cầu.

    Đối với `sessions_spawn`, `runtime: "acp"` chỉ được công bố khi ACP được
    bật, bên yêu cầu không nằm trong sandbox và một backend runtime ACP đã được
    nạp. `acp.dispatch.enabled=false` tạm dừng việc tự động điều phối luồng ACP
    nhưng không ẩn hoặc chặn các lệnh gọi `sessions_spawn({ runtime: "acp" })`
    tường minh. Nó nhắm tới các mã định danh harness ACP như `codex`, `claude`,
    `droid`, `gemini` hoặc `opencode`. Không truyền mã định danh tác tử cấu hình
    OpenClaw thông thường từ `agents_list` trừ khi mục đó được cấu hình tường minh
    với `agents.list[].runtime.type="acp"`; nếu không, hãy sử dụng runtime tác tử
    con mặc định. Khi một tác tử OpenClaw được cấu hình với
    `runtime.type="acp"`, OpenClaw sử dụng `runtime.acp.agent` làm mã định danh
    harness nền tảng.

  </Accordion>
</AccordionGroup>

## ACP so với tác tử con

Sử dụng ACP khi bạn muốn một runtime harness bên ngoài. Sử dụng **app-server
Codex gốc** để liên kết/điều khiển hội thoại Codex khi plugin `codex` được
bật. Sử dụng **tác tử con** khi bạn muốn các lượt chạy được ủy quyền gốc của OpenClaw.

| Khu vực       | Phiên ACP                              | Lượt chạy tác tử con                  |
| ------------- | -------------------------------------- | ------------------------------------- |
| Runtime       | Plugin backend ACP (ví dụ: acpx)       | Runtime tác tử con gốc của OpenClaw   |
| Khóa phiên    | `agent:<agentId>:acp:<uuid>`           | `agent:<agentId>:subagent:<uuid>`     |
| Lệnh chính    | `/acp ...`                             | `/subagents ...`                      |
| Công cụ tạo   | `sessions_spawn` với `runtime:"acp"`   | `sessions_spawn` (runtime mặc định)   |

Xem thêm [Tác tử con](/vi/tools/subagents).

## Cách ACP chạy Claude Code

Đối với Claude Code thông qua ACP, ngăn xếp gồm:

1. Mặt phẳng điều khiển phiên ACP của OpenClaw.
2. Plugin runtime chính thức `@openclaw/acpx`.
3. Bộ điều hợp ACP của Claude.
4. Cơ chế runtime/phiên phía Claude.

ACP Claude là một **phiên harness** với các điều khiển ACP, khả năng tiếp tục
phiên, theo dõi tác vụ nền và tùy chọn liên kết hội thoại/luồng.

Các backend CLI là những runtime dự phòng cục bộ chỉ dùng văn bản riêng biệt - xem
[Backend CLI](/vi/gateway/cli-backends).

Đối với người vận hành, quy tắc thực tế là:

- **Muốn `/acp spawn`, các phiên có thể liên kết, điều khiển runtime hoặc công việc harness bền vững?** Sử dụng ACP.
- **Muốn cơ chế dự phòng văn bản cục bộ đơn giản thông qua CLI thô?** Sử dụng các backend CLI.

## Phiên đã liên kết

### Mô hình tư duy

- **Bề mặt trò chuyện** - nơi mọi người tiếp tục trò chuyện (kênh Discord, chủ đề Telegram, cuộc trò chuyện iMessage).
- **Phiên ACP** - trạng thái runtime Codex/Claude/Gemini bền vững mà OpenClaw định tuyến tới.
- **Luồng/chủ đề con** - một bề mặt nhắn tin bổ sung tùy chọn chỉ được tạo bởi `--thread ...`.
- **Không gian làm việc runtime** - vị trí hệ thống tệp (`cwd`, bản checkout kho mã, không gian làm việc backend) nơi harness chạy. Độc lập với bề mặt trò chuyện.

### Liên kết hội thoại hiện tại

`/acp spawn <harness> --bind here` ghim hội thoại hiện tại vào
phiên ACP vừa tạo - không có luồng con, vẫn cùng bề mặt trò chuyện. OpenClaw tiếp tục
quản lý việc vận chuyển, xác thực, an toàn và phân phối. Các tin nhắn tiếp theo trong
hội thoại đó được định tuyến tới cùng phiên; `/new` và `/reset` đặt lại phiên
tại chỗ; `/acp close` xóa liên kết.

Ví dụ:

```text
/codex bind                                              # liên kết Codex gốc, định tuyến các tin nhắn sau này tới đây
/codex model gpt-5.4                                     # tinh chỉnh luồng Codex gốc đã liên kết
/codex stop                                              # điều khiển lượt Codex gốc đang hoạt động
/acp spawn codex --bind here                             # cơ chế dự phòng ACP tường minh cho Codex
/acp spawn codex --thread auto                           # có thể tạo một luồng/chủ đề con và liên kết tại đó
/acp spawn codex --bind here --cwd /workspace/repo       # cùng liên kết trò chuyện, Codex chạy trong /workspace/repo
```

<AccordionGroup>
  <Accordion title="Quy tắc liên kết và tính loại trừ">
    - `--bind here` và `--thread ...` loại trừ lẫn nhau.
    - `--bind here` chỉ hoạt động trên các kênh công bố khả năng liên kết hội thoại hiện tại; nếu không, OpenClaw trả về thông báo rõ ràng rằng tính năng không được hỗ trợ. Các liên kết vẫn tồn tại sau khi Gateway khởi động lại.
    - Trên Discord, `spawnSessions` kiểm soát việc tạo luồng con cho `--thread auto|here` - không áp dụng cho `--bind here`.
    - Nếu bạn tạo phiên cho một tác tử ACP khác mà không có `--cwd`, theo mặc định OpenClaw kế thừa không gian làm việc của **tác tử đích**. Các đường dẫn kế thừa bị thiếu (`ENOENT`/`ENOTDIR`) sẽ quay về giá trị mặc định của backend; các lỗi truy cập khác (ví dụ: `EACCES`) được hiển thị dưới dạng lỗi tạo phiên.
    - Các lệnh quản lý Gateway vẫn được xử lý cục bộ trong các hội thoại đã liên kết - các lệnh `/acp ...` được OpenClaw xử lý ngay cả khi văn bản trao đổi tiếp theo thông thường được định tuyến tới phiên ACP đã liên kết; `/status` và `/unfocus` cũng luôn được xử lý cục bộ khi việc xử lý lệnh được bật cho bề mặt đó.

  </Accordion>
  <Accordion title="Phiên liên kết với luồng">
    Khi liên kết luồng được bật cho một bộ điều hợp kênh:

    - OpenClaw liên kết một luồng với phiên ACP đích.
    - Các tin nhắn tiếp theo trong luồng đó được định tuyến tới phiên ACP đã liên kết.
    - Đầu ra ACP được gửi trở lại cùng luồng.
    - Việc bỏ tập trung/đóng/lưu trữ/hết thời gian chờ khi không hoạt động hoặc hết thời hạn tối đa sẽ xóa liên kết.
    - `/acp close`, `/acp cancel`, `/acp status`, `/status` và `/unfocus` là các lệnh Gateway, không phải lời nhắc gửi tới harness ACP.

    Các cờ tính năng bắt buộc cho ACP liên kết với luồng:

    - `acp.enabled=true`
    - `acp.dispatch.enabled` được bật theo mặc định (đặt thành `false` để tạm dừng việc tự động điều phối luồng ACP; các lệnh gọi `sessions_spawn({ runtime: "acp" })` tường minh vẫn hoạt động).
    - Việc tạo phiên luồng của bộ điều hợp kênh được bật (mặc định: `true`):
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`

    Khả năng hỗ trợ liên kết luồng phụ thuộc vào từng bộ điều hợp. Nếu bộ điều hợp
    kênh đang hoạt động không hỗ trợ liên kết luồng, OpenClaw trả về thông báo rõ ràng
    rằng tính năng không được hỗ trợ/không khả dụng.

  </Accordion>
  <Accordion title="Các kênh hỗ trợ luồng">
    - Bất kỳ bộ điều hợp kênh nào cung cấp khả năng liên kết phiên/luồng.
    - Hỗ trợ tích hợp hiện tại: luồng/kênh **Discord**, chủ đề **Telegram** (chủ đề diễn đàn trong nhóm/siêu nhóm và chủ đề tin nhắn trực tiếp).
    - Các kênh plugin có thể bổ sung hỗ trợ thông qua cùng giao diện liên kết.

  </Accordion>
</AccordionGroup>

## Liên kết kênh bền vững

Đối với các quy trình làm việc không tạm thời, hãy cấu hình liên kết ACP bền vững trong
các mục `bindings[]` cấp cao nhất.

### Mô hình liên kết

<ParamField path="bindings[].type" type='"acp"'>
  Đánh dấu một liên kết hội thoại ACP bền vững.
</ParamField>
<ParamField path="bindings[].match" type="object">
  Xác định hội thoại đích. Cấu trúc theo từng kênh:

- **Kênh/luồng Discord:** `match.channel="discord"` + `match.peer.id="<channelOrThreadId>"`
- **Kênh/tin nhắn trực tiếp Slack:** `match.channel="slack"` + `match.peer.id="<channelId|channel:<channelId>|#<channelId>|userId|user:<userId>|slack:<userId>|<@userId>>"`. Ưu tiên các mã định danh Slack ổn định; liên kết kênh cũng khớp với các phản hồi bên trong các luồng của kênh đó.
- **Chủ đề diễn đàn Telegram:** `match.channel="telegram"` + `match.peer.id="<chatId>:topic:<topicId>"`
- **Tin nhắn trực tiếp/nhóm WhatsApp:** `match.channel="whatsapp"` + `match.peer.id="<E.164|group JID>"`. Sử dụng các số E.164 như `+15555550123` cho trò chuyện trực tiếp và JID nhóm WhatsApp như `120363424282127706@g.us` cho nhóm.
- **Tin nhắn trực tiếp/nhóm iMessage:** `match.channel="imessage"` + `match.peer.id="<handle|chat_id:*|chat_guid:*|chat_identifier:*>"`. Ưu tiên `chat_id:*` để liên kết nhóm ổn định.

</ParamField>
<ParamField path="bindings[].agentId" type="string">
  Mã định danh tác tử OpenClaw sở hữu.
</ParamField>
<ParamField path="bindings[].acp.mode" type='"persistent" | "oneshot"'>
  Giá trị ghi đè ACP tùy chọn.
</ParamField>
<ParamField path="bindings[].acp.label" type="string">
  Nhãn tùy chọn dành cho người vận hành.
</ParamField>
<ParamField path="bindings[].acp.cwd" type="string">
  Thư mục làm việc runtime tùy chọn.
</ParamField>
<ParamField path="bindings[].acp.backend" type="string">
  Giá trị ghi đè backend tùy chọn.
</ParamField>

### Giá trị mặc định runtime theo từng tác tử

Sử dụng `agents.list[].runtime` để xác định các giá trị mặc định ACP một lần cho mỗi tác tử:

- `agents.list[].runtime.type="acp"`
- `agents.list[].runtime.acp.agent` (mã định danh harness, ví dụ: `codex` hoặc `claude`)
- `agents.list[].runtime.acp.backend`
- `agents.list[].runtime.acp.mode`
- `agents.list[].runtime.acp.cwd`

**Thứ tự ưu tiên ghi đè cho các phiên liên kết ACP:**

1. `bindings[].acp.*`
2. `agents.list[].runtime.acp.*`
3. Giá trị mặc định ACP toàn cục (ví dụ: `acp.backend`)

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

- OpenClaw bảo đảm phiên ACP đã cấu hình tồn tại sau bước chấp nhận dành riêng cho kênh và trước khi sử dụng.
- Tin nhắn trong kênh, chủ đề hoặc cuộc trò chuyện đó được định tuyến đến phiên ACP đã cấu hình.
- Các liên kết ACP đã cấu hình sở hữu tuyến phiên của chúng. Việc phát tán quảng bá của kênh không thay thế phiên ACP đã cấu hình đối với một liên kết khớp.
- Trong các cuộc trò chuyện được liên kết, `/new` và `/reset` đặt lại tại chỗ cùng một khóa phiên ACP.
- Các liên kết thời gian chạy tạm thời (ví dụ: được tạo bởi các luồng tập trung vào luồng hội thoại) vẫn được áp dụng khi có.
- Đối với các lần khởi tạo ACP giữa các agent mà không có `cwd` tường minh, OpenClaw kế thừa không gian làm việc của agent đích từ cấu hình agent.
- Các đường dẫn không gian làm việc được kế thừa nhưng không tồn tại sẽ quay về cwd mặc định của backend; lỗi truy cập đối với đường dẫn tồn tại được trả về dưới dạng lỗi khởi tạo.

## Khởi động phiên ACP

Có hai cách để khởi động một phiên ACP:

<Tabs>
  <Tab title="Từ sessions_spawn">
    Sử dụng `runtime: "acp"` để khởi động một phiên ACP từ một lượt của agent hoặc
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
    `runtime` mặc định là `subagent`, vì vậy hãy đặt tường minh `runtime: "acp"` cho
    các phiên ACP. Nếu bỏ qua `agentId`, OpenClaw sử dụng `acp.defaultAgent`
    khi đã cấu hình. `mode: "session"` yêu cầu `thread: true` để duy trì một
    cuộc trò chuyện được liên kết lâu dài.
    </Note>

  </Tab>
  <Tab title="Từ lệnh /acp">
    Sử dụng `/acp spawn` để người vận hành kiểm soát tường minh từ cuộc trò chuyện.

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
  Phải là `"acp"` đối với các phiên ACP.
</ParamField>
<ParamField path="agentId" type="string">
  ID bộ điều phối đích của ACP. Quay về `acp.defaultAgent` nếu đã đặt.
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  Yêu cầu luồng liên kết với luồng hội thoại ở những nơi được hỗ trợ.
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  `"run"` là chạy một lần; `"session"` là lâu dài. Nếu `thread: true` và
  bỏ qua `mode`, OpenClaw có thể mặc định sử dụng hành vi lâu dài tùy theo
  đường dẫn thời gian chạy. `mode: "session"` yêu cầu `thread: true`.
</ParamField>
<ParamField path="cwd" type="string">
  Thư mục làm việc thời gian chạy được yêu cầu (được xác thực theo chính sách backend/thời gian chạy).
  Nếu bỏ qua, lần khởi tạo ACP kế thừa không gian làm việc của agent đích khi đã cấu hình;
  các đường dẫn kế thừa không tồn tại sẽ quay về giá trị mặc định của backend, còn lỗi
  truy cập thực tế sẽ được trả về.
</ParamField>
<ParamField path="label" type="string">
  Nhãn dành cho người vận hành, được sử dụng trong nội dung phiên/biểu ngữ.
</ParamField>
<ParamField path="resumeSessionId" type="string">
  Tiếp tục một phiên ACP hiện có thay vì tạo phiên mới. Agent
  phát lại lịch sử trò chuyện qua `session/load`. Yêu cầu
  `runtime: "acp"`.
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  `"parent"` truyền trực tiếp các bản tóm tắt tiến độ chạy ACP ban đầu về phiên
  yêu cầu dưới dạng sự kiện hệ thống. Phản hồi được chấp nhận bao gồm `streamLogPath`
  trỏ đến nhật ký JSONL thuộc phạm vi phiên (`<sessionId>.acp-stream.jsonl`) mà bạn
  có thể theo dõi để xem toàn bộ lịch sử chuyển tiếp. Theo mặc định, luồng tiến độ
  của phiên cha hiển thị phần diễn giải của trợ lý và tiến độ trạng thái ACP, trừ khi
  `streaming.progress.commentary=false`. Discord cũng mặc định đặt bản xem trước của
  phiên cha ở chế độ tiến độ khi chưa cấu hình chế độ truyền trực tiếp. Tiến độ
  trạng thái vẫn tuân theo `acp.stream.tagVisibility`, vì vậy các thẻ như `plan`
  vẫn bị ẩn trừ khi được bật tường minh.
</ParamField>

Các lần chạy `sessions_spawn` của ACP sử dụng `agents.defaults.subagents.runTimeoutSeconds`
làm giới hạn mặc định cho lượt của tiến trình con. Công cụ không chấp nhận việc ghi đè
thời gian chờ theo từng lệnh gọi (`runTimeoutSeconds`/`timeoutSeconds` sẽ bị từ chối với
lỗi yêu cầu cấu hình giá trị mặc định).

<ParamField path="model" type="string">
  Ghi đè model tường minh cho phiên ACP con. Các lần khởi tạo Codex ACP
  chuẩn hóa các tham chiếu OpenAI như `openai/gpt-5.4` thành cấu hình khởi động Codex ACP
  trước `session/new`; các dạng có dấu gạch chéo như `openai/gpt-5.4/high` cũng đặt
  mức độ suy luận của Codex ACP. Khi bỏ qua, `sessions_spawn({ runtime: "acp" })`
  sử dụng các giá trị mặc định model hiện có của subagent (`agents.defaults.subagents.model` hoặc
  `agents.list[].subagents.model`) khi đã cấu hình; nếu không, nó để bộ điều phối ACP
  sử dụng model mặc định riêng. Các bộ điều phối khác phải công bố `models` của ACP
  và hỗ trợ `session/set_model`; nếu không, OpenClaw/acpx sẽ báo lỗi rõ ràng
  thay vì âm thầm quay về model mặc định của agent đích.
</ParamField>
<ParamField path="thinking" type="string">
  Mức độ tư duy/suy luận tường minh. Với Codex ACP, `minimal` ánh xạ thành mức
  thấp, `low`/`medium`/`high`/`xhigh` ánh xạ trực tiếp, còn `off` bỏ qua
  ghi đè mức độ suy luận khi khởi động. Khi bỏ qua, các lần khởi tạo ACP sử dụng
  giá trị mặc định hiện có về tư duy của subagent và
  `agents.defaults.models["provider/model"].params.thinking` theo từng model
  đối với model đã chọn.
</ParamField>

## Chế độ liên kết và luồng hội thoại khi khởi tạo

<Tabs>
  <Tab title="--bind here|off">
    | Chế độ | Hành vi                                                                       |
    | ------ | ----------------------------------------------------------------------------- |
    | `here` | Liên kết tại chỗ cuộc trò chuyện đang hoạt động; thất bại nếu không có cuộc trò chuyện nào đang hoạt động. |
    | `off`  | Không tạo liên kết với cuộc trò chuyện hiện tại.                            |

    Ghi chú:

    - `--bind here` là đường dẫn đơn giản nhất cho người vận hành để “cho kênh hoặc cuộc trò chuyện này sử dụng Codex”.
    - `--bind here` không tạo luồng hội thoại con.
    - `--bind here` chỉ khả dụng trên các kênh cung cấp khả năng hỗ trợ liên kết cuộc trò chuyện hiện tại.
    - Không thể kết hợp `--bind` và `--thread` trong cùng một lệnh gọi `/acp spawn`.

  </Tab>
  <Tab title="--thread auto|here|off">
    | Chế độ | Hành vi                                                                                                      |
    | ------ | ------------------------------------------------------------------------------------------------------------ |
    | `auto` | Trong luồng hội thoại đang hoạt động: liên kết luồng đó. Bên ngoài luồng hội thoại: tạo/liên kết luồng con khi được hỗ trợ. |
    | `here` | Yêu cầu luồng hội thoại hiện tại đang hoạt động; thất bại nếu không ở trong luồng nào.                       |
    | `off`  | Không liên kết. Phiên khởi động ở trạng thái chưa liên kết.                                                 |

    Ghi chú:

    - Trên các bề mặt liên kết không hỗ trợ luồng hội thoại, hành vi mặc định về cơ bản là `off`.
    - Việc khởi tạo được liên kết với luồng hội thoại yêu cầu chính sách kênh hỗ trợ:
      - Discord: `channels.discord.threadBindings.spawnSessions=true`
      - Telegram: `channels.telegram.threadBindings.spawnSessions=true`
    - Sử dụng `--bind here` khi bạn muốn ghim cuộc trò chuyện hiện tại mà không tạo luồng hội thoại con.

  </Tab>
</Tabs>

## Mô hình phân phối

Phiên ACP có thể là không gian làm việc tương tác hoặc công việc nền do phiên cha sở hữu.
Đường dẫn phân phối phụ thuộc vào hình thức đó.

<AccordionGroup>
  <Accordion title="Phiên ACP tương tác">
    Các phiên tương tác được thiết kế để tiếp tục trò chuyện trên một bề mặt trò chuyện hiển thị:

    - `/acp spawn ... --bind here` liên kết cuộc trò chuyện hiện tại với phiên ACP.
    - `/acp spawn ... --thread ...` liên kết một luồng hội thoại/chủ đề của kênh với phiên ACP.
    - Các `bindings[].type="acp"` lâu dài đã cấu hình định tuyến các cuộc trò chuyện khớp đến cùng một phiên ACP.

    Các tin nhắn tiếp theo trong cuộc trò chuyện được liên kết sẽ được định tuyến trực tiếp đến phiên ACP,
    và đầu ra ACP được phân phối trở lại chính
    kênh/luồng hội thoại/chủ đề đó.

    Nội dung OpenClaw gửi đến bộ điều phối:

    - Các tin nhắn tiếp theo thông thường trong liên kết được gửi dưới dạng văn bản lời nhắc, kèm theo tệp đính kèm chỉ khi bộ điều phối/backend hỗ trợ.
    - Các lệnh quản lý `/acp` và lệnh Gateway cục bộ bị chặn trước khi chuyển đến ACP.
    - Các sự kiện hoàn tất do thời gian chạy tạo ra được hiện thực hóa theo từng đích. Các agent OpenClaw nhận phong bì ngữ cảnh thời gian chạy nội bộ của OpenClaw; các bộ điều phối ACP bên ngoài nhận lời nhắc thuần túy chứa kết quả của tiến trình con và chỉ dẫn. Không bao giờ được gửi phong bì thô `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>` đến bộ điều phối bên ngoài hoặc lưu nó dưới dạng văn bản bản ghi người dùng ACP.
    - Các mục bản ghi ACP sử dụng văn bản kích hoạt mà người dùng nhìn thấy hoặc lời nhắc hoàn tất thuần túy. Siêu dữ liệu sự kiện nội bộ vẫn được giữ ở dạng có cấu trúc trong OpenClaw khi có thể và không được coi là nội dung trò chuyện do người dùng tạo.

  </Accordion>
  <Accordion title="Phiên ACP chạy một lần do phiên cha sở hữu">
    Các phiên ACP chạy một lần do một lần chạy agent khác khởi tạo là các tiến trình con
    chạy nền, tương tự subagent:

    - Phiên cha yêu cầu thực hiện công việc bằng `sessions_spawn({ runtime: "acp", mode: "run" })`.
    - Tiến trình con chạy trong phiên bộ điều phối ACP riêng.
    - Các lượt của tiến trình con chạy trên cùng làn nền được dùng cho các lần khởi tạo subagent gốc, vì vậy một bộ điều phối ACP chậm không chặn công việc không liên quan của phiên chính.
    - Báo cáo hoàn tất được gửi lại qua đường dẫn thông báo hoàn thành tác vụ. OpenClaw chuyển đổi siêu dữ liệu hoàn tất nội bộ thành một lời nhắc ACP thuần túy trước khi gửi đến bộ điều phối bên ngoài, do đó bộ điều phối không nhìn thấy các dấu ngữ cảnh thời gian chạy chỉ dành cho OpenClaw.
    - Phiên cha viết lại kết quả của tiến trình con bằng giọng trợ lý thông thường khi cần phản hồi hướng đến người dùng.

    **Không** coi đường dẫn này là cuộc trò chuyện ngang hàng giữa phiên cha và
    tiến trình con. Tiến trình con đã có một kênh hoàn tất để phản hồi về phiên cha.

  </Accordion>
  <Accordion title="sessions_send và phân phối A2A">
    `sessions_send` có thể nhắm đến một phiên khác sau khi khởi tạo. Đối với các phiên ngang hàng
    thông thường, OpenClaw sử dụng đường dẫn theo dõi giữa các agent (A2A) sau khi
    chèn tin nhắn:

    - Chờ phản hồi của phiên đích.
    - Tùy chọn cho phép bên yêu cầu và đích trao đổi một số lượng hữu hạn các lượt tiếp theo.
    - Yêu cầu đích tạo một thông báo.
    - Phân phối thông báo đó đến kênh hoặc luồng hội thoại hiển thị.

    Đường dẫn A2A đó là phương án dự phòng cho việc gửi giữa các nút ngang hàng khi bên gửi cần một phản hồi tiếp theo hiển thị được. Đường dẫn này vẫn được bật khi một phiên không liên quan có thể thấy và gửi tin nhắn đến một đích ACP, chẳng hạn trong các thiết lập `tools.sessions.visibility` rộng.

    OpenClaw chỉ bỏ qua phản hồi tiếp theo qua A2A khi bên yêu cầu là phiên cha của phiên con ACP chạy một lần do chính phiên cha đó sở hữu. Trong trường hợp này, chạy A2A bên trên quá trình hoàn thành tác vụ có thể đánh thức phiên cha bằng kết quả của phiên con, chuyển tiếp câu trả lời của phiên cha trở lại phiên con và tạo ra vòng lặp phản hồi cha/con. Kết quả `sessions_send` báo cáo `delivery.status="skipped"` cho trường hợp phiên con được sở hữu đó vì đường dẫn hoàn thành đã chịu trách nhiệm trả về kết quả.

  </Accordion>
  <Accordion title="Tiếp tục một phiên hiện có">
    Dùng `resumeSessionId` để tiếp tục một phiên ACP trước đó thay vì bắt đầu lại. Tác nhân phát lại lịch sử hội thoại của phiên qua `session/load`, nhờ đó tiếp tục với đầy đủ ngữ cảnh trước đó.

    ```json
    {
      "task": "Continue where we left off - fix the remaining test failures",
      "runtime": "acp",
      "agentId": "codex",
      "resumeSessionId": "<previous-session-id>"
    }
    ```

    Các trường hợp sử dụng phổ biến:

    - Chuyển giao một phiên Codex từ máy tính xách tay sang điện thoại — yêu cầu tác nhân tiếp tục từ chỗ bạn đã dừng lại.
    - Tiếp tục một phiên lập trình mà bạn đã bắt đầu tương tác trong CLI, giờ đây chạy không giao diện thông qua tác nhân.
    - Tiếp tục công việc bị gián đoạn do Gateway khởi động lại hoặc hết thời gian chờ khi không hoạt động.

    Lưu ý:

    - `resumeSessionId` chỉ áp dụng khi `runtime: "acp"`; môi trường chạy tác nhân con mặc định bỏ qua trường chỉ dành cho ACP này.
    - `streamTo` chỉ áp dụng khi `runtime: "acp"`; môi trường chạy tác nhân con mặc định bỏ qua trường chỉ dành cho ACP này.
    - `resumeSessionId` là mã tiếp tục ACP/bộ điều phối cục bộ trên máy chủ, không phải khóa phiên kênh OpenClaw; OpenClaw vẫn kiểm tra chính sách tạo ACP và chính sách tác nhân đích trước khi điều phối, còn phần phụ trợ ACP hoặc bộ điều phối chịu trách nhiệm cấp quyền để tải mã ngược dòng đó.
    - `resumeSessionId` khôi phục lịch sử hội thoại ACP ngược dòng; `thread` và `mode` vẫn áp dụng bình thường cho phiên OpenClaw mới mà bạn đang tạo, vì vậy `mode: "session"` vẫn yêu cầu `thread: true`.
    - Tác nhân đích phải hỗ trợ `session/load` (Codex và Claude Code đều hỗ trợ).
    - Nếu không tìm thấy mã phiên, thao tác tạo sẽ thất bại với lỗi rõ ràng — không âm thầm chuyển sang phiên mới.

  </Accordion>
  <Accordion title="Kiểm thử nhanh sau khi triển khai">
    Sau khi triển khai Gateway, hãy chạy kiểm tra trực tiếp từ đầu đến cuối thay vì chỉ tin vào kiểm thử đơn vị:

    1. Xác minh phiên bản và commit của Gateway đã triển khai trên máy chủ đích.
    2. Mở một phiên cầu nối ACPX tạm thời đến một tác nhân đang hoạt động.
    3. Yêu cầu tác nhân đó gọi `sessions_spawn` với `runtime: "acp"`, `agentId: "codex"`, `mode: "run"` và tác vụ `Reply with exactly LIVE-ACP-SPAWN-OK`.
    4. Xác minh `accepted=yes`, có một `childSessionKey` thực và không có lỗi trình xác thực.
    5. Dọn dẹp phiên cầu nối tạm thời.

    Giữ cổng kiểm tra ở `mode: "run"` và bỏ qua `streamTo: "parent"` —
    `mode: "session"` gắn với luồng và các đường dẫn chuyển tiếp luồng dữ liệu là những lượt kiểm thử tích hợp nâng cao riêng biệt.

  </Accordion>
</AccordionGroup>

## Khả năng tương thích với sandbox

Các phiên ACP hiện chạy trên môi trường máy chủ, **không** chạy bên trong sandbox của OpenClaw.

<Warning>
**Ranh giới bảo mật:**

- Bộ điều phối bên ngoài có thể đọc/ghi theo quyền CLI riêng của nó và `cwd` đã chọn.
- Chính sách sandbox của OpenClaw **không** bao bọc quá trình thực thi bộ điều phối ACP.
- OpenClaw vẫn thực thi các cổng tính năng ACP, danh sách tác nhân được phép, quyền sở hữu phiên, liên kết kênh và chính sách phân phối của Gateway.
- Dùng `runtime: "subagent"` cho công việc gốc OpenClaw được sandbox thực thi.

</Warning>

Các hạn chế hiện tại:

- Nếu phiên yêu cầu đang ở trong sandbox, thao tác tạo ACP sẽ bị chặn đối với cả `sessions_spawn({ runtime: "acp" })` và `/acp spawn`.
- `sessions_spawn` với `runtime: "acp"` không hỗ trợ `sandbox: "require"`.

## Phân giải đích phiên

Hầu hết hành động `/acp` chấp nhận một đích phiên tùy chọn (`session-key`,
`session-id` hoặc `session-label`).

**Thứ tự phân giải:**

1. Đối số đích tường minh (hoặc `--session` cho `/acp steer`)
   - thử khóa
   - sau đó thử mã phiên có dạng UUID
   - sau đó thử nhãn
2. Liên kết luồng hiện tại (nếu cuộc hội thoại/luồng này được liên kết với một phiên ACP).
3. Phương án dự phòng là phiên yêu cầu hiện tại.

Cả liên kết cuộc hội thoại hiện tại và liên kết luồng đều tham gia bước 2.

Nếu không phân giải được đích nào, OpenClaw trả về lỗi rõ ràng
(`Unable to resolve session target: ...`).

## Điều khiển ACP

| Lệnh                 | Chức năng                                                  | Ví dụ                                                         |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `/acp spawn`         | Tạo phiên ACP; tùy chọn liên kết hiện tại hoặc liên kết luồng. | `/acp spawn codex --bind here --cwd /repo`                    |
| `/acp cancel`        | Hủy lượt đang thực hiện của phiên đích.                    | `/acp cancel agent:codex:acp:<uuid>`                          |
| `/acp steer`         | Gửi chỉ dẫn điều hướng đến phiên đang chạy.                | `/acp steer --session support inbox prioritize failing tests` |
| `/acp close`         | Đóng phiên và hủy liên kết các đích luồng.                 | `/acp close`                                                  |
| `/acp status`        | Hiển thị phần phụ trợ, chế độ, trạng thái, tùy chọn môi trường chạy và khả năng. | `/acp status`                                                 |
| `/acp set-mode`      | Đặt chế độ môi trường chạy cho phiên đích.                 | `/acp set-mode plan`                                          |
| `/acp set`           | Ghi tùy chọn cấu hình môi trường chạy chung.               | `/acp set model openai/gpt-5.4`                               |
| `/acp cwd`           | Đặt giá trị ghi đè thư mục làm việc của môi trường chạy.   | `/acp cwd /Users/user/Projects/repo`                          |
| `/acp permissions`   | Đặt hồ sơ chính sách phê duyệt.                            | `/acp permissions strict`                                     |
| `/acp timeout`       | Đặt thời gian chờ của môi trường chạy (giây).              | `/acp timeout 120`                                            |
| `/acp model`         | Đặt giá trị ghi đè mô hình của môi trường chạy.            | `/acp model anthropic/claude-opus-4-6`                        |
| `/acp reset-options` | Xóa các giá trị ghi đè tùy chọn môi trường chạy của phiên. | `/acp reset-options`                                          |
| `/acp sessions`      | Liệt kê các phiên ACP gần đây từ kho lưu trữ.              | `/acp sessions`                                               |
| `/acp doctor`        | Kiểm tra tình trạng phần phụ trợ, khả năng và các cách khắc phục khả thi. | `/acp doctor`                                                 |
| `/acp install`       | In các bước cài đặt và bật có tính xác định.               | `/acp install`                                                |

Các điều khiển môi trường chạy (`spawn`, `cancel`, `steer`, `close`, `status`, `set-mode`,
`set`, `cwd`, `permissions`, `timeout`, `model` và `reset-options`) yêu cầu
danh tính chủ sở hữu từ các kênh bên ngoài và `operator.admin` từ các máy khách
Gateway nội bộ. Bên gửi không phải chủ sở hữu nhưng được cấp quyền vẫn có thể dùng `sessions`,
`doctor`, `install` và `help`.

`/acp status` hiển thị các tùy chọn môi trường chạy có hiệu lực cùng với
mã định danh phiên cấp môi trường chạy và cấp phần phụ trợ. Lỗi điều khiển không được hỗ trợ
được hiển thị rõ ràng khi phần phụ trợ thiếu một khả năng. `/acp sessions` đọc kho lưu trữ
cho phiên đang được liên kết hoặc phiên yêu cầu hiện tại; các mã đích (`session-key`,
`session-id` hoặc `session-label`) được phân giải thông qua cơ chế khám phá phiên của Gateway,
bao gồm các thư mục gốc `session.store` tùy chỉnh cho từng tác nhân.

### Ánh xạ tùy chọn môi trường chạy

`/acp` có các lệnh tiện ích và một trình đặt chung. Các thao tác tương đương:

| Lệnh                         | Ánh xạ tới                            | Lưu ý                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/acp model <id>`            | khóa cấu hình môi trường chạy `model` | Với Codex ACP, OpenClaw chuẩn hóa `openai/<model>` thành mã mô hình của bộ chuyển đổi và ánh xạ các hậu tố suy luận có dấu gạch chéo, chẳng hạn `openai/gpt-5.4/high`, sang `reasoning_effort`.                 |
| `/acp set thinking <level>`  | tùy chọn chuẩn `thinking`             | OpenClaw gửi tùy chọn tương đương do phần phụ trợ công bố nếu có, ưu tiên `thinking`, sau đó là `effort`, `reasoning_effort` hoặc `thought_level`. Với Codex ACP, bộ chuyển đổi ánh xạ các giá trị sang `reasoning_effort`. |
| `/acp permissions <profile>` | tùy chọn chuẩn `permissionProfile`    | OpenClaw gửi tùy chọn tương đương do phần phụ trợ công bố nếu có, chẳng hạn `approval_policy`, `permission_profile`, `permissions` hoặc `permission_mode`.                                                    |
| `/acp timeout <seconds>`     | tùy chọn chuẩn `timeoutSeconds`       | OpenClaw gửi tùy chọn tương đương do phần phụ trợ công bố nếu có, chẳng hạn `timeout` hoặc `timeout_seconds`.                                                                                                |
| `/acp cwd <path>`            | giá trị ghi đè cwd của môi trường chạy | Cập nhật trực tiếp.                                                                                                                                                                                         |
| `/acp set <key> <value>`     | chung                                 | `key=cwd` sử dụng đường dẫn ghi đè cwd.                                                                                                                                                                     |
| `/acp reset-options`         | xóa tất cả giá trị ghi đè môi trường chạy | -                                                                                                                                                                                                          |

## Bộ điều phối acpx, thiết lập plugin và quyền

Để biết cấu hình bộ điều phối acpx (bí danh Claude Code / Codex / Gemini CLI),
các cầu nối MCP của plugin-tools và OpenClaw-tools, cũng như các chế độ quyền ACP,
hãy xem [Tác nhân ACP — thiết lập](/vi/tools/acp-agents-setup).

## Khắc phục sự cố

| Triệu chứng                                                                                   | Nguyên nhân có thể xảy ra                                                                                                           | Cách khắc phục                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ACP runtime backend is not configured`                                                   | Plugin phần phụ trợ bị thiếu, bị vô hiệu hóa hoặc bị chặn bởi `plugins.allow`.                                                       | Cài đặt và bật Plugin phần phụ trợ, thêm `acpx` vào `plugins.allow` khi danh sách cho phép đó được thiết lập, sau đó chạy `/acp doctor`.                                                 |
| `ACP is disabled by policy (acp.enabled=false)`                                           | ACP bị vô hiệu hóa trên toàn hệ thống.                                                                                                 | Đặt `acp.enabled=true`.                                                                                                                                                  |
| `ACP dispatch is disabled by policy (acp.dispatch.enabled=false)`                         | Tính năng điều phối tự động từ các tin nhắn luồng thông thường bị vô hiệu hóa.                                                               | Đặt `acp.dispatch.enabled=true` để tiếp tục định tuyến luồng tự động; các lệnh gọi `sessions_spawn({ runtime: "acp" })` tường minh vẫn hoạt động.                                      |
| `ACP agent "<id>" is not allowed by policy`                                               | Tác tử không có trong danh sách cho phép.                                                                                                | Sử dụng `agentId` được phép hoặc cập nhật `acp.allowedAgents`.                                                                                                                     |
| `/acp doctor` báo phần phụ trợ chưa sẵn sàng ngay sau khi khởi động                               | Plugin phần phụ trợ bị thiếu, bị vô hiệu hóa, bị chặn bởi chính sách cho phép/từ chối hoặc tệp thực thi đã cấu hình của nó không khả dụng.        | Cài đặt/bật Plugin phần phụ trợ, chạy lại `/acp doctor` và kiểm tra lỗi cài đặt hoặc lỗi chính sách của phần phụ trợ nếu trạng thái vẫn không ổn định.                                           |
| Không tìm thấy lệnh của bộ thực thi                                                                 | CLI của bộ điều hợp chưa được cài đặt, Plugin bên ngoài bị thiếu hoặc lần tải `npx` đầu tiên thất bại đối với bộ điều hợp không phải Codex. | Chạy `/acp doctor`, cài đặt/khởi động trước bộ điều hợp trên máy chủ Gateway hoặc cấu hình tường minh lệnh tác tử acpx.                                                      |
| Bộ thực thi báo không tìm thấy mô hình                                                          | Mã định danh mô hình hợp lệ đối với nhà cung cấp/bộ thực thi khác nhưng không hợp lệ đối với đích ACP này.                                                | Sử dụng mô hình do bộ thực thi đó liệt kê, cấu hình mô hình trong bộ thực thi hoặc bỏ phần ghi đè.                                                                            |
| Lỗi xác thực nhà cung cấp từ bộ thực thi                                                        | OpenClaw hoạt động bình thường nhưng CLI/nhà cung cấp đích chưa đăng nhập.                                                     | Đăng nhập hoặc cung cấp khóa nhà cung cấp bắt buộc trong môi trường máy chủ Gateway.                                                                                             |
| `Unable to resolve session target: ...`                                                   | Mã khóa/mã định danh/nhãn không hợp lệ.                                                                                                | Chạy `/acp sessions`, sao chép chính xác khóa/nhãn rồi thử lại.                                                                                                                        |
| `--bind here requires running /acp spawn inside an active ... conversation`               | `--bind here` được sử dụng khi không có cuộc trò chuyện đang hoạt động và có thể liên kết.                                                            | Chuyển đến cuộc trò chuyện/kênh đích rồi thử lại hoặc tạo phiên không liên kết.                                                                                                         |
| `Conversation bindings are unavailable for <channel>.`                                    | Bộ điều hợp không có khả năng liên kết ACP với cuộc trò chuyện hiện tại.                                                             | Sử dụng `/acp spawn ... --thread ...` tại nơi được hỗ trợ, cấu hình `bindings[]` cấp cao nhất hoặc chuyển sang kênh được hỗ trợ.                                                     |
| `--thread here requires running /acp spawn inside an active ... thread`                   | `--thread here` được sử dụng bên ngoài ngữ cảnh luồng.                                                                         | Chuyển đến luồng đích hoặc sử dụng `--thread auto`/`off`.                                                                                                                      |
| `Only <user-id> can rebind this channel/conversation/thread.`                             | Một người dùng khác sở hữu đích liên kết đang hoạt động.                                                                           | Liên kết lại với tư cách chủ sở hữu hoặc sử dụng một cuộc trò chuyện hay luồng khác.                                                                                                               |
| `Thread bindings are unavailable for <channel>.`                                          | Bộ điều hợp không có khả năng liên kết luồng.                                                                               | Sử dụng `--thread off` hoặc chuyển sang bộ điều hợp/kênh được hỗ trợ.                                                                                                                 |
| `Sandboxed sessions cannot spawn ACP sessions ...`                                        | Môi trường chạy ACP nằm phía máy chủ; phiên yêu cầu đang ở trong sandbox.                                                              | Sử dụng `runtime="subagent"` từ các phiên trong sandbox hoặc tạo phiên ACP từ một phiên không ở trong sandbox.                                                                         |
| `sessions_spawn sandbox="require" is unsupported for runtime="acp" ...`                   | `sandbox="require"` được yêu cầu cho môi trường chạy ACP.                                                                         | Sử dụng `runtime="subagent"` khi bắt buộc phải có sandbox hoặc sử dụng ACP với `sandbox="inherit"` từ một phiên không ở trong sandbox.                                                      |
| `Cannot apply --model ... did not advertise model support`                                | Bộ thực thi đích không cung cấp khả năng chuyển đổi mô hình ACP chung.                                                        | Sử dụng bộ thực thi công bố ACP `models`/`session/set_model`, sử dụng tham chiếu mô hình Codex ACP hoặc cấu hình mô hình trực tiếp trong bộ thực thi nếu nó có cờ khởi động riêng. |
| Thiếu siêu dữ liệu ACP cho phiên đã liên kết                                                    | Siêu dữ liệu phiên ACP đã cũ hoặc đã bị xóa.                                                                                    | Tạo lại bằng `/acp spawn`, sau đó liên kết lại/đưa luồng vào tiêu điểm.                                                                                                                    |
| `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` | `permissionMode` chặn thao tác ghi/thực thi trong phiên ACP không tương tác.                                                    | Đặt `plugins.entries.acpx.config.permissionMode` thành `approve-all` và khởi động lại Gateway. Xem [Cấu hình quyền](/vi/tools/acp-agents-setup#permission-configuration). |
| Phiên ACP thất bại sớm và có rất ít đầu ra                                                | Lời nhắc cấp quyền bị chặn bởi `permissionMode`/`nonInteractivePermissions`.                                        | Kiểm tra nhật ký Gateway để tìm `AcpRuntimeError`. Để có đầy đủ quyền, đặt `permissionMode=approve-all`; để giảm cấp chức năng một cách an toàn, đặt `nonInteractivePermissions=deny`.        |
| Phiên ACP bị đình trệ vô thời hạn sau khi hoàn thành công việc                                     | Tiến trình bộ thực thi đã kết thúc nhưng phiên ACP không báo cáo hoàn tất.                                                    | Cập nhật OpenClaw; cơ chế dọn dẹp acpx hiện tại sẽ thu hồi các tiến trình trình bao và bộ điều hợp đã cũ do OpenClaw sở hữu khi đóng và khi Gateway khởi động.                                             |
| Bộ thực thi nhìn thấy `<<<BEGIN_OPENCLAW_INTERNAL_CONTEXT>>>`                                      | Phong bì sự kiện nội bộ bị rò rỉ qua ranh giới ACP.                                                                | Cập nhật OpenClaw và chạy lại quy trình hoàn tất; các bộ thực thi bên ngoài chỉ nên nhận lời nhắc hoàn tất dạng văn bản thuần.                                                          |

<Note>
`Command blocked by PreToolUse hook: Native hook relay unavailable` thuộc về
cơ chế chuyển tiếp hook Codex gốc, không phải ACP/acpx. Trong cuộc trò chuyện Codex đã liên kết, hãy bắt đầu
một phiên mới bằng `/new` hoặc `/reset`; nếu lệnh hoạt động một lần rồi lỗi xuất hiện lại ở
lần gọi công cụ gốc tiếp theo, hãy khởi động lại máy chủ ứng dụng Codex hoặc Gateway OpenClaw
thay vì lặp lại `/new`. Xem
[Khắc phục sự cố bộ thực thi Codex](/vi/plugins/codex-harness#troubleshooting).
</Note>

## Liên quan

- [Tác tử ACP - thiết lập](/vi/tools/acp-agents-setup)
- [Gửi tác tử](/vi/tools/agent-send)
- [Phần phụ trợ CLI](/vi/gateway/cli-backends)
- [Bộ thực thi Codex](/vi/plugins/codex-harness)
- [Môi trường chạy bộ thực thi Codex](/vi/plugins/codex-harness-runtime)
- [Công cụ sandbox đa tác tử](/vi/tools/multi-agent-sandbox-tools)
- [`openclaw acp` (chế độ cầu nối)](/vi/cli/acp)
- [Tác tử phụ](/vi/tools/subagents)
