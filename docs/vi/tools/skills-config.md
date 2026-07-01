---
read_when:
    - Đang cấu hình hành vi tải, cài đặt hoặc kiểm soát Skills
    - Thiết lập khả năng hiển thị kỹ năng theo từng agent
    - Điều chỉnh giới hạn hoặc chính sách phê duyệt của Skill Workshop
sidebarTitle: Skills config
summary: Tham chiếu đầy đủ cho schema cấu hình skills.*, danh sách cho phép của tác nhân, cài đặt workshop và cách xử lý biến môi trường sandbox.
title: Cấu hình Skills
x-i18n:
    generated_at: "2026-07-01T08:13:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

Phần lớn cấu hình Skills nằm dưới `skills` trong
`~/.openclaw/openclaw.json`. Khả năng hiển thị theo từng tác nhân nằm dưới
`agents.defaults.skills` và `agents.list[].skills`.

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm",
      allowUploadedArchives: false,
    },
    workshop: {
      autonomous: { enabled: false },
      allowSymlinkTargetWrites: false,
      approvalPolicy: "pending",
      maxPending: 50,
      maxSkillBytes: 40000,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" },
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

<Note>
  Với tính năng tạo hình ảnh tích hợp sẵn, hãy dùng `agents.defaults.imageGenerationModel`
  cùng với công cụ lõi `image_generate` thay vì `skills.entries`. Các mục nhập Skill
  chỉ dành cho quy trình Skill tùy chỉnh hoặc của bên thứ ba.
</Note>

## Tải (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Các thư mục Skill bổ sung cần quét, ở mức ưu tiên thấp nhất (sau Skills đóng gói
  và Skills của Plugin). Đường dẫn được mở rộng với hỗ trợ `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Các thư mục đích thực đáng tin cậy mà thư mục Skill dạng symlink có thể trỏ tới,
  ngay cả khi symlink nằm ngoài gốc đã cấu hình. Dùng tùy chọn này cho
  các bố cục repo anh em có chủ đích, chẳng hạn như
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Giữ danh sách này
  thật hẹp — không trỏ tới các gốc rộng như `~` hoặc `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Theo dõi các thư mục Skill và làm mới bản chụp Skills khi các tệp `SKILL.md`
  thay đổi. Bao phủ các tệp lồng nhau dưới các gốc Skill được nhóm.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Khoảng debounce cho các sự kiện trình theo dõi Skill, tính bằng mili giây.
</ParamField>

## Cài đặt (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Ưu tiên trình cài đặt Homebrew khi có sẵn `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Tùy chọn trình quản lý gói Node cho việc cài đặt Skill. Điều này chỉ ảnh hưởng đến
  việc cài đặt Skill — runtime Gateway vẫn nên dùng Node (không khuyến nghị Bun
  cho WhatsApp/Telegram). Dùng `openclaw setup --node-manager` cho npm, pnpm,
  hoặc bun; đặt `"yarn"` thủ công cho các cài đặt Skill dựa trên Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Cho phép các client Gateway `operator.admin` đáng tin cậy cài đặt kho lưu trữ zip
  riêng tư đã được chuẩn bị qua `skills.upload.*`. Các cài đặt ClawHub thông thường
  không cần thiết lập này.
</ParamField>

## Chính sách cài đặt của người vận hành (`security.installPolicy`)

Dùng `security.installPolicy` khi người vận hành cần một lệnh cục bộ đáng tin cậy để
phê duyệt hoặc chặn việc cài đặt Skill và Plugin bằng chính sách theo từng máy chủ.
Chính sách chạy sau khi OpenClaw đã chuẩn bị tài liệu nguồn và trước khi việc cài đặt
hoặc cập nhật tiếp tục. Chính sách áp dụng cho Skills ClawHub, Skills đã tải lên,
Skills từ Git/cục bộ, trình cài đặt phụ thuộc của Skill, và nguồn cài đặt/cập nhật Plugin.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Omit targets to cover every supported target.
      targets: ["skill", "plugin"],
      exec: {
        source: "exec",
        command: "/usr/local/bin/openclaw-install-policy",
        args: ["--json"],
        timeoutMs: 10000,
        noOutputTimeoutMs: 10000,
        maxOutputBytes: 1048576,
        passEnv: ["OPENCLAW_STATE_DIR", "PATH"],
        env: { POLICY_MODE: "strict" },
        trustedDirs: ["/usr/local/bin"],
      },
    },
  },
}
```

<ParamField path="security.installPolicy.enabled" type="boolean" default="false">
  Bật chính sách cài đặt do người vận hành sở hữu. Khi được bật mà không có lệnh `exec`
  hợp lệ, các cài đặt sẽ thất bại theo hướng đóng.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Bộ lọc mục tiêu tùy chọn. Khi bỏ qua, chính sách áp dụng cho mọi mục tiêu được hỗ trợ
  để các cài đặt mới không bất ngờ mở khi thất bại.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Đường dẫn tuyệt đối tới tệp thực thi chính sách đáng tin cậy. OpenClaw chạy nó mà không dùng
  shell và xác thực đường dẫn trước khi sử dụng.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Các đối số tĩnh được truyền sau `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Thời gian chạy thực tế tối đa cho một quyết định chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Thời gian tối đa không có đầu ra stdout hoặc stderr trước khi chính sách thất bại theo hướng đóng.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Tổng số byte stdout và stderr tối đa được chấp nhận từ tiến trình chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Các biến môi trường dạng literal được cung cấp cho tiến trình chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Tên biến môi trường được sao chép từ tiến trình OpenClaw vào tiến trình chính sách.
  Chỉ các biến được đặt tên mới được truyền.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Danh sách cho phép tùy chọn gồm các thư mục có thể chứa tệp thực thi chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Bỏ qua các kiểm tra quyền sở hữu và quyền của đường dẫn lệnh. Chỉ dùng khi đường dẫn
  được bảo vệ bằng một cơ chế khác.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Cho phép đường dẫn lệnh đã cấu hình là symlink. Đích đã phân giải vẫn phải
  đáp ứng các kiểm tra đường dẫn khác. Đối số script của trình thông dịch phải là
  tệp thông thường trực tiếp, không phải symlink.
</ParamField>

Chính sách nhận một đối tượng JSON trên stdin với `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` có cấu trúc tùy chọn, `origin` có cấu trúc, và `request`. Nó phải ghi
một đối tượng JSON trên stdout: `{ "protocolVersion": 1, "decision": "allow" }` hoặc
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Thoát khác 0,
hết thời gian chờ, JSON sai định dạng, thiếu trường, hoặc phiên bản giao thức không được hỗ trợ
đều thất bại theo hướng đóng.

OpenClaw không thực thi chính sách cài đặt trong quá trình khởi động Gateway thông thường.
Các cài đặt và cập nhật thất bại theo hướng đóng khi chính sách được bật nhưng không khả dụng.
`openclaw doctor` thực hiện xác thực tĩnh, và `openclaw doctor --deep` thực thi một phép kiểm tra
cài đặt tổng hợp đối với lệnh đã cấu hình.

Cập nhật hàng loạt áp dụng chính sách theo từng mục tiêu: bản cập nhật Skill hoặc Plugin bị chặn
sẽ thất bại cho mục tiêu đó mà không vô hiệu hóa chính sách hoặc bỏ qua các mục tiêu sau trong lô.

Ví dụ stdin:

```json
{
  "protocolVersion": 1,
  "openclawVersion": "2026.6.1",
  "targetType": "skill",
  "targetName": "weather",
  "sourcePath": "/var/folders/.../openclaw-skill-clawhub/root",
  "sourcePathKind": "directory",
  "source": {
    "kind": "clawhub",
    "authority": "openclaw",
    "mutable": false,
    "network": true
  },
  "origin": {
    "type": "clawhub",
    "registry": "https://clawhub.openclaw.ai",
    "slug": "weather",
    "version": "1.0.0"
  },
  "request": {
    "kind": "skill-install",
    "mode": "install",
    "requestedSpecifier": "clawhub:weather@1.0.0"
  },
  "skill": {
    "installId": "clawhub"
  }
}
```

Lệnh chính sách tối giản:

```js
#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const request = JSON.parse(input);
  if (request.targetType === "plugin" && request.source?.kind === "local-path") {
    process.stdout.write(
      JSON.stringify({
        protocolVersion: 1,
        decision: "block",
        reason: "local plugin paths are not approved on this host",
      }),
    );
    return;
  }
  process.stdout.write(JSON.stringify({ protocolVersion: 1, decision: "allow" }));
});
```

## Danh sách cho phép Skill đóng gói

<ParamField path="skills.allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho Skills **đóng gói**. Khi được đặt, chỉ Skills đóng gói
  trong danh sách mới đủ điều kiện. Skills được quản lý, cấp tác nhân, và trong workspace
  không bị ảnh hưởng.
</ParamField>

## Mục nhập theo từng Skill (`skills.entries`)

Các khóa dưới `entries` mặc định khớp với `name` của Skill. Nếu một Skill định nghĩa
`metadata.openclaw.skillKey`, hãy dùng khóa đó thay thế. Đặt tên có dấu gạch nối trong dấu ngoặc kép
(JSON5 cho phép khóa được trích dẫn).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` vô hiệu hóa Skill ngay cả khi được đóng gói hoặc đã cài đặt. Skill đóng gói `coding-agent`
  là opt-in — đặt nó thành `true` và bảo đảm đã cài đặt và xác thực một trong `claude`,
  `codex`, `opencode`, hoặc CLI được hỗ trợ khác.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Trường tiện ích cho Skills khai báo `metadata.openclaw.primaryEnv`.
  Hỗ trợ chuỗi văn bản thuần hoặc SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Các biến môi trường được tiêm vào cho lần chạy tác nhân. Chỉ được tiêm khi
  biến chưa được đặt trong tiến trình.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Túi tùy chọn cho các trường cấu hình tùy chỉnh theo từng Skill.
</ParamField>

## Danh sách cho phép tác nhân (`agents`)

Dùng cấu hình tác nhân khi bạn muốn dùng cùng gốc Skill của máy/workspace nhưng có
một tập Skill hiển thị khác nhau cho từng tác nhân.

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

<ParamField path="agents.defaults.skills" type="string[]">
  Danh sách cho phép cơ sở dùng chung được kế thừa bởi các tác nhân bỏ qua `agents.list[].skills`.
  Bỏ qua hoàn toàn để mặc định không hạn chế Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Tập Skill cuối cùng rõ ràng cho tác nhân đó. Danh sách rõ ràng **thay thế** mặc định
  được kế thừa — chúng không hợp nhất. Đặt thành `[]` để không hiển thị Skill nào cho tác nhân đó.
</ParamField>

<Warning>
  Danh sách cho phép Skill của tác nhân là bộ lọc khả năng hiển thị và tải cho quá trình khám phá Skill
  của OpenClaw, prompt, khám phá lệnh gạch chéo, đồng bộ sandbox, và bản chụp Skill.
  Chúng không phải là ranh giới ủy quyền tại thời điểm shell. Nếu một tác nhân có thể
  chạy `exec` trên máy chủ, shell đó vẫn có thể chạy các client bên ngoài hoặc đọc tệp máy chủ
  mà người dùng thực thi có thể thấy, bao gồm registry client MCP như
  `~/.openclaw/skills/config/mcporter.json`. Để cô lập MCP theo từng tác nhân,
  hãy kết hợp danh sách cho phép Skill với cô lập sandbox/người dùng hệ điều hành, từ chối hoặc
  giới hạn chặt chẽ `exec` trên máy chủ, và ưu tiên thông tin xác thực theo từng tác nhân tại MCP server.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Khi là `true`, tác nhân có thể tạo các đề xuất đang chờ từ tín hiệu hội thoại bền vững
  sau các lượt chạy thành công. Việc tạo Skill do người dùng yêu cầu luôn đi qua Skill Workshop
  bất kể thiết lập này.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` yêu cầu người vận hành phê duyệt trước khi agent khởi tạo thao tác áp dụng, từ chối hoặc
  cách ly. `auto` cho phép các hành động đó mà không cần phê duyệt.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Cho phép thao tác áp dụng của Skill Workshop ghi qua các symlink skill trong không gian làm việc mà
  đích thực đã được `skills.load.allowSymlinkTargets` tin cậy. Giữ tùy chọn này
  tắt trừ khi các thao tác áp dụng đề xuất được tạo nên thay đổi gốc skill dùng chung đó.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Số lượng tối đa các đề xuất đang chờ và bị cách ly được giữ lại trên mỗi không gian làm việc.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Kích thước thân đề xuất tối đa tính bằng byte. Mô tả đề xuất bị giới hạn cứng ở
  160 byte vì chúng xuất hiện trong đầu ra khám phá và liệt kê.
</ParamField>

## Các gốc skill được symlink

Theo mặc định, các gốc skill của không gian làm việc, project-agent, extra-dir và gói kèm là
ranh giới chứa. Một thư mục skill được symlink trong `<workspace>/skills`
mà phân giải ra ngoài gốc sẽ bị bỏ qua kèm một thông báo nhật ký.

Để cho phép bố cục symlink có chủ ý, hãy khai báo đích tin cậy:

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

Với cấu hình này, `<workspace>/skills/manager -> ~/Projects/manager/skills` được
chấp nhận sau khi phân giải realpath. `extraDirs` quét trực tiếp repo cùng cấp;
`allowSymlinkTargets` giữ nguyên đường dẫn symlink cho các bố cục hiện có.

Theo mặc định, thao tác áp dụng của Skill Workshop không ghi qua các symlink đó. Để cho phép
Workshop áp dụng thay đổi skills dưới các đích symlink đã được tin cậy, hãy bật riêng:

```json5
{
  skills: {
    load: {
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
    workshop: {
      allowSymlinkTargetWrites: true,
    },
  },
}
```

Các thư mục `~/.openclaw/skills` được quản lý và `~/.agents/skills` cá nhân
đã chấp nhận symlink thư mục skill (việc chứa `SKILL.md` theo từng skill vẫn
được áp dụng).

## Skill trong sandbox và biến môi trường

<Warning>
  `skills.entries.<skill>.env` và `apiKey` chỉ áp dụng cho các lượt chạy trên **host**. Bên trong
  sandbox, chúng không có hiệu lực — một skill phụ thuộc vào `GEMINI_API_KEY` sẽ
  thất bại với lỗi `apiKey not configured` trừ khi sandbox được cấp biến đó
  riêng.
</Warning>

Truyền bí mật vào sandbox Docker bằng:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          env: { GEMINI_API_KEY: "your-key-here" },
        },
      },
    },
  },
}
```

<Note>
  Người dùng có quyền truy cập daemon Docker có thể kiểm tra các giá trị `sandbox.docker.env`
  thông qua metadata Docker. Hãy dùng một tệp bí mật được mount, một image tùy chỉnh hoặc
  một đường dẫn phân phối khác khi mức lộ diện đó không chấp nhận được.
</Note>

## Nhắc lại thứ tự tải

```text
workspace/skills      (cao nhất)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
skills gói kèm
skills.load.extraDirs (thấp nhất)
```

Các thay đổi đối với skills và cấu hình có hiệu lực vào phiên mới tiếp theo khi
watcher được bật, hoặc vào lượt agent tiếp theo khi watcher phát hiện thay đổi.

## Liên quan

<CardGroup cols={2}>
  <Card title="Tham chiếu Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Skills là gì, thứ tự tải, gating và định dạng SKILL.md.
  </Card>
  <Card title="Tạo skills" href="/vi/tools/creating-skills" icon="hammer">
    Soạn thảo skills tùy chỉnh cho không gian làm việc.
  </Card>
  <Card title="Skill Workshop" href="/vi/tools/skill-workshop" icon="flask">
    Hàng đợi đề xuất cho skills do agent phác thảo.
  </Card>
  <Card title="Lệnh slash" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh slash gốc và chỉ thị chat.
  </Card>
</CardGroup>
