---
read_when:
    - Thêm hoặc sửa đổi Skills
    - Thay đổi cơ chế kiểm soát Skills, danh sách cho phép hoặc quy tắc tải
    - Tìm hiểu thứ tự ưu tiên của Skills và hành vi ảnh chụp nhanh
sidebarTitle: Skills
summary: 'Skills: được quản lý so với không gian làm việc, quy tắc kiểm soát, danh sách cho phép tác nhân và đấu nối cấu hình'
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:40:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d7dd17f52119bf0a0bb197025070abb68f7667a7d22c3d5fa6ef2f666110a45a
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw sử dụng các thư mục kỹ năng **tương thích với [AgentSkills](https://agentskills.io)** để dạy agent cách sử dụng công cụ. Mỗi kỹ năng là một thư mục chứa `SKILL.md` với YAML frontmatter và hướng dẫn. OpenClaw tải các kỹ năng đi kèm cùng các ghi đè cục bộ tùy chọn, rồi lọc chúng tại thời điểm tải dựa trên môi trường, cấu hình và sự hiện diện của binary.

## Vị trí và thứ tự ưu tiên

OpenClaw tải kỹ năng từ các nguồn này, **ưu tiên cao nhất trước**:

| #   | Nguồn                 | Đường dẫn                       |
| --- | --------------------- | -------------------------------- |
| 1   | Kỹ năng workspace     | `<workspace>/skills`             |
| 2   | Kỹ năng agent dự án   | `<workspace>/.agents/skills`     |
| 3   | Kỹ năng agent cá nhân | `~/.agents/skills`               |
| 4   | Kỹ năng quản lý/cục bộ | `~/.openclaw/skills`             |
| 5   | Kỹ năng đi kèm        | đi kèm với bản cài đặt           |
| 6   | Thư mục kỹ năng bổ sung | `skills.load.extraDirs` (cấu hình) |

Nếu tên kỹ năng xung đột, nguồn có ưu tiên cao nhất sẽ thắng.

## Kỹ năng riêng từng agent và kỹ năng dùng chung

Trong các thiết lập **multi-agent**, mỗi agent có workspace riêng:

| Phạm vi              | Đường dẫn                                  | Hiển thị với                 |
| -------------------- | ------------------------------------------- | --------------------------- |
| Riêng từng agent     | `<workspace>/skills`                        | Chỉ agent đó                |
| Agent dự án          | `<workspace>/.agents/skills`                | Chỉ agent của workspace đó  |
| Agent cá nhân        | `~/.agents/skills`                          | Tất cả agent trên máy đó    |
| Dùng chung quản lý/cục bộ | `~/.openclaw/skills`                   | Tất cả agent trên máy đó    |
| Thư mục bổ sung dùng chung | `skills.load.extraDirs` (ưu tiên thấp nhất) | Tất cả agent trên máy đó |

Cùng tên ở nhiều nơi → nguồn có ưu tiên cao nhất sẽ thắng. Workspace thắng
agent dự án, thắng agent cá nhân, thắng quản lý/cục bộ, thắng đi kèm,
thắng thư mục bổ sung.

## Danh sách cho phép kỹ năng của agent

**Vị trí** kỹ năng và **khả năng hiển thị** kỹ năng là hai điều khiển riêng biệt.
Vị trí/thứ tự ưu tiên quyết định bản sao nào của kỹ năng cùng tên sẽ thắng; danh sách
cho phép của agent quyết định agent thực sự có thể dùng kỹ năng nào.

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
  <Accordion title="Quy tắc danh sách cho phép">
    - Bỏ qua `agents.defaults.skills` để mặc định không giới hạn kỹ năng.
    - Bỏ qua `agents.list[].skills` để kế thừa `agents.defaults.skills`.
    - Đặt `agents.list[].skills: []` để không có kỹ năng nào.
    - Danh sách `agents.list[].skills` không rỗng là tập **cuối cùng** cho agent đó — danh sách này không hợp nhất với mặc định.
    - Danh sách cho phép hiệu lực áp dụng trên việc dựng prompt, khám phá slash-command kỹ năng, đồng bộ sandbox và snapshot kỹ năng.

  </Accordion>
</AccordionGroup>

## Plugin và kỹ năng

Plugin có thể đi kèm kỹ năng riêng bằng cách liệt kê các thư mục `skills` trong
`openclaw.plugin.json` (đường dẫn tương đối với gốc Plugin). Kỹ năng Plugin
được tải khi Plugin được bật. Đây là nơi phù hợp cho các hướng dẫn vận hành
theo công cụ quá dài so với mô tả công cụ nhưng cần có sẵn bất cứ khi nào
Plugin được cài đặt — ví dụ, Plugin trình duyệt đi kèm một kỹ năng
`browser-automation` cho điều khiển trình duyệt nhiều bước.

Thư mục kỹ năng Plugin được hợp nhất vào cùng đường dẫn ưu tiên thấp như
`skills.load.extraDirs`, nên kỹ năng đi kèm, được quản lý, của agent hoặc
workspace có cùng tên sẽ ghi đè chúng. Bạn có thể chặn theo điều kiện bằng
`metadata.openclaw.requires.config` trên mục cấu hình của Plugin.

Xem [Plugin](/vi/tools/plugin) để biết khám phá/cấu hình và [Công cụ](/vi/tools) để biết
bề mặt công cụ mà các kỹ năng đó hướng dẫn.

## Skill Workshop

Plugin **Skill Workshop** tùy chọn, thử nghiệm có thể tạo hoặc cập nhật
kỹ năng workspace từ các quy trình tái sử dụng được quan sát trong quá trình agent làm việc. Plugin này
bị tắt theo mặc định và phải được bật rõ ràng qua
`plugins.entries.skill-workshop`.

Skill Workshop chỉ ghi vào `<workspace>/skills`, quét nội dung đã tạo,
hỗ trợ phê duyệt chờ xử lý hoặc ghi an toàn tự động, cách ly các đề xuất
không an toàn và làm mới snapshot kỹ năng sau khi ghi thành công để kỹ năng mới
khả dụng mà không cần khởi động lại Gateway.

Dùng nó cho các sửa chữa như _"lần sau, xác minh ghi công GIF"_ hoặc
các quy trình rút ra từ kinh nghiệm như danh sách kiểm tra QA phương tiện. Bắt đầu với phê duyệt chờ xử lý;
chỉ dùng ghi tự động trong workspace đáng tin cậy sau khi xem xét
các đề xuất của nó. Hướng dẫn đầy đủ: [Plugin Skill Workshop](/vi/plugins/skill-workshop).

## ClawHub (cài đặt và đồng bộ)

[ClawHub](https://clawhub.ai) là registry kỹ năng công khai cho OpenClaw.
Dùng các lệnh `openclaw skills` gốc để khám phá/cài đặt/cập nhật, hoặc
CLI `clawhub` riêng cho quy trình xuất bản/đồng bộ. Hướng dẫn đầy đủ:
[ClawHub](/vi/tools/clawhub).

| Hành động                          | Lệnh                                   |
| ---------------------------------- | -------------------------------------- |
| Cài đặt kỹ năng vào workspace      | `openclaw skills install <skill-slug>` |
| Cập nhật tất cả kỹ năng đã cài đặt | `openclaw skills update --all`         |
| Đồng bộ (quét + xuất bản cập nhật) | `clawhub sync --all`                   |

`openclaw skills install` gốc cài đặt vào thư mục `skills/` của workspace
đang hoạt động. CLI `clawhub` riêng cũng cài đặt vào `./skills` trong thư mục
làm việc hiện tại của bạn (hoặc dự phòng về workspace OpenClaw đã cấu hình).
OpenClaw nhận phần đó dưới dạng `<workspace>/skills` trong phiên tiếp theo.
Các gốc kỹ năng đã cấu hình cũng hỗ trợ một cấp nhóm, chẳng hạn như
`skills/<group>/<skill>/SKILL.md`, để các kỹ năng bên thứ ba liên quan có thể
được giữ trong một thư mục chung mà không cần quét đệ quy rộng.

Các trang kỹ năng ClawHub hiển thị trạng thái quét bảo mật mới nhất trước khi cài đặt,
với các trang chi tiết bộ quét cho VirusTotal, ClawScan và phân tích tĩnh.
`openclaw skills install <slug>` vẫn chỉ là đường dẫn cài đặt; nhà xuất bản
khôi phục dương tính giả qua dashboard ClawHub hoặc
`clawhub skill rescan <slug>`.

## Bảo mật

<Warning>
Hãy xem kỹ năng bên thứ ba là **mã không đáng tin cậy**. Đọc chúng trước khi bật.
Ưu tiên chạy trong sandbox cho đầu vào không đáng tin cậy và công cụ rủi ro. Xem
[Sandboxing](/vi/gateway/sandboxing) để biết các điều khiển phía agent.
</Warning>

- Khám phá kỹ năng workspace và thư mục bổ sung chỉ chấp nhận gốc kỹ năng và tệp `SKILL.md` có realpath đã phân giải vẫn nằm trong gốc đã cấu hình.
- Cài đặt phụ thuộc kỹ năng do Gateway hỗ trợ (`skills.install`, onboarding và giao diện cài đặt Skills) chạy bộ quét mã nguy hiểm tích hợp sẵn trước khi thực thi metadata trình cài đặt. Phát hiện `critical` mặc định sẽ chặn trừ khi bên gọi đặt rõ ghi đè nguy hiểm; các phát hiện đáng ngờ vẫn chỉ cảnh báo.
- `openclaw skills install <slug>` thì khác — lệnh này tải một thư mục kỹ năng ClawHub vào workspace và không dùng đường dẫn metadata trình cài đặt ở trên.
- `skills.entries.*.env` và `skills.entries.*.apiKey` tiêm bí mật vào tiến trình **host** cho lượt agent đó (không phải sandbox). Giữ bí mật khỏi prompt và log.

Để có mô hình đe dọa và danh sách kiểm tra rộng hơn, xem [Bảo mật](/vi/gateway/security).

## Định dạng SKILL.md

`SKILL.md` phải bao gồm ít nhất:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw tuân theo đặc tả AgentSkills về bố cục/mục đích. Trình phân tích cú pháp được dùng
bởi agent nhúng chỉ hỗ trợ khóa frontmatter **một dòng**;
`metadata` nên là **đối tượng JSON một dòng**. Dùng `{baseDir}` trong
hướng dẫn để tham chiếu đường dẫn thư mục kỹ năng.

### Khóa frontmatter tùy chọn

<ParamField path="homepage" type="string">
  URL hiển thị dưới dạng "Trang web" trong giao diện macOS Skills. Cũng được hỗ trợ qua `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Khi `true`, kỹ năng được hiển thị dưới dạng slash command của người dùng.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Khi `true`, kỹ năng bị loại khỏi prompt mô hình (vẫn khả dụng qua lời gọi của người dùng).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Khi đặt thành `tool`, slash command bỏ qua mô hình và chuyển trực tiếp đến công cụ.
</ParamField>
<ParamField path="command-tool" type="string">
  Tên công cụ cần gọi khi đặt `command-dispatch: tool`.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Với điều phối công cụ, chuyển tiếp chuỗi đối số thô đến công cụ (không phân tích cú pháp trong core). Công cụ được gọi với `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Chặn theo điều kiện (bộ lọc tại thời điểm tải)

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
  Khi `true`, luôn bao gồm kỹ năng (bỏ qua các cổng khác).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji tùy chọn được dùng bởi giao diện macOS Skills.
</ParamField>
<ParamField path="homepage" type="string">
  URL tùy chọn hiển thị dưới dạng "Trang web" trong giao diện macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Danh sách nền tảng tùy chọn. Nếu đặt, kỹ năng chỉ đủ điều kiện trên các OS đó.
</ParamField>
<ParamField path="requires.bins" type="string[]">
  Mỗi mục phải tồn tại trên `PATH`.
</ParamField>
<ParamField path="requires.anyBins" type="string[]">
  Ít nhất một mục phải tồn tại trên `PATH`.
</ParamField>
<ParamField path="requires.env" type="string[]">
  Biến môi trường phải tồn tại hoặc được cung cấp trong cấu hình.
</ParamField>
<ParamField path="requires.config" type="string[]">
  Danh sách đường dẫn `openclaw.json` phải có giá trị truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Tên biến môi trường liên kết với `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Đặc tả trình cài đặt tùy chọn được dùng bởi giao diện macOS Skills (brew/node/go/uv/download).
</ParamField>

Nếu không có `metadata.openclaw`, kỹ năng luôn đủ điều kiện (trừ khi
bị tắt trong cấu hình hoặc bị chặn bởi `skills.allowBundled` đối với kỹ năng đi kèm).

<Note>
Các khối `metadata.clawdbot` cũ vẫn được chấp nhận khi
không có `metadata.openclaw`, nên các kỹ năng cũ đã cài đặt vẫn giữ
cổng phụ thuộc và gợi ý trình cài đặt của chúng. Kỹ năng mới và được cập nhật nên dùng
`metadata.openclaw`.
</Note>

### Ghi chú sandbox

- `requires.bins` được kiểm tra trên **host** tại thời điểm tải kỹ năng.
- Nếu một agent chạy trong sandbox, binary cũng phải tồn tại **bên trong container**. Cài đặt nó qua `agents.defaults.sandbox.docker.setupCommand` (hoặc một image tùy chỉnh). `setupCommand` chạy một lần sau khi container được tạo. Cài đặt package cũng yêu cầu network egress, root FS có thể ghi và người dùng root trong sandbox.
- Ví dụ: kỹ năng `summarize` (`skills/summarize/SKILL.md`) cần CLI `summarize` trong container sandbox để chạy ở đó.

### Đặc tả trình cài đặt

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
    - Nếu tất cả trình cài đặt đều là `download`, OpenClaw liệt kê từng mục để bạn có thể xem các artifact có sẵn.
    - Thông số trình cài đặt có thể bao gồm `os: ["darwin"|"linux"|"win32"]` để lọc tùy chọn theo nền tảng.
    - Cài đặt Node tuân theo `skills.install.nodeManager` trong `openclaw.json` (mặc định: npm; tùy chọn: npm/pnpm/yarn/bun). Điều này chỉ ảnh hưởng đến việc cài đặt skill; runtime Gateway vẫn nên là Node — Bun không được khuyến nghị cho WhatsApp/Telegram.
    - Lựa chọn trình cài đặt dựa trên Gateway được điều khiển theo ưu tiên: khi thông số cài đặt trộn nhiều loại, OpenClaw ưu tiên Homebrew khi `skills.install.preferBrew` được bật và `brew` tồn tại, sau đó là `uv`, rồi trình quản lý node đã cấu hình, rồi các phương án dự phòng khác như `go` hoặc `download`.
    - Nếu mọi thông số cài đặt đều là `download`, OpenClaw hiển thị tất cả tùy chọn tải xuống thay vì gộp lại thành một trình cài đặt ưu tiên.

  </Accordion>
  <Accordion title="Chi tiết theo từng trình cài đặt">
    - **Cài đặt Go:** nếu thiếu `go` và có sẵn `brew`, gateway cài đặt Go qua Homebrew trước và đặt `GOBIN` thành `bin` của Homebrew khi có thể.
    - **Cài đặt tải xuống:** `url` (bắt buộc), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (mặc định: tự động khi phát hiện archive), `stripComponents`, `targetDir` (mặc định: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Ghi đè cấu hình

Các skill đi kèm và được quản lý có thể được bật/tắt và cung cấp giá trị env
trong `skills.entries` ở `~/.openclaw/openclaw.json`:

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
  `false` vô hiệu hóa skill ngay cả khi nó được đi kèm hoặc đã cài đặt.
  Skill `coding-agent` đi kèm là tùy chọn bật thủ công: đặt
  `skills.entries.coding-agent.enabled: true` trước khi cho agent thấy nó,
  rồi đảm bảo một trong `claude`, `codex`, `opencode`, hoặc `pi` đã được cài đặt và
  xác thực cho CLI riêng của nó.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Tiện ích cho các skill khai báo `metadata.openclaw.primaryEnv`. Hỗ trợ văn bản thuần hoặc SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Chỉ được chèn nếu biến chưa được đặt trong process.
</ParamField>
<ParamField path="config" type="object">
  Túi tùy chọn cho các trường tùy chỉnh theo từng skill. Khóa tùy chỉnh phải nằm ở đây.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho skill **đi kèm**. Nếu được đặt, chỉ các skill đi kèm trong danh sách mới đủ điều kiện (skill được quản lý/workspace không bị ảnh hưởng).
</ParamField>

Nếu tên skill chứa dấu gạch nối, hãy đặt khóa trong dấu ngoặc kép (JSON5 cho phép
khóa có ngoặc kép). Khóa cấu hình mặc định khớp với **tên skill** — nếu một skill
định nghĩa `metadata.openclaw.skillKey`, hãy dùng khóa đó trong `skills.entries`.

<Note>
Để tạo/chỉnh sửa ảnh có sẵn trong OpenClaw, dùng công cụ lõi
`image_generate` với `agents.defaults.imageGenerationModel` thay vì
một skill đi kèm. Các ví dụ skill ở đây dành cho quy trình tùy chỉnh hoặc bên thứ ba.
Để phân tích ảnh gốc, dùng công cụ `image` với
`agents.defaults.imageModel`. Nếu bạn chọn `openai/*`, `google/*`,
`fal/*`, hoặc một model ảnh dành riêng cho nhà cung cấp khác, hãy thêm cả khóa
auth/API của nhà cung cấp đó.
</Note>

## Chèn môi trường

Khi một lượt chạy agent bắt đầu, OpenClaw:

1. Đọc metadata của skill.
2. Áp dụng `skills.entries.<key>.env` và `skills.entries.<key>.apiKey` vào `process.env`.
3. Xây dựng system prompt với các skill **đủ điều kiện**.
4. Khôi phục môi trường ban đầu sau khi lượt chạy kết thúc.

Việc chèn môi trường được **giới hạn trong lượt chạy agent**, không phải môi trường
shell toàn cục.

Đối với backend `claude-cli` đi kèm, OpenClaw cũng hiện thực hóa cùng
snapshot đủ điều kiện thành một Plugin Claude Code tạm thời và truyền nó bằng
`--plugin-dir`. Claude Code sau đó có thể dùng trình phân giải skill gốc của nó trong khi
OpenClaw vẫn sở hữu thứ tự ưu tiên, danh sách cho phép theo từng agent, gating, và
việc chèn env/khóa API `skills.entries.*`. Các backend CLI khác chỉ dùng
danh mục prompt.

## Snapshot và làm mới

OpenClaw snapshot các skill đủ điều kiện **khi một phiên bắt đầu** và
tái sử dụng danh sách đó cho các lượt tiếp theo trong cùng phiên. Thay đổi đối với
skill hoặc cấu hình có hiệu lực ở phiên mới tiếp theo.

Skills có thể làm mới giữa phiên trong hai trường hợp:

- Trình theo dõi Skills được bật.
- Một node từ xa mới đủ điều kiện xuất hiện.

Hãy xem đây là **hot reload**: danh sách đã làm mới được sử dụng ở
lượt agent tiếp theo. Nếu danh sách cho phép skill hiệu lực của agent thay đổi cho
phiên đó, OpenClaw làm mới snapshot để các skill hiển thị luôn khớp
với agent hiện tại.

### Trình theo dõi Skills

Theo mặc định, OpenClaw theo dõi các thư mục skill và tăng snapshot Skills
khi tệp `SKILL.md` thay đổi. Cấu hình trong `skills.load`:

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

### Node macOS từ xa (Gateway Linux)

Nếu Gateway chạy trên Linux nhưng một **node macOS** được kết nối với
`system.run` được cho phép (bảo mật phê duyệt Exec không đặt thành `deny`),
OpenClaw có thể xem các skill chỉ dành cho macOS là đủ điều kiện khi các
binary bắt buộc có mặt trên node đó. Agent nên thực thi các skill đó
qua công cụ `exec` với `host=node`.

Điều này dựa vào việc node báo cáo hỗ trợ lệnh của nó và vào một lần dò bin
qua `system.which` hoặc `system.run`. Node ngoại tuyến **không** làm cho
skill chỉ từ xa hiển thị. Nếu một node đã kết nối ngừng phản hồi các lần
dò bin, OpenClaw xóa các kết quả khớp bin đã lưu trong cache của nó để agent không còn thấy
những skill hiện không thể chạy ở đó.

## Tác động token

Khi skill đủ điều kiện, OpenClaw chèn một danh sách XML nhỏ gọn các
skill có sẵn vào system prompt (qua `formatSkillsForPrompt` trong
`pi-coding-agent`). Chi phí là xác định:

- **Phần cố định cơ bản** (chỉ khi có ≥1 skill): 195 ký tự.
- **Mỗi skill:** 97 ký tự + độ dài của các giá trị `<name>`, `<description>`, và `<location>` đã escape XML.

Công thức (ký tự):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

Escape XML mở rộng `& < > " '` thành entity (`&amp;`, `&lt;`, v.v.),
làm tăng độ dài. Số lượng token thay đổi theo tokenizer của model. Một ước tính kiểu
OpenAI sơ bộ là ~4 ký tự/token, nên **97 ký tự ≈ 24 token** cho mỗi
skill cộng với độ dài trường thực tế của bạn.

## Vòng đời skill được quản lý

OpenClaw cung cấp một bộ skill cơ sở dưới dạng **skill đi kèm** cùng với
bản cài đặt (gói npm hoặc OpenClaw.app). `~/.openclaw/skills` tồn tại cho
các ghi đè cục bộ — ví dụ, ghim hoặc vá một skill mà không
thay đổi bản sao đi kèm. Skill workspace thuộc sở hữu người dùng và ghi đè
cả hai khi có xung đột tên.

## Tìm thêm skill?

Duyệt [https://clawhub.ai](https://clawhub.ai). Schema cấu hình đầy đủ:
[Cấu hình Skills](/vi/tools/skills-config).

## Liên quan

- [ClawHub](/vi/tools/clawhub) — registry skill công khai
- [Tạo skill](/vi/tools/creating-skills) — xây dựng skill tùy chỉnh
- [Plugins](/vi/tools/plugin) — tổng quan hệ thống Plugin
- [Plugin Skill Workshop](/vi/plugins/skill-workshop) — tạo skill từ công việc của agent
- [Cấu hình Skills](/vi/tools/skills-config) — tài liệu tham khảo cấu hình skill
- [Lệnh slash](/vi/tools/slash-commands) — tất cả lệnh slash có sẵn
