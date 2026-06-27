---
read_when:
    - Cấu hình hành vi tải, cài đặt hoặc kiểm soát Skills
    - Đặt khả năng hiển thị Skills cho từng agent
    - Điều chỉnh giới hạn Skill Workshop hoặc chính sách phê duyệt
sidebarTitle: Skills config
summary: Tài liệu tham khảo đầy đủ cho schema cấu hình skills.*, danh sách cho phép của agent, cài đặt workshop và cách xử lý biến môi trường sandbox.
title: Cấu hình Skills
x-i18n:
    generated_at: "2026-06-27T18:18:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c1ba6beb1e06e7090dd6669320a91893bf26abe71633914e7564aebb59c637f
    source_path: tools/skills-config.md
    workflow: 16
---

Phần lớn cấu hình Skills nằm dưới `skills` trong
`~/.openclaw/openclaw.json`. Khả năng hiển thị theo từng tác tử nằm dưới
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
  Với tính năng tạo ảnh tích hợp sẵn, hãy dùng `agents.defaults.imageGenerationModel`
  cùng công cụ lõi `image_generate` thay vì `skills.entries`. Các mục Skills
  chỉ dành cho quy trình Skills tùy chỉnh hoặc của bên thứ ba.
</Note>

## Tải (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Các thư mục Skills bổ sung để quét, ở mức ưu tiên thấp nhất (sau Skills tích hợp sẵn
  và Skills của Plugin). Đường dẫn được mở rộng với hỗ trợ `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Các thư mục đích thực đáng tin cậy mà thư mục Skills dạng symlink có thể trỏ tới,
  ngay cả khi symlink nằm ngoài gốc đã cấu hình. Dùng mục này cho
  các bố cục repo anh em có chủ ý, chẳng hạn như
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Giữ danh sách này
  thật hẹp — không trỏ tới các gốc rộng như `~` hoặc `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Theo dõi các thư mục Skills và làm mới bản chụp nhanh Skills khi các tệp `SKILL.md`
  thay đổi. Bao gồm các tệp lồng nhau dưới các gốc Skills được nhóm.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Khoảng debounce cho sự kiện trình theo dõi Skills, tính bằng mili giây.
</ParamField>

## Cài đặt (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Ưu tiên trình cài đặt Homebrew khi có `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Tùy chọn trình quản lý gói Node cho cài đặt Skills. Mục này chỉ ảnh hưởng tới
  cài đặt Skills — runtime Gateway vẫn nên dùng Node (Bun không được khuyến nghị
  cho WhatsApp/Telegram). Dùng `openclaw setup --node-manager` cho npm, pnpm,
  hoặc bun; đặt `"yarn"` thủ công cho cài đặt Skills dựa trên Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Cho phép các máy khách Gateway `operator.admin` đáng tin cậy cài đặt kho lưu trữ zip
  riêng tư đã được dàn dựng qua `skills.upload.*`. Cài đặt ClawHub thông thường không
  cần thiết lập này.
</ParamField>

## Chính sách cài đặt của người vận hành (`security.installPolicy`)

Dùng `security.installPolicy` khi người vận hành cần một lệnh cục bộ đáng tin cậy để
phê duyệt hoặc chặn cài đặt Skills và Plugin theo chính sách riêng của máy chủ. Chính sách
chạy sau khi OpenClaw đã dàn dựng tài liệu nguồn và trước khi quá trình cài đặt hoặc cập nhật
tiếp tục. Chính sách này áp dụng cho Skills ClawHub, Skills đã tải lên, Skills Git/cục bộ,
trình cài đặt phụ thuộc của Skills, và nguồn cài đặt/cập nhật Plugin.

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
  Bật chính sách cài đặt do người vận hành sở hữu. Khi bật mà không có lệnh `exec`
  hợp lệ, các cài đặt sẽ bị chặn theo mặc định.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Bộ lọc mục tiêu tùy chọn. Khi bỏ qua, chính sách áp dụng cho mọi mục tiêu được hỗ trợ
  để các cài đặt mới không bất ngờ được cho phép khi thiếu kiểm soát.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Đường dẫn tuyệt đối tới tệp thực thi chính sách đáng tin cậy. OpenClaw chạy nó mà không qua
  shell và xác thực đường dẫn trước khi dùng.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Các đối số tĩnh được truyền sau `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Thời gian chạy theo đồng hồ tối đa cho một quyết định chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Thời gian tối đa không có đầu ra stdout hoặc stderr trước khi chính sách bị chặn theo mặc định.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Số byte stdout và stderr kết hợp tối đa được chấp nhận từ tiến trình chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Các biến môi trường nguyên văn được cung cấp cho tiến trình chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Tên biến môi trường được sao chép từ tiến trình OpenClaw vào tiến trình chính sách.
  Chỉ các biến được nêu tên mới được truyền.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Danh sách cho phép tùy chọn gồm các thư mục có thể chứa tệp thực thi chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Bỏ qua kiểm tra quyền sở hữu và quyền của đường dẫn lệnh. Chỉ dùng khi đường dẫn
  được bảo vệ bằng một cơ chế khác.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Cho phép đường dẫn lệnh đã cấu hình là symlink. Đích đã phân giải vẫn phải
  đáp ứng các kiểm tra đường dẫn khác. Đối số script thông dịch phải là
  tệp thông thường trực tiếp, không phải symlink.
</ParamField>

Chính sách nhận một đối tượng JSON trên stdin với `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` có cấu trúc tùy chọn, `origin` có cấu trúc, và `request`. Chính sách phải ghi
một đối tượng JSON trên stdout: `{ "protocolVersion": 1, "decision": "allow" }` hoặc
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Thoát khác 0,
hết thời gian, JSON sai định dạng, thiếu trường, hoặc phiên bản giao thức không được hỗ trợ
đều bị chặn theo mặc định.

OpenClaw không thực thi chính sách cài đặt trong quá trình khởi động Gateway thông thường. Các cài đặt
và cập nhật bị chặn theo mặc định khi chính sách được bật nhưng không khả dụng. `openclaw doctor`
thực hiện xác thực tĩnh, và `openclaw doctor --deep` thực thi một
probe cài đặt giả lập với lệnh đã cấu hình.

Cập nhật hàng loạt áp dụng chính sách theo từng mục tiêu: một bản cập nhật Skills hoặc Plugin bị chặn sẽ làm lỗi
mục tiêu đó mà không tắt chính sách hoặc bỏ qua các mục tiêu sau trong lô.

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

Lệnh chính sách tối thiểu:

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

## Danh sách cho phép Skills tích hợp sẵn

<ParamField path="skills.allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho Skills **tích hợp sẵn**. Khi được đặt, chỉ Skills tích hợp sẵn
  trong danh sách mới đủ điều kiện. Skills được quản lý, cấp tác tử, và workspace
  không bị ảnh hưởng.
</ParamField>

## Mục theo từng Skills (`skills.entries`)

Các khóa dưới `entries` mặc định khớp với `name` của Skills. Nếu một Skills định nghĩa
`metadata.openclaw.skillKey`, hãy dùng khóa đó thay thế. Đặt tên có dấu gạch nối trong dấu nháy
(JSON5 cho phép khóa có dấu nháy).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` tắt Skills ngay cả khi được tích hợp sẵn hoặc đã cài đặt. Skills tích hợp sẵn `coding-agent`
  là opt-in — đặt thành `true` và bảo đảm một trong `claude`,
  `codex`, `opencode`, hoặc CLI được hỗ trợ khác đã được cài đặt và xác thực.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Trường tiện ích cho Skills khai báo `metadata.openclaw.primaryEnv`.
  Hỗ trợ chuỗi văn bản thuần hoặc SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Các biến môi trường được tiêm cho lượt chạy tác tử. Chỉ được tiêm khi
  biến chưa được đặt trong tiến trình.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Túi tùy chọn cho các trường cấu hình tùy chỉnh theo từng Skills.
</ParamField>

## Danh sách cho phép tác tử (`agents`)

Dùng cấu hình tác tử khi bạn muốn dùng cùng các gốc Skills trên máy/workspace nhưng
mỗi tác tử có một tập Skills hiển thị khác nhau.

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
  Danh sách cho phép cơ sở dùng chung được kế thừa bởi các tác tử bỏ qua `agents.list[].skills`.
  Bỏ qua hoàn toàn để mặc định không hạn chế Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Tập Skills cuối cùng rõ ràng cho tác tử đó. Danh sách rõ ràng **thay thế** mặc định
  được kế thừa — chúng không hợp nhất. Đặt thành `[]` để không hiển thị Skills nào cho tác tử đó.
</ParamField>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Khi `true`, tác tử có thể tạo đề xuất đang chờ từ các tín hiệu hội thoại bền vững
  sau các lượt thành công. Việc tạo Skills do người dùng nhắc luôn đi qua
  Skill Workshop bất kể thiết lập này.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` yêu cầu người vận hành phê duyệt trước khi áp dụng, từ chối, hoặc
  cách ly do tác tử khởi tạo. `auto` cho phép các hành động đó mà không cần phê duyệt.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Cho phép thao tác áp dụng của Skill Workshop ghi qua các symlink Skills trong workspace có
  đích thực đã được `skills.load.allowSymlinkTargets` tin cậy. Giữ mục này
  tắt trừ khi việc áp dụng đề xuất được tạo nên sửa đổi gốc Skills dùng chung đó.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Số lượng đề xuất đang chờ và bị cách ly tối đa được giữ lại trên mỗi workspace.
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Kích thước nội dung đề xuất tối đa tính bằng byte. Mô tả đề xuất bị giới hạn cứng ở
  160 byte vì chúng xuất hiện trong đầu ra khám phá và liệt kê.
</ParamField>

## Gốc skill được liên kết tượng trưng

Theo mặc định, các gốc skill của workspace, project-agent, extra-dir và skill đóng gói là
ranh giới containment. Một thư mục skill được liên kết tượng trưng dưới `<workspace>/skills`
phân giải ra ngoài gốc sẽ bị bỏ qua kèm một thông báo log.

Để cho phép một bố cục liên kết tượng trưng có chủ ý, hãy khai báo đích tin cậy:

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
chấp nhận sau khi phân giải realpath. `extraDirs` quét trực tiếp repo ngang hàng;
`allowSymlinkTargets` giữ nguyên đường dẫn được liên kết tượng trưng cho các bố cục hiện có.

Skill Workshop apply không ghi qua các liên kết tượng trưng đó theo mặc định. Để cho phép
Workshop apply thay đổi skill dưới các đích liên kết tượng trưng đã được tin cậy, hãy chọn tham gia
riêng:

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
đã chấp nhận liên kết tượng trưng tới thư mục skill (containment của `SKILL.md` theo từng skill vẫn
được áp dụng).

## Skill trong sandbox và biến môi trường

<Warning>
  `skills.entries.<skill>.env` và `apiKey` chỉ áp dụng cho các lần chạy trên **host**. Bên trong
  sandbox, chúng không có hiệu lực — một skill phụ thuộc vào `GEMINI_API_KEY` sẽ
  thất bại với `apiKey not configured` trừ khi sandbox được cấp biến đó
  riêng.
</Warning>

Truyền secret vào sandbox Docker bằng:

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
  thông qua metadata Docker. Hãy dùng một tệp secret được mount, một image tùy chỉnh, hoặc
  một đường dẫn phân phối khác khi mức lộ diện đó không chấp nhận được.
</Note>

## Nhắc lại thứ tự tải

```text
workspace/skills      (cao nhất)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
skill đóng gói
skills.load.extraDirs (thấp nhất)
```

Các thay đổi đối với skill và cấu hình có hiệu lực trong phiên mới tiếp theo khi
watcher được bật, hoặc trong lượt agent tiếp theo khi watcher phát hiện thay đổi.

## Liên quan

<CardGroup cols={2}>
  <Card title="Tham chiếu Skills" href="/vi/tools/skills" icon="puzzle-piece">
    Skill là gì, thứ tự tải, gating và định dạng SKILL.md.
  </Card>
  <Card title="Tạo skill" href="/vi/tools/creating-skills" icon="hammer">
    Biên soạn skill workspace tùy chỉnh.
  </Card>
  <Card title="Skill Workshop" href="/vi/tools/skill-workshop" icon="flask">
    Hàng đợi đề xuất cho skill do agent soạn nháp.
  </Card>
  <Card title="Lệnh slash" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh slash gốc và chỉ thị chat.
  </Card>
</CardGroup>
