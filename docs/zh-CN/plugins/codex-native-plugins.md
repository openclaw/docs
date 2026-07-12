---
read_when:
    - 你希望 Codex 模式的 OpenClaw 智能体使用 Native Codex plugins
    - 你正在迁移通过源码安装的 OpenAI 精选 Codex 插件
    - 你正在配置现有的工作区目录 Codex 插件
    - 你正在排查 `codexPlugins`、应用清单、破坏性操作或插件应用诊断问题
summary: 为 Codex 模式的 OpenClaw 智能体配置 Native Codex plugins
title: Native Codex plugins
x-i18n:
    generated_at: "2026-07-11T20:43:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b1cfa39838d4dbd1f33a1e5b7f52faec4b033f9fa98ef5c029003177c2e27e5
    source_path: plugins/codex-native-plugins.md
    workflow: 16
---

原生 Codex 插件支持让 Codex 模式的 OpenClaw 智能体能够在处理 OpenClaw 轮次的同一 Codex 线程中，使用 Codex app-server 自身的应用和插件能力。插件调用保留在原生 Codex 对话记录中；Codex app-server 负责执行由应用支持的 MCP。OpenClaw 不会将 Codex 插件转换为合成的 `codex_plugin_*` OpenClaw 动态工具。

请在基础 [Codex harness](/zh-CN/plugins/codex-harness) 正常工作后使用本页面。

## 要求

- 智能体运行时必须是原生 Codex harness。
- `plugins.entries.codex.enabled` 必须为 `true`。
- `plugins.entries.codex.config.codexPlugins.enabled` 必须为 `true`。
- 目标 Codex app-server 必须能够看到预期的市场、插件和应用清单。
- 迁移仅支持在源 Codex 主目录中检测到以源码方式安装的 `openai-curated` 插件。
- 手动配置的 `workspace-directory` 插件要求 Codex app-server 的 `plugin/list` 接受 `marketplaceKinds`，且其无路径工作区摘要包含 `remotePluginId`。插件必须已经安装并启用，且它拥有的应用必须可通过 `app/list` 访问。

`codexPlugins` 不会影响 OpenClaw 提供商运行、ACP 对话绑定或其他 harness，因为这些路径不会创建带有原生 `apps` 配置的 Codex app-server 线程。

OpenAI 侧的 Codex 账户、应用可用性以及工作区应用/插件控制均来自已登录的 Codex 账户。有关 OpenAI 账户和管理员模型，请参阅[通过你的 ChatGPT 套餐使用 Codex](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)。

## 快速开始

从源 Codex 主目录预览迁移：

```bash
openclaw migrate codex --dry-run
```

添加 `--verify-plugin-apps` 可让迁移调用源 `app/list`，并要求每个所属应用都存在、已启用且可访问，然后才规划原生激活：

```bash
openclaw migrate codex --dry-run --verify-plugin-apps
```

确认计划正确后应用迁移：

```bash
openclaw migrate apply codex --yes
```

迁移会为符合条件的插件写入显式 `codexPlugins` 条目，并为所选插件调用 Codex app-server 的 `plugin/install`。迁移后的配置如下：

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

迁移仍仅限于 `openai-curated`。要使用现有的 `workspace-directory` 插件，请使用 `plugin/list` 返回的、带有准确市场限定的 `summary.id` 手动添加。例如，如果 Codex 返回 `example-plugin@workspace-directory`，请配置该完整值，而不是其显示名称：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            plugins: {
              "example-plugin": {
                enabled: true,
                marketplaceName: "workspace-directory",
                pluginName: "example-plugin@workspace-directory",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw 不会为 `workspace-directory` 插件调用 `plugin/install` 或启动身份验证。请先在 Codex 中安装、启用插件并完成身份验证，然后再添加或启用 OpenClaw 策略。如果响应缺少准确的市场、插件 ID、详细信息 ID 或应用就绪证据，OpenClaw 会继续隐藏相关应用。如果 Codex 拒绝显式的工作区 `plugin/list` 请求，OpenClaw 会为每个已启用的工作区插件报告 `marketplace_missing`，并保持任何独立发现的精选插件可用。

更改 `codexPlugins` 后，新 Codex 对话会自动使用更新后的应用集。运行 `/new` 或 `/reset` 可刷新当前对话。启用或禁用插件不需要重启 Gateway 网关。

## 从聊天中管理插件

`/codex plugins` 可在你操作 Codex harness 的同一聊天中检查或更改已配置的原生 Codex 插件：

```text
/codex plugins
/codex plugins list
/codex plugins disable google-calendar
/codex plugins enable google-calendar
```

`/codex plugins` 是 `/codex plugins list` 的别名。该列表会显示 `plugins.entries.codex.config.codexPlugins.plugins` 中每个已配置插件的键名、启用/禁用状态、Codex 插件名称和市场。

`enable`/`disable` 只会写入 `~/.openclaw/openclaw.json`；它们绝不会编辑 `~/.codex/config.toml` 或安装新的 Codex 插件。只有所有者或拥有 `operator.admin` 权限范围的 Gateway 网关客户端才能运行这些命令。

启用已配置的插件也会打开全局 `codexPlugins.enabled` 开关。如果精选插件因迁移返回 `auth_required` 而被写为禁用状态，请先在 Codex 中重新授权该应用，然后再在 OpenClaw 中启用它。对于 `workspace-directory` 条目，在此处启用只会更改 OpenClaw 策略；插件和应用必须已经在 Codex 中处于活动状态。

## 原生插件设置的工作原理

此集成跟踪三种状态：

| 状态     | 含义                                                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| 已安装   | Codex 在目标 app-server 运行时中拥有该插件包。                                                                   |
| 已启用   | Codex 报告该插件已启用，并且 OpenClaw 配置允许在 Codex harness 轮次中使用该插件。                                 |
| 可访问   | Codex app-server 确认该插件的应用条目可供当前账户使用，并映射到已配置的插件身份。                                 |

对于 `openai-curated` 插件，迁移是持久的安装/资格判定步骤：

- 在规划期间，OpenClaw 会读取源 Codex 的 `plugin/read` 详细信息，并检查源 Codex app-server 账户是否为 ChatGPT 订阅账户。如果响应表明账户并非 ChatGPT 账户或缺少账户信息，则会以 `codex_subscription_required` 跳过由应用支持的插件。
- 默认情况下，迁移会跳过源 `app/list` 调用：通过账户门槛的、由应用支持的源插件将在不验证源应用可访问性的情况下纳入计划，而账户查询的传输失败会以 `codex_account_unavailable` 跳过。
- 使用 `--verify-plugin-apps` 时，迁移会获取全新的源 `app/list` 快照，并要求每个所属应用都存在、已启用且可访问，然后才规划原生激活。此时，账户查询的传输失败会继续进入源应用清单门槛，而不是直接跳过。

对于 `workspace-directory` 插件，设置在 OpenClaw 外部完成。仅当配置了至少一个已启用的工作区条目时，OpenClaw 才会查询该市场；它会通过准确的 `summary.id` 解析每个插件，并复用现有的 `plugin/read` 所有权检查和 `app/list` 就绪检查。未安装、已禁用、不可访问或未完成身份验证的插件不会公开任何应用；OpenClaw 不会尝试安装或进行身份验证。

对于已迁移的精选插件和手动配置的工作区插件，运行时应用清单都是目标会话的可访问性检查。Codex harness 会话设置会根据已启用且可访问的插件应用计算限制性的线程应用配置；该配置不会在每个轮次中重新计算，因此 `/codex plugins enable`/`disable` 仅影响新的 Codex 对话。使用 `/new` 或 `/reset` 可在当前对话中应用更改。

## V1 支持边界

- 只有已安装在源 Codex app-server 清单中的 `openai-curated` 插件才符合迁移条件。
- 运行时还支持在 app-server 构建版本上显式配置 `workspace-directory` 条目，前提是其 `plugin/list` 实现了 `marketplaceKinds`，并为无路径工作区摘要返回 `remotePluginId`。这些条目必须使用带有准确市场限定的 `summary.id`，且必须已安装、已启用并可访问应用。被拒绝的工作区列表请求会产生现有的每插件 `marketplace_missing` 诊断；如果缺少市场、插件、详细信息或应用证据，则不会公开任何工作区应用。默认列表请求中的精选清单仍然可用。
- 由应用支持的源插件必须通过迁移时的订阅门槛。`--verify-plugin-apps` 会额外添加源应用清单门槛。受订阅门槛限制的账户，以及在验证模式下不可访问、已禁用或缺失的源应用，或应用清单刷新失败，都会被报告为已跳过的手动处理项，而不是已启用的配置条目。无法读取插件详细信息的插件会在应用清单门槛之前被跳过。
- 迁移会写入显式插件身份（`marketplaceName` 和 `pluginName`）；不会写入本地 `marketplacePath` 缓存路径。
- `codexPlugins.enabled` 是唯一的全局启用开关；不存在授予任意安装权限的 `plugins["*"]` 通配符或配置键。
- 非精选市场、缓存的插件包、钩子和 Codex 配置文件会保留在迁移报告中供手动审查，而不会自动激活。运行时接受手动配置的 `workspace-directory` 条目；其他市场仍不受支持。

## 应用清单和所有权

OpenClaw 通过 app-server 的 `app/list` 读取 Codex 应用清单，将其在内存中缓存一小时，并异步刷新过期或缺失的条目。该缓存仅在当前进程内有效；重启 CLI 或 Gateway 网关会清除缓存，OpenClaw 会在下次读取 `app/list` 时重新构建缓存。

迁移和运行时使用不同的缓存键：

- 源迁移验证使用源 Codex 主目录和启动选项。它仅在使用 `--verify-plugin-apps` 时运行，并会为该次规划强制执行全新的源 `app/list` 遍历。
- 目标运行时设置在构建线程应用配置时使用目标智能体的 Codex app-server 身份。精选插件激活会使该目标缓存键失效，然后在 `plugin/install` 后强制刷新。`workspace-directory` 设置绝不会运行此激活路径。

仅当 OpenClaw 能通过稳定所有权将插件应用映射回已配置插件时，才会公开该应用：插件详细信息中的准确应用 ID、已知 MCP 服务器名称或唯一的稳定元数据。仅有显示名称或所有权不明确的应用会被排除，直到下一次清单刷新能够证明其所有权。

## 已连接账户的应用

由所有者操作的智能体可以选择启用其 Codex 账户中已连接的所有应用，而无需匹配的插件包：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_all_plugins: true,
            allow_destructive_actions: "auto",
          },
        },
      },
    },
  },
}
```

`allow_all_plugins: true` 会在建立新的原生 Codex 线程时获取完整的 `app/list` 快照，并且只允许标记为可供该账户访问的应用。它不会在全局范围内安装、验证身份或启用应用。现有线程会保留其持久化的应用集；使用 `/new`、`/reset` 或重启 Gateway 网关可应用新连接或已撤销的应用变更。

账户应用会继承全局 `codexPlugins.allow_destructive_actions` 值，该值接受 `true`、`false`、`"auto"` 或 `"ask"`。对于应用 ID 重叠的情况，显式的每插件策略会覆盖全局策略。清单读取失败时会采取封闭式失败，而不会回退到不受限制的默认值。

## 线程应用配置

OpenClaw 会为 Codex 线程注入一个限制严格的 `config.apps` 补丁：
禁用 `_default`，仅启用由已启用且已配置的插件所拥有的应用，或由 `allow_all_plugins` 准入的可访问账户应用。

每个应用的 `destructive_enabled` 来自有效的全局或按插件设置的 `allow_destructive_actions` 策略；`true`、`"auto"` 和 `"ask"` 都会设置 `destructive_enabled: true`，而 `false` 会将其设为 `false`。Codex 仍会根据其原生应用工具注解强制执行破坏性工具元数据。
禁用 `_default` 时会设置 `open_world_enabled: false`；已启用的插件应用会设置 `open_world_enabled: true`。OpenClaw 不提供单独的插件级开放世界策略开关，也不维护按插件设置的破坏性工具名称拒绝列表。

对于已准入的应用，工具审批模式默认为自动，因此非破坏性读取工具无需同一线程中的审批提示即可运行。破坏性工具仍受每个应用的 `destructive_enabled` 策略控制。

## 破坏性操作策略

对于已配置的 Codex 插件，默认允许破坏性插件请求，而不安全的架构和归属不明确的情况会以拒绝方式关闭：

- 全局 `allow_destructive_actions` 默认为 `true`。
- 按插件设置的 `allow_destructive_actions` 会覆盖该插件的全局策略。
- `false`：OpenClaw 返回确定性的拒绝结果。
- `true`：OpenClaw 仅自动接受可映射到审批响应的安全架构，例如布尔型批准字段。
- `"auto"`：OpenClaw 向 Codex 公开破坏性插件操作，然后将已确认归属的 MCP 审批请求转换为 OpenClaw 插件审批，再返回 Codex 审批响应。
- `"ask"`：OpenClaw 使用与 `"auto"` 相同的 Codex 写入/破坏性操作门控，在启动线程前清除该应用持久保存的 Codex 按工具审批覆盖，并且仅提供单次批准或拒绝选项，以防持久审批抑制后续写入操作提示。对于每个使用 `"ask"` 的已准入应用，OpenClaw 会为该应用选择 Codex 的人工审批审查器，使 Codex 将其审批请求发送给 OpenClaw；其他应用和非应用线程审批仍使用其配置的审查器和策略。
- 缺少插件身份、归属不明确、缺少或不匹配的轮次 ID，或者不安全的请求架构，都会直接拒绝而不发出提示。

## 故障排查

| 代码                                              | 含义                                                                                                                              | 修复方法                                                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `auth_required`                                   | 迁移已安装插件，但其某个应用仍需身份验证。在你重新授权前，该条目会以禁用状态写入。 | 在 Codex 中重新授权该应用，然后在 OpenClaw 中启用该插件。                                                      |
| `app_inaccessible`, `app_disabled`, `app_missing` | 使用 `--verify-plugin-apps` 时，源 Codex 应用清单未显示所有所属应用均存在、已启用且可访问。         | 在 Codex 中重新授权或启用该应用，然后使用 `--verify-plugin-apps` 重新运行迁移。                              |
| `app_inventory_unavailable`                       | 已请求严格验证源应用，但刷新源 Codex 应用清单失败。                                      | 修复源 Codex 应用服务器的访问问题，或不使用 `--verify-plugin-apps` 重试，以接受速度更快的账户门控方案。   |
| `codex_subscription_required`                     | 源 Codex 应用服务器账户不是 ChatGPT 订阅账户。                                                          | 使用订阅身份验证登录 Codex 应用，然后重新运行迁移。                                                  |
| `codex_account_unavailable`                       | 无法读取源 Codex 应用服务器账户。                                                                               | 修复源 Codex 应用服务器的身份验证，或使用 `--verify-plugin-apps` 重新运行，让源应用清单决定是否符合条件。 |
| `marketplace_missing`, `plugin_missing`           | 市场或指定插件不可用；显式工作区目录请求可能已被拒绝；工作区应用会以拒绝方式关闭。  | 验证下文所述的兼容应用服务器契约和准确 ID。                                                |
| `plugin_detail_unavailable`                       | OpenClaw 无法读取插件归属详情。                                                                                    | 检查目标应用服务器的 `plugin/list` 和 `plugin/read` 响应。                                             |
| `plugin_disabled`                                 | Codex 报告插件已安装但已禁用。                                                                                     | 精选插件激活流程可能会修复此问题；重试前请在 Codex 中启用工作区插件。                                  |
| `plugin_activation_failed`                        | 插件激活未完成。                                                                                                  | 使用附带的诊断信息区分市场、身份验证、刷新或工作区就绪状态故障。                |
| `app_inventory_missing`, `app_inventory_stale`    | 应用就绪状态来自空缓存或过期缓存。                                                                                     | OpenClaw 会自动安排异步刷新；在归属和就绪状态明确之前，插件应用将保持排除状态。  |
| `app_ownership_ambiguous`                         | 应用清单仅通过显示名称匹配。                                                                                          | 在后续刷新确认归属之前，该应用会对 Codex 线程保持隐藏。                                     |

**工作区插件已安装但不可见：**确认工作区的 `plugin/list` 结果将准确配置的 ID 报告为已安装且已启用，然后确认 `app/list` 报告同一 Codex 账户可访问其拥有的每个应用。即使账户清单当前将某个应用报告为已禁用，OpenClaw 仍可为线程启用该可访问应用。如果你在 Gateway 网关缓存应用清单后更改了该状态，请等待一小时缓存刷新或重启 Gateway 网关，然后使用 `/new` 或 `/reset`。OpenClaw 不会修复工作区插件或为其执行身份验证。如果显式工作区列表请求被拒绝，每个已启用的工作区条目都会报告 `marketplace_missing`；不相关的精选条目仍会根据默认列表响应继续处理。

对于 `plugin_detail_unavailable`，不含路径的工作区摘要必须包含 `remotePluginId`；当该选择器或后续的 `plugin/read` 结果不可用时，OpenClaw 会继续隐藏所属应用。对于 `plugin_activation_failed`，精选插件可能报告市场、身份验证或安装后刷新故障。工作区插件在尚未激活时会报告此代码；请在 OpenClaw 外部安装、启用该插件并完成身份验证。

**配置已更改，但智能体看不到插件：**运行 `/codex plugins
list` 确认配置状态，然后使用 `/new` 或 `/reset`。现有 Codex 线程绑定会继续保留启动时使用的应用配置，直到 OpenClaw 建立新的 harness 会话或替换过期绑定。

**破坏性操作被拒绝：**检查全局和按插件设置的 `allow_destructive_actions` 值。即使设为 `true`、`"auto"` 或 `"ask"`，不安全的请求架构和不明确的插件身份仍会以拒绝方式关闭。

## 相关内容

- [Codex harness](/zh-CN/plugins/codex-harness)
- [Codex harness reference](/zh-CN/plugins/codex-harness-reference)
- [Codex harness runtime](/zh-CN/plugins/codex-harness-runtime)
- [配置参考](/zh-CN/gateway/configuration-reference#codex-harness-plugin-config)
- [迁移 CLI](/zh-CN/cli/migrate)
