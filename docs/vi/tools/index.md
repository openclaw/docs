---
doc-schema-version: 1
read_when:
    - Bạn muốn tìm hiểu OpenClaw cung cấp những công cụ nào
    - Bạn đang lựa chọn giữa các công cụ tích hợp sẵn, Skills và plugin
    - Bạn cần đúng điểm bắt đầu trong tài liệu về chính sách công cụ, tự động hóa hoặc phối hợp tác nhân
summary: 'Tổng quan về công cụ, Skills và plugin của OpenClaw: các tác nhân có thể gọi gì và cách mở rộng chúng'
title: Tổng quan
x-i18n:
    generated_at: "2026-07-19T17:10:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cdfb6d012d0e78325b7ee93b9c0b8a82b93315360860426e2c029207f6bf9279
    source_path: tools/index.md
    workflow: 16
---

Sử dụng trang này để chọn bề mặt Khả năng phù hợp. **Công cụ** là các
hành động có thể gọi, **kỹ năng** hướng dẫn agent cách làm việc, còn **plugin** bổ sung
các khả năng thời gian chạy như công cụ, nhà cung cấp, kênh, hook và
kỹ năng đóng gói.

Đây là trang tổng quan và định tuyến. Để xem đầy đủ chính sách công cụ, giá trị mặc định,
thành viên nhóm, hạn chế của nhà cung cấp và các trường cấu hình, hãy dùng
[Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

## Bắt đầu tại đây

Đối với hầu hết agent, hãy bắt đầu với các danh mục công cụ tích hợp sẵn, sau đó chỉ điều chỉnh chính sách
khi agent cần thấy ít công cụ hơn hoặc cần quyền truy cập máy chủ rõ ràng.

| Nếu bạn cần...                                      | Trước tiên hãy dùng                                     | Sau đó đọc                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cho phép agent hành động bằng các khả năng hiện có  | [Công cụ tích hợp sẵn](#built-in-tool-categories)       | [Danh mục công cụ](#built-in-tool-categories)                                                                                                                            |
| Kiểm soát những gì agent có thể gọi                 | [Chính sách công cụ](#configure-access-and-approvals)   | [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools)                                                                                                               |
| Hướng dẫn agent một quy trình làm việc              | [Skills](#choose-tools-skills-or-plugins)               | [Skills](/vi/tools/skills), [Tạo kỹ năng](/vi/tools/creating-skills), [Xưởng kỹ năng](/vi/tools/skill-workshop) và [Tự học](/vi/tools/self-learning)                                |
| Thêm tích hợp hoặc bề mặt thời gian chạy mới        | [Plugin](#extend-capabilities)                          | [Plugin](/vi/tools/plugin) và [Xây dựng plugin](/vi/plugins/building-plugins)                                                                                                  |
| Chạy công việc sau hoặc trong nền                   | [Tự động hóa](/vi/automation)                              | [Tổng quan về tự động hóa](/vi/automation)                                                                                                                                  |
| Điều phối nhiều agent hoặc harness                  | [Agent con](/vi/tools/subagents)                           | [Agent ACP](/vi/tools/acp-agents) và [Gửi qua agent](/vi/tools/agent-send)                                                                                                     |
| Điều phối các agent đồng thời từ mã                 | [Bầy agent](/tools/swarm)                               | [Chế độ mã](/vi/tools/code-mode) và [Agent con](/vi/tools/subagents)                                                                                                           |
| Tìm kiếm danh mục công cụ OpenClaw lớn              | [Tìm kiếm công cụ](/vi/tools/tool-search)                  | [Tìm kiếm công cụ](/vi/tools/tool-search)                                                                                                                                   |
| Kết hợp nhiều công cụ trong một chương trình gọn nhẹ | [Chế độ mã](/vi/tools/code-mode)                           | [Chế độ mã](/vi/tools/code-mode)                                                                                                                                            |

## Chọn công cụ, kỹ năng hoặc plugin

<Steps>
  <Step title="Dùng công cụ khi agent cần hành động">
    Công cụ là một hàm có kiểu mà agent có thể gọi, chẳng hạn như `exec`, `browser`,
    `web_search`, `message` hoặc `image_generate`. Hãy dùng công cụ khi agent
    cần đọc dữ liệu, thay đổi tệp, gửi tin nhắn, gọi nhà cung cấp hoặc
    vận hành một hệ thống khác. Các công cụ hiển thị được gửi đến mô hình dưới dạng
    định nghĩa hàm có cấu trúc.

    Mô hình chỉ thấy các công cụ vượt qua hồ sơ đang hoạt động, chính sách
    cho phép/từ chối, hạn chế của nhà cung cấp, trạng thái sandbox, quyền của kênh và
    tính khả dụng của plugin.

  </Step>

  <Step title="Dùng kỹ năng khi agent cần hướng dẫn">
    Kỹ năng là một gói hướng dẫn `SKILL.md` được nạp vào prompt của agent. Hãy dùng
    kỹ năng khi agent đã có các công cụ cần thiết nhưng cần một
    quy trình làm việc có thể lặp lại, tiêu chí review, trình tự lệnh hoặc
    ràng buộc vận hành.

    Kỹ năng có thể nằm trong workspace, thư mục kỹ năng dùng chung, thư mục gốc kỹ năng
    OpenClaw được quản lý hoặc gói plugin.

    [Skills](/vi/tools/skills) | [Xưởng kỹ năng](/vi/tools/skill-workshop) | [Tự học](/vi/tools/self-learning) | [Tạo kỹ năng](/vi/tools/creating-skills) | [Cấu hình kỹ năng](/vi/tools/skills-config)

  </Step>

  <Step title="Dùng plugin khi OpenClaw cần một khả năng mới">
    Plugin có thể bổ sung công cụ, kỹ năng, kênh, nhà cung cấp mô hình, giọng nói,
    thoại thời gian thực, tạo nội dung đa phương tiện, tìm kiếm web, truy xuất web, hook và các
    khả năng thời gian chạy khác. Hãy dùng plugin khi khả năng đó có mã,
    thông tin xác thực, hook vòng đời, siêu dữ liệu manifest hoặc
    gói có thể cài đặt. Có thể cài đặt các plugin hiện có từ ClawHub, npm, git,
    thư mục cục bộ hoặc kho lưu trữ.

    [Cài đặt và cấu hình plugin](/vi/tools/plugin) | [Xây dựng plugin](/vi/plugins/building-plugins) | [SDK Plugin](/vi/plugins/sdk-overview)

  </Step>
</Steps>

## Danh mục công cụ tích hợp sẵn

Bảng liệt kê các công cụ tiêu biểu để bạn có thể nhận diện bề mặt này. Đây
không phải là tài liệu tham chiếu chính sách đầy đủ. Để biết chính xác các nhóm, giá trị mặc định và ngữ nghĩa
cho phép/từ chối, hãy dùng [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

| Danh mục                | Dùng khi agent cần...                                                                         | Công cụ tiêu biểu                                                                                                     | Đọc tiếp                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Thời gian chạy          | Chạy lệnh, quản lý tiến trình hoặc dùng tính năng phân tích Python do nhà cung cấp hỗ trợ      | `exec`, `process`, `terminal`, `code_execution`                                      | [Thực thi](/vi/tools/exec), [Terminal Control UI](/vi/web/control-ui#operator-terminal), [Thực thi mã](/vi/tools/code-execution)          |
| Tệp                     | Đọc và thay đổi tệp trong workspace                                                           | `read`, `write`, `edit`, `apply_patch`                                      | [Áp dụng bản vá](/vi/tools/apply-patch)                                                                                               |
| Đầu vào của con người   | Tạm dừng để người dùng đưa ra quyết định có cấu trúc                                           | `ask_user`                                                                                                   | [Hỏi người dùng](/vi/tools/ask-user)                                                                                                  |
| Web                     | Tìm kiếm trên web, tìm kiếm bài đăng X hoặc truy xuất nội dung trang dễ đọc                   | `web_search`, `x_search`, `web_fetch`                                                          | [Công cụ web](/vi/tools/web), [Truy xuất web](/vi/tools/web-fetch)                                                                       |
| Trình duyệt             | Vận hành một phiên trình duyệt                                                                | `browser`                                                                                                   | [Trình duyệt](/vi/tools/browser)                                                                                                      |
| Giao diện người vận hành | Sắp xếp các ô, bảng điều khiển và điều hướng Control UI được kết nối                          | `screen`                                                                                                   | [Màn hình](/vi/tools/screen)                                                                                                          |
| Nhắn tin và kênh        | Gửi phản hồi hoặc hành động trên kênh                                                         | `message`                                                                                                   | [Gửi qua agent](/vi/tools/agent-send)                                                                                                 |
| Phiên và agent          | Kiểm tra phiên, ủy quyền công việc, điều phối bộ thu thập, định hướng lượt chạy khác hoặc báo cáo trạng thái | `sessions_*`, `agents_wait`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Mục tiêu](/vi/tools/goal), [Bầy agent](/tools/swarm), [Agent con](/vi/tools/subagents), [Công cụ phiên](/vi/concepts/session-tool) |
| Tự động hóa             | Lên lịch công việc hoặc phản hồi các sự kiện nền                                              | `cron`, `heartbeat_respond`                                                                               | [Tự động hóa](/vi/automation)                                                                                                         |
| Gateway và node         | Kiểm tra trạng thái Gateway hoặc các thiết bị đích đã ghép nối                                | `gateway`, `nodes`                                                                               | [Cấu hình Gateway](/vi/gateway/configuration), [Node](/vi/nodes)                                                                          |
| Đa phương tiện          | Phân tích, tạo hoặc phát giọng nói cho nội dung đa phương tiện                                | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                  | [Tổng quan về đa phương tiện](/vi/tools/media-overview)                                                                                |
| Danh mục OpenClaw lớn   | Tìm kiếm, gọi và kết hợp nhiều công cụ đủ điều kiện mà không gửi mọi schema đến mô hình       | `exec`, `wait`, `tool_search_code`, `tool_search`, `tool_describe`                  | [Chế độ mã](/vi/tools/code-mode), [Tìm kiếm công cụ](/vi/tools/tool-search)                                                              |

<Note>
Chế độ mã và Tìm kiếm công cụ là các bề mặt agent OpenClaw thử nghiệm. Các lượt chạy bằng
harness Codex sử dụng chế độ mã gốc của Codex, tìm kiếm công cụ gốc, công cụ động
được trì hoãn và các lệnh gọi công cụ lồng nhau thay cho `tools.codeMode` hoặc `tools.toolSearch`.
</Note>

## Công cụ do plugin cung cấp

Plugin có thể đăng ký thêm công cụ. Tác giả plugin kết nối công cụ thông qua
`api.registerTool(...)` và `contracts.tools` của manifest; hãy dùng
[SDK Plugin](/vi/plugins/sdk-overview) và [Manifest plugin](/vi/plugins/manifest)
để biết chi tiết về hợp đồng.

Các công cụ phổ biến do plugin cung cấp gồm:

- [Diff](/vi/tools/diffs) để hiển thị diff của tệp và Markdown
- [Hiển thị tiện ích](/vi/tools/show-widget) cho SVG và HTML nội tuyến độc lập trong các ứng dụng trò chuyện được hỗ trợ
- [Màn hình](/vi/tools/screen) để bố trí Control UI đã kết nối
- [Tác vụ LLM](/vi/tools/llm-task) cho các bước quy trình làm việc chỉ dùng JSON
- [Lobster](/vi/tools/lobster) cho các quy trình làm việc có kiểu với phê duyệt có thể tiếp tục
- [Tokenjuice](/vi/tools/tokenjuice) để thu gọn đầu ra công cụ `exec` và `bash`
  nhiều nhiễu
- [Tìm kiếm công cụ](/vi/tools/tool-search) để khám phá và gọi các danh mục công cụ
  lớn mà không cần đưa mọi schema vào prompt
- [Canvas](/vi/plugins/reference/canvas) để điều khiển Canvas của node và kết xuất
  A2UI

## Cấu hình quyền truy cập và phê duyệt

Chính sách công cụ được thực thi trước khi gọi mô hình. Nếu chính sách loại bỏ một công cụ,
mô hình sẽ không nhận được schema của công cụ đó trong lượt này. Một lần chạy có thể mất công cụ
do cấu hình toàn cục, cấu hình theo agent, chính sách kênh, hạn chế của nhà cung cấp,
quy tắc sandbox, chính sách kênh/runtime hoặc tình trạng khả dụng của plugin.

- [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) trình bày hồ sơ công cụ,
  danh sách cho phép/từ chối, hạn chế theo từng nhà cung cấp, phát hiện vòng lặp và
  cài đặt công cụ do nhà cung cấp hỗ trợ.
- [Phê duyệt thực thi](/vi/tools/exec-approvals) trình bày chính sách phê duyệt
  lệnh trên máy chủ.
- [Thực thi nâng quyền](/vi/tools/elevated) trình bày cách thực thi có kiểm soát bên ngoài
  sandbox.
- [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
  giải thích lớp nào kiểm soát quyền truy cập tệp và tiến trình.
- [Hạn chế sandbox và công cụ theo agent](/vi/tools/multi-agent-sandbox-tools)
  trình bày các hạn chế dành riêng cho agent trong những lần chạy được ủy quyền.

## Mở rộng khả năng

Chọn phương thức mở rộng theo công việc bạn cần OpenClaw thực hiện:

- Cài đặt hoặc quản lý một plugin hiện có bằng [Plugin](/vi/tools/plugin).
- Xây dựng tích hợp, nhà cung cấp, kênh, công cụ hoặc hook mới bằng
  [Xây dựng plugin](/vi/plugins/building-plugins).
- Thêm hoặc tinh chỉnh các hướng dẫn có thể tái sử dụng cho agent bằng [Skills](/vi/tools/skills) và
  [Tạo skill](/vi/tools/creating-skills).
- Sử dụng [SDK Plugin](/vi/plugins/sdk-overview) và
  [Manifest plugin](/vi/plugins/manifest) khi bạn cần các hợp đồng
  triển khai.

## Khắc phục sự cố thiếu công cụ

Nếu mô hình không thể thấy hoặc gọi một công cụ, hãy bắt đầu với chính sách có hiệu lực cho
lượt hiện tại:

1. Kiểm tra hồ sơ đang hoạt động, `tools.allow` và `tools.deny` trong
   [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).
2. Kiểm tra các hạn chế theo từng nhà cung cấp trong
   [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) và xác nhận
   [nhà cung cấp mô hình](/vi/concepts/model-providers) đã chọn hỗ trợ cấu trúc
   công cụ này.
3. Kiểm tra quyền của kênh, trạng thái sandbox và quyền truy cập nâng cao bằng
   [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
   và [Thực thi nâng quyền](/vi/tools/elevated).
4. Kiểm tra xem plugin sở hữu công cụ đã được cài đặt và bật trong
   [Plugin](/vi/tools/plugin) hay chưa.
5. Đối với các lần chạy được ủy quyền, hãy kiểm tra các hạn chế theo agent trong
   [Hạn chế sandbox và công cụ theo agent](/vi/tools/multi-agent-sandbox-tools).
6. Đối với các danh mục OpenClaw lớn, hãy xác nhận xem lần chạy sử dụng việc cung cấp công cụ
   trực tiếp, [Chế độ mã](/vi/tools/code-mode) hay [Tìm kiếm công cụ](/vi/tools/tool-search).

## Liên quan

- [Tự động hóa](/vi/automation) cho cron, tác vụ, heartbeat, cam kết, hook,
  chỉ thị thường trực và Luồng tác vụ
- [Agent](/vi/concepts/agent) cho mô hình agent, phiên, bộ nhớ và
  phối hợp đa agent
- [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) để tham khảo chính sách công cụ
  chính thức
- [Plugin](/vi/tools/plugin) để cài đặt và quản lý plugin
- [SDK Plugin](/vi/plugins/sdk-overview) để tham khảo khi xây dựng plugin
- [Skills](/vi/tools/skills) để tìm hiểu thứ tự tải, cơ chế kiểm soát và cấu hình skill
- [Xưởng Skill](/vi/tools/skill-workshop) để tạo skill có quy trình sinh tự động và review
- [Tìm kiếm công cụ](/vi/tools/tool-search) để khám phá danh mục công cụ OpenClaw
  ở dạng rút gọn
- [Chế độ mã](/vi/tools/code-mode) cho các quy trình làm việc JavaScript hoặc TypeScript rút gọn
  trên một danh mục công cụ OpenClaw ẩn
- [Swarm](/tools/swarm) để phân nhánh có cấu trúc và thu thập kết quả từ Chế độ mã
