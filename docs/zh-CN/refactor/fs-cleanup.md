---
read_when:
    - 你正在重构 OpenClaw 文件系统辅助函数
    - 你正在更改 @openclaw/fs-safe 导入、包装器或插件 SDK 文件 API
    - 你正在判断一个本地文件辅助工具应归属于 OpenClaw 还是 fs-safe
summary: 围绕 @openclaw/fs-safe 整合 OpenClaw 文件系统辅助工具的计划
title: fs-safe Cleanup Plan
x-i18n:
    generated_at: "2026-05-06T01:20:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 447cea05795539f0ca14364cd1d722798d8f00babacd1cc609040912cc96fab4
    source_path: refactor/fs-cleanup.md
    workflow: 16
---

## Status

已在 `codex/extract-fs-safe-primitives` 上实现。保留此文件，作为后续评审和未来 fs-safe 表面变更的清理清单。

## 目标

让 OpenClaw 的文件系统访问变得平淡且可预测：

- 核心代码使用一小组会应用 OpenClaw 策略的 OpenClaw 包装器。
- 插件 SDK 兼容别名保持有意设计并有文档记录。
- fs-safe 保持以 `root()` 为中心的小型公开叙事，低层原语放在显式子路径之后。
- OpenClaw 内部不再出现重复的 JSON、临时、私有存储和路径辅助函数名称。
- 安全敏感行为在名称移动之前保留回归测试。

## 非目标

- 不要在此次清理中移除公开插件 SDK 导出。保留已弃用别名，直到版本化 SDK 迁移将其移除。
- 不要把 fs-safe 做成沙箱。它仍然是用于本地文件访问的库级防护栏，而不是操作系统隔离。
- 不要把所有绝对路径读取都转换为受 root 约束的读取。有些 OpenClaw 路径是可信绝对路径，应保持显式。
- 不要追逐表面性的 import 变动，除非它减少辅助函数数量或澄清信任边界。

## fs-safe 包版本固定

`@openclaw/fs-safe` 发布在 npm 上，并通过 semver 范围使用。新的检出和 CI runner 应从公共 registry 安装该包，而不是从本地 `link:../fs-safe` 检出或 GitHub tarball 安装。

当前范围：

- `^0.1.0`

发布包包含已构建的 `dist` 文件，因此 OpenClaw 不应在 `pnpm.onlyBuiltDependencies` 中列出它。

## 当前形态

fs-safe 的主入口有意保持收窄：

- `root`
- `FsSafeError`
- `categorizeFsSafeError`
- root 选项/结果类型
- Python 辅助函数配置

更宽的表面位于子路径之后：

- `/json`
- `/store`
- `/temp`
- `/atomic`
- `/root`
- `/advanced`
- `/archive`
- `/walk`

OpenClaw 现在把 fs-safe 放在一个小型包装边界之后：

- 用于核心策略默认值的本地 `src/infra/*` 包装器
- 公开插件 SDK 别名，包括 fs-safe 之前的旧名称
- 当导入 `src/infra` 会跨越包边界时使用的包内 utility 导出

import 边界测试会拒绝在这些允许区域之外新增直接 fs-safe import。

## 使用映射

### 受 Root 约束的访问

代表性用法：

- `src/gateway/server-methods/agents.ts`
- `src/agents/pi-tools.read.ts`
- `src/agents/apply-patch.ts`
- `src/plugins/install.ts`
- `src/auto-reply/reply/stage-sandbox-media.ts`
- `src/gateway/canvas-documents.ts`

保留这一族。`root()` 是 OpenClaw 应推动调用方使用的 fs-safe 产品表面。

### JSON 辅助函数

OpenClaw 对相同操作仍使用许多名称：

- `readJsonFile`
- `readJsonFileStrict`
- `readDurableJsonFile`
- `writeJsonAtomic`
- `loadJsonFile`
- `saveJsonFile`
- `readJsonFileWithFallback`
- `writeJsonFileAtomically`

fs-safe 的规范名称更清晰：

- `tryReadJson`
- `readJson`
- `readJsonIfExists`
- `writeJson`
- `readJsonSync`
- `tryReadJsonSync`
- `writeJsonSync`

这是价值最高的清理，因为它在不改变语义的情况下移除了命名漂移。兼容别名保留在 `src/infra/json-files.ts` 和插件 SDK barrel 中。

### 私有状态和存储

代表性用法：

- `src/commitments/store.ts`
- `src/agents/models-config.ts`
- `src/agents/pi-auth-json.ts`
- `src/cron/run-log.ts`
- `src/secrets/shared.ts`
- `src/infra/device-auth-store.ts`
- `src/infra/device-identity.ts`

当前重叠：

- `fileStore`
- `fileStore({ private: true })`
- 插件 SDK 私有状态别名

这些概念现在归为一个族。fs-safe 通过 `fileStore({ private: true })` 暴露私有模式；OpenClaw 内部和内置插件使用 store 形态的包装器，而不是独立的私有 JSON/文本辅助函数。

### 临时工作区

代表性用法：

- `src/media/qr-image.ts`
- `extensions/discord/src/send.voice.ts`
- `extensions/discord/src/voice/audio.ts`
- `extensions/qa-lab/src/temp-dir.test-helper.ts`

`tempWorkspace` 是稳定且有用的原语。一次性临时目标和同级临时辅助函数是更低层的实现工具。

### 原子写入

代表性用法：

- 配置和会话存储
- cron 存储
- 插件安装路径
- 插件状态文件

保留原子替换作为公开 fs-safe 子路径。OpenClaw 应尽可能使用相同的规范 JSON/文本辅助函数，而不是为普通 JSON 状态手动挑选较低层的原子调用。

### 常规、安全和 root 文件读取

这些并不是真正的重复：

- `root()` 保护 root 相对的不可信路径。
- 常规文件辅助函数读取可信绝对路径，并执行常规文件检查。
- 安全文件辅助函数为 secret 引用添加所有权和模式检查。

将它们保持分离。记录信任边界，而不是把它隐藏在一个通用的“读取文件”辅助函数之后。

### 归档辅助函数

代表性用法：

- 插件安装
- skill 安装
- marketplace 和 ClawHub 归档流程

保留为单独的 fs-safe 子路径。不要把归档 entry 管道泄漏到 OpenClaw 核心调用点，除非调用方确实在验证归档元数据。

## 目标设计

### OpenClaw import

核心 OpenClaw 代码应使用本地策略包装器：

- `src/infra/fs-safe.ts` 用于常见 root/error 辅助函数
- `src/infra/json-files.ts` 用于临时 JSON 兼容层
- `src/infra/private-file-store.ts`，直到私有存储统一
- `src/infra/replace-file.ts` 用于低层原子替换
- `src/infra/boundary-file-read.ts` 用于 loader/package 边界读取
- `src/infra/archive.ts` 用于归档提取策略
- `src/infra/file-lock-manager.ts` 用于少数需要 manager 风格锁生命周期/诊断的核心服务

新的 `@openclaw/fs-safe/*` 直接 import 应仅保留给：

- 无法导入 `src/infra` 的核心之外包级 utility
- 兼容 shim
- 有意使用狭窄 fs-safe 子路径的代码，例如使用 `@openclaw/fs-safe/file-lock` 的 `openclaw/plugin-sdk/file-lock`

### 插件 SDK 导出

插件 SDK 导出是契约性的。即使 OpenClaw 内部迁移到规范名称，也要保留别名。

当替代项稳定后，在类型/文档中将旧名称标记为已弃用：

- `readJsonFileWithFallback` -> `readJsonIfExists` 或 store 方法
- `writeJsonFileAtomically` -> `writeJson`
- `loadJsonFile` -> `tryReadJson`
- `saveJsonFile` -> `writeJson`
- `readFileWithinRoot` -> `root(...).read*`
- `writeFileWithinRoot` -> `root(...).write`

### fs-safe 存储

向一个 store 族靠拢：

```ts
const store = fileStore({
  rootDir,
  private: true,
  mode: 0o600,
  dirMode: 0o700,
});
```

或一个薄别名：

```ts
const store = stateStore({ rootDir, private: true });
```

store 族应覆盖：

- `read`
- `readText`
- `readJson`
- `readTextIfExists`
- `readJsonIfExists`
- `write`
- `writeJson`
- `remove`
- `exists`
- `open`
- `copyIn`
- `writeStream`
- `pruneExpired`

此次清理在 fs-safe 中添加了该 store 形态，移除了未发布的 `privateStateStore` 表面，并将 OpenClaw 内部和内置插件迁移到显式 store 读取/写入。

### 临时目录

保持稳定公开临时目录表面较小：

```ts
await using workspace = await tempWorkspace({ prefix: "openclaw-" });
const target = workspace.path("payload.bin");
```

除非具体 OpenClaw 调用方需要公开契约，否则将一次性临时目标辅助函数和同级临时辅助函数移到 advanced/internal。

## 重构阶段

### 阶段 1：清点和防护

- 添加一个小型 import 边界测试，列出 OpenClaw 核心中允许的直接 `@openclaw/fs-safe/*` import。
- 为 `src/infra/json-file.ts` 保留的 JSON 符号链接行为添加回归测试。
- 为必须继续解析的公开插件 SDK 别名添加回归测试。
- 一旦别名标记为已弃用，就在插件 SDK 运行时文档中添加文档说明。

退出条件：

- 当前兼容表面有可执行测试覆盖。
- 新的直接 fs-safe import 在评审中可见。

### 阶段 2：JSON 名称清理

- 在语义相同的位置，将 OpenClaw 内部调用方从旧 JSON 名称转换为规范 fs-safe 名称。
- 保持插件 SDK 别名不变。
- 如果能减少间接层且不丢失符号链接语义，将 `src/infra/json-file.ts` 和 `src/infra/json-files.ts` 合并为一个兼容模块。
- 保留 `saveJsonFile` 的符号链接目标行为，直到每个调用方/测试都被有意迁移。

退出条件：

- 核心内部代码不再 import `readJsonFileStrict`、`readDurableJsonFile` 或 `writeJsonAtomic`，除非它是兼容 shim。
- 插件 SDK 别名仍通过 import/type 测试。

### 阶段 3：Store 统一

- 向 fs-safe 的 store API 添加统一私有模式。
- 移除未发布的 `privateStateStore` 表面，而不是保留第二个 store 族。
- 以小分组将 OpenClaw 私有状态内部迁移到统一 store 形态：
  - auth/profile 状态
  - 设备身份和设备 auth
  - cron/run 日志
  - 跟进承诺
  - 插件状态
- 为有意的预发布私有辅助函数移除重新生成插件 SDK API baseline。

退出条件：

- OpenClaw 内部和内置插件不调用独立的私有 JSON/文本辅助函数。
- `fileStore({ private: true })` 是唯一的私有多文件 store API。

### 阶段 4：临时目录简化

- 用 `tempWorkspace` 替换 OpenClaw 一次性临时目标调用点。
- 保留 `resolvePreferredOpenClawTmpDir` 作为 OpenClaw 策略。
- 将一次性临时目录和同级临时辅助函数移出经整理的 OpenClaw 包装器表面。

退出条件：

- 除非低层原子辅助函数拥有临时路径，否则 OpenClaw 使用 `tempWorkspace` 管理临时文件生命周期。

### 阶段 5：Shim 减少

- 将一行式 fs-safe shim 分组到更少数量的命名 OpenClaw 策略模块中。
- 删除不再被 import 的 shim。
- 保留用于保留公开 SDK 名称或 OpenClaw 特定默认值的 shim。

候选稳定 shim：

- `src/infra/fs-safe.ts`
- `src/infra/json-files.ts`
- `src/infra/private-file-store.ts`
- `src/infra/replace-file.ts`
- `src/infra/boundary-file-read.ts`
- `src/infra/archive.ts`

候选 advanced-only 分组：

- 路径 guard
- 符号链接父级 guard
- 硬链接 guard
- 移动路径辅助函数
- 文件身份辅助函数
- 同级临时辅助函数

退出条件：

- 本地包装器列表具有策略含义，而不是每个 fs-safe 模块对应一个文件。

### 阶段 6：fs-safe 公开表面定稿

- 保持 `@openclaw/fs-safe` 主入口经过整理。
- 保持 `root()` 作为主要 README/API 叙事。
- 保持 `openPinnedFileSync` 内部使用。使用 `readSecureFile`、`root().open` 或 `openRootFile*` 包装器，而不是暴露 fd 级 pinned 原语。
- 保持 `createSidecarLockManager` 内部使用。公开调用方应使用 `acquireFileLock` / `withFileLock`；`createFileLockManager` 仅作为子路径提供给需要 held-lock 检查或 drain/reset 的长期运行服务。
- 仅当 API 检查显示没有受支持调用方需要主 root interface 时，才将 `openWritable` 等少见 root 逃生口移到 advanced。
- 保持 `regular-file`、`secure-file`、归档和 root 辅助函数分离，因为它们的信任模型不同。
- 移除或标记为不稳定任何已被 root 或 store 方法完全覆盖的独立辅助函数。

退出条件：

- fs-safe 拥有稳定的 pre-1.0 公开表面。
- 除兼容 shim 外，OpenClaw 只 import 稳定 fs-safe API。

## 验证

按阶段使用针对性证明：

- JSON 清理：
  - JSON 符号链接测试
  - 插件 SDK JSON-store import 测试
  - 使用 JSON store 别名的代表性插件测试
- Store 统一：
  - fs-safe 中的私有模式测试
  - auth profile 持久化测试
  - 设备身份测试
  - cron/run-log 测试
- 临时目录清理：
  - 媒体临时目录测试
  - Discord 语音临时目录测试
  - QA-lab 临时辅助函数测试
- Shim 减少：
  - 插件 SDK API 生成/检查
  - import 边界测试
  - `pnpm build`

在合并大范围清理批次之前，运行 changed gate 和 build：

```sh
pnpm check:changed
pnpm build
```

本次清理的实现证明：

- `pnpm test src/infra/fs-safe-import-boundary.test.ts src/plugin-sdk/temp-path.test.ts src/agents/models-config.write-serialization.test.ts src/infra/json-file.test.ts src/infra/json-files.test.ts`
- `pnpm test src/infra/fs-safe-import-boundary.test.ts src/infra/device-auth-store.test.ts src/infra/device-identity.test.ts src/infra/exec-approvals.test.ts src/agents/models-config.write-serialization.test.ts src/agents/pi-embedded-runner/openrouter-model-capabilities.test.ts src/agents/harness/native-hook-relay.test.ts`
- `pnpm test src/infra/fs-safe-import-boundary.test.ts src/infra/hardlink-guards.test.ts src/infra/file-identity.test.ts src/plugin-sdk/fs-safe-compat.test.ts src/plugin-sdk/temp-path.test.ts`
- `pnpm plugin-sdk:api:check`
- `pnpm build`
- Blacksmith Testbox `pnpm install --frozen-lockfile --config.minimum-release-age=0 && pnpm check:changed`
- 在 `../fs-safe` 中：`pnpm docs:site && pnpm build && pnpm test test/api-coverage.test.ts test/new-primitives.test.ts`

## 审查清单

- 此变更是否减少了一个公共名称、本地包装器或重复的语义
  家族？
- 旧名称是否是公共插件 SDK 表面？如果是，保留一个已弃用的别名。
- 替换是否保留了符号链接、硬链接、模式和文件缺失
  行为？
- 调用方使用的是不可信相对路径、可信绝对路径、密钥
  路径、归档条目，还是临时生命周期？选择能明确表达这一点的辅助函数。
- 导出的名称变更时，文档和插件 SDK API 快照是否已更新？
