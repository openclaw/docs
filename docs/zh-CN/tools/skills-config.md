---
read_when:
    - 配置 Skills 的加载、安装或门控行为
    - 设置每个智能体的 Skills 可见性
    - 调整 Skill Workshop 限制或审批策略
sidebarTitle: Skills config
summary: skills.* 配置架构、智能体允许列表、工作坊设置和沙箱环境变量处理的完整参考。
title: Skills 配置
x-i18n:
    generated_at: "2026-07-11T21:02:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

大多数 Skills 配置位于 `~/.openclaw/openclaw.json` 的 `skills` 下。特定智能体的可见性配置位于 `agents.defaults.skills` 和 `agents.list[].skills` 下。

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
  对于内置图像生成，请使用 `agents.defaults.imageGenerationModel`
  和核心 `image_generate` 工具，而不是 `skills.entries`。Skill
  条目仅用于自定义或第三方 Skill 工作流。
</Note>

## 加载（`skills.load`）

<ParamField path="skills.load.extraDirs" type="string[]">
  要扫描的其他 Skill 目录，其优先级最低（低于内置 Skill 和插件
  Skill）。路径支持展开 `~`。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  受信任的真实目标目录；符号链接形式的 Skill 文件夹可以解析到这些目录，
  即使符号链接位于已配置根目录之外。此设置适用于有意采用的同级仓库布局，
  例如 `<workspace>/skills/manager -> ~/Projects/manager/skills`。请严格限制此列表
  的范围——不要指向 `~` 或 `~/Projects` 等宽泛的根目录。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  监视 Skill 文件夹，并在 `SKILL.md` 文件发生变化时刷新 Skills
  快照。涵盖分组 Skill 根目录下的嵌套文件。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill 监视器事件的防抖时间窗口，单位为毫秒。
</ParamField>

## 安装（`skills.install`）

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  当 `brew` 可用时，优先使用 Homebrew 安装程序。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  安装 Skill 时首选的 Node 包管理器。此设置仅影响 Skill
  安装——Gateway 网关运行时仍应使用 Node（不建议将 Bun
  用于 WhatsApp/Telegram）。`openclaw setup --node-manager` 和
  `openclaw onboard --node-manager` 接受 `npm`、`pnpm` 或 `bun`；如需使用
  Yarn 安装 Skill，请直接在配置中设置 `"yarn"`。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  允许受信任的 `operator.admin` Gateway 网关客户端安装通过
  `skills.upload.*` 暂存的私有 zip 归档。常规 ClawHub 安装不需要此设置。
</ParamField>

## 操作员安装策略（`security.installPolicy`）

当操作员需要通过受信任的本地命令，根据主机特定策略批准或阻止 Skill
和插件安装时，请使用 `security.installPolicy`。该策略会在 OpenClaw
暂存源材料之后、继续安装或更新之前运行。它适用于 ClawHub Skills、
上传的 Skills、Git/本地 Skills、Skill 依赖项安装程序，以及插件安装/更新源。

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
  启用操作员所有的安装策略。如果启用后未配置有效的 `exec`
  命令，安装将以关闭方式失败。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  可选的目标筛选器。省略时，策略将应用于所有受支持的目标，
  以免新的安装意外以开放方式失败。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  受信任策略可执行文件的绝对路径。OpenClaw 不通过 shell 运行该文件，
  并会在使用前验证路径。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  在 `command` 之后传递的静态参数。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  单次策略决策允许的最长实际运行时间。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  在策略以关闭方式失败之前，标准输出或标准错误无任何输出所允许的最长时间。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  策略进程可输出的标准输出和标准错误合计最大字节数。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  提供给策略进程的字面环境变量。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  从 OpenClaw 进程复制到策略进程的环境变量名称。仅传递已命名的变量。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  可包含策略可执行文件的可选目录允许列表。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  绕过命令路径所有权和权限检查。仅当该路径受到其他机制保护时使用。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  允许配置的命令路径为符号链接。解析后的目标仍必须通过其他路径检查。
  解释器脚本参数必须是直接的常规文件，不能是符号链接。
</ParamField>

策略通过标准输入接收一个 JSON 对象，其中包含 `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
可选的结构化 `source`、结构化 `origin` 和 `request`。它必须向标准输出
写入一个 JSON 对象：`{ "protocolVersion": 1, "decision": "allow" }`
或 `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。非零退出、
超时、格式错误的 JSON、缺少字段或不受支持的协议版本均会导致以关闭方式失败。

OpenClaw 在 Gateway 网关正常启动期间不会执行安装策略。启用策略但策略不可用时，
安装和更新将以关闭方式失败。`openclaw doctor` 执行静态验证；
`openclaw doctor --deep` 会针对配置的命令执行一次模拟安装探测。

批量更新会对每个目标分别应用策略：某个 Skill 或插件的更新被阻止时，
该目标会失败，但不会禁用策略，也不会跳过批次中的后续目标。

标准输入示例：

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

最小策略命令：

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

## 内置 Skill 允许列表

<ParamField path="skills.allowBundled" type="string[]">
  仅适用于**内置** Skill 的可选允许列表。设置后，只有列表中的内置
  Skill 才符合使用条件。托管式、智能体级和工作区 Skills 不受影响。
</ParamField>

## 各 Skill 条目（`skills.entries`）

默认情况下，`entries` 下的键与 Skill 的 `name` 匹配。如果某个 Skill
定义了 `metadata.openclaw.skillKey`，请改用该键。包含连字符的名称需要加引号
（JSON5 允许使用带引号的键）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  即使 Skill 已内置或安装，`false` 也会将其禁用。内置的
  `coding-agent` Skill 需要主动启用——将其设置为 `true`，并确保已安装
  `claude`、`codex`、`opencode` 或其他受支持的 CLI 之一，且已完成身份验证。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  面向声明了 `metadata.openclaw.primaryEnv` 的 Skills 的便捷字段。
  支持明文字符串或 SecretRef：`{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  为智能体运行注入的环境变量。仅当进程中尚未设置该变量时才注入。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  用于自定义各 Skill 配置字段的可选容器。
</ParamField>

## 智能体允许列表（`agents`）

当你希望同一台计算机或同一工作区使用相同的 Skill 根目录，
但每个智能体可见的 Skill 集不同，请使用智能体配置。

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
  由省略 `agents.list[].skills` 的智能体继承的共享基准允许列表。
  完全省略此项时，默认不限制 Skills。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  该智能体最终使用的明确 Skill 集。明确列表会**替换**继承的默认值，
  而不是与其合并。设置为 `[]` 可不向该智能体公开任何 Skills。
</ParamField>

<Warning>
  智能体 Skill 允许列表是 OpenClaw 对 Skill 设备发现、提示词、斜杠命令发现、
  沙箱同步和 Skill 快照的可见性与加载筛选器。它们不是 shell 执行时的授权边界。
  如果智能体可以运行主机 `exec`，该 shell 仍可运行外部客户端或读取执行用户
  可见的主机文件，包括 `~/.openclaw/skills/config/mcporter.json` 等 MCP
  客户端注册表。若要实现每智能体 MCP 隔离，请将 Skill 允许列表与沙箱/操作系统
  用户隔离结合使用，禁止主机 exec 或对其采用严格的允许列表，并优先在 MCP
  服务器上使用每智能体凭据。
</Warning>

## Workshop（`skills.workshop`）

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  设为 `true` 时，智能体可在成功完成轮次后，根据持久的对话信号创建待处理提案。无论此设置为何，由用户提示触发的技能创建始终通过 Skill Workshop 进行。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` 要求在应用、拒绝或隔离由智能体发起的提案前获得操作员批准。`auto` 允许在未经批准的情况下执行这些操作。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  允许 Skill Workshop 在应用提案时，通过工作区技能符号链接写入其真实目标，前提是该目标已受 `skills.load.allowSymlinkTargets` 信任。除非应用生成的提案时应修改该共享技能根目录，否则请保持禁用。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  每个工作区保留的待处理和已隔离提案的最大数量（允许范围：1-200）。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案正文的最大字节数（允许范围：1024-200000）。提案描述另有 160 字节的硬性上限，因为它们会出现在发现和列表输出中。
</ParamField>

有关此配置控制的提案生命周期、CLI 命令、智能体工具参数和 Gateway 网关方法，请参阅 [Skill Workshop](/zh-CN/tools/skill-workshop)。

## 使用符号链接的技能根目录

默认情况下，工作区、项目智能体、额外目录和内置技能根目录都是包含边界。`<workspace>/skills` 下解析到根目录之外的符号链接技能文件夹会被跳过，并记录一条日志消息。

要允许有意设计的符号链接布局，请声明受信任的目标：

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

使用此配置后，`<workspace>/skills/manager -> ~/Projects/manager/skills` 会在解析真实路径后被接受。`extraDirs` 直接扫描同级仓库；`allowSymlinkTargets` 则为现有布局保留使用符号链接的路径。

默认情况下，Skill Workshop 在应用提案时不会通过这些符号链接写入。要允许 Workshop 在应用提案时修改已受信任的符号链接目标下的技能，请单独选择启用：

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

托管的 `~/.openclaw/skills` 和个人 `~/.agents/skills` 目录已无条件接受技能目录符号链接（仍会对每个技能应用 `SKILL.md` 包含限制）— 仅工作区、额外目录和项目智能体（`<workspace>/.agents/skills`）根目录需要 `allowSymlinkTargets`。

## 沙箱隔离的技能和环境变量

<Warning>
  `skills.entries.<skill>.env` 和 `apiKey` 仅适用于**主机**运行。在沙箱中，它们不起作用；依赖 `GEMINI_API_KEY` 的技能会因 `apiKey not configured` 而失败，除非单独为沙箱提供该变量。
</Warning>

通过以下配置将机密传入 Docker 沙箱：

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
  拥有 Docker 守护进程访问权限的用户可以通过 Docker 元数据检查 `sandbox.docker.env` 的值。如果无法接受这种暴露方式，请使用挂载的机密文件、自定义镜像或其他传递路径。
</Note>

## 加载顺序提醒

```text
workspace/skills      (最高)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
内置技能
skills.load.extraDirs (最低)
```

启用监视器后，对技能和配置的更改会在下一个新会话中生效；监视器检测到更改时，则会在智能体的下一个轮次中生效。

## 相关内容

<CardGroup cols={2}>
  <Card title="Skills 参考" href="/zh-CN/tools/skills" icon="puzzle-piece">
    Skills 的定义、加载顺序、门控和 SKILL.md 格式。
  </Card>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    编写自定义工作区技能。
  </Card>
  <Card title="Skill Workshop" href="/zh-CN/tools/skill-workshop" icon="flask">
    用于智能体起草技能的提案队列。
  </Card>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="terminal">
    原生斜杠命令目录和聊天指令。
  </Card>
</CardGroup>
