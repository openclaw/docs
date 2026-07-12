---
read_when:
    - 你运行了 `clawhub package validate`，需要修复插件检查发现的问题
    - ClawHub 拒绝插件包发布或发出警告
    - 你正在发布前更新插件包元数据
summary: 发布前修复 ClawHub 插件包验证发现的问题
title: 插件验证修复
x-i18n:
    generated_at: "2026-07-11T20:24:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# 插件验证修复

ClawHub 会在发布前验证插件包，也可以显示自动化包扫描的发现。本页介绍面向作者的发现，即插件作者可以通过修改包元数据、插件清单、SDK 导入或已发布构件来修复的发现。

本页不介绍 Plugin Inspector 的内部覆盖率发现。如果完整报告包含未提供作者修复指导的扫描器维护代码，则这些代码供 OpenClaw 维护者处理，而非插件作者。

应用任何修复后，请重新运行：

```bash
clawhub package validate <path-to-plugin>
```

## 面向作者的发现

| 代码                                    | 从这里开始                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [添加包元数据](/zh-CN/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [添加包的 openclaw 块](/zh-CN/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [声明 OpenClaw 包入口点](/zh-CN/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [发布已声明的入口点](/zh-CN/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [补全安装元数据](/zh-CN/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [声明插件 API 兼容性](/zh-CN/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [对齐最低宿主版本](/zh-CN/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [对齐包版本和插件清单版本](/zh-CN/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [删除不受支持的 OpenClaw 包元数据](/zh-CN/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [使 npm 构件可打包](/zh-CN/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [在 npm 打包输出中包含入口点](/zh-CN/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [在 npm 打包输出中包含元数据](/zh-CN/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [添加插件清单显示名称](/zh-CN/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [删除不受支持的插件清单字段](/zh-CN/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [删除不受支持的契约键](/zh-CN/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [替换根级 SDK 导入](/zh-CN/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [删除保留的 SDK 导入](/zh-CN/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [替换完整会话存储访问](/zh-CN/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [替换完整会话存储写入](/zh-CN/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [替换会话文件路径辅助函数](/zh-CN/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [替换旧版转录文件目标](/zh-CN/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [替换底层转录辅助函数](/zh-CN/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [替换 before_agent_start](/zh-CN/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [将提供商环境变量移至设置元数据](/zh-CN/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [在当前元数据中同步渠道环境变量](/zh-CN/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [删除不可用的安全插件清单模式引用](/zh-CN/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [删除不受支持的安全插件清单文件](/zh-CN/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## 包元数据

### package-json-missing

包根目录中不包含 `package.json`，因此 ClawHub 无法识别 npm 包、版本、入口点或 OpenClaw 元数据。

- 添加包含 `name`、`version` 和 `type` 的 `package.json`。
- 如果包提供 OpenClaw 插件，请添加 `openclaw` 块。
- 请参阅[构建插件](/zh-CN/plugins/building-plugins)中的最小包示例，以及[插件清单](/zh-CN/plugins/manifest#manifest-versus-packagejson)中关于包与插件清单职责划分的说明。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-metadata-missing

包中存在 `package.json`，但未声明 OpenClaw 包元数据。

- 添加 `package.json#openclaw`。
- 包含 `openclaw.extensions` 或 `openclaw.runtimeExtensions` 等入口点元数据。
- 如果包将通过 ClawHub 发布或安装，请添加兼容性和安装元数据。
- 请参阅[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-entry-missing

包元数据已存在，但未声明 OpenClaw 运行时入口点。

- 为原生插件入口点添加 `openclaw.extensions`。
- 如果发布的包应加载构建后的 JavaScript，请添加 `openclaw.runtimeExtensions`。
- 确保所有入口点路径都位于包目录内。
- 请参阅[插件入口点](/zh-CN/plugins/sdk-entrypoints)和[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-entrypoint-missing

包声明了 OpenClaw 入口点，但被引用的文件未包含在正在验证的包中。

- 检查 `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry` 和 `openclaw.runtimeSetupEntry` 中的每个路径。
- 如果入口点生成到 `dist` 中，请构建该包。
- 如果入口点已移动，请更新元数据。
- 请参阅[插件入口点](/zh-CN/plugins/sdk-entrypoints)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-install-metadata-incomplete

ClawHub 无法判断应如何安装或更新该包。

- 使用受支持的安装来源填写 `openclaw.install`，例如 `clawhubSpec`、`npmSpec` 或 `localPath`。
- 如果有多个安装来源可用，请设置 `openclaw.install.defaultChoice`。
- 使用 `openclaw.install.minHostVersion` 指定最低 OpenClaw 宿主版本。
- 请参阅[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-plugin-api-compat-missing

包未声明其支持的 OpenClaw 插件 API 版本范围。

- 在 `package.json` 中添加 `openclaw.compat.pluginApi`。
- 使用你构建和测试时所依据的 OpenClaw 插件 API 版本或语义化版本下限。
- 将其与包版本分开。包版本描述插件发布版本；`openclaw.compat.pluginApi` 描述宿主 API 契约。
- 请参阅[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-min-host-version-drift

包的最低宿主版本与构建该包时所依据的 OpenClaw 版本元数据不匹配。

- 检查 `openclaw.install.minHostVersion`。
- 检查包中的所有 OpenClaw 构建元数据，例如发布期间使用的 OpenClaw 版本。
- 将最低宿主版本与包实际支持的宿主版本范围对齐。
- 请参阅[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-manifest-version-drift

包版本与插件清单版本不一致。

- 优先将 `package.json#version` 作为包发布版本。
- 如果 `openclaw.plugin.json` 中也包含 `version`，请更新它以保持一致；如果包元数据具有权威性，则删除过时的插件清单版本元数据。
- 更改已发布的元数据后，请发布新的包版本。
- 请参阅[插件清单](/zh-CN/plugins/manifest)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-unsupported-metadata

`package.json#openclaw` 块包含不受支持的 OpenClaw 包元数据字段。

- 删除 `openclaw.bundle` 等不受支持的字段。
- 将原生插件元数据保留在 `openclaw.plugin.json` 中。
- 将包入口点、兼容性、安装、设置和目录元数据保留在受支持的 `package.json#openclaw` 字段中。
- 请参阅[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## 已发布构件

### package-npm-pack-unavailable

无法将该包打包为 ClawHub 将检查或发布的构件。

- 在包根目录运行 `npm pack --dry-run`。
- 修复导致打包失败的无效包元数据、损坏的生命周期脚本或 `files` 条目。
- 如果此包计划公开发布，请删除 `private: true`。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-entrypoint-missing

该包可以打包，但打包后的构件不包含 `package.json#openclaw` 中声明的入口点文件。

- 运行 `npm pack --dry-run`，并检查将包含的文件。
- 在打包前构建生成的入口点。
- 更新 `files`、`.npmignore` 或构建输出，以包含已声明的入口点。
- 请参阅[插件入口点](/zh-CN/plugins/sdk-entrypoints)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-metadata-missing

打包后的构件缺少源代码包中存在的 OpenClaw 元数据。

- 运行 `npm pack --dry-run`，并检查包含的元数据文件。
- 确保打包后的构件中，`package.json` 包含 `openclaw` 块。
- 如果该包是原生 OpenClaw 插件，请确保包含 `openclaw.plugin.json`。
- 更新 `files` 或 `.npmignore`，确保包元数据不会被排除。
- 请参阅[构建插件](/zh-CN/plugins/building-plugins)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## 插件清单元数据

### manifest-name-missing

原生插件清单不包含显示名称。

- 在 `openclaw.plugin.json` 中添加非空的 `name` 字段。
- 确保 `name` 易于人类阅读，并将 `id` 保持为稳定的机器标识符。
- 请参阅[插件清单](/zh-CN/plugins/manifest)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-fields

插件清单包含 OpenClaw 不支持的顶层字段。

- 将每个顶层字段与
  [清单字段参考](/zh-CN/plugins/manifest#top-level-field-reference)进行比较。
- 从 `openclaw.plugin.json` 中移除自定义字段。
- 将软件包或安装元数据移至受支持的 `package.json#openclaw` 字段中，
  而不是放在清单中。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-contracts

清单在 `contracts` 中声明了不受支持的键。

- 将 `contracts` 下的每个键与
  [契约参考](/zh-CN/plugins/manifest#contracts-reference)进行比较。
- 移除不受支持的契约键。
- 将运行时行为移至插件注册代码，并将 `contracts`
  限定为静态能力所有权元数据。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## SDK 和兼容性迁移

### legacy-root-sdk-import

插件从已弃用的根 SDK 汇总入口导入：
`openclaw/plugin-sdk`。

- 将根汇总入口导入替换为针对特定功能的公共子路径导入。
- 对 `definePluginEntry` 使用 `openclaw/plugin-sdk/plugin-entry`。
- 对渠道入口辅助函数使用 `openclaw/plugin-sdk/channel-core`。
- 使用[导入约定](/zh-CN/plugins/building-plugins#import-conventions)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)查找范围最窄的导入。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### reserved-sdk-import

插件导入了为内置插件或内部兼容性保留的 SDK 路径。

- 将保留的 OpenClaw 内部 SDK 导入替换为文档记录的公共
  `openclaw/plugin-sdk/*` 子路径。
- 如果该行为没有公共 SDK，请将辅助函数保留在你的软件包中，或
  请求提供公共 OpenClaw API。
- 使用[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)和
  [SDK 迁移](/zh-CN/plugins/sdk-migration)选择受支持的导入。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-load-session-store

插件仍在使用已弃用的完整会话存储辅助函数
`loadSessionStore`。

- 读取会话状态时，使用 `getSessionEntry(...)` 或 `listSessionEntries(...)`。
- 写入会话状态时，使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。
- 避免加载、修改并保存整个会话存储对象。
- 仅当你声明的兼容范围仍支持需要 `loadSessionStore(...)` 的旧版
  OpenClaw 时，才保留该函数。
- 请参阅[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-session-store-write

插件仍在使用已弃用的完整会话存储写入辅助函数，例如
`saveSessionStore` 或 `updateSessionStore`。

- 更新现有会话条目的字段时，使用 `patchSessionEntry(...)`。
- 替换或创建会话条目时，使用 `upsertSessionEntry(...)`。
- 避免加载、修改并保存整个会话存储对象。
- 仅当你声明的兼容范围仍支持需要这些函数的旧版 OpenClaw 时，
  才保留完整存储写入辅助函数。
- 请参阅[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-session-file-helper

插件仍在使用已弃用的会话文件路径辅助函数，例如
`resolveSessionFilePath` 或 `resolveAndPersistSessionFile`。

- 使用 `getSessionEntry(...)` 按智能体和会话身份读取会话元数据。
- 使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)` 持久化会话元数据。
- 当代码正在准备记录操作时，使用记录身份或目标辅助函数。
- 不要持久化或依赖旧版记录文件路径。
- 请参阅[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-file-target

插件仍在使用已弃用的记录文件目标辅助函数
`resolveSessionTranscriptLegacyFileTarget`。

- 当代码仅需要公共会话身份时，使用 `resolveSessionTranscriptIdentity(...)`。
- 当代码需要结构化的记录操作目标时，使用 `resolveSessionTranscriptTarget(...)`。
- 避免直接读取或构造旧版记录文件目标。
- 仅当你声明的兼容范围仍支持需要该旧版辅助函数的旧版
  OpenClaw 时，才保留该函数。
- 请参阅[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-low-level

插件仍在使用已弃用的底层记录辅助函数，例如
`appendSessionTranscriptMessage` 或 `emitSessionTranscriptUpdate`。

- 使用 `appendSessionTranscriptMessageByIdentity(...)` 追加记录。
- 使用 `publishSessionTranscriptUpdateByIdentity(...)` 发送记录更新通知。
- 优先使用结构化记录运行时接口，以便 OpenClaw 应用正确的
  事务边界和身份处理。
- 仅当你声明的兼容范围仍支持需要这些函数的旧版 OpenClaw 时，
  才保留底层记录辅助函数。
- 请参阅[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### legacy-before-agent-start

插件仍在使用旧版 `before_agent_start` 钩子。

- 将模型或提供商覆盖工作移至 `before_model_resolve`。
- 将提示词或上下文修改工作移至 `before_prompt_build`。
- 仅当你声明的兼容范围仍支持需要 `before_agent_start` 的旧版
  OpenClaw 时，才保留该钩子。
- 请参阅[钩子](/zh-CN/plugins/hooks)和
  [插件兼容性](/zh-CN/plugins/compatibility)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### provider-auth-env-vars

清单仍在使用旧版 `providerAuthEnvVars` 提供商身份验证元数据。

- 将提供商环境变量元数据同步至 `setup.providers[].envVars`。
- 仅当你支持的 OpenClaw 版本范围仍需要 `providerAuthEnvVars` 时，
  才将其保留为兼容性元数据。
- 请参阅[设置参考](/zh-CN/plugins/manifest#setup-reference)和
  [SDK 迁移](/zh-CN/plugins/sdk-migration)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### channel-env-vars

清单使用旧版或较早的渠道环境变量元数据，但缺少 ClawHub 预期的当前
设置或配置元数据。

- 将渠道环境变量元数据保持为声明式，以便 OpenClaw 无需加载渠道运行时
  即可检查设置状态。
- 将环境变量驱动的渠道设置同步至插件形态所使用的当前设置、渠道配置或
  软件包渠道元数据。
- 仅当较旧但仍受支持的 OpenClaw 版本仍需要 `channelEnvVars` 时，
  才将其保留为兼容性元数据。
- 请参阅[插件清单](/zh-CN/plugins/manifest)和
  [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## 安全清单

### security-manifest-schema-unavailable

软件包附带的 `openclaw.security.json` 包含 ClawHub 无法识别为可用的
架构引用。

- 如果架构 URL 仅供参考，请将其移除。
- 仅在 OpenClaw 发布文档记录的版本化架构后，才使用该架构。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### unrecognized-security-manifest

软件包附带了不受支持的安全清单文件。

- 在 OpenClaw 发布版本化安全清单架构及 ClawHub 行为的文档之前，
  移除 `openclaw.security.json`。
- 在清单契约建立之前，将安全敏感行为记录在你的公开软件包文档或
  README 中。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## 相关内容

- [ClawHub CLI](/zh-CN/clawhub/cli)
- [ClawHub 发布](/zh-CN/clawhub/publishing)
- [Building Plugins](/zh-CN/plugins/building-plugins)
- [插件清单](/zh-CN/plugins/manifest)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [插件兼容性](/zh-CN/plugins/compatibility)
