---
read_when:
    - 你希望 Codex 模式下的 OpenClaw 智能体使用 Native Codex plugins
    - 你正在迁移从源码安装的 OpenAI 精选 Codex 插件
    - 你正在对 codexPlugins、应用清单、破坏性操作或插件应用诊断进行故障排查
summary: 为 Codex 模式的 OpenClaw 智能体配置已迁移的原生 Codex 插件
title: Native Codex plugins
x-i18n:
    generated_at: "2026-05-12T23:30:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddec40cd5f9a74b43d55f327cdcd7088e024392fbafc7f1aa5bd9b136d3ecc13
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex 插件支持让 Codex 模式的 OpenClaw 智能体，在处理 OpenClaw 轮次的同一个 Codex 线程中，使用 Codex app-server 自身的应用和插件能力。

OpenClaw 不会把 Codex 插件转换成合成的 `codex_plugin_*` OpenClaw 动态工具。插件调用保留在原生 Codex 记录中，并由 Codex app-server 负责执行由应用支持的 MCP。

请在基础 [Codex harness](/zh-CN/plugins/codex-harness) 可用后再使用本页。

## 要求

- 所选 OpenClaw agent 运行时必须是原生 Codex harness。
- `plugins.entries.codex.enabled` 必须为 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必须为 true。
- V1 仅支持迁移在源 Codex home 中观察到以源码方式安装的 `openai-curated` 插件。
- 目标 Codex app-server 必须能够看到预期的 marketplace、插件和应用清单。

`codexPlugins` 对 PI 运行、普通 OpenAI provider 运行、ACP 会话绑定或其他 harness 没有效果，因为这些路径不会创建带有原生 `apps` 配置的 Codex app-server 线程。

## 快速开始

从源 Codex home 预览迁移：

```bash
openclaw migrate codex --dry-run
```

当你希望迁移在规划原生插件激活前检查源应用可访问性时，请使用严格的源应用验证：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

当计划看起来正确时应用迁移：

```bash
openclaw migrate apply codex --yes
```

迁移会为符合条件的插件写入显式 `codexPlugins` 条目，并对所选插件调用 Codex app-server `plugin/install`。典型的迁移后配置如下：

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

更改 `codexPlugins` 后，请使用 `/new`、`/reset`，或重启 Gateway 网关，以便未来的 Codex harness 会话使用更新后的应用集合启动。

## 原生插件设置的工作方式

该集成有三种独立状态：

- 已安装：Codex 在目标 app-server 运行时中有本地插件包。
- 已启用：OpenClaw 配置允许该插件可供 Codex harness 轮次使用。
- 可访问：Codex app-server 确认该插件的应用条目可用于当前账户，并且可以映射到已迁移的插件身份。

迁移是持久的安装和资格判断步骤。规划期间，OpenClaw 读取源 Codex `plugin/read` 详情，并检查源 Codex app-server 账户响应是否为 ChatGPT 订阅账户。非 ChatGPT 或缺失账户响应会跳过由应用支持的插件，并给出 `codex_subscription_required`。默认情况下，迁移不会调用源 `app/list`；通过账户门槛的由应用支持的源插件会被纳入计划，但不会进行源应用可访问性验证，账户查询传输失败则会以 `codex_account_unavailable` 跳过。使用 `--verify-plugin-apps` 时，迁移会获取新的源 `app/list` 快照，并要求每个拥有的应用都存在、已启用且可访问，然后才规划原生激活。在该模式下，账户查询传输失败会落到源应用清单门槛。运行时应用清单是迁移后的目标会话可访问性检查。随后，Codex harness 会话设置会为已启用且可访问的插件应用计算一个限制性的线程应用配置。

线程应用配置会在 OpenClaw 建立 Codex harness 会话或替换过期的 Codex 线程绑定时计算。它不会在每个轮次重新计算。

## V1 支持边界

V1 有意保持范围狭窄：

- 只有已经安装在源 Codex app-server 清单中的 `openai-curated` 插件才符合迁移条件。
- 由应用支持的源插件必须通过迁移时订阅门槛。`--verify-plugin-apps` 会增加源应用清单门槛。订阅受限账户，以及在验证模式下不可访问、已禁用、缺失的源应用或源应用清单刷新失败，都会报告为已跳过的手动项，而不是启用的配置条目。无法读取的插件详情会在源应用清单门槛之前被跳过。
- 迁移会写入带有 `marketplaceName` 和 `pluginName` 的显式插件身份；它不会写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是全局启用开关。
- 没有 `plugins["*"]` 通配符，也没有授予任意安装权限的配置键。
- 不支持的 marketplaces、缓存插件包、钩子和 Codex 配置文件会保留在迁移报告中供手动审查。

## 应用清单和所有权

OpenClaw 通过 app-server `app/list` 读取 Codex 应用清单，将其缓存一小时，并异步刷新过期或缺失的条目。缓存仅在内存中；重启 CLI 或 Gateway 网关会丢弃缓存，OpenClaw 会在下一次读取 `app/list` 时重建它。

迁移和运行时使用不同的缓存键：

- 源迁移验证使用源 Codex home 和源 app-server 启动选项。它只在设置 `--verify-plugin-apps` 时运行，并且会强制为该次规划运行遍历新的源 `app/list`。
- 目标运行时设置在构建 Codex 线程应用配置时使用目标 agent 的 Codex app-server 身份。插件激活会使该目标缓存键失效，并在 `plugin/install` 后强制刷新它。

只有当 OpenClaw 能通过稳定所有权将插件应用映射回已迁移插件时，该应用才会暴露：

- 来自插件详情的精确应用 id
- 已知 MCP 服务器名称
- 唯一稳定元数据

仅显示名称匹配或所有权不明确的应用会被排除，直到下一次清单刷新证明所有权。

## 线程应用配置

OpenClaw 会为 Codex 线程注入一个限制性的 `config.apps` 补丁：禁用 `_default`，并且只启用由已启用的迁移插件拥有的应用。

OpenClaw 会根据有效的全局或按插件 `allow_destructive_actions` 策略设置应用级 `destructive_enabled`，并让 Codex 根据其原生应用工具注解强制执行破坏性工具元数据。`_default` 应用配置会以 `open_world_enabled: false` 禁用。已启用的插件应用会以 `open_world_enabled: true` 输出；OpenClaw 不会暴露单独的插件开放世界策略开关，也不会维护按插件的破坏性工具名称拒绝列表。

插件应用的工具审批模式默认是自动的，因此非破坏性读取工具可以在没有同线程审批 UI 的情况下运行。破坏性工具仍由每个应用的 `destructive_enabled` 策略控制。

## 破坏性操作策略

已迁移 Codex 插件默认允许破坏性插件 elicitations，而不安全 schema 和模糊所有权仍会关闭失败：

- 全局 `allow_destructive_actions` 默认为 `true`。
- 按插件 `allow_destructive_actions` 会覆盖该插件的全局策略。
- 当策略为 `false` 时，OpenClaw 会返回确定性的拒绝。
- 当策略为 `true` 时，OpenClaw 只会自动接受可映射到审批响应的安全 schema，例如布尔 approve 字段。
- 缺失插件身份、所有权不明确、缺失 turn id、错误 turn id 或不安全的 elicitation schema 都会拒绝，而不是提示。

## 故障排除

**`auth_required`：** 迁移已安装该插件，但其某个应用仍需要身份验证。显式插件条目会以禁用状态写入，直到你重新授权并启用它。

**`app_inaccessible`、`app_disabled` 或 `app_missing`：**
迁移没有安装该插件，因为在设置 `--verify-plugin-apps` 时，源 Codex 应用清单没有显示所有拥有的应用都存在、已启用且可访问。请在 Codex 中重新授权或启用该应用，然后使用 `--verify-plugin-apps` 重新运行迁移。

**`app_inventory_unavailable`：** 迁移没有安装该插件，因为请求了严格源应用验证，而源 Codex 应用清单刷新失败。请修复源 Codex app-server 访问，或在你接受更快的账户门槛计划时不带 `--verify-plugin-apps` 重试。

**`codex_subscription_required`：** 迁移没有安装由应用支持的插件，因为源 Codex app-server 账户没有以 ChatGPT 订阅账户登录。请用订阅身份验证登录 Codex 应用，然后重新运行迁移。

**`codex_account_unavailable`：** 迁移没有安装由应用支持的插件，因为无法读取源 Codex app-server 账户。请修复源 Codex app-server 身份验证，或在你希望账户查询失败时由源应用清单决定资格的情况下，带 `--verify-plugin-apps` 重新运行。

**`marketplace_missing` 或 `plugin_missing`：** 目标 Codex app-server 无法看到预期的 `openai-curated` marketplace 或插件。请针对目标运行时重新运行迁移，或检查 Codex app-server 插件状态。

**`app_inventory_missing` 或 `app_inventory_stale`：** 应用就绪状态来自空缓存或过期缓存。OpenClaw 会安排异步刷新，并在所有权和就绪状态已知前排除插件应用。

**`app_ownership_ambiguous`：** 应用清单仅按显示名称匹配，因此该应用不会暴露给 Codex 线程。

**配置已更改但 agent 看不到插件：** 使用 `/new`、`/reset`，或重启 Gateway 网关。现有 Codex 线程绑定会保留其启动时的应用配置，直到 OpenClaw 建立新的 harness 会话或替换过期绑定。

**破坏性操作被拒绝：** 检查全局和按插件 `allow_destructive_actions` 值。即使策略为 true，不安全的 elicitation schema 和不明确的插件身份仍会关闭失败。

## 相关

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [配置参考](/zh-CN/gateway/configuration-reference#codex-harness-plugin-config)
- [迁移 CLI](/zh-CN/cli/migrate)
