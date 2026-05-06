---
read_when:
    - 添加或修改 Skills 配置
    - 调整内置允许列表或安装行为
summary: Skills 配置模式和示例
title: Skills 配置
x-i18n:
    generated_at: "2026-05-06T06:20:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8996b3df73a9f0176b541c5d3f9670615f9a879a41838cf5d35d0a455e9f5088
    source_path: tools/skills-config.md
    workflow: 16
---

大多数 Skills 加载器/安装配置位于
`~/.openclaw/openclaw.json` 中的 `skills` 下。特定智能体的技能可见性位于
`agents.defaults.skills` 和 `agents.list[].skills` 下。

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

对于内置图像生成/编辑，优先使用 `agents.defaults.imageGenerationModel`
加上核心 `image_generate` 工具。`skills.entries.*` 仅用于自定义或
第三方技能工作流。

如果你选择了特定的图像提供商/模型，也要配置该提供商的
认证/API key。典型示例：`google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，
`openai/*` 使用 `OPENAI_API_KEY`，`fal/*` 使用 `FAL_KEY`。

示例：

- 原生 Nano Banana Pro 风格设置：`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 原生 fal 设置：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 智能体技能允许列表

当你希望使用相同的机器/工作区技能根目录，但每个智能体有
不同的可见技能集时，请使用智能体配置。

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

- `agents.defaults.skills`：供省略
  `agents.list[].skills` 的智能体使用的共享基线允许列表。
- 省略 `agents.defaults.skills` 会让技能默认不受限制。
- `agents.list[].skills`：该智能体的显式最终技能集；它不会
  与默认值合并。
- `agents.list[].skills: []`：不向该智能体暴露任何技能。

## 字段

- 内置技能根目录始终包括 `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills` 和 `<workspace>/skills`。
- `allowBundled`：仅用于**内置**技能的可选允许列表。设置后，只有
  列表中的内置技能符合条件（托管、智能体和工作区技能不受影响）。
- `load.extraDirs`：要扫描的其他技能目录（最低优先级）。
- `load.watch`：监视技能文件夹并刷新技能快照（默认：true）。
- `load.watchDebounceMs`：技能监视器事件的防抖时间，单位为毫秒（默认：250）。
- `install.preferBrew`：可用时优先使用 brew 安装器（默认：true）。
- `install.nodeManager`：node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`，默认：npm）。
  这只影响**技能安装**；Gateway 网关运行时仍应使用 Node
  （WhatsApp/Telegram 不推荐使用 Bun）。
  - `openclaw setup --node-manager` 范围更窄，目前接受 `npm`、
    `pnpm` 或 `bun`。如果你想使用 Yarn 支持的技能安装，请手动设置
    `skills.install.nodeManager: "yarn"`。
- `entries.<skillKey>`：每个技能的覆盖项。
- `agents.defaults.skills`：可选默认技能允许列表，由省略
  `agents.list[].skills` 的智能体继承。
- `agents.list[].skills`：可选的每智能体最终技能允许列表；显式
  列表会替换继承的默认值，而不是合并。

每技能字段：

- `enabled`：设置为 `false` 可禁用某个技能，即使它是内置/已安装的。
- `env`：为智能体运行注入的环境变量（仅当尚未设置时）。
- `apiKey`：供声明了主环境变量的技能使用的可选便利配置。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。

## 注意事项

- `entries` 下的键默认映射到技能名称。如果某个技能定义了
  `metadata.openclaw.skillKey`，请改用该键。
- 加载优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 内置技能 →
  `skills.load.extraDirs`。
- 启用监视器后，对技能的更改会在下一次智能体轮次中生效。

### 沙箱隔离技能和环境变量

当会话是**沙箱隔离**的，技能进程会在配置的沙箱后端内运行。沙箱**不会**继承主机的 `process.env`。

<Warning>
  全局 `env` 和 `skills.entries.<skill>.env`/`apiKey` 仅适用于**主机**运行。在沙箱内它们不起作用，因此依赖 `GEMINI_API_KEY` 的技能会失败并显示 `apiKey not configured`，除非单独将该变量提供给沙箱。
</Warning>

使用以下任一方式：

- Docker 后端使用 `agents.defaults.sandbox.docker.env`（或每智能体的 `agents.list[].sandbox.docker.env`）。
- 将环境变量烘焙到你的自定义沙箱镜像或远程沙箱环境中。

## 相关

<CardGroup cols={2}>
  <Card title="Skills" href="/zh-CN/tools/skills" icon="puzzle-piece">
    Skills 是什么，以及它们如何加载。
  </Card>
  <Card title="创建技能" href="/zh-CN/tools/creating-skills" icon="hammer">
    编写自定义技能包。
  </Card>
  <Card title="Slash commands" href="/zh-CN/tools/slash-commands" icon="terminal">
    原生命令目录和聊天指令。
  </Card>
  <Card title="配置参考" href="/zh-CN/gateway/configuration-reference" icon="gear">
    完整的 `skills` 和 `agents.skills` schema。
  </Card>
</CardGroup>
