---
doc-schema-version: 1
read_when:
    - Bạn muốn hiểu OpenClaw cung cấp những công cụ nào
    - Bạn đang lựa chọn giữa công cụ tích hợp sẵn, Skills và Plugin
    - Bạn cần điểm vào tài liệu phù hợp cho chính sách công cụ, tự động hóa hoặc điều phối tác nhân
summary: 'Tổng quan về công cụ, Skills và Plugin của OpenClaw: tác tử có thể gọi gì và cách mở rộng chúng'
title: Tổng quan
x-i18n:
    generated_at: "2026-06-27T18:17:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f49afa2354ebb26eeb5f036cd1f2f7ceb228b01287adbc6c305addfb0af4502d
    source_path: tools/index.md
    workflow: 16
---

Dùng trang này để chọn đúng bề mặt Capabilities. **Công cụ** là các
hành động có thể gọi, **Skills** dạy tác tử cách làm việc, và **Plugin** thêm
các capability thời gian chạy như công cụ, nhà cung cấp, kênh, hook và Skills
được đóng gói.

Đây là trang tổng quan và định tuyến. Để xem đầy đủ chính sách công cụ, mặc
định, thành viên nhóm, hạn chế theo nhà cung cấp và các trường cấu hình, hãy dùng
[Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

## Bắt đầu tại đây

Với hầu hết tác tử, hãy bắt đầu bằng các danh mục công cụ tích hợp sẵn, rồi điều
chỉnh chính sách chỉ khi tác tử nên thấy ít công cụ hơn hoặc cần quyền truy cập
máy chủ rõ ràng.

| Nếu bạn cần...                                      | Dùng mục này trước                                      | Sau đó đọc                                                                                                                    |
| --------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Cho phép tác tử hành động bằng các capability sẵn có | [Công cụ tích hợp sẵn](#built-in-tool-categories)       | [Danh mục công cụ](#built-in-tool-categories)                                                                                |
| Kiểm soát tác tử có thể gọi gì                      | [Chính sách công cụ](#configure-access-and-approvals)   | [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools)                                                                   |
| Dạy tác tử một workflow                             | [Skills](#choose-tools-skills-or-plugins)               | [Skills](/vi/tools/skills), [Tạo Skills](/vi/tools/creating-skills), và [Skill Workshop](/vi/tools/skill-workshop)                    |
| Thêm tích hợp mới hoặc bề mặt thời gian chạy        | [Plugin](#extend-capabilities)                          | [Plugin](/vi/tools/plugin) và [Xây dựng Plugin](/vi/plugins/building-plugins)                                                      |
| Chạy công việc sau hoặc trong nền                   | [Tự động hóa](/vi/automation)                              | [Tổng quan về tự động hóa](/vi/automation)                                                                                      |
| Điều phối nhiều tác tử hoặc harness                 | [Tác tử phụ](/vi/tools/subagents)                          | [Tác tử ACP](/vi/tools/acp-agents) và [Gửi tác tử](/vi/tools/agent-send)                                                           |
| Tìm kiếm một danh mục công cụ OpenClaw lớn          | [Tìm kiếm công cụ](/vi/tools/tool-search)                  | [Tìm kiếm công cụ](/vi/tools/tool-search)                                                                                       |

## Chọn công cụ, Skills hoặc Plugin

<Steps>
  <Step title="Use a tool when the agent needs to act">
    Công cụ là một hàm có kiểu mà tác tử có thể gọi, chẳng hạn như `exec`,
    `browser`, `web_search`, `message`, hoặc `image_generate`. Dùng công cụ khi
    tác tử cần đọc dữ liệu, thay đổi tệp, gửi tin nhắn, gọi một nhà cung cấp,
    hoặc vận hành hệ thống khác. Các công cụ hiển thị được gửi đến mô hình dưới
    dạng định nghĩa hàm có cấu trúc.

    Mô hình chỉ thấy các công cụ vượt qua hồ sơ đang hoạt động, chính sách
    cho phép/từ chối, hạn chế theo nhà cung cấp, trạng thái sandbox, quyền của
    kênh và tình trạng sẵn có của Plugin.

  </Step>

  <Step title="Use a skill when the agent needs instructions">
    Skill là một gói chỉ dẫn `SKILL.md` được nạp vào prompt của tác tử. Dùng
    Skill khi tác tử đã có các công cụ cần thiết, nhưng cần một workflow có thể
    lặp lại, rubric đánh giá, chuỗi lệnh, hoặc ràng buộc vận hành.

    Skills có thể nằm trong workspace, thư mục Skill dùng chung, gốc Skill do
    OpenClaw quản lý, hoặc gói Plugin.

    [Skills](/vi/tools/skills) | [Skill Workshop](/vi/tools/skill-workshop) | [Tạo Skills](/vi/tools/creating-skills) | [Cấu hình Skills](/vi/tools/skills-config)

  </Step>

  <Step title="Use a plugin when OpenClaw needs a new capability">
    Plugin có thể thêm công cụ, Skills, kênh, nhà cung cấp mô hình, giọng nói,
    thoại thời gian thực, tạo media, tìm kiếm web, lấy nội dung web, hook và các
    capability thời gian chạy khác. Dùng Plugin khi capability có mã, thông tin
    xác thực, hook vòng đời, siêu dữ liệu manifest hoặc gói có thể cài đặt.
    Plugin hiện có có thể được cài đặt từ ClawHub, npm, git, thư mục cục bộ,
    hoặc tệp lưu trữ.

    [Cài đặt và cấu hình Plugin](/vi/tools/plugin) | [Xây dựng Plugin](/vi/plugins/building-plugins) | [Plugin SDK](/vi/plugins/sdk-overview)

  </Step>
</Steps>

## Danh mục công cụ tích hợp sẵn

Bảng này liệt kê các công cụ đại diện để bạn có thể nhận diện bề mặt. Đây
không phải tài liệu tham chiếu chính sách đầy đủ. Để biết chính xác các nhóm,
mặc định và ngữ nghĩa cho phép/từ chối, hãy dùng [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

| Danh mục                | Dùng khi tác tử cần...                                                        | Công cụ đại diện                                                    | Đọc tiếp                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Thời gian chạy          | Chạy lệnh, quản lý tiến trình, hoặc dùng phân tích Python dựa trên nhà cung cấp | `exec`, `process`, `code_execution`                                 | [Exec](/vi/tools/exec), [Thực thi mã](/vi/tools/code-execution)                                      |
| Tệp                     | Đọc và thay đổi tệp trong workspace                                           | `read`, `write`, `edit`, `apply_patch`                              | [Áp dụng bản vá](/vi/tools/apply-patch)                                                           |
| Web                     | Tìm kiếm web, tìm kiếm bài đăng X, hoặc lấy nội dung trang có thể đọc         | `web_search`, `x_search`, `web_fetch`                               | [Công cụ web](/vi/tools/web), [Lấy nội dung web](/vi/tools/web-fetch)                                |
| Trình duyệt             | Vận hành một phiên trình duyệt                                                | `browser`                                                           | [Trình duyệt](/vi/tools/browser)                                                                  |
| Nhắn tin và kênh        | Gửi phản hồi hoặc hành động kênh                                              | `message`                                                           | [Gửi tác tử](/vi/tools/agent-send)                                                                |
| Phiên và tác tử         | Kiểm tra phiên, ủy quyền công việc, điều hướng lượt chạy khác, hoặc báo cáo trạng thái | `sessions_*`, `subagents`, `agents_list`, `session_status`, `goal`  | [Mục tiêu](/vi/tools/goal), [Tác tử phụ](/vi/tools/subagents), [Công cụ phiên](/vi/concepts/session-tool) |
| Tự động hóa             | Lên lịch công việc hoặc phản hồi sự kiện nền                                  | `cron`, `heartbeat_respond`                                         | [Tự động hóa](/vi/automation)                                                                     |
| Gateway và node         | Kiểm tra trạng thái Gateway hoặc thiết bị đích đã ghép nối                   | `gateway`, `nodes`                                                  | [Cấu hình Gateway](/vi/gateway/configuration), [Node](/vi/nodes)                                     |
| Media                   | Phân tích, tạo hoặc nói media                                                 | `image`, `image_generate`, `music_generate`, `video_generate`, `tts` | [Tổng quan media](/vi/tools/media-overview)                                                       |
| Danh mục OpenClaw lớn   | Tìm kiếm và gọi nhiều công cụ đủ điều kiện mà không gửi mọi schema đến mô hình | `tool_search_code`, `tool_search`, `tool_describe`                  | [Tìm kiếm công cụ](/vi/tools/tool-search)                                                         |

<Note>
Tìm kiếm công cụ là một bề mặt tác tử OpenClaw thử nghiệm. Các lượt chạy Codex
harness dùng chế độ mã gốc của Codex, tìm kiếm công cụ gốc, công cụ động trì
hoãn và lời gọi công cụ lồng nhau thay vì `tools.toolSearch`.
</Note>

## Công cụ do Plugin cung cấp

Plugin có thể đăng ký thêm công cụ. Tác giả Plugin nối công cụ qua
`api.registerTool(...)` và `contracts.tools` của manifest; dùng
[Plugin SDK](/vi/plugins/sdk-overview) và [Plugin manifest](/vi/plugins/manifest)
để xem chi tiết hợp đồng.

Các công cụ phổ biến do Plugin cung cấp gồm:

- [Diff](/vi/tools/diffs) để render diff tệp và markdown
- [LLM Task](/vi/tools/llm-task) cho các bước workflow chỉ dùng JSON
- [Lobster](/vi/tools/lobster) cho workflow có kiểu với phê duyệt có thể tiếp tục
- [Tokenjuice](/vi/tools/tokenjuice) để nén đầu ra công cụ `exec` và `bash` nhiều nhiễu
- [Tìm kiếm công cụ](/vi/tools/tool-search) để khám phá và gọi các danh mục công cụ lớn
  mà không đưa mọi schema vào prompt
- [Canvas](/vi/plugins/reference/canvas) để điều khiển node Canvas và render A2UI

## Cấu hình quyền truy cập và phê duyệt

Chính sách công cụ được thực thi trước lời gọi mô hình. Nếu chính sách loại bỏ
một công cụ, mô hình sẽ không nhận schema của công cụ đó cho lượt này. Một lượt
chạy có thể mất công cụ vì cấu hình toàn cục, cấu hình theo tác tử, chính sách
kênh, hạn chế theo nhà cung cấp, quy tắc sandbox, chính sách kênh/thời gian
chạy, hoặc tình trạng sẵn có của Plugin.

- [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) ghi lại hồ sơ công cụ,
  danh sách cho phép/từ chối, hạn chế theo nhà cung cấp, phát hiện vòng lặp và
  thiết lập công cụ dựa trên nhà cung cấp.
- [Phê duyệt exec](/vi/tools/exec-approvals) ghi lại chính sách phê duyệt lệnh máy chủ.
- [Exec nâng quyền](/vi/tools/elevated) ghi lại việc thực thi được kiểm soát bên ngoài
  sandbox.
- [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) giải thích lớp nào kiểm soát quyền truy cập tệp và tiến trình.
- [Sandbox và hạn chế công cụ theo tác tử](/vi/tools/multi-agent-sandbox-tools)
  ghi lại các hạn chế riêng cho tác tử trong lượt chạy được ủy quyền.

## Mở rộng capability

Chọn đường mở rộng theo công việc bạn cần OpenClaw thực hiện:

- Cài đặt hoặc quản lý Plugin hiện có bằng [Plugin](/vi/tools/plugin).
- Xây dựng tích hợp, nhà cung cấp, kênh, công cụ hoặc hook mới bằng
  [Xây dựng Plugin](/vi/plugins/building-plugins).
- Thêm hoặc tinh chỉnh chỉ dẫn tác tử có thể tái sử dụng bằng [Skills](/vi/tools/skills) và
  [Tạo Skills](/vi/tools/creating-skills).
- Dùng [Plugin SDK](/vi/plugins/sdk-overview) và [Plugin manifest](/vi/plugins/manifest) khi bạn cần các hợp đồng triển khai.

## Khắc phục sự cố thiếu công cụ

Nếu mô hình không thể thấy hoặc gọi một công cụ, hãy bắt đầu bằng chính sách
hiệu lực cho lượt hiện tại:

1. Kiểm tra hồ sơ đang hoạt động, `tools.allow`, và `tools.deny` trong
   [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).
2. Kiểm tra hạn chế theo nhà cung cấp trong
   [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) và xác nhận
   [nhà cung cấp mô hình](/vi/concepts/model-providers) đã chọn hỗ trợ hình dạng công cụ.
3. Kiểm tra quyền của kênh, trạng thái sandbox và quyền truy cập nâng quyền bằng
   [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated) và [Exec nâng quyền](/vi/tools/elevated).
4. Kiểm tra Plugin sở hữu đã được cài đặt và bật trong
   [Plugin](/vi/tools/plugin).
5. Với lượt chạy được ủy quyền, kiểm tra hạn chế theo tác tử trong
   [Sandbox và hạn chế công cụ theo tác tử](/vi/tools/multi-agent-sandbox-tools).
6. Với các danh mục OpenClaw lớn, xác nhận lượt chạy dùng phơi bày công cụ trực tiếp hay
   [Tìm kiếm công cụ](/vi/tools/tool-search).

## Liên quan

- [Tự động hóa](/vi/automation) cho cron, tác vụ, heartbeat, cam kết, hook, lệnh thường trực và Task Flow
- [Tác tử](/vi/concepts/agent) cho mô hình tác tử, phiên, bộ nhớ và điều phối nhiều tác tử
- [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) cho tài liệu tham chiếu chính sách công cụ chuẩn
- [Plugin](/vi/tools/plugin) cho cài đặt và quản lý Plugin
- [Plugin SDK](/vi/plugins/sdk-overview) cho tài liệu tham chiếu dành cho tác giả Plugin
- [Skills](/vi/tools/skills) cho thứ tự nạp Skill, gating và cấu hình
- [Skill Workshop](/vi/tools/skill-workshop) cho việc tạo Skill được sinh và được đánh giá
- [Tìm kiếm công cụ](/vi/tools/tool-search) cho khám phá danh mục công cụ OpenClaw gọn nhẹ
