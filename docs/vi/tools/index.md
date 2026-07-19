---
doc-schema-version: 1
read_when:
    - Bạn muốn tìm hiểu những công cụ mà OpenClaw cung cấp
    - Bạn đang cân nhắc giữa các công cụ tích hợp sẵn, Skills và plugin
    - Bạn cần đúng điểm bắt đầu trong tài liệu về chính sách công cụ, tự động hóa hoặc điều phối tác nhân
summary: 'Tổng quan về công cụ, Skills và Plugin của OpenClaw: các tác vụ mà tác nhân có thể gọi và cách mở rộng chúng'
title: Tổng quan
x-i18n:
    generated_at: "2026-07-19T06:23:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e23f9c2405766feb98db4d34baee41b73df002966a48525ba76c5f4b260f126
    source_path: tools/index.md
    workflow: 16
---

Sử dụng trang này để chọn bề mặt Khả năng phù hợp. **Công cụ** là các
hành động có thể gọi, **skill** hướng dẫn agent cách làm việc, còn **plugin** bổ sung
các khả năng runtime như công cụ, nhà cung cấp, kênh, hook và các
skill được đóng gói.

Đây là trang tổng quan và định tuyến. Để biết đầy đủ về chính sách công cụ, giá trị mặc định,
thành viên nhóm, hạn chế của nhà cung cấp và các trường cấu hình, hãy xem
[Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

## Bắt đầu tại đây

Đối với hầu hết agent, hãy bắt đầu bằng các danh mục công cụ tích hợp, sau đó chỉ điều chỉnh chính sách
khi agent cần thấy ít công cụ hơn hoặc cần quyền truy cập máy chủ rõ ràng.

| Nếu bạn cần...                                  | Trước tiên hãy dùng                               | Sau đó đọc                                                                                                                                                   |
| ----------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cho phép agent hành động bằng các khả năng hiện có | [Công cụ tích hợp](#built-in-tool-categories)     | [Danh mục công cụ](#built-in-tool-categories)                                                                                                                |
| Kiểm soát những gì agent có thể gọi             | [Chính sách công cụ](#configure-access-and-approvals) | [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools)                                                                                                 |
| Hướng dẫn agent một quy trình làm việc           | [Skills](#choose-tools-skills-or-plugins)         | [Skills](/vi/tools/skills), [Tạo skill](/vi/tools/creating-skills), [Xưởng Skill](/vi/tools/skill-workshop) và [Tự học](/vi/tools/self-learning)                         |
| Thêm tích hợp hoặc bề mặt runtime mới            | [Plugin](#extend-capabilities)                    | [Plugin](/vi/tools/plugin) và [Xây dựng plugin](/vi/plugins/building-plugins)                                                                                       |
| Chạy công việc sau hoặc trong nền                | [Tự động hóa](/vi/automation)                        | [Tổng quan về tự động hóa](/vi/automation)                                                                                                                      |
| Điều phối nhiều agent hoặc harness               | [Agent con](/vi/tools/subagents)                     | [Agent ACP](/vi/tools/acp-agents) và [Gửi agent](/vi/tools/agent-send)                                                                                             |
| Tìm kiếm danh mục công cụ OpenClaw lớn           | [Tìm kiếm công cụ](/vi/tools/tool-search)            | [Tìm kiếm công cụ](/vi/tools/tool-search)                                                                                                                       |
| Kết hợp nhiều công cụ trong một chương trình gọn | [Chế độ mã](/tools/code-mode)                     | [Chế độ mã](/tools/code-mode)                                                                                                                                |

## Chọn công cụ, skill hoặc plugin

<Steps>
  <Step title="Dùng công cụ khi agent cần hành động">
    Công cụ là một hàm có kiểu mà agent có thể gọi, chẳng hạn như `exec`, `browser`,
    `web_search`, `message` hoặc `image_generate`. Dùng công cụ khi agent
    cần đọc dữ liệu, thay đổi tệp, gửi tin nhắn, gọi nhà cung cấp hoặc
    vận hành một hệ thống khác. Các công cụ hiển thị được gửi đến mô hình dưới dạng
    định nghĩa hàm có cấu trúc.

    Mô hình chỉ thấy những công cụ còn lại sau khi áp dụng hồ sơ đang hoạt động, chính sách
    cho phép/từ chối, hạn chế của nhà cung cấp, trạng thái sandbox, quyền của kênh và
    tính khả dụng của plugin.

  </Step>

  <Step title="Dùng skill khi agent cần hướng dẫn">
    Skill là một gói hướng dẫn `SKILL.md` được nạp vào prompt của agent. Hãy dùng
    skill khi agent đã có các công cụ cần thiết nhưng cần một
    quy trình làm việc có thể lặp lại, tiêu chí review, chuỗi lệnh hoặc ràng buộc
    vận hành.

    Skill có thể nằm trong workspace, thư mục skill dùng chung, thư mục gốc skill
    do OpenClaw quản lý hoặc gói plugin.

    [Skills](/vi/tools/skills) | [Xưởng Skill](/vi/tools/skill-workshop) | [Tự học](/vi/tools/self-learning) | [Tạo skill](/vi/tools/creating-skills) | [Cấu hình skill](/vi/tools/skills-config)

  </Step>

  <Step title="Dùng plugin khi OpenClaw cần khả năng mới">
    Plugin có thể bổ sung công cụ, skill, kênh, nhà cung cấp mô hình, giọng nói,
    thoại thời gian thực, tạo nội dung đa phương tiện, tìm kiếm web, truy xuất web, hook và các
    khả năng runtime khác. Hãy dùng plugin khi khả năng đó có mã,
    thông tin xác thực, hook vòng đời, siêu dữ liệu manifest hoặc
    gói có thể cài đặt. Có thể cài đặt các plugin hiện có từ ClawHub, npm, git,
    thư mục cục bộ hoặc tệp lưu trữ.

    [Cài đặt và cấu hình plugin](/vi/tools/plugin) | [Xây dựng plugin](/vi/plugins/building-plugins) | [SDK Plugin](/vi/plugins/sdk-overview)

  </Step>
</Steps>

## Danh mục công cụ tích hợp

Bảng này liệt kê các công cụ tiêu biểu để bạn nhận biết bề mặt. Đây
không phải tài liệu tham chiếu chính sách đầy đủ. Để biết chính xác các nhóm, giá trị mặc định và ngữ nghĩa
cho phép/từ chối, hãy xem [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

| Danh mục                | Dùng khi agent cần...                                                                     | Công cụ tiêu biểu                                                                                      | Đọc tiếp                                                                                                               |
| ----------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Runtime                 | Chạy lệnh, quản lý tiến trình hoặc dùng phân tích Python do nhà cung cấp hỗ trợ            | `exec`, `process`, `terminal`, `code_execution`                        | [Thực thi](/vi/tools/exec), [Terminal Control UI](/vi/web/control-ui#operator-terminal), [Thực thi mã](/vi/tools/code-execution) |
| Tệp                     | Đọc và thay đổi các tệp trong workspace                                                    | `read`, `write`, `edit`, `apply_patch`                        | [Áp dụng bản vá](/vi/tools/apply-patch)                                                                                   |
| Đầu vào của con người   | Tạm dừng để chờ quyết định có cấu trúc thuộc quyền người dùng                              | `ask_user`                                                                                     | [Hỏi người dùng](/tools/ask-user)                                                                                      |
| Web                     | Tìm kiếm web, tìm kiếm bài đăng trên X hoặc truy xuất nội dung trang dễ đọc                | `web_search`, `x_search`, `web_fetch`                                            | [Công cụ web](/vi/tools/web), [Truy xuất web](/vi/tools/web-fetch)                                                           |
| Trình duyệt             | Vận hành một phiên trình duyệt                                                             | `browser`                                                                                     | [Trình duyệt](/vi/tools/browser)                                                                                          |
| Giao diện người vận hành | Sắp xếp các ngăn, bảng điều khiển và điều hướng Control UI đã kết nối                     | `screen`                                                                                     | [Màn hình](/tools/screen)                                                                                              |
| Nhắn tin và kênh        | Gửi phản hồi hoặc hành động trên kênh                                                      | `message`                                                                                     | [Gửi agent](/vi/tools/agent-send)                                                                                         |
| Phiên và agent          | Kiểm tra phiên, ủy quyền công việc, điều hướng một lượt chạy khác hoặc báo cáo trạng thái  | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Mục tiêu](/vi/tools/goal), [Agent con](/vi/tools/subagents), [Công cụ phiên](/vi/concepts/session-tool) |
| Tự động hóa             | Lên lịch công việc hoặc phản hồi các sự kiện nền                                           | `cron`, `heartbeat_respond`                                                                | [Tự động hóa](/vi/automation)                                                                                             |
| Gateway và node         | Kiểm tra trạng thái Gateway hoặc các thiết bị đích đã ghép nối                             | `gateway`, `nodes`                                                                | [Cấu hình Gateway](/vi/gateway/configuration), [Node](/vi/nodes)                                                             |
| Đa phương tiện          | Phân tích, tạo hoặc đọc thành tiếng nội dung đa phương tiện                                | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`   | [Tổng quan về đa phương tiện](/vi/tools/media-overview)                                                                   |
| Danh mục OpenClaw lớn   | Tìm kiếm, gọi và kết hợp nhiều công cụ đủ điều kiện mà không gửi mọi schema đến mô hình    | `exec`, `wait`, `tool_search_code`, `tool_search`, `tool_describe`   | [Chế độ mã](/tools/code-mode), [Tìm kiếm công cụ](/vi/tools/tool-search)                                                  |

<Note>
Chế độ mã và Tìm kiếm công cụ là các bề mặt agent OpenClaw thử nghiệm. Các lượt chạy
harness Codex sử dụng chế độ mã gốc của Codex, tìm kiếm công cụ gốc, các công cụ động
được trì hoãn và lệnh gọi công cụ lồng nhau thay vì `tools.codeMode` hoặc `tools.toolSearch`.
</Note>

## Công cụ do plugin cung cấp

Plugin có thể đăng ký thêm công cụ. Tác giả plugin kết nối công cụ thông qua
`api.registerTool(...)` và `contracts.tools` của manifest; hãy xem
[SDK Plugin](/vi/plugins/sdk-overview) và [Manifest plugin](/vi/plugins/manifest)
để biết chi tiết về hợp đồng.

Các công cụ phổ biến do plugin cung cấp gồm:

- [Diff](/vi/tools/diffs) để hiển thị diff của tệp và markdown
- [Hiển thị tiện ích](/vi/tools/show-widget) cho SVG và HTML nội tuyến độc lập trong các ứng dụng trò chuyện được hỗ trợ
- [Màn hình](/tools/screen) để sắp xếp Control UI đã kết nối
- [Tác vụ LLM](/vi/tools/llm-task) cho các bước quy trình làm việc chỉ dùng JSON
- [Lobster](/vi/tools/lobster) cho các quy trình làm việc có kiểu với phê duyệt có thể tiếp tục
- [Tokenjuice](/vi/tools/tokenjuice) để thu gọn đầu ra gây nhiễu của công cụ
  `exec` và `bash`
- [Tìm kiếm công cụ](/vi/tools/tool-search) để khám phá và gọi các danh mục
  công cụ lớn mà không đưa mọi schema vào prompt
- [Canvas](/vi/plugins/reference/canvas) để điều khiển Canvas của node và
  hiển thị A2UI

## Cấu hình quyền truy cập và phê duyệt

Chính sách công cụ được thực thi trước lệnh gọi mô hình. Nếu chính sách loại bỏ một công cụ,
mô hình sẽ không nhận được schema của công cụ đó trong lượt này. Một lượt chạy có thể mất công cụ
do cấu hình toàn cục, cấu hình theo từng agent, chính sách kênh, hạn chế của nhà cung cấp,
quy tắc sandbox, chính sách kênh/runtime hoặc tính khả dụng của plugin.

- [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) trình bày các hồ sơ công cụ,
  danh sách cho phép/từ chối, hạn chế theo từng nhà cung cấp, phát hiện vòng lặp và
  các thiết lập công cụ do nhà cung cấp hỗ trợ.
- [Phê duyệt thực thi](/vi/tools/exec-approvals) trình bày chính sách phê duyệt
  lệnh trên máy chủ.
- [Thực thi nâng quyền](/vi/tools/elevated) trình bày việc thực thi có kiểm soát bên ngoài
  sandbox.
- [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
  giải thích lớp nào kiểm soát quyền truy cập tệp và tiến trình.
- [Hạn chế sandbox và công cụ theo từng agent](/vi/tools/multi-agent-sandbox-tools)
  trình bày các hạn chế dành riêng cho từng agent trong các lượt chạy được ủy quyền.

## Mở rộng khả năng

Chọn cách mở rộng dựa trên công việc bạn cần OpenClaw thực hiện:

- Cài đặt hoặc quản lý một plugin hiện có bằng [Plugin](/vi/tools/plugin).
- Xây dựng một tích hợp, nhà cung cấp, kênh, công cụ hoặc hook mới bằng
  [Xây dựng plugin](/vi/plugins/building-plugins).
- Thêm hoặc tinh chỉnh các chỉ dẫn có thể tái sử dụng cho agent bằng [Skills](/vi/tools/skills) và
  [Tạo skill](/vi/tools/creating-skills).
- Sử dụng [Plugin SDK](/vi/plugins/sdk-overview) và
  [manifest của plugin](/vi/plugins/manifest) khi bạn cần các hợp đồng
  triển khai.

## Khắc phục sự cố thiếu công cụ

Nếu mô hình không thể thấy hoặc gọi một công cụ, hãy bắt đầu với chính sách có hiệu lực cho
lượt hiện tại:

1. Kiểm tra hồ sơ đang hoạt động, `tools.allow` và `tools.deny` trong
   [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).
2. Kiểm tra các hạn chế theo từng nhà cung cấp trong
   [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) và xác nhận
   [nhà cung cấp mô hình](/vi/concepts/model-providers) đã chọn hỗ trợ cấu trúc
   công cụ đó.
3. Kiểm tra quyền của kênh, trạng thái sandbox và quyền truy cập nâng cao bằng
   [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
   và [Thực thi nâng quyền](/vi/tools/elevated).
4. Kiểm tra xem plugin sở hữu công cụ đã được cài đặt và bật trong
   [Plugin](/vi/tools/plugin) hay chưa.
5. Đối với các lượt chạy được ủy quyền, hãy kiểm tra hạn chế theo từng agent trong
   [Hạn chế sandbox và công cụ theo từng agent](/vi/tools/multi-agent-sandbox-tools).
6. Đối với các danh mục OpenClaw lớn, hãy xác nhận lượt chạy sử dụng chế độ hiển thị công cụ
   trực tiếp, [Chế độ mã](/tools/code-mode) hay [Tìm kiếm công cụ](/vi/tools/tool-search).

## Liên quan

- [Tự động hóa](/vi/automation) dành cho cron, tác vụ, heartbeat, cam kết, hook,
  chỉ thị thường trực và Luồng tác vụ
- [Agent](/vi/concepts/agent) dành cho mô hình agent, phiên, bộ nhớ và
  phối hợp đa agent
- [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) dành cho tài liệu tham chiếu chính thức về
  chính sách công cụ
- [Plugin](/vi/tools/plugin) dành cho việc cài đặt và quản lý plugin
- [Plugin SDK](/vi/plugins/sdk-overview) dành cho tài liệu tham chiếu cho tác giả plugin
- [Skills](/vi/tools/skills) dành cho thứ tự tải skill, kiểm soát truy cập và cấu hình
- [Xưởng Skill](/vi/tools/skill-workshop) dành cho việc tạo skill có sinh tự động và được đánh giá
- [Tìm kiếm công cụ](/vi/tools/tool-search) dành cho việc khám phá danh mục công cụ OpenClaw
  gọn nhẹ
- [Chế độ mã](/tools/code-mode) dành cho các quy trình JavaScript hoặc TypeScript gọn nhẹ
  trên một danh mục công cụ OpenClaw ẩn
