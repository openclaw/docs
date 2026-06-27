---
read_when:
    - Thêm hoặc sửa đổi Skills
    - Thay đổi việc kiểm soát Skills, danh sách cho phép hoặc quy tắc tải
    - Hiểu thứ tự ưu tiên của skill và hành vi snapshot
sidebarTitle: Skills
summary: Skills dạy tác tử của bạn cách sử dụng công cụ. Tìm hiểu cách chúng được tải, cách thứ tự ưu tiên hoạt động, và cách cấu hình gating, danh sách cho phép, cùng việc chèn môi trường.
title: Skills
x-i18n:
    generated_at: "2026-06-27T18:18:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e42d89d47125a4d92f68a20d754de571d5582858a9c44618b999a27335e78ab2
    source_path: tools/skills.md
    workflow: 16
---

Skills là các tệp hướng dẫn markdown dạy tác tử cách thức và thời điểm sử dụng
công cụ. Mỗi skill nằm trong một thư mục chứa tệp `SKILL.md` có YAML
frontmatter và phần thân markdown. OpenClaw tải các skill đi kèm cùng mọi phần
ghi đè cục bộ, rồi lọc chúng tại thời điểm tải dựa trên môi trường, cấu hình và
sự hiện diện của tệp nhị phân.

<CardGroup cols={2}>
  <Card title="Tạo skill" href="/vi/tools/creating-skills" icon="hammer">
    Xây dựng và kiểm thử một skill tùy chỉnh từ đầu.
  </Card>
  <Card title="Skill Workshop" href="/vi/tools/skill-workshop" icon="flask">
    Xem xét và phê duyệt các đề xuất skill do tác tử soạn thảo.
  </Card>
  <Card title="Cấu hình Skills" href="/vi/tools/skills-config" icon="gear">
    Lược đồ cấu hình `skills.*` đầy đủ và danh sách cho phép của tác tử.
  </Card>
  <Card title="ClawHub" href="/vi/clawhub" icon="cloud">
    Duyệt và cài đặt các skill cộng đồng.
  </Card>
</CardGroup>

## Thứ tự tải

OpenClaw tải từ các nguồn sau, **mức ưu tiên cao nhất trước**. Khi cùng một
tên skill xuất hiện ở nhiều nơi, nguồn cao nhất sẽ thắng.

| Mức ưu tiên   | Nguồn                  | Đường dẫn                               |
| ------------- | ---------------------- | --------------------------------------- |
| 1 — cao nhất  | Skill trong workspace  | `<workspace>/skills`                    |
| 2             | Skill tác tử dự án     | `<workspace>/.agents/skills`            |
| 3             | Skill tác tử cá nhân   | `~/.agents/skills`                      |
| 4             | Skill được quản lý / cục bộ | `~/.openclaw/skills`               |
| 5             | Skill đi kèm           | được cung cấp cùng bản cài đặt          |
| 6 — thấp nhất | Thư mục bổ sung        | `skills.load.extraDirs` + skill Plugin  |

Gốc skill hỗ trợ bố cục theo nhóm. OpenClaw phát hiện một skill mỗi khi
`SKILL.md` xuất hiện ở bất kỳ đâu dưới một gốc đã cấu hình:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Đường dẫn thư mục chỉ dùng để tổ chức. Tên của skill, lệnh gạch chéo và
khóa danh sách cho phép đều lấy từ trường frontmatter `name` (hoặc tên thư mục
khi thiếu `name`).

<Note>
  Thư mục `$CODEX_HOME/skills` gốc của Codex CLI **không** phải là gốc skill
  của OpenClaw. Dùng `openclaw migrate plan codex` để kiểm kê các skill đó, sau đó
  dùng `openclaw migrate codex` để sao chép chúng vào workspace OpenClaw của bạn.
</Note>

## Skill theo từng tác tử so với skill dùng chung

Trong các thiết lập đa tác tử, mỗi tác tử có workspace riêng. Dùng đường dẫn
khớp với phạm vi hiển thị bạn muốn:

| Phạm vi             | Đường dẫn                   | Hiển thị với                 |
| ------------------- | --------------------------- | ---------------------------- |
| Theo từng tác tử    | `<workspace>/skills`        | Chỉ tác tử đó                |
| Tác tử dự án        | `<workspace>/.agents/skills` | Chỉ tác tử của workspace đó |
| Tác tử cá nhân      | `~/.agents/skills`          | Mọi tác tử trên máy này      |
| Quản lý dùng chung  | `~/.openclaw/skills`        | Mọi tác tử trên máy này      |
| Thư mục bổ sung     | `skills.load.extraDirs`     | Mọi tác tử trên máy này      |

## Danh sách cho phép của tác tử

**Vị trí** skill (mức ưu tiên) và **khả năng hiển thị** skill (tác tử nào có thể
dùng skill đó) là các cơ chế điều khiển riêng biệt. Dùng danh sách cho phép để
giới hạn những skill mà một tác tử nhìn thấy, bất kể chúng được tải từ đâu.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"], // shared baseline
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults entirely
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Quy tắc danh sách cho phép">
    - Bỏ qua `agents.defaults.skills` để mặc định không giới hạn skill nào.
    - Bỏ qua `agents.list[].skills` để kế thừa `agents.defaults.skills`.
    - Đặt `agents.list[].skills: []` để không hiển thị skill nào cho tác tử đó.
    - Danh sách `agents.list[].skills` không rỗng là tập hợp **cuối cùng** — nó không
      hợp nhất với mặc định.
    - Danh sách cho phép hiệu lực áp dụng trên quá trình xây dựng prompt, phát hiện
      lệnh gạch chéo, đồng bộ sandbox và snapshot skill.
  </Accordion>
</AccordionGroup>

## Plugin và skill

Plugin có thể cung cấp skill riêng bằng cách liệt kê các thư mục `skills` trong
`openclaw.plugin.json` (đường dẫn tương đối với gốc Plugin). Skill của Plugin tải
khi Plugin được bật — ví dụ, Plugin trình duyệt cung cấp skill
`browser-automation` để điều khiển trình duyệt nhiều bước.

Các thư mục skill của Plugin được hợp nhất ở cùng mức ưu tiên thấp như
`skills.load.extraDirs`, vì vậy một skill đi kèm, được quản lý, của tác tử hoặc
workspace có cùng tên sẽ ghi đè chúng. Kiểm soát chúng qua
`metadata.openclaw.requires.config` trên mục cấu hình của Plugin.

Xem [Plugin](/vi/tools/plugin) và [Công cụ](/vi/tools) để biết toàn bộ hệ thống Plugin.

## Skill Workshop

[Skill Workshop](/vi/tools/skill-workshop) là hàng đợi đề xuất giữa tác tử và
các tệp skill đang hoạt động của bạn. Khi tác tử nhận ra công việc có thể tái sử dụng,
nó soạn một đề xuất thay vì ghi trực tiếp vào `SKILL.md`. Bạn xem xét và phê duyệt
trước khi bất kỳ thay đổi nào diễn ra.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Xem [Skill Workshop](/vi/tools/skill-workshop) để biết toàn bộ vòng đời, tài liệu
tham khảo CLI và cấu hình.

## Cài đặt từ ClawHub

[ClawHub](https://clawhub.ai) là registry skill công khai. Dùng các lệnh
`openclaw skills` để cài đặt và cập nhật, hoặc CLI `clawhub` để
phát hành và đồng bộ.

| Hành động                           | Lệnh                                                   |
| ----------------------------------- | ------------------------------------------------------ |
| Cài đặt một skill vào workspace     | `openclaw skills install @owner/<slug>`                |
| Cài đặt từ kho Git                  | `openclaw skills install git:owner/repo@ref`           |
| Cài đặt thư mục skill cục bộ        | `openclaw skills install ./path/to/skill --as my-tool` |
| Cài đặt cho mọi tác tử cục bộ       | `openclaw skills install @owner/<slug> --global`       |
| Cập nhật mọi skill trong workspace  | `openclaw skills update --all`                         |
| Cập nhật một skill được quản lý dùng chung | `openclaw skills update @owner/<slug> --global` |
| Cập nhật mọi skill được quản lý dùng chung | `openclaw skills update --all --global`          |
| Xác minh phong bì tin cậy của skill | `openclaw skills verify @owner/<slug>`                 |
| In Skill Card đã tạo                | `openclaw skills verify @owner/<slug> --card`          |
| Phát hành / đồng bộ qua ClawHub CLI | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Chi tiết cài đặt">
    `openclaw skills install` mặc định cài đặt vào thư mục `skills/` của
    workspace đang hoạt động. Thêm `--global` để cài đặt vào thư mục dùng chung
    `~/.openclaw/skills`, hiển thị với mọi tác tử cục bộ trừ khi danh sách cho phép
    của tác tử thu hẹp phạm vi đó.

    Các cài đặt từ Git và cục bộ yêu cầu `SKILL.md` ở gốc nguồn. Slug lấy từ
    frontmatter `name` của `SKILL.md` khi hợp lệ, sau đó quay về tên thư mục hoặc
    kho. Dùng `--as <slug>` để ghi đè.
    `openclaw skills update` chỉ theo dõi các bản cài đặt ClawHub — hãy cài đặt lại
    nguồn Git hoặc cục bộ để làm mới chúng.

  </Accordion>
  <Accordion title="Xác minh và quét bảo mật">
    `openclaw skills verify @owner/<slug>` yêu cầu ClawHub cung cấp phong bì tin cậy
    `clawhub.skill.verify.v1` của skill. Các skill ClawHub đã cài đặt được xác minh
    theo phiên bản và registry được ghi trong `.clawhub/origin.json`.
    Slug trần vẫn được chấp nhận cho các skill đã cài đặt sẵn hoặc không nhập nhằng,
    nhưng tham chiếu có owner giúp tránh nhập nhằng về nhà phát hành.

    Trang skill ClawHub hiển thị trạng thái quét bảo mật mới nhất trước khi cài đặt,
    kèm các trang chi tiết cho VirusTotal, ClawScan và phân tích tĩnh. Lệnh thoát
    với mã khác 0 khi ClawHub đánh dấu xác minh là thất bại. Nhà phát hành xử lý
    dương tính giả qua bảng điều khiển ClawHub hoặc
    `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Cài đặt kho lưu trữ riêng tư">
    Các client Gateway cần phân phối không qua ClawHub có thể chuẩn bị một kho lưu trữ
    skill dạng zip bằng `skills.upload.begin`, `skills.upload.chunk` và `skills.upload.commit`,
    rồi cài đặt bằng `skills.install({ source: "upload", ... })`. Đường dẫn này
    mặc định tắt và yêu cầu `skills.install.allowUploadedArchives: true` trong
    `openclaw.json`. Các cài đặt ClawHub thông thường không bao giờ cần thiết lập đó.
  </Accordion>
</AccordionGroup>

## Bảo mật

<Warning>
  Hãy coi skill bên thứ ba là **mã không đáng tin cậy**. Đọc chúng trước khi bật.
  Ưu tiên chạy trong sandbox cho đầu vào không đáng tin cậy và công cụ rủi ro. Xem
  [Sandboxing](/vi/gateway/sandboxing) để biết các điều khiển phía tác tử.
</Warning>

<AccordionGroup>
  <Accordion title="Giới hạn đường dẫn">
    Việc phát hiện skill trong workspace, tác tử dự án và thư mục bổ sung chỉ chấp nhận
    các gốc skill có realpath đã phân giải vẫn nằm bên trong gốc đã cấu hình, trừ khi
    `skills.load.allowSymlinkTargets` tin cậy rõ ràng một gốc đích.
    Skill Workshop chỉ ghi qua các đích tin cậy đó khi
    `skills.workshop.allowSymlinkTargetWrites` được bật.
    `~/.openclaw/skills` được quản lý và `~/.agents/skills` cá nhân có thể chứa
    các thư mục skill được liên kết tượng trưng, nhưng mọi realpath của `SKILL.md`
    vẫn phải nằm bên trong thư mục skill đã phân giải của nó.
  </Accordion>
  <Accordion title="Chính sách cài đặt của người vận hành">
    Cấu hình `security.installPolicy` để chạy một lệnh chính sách cục bộ tin cậy
    trước khi tiếp tục cài đặt skill. Chính sách nhận metadata và đường dẫn nguồn
    đã chuẩn bị, áp dụng cho ClawHub, tải lên, Git, cục bộ, cập nhật và các đường dẫn
    trình cài đặt phụ thuộc, đồng thời fail closed khi lệnh không thể trả về
    một quyết định hợp lệ.
  </Accordion>
  <Accordion title="Phạm vi chèn bí mật">
    `skills.entries.*.env` và `skills.entries.*.apiKey` chèn bí mật vào quy trình
    **host** chỉ cho lượt tác tử đó — không chèn vào sandbox. Không đưa bí mật vào
    prompt và log.
  </Accordion>
</AccordionGroup>

Để biết mô hình mối đe dọa rộng hơn và các danh sách kiểm tra bảo mật, xem
[Bảo mật](/vi/gateway/security).

## Định dạng SKILL.md

Mỗi skill tối thiểu cần có `name` và `description` trong frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw tuân theo đặc tả [AgentSkills](https://agentskills.io). Trình phân tích
  frontmatter chỉ hỗ trợ **khóa một dòng** — `metadata` phải là một đối tượng JSON
  một dòng. Dùng `{baseDir}` trong phần thân để tham chiếu đường dẫn thư mục skill.
</Note>

### Khóa frontmatter tùy chọn

<ParamField path="homepage" type="string">
  URL hiển thị dưới dạng "Website" trong UI Skills của macOS. Cũng được hỗ trợ qua
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Khi `true`, skill được hiển thị như một lệnh gạch chéo người dùng có thể gọi.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Khi `true`, OpenClaw không đưa hướng dẫn của skill vào prompt thông thường của tác tử.
  Skill vẫn khả dụng dưới dạng lệnh gạch chéo khi `user-invocable` cũng là `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Khi đặt thành `tool`, lệnh gạch chéo bỏ qua mô hình và dispatch
  trực tiếp đến một công cụ đã đăng ký.
</ParamField>

<ParamField path="command-tool" type="string">
  Tên công cụ cần gọi khi đặt `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Với dispatch công cụ, chuyển tiếp chuỗi đối số thô đến công cụ mà không có
  phân tích cú pháp lõi. Công cụ nhận
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Kiểm soát

OpenClaw lọc các kỹ năng tại thời điểm tải bằng `metadata.openclaw` (JSON một dòng
trong frontmatter). Một kỹ năng không có khối `metadata.openclaw` luôn đủ điều kiện
trừ khi bị tắt rõ ràng.

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
  Khi là `true`, luôn bao gồm kỹ năng và bỏ qua mọi cổng kiểm tra khác.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji tùy chọn hiển thị trong giao diện macOS Skills.
</ParamField>

<ParamField path="homepage" type="string">
  URL tùy chọn hiển thị dưới dạng "Trang web" trong giao diện macOS Skills.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Bộ lọc nền tảng. Khi được đặt, kỹ năng chỉ đủ điều kiện trên các hệ điều hành được liệt kê.
</ParamField>

<ParamField path="requires.bins" type="string[]">
  Mỗi tệp nhị phân phải tồn tại trên `PATH`.
</ParamField>

<ParamField path="requires.anyBins" type="string[]">
  Ít nhất một tệp nhị phân phải tồn tại trên `PATH`.
</ParamField>

<ParamField path="requires.env" type="string[]">
  Mỗi biến môi trường phải tồn tại trong tiến trình hoặc được cung cấp qua cấu hình.
</ParamField>

<ParamField path="requires.config" type="string[]">
  Mỗi đường dẫn `openclaw.json` phải có giá trị truthy.
</ParamField>

<ParamField path="primaryEnv" type="string">
  Tên biến môi trường liên kết với `skills.entries.<name>.apiKey`.
</ParamField>

<ParamField path="install" type="object[]">
  Thông số trình cài đặt tùy chọn được giao diện macOS Skills sử dụng (brew / node / go / uv / download).
</ParamField>

<Note>
  Các khối `metadata.clawdbot` cũ vẫn được chấp nhận khi
  không có `metadata.openclaw`, nên các kỹ năng đã cài đặt cũ hơn vẫn giữ
  các cổng kiểm tra phụ thuộc và gợi ý trình cài đặt. Kỹ năng mới nên dùng
  `metadata.openclaw`.
</Note>

### Thông số trình cài đặt

Thông số trình cài đặt cho giao diện macOS Skills biết cách cài đặt một phụ thuộc:

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
    - Khi nhiều trình cài đặt được liệt kê, gateway chọn một tùy chọn ưu tiên
      (brew khi có sẵn, nếu không thì node).
    - Nếu tất cả trình cài đặt đều là `download`, OpenClaw liệt kê từng mục để bạn có thể
      xem tất cả artifact có sẵn.
    - Thông số có thể bao gồm `os: ["darwin"|"linux"|"win32"]` để lọc theo nền tảng.
    - Cài đặt Node tuân theo `skills.install.nodeManager` trong `openclaw.json`
      (mặc định: npm; tùy chọn: npm / pnpm / yarn / bun). Điều này chỉ ảnh hưởng đến
      cài đặt kỹ năng; runtime Gateway vẫn nên là Node.
    - Ưu tiên trình cài đặt của Gateway: Homebrew → uv → trình quản lý node đã cấu hình →
      go → download.
  </Accordion>
  <Accordion title="Chi tiết theo từng trình cài đặt">
    - **Homebrew:** OpenClaw không tự động cài đặt Homebrew hoặc chuyển đổi công thức brew
      thành lệnh gói hệ thống. Trong container Linux không có
      `brew`, trình cài đặt chỉ dùng brew sẽ bị ẩn; hãy dùng image tùy chỉnh hoặc cài đặt
      phụ thuộc theo cách thủ công.
    - **Go:** nếu thiếu `go` và có `brew`, gateway sẽ cài đặt
      Go qua Homebrew trước và đặt `GOBIN` thành `bin` của Homebrew.
    - **Download:** `url` (bắt buộc), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (mặc định: tự động khi phát hiện archive), `stripComponents`,
      `targetDir` (mặc định: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Ghi chú về sandbox">
    `requires.bins` được kiểm tra trên **máy chủ** tại thời điểm tải kỹ năng. Nếu một agent
    chạy trong sandbox, tệp nhị phân cũng phải tồn tại **bên trong container**.
    Cài đặt nó qua `agents.defaults.sandbox.docker.setupCommand` hoặc một image tùy chỉnh.
    `setupCommand` chạy một lần sau khi tạo container và yêu cầu
    truy cập mạng đi ra, hệ thống tệp gốc có thể ghi, và người dùng root trong sandbox.
  </Accordion>
</AccordionGroup>

## Ghi đè cấu hình

Bật/tắt và cấu hình các kỹ năng đi kèm hoặc được quản lý trong `skills.entries` tại
`~/.openclaw/openclaw.json`:

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
  `false` tắt kỹ năng ngay cả khi được đi kèm hoặc đã cài đặt. Kỹ năng đi kèm `coding-agent`
  là opt-in — đặt `skills.entries.coding-agent.enabled: true`
  và đảm bảo một trong `claude`, `codex`, `opencode`, hoặc CLI được hỗ trợ khác
  đã được cài đặt và xác thực.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Trường tiện ích cho các kỹ năng khai báo `metadata.openclaw.primaryEnv`.
  Hỗ trợ chuỗi văn bản thuần hoặc đối tượng SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Biến môi trường được chèn cho lần chạy agent. Chỉ được chèn khi
  biến chưa được đặt trong tiến trình.
</ParamField>

<ParamField path="config" type="object">
  Túi tùy chọn cho các trường cấu hình tùy chỉnh theo từng kỹ năng.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho các kỹ năng **đi kèm**. Khi được đặt, chỉ các kỹ năng đi kèm
  trong danh sách mới đủ điều kiện. Kỹ năng được quản lý và trong workspace không bị ảnh hưởng.
</ParamField>

<Note>
  Theo mặc định, khóa cấu hình khớp với **tên kỹ năng**. Nếu một kỹ năng định nghĩa
  `metadata.openclaw.skillKey`, hãy dùng khóa đó trong `skills.entries`. Đặt
  tên có dấu gạch nối trong dấu ngoặc kép: JSON5 cho phép khóa được trích dẫn.
</Note>

## Chèn môi trường

Khi một lần chạy agent bắt đầu, OpenClaw:

<Steps>
  <Step title="Đọc metadata kỹ năng">
    OpenClaw phân giải danh sách kỹ năng hiệu lực cho agent, áp dụng các quy tắc cổng kiểm tra,
    danh sách cho phép, và ghi đè cấu hình.
  </Step>
  <Step title="Chèn env và khóa API">
    `skills.entries.<key>.env` và `skills.entries.<key>.apiKey` được áp dụng vào
    `process.env` trong suốt thời lượng của lần chạy.
  </Step>
  <Step title="Xây dựng system prompt">
    Các kỹ năng đủ điều kiện được biên dịch thành một khối XML gọn và chèn vào
    system prompt.
  </Step>
  <Step title="Khôi phục môi trường">
    Sau khi lần chạy kết thúc, môi trường gốc được khôi phục.
  </Step>
</Steps>

<Warning>
  Việc chèn env được giới hạn trong lần chạy agent trên **máy chủ**, không phải sandbox. Bên trong
  sandbox, `env` và `apiKey` không có hiệu lực. Xem
  [Cấu hình Skills](/vi/tools/skills-config#sandboxed-skills-and-env-vars) để biết cách
  truyền bí mật vào các lần chạy trong sandbox.
</Warning>

Đối với backend `claude-cli` đi kèm, OpenClaw cũng hiện thực hóa cùng
ảnh chụp kỹ năng đủ điều kiện dưới dạng một plugin Claude Code tạm thời và truyền nó qua
`--plugin-dir`. Các backend CLI khác chỉ dùng danh mục prompt.

## Ảnh chụp và làm mới

OpenClaw chụp ảnh các kỹ năng đủ điều kiện **khi một phiên bắt đầu** và tái sử dụng
danh sách đó cho tất cả lượt tiếp theo trong phiên. Thay đổi với kỹ năng hoặc cấu hình có
hiệu lực ở phiên mới tiếp theo.

Skills làm mới giữa phiên trong hai trường hợp:

- Trình theo dõi kỹ năng phát hiện thay đổi `SKILL.md`.
- Một remote node đủ điều kiện mới kết nối.

Danh sách đã làm mới được dùng ở lượt agent tiếp theo. Nếu danh sách cho phép hiệu lực của agent
thay đổi, OpenClaw làm mới ảnh chụp để giữ các kỹ năng hiển thị
đồng bộ.

<AccordionGroup>
  <Accordion title="Trình theo dõi Skills">
    Theo mặc định, OpenClaw theo dõi các thư mục kỹ năng và tăng ảnh chụp khi
    tệp `SKILL.md` thay đổi. Cấu hình trong `skills.load`:

    ```json5
    {
      skills: {
        load: {
          extraDirs: ["~/Projects/agent-scripts/skills"],
          allowSymlinkTargets: ["~/Projects/manager/skills"],
          watch: true,
          watchDebounceMs: 250,
        },
      },
    }
    ```

    Dùng `allowSymlinkTargets` cho các bố cục symlink có chủ đích, nơi symlink
    gốc kỹ năng trỏ ra ngoài gốc đã cấu hình, ví dụ
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Chỉ bật `skills.workshop.allowSymlinkTargetWrites` khi Skill Workshop
    cũng nên áp dụng đề xuất thông qua các đường dẫn symlink đáng tin cậy đó.

  </Accordion>
  <Accordion title="Node macOS từ xa (gateway Linux)">
    Nếu Gateway chạy trên Linux nhưng một **node macOS** được kết nối với
    `system.run` được cho phép, OpenClaw có thể coi các kỹ năng chỉ dành cho macOS là đủ điều kiện khi
    các tệp nhị phân bắt buộc có mặt trên node đó. Agent nên chạy các
    kỹ năng đó qua công cụ `exec` với `host=node`.

    Node ngoại tuyến **không** làm các kỹ năng chỉ ở xa hiển thị. Nếu một node ngừng
    phản hồi thăm dò bin, OpenClaw xóa các kết quả khớp bin đã lưu trong bộ nhớ đệm của nó.

  </Accordion>
</AccordionGroup>

## Tác động token

Khi kỹ năng đủ điều kiện, OpenClaw chèn một khối XML gọn vào system
prompt. Chi phí là tất định:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Chi phí cơ sở** (chỉ khi ≥ 1 kỹ năng): ~195 ký tự
- **Mỗi kỹ năng:** ~97 ký tự + độ dài các trường `name`, `description`, và `location` của bạn
- Việc escape XML mở rộng `& < > " '` thành entity, thêm vài ký tự cho mỗi lần xuất hiện
- Với ~4 ký tự/token, 97 ký tự ≈ 24 token cho mỗi kỹ năng trước khi tính độ dài trường

Giữ mô tả ngắn gọn và có tính mô tả để giảm thiểu chi phí prompt.

## Liên quan

<CardGroup cols={2}>
  <Card title="Tạo kỹ năng" href="/vi/tools/creating-skills" icon="hammer">
    Hướng dẫn từng bước để tạo một kỹ năng tùy chỉnh.
  </Card>
  <Card title="Skill Workshop" href="/vi/tools/skill-workshop" icon="flask">
    Hàng đợi đề xuất cho các kỹ năng do agent phác thảo.
  </Card>
  <Card title="Cấu hình Skills" href="/vi/tools/skills-config" icon="gear">
    Schema cấu hình `skills.*` đầy đủ và danh sách cho phép của agent.
  </Card>
  <Card title="Lệnh slash" href="/vi/tools/slash-commands" icon="terminal">
    Cách các lệnh slash của kỹ năng được đăng ký và định tuyến.
  </Card>
  <Card title="ClawHub" href="/vi/clawhub" icon="cloud">
    Duyệt và xuất bản kỹ năng trên registry công khai.
  </Card>
  <Card title="Plugin" href="/vi/tools/plugin" icon="plug">
    Plugin có thể đóng gói kỹ năng cùng với các công cụ mà chúng tài liệu hóa.
  </Card>
</CardGroup>
