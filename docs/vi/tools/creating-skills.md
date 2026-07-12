---
read_when:
    - Bạn đang tạo một skill tùy chỉnh mới
    - Bạn cần một quy trình khởi đầu nhanh cho các Skills dựa trên SKILL.md
    - Bạn muốn sử dụng Skill Workshop để đề xuất một skill cho tác nhân đánh giá
sidebarTitle: Creating skills
summary: Xây dựng, kiểm thử và phát hành các Skills không gian làm việc SKILL.md tùy chỉnh cho các agent OpenClaw của bạn.
title: Tạo Skills
x-i18n:
    generated_at: "2026-07-12T08:25:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cba2aa863ebd083d4592e8a764dbdc2c30a0dd8aff49d273927e82df0069bc81
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills hướng dẫn agent cách thức và thời điểm sử dụng các công cụ. Mỗi skill là một thư mục
chứa tệp `SKILL.md` với phần đầu YAML và các hướng dẫn bằng Markdown.
OpenClaw tải các skill từ nhiều thư mục gốc theo một [thứ tự ưu tiên](/vi/tools/skills#loading-order) xác định.

## Tạo skill đầu tiên của bạn

<Steps>
  <Step title="Tạo thư mục skill">
    Skills nằm trong thư mục `skills/` của không gian làm việc:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

    Bạn có thể nhóm các skill vào thư mục con để dễ tổ chức — tên của skill vẫn
    được xác định bởi phần đầu của `SKILL.md`, không phải đường dẫn thư mục:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/personal/hello-world
    # tên skill vẫn là "hello-world", được gọi bằng /hello-world
    ```

  </Step>

  <Step title="Viết SKILL.md">
    Phần đầu định nghĩa siêu dữ liệu; phần nội dung cung cấp hướng dẫn cho agent.

    ```markdown
    ---
    name: hello-world
    description: Một skill đơn giản in ra lời chào.
    ---

    # Xin chào thế giới

    Khi người dùng yêu cầu lời chào, hãy dùng công cụ `exec` để chạy:

    ```bash
    echo "Xin chào từ skill tùy chỉnh của bạn!"
    ```
    ```

    Quy tắc đặt tên:
    - Dùng chữ cái viết thường, chữ số và dấu gạch nối cho `name`.
    - Giữ tên thư mục và `name` trong phần đầu nhất quán.
    - `description` được hiển thị cho agent và trong kết quả khám phá lệnh gạch chéo —
      hãy viết trên một dòng và dưới 160 ký tự.

  </Step>

  <Step title="Xác minh skill đã được tải">
    ```bash
    openclaw skills list
    ```

    Theo mặc định, OpenClaw theo dõi các tệp `SKILL.md` trong những thư mục gốc của skill. Nếu
    trình theo dõi bị tắt hoặc bạn đang tiếp tục một phiên hiện có, hãy bắt đầu một
    phiên mới để agent nhận được danh sách đã làm mới:

    ```bash
    # Từ cuộc trò chuyện — lưu trữ phiên hiện tại và bắt đầu phiên mới
    /new

    # Hoặc khởi động lại Gateway
    openclaw gateway restart
    ```

  </Step>

  <Step title="Kiểm thử">
    ```bash
    openclaw agent --message "hãy gửi cho tôi một lời chào"
    ```

    Hoặc mở một cuộc trò chuyện và hỏi trực tiếp agent. Dùng `/skill hello-world` để
    gọi skill một cách tường minh theo tên.

  </Step>
</Steps>

## Tham chiếu SKILL.md

### Các trường bắt buộc

| Trường        | Mô tả                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| `name`        | Định danh duy nhất sử dụng chữ cái viết thường, chữ số và dấu gạch nối |
| `description` | Mô tả một dòng được hiển thị cho agent và trong kết quả khám phá        |

### Các khóa phần đầu tùy chọn

| Trường                     | Mặc định | Mô tả                                                                                     |
| -------------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `user-invocable`           | `true`   | Cung cấp skill dưới dạng lệnh gạch chéo cho người dùng                                     |
| `disable-model-invocation` | `false`  | Loại skill khỏi lời nhắc hệ thống của agent (vẫn chạy qua `/skill`)                        |
| `command-dispatch`         | —        | Đặt thành `tool` để định tuyến trực tiếp lệnh gạch chéo đến công cụ, bỏ qua mô hình         |
| `command-tool`             | —        | Tên công cụ cần gọi khi `command-dispatch: tool` được đặt                                  |
| `command-arg-mode`         | `raw`    | Khi điều phối đến công cụ, chuyển tiếp chuỗi đối số thô đến công cụ                        |
| `homepage`                 | —        | URL được hiển thị dưới dạng "Website" trong giao diện Skills trên macOS                    |

Đối với các trường kiểm soát điều kiện (`requires.bins`, `requires.env`, v.v.), xem
[Skills — Kiểm soát điều kiện](/vi/tools/skills#gating).

### Sử dụng `{baseDir}`

Tham chiếu các tệp bên trong thư mục skill mà không mã hóa cứng đường dẫn — agent
phân giải `{baseDir}` theo chính thư mục của skill:

```markdown
Chạy tập lệnh hỗ trợ tại `{baseDir}/scripts/run.sh`.
```

## Thêm kích hoạt có điều kiện

Đặt điều kiện cho skill để skill chỉ được tải khi các phần phụ thuộc khả dụng:

```markdown
---
name: gemini-search
description: Tìm kiếm bằng Gemini CLI.
metadata: { "openclaw": { "requires": { "bins": ["gemini"] }, "primaryEnv": "GEMINI_API_KEY" } }
---
```

<AccordionGroup>
  <Accordion title="Các tùy chọn kiểm soát điều kiện">
    | Khóa | Mô tả |
    | --- | --- |
    | `requires.bins` | Tất cả tệp nhị phân phải tồn tại trên `PATH` |
    | `requires.anyBins` | Ít nhất một tệp nhị phân phải tồn tại trên `PATH` |
    | `requires.env` | Mỗi biến môi trường phải tồn tại trong tiến trình hoặc cấu hình |
    | `requires.config` | Mỗi đường dẫn `openclaw.json` phải có giá trị đúng |
    | `os` | Bộ lọc nền tảng: `["darwin"]`, `["linux"]`, `["win32"]` |
    | `always` | Đặt thành `true` để bỏ qua mọi điều kiện và luôn bao gồm skill |

    Tài liệu tham chiếu đầy đủ: [Skills — Kiểm soát điều kiện](/vi/tools/skills#gating).

  </Accordion>
  <Accordion title="Môi trường và khóa API">
    Liên kết khóa API với một mục skill trong `openclaw.json`:

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

    Khóa chỉ được chèn vào tiến trình máy chủ trong lượt hoạt động đó của agent.
    Khóa không được chuyển vào sandbox — xem
    [các biến môi trường trong sandbox](/vi/tools/skills-config#sandboxed-skills-and-env-vars).

  </Accordion>
</AccordionGroup>

## Đề xuất qua Skill Workshop

Đối với các skill do agent soạn thảo hoặc khi bạn muốn người vận hành xem xét trước khi một skill được
đưa vào sử dụng, hãy dùng đề xuất của [Skill Workshop](/vi/tools/skill-workshop) thay vì viết
trực tiếp `SKILL.md`.

```bash
# Đề xuất một skill hoàn toàn mới
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Một skill đơn giản in ra lời chào." \
  --proposal ./PROPOSAL.md

# Đề xuất cập nhật cho một skill hiện có
openclaw skills workshop propose-update hello-world \
  --proposal ./PROPOSAL.md \
  --description "Skill lời chào đã cập nhật"
```

Dùng `--proposal-dir` khi đề xuất bao gồm các tệp hỗ trợ:

```bash
openclaw skills workshop propose-create \
  --name "hello-world" \
  --description "Một skill đơn giản in ra lời chào." \
  --proposal-dir ./hello-world-proposal/
```

Thư mục phải chứa `PROPOSAL.md` tại thư mục gốc. Các tệp hỗ trợ được đặt trong
`assets/`, `examples/`, `references/`, `scripts/` hoặc `templates/`.

Sau khi xem xét:

```bash
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Xem [Skill Workshop](/vi/tools/skill-workshop) để biết toàn bộ vòng đời đề xuất.

## Xuất bản lên ClawHub

<Steps>
  <Step title="Đảm bảo SKILL.md của bạn đã hoàn chỉnh">
    Đảm bảo `name`, `description` và mọi trường kiểm soát điều kiện `metadata.openclaw`
    đều được đặt. Thêm URL `homepage` nếu bạn có trang dự án.
  </Step>
  <Step title="Cài đặt CLI ClawHub độc lập và đăng nhập">
    ```bash
    npm i -g clawhub
    clawhub login
    ```
  </Step>
  <Step title="Xuất bản">
    ```bash
    clawhub skill publish ./path/to/hello-world
    ```

    Thêm `--version <version>` hoặc `--owner <owner>` để ghi đè phiên bản được suy ra
    hoặc xuất bản dưới một chủ sở hữu cụ thể. Xem
    [ClawHub — Xuất bản](/vi/clawhub/publishing) và
    [CLI ClawHub](/vi/clawhub/cli) để biết toàn bộ quy trình, phạm vi chủ sở hữu và các
    lệnh bảo trì khác (`clawhub sync`, `clawhub skill rename`, ...).

  </Step>
</Steps>

## Các phương pháp hay nhất

<Tip>
  - **Ngắn gọn** — hướng dẫn mô hình về *việc cần làm*, không phải cách trở thành AI.
  - **Ưu tiên an toàn** — nếu skill của bạn sử dụng `exec`, hãy đảm bảo lời nhắc không cho phép
    chèn lệnh tùy ý từ đầu vào không đáng tin cậy.
  - **Kiểm thử cục bộ** — dùng `openclaw agent --message "..."` trước khi chia sẻ.
  - **Sử dụng ClawHub** — duyệt các skill cộng đồng tại [clawhub.ai](https://clawhub.ai)
    trước khi tự xây dựng từ đầu.
</Tip>

## Nội dung liên quan

<CardGroup cols={2}>
  <Card title="Tài liệu tham chiếu Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Thứ tự tải, kiểm soát điều kiện, danh sách cho phép và định dạng SKILL.md.
  </Card>
  <Card title="Skill Workshop" href="/vi/tools/skill-workshop" icon="flask">
    Hàng đợi đề xuất dành cho các skill do agent soạn thảo.
  </Card>
  <Card title="Cấu hình Skills" href="/vi/tools/skills-config" icon="gear">
    Lược đồ cấu hình `skills.*` đầy đủ.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Duyệt và xuất bản các skill trên sổ đăng ký công khai.
  </Card>
  <Card title="Xây dựng plugin" href="/vi/plugins/building-plugins" icon="plug">
    Các plugin có thể cung cấp skill cùng với những công cụ mà chúng mô tả.
  </Card>
</CardGroup>
