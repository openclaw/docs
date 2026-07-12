---
doc-schema-version: 1
read_when:
    - 安装或配置插件
    - 了解插件发现和加载规则
    - 使用与 Codex/Claude 兼容的插件包
sidebarTitle: Getting Started
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-07-11T21:00:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9de5b54c1c7b8ecf789816aa909ee1538de4295f0503a1ea9eecd535077a7cbc
    source_path: tools/plugin.md
    workflow: 16
---

插件可为 OpenClaw 扩展渠道、模型提供商、Agent harness、工具、Skills、语音、实时转写、语音通话、媒体理解、生成、网页获取、网页搜索及其他运行时能力。

使用本页面安装插件、重启 Gateway 网关、验证运行时是否已加载插件，并排查常见设置故障。有关仅包含命令的示例，请参阅[管理插件](/zh-CN/plugins/manage-plugins)。有关内置插件、官方外部插件和仅源代码插件的生成清单，请参阅[插件清单](/zh-CN/plugins/plugin-inventory)。

## 要求

- OpenClaw 源代码检出或安装，且 `openclaw` CLI 可用
- 能够通过网络访问所选来源（ClawHub、npm 或 git 主机）
- 该插件设置文档中指定的所有插件专用凭据、配置键或操作系统工具
- 为你的渠道提供服务的 Gateway 网关具有重新加载或重启权限

## 快速开始

<Steps>
  <Step title="查找插件">
    在 [ClawHub](/clawhub) 中搜索公开插件包：

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub 是发现社区插件的主要入口。在上线切换期间，普通的裸包说明符仍从 npm 安装，除非它们匹配官方插件 ID。匹配内置插件的原始 `@openclaw/*` 说明符会解析到对应的内置副本。当你需要明确指定某个来源时，请使用显式来源前缀。

  </Step>

  <Step title="安装插件">
    ```bash
    # 从 ClawHub 安装。
    openclaw plugins install clawhub:<package>

    # 从 npm 安装。
    openclaw plugins install npm:<package>

    # 从 git 安装。
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # 从本地开发检出安装。
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    应像对待运行代码一样对待插件安装。生产环境安装应优先使用固定版本，以确保可复现。

  </Step>

  <Step title="配置并启用插件">
    在 `plugins.entries.<id>.config` 下配置插件专用设置。如果插件尚未启用，请启用它：

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    如果已设置 `plugins.allow`，则安装的插件 ID 必须在该列表中，插件才能加载。`openclaw plugins install` 会将安装的 ID 添加到现有 `plugins.allow` 列表，并从 `plugins.deny` 中移除同一 ID，使显式安装的插件能够在重启后加载。

  </Step>

  <Step title="让 Gateway 网关重新加载">
    安装、更新或卸载插件代码需要重启 Gateway 网关。启用了配置重新加载的托管 Gateway 网关会检测插件安装记录的变化并自动重启。否则，请自行重启：

    ```bash
    openclaw gateway restart
    ```

    启用或禁用操作会更新配置和冷注册表。运行时检查仍是证明实时运行时表面的最清晰方式。

  </Step>

  <Step title="验证运行时注册">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    使用 `--runtime` 证明工具、钩子、服务、Gateway 网关方法或插件自有 CLI 命令已注册。普通 `inspect` 只检查冷清单和注册表。

  </Step>
</Steps>

## 配置

### 选择安装来源

| 来源        | 适用场景                                                                       | 示例                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | 你需要 OpenClaw 原生的发现、扫描、版本元数据和安装提示                         | `openclaw plugins install clawhub:<package>`                   |
| npm         | 你需要直接使用 npm 注册表或 dist-tag 工作流                                    | `openclaw plugins install npm:<package>`                       |
| git         | 你需要仓库中的某个分支、标签或提交                                             | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本地路径    | 你正在同一台计算机上开发或测试插件                                             | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | 你正在安装与 Claude 兼容的 marketplace 插件                                    | `openclaw plugins install <plugin> --marketplace <source>`     |

裸包说明符具有特殊的兼容行为：与内置插件 ID 匹配的裸名称使用对应内置来源；与官方外部插件 ID 匹配的裸名称使用官方包目录；在上线切换期间，其他所有裸说明符都通过 npm 安装。匹配内置插件的原始 `@openclaw/*` 说明符也会在回退到 npm 之前解析到内置副本。若要刻意安装外部 npm 包而非内置副本，请使用 `npm:@openclaw/<plugin>@<version>`。使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:` 可确定性地选择来源。完整命令契约请参阅 [`openclaw plugins`](/zh-CN/cli/plugins#install)。

对于 npm 安装，未固定版本的说明符和 `@latest` 会选择声明与此 OpenClaw 构建兼容的最新稳定包。如果 npm 当前最新版本声明的 `openclaw.compat.pluginApi` 或 `openclaw.install.minHostVersion` 高于此构建支持的版本，OpenClaw 会扫描较旧的稳定版本，并安装其中最新的兼容版本。精确版本和 `@beta` 等显式渠道标签会保持固定到所选包，并在不兼容时失败。

### 操作员安装策略

配置 `security.installPolicy`，以便在继续安装或更新插件之前运行受信任的本地策略命令。该策略会接收元数据和暂存源路径，并可允许或阻止安装。它同时覆盖 CLI 和由 Gateway 网关支持的安装与更新路径。插件的 `before_install` 钩子会在之后运行，并且仅在已加载插件钩子的 OpenClaw 进程中运行，因此操作员自有的安装决策应改用 `security.installPolicy`。已弃用的 `--dangerously-force-unsafe-install` 标志出于兼容性仍会被接受，但不会执行任何操作：它不会绕过安装策略或 OpenClaw 内置的插件依赖拒绝列表。

有关 Skills 和插件共用的 `security.installPolicy` Exec 架构，请参阅 [Skills 配置](/zh-CN/tools/skills-config#operator-install-policy-securityinstallpolicy)。

### 配置插件策略

通用插件配置结构如下：

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

主要策略规则：

- `plugins.enabled: false` 会禁用所有插件，并跳过发现和加载工作。在此设置生效期间，过时的插件引用会保持惰性；如果你希望移除过时的 ID，请在运行 Doctor 清理前重新启用插件。
- `plugins.deny` 的优先级高于允许列表和单个插件的启用状态。
- `plugins.allow` 是排他性允许列表。即使 `tools.allow` 包含 `"*"`，不在允许列表中的插件自有工具仍不可用。
- `plugins.entries.<id>.enabled: false` 会禁用单个插件，同时保留其配置。
- `plugins.load.paths` 会添加显式指定的本地插件文件或目录。由 `plugins install` 管理的本地路径必须是插件目录或归档文件；对于独立插件文件，请使用 `plugins.load.paths`。
- 默认禁用源自工作区的插件；使用本地工作区代码前，必须显式启用插件或将其加入允许列表。
- 内置插件遵循其内置的默认启用或默认禁用元数据，除非配置显式覆盖该设置。
- `plugins.slots.<slot>`（`memory` 或 `contextEngine`）会为排他类别选择一个插件。插槽选择视为显式激活，并会为该插槽强制启用所选插件，即使该插件通常需要主动选择加入。`plugins.deny` 和 `plugins.entries.<id>.enabled: false` 仍会阻止它。
- 当配置指定内置选择加入型插件拥有的某个表面时，这些插件可以自动激活，例如提供商或模型引用、渠道配置、CLI 后端或 Agent harness 运行时。
- OpenAI 系列 Codex 路由会保持提供商与运行时插件边界相互独立：旧版 Codex 模型引用属于由 Doctor 修复的旧版配置，而内置 `codex` 插件则为规范的 `openai/*` Agent 引用、显式的 `agentRuntime.id: "codex"` 和旧版 `codex/*` 引用提供 Codex app-server 运行时。

当未设置 `plugins.allow`，且从工作区或全局插件根目录自动发现了非内置插件时，启动日志会输出 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`，其中包含发现的插件 ID；如果列表较短，还会包含最小化的 `plugins.allow` 片段。在将受信任插件复制到 `openclaw.json` 之前，请针对列出的插件 ID 运行 [`openclaw plugins list --enabled --verbose`](/zh-CN/cli/plugins#list) 或 [`openclaw plugins inspect <id>`](/zh-CN/cli/plugins#inspect)。当诊断信息指出插件在 `without install/load-path provenance` 情况下加载时，同样需要固定信任关系：检查该插件 ID，然后将其固定到 `plugins.allow` 中，或从受信任来源重新安装，使 OpenClaw 记录安装来源。

当配置验证报告过时的插件 ID、允许列表与工具不匹配或旧版内置插件路径时，请运行 `openclaw doctor` 或 `openclaw doctor --fix`。

## 了解插件格式

OpenClaw 可识别两种插件格式：

| 格式                 | 加载方式                                                                     | 适用场景                                                               |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| OpenClaw 原生插件    | `openclaw.plugin.json` 加上在进程内加载的运行时模块                           | 你正在安装或构建 OpenClaw 专用运行时能力                               |
| 兼容包               | 将 Codex、Claude 或 Cursor 插件布局映射到 OpenClaw 插件清单                   | 你正在复用兼容的 Skills、命令、钩子或包元数据                          |

这两种格式都会出现在 `openclaw plugins list`、`openclaw plugins inspect`、`openclaw plugins enable` 和 `openclaw plugins disable` 中。有关包兼容性边界，请参阅[插件包](/zh-CN/plugins/bundles)；有关原生插件创作，请参阅[构建插件](/zh-CN/plugins/building-plugins)。

## 插件钩子

插件可在运行时通过两种不同的 API 注册钩子：

- `api.on(...)` 类型化钩子，用于运行时生命周期事件。这是中间件、策略、消息重写、提示词塑形和工具控制的首选表面。
- `api.registerHook(...)` 用于[钩子](/zh-CN/automation/hooks)中介绍的内部钩子系统。它主要用于粗粒度的命令或生命周期副作用，以及与现有 HOOK 风格自动化的兼容。

简要规则：如果处理程序需要优先级、合并语义或阻止与取消行为，请使用类型化钩子。如果它只需响应 `command:new`、`command:reset`、`message:sent` 或类似的粗粒度事件，则可使用 `api.registerHook`。

由插件管理的内部钩子会以 `plugin:<id>` 的形式出现在 `openclaw hooks list` 中。你无法通过 `openclaw hooks` 启用或禁用这些钩子；请改为启用或禁用对应插件。

## 验证活动的 Gateway 网关

`openclaw plugins list` 和普通的 `openclaw plugins inspect` 会读取冷配置、清单和注册表状态。它们无法证明已运行的 Gateway 网关导入了相同的插件代码。

如果插件显示为已安装，但实时聊天流量没有使用它，请运行：

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

托管式 Gateway 网关会在插件安装、更新和卸载导致插件源发生变化后自动重启。在 VPS 或容器安装环境中，请确保任何手动重启操作针对的是实际为你的渠道提供服务的 `openclaw gateway run` 子进程，而不只是包装器或监督进程。

## 故障排查

| 症状                                                         | 检查                                                                                                                                       | 修复                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 插件出现在 `plugins list` 中，但运行时钩子未运行             | 使用 `openclaw plugins inspect <id> --runtime --json`，并通过 `gateway status --deep --require-rpc` 确认活动的 Gateway 网关                 | 在安装、更新、配置或源代码发生变化后，重启正在运行的 Gateway 网关                                    |
| 出现渠道或工具所有权重复的诊断信息                           | 运行 `openclaw plugins list --enabled --verbose`，使用 `--runtime --json` 检查每个可疑插件，并比较渠道/工具所有权                           | 禁用其中一个所有者、移除过时安装，或使用清单中的 `preferOver` 进行有意替换                           |
| 配置提示缺少插件                                             | 查看[插件清单](/zh-CN/plugins/plugin-inventory)，确认它是内置插件、官方外部插件还是仅源代码插件                                                   | 安装外部软件包、启用内置插件，或移除过时配置                                                        |
| 安装期间配置无效                                             | 阅读验证消息；如果它指向过时的插件状态，请运行 `openclaw doctor --fix`                                                                     | Doctor 可以通过禁用该条目并移除无效负载，将无效的插件配置隔离起来                                   |
| 插件路径因可疑的所有权或权限而被阻止                         | 检查配置错误之前的诊断信息                                                                                                                 | 修复文件系统所有权/权限，然后运行 `openclaw plugins registry --refresh`                              |
| `OPENCLAW_NIX_MODE=1` 阻止生命周期命令                       | 确认该安装由 Nix 管理                                                                                                                       | 在 Nix 源中更改插件选择，而不是使用插件修改命令                                                     |
| 运行时依赖导入失败                                           | 检查插件是通过 npm/git/ClawHub 安装，还是从本地路径加载                                                                                     | 运行 `openclaw plugins update <id>`、重新安装该来源，或自行安装本地插件依赖项                        |

当过时的插件配置仍然指定一个已无法发现的渠道插件时，配置验证会将该渠道键降级为警告，而不是硬性失败，因此 Gateway 网关启动后仍可为其他所有渠道提供服务。运行 `openclaw doctor --fix` 以移除过时的插件和渠道条目。没有过时插件证据的未知渠道键仍会导致验证失败，以便拼写错误保持可见。

如需有意替换渠道，优先插件应在 `channelConfigs.<channel-id>.preferOver` 中声明旧版或优先级较低的插件 ID。如果两个插件都被显式启用，OpenClaw 会保留该请求并报告渠道/工具所有权重复的诊断信息，而不是静默选择一个所有者。

如果已安装的软件包报告它 `requires compiled runtime output for TypeScript entry ...`，则该软件包发布时未包含 OpenClaw 运行时所需的 JavaScript 文件。请在发布者提供编译后的 JavaScript 后更新或重新安装，或者在此之前禁用/卸载该插件。

### 被阻止的插件路径所有权

如果诊断信息显示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
，随后验证又显示 `plugin present but blocked`，则表示 OpenClaw 发现插件文件的所有者与加载这些文件的进程所属 Unix 用户不同。请保留插件配置；修复文件系统所有权，或以状态目录所有者的同一用户身份运行 OpenClaw。

对于 Docker 安装，官方镜像以 `node`（uid `1000`）身份运行，因此宿主机上通过绑定挂载的 OpenClaw 配置和工作区目录通常应归 uid `1000` 所有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你有意以 root 身份运行 OpenClaw，请改为将托管插件根目录的所有权修复为 root：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修复所有权后，重新运行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，使持久化的插件注册表与修复后的文件保持一致。

### 插件工具设置缓慢

如果智能体轮次在准备工具时似乎停滞，请启用跟踪日志并检查插件工具工厂的耗时行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

查找：

```text
[trace:plugin-tools] factory timings ...
```

摘要会列出工厂总耗时以及最慢的插件工具工厂，包括插件 ID、声明的工具名称、结果形态，以及该工具是否为可选工具。当单个工厂耗时至少 1 秒，或插件工具工厂准备总耗时至少 5 秒时，耗时较长的行会提升为警告。

对于有效请求上下文相同的重复解析，OpenClaw 会缓存成功的插件工具工厂结果。缓存键包含有效运行时配置、工作区和智能体 ID、沙箱策略、浏览器设置、交付上下文、请求者身份和所有权状态，因此依赖这些可信字段的工厂会在上下文变化时重新运行。如果耗时持续偏高，该插件可能在返回工具定义之前执行了高开销操作。

如果某个插件占用了大部分耗时，请检查其运行时注册：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然后更新、重新安装或禁用该插件。插件作者应将高开销的依赖加载移至工具执行路径中，而不是在工具工厂内部执行。

有关依赖根目录、软件包元数据验证、注册表记录、启动时重新加载行为和旧版内容清理，请参阅[插件依赖解析](/zh-CN/plugins/dependency-resolution)。

## 相关内容

- [管理插件](/zh-CN/plugins/manage-plugins) - 列出、安装、更新、卸载和发布的命令示例
- [`openclaw plugins`](/zh-CN/cli/plugins) - 完整的 CLI 参考
- [插件清单](/zh-CN/plugins/plugin-inventory) - 自动生成的内置和外部插件列表
- [插件参考](/zh-CN/plugins/reference) - 自动生成的各插件参考页面
- [社区插件](/zh-CN/plugins/community) - ClawHub 发现机制和文档 PR 策略
- [插件依赖解析](/zh-CN/plugins/dependency-resolution) - 安装根目录、注册表记录和运行时边界
- [构建插件](/zh-CN/plugins/building-plugins) - 原生插件编写指南
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) - 运行时注册、钩子和 API 字段
- [插件清单](/zh-CN/plugins/manifest) - 清单和软件包元数据
