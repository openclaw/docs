---
read_when:
    - 添加或修改 Skills 配置
    - 调整内置允许列表或安装行为
summary: Skills 配置架构和示例
title: Skills 配置
x-i18n:
    generated_at: "2026-05-05T23:54:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1acfd34c7af3b8909187d77ae74c52656b5dcfa1abf42ca6a7fdb391854e5c7c
    source_path: tools/skills-config.md
    workflow: 16
---

大多数技能加载器/安装配置位于 `~/.openclaw/openclaw.json` 中的 `skills` 下。特定于智能体的技能可见性位于 `agents.defaults.skills` 和 `agents.list[].skills` 下。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime still Node; bun not recommended)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

对于内置的图像生成/编辑，优先使用 `agents.defaults.imageGenerationModel` 加上核心 `image_generate` 工具。`skills.entries.*` 仅用于自定义或第三方技能工作流。

如果你选择了特定的图像提供商/模型，也要配置该提供商的身份验证/API key。典型示例：用于 `google/*` 的 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，用于 `openai/*` 的 `OPENAI_API_KEY`，以及用于 `fal/*` 的 `FAL_KEY`。

示例：

- 原生 Nano Banana Pro 风格设置：`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 原生 fal 设置：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 智能体技能允许列表

当你希望同一台机器/工作区使用相同的技能根目录，但每个智能体使用不同的可见技能集时，请使用智能体配置。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // inherits defaults -> github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

规则：

- `agents.defaults.skills`：共享的基线允许列表，供省略 `agents.list[].skills` 的智能体使用。
- 省略 `agents.defaults.skills` 可让技能默认不受限制。
- `agents.list[].skills`：该智能体的显式最终技能集；它不会与默认值合并。
- `agents.list[].skills: []`：不向该智能体暴露任何技能。

## 字段

- 内置技能根目录始终包括 `~/.openclaw/skills`、`~/.agents/skills`、`<workspace>/.agents/skills` 和 `<workspace>/skills`。
- `allowBundled`：可选允许列表，仅适用于**内置**技能。设置后，只有列表中的内置技能才符合条件（不影响托管技能、智能体技能和工作区技能）。
- `load.extraDirs`：要扫描的其他技能目录（最低优先级）。
- `load.watch`：监视技能文件夹并刷新技能快照（默认：true）。
- `load.watchDebounceMs`：技能监视器事件的防抖时间，单位为毫秒（默认：250）。
- `install.preferBrew`：可用时优先使用 brew 安装器（默认：true）。
- `install.nodeManager`：节点安装器偏好（`npm` | `pnpm` | `yarn` | `bun`，默认：npm）。
  这只影响**技能安装**；Gateway 网关运行时仍应为 Node（不建议将 Bun 用于 WhatsApp/Telegram）。
  - `openclaw setup --node-manager` 范围更窄，目前接受 `npm`、`pnpm` 或 `bun`。如果你想要由 Yarn 支持的技能安装，请手动设置 `skills.install.nodeManager: "yarn"`。
- `entries.<skillKey>`：按技能设置的覆盖项。
- `agents.defaults.skills`：可选默认技能允许列表，由省略 `agents.list[].skills` 的智能体继承。
- `agents.list[].skills`：可选的按智能体最终技能允许列表；显式列表会替换继承的默认值，而不是与其合并。

按技能字段：

- `enabled`：设为 `false` 可禁用某个技能，即使它是内置/已安装的。
- `env`：为智能体运行注入的环境变量（仅在尚未设置时）。
- `apiKey`：为声明主环境变量的技能提供的可选便捷配置。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。

## 注意事项

- `entries` 下的键默认映射到技能名称。如果某个技能定义了 `metadata.openclaw.skillKey`，请改用该键。
- 加载优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 内置技能 → `skills.load.extraDirs`。
- 启用监视器后，对技能的更改会在下一次智能体轮次中被拾取。

### 沙箱隔离技能和环境变量

当会话被**沙箱隔离**时，技能进程会在配置的沙箱后端内运行。沙箱**不会**继承主机的 `process.env`。

<Warning>
  全局 `env` 和 `skills.entries.<skill>.env`/`apiKey` 仅适用于**主机**运行。在沙箱内它们不会生效，因此依赖 `GEMINI_API_KEY` 的技能会失败并显示 `apiKey not configured`，除非单独向沙箱提供该变量。
</Warning>

使用以下任一方式：

- 用于 Docker 后端的 `agents.defaults.sandbox.docker.env`（或按智能体设置的 `agents.list[].sandbox.docker.env`）。
- 将环境变量内置到你的自定义沙箱镜像或远程沙箱环境中。

## 相关内容

<CardGroup cols={2}>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="puzzle-piece">
    技能是什么，以及它们如何加载。
  </Card>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    编写自定义技能包。
  </Card>
  <Card title="斜杠命令" href="/zh-CN/tools/slash-commands" icon="terminal">
    原生命令目录和聊天指令。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 `skills` 和 `agents.skills` 架构。
  </Card>
</CardGroup>
