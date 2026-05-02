---
read_when:
    - Thêm hoặc sửa đổi Skills
    - Thay đổi cơ chế kiểm soát skill, danh sách cho phép hoặc quy tắc tải
    - Tìm hiểu thứ tự ưu tiên của Skills và hành vi ảnh chụp nhanh
sidebarTitle: Skills
summary: 'Skills: được quản lý so với không gian làm việc, quy tắc kiểm soát, danh sách cho phép tác nhân và liên kết cấu hình'
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:58:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85d9a5305216abd277721a9cf46404505ac6bedcad78417e10862bf7f54591ea
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw sử dụng các thư mục kỹ năng **tương thích với [AgentSkills](https://agentskills.io)** để dạy agent cách dùng công cụ. Mỗi kỹ năng là một thư mục chứa `SKILL.md` với YAML frontmatter và hướng dẫn. OpenClaw tải các kỹ năng đi kèm cùng các ghi đè cục bộ tùy chọn, rồi lọc chúng tại thời điểm tải dựa trên môi trường, cấu hình và sự hiện diện của binary.

## Vị trí và thứ tự ưu tiên

OpenClaw tải kỹ năng từ các nguồn này, **ưu tiên cao nhất trước**:

| #   | Nguồn                 | Đường dẫn                       |
| --- | --------------------- | -------------------------------- |
| 1   | Kỹ năng workspace     | `<workspace>/skills`             |
| 2   | Kỹ năng agent dự án   | `<workspace>/.agents/skills`     |
| 3   | Kỹ năng agent cá nhân | `~/.agents/skills`               |
| 4   | Kỹ năng được quản lý/cục bộ | `~/.openclaw/skills`       |
| 5   | Kỹ năng đi kèm        | được đóng gói cùng bản cài đặt   |
| 6   | Thư mục kỹ năng bổ sung | `skills.load.extraDirs` (config) |

Nếu tên kỹ năng xung đột, nguồn có thứ tự ưu tiên cao nhất sẽ thắng.

Thư mục `$CODEX_HOME/skills` gốc của Codex CLI không phải là một trong các gốc kỹ năng của OpenClaw. Ở chế độ harness Codex, các lần khởi chạy app-server cục bộ dùng những Codex home biệt lập theo từng agent, nên kỹ năng Codex CLI cá nhân không được tải ngầm định. Dùng `openclaw migrate codex --dry-run` để kiểm kê chúng và `openclaw migrate codex` để chọn thư mục kỹ năng bằng prompt checkbox tương tác trước khi sao chép chúng vào workspace agent OpenClaw hiện tại. Với các lần chạy không tương tác, lặp lại `--skill <name>` cho đúng các kỹ năng cần sao chép.

## Kỹ năng theo agent và kỹ năng dùng chung

Trong các thiết lập **multi-agent**, mỗi agent có workspace riêng:

| Phạm vi              | Đường dẫn                                  | Hiển thị với                 |
| -------------------- | ------------------------------------------- | --------------------------- |
| Theo agent           | `<workspace>/skills`                        | Chỉ agent đó                |
| Agent dự án          | `<workspace>/.agents/skills`                | Chỉ agent của workspace đó  |
| Agent cá nhân        | `~/.agents/skills`                          | Tất cả agent trên máy đó    |
| Dùng chung được quản lý/cục bộ | `~/.openclaw/skills`              | Tất cả agent trên máy đó    |
| Thư mục bổ sung dùng chung | `skills.load.extraDirs` (ưu tiên thấp nhất) | Tất cả agent trên máy đó |

Cùng tên ở nhiều nơi → nguồn có thứ tự ưu tiên cao nhất sẽ thắng. Workspace thắng project-agent, thắng personal-agent, thắng managed/local, thắng bundled, thắng extra dirs.

## Danh sách cho phép kỹ năng của agent

**Vị trí** kỹ năng và **khả năng hiển thị** kỹ năng là các điều khiển riêng biệt. Vị trí/thứ tự ưu tiên quyết định bản sao nào của kỹ năng trùng tên sẽ thắng; danh sách cho phép của agent quyết định agent thực sự có thể dùng kỹ năng nào.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Allowlist rules">
    - Bỏ qua `agents.defaults.skills` để mặc định không hạn chế kỹ năng.
    - Bỏ qua `agents.list[].skills` để kế thừa `agents.defaults.skills`.
    - Đặt `agents.list[].skills: []` để không có kỹ năng nào.
    - Danh sách `agents.list[].skills` không rỗng là tập hợp **cuối cùng** cho agent đó — nó không hợp nhất với mặc định.
    - Danh sách cho phép hiệu lực áp dụng trên toàn bộ quá trình dựng prompt, khám phá lệnh slash của kỹ năng, đồng bộ sandbox và snapshot kỹ năng.
  </Accordion>
</AccordionGroup>

## Plugin và kỹ năng

Plugin có thể đóng gói kỹ năng riêng bằng cách liệt kê các thư mục `skills` trong `openclaw.plugin.json` (đường dẫn tương đối với gốc plugin). Kỹ năng của Plugin được tải khi Plugin được bật. Đây là nơi phù hợp cho các hướng dẫn vận hành theo công cụ quá dài để đưa vào mô tả công cụ nhưng nên có sẵn bất cứ khi nào Plugin được cài đặt — ví dụ, Plugin trình duyệt đóng gói kỹ năng `browser-automation` cho điều khiển trình duyệt nhiều bước.

Thư mục kỹ năng của Plugin được hợp nhất vào cùng đường dẫn ưu tiên thấp như `skills.load.extraDirs`, nên kỹ năng đi kèm, được quản lý, agent hoặc workspace cùng tên sẽ ghi đè chúng. Bạn có thể kiểm soát chúng qua `metadata.openclaw.requires.config` trên mục cấu hình của Plugin.

Xem [Plugin](/vi/tools/plugin) để biết khám phá/cấu hình và [Công cụ](/vi/tools) để biết bề mặt công cụ mà các kỹ năng đó hướng dẫn.

## Skill Workshop

Plugin **Skill Workshop** tùy chọn, thử nghiệm có thể tạo hoặc cập nhật kỹ năng workspace từ các quy trình có thể tái sử dụng được quan sát trong quá trình agent làm việc. Plugin này bị tắt theo mặc định và phải được bật rõ ràng qua `plugins.entries.skill-workshop`.

Skill Workshop chỉ ghi vào `<workspace>/skills`, quét nội dung được tạo, hỗ trợ chờ phê duyệt hoặc tự động ghi an toàn, cách ly các đề xuất không an toàn, và làm mới snapshot kỹ năng sau khi ghi thành công để kỹ năng mới trở nên khả dụng mà không cần khởi động lại Gateway.

Dùng nó cho các chỉnh sửa như _"lần sau, xác minh ghi nhận nguồn GIF"_ hoặc các quy trình khó đúc kết như checklist QA phương tiện. Bắt đầu bằng chờ phê duyệt; chỉ dùng ghi tự động trong các workspace đáng tin cậy sau khi xem xét đề xuất của nó. Hướng dẫn đầy đủ: [Plugin Skill Workshop](/vi/plugins/skill-workshop).

## ClawHub (cài đặt và đồng bộ)

[ClawHub](https://clawhub.ai) là registry kỹ năng công khai cho OpenClaw. Dùng các lệnh `openclaw skills` gốc để khám phá/cài đặt/cập nhật, hoặc CLI `clawhub` riêng cho quy trình xuất bản/đồng bộ. Hướng dẫn đầy đủ: [ClawHub](/vi/tools/clawhub).

| Hành động                          | Lệnh                                   |
| ---------------------------------- | -------------------------------------- |
| Cài đặt kỹ năng vào workspace      | `openclaw skills install <skill-slug>` |
| Cập nhật tất cả kỹ năng đã cài đặt | `openclaw skills update --all`         |
| Đồng bộ (quét + xuất bản cập nhật) | `clawhub sync --all`                   |

Lệnh `openclaw skills install` gốc cài đặt vào thư mục `skills/` của workspace đang hoạt động. CLI `clawhub` riêng cũng cài đặt vào `./skills` trong thư mục làm việc hiện tại của bạn (hoặc fallback về workspace OpenClaw đã cấu hình). OpenClaw nhận diện mục đó dưới dạng `<workspace>/skills` ở phiên tiếp theo. Các gốc kỹ năng đã cấu hình cũng hỗ trợ một cấp nhóm, chẳng hạn `skills/<group>/<skill>/SKILL.md`, để các kỹ năng bên thứ ba liên quan có thể được giữ trong một thư mục dùng chung mà không cần quét đệ quy rộng.

Các trang kỹ năng ClawHub hiển thị trạng thái quét bảo mật mới nhất trước khi cài đặt, với các trang chi tiết trình quét cho VirusTotal, ClawScan và phân tích tĩnh. `openclaw skills install <slug>` vẫn chỉ là đường dẫn cài đặt; nhà xuất bản xử lý kết quả dương tính giả qua dashboard ClawHub hoặc `clawhub skill rescan <slug>`.

## Bảo mật

<Warning>
Xem kỹ năng bên thứ ba là **mã không đáng tin cậy**. Đọc chúng trước khi bật. Ưu tiên các lần chạy sandbox cho đầu vào không đáng tin cậy và công cụ rủi ro. Xem [Sandboxing](/vi/gateway/sandboxing) để biết các điều khiển phía agent.
</Warning>

- Khám phá kỹ năng workspace và extra-dir chỉ chấp nhận các gốc kỹ năng và tệp `SKILL.md` có realpath đã phân giải vẫn nằm bên trong gốc đã cấu hình.
- Các lần cài đặt phụ thuộc kỹ năng do Gateway hỗ trợ (`skills.install`, onboarding và UI cài đặt Skills) chạy trình quét mã nguy hiểm tích hợp trước khi thực thi metadata trình cài đặt. Các phát hiện `critical` bị chặn theo mặc định trừ khi caller đặt rõ ghi đè nguy hiểm; các phát hiện đáng ngờ vẫn chỉ cảnh báo.
- `openclaw skills install <slug>` thì khác — nó tải một thư mục kỹ năng ClawHub vào workspace và không dùng đường dẫn metadata trình cài đặt ở trên.
- `skills.entries.*.env` và `skills.entries.*.apiKey` tiêm secret vào tiến trình **host** cho lượt agent đó (không phải sandbox). Giữ secret khỏi prompt và log.

Để biết mô hình mối đe dọa và checklist rộng hơn, xem [Bảo mật](/vi/gateway/security).

## Định dạng SKILL.md

`SKILL.md` phải bao gồm tối thiểu:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw tuân theo đặc tả AgentSkills về bố cục/mục đích. Bộ phân tích cú pháp được agent nhúng dùng chỉ hỗ trợ các khóa frontmatter **một dòng**; `metadata` nên là **đối tượng JSON một dòng**. Dùng `{baseDir}` trong hướng dẫn để tham chiếu đường dẫn thư mục kỹ năng.

### Khóa frontmatter tùy chọn

<ParamField path="homepage" type="string">
  URL hiển thị dưới dạng "Website" trong UI Skills của macOS. Cũng được hỗ trợ qua `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Khi là `true`, kỹ năng được hiển thị dưới dạng lệnh slash của người dùng.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Khi là `true`, OpenClaw giữ hướng dẫn của kỹ năng khỏi prompt thông thường của agent. Kỹ năng vẫn được cài đặt và vẫn có thể chạy rõ ràng dưới dạng lệnh slash khi `user-invocable` cũng là `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Khi đặt thành `tool`, lệnh slash bỏ qua model và dispatch trực tiếp tới một công cụ.
</ParamField>
<ParamField path="command-tool" type="string">
  Tên công cụ cần gọi khi `command-dispatch: tool` được đặt.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Với tool dispatch, chuyển tiếp chuỗi đối số thô tới công cụ (không phân tích cú pháp trong core). Công cụ được gọi với `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Kiểm soát (bộ lọc thời điểm tải)

OpenClaw lọc kỹ năng tại thời điểm tải bằng `metadata` (JSON một dòng):

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

Các trường dưới `metadata.openclaw`:

<ParamField path="always" type="boolean">
  Khi là `true`, luôn bao gồm kỹ năng (bỏ qua các cổng khác).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji tùy chọn được UI Skills của macOS dùng.
</ParamField>
<ParamField path="homepage" type="string">
  URL tùy chọn hiển thị dưới dạng "Website" trong UI Skills của macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Danh sách nền tảng tùy chọn. Nếu được đặt, kỹ năng chỉ đủ điều kiện trên các OS đó.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Mỗi mục phải tồn tại trên `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Ít nhất một mục phải tồn tại trên `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Env var phải tồn tại hoặc được cung cấp trong config.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Danh sách đường dẫn `openclaw.json` phải có giá trị truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Tên env var liên kết với `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Đặc tả trình cài đặt tùy chọn được UI Skills của macOS dùng (brew/node/go/uv/download).
</ParamField>

Nếu không có `metadata.openclaw`, kỹ năng luôn đủ điều kiện (trừ khi bị tắt trong config hoặc bị chặn bởi `skills.allowBundled` đối với kỹ năng đi kèm).

<Note>
Các khối `metadata.clawdbot` legacy vẫn được chấp nhận khi không có `metadata.openclaw`, để các kỹ năng cũ đã cài đặt giữ nguyên cổng phụ thuộc và gợi ý trình cài đặt của chúng. Kỹ năng mới và được cập nhật nên dùng `metadata.openclaw`.
</Note>

### Ghi chú về sandboxing

- `requires.bins` được kiểm tra trên **host** tại thời điểm tải kỹ năng.
- Nếu agent chạy trong sandbox, binary cũng phải tồn tại **bên trong container**. Cài đặt nó qua `agents.defaults.sandbox.docker.setupCommand` (hoặc image tùy chỉnh). `setupCommand` chạy một lần sau khi container được tạo. Việc cài đặt package cũng yêu cầu network egress, root FS có thể ghi và user root trong sandbox.
- Ví dụ: kỹ năng `summarize` (`skills/summarize/SKILL.md`) cần CLI `summarize` trong sandbox container để chạy ở đó.

### Thông số trình cài đặt

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
    - Nếu có nhiều trình cài đặt được liệt kê, gateway chọn một tùy chọn ưu tiên duy nhất (brew khi có sẵn, nếu không thì node).
    - Nếu tất cả trình cài đặt đều là `download`, OpenClaw liệt kê từng mục để bạn có thể xem các hiện vật có sẵn.
    - Thông số trình cài đặt có thể bao gồm `os: ["darwin"|"linux"|"win32"]` để lọc tùy chọn theo nền tảng.
    - Các bản cài đặt Node tuân theo `skills.install.nodeManager` trong `openclaw.json` (mặc định: npm; tùy chọn: npm/pnpm/yarn/bun). Điều này chỉ ảnh hưởng đến cài đặt skill; runtime của Gateway vẫn nên là Node — không khuyến nghị Bun cho WhatsApp/Telegram.
    - Lựa chọn trình cài đặt do Gateway hỗ trợ được điều khiển theo ưu tiên: khi thông số cài đặt trộn nhiều loại, OpenClaw ưu tiên Homebrew khi `skills.install.preferBrew` được bật và có `brew`, sau đó là `uv`, rồi trình quản lý node đã cấu hình, rồi các phương án dự phòng khác như `go` hoặc `download`.
    - Nếu mọi thông số cài đặt đều là `download`, OpenClaw hiển thị tất cả tùy chọn tải xuống thay vì gộp về một trình cài đặt ưu tiên.

  </Accordion>
  <Accordion title="Chi tiết theo từng trình cài đặt">
    - **Cài đặt Go:** nếu thiếu `go` và có `brew`, gateway sẽ cài Go qua Homebrew trước và đặt `GOBIN` thành `bin` của Homebrew khi có thể.
    - **Cài đặt tải xuống:** `url` (bắt buộc), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (mặc định: tự động khi phát hiện kho lưu trữ), `stripComponents`, `targetDir` (mặc định: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Ghi đè cấu hình

Các skill đi kèm và được quản lý có thể được bật/tắt và cung cấp giá trị env
trong `skills.entries` tại `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
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
  `false` vô hiệu hóa skill ngay cả khi skill đó được đi kèm hoặc đã cài đặt.
  Skill `coding-agent` đi kèm là tùy chọn tham gia: đặt
  `skills.entries.coding-agent.enabled: true` trước khi hiển thị skill đó cho agent,
  rồi đảm bảo một trong các CLI `claude`, `codex`, `opencode`, hoặc `pi` đã được cài đặt và
  xác thực cho CLI riêng của nó.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Tiện ích cho các skill khai báo `metadata.openclaw.primaryEnv`. Hỗ trợ văn bản thuần hoặc SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Chỉ được chèn nếu biến chưa được đặt trong tiến trình.
</ParamField>
<ParamField path="config" type="object">
  Túi tùy chọn cho các trường tùy chỉnh theo từng skill. Khóa tùy chỉnh phải nằm ở đây.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho các skill **đi kèm**. Nếu được đặt, chỉ các skill đi kèm trong danh sách mới đủ điều kiện (skill được quản lý/không gian làm việc không bị ảnh hưởng).
</ParamField>

Nếu tên skill chứa dấu gạch nối, hãy đặt khóa trong dấu ngoặc kép (JSON5 cho phép
khóa có dấu ngoặc kép). Khóa cấu hình mặc định khớp với **tên skill** — nếu một skill
định nghĩa `metadata.openclaw.skillKey`, hãy dùng khóa đó trong `skills.entries`.

<Note>
Để tạo/chỉnh sửa hình ảnh có sẵn trong OpenClaw, hãy dùng công cụ lõi
`image_generate` với `agents.defaults.imageGenerationModel` thay vì
một skill đi kèm. Các ví dụ skill ở đây dành cho quy trình tùy chỉnh hoặc của bên thứ ba.
Để phân tích hình ảnh gốc, hãy dùng công cụ `image` với
`agents.defaults.imageModel`. Nếu bạn chọn `openai/*`, `google/*`,
`fal/*`, hoặc một mô hình hình ảnh theo nhà cung cấp khác, hãy thêm khóa
xác thực/API của nhà cung cấp đó.
</Note>

## Chèn môi trường

Khi một lượt chạy agent bắt đầu, OpenClaw:

1. Đọc siêu dữ liệu skill.
2. Áp dụng `skills.entries.<key>.env` và `skills.entries.<key>.apiKey` vào `process.env`.
3. Xây dựng system prompt với các skill **đủ điều kiện**.
4. Khôi phục môi trường ban đầu sau khi lượt chạy kết thúc.

Việc chèn môi trường được **giới hạn trong lượt chạy agent**, không phải môi trường shell
toàn cục.

Đối với backend `claude-cli` đi kèm, OpenClaw cũng hiện thực hóa cùng một
snapshot đủ điều kiện dưới dạng plugin Claude Code tạm thời và truyền nó bằng
`--plugin-dir`. Claude Code sau đó có thể dùng trình phân giải skill gốc của nó trong khi
OpenClaw vẫn sở hữu thứ tự ưu tiên, danh sách cho phép theo agent, cổng kiểm soát và
chèn env/khóa API `skills.entries.*`. Các backend CLI khác chỉ dùng
danh mục prompt.

## Snapshot và làm mới

OpenClaw chụp snapshot các skill đủ điều kiện **khi một phiên bắt đầu** và
tái sử dụng danh sách đó cho các lượt tiếp theo trong cùng phiên. Thay đổi đối với
skill hoặc cấu hình có hiệu lực ở phiên mới tiếp theo.

Skills có thể làm mới giữa phiên trong hai trường hợp:

- Trình theo dõi skill được bật.
- Một node từ xa đủ điều kiện mới xuất hiện.

Hãy xem đây như một cơ chế **tải lại nóng**: danh sách đã làm mới sẽ được dùng ở
lượt agent tiếp theo. Nếu danh sách cho phép skill hiệu lực của agent thay đổi cho
phiên đó, OpenClaw làm mới snapshot để các skill hiển thị luôn khớp
với agent hiện tại.

### Trình theo dõi Skills

Theo mặc định, OpenClaw theo dõi các thư mục skill và tăng snapshot skill
khi các tệp `SKILL.md` thay đổi. Cấu hình trong `skills.load`:

```json5
{
  skills: {
    load: {
      watch: true,
      watchDebounceMs: 250,
    },
  },
}
```

### Node macOS từ xa (gateway Linux)

Nếu Gateway chạy trên Linux nhưng một **node macOS** được kết nối với
`system.run` được cho phép (bảo mật phê duyệt Exec không được đặt thành `deny`),
OpenClaw có thể xem các skill chỉ dành cho macOS là đủ điều kiện khi các
binary bắt buộc có trên node đó. Agent nên thực thi các skill đó
qua công cụ `exec` với `host=node`.

Điều này dựa vào việc node báo cáo khả năng hỗ trợ lệnh và vào phép dò bin
qua `system.which` hoặc `system.run`. Các node ngoại tuyến **không** làm cho
skill chỉ từ xa hiển thị. Nếu một node đã kết nối ngừng trả lời các phép dò bin,
OpenClaw xóa các kết quả khớp bin đã lưu trong bộ nhớ đệm để agent không còn thấy
các skill hiện không thể chạy ở đó.

## Tác động token

Khi các skill đủ điều kiện, OpenClaw chèn một danh sách XML nhỏ gọn gồm các
skill có sẵn vào system prompt (qua `formatSkillsForPrompt` trong
`pi-coding-agent`). Chi phí là xác định:

- **Phần chi phí cơ sở** (chỉ khi có ≥1 skill): 195 ký tự.
- **Mỗi skill:** 97 ký tự + độ dài của các giá trị `<name>`, `<description>` và `<location>` đã được thoát XML.

Công thức (ký tự):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Thoát XML mở rộng `& < > " '` thành các thực thể (`&amp;`, `&lt;`, v.v.),
làm tăng độ dài. Số lượng token thay đổi tùy tokenizer của mô hình. Ước tính kiểu
OpenAI sơ bộ là ~4 ký tự/token, vì vậy **97 ký tự ≈ 24 token** cho mỗi
skill cộng với độ dài trường thực tế của bạn.

## Vòng đời skill được quản lý

OpenClaw cung cấp một bộ skill cơ sở dưới dạng **skill đi kèm** cùng với
bản cài đặt (gói npm hoặc OpenClaw.app). `~/.openclaw/skills` tồn tại cho
các ghi đè cục bộ — ví dụ: ghim hoặc vá một skill mà không
thay đổi bản sao đi kèm. Skill trong không gian làm việc do người dùng sở hữu và ghi đè
cả hai khi xung đột tên.

## Tìm thêm skill?

Duyệt [https://clawhub.ai](https://clawhub.ai). Schema cấu hình đầy đủ:
[Cấu hình Skills](/vi/tools/skills-config).

## Liên quan

- [ClawHub](/vi/tools/clawhub) — registry skill công khai
- [Tạo skill](/vi/tools/creating-skills) — xây dựng skill tùy chỉnh
- [Plugins](/vi/tools/plugin) — tổng quan hệ thống plugin
- [Plugin Skill Workshop](/vi/plugins/skill-workshop) — tạo skill từ công việc của agent
- [Cấu hình Skills](/vi/tools/skills-config) — tài liệu tham khảo cấu hình skill
- [Lệnh gạch chéo](/vi/tools/slash-commands) — tất cả lệnh gạch chéo có sẵn
