---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用原生 Codex 插件
    - 你正在迁移从源码安装的 OpenAI 精选 Codex 插件
    - 你正在排查 codexPlugins、应用清单、破坏性操作或插件应用诊断
summary: 为 Codex 模式的 OpenClaw 智能体配置已迁移的 Native Codex plugins
title: Native Codex plugins
x-i18n:
    generated_at: "2026-05-11T20:31:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64e8f552e65b3f1c1c62bc1ba1abfc1bf592d1bdc7fbbe2a484f3eb9955159f0
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex plugin 支持让 Codex 模式的 OpenClaw 智能体可以在处理 OpenClaw 轮次的同一个 Codex 线程中，使用 Codex app-server 自身的应用和 plugin 能力。

OpenClaw 不会将 Codex plugins 转换为合成的 `codex_plugin_*` OpenClaw 动态工具。Plugin 调用保留在原生 Codex transcript 中，Codex app-server 负责应用支持的 MCP 执行。

在基础 [Codex harness](/zh-CN/plugins/codex-harness) 可用后使用本页。

## 要求

- 选定的 OpenClaw 智能体运行时必须是原生 Codex harness。
- `plugins.entries.codex.enabled` 必须为 true。
- `plugins.entries.codex.config.codexPlugins.enabled` 必须为 true。
- V1 仅支持迁移在源 Codex 主目录中观察到以源方式安装的 `openai-curated` plugins。
- 目标 Codex app-server 必须能够看到预期的 marketplace、plugin 和应用清单。

`codexPlugins` 对 PI 运行、普通 OpenAI provider 运行、ACP 会话绑定或其他 harnesses 没有影响，因为这些路径不会创建带有原生 `apps` 配置的 Codex app-server 线程。

## 快速开始

从源 Codex 主目录预览迁移：

```bash
openclaw migrate codex --dry-run
```

当计划看起来正确时应用迁移：

```bash
openclaw migrate apply codex --yes
```

迁移会为符合条件的 plugins 写入显式 `codexPlugins` 条目，并为选定 plugins 调用 Codex app-server `plugin/install`。典型迁移后的配置如下：

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

更改 `codexPlugins` 后，使用 `/new`、`/reset`，或重启 Gateway 网关，以便未来的 Codex harness 会话使用更新后的应用集启动。

## 原生 plugin 设置的工作方式

该集成有三种独立状态：

- 已安装：Codex 在目标 app-server 运行时中拥有本地 plugin 包。
- 已启用：OpenClaw 配置愿意让该 plugin 可用于 Codex harness 轮次。
- 可访问：Codex app-server 确认该 plugin 的应用条目可供活动账户使用，并且可以映射到迁移后的 plugin 身份。

迁移是持久的安装/资格步骤。运行时应用清单是可访问性检查。随后 Codex harness 会话设置会为已启用且可访问的 plugin 应用计算受限的线程应用配置。

当 OpenClaw 建立 Codex harness 会话或替换过期的 Codex 线程绑定时，会计算线程应用配置。它不会在每一轮重新计算。

## V1 支持边界

V1 有意保持范围狭窄：

- 只有已经安装在源 Codex app-server 清单中的 `openai-curated` plugins 才符合迁移条件。
- 迁移会写入带有 `marketplaceName` 和 `pluginName` 的显式 plugin 身份；它不会写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是全局启用开关。
- 没有 `plugins["*"]` 通配符，也没有授予任意安装权限的配置键。
- 不支持的 marketplaces、缓存的 plugin 包、hooks 和 Codex 配置文件会保留在迁移报告中，供手动审查。

## 应用清单和所有权

OpenClaw 通过 app-server `app/list` 读取 Codex 应用清单，将其缓存一小时，并异步刷新过期或缺失的条目。

只有当 OpenClaw 能够通过稳定所有权将 plugin 应用映射回迁移后的 plugin 时，才会公开该 plugin 应用：

- 来自 plugin 详情的精确应用 id
- 已知 MCP 服务器名称
- 唯一稳定元数据

仅显示名称匹配或所有权有歧义的应用会被排除，直到下一次清单刷新证明所有权。

## 线程应用配置

OpenClaw 会为 Codex 线程注入受限的 `config.apps` 补丁：禁用 `_default`，并且只启用由已启用迁移 plugins 拥有的应用。

OpenClaw 会根据有效的全局或每个 plugin 的 `allow_destructive_actions` 策略设置应用级 `destructive_enabled`，并让 Codex 根据其原生应用工具注解强制执行破坏性工具元数据。`_default` 应用配置会以 `open_world_enabled: false` 禁用。已启用的 plugin 应用会以 `open_world_enabled: true` 输出；OpenClaw 不公开单独的 plugin 开放世界策略开关，也不维护每个 plugin 的破坏性工具名称拒绝列表。

默认情况下，plugin 应用的工具审批模式是自动的，因此非破坏性读取工具可以在没有同线程审批 UI 的情况下运行。破坏性工具仍由每个应用的 `destructive_enabled` 策略控制。

## 破坏性操作策略

破坏性 plugin elicitation 默认关闭失败：

- 全局 `allow_destructive_actions` 默认为 `false`。
- 每个 plugin 的 `allow_destructive_actions` 会覆盖该 plugin 的全局策略。
- 当策略为 `false` 时，OpenClaw 会返回确定性的拒绝。
- 当策略为 `true` 时，OpenClaw 仅自动接受它可以映射到审批响应的安全 schema，例如布尔 approve 字段。
- 缺失 plugin 身份、所有权有歧义、缺失轮次 id、错误的轮次 id，或不安全的 elicitation schema，都会拒绝而不是提示。

## 故障排除

**`auth_required`：** 迁移安装了 plugin，但它的某个应用仍需要身份验证。显式 plugin 条目会以禁用状态写入，直到你重新授权并启用它。

**`marketplace_missing` 或 `plugin_missing`：** 目标 Codex app-server 看不到预期的 `openai-curated` marketplace 或 plugin。请针对目标运行时重新运行迁移，或检查 Codex app-server plugin 状态。

**`app_inventory_missing` 或 `app_inventory_stale`：** 应用就绪状态来自空缓存或过期缓存。OpenClaw 会安排异步刷新，并在所有权和就绪状态已知之前排除 plugin 应用。

**`app_ownership_ambiguous`：** 应用清单只按显示名称匹配，因此该应用不会暴露给 Codex 线程。

**配置已更改但智能体看不到 plugin：** 使用 `/new`、`/reset`，或重启 Gateway 网关。现有 Codex 线程绑定会保留其启动时的应用配置，直到 OpenClaw 建立新的 harness 会话或替换过期绑定。

**破坏性操作被拒绝：** 检查全局和每个 plugin 的 `allow_destructive_actions` 值。即使策略为 true，不安全的 elicitation schema 和有歧义的 plugin 身份仍会关闭失败。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [配置参考](/zh-CN/gateway/configuration-reference#codex-harness-plugin-config)
- [迁移 CLI](/zh-CN/cli/migrate)
