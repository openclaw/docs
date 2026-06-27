---
read_when:
    - 升级现有的 Matrix 安装
    - 迁移加密的 Matrix 历史记录和设备状态
summary: OpenClaw 如何就地升级之前的 Matrix 插件，包括加密状态恢复限制和手动恢复步骤。
title: Matrix 迁移
x-i18n:
    generated_at: "2026-06-27T01:23:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

从之前公开的 `matrix` 插件升级到当前实现。

对大多数用户来说，升级是原地完成的：

- 插件仍然是 `@openclaw/matrix`
- 渠道仍然是 `matrix`
- 你的配置仍然位于 `channels.matrix` 下
- 缓存的凭证仍然位于 `~/.openclaw/credentials/matrix/` 下
- 运行时状态仍然位于 `~/.openclaw/matrix/` 下

你不需要重命名配置键，也不需要用新名称重新安装插件。
根 `openclaw` 包不再内置 Matrix 运行时代码或 Matrix SDK
依赖。如果 `openclaw channels status` 显示 Matrix 已配置，但更新后
插件缺失，请运行 `openclaw doctor --fix` 或
`openclaw plugins install @openclaw/matrix`；不要将 Matrix SDK 包
安装到根 OpenClaw 包中。

## 迁移会自动执行什么

当 Gateway 网关启动时，以及当你运行 [`openclaw doctor --fix`](/zh-CN/gateway/doctor) 时，OpenClaw 会尝试自动修复旧的 Matrix 状态。
在任何可执行的 Matrix 迁移步骤修改磁盘状态之前，OpenClaw 会创建或复用一个聚焦的恢复快照。

当你使用 `openclaw update` 时，确切触发方式取决于 OpenClaw 的安装方式：

- 源码安装会在更新流程中运行 `openclaw doctor --fix`，然后默认重启 Gateway 网关
- 包管理器安装会更新包、运行一次非交互式 Doctor 检查，然后依赖默认的 Gateway 网关重启，以便启动过程可以完成 Matrix 迁移
- 如果你使用 `openclaw update --no-restart`，由启动支持的 Matrix 迁移会延后，直到你稍后运行 `openclaw doctor --fix` 并重启 Gateway 网关

自动迁移涵盖：

- 在 `~/Backups/openclaw-migrations/` 下创建或复用迁移前快照
- 复用你缓存的 Matrix 凭证
- 保持相同的账号选择和 `channels.matrix` 配置
- 将最旧的扁平 Matrix 同步存储移动到当前按账号划分的位置
- 当目标账号可以安全解析时，将最旧的扁平 Matrix 加密存储移动到当前按账号划分的位置
- 当旧的 rust 加密存储中本地存在此前保存的 Matrix 房间密钥备份解密密钥时，将其提取出来
- 当访问令牌稍后发生变化时，为同一个 Matrix 账号、homeserver 和用户复用最完整的现有令牌哈希存储根目录
- 当 Matrix 访问令牌变化但账号/设备身份保持不变时，扫描同级令牌哈希存储根目录中的待处理加密状态恢复元数据
- 在下一次 Matrix 启动时，将已备份的房间密钥恢复到新的加密存储中

快照详情：

- OpenClaw 会在成功创建快照后，将标记文件写入 `~/.openclaw/matrix/migration-snapshot.json`，以便后续启动和修复过程可以复用同一个归档。
- 这些自动 Matrix 迁移快照只备份配置 + 状态（`includeWorkspace: false`）。
- 如果 Matrix 只有仅警告的迁移状态，例如因为 `userId` 或 `accessToken` 仍然缺失，OpenClaw 暂时不会创建快照，因为没有可执行的 Matrix 修改。
- 如果快照步骤失败，OpenClaw 会跳过该次运行的 Matrix 迁移，而不是在没有恢复点的情况下修改状态。

关于多账号升级：

- 最旧的扁平 Matrix 存储（`~/.openclaw/matrix/bot-storage.json` 和 `~/.openclaw/matrix/crypto/`）来自单存储布局，因此 OpenClaw 只能将其迁移到一个已解析的 Matrix 账号目标中
- 已经按账号划分的旧版 Matrix 存储会按每个已配置的 Matrix 账号进行检测和准备

## 迁移无法自动完成什么

之前公开的 Matrix 插件**不会**自动创建 Matrix 房间密钥备份。它会持久化本地加密状态并请求设备验证，但不保证你的房间密钥已备份到 homeserver。

这意味着一些加密安装只能被部分迁移。

OpenClaw 无法自动恢复：

- 从未备份过的仅本地房间密钥
- 当目标 Matrix 账号尚无法解析，因为 `homeserver`、`userId` 或 `accessToken` 仍不可用时的加密状态
- 当配置了多个 Matrix 账号但未设置 `channels.matrix.defaultAccount` 时，自动迁移一个共享的扁平 Matrix 存储
- 固定到仓库路径而不是标准 Matrix 包的自定义插件路径安装
- 当旧存储有已备份密钥但未在本地保留解密密钥时缺失的恢复密钥

当前警告范围：

- 自定义 Matrix 插件路径安装会由 Gateway 网关启动和 `openclaw doctor` 同时提示

如果你的旧安装包含从未备份的仅本地加密历史记录，升级后某些较旧的加密消息可能仍然无法读取。

## 推荐升级流程

1. 正常更新 OpenClaw 和 Matrix 插件。
   优先使用不带 `--no-restart` 的普通 `openclaw update`，这样启动过程可以立即完成 Matrix 迁移。
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

5. 将你正在修复的 Matrix 账号的恢复密钥放入账号专属环境变量。对于单个默认账号，`MATRIX_RECOVERY_KEY` 即可。对于多个账号，为每个账号使用一个变量，例如 `MATRIX_RECOVERY_KEY_ASSISTANT`，并向命令添加 `--account assistant`。

6. 如果 OpenClaw 告诉你需要恢复密钥，请为匹配的账号运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 如果此设备仍未验证，请为匹配的账号运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   如果恢复密钥被接受并且备份可用，但 `Cross-signing verified`
   仍然是 `no`，请从另一个 Matrix 客户端完成自验证：

   ```bash
   openclaw matrix verify self
   ```

   在另一个 Matrix 客户端中接受请求，比较表情符号或数字，
   只有在它们匹配时才输入 `yes`。该命令只有在
   `Cross-signing verified` 变为 `yes` 后才会成功退出。

8. 如果你有意放弃无法恢复的旧历史记录，并希望为未来消息建立新的备份基线，请运行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. 如果尚不存在服务器端密钥备份，请为未来恢复创建一个：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密迁移如何工作

加密迁移是一个两阶段过程：

1. 如果加密迁移可执行，启动过程或 `openclaw doctor --fix` 会创建或复用迁移前快照。
2. 启动过程或 `openclaw doctor --fix` 会通过当前活动的 Matrix 插件安装检查旧的 Matrix 加密存储。
3. 如果找到备份解密密钥，OpenClaw 会将其写入新的恢复密钥流程，并将房间密钥恢复标记为待处理。
4. 在下一次 Matrix 启动时，OpenClaw 会自动将已备份的房间密钥恢复到新的加密存储中。

如果旧存储报告存在从未备份的房间密钥，OpenClaw 会发出警告，而不是假装恢复已成功。

## 常见消息及其含义

### 升级和检测消息

`Matrix plugin upgraded in place.`

- 含义：检测到了磁盘上的旧 Matrix 状态，并已迁移到当前布局。
- 该怎么做：除非同一输出中还包含警告，否则无需操作。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 含义：OpenClaw 在修改 Matrix 状态之前创建了恢复归档。
- 该怎么做：保留打印出的归档路径，直到你确认迁移成功。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 含义：OpenClaw 找到了现有的 Matrix 迁移快照标记，并复用了该归档，而不是创建重复备份。
- 该怎么做：保留打印出的归档路径，直到你确认迁移成功。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含义：旧 Matrix 状态存在，但 OpenClaw 无法将其映射到当前 Matrix 账号，因为 Matrix 尚未配置。
- 该怎么做：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：OpenClaw 找到了旧状态，但仍然无法确定确切的当前账号/设备根目录。
- 该怎么做：使用可工作的 Matrix 登录启动一次 Gateway 网关，或在缓存凭证存在后重新运行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到了一个共享的扁平 Matrix 存储，但拒绝猜测应将其分配给哪个具名 Matrix 账号。
- 该怎么做：将 `channels.matrix.defaultAccount` 设置为目标账号，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 含义：新的按账号划分位置中已经存在同步或加密存储，因此 OpenClaw 未自动覆盖它。
- 该怎么做：在手动删除或移动冲突目标之前，确认当前账号是正确账号。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含义：OpenClaw 尝试移动旧 Matrix 状态，但文件系统操作失败。
- 该怎么做：检查文件系统权限和磁盘状态，然后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 含义：OpenClaw 找到了旧的加密 Matrix 存储，但没有当前 Matrix 配置可供关联。
- 该怎么做：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：加密存储存在，但 OpenClaw 无法安全判断它属于哪个当前账号/设备。
- 该怎么做：使用可工作的 Matrix 登录启动一次 Gateway 网关，或在缓存凭证可用后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到了一个共享的扁平旧版加密存储，但拒绝猜测应将其分配给哪个具名 Matrix 账号。
- 该怎么做：将 `channels.matrix.defaultAccount` 设置为目标账号，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含义：OpenClaw 检测到了旧 Matrix 状态，但迁移仍被缺失的身份或凭证数据阻塞。
- 该怎么做：完成 Matrix 登录或配置设置，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 含义：OpenClaw 找到了旧的加密 Matrix 状态，但无法从 Matrix 插件加载通常用于检查该存储的辅助入口点。
- 处理方式：重新安装或修复 Matrix 插件（`openclaw plugins install @openclaw/matrix`，或者对于 repo checkout 使用 `openclaw plugins install ./path/to/local/matrix-plugin`），然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 含义：OpenClaw 找到了一个会逃出插件根目录或无法通过插件边界检查的辅助文件路径，因此拒绝导入它。
- 处理方式：从可信路径重新安装 Matrix 插件，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 含义：OpenClaw 拒绝修改 Matrix 状态，因为它无法先创建恢复快照。
- 处理方式：解决备份错误，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Failed migrating legacy Matrix client storage: ...`

- 含义：Matrix 客户端侧 fallback 找到了旧的扁平存储，但移动失败。OpenClaw 现在会中止该 fallback，而不是静默地使用全新存储启动。
- 处理方式：检查文件系统权限或冲突，保持旧状态不变，并在修复错误后重试。

`Matrix is installed from a custom path: ...`

- 含义：Matrix 被固定为路径安装，因此主线更新不会自动将其替换为 repo 的标准 Matrix 包。
- 处理方式：当你想回到默认 Matrix 插件时，使用 `openclaw plugins install @openclaw/matrix` 重新安装。

### 加密状态恢复消息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 含义：已备份的房间密钥已成功恢复到新的 crypto 存储中。
- 处理方式：通常无需操作。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 含义：一些旧房间密钥只存在于旧本地存储中，从未上传到 Matrix 备份。
- 处理方式：除非你能从另一个已验证的客户端手动恢复这些密钥，否则预计部分旧加密历史仍不可用。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 含义：备份存在，但 OpenClaw 无法自动恢复恢复密钥。
- 处理方式：运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 含义：OpenClaw 找到了旧的加密存储，但无法以足够安全的方式检查它来准备恢复。
- 处理方式：重新运行 `openclaw doctor --fix`。如果问题重复出现，请保持旧状态目录不变，并使用另一个已验证的 Matrix 客户端以及 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 进行恢复。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 含义：OpenClaw 检测到备份密钥冲突，并拒绝自动覆盖当前 recovery-key 文件。
- 处理方式：在重试任何恢复命令前，先确认哪个恢复密钥是正确的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 含义：这是旧存储格式的硬性限制。
- 处理方式：已备份的密钥仍可恢复，但仅存在本地的加密历史可能仍不可用。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 含义：新插件尝试恢复，但 Matrix 返回了错误。
- 处理方式：运行 `openclaw matrix verify backup status`，如有需要，再使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 重试。

### 手动恢复消息

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 含义：OpenClaw 知道你应该有备份密钥，但它尚未在此设备上激活。
- 处理方式：运行 `openclaw matrix verify backup restore`，或如有需要，设置 `MATRIX_RECOVERY_KEY` 并运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 含义：此设备当前未存储恢复密钥。
- 处理方式：设置 `MATRIX_RECOVERY_KEY`，运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`，然后恢复备份。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 含义：存储的密钥与当前 Matrix 备份不匹配。
- 处理方式：将 `MATRIX_RECOVERY_KEY` 设置为正确密钥，并运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

如果你接受丢失无法恢复的旧加密历史，也可以改为使用 `openclaw matrix verify backup reset --yes` 重置当前备份基线。当存储的备份 secret 损坏时，该重置也可能重新创建 secret 存储，使新的备份密钥在重启后能正确加载。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 含义：备份存在，但此设备尚未足够信任交叉签名链。
- 处理方式：设置 `MATRIX_RECOVERY_KEY` 并运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Matrix recovery key is required`

- 含义：你在需要恢复密钥的情况下尝试了恢复步骤，但没有提供恢复密钥。
- 处理方式：使用 `--recovery-key-stdin` 重新运行命令，例如 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 含义：提供的密钥无法解析，或不符合预期格式。
- 处理方式：使用你的 Matrix 客户端或 recovery-key 文件中的确切恢复密钥重试。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 含义：OpenClaw 可以应用恢复密钥，但 Matrix 仍未为此设备建立完整的交叉签名身份信任。检查命令输出中的 `Recovery key accepted`、`Backup usable`、`Cross-signing verified` 和 `Device verified by owner`。
- 处理方式：运行 `openclaw matrix verify self`，在另一个 Matrix 客户端中接受请求，比对 SAS，并且仅在匹配时输入 `yes`。该命令会等待完整的 Matrix 身份信任建立后再报告成功。仅当你有意替换当前交叉签名身份时，才使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`。

`Matrix key backup is not active on this device after loading from secret storage.`

- 含义：secret 存储没有在此设备上生成活跃的备份会话。
- 处理方式：先验证设备，然后使用 `openclaw matrix verify backup status` 重新检查。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 含义：在完成设备验证之前，此设备无法从 secret 存储恢复。
- 处理方式：先运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

### 自定义插件安装消息

`Matrix is installed from a custom path that no longer exists: ...`

- 含义：你的插件安装记录指向一个已经不存在的本地路径。
- 处理方式：使用 `openclaw plugins install @openclaw/matrix` 重新安装；如果你从 repo checkout 运行，则使用 `openclaw plugins install ./path/to/local/matrix-plugin`。

## 如果加密历史仍未恢复

按顺序运行这些检查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

如果备份成功恢复，但某些旧房间仍缺少历史，这些缺失的密钥可能从未被之前的插件备份。

## 如果你想为未来消息重新开始

如果你接受丢失无法恢复的旧加密历史，并且只想为后续内容建立干净的备份基线，请按顺序运行这些命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果之后设备仍未验证，请从你的 Matrix 客户端完成验证：比对 SAS emoji 或十进制代码，并确认它们匹配。

## 相关内容

- [Matrix](/zh-CN/channels/matrix)：频道设置和配置。
- [Matrix push rules](/zh-CN/channels/matrix-push-rules)：通知路由。
- [Doctor](/zh-CN/gateway/doctor)：健康检查和自动迁移触发器。
- [迁移指南](/zh-CN/install/migrating)：所有迁移路径（机器迁移、跨系统导入）。
- [插件](/zh-CN/tools/plugin)：插件安装和注册。
