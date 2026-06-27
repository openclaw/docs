---
doc-schema-version: 1
read_when:
    - 安装或配置插件
    - 理解插件发现和加载规则
    - 使用兼容 Codex/Claude 的插件包
sidebarTitle: Getting Started
summary: 安装、配置和管理 OpenClaw 插件
title: 插件
x-i18n:
    generated_at: "2026-06-27T03:31:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c61e0ddb164baba368fbf57883e7a72eddadc28cb100ed6c4f11977c55576513
    source_path: tools/plugin.md
    workflow: 16
---

插件通过渠道、模型提供商、Agent harnesses、工具、技能、语音、实时转录、Voice、媒体理解、生成、Web 获取、Web 搜索和其他运行时能力来扩展 OpenClaw。

当你想安装插件、重启 Gateway 网关、验证运行时已加载它，并处理常见设置失败时，请使用本页。仅命令示例请参见[管理插件](/zh-CN/plugins/manage-plugins)。内置、官方外部和仅源码插件的完整生成清单请参见[插件清单](/zh-CN/plugins/plugin-inventory)。

## 要求

安装插件前，请确保你具备：

- 可用 `openclaw` CLI 的 OpenClaw checkout 或安装
- 对所选来源的网络访问权限，例如 ClawHub、npm 或 git 主机
- 该插件设置文档中列出的任何插件专用凭证、配置键名或操作系统工具
- 允许为你的渠道提供服务的 Gateway 网关重新加载或重启的权限

## 快速开始

<Steps>
  <Step title="Find the plugin">
    在 [ClawHub](/zh-CN/clawhub) 中搜索公开插件包：

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub 是社区插件的主要发现入口。在发布切换期间，普通的裸包规格仍会从 npm 安装，除非它们匹配官方插件 ID。匹配内置插件的原始 `@openclaw/*` 包规格会使用当前 OpenClaw 构建中的内置副本。当你需要指定某个来源时，请使用显式前缀。

  </Step>

  <Step title="Install the plugin">
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

    将插件安装视为运行代码。当你需要可复现的生产安装时，优先使用固定版本。

  </Step>

  <Step title="Configure and enable it">
    在 `plugins.entries.<id>.config` 下配置插件专用设置。当插件尚未启用时启用它：

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    如果你的配置使用限制性的 `plugins.allow` 列表，则安装的插件 ID 必须先出现在其中，插件才能加载。`openclaw plugins install` 会将安装的 ID 添加到现有 `plugins.allow` 列表，并从 `plugins.deny` 中移除相同 ID，以便显式安装在重启后可以加载。

  </Step>

  <Step title="Let the Gateway reload">
    安装、更新或卸载插件代码需要重启 Gateway 网关。当托管的 Gateway 网关已在运行且启用了配置重新加载时，OpenClaw 会检测变更后的插件安装记录，并自动重启 Gateway 网关。如果 Gateway 网关未被托管或重新加载已禁用，请自行重启：

    ```bash
    openclaw gateway restart
    ```

    启用和禁用操作会更新配置并刷新冷注册表。对于实时运行时表面，运行时 inspect 仍然是最清晰的验证路径。

  </Step>

  <Step title="Verify runtime registration">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    当你需要证明已注册的工具、钩子、服务、Gateway 网关方法或插件拥有的 CLI 命令时，请使用 `--runtime`。普通 `inspect` 是冷清单和注册表检查。

  </Step>
</Steps>

## 配置

### 选择安装来源

| 来源        | 适用场景                                                                       | 示例                                                           |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| ClawHub     | 你想要 OpenClaw 原生的发现、扫描、版本元数据和安装提示                        | `openclaw plugins install clawhub:<package>`                   |
| npm         | 你需要直接使用 npm 注册表或 dist-tag 工作流                                    | `openclaw plugins install npm:<package>`                       |
| git         | 你需要仓库中的分支、标签或提交                                                 | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 本地路径    | 你正在同一台机器上开发或测试插件                                               | `openclaw plugins install --link ./my-plugin`                  |
| marketplace | 你正在安装 Claude 兼容的 marketplace 插件                                      | `openclaw plugins install <plugin> --marketplace <source>`     |

裸包规格具有特殊兼容行为。如果裸名称匹配内置插件 ID，OpenClaw 会使用该内置来源。如果它匹配官方外部插件 ID，OpenClaw 会使用官方包目录。其他普通裸包规格会在发布切换期间通过 npm 安装。匹配内置插件的原始 `@openclaw/*` 包规格也会在 npm 回退之前解析为内置副本。当你有意想使用外部 npm 包，而不是镜像拥有的内置副本时，请使用 `npm:@openclaw/<plugin>@<version>`。当你需要确定性来源选择时，请使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:`。完整命令契约请参见 [`openclaw plugins`](/zh-CN/cli/plugins#install)。

对于 npm 安装，未固定的包规格和 `@latest` 会选择声明与此 OpenClaw 构建兼容的最新稳定包。如果 npm 当前最新版本声明了更新的 `openclaw.compat.pluginApi` 或 `openclaw.install.minHostVersion`，OpenClaw 会扫描较旧的稳定包版本，并安装符合条件的最新版本。精确版本和显式渠道标签（例如 `@beta`）会固定到所选包，并在不兼容时失败。

### 操作者安装策略

配置 `security.installPolicy`，以便在插件安装或更新继续之前运行受信任的本地策略命令。该策略会接收元数据和暂存来源路径，并可允许或阻止安装。它覆盖 CLI 和 Gateway 网关支持的插件安装/更新路径。插件 `before_install` 钩子稍后只会在已加载插件钩子的 OpenClaw 进程中运行，因此请使用 `security.installPolicy` 处理操作者拥有的安装决策。已弃用的 `--dangerously-force-unsafe-install` 标志会为兼容性被接受，但不会绕过安装策略或 OpenClaw 的内置插件依赖拒绝列表。

技能和插件共用的 `security.installPolicy` exec schema 请参见 [Skills 配置](/zh-CN/tools/skills-config#operator-install-policy-securityinstallpolicy)。

### 配置插件策略

常见插件配置形状如下：

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

- `plugins.enabled: false` 会禁用所有插件，并跳过插件发现/加载工作。启用期间，过期插件引用处于惰性状态；当你想移除过期 ID 时，请先重新启用插件，再运行 Doctor 清理。
- `plugins.deny` 优先于 allow 和单插件启用状态。
- `plugins.allow` 是排他性允许列表。允许列表之外由插件拥有的工具仍不可用，即使 `tools.allow` 包含 `"*"`。
- `plugins.entries.<id>.enabled: false` 会在保留配置的同时禁用一个插件。
- `plugins.load.paths` 添加显式本地插件文件或目录。托管的 `plugins install` 本地路径必须是插件目录或归档；对于独立插件文件，请使用 `plugins.load.paths`。
- 工作区来源的插件默认禁用；使用本地工作区代码前，请显式启用或将其加入允许列表。
- 内置插件遵循其内置的默认开启/默认关闭元数据，除非配置显式覆盖它们。
- `plugins.slots.<slot>` 为内存和上下文引擎等排他类别选择一个插件。槽位选择会通过计为显式激活来强制启用所选插件用于该槽位；即使它原本需要选择加入，也可以加载。`plugins.deny` 和 `plugins.entries.<id>.enabled: false` 仍会阻止它。
- 当配置命名了内置选择加入插件拥有的某个表面时，这些插件可以自动激活，例如提供商/模型 ref、渠道配置、CLI 后端或 agent harness runtime。
- OpenAI 系列 Codex 路由将提供商和运行时插件边界保持分离：旧版 Codex 模型 ref 是由 Doctor 修复的旧版配置，而内置 `codex` 插件拥有用于规范 `openai/*` Agent ref、显式 `agentRuntime.id: "codex"` 和旧版 `codex/*` ref 的 Codex app-server runtime。

当未设置 `plugins.allow`，且非内置插件从工作区或全局插件根目录自动发现时，启动日志会输出 `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`。该警告会包含发现的插件 ID；对于较短列表，还会包含最小 `plugins.allow` 片段。在将受信任插件复制到 `openclaw.json` 前，请使用列出的插件 ID 运行 [`openclaw plugins list --enabled --verbose`](/zh-CN/cli/plugins#list) 或 [`openclaw plugins inspect <id>`](/zh-CN/cli/plugins#inspect)。当诊断提示某个插件在 `without install/load-path provenance` 状态下加载时，也适用同样的信任固定指导：inspect 该插件 ID，然后在 `plugins.allow` 中固定受信任 ID，或从受信任来源重新安装，使 OpenClaw 记录安装来源证明。

当配置验证报告过期插件 ID、允许列表/工具不匹配或旧版内置插件路径时，运行 `openclaw doctor` 或 `openclaw doctor --fix`。

## 了解插件格式

OpenClaw 识别两种插件格式：

| 格式                   | 加载方式                                                                     | 适用场景                                                               |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 原生 OpenClaw 插件     | `openclaw.plugin.json` 加上进程内加载的运行时模块                            | 你正在安装或构建 OpenClaw 专用运行时能力                               |
| 兼容 bundle            | 映射到 OpenClaw 插件清单中的 Codex、Claude 或 Cursor 插件布局                | 你正在复用兼容的技能、命令、钩子或 bundle 元数据                       |

两种格式都会出现在 `openclaw plugins list`、`openclaw plugins inspect`、`openclaw plugins enable` 和 `openclaw plugins disable` 中。bundle 兼容边界请参见[插件 bundle](/zh-CN/plugins/bundles)，原生插件编写请参见[构建插件](/zh-CN/plugins/building-plugins)。

## 插件钩子

插件可以在运行时注册钩子，但有两种不同 API，职责也不同。

- 对运行时生命周期钩子使用通过 `api.on(...)` 的类型化钩子。这是中间件、策略、消息重写、提示词塑形和工具控制的首选表面。
- 只有当你想参与 [Hooks](/zh-CN/automation/hooks) 中描述的内部钩子系统时，才使用 `api.registerHook(...)`。这主要用于粗粒度命令/生命周期副作用，以及与现有 HOOK 风格自动化的兼容性。

快速规则：

- 如果处理程序需要优先级、合并语义或阻塞/取消行为，请使用类型化插件钩子。
- 如果处理程序只是响应 `command:new`、`command:reset`、`message:sent` 或类似粗粒度事件，`api.registerHook(...)` 就可以。

插件管理的内部钩子会在 `openclaw hooks list` 中以 `plugin:<id>` 显示。你不能通过 `openclaw hooks` 启用或禁用它们；请改为启用或禁用插件。

## 验证活动 Gateway 网关

`openclaw plugins list` 和普通的 `openclaw plugins inspect` 会读取冷态配置、清单和注册表状态。它们不能证明已运行的 Gateway 网关已经导入了同一份插件代码。

当插件显示已安装但实时聊天流量没有使用它时：

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

托管 Gateway 网关会在插件安装、更新和卸载更改影响插件源码后自动重启。在 VPS 或容器安装中，请确保任何手动重启都针对实际服务你的渠道的 `openclaw gateway run` 子进程，而不只是包装器或 supervisor。

## 故障排除

| 症状 | 检查 | 修复 |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 插件出现在 `plugins list` 中，但运行时钩子未运行 | 使用 `openclaw plugins inspect <id> --runtime --json`，并通过 `gateway status --deep --require-rpc` 确认活动 Gateway 网关 | 在安装、更新、配置或源码更改后重启实时 Gateway 网关 |
| 出现重复渠道或工具所有权诊断 | 运行 `openclaw plugins list --enabled --verbose`，用 `--runtime --json` 检查每个可疑插件，并比较渠道/工具所有权 | 禁用一个所有者、移除陈旧安装，或使用清单 `preferOver` 进行有意替换 |
| 配置提示缺少插件 | 查看 [插件清单](/zh-CN/plugins/plugin-inventory)，确认它是内置插件、官方外部插件还是仅源码插件 | 安装外部包、启用内置插件，或移除陈旧配置 |
| 安装期间配置无效 | 阅读验证消息，并在它指向陈旧插件状态时运行 `openclaw doctor --fix` | Doctor 可以通过禁用条目并移除无效载荷来隔离无效插件配置 |
| 插件路径因可疑所有权或权限被阻止 | 在配置错误前检查诊断 | 修复文件系统所有权/权限，然后运行 `openclaw plugins registry --refresh` |
| `OPENCLAW_NIX_MODE=1` 阻止生命周期命令 | 确认安装由 Nix 管理 | 在 Nix 源中更改插件选择，而不是使用插件变更命令 |
| 依赖导入在运行时失败 | 检查插件是通过 npm/git/ClawHub 安装，还是从本地路径加载 | 运行 `openclaw plugins update <id>`、重新安装源码，或自行安装本地插件依赖 |

当陈旧插件配置仍命名一个已无法发现的渠道插件时，Gateway 网关启动会跳过该插件支持的渠道，而不是阻塞其他所有渠道。运行 `openclaw doctor --fix` 以移除陈旧插件和渠道条目。没有陈旧插件证据的未知渠道键仍会验证失败，以便拼写错误保持可见。

对于有意的渠道替换，首选插件应声明 `channelConfigs.<channel-id>.preferOver`，并填入旧版或较低优先级插件 id。如果两个插件都被显式启用，OpenClaw 会保留该请求并报告重复渠道或工具诊断，而不是静默选择一个所有者。

如果已安装包报告它 `requires compiled runtime output for
TypeScript entry ...`，说明该包发布时缺少 OpenClaw 运行时所需的 JavaScript 文件。请在发布者交付已编译 JavaScript 后更新或重新安装，或在此之前禁用/卸载该插件。

### 被阻止的插件路径所有权

如果插件诊断显示
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
并且配置验证随后显示 `plugin present but blocked`，表示 OpenClaw 发现插件文件由不同于加载它们的进程的 Unix 用户拥有。保留插件配置；修复文件系统所有权，或用拥有状态目录的同一用户运行 OpenClaw。

对于 Docker 安装，官方镜像以 `node`（uid `1000`）运行，因此主机绑定挂载的 OpenClaw 配置和工作区目录通常应由 uid `1000` 拥有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你有意以 root 运行 OpenClaw，请改为将托管插件根目录修复为 root 所有权：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修复所有权后，重新运行 `openclaw doctor --fix` 或
`openclaw plugins registry --refresh`，使持久化插件注册表与已修复文件保持一致。

### 缓慢的插件工具设置

如果智能体轮次在准备工具时似乎卡住，请启用 trace 日志并检查插件工具工厂计时行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

查找：

```text
[trace:plugin-tools] factory timings ...
```

摘要会列出总工厂时间和最慢的插件工具工厂，包括插件 id、声明的工具名称、结果形状，以及该工具是否为可选。当单个工厂耗时至少 1 秒或总插件工具工厂准备耗时至少 5 秒时，慢速行会提升为警告。

OpenClaw 会为相同有效请求上下文中的重复解析缓存成功的插件工具工厂结果。缓存键包含有效运行时配置、工作区、智能体/会话 id、沙箱策略、浏览器设置、交付上下文、请求者身份和所有权状态，因此依赖这些可信字段的工厂会在上下文变化时重新运行。如果计时持续偏高，插件可能在返回工具定义之前执行了昂贵工作。

如果某个插件主导了计时，请检查它的运行时注册：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然后更新、重新安装或禁用该插件。插件作者应将昂贵的依赖加载移到工具执行路径之后，而不是在工具工厂内部执行。

有关依赖根目录、包元数据验证、注册表记录、启动重新加载行为和旧版清理，请参阅
[插件依赖解析](/zh-CN/plugins/dependency-resolution)。

## 相关

- [管理插件](/zh-CN/plugins/manage-plugins) - list、install、update、uninstall 和 publish 的命令示例
- [`openclaw plugins`](/zh-CN/cli/plugins) - 完整 CLI 参考
- [插件清单](/zh-CN/plugins/plugin-inventory) - 生成的内置和外部插件列表
- [插件参考](/zh-CN/plugins/reference) - 生成的逐插件参考页面
- [社区插件](/zh-CN/plugins/community) - ClawHub 发现和文档 PR 策略
- [插件依赖解析](/zh-CN/plugins/dependency-resolution) - 安装根目录、注册表记录和运行时边界
- [构建插件](/zh-CN/plugins/building-plugins) - 原生插件编写指南
- [插件 SDK 概览](/zh-CN/plugins/sdk-overview) - 运行时注册、钩子和 API 字段
- [插件清单](/zh-CN/plugins/manifest) - 清单和包元数据
