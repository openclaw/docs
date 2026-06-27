---
read_when:
    - Bạn đang tạo một kỹ năng tùy chỉnh mới
    - Bạn cần một quy trình khởi đầu nhanh cho Skills dựa trên SKILL.md
    - Bạn muốn sử dụng Skill Workshop để đề xuất một kỹ năng cho tác nhân xem xét
sidebarTitle: Creating skills
summary: Xây dựng, kiểm thử và phát hành các Skills không gian làm việc SKILL.md tùy chỉnh cho agent OpenClaw của bạn.
title: Tạo Skills
x-i18n:
    generated_at: "2026-06-27T18:14:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a744e9010c66b8465449d24430520473717edde86711bbb59774519189b9e72
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills dạy tác nhân cách thức và thời điểm sử dụng công cụ. Mỗi skill là một thư mục
chứa tệp `SKILL.md` với YAML frontmatter và hướng dẫn markdown.
OpenClaw tải skills từ nhiều gốc theo [thứ tự ưu tiên](/vi/tools/skills#loading-order) đã định nghĩa.

## Tạo skill đầu tiên của bạn

<Steps>
  <Step title="Create the skill directory">
    Skills nằm trong thư mục `skills/` của workspace. Tạo một thư mục cho
    skill mới của bạn:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Bạn có thể nhóm skills trong các thư mục con để tổ chức — skill vẫn được
    đặt tên bằng frontmatter của `SKILL.md`, không phải đường dẫn thư mục:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # skill name is still "hello-world", invoked as /hello-world
    ```

  </Step>

  <Step title="Write SKILL.md">
    Tạo `SKILL.md` bên trong thư mục. Frontmatter định nghĩa siêu dữ liệu;
    phần thân cung cấp hướng dẫn cho tác nhân.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that prints a greeting.
    ---

    # Hello World

    When the user asks for a greeting, use the `exec` tool to run:

    ```bash
    echo "Hello from your custom skill!"
    ```
    ```

    Quy tắc đặt tên:
    - Dùng chữ cái thường, chữ số và dấu gạch nối cho `name`.
    - Giữ tên thư mục và `name` trong frontmatter khớp nhau.
    - `description` được hiển thị cho tác nhân và trong phần khám phá slash-command —
      giữ trong một dòng và dưới 160 ký tự.

  </Step>

  <Step title="Verify the skill loaded">
    ```bash
    openclaw skills list
    ```

    OpenClaw mặc định theo dõi các tệp `SKILL.md` dưới các gốc skills. Nếu
    trình theo dõi bị tắt hoặc bạn đang tiếp tục một phiên hiện có, hãy bắt đầu một
    phiên mới để tác nhân nhận danh sách đã làm mới:

    ```bash
    # From chat — archive current session and start fresh
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Test it">
    Gửi một tin nhắn sẽ kích hoạt skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Hoặc mở một cuộc trò chuyện và hỏi trực tiếp tác nhân. Dùng `/skill hello-world` để
    gọi rõ ràng theo tên.

  </Step>
</Steps>

## Tham chiếu SKILL.md

### Trường bắt buộc

| Trường        | Mô tả                                                            |
| ------------- | --------------------------------------------------------------- |
| `name`        | Slug duy nhất dùng chữ cái thường, chữ số và dấu gạch nối       |
| `description` | Mô tả một dòng hiển thị cho tác nhân và trong đầu ra khám phá   |

### Khóa frontmatter tùy chọn

| Trường                     | Mặc định | Mô tả                                                                                 |
| -------------------------- | -------- | ------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`   | Hiển thị skill dưới dạng slash command của người dùng                                 |
| `disable-model-invocation` | `false`  | Không đưa skill vào system prompt của tác nhân (vẫn chạy qua `/skill`)                |
| `command-dispatch`         | —        | Đặt thành `tool` để định tuyến slash command trực tiếp đến một công cụ, bỏ qua mô hình |
| `command-tool`             | —        | Tên công cụ cần gọi khi đã đặt `command-dispatch: tool`                               |
| `command-arg-mode`         | `raw`    | Với điều phối công cụ, chuyển tiếp chuỗi đối số thô đến công cụ                       |
| `homepage`                 | —        | URL hiển thị dưới dạng "Trang web" trong giao diện macOS Skills                       |

Để biết các trường gating (`requires.bins`, `requires.env`, v.v.), xem
[Skills — Gating](/vi/tools/skills#gating).

### Sử dụng `{baseDir}`

Dùng `{baseDir}` trong phần thân skill để tham chiếu các tệp bên trong thư mục
skill mà không mã hóa cứng đường dẫn:

```markdown
Run the helper script at `{baseDir}/scripts/run.sh`.
```

## Thêm kích hoạt có điều kiện

Gate skill của bạn để skill chỉ tải khi các phụ thuộc của nó có sẵn:

```markdown
---
name: gemini-search
description: Search using Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Gating options">
    | Khóa | Mô tả |
    | --- | --- |
    | `requires.bins` | Tất cả binary phải tồn tại trên `PATH` |
    | `requires.anyBins` | Ít nhất một binary phải tồn tại trên `PATH` |
    | `requires.env` | Mỗi biến env phải tồn tại trong tiến trình hoặc cấu hình |
    | `requires.config` | Mỗi đường dẫn `openclaw.json` phải có giá trị truthy |
    | `os` | Bộ lọc nền tảng: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Đặt `true` để bỏ qua mọi gate và luôn đưa skill vào |

    Tham chiếu đầy đủ: [Skills — Gating](/vi/tools/skills#gating).

  </Accordion>
  <Accordion title="Environment and API keys">
    Nối một khóa API vào một mục skill trong `openclaw.json`:

    ```json5
    {
      skills: {
        entries: {
          "gemini-search": {
            enabled: true,
            apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
          },
        },
      },
    }
    ```

    Khóa chỉ được tiêm vào tiến trình host cho lượt tác nhân đó.
    Khóa không đi vào sandbox — xem
    [biến env trong sandbox](/vi/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Đề xuất qua Xưởng Skill

Đối với skills do tác nhân soạn thảo hoặc khi bạn muốn người vận hành xem xét trước khi một skill đi vào
hoạt động, hãy dùng đề xuất [Xưởng Skill](/vi/tools/skill-workshop) thay vì viết
trực tiếp `SKILL.md`.

```bash
# Propose a brand-new skill
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal ./PROPOSAL.md

# Propose an update to an existing skill
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Updated greeting skill"
```

Dùng `--proposal-dir` khi đề xuất bao gồm các tệp hỗ trợ:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "A simple skill that prints a greeting." \
  --proposal-dir ./hello-world-proposal/
```

Thư mục phải chứa `PROPOSAL.md`. Các tệp hỗ trợ có thể nằm trong `assets/`,
`examples/`, `references/`, `scripts/`, hoặc `templates/`.

Sau khi xem xét:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Xem [Xưởng Skill](/vi/tools/skill-workshop) để biết toàn bộ vòng đời đề xuất.

## Xuất bản lên ClawHub

<Steps>
  <Step title="Ensure your SKILL.md is complete">
    Đảm bảo `name`, `description` và mọi trường gating `metadata.openclaw`
    đã được đặt. Thêm URL `homepage` nếu bạn có trang dự án.
  </Step>
  <Step title="Install the ClawHub skill">
    Skill ClawHub ghi lại dạng lệnh xuất bản hiện tại và siêu dữ liệu
    bắt buộc:

    ```bash
    openclaw skills install @openclaw/clawhub-publish
    ```

  </Step>
  <Step title="Publish">
    ```bash
    clawhub publish
    ```

    Xem [ClawHub — Xuất bản](/vi/clawhub/publishing) để biết toàn bộ quy trình.

  </Step>
</Steps>

## Thực hành tốt nhất

<Tip>
  - **Ngắn gọn** — hướng dẫn mô hình về *việc* cần làm, không phải cách trở thành AI.
  - **An toàn trước tiên** — nếu skill của bạn dùng `exec`, hãy đảm bảo prompt không cho phép
    chèn lệnh tùy ý từ đầu vào không đáng tin cậy.
  - **Kiểm thử cục bộ** — dùng `openclaw agent --message "..."` trước khi chia sẻ.
  - **Dùng ClawHub** — duyệt skills cộng đồng tại [clawhub.ai](https://clawhub.ai)
    trước khi xây dựng từ đầu.
</Tip>

## Liên quan

<CardGroup cols={2}>
  <Card title="Skills reference" href="/vi/tools/skills" icon="puzzle-piece">
    Thứ tự tải, gating, allowlist và định dạng SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/vi/tools/skill-workshop" icon="flask">
    Hàng đợi đề xuất cho skills do tác nhân soạn thảo.
  </Card>
  <Card title="Skills config" href="/vi/tools/skills-config" icon="gear">
    Lược đồ cấu hình `skills.*` đầy đủ.
  </Card>
  <Card title="ClawHub" href="/vi/clawhub" icon="cloud">
    Duyệt và xuất bản skills trên registry công khai.
  </Card>
  <Card title="Building plugins" href="/vi/plugins/building-plugins" icon="plug">
    Plugins có thể phát hành skills cùng với các công cụ mà chúng ghi lại.
  </Card>
</CardGroup>
