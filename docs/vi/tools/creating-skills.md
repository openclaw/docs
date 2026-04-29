---
read_when:
    - Bạn đang tạo một kỹ năng tùy chỉnh mới trong không gian làm việc của mình
    - Bạn cần một quy trình khởi đầu nhanh cho các Skills dựa trên SKILL.md
summary: Xây dựng và kiểm thử Skills tùy chỉnh trong không gian làm việc bằng SKILL.md
title: Tạo Skills
x-i18n:
    generated_at: "2026-04-29T23:17:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills hướng dẫn agent cách và thời điểm sử dụng công cụ. Mỗi skill là một thư mục
chứa tệp `SKILL.md` với YAML frontmatter và hướng dẫn markdown.

Để biết cách tải và ưu tiên skills, xem [Skills](/vi/tools/skills).

## Tạo skill đầu tiên của bạn

<Steps>
  <Step title="Tạo thư mục skill">
    Skills nằm trong workspace của bạn. Tạo một thư mục mới:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Viết SKILL.md">
    Tạo `SKILL.md` bên trong thư mục đó. Frontmatter định nghĩa metadata,
    còn phần thân markdown chứa hướng dẫn cho agent.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Dùng dạng hyphen-case với chữ thường, chữ số và dấu gạch nối cho
    `name` của skill. Giữ tên thư mục và `name` trong frontmatter đồng nhất.

  </Step>

  <Step title="Thêm công cụ (tùy chọn)">
    Bạn có thể định nghĩa schema công cụ tùy chỉnh trong frontmatter hoặc hướng dẫn agent
    sử dụng các công cụ hệ thống hiện có (như `exec` hoặc `browser`). Skills cũng có thể
    được đóng gói trong plugins cùng với các công cụ mà chúng ghi tài liệu.

  </Step>

  <Step title="Tải skill">
    Bắt đầu một phiên mới để OpenClaw nhận skill:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Xác minh skill đã được tải:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Kiểm thử">
    Gửi một tin nhắn có thể kích hoạt skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Hoặc chỉ cần trò chuyện với agent và yêu cầu một lời chào.

  </Step>
</Steps>

## Tham chiếu metadata của skill

YAML frontmatter hỗ trợ các trường sau:

| Trường                              | Bắt buộc | Mô tả                                                         |
| ----------------------------------- | -------- | ------------------------------------------------------------- |
| `name`                              | Có       | Định danh duy nhất dùng chữ thường, chữ số và dấu gạch nối    |
| `description`                       | Có       | Mô tả một dòng hiển thị cho agent                             |
| `metadata.openclaw.os`              | Không    | Bộ lọc OS (`["darwin"]`, `["linux"]`, v.v.)                   |
| `metadata.openclaw.requires.bins`   | Không    | Các binary bắt buộc trên PATH                                 |
| `metadata.openclaw.requires.config` | Không    | Các khóa cấu hình bắt buộc                                    |

## Thực hành tốt nhất

- **Ngắn gọn** — hướng dẫn model về _việc_ cần làm, không phải cách trở thành AI
- **An toàn trước tiên** — nếu skill của bạn dùng `exec`, hãy bảo đảm prompt không cho phép chèn lệnh tùy ý từ đầu vào không đáng tin cậy
- **Kiểm thử cục bộ** — dùng `openclaw agent --message "..."` để kiểm thử trước khi chia sẻ
- **Dùng ClawHub** — duyệt và đóng góp skills tại [ClawHub](https://clawhub.ai)

## Nơi lưu skills

| Vị trí                          | Mức ưu tiên | Phạm vi                    |
| ------------------------------- | ----------- | -------------------------- |
| `\<workspace\>/skills/`         | Cao nhất    | Theo từng agent            |
| `\<workspace\>/.agents/skills/` | Cao         | Agent theo từng workspace  |
| `~/.agents/skills/`             | Trung bình  | Hồ sơ agent dùng chung     |
| `~/.openclaw/skills/`           | Trung bình  | Dùng chung (mọi agent)     |
| Đi kèm (phát hành với OpenClaw) | Thấp        | Toàn cục                   |
| `skills.load.extraDirs`         | Thấp nhất   | Thư mục dùng chung tùy chỉnh |

## Liên quan

- [Tham chiếu Skills](/vi/tools/skills) — quy tắc tải, mức ưu tiên và gating
- [Cấu hình Skills](/vi/tools/skills-config) — schema cấu hình `skills.*`
- [ClawHub](/vi/tools/clawhub) — registry skill công khai
- [Xây dựng Plugins](/vi/plugins/building-plugins) — plugins có thể đóng gói skills
