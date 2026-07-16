---
read_when:
    - Cấu hình hành vi tải, cài đặt hoặc kiểm soát Skills
    - Thiết lập khả năng hiển thị Skills cho từng agent
    - Điều chỉnh giới hạn hoặc chính sách phê duyệt của Skill Workshop
sidebarTitle: Skills config
summary: Tài liệu tham khảo đầy đủ về lược đồ cấu hình skills.*, danh sách cho phép của tác tử, cài đặt workshop và cách xử lý biến môi trường sandbox.
title: Cấu hình Skills
x-i18n:
    generated_at: "2026-07-16T15:53:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1633364a7333ba00f5f6c8d6f1f478b65e63bc97de23705e492eb980967ec521
    source_path: tools/skills-config.md
    workflow: 16
---

Hầu hết cấu hình Skills nằm trong `skills` tại
`~/.openclaw/openclaw.json`. Khả năng hiển thị dành riêng cho từng agent nằm trong
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
      approvalPolicy: "auto",
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
  cùng với công cụ `image_generate` cốt lõi thay vì `skills.entries`. Các mục
  Skills chỉ dành cho quy trình Skills tùy chỉnh hoặc của bên thứ ba.
</Note>

## Tải (`skills.load`)

<ParamField path="skills.load.extraDirs" type="string[]">
  Các thư mục Skills bổ sung cần quét, có mức ưu tiên thấp nhất (thấp hơn
  Skills đi kèm và Skills của Plugin). Đường dẫn được mở rộng với hỗ trợ `~`.
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  Các thư mục đích thực, đáng tin cậy mà thư mục Skills dùng liên kết tượng trưng có thể
  phân giải tới, ngay cả khi liên kết tượng trưng nằm ngoài thư mục gốc đã cấu hình. Sử dụng tùy chọn này cho
  các bố cục kho lưu trữ ngang hàng có chủ đích như
  `<workspace>/skills/manager -> ~/Projects/manager/skills`. Giữ danh sách này
  ở phạm vi hẹp — không trỏ đến các thư mục gốc rộng như `~` hoặc `~/Projects`.
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  Theo dõi các thư mục Skills và làm mới ảnh chụp nhanh Skills khi các tệp `SKILL.md`
  thay đổi. Bao gồm các tệp lồng nhau trong các thư mục gốc Skills được nhóm.
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Khoảng thời gian chống dội cho các sự kiện theo dõi Skills, tính bằng mili giây.
</ParamField>

## Cài đặt (`skills.install`)

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  Ưu tiên trình cài đặt Homebrew khi có `brew`.
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Lựa chọn ưu tiên trình quản lý gói Node để cài đặt Skills. Tùy chọn này chỉ ảnh hưởng đến việc
  cài đặt Skills — CLI OpenClaw và môi trường chạy Gateway yêu cầu Node vì
  kho trạng thái chuẩn sử dụng `node:sqlite`. `openclaw setup --node-manager` và
  `openclaw onboard --node-manager` chấp nhận `npm`, `pnpm` hoặc `bun`; đặt
  `"yarn"` trực tiếp trong cấu hình để cài đặt Skills dựa trên Yarn.
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  Cho phép các máy khách Gateway `operator.admin` đáng tin cậy cài đặt kho lưu trữ zip riêng tư
  được đưa vào vùng tạm thông qua `skills.upload.*`. Các lượt cài đặt ClawHub thông thường không
  cần thiết lập này.
</ParamField>

## Chính sách cài đặt của người vận hành (`security.installPolicy`)

Sử dụng `security.installPolicy` khi người vận hành cần một lệnh cục bộ đáng tin cậy để
phê duyệt hoặc chặn việc cài đặt Skills và Plugin bằng chính sách dành riêng cho máy chủ. Chính sách
chạy sau khi OpenClaw đã đưa tài liệu nguồn vào vùng tạm và trước khi quá trình cài đặt
hoặc cập nhật tiếp tục. Chính sách áp dụng cho Skills ClawHub, Skills đã tải lên, Skills từ Git/cục bộ,
trình cài đặt phần phụ thuộc của Skills và các nguồn cài đặt/cập nhật Plugin.

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      // Bỏ qua targets để áp dụng cho mọi mục tiêu được hỗ trợ.
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
  hợp lệ, quá trình cài đặt sẽ đóng khi lỗi.
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  Bộ lọc mục tiêu tùy chọn. Khi bỏ qua, chính sách áp dụng cho mọi
  mục tiêu được hỗ trợ để các lượt cài đặt mới không bất ngờ mở khi lỗi.
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  Đường dẫn tuyệt đối đến tệp thực thi chính sách đáng tin cậy. OpenClaw chạy tệp này mà không dùng
  shell và xác thực đường dẫn trước khi sử dụng.
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  Các đối số tĩnh được truyền sau `command`.
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  Thời gian chạy theo đồng hồ thực tối đa cho một quyết định chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  Thời gian tối đa không có đầu ra stdout hoặc stderr trước khi chính sách
  đóng khi lỗi.
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  Số byte stdout và stderr kết hợp tối đa được chấp nhận từ tiến trình chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  Các biến môi trường dạng chữ được cung cấp cho tiến trình chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  Tên các biến môi trường được sao chép từ tiến trình OpenClaw vào
  tiến trình chính sách. Chỉ các biến được nêu tên mới được truyền.
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  Danh sách cho phép tùy chọn gồm các thư mục có thể chứa tệp thực thi chính sách.
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  Bỏ qua các bước kiểm tra quyền sở hữu và quyền truy cập của đường dẫn lệnh. Chỉ sử dụng khi
  đường dẫn được bảo vệ bằng một cơ chế khác.
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  Cho phép đường dẫn lệnh đã cấu hình là một liên kết tượng trưng. Đích đã phân giải
  vẫn phải đáp ứng các bước kiểm tra đường dẫn khác. Đối số tập lệnh của trình thông dịch phải
  là tệp thông thường trực tiếp, không phải liên kết tượng trưng.
</ParamField>

Chính sách nhận một đối tượng JSON trên stdin với `protocolVersion: 1`,
`openclawVersion`, `targetType`, `targetName`, `sourcePath`, `sourcePathKind`,
`source` có cấu trúc và tùy chọn, `origin` có cấu trúc và `request`. Chính sách phải
ghi một đối tượng JSON trên stdout: `{ "protocolVersion": 1, "decision": "allow" }`
hoặc `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`. Mã thoát khác 0,
hết thời gian chờ, JSON không hợp lệ, thiếu trường hoặc phiên bản giao thức
không được hỗ trợ đều khiến hệ thống đóng khi lỗi.

OpenClaw không thực thi chính sách cài đặt trong quá trình khởi động Gateway thông thường.
Các lượt cài đặt và cập nhật sẽ đóng khi lỗi nếu chính sách được bật nhưng không khả dụng.
`openclaw doctor` thực hiện xác thực tĩnh; `openclaw doctor --deep`
thực thi một phép thăm dò cài đặt mô phỏng đối với lệnh đã cấu hình.

Cập nhật hàng loạt áp dụng chính sách cho từng mục tiêu: một bản cập nhật Skills hoặc Plugin bị chặn sẽ làm
mục tiêu đó thất bại mà không vô hiệu hóa chính sách hoặc bỏ qua các mục tiêu sau trong
lô.

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
        reason: "đường dẫn plugin cục bộ không được phê duyệt trên máy chủ này",
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
  trong danh sách mới đủ điều kiện. Skills được quản lý, ở cấp agent và trong không gian làm việc
  không bị ảnh hưởng.
</ParamField>

## Mục dành cho từng Skills (`skills.entries`)

Theo mặc định, các khóa trong `entries` khớp với `name` của Skills. Nếu một Skills định nghĩa
`metadata.openclaw.skillKey`, hãy sử dụng khóa đó thay thế. Đặt tên có dấu gạch nối trong dấu ngoặc kép
(JSON5 cho phép khóa được đặt trong dấu ngoặc kép).

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  `false` vô hiệu hóa Skills ngay cả khi đi kèm hoặc đã cài đặt. Skills đi kèm
  `coding-agent` yêu cầu chủ động bật — đặt thành `true` và bảo đảm một trong
  `claude`, `codex`, `opencode` hoặc CLI được hỗ trợ khác đã được cài đặt và
  xác thực.
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  Trường tiện ích dành cho Skills khai báo `metadata.openclaw.primaryEnv`.
  Hỗ trợ chuỗi văn bản thuần hoặc SecretRef: `{ source: "env", provider: "default", id: "VAR_NAME" }`.
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  Các biến môi trường được chèn vào lượt chạy agent. Chỉ được chèn khi
  biến chưa được đặt trong tiến trình.
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  Đối tượng tùy chọn chứa các trường cấu hình tùy chỉnh cho từng Skills.
</ParamField>

## Danh sách cho phép của agent (`agents`)

Sử dụng cấu hình agent khi muốn dùng cùng các thư mục gốc Skills của máy/không gian làm việc nhưng
mỗi agent có một tập Skills hiển thị khác nhau.

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

<ParamField path="agents.defaults.skills" type="string[]">
  Danh sách cho phép cơ sở dùng chung được kế thừa bởi các agent bỏ qua
  `agents.list[].skills`. Bỏ qua hoàn toàn để mặc định không hạn chế
  Skills.
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  Tập Skills cuối cùng được chỉ định rõ cho agent đó. Các danh sách được chỉ định rõ sẽ **thay thế**
  giá trị mặc định được kế thừa — chúng không hợp nhất. Đặt thành `[]` để không hiển thị Skills nào cho
  agent đó.
</ParamField>

<Warning>
  Danh sách cho phép Skills của agent là bộ lọc khả năng hiển thị và tải cho hoạt động khám phá
  Skills, lời nhắc, khám phá lệnh gạch chéo, đồng bộ sandbox và ảnh chụp nhanh Skills
  của OpenClaw. Đây không phải là ranh giới ủy quyền tại thời điểm chạy shell. Nếu một agent
  có thể chạy `exec` trên máy chủ, shell đó vẫn có thể chạy các máy khách bên ngoài hoặc đọc
  các tệp máy chủ hiển thị với người dùng thực thi, bao gồm các sổ đăng ký máy khách MCP
  như `~/.openclaw/skills/config/mcporter.json`. Để
  cô lập MCP theo từng agent, hãy kết hợp danh sách cho phép Skills với cơ chế cô lập sandbox/người dùng hệ điều hành,
  từ chối hoặc giới hạn nghiêm ngặt quyền thực thi trên máy chủ bằng danh sách cho phép, đồng thời ưu tiên thông tin xác thực
  riêng cho từng agent tại máy chủ MCP.
</Warning>

## Workshop (`skills.workshop`)

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  Khi `true`, OpenClaw có thể tạo các đề xuất đang chờ xử lý từ những bản sửa lỗi bền vững
  và có thể xem xét công việc đáng kể đã hoàn thành thành công sau khi hệ thống
  chuyển sang trạng thái rảnh. Điều này có thể thêm một lượt chạy mô hình nền sau các lượt đủ điều kiện. Việc tạo
  skill theo yêu cầu của người dùng và `/learn` vẫn hoạt động khi cài đặt là `false`.
</ParamField>

Xem [Tự học](/tools/self-learning) để biết điều kiện đủ, quyền riêng tư, chi phí,
quyền chỉ dành cho đề xuất và cách khắc phục sự cố.

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"auto"'>
  `auto` cho phép tác nhân tự khởi tạo việc áp dụng, từ chối hoặc cách ly mà không cần
  thêm lời nhắc phê duyệt. `pending` yêu cầu người vận hành phê duyệt.
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  Cho phép thao tác áp dụng của Skill Workshop ghi thông qua các liên kết tượng trưng đến skill trong không gian làm việc có
  đích thực đã được `skills.load.allowSymlinkTargets` tin cậy. Hãy giữ
  tùy chọn này ở trạng thái tắt trừ khi việc áp dụng đề xuất được tạo cần sửa đổi thư mục gốc
  skill dùng chung đó.
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  Số lượng tối đa các đề xuất đang chờ xử lý và bị cách ly được giữ lại trên mỗi không gian làm việc (phạm vi
  cho phép: 1-200).
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  Kích thước nội dung đề xuất tối đa tính bằng byte (phạm vi cho phép: 1024-200000). Phần mô tả
  đề xuất được giới hạn cứng riêng ở 160 byte vì chúng xuất hiện
  trong kết quả khám phá và liệt kê.
</ParamField>

Xem [Skill Workshop](/vi/tools/skill-workshop) để biết vòng đời đề xuất, các lệnh CLI,
tham số công cụ tác nhân và các phương thức Gateway mà cấu hình này kiểm soát.

## Thư mục gốc skill dùng liên kết tượng trưng

Theo mặc định, các thư mục gốc skill của không gian làm việc, tác nhân dự án, thư mục bổ sung và skill đi kèm là
các ranh giới bao chứa. Một thư mục skill dùng liên kết tượng trưng bên dưới `<workspace>/skills`
mà phân giải ra bên ngoài thư mục gốc sẽ bị bỏ qua kèm theo thông báo nhật ký.

Để cho phép một bố cục liên kết tượng trưng có chủ đích, hãy khai báo đích đáng tin cậy:

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
được chấp nhận sau khi phân giải đường dẫn thực. `extraDirs` quét trực tiếp kho lưu trữ
cùng cấp; `allowSymlinkTargets` giữ nguyên đường dẫn dùng liên kết tượng trưng cho các bố cục
hiện có.

Theo mặc định, thao tác áp dụng của Skill Workshop không ghi thông qua các liên kết tượng trưng đó. Để
cho phép thao tác áp dụng của Workshop sửa đổi các skill bên dưới các đích liên kết tượng trưng đã được tin cậy, hãy
bật riêng tùy chọn này:

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
đã luôn chấp nhận vô điều kiện các liên kết tượng trưng đến thư mục skill (quy tắc bao chứa `SKILL.md`
theo từng skill vẫn được áp dụng) — `allowSymlinkTargets` chỉ cần thiết
cho các thư mục gốc của không gian làm việc, thư mục bổ sung và tác nhân dự án (`<workspace>/.agents/skills`).

## Skill trong sandbox và biến môi trường

<Warning>
  `skills.entries.<skill>.env` và `apiKey` chỉ áp dụng cho các lượt chạy trên **máy chủ**.
  Bên trong sandbox, chúng không có tác dụng — một skill phụ thuộc vào
  `GEMINI_API_KEY` sẽ thất bại với `apiKey not configured` trừ khi sandbox
  được cung cấp biến đó riêng.
</Warning>

Truyền các thông tin bí mật vào sandbox Docker bằng:

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
  thông qua siêu dữ liệu Docker. Hãy sử dụng tệp bí mật được gắn kết, ảnh tùy chỉnh hoặc
  một phương thức truyền khác khi mức độ lộ thông tin đó không thể chấp nhận được.
</Note>

## Nhắc lại thứ tự tải

```text
workspace/skills      (cao nhất)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
skill đi kèm
skills.load.extraDirs (thấp nhất)
```

Các thay đổi đối với skill và cấu hình có hiệu lực trong phiên mới tiếp theo khi
trình theo dõi được bật, hoặc trong lượt tác nhân tiếp theo khi trình theo dõi phát hiện
thay đổi.

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
  <Card title="Tự học" href="/tools/self-learning" icon="brain">
    Các đề xuất thận trọng, tự nguyện bật từ công việc đã hoàn thành.
  </Card>
  <Card title="Lệnh gạch chéo" href="/vi/tools/slash-commands" icon="terminal">
    Danh mục lệnh gạch chéo gốc và các chỉ thị trò chuyện.
  </Card>
</CardGroup>
