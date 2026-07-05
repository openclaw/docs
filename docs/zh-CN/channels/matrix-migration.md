---
read_when:
    - 升级现有 Matrix 安装
    - 迁移加密的 Matrix 历史记录和设备状态
summary: OpenClaw 如何就地升级旧版 Matrix 插件，包括加密状态恢复限制和手动恢复步骤。
title: Matrix 迁移
x-i18n:
    generated_at: "2026-07-05T11:02:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e6607045ac7760dc9d1ecdb1dd3d3885a7213d4e6f45eb32fd9a47c76f178c8c
    source_path: channels/matrix-migration.md
    workflow: 16
---

从之前公开的 `matrix` 插件升级到当前实现。

对大多数用户来说，升级会在原位置完成：

- 插件仍为 `@openclaw/matrix`
- 渠道仍为 `matrix`
- 你的配置仍位于 `channels.matrix` 下
- 缓存的凭证仍位于 `~/.openclaw/credentials/matrix/` 下
- 运行时状态仍位于 `~/.openclaw/matrix/` 下

你不需要重命名配置键，也不需要用新名称重新安装插件。
根 `openclaw` 包不再内置 Matrix 运行时代码或 Matrix SDK
依赖。如果 `openclaw channels status` 显示 Matrix 已配置但
插件未安装，请运行 `openclaw doctor --fix` 或
`openclaw plugins install @openclaw/matrix`；不要把 Matrix SDK 包
安装到根 OpenClaw 包中。

## 迁移会自动执行什么

Matrix 迁移会在 Gateway 网关启动时（通过已加载的 Matrix 插件）、运行 [`openclaw doctor --fix`](/zh-CN/gateway/doctor) 时，以及 Matrix 客户端启动且仍发现旧磁盘状态时作为兜底机制运行。在任何可执行的迁移步骤修改磁盘状态之前，OpenClaw 会创建或复用一个聚焦的恢复快照。

使用 `openclaw update` 时，确切触发方式取决于 OpenClaw 的安装方式：

- 源码安装会在更新流程中运行一次非交互式 `openclaw doctor --fix`，然后默认重启 Gateway 网关
- 包管理器安装会更新包，运行 `openclaw doctor --non-interactive --fix`，然后依赖默认的 Gateway 网关重启，让启动流程完成 Matrix 迁移
- 如果你使用 `openclaw update --no-restart`，基于启动的 Matrix 迁移会延后，直到你之后运行 `openclaw doctor --fix` 并重启 Gateway 网关

自动迁移涵盖：

- 在 `~/Backups/openclaw-migrations/` 下创建或复用迁移前快照
- 复用你缓存的 Matrix 凭证
- 保持相同的账号选择和 `channels.matrix` 配置
- 当目标账号可以安全解析时，将旧的扁平 Matrix 同步存储和加密存储移动到当前按账号划分的位置
- 将基于文件的 sidecar 状态（`bot-storage.json` 同步缓存、`recovery-key.json`、`legacy-crypto-migration.json`、IndexedDB 快照）导入 Matrix SQLite 状态；已迁移的文件会以 `.migrated` 后缀归档
- 当本地存在以前保存的 Matrix 房间密钥备份解密密钥时，从旧 rust 加密存储中提取它
- 当访问令牌之后发生变化时，为相同 Matrix 账号、homeserver、用户和设备复用最完整的现有令牌哈希存储根
- 当 Matrix 访问令牌变化但账号/设备身份保持不变时，扫描同级令牌哈希存储根以查找待处理的加密状态恢复元数据
- 在下一次 Matrix 启动时，将已备份的房间密钥恢复到新的加密存储中

快照详情：

- 成功创建快照后，OpenClaw 会在 `~/.openclaw/matrix/migration-snapshot.json` 写入标记文件，以便之后的启动和修复流程复用同一个归档。
- 这些自动 Matrix 迁移快照只备份配置 + 状态（`includeWorkspace: false`）。
- 如果 Matrix 只有仅警告的迁移状态，例如因为仍缺少 `userId` 或 `accessToken`，OpenClaw 暂时不会创建快照，因为没有可执行的 Matrix 修改。
- 如果快照步骤失败，OpenClaw 会跳过该次运行中的 Matrix 迁移，而不是在没有恢复点的情况下修改状态。

关于多账号升级：

- 扁平 Matrix 存储（`~/.openclaw/matrix/bot-storage.json` 和 `~/.openclaw/matrix/crypto/`）来自单一存储布局，因此 OpenClaw 只能将它迁移到一个已解析的 Matrix 账号目标中
- 已经按账号划分的旧版 Matrix 存储会按每个已配置的 Matrix 账号检测和准备

## 迁移无法自动完成什么

之前公开的 Matrix 插件**不会**自动创建 Matrix 房间密钥备份。它会持久化本地加密状态并请求设备验证，但不保证你的房间密钥已备份到 homeserver。

这意味着某些加密安装只能部分迁移。

OpenClaw 无法自动恢复：

- 从未备份过的仅本地房间密钥
- 当目标 Matrix 账号暂时无法解析，因为 `homeserver`、`userId` 或 `accessToken` 仍不可用时的加密状态
- 当旧加密存储没有记录该账号的设备 ID 时的加密状态
- 当配置了多个 Matrix 账号但未设置 `channels.matrix.defaultAccount` 时，一个共享扁平 Matrix 存储的自动迁移
- 固定到仓库路径而不是标准 Matrix 包的自定义插件路径安装（由 `openclaw doctor` 暴露）
- 当旧存储有已备份密钥但没有在本地保留解密密钥时，缺失的恢复密钥

如果你的旧安装包含从未备份的仅本地加密历史，升级后一些较旧的加密消息可能仍然不可读。

## 推荐升级流程

1. 正常更新 OpenClaw 和 Matrix 插件。
   优先使用不带 `--no-restart` 的普通 `openclaw update`，这样启动流程可以立即完成 Matrix 迁移。
2. 运行：

   ```bash
   openclaw doctor --fix
   ```

   如果 Matrix 有可执行的迁移工作，Doctor 会先创建或复用迁移前快照，并打印归档路径。

3. 启动或重启 Gateway 网关。
4. 检查当前验证和备份状态：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 将你正在修复的 Matrix 账号的恢复密钥放入账号专用的环境变量中。对于单个默认账号，`MATRIX_RECOVERY_KEY` 即可。对于多个账号，为每个账号使用一个变量，例如 `MATRIX_RECOVERY_KEY_ASSISTANT`，并在命令中添加 `--account assistant`。

6. 如果 OpenClaw 告诉你需要恢复密钥，请为对应账号运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 如果此设备仍未验证，请为对应账号运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   如果恢复密钥被接受且备份可用，但 `Cross-signing verified`
   仍为 `no`，请从另一个 Matrix 客户端完成自我验证：

   ```bash
   openclaw matrix verify self
   ```

   在另一个 Matrix 客户端中接受请求，比较 emoji 或小数，
   只有在它们匹配时才输入 `yes`。该命令会等待完整的 Matrix
   身份信任建立后才报告成功。

8. 如果你有意放弃不可恢复的旧历史，并希望为未来消息建立全新的备份基线，请运行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   仅当旧恢复密钥不应再能解锁新的备份时，才添加 `--rotate-recovery-key`。

9. 如果还不存在服务端密钥备份，请为未来恢复创建一个：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密迁移如何工作

加密迁移是一个两阶段流程：

1. 如果加密迁移可执行，启动流程或 `openclaw doctor --fix` 会创建或复用迁移前快照，然后通过 Matrix 插件内置的加密检查器检查旧 Matrix rust 加密存储。
2. 如果找到备份解密密钥，OpenClaw 会将其导入 Matrix SQLite 状态，并将房间密钥恢复标记为待处理。
3. 下一次 Matrix 启动时，OpenClaw 会自动将已备份的房间密钥恢复到新的加密存储中。如果访问令牌在此期间轮换，待处理恢复状态也会从同级令牌哈希存储根中拾取。

如果旧存储报告存在从未备份的房间密钥，OpenClaw 会发出警告，而不是假装恢复已成功。

## 常见消息及其含义

### 升级和检测消息

`Matrix plugin upgraded in place.`（Doctor）或 `matrix: plugin upgraded in place for account "..."`（启动）

- 含义：检测到了旧磁盘 Matrix 状态，并已迁移到当前布局。
- 需要做什么：除非同一输出还包含警告，否则无需操作。

`Matrix migration snapshot created before applying Matrix upgrades.` / `Matrix migration snapshot reused before applying Matrix upgrades.`

- 含义：Doctor 在修改 Matrix 状态前创建了恢复归档，或发现已有快照标记并复用了该归档，而不是创建重复备份。启动日志中的对应消息为 `matrix: created pre-migration backup snapshot: ...` / `matrix: reusing existing pre-migration backup snapshot: ...`。
- 需要做什么：保留打印出的归档路径，直到你确认迁移成功。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含义：旧 Matrix 状态存在，但 OpenClaw 无法将其映射到当前 Matrix 账号，因为 Matrix 尚未配置。
- 需要做什么：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：OpenClaw 找到了旧状态，但仍无法确定确切的当前账号/设备根。
- 需要做什么：使用可工作的 Matrix 登录启动一次 Gateway 网关，或在缓存凭证存在后重新运行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到了一个共享扁平 Matrix 存储，但它拒绝猜测应由哪个命名 Matrix 账号接收它。
- 需要做什么：将 `channels.matrix.defaultAccount` 设置为目标账号，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

当被阻塞的存储是旧加密存储时，相同的三条警告也会带有前缀 `Legacy Matrix encrypted state detected at ...`。

`Matrix legacy sync store not migrated because the target already exists (...)` / `Matrix legacy crypto store not migrated because the target already exists (...)`

- 含义：新的按账号划分位置已经有同步或加密存储，因此 OpenClaw 没有自动覆盖它。
- 需要做什么：在手动删除或移动冲突目标之前，确认当前账号是正确的账号。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含义：OpenClaw 尝试移动旧 Matrix 状态，但文件系统操作失败。
- 需要做什么：检查文件系统权限和磁盘状态，然后重新运行 `openclaw doctor --fix`。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含义：OpenClaw 检测到了旧 Matrix 状态，但迁移仍因缺少身份或凭证数据而受阻。启动日志中显示为 `matrix: migration remains in a warning-only state; no pre-migration snapshot was needed yet`。
- 需要做什么：完成 Matrix 登录或配置设置，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix encrypted state was detected, but the Matrix crypto inspector is unavailable.`

- 含义：OpenClaw 找到了旧加密 Matrix 状态，但 Matrix 插件构建缺少用于检查旧 rust 加密存储的加密检查器模块。
- 需要做什么：重新安装或修复 Matrix 插件（`openclaw plugins install @openclaw/matrix`，或对仓库 checkout 使用 `openclaw plugins install ./path/to/local/matrix-plugin`），然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 含义：OpenClaw 拒绝修改 Matrix 状态，因为它无法先创建恢复快照。
- 处理方法：解决备份错误，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Failed migrating legacy Matrix client storage: ...`

- 含义：Matrix 客户端侧回退逻辑发现了旧存储，但迁移失败。OpenClaw 会回滚已完成的移动并中止该回退，而不是静默地用全新存储启动。当扁平存储指向的账号不同于当前正在启动的账号时，也会出现此错误。
- 处理方法：检查文件系统权限或冲突，保持旧状态不变，并在修复错误后重试。

`Matrix is installed from a custom path: ...`

- 含义：Matrix 被固定为路径安装，因此主线更新不会自动将它替换为默认 Matrix 插件。
- 处理方法：当你想恢复到默认 Matrix 插件时，使用 `openclaw plugins install @openclaw/matrix` 重新安装。

### 加密状态恢复消息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 含义：已备份的房间密钥已成功恢复到新的加密存储中。
- 处理方法：通常不需要做任何事。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 含义：一些旧房间密钥只存在于旧的本地存储中，从未上传到 Matrix 备份。在准备阶段，同一限制会报告为 `Legacy Matrix encrypted state for account "..." contains N room key(s) that were never backed up.`
- 处理方法：除非你能从另一个已验证客户端手动恢复这些密钥，否则部分旧的加密历史记录可能仍然不可用。

`Legacy Matrix encrypted state detected at ... but no device ID was found for account "..."`

- 含义：旧加密存储没有记录它属于哪个 Matrix 设备，因此 OpenClaw 无法安全检查它。
- 处理方法：旧的加密历史记录无法自动恢复；OpenClaw 会在没有它的情况下继续。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 含义：备份存在，但 OpenClaw 无法自动恢复恢复密钥。
- 处理方法：运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`（优先于将密钥作为参数传入）。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 含义：OpenClaw 找到了旧加密存储，但无法足够安全地检查它以准备恢复。
- 处理方法：重新运行 `openclaw doctor --fix`。如果问题重复出现，请保持旧状态目录不变，并使用另一个已验证的 Matrix 客户端加上 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 进行恢复。

`Legacy Matrix backup key was found for account "...", but Matrix SQLite state already contains a different recovery key. Leaving the existing state unchanged.`

- 含义：OpenClaw 检测到备份密钥冲突，并拒绝自动覆盖当前恢复密钥状态。
- 处理方法：在重试任何恢复命令前，先确认哪个恢复密钥是正确的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 含义：这是旧存储格式的硬性限制。
- 处理方法：已备份的密钥仍可恢复，但仅本地存在的加密历史记录可能仍然不可用。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 含义：新插件尝试恢复，但 Matrix 返回了错误。
- 处理方法：运行 `openclaw matrix verify backup status`，如有需要，再使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 重试。

### 手动恢复消息

`openclaw matrix verify status` 和 `openclaw matrix verify backup status` 会在此设备上的房间密钥备份不健康时，打印一行 `Backup issue:` 以及 `Next steps:` 指引：

| 备份问题                                                              | 含义                                               | 修复方法                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | 没有可恢复的内容                                   | 使用 `openclaw matrix verify bootstrap` 创建房间密钥备份                                                                                  |
| `backup decryption key is not loaded on this device`                  | 密钥存在，但此处未激活                             | 使用 `openclaw matrix verify backup restore`；如果仍无法加载密钥，请通过 `--recovery-key-stdin` 管道传入恢复密钥                         |
| `backup decryption key could not be loaded from secret storage (...)` | 密钥存储加载失败或不受支持                         | 管道传入恢复密钥：`printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`                    |
| `backup key mismatch (...)`                                           | 已存储密钥与活跃服务器备份不匹配                   | 使用活跃服务器备份密钥重新运行 `verify backup restore --recovery-key-stdin`，或使用 `verify backup reset --yes` 创建新的基线             |
| `backup signature chain is not trusted by this device`                | 设备尚未信任交叉签名链                             | 先运行 `verify device --recovery-key-stdin`，如果信任仍不完整，再从另一个已验证客户端运行 `verify self`                                  |
| `backup exists but is not active on this device`                      | 服务器备份存在，但本地会话未激活                   | 先验证设备，然后使用 `openclaw matrix verify backup status` 重新检查                                                                      |
| `backup trust state could not be fully determined`                    | 诊断结果不确定                                     | `openclaw matrix verify status --verbose`                                                                                                 |

其他恢复错误：

`Matrix recovery key is required`

- 含义：你尝试执行恢复步骤时没有提供必需的恢复密钥。
- 处理方法：使用 `--recovery-key-stdin` 重新运行命令，例如 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 含义：提供的密钥无法解析，或不符合预期格式。
- 处理方法：使用来自你的 Matrix 客户端或恢复密钥导出的精确恢复密钥重试。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 含义：恢复密钥解锁了可用的备份材料，但 Matrix 尚未为此设备建立完整的交叉签名身份信任。检查命令输出中的 `Recovery key accepted`、`Backup usable`、`Cross-signing verified` 和 `Device verified by owner`。
- 处理方法：运行 `openclaw matrix verify self`，在另一个 Matrix 客户端中接受请求，比对 SAS，并且只有在匹配时才输入 `yes`。仅当你有意替换当前交叉签名身份时，才使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`。

如果你接受丢失无法恢复的旧加密历史记录，也可以改为使用 `openclaw matrix verify backup reset --yes` 重置当前备份基线。当已存储的备份密钥损坏时，该重置还会修复密钥存储，使新的备份密钥能在重启后正确加载。

### 自定义插件安装消息

`Matrix is installed from a custom path that no longer exists: ...`

- 含义：你的插件安装记录指向一个已经不存在的本地路径。
- 处理方法：使用 `openclaw plugins install @openclaw/matrix` 重新安装；如果你从仓库检出运行，则使用 `openclaw plugins install ./path/to/local/matrix-plugin`。`openclaw doctor --fix` 也可以为你移除过时的 Matrix 插件引用。

## 如果加密历史记录仍未恢复

按顺序运行这些检查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

如果备份成功恢复，但某些旧房间仍缺少历史记录，这些缺失的密钥很可能从未被之前的插件备份。

## 如果你想为未来消息重新开始

如果你接受丢失无法恢复的旧加密历史记录，并且只想为后续内容建立干净的备份基线，请按顺序运行这些命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果之后设备仍未验证，请从你的 Matrix 客户端完成验证：比对 SAS 表情符号或十进制代码，并确认它们匹配。

## 相关内容

- [Matrix](/zh-CN/channels/matrix)：渠道设置和配置。
- [Matrix 推送规则](/zh-CN/channels/matrix-push-rules)：通知路由。
- [Doctor](/zh-CN/gateway/doctor)：健康检查和自动迁移触发器。
- [迁移指南](/zh-CN/install/migrating)：所有迁移路径（机器迁移、跨系统导入）。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。
