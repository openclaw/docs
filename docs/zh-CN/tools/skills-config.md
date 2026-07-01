---
read_when:
    - 配置技能加载、安装或门控行为
    - 设置每个智能体的技能可见性
    - 调整 Skill Workshop 限制或审批策略
sidebarTitle: Skills config
summary: Skills.* 配置 schema、Agent allowlist、workshop 设置以及沙箱环境变量处理的完整参考。
title: Skills 配置
x-i18n:
    generated_at: "2026-07-01T05:28:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37251cd12162c3083b8b9e1a84c462233eb44656a84ca915705859a352c9557b
    source_path: tools/skills-config.md
    workflow: 16
---

大多数 Skills 配置位于
`~/.openclaw/openclaw.json` 中的 `skills` 下。Agent 专属可见性位于
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
  加上核心 `image_generate` 工具，而不是 `skills.entries`。Skill
  条目仅用于自定义或第三方 Skill 工作流。
</Note>

## 加载（`skills.load`）

<ParamField path="skills.load.extraDirs" type="string[]">
  要扫描的额外 Skill 目录，优先级最低（在内置和插件
  Skills 之后）。路径会展开并支持 `~`。
</ParamField>

<ParamField path="skills.load.allowSymlinkTargets" type="string[]">
  受信任的真实目标目录，符号链接的 Skill 文件夹可以解析到这些目录，
  即使符号链接位于已配置根目录之外。将它用于有意设计的同级仓库布局，
  例如
  `<workspace>/skills/manager -> ~/Projects/manager/skills`。保持此列表
  精确，不要指向 `~` 或 `~/Projects` 这类宽泛根目录。
</ParamField>

<ParamField path="skills.load.watch" type="boolean" default="true">
  监视 Skill 文件夹，并在 `SKILL.md` 文件
  变更时刷新 Skills 快照。覆盖分组 Skill 根目录下的嵌套文件。
</ParamField>

<ParamField path="skills.load.watchDebounceMs" type="number" default="250">
  Skill 监视器事件的防抖窗口，单位为毫秒。
</ParamField>

## 安装（`skills.install`）

<ParamField path="skills.install.preferBrew" type="boolean" default="true">
  当 `brew` 可用时，优先使用 Homebrew 安装器。
</ParamField>

<ParamField path="skills.install.nodeManager" type='"npm" | "pnpm" | "yarn" | "bun"' default='"npm"'>
  Skill 安装所用的 Node 包管理器偏好。此设置仅影响 Skill
  安装，Gateway 网关运行时仍应使用 Node（不建议将 Bun
  用于 WhatsApp/Telegram）。对 npm、pnpm
  或 bun 使用 `openclaw setup --node-manager`；对于基于 Yarn
  的 Skill 安装，请手动设置 `"yarn"`。
</ParamField>

<ParamField path="skills.install.allowUploadedArchives" type="boolean" default="false">
  允许受信任的 `operator.admin` Gateway 网关客户端安装通过
  `skills.upload.*` 暂存的私有 zip 归档。普通 ClawHub 安装不需要
  此设置。
</ParamField>

## 操作者安装策略（`security.installPolicy`）

当操作者需要一个受信任的本地命令，以通过主机专属策略批准或阻止
Skill 和插件安装时，请使用 `security.installPolicy`。该策略在
OpenClaw 已暂存源材料之后、安装或更新继续之前运行。它适用于
ClawHub Skills、上传的 Skills、Git/本地 Skills、Skill 依赖安装器，
以及插件安装/更新来源。

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
  启用操作者拥有的安装策略。启用后，如果没有有效的 `exec`
  命令，安装会失败关闭。
</ParamField>

<ParamField path="security.installPolicy.targets" type='("skill" | "plugin")[]'>
  可选的目标过滤器。省略时，策略会应用于每个受支持目标，
  因此新的安装不会意外地失败开放。
</ParamField>

<ParamField path="security.installPolicy.exec.command" type="string">
  受信任策略可执行文件的绝对路径。OpenClaw 会在不经过
  shell 的情况下运行它，并在使用前验证路径。
</ParamField>

<ParamField path="security.installPolicy.exec.args" type="string[]">
  在 `command` 之后传递的静态参数。
</ParamField>

<ParamField path="security.installPolicy.exec.timeoutMs" type="number" default="10000">
  单次策略决策的最长挂钟运行时间。
</ParamField>

<ParamField path="security.installPolicy.exec.noOutputTimeoutMs" type="number" default="timeoutMs">
  在策略失败关闭前，没有 stdout 或 stderr 输出的最长时间。
</ParamField>

<ParamField path="security.installPolicy.exec.maxOutputBytes" type="number" default="1048576">
  策略进程可接受的 stdout 和 stderr 合计最大字节数。
</ParamField>

<ParamField path="security.installPolicy.exec.env" type="Record<string, string>">
  提供给策略进程的字面环境变量。
</ParamField>

<ParamField path="security.installPolicy.exec.passEnv" type="string[]">
  从 OpenClaw 进程复制到策略进程中的环境变量名称。只会传递具名变量。
</ParamField>

<ParamField path="security.installPolicy.exec.trustedDirs" type="string[]">
  可包含策略可执行文件的可选目录允许列表。
</ParamField>

<ParamField path="security.installPolicy.exec.allowInsecurePath" type="boolean" default="false">
  绕过命令路径所有权和权限检查。仅在路径受另一种机制保护时使用。
</ParamField>

<ParamField path="security.installPolicy.exec.allowSymlinkCommand" type="boolean" default="false">
  允许已配置的命令路径是符号链接。解析后的目标仍必须满足其他路径检查。
  解释器脚本参数必须是直接的普通文件，而不是符号链接。
</ParamField>

该策略会在 stdin 上接收一个 JSON 对象，其中包含 `protocolVersion: 1`、
`openclawVersion`、`targetType`、`targetName`、`sourcePath`、`sourcePathKind`、
可选结构化 `source`、结构化 `origin` 和 `request`。它必须在 stdout
上写入一个 JSON 对象：`{ "protocolVersion": 1, "decision": "allow" }` 或
`{ "protocolVersion": 1, "decision": "block", "reason": "..." }`。非零
退出、超时、格式错误的 JSON、缺少字段或不受支持的协议版本都会
失败关闭。

OpenClaw 在正常 Gateway 网关启动期间不会执行安装策略。启用策略但
策略不可用时，安装和更新会失败关闭。`openclaw doctor` 会执行静态验证，
而 `openclaw doctor --deep` 会针对已配置命令执行一次合成安装探测。

批量更新会按目标应用策略：被阻止的 Skill 或插件更新只会使该目标失败，
不会禁用策略，也不会跳过批次中的后续目标。

stdin 示例：

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
  仅用于**内置** Skills 的可选允许列表。设置后，只有列表中的内置
  Skills 符合条件。托管、Agent 级和工作区 Skills
  不受影响。
</ParamField>

## 按 Skill 配置的条目（`skills.entries`）

默认情况下，`entries` 下的键会匹配 Skill 的 `name`。如果某个 Skill 定义了
`metadata.openclaw.skillKey`，请改用该键。带连字符的名称需要加引号
（JSON5 允许带引号的键）。

<ParamField path="skills.entries.<key>.enabled" type="boolean">
  即使 Skill 是内置或已安装，`false` 也会禁用它。`coding-agent`
  内置 Skill 是选择加入的，需将其设为 `true`，并确保 `claude`、
  `codex`、`opencode` 或另一个受支持的 CLI 已安装并完成认证。
</ParamField>

<ParamField path="skills.entries.<key>.apiKey" type='string | { source, provider, id }'>
  供声明了 `metadata.openclaw.primaryEnv` 的 Skills 使用的便捷字段。
  支持纯文本字符串或 SecretRef：`{ source: "env", provider: "default", id: "VAR_NAME" }`。
</ParamField>

<ParamField path="skills.entries.<key>.env" type="Record<string, string>">
  为 Agent 运行注入的环境变量。只有当该变量尚未在进程中设置时才会注入。
</ParamField>

<ParamField path="skills.entries.<key>.config" type="object">
  用于自定义按 Skill 配置字段的可选容器。
</ParamField>

## Agent 允许列表（`agents`）

当你希望同一台机器/工作区 Skill 根目录在不同 Agent
上呈现不同的可见 Skill 集时，请使用 Agent 配置。

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
  由省略 `agents.list[].skills` 的 Agent 继承的共享基线允许列表。
  完全省略此项可让 Skills 默认不受限制。
</ParamField>

<ParamField path="agents.list[].skills" type="string[]">
  该 Agent 的显式最终 Skill 集。显式列表会**替换**继承的默认值，
  而不是合并。设为 `[]` 可不向该 Agent 暴露任何 Skills。
</ParamField>

<Warning>
  Agent Skill 允许列表是 OpenClaw Skill 设备发现、提示、斜杠命令设备发现、
  沙箱同步和 Skill 快照的可见性与加载过滤器。它不是 shell 执行时的授权边界。
  如果 Agent 可以运行主机 `exec`，该 shell 仍然可以运行外部客户端，或读取
  执行用户可见的主机文件，包括 MCP 客户端注册表，例如
  `~/.openclaw/skills/config/mcporter.json`。对于按 Agent 配置的 MCP 隔离，
  请将 Skill 允许列表与沙箱/OS 用户隔离结合使用，拒绝或严格允许列出主机 exec，
  并优先在 MCP 服务器使用按 Agent 配置的凭证。
</Warning>

## Workshop（`skills.workshop`）

<ParamField path="skills.workshop.autonomous.enabled" type="boolean" default="false">
  当为 `true` 时，Agent 可以在成功轮次后根据持久对话信号创建待处理提案。
  用户提示触发的 Skill 创建无论此设置如何，始终会通过 Skill Workshop。
</ParamField>

<ParamField path="skills.workshop.approvalPolicy" type='"pending" | "auto"' default='"pending"'>
  `pending` 要求在智能体发起应用、拒绝或隔离之前获得操作员批准。`auto` 允许这些操作无需批准。
</ParamField>

<ParamField path="skills.workshop.allowSymlinkTargetWrites" type="boolean" default="false">
  允许 Skill Workshop apply 通过工作区 Skills 符号链接写入，其真实目标已被 `skills.load.allowSymlinkTargets` 信任。除非生成的提案应用应修改该共享 Skills 根目录，否则保持禁用。
</ParamField>

<ParamField path="skills.workshop.maxPending" type="number" default="50">
  每个工作区保留的待处理和已隔离提案的最大数量。
</ParamField>

<ParamField path="skills.workshop.maxSkillBytes" type="number" default="40000">
  提案正文的最大字节数。提案描述硬性限制为 160 字节，因为它们会出现在发现和列表输出中。
</ParamField>

## 符号链接的 Skills 根目录

默认情况下，工作区、项目智能体、extra-dir 和内置 Skills 根目录都是包含边界。`<workspace>/skills` 下解析到根目录之外的符号链接 Skills 文件夹会被跳过，并记录一条日志消息。

若要允许有意设计的符号链接布局，请声明受信任目标：

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

使用此配置后，`<workspace>/skills/manager -> ~/Projects/manager/skills` 会在 realpath 解析后被接受。`extraDirs` 会直接扫描相邻仓库；`allowSymlinkTargets` 会为现有布局保留符号链接路径。

默认情况下，Skill Workshop apply 不会通过这些符号链接写入。若要让 Workshop apply 修改已受信任符号链接目标下的 Skills，请单独选择启用：

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

托管的 `~/.openclaw/skills` 和个人 `~/.agents/skills` 目录已经接受 Skills 目录符号链接（每个 Skill 的 `SKILL.md` 包含边界仍然适用）。

## 沙箱隔离的 Skills 和环境变量

<Warning>
  `skills.entries.<skill>.env` 和 `apiKey` 仅适用于**主机**运行。在沙箱内它们不会生效，依赖 `GEMINI_API_KEY` 的 Skill 会失败并显示 `apiKey not configured`，除非单独向沙箱提供该变量。
</Warning>

将密钥传入 Docker 沙箱：

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
  拥有 Docker daemon 访问权限的用户可以通过 Docker 元数据检查 `sandbox.docker.env` 值。当这种暴露不可接受时，请使用挂载的密钥文件、自定义镜像或其他交付路径。
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

启用监视器时，Skills 和配置的更改会在下一个新会话生效；或者在监视器检测到更改后的下一个智能体轮次生效。

## 相关内容

<CardGroup cols={2}>
  <Card title="Skills 参考" href="/zh-CN/tools/skills" icon="puzzle-piece">
    Skills 是什么、加载顺序、门控，以及 SKILL.md 格式。
  </Card>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    编写自定义工作区 Skills。
  </Card>
  <Card title="Skill Workshop" href="/zh-CN/tools/skill-workshop" icon="flask">
    智能体起草 Skills 的提案队列。
  </Card>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="terminal">
    原生斜杠命令目录和聊天指令。
  </Card>
</CardGroup>
