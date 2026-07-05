---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Native Codex plugins
    - 你正在迁移从源码安装的 openai-curated Codex 插件
    - 你正在排查 codexPlugins、应用清单、破坏性操作或插件应用诊断
summary: 为 Codex 模式 OpenClaw 智能体配置已迁移的原生 Codex 插件
title: Native Codex plugins
x-i18n:
    generated_at: "2026-07-05T11:31:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd3e810380b99bb3fffd07eeeeb7bb41583951d4acc4ee28b30c74d27f854148
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

Native Codex plugin 支持让 Codex 模式的 OpenClaw 智能体在处理 OpenClaw 轮次的同一个 Codex 线程内，使用 Codex app-server 自身的应用和插件能力。插件调用保留在原生 Codex 转录中；Codex app-server 负责由应用支持的 MCP 执行。OpenClaw 不会把 Codex 插件转换成合成的 `codex_plugin_*` OpenClaw 动态工具。

请在基础 [Codex harness](/zh-CN/plugins/codex-harness) 正常工作后使用此页面。

## 要求

- 智能体运行时必须是原生 Codex harness。
- `plugins.entries.codex.enabled` 为 `true`。
- `plugins.entries.codex.config.codexPlugins.enabled` 为 `true`。
- 目标 Codex app-server 能看到预期的市场、插件和应用清单。
- V1 仅支持迁移观察到在源 Codex home 中以源码方式安装的 `openai-curated` 插件。

`codexPlugins` 对 OpenClaw 提供商运行、ACP 对话绑定或其他 harness 没有效果，因为这些路径从不使用原生 `apps` 配置创建 Codex app-server 线程。

OpenAI 侧的 Codex 账号、应用可用性以及工作区应用/插件控制都来自已登录的 Codex 账号。有关 OpenAI 账号和管理员模型，请参阅 [将 Codex 与你的 ChatGPT 方案配合使用](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 快速开始

从源 Codex home 预览迁移：

```bash
openclaw migrate codex --dry-run
```

添加 `--verify-plugin-apps`，让迁移调用源 `app/list`，并要求每个归属应用在规划原生活化之前都存在、已启用且可访问：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

当计划看起来正确时应用迁移：

```bash
openclaw migrate apply codex --yes
```

迁移会为符合条件的插件写入显式 `codexPlugins` 条目，并为选定插件调用 Codex app-server `plugin/install`。迁移后的配置如下所示：

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

`codexPlugins` 变更后，新的 Codex 对话会自动获取更新后的应用集合。运行 `/new` 或 `/reset` 可刷新当前对话。插件启用/禁用变更不需要重启 Gateway 网关。

## 从聊天管理插件

`/codex plugins` 可在你操作 Codex harness 的同一个聊天中检查或更改已配置的原生 Codex 插件：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的别名。列表会显示 `plugins.entries.codex.config.codexPlugins.plugins` 中每个已配置插件的键、开关状态、Codex 插件名称和市场。

`enable`/`disable` 只写入 `~/.openclaw/openclaw.json`；它们绝不会编辑 `~/.codex/config.toml` 或安装新的 Codex 插件。只有所有者或具备 `operator.admin` 权限范围的 Gateway 网关客户端可以运行它们。

启用已配置插件也会打开全局 `codexPlugins.enabled` 开关。如果插件因为迁移返回 `auth_required` 而被写为禁用，请先在 Codex 中重新授权应用，然后再在 OpenClaw 中启用它。

## 原生插件设置的工作方式

此集成跟踪三种状态：

| 状态      | 含义                                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 已安装  | Codex 在目标 app-server 运行时中拥有本地插件包。                                                              |
| 已启用    | OpenClaw 配置允许 Codex harness 轮次使用该插件。                                                                       |
| 可访问 | Codex app-server 确认插件的应用条目可供活动账号使用，并映射到已迁移的插件身份。 |

迁移是持久的安装/资格步骤：

- 规划期间，OpenClaw 读取源 Codex `plugin/read` 详情，并检查源 Codex app-server 账号是否为 ChatGPT 订阅账号。非 ChatGPT 或缺失账号响应会以 `codex_subscription_required` 跳过由应用支持的插件。
- 默认情况下，迁移会跳过源 `app/list` 调用：通过账号门禁的由应用支持的源插件会在没有源应用可访问性验证的情况下进入计划，而账号查询传输失败会以 `codex_account_unavailable` 跳过。
- 使用 `--verify-plugin-apps` 时，迁移会获取新的源 `app/list` 快照，并要求每个归属应用在规划原生活化之前都存在、已启用且可访问。此时，账号查询传输失败会落入源应用清单门禁，而不是直接跳过。

运行时应用清单是迁移后运行的目标会话可访问性检查。Codex harness 会话设置会根据已启用且可访问的插件应用计算限制性的线程应用配置；它不会在每个轮次重新计算，因此 `/codex plugins enable`/`disable` 只影响新的 Codex 对话。使用 `/new` 或 `/reset` 可让当前对话获取变更。

## V1 支持边界

- 只有已安装在源 Codex app-server 清单中的 `openai-curated` 插件符合迁移条件。
- 由应用支持的源插件必须通过迁移时订阅门禁。`--verify-plugin-apps` 会添加源应用清单门禁。受订阅限制的账号，以及在验证模式下不可访问/已禁用/缺失的源应用或应用清单刷新失败，会被报告为跳过的手动项，而不是已启用的配置条目。不可读取的插件详情会在应用清单门禁之前被跳过。
- 迁移会写入显式插件身份（`marketplaceName` 和 `pluginName`）；它不会写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是唯一的全局启用开关；不存在授予任意安装权限的 `plugins["*"]` 通配符或配置键。
- 不支持的市场、缓存的插件包、钩子和 Codex 配置文件会保留在迁移报告中供手动审查，不会自动活化。

## 应用清单和所有权

OpenClaw 通过 app-server `app/list` 读取 Codex 应用清单，在内存中缓存一小时，并异步刷新过期或缺失的条目。缓存是进程本地的；重启 CLI 或 Gateway 网关会丢弃缓存，OpenClaw 会从下一次 `app/list` 读取重建它。

迁移和运行时使用不同的缓存键：

- 源迁移验证使用源 Codex home 和启动选项。它仅在使用 `--verify-plugin-apps` 时运行，并强制为该规划运行执行一次新的源 `app/list` 遍历。
- 目标运行时设置在构建线程应用配置时使用目标智能体的 Codex app-server 身份。插件活化会使该目标缓存键失效，然后在 `plugin/install` 后强制刷新它。

只有当 OpenClaw 能通过稳定所有权将插件应用映射回已迁移插件时，才会公开该插件应用：来自插件详情的精确应用 ID、已知 MCP 服务器名称，或唯一的稳定元数据。仅显示名称或所有权不明确的应用会被排除，直到下一次清单刷新证明其所有权。

## 线程应用配置

OpenClaw 会为 Codex 线程注入限制性的 `config.apps` 补丁：禁用 `_default`，并且只启用由已启用的已迁移插件拥有的应用。

每个应用上的 `destructive_enabled` 来自有效的全局或按插件 `allow_destructive_actions` 策略；`true`、`"auto"` 和 `"ask"` 都会设置 `destructive_enabled: true`，而 `false` 会将其设置为 `false`。Codex 仍会根据其原生应用工具注解强制执行破坏性工具元数据。`_default` 会以 `open_world_enabled: false` 禁用；已启用的插件应用会获得 `open_world_enabled: true`。OpenClaw 不公开单独的插件级开放世界策略旋钮，也不维护按插件的破坏性工具名称拒绝列表。

插件应用的工具审批模式默认为自动，因此非破坏性读取工具会在没有同线程审批提示的情况下运行。破坏性工具仍受每个应用的 `destructive_enabled` 策略控制。

## 破坏性操作策略

迁移后的 Codex 插件默认允许破坏性插件引导，而不安全 schema 和不明确所有权会以关闭方式失败：

- 全局 `allow_destructive_actions` 默认为 `true`。
- 按插件 `allow_destructive_actions` 会覆盖该插件的全局策略。
- `false`：OpenClaw 返回确定性的拒绝。
- `true`：OpenClaw 只会自动接受它能映射到审批响应的安全 schema，例如布尔 approve 字段。
- `"auto"`：OpenClaw 向 Codex 暴露破坏性插件操作，然后在返回 Codex 审批响应之前，将已证明所有权的 MCP 审批引导转换为 OpenClaw 插件审批。
- `"ask"`：OpenClaw 使用与 `"auto"` 相同的 Codex 写入/破坏性门控，在线程启动前清除该应用的持久 Codex 按工具审批覆盖，并且只提供一次性批准或拒绝，使持久审批无法抑制后续写入操作提示。对于每个使用 `"ask"` 的已准入应用，OpenClaw 会为该应用选择 Codex 的人工审批审查者，以便 Codex 将其审批引导发送给 OpenClaw；其他应用和非应用线程审批会保留其已配置的审查者和策略。
- 缺失插件身份、不明确所有权、缺失或不匹配的轮次 ID，或不安全的引导 schema，都会直接拒绝而不是提示。

## 故障排查

| 代码                                              | 含义                                                                                                                              | 修复                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 迁移已安装插件，但其中一个应用仍需要认证。在你重新授权之前，该条目会以禁用状态写入。 | 在 Codex 中重新授权该应用，然后在 OpenClaw 中启用插件。                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | 使用 `--verify-plugin-apps` 时，源 Codex 应用清单未显示所有归属应用均存在、已启用且可访问。         | 在 Codex 中重新授权或启用该应用，然后使用 `--verify-plugin-apps` 重新运行迁移。                              |
| `app_inventory_unavailable`                       | 请求了严格的源应用验证，但源 Codex 应用清单刷新失败。                                      | 修复源 Codex 应用服务器访问，或不带 `--verify-plugin-apps` 重试，以接受更快的账户门控计划。   |
| `codex_subscription_required`                     | 源 Codex 应用服务器账户不是 ChatGPT 订阅账户。                                                          | 使用订阅认证登录 Codex 应用，然后重新运行迁移。                                                  |
| `codex_account_unavailable`                       | 无法读取源 Codex 应用服务器账户。                                                                               | 修复源 Codex 应用服务器认证，或使用 `--verify-plugin-apps` 重新运行，让源应用清单决定资格。 |
| `marketplace_missing`, `plugin_missing`           | 目标 Codex 应用服务器看不到预期的 `openai-curated` 市场或插件。                                          | 针对目标运行时重新运行迁移，或检查 Codex 应用服务器插件状态。                                 |
| `app_inventory_missing`, `app_inventory_stale`    | 应用就绪状态来自空缓存或陈旧缓存。                                                                                     | OpenClaw 会自动调度异步刷新；在归属关系和就绪状态明确之前，插件应用会保持排除状态。  |
| `app_ownership_ambiguous`                         | 应用清单仅按显示名称匹配。                                                                                          | 在后续刷新证明归属关系之前，该应用会对 Codex 线程保持隐藏。                                     |

**配置已更改但智能体看不到插件：**运行 `/codex plugins
list` 确认已配置状态，然后运行 `/new` 或 `/reset`。现有
Codex 线程绑定会保留启动时使用的应用配置，直到 OpenClaw
建立新的 harness 会话或替换陈旧绑定。

**破坏性操作被拒绝：**检查全局和按插件配置的
`allow_destructive_actions` 值。即使设置为 `true`、`"auto"` 或 `"ask"`，
不安全的引出 schema 和模糊的插件身份仍会按失败关闭处理。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [配置参考](/zh-CN/gateway/configuration-reference#codex-harness-plugin-config)
- [迁移 CLI](/zh-CN/cli/migrate)
