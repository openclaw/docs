---
read_when:
    - 添加或修改 Skills 配置
    - 调整内置 allowlist 或安装行为
summary: Skills 配置 schema 和示例
title: Skills 配置
x-i18n:
    generated_at: "2026-04-05T10:12:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7839f39f68c1442dcf4740b09886e0ef55762ce0d4b9f7b4f493a8c130c84579
    source_path: tools/skills-config.md
    workflow: 15
---

# Skills 配置

大多数 Skills 加载器/安装配置都位于 `~/.openclaw/openclaw.json`
中的 `skills` 下。特定于智能体的 skill 可见性位于
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
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway runtime 仍然是 Node；不建议使用 bun)
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或明文字符串
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
以及核心 `image_generate` 工具。`skills.entries.*` 仅用于自定义或
第三方 skill 工作流。

如果你选择了特定的图像提供商/模型，也请配置该提供商的
认证/API 密钥。常见示例：`google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，
`openai/*` 使用 `OPENAI_API_KEY`，`fal/*` 使用 `FAL_KEY`。

示例：

- 原生 Nano Banana 风格设置：`agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
- 原生 fal 设置：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 智能体 skill allowlist

当你希望同一台机器/工作区 skill 根目录保持一致，但每个智能体
看到的 skill 集合不同时，请使用智能体配置。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承默认值 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 skills
    ],
  },
}
```

规则：

- `agents.defaults.skills`：为省略
  `agents.list[].skills` 的智能体提供共享基线 allowlist。
- 省略 `agents.defaults.skills` 可让 Skills 默认不受限制。
- `agents.list[].skills`：该智能体的显式最终 skill 集合；它不会
  与默认值合并。
- `agents.list[].skills: []`：不为该智能体公开任何 Skills。

## 字段

- 内置 skill 根目录始终包括 `~/.openclaw/skills`、`~/.agents/skills`、
  `<workspace>/.agents/skills` 和 `<workspace>/skills`。
- `allowBundled`：仅针对**内置** Skills 的可选 allowlist。设置后，只有
  列表中的内置 Skills 才有资格被启用（托管、智能体和工作区 Skills 不受影响）。
- `load.extraDirs`：要扫描的附加 skill 目录（最低优先级）。
- `load.watch`：监听 skill 文件夹并刷新 Skills 快照（默认：true）。
- `load.watchDebounceMs`：skill 监听事件的防抖时间（毫秒，默认：250）。
- `install.preferBrew`：可用时优先使用 brew 安装器（默认：true）。
- `install.nodeManager`：node 安装器偏好（`npm` | `pnpm` | `yarn` | `bun`，默认：`npm`）。
  这只影响 **skill 安装**；Gateway 网关运行时仍应使用 Node
  （WhatsApp/Telegram 不建议使用 Bun）。
  - `openclaw setup --node-manager` 的范围更窄，目前仅接受 `npm`、
    `pnpm` 或 `bun`。如果你
    想使用基于 Yarn 的 skill 安装，请手动设置 `skills.install.nodeManager: "yarn"`。
- `entries.<skillKey>`：每个 skill 的覆盖配置。
- `agents.defaults.skills`：可选的默认 skill allowlist，由省略
  `agents.list[].skills` 的智能体继承。
- `agents.list[].skills`：可选的每智能体最终 skill allowlist；显式
  列表会替换继承的默认值，而不是合并。

每个 skill 的字段：

- `enabled`：即使 skill 已内置/已安装，也可通过设为 `false` 禁用。
- `env`：为智能体运行注入的环境变量（仅在尚未设置时注入）。
- `apiKey`：为声明了主环境变量的 skill 提供的可选便捷字段。
  支持明文字符串或 SecretRef 对象（`{ source, provider, id }`）。

## 说明

- `entries` 下的键默认映射到 skill 名称。如果某个 skill 定义了
  `metadata.openclaw.skillKey`，请改用该键。
- 加载优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` →
  `~/.agents/skills` → `~/.openclaw/skills` → 内置 Skills →
  `skills.load.extraDirs`。
- 启用监听器后，对 Skills 的更改会在下一次智能体轮次时被读取。

### 沙箱隔离 Skills + 环境变量

当会话处于**沙箱隔离**状态时，skill 进程会在 Docker 中运行。该沙箱
**不会**继承宿主机的 `process.env`。

请使用以下方式之一：

- `agents.defaults.sandbox.docker.env`（或每个智能体的 `agents.list[].sandbox.docker.env`）
- 将环境变量烘焙进你的自定义沙箱镜像中

全局 `env` 和 `skills.entries.<skill>.env/apiKey` 仅适用于**宿主机**运行。
