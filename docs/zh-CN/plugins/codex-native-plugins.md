---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Native Codex plugins
    - 你正在迁移源码安装的 openai-curated Codex 插件
    - 你正在排查 codexPlugins、应用清单、破坏性操作或插件应用诊断
summary: 为 Codex 模式的 OpenClaw 智能体配置已迁移的原生 Codex 插件
title: Native Codex plugins
x-i18n:
    generated_at: "2026-07-02T00:44:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 11a883137ba89936cf564a45b22c9e76097af669e2ef6c70c8c710bb2b79d3c0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex plugins 支持允许 Codex 模式的 OpenClaw 智能体在处理 OpenClaw 轮次的同一个 Codex 线程中，使用 Codex app-server 自身的应用和插件能力。

OpenClaw 不会把 Codex plugins 翻译成合成的 `codex_plugin_*` OpenClaw 动态工具。插件调用会保留在原生 Codex transcript 中，并由 Codex app-server 负责 app-backed MCP 执行。

请在基础 [Codex harness](/zh-CN/plugins/codex-harness) 正常工作后使用本页。

## 要求

- 所选 OpenClaw agent runtime 必须是原生 Codex harness。
- `plugins.entries.codex.enabled` 必须为 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必须为 true。
- V1 仅支持迁移观察到在源 Codex home 中以源码安装的 `openai-curated` 插件。
- 目标 Codex app-server 必须能看到预期的 marketplace、插件和 app 清单。

`codexPlugins` 对 OpenClaw 运行、普通 OpenAI provider 运行、ACP 会话绑定或其他 harness 没有效果，因为这些路径不会创建带原生 `apps` 配置的 Codex app-server 线程。

OpenAI 侧的 Codex 访问权限、app 可用性以及工作区 app/plugin 控制来自已登录的 Codex 账户。关于 OpenAI 账户和管理员模型，请参阅 [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 快速开始

从源 Codex home 预览迁移：

```bash
openclaw migrate codex --dry-run
```

当你希望迁移在规划原生插件激活前检查源 app 可访问性时，请使用严格的源 app 验证：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

当计划看起来正确时，应用迁移：

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

更改 `codexPlugins` 后，新的 Codex 会话会自动获取更新后的 app 集。使用 `/new` 或 `/reset` 刷新当前会话。启用或禁用插件不需要重启 Gateway 网关。

## 从聊天管理插件

当你想在操作 Codex harness 的同一个聊天中检查或更改已配置的原生 Codex plugins 时，请使用 `/codex plugins`：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的别名。列表输出会显示来自 `plugins.entries.codex.config.codexPlugins.plugins` 的已配置插件键、开关状态、Codex 插件名称和 marketplace。

`enable` 和 `disable` 只会写入 `~/.openclaw/openclaw.json` 中的 OpenClaw 配置；它们不会编辑 `~/.codex/config.toml` 或安装新的 Codex plugins。只有所有者或具有 `operator.admin` 作用域的 Gateway 网关客户端可以更改插件状态。

启用一个已配置插件也会打开全局 `codexPlugins.enabled` 开关。如果插件因迁移返回 `auth_required` 而被写为禁用，请先在 Codex 中重新授权该 app，然后再在 OpenClaw 中启用它。

## 原生插件设置的工作方式

该集成有三种独立状态：

- 已安装：Codex 在目标 app-server runtime 中有本地插件包。
- 已启用：OpenClaw 配置愿意让该插件可用于 Codex harness 轮次。
- 可访问：Codex app-server 确认该插件的 app 条目对当前账户可用，并且可以映射到已迁移的插件身份。

迁移是持久的安装/资格步骤。在规划期间，OpenClaw 会读取源 Codex `plugin/read` 详情，并检查源 Codex app-server 账户响应是否为 ChatGPT 订阅账户。非 ChatGPT 或缺失账户响应会以 `codex_subscription_required` 跳过 app-backed 插件。默认情况下，迁移不会调用源 `app/list`；通过账户门槛的 app-backed 源插件会在不进行源 app 可访问性验证的情况下被规划，账户查找传输失败会以 `codex_account_unavailable` 跳过。使用 `--verify-plugin-apps` 时，迁移会获取新的源 `app/list` 快照，并要求每个归属 app 在规划原生激活前都存在、已启用且可访问。在该模式下，账户查找传输失败会落入源 app 清单门槛。运行时 app 清单是在迁移后的目标会话可访问性检查。随后，Codex harness 会话设置会为已启用且可访问的插件 app 计算限制性的线程 app 配置。

当 OpenClaw 建立 Codex harness 会话或替换过期的 Codex 线程绑定时，会计算线程 app 配置。它不会在每个轮次重新计算，因此 `/codex plugins enable` 和 `/codex plugins disable` 会影响新的 Codex 会话。当当前会话应获取更新后的 app 集时，请使用 `/new` 或 `/reset`。

## V1 支持边界

V1 有意保持狭窄：

- 只有已经安装在源 Codex app-server 清单中的 `openai-curated` 插件才符合迁移条件。
- app-backed 源插件必须通过迁移时的订阅门槛。`--verify-plugin-apps` 会增加源 app 清单门槛。受订阅限制的账户，以及在验证模式下不可访问、已禁用、缺失的源 app 或源 app 清单刷新失败，都会被报告为跳过的手动项，而不是已启用的配置条目。无法读取的插件详情会在源 app 清单门槛前被跳过。
- 迁移会写入带 `marketplaceName` 和 `pluginName` 的显式插件身份；不会写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是全局启用开关。
- 没有 `plugins["*"]` 通配符，也没有授予任意安装权限的配置键。
- 不支持的 marketplaces、缓存插件包、hooks 和 Codex 配置文件会保留在迁移报告中，以供手动审查。

## App 清单和所有权

OpenClaw 通过 app-server `app/list` 读取 Codex app 清单，将其缓存一小时，并异步刷新过期或缺失的条目。该缓存仅在内存中；重启 CLI 或 Gateway 网关会丢弃它，OpenClaw 会从下一次 `app/list` 读取重新构建它。

迁移和运行时使用不同的缓存键：

- 源迁移验证使用源 Codex home 和源 app-server 启动选项。这只会在设置 `--verify-plugin-apps` 时运行，并且会为该规划运行强制执行新的源 `app/list` 遍历。
- 目标运行时设置在构建 Codex 线程 app 配置时，使用目标 agent 的 Codex app-server 身份。插件激活会使该目标缓存键失效，然后在 `plugin/install` 后强制刷新它。

只有当 OpenClaw 可以通过稳定所有权将插件 app 映射回已迁移插件时，才会暴露该插件 app：

- 来自插件详情的精确 app id
- 已知 MCP server name
- 唯一的稳定 metadata

仅显示名称匹配或所有权含糊的 app 会被排除，直到下一次清单刷新证明所有权。

## 线程 app 配置

OpenClaw 会为 Codex 线程注入限制性的 `config.apps` 补丁：禁用 `_default`，并且只启用由已启用的已迁移插件拥有的 app。

OpenClaw 会根据有效的全局或每插件 `allow_destructive_actions` 策略设置 app 级 `destructive_enabled`，并让 Codex 根据其原生 app 工具注解强制执行破坏性工具 metadata。`true`、`"auto"` 和 `"ask"` 会设置 `destructive_enabled: true`；`false` 会将其设为 false。`_default` app 配置会以 `open_world_enabled: false` 禁用。已启用的插件 app 会以 `open_world_enabled: true` 发出；OpenClaw 不暴露单独的插件 open-world 策略开关，也不维护每插件的破坏性工具名称拒绝列表。

插件 app 的工具审批模式默认为自动，因此非破坏性读取工具可以在没有同线程审批 UI 的情况下运行。破坏性工具仍由每个 app 的 `destructive_enabled` 策略控制。

## 破坏性操作策略

已迁移 Codex plugins 默认允许破坏性插件 elicitations，而不安全 schema 和所有权含糊仍会 fail closed：

- 全局 `allow_destructive_actions` 默认为 `true`。
- 每插件 `allow_destructive_actions` 会为该插件覆盖全局策略。
- 当策略为 `false` 时，OpenClaw 会返回确定性的拒绝。
- 当策略为 `true` 时，OpenClaw 只会自动接受它能映射到审批响应的安全 schema，例如布尔 approve 字段。
- 当策略为 `"auto"` 时，OpenClaw 会向 Codex 暴露破坏性插件操作，但会在返回 Codex 审批响应前，将所有权已证明的 MCP 审批 elicitations 转换成 OpenClaw 插件审批。
- 当策略为 `"ask"` 时，OpenClaw 使用与 `"auto"` 相同的 Codex 写入/破坏性门控，在该 app 的线程启动前清除持久的 Codex 每工具审批覆盖，并且只提供一次性批准或拒绝，因此持久审批不能压制后续写入操作提示。
- 对于每个使用 `"ask"` 的已准入 app，OpenClaw 会为该 app 选择 Codex 的 human approvals reviewer，因此 Codex 会把它的审批 elicitations 发送给 OpenClaw。其他 app 和非 app 线程审批会保留其已配置的 reviewer 和策略。
- 缺失插件身份、所有权含糊、缺失 turn id、错误 turn id 或不安全 elicitation schema 会被拒绝，而不是提示。

## 故障排除

**`auth_required`：** 迁移已安装该插件，但它的某个 app 仍需要身份验证。显式插件条目会被写为禁用，直到你重新授权并启用它。

**`app_inaccessible`、`app_disabled` 或 `app_missing`：**
迁移没有安装该插件，因为在设置 `--verify-plugin-apps` 时，源 Codex app 清单没有显示所有归属 app 都存在、已启用且可访问。请在 Codex 中重新授权或启用该 app，然后使用 `--verify-plugin-apps` 重新运行迁移。

**`app_inventory_unavailable`：** 迁移没有安装该插件，因为请求了严格源 app 验证，而源 Codex app 清单刷新失败。请修复源 Codex app-server 访问，或者如果你接受更快的账户门控计划，则不带 `--verify-plugin-apps` 重试。

**`codex_subscription_required`：** 迁移没有安装 app-backed 插件，因为源 Codex app-server 账户未使用 ChatGPT 订阅账户登录。请使用订阅身份验证登录 Codex app，然后重新运行迁移。

**`codex_account_unavailable`：** 迁移没有安装 app-backed 插件，因为无法读取源 Codex app-server 账户。请修复源 Codex app-server 身份验证，或者如果你希望在账户查找失败时由源 app 清单决定资格，则使用 `--verify-plugin-apps` 重新运行。

**`marketplace_missing` 或 `plugin_missing`：** 目标 Codex app-server 看不到预期的 `openai-curated` marketplace 或插件。请针对目标运行时重新运行迁移，或检查 Codex app-server 插件状态。

**`app_inventory_missing` 或 `app_inventory_stale`：** app 就绪状态来自空缓存或过期缓存。OpenClaw 会调度异步刷新，并在所有权和就绪状态已知前排除插件 app。

**`app_ownership_ambiguous`：** app 清单只按显示名称匹配，因此该 app 不会暴露给 Codex 线程。

**配置已更改，但智能体看不到插件：** 使用 `/codex plugins
list` 确认已配置状态，然后使用 `/new` 或 `/reset`。现有
Codex 线程绑定会保留启动时的应用配置，直到 OpenClaw
建立新的 harness 会话或替换陈旧绑定。

**破坏性操作被拒绝：** 检查全局和按插件配置的
`allow_destructive_actions` 值。即使策略为 true、`"auto"` 或
`"ask"`，不安全的征询模式和含糊的插件身份仍会以拒绝方式失败。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [配置参考](/zh-CN/gateway/configuration-reference#codex-harness-plugin-config)
- [迁移 CLI](/zh-CN/cli/migrate)
