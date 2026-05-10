---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Native Codex plugins
    - 你正在迁移通过源码安装的 OpenAI 精选 Codex 插件
    - 你正在排查 codexPlugins、应用清单、破坏性操作或插件应用诊断
summary: 为 Codex 模式的 OpenClaw 智能体配置已迁移的原生 Codex 插件
title: Native Codex plugins
x-i18n:
    generated_at: "2026-05-10T19:40:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1b9116a479ffb68e3566f6113d9ec9d2a3c33df2dd27ff539f2f27110c7b9d9f
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex 插件支持让 Codex 模式的 OpenClaw 智能体在处理 OpenClaw 轮次的同一个 Codex 线程中，使用 Codex app-server 自身的应用和插件能力。

OpenClaw 不会把 Codex 插件翻译成合成的 `codex_plugin_*` OpenClaw 动态工具。插件调用保留在原生 Codex transcript 中，并由 Codex app-server 拥有基于应用的 MCP 执行。

在基础 [Codex harness](/zh-CN/plugins/codex-harness) 正常工作后使用本页。

## 要求

- 所选 OpenClaw 智能体运行时必须是原生 Codex harness。
- `plugins.entries.codex.enabled` 必须为 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必须为 true。
- V1 仅支持迁移观察到已在源 Codex home 中以源码形式安装的 `openai-curated` 插件。
- 目标 Codex app-server 必须能够看到预期的 marketplace、插件和应用清单。

`codexPlugins` 对 PI 运行、常规 OpenAI provider 运行、ACP 对话绑定或其他运行框架没有影响，因为这些路径不会使用原生 `apps` 配置创建 Codex app-server 线程。

## 快速开始

从源 Codex home 预览迁移：

```bash
openclaw migrate codex --dry-run
```

当计划看起来正确时应用迁移：

```bash
openclaw migrate apply codex --yes
```

迁移会为符合条件的插件写入显式 `codexPlugins` 条目，并为所选插件调用 Codex app-server `plugin/install`。典型的迁移后配置如下所示：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
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

更改 `codexPlugins` 后，使用 `/new`、`/reset`，或重启 Gateway 网关，以便未来的 Codex harness 会话使用更新后的应用集合启动。

## 原生插件设置的工作方式

集成有三种独立状态：

- 已安装：Codex 在目标 app-server 运行时中拥有本地插件包。
- 已启用：OpenClaw 配置愿意让该插件可用于 Codex harness 轮次。
- 可访问：Codex app-server 确认该插件的应用条目可供当前账号使用，并且可以映射到迁移后的插件身份。

迁移是持久的安装/资格步骤。运行时应用清单是可访问性检查。随后，Codex harness 会话设置会为已启用且可访问的插件应用计算一个限制性的线程应用配置。

线程应用配置会在 OpenClaw 建立 Codex harness 会话或替换过期的 Codex 线程绑定时计算。它不会在每个轮次重新计算。

## V1 支持边界

V1 有意保持范围狭窄：

- 只有已经安装在源 Codex app-server 清单中的 `openai-curated` 插件才符合迁移资格。
- 迁移会使用 `marketplaceName` 和 `pluginName` 写入显式插件身份；它不会写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是全局启用开关。
- 没有 `plugins["*"]` 通配符，也没有授予任意安装权限的配置键。
- 不支持的 marketplace、缓存插件包、钩子和 Codex 配置文件会保留在迁移报告中，以便人工审查。

## 应用清单和所有权

OpenClaw 通过 app-server `app/list` 读取 Codex 应用清单，将其缓存一小时，并异步刷新过期或缺失的条目。

只有在 OpenClaw 能通过稳定所有权将插件应用映射回迁移后的插件时，该插件应用才会暴露：

- 来自插件详情的精确应用 id
- 已知 MCP 服务器名称
- 唯一稳定元数据

仅显示名称匹配或所有权不明确的项会被排除，直到下一次清单刷新证明所有权。

## 线程应用配置

OpenClaw 会为 Codex 线程注入限制性的 `config.apps` 补丁：禁用 `_default`，并且只启用由已启用的迁移插件拥有的应用。

OpenClaw 根据有效的全局或单插件 `allow_destructive_actions` 策略设置应用级 `destructive_enabled`，并让 Codex 根据其原生应用工具注解来强制执行破坏性工具元数据。`_default` 应用配置会以 `open_world_enabled: false` 禁用。已启用的插件应用会以 `open_world_enabled: true` 输出；OpenClaw 不暴露单独的插件开放世界策略旋钮，也不维护按插件划分的破坏性工具名称拒绝列表。

插件应用的工具批准模式默认会提示，因为 OpenClaw 在这条同线程路径中没有交互式应用请求 UI。

## 破坏性操作策略

破坏性插件请求默认失败关闭：

- 全局 `allow_destructive_actions` 默认为 `false`。
- 单插件 `allow_destructive_actions` 会覆盖该插件的全局策略。
- 当策略为 `false` 时，OpenClaw 返回确定性的拒绝。
- 当策略为 `true` 时，OpenClaw 只自动接受它能映射到批准响应的安全 schema，例如布尔 approve 字段。
- 缺失插件身份、所有权不明确、缺失轮次 id、错误轮次 id，或不安全的请求 schema，都会拒绝而不是提示。

## 故障排除

**`auth_required`：** 迁移已安装插件，但其某个应用仍需要认证。显式插件条目会以禁用状态写入，直到你重新授权并启用它。

**`marketplace_missing` 或 `plugin_missing`：** 目标 Codex app-server 无法看到预期的 `openai-curated` marketplace 或插件。针对目标运行时重新运行迁移，或检查 Codex app-server 插件状态。

**`app_inventory_missing` 或 `app_inventory_stale`：** 应用就绪状态来自空缓存或过期缓存。OpenClaw 会安排异步刷新，并在所有权和就绪状态已知之前排除插件应用。

**`app_ownership_ambiguous`：** 应用清单仅按显示名称匹配，因此该应用不会暴露给 Codex 线程。

**配置已更改但智能体看不到插件：** 使用 `/new`、`/reset`，或重启 Gateway 网关。现有 Codex 线程绑定会保留其启动时使用的应用配置，直到 OpenClaw 建立新的 harness 会话或替换过期绑定。

**破坏性操作被拒绝：** 检查全局和单插件 `allow_destructive_actions` 值。即使策略为 true，不安全的请求 schema 和不明确的插件身份仍会失败关闭。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [配置参考](/zh-CN/gateway/configuration-reference#codex-harness-plugin-config)
- [迁移 CLI](/zh-CN/cli/migrate)
