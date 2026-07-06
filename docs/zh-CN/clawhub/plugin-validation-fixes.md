---
read_when:
    - 你运行了 clawhub package validate，需要修复插件发现的问题
    - ClawHub 拒绝插件包发布或发出警告
    - 你正在发布前更新插件包元数据
summary: 发布前修复 ClawHub 插件包验证发现的问题
title: 插件验证修复
x-i18n:
    generated_at: "2026-07-06T21:46:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2cb869e41c9a9f1c0725f514f6b48095eb3838bf61aaf06c2474a18192f0e819
    source_path: clawhub/plugin-validation-fixes.md
    workflow: 16
---

# 插件验证修复

ClawHub 会在发布前验证插件包，也可以显示自动化包扫描的发现。本页涵盖面向作者的发现，也就是插件作者可以在其包元数据、插件清单、SDK 导入或已发布制品中修复的发现。

它不涵盖内部 Plugin Inspector 覆盖率发现。如果完整报告包含没有作者修复指导的扫描器维护代码，这些代码是给 OpenClaw 维护者看的，而不是给插件作者看的。

应用任何修复后，重新运行：

```bash
clawhub package validate <path-to-plugin>
```

## 面向作者的发现

| 代码                                    | 从这里开始                                                                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `package-json-missing`                  | [添加包元数据](/zh-CN/clawhub/plugin-validation-fixes#package-json-missing)                                                   |
| `package-openclaw-metadata-missing`     | [添加包的 openclaw 块](/zh-CN/clawhub/plugin-validation-fixes#package-openclaw-metadata-missing)                            |
| `package-openclaw-entry-missing`        | [声明 OpenClaw 包入口点](/zh-CN/clawhub/plugin-validation-fixes#package-openclaw-entry-missing)                         |
| `package-entrypoint-missing`            | [发布声明的入口点](/zh-CN/clawhub/plugin-validation-fixes#package-entrypoint-missing)                                  |
| `package-install-metadata-incomplete`   | [补全安装元数据](/zh-CN/clawhub/plugin-validation-fixes#package-install-metadata-incomplete)                               |
| `package-plugin-api-compat-missing`     | [声明插件 API 兼容性](/zh-CN/clawhub/plugin-validation-fixes#package-plugin-api-compat-missing)                          |
| `package-min-host-version-drift`        | [对齐最低主机版本](/zh-CN/clawhub/plugin-validation-fixes#package-min-host-version-drift)                                   |
| `package-manifest-version-drift`        | [对齐包版本和插件清单版本](/zh-CN/clawhub/plugin-validation-fixes#package-manifest-version-drift)                          |
| `package-openclaw-unsupported-metadata` | [移除不支持的 OpenClaw 包元数据](/zh-CN/clawhub/plugin-validation-fixes#package-openclaw-unsupported-metadata)          |
| `package-npm-pack-unavailable`          | [使 npm 制品可打包](/zh-CN/clawhub/plugin-validation-fixes#package-npm-pack-unavailable)                                 |
| `package-npm-pack-entrypoint-missing`   | [在 npm pack 输出中包含入口点](/zh-CN/clawhub/plugin-validation-fixes#package-npm-pack-entrypoint-missing)                  |
| `package-npm-pack-metadata-missing`     | [在 npm pack 输出中包含元数据](/zh-CN/clawhub/plugin-validation-fixes#package-npm-pack-metadata-missing)                       |
| `manifest-name-missing`                 | [添加插件清单显示名称](/zh-CN/clawhub/plugin-validation-fixes#manifest-name-missing)                                           |
| `manifest-unknown-fields`               | [移除不支持的插件清单字段](/zh-CN/clawhub/plugin-validation-fixes#manifest-unknown-fields)                                  |
| `manifest-unknown-contracts`            | [移除不支持的契约键](/zh-CN/clawhub/plugin-validation-fixes#manifest-unknown-contracts)                                 |
| `legacy-root-sdk-import`                | [替换根 SDK 导入](/zh-CN/clawhub/plugin-validation-fixes#legacy-root-sdk-import)                                             |
| `reserved-sdk-import`                   | [移除保留的 SDK 导入](/zh-CN/clawhub/plugin-validation-fixes#reserved-sdk-import)                                             |
| `sdk-load-session-store`                | [替换整个会话存储访问](/zh-CN/clawhub/plugin-validation-fixes#sdk-load-session-store)                                   |
| `sdk-session-store-write`               | [替换整个会话存储写入](/zh-CN/clawhub/plugin-validation-fixes#sdk-session-store-write)                                  |
| `sdk-session-file-helper`               | [替换会话文件路径辅助函数](/zh-CN/clawhub/plugin-validation-fixes#sdk-session-file-helper)                                   |
| `sdk-session-transcript-file-target`    | [替换旧版转录文件目标](/zh-CN/clawhub/plugin-validation-fixes#sdk-session-transcript-file-target)                   |
| `sdk-session-transcript-low-level`      | [替换低层转录辅助函数](/zh-CN/clawhub/plugin-validation-fixes#sdk-session-transcript-low-level)                       |
| `legacy-before-agent-start`             | [替换 before_agent_start](/zh-CN/clawhub/plugin-validation-fixes#legacy-before-agent-start)                                        |
| `provider-auth-env-vars`                | [将提供商环境变量移至设置元数据](/zh-CN/clawhub/plugin-validation-fixes#provider-auth-env-vars)                             |
| `channel-env-vars`                      | [在当前元数据中镜像渠道环境变量](/zh-CN/clawhub/plugin-validation-fixes#channel-env-vars)                                |
| `security-manifest-schema-unavailable`  | [移除不可用的安全插件清单架构引用](/zh-CN/clawhub/plugin-validation-fixes#security-manifest-schema-unavailable) |
| `unrecognized-security-manifest`        | [移除不支持的安全插件清单文件](/zh-CN/clawhub/plugin-validation-fixes#unrecognized-security-manifest)                   |

## 包元数据

### package-json-missing

包根目录不包含 `package.json`，因此 ClawHub 无法识别 npm 包、版本、入口点或 OpenClaw 元数据。

- 添加包含 `name`、`version` 和 `type` 的 `package.json`。
- 当包交付 OpenClaw 插件时，添加 `openclaw` 块。
- 使用[构建插件](/zh-CN/plugins/building-plugins)查看最小包示例，并使用[插件清单](/zh-CN/plugins/manifest#manifest-versus-packagejson)了解包与插件清单的划分。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-metadata-missing

包有 `package.json`，但没有声明 OpenClaw 包元数据。

- 添加 `package.json#openclaw`。
- 包含入口点元数据，例如 `openclaw.extensions` 或 `openclaw.runtimeExtensions`。
- 当包将通过 ClawHub 发布或安装时，添加兼容性和安装元数据。
- 参见[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-entry-missing

包元数据存在，但没有声明 OpenClaw 运行时入口点。

- 为原生插件入口点添加 `openclaw.extensions`。
- 当已发布包应加载已构建的 JavaScript 时，添加 `openclaw.runtimeExtensions`。
- 将所有入口点路径保留在包目录内。
- 参见[插件入口点](/zh-CN/plugins/sdk-entrypoints)和[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-entrypoint-missing

包声明了 OpenClaw 入口点，但验证中的包缺少引用的文件。

- 检查 `openclaw.extensions`、`openclaw.runtimeExtensions`、`openclaw.setupEntry` 和 `openclaw.runtimeSetupEntry` 中的每个路径。
- 如果入口点生成到 `dist`，请先构建包。
- 如果入口点已移动，请更新元数据。
- 参见[插件入口点](/zh-CN/plugins/sdk-entrypoints)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-install-metadata-incomplete

ClawHub 无法判断应如何安装或更新该包。

- 使用受支持的安装来源填写 `openclaw.install`，例如 `clawhubSpec`、`npmSpec` 或 `localPath`。
- 当有多个安装来源可用时，设置 `openclaw.install.defaultChoice`。
- 使用 `openclaw.install.minHostVersion` 指定最低 OpenClaw 主机版本。
- 参见[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-plugin-api-compat-missing

包没有声明其支持的 OpenClaw 插件 API 范围。

- 将 `openclaw.compat.pluginApi` 添加到 `package.json`。
- 使用你构建并测试所针对的 OpenClaw 插件 API 版本或 semver 下限。
- 将其与包版本分开。包版本描述插件发布；`openclaw.compat.pluginApi` 描述主机 API 契约。
- 参见[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-min-host-version-drift

包的最低主机版本与该包构建所针对的 OpenClaw 版本元数据不匹配。

- 检查 `openclaw.install.minHostVersion`。
- 检查包中的任何 OpenClaw 构建元数据，例如发布期间使用的 OpenClaw 版本。
- 将最低主机版本与该包实际支持的主机版本范围对齐。
- 参见[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-manifest-version-drift

包版本和插件清单版本不一致。

- 优先将 `package.json#version` 用作包发布版本。
- 如果 `openclaw.plugin.json` 也有 `version`，请更新它以匹配，或者在包元数据为权威来源时移除陈旧的插件清单版本元数据。
- 更改已发布元数据后，发布新的包版本。
- 参见[插件清单](/zh-CN/plugins/manifest)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-openclaw-unsupported-metadata

`package.json#openclaw` 块包含不受支持的 OpenClaw 包元数据字段。

- 移除不支持的字段，例如 `openclaw.bundle`。
- 将原生插件元数据保留在 `openclaw.plugin.json` 中。
- 将包入口点、兼容性、安装、设置和目录元数据保留在受支持的 `package.json#openclaw` 字段中。
- 参见[影响设备发现的 package.json 字段](/zh-CN/plugins/manifest#packagejson-fields-that-affect-discovery)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## 已发布制品

### package-npm-pack-unavailable

该包无法打包为 ClawHub 会检查或发布的制品。

- 从包根目录运行 `npm pack --dry-run`。
- 修复无效的包元数据、损坏的生命周期脚本，或会导致打包失败的 files 条目。
- 如果此包用于公开发布，请移除 `private: true`。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-entrypoint-missing

该包可以打包，但打包后的制品不包含 `package.json#openclaw` 中声明的入口点文件。

- 运行 `npm pack --dry-run`，并检查将包含的文件。
- 在打包前构建生成的入口点。
- 更新 `files`、`.npmignore` 或构建输出，以便包含声明的入口点。
- 参见[插件入口点](/zh-CN/plugins/sdk-entrypoints)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### package-npm-pack-metadata-missing

打包后的制品缺少源包中存在的 OpenClaw 元数据。

- 运行 `npm pack --dry-run`，并检查包含的元数据文件。
- 确保 `package.json` 在打包后的制品中包含 `openclaw` 块。
- 当包是原生 OpenClaw 插件时，确保包含 `openclaw.plugin.json`。
- 更新 `files` 或 `.npmignore`，确保包元数据不会被排除。
- 参见[构建插件](/zh-CN/plugins/building-plugins)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## 插件清单元数据

### manifest-name-missing

原生插件清单未包含显示名称。

- 向 `openclaw.plugin.json` 添加非空的 `name` 字段。
- 保持 `name` 便于人类阅读，并将 `id` 保留为稳定的机器 ID。
- 参见[插件清单](/zh-CN/plugins/manifest)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-fields

插件清单包含 OpenClaw 不支持的顶层字段。

- 将每个顶层字段与
  [清单字段参考](/zh-CN/plugins/manifest#top-level-field-reference)进行比较。
- 从 `openclaw.plugin.json` 中移除自定义字段。
- 将包或安装元数据移入受支持的 `package.json#openclaw` 字段，
  而不是放在清单中。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### manifest-unknown-contracts

清单在 `contracts` 内声明了不受支持的键。

- 将 `contracts` 下的每个键与
  [contracts 参考](/zh-CN/plugins/manifest#contracts-reference)进行比较。
- 移除不受支持的 contract 键。
- 将运行时行为移入插件注册代码，并将 `contracts`
  限定为静态能力所有权元数据。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## SDK 和兼容性迁移

### legacy-root-sdk-import

插件从已弃用的根 SDK barrel 导入：
`openclaw/plugin-sdk`。

- 将根 barrel 导入替换为聚焦的公开子路径导入。
- 对 `definePluginEntry` 使用 `openclaw/plugin-sdk/plugin-entry`。
- 对渠道入口辅助工具使用 `openclaw/plugin-sdk/channel-core`。
- 使用[导入约定](/zh-CN/plugins/building-plugins#import-conventions)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)来找到更窄的导入。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### reserved-sdk-import

插件导入了为内置插件或内部兼容性保留的 SDK 路径。

- 将保留的 OpenClaw 内部 SDK 导入替换为文档化的公开
  `openclaw/plugin-sdk/*` 子路径。
- 如果该行为没有公开 SDK，请将辅助工具保留在你的包内，或
  请求公开的 OpenClaw API。
- 使用[插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)和
  [SDK 迁移](/zh-CN/plugins/sdk-migration)来选择受支持的导入。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-load-session-store

插件仍在使用已弃用的整会话存储辅助工具
`loadSessionStore`。

- 读取会话状态时使用 `getSessionEntry(...)` 或 `listSessionEntries(...)`。
- 写入会话状态时使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)`。
- 避免加载、修改并保存整个会话存储对象。
- 仅当你声明的兼容性范围仍支持需要它的旧版 OpenClaw 时，
  才保留 `loadSessionStore(...)`。
- 参见[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-session-store-write

插件仍在使用已弃用的整会话存储写入辅助工具，例如
`saveSessionStore` 或 `updateSessionStore`。

- 更新现有会话条目的字段时使用 `patchSessionEntry(...)`。
- 替换或创建会话条目时使用 `upsertSessionEntry(...)`。
- 避免加载、修改并保存整个会话存储对象。
- 仅当你声明的兼容性范围仍支持需要它们的旧版 OpenClaw 时，
  才保留整存储写入辅助工具。
- 参见[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-session-file-helper

插件仍在使用已弃用的会话文件路径辅助工具，例如
`resolveSessionFilePath` 或 `resolveAndPersistSessionFile`。

- 使用 `getSessionEntry(...)` 按 Agent 和会话身份读取会话元数据。
- 使用 `patchSessionEntry(...)` 或 `upsertSessionEntry(...)` 持久化会话
  元数据。
- 当代码在准备转录操作时，使用转录身份或目标辅助工具。
- 不要持久化或依赖旧版转录文件路径。
- 参见[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-file-target

插件仍在使用已弃用的转录文件目标辅助工具
`resolveSessionTranscriptLegacyFileTarget`。

- 当代码只需要公开会话身份时，使用 `resolveSessionTranscriptIdentity(...)`。
- 当代码需要结构化的转录操作目标时，使用 `resolveSessionTranscriptTarget(...)`。
- 避免直接读取或构造旧版转录文件目标。
- 仅当你声明的兼容性范围仍支持需要它的旧版 OpenClaw 时，
  才保留旧版辅助工具。
- 参见[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### sdk-session-transcript-low-level

插件仍在使用已弃用的低层转录辅助工具，例如
`appendSessionTranscriptMessage` 或 `emitSessionTranscriptUpdate`。

- 对转录追加使用 `appendSessionTranscriptMessageByIdentity(...)`。
- 对转录更新通知使用 `publishSessionTranscriptUpdateByIdentity(...)`。
- 优先使用结构化的转录运行时表面，以便 OpenClaw 能应用正确的
  事务边界和身份处理。
- 仅当你声明的兼容性范围仍支持需要它们的旧版 OpenClaw 时，
  才保留低层转录辅助工具。
- 参见[运行时 API](/zh-CN/plugins/sdk-runtime#agent-session-state)和
  [插件 SDK 子路径](/zh-CN/plugins/sdk-subpaths)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### legacy-before-agent-start

插件仍在使用旧版 `before_agent_start` 钩子。

- 将模型或提供商覆盖工作移至 `before_model_resolve`。
- 将提示词或上下文修改工作移至 `before_prompt_build`。
- 仅当你声明的兼容性范围仍支持需要它的旧版 OpenClaw 时，
  才保留 `before_agent_start`。
- 参见 [Hooks](/zh-CN/plugins/hooks) 和
  [插件兼容性](/zh-CN/plugins/compatibility)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### provider-auth-env-vars

清单仍在使用旧版 `providerAuthEnvVars` 提供商凭证元数据。

- 将提供商环境变量元数据镜像到 `setup.providers[].envVars`。
- 仅当你支持的 OpenClaw 范围仍需要它时，才将 `providerAuthEnvVars`
  保留为兼容性元数据。
- 参见[设置参考](/zh-CN/plugins/manifest#setup-reference)和
  [SDK 迁移](/zh-CN/plugins/sdk-migration)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### channel-env-vars

清单使用旧版或较早的渠道环境变量元数据，缺少 ClawHub 期望的当前
设置或配置元数据。

- 保持渠道环境变量元数据为声明式，以便 OpenClaw 无需加载渠道运行时
  即可检查设置状态。
- 将环境驱动的渠道设置镜像到你的插件形态所使用的当前设置、渠道配置或
  包渠道元数据中。
- 仅当仍受支持的旧版 OpenClaw 需要它时，才将 `channelEnvVars`
  保留为兼容性元数据。
- 参见[插件清单](/zh-CN/plugins/manifest)和
  [渠道插件](/zh-CN/plugins/sdk-channel-plugins)。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## 安全清单

### security-manifest-schema-unavailable

包随附的 `openclaw.security.json` 包含一个 ClawHub 未识别为可用的
schema 引用。

- 如果 schema URL 仅作建议用途，请移除它。
- 仅在 OpenClaw 发布文档化的版本化 schema 后，才使用它。
- 重新运行 `clawhub package validate <path-to-plugin>`。

### unrecognized-security-manifest

包随附了不受支持的安全清单文件。

- 在 OpenClaw 文档化版本化安全清单 schema 和 ClawHub 行为之前，
  移除 `openclaw.security.json`。
- 在清单契约存在之前，将安全敏感行为记录在你的公开包文档或
  README 中。
- 重新运行 `clawhub package validate <path-to-plugin>`。

## 相关

- [ClawHub CLI](/zh-CN/clawhub/cli)
- [ClawHub 发布](/zh-CN/clawhub/publishing)
- [构建插件](/zh-CN/plugins/building-plugins)
- [插件清单](/zh-CN/plugins/manifest)
- [插件入口点](/zh-CN/plugins/sdk-entrypoints)
- [插件兼容性](/zh-CN/plugins/compatibility)
