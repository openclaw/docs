---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Native Codex plugins
    - 你正在迁移从源码安装的 OpenAI 精选 Codex 插件
    - 你正在排查 codexPlugins、应用清单、破坏性操作或插件应用诊断
summary: 为 Codex 模式 OpenClaw 智能体配置迁移后的原生 Codex 插件
title: Native Codex plugins
x-i18n:
    generated_at: "2026-06-27T10:19:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 82d8eb7ca7c10db5220c49426f5e9db5992ee751d48b2ac8c89e93773fc87776
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex 插件支持允许 Codex 模式的 OpenClaw 智能体在处理 OpenClaw 轮次的同一个 Codex 线程中，使用 Codex app-server 自身的应用和插件能力。

OpenClaw 不会把 Codex 插件转换成合成的 `codex_plugin_*` OpenClaw 动态工具。插件调用保留在原生 Codex transcript 中，并由 Codex app-server 负责应用支持的 MCP 执行。

请在基础 [Codex harness](/zh-CN/plugins/codex-harness) 正常工作后使用本页。

## 要求

- 所选 OpenClaw 智能体运行时必须是原生 Codex harness。
- `plugins.entries.codex.enabled` 必须为 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必须为 true。
- V1 仅支持迁移观察到已在源 Codex home 中以源码方式安装的 `openai-curated` 插件。
- 目标 Codex app-server 必须能够看到预期的 marketplace、插件和应用清单。

`codexPlugins` 对 OpenClaw 运行、普通 OpenAI provider 运行、ACP 会话绑定或其他 harness 没有效果，因为这些路径不会创建带有原生 `apps` 配置的 Codex app-server 线程。

OpenAI 侧的 Codex 访问权限、应用可用性以及工作区应用/插件控制来自已登录的 Codex 账号。有关 OpenAI 账号和管理员模型，请参阅 [通过你的 ChatGPT 计划使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 快速开始

从源 Codex home 预览迁移：

```bash
openclaw migrate codex --dry-run
```

如果你希望迁移在规划原生插件激活前检查源应用可访问性，请使用严格的源应用验证：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

当计划看起来正确时应用迁移：

```bash
openclaw migrate apply codex --yes
```

迁移会为符合条件的插件写入显式 `codexPlugins` 条目，并为所选插件调用 Codex app-server `plugin/install`。典型的迁移后配置如下：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

更改 `codexPlugins` 后，新的 Codex 会话会自动采用更新后的应用集。使用 `/new` 或 `/reset` 刷新当前会话。启用或禁用插件更改不需要重启 Gateway 网关。

## 从聊天管理插件

当你想在操作 Codex harness 的同一个聊天中检查或更改已配置的原生 Codex 插件时，请使用 `/codex plugins`：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的别名。列表输出会显示来自 `plugins.entries.codex.config.codexPlugins.plugins` 的已配置插件键、开关状态、Codex 插件名称和 marketplace。

`enable` 和 `disable` 只会写入 `~/.openclaw/openclaw.json` 中的 OpenClaw 配置；它们不会编辑 `~/.codex/config.toml`，也不会安装新的 Codex 插件。只有所有者或具有 `operator.admin` scope 的 Gateway 网关客户端可以更改插件状态。

启用已配置的插件也会打开全局 `codexPlugins.enabled` 开关。如果插件因为迁移返回 `auth_required` 而被写入为禁用状态，请先在 Codex 中重新授权该应用，再在 OpenClaw 中启用它。

## 原生插件设置的工作方式

该集成包含三种独立状态：

- 已安装：Codex 在目标 app-server 运行时中拥有本地插件包。
- 已启用：OpenClaw 配置愿意让该插件可用于 Codex harness 轮次。
- 可访问：Codex app-server 确认插件的应用条目对当前账号可用，并且可以映射到迁移后的插件身份。

迁移是持久化的安装/资格步骤。在规划期间，OpenClaw 会读取源 Codex `plugin/read` 详情，并检查源 Codex app-server 账号响应是否为 ChatGPT 订阅账号。非 ChatGPT 或缺失的账号响应会以 `codex_subscription_required` 跳过应用支持的插件。默认情况下，迁移不会调用源 `app/list`；通过账号门禁的应用支持源插件会在没有源应用可访问性验证的情况下进入计划，而账号查询传输失败会以 `codex_account_unavailable` 跳过。使用 `--verify-plugin-apps` 时，迁移会获取新的源 `app/list` 快照，并要求每个拥有的应用都存在、已启用且可访问，然后才规划原生激活。在该模式下，账号查询传输失败会继续进入源应用清单门禁。运行时应用清单是迁移后的目标会话可访问性检查。随后，Codex harness 会话设置会为已启用且可访问的插件应用计算限制性线程应用配置。

线程应用配置会在 OpenClaw 建立 Codex harness 会话或替换过期的 Codex 线程绑定时计算。它不会在每个轮次重新计算，因此 `/codex plugins enable` 和 `/codex plugins disable` 会影响新的 Codex 会话。当当前会话需要采用更新后的应用集时，请使用 `/new` 或 `/reset`。

## V1 支持边界

V1 有意保持范围较窄：

- 只有已经安装在源 Codex app-server 清单中的 `openai-curated` 插件才符合迁移条件。
- 应用支持的源插件必须通过迁移时的订阅门禁。`--verify-plugin-apps` 会添加源应用清单门禁。受订阅限制的账号，以及在验证模式下不可访问、已禁用、缺失的源应用或源应用清单刷新失败，都会报告为已跳过的手动项，而不是已启用的配置条目。无法读取的插件详情会在源应用清单门禁前被跳过。
- 迁移会使用 `marketplaceName` 和 `pluginName` 写入显式插件身份；它不会写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是全局启用开关。
- 没有 `plugins["*"]` 通配符，也没有授予任意安装权限的配置键。
- 不受支持的 marketplace、缓存的插件包、钩子和 Codex 配置文件会保留在迁移报告中，供手动审查。

## 应用清单和所有权

OpenClaw 通过 app-server `app/list` 读取 Codex 应用清单，将其缓存一小时，并异步刷新过期或缺失的条目。缓存仅存在于内存中；重启 CLI 或 Gateway 网关会丢弃它，OpenClaw 会从下一次 `app/list` 读取重新构建。

迁移和运行时使用不同的缓存键：

- 源迁移验证使用源 Codex home 和源 app-server 启动选项。它仅在设置 `--verify-plugin-apps` 时运行，并会强制对该规划运行执行新的源 `app/list` 遍历。
- 目标运行时设置会在构建 Codex 线程应用配置时使用目标智能体的 Codex app-server 身份。插件激活会使该目标缓存键失效，然后在 `plugin/install` 后强制刷新它。

只有当 OpenClaw 能够通过稳定所有权将插件应用映射回迁移后的插件时，才会暴露该应用：

- 来自插件详情的精确应用 ID
- 已知 MCP 服务器名称
- 唯一稳定元数据

仅显示名称匹配或存在歧义的所有权会被排除，直到下一次清单刷新证明所有权。

## 线程应用配置

OpenClaw 会为 Codex 线程注入限制性的 `config.apps` 补丁：禁用 `_default`，并且只启用由已启用迁移插件拥有的应用。

OpenClaw 会根据有效的全局或每插件 `allow_destructive_actions` 策略设置应用级 `destructive_enabled`，并让 Codex 根据其原生应用工具注解强制执行破坏性工具元数据。`true`、`"auto"` 和 `"always"` 会设置 `destructive_enabled: true`；`false` 会将其设为 false。`_default` 应用配置会以 `open_world_enabled: false` 禁用。已启用的插件应用会以 `open_world_enabled: true` 输出；OpenClaw 不会暴露单独的插件开放世界策略旋钮，也不会维护每插件破坏性工具名称拒绝列表。

插件应用默认使用自动工具审批模式，因此非破坏性读取工具可以在没有同线程审批 UI 的情况下运行。破坏性工具仍由每个应用的 `destructive_enabled` 策略控制。

## 破坏性操作策略

迁移后的 Codex 插件默认允许破坏性插件征询，而不安全 schema 和有歧义的所有权仍会失败关闭：

- 全局 `allow_destructive_actions` 默认值为 `true`。
- 每插件 `allow_destructive_actions` 会覆盖该插件的全局策略。
- 当策略为 `false` 时，OpenClaw 返回确定性的拒绝。
- 当策略为 `true` 时，OpenClaw 只会自动接受它能映射到审批响应的安全 schema，例如布尔型 approve 字段。
- 当策略为 `"auto"` 时，OpenClaw 会向 Codex 暴露破坏性插件操作，但会在返回 Codex 审批响应前，把所有权已证明的 MCP 审批征询转换为 OpenClaw 插件审批。
- 当策略为 `"always"` 时，OpenClaw 使用与 `"auto"` 相同的 Codex 写入/破坏性门禁，在线程启动前清除应用的持久 Codex 每工具审批覆盖，并且只提供一次性审批或拒绝，因此持久审批无法抑制后续写入操作提示。
- 缺失插件身份、有歧义的所有权、缺失轮次 ID、错误轮次 ID 或不安全的征询 schema 都会拒绝，而不是提示。

## 故障排除

**`auth_required`：** 迁移安装了插件，但它的某个应用仍需要认证。显式插件条目会被写入为禁用状态，直到你重新授权并启用它。

**`app_inaccessible`、`app_disabled` 或 `app_missing`：**
迁移未安装插件，因为在设置 `--verify-plugin-apps` 时，源 Codex 应用清单未显示所有拥有的应用都存在、已启用且可访问。请在 Codex 中重新授权或启用该应用，然后使用 `--verify-plugin-apps` 重新运行迁移。

**`app_inventory_unavailable`：** 迁移未安装插件，因为请求了严格源应用验证，并且源 Codex 应用清单刷新失败。修复源 Codex app-server 访问，或者如果你接受更快的账号门禁计划，可以不带 `--verify-plugin-apps` 重试。

**`codex_subscription_required`：** 迁移未安装应用支持的插件，因为源 Codex app-server 账号未使用 ChatGPT 订阅账号登录。使用订阅认证登录 Codex 应用，然后重新运行迁移。

**`codex_account_unavailable`：** 迁移未安装应用支持的插件，因为无法读取源 Codex app-server 账号。修复源 Codex app-server 认证；如果你希望在账号查询失败时由源应用清单决定资格，请带 `--verify-plugin-apps` 重新运行。

**`marketplace_missing` 或 `plugin_missing`：** 目标 Codex app-server 看不到预期的 `openai-curated` marketplace 或插件。针对目标运行时重新运行迁移，或检查 Codex app-server 插件状态。

**`app_inventory_missing` 或 `app_inventory_stale`：** 应用就绪状态来自空缓存或过期缓存。OpenClaw 会调度异步刷新，并在所有权和就绪状态已知前排除插件应用。

**`app_ownership_ambiguous`：** 应用清单仅通过显示名称匹配，因此该应用不会暴露给 Codex 线程。

**配置已更改，但智能体看不到插件：** 使用 `/codex plugins
list` 确认已配置状态，然后使用 `/new` 或 `/reset`。现有 Codex 线程绑定会保留其启动时的应用配置，直到 OpenClaw 建立新的 harness 会话或替换过期绑定。

**破坏性操作被拒绝：**检查全局和按插件配置的
`allow_destructive_actions` 值。即使策略为 true、`"auto"` 或
`"always"`，不安全的 elicitation schema 和模糊的插件身份仍会以失败关闭处理。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [配置参考](/zh-CN/gateway/configuration-reference#codex-harness-plugin-config)
- [迁移 CLI](/zh-CN/cli/migrate)
