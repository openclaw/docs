---
read_when:
    - Bạn đang tạo một Skills tùy chỉnh mới trong không gian làm việc của mình
    - Bạn cần một quy trình khởi đầu nhanh cho Skills dựa trên SKILL.md
summary: Xây dựng và kiểm thử Skills tùy chỉnh cho không gian làm việc bằng SKILL.md
title: Tạo Skills
x-i18n:
    generated_at: "2026-05-10T19:52:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a468a0b21f4e43542b175b8acb8ad8b19dbbea06ce8e0b97c48206bf88a661c5
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills dạy agent cách và thời điểm sử dụng công cụ. Mỗi kỹ năng là một thư mục
chứa tệp `SKILL.md` với YAML frontmatter và hướng dẫn markdown.

Để biết cách tải và ưu tiên Skills, xem [Skills](/vi/tools/skills).

## Tạo kỹ năng đầu tiên của bạn

<Steps>
  <Step title="Tạo thư mục kỹ năng">
    Skills nằm trong workspace của bạn. Tạo một thư mục mới:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Viết SKILL.md">
    Tạo `SKILL.md` bên trong thư mục đó. Frontmatter định nghĩa siêu dữ liệu,
    và phần thân markdown chứa hướng dẫn cho agent.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Sử dụng dạng hyphen-case với chữ cái thường, chữ số và dấu gạch nối cho
    `name` của kỹ năng. Giữ tên thư mục và `name` trong frontmatter khớp nhau.

  </Step>

  <Step title="Thêm công cụ (tùy chọn)">
    Bạn có thể định nghĩa schema công cụ tùy chỉnh trong frontmatter hoặc hướng dẫn agent
    sử dụng các công cụ hệ thống hiện có (như `exec` hoặc `browser`). Skills cũng có thể
    được phân phối bên trong plugin cùng với các công cụ mà chúng ghi tài liệu.

  </Step>

  <Step title="Tải kỹ năng">
    Bắt đầu một phiên mới để OpenClaw nhận kỹ năng:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Xác minh kỹ năng đã được tải:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Kiểm tra">
    Gửi một tin nhắn lẽ ra sẽ kích hoạt kỹ năng:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Hoặc chỉ cần chat với agent và yêu cầu một lời chào.

  </Step>
</Steps>

## Tham chiếu siêu dữ liệu kỹ năng

YAML frontmatter hỗ trợ các trường này:

| Trường                              | Bắt buộc | Mô tả                                                          |
| ----------------------------------- | -------- | -------------------------------------------------------------- |
| `name`                              | Có       | Mã định danh duy nhất dùng chữ cái thường, chữ số và dấu gạch nối |
| `description`                       | Có       | Mô tả một dòng hiển thị cho agent                              |
| `metadata.openclaw.os`              | Không    | Bộ lọc OS (`["darwin"]`, `["linux"]`, v.v.)                    |
| `metadata.openclaw.requires.bins`   | Không    | Binary bắt buộc trên PATH                                      |
| `metadata.openclaw.requires.config` | Không    | Khóa cấu hình bắt buộc                                         |

## Thực hành tốt nhất

- **Ngắn gọn** — hướng dẫn mô hình về _việc_ cần làm, không phải cách trở thành AI
- **An toàn là trên hết** — nếu kỹ năng của bạn dùng `exec`, hãy đảm bảo prompt không cho phép chèn lệnh tùy ý từ đầu vào không đáng tin cậy
- **Kiểm tra cục bộ** — dùng `openclaw agent --message "..."` để kiểm tra trước khi chia sẻ
- **Dùng ClawHub** — duyệt và đóng góp kỹ năng tại [ClawHub](https://clawhub.ai)

## Nơi lưu Skills

| Vị trí                          | Mức ưu tiên | Phạm vi               |
| ------------------------------- | ----------- | --------------------- |
| `\<workspace\>/skills/`         | Cao nhất    | Theo từng agent       |
| `\<workspace\>/.agents/skills/` | Cao         | Agent theo workspace  |
| `~/.agents/skills/`             | Trung bình  | Hồ sơ agent dùng chung |
| `~/.openclaw/skills/`           | Trung bình  | Dùng chung (mọi agent) |
| Được đóng gói kèm (phân phối cùng OpenClaw) | Thấp | Toàn cục              |
| `skills.load.extraDirs`         | Thấp nhất   | Thư mục dùng chung tùy chỉnh |

## Liên quan

- [Tham chiếu Skills](/vi/tools/skills) — quy tắc tải, mức ưu tiên và gating
- [Cấu hình Skills](/vi/tools/skills-config) — schema cấu hình `skills.*`
- [ClawHub](/vi/clawhub) — registry kỹ năng công khai
- [Xây dựng Plugins](/vi/plugins/building-plugins) — plugin có thể phân phối Skills
