---
doc-schema-version: 1
read_when:
    - Bạn muốn tìm hiểu OpenClaw cung cấp những công cụ nào
    - Bạn đang lựa chọn giữa các công cụ tích hợp sẵn, Skills và plugin
    - Bạn cần đúng điểm bắt đầu trong tài liệu về chính sách công cụ, tự động hóa hoặc điều phối tác tử
summary: 'Tổng quan về công cụ, Skills và Plugin của OpenClaw: tác tử có thể gọi những gì và cách mở rộng chúng'
title: Tổng quan
x-i18n:
    generated_at: "2026-07-12T08:24:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 628b47a8756e229a712981b669c96a36689909755dcd244667612f8761e67526
    source_path: tools/index.md
    workflow: 16
---

Hãy dùng trang này để chọn bề mặt Khả năng phù hợp. **Công cụ** là các hành động
có thể gọi, **Skills** hướng dẫn tác tử cách làm việc và **Plugin** bổ sung
các khả năng thời gian chạy như công cụ, nhà cung cấp, kênh, hook và Skills
được đóng gói.

Đây là trang tổng quan và định tuyến. Để biết đầy đủ về chính sách công cụ, giá trị mặc định,
thành phần nhóm, hạn chế của nhà cung cấp và các trường cấu hình, hãy xem
[Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

## Bắt đầu tại đây

Với hầu hết tác tử, hãy bắt đầu bằng các danh mục công cụ tích hợp sẵn, sau đó chỉ điều chỉnh chính sách
khi tác tử cần thấy ít công cụ hơn hoặc cần quyền truy cập máy chủ rõ ràng.

| Nếu bạn cần...                                      | Trước tiên hãy dùng                                      | Sau đó đọc                                                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Cho phép tác tử hành động bằng các khả năng hiện có | [Công cụ tích hợp sẵn](#built-in-tool-categories)        | [Danh mục công cụ](#built-in-tool-categories)                                                                               |
| Kiểm soát những gì tác tử có thể gọi                | [Chính sách công cụ](#configure-access-and-approvals)    | [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools)                                                                  |
| Hướng dẫn tác tử một quy trình làm việc             | [Skills](#choose-tools-skills-or-plugins)                | [Skills](/vi/tools/skills), [Tạo Skills](/vi/tools/creating-skills) và [Xưởng Skills](/vi/tools/skill-workshop)                      |
| Thêm tích hợp hoặc bề mặt thời gian chạy mới        | [Plugin](#extend-capabilities)                           | [Plugin](/vi/tools/plugin) và [Xây dựng Plugin](/vi/plugins/building-plugins)                                                     |
| Chạy công việc sau hoặc trong nền                   | [Tự động hóa](/vi/automation)                               | [Tổng quan về tự động hóa](/vi/automation)                                                                                     |
| Điều phối nhiều tác tử hoặc bộ khung chạy           | [Tác tử phụ](/vi/tools/subagents)                           | [Tác tử ACP](/vi/tools/acp-agents) và [Gửi qua tác tử](/vi/tools/agent-send)                                                      |
| Tìm kiếm danh mục công cụ OpenClaw lớn              | [Tìm kiếm công cụ](/vi/tools/tool-search)                   | [Tìm kiếm công cụ](/vi/tools/tool-search)                                                                                      |

## Chọn công cụ, Skills hoặc Plugin

<Steps>
  <Step title="Dùng công cụ khi tác tử cần hành động">
    Công cụ là một hàm có kiểu mà tác tử có thể gọi, chẳng hạn như `exec`, `browser`,
    `web_search`, `message` hoặc `image_generate`. Hãy dùng công cụ khi tác tử
    cần đọc dữ liệu, thay đổi tệp, gửi tin nhắn, gọi nhà cung cấp hoặc
    vận hành một hệ thống khác. Các công cụ hiển thị được gửi đến mô hình dưới dạng
    định nghĩa hàm có cấu trúc.

    Mô hình chỉ thấy những công cụ vượt qua hồ sơ đang hoạt động, chính sách
    cho phép/từ chối, hạn chế của nhà cung cấp, trạng thái sandbox, quyền của kênh và
    tính khả dụng của Plugin.

  </Step>

  <Step title="Dùng Skills khi tác tử cần hướng dẫn">
    Skills là một gói hướng dẫn `SKILL.md` được nạp vào lời nhắc của tác tử. Hãy dùng
    Skills khi tác tử đã có các công cụ cần thiết nhưng cần một
    quy trình làm việc có thể lặp lại, tiêu chí đánh giá, trình tự lệnh hoặc ràng buộc
    vận hành.

    Skills có thể nằm trong không gian làm việc, thư mục Skills dùng chung, thư mục gốc Skills
    do OpenClaw quản lý hoặc gói Plugin.

    [Skills](/vi/tools/skills) | [Xưởng Skills](/vi/tools/skill-workshop) | [Tạo Skills](/vi/tools/creating-skills) | [Cấu hình Skills](/vi/tools/skills-config)

  </Step>

  <Step title="Dùng Plugin khi OpenClaw cần một khả năng mới">
    Plugin có thể bổ sung công cụ, Skills, kênh, nhà cung cấp mô hình, giọng nói,
    thoại thời gian thực, tạo nội dung đa phương tiện, tìm kiếm web, tải nội dung web, hook và các
    khả năng thời gian chạy khác. Hãy dùng Plugin khi khả năng đó có mã,
    thông tin xác thực, hook vòng đời, siêu dữ liệu manifest hoặc
    gói có thể cài đặt. Có thể cài đặt các Plugin hiện có từ ClawHub, npm, git,
    thư mục cục bộ hoặc tệp lưu trữ.

    [Cài đặt và cấu hình Plugin](/vi/tools/plugin) | [Xây dựng Plugin](/vi/plugins/building-plugins) | [SDK Plugin](/vi/plugins/sdk-overview)

  </Step>
</Steps>

## Danh mục công cụ tích hợp sẵn

Bảng này liệt kê các công cụ tiêu biểu để bạn nhận biết bề mặt. Đây
không phải tài liệu tham chiếu đầy đủ về chính sách. Để biết chính xác các nhóm, giá trị mặc định và
ngữ nghĩa cho phép/từ chối, hãy xem [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).

| Danh mục                    | Dùng khi tác tử cần...                                                            | Công cụ tiêu biểu                                                                                     | Đọc tiếp                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Thời gian chạy              | Chạy lệnh, quản lý tiến trình hoặc dùng phân tích Python do nhà cung cấp hỗ trợ    | `exec`, `process`, `code_execution`                                                                   | [Exec](/vi/tools/exec), [Thực thi mã](/vi/tools/code-execution)                                            |
| Tệp                         | Đọc và thay đổi các tệp trong không gian làm việc                                 | `read`, `write`, `edit`, `apply_patch`                                                                | [Áp dụng bản vá](/vi/tools/apply-patch)                                                                 |
| Web                         | Tìm kiếm trên web, tìm bài đăng trên X hoặc tải nội dung trang có thể đọc         | `web_search`, `x_search`, `web_fetch`                                                                 | [Công cụ web](/vi/tools/web), [Tải nội dung web](/vi/tools/web-fetch)                                      |
| Trình duyệt                 | Vận hành một phiên trình duyệt                                                     | `browser`                                                                                             | [Trình duyệt](/vi/tools/browser)                                                                        |
| Nhắn tin và kênh            | Gửi phản hồi hoặc thao tác trên kênh                                               | `message`                                                                                             | [Gửi qua tác tử](/vi/tools/agent-send)                                                                  |
| Phiên và tác tử             | Kiểm tra phiên, ủy quyền công việc, điều hướng một lượt chạy khác hoặc báo cáo trạng thái | `sessions_*`, `subagents`, `agents_list`, `session_status`, `get_goal`, `create_goal`, `update_goal` | [Mục tiêu](/vi/tools/goal), [Tác tử phụ](/vi/tools/subagents), [Công cụ phiên](/vi/concepts/session-tool)     |
| Tự động hóa                 | Lên lịch công việc hoặc phản hồi sự kiện nền                                      | `cron`, `heartbeat_respond`                                                                           | [Tự động hóa](/vi/automation)                                                                           |
| Gateway và Node             | Kiểm tra trạng thái Gateway hoặc thiết bị đích đã ghép nối                        | `gateway`, `nodes`                                                                                    | [Cấu hình Gateway](/vi/gateway/configuration), [Node](/vi/nodes)                                           |
| Đa phương tiện              | Phân tích, tạo hoặc phát giọng nói cho nội dung đa phương tiện                    | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                  | [Tổng quan về đa phương tiện](/vi/tools/media-overview)                                                 |
| Danh mục OpenClaw lớn       | Tìm kiếm và gọi nhiều công cụ đủ điều kiện mà không gửi mọi lược đồ đến mô hình   | `tool_search_code`, `tool_search`, `tool_describe`                                                    | [Tìm kiếm công cụ](/vi/tools/tool-search)                                                               |

<Note>
Tìm kiếm công cụ là một bề mặt tác tử OpenClaw đang thử nghiệm. Các lượt chạy bằng bộ khung Codex sử dụng
chế độ mã gốc của Codex, tìm kiếm công cụ gốc, công cụ động trì hoãn và
lời gọi công cụ lồng nhau thay cho `tools.toolSearch`.
</Note>

## Công cụ do Plugin cung cấp

Plugin có thể đăng ký thêm công cụ. Tác giả Plugin kết nối công cụ thông qua
`api.registerTool(...)` và `contracts.tools` trong manifest; hãy xem
[SDK Plugin](/vi/plugins/sdk-overview) và [Manifest Plugin](/vi/plugins/manifest)
để biết chi tiết về hợp đồng.

Các công cụ thường được Plugin cung cấp gồm:

- [Diffs](/vi/tools/diffs) để hiển thị phần khác biệt của tệp và Markdown
- [Hiển thị tiện ích](/tools/show-widget) để hiển thị SVG và HTML nội tuyến độc lập trong trò chuyện web
- [Tác vụ LLM](/vi/tools/llm-task) cho các bước quy trình làm việc chỉ dùng JSON
- [Lobster](/vi/tools/lobster) cho quy trình làm việc có kiểu với phê duyệt có thể tiếp tục
- [Tokenjuice](/vi/tools/tokenjuice) để thu gọn đầu ra nhiều nhiễu của công cụ `exec` và `bash`
- [Tìm kiếm công cụ](/vi/tools/tool-search) để khám phá và gọi các danh mục công cụ lớn
  mà không đưa mọi lược đồ vào lời nhắc
- [Canvas](/vi/plugins/reference/canvas) để điều khiển Canvas trên Node và kết xuất
  A2UI

## Cấu hình quyền truy cập và phê duyệt

Chính sách công cụ được thực thi trước khi gọi mô hình. Nếu chính sách loại bỏ một công cụ,
mô hình sẽ không nhận được lược đồ của công cụ đó trong lượt này. Một lượt chạy có thể mất công cụ
do cấu hình toàn cục, cấu hình theo tác tử, chính sách kênh, hạn chế của nhà cung cấp,
quy tắc sandbox, chính sách kênh/thời gian chạy hoặc tính khả dụng của Plugin.

- [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) mô tả hồ sơ công cụ,
  danh sách cho phép/từ chối, hạn chế theo nhà cung cấp, phát hiện vòng lặp và
  cài đặt công cụ do nhà cung cấp hỗ trợ.
- [Phê duyệt Exec](/vi/tools/exec-approvals) mô tả chính sách phê duyệt lệnh trên máy chủ.
- [Exec nâng quyền](/vi/tools/elevated) mô tả việc thực thi có kiểm soát bên ngoài
  sandbox.
- [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
  giải thích lớp nào kiểm soát quyền truy cập tệp và tiến trình.
- [Hạn chế sandbox và công cụ theo tác tử](/vi/tools/multi-agent-sandbox-tools)
  mô tả các hạn chế dành riêng cho tác tử trong các lượt chạy được ủy quyền.

## Mở rộng khả năng

Chọn đường dẫn mở rộng theo công việc bạn cần OpenClaw thực hiện:

- Cài đặt hoặc quản lý Plugin hiện có bằng [Plugin](/vi/tools/plugin).
- Xây dựng tích hợp, nhà cung cấp, kênh, công cụ hoặc hook mới bằng
  [Xây dựng Plugin](/vi/plugins/building-plugins).
- Thêm hoặc tinh chỉnh hướng dẫn tác tử có thể tái sử dụng bằng [Skills](/vi/tools/skills) và
  [Tạo Skills](/vi/tools/creating-skills).
- Dùng [SDK Plugin](/vi/plugins/sdk-overview) và
  [Manifest Plugin](/vi/plugins/manifest) khi bạn cần hợp đồng
  triển khai.

## Khắc phục sự cố thiếu công cụ

Nếu mô hình không thể thấy hoặc gọi một công cụ, hãy bắt đầu với chính sách có hiệu lực cho
lượt hiện tại:

1. Kiểm tra hồ sơ đang hoạt động, `tools.allow` và `tools.deny` trong
   [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools).
2. Kiểm tra các hạn chế theo nhà cung cấp trong
   [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) và xác nhận
   [nhà cung cấp mô hình](/vi/concepts/model-providers) đã chọn hỗ trợ hình dạng
   công cụ.
3. Kiểm tra quyền của kênh, trạng thái sandbox và quyền truy cập nâng cao bằng
   [Sandbox so với chính sách công cụ so với nâng quyền](/vi/gateway/sandbox-vs-tool-policy-vs-elevated)
   và [Exec nâng quyền](/vi/tools/elevated).
4. Kiểm tra xem Plugin sở hữu công cụ đã được cài đặt và bật trong
   [Plugin](/vi/tools/plugin) hay chưa.
5. Với các lượt chạy được ủy quyền, hãy kiểm tra hạn chế theo tác tử trong
   [Hạn chế sandbox và công cụ theo tác tử](/vi/tools/multi-agent-sandbox-tools).
6. Với các danh mục OpenClaw lớn, hãy xác nhận lượt chạy dùng cách cung cấp công cụ trực tiếp
   hay [Tìm kiếm công cụ](/vi/tools/tool-search).

## Liên quan

- [Tự động hóa](/vi/automation) cho cron, tác vụ, heartbeat, cam kết, hook,
  lệnh thường trực và Task Flow
- [Tác nhân](/vi/concepts/agent) cho mô hình tác nhân, phiên, bộ nhớ và
  phối hợp đa tác nhân
- [Công cụ và nhà cung cấp tùy chỉnh](/vi/gateway/config-tools) để tham khảo
  chính sách công cụ chuẩn
- [Plugin](/vi/tools/plugin) để cài đặt và quản lý plugin
- [SDK Plugin](/vi/plugins/sdk-overview) làm tài liệu tham khảo cho tác giả plugin
- [Skills](/vi/tools/skills) về thứ tự tải, cơ chế kiểm soát và cấu hình skill
- [Xưởng Skill](/vi/tools/skill-workshop) để tạo skill có sinh tự động và được
  rà soát
- [Tìm kiếm công cụ](/vi/tools/tool-search) để khám phá danh mục công cụ OpenClaw
  dạng gọn nhẹ
