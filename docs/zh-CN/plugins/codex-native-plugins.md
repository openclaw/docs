---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Native Codex plugins
    - 你正在迁移从源码安装的 openai-curated Codex 插件
    - 你正在排查 codexPlugins、应用清单、破坏性操作或插件应用诊断
summary: 配置迁移后的 Native Codex plugins，用于代码模式 OpenClaw 智能体
title: Native Codex plugins
x-i18n:
    generated_at: "2026-06-27T02:39:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b82fa533ea540c8a6d63d7e81b94bb31848eb9f71f5ce0ae8f397b303b03f456
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex plugins 支持让 Codex 模式的 OpenClaw 智能体在处理 OpenClaw 轮次的同一个 Codex 线程中使用 Codex app-server 自身的 app 和插件能力。

OpenClaw 不会把 Codex 插件转换为合成的 `codex_plugin_*` OpenClaw 动态工具。插件调用保留在原生 Codex 记录中，Codex app-server 负责 app 支持的 MCP 执行。

请在基础 [Codex harness](/zh-CN/plugins/codex-harness) 正常工作后使用本页。

## 要求

- 选定的 OpenClaw 智能体运行时必须是原生 Codex harness。
- `plugins.entries.codex.enabled` 必须为 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必须为 true。
- V1 仅支持迁移观察到在源 Codex home 中以源安装方式安装的 `openai-curated` 插件。
- 目标 Codex app-server 必须能够看到预期的 marketplace、插件和 app 清单。

`codexPlugins` 对 OpenClaw 运行、正常 OpenAI provider 运行、ACP 对话绑定或其他 harness 没有影响，因为这些路径不会创建带有原生 `apps` 配置的 Codex app-server 线程。

OpenAI 侧的 Codex 访问权限、app 可用性以及工作区 app/插件控制来自已登录的 Codex 账号。关于 OpenAI 账号和管理模型，请参阅 [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 快速开始

从源 Codex home 预览迁移：

```bash
openclaw migrate codex --dry-run
```

如果你希望迁移在规划原生插件激活前检查源 app 可访问性，请使用严格的源 app 验证：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

当计划看起来正确时应用迁移：

```bash
openclaw migrate apply codex --yes
```

迁移会为符合条件的插件写入显式 `codexPlugins` 条目，并为选定插件调用 Codex app-server `plugin/install`。典型的迁移后配置如下：

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

更改 `codexPlugins` 后，新的 Codex 对话会自动使用更新后的 app 集合。使用 `/new` 或 `/reset` 刷新当前对话。启用或禁用插件更改不需要重启 Gateway 网关。

## 从聊天管理插件

如果你想在操作 Codex harness 的同一聊天中查看或更改已配置的原生 Codex 插件，请使用 `/codex plugins`：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的别名。列表输出会显示 `plugins.entries.codex.config.codexPlugins.plugins` 中配置的插件键、开关状态、Codex 插件名称和 marketplace。

`enable` 和 `disable` 只会写入 `~/.openclaw/openclaw.json` 中的 OpenClaw 配置；它们不会编辑 `~/.codex/config.toml` 或安装新的 Codex 插件。只有所有者或具有 `operator.admin` scope 的 Gateway 网关客户端可以更改插件状态。

启用已配置的插件也会开启全局 `codexPlugins.enabled` 开关。如果该插件因迁移返回 `auth_required` 而被写为禁用，请先在 Codex 中重新授权该 app，再在 OpenClaw 中启用它。

## 原生插件设置的工作方式

该集成有三种独立状态：

- 已安装：Codex 在目标 app-server 运行时中具有本地插件 bundle。
- 已启用：OpenClaw 配置愿意让该插件可用于 Codex harness 轮次。
- 可访问：Codex app-server 确认该插件的 app 条目可供当前账号使用，并且可以映射到迁移后的插件身份。

迁移是持久的安装/资格步骤。在规划期间，OpenClaw 读取源 Codex `plugin/read` 详情，并检查源 Codex app-server 账号响应是否为 ChatGPT 订阅账号。非 ChatGPT 或缺失账号响应会跳过 app 支持的插件，并标记为 `codex_subscription_required`。默认情况下，迁移不会调用源 `app/list`；通过账号门槛的 app 支持源插件会在不验证源 app 可访问性的情况下进入计划，账号查询传输失败会以 `codex_account_unavailable` 跳过。使用 `--verify-plugin-apps` 时，迁移会获取新的源 `app/list` 快照，并要求每个归属 app 都存在、已启用且可访问，然后才规划原生激活。在该模式下，账号查询传输失败会继续进入源 app 清单门槛。运行时 app 清单是迁移后的目标会话可访问性检查。随后 Codex harness 会话设置会为已启用且可访问的插件 app 计算限制性的线程 app 配置。

线程 app 配置会在 OpenClaw 建立 Codex harness 会话或替换过期的 Codex 线程绑定时计算。它不会在每个轮次重新计算，因此 `/codex plugins enable` 和 `/codex plugins disable` 会影响新的 Codex 对话。当当前对话需要使用更新后的 app 集合时，请使用 `/new` 或 `/reset`。

## V1 支持边界

V1 有意保持范围狭窄：

- 只有已经安装在源 Codex app-server 清单中的 `openai-curated` 插件符合迁移条件。
- app 支持的源插件必须通过迁移时的订阅门槛。`--verify-plugin-apps` 会增加源 app 清单门槛。受订阅限制的账号，以及在验证模式下不可访问、已禁用、缺失的源 app 或源 app 清单刷新失败，会被报告为已跳过的手动项，而不是已启用的配置条目。无法读取的插件详情会在源 app 清单门槛前被跳过。
- 迁移会写入带有 `marketplaceName` 和 `pluginName` 的显式插件身份；它不会写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是全局启用开关。
- 没有 `plugins["*"]` 通配符，也没有授予任意安装权限的配置键。
- 不受支持的 marketplace、缓存的插件 bundle、钩子和 Codex 配置文件会保留在迁移报告中，供手动审查。

## App 清单和所有权

OpenClaw 通过 app-server `app/list` 读取 Codex app 清单，将其缓存一小时，并异步刷新过期或缺失的条目。该缓存仅在内存中；重启 CLI 或 Gateway 网关会丢弃它，OpenClaw 会从下一次 `app/list` 读取重新构建。

迁移和运行时使用不同的缓存键：

- 源迁移验证使用源 Codex home 和源 app-server 启动选项。它只在设置 `--verify-plugin-apps` 时运行，并会为该规划运行强制执行新的源 `app/list` 遍历。
- 目标运行时设置在构建 Codex 线程 app 配置时使用目标智能体的 Codex app-server 身份。插件激活会使该目标缓存键失效，然后在 `plugin/install` 后强制刷新它。

只有当 OpenClaw 可以通过稳定所有权将插件 app 映射回迁移后的插件时，该 app 才会暴露：

- 来自插件详情的精确 app id
- 已知 MCP server 名称
- 唯一稳定元数据

仅显示名称匹配或所有权不明确的 app 会被排除，直到下一次清单刷新证明所有权。

## 线程 app 配置

OpenClaw 会为 Codex 线程注入限制性的 `config.apps` 补丁：禁用 `_default`，并且只启用由已启用的迁移插件拥有的 app。

OpenClaw 根据有效的全局或按插件 `allow_destructive_actions` 策略设置 app 级 `destructive_enabled`，并让 Codex 通过其原生 app 工具注解强制执行破坏性工具元数据。`true` 和 `"auto"` 都会设置 `destructive_enabled: true`；`false` 会将其设为 false。`_default` app 配置会以 `open_world_enabled: false` 禁用。已启用的插件 app 会以 `open_world_enabled: true` 发出；OpenClaw 不会暴露单独的插件开放世界策略旋钮，也不会维护按插件的破坏性工具名称拒绝列表。

插件 app 的工具审批模式默认是自动的，因此非破坏性的读取工具可以在没有同线程审批 UI 的情况下运行。破坏性工具仍由每个 app 的 `destructive_enabled` 策略控制。

## 破坏性操作策略

已迁移 Codex 插件默认允许破坏性插件 elicitations，而不安全 schema 和不明确所有权仍会失败关闭：

- 全局 `allow_destructive_actions` 默认值为 `true`。
- 按插件 `allow_destructive_actions` 会覆盖该插件的全局策略。
- 当策略为 `false` 时，OpenClaw 返回确定性的拒绝。
- 当策略为 `true` 时，OpenClaw 只会自动接受它可以映射到审批响应的安全 schema，例如布尔 approve 字段。
- 当策略为 `"auto"` 时，OpenClaw 会向 Codex 暴露破坏性插件操作，但会在返回 Codex 审批响应前，将所有权已证明的 MCP 审批 elicitations 转换为 OpenClaw 插件审批。
- 缺失插件身份、所有权不明确、缺失轮次 id、错误轮次 id 或不安全的 elicitation schema 都会拒绝，而不是提示。

## 故障排除

**`auth_required`：** 迁移已安装该插件，但它的某个 app 仍需要认证。显式插件条目会被写为禁用，直到你重新授权并启用它。

**`app_inaccessible`、`app_disabled` 或 `app_missing`：**
迁移没有安装该插件，因为在设置 `--verify-plugin-apps` 时，源 Codex app 清单未显示所有归属 app 均存在、已启用且可访问。请在 Codex 中重新授权或启用该 app，然后使用 `--verify-plugin-apps` 重新运行迁移。

**`app_inventory_unavailable`：** 迁移没有安装该插件，因为请求了严格的源 app 验证且源 Codex app 清单刷新失败。如果你接受更快的账号门槛计划，请修复源 Codex app-server 访问权限，或不带 `--verify-plugin-apps` 重试。

**`codex_subscription_required`：** 迁移没有安装该 app 支持的插件，因为源 Codex app-server 账号未以 ChatGPT 订阅账号登录。请使用订阅认证登录 Codex app，然后重新运行迁移。

**`codex_account_unavailable`：** 迁移没有安装该 app 支持的插件，因为无法读取源 Codex app-server 账号。请修复源 Codex app-server 认证，或者如果你希望在账号查询失败时由源 app 清单决定资格，请使用 `--verify-plugin-apps` 重新运行。

**`marketplace_missing` 或 `plugin_missing`：** 目标 Codex app-server 无法看到预期的 `openai-curated` marketplace 或插件。请针对目标运行时重新运行迁移，或检查 Codex app-server 插件状态。

**`app_inventory_missing` 或 `app_inventory_stale`：** app 就绪状态来自空缓存或过期缓存。OpenClaw 会安排异步刷新，并在所有权和就绪状态已知前排除插件 app。

**`app_ownership_ambiguous`：** app 清单仅通过显示名称匹配，因此该 app 不会暴露给 Codex 线程。

**配置已更改但智能体看不到插件：** 使用 `/codex plugins list` 确认配置状态，然后使用 `/new` 或 `/reset`。现有 Codex 线程绑定会保留启动时的 app 配置，直到 OpenClaw 建立新的 harness 会话或替换过期绑定。

**破坏性操作被拒绝：** 检查全局和按插件的 `allow_destructive_actions` 值。即使策略为 true 或 `"auto"`，不安全 elicitation schema 和不明确的插件身份仍会失败关闭。

## 相关

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [配置参考](/zh-CN/gateway/configuration-reference#codex-harness-plugin-config)
- [迁移 CLI](/zh-CN/cli/migrate)
