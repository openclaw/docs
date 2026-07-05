---
doc-schema-version: 1
read_when:
    - 安装或配置插件
    - 理解插件发现和加载规则
    - 使用 Codex/Claude 兼容插件包
sidebarTitle: Getting Started
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-07-05T11:48:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

插件通过渠道、模型提供商、Agent harness、工具、技能、语音、实时转录、音频、媒体理解、生成、Web 抓取、Web 搜索以及其他运行时能力来扩展 OpenClaw。

使用本页安装插件、重启 Gateway 网关、验证运行时已加载插件，并排查常见设置失败。仅命令示例请参阅
[管理插件](/zh-CN/plugins/manage-plugins)。内置、官方外部和仅源码插件的生成清单请参阅
[插件清单](/zh-CN/plugins/plugin-inventory)。

## 要求

- 已有可用 `openclaw` CLI 的 OpenClaw checkout 或安装
- 能访问所选来源（ClawHub、npm 或 git host）的网络
- 该插件设置文档中指定的任何插件特定凭证、配置键或 OS 工具
- 为你的渠道提供服务的 Gateway 网关具备重新加载或重启权限

## 快速开始

<Steps>
  <Step title="查找插件">
    在 [ClawHub](/zh-CN/clawhub) 中搜索公共插件包：

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub 是社区插件的主要发现界面。在发布切换期间，普通的裸包规格仍会从 npm 安装，除非它们匹配官方插件 id。匹配内置插件的原始 `@openclaw/*` 规格会解析到该内置副本。需要指定某个来源时，请使用显式来源前缀。

  </Step>

  <Step title="安装插件">
    ```bash
    # From ClawHub.
    openclaw plugins install clawhub:<package>

    # From npm.
    openclaw plugins install npm:<package>

    # From git.
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # From a local development checkout.
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    将插件安装视为运行代码。生产环境安装建议固定版本，以便可复现。

  </Step>

  <Step title="配置并启用它">
    在 `plugins.entries.<id>.config` 下配置插件特定设置。
    如果插件尚未启用，请启用它：

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    如果设置了 `plugins.allow`，已安装的插件 id 必须位于该列表中，插件才能加载。`openclaw plugins install` 会将已安装的 id 添加到现有 `plugins.allow` 列表，并从 `plugins.deny` 中移除相同 id，以便显式安装的插件在重启后可以加载。

  </Step>

  <Step title="让 Gateway 网关重新加载">
    安装、更新或卸载插件代码需要重启 Gateway 网关。启用了配置重新加载的托管 Gateway 网关会检测到变更的插件安装记录并自动重启。否则，请自行重启：

    ```bash
    openclaw gateway restart
    ```

    启用/禁用会更新配置和冷注册表。运行时 inspect 仍然是证明实时运行时界面最清晰的方式。

  </Step>

  <Step title="验证运行时注册">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    使用 `--runtime` 证明已注册的工具、钩子、服务、Gateway 网关方法或插件拥有的 CLI 命令。普通 `inspect` 只是冷清单和注册表检查。

  </Step>
</Steps>

## 配置

### 选择安装来源

| 来源        | 适用场景                                                                       | 示例                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | 你想要 OpenClaw 原生的发现、扫描、版本元数据和安装提示                         | `openclaw plugins install clawhub:<package>`                   |
| npm         | 你需要直接使用 npm 注册表或 dist-tag 工作流                                    | `openclaw plugins install npm:<package>`                       |
| git         | 你需要仓库中的分支、标签或提交                                                 | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本地路径    | 你正在同一台机器上开发或测试插件                                               | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | 你正在安装 Claude 兼容的 marketplace 插件                                      | `openclaw plugins install <plugin> --marketplace <source>`     |

裸包规格具有特殊兼容行为：匹配内置插件 id 的裸名称会使用该内置来源；匹配官方外部插件 id 的裸名称会使用官方包目录；在发布切换期间，任何其他裸规格都会通过 npm 安装。匹配内置插件的原始 `@openclaw/*` 规格也会在 npm 回退前解析到内置副本。使用 `npm:@openclaw/<plugin>@<version>` 可刻意安装外部 npm 包，而不是内置副本。使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:` 可进行确定性的来源选择。完整命令契约请参阅
[`openclaw plugins`](/zh-CN/cli/plugins#install)。

对于 npm 安装，未固定的规格和 `@latest` 会选择声明兼容此 OpenClaw 构建的最新稳定包。如果 npm 当前 latest 版本声明的 `openclaw.compat.pluginApi` 或 `openclaw.install.minHostVersion` 高于此构建支持的版本，OpenClaw 会扫描更早的稳定版本，并安装符合要求的最新版本。精确版本和显式频道标签（如 `@beta`）会保持固定到所选包，不兼容时会失败。

### 操作员安装策略

配置 `security.installPolicy`，以便在插件安装或更新继续前运行受信任的本地策略命令。该策略会接收元数据和暂存来源路径，并可以允许或阻止安装。它覆盖 CLI 和 Gateway 网关支持的安装/更新路径。插件 `before_install` 钩子运行得更晚，并且仅在已加载插件钩子的 OpenClaw 进程中运行，因此请改用 `security.installPolicy` 做操作员拥有的安装决策。已弃用的 `--dangerously-force-unsafe-install` 标志出于兼容性仍会被接受，但它是空操作：不会绕过安装策略或 OpenClaw 内置的插件依赖拒绝列表。

Skills 和插件共享的 `security.installPolicy` exec schema 请参阅 [Skills 配置](/zh-CN/tools/skills-config#operator-install-policy-securityinstallpolicy)。

### 配置插件策略

通用插件配置形状如下：

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

关键策略规则：

- `plugins.enabled: false` 会禁用所有插件，并跳过发现/加载工作。此选项启用时，陈旧插件引用会保持惰性；如果你希望移除陈旧 id，请在运行 Doctor 清理前重新启用插件。
- `plugins.deny` 优先于 allow 和单插件启用状态。
- `plugins.allow` 是排他性允许列表。不在允许列表中的插件拥有工具即使 `tools.allow` 包含 `"*"` 也仍不可用。
- `plugins.entries.<id>.enabled: false` 会禁用一个插件，同时保留其配置。
- `plugins.load.paths` 会添加显式本地插件文件或目录。
  由托管 `plugins install` 安装的本地路径必须是插件目录或归档；独立插件文件请使用 `plugins.load.paths`。
- 工作区来源插件默认禁用；使用本地工作区代码前，请显式启用或加入允许列表。
- 内置插件遵循其内置的默认开启/默认关闭元数据，除非配置显式覆盖。
- `plugins.slots.<slot>`（`memory` 或 `contextEngine`）为独占类别选择一个插件。Slot 选择会计为显式激活，并为该 slot 强制启用所选插件，即使它原本需要选择加入。`plugins.deny` 和 `plugins.entries.<id>.enabled: false` 仍会阻止它。
- 当配置指定内置选择加入插件所拥有的某个界面时，它们可以自动激活，例如提供商/模型引用、渠道配置、CLI 后端或 Agent harness 运行时。
- OpenAI 系 Codex 路由会保持提供商和运行时插件边界分离：旧版 Codex 模型引用属于 Doctor 会修复的旧版配置，而内置 `codex` 插件拥有规范 `openai/*` 智能体引用、显式 `agentRuntime.id: "codex"` 以及旧版 `codex/*` 引用的 Codex app-server 运行时。

当未设置 `plugins.allow`，并且从工作区或全局插件根目录自动发现非内置插件时，启动日志会输出
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
以及已发现的插件 id；对于较短列表，还会输出最小 `plugins.allow` 片段。将受信任插件复制到 `openclaw.json` 前，请对列出的插件 id 运行 [`openclaw plugins list --enabled --verbose`](/zh-CN/cli/plugins#list)
或 [`openclaw plugins inspect <id>`](/zh-CN/cli/plugins#inspect)。当诊断指出某个插件已
`without install/load-path provenance` 加载时，同样适用这种信任固定：inspect 该插件 id，然后将其固定到 `plugins.allow`，或从受信任来源重新安装，以便 OpenClaw 记录安装来源。

当配置验证报告陈旧插件 id、允许列表/工具不匹配或旧版内置插件路径时，请运行 `openclaw doctor` 或 `openclaw doctor --fix`。

## 了解插件格式

OpenClaw 识别两种插件格式：

| 格式                   | 加载方式                                                                     | 适用场景                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 原生 OpenClaw 插件     | `openclaw.plugin.json` 加上在进程内加载的运行时模块                          | 你正在安装或构建 OpenClaw 特定运行时能力                               |
| 兼容 bundle            | 映射到 OpenClaw 插件清单中的 Codex、Claude 或 Cursor 插件布局                | 你正在复用兼容的技能、命令、钩子或 bundle 元数据                       |

两种格式都会出现在 `openclaw plugins list`、`openclaw plugins inspect`、`openclaw plugins enable` 和 `openclaw plugins disable` 中。bundle 兼容边界请参阅
[Plugin bundles](/zh-CN/plugins/bundles)，原生插件编写请参阅
[Building Plugins](/zh-CN/plugins/building-plugins)。

## 插件钩子

插件可以通过两种不同 API 在运行时注册钩子：

- `api.on(...)` 类型化钩子，用于运行时生命周期事件。这是中间件、策略、消息重写、prompt shaping 和工具控制的首选界面。
- `api.registerHook(...)` 用于 [Hooks](/zh-CN/automation/hooks) 中描述的内部钩子系统。这主要用于粗粒度命令/生命周期副作用，以及与现有 HOOK 风格自动化兼容。

快速规则：如果处理器需要优先级、合并语义或阻止/取消行为，请使用类型化钩子。如果它只是响应 `command:new`、`command:reset`、`message:sent` 或类似粗粒度事件，`api.registerHook` 就可以。

插件管理的内部钩子会以 `plugin:<id>` 出现在 `openclaw hooks list` 中。你无法通过 `openclaw hooks` 启用或禁用它们；请改为启用或禁用插件。

## 验证活动 Gateway 网关

`openclaw plugins list` 和普通 `openclaw plugins inspect` 会读取冷配置、清单和注册表状态。它们不能证明已运行的 Gateway 网关已导入相同的插件代码。

当插件显示已安装，但实时聊天流量没有使用它时：

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

托管式 Gateway 网关会在插件安装、更新和卸载改动导致插件源代码变化后自动重启。在 VPS 或容器安装中，确保任何手动重启都针对实际为你的渠道提供服务的 `openclaw gateway run` 子进程，而不只是包装器或 supervisor。

## 故障排查

| 症状                                                        | 检查                                                                                                                                      | 修复                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 插件出现在 `plugins list` 中，但运行时钩子未运行  | 使用 `openclaw plugins inspect <id> --runtime --json`，并通过 `gateway status --deep --require-rpc` 确认活动 Gateway 网关             | 在安装、更新、配置或源代码更改后重启正在运行的 Gateway 网关                               |
| 出现重复的渠道或工具所有权诊断         | 运行 `openclaw plugins list --enabled --verbose`，使用 `--runtime --json` 检查每个可疑插件，并比较渠道/工具所有权 | 禁用一个所有者，移除陈旧安装，或使用清单 `preferOver` 进行有意替换      |
| 配置显示缺少某个插件                                | 查看 [插件清单](/zh-CN/plugins/plugin-inventory)，确认它是内置、官方外部插件，还是仅源代码插件                           | 安装外部包，启用内置插件，或移除陈旧配置                         |
| 安装期间配置无效                               | 阅读验证消息；如果它指向陈旧插件状态，运行 `openclaw doctor --fix`                                             | Doctor 可以通过禁用条目并移除无效载荷来隔离无效插件配置     |
| 插件路径因可疑所有权或权限被阻止 | 在配置错误前检查诊断信息                                                                                             | 修复文件系统所有权/权限，然后运行 `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` 阻止生命周期命令                | 确认安装由 Nix 管理                                                                                                      | 在 Nix 源中更改插件选择，而不是使用插件变更命令                      |
| 依赖导入在运行时失败                             | 检查插件是通过 npm/git/ClawHub 安装，还是从本地路径加载                                                 | 运行 `openclaw plugins update <id>`，重新安装源代码，或自行安装本地插件依赖 |

当陈旧插件配置仍然命名一个已无法发现的渠道插件时，配置验证会将该渠道键降级为警告，而不是硬失败，因此 Gateway 网关启动仍可服务所有其他渠道。运行 `openclaw doctor --fix` 以移除陈旧插件和渠道条目。没有陈旧插件证据的未知渠道键仍会导致验证失败，以便拼写错误保持可见。

对于有意的渠道替换，首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并指定旧版或较低优先级的插件 id。如果两个插件都被显式启用，OpenClaw 会保留该请求并报告重复渠道/工具诊断，而不是静默选择一个所有者。

如果已安装包报告它 `requires compiled runtime output for
TypeScript entry ...`，说明该包发布时缺少 OpenClaw 在运行时所需的 JavaScript 文件。请在发布者发布已编译 JavaScript 后更新或重新安装，或在此之前禁用/卸载该插件。

### 被阻止的插件路径所有权

如果诊断显示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
且随后验证显示 `plugin present but blocked`，说明 OpenClaw 发现插件文件的所有者 Unix 用户不同于加载它们的进程用户。保留插件配置；修复文件系统所有权，或以拥有状态目录的同一用户运行 OpenClaw。

对于 Docker 安装，官方镜像以 `node`（uid `1000`）运行，因此主机绑定挂载的 OpenClaw 配置和工作区目录通常应由 uid `1000` 拥有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你有意以 root 运行 OpenClaw，请改为将托管插件根目录修复为 root 所有权：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修复所有权后，重新运行 `openclaw doctor --fix` 或 `openclaw plugins registry --refresh`，使持久化插件注册表与修复后的文件匹配。

### 缓慢的插件工具设置

如果智能体轮次在准备工具时看起来停滞，请启用跟踪日志并检查插件工具工厂计时行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

查找：

```text
[trace:plugin-tools] factory timings ...
```

摘要会列出总工厂时间和最慢的插件工具工厂，包括插件 id、声明的工具名称、结果形状，以及该工具是否可选。当单个工厂耗时至少 1 秒，或插件工具工厂准备总耗时至少 5 秒时，缓慢行会提升为警告。

OpenClaw 会为使用相同有效请求上下文的重复解析缓存成功的插件工具工厂结果。缓存键包括有效运行时配置、工作区和智能体 id、沙箱策略、浏览器设置、交付上下文、请求者身份和所有权状态，因此依赖这些可信字段的工厂会在上下文变化时重新运行。如果计时仍然很高，插件可能在返回其工具定义之前执行了昂贵工作。

如果某个插件占据主要耗时，请检查它的运行时注册：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然后更新、重新安装或禁用该插件。插件作者应将昂贵的依赖加载移动到工具执行路径之后，而不是在工具工厂内部执行。

有关依赖根目录、包元数据验证、注册表记录、启动重载行为和旧版清理，请参阅
[插件依赖解析](/zh-CN/plugins/dependency-resolution)。

## 相关

- [管理插件](/zh-CN/plugins/manage-plugins) - 列出、安装、更新、卸载和发布的命令示例
- [`openclaw plugins`](/zh-CN/cli/plugins) - 完整 CLI 参考
- [插件清单](/zh-CN/plugins/plugin-inventory) - 生成的内置和外部插件列表
- [插件参考](/zh-CN/plugins/reference) - 生成的每插件参考页面
- [社区插件](/zh-CN/plugins/community) - ClawHub 发现和文档 PR 策略
- [插件依赖解析](/zh-CN/plugins/dependency-resolution) - 安装根目录、注册表记录和运行时边界
- [构建插件](/zh-CN/plugins/building-plugins) - 原生插件创作指南
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) - 运行时注册、钩子和 API 字段
- [插件清单](/zh-CN/plugins/manifest) - 清单和包元数据
