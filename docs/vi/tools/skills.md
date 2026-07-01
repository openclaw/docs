---
read_when:
    - Thêm hoặc sửa đổi Skills
    - Thay đổi cổng kiểm soát, danh sách cho phép hoặc quy tắc tải skill
    - Hiểu thứ tự ưu tiên của skill và hành vi snapshot
sidebarTitle: Skills
summary: Skills dạy agent của bạn cách sử dụng công cụ. Tìm hiểu cách chúng được tải, cách hoạt động của thứ tự ưu tiên, và cách cấu hình gating, allowlist, cũng như tiêm biến môi trường.
title: Skills
x-i18n:
    generated_at: "2026-07-01T08:20:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d278a83bcd92e8c24ad0e01ec8fbf462450556493453ca1152e317727be34400
    source_path: tools/skills.md
    workflow: 16
---

Skills là các tệp hướng dẫn markdown dạy agent cách và thời điểm sử dụng
công cụ. Mỗi skill nằm trong một thư mục chứa tệp `SKILL.md` với YAML
frontmatter và phần thân markdown. OpenClaw tải các skills đi kèm cùng mọi
ghi đè cục bộ, rồi lọc chúng tại thời điểm tải dựa trên môi trường, cấu hình và
sự hiện diện của binary.

<CardGroup cols={2}>
  <Card title="Creating skills" href="/vi/tools/creating-skills" icon="hammer">
    Xây dựng và kiểm thử một skill tùy chỉnh từ đầu.
  </Card>
  <Card title="Skill Workshop" href="/vi/tools/skill-workshop" icon="flask">
    Xem xét và phê duyệt các đề xuất skill do agent soạn thảo.
  </Card>
  <Card title="Skills config" href="/vi/tools/skills-config" icon="gear">
    Lược đồ cấu hình `skills.*` đầy đủ và danh sách cho phép của agent.
  </Card>
  <Card title="ClawHub" href="/vi/clawhub" icon="cloud">
    Duyệt và cài đặt skills cộng đồng.
  </Card>
</CardGroup>

## Thứ tự tải

OpenClaw tải từ các nguồn này, **độ ưu tiên cao nhất trước**. Khi cùng một
tên skill xuất hiện ở nhiều nơi, nguồn cao nhất sẽ thắng.

| Độ ưu tiên    | Nguồn                  | Đường dẫn                               |
| ------------- | ---------------------- | -------------------------------------- |
| 1 — cao nhất  | Skills trong workspace | `<workspace>/skills`                   |
| 2             | Skills agent dự án     | `<workspace>/.agents/skills`           |
| 3             | Skills agent cá nhân   | `~/.agents/skills`                     |
| 4             | Skills được quản lý / cục bộ | `~/.openclaw/skills`             |
| 5             | Skills đi kèm          | đi kèm với bản cài đặt                 |
| 6 — thấp nhất | Thư mục bổ sung        | `skills.load.extraDirs` + plugin skills |

Gốc skill hỗ trợ bố cục theo nhóm. OpenClaw phát hiện một skill bất cứ khi nào
`SKILL.md` xuất hiện ở bất kỳ đâu dưới một gốc đã cấu hình:

```text
<workspace>/skills/research/SKILL.md          ✓ found as "research"
<workspace>/skills/personal/research/SKILL.md ✓ also found as "research"
```

Đường dẫn thư mục chỉ dùng để tổ chức. Tên skill, slash command và khóa
danh sách cho phép đều đến từ trường frontmatter `name` (hoặc tên thư mục
khi thiếu `name`).

<Note>
  Thư mục `$CODEX_HOME/skills` gốc của Codex CLI **không** phải là gốc skill
  của OpenClaw. Dùng `openclaw migrate plan codex` để kiểm kê các skills đó,
  rồi dùng `openclaw migrate codex` để sao chép chúng vào workspace OpenClaw của bạn.
</Note>

## Skills theo từng agent và skills dùng chung

Trong thiết lập nhiều agent, mỗi agent có workspace riêng. Dùng đường dẫn khớp
với phạm vi hiển thị bạn muốn:

| Phạm vi            | Đường dẫn                    | Hiển thị với                 |
| ------------------ | ---------------------------- | ---------------------------- |
| Theo từng agent    | `<workspace>/skills`         | Chỉ agent đó                 |
| Agent dự án        | `<workspace>/.agents/skills` | Chỉ agent của workspace đó   |
| Agent cá nhân      | `~/.agents/skills`           | Tất cả agent trên máy này    |
| Quản lý dùng chung | `~/.openclaw/skills`         | Tất cả agent trên máy này    |
| Thư mục bổ sung    | `skills.load.extraDirs`      | Tất cả agent trên máy này    |

## Danh sách cho phép của agent

**Vị trí** skill (độ ưu tiên) và **khả năng hiển thị** skill (agent nào có thể
dùng nó) là các kiểm soát riêng biệt. Dùng danh sách cho phép để giới hạn những
skills mà một agent thấy được, bất kể chúng được tải từ đâu.

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
  <Accordion title="Allowlist rules">
    - Bỏ qua `agents.defaults.skills` để mặc định không hạn chế tất cả skills.
    - Bỏ qua `agents.list[].skills` để kế thừa `agents.defaults.skills`.
    - Đặt `agents.list[].skills: []` để không đưa skill nào cho agent đó.
    - Danh sách `agents.list[].skills` không rỗng là tập **cuối cùng** — nó không
      hợp nhất với mặc định.
    - Danh sách cho phép hiệu lực áp dụng trên quá trình dựng prompt, phát hiện
      slash-command, đồng bộ sandbox và snapshot skill.
    - Đây không phải là ranh giới ủy quyền host shell. Nếu cùng agent đó có thể
      dùng `exec`, hãy ràng buộc shell đó riêng bằng sandboxing, cô lập OS-user,
      danh sách chặn/cho phép exec và thông tin xác thực theo từng tài nguyên.
  </Accordion>
</AccordionGroup>

## Plugins và skills

Plugins có thể đi kèm skills riêng bằng cách liệt kê các thư mục `skills` trong
`openclaw.plugin.json` (đường dẫn tương đối với gốc plugin). Plugin skills tải
khi plugin được bật — ví dụ, plugin trình duyệt đi kèm skill
`browser-automation` để điều khiển trình duyệt nhiều bước.

Các thư mục plugin skill hợp nhất ở cùng mức ưu tiên thấp như
`skills.load.extraDirs`, nên một skill trùng tên trong bản đi kèm, được quản lý,
agent hoặc workspace sẽ ghi đè chúng. Chặn chúng qua `metadata.openclaw.requires.config`
trên mục cấu hình của plugin.

Xem [Plugins](/vi/tools/plugin) và [Công cụ](/vi/tools) để biết toàn bộ hệ thống plugin.

## Skill Workshop

[Skill Workshop](/vi/tools/skill-workshop) là hàng đợi đề xuất giữa agent
và các tệp skill đang hoạt động của bạn. Khi agent phát hiện công việc có thể
tái sử dụng, nó soạn một đề xuất thay vì ghi trực tiếp vào `SKILL.md`. Bạn xem xét
và phê duyệt trước khi có bất kỳ thay đổi nào.

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Xem [Skill Workshop](/vi/tools/skill-workshop) để biết vòng đời đầy đủ, tham chiếu
CLI và cấu hình.

## Cài đặt từ ClawHub

[ClawHub](https://clawhub.ai) là registry skills công khai. Dùng các lệnh
`openclaw skills` để cài đặt và cập nhật, hoặc CLI `clawhub` để phát hành
và đồng bộ.

| Hành động                              | Lệnh                                                   |
| -------------------------------------- | ------------------------------------------------------ |
| Cài đặt skill vào workspace            | `openclaw skills install @owner/<slug>`                |
| Cài đặt từ kho Git                     | `openclaw skills install git:owner/repo@ref`           |
| Cài đặt một thư mục skill cục bộ       | `openclaw skills install ./path/to/skill --as my-tool` |
| Cài đặt cho tất cả agent cục bộ        | `openclaw skills install @owner/<slug> --global`       |
| Cập nhật tất cả skills trong workspace | `openclaw skills update --all`                         |
| Cập nhật một skill dùng chung được quản lý | `openclaw skills update @owner/<slug> --global`    |
| Cập nhật tất cả skills dùng chung được quản lý | `openclaw skills update --all --global`          |
| Xác minh trust envelope của skill      | `openclaw skills verify @owner/<slug>`                 |
| In Skill Card đã tạo                   | `openclaw skills verify @owner/<slug> --card`          |
| Phát hành / đồng bộ qua ClawHub CLI    | `clawhub sync --all`                                   |

<AccordionGroup>
  <Accordion title="Install details">
    Theo mặc định, `openclaw skills install` cài đặt vào thư mục `skills/`
    của workspace đang hoạt động. Thêm `--global` để cài đặt vào thư mục dùng chung
    `~/.openclaw/skills`, hiển thị với tất cả agent cục bộ trừ khi danh sách cho phép
    của agent thu hẹp phạm vi đó.

    Cài đặt từ Git và cục bộ kỳ vọng `SKILL.md` ở gốc nguồn. Slug đến từ
    frontmatter `name` của `SKILL.md` khi hợp lệ, rồi dự phòng về tên thư mục
    hoặc kho. Dùng `--as <slug>` để ghi đè.
    `openclaw skills update` chỉ theo dõi các bản cài ClawHub — cài đặt lại nguồn Git
    hoặc cục bộ để làm mới chúng.

  </Accordion>
  <Accordion title="Verification and security scanning">
    `openclaw skills verify @owner/<slug>` yêu cầu ClawHub cung cấp trust envelope
    `clawhub.skill.verify.v1` của skill. Skills ClawHub đã cài đặt xác minh
    dựa trên phiên bản và registry được ghi trong `.clawhub/origin.json`.
    Slug trần vẫn được chấp nhận cho skills đã cài đặt hiện có hoặc không mơ hồ,
    nhưng ref có owner giúp tránh mơ hồ về nhà phát hành.

    Các trang skill ClawHub hiển thị trạng thái quét bảo mật mới nhất trước khi cài đặt,
    với trang chi tiết cho VirusTotal, ClawScan và phân tích tĩnh. Lệnh thoát khác 0
    khi ClawHub đánh dấu xác minh là thất bại. Nhà phát hành xử lý kết quả dương tính giả
    qua bảng điều khiển ClawHub hoặc `clawhub skill rescan @owner/<slug>`.

  </Accordion>
  <Accordion title="Private archive installs">
    Gateway client cần phân phối ngoài ClawHub có thể chuẩn bị một kho lưu trữ skill dạng zip
    bằng `skills.upload.begin`, `skills.upload.chunk` và `skills.upload.commit`,
    rồi cài đặt bằng `skills.install({ source: "upload", ... })`. Đường dẫn này
    mặc định tắt và yêu cầu `skills.install.allowUploadedArchives: true` trong
    `openclaw.json`. Cài đặt ClawHub thông thường không bao giờ cần thiết lập đó.
  </Accordion>
</AccordionGroup>

## Bảo mật

<Warning>
  Xem skills bên thứ ba là **mã không đáng tin cậy**. Đọc chúng trước khi bật.
  Ưu tiên chạy trong sandbox cho đầu vào không đáng tin cậy và công cụ rủi ro. Xem
  [Sandboxing](/vi/gateway/sandboxing) để biết các kiểm soát phía agent.
</Warning>

<AccordionGroup>
  <Accordion title="Path containment">
    Phát hiện skill trong workspace, project-agent và extra-dir chỉ chấp nhận các gốc skill
    có realpath đã phân giải vẫn nằm bên trong gốc đã cấu hình, trừ khi
    `skills.load.allowSymlinkTargets` tin cậy rõ ràng một gốc đích.
    Skill Workshop chỉ ghi qua các đích đáng tin cậy đó khi bật
    `skills.workshop.allowSymlinkTargetWrites`.
    `~/.openclaw/skills` được quản lý và `~/.agents/skills` cá nhân có thể chứa
    thư mục skill được symlink, nhưng realpath của mọi `SKILL.md` vẫn phải nằm
    bên trong thư mục skill đã phân giải của nó.
  </Accordion>
  <Accordion title="Operator install policy">
    Cấu hình `security.installPolicy` để chạy một lệnh chính sách cục bộ đáng tin cậy
    trước khi tiếp tục cài đặt skill. Chính sách nhận metadata và đường dẫn nguồn đã chuẩn bị,
    áp dụng cho các đường dẫn ClawHub, uploaded, Git, local, update và dependency-installer,
    và fail closed khi lệnh không thể trả về quyết định hợp lệ.
  </Accordion>
  <Accordion title="Secret injection scope">
    `skills.entries.*.env` và `skills.entries.*.apiKey` tiêm secrets vào tiến trình
    **host** chỉ cho lượt agent đó — không vào sandbox. Giữ secrets khỏi prompt và log.
  </Accordion>
</AccordionGroup>

Để biết mô hình đe dọa rộng hơn và các checklist bảo mật, xem
[Bảo mật](/vi/gateway/security).

## Định dạng SKILL.md

Mỗi skill tối thiểu cần `name` và `description` trong frontmatter:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---

When the user asks to generate an image, use the `image_generate` tool...
```

<Note>
  OpenClaw tuân theo đặc tả [AgentSkills](https://agentskills.io). Bộ phân tích
  frontmatter chỉ hỗ trợ **khóa một dòng** — `metadata` phải là một đối tượng JSON
  một dòng. Dùng `{baseDir}` trong phần thân để tham chiếu đường dẫn thư mục skill.
</Note>

### Các khóa frontmatter tùy chọn

<ParamField path="homepage" type="string">
  URL hiển thị là "Website" trong giao diện Skills trên macOS. Cũng được hỗ trợ qua
  `metadata.openclaw.homepage`.
</ParamField>

<ParamField path="user-invocable" type="boolean" default="true">
  Khi là `true`, skill được hiển thị dưới dạng slash command mà người dùng có thể gọi.
</ParamField>

<ParamField path="disable-model-invocation" type="boolean" default="false">
  Khi là `true`, OpenClaw giữ hướng dẫn của skill khỏi prompt thông thường của agent.
  Skill vẫn có sẵn dưới dạng slash command khi `user-invocable` cũng là `true`.
</ParamField>

<ParamField path="command-dispatch" type='"tool"'>
  Khi đặt thành `tool`, slash command bỏ qua model và dispatch trực tiếp
  tới một công cụ đã đăng ký.
</ParamField>

<ParamField path="command-tool" type="string">
  Tên công cụ cần gọi khi đặt `command-dispatch: tool`.
</ParamField>

<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Để điều phối công cụ, chuyển tiếp chuỗi đối số thô đến công cụ mà không có
  phân tích cú pháp lõi. Công cụ nhận
  `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Kiểm soát điều kiện

OpenClaw lọc Skills tại thời điểm tải bằng `metadata.openclaw` (JSON một dòng
trong frontmatter). Một skill không có khối `metadata.openclaw` luôn
đủ điều kiện trừ khi bị tắt rõ ràng.

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
  Khi là `true`, luôn bao gồm skill và bỏ qua tất cả cổng kiểm soát khác.
</ParamField>

<ParamField path="emoji" type="string">
  Emoji tùy chọn hiển thị trong giao diện Skills trên macOS.
</ParamField>

<ParamField path="homepage" type="string">
  URL tùy chọn hiển thị dưới dạng "Website" trong giao diện Skills trên macOS.
</ParamField>

<ParamField path="os" type='"darwin" | "linux" | "win32"'>
  Bộ lọc nền tảng. Khi được đặt, skill chỉ đủ điều kiện trên các hệ điều hành được liệt kê.
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
  Thông số trình cài đặt tùy chọn được giao diện Skills trên macOS sử dụng (brew / node / go / uv / download).
</ParamField>

<Note>
  Các khối `metadata.clawdbot` cũ vẫn được chấp nhận khi không có
  `metadata.openclaw`, nên các skill cũ đã cài đặt vẫn giữ cổng kiểm soát
  phụ thuộc và gợi ý trình cài đặt. Skill mới nên dùng
  `metadata.openclaw`.
</Note>

### Thông số trình cài đặt

Thông số trình cài đặt cho giao diện Skills trên macOS biết cách cài đặt một phụ thuộc:

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
  <Accordion title="Installer selection rules">
    - Khi liệt kê nhiều trình cài đặt, Gateway chọn một tùy chọn ưu tiên
      (brew khi có sẵn, nếu không thì node).
    - Nếu tất cả trình cài đặt đều là `download`, OpenClaw liệt kê từng mục để bạn có thể
      xem mọi artifact có sẵn.
    - Thông số có thể bao gồm `os: ["darwin"|"linux"|"win32"]` để lọc theo nền tảng.
    - Cài đặt Node tuân theo `skills.install.nodeManager` trong `openclaw.json`
      (mặc định: npm; tùy chọn: npm / pnpm / yarn / bun). Điều này chỉ ảnh hưởng đến
      việc cài đặt skill; runtime Gateway vẫn nên là Node.
    - Ưu tiên trình cài đặt của Gateway: Homebrew → uv → trình quản lý node đã cấu hình →
      go → download.
  </Accordion>
  <Accordion title="Per-installer details">
    - **Homebrew:** OpenClaw không tự động cài đặt Homebrew hoặc chuyển đổi công thức brew
      thành lệnh gói hệ thống. Trong container Linux không có
      `brew`, các trình cài đặt chỉ dùng brew sẽ bị ẩn; hãy dùng image tùy chỉnh hoặc cài đặt
      phụ thuộc theo cách thủ công.
    - **Go:** nếu thiếu `go` và có `brew`, gateway sẽ cài đặt
      Go qua Homebrew trước và đặt `GOBIN` thành `bin` của Homebrew.
    - **Download:** `url` (bắt buộc), `archive` (`tar.gz` | `tar.bz2` | `zip`),
      `extract` (mặc định: tự động khi phát hiện archive), `stripComponents`,
      `targetDir` (mặc định: `~/.openclaw/tools/<skillKey>`).
  </Accordion>
  <Accordion title="Sandboxing notes">
    `requires.bins` được kiểm tra trên **máy chủ** tại thời điểm tải skill. Nếu một agent
    chạy trong sandbox, tệp nhị phân cũng phải tồn tại **bên trong container**.
    Cài đặt nó qua `agents.defaults.sandbox.docker.setupCommand` hoặc image tùy chỉnh.
    `setupCommand` chạy một lần sau khi tạo container và yêu cầu
    truy cập mạng đi ra, hệ thống tệp gốc có thể ghi, và người dùng root trong sandbox.
  </Accordion>
</AccordionGroup>

## Ghi đè cấu hình

Bật/tắt và cấu hình các skill đi kèm hoặc được quản lý trong `skills.entries` trong
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
  `false` tắt skill ngay cả khi skill được đi kèm hoặc đã cài đặt. Skill đi kèm `coding-agent`
  là opt-in — đặt `skills.entries.coding-agent.enabled: true`
  và đảm bảo một trong `claude`, `codex`, `opencode`, hoặc CLI được hỗ trợ khác
  đã được cài đặt và xác thực.
</ParamField>

<ParamField path="apiKey" type='string | { source, provider, id }'>
  Trường tiện ích cho các skill khai báo `metadata.openclaw.primaryEnv`.
  Hỗ trợ chuỗi văn bản thuần hoặc đối tượng SecretRef.
</ParamField>

<ParamField path="env" type="Record<string, string>">
  Biến môi trường được tiêm vào lần chạy agent. Chỉ được tiêm khi
  biến chưa được đặt trong tiến trình.
</ParamField>

<ParamField path="config" type="object">
  Túi tùy chọn cho các trường cấu hình tùy chỉnh theo từng skill.
</ParamField>

<ParamField path="allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho Skills **đi kèm**. Khi được đặt, chỉ các skill đi kèm
  trong danh sách mới đủ điều kiện. Các skill được quản lý và workspace không bị ảnh hưởng.
</ParamField>

<Note>
  Khóa cấu hình mặc định khớp với **tên skill**. Nếu một skill định nghĩa
  `metadata.openclaw.skillKey`, hãy dùng khóa đó trong `skills.entries`. Đặt tên
  có dấu gạch nối trong dấu ngoặc kép: JSON5 cho phép khóa được trích dẫn.
</Note>

## Tiêm môi trường

Khi một lần chạy agent bắt đầu, OpenClaw:

<Steps>
  <Step title="Reads skill metadata">
    OpenClaw phân giải danh sách skill hiệu lực cho agent, áp dụng các quy tắc kiểm soát điều kiện,
    danh sách cho phép, và ghi đè cấu hình.
  </Step>
  <Step title="Injects env and API keys">
    `skills.entries.<key>.env` và `skills.entries.<key>.apiKey` được áp dụng vào
    `process.env` trong suốt thời lượng của lần chạy.
  </Step>
  <Step title="Builds the system prompt">
    Các skill đủ điều kiện được biên dịch thành một khối XML gọn và được tiêm vào
    system prompt.
  </Step>
  <Step title="Restores the environment">
    Sau khi lần chạy kết thúc, môi trường ban đầu được khôi phục.
  </Step>
</Steps>

<Warning>
  Việc tiêm biến môi trường chỉ nằm trong phạm vi lần chạy agent trên **máy chủ**, không phải sandbox. Bên trong
  sandbox, `env` và `apiKey` không có hiệu lực. Xem
  [Cấu hình Skills](/vi/tools/skills-config#sandboxed-skills-and-env-vars) để biết cách
  truyền bí mật vào các lần chạy trong sandbox.
</Warning>

Đối với backend `claude-cli` đi kèm, OpenClaw cũng hiện thực hóa cùng
snapshot skill đủ điều kiện dưới dạng Plugin Claude Code tạm thời và truyền nó qua
`--plugin-dir`. Các backend CLI khác chỉ dùng danh mục prompt.

## Snapshot và làm mới

OpenClaw chụp snapshot các skill đủ điều kiện **khi một phiên bắt đầu** và tái sử dụng
danh sách đó cho mọi lượt tiếp theo trong phiên. Thay đổi đối với skill hoặc cấu hình có
hiệu lực ở phiên mới tiếp theo.

Skills làm mới giữa phiên trong hai trường hợp:

- Trình theo dõi Skills phát hiện thay đổi `SKILL.md`.
- Một node từ xa mới đủ điều kiện kết nối.

Danh sách đã làm mới được dùng ở lượt agent tiếp theo. Nếu danh sách cho phép hiệu lực của agent
thay đổi, OpenClaw làm mới snapshot để giữ các skill hiển thị
đồng bộ.

<AccordionGroup>
  <Accordion title="Skills watcher">
    Theo mặc định, OpenClaw theo dõi thư mục skill và tăng phiên bản snapshot khi
    các tệp `SKILL.md` thay đổi. Cấu hình trong `skills.load`:

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

    Dùng `allowSymlinkTargets` cho các bố cục symlink có chủ ý, nơi symlink gốc skill
    trỏ ra ngoài gốc đã cấu hình, ví dụ
    `<workspace>/skills/manager -> ~/Projects/manager/skills`.
    Chỉ bật `skills.workshop.allowSymlinkTargetWrites` khi Skill Workshop
    cũng nên áp dụng đề xuất qua các đường dẫn symlink đáng tin cậy đó.

  </Accordion>
  <Accordion title="Remote macOS nodes (Linux gateway)">
    Nếu Gateway chạy trên Linux nhưng có **node macOS** được kết nối với
    `system.run` được cho phép, OpenClaw có thể coi các skill chỉ dành cho macOS là đủ điều kiện khi
    các tệp nhị phân bắt buộc có trên node đó. Agent nên chạy các
    skill đó qua công cụ `exec` với `host=node`.

    Các node ngoại tuyến **không** làm cho skill chỉ từ xa hiển thị. Nếu một node ngừng
    trả lời các truy vấn bin, OpenClaw xóa các kết quả khớp bin đã lưu trong bộ nhớ đệm của node đó.

  </Accordion>
</AccordionGroup>

## Tác động token

Khi Skills đủ điều kiện, OpenClaw tiêm một khối XML gọn vào system
prompt. Chi phí là xác định:

```text
total = 195 + Σ (97 + len(name) + len(description) + len(filepath))
```

- **Chi phí nền** (chỉ khi ≥ 1 skill): ~195 ký tự
- **Mỗi skill:** ~97 ký tự + độ dài các trường `name`, `description`, và `location` của bạn
- Escape XML mở rộng `& < > " '` thành entity, thêm vài ký tự cho mỗi lần xuất hiện
- Với ~4 ký tự/token, 97 ký tự ≈ 24 token mỗi skill trước độ dài trường

Giữ mô tả ngắn và giàu thông tin để giảm thiểu chi phí prompt.

## Liên quan

<CardGroup cols={2}>
  <Card title="Creating skills" href="/vi/tools/creating-skills" icon="hammer">
    Hướng dẫn từng bước để tạo skill tùy chỉnh.
  </Card>
  <Card title="Skill Workshop" href="/vi/tools/skill-workshop" icon="flask">
    Hàng đợi đề xuất cho các skill do agent phác thảo.
  </Card>
  <Card title="Skills config" href="/vi/tools/skills-config" icon="gear">
    Lược đồ cấu hình đầy đủ `skills.*` và danh sách cho phép của agent.
  </Card>
  <Card title="Slash commands" href="/vi/tools/slash-commands" icon="terminal">
    Cách đăng ký và định tuyến slash command của skill.
  </Card>
  <Card title="ClawHub" href="/vi/clawhub" icon="cloud">
    Duyệt và xuất bản Skills trên registry công khai.
  </Card>
  <Card title="Plugins" href="/vi/tools/plugin" icon="plug">
    Plugins có thể gửi kèm Skills cùng với các công cụ mà chúng ghi tài liệu.
  </Card>
</CardGroup>
