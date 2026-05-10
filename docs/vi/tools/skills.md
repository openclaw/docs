---
read_when:
    - Thêm hoặc sửa đổi Skills
    - Thay đổi kiểm soát điều kiện cho skill, danh sách cho phép hoặc quy tắc tải
    - Hiểu thứ tự ưu tiên của kỹ năng và hành vi ảnh chụp nhanh
sidebarTitle: Skills
summary: 'Skills: chế độ được quản lý so với không gian làm việc, quy tắc kiểm soát, danh sách cho phép tác tử và đấu nối cấu hình'
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:54:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: a265932a9990e71c0dd6b4444f26efb04019ed979477b0712a3a45569b1b4dff
    source_path: tools/skills.md
    workflow: 16
---

OpenClaw sử dụng các thư mục kỹ năng **tương thích với [AgentSkills](https://agentskills.io)**
để hướng dẫn agent cách dùng công cụ. Mỗi kỹ năng là một thư mục
chứa `SKILL.md` với YAML frontmatter và hướng dẫn. OpenClaw
tải các kỹ năng đi kèm cùng các ghi đè cục bộ tùy chọn, rồi lọc chúng
tại thời điểm tải dựa trên môi trường, cấu hình và sự hiện diện của binary.

## Vị trí và thứ tự ưu tiên

OpenClaw tải kỹ năng từ các nguồn sau, **ưu tiên cao nhất trước**:

| #   | Nguồn                 | Đường dẫn                       |
| --- | --------------------- | -------------------------------- |
| 1   | Kỹ năng workspace     | `<workspace>/skills`             |
| 2   | Kỹ năng agent dự án   | `<workspace>/.agents/skills`     |
| 3   | Kỹ năng agent cá nhân | `~/.agents/skills`               |
| 4   | Kỹ năng được quản lý/cục bộ | `~/.openclaw/skills`       |
| 5   | Kỹ năng đi kèm        | được phân phối cùng bản cài đặt  |
| 6   | Thư mục kỹ năng bổ sung | `skills.load.extraDirs` (cấu hình) |

Nếu tên kỹ năng xung đột, nguồn có mức ưu tiên cao nhất sẽ thắng.

Thư mục `$CODEX_HOME/skills` gốc của Codex CLI không nằm trong các gốc kỹ năng
này của OpenClaw. Trong chế độ harness Codex, các lần khởi chạy app-server cục bộ
dùng các home Codex biệt lập theo từng agent, nên kỹ năng Codex CLI cá nhân
không được tải ngầm định. Dùng `openclaw migrate codex --dry-run` để kiểm kê
chúng và `openclaw migrate codex` để chọn thư mục kỹ năng bằng lời nhắc checkbox
tương tác trước khi sao chép chúng vào workspace agent OpenClaw hiện tại.
Với các lần chạy không tương tác, lặp lại `--skill <name>` cho đúng các kỹ năng cần sao chép.

## Kỹ năng theo từng agent so với kỹ năng dùng chung

Trong các thiết lập **nhiều agent**, mỗi agent có workspace riêng:

| Phạm vi             | Đường dẫn                                   | Hiển thị với                |
| ------------------- | ------------------------------------------- | --------------------------- |
| Theo từng agent     | `<workspace>/skills`                        | Chỉ agent đó                |
| Agent dự án         | `<workspace>/.agents/skills`                | Chỉ agent của workspace đó  |
| Agent cá nhân       | `~/.agents/skills`                          | Tất cả agent trên máy đó    |
| Được quản lý/cục bộ dùng chung | `~/.openclaw/skills`             | Tất cả agent trên máy đó    |
| Thư mục bổ sung dùng chung | `skills.load.extraDirs` (ưu tiên thấp nhất) | Tất cả agent trên máy đó |

Cùng tên ở nhiều nơi → nguồn có mức ưu tiên cao nhất sẽ thắng. Workspace thắng
agent dự án, thắng agent cá nhân, thắng được quản lý/cục bộ, thắng đi kèm,
thắng thư mục bổ sung.

## Danh sách cho phép kỹ năng của agent

**Vị trí** kỹ năng và **khả năng hiển thị** kỹ năng là hai cơ chế kiểm soát riêng biệt.
Vị trí/thứ tự ưu tiên quyết định bản sao nào của một kỹ năng cùng tên sẽ thắng; danh sách
cho phép của agent quyết định những kỹ năng nào agent thực sự có thể dùng.

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // kế thừa github, weather
      { id: "docs", skills: ["docs-search"] }, // thay thế giá trị mặc định
      { id: "locked-down", skills: [] }, // không có kỹ năng
    ],
  },
}
```

<AccordionGroup>
  <Accordion title="Quy tắc danh sách cho phép">
    - Bỏ qua `agents.defaults.skills` để mặc định không hạn chế kỹ năng.
    - Bỏ qua `agents.list[].skills` để kế thừa `agents.defaults.skills`.
    - Đặt `agents.list[].skills: []` để không có kỹ năng.
    - Danh sách `agents.list[].skills` không rỗng là tập hợp **cuối cùng** cho
      agent đó - nó không hợp nhất với giá trị mặc định.
    - Danh sách cho phép hiệu lực áp dụng trên việc dựng prompt, phát hiện
      lệnh slash của kỹ năng, đồng bộ sandbox và snapshot kỹ năng.
  </Accordion>
</AccordionGroup>

## Plugin và kỹ năng

Plugin có thể phân phối kỹ năng riêng bằng cách liệt kê các thư mục `skills` trong
`openclaw.plugin.json` (đường dẫn tương đối với gốc plugin). Kỹ năng của Plugin
được tải khi Plugin được bật. Đây là nơi phù hợp cho các hướng dẫn vận hành
riêng theo công cụ quá dài để đặt trong mô tả công cụ nhưng nên có sẵn
bất cứ khi nào Plugin được cài đặt - ví dụ, Plugin trình duyệt phân phối kỹ năng
`browser-automation` cho điều khiển trình duyệt nhiều bước.

Các thư mục kỹ năng của Plugin được hợp nhất vào cùng đường dẫn ưu tiên thấp như
`skills.load.extraDirs`, nên kỹ năng đi kèm, được quản lý, của agent hoặc
workspace có cùng tên sẽ ghi đè chúng. Bạn có thể chặn chúng bằng
`metadata.openclaw.requires.config` trên mục cấu hình của Plugin.

Xem [Plugin](/vi/tools/plugin) để biết cách phát hiện/cấu hình và [Công cụ](/vi/tools) để biết
bề mặt công cụ mà các kỹ năng đó hướng dẫn.

## Skill Workshop

Plugin **Skill Workshop** tùy chọn, thử nghiệm có thể tạo hoặc cập nhật
kỹ năng workspace từ các quy trình tái sử dụng quan sát được trong quá trình agent làm việc. Nó
bị tắt theo mặc định và phải được bật rõ ràng qua
`plugins.entries.skill-workshop`.

Skill Workshop chỉ ghi vào `<workspace>/skills`, quét nội dung được tạo,
hỗ trợ phê duyệt đang chờ xử lý hoặc ghi an toàn tự động, cách ly
các đề xuất không an toàn, và làm mới snapshot kỹ năng sau khi ghi thành công
để kỹ năng mới có sẵn mà không cần khởi động lại Gateway.

Dùng nó cho các hiệu chỉnh như _"lần sau, xác minh ghi công GIF"_ hoặc
các quy trình có được sau nhiều thử nghiệm như danh sách kiểm tra QA media. Bắt đầu với
phê duyệt đang chờ xử lý; chỉ dùng ghi tự động trong workspace tin cậy sau khi xem xét
các đề xuất của nó. Hướng dẫn đầy đủ: [Plugin Skill Workshop](/vi/plugins/skill-workshop).

## ClawHub (cài đặt và đồng bộ)

[ClawHub](https://clawhub.ai) là registry kỹ năng công khai cho OpenClaw.
Dùng các lệnh `openclaw skills` gốc để phát hiện/cài đặt/cập nhật, hoặc CLI
`clawhub` riêng cho các quy trình xuất bản/đồng bộ. Hướng dẫn đầy đủ:
[ClawHub](/vi/clawhub).

| Hành động                         | Lệnh                                   |
| ---------------------------------- | -------------------------------------- |
| Cài đặt một kỹ năng vào workspace | `openclaw skills install <skill-slug>` |
| Cập nhật tất cả kỹ năng đã cài đặt | `openclaw skills update --all`         |
| Đồng bộ (quét + xuất bản cập nhật) | `clawhub sync --all`                   |

`openclaw skills install` gốc cài đặt vào thư mục `skills/` của workspace
đang hoạt động. CLI `clawhub` riêng cũng cài đặt vào
`./skills` dưới thư mục làm việc hiện tại của bạn (hoặc fallback về
workspace OpenClaw đã cấu hình). OpenClaw nhận diện nó dưới dạng
`<workspace>/skills` trong phiên tiếp theo.
Các gốc kỹ năng đã cấu hình cũng hỗ trợ một cấp nhóm, chẳng hạn
`skills/<group>/<skill>/SKILL.md`, để các kỹ năng bên thứ ba liên quan có thể
được giữ dưới một thư mục dùng chung mà không cần quét đệ quy rộng.

Các client Gateway cần phân phối riêng tư, không qua ClawHub có thể staging một kho lưu trữ
kỹ năng dạng zip bằng `skills.upload.begin`, `skills.upload.chunk` và
`skills.upload.commit`, rồi cài đặt bản upload đã commit bằng
`skills.install({ source: "upload", uploadId, slug, force?, sha256? })`. Đây là
đường dẫn upload quản trị rõ ràng cho client tin cậy, không phải luồng
`openclaw skills install <slug>` hoặc cài đặt ClawHub thông thường. Nó tắt theo mặc định
và chỉ hoạt động khi `skills.install.allowUploadedArchives: true` được đặt trong
`openclaw.json`. Chế độ upload vẫn cài đặt vào thư mục `skills/<slug>` của
workspace agent mặc định; tên thư mục bên trong kho lưu trữ bị bỏ qua đối với
đích cài đặt cuối cùng.

Các trang kỹ năng ClawHub hiển thị trạng thái quét bảo mật mới nhất trước khi cài đặt,
với các trang chi tiết bộ quét cho VirusTotal, ClawScan và phân tích tĩnh.
`openclaw skills install <slug>` vẫn chỉ là đường dẫn cài đặt; nhà xuất bản
khôi phục dương tính giả qua dashboard ClawHub hoặc
`clawhub skill rescan <slug>`.

## Bảo mật

<Warning>
Xem kỹ năng bên thứ ba là **mã không đáng tin cậy**. Đọc chúng trước khi bật.
Ưu tiên chạy trong sandbox cho đầu vào không đáng tin cậy và công cụ rủi ro. Xem
[Sandboxing](/vi/gateway/sandboxing) để biết các kiểm soát phía agent.
</Warning>

- Phát hiện kỹ năng trong workspace và thư mục bổ sung chỉ chấp nhận các gốc kỹ năng và tệp `SKILL.md` có realpath đã phân giải vẫn nằm trong gốc đã cấu hình.
- Cài đặt kho lưu trữ riêng qua Gateway tắt theo mặc định. Khi được bật rõ ràng,
  chúng yêu cầu một bản upload zip đã commit chứa `SKILL.md` và tái sử dụng cùng
  các biện pháp bảo vệ trích xuất kho lưu trữ, path traversal, symlink, force và rollback như
  cài đặt kỹ năng ClawHub. Chúng được kiểm soát bởi
  `skills.install.allowUploadedArchives`; các cài đặt ClawHub thông thường không yêu cầu
  thiết lập đó.
- Cài đặt phụ thuộc kỹ năng dựa trên Gateway (`skills.install`, onboarding và giao diện cài đặt Skills) chạy bộ quét mã nguy hiểm tích hợp trước khi thực thi metadata trình cài đặt. Phát hiện `critical` bị chặn theo mặc định trừ khi caller đặt rõ ghi đè nguy hiểm; phát hiện đáng ngờ vẫn chỉ cảnh báo.
- `openclaw skills install <slug>` thì khác - nó tải thư mục kỹ năng ClawHub xuống workspace và không dùng đường dẫn metadata trình cài đặt ở trên.
- `skills.entries.*.env` và `skills.entries.*.apiKey` tiêm secret vào tiến trình **host** cho lượt agent đó (không phải sandbox). Không đưa secret vào prompt và log.

Để biết mô hình đe dọa và danh sách kiểm tra rộng hơn, xem [Bảo mật](/vi/gateway/security).

## Định dạng SKILL.md

`SKILL.md` tối thiểu phải bao gồm:

```markdown
---
name: image-lab
description: Generate or edit images via a provider-backed image workflow
---
```

OpenClaw tuân theo đặc tả AgentSkills về bố cục/mục đích. Bộ phân tích cú pháp được dùng
bởi agent nhúng chỉ hỗ trợ các khóa frontmatter **một dòng**;
`metadata` nên là một **đối tượng JSON một dòng**. Dùng `{baseDir}` trong
hướng dẫn để tham chiếu đường dẫn thư mục kỹ năng.

### Khóa frontmatter tùy chọn

<ParamField path="homepage" type="string">
  URL hiển thị dưới dạng "Website" trong giao diện Skills của macOS. Cũng được hỗ trợ qua `metadata.openclaw.homepage`.
</ParamField>
<ParamField path="user-invocable" type="boolean" default="true">
  Khi là `true`, kỹ năng được hiển thị dưới dạng lệnh slash của người dùng.
</ParamField>
<ParamField path="disable-model-invocation" type="boolean" default="false">
  Khi là `true`, OpenClaw loại hướng dẫn của kỹ năng khỏi prompt thông thường
  của agent. Kỹ năng vẫn được cài đặt và vẫn có thể được chạy rõ ràng dưới dạng
  lệnh slash khi `user-invocable` cũng là `true`.
</ParamField>
<ParamField path="command-dispatch" type='"tool"'>
  Khi được đặt thành `tool`, lệnh slash bỏ qua mô hình và dispatch trực tiếp tới công cụ.
</ParamField>
<ParamField path="command-tool" type="string">
  Tên công cụ cần gọi khi `command-dispatch: tool` được đặt.
</ParamField>
<ParamField path="command-arg-mode" type='"raw"' default="raw">
  Với dispatch công cụ, chuyển tiếp chuỗi đối số thô tới công cụ (không phân tích cú pháp trong core). Công cụ được gọi với `{ command: "<raw args>", commandName: "<slash command>", skillName: "<skill name>" }`.
</ParamField>

## Chặn tải (bộ lọc tại thời điểm tải)

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
  Khi là `true`, luôn bao gồm kỹ năng này (bỏ qua các cổng khác).
</ParamField>
<ParamField path="emoji" type="string">
  Emoji tùy chọn được giao diện Skills của macOS sử dụng.
</ParamField>
<ParamField path="homepage" type="string">
  URL tùy chọn được hiển thị là "Trang web" trong giao diện Skills của macOS.
</ParamField>
<ParamField path="os" type='"darwin" | "linux" | "win32"' >
  Danh sách nền tảng tùy chọn. Nếu được đặt, kỹ năng chỉ đủ điều kiện trên các hệ điều hành đó.
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
  Danh sách các đường dẫn `openclaw.json` phải có giá trị truthy.
</ParamField>
<ParamField path="primaryEnv" type="string">
  Tên biến môi trường được liên kết với `skills.entries.<name>.apiKey`.
</ParamField>
<ParamField path="install" type="object[]">
  Thông số trình cài đặt tùy chọn được giao diện Skills của macOS sử dụng (brew/node/go/uv/download).
</ParamField>

Nếu không có `metadata.openclaw`, kỹ năng luôn đủ điều kiện (trừ khi
bị tắt trong cấu hình hoặc bị `skills.allowBundled` chặn đối với kỹ năng đi kèm).

<Note>
Các khối `metadata.clawdbot` cũ vẫn được chấp nhận khi
không có `metadata.openclaw`, để các kỹ năng đã cài đặt cũ hơn vẫn giữ
các cổng phụ thuộc và gợi ý trình cài đặt của chúng. Kỹ năng mới và được cập nhật nên dùng
`metadata.openclaw`.
</Note>

### Ghi chú về sandbox

- `requires.bins` được kiểm tra trên **máy chủ** tại thời điểm tải kỹ năng.
- Nếu một agent chạy trong sandbox, binary cũng phải tồn tại **bên trong container**. Cài đặt nó qua `agents.defaults.sandbox.docker.setupCommand` (hoặc một image tùy chỉnh). `setupCommand` chạy một lần sau khi container được tạo. Việc cài đặt gói cũng yêu cầu egress mạng, root FS có thể ghi và người dùng root trong sandbox.
- Ví dụ: kỹ năng `summarize` (`skills/summarize/SKILL.md`) cần CLI `summarize` trong container sandbox để chạy ở đó.

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
    - Nếu có nhiều trình cài đặt được liệt kê, Gateway chọn một tùy chọn ưu tiên duy nhất (brew khi có sẵn, nếu không thì node).
    - Nếu tất cả trình cài đặt đều là `download`, OpenClaw liệt kê từng mục để bạn có thể xem các artifact hiện có.
    - Thông số trình cài đặt có thể bao gồm `os: ["darwin"|"linux"|"win32"]` để lọc tùy chọn theo nền tảng.
    - Cài đặt Node tôn trọng `skills.install.nodeManager` trong `openclaw.json` (mặc định: npm; tùy chọn: npm/pnpm/yarn/bun). Điều này chỉ ảnh hưởng đến cài đặt kỹ năng; runtime Gateway vẫn nên là Node - Bun không được khuyến nghị cho WhatsApp/Telegram.
    - Việc chọn trình cài đặt do Gateway hậu thuẫn dựa trên ưu tiên: khi thông số cài đặt trộn nhiều loại, OpenClaw ưu tiên Homebrew khi `skills.install.preferBrew` được bật và `brew` tồn tại, sau đó là `uv`, rồi trình quản lý node đã cấu hình, rồi các phương án dự phòng khác như `go` hoặc `download`.
    - Nếu mọi thông số cài đặt đều là `download`, OpenClaw hiển thị tất cả tùy chọn tải xuống thay vì thu gọn thành một trình cài đặt ưu tiên.

  </Accordion>
  <Accordion title="Chi tiết theo từng trình cài đặt">
    - **Cài đặt Go:** nếu thiếu `go` và có `brew`, gateway cài đặt Go qua Homebrew trước và đặt `GOBIN` thành `bin` của Homebrew khi có thể.
    - **Cài đặt tải xuống:** `url` (bắt buộc), `archive` (`tar.gz` | `tar.bz2` | `zip`), `extract` (mặc định: tự động khi phát hiện archive), `stripComponents`, `targetDir` (mặc định: `~/.openclaw/tools/<skillKey>`).

  </Accordion>
</AccordionGroup>

## Ghi đè cấu hình

Kỹ năng đi kèm và kỹ năng được quản lý có thể được bật/tắt và được cung cấp giá trị môi trường
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
  `false` tắt kỹ năng ngay cả khi kỹ năng đó được đi kèm hoặc đã cài đặt.
  Kỹ năng `coding-agent` đi kèm là tùy chọn tham gia: đặt
  `skills.entries.coding-agent.enabled: true` trước khi hiển thị nó cho agent,
  rồi đảm bảo một trong `claude`, `codex`, `opencode`, hoặc `pi` đã được cài đặt và
  xác thực cho CLI riêng của nó.
</ParamField>
<ParamField path="apiKey" type='string | { source, provider, id }'>
  Tiện ích cho các kỹ năng khai báo `metadata.openclaw.primaryEnv`. Hỗ trợ văn bản thuần hoặc SecretRef.
</ParamField>
<ParamField path="env" type="Record<string, string>">
  Chỉ được tiêm nếu biến chưa được đặt trong tiến trình.
</ParamField>
<ParamField path="config" type="object">
  Túi tùy chọn cho các trường tùy chỉnh theo từng kỹ năng. Khóa tùy chỉnh phải nằm ở đây.
</ParamField>
<ParamField path="allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho kỹ năng **đi kèm**. Nếu được đặt, chỉ các kỹ năng đi kèm trong danh sách mới đủ điều kiện (kỹ năng được quản lý/không gian làm việc không bị ảnh hưởng).
</ParamField>

Nếu tên kỹ năng chứa dấu gạch nối, hãy đặt khóa trong dấu ngoặc kép (JSON5 cho phép
khóa có dấu ngoặc kép). Khóa cấu hình mặc định khớp với **tên kỹ năng** - nếu một kỹ năng
định nghĩa `metadata.openclaw.skillKey`, hãy dùng khóa đó trong `skills.entries`.

<Note>
Để tạo/chỉnh sửa hình ảnh có sẵn bên trong OpenClaw, hãy dùng công cụ lõi
`image_generate` với `agents.defaults.imageGenerationModel` thay vì
một kỹ năng đi kèm. Các ví dụ kỹ năng ở đây dành cho workflow tùy chỉnh hoặc bên thứ ba.
Để phân tích hình ảnh gốc, hãy dùng công cụ `image` với
`agents.defaults.imageModel`. Nếu bạn chọn `openai/*`, `google/*`,
`fal/*`, hoặc một mô hình hình ảnh dành riêng cho nhà cung cấp khác, hãy thêm khóa
xác thực/API của nhà cung cấp đó nữa.
</Note>

## Tiêm môi trường

Khi một lượt chạy agent bắt đầu, OpenClaw:

1. Đọc siêu dữ liệu kỹ năng.
2. Áp dụng `skills.entries.<key>.env` và `skills.entries.<key>.apiKey` vào `process.env`.
3. Xây dựng system prompt với các kỹ năng **đủ điều kiện**.
4. Khôi phục môi trường ban đầu sau khi lượt chạy kết thúc.

Tiêm môi trường được **giới hạn trong lượt chạy agent**, không phải môi trường shell
toàn cục.

Đối với backend `claude-cli` đi kèm, OpenClaw cũng vật chất hóa cùng
ảnh chụp đủ điều kiện dưới dạng Plugin Claude Code tạm thời và truyền nó bằng
`--plugin-dir`. Claude Code sau đó có thể dùng trình phân giải kỹ năng gốc của nó trong khi
OpenClaw vẫn sở hữu thứ tự ưu tiên, danh sách cho phép theo từng agent, gating, và
tiêm khóa môi trường/API `skills.entries.*`. Các backend CLI khác chỉ dùng
danh mục prompt.

## Ảnh chụp và làm mới

OpenClaw chụp ảnh các kỹ năng đủ điều kiện **khi một phiên bắt đầu** và
tái sử dụng danh sách đó cho các lượt tiếp theo trong cùng phiên. Thay đổi đối với
kỹ năng hoặc cấu hình có hiệu lực ở phiên mới tiếp theo.

Kỹ năng có thể làm mới giữa phiên trong hai trường hợp:

- Trình theo dõi kỹ năng được bật.
- Một node từ xa đủ điều kiện mới xuất hiện.

Hãy xem đây là **hot reload**: danh sách đã làm mới được sử dụng ở
lượt agent tiếp theo. Nếu danh sách cho phép kỹ năng agent hiệu lực thay đổi cho
phiên đó, OpenClaw làm mới ảnh chụp để các kỹ năng hiển thị luôn khớp
với agent hiện tại.

### Trình theo dõi Skills

Theo mặc định, OpenClaw theo dõi các thư mục kỹ năng và tăng ảnh chụp kỹ năng
khi tệp `SKILL.md` thay đổi. Cấu hình trong `skills.load`:

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

Dùng `allowSymlinkTargets` cho các bố cục sibling-repo có chủ ý, nơi root
kỹ năng tích hợp chứa symlink, ví dụ
`~/.agents/skills/manager -> ~/Projects/manager/skills`. Danh sách đích được
khớp sau khi phân giải realpath và nên được giữ hẹp.

### Node macOS từ xa (gateway Linux)

Nếu Gateway chạy trên Linux nhưng một **node macOS** được kết nối với
`system.run` được cho phép (bảo mật Exec approvals không đặt thành `deny`),
OpenClaw có thể xem các kỹ năng chỉ dành cho macOS là đủ điều kiện khi các
binary bắt buộc có trên node đó. Agent nên thực thi các kỹ năng đó
qua công cụ `exec` với `host=node`.

Điều này dựa trên việc node báo cáo hỗ trợ lệnh của nó và trên probe bin
qua `system.which` hoặc `system.run`. Node ngoại tuyến **không** làm
hiển thị các kỹ năng chỉ từ xa. Nếu một node đã kết nối ngừng phản hồi các
probe bin, OpenClaw xóa các kết quả khớp bin đã lưu trong cache của nó để agent không còn thấy
các kỹ năng hiện không thể chạy ở đó.

## Tác động token

Khi các kỹ năng đủ điều kiện, OpenClaw tiêm một danh sách XML gọn về các
kỹ năng có sẵn vào system prompt (qua `formatSkillsForPrompt` trong
`pi-coding-agent`). Chi phí là xác định:

- **Chi phí cơ sở** (chỉ khi ≥1 kỹ năng): 195 ký tự.
- **Mỗi kỹ năng:** 97 ký tự + độ dài của các giá trị `<name>`, `<description>`, và `<location>` đã được XML-escape.

Công thức (ký tự):

```text
total = 195 + Σ (97 + len(name_escaped) + len(description_escaped) + len(location_escaped))
```

XML escaping mở rộng `& < > " '` thành các entity (`&amp;`, `&lt;`, v.v.),
làm tăng độ dài. Số lượng token thay đổi theo tokenizer của mô hình. Ước tính thô
kiểu OpenAI là ~4 ký tự/token, nên **97 ký tự ≈ 24 token** cho mỗi
kỹ năng cộng với độ dài trường thực tế của bạn.

## Vòng đời kỹ năng được quản lý

OpenClaw cung cấp một tập kỹ năng cơ sở dưới dạng **kỹ năng đi kèm** cùng
bản cài đặt (gói npm hoặc OpenClaw.app). `~/.openclaw/skills` tồn tại cho
ghi đè cục bộ - ví dụ, ghim hoặc vá một kỹ năng mà không
thay đổi bản sao đi kèm. Kỹ năng trong không gian làm việc thuộc sở hữu người dùng và ghi đè
cả hai khi xung đột tên.

## Tìm thêm kỹ năng?

Duyệt [https://clawhub.ai](https://clawhub.ai). Lược đồ cấu hình đầy đủ:
[Cấu hình Skills](/vi/tools/skills-config).

## Liên quan

- [ClawHub](/vi/clawhub) - registry kỹ năng công khai
- [Tạo kỹ năng](/vi/tools/creating-skills) - xây dựng kỹ năng tùy chỉnh
- [Plugins](/vi/tools/plugin) - tổng quan hệ thống Plugin
- [Plugin Skill Workshop](/vi/plugins/skill-workshop) - tạo kỹ năng từ công việc của agent
- [Cấu hình Skills](/vi/tools/skills-config) - tham chiếu cấu hình kỹ năng
- [Lệnh slash](/vi/tools/slash-commands) - tất cả lệnh slash có sẵn
