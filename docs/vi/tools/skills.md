---
read_when:
    - Thêm hoặc sửa đổi Skills
    - Thay đổi cơ chế kiểm soát Skills, danh sách cho phép hoặc quy tắc tải
    - Tìm hiểu thứ tự ưu tiên của Skills và hành vi ảnh chụp nhanh
sidebarTitle: Skills
summary: Skills hướng dẫn tác nhân của bạn cách sử dụng các công cụ. Tìm hiểu cách chúng được nạp, cách thức hoạt động của thứ tự ưu tiên và cách cấu hình cơ chế kiểm soát, danh sách cho phép cũng như việc chèn biến môi trường.
title: Skills
x-i18n:
    generated_at: "2026-07-12T08:28:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9eb87daab8a10caab2823e35d68293fe306d11a951e8a2b264cbbe3f2c3e8fff
    source_path: tools/skills.md
    workflow: 16
---

Skills là các tệp hướng dẫn Markdown chỉ cho tác nhân cách thức và thời điểm sử dụng
công cụ. Mỗi Skills nằm trong một thư mục chứa tệp `SKILL.md` với phần đầu YAML
và phần nội dung Markdown. OpenClaw tải các Skills đi kèm cùng mọi bản ghi đè
cục bộ, rồi lọc chúng tại thời điểm tải dựa trên môi trường, cấu hình và sự hiện
diện của tệp nhị phân.

<CardGroup cols={2}>
  <Card title="Tạo Skills" href="/vi/tools/creating-skills" icon="hammer">
    Xây dựng và kiểm thử một Skills tùy chỉnh từ đầu.
  </Card>
  <Card title="Xưởng Skills" href="/vi/tools/skill-workshop" icon="flask">
    Xem xét và phê duyệt các đề xuất Skills do tác nhân soạn thảo.
  </Card>
  <Card title="Cấu hình Skills" href="/vi/tools/skills-config" icon="gear">
    Lược đồ cấu hình `skills.*` đầy đủ và danh sách cho phép của tác nhân.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Duyệt và cài đặt Skills từ cộng đồng.
  </Card>
</CardGroup>

## Thứ tự tải

OpenClaw tải từ các nguồn sau, **theo thứ tự ưu tiên từ cao xuống thấp**. Khi cùng
một tên Skills xuất hiện ở nhiều nơi, nguồn có mức ưu tiên cao nhất sẽ được dùng.

| Ưu tiên       | Nguồn                            | Đường dẫn                              |
| ------------- | -------------------------------- | -------------------------------------- |
| 1 — cao nhất  | Skills của không gian làm việc   | `<workspace>/skills`                   |
| 2             | Skills tác nhân của dự án        | `<workspace>/.agents/skills`           |
| 3             | Skills tác nhân cá nhân          | `~/.agents/skills`                     |
| 4             | Skills được quản lý / cục bộ     | `~/.openclaw/skills`                   |
| 5             | Skills đi kèm                    | được cung cấp cùng bản cài đặt         |
| 6 — thấp nhất | Các thư mục bổ sung              | `skills.load.extraDirs` + Skills Plugin |

Các thư mục gốc của Skills hỗ trợ bố cục theo nhóm. OpenClaw phát hiện một Skills
bất cứ khi nào `SKILL.md` xuất hiện ở bất kỳ đâu bên dưới thư mục gốc đã cấu hình
(sâu tối đa 6 cấp):

```text
<workspace>/skills/research/SKILL.md          ✓ được tìm thấy với tên "research"
<workspace>/skills/personal/research/SKILL.md ✓ cũng được tìm thấy với tên "research"
```

Đường dẫn thư mục chỉ dùng để tổ chức. Tên và lệnh dấu gạch chéo của Skills
được lấy từ trường `name` trong phần đầu (hoặc tên thư mục khi thiếu `name`).
Danh sách cho phép của tác nhân (bên dưới) cũng khớp theo `name` này.

<Note>
  Thư mục `$CODEX_HOME/skills` gốc của Codex CLI **không** phải là thư mục gốc
  Skills của OpenClaw. Dùng `openclaw migrate plan codex` để kiểm kê các Skills
  đó, sau đó dùng `openclaw migrate codex` để sao chép chúng vào không gian làm
  việc OpenClaw của bạn.
</Note>

## Skills được lưu trữ trên Node

Một Node không giao diện đã kết nối có thể công bố các Skills được cài đặt trong
thư mục Skills OpenClaw đang hoạt động của nó (mặc định là
`~/.openclaw/skills`; các giá trị ghi đè từ môi trường hồ sơ sẽ được áp dụng).
Chúng xuất hiện trong danh sách Skills thông thường của tác nhân khi Node được
kết nối và biến mất khi Node ngắt kết nối. Skills cục bộ hoặc của Gateway giữ
nguyên tên khi xảy ra xung đột; Skills của Node nhận một tên xác định có tiền tố
Node. Phiên bản v1 của Skills được lưu trữ trên Node yêu cầu tên thư mục phải
khớp với trường `name` trong phần đầu của Skills.

Mục Skills bao gồm thông tin định vị Node. Các tệp, tham chiếu tương đối và tệp
nhị phân của nó nằm trên Node, vì vậy hãy tải và thực thi bằng
`exec host=node node=<node-id>`. Khởi động lại máy chủ Node sau khi thay đổi các
tệp Skills của nó. Xem [Node](/vi/nodes#node-hosted-skills) để biết cách ghép nối và
các tùy chọn tắt.

## Skills theo từng tác nhân và Skills dùng chung

Trong thiết lập nhiều tác nhân, mỗi tác nhân có không gian làm việc riêng. Dùng
đường dẫn phù hợp với phạm vi hiển thị mong muốn:

| Phạm vi               | Đường dẫn                     | Hiển thị với                                  |
| --------------------- | ----------------------------- | --------------------------------------------- |
| Theo từng tác nhân    | `<workspace>/skills`          | Chỉ tác nhân đó                               |
| Tác nhân của dự án    | `<workspace>/.agents/skills`  | Chỉ tác nhân của không gian làm việc đó       |
| Tác nhân cá nhân      | `~/.agents/skills`            | Tất cả tác nhân trên máy này                  |
| Dùng chung có quản lý | `~/.openclaw/skills`          | Tất cả tác nhân trên máy này                  |
| Thư mục bổ sung       | `skills.load.extraDirs`       | Tất cả tác nhân trên máy này                  |

## Danh sách cho phép của tác nhân

**Vị trí** của Skills (mức ưu tiên) và **phạm vi hiển thị** của Skills (tác nhân
nào có thể sử dụng) là các cơ chế kiểm soát riêng biệt. Dùng danh sách cho phép
để hạn chế những Skills mà một tác nhân nhìn thấy, bất kể chúng được tải từ đâu.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // đường cơ sở dùng chung
    },
    list: [
      { id: "writer" }, // kế thừa github, weather
      { id: "docs", skills: ["docs-search"] }, // thay thế hoàn toàn giá trị mặc định
      { id: "locked-down", skills: [] }, // không có Skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Quy tắc danh sách cho phép">
    - Bỏ qua `agents.defaults.skills` để mặc định không hạn chế bất kỳ Skills nào.
    - Bỏ qua `agents.list[].skills` để kế thừa `agents.defaults.skills`.
    - Đặt `agents.list[].skills: []` để không cung cấp Skills nào cho tác nhân đó.
    - Danh sách `agents.list[].skills` không rỗng là tập hợp **cuối cùng** — nó
      không hợp nhất với các giá trị mặc định.
    - Danh sách cho phép có hiệu lực được áp dụng xuyên suốt quá trình tạo lời
      nhắc, phát hiện lệnh dấu gạch chéo, đồng bộ sandbox và ảnh chụp nhanh Skills.
    - Đây không phải là ranh giới ủy quyền cho shell của máy chủ. Nếu cùng tác
      nhân đó có thể dùng `exec`, hãy hạn chế riêng shell bằng sandbox, cô lập
      người dùng hệ điều hành, danh sách từ chối/cho phép thực thi và thông tin
      xác thực riêng cho từng tài nguyên.
  </Accordion>
</AccordionGroup>

## Plugin và Skills

Plugin có thể cung cấp Skills riêng bằng cách liệt kê các thư mục `skills` trong
`openclaw.plugin.json` (đường dẫn tương đối với thư mục gốc của Plugin). Skills
của Plugin được tải khi Plugin được bật — ví dụ: Plugin trình duyệt cung cấp một
Skills `browser-automation` để điều khiển trình duyệt qua nhiều bước.

Các thư mục Skills của Plugin được hợp nhất ở cùng mức ưu tiên thấp như
`skills.load.extraDirs`, vì vậy một Skills đi kèm, được quản lý, của tác nhân
hoặc của không gian làm việc có cùng tên sẽ ghi đè chúng. Kiểm soát điều kiện
hợp lệ riêng của một Skills Plugin qua `metadata.openclaw.requires` trong phần
đầu của nó, giống như mọi Skills khác.

Xem [Plugin](/vi/tools/plugin) và [Công cụ](/vi/tools) để biết toàn bộ hệ thống Plugin.

## Xưởng Skills

[Xưởng Skills](/vi/tools/skill-workshop) là hàng đợi đề xuất giữa tác nhân và các
tệp Skills đang hoạt động của bạn. Khi tác nhân phát hiện công việc có thể tái
sử dụng, nó soạn thảo một đề xuất thay vì ghi trực tiếp vào `SKILL.md`. Bạn xem
xét và phê duyệt trước khi có bất kỳ thay đổi nào.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Xem [Xưởng Skills](/vi/tools/skill-workshop) để biết toàn bộ vòng đời, tài liệu tham
khảo CLI và cấu hình.

## Cài đặt từ ClawHub

[ClawHub](https://clawhub.ai) là kho đăng ký Skills công khai. Dùng các lệnh
`openclaw skills` để cài đặt và cập nhật, hoặc CLI `clawhub` để công bố và đồng
bộ.

| Hành động                                      | Lệnh                                                   |
| ---------------------------------------------- | ------------------------------------------------------ |
| Cài đặt một Skills vào không gian làm việc     | `openclaw skills install @owner/<slug>`                |
| Cài đặt từ kho lưu trữ Git                     | `openclaw skills install git:owner/repo@ref`           |
| Cài đặt một thư mục Skills cục bộ              | `openclaw skills install ./path/to/skill --as my-tool` |
| Cài đặt cho tất cả tác nhân cục bộ             | `openclaw skills install @owner/<slug> --global`       |
| Cập nhật tất cả Skills của không gian làm việc | `openclaw skills update --all`                         |
| Cập nhật một Skills dùng chung có quản lý      | `openclaw skills update @owner/<slug> --global`        |
| Cập nhật mọi Skills dùng chung có quản lý      | `openclaw skills update --all --global`                |
| Xác minh phạm vi tin cậy của Skills            | `openclaw skills verify @owner/<slug>`                 |
| In Thẻ Skills đã tạo                           | `openclaw skills verify @owner/<slug> --card`          |
| Công bố / đồng bộ qua CLI ClawHub              | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Chi tiết cài đặt">
    Theo mặc định, `openclaw skills install` cài đặt vào thư mục `skills/` của
    không gian làm việc đang hoạt động. Thêm `--global` để cài đặt vào thư mục
    dùng chung `~/.openclaw/skills`, hiển thị với mọi tác nhân cục bộ trừ khi
    danh sách cho phép của tác nhân thu hẹp phạm vi đó.

    Các bản cài đặt từ Git và nguồn cục bộ yêu cầu `SKILL.md` ở thư mục gốc của
    nguồn. Slug được lấy từ `name` trong phần đầu của `SKILL.md` khi hợp lệ, sau
    đó dùng tên thư mục hoặc kho lưu trữ nếu không có. Dùng `--as <slug>` để ghi
    đè. `openclaw skills update` chỉ theo dõi các bản cài đặt từ ClawHub — hãy
    cài đặt lại nguồn Git hoặc cục bộ để làm mới chúng.

  </Accordion>
  <Accordion title="Xác minh và quét bảo mật">
    `openclaw skills verify @owner/<slug>` yêu cầu ClawHub cung cấp phạm vi tin
    cậy `clawhub.skill.verify.v1` của Skills. Các Skills ClawHub đã cài đặt được
    xác minh theo phiên bản và kho đăng ký được ghi trong `.clawhub/origin.json`.
    Các slug trần vẫn được chấp nhận đối với Skills đã cài đặt hoặc không mơ hồ,
    nhưng tham chiếu kèm chủ sở hữu giúp tránh nhập nhằng về nhà phát hành.

    Các trang Skills của ClawHub hiển thị trạng thái quét bảo mật mới nhất trước
    khi cài đặt, cùng các trang chi tiết cho VirusTotal, ClawScan và phân tích
    tĩnh. Lệnh thoát với mã khác 0 khi ClawHub đánh dấu xác minh là thất bại.
    Nhà phát hành xử lý các kết quả dương tính giả qua bảng điều khiển ClawHub
    hoặc `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Cài đặt từ kho lưu trữ riêng tư">
    Các máy khách Gateway cần phương thức phân phối ngoài ClawHub có thể chuẩn
    bị một kho lưu trữ Skills dạng zip bằng `skills.upload.begin`,
    `skills.upload.chunk` và `skills.upload.commit`, sau đó cài đặt bằng
    `skills.install({ source: "upload", ... })`. Đường dẫn này mặc định bị tắt
    và yêu cầu `skills.install.allowUploadedArchives: true` trong
    `openclaw.json`. Các bản cài đặt ClawHub thông thường không bao giờ cần cài
    đặt đó.
  </Accordion>
</AccordionGroup>

## Bảo mật

<Warning>
  Hãy coi Skills của bên thứ ba là **mã không đáng tin cậy**. Đọc chúng trước
  khi bật. Ưu tiên chạy trong sandbox đối với đầu vào không đáng tin cậy và công
  cụ có rủi ro. Xem [Sandbox](/vi/gateway/sandboxing) để biết các cơ chế kiểm soát
  phía tác nhân.
</Warning>

<AccordionGroup>
  <Accordion title="Giới hạn đường dẫn">
    Việc phát hiện Skills trong không gian làm việc, tác nhân của dự án và thư
    mục bổ sung chỉ chấp nhận các thư mục gốc Skills có đường dẫn thực đã phân
    giải nằm bên trong thư mục gốc được cấu hình, trừ khi
    `skills.load.allowSymlinkTargets` tin cậy rõ ràng một thư mục gốc đích.
    Xưởng Skills chỉ ghi thông qua các đích tin cậy đó khi
    `skills.workshop.allowSymlinkTargetWrites` được bật.
    Thư mục được quản lý `~/.openclaw/skills` và thư mục cá nhân
    `~/.agents/skills` có thể chứa các thư mục Skills được liên kết tượng trưng,
    nhưng đường dẫn thực của mọi `SKILL.md` vẫn phải nằm bên trong thư mục Skills
    đã phân giải tương ứng.
  </Accordion>
  <Accordion title="Chính sách cài đặt của người vận hành">
    Cấu hình `security.installPolicy` để chạy một lệnh chính sách cục bộ đáng tin
    cậy trước khi tiếp tục cài đặt Skills. Chính sách nhận siêu dữ liệu và đường
    dẫn nguồn đã chuẩn bị, áp dụng cho các đường dẫn ClawHub, tải lên, Git, cục
    bộ, cập nhật và trình cài đặt phần phụ thuộc, đồng thời từ chối theo mặc định
    khi lệnh không thể trả về một quyết định hợp lệ.
  </Accordion>
  <Accordion title="Phạm vi chèn bí mật">
    `skills.entries.*.env` và `skills.entries.*.apiKey` chỉ chèn bí mật vào tiến
    trình **máy chủ** trong lượt tác nhân đó — không chèn vào sandbox. Không đưa
    bí mật vào lời nhắc và nhật ký.
  </Accordion>
</AccordionGroup>

Để biết mô hình mối đe dọa rộng hơn và các danh sách kiểm tra bảo mật, hãy xem
[Bảo mật](/vi/gateway/security).

## Định dạng SKILL.md

Mỗi Skills tối thiểu cần có `name` và `description` trong phần đầu:

```markdown
---
name: image-lab
description: Tạo hoặc chỉnh sửa hình ảnh thông qua quy trình hình ảnh được hỗ trợ bởi nhà cung cấp
---

Khi người dùng yêu cầu tạo hình ảnh, hãy dùng công cụ `image_generate`...
```

<Note>
  OpenClaw tuân theo đặc tả [AgentSkills](https://agentskills.io). Frontmatter
  trước tiên được phân tích cú pháp dưới dạng YAML; nếu thất bại, hệ thống sẽ
  chuyển sang trình phân tích cú pháp chỉ hỗ trợ một dòng. Các khối `metadata`
  lồng nhau (bao gồm ánh xạ YAML nhiều dòng) được làm phẳng thành chuỗi JSON và
  phân tích lại dưới dạng JSON5, vì vậy dạng khối minh họa trong phần
  [Điều kiện](#gating) sẽ hoạt động. Dùng `{baseDir}` trong phần nội dung để
  tham chiếu đường dẫn thư mục skill.
</Note>

### Các khóa frontmatter tùy chọn

<ParamField path="homepage" type="string">
  URL được hiển thị dưới dạng "Website" trong giao diện Skills trên macOS. Cũng
  được hỗ trợ qua `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Khi là `true`, skill được cung cấp dưới dạng lệnh gạch chéo mà người dùng có
  thể gọi.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Khi là `true`, OpenClaw không đưa hướng dẫn của skill vào prompt thông thường
  của tác tử. Skill vẫn khả dụng dưới dạng lệnh gạch chéo khi `user-invocable`
  cũng là `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Khi được đặt thành `tool`, lệnh gạch chéo sẽ bỏ qua mô hình và được chuyển
  trực tiếp đến một công cụ đã đăng ký.
</ParamField>

<ParamField path="command-tool" type="string">
  Tên công cụ cần gọi khi đặt `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Đối với việc chuyển tiếp đến công cụ, chuyển nguyên chuỗi đối số thô đến công
  cụ mà không qua phân tích cú pháp của lõi. Công cụ nhận
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Điều kiện

OpenClaw lọc các skill tại thời điểm tải bằng `metadata.openclaw` (đối tượng
JSON5 được nhúng trong frontmatter, xem ghi chú phân tích cú pháp ở trên). Một
skill không có khối `metadata.openclaw` luôn đủ điều kiện, trừ khi bị vô hiệu
hóa rõ ràng.

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
metadata:
  {
    "openclaw":
      {
        "requires": { "bins": ["uv"], "env": ["GEMINI_API_KEY"], "config": ["browser.enabled"] },
        "primaryEnv": "GEMINI_API_KEY",
      },
  }
---
```

<ParamField path="always" type="boolean">
  Khi là `true`, luôn bao gồm skill và bỏ qua tất cả các điều kiện khác.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji tùy chọn được hiển thị trong giao diện Skills trên macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL tùy chọn được hiển thị dưới dạng "Website" trong giao diện Skills trên
  macOS.
</ParamField>

<ParamField path="os" type='("darwin" | "linux" | "win32")[]'>
  Bộ lọc nền tảng. Khi được đặt, skill chỉ đủ điều kiện trên hệ điều hành có
  trong danh sách.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Mỗi tệp nhị phân phải tồn tại trên `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Ít nhất một tệp nhị phân phải tồn tại trên `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Mỗi biến môi trường phải tồn tại trong tiến trình hoặc được cung cấp qua cấu
  hình.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Mỗi đường dẫn `openclaw.json` phải có giá trị đúng.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Tên biến môi trường được liên kết với `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Các đặc tả trình cài đặt tùy chọn được giao diện Skills trên macOS sử dụng
  (brew / node / go / uv / download).
</ParamField>

<Note>
  Các khối `metadata.clawdbot` cũ vẫn được chấp nhận khi không có
  `metadata.openclaw`, nhờ đó các skill cũ đã cài đặt vẫn giữ nguyên điều kiện
  phụ thuộc và gợi ý trình cài đặt. Các skill mới nên dùng
  `metadata.openclaw`.
</Note>

### Đặc tả trình cài đặt

Đặc tả trình cài đặt cho giao diện Skills trên macOS biết cách cài đặt một phần
phụ thuộc:

```markdown
---
name: gemini
description: Use Gemini CLI for coding assistance and Google search lookups.
metadata:
  {
    "openclaw":
      {
        "emoji": "♊️",
        "requires": { "bins": ["gemini"] },
        "install":
          [
            {
              "id": "brew",
              "kind": "brew",
              "formula": "gemini-cli",
              "bins": ["gemini"],
              "label": "Install Gemini CLI (brew)",
            },
          ],
      },
  }
---
```

<AccordionGroup>
  <Accordion title="Quy tắc chọn trình cài đặt">
    - Khi liệt kê nhiều trình cài đặt, Gateway chọn một phương án ưu tiên
      (brew nếu khả dụng, nếu không thì node).
    - Nếu tất cả trình cài đặt đều là `download`, OpenClaw liệt kê từng mục để
      bạn có thể xem tất cả tạo tác khả dụng.
    - Đặc tả có thể bao gồm `os: ["darwin"|"linux"|"win32"]` để lọc theo nền
      tảng.
    - Các bản cài đặt Node tuân theo `skills.install.nodeManager` trong
      `openclaw.json` (mặc định: npm; các tùy chọn: npm / pnpm / yarn / bun).
      Điều này chỉ ảnh hưởng đến việc cài đặt skill; môi trường chạy Gateway
      vẫn nên là Node.
    - Thứ tự ưu tiên trình cài đặt của Gateway: Homebrew → uv → trình quản lý
      node đã cấu hình → go → download.
  </Accordion>
  <Accordion title="Chi tiết theo từng trình cài đặt">
    - **Homebrew:** OpenClaw không tự động cài đặt Homebrew hoặc chuyển đổi các
      công thức brew thành lệnh gói hệ thống. Trong các bộ chứa Linux không có
      `brew`, trình cài đặt chỉ hỗ trợ brew sẽ bị ẩn; hãy dùng ảnh tùy chỉnh
      hoặc cài đặt phần phụ thuộc theo cách thủ công.
    - **Go:** OpenClaw yêu cầu Go 1.21 trở lên để tự động cài đặt skill. Nếu
      thiếu `go` và có Homebrew, OpenClaw sẽ cài đặt Go qua Homebrew trước;
      trên Linux không có Homebrew, hệ thống có thể dùng `apt-get` với quyền
      root hoặc thông qua `sudo` không cần mật khẩu nếu ứng viên `golang-go`
      sau khi làm mới đáp ứng phiên bản tối thiểu. Lệnh `go install` thực tế
      cho phần phụ thuộc luôn nhắm đến một thư mục bin chuyên dụng do OpenClaw
      quản lý (`bin` của Homebrew trên bản cài đặt mới, nếu không thì
      `~/.local/bin`) thay vì `GOBIN` đã cấu hình của bạn — các biến môi trường
      `GOBIN`, `GOPATH` và `GOTOOLCHAIN` của bạn được đọc nhưng không bao giờ
      bị ghi đè.
    - **Tải xuống:** `url` (bắt buộc), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (mặc định: tự động khi phát hiện tệp lưu trữ), `stripComponents`,
      `targetDir` (mặc định: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Ghi chú về cách ly">
    `requires.bins` được kiểm tra trên **máy chủ** tại thời điểm tải skill. Nếu
    tác tử chạy trong môi trường cách ly, tệp nhị phân cũng phải tồn tại
    **bên trong bộ chứa**. Hãy cài đặt tệp đó qua
    `agents.defaults.sandbox.docker.setupCommand` hoặc một ảnh tùy chỉnh.
    `setupCommand` chạy một lần sau khi tạo bộ chứa và yêu cầu quyền truy cập
    mạng ra ngoài, hệ thống tệp gốc có thể ghi và người dùng root trong môi
    trường cách ly.
  </Accordion>
</AccordionGroup>

## Ghi đè cấu hình

Bật/tắt và cấu hình các skill đi kèm hoặc được quản lý trong `skills.entries`
tại `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
        config: {
          endpoint: "https://example.invalid",
          model: "nano-pro",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<ParamField path="enabled" type="boolean">
  `false` vô hiệu hóa skill ngay cả khi skill đó đi kèm hoặc đã được cài đặt.
  Skill đi kèm `coding-agent` cần được chủ động bật — hãy đặt
  `skills.entries.coding-agent.enabled: true` và đảm bảo `claude`, `codex`,
  `opencode` hoặc một CLI được hỗ trợ khác đã được cài đặt và xác thực.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Trường tiện ích dành cho các skill khai báo `metadata.openclaw.primaryEnv`.
  Hỗ trợ chuỗi văn bản thuần hoặc đối tượng SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Các biến môi trường được đưa vào lượt chạy của tác tử. Chỉ được đưa vào khi
  biến đó chưa được đặt trong tiến trình.
</ParamField>

<ParamField path="config" type="object">
  Nhóm tùy chọn dành cho các trường cấu hình riêng của từng skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho các skill **đi kèm**. Khi được đặt,
  chỉ các skill đi kèm có trong danh sách mới đủ điều kiện. Các skill được quản
  lý và skill trong không gian làm việc không bị ảnh hưởng.
</ParamField>

<Note>
  Theo mặc định, các khóa cấu hình khớp với **tên skill**. Nếu một skill định
  nghĩa `metadata.openclaw.skillKey`, hãy dùng khóa đó trong `skills.entries`.
  Đặt tên có dấu gạch nối trong dấu ngoặc kép: JSON5 cho phép các khóa được đặt
  trong dấu ngoặc kép.
</Note>

## Đưa biến môi trường vào

Khi một lượt chạy của tác tử bắt đầu, OpenClaw:

<Steps>
  <Step title="Đọc siêu dữ liệu skill">
    OpenClaw phân giải danh sách skill có hiệu lực cho tác tử, áp dụng các quy
    tắc điều kiện, danh sách cho phép và ghi đè cấu hình.
  </Step>
  <Step title="Đưa biến môi trường và khóa API vào">
    `skills.entries.<key>.env` và `skills.entries.<key>.apiKey` được áp dụng cho
    `process.env` trong suốt thời gian chạy.
  </Step>
  <Step title="Tạo prompt hệ thống">
    Các skill đủ điều kiện được biên dịch thành một khối XML nhỏ gọn và đưa vào
    prompt hệ thống.
  </Step>
  <Step title="Khôi phục môi trường">
    Sau khi lượt chạy kết thúc, môi trường ban đầu được khôi phục.
  </Step>
</Steps>

<Warning>
  Việc đưa biến môi trường vào chỉ áp dụng cho lượt chạy tác tử trên **máy
  chủ**, không áp dụng cho môi trường cách ly. Bên trong môi trường cách ly,
  `env` và `apiKey` không có tác dụng. Xem
  [Cấu hình Skills](/vi/tools/skills-config#sandboxed-skills-and-env-vars) để biết
  cách truyền thông tin bí mật vào các lượt chạy trong môi trường cách ly.
</Warning>

Đối với backend `claude-cli` đi kèm, OpenClaw cũng hiện thực hóa cùng một bản
chụp skill đủ điều kiện dưới dạng Plugin Claude Code tạm thời và truyền nó qua
`--plugin-dir`. Các backend CLI khác chỉ sử dụng danh mục prompt.

## Bản chụp và làm mới

OpenClaw chụp lại các skill đủ điều kiện **khi một phiên bắt đầu** và tái sử
dụng danh sách đó cho tất cả các lượt tiếp theo trong phiên. Các thay đổi đối
với skill hoặc cấu hình sẽ có hiệu lực trong phiên mới tiếp theo.

Skills được làm mới giữa phiên trong hai trường hợp:

- Trình theo dõi skill phát hiện thay đổi trong `SKILL.md`.
- Một node từ xa mới đủ điều kiện kết nối.

Danh sách đã làm mới được sử dụng trong lượt tác tử tiếp theo. Nếu danh sách cho
phép có hiệu lực của tác tử thay đổi, OpenClaw sẽ làm mới bản chụp để duy trì
sự đồng bộ của các skill hiển thị.

<AccordionGroup>
  <Accordion title="Trình theo dõi Skills">
    Theo mặc định, OpenClaw theo dõi các thư mục skill và cập nhật bản chụp khi
    các tệp `SKILL.md` thay đổi. Cấu hình trong `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true, // default
          watchDebounceMs: 250, // default
        },
      },
    }
    ```

    Dùng `allowSymlinkTargets` cho các bố cục liên kết tượng trưng có chủ đích,
    trong đó liên kết tượng trưng gốc của skill trỏ ra ngoài thư mục gốc đã cấu
    hình, ví dụ
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Chỉ bật `skills.workshop.allowSymlinkTargetWrites` khi Skill Workshop cũng
    cần áp dụng các đề xuất thông qua những đường dẫn liên kết tượng trưng đáng
    tin cậy đó.

  </Accordion>
  <Accordion title="Các node macOS từ xa (Gateway Linux)">
    Nếu Gateway chạy trên Linux nhưng một **node macOS** được kết nối và cho
    phép `system.run`, OpenClaw có thể coi các skill chỉ dành cho macOS là đủ
    điều kiện khi các tệp nhị phân cần thiết có trên node đó. Tác tử nên chạy
    các skill này qua công cụ `exec` với `host=node`.

    Các node ngoại tuyến **không** làm cho các skill chỉ dùng từ xa hiển thị.
    Nếu một node ngừng phản hồi các phép dò tệp nhị phân, OpenClaw sẽ xóa các
    kết quả khớp tệp nhị phân đã lưu trong bộ nhớ đệm của node đó.

  </Accordion>
</AccordionGroup>

## Ảnh hưởng đến token

Khi các skill đủ điều kiện, OpenClaw đưa một khối XML nhỏ gọn vào prompt hệ
thống. Chi phí có tính xác định và tăng tuyến tính theo từng skill:

- **Chi phí cơ sở** (chỉ khi có từ 1 skill đủ điều kiện trở lên): một khối cố
  định gồm phần giới thiệu và phần bao `<available_skills>`.
- **Mỗi skill:** khoảng 97 ký tự + độ dài các trường `name`, `description` và
  `location` của bạn.
- Việc thoát ký tự XML chuyển `& < > " '` thành các thực thể, làm tăng thêm vài
  ký tự cho mỗi lần xuất hiện.
- Với khoảng 4 ký tự/token, 97 ký tự ≈ 24 token cho mỗi skill trước khi tính độ
  dài các trường.

Nếu khối được kết xuất vượt quá ngân sách prompt đã cấu hình
(`skills.limits.maxSkillsPromptChars`), trước tiên OpenClaw sẽ giữ lại nhiều định danh Skills
(tên, vị trí và phiên bản) nhất có thể trong phạm vi mà định dạng rút gọn không có phần mô tả
cho phép. Sau đó, OpenClaw sử dụng phần ngân sách còn lại cho các mô tả được rút ngắn. Nếu không
còn ngân sách cho phần mô tả, các mô tả sẽ bị lược bỏ. Prompt sẽ bao gồm một
ghi chú trỏ đến `openclaw skills check` bất cứ khi nào cần dùng định dạng rút gọn hoặc
cắt bớt danh sách.

Giữ phần mô tả ngắn gọn và rõ nghĩa để giảm thiểu chi phí prompt.

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo Skills" href="/vi/tools/creating-skills" icon="hammer">
    Hướng dẫn từng bước để tạo một Skills tùy chỉnh.
  </Card>
  <Card title="Xưởng Skills" href="/vi/tools/skill-workshop" icon="flask">
    Hàng đợi đề xuất dành cho các Skills do agent soạn thảo.
  </Card>
  <Card title="Cấu hình Skills" href="/vi/tools/skills-config" icon="gear">
    Lược đồ cấu hình `skills.*` đầy đủ và danh sách cho phép của agent.
  </Card>
  <Card title="Lệnh gạch chéo" href="/vi/tools/slash-commands" icon="terminal">
    Cách đăng ký và định tuyến các lệnh gạch chéo của Skills.
  </Card>
  <Card title="ClawHub" href="/clawhub" icon="cloud">
    Duyệt và phát hành Skills trên sổ đăng ký công khai.
  </Card>
  <Card title="Các Plugin" href="/vi/tools/plugin" icon="plug">
    Các Plugin có thể phân phối Skills cùng với những công cụ mà chúng lập tài liệu.
  </Card>
</CardGroup>
