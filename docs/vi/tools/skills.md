---
read_when:
    - Thêm hoặc sửa đổi Skills
    - Thay đổi cơ chế kiểm soát Skills, danh sách cho phép hoặc quy tắc tải
    - Tìm hiểu về thứ tự ưu tiên của kỹ năng và hành vi ảnh chụp trạng thái
sidebarTitle: Skills
summary: 'Skills: dạng được quản lý so với dạng không gian làm việc, quy tắc kiểm soát, danh sách cho phép agent và kết nối cấu hình'
title: Skills
x-i18n:
    generated_at: "2026-04-30T20:05:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58d690786756bd3539940aae9f2abcb8a497798ed7b6afeb5e6d6e255fcf257
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw dùng các thư mục skill **tương thích [AgentSkills](https://agentskills.io)** để dạy agent cách dùng công cụ. Mỗi skill là một thư mục chứa `SKILL.md` với YAML frontmatter và hướng dẫn. OpenClaw tải các skill đi kèm cùng các ghi đè cục bộ tùy chọn, rồi lọc chúng tại thời điểm tải dựa trên môi trường, cấu hình và sự hiện diện của binary.

## Vị trí và thứ tự ưu tiên

OpenClaw tải skill từ các nguồn này, **ưu tiên cao nhất trước**:

| #   | Nguồn                 | Đường dẫn                        |
| --- | --------------------- | -------------------------------- |
| 1   | Skill workspace       | `<workspace>/skills`             |
| 2   | Skill agent dự án     | `<workspace>/.agents/skills`     |
| 3   | Skill agent cá nhân   | `~/.agents/skills`               |
| 4   | Skill quản lý/cục bộ  | `~/.openclaw/skills`             |
| 5   | Skill đi kèm          | đi kèm bản cài đặt               |
| 6   | Thư mục skill bổ sung | `skills.load.extraDirs` (config) |

Nếu tên skill xung đột, nguồn cao nhất sẽ thắng.

Thư mục `$CODEX_HOME/skills` gốc của Codex CLI không nằm trong các gốc skill OpenClaw này. Trong chế độ harness Codex, các lần khởi chạy app-server cục bộ dùng các home Codex tách biệt theo từng agent, nên skill Codex CLI cá nhân không được tải ngầm định. Dùng `openclaw migrate codex --dry-run` để kiểm kê chúng và `openclaw migrate codex` để chọn thư mục skill bằng lời nhắc checkbox tương tác trước khi sao chép chúng vào workspace agent OpenClaw hiện tại. Với các lần chạy không tương tác, lặp lại `--skill <name>` cho đúng các skill cần sao chép.

## Skill theo từng agent so với skill dùng chung

Trong các thiết lập **đa agent**, mỗi agent có workspace riêng:

| Phạm vi               | Đường dẫn                                  | Hiển thị với                 |
| --------------------- | ------------------------------------------ | ---------------------------- |
| Theo từng agent       | `<workspace>/skills`                       | Chỉ agent đó                 |
| Agent dự án           | `<workspace>/.agents/skills`               | Chỉ agent của workspace đó   |
| Agent cá nhân         | `~/.agents/skills`                         | Tất cả agent trên máy đó     |
| Quản lý/cục bộ dùng chung | `~/.openclaw/skills`                   | Tất cả agent trên máy đó     |
| Thư mục bổ sung dùng chung | `skills.load.extraDirs` (ưu tiên thấp nhất) | Tất cả agent trên máy đó |

Cùng tên ở nhiều nơi → nguồn cao nhất sẽ thắng. Workspace thắng agent dự án, thắng agent cá nhân, thắng quản lý/cục bộ, thắng đi kèm, thắng thư mục bổ sung.

## Danh sách cho phép skill của agent

**Vị trí** skill và **khả năng hiển thị** skill là các cơ chế kiểm soát riêng biệt. Vị trí/thứ tự ưu tiên quyết định bản sao nào của skill cùng tên sẽ thắng; danh sách cho phép của agent quyết định agent thực sự có thể dùng skill nào.

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
    - Bỏ qua `agents.defaults.skills` để mặc định không hạn chế skill.
    - Bỏ qua `agents.list[].skills` để kế thừa `agents.defaults.skills`.
    - Đặt `agents.list[].skills: []` để không có skill nào.
    - Danh sách `agents.list[].skills` không rỗng là tập hợp **cuối cùng** cho agent đó — nó không hợp nhất với mặc định.
    - Danh sách cho phép hiệu lực áp dụng trên việc tạo prompt, khám phá slash-command của skill, đồng bộ sandbox và snapshot skill.

  </Accordion>
</AccordionGroup>

## Plugin và skill

Plugin có thể cung cấp skill riêng bằng cách liệt kê các thư mục `skills` trong `openclaw.plugin.json` (đường dẫn tương đối với gốc Plugin). Skill của Plugin tải khi Plugin được bật. Đây là nơi phù hợp cho các hướng dẫn vận hành theo công cụ quá dài để đưa vào mô tả công cụ nhưng nên có sẵn bất cứ khi nào Plugin được cài đặt — ví dụ, Plugin trình duyệt cung cấp skill `browser-automation` cho điều khiển trình duyệt nhiều bước.

Thư mục skill của Plugin được hợp nhất vào cùng đường dẫn ưu tiên thấp như `skills.load.extraDirs`, nên skill đi kèm, được quản lý, của agent hoặc workspace cùng tên sẽ ghi đè chúng. Bạn có thể chặn theo điều kiện qua `metadata.openclaw.requires.config` trên mục cấu hình của Plugin.

Xem [Plugin](/vi/tools/plugin) để biết khám phá/cấu hình và [Công cụ](/vi/tools) để biết bề mặt công cụ mà các skill đó hướng dẫn.

## Skill Workshop

Plugin **Skill Workshop** tùy chọn, thử nghiệm có thể tạo hoặc cập nhật skill workspace từ các quy trình tái sử dụng được quan sát trong quá trình agent làm việc. Plugin này bị tắt theo mặc định và phải được bật rõ ràng qua `plugins.entries.skill-workshop`.

Skill Workshop chỉ ghi vào `<workspace>/skills`, quét nội dung được tạo, hỗ trợ phê duyệt đang chờ hoặc ghi an toàn tự động, cách ly các đề xuất không an toàn, và làm mới snapshot skill sau khi ghi thành công để skill mới khả dụng mà không cần khởi động lại Gateway.

Dùng nó cho các sửa chỉnh như _"lần sau, xác minh ghi công GIF"_ hoặc các quy trình khó đúc kết như checklist QA media. Hãy bắt đầu với phê duyệt đang chờ; chỉ dùng ghi tự động trong workspace đáng tin cậy sau khi xem xét các đề xuất của nó. Hướng dẫn đầy đủ: [Plugin Skill Workshop](/vi/plugins/skill-workshop).

## ClawHub (cài đặt và đồng bộ)

[ClawHub](https://clawhub.ai) là registry skill công khai cho OpenClaw. Dùng các lệnh `openclaw skills` gốc để khám phá/cài đặt/cập nhật, hoặc CLI `clawhub` riêng cho quy trình phát hành/đồng bộ. Hướng dẫn đầy đủ: [ClawHub](/vi/tools/clawhub).

| Hành động                                  | Lệnh                                   |
| ------------------------------------------ | -------------------------------------- |
| Cài đặt skill vào workspace                | `openclaw skills install <skill-slug>` |
| Cập nhật tất cả skill đã cài đặt           | `openclaw skills update --all`         |
| Đồng bộ (quét + phát hành bản cập nhật)    | `clawhub sync --all`                   |

`openclaw skills install` gốc cài đặt vào thư mục `skills/` của workspace đang hoạt động. CLI `clawhub` riêng cũng cài đặt vào `./skills` trong thư mục làm việc hiện tại của bạn (hoặc quay về workspace OpenClaw đã cấu hình). OpenClaw nhận thư mục đó là `<workspace>/skills` trong phiên tiếp theo. Các gốc skill đã cấu hình cũng hỗ trợ một cấp nhóm, chẳng hạn `skills/<group>/<skill>/SKILL.md`, để các skill bên thứ ba liên quan có thể được giữ trong một thư mục dùng chung mà không cần quét đệ quy rộng.

Các trang skill ClawHub hiển thị trạng thái quét bảo mật mới nhất trước khi cài đặt, cùng các trang chi tiết scanner cho VirusTotal, ClawScan và phân tích tĩnh. `openclaw skills install <slug>` vẫn chỉ là đường dẫn cài đặt; nhà phát hành xử lý kết quả dương tính giả qua bảng điều khiển ClawHub hoặc `clawhub skill rescan <slug>`.

## Bảo mật

<Warning>
Hãy xem skill bên thứ ba là **mã không đáng tin cậy**. Đọc chúng trước khi bật. Ưu tiên chạy trong sandbox cho đầu vào không đáng tin cậy và công cụ rủi ro. Xem [Sandboxing](/vi/gateway/sandboxing) để biết các kiểm soát phía agent.
</Warning>

- Khám phá skill workspace và thư mục bổ sung chỉ chấp nhận các gốc skill và tệp `SKILL.md` có realpath đã phân giải vẫn nằm trong gốc đã cấu hình.
- Các cài đặt phụ thuộc skill được Gateway hỗ trợ (`skills.install`, onboarding và giao diện cài đặt Skills) chạy scanner mã nguy hiểm tích hợp trước khi thực thi metadata trình cài đặt. Các phát hiện `critical` bị chặn theo mặc định trừ khi caller đặt rõ ghi đè nguy hiểm; các phát hiện đáng ngờ vẫn chỉ cảnh báo.
- `openclaw skills install <slug>` thì khác — nó tải một thư mục skill ClawHub vào workspace và không dùng đường dẫn metadata trình cài đặt ở trên.
- `skills.entries.*.env` và `skills.entries.*.apiKey` tiêm secret vào tiến trình **host** cho lượt agent đó (không phải sandbox). Không đưa secret vào prompt và log.

Để có mô hình đe dọa và checklist rộng hơn, xem [Bảo mật](/vi/gateway/security).

## Định dạng SKILL.md

`SKILL.md` phải bao gồm ít nhất:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw tuân theo đặc tả AgentSkills về bố cục/mục đích. Parser được agent nhúng sử dụng chỉ hỗ trợ các khóa frontmatter **một dòng**; `metadata` nên là **đối tượng JSON một dòng**. Dùng `{baseDir}` trong hướng dẫn để tham chiếu đường dẫn thư mục skill.

### Khóa frontmatter tùy chọn

<ParamField path="homepage" type="string">
  URL hiển thị dưới dạng "Trang web" trong giao diện macOS Skills. Cũng được hỗ trợ qua `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Khi là `true`, skill được hiển thị như slash command của người dùng.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Khi là `true`, skill bị loại khỏi prompt của model (vẫn khả dụng qua lời gọi của người dùng).
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Khi đặt thành `tool`, slash command bỏ qua model và dispatch trực tiếp đến một công cụ.
</ParamField>
<ParamField path="command-tool" type="string">
  Tên công cụ để gọi khi `command-dispatch: tool` được đặt.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Với dispatch công cụ, chuyển tiếp chuỗi args thô đến công cụ (không có phân tích cú pháp lõi). Công cụ được gọi với `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Điều kiện cổng (bộ lọc lúc tải)

OpenClaw lọc skill tại thời điểm tải bằng `metadata` (JSON một dòng):

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
  Khi là `true`, luôn bao gồm skill (bỏ qua các cổng khác).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji tùy chọn được giao diện macOS Skills dùng.
</ParamField>
<ParamField path="homepage" type="string">
  URL tùy chọn hiển thị dưới dạng "Trang web" trong giao diện macOS Skills.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Danh sách nền tảng tùy chọn. Nếu được đặt, skill chỉ đủ điều kiện trên các hệ điều hành đó.
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
  Danh sách các đường dẫn `openclaw.json` phải có giá trị truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Tên env var được liên kết với `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Đặc tả trình cài đặt tùy chọn được giao diện macOS Skills dùng (brew/node/go/uv/download).
</ParamField>

Nếu không có `metadata.openclaw`, skill luôn đủ điều kiện (trừ khi bị tắt trong config hoặc bị `skills.allowBundled` chặn đối với skill đi kèm).

<Note>
Các khối `metadata.clawdbot` cũ vẫn được chấp nhận khi không có `metadata.openclaw`, để các skill đã cài đặt cũ giữ nguyên cổng phụ thuộc và gợi ý trình cài đặt. Skill mới và đã cập nhật nên dùng `metadata.openclaw`.
</Note>

### Ghi chú về sandboxing

- `requires.bins` được kiểm tra trên **host** tại thời điểm tải skill.
- Nếu agent chạy trong sandbox, binary cũng phải tồn tại **bên trong container**. Cài đặt nó qua `agents.defaults.sandbox.docker.setupCommand` (hoặc image tùy chỉnh). `setupCommand` chạy một lần sau khi container được tạo. Cài đặt gói cũng yêu cầu network egress, root FS có thể ghi và root user trong sandbox.
- Ví dụ: skill `summarize` (`skills/summarize/SKILL.md`) cần CLI `summarize` trong container sandbox để chạy ở đó.

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
    - Nếu tất cả trình cài đặt đều là `download`, OpenClaw liệt kê từng mục để bạn có thể thấy các artifact hiện có.
    - Đặc tả trình cài đặt có thể bao gồm `os: ["darwin"|"linux"|"win32"]` để lọc tùy chọn theo nền tảng.
    - Các bản cài đặt Node tuân theo `skills.install.nodeManager` trong `openclaw.json` (mặc định: npm; tùy chọn: npm/pnpm/yarn/bun). Điều này chỉ ảnh hưởng đến cài đặt skill; runtime Gateway vẫn nên là Node — Bun không được khuyến nghị cho WhatsApp/Telegram.
    - Việc chọn trình cài đặt do Gateway hỗ trợ được điều khiển theo ưu tiên: khi các đặc tả cài đặt trộn nhiều loại, OpenClaw ưu tiên Homebrew khi `skills.install.preferBrew` được bật và `brew` tồn tại, sau đó đến `uv`, rồi trình quản lý node đã cấu hình, rồi các phương án dự phòng khác như `go` hoặc `download`.
    - Nếu mọi đặc tả cài đặt đều là `download`, OpenClaw hiển thị tất cả tùy chọn tải xuống thay vì thu gọn thành một trình cài đặt ưu tiên.

  </Accordion>
  <Accordion title="Chi tiết theo từng trình cài đặt">
    - **Cài đặt Go:** nếu thiếu `go` và có sẵn `brew`, gateway cài Go qua Homebrew trước và đặt `GOBIN` thành `bin` của Homebrew khi có thể.
    - **Cài đặt tải xuống:** `url` (bắt buộc), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (mặc định: tự động khi phát hiện archive), `stripComponents`, `targetDir` (mặc định: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Ghi đè cấu hình

Các skill đi kèm và được quản lý có thể được bật/tắt và cung cấp giá trị env
trong `skills.entries` trong `~/.openclaw/openclaw.json`:

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
  Skill `coding-agent` đi kèm là tùy chọn bật thủ công: đặt
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
  Túi tùy chọn cho các trường tùy chỉnh theo từng skill. Các khóa tùy chỉnh phải nằm ở đây.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho các skill **đi kèm**. Nếu được đặt, chỉ các skill đi kèm trong danh sách mới đủ điều kiện (không ảnh hưởng đến skill được quản lý/không gian làm việc).
</ParamField>

Nếu tên skill chứa dấu gạch nối, hãy đặt khóa trong dấu ngoặc kép (JSON5 cho phép
khóa được đặt trong dấu ngoặc kép). Các khóa cấu hình mặc định khớp với **tên skill** — nếu một skill
định nghĩa `metadata.openclaw.skillKey`, hãy dùng khóa đó trong `skills.entries`.

<Note>
Để tạo/chỉnh sửa ảnh stock bên trong OpenClaw, hãy dùng công cụ lõi
`image_generate` với `agents.defaults.imageGenerationModel` thay vì
một skill đi kèm. Các ví dụ về skill ở đây dành cho quy trình tùy chỉnh hoặc bên thứ ba.
Để phân tích ảnh gốc, hãy dùng công cụ `image` với
`agents.defaults.imageModel`. Nếu bạn chọn `openai/*`, `google/*`,
`fal/*`, hoặc một mô hình ảnh dành riêng cho nhà cung cấp khác, hãy thêm cả
khóa xác thực/API của nhà cung cấp đó.
</Note>

## Chèn môi trường

Khi một lượt chạy agent bắt đầu, OpenClaw:

1. Đọc metadata của skill.
2. Áp dụng `skills.entries.<key>.env` và `skills.entries.<key>.apiKey` vào `process.env`.
3. Xây dựng system prompt với các skill **đủ điều kiện**.
4. Khôi phục môi trường ban đầu sau khi lượt chạy kết thúc.

Việc chèn môi trường được **giới hạn trong lượt chạy agent**, không phải môi trường shell
toàn cục.

Đối với backend `claude-cli` đi kèm, OpenClaw cũng hiện thực hóa cùng
snapshot đủ điều kiện dưới dạng một plugin Claude Code tạm thời và truyền nó bằng
`--plugin-dir`. Claude Code sau đó có thể dùng bộ phân giải skill gốc của nó trong khi
OpenClaw vẫn sở hữu thứ tự ưu tiên, danh sách cho phép theo agent, gating, và
việc chèn khóa env/API `skills.entries.*`. Các backend CLI khác chỉ dùng
danh mục prompt.

## Snapshot và làm mới

OpenClaw chụp snapshot các skill đủ điều kiện **khi một phiên bắt đầu** và
tái sử dụng danh sách đó cho các lượt tiếp theo trong cùng phiên. Các thay đổi đối với
skill hoặc cấu hình có hiệu lực ở phiên mới kế tiếp.

Skills có thể làm mới giữa phiên trong hai trường hợp:

- Trình theo dõi skills được bật.
- Một remote node đủ điều kiện mới xuất hiện.

Hãy xem đây như một **hot reload**: danh sách đã làm mới được dùng ở
lượt agent kế tiếp. Nếu danh sách cho phép skill hiệu dụng của agent thay đổi cho
phiên đó, OpenClaw làm mới snapshot để các skill hiển thị luôn khớp
với agent hiện tại.

### Trình theo dõi Skills

Theo mặc định, OpenClaw theo dõi các thư mục skill và tăng snapshot skills
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

### Remote node macOS (gateway Linux)

Nếu Gateway chạy trên Linux nhưng một **node macOS** được kết nối với
`system.run` được cho phép (bảo mật phê duyệt Exec không đặt thành `deny`),
OpenClaw có thể coi các skill chỉ dành cho macOS là đủ điều kiện khi các
binary bắt buộc có trên node đó. Agent nên thực thi các skill đó
qua công cụ `exec` với `host=node`.

Điều này dựa vào việc node báo cáo khả năng hỗ trợ lệnh của nó và vào một lần dò bin
qua `system.which` hoặc `system.run`. Các node ngoại tuyến **không** làm cho
skill chỉ chạy từ xa hiển thị. Nếu một node đã kết nối ngừng phản hồi các lần dò bin,
OpenClaw xóa các kết quả khớp bin đã lưu trong bộ nhớ đệm để agent không còn thấy
những skill hiện không thể chạy ở đó.

## Tác động token

Khi các skill đủ điều kiện, OpenClaw chèn một danh sách XML gọn về các
skill hiện có vào system prompt (qua `formatSkillsForPrompt` trong
`pi-coding-agent`). Chi phí là xác định:

- **Chi phí cơ sở** (chỉ khi có ≥1 skill): 195 ký tự.
- **Mỗi skill:** 97 ký tự + độ dài của các giá trị `<name>`, `<description>`, và `<location>` đã escape XML.

Công thức (ký tự):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping mở rộng `& < > " '` thành entity (`&amp;`, `&lt;`, v.v.),
làm tăng độ dài. Số lượng token thay đổi theo tokenizer của mô hình. Một ước tính
kiểu OpenAI sơ bộ là ~4 ký tự/token, nên **97 ký tự ≈ 24 token** cho mỗi
skill cộng với độ dài trường thực tế của bạn.

## Vòng đời skill được quản lý

OpenClaw phát hành một bộ skill cơ sở dưới dạng **skill đi kèm** với bản
cài đặt (gói npm hoặc OpenClaw.app). `~/.openclaw/skills` tồn tại để
ghi đè cục bộ — ví dụ, ghim hoặc vá một skill mà không
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
- [Lệnh slash](/vi/tools/slash-commands) — tất cả lệnh slash hiện có
