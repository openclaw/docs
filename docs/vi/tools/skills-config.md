---
read_when:
    - Cấu hình hành vi tải, cài đặt hoặc kiểm soát quyền truy cập Skills
    - Thiết lập khả năng hiển thị Skills theo từng tác nhân
    - Điều chỉnh giới hạn hoặc chính sách phê duyệt của Skill Workshop
sidebarTitle: Skills config
summary: Tài liệu tham khảo đầy đủ về lược đồ cấu hình skills.*, danh sách cho phép của tác tử, các thiết lập workshop và cách xử lý biến môi trường của sandbox.
title: Cấu hình Skills
x-i18n:
    generated_at: "2026-07-12T08:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

Hầu hết cấu hình Skills nằm trong `skills` tại
`~/.openclaw/openclaw.json`. Phạm vi hiển thị dành riêng cho từng tác nhân nằm trong
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
  Để tạo hình ảnh tích hợp sẵn, hãy sử dụng `agents.defaults.imageGenerationModel`
  cùng công cụ lõi `image_generate` thay vì `skills.entries`. Các mục Skills
  chỉ dành cho quy trình Skills tùy chỉnh hoặc của bên thứ ba.
</Note>

## Tải (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Các thư mục Skills bổ sung cần quét, có mức ưu tiên thấp nhất (thấp hơn
  Skills đi kèm và Skills của Plugin). Đường dẫn được mở rộng với hỗ trợ `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Các thư mục đích thực đáng tin cậy mà thư mục Skills liên kết tượng trưng có thể
  phân giải tới, ngay cả khi liên kết tượng trưng nằm ngoài thư mục gốc đã cấu hình. Hãy dùng tùy chọn này cho
  các bố cục kho lưu trữ ngang hàng có chủ đích, chẳng hạn như
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Giữ danh sách này
  ở phạm vi hẹp — không trỏ tới các thư mục gốc rộng như `~` hoặc `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Theo dõi các thư mục Skills và làm mới ảnh chụp Skills khi các tệp `SKILL.md`
  thay đổi. Bao gồm các tệp lồng nhau trong các thư mục gốc Skills được nhóm.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Khoảng chống dội cho sự kiện trình theo dõi Skills, tính bằng mili giây.
</ParamField>

## Cài đặt (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Ưu tiên trình cài đặt Homebrew khi có sẵn `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Trình quản lý gói Node ưu tiên khi cài đặt Skills. Tùy chọn này chỉ ảnh hưởng đến việc
  cài đặt Skills — môi trường chạy Gateway vẫn nên dùng Node (không
  khuyến nghị Bun cho WhatsApp/Telegram). `openclaw setup --node-manager` và
  `openclaw onboard --node-manager` chấp nhận `npm`, `pnpm` hoặc `bun`; đặt
  trực tiếp `"yarn"` trong cấu hình để cài đặt Skills dựa trên Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Cho phép các máy khách Gateway `operator.admin` đáng tin cậy cài đặt kho lưu trữ zip
  riêng tư được đưa vào vùng tạm thông qua `skills.upload.*`. Các lượt cài đặt ClawHub thông thường không
  cần thiết lập này.
</ParamField>

## Chính sách cài đặt của người vận hành (`security.installPolicy`)

Sử dụng `security.installPolicy` khi người vận hành cần một lệnh cục bộ đáng tin cậy để
phê duyệt hoặc chặn việc cài đặt Skills và Plugin theo chính sách dành riêng cho máy chủ. Chính sách
chạy sau khi OpenClaw đã đưa vật liệu nguồn vào vùng tạm và trước khi quá trình cài đặt
hoặc cập nhật tiếp tục. Chính sách áp dụng cho Skills từ ClawHub, Skills được tải lên, Skills từ Git/cục bộ,
trình cài đặt phần phụ thuộc của Skills và các nguồn cài đặt/cập nhật Plugin.

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
  hợp lệ, quá trình cài đặt sẽ đóng để bảo toàn an toàn.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Bộ lọc đích tùy chọn. Khi bị bỏ qua, chính sách áp dụng cho mọi đích được hỗ trợ
  để các lượt cài đặt mới không bất ngờ mở cho phép khi lỗi.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Đường dẫn tuyệt đối tới tệp thực thi chính sách đáng tin cậy. OpenClaw chạy tệp này mà không dùng
  trình bao và xác thực đường dẫn trước khi sử dụng.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Các đối số tĩnh được truyền sau `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Thời gian chạy theo đồng hồ thực tối đa cho một quyết định chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Thời gian tối đa không có đầu ra stdout hoặc stderr trước khi chính sách
  đóng để bảo toàn an toàn.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Số byte stdout và stderr kết hợp tối đa được chấp nhận từ tiến trình chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Các biến môi trường dạng chữ được cung cấp cho tiến trình chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Tên các biến môi trường được sao chép từ tiến trình OpenClaw sang
  tiến trình chính sách. Chỉ các biến được nêu tên mới được truyền.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Danh sách cho phép tùy chọn gồm các thư mục có thể chứa tệp thực thi chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Bỏ qua việc kiểm tra quyền sở hữu và quyền truy cập của đường dẫn lệnh. Chỉ sử dụng khi
  đường dẫn được bảo vệ bằng một cơ chế khác.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Cho phép đường dẫn lệnh đã cấu hình là một liên kết tượng trưng. Đích đã phân giải
  vẫn phải đáp ứng các kiểm tra đường dẫn khác. Các đối số tập lệnh của trình thông dịch phải
  là tệp thông thường trực tiếp, không phải liên kết tượng trưng.
</ParamField>

Chính sách nhận một đối tượng JSON trên stdin với `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` có cấu trúc tùy chọn, `origin` có cấu trúc và `request`. Chính sách phải
ghi một đối tượng JSON trên stdout: `{ "protocolVersion": 1, "decision": "allow" }`
hoặc `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Mã thoát khác 0,
hết thời gian chờ, JSON không đúng định dạng, thiếu trường hoặc phiên bản giao thức
không được hỗ trợ đều khiến hệ thống đóng để bảo toàn an toàn.

OpenClaw không thực thi chính sách cài đặt trong quá trình khởi động Gateway thông thường.
Việc cài đặt và cập nhật sẽ đóng để bảo toàn an toàn khi chính sách được bật nhưng không khả dụng.
`openclaw doctor` thực hiện xác thực tĩnh; `openclaw doctor --deep`
thực thi một phép thăm dò cài đặt mô phỏng đối với lệnh đã cấu hình.

Các lượt cập nhật hàng loạt áp dụng chính sách cho từng đích: một bản cập nhật Skills hoặc Plugin bị chặn sẽ làm
đích đó thất bại mà không vô hiệu hóa chính sách hoặc bỏ qua các đích tiếp theo trong
lô.

Ví dụ về stdin:

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

## Danh sách cho phép Skills đi kèm

<ParamField path="skills.allowBundled" type="string[]">
  Danh sách cho phép tùy chọn chỉ dành cho Skills **đi kèm**. Khi được đặt, chỉ Skills đi kèm
  trong danh sách mới đủ điều kiện. Skills được quản lý, ở cấp tác nhân và trong không gian làm việc
  không bị ảnh hưởng.
</ParamField>

## Các mục theo từng Skills (`skills.entries`)

Theo mặc định, các khóa trong `entries` khớp với `name` của Skills. Nếu một Skills định nghĩa
`metadata.openclaw.skillKey`, hãy dùng khóa đó thay thế. Đặt tên có dấu gạch nối
trong dấu ngoặc kép (JSON5 cho phép khóa có dấu ngoặc kép).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` vô hiệu hóa Skills ngay cả khi được đi kèm hoặc đã cài đặt. Skills đi kèm
  `coding-agent` yêu cầu bật rõ ràng — hãy đặt thành `true` và bảo đảm một trong
  `claude`, `codex`, `opencode` hoặc một CLI được hỗ trợ khác đã được cài đặt và
  xác thực.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Trường tiện ích dành cho Skills khai báo `metadata.openclaw.primaryEnv`.
  Hỗ trợ chuỗi văn bản thuần hoặc SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Các biến môi trường được chèn vào lượt chạy của tác nhân. Chỉ được chèn khi biến
  chưa được đặt trong tiến trình.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Túi tùy chọn dành cho các trường cấu hình tùy chỉnh theo từng Skills.
</ParamField>

## Danh sách cho phép của tác nhân (`agents`)

Sử dụng cấu hình tác nhân khi bạn muốn dùng cùng các thư mục gốc Skills của máy/không gian làm việc nhưng có
tập hợp Skills hiển thị khác nhau cho từng tác nhân.

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
  Danh sách cho phép cơ sở dùng chung được kế thừa bởi các tác nhân bỏ qua
  `agents.list[].skills`. Bỏ hẳn để mặc định không hạn chế Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Tập hợp Skills cuối cùng được chỉ định rõ cho tác nhân đó. Các danh sách được chỉ định rõ **thay thế**
  giá trị mặc định được kế thừa — chúng không hợp nhất. Đặt thành `[]` để không hiển thị Skills nào cho
  tác nhân đó.
</ParamField>

<Warning>
  Danh sách cho phép Skills của tác nhân là bộ lọc hiển thị và tải dành cho hoạt động khám phá Skills,
  lời nhắc, khám phá lệnh gạch chéo, đồng bộ hộp cát và ảnh chụp Skills của OpenClaw.
  Chúng không phải là ranh giới ủy quyền tại thời điểm chạy trình bao. Nếu một tác nhân
  có thể chạy `exec` trên máy chủ, trình bao đó vẫn có thể chạy các máy khách bên ngoài hoặc đọc
  các tệp trên máy chủ mà người dùng thực thi có thể truy cập, bao gồm các sổ đăng ký máy khách MCP
  như `~/.openclaw/skills/config/mcporter.json`. Để cô lập MCP theo từng tác nhân,
  hãy kết hợp danh sách cho phép Skills với việc cô lập hộp cát/người dùng hệ điều hành,
  từ chối hoặc giới hạn nghiêm ngặt `exec` trên máy chủ bằng danh sách cho phép, đồng thời ưu tiên thông tin xác thực
  riêng cho từng tác nhân tại máy chủ MCP.
</Warning>

## Xưởng (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Khi là `true`, các tác nhân có thể tạo đề xuất đang chờ xử lý từ các tín hiệu
  hội thoại bền vững sau những lượt thực hiện thành công. Việc tạo skill theo
  yêu cầu của người dùng luôn thông qua Skill Workshop bất kể cài đặt này.
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` yêu cầu người vận hành phê duyệt trước khi tác nhân khởi tạo thao tác
  áp dụng, từ chối hoặc cách ly. `auto` cho phép các thao tác đó mà không cần
  phê duyệt.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Cho phép thao tác áp dụng của Skill Workshop ghi thông qua các liên kết tượng
  trưng skill trong không gian làm việc có đích thực đã được
  `skills.load.allowSymlinkTargets` tin cậy. Giữ tùy chọn này ở trạng thái tắt
  trừ khi việc áp dụng đề xuất đã tạo cần sửa đổi thư mục gốc skill dùng chung đó.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Số lượng tối đa các đề xuất đang chờ xử lý và bị cách ly được giữ lại trên mỗi
  không gian làm việc (phạm vi cho phép: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Kích thước tối đa của nội dung đề xuất tính bằng byte (phạm vi cho phép:
  1024-200000). Phần mô tả đề xuất được giới hạn cứng riêng ở 160 byte vì chúng
  xuất hiện trong đầu ra khám phá và liệt kê.
</ParamField>

Xem [Skill Workshop](/vi/tools/skill-workshop) để biết vòng đời đề xuất, các lệnh
CLI, tham số công cụ của tác nhân và các phương thức Gateway do cấu hình này
kiểm soát.

## Thư mục gốc skill dùng liên kết tượng trưng

Theo mặc định, các thư mục gốc skill của không gian làm việc, tác nhân dự án,
thư mục bổ sung và skill đi kèm là các ranh giới giới hạn. Một thư mục skill
dùng liên kết tượng trưng trong `<workspace>/skills` phân giải ra ngoài thư mục
gốc sẽ bị bỏ qua kèm theo thông báo nhật ký.

Để cho phép một bố cục liên kết tượng trưng có chủ đích, hãy khai báo đích
được tin cậy:

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

Với cấu hình này, `<workspace>/skills/manager -> ~/Projects/manager/skills`
được chấp nhận sau khi phân giải đường dẫn thực. `extraDirs` quét trực tiếp
kho lưu trữ ngang hàng; `allowSymlinkTargets` duy trì đường dẫn liên kết tượng
trưng cho các bố cục hiện có.

Theo mặc định, thao tác áp dụng của Skill Workshop không ghi thông qua các liên
kết tượng trưng đó. Để cho phép thao tác áp dụng của Workshop sửa đổi các skill
trong những đích liên kết tượng trưng đã được tin cậy, hãy bật riêng tùy chọn:

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

Các thư mục `~/.openclaw/skills` được quản lý và `~/.agents/skills` cá nhân đã
chấp nhận vô điều kiện các liên kết tượng trưng đến thư mục skill (quy tắc giới
hạn `SKILL.md` theo từng skill vẫn được áp dụng) — `allowSymlinkTargets` chỉ cần
thiết cho các thư mục gốc của không gian làm việc, thư mục bổ sung và tác nhân
dự án (`<workspace>/.agents/skills`).

## Skill trong sandbox và biến môi trường

<Warning>
  `skills.entries.<skill>.env` và `apiKey` chỉ áp dụng cho các lần chạy trên
  **máy chủ**. Bên trong sandbox, chúng không có hiệu lực — một skill phụ thuộc
  vào `GEMINI_API_KEY` sẽ thất bại với `apiKey not configured` trừ khi sandbox
  được cung cấp riêng biến này.
</Warning>

Truyền thông tin bí mật vào sandbox Docker bằng:

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
  Người dùng có quyền truy cập trình nền Docker có thể kiểm tra các giá trị
  `sandbox.docker.env` thông qua siêu dữ liệu Docker. Hãy dùng tệp bí mật được
  gắn kết, ảnh tùy chỉnh hoặc phương thức phân phối khác khi mức độ lộ thông tin
  đó không thể chấp nhận được.
</Note>

## Nhắc lại thứ tự tải

```text
workspace/skills      (cao nhất)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
các skill đi kèm
skills.load.extraDirs (thấp nhất)
```

Các thay đổi đối với skill và cấu hình có hiệu lực trong phiên mới tiếp theo
khi trình theo dõi được bật, hoặc trong lượt tác nhân tiếp theo khi trình theo
dõi phát hiện thay đổi.

## Liên quan

<CardGroup cols={2}>
  <Card title="Tài liệu tham khảo về skill" href="/vi/tools/skills" icon="puzzle-piece">
    Khái niệm skill, thứ tự tải, kiểm soát điều kiện và định dạng SKILL.md.
  </Card>
  <Card title="Tạo skill" href="/vi/tools/creating-skills" icon="hammer">
    Biên soạn skill tùy chỉnh cho không gian làm việc.
  </Card>
  <Card title="Skill Workshop" href="/vi/tools/skill-workshop" icon="flask">
    Hàng đợi đề xuất dành cho các skill do tác nhân soạn thảo.
  </Card>
  <Card title="Lệnh dấu gạch chéo" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh dấu gạch chéo gốc và các chỉ thị trò chuyện.
  </Card>
</CardGroup>
