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
    generated_at: "2026-07-16T11:59:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cd6b19616c14fbbfcec47beca02f206d7a8ca9500c530d06958a30a9e5488bde
    source_path: tools/plugin.md
    workflow: 16
---

插件可通过渠道、模型提供商、Agent harness、工具、技能、
语音、实时转录、语音交互、媒体理解、生成、
网页抓取、Web 搜索及其他运行时能力扩展 OpenClaw。

使用本页面安装插件、重启 Gateway 网关、验证运行时
是否已加载插件，并处理常见的设置失败。仅查看命令示例，请参阅
[管理插件](/zh-CN/plugins/manage-plugins)。要查看
内置插件、官方外部插件和仅源代码插件的生成清单，请参阅
[插件清单](/zh-CN/plugins/plugin-inventory)。

## 要求

- 具有可用 `openclaw` CLI 的 OpenClaw 检出目录或安装
- 能够访问所选来源（ClawHub、npm 或 git 托管平台）的网络
- 该插件设置文档中列出的所有插件专用凭据、配置键或操作系统工具
- 允许为你的渠道提供服务的 Gateway 网关重新加载或重启的权限

## 快速开始

<Steps>
  <Step title="查找插件">
    在 [ClawHub](/zh-CN/clawhub) 中搜索公共插件包：

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub 是社区插件的主要发现界面。在
    发布切换期间，普通裸包规范仍从 npm 安装，除非
    它们与官方插件 ID 匹配。与
    内置插件匹配的原始 `@openclaw/*` 规范会解析为该内置副本。当你需要指定特定来源时，
    请使用显式来源前缀。

  </Step>

  <Step title="安装插件">
    ```bash
    # 从 ClawHub。
    openclaw plugins install clawhub:<package>

    # 从 npm。
    openclaw plugins install npm:<package>

    # 从 git。
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # 从本地开发检出目录。
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    应像运行代码一样谨慎对待插件安装。对于
    可复现的生产环境安装，优先使用固定版本。ClawHub 软件包以及 OpenClaw 的
    内置/官方目录属于可信来源。新的任意 npm、git、
    本地路径/归档、`npm-pack:` 或市场来源，在你
    审查并信任该来源后，非交互式安装需要
    `--force`。

  </Step>

  <Step title="配置并启用插件">
    在 `plugins.entries.<id>.config` 下配置插件专用设置。
    如果插件尚未启用，请启用它：

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    如果设置了 `plugins.allow`，则安装的插件 ID 必须在该列表中，
    插件才能加载。`openclaw plugins install` 会将已安装的
    ID 添加到现有 `plugins.allow` 列表，并从
    `plugins.deny` 中移除相同 ID，以便显式安装的插件可在重启后加载。

  </Step>

  <Step title="让 Gateway 网关重新加载">
    安装、更新或卸载插件代码需要重启 Gateway 网关。
    启用了配置重新加载的托管 Gateway 网关会检测到已更改的
    插件安装记录并自动重启。否则，请自行重启：

    ```bash
    openclaw gateway restart
    ```

    启用/禁用操作会更新配置和冷注册表。运行时检查
    仍是验证实时运行时界面的最明确方式。

  </Step>

  <Step title="验证运行时注册">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    使用 `--runtime` 验证已注册的工具、钩子、服务、Gateway 网关
    方法或插件自有的 CLI 命令。普通 `inspect` 仅执行冷清单
    和注册表检查。

  </Step>
</Steps>

## 配置

### 选择安装来源

| 来源        | 适用场景                                                                       | 示例                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | 你需要 OpenClaw 原生的发现、扫描、版本元数据和安装提示                         | `openclaw plugins install clawhub:<package>`                                             |
| npm         | 你需要直接使用 npm 注册表或 dist-tag 工作流                                    | `openclaw plugins install npm:<package>`                                             |
| git         | 你需要仓库中的分支、标签或提交                                                 | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>`                                             |
| 本地路径    | 你正在同一台机器上开发或测试插件                                               | `openclaw plugins install --link ./my-plugin`                                             |
| 市场        | 你正在安装与 Claude 兼容的市场插件                                              | `openclaw plugins install <plugin> --marketplace <source>`                                             |

裸包规范具有特殊的兼容行为：与
内置插件 ID 匹配的裸名称使用该内置来源；与
官方外部插件 ID 匹配的裸名称使用官方软件包目录；在发布切换期间，任何其他
裸规范都通过 npm 安装。与内置插件匹配的原始 `@openclaw/*`
规范也会在回退到 npm 之前解析为内置副本。使用 `npm:@openclaw/<plugin>@<version>` 可有意安装
外部 npm 软件包而不是内置副本。使用 `clawhub:`、`npm:`、
`git:` 或 `npm-pack:` 可确定性地选择来源。完整的命令约定请参阅
[`openclaw plugins`](/zh-CN/cli/plugins#install)。

对于 npm 安装，未固定的规范和 `@latest` 会选择声明与此 OpenClaw
构建兼容的最新稳定软件包。如果 npm
当前的最新版本声明的 `openclaw.compat.pluginApi` 或
`openclaw.install.minHostVersion` 高于此构建支持的版本，OpenClaw 会扫描
较旧的稳定版本，并安装其中最新的兼容版本。精确版本
和 `@beta` 等显式渠道标签会固定到所选软件包，
并在不兼容时失败。

### 操作员安装策略

配置 `security.installPolicy`，在插件安装或更新继续之前运行可信的本地策略命令。
该策略会接收元数据和
暂存的源路径，并可允许或阻止安装。它同时涵盖 CLI
和由 Gateway 网关支持的安装/更新路径。插件 `before_install` 钩子会
稍后运行，并且仅在已加载插件钩子的 OpenClaw 进程中运行，因此应改用
`security.installPolicy` 进行操作员所有的安装决策。已弃用的
`--dangerously-force-unsafe-install` 标志出于
兼容性考虑仍会被接受，但不会执行任何操作：它不会绕过安装策略或 OpenClaw
内置的插件依赖拒绝列表。

有关技能和
插件共用的 `security.installPolicy` 执行架构，请参阅 [Skills 配置](/zh-CN/tools/skills-config#operator-install-policy-securityinstallpolicy)。

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

- `plugins.enabled: false` 会禁用所有插件，并跳过发现/加载
  工作。在此设置生效时，过期的插件引用会保持不活动状态；如果希望移除过期 ID，
  请先重新启用插件，再运行 Doctor 清理。
- `plugins.deny` 的优先级高于允许列表和每个插件的启用设置。
- `plugins.allow` 是排他性允许列表。允许列表之外的插件自有工具
  即使 `tools.allow` 包含 `"*"`，也仍不可用。
- `plugins.entries.<id>.enabled: false` 会禁用单个插件，同时保留其
  配置。
- `plugins.load.paths` 会添加显式的本地插件文件或目录。
  托管的 `plugins install` 本地路径必须是插件目录或
  归档；对于独立插件文件，请使用 `plugins.load.paths`。
- 默认禁用源自工作区的插件；使用本地工作区代码前，请显式启用插件或
  将其加入允许列表。
- 内置插件遵循其内置的默认启用/默认禁用元数据，
  除非配置显式覆盖。
- `plugins.slots.<slot>`（`memory` 或 `contextEngine`）会为
  排他类别选择一个插件。选择插槽视为显式激活，并会
  为该插槽强制启用所选插件，即使该插件原本需要选择加入。
  `plugins.deny` 和 `plugins.entries.<id>.enabled: false` 仍会阻止它。
- 当配置指定了内置选择加入插件所拥有的某个
  界面时，这些插件可以自动激活，例如提供商/模型引用、渠道配置、CLI 后端
  或 Agent harness 运行时。
- OpenAI 系列的 Codex 路由会将提供商边界与运行时插件边界
  分开：旧版 Codex 模型引用属于 Doctor 会修复的旧版配置，
  而内置的 `codex` 插件拥有规范 `openai/*` 智能体引用、显式 `agentRuntime.id: "codex"`
  和旧版 `codex/*` 引用的 Codex 应用服务器运行时。

当未设置 `plugins.allow`，且从
工作区或全局插件根目录自动发现非内置插件时，启动日志会记录
`plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`
以及发现的插件 ID；对于较短的列表，还会记录最小化的 `plugins.allow`
片段。在将可信插件复制到 `openclaw.json` 之前，请对列出的
插件 ID 运行 [`openclaw plugins list --enabled --verbose`](/zh-CN/cli/plugins#list)
或 [`openclaw plugins inspect <id>`](/zh-CN/cli/plugins#inspect)。当诊断信息指出插件通过
`without install/load-path provenance` 加载时，同样需要固定信任来源：检查该插件 ID，然后将其固定到
`plugins.allow`，或从可信来源重新安装，使 OpenClaw 记录安装
来源。

当配置验证报告过期插件 ID、允许列表/工具不匹配或旧版内置插件
路径时，请运行 `openclaw doctor` 或 `openclaw doctor --fix`。

## 了解插件格式

OpenClaw 可识别两种插件格式：

| 格式                    | 加载方式                                                                     | 适用场景                                                           |
| ----------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 原生 OpenClaw 插件      | `openclaw.plugin.json` 加上进程内加载的运行时模块                                | 你正在安装或构建 OpenClaw 专用运行时能力                            |
| 兼容包                  | 映射到 OpenClaw 插件清单的 Codex、Claude 或 Cursor 插件布局                  | 你正在复用兼容的技能、命令、钩子或包元数据                          |

这两种格式都会出现在 `openclaw plugins list`、`openclaw plugins inspect`、
`openclaw plugins enable` 和 `openclaw plugins disable` 中。有关包兼容性边界，请参阅
[插件包](/zh-CN/plugins/bundles)；有关原生插件创作，请参阅
[构建插件](/zh-CN/plugins/building-plugins)。

## 插件钩子

插件可以通过两种不同的 API 在运行时注册钩子：

- `api.on(...)`：用于运行时生命周期事件的类型化钩子。这是
  中间件、策略、消息重写、提示词塑形和工具控制的首选界面。
- `api.registerHook(...)`：用于
  [Hooks](/zh-CN/automation/hooks) 中所述的内部钩子系统。它主要用于粗粒度命令/生命周期
  副作用，以及与现有 HOOK 风格自动化的兼容。

简单规则：如果处理程序需要优先级、合并语义或
阻止/取消行为，请使用类型化钩子。如果它只响应 `command:new`、
`command:reset`、`message:sent` 或类似的粗粒度事件，则使用 `api.registerHook`
即可。

由插件管理的内部钩子会以
`plugin:<id>` 显示在 `openclaw hooks list` 中。你无法通过 `openclaw hooks`
启用或禁用它们；请改为启用或禁用插件。

## 验证活动的 Gateway 网关

`openclaw plugins list` 和普通的 `openclaw plugins inspect` 读取冷配置、清单和注册表状态。它们不能证明已在运行的 Gateway 网关导入了相同的插件代码。

当插件显示为已安装，但实时聊天流量未使用它时：

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

托管式 Gateway 网关会在插件安装、更新和卸载导致插件源发生变化后自动重启。在 VPS 或容器安装中，请确保任何手动重启针对的是实际为你的渠道提供服务的 `openclaw gateway run` 子进程，而不仅仅是包装器或监控进程。

## 故障排除

| 症状                                                        | 检查                                                                                                                                      | 修复                                                                                                     |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 插件出现在 `plugins list` 中，但运行时钩子未运行  | 使用 `openclaw plugins inspect <id> --runtime --json`，并通过 `gateway status --deep --require-rpc` 确认活动的 Gateway 网关             | 在安装、更新、配置或源代码更改后重启实时 Gateway 网关                               |
| 出现渠道或工具所有权重复的诊断信息         | 运行 `openclaw plugins list --enabled --verbose`，使用 `--runtime --json` 检查每个可疑插件，并比较渠道/工具所有权 | 禁用其中一个所有者、移除过时的安装，或使用清单中的 `preferOver` 进行有意替换      |
| 配置显示缺少插件                                | 查看[插件清单](/zh-CN/plugins/plugin-inventory)，确认它是内置插件、官方外部插件还是仅有源代码的插件                           | 安装外部软件包、启用内置插件，或移除过时配置                         |
| 安装期间配置无效                               | 阅读验证消息；如果消息指向过时的插件状态，请运行 `openclaw doctor --fix`                                             | Doctor 可以通过禁用对应条目并移除无效载荷来隔离无效的插件配置     |
| 插件路径因可疑的所有权或权限而被阻止 | 检查配置错误之前的诊断信息                                                                                             | 修复文件系统所有权/权限，然后运行 `openclaw plugins registry --refresh`                    |
| `OPENCLAW_NIX_MODE=1` 阻止生命周期命令                | 确认该安装由 Nix 管理                                                                                                      | 在 Nix 源中更改插件选择，而不是使用插件修改命令                      |
| 运行时依赖项导入失败                             | 检查插件是通过 npm/git/ClawHub 安装，还是从本地路径加载                                                 | 运行 `openclaw plugins update <id>`、重新安装该源，或自行安装本地插件依赖项 |

当过时的插件配置仍指定一个已无法发现的渠道插件时，配置验证会将该渠道键降级为警告，而不是硬错误，因此 Gateway 网关启动后仍可为其他所有渠道提供服务。运行 `openclaw doctor --fix` 可移除过时的插件和渠道条目。对于没有过时插件证据的未知渠道键，验证仍会失败，以便拼写错误保持可见。

对于有意的渠道替换，首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并将旧版或优先级较低的插件 ID 作为其值。如果两个插件都被显式启用，OpenClaw 会保留该请求并报告渠道/工具重复诊断，而不是静默选择一个所有者。

如果已安装的软件包报告其 `requires compiled runtime output for
TypeScript entry ...`，则该软件包发布时未包含 OpenClaw 运行时所需的 JavaScript 文件。请在发布者提供已编译的 JavaScript 后更新或重新安装，或者在此之前禁用/卸载该插件。

### 被阻止的插件路径所有权

如果诊断显示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
且随后验证显示 `plugin present but blocked`，则 OpenClaw 发现插件文件的所有者与加载它们的进程所属 Unix 用户不同。请保留插件配置；修复文件系统所有权，或使用拥有该状态目录的同一用户运行 OpenClaw。

对于 Docker 安装，官方镜像以 `node`（uid `1000`）运行，因此主机上通过绑定挂载的 OpenClaw 配置和工作区目录通常应归 uid `1000` 所有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你有意以 root 身份运行 OpenClaw，请改为将托管插件根目录的所有权修复为 root：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修复所有权后，重新运行 `openclaw doctor --fix` 或 `openclaw plugins registry --refresh`，使持久化的插件注册表与修复后的文件保持一致。

### 插件工具设置缓慢

如果智能体轮次在准备工具时似乎停滞，请启用跟踪日志并检查插件工具工厂计时行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

查找：

```text
[trace:plugin-tools] factory timings ...
```

摘要会列出工厂总耗时和最慢的插件工具工厂，包括插件 ID、声明的工具名称、结果形态以及工具是否为可选项。当单个工厂耗时至少 1s，或插件工具工厂准备总耗时至少 5s 时，慢速行会提升为警告。

对于使用相同有效请求上下文的重复解析，OpenClaw 会缓存成功的插件工具工厂结果。缓存键包括有效的运行时配置、工作区和智能体 ID、沙箱策略、浏览器设置、交付上下文、请求者身份及所有权状态，因此依赖这些可信字段的工厂会在上下文变化时重新运行。如果耗时持续偏高，该插件可能在返回工具定义之前执行了昂贵操作。

如果某个插件占据了大部分耗时，请检查其运行时注册：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然后更新、重新安装或禁用该插件。插件作者应将昂贵的依赖加载移至工具执行路径中，而不是在工具工厂内执行。

有关依赖根目录、软件包元数据验证、注册表记录、启动时重新加载行为和旧版清理，请参阅[插件依赖解析](/zh-CN/plugins/dependency-resolution)。

## 相关内容

- [管理插件](/zh-CN/plugins/manage-plugins) - 列出、安装、更新、卸载和发布的命令示例
- [`openclaw plugins`](/zh-CN/cli/plugins) - 完整的 CLI 参考
- [插件清单](/zh-CN/plugins/plugin-inventory) - 生成的内置和外部插件列表
- [插件参考](/zh-CN/plugins/reference) - 生成的各插件参考页面
- [社区插件](/zh-CN/plugins/community) - ClawHub 发现和文档 PR 策略
- [插件依赖解析](/zh-CN/plugins/dependency-resolution) - 安装根目录、注册表记录和运行时边界
- [构建插件](/zh-CN/plugins/building-plugins) - 原生插件创作指南
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) - 运行时注册、钩子和 API 字段
- [插件清单](/zh-CN/plugins/manifest) - 清单和软件包元数据
