---
read_when:
    - 配置技能加载、安装或门控行为
    - 设置每个 Agent 的 Skills 可见性
    - 调整 Skill Workshop 限制或审批策略
sidebarTitle: Skills config
summary: skills.* 配置 schema、Agent 允许列表、workshop 设置和沙箱环境变量处理的完整参考。
title: Skills 配置
x-i18n:
    generated_at: "2026-07-05T11:46:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0ed1ec20aa102b458a9485a1ada1bb7566c97d28b1f43caa28f52b3f5bdc381e
    source_path: tools/skills-config.md
    workflow: 16
---

大多数 Skills 配置位于
`~/.openclaw/openclaw.json` 中的 `skills` 下。智能体特定的可见性位于
`agents.defaults.skills` 和 `agents.list[].skills` 下。

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
  加核心 `image_generate` 工具，而不是 `skills.entries`。Skill
  条目仅用于自定义或第三方 skill 工作流。
</Note>

## 加载（`skills.load`）

<ParamField path="skills.load.extraDirs" type="string[]">
  要扫描的其他 skill 目录，优先级最低（低于内置和插件 skills）。
  路径会展开，并支持 `~`。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  受信任的真实目标目录，符号链接的 skill 文件夹可以解析到这些目录中，
  即使符号链接位于已配置根目录之外。将它用于有意设计的相邻仓库布局，
  例如 `<workspace>/skills/manager -> ~/Projects/manager/skills`。
  保持此列表范围狭窄，不要指向像 `~` 或 `~/Projects` 这样的宽泛根目录。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  监视 skill 文件夹，并在 `SKILL.md` 文件更改时刷新 skills 快照。
  覆盖分组 skill 根目录下的嵌套文件。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill 监视器事件的去抖窗口，单位为毫秒。
</ParamField>

## 安装（`skills.install`）

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  当 `brew` 可用时，优先使用 Homebrew 安装器。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill 安装的 Node 包管理器偏好。此设置只影响 skill
  安装；Gateway 网关运行时仍应使用 Node（不建议将 Bun 用于
  WhatsApp/Telegram）。`openclaw setup --node-manager` 和
  `openclaw onboard --node-manager` 接受 `npm`、`pnpm` 或 `bun`；
  如需 Yarn 支持的 skill 安装，请直接在配置中设置 `"yarn"`。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  允许受信任的 `operator.admin` Gateway 网关客户端安装通过
  `skills.upload.*` 暂存的私有 zip 归档。普通 ClawHub 安装不需要此设置。
</ParamField>

## 操作员安装策略（`security.installPolicy`）

当操作员需要一个受信任的本地命令，用主机特定策略批准或阻止 skill
和插件安装时，请使用 `security.installPolicy`。该策略会在 OpenClaw
暂存源材料之后、安装或更新继续之前运行。它适用于 ClawHub skills、上传的
skills、Git/本地 skills、skill 依赖安装器，以及插件安装/更新源。

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
  启用操作员拥有的安装策略。启用后如果没有有效的 `exec`
  命令，安装会失败关闭。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  可选的目标过滤器。省略时，策略会应用于每个受支持目标，
  这样新的安装不会意外失败开放。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  受信任策略可执行文件的绝对路径。OpenClaw 会不经 shell 运行它，
  并在使用前验证路径。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  在 `command` 之后传入的静态参数。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  单次策略决策的最大挂钟运行时间。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  策略失败关闭前，stdout 或 stderr 没有输出的最长时间。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  从策略进程接受的 stdout 和 stderr 合计最大字节数。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  提供给策略进程的字面量环境变量。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  从 OpenClaw 进程复制到策略进程的环境变量名称。只传递已命名的变量。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  可选的目录允许列表，这些目录可以包含策略可执行文件。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  绕过命令路径所有权和权限检查。仅当该路径受另一种机制保护时使用。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  允许配置的命令路径是符号链接。解析后的目标仍必须满足其他路径检查。
  解释器脚本参数必须是直接的普通文件，而不是符号链接。
</ParamField>

该策略会在 stdin 上接收一个 JSON 对象，其中包含 `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
可选的结构化 `source`、结构化 `origin` 和 `request`。它必须在 stdout
上写入一个 JSON 对象：`{ "protocolVersion": 1, "decision": "allow" }`
或 `{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。
非零退出、超时、格式错误的 JSON、缺少字段或不受支持的协议版本都会失败关闭。

OpenClaw 不会在普通 Gateway 网关启动期间执行安装策略。
当策略已启用但不可用时，安装和更新会失败关闭。
`openclaw doctor` 会执行静态验证；`openclaw doctor --deep`
会针对配置的命令执行一次合成安装探测。

批量更新会按目标应用策略：被阻止的 skill 或插件更新会让该目标失败，
但不会禁用策略，也不会跳过批次中的后续目标。

示例 stdin：

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

## 内置 skill 允许列表

<ParamField path="skills.allowBundled" type="string[]">
  仅用于**内置** skills 的可选允许列表。设置后，只有列表中的内置
  skills 符合条件。托管、智能体级别和工作区 skills 不受影响。
</ParamField>

## 按 skill 条目（`skills.entries`）

默认情况下，`entries` 下的键匹配 skill 的 `name`。如果某个 skill
定义了 `metadata.openclaw.skillKey`，请改用该键。带连字符的名称需要加引号
（JSON5 允许带引号的键）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  即使 skill 是内置或已安装，`false` 也会禁用该 skill。
  `coding-agent` 内置 skill 是选择启用的：将它设置为 `true`，
  并确保已安装并认证 `claude`、`codex`、`opencode`
  或另一个受支持的 CLI。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  供声明 `metadata.openclaw.primaryEnv` 的 skills 使用的便捷字段。
  支持明文字符串或 SecretRef：`{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  为智能体运行注入的环境变量。仅当进程中尚未设置该变量时才会注入。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  用于自定义按 skill 配置字段的可选包。
</ParamField>

## 智能体允许列表（`agents`）

当你希望同一台机器/工作区 skill 根目录下，每个智能体可见的 skill
集合不同时，请使用智能体配置。

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
  由省略 `agents.list[].skills` 的智能体继承的共享基线允许列表。
  完全省略可让 skills 默认不受限制。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  该智能体的显式最终 skill 集合。显式列表会**替换**继承的默认值，
  不会合并。设置为 `[]` 可不向该智能体暴露任何 skills。
</ParamField>

<Warning>
  智能体 skill 允许列表是 OpenClaw skill 发现、提示、斜杠命令发现、
  沙箱同步和 skill 快照的可见性与加载过滤器。它们不是 shell
  执行时的授权边界。如果某个智能体可以运行主机 `exec`，该 shell
  仍然可以运行外部客户端，或读取对执行用户可见的主机文件，包括 MCP
  客户端注册表，例如 `~/.openclaw/skills/config/mcporter.json`。
  对于按智能体的 MCP 隔离，请将 skill 允许列表与沙箱/OS 用户隔离结合使用，
  拒绝或严格允许列出主机 exec，并优先在 MCP 服务器上使用按智能体凭证。
</Warning>

## Workshop（`skills.workshop`）

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  当为 `true` 时，智能体可以在成功轮次后，根据持久对话信号创建待处理提案。
  用户提示的技能创建始终会通过 Skill Workshop，不受此设置影响。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` 要求在智能体发起的应用、拒绝或隔离之前获得操作员批准。
  `auto` 允许这些操作无需批准。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  允许 Skill Workshop 应用写入工作区技能符号链接指向的目标，前提是其真实目标已由
  `skills.load.allowSymlinkTargets` 信任。除非生成的提案应用应修改该共享技能根目录，
  否则请保持禁用。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  每个工作区保留的待处理和已隔离提案的最大数量（允许范围：1-200）。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案正文的最大大小（以字节为单位，允许范围：1024-200000）。提案描述单独硬性限制为
  160 字节，因为它们会出现在发现和列表输出中。
</ParamField>

请参阅 [Skill Workshop](/zh-CN/tools/skill-workshop)，了解此配置控制的提案生命周期、CLI
命令、智能体工具参数和 Gateway 网关方法。

## 符号链接的技能根目录

默认情况下，工作区、项目智能体、额外目录和内置技能根目录都是包含边界。
`<workspace>/skills` 下解析到根目录之外的符号链接技能文件夹会被跳过，并记录一条日志消息。

要允许有意使用的符号链接布局，请声明受信任目标：

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

使用此配置时，`<workspace>/skills/manager -> ~/Projects/manager/skills`
会在 realpath 解析后被接受。`extraDirs` 会直接扫描同级仓库；
`allowSymlinkTargets` 会为现有布局保留符号链接路径。

默认情况下，Skill Workshop 应用不会通过这些符号链接写入。若要让 Workshop 应用修改
已受信任符号链接目标下的技能，请单独选择启用：

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

托管的 `~/.openclaw/skills` 和个人 `~/.agents/skills` 目录已经无条件接受技能目录符号链接
（每个技能的 `SKILL.md` 包含规则仍然适用）— `allowSymlinkTargets` 仅对工作区、
额外目录和项目智能体（`<workspace>/.agents/skills`）根目录需要。

## 沙箱隔离的技能和环境变量

<Warning>
  `skills.entries.<skill>.env` 和 `apiKey` 仅适用于**主机**运行。
  在沙箱内它们不起作用 — 依赖 `GEMINI_API_KEY` 的技能会因
  `apiKey not configured` 失败，除非单独向沙箱提供该变量。
</Warning>

通过以下方式将密钥传入 Docker 沙箱：

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
  拥有 Docker 守护进程访问权限的用户可以通过 Docker 元数据检查 `sandbox.docker.env` 值。
  当这种暴露不可接受时，请使用挂载的密钥文件、自定义镜像或其他交付路径。
</Note>

## 加载顺序提醒

```text
workspace/skills      (highest)
workspace/.agents/skills
~/.agents/skills
~/.openclaw/skills
bundled skills
skills.load.extraDirs (lowest)
```

启用 watcher 时，对技能和配置的更改会在下一个新会话生效；或者当 watcher 检测到更改时，
在下一个智能体轮次生效。

## 相关

<CardGroup cols={2}>
  <Card title="Skills 参考" href="/zh-CN/tools/skills" icon="puzzle-piece">
    什么是技能、加载顺序、门控和 SKILL.md 格式。
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
